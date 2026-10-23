/* V4 — RH colaboradores/candidatos + ficha + documentos + livro de ponto */
(()=>{'use strict';
const KEY='grupo_saude_v4_demo_2'; const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}; const write=s=>localStorage.setItem(KEY,JSON.stringify(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const seedClinics=[{id:'c1',name:'Clínica Central',active:true},{id:'c2',name:'Clínica Norte',active:true},{id:'c3',name:'Clínica Sul',active:true}];
function state(){const s=read()||{};s.clinics=s.clinics||seedClinics;s.employees=s.employees||{};s.candidates=s.candidates||[];s.employeeDocuments=s.employeeDocuments||{};s.timeEntries=s.timeEntries||[];write(s);return s}
function modal(title,body){const t=document.getElementById('modalTitle'),b=document.getElementById('modalBody'),m=document.getElementById('modal');if(!t||!b||!m)return;t.textContent=title;b.innerHTML=`<div class="modal-body">${body}</div>`;m.showModal()}
function employeeDocs(s,id){return s.employeeDocuments[id]||[]}
function docStatus(d){if(!d.file&&!d.receivedAt)return'Missing';if(d.validUntil&&new Date(d.validUntil)<new Date())return'Expired';if(d.validUntil&&new Date(d.validUntil)-Date.now()<30*864e5)return'Expiring';return'Valid'}
function todayDocs(s){const day=new Date().toISOString().slice(0,10),out=[];Object.entries(s.employeeDocuments||{}).forEach(([employeeId,list])=>(list||[]).forEach(d=>{if(d.uploadedAt&&String(d.uploadedAt).slice(0,10)===day&&(d.dataUrl||d.file||d.fileName||d.receivedAt))out.push({employeeId,doc:d})}));return out}
function regularizeDocuments(){if(!window.RoleAccessAdminV4?.can('hrManage'))return;const s=state(),items=[];Object.values(s.employees||{}).filter(p=>AccessScopeV4.canEmployee(p.id,s)).forEach(p=>employeeDocs(s,p.id).forEach(d=>{const st=docStatus(d);if(st!=='Valid')items.push({p,d,st})}));modal('Documentos por regularizar',items.length?items.map(({p,d,st})=>'<div class="card" style="margin-bottom:10px"><div class="row"><div><b>'+esc(p.name||p.id)+'</b><div class="meta">'+esc(d.name||d.category||'Documento')+' · '+esc(st==='Missing'?'Em falta':st==='Expired'?'Expirado':'A expirar')+'</div></div><div><input id="reg_'+esc(d.id)+'" type="file" accept=".pdf,image/*" style="max-width:210px"><button class="primary" '+GSSafeActionsV4.attrs("V4ClinicHR.uploadRequired",[p.id,d.id],"click")+'>Carregar documento</button></div></div></div>').join(''):'<p class="muted">Não existem documentos por regularizar.</p>')}
async function uploadRequired(employeeId,docId){const actor=String(state().currentUser);if(!AccessScopeV4.canEmployee(employeeId,state()))return alert('Sem autorização.');const input=document.getElementById('reg_'+docId),f=input?.files?.[0];if(!f)return alert('Selecione o ficheiro.');if(f.size>5*1024*1024)return alert('O ficheiro deve ter no máximo 5 MB.');const dataUrl=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result||''));r.onerror=no;r.readAsDataURL(f)});const s=state();if(String(s.currentUser)!==actor||!AccessScopeV4.canEmployee(employeeId,s))return alert('A sessão mudou.');const d=(s.employeeDocuments?.[employeeId]||[]).find(x=>String(x.id)===String(docId));if(!d)return alert('Documento não encontrado.');d.fileName=f.name;d.file=f.name;d.dataUrl=dataUrl;d.mimeType=f.type;d.size=f.size;d.uploadedAt=new Date().toISOString();d.receivedAt=d.uploadedAt;d.status='Pendente';d.uploadedBy=s.currentUser;s.audit=s.audit||[];s.audit.unshift({id:'log_'+Date.now(),at:d.uploadedAt,module:'RH',action:'Documento obrigatório carregado',detail:(d.name||'Documento')+' · '+(s.employees?.[employeeId]?.name||employeeId),userId:employeeId});write(s);document.getElementById('modal')?.close();renderEmployees();alert('Documento carregado no item correto e enviado para validação.')}
function todayDocuments(){const s=state(),docs=todayDocs(s).filter(x=>AccessScopeV4.canEmployee(x.employeeId,s));modal('Uploads de hoje',docs.length?docs.map(x=>{const p=s.employees?.[x.employeeId]||(s.users||[]).find(u=>String(u.id)===String(x.employeeId));return '<div class="card" style="margin-bottom:10px"><b>'+esc(p?.name||x.employeeId)+'</b><div class="meta">'+esc(x.doc.category||'Documento')+' · '+esc(x.doc.name||'Ficheiro')+' · '+esc(x.doc.status||'Pendente')+'</div><div class="actions"><button class="primary" '+GSSafeActionsV4.attrs("V4ClinicHR.openEmployee",[x.employeeId],"click")+'>Abrir ficha</button></div></div>'}).join(''):'<p class="muted">Ainda não foram recebidos documentos hoje.</p>')}
function renderEmployees(){if(!window.RoleAccessAdminV4?.can('hrManage'))return;const s=state(),root=document.getElementById('hrContent');if(!root)return;const allPeople=[...new Map([...(s.users||[]),...Object.values(s.employees)].map(p=>[String(p.id),p])).values()].filter(p=>!p._new&&window.AccessScopeV4.canEmployee(p.id,s)),q=String(document.querySelector('#hr input[type="search"],#hr input[placeholder*="Pesquisar"]')?.value||'').trim().toLowerCase(),clinics=s.clinics||[];const people=!q?allPeople:allPeople.filter(p=>{const pc=(p.clinics||[p.clinic]).filter(Boolean),clinicText=pc.map(id=>clinics.find(c=>String(c.id)===String(id))?.name||id).join(' ');return [p.name,p.role,p.kind,p.email,p.specialty,p.specialidade,clinicText].filter(Boolean).join(' ').toLowerCase().includes(q)});let missing=0,expiring=0,expired=0;people.forEach(p=>employeeDocs(s,p.id).forEach(d=>{const x=docStatus(d);if(x==='Missing')missing++;if(x==='Expiring')expiring++;if(x==='Expired')expired++}));root.innerHTML=`<div class="page-head" style="padding:0"><div><h2>Colaboradores</h2><p>Colaboradores, documentação e assiduidade</p></div><button class="primary" onclick="V4ClinicHR.openEmployeeForm()">+ Colaborador</button></div>
<div class="actions"><button class="secondary" onclick="ApprovalsV4.open()">Aprovações / solicitações</button>${window.HRPerformanceV4.canManage(s)?'<button class="secondary" onclick="HRPerformanceUIV4.open()">Avaliação de Desempenho</button>':''}</div><div class="cards"><div class="card"><h3>Colaboradores ativos</h3><strong style="font-size:28px">${people.filter(p=>p.active!==false).length}</strong><div class="meta">${q?'de '+allPeople.length+' no total':'Total atual'}</div></div><div class="card" style="cursor:pointer" onclick="V4ClinicHR.regularizeDocuments()"><h3>Documentos por regularizar</h3><strong style="font-size:28px">${missing+expiring+expired}</strong><div class="meta">Clique para ver e carregar diretamente</div></div><div class="card" style="cursor:pointer" onclick="V4ClinicHR.todayDocuments()"><h3>Uploads de hoje</h3><strong style="font-size:28px">${todayDocs(s).length}</strong><div class="meta">Ver documentos recebidos hoje</div></div></div>
<div class="card" style="margin-top:14px"><div style="display:flex;justify-content:space-between;align-items:center"><div><h3>Calendário de férias</h3><p class="muted">Visão conjunta por clínica, colaborador e período.</p></div><div class="actions"><button class="secondary" onclick="V4VacationRequests.requests()">Pedidos de férias</button><button class="secondary" onclick="V4VacationCalendar.open()">Abrir calendário</button></div></div></div>
<div class="card" style="margin-top:14px"><h3>Colaboradores</h3>${people.length?people.map(p=>`<button type="button" data-search-item="employee" class="row" style="width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #edf0f2;padding:12px 0;cursor:pointer" ${GSSafeActionsV4.attrs("V4ClinicHR.openEmployee",[p.id],"click")}><div><strong>${esc(p.name)}</strong><div class="meta">${esc(p.kind||p.role||'Colaborador')} · ${esc(((p.clinics||[p.clinic]).filter(Boolean).map(id=>clinics.find(c=>String(c.id)===String(id))?.name||id)).join(', ')||'Clínica por associar')} · Abrir / editar ficha</div></div><span class="secondary" style="pointer-events:none">${p.active===false?'Inativo':'Ativo'} · Abrir ficha</span></button>`).join('') :'<p class="muted">Ainda sem colaboradores.</p>'}</div>`;}
function openEmployee(id){
 if(window.HRMasterV4?.open)return window.HRMasterV4.open(id);
 alert('A ficha mestre de RH ainda está a carregar. Tente novamente dentro de um instante.');
}
function openEmployeeForm(){if(window.HRMasterV4?.create)return window.HRMasterV4.create();alert('O formulário RH ainda está a carregar. Tente novamente.');}
function vacationCenter(id){return window.VacationCalendarV4.open(id)}
function saveVacation(id){try{const d=window.HRLeaveV4,s=d.read(),a=document.getElementById('vacStart')?.value,b=document.getElementById('vacEnd')?.value||a,c=d.clinics(d.person(s,id))[0]||'',x=d.createVacation(id,d.range(a,b).filter(day=>d.working(s,c,day)));return window.HRLeaveUIV4.open(x.id)}catch(e){alert(e.message)}}
const candidateStages=window.GSRecruitmentCore.stages;
function moveCandidate(id,stage){return window.RecruitmentV4?.move(id,stage)}
function renderCandidates(){
 if(!window.RoleAccessAdminV4?.can('hrManage'))return;
 const root=document.getElementById('hrContent');if(!root)return;
 let candidates=[];try{candidates=window.CommunicationsV4?.candidates?.()||[]}catch(e){root.textContent=e.message||'Sem acesso às candidaturas';return}
 const card=c=>`<article class="card candidate-card" draggable="true" data-candidate-id="${esc(String(c.id))}"><strong>${esc(c.name||'Sem nome')}</strong><p class="muted">${esc(c.email||'')}</p><button type="button" class="secondary" ${GSSafeActionsV4.attrs("CommunicationsV4.candidate",[c.id],"click")}>Abrir processo</button>${c.stage==='Entrevista marcada'?`<button type="button" class="secondary" data-interview-open="${esc(c.id)}">Abrir entrevista</button>`:''}<label>Etapa de ${esc(c.name||'candidatura')}<select data-candidate-target aria-label="Etapa de ${esc(c.name||'candidatura')}">${candidateStages.map(stage=>`<option ${stage===(c.stage||'Candidatos')?'selected':''}>${esc(stage)}</option>`).join('')}</select></label><button type="button" class="secondary" data-candidate-move>Mover candidatura</button>${c.employeeId?'<p class="muted">Colaborador associado · processo preservado</p>':''}</article>`;
 root.innerHTML=`<div class="page-head" style="padding:0"><div><h2>Candidatos</h2><p>Recrutamento e admissão · arraste um cartão ou selecione a etapa e escolha Mover candidatura.</p></div><button class="primary" onclick="CommunicationsV4.importForm()">+ Candidato / CV</button></div><div class="candidate-board" aria-label="Funil de candidatos">${candidateStages.map(stage=>{const list=candidates.filter(c=>(c.stage||'Candidatos')===stage);return `<section class="card candidate-column" data-stage="${esc(stage)}"><h3>${esc(stage)} <small>(${list.length})</small></h3>${list.map(card).join('')||'<p class="muted">Sem candidatos</p>'}</section>`}).join('')}</div>${candidates.some(c=>!candidateStages.includes(c.stage||'Candidatos'))?`<section class="card candidate-history"><h3>Outras etapas e processos convertidos</h3>${candidates.filter(c=>!candidateStages.includes(c.stage||'Candidatos')).map(card).join('')}</section>`:''}`;
 // Preserve the existing approvals panel immediately; its 700 ms refresh must not insert above an active drag.
 window.ApprovalsV4?.sync?.();
 root.querySelectorAll('[data-interview-open]').forEach(b=>b.onclick=()=>window.RecruitmentV4?.interview(b.dataset.interviewOpen));
 root.querySelectorAll('[data-candidate-move]').forEach(button=>button.addEventListener('click',()=>{const c=button.closest('.candidate-card');moveCandidate(c.dataset.candidateId,c.querySelector('[data-candidate-target]').value)}));
 const board=root.querySelector('.candidate-board');if(!board)return;
 window.CandidateDragV4.bind(board,{canMove:()=>window.RoleAccessAdminV4?.can('hrManage')&&document.getElementById('hr')?.classList.contains('active'),onMove:moveCandidate});
}
function promoteCandidate(i){try{const c=state().candidates[i];if(!c)return;const id=window.CommunicationsV4.convert(c.id);openEmployee(id)}catch(e){alert(e.message)}}
function clockIn(){if(window.App?.prepareClock)return App.prepareClock();modal('Livro de ponto','<p>Marcação indisponível.</p>')} function temporaryExit(){if(window.App?.temporaryExit)return App.temporaryExit();modal('Saída temporária','<p>Marcação indisponível.</p>')} function correction(){if(window.App?.requestTimeCorrection)return App.requestTimeCorrection();modal('Correção de ponto','<p>Pedido indisponível.</p>')}
let activeHRTab='',activeHRUser='';
function selectHRTab(tab){
 if(!['employees','candidates'].includes(tab)||!window.RoleAccessAdminV4?.can('hrManage'))return false;
 const sec=document.getElementById('hr');if(!sec)return false;
 activeHRUser=String(state().currentUser);activeHRTab=tab;
 if(!sec.classList.contains('active')&&window.App?.showView)return window.App.showView('hr');
 sec.querySelectorAll('[data-hr-tab]').forEach(button=>{const selected=button.dataset.hrTab===tab;button.setAttribute('aria-pressed',String(selected));button.classList.toggle('primary',selected);button.classList.toggle('secondary',!selected)});
 if(tab==='employees')renderEmployees();else renderCandidates();return true;
}
function hrTabs(){
 const sec=document.getElementById('hr');if(!sec)return;
 const root=document.getElementById('hrContent'),head=sec.querySelector('.page-head');
 if(!window.RoleAccessAdminV4?.can('hrManage')){if(root)root.innerHTML='';head?.querySelector('[data-rhtabs]')?.remove();activeHRTab='';activeHRUser='';return false;}
 const actor=String(state().currentUser);if(activeHRUser!==actor){activeHRUser=actor;activeHRTab='';}
 if(head&&!head.querySelector('[data-rhtabs]')){const tabs=document.createElement('div');tabs.dataset.rhtabs='1';tabs.className='actions';tabs.innerHTML='<button type="button" class="secondary" data-hr-tab="employees">Colaboradores</button><button type="button" class="secondary" data-hr-tab="candidates">Candidatos</button>';tabs.querySelectorAll('[data-hr-tab]').forEach(b=>b.onclick=()=>selectHRTab(b.dataset.hrTab));head.appendChild(tabs)}
 if(activeHRTab&&sec.classList.contains('active'))return selectHRTab(activeHRTab);if(root)root.innerHTML='<div class="hr-choice"><article class="card"><h2>Colaboradores</h2><p>Fichas, contratos, documentação, férias, baixas e histórico.</p><button class="primary" onclick="V4ClinicHR.showEmployees()">Entrar em Colaboradores</button></article><article class="card"><h2>Candidatos</h2><p>Currículos, entrevistas e decisões num processo independente.</p><button class="primary" onclick="V4ClinicHR.showCandidates()">Entrar em Candidatos</button></article></div>';return true;
}
window.V4ClinicHR={regularizeDocuments,uploadRequired,vacationCenter,saveVacation,todayDocuments,render:()=>{hrTabs();window.ApprovalsV4?.sync?.()},showEmployees:()=>selectHRTab('employees'),showCandidates:()=>selectHRTab('candidates'),openEmployee,openEmployeeForm,promoteCandidate,clockIn,temporaryExit,correction};document.addEventListener('DOMContentLoaded',hrTabs);document.addEventListener('gs:user-changed',hrTabs);document.addEventListener('gs:permissions-applied',hrTabs);
})();
/* V4 HR completion layer */
(()=>{'use strict';const K='grupo_saude_v4_demo_2',R=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}},W=s=>localStorage.setItem(K,JSON.stringify(s));
function s(){const x=R();x.leave=x.leave||[];x.employeeDocuments=x.employeeDocuments||{};x.audit=x.audit||[];return x}function log(a,d){const x=s();x.audit.unshift({at:new Date().toISOString(),module:'RH',action:a,detail:d});W(x)}
function addLeave(id){return window.HRMasterV4?.open(String(id),'ferias')}
function editDoc(id,did){return window.EmployeeDocumentsV4?.open(String(id),true)}
function savePay(id){if(!window.RoleAccessAdminV4?.can('hrManage')||!window.HRMasterV4)return alert('Sem autorização para editar a ficha.');const root=document.querySelector('#modalBody .modal-body');if(root?.dataset.employeeId===String(id)&&document.getElementById('hrName'))return HRMasterV4.save(id);return HRMasterV4.open(String(id),'dados')}
window.V4HR={...(window.V4HR||{}),addLeave,editDoc,savePay};})();

