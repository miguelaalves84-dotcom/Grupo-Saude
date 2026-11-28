/** OAuth callback is forwarded only to the configured isolated backend. No tokens in the browser. */
export async function onRequest({request,env}){
 const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','referrer-policy':'no-referrer'},error=(status,message)=>new Response(JSON.stringify({error:message}),{status,headers}),url=new URL(request.url);
 if(request.method!=='GET'||['main','master'].includes(env.CF_PAGES_BRANCH)||env.GS_ENVIRONMENT!=='preview'||!env.GS_FINANCE_PROXY_TOKEN)return error(503,'Callback Gmail de teste não configurado.');
 if(!(env.GS_PREVIEW_ORIGINS||'').split(',').map(x=>x.trim()).includes(url.origin))return error(403,'Origem não autorizada.');
 let backend;try{backend=new URL(env.GS_FINANCE_BACKEND_URL);if(backend.protocol!=='https:'||backend.pathname!=='/'||backend.username||backend.password||backend.search||backend.hash)throw Error();}catch{return error(503,'Backend de teste inválido.');}
 if(!request.headers.get('cookie')||url.search.length>10000)return error(401,'Autentique-se antes de ligar o Gmail.');
 const target=new URL('/api/v4-gmail-callback',backend);for(const key of ['state','code','error'])if(url.searchParams.has(key))target.searchParams.set(key,url.searchParams.get(key));
 try{const r=await fetch(target,{redirect:'manual',signal:AbortSignal.timeout(25000),headers:{authorization:'Bearer '+env.GS_FINANCE_PROXY_TOKEN,'x-gs-origin':url.origin,cookie:request.headers.get('cookie')}});if(r.status===302&&r.headers.get('location')===url.origin+'/finance.html?view=emails&gmail=connected')return new Response(null,{status:302,headers:{...headers,location:r.headers.get('location')}});return error(400,'Ligação Gmail não confirmada. Inicie novamente na Lista de Emails.');}catch{return error(502,'Serviço OAuth indisponível. Nenhuma ligação confirmada.');}
}
