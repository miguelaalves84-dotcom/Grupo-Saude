# Grupo Saúde V4 — Fase 1 P0

Data: 10/10/2026. Ambiente: desenvolvimento isolado e dados sintéticos.

## A. Resumo

Base exata: `f999aea5d8edbc2477f53a4f689367d41f6a0427`, árvore `129fde5b0b163410126c3dc66cb7611e07b21011`.
Branch nova: `fix/v4-p0-security-hardening`. SHA final: consultar o head do novo PR em rascunho, derivado diretamente desta base. A entrega acompanha o SHA e o URL imutável verificados após a publicação.

Não houve alteração à main, aos quatro PRs anteriores, DNS, segredos, bindings, dados ou bases de produção. Não houve merge. As migrações foram executadas exclusivamente em PostgreSQL descartável. Ficheiros de teste, documentos e identidades são sintéticos.

O preview preparado para esta branch bloqueia todos os endpoints operacionais no middleware Cloudflare e no backend Node. Apenas a identidade pública da versão e os ficheiros estáticos são disponibilizados. O bloqueio não depende de credenciais herdadas nem de uma opção de ativação. A demonstração continua funcional, claramente identificada como **DESENVOLVIMENTO — NÃO UTILIZAR DADOS REAIS**.

## B. Resultados dos cinco P0

| Problema | Estado | Correção | Teste / evidência |
|---|---|---|---|
| P0-01 Autenticação/persistência | **Parcial** | Fachada central de sessão e dados; área autenticada separada, sem carregar App/demo ou confiar em localStorage; sessão/identidade/email/estado verificados no servidor; expiração, recuperação e logout pelo fornecedor existente; view-as derivado da ficha do servidor e apenas leitura | 60 testes P0, suite Chromium com seis perfis, 36 testes financeiros e 38 de Gmail/autenticação anteriores. Fornecedor real e migração dos restantes módulos **bloqueados** |
| P0-02 Retenção | **Corrigido no código e ambiente isolado** | Endpoint antigo encaminha para o serviço único de arquivo recuperável; removidos motor de eliminação em lote e bypass cron. Não existe expurgo definitivo nesta fase. Arquivo operacional exige autorização, revisão legal, recibo, checksum, cópia recuperável e auditoria. `Superseded` normalizado para `Substituído`, mantendo valor original e pagamentos | Seis novos testes de retenção preservam ficheiro/metadados quando não há backup, checksum correto, armazenamento, política, recibo ou autorização. Suites anteriores validam recuperação e arquivo sem perda de saldo |
| P0-03 Autorização | **Parcial** | Política central nos endpoints antigos, GPS e Financeiro: identidade verificada, permissões individuais, âmbito clínico ativo, proprietário e operação. Administração não altera identidades/privilégios CEO. Chamadas globais ainda sem discriminação clínica ficam bloqueadas | Matriz dos seis perfis, chamadas diretas antigas, permissões desativadas, documento de terceiros, identidade manipulada, view-as e movimento de colaborador com duas clínicas. Consolidação funcional das operações globais permanece P1 |
| P0-04 DDL no GPS | **Corrigido** | Zero DDL no runtime HTTP. Migração SQL offline versionada, ledger/checksum, transação serializable, lock e retry limitado. GPS falha com 503 se a versão não está preparada | Chamadas anónimas: zero SQL. Autorizadas: apenas SELECT no teste GET. Cinco cenários em PostgreSQL real descartável: esquema ausente, aplicação/repetição, rollback, concorrência e checksum adulterado |
| P0-05 XSS | **Corrigido para o vetor reproduzido e padrões encontrados** | Clínica usa eventos delegados e IDs como dados. 98 handlers dinâmicos de outros módulos foram consolidados em dispatcher com callbacks fixos e argumentos JSON em atributos. Sem eval/Function nem escape para continuar a executar dados como código | Payload sintético no ID/nome da clínica, guardar/modal/teclado, campos de documento/importação, renderizações e reload: nenhum JavaScript do payload executado. Pesquisa automática bloqueia handlers dinâmicos antigos. CSP progressiva em report-only; CSP executável restrita na área autenticada |

A classificação “corrigido” não comprova integrações externas nem conformidade jurídica integral. P0-01 e P0-03 não são declarados integralmente concluídos.

## C. Testes

