'use strict';
/* Uses the existing users, employees, user_clinics, app_settings and audit_log. No new business registry. */
const Records=require('./identity-records-service');
class IdentityService{
 constructor(db,resourceId){this.db=db;this.resourceId=resourceId;}
 async query(sql,params=[]){
  // Recheck the destination on every operation; a prior successful check is not a permanent credential.
  const rows=await this.db.query("select resource_id,data_synthetic from gs_identity_environment where id='group1-tests'");
  if(rows[0]?.resource_id!==this.resourceId||rows[0]?.data_synthetic!==true)throw Error('ISOLATED_IDENTITY_DESTINATION_MISMATCH');
  return this.db.query(sql,params);
 }
 async people(){return Records.people.call(this);}
 async audit(actor,kind,target,action,before,after){
  await this.query('insert into audit_log(actor_id,module,action,entity_type,entity_id,detail) values($1,$2,$3,$4,$5,$6::jsonb)',
   [actor.id,'Identidade',action,kind,String(target),JSON.stringify({before,after})]);
 }
}
function service(env){
 const config=require('./identity-runtime-config').select(env);if(!config?.configured)throw Error('ISOLATED_IDENTITY_NOT_CONFIGURED');
 // Lazy dependency: existing offline tests never install a package or connect to a database.
 const {neon}=require('@neondatabase/serverless'),sql=neon(config.databaseUrl);
 return new IdentityService({query:(q,p=[])=>sql.query(q,p)},config.resourceId);
}
module.exports={IdentityService,service};
