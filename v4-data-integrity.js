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
 const s=R();s.clinics=s.clinics||[];s.jobRoles=s.jobRoles||[];s.masterSpecialties=s.masterSpecialties||s.specialties||[];s.contractTypes=s.contractTypes||[];s.masterDocuments=s.masterDocuments||[];s.users=s.users||[];s.employees=s.employees||{};s.clinicSpecialties=s.clinicSpecialties||{};s.clinicStructure=s.clinicStructure||{};
 if(window.GSDocumentCatalog)GSDocumentCatalog.normalize(s); // Preserve item IDs, inactive requirements and legacy evidence; shared normalizer owns this projection.

 const people=[...s.users,...Object.values(s.employees)];people.forEach(p=>{if(!p?.id)return;const cids=uniq([...(p.clinics||[]),...(p.clinicIds||[]),p.clinic,p.clinicId].filter(Boolean).map(v=>byAny(s.clinics,v)?.id||String(v)));const sids=uniq([...(p.specialtyIds||[]),...(p.specialties||[]),p.specialty,p.specialtyId].filter(Boolean).map(v=>byAny(s.masterSpecialties,v)?.id||String(v)));p.clinics=cids;p.clinicIds=cids;p.clinic=cids[0]||'';p.specialtyIds=sids;p.specialties=sids.map(id=>byAny(s.masterSpecialties,id)?.name||id);cids.forEach(cid=>{s.clinicSpecialties[cid]=uniq([...(s.clinicSpecialties[cid]||[]),...sids]);s.clinicStructure[cid]=s.clinicStructure[cid]||{specialties:[],professionals:[]};const st=s.clinicStructure[cid];sids.forEach(sid=>{const sp=byAny(s.masterSpecialties,sid);if(sp&&!st.specialties.some(x=>N(x)===N(sp.name)))st.specialties.push(sp.name)})})});
 W(s);return s;
}
window.addEventListener('gs-v4-config-updated',()=>setTimeout(repair,0));
window.V4DataIntegrity={repair};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(repair,250)):setTimeout(repair,250);
})();