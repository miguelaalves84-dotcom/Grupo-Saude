/* V4 — Tabelas / Configuração: Clínicas como fonte única */
(()=>{'use strict';
const K='grupo_saude_v4_demo_2',R=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch{return{}}},W=s=>localStorage.setItem(K,JSON.stringify(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function tablesView(){return [...document.querySelectorAll('.view')].find(v=>/Tabelas\s*\/\s*Configuração/i.test(v.querySelector('h1')?.textContent||''))}
function root(){const v=tablesView();return v?.querySelector('#tablesContent')||v?.querySelector('[id$="Content"]')||v}
function cardByTitle(t){const r=root();return r?[...r.querySelectorAll('.card')].find(c=>(c.querySelector('h3')?.textContent||'').trim()===t):null}
function clinics(){return R().clinics||[]}
function openClinic(id){if(window.V4DirectEdit?.openClinic)return V4DirectEdit.openClinic(id);const b=document.querySelector('#nav [data-view="clinics"]');if(b){b.click();setTimeout(()=>document.querySelector('[data-clinic-id="'+id+'"]')?.click(),100)}}
function clinicPanel(){const cs=clinics();return '<div class="card" data-v4-clinics-master="1" style="grid-column:1/-1"><div class="row"><div><h3>Clínicas</h3><p class="muted">Fonte única: ficha da clínica, contactos, GPS/Google Maps, raio do ponto, licença ERS, estado, especialidades e profissionais.</p></div><button class="primary" type="button" data-open-clinics>Gerir clínicas</button></div><div style="margin-top:10px">'+(cs.map(c=>'<button type="button" class="row" data-open-clinic="'+esc(c.id)+'" style="width:100%;text-align:left;background:none;border:0;border-top:1px solid #edf0f2;padding:10px 0;cursor:pointer"><div><b>'+esc(c.name)+'</b><div class="meta">'+(c.active===false?'Inativa':'Ativa')+' · '+esc(c.address||'Morada por preencher')+'</div></div><span>Editar ficha ›</span></button>').join('')||'<p class="muted">Sem clínicas registadas.</p>')+'</div></div>'}
function install(){const r=root();if(!r)return false;
 let host=r.querySelector('.cards')||r;
 let p=r.querySelector('[data-v4-clinics-master]');if(!p){host.insertAdjacentHTML('afterbegin',clinicPanel());p=r.querySelector('[data-v4-clinics-master]')}
 const dup=['Especialidades por clínica','Clínicas · Especialidades · Profissionais','Estrutura das Clínicas'];dup.forEach(t=>{const c=cardByTitle(t);if(c&&c!==p)c.style.display='none'});
 p.querySelector('[data-open-clinics]')?.addEventListener('click',()=>{const b=document.querySelector('#nav [data-view="clinics"]');if(b)b.click();else window.GSEnterprise?.show?.('clinics')},{once:true});
 p.querySelectorAll('[data-open-clinic]').forEach(b=>b.addEventListener('click',()=>openClinic(b.dataset.openClinic),{once:true}));
 return true}
function sync(){const s=R();s.clinicStructure=s.clinicStructure||{};(s.clinics||[]).forEach(c=>{const id=c.id;s.clinicStructure[id]=s.clinicStructure[id]||{specialties:[],professionals:[]};if(c.specialties){const names=Array.isArray(c.specialties)?c.specialties:Object.keys(c.specialties);s.clinicStructure[id].specialties=[...new Set([...(s.clinicStructure[id].specialties||[]),...names])];if(!Array.isArray(c.specialties))Object.entries(c.specialties).forEach(([sp,ps])=>(ps||[]).forEach(name=>{if(!s.clinicStructure[id].professionals.some(p=>p.name===name&&p.specialty===sp))s.clinicStructure[id].professionals.push({name,specialty:sp,active:true})}))}});W(s)}
function boot(){sync();install();let busy=false;new MutationObserver(()=>{if(busy)return;busy=true;requestAnimationFrame(()=>{install();busy=false})}).observe(document.body,{childList:true,subtree:true})}
document.addEventListener('gs-v4-config-updated',e=>{if(['clinic','specialty','professional'].includes(e.detail?.type)){sync();const p=root()?.querySelector('[data-v4-clinics-master]');if(p)p.outerHTML=clinicPanel();install()}});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
})();