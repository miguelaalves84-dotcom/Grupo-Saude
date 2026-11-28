# Tarefa #14 — consolidação de Meu RH e backoffice

Base auditada: ce197b56, branch dev/v4-stabilization-20261017. PR #13 em rascunho. Sem alterações à produção.

| Área | Existente / origem | Decisão |
|---|---|---|
| Meu RH | hr-separation-v4.js: dados, saldo, pedidos, documentos | Reutilizar; adicionar acesso contextual aos fluxos documentais, sem recriar perfil |
| Documentos pessoais / contratos | employee-documents-core-v4.js, document-catalog-core-v4.js, employee-documents-ui-v4.js | Reutilizar catálogo, checklist, upload e revisão; não criar arquivo paralelo |
| Ponto / saída extraordinária | attendance-core-v4.js e attendance-ui-v4.js | Preservar GPS, tolerâncias, pedidos manuais, aprovações e histórico; nenhum segundo menu de saída |
| Férias e baixas | hr-leave-domain-v4.js e hr-leave-ui-v4.js | Reutilizar pedidos, calendário e aprovações |
| Financeiro | finance-ui-v4.js e fonte central existente | Atalhos para recibos, faturas e conta corrente, sujeitos às permissões existentes |
| Avaliação / pares | hr-performance-domain-v4.js e UI | Preservar publicação autorizada, ciclos e respostas; questionários institucionais não substituem avaliações entre colegas |
| Formação | hr-development-core-v4.js; hrTraining | Gestão exclusiva CEO/Administração preservada. Consulta pessoal prevista pela tarefa #14: projeção restrita do próprio, sem expor equipamentos, despesas, participantes ou anexos de gestão |
| Backoffice | ficha central, aprovações e hrContent | Integrar um único acesso aos documentos institucionais e pedidos, com filtros, sem novo cadastro de pessoas |
| Declarações | Sem fluxo de modelos/pedido/assinatura verificável encontrado | Implementar pedido, modelo e preparação rastreável; assinatura real bloqueada até fornecedor validado, nunca aceitar booleano enviado pelo navegador |
| Regulamentos / comunicados | Sem confirmação institucional por versão encontrada | Conteúdos versionados por âmbito; confirmação Tomei conhecimento distinta de assinatura digital |
| Questionários institucionais | Avaliações entre pares existentes, finalidade diferente | Conteúdo versionado; respostas imutáveis; alteração material gera nova pendência, preservando as anteriores |
| Ajuda | Ajuda dispersa | Tutorial por perfil reabrível e manual PT-PT pesquisável com atalhos para os módulos existentes |
| Autenticação / arquivo / assinatura | APIs isoladas com fail-closed; preview estático local | Não declarar operação central, armazenamento privado ou assinatura digital real no preview |

## Limites e segurança

Reutilizar users/employees/clinics, app_settings e audit_log; sem migração ou novos cadastros. Os novos conteúdos institucionais e pedidos têm finalidade distinta dos documentos pessoais. Não copiar CV, recibos ou ficheiros pessoais para estes conteúdos. Nenhuma ligação externa, credencial, email real ou fornecedor será ativado.

Administração limitada às clínicas autorizadas; CEO global conforme permissões. Administrativo não ganha gestão institucional automaticamente. Negação por API, domínio e interface; simulação não herda privilégios do CEO. Formação pessoal, quando consultável, é apenas uma projeção mínima, mantendo toda a gestão e anexos reservados.

## Implementação entregue

| Bloco | Resultado real | Origem reutilizada / evidência |
|---|---|---|
| Meu RH | Novo acesso a documentos da empresa, pendências e ajuda; perfil, documentos pessoais, ponto, férias/baixas, avaliação e financeiro continuam nos módulos existentes | hr-portal-ui-v4.js, hr-separation-v4.js, controladores anteriores; regressão completa |
| Backoffice | Publicação de conteúdos, filtros por clínica/colaborador, modelos, pedidos e histórico | Dentro de Recursos Humanos; mesmo cadastro users/employees/clinics |
| Declarações | Pedido do colaborador, rascunho automático, conferência RH, recusa com motivo e devolução do resultado; preparação regista SHA-256 do rascunho | hr-portal-core-v4.js e lib/hr-portal-service.js; fluxo UI e PostgreSQL entre identidades |
| Assinatura digital | Bloqueada; não existe prestador/arquivo operacional, ficheiro assinado nem conclusão real | complete falha mesmo com verified/signature enviados pelo navegador; ver plano de integração |
| Gerentes | Autorização por clínica exclusiva do CEO; histórico; não cria sétimo perfil | Domínio e permissões testados; autorização não equivale a assinatura |
| Regulamentos | Tomei conhecimento associado a identidade, versão e data/hora; versões anteriores preservadas | Unidade, PostgreSQL e UI |
| Questionários institucionais | Perguntas/respostas, versões imutáveis; alteração de conteúdo/perguntas gera nova pendência; correção de título sem alteração material preserva resposta válida | Unidade, PostgreSQL e UI; não substitui os questionários entre pares existentes |
| Comunicados | Gerais ou por clínicas/perfis; leitura informativa ou obrigatória | Fonte institucional única; destinatários usam os cadastros existentes |
| Formação pessoal | Consulta mínima das sessões e progresso anual existentes; não expõe participantes, notas ou anexos reservados | Projeção de hrTraining e enquadramento já existente; gestão, equipamentos e despesas continuam exclusivos CEO/Administração |
| Ajuda | Guia contextual por perfil reabrível e manual PT-PT pesquisável, sem substituir módulos existentes | Pesquisa com resultados, vazio e limpeza testados |
| Notificações | Pendências e decisões derivadas dos registos canónicos; contadores e atalhos no sistema de atenção existente | attention-core-v4.js / attention-ui-v4.js; sem segunda fila de dados nem emails reais |
| API e SQL | Permissões/âmbitos, ownership, versões, idempotência, transações e controlo de concorrência preparados e testados em PostgreSQL descartável | api/hr-portal.js, authorization-service existente, app_settings e audit_log; sem migrações |
| Integração real | Ainda pendente | Interface do preview continua local; API isolada não equivale a backend central autenticado ativo |

