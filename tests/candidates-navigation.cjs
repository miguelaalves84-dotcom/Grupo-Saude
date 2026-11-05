'use strict';
module.exports=({core,test,assert})=>{
 test('candidates: own header, five columns and original process preserved; employee heading restored',()=>{
  const e=core(),head=e.elements.get('hr').head,title=e.document.createElement('h1'),description=e.document.createElement('p'),query=head.querySelector.bind(head);
  head.querySelector=q=>q==='h1'?title:q==='p'?description:query(q);
  const row={id:'synthetic-candidate',name:'SYN Candidatura',email:'cv@example.invalid',stage:'Entrevista marcada',history:[{action:'preserve'}],documents:[{id:'synthetic-cv',name:'SYN CV.pdf'}],interview:{notes:'SYN notas'}};
  const before=JSON.stringify(row);e.context.CommunicationsV4={candidates:()=>[row]};
  assert(e.context.V4ClinicHR.showCandidates());
  assert.equal(e.elements.get('hr').dataset.hrContext,'candidates');assert.equal(title.textContent,'Candidatos');assert.equal(description.textContent,'Recrutamento e seleção');
  const html=e.elements.get('hrContent').innerHTML;
  assert.equal((html.match(/class="card candidate-column"/g)||[]).length,5);
  for(const value of ['+ Candidato / CV','candidateStageFilter','data-interview-open="synthetic-candidate"','data-candidate-move','SYN Candidatura'])assert(html.includes(value),value);
  assert(!html.includes('Backoffice RH'));assert(!html.includes('Áreas de gestão de colaboradores'));assert.equal(JSON.stringify(row),before);
  assert(e.context.V4ClinicHR.showEmployees());assert.equal(e.elements.get('hr').dataset.hrContext,'employees');assert.equal(title.textContent,'Colaboradores');assert.equal(description.textContent,'Colaboradores e gestão de pessoas');assert(e.elements.get('hrContent').innerHTML.includes('employee-list-panel'));
 });
 test('candidates: approvals and institutional backoffice never inject into recruitment; retained for employees',()=>{
  const e=core();assert(e.context.V4ClinicHR.showCandidates());e.run('approvals-center-v4.js');e.context.ApprovalsV4.sync();
  assert(!e.elements.get('hrContent').children.some(x=>x.id==='hrApprovalsCard'));
  e.run('hr-portal-ui-v4.js');for(let i=0;i<3;i++)e.document.dispatchEvent({type:'gs:state-changed'});
  assert(!e.elements.get('hrContent').children.some(x=>x.id==='portalBackofficeEntry'));
  assert(e.context.V4ClinicHR.showEmployees());e.document.dispatchEvent({type:'gs:state-changed'});
  assert(e.elements.get('hrContent').children.some(x=>x.id==='portalBackofficeEntry'));
 });
 test('candidates: view switches respect all six effective profile permissions and never inherit CEO',()=>{
  for(const id of ['u1','test_admin','test_adm','test_med','test_tec','test_call']){
   const e=core(),s=e.read();s.currentUser=id;s.ceoRealUser='u1';e.write(s);
   const allowed=e.context.RoleAccessAdminV4.can('hrManage'),before=JSON.stringify(e.read().candidates);
   assert.equal(e.context.V4ClinicHR.showCandidates(),allowed,id);assert.equal(JSON.stringify(e.read().candidates),before,id);
  }
 });
 test('candidates: stage filter and clearing change only card visibility and reuse shared search',()=>{
  const e=core(),root=e.elements.get('hrContent'),query=root.querySelector.bind(root),queryAll=root.querySelectorAll.bind(root),cards=['Candidatos','Entrevista marcada','Em análise'].map(stage=>{const card=e.document.createElement('article');card.dataset.candidateStage=stage;return card});
  root.querySelector=q=>q==='#candidateStageFilter'?e.elements.get('candidateStageFilter')||null:query(q);
  root.querySelectorAll=q=>q==='.candidate-card'?cards:queryAll(q);
  let refreshed=0;e.context.GSSearchV4={refresh:()=>refreshed++};e.context.CommunicationsV4={candidates:()=>[]};
  assert(e.context.V4ClinicHR.showCandidates());const input=e.elements.get('candidateStageFilter'),change=input.handlers.change[0];
  input.value='Entrevista marcada';change();assert.deepEqual(cards.map(x=>x.hidden),[true,false,true]);
  input.value='';change();assert.deepEqual(cards.map(x=>x.hidden),[false,false,false]);assert.equal(refreshed,3);
 });

};
