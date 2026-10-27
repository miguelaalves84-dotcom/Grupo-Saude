# Segurança P0 — implementação, evidências e bloqueios

Atualizado em 27/10/2026. Branch `dev/v4-stabilization-20261017`. Base preservada `c32b0429`. Código de segurança: `0e7f7877`, `90c35abc`, `e090d24b`, `f44a2cbd`, `b3288a01`, `51f273ab`, `40301aea`. Main e produção não são destinos desta implementação.

## Critério de utilização

**Não autorizado nem preparado para dados reais.** Autenticação real foi executada exclusivamente em PostgreSQL descartável do GitHub Actions. O preview continua demonstrativo, sem backend central ativo. A proteção Vercel do preview não substitui autenticação da aplicação. Não foram criados Neon, Mailtrap, armazenamento privado, serviços pagos ou credenciais reais.

## Auditoria inicial e alterações

[Auditoria inicial](SEGURANCA-P0-AUDITORIA-INICIAL-20261026.md). Backup privado do código e histórico preservado; não equivale a backup de dados operacionais. Pesquisa inicial de assinaturas em 571 ficheiros versionados: zero ocorrências; não certifica todo o histórico Git nem os gestores externos.

| Risco | Implementação e evidência | Estado real |
|---|---|---|
| AUTH-01 P0 | Better Auth 1.7.14 instalado no CI; Argon2id Node 24, 64 MiB, 3 iterações, sal aleatório, comparação constante; sem fallback simples | Implementado/testado em isolamento |
| AUTH-02 P0 | MFA TOTP obrigatório CEO/Administração, garantia por sessão, recuperação e prevenção de reutilização; sem dispensa por dispositivo | Implementado/testado em isolamento |
| AUTH-03 P0 | Convite de uso único, hash do token, 24 h; reset 15 min; revogação após reset, sessões/dispositivos; inscrição pública fechada | Implementado/testado; email real não ligado |
| SCOPE-01 P0 | Identidade fresca, permissões/ação/clínica/proprietário; clínica do documento financeiro, não apenas interseção das clínicas do colaborador; simulação sem herança CEO | Testado nos seis perfis e multiclínica |
| AUDIT-01 P0 | Cadeia SHA256 e gatilhos append-only; concorrência e tentativa de UPDATE/DELETE/DDL pelo runtime verificadas; ativação e auditoria na mesma transação | Testado; ancoragem externa e proteção contra administrador da infraestrutura pendentes |
| STORAGE-01 P0 | Envelope AES-256-GCM com AAD, rotação de chaves, limite, adulteração rejeitada; reutiliza scanner/arquivo/recuperação existentes, sem plaintext fallback | Criptografia testada; fornecedor, scanner real, gestão de chaves e backups operacionais pendentes |
| RECOVERY-01 P0 | pg_dump cifrado, adulteração rejeitada, pg_restore para clone descartável, contagens/cadeia e rollback restrito ao clone | Ensaio real no CI; automação/retensão/PITR operacional pendentes |
| DEPS-01 P1 | Versões exatas e lockfile; Zod transitivo corrigido para 4.6.7, removendo cadeia de 4 alertas HIGH | Auditoria registry: zero alertas conhecidos na execução f44a2cbd; não garante ausência de vulnerabilidades desconhecidas |
| HTTP-01 P1 | Cookies Secure/HttpOnly/SameSite; origem/CSRF; limites persistentes por conta e origem; CSP estrita nas páginas de autenticação/segurança | Testado; aplicação legada ainda requer unsafe-inline, migração futura necessária |
| GDPR-01 P1 | Minimização dos eventos e ausência de tokens/palavras-passe nos resultados; operações reais bloqueadas | Bases legais, prazos, fornecedores e validação jurídica/operacional pendentes |

## Ficheiros e arquitetura

- `lib/security-identity.cjs`, `lib/password-argon2.cjs`, `lib/security-isolation.cjs`, `lib/identity-runtime.cjs`: identidade real isolada e política de ativação.
- `api/v4-auth.js`, `functions/api/auth.js`, `session-v4.js`, `account.html`, `account.js`: API/interface reutilizadas; sem tokens em localStorage.
- `lib/authorization-service.js`, `lib/finance-authorization-service.js`, `lib/finance-service.js`: autorização e isolamento da informação financeira existente.
- `lib/private-storage-envelope.cjs`, `lib/document-security-service.js`, `api/v4-finance.js`: arquivo cifrado e bloqueio quando controlos reais faltam.
- `lib/security-audit.cjs`, `db/migrations/security-p0-001.sql` e `.down.sql`: eventos e migrações guardadas; nenhuma migração em base real.
- `security.html`, `security-ui-v4.js`: estado e alertas apenas com autorização efetiva e MFA; convites associados a fichas existentes.

