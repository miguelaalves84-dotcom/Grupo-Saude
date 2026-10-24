/* Shared delegated actions: trusted callbacks, arguments serialized as data, never code. */
(()=>{'use strict';
 const allowed=new Set(["HRRostersV4.queue","HRRostersV4.bulk","HRRostersV4.open","HRRostersV4.render","HRRostersV4.request","HRRostersV4.copyPreviousWeek","HRRostersV4.swapForm","HRRostersV4.swap","HRRostersV4.decision","HRRostersV4.decide","EmployeeDocumentsV4.overview","EmployeeDocumentsV4.queue","EmployeeDocumentsV4.back","EmployeeDocumentsV4.open","EmployeeDocumentsV4.upload","EmployeeDocumentsV4.save","EmployeeDocumentsV4.history","EmployeeDocumentsV4.download","EmployeeDocumentsV4.review","EmployeeDocumentsV4.decide","AttendanceBookV4.proof","AttendanceBookV4.locate","AttendanceBookV4.manual","AttendanceBookV4.saveManual","AttendanceBookV4.prepare","AttendanceBookV4.confirm","AttendanceBookV4.correction","AttendanceBookV4.saveCorrection","AttendanceBookV4.pending","AttendanceBookV4.decision","AttendanceBookV4.decide","AttendanceBookV4.excel","AttendanceBookV4.setPeriod","AttendanceBookV4.print","AttendanceBookV4.absence","AttendanceBookV4.render","App.addContractItem", "App.archiveCandidate", "App.confirmTemporary", "App.finishIndicatorTask", "App.finishTaskAction", "App.openCandidate", "App.openRequest", "App.openTaskAction", "App.removeProfessional", "App.reviewDocument", "App.reviewOccurrence", "App.saveCandidate", "App.saveContract", "App.saveContractItem", "App.saveJobRole", "App.selectConversation", "App.setPhase", "App.setTask", "App.startRequestChat", "App.submitDocument", "App.toggleContract", "App.toggleJobRole", "App.toggleTask", "App.updateProfessional", "App.updateRequest", "App.uploadDocument", "ApprovalsV4.detail", "AttendanceV4.detail", "AttendanceV4.editSickEnd", "AttendanceV4.openDoc", "ClinicCalendarsV4.removeMunicipal", "ClinicRelationsV4.setSpec", "CommunicationsV4.onboardingForm","CommunicationsV4.candidate", "CommunicationsV4.retentionForm", "ContractTypesV4.active", "ContractTypesV4.doc", "ContractTypesV4.requirement", "ContractTypesV4.rename", "ContractTypesV4.vacation", "ContractTypesV4.vacationDays", "FinanceUIV4.open", "GSEnterprise.approveCampaign", "GSEnterprise.editClinic", "GSEnterprise.rejectCampaign", "GSEnterprise.saveClinic", "GSTestAgentV4.cleanupUI", "HRMasterV4.cancelNew", "HRMasterV4.print","HRMasterV4.open", "HRMasterV4.removeClinic", "HRMasterV4.removePhoto", "HRMasterV4.save", "HRMasterV4.saveCapacity", "HRSeparationV4.confirmSign", "HRSeparationV4.saveMissing", "HRSeparationV4.uploadMissing", "V4Backup.restore", "V4Backup.show", "V4Backup.test", "V4ClinicHR.openEmployee", "V4ClinicHR.uploadRequired", "V4ClinicHR.vacationCenter", "V4ClinicMatrix.addProfessional", "V4ClinicMatrix.addSpecialty", "V4ClinicMatrix.professionals", "V4ClinicMatrix.setSpecialty", "V4ClinicMatrix.specialties", "V4Fix.addDoc", "V4Fix.revert", "V4Fix.toggleDoc", "V4Integrations.setClinicSpecialty", "V4Scheduled.open", "V4Scheduled.save", "V4TimeAdmin.decide", "V4TimeAdmin.detail", "VacationCalendarV4.toggle", "App.confirmClock", "App.confirmClockNoGps"]);
 const html=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function attrs(action,args=[],event='click',options={}){
  if(!allowed.has(action)||!['click','change','input','submit'].includes(event))throw Error('Unknown action');
  return 'data-gs-action="'+html(action)+'" data-gs-event="'+event+'" data-gs-payload="'+html(JSON.stringify({args,options}))+'"';
 }
 function invoke(action,args){
  if(!allowed.has(action))return;
  const [scope,method]=action.split('.'),object=window[scope];
  const fn=object&&Object.getOwnPropertyDescriptor(object,method)?.value;
  if(typeof fn==='function')return fn.apply(object,args);
 }
 function dispatch(event){
  const node=event.target.closest?.('[data-gs-action]');
  if(!node||node.dataset.gsEvent!==event.type||!allowed.has(node.dataset.gsAction))return;
  let data;try{data=JSON.parse(node.dataset.gsPayload)}catch{return;}
  if(!Array.isArray(data.args)||data.args.length>10)return;
  if(data.options?.nonempty&&!node.value)return;
  event.stopPropagation();if(event.type==='click'||event.type==='submit')event.preventDefault();
  const args=data.args.map(value=>value&&typeof value==='object'&&Object.keys(value).length===1&&['checked','value'].includes(value.eventProperty)?node[value.eventProperty]:value);
  if(data.options?.before==='modal-close')document.getElementById('modal')?.close();
  invoke(node.dataset.gsAction,args);
  if(data.options?.after==='V4Backup.show')invoke('V4Backup.show',[]);
 }
 for(const event of ['click','change','input','submit'])document.addEventListener(event,dispatch);
 document.addEventListener('keydown',event=>{const node=event.target.closest?.('[data-gs-action][role="button"]');if(node&&event.target===node&&!['BUTTON','INPUT','SELECT'].includes(node.tagName)&&['Enter',' '].includes(event.key)){event.preventDefault();node.click();}});
 /* Native editors must remain connected while an IME owns their selection.
    Never rewrite values, replay keystrokes or suppress the device's correction. */
 const composingNodes=new WeakSet(),inputBindings=new WeakMap(),renderScopes=new WeakMap();let editingScope=0;
 const composing=(node,event)=>!!event?.isComposing||event?.keyCode===229||!!node&&composingNodes.has(node);
 const freeField=node=>!!node&&!node.disabled&&!node.readOnly&&(node.tagName==='TEXTAREA'||node.isContentEditable||node.tagName==='INPUT'&&['text','search','email','tel','url','password','number'].includes(node.type));
 document.addEventListener('compositionstart',e=>{if(e.target&&typeof e.target==='object')composingNodes.add(e.target)},true);
 document.addEventListener('compositionend',e=>{if(e.target&&typeof e.target==='object')composingNodes.delete(e.target)},true);
 for(const name of ['gs:user-changed','gs:permissions-applied'])document.addEventListener(name,()=>editingScope++);
 function bindInput(node,callback){
  if(!node)return;const old=inputBindings.get(node);if(old){old.callback=callback;return}
  const binding={callback,pending:false};inputBindings.set(node,binding);
  const schedule=event=>{if(composing(node,event)||binding.pending)return;binding.pending=true;queueMicrotask(()=>{binding.pending=false;if(node.isConnected&&!composing(node))binding.callback(event)})};
  for(const name of ['input','search','compositionend'])node.addEventListener(name,schedule);
 }
 function renderAround(root,html,selector,identity=''){
  const key=editingScope+':'+identity,previous=renderScopes.get(root);renderScopes.set(root,key);
  const anchor=root.querySelector?.(selector),focused=document.activeElement;
  if(previous!==key||!anchor||!freeField(focused)||!anchor.contains(focused)){root.innerHTML=html;return false}
  const template=document.createElement('template');template.innerHTML=html;const next=template.content.querySelector(selector);
  if(!next){root.innerHTML=html;return false}
  const path=(node,end)=>{const out=[];for(;node&&node!==end;node=node.parentNode)out.unshift(node);return out},oldPath=path(anchor,root),newPath=path(next,template.content);
  if(oldPath.length!==newPath.length||oldPath.some((node,i)=>node.nodeName!==newPath[i].nodeName)){root.innerHTML=html;return false}
  /* Patch only siblings along the path: never detach the editor or its ancestors. */
  let oldParent=root,newParent=template.content;
  for(let i=0;i<oldPath.length;i++){
   const keep=oldPath[i],replacement=newPath[i],children=[...newParent.childNodes];
   for(const child of [...oldParent.childNodes])if(child!==keep)child.remove();
   let after=false;for(const child of children){if(child===replacement){after=true;continue}if(after)oldParent.appendChild(child);else oldParent.insertBefore(child,keep)}
   oldParent=keep;newParent=replacement;
  }
  return true;
 }
 window.GSSafeActionsV4=Object.freeze({attrs,composing,freeField,bindInput,renderAround});
})();
