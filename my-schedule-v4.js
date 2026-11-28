/* «O meu horário»: a semana do colaborador com as horas esperadas em cada dia.
   Fonte: escala da semana (por clínica); sem escala, o horário fixo da ficha RH; sem nenhum, aviso para falar com os RH.
   Mostra também feriados e ausências aprovadas (férias/baixa). Só leitura. */
(()=>{'use strict';if(window.MyScheduleV4)return;
const K='grupo_saude_v4_demo_2',C=()=>window.GSAttendanceCore;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const R=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}};
const hm=m=>Math.floor(m/60)+'h'+(m%60?String(m%60).padStart(2,'0'):'');
const WD=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
let monday=null;
const iso=d=>d.toISOString().slice(0,10);
function startOfWeek(dt){const d=new Date(Date.UTC(dt.getUTCFullYear(),dt.getUTCMonth(),dt.getUTCDate(),12));d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d}
function person(s){const id=String(s.currentUser||'');return{...(s.users||[]).find(u=>String(u.id)===id),...(s.employees||{})[id],id}}
function absence(s,id,d){return(s.leave||[]).find(x=>String(x.employeeId||x.userId||x.user)===id&&/^aprovad/i.test(String(x.status||''))&&((x.days||x.dates||[]).includes(d)||String(x.start||'')<=d&&String(x.end||x.start||'')>=d))}
/* um dia: tenta a escala de cada clínica do colaborador; depois a ficha */
function day(s,p,d){const core=C(),clinics=core?core.assigned(p):[],ab=absence(s,p.id,d);let hol='';try{for(const cid of clinics.length?clinics:['']){const h=core.holidays(s,cid,Number(d.slice(0,4)));if(h?.get?.(d)){hol=h.get(d);break}}}catch{}
 for(const cid of clinics.length?clinics:['']){try{const v=core.schedule(s,p,cid,d),rd=s.monthlyRosters?.[d.slice(0,7)+'|'+cid]?.[p.id]?.days||{},fromRoster=(rd[d]??rd[d.slice(8)]??rd[Number(d.slice(8))])!==undefined;return{d,cid,off:v.off,start:v.startTime,end:v.endTime,lunch:v.lunchStart?v.lunchStart+'–'+v.lunchEnd:'',minutes:ab||hol?0:v.expectedMinutes,source:fromRoster?'Escala':'Ficha RH',absence:ab?.type||'',holiday:hol}}catch(e){if(!/não configurado/.test(e.message))return{d,error:e.message,absence:ab?.type||'',holiday:hol,minutes:0}}}
 return{d,none:true,absence:ab?.type||'',holiday:hol,minutes:0}}
function render(){const s=R(),p=person(s),body=document.getElementById('modalBody');if(!body)return;const days=[...Array(7)].map((_,i)=>day(s,p,iso(new Date(monday.getTime()+i*864e5)))),today=iso(new Date()),clinicName=id=>(s.clinics||[]).find(c=>String(c.id)===String(id))?.name||'';
 const none=days.every(x=>x.none),total=days.reduce((n,x)=>n+(x.minutes||0),0);
 const row=x=>{const dt=new Date(x.d+'T12:00:00Z'),label=WD[dt.getUTCDay()]+', '+x.d.slice(8)+'/'+x.d.slice(5,7);let main,cls='';if(x.absence){main=E(x.absence);cls='ms-away'}else if(x.holiday){main='Feriado · '+E(x.holiday);cls='ms-off'}else if(x.off){main='Folga';cls='ms-off'}else if(x.none){main='Sem horário';cls='ms-none'}else if(x.error){main=E(x.error);cls='ms-none'}else main=E(x.start)+' – '+E(x.end)+(x.lunch?' <small>· almoço '+E(x.lunch)+'</small>':'');
  return`<div class="ms-day ${cls}${x.d===today?' ms-today':''}" data-ms-day="${x.d}"><div><b>${E(label)}</b>${x.cid&&!x.none&&!x.off?`<small>${E(clinicName(x.cid))} · ${E(x.source||'')}</small>`:''}</div><div class="ms-time">${main}</div><div class="ms-hours">${x.minutes?hm(x.minutes):'—'}</div></div>`};
 const sun=new Date(monday.getTime()+6*864e5);
 body.innerHTML=`<p class="meta">O horário que lhe calha nesta semana e as horas esperadas em cada dia.</p><div class="ms-nav"><button type="button" class="secondary" data-ms-week="-1" aria-label="Semana anterior">‹</button><b>Semana de ${iso(monday).slice(8)}/${iso(monday).slice(5,7)} a ${iso(sun).slice(8)}/${iso(sun).slice(5,7)}</b><button type="button" class="secondary" data-ms-week="1" aria-label="Semana seguinte">›</button></div>${none?'<p class="notice" data-ms-empty>Não tem horário definido nesta semana. Ou trabalha em horário flexível, ou o seu horário ainda está por registar: fale com os Recursos Humanos.</p>':''}<div class="ms-week">${days.map(row).join('')}</div><p class="ms-total">Total esperado na semana: <b data-ms-total>${hm(total)}</b></p>`}
function open(){monday=startOfWeek(new Date());document.getElementById('modalTitle').textContent='O meu horário';const m=document.getElementById('modal');document.getElementById('modalBody').innerHTML='';if(!m.open)m.showModal();render()}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-ms-week]');if(!b||!monday)return;e.preventDefault();monday=new Date(monday.getTime()+Number(b.dataset.msWeek)*7*864e5);render()});
const css=document.createElement('style');css.textContent='.ms-nav{display:flex;align-items:center;gap:10px;margin:8px 0}.ms-nav button{min-width:40px;min-height:40px}.ms-week{display:grid;gap:6px}.ms-day{display:grid;grid-template-columns:minmax(120px,1.2fr) 2fr 70px;gap:8px;align-items:center;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface,#fff)}.ms-day small{display:block;color:var(--muted);font-size:.72rem}.ms-hours{text-align:right;font-weight:700}.ms-off{background:var(--surface-subtle)}.ms-away{border-color:var(--success);background:var(--success-bg)}.ms-none{color:var(--muted)}.ms-today{box-shadow:inset 4px 0 0 var(--accent)}.ms-total{text-align:right;margin-top:10px}@media(max-width:560px){.ms-day{grid-template-columns:1fr auto}.ms-time{grid-column:1/-1;order:3}}';document.head.appendChild(css);
window.MyScheduleV4={open,day};
})();