Não há segunda base de colaboradores, permissões, clínicas, movimentos ou configuração de email. `users.auth_subject` associa a identidade à ficha existente. As tabelas próprias do fornecedor armazenam credenciais/sessões, não substituem RH. Os quatro canais existentes são reutilizados: candidaturas (`cv`), financeiro (`payslips`), arquivo (`backup`), notificações (`tasks`). O outbox de autenticação usa o canal de notificações. Apenas destinatários sintéticos `example.invalid` são aceites nesta implementação de teste. Não existe envio real ativado.

## Matriz de permissões de segurança

| Perfil | Sessão própria/dispositivos | MFA obrigatório | Convites/monitorização | Documentos e operações |
|---|---|---|---|---|
| CEO | Próprios | Sim | Com permissões RH/configuração, após MFA | Segundo permissões efetivas; simulação não herda CEO |
| Administração | Próprios | Sim | Com permissões RH/configuração, após MFA | Clínicas autorizadas e ação permitida |
| Administrativo | Próprios | Não imposto nesta fase | Negado | Próprios/escopo funcional autorizado |
| Médico | Próprios | Não imposto nesta fase | Negado | Próprios/escopo funcional autorizado |
| Técnico | Próprios | Não imposto nesta fase | Negado | Próprios/escopo funcional autorizado |
| Call Center | Próprios | Não imposto nesta fase | Negado | Próprios/escopo funcional autorizado |

As permissões configuradas continuam a ser resolvidas no servidor. Ocultar botões não autoriza a operação. Nem todos os módulos demonstrativos se tornam escritores centrais por existir autenticação: essa ligação exige testes específicos e permanece bloqueada.

[Matriz de testes e dependências](SEGURANCA-P0-TESTES-E-DEPENDENCIAS-20261027.md).

## Evidências

[Execução f44a2cbd](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40428087898): PostgreSQL passou 15 cenários de identidade real e 5 de backup/restauro; Chromium real com HTTPS/API/PostgreSQL passou 36 contextos (seis perfis × três formatos × dois temas). Uma regressão no teste antigo de login simulado falhou por seletor ambíguo; corrigida em b3288a01 e sujeita à nova execução integral. Não declarar 44/44 aprovados com base na execução anterior.

`npm test` e build locais passaram após b3288a01. Better Auth não foi instalado localmente: a prova de instalação e operação é do CI. Testes reais: `tests/security-auth-postgres.cjs`, `tests/security-auth-browser.py`, `tests/security-recovery-postgres.cjs`. Fundamentos criptográficos: `tests/security-foundations.cjs`.

Os testes abrangem convites expirados/revogados/concorrentes, password/reset, MFA e recuperação, sessões independentes, CSRF, força bruta, IDOR, papel forjado, revogação de permissão, isolamento clínico, simulação, auditoria concorrente, cifra/rotação/adulteração e recuperação. A regressão de domínios preserva operações financeiras/idempotência e a expiração dos anexos de Chat aos sete dias. Não é um pentest independente nem prova de ausência de SQL injection/XSS em todo o programa. Playwright em viewport de tablet não equivale a Android físico.

A execução de `51f273ab` é [40429480604](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40429480604). PostgreSQL já confirmou **16 cenários de identidade** e **5 de recuperação**, incluindo rollback perante falha de auditoria. A preparação do navegador dessa execução ficou pendente na instalação externa de componentes de sistema. Foi substituída por `40301aea`, que utiliza o Chromium/Chrome pré-instalado, regista a versão e falha imediatamente se indisponível, sem apt nem downloads de navegador. O estado integral é registado na evidência final após conclusão, sem extrapolar resultados parciais.

## Evidência da execução final

[GitHub Actions 40430408470 — código 40301aea](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40430408470). Identidade real: **16 cenários aprovados**. Backup/restauro: **5 aprovados**. Chromium/Chrome 155.0.8059.39 via Playwright 1.56.0: **366 verificações, zero falhas, 36 contextos**, seis perfis, computador/tablet/telemóvel, claro/escuro. Auditoria de dependências: **zero alertas conhecidos**. Sem instalação repetida de navegador nem componentes de sistema. Os resultados globais dos jobs e o preview são registados no manifesto de evidências final.

## Bloqueios antes de utilização real

