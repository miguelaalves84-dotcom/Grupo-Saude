# Consolidação RH e dashboards

Base: código `66eaec92`, relatório anterior `f38cb4f8`, branch `dev/v4-stabilization-20261017`. A [auditoria prévia](AUDITORIA-CONSOLIDACAO-RH-DASHBOARDS.md) precedeu a implementação.

## Organização e navegação

O menu mantém os controladores anteriores e passa a sete áreas, nesta ordem: Dashboard Geral, Área pessoal, Gestão, Operação, Recursos Humanos, Financeiro, Administração do sistema. Os grupos sem acesso permanecem ocultos. Só um grupo pode estar expandido. Não foram criados novos perfis.

O Dashboard Geral existente continua exclusivo de CEO/Administração autorizados, com os onze indicadores no detalhe, filtros, comparação por clínica e navegação contextual. Cada uma das outras seis áreas tem uma página «Visão geral», com métricas derivadas, gráfico de indicadores, registos datados no período, assuntos pendentes e acesso às operações anteriores.

O Financeiro utiliza o ledger canónico, incluindo compatibilidade com movimentos anteriores, e separa créditos confirmados, pagamentos e variação do saldo no período. Não subtrai os pagamentos uma segunda vez nem os mistura com Caixas/Faturação.

Os dashboards são projeções de leitura, não novas tabelas de negócio. O contexto de clínica/período é validado e transportado para o detalhe; os atalhos financeiros abrem a conta corrente com esse mesmo contexto. Os detalhes não permitem acesso adicional ao que os controladores de origem autorizam. Fontes indisponíveis são identificadas por «—», não por zero confirmado; situações atuais sem data são explicitamente distinguidas dos registos do período. A evolução representa contagens de registos observados, não receitas ou previsões.

As notificações reutilizam `AttentionUIV4` e os identificadores existentes; não há fila nem tabela de notificações paralela. Os assuntos já filtrados podem ser abertos através do controlador original. A Área pessoal usa o proprietário do registo, sem agregar RH de outras pessoas.

## Recursos Humanos

| Área | Alteração / preservação | Limite |
|---|---|---|
| Colaboradores e Meu RH | Ficha única, oito assuntos, lista e filtros da tarefa 18 preservados; área pessoal separada | Não representa autenticação central ativa |
| Escalas | Opção «Trabalha por escalas» na secção Horário; novas atribuições limitadas aos ativos associados que aderem; desativação mantém registos existentes | Administrativas sem opção antiga explícita mantêm compatibilidade até revisão; novos pedidos/atribuições respeitam a opção |
| Profissionais em escalas | Gestores podem selecionar outras funções quando a ficha ativa explicitamente escalas | Não se concedem direitos de aprovação nem autoaprovação a outros perfis |
| Histórico de horários | Opção entra na auditoria da ficha; escala e horário fixo/pausa permanecem nas fontes anteriores | Nenhuma escala anterior é apagada |
| Diuturnidades | Regras por ficha com aplicabilidade confirmada, referência contratual/IRCT, antiguidade relevante, escalões por meses completos, total mensal, teto opcional e vigência; vínculo e entidade empregadora de referência são ligados automaticamente à versão confirmada do contrato | Sem direito presumido; a configuração exige validação humana. Alterações de vínculo ou entidade obrigam a rever o enquadramento, sem transportar automaticamente direitos entre entidades |
| Histórico remuneratório | Novas regras preservam versões; conferência pode criar nova vigência contratual sem reescrever versões antigas | Proibida substituição silenciosa de regra com a mesma data |
| Processamento salarial | Incidência de diuturnidades pode derivar da regra validada e fica ligada à regra de origem | Mudança de escalão/regra dentro do período bloqueia exportação até conferência da vigência/proporcionalidade; não se inventa prorrata |
| Prestação de serviços | Não recebe diuturnidades de vínculo laboral nem entra no processamento salarial | Regras não são inferidas da profissão ou perfil |
| Assiduidade e banco | Ponto, escala efetiva, diferenças, ocorrências e histórico preservados | Diferença de ponto não cria crédito legal, compensação ou pagamento |
| Férias, baixas e ausências | Calendários, decisões, saldos e sobreposições existentes preservados | Sem alteração de regras laborais |
| Documentos | Checklist, catálogo, cédulas e Meu RH continuam a usar os mesmos registos | Arquivo privado real continua desativado no preview |
| Financeiro e desenvolvimento | Conta corrente, pagamentos autorizados, formação, avaliações, equipamento e despesas mantêm controladores e permissões anteriores | Sem novos movimentos nem pagamentos automáticos |

