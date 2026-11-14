# Consolidação objetiva dos dashboards — 04/11/2026

Base: `6baaf44353567a9887bd0b90905afb60d999f1cc`; branch `dev/v4-stabilization-20261017`; PR #13 em rascunho.

## Revisão e alterações

Os seis dashboards de área reutilizam `module-dashboards-core-v4.js` e `module-dashboards-ui-v4.js`. O Dashboard Geral reutiliza a projeção dos indicadores por assunto através de `executive()`. Não foram alteradas fontes, cálculos, permissões ou dados.

- A Área pessoal dispersava sete indicadores por assuntos sobrepostos. Foram agrupados em pedidos, documentos e assiduidade/ocorrências, preservando todos os indicadores e destinos.
- O seletor de clínica da Área pessoal não acrescentava utilidade quando existia apenas uma clínica autorizada. Nesse caso deixa de ser apresentado; permanece disponível no contexto multiclínica.
- Os cartões globais de Administração do sistema apareciam depois dos filtros, sugerindo que estes se aplicavam aos serviços. Foram colocados antes dos filtros, com o âmbito de utilizadores/auditoria identificado. Os filtros permanecem porque afetam legitimamente os indicadores de contas e auditoria.
- Mantêm-se exatamente seis estados de serviço «Inativo» e a versão/testes «Não verificado»; não se inferem serviços operacionais a partir de configurações.
- A grelha partilhada passa a limitar-se a quatro colunas em ecrãs largos, adapta-se ao espaço efetivo por container e apresenta uma coluna em telemóveis estreitos. Foram uniformizados bordos, ações e foco de teclado.
- Suprimiram-se apenas o subtítulo genérico repetitivo e a mensagem de ausência de séries na Área pessoal/Administração, onde não existe uma comparação útil. Estados indisponíveis dos indicadores foram preservados.

Não foram criados controladores, notificações, fórmulas ou tabelas paralelas. O cabeçalho existente já contém as correções de largura/títulos e foi preservado. CEO e Administração continuam exclusivos no Dashboard Geral; a simulação continua a usar o ator selecionado.

## Validação efetivamente executada

Aprovados nesta intervenção:

- `node tests/module-dashboards.cjs`: seis perfis, âmbito clínico/individual, fontes indisponíveis, projeções imutáveis, contexto financeiro, cálculos operacionais canónicos e contratos/escala existentes.
- `node tests/syntax.cjs`: 275 ficheiros JavaScript.
- `node tests/text-editing.cjs`: binding único, composição e preservação da escrita.
- `npm run build`: 119 assets estáticos; backend, segredos e documentos excluídos.
- `node tests/module-dashboards-ui.cjs`: renderização com projeções sintéticas; agrupamento, preservação dos sete IDs pessoais, seleção mono/multiclínica, sete estados globais inalterados, âmbito dos filtros e entradas imutáveis.
- Compilação Python da suite de navegador e `git diff --check`.

Não executados: suites Chromium, capturas e validação de geometria/gestos em três ecrãs e dois temas. O Chromium do sistema falhou com `setsockopt: Operation not permitted`; as solicitações de permissão subsequentes foram interrompidas. Por instrução do utilizador, não se volta a iniciar Chromium neste ambiente. A suite existente foi preparada com deteção do executável instalado e novas asserções, mas isso não equivale a testes aprovados.

## Limites e entrega

A qualidade visual e a navegação devem ser confirmadas manualmente no tablet e posteriormente num executor Chromium autorizado. A publicação de um preview é uma operação separada; não se declara READY sem confirmação do deployment e acesso ao endereço.

P0.1 continua bloqueada. Não foram alterados Neon, credenciais, integrações, V3, main ou produção; não foram executados seeds ou migrações. Não foram ativados autenticação, emails ou arquivo privado. Persistência neste ambiente continua demonstrativa/local e não constitui persistência autenticada entre dispositivos.
