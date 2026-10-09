/* Deployment identity is informational; it never changes the active user or data. */
(function(){
 'use strict';
 if(document.getElementById('gsDeploymentVersion'))return;
 fetch('/api/version',{cache:'no-store',credentials:'omit'}).then(function(response){if(!response.ok)return null;return response.json()}).then(function(version){
  if(!version||!version.commit||!version.branch)return;
  var badge=document.createElement('span');badge.id='gsDeploymentVersion';badge.textContent='V4 · '+version.commit.slice(0,7);badge.title='Branch: '+version.branch+' · Commit: '+version.commit;
  badge.style.cssText='position:fixed;bottom:6px;right:8px;z-index:20;font:11px system-ui;padding:3px 7px;border-radius:6px;background:var(--surface,#fff);color:var(--muted,#556);border:1px solid var(--border,#ccd);pointer-events:none';
  document.body.appendChild(badge);
 }).catch(function(){/* Static/local builds have no Pages identity endpoint. */});
})();
