'use strict';
/* Estado partilhado da aplicação no servidor (ambiente de testes): liga todos os módulos ao servidor de uma vez.
   - Cada bloco de dados (clínicas, dias de operação, pedidos, ponto, RH, financeiro, chat…) é guardado em app_settings
     com a chave «appstate:<bloco>», com número de revisão e um número de sequência global (para trazer só o que mudou).
   - Leitura e escrita por bloco seguem as permissões do perfil autenticado (o navegador não é confiável).
   - Listas com «id» (pedidos, marcações, mensagens…) são alteradas elemento a elemento: duas pessoas podem gravar ao
     mesmo tempo sem se apagarem. Mapas grandes (dias, colaboradores) são guardados entrada a entrada.
   - Dados só do navegador (utilizador simulado, clínica/fase escolhidas, marcas da demonstração) nunca vão para o servidor.
   - Cada escrita fica em audit_log com o autor. */
const A=require('./authorization-service');
const PREFIX='appstate:',SEQ=PREFIX+'__seq';
const LOCAL=new Set(['currentUser','ceoRealUser','ceoViewingAs','opClinic','opDate','opPhase','version','security','accessLogs','notificationPrefs','gsTestBatches','fictitiousSeedV1','demoCatalogFixV1','demoPilotPortimaoV1','testBaseSeededV1','syntheticClerkClinicRepair','syntheticProfileClinicRepairs','documentCatalogMigration','authenticatedSubject','authMode']);
const SPLIT=new Set(['days','employees','clinicSpecialties','clinicCalendars']);
const any=(...k)=>a=>k.some(x=>A.has(a,x)),all=()=>true;
const OPS=any('operation','openClinic','clinicTasks','closeClinic','bookings','reports');
/* bloco → [quem lê, quem escreve]. Blocos não listados: todos leem, só CEO/Administração (settings) escrevem. */
const POLICY={
 clinics:[all,any('settings')],clinicSpecialties:[all,any('settings')],clinicStructure:[all,any('settings')],clinicCalendars:[all,any('settings','hrManage')],masterSpecialties:[all,any('settings')],jobRoles:[all,any('settings','hrManage')],contractTypes:[all,any('settings','hrManage')],documentCatalog:[all,any('settings','hrManage')],masterDocuments:[all,any('settings','hrManage')],roleActionPermissions:[all,any('settings','security')],tasks:[all,any('settings','operation')],
 days:[all,OPS],internalQueue:[OPS,OPS],requests:[OPS,OPS],reports:[OPS,OPS],alerts:[all,all],
 users:[all,any('hrManage','settings','security')],professionals:[all,any('hrManage','settings')],employees:[all,any('hrManage')],candidates:[any('hrManage'),any('hrManage')],employeeDocuments:[any('hrManage','personal'),any('hrManage','personal')],leave:[all,all],
 timeEntries:[all,all],timeOccurrences:[all,all],chatMessages:[all,all],conversations:[all,all],audit:[any('security','settings','reports'),all],
 finance:[any('account','financeManage'),any('financeManage','account')],marketing:[any('marketing','bookings'),any('marketing','bookings')]
};
const fail=(m,status=400)=>{throw Object.assign(Error(m),{extDomain:true,status})};
const parse=x=>{try{return typeof x==='string'?JSON.parse(x):x}catch{return null}};
const policy=k=>POLICY[k]||[all,any('settings')];
const canRead=(a,k)=>!LOCAL.has(k)&&policy(k)[0](a),canWrite=(a,k)=>!LOCAL.has(k)&&!a.readOnly&&policy(k)[1](a);
const PERSONAL=['iban','nif','niss','cc','address','phone','birthDate','emergencyContact','dependents','salary','grossSalary','baseSalary','hourlyRate','bonusAmount','bonusLaserCents','bonusMaterialCents','percentageRate','mealCardAccount'];
/* Quem não gere RH vê dos colegas só o necessário para trabalhar (nome, função, clínicas, especialidades). */
/* O valor do prémio de cada colega fica escondido, mas mantém-se a indicação de que está definido (vale 0), para a parte das
   administrativas/Administração (que depende de os técnicos receberem) ser calculada corretamente. */
