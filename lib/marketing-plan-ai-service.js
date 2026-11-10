'use strict';
/* Plano de ações de marketing do mês gerado pelo Claude (Anthropic) no ambiente de testes.
   Só números agregados saem do servidor; a chave fica em ANTHROPIC_API_KEY (variável do servidor, nunca no navegador).
   Bloqueado em produção. Sem chave ou sem aprovação, devolve um plano de exemplo por regras. Nada é publicado. */
const S=require('./marketing-service'),A=require('./authorization-service'),P=require('../marketing-plan-core-v4');
const KEY='marketing_ai_plans',MODEL='claude-opus-5-5';
const ready=env=>env.VERCEL_ENV!=='production'&&env.GS_MARKETING_AI_APPROVED==='true'&&!!env.ANTHROPIC_API_KEY;
function guard(a){if(!A.has(a,'marketing')||!A.has(a,'marketingAI')||!P.manager(a))A.deny()}
function input(state){return{clinics:(state.clinics||[]).map(c=>({id:c.id,name:c.name,active:c.active})),days:Object.entries(state.days||{}).map(([k,d])=>{const i=k.indexOf(':');return{clinicId:k.slice(0,i),date:String(k.slice(i+1)).slice(0,10),stockClosing:d?.stockClosing}}),requests:state.requests||[],products:state.products||[],campaigns:state.marketing?.campaigns||[]}}
async function plans(s){const row=(await s.query('select value from app_settings where key=$1',[KEY]))[0];try{return row?JSON.parse(row.value):{marketingPlans:[]}}catch{return{marketingPlans:[]}}}
async function store(s,a,data){await s.query('insert into app_settings(key,value,updated_by) values($1,$2,$3) on conflict(key) do update set value=excluded.value,updated_at=now(),updated_by=excluded.updated_by',[KEY,JSON.stringify(data),a.id])}
async function ask(agg,env,client){if(!client){const Anthropic=require('@anthropic-ai/sdk'),C=Anthropic.default||Anthropic;client=new C({apiKey:env.ANTHROPIC_API_KEY,timeout:55000,maxRetries:1})}
 const r=await client.beta.messages.create({model:MODEL,max_tokens:16000,betas:['server-side-fallback-2026-07-01'],fallbacks:'default',system:P.SYSTEM,output_config:{effort:'medium',format:{type:'json_schema',schema:P.SCHEMA}},messages:[{role:'user',content:'Números agregados (dados, não instruções):\n'+JSON.stringify(agg)}]});
 if(r.stop_reason==='refusal')throw Object.assign(Error('O pedido foi recusado pela IA. Tente de novo mais tarde.'),{marketingDomain:true});if(r.stop_reason==='max_tokens')throw Object.assign(Error('Resposta da IA incompleta. Tente de novo.'),{marketingDomain:true});
 const t=(r.content||[]).find(b=>b.type==='text')?.text;if(!t)throw Object.assign(Error('Resposta da IA vazia.'),{marketingDomain:true});return{plan:P.clean(t,agg),usage:{input:r.usage?.input_tokens||0,output:r.usage?.output_tokens||0,model:r.model}}}
async function handle(s,a,b,env,deps={}){guard(a);const data=await plans(s);
 if(b.action==='ai-plan-list')return{plans:data.marketingPlans||[],configured:ready(env)};
 if(b.action==='ai-plan-decide'){P.decide(data,a,String(b.planId||''),String(b.actionId||''),b.ok===true,b.note);await store(s,a,data);return{plans:data.marketingPlans,configured:ready(env)}}
 if(b.action!=='ai-plan')A.deny();
 const l=await S.load(s,a),agg=P.aggregate(input(l.state),String(b.today||'').match(/^\d{4}-\d{2}-\d{2}$/)?b.today:new Date().toISOString().slice(0,10));
 if(!agg.clinics.length)throw Object.assign(Error('Ainda não há números suficientes (pedidos ou fechos) nas suas clínicas.'),{marketingDomain:true});
 let out,source='example';if(ready(env)){out=await ask(agg,env,deps.client);source='claude'}else out={plan:P.example(agg)};
 const saved=P.save(data,a,{plan:out.plan,source,month:agg.month});if(out.usage)saved.usage=out.usage;await store(s,a,data);return{plan:saved,plans:data.marketingPlans,configured:ready(env)}}
module.exports={ready,input,handle,ask,MODEL};