/* V4 — detalhe e reversão de ocorrências de ponto */
(()=>{'use strict';const K='grupo_saude_v4_demo_2',R=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}},W=s=>localStorage.setItem(K,JSON.stringify(s)),E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function modal(t,b){document.getElementById('modalTitle').textContent=t;document.getElementById('modalBody').innerHTML='<div class="modal-body">'+b+'</div>';document.getElementById('modal').showModal()}
function list(){return window.AttendanceBookV4?.pending()}
function detail(id){return window.AttendanceBookV4?.decision(id)}
function decide(id,status){return window.AttendanceBookV4?.decision(id)}
window.V4TimeAdmin={list,detail,decide};
const install=()=>{if(window.App&&typeof App.manageTimeOccurrences==='function'&&!App.__v4OccurrenceWrapped){App.__v4OccurrenceWrapped=true;const old=App.manageTimeOccurrences;try{App.manageTimeOccurrences=()=>list()}catch{}}};document.addEventListener('DOMContentLoaded',()=>setTimeout(install,500));})();

/* V4 — histórico unificado do livro de ponto por colaborador */
(()=>{'use strict';const K='grupo_saude_v4_demo_2',R=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}},W=s=>localStorage.setItem(K,JSON.stringify(s)),N=()=>new Date().toISOString();
function normalize(){const s=R(),known=new Set((s.timeHistory||[]).map(x=>x.sourceId).filter(Boolean)),projected=[...(s.timeEntries||[]),...(s.timeOccurrences||[])].filter(x=>x.id&&!known.has(x.id)).map(x=>({id:'hist_'+x.id,sourceId:x.id,userId:x.user||x.userId||x.employeeId||null,clinicId:x.clinicId||x.clinic||null,type:x.type,time:x.at||x.time||x.createdAt||null,status:x.status,reason:x.reason||null}));return{...s,timeHistory:[...(s.timeHistory||[]),...projected]}}
function add(){return window.AttendanceBookV4?.prepare()}
window.addEventListener('gs-v4-clock',e=>add(e.detail||{}));document.addEventListener('DOMContentLoaded',()=>setTimeout(normalize,250));window.V4TimeHistory={normalize,add};})();

