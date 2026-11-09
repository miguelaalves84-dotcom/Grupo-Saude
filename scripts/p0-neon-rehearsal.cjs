'use strict';
/* P0.1 remoto — ensaio supervisionado na base de TESTES Neon (UE), só com dados sintéticos.
   Executado apenas pelo workflow .github/workflows/p0-neon-test.yml, com a ligação de administrador
   do projeto de testes num segredo do GitHub (GS_P0_NEON_OWNER_URL). Nunca escreve ligações,
   palavras-passe ou nomes de host nos registos: tudo o que é sensível é mascarado e só passa por
   variáveis de ambiente dos processos-filho.

   1. Provisão (administrador): acessos gs_test_migrator/gs_test_runtime e gs_restore_migrator/
      gs_restore_runtime sem privilégios elevados, com palavras-passe aleatórias enviadas já como
      verificadores SCRAM-SHA-256; base gs_v4_test (mantida) e clone gs_v4_test_restore (recriado vazio).
   2. Procedimento P0.1 existente (scripts/p0-test-environment.cjs), sem alterações:
      plan → bootstrap → backup → migrate → permissions → verify → backup;
      clone: bootstrap → restore (origem = gs_v4_test) → verify. */
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');

const MAIN_DB='gs_v4_test',CLONE_DB='gs_v4_test_restore';
const ROLES={mainMigrator:'gs_test_migrator',mainRuntime:'gs_test_runtime',cloneMigrator:'gs_restore_migrator',cloneRuntime:'gs_restore_runtime'};
const fail=code=>Object.assign(Error(code),{code});
const mask=v=>{if(v)process.stdout.write('::add-mask::'+v+'\n')};
const say=(step,data={})=>console.log(JSON.stringify({step,...data}));

