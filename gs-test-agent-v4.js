/* Grupo Saúde V4 — agente automático de diagnóstico de ligações */
(()=>{'use strict';
const K='grupo_saude_v4_demo_2';
const R=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}};
const FIXED=['CEO','ADMINISTRAÇÃO','ADMINISTRATIVA','MEDICO/A','TECNICO/A','BASICO','CALL CENTER'];
function check(id,label,fn){try{const r=fn();return{id,label,status:r===true?'ok':r===false?'error':'warn',detail:typeof r==='string'?r:''}}catch(e){return{id,label,status:'error',detail:e.message}}}
function run(){
 const s=R(),RA=window.RoleAccessAdminV4,roles=RA?.ROLES||[];
 const results=[
  check('roles','Cargos fixos = tabela mestre',()=>JSON.stringify(roles)===JSON.stringify(FIXED)),
  check('role-source','RH ligado à tabela mestre de cargos',()=>!!RA&&typeof RA.norm==='function'),
  check('permissions','Matriz única de permissões',()=>!!RA&&Array.isArray(RA.actions)&&!!s.roleActionPermissions),
  check('employees','Colaboradores como fonte das áreas reservadas',()=>!!window.HRReservedAccessLinkV4&&!!s.employees),
  check('ceo','Área CEO preservada',()=>!!window.CEOReservedAreaSwitcherV4||String(s.ceoRealUser||s.currentUser)==='u1'),
  check('scope','Âmbito de dados ativo',()=>!!window.AccessScopeV4),
  check('clinics','Fonte mestre de clínicas disponível',()=>Array.isArray(s.clinics)),
  check('duplicate-role-ui','Sem gestão antiga de cargos visível',()=>![...document.querySelectorAll('button')].some(b=>/^Funções\s*\/\s*cargos$|^Funções e cargos$/i.test((b.textContent||'').trim()))),
  check('reserved-duplicates','Sem áreas reservadas RH duplicadas',()=>{const a=(s.users||[]).filter(x=>x?.source==='rh').map(x=>String(x.employeeId||x.id));return new Set(a).size===a.length}),
  check('role-values','Cargos dos colaboradores normalizados',()=>Object.values(s.employees||{}).every(e=>!e.role||FIXED.includes(RA?.norm?.(e.role)||e.role)))
 ];
 Object.entries(s.employees||{}).forEach(([id,e])=>{const area=(s.users||[]).find(u=>String(u.employeeId||u.id)===String(id));results.push(check('area-'+id,'Área reservada — '+(e.name||id),()=>{if(e.active===false||e.hr?.reservedAccess===false)return !area||area.active===false;if(!area)return 'Área reservada em falta';const er=RA?.norm?.(e.role||e.kind||e.profile||e.function),ar=RA?.norm?.(area.role||area.kind);if(er!==ar)return 'Cargo diferente entre RH e área reservada';const ec=(Array.isArray(e.clinics)?e.clinics:(e.clinic?[e.clinic]:[])).map(String).sort().join('|'),ac=(area.clinics||[]).map(String).sort().join('|');if(ec!==ac)return 'Clínicas diferentes entre RH e área reservada';return true}))});
 const views=['dashboard','operation','wait','chat','hr','tasks','audit','clinics','finance','reports','marketing','alerts','security','tables'];views.forEach(v=>results.push(check('view-'+v,'Área '+v+' ligada',()=>!!document.getElementById(v)||!!document.querySelector('[data-view="'+v+'"]'))));
 results.push(check('finance-view','Financeiro / conta corrente ligado',()=>!!document.getElementById('finance')||!!document.querySelector('[data-view="finance"]')));
 results.push(check('finance-records','Movimentos financeiros disponíveis',()=>Array.isArray(s.finance)||Array.isArray(s.movements)||Array.isArray(s.financialMovements)?true:'Estrutura de movimentos financeiros não encontrada'));
 results.push(check('finance-scope','Financeiro respeita âmbito de dados',()=>!!window.AccessScopeV4&&!!RA?.actions?.some?.(x=>x[0]==='account')&&!!RA?.actions?.some?.(x=>x[0]==='financeManage')));
 results.push(check('finance-links','Movimentos ligados a clínica e colaborador',()=>{const m=s.finance||s.movements||s.financialMovements||[];if(!m.length)return true;return m.every(x=>x.employeeId||x.userId||x.collaboratorId)?true:'Existem movimentos sem colaborador associado'}));
 results.push(check('finance-permissions','Separação consultar/gerir financeiro',()=>!!RA?.actions?.find?.(x=>x[0]==='account')&&!!RA?.actions?.find?.(x=>x[0]==='financeManage')));
 const bad=results.filter(x=>x.status!=='ok').length;
 window.GSTestAgentV4.last={at:new Date().toISOString(),results,bad};
 window.dispatchEvent(new CustomEvent('gs:test-agent-complete',{detail:window.GSTestAgentV4.last}));
 return window.GSTestAgentV4.last;
}
function report(){
 const x=run(),icon={ok:'✅',warn:'⚠️',error:'❌'};
 const body='<div class="modal-body"><div class="notice"><b>Agente de Testes V4</b><br>Verifica automaticamente as ligações estruturais do programa. '+(x.bad?'<b>'+x.bad+' problema(s) detetado(s).</b>':'<b>Todas as verificações passaram.</b>')+'</div><div class="card" style="margin-top:12px">'+x.results.map(r=>'<p>'+icon[r.status]+' <b>'+r.label+'</b>'+(r.detail?' — '+r.detail:'')+'</p>').join('')+'</div><div class="actions"><button class="primary" type="button" onclick="GSTestAgentV4.report()">Testar novamente</button></div></div>';
 const m=document.getElementById('modal');if(m){document.getElementById('modalTitle').textContent='Diagnóstico automático';document.getElementById('modalBody').innerHTML=body;m.showModal()}
}
window.GSTestAgentV4={run,report,last:null};
document.addEventListener('DOMContentLoaded',()=>setTimeout(run,1200));
window.addEventListener('gs:reserved-areas-updated',()=>setTimeout(run,50));
})();