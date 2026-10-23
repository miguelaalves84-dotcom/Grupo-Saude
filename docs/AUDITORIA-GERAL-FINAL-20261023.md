# Auditoria geral Grupo Saúde V4 — 23/10/2026

## Resultado e âmbito

Auditoria documental, estática, de domínio, API isolada, PostgreSQL descartável e Chromium concluída dentro dos limites abaixo. O programa **não está certificado como operacional com autenticação e persistência centrais**. Foram classificados **192 requisitos nos 14 grupos**, revistos individualmente os **102 alertas originais** e registados **35 achados abertos** com plano e critérios de aceitação. Não se afirma que todas as combinações de todos os controlos foram executadas.

Instrução de referência: [PR #13, comentário 6363236667](https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6363236667), além dos requisitos anteriores e relatórios preservados. Branch: `dev/v4-stabilization-20261017`; PR em rascunho. Produto auditado: **ddb6023618d73ec678af742a1cfc3353b27dc903**. Instrumentação final testada: **ea4e8a00d229b9f4106573ee741b72f0d1eeb43d**. O commit deste relatório acrescenta documentação; o código funcional permanece o de ddb6023.

Nesta fase só foram acrescentados testes, provas, relatórios e dois jobs de auditoria ao workflow. Não foram implementadas funcionalidades, corrigidos módulos funcionais, removidos ficheiros do programa, executadas migrações ou alterados dados reais. O único erro corrigido foi no seletor CSS do instrumento de auditoria.

## Documentos de consulta

- [Matriz completa dos 192 requisitos, por grupo](AUDITORIA-GERAL-MATRIZ-20261023.md), [CSV](AUDITORIA-GERAL-MATRIZ-20261023.csv) e [JSON com ficheiros, testes, limites e achados](AUDITORIA-GERAL-MATRIZ-20261023.json).
- [35 achados abertos e um encerrado, com plano e aceitação](AUDITORIA-GERAL-ACHADOS-20261023.json).
- [Revisão individual V001–V102](AUDITORIA-GERAL-VISUAIS-102-20261023.md) e [provas geométricas/visibilidade](AUDITORIA-GERAL-VISUAIS-102-20261023.json).
- [Seis ocorrências adicionais E001–E006](AUDITORIA-GERAL-VISUAIS-EXPANDIDOS-20261023.json).
- [Permissões: 774 casos de flags](AUDITORIA-GERAL-PERMISSOES-20261023.json).
- [30 branches e caminhos históricos ausentes](AUDITORIA-GERAL-BRANCHES-20261023.json), [comparação dos checkpoints](AUDITORIA-GERAL-HISTORICO-20261023.json) e [equivalências, duplicações e recuperações propostas](AUDITORIA-GERAL-EQUIVALENCIAS-20261023.md).
- [Dependências estáticas](AUDITORIA-GERAL-DEPENDENCIAS-20261023.json), [inventário de controladores API](AUDITORIA-GERAL-API-INVENTARIO-20261023.json) e [jobs/artefactos finais](AUDITORIA-GERAL-TESTES-20261023.json).

Todos os caminhos são relativos à raiz do repositório ou a `docs/`, conforme indicado. Os relatórios em JSON permitem consultar as fontes sem confundir contagens de requisitos, verificações e defeitos.

## Estados reais

| Estado | Requisitos | Significado |
|---|---:|---|
| IMPLEMENTADO/TESTADO | 131 | Cenários implementados e exercitados com dados sintéticos; a ligação central continua sujeita aos bloqueios próprios. |
| PARCIAL | 23 | Parte existe, mas falta integração, cobertura integral ou validação específica. |
| BLOQUEADO POR INFRA | 30 | Falta fornecedor, persistência, arquivo privado, hardware ou validação externa; não aprovado como operacional. |
| REGRESSÃO | 5 | Divergência funcional ou capacidade/evidência histórica ausente na árvore atual. Não são cinco novos defeitos introduzidos nesta auditoria. |
| AUSENTE | 3 | Área específica de aptidão ocupacional, organigrama e adaptadores contabilísticos certificados não encontrados como funções completas. |

Os estados são por requisito, não um resultado absoluto para o módulo inteiro. Um grupo com cenários aprovados e bloqueios continua incompleto. A taxonomia dos 14 grupos foi mantida: Stock integra o grupo 11, Reclamações o 12 e Marketing o 13.

| Grupo | Implementado/testado | Parcial | Bloqueado | Regressão | Ausente |
|---|---:|---:|---:|---:|---:|
| 1 — Identidade, sessão e seis perfis | 4 | 1 | 5 | 0 | 0 |
| 2 — Clínicas, documentos e Dashboard | 8 | 0 | 2 | 1 | 0 |
| 3 — Navegação, interface e notificações | 8 | 1 | 1 | 1 | 0 |
| 4 — RH e ficha central | 12 | 5 | 1 | 1 | 2 |
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

## Falhas reproduzidas prioritárias

| ID / prioridade | Resultado efetivo | Localização e prova | Correção proposta, ainda não executada |
|---|---|---|---|
| RH-TIME-01 / P1 | Entrada 09:00 + saída 17:00 produzem 480 minutos no núcleo de ponto, mas o separador Tempo da ficha apresenta 0,0 h. | `hr-master-v4.js:19`; `tests/audit-domain-findings.cjs`, job 120388466120. Controlador real com DOM sintético, não validação desse valor em Chromium. | Usar a mesma agregação canónica do Livro de Ponto, preservando eventos e histórico. |
| PERM-CEO-01 / P1 | `financeManage=false` é conservado pelo ator de domínio, mas `RoleAccessAdminV4.can` devolve true para CEO. | `role-access-admin-v4.js:13`, `attendance-ui-v4.js:3`; probe de domínio e matriz de permissões. | Definir explicitamente se CEO admite revogação; alinhar editor, UI e domínio. Não guardar negações que sejam silenciosamente ignoradas. |
| CLINIC-NAV-01 / P1 | Gestão → Clínicas apresenta novamente o mestre; o botão de Tabelas aponta para a mesma área. | `clinic-master-v4.js:17`, `tables-canonical-controller-v4.js:2`; probe de HTML e navegação Chromium. | Recuperar a separação aprovada entre acompanhamento documental e configuração, reutilizando o modal documental/catálogo atual. |

Não foi feita bisseção para atribuir um commit introdutor a estas falhas. A divergência CEO não comprova uma escalada de privilégios em produção; exige coerência de política. Os testes negativos existentes não a tornam irrelevante.

## 102 alertas visuais e inspeção alargada

**V001–V102: 102 falsos positivos, zero falhas reais daquele conjunto, zero por confirmar.** O detetor anterior comparava retângulos residuais de campos dentro de `<details>` fechados. A revisão verificou visibilidade, ancestrais recolhidos e geometria, abriu as secções por cliques reais e restaurou o estado inicial. Foram abertas 60 secções, com capturas e prova individual versionada. Não foram feitas 102 correções CSS artificiais.

A abertura de mais secções revelou **seis ocorrências adicionais**, reproduzidas em 12 contextos e 60 secções: Administração e CEO em computador, nos dois temas, apresentam interseção do botão fechar com Desenvolvimento; CEO em telemóvel apresenta interseção de fechar com o fim de vigência contratual, nos dois temas. E001–E006 estão agrupadas no achado **VIS-EXPANDED / P2**.

O diagnóstico adicional considera controlos renderizados e o recorte da área de deslocação. Não mede toda a oclusão opaca/pixels nem substitui revisão humana das capturas. É um conflito reproduzível de geometria/interação de cabeçalho a corrigir, com essa limitação explícita. Não foi observada uma ocorrência adicional idêntica no viewport de tablet testado; isso não certifica todos os ecrãs do tablet.

Não existe aprovação universal por comparação de pixels. A baseline histórica precisa de reconciliação e tolerâncias reproduzíveis: VIS-BASELINE e HIST-BASELINE. Capturar imagens não equivale a comparar pixels nem a validar visualmente cada formulário.

## Perfis e permissões

Foram executados os seis perfis separadamente, em computador, tablet e telemóvel, com temas claro e escuro: **36 contextos**. A simulação pelo CEO e os acessos negativos são cobertos pelas suites de segurança/perfis e domínio.

| Perfil | Verificações de navegação/formulários aprovadas | Asserções falhadas nessa suite | Limites principais |
|---|---:|---:|---|
| Call Center | 600 | 0 | Apenas funções e clínicas autorizadas; serviços centrais não configurados. |
| Médico | 576 | 0 | Área pessoal e ações autorizadas; não concede gestão de formação/equipamentos/despesas. |
| Técnico | 576 | 0 | Mesmos limites de âmbito; capacidade/atividade técnica nos cenários dedicados. |
| Administrativo | 612 | 0 | Âmbito clínico e operações administrativas testados com dados sintéticos. |
| Administração | 960 | 0 | Gestão exercitada; bloqueios centrais e sobreposições adicionais permanecem. |
| CEO | 1 026 | 0 | Inclui simulação; divergência específica de negação individual registada separadamente. |
| Total | 4 350 | 0 | São verificações, não 4 350 funcionalidades distintas. |

Há ainda **180 entradas não testáveis** nessa travessia (cinco dependências por contexto). Não são aprovações. As suites específicas executam mutações/validações em recrutamento, documentos, férias/baixas, escalas, Reclamações, Operação, Stock, fornecedores, Marketing e Financeiro, além da navegação. O exportador salarial tem 504 verificações próprias em 36 contextos; não somar isso como novas funcionalidades.

A análise de flags executou **774 casos: 6 perfis × 43 ações × padrão/negação/concessão**. Foram identificadas 43 diferenças de negação CEO entre a UI genérica e o ator de domínio. Outros resultados diferentes podem resultar de dependências de permissões ou regras de módulo; não foram classificados automaticamente como violações de API.

O inventário inclui controlos apenas observados e operações exercitadas. Nem todas as combinações de todos os formulários foram executadas individualmente: **COVERAGE-RESIDUAL / P1**. GPS, microfone, teclado, rotação e comportamento de hardware Android físico continuam por validar: DEVICE-REAL.

## Segurança, persistência e prontidão

Os **quatro P0** são bloqueios para operação central com dados reais, não quatro vulnerabilidades exploradas:

1. **INF-AUTH:** autenticação, recuperação, expiração e revogação com fornecedor real de testes ainda não demonstradas ponta a ponta.
2. **INF-CENTRAL:** UI/API/persistência entre dois utilizadores/dispositivos ainda não comprovadas na instalação integrada.
3. **INF-STORAGE:** arquivo privado, autorização de download, verificação de ficheiros e retenção não operacionais no preview estático.
4. **INF-RECOVERY:** backup/restauro operacional central e RPO/RTO não validados.

API e PostgreSQL são testados isoladamente, com dados sintéticos, concorrência, histórico, idempotência e recusas. Esses testes não demonstram que o preview estático usa uma base central autenticada. O pacote sintético mantém backend/escritores reais desligados. Não foi usada uma base de produção.

Emails reais de recrutamento, caixa CV, serviços de IA/transcrição/imagens e canais Google/Meta continuam dependentes de configuração/validação. Não foram enviados emails ou dados pessoais a fornecedores, publicados anúncios nem autorizados gastos. Não se aprova gravação real em armazenamento demonstrativo.

A revisão de nomes nas 30 árvores não encontrou ficheiros `.env` exatos, chaves `.pem`, `id_rsa` ou `credentials.json`. O novo material passa por revisão de padrões antes da sincronização. Isto não certifica ausência de segredos em todos os blobs e commits históricos; o checkout local é shallow e não foi feito um pentest externo.

## Histórico, duplicações e funcionalidades recuperáveis

Foram consultadas as árvores completas das pontas de **30 branches**, sem truncagem. Compararam-se os checkpoints **a6edf538b22a2e282b5b93f275a08eb1ac05edf2** e **ebc2df5c38903fd8faf62e17b8b0a0c92faad49b** com ddb6023. Divergem da branch atual; não é correto declarar todo o trabalho integrado por ancestralidade.

Há **222 caminhos históricos ausentes** na árvore atual, incluindo **121 PNG e 30 ZIP** de provas/baseline e **23 caminhos executáveis**. Não equivalem a 222 funções perdidas: vários são fixtures, testes, provas e implementações substituídas. O mapa de equivalências identifica cada executável e a alternativa atual.

Regressões/preparações a reconciliar:

- **HIST-IDENTITY / P1:** leitores centrais antigos Clínicas/Stock e serviços/guardas específicos do Grupo 1 não constam da árvore atual. Os proxies atuais não demonstram equivalência integral dos guardas de isolamento. Recuperar requisitos e compatibilidade, sem ligar outro backend paralelo.
- **HIST-BASELINE / P2:** baseline/traces históricos estão recuperáveis por SHA remoto, mas não integram a árvore atual. Preservar e reconciliar sem declarar comparação visual já executada.
- **CLINIC-NAV-01:** centro documental histórico separado regrediu; os documentos, catálogo e modal atuais continuam a existir. Não declarar todos os documentos desaparecidos.

Sobreposições relevantes: `users`/`employees`, controladores antigos e atuais, fontes de horas no RH e guardas de permissões distintos. Nomes repetidos em closures não provam duplicação ativa. Referências em documentação não provam utilização em runtime. Os testes existentes de bloqueio/delegação de writers legados foram preservados.

**Nenhum código obsoleto foi removido.** Não existe ainda prova suficiente para uma remoção segura generalizada. A proposta é reconciliar por capacidade e dependência; não voltar a carregar patches, tabelas ou listeners antigos em paralelo. Dados, associações, históricos e migrações foram preservados.

## Execuções e evidências efetivas

Execução final: [GitHub Actions 39945892326](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39945892326), commit ea4e8a0: **30/30 jobs aprovados** — regressão (`npm test` e build), PostgreSQL isolado e **28 jobs Chromium**, incluindo os dois instrumentos novos de auditoria.

Os probes de achados registam as falhas conhecidas sem falhar o job. Assim, **30 jobs verdes não significam programa sem defeitos**. O resultado dos achados está neste relatório e nos JSON correspondentes.

| Evidência | Ligação direta | Conservação informada pelo GitHub |
|---|---|---|
| Revisão individual dos 102 e capturas de secções abertas | [Artefacto 12497993765](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39945892326/artifacts/12497993765) | Até 06/11/2026 11:29 UTC |
| Verificação focada das seis ocorrências adicionais | [Artefacto 12498556105](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39945892326/artifacts/12498556105) | Até 06/11/2026 11:26 UTC |
| Travessia dos seis perfis | [Artefacto 12497907831](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39945892326/artifacts/12497907831) | Até 06/11/2026 11:29 UTC |
| Processamento salarial | [Artefacto 12498092782](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39945892326/artifacts/12498092782) | Até 06/11/2026 11:28 UTC |
| Probes de horas, permissões e destino Clínicas | [Job 120388466120](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39945892326/job/120388466120) | Logs do run; resultados também documentados neste relatório. |

As classificações/provas estruturadas essenciais estão versionadas e não dependem da validade dos ZIP. As imagens e traces completos permanecem nos artefactos, sujeitos à expiração; a sua cópia integral duradoura ainda é pendência de preservação. Não foram inventadas imagens revistas manualmente ou baselines comparadas por pixels.

A primeira execução da instrumentação, **39943024076**, teve 28/29 jobs aprovados e falhou num seletor de diagnóstico `button.`; foi corrigido só no teste. A execução seguinte **39944299673** passou 29/29. A última acrescentou a verificação focada e passou 30/30. A primeira falha não é contada como aprovação nem como defeito do produto.

## Plano de correção por prioridade — sem implementação nesta fase

São **35 achados abertos: 4 P0, 25 P1 e 6 P2**. Incluem bloqueios, lacunas e cobertura, não 35 botões avariados. Cada um tem requisitos afetados, fontes, testes, ação e critério objetivo no registo de achados.

| Ordem | Bloco | Critério para encerrar |
|---|---|---|
| 1 / P0 | Identidade/sessões, persistência, arquivo privado e recuperação | Ambiente de testes isolado autorizado, dois utilizadores/dispositivos, recusas efetivas de API, revogação, ficheiros privados e restauro comprovados. Sem produção. |
| 2 / P1 | Horas RH, negações CEO, separação Clínicas/documentos | Corrigir a fonte canónica, decidir política CEO, restaurar destinos sem duplicação; acrescentar testes que falhem antes e passem depois. |
| 3 / P1 | Empresa de faturação contextual, incidências salariais e restantes parciais | Reconciliar a ficha e as origens por vigência; confirmar na UI as operações ainda incompletas. Não considerar um snapshot de domínio uma gestão central completa. |
| 4 / P1 | Histórico/compatibilidade, cobertura residual e integrações pendentes | Mapa por capacidade antiga, testes de operações completas e decisões explícitas para fornecedores. Sem reinstalar módulos concorrentes. |
| 5 / P2 | Cabeçalhos, baseline, hardware Android, organigrama/adaptadores | Eliminar os seis conflitos reproduzíveis; comparação visual determinística; validação física e formatos externos efetivamente testados. |

As lacunas legais e de conformidade (formação por contrato, medicina do trabalho, retenção, assinatura, publicidade em saúde e gravação) exigem validação apropriada. Não se transforma uma regra configurada em declaração de conformidade jurídica.

## Preview e integridade das áreas protegidas

O preview de referência continua a ser o produto **ddb6023**, isolado e protegido:

[Abrir preview sintético existente](https://grupo-saude-v4-validacao-sintetica-icjrkvpxf-grupo-saude.vercel.app)

Não foi publicado um novo produto nesta auditoria. Os commits de instrumentação/documentação não representam novas funcionalidades no preview. A proteção pode exigir acesso Vercel autorizado. Não foi criado um URL de bypass público.

Verificação de fecho, só leitura: main permanece em **84fba5a2d6d7afcb0723ca312f4e617acc22823d**; PR #13 mantém `draft=true` e a branch autorizada. O projeto de produção mantém `updatedAt=1791725971672` e o último deployment listado **dpl_2C1mPq5vYRne8djkVjuux8nehwp7**, iguais à referência anterior. Isso confirma ausência de alterações nesses indicadores; não constitui auditoria dos dados internos de produção, que não foram consultados.

O desenvolvimento funcional fica parado neste ponto para revisão do relatório e do plano, conforme pedido. A auditoria foi entregue com limites e pendências explícitos; a V4 não é declarada integralmente concluída.
