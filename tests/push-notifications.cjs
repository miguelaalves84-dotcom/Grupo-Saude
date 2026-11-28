'use strict';
/* Notificações no telemóvel: autorização por aparelho, 1 envio por tarefa por dia, escalada para CEO,
   aparelhos que deixaram de existir são retirados, desligado em produção e sem chaves. */
const assert=require('assert'),Push=require('../lib/push-service'),St=require('../lib/app-state-service'),D=require('../operation-core-v4'),fake=require('./appstate-fake-db.cjs');
let n=0;const pass=l=>{n++;console.log('PASS',l)};
const mem=()=>{const m=new Map();return{m,async list(p){return[...m].filter(([k])=>k.startsWith(p)).map(([key,value])=>({key,value}))},async get(k){return m.get(k)??null},async put(k,v){m.set(k,JSON.parse(JSON.stringify(v)))},async del(k){m.delete(k)}}};
const P=(id,role)=>({id,name:id,role,clinics:['a'],active:true,email:id+'@x.invalid'});
const env={GS_PUSH_VAPID_PUBLIC:'BPublicKeyForTests_x',GS_PUSH_VAPID_PRIVATE:'private-for-tests'};
const sub=e=>({endpoint:'https://push.example.invalid/'+e,keys:{p256dh:'p'.repeat(87),auth:'a'.repeat(22)}});
(async()=>{
 assert.equal((await Push.run({},{})).status,'Desligado');assert.equal((await Push.run({},{...env,VERCEL_ENV:'production'})).status,'Desligado');
 assert.deepEqual(Push.status({}),{enabled:false,publicKey:null});assert.ok(!JSON.stringify(Push.status(env)).includes('private'));pass('off without keys and in production; private key never exposed');
 const db=fake({clinics:[{id:'a',name:'Clínica A',active:true}],people:[P('ceo','CEO'),P('adm','ADMINISTRATIVA'),P('tec','TECNICO/A')]});
 const ceo={...P('ceo','CEO'),permissions:{}};
 await St.write(db.s,ceo,{changes:[{key:'tasks',value:JSON.parse(JSON.stringify(D.defaultTasks)),rev:0}]});
 const store=mem();
 await assert.rejects(()=>Push.subscribe(db.s,{...P('adm','ADMINISTRATIVA')},{subscription:{endpoint:'http://evil',keys:{}}},{store}),/inválida/);
 await Push.subscribe(db.s,P('adm','ADMINISTRATIVA'),{subscription:sub('adm-phone'),device:'Android'},{store});
 await Push.subscribe(db.s,P('ceo','CEO'),{subscription:sub('ceo-phone')},{store});
 await assert.rejects(()=>Push.subscribe(db.s,{...P('adm','ADMINISTRATIVA'),readOnly:true},{subscription:sub('x')},{store}),/leitura/);
 assert.equal((await Push.devices(db.s,P('adm','ADMINISTRATIVA'),{store})).devices,1);pass('each person authorises their own devices; invalid or read-only refused');
 const sent=[];const send=async(s,p)=>{sent.push({to:s.endpoint,...p})};
 let r=await Push.run(db.s,env,{store,send,now:()=>'2026-11-24T08:30:00Z'});
 assert.ok(sent.length>=1&&sent.every(x=>x.to.endsWith('adm-phone')),'only the administrativa gets the day tasks');assert.ok(sent.some(x=>/Clínica A/.test(x.title+x.body)));pass('day tasks are sent to the administrativa on duty');
 const before=sent.length;await Push.run(db.s,env,{store,send,now:()=>'2026-11-24T08:40:00Z'});assert.equal(sent.length,before);pass('each task notified only once per day');
 await Push.run(db.s,env,{store,send,now:()=>'2026-11-24T10:35:00Z'});assert.ok(sent.slice(before).some(x=>x.to.endsWith('ceo-phone')&&/Atrasada/.test(x.title+x.body)));pass('more than 1 hour late reaches the CEO phone');
 const gone=async(s)=>{throw Object.assign(Error('gone'),{statusCode:410})};r=await Push.run(db.s,env,{store,send:gone,now:()=>'2026-11-25T08:30:00Z'});assert.ok(r.removed>=1);assert.equal((await Push.devices(db.s,P('adm','ADMINISTRATIVA'),{store})).devices,0);pass('devices that no longer exist are removed');
 assert.ok(![...store.m.keys()].some(k=>k.startsWith('push:sent:')&&k.includes('2026-11-24')),'old send records cleaned');pass('send records of previous days cleaned');
 await Push.subscribe(db.s,P('adm','ADMINISTRATIVA'),{subscription:sub('adm-phone')},{store});await Push.unsubscribe(db.s,P('adm','ADMINISTRATIVA'),{endpoint:sub('adm-phone').endpoint},{store});assert.equal((await Push.devices(db.s,P('adm','ADMINISTRATIVA'),{store})).devices,0);pass('turning off removes the device');
 console.log(JSON.stringify({passed:n}))})().catch(e=>{console.error('FAIL',e);process.exit(1)});
