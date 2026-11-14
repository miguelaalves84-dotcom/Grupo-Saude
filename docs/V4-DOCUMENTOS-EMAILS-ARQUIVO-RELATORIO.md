# Grupo Saúde V4 — documentos, emails e conservação

Branch de teste: `feat/v4-consolidation-dashboard-access`, PR #11. Base confirmada: commit GitHub `b2c69a7fbf4835f3dbe1634e60f3a823cc73e9b6`, publicado no Cloudflare em https://e0c0e26f.grupo-saude.pages.dev. Sem merge na main, alteração de produção, restauro, migração remota ou eliminação de dados existentes.

## Implementação

- SHA-256 dos bytes identifica ficheiros iguais, independentemente de número, datas, nome do ficheiro, colaborador ou tipo. A resposta não revela os documentos de terceiros. Verificação de metadados: colaborador, tipo, número/série, data de emissão, mês/ano e valor, quando disponível. Os recibos passam a aceitar número e valor opcionais; não se inventam valores para documentos históricos.
- Documentos semelhantes emitidos nos últimos sete dias originam uma escolha explícita entre novo documento e substituição. O envio repete a verificação no servidor; não basta passar pelo formulário. Números/séries de fatura continuam únicos entre identidades ativas. A seleção do original e o motivo são obrigatórios; nunca se substitui automaticamente.
- Substituições são novos registos pendentes, ligados ao original. Até à aprovação, o original mantém validade e saldo. Aprovação transacional por CEO/Administração: original `Substituído`, movimento original com 0 € e valor original guardado em metadados/auditoria, novo crédito válido. Recusa deixa o original intacto. Revisões e índices impedem decisões concorrentes e substituições pendentes duplicadas.
- Pagamentos permanecem com o mesmo identificador, valor e estado. Cria-se uma regularização separada para decisão humana. A associação ao novo movimento só muda mediante aprovação com motivo; a associação original permanece no histórico. Novos pagamentos ficam bloqueados enquanto a regularização não estiver aprovada. O controlo de saldo concorrente usa a associação atual, impedindo pagamentos duplicados após uma transferência. Pagamentos históricos representados apenas por estado `Pago` são conservados como débito histórico explícito, sem disparar emails históricos.
- Os PDFs antigos continuam consultáveis pelo colaborador autorizado e pela gestão, incluindo recibos substituídos. Um documento histórico não pode voltar a ser validado ou reassociado como se fosse novo.
- Lista de Emails consolidada em quatro funções: **Currículos**, **Recibos de vencimento e faturas**, **Documentos / Backup**, **Notificações**. Endereços personalizados e configurações dos antigos separadores são preservados, com referências visíveis às configurações anteriores. `gruposaude.rh@gmail.com` mantém-se como endereço inicial de currículos. CEO/Administração podem editar, testar e consultar estado/histórico; o teste não simula uma ligação bem-sucedida.
- Recolha autenticada Gmail/Microsoft 365 de PDF/JPG/PNG para uma fila privada sem classificação ou associação automática. A gestão revê o anexo, escolhe fatura/recibo e confirma colaborador e dados. A classificação cria um documento pendente de validação. Origem de mensagem e hash impedem importações repetidas; erros sanitizados e paginação permanecem registados. A fila anterior de recibos não é eliminada.
- Política de arquivo para faturas, recibos, baixas e justificações existentes no repositório documental do servidor: revisão legal, fundamento, prazo, bloqueio legal e rastreabilidade. Os documentos RH da Administração respeitam clínicas autorizadas. Defaults conservadores de teste: 10 anos para financeiro, 5 para laboral; não são uma determinação jurídica universal e não permitem encurtar automaticamente outros prazos exigíveis.
- Backup privado com idempotência e estados `Sending`, `Accepted`, `Failed`, `Uncertain`, `Archived`. Email aceite **não** equivale a recebido/arquivado. A confirmação exige entrega confirmada pelo fornecedor, referência de arquivo, checksum e confirmação humana. Falhas/incertezas bloqueiam a preparação da remoção. Só depois de um ano online, sem bloqueios/processos pendentes, pode preparar-se a remoção; **não existe execução automática de eliminação nesta versão**. Metadados, saldos, relações e auditoria não são apagados.

## Ficheiros

Domínio/interface partilhados: `finance-core-v4.js`, `finance-demo-v4.js`, `finance-ui-v4.js`, `communications-core-v4.js`, `communications-v4.js`, `attention-core-v4.js`, `attention-ui-v4.js`, `index.html`.

Servidor: `lib/finance-service.js`, `lib/finance-document-workflow.js`, `lib/finance-mail-queue.js`, `lib/finance-email-ingest.js`, `lib/email-settings-service.js`, `lib/document-archive-service.js`, `api/v4-finance.js`, `functions/api/finance.js`.

Persistência: `db/migrations/finance-v4-004.sql`. A migração adiciona versões/hashes/fila/testes/planos/regularizações e troca a unicidade absoluta por unicidade da identidade ativa. Altera CHECKs de estado para aceitar `Substituído`; preserva todos os registos. Deve executar-se apenas numa base de teste depois de 002/003, com cópia e verificação das constraints existentes. Não foi executada num serviço remoto.

