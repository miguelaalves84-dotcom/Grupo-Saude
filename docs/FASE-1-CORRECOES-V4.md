# Fase 1 — correções críticas do Grupo Saúde V4

Data: 13 de outubro de 2026. Workspace: `/workspaces/Grupo-Saude-Grupo1`.
Branch: `dev/v4-group1-operational-tests`. HEAD mantido em `1e769bcf8b3d9b8feb7c5d9db13a796999b66695`.

Referências: [matriz oficial dos 14 grupos](MATRIZ-14-GRUPOS.md), lida nesta revisão, e conclusões A01–A04 da auditoria geral registadas no relatório local anterior. O ficheiro original da auditoria em `/tmp/gs-v4-audit-4gq96yhz/RELATORIO-AUDITORIA-GERAL-V4.md` já não existe neste ambiente; os defeitos foram novamente reproduzidos com o código de base. Alterações locais, sem commits, merge, push, deploy, migrações ou acesso a bases de produção. Nenhum módulo, funcionalidade ou documento foi eliminado. As fontes de Stock e os seus serviços, endpoints e SQL permanecem sem alterações.

## Correções

| Defeito comprovado | Correção e limites |
|---|---|
| A01: `repair()` elimina checklists quando o catálogo legado está vazio; remove referências clínicas/especialidades não resolvidas | Reparação aditiva: mantém itens, IDs, campos personalizados, regras existentes e referências não resolvidas; consulta também `documentCatalog`; suporta `catalogId`; mantém associações pessoais originais. Snapshot JSON inválido não é substituído. Contratos sem campo `items` continuam a gerar checklist a partir das referências resolvidas; o teste adicional falhou antes desta correção. Referências históricas não passam a ser concessões de acesso. |
| A03: reabertura/fecho e exceção sem guarda efetiva | `closeClinic` e clínica atribuída são verificados antes da operação, usando o estado atual. Fecho autorizado continua a guardar o dia e a permitir reabertura. Helpers legados DailyOps exigem também identidade igual à do utilizador atual e permissão de abertura/fecho. O código demo `2026` não substitui autorização. |
| A03: decisão/reversão de ponto sem permissões e âmbito consistentes | Política partilhada para CEO/Administração ativos com `hrManage` efetivo e clínica autorizada. Aplicada em App, V4TimeAdmin e decisões/reversões/detalhes da Central. Tipos de registo desconhecidos não resolvem silenciosamente correções de ponto. O catálogo atual não tem uma permissão separada de aprovação de ponto; não foi criada outra matriz. |
| A04: candidatos de outras clínicas em listas e chamadas diretas | Âmbito aplicado na lista, ficha, atualização, conversão, importação, arquivo/documentos legados e notificações. Administração precisa de autorização para todas as clínicas associadas ao candidato. Candidatos sem clínica mantêm-se conservados e acessíveis ao CEO. Duplicados fora do âmbito exigem revisão e não devolvem o ID privado. O formulário de importação permite escolher uma clínica autorizada. Conteúdo privado do processo aberto é limpo ao mudar utilizador ou revogar acesso. |
| A02: observer do painel horário reage à própria inserção | Observer limitado aos filhos diretos do conteúdo operacional, ignora o próprio painel; refresh agrupado, conteúdo idêntico não é reescrito, painel reutilizado. Um único intervalo de 60 s verifica apenas a vista ativa e visível; não há cadeia de timers causada pelo próprio painel. |
| Harness Chromium pode ocultar o erro inicial durante screenshot/trace/cleanup | Falhas de recolha ficam registadas e fazem falhar o resultado; não impedem o erro original de chegar ao gestor Playwright. Os logs completos são preservados. |

## Ficheiros

Fontes alteradas:

- `v4-data-integrity.js`
- `access-scope-v4.js`
- `app.js`
- `gs-enterprise.js`
- `clinic-hr-architecture.js`
- `approvals-center-v4.js`
- `communications-v4.js`
- `attention-core-v4.js`
- `attention-ui-v4.js`
- `scheduled-indicators.js`

Testes e configuração:

- `tests/phase1.cjs` — novo; reproduções e regressões; suporta leitura do código original com `GS_PHASE1_BASELINE=1`.
- `tests/browser-harness.py` — novo; duas reproduções de falha de screenshot/cleanup.
- `tests/phase1-browser.py` — novo; DOM Chromium, seis perfis, UI de candidatos/importação e conservação após reload.
- `tests/phase1-regression.py` — novo; lote sequencial com logs e código de saída por suite.
- `tests/ci/run-browser.py` — recolha de evidência e registo de falhas de cleanup.
- `package.json` — inclui as regressões Node da fase na suite principal; acrescenta `test:phase1`.
- `docs/FASE-1-CORRECOES-V4.md` — este relatório, novo.
- `docs/evidence/phase1/verification.json` — resumo durável dos resultados e hashes de Stock, novo.

