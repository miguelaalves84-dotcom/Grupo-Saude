# Grupo Saúde V4 — modo claro aprovado e temas por utilizador

**Código:** `d2e962c8215374d545dfc5bbb22f3b0968dcf7be` · branch `dev/v4-stabilization-20261017` · PR #13 em rascunho.

**[Abrir preview protegido READY](https://grupo-saude-v4-validacao-sintetica-m3r1y7ebj-grupo-saude.vercel.app/)** · **[41/41 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40290531586)**.

## Diagnóstico

A versão `f5c312d3` foi revista pelo utilizador num tablet Android físico: melhorou, mas o desenho não foi aprovado como fiel à referência. O escuro por omissão e a paleta dourada também no claro eram divergências concretas. Esta entrega aplica a orientação mais recente: menu azul-marinho, área cinzento-claro, cartões brancos e gráficos azuis/verde-água. A imagem recebida contém uma interface escura; a geometria serve de referência e a instrução posterior determina a paleta clara. Não se afirma igualdade literal entre pixels de temas/marcas diferentes.

## Correções

| Área | Resultado |
|---|---|
| Tema inicial | claro quando não há escolha individual; escuro continua disponível |
| Preferência | mesma chave por utilizador na aplicação e páginas independentes; removido o fallback global que podia aplicar a escolha de outra pessoa |
| Superfícies | cinzento-claro #f2f5f9, cartões brancos, texto #152d48, texto secundário #4f6479 |
| Destaques | azul #2468c9 e verde-água #118c9b nos gráficos; ações azul #155dcc, realces #087d83 |
| Indicadores | valores 38 px em computador/tablet, cartões de 148 px, alternância azul/verde-água, contexto preservado |
| Gráficos | dois painéis de 284 px, títulos e rótulos maiores, séries distintas e dados originais preservados |
| Cabeçalho | saudação e controlos mais legíveis, mais espaço para pesquisa e clínica |
| Menu | azul-marinho mantido, realces verde-água, ícones/contadores e controlo de perfil originais |
| Componentes | cartões, campos e botões com dimensões/raios consistentes, aplicados transversalmente |
| Escuro | permanece disponível; texto e gráficos azuis/verde-água com contraste próprio |

Não foi criada uma folha paralela de correções: alteraram-se os tokens e regras dos componentes canónicos existentes. O logótipo oficial permaneceu inalterado. O foco/cursor, crescimento automático das caixas de texto, IDs, eventos e controladores existentes foram preservados.

Aplicação transversal: Dashboard, Clínicas, Operação Diária, Agenda, Chat, RH/Ficha 360°, ponto/férias/baixas/documentos, candidatos/entrevistas, Financeiro/Caixas, Stock/fornecedores/encomendas, Marketing, Reclamações, Tabelas, tarefas, alertas, relatórios e páginas secundárias.

## Testes e alcance

Comparação antes/depois com os mesmos dados sintéticos: baseline imutável `f5c312d32193c71f2bc0c20fa5d5d9adfddf611f`. A geometria da referência original mantém-se no ficheiro `tests/fixtures/approved-reference-1000089444.json`; as cores corrigidas são verificadas separadamente.

Incluem-se verificações de contraste mínimo 4,5:1 para texto principal, secundário e de destaque sobre superfícies claras/escuras; indicadores maiores; ausência de transbordo; filtros e valores canónicos iguais; tema nos seis perfis; alternância/recarregamento e continuidade até ao login. O teste de domínio confirma que um utilizador novo não herda a preferência global ou de outro utilizador.

São testes Chromium com viewports de tablet horizontal, computador e telemóvel, com toque emulado. Não substituem nova confirmação num tablet físico. A validação física anterior pertence apenas a `f5c312d3`, e foi registada como aprovação parcial/melhoria, não aprovação final.

## Segurança e limitações

Exclusivamente dados sintéticos. Sem alteração a regras de negócio, permissões, main, produção, bases reais ou serviços externos. Sem novos escritores, migrações ou serviços pagos. Preferências guardadas por utilizador neste navegador; não há sincronização de tema entre dispositivos sem persistência central autenticada.

Autenticação real, persistência UI/API entre dispositivos e arquivo privado continuam dependências separadas. Os testes PostgreSQL isolados não tornam o preview estático operacional. O preview permanece protegido.

## Comparação medida

| Elemento no tablet horizontal | f5c312d3 | Nova versão |
|---|---:|---:|
| Valores principais | 30 px | 38 px |
| Altura dos cartões principais | 136 px | 148 px |
| Altura dos gráficos | 276 px | 284 px |
| Topo dos indicadores | 117 px | 115 px |
| Cabeçalho | 80 px | 78 px |
| Menu lateral | 264 px | 264 px |
| Paleta dos gráficos no claro | dourado/azul-petróleo | azul/verde-água |

As tolerâncias geométricas anteriores foram mantidas: não se alargou o teste quando o primeiro cabeçalho empurrava os cartões para baixo. Corrigiu-se o espaçamento no componente, preservando os tamanhos de texto e controlos. A imagem original mantém-se privada, identificada pelo SHA-256 `af237e8f9eab8112ebd2db2ca458668d956110d975669640011a0a91f2de67e9`. Foi preparado também um HTML privado com a referência original, o novo claro, o novo escuro e a versão anterior lado a lado; não integra o site nem o Git público.

## Evidência visual

| Tema | Antes — f5c312d3 | Depois — d2e962c8 |
|---|---|---|
| Claro | [Tablet antes](evidence/light-design-20261026/u1-tablet-horizontal-light-f5c312d3.png) | [Tablet depois](evidence/light-design-20261026/u1-tablet-horizontal-light-reference-aligned.png) |
| Escuro | [Tablet antes](evidence/light-design-20261026/u1-tablet-horizontal-dark-f5c312d3.png) | [Tablet depois](evidence/light-design-20261026/u1-tablet-horizontal-dark-reference-aligned.png) |

| Módulo | Claro | Escuro |
|---|---|---|
| Agenda | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-light-agenda.png) | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-dark-agenda.png) |
| Recursos Humanos | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-light-hr.png) | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-dark-hr.png) |
| Dia Clínico | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-light-operation.png) | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-dark-operation.png) |
| Financeiro | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-light-finance.png) | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-dark-finance.png) |
| Stock | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-light-stock.png) | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-dark-stock.png) |
| Marketing | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-light-marketing.png) | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-dark-marketing.png) |
| Reclamações | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-light-complaints.png) | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-dark-complaints.png) |
| Tabelas | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-light-tables.png) | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-dark-tables.png) |
| Chat | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-light-chat.png) | [Captura](evidence/light-design-20261026/u1-tablet-horizontal-dark-chat.png) |

