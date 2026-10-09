# Grupo Saúde V4 — consolidação das cinco melhorias do PR #11

Branch: `feat/v4-consolidation-dashboard-access`. Referência publicada confirmada antes das alterações: `c070007888e6a07c8b6ae457c41976f21699bea5`, preview Cloudflare `https://958e8dbc.grupo-saude.pages.dev`. Alterações incrementais sobre esta árvore; sem merge, restauro, execução de migrações remotas, envio real de emails ou alterações a dados de produção.

## Implementação

1. **Centro de atenção**: cálculo comum de contagens vermelhas no cabeçalho, módulos, grupos e submenus; 99+; deduplicação por registo/estado/destinatário. Fontes existentes: faturas, recibos, movimentos, pagamentos novos, pedidos de ausência, documentação, candidaturas, ocorrências, pedidos operacionais, tarefas, mensagens, avaliações e questionários. As contagens incluem apenas assuntos que exigem atenção. Ler não aprova nem resolve; a conclusão do processo remove a pendência. Notificações informativas podem ser explicitamente reconhecidas. Revogações, alternância de perfil e âmbito clínico são reavaliados antes de abrir cada assunto. Links financeiros, pedidos, ausências, documentos, candidatos e conversas usam os controladores existentes; tarefas/alertas abrem o módulo correspondente.
2. **Layout**: reutilização do shell e estilos comuns, grupos expansíveis sem segunda navegação; tema claro/escuro, expansão e recolha guardados por utilizador. Preferência anterior de tema é utilizada como valor inicial, sem apagar escolhas. Melhoria de tablets, telemóveis, contraste de calendários/modal em modo escuro, foco de teclado e movimento reduzido.
3. **RH**: novo separador Ficha central na ficha mestre existente; contrato, admissão, documentação, ausências, ponto, ocorrências e assuntos pendentes, com ligação aos restantes separadores e ao Financeiro. Fontes consultadas diretamente, sem novos cadastros paralelos. Documentos de `employees[id].hr.documents` deixam de ficar excluídos. Candidatos continuam separados. Fichas, calendários e decisões da Administração respeitam clínicas autorizadas; gravação e remoção de fotografias também verificam o alvo. Rascunhos de outros colaboradores deixam de ser apagados ao criar uma ficha; associações históricas a clínicas inativas/fora do âmbito editável são conservadas. Histórico usa identificadores, não correspondência parcial por nome. Eventos legados sem identificador permanecem na Auditoria; não são atribuídos a uma pessoa por adivinhação.
4. **Financeiro**: preservação de faturas, Recibos de Vencimento, contas correntes, documentos privados, bónus e pagamentos parciais. Cada novo pagamento realmente confirmado gera uma linha única numa fila SQL, na mesma transação que o pagamento. Destinatário e conteúdo provêm do registo do colaborador e do movimento no servidor. A API tenta enviar após o commit; envio é independente do saldo. Vários pagamentos no mesmo dia originam mensagens distintas. A gestão permite consultar estados e repetir rejeições explícitas com motivo. Reversão para pendente cancela envios ainda não iniciados. Reconfirmar um pagamento já notificado não reenvia a mensagem. Sem backfill automático de pagamentos antigos.
5. **Auditoria e regressões**: nomes de funções e permissões iniciais extraídos para um domínio comum; contador financeiro lateral delegado ao centro comum; corrigida a inserção do botão de aprovações dentro do respetivo grupo do menu (erro insertBefore detetado no Chromium da pipeline); suprimida a dupla renderização provocada pela abertura explícita do Financeiro e pelo evento de navegação. Testes reais de domínio/SQL, controlo de sessão, proxies e UI simulada; pipeline de regressão/build e navegador preparada para o PR. Não foram removidos módulos nem históricos anteriores.

## Ficheiros

