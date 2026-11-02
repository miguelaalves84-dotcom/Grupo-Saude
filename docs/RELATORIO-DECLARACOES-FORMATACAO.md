# Declarações RH — apresentação institucional A4

Base: código `979c5674`, relatório `56cb3d48`, branch `dev/v4-stabilization-20261017`. Alteração limitada aos 12 modelos e à sua apresentação; sem main, produção, migrações, serviços ou dados reais.

## Alterações

- Cabeçalho com logótipo original, entidade, NIF e morada quando disponível. A morada vem do contrato ou de entidade com NIF coincidente; não é inferida da clínica operacional.
- Separador azul-petróleo, título centralizado em negrito, corpo 11,2 pt, margens de 56 pontos, entrelinha 17 pontos e parágrafos com espaçamento consistente.
- Nome, função e dados essenciais destacados. Métricas Helvetica/Helvetica-Bold utilizadas para quebrar linhas e posicionar segmentos sem colisões. O exportador/serializador financeiro existente continua a servir os outros módulos.
- Textos formais específicos para os 12 modelos. Antiguidade em anos, meses e dias de calendário, com admissão e referência explícitas; sem arredondar para anos completos.
- Rascunho incompleto identificado claramente, com lista legível de dados por conferir. Nenhum marcador interno é tratado como declaração definitiva; a conferência continua bloqueada pelos dados em falta.
- Uma única secção de Local, Data em branco e assinatura do gerente, na última página. O bloco nunca é dividido. Rodapé discreto da entidade; paginação apenas em documentos com mais de uma página.
- Pré-visualização e impressão partilham CSS institucional isolado e página A4 nomeada, sem alterar a impressão dos restantes módulos.
- Revisão de conteúdo 2 para novos pedidos. Pedidos antigos conservam texto e snapshot originais; não foram apagados documentos, versões ou aprovações.

## Testes

Locais: npm test e build; testes existentes dos 12 modelos; 73 PDFs verificados pelo parser independente. Acrescentados 15 exemplos com logótipo: 12 modelos, dados em falta, outra entidade e texto longo. Verificadas dimensões A4, limites dos textos, ausência de colisões, tamanho de letra, assinatura/data única, rodapé e paginação. Rasterização real dos PDFs para imagens e inspeção visual local de Antiguidade e do rascunho incompleto.

Testes de antiguidade: admissão e referência coincidentes, referência anterior, mês curto e ano bissexto. Compatibilidade de pedidos antigos e associação da morada por entidade também verificadas.

A suite Chromium existente verifica os seis perfis, temas e três formatos. Foi alargada para confirmar a nova apresentação de dados em falta. Resultados efetivos e preview serão registados após GitHub Actions.

## Limitações preservadas

Todos os exemplos são sintéticos e não assinados. Assinatura digital verificável, arquivo privado e operação central autenticada entre dispositivos permanecem pendentes; não foi ativado qualquer serviço real. Os textos requerem revisão jurídica antes de uso oficial. A impressão HTML depende das definições do navegador (desativar cabeçalhos/rodapés automáticos); o PDF descarregado inclui o rodapé controlado. Caracteres fora de WinAnsi continuam a ser recusados explicitamente pelo exportador. Chromium tátil não substitui teste num Android físico.