[Telemóvel claro](evidence/light-design-20261026/u1-mobile-light-reference-aligned.png) · [Telemóvel escuro](evidence/light-design-20261026/u1-mobile-dark-reference-aligned.png).

A suite de referência passou **382 verificações**, incluindo contraste, paletas, geometria, filtros, igualdade das contagens e comparação de pixels com a versão anterior. [Matriz CSV](MATRIZ-MODO-CLARO-20261026.csv) · [Resultados completos](MODO-CLARO-RESULTADOS-20261026.json).

Contrastes medidos texto/superfície: texto principal claro 13,99:1, secundário 6,12:1, primário 6,05:1 e verde-água de destaque 4,92:1; os mesmos pares no escuro excedem 8:1. Não se afirma uma certificação de acessibilidade integral com base nestes pares.

## Commits e preservação

- `2f9c9bd4`: paleta clara/escura, dimensões, preferência individual e testes/baseline f5c312d3.
- `d2e962c8`: ajuste do cabeçalho à proporção original, sem afrouxar tolerâncias.

Ficheiros de produto: `design-system-v4.css`, `workspace-shell-v4.js`, `visual-runtime-v4.js`. Sem alterações aos serviços/API, migrações, dados ou regras de negócio. O logo tem o mesmo objeto Git `ba094b7c8a6a4c73f887249c18b660a7b65cc31c`.

## Verificação transversal dos seis perfis

A suite partilhada passou **1 542 verificações** nos módulos autorizados, três formatos e dois temas. São verificações, não funcionalidades distintas. Os testes de ações/negócio são cobertos pelas suites próprias no ciclo completo.

| Perfil | Verificações aprovadas | Falhas |
|---|---:|---:|
| Call Center | 180 | 0 |
| Médico | 144 | 0 |
| Técnico | 144 | 0 |
| Administrativo | 234 | 0 |
| Administração | 420 | 0 |
| CEO | 420 | 0 |

[Matriz transversal](MATRIZ-MODO-CLARO-MODULOS-20261026.csv) · [Resultados por perfil/módulo](MODO-CLARO-MODULOS-20261026.json).

## Ciclo completo e preview

O ciclo `40290531586` terminou no SHA `d2e962c8215374d545dfc5bbb22f3b0968dcf7be` com **41/41 jobs aprovados**: 39 suites Chromium, regressão Node/sintaxe/build e PostgreSQL efémero. Inclui ações, permissões, pesquisas, texto/gestos e regressões dos módulos. [Resultados de cada job](MODO-CLARO-CI-20261026.json).

O ciclo inicial `40290059620` detetou o desvio vertical do cabeçalho. Foi corrigido no produto antes do ciclo final; o teste conservou as tolerâncias. Esse ciclo inicial não é apresentado como aprovação integral.

Deployment `dpl_CE5ADbdz7EwSV6rCWVHE271gXzLu`, target `staging`, projeto sintético existente e proteção Vercel mantida. HTTP autenticado 200 na raiz, manifesto, styles, CSS canónico, shell, runtime, logótipo, login e versão; igualdade dos ficheiros com o código testado. O manifesto confirma o SHA, tema inicial e execução CI. Endpoints de autenticação/Chat/Stock 404, conforme o site estático sem backend. [Verificações do preview](MODO-CLARO-PREVIEW-20261026.json).

O acesso protegido pode pedir sessão Vercel. Não se afirma uma execução Chromium contra o endereço remoto: os testes de navegador ocorreram no ambiente isolado do Actions e a publicação recebeu verificações HTTP autenticadas.

Os 24 PNG originais selecionados, matrizes e resultados foram preservados no Git. Os restantes artefactos do Actions têm retenção de 14 dias. Foi preservado e verificado um checkpoint privado anterior às alterações. O commit documental posterior não altera o pacote publicado nem o SHA aprovado pelos testes.
