/* Janelas próprias da aplicação em vez das caixas cinzentas do navegador (alert/confirm/prompt).
   - GSDialog.alert(texto): aviso com botão OK (não bloqueia o resto da página).
   - GSDialog.confirm(texto,{danger,ok,cancel}) → Promise<boolean>
   - GSDialog.prompt(texto,valor,{required}) → Promise<string|null>
   Seguem o tema claro/escuro, funcionam no telemóvel (botões grandes) e só mostram texto (nunca HTML).
   Com testes automáticos (navigator.webdriver) usa as caixas do navegador, para os testes existentes as poderem aceitar. */
(function(root){'use strict';
 const native={alert:root.alert?.bind(root),confirm:root.confirm?.bind(root),prompt:root.prompt?.bind(root)};
 const forced=()=>{try{return root.localStorage?.getItem('gs-dialog-force')==='1'}catch{return false}};
 const useNative=()=>!forced()&&!!root.navigator?.webdriver;
 const queue=[];let busy=false;
 function el(tag,cls,text){const e=root.document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e}
 function open(kind,message,opts={}){return new Promise(resolve=>{queue.push({kind,message,opts,resolve});pump()})}
 function pump(){if(busy||!queue.length)return;busy=true;const {kind,message,opts,resolve}=queue.shift(),d=el('dialog','gs-dialog'+(opts.danger?' danger':''));d.setAttribute('aria-modal','true');d.setAttribute('role',kind==='alert'?'alertdialog':'dialog');
  const body=el('div','gs-dialog-body');const p=el('p','gs-dialog-text',message);p.id='gsDialogText'+Date.now();d.setAttribute('aria-labelledby',p.id);body.append(p);let input=null;
  if(kind==='prompt'){input=el('input','gs-dialog-input');input.id='gsDialogInput';input.value=opts.value==null?'':String(opts.value);input.setAttribute('aria-label',String(message));body.append(input)}
  const err=el('p','gs-dialog-error');err.hidden=true;body.append(err);
  const actions=el('div','gs-dialog-actions'),ok=el('button','primary gs-dialog-ok',opts.ok||(kind==='confirm'?'Confirmar':'OK'));ok.type='button';
  let cancel=null;if(kind!=='alert'){cancel=el('button','gs-dialog-cancel',opts.cancel||'Cancelar');cancel.type='button';actions.append(cancel)}actions.append(ok);d.append(body,actions);
  const finish=v=>{d.close();d.remove();busy=false;resolve(v);pump()};
  ok.onclick=()=>{if(kind==='prompt'){const v=input.value;if(opts.required&&!v.trim()){err.textContent='Preencha este campo.';err.hidden=false;input.focus();return}return finish(v)}finish(kind==='confirm'?true:undefined)};
  if(cancel)cancel.onclick=()=>finish(kind==='confirm'?false:null);
  d.addEventListener('cancel',e=>{e.preventDefault();cancel?cancel.click():finish(undefined)});
  if(input)input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ok.click()}});
  root.document.body.append(d);d.showModal();(input||ok).focus();if(input)input.select()}
 const api={
  alert(message){if(useNative())return native.alert?.(message);open('alert',message)},
  confirm(message,opts={}){if(useNative())return Promise.resolve(!!root.confirm?.(message));return open('confirm',message,opts)},
  prompt(message,value='',opts={}){if(useNative())return Promise.resolve(root.prompt?root.prompt(message,value):null);return open('prompt',message,{...opts,value})},
  native};
 root.GSDialog=api;
 /* Todos os avisos simples da aplicação passam a usar a janela própria. */
 root.alert=m=>api.alert(m);
})(window);
