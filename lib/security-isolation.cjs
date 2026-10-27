'use strict';
function validate(env){
 if(env.VERCEL_ENV==='production'||env.GS_SECURITY_ENVIRONMENT!=='synthetic-test'||env.GS_IDENTITY_ENGINE!=='better-auth'||!env.GS_IDENTITY_DATABASE_URL||!env.GS_IDENTITY_SECRET||env.GS_IDENTITY_SECRET.length<32)throw Error('ISOLATED_IDENTITY_NOT_CONFIGURED');
 if([env.DATABASE_URL].some(v=>v&&v===env.GS_IDENTITY_DATABASE_URL))throw Error('IDENTITY_DATABASE_MUST_BE_SEPARATE');
 const u=new URL(env.GS_IDENTITY_DATABASE_URL),base=new URL(env.GS_IDENTITY_BASE_URL||''),loopback=['127.0.0.1','localhost'].includes(u.hostname),disposable=env.CI==='true'&&env.GS_SECURITY_SYNTHETIC==='true'&&loopback&&u.pathname==='/gs_v4_security_synthetic';
 if(!['postgres:','postgresql:'].includes(u.protocol)||!disposable)throw Error('ONLY_DISPOSABLE_IDENTITY_DATABASE_AUTHORIZED');
 if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||base.pathname!=='/')throw Error('IDENTITY_ORIGIN_INVALID');
 return{connectionString:u.href,origin:base.origin,disposable};
}
async function marker(pool){const result=await pool.query("select environment from gs_security_environment where id='isolation'");if(result.rows?.[0]?.environment!=='synthetic-only')throw Error('SYNTHETIC_DATABASE_MARKER_REQUIRED')}
module.exports={validate,marker};
