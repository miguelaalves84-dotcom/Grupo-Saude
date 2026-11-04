'use strict';
/* Actual disposable database experiment; NEVER reads an application DATABASE_URL. */
const assert=require('node:assert/strict'),{randomBytes}=require('node:crypto'),{execFileSync}=require('node:child_process'),fs=require('node:fs'),P=require('../lib/p0-test-environment.cjs');
if(process.env.CI!=='true'||process.env.PGHOST!=='127.0.0.1'||process.env.PGDATABASE!=='gs_v4_synthetic'||!/^[a-f0-9]{12,64}$/.test(process.env.GS_POSTGRES_SERVICE_ID||''))throw Error('P0_DISPOSABLE_SERVICE_REQUIRED');
(async()=>{
 const {Pool}=require('pg'),admin=new Pool({host:'127.0.0.1',port:Number(process.env.PGPORT||5432),database:'gs_v4_synthetic',user:'gs_synthetic',password:process.env.PGPASSWORD,connectionTimeoutMillis:5000});
 const pools=[],clients=[];let passed=0,source,c,clone,cc;
 const env={CI:'true',GS_P0_ENVIRONMENT:'isolated-test',GS_P0_DISPOSABLE:'true'};
 const pw=()=>randomBytes(24).toString('hex');
 async function prepare(database,owner,runtime,targetId){
  // All names are fixed below; credentials generated in memory, never logged or uploaded.
  const a=pw(),b=pw();for(const [name,password] of [[owner,a],[runtime,b]])await admin.query(`create role ${name} login password '${password}' nosuperuser nocreatedb nocreaterole noreplication nobypassrls`);
  await admin.query(`create database ${database} owner ${owner}`);
  const url=(user,password)=>`postgresql://${user}:${password}@127.0.0.1:${process.env.PGPORT||5432}/${database}`;
  const cfg=P.config({...env,GS_P0_TARGET_ID:targetId,GS_P0_MIGRATION_DATABASE_URL:url(owner,a),GS_P0_RUNTIME_DATABASE_URL:url(runtime,b)});
  const pool=new Pool(P.connection(cfg.migration,true));pools.push(pool);const db=await pool.connect();clients.push(db);return[db,cfg];
 }
 const tool=async(action,target,input)=>execFileSync('docker',['exec',...(action==='restore'?['-i']:[]),process.env.GS_POSTGRES_SERVICE_ID,action==='dump'?'pg_dump':'pg_restore','-U',target.user,...(action==='dump'?['-Fc','--no-owner','--no-privileges',target.database]:['--single-transaction','--no-owner','--no-privileges','--exit-on-error','-d',target.database])],{input,timeout:30000,maxBuffer:64000000,stdio:['pipe','pipe','pipe']});
 const key=randomBytes(32);
 try{
 [source,c]=await prepare('gs_v4_p0_synthetic','gs_p0_owner','gs_p0_runtime','00000000-0000-4000-8000-000000000001');
 await P.bootstrap(source,c);assert((await P.bootstrap(source,c)).existing);passed++;
 await assert.rejects(()=>P.marker(source,{...c,targetId:'00000000-0000-4000-8000-000000000099'}),/MARKER/);passed++;
 await admin.query('grant pg_read_all_data to gs_p0_runtime');await assert.rejects(()=>P.marker(source,c),/MEMBERSHIP/);await admin.query('revoke pg_read_all_data from gs_p0_runtime');passed++;
 const initial=await P.backup(source,c,key,tool);assert(!initial.bytes.includes(Buffer.from('CREATE TABLE')));assert(P.unseal(initial.bytes,key).raw.length>0);passed++;
 const decoded=P.unseal(initial.bytes,key),badDate=P.seal(decoded.raw,key,{...decoded.meta,createdAt:'invalid'});await assert.rejects(()=>P.apply(source,c,badDate,key),/VALID_RECENT_BACKUP/);passed++;
 // Inject a genuine SQL failure halfway through a clean migration: all DDL and ledger roll back.
 const originalQuery=source.query.bind(source);let injected=false;
 source.query=async(q,args)=>{if(!injected&&typeof q==='string'&&q.includes('CREATE TABLE IF NOT EXISTS finance_payment_mail')){injected=true;return originalQuery('select 1/0')}return originalQuery(q,args)};
 await assert.rejects(()=>P.apply(source,c,initial.bytes,key),e=>e.code==='22012');source.query=originalQuery;
 assert.equal((await source.query("select to_regclass('public.clinics') name")).rows[0].name,null);assert.equal((await source.query("select to_regclass('public.gs_p0_migrations') name")).rows[0].name,null);passed++;
 const applied=await P.apply(source,c,initial.bytes,key);assert.equal(applied.applied,11);assert.equal((await P.verify(source,c)).migrations,11);passed++;
 await P.permissions(source,c);const current=await P.backup(source,c,key,tool),repeat=await P.apply(source,c,current.bytes,key);assert.equal(repeat.applied,0);passed++;
 // Existing business readiness contract is preserved, rather than a parallel GPS ledger.
 const {repository}=require('../lib/postgres-repository.cjs');await require('../lib/schema-version-service.js').assertGps(repository({query:source.query}));passed++;
 const runtimePool=new Pool(P.connection(c.runtime,true));pools.push(runtimePool);const rt=await runtimePool.connect();clients.push(rt);
 assert.equal((await rt.query('select dataset_scope from gs_p0_test_environment')).rows[0].dataset_scope,'synthetic-only');
 for(const sql of ['create table forbidden(id int)',"insert into clinics(id,name) values('forbidden','SYN')",'select * from employees','update gs_p0_test_environment set auth_enabled=true','select * from gs_p0_migrations','set role gs_p0_owner'])await assert.rejects(()=>rt.query(sql),e=>e.code==='42501');passed++;
 await source.query("insert into audit_log(module,action) values('p0-test','SYNTHETIC SEQUENCE CHECK')");
 await source.query("insert into clinics(id,name) values('p0-synthetic-clinic','SYNTHETIC ONLY')");
 const b=await P.backup(source,c,key,tool);await source.query("update clinics set name='SYNTHETIC CHANGED'");await assert.rejects(()=>P.apply(source,c,b.bytes,key),/SOURCE_CHANGED/);passed++;
 const finalBackup=await P.backup(source,c,key,tool),before=await P.fingerprint(source);
 [clone,cc]=await prepare('gs_v4_p0_restore_synthetic','gs_p0_restore_owner','gs_p0_restore_runtime','00000000-0000-4000-8000-000000000002');await P.bootstrap(clone,cc);
 await assert.rejects(()=>P.restore(source,c,finalBackup.bytes,key,tool,c),/DISTINCT_RESTORE/);passed++;
 await assert.rejects(()=>P.restore(clone,cc,finalBackup.bytes,randomBytes(32),tool,c),/INTEGRITY/);passed++;
 const restored=await P.restore(clone,cc,finalBackup.bytes,key,tool,c);assert(restored.restored);assert.equal((await clone.query('select name from clinics')).rows[0].name,'SYNTHETIC CHANGED');assert.deepEqual(await P.fingerprint(source),before);passed++;
 const restoredId=(await clone.query("insert into audit_log(module,action) values('p0-test','SYNTHETIC RESTORE CHECK') returning id")).rows[0].id;assert(Number(restoredId)>1);passed++;
 await assert.rejects(()=>P.restore(clone,cc,finalBackup.bytes,key,tool,c),/EMPTY_MARKED_CLONE/);passed++;
 const afterRestore=await P.verify(clone,cc);assert.equal(afterRestore.auth,false);assert.equal(afterRestore.email,false);assert.equal(afterRestore.archive,false);passed++;
 await source.query("update gs_p0_migrations set sha256=repeat('0',64) where ordinal=0");const driftBackup=await P.backup(source,c,key,tool);await assert.rejects(()=>P.apply(source,c,driftBackup.bytes,key),/LEDGER_DRIFT/);await source.query('update gs_p0_migrations set sha256=$1 where ordinal=0',[P.loadPlan()[0].sha256]);assert.equal((await P.verify(source,c)).migrations,11);passed++;
 // Independent connections can read marker; neither has an authorized business writer.
 const cloneRuntime=new Pool(P.connection(cc.runtime,true));pools.push(cloneRuntime);await assert.rejects(()=>cloneRuntime.query('select * from clinics'),e=>e.code==='42501');passed++;
 const result={passed,migrations:11,actualPostgres:true,initialEncryptedBackupVerified:true,restoredDistinctClone:true,sourceUnchangedAfterRestore:true,runtimeBusinessWriters:false,authActivated:false,emailActivated:false,privateArchiveActivated:false,scope:'Disposable PostgreSQL: migration transaction/rollback/replay/checksums, isolated roles, content fingerprint, encrypted pg_dump/pg_restore and independent restore database. No Neon resource or production connection.'};
 fs.mkdirSync('/tmp/gs-security-artifacts',{recursive:true});fs.writeFileSync('/tmp/gs-security-artifacts/p0-environment-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{for(const x of clients)x.release();for(const x of pools)await x.end();await admin.end()}
})().catch(e=>{console.error('P0_POSTGRES_EXPERIMENT_FAILED '+(/^[A-Z0-9_]+$/.test(e.code||'')?e.code:'DETAILS_WITHHELD'));process.exitCode=1});
