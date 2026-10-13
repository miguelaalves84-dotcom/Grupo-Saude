# Grupo 1 — bloco A local, identidade desacoplada

Continuação de `870d8a0c9fb1b46482b13e1ffb0733760f3e8dc4`, que tem `ebc2df5c38903fd8faf62e17b8b0a0c92faad49b` como pai. Branch `dev/v4-group1-operational-tests`. Nenhum novo cadastro de negócio, fornecedor real, recurso remoto, credencial ou migração executada.

## Implementado neste bloco

- `lib/identity-records-service.js`: extração exata da projeção que já existia em `FinanceService.people()`. Financeiro e identidade usam a mesma implementação, com os mesmos campos, perfis, associações e precedência de permissões. Nenhuma alteração de política neste bloco.
- `lib/identity-service.js`: serviço independente de Blob/Financeiro, usa users/employees/user_clinics/app_settings existentes e audit_log. Valida marcador de recurso sintético antes de cada operação. O runtime não deve receber permissão para editar esse marcador.
- `lib/identity-runtime-config.js`: recusa produção, projeto inesperado, recurso não identificado, base diferente de gs_v4_test, papel diferente de gs_v4_runtime, host Neon não autorizado, TLS sem verify-full, fornecedor/origem inesperados e reutilização de DSN Financeiro/produção. Configuração explícita inválida nunca faz fallback para outro backend.
- `api/v4-auth.js`: mantém o handler, os formulários e o contrato de sessão existentes. Quando a configuração isolada nova é válida, seleciona IdentityService sem precisar de Blob ou das tabelas financeiras. O caminho legado continua disponível para o harness existente. Nenhuma rota de fornecedor Better Auth nova montada neste bloco.
- `db/migrations/v4-identity-001.sql`: SQL **preparado, não executado**. Reutiliza app_settings e a tabela de limites já existente gmail_auth_limits; prepara um marcador de ambiente independente. Requer db/schema.sql e provisioning revisto. Não faz seed do marcador, não cria schema Better Auth, não altera dados ou cria grants automaticamente.
- `tests/identity-preparation.cjs`: incluído no npm test, apenas contratos offline com respostas SQL e fornecedor sintéticos.

## Configuração futura, não ativa

Os nomes GS_IDENTITY_ENVIRONMENT, GS_IDENTITY_DATA_SYNTHETIC, GS_IDENTITY_EXPECTED_PROJECT_ID, GS_IDENTITY_RESOURCE_ID, GS_IDENTITY_DATABASE_HOST, GS_IDENTITY_DATABASE_URL, GS_IDENTITY_ORIGIN, GS_IDENTITY_AUTH_BASE_URL e GS_IDENTITY_PROXY_TOKEN são entradas do servidor, nunca do frontend. O projeto deve ser preview, a origem HTTPS exata e o fornecedor na mesma origem em /api/group1-provider. Esse fornecedor ainda não existe; sem ele nenhum login operacional pode ser aprovado.

Não definir valores em projetos existentes. Confirmar quotas/acessos antes de criar recursos novos. O token proxy deverá ser injetado pelo encaminhador servidor, não por JavaScript no navegador. Secret de Better Auth, montagem do SDK, sessões/reset/revogação reais e driver instalado continuam pendentes.

## Evidência local e limites

27 cenários offline: configuração isolada sem Blob/Financeiro; 14 recusas de configuração; projeção/login sintético dos seis perfis; concessão/remoção de permissão e associação sem troca de sessão; impedimento de elevação de perfil; revalidação do marcador; login reutilizado com auditoria; origem e identidade inativa recusadas. A comparação FinanceService/IdentityService usa a mesma implementação extraída: prova compatibilidade dos chamadores, não uma auditoria independente da política antiga.

Casos que não foram executados: Better Auth real, PostgreSQL real neste ambiente, Neon, SMTP/Mailtrap, reset real, revogação real, duas sessões persistentes e Chromium deste bloco. Resultados locais não equivalem a aprovação no GitHub Actions. Não ativar escritores RH/Stock/Financeiro/Operação Diária.

## Estado do ambiente e recuperação

Este continua a ser o ambiente anterior, com checkout superficial. As verificações limitadas devolveram imediatamente Operation not permitted no acesso ao registry e falha de ligação ao proxy no transporte Git. Não se repetiram pedidos adicionais de permissões, Docker ou chamadas bloqueantes. Não existem psql/pg_ctl/initdb instalados. O conector GitHub permite preservar commits, mas não substitui um clone completo local nem uma instalação do SDK.

Para executar o próximo bloco é necessário um ambiente com transporte Git e instalação de dependências autorizados. Fazer clone completo, selecionar esta branch, verificar 870d8a0 e ebc2df5 na ancestralidade, ler o plano e este relatório, executar npm test/build e instalar versões verificadas de Better Auth/driver. Ensaiar SQL somente em PostgreSQL descartável. Quotas/acessos remotos continuam pendentes e a autorização geral já foi concedida dentro de 0 EUR.

## Matriz operacional deste bloco

| Área | Estado |
|---|---|
| Cadastro/perfis/permissões canónicos | Reutilizados; contratos offline testados |
| Serviço de identidade independente | Implementado, testado com SQL sintético; sem conexão operacional |
| Encaminhamento no handler de autenticação | Preparado e testado com fornecedor sintético |
| Better Auth / recuperação / sessões reais | Não instalado / não implementado operacionalmente |
| Persistência Neon e concorrência entre dispositivos | Não testadas / recursos não criados |
| Clínica central na interface | Preparação existente preservada; não ligada a backend operacional |
| RH, Stock, Financeiro, Operação Diária e restantes grupos | Implementações preservadas; sem novos escritores reais |
