# Renovação visual transversal — 25/10/2026

Código da aplicação: **`d3564947d309087bc2a762b729cbd599caf55fc7`**. Branch `dev/v4-stabilization-20261017`; PR #13 em rascunho. Main e produção preservadas; dados exclusivamente sintéticos.

[Preview protegido READY](https://grupo-saude-v4-validacao-sintetica-osd13fujx-grupo-saude.vercel.app) · [GitHub Actions 40187926653](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40187926653) · [Matriz completa CSV](MATRIZ-RENOVACAO-VISUAL-20261025.csv) · [Evidências JSON](RENOVACAO-VISUAL-EVIDENCIAS-20261025.json).

## Alterações aplicadas

- Renovação do sistema existente em `design-system-v4.css`: menu azul-marinho, fundo claro, cartões brancos arredondados, indicadores azuis/verde-água, tipografia, espaços e estados de foco consistentes; versão escura em todos os componentes partilhados. Sem segunda folha de tema concorrente.
- `workspace-shell-v4.js`: mantém ações canónicas, menu recolhível e um grupo expandido. Acrescenta pesquisa de módulos autorizados e seletor contextual que reutiliza opções/eventos do filtro de clínica existente. Sem estado clínico paralelo.
- A pesquisa do cabeçalho permite navegar entre módulos autorizados. Não é um índice central de dados pessoais. As pesquisas de registos continuam nos controladores de cada área. Áreas sem filtro de clínica apresentam essa indicação, desativada.
- `visual-runtime-v4.js`, carregado uma vez em cada uma das seis páginas HTML: textareas com uma linha inicial, crescimento/redução automáticos e sem escrita no valor, seleção ou foco. Recalcula largura em modais, secções e alterações responsivas. Preserva inputs nativos de números, datas, emails e seletores.
- Tema selecionável também nas páginas secundárias: login, área autenticada, financeiro, recrutamento e reclamações. Logótipo original preservado em `official-logo-v4.svg`, sem redesenho, filtro ou alteração de proporções. Blob Git original: `ba094b7c8a6a4c73f887249c18b660a7b65cc31c`.
- Chat: assunto opcional nas conversas individuais; nome do interlocutor como identificação, diferente para cada participante, também nas notificações e conversas históricas sem título. Grupos continuam a exigir nome. Mantém respostas, emojis, ✓ Feito, participantes autorizados, histórico e validade exata dos anexos.
- Mensagens longas podem crescer sem barra interna no textarea; o painel da conversa permite alcançar o envio. Mantém duas colunas no tablet e uma conversa de cada vez no telemóvel.
- Removido apenas o botão redundante de Avaliação de Desempenho do template RH. Permanece o acesso canónico `performanceQuick`, com o mesmo controlador e autorização. Nenhuma avaliação, documento ou associação foi eliminada.
- Corrigida a posição de scroll herdada na mudança de página; atualizações na mesma página preservam a posição. Cabeçalho compactado após revisão das capturas.

## Âmbito e funcionalidades preservadas

O estilo canónico é importado por `styles.css`, utilizado pelas seis páginas de entrada. A nova suite percorre 19 módulos autorizados em 36 contextos: seis perfis × computador/tablet horizontal/telemóvel × claro/escuro. As suites existentes continuam a testar operações e permissões, além da apresentação.

| Área | Cobertura de regressão mantida |
|---|---|
| Dashboard e relatórios | agregações, clínicas, filtros, pesquisa e indicadores |
| Clínicas/documentos | configuração, consulta documental, permissões e alertas |
| Dia Clínico/tarefas | abertura, equipa, pendências, durante o dia, fecho e histórico |
| Agenda/calendários | pesquisa, filtros, criação/edição/reagendamento e multiclínica |
| Chat | seis perfis, grupos, toque, escrita, respostas, reações, contadores e anexos |
| RH/Ficha 360°/área pessoal | navegação, dados, documentos, permissões e formulários |
| Férias, baixas e ponto | pedidos, regras existentes, GPS, aprovação e assiduidade |
| Candidatos/entrevistas | cinco colunas, gestos, transições, fichas, notas e agendamento |
| Financeiro/Caixas/salários | filtros, comprovativos, conferência, exportação e autorizações |
| Stock/fornecedores/encomendas | escopo, movimentos, receções e gestão reservada |
| Marketing | filtros, propostas internas, campanhas e estados existentes |
| Reclamações | funil, anexos, responsáveis, histórico e prazo operacional |
| Tabelas/segurança/auditoria/alertas | destinos, catálogo, configuração e permissões |

Não foram reescritos módulos, alteradas fórmulas financeiras, ativados escritores ou eliminados históricos.

## Resultados efetivos

**39/39 jobs aprovados no SHA da aplicação**: 37 suites Chromium, regressão Node/build e PostgreSQL descartável. Nenhum job cancelado de execuções intermédias é contado como aprovação final.

- `npm test`, sintaxe de 217 ficheiros JavaScript e build: aprovados.
- Renovação visual: **1 542 verificações**, zero falhas, 36 contextos, 19 módulos.
- Chat Chromium: **1 560 verificações**, zero falhas.
- Chat domínio/API sintética: **17 grupos de cenários**, incluindo assunto opcional, nomes por participante, notificações, autorização e compatibilidade histórica.
- Suites existentes de pesquisa, edição/IME, perfis, gestos, RH, Financeiro, Stock e restantes regressões: aprovadas.
- Comparações visuais mantêm a baseline anterior imutável e documentam diferenças deliberadas por pixels. Não constituem comparação com o mockup indisponível.
- HTTP do preview: manifesto e ficheiros principais devolvem 200 e correspondem ao código testado; `/api/chat`, `/api/auth/session` e `/api/stock` devolvem 404. O preview não fornece backend operacional.

| Perfil | Verificações da nova suite visual | Falhas |
|---|---:|---:|
| Call Center | 180 | 0 |
| Médico | 144 | 0 |
| Técnico | 144 | 0 |
| Administrativo | 234 | 0 |
| Administração | 420 | 0 |
| CEO | 420 | 0 |

Os números diferentes refletem os módulos autorizados por perfil. Esta tabela conta a nova suite visual; não soma nem substitui as restantes 36 suites Chromium e os ensaios de API/PostgreSQL. A simulação de perfis pelo CEO continua coberta pelas suites existentes.

## Capturas originais versionadas

Todas pertencem ao SHA testado, com dados sintéticos. Os artefactos completos no GitHub são conservados durante 14 dias; estas 12 capturas principais ficam também no histórico Git.

- [u1-mobile-dark-chat.png](evidence/visual-renewal-20261025/u1-mobile-dark-chat.png)
- [u1-mobile-light-dashboard.png](evidence/visual-renewal-20261025/u1-mobile-light-dashboard.png)
- [u1-tablet-dark-dashboard.png](evidence/visual-renewal-20261025/u1-tablet-dark-dashboard.png)
- [u1-tablet-dark-finance.png](evidence/visual-renewal-20261025/u1-tablet-dark-finance.png)
- [u1-tablet-dark-hr.png](evidence/visual-renewal-20261025/u1-tablet-dark-hr.png)
- [u1-tablet-dark-marketing.png](evidence/visual-renewal-20261025/u1-tablet-dark-marketing.png)
- [u1-tablet-dark-tables.png](evidence/visual-renewal-20261025/u1-tablet-dark-tables.png)
- [u1-tablet-light-agenda.png](evidence/visual-renewal-20261025/u1-tablet-light-agenda.png)
- [u1-tablet-light-chat.png](evidence/visual-renewal-20261025/u1-tablet-light-chat.png)
- [u1-tablet-light-dashboard.png](evidence/visual-renewal-20261025/u1-tablet-light-dashboard.png)
- [u1-tablet-light-operation.png](evidence/visual-renewal-20261025/u1-tablet-light-operation.png)
- [u1-tablet-light-stock.png](evidence/visual-renewal-20261025/u1-tablet-light-stock.png)

## Segurança, limites e validação pendente

- Sem merge, force push, migração, serviço contratado, alteração de domínio ou produção. Proteção Vercel mantida para todos os deployments deste projeto de preview.
- Pacote estático: **102 assets + configuração e manifesto**; cada asset foi comparado byte a byte com o build e com o commit Git. Sem `.env`, credenciais, backend, documentos privados, bases ou backups. As capturas PNG não contêm EXIF nem chunks de metadados textuais.
- Preview sem indexação, ligações limitadas à própria origem e microfone/câmara bloqueados. Não permite gravações reais de entrevistas.
- PostgreSQL foi testado numa instância descartável sintética. Isso não constitui persistência central autenticada no preview. Autenticação real, sincronização entre dispositivos, arquivo privado/scanner e recuperação real permanecem os quatro bloqueios operacionais anteriores.
- Chromium emulado não substitui teclado, GPS e gestos de um tablet físico. A aprovação anterior dos cinco testes de escrita no Android em `f87e344` foi preservada e **não** reutilizada como aprovação desta versão. É necessária validação física deste novo preview.
- A imagem exata de Dashboard referida pelo utilizador não estava acessível nesta sessão. Foi aplicada a identidade descrita e preservado o logótipo oficial, sem declarar correspondência pixel a pixel ao mockup.
- Os resultados aprovam os cenários executados. Funcionalidades e integrações anteriormente parciais não passam a estar operacionais por receberem o novo design. Não foram ativados emails, IA, pagamentos, gravações ou escritores reais.
- As verificações Chromium foram executadas contra o build em loopback no GitHub Actions; a publicação foi verificada por HTTP autenticado através da Vercel. Não se declara uma segunda execução Chromium no URL protegido.
- Após os testes e a publicação, o terminal local ficou indisponível. O código já estava sincronizado; o relatório, a matriz e as capturas foram preservados pelas ferramentas do GitHub. A atualização final do checkout local não pôde ser confirmada. O backup privado verificado do código `d356494` tem SHA-256 `ea66098ec97245075712661e5679078cfb0a1566005a60581563e73a67d5983c`.

## Commits de implementação

1. `a7f9830` — tema navy, editores partilhados e assunto opcional.
2. `369430d` — filtro de clínica do cabeçalho e adaptação à largura.
3. `3d96907` — cabeçalho compacto, scroll de navegação e atalho RH consolidado.
4. `a62b960` — temas nas páginas secundárias e controlo de mensagens longas.
5. `d356494` — interlocutor canónico nas notificações e conversas históricas sem assunto.

O commit documental posterior não altera a aplicação publicada nem é apresentado como novo código testado.
