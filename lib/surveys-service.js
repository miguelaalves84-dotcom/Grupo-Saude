'use strict';
/* Respostas aos inquéritos anónimos.
   - A resposta é guardada SEM identificação, sem hora exata e sem registo de auditoria com o nome.
   - «Quem já respondeu» fica numa linha à parte, só com um código (não liga à resposta), para impedir
     respostas repetidas (a caixa de sugestões aceita várias).
   - Resultados só para CEO/Administração e só a partir de 3 respostas (para não identificar ninguém). */
const {createHash}=require('node:crypto'),C=require('../surveys-core-v4');
const MIN=3,ANS='survey:answers:',RESP='survey:resp:';
const fail=(m,status=400)=>{throw Object.assign(Error(m),{extDomain:true,status})};
const parse=x=>{try{return typeof x==='string'?JSON.parse(x):x}catch{return null}};
const code=(sid,uid,env)=>createHash('sha256').update(String(env?.GS_SURVEY_SALT||'gs-survey')+'|'+sid+'|'+uid).digest('hex').slice(0,32);
async function definitions(s){const r=(await s.query('select value from app_settings where key=$1',['appstate:surveys']))[0],v=parse(r?.value),list=v&&typeof v==='object'&&'v' in v?v.v:v;return Array.isArray(list)?list:[]}
async function find(s,id){const list=await definitions(s);return list.find(x=>x.id===id)||(id===C.SUGGESTIONS_ID?C.suggestionBox():null)}
async function answer(s,a,b,env={}){if(!a?.id||a.active===false)fail('Sessão inválida.',401);if(a.readOnly)fail('Simulação apenas de leitura.',403);const id=String(b?.surveyId||''),def=await find(s,id);if(!def)fail('Inquérito não encontrado.',404);
 const row=C.answer(def,b?.values);
 if(def.kind!=='suggestions'){const key=RESP+id+':'+code(id,a.id,env),r=await s.query("insert into app_settings(key,value,updated_at) values($1,'true'::jsonb,date_trunc('day',now())) on conflict(key) do nothing returning key",[key]);if(!r.length)fail('Já respondeu a este inquérito.',409)}
 await s.query("insert into app_settings(key,value,updated_at) values($1,$2::jsonb,date_trunc('day',now())) on conflict(key) do update set value=app_settings.value||excluded.value,updated_at=date_trunc('day',now())",[ANS+id,JSON.stringify([row])]);
 return{ok:true}}
async function status(s,a,env={}){if(!a?.id)fail('Sessão inválida.',401);const list=await definitions(s),done=[];for(const d of list){if(d.kind==='suggestions')continue;const r=await s.query('select 1 from app_settings where key=$1',[RESP+d.id+':'+code(d.id,a.id,env)]);if(r.length)done.push(d.id)}return{answered:done}}
async function results(s,a,id){if(!C.manager(a))fail('Resultados só para CEO/Administração.',403);const def=await find(s,String(id||''));if(!def)fail('Inquérito não encontrado.',404);const r=(await s.query('select value from app_settings where key=$1',[ANS+def.id]))[0],rows=parse(r?.value)||[];
 if(rows.length<MIN)return{surveyId:def.id,total:rows.length,hidden:true,minimum:MIN};return C.results(def,rows)}
module.exports={answer,status,results,MIN};
