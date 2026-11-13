'use strict';
/* Entrada com Google (ambiente de testes): só colaboradores registados entram; regresso da Google passa pelo servidor;
   sessão de 30 dias; contas fictícias ligadas por GS_IDENTITY_GOOGLE_MAP. Sem rede: base e motor simulados. */
const assert=require('node:assert/strict');let n=0;const test=async(name,fn)=>{await fn();n++;console.log('PASS google login: '+name)};
process.on('unhandledRejection',e=>{if(!/Failed to initialize database adapter/.test(String(e?.message)))throw e}); // a base simulada não serve o adaptador real do Better Auth (não usado aqui)
const host='ep-synthetic.c-7.eu-central-1.aws.neon.tech';
const env={GS_SECURITY_ENVIRONMENT:'synthetic-test',GS_IDENTITY_ENGINE:'better-auth',GS_IDENTITY_SECRET:'x'.repeat(48),GS_IDENTITY_BASE_URL:'https://identity.example.invalid/',GS_SECURITY_REMOTE_TEST:'approved-synthetic',GS_IDENTITY_ALLOWED_HOST:host,GS_IDENTITY_DATABASE_URL:'postgresql://gs_identity_runtime:pw@'+host+'/gs_v4_identity_test?sslmode=verify-full'};
function fakePool(users){const audit=[];return{audit,users,query:async(sql,p=[])=>{if(/gs_security_environment/.test(sql))return{rows:[{environment:'synthetic-only'}]};
 if(/^select id from users where lower\(email\)/.test(sql))return{rows:users.filter(u=>u.email===p[0]&&u.active&&!u.auth_subject).map(u=>({id:u.id}))};
 if(/^update users set auth_subject/.test(sql)){const u=users.find(u=>u.email===p[1]&&u.active&&!u.auth_subject);if(u)u.auth_subject=p[0];return{rows:u?[{id:u.id}]:[]}}
 if(/gs_security_limits/.test(sql))return{rows:[{attempts:1}]};if(/gs_security_events/.test(sql)){audit.push(p[2]||p.join('|'));return{rows:[]}}return{rows:[]}}}}
