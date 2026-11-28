"""Real PostgreSQL verification, opt-in LOCAL disposable cluster only. No remote DSN allowed."""
import os,pathlib,subprocess,hashlib,concurrent.futures,time
if os.environ.get('GS_P0_POSTGRES_DISPOSABLE')!='true':raise SystemExit('BLOCKED: enable only for a disposable local PostgreSQL cluster')
DSN=os.environ['GS_P0_POSTGRES_DSN']
if 'host=/tmp/' not in DSN or 'dbname=p0_synthetic' not in DSN:raise SystemExit('Refusing non-disposable or remote database')
ROOT=pathlib.Path(__file__).resolve().parent.parent
source=(ROOT/'db/migrations/v4-p0-gps-001.sql').read_text()
sha=hashlib.sha256(source.encode()).hexdigest()
def sql(text,check=True):
 r=subprocess.run(['psql',DSN,'-X','-At','-v','ON_ERROR_STOP=1','-c',text],capture_output=True,text=True)
 if check and r.returncode:raise AssertionError(r.stderr)
 return r
# Capture the exact SQL emitted by the shipped runner; execute in the local PostgreSQL adapter.
def emitted(migration):
 code="const {migrate}=require('./scripts/migrate-development.cjs');let queries=[];const sql={query:q=>{queries.push(q);return q},transaction:async()=>[]};migrate(sql,'v4-p0-gps-001',"+__import__('json').dumps(migration)+").then(()=>console.log(JSON.stringify(queries)));"
 return __import__('json').loads(subprocess.check_output(['node','-e',code],cwd=ROOT,text=True))
def migrate(schema='public',body=source):
 queries=emitted(body)
 for attempt in range(3):
  r=sql('begin isolation level serializable;set search_path to '+schema+';'+ ';'.join(queries)+';commit;',False)
  if r.returncode==0:return
  if 'could not serialize' not in r.stderr and 'deadlock' not in r.stderr:raise AssertionError(r.stderr)
 raise AssertionError(r.stderr)
sql('create table users(id uuid primary key);create table clinics(id text primary key);insert into clinics values(\'synthetic-clinic\');')
assert sql("select to_regclass('gs_schema_migrations') is null").stdout.strip()=='t'
print('PASS PostgreSQL: missing migration ledger')
migrate()
assert sql("select checksum from gs_schema_migrations where version='v4-p0-gps-001'").stdout.strip()==sha
assert sql("select count(*) from information_schema.columns where table_name='clinics' and column_name in ('latitude','longitude','address','attendance_radius_m')").stdout.strip()=='4'
before=sql('select applied_at from gs_schema_migrations').stdout
migrate();assert sql('select applied_at from gs_schema_migrations').stdout==before
assert sql('select count(*) from clinics').stdout.strip()=='1'
print('PASS PostgreSQL: exact migration, checksum, repeat is idempotent and prior data preserved')
sql('create schema interruption;set search_path to interruption;create table users(id uuid primary key);create table clinics(id text primary key);')
try:migrate('interruption',source+'\nselect 1/0;');raise AssertionError('Expected rollback')
except AssertionError as e:assert 'division by zero' in str(e)
assert sql("select to_regclass('interruption.clinic_gps_attempts') is null").stdout.strip()=='t'
assert sql("select to_regclass('interruption.gs_schema_migrations') is null").stdout.strip()=='t'
print('PASS PostgreSQL: interrupted migration rolls back DDL and ledger')
sql('create schema concurrent;set search_path to concurrent;create table users(id uuid primary key);create table clinics(id text primary key);')
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(lambda _:migrate('concurrent'),range(2)))
assert sql('select count(*) from concurrent.gs_schema_migrations').stdout.strip()=='1'
assert sql("select to_regclass('concurrent.clinic_gps_attempts') is not null").stdout.strip()=='t'
print('PASS PostgreSQL: concurrent executions use lock, serializable retry, one ledger record')
r=sql('begin isolation level serializable;'+ ';'.join(emitted(source+'\n-- tampered checksum'))+';commit;',False)
assert r.returncode and 'MIGRATION_CHECKSUM_MISMATCH' in r.stderr
assert sql('select checksum from gs_schema_migrations').stdout.strip()==sha
print('PASS PostgreSQL: applied migration checksum tampering rejected')
