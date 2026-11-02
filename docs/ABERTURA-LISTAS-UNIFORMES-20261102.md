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

Resultado efetivo: **48/48 jobs aprovados**, no commit `f20ccdc98de9ee5705843e8a2d0f5647fe4d0247`. [GitHub Actions](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41473864517). Chromium tátil emulado não equivale a Android físico. O preview é sintético e não tem persistência central, arquivo privado ou integração Clicloud ativos.


## Evidências finais

- Nova suite Chromium: **972 verificações aprovadas, zero falhas**, com seis perfis, claro/escuro, computador, tablet horizontal 1280×800 e telemóvel. Usa toque nos contextos táteis.
- Fluxo exercitado em 30/11, 02/12, 31/12 e 02/01: criação explícita nas três listas, gravação integral, arquivo, correção de visto, contadores, histórico, alertas, resumo/atalhos de fecho, preservação de IDs e recarregamento. Não produz linhas ao escrever a quantidade.
- `npm test`, build, 11 cenários dedicados de domínio e todas as regressões existentes aprovados.
- PostgreSQL descartável aprovado: lote válido entre dois utilizadores, arquivo consultável, rejeição integral de lote inválido sem auditoria parcial, repetição sem duplicação e correção auditada no dia seguinte. Não equivale a persistência central ativa no preview.
- [Capturas e resultados da nova suite](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41473864517/artifacts/13156566797), com retenção até 16/11/2026. A validação num Android físico continua a cargo da revisão do utilizador.

## Publicação verificada

https://grupo-saude-v4-validacao-sintetica-92hdhtjgj-grupo-saude.vercel.app

Código funcional: `f20ccdc98de9ee5705843e8a2d0f5647fe4d0247`. Deployment `dpl_2WzPKJ5VcUPqB83PAwqYm7q8n8jR`, **READY**, target staging, projeto sintético existente.

HTTP 200 na aplicação, `/api/version`, `app.js`, `operation-core-v4.js` e `design-system-v4.css`. HTML/JS/CSS servidos iguais aos ficheiros testados. O manifesto identifica a versão 4 das listas, adição explícita e arquivo de conclusões, com backend, persistência central, emails e Clicloud desativados.

Pacote estático por referências SHA, 108 ficheiros, sem backend, API executável, cron, credenciais ou documentos privados. Proteção Vercel mantida; poderá pedir sessão autorizada. Main, produção e configurações dos projetos preservadas; PR #13 em rascunho. Os dados sintéticos permanecem no navegador de cada preview, sem sincronização entre dispositivos.
