/** Read-only deployment identity. Never exposes configuration or credentials. */
export function onRequest({env,request}){
 if(request.method!=='GET'&&request.method!=='HEAD')return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
 const commit=/^[0-9a-f]{40}$/i.test(env.CF_PAGES_COMMIT_SHA||'')?env.CF_PAGES_COMMIT_SHA:null;
 const branch=String(env.CF_PAGES_BRANCH||'').slice(0,200)||null;
 const body=JSON.stringify({application:'Grupo Saúde V4',commit,branch,source:'Cloudflare Pages'});
 return new Response(request.method==='HEAD'?null:body,{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
}
