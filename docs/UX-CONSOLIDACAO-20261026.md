# Grupo Saúde V4 — consolidação UX/UI transversal

**Código desta entrega:** `399a84c7f711daa825c15f8344111ea849fdb795`.

Base técnica: código `d2e962c8`, evidências `c92ac8a9`. Branch `dev/v4-stabilization-20261017`; PR #13 mantido em rascunho. Esta entrega preserva a identidade azul-marinho, cinzento-claro, branco, azul e verde-água e os dois temas por utilizador.

## Diagnóstico e correções

| Achado | Correção | Preservação |
|---|---|---|
| A ficha completa era um modal longo | Página dedicada aberta pela lista, com regresso, identidade persistente e oito assuntos | Mesmo renderer, campos, IDs, validações, documentos e serviços |
| Muitos botões equivalentes no topo do RH | Grupos por assunto, com uma área expandida; funcionamento com controlos criados posteriormente | Nós/eventos existentes movidos, sem cópia de dados |
| Duas entradas do menu para o mesmo RH | Uma entrada Colaboradores; Candidatos independente | Mantidos `data-view=hr` e o destino/controlador original |
| Pesquisa genérica do RH misturava elementos da página | Pesquisa própria de colaboradores, clínica/função/estado, contador e estado vazio | Fonte canónica e isolamento `AccessScopeV4.canEmployee` |
| Lista de colaboradores demasiado abaixo | Lista imediatamente após o cabeçalho e filtros; indicadores e aprovações depois | Calendário, contagens e aprovações mantidos |
| Cabeçalho persistente interceptava os separadores e o início do conteúdo | Cabeçalho e navegação no mesmo bloco; oito assuntos em duas filas no tablet; removido o conflito com `overflow:hidden` do antecessor apenas nesta página | Cliques reais sem `force`, navegação por teclado e regresso |
| Mudança de secção podia descartar edição sem aviso | Confirmação para sair de uma ficha com alterações; cancelamento mantém o DOM e valores | Sem cópias paralelas de formulários ou gravação automática |
| Associações históricas a clínicas ausentes no catálogo | «Clínica por confirmar» e aviso, em vez de IDs técnicos apresentados como nomes | Identificadores e histórico não são alterados automaticamente |
| Alguns rótulos não estavam associados ao controlo adjacente | Associação `for` apenas quando há um controlo inequívoco com ID | Não escreve valores, posição do cursor ou seleção |
| Autoria das gravações da ficha não era explícita | Novas gravações incluem `by` e `employeeId`; histórico mostra o autor quando consta da origem | Registos anteriores não são reconstruídos ou atribuídos artificialmente |
| Dia Clínico tinha separadores planos e seleção múltipla pouco tátil | Etapas com estado derivado do domínio, escolhas de presença por toque e secções de abertura | Uma única gravação; mesmos drafts, tarefas, capacidades e bloqueios |
| Agenda escondia filtros utilizados diariamente | Pessoa/agenda e clínica visíveis diretamente | Regras administrativas, multiclínica, conflitos e histórico inalterados |
| Stock e Marketing com navegação indiferenciada | Agrupamento por inventário/abastecimento/parceiros e análise/planeamento/operação/serviços | Mesmos botões, permissões, alertas e contadores |
| Indicadores do Dashboard não eram atalhos de trabalho | Clique/teclado abre atividade, pedidos ou tarefas autorizadas | Quatro indicadores, onze no detalhe e filtros canónicos mantidos |
| Texto explicativo ocupava permanentemente espaço | Ajuda contextual na abertura/Agenda/Financeiro | Limitações do ambiente continuam explícitas no resumo e aviso global |

O renderer legado `HRMasterV4.open` permanece como API de compatibilidade. A lista e os acessos do processamento salarial utilizam `workspace`, que monta o mesmo formulário numa página; não foi criada uma segunda ficha nem uma nova tabela. Criação inicial, documentação, desenvolvimento, permissões e outros editores especializados continuam a reutilizar as janelas e controladores originais sobre a página de trabalho.

