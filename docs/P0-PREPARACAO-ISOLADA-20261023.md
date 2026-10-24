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

## Plano de execução e aceitação revisto — 24/10/2026

Esta atualização prepara ensaios; não instala Better Auth, não cria recursos e não ativa escritores. O runtime observado não tem segredos nem identidades remotas de backend configurados. A observação de conectividade não confirma quotas, região, acesso às contas ou plano gratuito de fornecedores. Nenhuma operação paga está autorizada.

| Etapa | Trabalho isolado proposto | Teste positivo e negativo obrigatório | Condição de avanço |
| --- | --- | --- | --- |
| 0 — destino e custos | Confirmar acessos, quotas gratuitas atuais, região UE e IDs exclusivos do projeto/base/arquivo de testes; inventariar serviços existentes para evitar outro cadastro | Recusar IDs de produção, destinos sem marcador sintético e qualquer recurso que exija faturação | Lista de recursos/quotas/limites verificada; se houver custo ou âmbito novo, parar e apresentar aprovação concreta |
| 1 — compatibilidade | Comparar migrações e esquema preservados; recuperar só capacidades necessárias de identidade a6edf53 conforme mapa de equivalências | Base vazia e snapshot sintético legado; reaplicação/migração aditiva sem duplicar utilizadores, clínicas ou documentos | Plano de alterações e backup inicial verificados; runtime com privilégios mínimos, migração com credencial separada |
| 2 — identidade | Integrar o fornecedor de testes selecionado com proxy existente; inscrição pública desligada, seis contas sintéticas; email de recuperação apenas numa caixa de ensaio | Login/erro genérico, reset de uso único/expirado, logout, expiração, revogação em duas sessões; cookies seguros, CSRF/origem, acesso direto à API e simulação sem herança | Provas browser→API→sessão; identidade nunca confiada ao localStorage; fornecedor não declarado instalado antes de execução real |
| 3 — central | Ligar progressivamente identidade/perfis/permissões/clínicas; preservar identificadores e contratos UI/API existentes | A grava e B autorizado consulta em contexto/dispositivo independente; B não autorizado recebe 403/404 sem dados; revogação imediata; CAS concorrente e rollback integral, auditoria sem PII desnecessária | Registos e contadores reconciliados com a base, incluindo atualização após reload; RH/Stock/Financeiro/Operação mantêm flags de escritores desligadas |
| 4 — arquivo | Reutilizar serviços de documentos e catálogo, arquivo privado e quarentena separados; validar scanner/MIME/tamanho/hash/versionamento | Upload sintético PDF/JPEG/PNG, documento inválido, acesso anónimo/outra clínica, URL expirada/revogada, substituição e download byte a byte; nunca publicar CV em assets | Arquivo real privado comprovado; prazos/bases legais e retenção aprovados; sem eliminação automática nem gravações reais |
| 5 — recuperação | Backup cifrado de base, objetos e metadados/auditoria para destino separado; manifestos com hashes e acesso mínimo | Restaurar para terceira base/arquivo de testes, com IDs próprios; comparar contagens, relações, versões, hashes e autorização; indisponibilidade parcial e objeto em falta devem falhar claramente | Restauro documentado com duração e perda observadas. Objetivos RPO/RTO ainda a aprovar; não inventar valores nem classificar checksum local como restauro |
| 6 — preview integrado | Projeto de testes separado do demonstrativo, sem reutilizar domínio principal; deploy protegido com apenas dados sintéticos | Seis perfis, multiclínica, dois utilizadores/sessões, tablet/telemóvel, temas, regressões, scanner, revogação, auditoria e recuperação | Relatório operacional por capacidade; só depois propor ativação adicional. Nenhum merge/publicação de produção autorizado |

### Evidências mínimas por ensaio

Registar SHA do código, IDs não secretos dos destinos, versão da migração, início/fim, dados sintéticos usados, utilizadores/sessões, resultado esperado/observado e evidência de recusa. Logs e artefactos não podem conter cookies, tokens, credenciais, URLs assinados ou dados pessoais reais. Guardar configuração secreta apenas no gestor de segredos; não pedir credenciais nesta conversa.

Backup de código, backup de base e backup de anexos são três objetos diferentes. O restauro deve preservar ligações entre os três; a expiração de artefactos GitHub não é uma política de backup. Antes de qualquer eliminação automática, confirmar política legal e testar retenção suspensa e permissões de eliminação.

### Bloqueios atuais de entrada em funcionamento real

Os quatro P0 continuam abertos até às provas acima. Quotas/acessos dos fornecedores, gestão segura de segredos, autenticação ponta a ponta, integração UI/API, arquivo/scanner, política legal e restauro real não são substituídos pelas suites isoladas. Não foram criados recursos, consultadas bases reais ou feitas migrações nesta revisão.
