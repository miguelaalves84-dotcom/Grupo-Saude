# Navegação contextual — Grupo Saúde V4

Branch: `dev/v4-stabilization-20261017`; PR #13 em rascunho. Base preservada: `d76ec607`. Backup privado anterior às alterações: `before-smart-navigation-d76ec607.tar`.

## Auditoria e decisões

| Área | Destino útil / comportamento |
|---|---|
| Dashboard | Indicadores principais e detalhe abrem discriminação das fontes no âmbito e período aplicados. Pedidos abrem o registo original; dias abrem a operação com clínica/data e estatísticas com o período original. Tarefas pendentes deixam de apontar para a configuração de tarefas. |
| RH — resumo | Contrato e admissão abrem a secção original, expandida e focada; documentos reutilizam o editor autorizado; ausências, ponto, ocorrências e assuntos abrem o assunto correspondente. Regresso ao resumo mantém o colaborador. |
| Clínicas | Toda a linha documental pode acionar o botão original de consulta. Configuração não é confundida com acompanhamento documental. |
| Dia Clínico | Etapas, listas e ações existentes mantidas. Cartões com uma ação inequívoca de consulta reutilizam-na; campos de abertura/fecho não são convertidos em links nem gravados ao tocar. |
| Agenda | Eventos já são ações de registo; mantém-se a abertura original, com pessoa/clínica/período. Não é criado outro calendário. |
| Call Center / pedidos | Referências no Dashboard e nas notificações abrem `App.openRequest(id)`, não a criação de um pedido. Sem permissão `bookings`, campos e ações de edição ficam indisponíveis e a gravação direta é recusada. |
| Financeiro / Caixas | Saldos conduzem à tabela de movimentos do relatório existente. Linhas de movimentos/caixa reutilizam o histórico original; comprovativos, validação e edição continuam ações distintas. Caixa do Dashboard usa a mesma ficha/histórico financeiro, filtrada pela clínica e dia. |
| Stock | Produtos ativos → inventário; consumo → movimentos; pendências → alertas. Alertas de produto/encomenda incluem a identificação do registo de origem e abrem a ficha original; pedidos apontam para a lista existente. Linhas reutilizam ficha/lotes, encomenda ou decisão autorizada. |
| Marketing | Investimento/custos/retorno → campanhas; contactos/conversões → contactos. Filtros mantêm os mesmos objetos e valores; regresso ao Dashboard do módulo. Cartões de campanha/conteúdo/tarefa reutilizam ações existentes quando inequívocas. |
| Candidatos | O corpo do cartão abre o processo; entrevista e mudança de etapa mantêm alvos distintos. Arrastamento não deve abrir processos por acidente. |
| Reclamações | O corpo abre o processo original; seletor/mover continuam independentes. Sem alteração do prazo, etapa ou histórico pelo toque de consulta. |
| Tarefas | Ações operacionais existentes preservadas. Arquivar, reativar, aprovar ou concluir não são promovidos a ações implícitas do cartão. |
| Notificações | Corpo abre o assunto original; ler, confirmar conhecimento e resolver continuam comandos separados. As fontes e os contadores não são copiados. |
| Tabelas / secundários | Cartões com uma ação útil inequívoca reutilizam o destino existente. Cartões com várias ações não recebem um destino arbitrário. |

## Componentes e proteção

`workspace-shell-v4.js` concentra a extensão do alvo tátil e o regresso contextual; não cria controladores de negócio. As ações originais continuam acessíveis por teclado. Indicadores novos usam Enter/Espaço, foco visível e ação contextual. A ficha usa botões nativos em toda a superfície dos indicadores.

Não se interceptam campos, seletores, rótulos, links, texto selecionado ou ações secundárias. Movimento superior a 8 px, cancelamento do gesto ou pressão prolongada não abre o cartão. Cartões navegáveis aninhados não propagam uma segunda ativação. Não há `eval`, interpretação de comandos em texto ou novos formulários/tabelas.

