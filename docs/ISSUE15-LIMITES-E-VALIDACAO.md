# Tarefa #15 — limites e validação operacional

## Medicina do Trabalho

A ficha é administrativa: tipo de exame, prestador, datas, indicação de periodicidade, convocatória registada manualmente, documento de aptidão, classificação permitida e eventos administrativos. Não existem campos de diagnóstico, resultados clínicos ou notas médicas; pedidos com campos adicionais são recusados. A referência de periodicidade deve conter apenas uma referência administrativa, nunca informação clínica.

O estado Válido representa conferência administrativa no cenário de testes. A aplicação não assina a ficha de aptidão e guarda expressamente signatureVerified=false. Não confundir esse estado com prova de assinatura, conformidade legal do ficheiro ou realização efetiva de um exame real.

Antes de dados reais, confirmar com medicina do trabalho e assessoria jurídica: critérios por idade/circunstância, exames de admissão e ocasionais, periodicidade/reduções/aumentos indicados pelo médico, informação de aptidão que pode ser consultada por empregador, poderes de acesso, autenticidade do documento, conservação, retificação e recuperação. Os avisos de 60/30/7 dias são operacionais e configuráveis, não prazos legais universais.

O sistema de testes não garante que um ficheiro manualmente classificado como Ficha de aptidão não contém texto clínico indevido. A política, conferência do conteúdo, arquivo privado, acesso a ficheiros reais e autenticidade devem ser validados antes da ativação. Não carregar exames, análises ou relatórios clínicos completos.

## Utilização do arquivo existente

1. CEO/Administração configuram o tipo Ficha de aptidão no Catálogo Mestre se ainda não existir.
2. Carregar e conferir a ficha em Recursos Humanos → Colaboradores → ficha do colaborador → Documentos, usando esse tipo existente. Não criar uma segunda tabela/arquivo para saúde ocupacional.
3. Associar o documento ao registo administrativo. Para estado Válido, o documento tem de estar Validado; a próxima data, a aptidão permitida e a referência de conferência são obrigatórias.
4. Preservar o histórico. A ficha única por colaborador/clínica é atualizada, não recriada a cada alteração. Não executar eliminações automáticas.

## Regulamentos e navegação

Número publicado e número de pendências são conceitos diferentes. A biblioteca institucional não contém um regulamento real pré-publicado. O seu âmbito depende de clínicas, perfis e destinatários definidos pelo RH. Os registos de outro host de preview não são transportados automaticamente pelo armazenamento local.

Percurso de validação: CEO/Administração → Recursos Humanos → Documentos da empresa e declarações → Publicar conteúdo → Regulamento, escolher clínicas/perfis e usar conteúdo explicitamente sintético. Depois mudar para um colaborador abrangido → Meu RH → Documentos e regulamentos → consultar → Tomei conhecimento. Uma alteração material reabre a pendência e preserva a confirmação anterior.

## Integrações que permanecem pendentes

Aplicam-se as dependências da tarefa #14: [plano anterior](ISSUE14-INTEGRACOES-PENDENTES.md). O preview é local, não autenticação/persistência entre dispositivos. PostgreSQL e APIs são testados numa base descartável; não equivalem a ligação central ativa no preview. Arquivo privado, assinatura digital de declarações, email/convocatória automática, prestador de medicina do trabalho e backups operacionais não foram ativados.

São necessárias validação física Android e validações técnicas, operacionais e jurídicas antes de utilização com pessoas/documentos reais. Não declarar conformidade RGPD integral nem funcionamento real de integrações ausentes.
