'use strict';
/* Explicit isolated-development migration entrypoint. No default DATABASE_URL fallback. */
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
async function transaction(sql,version,source){
 if(version!=='v4-p0-gps-001')throw Error('Unknown controlled migration');
 const checksum=createHash('sha256').update(source).digest('hex');
 // Serializable transaction: lock, ledger, DDL and ledger entry commit or roll back together.
 return sql.transaction([
  sql.query('select pg_advisory_xact_lock(72198413)'),
  sql.query('create table if not exists gs_schema_migrations(version text primary key,checksum text not null,applied_at timestamptz not null default now())'),
  sql.query(`do $migration$ begin
   if exists(select 1 from gs_schema_migrations where version='${version}' and checksum<>'${checksum}') then
    raise exception 'MIGRATION_CHECKSUM_MISMATCH';
   end if;
   if not exists(select 1 from gs_schema_migrations where version='${version}') then
    ${source}
    insert into gs_schema_migrations(version,checksum) values('${version}','${checksum}');
   end if;
  end $migration$;`)
 ],{isolationLevel:'Serializable'});
}
async function migrate(sql,version,source){
 for(let attempt=0;attempt<3;attempt++){try{return await transaction(sql,version,source)}catch(e){if(!['40001','40P01'].includes(e.code)||attempt===2)throw e;}}
}
async function main(){
 const e=process.env;
 if(!process.argv.includes('--environment=development')||e.GS_MIGRATION_ENVIRONMENT!=='development'||e.VERCEL_ENV==='production'||!e.GS_MIGRATION_DATABASE_URL||e.GS_MIGRATION_DATABASE_URL===e.DATABASE_URL||e.GS_MIGRATION_DATABASE_URL===e.GS_FINANCE_DATABASE_URL&&e.GS_FINANCE_ENVIRONMENT!=='preview')throw Error('An isolated development database and explicit authorization are required.');
 const sql=require('@neondatabase/serverless').neon(e.GS_MIGRATION_DATABASE_URL),version='v4-p0-gps-001';
 await migrate(sql,version,fs.readFileSync(path.join(__dirname,'../db/migrations/'+version+'.sql'),'utf8'));
 console.log('Development GPS migration verified. No production fallback.');
}
if(require.main===module)main().catch(()=>{console.error('Migration failed; transaction rolled back.');process.exitCode=1});
module.exports={migrate};
