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

Ficheiros: `hr-master-v4.js`, `workspace-shell-v4.js`, `design-system-v4.css`, `stock-core-v4.js`, `stock-ui-v4.js`, `finance-ui-v4.js` e `tests/ux-workspaces-browser.py`.

## Validação

`npm test`, sintaxe e build locais executados; os logs privados foram preservados. O arranque do servidor/Chromium local foi impedido pelo sandbox. Não se repetiu a chamada de permissão bloqueante: os testes reais de navegador correm no GitHub Actions isolado, com dados sintéticos, seis perfis, três formatos e dois temas.

A suite UX verifica os cliques/toques reais do cartão de contrato, foco no campo original, ausência de gravação, regresso ao mesmo colaborador, editor documental canónico, navegação Stock/Marketing e preservação dos filtros. Os testes de Dashboard verificam o detalhe no período aplicado. As restantes suites de regressão continuam obrigatórias. Resultados finais e SHA serão registados após conclusão efetiva do ciclo.

O preview continua estático: persistência entre dispositivos, autenticação central e arquivo privado não são ativados por esta melhoria. Chromium emulado não equivale a validação num Android físico. Main e produção não são alteradas.
