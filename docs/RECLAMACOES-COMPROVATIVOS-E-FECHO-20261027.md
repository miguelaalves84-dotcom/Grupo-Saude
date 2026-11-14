# Reclamações — fecho da ficha e comprovativos por etapa

Branch `dev/v4-stabilization-20261017`; base preservada `8decc559` (preview anterior de código 40301aea). Implementação incremental: `edfe26a`, `e3bc772`, `850f226e`. Main, produção e dados reais não são destinos desta alteração.

## Correções

- X e Escape têm tratamento específico enquanto a ficha de Reclamações está aberta. O cabeçalho é persistente e a área de toque do X é de pelo menos 48 px. A saída sem alterações fecha a ficha e mantém o funil, filtros e dados guardados. Alterações pendentes exigem confirmação; cancelar mantém os valores. Operações em curso impedem fecho e gravações sobrepostas.
- Cinco seletores de documentos existentes foram substituídos por uploads diretos: receção pela advogada, resposta da advogada, envio ao reclamante, envio à ERS e confirmação da resposta. Cada campo aceita PDF, JPG ou PNG, até 3 MB, validando MIME e assinatura com o componente existente `GSFinanceCore.file`.
- Os ficheiros são validados e a transição é conferida antes de começar a anexá-los. Nome, documento atual, consulta e download ficam disponíveis na etapa. A substituição pede confirmação; recusar preserva a versão atual e o formulário.
- A pré-visualização utiliza Blob URLs revogadas ao fechar, mantendo a ficha e os valores introduzidos. Imagens são apresentadas na ficha; PDF em frame sandboxed, sem remover as proteções. Os downloads preservam os bytes sintéticos testados.
- Cada novo documento fica associado à reclamação, clínica, finalidade/etapa, utilizador e data/hora. Substituições guardam `replacesId` e um evento próprio, preservando documentos e histórico anteriores. O pedido idempotente e a revisão impedem duplicação e substituição silenciosa de versões concorrentes.
- A API utiliza o mesmo mapa de etapas e o mesmo domínio do preview. Rejeita finalidades inválidas, comprovativo original reaproveitado como nova prova de outra etapa e substituição sem a referência atual. Comprovativo de envio sem data não é silenciosamente descartado: a validação recusa a gravação.
- Sem tabelas, cadastros ou controladores paralelos. Foram reutilizados `complaints.documents`, os vínculos SQL existentes, autorização, scanner/arquivo preparados e os componentes atuais de toque e validação.

## Preservação

Não foram removidos documentos, candidatos, reclamações, históricos ou campos válidos. Referências antigas sem classificação continuam preservadas; não são inventadas associações ou datas retroativas. A queixa original não é automaticamente selecionada como comprovativo de uma nova etapa.

O cálculo original de 15 dias corridos em Europe/Lisbon, incluindo fins de semana, feriados e mudanças de hora, permanece no domínio existente. Anexar, substituir e reabrir não reinicia o prazo. As permissões dos seis perfis e o isolamento por clínica permanecem em vigor; Médico, Técnico e Call Center não ganham acesso por esta alteração.

## Testes e diagnóstico

`npm test` e build locais passaram; 21 verificações dedicadas ao domínio Reclamações. A extensão PostgreSQL verifica comprovativo por etapa, substituição, preservação do documento anterior e recusa de upload pelos perfis sem autorização.

Nova suite `tests/complaints-documents-browser.py`: seis perfis × computador/tablet Android horizontal simulado/telemóvel × claro/escuro; criação, X, desistência/cancelamento com rascunho, cinco uploads, ficheiro inválido, requisitos da transição, substituição recusada/confirmada, metadados, consulta, download com igualdade de bytes, recarregamento, histórico e prazo. Usa PDF válido gerado para teste e imagens PNG/JPG sintéticas. As suites anteriores continuam a testar arrastar por toque, seletor de etapa, reabertura e multiclínica.

A primeira execução identificou um erro da configuração Playwright: `service_workers='block'` injeta código que tenta ler `navigator.serviceWorker` também dentro do frame PDF de origem opaca. O erro foi diagnosticado com stack, sem ocultação. A nova suite não injeta esse bloqueio; mantém o isolamento de rede por `context.route`, limitado ao fixture local. O sandbox do PDF não foi enfraquecido.

Código final: `850f226e2b5246133ea66fb59d6ba530b7b3b8bd`. Nova suite: **612 verificações aprovadas, zero falhas**, 36 contextos (seis perfis × três formatos × dois temas). Execução: [40477251481](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40477251481). O resultado integral e o preview são registados após conclusão. Execuções anteriores com falhas ou canceladas não equivalem a aprovação.

## Limitações

Preview exclusivamente sintético, com armazenamento no navegador. Não é arquivo privado central nem persistência entre dispositivos. O backend preparado continua dependente da infraestrutura autorizada; nenhum armazenamento, email ou serviço real foi ativado. Scanner real não foi configurado; o ensaio PostgreSQL usa scanner sintético. Chromium com emulação tátil não é teste num tablet Android físico. A validação física final permanece a cargo do utilizador.

## Entrega confirmada

- Código publicado: **850f226e2b5246133ea66fb59d6ba530b7b3b8bd**.
- GitHub Actions: **45/45 jobs aprovados**, execução [40477251481](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40477251481). As três suites Chromium de Reclamações passaram.
- Nova suite de documentos: **612 verificações, zero falhas**, 36 contextos. Testes de domínio Reclamações: 21. Suite PostgreSQL partilhada de entrevistas/reclamações: 13 cenários, incluindo a nova associação e substituição de comprovativos.
- [Capturas e resultados sintéticos](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40477251481#artifacts), incluindo o artefacto `complaints-documents-browser-synthetic-850f226e2b5246133ea66fb59d6ba530b7b3b8bd`, retenção de 14 dias.
- Preview protegido **READY**: https://grupo-saude-v4-validacao-sintetica-nvdweyoig-grupo-saude.vercel.app
- Deployment `dpl_pxkrFbELviyZAP8RmSLJuqsrwdYy`, staging, no projeto sintético existente.
- **HTTP 200** confirmado em `/`, `/api/version`, `/complaints-ui-v4.js`, `/complaints-core-v4.js` e `/styles.css`. HTML e os três assets conferidos correspondem exatamente ao código testado. Manifesto confirma SHA, 612 verificações e backend/email/arquivo real desativados.

Foi usada publicação por objetos SHA, sem reenvio do pacote integral no pedido e sem alterações de configuração global. A proteção Vercel foi mantida; poderá ser necessário iniciar sessão com conta autorizada. O teste físico no tablet Android continua a ser uma validação distinta, não declarada por estas suites Chromium.
