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
| Agenda | Semana inicial, barra contextual antes dos filtros, filtros adicionais recolhíveis, pesquisa única com Ctrl+F, blocos por pessoa com hora/título separados, grelha contínua e modal contido | CI aprovado; criação/edição/reagendamento preservados |
| Recursos Humanos / ficha | Hierarquia e espaçamento dos componentes existentes; secções recolhíveis e único editor mantidos | CI aprovado |
| Financeiro / Caixas | Campos, tabelas, indicadores e modais partilhados; folhas de estados locais eliminadas | CI aprovado |
| Dia Clínico / Operação | Cartões, formulários e tarefas usam os componentes comuns; equipa, cálculos e comandos intactos | CI aprovado |
| Dashboard | Cabeçalho, filtros, indicadores e gráfico usam os mesmos tokens | CI aprovado |
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

SHA, CI, capturas e URL verificados estão registados no fecho deste relatório.

## Revisão das primeiras capturas

Foram descarregadas e consultadas capturas reais de Financeiro, ficha RH, Agenda, Dashboard e tema escuro móvel da execução inicial. A revisão identificou excesso de altura no cabeçalho em tablet/móvel e na área de filtros da Agenda. Corrigidos na fundação: notificações como ícone com contador e nome acessível preservado, controlos de perfil organizados, aviso de desenvolvimento redundante no cabeçalho oculto apenas no breakpoint compacto (o aviso completo da demonstração continua visível), botões/links com áreas de toque e hierarquia do menu móvel reforçada.

A pesquisa genérica da Agenda não pesquisava os cartões desse calendário: foi retirada só dessa área, reutilizando a pesquisa funcional existente e encaminhando Ctrl+F para ela. As pesquisas dos restantes módulos foram preservadas. Filtros de agenda, clínica e estado continuam no mesmo formulário, numa secção adicional recolhível, aberta quando há filtros ativos. O teste funcional foi adaptado para abrir essa secção antes de escolher o estado, sem diminuir a validação.

A primeira execução válida teve 32 jobs aprovados e duas falhas: hierarquia tipográfica do menu móvel (corrigida) e comparação de controlos RH entre fases que reutilizavam o estado modificado pelos renderers da primeira fase. A comparação agora repõe o mesmo snapshot sintético antes de cada fase e grava diferenças de controlos, se existirem, para diagnóstico. Não foram modificados dados/regras do programa para fazer passar esse teste. A execução completa seguinte é obrigatória.

## Comparação concluída e auditor de secções recolhidas

No commit `c917e58`, a comparação antes/depois completou 36 contextos e 783 verificações sem falhas. A execução teve 33/34 jobs aprovados; o auditor individual deixou seis alertas «POR_CONFIRMAR» relativos a controlos dentro de «Mais filtros» recolhido na Agenda. A prova registou `rendered=false` e nenhum cruzamento visível; o auditor anterior só expandia secções RH para revisão.

A instrumentação foi estendida para abrir a secção real, localizar controlos pelo nome (evitando a escolha incorreta do primeiro `select` quando o texto muda após abertura), verificar novamente a geometria e recolher capturas. Depois, injeta uma sobreposição deliberada de dois botões visíveis para provar que o detetor continua a rejeitar defeitos reais. Não se desativou a falha para situações por confirmar e não se alterou o programa para contornar esse teste. As provas históricas dos 102 alertas foram mantidas.

## Entrega verificada

