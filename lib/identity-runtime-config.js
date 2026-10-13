'use strict';
/* Group 1 configuration only; never creates resources, opens connections or falls back to demo. */
function configured(env){
 try{
  if(env.GS_IDENTITY_ENVIRONMENT!=='isolated'||env.GS_IDENTITY_DATA_SYNTHETIC!=='true'||env.VERCEL_ENV!=='preview')return false;
  if(!env.GS_IDENTITY_EXPECTED_PROJECT_ID||env.VERCEL_PROJECT_ID!==env.GS_IDENTITY_EXPECTED_PROJECT_ID)return false;
  if(!env.GS_IDENTITY_RESOURCE_ID||!env.GS_IDENTITY_PROXY_TOKEN)return false;
  const db=new URL(env.GS_IDENTITY_DATABASE_URL),origin=new URL(env.GS_IDENTITY_ORIGIN),auth=new URL(env.GS_IDENTITY_AUTH_BASE_URL);
  if(!['postgres:','postgresql:'].includes(db.protocol)||db.pathname!=='/gs_v4_test'||decodeURIComponent(db.username)!=='gs_v4_runtime'||!db.password)return false;
  if(!db.hostname.endsWith('.neon.tech')||db.hostname!==env.GS_IDENTITY_DATABASE_HOST||db.searchParams.get('sslmode')!=='verify-full')return false;
  if(origin.protocol!=='https:'||origin.origin!==env.GS_IDENTITY_ORIGIN||origin.username||origin.password)return false;
  if(auth.origin!==origin.origin||auth.username||auth.password||auth.search||auth.hash||auth.pathname!=='/api/group1-provider')return false;
  if(env.GS_IDENTITY_DATABASE_URL===env.DATABASE_URL||env.GS_IDENTITY_DATABASE_URL===env.GS_FINANCE_DATABASE_URL)return false;
  return true;
 }catch{return false;}
}
function select(env){
 // An explicit but invalid Group 1 setting cannot silently select a different backend.
 if(env.GS_IDENTITY_ENVIRONMENT===undefined)return null;
 if(!configured(env))return {configured:false};
 return {configured:true,databaseUrl:env.GS_IDENTITY_DATABASE_URL,resourceId:env.GS_IDENTITY_RESOURCE_ID,
  authBaseUrl:env.GS_IDENTITY_AUTH_BASE_URL,origin:env.GS_IDENTITY_ORIGIN,proxyToken:env.GS_IDENTITY_PROXY_TOKEN};
}
module.exports={configured,select};
