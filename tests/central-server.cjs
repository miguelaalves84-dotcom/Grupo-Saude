'use strict';
/* Test harness only. Reuses production handlers/services with fake provider and local disposable SQL.
   Never packaged as an API, never reads a supplied DSN or credentials. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),{execFileSync}=require('node:child_process'),{randomUUID}=require('node:crypto'),{Pool}=require('pg');
if(process.env.GS_TEST_DISPOSABLE_POSTGRES!=='true'||process.env.VERCEL_ENV==='production')throw Error('Isolated synthetic opt-in required');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync('/tmp/gs-central-'),socket=path.join(temp,'socket');fs.mkdirSync(socket);
const version=fs.readdirSync('/usr/lib/postgresql').sort((a,b)=>Number(b)-Number(a))[0],bin='/usr/lib/postgresql/'+version+'/bin',data=path.join(temp,'data');
execFileSync(bin+'/initdb',['-D',data,'-A','trust','-U','synthetic'],{stdio:'ignore'});execFileSync(bin+'/pg_ctl',['-D',data,'-l',path.join(temp,'postgres.log'),'-o',`-k ${socket} -p 55442 -h ''`,'start'],{stdio:'ignore'});
const pool=new Pool({host:socket,port:55442,user:'synthetic',database:'postgres',max:12});
const db={query:async(q,p=[])=>(await pool.query(q,p)).rows,transaction:async fn=>{const c=await pool.connect();try{await c.query('BEGIN');const result=await fn({query:async(q,p=[])=>(await c.query(q,p)).rows});await c.query('COMMIT');return result}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}};
const files=new Map(),storage={put:async(key,bytes,mime)=>{files.set(key,{bytes:Buffer.from(bytes),mime});return{key}},get:async key=>files.get(key)};
const Finance=new(require('../lib/finance-service').FinanceService)(db,storage),Modules=new(require('../lib/clinic-stock-service').ClinicStockService)(db,storage),P=require('../access-policy-core-v4');
const actors=['CEO','ADMINISTRAÇÃO','ADMINISTRATIVA','MEDICO/A','TECNICO/A','CALL CENTER'].map((role,i)=>({id:'00000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),subject:'synthetic-subject-'+i,role,email:'profile'+i+'@example.invalid',name:'SYNTHETIC '+role}));
const env={GS_MODULES_ENVIRONMENT:'isolated',GS_MODULES_DATA_SYNTHETIC:'true',GS_MODULES_DATABASE_URL:'postgresql://synthetic@localhost/disposable-central',GS_FINANCE_ENVIRONMENT:'preview',GS_FINANCE_DATABASE_URL:'postgresql://synthetic@localhost/disposable-central',GS_FINANCE_BLOB_TOKEN:'synthetic-not-a-real-credential',GS_FINANCE_BLOB_STORE_ID:'synthetic-memory-only',GS_FINANCE_AUTH_BASE_URL:'https://identity.synthetic.invalid',GS_FINANCE_PROXY_TOKEN:randomUUID(),GS_FINANCE_ORIGINS:''};
const sessions=new Map();let omitExpiry=false,providerRequests=0,server,origin;
const cookieId=headers=>/__Host-synthetic\.session=([^;]+)/.exec(headers.cookie||'')?.[1];
async function provider(url,options={}){
 providerRequests++;const action=new URL(url).pathname.split('/').at(-1),body=options.body?JSON.parse(options.body):{};
 if(action==='email'){
  const a=actors.find(x=>x.email===body.email);if(!a||body.password!=='SYNTHETIC-TEST-PASSWORD-ONLY')return Response.json({}, {status:401});
  const id=randomUUID(),expiry=new Date(Date.now()+600000).toISOString();sessions.set(id,{actor:a,expiry});
  return Response.json({user:{id:a.subject,email:a.email,emailVerified:true},session:omitExpiry?{}:{expiresAt:expiry}},{headers:{'set-cookie':'__Host-synthetic.session='+id+'; HttpOnly; Secure; Path=/; SameSite=Lax'}});
 }
 if(action==='sign-out'){sessions.delete(cookieId(options.headers||{}));return Response.json({status:'signed out'},{headers:{'set-cookie':'__Host-synthetic.session=; Max-Age=0; HttpOnly; Secure; Path=/; SameSite=Lax'}});}
 if(action==='get-session'){
  const s=sessions.get(cookieId(options.headers||{}));if(!s||Date.parse(s.expiry)<=Date.now())return Response.json({}, {status:401});
  return Response.json({user:{id:s.actor.subject,email:s.actor.email,emailVerified:true},session:omitExpiry?{}:{expiresAt:s.expiry}});
 }
 return Response.json({}, {status:501}); // Password recovery requires the real provider contract, not a pretend success.
}
const Auth=require('../api/v4-auth').createHandler({env,service:()=>Finance,fetch:provider}),API=require('../api/v4-clinic-stock').createHandler({env,service:()=>Modules,authService:()=>Finance,fetch:provider});
async function fixtures(req,res){
 const b=req.body||{},a=actors.find(x=>x.id===b.actorId);
 if(req.method==='GET'){
  const ledger=(await db.query("select data from stock_ledgers where clinic_id='a'"))[0]?.data;
  return res.json({quantity:ledger?.balances?.find(x=>x.productId==='synthetic-product')?.quantity/1000,auditCount:(await db.query('select count(*)::int n from audit_log'))[0].n,providerRequests});
 }
 if(b.action==='begin'){omitExpiry=false;await pool.query('delete from gmail_auth_limits');}
 else if(b.action==='permission'&&a){const matrix=(await db.query("select value from app_settings where key='role_action_permissions'"))[0]?.value||{};matrix[P.norm(a.role)]={...matrix[P.norm(a.role)],[b.key]:b.enabled};await pool.query("insert into app_settings(key,value) values('role_action_permissions',$1) on conflict(key) do update set value=excluded.value",[JSON.stringify(matrix)]);}
 else if(b.action==='restore'){omitExpiry=false;await pool.query("delete from app_settings where key='role_action_permissions'");await pool.query('update users set active=true');}
 else if(b.action==='revoke'&&a){for(const [id,s]of sessions)if(s.actor.id===a.id)sessions.delete(id);}
 else if(b.action==='inactive'&&a)await pool.query('update users set active=false where id=$1',[a.id]);
 else if(b.action==='missing-expiry')omitExpiry=true;
 else return res.status(400).json({error:'Unknown synthetic fixture'});
 return res.json({synthetic:true});
}
async function start(){
 await pool.query(fs.readFileSync(path.join(root,'db/schema.sql'),'utf8'));for(const f of ['finance-v4-002','finance-v4-003','finance-v4-004','finance-v4-005','finance-v4-006'])await pool.query(fs.readFileSync(path.join(root,'db/migrations/'+f+'.sql'),'utf8'));
 await pool.query("insert into clinics(id,name) values('a','SYNTHETIC CLINIC A'),('b','SYNTHETIC CLINIC B'),('c','SYNTHETIC FORBIDDEN CLINIC C')");
 const migrationRepo={query:(q,p=[])=>({q,p}),transaction:async qs=>db.transaction(async tx=>{for(const x of qs)await tx.query(x.q,x.p)})};
 for(const f of ['v4-p0-gps-001','v4-clinics-stock-001'])await require('../scripts/migrate-development.cjs').migrate(migrationRepo,f,fs.readFileSync(path.join(root,'db/migrations/'+f+'.sql'),'utf8'));
 for(const a of actors){await pool.query('insert into users(id,auth_subject,email,name,role) values($1,$2,$3,$4,$5)',[a.id,a.subject,a.email,a.name,a.role]);for(const cid of ['CEO','ADMINISTRAÇÃO','CALL CENTER'].includes(a.role)?['a','b']:['a'])await pool.query('insert into user_clinics(user_id,clinic_id) values($1,$2)',[a.id,cid]);}
 const ceo={...actors[0],active:true,clinics:['a','b','c'],activeClinicIds:['a','b','c'],permissions:{}};
 const key=()=>randomUUID();await Modules.stockWrite(ceo,'category-save',{clinicId:'a',id:'synthetic-category',name:'SYNTHETIC CATEGORY',idempotencyKey:key()});await Modules.stockWrite(ceo,'product-save',{clinicId:'a',id:'synthetic-product',reference:'SYN-001',name:'SYNTHETIC PRODUCT',unit:'un',categoryId:'synthetic-category',minimum:5,maximum:1000,idempotencyKey:key()});await Modules.stockWrite(ceo,'receive',{clinicId:'a',productId:'synthetic-product',quantity:500,idempotencyKey:key()});
 server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,origin);req.query=Object.fromEntries(url.searchParams);const chunks=[];for await(const chunk of req)chunks.push(chunk);if(chunks.reduce((n,x)=>n+x.length,0)>7000000){res.writeHead(413);return res.end();}req.body=chunks.length?JSON.parse(Buffer.concat(chunks)):{};
  res.status=n=>{res.statusCode=n;return res};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));return res};
  if(url.pathname==='/api/auth'){
   if(req.method==='POST'&&req.headers.origin!==origin)return res.status(403).json({error:'Origin denied'});
   req.headers.authorization='Bearer '+env.GS_FINANCE_PROXY_TOKEN;req.headers['x-gs-origin']=origin;req.headers['x-gs-client-ip']='synthetic-loopback';return Auth(req,res);
  }
  if(url.pathname==='/api/clinic-stock')return API(req,res);
  if(url.pathname==='/__synthetic__/fixture'){
   if(req.method!=='GET'&&req.headers.origin!==origin)return res.status(403).json({error:'Origin denied'});return fixtures(req,res);
  }
  const name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
  if(!/^[a-zA-Z0-9_.-]+\.(html|js|css)$/.test(name)||!fs.existsSync(path.join(root,name))){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(path.join(root,name)));
 }catch(e){res.statusCode=500;res.end(JSON.stringify({error:'Synthetic harness failure'}));console.error('HARNESS_ERROR '+e.message);}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;env.GS_FINANCE_ORIGINS=origin;
 fs.writeFileSync(process.env.GS_CENTRAL_READY_FILE||'/tmp/gs-central-ready.json',JSON.stringify({origin,actors}));console.log('CENTRAL_READY synthetic-only');
}
let closing=false;async function close(){if(closing)return;closing=true;if(server)await new Promise(resolve=>server.close(resolve));await pool.end();execFileSync(bin+'/pg_ctl',['-D',data,'stop','-m','immediate'],{stdio:'ignore'});process.exit();}
process.on('SIGTERM',close);process.on('SIGINT',close);start().catch(async e=>{console.error(e.message);await close();});
