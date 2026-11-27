'use strict';
/* Anexos do Chat no servidor: quem envia e quem recebe (membros) descarregam; outros não; expira aos 30 dias. */
const assert=require('node:assert/strict'),F=require('../lib/chat-files-service');let n=0;
const test=async(name,fn)=>{await fn();n++;console.log('PASS',name)};
function db(convs){const m=new Map([['appstate:conversations',JSON.stringify({v:convs,rev:1})]]);return{m,async query(sql,p){
 if(/^select value from app_settings where key=\$1/.test(sql)){const v=m.get(p[0]);return v?[{value:v}]:[]}
 if(/^select 1 from app_settings/.test(sql))return m.has(p[0])?[{}]:[];
 if(/^insert into app_settings/.test(sql)){m.set(p[0],p[1]);return[]}
 if(/^delete from app_settings where key like 'chatfile:%'/.test(sql)){for(const [k,v] of m)if(k.startsWith('chatfile:')&&Date.parse(JSON.parse(v).at)<Date.parse(p[0]))m.delete(k);return[]}
 throw Error('SQL inesperado: '+sql)}}}
const pdf='data:application/pdf;base64,'+Buffer.from('%PDF-1.4 SYN').toString('base64');
const ana={id:'a',active:true},rui={id:'r',active:true},eva={id:'e',active:true},convs=[{id:'c1',members:['a','r']}],t0=Date.parse('2026-11-01T10:00:00Z');
(async()=>{
 await test('sender stores file for a conversation she is in; receiver downloads on another device',async()=>{const s=db(convs);const r=await F.put(s,ana,{id:'chat-file-aaaaaaaa',conversationId:'c1',name:'SYN.pdf',dataUrl:pdf},t0);assert.equal(r.ok,true);const f=await F.get(s,rui,'chat-file-aaaaaaaa',t0+1000);assert.equal(f.mime,'application/pdf');assert.equal(f.data.toString(),'%PDF-1.4 SYN');assert.equal((await F.get(s,ana,'chat-file-aaaaaaaa',t0)).name,'SYN.pdf')});
 await test('non-member cannot upload nor download',async()=>{const s=db(convs);await assert.rejects(F.put(s,eva,{id:'chat-file-bbbbbbbb',conversationId:'c1',name:'x.pdf',dataUrl:pdf},t0),e=>e.status===403);await F.put(s,ana,{id:'chat-file-bbbbbbbb',conversationId:'c1',name:'x.pdf',dataUrl:pdf},t0);await assert.rejects(F.get(s,eva,'chat-file-bbbbbbbb',t0),e=>e.status===403)});
 await test('removed member loses access',async()=>{const c=[{id:'c1',members:['a','r']}],s=db(c);await F.put(s,ana,{id:'chat-file-cccccccc',conversationId:'c1',name:'x.pdf',dataUrl:pdf},t0);s.m.set('appstate:conversations',JSON.stringify({v:[{id:'c1',members:['a']}],rev:2}));await assert.rejects(F.get(s,rui,'chat-file-cccccccc',t0),e=>e.status===403)});
 await test('30 days: available 1 ms before, refused at the limit, deleted afterwards',async()=>{const s=db(convs);await F.put(s,ana,{id:'chat-file-dddddddd',conversationId:'c1',name:'x.pdf',dataUrl:pdf},t0);assert.ok(await F.get(s,rui,'chat-file-dddddddd',t0+F.TTL-1));await assert.rejects(F.get(s,rui,'chat-file-dddddddd',t0+F.TTL),e=>e.status===410);await F.put(s,ana,{id:'chat-file-eeeeeeee',conversationId:'c1',name:'y.pdf',dataUrl:pdf},t0+F.TTL+1);assert.equal(s.m.has('chatfile:chat-file-dddddddd'),false)});
 await test('only real PDF/JPEG/PNG; disguised file and duplicate id refused',async()=>{const s=db(convs);await assert.rejects(F.put(s,ana,{id:'chat-file-ffffffff',conversationId:'c1',name:'x.pdf',dataUrl:'data:application/pdf;base64,'+Buffer.from('<script>').toString('base64')},t0),e=>e.status===415);await F.put(s,ana,{id:'chat-file-gggggggg',conversationId:'c1',name:'x.pdf',dataUrl:pdf},t0);await assert.rejects(F.put(s,ana,{id:'chat-file-gggggggg',conversationId:'c1',name:'x.pdf',dataUrl:pdf},t0),e=>e.status===409)});
 console.log(JSON.stringify({passed:n}))})().catch(e=>{console.error(e);process.exit(1)});