const BONUS_KEYS=['bonusLaserCents','bonusMaterialCents'];
function redactEmployee(a,id,e){if(A.has(a,'hrManage')||String(id)===String(a.id)||!e||typeof e!=='object')return e;const o={...e};delete o.documents;if(o.hr&&typeof o.hr==='object'){const had=BONUS_KEYS.filter(k=>o.hr[k]!=null&&o.hr[k]!=='');o.hr={...o.hr};for(const k of PERSONAL)delete o.hr[k];for(const k of had)o.hr[k]=0}for(const k of PERSONAL)delete o[k];return o}
/* Quem não trabalha na Operação (ex.: Médico, Técnico) recebe dos dias só o que é seu: linhas de marcadas/realizadas/faltas,
   lasers e material vendidos e sessões particulares — para a «A minha atividade» e o prémio. */
function ownDay(a,d){if(!d||typeof d!=='object')return d;const me=String(a.id),open=(d.open?.professionals||[]).filter(p=>String(p.employeeId)===me),rows=new Set(open.map(p=>p.rowId));return{date:d.date,clinic:d.clinic,closed:!!d.closed,open:{saved:!!d.open?.saved,professionals:open},close:{saved:!!d.close?.saved,professionals:(d.close?.professionals||[]).filter(q=>rows.has(q.rowId)),...(d.close?.techSales?.[me]?{techSales:{[me]:d.close.techSales[me]}}:{}),...(d.close?.privateSessions?{privateSessions:{answer:d.close.privateSessions.answer,rows:(d.close.privateSessions.rows||[]).filter(r=>String(r.employeeId)===me)}}:{})},...(d.stockClosing?.sales?{stockClosing:{sales:d.stockClosing.sales.filter(x=>String(x.employeeId)===me)}}:{})}}
function redact(a,key,sub,v){if(key==='days'&&!OPS(a))return ownDay(a,v);if(key==='employees')return redactEmployee(a,sub,v);if(key==='users'&&Array.isArray(v)&&!A.has(a,'hrManage'))return v.map(u=>String(u.id)===String(a.id)?u:{...u,email:undefined,phone:undefined});return v}
async function rows(s,since=0){const r=await s.query("select key,value from app_settings where key like 'appstate:%' and key<>$1",[SEQ]);return r.map(x=>({key:x.key.slice(PREFIX.length),...(parse(x.value)||{})})).filter(x=>Number(x.seq||0)>since)}
async function seq(s){const r=await s.query("insert into app_settings(key,value,updated_at) values($1,'{\"n\":1}'::jsonb,now()) on conflict(key) do update set value=jsonb_build_object('n',(app_settings.value->>'n')::bigint+1),updated_at=now() returning value",[SEQ]);return Number((parse(r[0].value)||{}).n)}
async function get(s,k){const r=(await s.query('select value from app_settings where key=$1',[PREFIX+k]))[0];return r?parse(r.value):null}
async function put(s,k,v,rev,a){const n=await seq(s),value=JSON.stringify({v,rev:rev+1,seq:n,by:String(a.id),at:new Date().toISOString()});
 if(rev===0){const r=await s.query("insert into app_settings(key,value,updated_at) values($1,$2::jsonb,now()) on conflict(key) do nothing returning key",[PREFIX+k,value]);return r.length?n:null}
 const r=await s.query("update app_settings set value=$2::jsonb,updated_at=now() where key=$1 and (value->>'rev')::int=$3 returning key",[PREFIX+k,value,rev]);return r.length?n:null}
/* Primeira utilização: o estado começa com as clínicas, os utilizadores e as fichas que já estão no servidor
   (nunca com dados de demonstração). As listas operacionais começam vazias. */
async function seedFromDb(s,a){const clinics=(await s.query('select id,name,active from clinics order by id')).map(c=>({id:String(c.id),name:c.name,active:c.active!==false,operational:true}));
 const people=typeof s.people==='function'?await s.people():[],emps=await s.query('select user_id,data from employees order by updated_at nulls first').catch(()=>[]),byUser={};for(const e of emps){if(e.user_id)byUser[String(e.user_id)]=parse(e.data)||{}}
 const users=people.map(p=>({id:String(p.id),name:p.name,role:p.role,kind:p.role,clinics:p.clinics||[],clinicIds:p.clinics||[],active:p.active!==false,email:p.email}));
 const changes=[{key:'clinics',value:clinics},{key:'users',value:users},...users.map(u=>({key:'employees',sub:u.id,value:{...(byUser[u.id]||{}),id:u.id,name:u.name,role:u.role,clinics:u.clinics,active:u.active}})),...['requests','audit','conversations','chatMessages','candidates','timeEntries','timeOccurrences','internalQueue','leave','alerts','reports'].map(k=>({key:k,value:[]})),{key:'jobRoles',value:['Fisioterapeuta','Auxiliar de fisioterapia','Administrativa','Médico/a fisiatra','Osteopata','Nutricionista'].map((name,i)=>({id:'jr'+(i+1),name,active:true}))}];
 const sys={id:a.id,active:true,permissions:{settings:true,hrManage:true,operation:true,security:true},role:'CEO'};
 for(const c of changes){const k=c.sub?c.key+'/'+c.sub:c.key;if(await get(s,k))continue;await put(s,k,c.value,0,sys)}}