O build regenerou `dist` localmente como saída ignorada pelo Git; não publicou qualquer artefacto.

## Testes e evidência

As alterações e testes principais já existiam na árvore local ao iniciar esta revisão. Não se infere a sua cronologia a partir dos resultados. Foram reexecutados contra o commit original e contra a versão corrigida. O caso adicional de contrato sem `items` foi escrito e executado antes da correção: falhou com `undefined !== 1`; após a correção passou.

- `npm test`: passou, exit 0, incluindo **16 regressões da fase 1**; 422 linhas PASS, não 422 cenários homogéneos.
- `tests/browser-harness.py`: dois testes aprovados.
- `tests/document-catalog.cjs`: passou após a correção adicional. A suite Chromium da fase 1 também foi repetida após a última alteração e passou.
- `npm run build`: passou, 67 assets; `git diff --check`: passou.
- Código original: execução final com `GS_PHASE1_BASELINE=1`, resultado registado em `review/baseline-final.log`. Falhas de reprodução são esperadas e não representam aprovações da base.
- Chromium: **12 suites completas aprovadas**, incluindo Stock e a matriz completa dos seis perfis × três tamanhos × dois temas (36 combinações; 597,9 s; zero falhas de cenário). Os estados «Não implementada» e «Não testável no ambiente demonstrativo» foram preservados e não contam como aprovações.

A comparação Chromium repetida com o mesmo fixture demonstrou **242 mutações em 600 ms com o script original** (asserção falhada, exit 1) e **duas com o corrigido** (passou). A falha do original foi conservada em `review/panel-baseline.log`. Os 16 testes Node contra a base produziram uma passagem e 15 falhas esperadas.

As primeiras tentativas desta revisão tiveram bloqueios da sandbox: `spawnSync git EPERM` e criação de socket recusada. Foram repetidas com execução autorizada. Esses resultados ficam identificados como bloqueios de ambiente, sem os contar como regressões funcionais ou aprovações.

Evidência durável: [verification.json](evidence/phase1/verification.json) e logs em `docs/evidence/phase1/review/`. A execução Chromium local usa dados sintéticos e bloqueia pedidos externos; não valida provider real nem bases de produção. Screenshots/traces temporários em `/tmp/gs-phase1-review-authorized/` não são comparação por pixels com baseline aprovado.

## Riscos e fase seguinte

- O ciclo de mutações foi demonstrado e eliminado. Isto não prova, isoladamente, que explique todos os crashes anteriores. Usar resultados efetivos das suites para avaliar a estabilidade; sem atribuição global especulativa.
- Playwright local é 1.63.0; CI documentada fixa 1.56.0. Comparação por pixels com baseline aprovado e execução nessa versão continuam separadas e não foram declaradas aprovadas.
- Estas correções atuam na demonstração existente e nos seus dados locais. A persistência real não foi substituída; também não foi ativada. Providers reais, PostgreSQL/API operacional, GPS físico, email/scanner/backup externos e writers centrais não foram executados nesta fase.
- Snapshots inválidos são conservados, mas outros módulos antigos ainda podem tratar JSON inválido de forma diferente; recuperação transversal exige desenho e testes específicos. Dados que já tenham sido apagados por reparações anteriores exigem backup/histórico; não se inventa recuperação de informação ausente.
- Associações por nomes antigos mantêm-se como informação; a autorização operacional usa IDs de clínicas ativas. Uma associação histórica ou órfã não é reativada automaticamente.
- DailyOps continua separado de `App.days`; ligar o bloqueio de abertura única à fonte canónica e resolver concorrência entre dispositivos pertence à fase seguinte. A05 (seleção de profissionais) e A06 (ligação/concorrência operacional) não foram declarados resolvidos.
- Rever na fase seguinte a política para candidatos sem clínica ou associados a várias clínicas, mantendo o comportamento conservador aqui implementado; validar sessão/âmbito no servidor antes de utilização operacional.

Recomendação: após revisão destas alterações e nova autorização, alinhar o ambiente Chromium com CI, resolver os riscos restantes comprovados, validar visualmente e só depois retomar integração operacional isolada. Publicação, commits e produção continuam dependentes de autorização própria. Nenhuma fase seguinte foi iniciada.
