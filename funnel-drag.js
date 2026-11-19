/* V4 — mover cartões entre as fases do funil dos pedidos de consulta (Call Center → Pedidos de consulta).
   Três formas, todas pela mesma regra (App.moveRequest: permissões, histórico e auditoria):
   1. Pega ⠿ no cartão: com o dedo, o rato ou a caneta, arrasta logo (a pega não desliza a página).
   2. Resto do cartão: rato/caneta arrastam logo; com o dedo, segurar ~0,35 s e arrastar (um gesto rápido desliza a página).
   3. «Mover para…»: lista em cada cartão, funciona em qualquer aparelho e com teclado.
   Ao arrastar perto da margem, o funil (e a página) desliza sozinho para chegar às outras fases.
   Um toque sem arrastar continua a abrir o pedido. */
(()=>{'use strict';
const THRESHOLD=6,HOLD_MS=350,EDGE=56,SPEED=14;
let drag=null,press=null,hold=null,raf=0,last={x:0,y:0};
const root=()=>document.getElementById('waitContent');
const columns=()=>[...document.querySelectorAll('#waitContent .funnel-col[data-stage]')];
const board=()=>root()?.querySelector('.funnel');
const colAt=(x,y)=>document.elementFromPoint(x,y)?.closest?.('#waitContent .funnel-col[data-stage]')||null;
const highlight=col=>{for(const c of columns())c.classList.toggle('drag-over',c===col)};
const cardOf=t=>t?.closest?.('#waitContent .funnel-card[data-request-id]');
function start(card,x,y){if(drag)return;const r=card.getBoundingClientRect(),g=card.cloneNode(true);g.removeAttribute('data-request-id');g.querySelectorAll('select').forEach(s=>s.remove());g.classList.add('funnel-ghost');g.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;pointer-events:none;z-index:9999;opacity:.92;box-shadow:0 10px 24px #0004;margin:0`;document.body.append(g);card.classList.add('dragging');document.documentElement.classList.add('funnel-dragging');drag={card,x,y,ghost:g};last={x,y};navigator.vibrate?.(15);tick()}
function move(x,y){if(!drag)return;last={x,y};drag.ghost.style.transform=`translate(${x-drag.x}px,${y-drag.y}px)`;highlight(colAt(x,y))}
/* Desliza o funil na horizontal e a página na vertical quando o dedo/rato está perto da margem. */
function tick(){cancelAnimationFrame(raf);if(!drag)return;const b=board(),{x,y}=last;if(b){const r=b.getBoundingClientRect();if(x<r.left+EDGE)b.scrollLeft-=SPEED;else if(x>r.right-EDGE)b.scrollLeft+=SPEED}if(y<EDGE)window.scrollBy(0,-SPEED);else if(y>innerHeight-EDGE)window.scrollBy(0,SPEED);highlight(colAt(x,y));raf=requestAnimationFrame(tick)}
function end(x,y,cancel){cancelAnimationFrame(raf);if(!drag)return;const {card,ghost}=drag;card.classList.remove('dragging');document.documentElement.classList.remove('funnel-dragging');ghost.remove();highlight(null);card.dataset.justDragged='1';setTimeout(()=>delete card.dataset.justDragged,400);drag=null;if(cancel)return;const stage=colAt(x,y)?.dataset.stage;if(stage&&stage!==card.closest('.funnel-col')?.dataset.stage)window.App?.moveRequest(card.dataset.requestId,stage)}
/* Eventos de ponteiro: rato, caneta e dedo (na pega). */
document.addEventListener('pointerdown',e=>{if(e.button>0)return;const card=cardOf(e.target);if(!card||e.target.closest('select,button,a,input'))return;const onHandle=!!e.target.closest('.funnel-handle');if(e.pointerType==='touch'&&!onHandle)return;press={card,x:e.clientX,y:e.clientY,id:e.pointerId};if(onHandle){e.preventDefault();try{e.target.setPointerCapture(e.pointerId)}catch{}start(card,e.clientX,e.clientY)}});
document.addEventListener('pointermove',e=>{if(!press||e.pointerId!==press.id)return;if(!drag&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>=THRESHOLD)start(press.card,press.x,press.y);if(drag){e.preventDefault();move(e.clientX,e.clientY)}});
document.addEventListener('pointerup',e=>{if(!press||e.pointerId!==press.id)return;press=null;end(e.clientX,e.clientY)});
document.addEventListener('pointercancel',e=>{if(press&&e.pointerId===press.id){press=null;if(drag&&!hold)end(0,0,true)}});
/* Dedo no resto do cartão: segurar para arrastar. */
document.addEventListener('touchstart',e=>{const card=cardOf(e.target);if(!card||e.touches.length!==1||e.target.closest('.funnel-handle,select,button,a,input'))return;const t=e.touches[0];hold={card,x:t.clientX,y:t.clientY,timer:setTimeout(()=>{if(hold){start(hold.card,hold.x,hold.y);hold.started=true}},HOLD_MS)}},{passive:true});
document.addEventListener('touchmove',e=>{const t=e.touches[0];if(hold&&!hold.started&&Math.hypot(t.clientX-hold.x,t.clientY-hold.y)>=THRESHOLD){clearTimeout(hold.timer);hold=null}if(drag&&(hold?.started||!press)){if(e.cancelable)e.preventDefault();move(t.clientX,t.clientY)}},{passive:false});
document.addEventListener('touchend',e=>{const wasHold=hold?.started;if(hold){clearTimeout(hold.timer);hold=null}const t=e.changedTouches[0];if(drag&&wasHold)end(t.clientX,t.clientY)});
document.addEventListener('touchcancel',()=>{if(hold){clearTimeout(hold.timer);const s=hold.started;hold=null;if(drag&&s)end(0,0,true)}});
document.addEventListener('contextmenu',e=>{if(cardOf(e.target))e.preventDefault()});
/* Depois de arrastar, o clique que o navegador gera não abre o pedido; a lista «Mover para…» também não. */
document.addEventListener('click',e=>{if(e.target.closest?.('.funnel-card[data-just-dragged]')||e.target.closest?.('.funnel-tools')){e.stopPropagation();if(!e.target.closest('select'))e.preventDefault()}},true);
document.addEventListener('change',e=>{const s=e.target.closest?.('.funnel-move');if(!s)return;const card=cardOf(s);if(card&&s.value)window.App?.moveRequest(card.dataset.requestId,s.value)});
/* Pega e «Mover para…» em cada cartão (o funil é redesenhado muitas vezes: acrescenta-se sempre que falta). */
function enhance(){const cols=columns();if(!cols.length)return;const stages=cols.map(c=>c.dataset.stage);for(const card of document.querySelectorAll('#waitContent .funnel-card[data-request-id]:not([data-funnel-tools])')){card.dataset.funnelTools='1';card.setAttribute('draggable','false');const cur=card.closest('.funnel-col')?.dataset.stage,tools=document.createElement('div');tools.className='funnel-tools';tools.innerHTML=`<span class="funnel-handle" role="img" aria-label="Arrastar para outra fase" title="Arrastar">⠿</span><select class="funnel-move" aria-label="Mover para outra fase"><option value="">Mover para…</option>${stages.filter(s=>s!==cur).map(s=>`<option value="${s.replace(/"/g,'&quot;')}">${s.replace(/</g,'&lt;')}</option>`).join('')}</select>`;card.classList.add('has-funnel-tools');card.append(tools)}}
new MutationObserver(()=>enhance()).observe(document.documentElement,{childList:true,subtree:true});
const css=document.createElement('style');css.textContent=`#waitContent .funnel-card[data-request-id]{cursor:grab;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-user-drag:none}
#waitContent .funnel-card.dragging{opacity:.35}#waitContent .funnel-col.drag-over{outline:2px dashed #176b5b;outline-offset:-4px;background:color-mix(in srgb,#176b5b 10%,transparent)}#waitContent .funnel-col{transition:background .15s,outline .15s}#waitContent .funnel-note{margin-top:8px;font-size:.78rem}
.funnel-card.has-funnel-tools{position:relative;padding-right:44px}
.funnel-tools{display:block;margin-top:8px}
.funnel-handle{position:absolute;top:6px;right:6px;display:grid;place-items:center;width:36px;height:36px;border-radius:8px;font-size:20px;line-height:1;color:var(--muted,#5a6b6d);background:color-mix(in srgb,currentColor 8%,transparent);cursor:grab;touch-action:none}
.funnel-move{display:block;width:calc(100% + 38px);max-width:none;min-height:38px;font-size:13px;padding:4px 8px;border-radius:8px;box-sizing:border-box}
#waitContent .funnel{grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr))}
@media (max-width:640px){#waitContent .funnel{grid-template-columns:repeat(4,minmax(220px,1fr))}}
html.funnel-dragging,html.funnel-dragging body{cursor:grabbing!important;user-select:none}`;document.head.appendChild(css);
window.FunnelDragV4={enhance};
})();
