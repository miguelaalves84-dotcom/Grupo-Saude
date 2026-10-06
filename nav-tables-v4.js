/* Grupo Saúde V4 — agrupar APENAS Clínicas dentro de Tabelas / Configuração sem remover módulos */
(()=>{'use strict';
function init(){const nav=document.getElementById('nav');if(!nav)return;
 const tables=[...nav.querySelectorAll('button')].find(b=>/Tabelas\s*\/\s*Configuração/i.test(b.textContent));
 const clinic=[...nav.querySelectorAll('button')].find(b=>b.dataset.view==='clinics'||/^Clínicas$/i.test(b.textContent.trim()));
 if(!tables)return;
 // O botão Tabelas é criado dinamicamente depois do init do app; garantir navegação própria.
 if(!tables.dataset.v4TablesOpen){tables.dataset.v4TablesOpen='1';tables.addEventListener('click',e=>{if(tables.dataset.view==='tables'){e.preventDefault();document.querySelectorAll('main .view').forEach(v=>v.classList.remove('active'));document.getElementById('tables')?.classList.add('active');document.querySelectorAll('#nav [data-view]').forEach(b=>b.classList.toggle('active',b===tables));nav.classList.remove('open');}},true)}
 let box=document.getElementById('tablesSubmenu');
 if(!box){box=document.createElement('div');box.id='tablesSubmenu';box.style.cssText='display:none;padding:4px 0 8px 18px';tables.insertAdjacentElement('afterend',box);
 tables.addEventListener('click',e=>{if(!tables.dataset.view){e.preventDefault();box.style.display=box.style.display==='none'?'block':'none';tables.setAttribute('aria-expanded',box.style.display==='block')}});}
 if(clinic&&clinic.parentElement!==box){box.appendChild(clinic);clinic.style.cssText='width:100%;margin:1px 0;text-align:left'}
 const perm=document.getElementById('rolePermissionsNav');if(perm&&perm.parentElement!==box){box.appendChild(perm);perm.style.cssText='width:100%;margin:1px 0;text-align:left'}
 if((clinic&&clinic.classList.contains('active'))||(perm&&!perm.hidden))box.style.display=box.style.display||'none';
}
const start=()=>{init();new MutationObserver(()=>init()).observe(document.getElementById('nav')||document.body,{childList:true,subtree:true})};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();