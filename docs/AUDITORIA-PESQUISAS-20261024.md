# Auditoria funcional das pesquisas — 24/10/2026

> Atualização de estabilização: [relatório e novo preview b9e10f0](ESTABILIZACAO-RELATORIO-20261024.md). Run 40129386415: 37/37 jobs, suite de pesquisas 2490 verificações sem falhas, incluindo 1290 populadas. A matriz CSV foi atualizada. Os ciclos ff0b6a2 e anteriores abaixo são históricos, não o preview mais recente.

Branch: `dev/v4-stabilization-20261017`. Especificação: [último comentário do PR #13](https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6383868420). PR em rascunho; sem merge, produção, migrações ou dados reais.

## Entrega verificada

**Código do preview: `ff0b6a23cdfef26be7182559671d3da538d54d5a`.** [Abrir preview protegido READY](https://grupo-saude-v4-validacao-sintetica-hqalomupb-grupo-saude.vercel.app). [GitHub Actions: 35/35 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40103661908).

As correções foram implementadas e testadas. A cobertura positiva de todas as listas/subáreas ainda é **parcial** onde os cenários estavam vazios; não se declara aprovação integral das pesquisas apenas por os jobs estarem verdes. A [matriz CSV](MATRIZ-PESQUISAS-20261024.csv) identifica estes casos em 114 combinações perfil × área.

## Causa da pesquisa da Agenda em 6744ab7

O input só atualizava a variável `search` no `onsubmit` de `#agendaFilters`. Escrever ou limpar pelo controlo nativo não aplicava a pesquisa; mudar de vista podia descartar o texto ainda não submetido. Havia ainda três problemas: contagem anterior à pesquisa, comparação sem normalização de acentos e ausência do nome da clínica nos campos pesquisados. A autorização do domínio não causava a falha e foi preservada.

A correção aplica a pesquisa em `input` e `search`, preserva foco/cursor, aceita submissão como alternativa, conta marcações encontradas e apresenta ausência de resultados. Pesquisa título, local, nome do titular e clínica, apenas depois de `GSAgenda.list` aplicar as permissões. Disponibilidade de horários continua calculada sobre todas as marcações autorizadas do período, nunca sobre o subconjunto encontrado. Limpar não apaga filtros ou marcações. Alterar identidade/permissões limpa pesquisa e filtros, incluindo o estado.

A suite anterior verificava existência/foco do campo e operações da Agenda, mas não introduzia termos. Essa lacuna permitiu que a regressão escapasse aos testes visuais.

## Inventário dos mecanismos específicos

Os controlos criados por JavaScript foram incluídos; não se procurou apenas `type=search` no HTML inicial. Campos de autenticação, endereços de email e filtros de datas/estados não foram classificados como pesquisas textuais.

| Pesquisa | Campos e origem | Autorização e combinação | Correção / evidência funcional |
| --- | --- | --- | --- |
| Agenda — `agendaFilters.search` | Título, local, pessoa, clínica; `GSAgenda.list` | CEO/Administração e administrativas autorizadas; titular, clínica, estado e dia/semana/mês | Aplicação imediata, acentos, contagem real, vazio, limpar, foco; `agenda-rh-browser.py` |
| Documentos das clínicas — `clinicDocumentSearch` | Nome de clínica nas fichas renderizadas | `AccessScopeV4.canClinic`; não indexa documentos de outras clínicas | Normalização de acentos/espaços; `search-browser.py` |
| Dashboard — `dashSearch` | Nome das opções de clínicas autorizadas | `AccessScopeV4.dashboard`; selecionar clínica e aplicar período | Normalização de acentos; teste das opções encontradas, nenhuma opção e limpeza. Filtra a lista de escolha, não altera sozinho os indicadores |
| Livro de Ponto da gestão — `attendanceSearch` | Nome/função dos colaboradores da lista de assiduidade | Apenas gestão; clínica e mês; área pessoal mantém permissões próprias | ID/tipo acessíveis, acentos e foco após renderização; `search-browser.py` |
| Stock — `stockSearch` | Dados visíveis das linhas de inventário, movimentos, pedidos, encomendas, fornecedores e configuração | `GSStockDemo.call` aplica clínica/permissões antes de renderizar; empresas reservadas continuam CEO | Antes só `change` e só inventário. Agora pesquisa imediata no painel corrente, sem reconstruir o formulário; vazio e contagem; `stock-tables-browser.py` |
| Reclamações — `complaintSearch` | Título e nome do reclamante; `items()` autorizado | Clínica, responsável, etapa, período; sem ampliar acesso | Antes exigia Aplicar e não normalizava acentos. Agora input imediato mantendo filtros/foco; `complaints-enhancements-browser.py` |
| Financeiro — `financeSearch` | Células de faturas, recibos e movimentos apresentados | Bootstrap/extratos já autorizados; combinado com estado | Exclui textos dos botões da pesquisa; estado vazio/contagem; testes de fatura criada em `finance-browser.py` e inventário em `search-browser.py` |
| Financeiro — `financePersonSearch` | Nome, clínica e especialidade das opções autorizadas | Gestão; seleção seguida de Consultar | Testes de correspondência/ausência/limpeza e identificação do extrato devolvido ao selecionar o colaborador, em `search-browser.py` |
| Operação — `data-history-search` | Projeção legível dos eventos, responsável, data e alterações | Apenas eventos já fornecidos ao componente autorizado; conteúdo sensível continua minimizado | Acentos e espaços; correspondência, vazio e limpeza sem remover eventos em `stock-tables-browser.py` |

São nove famílias específicas de pesquisa. Várias instâncias podem existir em fichas/históricos; não se confundem instâncias com mecanismos independentes.

## Pesquisa transversal: matriz por área

`global-search-v4.js` pesquisa exclusivamente o DOM já renderizado e autorizado. Não constrói um índice global do armazenamento nem consulta pessoas de outras clínicas. Os restantes testes de domínio/API continuam responsáveis pela autorização, que a pesquisa não substitui.

| Área / subárea | Registos abrangidos ou motivo para não haver pesquisa adicional | Estado / limite |
| --- | --- | --- |
| RH / Colaboradores | Botões canónicos de colaborador; nome, email, perfil, profissão e clínicas autorizadas | Removido pré-filtro concorrente de `clinic-hr-architecture.js`; limpar recupera a lista; teste de atualização da lista com pesquisa ativa e abertura da ficha |
| RH / Candidatos | Cartões de candidatos; dados mostrados e etapa selecionada | Incluídos `.candidate-card`/`.funnel-card`; opções de outras etapas não contam como conteúdo da candidatura |
| Meu RH / documentos, férias e pedidos | Linhas de consulta já autorizadas; formulários continuam intactos | Lista vazia não comprova pesquisa positiva; não se indexam campos de edição ou anexos binários |
| Livro de Ponto pessoal | Tabelas/linhas de consulta da própria área | Não concede acesso à gestão de outros colaboradores |
| Operação / Dia Clínico | Linhas e tarefas renderizadas; histórico tem pesquisa própria | Não modifica abertura, contagens operacionais ou dados históricos |
| Pedidos / Call Center | Cartões, tabelas e linhas renderizadas | Filtros de clínica/perfil continuam a limitar os dados disponíveis |
| Tarefas | `.task-row`, `.task-card` e registos apresentados | Não oculta campos editáveis para simular resultados |
| Chat | Conversas já disponíveis ao utilizador | Não passa a ser pesquisa do arquivo integral das mensagens; não carrega conversas não autorizadas |
| Marketing | Cartões de contactos e linhas das listas apresentadas | Não pesquisa métricas remotas, anexos ou conteúdo ainda não carregado |
| Caixas | Linhas do financeiro já autorizadas; sem segundo controlador | Pesquisa apenas os dados carregados; comprovativos não são indexados por conteúdo |
| Financeiro / gestão | Linhas/tabelas de gestão autorizadas | Campo genérico retirado quando já existe a pesquisa financeira específica |
| Tabelas | Cartões canónicos de configuração e linhas de consulta | Incluída pesquisa dos cartões; os destinos e controladores existentes não foram duplicados |
| Auditoria | `.audit-line`, `.audit-item` e tabelas autorizadas | Não indexa logs externos nem campos reservados não mostrados |
| Alertas / notificações | Linhas/listas apresentadas | Não equivale a pesquisa de notificações arquivadas ou não carregadas |
| Dashboard | Pesquisa específica da lista de clínicas | Retirada pesquisa genérica redundante sobre o painel de indicadores |
| Relatórios | Filtros e relatórios existentes | Retirado campo genérico sem índice de registos próprio; não foi criado um motor de pesquisa fictício |
| Segurança | Operações e indicadores existentes | Retirado campo genérico decorativo sem lista pesquisável; todas as ações permanecem |
| Agenda, Clínicas, Stock, Reclamações | Utilizam os campos específicos acima | Retiradas pesquisas genéricas sobrepostas |
| Catálogo, contratos, calendários e janelas sem pesquisa própria | Seletores/filtros existentes e respetivas listas | Não foram acrescentados campos de pesquisa indiscriminadamente; não se declara pesquisa de documentos binários ou de todas as janelas |

## Falhas transversais corrigidas

- Dois filtros no RH podiam fazer desaparecer colaboradores até renderizar novamente a lista. Agora há uma única filtragem de apresentação sobre a lista autorizada completa.
- A pesquisa genérica alterava `style.display`, misturando o seu estado com o dos filtros dos módulos. Usa agora um atributo próprio; limpar não desfaz `hidden` ou os estilos de autorização/filtros existentes.
- Os seletores omitiam cartões de candidatos e linhas de tarefas/auditoria. Foram incluídos registos concretos; formulários, diálogos e linhas de edição não são escondidos como se fossem resultados.
- Textos de ações e todas as opções de seletores provocavam correspondências falsas. Os botões são excluídos; apenas a opção selecionada pode integrar o texto do registo.
- Atualizar o conteúdo podia mostrar novamente registos incompatíveis com o termo atual. Um observador por vista reaplica o filtro após mudanças de estrutura, sem duplicar listeners nem observar os próprios atributos de ocultação.
- Mudanças de utilizador/permissões limpam o termo e a contagem; não se conserva uma pesquisa do CEO na simulação de outro perfil.

## Acabamentos visuais deste bloco

Mantido o cabeçalho compacto já aprovado no tablet, logótipo original, menus e design system comum. Ajustes limitados a pesquisa e feedback: quebra de linha dos controlos em ecrãs estreitos, tamanho mínimo do campo, contagem anunciada por `role=status`, ausência de resultados compreensível, foco preservado e remoção das pesquisas sobrepostas/decorativas identificadas. Sem novos módulos, tabelas, serviços ou alterações de regras de negócio.

A validação visual global continua nas suites `design-system-browser`, `global-layout-browser`, `audit-complete-browser` e `audit-expanded-browser`. As imagens de referência originais não estavam disponíveis como ficheiros neste ambiente: não se afirma correspondência pixel a pixel aos mockups. A comparação usa as fixtures CSS versionadas e capturas sintéticas, conforme o relatório do redesign anterior.

## Testes e limites de aprovação

- Local: `npm test`, sintaxe JavaScript/Python, `git diff --check` e build estático. O Playwright local não tinha o executável Chromium instalado; isso não é tratado como teste aprovado. Chromium efetivo é executado no GitHub Actions.
- `ae1d789`: 34/34 jobs aprovados no run [40093188111](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40093188111).
- `edc4cbe`: 35/35 jobs aprovados no run [40093796240](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40093796240). A primeira versão da suite de pesquisas fez 1 044 verificações, zero falhas, em seis perfis × três formatos × dois temas. Incluiu 348 visitas autorizadas. Não cobria ainda o atalho Financeiro; a versão seguinte ampliou esse percurso.
- `1fca389`: 34 jobs aprovados e um erro na expectativa da suite de pesquisa. O teste usava «Férias» ao saltar um nome curto na assiduidade. Corrigido para pesquisar primeiro o nome/função efetivo; não se alterou a regra do módulo para satisfazer o teste.
- As verificações positivas não são inferidas da existência de um campo. A suite regista explicitamente áreas sem registos populados. Os testes específicos criam dados para Agenda, Stock, Reclamações e Faturas.
- Uma execução sintética e PostgreSQL descartável não comprova autenticação ou persistência central em produção. Estes bloqueios permanecem abertos. Nenhum escritor real foi ativado.

A conclusão e os links do último ciclo de validação/preview serão registados abaixo depois de existirem resultados efetivos.

## Achados do ciclo ampliado `0d93889`

A ampliação dos testes encontrou duas situações adicionais antes de publicar:

1. **Financeiro, pesquisa de colaborador:** a opção mostra `nome · função`, mas o índice pesquisava nome, especialidade e clínicas, omitindo a própria função apresentada. Copiar o texto visível da opção podia não produzir correspondência. A pesquisa passou a incluir o texto da opção já autorizada, preservando as clínicas/especialidade e o acesso ao extrato.
2. **RH, cartão de aprovações:** a lista de colaboradores podia ser renderizada sem o cartão, que só reaparecia no `sync` periódico de 700 ms. A comparação visual capturou 20 controlos numa fase e 21 na outra. A renderização da lista chama agora o sincronizador existente imediatamente; o teste também sincroniza a projeção antes de comparar os mesmos controlos, sem ignorar o botão ou retirar verificações.

O ciclo com estes dois achados não é apresentado como aprovado. Os seus artefactos de diagnóstico foram consultados para identificar as diferenças.

### Reprodução histórica isolada

`tests/fixtures/agenda-search-6744ab7.js` preserva o ficheiro original da Agenda em `6744ab7`, apenas para testes, excluído do build. `search-browser.py` carrega essa fixture numa sessão tablet separada, cria uma marcação sintética pessoal e verifica a reprodução da ausência de binding, contador desatualizado, limpeza sem aplicação e incompatibilidade de acentos. O restante programa/domínio é o atual; não se afirma que foi reconstruído todo o deployment histórico. As verificações do comportamento corrigido usam o código atual em sessões novas.

## Primeiro ciclo completo após as correções — `c045afa`

[Run 40102064310](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40102064310): **35/35 jobs aprovados**, incluindo 33 suites Chromium, regressão automática e PostgreSQL descartável. A suite de pesquisas concluiu **1 164 verificações**, zero falhas: 384 verificações de navegação autorizada e 780 de comportamento. São 19 áreas, seis perfis, três formatos e dois temas. A reprodução histórica isolada confirmou os quatro defeitos descritos acima.

| Perfil | Verificações da suite de pesquisas | Falhas |
| --- | ---: | ---: |
| Call Center | 114 | 0 |
| Médico | 66 | 0 |
| Técnico | 66 | 0 |
| Administrativo | 126 | 0 |
| Administração | 390 | 0 |
| CEO | 402 | 0 |

Estas quantidades são verificações, não números de funcionalidades distintas. O número varia com os acessos autorizados. A matriz detalhada está em [MATRIZ-PESQUISAS-20261024.csv](MATRIZ-PESQUISAS-20261024.csv), com 114 combinações perfil × área e limites explícitos.

### Pendências de cobertura, sem declaração de aprovação total

A primeira carga do extrato financeiro estava vazia nos 36 contextos da suite transversal. A pesquisa positiva de faturas é coberta por uma suite com upload/criação real de fatura sintética; isso não prova todos os casos de recibos/extratos populados em todos os dispositivos. Pedidos, Marketing, alertas e Meu RH também precisam de cenários populados adicionais para aprovação positiva integral da pesquisa transversal. Chat teve pesquisa positiva nos cenários com conversas; os restantes perfis não são aprovados por ter uma lista vazia. As linhas correspondentes da matriz são **parciais**, mesmo com jobs verdes.

Não se afirma cobertura de todas as combinações possíveis de campos, paginações, estados, anexos e dados históricos nem pesquisa de conteúdo de PDFs. A autenticação real, os fornecedores externos e a persistência central continuam fora do preview.

### Acabamento visual adicional comprovado nas capturas

A revisão manual da captura tablet de Tabelas encontrou duas entradas «Agente de Testes»: `shortcut_testAgent`, organizado pelo menu atual, e `gsTestAgentButton`, injetado pelo inicializador antigo aos 1 200 ms. Ambos abriam `GSTestAgentV4.panel`. O inicializador antigo passa a servir apenas de fallback quando não existe o atalho canónico, e a organização do menu remove apenas a entrada redundante se ambas existirem. O módulo, painel, dados e controlador são preservados. Acrescentada verificação dos seis perfis para unicidade e permissões do destino.

O teste de gestos de candidatos aguardava o ID do botão antigo para sincronizar a inicialização. A espera passou a usar `GSTestAgentV4.ready`, ativado apenas depois de terminar a preparação existente; todos os gestos, confirmações e verificações de persistência continuam no teste. Não se substituiu a espera por um atraso arbitrário.

Na revisão dos filtros de Stock, a categoria fica visível apenas no inventário, onde é aplicada. A seleção é preservada quando se regressa ao inventário. As linhas do histórico de compras/preços também são indexadas pelo mesmo campo, quando o perfil já tem acesso a custos. A suite passou a testar categoria + termo + limpeza e pesquisa de um pedido de material efetivamente criado.

## Resultado final e preview — `ff0b6a2`

- [GitHub Actions 40103661908](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40103661908): **35/35 aprovados**, com 33 suites Chromium, regressão Node e PostgreSQL sintético descartável.
- Suite transversal: **1 200 verificações, zero falhas**, em seis perfis × três formatos × dois temas. São **780 verificações de comportamento de pesquisa** e **420 de navegação/unicidade do menu**. As quantidades não representam 1 200 funcionalidades distintas.
- Agenda/RH: **1 338 verificações, zero falhas**, incluindo pesquisa com termos parciais, pessoa, clínica, acentos, ausência de resultados, limpeza, foco, vistas e operações existentes.
- Design: **36 contextos, 783 verificações, zero falhas**. A revisão geométrica classificou 250 ocorrências como falsos positivos, nenhuma falha real ou pendente nesse conjunto, com 74 secções abertas e seis controlos negativos de divulgação. Isto não prova ausência de todos os problemas visuais possíveis; as capturas foram também inspecionadas manualmente.
- A suite de arrastamento de candidatos voltou a passar aguardando a prontidão efetiva, preservando os testes de rato/toque/caneta, confirmações e persistência.
- Stock voltou a passar com os cenários adicionais de categoria e pedido criado.

| Perfil | Verificações transversais finais | Falhas |
| --- | ---: | ---: |
| Call Center | 120 | 0 |
| Médico | 72 | 0 |
| Técnico | 72 | 0 |
| Administrativo | 132 | 0 |
| Administração | 396 | 0 |
| CEO | 408 | 0 |

### Evidências para consultar

- [Pesquisas, inventário e reprodução da Agenda antiga](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40103661908/artifacts/12564345718).
- [Agenda/RH — operações e pesquisas](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40103661908/artifacts/12562819886).
- [Comparações visuais](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40103661908/artifacts/12563856623).
- [Layouts, tabelas e diálogos](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40103661908/artifacts/12563408145).
- [Gestos de candidatos](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40103661908/artifacts/12564026553).
- [Revisão visual completa](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40103661908/artifacts/12563962310).

Os artefactos são sintéticos e têm retenção de 14 dias. Os formatos são emulados em Chromium; não se afirma execução num tablet físico. A reprodução antiga usa a fixture original da Agenda, não todo o deployment antigo.

### Publicação e segurança

[Preview direto](https://grupo-saude-v4-validacao-sintetica-hqalomupb-grupo-saude.vercel.app) — deployment `dpl_3k4awdcWL26rGcn26uQoivnRY4cJ`, estado **READY**, target **staging**, projeto isolado `grupo-saude-v4-validacao-sintetica`. Código `ff0b6a2`, sem promoção a produção.

O pacote tem 98 ficheiros da aplicação, comparados byte a byte com o build, mais configuração isolada e manifesto. Não inclui backend, funções, cron, `.env`, credenciais, bases de dados, caches ou backups. O scanner dos padrões de segredos não encontrou ocorrências; isto complementa a seleção explícita dos ficheiros e não substitui uma garantia absoluta sobre qualquer possível segredo.

Foram confirmados por HTTP autorizado: manifesto e `/api/version` com o SHA exato, HTML inicial, Agenda, pesquisa global, menu, agente de testes, Stock, Financeiro e logótipo original. Os ficheiros consultados correspondem exatamente ao pacote testado. `/api/auth`, `/api/agenda`, `/api/finance` e `/api/stock` devolvem 404: nenhum escritor foi ativado. CSP `connect-src 'self'`, política de microfone/câmara desativados e `noindex` preservados. A proteção SSO existente continua ativa para todos os deployments.

Chromium foi executado no build isolado em CI. O deployment protegido foi verificado por HTTP e identidade do pacote; não se afirma navegação Chromium autenticada pelo SSO no URL publicado. A validação física no tablet continua a cargo do utilizador.

Persistência exclusivamente no navegador/origem, sem sincronização entre dispositivos ou entre URLs de previews. Não foram importados ou apagados dados de previews anteriores. Main, produção e PR em rascunho foram preservados. O commit de relatório posterior contém apenas documentação, sem alterar o código servido por este preview.

### Próximos testes prioritários

1. Criar cenários populados adicionais para pesquisas de Pedidos, Marketing, alertas, Meu RH e conversas dos restantes perfis; manter as linhas parciais da matriz até existirem resultados positivos efetivos.
2. Expandir a pesquisa de recibos e extratos populados em todos os formatos/temas, sem confundir a cobertura da fatura sintética com estes casos.
3. Validar fisicamente o preview no tablet, sobretudo teclado, limpeza, troca de filtros e entrada única do menu.
4. Manter autenticação/persistência central e fornecedores reais como bloqueios separados; esta entrega não os ativa nem os declara concluídos.