## Organização da ficha

Resumo; Dados pessoais e contrato; Assiduidade e banco de horas; Férias/baixas/ausências; Documentos; Financeiro e conta corrente; Desenvolvimento e avaliações; Permissões e histórico. Os separadores de desenvolvimento/avaliação só existem para quem pode utilizar os respetivos processos. As ações de impressão e comunicação ficam num menu. A simulação do CEO continua a utilizar os acessos efetivos do perfil simulado.

## Matriz por módulo

| Área | Implementado/reorganizado nesta entrega | Fluxos existentes preservados e cobertos por regressão |
|---|---|---|
| Dashboard CEO/Administração | Atalhos pelos indicadores, hierarquia e componentes partilhados | 4 indicadores principais, 11 no detalhe, filtros/clínicas autorizadas, séries sem números inventados |
| Clínicas | Padrão de formulários/tabelas e navegação partilhada | Documentação, catálogo/configuração separada, alertas e permissões |
| RH/colaboradores | Página inicial, filtros combinados, grupos e entrada única | Criação, contratos, escalas, aprovações, calendário, salários |
| Ficha do colaborador | Página dedicada, secções, ações, proteção de edição e autoria | Dados, cálculos, anexos, validações, história e controlo por campo/perfil |
| Ponto/férias/baixas | Acesso organizado através do RH e ficha | GPS, pedidos/correções, aprovação, bloqueio em baixa e história |
| Dia Clínico | Etapas, estados, equipa tátil, secções de abertura | Abertura integral, médicos com três contagens, técnicos/capacidades, pendências, caixa/fecho e estatísticas |
| Chat | Auditoria dos gestos e integração nos componentes existentes | Duas colunas/tablet, mobile, respostas, emojis, ✓ Feito independente, primeira confirmação, expiração exata de anexos |
| Agenda | Pessoa, clínica e especialidade diretamente acessíveis; classificação profissional opcional pelo catálogo existente | Dia/semana/mês, criação/edição/cancelamento, conflitos e acesso administrativo multiclínica |
| Financeiro/Caixas | Ajuda compacta, tabelas, ligação da origem salarial à ficha | Faturas, recibos, pagamentos, bónus, comprovativos e aprovações existentes |
| Stock | Navegação agrupada, tabelas com região de deslocação | Fichas/lotes, fornecedores, pedidos, encomendas, entregas/receções parciais e transferências |
| Marketing | Grupos de navegação e componentes partilhados | Especialidades por clínica, propostas, calendário, aprovações e ausência de publicação/investimento automático |
| Candidatos/entrevistas | Ordem atualizada segundo a instrução mais recente | Candidatos → Entrevista marcada → Em análise → Contratado → Recusado; histórico, toque, confirmações e conversão opcional |
| Reclamações | Tabelas/formulários e componentes partilhados | Funil, documentos, linha cronológica, reabertura e prazo operacional de 15 dias corridos |
| Tarefas/notificações | Contadores e acessos contextuais preservados | Fontes originais, histórico e permissões; sem contadores paralelos |
| Tabelas/áreas secundárias | Padrão partilhado de controlos, rótulos e tabelas | Catálogos, configurações, seis perfis e páginas independentes |

## Auditoria de código e duplicações

Não foram removidos módulos por parecerem antigos. Consolidaram-se apenas destinos equivalentes comprovados: entrada RH/Colaboradores, pesquisa genérica versus pesquisa própria e botão de aprovações repetido. O código de compatibilidade e os editores especializados foram preservados. `groupNavigation` reorganiza botões existentes; os estados e contagens continuam nos domínios originais.

Os estados das etapas não autorizam operações: os comandos e validações originais continuam a bloquear abertura/fecho inválidos. A seleção tátil altera apenas a pré-visualização até «GUARDAR ABERTURA». A data clínica já era calculada em `Europe/Lisbon`; não foram reescritas datas históricas.