Nenhum módulo anterior foi removido. Não foram criados cadastros paralelos de colaboradores, clínicas, contratos, documentos pessoais, avaliações, férias, ponto ou financeiro. Os conteúdos institucionais têm finalidade distinta dos ficheiros pessoais e dos questionários de avaliação entre pares. A gestão de formação e as regras contratuais existentes foram preservadas; a nova consulta pessoal não concede gestão nem acesso a anexos reservados.

## Commits e testes

- 5afa21ec: domínio, API isolada, consulta mínima de formação e auditoria inicial.
- 60843c34: interface Meu RH/backoffice, manual, notificações e suites.
- **8e5bcd698a763c284ce30bdce9428e6ad5a3d960**: âmbito completo por versão, prevenção de publicações duplicadas e seletor explícito do conteúdo atual na suite.
- [GitHub Actions: 50/50 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41493527356). Inclui npm test, build, PostgreSQL isolado, permissões/API e regressões Chromium dos módulos anteriores. A primeira execução parou num seletor ambíguo de teste entre conteúdo atual e histórico; foi corrigido antes da execução aprovada.
- Nova suite: **648/648 verificações**, 36 contextos e 36 capturas. Computador 1440×1000, tablet 1280×800 e telemóvel 390×844, claro/escuro. Chromium não representa validação física Android.

| Perfil efetivo | Verificações aprovadas | Falhas |
|---|---:|---:|
| Call Center | 108 | 0 |
| Médico | 108 | 0 |
| Técnico | 108 | 0 |
| Administrativo | 108 | 0 |
| Administração | 108 | 0 |
| CEO | 108 | 0 |

Cada número conta verificações repetidas nas seis combinações de ecrã/tema, não 108 funcionalidades distintas. Os perfis de colaborador testam também o pedido → decisão CEO → consulta da decisão com histórico, através de alternância sintética no mesmo navegador. PostgreSQL testa persistência entre identidades independentes, concorrência e recusa de acesso por API; não se declara sessão real entre dispositivos no preview.

[Capturas e resultados da suite](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41493527356/artifacts/13164864269), retidos durante 14 dias. [Resultados detalhados versionados](evidence/issue14-meu-rh-20261102-results.json).

## Preview READY verificado

https://grupo-saude-v4-validacao-sintetica-k72nr271d-grupo-saude.vercel.app

Deployment dpl_GeUmEMeowNz7VfTBS5R7i8o9K5wP, staging protegido. HTTP 200 na página, manifesto e novos módulos; HTML, JavaScript e CSS comparados integralmente com os ficheiros testados. Manifesto identifica o SHA e declara autenticação central, persistência, assinatura, emails e arquivo privado não operacionais no preview. A proteção Vercel permanece ativa e pode pedir login autorizado.

Percurso: Meu RH → Documentos da empresa; Recursos Humanos → Documentos da empresa e declarações. O backoffice permite publicar conteúdos sintéticos para depois validar noutro perfil. Nenhum regulamento ou declaração real é automaticamente publicado. A biblioteca nova pode começar vazia e apresenta instruções úteis. Dados guardados em hosts de previews anteriores não são importados automaticamente; os deployments anteriores não foram alterados.

## Segurança, preservação e pendências

107 assets de aplicação e _headers no build; pacote final de 110 objetos estáticos. Sem executáveis de backend, .env, bases de dados, backups privados ou documentos pessoais no pacote. Ficheiros novos/alterados analisados para padrões de credenciais; nenhum valor de segredo foi incluído.

PR #13 mantido em rascunho. Main preservada em 84fba5a2d6d7afcb0723ca312f4e617acc22823d. Sem merge, force push, migrações, produção ou ativação de serviços reais. Não houve eliminação de código antigo ou dados: não se comprovou necessidade de remoção para este bloco.

A tarefa #14 permanece sujeita a validação humana e às integrações reais. Ver [dependências e plano de ativação](ISSUE14-INTEGRACOES-PENDENTES.md): prestador de assinatura, arquivo privado, integração UI/API autenticada, conservação/backups e validações técnicas, operacionais e legais. Não se declara assinatura válida, persistência central ativa, conformidade RGPD integral ou prontidão para dados reais.
