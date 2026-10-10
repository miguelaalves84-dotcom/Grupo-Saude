/* Authenticated access facade. No identity, token or operational persistence in browser storage. */
(()=>{'use strict';
 let current=null,revision=0;
 async function request(url,options={}){
  const r=await fetch(url,{...options,credentials:'same-origin',cache:'no-store'});
  const data=await r.json();
  if(!r.ok){if(r.status===401||r.status===403){current=null;window.dispatchEvent(new CustomEvent('gs-session-ended'));}throw Error(data.error||data.code||'Serviço autenticado indisponível.');}
  return data;
 }
 async function refresh(){const version=++revision;try{const result=await request('/api/auth?action=session');if(version!==revision)return null;current=Object.freeze({...result.user});return current;}catch(e){if(version===revision){current=null;window.dispatchEvent(new CustomEvent('gs-session-ended'));}throw e;}}
 async function signOut(){++revision;current=null;try{await request('/api/auth?action=signOut',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})}finally{window.dispatchEvent(new CustomEvent('gs-session-ended'));}}
 const data={call:async(action,body={},viewAs='')=>{
  // The server independently authorizes any view-as identifier and makes it read-only.
  const headers={'content-type':'application/json'};if(viewAs)headers['x-gs-view-as']=String(viewAs);
  const get=['bootstrap','statement','history','entry-detail','document'].includes(action);
  return request('/api/finance?action='+encodeURIComponent(action)+(get?'&'+new URLSearchParams(body):''),{method:get?'GET':'POST',headers,body:get?undefined:JSON.stringify(body)});
 }};
 window.GSSessionV4=Object.freeze({refresh,signOut,get user(){return current},data,mode:'authenticated'});
})();
