# P0.1 — Preparação do ambiente central de testes

Âmbito autorizado: primeira fase da auditoria 576feb02. Não ativa autenticação, emails, arquivo privado, UI central ou escritores de negócio. Não cria recursos Neon/Vercel nem usa credenciais de produção. Não altera os 221 requisitos da auditoria para «operacionais».

## O que foi reutilizado

- `db/schema.sql` e dez ficheiros SQL de migração existentes, sem alterar os seus bytes.
- Contrato GPS em `gs_schema_migrations`, checksum e serviço existente.
- Princípios do runner anterior: transação, controlo de concorrência e rejeição de checksum divergente. O runner anterior mantém-se intacto.
- Driver `pg` já fixado no lockfile. Nenhuma dependência nova.
- Experiência existente de backup AES-256-GCM, `pg_dump` e restauro em clone. O teste de segurança anterior permanece intacto; este ensaio valida a nova sequência, sem ativar identidade.

## Preparado nesta fase

| Componente | Comportamento |
|---|---|
| Manifesto único | 11 entradas ordenadas, caminhos e SHA-256; ficheiro alterado causa bloqueio |
| Destino | Nome de base restrito, utilizador/destino observados no servidor, UUID de ambiente e marcador synthetic-only |
| Desenvolvimento remoto | Endpoint Neon AWS UE explicitamente autorizado, direto, TLS com validação de certificado; sem fallback DATABASE_URL |
| Testes locais/CI | Apenas loopback, CI e autorização descartável; bases próprias, diferentes das de segurança/negócio já existentes |
| Migração | Toda a sequência e ledger numa transação; locks; replay sem reaplicar; rejeita drift ou backup desatualizado |
| Backup | Dump cifrado AES-256-GCM, autenticação dos metadados, chave fora do repositório e do backup, SHA-256, contagens e fingerprint dos registos |
| Restauro | Só em clone marcado e vazio, com UUID/base distintos; confere conteúdo e contagens antes de remapear apenas o marcador do clone |
| Privilégios | Migrador proprietário da base, sem superuser/createdb/createrole/replication/bypassrls; runtime distinto e sem herança do migrador |
| Runtime dormente | CONNECT, USAGE do schema e SELECT só do marcador; sem SELECT/INSERT/UPDATE/DELETE dos dados de negócio, sem DDL ou acesso ao ledger |
| Ativações | Marcador impõe auth/email/archive=false. Nenhum handler importa o novo tooling |

Não são backups automáticos/PITR. Não é persistência central da aplicação. Não é autorização para dados reais. Não inclui serviços pagos.

## Limites da sequência

O manifesto cobre os ficheiros SQL versionados disponíveis. Há schemas embutidos nos serviços/API: ainda será necessário inventariar a sua paridade antes de ligar cada módulo. A migração `security-p0-001` e o seu rollback são diferidos: mantêm o seu guard de base descartável de segurança e pertencem a uma fase posterior não autorizada agora.

Os `BEGIN/COMMIT` externos dos ficheiros existentes são retirados apenas em memória para permitir uma transação global. Não se alteram SQLs históricos. Falhas antes do COMMIT fazem rollback do DDL e do ledger. Após migração, a recuperação é ensaiada num clone separado: não há comando automático que substitua a base de origem ou faça downgrade destrutivo.

Só existe concessão mínima para preparação. Privilégios funcionais futuros devem ser definidos por serviço/operacão e testados com a autorização da fase seguinte. Dar acesso geral a todas as tabelas ao runtime não é um passo desta fase.

## Configurações externas pendentes — intervenção necessária

Não existe credencial Neon pronta nesta sessão. A preparação remota está interrompida nesse ponto; os testes descartáveis não demonstram que Neon está configurado.

1. Confirmar um projeto/branch Neon novo e isolado em região UE, quota gratuita e ausência de cobrança. Não reutilizar endpoints/credenciais de produção. Nenhum recurso foi criado automaticamente.
2. Criar a base `gs_v4_test` e reservar `gs_v4_test_restore` para ensaios. Se a plataforma não permitir os privilégios exigidos, parar e rever o desenho; não usar um superuser como runtime.
3. Criar credenciais próprias: migrador proprietário apenas das bases de testes e runtime diferente, sem privilégios elevados ou herança. O clone deve ter identidade/credenciais separadas. Definir passwords no fornecedor/gestor de segredos, nunca em SQL versionado, argumentos de comandos ou nesta conversa.
4. Disponibilizar as credenciais ao executor seguro através de variáveis/gestor de segredos; não as enviar pelo Chat. Confirmar acesso de rede ao endpoint direto e disponibilidade de `pg_dump`/`pg_restore` compatíveis com a versão PostgreSQL.
5. Guardar uma chave aleatória de 32 bytes num ficheiro privado 0600, fora do checkout e dos artefactos, e em custódia separada dos backups. Sem a chave, um backup cifrado não é recuperável. Ainda não há custódia operacional confirmada.
6. Configurar armazenamento dos backups fora do repositório, com acesso restrito e retenção de testes. A frequência, alertas, PITR e objetivos RPO/RTO continuam por definir/validar; não se presumem SLAs.

