'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function fixture(){
 let clock=1000,next=0;const pending=[],timers=new Map(),events=[];
 const window={dispatchEvent:e=>events.push(e.type)},context={window,CustomEvent:class{constructor(type){this.type=type}},Date:{now:()=>clock,parse:Date.parse},URLSearchParams,fetch:()=>new Promise(resolve=>pending.push(resolve)),setTimeout:fn=>{timers.set(++next,fn);return next},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(fs.readFileSync('session-v4.js','utf8'),context);
 const respond=(index,user='user-a',status=200,expiresAt=new Date(5000).toISOString())=>pending[index]({ok:status===200,status,json:async()=>({user:{id:user,permissions:{account:true},clinics:['synthetic-clinic']},expiresAt})});
 return{api:window.GSSessionV4,pending,respond,events,advance:at=>{clock=at;for(const [id,fn]of [...timers]){timers.delete(id);fn()}},timers};
}
(async()=>{
 let passed=0;
 async function test(name,run){await run();passed++;console.log('PASS session: '+name)}
 await test('verified response and expiry remove client identity',async()=>{const f=fixture(),p=f.api.refresh();f.respond(0);await p;assert.equal(f.api.user.id,'user-a');f.advance(5001);assert.equal(f.api.user,null);assert.equal(f.events.filter(x=>x==='gs-session-ended').length,1)});
 await test('missing expiry fails closed',async()=>{const f=fixture(),p=f.api.refresh();f.respond(0,'user-a',200,null);await assert.rejects(p,/inválida/);assert.equal(f.api.user,null)});
 await test('expired session fails closed',async()=>{const f=fixture(),p=f.api.refresh();f.respond(0,'user-a',200,new Date(999).toISOString());await assert.rejects(p,/expirada/);assert.equal(f.api.user,null)});
 await test('logout invalidates pending refresh even when logout fails',async()=>{const f=fixture(),p=f.api.refresh(),logout=f.api.signOut();f.respond(1,'user-a',503);await assert.rejects(logout);f.respond(0);assert.equal(await p,null);assert.equal(f.api.user,null)});
 await test('latest refresh wins between identities',async()=>{const f=fixture(),a=f.api.refresh(),b=f.api.refresh();f.respond(1,'user-b');await b;f.respond(0,'user-a');assert.equal(await a,null);assert.equal(f.api.user.id,'user-b')});
 await test('late unauthorized request does not end newer identity',async()=>{const f=fixture(),old=f.api.data.call('bootstrap'),newer=f.api.refresh();f.respond(1,'user-b');await newer;f.respond(0,'user-a',401);await assert.rejects(old);assert.equal(f.api.user.id,'user-b');assert.equal(f.events.filter(x=>x==='gs-session-ended').length,0)});
 await test('current unauthorized response closes session once',async()=>{const f=fixture(),p=f.api.refresh();f.respond(0,'user-a',401);await assert.rejects(p);assert.equal(f.api.user,null);assert.equal(f.events.filter(x=>x==='gs-session-ended').length,1)});
 await test('late successful data cannot cross between identities',async()=>{const f=fixture(),old=f.api.data.call('bootstrap'),newer=f.api.refresh();f.respond(1,'user-b');await newer;f.respond(0,'user-a');await assert.rejects(old,/Dados anteriores descartados/);assert.equal(f.api.user.id,'user-b')});
 await test('permission and clinic snapshots cannot be mutated',async()=>{const f=fixture(),p=f.api.refresh();f.respond(0);await p;assert.throws(()=>{f.api.user.permissions.account=false},TypeError);assert.throws(()=>f.api.user.clinics.push('other'),e=>e.name==='TypeError');assert.equal(f.api.user.permissions.account,true)});
 await test('module replies are discarded after an identity change',async()=>{const f=fixture(),old=f.api.modules.call('stock',{clinicId:'synthetic-clinic'}),newer=f.api.refresh();f.respond(1,'user-b');await newer;f.respond(0,'user-a');await assert.rejects(old,/Dados anteriores descartados/);assert.equal(f.api.user.id,'user-b')});
 await test('forbidden module action revalidates identity without logging out a valid session',async()=>{const f=fixture(),first=f.api.refresh();f.respond(0);await first;const call=f.api.modules.call('stock',{clinicId:'forbidden'});f.respond(1,'user-a',403);for(let i=0;i<8&&!f.pending[2];i++)await Promise.resolve();assert(f.pending[2]);f.respond(2);await assert.rejects(call);assert.equal(f.api.user.id,'user-a');assert.equal(f.events.filter(x=>x==='gs-session-ended').length,0)});
 await test('a revoked identity closes during forbidden-module revalidation',async()=>{const f=fixture(),first=f.api.refresh();f.respond(0);await first;const call=f.api.modules.call('stock',{clinicId:'synthetic-clinic'});f.respond(1,'user-a',403);for(let i=0;i<8&&!f.pending[2];i++)await Promise.resolve();f.respond(2,'user-a',403);await assert.rejects(call);assert.equal(f.api.user,null)});
 console.log(JSON.stringify({passed,failed:0,scope:'VM, synthetic identity responses; no real provider or database'}));
})().catch(e=>{console.error(e);process.exitCode=1});
