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

Resultados e limitações finais serão acrescentados após testes efetivos.
