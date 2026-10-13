/* Read-only authenticated boundary. Uses server data only; never falls back to demo storage. */
(()=>{'use strict';
 const root=document.getElementById('authenticatedClinicModules');if(!root)return;
 const select=document.getElementById('sessionClinic'),result=document.getElementById('sessionModuleResult'),status=document.getElementById('sessionModuleStatus');let generation=0;
 const can=key=>{const a=GSSessionV4.user;return !!a&&GSAccessPolicy.enabled(a.role,key,a.permissions||{})};
 function clear(){generation++;root.hidden=true;document.getElementById('sessionStock').hidden=true;document.getElementById('sessionClinicDocuments').hidden=true;select.replaceChildren();result.replaceChildren();status.textContent='';}
 async function refresh(){
  clear();if(!can('clinics')&&!can('stockRead'))return;
  const version=generation,identity=GSSessionV4.user?.id;
  try{const clinics=await GSSessionV4.modules.call('clinics');if(version!==generation||identity!==GSSessionV4.user?.id)return;
   for(const c of clinics){const o=document.createElement('option');o.value=c.id;o.textContent=c.name;select.appendChild(o);}
   root.hidden=false;document.getElementById('sessionStock').hidden=!can('stockRead');document.getElementById('sessionClinicDocuments').hidden=!can('clinics');
   status.textContent=clinics.length?'Leituras do servidor; alterações operacionais não são disponibilizadas nesta área.':'Sem clínicas autorizadas.';
  }catch(e){clear();status.textContent='Integração central indisponível: '+e.message;}
 }
 async function load(action){
  const version=++generation,identity=GSSessionV4.user?.id,cid=select.value;result.replaceChildren();if(!cid)return;
  status.textContent='A consultar o servidor…';
  try{const data=await GSSessionV4.modules.call(action,{clinicId:cid});if(version!==generation||identity!==GSSessionV4.user?.id)return;
   const table=document.createElement('table'),thead=document.createElement('thead'),tbody=document.createElement('tbody');table.append(thead,tbody);
   const columns=action==='stock'?['Produto','Disponível','Reservado']:['Documento','Estado','Validade'];const hr=document.createElement('tr');for(const label of columns){const th=document.createElement('th');th.textContent=label;hr.appendChild(th);}thead.appendChild(hr);
   const rows=action==='stock'?(data.products||[]).map(p=>{const bs=(data.balances||[]).filter(b=>b.productId===p.id),quantity=bs.reduce((n,b)=>n+b.quantity,0)/1000,reserved=bs.reduce((n,b)=>n+b.reserved,0)/1000;return[p.name,String(quantity-reserved),String(reserved)]}):(data.status||[]).map(d=>[d.requirement?.name||d.name||d.id,d.state||d.status||'',d.current?.expiresOn||d.expiresOn||'—']);
   for(const values of rows){const tr=document.createElement('tr');for(const value of values){const td=document.createElement('td');td.textContent=value;tr.appendChild(td);}tbody.appendChild(tr);}
   if(rows.length){const wrap=document.createElement('div');wrap.className='table-scroll';wrap.appendChild(table);result.appendChild(wrap);}else result.textContent='Sem registos neste âmbito.';
   status.textContent='Dados confirmados pelo servidor para a clínica selecionada.';
  }catch(e){if(version!==generation)return;result.replaceChildren();status.textContent='Consulta recusada ou indisponível: '+e.message;}
 }
 document.getElementById('sessionStock').onclick=()=>load('stock');document.getElementById('sessionClinicDocuments').onclick=()=>load('documents');select.onchange=()=>{generation++;result.replaceChildren();status.textContent='Clínica alterada. Selecione a consulta.';};
 window.addEventListener('gs-session-ended',clear);window.addEventListener('gs-session-confirmed',refresh);
 window.GSAuthenticatedModulesV4=Object.freeze({refresh,clear});
})();
