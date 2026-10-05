/* Grupo Saúde V4 — integridade transversal das Tabelas Mestre + estabilidade dos seletores RH */
(()=>{'use strict';
const K='grupo_saude_v4_demo_2';
const R=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}};
const W=s=>localStorage.setItem(K,JSON.stringify(s));
const N=v=>String(v??'').trim().toLocaleLowerCase('pt-PT');
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const byAny=(a,v)=>(a||[]).find(x=>String(x.id)===String(v)||N(x.name)===N(v));
function repair(){
 const s=R();s.clinics=s.clinics||[];s.jobRoles=s.jobRoles||[];s.masterSpecialties=s.masterSpecialties||s.specialties||[];s.contractTypes=s.contractTypes||[];s.masterDocuments=s.masterDocuments||[];s.users=s.users||[];s.employees=s.employees||{};s.clinicSpecialties=s.clinicSpecialties||{};s.clinicStructure=s.clinicStructure||{};
 // Contratos -> documentos: uma única referência por ID mestre.
 s.contractTypes.forEach(c=>{c.items=Array.isArray(c.items)?c.items:[];const ids=uniq([...(c.masterDocumentIds||[]),...c.items.map(i=>i.masterDocumentId||i.documentTypeId)]);c.masterDocumentIds=ids.filter(id=>byAny(s.masterDocuments,id));c.items=c.masterDocumentIds.map(id=>{const d=byAny(s.masterDocuments,id),old=c.items.find(i=>String(i.masterDocumentId||i.documentTypeId)===String(id))||{};return {...old,masterDocumentId:d.id,name:d.name,dateRule:d.dateRule,required:old.required!==false}})});
 // Colaboradores -> clínicas/especialidades -> estrutura clínica.
 const people=[...s.users,...Object.values(s.employees)];people.forEach(p=>{if(!p?.id)return;const cids=uniq([...(p.clinics||[]),...(p.clinicIds||[]),p.clinic,p.clinicId].map(v=>byAny(s.clinics,v)?.id));const sids=uniq([...(p.specialtyIds||[]),...(p.specialties||[]),p.specialty,p.specialtyId].map(v=>byAny(s.masterSpecialties,v)?.id));p.clinics=cids;p.clinicIds=cids;p.clinic=cids[0]||'';p.specialtyIds=sids;p.specialties=sids.map(id=>byAny(s.masterSpecialties,id)?.name).filter(Boolean);cids.forEach(cid=>{s.clinicSpecialties[cid]=uniq([...(s.clinicSpecialties[cid]||[]),...sids]);s.clinicStructure[cid]=s.clinicStructure[cid]||{specialties:[],professionals:[]};const st=s.clinicStructure[cid];sids.forEach(sid=>{const sp=byAny(s.masterSpecialties,sid);if(sp&&!st.specialties.some(x=>N(x)===N(sp.name)))st.specialties.push(sp.name)})})});
 W(s);return s;
}
function protectHR(e){const el=e.target;if(!el?.closest?.('#modalBody'))return;if(!['hrRole','hrClinicPicker','hrSpecPicker','hrContract'].includes(el.id))return;e.stopPropagation()}
function afterChange(e){const el=e.target;if(!el?.closest?.('#modalBody'))return;if(['hrRole','hrClinicPicker','hrSpecPicker','hrContract'].includes(el.id)){setTimeout(()=>{try{repair();window.ClinicRelationsV4?.sync?.();window.ContractTypesV4?.refreshHR?.()}catch{}},0)}}
// Impede listeners globais de cliques de reconstruírem selects enquanto o utilizador escolhe uma opção.
document.addEventListener('pointerdown',protectHR,true);document.addEventListener('click',protectHR,true);document.addEventListener('change',afterChange,true);
window.addEventListener('gs-v4-config-updated',()=>setTimeout(repair,0));
window.V4DataIntegrity={repair};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(repair,250)):setTimeout(repair,250);
})();