'use strict';
/* Base de dados em memória que entende só as instruções usadas pelo serviço de estado partilhado (testes). */
module.exports=function fakeDb({clinics=[],people=[],employees=[]}={}){const settings=new Map(),audit=[];
 const q=async(t,p=[])=>{t=t.replace(/\s+/g,' ').trim();
  if(t.startsWith("select key,value from app_settings where key like 'appstate:%'"))return[...settings].filter(([k])=>k.startsWith('appstate:')&&k!==p[0]).map(([key,value])=>({key,value}));
  if(t.startsWith('insert into app_settings(key,value,updated_at) values($1,\'{"n":1}\'')){const cur=settings.get(p[0]);const n=cur?Number(cur.n)+1:1;settings.set(p[0],{n});return[{value:{n}}]}
  if(t.startsWith('select value from app_settings where key=$1')){const v=settings.get(p[0]);return v?[{value:v}]:[]}
  if(t.startsWith('insert into app_settings(key,value,updated_at) values($1,$2::jsonb,now()) on conflict(key) do nothing')){if(settings.has(p[0]))return[];settings.set(p[0],JSON.parse(p[1]));return[{key:p[0]}]}
  if(t.startsWith('update app_settings set value=$2::jsonb')){const cur=settings.get(p[0]);if(!cur||Number(cur.rev)!==Number(p[2]))return[];settings.set(p[0],JSON.parse(p[1]));return[{key:p[0]}]}
  if(t.startsWith('update app_settings set value=value||')){const cur=settings.get(p[0]);if(cur)settings.set(p[0],{...cur,deleted:true});return[]}
  if(t.startsWith('select id,name,active from clinics'))return clinics;
  if(t.startsWith('select user_id,data from employees'))return employees;
  if(t.startsWith('insert into audit_log')){audit.push(p);return[]}
  throw Error('SQL não esperado: '+t.slice(0,90))};
 return{s:{query:q,people:async()=>people},settings,audit}};
