const { get }=require('@vercel/blob');
const { neon }=require('@neondatabase/serverless');
const { Readable }=require('node:stream');

async function session(req){
 const base=process.env.DATABASE_NEON_AUTH_BASE_URL,cookie=req.headers.cookie||'';
 if(!base||!cookie)return null;
 const r=await fetch(base.replace(/\/$/,'')+'/get-session',{headers:{cookie,accept:'application/json'}});
 if(!r.ok)return null;
 const j=await r.json();return j?.user||null;
}

module.exports=async function(req,res){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET')return res.status(405).json({ok:false,code:'METHOD_NOT_ALLOWED'});
 if(!process.env.DATABASE_URL)return res.status(503).json({ok:false,code:'DATABASE_NOT_CONFIGURED'});
 const user=await session(req);if(!user?.id)return res.status(401).json({ok:false,code:'AUTH_REQUIRED'});
 const sql=neon(process.env.DATABASE_URL);
 const rows=await sql.query("select id,role,active from users where auth_subject=$1",[String(user.id)]),me=rows[0];
 if(!me?.active)return res.status(403).json({ok:false,code:'FORBIDDEN'});
 if(!['Administração','CEO'].includes(me.role))return res.status(403).json({ok:false,code:'RH_DOCUMENT_FORBIDDEN'});
 const id=String(req.query?.id||'').trim();if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({ok:false,code:'INVALID_DOCUMENT_ID'});
 const docs=await sql.query("select id,filename,storage_key,mime_type,employee_id,candidate_id from documents where id=$1",[id]);
 const doc=docs[0];if(!doc)return res.status(404).json({ok:false,code:'DOCUMENT_NOT_FOUND'});
 const result=await get(doc.storage_key,{access:'private',storeId:'store_GYyF5IpPjWna8kdj',useCache:false});
 if(!result||result.statusCode!==200)return res.status(404).json({ok:false,code:'BLOB_NOT_FOUND'});
 await sql.query("insert into audit_log(actor_id,module,action,entity_type,entity_id,detail) values($1,'RH','CONSULTAR_DOCUMENTO','document',$2,$3::jsonb)",[me.id,id,JSON.stringify({employeeId:doc.employee_id,candidateId:doc.candidate_id})]);
 res.setHeader('Content-Type',doc.mime_type||result.blob?.contentType||'application/octet-stream');
 res.setHeader('Content-Disposition',`inline; filename*=UTF-8''${encodeURIComponent(doc.filename||'documento')}`);
 Readable.fromWeb(result.stream).pipe(res);
};
