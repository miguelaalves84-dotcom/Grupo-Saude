/* V4 — «Assistente Grupo Saúde» no Chat: avisa as tarefas obrigatórias do dia, uma mensagem por tarefa por dia,
   com ligação direta. As mensagens são calculadas a partir das tarefas da clínica (não são gravadas): quando uma
   administrativa conclui a tarefa, todas as administrativas da clínica veem «Realizada por … às …» ao mesmo tempo.
   Quem recebe: administrativas de serviço hoje nessa clínica (sem escala configurada → todas as da clínica).
   Atraso de mais de 1 hora depois da hora-limite → a Administração e o CEO também recebem. */
(function(root,factory){const api=factory(typeof module==='object'?require('./operation-core-v4'):root.GSOperationCore,typeof module==='object'?require('./administrative-rosters-core-v4'):root.GSAdministrativeRosters);if(typeof module==='object')module.exports=api;else root.GSChatAssistant=api})(typeof globalThis!=='undefined'?globalThis:this,(OD,R)=>{'use strict';
const norm=x=>String(x||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().trim();
const lisbon=iso=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso)).map(x=>[x.type,x.value]));return{date:`${p.year}-${p.month}-${p.day}`,hm:`${p.hour}:${p.minute}`,dow:new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`).getUTCDay()}};
const minutes=hm=>{const m=/^(\d{1,2}):(\d{2})$/.exec(String(hm||''));return m?Number(m[1])*60+Number(m[2]):null};
const people=s=>{const out=new Map();for(const u of [...(s.users||[]),...Object.values(s.employees||{})])if(u&&u.id!=null&&!out.has(String(u.id)))out.set(String(u.id),u);return [...out.values()]};
const clinicIds=p=>[...new Set([...(p.clinics||[]),...(p.clinicIds||[]),p.clinic,p.clinicId].filter(Boolean).map(String))];
const isAdmin=p=>norm(p.role)==='ADMINISTRATIVA',isManager=p=>['CEO','ADMINISTRACAO'].includes(norm(p.role));
/* De serviço hoje: a escala diz que trabalha; sem escala configurada conta como de serviço. */
function onDuty(s,p,cid,date){if(!R?.effective)return true;try{const e=R.effective(s,p,cid,date);if(e?.unconfigured)return true;return !e?.off}catch{return true}}
/* A clínica trabalha hoje: o dia já foi aberto, ou há administrativas de serviço segundo a escala (sem escala: dias úteis). */
function clinicWorks(s,cid,date,dow){if(s.days?.[date+'_'+cid])return true;const admins=people(s).filter(p=>p.active!==false&&isAdmin(p)&&clinicIds(p).includes(cid));let configured=false;for(const p of admins){try{const e=R?.effective?.(s,p,cid,date);if(e&&!e.unconfigured){configured=true;if(!e.off)return true}}catch{}}return !configured&&dow>=1&&dow<=5}
function dayStub(s,cid,date){return s.days?.[date+'_'+cid]||{date,clinic:cid,open:{saved:false,professionals:[]},close:{saved:false,professionals:[]},taskStatus:{},history:[],pendingRows:[],indicators:{}}}
/* Tarefas obrigatórias de uma clínica num dia, com estado partilhado. */
function clinicTasks(s,cid,date,hm){const day=dayStub(s,cid,date),exists=!!s.days?.[date+'_'+cid];let configured=[];try{configured=OD.configuredTasks(s,cid,undefined,day).filter(t=>t.required&&t.active!==false)}catch{return[]}
 let pending=null;if(exists){try{pending=OD.pendingTasks(s,day)}catch{pending=null}}
 const pendingToday=new Set((pending||[]).filter(t=>t.sourceDate===date).map(t=>t.id)),now=minutes(hm),items=[];
 for(const t of configured){const done=exists&&pending?!pendingToday.has(t.id):false,st=day.taskStatus?.[t.id]||{},dl=minutes(t.deadline);items.push({id:[date,cid,t.id].join('|'),clinicId:cid,date,taskId:t.id,name:t.name,phase:t.phase,deadline:t.deadline||'',status:done?'done':'todo',doneBy:done?(st.by||''):'',doneAt:done?(st.at||''):'',overdue:!done&&dl!==null&&now!==null&&now>dl,escalate:!done&&dl!==null&&now!==null&&now>dl+60})}
 for(const t of (pending||[]).filter(t=>t.sourceDate<date&&t.required))items.push({id:[t.sourceDate,cid,t.id].join('|'),clinicId:cid,date:t.sourceDate,taskId:t.id,name:t.name,phase:t.phase,deadline:t.deadline||'',status:'todo',doneBy:'',doneAt:'',overdue:true,escalate:true,previous:true});
 return items}
/* Mensagens do assistente para um colaborador. */
function messages(s,userId,nowIso=new Date().toISOString()){const p=people(s).find(x=>String(x.id)===String(userId));if(!p||p.active===false)return[];const {date,hm,dow}=lisbon(nowIso),names=new Map((s.clinics||[]).map(c=>[String(c.id),c.name])),out=[];
 const activeClinics=(s.clinics||[]).filter(c=>c.active!==false&&c.operational!==false&&!c.virtual).map(c=>String(c.id));
 if(isAdmin(p)){for(const cid of clinicIds(p).filter(c=>activeClinics.includes(c))){if(!clinicWorks(s,cid,date,dow)||!onDuty(s,p,cid,date))continue;for(const it of clinicTasks(s,cid,date,hm))out.push({...it,clinicName:names.get(cid)||cid,kind:'task'})}}
 if(isManager(p)){const mine=norm(p.role)==='CEO'?activeClinics:clinicIds(p).filter(c=>activeClinics.includes(c));for(const cid of mine){if(!clinicWorks(s,cid,date,dow))continue;for(const it of clinicTasks(s,cid,date,hm))if(it.escalate)out.push({...it,clinicName:names.get(cid)||cid,kind:'escalation'})}}
 return out.sort((a,b)=>(a.status==='done')-(b.status==='done')||String(b.date).localeCompare(String(a.date))||String(a.deadline||'99').localeCompare(String(b.deadline||'99'))||String(a.clinicName).localeCompare(String(b.clinicName)))}
const api={messages,clinicTasks,onDuty,clinicWorks,lisbon};
/* ---------- Ecrã (só no navegador) ---------- */
if(typeof document==='undefined')return api;
const K='grupo_saude_v4_demo_2',E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}};
const me=s=>String(s.ceoViewingAs||s.currentUser||'');
const readKey=uid=>'gs-assistant-read:'+uid;
const readSet=uid=>{try{return new Set(JSON.parse(localStorage.getItem(readKey(uid))||'[]'))}catch{return new Set()}};
const markRead=(uid,ids)=>{try{const set=readSet(uid);for(const id of ids)set.add(id);localStorage.setItem(readKey(uid),JSON.stringify([...set].slice(-800)))}catch{}};
const nowIso=()=>typeof GSClock!=='undefined'&&GSClock.iso?GSClock.iso():new Date().toISOString();
const who=(s,id)=>people(s).find(p=>String(p.id)===String(id))?.name||id||'';
const hhmm=iso=>iso?new Date(iso).toLocaleTimeString('pt-PT',{timeZone:'Europe/Lisbon',hour:'2-digit',minute:'2-digit'}):'';
const ddmm=d=>String(d).split('-').reverse().slice(0,2).join('/');
function current(){const s=state(),uid=me(s);return{s,uid,list:uid?messages(s,uid,nowIso()):[]}}
function unread(){const {uid,list}=current(),r=readSet(uid);return list.filter(m=>m.status==='todo'&&!r.has(m.id+'|'+m.kind)).length}
function bubble(s,m){const done=m.status==='done',when=m.deadline?' — até às '+E(m.deadline):'',head=m.kind==='escalation'?'⚠ Atrasada há mais de 1 hora':m.previous?'Pendente de '+ddmm(m.date):m.overdue?'Passou a hora-limite':'Tarefa de hoje';
 return `<article class="assistant-msg ${done?'is-done':''} ${m.kind==='escalation'?'is-escalation':''}" data-assistant-msg="${E(m.id)}"><p class="assistant-head">${E(head)} · <b>${E(m.clinicName)}</b></p><p class="assistant-text">${E(m.name)}${when}</p>${done?`<p class="assistant-done" role="status">✓ Realizada${m.doneBy?' por '+E(who(s,m.doneBy)):''}${m.doneAt?' às '+E(hhmm(m.doneAt)):''}</p>`:`<button type="button" class="primary assistant-go" data-assistant-go="${E(m.id)}">Abrir tarefa</button>`}</article>`}
function open(){const {s,uid,list}=current();let d=document.getElementById('assistantDialog');if(!d){d=document.createElement('dialog');d.id='assistantDialog';d.className='assistant-dialog';d.setAttribute('aria-labelledby','assistantTitle');document.body.appendChild(d)}
 const todo=list.filter(m=>m.status==='todo').length;
 d.innerHTML=`<header class="assistant-top"><span class="chat-avatar" aria-hidden="true">🤖</span><div><h2 id="assistantTitle">Assistente Grupo Saúde</h2><small>${todo?todo+' tarefa(s) por fazer':'Tudo feito por agora'}</small></div><button type="button" class="chat-icon-button" data-assistant-close aria-label="Fechar">✕</button></header><div class="assistant-body">${list.length?list.map(m=>bubble(s,m)).join(''):'<p class="chat-empty">Sem tarefas obrigatórias para si neste momento.</p>'}</div><p class="assistant-note">Uma mensagem por tarefa por dia. Quando alguém da clínica a conclui, fica «Realizada» para todos.</p>`;
 d.querySelector('[data-assistant-close]').onclick=()=>d.close();
 d.querySelectorAll('[data-assistant-go]').forEach(b=>b.onclick=()=>{const m=list.find(x=>x.id===b.dataset.assistantGo);if(!m)return;d.close();go(m)});
 if(!d.open)d.showModal();markRead(uid,list.map(m=>m.id+'|'+m.kind));refreshEntry()}
function go(m){try{const s=state();s.opClinic=m.clinicId;s.opDate=m.date;s.opPhase=m.phase==='close'?'close':m.phase==='open'?'open':'live';localStorage.setItem(K,JSON.stringify(s));window.App?.renderAll?.();window.App?.showView?.('operation');setTimeout(()=>{const el=[...document.querySelectorAll('.task-row b')].find(b=>b.textContent.trim()===m.name);el?.closest('.task-row')?.scrollIntoView({block:'center'});el?.closest('.task-row')?.classList.add('assistant-target')},300)}catch{}}
function entryHtml(){const {list}=current(),n=unread(),todo=list.filter(m=>m.status==='todo');return `<span class="chat-avatar assistant-avatar" aria-hidden="true">🤖</span><span class="chat-conversation-info"><span class="chat-conversation-title"><b>Assistente Grupo Saúde</b></span><span class="chat-conversation-preview">${todo.length?E(todo[0].name)+(todo.length>1?' (+'+(todo.length-1)+')':''):'Tudo feito por agora'}</span></span>${n?`<span class="chat-unread" aria-label="${n} por ler">${n}</span>`:''}`}
function refreshEntry(){const b=document.getElementById('assistantEntry');if(b)b.innerHTML=entryHtml();const nav=document.querySelector('[data-assistant-badge]');if(nav)nav.textContent=unread()||''}
function mount(){const list=document.querySelector('#chatContent .chat-conversation-list');if(!list||list.querySelector('#assistantEntry'))return;const {uid}=current();if(!uid)return;const b=document.createElement('button');b.type='button';b.id='assistantEntry';b.className='conversation assistant-entry';b.innerHTML=entryHtml();b.onclick=open;list.prepend(b)}
new MutationObserver(()=>mount()).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('storage',e=>{if(e.key===K)refreshEntry()});setInterval(refreshEntry,60000);
const css=document.createElement('style');css.textContent=`
.assistant-entry{border-left:3px solid var(--primary,#0b6e4f)}.assistant-avatar{background:color-mix(in srgb,var(--primary,#0b6e4f) 18%,transparent)}
.assistant-dialog{width:min(560px,calc(100vw - 32px));max-height:min(80vh,720px);padding:0;border:0;border-radius:16px;background:var(--surface,#fff);color:var(--text,#1d2733)}
.assistant-dialog::backdrop{background:rgba(0,0,0,.35)}.assistant-top{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line,#dce5e7)}.assistant-top h2{margin:0;font-size:1.05rem}.assistant-top>div{flex:1}
.assistant-body{padding:12px 16px;overflow:auto;max-height:calc(min(80vh,720px) - 130px);display:flex;flex-direction:column;gap:10px}
.assistant-msg{background:var(--surface-2,#eef4f3);border-radius:12px 12px 12px 4px;padding:10px 12px;max-width:92%}.assistant-msg p{margin:0 0 6px}.assistant-head{font-size:12px;color:var(--muted,#5b6b70)}
.assistant-msg.is-done{opacity:.75}.assistant-done{color:#17602f;font-weight:700}.assistant-msg.is-escalation{border-left:3px solid #b71c1c}.assistant-note{padding:0 16px 12px;font-size:12px;color:var(--muted,#5b6b70)}
.task-row.assistant-target{outline:3px solid var(--primary,#0b6e4f);outline-offset:2px}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .assistant-done{color:#9be3b0}}:root[data-theme=dark] .assistant-done{color:#9be3b0}`;
document.head.appendChild(css);
return Object.assign(api,{open,unread,mount,_go:go});
});
