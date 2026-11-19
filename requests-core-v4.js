/* Pedidos de consulta — regras do call center e das administrativas (sem IO; reutiliza state.requests).
   Origem do contacto, motivo de não marcação, autor e perfil, deteção de duplicados por telefone,
   registo «+1 consulta marcada» com totais por hora e indicadores para a direção. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GSRequestsCore=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{'use strict';
const CHANNELS=['WhatsApp','Telefone','Instagram','Facebook','Google','Website','Recomendação','Presencial','Já é utente','Outro'];
const REASONS=['Sem vaga na especialidade','Sem médico da especialidade','Especialidade não existe na clínica','Utente vai decidir','Preço / acordo','Outro'];
const UNMET=REASONS.slice(0,3);// procura que a clínica não conseguiu servir
const MAX_ATTEMPTS=3;
const fail=m=>Object.assign(Error(m),{requestsDomain:true});
const norm=x=>String(x||'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toUpperCase();
function roleLabel(role){const r=norm(role);return r==='CALL CENTER'?'Call Center':r==='ADMINISTRATIVA'?'Administrativa':r==='ADMINISTRACAO'?'Administração':r==='CEO'?'CEO':String(role||'—')}
function person(s,id){const k=String(id||'');return(s.users||[]).find(u=>String(u.id)===k)||s.employees?.[k]||null}
function author(s,id){const p=person(s,id);return{id:String(id||''),name:p?.name||String(id||'—'),role:roleLabel(p?.role||p?.kind)}}
const digits=p=>String(p||'').replace(/\D/g,'').slice(-9);
const mail=e=>String(e||'').trim().toLowerCase();
const validEmail=e=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail(e));
function duplicates(requests,phone,exceptId,email){const d=digits(phone),m=mail(email);if(d.length<9&&!validEmail(m))return[];return(requests||[]).filter(r=>String(r.id)!==String(exceptId||'')&&!r.deleted&&((d.length>=9&&digits(r.phone)===d)||(validEmail(m)&&mail(r.email)===m)))}
/* Para voltar a contactar é preciso telemóvel (9 dígitos) ou email válido. */
function contact(phone,email){const p=String(phone||'').trim(),e=mail(email);if(!p&&!e)throw fail('Indique o telemóvel ou o email do utente para o voltar a contactar.');if(p&&digits(p).length<9)throw fail('Telemóvel inválido: indique pelo menos 9 dígitos.');if(e&&!validEmail(e))throw fail('Email inválido.');return{phone:p,email:e}}
/* Lista «Por marcar»: tudo o que ainda não foi marcado e não foi eliminado pela direção. */
const pending=r=>!!r&&!r.deleted&&r.stage!=='Marcado';
const canDelete=role=>['CEO','ADMINISTRACAO'].includes(norm(role));
function remove(r,ctx,reason){if(!canDelete(ctx.role))throw fail('Só o CEO ou a Administração podem eliminar pedidos por marcar.');if(!pending(r))throw fail('Este pedido já não está na lista por marcar.');const why=String(reason||'').trim();if(why.length<3)throw fail('Indique o motivo da eliminação.');return{...r,deleted:{at:ctx.at,by:String(ctx.actor),role:roleLabel(ctx.role),reason:why.slice(0,300)},revision:(r.revision||0)+1}}
/* Trabalho por clínica de um perfil (ex.: Administrativas): pedidos, marcações, conversão, 1.º contacto e por marcar. */
function clinicWork(s,requests,bookings,f={},role){const rows=new Map(),get=c=>{const k=String(c);if(!rows.has(k))rows.set(k,{clinic:k,people:new Set(),requests:0,marked:0,booked:0,times:[],pending:0});return rows.get(k)};
 for(const r of requests||[]){if(r.deleted||!inRange(r.created||r.createdAt,f))continue;if(role&&r.createdByRole!==role)continue;const x=get(r.clinic);x.requests++;if(r.stage==='Marcado')x.marked++;if(pending(r))x.pending++;const t=firstContactMinutes(r);if(t!==null)x.times.push(t);if(r.createdBy)x.people.add(author(s,r.createdBy).name)}
 for(const b of bookings||[]){if(!inRange(b.at,f))continue;if(role&&b.role!==role)continue;const x=get(b.clinic);x.booked++;x.people.add(author(s,b.by).name)}
 return[...rows.values()].map(x=>({clinic:x.clinic,people:[...x.people].sort(),requests:x.requests,booked:x.booked,conversion:x.requests?Math.round(x.marked/x.requests*100):null,firstContactMinutes:x.times.length?Math.round(x.times.reduce((a,b)=>a+b,0)/x.times.length):null,pending:x.pending})).sort((a,b)=>b.booked-a.booked||b.requests-a.requests)}
