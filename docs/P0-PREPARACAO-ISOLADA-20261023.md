# Quatro P0 — preparação isolada e bloqueios

Estado: **PREPARADO PARA ENSAIOS DESCARTÁVEIS / BLOQUEADO PARA OPERAÇÃO CENTRAL**. Não confundir o resultado dos testes com ativação de serviços. Esta fase não criou recursos, não configurou segredos, não executou migrações reais e não usou credenciais remotas. O ambiente observado não tem credenciais/identidades de backend configuradas. Quotas gratuitas e acessos ainda não confirmados.

| P0 | Preparação existente e exercitada | Evidência | Falta para encerrar |
|---|---|---|---|
| INF-AUTH | Proxy de identidade, cookies seguros, origem, conta verificada, permissões de servidor e simulação só leitura. Fornecedor é simulado nos testes. | `api/v4-auth.js`, `lib/authorization-service.js`, `tests/p0-security.cjs`, `tests/p0-browser.py` | Fornecedor Better Auth/Neon Auth real de testes validado, inscrição pública desativada, seis contas sintéticas controladas, recuperação em caixa de testes, expiração/revogação entre sessões reais. Better Auth não é declarado instalado nesta fase. |
| INF-CENTRAL | SQL e serviços reais em base descartável, CAS, rollback, auditoria e ações de dois utilizadores. Caixa reutiliza `clinic_days`, sem tabela nova. | Suites `*-postgres.cjs`; `tests/finance-cash-postgres.cjs` | Confirmar projeto/região UE/base gs_v4_test, credenciais próprias de runtime/migração e privilégios, marcadores de destino/backup, integrar UI/API autenticadas e provar persistência entre dispositivos. Não migrar uma base existente. |
| INF-STORAGE | Verificação de formatos, propriedade, scanner, aprovação de segurança e checksum; bloqueio quando faltam requisitos. No preview apenas dados sintéticos. | `lib/document-security-service.js`, `lib/document-storage-service.js`, `tests/p0-security.cjs`, `tests/p0-retention.cjs` | Dois arquivos privados de testes separados, scanner configurado e validado, retenção/base legal, downloads autenticados com testes de acesso direto e recuperação. Não usar credenciais de produção. |
| INF-RECOVERY | Rotinas de cópia/checksum/recuperação e bloqueio de remoção sem arquivo recuperável. Checkpoint privado do código verificado separadamente. | `lib/document-storage-service.js`, `lib/document-archive-service.js`, `tests/p0-retention.cjs` | Restauro real de base e ficheiros de testes para destino novo, integridade/reconciliação, RPO/RTO aprovados, registo de execução e ensaio de indisponibilidade. TAR de código não é backup de dados centrais. |

## Ordem segura para futura ativação

1. Confirmar acessos e quotas gratuitas atuais de cada fornecedor. Se surgir custo/plano pago, parar; não ativar faturação. A aprovação anterior de testes está limitada a 0 €.
2. Validar os IDs dos recursos de testes e região, sem recorrer aos projetos/domínios de produção. Guardar segredos no gestor próprio, nunca em frontend, logs, Git, relatórios ou esta conversa.
3. Separar credenciais de migração/runtime. Inspecionar destino e marcador sintético, backup inicial e plano de migrações aditivas; não executar este passo nesta fase sem destino confirmado.
4. Configurar fornecedor de identidade e email exclusivamente de testes. Não enviar mensagens a destinatários reais.
5. Exercitar duas sessões independentes, seis perfis, revogação, acesso multiclínica, concorrência, anexos privados, auditoria e restauro. Preparação de SQL isolado não substitui esse fluxo.
6. Publicar preview integrado separado do estático apenas após validação; RH, Stock, Financeiro e Operação mantêm escritores reais desativados até autorização aplicável.

`tests/p0-isolation-boundaries.cjs` invoca os endpoints reais em contextos VM sem ambiente de aplicação herdado. Exige recusa em preview sem recursos confirmados e em produção, mesmo com flags de módulo presentes, e zero pedidos externos. Não é um teste de autenticação real nem um mecanismo para aprovar recursos por variáveis declarativas.
