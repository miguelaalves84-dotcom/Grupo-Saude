# Financeiro V4 — implementação para revisão, PR #11

## Base e alcance

Base remota confirmada: `27359e817bb56af4354ee2a881338ca3bd8ecbbf`, branch `feat/v4-consolidation-dashboard-access`, PR #11 em rascunho. A referência Cloudflare era `https://1e4d3233.grupo-saude.pages.dev`. `main` permanece em `84fba5a2d6d7afcb0723ca312f4e617acc22823d`. Não foram feitas migrações, restauros, seeds, promoção ou alterações em bases de dados/ficheiros externos. O commit novo é filho da referência remota, não de main. O conteúdo local das bases modificadas foi comparado com essa referência; as diferenças de reconstrução local eram apenas um newline final em ficheiros não alterados, que não são republicados.

**Estado de entrega:** código e preview de demonstração para revisão. A aceitação final com utilização real, sessões, Neon/Blob e mailbox reais continua pendente de configuração externa e de navegador disponível. O utilizador indicou que esse ambiente ainda não existe. Não se apresentam testes automáticos como substituto dessa aceitação.

## Diagnóstico

| Origem na versão 27359e8 | Problema | Correção |
|---|---|---|
| `gs-enterprise.js:38–46` e `:76–83` | Dois financeiros: renderer principal mais IIFE/MutationObserver que inseria atos/bónus incondicionalmente e gravava pelo nome, sem autorização | Um controlador financeiro e domínio comum. Retirada do IIFE, do observer e dos prompts. Entradas antigas delegam no controlador, sem outra escrita |
| `gs-enterprise.js:80`, `api/v4.js:57–58` | Saldo por soma simplificada e pagamento por alteração do crédito; sem período/fluxo de aprovação; incompatível com débitos novos | Convenção única de cêntimos e pagamentos negativos; projeção de pagamentos históricos sem reescrever dados |
| `workspace-shell-v4.js:10` | Faturas/recibos juntos, pagamentos/bónus encaminhados para a mesma lista | Três opções e gestão adicional autorizada; sem botão Financeiro repetido no menu |
| `api/v4.js:34` | Administrativa podia lançar bónus automaticamente pelo endpoint de vendas | Mantém registo operacional sem bónus; valores financeiros exigem gestão. Operações de conta antiga encaminham para API protegida |
| `api/v4.js:44–47` | Rotas repetidas de documentos/substituição; segundo handler inacessível | Uma versão de cada rota, preservando a implementação com auditoria |
| `api/v4.js:56` | Documento podia ser uma referência fictícia `pending/`, sem upload persistente | Upload real, validação e armazenamento privado pelo novo endpoint; sem documento fictício |
| Estado local e troca de perfil | Fonte de sessão/permissões por utilizador de demonstração; operações assíncronas poderiam devolver dados depois da troca | Invalidação por sessão/permissões, limpeza de detalhe e URLs temporárias, revalidação do upload. No servidor, identidade exclusivamente de sessão verificada e BD |

O HTML/scripts existentes e a chave `grupo_saude_v4_demo_2` foram mantidos. Os calendários, férias/baixas, avaliação de desempenho, questionários, dashboard e recrutamento não foram reconstruídos. O financeiro lê `finance.movements`, `currentAccounts` e a estrutura nova; conserva `finance.acts` e `bonusRules`. Nomes históricos só são associados quando únicos. Dados ambíguos/sem ID/data válida são conservados e assinalados na gestão; não são atribuídos a um colaborador arbitrariamente.

## Funcionalidades

