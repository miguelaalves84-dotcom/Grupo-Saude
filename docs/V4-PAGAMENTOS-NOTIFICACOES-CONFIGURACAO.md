# Configuração isolada — notificações e emails de pagamentos

Não configurar nem executar em produção. Manter os requisitos de Auth, Neon, Blob privado e proxy de `FINANCEIRO-V4-CONFIGURACAO.md`.

## Base de dados

Depois do schema e migração `finance-v4-002.sql`, aplicar manualmente `finance-v4-003.sql` na base **de teste**. Cria apenas `finance_payment_mail` e `finance_attention_read`, com índices/chaves, sem alterar pagamentos/documentos antigos ou importar históricos. Os utilizadores referenciados devem já existir. A migração não é executada automaticamente em visitas ou deploys.

## Envio de emails

No servidor financeiro de preview, configurar segredos:

- `GS_FINANCE_ENVIRONMENT=preview`, `VERCEL_ENV` diferente de production.
- `GS_PAYMENT_EMAIL_API_KEY`: chave Resend restrita ao envio de teste, guardada no gestor de segredos do fornecedor.
- `GS_PAYMENT_EMAIL_FROM`: endereço de remetente verificado, sem nome/display markup.

Resend é chamado apenas em `https://api.resend.com/emails`, com `Idempotency-Key: gs-payment-<payment_id>`. O email usa uma fotografia do nome, valor, data e descrição, e o endereço existente no servidor no instante da confirmação. Não aceita destinatários ou valores de email do cliente. Não inclui URLs públicas de recibos, IBAN ou anexos salariais.

Uma confirmação persistente cria `Queued`. O envio reclama atomicamente a linha (`Sending`). Só resposta com identificador do fornecedor permite `Sent`. Rejeições explícitas 400/401/403/422/429 ficam `Failed`, com código sanitizado; gestor autorizado pode repetir com motivo, usando a mesma referência dentro de 23h. Respostas 5xx, timeout e entrega sem confirmação ficam `Uncertain`, impedindo repetição automática. Um processo interrompido em `Sending` exige confirmação no fornecedor, não uma reposição cega da fila.

A API devolve o estado do email sem desfazer pagamentos já confirmados. Configure um scheduler externo isolado para POST `/api/v4-finance-email-job` com `{"purpose":"payments"}` e o token existente `GS_PAYSLIP_JOB_TOKEN`; `GS_PAYSLIP_JOB_ACTOR_ID` deve ser um gestor de teste ativo e autorizado. No máximo 20 linhas Queued por execução. Nenhum cron de produção foi ativado. Chamadas sem `purpose=payments` mantêm a importação anterior de recibos por OAuth.

A gestão financeira expõe `payment-email-list` (GET) e `payment-email-retry` (POST, paymentId e reason). Não permite aos restantes perfis consultar a fila nem repetir envios. Uma entrega incerta deve ser reconciliada por um operador com evidência do fornecedor; não há botão que finja confirmar entrega nem reenvio cego.

## Notificações persistentes

Endpoints na API financeira autenticada: `attention-list` (GET), `attention-read` e `attention-ack` (POST). O servidor calcula os eventos pelas fontes autorizadas, ignora destinatários/perfis enviados pelo cliente e verifica o registo novamente antes de marcar. Marcar como lida mantém ações pendentes; ack só aceita eventos informativos. Estados de leitura persistem por utilizador, independentemente da sessão. Chamadas de aprovação continuam nos controladores de negócio; o centro não atribui permissões de decisão.

Permissões individuais vêm do registo do colaborador, no servidor. Caso existam overrides de funções, o administrador de teste deve configurar `app_settings.key=role_action_permissions`, valor JSON por função e ação; ausência usa os defaults comuns. O protótipo local não sincroniza esta configuração com a base de dados.

## Validação controlada antes de uso real

Usar exclusivamente colaboradores/endereço(s) e documentos fictícios de teste. Confirmar sessão verificada e documentos privados; executar dois pagamentos no mesmo dia e observar dois provider IDs. Repetir a mesma operação e executar dois workers simultâneos; deve existir um envio por payment_id. Forçar rejeição e timeout, confirmar estados/auditoria sem alteração do saldo. Revogar permissões e testar acesso direto nos seis perfis. Só depois verificar a entrega com o responsável pelo email de teste.
