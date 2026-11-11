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
 }catch(e){alert(e.message)}return false}
const link=(text,target,cls='')=>`<button type="button" class="gs-link ${cls}" data-goto="${E(target)}" title="Abrir">${E(text)}</button>`;
const fixLink=(target,text='Corrigir')=>`<button type="button" class="gs-fix" data-goto="${E(target)}">${E(text)} →</button>`;
document.addEventListener('click',e=>{const t=e.target.closest?.('[data-goto]');if(!t)return;e.preventDefault();e.stopPropagation();const dlg=t.closest('dialog');if(dlg?.open)dlg.close();open(t.dataset.goto)},true);
window.GSGoTo={open,link,fixLink,focus};
})();