Os destinos verificam o âmbito efetivo e/ou reutilizam os controladores existentes, incluindo as validações de domínio/servidor. A navegação não concede edição a quem só pode consultar. O regresso contextual é eliminado ao trocar perfil/permissões. A consulta não submete, aprova ou grava dados.

Ficheiros: [hr-master-v4.js](../hr-master-v4.js), [workspace-shell-v4.js](../workspace-shell-v4.js), [design-system-v4.css](../design-system-v4.css), [stock-core-v4.js](../stock-core-v4.js), [stock-ui-v4.js](../stock-ui-v4.js), [finance-ui-v4.js](../finance-ui-v4.js), [app.js](../app.js), [attention-ui-v4.js](../attention-ui-v4.js), [safe-actions-v4.js](../safe-actions-v4.js) e [tests/ux-workspaces-browser.py](../tests/ux-workspaces-browser.py).

## Validação

`npm test`, sintaxe e build locais executados; os logs privados foram preservados. O arranque do servidor/Chromium local foi impedido pelo sandbox. Não se repetiu a chamada de permissão bloqueante: os testes reais de navegador correm no GitHub Actions isolado, com dados sintéticos, seis perfis, três formatos e dois temas.

A suite UX verifica os cliques/toques reais do cartão de contrato, foco no campo original, ausência de gravação, regresso ao mesmo colaborador, editor documental canónico, navegação Stock/Marketing e preservação dos filtros. Os testes de Dashboard verificam o detalhe no período aplicado. As restantes suites de regressão continuam obrigatórias. Os resultados finais e o SHA estão registados abaixo.

O preview continua estático: persistência entre dispositivos, autenticação central e arquivo privado não são ativados por esta melhoria. Chromium emulado não equivale a validação num Android físico. Main e produção não são alteradas.

## Achados adicionais comprovados durante os testes

- A barra de Stock é reorganizada no frame seguinte ao render. O teste passou a aguardar o agrupamento e a verificar unicidade na barra, distinguindo-a dos novos atalhos contextuais para o mesmo destino.
- O arranque legado de notificações (`gs-enterprise.js`) inicializa `chatMessages` e `notificationPrefs` após 900 ms; o agente legado conclui a sua preparação aos 1200 ms. O teste aguarda ambos os sinais de prontidão, em vez de atribuir a diferença ao toque no indicador. A comparação mantém todos os dados de negócio; apenas o registo automático de acessos é excluído.
- A indicação de navegação dos quatro indicadores principais foi colocada numa célula reservada da grelha, evitando sobreposição com a nota do indicador.
- Aberturas, fechos e tarefas conduzem às etapas próprias; os resultados clínicos conduzem às estatísticas com o período original. A folha de caixa abre o histórico original pelo par clínica/data, sem criar outra ficha.

Os contadores que já mostram integralmente o detalhe ao lado, elementos sem destino autorizado e cartões com várias ações incompatíveis não recebem um destino arbitrário. Os comandos de guardar/aprovar/recusar/arquivar não são ativados pela superfície do cartão.

- Os atalhos do resumo foram verificados também no editor legado: utilizam a janela original quando aí são abertos e a página de trabalho quando partem dessa página.
- O encaminhamento do toque impede a propagação do evento original depois de executar o botão canónico, evitando uma segunda abertura por controladores delegados.
- O teste aplica explicitamente o intervalo sintético após a recarga usada para validar persistência RH e escolhe uma clínica com registos nesse intervalo. Os filtros do Dashboard continuam em memória durante a sessão; esta alteração não acrescenta persistência de preferências após recarga completa.

- As referências a pedidos usavam um controlador de criação que ignorava o ID recebido. Foram redirecionadas para a consulta original. O callback de atribuição de origem já existente não estava na lista segura e impedia a construção da ficha: foi registado explicitamente, mantendo os restantes comandos desconhecidos bloqueados.
- A ficha de pedido passa a apresentar campos desativados e a ocultar ações de edição quando `bookings` está recusado. A função de gravação também verifica essa permissão, para além do âmbito clínico existente. O teste verifica o número de utente original e a ausência do formulário de criação, além do caso negativo de gravação direta.

## Entrega verificada

