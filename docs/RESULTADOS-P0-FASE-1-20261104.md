# Resultado P0.1 — ambiente central de testes

Referência da autorização: auditoria `576feb02`. Data: 04/11/2026. Código final: `69265de148298f87a0c3e36f6b62db07f3edb74f`. Branch: `dev/v4-stabilization-20261017`. PR #13 em rascunho.

**Preparação técnica e ensaio descartável realizados; Neon remoto não criado/configurado nem operacional.** Esta fase não ativa autenticação central, emails, arquivo privado, escritores de negócio ou persistência UI/API entre dispositivos. Não é autorização nem validação para dados reais.

## Entrega técnica

- [Procedimento e configurações pendentes](P0-FASE-1-AMBIENTE-CENTRAL-TESTES.md).
- [Manifesto das 11 migrações](../db/plans/p0-test-environment.json).
- [Runner privado de operação](../scripts/p0-test-environment.cjs) e [controlos de destino, migração e recuperação](../lib/p0-test-environment.cjs).
- [Testes unitários](../tests/p0-test-environment.cjs) e [ensaio PostgreSQL](../tests/p0-test-environment-postgres.cjs).
- [Evidência minimizada](evidencias/p0-fase1-ambiente-testes.json).

## Componentes preservados e reutilizados

Nenhum SQL histórico foi editado. O schema inicial e dez migrações existentes alimentam um único plano ordenado com SHA-256. O contrato/checksum GPS existente é preservado. O runner GPS anterior, os serviços, os controlos de identidade descartável, o domínio, a interface e os testes anteriores não foram removidos.

As únicas alterações em ficheiros existentes são a inclusão do teste unitário em `npm test` e do ensaio P0.1 no job PostgreSQL já existente. Os restantes ficheiros desta fase são novos. Não foram adicionadas dependências nem alterado o lockfile.

## Proteções demonstradas

1. Nome/host/ambiente/UUID explícitos, confirmação do utilizador/base no servidor e marcador `synthetic-only`.
2. Recusa de produção, fallback para URLs da aplicação, credenciais partilhadas, endpoint remoto não aprovado, endpoint pooled e TLS sem verificação integral.
3. Recusa de schemas de utilizador inesperados, inclusive dados escondidos fora de `public`; bootstrap apenas em base vazia ou marcador já verificado.
4. Migrador proprietário da base de testes, sem atributos globais elevados; runtime distinto, sem privilégios elevados, pertenças a outros roles ou herança do proprietário.
5. Runtime dormente: só ligação, uso do schema e leitura do marcador. Não pode ler dados RH, modificar dados, fazer DDL, alterar o ledger ou assumir o migrador.
6. Backup inicial obrigatório, AES-256-GCM com metadados autenticados, chave separada, SHA-256 e fingerprint dos registos. Documento de backup errado, alterado, antigo, sem data válida ou com dados de origem entretanto modificados causa bloqueio.
7. Sequência SQL e ledger numa transação, com locks, rejeição de drift e replay idempotente. Falha SQL intermédia reverte DDL e ledger. Duas execuções concorrentes não produzem aplicação duplicada.
8. Restauro apenas em clone marcado vazio, com UUID/base distintos; autenticação da chave/conteúdo, conferência de linhas, continuidade das sequências e confirmação de que a origem permaneceu inalterada.

O marcador do clone restaurado recebe apenas o novo UUID de isolamento. Não se alteram identificadores nem históricos de negócio. Em caso de falha no restauro, o clone não deve ser usado: conservar o backup e diagnosticar antes de repetir num clone vazio. Não existe comando que restaure por cima da origem.

## Resultados dos testes

| Verificação | Resultado | Origem |
|---|---|---|
| Guard/TLS/manifesto/criptografia | 22 aprovados | Execução local Node 24 |
| Sintaxe | 275 ficheiros verificados | Execução local |
| Regressão do programa e build | Aprovados | Job 126320996960 no SHA final |
| Novo ensaio PostgreSQL P0.1 | **20 cenários aprovados**, 11 migrações | Job 126320995523, PostgreSQL 17 descartável real |
| Regressões PostgreSQL existentes e recuperação de segurança | Job aprovado | Mesmo job, fontes e bases sintéticas anteriores preservadas |
| Suites Chromium preexistentes | Execução global ainda em curso na recolha | Sem alterações da interface; não se declara aprovação antecipada |