## Limitações reais e trabalho que permanece separado

- O preview continua sintético e com persistência apenas neste navegador. Autenticação real, persistência UI/API entre dispositivos, arquivo privado e recuperação/backups operacionais não ficam aprovados por testes PostgreSQL efémeros.
- Gravação, transcrição, IA e integrações externas não são ativadas por esta renovação. As limitações e estados pendentes continuam visíveis.
- A Agenda permanece administrativa e independente da agenda clínica. A especialidade é apenas uma classificação profissional opcional; não representa uma consulta de utente ou disponibilidade clínica real. O catálogo e as associações por clínica são os mesmos usados pelo Marketing.
- Associações antigas a clínicas ausentes no catálogo exigem revisão da origem. São sinalizadas, não corrigidas ou apagadas automaticamente.
- Os 15 dias das Reclamações são a regra operacional aprovada; esta entrega não substitui validação jurídica dos prazos aplicáveis.
- Os testes de toque e capturas são Chromium emulado. A confirmação física da versão nova num tablet Android ainda é necessária. As validações físicas anteriores não são reutilizadas como aprovação desta versão.
- A verificação de contraste e teclado nos percursos cobertos não é uma certificação integral de acessibilidade assistiva.

## Segurança

Sem merge, force push, migrações reais, dados pessoais reais, produção ou novos serviços pagos. Compilação estática exclui API/backend, testes, relatórios, documentos e ambientes privados. O logótipo oficial mantém o objeto Git `ba094b7c8a6a4c73f887249c18b660a7b65cc31c`. As permissões do servidor não foram substituídas por ocultação de botões.

## Código e commits

- `837b2600`: página da ficha, filtros RH, grupos, etapas e seleção tátil; ordem atualizada do funil.
- `b0fba2f4`: ações seguras registadas explicitamente, pesquisa e entrada única do RH.
- `360fef26`: estrutura persistente da ficha e acesso contextual do Dashboard.
- `cccdf6a0`: grupos dinâmicos, avisos de associações antigas e baseline visual reproduzível.
- `30220909`: rótulos associados, gravação/recarregamento da ficha e autoria do histórico.
- `c9d76840`: edição da origem salarial na página de trabalho; validação correta das pesquisas. Este commit terminou com 42/42 jobs aprovados.
- `2539f702`: verificação visual adicional da posição inicial e capturas do Chat horizontal.
- `9306d635`: correção da causa encontrada pelo teste adicional: antecessor com overflow a interferir no posicionamento sticky.

- `476c214b`: catálogo de especialidades partilhado; classificação/filtro opcionais da Agenda, validação no domínio e no serviço, histórico e testes PostgreSQL.

- `69f0be72`: correção da aplicação do filtro de especialidade e teste negativo/limpeza com dois eventos distintos.
- `399a84c7`: ligação do seletor de clínica do cabeçalho à lista RH, mantendo-o desativado na ficha individual.

O ciclo final desta entrega deve ser consultado pelo SHA acima; ciclos intermédios com falhas ou cancelamentos não representam aprovação integral.

Ficheiros de produto: [hr-master-v4.js](../hr-master-v4.js), [clinic-hr-architecture.js](../clinic-hr-architecture.js), [workspace-shell-v4.js](../workspace-shell-v4.js), [visual-runtime-v4.js](../visual-runtime-v4.js), [design-system-v4.css](../design-system-v4.css), [app.js](../app.js), [agenda-ui-v4.js](../agenda-ui-v4.js), [approvals-center-v4.js](../approvals-center-v4.js), [global-search-v4.js](../global-search-v4.js), [safe-actions-v4.js](../safe-actions-v4.js), [payroll-export-ui-v4.js](../payroll-export-ui-v4.js) e [recruitment-core-v4.js](../recruitment-core-v4.js), [clinic-specialties-core-v4.js](../clinic-specialties-core-v4.js), [agenda-core-v4.js](../agenda-core-v4.js), [marketing-core-v4.js](../marketing-core-v4.js), [index.html](../index.html) e [lib/agenda-service.js](../lib/agenda-service.js). As ações e destinos das APIs mantêm-se. O serviço da Agenda lê as tabelas existentes de especialidades e guarda a classificação opcional no mesmo registo JSON/versionado, sem migrações nem novas tabelas.

