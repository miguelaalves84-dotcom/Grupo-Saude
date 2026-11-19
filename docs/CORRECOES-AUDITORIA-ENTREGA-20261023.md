# Correções da auditoria — entrega por blocos

Branch `dev/v4-stabilization-20261017`, PR #13 em rascunho. Código testado e preview: **125eee8cd3a4e45e67e358f971971eb8d6250b55**. Os commits posteriores apenas de relatório não mudam este pacote.

[Preview protegido READY](https://grupo-saude-v4-validacao-sintetica-q3rev2u3o-grupo-saude.vercel.app) · [GitHub Actions 39974365229](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39974365229)

[Detalhes técnicos](CORRECOES-AUDITORIA-BLOCOS-20261023.md) · [Proveniência de Caixas, funções e commit de remoção](RECUPERACAO-CAIXAS-PROVENIENCIA-20261023.json) · [Matriz atualizada](CORRECOES-AUDITORIA-MATRIZ-20261023.md) · [JSON](CORRECOES-AUDITORIA-MATRIZ-20261023.json) · [CSV](CORRECOES-AUDITORIA-MATRIZ-20261023.csv) · [Achados e evidências](CORRECOES-AUDITORIA-ESTADO-20261023.json) · [Preparação P0](P0-PREPARACAO-ISOLADA-20261023.md)

## Resultado

| Bloco | Resultado efetivo | Limite |
|---|---|---|
| RH-TIME-01 | Corrigido. Ficha e Livro de Ponto usam a mesma agregação; correções aprovadas e dias/clínicas preservados. | Não cria banco de horas nem resolve turnos noturnos. |
| PERM-CEO-01 | Corrigido. CEO respeita negações guardadas, inclusive valores históricos 0/1; permissões editáveis e auditadas. | Default CEO continua global; simulação usa o perfil selecionado. Não liga fornecedor de identidade. |
| CLINIC-NAV-01 | Corrigido. Gestão documental separada da configuração em Tabelas, reutilizando o mesmo mestre e anexos. | Upload continua sintético até arquivo privado. |
| Caixas | Recuperada implementação histórica e integrada em Financeiro, dia clínico, fecho e notificações. | Persistência demonstrativa no navegador; API/PostgreSQL testados isoladamente. |
| VIS-EXPANDED | Corrigido. Zero conflitos visíveis no replay das 60 secções/12 contextos, após separar cabeçalho e scroll. | Não é certificação visual humana universal nem teste de hardware físico. |
| Quatro P0 | Preparação isolada, testes negativos e runbook entregues. | Continuam bloqueados; nenhum serviço real ativado. |

## Caixas: funcionalidades recuperadas e preservação

- Financeiro → Fecho de Caixa: folhas por clínica/data, total, multibanco, a depositar, depósito/data, referência, observações e diferença em cêntimos. Filtros por clínica/período.
- Administrativa regista e acompanha clínicas associadas; CEO/Administração autorizados validam/reabrem. Outros perfis recusados na UI, domínio e autorização de API.
- Estados históricos, confirmação de validação, justificação de diferenças/reabertura e histórico visual por autor/data/antes/depois.
- Folha exigida para fechar a clínica; depósito pode aguardar validação. Não há exigência de médico e técnico simultâneos nem criação de atividade clínica fictícia.
- Dados novos no `clinic_days.data.cash` existente e `days` demo. Coleção histórica `cash` preservada, sem segunda folha visível ou segundo ledger salarial. CAS, rollback e idempotência exercitados.
- Caixas por validar no dashboard/tab e notificações. Valores respeitam clínica e período; decisão atualiza os indicadores.
- O comprovativo original era referência textual; não se apresenta um upload privado inexistente. Não importa automaticamente dados reais do antigo domínio/chave.

## Testes efetivos

Execução **39974365229: 32/32 jobs aprovados**, incluindo regressão/build, PostgreSQL descartável e 30 suites Chromium. Seis perfis × computador/tablet/telemóvel × claro/escuro nas suites aplicáveis. Dados sintéticos, recursos locais do runner e rede externa bloqueada nos contextos de navegador.

Novos testes: `tests/audit-regressions.cjs`, `tests/audit-corrections-browser.py`, `tests/finance-cash.cjs`, `tests/finance-cash-browser.py`, `tests/finance-cash-postgres.cjs`, `tests/p0-isolation-boundaries.cjs`. As suites anteriores foram preservadas; fixtures de fecho passaram a fornecer a folha obrigatória. O teste P0 foi movido para o novo destino de Tabelas, mantendo XSS, teclado e gravação.

A preparação P0 exercita 28 recusas de endpoints em contextos isolados, sem ambiente de aplicação herdado e sem pedidos externos. Não prova login, arquivo ou restauro remotos em funcionamento. PostgreSQL isolado não equivale a UI/API central operacional.

As primeiras execuções falharam em seletores/fixtures e foram corrigidas: 39966456428 (destino antigo no teste P0), 39968360367 (fixture de Caixa, contagem global de eventos e pré-requisito de fecho) e 39969238198 (associação singular antiga na fixture) e 39970449831 (teste CEO limitado indevidamente às duas clínicas da fixture). Os testes passaram a comparar as clínicas canónicas autorizadas, preservando a visão global CEO e o isolamento dos outros perfis. Não foram contadas como aprovações.

## Matriz dos 14 grupos após estas correções

Mantêm-se os 192 requisitos da auditoria, com atualização apenas dos achados comprovadamente corrigidos. A recuperação de Caixa é detalhada acima (remoção histórica confirmada no commit 954273f, não simples ocultação por permissões), sem inflacionar a contagem dos requisitos originais.

| Grupo | Testado sintético | Parcial | Bloqueado | Regressão | Ausente |
|---|---:|---:|---:|---:|---:|
| 1 — Identidade, sessão e seis perfis | 5 | 0 | 5 | 0 | 0 |
| 2 — Clínicas, documentos e Dashboard | 9 | 0 | 2 | 0 | 0 |
| 3 — Navegação, interface e notificações | 9 | 1 | 1 | 0 | 0 |
| 4 — RH e ficha central | 13 | 5 | 1 | 0 | 2 |
| 5 — Candidatos e recrutamento | 11 | 1 | 4 | 0 | 0 |
| 6 — Férias, baixas e calendários | 9 | 0 | 2 | 0 | 0 |
| 7 — Ponto, escalas e GPS | 12 | 2 | 1 | 0 | 0 |
| 8 — Desempenho e questionários | 3 | 2 | 1 | 0 | 0 |
| 9 — Financeiro, pagamentos, bónus e processamento salarial | 11 | 3 | 1 | 0 | 1 |
| 10 — Faturas, recibos e substituições | 5 | 1 | 2 | 0 | 0 |
| 11 — Operação Diária e Stock | 20 | 0 | 1 | 0 | 0 |
| 12 — Pedidos, tarefas, Chat, Reclamações e relatórios | 10 | 2 | 1 | 0 | 0 |
| 13 — Tabelas, email, Marketing e automação | 11 | 2 | 4 | 0 | 0 |
| 14 — Segurança, arquivo, auditoria, backups e preview | 7 | 3 | 4 | 2 | 0 |

**Totais:** IMPLEMENTADO/TESTADO: 135, BLOQUEADO POR INFRA: 30, PARCIAL: 22, AUSENTE: 3, REGRESSÃO: 2.

## Pendências por prioridade

Foram encerrados quatro achados da auditoria. Permanecem **31: 4 P0, 22 P1 e 5 P2**. São bloqueios, capacidades parciais e cobertura, não 31 erros de interface. A auditoria original ec0a3d8 e as provas individuais dos 102 falsos positivos continuam preservadas.

| Prioridade | Achado | Próxima ação |
|---|---|---|
| P0 | INF-AUTH | Validar fornecedor isolado, contas sintéticas, login/reset/expiração/revogação reais. |
| P0 | INF-CENTRAL | Planear ligação UI/API existente por módulo, sem criar outro cadastro e sem ativar nesta fase. |
| P0 | INF-RECOVERY | Definir RPO/RTO e testar restauro isolado a partir de backups verificados. |
| P0 | INF-STORAGE | Configurar arquivo privado de testes, scanner, retenção e revisão de segurança. |
| P1 | BILL-01 | Concluir fluxo contextual documental/central de empresa com os cadastros existentes, após aprovação desta auditoria. |
| P1 | CHAT-CENTRAL | Definir ligação autenticada do Chat existente e regras de conservação. |
| P1 | CLOCK-BANK | Especificar e consolidar ledger/regras de banco de horas aprovados. |
| P1 | CLOCK-NIGHT | Validar modelo de turno noturno/meia-noite e adaptar o fluxo existente numa fase posterior. |
| P1 | COVERAGE-RESIDUAL | Converter controlos só inventariados em casos de operação completos por prioridade. |
| P1 | EXTERNAL-MKT | Validar OAuth/APIs oficiais/custos e apenas depois propor ativação isolada. |
| P1 | HIST-IDENTITY | Comparar ficheiros identity/authenticated-modules antigos com os proxies atuais e preparar recuperação seletiva. |
| P1 | HISTORY-DEPTH | Usar as árvores remotas preservadas para completar o mapa de equivalências e lacunas. |
| P1 | LEGACY-REVIEW | Separar fallback, delegação e escritor ativo; verificar dependências antes de qualquer remoção. |
| P1 | MKT-AI | Validar fornecedor seguro e testar geração real com dados não identificáveis. |
| P1 | MKT-COMPLIANCE | Rever consentimentos/oposição/retenção e publicidade em saúde por canal. |
| P1 | PAY-LEGAL | Obter validação jurídica/contabilística de ausências/subsídios e configurar regras com vigência. |
| P1 | PAY-SOURCE | Ligar cada incidência à origem exata e concluir o resumo por clínica. |
| P1 | PERF-YEAR | Executar ciclo anual completo de dezembro com pesos, colegas e revisão autorizada. |
| P1 | REC-AI | Documentar fornecedor/consentimento/conservação e manter desligado até aprovação de segurança. |
| P1 | REC-EMAIL | Validar serviço/email de testes no servidor e reconciliar outbox existente. |
| P1 | REC-EXTRACT | Definir extração real suportada e revisão humana; reutilizar a fila de CV. |
| P1 | REPORT-SCOPE | Reconciliar os indicadores de cada relatório com fontes e filtros efetivos. |
| P1 | RH-EXIT | Consolidar saída com inativação, documentos, equipamentos e retenção existentes. |
| P1 | RH-LEGAL | Validar formação de acordo com contrato, vigências e regime português aplicável. |
| P1 | RH-OCC | Definir processo mínimo de aptidão ocupacional e proteção de dados antes de implementar. |
| P1 | SIGNATURE | Selecionar solução adequada e validar base legal/processo; manter não operacional. |
| P2 | DEVICE-REAL | Realizar validação em tablet/telemóvel Android físicos com dados sintéticos. |
| P2 | HIST-BASELINE | Preservar referências/hashes históricos e preparar recuperação seletiva das evidências sintéticas. |
| P2 | PAY-ADAPTER | Obter esquemas/versões oficiais e criar adaptadores só após a auditoria. |
| P2 | RH-ORG | Planear organigrama aproveitando associações clínicas e funções existentes. |
| P2 | VIS-BASELINE | Recuperar baseline preservada, fixar engine/fontes/dados e definir tolerâncias por região. |

Não foram contratados serviços pagos, ativada faturação, criados recursos Neon/Mailtrap/IA ou configurados segredos. Consumo das quotas das plataformas existentes não foi medido. Quotas gratuitas/acessos devem ser confirmados antes de qualquer ativação central.

A main e o projeto/deployment de produção foram verificados em leitura; sem merge, force push ou alterações de produção. O novo pacote é apenas estático e sintético, no projeto isolado existente, mantendo proteção Vercel.

Não se declara a V4 concluída. Os próximos blocos continuam limitados à recuperação e consolidação autorizadas; dependências legais, hardware e fornecedores externos permanecem identificadas.

## Evidências diretas e limites da publicação

- [Caixa: 270 verificações Chromium, zero falhas](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39974365229/artifacts/12511116268).
- [Regressões e permissões: 366 verificações Chromium, zero falhas](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39974365229/artifacts/12510781780).
- [Replay visual: 12 contextos, 60 secções, zero interseções visíveis](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39974365229/artifacts/12509933988).
- [Seis perfis: 4 350 verificações aprovadas e 180 não testáveis](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39974365229/artifacts/12509704692).
- [102 alertas históricos revistos novamente: todos falsos positivos, zero pendentes](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39974365229/artifacts/12510608034).
- [Abertura/fecho e pendências: regressão operacional](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39974365229/artifacts/12511251195).

Os ZIP expiram em 06/11/2026; IDs, hashes, resultados e provas estruturadas essenciais ficam no repositório. Contagens são verificações, não funcionalidades distintas. Não somar suites sobrepostas como funcionalidades adicionais.

Chromium foi executado sobre o build em loopback isolado. No preview protegido foram confirmados READY, manifesto/SHA e igualdade exata de quatro ficheiros críticos (`index.html`, `styles.css`, `hr-master-v4.js`, `finance-cash-core-v4.js`). Não houve automação de navegador remoto com SSO nem teste em hardware Android físico. A API financeira do pacote estático responde 404: não existe backend real publicado neste preview.

Para validar: abrir o preview, selecionar o perfil sintético e entrar em **Financeiro → Fecho de Caixa**. Escolher a clínica e data da folha. Só CEO/Administração autorizados validam/reabrem; Administrativa regista e acompanha as suas clínicas. Os outros perfis continuam sem acesso à Caixa, mantendo os seus restantes acessos legítimos.

## Commits rastreáveis

| Commit | Bloco |
|---|---|
| [f15df34](https://github.com/miguelaalves84-dotcom/Grupo-Saude/commit/f15df34c535c741e7a71d913a8bda95d2456d71a) | Horas RH, negações CEO e separação Clínicas/Tabelas. |
| [112fa81](https://github.com/miguelaalves84-dotcom/Grupo-Saude/commit/112fa81560fbab56bf334911a1c1fb45c2c7eb2c) | Recuperação de Caixas e ligação ao dia clínico/Financeiro. |
| [8730fa1](https://github.com/miguelaalves84-dotcom/Grupo-Saude/commit/8730fa10cc5af963df28d6698d8cb1a32af3e5fe) | Cabeçalho de modal, ensaios P0 e fixtures de regressão. |
| [d7adf4b](https://github.com/miguelaalves84-dotcom/Grupo-Saude/commit/d7adf4b65179a552ed1af0807df8609d40a1a572) | Compatibilidade de permissões numéricas e associações sintéticas exatas. |
| [524574a](https://github.com/miguelaalves84-dotcom/Grupo-Saude/commit/524574adddbe9b95ce17084ee4ea119549a22689) | Indicadores de Caixa por clínica/período, sem células indefinidas. |
| [71de83a](https://github.com/miguelaalves84-dotcom/Grupo-Saude/commit/71de83a85248a79517ce16bacd09c6f64085b90f) | Valores atuais únicos em cêntimos; originais históricos preservados. |
| [bd88ea9](https://github.com/miguelaalves84-dotcom/Grupo-Saude/commit/bd88ea9f8037418be22e17b7979016866fd823cd) | Teste de âmbito CEO contra todas as clínicas canónicas ativas. |
| [2492386](https://github.com/miguelaalves84-dotcom/Grupo-Saude/commit/24923864ab1d933287fbb343d2cfab1b3a284ce9) | Negação de Clínicas também em criação/gravação direta do mestre. |
| [d417eff](https://github.com/miguelaalves84-dotcom/Grupo-Saude/commit/d417eff963b7e26d4437fa75ef5658fa30b9a60e) | Horas multiclínica e marcações históricas sem clínica. |
| [125eee8](https://github.com/miguelaalves84-dotcom/Grupo-Saude/commit/125eee8cd3a4e45e67e358f971971eb8d6250b55) | Proteção das permissões CEO contra alteração por Administração/simulação; código final testado e publicado. |

As execuções canceladas por commits posteriores não contam como aprovações. O commit final de documentação usa `[skip ci]`: não altera o código/ficheiros do preview testado em 125eee8.
