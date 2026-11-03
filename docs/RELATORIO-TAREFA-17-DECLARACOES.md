# Tarefa 17 — revisão pontual dos 12 modelos

Base preservada: código `d921012c`, relatório `528a2399`, branch `dev/v4-stabilization-20261017`. PR #13 em rascunho; main/produção não alteradas.

## Correções

- Formato monetário explícito PT-PT com milhares, duas casas decimais e espaço antes do euro: `1.450,00 €`. Valores inteiros em cêntimos, sem arredondamento monetário intermédio nem inferência de valores desconhecidos.
- Frases monetárias separadas por pontuação. Quantia/euro mantidos juntos na quebra de linha do PDF.
- Base bruta sempre apresentada; componentes opcionais explicitamente registadas a zero omitidas do texto. Componentes desconhecidas, negativas ou inconsistentes continuam a impedir conferência; não se presume zero.
- Remuneração e vínculo/remuneração consultam a versão contratual confirmada válida na referência, pela projeção partilhada existente. Sem fallback para o salário atual da ficha. Snapshot identifica contrato, vigência, referência e componentes, permitindo auditoria.
- Períodos sem contrato confirmado ou com versões concorrentes na mesma data pedem conferência; não são apresentados como remuneração final.
- Nomes de clínicas integrados gramaticalmente: «na Clínica…», «no Centro…», «no Hospital…», «na Unidade…» ou «na clínica Abranfir». Espaços e pontuação revistos; nome pessoal não é repetido no início de parágrafos seguintes.
- Experiência/funções conservam as atividades da ficha RH; não são geradas novas responsabilidades. Descrição inexistente ou inválida impede conferência.
- «O Gerente» centrado sobre a linha de escrita, mais próximo dela, no PDF e na impressão. Nome/cargo não são inventados quando não confirmados.
- Local e **uma única Data de assinatura, em branco**, preservados na última página.
- Modelo gráfico institucional, cabeçalho/logótipo, cores, margens, corpo e circuito de aprovação preservados.
- Revisão textual 3 para novos pedidos; revisões 1 e 2 continuam disponíveis para pedidos/snapshots anteriores. Não se apagam versões nem históricos.

## Verificação

Testes locais: npm test/build e parsers existentes. A matriz de exemplos passa de 15 para 20: 12 modelos e casos de documento longo, dados em falta, outra entidade, remuneração antiga/nova, componentes zero, valor inconsistente e nome de clínica diferente.

Testes adicionais: fronteiras de vigência, versão futura, lacunas, versão não confirmada, conflito de versões, salário atual divergente, pontuação e nomes nos 12 modelos, preservação da revisão 2 e conferência bloqueada. PostgreSQL/API isolados e Chromium foram alargados para verificar os mesmos comportamentos através dos serviços e da interface.

Geometria: assinatura única, proximidade e centragem de «O Gerente», A4, margens, fonte, ausência de sobreposição e paginação. Imagens reais rasterizadas dos PDFs; inspeção visual local do exemplo de Remuneração. Resultado efetivo no GitHub Actions: **52/52 jobs aprovados**, zero falhas, no código `1dbf0cd4983e76f0a401b32bdcfc2a3b998bb2bd`. A suite das declarações concluiu **3 264 verificações Chromium**, nos seis perfis, dois temas e três formatos. Inclui 36 PDFs produzidos pelo motor de impressão real do Chromium, com data única em branco e assinatura numa linha. Os 73 PDFs e 20 exemplos adicionais também passaram nos leitores/rasterizadores independentes. PostgreSQL/API confirmaram a vigência salarial histórica, sem usar o salário atual divergente.

## Limitações preservadas

Apenas dados/contas/documentos sintéticos. Sem emails reais, assinatura digital válida, arquivo privado ou operação central autenticada ativa. PDF não assinado continua marcado como rascunho. É necessária revisão jurídica antes de utilização oficial e validação no Android físico; Chromium tátil é emulação. Valores contratuais de referência não provam pagamentos.


## Entrega verificada

- Implementação: `418be70a`; ajuste da linha de assinatura e impressão efetiva: `1dbf0cd4`.
- Código publicado: `1dbf0cd4983e76f0a401b32bdcfc2a3b998bb2bd`.
- [Execução GitHub Actions](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41547725914).
- [PDFs, capturas e matriz detalhada](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41547725914/artifacts/13190290482), até 16/11/2026.
- [Resultados estruturados](RESULTADOS-TAREFA-17-DECLARACOES.json).
- Preview protegido **READY**: https://grupo-saude-v4-validacao-sintetica-7b9biyc2c-grupo-saude.vercel.app
- [Galeria dos 12 modelos e casos adicionais](https://grupo-saude-v4-validacao-sintetica-7b9biyc2c-grupo-saude.vercel.app/exemplos-declaracoes.html).
- [Remuneração antiga](https://grupo-saude-v4-validacao-sintetica-7b9biyc2c-grupo-saude.vercel.app/declaracoes-exemplos/salary-historical.pdf) e [nova remuneração](https://grupo-saude-v4-validacao-sintetica-7b9biyc2c-grupo-saude.vercel.app/declaracoes-exemplos/salary-new-contract.pdf), exclusivamente fictícias.
- Deployment `dpl_CCNtqqeKh8sbMLByguSYaTditZvJ`, target staging. HTTP 200 e comparação integral de conteúdo em 26 endereços, incluindo os 20 PDFs. Manifesto confirma a tarefa, revisão de conteúdo e SHA publicados.

A galeria auxiliar usa apenas os ficheiros da fixture versionada `tests/declaration-layout-examples.cjs`, com lista explícita de nomes. Não consulta dados de colaboradores nem representa um arquivo privado real. Os previews anteriores não foram apagados; cada origem conserva separadamente os seus dados locais de demonstração.

## Ficheiros alterados

`hr-declarations-core-v4.js`, `finance-core-v4.js`, `hr-declarations-v4.css`, `tests/declaration-layout-examples.cjs`, `tests/declaration-layout-pdf.py`, `tests/hr-declarations-browser.py`, `tests/hr-portal-postgres.cjs` e relatórios desta tarefa. Não foram criadas tabelas, serviços ou formulários duplicados.

## Segurança

PR #13 em rascunho. Main permanece `84fba5a2d6d7afcb0723ca312f4e617acc22823d`. Proteção e configuração dos projetos Vercel verificadas e inalteradas. Sem credenciais, ficheiros privados, bases reais, migrações, emails ou serviços de produção ativados. Branch sincronizada sem force push; os relatórios finais não alteram o código publicado.
