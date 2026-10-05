/* V4 — fonte única de relações Clínica ↔ Especialidade ↔ Profissional */
(()=>{'use strict';
const K='grupo_saude_v4_demo_2';
const R=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}};
const W=s=>localStorage.setItem(K,JSON.stringify(s));
const N=v=>String(v??'').trim().toLocaleLowerCase('pt-PT');
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function activeClinics(s){return (s.clinics||[]).filter(c=>c.active!==false)}
function specByAny(s,v){return (s.masterSpecialties||[]).find(x=>String(x.id)===String(v)||N(x.name)===N(v))}
function clinicByAny(s,v){return (s.clinics||[]).find(x=>String(x.id)===String(v)||N(x.name)===N(v))}
function employeeClinics(s,p){const vals=[...(p.clinicIds||[]),...(p.clinics||[]),p.clinicId,p.clinic].filter(Boolean);return [...new Set(vals.map(v=>clinicByAny(s,v)?.id).filter(Boolean))]}
function employeeSpecs(s,p){const vals=[...(p.specialtyIds||[]),...(p.specialties||[]),p.specialtyId,p.specialty].filter(Boolean);return [...new Set(vals.map(v=>specByAny(s,v)?.id).filter(Boolean))]}
function sync(){const s=R();s.clinicSpecialties=s.clinicSpecialties||{};s.clinicStructure=s.clinicStructure||{};s.professionals=s.professionals||{};
 activeClinics(s).forEach(c=>{s.clinicSpecialties[c.id]=Array.isArray(s.clinicSpecialties[c.id])?s.clinicSpecialties[c.id]:[];s.clinicStructure[c.id]=s.clinicStructure[c.id]||{specialties:[],professionals:[]}});
 Object.values(s.employees||{}).filter(p=>p.active!==false).forEach(p=>{const cids=employeeClinics(s,p),sids=employeeSpecs(s,p);if(!cids.length)return;const isClinical=/m[eé]dic|t[eé]cnic|terapeut|fisioter|psic|nutri|enferm/i.test(p.kind||p.role||'');if(!isClinical)return;
   const pid=p.id||('prof_'+N(p.name).replace(/\W+/g,'_'));s.professionals[pid]={...(s.professionals[pid]||{}),id:pid,name:p.name,active:true,clinicIds:cids,specialtyIds:sids,source:'RH'};
   cids.forEach(cid=>{s.clinicSpecialties[cid]=[...new Set([...(s.clinicSpecialties[cid]||[]),...sids])];const st=s.clinicStructure[cid]=s.clinicStructure[cid]||{specialties:[],professionals:[]};sids.forEach(sid=>{const sp=specByAny(s,sid);if(sp&&!st.specialties.includes(sp.name))st.specialties.push(sp.name);if(sp&&!st.professionals.some(x=>x.employeeId===p.id||N(x.name)===N(p.name)))st.professionals.push({employeeId:p.id,name:p.name,specialty:sp.name,active:true,source:'RH'})})})
 });W(s);return s}
function setSpec(cid,sid,on){const s=sync();if(!activeClinics(s).some(c=>String(c.id)===String(cid)))return;const a=s.clinicSpecialties[cid]||[];s.clinicSpecialties[cid]=on?[...new Set([...a,sid])]:a.filter(x=>String(x)!==String(sid));const st=s.clinicStructure[cid]=s.clinicStructure[cid]||{specialties:[],professionals:[]},sp=specByAny(s,sid);if(sp)st.specialties=on?[...new Set([...(st.specialties||[]),sp.name])]:(st.specialties||[]).filter(x=>N(x)!==N(sp.name));W(s);window.dispatchEvent(new CustomEvent('gs-v4-config-updated',{detail:{type:'specialty',clinicId:cid,specialtyId:sid}}))}
function openSpecs(){const s=sync(),cs=activeClinics(s),specs=(s.masterSpecialties||[]).filter(x=>x.active!==false);document.getElementById('modalTitle').textContent='Especialidades por clínica';document.getElementById('modalBody').innerHTML='<div class="modal-body">'+(cs.map(c=>'<div class="card"><h3>'+E(c.name)+'</h3>'+specs.map(sp=>'<label class="check"><input type="checkbox" '+((s.clinicSpecialties[c.id]||[]).includes(sp.id)?'checked':'')+' onchange="ClinicRelationsV4.setSpec(\''+E(c.id)+'\',\''+E(sp.id)+'\',this.checked)"> '+E(sp.name)+'</label>').join('')+'</div>').join('')||'<p class="muted">Não existem clínicas ativas.</p>')+'</div>';document.getElementById('modal').showModal()}
function patch(){sync();if(window.V4Integrations)window.V4Integrations.manageClinicSpecialties=openSpecs;}
window.ClinicRelationsV4={sync,setSpec,openSpecs};document.addEventListener('DOMContentLoaded',()=>setTimeout(patch,650));document.addEventListener('gs-v4-config-updated',()=>setTimeout(patch,0));let sig='';setInterval(()=>{const s=R(),x=JSON.stringify([(s.clinics||[]).map(c=>[c.id,c.active]),Object.values(s.employees||{}).map(p=>[p.id,p.active,p.clinicIds,p.clinics,p.specialtyIds,p.specialties])]);if(x!==sig){sig=x;patch()}},1200);
})();