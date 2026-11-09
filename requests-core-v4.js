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
function duplicates(requests,phone,exceptId){const d=digits(phone);if(d.length<9)return[];return(requests||[]).filter(r=>String(r.id)!==String(exceptId||'')&&digits(r.phone)===d)}
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
 for(const r of requests||[]){if(!UNMET.includes(r.unmetReason)||!inRange(r.created||r.createdAt,f))continue;
  const key=String(r.clinic)+'|'+(r.specialty||'—');const row=map.get(key)||{clinic:String(r.clinic),specialty:r.specialty||'—',total:0,recovered:0,waiting:0};
  row[r.unmetReason]=(row[r.unmetReason]||0)+1;row.total++;if(r.stage==='Marcado')row.recovered++;else if(!['Recusou','Cancelado','Sem resposta'].includes(r.stage))row.waiting++;map.set(key,row)}
 return[...map.values()].sort((a,b)=>b.total-a.total||a.specialty.localeCompare(b.specialty));
}
const due=(r,todayIso)=>!!r.recontactAt&&r.stage!=='Marcado'&&day(r.recontactAt)<=day(todayIso);
function firstContactMinutes(r){const created=Date.parse(r.created||r.createdAt),first=(r.history||[]).map(h=>Date.parse(h.at)).filter(Number.isFinite).sort((a,b)=>a-b)[0];return Number.isFinite(created)&&Number.isFinite(first)&&first>=created?Math.round((first-created)/60000):null}
function topOf(list){const c=new Map();for(const x of list)if(x)c.set(x,(c.get(x)||0)+1);return[...c].sort((a,b)=>b[1]-a[1])[0]?.[0]||'—'}
function kpis(s,requests,bookings,f={}){
 const okR=r=>inRange(r.created||r.createdAt,f)&&(!f.clinic||String(r.clinic)===String(f.clinic))&&(!f.specialty||r.specialty===f.specialty)&&(!f.source||r.source===f.source)&&(!f.role||r.createdByRole===f.role);
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
function whatsappLink(phone){let d=String(phone||'').replace(/\D/g,'');if(d.length===9)d='351'+d;return d.length>=11?'https://wa.me/'+d:''}
return{CHANNELS,REASONS,UNMET,MAX_ATTEMPTS,roleLabel,author,digits,duplicates,validChannel,validReason,booking,canUndo,hourly,emptyHours,unmet,due,firstContactMinutes,kpis,whatsappLink};
});
