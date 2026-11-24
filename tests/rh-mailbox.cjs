'use strict';
/* Caixa de recrutamento (gruposaude.rh): email com CV → candidato «por validar» com ficheiro à parte; agradecimento uma só vez;
   entrevista e recusa enviadas da fila do funil uma só vez; reenvio do mesmo CV não duplica; sem configuração não faz nada. */
const assert=require('assert'),St=require('../lib/app-state-service'),M=require('../lib/rh-mailbox-service'),fake=require('./appstate-fake-db.cjs');
const env={GS_RH_MAIL_ENABLED:'true',GS_RH_MAIL_USER:'rh.syn@example.invalid',GS_RH_MAIL_APP_PASSWORD:'abcd efgh ijkl mnop'};
const pdf=Buffer.from('%PDF-1.4\nSYN CV\n%%EOF');
const msg=(uid,from,name,file='CV.pdf',data=pdf)=>({uid,messageId:'<m'+uid+'@x>',from:`"${name}" <${from}>`,fromAddress:from,fromName:name,subject:'Candidatura fisioterapeuta',text:'Olá, envio o meu CV. Telefone 912 345 678',date:'2026-11-24T10:00:00Z',attachments:[{filename:file,mime:'application/pdf',size:data.length,data}]});
(async()=>{let n=0;const pass=l=>{n++;console.log('PASS',l)};
 const db=fake({clinics:[{id:'lagoa',name:'Clínica Particular de Lagoa',active:true}],people:[{id:'u-ceo',name:'CEO',role:'CEO',clinics:['lagoa'],active:true,email:'ceo@x.invalid'}]});
 const ceo={id:'u-ceo',name:'CEO',role:'CEO',active:true,permissions:{}};
 assert.equal((await M.run(db.s,{})).status,'Desligado');assert.equal((await M.run(db.s,{GS_RH_MAIL_ENABLED:'true'})).status,'Não configurado');
 assert.equal((await M.run(db.s,{...env,VERCEL_ENV:'production'})).status,'Desligado');pass('off unless enabled and configured; never in production');
 assert.deepEqual(M.status(env),{address:'rh.syn@example.invalid',configured:true,enabled:true});assert.ok(!JSON.stringify(M.status(env)).includes('abcd'));pass('status never exposes the password');
 let inbox=[msg(11,'ana.silva@example.invalid','Ana Silva'),{...msg(12,'publicidade@example.invalid','Loja'),attachments:[]}],sent=[];
 const seen=[];const deps={fetch:async last=>(seen.push(last),{messages:inbox.filter(m=>m.uid>last),maxUid:Math.max(last,...inbox.map(m=>m.uid))}),send:async m=>{sent.push(m);return{id:'smtp-'+sent.length}},now:()=>'2026-11-24T10:05:00.000Z'};
 let r=await M.run(db.s,env,deps);assert.equal(r.created,1);assert.equal(r.skipped.length,1,'email without CV ignored');
 let st=(await St.read(db.s,ceo,0)).state,c=st.candidates[0];
 assert.equal(c.stage,'Candidatos');assert.equal(c.needsReview,true);assert.equal(c.email,'ana.silva@example.invalid');assert.equal(c.name,'Ana Silva');assert.equal(c.phone,'912 345 678');
 assert.equal(c.documents.length,1);assert.ok(c.documents[0].fileRef&&!c.documents[0].dataUrl,'only a reference in shared data');pass('CV email creates a candidate «por validar» with name, email and phone');
 const file=await M.readFile(db.s,ceo,c.documents[0].fileRef);assert.equal(file.data.toString(),pdf.toString());assert.equal(file.mime,'application/pdf');
 await assert.rejects(()=>M.readFile(db.s,{id:'t',role:'TECNICO/A',active:true,permissions:{}},c.documents[0].fileRef));pass('CV file stored apart; only HR managers can open it');
 assert.equal(sent.length,1);assert.equal(sent[0].to,'ana.silva@example.invalid');assert.match(sent[0].subject,/recebemos a sua candidatura/);assert.match(sent[0].text,/Olá Ana/);assert.ok(c.thanksSentAt);pass('thank-you email sent to the candidate');
 assert.equal(seen[0],null,'first connection is flagged so old emails are not read');r=await M.run(db.s,env,deps);assert.equal(sent.length,1,'no second thank-you');assert.equal(typeof seen[1],'number');assert.equal(r.received,0,'mailbox read from the last message onwards');pass('nothing repeated on the next run');
 inbox.push(msg(13,'ana.silva@example.invalid','Ana Silva','CV.pdf',pdf),msg(14,'ana.silva@example.invalid','Ana Silva','Certificado.pdf',Buffer.from('%PDF-1.4 cert')));r=await M.run(db.s,env,deps);
 st=(await St.read(db.s,ceo,0)).state;assert.equal(st.candidates.length,1,'same person, same file');assert.equal(st.candidates[0].documents.length,2,'new document joined to the existing candidate');assert.equal(sent.length,1,'still one thank-you');pass('same candidate again: no duplicate, new document joined, no new thank-you');
 /* entrevista marcada e recusa confirmada (como o funil as deixa em fila) */
 const cands=st.candidates.map(x=>({...x}));cands[0].interview={at:'2026-11-28T10:30',mode:'presencial',clinic:'lagoa',address:'Rua da Liberdade nr. 38, 8400-369 Lagoa',notes:''};cands[0].notifications=[...cands[0].notifications,{kind:'interview',key:cands[0].id+':interview:1',recipient:cands[0].email,payload:{name:cands[0].name,interview:cands[0].interview},status:'PendingConfig'}];
 const w=await St.write(db.s,ceo,{changes:[{key:'candidates',value:cands,rev:(await St.read(db.s,ceo,0)).revisions.candidates}]});assert.equal(w.conflicts.length,0);
 await M.run(db.s,env,deps);assert.equal(sent.length,2);assert.match(sent[1].subject,/entrevista marcada/);assert.match(sent[1].text,/Data: 28\/11\/2026/);assert.match(sent[1].text,/Hora: 10:30/);assert.match(sent[1].text,/Clínica Particular de Lagoa — Rua da Liberdade/);pass('interview email: date, time, clinic and address');
 await M.run(db.s,env,deps);assert.equal(sent.length,2);pass('interview email sent only once');
 st=(await St.read(db.s,ceo,0)).state;const c2=st.candidates.map(x=>({...x}));c2[0].notifications=[...c2[0].notifications,{kind:'rejection',key:c2[0].id+':rejection',recipient:c2[0].email,payload:{name:c2[0].name},status:'PendingConfig'}];
 await St.write(db.s,ceo,{changes:[{key:'candidates',value:c2,rev:(await St.read(db.s,ceo,0)).revisions.candidates}]});await M.run(db.s,env,deps);
 assert.equal(sent.length,3);assert.match(sent[2].text,/Agradecemos o seu interesse/);pass('rejection thank-you email after confirmation');
 /* remarcação feita no funil (avisos sem chave, como o núcleo os cria): o novo aviso também segue, uma vez */
 st=(await St.read(db.s,ceo,0)).state;const c3=st.candidates.map(x=>({...x}));c3[0].interview={...c3[0].interview,at:'2026-11-29T15:00'};c3[0].notifications=[...c3[0].notifications,{kind:'interview',recipient:c3[0].email,payload:{name:c3[0].name,interview:c3[0].interview},status:'PendingConfig',createdAt:'2026-11-24T11:00:00.000Z'}];
 await St.write(db.s,ceo,{changes:[{key:'candidates',value:c3,rev:(await St.read(db.s,ceo,0)).revisions.candidates}]});await M.run(db.s,env,deps);await M.run(db.s,env,deps);
 assert.equal(sent.length,4);assert.match(sent[3].text,/Data: 29\/11\/2026/);assert.match(sent[3].text,/Hora: 15:00/);pass('rescheduled interview sends a new email once');
 /* falha do servidor de email: fica «Falhou», sem duplicar quando volta */
 inbox.push(msg(20,'rui@example.invalid','Rui Costa'));let fail=true;const deps2={...deps,send:async m=>{if(fail)throw Error('SMTP indisponível');return deps.send(m)}};
 r=await M.run(db.s,env,deps2);assert.equal(r.failed.length,1);st=(await St.read(db.s,ceo,0)).state;assert.equal(st.candidates.find(x=>x.email==='rui@example.invalid').notifications.find(x=>x.kind==='received').status,'Failed');assert.equal(st.rhMail.log[0].status,'Falhou');assert.match(st.rhMail.log[0].error,/SMTP indisponível/);pass('send failure recorded in history, not hidden');
 /* modelos editáveis */
 const tpl=JSON.parse(JSON.stringify(st.rhMail));tpl.templates={received:{subject:'Obrigado, {nome}!',text:'Recebido, {nome}.'}};await St.write(db.s,ceo,{changes:[{key:'rhMail',value:tpl,rev:(await St.read(db.s,ceo,0)).revisions.rhMail}]});
 inbox.push(msg(21,'eva@example.invalid','Eva Dias'));await M.run(db.s,env,deps);assert.equal(sent.at(-1).subject,'Obrigado, Eva!');pass('editable templates used');
 console.log(JSON.stringify({passed:n}))})().catch(e=>{console.error('FAIL',e);process.exit(1)});
