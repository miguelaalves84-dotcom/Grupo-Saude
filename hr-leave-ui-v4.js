/* Ficha de ausência, contexto de equipa e reagendamento parcial partilhados. */
(() => {
  'use strict';
  const D=window.HRLeaveV4, E=v=>String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let ctx={id:null,month:'',clinicId:'',mode:'detail',selected:new Set()};
  let previews=new Map();
  let cal={employeeId:'',clinicId:'',role:'',month:new Date().toISOString().slice(0,7)};
  const stamp=v=>v?new Date(v).toLocaleString('pt-PT'):'—';
  const day=d=>d?D.date(d).toLocaleDateString('pt-PT',{timeZone:'UTC'}):'—';
  function periods(list) {
    const a=[...new Set(list)].sort(),blocks=[];
    for(const d of a) {const last=blocks.at(-1);if(last && D.range(last[1],d).length===2)last[1]=d;else blocks.push([d,d])}
    return blocks.map(([a,b])=>a===b?day(a):day(a)+' → '+day(b)).join(' · ') || 'Sem dias ativos';
  }
  const button=(label,action,id='',cls='secondary')=>`<button type="button" class="${cls}" data-leave-action="${action}" data-leave-id="${E(id)}">${E(label)}</button>`;
  function record(s,id) {const x=(s.leave || []).find(x=>String(x.id)===String(id));if(!x || !D.canRead(s,x))throw Error('Sem autorização para consultar este registo.');return x}
  function modal(title,html) {document.getElementById('modalTitle').textContent=title;document.getElementById('modalBody').innerHTML=`<div class="modal-body" data-leave-modal>${html}</div>`;const m=document.getElementById('modal');if(!m.open)m.showModal()}
  function safe(fn) {try {return fn()} catch(e) {alert(e.message);return false}}
  const field=(label,value)=>`<div><dt class="muted">${E(label)}</dt><dd style="margin:4px 0 12px">${E(value ?? '—')}</dd></div>`;
  function notifications(s){const alerts=(s.alerts||[]).filter(a=>a.action==='leaveDetail'&&String(a.to||a.userId)===String(s.currentUser)&&(s.leave||[]).some(x=>String(x.id)===String(a.recordId)&&D.canRead(s,x)));return alerts.length?'<div class="card"><h3>Notificações RH</h3>'+alerts.slice(0,20).map(a=>'<div class="row"><div><b>'+E(a.title)+'</b><div class="meta">'+E(stamp(a.createdAt))+'</div></div>'+button('Consultar','open',a.recordId)+'</div>').join('')+'</div>':''}
  function history(s,x) {
    const events=(s.audit || []).filter(a=>String(a.recordId || '')===String(x.id) || String(a.changeOf || '')===String(x.id) || (x.changeOf && String(a.recordId || '')===String(x.changeOf)) || (!a.recordId && String(a.detail || '').includes(String(x.id))));
    if(!events.length) return '<p class="muted">Sem decisões ou alterações registadas.</p>';
    return events.slice(0,30).map(a=>`<div class="card" style="margin-bottom:8px"><b>${E(a.action)}</b><div class="meta">${E(stamp(a.at))} · ${E(D.person(s,a.by || a.userId).name || 'Utilizador')}</div><p>${E(a.detail || a.reason || '')}</p>${a.before?.days?`<div class="meta">Antes: ${E(periods(a.before.days))}</div>`:''}${a.after?.days?`<div class="meta">Depois: ${E(periods(a.after.days))}</div>`:''}</div>`).join('');
  }
  function open(id) {return safe(()=>{
    const s=D.read(),x=record(s,id),p=D.person(s,D.owner(x)),cid=D.clinic(s,x),c=(s.clinics || []).find(c=>String(c.id)===cid),list=D.days(x),review=D.canReview(s),pending=D.norm(x.status || 'Pendente')==='PENDENTE';
    ctx={id:String(id),month:(list[0] || new Date().toISOString().slice(0,10)).slice(0,7),clinicId:cid,mode:'detail',selected:new Set()};
    const original=(s.leave || []).find(v=>String(v.id)===String(x.changeOf));
    const content=`${D.vacation(x)||D.change(x)?'<h3>Calendário de férias</h3><div id="leaveContext"></div>':''}<div class="card"><h3>${E(x.type || 'Ausência')} · ${E(p.name || 'Colaborador')}</h3><dl class="form-grid">${field('Clínica',c?.name || 'Por associar')}${field('Função',p.role || p.kind || '—')}${field('Período',periods(list))}${field('Dias úteis',D.workDays(s,x).length)}${field('Estado',x.status || 'Pendente')}${field('Pedido em',stamp(x.createdAt || x.at))}${field('Decisão em',stamp(x.reviewedAt))}${field('Decisor',x.reviewedBy?D.person(s,x.reviewedBy).name || 'Utilizador':'—')}${field('Motivo',x.reason || x.justification || '—')}${field('Notas',[x.note,x.notes,x.decisionNote].filter(Boolean).join(' · ') || '—')}</dl>${D.change(x)?`<h4>Alteração parcial solicitada</h4><p>Retirar: ${E(periods(x.selectedDays || (original?D.days(original):[])))}</p><p>Novos dias: ${E(periods(x.newDays || list))}</p><p>Os restantes dias mantêm-se.</p>`:''}${x.originalDays?`<details><summary>Período original preservado</summary><p>${E(periods(x.originalDays))}</p></details>`:''}</div>
      ${review && pending?`<label for="leaveDecisionNote">Nota da decisão (obrigatória para recusar)</label><textarea id="leaveDecisionNote"></textarea><div class="actions">${button('Aprovar','approve',id,'primary')}${button('Recusar','reject',id,'danger')}</div>`:''}
      <div class="actions" style="margin-top:12px">${D.vacation(x) && D.norm(x.status)==='APROVADO' && (D.canEdit(s) || D.owner(x)===String(s.currentUser) && D.permission(s,'leaveRequest'))?button(D.canEdit(s)?'Reagendar parte das férias':'Solicitar alteração parcial','edit',id,'primary'):''}${review && ['APROVADO','RECUSADO'].includes(D.norm(x.status))?button('Reverter decisão…','reverse-form',id):''}${D.sick(x) && review?button('Alterar período da baixa','sick-edit',id):''}${button('Fechar','close')}</div>
      ${x.document?`<div class="card"><h3>Documento associado</h3><p>${E(x.document.name || 'Justificativo')}</p>${/^data:(application\/pdf|image\/(png|jpeg|webp));base64,/.test(x.document.dataUrl || '')?`<a class="secondary" href="${E(x.document.dataUrl)}" target="_blank" rel="noopener">Abrir anexo</a>`:''}</div>`:''}<h3>Histórico do registo</h3>${history(s,x)}`;
    modal('Ficha de '+(x.type || 'ausência'),content);renderContext();return true;
  })}
  function calendarMarkup(s,x,currentMonth,clinicId){
    if(!D.canRead(s,x))return '';
    const p=D.person(s,D.owner(x)),cs=D.clinics(p),cid=cs.includes(clinicId)?clinicId:D.clinic(s,x),requested=D.change(x)?x.newDays || D.days(x):D.days(x),requestedSet=new Set(requested),[y,m]=currentMonth.split('-').map(Number),first=new Date(Date.UTC(y,m-1,1,12)),n=new Date(Date.UTC(y,m,0,12)).getUTCDate(),holiday=D.holidays(s,cid,y),title=first.toLocaleDateString('pt-PT',{month:'long',year:'numeric',timeZone:'UTC'}),visible=D.range(currentMonth+'-01',currentMonth+'-'+String(n).padStart(2,'0')),info=D.context(s,x,visible,cid,requested),conflicts=info.absences.filter(v=>v.days.some(d=>requestedSet.has(d)));
    let cells='<div class="leave-week">'+['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d=>'<b>'+d+'</b>').join('')+'</div><div class="leave-grid">';
    for(let i=0;i<(first.getUTCDay()+6)%7;i++)cells+='<div></div>';
    for(let i=1;i<=n;i++) {
      const d=currentMonth+'-'+String(i).padStart(2,'0'),isRequested=requestedSet.has(d),abs=info.absences.filter(v=>v.days.includes(d)),cov=info.coverage.find(v=>v.date===d),hn=holiday.get(d);
      cells+=`<div class="leave-day ${isRequested?'requested':''} ${D.working(s,cid,d)?'':'nonworking'}"><b>${i}</b>${hn?`<small>${E(hn)}</small>`:''}${isRequested?'<span class="leave-tag request">Este pedido</span>':''}${abs.map(v=>`<span class="leave-tag ${D.sick(v.record)?'sick':D.norm(v.record.status)==='APROVADO'?'approved':'pending'}">${E(v.employee.name)} · ${D.sick(v.record)?'Baixa':D.norm(v.record.status)==='APROVADO'?'Férias aprovadas':'Férias pendentes'}</span>`).join('')}${cov && cov.working?`<small>Com o pedido: ${cov.available}/${cov.total} disponíveis${cov.pending?`<br>Se pendentes aprovadas: ${cov.potentialAvailable}/${cov.total}`:''}</small>`:''}${abs.length && isRequested?'<strong class="leave-warning">Sobreposição</strong>':''}</div>`;
    }
    cells+='</div>';
    return `<div class="actions leave-month">${button('‹ Mês anterior','context-prev',x.id)}<b>${E(title)}</b>${button('Mês seguinte ›','context-next',x.id)}</div>${D.canTeam(s)?`<p class="muted">Mesma clínica e função · ${info.team.length} colaboradores ativos. A cobertura é uma estimativa de pessoas disponíveis; não considera escalas.</p>`:'<p class="muted">Calendário individual. Ausências de colegas são restritas ao CEO/Administração com autorização.</p>'}<div class="actions"><span class="leave-tag request">Pedido</span><span class="leave-tag approved">Férias aprovadas</span><span class="leave-tag pending">Férias pendentes</span><span class="leave-tag sick">Baixa</span></div>${cells}<div class="notice">${conflicts.length?'Existem sobreposições. Reveja a cobertura antes de decidir; o conflito de equipa não bloqueia a aprovação.':'Sem sobreposições da mesma função/clínica nos dias pedidos.'}</div>${info.absences.length?`<table><thead><tr><th>Colaborador</th><th>Ausência</th><th>Estado</th><th>Período</th></tr></thead><tbody>${info.absences.map(v=>`<tr><td>${E(v.employee.name)}</td><td>${D.sick(v.record)?'Baixa':'Férias'}</td><td>${E(v.record.status)}</td><td>${E(periods(D.days(v.record)))}</td></tr>`).join('')}</tbody></table>`:''}`;
  }
  function renderContext(){return safe(()=>{const root=document.getElementById('leaveContext');if(!root)return;const s=D.read(),x=record(s,ctx.id),cs=D.clinics(D.person(s,D.owner(x)));const picker=D.canTeam(s)&&cs.length>1?`<label for="leaveContextClinic">Clínica da equipa</label><select id="leaveContextClinic" data-leave-clinic>${cs.map(id=>`<option value="${E(id)}" ${id===ctx.clinicId?'selected':''}>${E((s.clinics||[]).find(c=>String(c.id)===id)?.name||'Clínica')}</option>`).join('')}</select>`:'';root.innerHTML=picker+calendarMarkup(s,x,ctx.month,ctx.clinicId)})}
  function mountPreviews(ids){previews=new Map();const s=D.read();ids.forEach((id,index)=>{const x=record(s,id),item={root:'approvalCalendar_'+index,month:(D.days(x)[0]||new Date().toISOString()).slice(0,7),clinicId:D.clinic(s,x)};previews.set(String(id),item);const root=document.getElementById(item.root);if(root)root.innerHTML=calendarMarkup(s,x,item.month,item.clinicId)})}
  function moveContext(id,offset){if(ctx.id===String(id)&&document.getElementById('modalBody')?.innerHTML.includes('data-leave-modal')&&document.getElementById('leaveContext'))return month(offset);return safe(()=>{const item=previews.get(String(id));if(!item)return;const [y,m]=item.month.split('-').map(Number);item.month=new Date(Date.UTC(y,m-1+offset,1,12)).toISOString().slice(0,7);const s=D.read(),x=record(s,id),root=document.getElementById(item.root);if(root)root.innerHTML=calendarMarkup(s,x,item.month,item.clinicId)})}
  function month(offset) {const [y,m]=ctx.month.split('-').map(Number),d=new Date(Date.UTC(y,m-1+offset,1,12));ctx.month=d.toISOString().slice(0,7);return renderContext()}
  function form(id) {return safe(()=>{
    const s=D.read(),x=record(s,id);if(!D.vacation(x) || D.norm(x.status)!=='APROVADO' || !(D.canEdit(s) || D.owner(x)===String(s.currentUser) && D.permission(s,'leaveRequest')))throw Error('Sem autorização para reagendar estas férias.');
    ctx={id:String(id),month:'',clinicId:D.clinic(s,x),mode:'edit',selected:new Set()};
    modal(D.canEdit(s)?'Reagendar parte das férias':'Solicitar alteração parcial',`<p>Selecione os dias a retirar. Os dias não selecionados ficam intactos; o registo original e as decisões mantêm-se no histórico.</p><fieldset><legend>Dias do período atual</legend><div class="leave-selection">${D.days(x).map(d=>`<label><input type="checkbox" data-leave-day="${E(d)}"> ${E(day(d))}${D.working(s,D.clinic(s,x),d)?'':' (não útil)'}</label>`).join('')}</div></fieldset><div class="form-grid"><div><label for="leaveNewStart">Novo início</label><input id="leaveNewStart" type="date" data-leave-preview></div><div><label for="leaveNewEnd">Novo fim</label><input id="leaveNewEnd" type="date" data-leave-preview></div></div><p class="muted">Fins de semana e feriados da clínica são excluídos dos novos dias. A quantidade de dias úteis deve manter-se.</p><label for="leaveChangeReason">Motivo obrigatório</label><textarea id="leaveChangeReason"></textarea><div id="leaveChangePreview" aria-live="polite"></div><div class="actions">${button(D.canEdit(s)?'Aplicar reagendamento':'Enviar para aprovação','save',id,'primary')}${button('Voltar à ficha','open',id)}</div>`);preview();
  })}
  function inputChange(s,x) {const a=document.getElementById('leaveNewStart')?.value,b=document.getElementById('leaveNewEnd')?.value || a;return {selected:[...ctx.selected],replacement:a?D.range(a,b).filter(d=>D.working(s,D.clinic(s,x),d)):[],reason:document.getElementById('leaveChangeReason')?.value || ''}}
  function preview() {
    const root=document.getElementById('leaveChangePreview');if(!root)return;
    try {const s=D.read(),x=record(s,ctx.id),input=inputChange(s,x),v=D.validateChange(s,x,input.selected,input.replacement),b=D.balance(s,D.owner(x),input.replacement[0].slice(0,4)),info=D.context(s,x,v.newDays);
      root.innerHTML=`<div class="notice">Retirar ${input.selected.filter(d=>D.working(s,D.clinic(s,x),d)).length} dias úteis · manter ${v.keptDays.filter(d=>D.working(s,D.clinic(s,x),d)).length} · novos ${v.newDays.length}.<br>Período após alteração: ${E(periods(v.resultDays))}<br>Saldo atual do ano de destino: ${b.available} dias.${info.conflicts.length?'<br><b>Sobreposição com a equipa: reveja o contexto antes de aplicar.</b>':''}</div>${info.absences.map(v=>`<p>${E(v.employee.name)} · ${D.sick(v.record)?'Baixa':'Férias'} · ${E(v.record.status)} · ${E(periods(v.days))}</p>`).join('')}`;
    } catch(e) {root.innerHTML='<p class="muted">'+E(e.message)+'</p>'}
  }
  function save() {return safe(()=>{const s=D.read(),x=record(s,ctx.id),v=inputChange(s,x),result=D.requestChange(ctx.id,v.selected,v.replacement,v.reason);open(result.id);window.ApprovalsV4?.sync?.();return result})}
  function decide(status) {return safe(()=>{const id=ctx.id;D.decide(id,status,document.getElementById('leaveDecisionNote')?.value || '');open(id);window.ApprovalsV4?.sync?.();return true})}
  function reversalForm(id) {return safe(()=>{const s=D.read();record(s,id);if(!D.canReview(s))throw Error('Sem autorização para reverter decisões.');ctx.id=String(id);modal('Reverter decisão',`<div class="notice">Esta ação é explícita e ficará registada no histórico. Uma alteração já aplicada só pode ser revertida se não existirem alterações posteriores.</div><label for="leaveReversalReason">Motivo obrigatório</label><textarea id="leaveReversalReason"></textarea><div class="actions">${button('Confirmar reversão','reverse',id,'danger')}${button('Cancelar','open',id)}</div>`)})}
  function reverse() {return safe(()=>{const id=ctx.id;D.reverse(id,document.getElementById('leaveReversalReason')?.value || '');open(id);window.ApprovalsV4?.sync?.();return true})}
  function calendar(employeeId='') {return safe(()=>{
    const s=D.read();if(!D.canTeam(s) && employeeId && String(employeeId)!==String(s.currentUser))throw Error('Sem autorização para consultar este calendário.');
    cal={employeeId:D.canTeam(s)?String(employeeId):String(s.currentUser),clinicId:'',role:'',month:new Date().toISOString().slice(0,7)};
    modal('Calendário RH · férias e baixas','<div id="vacCalendarBody"></div>');renderCalendar();return true;
  })}
  function renderCalendar() {return safe(()=>{
    const s=D.read(),root=document.getElementById('vacCalendarBody');if(!root)return;
    const team=D.canTeam(s),people=new Map();
    for(const u of [...(s.users||[]),...Object.values(s.employees||{})])people.set(String(u.id),D.person(s,u.id));
    const all=[...people.values()].filter(p=>p.active!==false && (team || p.id===String(s.currentUser))),list=all.filter(p=>(!cal.employeeId || p.id===cal.employeeId) && (!cal.clinicId || D.clinics(p).includes(cal.clinicId)) && (!cal.role || D.norm(p.role||p.kind)===cal.role)),cs=(s.clinics||[]).filter(c=>c.active!==false && c.operational!==false),roles=[...new Set(all.map(p=>D.norm(p.role||p.kind)))].sort(),[y,m]=cal.month.split('-').map(Number),n=new Date(Date.UTC(y,m,0,12)).getUTCDate();
    const options=(items,value,label,selected)=>items.map(x=>`<option value="${E(value(x))}" ${value(x)===selected?'selected':''}>${E(label(x))}</option>`).join('');
    const filter=team?`<div class="form-grid"><div><label for="vacClinic">Clínica</label><select id="vacClinic" data-leave-filter="clinicId"><option value="">Todas</option>${options(cs,c=>String(c.id),c=>c.name,cal.clinicId)}</select></div><div><label for="vacEmployee">Colaborador</label><select id="vacEmployee" data-leave-filter="employeeId"><option value="">Todos</option>${options(all,p=>p.id,p=>p.name,cal.employeeId)}</select></div><div><label for="vacRole">Função</label><select id="vacRole" data-leave-filter="role"><option value="">Todas</option>${options(roles,r=>r,r=>r,cal.role)}</select></div></div>`:'';
    const records=(s.leave||[]).filter(x=>D.active(x) && !D.change(x) && (D.vacation(x)||D.sick(x)) && (!cal.clinicId || !x.clinicId || String(x.clinicId)===cal.clinicId));
    const head=Array.from({length:n},(_,i)=>`<th scope="col">${i+1}</th>`).join('');
    const rows=list.map(p=>`<tr><th scope="row"><b>${E(p.name)}</b><div class="meta">${E(p.role||p.kind)}</div>${D.canEdit(s) || p.id===String(s.currentUser) && D.permission(s,'leaveRequest')?button('+ Férias','new',p.id):''}</th>${Array.from({length:n},(_,i)=>{const d=cal.month+'-'+String(i+1).padStart(2,'0'),abs=records.filter(x=>D.owner(x)===p.id && D.days(x).includes(d)),holiday=D.holidays(s,cal.clinicId||D.clinics(p)[0],y).get(d);return `<td class="${D.working(s,cal.clinicId||D.clinics(p)[0],d)?'':'nonworking'}" title="${E(holiday||day(d))}">${abs.map(x=>`<button type="button" class="leave-tag ${D.sick(x)?'sick':D.norm(x.status)==='APROVADO'?'approved':'pending'}" data-leave-action="open" data-leave-id="${E(x.id)}" aria-label="${E((x.type||'Férias')+' de '+p.name+' em '+day(d)+' · '+x.status)}">${D.sick(x)?'B':D.norm(x.status)==='APROVADO'?'F':'F?'} </button>`).join('')}</td>`}).join('')}</tr>`).join('');
    root.innerHTML=filter+`<label for="vacMonth">Mês</label><input id="vacMonth" type="month" value="${E(cal.month)}" data-leave-filter="month"><p class="muted">F: férias aprovadas · F?: pendentes · B: baixa. Clique numa ausência para consultar a ficha e o histórico.</p><div class="leave-table"><table><thead><tr><th>Colaborador / função</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>${list.length?'':'<p class="muted">Sem colaboradores para estes filtros.</p>'}`;
  })}
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-leave-action]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();const id=b.dataset.leaveId || ctx.id;
    const actions={'context-prev':()=>moveContext(id,-1),'context-next':()=>moveContext(id,1),open:()=>open(id),edit:()=>form(id),prev:()=>month(-1),next:()=>month(1),save,approve:()=>decide('Aprovado'),reject:()=>decide('Recusado'),'reverse-form':()=>reversalForm(id),reverse,close:()=>document.getElementById('modal').close(),'sick-edit':()=>window.ApprovalsV4?.editSickEnd?.(id),new:()=>window.VacationCalendarV4?.open?.(id)};
    actions[b.dataset.leaveAction]?.();
  },true);
  document.addEventListener('change',e=>{
    const t=e.target;if(t.dataset?.leaveDay){t.checked?ctx.selected.add(t.dataset.leaveDay):ctx.selected.delete(t.dataset.leaveDay);preview()}
    if(t.hasAttribute?.('data-leave-preview'))preview();
    if(t.hasAttribute?.('data-leave-clinic')){ctx.clinicId=t.value;renderContext()}
    if(t.dataset?.leaveFilter){cal[t.dataset.leaveFilter]=t.value;renderCalendar()}
  });
  function refreshAccess(){
    const modal=document.getElementById('modal');if(!modal?.open||!document.getElementById('modalBody')?.innerHTML.includes('data-leave-modal'))return;
    const s=D.read();
    if(document.getElementById('vacCalendarBody')){if(!D.canTeam(s)){cal.employeeId=String(s.currentUser);cal.clinicId='';cal.role=''}renderCalendar();return}
    if(ctx.id){const x=(s.leave||[]).find(x=>String(x.id)===ctx.id);if(!x||!D.canRead(s,x)){modal.close();document.getElementById('modalBody').innerHTML='';return}if(ctx.mode==='edit' && !(D.canEdit(s)||D.owner(x)===String(s.currentUser)&&D.permission(s,'leaveRequest'))){open(ctx.id);return}if(ctx.mode==='detail')open(ctx.id)}
  }
  document.addEventListener('gs:user-changed',refreshAccess);
  document.addEventListener('gs:permissions-applied',refreshAccess);
  window.HRLeaveUIV4={open,form,save,preview,month,renderContext,calendar,renderCalendar,periods,button,history,notifications,calendarMarkup,mountPreviews,reversalForm,reverse};
})();
