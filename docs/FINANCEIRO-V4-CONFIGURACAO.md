# Configuração externa pendente — Financeiro de TESTE

Não existem credenciais/serviços novos neste ambiente. Estas instruções preparam a integração; não indicam serviços já provisionados. Não utilizar documentos salariais reais no protótipo `index.html`.

## Recursos

1. Criar BD Neon de teste, fornecedor/tenant de autenticação de teste e store Blob **privado** de teste, separados da produção. Configurar seis utilizadores fictícios e fichas com `users.auth_subject` vinculado ao ID de identidade verificada. `users.id` é a chave de autorização financeira; `employees.user_id` aponta para ela. Rever duplicados de ficha; `people()` apresenta uma identidade por user sem apagar fichas. Configurar permissões persistentes em `employees.data.actionPermissions` (por exemplo `{"account":true,"financeManage":false}`); não confiar no seletor/matriz local.
2. Aplicar `db/schema.sql` só na BD nova e depois `db/migrations/finance-v4-002.sql`. Rever migration/checks e fazer cópia se a BD já tiver dados. Não executar `/api/v4?health=1`: o health legado tem seeds e não é migração segura. Não apontar variáveis novas para recursos legados de produção; a nova API rejeita recursos com os mesmos valores das variáveis legadas e deployments Vercel production.
3. Publicar o backend Node/Vercel apenas em preview. As dependências Neon/Blob já estão no package.json; não foi introduzido SDK de email. A Cloudflare Pages Function encaminha a API para esse backend; não executa Node/Neon localmente no browser.

| Variável no backend Node | Configuração |
|---|---|
| `GS_FINANCE_ENVIRONMENT` | `preview` |
| `GS_FINANCE_DATABASE_URL` | Ligação à BD de teste, secret |
| `GS_FINANCE_BLOB_TOKEN` | Token do store Blob privado de teste, secret |
| `GS_FINANCE_BLOB_STORE_ID` | ID do store de teste |
| `GS_FINANCE_AUTH_BASE_URL` | Base HTTPS de Neon Auth de teste/bridge compatível com `/get-session` |
| `GS_FINANCE_ORIGINS` | Origens completas e exatas autorizadas, separadas por vírgulas |
| `GS_FINANCE_PROXY_TOKEN` | Secret do canal Cloudflare→Node; não autentica o colaborador |

A sessão é consultada por cookie em `/get-session`; a resposta deve conter `user.id`, `user.email` e `user.emailVerified:true` (ou `email_verified:true`). A API consulta identidade/função/permissões na BD e verifica email/ficha. Não auto-cria utilizadores por um email enviado pelo cliente. Um utilizador inativo, email não verificado/diferente ou vínculo ausente não tem acesso.

O primeiro acesso/recuperação continuam a exigir o serviço/bridge de identidade descrito em `CONFIGURACAO-TESTE-AUTH-EMAIL.md`. Implementar `/auth/sign-in`, `/auth/request-reset`, `/auth/reset`, `/auth/session` e logout com limitação de tentativas, tokens de uso único/expiração e cookies HttpOnly/Secure/SameSite. Se o bridge usar `__Host-gs_session`, deve resolver esse cookie e responder ao contrato `/get-session`; não basta enviar um cookie do bridge diretamente a um Neon Auth que não o reconhece. Novos emails precisam de verificação e atualização consistente do vínculo. Nenhuma password/token real deve ser enviada nesta conversa ou guardada no browser/código.

| Variável na Cloudflare, apenas Preview | Configuração |
|---|---|
| `GS_ENVIRONMENT` | `preview` |
| `GS_FINANCE_BACKEND_URL` | Origem HTTPS do backend de teste, `/`, sem user/password/query/path extra |
| `GS_FINANCE_PROXY_TOKEN` | Mesmo secret de canal do backend |
| `GS_PREVIEW_ORIGINS` | Origens exatas de preview e/ou alias da branch |
| `GS_TEST_BACKEND_URL`, `GS_TEST_BACKEND_TOKEN` | Bridge de autenticação pré-existente, exclusivamente de teste |

