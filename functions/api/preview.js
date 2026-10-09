/** Proxy Cloudflare exclusivo de preview. Nenhum acesso ao backend até configuração explícita. */
export async function onRequest({request,env}) {
 const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
 const reply=(status,error)=>new Response(JSON.stringify({error}),{status,headers});
 if(env.GS_ENVIRONMENT!=='preview'||!env.GS_TEST_BACKEND_URL||!env.GS_TEST_BACKEND_TOKEN)return reply(503,'Integração de teste não configurada.');
 let backend;try{backend=new URL(env.GS_TEST_BACKEND_URL);if(backend.protocol!=='https:'||backend.username||backend.password||backend.search||backend.hash||backend.pathname!=='/')throw Error();}catch{return reply(503,'Configuração de backend inválida.');}
 const url=new URL(request.url),origin=request.headers.get('origin');
 if(!env.GS_PREVIEW_ORIGINS?.split(',').map(x=>x.trim()).includes(url.origin))return reply(403,'Preview não autorizado.');
 if(origin&&origin!==url.origin)return reply(403,'Origem não autorizada.');
 const action=url.searchParams.get('action'),routes={session:['GET','/auth/session'],signIn:['POST','/auth/sign-in'],requestReset:['POST','/auth/request-reset'],reset:['POST','/auth/reset'],changeEmail:['POST','/auth/change-email'],signOut:['POST','/auth/sign-out'],importCV:['POST','/integrations/cv/import'],runEmails:['POST','/integrations/email/run']};
 const route=routes[action];if(!route||request.method!==route[0])return reply(405,'Método ou ação não permitido.');
 if(request.method==='POST'&&(!origin||request.headers.get('content-type')?.split(';')[0]!=='application/json'))return reply(403,'Pedido inválido.');
 let body;if(request.method==='POST'){if(Number(request.headers.get('content-length'))>65536)return reply(413,'Pedido demasiado grande.');body=await request.text();if(new TextEncoder().encode(body).length>65536)return reply(413,'Pedido demasiado grande.');try{JSON.parse(body)}catch{return reply(400,'JSON inválido.');}}
 try{const response=await fetch(new URL(route[1],backend),{method:request.method,body,redirect:'error',signal:AbortSignal.timeout(10000),headers:{'content-type':'application/json','authorization':'Bearer '+env.GS_TEST_BACKEND_TOKEN,'cookie':request.headers.get('cookie')||'','x-preview-origin':url.origin}});
 if(!response.headers.get('content-type')?.includes('application/json'))return reply(502,'Resposta inválida do serviço de teste.');
 const result=new Response(await response.text(),{status:response.status,headers});
 // O backend deve emitir exclusivamente cookies de sessão seguros e restritos ao caminho.
 const cookies=response.headers.getSetCookie?.()||[];for(const cookie of cookies){if(!/;\s*HttpOnly(?:;|$)/i.test(cookie)||!/;\s*Secure(?:;|$)/i.test(cookie)||!/;\s*SameSite=(Strict|Lax)(?:;|$)/i.test(cookie)||/;\s*Domain=/i.test(cookie))return reply(502,'Cookie de sessão inseguro.');result.headers.append('set-cookie',cookie)}return result;
 }catch{return reply(502,'Serviço de teste indisponível. Nenhuma operação confirmada.');}
}
