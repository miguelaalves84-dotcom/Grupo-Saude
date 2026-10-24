# Redesign visual — blocos de 24/10/2026

Branch exclusiva: `dev/v4-stabilization-20261017`; base reconciliada `7303684`. Referência: [comentário aprovado do PR #13](https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6383000337).

Os ficheiros dos mockups não estavam acessíveis nesta sessão. Foi seguida a descrição aprovada no comentário: branco, azul-petróleo/turquesa, cores suaves, cabeçalho compacto, navegação lateral, indicadores discretos, campos legíveis e modais contidos. Não se afirma correspondência por pixels aos mockups nem se copiaram assets Setmore.

## Inventário e consolidação

| Origem | Problema | Destino canónico / decisão |
|---|---|---|
| `styles.css`, fundação inicial | Cores, botões, formulários, cartões e navegação concentrados numa linha e posteriormente redefinidos | `design-system-v4.css` com tokens e componentes partilhados |
| Bloco «Superfícies e componentes partilhados» | Segunda definição de superfícies, cabeçalho, cards e breakpoints | Consolidado; permanecem os estados de navegação e a adaptação a 760 px |
| «Global audit», «Header actions», «Dialogs» e «VIS-EXPANDED» | Redefinições sucessivas dos mesmos componentes e proteções de scroll | Consolidado sem retirar o scroll do corpo do modal, o botão Fechar ou a adaptação do cabeçalho |
| `agenda-v4.css` | Grelhas e breakpoints repetidos, cores locais fora dos tokens | Folha específica única: calendário, controlos e blocos por pessoa |
| `finance-v4.css` | Estado vermelho definido duas vezes fora da paleta global | Apenas layout financeiro; estados usam o componente global |
| Calendários, tarefas, funis, histórico, impressão, logótipo e fichas | Layouts específicos e dependências válidas | Preservados em `styles.css`; paleta dos calendários passa a respeitar ambos os temas |

Não se apagaram funcionalidades ou controladores. A extração foi feita por blocos identificados, preservando os layouts dos módulos e as proteções de acessibilidade. Não se adicionou uma folha de overrides por cima das anteriores: as definições partilhadas antigas foram retiradas de `styles.css`, que importa a fundação única antes dos layouts específicos.

## Componentes reutilizáveis

`design-system-v4.css` define:

- Tokens: superfície, canvas, texto, borda, marca, estados, espaçamento, raios, sombras, largura do menu e aliases de compatibilidade (`--bg`, `--brand`, `--card`, `--border`, `--text`).
- Componentes existentes: `.card`, `.cards`, `.metric`, `.page-head`, `.actions`, `.form-grid`, `.table-wrap`, `.pill`, `.notice`, botões, campos, fieldsets, modal, menu, notificações, funis, chat e gráficos.
- Padrões reutilizáveis: `.gs-toolbar` e `.gs-filter-grid`, sem criar novos controladores, cadastros, estado ou regras de negócio.
- Foco visível, controlos de toque, contraste por tema, redução de movimento e scroll contido.

## Checklist de aplicação

| Área | Alteração desta entrega | Estado de validação |
|---|---|---|
| Agenda | Semana inicial, barra contextual antes dos filtros, filtros adicionais recolhíveis, pesquisa única com Ctrl+F, blocos por pessoa com hora/título separados, grelha contínua e modal contido | A executar no Chromium; criação/edição/reagendamento preservados |
| Recursos Humanos / ficha | Hierarquia e espaçamento dos componentes existentes; secções recolhíveis e único editor mantidos | A executar |
| Financeiro / Caixas | Campos, tabelas, indicadores e modais partilhados; folhas de estados locais eliminadas | A executar |
| Dia Clínico / Operação | Cartões, formulários e tarefas usam os componentes comuns; equipa, cálculos e comandos intactos | A executar |
| Dashboard | Cabeçalho, filtros, indicadores e gráfico usam os mesmos tokens | A executar |
| Gestão, Clínicas, Tabelas, Stock, Marketing, Reclamações, Tarefas, Chat, Meu RH e Livro de Ponto | Base visual comum aplicada; layouts próprios, permissões e ações preservados | Regressão e capturas por amostragem visual de módulos; não declarar todas as subáreas revistas manualmente |

O primeiro bloco consolida a fundação e a Agenda; os restantes módulos recebem já a mesma linguagem dos componentes. Refinamentos de composição próprios de cada subárea serão identificados pela validação e tratados em blocos, sem reconstruir o programa.

## Testes e evidências

- Testes automáticos existentes e build local executados antes da sincronização; resultados definitivos de navegador só após GitHub Actions.
- Suite adicional `tests/design-system-browser.py`: seis perfis × três viewports × dois temas, com capturas antes/depois, controlos/valores/estados de permissão comparados e verificação de ausência de overflow global.
- A referência antes é o **CSS versionado de `7303684` aplicado ao mesmo DOM funcional e aos mesmos dados sintéticos**, não uma reprodução integral de um deployment antigo. Os fixtures ficam exclusivamente em `tests/fixtures/design-baseline-7303684`, com SHA-256 e excluídos do build público.
- A diferença de pixels serve para demonstrar a alteração visual e facilitar revisão humana, não para exigir igualdade ao design anterior. Mudança de componente RGB superior a 12, fração mínima de 0,1% do viewport, tolera pequenas diferenças de rasterização.
- As suites funcionais existentes continuam a testar operações, documentos, permissões, simulação CEO, multiclínica, API e PostgreSQL isolado. A nova suite visual não substitui esses testes.

## Preservação e segurança

Antes da reconciliação local foi guardado e verificado um backup privado de 359 ficheiros, mais patches staged/unstaged. SHA-256 do arquivo: `3448d910734e35604a34503e6936e19ff51705c00b7d28334bae763b725595e8`. A árvore local foi depois comparada byte a byte com a versão remota e ficou limpa em `7303684`, sem reset nem descarte de trabalho.

Sem alterações a regras de negócio, permissões, backend, persistência, dados ou históricos. Nenhuma migração, serviço real, publicação em produção ou merge. Mantêm-se as limitações de persistência local e as novas fórmulas de bónus apenas preliminares da entrega anterior.

SHA final, CI, capturas e URL READY serão registados depois de verificados.

## Revisão das primeiras capturas

Foram descarregadas e consultadas capturas reais de Financeiro, ficha RH, Agenda, Dashboard e tema escuro móvel da execução inicial. A revisão identificou excesso de altura no cabeçalho em tablet/móvel e na área de filtros da Agenda. Corrigidos na fundação: notificações como ícone com contador e nome acessível preservado, controlos de perfil organizados, aviso de desenvolvimento redundante no cabeçalho oculto apenas no breakpoint compacto (o aviso completo da demonstração continua visível), botões/links com áreas de toque e hierarquia do menu móvel reforçada.

A pesquisa genérica da Agenda não pesquisava os cartões desse calendário: foi retirada só dessa área, reutilizando a pesquisa funcional existente e encaminhando Ctrl+F para ela. As pesquisas dos restantes módulos foram preservadas. Filtros de agenda, clínica e estado continuam no mesmo formulário, numa secção adicional recolhível, aberta quando há filtros ativos. O teste funcional foi adaptado para abrir essa secção antes de escolher o estado, sem diminuir a validação.

A primeira execução válida teve 32 jobs aprovados e duas falhas: hierarquia tipográfica do menu móvel (corrigida) e comparação de controlos RH entre fases que reutilizavam o estado modificado pelos renderers da primeira fase. A comparação agora repõe o mesmo snapshot sintético antes de cada fase e grava diferenças de controlos, se existirem, para diagnóstico. Não foram modificados dados/regras do programa para fazer passar esse teste. A execução completa seguinte é obrigatória.
