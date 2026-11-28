/* Inquéritos anónimos (inclui caixa de sugestões e a consulta anual de segurança e saúde no trabalho).
   - Só CEO e Administração criam, publicam, fecham e veem resultados.
   - As respostas nunca guardam quem respondeu: ficam separadas da lista de quem já respondeu
     (que só serve para não responder duas vezes) e sem hora exata.
   - Caixa de sugestões: sempre aberta, pode responder-se várias vezes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GSSurveysCore=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{'use strict';
const fail=(m,status=400)=>{throw Object.assign(Error(m),{status,surveyDomain:true})};
const norm=r=>String(r||'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toUpperCase();
const manager=a=>!!a&&a.active!==false&&!a.readOnly&&['CEO','ADMINISTRACAO'].includes(norm(a.role));
const TYPES={scale:'Escala de 1 a 5',yesno:'Sim / Não',choice:'Escolha',text:'Resposta livre'};
const SCALE=['Discordo totalmente','Discordo','Nem concordo nem discordo','Concordo','Concordo totalmente'];
const CATEGORIES=['Geral','Segurança e saúde','RH','Satisfação'];
const text=(v,n=500)=>String(v??'').trim().slice(0,n);
const SUGGESTIONS_ID='suggestion-box';
function suggestionBox(){return{id:SUGGESTIONS_ID,kind:'suggestions',title:'Caixa de sugestões',category:'Geral',description:'Sempre aberta e anónima. Serve para propor melhorias, assinalar um problema ou deixar um reparo, sem ter de se identificar.',status:'Publicado',questions:[{id:'q1',type:'choice',label:'Assunto',options:['Melhoria','Problema','Reparo','Elogio','Outro'],required:true},{id:'q2',type:'text',label:'A sua sugestão',required:true}]}}
/* Modelo da consulta anual aos trabalhadores (Lei n.º 102/2009, art. 18.º). Fica em rascunho até a gestão rever. */
function sstTemplate(year){const q=(label,type='scale',extra={})=>({label,type,required:type!=='text',...extra});const list=[
 q('Conheço os riscos para a segurança e saúde associados ao meu posto de trabalho.'),
 q('Fui informado(a) sobre as medidas de prevenção e proteção que devo cumprir.'),
 q('Recebi formação suficiente em segurança e saúde no trabalho no último ano.'),
 q('Os equipamentos de proteção individual (luvas, máscaras, batas…) estão sempre disponíveis.'),
 q('Os equipamentos de proteção individual são adequados às tarefas que realizo.'),
 q('Sei como proceder em caso de exposição a material biológico (picada, salpico, contacto).'),
 q('Os resíduos hospitalares e cortantes são separados e recolhidos de forma segura.'),
 q('A limpeza e desinfeção das salas e equipamentos é adequada.'),
 q('As condições do meu posto (iluminação, ruído, temperatura, ventilação) são adequadas.'),
 q('O mobiliário e os equipamentos permitem trabalhar numa postura correta.'),
 q('Tenho apoio ou meios adequados para mobilizar doentes ou cargas pesadas.'),
 q('Os equipamentos (marquesas, aparelhos de fisioterapia, elétricos) estão em bom estado e com manutenção.'),
 q('Sei onde estão os extintores, as saídas de emergência e o plano de evacuação.'),
 q('Sei a quem recorrer e onde está a caixa de primeiros socorros.'),
 q('Já participei num simulacro ou fui informado(a) sobre o procedimento de emergência.'),
 q('A minha carga de trabalho é adequada ao tempo disponível.'),
 q('Consigo fazer as pausas previstas durante o dia de trabalho.'),
 q('Sinto-me respeitado(a) pelos colegas e chefias.'),
 q('Nos últimos 12 meses fui alvo de agressão verbal ou física por parte de utentes.','yesno'),
 q('Nos últimos 12 meses presenciei ou sofri situações de assédio no trabalho.','yesno'),
 q('Sei como comunicar um acidente de trabalho ou um incidente.'),
 q('Quando comunico um problema de segurança, é tratado em tempo útil.'),
 q('A medicina do trabalho (exames de saúde) é feita com a periodicidade devida.'),
 q('Tive algum acidente ou incidente de trabalho nos últimos 12 meses?','yesno'),
 q('Em geral, considero o meu local de trabalho seguro e saudável.'),
 q('Que riscos ou problemas de segurança e saúde gostaria de ver resolvidos?','text'),
 q('Que medidas propõe para melhorar a segurança e saúde no trabalho?','text')];
 return{id:'sst-'+year,kind:'survey',title:'Consulta aos trabalhadores sobre segurança e saúde no trabalho '+year,category:'Segurança e saúde',description:'Consulta anual obrigatória (Lei n.º 102/2009, art. 18.º). As respostas são anónimas: a plataforma não guarda quem respondeu a cada pergunta.',status:'Rascunho',year,questions:list.map((x,i)=>({id:'q'+(i+1),...x}))}}
