/* Suporte: o colaborador abre um pedido ao RH (horário, picagens, recibos…); recebem e respondem o CEO e a Administração.
   Estados: Aberto → Em análise → Resolvido (uma nova mensagem do colaborador reabre). Cada pessoa só vê os seus pedidos. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GSSupportCore=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{'use strict';
const fail=(m,status=400)=>{throw Object.assign(Error(m),{status,supportDomain:true})};
const norm=r=>String(r||'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toUpperCase();
const manager=a=>!!a&&a.active!==false&&!a.readOnly&&['CEO','ADMINISTRACAO'].includes(norm(a.role));
const CATEGORIES=['Horário','Picagens / ponto','Férias e ausências','Recibos e pagamentos','Dados pessoais','Documentos','Outro'];
const STATUS=['Aberto','Em análise','Resolvido'];
const text=(v,n)=>String(v??'').trim().slice(0,n);
const uid=p=>p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function list(s,a){const all=Array.isArray(s?.supportTickets)?s.supportTickets:[];return(manager(a)?all:all.filter(t=>String(t.employeeId)===String(a?.id))).slice().sort((x,y)=>String(y.updatedAt||y.createdAt).localeCompare(String(x.updatedAt||x.createdAt)))}
function create(s,a,{category,subject,message}={},at=new Date().toISOString()){if(!a?.id||a.active===false||a.readOnly)fail('Sessão inválida.',403);const cat=CATEGORIES.includes(category)?category:fail('Escolha o assunto.'),sub=text(subject,140),msg=text(message,3000);if(!sub)fail('Escreva um título curto.');if(!msg)fail('Descreva o pedido.');
 const t={id:uid('sup'),employeeId:String(a.id),category:cat,subject:sub,status:'Aberto',createdAt:at,updatedAt:at,messages:[{id:uid('msg'),from:String(a.id),at,text:msg}],seen:{[String(a.id)]:1},history:[{at,by:String(a.id),action:'Aberto'}]};(s.supportTickets||=[]).push(t);return t}
function get(s,a,id){const t=(s.supportTickets||[]).find(x=>x.id===id);if(!t)fail('Pedido não encontrado.',404);if(!manager(a)&&String(t.employeeId)!==String(a?.id))fail('Pedido não autorizado.',403);return t}
function reply(s,a,id,message,at=new Date().toISOString()){const t=get(s,a,id),msg=text(message,3000);if(!msg)fail('Escreva a mensagem.');t.messages.push({id:uid('msg'),from:String(a.id),at,text:msg});t.updatedAt=at;t.seen={...(t.seen||{}),[String(a.id)]:t.messages.length};
 if(manager(a)&&String(t.employeeId)!==String(a.id)){if(t.status==='Aberto'){t.status='Em análise';t.history.push({at,by:String(a.id),action:'Em análise'})}}else if(t.status==='Resolvido'){t.status='Aberto';t.history.push({at,by:String(a.id),action:'Reaberto'})}return t}
function setStatus(s,a,id,status,at=new Date().toISOString()){if(!manager(a))fail('Só CEO/Administração mudam o estado.',403);if(!STATUS.includes(status))fail('Estado inválido.');const t=get(s,a,id);if(t.status!==status){t.status=status;t.updatedAt=at;t.history.push({at,by:String(a.id),action:status})}return t}
function markRead(s,a,id){const t=get(s,a,id);t.seen={...(t.seen||{}),[String(a.id)]:(t.messages||[]).length};return t}
/* por ler: há mensagens depois das que a pessoa já viu e a última é de outra pessoa */
function unread(t,a){const last=t.messages?.at(-1);return!!last&&String(last.from)!==String(a?.id)&&(t.messages.length>Number(t.seen?.[String(a?.id)]||0))}
return{CATEGORIES,STATUS,manager,list,create,reply,setStatus,markRead,unread};});
