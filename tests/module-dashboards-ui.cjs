'use strict';
// Exercise the existing renderer with synthetic projections; no browser, API or database.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../module-dashboards-ui-v4.js'),'utf8')
 .replace('window.ModuleDashboardsV4={render,visit,init,executive};init();','window.ModuleDashboardsV4={dashboardMarkup};');
const sandbox={window:{},document:{addEventListener(){}},GSModuleDashboards:{},RoleAccessAdminV4:{guard:()=>true}};
vm.runInNewContext(source,sandbox);
const render=sandbox.window.ModuleDashboardsV4.dashboardMarkup;
const ids=['requests','clock','documents','occurrences','pendingRequests','approvedRequests','ownDocumentIssues'];
const d={start:'2026-11-01',end:'2026-11-30',clinicId:'',clinics:[{id:'synthetic-a',name:'SYN A'}],context:[],metrics:ids.map(id=>({id,label:id,section:'Original '+id,value:0,unit:'registos',source:'Fonte sintética',route:'myhr'}))};
const before=JSON.stringify(d),html=render(d,'personal');
assert.equal((html.match(/class="module-subject"/g)||[]).length,3);
for(const id of ids)assert(html.includes('data-module-metric="'+id+'"'));
assert(html.includes('<label hidden>Clínica'));
assert(!html.includes('Sem séries suficientes'));
assert(html.includes('Demonstração sintética neste navegador'));
assert.equal(JSON.stringify(d),before);
assert(!render({...d,clinics:[...d.clinics,{id:'synthetic-b',name:'SYN B'}]},'personal').includes('<label hidden>Clínica'));
const system={...d,metrics:[],context:['Autenticação','Base de dados central','Emails funcionais','Arquivo privado','Backups operacionais','Integrações externas','Versão e testes'].map((title,i)=>({title,status:i===6?'Não verificado':'Inativo',text:'Sem integração real',global:true,pendingImplementation:i<6}))};
const sysBefore=JSON.stringify(system),systemHTML=render(system,'system');
assert.equal((systemHTML.match(/class="card module-context"/g)||[]).length,7);
assert(systemHTML.indexOf('Versão e testes')<systemHTML.indexOf('<form'));
assert(systemHTML.includes('Filtros de utilizadores e auditoria'));
assert(systemHTML.includes('Implementações pendentes'));
assert.equal((systemHTML.match(/class="module-service-state">Inativo/g)||[]).length,6);
assert.equal(JSON.stringify(system),sysBefore);
for(const key of ['management','operation','hr','finance']){
 const out=render(d,key);
 for(const id of ids)assert(out.includes('data-module-metric="'+id+'"'));
 assert(out.includes('name="clinicId"')&&out.includes('name="start"')&&out.includes('name="end"'));
}
console.log('PASS dashboard UI: personal grouping, all indicator IDs retained, single/multiple clinic controls, seven unchanged global service states, scoped system filters, synthetic notice and immutable inputs.');
