/* V4 — arrastar cartões entre as fases do funil dos pedidos de consulta.
   Rato/caneta: carregar e arrastar. Dedo (telemóvel/tablet): segurar o cartão ~0,4 s e arrastar; um gesto rápido
   continua a deslizar a página. Um toque sem arrastar abre o pedido.
   As fases vêm do ecrã (data-stage) e a mudança é feita por App.moveRequest (permissões, histórico e auditoria). */
(()=>{'use strict';
const THRESHOLD=8,HOLD_MS=400;
let drag=null,hold=null;
const columns=()=>[...document.querySelectorAll('#waitContent .funnel-col[data-stage]')];
const colAt=(x,y)=>document.elementFromPoint(x,y)?.closest?.('#waitContent .funnel-col[data-stage]')||null;
const highlight=col=>{for(const c of columns())c.classList.toggle('drag-over',c===col)};
function start(card,x,y){const r=card.getBoundingClientRect(),g=card.cloneNode(true);g.removeAttribute('data-request-id');g.classList.add('funnel-ghost');g.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;pointer-events:none;z-index:9999;opacity:.92;box-shadow:0 10px 24px #0004`;document.body.append(g);card.classList.add('dragging');drag={card,x,y,ghost:g};navigator.vibrate?.(15)}
function move(x,y){if(!drag)return;drag.ghost.style.transform=`translate(${x-drag.x}px,${y-drag.y}px)`;highlight(colAt(x,y))}
function end(x,y,cancel){if(!drag)return;const {card,ghost}=drag;card.classList.remove('dragging');ghost.remove();highlight(null);card.dataset.justDragged='1';setTimeout(()=>delete card.dataset.justDragged,400);drag=null;if(cancel)return;const stage=colAt(x,y)?.dataset.stage;if(stage&&stage!==card.closest('.funnel-col')?.dataset.stage)window.App?.moveRequest(card.dataset.requestId,stage)}
const cardOf=t=>t?.closest?.('#waitContent .funnel-card[data-request-id]');
/* Rato e caneta */
let press=null;
document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button>0)return;const card=cardOf(e.target);if(card)press={card,x:e.clientX,y:e.clientY}});
document.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||!press)return;if(!drag&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>=THRESHOLD)start(press.card,press.x,press.y);if(drag){e.preventDefault();move(e.clientX,e.clientY)}});
document.addEventListener('pointerup',e=>{if(e.pointerType==='touch')return;press=null;end(e.clientX,e.clientY)});
/* Dedo: segurar para arrastar */
document.addEventListener('touchstart',e=>{const card=cardOf(e.target);if(!card||e.touches.length!==1)return;const t=e.touches[0];hold={card,x:t.clientX,y:t.clientY,timer:setTimeout(()=>{if(hold){start(hold.card,hold.x,hold.y);hold=null}},HOLD_MS)}},{passive:true});
document.addEventListener('touchmove',e=>{const t=e.touches[0];if(hold&&Math.hypot(t.clientX-hold.x,t.clientY-hold.y)>=THRESHOLD){clearTimeout(hold.timer);hold=null}if(drag){e.preventDefault();move(t.clientX,t.clientY)}},{passive:false});
document.addEventListener('touchend',e=>{if(hold){clearTimeout(hold.timer);hold=null}const t=e.changedTouches[0];if(drag)end(t.clientX,t.clientY)});
document.addEventListener('touchcancel',()=>{if(hold){clearTimeout(hold.timer);hold=null}if(drag)end(0,0,true)});
document.addEventListener('contextmenu',e=>{if(cardOf(e.target))e.preventDefault()});
/* Depois de arrastar, o clique que o navegador gera não abre o pedido. */
document.addEventListener('click',e=>{if(e.target.closest?.('.funnel-card[data-just-dragged]')){e.stopPropagation();e.preventDefault()}},true);
const css=document.createElement('style');css.textContent='#waitContent .funnel-card[data-request-id]{cursor:grab;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}#waitContent .funnel-card.dragging{opacity:.35}#waitContent .funnel-col.drag-over{outline:2px dashed #176b5b;outline-offset:-4px;background:color-mix(in srgb,#176b5b 10%,transparent)}#waitContent .funnel-col{transition:background .15s,outline .15s}#waitContent .funnel-note{margin-top:8px;font-size:.78rem}';document.head.appendChild(css);
})();
