# Alinhamento da tabela de fim de tratamento

Branch `dev/v4-stabilization-20261017`, base preservada `4ac8984f`. Alteração apenas de apresentação: não há alteração de domínio, API, dados, contadores, datas, decisões ou permissões.

## Diagnóstico

A tabela herdava `min-width:680px`, células/cabeçalhos sem quebra de linha e mínimos de 135px em cada controlo. A combinação do dimensionamento automático com os sete campos obrigava a uma largura superior à área útil do tablet, agravada pelo conteúdo do histórico dentro de uma coluna estreita. As medidas reais no Chromium revelaram a causa principal: `#operationContent .operation-workflow [data-work-rows]{display:grid}` aplicava-se ao `tbody`, separando o dimensionamento do corpo e do cabeçalho. A correção repõe `table-row-group` especificamente nesta tabela, mantendo `grid` apenas nos cartões estreitos. O destaque global de atraso com borda foi também substituído por sombra interna na tabela, evitando interferências de bordas colapsadas. Nos cartões mantém-se o destaque lateral.

## Correção

- Uma única definição ordenada das sete colunas produz cabeçalhos e células: Origem/estado, Nome, N.º de utente, Conclusão prevista, Decisão, Notas, Histórico.
- `colgroup` proporcional e `table-layout:fixed`, com as mesmas posições para cabeçalhos e linhas, quebra de texto e mínimos intrínsecos dos controlos removidos apenas nesta tabela.
- Origem apresenta Novo ou Pendente desde; previsão permanece de leitura e não é recalculada.
- Campos com altura mínima de 44px e botão de histórico compacto. O histórico individual abre abaixo do respetivo utente, a toda a largura, preservando o conteúdo anterior.
- Quando a largura disponível não chega, os mesmos elementos passam a cartões identificados por campo. Não se duplicam formulários, inputs ou registos para o modo móvel. Os cabeçalhos continuam associados semanticamente às células; as legendas móveis são visuais.
- Estilos limitados à tabela de fim de tratamento. Restantes listas e módulos não recebem novas regras de apresentação.

## Dados e limites do preview

Não há reset, migração, cópia ou eliminação de registos. A suite semeia seis registos sintéticos já existentes, com nomes longos, datas, notas e histórico, e verifica que permanecem exatamente iguais ao abrir/fechar histórico, alterar apresentação, guardar sem mudanças e recarregar.

Não é possível aceder ao armazenamento local do tablet a partir deste ambiente. Os seis registos introduzidos pelo utilizador permanecem no endereço anterior e não são transferidos automaticamente entre hosts de preview. O deployment anterior é preservado. Não se declara que uma nova origem contém esses dados físicos nem se utiliza conteúdo pessoal em código, logs ou artefactos.

## Testes

Testes locais de sintaxe, regressão e build executados. Nova suite Chromium: seis perfis, claro/escuro, computador, tablet horizontal e telemóvel; mede a posição/largura de cada cabeçalho face às sete células das seis linhas, limites dos controlos, ausência de overflow horizontal, cartões móveis, histórico individual e preservação integral dos seis registos sintéticos. Emulação Chromium não substitui Android físico.

## Resultados efetivos

Código publicado: `6a5a8b63f94f4eccda6bf526ad8a42015609daf9`.

- [GitHub Actions: 49/49 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41484560741): regressão, build, PostgreSQL isolado e Chromium. As primeiras execuções detetaram o desalinhamento; apenas a execução deste SHA é considerada aprovada.
- Suite específica: **324/324 verificações**, seis perfis, três formatos e dois temas. Perfis sem autorização não veem os registos; os autorizados passam pelas medições e operações. Capturas: 18 imagens dos perfis autorizados, em computador 1440×1000, tablet 1280×800 e telemóvel 390×844.
- [Capturas e resultados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41484560741/artifacts/13161941747), retidos por 14 dias. Resumo detalhado versionado em [evidence/ending-layout-20261102-results.json](evidence/ending-layout-20261102-results.json).
- Critério geométrico: diferença máxima de 1 px entre limites de cabeçalhos e células, cobrindo arredondamento subpixel; sem overflow horizontal. Histórico individual abre e fecha num painel legível sem criar linhas de dados adicionais.
- Seis registos sintéticos preexistentes preservados integralmente após guardar e recarregar: identificadores, campos, datas, decisões e histórico.
- Sintaxe JavaScript/Python, npm test, build de 105 assets e git diff --check aprovados. Pacote de preview com 108 objetos estáticos; sem executáveis de backend, segredos, bases de dados, documentos privados ou backups. Verificação de padrões de credenciais nos ficheiros alterados sem correspondências.

## Preview verificado

[Preview sintético READY](https://grupo-saude-v4-validacao-sintetica-50w84b0q4-grupo-saude.vercel.app)

Deployment `dpl_9tQALCPfc8FsJGPM2anhttbhQoQm`, ambiente staging. HTTP 200 autenticado pela ferramenta autorizada em /, /api/version, /app.js e /design-system-v4.css. HTML, JS e CSS iguais aos ficheiros testados; manifesto confirma o SHA e persistência central desativada. Proteção Vercel mantida; pode ser necessário iniciar sessão com uma conta autorizada.

O deployment anterior não foi removido nem alterado. Os seis registos do tablet continuam associados ao endereço anterior; este novo endereço não os importa automaticamente. Não foram consultados dados reais nem o armazenamento do dispositivo. A validação física final neste tablet permanece pendente; Chromium com viewport/toque não equivale a Android físico.

## Preservação e âmbito

PR #13 em rascunho; apenas branch de desenvolvimento. Main preservada em `84fba5a2d6d7afcb0723ca312f4e617acc22823d`. Configurações e proteção dos projetos existentes mantidas. Sem migrações, novos serviços reais, emails, Clicloud ou publicação em produção. Não foram alteradas regras de domínio, APIs, contadores, transporte de pendências ou dados persistidos.
