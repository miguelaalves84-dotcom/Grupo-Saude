const { neon }=require('@neondatabase/serverless');
module.exports=async function(req,res){if(require('../lib/development-mode').locked(process.env))return res.status(503).json({ok:false,code:'P0_PREVIEW_BACKEND_LOCKED'});
 if(req.method!=='GET')return res.status(405).json({ok:false});
 if(!process.env.CRON_SECRET||req.headers.authorization!=='Bearer '+process.env.CRON_SECRET)return res.status(401).json({ok:false});
 if(!process.env.DATABASE_URL)return res.status(503).json({ok:false,code:'DATABASE_NOT_CONFIGURED'});
 const sql=neon(process.env.DATABASE_URL);
 const due=await sql.query("select * from alerts where status='Pendente' and next_reminder_at<=now()");
 const setting=await sql.query("select value from app_settings where key='alert_email'");
 const configured=setting[0]?.value?.enabled?setting[0].value.email:null;
 let queued=0,escalated=0;
 for(const a of due){
  const recipients=new Set();if(configured)recipients.add(configured);
  const admins=await sql.query("select distinct u.email from users u left join user_clinics uc on uc.user_id=u.id where u.active=true and u.email is not null and (u.role='CEO' or (u.role='Administração' and ($1::text is null or uc.clinic_id=$1)))",[a.clinic_id||null]);
  admins.forEach(x=>x.email&&recipients.add(x.email));
  for(const email of recipients){const r=await sql.query("insert into notification_deliveries(alert_id,channel,recipient,status,attempts,last_attempt_at) values($1,'email',$2,'Pendente',0,null) on conflict(alert_id,channel,recipient) do update set status=case when notification_deliveries.status='Entregue' then 'Entregue' else 'Pendente' end returning id",[a.id,email]);if(r.length)queued++}
  const age=Date.now()-new Date(a.created_at).getTime();if(age>=4*3600000&&!a.escalated_at){await sql.query("update alerts set escalated_at=now(),severity='critical',next_reminder_at=now()+interval '1 hour',updated_at=now() where id=$1",[a.id]);escalated++}else await sql.query("update alerts set next_reminder_at=now()+interval '1 hour',updated_at=now() where id=$1",[a.id]);
 }
 return res.status(200).json({ok:true,due:due.length,queued,escalated});
};