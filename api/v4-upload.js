'use strict';
const Auth=require('../lib/authorization-service'),Storage=require('../lib/document-storage-service'),{randomUUID}=require('node:crypto');
function detectedMime(buf){if(buf.subarray(0,5).toString()==='%PDF-')return'application/pdf';if(buf.length>=3&&buf[0]===255&&buf[1]===216&&buf[2]===255)return'image/jpeg';if(buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return'image/png';if(buf.subarray(0,4).toString()==='RIFF'&&buf.subarray(8,12).toString()==='WEBP')return'image/webp';return null;}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST')return res.status(405).json({ok:false,code:'METHOD_NOT_ALLOWED'});
 try{
  const {s,actor:a}=await Auth.context(req),employeeId=String(req.headers['x-employee-id']||'').trim(),candidateId=String(req.headers['x-candidate-id']||'').trim();
  if(!!employeeId===!!candidateId)Auth.deny('ONE_DOCUMENT_OWNER_REQUIRED',400);
  let owner=null;
  if(employeeId){owner=(await s.people()).find(p=>String(p.employeeId)===employeeId);Auth.person(a,owner,'hrManage',String(owner?.id)===String(a.id)?'read':'create');}
  else{if(!Auth.manager(a,'hrManage'))Auth.deny();const row=(await s.query('select id,clinic_id from candidates where id=$1',[candidateId]))[0];if(!row)Auth.deny('OWNER_NOT_FOUND',404);if(row.clinic_id)Auth.clinic(a,row.clinic_id);else if(a.role!=='CEO')Auth.deny('UNSCOPED_CANDIDATE');}
  const kind=String(req.headers['x-document-kind']||'Documento').slice(0,80);
  if(/fatura|recibo/i.test(kind))Auth.deny('USE_FINANCIAL_VALIDATION_WORKFLOW',409);
  const description=decodeURIComponent(String(req.headers['x-document-description']||'')).trim().slice(0,300),name=decodeURIComponent(String(req.headers['x-file-name']||'documento')).replace(/[^a-zA-Z0-9._ -]/g,'_').slice(0,150),mime=String(req.headers['content-type']||'').split(';')[0];
  if(!description)Auth.deny('DESCRIPTION_REQUIRED',400);
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>10*1024*1024)Auth.deny('FILE_TOO_LARGE',413);chunks.push(chunk);}
  const bytes=Buffer.concat(chunks);if(!size||detectedMime(bytes)!==mime)Auth.deny('FILE_SIGNATURE_MISMATCH',415);
  const hash=Storage.sha(bytes),id=randomUUID(),key='rh/'+(employeeId||candidateId)+'/'+hash;
  const duplicate=await s.query("select id from documents where (employee_id=$1 or candidate_id=$2) and data->>'contentHash'=$3",[employeeId||null,candidateId||null,hash]);if(duplicate.length)Auth.deny('DUPLICATE_DOCUMENT',409);
  // Scanner, verified independent private backup and deployment security approval are enforced here.
  await s.storage.put(key,bytes,mime);
  const data={ownerUserId:owner?.id||null,private:true,description,contentHash:hash,uploadedBy:a.id},at=new Date().toISOString();
  const results=await s.db.batch([
   {sql:'select pg_advisory_xact_lock(hashtext($1))',params:[key]},
   {sql:"insert into documents(id,employee_id,candidate_id,kind,filename,storage_key,mime_type,status,data,received_at) select $1,$2,$3,$4,$5,$6,$7,'Pendente',$8,$9 where not exists(select 1 from documents where (employee_id=$2 or candidate_id=$3) and data->>'contentHash'=$10) returning id,kind,filename,status,received_at",params:[id,employeeId||null,candidateId||null,kind,name,key,mime,JSON.stringify(data),at,hash]},
   s.event('document',id,a,'UPLOAD_PRIVADO_PENDENTE',null,{hash,employeeId,candidateId},'exists(select 1 from documents where id=$1)',[id])
  ]);
  if(!results[1].length)Auth.deny('DUPLICATE_DOCUMENT',409);
  return res.status(201).json({ok:true,item:results[1][0]});
 }catch(e){return Auth.error(res,e)}
};
module.exports.config={api:{bodyParser:false}};
module.exports.detectedMime=detectedMime;
