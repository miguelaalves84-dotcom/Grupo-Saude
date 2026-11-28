'use strict';
/* Notificações no telemóvel/computador (Web Push) para as tarefas do Assistente Grupo Saúde.
   - Cada pessoa autoriza um aparelho de cada vez; a autorização fica só no servidor (app_settings «push:sub:…»).
   - O envio usa as mesmas mensagens do Assistente: 1 notificação por tarefa por dia (registo «push:sent:…»),
     e a escalada (mais de 1 h depois da hora-limite) chega à Administração e ao CEO.
   - Chaves VAPID só em variáveis do servidor (GS_PUSH_VAPID_PUBLIC / GS_PUSH_VAPID_PRIVATE); nunca no código.
   - Produção: desligado até ser decidido o lançamento. */
const {createHash}=require('node:crypto'),St=require('./app-state-service'),Assistant=require('../chat-assistant-v4');
const SUB='push:sub:',SENT='push:sent:';
const hash=x=>createHash('sha256').update(String(x)).digest('hex').slice(0,24);
function config(env){const pub=String(env.GS_PUSH_VAPID_PUBLIC||'').trim(),priv=String(env.GS_PUSH_VAPID_PRIVATE||'').trim();return{publicKey:pub,privateKey:priv,subject:String(env.GS_PUSH_SUBJECT||'mailto:gruposaude.rh@gmail.com'),enabled:!!pub&&!!priv&&env.VERCEL_ENV!=='production'}}
function status(env){const c=config(env);return{enabled:c.enabled,publicKey:c.enabled?c.publicKey:null}}
/* Armazenamento: por omissão em app_settings; nos testes é substituído por memória. */
function sqlStore(s){return{
 async list(prefix){return(await s.query('select key,value from app_settings where key like $1',[prefix+'%'])).map(r=>({key:r.key,value:typeof r.value==='string'?JSON.parse(r.value):r.value}))},
 async get(key){const r=(await s.query('select value from app_settings where key=$1',[key]))[0];return r?(typeof r.value==='string'?JSON.parse(r.value):r.value):null},
 async put(key,value){await s.query("insert into app_settings(key,value,updated_at) values($1,$2::jsonb,now()) on conflict(key) do update set value=excluded.value,updated_at=now()",[key,JSON.stringify(value)])},
 async del(key){await s.query('delete from app_settings where key=$1',[key])}}}
function validSubscription(sub){return sub&&typeof sub.endpoint==='string'&&/^https:\/\/[^\s]{10,800}$/.test(sub.endpoint)&&sub.keys&&typeof sub.keys.p256dh==='string'&&typeof sub.keys.auth==='string'&&sub.keys.p256dh.length<200&&sub.keys.auth.length<100}
async function subscribe(s,a,body,deps={}){if(!a?.id||a.active===false)throw Object.assign(Error('Sessão inválida.'),{status:401});if(a.readOnly)throw Object.assign(Error('Simulação apenas de leitura.'),{status:403});const sub=body?.subscription;if(!validSubscription(sub))throw Object.assign(Error('Autorização do aparelho inválida.'),{status:400});const store=deps.store||sqlStore(s),key=SUB+String(a.id)+':'+hash(sub.endpoint);
 const mine=await store.list(SUB+String(a.id)+':');if(mine.length>=10&&!mine.some(x=>x.key===key))throw Object.assign(Error('Máximo de 10 aparelhos por pessoa.'),{status:409});
 await store.put(key,{userId:String(a.id),endpoint:sub.endpoint,keys:{p256dh:sub.keys.p256dh,auth:sub.keys.auth},device:String(body.device||'').slice(0,80),at:(deps.now||(()=>new Date().toISOString()))()});return{ok:true,devices:mine.length+(mine.some(x=>x.key===key)?0:1)}}
