'use strict';
/* Fase 2 — base de identidade de TESTES (projeto Neon «grupo-saude-v4-testes», UE), só contas sintéticas.
   Recebe a função de ligação por injeção (sessão supervisionada ou CI); nunca imprime palavras-passe, tokens ou ligações.
   1. Administrador: papéis gs_identity_migrator/gs_identity_runtime sem privilégios elevados; base gs_v4_identity_test
      com dono migrator; PUBLIC sem acesso; runtime só com CONNECT.
   2. Migrator: esquema V4 + finance 002–006 + security-p0-001 (marcador «synthetic-only») + tabelas Better Auth.
   3. Runtime: só DML nas tabelas, sequências e funções do esquema public.
   4. Seis contas sintéticas (@example.invalid), uma por perfil, e convites de uso único criados pelo CEO sintético. */
const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const DB='gs_v4_identity_test',MIGRATOR='gs_identity_migrator',RUNTIME='gs_identity_runtime';
const ident=s=>{if(!/^[a-z][a-z0-9_]{1,62}$/.test(s))throw Error('IDENTIFIER_INVALID');return'"'+s+'"'},lit=s=>"'"+String(s).replace(/'/g,"''")+"'";
const CLINICS=[['abranfir','SYN Abranfir'],['loures','SYN Loures'],['lagoa','SYN Lagoa']];
const PEOPLE=[['CEO','syn.ceo','SYN CEO',['abranfir','loures','lagoa']],['Administração','syn.administracao','SYN Administração',['abranfir','loures','lagoa']],['Administrativa','syn.administrativa','SYN Administrativa Abranfir',['abranfir']],['Médico/a','syn.medico','SYN Médico',['abranfir']],['Técnico/a','syn.tecnico','SYN Técnico',['abranfir']],['Call Center','syn.callcenter','SYN Call Center',['abranfir','loures','lagoa']]];

async function roles(owner,{migratorPassword,runtimePassword,ownerUser}){
 for(const [role,pw,extra] of [[MIGRATOR,migratorPassword,''],[RUNTIME,runtimePassword,' NOINHERIT']]){
  const exists=(await owner.query('select 1 from pg_roles where rolname=$1',[role])).rowCount===1;
  // A Neon só aceita palavra-passe em claro (verifica a entropia) e guarda-a como SCRAM; vai por TLS.
  await owner.query(`${exists?'ALTER':'CREATE'} ROLE ${ident(role)} WITH LOGIN NOCREATEDB NOCREATEROLE${exists?'':' NOSUPERUSER NOREPLICATION NOBYPASSRLS'}${extra} PASSWORD ${lit(pw)}`);
  const r=(await owner.query('select rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls from pg_roles where rolname=$1',[role])).rows[0];
  if(r.rolsuper||r.rolcreatedb||r.rolcreaterole||r.rolreplication||r.rolbypassrls)throw Error('ROLE_ATTRIBUTES_UNSAFE');
  if((await owner.query('select count(*)::int n from pg_auth_members m join pg_roles r on r.oid=m.member where r.rolname=$1',[role])).rows[0].n)throw Error('ROLE_MEMBERSHIP_NOT_ALLOWED');
 }
 await owner.query(`GRANT ${ident(MIGRATOR)} TO ${ident(ownerUser)} WITH SET TRUE, INHERIT FALSE`);
 if(!(await owner.query('select 1 from pg_database where datname=$1',[DB])).rowCount)await owner.query(`CREATE DATABASE ${ident(DB)} OWNER ${ident(MIGRATOR)}`);
 if((await owner.query('select pg_get_userbyid(datdba) o from pg_database where datname=$1',[DB])).rows[0].o!==MIGRATOR)throw Error('DATABASE_OWNER_UNEXPECTED');
 await owner.query(`SET ROLE ${ident(MIGRATOR)}`);try{await owner.query(`REVOKE ALL ON DATABASE ${ident(DB)} FROM PUBLIC`);await owner.query(`GRANT CONNECT ON DATABASE ${ident(DB)} TO ${ident(RUNTIME)}`)}finally{await owner.query('RESET ROLE')}
}

async function schema(migrator,root){
 const has=(await migrator.query("select to_regclass('public.gs_security_environment') t")).rows[0].t;
 if(!has){await migrator.query(fs.readFileSync(path.join(root,'db/schema.sql'),'utf8'));for(const n of ['finance-v4-002.sql','finance-v4-003.sql','finance-v4-004.sql','finance-v4-005.sql','finance-v4-006.sql','security-p0-001.sql'])await migrator.query(fs.readFileSync(path.join(root,'db/migrations',n),'utf8'))}
 if((await migrator.query("select environment from gs_security_environment where id='isolation'")).rows[0]?.environment!=='synthetic-only')throw Error('SYNTHETIC_MARKER_MISSING');
 return{applied:!has};
}

async function grants(migrator){
 const r=ident(RUNTIME);
 for(const sql of [`REVOKE ALL ON SCHEMA public FROM PUBLIC`,`GRANT USAGE ON SCHEMA public TO ${r}`,`GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO ${r}`,`GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO ${r}`,`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ${r}`,`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO ${r}`,`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE,SELECT ON SEQUENCES TO ${r}`])await migrator.query(sql);
}

async function seed(migrator){
 for(const [id,name] of CLINICS)await migrator.query('insert into clinics(id,name,active) values($1,$2,true) on conflict(id) do nothing',[id,name]);
 const out=[];for(const [role,local,name,clinics] of PEOPLE){const email=local+'@example.invalid';let id=(await migrator.query('select id from users where email=$1',[email])).rows[0]?.id;
  if(!id){id=randomUUID();await migrator.query('insert into users(id,email,name,role,active) values($1,$2,$3,$4,true)',[id,email,name,role]);await migrator.query('insert into employees(id,user_id,name,data) values($1,$2,$3,$4)',[randomUUID(),id,name,JSON.stringify({clinics})]);for(const c of clinics)await migrator.query('insert into user_clinics(user_id,clinic_id) values($1,$2) on conflict do nothing',[id,c])}
  out.push({role,email,id:String(id)})}
 return out;
}

module.exports={DB,MIGRATOR,RUNTIME,PEOPLE,CLINICS,roles,schema,grants,seed};
