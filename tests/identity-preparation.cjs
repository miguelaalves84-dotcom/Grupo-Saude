'use strict';
/* Offline contract tests. No SDK/provider/PostgreSQL installation, network or remote credentials. */
const assert=require('node:assert/strict'),Config=require('../lib/identity-runtime-config'),{IdentityService}=require('../lib/identity-service'),{FinanceService}=require('../lib/finance-service'),Auth=require('../lib/authorization-service'),handler=require('../api/v4-auth');
const roles=['CEO','Administração','Administrativa','Médico/a','Técnico/a','Call Center'];
const origin='https://integration.synthetic.invalid',host='synthetic-endpoint.neon.tech';
function environment(){return {GS_IDENTITY_ENVIRONMENT:'isolated',GS_IDENTITY_DATA_SYNTHETIC:'true',VERCEL_ENV:'preview',VERCEL_PROJECT_ID:'synthetic-project',GS_IDENTITY_EXPECTED_PROJECT_ID:'synthetic-project',GS_IDENTITY_RESOURCE_ID:'synthetic-neon-project',GS_IDENTITY_PROXY_TOKEN:'synthetic-proxy-not-a-real-secret',GS_IDENTITY_DATABASE_HOST:host,GS_IDENTITY_DATABASE_URL:'postgresql://gs_v4_runtime:'+encodeURIComponent('synthetic-not-a-real-password')+'@'+host+'/gs_v4_test?sslmode=verify-full',GS_IDENTITY_ORIGIN:origin,GS_IDENTITY_AUTH_BASE_URL:origin+'/api/group1-provider'};}
function fixture(role){
 const id='synthetic-user',queries=[],state={marker:'synthetic-neon-project',active:true,permissions:{},rolePermissions:{},assigned:['a','b']};
 const db={query:async(q,p=[])=>{
  queries.push({q,p});
  if(q.includes('from gs_identity_environment'))return [{resource_id:state.marker,data_synthetic:true}];
  if(q.startsWith('insert into gmail_auth_limits'))return [{attempts:1}];
  if(q.includes('select user_id,clinic_id'))return state.assigned.map(clinic_id=>({user_id:id,clinic_id}));
  if(q.includes("key='role_action_permissions'"))return [{value:state.rolePermissions}];
  if(q.includes('from users u left join employees'))return [{id,name:'SYNTHETIC USER',email:'synthetic@example.invalid',role,active:state.active,data:{hr:{actionPermissions:state.permissions}}}];
  if(q.includes('from users where'))return state.active?[{id,auth_subject:'synthetic-subject'}]:[];
  if(q.startsWith('insert into audit_log'))return [];
  throw Error('Unexpected synthetic SQL');
 }};
 return {queries,state,db,s:new IdentityService(db,'synthetic-neon-project')};
}
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.body=v;return this;}};}
async function login(f,options={}){
 const env={...environment(),...options.env},r=response();let calls=0;
 await handler.createHandler({env,service:()=>f.s,fetch:async()=>{
  calls++;return Response.json({user:{id:'synthetic-subject',email:'synthetic@example.invalid',emailVerified:true},session:{expiresAt:new Date(Date.now()+60000).toISOString()}},{headers:{'set-cookie':'__Host-synthetic.session=synthetic-only; Path=/; Secure; HttpOnly; SameSite=Lax'}});
 }})({method:'POST',headers:{authorization:'Bearer '+env.GS_IDENTITY_PROXY_TOKEN,'x-gs-origin':options.origin||origin,'x-gs-client-ip':'synthetic-ip','content-type':'application/json'},query:{action:'signIn'},body:{email:'synthetic@example.invalid',password:'SYNTHETIC-TEST-PASSWORD-ONLY'}},r);
 return {r,calls};
}
(async()=>{
 let passed=0;async function test(name,fn){await fn();passed++;console.log('PASS identity preparation: '+name);}
 await test('isolated configuration requires no Blob or Finance credentials',async()=>{assert(Config.configured(environment()));assert.equal(Config.select({}),null);assert.deepEqual(Config.select({GS_IDENTITY_ENVIRONMENT:'wrong'}),{configured:false});});
 for(const [name,change] of [
  ['production',{VERCEL_ENV:'production'}],['wrong project',{VERCEL_PROJECT_ID:'different'}],['missing resource',{GS_IDENTITY_RESOURCE_ID:''}],['non-synthetic data',{GS_IDENTITY_DATA_SYNTHETIC:'false'}],['missing proxy',{GS_IDENTITY_PROXY_TOKEN:''}],['wrong origin',{GS_IDENTITY_ORIGIN:'http://integration.synthetic.invalid'}],['cross-origin provider',{GS_IDENTITY_AUTH_BASE_URL:'https://other.synthetic.invalid/api/group1-provider'}],['unexpected provider route',{GS_IDENTITY_AUTH_BASE_URL:origin+'/api/other'}],['wrong database',{GS_IDENTITY_DATABASE_URL:environment().GS_IDENTITY_DATABASE_URL.replace('/gs_v4_test','/neondb')}],['migration role',{GS_IDENTITY_DATABASE_URL:environment().GS_IDENTITY_DATABASE_URL.replace('gs_v4_runtime','gs_v4_migrator')}],['no TLS verification',{GS_IDENTITY_DATABASE_URL:environment().GS_IDENTITY_DATABASE_URL.replace('verify-full','disable')}],['unexpected database host',{GS_IDENTITY_DATABASE_HOST:'other.neon.tech'}],['inherited production DSN',{DATABASE_URL:environment().GS_IDENTITY_DATABASE_URL}],['inherited Finance DSN',{GS_FINANCE_DATABASE_URL:environment().GS_IDENTITY_DATABASE_URL}]
 ])await test('refuses '+name+' before provider or SQL',async()=>{const f=fixture('CEO'),{r,calls}=await login(f,{env:change});assert.equal(r.code,503);assert.equal(calls,0);assert.equal(f.queries.length,0);});
 for(const role of roles){
  await test(role+' uses the existing identity projection and server permissions',async()=>{
   const f=fixture(role),finance=new FinanceService(f.db,{});assert.deepEqual(await f.s.people(),await finance.people());
   let actor=(await f.s.people())[0];assert.deepEqual(actor.clinics,['a','b']);
   if(role==='CEO')assert.doesNotThrow(()=>Auth.clinic({...actor,activeClinicIds:['a','b','c']},'c'));
   else assert.throws(()=>Auth.clinic({...actor,activeClinicIds:['a','b','c']},'c'),e=>e.code==='CLINIC_NOT_AUTHORIZED');
   assert.throws(()=>Auth.clinic({...actor,activeClinicIds:['a','b']},'c'),e=>e.code==='CLINIC_NOT_AUTHORIZED');
   const {r}=await login(f);assert.equal(r.code,200);assert.equal(r.body.user.role,role);assert.deepEqual(r.body.user.clinics,['a','b']);
  });
 }
 await test('permission removal is reread without a session switch; individual overrides remain authoritative',async()=>{const f=fixture('Administrativa');f.state.rolePermissions={ADMINISTRATIVA:{clinics:true}};assert(Auth.has((await f.s.people())[0],'clinics'));f.state.permissions.clinics=false;assert(!Auth.has((await f.s.people())[0],'clinics'));f.state.permissions.clinics=true;assert(Auth.has((await f.s.people())[0],'clinics'));f.state.assigned=['b'];assert.deepEqual((await f.s.people())[0].clinics,['b']);});
 await test('custom permissions cannot grant settings to a non-manager',async()=>{const f=fixture('Médico/a');f.state.permissions.settings=true;assert(!Auth.manager((await f.s.people())[0],'settings'));});
 await test('destination marker is checked again after an earlier valid operation',async()=>{const f=fixture('CEO');await f.s.people();f.state.marker='wrong-resource';const count=f.queries.length;await assert.rejects(()=>f.s.people(),/DESTINATION_MISMATCH/);assert.equal(f.queries.length,count+1);});
 await test('existing sign-in handler can use isolated identity without any Finance/Blob dependency',async()=>{const f=fixture('CEO'),{r,calls}=await login(f);assert.equal(r.code,200);assert.equal(calls,1);assert.equal(r.body.user.id,'synthetic-user');assert(!('token' in r.body));assert(r.headers['Set-Cookie'][0].includes('HttpOnly'));assert(f.queries.some(x=>x.q.startsWith('insert into audit_log')));assert(!f.queries.some(x=>/finance_events|current_account|stock_ledgers/i.test(x.q)));});
 await test('an invalid origin cannot call the provider or SQL',async()=>{const f=fixture('CEO'),{r,calls}=await login(f,{origin:'https://other.synthetic.invalid'});assert.equal(r.code,403);assert.equal(calls,0);assert.equal(f.queries.length,0);});
 await test('inactive identity is rejected before provider sign-in',async()=>{const f=fixture('CEO');f.state.active=false;const {r,calls}=await login(f);assert.equal(r.code,401);assert.equal(calls,0);});
 console.log(JSON.stringify({passed,failed:0,scope:'Offline synthetic SQL/provider contracts only; Better Auth and PostgreSQL NOT executed'}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
