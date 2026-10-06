/* Grupo Saúde V4 — submenu de Tabelas sem competir com a navegação principal */
(()=>{'use strict';
function init(){
 const nav=document.getElementById('nav'); if(!nav)return;
 const tables=nav.querySelector('button[data-view="tables"]');
 const clinic=nav.querySelector('button[data-view="clinics"]')||[...nav.querySelectorAll('button')].find(b=>/^Clínicas$/i.test(b.textContent.trim()));
 if(!tables)return;
 // data-view="tables" é tratado exclusivamente pelo App/showTables. Este script só organiza subitens.
 let box=document.getElementById('tablesSubmenu');
 if(!box){box=document.createElement('div');box.id='tablesSubmenu';box.style.cssText='padding:4px 0 8px 18px';tables.insertAdjacentElement('afterend',box)}
 if(clinic&&clinic.parentElement!==box){box.appendChild(clinic);clinic.style.cssText='width:100%;margin:1px 0;text-align:left'}
 const perm=document.getElementById('rolePermissionsNav');
 if(perm&&perm.parentElement!==box){box.appendChild(perm);perm.style.cssText='width:100%;margin:1px 0;text-align:left'}
}
function start(){init();new MutationObserver(init).observe(document.getElementById('nav')||document.body,{childList:true,subtree:true})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();