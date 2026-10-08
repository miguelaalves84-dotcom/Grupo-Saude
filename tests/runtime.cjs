// Execução do código real num DOM simulado. Não substitui testes num navegador.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const path=require('node:path');
const root=path.join(__dirname,'..');
const KEY='grupo_saude_v4_demo_2';
function environment(initial){
 const storage=new Map(initial?[[KEY,JSON.stringify(initial)]]:[]),elements=new Map(),listeners=new Map(),timers=[];
 class Element{
  constructor(id='',classes=''){this.id=id;this.dataset={};this.style={setProperty(){},removeProperty(){}};this.hidden=false;this.children=[];this.value='';this._html='';this.parentElement=null;this.handlers={};const c=new Set(classes.split(' ').filter(Boolean));this.classList={contains:x=>c.has(x),add:x=>c.add(x),remove:x=>c.delete(x),toggle(x,on){if(on??!c.has(x))c.add(x);else c.delete(x)}};if(id)elements.set(id,this)}
  set innerHTML(html){this._html=html;for(const m of html.matchAll(/id=["']([^"']+)["']/g))if(!elements.has(m[1]))new Element(m[1]);}
  get innerHTML(){return this._html}
  addEventListener(n,f){(this.handlers[n]??=[]).push(f)}
  appendChild(e){e.parentElement=this;this.children.push(e);return e}
  insertBefore(e){return this.appendChild(e)}
  prepend(e){e.parentElement=this;this.children.unshift(e)}
  remove(){elements.delete(this.id);if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this)}
  removeAttribute(k){if(k==='hidden')this.hidden=false}
  querySelector(s){if(s==='.page-head')return this.head;if(s==='button')return this.children.find(x=>x.tagName==='BUTTON')||new Element();if(s==='.cards')return this.grid;return this.querySelectorAll(s)[0]||null}
  querySelectorAll(s){if(s==='button')return this.children.filter(x=>x.tagName==='BUTTON');if(s==='[data-rhtabs]')return this.children.filter(x=>x.dataset.rhtabs);return []}
  closest(s){if(s.includes('[data-view]')&&this.dataset.view)return this;return null}
  click(){const e={target:this,preventDefault(){},stopImmediatePropagation(){this.stopped=true}};for(const f of listeners.get('click')||[]){f(e);if(e.stopped)break}if(!e.stopped)this.onclick?.(e)}
  showModal(){this.open=true} close(){this.open=false}
 }
 const ids=['tables','clock','dashboard','operation','wait','chat','hr','tasks','audit','clinics'];
 for(const id of ids){const e=new Element(id,'view'+(id==='dashboard'?' active':''));e.head=new Element();e.grid=new Element();new Element(id+'Content')}
 for(const id of ['nav','menuBtn','currentUser','modal','modalTitle','modalBody','toast','unread','navUnread'])new Element(id);
 const top=new Element('top','top-actions');
 function nav(id){const b=new Element('nav-'+id,id==='dashboard'?'active':'');b.tagName='BUTTON';b.dataset.view=id;elements.get('nav').appendChild(b);return b}
 ids.forEach(nav);
 const document={readyState:'loading',activeElement:null,documentElement:new Element(),getElementById:id=>elements.get(id)||null,createElement:tag=>{const e=new Element();e.tagName=tag.toUpperCase();return e},addEventListener(n,f,options){const arr=listeners.get(n)||[];options===true?arr.unshift(f):arr.push(f);listeners.set(n,arr)},dispatchEvent(e){for(const f of [...(listeners.get(e.type)||[])])f(e)},querySelectorAll(s){const all=[...elements.values()];if(s==='.view')return all.filter(x=>x.classList.contains('view'));if(s==='.view.active'||s==='section.view.active')return all.filter(x=>x.classList.contains('view')&&x.classList.contains('active'));if(s==='[data-view]'||s==='#nav [data-view]')return elements.get('nav').children.filter(x=>x.dataset.view);if(s==='#nav [data-view].active')return this.querySelectorAll('#nav [data-view]').filter(x=>x.classList.contains('active'));return []},querySelector(s){if(s==='.top-actions')return top;const h=/^#(\w+) \.page-head$/.exec(s);if(h)return elements.get(h[1]).head;if(s.startsWith('#nav [data-view=')){const id=s.match(/"(.*?)"/)?.[1];return elements.get('nav-'+id)}return this.querySelectorAll(s)[0]||null}};
 const context={document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))},console,Intl,Date,Math,JSON,Set,Map,URL,alert(){},confirm:()=>false,prompt:()=>null,location:{reload(){}},navigator:{},MutationObserver:class{observe(){}},CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail}},setTimeout:(f,delay)=>{timers.push({f,delay});return timers.length},clearTimeout(){},setInterval(){},queueMicrotask:f=>timers.push({f,delay:0}),addEventListener(){},dispatchEvent(){}};
 context.window=context;vm.createContext(context);
 const run=(f,source)=>vm.runInContext(source??fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f,timeout:2000});
 const flush=()=>{const batch=timers.splice(0).sort((a,b)=>a.delay-b.delay);for(const t of batch)t.f()};
 return {context,document,elements,run,flush,nav,read:()=>JSON.parse(storage.get(KEY)),write:s=>storage.set(KEY,JSON.stringify(s))};
}
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS',name)}
const baselineDir=process.env.GS_BASELINE_DIR;
const baseline=f=>fs.readFileSync(path.join(baselineDir,f),'utf8');
if(baselineDir){
test('baseline: RH and approvals scripts fail before any code can run',()=>{
 for(const f of ['clinic-hr-architecture.js','approvals-center-v4.js'])assert.throws(()=>new vm.Script(baseline(f)),SyntaxError);
});
test('baseline: extensions create partial state before App DOM initialization',()=>{
 const e=environment();e.run('app.js',baseline('app.js'));e.run('access-scope-v4.js',baseline('access-scope-v4.js'));
 assert.throws(()=>e.document.dispatchEvent({type:'DOMContentLoaded'}),/forEach/);
});
test('baseline: undefined clinics interrupts a seeded startup',()=>{
 const e=environment();e.run('app.js',baseline('app.js'));
 assert.throws(()=>e.document.dispatchEvent({type:'DOMContentLoaded'}),/clinics is not defined/);
});
}else console.log('SKIP historical reproduction: set GS_BASELINE_DIR to files from upstream 84fba5a');
function core(){const e=environment();for(const f of ['app.js','access-scope-v4.js','clinic-hr-architecture.js','ceo-reserved-area-switcher-v4.js','role-access-admin-v4.js'])e.run(f);e.document.dispatchEvent({type:'DOMContentLoaded'});e.flush();return e}
test('fresh startup, synchronous initialization and direct CEO RH',()=>{
 const e=core();assert(e.read().candidates);assert(e.read().users.some(x=>x.id==='u1'));
 assert(e.context.App.showView('hr'));assert(e.elements.get('hr').classList.contains('active'));assert.match(e.elements.get('hrContent').innerHTML,/Recursos Humanos/);
 assert.equal(e.document.querySelectorAll('.view.active').length,1);
});
test('approval access follows active profile, not ceoRealUser',()=>{
 const e=core();e.run('approvals-center-v4.js');const s=e.read();s.currentUser='test_med';s.ceoRealUser='u1';s.leave=[{id:'pending',employeeId:'test_med',type:'Férias',status:'Pendente'}];e.write(s);e.context.ApprovalsV4.decide('leave','pending','','Aprovado');assert.equal(e.read().leave[0].status,'Pendente');
 s.currentUser='test_admin';e.write(s);e.context.ApprovalsV4.decide('leave','pending','','Aprovado');assert.equal(e.read().leave[0].status,'Aprovado');
});
const actors=[['u1','CEO'],['test_admin','ADMINISTRAÇÃO'],['test_adm','ADMINISTRATIVA'],['test_call','CALL CENTER'],['test_med','MEDICO/A'],['test_tec','TECNICO/A'],['test_bas','BASICO']];
for(const [id,role] of actors)test('direct access and permissions: '+role,()=>{
 const e=core(),s=e.read();s.currentUser=id;s.ceoViewingAs=id==='u1'?null:id;e.write(s);e.document.dispatchEvent({type:'gs:user-changed'});
 e.context.RoleAccessAdminV4.apply();
 for(const view of ['dashboard','clock','operation','wait','chat','hr','tasks','audit','tables','clinics']){
  const allowed=e.context.RoleAccessAdminV4.guard(view);const active=e.document.querySelectorAll('.view.active')[0];
  assert.equal(e.context.App.showView(view),allowed,view);
  if(allowed){assert(e.elements.get(view).classList.contains('active'));assert.equal(e.document.querySelectorAll('.view.active').length,1)}
  else assert.equal(e.document.querySelectorAll('.view.active')[0],active,'denied navigation preserves current view');
 }
 assert.equal(e.context.RoleAccessAdminV4.can('hrManage'),['CEO','ADMINISTRAÇÃO'].includes(role));
});
test('RH click then another module is never reverted by delayed RH navigation',()=>{
 const e=core();e.elements.get('nav-hr').click();e.elements.get('nav-dashboard').click();e.flush();assert(e.elements.get('dashboard').classList.contains('active'));
});
test('profile change and immediate CEO return needs no reload',()=>{
 const e=core();for(const id of ['test_med','u1']){e.elements.get('currentUser').onchange({target:{value:id}})}
 assert.equal(e.read().currentUser,'u1');assert.equal(e.read().ceoViewingAs,null);assert(e.context.App.showView('hr'));
});
test('saved restrictions and HR documents survive normalization and render',()=>{
 const e=core(),s=e.read();s.roleActionPermissions['ADMINISTRAÇÃO'].hrManage=false;s.employeeDocuments={test_med:[{id:'keep',dataUrl:'data:text/plain;base64,QQ=='}]};s.leave=[{id:'vac-keep',status:'Aprovado'}];s.customData={keep:true};e.write(s);e.context.RoleAccessAdminV4.ensure();e.context.App.showView('hr');const after=e.read();
 assert.equal(after.roleActionPermissions['ADMINISTRAÇÃO'].hrManage,false);assert.deepEqual(after.employeeDocuments,s.employeeDocuments);assert.deepEqual(after.leave,s.leave);assert.deepEqual(after.customData,s.customData);
});
test('saved duplicate identities are not deleted by the CEO selector',()=>{
 const e=core(),s=e.read();s.users.push({id:'duplicate-keep',email:s.users.find(u=>u.id==='test_admin').email,name:'Outro registo',role:'ADMINISTRAÇÃO'});s.employees['duplicate-keep']={id:'duplicate-keep',name:'Outro registo',hr:{custom:'keep'}};e.write(s);e.context.CEOReservedAreaV4.render();assert(e.read().users.some(u=>u.id==='duplicate-keep'));assert.equal(e.read().employees['duplicate-keep'].hr.custom,'keep');
});
test('edited actor and master clinics are used by the operation renderer',()=>{
 const e=core(),s=e.read();s.currentUser='test_admin';s.employees.test_admin.name='Nome editado no RH';s.clinics=[{id:'real',name:'Clínica real',active:true}];e.write(s);assert(e.context.App.showView('operation'));assert.match(e.elements.get('operationContent').innerHTML,/Nome editado no RH/);assert.match(e.elements.get('operationContent').innerHTML,/Clínica real/);
 s.clinics=[];e.write(s);e.context.App.showView('operation');assert.match(e.elements.get('operationContent').innerHTML,/Sem clínica/);
});
test('calendar and approvals generate valid inline handlers' ,()=>{
 const e=core();e.run('approvals-center-v4.js');const s=e.read();s.leave=[{id:'pending',employeeId:'test_med',type:'Férias',status:'Pendente',start:'2026-10-08',end:'2026-10-09'}];e.write(s);
 e.context.ApprovalsV4.open();
 for(const m of e.elements.get('modalBody').innerHTML.matchAll(/onclick="([^"]*)"/g))new vm.Script(m[1].replaceAll('&#39;',"'").replaceAll('&quot;','"').replaceAll('&amp;','&'));
 e.context.V4VacationCalendar.open();e.context.V4VacationCalendar.refresh();
 for(const m of e.elements.get('vacCalendarBody').innerHTML.matchAll(/onclick="([^"]*)"/g))new vm.Script(m[1].replaceAll('&#39;',"'").replaceAll('&quot;','"').replaceAll('&amp;','&'));
});
test('unknown identity does not become CEO',()=>{
 const e=core(),s=e.read();s.currentUser='missing';e.write(s);assert.equal(e.context.RoleAccessAdminV4.can('hrManage'),false);assert.equal(e.context.App.showView('hr'),false);
});
test('late module nav uses same delegated navigation',()=>{
 const e=core();const section=new (e.elements.get('hr').constructor)('reports','view');e.nav('reports');let renders=0;e.context.GSEnterprise={render:id=>{assert.equal(id,'reports');renders++}};e.elements.get('nav-reports').click();assert(section.classList.contains('active'));assert.equal(renders,1);
});
console.log(JSON.stringify({passed,scope:'JavaScript real + DOM simulado; navegador e backend não executados'}));
