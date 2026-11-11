/* Verificação de publicidade em saúde (Portugal) — Decreto-Lei n.º 238/2015 (regime jurídico das práticas de
   publicidade em saúde) e Regulamento da ERS n.º 1058/2016. Ferramenta de apoio: não substitui a validação jurídica.
   - Identificação obrigatória: entidade (nome/firma), NIF e n.º de registo/licença ERS do estabelecimento;
     profissional identificado → n.º de cédula profissional.
   - Proibido: garantias de cura ou de resultados / ausência de riscos (art. 7.º, n.º 1), pressão ou urgência
     artificial e incentivo ao consumo desnecessário ou sem avaliação (art. 7.º, n.º 2), testemunhos e «antes/depois»
     enganosos, comparações e superlativos sem prova, ofertas/descontos em atos de saúde sem condições completas.
   - Rigor científico: informação de saúde só com fonte reconhecida e nota «não substitui a avaliação».
   Também guarda a biblioteca de dicas de saúde por especialidade (texto revisto + fonte + ilustração). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GSHealthAdCompliance=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{'use strict';
const REF={id:'Regulamento ERS 1058/2016 · DL 238/2015, art. 5.º',cure:'DL 238/2015, art. 7.º, n.º 1 (garantias de cura ou de resultados)',pressure:'DL 238/2015, art. 7.º, n.º 2 (práticas agressivas)',consumption:'DL 238/2015, art. 7.º, n.º 2 (consumo desnecessário ou sem avaliação)',testimony:'DL 238/2015, art. 7.º (práticas enganosas) · Manual de Boas Práticas da ERS',superlative:'DL 238/2015, art. 4.º (objetividade e rigor)',price:'DL 238/2015, art. 7.º, n.º 1 (preço e condições)',science:'DL 238/2015, art. 4.º (rigor científico)'};
const WORDS=[
 ['cure',/\bcura(?:r|mos|do|da|ção)?\b|\bgarant(?:ido|ida|imos|ia de)\b|100\s?%|\bsem (?:dor|riscos?|efeitos secundários|cirurgia)\b|\bresultados? (?:garantidos?|imediatos?|definitivos?)\b|\bmilagr|\belimina (?:a|de vez)\b|\bpara sempre\b/i,'Promete cura, resultados ou ausência de riscos'],
 ['pressure',/\búltimas? vagas?\b|\bsó hoje\b|\bnão perca\b|\baproveite já\b|\bvagas limitadas\b|\bantes que (?:acabe|esgote)\b|\bcorra\b|\bimperdível\b/i,'Cria urgência ou pressão para decidir'],
 ['consumption',/\bmesmo sem sintomas,? (?:faça|marque)\b|\btodos (?:devem|precisam)\b|\bfaça já (?:o seu )?(?:check-?up|exame)\b|\bsem necessidade de (?:prescrição|avaliação|diagnóstico)\b/i,'Incentiva consumo de cuidados sem avaliação'],
 ['testimony',/\btestemunh|\bos nossos (?:utentes|doentes|pacientes) (?:dizem|recomendam)\b|\bantes e depois\b|\bantes\/depois\b|★|⭐/i,'Usa testemunhos ou «antes e depois»'],
 ['superlative',/\b(?:o|a) melhor\b|\b(?:os|as) melhores\b|\bn\.?º ?1\b|\bnúmero um\b|\blíder\b|\bmais barat|\búnic[oa] (?:em|no|na)\b/i,'Superlativo ou comparação sem prova'],
 ['price',/\bgrátis\b|\bgratuit|\bdesconto|\bpromoç|\boferta\b|\b\d+\s?%\s?(?:de )?desconto|€/i,'Preço, oferta ou desconto (exige condições completas e validação)']];
const LEVEL={cure:'block',pressure:'block',consumption:'block',testimony:'block',superlative:'warn',price:'warn'};
/* Biblioteca de dicas (informação geral, fontes reconhecidas). Revista para não prometer resultados nem alarmar. */
const TIPS={
 'Cardiologia':[{icon:'heart',title:'Hipertensão: a «doença silenciosa»',text:'A pressão arterial alta muitas vezes não dá sintomas. Medi-la com regularidade ajuda a detetá-la cedo.',source:'Direção-Geral da Saúde (DGS) · OMS'},{icon:'heart',title:'Dor no peito? Não espere',text:'Dor ou aperto no peito que dura mais de alguns minutos pode ser sinal de enfarte. Ligue 112.',source:'INEM · Fundação Portuguesa de Cardiologia'},{icon:'heart',title:'Coração e movimento',text:'Para os adultos, a OMS recomenda pelo menos 150 minutos de atividade física moderada por semana.',source:'Organização Mundial da Saúde (OMS)'}],
 'Fisioterapia':[{icon:'spine',title:'Dor lombar comum',text:'Na maioria das dores lombares, manter-se ativo dentro do possível ajuda mais do que o repouso prolongado.',source:'OMS · NICE (Reino Unido)'},{icon:'spine',title:'Trabalha sentado?',text:'Interromper o tempo sentado com pausas para se levantar e mexer faz bem à saúde.',source:'Organização Mundial da Saúde (OMS)'}],
 'Osteopatia':[{icon:'spine',title:'Pescoço e postura',text:'Pausas regulares e mudar de posição ao longo do dia ajudam a aliviar a tensão no pescoço e nos ombros.',source:'Recomendações de saúde ocupacional · DGS'}],
 'Nutrição':[{icon:'leaf',title:'Menos sal',text:'A OMS recomenda menos de 5 g de sal por dia — cerca de uma colher de chá, incluindo o sal dos alimentos.',source:'Organização Mundial da Saúde (OMS)'},{icon:'leaf',title:'Fruta e legumes',text:'Comer pelo menos 400 g de fruta e legumes por dia faz parte de uma alimentação saudável.',source:'Organização Mundial da Saúde (OMS)'}],
 'Psicologia':[{icon:'mind',title:'Dormir bem conta',text:'A maioria dos adultos precisa de 7 a 9 horas de sono por noite.',source:'National Sleep Foundation · DGS'}],
 'Dermatologia':[{icon:'sun',title:'Proteção solar',text:'Use protetor solar de fator 30 ou superior e reaplique a cada 2 horas quando estiver ao sol.',source:'Direção-Geral da Saúde (DGS)'}],
 'Terapia da Fala':[{icon:'speech',title:'Desenvolvimento da fala',text:'Se aos 2 anos a criança ainda não junta duas palavras, vale a pena falar com um profissional.',source:'American Speech-Language-Hearing Association (ASHA)'}],
 'Ortopedia':[{icon:'bone',title:'Prevenir quedas',text:'Exercício regular de força e equilíbrio ajuda a prevenir quedas, sobretudo depois dos 65 anos.',source:'Organização Mundial da Saúde (OMS)'}],
 'Pilates clínico':[{icon:'spine',title:'Movimento com orientação',text:'Exercício regular e adaptado a cada pessoa contribui para a saúde dos músculos e articulações.',source:'Organização Mundial da Saúde (OMS)'}],
 '*':[{icon:'plus',title:'Mexa-se mais',text:'Para os adultos, a OMS recomenda pelo menos 150 minutos de atividade física moderada por semana.',source:'Organização Mundial da Saúde (OMS)'}]};
