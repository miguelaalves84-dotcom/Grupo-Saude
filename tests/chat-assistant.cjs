'use strict';
/* Assistente do chat: uma mensagem por tarefa obrigatória por dia, para as administrativas de serviço; «Realizada»
   aparece para todas quando uma conclui; atraso > 1 h depois da hora-limite chega à Administração e ao CEO. */
const assert=require('assert'),A=require('../chat-assistant-v4'),D=require('../operation-core-v4');
let n=0;const pass=l=>{n++;console.log('PASS',l)};
const base=()=>({clinics:[{id:'a',name:'Clínica A',active:true},{id:'b',name:'Clínica B',active:true}],tasks:JSON.parse(JSON.stringify(D.defaultTasks)),days:{},
 users:[{id:'adm1',name:'Ana',role:'ADMINISTRATIVA',clinics:['a'],active:true},{id:'adm2',name:'Bia',role:'ADMINISTRATIVA',clinics:['a'],active:true},{id:'adm3',name:'Carla',role:'ADMINISTRATIVA',clinics:['b'],active:true},{id:'ceo',name:'CEO',role:'CEO',active:true},{id:'adm-x',name:'Dora',role:'ADMINISTRAÇÃO',clinics:['a'],active:true},{id:'tec',name:'Téc',role:'TECNICO/A',clinics:['a'],active:true}]});
const at=(d,h)=>`${d}T${h}:00Z`;// novembro: Lisboa = UTC
let s=base();
let m=A.messages(s,'adm1',at('2026-11-24','08:00'));
assert.ok(m.length>0&&m.every(x=>x.clinicId==='a'&&x.status==='todo'),'administrativa gets the required tasks of her clinic');
assert.ok(m.every(x=>x.kind==='task'));assert.equal(new Set(m.map(x=>x.id)).size,m.length,'one message per task per day');
const req=D.configuredTasks(s,'a',undefined,{date:'2026-11-24',clinic:'a',open:{saved:false,professionals:[]},close:{},taskStatus:{}}).filter(t=>t.required).length;assert.equal(m.length,req);pass('one message per required task per day, only for her clinic');
assert.equal(A.messages(s,'tec',at('2026-11-24','08:00')).length,0);pass('technicians get nothing');
assert.equal(A.messages(s,'ceo',at('2026-11-24','08:00')).length,0);pass('CEO gets nothing while nothing is late');
assert.equal(A.messages(s,'adm1',at('2026-11-22','08:00')).length,0);pass('no roster and weekend: no alerts');
/* alguém conclui → «Realizada» para todas */
const t=m.find(x=>x.taskId==='open_team');s.days['2026-11-24_a']={date:'2026-11-24',clinic:'a',open:{saved:false,professionals:[]},close:{saved:false,professionals:[]},taskStatus:{open_team:{status:'done',at:'2026-11-24T09:05:00Z',by:'adm2'}},history:[],pendingRows:[],indicators:{}};
const forA=A.messages(s,'adm1',at('2026-11-24','09:10')).find(x=>x.taskId==='open_team'),forB=A.messages(s,'adm2',at('2026-11-24','09:10')).find(x=>x.taskId==='open_team');
assert.equal(forA.status,'done');assert.equal(forA.doneBy,'adm2');assert.equal(forB.status,'done');assert.equal(forA.id,t.id,'same message, now realizada');pass('task done by one administrativa shows «Realizada por» for every administrativa of the clinic');
/* escala: quem está de folga não recebe */
const R=require('../administrative-rosters-core-v4'),orig=R.effective;R.effective=(st,p,cid,d)=>String(p.id)==='adm2'?{off:true}:{off:false};
assert.ok(A.messages(s,'adm1',at('2026-11-24','09:10')).length>0);assert.equal(A.messages(s,'adm2',at('2026-11-24','09:10')).length,0);pass('only administrativas on duty today receive alerts');R.effective=orig;
/* atraso > 1 h depois da hora-limite → Administração e CEO */
const late=A.messages(s,'adm1',at('2026-11-24','10:31')).filter(x=>x.status==='todo'&&x.deadline==='09:30');assert.ok(late.length&&late.every(x=>x.overdue&&x.escalate));
const ceo=A.messages(s,'ceo',at('2026-11-24','10:31'));assert.ok(ceo.length&&ceo.every(x=>x.kind==='escalation'&&x.status==='todo'));assert.ok(!ceo.some(x=>x.taskId==='open_team'&&x.clinicId==='a'),'done tasks never escalate');assert.ok(ceo.some(x=>x.clinicId==='b'),'CEO sees every clinic');
assert.equal(A.messages(s,'ceo',at('2026-11-24','10:29')).filter(x=>x.deadline==='09:30').length,0,'not before one hour');
assert.ok(A.messages(s,'adm-x',at('2026-11-24','10:31')).every(x=>x.clinicId==='a'),'Administração only for her clinics');pass('more than 1 hour late reaches Administração and CEO');
console.log(JSON.stringify({passed:n}));
