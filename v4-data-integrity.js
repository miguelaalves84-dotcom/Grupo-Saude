/* Grupo Saúde V4 — integridade transversal das Tabelas Mestre.
   IMPORTANTE: este módulo nunca intercepta pointer/click/change dos campos do formulário. */
(()=>{'use strict';
const K='grupo_saude_v4_demo_2';
const R=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}};
const W=s=>localStorage.setItem(K,JSON.stringify(s));
const N=v=>String(v??'').trim().toLocaleLowerCase('pt-PT');
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const byAny=(a,v)=>(a||[]).find(x=>String(x.id)===String(v)||N(x.name)===N(v));
function repair(){
 let s;try{s=JSON.parse(localStorage.getItem(K)||'{}')}catch{return null}if(!s||typeof s!=='object'||Array.isArray(s))return null;s.clinics=s.clinics||[];s.jobRoles=s.jobRoles||[];s.masterSpecialties=s.masterSpecialties||s.specialties||[];s.contractTypes=s.contractTypes||[];s.masterDocuments=s.masterDocuments||[];s.users=s.users||[];s.employees=s.employees||{};s.clinicSpecialties=s.clinicSpecialties||{};s.clinicStructure=s.clinicStructure||{};
 const documents=[...(s.documentCatalog||[]),...s.masterDocuments];
 s.contractTypes.forEach(c=>{if(c.items===undefined)c.items=[];if(!Array.isArray(c.items))return;const ids=uniq([...(c.masterDocumentIds||[]),...c.items.map(i=>i.masterDocumentId||i.documentTypeId||i.catalogId)]);c.masterDocumentIds=ids;ids.forEach(id=>{const d=byAny(documents,id);if(!d||c.items.some(i=>String(i.masterDocumentId||i.documentTypeId||i.catalogId)===String(id)))return;c.items.push({masterDocumentId:d.id,name:d.name,dateRule:d.dateRule,required:true})})});
 // Historical references are data, not access grants. Never rewrite a person's
 // clinic fields here: only the access policy may resolve operational scope.
 const people=[...s.users,...Object.values(s.employees)];people.forEach(p=>{if(!p?.id)return;const cids=uniq([...(p.clinics||[]),...(p.clinicIds||[]),p.clinic,p.clinicId]);const sids=uniq([...(p.specialtyIds||[]),...(p.specialties||[]),p.specialty,p.specialtyId].map(v=>byAny(s.masterSpecialties,v)?.id||v));cids.forEach(cid=>{s.clinicSpecialties[cid]=uniq([...(s.clinicSpecialties[cid]||[]),...sids]);s.clinicStructure[cid]=s.clinicStructure[cid]||{specialties:[],professionals:[]};const st=s.clinicStructure[cid];st.specialties||=[];sids.forEach(sid=>{const sp=byAny(s.masterSpecialties,sid);if(sp&&!st.specialties.some(x=>N(x)===N(sp.name)))st.specialties.push(sp.name)})})});
 W(s);return s;
}
window.addEventListener('gs-v4-config-updated',()=>setTimeout(repair,0));
window.V4DataIntegrity={repair};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(repair,250)):setTimeout(repair,250);
})();
