# Segurança P0 — matriz de testes e dependências

Código final de testes: `40301aeaeb82868a6d4d3b687448ec90709d0154`; código funcional da aplicação preservado de `51f273ab`. Chromium/Chrome pré-instalado no runner, versão registada; Playwright 1.56.0. Não há downloads de sistema/navegador repetidos.

## Matriz de verificação

| Área | Prova automatizada | Limite da prova |
|---|---|---|
| Argon2id | `tests/security-foundations.cjs`: hash diferente com sal, password correta/incorreta, parâmetros alterados, política | Runtime Node 24; não substitui gestão operacional de segredos |
| Identidade e convite | `tests/security-auth-postgres.cjs`: seis contas individuais, inscrição proibida, convite único/expirado/revogado/concorrente | Apenas ficha sintética existente, email entregue a sink de memória |
| Recuperação | Mesmo teste: ligação temporária, uso único, expiração e revogação de sessões | Entrega externa não configurada |
| MFA | TOTP e backup codes reais, sessão limitada antes da prova, segundo dispositivo, reutilização recusada | Onboarding e recuperação por operadores reais pendentes |
| Sessões e cookies | PostgreSQL/API e `tests/security-auth-browser.py`: expiração, revogação, Secure/HttpOnly, sem token em armazenamento frontend | HTTPS local descartável, certificado de CI; não prova TLS Neon/Vercel backend |
| RBAC e IDOR | Seis perfis, multiclínica, documento de outra clínica, papel forjado, revogação, simulação CEO | Módulos de demonstração continuam sem escrita central |
| CSRF e força bruta | Origem atacante recusada, método/ação allowlist e limites persistentes por conta/origem | Rate limiting distribuído operacional e WAF externos pendentes |
| XSS | Device user-agent malicioso renderizado como texto, CSP estrita das páginas de autenticação, regressão de campos | Legado ainda usa unsafe-inline; não é certificação global anti-XSS |
| SQL | Queries parametrizadas, APIs de domínio e isolamento PostgreSQL | Sem pentest externo, RLS não implementado |
| Ficheiros | AES-GCM, AAD, rotação, adulteração/tamanho/assinatura, regras de documentos e acesso financeiro | Scanner e arquivo reais não ligados; não existe prova de antivírus operacional |
| Financeiro | Suites existentes: autorização, histórico, pagamentos idempotentes, clínica do documento e associação de movimentos | Não autoriza pagamentos reais nem confere regras de bónus pendentes |
| Auditoria | Cadeia concorrente, append-only, privilégio mínimo, ativação revertida se auditoria falhar | Administrador do DB não é ameaça eliminada; falta âncora externa |
| Backup/restauro | `tests/security-recovery-postgres.cjs`: dump cifrado, adulteração, restauro clone, objetos, mínimos privilégios/rollback guardado | Só ensaio descartável, sem backup automático ou RPO/RTO operacional aprovado |
| UI real de auth | Chromium → HTTPS → Better Auth/Argon2 → PostgreSQL; 6 perfis × desktop/tablet/mobile × claro/escuro | Não é validação num Android físico, sem emails externos |
| Regressão | npm test, build, suites de RH, operação, stock, financeiro, documentos, Chat e restante aplicação | Resultados só aprovados após conclusão efetiva no Actions |

A execução `f44a2cbd` teve 366 verificações Chromium de identidade aprovadas, 36 contextos, 15 cenários PostgreSQL de identidade e 5 de recuperação. Um teste antigo de fornecedor simulado falhou; foi corrigido, sem o apresentar como prova de autenticação real. A execução de `b3288a01` foi substituída pelo commit seguinte e não serve de aprovação integral.

## Dependências

| Pacote | Versão fixa | Uso |
|---|---|---|
| better-auth | 1.7.14 | Identidade, sessões, TOTP e recuperação |
| pg | 8.16.3 | PostgreSQL com queries parametrizadas |
| @neondatabase/serverless | 1.2.0 | Adaptador existente preservado; Neon remoto não ativado |
| @vercel/blob | 2.8.2 | Adaptador existente preservado; arquivo real não configurado |
| zod (override transitivo) | 4.6.7 | Correção da dependência vulnerável antiga 4.1.11 |

`package-lock.json`: 67 nós, URLs públicas sem credenciais; SHA256 `a6e362577d547ce8450aad4a007db54b15978bf5b5c6883b748a8ba6ba6c6ed6`. Instalação CI com `npm ci --ignore-scripts`. A auditoria sanitizada é produzida por `scripts/security-dependencies.cjs` e falha se indisponível ou com alertas HIGH/CRITICAL. O grafo anterior tinha quatro alertas HIGH da mesma cadeia `@vercel/blob → @vercel/oidc → @vercel/cli-config → zod`, GHSA-mrhx-c7xc-m3w5; resolvidos pelo override. Zero alertas conhecidos no grafo corrigido não significa segurança absoluta.

## Artefactos e segredos

Artefactos de segurança contêm resultados minimizados e capturas depois de limpar campos confidenciais. Não incluem cookies, storageState, traces autenticados, dumps, chaves TLS, convites, passwords ou códigos MFA. Dumps e chaves de restauro existem apenas em diretório privado temporário do runner e são removidos após o ensaio. Artefactos GitHub expiram; consultar e preservar as evidências autorizadas no prazo indicado pelo Actions.

Verificação final do código versionado: 590 ficheiros, zero assinaturas dos padrões pesquisados, nenhum `.env`, chave, dump, cache de dependências ou base privada versionado. É uma pesquisa delimitada de padrões, não uma certificação de todo o histórico ou de ausência de dados pessoais arbitrários. Todos os testes novos usam contas/documentos sintéticos e não consultam produção.
