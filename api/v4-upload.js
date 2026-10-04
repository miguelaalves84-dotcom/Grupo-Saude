const { put }=require('@vercel/blob');
const { neon }=require('@neondatabase/serverless');
module.exports=async function(req,res){
 if(req.method!=='POST')return res.status(405).json({ok:false,code:'METHOD_NOT_ALLOWED'});
 if(!process.env.DATABASE_URL)return res.status(503).json({ok:false,code:'DATABASE_NOT_CONFIGURED'});
 const sub=String(req.headers['x-neon-auth-sub']||'');if(!sub)return res.status(401).json({ok:false,code:'AUTH_REQUIRED'});
 const sql=neon(process.env.DATABASE_URL);const u=await sql.query("select id,role,active from users where auth_subject=$1",[sub]);const me=u[0];if(!me?.active)return res.status(401).json({ok:false,code:'AUTH_REQUIRED'});
 const kind=String(req.headers['x-document-kind']||'Documento').slice(0,80),name=decodeURIComponent(String(req.headers['x-file-name']||'documento.bin')).replace(/[^a-zA-Z0-9._ -]/g,'_'),mime=String(req.headers['content-type']||'application/octet-stream');
 const allowed=['application/pdf','image/jpeg','image/png','image/webp'];if(!allowed.includes(mime))return res.status(415).json({ok:false,code:'FILE_TYPE_NOT_ALLOWED'});
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>10*1024*1024)return res.status(413).json({ok:false,code:'FILE_TOO_LARGE'});chunks.push(chunk)}if(!size)return res.status(400).json({ok:false,code:'EMPTY_FILE'});
 const path='rh/'+me.id+'/'+Date.now()+'-'+name;const blob=await put(path,Buffer.concat(chunks),{access:'private',addRandomSuffix:true,contentType:mime,storeId:'store_GYyF5IpPjWna8kdj'});
 const rows=await sql.query("insert into documents(kind,filename,storage_key,mime_type,status,data) values($1,$2,$3,$4,'Recebido',$5::jsonb) returning id,kind,filename,mime_type,status,received_at",[kind,name,blob.pathname,mime,JSON.stringify({ownerUserId:me.id,private:true})]);await sql.query("insert into audit_log(actor_id,module,action,entity_type,entity_id,detail) values($1,'Documentos','UPLOAD_PRIVADO','document',$2,$3::jsonb)",[me.id,String(rows[0].id),JSON.stringify({kind,name,size})]);return res.status(201).json({ok:true,item:rows[0]});
};
