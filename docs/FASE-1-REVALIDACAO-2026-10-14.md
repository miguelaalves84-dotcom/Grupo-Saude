# Fase 1 — revalidação em 14 de outubro de 2026

Workspace `/workspaces/Grupo-Saude-Grupo1`, branch `dev/v4-group1-operational-tests`, HEAD `1e769bc`. Sem commits, push, publicação, migrações ou acesso a produção nesta intervenção.

## Âmbito e estado inicial

A mensagem de autorização chegou truncada na referência à auditoria e na segunda prioridade. Foram verificadas as prioridades legíveis: conservação em `V4DataIntegrity.repair()` e permissões de fecho/reabertura. Foi solicitada a parte em falta; não se declara concluído âmbito que não foi recebido.

A árvore de trabalho já continha numerosas alterações, incluindo correções da Fase 1 e ficheiros identificados como fases 2–6. Estes últimos foram preservados sem desenvolver essas fases. O relatório anterior `FASE-1-CORRECOES-V4.md` é histórico: os seus resultados não substituem a execução atual. A auditoria original indicada nesse relatório não estava disponível.

## Correções e ficheiros

As correções funcionais já presentes relativamente ao commit de base foram mantidas e verificadas:

- `v4-data-integrity.js`: reparação aditiva; preserva itens, campos personalizados, referências não resolvidas, associações históricas e JSON inválido. Consulta também `documentCatalog` e `catalogId`. Não converte associações históricas em concessões de acesso.
- `app.js`: verifica `closeClinic` e âmbito clínico atual antes de fechar, reabrir ou confirmar exceção, incluindo chamadas diretas.
- `gs-enterprise.js`: os helpers DailyOps verificam identidade do ator, permissão e clínica.
- `access-scope-v4.js`: restringe o âmbito operacional a clínicas ativas e atribuídas.

Alterações efetuadas nesta intervenção:

- `app.js`, `index.html`, `styles.css`: resolução dos conflitos aninhados e remoção das cópias legadas duplicadas, preservando a versão V4 e as correções locais. `index.html` e `styles.css` ficaram iguais ao HEAD; isto não significa que estivessem corretos à entrada. A primeira seleção dos conflitos ainda deixou duplicados; foram removidos antes da validação final. Cópia integral dos três ficheiros à entrada: `/tmp/gs-phase1-conflicts-20261014T133456Z/`.
- `tests/phase1.cjs`: dois testes adicionais cobrem revogação de permissão, alteração de âmbito e inativação da clínica entre abertura e confirmação da exceção; associações históricas permanecem guardadas sem alargar o âmbito.
- Este relatório e logs em `docs/evidence/phase1/revalidacao-2026-10-14/`.

## Resultados desta execução

| Verificação | Resultado |
|---|---|
| Primeira execução da suite Fase 1 | 5 aprovados, 11 falhados: `SyntaxError` nos marcadores de conflito de `app.js` |
| Primeira tentativa de resolver conflitos | Ainda falhou por blocos legados duplicados; corrigido |
| `npm run test:phase1`, final | 18 testes Node e 2 testes do harness aprovados; zero falhas |
| `node tests/runtime.cjs` | 102 aprovados; exit 0 |
| `node tests/syntax.cjs` | 174 ficheiros aprovados; exit 0 |
| `node tests/document-catalog.cjs` | Aprovado; exit 0 |
| Chromium `phase1-browser` | Aprovado; seis perfis, exceções de autorização, UI de candidatos e conservação após reload; exit 0 |
| `npm run build` | Aprovado, 73 assets; exit 0 |
| `git diff --check` | Aprovado |

A primeira tentativa Chromium foi bloqueada pela sandbox ao criar um socket local. A repetição com execução autorizada passou. O harness bloqueia pedidos externos e usa dados sintéticos. O pedido `/api/version` devolveu 404 no servidor estático local; não impediu a suite, mas não constitui validação de um backend. A suite completa `npm test` não foi executada porque inclui fases posteriores fora desta autorização.

## Riscos e recomendações

- Os testes validam a demonstração local; não demonstram autorização no servidor ou segurança de produção. As guardas JavaScript não substituem validação no backend.
- Informação já eliminada em execuções antigas exige backup/histórico; a reparação não a recupera.
- DailyOps e `App.days` continuam fontes distintas; concorrência entre dispositivos não foi validada.
- A árvore contém trabalho pré-existente de fases posteriores. Antes de qualquer entrega, separar e rever o conjunto exato a publicar, preservando esses ficheiros.
- Confirmar o texto truncado e a auditoria antes de declarar concluída toda a Fase 1. Numa fase seguinte, apenas após nova autorização, tratar a fonte operacional canónica, concorrência e autorização no servidor, com ensaios próprios.

Nenhuma fase seguinte foi iniciada nesta intervenção.
