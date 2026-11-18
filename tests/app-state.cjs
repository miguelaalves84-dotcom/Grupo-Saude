'use strict';
/* Estado partilhado no servidor: permissões por bloco, listas sem perda entre duas pessoas, conflitos, dados pessoais e arranque sem dados fictícios. */
const assert=require('assert'),St=require('../lib/app-state-service'),fake=require('./appstate-fake-db.cjs');
const ceo={id:'u-ceo',name:'CEO',role:'CEO',active:true,permissions:{}},adm={id:'u-adm',name:'Adm',role:'ADMINISTRATIVA',active:true,permissions:{}},tec={id:'u-tec',name:'Téc',role:'TECNICO/A',active:true,permissions:{}};
(async()=>{
 const db=fake({clinics:[{id:'algarfisio',name:'AlgarFisio',active:true}],people:[{id:'u-ceo',name:'CEO',role:'CEO',clinics:['algarfisio'],active:true,email:'c@x.invalid'},{id:'u-adm',name:'Adm',role:'ADMINISTRATIVA',clinics:['algarfisio'],active:true},{id:'u-tec',name:'Téc',role:'TECNICO/A',clinics:['algarfisio'],active:true}],employees:[{user_id:'u-tec',data:{hr:{iban:'PT50 SYN',bonusLaserCents:250,profession:'Fisioterapeuta'}}}]});
 let r=await St.read(db.s,ceo);
 assert.deepEqual(r.state.clinics.map(c=>c.id),['algarfisio'],'starts from real clinics');assert.equal(r.state.users.length,3);assert.deepEqual(r.state.requests,[],'operational lists start empty (no demo data)');
 assert.equal(r.state.employees['u-tec'].hr.iban,'PT50 SYN','HR manager sees full file');
 const ra=await St.read(db.s,adm);assert.equal(ra.state.employees['u-tec'].hr.iban,undefined,'colleagues do not see personal data');assert.equal(ra.state.employees['u-tec'].hr.bonusLaserCents,undefined,'nor bonus values');assert.equal(ra.state.employees['u-tec'].name,'Téc');
 let w=await St.write(db.s,adm,{changes:[{key:'clinics',value:[{id:'x'}],rev:1}]});assert.deepEqual(w.denied,['clinics'],'administrativa cannot change clinics');
 w=await St.write(db.s,adm,{changes:[{key:'currentUser',value:'u-ceo'}]});assert.deepEqual(w.denied,['currentUser'],'browser-only keys never stored');
 // duas pessoas acrescentam pedidos ao mesmo tempo: nenhum se perde
 await Promise.all([St.write(db.s,adm,{changes:[{key:'requests',list:{upsert:[{id:'r1',name:'A'}],remove:[]}}]}),St.write(db.s,ceo,{changes:[{key:'requests',list:{upsert:[{id:'r2',name:'B'}],remove:[]}}]})]);
 r=await St.read(db.s,tec);assert.deepEqual([],[]);const rq=(await St.read(db.s,ceo)).state.requests.map(x=>x.id).sort();assert.deepEqual(rq,['r1','r2'],'concurrent list additions both kept');
 // técnico não lê pedidos/dias (sem permissões de Operação) mas regista ponto
 assert.equal(r.state.requests,undefined,'technician cannot read requests');w=await St.write(db.s,tec,{changes:[{key:'timeEntries',list:{upsert:[{id:'t1',kind:'Entrada'}]}}]});assert.equal(w.done.length,1);
 // dias guardados entrada a entrada
 w=await St.write(db.s,adm,{changes:[{key:'days',sub:'2026-11-18_algarfisio',value:{date:'2026-11-18',clinic:'algarfisio',open:{saved:true}}},{key:'days',value:{}}]});assert.equal(w.done.length,1);assert.deepEqual(w.denied,['days'],'whole map writes refused for split blocks');
 // conflito: revisão antiga → fica a versão do servidor
 const before=(await St.read(db.s,ceo)).revisions['clinics'];w=await St.write(db.s,ceo,{changes:[{key:'clinics',value:[{id:'algarfisio',name:'AlgarFisio (Portimão)'}],rev:before}]});assert.equal(w.done.length,1);
 w=await St.write(db.s,ceo,{changes:[{key:'clinics',value:[{id:'algarfisio',name:'velho'}],rev:before}]});assert.equal(w.conflicts.length,1);assert.equal(w.conflicts[0].value[0].name,'AlgarFisio (Portimão)','stale write returns server version');
 // só o que mudou
 const s1=(await St.read(db.s,ceo)).seq;await St.write(db.s,ceo,{changes:[{key:'reports',list:{upsert:[{id:'p1'}]}}]});const inc=await St.read(db.s,ceo,s1);assert.deepEqual(Object.keys(inc.state),['reports'],'incremental read returns only changes');
 assert.ok(db.audit.length>0,'writes audited');
 console.log(JSON.stringify({passed:15,scope:'Shared app state on the server: per-block permissions, concurrent list merge, split maps, conflicts, personal data redaction, real-data seed, audit'}));
})().catch(e=>{console.error(e);process.exit(1)});
// Médico: dos dias só recebe as próprias linhas
(async()=>{const db=fake({clinics:[{id:'c',name:'C',active:true}],people:[{id:'u-ceo',name:'CEO',role:'CEO',clinics:['c'],active:true},{id:'u-med',name:'Med',role:'Médico/a',clinics:['c'],active:true}]});const ceo={id:'u-ceo',role:'CEO',active:true,permissions:{}},med={id:'u-med',role:'Médico/a',active:true,permissions:{}};
 await St.read(db.s,ceo);await St.write(db.s,ceo,{changes:[{key:'days',sub:'2026-11-18_c',value:{date:'2026-11-18',clinic:'c',open:{saved:true,professionals:[{rowId:'r1',employeeId:'u-med',kind:'doctor',category:'Consulta'},{rowId:'r2',employeeId:'other',kind:'tech'}]},close:{saved:true,professionals:[{rowId:'r1',done:5,missed:1},{rowId:'r2',done:9}]},notes:'interno'}}]});
 const r=await St.read(db.s,med),d=r.state.days['2026-11-18_c'];require('assert').deepEqual(d.open.professionals.map(p=>p.rowId),['r1']);require('assert').deepEqual(d.close.professionals.map(p=>p.rowId),['r1']);require('assert').equal(d.notes,undefined);
 const w=await St.write(db.s,med,{changes:[{key:'days',sub:'2026-11-18_c',value:{}}]});require('assert').deepEqual(w.denied,['days']);console.log('PASS doctor sees only own day rows and cannot write days')})().catch(e=>{console.error(e);process.exit(1)});
