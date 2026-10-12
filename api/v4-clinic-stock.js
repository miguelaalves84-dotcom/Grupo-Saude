'use strict';
const Auth=require('../lib/authorization-service'),Stock=require('../stock-core-v4'),{ClinicStockService}=require('../lib/clinic-stock-service');
function configured(env){return require('./v4-finance').configured(env)&&env.GS_MODULES_DATABASE_URL===env.GS_FINANCE_DATABASE_URL&&env.GS_MODULES_ENVIRONMENT==='isolated'&&env.GS_MODULES_DATA_SYNTHETIC==='true'&&env.VERCEL_ENV!=='production'&&!require('../lib/development-mode').locked(env)&&!!env.GS_MODULES_DATABASE_URL&&env.GS_MODULES_DATABASE_URL!==env.DATABASE_URL;}
function service(env){const finance=require('./v4-finance').service(env),{Pool}=require('@neondatabase/serverless'),pool=new Pool({connectionString:env.GS_MODULES_DATABASE_URL});const db={query:async(q,p=[])=>(await pool.query(q,p)).rows,transaction:async fn=>{const client=await pool.connect();try{await client.query('BEGIN');const result=await fn({query:async(q,p=[])=>(await client.query(q,p)).rows});await client.query('COMMIT');return result}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}}};return new ClinicStockService(db,finance.storage);}
async function handler(req,res,dependencies={}){
 const env=dependencies.env||process.env;res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(!configured(env))return res.status(503).json({code:'ISOLATED_MODULES_LOCKED',error:'Clínicas/Stock persistentes bloqueados fora do ambiente sintético autorizado.'});
 const action=req.query?.action||'clinics',reads=['clinics','stock','documents','file','stock-file','history'];if(!['GET','POST'].includes(req.method)||req.method==='GET'&&!reads.includes(action)||req.method==='POST'&&reads.includes(action))return res.status(405).json({code:'METHOD_NOT_ALLOWED'});
 if(req.method==='POST'&&((req.headers['content-type']||'').split(';')[0]!=='application/json'||Buffer.byteLength(JSON.stringify(req.body||{}))>7000000))return res.status(413).json({code:'INVALID_BODY'});
 try{const s=(dependencies.service||service)(env),context=await Auth.context(req,env,{service:dependencies.authService||require('./v4-finance').service,fetch:dependencies.fetch||fetch}),a=context.actor,b=req.method==='GET'?req.query:req.body||{};
  if(a.readOnly&&req.method!=='GET')Auth.deny('IMPERSONATION_READ_ONLY');
  if(action==='clinics')return res.status(200).json(await s.clinics(a));
  if(action==='stock')return res.status(200).json(await s.stock(a,String(b.clinicId||'')));
  if(action==='documents')return res.status(200).json(await s.documentList(a,String(b.clinicId||'')));
  if(action==='history')return res.status(200).json(await s.history(a,String(b.clinicId||'')));
  if(action==='file'||action==='stock-file'){const file=await s[action==='file'?'file':'stockFile'](a,String(b.id||''));res.setHeader('Content-Type',file.mime);res.setHeader('Content-Disposition','inline; filename="'+file.name.replace(/[^\x20-\x7e]|["\\]/g,'_')+'"');return res.status(200).end(file.bytes);}
  if(action==='clinic-save')return res.status(200).json(await s.clinicSave(a,b));
  if(action==='order-document-upload')return res.status(200).json(await s.uploadOrderFile(a,b));
  if(action==='document-upload')return res.status(200).json(await s.uploadDocument(a,b));
  if(action==='document-decide')return res.status(200).json(await s.decideDocument(a,b));
  if(Stock.permissions[action])return res.status(200).json(await s.stockWrite(a,action,b));
  return res.status(404).json({code:'UNKNOWN_ACTION'});
 }catch(e){return res.status(e.authStatus||e.status||(e.code==='23505'||e.code==='40001'?409:503)).json({code:e.code||'MODULE_OPERATION_FAILED',error:e.authStatus||e.moduleDomain?e.message:'Serviço isolado indisponível. Nenhuma operação confirmada.'});}
}
module.exports=handler;module.exports.createHandler=dependencies=>(req,res)=>handler(req,res,dependencies);module.exports.configured=configured;module.exports.service=service;
