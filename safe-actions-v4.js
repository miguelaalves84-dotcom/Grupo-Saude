/* Shared delegated actions: trusted callbacks, arguments serialized as data, never code. */
(()=>{'use strict';
 const allowed=new Set(["App.addContractItem", "App.archiveCandidate", "App.confirmTemporary", "App.finishIndicatorTask", "App.finishTaskAction", "App.openCandidate", "App.openRequest", "App.openTaskAction", "App.removeProfessional", "App.reviewDocument", "App.reviewOccurrence", "App.saveCandidate", "App.saveContract", "App.saveContractItem", "App.saveJobRole", "App.selectConversation", "App.setPhase", "App.setTask", "App.startRequestChat", "App.submitDocument", "App.toggleContract", "App.toggleJobRole", "App.toggleTask", "App.updateProfessional", "App.updateRequest", "App.uploadDocument", "ApprovalsV4.detail", "AttendanceV4.detail", "AttendanceV4.editSickEnd", "AttendanceV4.openDoc", "ClinicCalendarsV4.removeMunicipal", "ClinicRelationsV4.setSpec", "CommunicationsV4.candidate", "CommunicationsV4.retentionForm", "ContractTypesV4.active", "ContractTypesV4.doc", "ContractTypesV4.rename", "ContractTypesV4.vacation", "ContractTypesV4.vacationDays", "FinanceUIV4.open", "GSEnterprise.approveCampaign", "GSEnterprise.editClinic", "GSEnterprise.rejectCampaign", "GSEnterprise.saveClinic", "GSTestAgentV4.cleanupUI", "HRMasterV4.cancelNew", "HRMasterV4.open", "HRMasterV4.removeClinic", "HRMasterV4.removePhoto", "HRMasterV4.save", "HRSeparationV4.confirmSign", "HRSeparationV4.saveMissing", "HRSeparationV4.uploadMissing", "V4Backup.restore", "V4Backup.show", "V4Backup.test", "V4ClinicHR.openEmployee", "V4ClinicHR.uploadRequired", "V4ClinicHR.vacationCenter", "V4ClinicMatrix.addProfessional", "V4ClinicMatrix.addSpecialty", "V4ClinicMatrix.professionals", "V4ClinicMatrix.setSpecialty", "V4ClinicMatrix.specialties", "V4Fix.addDoc", "V4Fix.revert", "V4Fix.toggleDoc", "V4Integrations.setClinicSpecialty", "V4Scheduled.open", "V4Scheduled.save", "V4TimeAdmin.decide", "V4TimeAdmin.detail", "VacationCalendarV4.toggle", "App.confirmClock", "App.confirmClockNoGps"]);
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
 window.GSSafeActionsV4=Object.freeze({attrs});
})();
