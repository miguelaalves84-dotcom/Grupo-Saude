# Estabilização geral — revisão de 24/10/2026

Branch exclusiva: `dev/v4-stabilization-20261017`, PR #13 em rascunho. Base preservada `4405994`. Sem alterações de main, produção, recursos, dados reais ou migrações. Sem módulos ou regras novas.

## Validação física registada

O utilizador aprovou cinco testes de escrita no tablet Android físico no preview `f87e344`. [Evidência e âmbito](VALIDACAO-ANDROID-ESCRITA-20261024.json). Não foram comunicados os cinco casos individualmente nem versões de teclado/dispositivo; não se certificam por inferência todos os campos, GPS ou microfone. Mantida a distinção entre confirmação do utilizador e execução automática do agente.

## Revisão dos achados

[Matriz atual CSV](ESTABILIZACAO-MATRIZ-20261024.csv) · [Detalhes JSON](ESTABILIZACAO-MATRIZ-20261024.json). Foram relidos os 36 registos do inventário anterior e acrescentado o achado `SEARCH-CLOCK-01`, sem apagar os diagnósticos históricos:

- Quatro regressões já corrigidas e com regressões sintéticas existentes: horas RH, negações CEO, separação Clínicas/Tabelas e seis sobreposições visuais reais.
- Uma regressão adicional encontrada e corrigida neste ciclo: pesquisa do histórico pessoal do Livro de Ponto; aprovada no ciclo final efetivo.
- Um registo relativo aos 102 alertas: 102 falsos positivos individualmente classificados anteriormente; não reabertos como 102 erros de produto.
- Quatro bloqueios P0 mantidos: identidade, central, arquivo e recuperação.
- Vinte e sete registos parciais/pendentes, incluindo integrações externas, cobertura, validações legais e capacidades ausentes. O estatuto não significa 27 botões avariados. Capacidades ausentes não são acrescentadas nesta fase.

A matriz concilia provas anteriores e o âmbito desta revisão. Não é uma nova declaração de execução manual de cada operação dos 14 grupos. Nenhum ficheiro antigo foi removido por parecer obsoleto. O checkout continua shallow; a profundidade do histórico e as capacidades históricas por recuperar permanecem explícitas.

## Pesquisas e regressões

O novo cenário `tests/search-populated.py` é chamado pela suite existente, reutilizando os mesmos seis perfis × três formatos × dois temas. Usa pedidos originais do Call Center, conversas, alertas, documentos pessoais, campanhas e faturas/recibos sintéticos. Introduz termos com acentos/maiúsculas, termo inexistente, limpeza, verificação de resultado, preservação dos registos e controlos de destinatário/membro. Não cria uma segunda pesquisa nem bases de contactos.

A cobertura de uma pesquisa de registos carregados não significa pesquisa de PDFs, anexos binários, conteúdo remoto ou todos os subestados possíveis. Os resultados efetivos foram recolhidos do GitHub Actions e estão discriminados abaixo. Não se promove cobertura prevista a teste aprovado.

## Reconciliação dos bónus

As novas fórmulas continuam estritamente preliminares: `ready=false`, `paymentEnabled=false`. O circuito histórico não é substituído ou apagado. A revisão ampliou de seis para onze grupos de testes: limites do trimestre, vigências de prémios, snapshots antigos de produtos, origens repetidas/conflituosas, valores monetários que não podem virar unidades, ausência de taxa e imutabilidade do histórico financeiro. Os onze grupos passaram localmente.

Antes de integrar aprovação/pagamento das novas fórmulas faltam decisões sobre população ativa, entradas/saídas no trimestre, administrativas multiclínica, ausências no denominador, atribuição de vendas/devoluções/anulações, cobertura de lasers/produtos e arredondamento/distribuição. Uma soma correta não resolve essas ambiguidades. Duplicados são assinalados e não contados duas vezes; a sua ordem não escolhe uma origem comercial definitiva.

## Preparação da operação real

