/* Fonte única do âmbito clínico e dos dados do Dashboard. */
(()=>{'use strict';
const K='grupo_saude_v4_demo_2',R=()=>JSON.parse(localStorage.getItem(K)||'{}'),N=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
const actor=(s=R())=>s.employees?.[s.currentUser]||(s.users||[]).find(x=>String(x.id)===String(s.currentUser))||{id:String(s.currentUser||''),role:'BASICO',active:false};
const role=(s=R())=>N(actor(s).role||actor(s).kind),isAdmin=(s=R())=>role(s)==='CEO';
const assigned=p=>[...new Set([...(p.clinics||[]),...(p.clinicIds||[]),p.clinic,p.clinicId].filter(Boolean).map(String))];
const activeClinics=s=>(s.clinics||[]).filter(c=>c.active!==false&&c.operational!==false&&!c.virtual&&c.id!=='administracao');
function clinics(s=R()){const p=actor(s);if(p.active===false)return[];const all=activeClinics(s);return(isAdmin(s)||role(s)==='CALL CENTER'?all:all.filter(c=>assigned(p).includes(String(c.id)))).map(c=>String(c.id))}
const canDashboard=s=>['CEO','ADMINISTRACAO'].includes(role(s))&&actor(s).active!==false&&!!window.RoleAccessAdminV4?.permission(s,'dashboard');
function canEmployee(id,s=R()){if(String(id)===String(s.currentUser))return actor(s).active!==false;if(!window.RoleAccessAdminV4?.permission(s,'hrManage'))return false;if(isAdmin(s))return true;const p=s.employees?.[id]||(s.users||[]).find(x=>String(x.id)===String(id));if(p?._new&&String(p._createdBy||'')===String(s.currentUser))return role(s)==='ADMINISTRACAO';return role(s)==='ADMINISTRACAO'&&assigned(p||{}).some(cid=>clinics(s).includes(cid))}
function canClinic(id,action,s=R()){if(!clinics(s).includes(String(id)))return false;if(action==='dashboard')return canDashboard(s);return isAdmin(s)||!!window.RoleAccessAdminV4?.permission(s,action)}
function dashboard(s=R(),filter={}){
 if(!canDashboard(s))throw Error('Sem autorização para consultar o Dashboard.');
 const permitted=clinics(s),selected=String(filter.clinicId||'');if(selected&&!permitted.includes(selected))throw Error('Clínica não autorizada ou inativa.');
 const ids=new Set(selected?[selected]:permitted),end=filter.end||new Date().toISOString().slice(0,10),start=filter.start||end;
 window.HRLeaveV4.date(start);window.HRLeaveV4.date(end);if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start>end||(+new Date(end)-+new Date(start))/864e5>366)throw Error('Selecione um período válido de até um ano.');
 const within=v=>String(v||'').slice(0,10)>=start&&String(v||'').slice(0,10)<=end;
 const days=Object.values(s.days||{}).filter(d=>ids.has(String(d.clinic||d.clinicId))&&within(d.date));
 const requests=(s.requests||[]).filter(r=>ids.has(String(r.clinic||r.clinicId)));
 const compare=activeClinics(s).filter(c=>ids.has(String(c.id))).map(c=>{const ds=days.filter(d=>String(d.clinic||d.clinicId)===String(c.id)),rs=requests.filter(r=>String(r.clinic||r.clinicId)===String(c.id));let consultations=0,treatments=0,plannedConsultations=0,plannedTreatments=0,done=0,pending=0;const indicators={};
 for(const d of ds){for(const p of d.open?.professionals||[])if(p.selected!==false){if(p.kind==='doctor')plannedConsultations+=Number(p.consults)||0;else plannedTreatments+=Number(p.consults)||0}for(const p of d.close?.professionals||[]){if(p.kind==='doctor')consultations+=Number(p.done)||0;else treatments+=Number(p.done)||0}
 const entries=Object.entries(d.taskStatus||{});const defined=(s.tasks||[]).filter(t=>t.active!==false&&(t.clinics||[]).some(id=>id==='all'||String(id)===String(c.id)));const total=Math.max(entries.length,defined.length);const completed=entries.filter(([,v])=>['done','Concluída','Concluida','Concluído','Concluido'].includes(typeof v==='string'?v:v.status)).length;done+=completed;pending+=Math.max(0,total-completed);
 for(const [id,v] of Object.entries(d.indicators||{}))indicators[id]=(indicators[id]||0)+(Number(v.current)||0)}
 const latest=ds.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0],operationalState=!latest?'Sem registo no período':latest.closed||latest.close?.saved?'Fechada':latest.open?.saved?'Aberta':'Abertura por concluir';return{clinicId:String(c.id),name:c.name,operationalState,consultations,treatments,plannedConsultations,plannedTreatments,newRequests:rs.filter(r=>within(r.created)).length,markedRequests:rs.filter(r=>r.stage==='Marcado'&&within(r.completed||r.created)).length,done,pending,opened:ds.filter(d=>d.open?.saved||d.openedAt||d.status==='Aberta').length,closed:ds.filter(d=>d.closed||d.close?.saved).length,indicators}});
 const totals={consultations:0,treatments:0,plannedConsultations:0,plannedTreatments:0,newRequests:0,markedRequests:0,done:0,pending:0,opened:0,closed:0};for(const c of compare)for(const k of Object.keys(totals))totals[k]+=c[k];
 const trend=[];for(let t=new Date(start+'T12:00:00Z');t<=new Date(end+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+1)){const date=t.toISOString().slice(0,10),ds=days.filter(d=>d.date===date);trend.push({date,requests:requests.filter(r=>String(r.created).slice(0,10)===date).length,consultations:ds.reduce((n,d)=>n+(d.close?.professionals||[]).filter(p=>p.kind==='doctor').reduce((m,p)=>m+(Number(p.done)||0),0),0),treatments:ds.reduce((n,d)=>n+(d.close?.professionals||[]).filter(p=>p.kind!=='doctor').reduce((m,p)=>m+(Number(p.done)||0),0),0)})}
 return{start,end,clinicId:selected,clinics:activeClinics(s).filter(c=>permitted.includes(String(c.id))).map(c=>({id:String(c.id),name:c.name})),totals,compare,trend,alerts:(s.alerts||[]).filter(a=>ids.has(String(a.clinic||a.clinicId))&&(!a.to||String(a.to)===String(s.currentUser))&&a.status!=='Resolvido').map(a=>({title:a.title,status:a.status}))};
}
function ensureAdministrationEntity(){const s=R();s.clinics||=[];if(!s.clinics.some(c=>c.id==='administracao')){s.clinics.push({id:'administracao',name:'Administração',active:true,entityType:'administration',operational:false,virtual:true});localStorage.setItem(K,JSON.stringify(s))}}
ensureAdministrationEntity();window.AccessScopeV4={actor,role,isAdmin,clinics,canEmployee,canClinic,canDashboard,dashboard,assigned,activeClinics,scope:s=>isAdmin(s)?'global':'assigned-clinics',ensureAdministrationEntity};
})();
