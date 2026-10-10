'use strict';
/* One server policy. Browser identity, local permissions and identifiers are never credentials. */
const P=require('../access-policy-core-v4');
function deny(code='FORBIDDEN',status=403){throw Object.assign(Error(code),{authStatus:status,code})}
function has(a,key){return a?.active===true&&(a.permissions?.[key]===undefined?P.defaults(P.norm(a.role)).includes(key):a.permissions[key]===true)}
function manager(a,key){return ['CEO','ADMINISTRAÇÃO'].includes(P.norm(a?.role))&&has(a,key)}
function clinic(a,id){if(!id||!a.activeClinicIds?.includes(String(id)))deny('CLINIC_NOT_AUTHORIZED');if(P.norm(a.role)!=='CEO'&&!a.clinics?.includes(String(id)))deny('CLINIC_NOT_AUTHORIZED')}
function person(a,target,key='hrManage',operation='read'){
 if(!target)deny('RESOURCE_NOT_AUTHORIZED');
 if(String(target.id)===String(a.id)&&operation==='read'){if(!has(a,key==='financeManage'?'account':'personal'))deny();return;}
 if(!manager(a,key))deny();
 if(P.norm(a.role)!=='CEO'&&!target.clinics?.some(id=>a.activeClinicIds?.includes(String(id))&&a.clinics?.includes(String(id))))deny('CLINIC_NOT_AUTHORIZED');
}
async function context(req,env=process.env,dependencies={}){
 const API=require('../api/v4-finance');
 if(!API.configured(env))deny('ISOLATED_BACKEND_NOT_CONFIGURED',503);
 const proxy=env.GS_FINANCE_PROXY_TOKEN&&API.equal(req.headers.authorization,'Bearer '+env.GS_FINANCE_PROXY_TOKEN);
 const origin=proxy?req.headers['x-gs-origin']:req.headers.origin||'https://'+req.headers.host;
 if(!(env.GS_FINANCE_ORIGINS||'').split(',').map(x=>x.trim()).includes(origin)||req.method!=='GET'&&!proxy&&!req.headers.origin)deny('ORIGIN_NOT_AUTHORIZED');
 if(!req.headers.cookie)deny('AUTH_REQUIRED',401);
 const s=(dependencies.service||API.service)(env),real=await API.authenticatedActor(s,env,req.headers.cookie,dependencies.fetch||fetch);
 const active=await s.query('select id from clinics where active=true');
 const actor={...real,activeClinicIds:active.map(c=>String(c.id))};
 const viewAs=String(req.headers['x-gs-view-as']||'').trim();
 if(viewAs){
  if(P.norm(actor.role)!=='CEO'||!has(actor,'hrManage'))deny('IMPERSONATION_FORBIDDEN');
  if(req.method!=='GET')deny('IMPERSONATION_READ_ONLY');
  const target=(await s.people()).find(x=>String(x.id)===viewAs);
  if(!target?.active)deny('IMPERSONATION_TARGET_INVALID');
  const effective={...target,activeClinicIds:actor.activeClinicIds.filter(id=>P.norm(target.role)==='CEO'||target.clinics.includes(id)),simulatedBy:actor.id,readOnly:true};
  return{s,sql:s.db,actor:effective,realActor:actor};
 }
 return{s,sql:s.db,actor,realActor:actor};
}
const resources={clinics:'clinics',users:'settings',settings:'settings',permissions:'settings','technician-sales':'operation','sync-document-alerts':'hrManage','process-alert-escalations':'alerts','notification-deliveries':'alerts',alerts:'alerts','employee-documents':'hrManage','supersede-document':'hrManage','clinic-day':'operation','clinic-day-open':'openClinic','clinic-day-close':'closeClinic','management-report':'reports','monthly-consolidation':'reports',candidates:'hrManage','candidate-email-ingest':'hrManage','document-compliance':'hrManage','document-requirement':'hrManage','system-health':'security','audit-log':'audit','gdpr-export':'personal',me:'personal'};
async function legacy(req,s,a){
 const resource=req.query?.health==='1'?'health':req.query?.resource,key=resource==='health'?'security':resources[resource];
 if(!key)deny('UNKNOWN_RESOURCE',404);
 if(!has(a,key))deny();
 const b=req.body||{},q=req.query||{},write=req.method!=='GET';
 if(resource==='health'&&!manager(a,'security'))deny();
 if(resource==='users'&&write){
  if(!manager(a,'settings'))deny();
  // Administration cannot assign identities, elevate any role, alter a CEO, or edit global permissions.
  if(P.norm(a.role)!=='CEO')deny('CEO_REQUIRED_FOR_IDENTITY_MANAGEMENT');
  for(const id of b.clinics||[])clinic(a,id);
 }
 if(resource==='employee-documents'){
  const target=(await s.people()).find(x=>String(x.employeeId)===String(q.employeeId));person(a,target,'hrManage');
 }
 if(resource==='supersede-document')deny('USE_APPROVED_DOCUMENT_REPLACEMENT',409);
 if(['clinic-day','clinic-day-open','clinic-day-close','technician-sales'].includes(resource)&&(b.clinicId||q.clinicId))clinic(a,b.clinicId||q.clinicId);
 if(resource==='technician-sales'&&write&&(Number(b.bonusValue)||['CEO','ADMINISTRAÇÃO'].includes(P.norm(a.role)))&&!manager(a,'financeManage'))deny();
 if(resource==='clinics'&&write){if(!manager(a,'clinics'))deny();clinic(a,b.id);}
 if(resource==='gdpr-export'&&q.userId&&String(q.userId)!==String(a.id)&&P.norm(a.role)!=='CEO')deny('UNSCOPED_PERSONAL_EXPORT');
 // Legacy global queries have no trustworthy clinic/ownership discriminator. Fail closed until migrated.
 const scoped=new Set(['health','clinics','me','alerts','employee-documents','clinic-day','clinic-day-open','clinic-day-close','gdpr-export']);
 if(P.norm(a.role)!=='CEO'&&!scoped.has(resource))deny('LEGACY_UNSCOPED_RESOURCE_BLOCKED');
 if(['users','settings','permissions','candidates','document-requirement','document-compliance','sync-document-alerts','process-alert-escalations','notification-deliveries','management-report','monthly-consolidation','audit-log','system-health','candidate-email-ingest'].includes(resource)&&!manager(a,key))deny();
}
function error(res,e){return res.status(e.authStatus||503).json({ok:false,code:e.code||'SERVICE_UNAVAILABLE'})}
module.exports={deny,has,manager,clinic,person,context,legacy,error,resources};