function owner(){
 let u;try{u=new URL(process.env.GS_P0_NEON_OWNER_URL||'')}catch{throw fail('P0_OWNER_SECRET_MISSING')}
 if(!['postgres:','postgresql:'].includes(u.protocol)||!u.username||!u.password)throw fail('P0_OWNER_SECRET_INVALID');
 const host=u.hostname.replace('-pooler.','.');// sempre o endpoint direto
 mask(u.password);mask(u.hostname);mask(host);mask(decodeURIComponent(u.password));
 if(!/^ep-[a-z0-9-]+(?:\.c-\d+)?\.eu-[a-z]+-\d\.aws\.neon\.tech$/.test(host))throw fail('P0_OWNER_NOT_EU_NEON_DIRECT');
 if(process.env.VERCEL_ENV==='production'||process.env.NODE_ENV==='production')throw fail('P0_PRODUCTION_REFUSED');
 return{host,user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:decodeURIComponent(u.pathname.slice(1)||'neondb')};
}
function scram(password){
 const salt=crypto.randomBytes(16),iter=4096,salted=crypto.pbkdf2Sync(password.normalize('NFKC'),salt,iter,32,'sha256');
 const hmac=(k,s)=>crypto.createHmac('sha256',k).update(s).digest();
 const stored=crypto.createHash('sha256').update(hmac(salted,'Client Key')).digest(),server=hmac(salted,'Server Key');
 return`SCRAM-SHA-256$${iter}:${salt.toString('base64')}$${stored.toString('base64')}:${server.toString('base64')}`;
}
const ident=s=>{if(!/^[a-z][a-z0-9_]{1,62}$/.test(s))throw fail('P0_IDENTIFIER_INVALID');return'"'+s+'"'};
const lit=s=>"'"+String(s).replace(/'/g,"''")+"'";

async function provision(o){
 const {Client}=require('pg'),db=new Client({host:o.host,port:o.localTest?55440:5432,user:o.user,password:o.password,database:o.database,ssl:o.localTest?false:{rejectUnauthorized:true},connectionTimeoutMillis:10000,query_timeout:60000,application_name:'gs-v4-p0-provision'});
 await db.connect();const passwords={};
 try{
  const v=(await db.query("select current_setting('server_version_num')::int v")).rows[0].v;if(v<160000)throw fail('P0_POSTGRES_16_REQUIRED');
  for(const [key,role] of Object.entries(ROLES)){
   const pw=crypto.randomBytes(24).toString('base64url');mask(pw);passwords[key]=pw;
   const exists=(await db.query('select 1 from pg_roles where rolname=$1',[role])).rowCount===1;
   // Sem superutilizador, ALTER não pode repetir SUPERUSER/REPLICATION/BYPASSRLS: confirmam-se a seguir.
   const attrs=(exists?'LOGIN NOCREATEDB NOCREATEROLE':'LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS')+(key.endsWith('Runtime')?' NOINHERIT':'');
   await db.query(`${exists?'ALTER':'CREATE'} ROLE ${ident(role)} WITH ${attrs} PASSWORD ${lit(scram(pw))}`);
   const r=(await db.query('select rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls,rolcanlogin,rolinherit from pg_roles where rolname=$1',[role])).rows[0];
   if(r.rolsuper||r.rolcreatedb||r.rolcreaterole||r.rolreplication||r.rolbypassrls||!r.rolcanlogin||(key.endsWith('Runtime')&&r.rolinherit))throw fail('P0_ROLE_ATTRIBUTES_UNSAFE');
   if((await db.query('select count(*)::int n from pg_auth_members m join pg_roles r on r.oid=m.member where r.rolname=$1',[role])).rows[0].n)throw fail('P0_ROLE_MEMBERSHIP_NOT_ALLOWED');
   // O administrador precisa de SET para criar a base com este dono; o próprio acesso não fica membro de nada.
   await db.query(`GRANT ${ident(role)} TO ${ident(o.user)} WITH SET TRUE, INHERIT FALSE`);
  }
  if(!(await db.query('select 1 from pg_database where datname=$1',[MAIN_DB])).rowCount)await db.query(`CREATE DATABASE ${ident(MAIN_DB)} OWNER ${ident(ROLES.mainMigrator)}`);
  const mainOwner=(await db.query('select pg_get_userbyid(datdba) o from pg_database where datname=$1',[MAIN_DB])).rows[0].o;
  if(mainOwner!==ROLES.mainMigrator)throw fail('P0_MAIN_DATABASE_OWNER_UNEXPECTED');
  // Só o dono pode apagar a base e retirar as permissões por omissão (PUBLIC): esses comandos correm como o dono.
  const asOwner=async(role,sql)=>{await db.query(`SET ROLE ${ident(role)}`);try{await db.query(sql)}finally{await db.query('RESET ROLE')}};
  if((await db.query('select 1 from pg_database where datname=$1',[CLONE_DB])).rowCount){
   const cloneOwner=(await db.query('select pg_get_userbyid(datdba) o from pg_database where datname=$1',[CLONE_DB])).rows[0].o;
   if(cloneOwner!==ROLES.cloneMigrator)throw fail('P0_CLONE_DATABASE_OWNER_UNEXPECTED');
   await asOwner(ROLES.cloneMigrator,`DROP DATABASE ${ident(CLONE_DB)} WITH (FORCE)`);
  }
  await db.query(`CREATE DATABASE ${ident(CLONE_DB)} OWNER ${ident(ROLES.cloneMigrator)}`);
  for(const [dbname,runtime,migrator] of [[MAIN_DB,ROLES.mainRuntime,ROLES.mainMigrator],[CLONE_DB,ROLES.cloneRuntime,ROLES.cloneMigrator]]){
   await asOwner(migrator,`REVOKE ALL ON DATABASE ${ident(dbname)} FROM PUBLIC`);
   await asOwner(migrator,`GRANT CONNECT ON DATABASE ${ident(dbname)} TO ${ident(runtime)}`);
   const open=(await db.query("select count(*)::int n from pg_database d, aclexplode(coalesce(d.datacl,acldefault('d',d.datdba))) a where d.datname=$1 and a.grantee=0 and a.privilege_type='CONNECT'",[dbname])).rows[0].n;
   if(open)throw fail('P0_DATABASE_STILL_PUBLIC');
  }
  say('provision',{postgres:Math.floor(v/10000),roles:Object.keys(ROLES).length,databases:[MAIN_DB,CLONE_DB],cloneRecreatedEmpty:true});
 }finally{await db.end()}
 return passwords;
}
const url=(o,user,pw,dbname)=>`postgresql://${user}:${encodeURIComponent(pw)}@${o.host}:5432/${dbname}?sslmode=verify-full`;

function run(action,env){
 const r=spawnSync(process.execPath,[path.join(__dirname,'p0-test-environment.cjs'),action],{env,encoding:'utf8',timeout:600000});
 const out=(r.stdout||'').trim().split('\n').filter(Boolean),err=(r.stderr||'').trim();
 if(action!=='plan')for(const line of out)console.log(line);else{try{say('plan',{migrations:JSON.parse(r.stdout).migrations.length})}catch{say('plan',{unreadable:true})}}
 if(r.status!==0)throw fail(/^P0_[A-Z0-9_]+$/.test(err)?err:'P0_STEP_FAILED_'+action.toUpperCase());
}

async function main(){
 const o=owner(),pw=await provision(o),tmp=process.env.RUNNER_TEMP||require('node:os').tmpdir();
 const dir=fs.mkdtempSync(path.join(tmp,'gs-p0-'));fs.chmodSync(dir,0o700);
 const keyFile=path.join(dir,'backup.key');fs.writeFileSync(keyFile,crypto.randomBytes(32),{mode:0o600,flag:'wx'});
 const ca=['/etc/ssl/certs/ca-certificates.crt','/etc/pki/tls/certs/ca-bundle.crt'].find(f=>fs.existsSync(f));
 const base={PATH:process.env.PATH,HOME:process.env.HOME,CI:'true',GS_P0_ENVIRONMENT:'isolated-test',GS_P0_REMOTE_APPROVED:'true',GS_P0_ALLOWED_HOST:o.host,GS_P0_BACKUP_KEY_FILE:keyFile,...(ca?{GS_P0_CA_FILE:ca}:{})};
 const main={...base,GS_P0_TARGET_ID:process.env.GS_P0_MAIN_TARGET_ID,GS_P0_MIGRATION_DATABASE_URL:url(o,ROLES.mainMigrator,pw.mainMigrator,MAIN_DB),GS_P0_RUNTIME_DATABASE_URL:url(o,ROLES.mainRuntime,pw.mainRuntime,MAIN_DB)};
 const clone={...base,GS_P0_TARGET_ID:process.env.GS_P0_CLONE_TARGET_ID,GS_P0_MIGRATION_DATABASE_URL:url(o,ROLES.cloneMigrator,pw.cloneMigrator,CLONE_DB),GS_P0_RUNTIME_DATABASE_URL:url(o,ROLES.cloneRuntime,pw.cloneRuntime,CLONE_DB)};
 for(const e of [main,clone]){mask(e.GS_P0_MIGRATION_DATABASE_URL);mask(e.GS_P0_RUNTIME_DATABASE_URL)}
 const initial=path.join(dir,'initial.gsbak'),after=path.join(dir,'after-migrations.gsbak');
 run('plan',main);run('bootstrap',main);
 run('backup',{...main,GS_P0_BACKUP_FILE:initial});run('migrate',{...main,GS_P0_BACKUP_FILE:initial});
 run('permissions',main);run('verify',main);run('backup',{...main,GS_P0_BACKUP_FILE:after});
 run('bootstrap',clone);
 run('restore',{...clone,GS_P0_BACKUP_FILE:after,GS_P0_SOURCE_TARGET_ID:main.GS_P0_TARGET_ID,GS_P0_SOURCE_MIGRATION_DATABASE_URL:main.GS_P0_MIGRATION_DATABASE_URL,GS_P0_SOURCE_RUNTIME_DATABASE_URL:main.GS_P0_RUNTIME_DATABASE_URL});
 run('verify',clone);run('verify',main);
 fs.rmSync(dir,{recursive:true,force:true});
 say('done',{result:'P0.1 remote rehearsal passed',scope:'synthetic-only',backupsKeptOutsideRunner:false});
}
if(require.main===module)main().catch(e=>{say('failed',{code:/^P0_[A-Z0-9_]+$/.test(e.code||'')?e.code:'P0_REHEARSAL_FAILED_NO_DETAILS_LOGGED'});process.exitCode=1});
module.exports={scram,provision,ROLES,MAIN_DB,CLONE_DB};
