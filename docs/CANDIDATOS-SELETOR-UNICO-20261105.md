# Candidatos — correção exclusiva da duplicação de seletores

Base: `2d93b6d1d0e5081bb65fc23175ad7d7f73c979ea`; branch `dev/v4-stabilization-20261017`; PR #13 em rascunho.

## Causa e alteração mínima

A regra `#hr[data-hr-context=candidates] .candidate-toolbar label` tem especificidade superior às regras antigas de `.candidate-mobile-picker` e `.candidate-stage-filter`. O seu `display:grid` vencia o `display:none`, tornando os dois campos visíveis simultaneamente.

Alterados apenas os seletores CSS destas regras de visibilidade, incluindo o contexto `.candidate-toolbar`. Nenhuma função JavaScript do programa, componente, evento, dado ou configuração foi alterado.

- Acima de 640 px: apenas «Etapa» visível; funil com as cinco colunas existentes.
- Até 640 px: apenas «Etapa apresentada» visível; o mesmo seletor móvel já existente controla a coluna apresentada e o filtro, sem um segundo campo visível.
- Filtro por clínica, pesquisa, cartões compactos e regras do funil preservados.
- Entrevistas, Agenda, documentos, notificações, históricos e permissões não foram modificados.

## Testes

- Reproduzida a falha no CSS anterior: o teste de cascata falha porque encontra dois seletores visíveis.
- `node tests/candidate-selector-visibility.cjs`: 10 casos de análise **estática** de especificidade e media queries, incluindo larguras 1440, 1280, 390, 640 e 641 px. As regras são independentes do tema; os casos etiquetados claro/escuro não equivalem a validação visual dos temas.
- O teste foi ligado à suite de runtime existente: `node tests/runtime.cjs`, **110 verificações aprovadas** com JavaScript e DOM simulado.
- `node tests/recruitment-workflow.cjs`: **9 grupos aprovados**, incluindo projeção de 100 candidaturas, permissões clínicas, filtros, compromissos e históricos existentes.
- `npm run build`: **120 assets estáticos**; sem backend, documentos ou segredos.
- `git diff --check`: aprovado.

Não executados: Chromium, capturas, inspeção de geometria/toque e confirmação visual em computador, tablet Android e telemóvel nos temas claro e escuro. Mantém-se o bloqueio da sandbox já identificado; não foi repetido o arranque do Chromium. O preview destina-se à validação manual.

## Segurança e entrega

Publicação apenas estática e sintética, num URL direto de deployment próprio. O domínio geral antigo não é substituído. PR #13 em rascunho; sem merge. Main, V3, produção, Neon, credenciais e dados existentes não são alterados. Nenhuma migração, seed, integração ou serviço real ativado. Persistência continua local por endereço de preview.
