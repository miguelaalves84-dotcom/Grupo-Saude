/* Pedidos de consulta — separadores do call center e das administrativas.
   Funil (existente) · Marcações hora a hora («+1») · Procura não satisfeita · Indicadores (direção).
   Lê e grava o mesmo estado local da aplicação; regras em requests-core-v4.js. */
(()=>{'use strict';
const K='grupo_saude_v4_demo_2',C=()=>window.GSRequestsCore;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}};
const write=s=>{localStorage.setItem(K,JSON.stringify(s));window.App?.renderAll?.()};
const can=k=>!!window.RoleAccessAdminV4?.can?.(k);
const pad=n=>String(n).padStart(2,'0');
const localIso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const nowIso=()=>localIso(new Date()),today=()=>nowIso().slice(0,10);
const shift=days=>{const d=new Date();d.setDate(d.getDate()+days);return localIso(d).slice(0,10)};
const uid=p=>p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
let tab='funnel',period='today',fClinic='',fSource='',fRole='',pClinic='',pReason='',last={clinic:'',specialty:'',source:''},flash='';
function actor(s){return String(s.currentUser||'')}
function canClinic(s,id){return window.AccessScopeV4?.canClinic?AccessScopeV4.canClinic(String(id),'bookings',s):can('bookings')}
function clinics(s){return(s.clinics||[]).filter(c=>c.active!==false&&c.operational!==false&&!c.virtual&&c.id!=='administracao'&&canClinic(s,c.id))}
function viewClinics(s){return(s.clinics||[]).filter(c=>!window.AccessScopeV4?.canClinic||AccessScopeV4.canClinic(String(c.id),'waiting',s)||canClinic(s,c.id))}
const clinicName=(s,id)=>(s.clinics||[]).find(c=>String(c.id)===String(id))?.name||String(id||'—');
function specialties(s,clinic){return window.GSClinicSpecialties?GSClinicSpecialties.list(s,[String(clinic)]):[]}
function scopedRequests(s){const ids=new Set(viewClinics(s).map(c=>String(c.id)));return(s.requests||[]).filter(r=>!r.deleted&&ids.has(String(r.clinic)))}
const actorRole=s=>{const id=actor(s);return((s.users||[]).find(u=>String(u.id)===id)||s.employees?.[id]||{}).role||''};
function scopedBookings(s){const ids=new Set(viewClinics(s).map(c=>String(c.id)));return(s.callBookings||[]).filter(b=>ids.has(String(b.clinic)))}
const manager=()=>can('reports');
function range(){return period==='today'?{start:today(),end:today()}:period==='7d'?{start:shift(-6),end:today()}:{start:shift(-29),end:today()}}
function specialtyField(s,clinic,id,value){const list=specialties(s,clinic);return list.length?`<select id="${id}" aria-label="Especialidade">${list.map(x=>`<option ${x===value?'selected':''}>${E(x)}</option>`).join('')}</select>`:`<input id="${id}" aria-label="Especialidade" placeholder="Especialidade (por configurar na clínica)" value="${E(value||'')}">`}
const select=(id,label,opts,value,empty)=>`<label>${E(label)}<select id="${id}">${empty!==undefined?`<option value="">${E(empty)}</option>`:''}${opts.map(o=>{const [v,t]=Array.isArray(o)?o:[o,o];return`<option value="${E(v)}" ${String(v)===String(value)?'selected':''}>${E(t)}</option>`}).join('')}</select></label>`;
const bar=(n,max)=>`<span class="req-bar" style="width:${max?Math.max(4,Math.round(n/max*120)):0}px"></span>`;

function tabs(s){const n=scopedRequests(s).filter(C().pending).length;const list=[['funnel','Funil'],['pending',`Por marcar (${n})`],...(can('bookings')?[['bookings','Marcações hora a hora']]:[]),['unmet','Procura não satisfeita'],...(manager()?[['kpis','Indicadores do call center']]:[])];if(!list.some(([k])=>k===tab))tab='funnel';return`<div class="req-tabs" role="tablist" aria-label="Pedidos de consulta">${list.map(([k,t])=>`<button type="button" role="tab" data-req-tab="${k}" aria-selected="${tab===k}" class="${tab===k?'on':''}">${E(t)}</button>`).join('')}</div>`}

function dueBox(s){const due=scopedRequests(s).filter(r=>C().due(r,nowIso()));if(!due.length)return'';return`<div class="notice req-due"><b>Voltar a contactar hoje (${due.length}):</b> ${due.slice(0,6).map(r=>`<button type="button" class="link" data-req-open="${E(r.id)}">${E(r.name)} · ${E(r.specialty||'—')}</button>`).join(' · ')}</div>`}

