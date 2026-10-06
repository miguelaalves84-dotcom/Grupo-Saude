/* Grupo Saúde V4 — navegação de Tabelas: sem submenu duplicado */
(()=>{'use strict';
function cleanup(){
 const nav=document.getElementById('nav'); if(!nav)return;
 const tables=nav.querySelector('[data-view="tables"]');
 const clinics=nav.querySelector('[data-view="clinics"]');
 const perm=document.getElementById('rolePermissionsNav');
 const box=document.getElementById('tablesSubmenu');
 if(perm)perm.remove();
 if(box){ if(clinics&&box.contains(clinics))tables?.insertAdjacentElement('afterend',clinics); box.remove(); }
 // Clínicas é gerida dentro da página Tabelas; não deve existir como submenu concorrente.
 if(clinics)clinics.remove();
}
function boot(){cleanup();new MutationObserver(cleanup).observe(document.getElementById('nav')||document.body,{childList:true,subtree:true})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
})();