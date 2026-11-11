/* Dados FICTÍCIOS só para testes (demonstração): registo ERS, NIF, telefone das clínicas; especialidades, cédulas,
   capacidade, salário e função no bónus dos colaboradores de teste. Só preenche o que estiver vazio e marca tudo como
   fictício. Não corre no modo servidor nem em sessão autenticada. Os dados verdadeiros substituem-nos na ficha. */
(()=>{'use strict';const K='grupo_saude_v4_demo_2',FLAG='fictitiousSeedV1';
const local=()=>/^(127\.0\.0\.1|localhost)$/.test(location.hostname)&&!/[?&]fictitious=1\b/.test(location.search);
const demo=()=>document.documentElement.dataset.mode!=='authenticated'&&document.documentElement.dataset.v4ext!=='server'&&!local();
const SPECS=[['fic-cardio','Cardiologia'],['fic-fisio','Fisioterapia'],['fic-osteo','Osteopatia'],['fic-nutri','Nutrição'],['fic-psico','Psicologia']];
function patch(){if(!demo())return false;let s;try{s=JSON.parse(localStorage.getItem(K)||'null')}catch{return false}if(!s||s[FLAG])return false;
 const cs=(s.clinics||[]).filter(c=>c&&!/^administra/i.test(String(c.id)));cs.forEach((c,i)=>{const n=String(i+1).padStart(2,'0');if(!c.phone&&!(c.phones||[]).length){c.phone='210 000 0'+n;c.phones=[c.phone]}c.ers={...(c.ers||{}),license:c.ers?.license||('E9000'+n)};if(!c.legalEntity?.nif)c.legalEntity={name:c.legalEntity?.name||'Grupo Saúde — entidade FICTÍCIA para testes, Lda.',nif:'500000000'};c.fictitiousData=true});
 s.masterSpecialties=s.masterSpecialties||[];for(const [id,name] of SPECS)if(!s.masterSpecialties.some(x=>x.name===name))s.masterSpecialties.push({id,name,active:true,fictitious:true});
 const idOf=n=>s.masterSpecialties.find(x=>x.name===n)?.id;s.clinicSpecialties=s.clinicSpecialties||{};for(const c of cs){const cur=s.clinicSpecialties[c.id]||[];if(!cur.length)s.clinicSpecialties[c.id]=SPECS.map(([,n])=>idOf(n))}
 const cap=Object.fromEntries(Array.from({length:7},(_,d)=>[d,{treatments:d===0?0:32}]));
 const fill=(p)=>{if(!p)return;const r=String(p.role||'').toUpperCase(),hr=p.hr||{};if(!hr.admissionDate)hr.admissionDate='2024-01-15';if(!Number(hr.grossSalary))hr.grossSalary=/ADMINISTRA[CÇ][AÃ]O/.test(r)?1800:/ADMINISTRATIVA|CALL/.test(r)?950:/MEDIC/.test(r)?2200:/TECNIC/.test(r)?1200:hr.grossSalary||0;if(hr.mealAllowance==null)hr.mealAllowance=6;
  if(/MEDIC/.test(r)){if(!(p.specialtyIds||[]).length)p.specialtyIds=[idOf('Cardiologia')];if(!hr.professionalLicense)hr.professionalLicense='OM 99001 (fictícia)'}
  if(/TECNIC/.test(r)){if(!(p.specialtyIds||[]).length)p.specialtyIds=[idOf('Fisioterapia')];if(!hr.professionalLicense)hr.professionalLicense='C-099001 (fictícia)';if(!hr.weeklyCapacity||!Object.keys(hr.weeklyCapacity).length)hr.weeklyCapacity=cap;if(!hr.bonusFunction)hr.bonusFunction='fisioterapeuta'}
  hr.fictitiousData=true;p.hr=hr};
 for(const u of s.users||[])if(/^test_/.test(String(u.id)))fill(u);for(const [id,e] of Object.entries(s.employees||{}))if(/^test_/.test(String(e.id||id)))fill(e);
 s[FLAG]=new Date().toISOString();localStorage.setItem(K,JSON.stringify(s));return true}
patch();document.addEventListener('DOMContentLoaded',()=>{if(patch()){try{window.App?.renderAll?.()}catch{}document.dispatchEvent(new CustomEvent('gs:state-changed'))}});
window.GSDemoFictitious={patch,FLAG};
})();
