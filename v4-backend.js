/* Grupo Saúde V4 — Neon persistence bridge */
(()=>{'use strict';
async function json(url,opt={}){const h={'Content-Type':'application/json',...(opt.headers||{})};if(opt.method&&opt.method!=='GET'&&!h['Idempotency-Key'])h['Idempotency-Key']=crypto.randomUUID();const r=await fetch(url,{cache:'no-store',...opt,headers:h});const j=await r.json();if(!r.ok){const e=new Error(j.message||j.code||'Erro backend');e.data=j;throw e}return j}
async function health(){try{const j=await json('/api/v4?health=1');localStorage.setItem('gs_v4_backend_health',JSON.stringify({...j,checkedAt:new Date().toISOString()}));return j}catch(e){return{ok:false,database:'offline',message:e.message}}}
async function systemHealth(){return await json('/api/v4?resource=system-health')}
async function auditLog(moduleName='',limit=250){const q='/api/v4?resource=audit-log&limit='+encodeURIComponent(limit)+(moduleName?'&module='+encodeURIComponent(moduleName):'');return(await json(q)).items}
async function privacyExport(userId=''){return await json('/api/v4?resource=privacy-export'+(userId?'&userId='+encodeURIComponent(userId):''))}
async function clinicDay(clinicId){return(await json('/api/v4?resource=clinic-day&clinicId='+encodeURIComponent(clinicId))).item}
async function openClinicDay(clinicId,data={}){return(await json('/api/v4?resource=clinic-day-open',{method:'POST',body:JSON.stringify({clinicId,data})})).item}
async function closeClinicDay(clinicId,data={}){return(await json('/api/v4?resource=clinic-day-close',{method:'POST',body:JSON.stringify({clinicId,data})})).item}
async function managementReport(period='month'){return await json('/api/v4?resource=management-report&period='+encodeURIComponent(period))}
async function monthlyConsolidation(){return await json('/api/v4?resource=monthly-consolidation')}
async function clinics(){return(await json('/api/v4-clinic-gps')).items}
async function saveClinic(c){return(await json('/api/v4-clinic-gps?action=save',{method:'POST',body:JSON.stringify(c)})).item}
async function checkClockInGps(clinicId,position){return await json('/api/v4-clinic-gps?action=clock-in-check',{method:'POST',body:JSON.stringify({clinicId,...position})})}
async function currentGps(){return await new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('Geolocalização indisponível'));navigator.geolocation.getCurrentPosition(p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy}),reject,{enableHighAccuracy:true,timeout:15000,maximumAge:0})})}
async function validateClockInAtClinic(clinicId){const pos=await currentGps();return await checkClockInGps(clinicId,pos)}
async function users(){return(await json('/api/v4?resource=users')).items}
async function saveUser(u){return(await json('/api/v4?resource=users',{method:'POST',body:JSON.stringify(u)})).item}
async function permissions(){return await json('/api/v4?resource=permissions')}
async function saveTechnicianSale(x){return(await json('/api/v4?resource=technician-sales',{method:'POST',body:JSON.stringify(x)})).item}
async function technicianSales(){return(await json('/api/v4?resource=technician-sales')).items}
async function syncDocumentAlerts(){return await json('/api/v4?resource=sync-document-alerts',{method:'POST',body:'{}'})}
async function settings(){return(await json('/api/v4?resource=settings')).items}
async function saveSetting(key,value){return(await json('/api/v4?resource=settings',{method:'POST',body:JSON.stringify({key,value})})).item}
async function processAlertEscalations(){return await json('/api/v4?resource=process-alert-escalations',{method:'POST',body:'{}'})}
async function notificationDeliveries(){return(await json('/api/v4?resource=notification-deliveries')).items}
async function alerts(){return(await json('/api/v4?resource=alerts')).items}
async function employeeDocuments(employeeId){return(await json('/api/v4?resource=employee-documents&employeeId='+encodeURIComponent(employeeId))).items}
async function supersedeDocument(oldDocumentId,newDocumentId){return await json('/api/v4?resource=supersede-document',{method:'POST',body:JSON.stringify({oldDocumentId,newDocumentId})})}
async function documentUrl(id){return '/api/v4-document?id='+encodeURIComponent(id)}
async function candidates(){return(await json('/api/v4?resource=candidates')).items}
async function ingestCandidateEmail(x){return await json('/api/v4?resource=candidate-email-ingest',{method:'POST',body:JSON.stringify(x)})}
async function documentCompliance(){return(await json('/api/v4?resource=document-compliance')).items}
async function saveDocumentRequirement(x){return(await json('/api/v4?resource=document-requirement',{method:'POST',body:JSON.stringify(x)})).item}
async function addCurrentAccountEntry(x){return(await json('/api/v4?resource=current-account-entry',{method:'POST',body:JSON.stringify(x)})).item}
async function uploadDocument(file,meta={}){const h={'Content-Type':file.type,'X-File-Name':encodeURIComponent(file.name),'X-Document-Kind':meta.kind||'Documento','X-Document-Description':encodeURIComponent(meta.description||'')};if(meta.receiptNo)h['X-Receipt-Number']=encodeURIComponent(meta.receiptNo);if(meta.receiptValue!=null)h['X-Receipt-Value']=String(meta.receiptValue);if(meta.receiptDate)h['X-Receipt-Date']=meta.receiptDate;if(meta.startsAt)h['X-Starts-At']=meta.startsAt;if(meta.validUntil)h['X-Valid-Until']=meta.validUntil;if(meta.employeeId)h['X-Employee-Id']=meta.employeeId;if(meta.candidateId)h['X-Candidate-Id']=meta.candidateId;const r=await fetch('/api/v4-upload',{method:'POST',headers:h,body:file});const j=await r.json();if(!r.ok){if(j.code==='AUTH_REQUIRED'){const dataUrl=await new Promise((ok,no)=>{const fr=new FileReader();fr.onload=()=>ok(String(fr.result||''));fr.onerror=no;fr.readAsDataURL(file)});return{id:'local_doc_'+Date.now(),name:file.name,type:file.type,size:file.size,dataUrl,kind:meta.kind||'Documento',description:meta.description||'',employeeId:meta.employeeId||'',status:'Pendente',uploadedAt:new Date().toISOString(),storage:'preview-local'}}throw Error(j.code||'Erro no upload')}return j.item}
async function addCurrentAccountDocument(x){return await json('/api/v4?resource=current-account-document',{method:'POST',body:JSON.stringify(x)})}
async function currentAccount(userId){return await json('/api/v4?resource=current-account'+(userId?'&userId='+encodeURIComponent(userId):''))}
async function markCurrentAccountPaid(id,paidAt){return(await json('/api/v4?resource=current-account-payment',{method:'POST',body:JSON.stringify({id,paidAt})})).item}
async function syncClinics(){const remote=await clinics();let s={};try{s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2')||'{}')}catch{};if(remote.length){s.clinics=remote.map(x=>({...x,attendanceRadiusM:x.attendance_radius_m??50,legacyDemo:false}));localStorage.setItem('grupo_saude_v4_demo_2',JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs-v4-clinics-synced',{detail:s.clinics}))}return remote}
window.V4Backend={health,systemHealth,auditLog,privacyExport,clinicDay,openClinicDay,closeClinicDay,managementReport,monthlyConsolidation,clinics,saveClinic,checkClockInGps,currentGps,validateClockInAtClinic,users,saveUser,permissions,saveTechnicianSale,technicianSales,syncDocumentAlerts,settings,saveSetting,processAlertEscalations,notificationDeliveries,alerts,employeeDocuments,supersedeDocument,documentUrl,candidates,ingestCandidateEmail,documentCompliance,saveDocumentRequirement,addCurrentAccountEntry,uploadDocument,addCurrentAccountDocument,currentAccount,markCurrentAccountPaid,syncClinics};
document.addEventListener('DOMContentLoaded',async()=>{const h=await health();if(h.database==='connected'){try{await syncClinics()}catch(e){console.warn('V4 Neon sync',e)}}});
})();