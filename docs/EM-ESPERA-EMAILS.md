# Em espera — à espera dos novos emails do Grupo Saúde

Decisão do responsável (25/11/2026): estas tarefas **não avançam** até serem criados os novos endereços de email.
Quando os emails existirem, retomar pela ordem abaixo e **perguntar antes** que endereço envia cada tipo de email.

| # | Tarefa | O que já está decidido | O que falta decidir quando retomar |
|---|---|---|---|
| 1 | Convites reais às 7 contas + teste de entrada dos 6 perfis + vídeo | Convidar as 7 pessoas reais; hoje os convites só vão para a caixa sintética (`SYNTHETIC_RECIPIENT_REQUIRED` em `lib/security-identity.cjs`) | Endereço remetente dos convites; ligar o envio real (Gmail por palavra-passe de aplicação, como a caixa RH) |
| 2 | Tabela de avisos por email (configurável) | Colunas: evento + hora, destinatários, texto editável, ligar/desligar, histórico de envios. Agendamento por GitHub Actions. 4 regras iniciais: **faltas** → a pessoa e a administrativa da clínica; **fecho** → administrativas; **renovações** → Administração e CEO; **resumo diário** → CEO | Endereço remetente dos avisos |

## O que já funciona e pode ser reaproveitado

- Caixa de candidaturas `gruposaude.rh@gmail.com` (`lib/rh-mailbox-service.js`): leitura IMAP e envio SMTP com palavra-passe de aplicação, guardada só no Vercel (`GS_RH_MAIL_APP_PASSWORD`, ambiente Preview).
- Agendamento `.github/workflows/rh-mailbox.yml` (de 10 em 10 minutos). Só corre quando estiver no ramo principal, ou seja, no lançamento.
- Para cada novo endereço: ativar a validação em dois passos **na própria conta**, criar a palavra-passe de aplicação **nessa conta** e guardá-la no Vercel. Não usar «Reimplante» no Vercel, porque publica em Produção.
