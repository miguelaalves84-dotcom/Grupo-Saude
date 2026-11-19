'use strict';
/* Avisos por email às horas-limite da Operação (faltas até às 14h/20h, seguros, fecho do dia).
   1) gera/atualiza alertas a partir dos dias das clínicas guardados no servidor;
   2) a fila existente (notification_deliveries) recebe os destinatários: CEO e Administração da clínica;
   3) envia os pendentes pela função «Notificações» de Tabelas → Lista de Emails (Gmail ligado ou Resend).
   Nunca inclui dados de utentes no email: só a clínica, a tarefa e o prazo. */
const D=require('../operation-core-v4');
const parse=v=>typeof v==='string'?JSON.parse(v):v||{},day=v=>v instanceof Date?v.toISOString().slice(0,10):String(v).slice(0,10);
const ENTITY='operation_deadline';
function addDays(date,n){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
async function clinicState(q,clinic,date){const rows=await q('select work_date,status,data from clinic_days where clinic_id=$1 and work_date between $2 and $3 order by work_date',[clinic.id,addDays(date,-10),date]);
 const days={};for(const r of rows){const d=parse(r.data),dt=day(r.work_date);days[dt+'_'+clinic.id]={...d,clinic:clinic.id,date:dt,closed:d.closed??/fechad/i.test(String(r.status||''))}}
 const c=parse(clinic.data);return{clinics:[{id:clinic.id,name:clinic.name,active:true,operational:true,workingDays:c.workingDays||[1,2,3,4,5]}],days,cash:[],requests:[]}}
async function generate(q,at){const date=D.today(at),clinics=await q('select * from clinics where active=true order by id',[]);let created=0,resolved=0;
 for(const clinic of clinics){let pending=[];try{pending=D.deadlineAlerts(await clinicState(q,clinic,date),clinic.id,date,at)}catch{continue}
  const ids=new Set(pending.map(p=>clinic.id+':'+date+':'+p.key));
  for(const p of pending){const id=clinic.id+':'+date+':'+p.key,exists=await q("select id from alerts where entity_type=$1 and entity_id=$2",[ENTITY,id]);if(exists.length)continue;
   await q("insert into alerts(user_id,clinic_id,module,title,detail,status,severity,entity_type,entity_id,next_reminder_at) values(null,$1,'Operação',$2,$3,'Pendente','warning',$4,$5,now())",[clinic.id,p.title,'Prazo: '+p.due+' · '+(clinic.name||clinic.id),ENTITY,id]);created++}
  const open=await q("select id,entity_id from alerts where entity_type=$1 and status='Pendente' and clinic_id=$2",[ENTITY,clinic.id]);
  for(const a of open)if(String(a.entity_id).includes(':'+date+':')&&!ids.has(a.entity_id)&&D.lisbonHour(at)>=13){await q("update alerts set status='Resolvido',updated_at=now() where id=$1",[a.id]);resolved++}}
 return{created,resolved}}
function message(a){return{subject:'Grupo Saúde — '+a.title,text:`${a.title}\n${a.detail||''}\n\nAbra a Operação diária da clínica para concluir a tarefa.\nEste aviso não contém dados de utentes.`}}
async function deliver(q,env,request=fetch,s){const rows=await q("select d.id,d.recipient,a.title,a.detail from notification_deliveries d join alerts a on a.id=d.alert_id where d.status='Pendente' and a.entity_type=$1 order by d.id limit 50",[ENTITY]);if(!rows.length)return{sent:0,pending:0};
 const cfg=(await require('./email-settings-service').configuration(s)).find(x=>x.id==='tasks');const gmail=cfg?.active&&cfg.provider==='gmail',resend=cfg?.active&&cfg.provider==='resend'&&env.GS_PAYMENT_EMAIL_API_KEY;
 if(!gmail&&!resend){await q("update notification_deliveries set error='NOTIFICATIONS_PROVIDER_NOT_CONFIGURED' where status='Pendente' and alert_id in (select id from alerts where entity_type=$1)",[ENTITY]);return{sent:0,pending:rows.length,error:'NOTIFICATIONS_PROVIDER_NOT_CONFIGURED'}}
 let sent=0;for(const r of rows){const m=message(r);let ok=false,code='DELIVERY_UNKNOWN';try{if(gmail){const x=await require('./gmail-oauth-service').send(s,cfg,env,require('./gmail-message').message({from:cfg.address,to:r.recipient,subject:m.subject,text:m.text,reference:'gs-op-'+r.id}),request);ok=!!x.id}else{const x=await request('https://api.resend.com/emails',{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{authorization:'Bearer '+env.GS_PAYMENT_EMAIL_API_KEY,'content-type':'application/json','Idempotency-Key':'gs-op-'+r.id},body:JSON.stringify({from:cfg.address,to:[r.recipient],subject:m.subject,text:m.text})});ok=x.ok;if(!ok)code='PROVIDER_REJECTED_'+x.status}}catch{}
  await q("update notification_deliveries set status=$1,attempts=attempts+1,last_attempt_at=now(),delivered_at=case when $1='Entregue' then now() else delivered_at end,error=$2 where id=$3",[ok?'Entregue':'Falhou',ok?null:code,r.id]);if(ok)sent++}
 return{sent,pending:rows.length-sent}}
module.exports={generate,deliver,message,clinicState,ENTITY};
