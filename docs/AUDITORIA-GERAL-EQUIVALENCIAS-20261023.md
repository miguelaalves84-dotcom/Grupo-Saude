# Código histórico, duplicações e equivalências

Árvores de ponta de **30 branches** lidas integralmente pela API GitHub, sem truncagem. Inventário: [branches e caminhos](AUDITORIA-GERAL-BRANCHES-20261023.json). Checkout local shallow; não é afirmada análise de cada blob de todos os commits.

As árvores históricas contêm **222 caminhos** não presentes em ddb6023. A origem a6edf53 tem 211 caminhos ausentes; ebc2df5 tem 195. Os dois checkpoints divergem da branch atual; não se pode inferir integração integral por ancestralidade. A comparação merge-base→head, isoladamente, não identifica tudo o que só existe na outra ponta.

Entre os caminhos ausentes contam-se **121 PNG e 30 ZIP** de evidência histórica, além de documentos, testes, fixtures e módulos. Estão recuperáveis por SHA no Git remoto histórico; não foram apagados nesta auditoria nem importados para o programa. Os 23 caminhos executáveis abaixo não equivalem a 23 funcionalidades desaparecidas.

| Origem histórica ausente | Destino/equivalência atual | Avaliação e ação proposta |
|---|---|---|
| api/v4-clinic-stock.js | api/stock.js, lib/stock-service.js, clinic-master-v4.js | Stock atual mais completo; não restaurar uma segunda API/ledger sem comparação funcional. Leituras documentais centrais antigas exigem reconciliação. |
| authenticated-modules-v4.js | authenticated.html, authenticated-v4.js, session-v4.js | Regressão da preparação: a área atual liga Financeiro/Recrutamento; já não contém os botões/leitores centrais Clínicas/Stock antigos. |
| clinic-documents-core-v4.js | clinic-master-v4.js, document-catalog-core-v4.js | Regras demo atuais usam catálogo único, requiredDocuments/documents. Rever compatibilidade com documentRequirements e versões/documentId antigos antes de recuperar dados. |
| clinic-documents-ui-v4.js | ClinicMasterV4.documents | Consulta atual em modal; a separação Gestão→centro documental/Tabelas→mestre regrediu. CLINIC-NAV-01. |
| db/migrations/v4-clinics-stock-001.sql | db/migrations/stock-v4-recovery-001.sql e serviços atuais | Modelos diferentes; preservar migrações anteriores e definir mapeamento, sem executar DDL ou criar tabelas concorrentes. |
| db/migrations/v4-identity-001.sql | proxies de sessão/Financeiro existentes | Preparação específica do Grupo 1 não equivalente/validada; não executar migração nesta fase. |
| lib/clinic-stock-service.js | lib/stock-service.js e controladores documentais | Equivalência Stock parcial/por capacidade; arquivo clínico autenticado antigo precisa de revisão. |
| lib/identity-records-service.js | FinanceService.people / authorization-service | Cadastros existentes reaproveitados, mas preparação histórica do Grupo 1 ausente. Rever campos/vigências/escopo. |
| lib/identity-runtime-config.js | api/v4-finance.js configured | O guard antigo exigia recurso/base/host/utilizador de testes específicos; o atual guard não é substituição documental comprovada dessa preparação. Restaurar requisitos de isolamento na futura integração, sem ativar serviços. |
| lib/identity-service.js | FinanceService / proxies atuais | Revalidação do marcador gs_identity_environment a cada operação não está preservada como tal. Lacuna de preparação, não evidência de acesso a produção. |
| module-demo-fixtures-v4.js | fixtures das suites atuais | Material de teste, não módulo a reinstalar no programa. Comparar cobertura e dados antes de reutilizar. |
| module-demo-v4.js | controladores de domínio atuais | Evitar um segundo writer demo. Reutilizar apenas capacidades comprovadamente ausentes. |
| profile-validation-fixtures-v4.js | profile-audit-browser.py / contextos sintéticos | Fixtures históricas para compatibilidade, não novos utilizadores reais. |
| nav-tables-v4.js | workspace-shell-v4.js, tables-canonical-controller-v4.js | Legado substituído; não reintroduzir listeners concorrentes. |
| tables-clinic-unified-v4.js | clinic-single-source-v4.js e mestre atual | Fonte única mantida; reparar destinos atuais em vez de instalar outro mestre. |
| v4-backend.js | api/v4.js e serviços autorizados | Adaptador histórico não deve ser reinstalado em paralelo; revisão de recursos/endpoints por capacidade. |
| v4-clickable-tables.js | controlador canónico das Tabelas | Legado substituído; sem prova de que seja necessário voltar a carregá-lo. |
| v4-core-fixes.js | domínio e guards atuais | Corrigir regressões específicas onde existam; não reativar patch global antigo sem dependências. |
| v4-pending-features.js | módulos atuais e matriz de requisitos | Pacote antigo não é prova de funcionalidades operacionais. Rever capacidade a capacidade. |
| fixed-roles-dynamic-permissions-v4.js | access-policy-core-v4.js / role-access-admin-v4.js | Equivalência de intenção; diferenças de negação CEO documentadas em PERM-CEO-01. |
| hr-document-funnel-v4.js | employee-documents-core/UI e Catálogo Mestre | Remoção/delegação já documentada no index. Não reinstalar funil documental paralelo. |
| role-permissions-v4.js | política partilhada e editor atual | Evitar duas matrizes de permissões. Auditar escopo/decisões por núcleo. |
| v4-hr-employee-profile.js | HRMasterV4 + RHDevelopmentV4 | Ficha atual mais completa em várias áreas; funções antigas só recuperadas depois de comparar campos/fluxos. RH-TIME-01 é uma divergência atual comprovada. |

## Decisões sobre remoção

Nenhum ficheiro funcional, dado, documento, histórico ou migração foi removido. O inventário de referências inclui imports, scripts HTML, chaves e tabelas; nomes repetidos em closures de clinic-hr-architecture/gs-enterprise não provam duplicação ativa. Também não se conclui que um módulo é usado apenas por ter o nome referido num relatório.

Writers legados de Operação e Clínicas já têm testes de bloqueio/delegação, preservados nesta auditoria. Não foi provado código morto suficiente para autorizar uma remoção. Restam riscos de inicialização/percursos alternativos e reconciliação users/employees: LEGACY-REVIEW e HISTORY-DEPTH.

Não foram encontrados nomes de ficheiros .env exatos, chaves .pem, id_rsa ou credentials.json nas 30 árvores de ponta consultadas. Isto não substitui um scanner de todos os conteúdos de todos os commits nem certifica ausência absoluta de segredos no histórico. Os ficheiros novos de auditoria foram revistos antes do commit.
