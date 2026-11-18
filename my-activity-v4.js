/* «A minha atividade» (Meu RH): cada médico/técnico vê quantas consultas, técnicas e tratamentos realizou,
   com pesquisa por datas. Vem dos fechos diários da Operação (só as linhas da própria pessoa). */
(function(){'use strict';
 const K='grupo_saude_v4_demo_2',E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const R=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}};
 const iso=d=>d.toISOString().slice(0,10);
 const sel={start:'',end:''};
 function me(s){const id=String(s.currentUser||''),u=(s.users||[]).find(x=>String(x.id)===id)||{};return{id,role:String(u.role||u.kind||''),name:u.name||''}}
 function clinical(role){const r=role.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();return r.includes('MEDIC')||r.includes('TECNIC')}
 function label(g){const c=String(g.category||'').trim();if(c)return c;return g.kind==='doctor'?'Consultas':'Técnicas e tratamentos'}
 /* Totais por tipo de ato (categoria) e por mês, só das linhas da própria pessoa. */
 function compute(s,id,start,end){const C=window.GSOperationCore;if(!C?.statistics)return{rows:[],months:[]};const clinics=(s.clinics||[]).map(c=>String(c.id));let groups=[];try{groups=C.statistics(s,clinics,{start,end,period:'month',by:'professional'})}catch{groups=[]}
  const mine=groups.filter(g=>String(g.employeeId)===id),byCat=new Map(),byMonth=new Map();
  for(const g of mine){const k=label(g),a=byCat.get(k)||{tipo:k,marcadas:0,realizadas:0,faltas:0};a.marcadas+=g.finalBooked||0;a.realizadas+=g.done||0;a.faltas+=g.missed||0;byCat.set(k,a);const m=byMonth.get(g.period)||{mes:g.period,realizadas:0};m.realizadas+=g.done||0;byMonth.set(g.period,m)}
  return{rows:[...byCat.values()].sort((a,b)=>a.tipo.localeCompare(b.tipo,'pt')),months:[...byMonth.values()].sort((a,b)=>a.mes.localeCompare(b.mes))}}
 function html(s){const u=me(s);if(!clinical(u.role))return'';const now=new Date(),start=sel.start||iso(new Date(now.getFullYear(),now.getMonth(),1)),end=sel.end||iso(now);const {rows,months}=compute(s,u.id,start,end),total=rows.reduce((n,r)=>n+r.realizadas,0);
  const mes=m=>{const [y,mm]=m.split('-');return['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][Number(mm)-1]+' '+y};
  return `<section class="card my-activity" id="myActivity" aria-labelledby="myActivityTitle"><div class="page-head"><div><h2 id="myActivityTitle">A minha atividade</h2><p class="meta">Consultas, técnicas e tratamentos que realizou, a partir dos fechos diários das clínicas.</p></div></div>
  <form class="module-dashboard-filters" id="myActivityForm"><label>De<input type="date" id="myActStart" value="${E(start)}"></label><label>Até<input type="date" id="myActEnd" value="${E(end)}"></label><button type="submit" class="primary">Pesquisar</button></form>
  <p class="my-activity-total"><b>${total}</b> ${total===1?'ato realizado':'atos realizados'} entre ${E(start.split('-').reverse().join('/'))} e ${E(end.split('-').reverse().join('/'))}</p>
  ${rows.length?`<div class="table-wrap"><table><thead><tr><th scope="col">Tipo</th><th scope="col">Realizadas</th><th scope="col">Marcadas</th><th scope="col">Faltas</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${E(r.tipo)}</td><td><b>${r.realizadas}</b></td><td>${r.marcadas}</td><td>${r.faltas}</td></tr>`).join('')}</tbody></table></div>${months.length>1?`<p class="meta">Por mês: ${months.map(m=>E(mes(m.mes))+' · '+m.realizadas).join(' &nbsp;|&nbsp; ')}</p>`:''}`:'<p class="meta">Sem atos registados neste período. Os números aparecem depois do fecho do dia na clínica.</p>'}
  </section>`}
 function mount(){const host=document.getElementById('myhr');if(!host||!host.classList.contains('active'))return;const s=R(),markup=html(s),old=document.getElementById('myActivity');if(!markup){old?.remove();return}
  const box=document.createElement('div');box.innerHTML=markup;const next=box.firstElementChild;if(old){if(old.dataset.sig===markup.length+''+sel.start+sel.end)return;old.replaceWith(next)}else{const anchor=host.querySelector('#portalPersonalEntry')||host.querySelector('.page-head')||host.firstElementChild;anchor?anchor.after(next):host.prepend(next)}
  next.dataset.sig=markup.length+''+sel.start+sel.end;
  next.querySelector('#myActivityForm').addEventListener('submit',e=>{e.preventDefault();const a=next.querySelector('#myActStart').value,b=next.querySelector('#myActEnd').value;if(a&&b&&a>b){window.GSDialog?GSDialog.alert('A data «De» tem de ser anterior a «Até».'):alert('A data «De» tem de ser anterior a «Até».');return}sel.start=a;sel.end=b;document.getElementById('myActivity')?.remove();mount()})}
 let t=0;const run=()=>{clearTimeout(t);t=setTimeout(mount,120)};
 const start=()=>{new MutationObserver(run).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});document.addEventListener('gs:state-changed',run);run()};
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
 window.MyActivityV4={compute,mount};
})();
