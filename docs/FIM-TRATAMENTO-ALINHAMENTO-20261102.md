# Alinhamento da tabela de fim de tratamento

Branch `dev/v4-stabilization-20261017`, base preservada `4ac8984f`. Alteração apenas de apresentação: não há alteração de domínio, API, dados, contadores, datas, decisões ou permissões.

## Diagnóstico

A tabela herdava `min-width:680px`, células/cabeçalhos sem quebra de linha e mínimos de 135px em cada controlo. A combinação do dimensionamento automático com os sete campos obrigava a uma largura superior à área útil do tablet, agravada pelo conteúdo do histórico dentro de uma coluna estreita.

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

Resultados efetivos, capturas e novo preview serão registados após conclusão do Actions e verificação HTTP.
