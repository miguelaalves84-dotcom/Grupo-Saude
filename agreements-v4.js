/* «Tabela de acordos» — disponível no Call Center e na Operação.
   - Clínica a clínica: cada clínica tem a sua lista de acordos (seguradoras, protocolos…).
   - Em cada acordo: linhas de consultas (das especialidades da clínica), tratamentos e técnicas, com o preço total.
   - Alteração de preço com data: até à data aparece o valor atual e «A partir de dd/mm/aaaa: novo valor»;
     a partir dessa data aparece só o novo valor. O histórico de preços fica guardado.
   - Só aparecem para consulta as linhas que têm valor. Notas e documentos necessários por acordo.
   - Editar: só CEO e Administração. Call Center e Administrativas: só consultar.
   Dados em state.agreements = { [clínica]: [acordo] } (sincronizado com o servidor quando há sessão real). */
(function(){'use strict';
 const DOC=typeof document!=='undefined';
 const K='grupo_saude_v4_demo_2',E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const R=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}};
 const W=s=>{localStorage.setItem(K,JSON.stringify(s));document.dispatchEvent(new Event('gs:state-changed'))};
 const can=k=>{try{return RoleAccessAdminV4.can(k)}catch{return false}};
 const say=m=>window.GSDialog?GSDialog.alert(m):alert(m);
 const today=()=>{try{return new Date(window.GSClock?.now?.()??Date.now()).toLocaleDateString('sv-SE',{timeZone:'Europe/Lisbon'})}catch{return new Date().toISOString().slice(0,10)}};
 const dmy=d=>String(d||'').split('-').reverse().join('/');
 const eur=c=>(Number(c||0)/100).toLocaleString('pt-PT',{style:'currency',currency:'EUR'});
 const KINDS={consulta:'Consulta',tratamento:'Tratamento',tecnica:'Técnica'};
 const uid=p=>p+'-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
 const me=s=>String(s.currentUser||'');
 /* ---------- regras (puras, testáveis) ---------- */
 /* Preço em vigor numa data e próxima alteração agendada. */
 function priceAt(line,d){const ps=(line?.prices||[]).filter(p=>p&&/^\d{4}-\d{2}-\d{2}$/.test(p.from)&&Number.isFinite(Number(p.cents))).sort((a,b)=>a.from.localeCompare(b.from)||String(a.at||'').localeCompare(String(b.at||'')));let current=null,next=null;for(const p of ps){if(p.from<=d)current=p;else if(!next)next=p}return{current,next}}
 /* Para consulta: só linhas com valor (atual ou agendado). */
 function visibleLines(ag,d){return(ag.lines||[]).map(l=>({...l,...priceAt(l,d)})).filter(l=>l.current||l.next)}
 function cents(v){const n=Number(String(v??'').replace(/\s/g,'').replace('€','').replace(',','.'));if(!Number.isFinite(n)||n<0||n>99999)throw Error('Valor inválido (em euros, entre 0 e 99 999).');return Math.round(n*100)}
 /* ---------- dados ---------- */
 function clinicsFor(s){const all=(s.clinics||[]).filter(c=>c&&c.active!==false&&!/^administra/i.test(String(c.id)));if(can('settings'))return all;const u=(s.users||[]).find(x=>String(x.id)===me(s))||s.employees?.[me(s)]||{},ids=new Set([...(u.clinics||[]),...(u.clinicIds||[]),u.clinic,u.clinicId].filter(Boolean).map(String));return ids.size?all.filter(c=>ids.has(String(c.id))):all}
 function specialties(s,clinic){try{return(window.GSOperationCore?.consultationCatalogue?.(s,clinic)||[]).map(x=>x.name).filter(Boolean)}catch{return[]}}
 function list(s,clinic){s.agreements||={};return Array.isArray(s.agreements[clinic])?s.agreements[clinic]:[]}
 function audit(s,action,detail){s.audit||=[];s.audit.unshift({at:new Date().toISOString(),by:me(s),module:'Tabela de acordos',action,detail})}
 function saveAgreement(clinic,data){if(!can('settings'))throw Error('Só CEO e Administração podem editar a tabela de acordos.');const s=R();s.agreements||={};const arr=s.agreements[clinic]=list(s,clinic).slice(),name=String(data.name||'').trim().slice(0,120);if(!name)throw Error('Indique o nome do acordo.');if(arr.some(a=>a.id!==data.id&&a.name.trim().toLowerCase()===name.toLowerCase()))throw Error('Já existe um acordo com esse nome nesta clínica.');
  const i=arr.findIndex(a=>a.id===data.id),before=i>=0?arr[i]:null,d=today();
  const lines=(data.lines||[]).map(l=>{const old=before?.lines?.find(x=>x.id===l.id),prices=(old?.prices||[]).filter(p=>!(l.removeFrom||[]).includes(p.from));let label=String(l.label||'').trim().slice(0,120);if(!label)return null;if(l.value!==''&&l.value!=null){const from=/^\d{4}-\d{2}-\d{2}$/.test(l.from||'')?l.from:d,c=cents(l.value),same=prices.findIndex(p=>p.from===from);const entry={from,cents:c,at:new Date().toISOString(),by:me(s)};if(same>=0)prices[same]=entry;else prices.push(entry)}if(!prices.length)return null;return{id:l.id||uid('l'),kind:KINDS[l.kind]?l.kind:'consulta',label,prices}}).filter(Boolean);
  const ag={id:data.id||uid('ag'),name,notes:String(data.notes||'').trim().slice(0,1000),documents:String(data.documents||'').trim().slice(0,1000),active:data.active!==false,lines,updatedAt:new Date().toISOString(),updatedBy:me(s)};
  if(i>=0)arr[i]=ag;else arr.push(ag);arr.sort((a,b)=>a.name.localeCompare(b.name,'pt'));audit(s,i>=0?'Acordo alterado':'Acordo criado',name+' · '+((s.clinics||[]).find(c=>String(c.id)===String(clinic))?.name||clinic));W(s);return ag}
 /* ---------- ecrã ---------- */
 const ui={clinic:'',q:'',editing:null};
 function cardHtml(ag,d,manager){const lines=visibleLines(ag,d),groups=Object.keys(KINDS).map(k=>[k,lines.filter(l=>l.kind===k)]).filter(([,l])=>l.length);
  return `<article class="card ag-card${ag.active===false?' is-inactive':''}" data-ag="${E(ag.id)}"><header class="ag-head"><h3>${E(ag.name)}</h3>${ag.active===false?'<span class="badge">Inativo</span>':''}${manager?`<button type="button" class="secondary" data-ag-edit="${E(ag.id)}">Editar</button>`:''}</header>
  ${groups.length?groups.map(([k,ls])=>`<div class="ag-group"><h4>${E(KINDS[k])}${ls.length>1?'s':''}</h4><ul class="ag-lines">${ls.map(l=>`<li><span class="ag-label">${E(l.label)}</span><span class="ag-price">${l.current?`<b>${eur(l.current.cents)}</b>`:'<span class="meta">sem valor em vigor</span>'}${l.next?`<small class="ag-next">A partir de ${E(dmy(l.next.from))}: <b>${eur(l.next.cents)}</b></small>`:''}</span></li>`).join('')}</ul></div>`).join(''):'<p class="meta">Sem valores inseridos.</p>'}
  ${ag.documents?`<p class="ag-docs"><b>Documentos necessários:</b> ${E(ag.documents)}</p>`:''}${ag.notes?`<p class="ag-notes"><b>Notas:</b> ${E(ag.notes)}</p>`:''}</article>`}
 function lineRow(l,d){const {current,next}=priceAt(l,d),future=(l.prices||[]).filter(p=>p.from>d).sort((a,b)=>a.from.localeCompare(b.from));return `<div class="ag-edit-line" data-line="${E(l.id||'')}"><label>Tipo<select data-f="kind">${Object.entries(KINDS).map(([k,v])=>`<option value="${k}"${(l.kind||'consulta')===k?' selected':''}>${v}</option>`).join('')}</select></label><label class="ag-edit-label">Nome<input data-f="label" maxlength="120" value="${E(l.label||'')}" ${l.fixed?'readonly':''}></label>
  <div class="ag-edit-now"><span class="meta">Em vigor</span><b>${current?eur(current.cents)+' <small>desde '+E(dmy(current.from))+'</small>':'—'}</b>${future.map(p=>`<span class="ag-future">A partir de ${E(dmy(p.from))}: ${eur(p.cents)} <button type="button" class="link" data-ag-unschedule="${E(p.from)}" aria-label="Cancelar alteração de ${E(dmy(p.from))}">cancelar</button></span>`).join('')}</div>
  <label>Novo valor (€)<input data-f="value" inputmode="decimal" placeholder="${current?'manter':'0,00'}"></label><label>A partir de<input type="date" data-f="from" value="${E(d)}"></label><button type="button" class="secondary ag-remove" data-ag-remove-line aria-label="Retirar linha">Retirar</button></div>`}
 function editorHtml(s,clinic,ag,d){const base=ag||{name:'',notes:'',documents:'',active:true,lines:[]},have=new Set((base.lines||[]).map(l=>l.kind+'|'+l.label.toLowerCase())),spec=specialties(s,clinic).filter(n=>!have.has('consulta|'+n.toLowerCase())).map(n=>({kind:'consulta',label:n,prices:[],fixed:true}));
  return `<form class="card ag-editor" id="agEditor" data-id="${E(base.id||'')}"><h3>${ag?'Editar acordo':'Novo acordo'}</h3>
  <div class="ag-edit-top"><label>Nome do acordo<input name="name" maxlength="120" required value="${E(base.name)}" placeholder="Ex.: Médis"></label><label class="ag-inline"><input type="checkbox" name="active" ${base.active!==false?'checked':''}> Ativo</label></div>
  <p class="meta">Só ficam visíveis para consulta as linhas com valor. Para mudar um preço numa data futura, escreva o novo valor e a data «A partir de»: até lá continua a aparecer o valor atual.</p>
  <div class="ag-edit-lines" data-lines>${[...(base.lines||[]),...spec].map(l=>lineRow(l,d)).join('')}</div>
  <div class="ag-edit-add"><button type="button" class="secondary" data-ag-add="consulta">+ Consulta</button><button type="button" class="secondary" data-ag-add="tratamento">+ Tratamento</button><button type="button" class="secondary" data-ag-add="tecnica">+ Técnica</button></div>
  <label>Documentos necessários<textarea name="documents" rows="2" maxlength="1000" placeholder="Ex.: cartão do seguro e credencial médica">${E(base.documents||'')}</textarea></label>
  <label>Notas<textarea name="notes" rows="2" maxlength="1000" placeholder="Ex.: máximo 20 sessões por ano">${E(base.notes||'')}</textarea></label>
  <div class="ag-edit-actions"><button type="submit" class="primary">Guardar acordo</button><button type="button" class="secondary" data-ag-cancel>Cancelar</button></div></form>`}
 function html(s){const d=today(),clinics=clinicsFor(s);if(!clinics.length)return'<p class="meta">Sem clínicas atribuídas.</p>';if(!clinics.some(c=>String(c.id)===ui.clinic))ui.clinic=String(clinics[0].id);const manager=can('settings'),q=ui.q.trim().toLowerCase();
  let ags=list(s,ui.clinic).filter(a=>manager||a.active!==false);if(q)ags=ags.filter(a=>(a.name+' '+(a.lines||[]).map(l=>l.label).join(' ')+' '+(a.notes||'')).toLowerCase().includes(q));
  const editing=ui.editing==='new'?null:list(s,ui.clinic).find(a=>a.id===ui.editing);
  return `<div class="ag-toolbar card"><label>Clínica<select data-ag-clinic>${clinics.map(c=>`<option value="${E(c.id)}"${String(c.id)===ui.clinic?' selected':''}>${E(c.name)}</option>`).join('')}</select></label><label>Pesquisar<input type="search" data-ag-q value="${E(ui.q)}" placeholder="Acordo, consulta ou tratamento"></label>${manager&&!ui.editing?'<button type="button" class="primary" data-ag-new>+ Novo acordo</button>':''}</div>
  ${!manager?'<p class="meta ag-readonly">Só consulta. Alterações: CEO ou Administração.</p>':''}
  ${ui.editing&&manager?editorHtml(s,ui.clinic,editing,d):''}
  <div class="ag-grid">${ags.length?ags.map(a=>cardHtml(a,d,manager)).join(''):`<p class="meta">${q?'Nenhum acordo encontrado.':'Esta clínica ainda não tem acordos.'}</p>`}</div>`}
 const HOSTS=['agreementsContent','agreementsOpContent'];
 function render(){for(const id of HOSTS){const h=document.getElementById(id);if(!h||!h.closest('.view')?.classList.contains('active'))continue;const keep=document.activeElement?.matches?.('[data-ag-q]')&&h.contains(document.activeElement);h.innerHTML=html(R());if(keep){const i=h.querySelector('[data-ag-q]');i.focus();i.setSelectionRange(i.value.length,i.value.length)}}}
 function collect(form){return{id:form.dataset.id||undefined,name:form.elements.name.value,active:form.elements.active.checked,notes:form.elements.notes.value,documents:form.elements.documents.value,lines:[...form.querySelectorAll('.ag-edit-line')].map(r=>({id:r.dataset.line||undefined,kind:r.querySelector('[data-f=kind]').value,label:r.querySelector('[data-f=label]').value,value:r.querySelector('[data-f=value]').value.trim(),from:r.querySelector('[data-f=from]').value,removeFrom:JSON.parse(r.dataset.removeFrom||'[]')}))}}
 function bind(h){if(!h||h.dataset.bound)return;h.dataset.bound='1';
  h.addEventListener('change',e=>{const t=e.target;if(t.matches('[data-ag-clinic]')){ui.clinic=t.value;ui.editing=null;render()}});
  h.addEventListener('input',e=>{if(e.target.matches('[data-ag-q]')){ui.q=e.target.value;render()}});
  h.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
   if(t.matches('[data-ag-new]')){ui.editing='new';render();h.querySelector('#agEditor [name=name]')?.focus()}
   else if(t.matches('[data-ag-edit]')){ui.editing=t.dataset.agEdit;render();h.querySelector('#agEditor')?.scrollIntoView({block:'start'})}
   else if(t.matches('[data-ag-cancel]')){ui.editing=null;render()}
   else if(t.matches('[data-ag-add]')){const box=h.querySelector('[data-lines]');box.insertAdjacentHTML('beforeend',lineRow({kind:t.dataset.agAdd,label:'',prices:[]},today()));box.lastElementChild.querySelector('[data-f=label]').focus()}
   else if(t.matches('[data-ag-remove-line]'))t.closest('.ag-edit-line').remove();
   else if(t.matches('[data-ag-unschedule]')){const row=t.closest('.ag-edit-line'),arr=JSON.parse(row.dataset.removeFrom||'[]');arr.push(t.dataset.agUnschedule);row.dataset.removeFrom=JSON.stringify(arr);t.closest('.ag-future').remove()}});
  h.addEventListener('submit',e=>{e.preventDefault();const f=e.target;if(f.getAttribute('id')!=='agEditor')return;try{saveAgreement(ui.clinic,collect(f));ui.editing=null;render()}catch(err){say(err.message)}})}
 function start(){for(const id of HOSTS)bind(document.getElementById(id));render();document.addEventListener('gs:state-changed',()=>{if(!document.getElementById('agEditor'))render()});document.addEventListener('gs:user-changed',()=>{ui.editing=null;render()});
  let was=false;new MutationObserver(()=>{const act=HOSTS.some(id=>document.getElementById(id)?.closest('.view')?.classList.contains('active'));if(act&&!was){for(const id of HOSTS)bind(document.getElementById(id));render()}was=act}).observe(document.body,{attributes:true,subtree:true,attributeFilter:['class']})}
 if(DOC)document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
 const api={priceAt,visibleLines,cents,saveAgreement,list,clinicsFor,render};if(typeof window!=='undefined')window.AgreementsV4=api;if(typeof module!=='undefined')module.exports=api;
})();
