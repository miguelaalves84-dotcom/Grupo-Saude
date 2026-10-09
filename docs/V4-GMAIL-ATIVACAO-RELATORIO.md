# Grupo Saúde V4 — preparação Gmail, persistência e automação

## Referência e preservação

Trabalho iniciado após verificar a branch `feat/v4-consolidation-dashboard-access`, PR #11, head remoto `b18d22211ca52a41c137f6b8c75771cc8d604677` e Cloudflare `https://7dc1770d.grupo-saude.pages.dev`. O head local tinha os mesmos conteúdos mas história Git reconstruída; a publicação usa o head remoto como parent, árvore com base no remoto e atualização com lease, sem force. Nenhuma alteração de main/produção, restauro, seed, eliminação de históricos ou ativação externa.

A aplicação é HTML/JS partilhado, com protótipo local claramente identificado e uma área financeira persistente. Pages encaminha chamadas autorizadas para backend Node/Vercel; Neon SQL/Auth e Blob privado já estavam preparados. Foram reutilizados domínio financeiro, serviços de ficheiros, fingerprints, fila, decisões, notificações/outbox, arquivo e candidatos SQL existentes. Não foi criado um segundo módulo Financeiro/RH nem copiados documentos locais para dados reais.

## Implementação

- OAuth Gmail por cada uma das quatro funções, configurado na Lista de Emails autenticada, acessível também por Tabelas no programa. Consentimento mínimo leitura/envio, PKCE, state único com validade e sessão vinculada, conta Google verificada contra endereço, callback HTTPS restrito, tokens AES-256-GCM exclusivamente no SQL, rotação e revogação. Configuração/status nunca devolvem tokens.
- Entrada/recuperação/logout delegados a Neon Auth/Better Auth no backend existente. Cookies seguros, identidades previamente vinculadas e verificadas, limitação persistente de tentativas, ausência de inscrição pública e nenhum token de sessão em JSON/localStorage.
- Importação Gmail incremental com bootstrap, histórico, filas persistentes, leases, repetição diferida, last sync e recuperação de histórico expirado. Um erro não impede outros emails nem bloqueia descoberta. Mensagens enviadas/rascunhos não são tratadas como receção nova.
- Quarentena privada, formatos/tamanho/signatura e scanner externo obrigatório com checksum. Proposta de colaborador; confirmação/correção/classificação/recusa/histórico/email original na fila. Currículos usam o mesmo fluxo de documentos e a tabela de candidatos existente; identidade única adicional impede criação concorrente de duplicados sem apagar candidatos antigos.
- SHA-256 e origens únicos, alerta de duplicado, decisão explícita novo/substituição para documentos semelhantes. Preservadas as aprovações, movimentos substituídos a zero, valor original/histórico e regularização de pagamentos da versão anterior.
- Cópia privada de recuperação verificada antes de cada upload persistente, metadados SQL, recuperação autenticada e auditada. Declaração de recuperação SQL/PITR deve ser suportada por ensaio real no fornecedor.
- Worker Cloudflare separado preparado para cron de cinco minutos, execução autenticada no backend preview, estado de runs, continuidade entre caixas e alertas. Não foi publicado/ativado nenhum worker externo sem credenciais. Sincronização manual disponível.
- Backup Gmail com envio único controlado, aceitação distinta de receção/arquivo, confirmação humana e verificação da cópia privada. Remoção apenas operacional preparada numa operação separada, desligada por defeito, com revisão legal/checksum e conservação do acesso histórico protegido. Falhas bloqueiam eliminação; arquivos legais não são expurgados automaticamente.
- Notificações internas para pendências/falhas/duplicados e notificações individuais de pagamentos Gmail, preservando Resend/outbox anteriores e evitando repetição em entrega incerta. Permissões verificadas no servidor e interface; a matriz de funções e restrições individuais (incluindo valores numéricos) agora são consolidadas na identidade de servidor. Seis perfis preservados.
- Duplo bloqueio de ativação: ambiente opt-in, serviços presentes e revisão humana auditada de identidade, permissões, armazenamento, scanner, OAuth, recuperação, conservação e privacidade. Suspensão imediata no servidor.
- `.cfignore` exclui backend, migrações, testes, arquivos locais e configurações da publicação de assets públicos. Headers contra MIME sniffing, referências externas e inclusão indevida por frames.

## Ficheiros

Alterados: `account.html`, `account.js`, `finance.html`, `finance-ui-v4.js`, `communications-v4.js`, `api/v4-finance.js`, `api/v4-finance-email-job.js`, `functions/api/finance.js`, `lib/email-settings-service.js`, `lib/finance-mail-queue.js`, `lib/finance-payment-email.js`, `lib/finance-service.js`, `lib/document-archive-service.js`, `tests/finance-fixture.cjs`, `tests/documents-browser.py`, `package.json` e documentos de configuração anteriores.

Novos: `api/v4-auth.js`, `api/v4-gmail-callback.js`, `functions/api/auth.js`, `functions/api/gmail/callback.js`, `lib/gmail-oauth-service.js`, `lib/gmail-sync-service.js`, `lib/gmail-automation-service.js`, `lib/gmail-message.js`, `lib/document-security-service.js`, `lib/document-storage-service.js`, `db/migrations/finance-v4-006.sql`, `workers/gmail-sync/index.js`, `workers/gmail-sync/wrangler.toml`, `tests/gmail-activation.cjs`, `.cfignore`, `_headers` e este relatório/guia.

## Testes

Validação local: 264 testes aprovados (228 existentes e 36 novos), sintaxe de 91 ficheiros JS, build de 52 assets, compilação Python e diff. Testes novos cobrem OAuth/PKCE/state/conta/chaves, tokens não expostos, revisão e suspensão, seis perfis, incremental/repetição/leases, antivírus, origens/hashes, ambiguidades/recusas, CV concorrentes, ficheiros privados, recuperação/checksum, backup/entrega incerta, arquivo preservado e notificações individuais no mesmo dia.

SQL/ficheiros de teste são persistentes e temporários reais; fornecedores Google, antivírus, identidade e envio são simulados. Não provam que serviços externos ainda não configurados funcionem. A suite de navegador verifica ainda as quatro funções, navegação OAuth interceptada, sincronização manual, bloqueio de ativação e formulário de entrada sem armazenamento de credenciais, além de todos os testes anteriores. O PR regista o resultado final dos cinco jobs de CI, incluindo quatro suites Chromium em localhost e no preview do commit exato.

## Limitações e entrega

O código fica tecnicamente preparado; Gmail real, cliente Google/verificação, Neon Auth/SQL/PITR, dois Blob privados, scanner aprovado, proxy e worker/agendador/monitorização **dependem de configuração e validação externas**. Nenhuma caixa foi ligada, documento real importado, email real enviado ou ficheiro existente eliminado. O preview principal continua a demonstração local; a área persistente falha com segurança enquanto os serviços estiverem ausentes. Não há OCR nem certificação automática RGPD/jurídica. Conservação de CV/dados clínicos e expurgo final do arquivo exigem política própria revista. Gmail aceite não comprova entrega: confirmação humana permanece obrigatória. Em falha total de SQL é necessária monitorização externa.

Configuração passo a passo: [V4-GMAIL-ATIVACAO-CONFIGURACAO.md](V4-GMAIL-ATIVACAO-CONFIGURACAO.md). Links finais do commit, preview Cloudflare e CI são publicados no PR #11, mantido em rascunho, sem merge.
