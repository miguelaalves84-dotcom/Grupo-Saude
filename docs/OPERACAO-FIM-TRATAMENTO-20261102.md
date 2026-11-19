# Utentes que terminam o tratamento amanhã — correção de 02/11/2026

Branch: `dev/v4-stabilization-20261017`. Base preservada: `923761e2`.

## Âmbito e auditoria

Apenas a fila de fim de tratamento foi alterada, reutilizando `workflowRows`, abertura integral, autorizações, revisão/CAS, históricos, `clinic_days` e API existentes. Pedidos de consulta, seguros, SGTD, faltas, profissionais e restantes processos continuam no fluxo canónico. Não há nova tabela, controlador, migração nem ligação externa.

## Interface

A fila passa a usar o padrão das duas filas de consultas: campo numérico **Novos utentes**, botão compacto **Adicionar linhas**, tabela, zero linhas vazias iniciais. Cada clique acrescenta exatamente a quantidade pedida (1–500) e repõe o contador em zero, impedindo duplicação por duplo clique. A gravação continua a ser feita por **GUARDAR ABERTURA**; campos inválidos não apagam o rascunho.

A tabela mantém nome, número de utente, conclusão prevista, estado e notas. Os históricos ficam recolhidos. A previsão é um campo de leitura.

## Datas, continuidade e decisões

- Novos registos: `createdAt` é a data/hora efetiva; `insertedDate` usa Europe/Lisbon, calculada a partir do contexto do servidor/domínio; `expectedDate` é `insertedDate + 1 dia de calendário`. Não utiliza dias úteis, calendário operacional ou a data selecionada no ecrã.
- `originalExpectedDate` preserva a previsão inicial. Ao transportar, editar ou classificar, não se recalcula. Dados legados e previsões já guardadas não são reescritos: ficam preservados, incluindo o histórico anterior.
- Por definir permanece ativo em todos os dias seguintes, por referência à linha original. Quando a previsão é anterior à data operacional consultada, aparece **Pendente desde DD/MM/AAAA** e destaque de atraso.
- Alta arquiva a linha com decisão, responsável e data/hora.
- Continua arquiva o original e permite uma **nova data de acompanhamento opcional**, separada em `followUpDate`. Essa data fica consultável no histórico, sem substituir a previsão original e sem criar automaticamente outra linha ou marcação. O acompanhamento mantém-se no registo arquivado; não se apresenta como nova sincronização ou nova decisão automática.
- O resumo de fecho mostra os pendentes e atalho de resolução. O bloqueio obrigatório existente mantém-se até à classificação. Dias novos não eliminam, copiam ou arquivam utentes por resolver.

## Segurança e integração futura

Mantêm-se os seis perfis, simulação sem privilégios herdados, clínicas autorizadas, revisões e idempotência. Alterações à previsão já guardada são rejeitadas no domínio/API; valores forjados em novos registos não substituem o cálculo efetuado pelo servidor.

A estrutura de origem/ID/clínica mantém a preparação futura para Clicloud, com chave externa única e validação humana a implementar quando houver integração autorizada. Não existem ligações, credenciais, importações ou decisões clínicas simuladas.

## Testes e limitações

Testes locais de domínio e regressão executados, incluindo datas de mês/ano/ano bissexto, ambos os lados das mudanças de hora, Lisboa já no dia seguinte a UTC, continuidade, decisões, datas imutáveis, histórico, concorrência/replay e seis perfis/clínicas. A nova suite Chromium testa operações reais com computador, tablet horizontal e telemóvel, claro/escuro. PostgreSQL usa apenas base descartável do CI.

Resultado efetivo: **47/47 jobs aprovados** no commit `addf6194338acf55a88c6958e32beb6706a080e1`. [Execução GitHub Actions](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41455031571). A emulação não substitui um tablet Android físico. O preview continua sintético, com dados apenas no navegador, sem persistência central, arquivo privado ou Clicloud ativos.


## Evidências finais

- `npm test` e build locais aprovados; 10 cenários dedicados ao fim de tratamento, incluindo múltiplas datas e as seis permissões.
- Suite Chromium específica: **558 verificações aprovadas, zero falhas**, nos seis perfis × dois temas × três formatos. Ações táteis executadas nos contextos de tablet/telemóvel. Não é validação em Android físico.
- PostgreSQL isolado aprovado: previsão calculada a partir do instante do servidor, tentativa de alteração recusada, consulta noutro dia por outro ator, decisão Continua com acompanhamento separado e exatamente uma linha original preservada.
- Todas as restantes suites de regressão passaram na mesma execução.
- [Capturas e resultados sintéticos](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41455031571/artifacts/13145569016), com retenção no Actions até 16/11/2026.

## Preview verificado

https://grupo-saude-v4-validacao-sintetica-gkvpf8tig-grupo-saude.vercel.app

Deployment `dpl_9D9p2GSWG4PBxZzYTGg7PCUbLbK1`, estado **READY**, target staging. Commit funcional publicado: **addf6194338acf55a88c6958e32beb6706a080e1**.

HTTP 200 confirmado na aplicação, `/api/version`, `app.js`, `operation-core-v4.js` e `design-system-v4.css`. O HTML/JS/CSS servido coincide exatamente com os ficheiros testados. O manifesto confirma fila versão 3, Europe/Lisbon, previsão imutável e serviços reais desativados.

Publicação estática por referências SHA, 108 ficheiros; sem backend, API executável, cron, segredos ou documentos privados. Proteção Vercel mantida; poderá exigir sessão autorizada. Main, produção, bases reais e configurações dos projetos preservadas; PR #13 em rascunho. Os dados do preview permanecem apenas no respetivo navegador e não são partilhados entre dispositivos/previews.
