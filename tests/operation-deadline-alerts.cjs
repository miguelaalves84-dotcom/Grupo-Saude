'use strict';
/* Avisos por email às horas-limite: geração, resolução e envio — base de dados simulada, sem dados de utentes. */
const assert=require('assert'),Ops=require('../lib/operation-deadline-alerts');
function fakeDb(days){const alerts=[],deliveries=[],settings={};let id=0;
 const q=async(t,p=[])=>{
  if(/from clinics where active/.test(t))return[{id:'pmo',name:'AlgarFisio',active:true,data:{workingDays:[1,2,3,4,5]}}];
  if(/from clinic_days/.test(t))return days.filter(d=>d.work_date>=p[1]&&d.work_date<=p[2]);
  if(/select id from alerts where entity_type/.test(t))return alerts.filter(a=>a.entity_type===p[0]&&a.entity_id===p[1]);
  if(/insert into alerts/.test(t)){alerts.push({id:'a'+(++id),clinic_id:p[0],title:p[1],detail:p[2],entity_type:p[3],entity_id:p[4],status:'Pendente'});return[]}
  if(/select id,entity_id from alerts/.test(t))return alerts.filter(a=>a.entity_type===p[0]&&a.status==='Pendente'&&a.clinic_id===p[1]);
  if(/update alerts set status='Resolvido'/.test(t)){alerts.find(a=>a.id===p[0]).status='Resolvido';return[]}
  if(/from notification_deliveries d join alerts/.test(t))return deliveries.filter(d=>d.status==='Pendente').map(d=>({...d,...alerts.find(a=>a.id===d.alert_id),id:d.id}));
  if(/update notification_deliveries set error=/.test(t)){deliveries.forEach(d=>{if(d.status==='Pendente')d.error=t.match(/'([A-Z_]+)'/)[1]});return[]}
  if(/update notification_deliveries set status/.test(t)){const d=deliveries.find(x=>x.id===p[2]);d.status=p[0];d.error=p[1];return[]}
  if(/from app_settings/.test(t))return settings.v?[{value:settings.v}]:[];
  throw Error('unexpected SQL '+t)};
 return{q,alerts,deliveries,settings}}
(async()=>{
 const day={work_date:'2026-11-17',status:'Aberta',data:{open:{saved:true},close:{},absenceShifts:{}}},db=fakeDb([day]);
 let r=await Ops.generate(db.q,'2026-11-17T13:20:00Z');assert.equal(r.created,1);assert.match(db.alerts[0].title,/turno anterior/);assert.match(db.alerts[0].detail,/14:00 · AlgarFisio/);
 r=await Ops.generate(db.q,'2026-11-17T13:40:00Z');assert.equal(r.created,0,'same alert never duplicated');
 day.data.absenceShifts={'2026-11-16_afternoon':{missed:0,contacted:0,called:0}};r=await Ops.generate(db.q,'2026-11-17T13:50:00Z');assert.equal(db.alerts[0].status,'Resolvido','alert resolved once the task is done');
 r=await Ops.generate(db.q,'2026-11-17T19:05:00Z');assert.deepEqual(db.alerts.filter(a=>a.status==='Pendente').map(a=>a.entity_id.split(':')[2]).sort(),['absence_today','close','insurance']);
 r=await Ops.generate(db.q,'2026-11-17T10:00:00Z');assert.equal(r.created,0,'no alerts outside the hour before each deadline');
 db.deliveries.push({id:'d1',alert_id:db.alerts[1].id,recipient:'ceo@example.invalid',status:'Pendente'});
 let m=await Ops.deliver(db.q,{},async()=>{throw Error('no network')},{query:db.q});assert.equal(m.error,'NOTIFICATIONS_PROVIDER_NOT_CONFIGURED');assert.equal(db.deliveries[0].status,'Pendente','kept for when email is connected');
 const msg=Ops.message(db.alerts[1]);assert.ok(!/utente\s*n\.?º|\d{9}/i.test(msg.text)&&/Operação diária/.test(msg.text),'email has no patient data');
 console.log(JSON.stringify({passed:8,scope:'Operation deadline email alerts: 14h/20h windows, no duplicates, auto-resolve, provider gate, no patient data'}));
})().catch(e=>{console.error(e);process.exit(1)});