`finance.html` é o acesso financeiro realmente autenticado. `/api/finance` usa a mesma sessão segura e falha com 503 sem configuração. `index.html` continua demonstração explícita: não depende do backend para testar o desenho e regras com dados fictícios e não oferece segurança real multiutilizador. Sem bridge/migração/segredos, não é possível concluir testes reais de autenticação/persistência/email no preview.

## Email de recibos

No Financeiro autenticado, CEO/Administração com permissões de configuração escolhem endereço, Gmail/Microsoft 365, ativo, Upload/destino Recibos. A configuração é gravada em `app_settings.finance_payslip_mailbox`; a Lista de Emails local do protótipo é separada e não ativa OAuth automaticamente.

Obter autorização OAuth da mailbox de teste pelo fornecedor, com âmbito mínimo de leitura de mensagens/anexos e acesso offline para refresh. Guardar apenas no servidor:

- `GS_PAYSLIP_OAUTH_CLIENT_ID`
- `GS_PAYSLIP_OAUTH_CLIENT_SECRET`
- `GS_PAYSLIP_OAUTH_REFRESH_TOKEN`
- `GS_PAYSLIP_OAUTH_TENANT` para Microsoft 365 (tenant isolado; opcional `common`)

A ação Recolher anexos agora faz POST `email-run`, autorizado e auditado. A página recolhe lotes de 20 mensagens; a API persiste o cursor e o lote seguinte é processado noutra execução. Mensagens não são apagadas. PDFs têm hash/source key únicos e ficam com `user_id`, mês/ano vazios e Pendente; o gestor confirma todos esses campos após visualizar o PDF. Documentos malformados registarão erro sem comprometer a associação de outros recibos. Anexos acima de 3 MiB não são importados por esta primeira versão; carregar PDF reduzido/rever o limite e monitorizar mensagens ignoradas. Não interpretar importação bem sucedida como associação salarial bem sucedida.

Para recolha automática, configurar um scheduler **de teste** externo que envie POST `/api/v4-finance-email-job` com Bearer `GS_PAYSLIP_JOB_TOKEN`, secret exclusivo. Definir `GS_PAYSLIP_JOB_ACTOR_ID` como ID de gestor de teste ativo/autorizado. O job resolve função/permissões desse gestor na BD, regista execução e nunca disponibiliza automaticamente um recibo. Não existe cron novo configurado em `vercel.json` e o cron antigo não foi alterado. Registar alertas de falha/timeout e renovar/revogar OAuth pelo fornecedor. Para grandes lotes, utilizar este job direto em vez do timeout da proxy Pages.

## Validação antes de aceitação

- Seis sessões reais verificadas; negar email não verificado, vínculo incorreto, conta inativa e chamadas com role/owner falsificados.
- Upload/validação/recusa, persistência após logout/reabertura, concorrência de pagamentos e revisões em PostgreSQL.
- Documentos privados: mesmo conhecendo UUID, outro colaborador deve receber negação; nunca receber storage keys ou URL permanente. Validar PDF viewer, download e correção de associação.
- Email real de teste repetido, vários lotes, anexos malformados/oversize, credenciais revogadas e recuperação de erro; nenhuma associação automática.
- Calendários/RH/dashboard anteriores, contas próprias dos gestores, filtros, PDF e móvel.
- `npm test`, `npm run test:finance:browser` e `npm run test:browser` num ambiente que permita Chromium. Usar contextos isolados e dados fictícios.

Não promover para produção nem fazer merge enquanto estes testes de utilização não forem concluídos. Configurar limites/rate limiting no provider/proxy/backend, controlo de tamanho real, antivírus e política de retenção/backups antes de receber documentos reais.


### Email inicial de Recursos Humanos

O endereço inicial para currículos e receção de recibos de vencimento é `gruposaude.rh@gmail.com`. Pode ser alterado pelo CEO/Administração em **Tabelas → Lista de Emails**; no módulo Financeiro autenticado, a configuração de receção de recibos é guardada no servidor. As configurações já personalizadas são preservadas, incluindo endereços deliberadamente apagados. O valor inicial não ativa a integração: a recolha real exige configuração OAuth e autorização da conta correspondente. Este endereço não substitui os destinatários individuais dos pagamentos nem configura o remetente de envio.