async function unsubscribe(s,a,body,deps={}){if(!a?.id)throw Object.assign(Error('Sessão inválida.'),{status:401});const store=deps.store||sqlStore(s),endpoint=String(body?.endpoint||'');await store.del(SUB+String(a.id)+':'+hash(endpoint));return{ok:true}}
async function devices(s,a,deps={}){const store=deps.store||sqlStore(s);return{devices:(await store.list(SUB+String(a.id)+':')).length}}
function sender(c,deps){if(deps.send)return deps.send;const wp=require('web-push');wp.setVapidDetails(c.subject,c.publicKey,c.privateKey);return(sub,payload)=>wp.sendNotification({endpoint:sub.endpoint,keys:sub.keys},JSON.stringify(payload),{TTL:4*3600,urgency:'high'})}
async function deliver(store,send,rows,payload,report){for(const r of rows){try{await send(r.value,payload);report.sent++}catch(e){const code=e?.statusCode||e?.status;if(code===404||code===410){await store.del(r.key);report.removed++}else report.failed++}}}
/* Teste: envia uma notificação para os aparelhos da própria pessoa. */
async function test(s,a,env,deps={}){const c=config(env);if(!c.enabled)return{status:'Desligado'};const store=deps.store||sqlStore(s),rows=await store.list(SUB+String(a.id)+':'),report={status:'OK',sent:0,failed:0,removed:0};await deliver(store,sender(c,deps),rows,{title:'Grupo Saúde',body:'As notificações estão ativas neste aparelho.',url:'/',tag:'gs-test'},report);return report}
/* Envio agendado (de 10 em 10 minutos): tarefas novas do Assistente para quem tem aparelhos autorizados. */
async function run(s,env,deps={}){const c=config(env);if(!c.enabled)return{status:'Desligado'};const store=deps.store||sqlStore(s),now=(deps.now||(()=>new Date().toISOString()))(),report={status:'OK',users:0,sent:0,failed:0,removed:0,skipped:0};
 const subs=await store.list(SUB);if(!subs.length)return report;
 const people=typeof s.people==='function'?await s.people():[],ceo=people.find(p=>p.active!==false&&/^ceo$/i.test(String(p.role||'')));if(!ceo)return{...report,status:'Sem conta CEO ativa'};
 const state=(await St.read(s,{...ceo,active:true,permissions:{settings:true,hrManage:true,operation:true,security:true,financeManage:true,reports:true}},0)).state;
 /* pessoas e clínicas vêm sempre da base de dados (fonte oficial), mesmo que ainda não estejam nos dados partilhados */if(!Array.isArray(state.users)||!state.users.length)state.users=people.map(p=>({id:p.id,name:p.name,role:p.role,clinics:p.clinics||[],active:p.active!==false}));if(!Array.isArray(state.clinics)||!state.clinics.length){try{state.clinics=(await s.query('select id,name,active from clinics where active=true')).map(c=>({id:String(c.id),name:c.name,active:true}))}catch{state.clinics=[]}}
 const byUser=new Map();for(const r of subs){const u=String(r.value?.userId||'');if(!u)continue;if(!byUser.has(u))byUser.set(u,[]);byUser.get(u).push(r)}
 const send=sender(c,deps),day=Assistant.lisbon(now).date;
 for(const [uid,rows] of byUser){const p=people.find(x=>String(x.id)===uid);if(!p||p.active===false){report.skipped++;continue}report.users++;
  const todo=Assistant.messages(state,uid,now).filter(m=>m.status==='todo'),sentKey=SENT+uid+':'+day,sent=new Set((await store.get(sentKey))?.ids||[]),fresh=todo.filter(m=>!sent.has(m.id+'|'+m.kind));if(!fresh.length)continue;
  const payloads=fresh.length>3?[{title:'Grupo Saúde — '+fresh.length+' tarefas por fazer',body:fresh.slice(0,3).map(m=>m.clinicName+': '+m.name).join(' · ')+' …',url:'/#chat',tag:'gs-tasks-'+day}]:fresh.map(m=>({title:(m.kind==='escalation'?'⚠ Atrasada — ':'')+m.clinicName,body:m.name+(m.deadline?' — até às '+m.deadline:''),url:'/#chat',tag:'gs-'+m.id+'|'+m.kind}));
  for(const pl of payloads)await deliver(store,send,rows,pl,report);
  for(const m of fresh)sent.add(m.id+'|'+m.kind);await store.put(sentKey,{ids:[...sent].slice(-500),at:now})}
 /* registos de envio de dias antigos deixam de ser precisos */
 for(const r of await store.list(SENT))if(!r.key.endsWith(':'+day))await store.del(r.key);
 return report}
module.exports={config,status,subscribe,unsubscribe,devices,test,run,validSubscription,_hash:hash};
