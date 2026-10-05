/* Grupo Saúde V4 — compatibilidade de especialidades com a ficha mestre RH.
   A ficha RH é agora a fonte única: este módulo deixa de injetar clínicas/especialidades duplicadas. */
(()=>{'use strict';
const KEY='grupo_saude_v4_demo_2';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
const write=s=>localStorage.setItem(KEY,JSON.stringify(s));
function sync(){
 const m=document.getElementById('modalBody'); if(!m||!document.getElementById('modal')?.open)return;
 /* Se estamos na ficha mestre RH, não criar controlos paralelos. */
 if(m.querySelector('#hrName')){document.getElementById('v4Clinics')?.remove();document.getElementById('v4DoctorSpecialties')?.remove();document.getElementById('v4ReservedAccess')?.remove();return}
}
function captureMaster(){
 const m=document.getElementById('modalBody');if(!m?.querySelector('#hrName'))return;
 const name=m.querySelector('#hrName')?.value?.trim();if(!name)return;
 const s=read();s.professionals=s.professionals||{};
 const clinics=[...m.querySelectorAll('.hrClinic:checked')].map(x=>x.value);
 const specs=[...m.querySelectorAll('.hrSpecialty:checked')].map(x=>({id:x.value,name:x.dataset.name||x.value}));
 const role=m.querySelector('#hrRole')?.value||'';
 const id=`prof_${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\W+/g,'_')}`;
 s.professionals[id]={...(s.professionals[id]||{}),id,name,kind:/m[eé]dico/i.test(role)?'doctor':role,clinicIds:clinics,clinicId:clinics[0]||'',specialtyIds:specs.map(x=>x.id),specialties:specs.map(x=>x.name),active:m.querySelector('#hrActive')?.checked!==false,reservedAccess:m.querySelector('#hrReserved')?.checked!==false};write(s)
}
window.V4DoctorSpecialties={captureMaster};
document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,100));new MutationObserver(sync).observe(document.documentElement,{subtree:true,childList:true});
})();