/* Presentation only: never writes values, selection, focus or application state. */
(()=>{'use strict';if(window.GSVisualRuntimeV4)return;
function resize(el){if(!(el instanceof HTMLTextAreaElement)||!el.getClientRects().length)return;el.rows=1;el.dataset.gsAutosize='true';const top=el.scrollTop;el.style.height='auto';const css=getComputedStyle(el),border=parseFloat(css.borderTopWidth)+parseFloat(css.borderBottomWidth);el.style.height=Math.ceil(el.scrollHeight+border)+'px';el.scrollTop=top}
let queued=false;function refresh(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;document.querySelectorAll('textarea').forEach(resize)})}
document.addEventListener('input',e=>resize(e.target),true);document.addEventListener('compositionend',e=>resize(e.target),true);document.addEventListener('toggle',refresh,true);window.addEventListener('resize',refresh);document.addEventListener('gs:view-changed',refresh);
function boot(){new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});refresh()}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();window.GSVisualRuntimeV4={resize,refresh};})();
