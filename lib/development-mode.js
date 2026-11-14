'use strict';
/* Phase-1 deployments are demonstrative only. No inherited backend credential can enable them. */
function locked(env){return String(env.VERCEL_GIT_COMMIT_REF||env.CF_PAGES_BRANCH||'').startsWith('fix/v4-p0-security-hardening')}
module.exports={locked};
