'use strict';
/* Anexos do Chat guardados no servidor: quem envia e quem recebe (membros da conversa) descarregam-nos em qualquer
   aparelho durante 30 dias. Depois desse prazo são apagados. O ficheiro fica numa chave própria (app_settings
   «chatfile:<id>»), fora das conversas, para não pesar na sincronização. */
const TTL=30*24*60*60*1000,KEY='chatfile:',MAX=3*1024*1024;
const fail=(m,status=400)=>{throw Object.assign(Error(m),{extDomain:true,status})};
const parse=x=>{try{return typeof x==='string'?JSON.parse(x):x}catch{return null}};
function mimeOf(b){if(b.subarray(0,5).toString()==='%PDF-')return'application/pdf';if(b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255)return'image/jpeg';if(b.length>=8&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return'image/png';return null}
async function conversations(s){const r=(await s.query('select value from app_settings where key=$1',['appstate:conversations']))[0],v=parse(r?.value);const list=v&&typeof v==='object'&&'v' in v?v.v:v;return Array.isArray(list)?list:[]}
const member=(c,a)=>Array.isArray(c?.members)&&c.members.map(String).includes(String(a.id));
async function put(s,a,b,now=Date.now()){if(!a?.id||a.active===false)fail('Sessão inválida.',401);if(a.readOnly)fail('Simulação apenas de leitura.',403);
 const id=String(b?.id||''),cid=String(b?.conversationId||'');if(!/^chat-file-[A-Za-z0-9-]{8,80}$/.test(id)||!cid)fail('Anexo inválido.');
 const c=(await conversations(s)).find(x=>String(x?.id)===cid);if(!c||!member(c,a))fail('Só pode anexar ficheiros em conversas de que faz parte.',403);
 const m=/^data:([a-z/+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(b?.dataUrl||''));if(!m)fail('Ficheiro inválido.');const bytes=Buffer.from(m[2],'base64');if(!bytes.length||bytes.length>MAX)fail('Ficheiro até 3 MB.',413);const mime=mimeOf(bytes);if(!mime||mime!==m[1])fail('Só PDF, JPEG ou PNG.',415);
 if((await s.query('select 1 from app_settings where key=$1',[KEY+id])).length)fail('Anexo repetido.',409);
 const value={conversationId:cid,name:String(b.name||'documento').split(/[\\/]/).at(-1).slice(0,200),mime,size:bytes.length,data:m[2],uploadedBy:String(a.id),at:new Date(now).toISOString()};
 await s.query("insert into app_settings(key,value,updated_at) values($1,$2::jsonb,now())",[KEY+id,JSON.stringify(value)]);
 /* limpeza: anexos com mais de 30 dias deixam de existir */
 await s.query("delete from app_settings where key like 'chatfile:%' and (value->>'at')::timestamptz < $1::timestamptz",[new Date(now-TTL).toISOString()]).catch(()=>{});
 return{ok:true,id,expiresAt:new Date(now+TTL).toISOString()}}
async function get(s,a,id,now=Date.now()){if(!a?.id||a.active===false)fail('Sessão inválida.',401);const r=(await s.query('select value from app_settings where key=$1',[KEY+String(id||'')]))[0],f=parse(r?.value);if(!f)fail('Anexo não encontrado ou expirado.',404);
 if(now>=Date.parse(f.at)+TTL)fail('Anexo expirado — download indisponível.',410);
 const c=(await conversations(s)).find(x=>String(x?.id)===String(f.conversationId));if(!c||!member(c,a))fail('Anexo não autorizado.',403);
 return{name:f.name,mime:f.mime,data:Buffer.from(f.data,'base64')}}
module.exports={TTL,put,get,mimeOf};
