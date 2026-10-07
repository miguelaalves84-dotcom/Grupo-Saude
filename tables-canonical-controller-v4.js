/* V4 — controlador canónico e único da vista Tabelas / Configuração */
(()=>{'use strict';
function openTables(e){
 const b=e?.target?.closest?.('[data-view="tables"]');if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();
 const view=document.getElementById('tables');if(!view)return;
 document.querySelectorAll('main .view').forEach(v=>v.classList.toggle('active',v===view));
 document.querySelectorAll('#nav [data-view]').forEach(n=>n.classList.toggle('active',n===b));
 document.getElementById('nav')?.classList.remove('open');
 window.GSClinicStructureV4?.install?.();
 window.ContractTypesV4?.injectTable?.();
 window.ClinicCalendarsV4?.install?.();
 window.scrollTo({top:0,behavior:'auto'});
}
document.addEventListener('click',openTables,true);
window.TablesCanonicalV4={open:()=>openTables({target:document.querySelector('[data-view="tables"]'),preventDefault(){},stopImmediatePropagation(){}})};
})();