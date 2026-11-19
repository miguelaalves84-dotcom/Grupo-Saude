/* Acessibilidade: zonas que deslizam (tabelas largas, funil, marcações por hora) ficam acessíveis pelo teclado
   e têm nome para leitores de ecrã. Não altera dados nem aspeto. */
(function(){'use strict';
 const SEL='.table-wrap,.ending-table-wrap,.funnel,.booked-slots,.complaints-board,.tw';
 function label(el){const h=el.closest('section,article,.card,.panel')?.querySelector('h1,h2,h3,legend');return (h?.textContent||'Conteúdo').trim().slice(0,80)}
 function fix(){for(const el of document.querySelectorAll(SEL)){if(el.hasAttribute('tabindex'))continue;const scrolls=el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1;if(!scrolls)continue;el.setAttribute('tabindex','0');if(!el.hasAttribute('role'))el.setAttribute('role','region');if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label',label(el))}}
 let t=0;const run=()=>{clearTimeout(t);t=setTimeout(fix,60)};
 const start=()=>{fix();new MutationObserver(run).observe(document.body,{childList:true,subtree:true});addEventListener('resize',run)};
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
 window.GSA11y={fix};
})();
