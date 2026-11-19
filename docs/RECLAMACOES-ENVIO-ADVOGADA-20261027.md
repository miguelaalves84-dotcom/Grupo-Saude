# Reclamações — simplificação do envio à advogada

Branch `dev/v4-stabilization-20261017`; código `41962d786c29990f01990e65921082c8f710f9bd`, a partir do trabalho preservado em `cb6a9f2e`. Não há alterações à main, produção, bases reais ou configuração de serviços.

## Comportamento

A secção operacional passa a chamar-se **Envio à advogada** e apresenta email, data/hora efetivas do envio, comprovativo de envio opcional e o botão existente **Preparar email à advogada**. A data/hora é obrigatória para concluir a etapa existente **Enviada à advogada**. O comprovativo de envio não é obrigatório.

Foram retirados os campos de confirmação de receção pela advogada e o upload do respetivo comprovativo. Não existem exigências ou alertas de receção nessa etapa. **Resposta recebida da advogada** mantém data/hora e upload direto obrigatório da resposta; a cronologia compara a resposta com o envio, sem depender da confirmação retirada.

## Preservação e integração

- `lawyer.receiptAt`, `lawyer.proofId`, documentos e snapshots históricos existentes são preservados ao editar a ficha. Campos retirados não são reintroduzidos por pedidos de atualização nem usados para bloquear novos avanços.
- O antigo comprovativo mantém a sua classificação histórica. Não é convertido num comprovativo de envio. Novos comprovativos opcionais usam `lawyer.sendProofId`/finalidade `lawyerSendProof`, dentro da mesma coleção documental e do mesmo controlador, sem tabelas paralelas.
- Consulta, download, substituição confirmada, versões, identidade, clínica, data/hora e controlo de concorrência existentes são reutilizados.
- O nome/identificador da etapa do funil não é migrado: mantém-se **Enviada à advogada**, preservando referências e históricos existentes. A secção foi renomeada conforme pedido.
- O prazo original de **15 dias corridos**, em Europe/Lisbon, continua a partir da receção inicial. Não reinicia no envio nem na resposta. As permissões dos seis perfis não foram alargadas.

## Validação

Testes de domínio incluem envio sem data recusado, comprovativo opcional, resposta sem confirmação de receção, cronologia da resposta, preservação dos campos/documentos/histórico antigos e rejeição de novos uploads para a finalidade retirada. `npm test` e build locais passaram; 22 verificações dedicadas ao domínio Reclamações.

A suite Chromium mantém computador, tablet tátil simulado e telemóvel, claro/escuro, seis perfis e simulação pelo CEO. Testa casos novos sem campos de receção e casos sintéticos históricos, além dos uploads, consulta/download, substituições, fecho da ficha, transições e prazo. PostgreSQL isolado verifica a nova finalidade de envio com o domínio partilhado.

Nova suite de documentos: **684 verificações aprovadas, zero falhas**, nos 36 contextos. As três suites específicas de Reclamações passaram. Execução: [40484578920](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40484578920). Resultado integral confirmado: **45/45 jobs aprovados**. A publicação via conector Vercel ficou sem resposta e foi interrompida. A consulta posterior confirma que o deployment mais recente continua a corresponder a `850f226e`, não a esta correção. **Não existe novo preview READY confirmado para `41962d7`**. Não foram repetidas novas tentativas de publicação após este diagnóstico. O pacote estático sintético e as referências dos ficheiros estão preservados em `/workspace/complaints-lawyer-20261027/deployment-refs.json`; não contém backend nem ativa serviços reais.

## Limitações preservadas

O preview é sintético e os seus dados são guardados no navegador, sem arquivo privado ou persistência central ativados. Preparar email não significa enviar email real. Não foram ativados serviços externos ou escritores reais. A emulação Chromium não equivale a validação num Android físico.
