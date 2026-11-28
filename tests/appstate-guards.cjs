'use strict';
/* Ataques diretos ao servidor (sem passar pelo ecrã): o servidor tem de recusar ou neutralizar. */
const assert=require('assert'),St=require('../lib/app-state-service'),fake=require('./appstate-fake-db.cjs');
let n=0;const pass=l=>{n++;console.log('PASS',l)};
const P=(id,role,extra={})=>({id,name:id,role,clinics:['a'],active:true,email:id+'@x.invalid',...extra});
const ceo=P('ceo','CEO'),adm=P('adm','ADMINISTRATIVA'),adm2=P('adm2','ADMINISTRATIVA'),tec=P('tec','TECNICO/A'),boss=P('boss','ADMINISTRAÇÃO');
const db=fake({clinics:[{id:'a',name:'A',active:true}],people:[ceo,adm,adm2,tec,boss]});
const actor=p=>({...p,permissions:{}});
const read=async p=>St.read(db.s,actor(p),0);
const write=async(p,key,value,sub)=>{const r=await read(p),k=sub?key+'/'+sub:key;return St.write(db.s,actor(p),{changes:[{key,sub,value,rev:r.revisions[k]??0}]})};
(async()=>{
 /* Chat */
 const conv=[{id:'dm1',kind:'direct',members:['ceo','boss'],messages:[{id:'m1',from:'ceo',text:'Salários de dezembro',at:'2026-11-25T10:00:00Z',readBy:['ceo']}]},{id:'g1',kind:'group',members:['ceo','adm','tec'],messages:[{id:'m2',from:'ceo',text:'Bom dia',at:'2026-11-25T09:00:00Z',readBy:[]}]}];
 assert.equal((await write(ceo,'conversations',conv)).denied.length,0);
 const seen=(await read(tec)).state.conversations;assert.deepEqual(seen.map(c=>c.id),['g1'],'technician only sees conversations he belongs to');pass('private conversations are not readable by other users');
 let w=await write(tec,'conversations',[{...conv[1],messages:[...conv[1].messages,{id:'x1',from:'ceo',text:'Aumento para todos',at:'2026-11-25T11:00:00Z'}]}]);assert.ok(w.denied.length,'forged sender refused');
 w=await write(tec,'conversations',[{...conv[1],messages:[{...conv[1].messages[0],text:'alterado'}]}]);assert.ok(w.denied.length,'editing others refused');
 w=await write(tec,'conversations',[{...conv[1],messages:[]}]);assert.ok(w.denied.length,'deleting others refused');
 w=await write(tec,'conversations',[{...conv[1],members:['ceo','adm','tec','boss']}]);assert.ok(w.denied.length,'changing members refused');
 w=await write(tec,'conversations',[{...conv[1],messages:[{...conv[1].messages[0],readBy:['tec']},{id:'t1',from:'tec',text:'Bom dia!',at:'2026-11-25T09:05:00Z'}]}]);assert.equal(w.denied.length,0,'normal use (read + own message) still works');
 const all=(await read(ceo)).state.conversations;assert.equal(all.length,2,'conversation the technician cannot see was kept');assert.equal(all.find(c=>c.id==='dm1').messages[0].text,'Salários de dezembro');
 pass('chat: no forged/edited/deleted messages of others, no member changes; normal use works; hidden conversations kept');
 /* Auditoria */
 await write(ceo,'audit',[{at:'1',by:'ceo',action:'Login'},{at:'0',by:'ceo',action:'Alteração salarial'}]);
 w=await write(adm,'audit',[{at:'2',by:'adm',action:'Abertura'}]);assert.equal(w.denied.length,0);
 const audit=(await read(ceo)).state.audit;assert.equal(audit.length,3,'old entries kept when someone writes a shorter list');assert.ok(audit.some(x=>x.action==='Alteração salarial'));
 w=await St.write(db.s,actor(adm),{changes:[{key:'audit',deleted:true}]});assert.ok(w.denied.length);pass('audit is append-only: cannot be erased or rewritten');
 /* Ponto e férias */
 await write(ceo,'timeEntries',[{id:'e1',user:'adm2',type:'Entrada',at:'2026-11-25T09:00:00Z'}]);
 w=await write(adm,'timeEntries',[{id:'e1',user:'adm2',type:'Entrada',at:'2026-11-25T08:00:00Z'}]);assert.ok(w.denied.length,'cannot change a colleague clock-in');
 w=await write(adm,'timeEntries',[]);assert.ok(w.denied.length,'cannot delete a colleague clock-in');
 w=await write(adm,'timeEntries',[{id:'e1',user:'adm2',type:'Entrada',at:'2026-11-25T09:00:00Z'},{id:'e2',user:'adm',type:'Entrada',at:'2026-11-25T09:01:00Z'}]);assert.equal(w.denied.length,0,'own clock-in accepted');
 w=await write(adm,'timeEntries',[{id:'e1',user:'adm2',type:'Entrada',at:'2026-11-25T09:00:00Z'},{id:'e2',user:'adm',type:'Entrada',at:'2026-11-25T09:01:00Z'},{id:'e3',user:'adm2',type:'Saída',at:'2026-11-25T18:00:00Z'}]);assert.ok(w.denied.length,'cannot clock for a colleague');
 await write(adm,'leave',[{id:'l1',employeeId:'adm',type:'Férias',status:'Pendente'}]);
 w=await write(adm,'leave',[{id:'l1',employeeId:'adm',type:'Férias',status:'Aprovada'}]);assert.ok(w.denied.length,'cannot approve own leave');
 w=await write(boss,'leave',[{id:'l1',employeeId:'adm',type:'Férias',status:'Aprovada'}]);assert.equal(w.denied.length,0,'Administração approves');
 pass('clock-ins and leave: only own records; approvals only by management');
 /* Dias */
 const day={date:'2026-11-24',clinic:'a',open:{saved:true,professionals:[{rowId:'d1',kind:'doctor',openingBooked:10,currentBooked:10,openingLocked:true}]},cash:{status:'A aguardar validação',totalCents:100},history:[{action:'Abertura'}]};
 await write(adm,'days',day,'2026-11-24_a');
 w=await write(adm,'days',{...day,cash:{...day.cash,status:'Validada'}},'2026-11-24_a');assert.ok(w.denied.length,'administrativa cannot validate cash');
 w=await write(adm,'days',{...day,open:{saved:true,professionals:[{...day.open.professionals[0],openingBooked:12,currentBooked:12}]}},'2026-11-24_a');assert.ok(w.denied.length,'cannot change locked opening');
 w=await write(adm,'days',{...day,history:[]},'2026-11-24_a');assert.ok(w.denied.length,'cannot erase day history');
 w=await write(adm,'days',{...day,history:[...day.history,{action:'Período'}]},'2026-11-24_a');assert.equal(w.denied.length,0,'normal day update works');
 w=await write(boss,'days',{...day,history:[...day.history,{action:'Período'}],cash:{...day.cash,status:'Validada'}},'2026-11-24_a');assert.equal(w.denied.length,0,'Administração validates');
 pass('days: cash validation, locked opening and history protected on the server');
 /* Finanças antigas: cada um vê só os seus movimentos; só a gestão financeira altera */
 await write(ceo,'finance',{movements:[{id:'f1',employeeId:'tec',amount:10},{id:'f2',employeeId:'adm2',amount:999}]});
 const fin=(await read(tec)).state.finance;assert.deepEqual(fin.movements.map(x=>x.id),['f1']);
 w=await write(tec,'finance',{movements:[{id:'f1',employeeId:'tec',amount:1000}]});assert.ok(w.denied.length);pass('finance: own movements only, write only by finance management');
 console.log(JSON.stringify({passed:n}))})().catch(e=>{console.error('FAIL',e);process.exit(1)});