O cálculo configurável reutiliza a função de antiguidade já validada nos 12 modelos de declarações, incluindo 29 de fevereiro e fins de mês. Usa meses completos a partir da antiguidade relevante confirmada. Cada escalão corresponde ao total mensal aplicável, não à soma implícita dos escalões. Regras jurídicas especiais, contagem distinta, suspensão da antiguidade ou proporcionalidades exigem enquadramento próprio e revisão; não são presumidas pela aplicação.

## Segurança e backend

`module-dashboards-core-v4.js` aplica perfil, ação, clínica ativa/autorizada, proprietário e período. A API `api/module-dashboards.js` utiliza o contexto autenticado existente e leitores das fontes centrais; ignora identidades e permissões enviadas pelo navegador. É apenas GET e está bloqueada por defeito, incluindo produção. Nenhuma migração ou configuração remota foi executada.

O leitor financeiro usa as fontes financeiras e os mapeadores existentes, sem carregar filas de email ou serviços desnecessários. A projeção omite conteúdos de documentos, diagnósticos, credenciais e detalhes sem autorização. Campanhas multiclínica respeitam a visibilidade do domínio Marketing existente.

O preview continua estático e demonstrativo. A API isolada testada não significa que a interface esteja autenticada ou partilhe dados entre dispositivos. Não foram ativados emails, assinatura digital, armazenamento privado, fornecedores, pagamentos ou serviços reais.

## Regressões encontradas durante a execução

1. Um redirecionamento em todos os eventos de atualização do utilizador interrompia páginas nativas de ponto, operação, agenda e salários. Foi retirado; mantém-se a página quando autorizada, limpando/recalculando os dashboards ao alterar identidade/permissões. O destino pessoal é usado como fallback autorizado, não para interromper operações existentes.
2. O atalho financeiro precisava de preservar datas e a seleção de clínica também no relatório da conta corrente. Passou a usar uma entrada contextual no controlador financeiro existente.
3. O leitor inicial dos indicadores financeiros dependia de um bootstrap demasiado abrangente. Foi restringido às fontes financeiras necessárias; testes isolados validam a projeção na API.
4. A gravação de fichas com contratos antigos confundia um campo opcional ausente com o mesmo campo vazio. Corrigida a comparação sem reescrever versões; alterações efetivas continuam a exigir nova vigência.
5. O cenário sintético conservava um alias antigo de clínica; corrigido o teste sem retirar a validação clínica.
6. Os testes do menu passaram a exigir sete grupos, por alteração explícita do requisito. Não se retiraram verificações de permissões ou funcionamento.

7. A navegação financeira contextual passou a unir movimentos por identificador e a limitar os colaboradores e clínicas autorizados, incluindo pagamentos associados a movimentos de outra clínica autorizada. Os acessos financeiros nativos mantêm o comportamento anterior.
8. O enquadramento de diuturnidades acompanha o vínculo e a entidade confirmados na vigência. A alteração simultânea de contrato e regra usa uma vista transitória para cálculo e a validação/gravação original atómica; não persiste contratos provisórios nem reescreve o histórico.

## Validação e entrega

Código publicado: `e7e6d6c8d5e36dc78b90428f82404b6bf6e4c512`.

Preview **READY**: https://grupo-saude-v4-validacao-sintetica-rktytj27m-grupo-saude.vercel.app

Mantém a proteção Vercel; pode exigir entrada numa conta autorizada. Acesso HTTP 200 confirmado pelo conector autorizado na página inicial, manifesto e seis ficheiros JS/CSS principais. Os oito conteúdos correspondem exatamente ao pacote local. O manifesto e os metadados do deployment identificam o commit publicado. Foram verificados os hashes/tamanhos dos 143 ficheiros do pacote estático.

- [GitHub Actions: 54/54 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41667942991).
- `npm test` e `npm run build`: aprovados; sintaxe de 271 ficheiros JavaScript; testes da nova funcionalidade e suites existentes.
- PostgreSQL descartável: permissões dos seis perfis, projeções por clínica, APIs, concorrência e regressões existentes aprovadas. Não representa persistência central operacional no preview.
- Nova suite Chromium: **1122 verificações, zero falhas**; seis perfis × computador/tablet/telemóvel × claro/escuro.
- CEO: 250; Administração: 248; Call Center: 150; Médico: 150; Técnico: 150; Administrativo: 174. São verificações desta suite, não contagens de funcionalidades distintas.
- [Capturas dos dashboards/RH](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41667942991/artifacts/13247945015), [ficha RH](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41667942991/artifacts/13245909829) e [Dashboard Geral/design](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41667942991/artifacts/13246779503). Artefactos sujeitos à retenção do workflow; o índice dos resultados fica versionado.
- [Índice completo de resultados e evidências](evidencias/rh-dashboards-resultados.json).

