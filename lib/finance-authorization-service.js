'use strict';
const A=require('./authorization-service'),P=require('../access-policy-core-v4');
async function owner(s,a,id,key='financeManage',operation='read'){
 const target=(await s.people()).find(x=>String(x.id)===String(id));
 A.person(a,target,key,operation);return target;
}
async function document(s,a,id){
 if(!A.has(a,'personal')&&!A.manager(a,'financeManage')&&!A.manager(a,'hrManage'))A.deny();
 const row=(await s.query('select d.id,d.employee_id,d.candidate_id,f.user_id from documents d left join finance_document_owners f on f.document_id=d.id where d.id=$1',[id]))[0];
 if(!row)A.deny('DOCUMENT_NOT_FOUND',404);
 if(row.user_id)return owner(s,a,row.user_id,'financeManage');
 if(row.employee_id){const target=(await s.people()).find(x=>String(x.employeeId)===String(row.employee_id));A.person(a,target,'hrManage');return target;}
 if(!A.manager(a,'hrManage')&&!A.manager(a,'financeManage'))A.deny();
 if(row.candidate_id){const c=(await s.query('select clinic_id from candidates where id=$1',[row.candidate_id]))[0];if(c?.clinic_id)A.clinic(a,c.clinic_id);else if(P.norm(a.role)!=='CEO')A.deny('UNSCOPED_DOCUMENT');}
 else if(P.norm(a.role)!=='CEO')A.deny('UNASSOCIATED_DOCUMENT');
}
async function authorize(s,a,action,b){
 if(!A.has(a,action.startsWith('attention-')?'personal':'account'))A.deny();
 const write=!['bootstrap','statement','history','document','entry-detail'].includes(action)&&!action.endsWith('-list')&&!action.endsWith('-history')&&!action.endsWith('-status');
 if(a.readOnly&&write)A.deny('IMPERSONATION_READ_ONLY');
 if(action==='bootstrap'){a.serverScoped=true;return;}
 if(['statement','invoice-upload','receipt-upload','entry-create'].includes(action)){
  const target=await owner(s,a,action==='invoice-upload'&&!A.manager(a,'financeManage')?a.id:b.employeeId||a.id,'financeManage',action==='entry-create'?'create':'read');
  if(b.clinicId){A.clinic(a,b.clinicId);if(!target.clinics.includes(String(b.clinicId)))A.deny('WRONG_EMPLOYEE_CLINIC');}
  return;
 }
 if(action==='document'||action.startsWith('archive-')&&b.id||action==='document-recover'){
  if(action!=='document'&&!A.manager(a,'security'))A.deny();return document(s,a,b.id);
 }
 let table=null,id=b.id;
 if(action.startsWith('invoice-'))table='finance_invoices';
 if(action.startsWith('receipt-'))table='finance_payslips';
 if(action.startsWith('entry-')||action.startsWith('payment-')&&!action.startsWith('payment-email-')){table='current_account_entries';id=b.entryId||b.paymentId||b.id;}
 if(action==='history')table={invoice:'finance_invoices',payslip:'finance_payslips',entry:'current_account_entries'}[b.kind];
 if(table){
  const managerial=write&&!['invoice-read','invoice-edit','receipt-read'].includes(action);
  if(managerial&&!A.manager(a,'financeManage'))A.deny();
  const row=(await s.query('select user_id'+(table==='current_account_entries'?',clinic_id':'')+' from '+table+' where id=$1',[id]))[0];
  if(!row)A.deny('RESOURCE_NOT_FOUND',404);
  if(table==='current_account_entries'&&P.norm(a.role)==='ADMINISTRAÇÃO'&&String(row.user_id)!==String(a.id))A.clinic(a,row.clinic_id);
  if(row.user_id)await owner(s,a,row.user_id,'financeManage',managerial?'approve':'read');
  else if(P.norm(a.role)!=='CEO')A.deny('UNASSOCIATED_RESOURCE');
  return;
 }
 // Shared mail queues and legacy/global management lists are not yet clinic scoped.
 // Deny rather than return another clinic's documents, notifications or configuration.
 const key=action.startsWith('email-')||action.startsWith('mail-')?'settings':action.startsWith('archive-')?'security':action.startsWith('attention-')?'personal':'financeManage';
 if(!A.has(a,key))A.deny();
 if(P.norm(a.role)!=='CEO')A.deny('UNSCOPED_MANAGEMENT_ACTION_BLOCKED');
}
module.exports={authorize,owner,document};
