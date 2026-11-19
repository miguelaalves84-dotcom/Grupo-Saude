/* V4 — campos em falta ou inválidos ficam assinalados a vermelho, em todo o programa.
   Como funciona (sem alterar cada módulo):
   1. Guarda-se onde foi o último clique/envio (o botão «Guardar», «Fechar dia», …).
   2. Quando o programa mostra um aviso de validação («Preencha…», «Indique…», «Data inválida», «obrigatório»…),
      procura-se, no formulário desse botão, os campos que o aviso refere:
      - campos que o navegador já sabe estarem errados (obrigatórios vazios, data incompleta, fora dos limites);
      - campos vazios cuja etiqueta tem palavras do aviso (ex.: «ERS: indique a data e referência» → Data de inscrição, Referência);
      - num aviso sobre datas, as datas vazias de um bloco que já tem outros valores preenchidos.
   3. Esses campos ficam com contorno vermelho e a nota do aviso; a secção fechada abre-se e o ecrã leva ao primeiro.
   4. O vermelho sai logo que o campo é corrigido.
   Os módulos podem também assinalar diretamente: GSFieldErrors.flag(['hrERSDate'], 'Indique a data').
   Avisos de permissão («não autorizado», «sessão») nunca assinalam campos. */
(()=>{'use strict';
if(window.GSFieldErrors)return;
const FIELD='input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=file]),select,textarea';
const VALIDATION=/preench|indique|obrigat|inv[aá]lid|em falta|falta |selecione|escolha|exige|necess[aá]ri|campo|required|introduza|escreva|confirme|defina|associe|deve ter|m[ií]nimo|m[aá]ximo|vazio|tem de/i;
const NOT_FIELD=/autoriz|permiss|sess[aã]o|reabra|apenas (o )?ceo|exclusiv|sem acesso|offline|servidor|liga[cç][aã]o/i;
const STOP=new Set('para pelo pela pelos pelas como mais menos esta este isto essa esse uma umas uns outro outra antes depois quando onde qual quais todos todas cada pode deve devem tem ter sido ser est estao preencha indique selecione escolha introduza escreva confirme defina associe campo campos obrigatorio obrigatoria obrigatorios obrigatorias invalido invalida invalidos invalidas falta faltam necessario necessaria exige exigem valor valores pelo menos guardar ficha antes'.split(' '));
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
let scope=null,scopeAt=0;
const empty=el=>el.type==='checkbox'||el.type==='radio'?false:String(el.value??'').trim()==='';
const visible=el=>{if(el.disabled||el.closest('[hidden],[aria-hidden=true],.gs-field-ignore'))return false;for(let n=el;n&&n!==document.body;n=n.parentElement){const cs=getComputedStyle(n);if(cs.display==='none'||cs.visibility==='hidden')return false}return true};
function labelOf(el){const parts=[];if(el.id){const l=document.querySelector('label[for="'+CSS.escape(el.id)+'"]');if(l)parts.push(l.textContent)}const wrap=el.closest('label');if(wrap)parts.push(wrap.textContent);let p=el.previousElementSibling;while(p&&p.matches('br,small,span.hint'))p=p.previousElementSibling;if(p&&p.tagName==='LABEL'&&!p.control)parts.push(p.textContent);parts.push(el.getAttribute('aria-label')||'',el.getAttribute('placeholder')||'',el.dataset.label||'');return fold(parts.join(' '))}
/* Título do bloco do campo (legenda, resumo da secção, título anterior): desempata etiquetas iguais em blocos diferentes. */
function groupText(el){const parts=[];const fs=el.closest('fieldset');if(fs?.querySelector('legend'))parts.push(fs.querySelector('legend').textContent);const d=el.closest('details');if(d?.querySelector('summary'))parts.push(d.querySelector('summary').textContent);let n=el.closest('label')||el;for(let i=0;n&&i<12;i++){let p=n.previousElementSibling;while(p&&!/^H[2-5]$/.test(p.tagName)&&i<12){p=p.previousElementSibling;i++}if(p){parts.push(p.textContent);break}n=n.parentElement}return fold(parts.join(' '))+' '+idWords(el)}
const acronyms=msg=>(String(msg||'').match(/\b[A-ZÀ-Ý]{2,5}\b/g)||[]).map(fold);
const tokens=msg=>[...new Set([...fold(msg).split(/[^a-z0-9%]+/).filter(w=>w.length>=4&&!STOP.has(w)),...acronyms(msg)])];
/* «ERS: indique …», «Percentagens: …» — o tema antes dos dois pontos diz em que bloco está o campo. */
const topicOf=msg=>{const m=String(msg||'').match(/^\s*([^:.!?]{2,40}):/);if(!m)return'';const t=tokens(m[1]);return t[0]||''};
const idWords=el=>{const out=[];for(let n=el;n&&n!==document.body;n=n.parentElement){if(n.id)out.push(n.id.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2').replace(/[-_]/g,' '))}return fold(out.join(' '))};
/* Contentor do formulário: o antepassado mais próximo do botão que tem pelo menos 3 campos (ou a janela aberta). */
function container(){const t=scope&&document.contains(scope)&&Date.now()-scopeAt<15000?scope:null;let n=t;while(n&&n!==document.body){if(n.matches('dialog[open],form'))return n;if(n.querySelectorAll(FIELD).length>=3)return n;n=n.parentElement}return document.querySelector('dialog[open]')||t?.closest('main,section')||null}
function candidates(root,msg){const fields=[...root.querySelectorAll(FIELD)].filter(visible),out=new Set(),words=tokens(msg),dateMsg=/\bdatas?\b|vig[eê]ncia|in[ií]cio|fim\b|validade|per[ií]odo/i.test(msg);
 for(const el of fields){if(el.validity&&(el.validity.badInput||el.validity.rangeUnderflow||el.validity.rangeOverflow||el.validity.stepMismatch&&!empty(el)||el.required&&empty(el)))out.add(el)}
 if(words.length){const hit=(w,t)=>w.length<=4?new RegExp('(^|[^a-z0-9])'+w+'([^a-z0-9]|$)').test(t):t.includes(w)||w.length>=6&&t.includes(w.slice(0,6));const topic=topicOf(msg),scored=[];for(const el of fields){if(!empty(el))continue;const l=labelOf(el);if(!l)continue;const lw=tokens(l),m=words.filter(w=>w!==topic&&hit(w,l)).length,ctx=groupText(el)+' '+l;if(!m)continue;scored.push({el,v:m+m/Math.max(1,lw.length),topic:!!topic&&hit(topic,ctx)})}
  const inTopic=scored.filter(x=>x.topic),pool=inTopic.length?inTopic:scored,best=Math.max(0,...pool.map(x=>x.v));for(const x of pool)if(inTopic.length||x.v>=best*0.85)out.add(x.el)}
 if(dateMsg&&![...out].some(el=>/date|time|month/.test(el.type))){for(const el of fields){if(!/^(date|month|datetime-local)$/.test(el.type)||!empty(el))continue;const box=el.closest('fieldset,.row,.form-grid,.grid,details')||el.parentElement;if([...box.querySelectorAll(FIELD)].some(o=>o!==el&&o.type!=='checkbox'&&!empty(o)))out.add(el)}}
 return [...out]}
function clear(el){el.classList.remove('gs-field-error');el.removeAttribute('aria-invalid');const n=el.gsErrorNote;if(n){n.remove();el.gsErrorNote=null}if(el.dataset.gsDescribed){el.setAttribute('aria-describedby',el.dataset.gsDescribed);delete el.dataset.gsDescribed}else if(el.getAttribute('aria-describedby')?.startsWith('gsfe-'))el.removeAttribute('aria-describedby')}
function clearAll(root=document){root.querySelectorAll('.gs-field-error').forEach(clear)}
let seq=0;
function mark(list,msg){list=list.filter(Boolean);if(!list.length)return[];const first=list[0];for(const el of list){el.classList.add('gs-field-error');el.setAttribute('aria-invalid','true');if(!el.gsErrorNote){const n=document.createElement('small');n.className='gs-field-error-note';n.id='gsfe-'+(++seq);n.textContent=el===first&&msg?msg:(empty(el)?'Em falta':'Verifique este campo');const anchor=el.closest('label')&&el.closest('label').contains(el)&&el.closest('label').querySelectorAll(FIELD).length===1?el.closest('label'):el;anchor.after(n);el.gsErrorNote=n;if(el.getAttribute('aria-describedby'))el.dataset.gsDescribed=el.getAttribute('aria-describedby');el.setAttribute('aria-describedby',[el.dataset.gsDescribed,n.id].filter(Boolean).join(' '))}
  let d=el.closest('details');while(d){d.open=true;d=d.parentElement?.closest('details')}}
 return list}
function reveal(list){const el=list[0];if(!el)return;requestAnimationFrame(()=>{try{el.scrollIntoView({block:'center',behavior:'smooth'})}catch{el.scrollIntoView()}setTimeout(()=>{try{el.focus({preventScroll:true})}catch{}},250)})}
function flag(ids,msg){const list=(Array.isArray(ids)?ids:[ids]).map(x=>typeof x==='string'?document.getElementById(x):x).filter(Boolean);mark(list,msg);reveal(list);return list}
/* Avisos: o navegador mostra-os à mesma; antes, assinalam-se os campos; depois de OK, o ecrã leva ao primeiro. */
function fromMessage(msg){msg=String(msg??'');if(!VALIDATION.test(msg)||NOT_FIELD.test(msg))return[];const root=container();if(!root)return[];clearAll(root);return mark(candidates(root,msg),msg.replace(/\s+/g,' ').trim())}
const nativeAlert=window.alert.bind(window);
window.alert=function(msg){let list=[];try{list=fromMessage(msg)}catch{}const r=nativeAlert(msg);if(list.length)reveal(list);return r};
/* Erros nativos do navegador (campo «required» num formulário): também a vermelho. */
document.addEventListener('invalid',e=>{const el=e.target;if(el.matches?.(FIELD))mark([el],el.validationMessage)},true);
const fix=e=>{const el=e.target;if(el?.classList?.contains('gs-field-error')&&(!empty(el)||el.type==='checkbox')&&(!el.validity||!el.validity.badInput))clear(el)};
document.addEventListener('input',fix,true);document.addEventListener('change',fix,true);
const remember=e=>{scope=e.target instanceof Element?e.target:null;scopeAt=Date.now()};
document.addEventListener('click',remember,true);document.addEventListener('submit',remember,true);document.addEventListener('keydown',e=>{if(e.key==='Enter')remember(e)},true);
const css=document.createElement('style');css.textContent=`
.gs-field-error,input.gs-field-error,select.gs-field-error,textarea.gs-field-error{border-color:#c62828!important;outline:2px solid #c62828!important;outline-offset:1px;background-color:color-mix(in srgb,#c62828 6%,var(--surface,#fff))!important}
.gs-field-error:focus{box-shadow:0 0 0 4px color-mix(in srgb,#c62828 25%,transparent)!important}
.gs-field-error-note{display:block;color:#b71c1c;font-size:.82rem;font-weight:600;margin:4px 0 6px;line-height:1.3}
.gs-field-error-note::before{content:"⚠ ";}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .gs-field-error-note{color:#ff8a80}}
:root[data-theme=dark] .gs-field-error-note{color:#ff8a80}
input:user-invalid,select:user-invalid,textarea:user-invalid{border-color:#c62828}`;
document.head.appendChild(css);
window.GSFieldErrors={flag,clear,clearAll,fromMessage,_candidates:candidates};
})();
