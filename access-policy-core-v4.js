/* Shared role names and defaults. Saved role/individual overrides remain authoritative. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GSAccessPolicy=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{'use strict';
const ROLES=['CEO','ADMINISTRAÇÃO','ADMINISTRATIVA','MEDICO/A','TECNICO/A','BASICO','CALL CENTER'];
const actions=[['dashboard','Dashboard de gestão'],['personal','Área pessoal'],['clock','Livro de ponto'],['account','Conta corrente'],['operation','Operação diária'],['openClinic','Abertura da clínica'],['closeClinic','Fecho da clínica'],['clinicTasks','Executar tarefas'],['waiting','Lista de espera / pedidos'],['bookings','Marcações / nº consultas'],['leaveRequest','Pedir férias/ausências'],['leaveApprove','Aprovar/recusar férias'],['hrManage','Recursos Humanos'],['performanceManage','Propor avaliações de desempenho'],['performanceRead','Consultar o próprio desempenho'],['peerReview','Responder a questionários entre colegas'],['financeManage','Gerir financeiro'],['reports','Relatórios'],['marketing','Marketing IA'],['alerts','Alertas'],['security','Segurança e backups'],['audit','Auditoria'],['settings','Tabelas / configuração'],['clinics','Documentos das Clínicas'],['clinicDocumentsUpdate','Atualizar documentos clínicos'],['stockRead','Consultar Stock'],['stockManage','Configurar Stock e encomendas'],['stockMove','Movimentos e ajustes de Stock'],['stockConsume','Registar consumos'],['stockRequest','Pedir material'],['stockApprove','Aprovar material/encomendas'],['stockReceive','Receber material'],['stockTransfer','Transferir material'],['stockCosts','Consultar custos de Stock'],['stockDocuments','Consultar documentos de encomendas']];
function norm(r){const n=String(r||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();if(n==='CEO')return'CEO';if(n==='ADMINISTRACAO')return'ADMINISTRAÇÃO';if(n==='ADMINISTRATIVA'||n==='ADMINISTRATIVO')return'ADMINISTRATIVA';if(n==='CALL CENTER'||n==='CALLCENTER')return'CALL CENTER';if(n.includes('MEDIC'))return'MEDICO/A';if(n.includes('TECNIC'))return'TECNICO/A';return'BASICO'}
function defaults(r){
 const personal=['personal','clock','account','leaveRequest','performanceRead','peerReview'];
 if(r==='CEO'||r==='ADMINISTRAÇÃO')return actions.map(([k])=>k);
 if(r==='ADMINISTRATIVA')return [...personal,'clinics','clinicDocumentsUpdate','stockRead','stockMove','stockConsume','stockRequest','stockReceive','stockTransfer','operation','openClinic','closeClinic','clinicTasks','waiting','bookings'];
 if(r==='CALL CENTER')return [...personal,'stockRead','stockRequest','waiting','bookings'];
 if(['MEDICO/A','TECNICO/A'].includes(r))return [...personal,'stockRead','stockConsume','stockRequest'];
 return [...personal,'stockRead','stockRequest'];
}

return{ROLES,actions,norm,defaults};});
