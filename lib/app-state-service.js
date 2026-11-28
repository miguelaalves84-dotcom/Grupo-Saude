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
 users:[all,any('hrManage','settings','security')],professionals:[all,any('hrManage','settings')],employees:[all,any('hrManage')],candidates:[any('hrManage'),any('hrManage')],rhMail:[any('hrManage'),any('hrManage')],employeeDocuments:[any('hrManage','personal'),any('hrManage','personal')],leave:[all,all],
 timeEntries:[all,all],timeOccurrences:[all,all],chatMessages:[any('settings'),any('settings')],conversations:[all,all],audit:[any('security','settings','reports'),all],
 finance:[any('account','financeManage'),any('financeManage')],marketing:[any('marketing','bookings'),any('marketing','bookings')],
 callCenter:[any('bookings','settings'),any('bookings','settings')],
 agreements:[any('bookings','operation','settings'),any('settings')],
 /* inquéritos: todos leem as perguntas; só CEO/Administração alteram (respostas vão por /surveys, nunca aqui) */
 surveys:[all,all],
 hrDataRequests:[all,all]
};
const fail=(m,status=400)=>{throw Object.assign(Error(m),{extDomain:true,status})};
const parse=x=>{try{return typeof x==='string'?JSON.parse(x):x}catch{return null}};
const policy=k=>POLICY[k]||[all,any('settings')];
const canRead=(a,k)=>!LOCAL.has(k)&&policy(k)[0](a),canWrite=(a,k)=>!LOCAL.has(k)&&!a.readOnly&&policy(k)[1](a);
const PERSONAL=['iban','nif','niss','cc','address','phone','birthDate','emergencyContact','emergencyName','emergencyPhone','city','postalCode','cv','education','languages','skills','dependents','salary','grossSalary','baseSalary','hourlyRate','bonusAmount','bonusLaserCents','bonusMaterialCents','percentageRate','mealCardAccount'];
/* Quem não gere RH vê dos colegas só o necessário para trabalhar (nome, função, clínicas, especialidades). */
/* O valor do prémio de cada colega fica escondido, mas mantém-se a indicação de que está definido (vale 0), para a parte das
   administrativas/Administração (que depende de os técnicos receberem) ser calculada corretamente. */
const BONUS_KEYS=['bonusLaserCents','bonusMaterialCents'];
function redactEmployee(a,id,e){if(A.has(a,'hrManage')||String(id)===String(a.id)||!e||typeof e!=='object')return e;const o={...e};delete o.documents;if(o.hr&&typeof o.hr==='object'){const had=BONUS_KEYS.filter(k=>o.hr[k]!=null&&o.hr[k]!=='');o.hr={...o.hr};for(const k of PERSONAL)delete o.hr[k];for(const k of had)o.hr[k]=0}for(const k of PERSONAL)delete o[k];return o}
/* Quem não trabalha na Operação (ex.: Médico, Técnico) recebe dos dias só o que é seu: linhas de marcadas/realizadas/faltas,
   lasers e material vendidos e sessões particulares — para a «A minha atividade» e o prémio. */