/* Calendário RH delegado no controlador partilhado: não mantém outro renderer. */
window.V4VacationCalendar={open:id=>window.HRLeaveUIV4.calendar(id),refresh:()=>window.HRLeaveUIV4.renderCalendar(),edit:id=>window.HRLeaveUIV4.open(id)};

/* V4 — férias, baixas, justificações e elegibilidade de bónus trimestral */
(()=>{'use strict';const K='grupo_saude_v4_demo_2',R=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}},W=s=>localStorage.setItem(K,JSON.stringify(s)),N=()=>new Date().toISOString();
function days(a,b){if(!a)return 0;const x=new Date(a+'T00:00:00'),y=new Date((b||a)+'T00:00:00');return Math.max(1,Math.floor((y-x)/86400000)+1)}
function quarter(date=new Date()){return Math.floor(date.getMonth()/3)+1}function qRange(y,q){return[new Date(y,(q-1)*3,1),new Date(y,q*3,0,23,59,59)]}
function eligible(id,y=new Date().getFullYear(),q=quarter()){const s=R(),[a,b]=qRange(y,q);const sick=(s.leave||[]).filter(x=>x.employeeId===id&&/baixa/i.test(x.type||'')&&x.status!=='Recusado').reduce((n,x)=>{const st=new Date(x.start+'T00:00:00'),en=new Date((x.end||x.start)+'T23:59:59');if(en<a||st>b)return n;const lo=st<a?a:st,hi=en>b?b:en;return n+Math.max(1,Math.floor((hi-lo)/86400000)+1)},0);return{eligible:sick<=30,sickDays:sick,reason:sick>30?'Baixa superior a 30 dias no trimestre':'Elegível pelas regras de assiduidade'}}
function decide(id,status){return window.ApprovalsV4.detail('leave',id,'')}
function list(){return window.ApprovalsV4.open()}
function bonus(id){const e=eligible(id);alert((e.eligible?'Elegível para bónus':'Sem direito ao bónus')+' — '+e.sickDays+' dia(s) de baixa. '+e.reason)}
window.V4Absence={days,eligible,decide,list,bonus};})();

/* V4 — pedidos de férias, saldo e conflitos por clínica/função */
(()=>{'use strict';


function balance(s,id,year){return window.HRLeaveV4.balance(s,id,year)}
function conflicts(s,id,start,end){return window.HRLeaveV4.context(s,{employeeId:id,type:'Férias'},window.HRLeaveV4.range(start,end||start)).conflicts.map(v=>({leave:v.record,employee:v.employee}))}
function propose(id){return window.VacationCalendarV4.open(id)}
function requests(){return window.ApprovalsV4.open('vac')}
function decide(lid,status){return window.ApprovalsV4.detail('leave',lid,'')}
window.V4VacationRequests={propose,requests,decide,balance,conflicts};})();

