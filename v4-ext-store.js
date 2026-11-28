/* Intermediário dos módulos V4 novos (bónus, bolsa de horas, RH C/D/E e ocorrências, histórias, imagens).
   - Demonstração: grava neste navegador, como antes.
   - Modo servidor (<html data-v4ext="server">): cada ação é enviada para /api/v4-extensions; o servidor aplica as
     regras e as permissões e devolve o estado autorizado, que é espelhado aqui só para mostrar.
   As ações não precisam de ser reescritas: capture() descobre qual regra do núcleo a ação ia usar. */
(()=>{'use strict';const K='grupo_saude_v4_demo_2',R=()=>JSON.parse(localStorage.getItem(K)||'{}');
const server=()=>document.documentElement.dataset.v4ext==='server';
const TARGETS=()=>[['bonus','GSBonus',['setRegulation','setCeoDecision','approve','setRules','addMarketplaceSale']],['hourbank','GSHourBank',['request','decide']],['hrgrowth','GSHRGrowth',['requestData','decideData','addObjective','updateObjective','addOneOnOne','setCompetence','addCertification','removeCertification','addIncident','setIncidentStatus']],['marketing','GSSocialStories',['record','setConsent']],['marketing','GSMarketingImages',[['record','imageRecord']]],['hrlifecycle','GSHRLifecycle',['startOnboarding','tick','addTask','startOffboarding','exitInterview','closeOffboarding','markPosted','savePolicy','recordAccident','reportAccident']],['clinic','GSClinicProfile',['set']]];
const FIELDS=['bonusDecisions','bonusRules','marketplaceSales','hourBank','hrDataRequests','hrObjectives','hrOneOnOnes','hrCompetences','hrCertifications','hrIncidents','socialStories','marketingImages','hrOnboarding','hrOffboarding','hrInsurance','hrVacationMapPosted','hrOnboardingTemplates'];
const CAPTURED={};
/* Executa a ação contra núcleos «gravadores» para saber módulo, regra e argumentos — sem gravar nada. */
function capture(fn){const s=R(),a=window.AttendanceBookV4?.actor(s)||{id:s.currentUser},restore=[];let rec=null;
 for(const [mod,glob,fns] of TARGETS()){const obj=window[glob];if(!obj)continue;for(const f of fns){const [name,alias]=Array.isArray(f)?f:[f,f];const orig=obj[name];restore.push(()=>{obj[name]=orig});obj[name]=(st,ac,...args)=>{rec={module:mod,fn:alias,args};throw CAPTURED}}}
 try{fn(s,a)}catch(e){if(e!==CAPTURED)throw e}finally{restore.forEach(r=>r())}
 if(!rec)throw Error('Ação não reconhecida para o servidor.');return rec}
function mirror(state){if(!state)return;const s=R();for(const f of FIELDS)if(state[f]!==undefined)s[f]=state[f];for(const f of ['days','leave','timeOccurrences','complaints'])if(state[f]!==undefined)s[f]=state[f];
 for(const c of state.clinics||[]){const l=(s.clinics||[]).find(x=>String(x.id)===String(c.id));if(l){for(const k of ['phone','phones','legalEntity','ers'])if(c[k]!==undefined&&(k!=='ers'||c.ers?.license))l[k]=k==='ers'?{...(l.ers||{}),...c.ers}:c[k]}}
 for(const p of state.users||[]){for(const list of [s.users||[],Object.values(s.employees||{})])for(const u of list)if(String(u.id)===String(p.id))u.hr={...(u.hr||{}),...(p.hr||{})}}
 localStorage.setItem(K,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:state-changed'))}
async function request(method,body){const r=await fetch('/api/v4-extensions',{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});let d={};try{d=await r.json()}catch{}if(!r.ok)throw Error(d.error||'Operação não confirmada.');return d}
let pending=Promise.resolve();
/* Usado pelos ecrãs: no modo servidor envia a ação capturada; devolve uma promessa. */
function send(fn){const rec=capture(fn),requestId=(crypto.randomUUID?.()||String(Date.now()));const job=pending.catch(()=>{}).then(()=>request('POST',{...rec,requestId})).then(d=>{mirror(d.state);return d.result});pending=job;return job.catch(e=>{alert(e.message);return undefined})}
async function refresh(){if(!server())return;try{mirror((await request('GET')).state)}catch(e){console.warn('V4: '+e.message)}}
document.addEventListener('DOMContentLoaded',()=>{if(server())refresh()});
window.GSExt={get server(){return server()},capture,send,refresh,mirror};
})();
