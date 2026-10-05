/* Grupo Saúde V4 — Tabelas / Configuração como menu-pai */
(()=>{'use strict';
const items=[
 ['clinics','Clínicas'],['specialties','Especialidades'],['roles','Funções / Perfis'],
 ['contracts','Tipos de contrato'],['documents','Tipos de documentos'],['origins','Origens dos pedidos'],['checklists','Checklists']
];
function go(view){const direct=document.querySelector(`#nav button[data-view="${view}"]`);if(direct){direct.click();return}const tables=document.querySelector('#nav button[data-view="tables"],#nav button[data-view="config"]');if(tables){tables.click();setTimeout(()=>{const target=document.querySelector(`[data-table-view="${view}"],[data-master="${view}"]`);target?.click()},50)}}
function init(){const nav=document.getElementById('nav');if(!nav)return;let tables=[...nav.querySelectorAll('button')].find(b=>/Tabelas\s*\/\s*Configuração/i.test(b.textContent));if(!tables)return;
 let box=document.getElementById('tablesSubmenu');if(!box){box=document.createElement('div');box.id='tablesSubmenu';box.style.cssText='display:none;padding:4px 0 8px 18px';tables.insertAdjacentElement('afterend',box);tables.addEventListener('click',e=>{e.preventDefault();box.style.display=box.style.display==='none'?'block':'none';tables.setAttribute('aria-expanded',box.style.display==='block')});}
 items.forEach(([view,label])=>{let b=[...nav.querySelectorAll('button')].find(x=>x.dataset.view===view||x.textContent.trim()===label);if(!b){b=document.createElement('button');b.type='button';b.dataset.tableView=view;b.innerHTML=`<span>${label}</span>`;b.onclick=()=>go(view)};b.style.cssText='width:100%;margin:1px 0;text-align:left';box.appendChild(b)});
 const clinic=box.querySelector('button[data-view="clinics"]');if(clinic?.classList.contains('active'))box.style.display='block';
}
const start=()=>{init();new MutationObserver(init).observe(document.getElementById('nav')||document.body,{childList:true,subtree:true})};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();