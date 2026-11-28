/* Avaliação e questionários: propostas e eventos append-only, sem decisões financeiras. */
(() => {
  'use strict';
  const L=window.HRLeaveV4,KEY='grupo_saude_v4_demo_2';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const read=()=>L.read(),write=s=>localStorage.setItem(KEY,JSON.stringify(s));
  const uid=p=>p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,9);
  const now=()=>new Date().toISOString();
  const actor=s=>L.person(s,s.currentUser);
  const known=s=>!!actor(s).name&&actor(s).active!==false;
  const ceo=s=>known(s)&&(String(s.currentUser)==='u1'||L.norm(actor(s).role||actor(s).kind)==='CEO');
  const canManage=s=>known(s)&&L.canTeam(s)&&L.permission(s,'hrManage')&&L.permission(s,'performanceManage');
  const canSelf=s=>known(s)&&L.permission(s,'performanceRead');
  const canPeer=s=>known(s)&&L.permission(s,'peerReview');
  const people=s=>[...new Set([...(s.users||[]).map(p=>String(p.id)),...Object.keys(s.employees||{})])].map(id=>L.person(s,id)).filter(p=>p.name&&p.active!==false&&!p._new);
  const defaults=()=>({criteria:[['attendance','Assiduidade',15],['punctuality','Pontualidade',15],['productivity','Produtividade',20],['quality','Qualidade',20],['tasks','Tarefas',15],['teamwork','Trabalho em equipa',15]].map(([id,label,weight])=>({id,label,weight})),peerCriteria:[['cooperation','Cooperação',34],['communication','Comunicação',33],['professionalism','Profissionalismo',33]].map(([id,label,weight])=>({id,label,weight})),threshold:3,peerEnabled:false});
  function text(value,label,max=3000,required=false){if(typeof value!=='string'||value.length>max||required&&!value.trim())throw Error(label+' inválido.');return value.trim()}
  function criteria(input){
    if(!Array.isArray(input)||input.length<1||input.length>12)throw Error('Defina entre 1 e 12 critérios.');
    const out=input.map(c=>{const id=text(c.id,'Identificador',60,true),label=text(c.label,'Critério',100,true),weight=Number(c.weight);if(!/^[a-z0-9_-]+$/i.test(id)||!Number.isFinite(weight)||weight<=0||weight>100)throw Error('Critérios/pesos inválidos.');return{id,label,weight}});
    if(new Set(out.map(c=>c.id)).size!==out.length||new Set(out.map(c=>L.norm(c.label))).size!==out.length||Math.abs(out.reduce((n,c)=>n+c.weight,0)-100)>0.00001)throw Error('Critérios únicos e pesos com total de 100% são obrigatórios.');return out;
  }
  function rules(s=read()){return clone((s.hrPerformanceRuleVersions||[]).at(-1)||defaults())}
  function approveRules(input,reason){
    const s=read();if(!ceo(s))throw Error('Só o CEO pode validar regras.');reason=text(reason,'Motivo',1000,true);
    const threshold=Number(input.threshold);if(!Number.isInteger(threshold)||threshold<3||threshold>10)throw Error('O limiar de anonimato deve estar entre 3 e 10 respostas.');
    const x={id:uid('perfrules'),version:(s.hrPerformanceRuleVersions||[]).length+1,criteria:criteria(input.criteria),peerCriteria:criteria(input.peerCriteria),threshold,peerEnabled:input.peerEnabled===true,approvedBy:String(s.currentUser),approvedAt:now(),reason};
    (s.hrPerformanceRuleVersions||=[]).push(x);audit(s,'Regras de desempenho validadas',x.id);write(s);return clone(x);
  }
  function period(kind,value){
    let y,m,start,end,label=value;
    if(kind==='Mensal'&&/^\d{4}-\d{2}$/.test(value)){[y,m]=value.split('-').map(Number);if(m<1||m>12)throw Error('Mês inválido.');start=value+'-01';end=new Date(Date.UTC(y,m,0,12)).toISOString().slice(0,10)}
    else if(kind==='Trimestral'&&/^\d{4}-T[1-4]$/.test(value)){y=Number(value.slice(0,4));m=(Number(value.at(-1))-1)*3+1;start=y+'-'+String(m).padStart(2,'0')+'-01';end=new Date(Date.UTC(y,m+2,0,12)).toISOString().slice(0,10)}
    else if(kind==='Anual'&&/^\d{4}$/.test(value)){y=Number(value);start=value+'-01-01';end=value+'-12-31'}
    else throw Error('Use mês AAAA-MM, trimestre AAAA-T1…T4 ou ano AAAA.');
    if(y<2000||y>2100)throw Error('Ano fora do intervalo permitido.');L.date(start);L.date(end);return{kind,value:label,start,end};
  }
  function score(criteria,answers){
    if(!answers||typeof answers!=='object'||Array.isArray(answers))throw Error('Indique as pontuações.');
    if(Object.keys(answers).length!==criteria.length||Object.keys(answers).some(k=>!criteria.some(c=>c.id===k)))throw Error('Responda a todos os critérios definidos.');
    const scores={};let total=0;for(const c of criteria){const v=answers[c.id];if(typeof v!=='number'||!Number.isFinite(v)||v<1||v>5)throw Error('Pontuações devem estar entre 1 e 5.');scores[c.id]=v;total+=v*c.weight/100}return{scores,score:Math.round(total*100)/100};
  }
  function audit(s,action,recordId,personId=''){(s.audit||=[]).unshift({id:uid('audit'),at:now(),module:'RH — Desempenho',action,recordId,by:String(s.currentUser),userId:personId,detail:action})}
  function eventStatus(s,id){return(s.hrPerformanceEvents||[]).filter(e=>e.evaluationId===id).at(-1)?.action||'Proposta'}
  function submitEvaluation(input){
    const s=read();if(!canManage(s))throw Error('Sem autorização para propor avaliações.');const r=rules(s);if(!r.id)throw Error('O CEO deve validar as regras primeiro.');
    const p=L.person(s,String(input.employeeId));if(!p.name||p.active===false||p._new)throw Error('Colaborador inválido.');
    const span=period(input.kind,input.period),values=score(r.criteria,input.scores),feedback=text(input.feedback,'Feedback',3000,true),reason=text(input.reason||'Nova avaliação','Motivo',1000,true);
    if(!Array.isArray(input.objectives)||input.objectives.length>10)throw Error('Defina até 10 objetivos.');
    const objectives=input.objectives.map(o=>{const title=text(o.title,'Objetivo',300,true),target=text(o.target||'','Meta',300),progress=o.progress??0;if(typeof progress!=='number'||!Number.isFinite(progress)||progress<0||progress>100)throw Error('Progresso deve estar entre 0 e 100%.');return{title,target,progress}});
    const same=(s.hrPerformance||[]).filter(e=>e.schemaVersion===1&&e.employeeId===p.id&&e.period.kind===span.kind&&e.period.value===span.value);
    if(same.some(e=>eventStatus(s,e.id)==='Proposta'))throw Error('Já existe uma proposta pendente para este período.');
    const published=same.filter(e=>eventStatus(s,e.id)==='Validada').at(-1);
    if(published&&String(input.supersedes)!==published.id)throw Error('Uma revisão deve referenciar a avaliação validada anterior.');
    if(input.supersedes&&!published)throw Error('A avaliação a rever não é válida para este período.');
    const x={id:uid('evaluation'),schemaVersion:1,employeeId:p.id,employeeName:p.name,period:span,rules:clone(r),criteria:clone(r.criteria),...values,feedback,objectives,reason,supersedes:published?.id||null,createdBy:String(s.currentUser),createdAt:now()};
    (s.hrPerformance||=[]).push(x);audit(s,'Avaliação proposta',x.id,p.id);write(s);return clone(x);
  }
  function decideEvaluation(id,action,reason){
    const s=read();if(!ceo(s))throw Error('Só o CEO pode validar ou recusar avaliações.');
    if(!['Validada','Recusada'].includes(action))throw Error('Decisão inválida.');reason=text(reason,'Motivo da decisão',1000,true);
    const x=(s.hrPerformance||[]).find(x=>x.id===id&&x.schemaVersion===1);if(!x||eventStatus(s,id)!=='Proposta')throw Error('A proposta já foi decidida ou não existe.');
    const e={id:uid('perfevent'),evaluationId:id,action,reason,by:String(s.currentUser),at:now()};(s.hrPerformanceEvents||=[]).push(e);audit(s,'Avaliação '+action.toLowerCase(),id,x.employeeId);
    if(action==='Validada')(s.alerts||=[]).unshift({id:uid('alert'),to:x.employeeId,userId:x.employeeId,module:'RH',title:'Decisão sobre avaliação de desempenho',action:'performanceDetail',entityId:id,createdAt:now(),read:false,status:'Ativo'});
    write(s);return clone(e);
  }
  function evaluations(employeeId=''){
    const s=read();if(!canManage(s)&&!canSelf(s))throw Error('Sem autorização para consultar avaliações.');
    if(employeeId&&!canManage(s)&&String(employeeId)!==String(s.currentUser))throw Error('Só pode consultar as suas avaliações.');
    const list=(s.hrPerformance||[]).filter(x=>x.schemaVersion===1&&(!employeeId||x.employeeId===String(employeeId))&&(canManage(s)||x.employeeId===String(s.currentUser)&&eventStatus(s,x.id)==='Validada'));
    return list.map(x=>({...clone(x),status:eventStatus(s,x.id),history:clone((s.hrPerformanceEvents||[]).filter(e=>e.evaluationId===x.id))}));
  }
  function cycleStatus(s,id){return(s.hrPeerCycleEvents||[]).some(e=>e.cycleId===id&&e.action==='Fechado')?'Fechado':'Aberto'}
  function openCycle(input){
    const s=read();if(!ceo(s))throw Error('Só o CEO pode abrir ciclos entre colegas.');const r=rules(s);if(!r.id||!r.peerEnabled)throw Error('O CEO deve validar e ativar os questionários primeiro.');
    const cid=String(input.clinicId),c=(s.clinics||[]).find(c=>String(c.id)===cid&&c.active!==false);if(!c)throw Error('Clínica inválida.');
    const span=period(input.kind,input.period);if((s.hrPeerCycles||[]).some(c=>c.clinicId===cid&&c.period.start<=span.end&&c.period.end>=span.start))throw Error('Já existe um ciclo para esta clínica num período sobreposto.');
    const members=people(s).filter(p=>L.clinics(p).includes(cid)).map(p=>p.id);if(members.length<r.threshold+1)throw Error('A clínica não tem membros suficientes para o limiar de anonimato.');
    const x={id:uid('peercycle'),clinicId:cid,clinicName:c.name,period:span,members,rules:clone(r),criteria:clone(r.peerCriteria),threshold:r.threshold,createdBy:String(s.currentUser),createdAt:now(),reason:text(input.reason,'Motivo',1000,true)};
    (s.hrPeerCycles||=[]).push(x);audit(s,'Ciclo de questionários aberto',x.id);write(s);return publicCycle(s,x);
  }
  function accessibleCycle(s,x){return canManage(s)||canPeer(s)&&x.members.includes(String(s.currentUser))&&L.clinics(actor(s)).includes(x.clinicId)}
  function publicCycle(s,x){return{id:x.id,clinicId:x.clinicId,clinicName:x.clinicName,period:clone(x.period),criteria:clone(x.criteria),threshold:x.threshold,status:cycleStatus(s,x.id),canRespond:canPeer(s)&&x.members.includes(String(s.currentUser))&&L.clinics(actor(s)).includes(x.clinicId)&&cycleStatus(s,x.id)==='Aberto'&&rules(s).peerEnabled}}
  function cycles(){const s=read();return(s.hrPeerCycles||[]).filter(x=>accessibleCycle(s,x)).map(x=>publicCycle(s,x))}
  function peerTargets(id){
    const s=read(),c=(s.hrPeerCycles||[]).find(c=>c.id===id);if(!c||!canPeer(s)||!c.members.includes(String(s.currentUser))||!L.clinics(actor(s)).includes(c.clinicId))throw Error('Sem autorização para responder a este ciclo.');
    return c.members.filter(id=>id!==String(s.currentUser)).map(id=>L.person(s,id)).filter(p=>p.name&&p.active!==false&&L.clinics(p).includes(c.clinicId)).map(p=>({id:p.id,name:p.name,submitted:(s.hrPeerResponses||[]).some(r=>r.cycleId===c.id&&r.reviewerId===String(s.currentUser)&&r.targetId===p.id)}));
  }
  function submitPeer(cycleId,targetId,answers){
    const s=read(),c=(s.hrPeerCycles||[]).find(c=>c.id===cycleId);if(!c||cycleStatus(s,c.id)!=='Aberto'||!canPeer(s)||!rules(s).peerEnabled)throw Error('O questionário não está disponível.');
    const reviewer=String(s.currentUser),target=String(targetId),p=L.person(s,target);
    if(reviewer===target||!c.members.includes(reviewer)||!c.members.includes(target)||!L.clinics(actor(s)).includes(c.clinicId)||!L.clinics(p).includes(c.clinicId)||p.active===false)throw Error('Só pode avaliar outros membros da sua clínica no ciclo atribuído.');
    if((s.hrPeerResponses||[]).some(r=>r.cycleId===cycleId&&r.reviewerId===reviewer&&r.targetId===target))throw Error('Já respondeu para este colega; respostas submetidas não podem ser alteradas.');
    const values=score(c.criteria,answers);(s.hrPeerResponses||=[]).push({id:uid('peerresponse'),cycleId,reviewerId:reviewer,targetId:target,scores:values.scores,createdAt:now()});
    // Sem avaliador, destinatário ou pontuações no log geral, para não criar um trilho público de pares.
    (s.hrPeerPrivateEvents||=[]).push({id:uid('peerevent'),cycleId,reviewerId:reviewer,targetId:target,action:'Submetido',at:now()});write(s);return{submitted:true};
  }
  function closeCycle(id,reason){
    const s=read(),c=(s.hrPeerCycles||[]).find(c=>c.id===id);if(!ceo(s)||!c)throw Error('Só o CEO pode fechar ciclos.');if(cycleStatus(s,id)!=='Aberto')throw Error('O ciclo já foi fechado.');reason=text(reason,'Motivo',1000,true);
    const aggregates=c.members.map(targetId=>{const rs=(s.hrPeerResponses||[]).filter(r=>r.cycleId===id&&r.targetId===targetId&&r.reviewerId!==targetId&&c.members.includes(r.reviewerId));const unique=[...new Map(rs.map(r=>[r.reviewerId,r])).values()];
      if(unique.length<c.threshold)return{cycleId:id,targetId,released:false};
      const scores={};for(const criterion of c.criteria)scores[criterion.id]=Math.round(unique.reduce((n,r)=>n+r.scores[criterion.id],0)/unique.length*10)/10;
      return{cycleId:id,targetId,released:true,scores,score:Math.round(c.criteria.reduce((n,criterion)=>n+scores[criterion.id]*criterion.weight/100,0)*10)/10};});
    (s.hrPeerResults||=[]).push(...aggregates);(s.hrPeerCycleEvents||=[]).push({id:uid('cycleevent'),cycleId:id,action:'Fechado',reason,by:String(s.currentUser),at:now()});audit(s,'Ciclo de questionários fechado',id);write(s);return publicCycle(s,c);
  }
  function peerResult(cycleId,targetId){
    const s=read(),c=(s.hrPeerCycles||[]).find(c=>c.id===cycleId),target=String(targetId);
    if(!c||!c.members.includes(target)||!(canManage(s)||canSelf(s)&&target===String(s.currentUser)))throw Error('Sem autorização para consultar este resultado.');
    if(cycleStatus(s,cycleId)!=='Fechado')return{released:false,message:'Resultados disponíveis apenas após fecho do ciclo.'};
    const result=(s.hrPeerResults||[]).find(r=>r.cycleId===cycleId&&r.targetId===target);
    if(!result?.released)return{released:false,message:'Resultado não divulgado: limiar de anonimato não atingido.'};
    return{released:true,score:result.score,criteria:c.criteria.map(q=>({label:q.label,score:result.scores[q.id]})),message:'Resultado agregado; identidades e respostas individuais não são divulgadas.'};
  }
  function cycleResults(id){const s=read(),c=(s.hrPeerCycles||[]).find(c=>c.id===id);if(!c||!accessibleCycle(s,c))throw Error('Sem autorização para consultar este ciclo.');const ids=canManage(s)?c.members:[String(s.currentUser)];return ids.filter(id=>c.members.includes(id)).map(target=>({name:L.person(s,target).name||'Colaborador',result:peerResult(id,target)}))}
  function financialReviewReference(id){const s=read();if(!ceo(s))throw Error('Só o CEO pode preparar uma revisão financeira manual.');const x=(s.hrPerformance||[]).find(x=>x.schemaVersion===1&&x.id===id);if(!x||eventStatus(s,id)!=='Validada')throw Error('É necessária uma avaliação validada.');return{evaluationId:id,employeeId:x.employeeId,rulesVersion:x.rules.version,score:x.score,automaticPayment:false,amount:null}}
  function ruleHistory(){const s=read();if(!ceo(s))throw Error('Só o CEO pode consultar as versões de regras.');return clone(s.hrPerformanceRuleVersions||[])}
  window.HRPerformanceV4={read,people,ceo,canManage,canSelf,canPeer,defaults,rules,approveRules,period,score,submitEvaluation,decideEvaluation,evaluations,cycles,openCycle,peerTargets,submitPeer,closeCycle,peerResult,cycleResults,financialReviewReference,ruleHistory};
})();