## Capturas e comparação

| Área | Antes — d2e962c8 | Nova experiência |
|---|---|---|
| RH claro | [Antes](evidence/ux-consolidation-20261026/ux-hr-list-before-d2e962c8-light.png) | [Depois](evidence/ux-consolidation-20261026/ux-hr-list-light.png) |
| RH escuro | [Antes](evidence/ux-consolidation-20261026/ux-hr-list-before-d2e962c8-dark.png) | [Depois](evidence/ux-consolidation-20261026/ux-hr-list-dark.png) |
| Ficha clara | [Modal anterior](evidence/ux-consolidation-20261026/ux-employee-before-d2e962c8-light.png) | [Página dedicada](evidence/ux-consolidation-20261026/ux-employee-contract-light.png) |
| Ficha escura | [Modal anterior](evidence/ux-consolidation-20261026/ux-employee-before-d2e962c8-dark.png) | [Página dedicada](evidence/ux-consolidation-20261026/ux-employee-contract-dark.png) |

A comparação HR/ficha utiliza sete ficheiros de apresentação originais de `d2e962c8`, versionados com hashes SHA-256 em `tests/fixtures/ux-before-d2e962c8/manifest.json`, e os mesmos dados sintéticos. Não é uma reconstrução livre do antes. A comparação com o mockup usa as medições originais e a paleta clara posteriormente aprovada; não copia marca, fotografia, nomes ou números ilustrativos.

| Módulo | Claro | Escuro |
|---|---|---|
| Dashboard | [Captura](evidence/ux-consolidation-20261026/ux-dashboard-light.png) | [Captura](evidence/ux-consolidation-20261026/ux-dashboard-dark.png) |
| Ficha — resumo | [Captura](evidence/ux-consolidation-20261026/ux-employee-summary-light.png) | [Captura](evidence/ux-consolidation-20261026/ux-employee-summary-dark.png) |
| Agenda | [Captura](evidence/ux-consolidation-20261026/ux-agenda-light.png) | [Captura](evidence/ux-consolidation-20261026/ux-agenda-dark.png) |
| Dia Clínico | [Captura](evidence/ux-consolidation-20261026/ux-operation-light.png) | [Captura](evidence/ux-consolidation-20261026/ux-operation-dark.png) |
| Financeiro | [Captura](evidence/ux-consolidation-20261026/ux-finance-light.png) | [Captura](evidence/ux-consolidation-20261026/ux-finance-dark.png) |
| Stock | [Captura](evidence/ux-consolidation-20261026/ux-stock-light.png) | [Captura](evidence/ux-consolidation-20261026/ux-stock-dark.png) |
| Marketing | [Captura](evidence/ux-consolidation-20261026/ux-marketing-light.png) | [Captura](evidence/ux-consolidation-20261026/ux-marketing-dark.png) |
| Reclamações | [Captura](evidence/ux-consolidation-20261026/ux-complaints-light.png) | [Captura](evidence/ux-consolidation-20261026/ux-complaints-dark.png) |
| Tabelas | [Captura](evidence/ux-consolidation-20261026/ux-tables-light.png) | [Captura](evidence/ux-consolidation-20261026/ux-tables-dark.png) |
| Chat com mensagens | [Captura](evidence/ux-consolidation-20261026/ux-chat-populated-light.png) | [Captura](evidence/ux-consolidation-20261026/ux-chat-populated-dark.png) |

## Classificação opcional da Agenda

