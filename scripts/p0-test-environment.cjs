'use strict';
/* Offline operator entrypoint. No service is activated; credentials only from env. */
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),P=require('../lib/p0-test-environment.cjs');
function file(name){if(!name||!path.isAbsolute(name))throw Error('P0_ABSOLUTE_PRIVATE_PATH_REQUIRED');const parent=fs.statSync(path.dirname(name));if((parent.mode&0o077)!==0)throw Error('P0_PRIVATE_DIRECTORY_REQUIRED');return name}
function key(env){const f=file(env.GS_P0_BACKUP_KEY_FILE),s=fs.lstatSync(f);if(!s.isFile()||s.isSymbolicLink()||(s.mode&0o077)!==0)throw Error('P0_PRIVATE_KEY_FILE_REQUIRED');const k=fs.readFileSync(f);if(k.length!==32)throw Error('P0_KEY_MUST_BE_32_BYTES');return k}
function tool(action,t,input){
 // libpq transport: never put a URL or password in argv/logs; no inherited PG options.
 const env={PATH:process.env.PATH,HOME:process.env.HOME,PGHOST:t.host,PGPORT:String(t.port),PGDATABASE:t.database,PGUSER:t.user,PGPASSWORD:t.password,PGCONNECT_TIMEOUT:'5',PGSSLMODE:t.host==='127.0.0.1'?'disable':'verify-full'};
 if(process.env.GS_P0_CA_FILE)env.PGSSLROOTCERT=process.env.GS_P0_CA_FILE;
 const args=action==='dump'?['--format=custom','--no-owner','--no-privileges']:['--single-transaction','--no-owner','--no-privileges','--exit-on-error'];
 try{return execFileSync(action==='dump'?'pg_dump':'pg_restore',args,{env,input,timeout:60000,maxBuffer:64*1024*1024,stdio:['pipe','pipe','pipe']})}catch(e){
  // Ensaio sintético apenas: até 6 linhas de erro da ferramenta, sem host, utilizador nem palavra-passe.
  if(process.env.GS_P0_TOOL_DIAGNOSTICS==='synthetic-only'){const scrub=x=>[t.host,t.password,t.user].filter(Boolean).reduce((a,v)=>a.split(v).join('***'),x);console.log(JSON.stringify({toolError:action,status:e.status??null,signal:e.signal??null,lines:scrub(String(e.stderr||'')).split('\n').filter(l=>/error|ERROR|FATAL|DETAIL|HINT|Command was/.test(l)).slice(0,6).map(l=>l.slice(0,300))}))}
  throw Error('P0_DATABASE_TOOL_FAILED')}
}
async function main(){
 const action=process.argv[2];if(action==='plan'){console.log(JSON.stringify({migrations:P.loadPlan().map(({id,file,sha256})=>({id,file,sha256})),auth:false,email:false,archive:false},null,2));return}
 if(!['bootstrap','backup','migrate','permissions','verify','restore'].includes(action))throw Error('P0_ACTION_REQUIRED');
 const c=P.config(),{Pool}=require('pg'),pool=new Pool(P.connection(c.migration,c.local));const db=await pool.connect();
 try{let result;
 if(action==='bootstrap')result=await P.bootstrap(db,c);
 if(action==='backup'){const b=await P.backup(db,c,key(process.env),tool),dest=file(process.env.GS_P0_BACKUP_FILE);fs.writeFileSync(dest,b.bytes,{mode:0o600,flag:'wx'});result={backupWritten:true,sha256:b.sha256,scope:'synthetic-only'};}
 if(action==='migrate')result=await P.apply(db,c,fs.readFileSync(file(process.env.GS_P0_BACKUP_FILE)),key(process.env));
 if(action==='permissions')result=await P.permissions(db,c);
 if(action==='verify')result=await P.verify(db,c);
 if(action==='restore'){
  const source=P.config({...process.env,GS_P0_TARGET_ID:process.env.GS_P0_SOURCE_TARGET_ID,GS_P0_MIGRATION_DATABASE_URL:process.env.GS_P0_SOURCE_MIGRATION_DATABASE_URL,GS_P0_RUNTIME_DATABASE_URL:process.env.GS_P0_SOURCE_RUNTIME_DATABASE_URL});
  result=await P.restore(db,c,fs.readFileSync(file(process.env.GS_P0_BACKUP_FILE)),key(process.env),tool,source);
 }
 // Counts and hashes only. No identities, connection URLs, document contents or secrets.
 console.log(JSON.stringify({action,...result}));
 }finally{db.release();await pool.end()}
}
if(require.main===module)main().catch(e=>{console.error(/^P0_[A-Z0-9_]+$/.test(e.code||e.message)?e.code||e.message:'P0_OPERATION_FAILED_NO_DETAILS_LOGGED');process.exitCode=1});
module.exports={file,key,tool,main};