Execução exata: [GitHub Actions 41752443082](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41752443082), código `69265de1`. Os testes SQL desta fase não foram simulados nem executados contra Neon remoto.

Os casos PostgreSQL da fase cobrem: rejeição de schema inesperado; bootstrap/replay do marcador; marcador errado; roles herdados; backup inicial cifrado; data inválida no backup; rollback de erro SQL; concorrência na aplicação das 11 migrações; replay idempotente; compatibilidade do ledger GPS; proibições do runtime; alteração de dados após backup; rejeição de restauro na origem; chave errada; dump/restauro efetivo e origem preservada; continuidade de sequências; clone já preenchido; flags de ativação desligadas; drift do ledger; isolamento da credencial runtime do clone. São grupos de verificações, não módulos funcionais em produção.

A execução PostgreSQL usa bases próprias (`gs_v4_p0_synthetic` e `gs_v4_p0_restore_synthetic`) num serviço CI descartável. As passwords são geradas em memória e não são artefactos. Dump e chave não são publicados. A evidência guarda apenas contadores, flags e resultados. A criação/remoção de uma tabela de teste num schema inesperado serve unicamente o caso negativo, na base sintética criada pelo teste.

Os testes antigos de identidade continuam a ser regressões em base descartável própria; isso não ativa autenticação central. Os testes em Chromium não constituem validação num tablet Android físico. Nenhuma alteração visual foi realizada nesta fase.

## O que continua pendente e exige intervenção externa

| Item | Estado real | Necessário |
|---|---|---|
| Projeto/base Neon UE | Não criado nem ligado nesta sessão | Confirmar recurso isolado/quotas gratuitas e acesso ao fornecedor; não reutilizar produção |
| Credenciais | Nenhum binding de segredo pronto no ambiente | Disponibilizar migrador/runtime distintos e credenciais próprias do clone no gestor de segredos do executor; nunca enviar valores no Chat |
| TLS/endpoint | Política de validação implementada/testada; ligação real não verificada | Endpoint direto aprovado e certificado válido; confirmar região no fornecedor |
| Aplicação das migrações remotas | Não executada | Destino vazio verificado, marcador, backup e execução supervisionada do procedimento autorizado |
| Recuperação remota | Só comprovada em PostgreSQL descartável | Repetir o ensaio no clone remoto autorizado, com ferramentas compatíveis e custódia segura da chave |
| Backups automáticos/PITR | Não configurados | Definir frequência, retenção, monitorização, RPO/RTO e testar recuperação; não inventar SLAs |
| Schemas embutidos nas APIs | Fora do plano de 11 ficheiros | Inventariar paridade antes de ligar módulos; não declarar a aplicação central completa |
| Importação de dados locais | Não realizada | Plano futuro de reconciliação; nenhum dado real ou localStorage/IndexedDB foi migrado |

As variáveis e passos exatos constam do procedimento. A parte remota fica suspensa até os acessos/segredos e as quotas serem confirmados. Não se pede partilha de credenciais nesta conversa. Não foi ativada faturação, contratado serviço pago ou criado recurso remoto; o CI reutiliza o workflow e runners standard do repositório público existente. Não foi feita uma auditoria da faturação da conta.

## Segurança do trabalho e limites

- PR #13 mantido em rascunho; sem merge ou force push. Main permaneceu em `84fba5a2d6d7afcb0723ca312f4e617acc22823d`.
- Sem publicação Vercel, migrações reais, ligações Neon, envios de emails ou documentos reais.
- Varredura dirigida dos oito ficheiros da implementação: zero assinaturas de chaves privadas, tokens GitHub, chaves OpenAI de projeto ou access keys AWS. Isto não é certificação global de ausência de segredos.
- Docker local recusou acesso ao socket; não se repetiu a chamada nem se tentou reiniciar o daemon. A prova SQL veio do CI, não deste Docker local.
- Não se concluiu autenticação central, paridade funcional de RH/férias, arquivo privado, RGPD ou preparação para produção. Os bloqueios da auditoria não são apagados por este ensaio de infraestrutura.

**Próximo passo permitido nesta fase:** apenas confirmar os acessos/quotas e repetir a preparação no destino de testes autorizado, caso sejam disponibilizados. **P0.2 e qualquer ativação de autenticação continuam dependentes de nova autorização.**
