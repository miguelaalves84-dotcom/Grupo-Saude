/* Grupo Saúde V4 — Neon persistence bridge */
(()=>{'use strict';
async function json(url,opt={}){const h={'Content-Type':'application/json',...(opt.headers||{})};if(opt.method&&opt.method!=='GET'&&!h['Idempotency-Key'])h['Idempotency-Key']=crypto.randomUUID();const r=await fetch(url,{cache:'no-store',...opt,headers:h});const j=await r.json();if(!r.ok)throw new Error(j.message||j.code||'Erro backend');return j}
async function health(){try{const j=await json('/api/v4?health=1');localStorage.setItem('gs_v4_backend_health',JSON.stringify({...j,checkedAt:new Date().toISOString()}));return j}catch(e){return{ok:false,database:'offline',message:e.message}}}
async function clinics(){return(await json('/api/v4?resource=clinics')).items}
async function saveClinic(c){return(await json('/api/v4?resource=clinics',{method:'POST',body:JSON.stringify(c)})).item}
async function users(){return(await json('/api/v4?resource=users')).items}
async function saveUser(u){return(await json('/api/v4?resource=users',{method:'POST',body:JSON.stringify(u)})).item}
async function permissions(){return await json('/api/v4?resource=permissions')}
async function saveTechnicianSale(x){return(await json('/api/v4?resource=technician-sales',{method:'POST',body:JSON.stringify(x)})).item}
async function technicianSales(){return(await json('/api/v4?resource=technician-sales')).items}
async function syncDocumentAlerts(){return await json('/api/v4?resource=sync-document-alerts',{method:'POST',body:'{}'})}
async function processAlertEscalations(){return await json('/api/v4?resource=process-alert-escalations',{method:'POST',body:'{}'})}
async function notificationDeliveries(){return(await json('/api/v4?resource=notification-deliveries')).items}
async function alerts(){return(await json('/api/v4?resource=alerts')).items}
async function documentCompliance(){return(await json('/api/v4?resource=document-compliance')).items}
async function saveDocumentRequirement(x){return(await json('/api/v4?resource=document-requirement',{method:'POST',body:JSON.stringify(x)})).item}
async function addCurrentAccountEntry(x){return(await json('/api/v4?resource=current-account-entry',{method:'POST',body:JSON.stringify(x)})).item}
async function uploadDocument(file,meta={}){const h={'Content-Type':file.type,'X-File-Name':encodeURIComponent(file.name),'X-Document-Kind':meta.kind||'Documento','X-Document-Description':encodeURIComponent(meta.description||'')};if(meta.receiptNo)h['X-Receipt-Number']=encodeURIComponent(meta.receiptNo);if(meta.receiptValue!=null)h['X-Receipt-Value']=String(meta.receiptValue);if(meta.receiptDate)h['X-Receipt-Date']=meta.receiptDate;if(meta.startsAt)h['X-Starts-At']=meta.startsAt;if(meta.validUntil)h['X-Valid-Until']=meta.validUntil;const r=await fetch('/api/v4-upload',{method:'POST',headers:h,body:file});const j=await r.json();if(!r.ok)throw Error(j.code||'Erro no upload');return j.item}
async function addCurrentAccountDocument(x){return await json('/api/v4?resource=current-account-document',{method:'POST',body:JSON.stringify(x)})}
async function currentAccount(userId){return await json('/api/v4?resource=current-account'+(userId?'&userId='+encodeURIComponent(userId):''))}
async function markCurrentAccountPaid(id,paidAt){return(await json('/api/v4?resource=current-account-payment',{method:'POST',body:JSON.stringify({id,paidAt})})).item}
async function migrateClinics(){const h=await health();if(h.database!=='connected')return h;let s={};try{s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2')||'{}')}catch{};const local=(s.clinics||[]).filter(x=>!x.legacyDemo);for(const c of local)await saveClinic({id:c.id,name:c.name,city:c.city||'',domain:c.domain||'',active:c.active!==false});const remote=await clinics();s.clinics=remote.map(x=>({...x,legacyDemo:false}));localStorage.setItem('grupo_saude_v4_demo_2',JSON.stringify(s));return{ok:true,count:remote.length}}
async function syncClinics(){const remote=await clinics();let s={};try{s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2')||'{}')}catch{};if(remote.length){s.clinics=remote;localStorage.setItem('grupo_saude_v4_demo_2',JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs-v4-clinics-synced',{detail:remote}))}return remote}
window.V4Backend={health,clinics,saveClinic,users,saveUser,permissions,saveTechnicianSale,technicianSales,syncDocumentAlerts,processAlertEscalations,notificationDeliveries,alerts,documentCompliance,saveDocumentRequirement,addCurrentAccountEntry,uploadDocument,addCurrentAccountDocument,currentAccount,markCurrentAccountPaid,migrateClinics,syncClinics};
document.addEventListener('DOMContentLoaded',async()=>{const h=await health();if(h.database==='connected'){try{const r=await clinics();if(!r.length)await migrateClinics();else await syncClinics()}catch(e){console.warn('V4 Neon sync',e)}}});
})();