const day=v=>String(v||'').slice(0,10);
const inRange=(v,f)=>{const d=day(v);return(!f.start||d>=f.start)&&(!f.end||d<=f.end)};
const hourOf=v=>{const t=new Date(v);return Number.isNaN(t.getTime())?null:t.getHours()};
function validChannel(x){if(!CHANNELS.includes(x))throw fail('Indique como o utente chegou até nós.');return x}
function validReason(x){if(x&&!REASONS.includes(x))throw fail('Motivo de não marcação inválido.');return x||''}
/* Novo registo de marcação («+1»). Hora, autor e perfil vêm do contexto, nunca do formulário. */
function booking(s,ctx,b){
 const clinic=String(b.clinic||'');if(!clinic)throw fail('Escolha a clínica.');
 if(ctx.canClinic&&!ctx.canClinic(clinic))throw fail('Clínica não autorizada.');
 const specialty=String(b.specialty||'').trim();if(!specialty)throw fail('Escolha a especialidade.');
 const a=author(s,ctx.actor);
 return{id:ctx.id,at:ctx.at,by:a.id,byName:a.name,role:a.role,clinic,specialty,source:validChannel(b.source),requestId:b.requestId?String(b.requestId):''};
}
/* Só o próprio operador corrige, e só dentro da mesma hora. */
function canUndo(entry,ctx){return !!entry&&String(entry.by)===String(ctx.actor)&&day(entry.at)===day(ctx.at)&&hourOf(entry.at)===hourOf(ctx.at)}
function hourly(bookings,requests,date,f={}){
 const rows=[];for(let h=8;h<=20;h++)rows.push({hour:h,label:String(h).padStart(2,'0')+'h–'+String(h+1).padStart(2,'0')+'h',booked:0,requests:0});
 const match=x=>(!f.by||String(x.by||x.createdBy)===String(f.by))&&(!f.clinic||String(x.clinic)===String(f.clinic));
 for(const b of bookings||[])if(day(b.at)===date&&match(b)){const r=rows.find(x=>x.hour===hourOf(b.at));if(r)r.booked++}
 for(const q of requests||[]){const at=q.created||q.createdAt;if(day(at)===date&&match(q)){const r=rows.find(x=>x.hour===hourOf(at));if(r)r.requests++}}
 return rows;
}
/* Horas já terminadas (a partir das 9h, dia de hoje) sem nenhuma marcação registada pelo operador. */
function emptyHours(bookings,date,nowIso,by){const now=new Date(nowIso),h=now.getHours(),done=day(nowIso)===date?h:21;return hourly(bookings,[],date,{by}).filter(r=>r.hour>=9&&r.hour<Math.min(done,20)&&!r.booked).map(r=>r.label)}
function unmet(requests,f={}){
 const map=new Map();
 for(const r of requests||[]){if(r.deleted||!UNMET.includes(r.unmetReason)||!inRange(r.created||r.createdAt,f))continue;
  const key=String(r.clinic)+'|'+(r.specialty||'—');const row=map.get(key)||{clinic:String(r.clinic),specialty:r.specialty||'—',total:0,recovered:0,waiting:0};
  row[r.unmetReason]=(row[r.unmetReason]||0)+1;row.total++;if(r.stage==='Marcado')row.recovered++;else if(!['Recusou','Cancelado','Sem resposta'].includes(r.stage))row.waiting++;map.set(key,row)}
 return[...map.values()].sort((a,b)=>b.total-a.total||a.specialty.localeCompare(b.specialty));
}
const due=(r,todayIso)=>!r.deleted&&!!r.recontactAt&&r.stage!=='Marcado'&&day(r.recontactAt)<=day(todayIso);
function firstContactMinutes(r){const created=Date.parse(r.created||r.createdAt),first=(r.history||[]).map(h=>Date.parse(h.at)).filter(Number.isFinite).sort((a,b)=>a-b)[0];return Number.isFinite(created)&&Number.isFinite(first)&&first>=created?Math.round((first-created)/60000):null}
function topOf(list){const c=new Map();for(const x of list)if(x)c.set(x,(c.get(x)||0)+1);return[...c].sort((a,b)=>b[1]-a[1])[0]?.[0]||'—'}
function kpis(s,requests,bookings,f={}){
 const okR=r=>!r.deleted&&inRange(r.created||r.createdAt,f)&&(!f.clinic||String(r.clinic)===String(f.clinic))&&(!f.specialty||r.specialty===f.specialty)&&(!f.source||r.source===f.source)&&(!f.role||r.createdByRole===f.role);
 const okB=b=>inRange(b.at,f)&&(!f.clinic||String(b.clinic)===String(f.clinic))&&(!f.specialty||b.specialty===f.specialty)&&(!f.source||b.source===f.source)&&(!f.role||b.role===f.role);
 const rs=(requests||[]).filter(okR),bs=(bookings||[]).filter(okB),marked=rs.filter(r=>r.stage==='Marcado').length;
 const times=rs.map(firstContactMinutes).filter(x=>x!==null);
 const ops=new Map();
 for(const r of rs){const k=String(r.createdBy||r.owner||'');if(!k)continue;const o=ops.get(k)||{id:k,requests:0,marked:0,booked:0,sources:[]};o.requests++;if(r.stage==='Marcado')o.marked++;o.sources.push(r.source);ops.set(k,o)}
 for(const b of bs){const k=String(b.by);const o=ops.get(k)||{id:k,requests:0,marked:0,booked:0,sources:[]};o.booked++;o.sources.push(b.source);ops.set(k,o)}
 const operators=[...ops.values()].map(o=>{const a=author(s,o.id);return{id:o.id,name:a.name,role:a.role,requests:o.requests,booked:o.booked,conversion:o.requests?Math.round(o.marked/o.requests*100):null,topSource:topOf(o.sources)}}).sort((a,b)=>b.booked-a.booked||b.requests-a.requests);
 const group=(list,key)=>{const m=new Map();for(const x of list){const k=x[key]||'—';m.set(k,(m.get(k)||0)+1)}return[...m].sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count}))};
 return{requests:rs.length,booked:bs.length,conversion:rs.length?Math.round(marked/rs.length*100):null,firstContactMinutes:times.length?Math.round(times.reduce((a,b)=>a+b,0)/times.length):null,unmet:rs.filter(r=>UNMET.includes(r.unmetReason)&&r.stage!=='Marcado').length,operators,bySource:group(bs,'source'),bySpecialty:group(bs,'specialty'),byClinic:group(bs,'clinic'),byRole:group(bs,'role')};
}
/* RGPD — minimização: depois de marcada, a consulta deixa de precisar dos dados do utente.
   Mantém clínica, especialidade, médico, origem, motivo, autoria e datas; apaga identificação, contactos,
   observações, patologia e as notas/contactos antigos guardados no histórico. */
