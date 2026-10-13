/* Authenticated access facade. No identity, token or operational persistence in browser storage. */
(()=>{'use strict';
 let current=null,revision=0,expiry=0,timer=null;
 function end(){++revision;current=null;expiry=0;if(timer!==null)clearTimeout(timer);timer=null;window.dispatchEvent(new CustomEvent('gs-session-ended'));}
 function scheduleExpiry(){
  if(timer!==null)clearTimeout(timer);
  const remaining=expiry-Date.now();
  if(remaining<=0){end();return;}
  timer=setTimeout(scheduleExpiry,Math.min(remaining,2147483647));
 }
 async function request(url,options={},endOnForbidden=true){
  const started=revision;
  const r=await fetch(url,{...options,credentials:'same-origin',cache:'no-store'});
  const data=await r.json();
  if(!r.ok){if((r.status===401||r.status===403&&endOnForbidden)&&started===revision)end();throw Object.assign(Error(data.error||data.code||'Serviço autenticado indisponível.'),{status:r.status,code:data.code});}
  return data;
 }
 async function refresh(){const version=++revision;try{const result=await request('/api/auth?action=session');if(version!==revision)return null;const deadline=Date.parse(result.expiresAt);if(!result.user?.id||!Number.isFinite(deadline)||deadline<=Date.now())throw Error('Sessão inválida ou expirada.');expiry=deadline;current=Object.freeze({...result.user,permissions:Object.freeze({...result.user.permissions}),clinics:Object.freeze([...(result.user.clinics||[])])});scheduleExpiry();window.dispatchEvent(new CustomEvent('gs-session-confirmed'));return current;}catch(e){if(version===revision)end();throw e;}}
 async function signOut(){end();await request('/api/auth?action=signOut',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});}
 const data={call:async(action,body={},viewAs='')=>{
  const started=revision;
  // The server independently authorizes any view-as identifier and makes it read-only.
  const headers={'content-type':'application/json'};if(viewAs)headers['x-gs-view-as']=String(viewAs);
  const get=['bootstrap','statement','history','entry-detail','document'].includes(action);
  const result=await request('/api/finance?action='+encodeURIComponent(action)+(get?'&'+new URLSearchParams(body):''),{method:get?'GET':'POST',headers,body:get?undefined:JSON.stringify(body)});
  if(started!==revision)throw Error('A sessão mudou durante o pedido. Dados anteriores descartados.');
  return result;
 }};
 const modules=Object.freeze({call:async(action,body={},viewAs='')=>{
  const started=revision,headers={'content-type':'application/json'};
  if(viewAs)headers['x-gs-view-as']=String(viewAs);
  const get=['clinics','stock','documents','history'].includes(action);
  try{
   const result=await request('/api/clinic-stock?action='+encodeURIComponent(action)+(get?'&'+new URLSearchParams(body):''),{method:get?'GET':'POST',headers,body:get?undefined:JSON.stringify(body)},false);
   if(started!==revision)throw Error('A sessão mudou durante o pedido. Dados anteriores descartados.');
   return result;
  }catch(e){
   // A forbidden clinic/action is not a logout. Revalidate identity so revoked sessions still close.
   if(e.status===403&&started===revision)await refresh().catch(()=>{});
   throw e;
  }
 }});
 window.GSSessionV4=Object.freeze({refresh,signOut,get user(){if(current&&expiry<=Date.now())end();return current},data,modules,mode:'authenticated'});
})();
