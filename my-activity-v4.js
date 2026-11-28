/* «A minha atividade» (Meu RH), com pesquisa por datas:
   - Médico/a e Técnico/a: consultas, técnicas e tratamentos realizados (fechos diários da Operação, só as linhas da própria pessoa).
   - Técnico/a, Administrativa e Administração: previsão do prémio de cada trimestre do período (mesmo cálculo do Financeiro):
     só lasers e material vendido, com a conta e o que falta para receber.
   - Técnico/a: sessões particulares de fisioterapia extra horário (fecho do dia) e a sua parte; sem sessões aparece 0. */
(function(){'use strict';
 const K='grupo_saude_v4_demo_2',E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const R=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}};
 const iso=d=>d.toISOString().slice(0,10),dmy=d=>E(String(d).split('-').reverse().join('/'));
 const sel={start:'',end:''};
 function me(s){const id=String(s.currentUser||''),u=(s.users||[]).find(x=>String(x.id)===id)||{};return{id,role:String(u.role||u.kind||''),name:u.name||''}}
 const N=role=>String(role||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
 function clinical(role){const r=N(role);return r.includes('MEDIC')||r.includes('TECNIC')}
 function bonusRole(role){const r=N(role);return r.includes('TECNIC')||r.startsWith('ADMINISTRATIV')||r==='ADMINISTRACAO'}
 const eur=c=>(Number(c||0)/100).toLocaleString('pt-PT',{style:'currency',currency:'EUR'});
 function quarters(start,end){const out=[];let y=Number(start.slice(0,4)),q=Math.floor((Number(start.slice(5,7))-1)/3)+1;const ey=Number(end.slice(0,4)),eq=Math.floor((Number(end.slice(5,7))-1)/3)+1;while((y<ey||y===ey&&q<=eq)&&out.length<12){out.push(y+'-Q'+q);q++;if(q>4){q=1;y++}}return out}
 const qLabel=q=>q.slice(5,7).replace('Q','')+'.º trimestre '+q.slice(0,4);
 /* Prémio possível por trimestre: só contam lasers e material vendido (o material inclui o vendido no site com o código do técnico).
    Mostra a conta (quantidade × valor) e o que falta para receber. */
 function bonus(s,id,start,end){const B=window.GSBonus;if(!B?.person)return[];const out=[];for(const q of quarters(start,end)){let p=null;try{p=B.person(s,q,id)}catch{p=null}if(!p)continue;const lines=p.lines||[],part=f=>{const ls=lines.filter(f),qty=ls.reduce((n,l)=>n+l.quantity,0),cents=ls.reduce((n,l)=>n+(l.totalCents||0),0),rates=[...new Set(ls.map(l=>l.rateCents).filter(x=>x!=null))];return{qty,cents,rate:rates.length===1?rates[0]:null}};out.push({quarter:q,group:p.group,approved:!!p.approved,finished:!!p.finished,units:p.units||0,possibleCents:p.grossCents||0,amountCents:p.amountCents||0,eligible:!!p.eligible,reasons:p.reasons||[],team:p.team,laser:part(l=>l.productId==='laser'),material:part(l=>l.productId!=='laser'),site:lines.filter(l=>l.source==='Marketplace').reduce((n,l)=>n+l.quantity,0)})}return out}
 /* Sem vendas no período o prémio aparece a 0 € (em vez de desaparecer). */
 function bonusOrZero(s,u,start,end){const l=bonus(s,u.id,start,end);if(l.length)return l;const r=N(u.role),group=r.includes('TECNIC')?'technician':r.startsWith('ADMINISTRATIV')?'administrative':'management',zero={qty:0,cents:0,rate:null};return quarters(start,end).map(q=>({quarter:q,group,approved:false,finished:false,units:0,possibleCents:0,amountCents:0,eligible:true,reasons:[],laser:zero,material:zero,site:0}))}
 function calc(name,x){return `<li><span>${E(name)}</span><b>${x.qty}${x.rate!=null?' × '+eur(x.rate):''} = ${eur(x.cents)}</b></li>`}
 function bonusHtml(list){if(!list.length)return'';return `<div class="my-activity-bonus"><h3>Prémio possível <span class="meta">(só lasers e material vendido)</span></h3>${list.map(b=>{const state=b.approved?'aprovado':b.finished?'por aprovar':'previsão — trimestre em curso';
  const detail=b.group==='technician'?`<ul class="my-activity-calc">${calc('Lasers',b.laser)}${calc('Material vendido'+(b.site?' (inclui '+b.site+' no site)':''),b.material)}</ul>`:b.group==='administrative'?`<p>Parte da clínica: ${b.units} lasers e material vendidos pelos técnicos × 0,25 €${b.team>1?' ÷ '+b.team+' administrativas':''}</p>`:`<p>Parte da Administração: ${b.units} lasers e material vendidos × 0,50 €${b.team>1?' ÷ '+b.team+' pessoas':''}</p>`;
  return `<article class="my-activity-prize${b.eligible?'':' warn'}" data-quarter="${E(b.quarter)}"><span class="meta">${E(qLabel(b.quarter))} · ${E(state)}</span><strong>${eur(b.eligible?b.amountCents:b.possibleCents)}</strong>${detail}${b.eligible?'':`<p class="meta">${b.possibleCents?'Só recebe se: ':''}${E(b.reasons.join(' · ')||'Condições por confirmar')}</p>`}</article>`}).join('')}<p class="meta">Calculado com as regras do prémio; o valor final é o aprovado no fim do trimestre.</p></div>`}
 /* Sessões particulares de fisioterapia extra horário (respondidas no fecho do dia): número, valor cobrado e parte do técnico. Sem sessões → 0. */
 function privateSessions(s,id,start,end){const out=[];for(const d of Object.values(s.days||{})){if(!d?.date||d.date<start||d.date>end)continue;for(const r of d.close?.privateSessions?.rows||[])if(String(r.employeeId)===id)out.push({date:d.date,valueCents:r.valueCents||0,percent:r.percent||0,techCents:r.techCents||0})}return out.sort((a,b)=>a.date.localeCompare(b.date))}
 function privateHtml(s,id,start,end){const list=privateSessions(s,id,start,end),total=list.reduce((n,x)=>n+x.techCents,0);return `<div class="my-activity-private" data-private-total="${total}"><h3>Sessões particulares extra horário</h3><p class="my-activity-total"><b>${list.length}</b> ${list.length===1?'sessão':'sessões'} · para si: <b>${eur(total)}</b></p>${list.length?`<ul class="my-activity-calc">${list.map(x=>`<li><span>${dmy(x.date)}</span><b>${eur(x.valueCents)} × ${String(x.percent).replace('.',',')}% = ${eur(x.techCents)}</b></li>`).join('')}</ul>`:'<p class="meta">Sem sessões particulares neste período.</p>'}</div>`}
 function label(g){const c=String(g.category||'').trim();if(c)return c;return g.kind==='doctor'?'Consultas':'Técnicas e tratamentos'}
 /* Totais por tipo de ato (categoria) e por mês, só das linhas da própria pessoa. */
 function compute(s,id,start,end){const C=window.GSOperationCore;if(!C?.statistics)return{rows:[],months:[]};const clinics=(s.clinics||[]).map(c=>String(c.id));let groups=[];try{groups=C.statistics(s,clinics,{start,end,period:'month',by:'professional'})}catch{groups=[]}
  const mine=groups.filter(g=>String(g.employeeId)===id),byCat=new Map(),byMonth=new Map();
  for(const g of mine){const k=label(g),a=byCat.get(k)||{tipo:k,marcadas:0,realizadas:0,faltas:0};a.marcadas+=g.finalBooked||0;a.realizadas+=g.done||0;a.faltas+=g.missed||0;byCat.set(k,a);const m=byMonth.get(g.period)||{mes:g.period,realizadas:0};m.realizadas+=g.done||0;byMonth.set(g.period,m)}
  return{rows:[...byCat.values()].sort((a,b)=>a.tipo.localeCompare(b.tipo,'pt')),months:[...byMonth.values()].sort((a,b)=>a.mes.localeCompare(b.mes))}}
 const mes=m=>{const [y,mm]=m.split('-');return['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][Number(mm)-1]+' '+y};
  function clinicalHtml(s,id,start,end){const {rows,months}=compute(s,id,start,end),total=rows.reduce((n,r)=>n+r.realizadas,0);
  const table=rows.length?`<div class="table-wrap"><table><thead><tr><th scope="col">Tipo</th><th scope="col">Realizadas</th><th scope="col">Marcadas</th><th scope="col">Faltas</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${E(r.tipo)}</td><td><b>${r.realizadas}</b></td><td>${r.marcadas}</td><td>${r.faltas}</td></tr>`).join('')}</tbody></table></div>${months.length>1?`<p class="meta">Por mês: ${months.map(m=>E(mes(m.mes))+' · '+m.realizadas).join(' &nbsp;|&nbsp; ')}</p>`:''}`:'<p class="meta">Sem atos registados neste período. Os números aparecem depois do fecho do dia na clínica.</p>';
  return `<p class="my-activity-total"><b>${total}</b> ${total===1?'ato realizado':'atos realizados'} entre ${dmy(start)} e ${dmy(end)}</p>${table}`}
 function html(s){const u=me(s),cl=clinical(u.role),bn=bonusRole(u.role);if(!cl&&!bn)return'';const now=new Date(),start=sel.start||iso(new Date(now.getFullYear(),now.getMonth(),1)),end=sel.end||iso(now);
  const intro=cl?'Consultas, técnicas e tratamentos que realizou, a partir dos fechos diários das clínicas.':'O seu prémio possível em cada trimestre do período escolhido (vendas dos técnicos que contam para o prémio).';
  return `<section class="card my-activity" id="myActivity" aria-labelledby="myActivityTitle"><div class="page-head"><div><h2 id="myActivityTitle">A minha atividade</h2><p class="meta">${intro}${cl&&bn?' Mostra também o prémio possível do trimestre.':''}</p></div></div>
  <form class="module-dashboard-filters" id="myActivityForm"><label>De<input type="date" id="myActStart" value="${E(start)}"></label><label>Até<input type="date" id="myActEnd" value="${E(end)}"></label><button type="submit" class="primary">Pesquisar</button></form>
  ${bn?bonusHtml(bonusOrZero(s,u,start,end)):''}${N(u.role).includes('TECNIC')?privateHtml(s,u.id,start,end):''}${cl?clinicalHtml(s,u.id,start,end):''}
  </section>`}
 function mount(){const host=document.getElementById('myhr');if(!host||!host.classList.contains('active'))return;const s=R(),markup=html(s),old=document.getElementById('myActivity');if(!markup){old?.remove();return}
  const box=document.createElement('div');box.innerHTML=markup;const next=box.firstElementChild;if(old){if(old.dataset.sig===markup.length+''+sel.start+sel.end)return;old.replaceWith(next)}else{const anchor=host.querySelector('#portalPersonalEntry')||host.querySelector('.page-head')||host.firstElementChild;anchor?anchor.after(next):host.prepend(next)}
  next.dataset.sig=markup.length+''+sel.start+sel.end;
  next.querySelector('#myActivityForm').addEventListener('submit',e=>{e.preventDefault();const a=next.querySelector('#myActStart').value,b=next.querySelector('#myActEnd').value;if(a&&b&&a>b){window.GSDialog?GSDialog.alert('A data «De» tem de ser anterior a «Até».'):alert('A data «De» tem de ser anterior a «Até».');return}sel.start=a;sel.end=b;document.getElementById('myActivity')?.remove();mount()})}
 let t=0;const run=()=>{clearTimeout(t);t=setTimeout(mount,120)};
 const start=()=>{new MutationObserver(run).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});document.addEventListener('gs:state-changed',run);run()};
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
 window.MyActivityV4={compute,bonus,privateSessions,mount};
})();
