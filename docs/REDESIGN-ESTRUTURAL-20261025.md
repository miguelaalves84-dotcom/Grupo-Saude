# Renovação estrutural do Grupo Saúde V4 — 25/10/2026

**Código testado:** `9e7aa489900125b69352db21b34735757bad3ddc`. **Branch:** `dev/v4-stabilization-20261017`. **PR #13:** rascunho.
[Preview protegido READY](https://grupo-saude-v4-validacao-sintetica-25yad29hg-grupo-saude.vercel.app) · [GitHub Actions 40243715831](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40243715831).

**Estado:** nova composição implementada e testada nos cenários abaixo. A fidelidade ao mockup aprovado não está certificada: a imagem original não estava acessível nesta sessão. A comparação automatizada usa a versão anterior `d356494`, claramente identificada como tal. Falta também a validação desta versão num tablet físico.

## O que mudou

### Menu e cabeçalho

- Menu fixo com identidade própria, logótipo oficial maior (96 px no computador/tablet horizontal), ícones SVG partilhados, hierarquia mais forte e um grupo expandido de cada vez.
- Recuos, estados ativos, contadores e versões móvel/recolhida preservados. Eliminados os símbolos antigos sobrepostos aos ícones novos.
- Cabeçalho compacto com identificação da área, pesquisa de módulos autorizados, seleção contextual de clínica, notificações, Chat, perfil/simulação, tema e acesso às escalas com o contador original.
- O botão de escalas mantém o mesmo controlador e nome acessível; o ícone SVG é testado por carregamento real. O acesso redundante a Permissões no cabeçalho foi suprimido quando a mesma ação está disponível no menu.
- A pesquisa do cabeçalho navega entre módulos. Não é um índice central de dados pessoais; as pesquisas de registos e filtros existentes continuam nos seus módulos.
- A seleção de clínica reutiliza o filtro existente em cada área, com as mesmas opções e eventos. Áreas sem filtro mostram essa indicação, desativada.

### Dashboard CEO/Administração

- Quatro indicadores principais: consultas realizadas, tratamentos realizados, novos pedidos e tarefas pendentes.
- Contagens previstas, marcações e tarefas concluídas aparecem como contexto, sem criar onze cartões equivalentes.
- Gráfico SVG dimensionado para o espaço disponível, com série selecionável, grelha, datas, dados diários consultáveis e valores das fontes canónicas.
- Estado das clínicas ao lado do gráfico no tablet horizontal; os restantes painéis organizam tarefas/aprovações, lista de espera, acompanhamento financeiro documental e alertas operacionais.
- Os onze indicadores anteriores, a tabela comparativa completa e os indicadores personalizados por clínica continuam disponíveis em **Todos os indicadores e comparação detalhada**.
- Período e clínica continuam a filtrar as mesmas agregações. A comparação automatizada confirma igualdade dos valores canónicos antes/depois.
- Pendências atuais são identificadas como independentes do período. O painel financeiro mostra contagens documentais efetivas e liga ao Financeiro; não apresenta receitas, rentabilidade ou estimativas inventadas.
- Os números das capturas são derivados de registos sintéticos de teste. Não foram copiados do mockup nem introduzidos como dados reais na aplicação.

### Restantes módulos e páginas

A composição partilhada foi aplicada em `workspace-shell-v4.js`, `visual-runtime-v4.js` e `design-system-v4.css`, reutilizando os controladores existentes:

| Área | Aplicação do desenho e preservação |
|---|---|
| Agenda e calendários | navegação, cabeçalho, ações, filtros, calendário e formulários existentes |
| RH e Ficha 360° | títulos, faixa de ações, tabelas, formulários, secções e modais |
| Livro de ponto, férias e baixas | os mesmos componentes; regras, GPS e aprovações preservados |
| Dia Clínico | abertura, durante o dia e fecho mantidos com o novo espaço de trabalho |
| Clínicas e Reclamações | filtros, fichas, documentos, funis e janelas com o padrão partilhado |
| Financeiro/Caixas/salários | tabelas, ações, comprovativos, conferência e exportação preservados |
| Stock/fornecedores/encomendas | tabelas e formulários; gestão reservada e isolamento mantidos |
| Marketing | filtros, campanhas, calendário e aprovações existentes |
| Chat | duas colunas no tablet, escrita, respostas, reações e anexos preservados |
| Candidatos/entrevistas | funis, gestos, fichas e formulários preservados |
| Tabelas, tarefas, alertas, relatórios e segurança | navegação e componentes partilhados, sem novas tabelas/controladores |
| Login e páginas secundárias | mesmo tema e logótipo, sem margem lateral quando não existe menu |

Em áreas com muitas ações, os botões originais ficam numa faixa única deslocável por toque, em vez de ocuparem várias filas do cabeçalho. Os nós e eventos existentes são reutilizados. As caixas de texto mantêm crescimento automático e não têm os seus valores ou posições de cursor reescritos pelo código de apresentação.

A navegação fixa é excluída dos relatórios impressos; o logótipo e a indicação de documento sintético continuam presentes.

## Testes efetivos

**40/40 jobs aprovados** no SHA indicado: **38 suites Chromium**, regressão Node/build e PostgreSQL descartável.

- Nova composição: **300 verificações**, zero falhas; **12 comparações visuais** (CEO/Administração × computador/tablet horizontal/telemóvel × claro/escuro).
- Percurso visual transversal: **1 542 verificações**, zero falhas; **36 contextos**, seis perfis e 19 módulos autorizados.
- Chat: **1 560 verificações Chromium**, zero falhas; mantidos 17 grupos de testes de domínio/API sintética.
- Sintaxe de 219 ficheiros JavaScript, `npm test`, build de 102 assets, regressões funcionais e PostgreSQL isolado: aprovados.
- Mantidas suites de permissões, simulação CEO, pesquisas, escrita/IME, gestos, RH, operações, Financeiro, Stock, documentos e restantes áreas.
- A comparação de pixels documenta a mudança deliberada face a `d356494`; o limiar RGB >12 e alteração superior a 5% verificam que a composição mudou, **não** que corresponde ao mockup indisponível.
- Na auditoria individual, 274 candidatos geométricos foram revistos: zero falhas reais e zero casos por confirmar nos registos classificados. Os oito casos novos de interseção no modal ficaram comprovadamente fora da área pintada/recortada.
- O detector mantém 18 controlos negativos visíveis, além dos seis controlos das secções de filtros. A auditoria expandida independente também passou; os sinais geométricos brutos adicionais permanecem nos artefactos, sem os equiparar automaticamente a defeitos.
- Os resultados aprovam os cenários executados; não constituem certificação visual humana de todos os estados possíveis.

| Perfil | Verificações da suite transversal | Falhas |
|---|---:|---:|
| Call Center | 180 | 0 |
| Médico | 144 | 0 |
| Técnico | 144 | 0 |
| Administrativo | 234 | 0 |
| Administração | 420 | 0 |
| CEO | 420 | 0 |

[Matriz CSV](MATRIZ-REDESIGN-ESTRUTURAL-20261025.csv) · [Evidências completas do bloco](REDESIGN-ESTRUTURAL-EVIDENCIAS-20261025.json) · [Provas dos oito recortes de modal](AUDITORIA-RECORTE-MODAIS-20261025.json).

## Comparação do tablet horizontal

As duas imagens de cada linha usam os mesmos registos sintéticos e filtros. **Antes** é `d356494`, não a imagem aprovada.

| Tema | Antes | Nova composição |
|---|---|---|
| Claro | [u1-tablet-landscape-light-before.png](evidence/structural-design-20261025/u1-tablet-landscape-light-before.png) | [u1-tablet-landscape-light-after.png](evidence/structural-design-20261025/u1-tablet-landscape-light-after.png) |
| Escuro | [u1-tablet-landscape-dark-before.png](evidence/structural-design-20261025/u1-tablet-landscape-dark-before.png) | [u1-tablet-landscape-dark-after.png](evidence/structural-design-20261025/u1-tablet-landscape-dark-after.png) |

## Capturas dos restantes módulos

- [u1-mobile-dark-after.png](evidence/structural-design-20261025/u1-mobile-dark-after.png)
- [u1-mobile-light-after.png](evidence/structural-design-20261025/u1-mobile-light-after.png)
- [u1-tablet-landscape-dark-chat.png](evidence/structural-design-20261025/u1-tablet-landscape-dark-chat.png)
- [u1-tablet-landscape-dark-complaints.png](evidence/structural-design-20261025/u1-tablet-landscape-dark-complaints.png)
- [u1-tablet-landscape-dark-hr.png](evidence/structural-design-20261025/u1-tablet-landscape-dark-hr.png)
- [u1-tablet-landscape-dark-stock.png](evidence/structural-design-20261025/u1-tablet-landscape-dark-stock.png)
- [u1-tablet-landscape-light-agenda.png](evidence/structural-design-20261025/u1-tablet-landscape-light-agenda.png)
- [u1-tablet-landscape-light-marketing.png](evidence/structural-design-20261025/u1-tablet-landscape-light-marketing.png)
- [u1-tablet-landscape-light-operation.png](evidence/structural-design-20261025/u1-tablet-landscape-light-operation.png)
- [u1-tablet-landscape-light-tables.png](evidence/structural-design-20261025/u1-tablet-landscape-light-tables.png)

As 14 capturas originais ficam versionadas no Git; os artefactos completos do Actions têm retenção de 14 dias.

## Correções identificadas durante a validação

1. Melhoramento visual dependia de métodos ausentes no DOM mínimo dos testes: o desenho é um melhoramento progressivo e as regressões dos controladores continuam a correr nesse simulador.
2. Menu fixo estava a aplicar margens às páginas sem navegação: composição limitada ao espaço de trabalho completo.
3. Hierarquia móvel tinha tamanhos iguais: grupos principais voltaram a ter tamanho superior aos submenus.
4. Botões de prova XSS eram inseridos fora da área de conteúdo, atrás do novo menu: o ensaio usa agora a área real de conteúdo, mantendo cliques normais e todos os ataques/asserts.
5. Cabeçalho demasiado alto e cartões principais verticais: composição compactada após revisão das capturas.
6. Ícone da aprovação vazio como imagem SVG: namespace XML corrigido e carregamento real da imagem testado.
7. Menu fixo podia interferir na impressão: navegação ocultada, com ensaio explícito.
8. Auditor antigo confundia retângulos de elementos recortados pelo scroll com sobreposição visível: medições incluem recortes, sem retirar os testes de sobreposições deliberadas.

Nenhum destes pontos eliminou dados, regras, permissões, documentos, históricos ou controladores de negócio.

## Segurança e limitações

- Branch de desenvolvimento; PR #13 em rascunho. Sem merge, force push, migração ou produção.
- Projeto Vercel sintético existente; deployment `dpl_EhL5Wngsrrp8ScgaVZDKyZUSaXZ3`, ambiente `staging`, proteção de acesso mantida.
- Pacote: 102 assets + configuração + manifesto; verificados byte a byte contra o build e o Git testado. Sem backend, `.env`, credenciais, bases ou arquivos privados.
- Página inicial, manifesto, ficheiros visuais principais e login respondem HTTP 200 e correspondem ao código testado. Endpoints de autenticação, Chat e Stock real respondem 404.
- Chromium correu contra o build em loopback no Actions; a publicação protegida foi verificada por HTTP autenticado da Vercel. Não se declara uma segunda sessão Chromium no URL protegido.
- Testes de tablet: Chromium com toque e viewport horizontal 1280×800. A confirmação num Android físico continua pendente. A aprovação antiga de escrita em `f87e344` não foi reutilizada como validação desta versão.
- A imagem original aprovada continua necessária para comparar a composição final e ajustar a fidelidade. Não se declara esse objetivo concluído sem a referência.
- Autenticação real, persistência entre dispositivos, arquivo privado/scanner e recuperação real continuam pendentes; esta renovação não ativa esses serviços.
- Backup privado do código testado: 421 ficheiros verificados, SHA-256 `3aa4fd1d246d307a33d23e87af108f24f54c9b62a8155a997695b9cbdc892604`. O backup não foi enviado ao GitHub.

## Rastreabilidade

- `7b781df`: nova composição executiva, navegação e componentes partilhados.
- `30b2af8`: âmbito das páginas e compatibilidade das regressões.
- `308d666`: densidade do cabeçalho, hierarquia móvel e ensaio de segurança.
- `608fa3b`: impressão e faixas de ações.
- `e92ab907`: SVG do acesso às escalas e verificação de carregamento.
- `9e7aa489`: prova de pintura/recorte dos modais e controlos negativos; versão integral novamente testada.

O commit documental posterior não altera a aplicação publicada. Execuções falhadas ou canceladas dos incrementos anteriores não contam para os 40 jobs aprovados.