1. Ambiente central de staging separado, TLS validado, credenciais de migração/runtime distintas no gestor de segredos; mínimos privilégios por tabela e revisão de RLS como defesa adicional (RLS não implementado nesta fase).
2. Fornecedor privado e scanner reais, chaves com rotação/recuperação, downloads auditados e testes por tipo documental em infraestrutura real. Não apresentar uploads demonstrativos como arquivo definitivo.
3. Email sandbox real com entregas e reenvios verificados, worker de fila, monitorização de falhas, sem destinatários reais, políticas para documentos e autenticação; quatro canais configurados sem duplicação.
4. Monitorização externa, alertas com responsáveis, ancoragem de auditoria, backups automáticos e ensaios periódicos de recuperação.
5. CSP estrita também no legado, revisão das rotas HTML/clean URLs em cada hosting, pentest/revisão independente e confirmação física Android.
6. Revisão jurídica/operacional RGPD, retenção e acesso a saúde, incidentes, contratos com subcontratantes e validação explícita antes de dados reais.

## Plano de migração — nenhuma execução autorizada por este documento

Não remover simplesmente os bloqueios sintéticos. Preparar alteração revista para staging remoto: confirmar projeto/UE/quotas gratuitas, destino e marcador de ambiente; aprovar fornecedores e custos; provisionar segredos fora do Git; verificar TLS; criar papéis mínimos separados; definir bootstrap controlado do primeiro CEO por operador autorizado, sem inscrição pública nem password fixa; reconciliar emails únicos e vínculos das fichas sem ativar candidatos automaticamente; backup inicial verificado; aplicar migrações versionadas apenas no destino autorizado. Executar seis perfis, duas sessões/dispositivos, isolamento, revogação, scanner, documentos, concorrência financeira e recuperação. Fazer reconciliação de registos antigos sem clínica inequívoca, preservando-os. Reverter aplicação antes de alterações incompatíveis; rollback de schema apenas após ensaio e verificação de preservação. Produção exige autorização explícita distinta e plano de janela/reversão.

## Backups, recuperação e incidentes

Proposta sujeita a aprovação operacional: backup diário cifrado e PITR conforme fornecedor/quotas; cópia independente, chaves separadas, inventário e retenção legal validada; ensaio mensal de restauro para novo destino. RPO/RTO devem ser definidos pelo responsável, medidos e aprovados, não são garantias deste CI. Recuperar DB, objetos e chaves de forma consistente; verificar contagens, referências, cadeia de auditoria, autorização e downloads antes de reabrir. Nunca restaurar por cima de produção durante testes.

Em incidente: preservar evidências minimizadas, revogar sessões/credenciais afetadas, conter acesso, identificar escopo, informar responsável de segurança/privacidade, avaliar obrigações legais e prazos aplicáveis, recuperar em ambiente validado e documentar causa/medidas. Não eliminar automaticamente documentos, auditoria ou dados de titulares sem análise de obrigações legais e autorização. Exportações e pedidos de titulares requerem identidade, autorização e registo.

## Resultado final e publicação bloqueada

Código **40301aeaeb82868a6d4d3b687448ec90709d0154**: **44/44 jobs aprovados**, incluindo 42 jobs Chromium, regressão npm/build e PostgreSQL. Execução [40430408470](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40430408470); [artefactos sintéticos](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40430408470#artifacts). Identidade: 16 cenários. Recuperação: 5. Chromium de identidade: 366 verificações, 36 contextos, zero falhas. Dependências: zero alertas conhecidos.

A chamada Vercel para publicar o pacote estático protegido ficou sem resposta e foi interrompida. A listagem posterior confirmou que não existe novo deployment desta versão; o mais recente continua a ser o Financeiro, commit 49f6f67e. **Não há novo preview READY de segurança confirmado.** O endereço antigo não é prova desta entrega. Não foi repetida a publicação, alterada a proteção do projeto ou ativado backend/serviço externo. O pacote estático sintético está preparado privadamente em `/workspace/security-p0-20261026/preview-package.json`, sem backend, cron, segredos ou documentos reais. Antes de retomar a publicação, voltar a consultar deployments para evitar duplicação, confirmar os 44 jobs e o commit, publicar apenas no projeto sintético existente e verificar estado READY, HTML, assets e manifesto HTTP.

Main preservada em 84fba5a2d6d7afcb0723ca312f4e617acc22823d; PR13 em rascunho. Produção não foi destino de publicação, migrações ou alterações de configuração. O sistema continua sem autorização para dados reais.
