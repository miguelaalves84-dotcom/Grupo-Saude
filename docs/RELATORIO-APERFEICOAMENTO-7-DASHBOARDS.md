# Aperfeiçoamento dos sete dashboards

Base: e7e6d6c8, cuja estrutura dos sete módulos foi validada pelo utilizador num tablet Android. A [auditoria inicial](AUDITORIA-APERFEICOAMENTO-7-DASHBOARDS.md) foi realizada antes das alterações. Trabalho na branch dev/v4-stabilization-20261017.

## Alterações implementadas

| Dashboard | Aperfeiçoamentos neste bloco | Fontes reutilizadas |
|---|---|---|
| Geral | Preserva quatro indicadores principais e detalhe anterior; acrescenta resumos acionáveis de RH, Financeiro, Gestão e Operação; acesso único no menu | Dashboard executivo anterior e projeções dos módulos |
| Área pessoal | Horário efetivo por clínica própria, pedidos pendentes, ausências aprovadas, documentos próprios; sem gráficos genéricos | Attendance.dailyPlan, leave, ponto e documentos existentes |
| Gestão | Prioridade às reclamações abertas/urgentes; encerradas no período; comparação de pendências por clínica | Complaints.timing com receção original; campanhas e clínicas existentes |
| Operação | Marcações iniciais/finais, atos realizados, faltas, remarcações, fechos em falta, avaliações/confirmações pendentes, últimos valores de espera e suspensos | Operation.statistics e Operation.rows, indicadores da jornada |
| Recursos Humanos | Ativos/inativos, férias/baixas aprovadas sobrepostas ao período, ocorrências, checklist documental, prazos administrativos de medicina do trabalho, formações por validar e contratos com fim registado | Cadastro único, documentos, ausências, ocorrências, hrOccupational e hrTraining |
| Financeiro | Faturação líquida documental, saldo confirmado até ao fim do período, pagamentos registados, caixas por validar e documentos existentes | Finance.turnover, Finance.ledger e FinanceCash.list |
| Administração do sistema | Contas associadas/inativas, auditoria quando disponível e estados explícitos dos serviços globais não integrados | Cadastro único, auditoria; nenhum estado ativo inferido de configuração |

Os seis dashboards de área passam a organizar os indicadores por assuntos. Cada cartão identifica valor/unidade, situação atual ou período e origem. Os filtros de clínica e datas foram compactados. O cabeçalho deixa de repetir o filtro clínico dos dashboards e os títulos podem quebrar linha.

O gráfico que repetia os cartões foi removido. Mantêm-se apenas análises específicas: distribuição dos ativos por clínica, atos por dia, ocupação por técnico e faturação por mês de início do resumo documental. Só aparecem com pelo menos duas linhas e valores positivos; caso contrário há uma indicação de insuficiência de dados. Uma associação multiclínica pode surgir em mais de uma coluna da distribuição, sem ser confundida com total de pessoas únicas.

«Requer atenção» reutiliza o centro de atenção existente, elimina identificadores repetidos e respeita o âmbito; não cria notificações nem novos contadores. As operações adicionais sem cartão equivalente ficam recolhidas, sem duplicar todos os atalhos.

## Segurança e significado dos valores

- Os filtros e permissões continuam no domínio partilhado e na API GET isolada existente. Perfil simulado não herda acesso de CEO.
- Área pessoal consulta apenas o proprietário; documentos de gestão não passam a ser documentos pessoais.
- Ausências de terceiros não são projetadas quando a permissão de aprovação é negada.
- Documentos sem clínica de um colaborador multiclínica não são atribuídos artificialmente à clínica selecionada.
- Os cartões de faturação não entram em Caixas ou na conta corrente. O saldo usa o ledger canónico; os pagamentos não são subtraídos duas vezes.
- Reclamações urgentes reutilizam o cálculo original de 15 dias corridos; a reabertura não altera a origem do prazo.
- Serviços globais apresentam estado não verificado/não integrado neste ambiente e não se tornam ativos por haver testes sintéticos.
- Não foram criadas tabelas, escritores, migrações ou serviços externos; não foram alterados dados históricos nem fórmulas de atividade.

## Cobertura ainda parcial — não considerar todo o pedido concluído

