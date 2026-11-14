# Grupo Saúde V4 — alinhamento com a referência aprovada

Referência recebida: `1000089444.jpg`, SHA-256 `af237e8f9eab8112ebd2db2ca458668d956110d975669640011a0a91f2de67e9`.
Comparação de código: `9e7aa489900125b69352db21b34735757bad3ddc` → `f5c312d32193c71f2bc0c20fa5d5d9adfddf611f`.
Branch: `dev/v4-stabilization-20261017`. PR #13 permanece em rascunho.

**[Abrir preview protegido READY](https://grupo-saude-v4-validacao-sintetica-80lm5v7nx-grupo-saude.vercel.app/)** · **[41/41 jobs aprovados — Actions 40250159556](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40250159556)**.

O endereço devolveu HTTP 200 através do acesso autenticado Vercel. Os ficheiros principais servidos são iguais aos do commit testado. Pode ser necessário iniciar sessão Vercel para abrir o preview protegido.

## Diferenças corrigidas

| Elemento | Alteração verificada |
|---|---|
| Menu | azul-marinho #001020, identidade oficial Grupo Saúde, ícones SVG, hierarquia, estado ativo, contadores; um grupo expandido |
| Perfil | rodapé no computador/tablet; controlo original de simulação preservado, regressa ao cabeçalho no telemóvel/menu recolhido |
| Cabeçalho | saudação real, calendário que abre filtros reais, clínica, pesquisa dos módulos autorizados, notificações e tema |
| Indicadores | quatro cartões compactos, ícone circular lateral, valores dourados e minigráficos derivados dos registos |
| Gráficos | duas colunas equivalentes, curva de atividade e barras por clínica; distribuição de pedidos e atividade recente abaixo |
| Densidade | tipografia, cartões, alturas, margens, alinhamento e uso da largura aproximados à referência |
| Restantes áreas | mesmos tokens e componentes em títulos, ações, filtros, formulários, tabelas, funis, calendários, modais e páginas secundárias |
| Chat | removida a paleta escura paralela; passa a usar as superfícies, texto, linhas e acentos partilhados |
| Tema | escuro por omissão apenas sem preferência anterior; escolhas individuais claro/escuro preservadas |
| Impressão | fundo branco, texto e estados legíveis; não imprime a estrutura de navegação |

Não foram copiados a marca Gestnutrição, fotografia, nomes, plano pago ou números ilustrativos da imagem. O logótipo oficial permanece byte a byte igual (objeto Git `ba094b7c8a6a4c73f887249c18b660a7b65cc31c`). Os gráficos mostram consultas, tratamentos, pedidos e tarefas disponíveis nas fontes existentes; não inventam receitas ou indicadores clínicos.

## Preservação e abrangência

Nenhum controlador de negócio, tabela, permissão ou registo foi substituído. Os seletores, eventos, agregações e onze indicadores anteriores continuam acessíveis. A reorganização move nós existentes em vez de duplicar controlos ou estado. A pesquisa global continua a navegar entre módulos autorizados; não constitui uma pesquisa central de dados pessoais.

Aplicação transversal: Dashboard; Clínicas; Dia Clínico/abertura/durante/fecho; Agenda; RH/Ficha 360°; ponto/férias/baixas/documentos; candidatos/entrevistas; Financeiro/Caixas/salários; Stock/encomendas/fornecedores; Marketing; Reclamações; Chat; tarefas/alertas/notificações; Tabelas/configuração; login/páginas secundárias.

## Comparação visual e limites

A imagem original é uma captura física Android de 1280×799. Mediram-se a área da aplicação, menu, cartões, gráficos, espaçamentos e cores, excluindo barras do dispositivo. A imagem original fica no checkpoint privado; só medições e hash foram versionados.

As capturas da aplicação são Chromium com viewport e toque emulados, não capturas de um tablet físico. Comparação antes/depois usa os mesmos dados sintéticos. A suite mede proporções normalizadas, cores exatas e alteração de pixels relativamente a `9e7aa489`. Não certifica igualdade literal de pixels com outra marca/dados.

| Medida no tablet | Referência | Nova composição |
|---|---:|---:|
| Menu / largura da aplicação | 20,95% | 20,63% |
| Altura dos indicadores | 137 px | 136 px |
| Altura do bloco de gráficos | 277 px | 276 px |
| Altura dos painéis inferiores | 251 px | 252 px |
| Fundo escuro | #000f1f | #000f1f |
| Acento dourado | #d5a131 | #d5a131 |

O topo dos cartões fica a 117 px em vez dos 80 px da referência: mantém o aviso sintético e os controlos adicionais de clínica/pesquisa. As tolerâncias geométricas justificam estas diferenças: largura do menu 2 pontos percentuais; posição vertical dos cartões 4,5; alturas 3,5–4; posição dos painéis inferiores 8. A estrutura de dois gráficos lado a lado é verificada separadamente. Estas tolerâncias não dispensam revisão humana.

## Regressões encontradas e corrigidas durante a validação

- Teste de tema assumia o antigo arranque claro. Passa a confirmar arranque escuro, alternância e persistência das duas escolhas após recarregar.
- Teste móvel do ponto tentava fechar o menu pelo botão do cabeçalho coberto pelo próprio menu. Passa a utilizar o botão visível «Fechar menu», verificando manutenção da página selecionada.
- Pesquisa e filtros do Dashboard passam a abrir o painel real pelo calendário antes de interagir; os filtros e resultados mantêm-se.

## Segurança e pendências

O preview é estático, protegido e exclusivamente sintético: sem API de negócio, escritores, credenciais ou ligação a produção. A compilação exclui backend, documentos, testes, relatórios e ficheiros de ambiente. Não se criaram recursos pagos nem se alteraram main, produção, domínios ou base de dados.

Continuam pendentes de validação separada: autenticação real, persistência central UI/API, arquivo privado com validação de ficheiros e recuperação/backups. PostgreSQL de teste não comprova estes serviços no preview. A aprovação visual e gestual desta versão num tablet Android físico cabe à validação seguinte.

## Capturas comparativas preservadas

| Tema | Antes: 9e7aa489 | Alinhamento com a referência |
|---|---|---|
| Escuro | [Tablet antes](evidence/reference-design-20261026/u1-tablet-horizontal-dark-9e7aa489.png) | [Tablet depois](evidence/reference-design-20261026/u1-tablet-horizontal-dark-reference-aligned.png) |
| Claro | [Tablet antes](evidence/reference-design-20261026/u1-tablet-horizontal-light-9e7aa489.png) | [Tablet depois](evidence/reference-design-20261026/u1-tablet-horizontal-light-reference-aligned.png) |

Outras capturas: [Agenda](evidence/reference-design-20261026/u1-tablet-horizontal-dark-agenda.png), [RH](evidence/reference-design-20261026/u1-tablet-horizontal-dark-hr.png), [Dia Clínico](evidence/reference-design-20261026/u1-tablet-horizontal-dark-operation.png), [Financeiro](evidence/reference-design-20261026/u1-tablet-horizontal-dark-finance.png), [Stock](evidence/reference-design-20261026/u1-tablet-horizontal-dark-stock.png), [Marketing](evidence/reference-design-20261026/u1-tablet-horizontal-dark-marketing.png), [Reclamações](evidence/reference-design-20261026/u1-tablet-horizontal-dark-complaints.png), [Tabelas](evidence/reference-design-20261026/u1-tablet-horizontal-dark-tables.png), [Chat](evidence/reference-design-20261026/u1-tablet-horizontal-dark-chat.png), [Telemóvel escuro](evidence/reference-design-20261026/u1-mobile-dark-reference-aligned.png), [Telemóvel claro](evidence/reference-design-20261026/u1-mobile-light-reference-aligned.png).

## Resultados dos testes específicos

A suite de referência passou **296 verificações**, com CEO/Administração, três formatos e dois temas. A suite transversal passou **1 542 verificações**: módulos autorizados, menu, tema, largura, modais e ausência de exceções; estes números representam verificações, não funcionalidades distintas.

| Perfil | Verificações transversais aprovadas | Falhas |
|---|---:|---:|
| Call Center | 180 | 0 |
| Médico | 144 | 0 |
| Técnico | 144 | 0 |
| Administrativo | 234 | 0 |
| Administração | 420 | 0 |
| CEO | 420 | 0 |

[Matriz da referência](MATRIZ-REFERENCIA-VISUAL-20261026.csv) · [Resultados geométricos/pixels](REFERENCIA-VISUAL-RESULTADOS-20261026.json) · [Matriz dos seis perfis](MATRIZ-REFERENCIA-MODULOS-20261026.csv) · [Resultados transversais](REFERENCIA-VISUAL-MODULOS-20261026.json).

Os testes específicos de cada módulo continuam nas suites de regressão; uma verificação de abertura/estilo não substitui a prova dos fluxos de negócio. Não se executaram ações sobre dados ou serviços reais.

## Commits

- `a39b2b50`: composição, tokens e componentes alinhados com a referência, baseline imutável e comparação Chromium.
- `f5c312d3`: adaptação dos testes aos controlos reais do novo menu/tema e contraste de impressão.

Ficheiros de produto alterados: `workspace-shell-v4.js`, `design-system-v4.css`, `visual-runtime-v4.js`, `chat-v4.css`, `agenda-v4.css`. Testes/baselines em `tests/`; workflow `.github/workflows/v4-stabilization.yml`. Sem alterações aos serviços de negócio, API, migrações ou base de dados.

## Ciclo completo e publicação

O ciclo `40250159556`, SHA `f5c312d32193c71f2bc0c20fa5d5d9adfddf611f`, terminou com **41/41 jobs aprovados**: 39 suites Chromium, regressão Node/sintaxe/build e PostgreSQL efémero isolado. Inclui perfis/simulação, permissões, operações dos módulos, pesquisas, escrita, gestos de candidatos, ponto, documentos, Caixas, Chat e comparação visual. [Estado de cada job](REFERENCIA-VISUAL-CI-20261026.json).

O primeiro ciclo `40249112700` teve dois testes falhados (tema/menu móvel), corrigidos no segundo commit. Não é apresentado como aprovação integral. A aprovação citada é exclusivamente a do novo ciclo completo.

Preview: deployment `dpl_AmLo742n2v2KnhWaBX4KTHP7jRsT`, target `staging`, projeto sintético `prj_X02eCkklCYULDAFkyKXbRHWETyT1`, READY, proteção Vercel mantida. O manifesto identifica o SHA e o run exatos. Testes HTTP autenticados: raiz, manifesto, CSS principal, shell, runtime, Chat, logótipo e login 200, com igualdade de conteúdo; endpoints de autenticação/Chat/Stock 404, conforme o preview estático sem backend. [Evidência do preview e salvaguardas](REFERENCIA-VISUAL-PREVIEW-20261026.json).

A execução Chromium foi feita em localhost isolado no Actions; a publicação recebeu verificações HTTP autenticadas. Não se afirma uma sessão Chromium remota nem uma validação física Android. O utilizador deve confirmar nesta nova versão a apresentação e os gestos do tablet.

O arquivo de recuperação anterior às alterações foi verificado e guardado fora do repositório. Os 15 PNG originais selecionados e os resultados JSON/CSV foram preservados no Git para não dependerem da expiração dos artefactos de CI (14 dias). O commit documental posterior não altera o pacote publicado nem o SHA testado.