- Navegação, apresentação e domínio: `access-policy-core-v4.js`, `role-access-admin-v4.js`, `attention-core-v4.js`, `attention-ui-v4.js`, `workspace-shell-v4.js`, `styles.css`, `index.html`, `app.js`.
- RH: `access-scope-v4.js`, `hr-master-v4.js`, `approvals-center-v4.js`, `hr-leave-domain-v4.js`, `hr-leave-ui-v4.js`.
- Financeiro: `finance-demo-v4.js`, `finance-ui-v4.js`, `finance.html`, `lib/finance-service.js`, `lib/finance-payment-email.js`, `lib/attention-service.js`, `api/v4-finance.js`, `api/v4-finance-email-job.js`, `functions/api/finance.js`, `db/migrations/finance-v4-003.sql`.
- Qualidade: `package.json`, `.github/workflows/v4-preview-regression.yml`, `tests/build.cjs`, `tests/improvements.cjs`, `tests/improvements-browser.py`, `tests/runtime.cjs`, `tests/finance-fixture.cjs`, `tests/finance-ui.cjs`, `tests/browser.py`, `tests/finance-browser.py`.
- Documentação: este relatório e `docs/V4-PAGAMENTOS-NOTIFICACOES-CONFIGURACAO.md`.

## Resultados locais

- **177 testes automáticos aprovados**: 101 regressões existentes, 8 proxy, 36 financeiro SQL/domínio/API, 12 interface financeira e 20 novas melhorias.
- Sintaxe JavaScript validada; Python de navegador compilado; `git diff --check` limpo.
- Build estático: **51 assets**, referências locais verificadas, diretório temporário isolado removido.
- SQL real em ficheiros SQLite temporários e documentos privados em disco; persistência após reabertura, concorrência de pagamentos/envios e autorização de destinatários verificadas. Provedores OAuth e email simulados; não são provas de integração real.
- Teste de derivação de 3.000 pendências, sem mutação dos dados de origem, dentro do limite de 1,5 segundos do teste.
- **Navegador local bloqueado antes de carregar a página**: Chromium falhou com `setsockopt: Operation not permitted` e `SIGTRAP`. Não se declara validação visual/manual concluída. Scripts para seis perfis, uploads, PDF, tema, notificações, ficha e responsividade estão na pipeline.
- Instalação local de dependências não concluída: ligação ao registo npm negada pelo sandbox; tentativa de autorização de rede cancelada. A pipeline instala dependências no runner. Não há lockfile novo inventado.

## Limitações e configuração pendente

- O programa principal continua uma **demonstração local**. Não carregar dados pessoais/salariais reais no armazenamento do navegador. Os novos controlos de UI não transformam essa demonstração numa aplicação autenticada.
- O Financeiro autenticado utiliza a API existente, sessões verificadas, SQL e armazenamento privado. Serviços externos de teste ainda não configurados; endpoints falham de forma fechada. Aplicar a migração 003 apenas no ambiente SQL isolado, depois das migrações anteriores.
- O centro persistente do servidor deriva notificações dos modelos SQL disponíveis: financeiro, documentos, candidaturas, pedidos e ocorrências. Chat, tarefas, férias e avaliações do protótipo continuam nas fontes locais existentes; não são sincronizados entre computadores nem foram copiados artificialmente para o servidor. A página financeira autenticada mostra os assuntos financeiros que consegue abrir com segurança.
- Serviço de envio implementado para Resend com chave exclusivamente no servidor e remetente verificado. Envio real, entrega, OAuth de receção e PostgreSQL/Blob/Auth precisam de configuração e validação no ambiente de teste; SQLite não valida todas as particularidades PostgreSQL.
- Timeout/erro desconhecido ou crash durante envio fica `Uncertain`/`Sending`. Não há repetição automática que possa duplicar emails. Confirmar entrega no fornecedor antes de uma reconciliação operacional. A janela de idempotência do fornecedor impede retries depois de 23h sem reconciliação; não é promessa de exactly-once externo.
- Pipeline adicionada, mas a obrigatoriedade dos checks para merge depende de regras de proteção do repositório; não foram alteradas configurações administrativas nem promoção de produção.

PR de revisão: https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/11. O URL imutável e o SHA do novo preview são apresentados na entrega e no corpo do PR depois de confirmação do check Cloudflare para o commit publicado.
