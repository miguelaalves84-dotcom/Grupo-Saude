const { del }=require('@vercel/blob');
const { neon }=require('@neondatabase/serverless');

async function actor(req,sql){
 const base=process.env.DATABASE_NEON_AUTH_BASE_URL,cookie=req.headers.cookie||'';
 if(!base||!cookie)return null;
 const r=await fetch(base.replace(/\/$/,'')+'/get-session',{headers:{cookie,accept:'application/json'}});
 if(!r.ok)return null;
 const j=await r.json();if(!j?.user?.id)return null;
 const rows=await sql.query("select id,role,active from users where auth_subject=$1",[String(j.user.id)]);
 return rows[0]?.active?rows[0]:null;
}

module.exports=async function(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({ok:false,code:'METHOD_NOT_ALLOWED'});
 if(!process.env.DATABASE_URL)return res.status(503).json({ok:false,code:'DATABASE_NOT_CONFIGURED'});
 const sql=neon(process.env.DATABASE_URL),me=await actor(req,sql);
 if(!me||!['Administração','CEO'].includes(me.role))return res.status(403).json({ok:false,code:'FORBIDDEN'});
 const eligible=await sql.query("select id,kind,filename,storage_key,retention_until,employee_id from documents where retention_until is not null and retention_until<current_date and status not in ('Eliminado por retenção','Superseded') order by retention_until asc limit 250");
 if(req.method==='GET')return res.status(200).json({ok:true,dryRun:true,count:eligible.length,items:eligible.map(x=>({id:x.id,kind:x.kind,filename:x.filename,retentionUntil:x.retention_until,employeeId:x.employee_id}))});
 const results=[];
 for(const d of eligible){
  try{
   if(d.storage_key)await del(d.storage_key,{storeId:'store_GYyF5IpPjWna8kdj'});
   await sql.query("update documents set storage_key='',filename='Documento eliminado por retenção',mime_type=null,status='Eliminado por retenção',data=jsonb_set(coalesce(data,'{}'::jsonb),'{retentionDeletedAt}',to_jsonb(now()::text),true) where id=$1",[d.id]);
   await sql.query("insert into audit_log(actor_id,module,action,entity_type,entity_id,detail) values($1,'RGPD','ELIMINAR_DOCUMENTO_RETENCAO','document',$2,$3::jsonb)",[me.id,String(d.id),JSON.stringify({kind:d.kind,retentionUntil:d.retention_until})]);
   results.push({id:d.id,ok:true});
  }catch(e){results.push({id:d.id,ok:false,error:String(e.message||e).slice(0,200)})}
 }
 return res.status(200).json({ok:true,processed:results.length,succeeded:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length,results});
};
