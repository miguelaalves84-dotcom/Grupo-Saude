# Três listas da abertura — uniformização e continuidade

Branch `dev/v4-stabilization-20261017`, base `7f99c12f`. Apenas listas de fim de tratamento, avaliação e confirmação e respetivos resumos/históricos foram alterados.

## Diagnóstico e reutilização

As consultas geravam rascunhos ao alterar a quantidade, enquanto o fim de tratamento já exigia Adicionar linhas. A consulta de linhas ativas também incluía conclusões criadas no dia atual. Foram removidas essas diferenças, preservando `pendingRows`, `workflowRows`, `clinic_days`, autorizações, revisões, regras de fecho, autores e históricos. Não existem novas tabelas ou listas paralelas.

## Comportamento

- As três secções usam o mesmo componente de quantidade + botão compacto **Adicionar linhas**, tabela, contadores e histórico recolhido. Escrever um número não cria linhas. Zero é o valor inicial e não produz linhas vazias; acrescentar exige ação explícita.
- A abertura mantém uma única ação **GUARDAR ABERTURA**, que grava simultaneamente as listas e os restantes dados existentes. Valores introduzidos são mantidos quando a validação falha.
- Avaliações mantêm número de utente e visto; confirmações mantêm também a data de consulta. O visto só retira a linha da lista ativa depois de guardar. A linha completa permanece no histórico, com responsável e data/hora.
- Correções de vistos continuam disponíveis no histórico, com nova gravação e auditoria. Reabrir reutiliza a mesma linha; não cria outra.
- Durante o dia, cada lista de consultas tem uma única ação **Guardar lista**, sem botões repetidos por linha. A gravação em lote reutiliza as regras `rowtask` e a transação/CAS existentes. Replay do mesmo pedido não repete conclusões nem auditoria.
- Fim de tratamento mantém Por definir/Alta/Continua, previsão original protegida, Europe/Lisbon + um dia de calendário e acompanhamento opcional separado. Nenhuma regra de decisão ou data foi alterada nesta uniformização.
- Pendentes anteriores são referenciados no dia de origem, não copiados. As consultas apresentam **Pendente desde DD/MM/AAAA** com a criação original e, quando aplicável, conservam a data da consulta. Fim de tratamento mantém o aviso pela previsão original. Há distinção visual entre novos, anteriores e atrasados.
- Os contadores são derivados das mesmas linhas: novos pendentes, pendentes anteriores, concluídos no histórico e total pendente. Não são contadores independentes preenchidos manualmente.
- O fecho mostra contagens para cada lista e atalhos de consulta/resolução, preservando clínica e data. Bloqueios existentes mantêm-se; não foi criada dispensa de tarefas obrigatórias. Dias históricos já fechados que tenham linhas por resolver continuam a transportá-las sem apagar dados.

## Preservação e segurança

A criação guarda data operacional original e identificação/data/hora efetivas. Confirmações mantêm a previsão original mesmo quando existe correção explícita posterior à data de consulta; o histórico conserva antes/depois. Concluir uma linha de um dia anterior atualiza o estado da tarefa de origem e do dia atual, sem mudar o fecho histórico nem as estatísticas clínicas.

A API mantém o acesso ativo e disponibiliza também o arquivo e contagens por clínica. Mutação requer `clinicTasks`, clínica autorizada, revisões válidas e, em lote, identificador de operação. Não aceita linhas futuras/de outra clínica nem conflitos parciais: uma falha impede a gravação de todas as alterações do lote. Não há alterações em Finanças, equipa/capacidades, seguros, SGTD, faltas, Clicloud ou serviços reais.

As migrações legadas de contadores anteriores mantêm-se para não perder registos recuperáveis; não são utilizadas para gerar novas linhas em aberturas novas.

## Validação

Testes locais de sintaxe/domínio/regressão e build executados. 11 cenários dedicados às três listas, com mês/ano, fecho histórico, arquivo, reabertura, idempotência, rollback integral, datas originais, contadores e seis perfis. A suite Chromium usa operações reais nos seis perfis, claro/escuro, computador, tablet horizontal e telemóvel, durante vários dias de novembro/dezembro/janeiro. PostgreSQL isolado exercita o lote e o arquivo entre utilizadores, incluindo falha atómica e replay.

Os resultados efetivos e o novo preview serão registados após o Actions. Chromium tátil emulado não equivale a Android físico. O preview é sintético e não tem persistência central, arquivo privado ou integração Clicloud ativos.