[Plano isolado dos quatro P0](P0-PREPARACAO-ISOLADA-20261023.md#plano-de-execução-e-aceitação-revisto--24102026): destinos/quota/custos → compatibilidade → autenticação → central → arquivo → recuperação → preview integrado. Não ativado. O preview estático atual não fornece autenticação central, partilha entre dispositivos ou arquivo privado operacional.

## Resultados e entrega

Ciclo final **concluído e aprovado**: commit `b9e10f03f3f13a32f41a74c90af05b08e7945760`, [GitHub Actions 40129386415](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40129386415): **37/37 jobs**, incluindo 35 suites Chromium, regressão Node/build e PostgreSQL descartável. Local: `npm test`, build, sintaxe Python e `git diff --check` aprovados. [Novo preview protegido READY](https://grupo-saude-v4-validacao-sintetica-l4ao48i8f-grupo-saude.vercel.app), SHA **b9e10f03f3f13a32f41a74c90af05b08e7945760**, deployment `dpl_AwjFCabgjPyK4N9p6q5BoSSJAWV1`. É distinto do preview f87e344 validado fisicamente pelo utilizador.


### Rastreabilidade dos blocos deste ciclo

- `e4aebed`: testes populados de pesquisas e onze grupos de reconciliação trimestral. A suite de pesquisas passou com 2 130 verificações e zero falhas, das quais 930 pertencem ao novo bloco populado. A execução global foi substituída pelo commit seguinte e cancelada; não é contada como aprovação global.
- `073fdbc`: reforça a escolha da clínica pela lista canónica e acrescenta pesquisa combinada com filtro de clínica no Marketing e recusa de pedidos de clínicas não autorizadas. Ciclo [40128939396](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40128939396) substituído pela correção seguinte; cancelado e não contado como aprovação global.

O alargamento ao Livro de Ponto pessoal encontrou uma regressão real: `history()` apresenta marcações como `article.check`, mas o seletor de `global-search-v4.js` não as incluía. Com histórico vazio, a suite anterior não demonstrava pesquisa positiva. A pesquisa podia dizer que não havia registos pesquisáveis e deixar visível uma marcação incompatível com o termo.

Correção `b9e10f0`: acrescentado apenas `#clockContent article.check` ao componente existente, sobre registos já autorizados/renderizados. Não há novo índice de pessoas nem acesso a clínicas adicionais. A fixture `tests/fixtures/global-search-before-attendance.js` preserva o componente anterior apenas para reprodução em teste; é excluída do build. O teste reproduz o erro anterior e exercita o comportamento atual com histórico pessoal populado nos seis perfis, três formatos e dois temas. A validação física comunicada para f87e344 não é apresentada como teste desta nova correção.

Não foram alterados layouts, regras de assiduidade ou cálculos para satisfazer os testes. As regressões anteriores permanecem preservadas. Nenhum código obsoleto foi removido sem prova de dependências.


A soma dos registos atuais é 37: quatro regressões históricas corrigidas, uma regressão de pesquisa deste ciclo, um registo de falsos positivos, quatro P0 e 27 parciais. As correções já aprovadas não são anunciadas como implementações novas. O novo teste de assiduidade completa a lacuna de dados positivos dos quatro perfis pessoais na matriz anterior e acrescenta a área pessoal de CEO/Administração.


O backup privado do código de partida foi verificado: 394 entradas, SHA256 `493981ba7c3054a856b982f8c94bdba10c6976d4c63d32323b400782a29896f7`. Não foi enviado ao GitHub nem incluído no preview. Isto não é restauro de dados centrais. A fixture de pesquisa antiga foi verificada byte a byte pelo blob Git `3679a44b66ea6a33bd516af95cba1dd99d464510`.


### Evidência funcional da pesquisa — SHA b9e10f0

A suite concluiu **2 490 verificações, zero falhas**, das quais **1 290** pertencem aos cenários populados adicionais. [Resumo versionado](PESQUISAS-ESTABILIZACAO-EVIDENCIAS-20261024.json) e [matriz das 114 combinações](MATRIZ-PESQUISAS-20261024.csv). A reprodução isolada confirmou os dois sintomas do histórico de ponto anterior: não encontrar um texto existente e não esconder o registo incompatível. O comportamento atual passou.

| Perfil | Verificações da suite | Falhas |
| --- | ---: | ---: |
| Call Center | 306 | 0 |
| Médico | 240 | 0 |
| Técnico | 240 | 0 |
| Administrativo | 324 | 0 |
| Administração | 690 | 0 |
| CEO | 690 | 0 |

São asserções, não funcionalidades distintas. As 32 combinações aprovadas nos cenários populados incluem histórico pessoal, conversas, documentos pessoais, pedidos autorizados, alertas de destinatário, campanhas/contactos e faturas/recibos. As restantes linhas preservam o âmbito específico, recusas e não aplicáveis. Não significa que cada estado, relatório, anexo ou operação de negócio ficou integralmente testado. A pesquisa não guarda alterações de negócio; os testes de gravação/permissões/persistência sintética continuam nas suites próprias.


## Verificação da publicação e segurança

Preview READY no projeto sintético existente, target staging e proteção Vercel para todos os deployments. Os 98 assets do payload foram comparados byte a byte com `dist`, com configuração/manifesto isolados, sem API/backend, .env, documentos ou backups privados. HTTP autenticado confirmou manifesto/SHA, página, componente de pesquisa, componente de edição e logótipo oficiais exatos; `/api/auth`, `/api/finance` e `/api/stock` responderam 404. Os testes Chromium completos foram executados no GitHub Actions contra build sintético em loopback, não numa sessão SSO remota. Não é prova de persistência central.

Main permanece `84fba5a2d6d7afcb0723ca312f4e617acc22823d`, PR #13 `draft=true`, configuração observada de produção `updatedAt=1791725971672`, igual à referência. Sem force push, merge, migrações ou serviços pagos contratados. Quotas gratuitas futuras continuam por confirmar; não se declara custo de futuros recursos como verificado.

Os artefactos principais do run conservam capturas/JSON até 07/11/2026, segundo o GitHub:

| Evidência | Artefacto | Digest SHA256 |
| --- | --- | --- |
| Pesquisas e reprodução | [12573938123](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40129386415/artifacts/12573938123) | `12732472414f08ee1104b524dc63fe7fbb867c6fb603d795c247005a6cfc264e` |
| Auditoria dos perfis | [12574082089](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40129386415/artifacts/12574082089) | `51cb0cb61a04047efa3da1af4d2b78a08689b0059fc463eac76e7dfbbf2ad33a` |
| Regressão visual | [12574737853](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40129386415/artifacts/12574737853) | `bed093f9e842403485bf63bc1edaf71a68d881399b427f8ce0f6d80037f49ed3` |

Métricas e classificações essenciais ficam versionadas; a preservação integral de todas as imagens históricas continua no achado HIST-BASELINE. Nenhum job verde encerra automaticamente as limitações conhecidas dos probes.

## O que falta e ordem de conclusão

1. **P0:** confirmar destinos/acessos/quotas e executar os ensaios isolados do plano; identidade, central, arquivo e recuperação são os quatro impedimentos diretos da operação real.
2. **P1 de consolidação:** fechar cobertura de operações completas e reconciliação de origens onde a matriz continua parcial. As novas fórmulas trimestrais ficam sem pagamentos até decisões explícitas; fluxos de empresa/anexos e indicadores não são declarados centrais.
3. **Dependências e capacidades incompletas:** revisão laboral/retencional, email/extração de CV, IA/Google/Meta, assinatura, banco de horas/turnos noturnos e demais lacunas da matriz não são implementadas como novas funcionalidades nesta estabilização.
4. **P2:** ampliar baseline e preservação de evidências, validar hardware/sensores ainda não testados e formatos/adaptadores externos apenas quando houver ensaios reais. Os cinco testes de escrita física comunicados já estão registados como aprovados no respetivo âmbito.

Este bloco entrega uma regressão de pesquisa corrigida, cobertura positiva ampliada, reconciliação trimestral revista e plano operacional. Não declara os 14 grupos integralmente concluídos nem autoriza entrada em produção.
