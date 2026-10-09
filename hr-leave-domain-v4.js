/* Regras únicas de férias: dias efetivos, saldos, contexto e alterações auditadas. */
(() => {
  'use strict';
  const KEY = 'grupo_saude_v4_demo_2';
  const read = () => JSON.parse(localStorage.getItem(KEY) || '{}');
  const write = s => localStorage.setItem(KEY, JSON.stringify(s));
  const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
  const clone = v => JSON.parse(JSON.stringify(v));
  const uid = p => p + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  const owner = x => String(x.employeeId || x.userId || x.user || '');
  function person(s, id) {
    const u = (s.users || []).find(p => String(p.id) === String(id)) || {};
    const e = s.employees?.[id] || {};
    return {...u, ...e, id: String(id), hr: {...u.hr, ...e.hr}};
  }
  const clinics = p => [...new Set([...(p.clinics || []), ...(p.clinicIds || []), p.clinicId, p.clinic].filter(Boolean).map(String))];
  const clinic = (s, x) => String(x.clinicId || x.clinic || clinics(person(s, owner(x)))[0] || '');
  const change = x => !!x.changeOf || norm(x.type).includes('ALTERACAO DE FERIAS');
  const vacation = x => /FERIAS/.test(norm(x.type || 'Férias')) && !change(x);
  const sick = x => /BAIXA/.test(norm(x.type));
  const active = x => ['APROVADO', 'PENDENTE'].includes(norm(x.status || 'Pendente'));
  function permission(s,action){return window.RoleAccessAdminV4?.permission?.(s,action) || false}
  const adminRole = s => String(s.currentUser) === 'u1' || ['CEO', 'ADMINISTRACAO'].includes(norm(person(s, s.currentUser).role || person(s, s.currentUser).kind));
  const canReview = s => adminRole(s) && permission(s, 'leaveApprove');
  const canTeam = s => adminRole(s) && (permission(s, 'hrManage') || permission(s, 'leaveApprove'));
  const teamPerson=(s,id,cid='')=>{const scope=window.AccessScopeV4;if(!scope)return true;if(scope.isAdmin(s))return true;const allowed=scope.clinics(s);return cid?allowed.includes(String(cid)):clinics(person(s,id)).some(c=>allowed.includes(c))};
  const canRead = (s, x) => person(s,s.currentUser).active!==false&&(owner(x) === String(s.currentUser) || canTeam(s)&&teamPerson(s,owner(x),x.clinicId||x.clinic||''));
  const canEdit = s => canReview(s) && permission(s, 'hrManage');
  function date(d) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(d))) throw Error('Indique uma data válida.');
    const t = new Date(d + 'T12:00:00Z');
    if(!Number.isFinite(+t) || t.toISOString().slice(0, 10) !== d) throw Error('Indique uma data válida.');
    return t;
  }
  const iso = d => d.toISOString().slice(0, 10);
  function range(a, b = a) {
    const first = date(a), last = date(b);
    if(last < first || (last - first) / 864e5 > 1096) throw Error('Período inválido (máximo de três anos).');
    const out = [];
    for(let d = new Date(first); d <= last; d.setUTCDate(d.getUTCDate() + 1)) out.push(iso(d));
    return out;
  }
  function days(x) {
    if(Array.isArray(x.days)) return [...new Set(x.days)].filter(d => {try {date(d); return true} catch {return false}}).sort();
    if(!x.start) return [];
    return range(x.start, x.end || x.start);
  }
  function nationals(year) {
    let a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=(h+l-7*m+114)%31+1;
    const easter = new Date(Date.UTC(year, mo-1, da, 12));
    const out = [['01-01','Ano Novo'],['04-25','Dia da Liberdade'],['05-01','Dia do Trabalhador'],['06-10','Dia de Portugal'],['08-15','Assunção'],['10-05','Implantação da República'],['11-01','Todos os Santos'],['12-01','Restauração da Independência'],['12-08','Imaculada Conceição'],['12-25','Natal']].map(([d,name]) => ({date:year+'-'+d,name}));
    for(const [offset,name] of [[-2,'Sexta-feira Santa'],[0,'Páscoa'],[60,'Corpo de Deus']]) {const z=new Date(easter);z.setUTCDate(z.getUTCDate()+offset);out.push({date:iso(z),name})}
    return out;
  }
  function holidays(s, cid, year) {
    const c = s.clinicCalendars?.[cid] || {}, y = c[year] || {};
    const map = new Map(nationals(Number(year)).map(x => [x.date, x.name]));
    for(const x of [...(c.holidays || []), ...(y.national || []), ...(y.municipal || [])]) if(x.active !== false && String(x.date).startsWith(String(year))) map.set(x.date, x.name || 'Feriado');
    return map;
  }
  function working(s, cid, d) {const w=date(d).getUTCDay();return w!==0 && w!==6 && !holidays(s,cid,d.slice(0,4)).has(d)}
  const workDays = (s, x) => days(x).filter(d => working(s, clinic(s,x), d));
  function entitlement(s, id, year) {
    const p=person(s,id), h=p.hr || {}, ct=(s.contractTypes || []).find(c => String(c.id)===String(h.contractType || p.contractType) || c.name===(h.contractType || p.contractType));
    if(ct?.vacationEntitled === false) return 0;
    const base=Number(h.vacationDays ?? h.annualVacationDays ?? ct?.vacationDays ?? 22);
    const admission=h.admissionDate || p.admissionDate;
    if(!admission || admission < year+'-01-01') return Math.max(0,base);
    if(admission > year+'-12-31') return 0;
    const total=range(year+'-01-01',year+'-12-31').length;
    return Math.round(Math.max(0,base)*range(admission,year+'-12-31').length/total*100)/100;
  }
  function balance(s, id, year=new Date().getFullYear()) {
    const approved=new Set(), pending=new Set();
    for(const x of s.leave || []) if(owner(x)===String(id) && vacation(x) && active(x)) for(const d of workDays(s,x).filter(d=>d.startsWith(String(year)))) (norm(x.status)==='APROVADO'?approved:pending).add(d);
    for(const d of approved) pending.delete(d);
    const entitled=entitlement(s,id,year);
    return {year:String(year),entitled,approved:approved.size,used:approved.size,pending:pending.size,available:Math.max(0,entitled-approved.size),unreserved:Math.max(0,entitled-approved.size-pending.size)};
  }
  function context(s, x, requested=days(x), cid=clinic(s,x), requestDays=requested) {
    if(!canTeam(s)||!canRead(s,x)||!teamPerson(s,owner(x),cid)) return {clinicId:cid,team:[],absences:[],coverage:[],conflicts:[]};
    const p=person(s,owner(x)), role=norm(p.role || p.kind), people=new Map();
    for(const u of [...(s.users || []), ...Object.values(s.employees || {})]) people.set(String(u.id),person(s,u.id));
    const team=[...people.values()].filter(u=>u.active!==false && norm(u.role || u.kind)===role && clinics(u).includes(cid));
    const ids=new Set(team.map(u=>String(u.id))), requestedSet=new Set(requested);
    const absences=(s.leave || []).filter(v=>v.id!==x.id && owner(v)!==owner(x) && ids.has(owner(v)) && active(v) && !change(v) && (vacation(v)||sick(v)) && (!v.clinicId || String(v.clinicId)===cid)).map(v=>({record:v,employee:person(s,owner(v)),days:days(v).filter(d=>requestedSet.has(d))})).filter(v=>v.days.length);
    const coverage=requested.map(d=>{const approved=new Set(absences.filter(v=>norm(v.record.status)==='APROVADO' && v.days.includes(d)).map(v=>owner(v.record))),pending=new Set(absences.filter(v=>norm(v.record.status)==='PENDENTE' && v.days.includes(d)).map(v=>owner(v.record)));if(requestDays.includes(d))approved.add(owner(x));const potential=new Set([...approved,...pending]);return {date:d,working:working(s,cid,d),total:team.length,available:Math.max(0,team.length-approved.size),potentialAvailable:Math.max(0,team.length-potential.size),absent:approved.size,pending:pending.size}});
    return {clinicId:cid,team,absences,coverage,conflicts:absences};
  }
  function snapshot(x) {return {days:days(x),start:x.start || '',end:x.end || '',status:x.status || 'Pendente',revision:Number(x.revision || 0)}}
  function audit(s, x, action, reason, extra={}) {
    const event={id:uid('log'),at:new Date().toISOString(),by:String(s.currentUser),userId:owner(x),module:'RH',action,detail:reason,recordId:x.id,...extra};
    (s.audit ||= []).unshift(event);return event;
  }
  function notify(s, x, title) {
    const targets=new Set([owner(x)]);
    for(const u of [...(s.users || []),...Object.values(s.employees || {})]) if(['CEO','ADMINISTRACAO'].includes(norm(u.role || u.kind))) targets.add(String(u.id));
    targets.add('u1');
    for(const id of targets) (s.alerts ||= []).unshift({id:uid('alert'),title,module:'RH',userId:id,to:id,recordId:x.id,action:'leaveDetail',createdAt:new Date().toISOString(),status:'Ativo',read:false});
  }
  function preserve(x, before, reason, actor) {
    x.original ||= clone(before);
    x.originalDays ||= before.days.slice();
    (x.revisions ||= []).push({at:new Date().toISOString(),by:actor,reason,before:clone(before)});
    x.revision=Number(x.revision || 0)+1;
  }
  function setDays(x, next) {x.days=[...new Set(next)].sort();x.start=x.days[0] || '';x.end=x.days[x.days.length-1] || ''}
  function validateChange(s, original, selected, replacements) {
    if(!vacation(original) || norm(original.status)!=='APROVADO') throw Error('Só é possível reagendar férias aprovadas.');
    const old=days(original), remove=[...new Set(selected)].sort(), target=[...new Set(replacements)].sort(), cid=clinic(s,original);
    if(!remove.length || remove.some(d=>!old.includes(d))) throw Error('Selecione dias que pertencem ao período atual.');
    if(!target.length || target.some(d=>!working(s,cid,d))) throw Error('O novo período só pode incluir dias úteis sem feriados.');
    if(remove.filter(d=>working(s,cid,d)).length!==target.length) throw Error('O novo período deve ter o mesmo número de dias úteis que a parte selecionada.');
    const kept=old.filter(d=>!remove.includes(d));
    if(target.some(d=>kept.includes(d))) throw Error('O novo período sobrepõe dias que pretende manter.');
    for(const v of s.leave || []) if(v.id!==original.id && owner(v)===owner(original) && active(v) && !change(v) && (vacation(v) || (sick(v)&&norm(v.status)==='APROVADO')) && days(v).some(d=>target.includes(d))) throw Error('O colaborador já tem férias ou baixa nesses dias.');
    const next=[...new Set([...kept,...target])].sort();
    const candidate=clone(s), o=candidate.leave.find(v=>v.id===original.id);setDays(o,next);
    for(const year of new Set(next.filter(d=>target.includes(d)).map(d=>d.slice(0,4)))) {const b=balance(candidate,owner(original),year);if(b.approved+b.pending>b.entitled) throw Error('O novo período ultrapassa o saldo de férias de '+year+'.')}
    return {selectedDays:remove,newDays:target,keptDays:kept,resultDays:next,conflicts:context(s,original,target).conflicts.map(v=>v.record.id)};
  }
  function applyChange(s, request, reason) {
    const original=(s.leave || []).find(v=>String(v.id)===String(request.changeOf));
    if(!original) throw Error('O pedido original não foi encontrado.');
    const old=snapshot(original);
    if(request.baseDays && JSON.stringify(old.days)!==JSON.stringify(request.baseDays) || request.baseRevision!==undefined && Number(request.baseRevision)!==old.revision) throw Error('O período foi alterado entretanto. Recuse este pedido e crie uma nova alteração.');
    const valid=validateChange(s,original,request.selectedDays || old.days,request.newDays || workDays(s,request));
    preserve(original,old,reason,String(s.currentUser));setDays(original,valid.resultDays);
    original.modifiedAt=new Date().toISOString();original.modifiedBy=String(s.currentUser);
    request.appliedRevision=original.revision;request.resultDays=valid.resultDays;request.before=old;request.conflictIds=valid.conflicts;
    audit(s,original,'Férias parcialmente reagendadas',reason,{changeId:request.id,before:old,after:snapshot(original)});
  }
  function requestChange(id, selected, replacement, reason) {
    const s=read(),original=(s.leave || []).find(v=>String(v.id)===String(id));
    if(!original || !canRead(s,original)) throw Error('Sem autorização para alterar este período.');
    if(!canEdit(s) && (owner(original)!==String(s.currentUser) || !permission(s,'leaveRequest'))) throw Error('Sem autorização para pedir alterações de férias.');
    if(!String(reason || '').trim()) throw Error('Indique um motivo para a alteração.');
    if((s.leave || []).some(v=>String(v.changeOf)===String(id) && norm(v.status)==='PENDENTE')) throw Error('Este período já tem um pedido de alteração pendente.');
    const valid=validateChange(s,original,selected,replacement),direct=canEdit(s),before=snapshot(original);
    const x={id:uid('leavechg'),employeeId:owner(original),userId:owner(original),clinicId:clinic(s,original),type:'Alteração de Férias',changeOf:original.id,days:valid.newDays,start:valid.newDays[0],end:valid.newDays.at(-1),selectedDays:valid.selectedDays,newDays:valid.newDays,baseDays:before.days,baseRevision:before.revision,reason:String(reason).trim(),status:direct?'Aprovado':'Pendente',createdAt:new Date().toISOString(),createdBy:String(s.currentUser)};
    (s.leave ||= []).unshift(x);
    if(direct) {applyChange(s,x,x.reason);x.reviewedAt=x.createdAt;x.reviewedBy=String(s.currentUser)}
    audit(s,x,direct?'Alteração de férias aplicada':'Alteração de férias solicitada',x.reason,{changeOf:original.id});notify(s,x,direct?'Férias reagendadas':'Pedido de alteração de férias');write(s);return clone(x);
  }
  function approveSick(s, x) {
    x.adjustments = [];
    for(const v of s.leave || []) if(owner(v)===owner(x) && vacation(v) && active(v)) {
      const old=snapshot(v), keep=old.days.filter(d=>!days(x).includes(d));
      if(keep.length===old.days.length) continue;
      preserve(v,old,'Ajuste por baixa aprovada',String(s.currentUser));setDays(v,keep);if(!keep.length)v.status='Anulado por baixa';
      v.adjustedBySickLeave=x.id;v.adjustedAt=new Date().toISOString();
      x.adjustments.push({id:v.id,before:old,revision:v.revision});audit(s,v,'Férias ajustadas por baixa','Baixa aprovada',{sickLeaveId:x.id,before:old,after:snapshot(v)});
    }
  }
  function createVacation(id, selected, reason='') {
    const s=read(),direct=canEdit(s),p=person(s,id);
    if(!canRead(s,{employeeId:String(id)}))throw Error('Sem autorização para este colaborador.');
    if(!direct && (String(id)!==String(s.currentUser) || !permission(s,'leaveRequest'))) throw Error('Sem autorização para pedir férias para este colaborador.');
    if(!p.name || p.active===false) throw Error('Colaborador não encontrado ou inativo.');
    const x={id:uid('leave'),employeeId:String(id),userId:String(id),clinicId:clinics(p)[0] || '',type:'Férias',days:[...new Set(selected)].sort(),status:direct?'Aprovado':'Pendente',createdAt:new Date().toISOString(),createdBy:String(s.currentUser),reason};
    if(!x.days.length || x.days.some(d=>!working(s,x.clinicId,d))) throw Error('Selecione dias úteis sem feriados.');
    for(const v of s.leave || []) if(owner(v)===String(id) && active(v) && !change(v) && (vacation(v) || (sick(v)&&norm(v.status)==='APROVADO')) && days(v).some(d=>x.days.includes(d))) throw Error('Já existem férias ou uma baixa nos dias selecionados.');
    setDays(x,x.days);(s.leave ||= []).unshift(x);
    for(const year of new Set(x.days.map(d=>d.slice(0,4)))) {const b=balance(s,id,year);if(b.approved+b.pending>b.entitled)throw Error('Saldo de férias insuficiente em '+year+'.')}
    if(direct) {x.reviewedAt=x.createdAt;x.reviewedBy=String(s.currentUser)}
    audit(s,x,direct?'Férias marcadas pela Administração':'Pedido de férias enviado',reason || 'Marcação de férias');notify(s,x,direct?'Férias marcadas':'Pedido de férias');write(s);return clone(x);
  }
  function decide(id, status, note='') {
    const s=read(),x=(s.leave || []).find(v=>String(v.id)===String(id));
    if(!canReview(s)||x&&!canRead(s,x)) throw Error('Sem autorização para decidir pedidos.');
    if(!x || norm(x.status || 'Pendente')!=='PENDENTE') throw Error('Este pedido já foi decidido. Uma reversão exige uma ação explícita.');
    if(!['Aprovado','Recusado'].includes(status)) throw Error('Decisão inválida.');
    if(status==='Recusado' && !String(note).trim()) throw Error('Indique o motivo da recusa.');
    const before=snapshot(x);
    if(status==='Aprovado' && change(x)) applyChange(s,x,note || x.reason);
    if(status==='Aprovado' && vacation(x)) {
      if(!workDays(s,x).length) throw Error('O pedido não contém dias úteis válidos.');
      if(workDays(s,x).some(d=>(s.leave || []).some(v=>v.id!==x.id && owner(v)===owner(x) && vacation(v) && norm(v.status)==='APROVADO' && days(v).includes(d)))) throw Error('O pedido duplica dias de férias já aprovados.');
      if(workDays(s,x).some(d=>(s.leave || []).some(v=>v.id!==x.id && owner(v)===owner(x) && sick(v) && norm(v.status)==='APROVADO' && days(v).includes(d)))) throw Error('O pedido coincide com uma baixa aprovada.');
      const projected=clone(s);projected.leave.find(v=>v.id===x.id).status='Aprovado';
      for(const y of new Set(workDays(s,x).map(d=>d.slice(0,4)))) {const b=balance(projected,owner(x),y);if(b.approved>b.entitled)throw Error('Saldo de férias insuficiente em '+y+'.')}
    }
    if(status==='Aprovado' && sick(x)) {if(!days(x).length)throw Error('A baixa não contém um período válido.');approveSick(s,x)}
    for(const doc of s.employeeDocuments?.[owner(x)] || []) if(doc.leaveId===x.id) doc.status=status;
    preserve(x,before,note || status,String(s.currentUser));x.status=status;x.decisionNote=String(note).trim();x.reviewedAt=new Date().toISOString();x.reviewedBy=String(s.currentUser);
    audit(s,x,'Pedido '+status.toLowerCase(),note || status,{before,after:snapshot(x)});notify(s,x,'Pedido '+status.toLowerCase());write(s);return clone(x);
  }
  function reverse(id, reason) {
    const s=read(),x=(s.leave || []).find(v=>String(v.id)===String(id));
    if(!canReview(s) || !x || !canRead(s,x)) throw Error('Sem autorização para reverter a decisão.');
    if(!String(reason || '').trim()) throw Error('Indique um motivo para a reversão.');
    if(!['APROVADO','RECUSADO'].includes(norm(x.status))) throw Error('Não existe uma decisão a reverter.');
    const before=snapshot(x);
    if(change(x) && norm(x.status)==='APROVADO') {
      const original=s.leave.find(v=>String(v.id)===String(x.changeOf));
      if(!original || original.revision!==x.appliedRevision || JSON.stringify(days(original))!==JSON.stringify(x.resultDays)) throw Error('Existem alterações posteriores; crie um novo reagendamento.');
      for(const v of s.leave) if(v.id!==original.id && owner(v)===owner(original) && !change(v) && active(v) && days(v).some(d=>x.before.days.includes(d))) throw Error('Os dias originais já têm outra ausência; crie um novo reagendamento.');
      preserve(original,snapshot(original),reason,String(s.currentUser));setDays(original,x.before.days);original.status=x.before.status;x.status='Revertido';
      audit(s,original,'Reagendamento revertido',reason,{changeId:x.id});
    } else {
      if(sick(x) && norm(x.status)==='APROVADO') for(const a of x.adjustments || []) {
        const v=s.leave.find(v=>v.id===a.id);if(!v || v.revision!==a.revision) throw Error('As férias ajustadas pela baixa foram alteradas; reveja os registos antes da reversão.');
        for(const other of s.leave) if(other.id!==v.id && other.id!==x.id && owner(other)===owner(v) && !change(other) && active(other) && days(other).some(d=>a.before.days.includes(d))) throw Error('Os dias a restaurar já têm outra ausência; reveja os registos.');
        preserve(v,snapshot(v),reason,String(s.currentUser));setDays(v,a.before.days);v.status=a.before.status;
      }
      x.status='Pendente';
    }
    for(const doc of s.employeeDocuments?.[owner(x)] || []) if(doc.leaveId===x.id) doc.status=x.status;
    preserve(x,before,reason,String(s.currentUser));x.reversedAt=new Date().toISOString();x.reversedBy=String(s.currentUser);x.reversalReason=String(reason).trim();audit(s,x,'Decisão revertida',reason,{before,after:snapshot(x)});notify(s,x,'Decisão revertida');write(s);return clone(x);
  }
  function editSick(id, start, end, reason) {
    const s=read(),x=(s.leave || []).find(v=>String(v.id)===String(id));
    if(!canReview(s) || !x || !canRead(s,x) || !sick(x)) throw Error('Sem autorização para alterar esta baixa.');
    if(!String(reason || '').trim()) throw Error('Indique o motivo da alteração.');
    range(start,end);const before=snapshot(x);
    if(norm(x.status)==='APROVADO') for(const a of x.adjustments || []) {
      const v=s.leave.find(v=>v.id===a.id);
      if(!v || v.revision!==a.revision) throw Error('As férias ajustadas foram alteradas; reveja os registos antes de editar a baixa.');
      for(const other of s.leave) if(other.id!==v.id && other.id!==x.id && owner(other)===owner(v) && !change(other) && active(other) && days(other).some(d=>a.before.days.includes(d) && !range(start,end).includes(d))) throw Error('Os dias a restaurar já têm outra ausência.');
      preserve(v,snapshot(v),reason,String(s.currentUser));setDays(v,a.before.days);v.status=a.before.status;
    }
    preserve(x,before,reason,String(s.currentUser));x.start=start;x.end=end;delete x.days;
    x.modifiedAt=new Date().toISOString();x.modifiedBy=String(s.currentUser);
    if(norm(x.status)==='APROVADO') approveSick(s,x);
    audit(s,x,'Baixa editada',reason,{before,after:snapshot(x)});notify(s,x,'Período da baixa alterado');write(s);return clone(x);
  }
  window.HRLeaveV4={read,person,owner,clinic,clinics,norm,change,vacation,sick,active,canRead,canReview,canTeam,canEdit,permission,date,range,days,workDays,working,holidays,balance,context,snapshot,requestChange,validateChange,createVacation,decide,reverse,editSick};
})();
