/* V4 — Caixa de candidaturas (gruposaude.rh) no ecrã Candidatos.
   Mostra: estado da ligação, última verificação, botão «Verificar agora», os 3 textos de email editáveis
   (agradecimento, entrevista, recusa) e o histórico do que foi enviado (com «Tentar de novo» nas falhas).
   O servidor lê a caixa e envia; aqui só se mostra e se guardam os textos (chave partilhada «rhMail»). */
(()=>{'use strict';if(window.RhMailboxV4)return;
const K='grupo_saude_v4_demo_2',E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KINDS=[['received','Agradecimento (CV recebido)'],['interview','Entrevista marcada'],['rejection','Recusa']],KIND=Object.fromEntries(KINDS);
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}},write=s=>{localStorage.setItem(K,JSON.stringify(s));try{window.GSServerSync?.push?.()}catch{}};
const can=()=>!!window.RoleAccessAdminV4?.can('hrManage');
const when=at=>{if(!at)return'—';const d=new Date(at);return isNaN(d)?E(at):d.toLocaleString('pt-PT',{timeZone:'Europe/Lisbon',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})};
let info=null,loading=null,tab='received',busy=false,autoAt=0,wasOpen=false;
async function status(force){if(info&&!force)return info;if(!loading)loading=fetch('/api/v4-extensions?resource=rh-mail-status',{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null).then(v=>{info=v||{offline:true};loading=null;return info});return loading}
function label(i,box){if(!i||i.offline)return['muted','Sem ligação ao servidor (modo de demonstração)'];if(!i.enabled)return['muted','Desligada'];if(!i.configured)return['warn','Falta a palavra-passe de aplicação'];if(box?.lastError)return['bad','Erro na última verificação'];return['ok','Ligada']}
function html(){const s=read(),box=s.rhMail||{},i=info,[cls,txt]=label(i,box),tpl=(box.templates||{})[tab]||{},def=(i?.defaults||{})[tab]||{},log=(box.log||[]).slice(0,25),names=new Map((s.candidates||[]).map(c=>[String(c.id),c.name]));
 return `<summary><span>📥 Caixa de candidaturas</span><span class="rhm-addr">${E(i?.address||'gruposaude.rh@gmail.com')}</span><span class="rhm-pill rhm-${cls}">${E(txt)}</span></summary>
 <div class="rhm-body">
 <p class="rhm-help">Cada email com currículo enviado para esta caixa cria um candidato <strong>por validar</strong> em «Candidatos» e recebe logo um email a agradecer. Ao marcar entrevista é enviado o dia e a hora; ao passar para «Recusado» (com confirmação) é enviado um agradecimento. «Contratado» não envia nada.</p>
 <div class="rhm-row"><span>Última verificação: <strong>${when(box.lastRunAt)}</strong></span>${box.lastError?`<span class="rhm-err">⚠ ${E(box.lastError)}</span>`:''}<button type="button" class="primary" data-rhm="run" ${busy||!i?.enabled||!i?.configured?'disabled':''}>${busy?'A verificar…':'Verificar agora'}</button></div>
 ${i&&!i.offline&&i.enabled&&!i.configured?'<p class="notice">Para ligar: no Gmail gruposaude.rh ative a verificação em 2 passos, crie uma «palavra-passe de aplicação» e coloque-a no Vercel como GS_RH_MAIL_APP_PASSWORD.</p>':''}
 <h3>Textos dos emails</h3>
 <div class="rhm-tabs" role="tablist">${KINDS.map(([k,l])=>`<button type="button" role="tab" aria-selected="${k===tab}" data-rhm-tab="${k}">${E(l)}</button>`).join('')}</div>
 <label>Assunto<input id="rhmSubject" value="${E(tpl.subject??def.subject??'')}"></label>
 <label>Texto<textarea id="rhmText" rows="9">${E(tpl.text??def.text??'')}</textarea></label>
 <p class="rhm-help">Palavras que o programa substitui: <code>{nome}</code>${tab==='interview'?' <code>{data}</code> <code>{hora}</code> <code>{local}</code> <code>{notas}</code>':''}.</p>
 <div class="rhm-row"><button type="button" class="primary" data-rhm="save">Guardar texto</button><button type="button" class="secondary" data-rhm="reset" ${tpl.subject||tpl.text?'':'disabled'}>Repor texto original</button></div>
 <h3>Histórico de envios</h3>
 ${log.length?`<div class="table-wrap"><table class="rhm-log"><thead><tr><th>Quando</th><th>Candidato</th><th>Email</th><th>Estado</th></tr></thead><tbody>${log.map(r=>`<tr><td>${when(r.at)}</td><td>${E(names.get(String(r.candidateId))||r.to)}<br><small>${E(r.to)}</small></td><td>${E(KIND[r.kind]||r.kind)}</td><td>${r.status==='Falhou'?`<span class="rhm-err">Falhou</span>${r.error?`<br><small>${E(r.error)}</small>`:''}<br><button type="button" class="secondary" data-rhm-retry="${E(r.candidateId)}" data-kind="${E(r.kind)}">Tentar de novo</button>`:'✓ Enviado'}</td></tr>`).join('')}</tbody></table></div>`:'<p>Ainda não foi enviado nenhum email.</p>'}
 </div>`}
function paint(card){const open=card.open;card.innerHTML=html();card.open=open;bind(card)}
function bind(card){
 card.querySelectorAll('[data-rhm-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.rhmTab;paint(card)});
 card.querySelector('[data-rhm=save]').onclick=()=>{if(!can())return alert('Sem autorização.');const subject=card.querySelector('#rhmSubject').value.trim(),text=card.querySelector('#rhmText').value.trim();if(!subject||!text)return alert('Preencha o assunto e o texto do email.');const s=read();s.rhMail={...(s.rhMail||{})};s.rhMail.templates={...(s.rhMail.templates||{}),[tab]:{subject,text}};write(s);paint(card);toast('Texto guardado.')};
 card.querySelector('[data-rhm=reset]').onclick=async()=>{if(!can())return;if(!(await(window.GSDialog?.confirm?.('Repor o texto original deste email?')??confirm('Repor o texto original deste email?'))))return;const s=read();s.rhMail={...(s.rhMail||{})};const t={...(s.rhMail.templates||{})};delete t[tab];s.rhMail.templates=t;write(s);paint(card)};
 const runBtn=card.querySelector('[data-rhm=run]');runBtn.addEventListener('auto',()=>run(card,true));runBtn.onclick=()=>run(card,false);
 card.querySelectorAll('[data-rhm-retry]').forEach(b=>b.onclick=()=>{if(!can())return;const s=read(),c=(s.candidates||[]).find(x=>String(x.id)===b.dataset.rhmRetry),n=c&&[...(c.notifications||[])].reverse().find(x=>x.kind===b.dataset.kind&&x.status==='Failed');if(!n)return alert('Este envio já não está em falha.');n.status='Queued';delete n.error;write(s);toast('Fica em fila: segue na próxima verificação.');paint(card)});
}
/* Verificação: manual (botão) ou automática ao abrir «Candidatos» se a última tiver mais de 5 minutos (silenciosa). */
async function run(card,auto){if(busy||!can())return;busy=true;let changed=false;paint(card);try{try{await window.GSServerSync?.push?.()}catch{}const r=await fetch('/api/v4-extensions?resource=rh-mail-run',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:'{}'}),v=await r.json().catch(()=>({}));if(!r.ok)throw Error(v.error||'Não foi possível verificar a caixa.');changed=!!(v.created||v.merged||(v.sent||[]).length||(v.failed||[]).length);try{await window.GSServerSync?.pull?.()}catch{}if(!auto||v.created||(v.sent||[]).length)toast(v.status&&v.status!=='OK'?v.status:`Verificado: ${v.created||0} candidato(s) novo(s), ${(v.sent||[]).length} email(s) enviado(s)${(v.failed||[]).length?', '+v.failed.length+' falhou/falharam':''}.`)}catch(e){if(!auto)alert(e.message)}finally{busy=false;if(card.isConnected)paint(card);if(changed)window.V4ClinicHR?.showCandidates?.()}}
function toast(m){const t=document.createElement('div');t.className='rhm-toast';t.setAttribute('role','status');t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),3500)}
function mount(){const sec=document.getElementById('hr'),root=document.getElementById('hrContent');if(!sec||!root||sec.dataset.hrContext!=='candidates'||!can())return;if(root.querySelector('#rhMailboxCard'))return;const card=document.createElement('details');card.id='rhMailboxCard';card.className='card rhm-card';card.open=wasOpen;card.addEventListener('toggle',()=>{wasOpen=card.open});root.prepend(card);paint(card);status().then(i=>{if(!card.isConnected)return;paint(card);const last=Date.parse(read().rhMail?.lastRunAt||0)||0;if(i?.enabled&&i?.configured&&!busy&&Date.now()-last>5*60e3&&Date.now()-autoAt>5*60e3){autoAt=Date.now();card.querySelector('[data-rhm=run]')?.dispatchEvent(new Event('auto'))}})}
new MutationObserver(()=>mount()).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-hr-context']});
document.addEventListener('gs:user-changed',()=>{info=null});
const css=document.createElement('style');css.textContent=`
.rhm-card{padding:0;margin-bottom:14px}.rhm-card>summary{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:12px 16px;cursor:pointer;font-weight:700;list-style:none}
.rhm-card>summary::-webkit-details-marker{display:none}.rhm-card>summary::after{content:"▾";margin-left:auto;transition:transform .2s}.rhm-card[open]>summary::after{transform:rotate(180deg)}
.rhm-addr{font-weight:500;color:var(--muted,#5b6470);font-size:.9rem;overflow-wrap:anywhere}
.rhm-pill{font-size:.78rem;font-weight:700;padding:3px 10px;border-radius:999px;background:var(--surface-2,#eef1f4);color:var(--text,#1d2733)}
.rhm-ok{background:#e3f4e8;color:#17602f}.rhm-warn{background:#fff3d6;color:#7a4b00}.rhm-bad{background:#fde4e4;color:#9b1c1c}
.rhm-body{padding:0 16px 16px}.rhm-help{color:var(--muted,#5b6470);font-size:.9rem}.rhm-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:10px 0}.rhm-row .primary{margin-left:auto}
.rhm-err{color:#b71c1c;font-weight:600}.rhm-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.rhm-tabs button{border-radius:999px;padding:6px 12px;border:1px solid var(--border,#d5dbe1);background:var(--surface,#fff);color:inherit;min-height:36px}
.rhm-tabs button[aria-selected=true]{background:var(--primary,#0b6e4f);color:#fff;border-color:transparent}.rhm-card textarea{width:100%;font:inherit}.rhm-log td{vertical-align:top}
.rhm-toast{position:fixed;left:50%;bottom:84px;transform:translateX(-50%);background:#1d2733;color:#fff;padding:10px 16px;border-radius:10px;z-index:9999;max-width:calc(100vw - 32px)}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .rhm-ok{background:#163d24;color:#9be3b0}:root:not([data-theme=light]) .rhm-warn{background:#4a3500;color:#ffd98a}:root:not([data-theme=light]) .rhm-bad{background:#4a1515;color:#ffb4b4}:root:not([data-theme=light]) .rhm-err{color:#ff8a80}}
:root[data-theme=dark] .rhm-ok{background:#163d24;color:#9be3b0}:root[data-theme=dark] .rhm-warn{background:#4a3500;color:#ffd98a}:root[data-theme=dark] .rhm-bad{background:#4a1515;color:#ffb4b4}:root[data-theme=dark] .rhm-err{color:#ff8a80}`;
document.head.appendChild(css);
window.RhMailboxV4={mount,status,_html:html};
})();