const PERSONAL=['phone','email','patientRef','patient_ref','notes','pathology'];
function anonymize(r,at){const x={...r,name:'Utente (dados apagados após marcação)',anonymizedAt:at};for(const k of PERSONAL)if(k in x)x[k]='';
 x.history=(r.history||[]).map(h=>{const{note,before,after,...rest}=h;return rest});return x}
const ref=r=>'pedido '+String(r?.id||'').slice(-6);
/* Funil dos pedidos de consulta: 4 fases. Pedidos vindos de redes sociais, WhatsApp, site ou API entram em «Novo pedido».
   Os marcados ficam visíveis 72 horas e depois os dados do utente são apagados (os números para os indicadores ficam). */
const STAGES=['Novo pedido','Sem profissional','Sem vaga','Marcado'];
const OUTCOMES=['Sem resposta','Recusou','Suspenso','Cancelado'];
const LEGACY_STAGES={'NOVO PEDIDO':'Novo pedido','PEDIDO DE CONSULTA':'Novo pedido','POR CONTACTAR':'Novo pedido','CONTACTADO':'Novo pedido','PROPOSTA DE CONSULTA':'Novo pedido','LISTA INTERNA':'Novo pedido','A AGUARDAR VAGA':'Sem vaga','SEM VAGA':'Sem vaga','SEM ESPECIALIDADE NA CLINICA':'Sem profissional','SEM PROFISSIONAL':'Sem profissional','MARCADO':'Marcado'};
const up=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
function stageForReason(reason){return reason==='Sem vaga na especialidade'?'Sem vaga':['Sem médico da especialidade','Especialidade não existe na clínica'].includes(reason)?'Sem profissional':'Novo pedido'}
function normalizeStage(stage){return LEGACY_STAGES[up(stage)]||stage||'Novo pedido'}
const BOOKED_TTL_HOURS=72;
function bookedExpired(r,nowMs){return normalizeStage(r?.stage)==='Marcado'&&!r.purgedAt&&!!r.completed&&nowMs-Date.parse(r.completed)>=BOOKED_TTL_HOURS*3600e3}
function purgeBooked(s,at){let n=0;s.requests=(s.requests||[]).map(r=>{if(!bookedExpired(r,Date.parse(at)))return r;n++;return{...anonymize(r,at),purgedAt:at}});return n}
function migrateStages(s){let n=0;for(const r of s.requests||[]){const next=normalizeStage(r.stage);if(next!==r.stage){(r.history||(r.history=[])).push({at:new Date().toISOString(),by:'sistema',from:r.stage,to:next,note:'Fase atualizada para o funil de 4 fases'});r.stage=next;n++}}return n}
function whatsappLink(phone){let d=String(phone||'').replace(/\D/g,'');if(d.length===9)d='351'+d;return d.length>=11?'https://wa.me/'+d:''}
return{STAGES,OUTCOMES,stageForReason,normalizeStage,BOOKED_TTL_HOURS,bookedExpired,purgeBooked,migrateStages,anonymize,ref,CHANNELS,REASONS,UNMET,MAX_ATTEMPTS,roleLabel,author,digits,duplicates,contact,validEmail,pending,canDelete,remove,clinicWork,validChannel,validReason,booking,canUndo,hourly,emptyHours,unmet,due,firstContactMinutes,kpis,whatsappLink};
});
