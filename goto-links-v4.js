/* Ligações em todo o programa: qualquer elemento com data-goto="tipo:id[:campo]" abre o sítio certo e, quando
   indicado, vai ao campo em falta e destaca-o. Ex.: "clinic:abranfir:ers" abre a ficha da clínica no n.º ERS;
   "employee:test_med:license" abre a ficha do colaborador na cédula; "view:operation" abre a Operação;
   "hr:incidents" abre a secção de RH. GSGoTo.link(texto, alvo) devolve o HTML da ligação. */
(()=>{'use strict';
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CLINIC={ers:'#cmERS',license:'#cmERS',nif:'#cmEmployerNif',entity:'#cmEmployerName',phone:'#cmPhones input',address:'#cmAddress',email:'#cmEmail',gps:'#cmLat'};
const EMP={license:['#hrLicense','dados'],salary:['#hrGross','dados'],function:['#hrBonusTechFunction','dados'],promo:['#hrPromoCode','dados'],nif:['#hrNif','dados'],niss:['#hrNiss','dados'],iban:['#hrIban','dados'],address:['#hrAddress','dados'],birth:['#hrBirth','dados'],admission:['#hrAdmission','dados'],contract:['#hrContract','dados'],specialty:['#hrSpecPicker','dados'],phone:['#hrPhone','dados'],capacity:['#hrSaveCapacity','capacidade'],role:['#hrRole','dados']};
function focus(sel,tries=24){const el=document.querySelector(sel);if(!el){if(tries>0)setTimeout(()=>focus(sel,tries-1),120);return}for(let d=el.closest('details');d;d=d.parentElement?.closest('details'))d.open=true;for(let n=el.parentElement;n;n=n.parentElement)if(n.hidden&&n.id!=='modal')n.hidden=false;el.scrollIntoView({behavior:'smooth',block:'center'});const box=el.closest('label,.row,div')||el;el.classList.add('gs-goto-focus');box.classList.add('gs-goto-area');try{el.focus({preventScroll:true})}catch{}setTimeout(()=>{el.classList.remove('gs-goto-focus');box.classList.remove('gs-goto-area')},3200)}
function open(target){const [kind,id,field]=String(target||'').split(':');try{
 if(kind==='clinic'){window.App?.showView?.('clinics');setTimeout(()=>{window.ClinicMasterV4?.edit(id);if(field)focus(CLINIC[field]||'#cmName')},150);return true}
 if(kind==='employee'){const [sel,tab]=EMP[field]||[null,'resumo'];window.App?.showView?.('hr');setTimeout(()=>{window.HRMasterV4?.workspace?.(id,field?tab:'resumo');if(sel)focus(sel)},150);return true}
 if(kind==='hr'){window.App?.showView?.('hr');setTimeout(()=>{try{HRManagementV4.select(id)}catch{}},150);return true}
 if(kind==='finance'){window.FinanceUIV4?.open?.(id);return true}
 if(kind==='view'){window.App?.showView?.(id);return true}
 if(kind==='product'){if(!document.getElementById('stock')?.classList.contains('active'))window.App?.showView?.('stock');setTimeout(()=>window.StockUIV4?.detail?.(id),document.getElementById('stock')?.classList.contains('active')?0:200);return true}
 if(kind==='order'){window.StockUIV4?.detail?.(id,true);return true}
 if(kind==='stocktab'){window.App?.showView?.('stock');setTimeout(()=>window.StockUIV4?.selectTab?.(id),150);return true}
 }catch(e){alert(e.message)}return false}
/* Avisos em texto (ex.: erros da abertura) → botões «Corrigir» para o sítio certo. */
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function people(){try{const s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2')||'{}');const m=new Map();for(const p of [...(s.users||[]),...Object.values(s.employees||{})])if(p?.name)m.set(String(p.id),p.name);return{s,list:[...m].map(([id,name])=>({id,name}))}}catch{return{s:{},list:[]}}}
function suggest(msg){const t=norm(msg),{s,list}=people(),out=[],who=list.filter(p=>p.name&&t.includes(norm(p.name))).sort((a,b)=>b.name.length-a.name.length)[0];
 if(who&&/capacidade/.test(t))out.push(['employee:'+who.id+':capacity','Configurar a capacidade na ficha de '+who.name]);
 else if(who&&/cedula/.test(t))out.push(['employee:'+who.id+':license','Preencher a cédula na ficha de '+who.name]);
 else if(who&&/salario|remunera/.test(t))out.push(['employee:'+who.id+':salary','Abrir a remuneração de '+who.name]);
 else if(who&&/especialidade/.test(t))out.push(['employee:'+who.id+':specialty','Abrir as especialidades de '+who.name]);
 else if(who&&/ficha/.test(t))out.push(['employee:'+who.id,'Abrir a ficha de '+who.name]);
 if(/folha de caixa|fecho de caixa/.test(t))out.push(['finance:cash','Abrir o Fecho de Caixa']);
 const clinic=(s.clinics||[]).find(c=>c.name&&t.includes(norm(c.name)));if(clinic&&/ers|licenca|nif|telefone|morada|especialidade/.test(t))out.push(['clinic:'+clinic.id+(/ers|licenca/.test(t)?':ers':/nif/.test(t)?':nif':''),'Abrir a ficha de '+clinic.name]);
 return out}
function enhance(el){if(!el)return;el.querySelectorAll?.('.gs-fix').forEach(x=>x.remove());const list=suggest(el.textContent);for(const [g,l] of list){el.insertAdjacentHTML('beforeend',' '+fixLink(g,l))}return list.length}
const link=(text,target,cls='')=>`<button type="button" class="gs-link ${cls}" data-goto="${E(target)}" title="Abrir">${E(text)}</button>`;
const fixLink=(target,text='Corrigir')=>`<button type="button" class="gs-fix" data-goto="${E(target)}">${E(text)} →</button>`;
document.addEventListener('click',e=>{const t=e.target.closest?.('[data-goto]');if(!t)return;e.preventDefault();e.stopPropagation();const dlg=t.closest('dialog');if(dlg?.open)dlg.close();open(t.dataset.goto)},true);
/* Operação e Stock: avisos de dados em falta ganham «Corrigir →» automaticamente. */
const WATCH=['operationContent','stockContent','operation','stock'],SEL='[role=alert],.notice,.compliance-row,.op-pending,.pending-item,li,small,p';
function scan(root){for(const el of root.querySelectorAll(SEL)){if(el.closest('[data-goto],.gs-fix,button,select,option,textarea'))continue;const clone=el.cloneNode(true);clone.querySelectorAll('.gs-fix').forEach(x=>x.remove());const txt=clone.textContent||'';if(txt.length>600||!/(em falta|por definir|por configurar|ficha rh|na ficha|sem salario|sem salário|cédula|cedula|capacidade)/i.test(txt))continue;const sig=txt.length+':'+txt.slice(0,40);if(el.dataset.gsEnhanced===sig)continue;if(el.querySelector(SEL))continue;el.dataset.gsEnhanced=sig;enhance(el)}}
let pending=0;const mo=new MutationObserver(()=>{if(pending)return;pending=setTimeout(()=>{pending=0;for(const id of WATCH){const r=document.getElementById(id);if(r)scan(r)}},120)});
document.addEventListener('DOMContentLoaded',()=>{for(const id of ['operation','stock']){const r=document.getElementById(id);if(r)mo.observe(r,{childList:true,subtree:true,characterData:true})}});
window.GSGoTo={open,link,fixLink,focus,suggest,enhance,scan};
})();