- Faturas próprias para os seis perfis: número, série, valor, calendário, inserção editável, PDF/JPG/PNG, notas, timestamp real imutável, edição pendente com revisão, validação/recusa e motivo obrigatório. Unicidade normalizada por emitente/número/série; uma validação cria um único crédito. Documento associado à ficha e auditoria.
- Recibos PDF: upload manual de gestão, fila pendente, confirmação explícita do colaborador/mês/ano/data, disponibilização só após validação, correção com motivo e histórico. A correção revoga acesso do destinatário anterior. Unicidade por conteúdo e por período validado. Consulta/descarregamento autorizados, leitura reconhece a notificação.
- Receção de recibos em Tabelas → Lista de Emails: Upload, destino Recibos de vencimento, endereço editável e estado. No acesso autenticado, configuração persistente e importação OAuth Gmail/Microsoft 365. PDFs entram sem utilizador/período associado. Idempotência por mensagem/anexo e SHA-256, erros sanitizados, auditoria, paginação por lotes de 20 mensagens com cursor só confirmado após sucesso. Secret de job permite agendamento externo opcional, sem ativar cron/produção.
- Conta própria inclusive CEO/Administração; gestores podem selecionar outros colaboradores e pesquisar por nome/clínica/especialidade. Datas inicial/final, consulta, créditos/débitos/estado/data de pagamento/documento, saldo anterior e final, pagamentos parciais, alterações auditadas de estado e exportação PDF paginada. Atos incluem quantidade/valor/percentagem/clínica; bónus exigem trimestre. Ajustes admitem débitos negativos explícitos.
- CEO/Administração podem criar, editar, aprovar, pagar e consultar terceiros, respeitando restrições individuais. Perfis operacionais ficam limitados à conta e documentos próprios. As verificações de servidor não aceitam o papel, colaborador ou permissões enviados pelo navegador como identidade.
- Contadores por âmbito: faturas pendentes, recibos pendentes, movimentos pendentes, recusas próprias não lidas e novos recibos próprios. Atualizados ao decidir/ler, com pesquisa, estados, layout responsivo e componentes partilhados.

Convenção: saldo final = saldo anterior + créditos aprovados − débitos aprovados/pagos. Pagamentos são parte dos débitos e não são novamente subtraídos. Pendentes não afetam saldo. Um crédito antigo marcado Pago ganha apenas uma projeção de pagamento histórico na leitura; não se insere outro pagamento persistente. Os registos anteriores são mantidos e as alterações são auditadas. Os filtros de estado/pesquisa só filtram a tabela; o resumo continua a representar o período completo.

## Persistência e segurança

`finance.html` usa somente API, sessão autenticada, Neon PostgreSQL e Blob privado. Não cai silenciosamente para localStorage. O endpoint exige ambiente preview, recursos separados dos nomes/valores legados, origem autorizada, sessão válida com email verificado/igual à ficha e vínculo `auth_subject`. Utilizador ou ficha inativos não autenticam. Permissões individuais do servidor vêm de `employees.data.actionPermissions` ou `employees.data.hr.actionPermissions`; a matriz local de demonstração não as concede ao servidor. Correções da ficha/identidade precisam de verificação na integração de autenticação.

Documentos são devolvidos pela rota autenticada após autorização. Storage keys/URLs permanentes não são publicados ao cliente. Browser recebe Blob temporário que é revogado ao fechar/trocar perfil; respostas no-store. Upload máximo **3 MiB**, assinatura e MIME coerentes, recibos apenas PDF; base64 abaixo do limite de 4,5 MB do endpoint Node. A verificação de assinatura não substitui antivírus/validação estrutural completa de PDFs.

`index.html` conserva explicitamente o protótipo de demonstração; documentos fictícios em IndexedDB, metadata no estado existente e sem pretensão de autenticação real. O aviso pede não carregar documentos salariais reais. A preview de demonstração não proporciona confidencialidade multiutilizador contra manipulação do armazenamento local. Os dados de cada origem anterior permanecem nessa origem; mudar para um URL imutável novo não copia localStorage. Usar o alias estável da branch mantém a mesma origem de teste. Não foram apagados nem exportados documentos existentes.

Migração `db/migrations/finance-v4-002.sql`: apenas CREATE/ALTER/índices adicionados, transação, sem DELETE/TRUNCATE/UPDATE de dados legados. Não é executada automaticamente pelos pedidos nem nesta entrega. Aplicar somente depois de criar uma BD de teste, rever a compatibilidade/duplicados e fazer cópia. A migração adiciona as estruturas atuais de conta/configuração se não existirem no schema SQL base, que estava incompleto relativamente ao schema da API. Não instala políticas na BD/Blob de produção.

