/** Phase-1 preview: static fictional-data tests only; never call inherited backend bindings. */
export async function onRequest(context){
 const branch=String(context.env.CF_PAGES_BRANCH||''),url=new URL(context.request.url);let pathname;try{pathname=decodeURIComponent(url.pathname).replace(/\/+/g,'/')}catch{pathname='/api/invalid'};
 if(branch.startsWith('fix/v4-p0-security-hardening')&&(pathname==='/api'||pathname.startsWith('/api/'))&&pathname!=='/api/version')
  return new Response(JSON.stringify({error:'DESENVOLVIMENTO — backend bloqueado nesta Fase 1. NÃO UTILIZAR DADOS REAIS.',code:'P0_PREVIEW_BACKEND_LOCKED'}),{status:503,headers:{'content-type':'application/json','cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
 return context.next();
}
