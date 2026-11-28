'use strict';
/* Suporte: regras, avisos no sino e proteção no servidor. */
const assert=require('node:assert/strict'),C=require('../support-core-v4'),St=require('../lib/app-state-service'),fake=require('./appstate-fake-db.cjs'),Att=require('../attention-core-v4');let n=0;
const test=async(name,fn)=>{await fn();n++;console.log('PASS support: '+name)};
const tec={id:'tec',role:'TECNICO/A',active:true},med={id:'med',role:'MEDICO/A',active:true},ceo={id:'ceo',role:'CEO',active:true},boss={id:'boss',role:'ADMINISTRAÇÃO',active:true};
global.GSSupportCore=C;
(async()=>{
 await test('colaborador abre pedido; só vê os seus; gestão vê todos',()=>{const s={};C.create(s,tec,{category:'Horário',subject:'Troca sexta',message:'Posso trocar?'});C.create(s,med,{category:'Outro',subject:'X',message:'Y'});assert.equal(C.list(s,tec).length,1);assert.equal(C.list(s,ceo).length,2);assert.throws(()=>C.create(s,tec,{category:'Inventado',subject:'a',message:'b'}),/assunto/)});
 await test('resposta da gestão passa a «Em análise»; resposta do colaborador reabre um resolvido; só a gestão muda estado',()=>{const s={},t=C.create(s,tec,{category:'Picagens / ponto',subject:'Picagem',message:'Esqueci'});C.reply(s,boss,t.id,'Vamos ver');assert.equal(t.status,'Em análise');assert(C.unread(t,tec));assert.throws(()=>C.setStatus(s,tec,t.id,'Resolvido'),/CEO/);C.setStatus(s,ceo,t.id,'Resolvido');C.reply(s,tec,t.id,'Afinal falta');assert.equal(t.status,'Aberto');assert.throws(()=>C.reply(s,med,t.id,'intruso'),/autorizado/)});
 await test('sino: gestão avisada de pedidos abertos; colaborador avisado de respostas',()=>{const s={users:[{id:'tec',role:'TECNICO/A'},{id:'ceo',role:'CEO'}]},t=C.create(s,tec,{category:'Horário',subject:'Troca',message:'?'});const pol={active:true,can:()=>true,employee:()=>true,clinic:()=>true,clinics:()=>[],manager:()=>false,canEmployee:()=>true,canClinic:()=>true};s.currentUser='ceo';assert(Att.collect(s,pol).some(x=>x.kind==='support'&&/Suporte: Troca/.test(x.title)));C.reply(s,ceo,t.id,'Sim');s.currentUser='tec';assert(Att.collect(s,pol).some(x=>x.kind==='support'&&/Resposta do RH/.test(x.title)))});
 await test('servidor: cada um vê só os seus; não muda estado; não escreve em nome de outro; não apaga',async()=>{const P=(id,role)=>({id,name:id,role,clinics:['a'],active:true,email:id+'@x.invalid'}),people=[P('ceo','CEO'),P('tec','TECNICO/A'),P('med','MEDICO/A')],d=fake({clinics:[{id:'a',name:'A',active:true}],people}),act=p=>({...p,permissions:{}}),rev=async p=>(await St.read(d.s,act(p),0)).revisions.supportTickets??0,w=async(p,v)=>St.write(d.s,act(p),{changes:[{key:'supportTickets',value:v,rev:await rev(p)}]}),rd=async p=>(await St.read(d.s,act(p),0)).state.supportTickets||[];
  const s1={};const t=C.create(s1,{...tec,id:'tec'},{category:'Horário',subject:'A',message:'B'});assert.equal((await w(people[1],[t])).denied.length,0);
  const s2={};const o=C.create(s2,{...med,id:'med'},{category:'Outro',subject:'M',message:'N'});assert.equal((await w(people[2],[o])).denied.length,0);
  assert.deepEqual((await rd(people[1])).map(x=>x.id),[t.id]);assert.equal((await rd(people[0])).length,2);
  const mine=(await rd(people[1]))[0];assert.equal((await w(people[1],[{...mine,status:'Resolvido'}])).denied.length,1);
  assert.equal((await w(people[1],[{...mine,messages:[...mine.messages,{id:'x',from:'ceo',at:'2026-11-28',text:'falso'}]}])).denied.length,1);
  assert.equal((await w(people[1],[])).denied.length,1);
  assert.equal((await w(people[1],[{...mine,messages:[...mine.messages,{id:'y',from:'tec',at:'2026-11-28',text:'mais info'}]}])).denied.length,0)});
 console.log(JSON.stringify({passed:n}))})().catch(e=>{console.error(e);process.exit(1)});
