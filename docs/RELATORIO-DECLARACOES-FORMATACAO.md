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

A suite Chromium existente verifica os seis perfis, temas e três formatos. Foi alargada para confirmar a nova apresentação de dados em falta. Resultado efetivo: **52/52 jobs aprovados** no commit `d921012c07633c5ae75295a38bb2564f3557d68e`, incluindo PostgreSQL isolado e **2 256 verificações Chromium**, seis perfis, dois temas e três formatos. Os 73 PDFs foram analisados por pypdf e os 15 exemplos adicionais foram rasterizados e verificados por PyMuPDF; todos passaram. Os 12 exemplos normais cabem numa página A4; o texto longo usa cinco páginas, mantendo o bloco único de assinatura no final.

## Limitações preservadas

Todos os exemplos são sintéticos e não assinados. Assinatura digital verificável, arquivo privado e operação central autenticada entre dispositivos permanecem pendentes; não foi ativado qualquer serviço real. Os textos requerem revisão jurídica antes de uso oficial. A impressão HTML depende das definições do navegador (desativar cabeçalhos/rodapés automáticos); o PDF descarregado inclui o rodapé controlado. Caracteres fora de WinAnsi continuam a ser recusados explicitamente pelo exportador. Chromium tátil não substitui teste num Android físico.


## Entrega

- Código: `d921012c07633c5ae75295a38bb2564f3557d68e`.
- [Execução GitHub Actions](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41542505606).
- [Capturas, PDFs e resultados detalhados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41542505606/artifacts/13187114363), até 16/11/2026.
- [Resultados estruturados](RESULTADOS-DECLARACOES-FORMATACAO.json).
- Preview protegido **READY**: https://grupo-saude-v4-validacao-sintetica-2qhnv62ds-grupo-saude.vercel.app
- [Galeria com os 12 modelos e três casos adicionais](https://grupo-saude-v4-validacao-sintetica-2qhnv62ds-grupo-saude.vercel.app/exemplos-declaracoes.html).
- [Exemplo de Antiguidade](https://grupo-saude-v4-validacao-sintetica-2qhnv62ds-grupo-saude.vercel.app/declaracoes-exemplos/seniority.pdf).
- Deployment `dpl_CKSR727Gr8gMKXFzG6PUKpXh8Tah`, exclusivamente staging. HTTP 200 e comparação integral de conteúdo em 23 endereços, incluindo os 15 PDFs, galeria, versão e módulos alterados.

A galeria é um recurso auxiliar do pacote de preview. Todos os seus PDFs são gerados pela fixture versionada `tests/declaration-layout-examples.cjs`, com uma lista explícita de 15 nomes, sem consultar fichas reais. Não representa armazenamento privado operacional nem emissão de declarações finais. As ligações e os ficheiros servidos foram verificados; a galeria estática não foi apresentada como um novo módulo funcional da aplicação.

## Ficheiros alterados

`finance-core-v4.js`, `hr-declarations-core-v4.js`, `hr-declarations-ui-v4.js`, `hr-declarations-v4.css`, `hr-portal-core-v4.js`, `index.html`, `styles.css`, `package.json`, `.github/workflows/v4-stabilization.yml`, `tests/declaration-layout-examples.cjs`, `tests/declaration-layout-pdf.py`, `tests/hr-declarations-browser.py` e os relatórios desta entrega.

O CSS anterior específico das declarações foi substituído pelo ficheiro partilhado, não duplicado. O serializador PDF e os controladores/pedidos existentes foram reutilizados. Não houve alteração às fontes de dados, permissões, documentos guardados ou outros módulos. Novos pedidos registam a revisão de conteúdo; os antigos conservam o texto original para não invalidar snapshots apenas por esta mudança de apresentação.

## Segurança

Branch de desenvolvimento limpa e sincronizada após a entrega. PR #13 em rascunho. Main preservada em `84fba5a2d6d7afcb0723ca312f4e617acc22823d`. Proteção e configurações dos projetos Vercel verificadas e inalteradas. Sem credenciais, dados pessoais reais, emails, migrações ou serviços de produção ativados.
