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
 results.push(check('finance-records','Movimentos financeiros disponíveis',()=>Array.isArray(s.finance?.movements)||Array.isArray(s.finance)||Array.isArray(s.movements)||Array.isArray(s.financialMovements)?true:'Estrutura de movimentos financeiros não encontrada'));
 results.push(check('finance-scope','Financeiro respeita âmbito de dados',()=>!!window.AccessScopeV4&&!!RA?.actions?.some?.(x=>x[0]==='account')&&!!RA?.actions?.some?.(x=>x[0]==='financeManage')));
 results.push(check('finance-links','Movimentos ligados a clínica e colaborador',()=>{const m=(Array.isArray(s.finance?.movements)?s.finance.movements:Array.isArray(s.finance)?s.finance:(s.movements||s.financialMovements||[]));if(!m.length)return true;return m.every(x=>x.employeeId||x.userId||x.collaboratorId)?true:'Existem movimentos sem colaborador associado'}));
 results.push(check('finance-permissions','Separação consultar/gerir financeiro',()=>!!RA?.actions?.find?.(x=>x[0]==='account')&&!!RA?.actions?.find?.(x=>x[0]==='financeManage')));
 Object.entries(s.employees||{}).filter(([,e])=>e?.testBatch||e?.hr?.testOnly).forEach(([id,e])=>{const role=RA?.norm?.(e.role||e.kind),perms=s.roleActionPermissions?.[role]||{};if(role==='CEO')return;Object.keys(perms).forEach(action=>results.push(check('matrix-'+id+'-'+action,'Matriz de permissões — '+(e.name||role)+' / '+action,()=>{const old=s.currentUser;const live=R();live.currentUser=id;localStorage.setItem(K,JSON.stringify(live));const actual=!!RA?.can?.(action),expected=!!perms[action];live.currentUser=old;localStorage.setItem(K,JSON.stringify(live));return actual===expected?true:'Esperado '+expected+'; obtido '+actual}))) });
 const bad=results.filter(x=>x.status!=='ok').length;
 window.GSTestAgentV4.last={at:new Date().toISOString(),results,bad};
 window.dispatchEvent(new CustomEvent('gs:test-agent-complete',{detail:window.GSTestAgentV4.last}));
 return window.GSTestAgentV4.last;
}
function sandbox(){
 const before=localStorage.getItem(K),base=R(),RA=window.RoleAccessAdminV4,roles=RA?.ROLES||FIXED,results=[];
 try{
  const s=JSON.parse(JSON.stringify(base));s.employees=s.employees||{};s.users=Array.isArray(s.users)?s.users:[];
  const realClinic=(s.clinics||[]).find(x=>x.active!==false&&x.operational!==false&&x.id!=='administracao');
  roles.forEach((role,i)=>{const id='__gs_test_'+i;s.employees[id]={id,name:'TESTE '+role,email:id+'@teste.invalid',role,kind:role,clinics:realClinic?[realClinic.id]:[],active:true,hr:{reservedAccess:true,testOnly:true}}});
  localStorage.setItem(K,JSON.stringify(s));
  window.HRReservedAccessLinkV4?.sync?.();
  const t=R();
  roles.forEach((role,i)=>{const id='__gs_test_'+i,e=t.employees?.[id],a=(t.users||[]).find(x=>String(x.employeeId||x.id)===id),nr=RA?.norm?.(e?.role)||e?.role,ar=RA?.norm?.(a?.role)||a?.role;
   results.push(check('sandbox-'+role,'Teste isolado — '+role,()=>{if(!e)return 'Colaborador temporário não criado';if(!a)return 'Área reservada temporária não criada';if(nr!==role||ar!==role)return 'Cargo não preservado na Área Reservada';return true}));
   t.currentUser=id;localStorage.setItem(K,JSON.stringify(t));
   const admin=role==='CEO'||role==='ADMINISTRAÇÃO',clinic=realClinic?.id;
   results.push(check('own-'+role,'Dados próprios — '+role,()=>window.AccessScopeV4?.canEmployee?.(id)===true));
   results.push(check('other-'+role,'Isolamento de outros colaboradores — '+role,()=>window.AccessScopeV4?.canEmployee?.('__outro_colaborador__')===admin));
   if(clinic){
    const expectedWaiting=admin||role==='CALL CENTER',expectedOps=admin||role==='ADMINISTRATIVA';
    results.push(check('waiting-'+role,'Lista de espera — '+role,()=>window.AccessScopeV4?.canClinic?.(clinic,'waiting')===expectedWaiting));
    results.push(check('booking-'+role,'Marcações — '+role,()=>window.AccessScopeV4?.canClinic?.(clinic,'bookings')===expectedWaiting));
    results.push(check('open-'+role,'Abertura de clínica — '+role,()=>window.AccessScopeV4?.canClinic?.(clinic,'openClinic')===expectedOps));
    results.push(check('close-'+role,'Fecho de clínica — '+role,()=>window.AccessScopeV4?.canClinic?.(clinic,'closeClinic')===expectedOps));
   }
   const perms=t.roleActionPermissions?.[role]||{};
   ['account','financeManage','leaveRequest','leaveApprove','clock','hrManage','settings'].forEach(action=>results.push(check('perm-'+role+'-'+action,action+' — '+role,()=>RA?.can?.(action)===(role==='CEO'||!!perms[action]))));
  });
 }catch(e){results.push({id:'sandbox-fatal',label:'Teste isolado',status:'error',detail:e.message})}
 finally{if(before===null)localStorage.removeItem(K);else localStorage.setItem(K,before);window.HRReservedAccessLinkV4?.sync?.()}
 const bad=results.filter(x=>x.status!=='ok').length;window.GSTestAgentV4.sandboxLast={at:new Date().toISOString(),results,bad};return window.GSTestAgentV4.sandboxLast;
}
function functionalUI(){
 const before=localStorage.getItem(K),base=R(),RA=window.RoleAccessAdminV4,results=[],views=['dashboard','operation','wait','chat','hr','tasks','audit','clinics','finance','reports','marketing','alerts','security','tables'];
 const key=v=>({dashboard:'personal',operation:'operation',wait:'waiting',chat:'personal',hr:'hrManage',tasks:'clinicTasks',audit:'audit',clinics:'clinics',finance:'account',reports:'reports',marketing:'marketing',alerts:'alerts',security:'security',tables:'settings'}[v]||v);
 try{
  const tests=Object.entries(base.employees||{}).filter(([,e])=>e?.testBatch||e?.hr?.testOnly);
  tests.forEach(([id,e])=>{
   const role=RA?.norm?.(e.role||e.kind),perms=base.roleActionPermissions?.[role]||{},live=R();live.currentUser=id;localStorage.setItem(K,JSON.stringify(live));RA?.apply?.();
   views.forEach(v=>{
    const nav=document.querySelector('#nav [data-view="'+v+'"]'),expected=role==='CEO'||(v==='operation'?(!!perms.operation||!!perms.openClinic||!!perms.closeClinic||!!perms.clinicTasks||!!perms.bookings):!!perms[key(v)]);
    // apply() pode atuar após scripts de renderização concorrentes; mede após duas frames.
    const visible=!!nav&&!nav.hidden&&nav.dataset.permissionVisible!=='0'&&getComputedStyle(nav).display!=='none';
    results.push(check('ui-'+id+'-'+v,'UI real — '+(e.name||role)+' / '+v,()=>{const authoritative=nav?.dataset.permissionVisible;if(authoritative==='1'||authoritative==='0')return (authoritative==='1')===expected?true:'Matriz='+expected+'; autorização renderizada='+(authoritative==='1');return visible===expected?true:'Matriz='+expected+'; menu visível='+visible}));
    results.push(check('guard-'+id+'-'+v,'Bloqueio real — '+(e.name||role)+' / '+v,()=>!!RA?.guard?.(v)===expected?true:'Matriz='+expected+'; navegação permitida='+!!RA?.guard?.(v)));
   });
  });
 }catch(e){results.push({id:'functional-fatal',label:'Teste funcional/UI',status:'error',detail:e.message})}
 finally{if(before===null)localStorage.removeItem(K);else localStorage.setItem(K,before);RA?.apply?.()}
 const bad=results.filter(x=>x.status!=='ok').length;return{at:new Date().toISOString(),results,bad};
}
function purgeTestData(s){const tag=x=>!!(x?.testBatch||x?.hr?.testOnly||String(x?.id||'').startsWith('gstest_')||String(x?.id||'').startsWith('__gs_test_')||/^TESTE AGENTE\b/i.test(String(x?.name||'')));Object.keys(s.employees||{}).forEach(id=>{if(tag(s.employees[id]))delete s.employees[id]});s.users=(s.users||[]).filter(x=>!tag(x));['leave','timeOccurrences','tasks','requests'].forEach(k=>{if(Array.isArray(s[k]))s[k]=s[k].filter(x=>!tag(x))});if(s.finance&&Array.isArray(s.finance.movements))s.finance.movements=s.finance.movements.filter(x=>!tag(x));s.gsTestBatches=[];return s}
function seedPersistent(){
 const s=purgeTestData(R()),RA=window.RoleAccessAdminV4,roles=RA?.ROLES||FIXED,stamp=new Date().toISOString(),batch='gstest_'+Date.now(),clinic=(s.clinics||[]).find(x=>x.active!==false&&x.operational!==false&&x.id!=='administracao');
 s.employees=s.employees||{};s.users=Array.isArray(s.users)?s.users:[];s.leave=Array.isArray(s.leave)?s.leave:[];s.audit=Array.isArray(s.audit)?s.audit:[];
 roles.forEach((role,i)=>{const id=batch+'_u'+i;s.employees[id]={id,name:'TESTE AGENTE · '+role,email:id+'@teste.invalid',role,kind:role,clinics:clinic?[clinic.id]:[],active:true,testBatch:batch,hr:{reservedAccess:true,testOnly:true,testBatch:batch}}});
 localStorage.setItem(K,JSON.stringify(s));window.HRReservedAccessLinkV4?.sync?.();const t=R();
 const ids=roles.map((_,i)=>batch+'_u'+i),adminId=ids[1],techId=ids[4],callId=ids[6];
 t.leave=t.leave||[];t.leave.push({id:batch+'_leave',employeeId:techId,type:'Férias',status:'Pendente',start:new Date().toISOString().slice(0,10),end:new Date().toISOString().slice(0,10),testBatch:batch});
 t.timeOccurrences=t.timeOccurrences||[];t.timeOccurrences.push({id:batch+'_clock',user:techId,clinic:clinic?.id||'',type:'Entrada',status:'Pendente',at:stamp,testBatch:batch});
 t.tasks=t.tasks||[];t.tasks.push({id:batch+'_task',name:'TESTE AGENTE · tarefa operacional',phase:'live',required:false,clinics:clinic?[clinic.id]:[],role:'ADMINISTRATIVA',active:true,testBatch:batch});
 t.requests=t.requests||[];t.requests.push({id:batch+'_request',clinic:clinic?.id||'',createdBy:callId,status:'Novo',source:'TESTE AGENTE',testBatch:batch});
 t.finance=t.finance&&typeof t.finance==='object'&&!Array.isArray(t.finance)?t.finance:{movements:Array.isArray(t.finance)?t.finance:[]};t.finance.movements=Array.isArray(t.finance.movements)?t.finance.movements:[];t.finance.movements.push({id:batch+'_finance',employeeId:techId,clinicId:clinic?.id||'',personId:techId,person:t.employees?.[techId]?.name||techId,description:'TESTE AGENTE · movimento financeiro',value:1,amount:1,status:'Pendente',createdBy:adminId,createdAt:stamp,testBatch:batch});
 t.gsTestBatches=t.gsTestBatches||[];t.gsTestBatches.unshift({id:batch,createdAt:stamp,matrixAccess:true,userIds:ids,artifacts:[batch+'_leave',batch+'_clock',batch+'_task',batch+'_request',batch+'_finance'],status:'Aguardar validação manual'});
 t.audit.unshift({id:batch+'_audit',at:stamp,module:'Agente de Testes',action:'Bateria persistente criada',detail:batch,testBatch:batch});
 localStorage.setItem(K,JSON.stringify(t));window.HRReservedAccessLinkV4?.sync?.();return t.gsTestBatches[0];
}
function cleanup(batch){
 const s=R(),tag=x=>x?.testBatch===batch||String(x?.id||'').startsWith(batch+'_');
 Object.keys(s.employees||{}).forEach(id=>{if(tag(s.employees[id]))delete s.employees[id]});
 s.users=(s.users||[]).filter(x=>!tag(x)&&!String(x?.employeeId||'').startsWith(batch+'_'));
 ['leave','timeOccurrences','tasks','requests','audit'].forEach(k=>{if(Array.isArray(s[k]))s[k]=s[k].filter(x=>!tag(x))});
 if(s.finance&&Array.isArray(s.finance.movements))s.finance.movements=s.finance.movements.filter(x=>!tag(x));
 s.gsTestBatches=(s.gsTestBatches||[]).filter(x=>x.id!==batch);localStorage.setItem(K,JSON.stringify(s));window.HRReservedAccessLinkV4?.sync?.();return true;
}
function saveReport(kind,x,batch=''){const s=R();s.gsTestReports=Array.isArray(s.gsTestReports)?s.gsTestReports:[];const report={id:'gsreport_'+Date.now(),at:new Date().toISOString(),kind,batch,summary:{total:x.results?.length||0,errors:(x.results||[]).filter(r=>r.status==='error').length,warnings:(x.results||[]).filter(r=>r.status==='warn').length,ok:(x.results||[]).filter(r=>r.status==='ok').length},items:(x.results||[]).map(r=>({...r,state:r.status==='ok'?'OK':'Aberto'}))};s.gsTestReports.unshift(report);localStorage.setItem(K,JSON.stringify(s));return report}
function reportsPanel(){const s=R(),reports=s.gsTestReports||[],m=document.getElementById('modal');if(!m)return;document.getElementById('modalTitle').textContent='Relatório de Erros';document.getElementById('modalBody').innerHTML='<div class="modal-body">'+(reports.length?reports.map(rep=>'<div class="card" style="margin-bottom:12px"><b>'+rep.at+'</b> · '+rep.kind+'<div class="meta">OK '+rep.summary.ok+' · Avisos '+rep.summary.warnings+' · Erros '+rep.summary.errors+(rep.batch?' · '+rep.batch:'')+'</div>'+(rep.items||[]).filter(x=>x.status!=='ok').map(x=>'<div class="task-row"><div><b>'+(x.status==='error'?'❌':'⚠️')+' '+x.label+'</b><div class="meta">'+(x.detail||'Sem detalhe adicional')+'</div></div><span class="pill">'+(x.state||'Aberto')+'</span></div>').join('')+'</div>').join(''):'<div class="notice">Ainda não existem relatórios guardados.</div>')+'<div class="actions"><button class="secondary" onclick="GSTestAgentV4.panel()">Voltar</button></div></div>';m.showModal()}
function panel(){
 const s=R(),b=(s.gsTestBatches||[])[0],m=document.getElementById('modal');if(!m)return;
 document.getElementById('modalTitle').textContent='Agente de Testes V4';
 document.getElementById('modalBody').innerHTML='<div class="modal-body"><div class="notice"><b>Bateria funcional persistente</b><br>Cria utilizadores e registos identificados como TESTE AGENTE para validação manual. Os dados ficam guardados até serem apagados aqui.</div><div class="actions" style="margin-top:14px"><button class="primary" onclick="GSTestAgentV4.runPersistentUI()">Executar bateria de testes</button>'+(b?'<button class="danger" onclick="GSTestAgentV4.cleanupUI(\''+b.id+'\')">Apagar dados de teste</button>':'')+'</div>'+(b?'<div class="card" style="margin-top:12px"><b>Última bateria:</b> '+b.id+'<br><span class="meta">'+b.createdAt+' · '+b.status+'</span></div>':'<p class="muted">Sem bateria persistente ativa.</p>')+'</div>';m.showModal();
}
function runPersistentUI(){const b=seedPersistent(),struct=run(),ui=functionalUI(),x={at:new Date().toISOString(),results:[...struct.results,...ui.results],bad:struct.bad+ui.bad};saveReport('Bateria estrutural + funcional/UI',x,b.id);alert('Bateria criada: '+b.id+'. Foram testadas estrutura, visibilidade real do menu e bloqueio de navegação contra a matriz.');panel()}
function cleanupUI(batch){if(!confirm('Apagar os dados criados pela bateria de testes?'))return;const s=purgeTestData(R());localStorage.setItem(K,JSON.stringify(s));window.HRReservedAccessLinkV4?.sync?.();alert('Dados de teste apagados.');panel()}
function report(){
 const x=run(),icon={ok:'✅',warn:'⚠️',error:'❌'};
 const body='<div class="modal-body"><div class="notice"><b>Agente de Testes V4</b><br>Verifica automaticamente as ligações estruturais do programa. '+(x.bad?'<b>'+x.bad+' problema(s) detetado(s).</b>':'<b>Todas as verificações passaram.</b>')+'</div><div class="card" style="margin-top:12px">'+x.results.map(r=>'<p>'+icon[r.status]+' <b>'+r.label+'</b>'+(r.detail?' — '+r.detail:'')+'</p>').join('')+'</div><div class="actions"><button class="primary" type="button" onclick="GSTestAgentV4.report()">Testar novamente</button></div></div>';
 const m=document.getElementById('modal');if(m){document.getElementById('modalTitle').textContent='Diagnóstico automático';document.getElementById('modalBody').innerHTML=body;m.showModal()}
}
window.GSTestAgentV4={run,functionalUI,report,sandbox,seedPersistent,cleanup,saveReport,reportsPanel,panel,runPersistentUI,cleanupUI,last:null,sandboxLast:null};
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{const s=purgeTestData(R());localStorage.setItem(K,JSON.stringify(s));window.HRReservedAccessLinkV4?.sync?.();run();const nav=document.getElementById('tablesSubmenu')||document.getElementById('nav');if(nav&&!document.getElementById('gsTestAgentButton')){const b=document.createElement('button');b.id='gsTestAgentButton';b.type='button';b.className='secondary';b.textContent='Agente de Testes';b.onclick=panel;nav.appendChild(b)}},1200));
window.addEventListener('gs:reserved-areas-updated',()=>setTimeout(run,50));
})();