/* Leitura: tudo o que o perfil pode ver (ou só o que mudou desde «since»). */
async function read(s,a,since=0){if(!a?.id||a.active===false)fail('Sessão inválida.',401);if(!Number(since)&&!(await rows(s,0)).length)await seedFromDb(s,a);const out={},revs={};let top=Number(since)||0;
 for(const r of await rows(s,Number(since)||0)){const [key,sub]=r.key.split('/');if(!canRead(a,key))continue;top=Math.max(top,Number(r.seq||0));const v=redact(a,key,sub,r.v);if(sub!==undefined){(out[key]||=(r.deleted?{}:{}));if(r.deleted)(out.__deleted||=[]).push(key+'/'+sub);else out[key][sub]=v}else out[key]=v;revs[r.key]=r.rev}
 const writable=Object.keys(POLICY).filter(k=>canWrite(a,k));return{state:out,revisions:revs,seq:top,writable,user:{id:String(a.id),name:a.name,role:a.role,clinics:a.clinics||[],permissions:a.permissions||{}}}}
function applyList(cur,op){const list=Array.isArray(cur)?cur.slice():[],idx=new Map(list.map((x,i)=>[String(x?.id),i]));for(const it of op.upsert||[]){if(!it||it.id==null)continue;const i=idx.get(String(it.id));if(i===undefined){idx.set(String(it.id),list.length);list.push(it)}else list[i]=it}const rm=new Set((op.remove||[]).map(String));return rm.size?list.filter(x=>!rm.has(String(x?.id))):list}
/* Escrita: changes = [{key, sub?, value | list:{upsert,remove} | deleted:true, rev}] */
async function write(s,a,b){if(!a?.id||a.active===false)fail('Sessão inválida.',401);if(a.readOnly)fail('Simulação apenas de leitura.',403);const changes=Array.isArray(b.changes)?b.changes:[];if(changes.length>400)fail('Demasiadas alterações de uma vez.',413);
 const done=[],conflicts=[],denied=[];
 for(const c of changes){const key=String(c.key||''),sub=c.sub==null?undefined:String(c.sub);if(!key||!/^[A-Za-z0-9_]+$/.test(key)||(sub!==undefined&&!/^[A-Za-z0-9_.:-]{1,120}$/.test(sub))){denied.push(key);continue}
  if(!canWrite(a,key)){denied.push(key);continue}
  if(SPLIT.has(key)&&sub===undefined){denied.push(key);continue}
  const k=sub!==undefined?key+'/'+sub:key;
  for(let attempt=0;attempt<5;attempt++){const cur=await get(s,k),rev=Number(cur?.rev||0);let next,deleted=false;
   if(c.list){next=applyList(cur?.v,c.list)}
   else if(c.deleted){next=null;deleted=true}
   else{if(c.rev!=null&&Number(c.rev)!==rev){conflicts.push({key:k,rev,value:redact(a,key,sub,cur?.v)});next=undefined;break}next=c.value}
   if(next===undefined)break;
   const n=await put(s,k,deleted?null:next,rev,a);
   if(n!==null){if(deleted)await s.query("update app_settings set value=value||'{\"deleted\":true}'::jsonb where key=$1",[PREFIX+k]);done.push({key:k,rev:rev+1,seq:n});break}
   if(!c.list){const now=await get(s,k);conflicts.push({key:k,rev:Number(now?.rev||0),value:redact(a,key,sub,now?.v)});break}}}
 if(done.length)await s.query("insert into audit_log(actor_id,module,action,entity_type,entity_id,detail) values($1,'Aplicação','APPSTATE_WRITE','appstate',$2,$3::jsonb)",[String(a.id),done.map(d=>d.key).slice(0,20).join(','),JSON.stringify({keys:done.map(d=>d.key)})]).catch(()=>{});
 return{done,conflicts,denied}}
module.exports={seedFromDb,read,write,canRead,canWrite,applyList,LOCAL,SPLIT,POLICY,redactEmployee};