const DISCLAIMER='Informação geral. Não substitui a avaliação por um profissional de saúde.';
const norm=v=>String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
function tipFor(label,date='2026-01-01'){const k=Object.keys(TIPS).find(x=>x!=='*'&&norm(x)===norm(label)),list=TIPS[k||'*'],d=Number(String(date).replace(/-/g,''))||0;return{...list[d%list.length],specialty:k||label}}
const deacc=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,''),PLAIN=WORDS.map(([r,re,m])=>[r,new RegExp(deacc(re.source),'i'),m]);
function scanText(text){const issues=[];const t=deacc(text);for(const [rule,re,msg] of PLAIN){const m=t.match(re);if(m)issues.push({level:LEVEL[rule],rule,message:msg+' («'+m[0]+'»)',ref:REF[rule]})}return issues}
/* ad: {texts:[...], entity:{name,nif,ers}, professionals:[{name,license}], health:{text,source}, disclaimer:bool} */
function check(ad){const issues=[];const e=ad.entity||{};if(!String(e.name||'').trim())issues.push({level:'block',rule:'id',message:'Falta o nome da entidade',ref:REF.id});if(!String(e.ers||'').trim())issues.push({level:'block',rule:'id',message:'Falta o n.º de registo/licença ERS do estabelecimento (ficha da clínica)',ref:REF.id});if(!String(e.nif||'').trim())issues.push({level:'warn',rule:'id',message:'Falta o NIF da entidade (ficha da clínica)',ref:REF.id});
 for(const p of ad.professionals||[])if(!String(p.license||'').trim())issues.push({level:'block',rule:'id',message:'Profissional identificado sem n.º de cédula profissional: '+p.name,ref:REF.id});
 if(ad.health){if(!String(ad.health.source||'').trim())issues.push({level:'block',rule:'science',message:'Informação de saúde sem fonte reconhecida',ref:REF.science});if(!ad.disclaimer)issues.push({level:'warn',rule:'science',message:'Falta a nota «não substitui a avaliação por um profissional»',ref:REF.science})}
 for(const t of ad.texts||[])issues.push(...scanText(t));const seen=new Set();const out=issues.filter(i=>{const k=i.rule+i.message;if(seen.has(k))return false;seen.add(k);return true});return{ok:!out.some(i=>i.level==='block'),issues:out}}
function entityOf(s,clinic){const c=(s.clinics||[]).find(x=>String(x.id)===String(clinic))||{};return{name:c.company||c.legalName||s.company?.name||'Grupo Saúde',nif:c.nif||s.company?.nif||'',ers:c.ers?.license||c.ersNumber||'',clinic:c.name||String(clinic||''),phone:c.phone||(Array.isArray(c.phones)?c.phones[0]:'')||'',address:c.address||''}}
return{REF,TIPS,DISCLAIMER,tipFor,scanText,check,entityOf}});