| Área | Pendente |
|---|---|
| Geral / Operação | Tabela detalhada por profissional, vagas atuais/de amanhã, ocupação agregada e comparação operacional adicional por clínica; não criar fórmulas alternativas |
| Área pessoal | Saldo detalhado de férias, próxima escala e tarefas pessoais no próprio dashboard; continuam nos módulos de origem |
| RH | Séries específicas de ausências e assiduidade; avaliações, aniversários sujeitos a política de privacidade e alertas contratuais além das datas de fim disponíveis |
| Gestão | Obrigações documentais das clínicas e aprovações de marketing detalhadas na tabela comparativa; preservadas nos módulos de origem |
| Financeiro | Série histórica de saldos, comparações financeiras por clínica e valores pendentes discriminados; conta corrente detalhada preservada |
| Sistema | Resultados operacionais de integrações, alertas de segurança e acessos por validar dependem de fontes verificadas; não são presumidos |
| API central | O leitor existente não carrega todas as fontes auxiliares do preview, nomeadamente resumos de faturação; fontes ausentes permanecem indisponíveis. Não existe UI central operacional ativada |
| Dispositivo físico | Esta versão necessita de validação visual e tátil no tablet do utilizador; Chromium não substitui Android físico |

## Testes e publicação

A primeira execução detetou uma expectativa desatualizada: o teste tratava Dashboard Geral como acordeão. O requisito novo torna-o um destino direto único. Os testes passaram a verificar esse destino separadamente e continuam a verificar que os outros seis grupos conservam a página selecionada. O clique executivo tem propagação única, evitando duas renderizações.

A comparação visual identificou ainda uma regressão real: a regra de quebra de títulos atingia a saudação executiva e aumentava a altura do cabeçalho no tablet. A regra foi limitada aos títulos de navegação; a tolerância do teste foi preservada. Um job anterior de segurança falhou antes dos cenários, no arranque de `google-chrome --version` com timeout de 10 segundos; esse resultado não foi contado como aprovação.

Código publicado: **77e8e8613e7a4660e49580d8d9373d1ec7571bae**.

Preview protegido **READY**: https://grupo-saude-v4-validacao-sintetica-ovteb7fjt-grupo-saude.vercel.app

- [GitHub Actions: 54/54 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41677052261), incluindo PostgreSQL descartável, segurança, comparações visuais e regressões.
- Nova suite dos dashboards: **1722 verificações aprovadas**, zero falhas; seis perfis, três formatos e dois temas. Não corresponde a 1722 funcionalidades distintas.
- CEO: 394; Administração: 392; Call Center: 222; Médico: 222; Técnico: 222; Administrativo: 270.
- `npm test`, sintaxe e build estática aprovados. Foram reutilizadas as suites anteriores; a comparação visual mantém os limites originais.
- HTTP 200 confirmado por acesso autorizado Vercel na página inicial, manifesto e quatro ficheiros de implementação. As seis respostas correspondem exatamente ao pacote local; o manifesto e os metadados identificam o código publicado.
- Chromium foi executado no CI isolado, com toque/viewport simulados. A verificação remota foi HTTP; não foi apresentada como sessão de navegador num Android físico.
- [Capturas dos seis dashboards de área](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41677052261/artifacts/13250762055) e [comparação visual do Dashboard Geral](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41677052261/artifacts/13251091992). Retenção dos artefactos: conforme workflow; o índice de evidências fica versionado.
- [Matriz completa de jobs, perfis, HTTP e artefactos](evidencias/aperfeicoamento-7-dashboards.json).

A pesquisa de padrões de credenciais nos dez ficheiros alterados não encontrou correspondências; isto não constitui prova absoluta de ausência de qualquer segredo. O pacote permanece estático, sem código de API, bases de dados ou credenciais. Main manteve o commit 84fba5a2d6d7afcb0723ca312f4e617acc22823d; configuração de produção inalterada; PR #13 em rascunho.

Ficheiros: module-dashboards-core-v4.js, module-dashboards-ui-v4.js, module-dashboards-v4.css, workspace-shell-v4.js; testes module-dashboards.cjs/module-dashboards-browser.py e testes de navegação stabilization/attendance/profile-audit.

O preview continua sintético e local ao navegador. Não sincroniza dados entre dispositivos nem copia dados de um URL anterior. Autenticação central, arquivo privado, emails e backups operacionais não foram ativados. Main e produção devem permanecer intactas, PR #13 em rascunho.