const make=async(extra={},users=[{id:'u-ceo',email:'syn.ceo@example.invalid',active:true,auth_subject:null}])=>{const pool=fakePool(users);const id=await require('../lib/security-identity.cjs').createIdentity({pool,env:{...env,...extra}});return{id,pool}};
let hasAuth=true;try{require.resolve('better-auth')}catch{hasAuth=false}
(async()=>{
 const G={GS_GOOGLE_CLIENT_ID:'test-client.apps.googleusercontent.com',GS_GOOGLE_CLIENT_SECRET:'test-secret',GS_IDENTITY_GOOGLE_MAP:'Pessoa.Teste@Gmail.com=syn.ceo@example.invalid'};
 if(hasAuth){
 await test('Google só aparece quando está configurado; sessão aberta 30 dias',async()=>{const a=await make(),b=await make(G);
  const st=async x=>(await x.id.handle(new Request('https://identity.example.invalid/api/auth?action=googleStatus'))).json();
  assert.equal((await st(a)).google,false);assert.equal((await st(b)).google,true);
  const r=await a.id.handle(new Request('https://identity.example.invalid/api/auth?action=googleStart',{method:'POST',headers:{origin:'https://identity.example.invalid','content-type':'application/json'},body:'{}'}));assert.equal(r.status,404);
  assert.equal(b.id.options.session.expiresIn,30*86400);assert.equal(b.id.options.account.accountLinking.enabled,false);assert.ok(b.id.options.socialProviders.google)});
 await test('início da entrada com Google devolve o endereço da Google e guarda o estado (cookie)',async()=>{const {id}=await make(G);let body;id.auth.handler=async rq=>{body=await rq.json();return new Response(JSON.stringify({url:'https://accounts.google.com/o/oauth2/v2/auth?client_id=x',redirect:false}),{status:200,headers:{'content-type':'application/json','set-cookie':'gs_v4.state=abc; Path=/; HttpOnly; Secure'}})};
  const r=await id.handle(new Request('https://identity.example.invalid/api/auth?action=googleStart',{method:'POST',headers:{origin:'https://identity.example.invalid','content-type':'application/json'},body:JSON.stringify({provider:'evil',callbackURL:'https://evil.example/'})}));
  const d=await r.json();assert.equal(r.status,200);assert.match(d.url,/^https:\/\/accounts\.google\.com\//);assert.ok(r.headers.getSetCookie().some(c=>/gs_v4\.state/.test(c)));assert.equal(body.provider,'google');assert.equal(body.callbackURL,'https://identity.example.invalid/authenticated.html');
  id.auth.handler=async()=>new Response(JSON.stringify({url:'https://evil.example/'}),{status:200,headers:{'content-type':'application/json'}});const x=await id.handle(new Request('https://identity.example.invalid/api/auth?action=googleStart',{method:'POST',headers:{origin:'https://identity.example.invalid','content-type':'application/json'},body:'{}'}));assert.equal(x.status,502)});
 await test('conta Google ligada a colaborador registado é aceite e fica associada (com registo)',async()=>{const {id,pool}=await make(G),h=id.options.databaseHooks.user.create,ctx={params:{id:'google'}};
  assert.notEqual(await h.before({email:'pessoa.teste@gmail.com'},ctx),false);await h.after({id:'auth-1',email:'pessoa.teste@gmail.com'},ctx);assert.equal(pool.users[0].auth_subject,'auth-1');assert.ok(pool.audit.some(x=>/GOOGLE_ACCOUNT_LINKED/.test(x)))});
 await test('conta Google desconhecida é recusada e fica registada',async()=>{const {id,pool}=await make(G);assert.equal(await id.options.databaseHooks.user.create.before({email:'estranho@gmail.com'},{params:{id:'google'}}),false);assert.equal(pool.users[0].auth_subject,null);assert.ok(pool.audit.some(x=>/GOOGLE_LOGIN_REFUSED/.test(x)))});
 await test('colaborador inativo ou já ativado não pode ser tomado por outra conta Google',async()=>{const {id}=await make(G,[{id:'u-ceo',email:'syn.ceo@example.invalid',active:true,auth_subject:'outro'}]);assert.equal(await id.options.databaseHooks.user.create.before({email:'pessoa.teste@gmail.com'},{params:{id:'google'}}),false);const x=await make(G,[{id:'u-ceo',email:'syn.ceo@example.invalid',active:false,auth_subject:null}]);assert.equal(await x.id.options.databaseHooks.user.create.before({email:'pessoa.teste@gmail.com'},{params:{id:'google'}}),false)});
 await test('outras criações (não Google) não passam pela regra',async()=>{const {id}=await make(G);assert.equal(await id.options.databaseHooks.user.create.before({email:'x@y'},{params:{}}),undefined)});
 }else console.log('SKIP google login: casos do motor Better Auth (pacote não instalado neste job; correm onde as dependências existem)');
 await test('regresso da Google: só code/state passam e o servidor responde com redireção',async()=>{const H=require('../lib/identity-runtime.cjs').handler;let seen;const engine={handle:async rq=>{seen=new URL(rq.url);return new Response(null,{status:302,headers:{location:'https://identity.example.invalid/authenticated.html','set-cookie':'gs_v4.session_token=abc; Path=/; HttpOnly; Secure'}})}};
  const out={h:{},setHeader(k,v){this.h[k]=v},status(c){this.code=c;return this},end(){this.ended=true;return this},json(v){this.body=v;return this}};
  await H({method:'GET',headers:{},query:{action:'googleCallback',code:'C',state:'S',evil:'x'}},out,{env,identity:async()=>engine});
  assert.equal(out.code,302);assert.equal(out.h.Location,'https://identity.example.invalid/authenticated.html');assert.equal(seen.searchParams.get('code'),'C');assert.equal(seen.searchParams.get('state'),'S');assert.equal(seen.searchParams.get('evil'),null);assert.ok(out.ended)});
 console.log(JSON.stringify({passed:n,scope:'Google sign-in, synthetic only (no network)'}));
})().catch(e=>{console.error(e);process.exit(1)});