Variáveis de preparação, sem valores secretos neste documento:

- `GS_P0_ENVIRONMENT=isolated-test`
- `GS_P0_TARGET_ID`: UUID único do ambiente/base
- `GS_P0_REMOTE_APPROVED=true` e `GS_P0_ALLOWED_HOST`: endpoint direto aprovado
- `GS_P0_MIGRATION_DATABASE_URL`, `GS_P0_RUNTIME_DATABASE_URL`: credenciais distintas, mesmo destino, `sslmode=verify-full`
- `GS_P0_BACKUP_KEY_FILE`, `GS_P0_BACKUP_FILE`: caminhos absolutos em diretório privado 0700
- `GS_P0_CA_FILE`: CA do libpq, quando necessário; não desligar validação TLS

Estas variáveis não são lidas pela aplicação normal. Não criar `.env` no Git. Não usar URLs de `DATABASE_URL`, `GS_IDENTITY_DATABASE_URL` ou `GS_FINANCE_DATABASE_URL` como destino desta preparação.

## Procedimento autorizado quando o destino de testes estiver disponível

Executar no executor seguro com segredos já provisionados. Os comandos abaixo não criam recursos remotos e não incorporam passwords:

```sh
node scripts/p0-test-environment.cjs plan
node scripts/p0-test-environment.cjs bootstrap
node scripts/p0-test-environment.cjs backup
node scripts/p0-test-environment.cjs migrate
node scripts/p0-test-environment.cjs permissions
node scripts/p0-test-environment.cjs verify
```

`bootstrap` só aceita base vazia ou marcador já válido. O backup inicial ocorre depois da criação desse marcador e antes de qualquer tabela de negócio. `migrate` exige backup cifrado válido do mesmo destino, com menos de uma hora e fingerprint sem alterações. Para um novo backup escolher um novo caminho: não sobrescreve ficheiros existentes.

Após migração/permissões, produzir outro backup. Configurar o clone vazio, com UUID e credenciais diferentes; executar `bootstrap` no clone. Para `restore`, o alvo continua a ser o clone e as variáveis `GS_P0_SOURCE_TARGET_ID`, `GS_P0_SOURCE_MIGRATION_DATABASE_URL`, `GS_P0_SOURCE_RUNTIME_DATABASE_URL` identificam a origem. Os mesmos filtros de isolamento aplicam-se a ambos. O restauro valida primeiro a chave, origem, integridade e marcador do clone. Nunca apontar para uma base com dados existentes. Um restauro falhado deixa o clone indisponível para uso; conservar o backup, diagnosticar e recomeçar apenas num clone vazio.

```sh
node scripts/p0-test-environment.cjs restore
node scripts/p0-test-environment.cjs verify
```

Conferir que a origem não mudou e que contagens/fingerprint/restauro e proibições do runtime passaram. Não avançar para autenticação/UI central por este procedimento.

## Testes e estado

- Testes unitários de guard, TLS, manifesto e criptografia: 22 casos, aprovados localmente.
- Sintaxe: 275 ficheiros JavaScript verificados na primeira implementação.
- `npm test`: aprovado localmente, incluindo regressões do programa. O replay histórico opcional continua a não equivaler a teste executado.
- Ensaio PostgreSQL novo: incluído no job descartável existente, com bases/roles próprios. 20 cenários aprovados no CI de `69265de1`: ver [resultados e evidências](RESULTADOS-P0-FASE-1-20261104.md). Não confundir esta prova com Neon remoto operacional.
- Docker local: acesso ao socket recusado. Não foi repetido o comando nem reiniciado o daemon.
- Neon remoto, TLS real, quotas, segredos, backup agendado e recuperação operacional: pendentes.

Não foram feitos testes visuais novos porque não existe alteração da interface. Os seis perfis continuam cobertos pela regressão existente; esta fase testa credenciais de infraestrutura, não ativa login central por perfil.

## Critério de saída

Fase de preparação pode ser validada por manifesto/migração/replay/rollback/roles/backup/restauro em PostgreSQL descartável. O **ambiente remoto continua não operacional** até prova efetiva no destino autorizado. Não avançar para P0.2 sem nova autorização.
