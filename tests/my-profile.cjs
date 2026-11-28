'use strict';
/* Perfil: pedidos de alteração (todos aprovados por CEO/Administração), validações e proteção no servidor. */
const assert=require('node:assert/strict'),G=require('../hr-growth-core-v4'),St=require('../lib/app-state-service'),fake=require('./appstate-fake-db.cjs');let n=0;
const test=async(name,fn)=>{await fn();n++;console.log('PASS profile: '+name)};
const base=()=>({users:[{id:'t1',name:'Técnico',role:'TECNICO/A',active:true,clinics:['a'],hr:{phone:'912345678'}},{id:'ceo',name:'CEO',role:'CEO',active:true,clinics:['a']}],employees:{},hrDataRequests:[]});
const tec={id:'t1',role:'TECNICO/A',active:true},ceo={id:'ceo',role:'CEO',active:true};
(async()=>{
 await test('validações: NIF com dígito de controlo, código postal, data de nascimento, CC, idiomas',()=>{const s=base();assert.throws(()=>G.requestData(s,tec,{changes:{nif:'123456780'}}),/NIF/);assert.throws(()=>G.requestData(s,tec,{changes:{postalCode:'1000'}}),/0000-000/);assert.throws(()=>G.requestData(s,tec,{changes:{birthDate:'2020-01-01'}}),/nascimento/);assert.throws(()=>G.requestData(s,tec,{changes:{cc:'12'}}),/Cidadão/);assert.throws(()=>G.requestData(s,tec,{changes:{languages:[{name:'Inglês',level:'Z9'}]}}),/idioma/)});
 await test('pedido completo fica pendente; só a gestão aprova; ao aprovar atualiza a ficha',()=>{const s=base();const x=G.requestData(s,tec,{changes:{nif:'123456789',postalCode:'8400-123',city:'Lagoa',emergencyName:'Ana',emergencyPhone:'913000000',languages:[{name:'Inglês',level:'B2'}],skills:'Massagem; Eletroterapia',education:[{course:'Fisioterapia',school:'ESS',year:'2015'}]}});assert.equal(x.status,'Pendente');assert.deepEqual(x.changes.skills,['Massagem','Eletroterapia']);assert.throws(()=>G.requestData(s,tec,{changes:{city:'Faro'}}),/pedido por decidir/);assert.throws(()=>G.decideData(s,tec,x.id,true),/CEO/);G.decideData(s,ceo,x.id,true);const h=s.users[0].hr;assert.equal(h.nif,'123456789');assert.equal(h.city,'Lagoa');assert.equal(h.languages[0].level,'B2');assert.equal(h.education[0].course,'Fisioterapia')});
 await test('CV: só PDF',()=>{const s=base();assert.throws(()=>G.requestData(s,tec,{changes:{cv:{name:'x.png',dataUrl:'data:image/png;base64,AAAA'}}}),/PDF/);assert.doesNotThrow(()=>G.requestData(s,tec,{changes:{cv:{name:'cv.pdf',dataUrl:'data:application/pdf;base64,JVBERg=='}}}))});
 await test('servidor: cada um vê só os seus pedidos; não aprova os seus; não mexe nos de outros',async()=>{const P=(id,role)=>({id,name:id,role,clinics:['a'],active:true,email:id+'@x.invalid'}),people=[P('ceo','CEO'),P('tec','TECNICO/A'),P('med','MEDICO/A')],d=fake({clinics:[{id:'a',name:'A',active:true}],people}),act=p=>({...p,permissions:{}}),rev=async(p)=>(await St.read(d.s,act(p),0)).revisions.hrDataRequests??0,w=async(p,v)=>St.write(d.s,act(p),{changes:[{key:'hrDataRequests',value:v,rev:await rev(p)}]});
  const mine={id:'r1',employeeId:'tec',changes:{iban:'PT50000201231234567890154'},status:'Pendente'},other={id:'r2',employeeId:'med',changes:{nif:'123456789'},status:'Pendente'};
  assert.equal((await w(people[1],[mine])).denied.length,0);assert.equal((await w(people[2],[other])).denied.length,0);
  const seenTec=(await St.read(d.s,act(people[1]),0)).state.hrDataRequests;assert.deepEqual(seenTec.map(x=>x.id),['r1']);
  assert.equal((await w(people[1],[{...mine,status:'Aprovado'}])).denied.length,1);
  assert.equal((await w(people[1],[mine,{...other,employeeId:'tec'}])).denied.length,1);
  const all=(await St.read(d.s,act(people[0]),0)).state.hrDataRequests;assert.deepEqual(all.map(x=>x.id).sort(),['r1','r2']);
  assert.equal((await w(people[0],all.map(x=>({...x,status:'Aprovado'})))).denied.length,0)});
 console.log(JSON.stringify({passed:n}))})().catch(e=>{console.error(e);process.exit(1)});