function pendingPanel(s){
 const del=C().canDelete(actorRole(s)),all=scopedRequests(s).filter(C().pending),rows=all.filter(r=>(!pClinic||String(r.clinic)===pClinic)&&(!pReason||(pReason==='—'?!r.unmetReason:r.unmetReason===pReason))).sort((a,b)=>String(a.created||'').localeCompare(String(b.created||'')));
 const since=r=>{const d=Math.floor((Date.now()-Date.parse(r.created||r.createdAt||0))/86400000);return Number.isFinite(d)?(d<=0?'hoje':d===1?'há 1 dia':`há ${d} dias`):'—'};
 return`<section class="card"><h3>Consultas por marcar (${all.length})</h3><p class="meta">Todos os pedidos que ainda não foram marcados. Saem desta lista quando ficam marcados. Só o CEO ou a Administração podem eliminar um pedido daqui.</p>
 ${flash?`<p class="notice ok" role="status">${E(flash)}</p>`:''}
 <div class="req-filters">${select('pendClinic','Clínica',viewClinics(s).filter(c=>!c.virtual&&all.some(r=>String(r.clinic)===String(c.id))).map(c=>[c.id,c.name]),pClinic,'Todas')}${select('pendReason','Motivo',[...C().REASONS,['—','Sem motivo indicado']],pReason,'Todos')}</div>
 <div class="req-pending">${rows.map(r=>{const by=r.createdBy?C().author(s,r.createdBy):null,wa=C().whatsappLink(r.phone);return`<article class="req-pending-row" data-req-pending="${E(r.id)}"><div class="req-pending-main"><b>${E(r.name)}</b><span>${E(clinicName(s,r.clinic))} · ${E(r.specialty||'—')}</span><span class="meta">${E(r.stage)} · ${E(r.unmetReason||'sem motivo indicado')} · ${E(r.source||'origem por indicar')}</span><span class="meta">Contacto: ${r.phone?E(r.phone):''}${r.phone&&r.email?' · ':''}${r.email?E(r.email):''}${!r.phone&&!r.email?'<b>sem contacto</b>':''} · desde ${E(since(r))}${by?` · registado por ${E(by.name)} (${E(r.createdByRole||by.role)})`:''}</span></div><div class="req-pending-actions"><button type="button" class="secondary" data-req-open="${E(r.id)}">Abrir</button>${wa?`<a class="secondary req-wa" href="${E(wa)}" target="_blank" rel="noopener">WhatsApp</a>`:''}${r.email?`<a class="secondary" href="mailto:${E(r.email)}">Email</a>`:''}${del?`<button type="button" class="danger" data-req-delete="${E(r.id)}">Eliminar</button>`:''}</div></article>`}).join('')||'<p class="meta">Sem consultas por marcar com estes filtros.</p>'}</div></section>`;
}
function askDelete(id){const s=read(),r=scopedRequests(s).find(x=>x.id===id);if(!r||!C().canDelete(actorRole(s)))return;document.getElementById('modalTitle').textContent='Eliminar da lista por marcar';document.getElementById('modalBody').innerHTML=`<div class="modal-body"><p><b>${E(r.name)}</b> · ${E(clinicName(s,r.clinic))} · ${E(r.specialty||'—')}</p><p class="meta">O pedido deixa de aparecer nas listas e nos indicadores, mas fica guardado no histórico e na auditoria com o motivo.</p><label>Motivo da eliminação (obrigatório)<textarea id="reqDeleteReason" maxlength="300"></textarea></label><p id="reqDeleteError" role="alert" class="notice" hidden></p><div class="actions"><button type="button" class="danger" data-req-delete-confirm="${E(r.id)}">Eliminar</button></div></div>`;const m=document.getElementById('modal');m.showModal();m.querySelector('[data-req-delete-confirm]').onclick=()=>confirmDelete(r.id)}
function confirmDelete(id){const s=read(),i=(s.requests||[]).findIndex(x=>x.id===id),err=document.getElementById('reqDeleteError');try{if(i<0||!scopedRequests(s).some(x=>x.id===id))throw Object.assign(Error('Sem autorização para este pedido.'),{requestsDomain:true});const d=C().remove(s.requests[i],{role:actorRole(s),actor:actor(s),at:nowIso()},document.getElementById('reqDeleteReason')?.value);d.history=[...(d.history||[]),{at:nowIso(),by:actor(s),from:d.stage,to:'Eliminado da lista',note:d.deleted.reason}];s.requests[i]=d;(s.audit||(s.audit=[])).unshift({id:uid('log'),at:new Date().toISOString(),by:actor(s),module:'Pedidos',action:'Pedido por marcar eliminado',detail:`${d.name} · ${clinicName(s,d.clinic)} · ${d.deleted.reason}`});flash=`Eliminado da lista: ${d.name}.`;document.getElementById('modal').close();write(s)}catch(e){if(!e.requestsDomain)throw e;if(err){err.textContent=e.message;err.hidden=false}}}
function bookingsPanel(s){
 const cs=clinics(s);if(!last.clinic||!cs.some(c=>String(c.id)===String(last.clinic)))last.clinic=String(cs[0]?.id||'');
 const me=actor(s),mine=(s.callBookings||[]).filter(b=>String(b.by)===me),rows=C().hourly(s.callBookings||[],s.requests||[],today(),{by:me}),hour=new Date().getHours(),empty=C().emptyHours(s.callBookings||[],today(),nowIso(),me);
 const recent=mine.filter(b=>b.at.slice(0,10)===today()).slice(-5).reverse();
 return`<section class="card req-book"><h3>Consulta marcada — um toque, sem dados do utente</h3>
 ${flash?`<p class="notice ok" role="status">${E(flash)}</p>`:''}
 ${empty.length?`<p class="notice req-warn" role="alert">Horas sem nenhuma marcação registada hoje: <b>${E(empty.join(', '))}</b>. Se marcou consultas nessas horas, registe-as agora.</p>`:''}
 <div class="form-grid req-book-form">${select('bkClinic','Clínica',cs.map(c=>[c.id,c.name]),last.clinic)}<label>Especialidade${specialtyField(s,last.clinic,'bkSpecialty',last.specialty)}</label>${select('bkSource','Como chegou até nós?',C().CHANNELS,last.source,'Escolher…')}</div>
 <button type="button" class="primary req-plus" data-req-book>+1 consulta marcada</button>
 <p class="meta">A hora, o operador e o perfil ficam registados automaticamente. Pode anular um registo seu até ao fim da mesma hora.</p>
 ${recent.length?`<div class="req-recent"><b>Os seus últimos registos de hoje</b>${recent.map(b=>`<div class="req-recent-row"><span>${E(b.at.slice(11,16))} · ${E(clinicName(s,b.clinic))} · ${E(b.specialty)} · ${E(b.source)}</span>${C().canUndo(b,{actor:me,at:nowIso()})?`<button type="button" class="secondary" data-req-undo="${E(b.id)}">Anular</button>`:''}</div>`).join('')}</div>`:''}
 </section><section class="card"><h3>As suas marcações de hoje, hora a hora</h3><div class="table-wrap req-table"><table><thead><tr><th>Hora</th><th>Consultas marcadas</th><th>Pedidos registados</th></tr></thead><tbody>${rows.filter(r=>r.hour>=8&&r.hour<=19).map(r=>`<tr class="${r.hour===hour?'req-now':''}"><td>${E(r.label)}${r.hour===hour?' (agora)':''}</td><td>${r.hour>hour&&!r.booked?'—':r.booked}</td><td>${r.hour>hour&&!r.requests?'—':r.requests}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function unmetPanel(s){
 const f=range(),rows=C().unmet(scopedRequests(s),f),max=Math.max(0,...rows.map(r=>r.total)),due=scopedRequests(s).filter(r=>C().due(r,nowIso()));
 return`<section class="card"><div class="req-filters">${select('reqPeriod','Período',[['today','Hoje'],['7d','Últimos 7 dias'],['30d','Últimos 30 dias']],period)}</div>
 <h3>Procura que não conseguimos servir</h3><p class="meta">Pedidos sem vaga, sem médico ou com especialidade inexistente na clínica — onde contratar ou abrir horários.</p>
 <div class="table-wrap req-table"><table><thead><tr><th>Clínica · especialidade</th>${C().UNMET.map(x=>`<th title="${E(x)}">${E({'Sem vaga na especialidade':'Sem vaga','Sem médico da especialidade':'Sem médico','Especialidade não existe na clínica':'Sem especialidade'}[x]||x)}</th>`).join('')}<th>Total</th><th>Já marcados</th><th>A aguardar</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${E(clinicName(s,r.clinic))} · ${E(r.specialty)}</td>${C().UNMET.map(x=>`<td>${r[x]||0}</td>`).join('')}<td><b>${r.total}</b> ${bar(r.total,max)}</td><td>${r.recovered}</td><td>${r.waiting}</td></tr>`).join('')||`<tr><td colspan="${C().UNMET.length+4}">Sem procura não satisfeita neste período.</td></tr>`}</tbody></table></div></section>
 <section class="card"><h3>Voltar a contactar (${due.length})</h3>${due.map(r=>`<div class="req-recent-row"><span><b>${E(r.name)}</b> · ${E(clinicName(s,r.clinic))} · ${E(r.specialty||'—')} · desde ${E(String(r.created||'').slice(0,10))}</span><span>${C().whatsappLink(r.phone)?`<a class="secondary req-wa" href="${E(C().whatsappLink(r.phone))}" target="_blank" rel="noopener">WhatsApp</a>`:''}<button type="button" class="secondary" data-req-open="${E(r.id)}">Abrir pedido</button></span></div>`).join('')||'<p class="meta">Nenhum pedido para recontactar hoje.</p>'}</section>`;
}

function kpiPanel(s){
 const f={...range(),clinic:fClinic,source:fSource,role:fRole},k=C().kpis(s,scopedRequests(s),scopedBookings(s),f),pct=v=>v===null?'—':v+'%';
 const list=(title,items,map=x=>x)=>{const max=Math.max(0,...items.map(i=>i.count));return`<div class="req-break"><b>${E(title)}</b>${items.map(i=>`<div><span>${E(map(i.name))}</span><span>${bar(i.count,max)} ${i.count}</span></div>`).join('')||'<p class="meta">Sem registos.</p>'}</div>`};
 return`<section class="card"><div class="req-filters">${select('reqPeriod','Período',[['today','Hoje'],['7d','Últimos 7 dias'],['30d','Últimos 30 dias']],period)}${select('reqClinic','Clínica',viewClinics(s).filter(c=>!c.virtual).map(c=>[c.id,c.name]),fClinic,'Todas')}${select('reqSource','Origem',C().CHANNELS,fSource,'Todas')}${select('reqRole','Perfil',['Call Center','Administrativa','Administração','CEO'],fRole,'Todos')}</div>
 <div class="req-roles" role="group" aria-label="Ver trabalho de">${[['','Todos'],['Call Center','Call Center'],['Administrativa','Administrativas']].map(([v,t])=>`<button type="button" data-req-role="${E(v)}" aria-pressed="${fRole===v}" class="${fRole===v?'on':''}">${E(t)}</button>`).join('')}</div><div class="cards req-kpis"><div class="card"><div class="muted">Consultas marcadas</div><div class="metric">${k.booked}</div></div><div class="card"><div class="muted">Pedido → marcação</div><div class="metric">${pct(k.conversion)}</div></div><div class="card"><div class="muted">Tempo até 1.º contacto</div><div class="metric">${k.firstContactMinutes===null?'—':k.firstContactMinutes+' min'}</div></div><div class="card"><div class="muted">Procura não satisfeita</div><div class="metric">${k.unmet}</div></div></div>
 <h3>Por operador</h3><div class="table-wrap req-table"><table><thead><tr><th>Operador</th><th>Perfil</th><th>Pedidos registados</th><th>Consultas marcadas</th><th>Conversão</th><th>Origem mais frequente</th></tr></thead><tbody>${k.operators.map(o=>`<tr><td>${E(o.name)}</td><td>${E(o.role)}</td><td>${o.requests}</td><td>${o.booked}</td><td>${pct(o.conversion)}</td><td>${E(o.topSource)}</td></tr>`).join('')||'<tr><td colspan="6">Sem atividade neste período.</td></tr>'}</tbody></table></div>
 ${!fRole||fRole==='Administrativa'?(()=>{const w=C().clinicWork(s,scopedRequests(s),scopedBookings(s),{...range(),clinic:fClinic,source:fSource},'Administrativa');return`<h3>Administrativas por clínica</h3><div class="table-wrap req-table"><table><thead><tr><th>Clínica</th><th>Administrativas</th><th>Pedidos registados</th><th>Consultas marcadas</th><th>Conversão</th><th>1.º contacto</th><th>Ainda por marcar</th></tr></thead><tbody>${w.map(x=>`<tr><td>${E(clinicName(s,x.clinic))}</td><td>${E(x.people.join(', ')||'—')}</td><td>${x.requests}</td><td>${x.booked}</td><td>${pct(x.conversion)}</td><td>${x.firstContactMinutes===null?'—':x.firstContactMinutes+' min'}</td><td>${x.pending}</td></tr>`).join('')||'<tr><td colspan="7">Sem atividade das administrativas neste período.</td></tr>'}</tbody></table></div>`})():''}<div class="req-breaks">${list('Por origem',k.bySource)}${list('Por especialidade',k.bySpecialty)}${list('Por clínica',k.byClinic,id=>clinicName(s,id))}${list('Por perfil',k.byRole)}</div></section>`;
}

function render(funnelHtml){const s=read();const body=tab==='pending'?pendingPanel(s):tab==='bookings'?bookingsPanel(s):tab==='unmet'?unmetPanel(s):tab==='kpis'?kpiPanel(s):dueBox(s)+funnelHtml;const t=tabs(s);flash='';return t+`<div class="req-panel" data-req-panel="${tab}">${body}</div>`}

function addBooking(){const s=read();try{const clinic=document.getElementById('bkClinic')?.value,specialty=document.getElementById('bkSpecialty')?.value,source=document.getElementById('bkSource')?.value;
 const b=C().booking(s,{actor:actor(s),at:nowIso(),id:uid('bk'),canClinic:id=>clinics(s).some(c=>String(c.id)===String(id))},{clinic,specialty,source});
 s.callBookings=[...(s.callBookings||[]),b];(s.audit||(s.audit=[])).unshift({id:uid('log'),at:new Date().toISOString(),by:actor(s),module:'Pedidos',action:'Consulta marcada registada',detail:`${clinicName(s,clinic)} · ${specialty} · ${source} · ${b.role}`});
 last={clinic,specialty,source};flash=`Registado: ${clinicName(s,clinic)} · ${specialty} · ${source}.`;write(s)}catch(e){if(!e.requestsDomain)throw e;window.App?.toast?App.toast(e.message):alert(e.message)}}
function undo(id){const s=read(),b=(s.callBookings||[]).find(x=>x.id===id);if(!C().canUndo(b,{actor:actor(s),at:nowIso()}))return;s.callBookings=s.callBookings.filter(x=>x.id!==id);(s.audit||(s.audit=[])).unshift({id:uid('log'),at:new Date().toISOString(),by:actor(s),module:'Pedidos',action:'Registo de marcação anulado',detail:`${clinicName(s,b.clinic)} · ${b.specialty} · ${b.at.slice(11,16)}`});flash='Registo anulado.';write(s)}

function bind(root){if(!root||root.dataset.reqBound==='1')return;root.dataset.reqBound='1';
 root.addEventListener('click',e=>{const t=e.target.closest('[data-req-tab],[data-req-book],[data-req-undo],[data-req-open],[data-req-delete],[data-req-role]');if(!t)return;
  if(t.dataset.reqDelete){askDelete(t.dataset.reqDelete);return}
  if(t.hasAttribute('data-req-role')){fRole=t.dataset.reqRole;window.App?.renderAll?.();return}
  if(t.dataset.reqTab){tab=t.dataset.reqTab;window.App?.renderAll?.();return}
  if(t.hasAttribute('data-req-book')){addBooking();return}
  if(t.dataset.reqUndo){undo(t.dataset.reqUndo);return}
  if(t.dataset.reqOpen){window.App?.openRequest?.(t.dataset.reqOpen)}});
 root.addEventListener('change',e=>{const id=e.target.id;
  if(id==='bkClinic'){last={...last,clinic:e.target.value,specialty:''};window.App?.renderAll?.()}
  if(id==='bkSpecialty'||id==='bkSource')last={...last,[id==='bkSource'?'source':'specialty']:e.target.value};
  if(id==='reqPeriod'){period=e.target.value;window.App?.renderAll?.()}
  if(id==='reqClinic'){fClinic=e.target.value;window.App?.renderAll?.()}
  if(id==='reqSource'){fSource=e.target.value;window.App?.renderAll?.()}
  if(id==='reqRole'){fRole=e.target.value;window.App?.renderAll?.()}
  if(id==='pendClinic'){pClinic=e.target.value;window.App?.renderAll?.()}
  if(id==='pendReason'){pReason=e.target.value;window.App?.renderAll?.()}});
}
/* Pedido marcado no funil conta como marcação do operador que o marcou (sem duplicar o «+1»). */
function bookingFromRequest(s,r,by){if(!r||(s.callBookings||[]).some(b=>b.requestId===r.id))return null;try{return C().booking(s,{actor:by,at:nowIso(),id:uid('bk')},{clinic:r.clinic,specialty:r.specialty||'Por indicar',source:C().CHANNELS.includes(r.source)?r.source:'Outro',requestId:r.id})}catch{return null}}
window.GSRequestsUI={render,bind,bookingFromRequest,setTab:t=>{tab=t}};
})();
