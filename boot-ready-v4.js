/* Ecrã de carregamento: a página só aparece quando o programa está pronto (menu organizado, perfil e ecrã inicial escolhidos
   e, com sessão real, os dados do servidor recebidos). Evita ver por instantes o menu por arrumar e o painel de testes.
   Segurança: nunca fica preso — some ao fim de 8 s, ou 30 s enquanto os dados do servidor estão a chegar (definido no index.html). */
(function(){'use strict';
 const root=document.documentElement,start=Date.now();
 const ready=()=>{const app=!!(window.App&&window.WorkspaceShellV4),sync=root.dataset.syncBoot!=='pending',nav=document.querySelector('#nav details[data-nav-group]'),view=document.querySelector('main .view.active');return app&&sync&&!!nav&&!!view};
 function reveal(){if(!root.classList.contains('gs-booting'))return;try{window.WorkspaceShellV4?.organize?.()}catch{}requestAnimationFrame(()=>requestAnimationFrame(()=>{root.classList.remove('gs-booting');root.dataset.booted=String(Date.now()-start)}))}
 /* Se os dados do servidor demorarem, explica o que está a acontecer (o ecrã espera por eles até 30 s). */
 function check(){if(ready())return reveal();const w=Date.now()-start;if(w>2500&&root.dataset.syncBoot==='pending'){const t=document.getElementById('gsBootText');if(t&&!/atualizar/.test(t.textContent))t.textContent='A receber os dados do servidor…'}if(w<(root.dataset.syncBoot==='pending'?30000:8000))setTimeout(check,60)}
 if(document.readyState==='complete')check();else window.addEventListener('load',()=>setTimeout(check,30));
})();
