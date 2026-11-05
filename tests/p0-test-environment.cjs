'use strict';
const assert=require('node:assert/strict'),{randomBytes}=require('node:crypto'),P=require('../lib/p0-test-environment.cjs');
let passed=0;
const env={GS_P0_ENVIRONMENT:'isolated-test',CI:'true',GS_P0_DISPOSABLE:'true',GS_P0_TARGET_ID:'00000000-0000-4000-8000-000000000001',GS_P0_MIGRATION_DATABASE_URL:'postgresql://p0_owner:owner-synthetic@127.0.0.1/gs_v4_p0_synthetic',GS_P0_RUNTIME_DATABASE_URL:'postgresql://p0_runtime:runtime-synthetic@127.0.0.1/gs_v4_p0_synthetic'};
assert(P.config(env).local);passed++;
for(const override of [{VERCEL_ENV:'production'},{NODE_ENV:'production'},{GS_P0_ENVIRONMENT:'development'},{CI:'false'},{GS_P0_DISPOSABLE:'false'},{GS_P0_TARGET_ID:''},{GS_P0_RUNTIME_DATABASE_URL:env.GS_P0_MIGRATION_DATABASE_URL},{DATABASE_URL:'postgresql://another:private@127.0.0.1/gs_v4_p0_synthetic'},{GS_P0_MIGRATION_DATABASE_URL:'postgresql://a:b@127.0.0.1/production'},{GS_P0_MIGRATION_DATABASE_URL:'postgresql://a:b@127.0.0.1/gs_v4_p0_synthetic?options=-csearch_path=evil'}]){assert.throws(()=>P.config({...env,...override}));passed++;}
const host='ep-synthetic.eu-central-1.aws.neon.tech',remote={...env,CI:'false',GS_P0_ALLOWED_HOST:host,GS_P0_REMOTE_APPROVED:'true',GS_P0_MIGRATION_DATABASE_URL:`postgresql://p0_owner:owner-synthetic@${host}/gs_v4_test?sslmode=verify-full`,GS_P0_RUNTIME_DATABASE_URL:`postgresql://p0_runtime:runtime-synthetic@${host}/gs_v4_test?sslmode=verify-full`};
assert(!P.config(remote).local);assert.equal(P.connection(P.config(remote).migration,false).ssl.rejectUnauthorized,true);passed++;
for(const override of [{GS_P0_REMOTE_APPROVED:'false'},{GS_P0_ALLOWED_HOST:'other.invalid'},{GS_P0_MIGRATION_DATABASE_URL:remote.GS_P0_MIGRATION_DATABASE_URL.replace('verify-full','require')},{GS_P0_MIGRATION_DATABASE_URL:remote.GS_P0_MIGRATION_DATABASE_URL.replace('eu-central-1','us-east-1')}]){assert.throws(()=>P.config({...remote,...override}));passed++;}
const plan=P.loadPlan();assert.equal(plan.length,11);assert(!plan.some(x=>x.id==='security-p0-001'));assert(!plan.some(x=>/^BEGIN;|^COMMIT;/m.test(x.sql)));passed++;
const k=randomBytes(32),meta={targetId:env.GS_P0_TARGET_ID,scope:'synthetic-only'},raw=Buffer.from('SYNTHETIC DUMP');const bytes=P.seal(raw,k,meta);assert.deepEqual(P.unseal(bytes,k).raw,raw);assert(!bytes.includes(raw));passed++;
assert.throws(()=>P.unseal(bytes,randomBytes(32)),/INTEGRITY/);passed++;
const tampered=JSON.parse(bytes);tampered.meta.targetId='changed';assert.throws(()=>P.unseal(Buffer.from(JSON.stringify(tampered)),k),/INTEGRITY/);passed++;
tampered.meta=meta;tampered.data=Buffer.from('changed').toString('base64');assert.throws(()=>P.unseal(Buffer.from(JSON.stringify(tampered)),k),/INTEGRITY/);passed++;
assert.throws(()=>P.seal(raw,randomBytes(8),meta),/KEY_REQUIRED/);passed++;
console.log(JSON.stringify({passed,scope:'P0.1 target/TLS/credential isolation, exact versioned migration manifest, encrypted backup integrity. No database connection or activation.'}));
