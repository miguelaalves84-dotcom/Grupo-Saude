# Fichas individuais compactas — 04/11/2026

Base: `a4677e138eef0638b7e4904417aa589cbe424470`; branch `dev/v4-stabilization-20261017`; PR #13 em rascunho.

## Revisão e implementação

A ficha dedicada já utiliza `mountWorkspace()` de `hr-master-v4.js` para todos os colaboradores. Os cartões herdavam margens, padding e espaçamento dos cartões gerais, e os separadores tinham larguras fixas/scroll em telemóvel.

- Estilos delimitados por `#employeeWorkspace`, no ficheiro de RH já existente; não afetam os sete dashboards nem os outros módulos.
- Cartões sem margem inferior acumulada, padding reduzido, valores sem margem redundante e altura mínima de 100 px. O conteúdo pode crescer, sem truncagem ou alturas máximas.
- Grelha de uma, duas, três ou quatro colunas conforme a largura efetiva da ficha (limiares 360, 650 e 1000 px), sem depender apenas da largura do dispositivo.
- Separadores com distribuição automática, botões de pelo menos 44 px e textos completos. No telemóvel, reutilização do componente recolhível `rh-section-menu` já existente; resumo com nome da secção ativa e navegação em duas colunas ao expandir, sem carrossel horizontal. A secção pode voltar a expandir-se depois de uma alteração do tamanho do ecrã.
- Identidade/nome e títulos podem quebrar linha; cores derivadas das variáveis do tema existente. Mantidos foco visível e controlos nativos de teclado.

Os separadores continuam sujeitos às permissões existentes; não se força a apresentação de secções não autorizadas. Todos os destinos, incluindo Documentos e Desenvolvimento, conservam os seus controladores atuais. Não foram alteradas regras, valores, cálculos, históricos, dados ou atalhos «Definir», «Editar» e «Consultar».

## Testes efetivamente executados

- `node tests/hr-management.cjs` — seis perfis, clínica, permissões documentais/aprovações e histórico.
- `node tests/audit-regressions.cjs` — totais RH canónicos, âmbito multiclínica, simulação CEO e regressões de permissões/navegação.
- `node tests/text-editing.cjs` — binding único, composição e preservação da escrita.
- `node tests/runtime.cjs` — 102 verificações aprovadas com JavaScript e DOM simulado. A reprodução histórica opcional ficou SKIP por não ter sido fornecido `GS_BASELINE_DIR`.
- `node tests/syntax.cjs` — 276 ficheiros JavaScript aprovados.
- `npm run build` — 119 assets estáticos, excluindo backend, segredos e documentos.
- `git diff --check` — aprovado.

Não executados: Chromium, medições de geometria, abertura real dos oito separadores em computador/tablet/telemóvel, capturas e comparação nos dois temas. O arranque do Chromium permanece bloqueado pelas permissões da sandbox; por instrução do utilizador não foi repetido. A melhoria está preparada para validação manual no preview, não é apresentada como validada num Android físico.

## Segurança e pendências

Só desenvolvimento e dados sintéticos. P0.1 permanece bloqueada. Sem alterações a main, V3, produção, Neon, credenciais ou integrações; sem migrations, seeds ou merge.

A publicação é estática e usa um URL de deployment específico; não altera o domínio geral antigo do projeto. READY e HTTP devem ser confirmados separadamente após a publicação. Persistência central, autenticação e arquivo privado continuam fora do âmbito desta alteração.
