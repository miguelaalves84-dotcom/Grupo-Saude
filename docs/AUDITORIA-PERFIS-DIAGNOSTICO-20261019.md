# Diagnóstico inicial — auditoria por perfil

Base: be9631f, branch dev/v4-stabilization-20261017. PR #13 draft.
Instruções lidas: https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6278053484

Este documento é o diagnóstico e plano ANTES das correções. Não equivale a aprovação funcional.

## P0 confirmado: capacidade médica indevida

Abertura apresenta três contagens médicas, mas `operation-core-v4.js` ainda aplica a médicos as regras de capacidade técnica: `capacity`, `validateTeam`, comando `row`, comando `closeData`, métricas/estatísticas. `app.js` envia uma capacidade oculta no bundle. `hr-master-v4.js` oferece capacidade semanal aos médicos. O servidor reutiliza o mesmo domínio, logo o bloqueio não é apenas visual. Os testes anteriores davam capacidade semanal sintética aos médicos e até exigiam o erro quando faltava, encobrindo a divergência face ao requisito aprovado.

Correção planeada: apenas técnicos têm capacidade/vagas obrigatórias. Médicos guardam três inteiros não negativos independentemente de capacidades antigas. Preservar os campos históricos sem apagar dados; excluir capacidades médicas dos cálculos atuais de ocupação e de prioridades publicitárias. Validar realizados/faltas versus marcações de fecho para ambos; limite por capacidade apenas para técnicos. Regressões devem usar médico SEM configuração semanal e técnico com configuração válida, testar abertura integral, atualizações e fecho, cliente/API/PostgreSQL/Chromium.

## P1: auditoria funcional e limites

Criar sessões de navegador sintéticas independentes para Call Center, Médico, Técnico, Administrativo, Administração e CEO. Verificar carregamento inicial sem alternar perfil; navegação, menus, grupos, submenus, estados vazios, modais, permissões e visibilidade de Dashboard. Exercitar simulação CEO separadamente e concessão/revogação de acessos. Inventariar controlos e classificar ações não exercitadas como não testadas, sem confundir abrir página com aprovar operações. Reutilizar as suites de RH, documentos, financeiro, recrutamento, entrevistas, Reclamações, Marketing e Operação para fluxos mutáveis e negativos. Gerar matriz perfil/módulo/ação com esperado/observado/estado/evidência e tempos de navegação, incluindo tablet.

O preview é estático: seis perfis simulados, não sessões reais. Autenticação externa, persistência entre dispositivos, emails reais, uploads privados reais e IA externa continuam não testáveis neste ambiente. PostgreSQL descartável e mocks testam o servidor separadamente; não provam autenticação real integrada.

## Plano de legado e remoções

1. Inventariar scripts carregados por HTML, imports/requires, wrappers/handlers, rotas API, migrações, tabelas e chaves de armazenamento.
2. Fontes canónicas: `operation-core-v4.js` + `app.js` + `lib/operation-service.js` (clinic_days/requests); RH central (users/employees e domínios RH); permissões partilhadas (access-policy/authorization); Marketing (marketing.ideas/campaigns/posts em app_settings); documentos (documents + serviços de segurança/arquivo); Reclamações (complaints + domínio próprio).
3. Identificar versões substituídas e provas de referências; funções com nomes repetidos em closures não são automaticamente duplicações. Wrappers de compatibilidade podem ser necessários para handlers inline e dados antigos.
4. Remover neste bloco apenas a regra ativa indevida de capacidade/vagas médica e os controlos correspondentes. Não eliminar campos históricos nem capacidades técnicas.
5. Nenhuma remoção de módulos/tabelas/migrações ou dados é autorizada pelo diagnóstico. Candidatos a remoção exigem prova de ausência de referências, testes e revisão. Limpeza de fixtures/dados obsoletos não será executada.

Preservar todos os documentos, históricos, dados e funcionalidades válidas. Sem DROP, TRUNCATE, RESET, migrações remotas ou publicação em produção. A cópia privada inicial do código está fora do repositório; o histórico Git local já tinha objetos antigos em falta, pelo que não será descrito como clone histórico integral verificado.

## Funcionalidades preservadas noutras branches, ausentes nesta

Consulta read-only à árvore GitHub de `ebc2df5` e `a6edf53` confirmou Stock em `stock-core-v4.js`, `stock-ui-v4.js`, `lib/clinic-stock-service.js`, `api/v4-clinic-stock.js`, migração `db/migrations/v4-clinics-stock-001.sql` e testes `tests/stock-domain.cjs` / `tests/stock-browser.py`. Estes ficheiros e `docs/MATRIZ-14-GRUPOS.md` não existem no checkout atual. O Stock não pode ser declarado aprovado nesta branch. Não foi apagado por esta auditoria. Comparação das interfaces, autorização e esquemas é necessária antes de qualquer recuperação; nenhuma integração de outra branch foi executada.

Origem consultável: https://github.com/miguelaalves84-dotcom/Grupo-Saude/tree/a6edf538b22a2e282b5b93f275a08eb1ac05edf2

Inventário de dependências: `docs/AUDITORIA-LEGADO-INVENTARIO-20261019.json`, gerado por `scripts/audit-legacy-inventory.py`. Zero remoções propostas como seguras apenas por nome ou idade; funções repetidas em closures constam como candidatos a revisão, não como código morto provado.

## P1 confirmado na inspeção de RH pessoal

`HRSeparationV4.documents`, `regularize`, `sickLeave` e `uploadMissing` preenchem o modal partilhado mas não o abrem. Os atalhos independentes do menu chamam estas funções com o modal fechado, deixando os formulários invisíveis. Não existe wrapper externo que acrescente `showModal`. Plano: abrir o modal existente depois de renderizar, validar a permissão no próprio método e fechar ao regressar a Meu RH. Não criar segundo formulário nem modificar dados. O novo percurso Chromium verifica os atalhos sem passar primeiro por outro perfil/modal.

## P1: configuração global de tarefas confundida com execução

`RoleAccessAdminV4.viewKey('tasks')` usava `clinicTasks`, mas a página edita `state.tasks` global (criar/arquivar/reativar), não os estados diários. `App.openTaskForm/addTask/toggleTask` não validavam `settings`. Plano: exigir a permissão existente `settings` nesta página e nos três controladores; manter `clinicTasks` no domínio de execução da Operação. Preservar catálogo, instâncias diárias e histórico, sem nova permissão ou tabela.
