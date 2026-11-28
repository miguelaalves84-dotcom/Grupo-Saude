/* Ligação de todos os módulos ao servidor (ambiente de testes).
   - Sem sessão: a aplicação continua em demonstração, exatamente como antes.
   - Com sessão real (/api/auth?action=session): os dados vêm do servidor e cada alteração é enviada para lá,
     bloco a bloco, com as permissões do perfil verificadas no servidor. A cada 20 s traz o que outros mudaram.
   - Os módulos não mudam: continuam a ler/gravar o mesmo estado local; este script sincroniza esse estado.
   - Em caso de conflito (duas pessoas a mudar o mesmo bloco ao mesmo tempo) fica a versão do servidor e aparece aviso. */
(function(){'use strict';
 const K='grupo_saude_v4_demo_2',META='gs-sync-meta-v1',FLAG='gs-sync-server',API='/api/v4-extensions?resource=appstate';
 const LOCAL=new Set(['currentUser','ceoRealUser','ceoViewingAs','opClinic','opDate','opPhase','version','security','accessLogs','notificationPrefs','gsTestBatches','fictitiousSeedV1','demoCatalogFixV1','demoPilotPortimaoV1','testBaseSeededV1','syntheticClerkClinicRepair','syntheticProfileClinicRepairs','documentCatalogMigration','authenticatedSubject','authMode']);
 const SPLIT=new Set(['days','employees','clinicSpecialties','clinicCalendars']);
 const root=document.documentElement,ss=(()=>{try{return sessionStorage}catch{return null}})();
 const origSet=Storage.prototype.setItem;
 const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x)),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const readLocal=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch{return{}}};
 const writeLocal=s=>origSet.call(localStorage,K,JSON.stringify(s));
 let base={},revs={},seq=0,active=false,timer=0,busy=false,again=false,writable=null,bootAt=0;const KNOWN=new Set(['clinics','clinicSpecialties','clinicStructure','clinicCalendars','masterSpecialties','jobRoles','contractTypes','documentCatalog','masterDocuments','roleActionPermissions','tasks','days','internalQueue','requests','reports','alerts','users','professionals','employees','candidates','rhMail','employeeDocuments','leave','timeEntries','timeOccurrences','chatMessages','conversations','audit','finance','marketing','surveys','hrDataRequests']);
 const mayWrite=k=>!writable||writable.has(k)||(!KNOWN.has(k)&&writable.has('__settings'));
 /* Marca cedo (antes dos outros scripts) para que a demonstração não semeie dados fictícios. */
 if(ss?.getItem(FLAG)==='1'){root.dataset.sync='server'}
 function notice(text,kind){let el=document.getElementById('gsSyncNotice');if(!el){el=document.createElement('div');el.id='gsSyncNotice';el.setAttribute('role','status');el.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:9999;max-width:min(560px,calc(100vw - 32px));padding:10px 16px;border-radius:12px;font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.2)';document.body.append(el)}el.style.background=kind==='warn'?'#7a4b00':'#0f5f5a';el.style.color='#fff';el.textContent=text;el.hidden=false;clearTimeout(el._t);el._t=setTimeout(()=>{el.hidden=true},6000)}
 function isList(v){return Array.isArray(v)&&v.every(x=>x&&typeof x==='object'&&!Array.isArray(x)&&x.id!=null)}
 /* Diferenças entre o que o servidor tem (base) e o estado local atual. */
 function diff(cur,all){const out=[];const keys=new Set([...Object.keys(cur),...Object.keys(base)]);
  for(const k of keys){if(LOCAL.has(k)||k.startsWith('__'))continue;if(!all&&!mayWrite(k))continue;const a=base[k],b=cur[k];if(eq(a,b))continue;
   if(SPLIT.has(k)){const A=a&&typeof a==='object'?a:{},B=b&&typeof b==='object'?b:{};for(const sk of new Set([...Object.keys(A),...Object.keys(B)])){if(eq(A[sk],B[sk]))continue;out.push(sk in B?{key:k,sub:sk,value:B[sk]}:{key:k,sub:sk,deleted:true})}continue}
   if(isList(b)&&(a===undefined||isList(a))){const old=new Map((a||[]).map(x=>[String(x.id),x])),now=new Set(b.map(x=>String(x.id)));out.push({key:k,list:{upsert:b.filter(x=>!eq(old.get(String(x.id)),x)),remove:[...old.keys()].filter(id=>!now.has(id))}});continue}
   out.push({key:k,value:b===undefined?null:b,rev:revs[k]||0})}
  return out}
 function setPath(obj,key,sub,value,deleted){if(sub===undefined){if(deleted)delete obj[key];else obj[key]=clone(value);return}obj[key]=obj[key]&&typeof obj[key]==='object'?obj[key]:{};if(deleted)delete obj[key][sub];else obj[key][sub]=clone(value)}
 async function push(){if(!active)return;if(busy){again=true;return}busy=true;try{const cur=readLocal();
   /* Blocos que este perfil não pode gravar (o servidor recusaria): normalmente arrumações automáticas dos módulos; ficam só neste aparelho e não são enviados. */
   const ro=[...new Set(diff(cur,true).map(c=>c.key).filter(k=>!mayWrite(k)))];if(ro.length)console.info('[GSServerSync] não enviado (sem permissão):',ro.join(', '));
   const changes=diff(cur);if(!changes.length)return;
   const r=await fetch(API,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({changes})});
   if(r.status===401){stop('A sessão terminou. Inicie sessão de novo para continuar a gravar no servidor.');return}
   const d=await r.json();if(!r.ok)throw Error(d.error||'Falha ao gravar');
   for(const x of d.done||[]){const [k,sk]=x.key.split('/');revs[x.key]=x.rev;seq=Math.max(seq,x.seq||0);setPath(base,k,sk,sk===undefined?cur[k]:cur[k]?.[sk],sk!==undefined&&!(cur[k]&&sk in cur[k]))}
   let changedLocal=false;const local=readLocal();
   for(const c of d.conflicts||[]){const [k,sk]=c.key.split('/');revs[c.key]=c.rev;setPath(base,k,sk,c.value);setPath(local,k,sk,c.value);changedLocal=true}
   for(const k of d.denied||[]){if(k in base){local[k]=clone(base[k])}else delete local[k];changedLocal=true}
   if(changedLocal){writeLocal(local);rerender();if(d.conflicts?.length)notice('Outra pessoa alterou os mesmos dados ao mesmo tempo. Foram carregados os dados mais recentes do servidor.','warn');if(d.denied?.length)notice('Sem permissão para gravar: '+[...new Set(d.denied)].join(', ')+'. A alteração foi anulada.','warn')}
   saveMeta()}catch(e){notice('Sem ligação ao servidor. As alterações ficam neste aparelho e são enviadas quando voltar a ligação.','warn')}finally{busy=false;if(again){again=false;schedule()}}}
 function schedule(){clearTimeout(timer);timer=setTimeout(push,700)}
 async function pull(){if(!active||busy)return;try{const r=await fetch(API+'&since='+seq,{credentials:'same-origin',cache:'no-store'});if(r.status===401)return stop('A sessão terminou.');const d=await r.json();if(!r.ok)return;
   const local=readLocal(),pending=new Set(diff(local).map(c=>c.key));let changed=false;
   for(const [k,v] of Object.entries(d.state||{})){if(LOCAL.has(k)||k==='__deleted')continue;if(SPLIT.has(k)){for(const [sk,sv] of Object.entries(v||{})){if(pending.has(k)&&!eq(base[k]?.[sk],local[k]?.[sk]))continue;setPath(base,k,sk,sv);setPath(local,k,sk,sv);changed=true}}else{if(pending.has(k)&&isList(v)&&isList(local[k]||[])){const old=new Map((base[k]||[]).map(x=>[String(x.id),x])),mine=new Map((local[k]||[]).map(x=>[String(x.id),x])),out=[];for(const x of v){const id=String(x.id);if(mine.has(id)&&!eq(old.get(id),mine.get(id)))out.push(mine.get(id));else if(!old.has(id)||mine.has(id))out.push(x)}for(const [id,x] of mine)if(!old.has(id)&&!v.some(y=>String(y.id)===id))out.push(x);base[k]=clone(v);local[k]=out;changed=true;continue}if(pending.has(k))continue;base[k]=clone(v);local[k]=clone(v);changed=true}}
   for(const p of d.state?.__deleted||[]){const [k,sk]=p.split('/');setPath(base,k,sk,null,true);setPath(local,k,sk,null,true);changed=true}
   Object.assign(revs,d.revisions||{});seq=Math.max(seq,d.seq||0);saveMeta();if(changed){writeLocal(local);rerender()}}catch{}}
 function rerender(){const typing=document.activeElement&&/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);if(typing||document.querySelector('dialog[open]'))return notice('Há dados novos de outros utilizadores; a página atualiza quando terminar o que está a escrever.');try{const v=document.querySelector('.view.active')?.id;if(window.App?.showView&&v)window.App.showView(v)}catch{}document.dispatchEvent(new CustomEvent('gs:state-changed'))}
 function saveMeta(){try{origSet.call(localStorage,META,JSON.stringify({seq,revs}))}catch{}}
 function stop(msg){active=false;root.dataset.sync='';ss?.removeItem(FLAG);notice(msg,'warn')}
 async function boot(){root.dataset.syncBoot='pending';let session;try{const r=await fetch('/api/auth?action=session',{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw 0;session=await r.json();if(session.mfaRequired){location.assign('/account.html?next=/');return}if(!session.user?.id)throw 0}catch{if(ss?.getItem(FLAG)==='1'){ss.removeItem(FLAG);root.dataset.sync='';location.reload();return}root.dataset.syncBoot='done';return}
  root.dataset.sync='server';const first=ss?.getItem(FLAG)!=='1';ss?.setItem(FLAG,'1');
  const r=await fetch(API+'&since=0',{credentials:'same-origin',cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok){notice('O servidor recusou os dados: '+(d.error||r.status)+'. A aplicação continua em demonstração.','warn');ss?.removeItem(FLAG);root.dataset.sync='';return}
  const local=readLocal(),next={};for(const k of LOCAL)if(k in local)next[k]=local[k];
  for(const [k,v] of Object.entries(d.state||{}))if(k!=='__deleted')next[k]=v;
  const u=d.user||{},users=Array.isArray(next.users)?next.users:[];if(!users.some(x=>String(x.id)===String(u.id)))users.push({id:u.id,name:u.name,role:u.role,kind:u.role,clinics:u.clinics||[],active:true});next.users=users;
  next.currentUser=String(u.id);next.ceoRealUser=String(u.id);next.authenticatedSubject=String(u.id);next.authMode='real';const mine=(u.clinics||[]).map(String);if(!next.opClinic||!(next.clinics||[]).some(c=>String(c.id)===String(next.opClinic))||(mine.length&&!mine.includes(String(next.opClinic))))next.opClinic=mine[0]||(next.clinics||[])[0]?.id||'';
  base=clone(next);for(const k of LOCAL)delete base[k];revs=d.revisions||{};seq=d.seq||0;writable=new Set(d.writable||[]);if(writable.has('settings')||writable.has('clinics'))writable.add('__settings');bootAt=Date.now();saveMeta();
  const changed=localStorage.getItem(K)!==JSON.stringify(next);writeLocal(next);active=true;
  const banner=document.querySelector('aside.notice');if(banner)banner.textContent='Ligado ao servidor de testes como '+(u.name||'utilizador')+' · '+(u.role||'')+'. As alterações são gravadas no servidor.';
  if(first&&changed){/* Recarrega já com os dados novos, sem mostrar o programa antigo a desaparecer: o ecrã de carregamento fica visível. */try{ss?.setItem('gs-boot-reloading','1')}catch{}const t=document.getElementById('gsBootText');if(t)t.textContent='A atualizar com os dados mais recentes…';root.classList.add('gs-booting');location.reload();return}root.dataset.syncBoot='done';
  setInterval(pull,20000);addEventListener('focus',pull);addEventListener('online',schedule);schedule()}
 /* Qualquer gravação do estado (por qualquer módulo) é enviada ao servidor. */
 Storage.prototype.setItem=function(k,v){origSet.call(this,k,v);if(active&&this===localStorage&&k===K)schedule()};
 window.GSServerSync={get active(){return active},push,pull,diff:c=>diff(c||readLocal()),_test:{setBase:b=>{base=clone(b)},isList}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