A especialidade é escolhida no catálogo já configurado para a clínica do evento. Eventos pessoais não são classificados por uma clínica fictícia. A seleção de outra clínica atualiza as opções e limpa opções incompatíveis. Alterações ao catálogo não apagam a classificação histórica; uma associação antiga é identificada para revisão no editor.

O mesmo leitor puro de catálogo é usado por Marketing e Agenda. As permissões continuam em cada domínio/serviço: o leitor não concede acessos. No servidor, as associações são lidas de `specialties`/`clinic_specialties` apenas para as clínicas autorizadas; nenhuma tabela nova foi criada. Gravação, edição, cancelamento, histórico, replay, CAS e isolamento da Agenda mantêm os mecanismos existentes.

Novos testes verificam a seleção e o resultado na interface, rejeição de especialidade de outra clínica, preservação histórica, leitura por outro utilizador autorizado e PostgreSQL descartável. Isto não ativa autenticação ou persistência central no preview estático.

## Resultado final verificado

**Preview READY protegido:** https://grupo-saude-v4-validacao-sintetica-7090uhdv2-grupo-saude.vercel.app

**Código testado e servido:** `399a84c7f711daa825c15f8344111ea849fdb795`. O commit documental posterior não modifica o produto.

[GitHub Actions — 42/42 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40331311013): regressão (sintaxe, testes e build), PostgreSQL descartável e 40 suites Chromium. Nenhuma falha no ciclo final. A suite nova de UX executou 738 verificações; a suite visual transversal executou 1542. Estes números são verificações, não uma contagem de funcionalidades distintas nem prova de cobertura total do programa.

| Perfil | Verificações da nova suite UX | Falhas |
|---|---:|---:|
| Call Center | 54 | 0 |
| Médico | 42 | 0 |
| Técnico | 42 | 0 |
| Administrativo | 108 | 0 |
| Administração | 246 | 0 |
| CEO | 246 | 0 |

A diferença de contagens decorre das ações permitidas a cada perfil. A suite percorre os três formatos e os dois temas. As restantes suites verificam os fluxos de negócio, API/permissões, simulação, pesquisa, escrita, documentos, operações, Chat, Stock, reclamações e processamento salarial.

Evidências versionadas: [matriz UX](MATRIZ-UX-CONSOLIDACAO-20261026.csv), [matriz transversal](MATRIZ-UX-MODULOS-20261026.csv), [resultado UX](UX-CONSOLIDACAO-RESULTADOS-20261026.json), [referência visual](UX-CONSOLIDACAO-REFERENCIA-20261026.json), [42 jobs](UX-CONSOLIDACAO-CI-20261026.json) e [verificação do preview](UX-CONSOLIDACAO-PREVIEW-20261026.json). As capturas originais dos artefactos foram preservadas nesta pasta, antes da expiração do GitHub Actions.

O deployment `dpl_DfGEwfSoo1KKymoGAhxkkHM2Hui2` está READY, no projeto sintético separado, com proteção Vercel Authentication mantida. O endereço pode exigir entrada na conta Vercel autorizada. A abertura devolveu HTTP 200; manifesto e sete ficheiros CSS/JS servidos correspondem exatamente aos artefactos publicados. `/api/version` confirma o SHA. `/api/auth/session` devolve 404, como esperado neste pacote estático: não há autenticação/backend operacional disfarçados.

A revisão das capturas confirmou a ficha em página larga, cabeçalho sem sobreposição e Agenda com especialidade selecionada e resultado filtrado. A comparação antes/depois fica nas capturas acima. O original aprovado permanece privado; não foi incorporado na aplicação nem confundido com o logótipo oficial. Os testes geométricos não equivalem a fidelidade integral por pixels ou validação física.

Main e projeto de produção preservados; PR #13 em rascunho. Não houve alteração de configurações de produção, migrações reais, serviço pago, ativação de gravação/IA ou envio de dados pessoais. Próximo passo: validação visual e tátil pelo utilizador neste preview. As dependências de autenticação, persistência central, arquivo privado e recuperação continuam separadas e pendentes.
