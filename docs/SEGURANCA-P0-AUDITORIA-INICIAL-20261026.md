# Segurança P0 — auditoria inicial

Base: `c32b042926f6e41166e5bc596d677f1cfed04549`, branch `dev/v4-stabilization-20261017`, árvore limpa. Backup privado verificado do código: SHA256 `ee36be2275c102d21705dd4e2104e26a10f5777260e3b1c7fd19ce34d005db41`. Não é backup da base de dados.

Antes de alterar código foram lidos os controladores de identidade, sessão, autorização, documentos/antivírus/recuperação, configurações dos quatro canais de email e auditorias P0 anteriores. A pesquisa por assinaturas de credenciais nos 571 ficheiros versionados não encontrou ocorrências. Isto não garante a inexistência de segredos em serviços externos ou no histórico completo. Valores de credenciais não foram apresentados nem utilizados.

## Matriz de riscos

| ID | Gravidade | Situação inicial / evidência | Tratamento previsto |
| --- | --- | --- | --- |
| AUTH-01 | P0 | `api/v4-auth.js` delega num fornecedor externo; não existe Better Auth instalado/configurado nem hashing local bcrypt/Argon2. | Backend Better Auth de teste, versão exata, Argon2id através de implementação criptográfica do Node, teste com PostgreSQL descartável. Sem fornecedor/recursos reais. |
| AUTH-02 | P0 | Não há MFA operacional obrigatório nem prova de segundo fator por sessão para CEO/Administração. | TOTP e recuperação do fornecedor; garantia de MFA validada no servidor; sessão limitada enquanto falta matrícula/MFA. |
| AUTH-03 | P0 | Convites, dispositivos e revogação integral após reset não estão integrados. | Convites de uso único, associação à ficha existente, expiração, revogação e testes com sessões independentes. Inscrição pública fechada. |
| SCOPE-01 | P0 | `person()` permite interseção de clínicas, que não basta para autorizar qualquer documento de colaborador multiclínica. | Validar clínica do documento, proprietário, operação e permissões; recusar associação clínica ambígua. |
| AUDIT-01 | P0 | Existem `finance_events` e `audit_log`, mas não proteção SQL explícita contra alteração/eliminação dos eventos por runtime. | Eventos de segurança minimizados e verificáveis; privilégios separados, proteção append-only e ensaios de adulteração. Não prometer proteção contra administrador da infraestrutura. |
| STORAGE-01 | P0 | Scanner, arquivo privado e recuperação preparados, sem serviços configurados. Não há prova de cifragem/recuperação em infraestrutura real. | Reutilizar os serviços, adicionar envelope cifrado e acessos auditados; testes privados sintéticos; manter importação real bloqueada. |
| RECOVERY-01 | P0 | Ensaios de código/ficheiros não provam restauro integral PostgreSQL+ficheiros. | Ensaio de backup/restauro para destino descartável; plano RPO/RTO sujeito a validação operacional. |
| DEPS-01 | P1 | Dependências com intervalos e sem lockfile. Acesso ao registry indisponível no sandbox. | Pinning e inventário/auditoria no CI; não declarar ausência de CVE nem instalação local sem evidência. |
| HTTP-01 | P1 | Origem e cookies protegidos; aplicação legada exige scripts inline e não dispõe de CSP estrita sem alterações adicionais. | Endurecer respostas API; CSP compatível e restrita nos previews, testar CSRF/XSS. CSP sem `unsafe-inline` no legado permanece dependência. |
| GDPR-01 | P1 | Prazos, bases legais, fornecedores, procedimentos e responsabilidades necessitam de aprovação jurídica/operacional. | Documentar controlos, retenção e incidentes; impedir eliminações automáticas; não declarar conformidade RGPD integral. |

O Node disponível é 24.19.0 e dispõe de `crypto.argon2`. Não existem segredos ou identidades de backend configurados no ambiente. A tentativa limitada ao registry falhou sem instalação; não foram repetidos pedidos de rede nem executados Docker, migrações reais ou comandos pendentes. Better Auth 1.7.14 foi confirmado na release oficial; a instalação e testes efetivos serão executados no CI isolado.

## Fases e limites

1. Identidade/MFA/sessões e testes reais da biblioteca em PostgreSQL descartável.
2. Isolamento, arquivo, auditoria, integridade financeira e ataques negativos.
3. Backup/restauro, dependências, documentação operacional e UI de autenticação.
4. Regressão dos seis perfis e preview sintético protegido, sem ligar serviços reais.

Nenhuma configuração remota de produção, migração real, serviço pago ou envio de email real está autorizado por esta execução.
