'use strict';
/* P0.1 tooling only. Never imported by an API or browser. No production fallback. */
const fs=require('node:fs'),path=require('node:path'),{createHash,randomBytes,createCipheriv,createDecipheriv}=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),PLAN=path.join(ROOT,'db/plans/p0-test-environment.json');
const fail=code=>Object.assign(Error(code),{code});
const hash=b=>createHash('sha256').update(b).digest('hex');
function parseTarget(value){
 let u;try{u=new URL(value)}catch{throw fail('P0_TARGET_REQUIRED')}
 if(!['postgres:','postgresql:'].includes(u.protocol)||!u.username||!u.password||u.hash||u.searchParams.get('options'))throw fail('P0_TARGET_INVALID');
 const database=decodeURIComponent(u.pathname.slice(1)),user=decodeURIComponent(u.username);
 if(!/^[a-z][a-z0-9_]{1,62}$/.test(user)||!['gs_v4_test','gs_v4_test_restore','gs_v4_p0_synthetic','gs_v4_p0_restore_synthetic'].includes(database))throw fail('P0_DATABASE_NOT_ALLOWED');
 return{url:value,host:u.hostname,port:Number(u.port||5432),database,user,password:decodeURIComponent(u.password),sslmode:u.searchParams.get('sslmode')};
}
function config(env=process.env){
 if(env.VERCEL_ENV==='production'||env.NODE_ENV==='production'||env.GS_P0_ENVIRONMENT!=='isolated-test'||!/^[a-f0-9-]{36}$/.test(env.GS_P0_TARGET_ID||''))throw fail('P0_EXPLICIT_TEST_ENVIRONMENT_REQUIRED');
 const migration=parseTarget(env.GS_P0_MIGRATION_DATABASE_URL),runtime=parseTarget(env.GS_P0_RUNTIME_DATABASE_URL);
 if(migration.user===runtime.user||migration.password===runtime.password||migration.host!==runtime.host||migration.port!==runtime.port||migration.database!==runtime.database)throw fail('P0_DISTINCT_CREDENTIALS_SAME_DATABASE_REQUIRED');
 if(!Number.isInteger(migration.port)||migration.port<1||migration.port>65535)throw fail('P0_PORT_INVALID');
 const local=migration.host==='127.0.0.1';
 for(const t of [migration,runtime]){
  if(local){if(env.CI!=='true'||env.GS_P0_DISPOSABLE!=='true'||!/^gs_v4_p0_(synthetic|restore_synthetic)$/.test(t.database))throw fail('P0_DISPOSABLE_ONLY');}
  else if(env.GS_P0_REMOTE_APPROVED!=='true'||!/^ep-[a-z0-9-]+\.eu-[a-z]+-\d\.aws\.neon\.tech$/.test(t.host)||t.host!==env.GS_P0_ALLOWED_HOST||t.host.includes('-pooler')||t.port!==5432||!['gs_v4_test','gs_v4_test_restore'].includes(t.database)||t.sslmode!=='verify-full')throw fail('P0_REMOTE_TARGET_OR_TLS_NOT_VERIFIED');
 }
 for(const key of ['DATABASE_URL','GS_FINANCE_DATABASE_URL','GS_IDENTITY_DATABASE_URL','GS_PRODUCTION_DATABASE_URL']){
  if(!env[key])continue;let other;try{other=new URL(env[key])}catch{throw fail('P0_AMBIGUOUS_EXISTING_TARGET')}
  if(other.hostname===migration.host&&Number(other.port||5432)===migration.port&&decodeURIComponent(other.pathname.slice(1))===migration.database)throw fail('P0_EXISTING_APPLICATION_TARGET_FORBIDDEN');
 }
 return{migration,runtime,local,targetId:env.GS_P0_TARGET_ID};
}
function connection(t,local){return{host:t.host,port:t.port,database:t.database,user:t.user,password:t.password,ssl:local?false:{rejectUnauthorized:true},connectionTimeoutMillis:5000,query_timeout:30000,application_name:'gs-v4-p0-preparation',max:1}}
function loadPlan(){
 const plan=JSON.parse(fs.readFileSync(PLAN));if(plan.version!==1)throw fail('P0_PLAN_VERSION');
 const seen=new Set();return plan.migrations.map(m=>{
  if(seen.has(m.id)||!/^db\/(schema\.sql|migrations\/[a-z0-9-]+\.sql)$/.test(m.file))throw fail('P0_PLAN_INVALID');seen.add(m.id);
  const bytes=fs.readFileSync(path.join(ROOT,m.file));if(hash(bytes)!==m.sha256)throw fail('P0_PLAN_CHECKSUM_MISMATCH');
  let sql=bytes.toString('utf8');
  // Existing files own an outer BEGIN/COMMIT. Strip only these exact full lines;
  // the runner owns the transaction for ALL files and the ledger.
  sql=sql.replace(/^BEGIN;\s*$/gm,'').replace(/^COMMIT;\s*$/gm,'');
  if(/^\s*(?:BEGIN|COMMIT|ROLLBACK|START TRANSACTION)\b/im.test(sql))throw fail('P0_UNSUPPORTED_TRANSACTION_BOUNDARY');
  return{...m,sql};
 });
}
async function identity(db,c){
 await db.query("set time zone 'UTC'");
 const r=(await db.query('select current_database() db,current_user actor,pg_is_in_recovery() recovering')).rows[0];
 if(r.db!==c.migration.database||r.actor!==c.migration.user||r.recovering)throw fail('P0_SERVER_IDENTITY_MISMATCH');
 const role=(await db.query('select rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls,rolcanlogin from pg_roles where rolname=$1',[c.runtime.user])).rows[0];
 if(!role||role.rolsuper||role.rolcreatedb||role.rolcreaterole||role.rolreplication||role.rolbypassrls||!role.rolcanlogin)throw fail('P0_RUNTIME_ROLE_UNSAFE');
 const migrationRole=(await db.query('select rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls from pg_roles where rolname=$1',[c.migration.user])).rows[0];
 if(!migrationRole||Object.values(migrationRole).some(Boolean))throw fail('P0_MIGRATION_ROLE_EXCESSIVE');
 const owner=(await db.query('select pg_get_userbyid(datdba) owner from pg_database where datname=current_database()')).rows[0];
 if(owner.owner!==c.migration.user||owner.owner===c.runtime.user)throw fail('P0_MIGRATION_OWNER_REQUIRED');
 if((await db.query('select exists(select 1 from pg_auth_members m join pg_roles r on r.oid=m.member where r.rolname=any($1::text[])) member',[[c.runtime.user,c.migration.user]])).rows[0].member)throw fail('P0_ROLE_MEMBERSHIP_NOT_ALLOWED');
 if((await db.query('select pg_has_role($1,$2,\'MEMBER\') member',[c.runtime.user,c.migration.user])).rows[0].member)throw fail('P0_RUNTIME_INHERITS_OWNER');
}
async function marker(db,c){
 await identity(db,c);
 const rows=(await db.query('select target_id::text,environment,dataset_scope,auth_enabled,email_enabled,archive_enabled from gs_p0_test_environment where id=1')).rows;
 const m=rows[0];if(rows.length!==1||m.target_id!==c.targetId||m.environment!=='isolated-test'||m.dataset_scope!=='synthetic-only'||m.auth_enabled||m.email_enabled||m.archive_enabled)throw fail('P0_MARKER_MISMATCH');
}
async function bootstrap(db,c){
 await identity(db,c);await db.query('BEGIN');try{
 await db.query('select pg_advisory_xact_lock(72198414)');
 const exists=(await db.query("select to_regclass('public.gs_p0_test_environment') name")).rows[0].name;
 if(exists){await marker(db,c);await db.query('COMMIT');return{existing:true}}
 const tables=(await db.query("select count(*)::int n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p','v','m','S')")).rows[0].n;
 if(tables!==0)throw fail('P0_BOOTSTRAP_REQUIRES_EMPTY_DATABASE');
 await db.query(`create table gs_p0_test_environment(id smallint primary key check(id=1),target_id uuid not null unique,environment text not null check(environment='isolated-test'),dataset_scope text not null check(dataset_scope='synthetic-only'),auth_enabled boolean not null default false check(not auth_enabled),email_enabled boolean not null default false check(not email_enabled),archive_enabled boolean not null default false check(not archive_enabled),created_at timestamptz not null default now());`);
 await db.query("insert into gs_p0_test_environment(id,target_id,environment,dataset_scope) values(1,$1,'isolated-test','synthetic-only')",[c.targetId]);
 await db.query('COMMIT');return{existing:false};
 }catch(e){await db.query('ROLLBACK');throw e}
}
function seal(raw,key,meta){
 if(!Buffer.isBuffer(key)||key.length!==32)throw fail('P0_BACKUP_KEY_REQUIRED');
 const nonce=randomBytes(12),aad=Buffer.from(JSON.stringify(meta)),cipher=createCipheriv('aes-256-gcm',key,nonce);cipher.setAAD(aad);
 const data=Buffer.concat([cipher.update(raw),cipher.final()]);return Buffer.from(JSON.stringify({version:1,meta,nonce:nonce.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')}));
}
function unseal(bytes,key){
 try{const x=JSON.parse(bytes.toString());if(x.version!==1)throw Error();const d=createDecipheriv('aes-256-gcm',key,Buffer.from(x.nonce,'base64'));d.setAAD(Buffer.from(JSON.stringify(x.meta)));d.setAuthTag(Buffer.from(x.tag,'base64'));return{raw:Buffer.concat([d.update(Buffer.from(x.data,'base64')),d.final()]),meta:x.meta}}catch{throw fail('P0_BACKUP_INTEGRITY_FAILED')}
}
async function inventory(db){
 const tables=(await db.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows.map(x=>x.tablename),counts={};
 for(const name of tables){if(!/^[a-z_][a-z0-9_]*$/.test(name))throw fail('P0_UNEXPECTED_TABLE_NAME');counts[name]=(await db.query('select count(*)::text n from public."'+name+'"')).rows[0].n;}
 return counts;
}
async function fingerprint(db){
 const counts=await inventory(db),digest=createHash('sha256');
 for(const name of Object.keys(counts)){
  if(Number(counts[name])>50000)throw fail('P0_SYNTHETIC_SIZE_LIMIT');
  digest.update(name+'\n');
  const rows=(await db.query('select row_to_json(t)::text value from public."'+name+'" t order by row_to_json(t)::text')).rows;
  for(const row of rows)digest.update(row.value+'\n');
 }
 return{counts,rowsSha256:digest.digest('hex')};
}
async function backup(db,c,key,tool){
 await marker(db,c);
 // Exclusive on application tables: no concurrent writes between inventory and pg_dump.
 // All P0 tooling uses the same session-level lock (including backups).
 await db.query('select pg_advisory_lock(72198415)');
 try{await db.query('BEGIN');await db.query('set local lock_timeout=\'5s\'');
 const counts=await inventory(db);for(const name of Object.keys(counts))await db.query('LOCK TABLE public."'+name+'" IN SHARE MODE');
 const snapshot=await fingerprint(db),raw=await tool('dump',c.migration),meta={targetId:c.targetId,database:c.migration.database,createdAt:new Date().toISOString(),rawSha256:hash(raw),...snapshot,scope:'synthetic-only'};
 const bytes=seal(raw,key,meta);if(hash(unseal(bytes,key).raw)!==meta.rawSha256)throw fail('P0_BACKUP_ROUNDTRIP_FAILED');
 await db.query('COMMIT');return{bytes,meta,sha256:hash(bytes)};
 }catch(e){await db.query('ROLLBACK');throw e}finally{await db.query('select pg_advisory_unlock(72198415)')}
}
async function apply(db,c,receipt,key){
 const plan=loadPlan();await marker(db,c);const checked=unseal(receipt,key);
 if(!Number.isFinite(Date.parse(checked.meta.createdAt)))throw fail('P0_VALID_RECENT_BACKUP_REQUIRED');
 if(checked.meta.targetId!==c.targetId||checked.meta.database!==c.migration.database||checked.meta.scope!=='synthetic-only'||hash(checked.raw)!==checked.meta.rawSha256||Date.now()-Date.parse(checked.meta.createdAt)>3600000||Date.parse(checked.meta.createdAt)>Date.now())throw fail('P0_VALID_RECENT_BACKUP_REQUIRED');
 await db.query('select pg_advisory_lock(72198415)');await db.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
 try{
 await marker(db,c);await db.query('select pg_advisory_xact_lock(72198414)');
 // Source must still be at the backup state. Tool lock also prevents concurrent runners.
 const snapshot=await fingerprint(db);if(JSON.stringify(snapshot.counts)!==JSON.stringify(checked.meta.counts)||snapshot.rowsSha256!==checked.meta.rowsSha256)throw fail('P0_BACKUP_SOURCE_CHANGED');
 await db.query('create table if not exists gs_p0_migrations(id text primary key,ordinal integer not null unique,sha256 text not null,applied_at timestamptz not null default now(),applied_by text not null default current_user)');
 const ledger=(await db.query('select id,ordinal,sha256 from gs_p0_migrations order by ordinal')).rows;
 if(ledger.length>plan.length||ledger.some((r,i)=>r.id!==plan[i].id||r.ordinal!==i||r.sha256!==plan[i].sha256))throw fail('P0_LEDGER_DRIFT');
 let applied=0;for(let i=ledger.length;i<plan.length;i++){
 const m=plan[i];await db.query(m.sql);await db.query('insert into gs_p0_migrations(id,ordinal,sha256) values($1,$2,$3)',[m.id,i,m.sha256]);applied++;
 }
 // Preserve the GPS readiness contract used by the existing service.
 const gps=plan.find(m=>m.id==='v4-p0-gps-001');await db.query('create table if not exists gs_schema_migrations(version text primary key,checksum text not null,applied_at timestamptz not null default now())');
 const old=(await db.query('select checksum from gs_schema_migrations where version=$1',[gps.id])).rows[0];if(old&&old.checksum!==gps.sha256)throw fail('P0_GPS_LEDGER_DRIFT');
 await db.query('insert into gs_schema_migrations(version,checksum) values($1,$2) on conflict(version) do nothing',[gps.id,gps.sha256]);
 await db.query('COMMIT');return{applied,total:plan.length};
 }catch(e){await db.query('ROLLBACK');throw e}finally{await db.query('select pg_advisory_unlock(72198415)')}
}
function quoteRole(s){if(!/^[a-z][a-z0-9_]{1,62}$/.test(s))throw fail('P0_ROLE_INVALID');return'"'+s+'"'}
async function permissions(db,c){
 await marker(db,c);await db.query('BEGIN');try{
 const runtime=quoteRole(c.runtime.user),owner=quoteRole(c.migration.user);
 // Dedicated database only. Runtime stays dormant: NO table mutation privileges in P0.1.
 await db.query('revoke all on database '+quoteRole(c.migration.database)+' from public');
 await db.query('revoke all on schema public from public');await db.query('revoke all on all tables in schema public from public');await db.query('revoke all on all sequences in schema public from public');
 await db.query('revoke all on all functions in schema public from public');
 await db.query('revoke all on database '+quoteRole(c.migration.database)+' from '+runtime);await db.query('grant connect on database '+quoteRole(c.migration.database)+' to '+runtime);
 await db.query('revoke all on schema public from '+runtime);await db.query('grant usage on schema public to '+runtime);
 await db.query('revoke all on all tables in schema public from '+runtime);await db.query('revoke all on all sequences in schema public from '+runtime);await db.query('revoke all on all functions in schema public from '+runtime);
 await db.query('grant select on gs_p0_test_environment to '+runtime);
 for(const kind of ['tables','sequences','functions'])await db.query('alter default privileges for role '+owner+' in schema public revoke all on '+kind+' from public');
 await db.query('COMMIT');return{runtime:'connect + schema usage + read synthetic marker only',businessWriters:false};
 }catch(e){await db.query('ROLLBACK');throw e}
}
async function verify(db,c){
 await marker(db,c);const plan=loadPlan(),ledger=(await db.query('select id,ordinal,sha256 from gs_p0_migrations order by ordinal')).rows;
 if(ledger.length!==plan.length||ledger.some((r,i)=>r.id!==plan[i].id||r.ordinal!==i||r.sha256!==plan[i].sha256))throw fail('P0_LEDGER_DRIFT');
 const invalid=(await db.query("select count(*)::int n from pg_index i join pg_class t on t.oid=i.indrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' and not i.indisvalid")).rows[0].n;
 if(invalid)throw fail('P0_INVALID_INDEX');
 const counts=await inventory(db),required=plan.flatMap(m=>[...m.sql.matchAll(/create table if not exists ([a-z_][a-z0-9_]*)/gi)].map(x=>x[1].toLowerCase()));
 if(required.some(name=>!(name in counts)))throw fail('P0_SCHEMA_INCOMPLETE');
 const unvalidated=(await db.query("select count(*)::int n from pg_constraint c join pg_namespace n on n.oid=c.connamespace where n.nspname='public' and not c.convalidated")).rows[0].n;if(unvalidated)throw fail('P0_CONSTRAINT_NOT_VALIDATED');
 return{migrations:ledger.length,counts:await inventory(db),businessWriters:false,auth:false,email:false,archive:false};
}
async function restore(db,c,bytes,key,tool,source){
 if(!['gs_v4_test_restore','gs_v4_p0_restore_synthetic'].includes(c.migration.database)||c.targetId===source.targetId||c.migration.database===source.migration.database)throw fail('P0_DISTINCT_RESTORE_CLONE_REQUIRED');
 await marker(db,c);const backup=unseal(bytes,key);
 if(backup.meta.targetId!==source.targetId||backup.meta.database!==source.migration.database||backup.meta.scope!=='synthetic-only'||hash(backup.raw)!==backup.meta.rawSha256)throw fail('P0_BACKUP_SOURCE_MISMATCH');
 await db.query('select pg_advisory_lock(72198415)');try{
 const tables=Object.keys(await inventory(db));if(tables.length!==1||tables[0]!=='gs_p0_test_environment')throw fail('P0_RESTORE_REQUIRES_EMPTY_MARKED_CLONE');
 // Drop only the newly bootstrapped empty-clone marker, never any business table.
 await db.query('drop table gs_p0_test_environment');
 await tool('restore',c.migration,backup.raw);
 const snapshot=await fingerprint(db);if(JSON.stringify(snapshot.counts)!==JSON.stringify(backup.meta.counts)||snapshot.rowsSha256!==backup.meta.rowsSha256)throw fail('P0_RESTORE_COUNTS_MISMATCH');
 const m=(await db.query('select target_id::text from gs_p0_test_environment where id=1')).rows[0];if(m.target_id!==source.targetId)throw fail('P0_RESTORE_MARKER_MISMATCH');
 await db.query('update gs_p0_test_environment set target_id=$1 where id=1',[c.targetId]);
 await permissions(db,c);await verify(db,c);return{restored:true,scope:'distinct synthetic clone',countsMatched:true};
 }finally{await db.query('select pg_advisory_unlock(72198415)')}
}
module.exports={config,connection,loadPlan,identity,marker,bootstrap,seal,unseal,hash,inventory,fingerprint,backup,apply,permissions,verify,restore};