- **348 testes Node aprovados:** 282 existentes + 66 novos (60 segurança e seis retenção). Nenhum teste existente removido.
- **Cinco cenários PostgreSQL aprovados**, com cluster local descartável e dados sintéticos. Executam o SQL emitido pelo runner entregue, incluindo concorrência e rollback.
- **Cinco suites Chromium aprovadas:** browser, finance-browser, improvements-browser, documents-browser e p0-browser. A nova suite tem sete grupos: XSS/ações e sessão dos seis perfis.
- Parsing JavaScript e build completos aprovados. Build estático inclui 57 assets; exclui backend, testes, documentos e segredos.
- Testes permanentes acrescentados à cadeia `npm test` e CI. CI preserva as quatro suites anteriores e acrescenta Chromium P0 e PostgreSQL isolado.
- Simulações: provider de identidade, Google/Microsoft, scanner e serviços de email. Estes resultados não são validação de serviços reais.
- Bloqueados: Neon Auth real (incluindo dois navegadores com identidades reais), Neon multiutilizador, Blob/backup externos, Gmail/Microsoft reais, scanner externo, GPS físico e validação jurídica/organizacional de retenção.

Reprodução:

```sh
npm test
npm run build
GS_TEST_URL=http://127.0.0.1:8765/index.html python3 tests/p0-browser.py
```

A suite PostgreSQL exige `GS_P0_POSTGRES_DISPOSABLE=true` e DSN por socket `/tmp/` da base `p0_synthetic`; recusa DSNs remotos. O teste SQL fica separado dos pedidos HTTP. As reproduções históricas da auditoria permanecem intactas; os novos testes verificam o comportamento seguro inverso.

## D. Regressões e compatibilidade

Os testes de RH, férias, baixas, aprovações, ponto, operação, chat, notificações, financeiro e substituições continuam aprovados na demonstração/fixtures. A delegação mantém assinaturas dos callbacks e ações existentes; também admite `this.value`/`this.checked` como dados de evento.

Os fixtures de runtime passaram a carregar o dispatcher partilhado. Os testes de health mantêm as mesmas verificações de ausência de DDL, autenticação e seis perfis, adaptando a dependência para a política central. Asserções existentes não foram retiradas.

Não se migrou nem apagou armazenamento local. A área autenticada nunca carrega a demonstração. A recuperação de palavra-passe repõe o formulário de login depois da definição. Documentos e contas de colaboradores inativos mantêm-se consultáveis por gestores autorizados.

**Limitações funcionais deliberadas:** chamadas antigas globais para utilizadores, vendas, candidatos, configurações, relatórios, auditoria e automatismos ficam reservadas ao CEO até serem reimplementadas com queries clínicas adequadas. Administração tem bootstrap financeiro filtrado e conta corrente por clínica, mas filas globais sem âmbito não são disponibilizadas. Exports de terceiros via endpoint RGPD antigo ficam bloqueados para Administração. Substituição financeira antiga exige o fluxo de aprovação consolidado. Uploads antigos de faturas/recibos exigem o endpoint financeiro consolidado, impedindo contornar aprovação/deduplicação. Novas clínicas através do backend legado precisam de adaptação; a demonstração preserva a criação.

Estes bloqueios são **P1**; não devem ser confundidos com funcionalidades multiutilizador completas.

## E. Segurança e endpoints

| Endpoint | Proteção nesta branch |
|---|---|
| `/api/v4` | Contexto e política centrais antes das queries/alterações de negócio; aliases financeiros encaminhados para o mesmo serviço |
| `/api/v4-document` | Alias de recuperação privada com proprietário/âmbito/autorização; sem store ID fixo |
| `/api/v4-upload` | Identidade e proprietário/âmbito antes de ler anexos; scanner e backup privado verificado; checksum/deduplicação e transação; tipos financeiros encaminhados para o seu workflow |
| `/api/v4-retention` | Alias de arquivo seguro, sem eliminação independente nem cron bypass |
| `/api/v4-clinic-gps` | Autorização anterior à consulta; versão/checksum; zero DDL; validação de coordenadas/precisão; sem erro SQL exposto |
| `/api/v4-finance` | Política central adicional; sessão só do fornecedor, ID só do servidor, filtros clínicos e view-as apenas leitura |
| `/api/v4-auth` | Fornecedor existente, email verificado, ficha ativa, recuperação, logout e expiração; sem tokens no JSON/navegador |

No preview P0, `/api/*` operacional é adicionalmente bloqueado no Cloudflare. No Node, a branch P0 bloqueia o serviço configurado e o cron antigo, impedindo utilização de recursos herdados. Não existem credenciais reais adicionadas ao bundle.