- **Código:** `ba9deb0999251889cc9747bef859757158115e29`.
- **Preview READY protegido:** https://grupo-saude-v4-validacao-sintetica-nv5y6rw0m-grupo-saude.vercel.app
- **GitHub Actions:** [40368840169 — 42/42 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40368840169), incluindo regressão, PostgreSQL descartável e 40 suites Chromium. Apenas este ciclo do SHA final constitui a aprovação desta entrega; falhas e cancelamentos intermédios não foram apresentados como aprovação.
- **Suite UX atualizada:** 1022 verificações, zero falhas. São verificações, não uma contagem de funcionalidades distintas ou prova de cobertura exaustiva de todos os estados possíveis.

| Perfil | Verificações da suite UX | Falhas |
|---|---:|---:|
| Call Center | 66 | 0 |
| Médico | 54 | 0 |
| Técnico | 54 | 0 |
| Administrativo | 120 | 0 |
| Administração | 364 | 0 |
| CEO | 364 | 0 |

As diferenças decorrem das operações autorizadas a cada perfil. A suite percorreu computador, tablet e telemóvel, nos dois temas. Verificou o foco no contrato, formulário original, ausência de gravação ao consultar, regresso ao colaborador, contexto Stock/Marketing, catálogo aberto uma única vez, etapas operacionais e regresso com clínica/período, compatibilidade com a ficha antiga e pedidos existentes, incluindo o caso negativo de edição e gravação direta sem permissão. As restantes suites mantiveram os testes de API, permissões/simulação, documentos, operações, finanças, Stock, recrutamento, Chat, pesquisa e escrita.

Evidências: [matriz de testes](MATRIZ-NAVEGACAO-TESTES-20261026.csv), [resultados detalhados](NAVEGACAO-RESULTADOS-20261026.json), [42 jobs](NAVEGACAO-CI-20261026.json) e [verificação do preview](NAVEGACAO-PREVIEW-20261026.json).

| Área | Claro | Escuro |
|---|---|---|
| Contrato — Por definir e restantes atalhos da ficha | [Captura](evidence/navigation-20261026/ux-employee-summary-light.png) | [Captura](evidence/navigation-20261026/ux-employee-summary-dark.png) |
| Dashboard | [Captura](evidence/navigation-20261026/dashboard-light.png) | [Captura](evidence/navigation-20261026/dashboard-dark.png) |
| Stock | [Captura](evidence/navigation-20261026/ux-stock-light.png) | [Captura](evidence/navigation-20261026/ux-stock-dark.png) |
| Marketing | [Captura](evidence/navigation-20261026/ux-marketing-light.png) | [Captura](evidence/navigation-20261026/ux-marketing-dark.png) |

O deployment `dpl_ASjQbQrqyGvXD5dA33cywqU52k4N` está READY no projeto sintético separado. O acesso à página devolveu HTTP 200; o manifesto confirmou o SHA e nove ficheiros JS/CSS verificados correspondem exatamente ao pacote publicado. A proteção Vercel Authentication foi preservada; poderá ser necessário iniciar sessão na conta autorizada. O Chromium executou o mesmo código no ambiente isolado do GitHub Actions; não foi uma sessão de navegador remoto autenticado no Vercel nem uma validação num Android físico.

O pacote contém 103 assets estáticos, configuração de proteção e manifesto; exclui backend, ambientes, backups e relatórios. A revisão por padrões não encontrou credenciais no pacote. `/api/auth/session` continua a devolver 404: a autenticação central não foi ativada ou apresentada como operacional. Persistência entre dispositivos, arquivo privado e integrações externas continuam dependências separadas.

Main permaneceu em `84fba5a2d6d7afcb0723ca312f4e617acc22823d`; o projeto de produção manteve `updatedAt=1791725971672`. PR #13 em rascunho. Sem merge, force push, migrações reais, dados reais ou serviços pagos. O commit documental posterior guarda apenas estas evidências e não altera o código do preview.

Próximo passo: validar fisicamente os gestos e a navegação neste novo preview no tablet Android. Não há ativação de serviços reais nesta entrega.