Chromium com viewport e toque simulados não é validação num Android físico. A abertura remota foi verificada por HTTP autorizado e correspondência do pacote; as operações Chromium foram executadas no ambiente isolado do GitHub Actions, não no endereço protegido remoto.

A pesquisa de seis padrões de credenciais e caminhos proibidos nos 26 ficheiros alterados não encontrou correspondências; não constitui prova absoluta de ausência de qualquer segredo. O pacote exclui APIs, bibliotecas do backend, bases de dados e credenciais. Os 20 PDFs adicionais são exemplos sintéticos. PR #13 continua em rascunho. Main e produção preservadas; nenhuma migração, configuração de serviços reais ou ativação de pagamentos.

Pendências reais: autenticação/persistência/arquivo centrais integrados e validados; revisão jurídica dos regimes de diuturnidades e banco de horas; configuração de integrações e fontes ausentes; confirmação visual num tablet físico. Os dashboards não ativam nenhuma destas capacidades.


## Matriz de acesso padrão

| Perfil | Geral | Pessoal | Gestão | Operação | RH | Financeiro | Sistema |
|---|---|---|---|---|---|---|---|
| CEO | Sim | Própria | Sim | Sim | Sim | Sim | Sim |
| Administração | Sim | Própria | Sim | Sim | Sim | Sim | Sim |
| Administrativo | Não | Própria | Reclamações | Funções autorizadas | Não | Própria | Não |
| Médico | Não | Própria | Não | Stock/Chat autorizados | Não | Própria | Não |
| Técnico | Não | Própria | Não | Stock/Chat autorizados | Não | Própria | Não |
| Call Center | Não | Própria | Não | Pedidos/Stock/Chat autorizados | Não | Própria | Não |

A existência de um dashboard de área não concede todas as operações dessa área. As permissões configuradas e as clínicas autorizadas prevalecem sobre esta matriz padrão. «Todas» significa todas as clínicas autorizadas ao ator, incluindo durante simulação. Entidades administrativas virtuais não contam como clínicas operacionais nem geram atividade clínica.

## Ficheiros principais

- `workspace-shell-v4.js`, `app.js`, `role-access-admin-v4.js`: organização do menu e integração na navegação/autorização existente.
- `module-dashboards-core-v4.js`, `module-dashboards-ui-v4.js`, `module-dashboards-v4.css`: projeções, gráficos, filtros e atalhos.
- `api/module-dashboards.js`, `lib/module-dashboards-service.js`: leitura autenticada isolada, bloqueada por defeito; nenhuma nova tabela.
- `hr-seniority-core-v4.js`, `hr-seniority-ui-v4.js`, `hr-master-v4.js`: regras, interface na ficha única e auditoria.
- `administrative-rosters-core-v4.js`, `administrative-rosters-ui-v4.js`: opção de escalas e preservação do histórico.
- `payroll-export-core-v4.js`, `finance-ui-v4.js`: incidências com origem e navegação contextual, sem pagamentos automáticos.
- `tests/module-dashboards.cjs`, `tests/module-dashboards-browser.py`, `tests/hr-portal-postgres.cjs`: verificações de domínio, navegador e PostgreSQL/API; regressão do menu atualizada em `tests/consolidation.cjs`.

### Validação no tablet

Entrar com dados sintéticos; confirmar os sete grupos, abrir cada Visão geral, alterar clínica/período, consultar cartões e regressar à origem. Em Colaboradores, verificar a opção de escalas, a preservação da escala histórica e o editor de diuturnidades. Testar temas e simulação de perfis sem usar dados reais. Fontes centrais, arquivo e assinatura não estão ligados no preview; documentos sem clínica validada não são atribuídos artificialmente a uma clínica para aumentar indicadores.

O preview novo é uma origem distinta no navegador: os dados sintéticos introduzidos manualmente num URL anterior não são copiados automaticamente para o novo URL. O armazenamento local e os históricos do preview anterior não são alterados por esta publicação. Não existe sincronização entre dispositivos ou recuperação central ativa.