function ownDay(a,d){if(!d||typeof d!=='object')return d;const me=String(a.id),open=(d.open?.professionals||[]).filter(p=>String(p.employeeId)===me),rows=new Set(open.map(p=>p.rowId));return{date:d.date,clinic:d.clinic,closed:!!d.closed,open:{saved:!!d.open?.saved,professionals:open},close:{saved:!!d.close?.saved,professionals:(d.close?.professionals||[]).filter(q=>rows.has(q.rowId)),...(d.close?.techSales?.[me]?{techSales:{[me]:d.close.techSales[me]}}:{}),...(d.close?.privateSessions?{privateSessions:{answer:d.close.privateSessions.answer,rows:(d.close.privateSessions.rows||[]).filter(r=>String(r.employeeId)===me)}}:{})},...(d.stockClosing?.sales?{stockClosing:{sales:d.stockClosing.sales.filter(x=>String(x.employeeId)===me)}}:{})}}
function redact(a,key,sub,v){/* pedidos de alteração de dados: cada pessoa vê só os seus; CEO/Administração e RH veem todos */if(key==='hrDataRequests'&&Array.isArray(v)&&!managerRole(a)&&!A.has(a,'hrManage'))return v.filter(x=>String(x?.employeeId)===String(a.id));if(key==='conversations')return redactConversations(a,v);if(key==='finance'&&!A.has(a,'financeManage')&&v&&typeof v==='object'){const mine=x=>[x?.employeeId,x?.personId,x?.userId].map(String).includes(String(a.id));return{...v,movements:(Array.isArray(v.movements)?v.movements:[]).filter(mine)}}if(key==='days'&&!OPS(a))return ownDay(a,v);if(key==='employees')return redactEmployee(a,sub,v);if(key==='users'&&Array.isArray(v)&&!A.has(a,'hrManage'))return v.map(u=>String(u.id)===String(a.id)?u:{...u,email:undefined,phone:undefined});return v}
/* ---------- Proteções no servidor (o navegador pode ser manipulado: o servidor não confia no que recebe) ---------- */
const same=(x,y)=>JSON.stringify(x??null)===JSON.stringify(y??null);
const managerRole=a=>['CEO','ADMINISTRACAO'].includes(String(a?.role||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase());
const deny=m=>{throw Object.assign(Error(m),{extDomain:true,status:403,guard:true})};
/* Chat: cada pessoa só lê as conversas de que é membro. */
const chatMember=(a,c)=>Array.isArray(c?.members)&&c.members.map(String).includes(String(a.id));
function redactConversations(a,v){return Array.isArray(v)?v.filter(c=>chatMember(a,c)):v}
/* Escrita no Chat: junta as alterações às conversas visíveis, mantém as restantes intactas; mensagens de outros não podem
   ser alteradas (só lidas/reagidas/marcadas como feitas) nem apagadas; mensagens novas só em nome de quem escreve. */
const CHAT_FREE=['readBy','reactions','done','doneHistory'];
function guardConversations(a,old,next){if(!Array.isArray(next))deny('Conversas inválidas.');old=Array.isArray(old)?old:[];const byId=new Map(old.map(c=>[String(c.id),c])),seen=new Set(),out=[];
 for(const c of next){if(!c||c.id==null)deny('Conversa inválida.');const id=String(c.id),prev=byId.get(id);seen.add(id);
  if(!prev){if(!chatMember(a,c))deny('Só pode criar conversas de que faz parte.');if((c.messages||[]).some(m=>String(m.from)!==String(a.id)))deny('Mensagem em nome de outra pessoa.');out.push(c);continue}
  if(!chatMember(a,prev)){if(!same(prev,c))deny('Conversa não autorizada.');continue}
  if(!managerRole(a)&&(!same(prev.members,c.members)||!same(prev.kind,c.kind)))deny('Só CEO/Administração alteram membros de grupos.');
  const msgs=new Map((c.messages||[]).map(m=>[String(m.id),m]));
  for(const m of prev.messages||[]){const n=msgs.get(String(m.id));if(!n){if(String(m.from)!==String(a.id))deny('Não pode apagar mensagens de outras pessoas.');continue}
   if(String(m.from)!==String(a.id)){const strip=x=>Object.fromEntries(Object.entries(x||{}).filter(([k])=>!CHAT_FREE.includes(k)));if(!same(strip(m),strip(n)))deny('Não pode alterar mensagens de outras pessoas.')}}
  const old=new Set((prev.messages||[]).map(m=>String(m.id)));for(const m of c.messages||[])if(!old.has(String(m.id))&&String(m.from)!==String(a.id))deny('Mensagem em nome de outra pessoa.');
  out.push(c)}
 /* conversas que a pessoa não vê (ou não enviou) ficam como estavam */
 for(const c of old)if(!seen.has(String(c.id)))out.push(c);
 return out}
/* Auditoria: só se acrescenta. Ninguém apaga nem altera entradas antigas (quem não as lê também não as apaga ao gravar). */
function guardAudit(a,old,next){if(!Array.isArray(next))deny('Auditoria inválida.');old=Array.isArray(old)?old:[];const known=new Set(old.map(x=>JSON.stringify(x))),fresh=next.filter(x=>!known.has(JSON.stringify(x))).map(x=>({...x,by:x?.by??String(a.id)}));return [...fresh,...old].slice(0,20000)}
/* Ponto, ocorrências e ausências: sem gestão de RH, cada pessoa só cria/altera os seus registos; aprovações são da gestão. */
const ownerOf=x=>String(x?.user??x?.userId??x?.employeeId??'');
const APPROVAL=/aprovad|validad|recusad|rejeitad/i;
function guardOwnList(a,key,old,next){const approver=key==='leave'?A.has(a,'leaveApprove')||A.has(a,'hrManage'):A.has(a,'hrManage');if(approver)return next;if(!Array.isArray(next))deny('Registos inválidos.');old=Array.isArray(old)?old:[];const byId=new Map(old.map(x=>[String(x?.id),x])),ids=new Set(next.map(x=>String(x?.id)));
 for(const x of old)if(!ids.has(String(x?.id))&&ownerOf(x)!==String(a.id))deny('Não pode apagar registos de outros colaboradores.');
 for(const x of next){const prev=byId.get(String(x?.id));if(prev&&same(prev,x))continue;if(ownerOf(x)!==String(a.id)||prev&&ownerOf(prev)!==String(a.id))deny('Só pode registar ou alterar os seus próprios registos.');
  if(APPROVAL.test(String(x?.status||''))&&!(prev&&same(prev.status,x.status)))deny('A aprovação é feita pela gestão.')}
 return next}
/* Dias da Operação: quem não é CEO/Administração não valida caixas, não altera a abertura já fixada nem apaga histórico. */
function guardDay(a,old,next){if(managerRole(a)||!old)return next;if(!next||typeof next!=='object')deny('Dia inválido.');
 for(const f of ['cash','cashRP']){const o=old[f],n=next[f];if(n?.status==='Validada'&&o?.status!=='Validada')deny('Validação da caixa exclusiva de CEO/Administração.');if(o?.status==='Validada'&&!same(o,n))deny('Caixa validada: só CEO/Administração reabrem.')}
 const rows=new Map((next.open?.professionals||[]).map(p=>[String(p.rowId),p]));
 for(const p of old.open?.professionals||[]){if(p.openingLocked!==true)continue;const n=rows.get(String(p.rowId));if(!n)continue;if(n.openingLocked!==true||!same(n.openingBooked,p.openingBooked)||p.kind==='doctor'&&!same(n.currentBooked,p.currentBooked)||p.kind!=='doctor'&&!same(n.capacity,p.capacity))deny('Abertura guardada: números fixos (só CEO/Administração corrigem).')}
 const h=old.history||[];if(h.length&&!same((next.history||[]).slice(0,h.length),h))deny('O histórico do dia não pode ser apagado nem alterado.');
 return next}
function guard(a,key,sub,old,next){if(key==='conversations')return guardConversations(a,old,next);if(key==='audit')return guardAudit(a,old,next);if(['timeEntries','timeOccurrences','leave'].includes(key))return guardOwnList(a,key,old,next);if(key==='days')return guardDay(a,old,next);if(key==='surveys'){if(!managerRole(a))deny('Só CEO/Administração gerem inquéritos.');return next}if(key==='hrDataRequests')return guardDataRequests(a,old,next);return next}
const GUARDED=new Set(['conversations','audit','timeEntries','timeOccurrences','leave','days','surveys','hrDataRequests']);
/* Pedidos de alteração de dados: sem CEO/Administração, cada pessoa só cria pedidos seus e pendentes; decidir é da gestão.
   Os pedidos de outros que a pessoa não vê ficam como estavam. */
function guardDataRequests(a,old,next){if(managerRole(a))return next;if(!Array.isArray(next))deny('Pedidos inválidos.');old=Array.isArray(old)?old:[];const mine=x=>String(x?.employeeId)===String(a.id),byId=new Map(old.map(x=>[String(x?.id),x])),out=[];
 for(const x of next){const prev=byId.get(String(x?.id));if(prev&&same(prev,x)){out.push(x);continue}if(!mine(x)||prev&&!mine(prev))deny('Só pode pedir alterações aos seus próprios dados.');if(x.status!=='Pendente'||prev&&prev.status!=='Pendente')deny('A decisão é da gestão.');out.push(x)}
 const seen=new Set(out.map(x=>String(x?.id)));for(const x of old)if(!seen.has(String(x?.id))){if(mine(x)&&x.status==='Pendente')continue;out.push(x)}
 return out}
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

/* As contas reais (tabela users) mandam no nome, perfil, clínicas e estado ativo/inativo: uma conta desativada ou nova
   aparece logo assim na aplicação, sem depender da cópia guardada no estado partilhado. *//* Guarda no estado partilhado as alterações às contas reais (ativa/inativa, nome, perfil, clínicas) como uma alteração normal:
   assim chegam a todos os aparelhos, mesmo aos que só pedem «o que mudou desde a última vez». No máximo uma vez por minuto. */
let identityCheckedAt=0;
async function persistIdentity(s){if(typeof s.people!=='function'||Date.now()-identityCheckedAt<60000)return;identityCheckedAt=Date.now();let people=[];try{people=await s.people()}catch{return}const sys={id:'system'};
 const cur=await get(s,'users');if(cur&&Array.isArray(cur.v)){const next=cur.v.map(u=>({...u})),byId=new Map(next.map(u=>[String(u.id),u]));for(const p of people){const id=String(p.id),base={name:p.name,role:p.role,kind:p.role,clinics:p.clinics||[],clinicIds:p.clinics||[],active:p.active!==false};const u=byId.get(id);if(u)Object.assign(u,base);else next.push({id,...base,email:p.email})}if(JSON.stringify(next)!==JSON.stringify(cur.v))await put(s,'users',next,Number(cur.rev||0),sys).catch(()=>null)}
 for(const p of people){const k='employees/'+String(p.id),e=await get(s,k);if(!e||!e.v||typeof e.v!=='object'||e.deleted)continue;const want={name:p.name,role:p.role,active:p.active!==false};if(Object.keys(want).some(x=>e.v[x]!==want[x]))await put(s,k,{...e.v,...want,...(p.active===false?{status:'Inativo'}:{})},Number(e.rev||0),sys).catch(()=>null)}}
async function identitySync(s,a,list,emps){if(typeof s.people!=='function')return list;let people=[];try{people=await s.people()}catch{return list}const byId=new Map(list.map(u=>[String(u.id),u]));const out=list.slice();
 for(const p of people){const id=String(p.id),cur=byId.get(id),base={name:p.name,role:p.role,kind:p.role,clinics:p.clinics||[],clinicIds:p.clinics||[],active:p.active!==false};if(cur)Object.assign(cur,base);else out.push(redact(a,'users',undefined,[{id,...base,email:p.email}])[0])}
 /* A ficha de cada colaborador (lista de Recursos Humanos) segue o mesmo estado da conta. */
 if(emps&&typeof emps==='object')for(const p of people){const e=emps[String(p.id)];if(e&&typeof e==='object')Object.assign(e,{name:p.name,role:p.role,active:p.active!==false,...(p.active===false?{status:'Inativo'}:{})})}
 return out}
/* Leitura: tudo o que o perfil pode ver (ou só o que mudou desde «since»). */
async function read(s,a,since=0){if(!a?.id||a.active===false)fail('Sessão inválida.',401);await persistIdentity(s).catch(()=>{});if(!Number(since)&&!(await rows(s,0)).length)await seedFromDb(s,a);const out={},revs={};let top=Number(since)||0;
 for(const r of await rows(s,Number(since)||0)){const [key,sub]=r.key.split('/');if(!canRead(a,key))continue;top=Math.max(top,Number(r.seq||0));const v=redact(a,key,sub,r.v);if(sub!==undefined){(out[key]||=(r.deleted?{}:{}));if(r.deleted)(out.__deleted||=[]).push(key+'/'+sub);else out[key][sub]=v}else out[key]=v;revs[r.key]=r.rev}
 if(!Number(since)&&Array.isArray(out.users))out.users=await identitySync(s,a,out.users,out.employees);
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
   else if(c.deleted){if(GUARDED.has(key)&&!managerRole(a)){denied.push(key);next=undefined;break}next=null;deleted=true}
   else{if(c.rev!=null&&Number(c.rev)!==rev&&key!=='audit'){conflicts.push({key:k,rev,value:redact(a,key,sub,cur?.v)});next=undefined;break}next=c.value}
   if(next!==undefined&&!deleted&&GUARDED.has(key)){try{next=guard(a,key,sub,cur?.v,next)}catch(e){if(!e.guard)throw e;denied.push(key+': '+e.message);next=undefined;break}}
   if(next===undefined)break;
   const n=await put(s,k,deleted?null:next,rev,a);
   if(n!==null){if(deleted)await s.query("update app_settings set value=value||'{\"deleted\":true}'::jsonb where key=$1",[PREFIX+k]);done.push({key:k,rev:rev+1,seq:n});break}
   if(!c.list){const now=await get(s,k);conflicts.push({key:k,rev:Number(now?.rev||0),value:redact(a,key,sub,now?.v)});break}}}
 if(done.length)await s.query("insert into audit_log(actor_id,module,action,entity_type,entity_id,detail) values($1,'Aplicação','APPSTATE_WRITE','appstate',$2,$3::jsonb)",[String(a.id),done.map(d=>d.key).slice(0,20).join(','),JSON.stringify({keys:done.map(d=>d.key)})]).catch(()=>{});
 return{done,conflicts,denied}}
module.exports={persistIdentity,_resetIdentityThrottle:()=>{identityCheckedAt=0},seedFromDb,read,write,canRead,canWrite,applyList,LOCAL,SPLIT,POLICY,redactEmployee};
