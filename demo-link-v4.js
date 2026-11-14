/* Links diretos no protótipo de demonstração:
   - «?limpo=1» apaga os dados de demonstração deste navegador e recomeça do zero (não toca no servidor);
   - «#operation», «#stock», … abre esse módulo, se o perfil atual tiver acesso. */
(()=>{'use strict';const K='grupo_saude_v4_demo_2',u=new URL(location.href);
if(document.documentElement.dataset.v4ext!=='server'&&u.searchParams.get('limpo')==='1'){try{localStorage.removeItem(K)}catch{}u.searchParams.delete('limpo');location.replace(u.pathname+(u.search||'')+u.hash);return}
function open(){const id=decodeURIComponent(String(location.hash||'').slice(1));if(!/^[a-z][a-z0-9-]{1,40}$/i.test(id))return;const el=document.getElementById(id);if(el?.classList.contains('view')&&window.App?.showView)App.showView(id)}
document.addEventListener('DOMContentLoaded',()=>setTimeout(open,60));window.addEventListener('hashchange',open);
})();
