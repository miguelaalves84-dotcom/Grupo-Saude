'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');let count=0;
async function test(name,fn){await fn();count++;console.log('PASS release: '+name)}
function endpoint(actor){
 const queries=[],sql={query:async(q,params)=>{queries.push({q,params});if(q.includes('from users u'))return actor?[actor]:[];if(q==='select now() server_time')return[{server_time:'2026-10-09T00:00:00Z'}];return[]}},mod={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'api/v4.js'),'utf8'),{module:mod,require:name=>{if(name==='@neondatabase/serverless')return{neon:()=>sql};throw Error('Unexpected dependency '+name)},process:{env:{DATABASE_URL:'fixture-only',DATABASE_NEON_AUTH_BASE_URL:'https://identity.invalid',VERCEL_ENV:'preview'}},fetch:async()=>({ok:true,json:async()=>({user:{id:'verified-provider-subject'}})}),Set,Number,String,JSON,Math,Date});
 return{queries,call:async(query,cookie='session=fixture')=>{const res={setHeader(){},status(code){this.code=code;return this},json(body){this.body=body;return this}};await mod.exports({method:'GET',headers:{cookie},query},res);return res}};
}
(async()=>{
 await test('build leaves a deployable directory and excludes confidential/backend files',()=>{
  require('../scripts/build-static.cjs');const files=fs.readdirSync(path.join(root,'dist'));
  assert(files.includes('index.html'));assert(files.includes('finance.html'));assert(files.includes('account.html'));assert(files.includes('_headers'));
  assert(files.every(name=>/\.(html|css|js)$/.test(name)||name==='_headers'));assert(!files.includes('api'));assert(!files.includes('docs'));assert(!files.includes('.env'));
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'vercel.json'))).outputDirectory,'dist');
  for(const name of files)assert.deepEqual(fs.readFileSync(path.join(root,'dist',name)),fs.readFileSync(path.join(root,name)));
 });
 await test('Cloudflare identity is read-only and contains no secrets',async()=>{const source=fs.readFileSync(path.join(root,'functions/api/version.js'),'utf8').replace('export function','function');const context={Response};vm.runInNewContext(source+';globalThis.handler=onRequest;',context);const env={CF_PAGES_COMMIT_SHA:'a'.repeat(40),CF_PAGES_BRANCH:'test-branch',SECRET:'must-not-leak'};const r=context.handler({env,request:{method:'GET'}});assert.equal(r.headers.get('cache-control'),'no-store');assert.deepEqual(await r.json(),{application:'Grupo Saúde V4',commit:'a'.repeat(40),branch:'test-branch',source:'Cloudflare Pages'});assert.equal(context.handler({env,request:{method:'POST'}}).status,405);});
 await test('anonymous legacy health cannot read or initialize data',async()=>{const e=endpoint(null),r=await e.call({health:'1'},'');assert.equal(r.code,401);assert.equal(e.queries.length,0)});
 await test('anonymous legacy clinics are denied',async()=>{const e=endpoint(null);assert.equal((await e.call({resource:'clinics'},'')).code,401);assert.equal(e.queries.length,0)});
 for(const role of ['CEO','Administração','Administrativa','Médico/a','Técnico/a','Call Center']){
  const actor={id:'u-fixture',role,active:true,clinics:['c-fixture']};
  await test(role+' health is read-only and restricted',async()=>{const e=endpoint(actor),r=await e.call({health:'1'});assert.equal(r.code,['CEO','Administração'].includes(role)?200:403);assert(e.queries.every(x=>/^select /i.test(x.q)));assert(!JSON.stringify(r.body).includes('fixture-only'));assert(!r.body.db)});
  await test(role+' clinic query respects server identity',async()=>{const e=endpoint(actor);assert.equal((await e.call({resource:'clinics',userId:'other-user'})).code,200);const q=e.queries.at(-1);if(role==='CEO')assert(!q.q.includes('join user_clinics'));else{assert(q.q.includes('join user_clinics'));assert.deepEqual(Array.from(q.params),['u-fixture'])}});
 }
 console.log(`PASS release readiness: ${count} tests; external production services still require validation`);
})().catch(e=>{console.error(e);process.exitCode=1});
