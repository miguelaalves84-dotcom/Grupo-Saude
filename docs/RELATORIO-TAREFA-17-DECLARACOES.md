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

Geometria: assinatura única, proximidade e centragem de «O Gerente», A4, margens, fonte, ausência de sobreposição e paginação. Imagens reais rasterizadas dos PDFs; inspeção visual local do exemplo de Remuneração. Resultados efetivos do GitHub Actions e preview serão registados após execução.

## Limitações preservadas

Apenas dados/contas/documentos sintéticos. Sem emails reais, assinatura digital válida, arquivo privado ou operação central autenticada ativa. PDF não assinado continua marcado como rascunho. É necessária revisão jurídica antes de utilização oficial e validação no Android físico; Chromium tátil é emulação. Valores contratuais de referência não provam pagamentos.
