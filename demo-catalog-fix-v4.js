/* Correção única dos dados de demonstração (só no modo demonstração, nunca com dados reais):
   - funções: retira «Psicólogo/a» e acrescenta as funções do grupo (fisioterapia);
   - especialidades fictícias que o grupo não tem (Psicologia, Cardiologia) ficam inativas; acrescenta Fisiatria;
   - registos antigos ligados às clínicas fictícias c1/c2/c3 passam para as clínicas reais (Abranfir, Loures, Lagoa).
   Tudo continua editável em Tabelas / Configuração. */
(()=>{'use strict';
const K='grupo_saude_v4_demo_2',FLAG='demoCatalogFixV1',PILOT='demoPilotPortimaoV1';
const local=()=>(location.protocol==='file:'||/^(127\.0\.0\.1|localhost)$/.test(location.hostname))&&!/[?&]fictitious=1\b/.test(location.search);
const demo=()=>document.documentElement.dataset.mode!=='authenticated'&&document.documentElement.dataset.v4ext!=='server'&&!local();
const N=v=>String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toLowerCase();
const ROLES=['Fisioterapeuta','Auxiliar de fisioterapia','Administrativa','Médico/a fisiatra','Osteopata','Nutricionista'];
const WRONG_ROLES=['psicologo/a','psicologo','psicologa'],WRONG_SPECS=['psicologia','cardiologia'];
function fix(s){
 const changes=[];
 s.jobRoles=s.jobRoles||[];for(const r of s.jobRoles)if(WRONG_ROLES.includes(N(r.name))&&r.active!==false){r.active=false;changes.push('Função «'+r.name+'» desativada')}
 for(const name of ROLES)if(!s.jobRoles.some(r=>N(r.name)===N(name))){s.jobRoles.push({id:'jr-'+N(name).replace(/[^a-z]+/g,'-'),name,active:true});changes.push('Função «'+name+'» acrescentada')}
 const repl=s.jobRoles.find(r=>N(r.name)==='fisioterapeuta');for(const c of s.candidates||[]){const r=s.jobRoles.find(x=>String(x.id)===String(c.role));if(r&&WRONG_ROLES.includes(N(r.name))&&repl){c.role=repl.id;changes.push('Candidatura de '+(c.name||c.id)+' passou para Fisioterapeuta')}}
 s.masterSpecialties=s.masterSpecialties||[];const wrongIds=new Set();for(const x of s.masterSpecialties)if(WRONG_SPECS.includes(N(x.name))){wrongIds.add(String(x.id));if(x.active!==false){x.active=false;changes.push('Especialidade «'+x.name+'» desativada')}}
 let fis=s.masterSpecialties.find(x=>N(x.name)==='fisiatria');if(!fis){fis={id:'fic-fisiatria',name:'Fisiatria',active:true,fictitious:true};s.masterSpecialties.push(fis);changes.push('Especialidade «Fisiatria» acrescentada')}
 for(const [cid,ids] of Object.entries(s.clinicSpecialties||{})){if(!Array.isArray(ids))continue;const next=[...new Set(ids.filter(id=>!wrongIds.has(String(id))).concat(ids.some(id=>wrongIds.has(String(id)))?[fis.id]:[]))];if(next.length!==ids.length||next.some((v,i)=>v!==ids[i]))s.clinicSpecialties[cid]=next}
 for(const p of [...(s.users||[]),...Object.values(s.employees||{})]){if(Array.isArray(p.specialtyIds)&&p.specialtyIds.some(id=>wrongIds.has(String(id)))){p.specialtyIds=[...new Set(p.specialtyIds.map(id=>wrongIds.has(String(id))?fis.id:id))];changes.push((p.name||p.id)+' passou para Fisiatria')}if(WRONG_SPECS.includes(N(p.specialty)))p.specialty='Fisiatria'}
 for(const r of s.requests||[])if(WRONG_SPECS.includes(N(r.specialty)))r.specialty='Fisiatria';
 const ids=new Set((s.clinics||[]).map(c=>String(c.id))),map={};[['c1','abranfir'],['c2','loures'],['c3','lagoa']].forEach(([a,b])=>{if(!ids.has(a)&&ids.has(b))map[a]=b});
 if(Object.keys(map).length){const m=v=>map[String(v)]||v,touch=o=>{if(!o||typeof o!=='object')return;for(const k of ['clinic','clinicId'])if(o[k]!=null&&map[String(o[k])]){o[k]=m(o[k])}for(const k of ['clinics','clinicIds'])if(Array.isArray(o[k]))o[k]=[...new Set(o[k].map(m))]};
  for(const k of ['requests','candidates','callBookings','complaints','alerts','cash','agendaEvents','tasks']){const v=s[k];if(Array.isArray(v))v.forEach(touch)}
  for(const [key,d] of Object.entries(s.days||{})){const c=String(d?.clinic||'');if(map[c]){const nk=key.replace(new RegExp('_'+c+'$'),'_'+map[c]);d.clinic=map[c];if(!s.days[nk]){s.days[nk]=d;delete s.days[key]}}}
  if(map[String(s.opClinic)])s.opClinic=map[String(s.opClinic)];changes.push('Registos das clínicas fictícias antigas passaram para Abranfir, Loures e Lagoa')}
 return changes}
function pilot(s){const hit=(s.clinics||[]).find(c=>String(c.id)==='portimao'||[c.name,c.city,c.locality,c.address].some(v=>N(v).includes('portimao')));if(hit){if(hit.pilot)return[];hit.pilot=true;return['Clínica «'+(hit.name||hit.id)+'» (Portimão) marcada como clínica piloto']}s.clinics.push({id:'portimao',name:'Portimão',city:'Portimão',active:true,operational:true,pilot:true,address:'',phone:'',workingDays:[1,2,3,4,5]});s.clinicSpecialties=s.clinicSpecialties||{};s.clinicSpecialties.portimao=s.clinicSpecialties.portimao||[];return['Clínica piloto «Portimão» acrescentada (morada, telefone, especialidades e equipa por preencher em Clínicas)']}
function run(){if(!demo())return false;let s;try{s=JSON.parse(localStorage.getItem(K)||'null')}catch{return false}if(!s||!s.fictitiousSeedV1||s.authMode==='real'||s.authenticatedSubject)return false;if(!(s.clinics||[]).length)return false;if(s[FLAG]&&s[PILOT])return false;const at=new Date().toISOString(),changes=[];if(!s[FLAG]){changes.push(...fix(s));s[FLAG]=at}if(!s[PILOT]){changes.push(...pilot(s));s[PILOT]=at}if(changes.length){s.audit||=[];s.audit.unshift({id:'demo-catalog-fix-'+at,at,by:'system:demo-fixture',module:'Tabelas / Configuração',action:'Listas de demonstração corrigidas',detail:changes.join(' · ')})}localStorage.setItem(K,JSON.stringify(s));return changes.length>0}
window.GSDemoCatalogFix={fix,pilot};
const apply=()=>{if(run()){try{location.reload()}catch{}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,400));else setTimeout(apply,400);
})();