Qualidade/documentação: `tests/finance-fixture.cjs`, `tests/runtime.cjs`, `tests/consolidation.cjs`, `tests/finance.cjs`, `tests/finance-ui.cjs`, `tests/document-workflows.cjs`, `tests/documents-browser.py`, `package.json`, `.github/workflows/v4-preview-regression.yml`, este relatório e configuração abaixo.

## Testes

- `npm test`: **215 testes aprovados localmente** (102 regressões, 8 proxy, 36 financeiro, 14 UI, 23 melhorias, 32 documentos/arquivo).
- 32 casos novos executam SQL transacional e ficheiros privados temporários reais: hashes, semelhança, seis perfis, aprovação/recusa, documentos pagos, revisão obsoleta, pagamentos concorrentes, recibos privados/históricos, associação humana, persistência, configurações, OAuth simulado, falha/aceitação/receção de backup, bloqueios legais, integridade após reabertura e conservação de pagamentos antigos.
- Sintaxe JavaScript, Python, `git diff --check` e build estático de **52 assets** aprovados.
- Nova suite Chromium: utiliza formulários reais, deteta duplicado, substitui uma fatura já paga, aprova na Administração, regulariza, consulta saldo/PDF antigo, testa permissões dos seis perfis, quatro emails editáveis, ligação falhada e arquivo responsivo. Integra a pipeline juntamente com as três suites anteriores. CI verifica o SHA do preview Cloudflare antes de testar esse endereço.
- Primeira execução das quatro suites Chromium no GitHub Actions e preview Cloudflare aprovada: https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/37982337442 (commit `5a672a74bee054eff2abb00eed4af4620b7955a7`). O PR regista também a execução do commit final após as verificações adicionais de NIF, MIME e concorrência de arquivo.
- Chromium local impedido pelo sandbox (`SIGTRAP`); os resultados reais de navegador são obtidos na pipeline GitHub Actions e registados no PR com o commit/preview correspondentes.

## Configuração pendente e limites

O programa principal continua a demonstração local identificada no ecrã. Os fluxos de documentos também têm implementação persistente no backend autenticado, **sem fallback local**, acessível por `finance.html`; não passa a existir sincronização remota dos restantes módulos por esta alteração.

Ainda faltam o ambiente SQL/Auth/Blob de teste, OAuth das contas e credenciais/remetentes verificados de envio/backup. Providers são simulados nos testes; não se recebeu um email real nem se arquivaram documentos reais nesta sessão. O endereço Gmail configurado não fornece autorização por si só. A recolha consolidada é financeira; o recrutamento/CV existente mantém-se e a sua configuração/teste de ligação fica preparada, sem inventar candidatos a partir de anexos financeiros. Rotinas de backup/schedulers só podem funcionar após configuração e validação externa.

O arquivo suporta documentos que existem na tabela documental autenticada. Documentos de baixas/justificações apenas locais não são transferidos para o servidor automaticamente. Não foi implementada uma rotina que apague ficheiros online; a saída é um plano sujeito a execução controlada posterior. Conservação legal exige revisão jurídica aplicável ao tipo de documento/caso, mantendo bloqueio quando houver dúvida, litígio ou obrigação superior.

## Atualização: receção automática e aprovação da associação

Implementado upload privado com associação provisória automática por email, NIF ou nome completo, antes da aprovação pelo CEO/Administração. Ambiguidades permanecem por identificar; o colaborador não recebe acesso antes da confirmação humana. O formulário apresenta o colaborador identificado e permite corrigir com motivo e histórico. Esta atualização substitui a descrição anterior de associação exclusivamente manual: a associação definitiva e classificação continuam sujeitas a confirmação humana.

Implementados alertas internos persistentes de falhas na leitura/upload por email/anexo, contexto e ligação à mensagem original, contagens de atenção restritas aos gestores, repetição segura, resolução automática após sucesso e resolução manual auditada. Emails com falhas não impedem importar os restantes.

Ficheiros desta atualização: `communications-core-v4.js`, `finance-core-v4.js`, `finance-ui-v4.js`, `finance.html`, `attention-core-v4.js`, `attention-ui-v4.js`, `api/v4-finance.js`, `functions/api/finance.js`, `lib/finance-email-ingest.js`, `lib/finance-mail-queue.js`, `lib/finance-email-alerts.js`, `lib/finance-service.js`, `db/migrations/finance-v4-005.sql`, `tests/finance-fixture.cjs`, `tests/email-association.cjs`, `tests/documents-browser.py`, `package.json` e estes dois documentos. Migração aditiva, sem eliminação de documentos ou históricos.

Validação local: 228 testes aprovados (215 anteriores + 13 de email/associação), sintaxe de 79 ficheiros JavaScript, build de 52 assets, compilação Python e verificação do diff. Testes de Gmail/Microsoft são integrações simuladas com SQL/ficheiros temporários reais; não provam uma ligação externa ainda não configurada. A suite de navegador inclui associação preselecionada, aprovação explícita, alerta e ligação ao email com API isolada, além da regressão anterior. Os resultados finais de CI, commit e URL exato do preview são publicados no PR #11. Nenhuma alteração de produção ou merge.

Limitações: OAuth, autenticação, SQL, armazenamento privado e agendador requerem configuração no ambiente isolado; o programa de demonstração não recolhe emails reais. Falha total da base de dados requer monitorização externa. Sem OCR nem associação baseada no conteúdo textual do PDF; nenhuma eliminação física de arquivos. Ver detalhes em `V4-DOCUMENTOS-EMAILS-CONFIGURACAO.md`.
