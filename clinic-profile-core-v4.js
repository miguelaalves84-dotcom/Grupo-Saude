/* Dados de identificação da clínica usados na publicidade e nos documentos: telefone, entidade jurídica, NIF e
   n.º de registo/licença ERS. Só CEO/Administração alteram. NIF validado pelo dígito de controlo. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GSClinicProfile=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{'use strict';
const fail=(m,st=400)=>{throw Object.assign(Error(m),{status:st})},text=(v,n)=>String(v??'').trim().slice(0,n);
const norm=r=>String(r||'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toUpperCase();
const manager=a=>a?.active!==false&&!a?.readOnly&&['CEO','ADMINISTRACAO'].includes(norm(a?.role));
function nifOk(v){const n=String(v||'').replace(/\s/g,'');if(!/^[125689]\d{8}$/.test(n))return false;let sum=0;for(let i=0;i<8;i++)sum+=Number(n[i])*(9-i);const c=11-(sum%11);return Number(n[8])===(c>=10?0:c)}
function set(s,a,id,b={},at=new Date().toISOString()){if(!manager(a))fail('Reservado ao CEO e à Administração.',403);const c=(s.clinics||[]).find(x=>String(x.id)===String(id));if(!c)fail('Clínica indisponível.',404);
 const phone=text(b.phone,30),nif=text(b.nif,12).replace(/\s/g,''),ers=text(b.ers,40),entity=text(b.entityName,160);
 if(phone&&!/^\+?[\d\s]{9,20}$/.test(phone))fail('Telefone inválido.');if(nif&&!nifOk(nif))fail('NIF inválido (verifique os 9 dígitos).');
 if(phone){c.phone=phone;c.phones=[phone,...(c.phones||[]).filter(x=>x!==phone)].slice(0,5)}if(nif||entity)c.legalEntity={...(c.legalEntity||{}),...(entity?{name:entity}:{}),...(nif?{nif}:{})};if(ers)c.ers={...(c.ers||{}),license:ers};c.profileUpdatedAt=at;c.profileUpdatedBy=String(a.id);return{id:String(c.id),phone:c.phone||'',legalEntity:c.legalEntity||{},ers:c.ers||{}}}
const profile=c=>({phone:c.phone||'',phones:c.phones||[],legalEntity:c.legalEntity||{},ers:c.ers||{},profileUpdatedAt:c.profileUpdatedAt||'',profileUpdatedBy:c.profileUpdatedBy||''});
return{set,nifOk,profile,manager}});