## Ficheiros alterados/adicionados

| Grupo | Ficheiros |
|---|---|
| Domínio e interface | `finance-core-v4.js`, `finance-demo-v4.js`, `finance-ui-v4.js`, `finance-v4.css`, `finance.html` |
| Persistência/integrações | `lib/finance-service.js`, `lib/finance-email-ingest.js`, `api/v4-finance.js`, `api/finance.js`, `api/v4-finance-email-job.js`, `functions/api/finance.js`, `db/migrations/finance-v4-002.sql` |
| Consolidação existente | `gs-enterprise.js`, `workspace-shell-v4.js`, `index.html`, `communications-v4.js`, `hr-master-v4.js`, `hr-separation-v4.js`, `api/v4.js`, `account.html`, `account.js` |
| Validação | `.gitignore`, `package.json`, `tests/consolidation.cjs`, `tests/finance-fixture.cjs`, `tests/finance.cjs`, `tests/finance-ui.cjs`, `tests/finance-browser.py` |
| Documentação | este relatório, `docs/FINANCEIRO-V4-CONFIGURACAO.md` |

## Testes executados

`npm test`: **157 aprovados** — 101 regressões anteriores/consolidação, 8 proxy anterior, 36 financeiro e 12 UI financeira. Parsing de **64 ficheiros JS**. Ensaio de cálculo com 20 000 linhas (10 000 créditos e pagamentos) em 59 ms; saldo validado. É uma medida local do domínio, não de latência de rede ou renderização no browser. HTML de index/finance/account: IDs únicos e referências de scripts existentes; `git diff --check` sem erros.

Backend financeiro executa SQL real numa BD SQLite temporária em disco e ficheiros privados locais temporários. Testa os seis perfis, entrada direta, identidade da API, negação de papel/owner falsificados, duplicações, revisão concorrente, associação/correção de recibos, acesso de terceiros, reabertura persistente, pagamentos parciais/estado, concorrência sem sobrepagamento, datas/saldos, configuração/email/paginação/erros. Não é validação da sintaxe/concorrência específica do PostgreSQL/Neon nem da implementação real de Blob.

UI usa código real num DOM simulado: três secções, saldos, workflows, troca durante upload, restrições imediatas, legacy preservado, ausência de fallback local em modo autenticado. OAuth/auth provider são simulados. PDF gerado foi aberto por `pypdf`: três páginas, último movimento e totais extraídos corretos (100 movimentos, saldo final 10025,00 €).

**Navegador real:** Chromium tentou arrancar e terminou com `setsockopt: Operation not permitted`/SIGTRAP antes de abrir a aplicação. A tentativa de permissão adicional foi interrompida; não se tentou contornar o bloqueio. `tests/finance-browser.py` disponibiliza os testes de utilização, upload, validação, PDF e viewport móvel para um ambiente que permita Chromium. Não se afirma aprovação de testes manuais/reais, Neon, Blob, cron ou mailbox vivos.

## Pendências de aceitação

1. Provisionar recursos isolados e o bridge de sessão descrito em `FINANCEIRO-V4-CONFIGURACAO.md`, aplicar a migração exclusivamente de teste e mapear as identidades verificadas.
2. Configurar OAuth/mailbox e agendamento externo se pretendido; validar paginadores/anexos do fornecedor e idempotência com mensagens reais. Lotes extensos podem ultrapassar o timeout da proxy; repetir é seguro e o job pode executar diretamente no backend.
3. Executar testes reais no navegador, incluindo preview/documents PDF, download protegido, seis logins, sessão expirada, dispositivos móveis e permissões individuais persistentes.
4. Validar Neon/PostgreSQL e Blob com dados fictícios, carga real, quotas e monitorização. Afinar retenção, antivírus e convenções contabilísticas com o responsável financeiro.
5. Rever associações históricas ambíguas, sem apagar ou atribuir nomes arbitrariamente. A matriz local e os dados locais não são migrados automaticamente para a identidade/BD real.

O PR mantém-se em rascunho para essa validação; não fazer merge/promoção automática.