- **Código do preview:** `6744ab7ac25078e6d97491b71347d97042191cf3`.
- **[Abrir preview READY](https://grupo-saude-v4-validacao-sintetica-k7vjdej0j-grupo-saude.vercel.app)**, deployment `dpl_CZ5Z6MgGf1wbvyG6qorLz88Xjc6B`, projeto isolado, destino `staging`, proteção Vercel/SSO existente mantida.
- **[GitHub Actions 40089551013](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40089551013) — 34/34 jobs aprovados**, incluindo 32 suites Chromium, `npm test`/build e PostgreSQL 17 descartável.
- Build: 98 assets estáticos; fixtures antigos, documentos de teste, backend, credenciais e relatórios não entram no pacote público.
- Índice, manifesto, folha principal, novo design system, estilos/renderer Agenda, Financeiro, notificações, pesquisa, logótipo, shell e ficha RH comparados por HTTP protegido com o pacote testado: 12 ficheiros exatamente iguais. `/api/version` corresponde ao manifesto; `/api/agenda` e `/api/finance` continuam 404 no preview estático.
- CSP e proteção de acesso mantidas. Não houve navegação Chromium autenticada por SSO no deployment: o Chromium correu em loopback no CI, seguindo-se verificação do conteúdo servido.

### Comparação visual

36 contextos (seis perfis × três viewports × dois temas), **783 verificações aprovadas, zero falhas**. Os mesmos dados sintéticos e os mesmos controlos foram comparados entre estilos; a diferença de pixels é intencional. Capturas foram efetivamente geradas, não mockups simulados.

| Perfil | Verificações aprovadas | Falhas |
|---|---:|---:|
| Call Center | 93 | 0 |
| Médico | 72 | 0 |
| Técnico | 72 | 0 |
| Administrativo | 144 | 0 |
| Administração | 198 | 0 |
| CEO | 204 | 0 |
| **Total** | **783** | **0** |

Cobertura de composição por módulo, nos contextos em que o acesso estava autorizado:

| Área | Contextos com comparação antes/depois |
|---|---:|
| Conta corrente | 36 |
| Dia Clínico | 24 |
| Ficha do colaborador | 36 |
| Meu RH | 6 |
| Livro de Ponto | 6 |
| Pedidos | 4 |
| Stock | 6 |
| Chat | 6 |
| Agenda | 18 |
| Caixas | 18 |
| Reclamações | 3 |
| Dashboard | 12 |
| RH | 12 |
| Tabelas | 2 |
| Marketing | 2 |
| Tarefas | 2 |
| Clínicas | 2 |
| Auditoria | 2 |
| Relatórios | 2 |

As áreas prioritárias foram revistas repetidamente; os restantes módulos têm capturas por amostragem, além da travessia funcional geral. Isto não certifica todas as combinações de dados ou todos os formulários por inspeção humana.

### Auditoria funcional e de geometria

- Auditoria geral: **4 548 verificações aprovadas, zero falhas, 180 não testáveis** no ambiente demonstrativo.
- Revisão individual: 250 candidatos geométricos revistos, zero falhas visíveis confirmadas e zero itens por confirmar; 74 secções RH expandidas e seis revisões dos filtros progressivos.
- Os seis controlos negativos de sobreposição em secções progressivas foram detetados. A suite de pintura/recorte manteve também 12 controlos negativos, com zero interseções visíveis e dez interseções fora da zona pintada.
- Simulação CEO, permissões, multiclínica, criação/edição, documentos, operação diária e restantes regressões mantêm as suites existentes. A comparação de CSS não substitui testes funcionais ou API.
- Não somar estes números como funcionalidades independentes: existem verificações sobrepostas.

### Capturas e relatórios para consulta

Retenção dos artefactos GitHub Actions até **07/11/2026**:

- [profile-audit-browser](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40089551013/artifacts/12558831298) · 48.6 MB.
- [finance-cash-browser](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40089551013/artifacts/12558696604) · 3.3 MB.
- [audit-complete-browser](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40089551013/artifacts/12558641876) · 63.1 MB.
- [global-layout-browser](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40089551013/artifacts/12558571122) · 2.4 MB.
- [audit-expanded-browser](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40089551013/artifacts/12558482036) · 6.2 MB.
- [agenda-rh-browser](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40089551013/artifacts/12558472277) · 8.5 MB.
- [design-system-browser](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40089551013/artifacts/12558199390) · 37.8 MB.

Foram consultadas capturas reais de Agenda, Dashboard, Financeiro, ficha RH, Dia Clínico e tema escuro móvel. O refinamento do cabeçalho e dos filtros resulta dessa revisão. Os ficheiros originais dos mockups aprovados continuam indisponíveis nesta sessão; a referência seguida foi a descrição aprovada no PR.

## Estado por bloco e limitações

1. **Fundação visual comum:** implementada e aplicada globalmente, sem uma nova camada de overrides sobre as anteriores.
2. **Agenda:** apresentação semanal, filtros progressivos e pesquisa única implementados; criação, edição, reagendamento, cancelamento e permissões existentes preservados.
3. **RH/ficha, Financeiro/Caixas, Dia Clínico e Dashboard:** recebem os componentes, cores, tipografia, campos, cartões e modais comuns, com regressões aprovadas. A composição específica de subáreas complexas, como a barra de ferramentas contextual da ficha, não foi toda redesenhada nesta entrega.
4. **Restantes módulos:** fundação comum aplicada e regressões executadas; acabamentos de composição podem continuar em blocos de validação. Não se declara toda a V4 definitivamente redesenhada nem equivalência exata às imagens ausentes.
5. **Infraestrutura e negócio:** continuam as limitações anteriores. Autenticação/persistência central e bloqueios P0 não foram ativados ou resolvidos por CSS. As novas fórmulas trimestrais continuam preliminares; nenhuma regra, pagamento, escritor ou serviço externo foi ativado.

### Commits

- `a7b2a70`: fundação, Agenda, layouts e evidência visual.
- `011d0e5`: correção de quoting YAML para instalar a ferramenta de comparação; a primeira execução inválida não foi considerada teste aprovado.
- `c917e58`: cabeçalho compacto, hierarquia móvel, filtros recolhíveis e isolamento dos snapshots comparados.
- `6744ab7`: instrumentação dos filtros progressivos, localização correta dos controlos e controlos negativos; fonte da entrega aprovada.
- Um eventual commit documental posterior não muda o código servido pelo preview.

Main mantém `84fba5a2d6d7afcb0723ca312f4e617acc22823d`; projeto de produção mantém `updatedAt=1791725971672`. PR #13 continua em rascunho. Só foram alterados apresentação, pesquisa da Agenda, testes e documentação; nenhum ficheiro de domínio, API, migração ou dados foi modificado.