Outros automatismos/filas globais e a política integral de grupos/chat/operacional multiutilizador requerem consolidação na Fase 2. Não se declara auditoria completa do backend futuro. CSP report-only não substitui sanitização ou autorização e ainda não é enforcement integral do protótipo.

## F. Limitações externas

São necessários ambientes próprios de desenvolvimento para:

1. Neon/PostgreSQL e identidade, com utilizadores sintéticos ativos/verificados, papéis e clínicas atribuídos.
2. Armazenamento privado primário e cópia independente, scanner e comprovativo de restauro.
3. OAuth Gmail/Microsoft de teste, consentimento e notificações sem destinatários reais.
4. Read-only do painel Cloudflare para confirmar configurações/bindings. Nesta entrega, o código impede acesso a bindings do preview; não foram modificados pelo agente.
5. Validação de política jurídica, retenção, responsáveis, procedimentos RGPD e monitorização operacional.

Não enviar segredos na conversa. Não ativar dados reais nesta branch.

## G. Próxima fase

1. **P1 persistência:** migrar clínicas, colaboradores, pedidos RH, ponto, tarefas, operação e chat para queries/transações PostgreSQL centrais, com versionamento otimista e escopo antes das queries.
2. **P1 autorização funcional:** substituir as operações globais bloqueadas por consultas clínicas/ownership, preservando históricos e permissões individuais; validar utilizadores desativados e colaboradores com várias clínicas.
3. **P1 sincronização:** dois utilizadores/dispositivos simultâneos, expiração, conflitos e idempotência; sem considerar localStorage persistência operacional.
4. **Documentos:** armazenamento privado, upload/AV, archive-only, URLs temporárias autorizadas e compatibilidade de ficheiros históricos.
5. **Backups:** snapshot PostgreSQL + documentos + relações; exercícios de restauro, RPO/RTO medidos, alertas e retenção segregada.
6. **Gmail/Microsoft:** OAuth e agendador em ambiente isolado, fila clínica com aprovação humana, deduplicação e falhas por email/anexo.
7. **GPS real:** dispositivo físico, precisão, clínicas autorizadas, ponto/ocorrências e auditoria; sem alterações de esquema HTTP.
8. **Integração final:** previews separados por entrega, regressão completa, revisão humana e autorização CEO antes de qualquer merge/produção.

## H. Decisão

1. Cinco P0 integralmente corrigidos e comprovados? **NÃO**. P0-01/P0-03 parciais; riscos imediatos mitigados por isolamento e bloqueios explícitos.
2. Regressão aprovada? **SIM**, no ambiente isolado e nos limites descritos.
3. Preview disponível/validado? **NÃO — BLOQUEADO.** Falta acesso de leitura à configuração Cloudflare (`production_branch`, previews e bindings). A publicação Git usa marcadores de skip para impedir o deployment automático. Não foi criado um preview novo nem alterado o projeto Cloudflare. A validação Chromium ocorreu em localhost descartável.
4. Seguro continuar testes com dados fictícios? **SIM**, no servidor local isolado; o preview preparado tem APIs bloqueadas, mas não está publicado.
5. Há bloqueios a dados reais? **SIM**, identidade/persistência, serviços, segurança operacional e validações jurídicas pendentes.
6. PR pronto para revisão humana? **SIM**, permanecendo em rascunho. Não equivale a autorização de merge.

## Publicação e reversão

O commit contém `[skip ci] [CF-Pages-Skip]`: suspende as integrações automáticas enquanto a branch de produção Cloudflare não pode ser confirmada em leitura. Os testes foram executados no workspace e sandbox descartável; não se afirma aprovação de CI remota quando esta estiver suspensa. Nenhuma variável, segredo ou configuração Cloudflare foi criada/modificada.

Para desbloquear: conceder acesso de leitura ao projeto `grupo-saude` e confirmar branch de produção, ambientes/bindings e regras de previews. Depois, uma entrega de desenvolvimento pode retirar o skip mantendo o bloqueio de backend desta branch. A ativação de autenticação/dados reais é outra etapa, dependente da Fase 2 e validação explícita.

Reversão: fechar o PR em rascunho ou acrescentar um revert exclusivamente na branch nova. Sem migrações em serviços reais ou alterações de dados, não é necessário restauro de produção. Não reverter nem fazer force-push nos PRs #5/#7/#9/#11 ou main.