function clean(def){if(!def||typeof def!=='object')fail('Inquérito inválido.');const title=text(def.title,200);if(!title)fail('Indique o título.');const questions=(Array.isArray(def.questions)?def.questions:[]).slice(0,80).map((q,i)=>{const type=TYPES[q?.type]?q.type:fail('Tipo de pergunta inválido.');const label=text(q.label,400);if(!label)fail('Pergunta '+(i+1)+' sem texto.');const out={id:/^q[\w-]{1,30}$/.test(String(q.id||''))?String(q.id):'q'+(i+1),type,label,required:q.required!==false};if(type==='choice'){out.options=(Array.isArray(q.options)?q.options:[]).map(o=>text(o,120)).filter(Boolean).slice(0,20);if(out.options.length<2)fail('Pergunta '+(i+1)+': indique pelo menos 2 opções.')}return out});if(!questions.length)fail('Junte pelo menos uma pergunta.');if(new Set(questions.map(q=>q.id)).size!==questions.length)fail('Perguntas repetidas.');
 return{id:/^[\w-]{3,60}$/.test(String(def.id||''))?String(def.id):'srv-'+Date.now().toString(36),kind:def.kind==='suggestions'?'suggestions':'survey',title,category:CATEGORIES.includes(def.category)?def.category:'Geral',description:text(def.description,1500),status:['Rascunho','Publicado','Fechado'].includes(def.status)?def.status:'Rascunho',year:def.year||null,questions}}
function list(s,a){const own=Array.isArray(s?.surveys)?s.surveys:[],all=own.some(x=>x.id===SUGGESTIONS_ID)?own:[suggestionBox(),...own];return manager(a)?all:all.filter(x=>x.status==='Publicado')}
/* Resposta: devolve só o que se guarda (sem identificação nem hora exata). */
function answer(def,raw){if(!def||def.status!=='Publicado')fail('Inquérito fechado.',409);const given=raw&&typeof raw==='object'?raw:{},out={};
 for(const q of def.questions){const v=given[q.id];if(v===undefined||v===null||v===''){if(q.required)fail('Responda a: '+q.label);continue}
  if(q.type==='scale'){const n=Number(v);if(!Number.isInteger(n)||n<1||n>5)fail('Resposta inválida em: '+q.label);out[q.id]=n}
  else if(q.type==='yesno'){if(!['Sim','Não'].includes(v))fail('Resposta inválida em: '+q.label);out[q.id]=v}
  else if(q.type==='choice'){if(!q.options.includes(v))fail('Resposta inválida em: '+q.label);out[q.id]=v}
  else{const t=text(v,3000);if(!t&&q.required)fail('Responda a: '+q.label);if(t)out[q.id]=t}}
 return{surveyId:def.id,month:new Date().toISOString().slice(0,7),values:out}}
function results(def,answers){const rows=(answers||[]).filter(x=>x&&x.surveyId===def.id);return{surveyId:def.id,total:rows.length,questions:def.questions.map(q=>{const vals=rows.map(r=>r.values?.[q.id]).filter(v=>v!==undefined);
 if(q.type==='scale'){const counts=[1,2,3,4,5].map(n=>vals.filter(v=>v===n).length);return{...q,answered:vals.length,counts,average:vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10:null}}
 if(q.type==='text')return{...q,answered:vals.length,texts:vals.slice().sort(()=>0)};
 const opts=q.type==='yesno'?['Sim','Não']:q.options;return{...q,answered:vals.length,options:opts,counts:opts.map(o=>vals.filter(v=>v===o).length)}})}}
return{TYPES,SCALE,CATEGORIES,SUGGESTIONS_ID,manager,suggestionBox,sstTemplate,clean,list,answer,results};});
