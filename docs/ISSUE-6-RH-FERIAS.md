# Grupo Saúde V4 — tarefa #6

Base: PR #5, commit remoto `53b40dab6c9f49e6890a000b20ab65ebc90aeb82` (conteúdo da correção local `e8a68b6`). Branch `feat/v4-rh-leave-context-issue-6`. PR em rascunho, baseado na branch do PR #5 para permitir revisão apenas destas melhorias. Sem merge, promoção de produção, migração de base de dados ou restauro.

## Alterações implementadas

1. O detalhe do pedido apresenta um calendário mensal navegável, dias pedidos destacados, férias aprovadas/pendentes e baixas de pessoas ativas da mesma clínica/função. Mostra cobertura diária, datas e alertas de sobreposição. Conflitos entre colegas são informativos. Feriados nacionais, móveis e municipais são considerados.
2. Ficha legível com colaborador, clínica, função, período efetivo, dias úteis, estado, pedido, decisão, decisor, motivo/notas, anexo existente e histórico. Pedidos decididos não têm botão Aprovar e a transação também rejeita uma segunda decisão. Uma reversão requer ação e motivo explícitos, com auditoria.
3. Calendários RH e individual abrem o registo exato ao clicar numa ausência. CEO/Administração com `leaveApprove` e `hrManage` podem selecionar apenas os dias a retirar e reagendá-los, com motivo obrigatório. Os restantes dias mantêm-se e o intervalo original/revisões não são apagados. O colaborador com `leaveRequest` pode solicitar alteração das próprias férias; estas continuam intactas até aprovação.

## Problemas eliminados

- Três calendários/fluxos mantinham regras de datas e aprovações diferentes. O planeamento e o calendário RH antigos agora delegam num controlador comum (`hr-leave-ui-v4.js`). O seletor individual preserva a seleção de dias e utiliza o mesmo domínio (`hr-leave-domain-v4.js`).
- Saldos separados ignoravam feriados, contavam alterações como novas férias e consideravam o intervalo entre início/fim mesmo depois de retirar alguns dias. Ficha RH, Meu RH, assiduidade, calendários e aprovações usam os dias efetivos e excluem os registos de alteração do saldo.
- Alguns pontos de decisão antigos permitiam reaprovamento ou escrita sem nova validação. Os fluxos de férias/ausências agora delegam no domínio comum e respeitam o perfil ativo, sem herdar `ceoRealUser`.
- Baixas ajustavam férias sem conservar uma transação reversível. Aprovação/edição de baixa preserva as versões, retira apenas dias coincidentes e recalcula o saldo. Reversões que sobrescreveriam uma alteração posterior são recusadas sem escrita parcial.
- Alterações pendentes já abertas podiam perder o contexto quando o original era entretanto editado. A aprovação compara revisão e dias de base, exigindo nova solicitação quando estes mudaram.
- Ao revogar permissões ou trocar perfil, a ficha privada é fechada e o calendário recalculado para o acesso atual.

## Preservação e limites

Não há migração ou limpeza automática dos registos. `days` explícito é a fonte dos dias efetivos; registos antigos com apenas `start/end` continuam a ser lidos. Cada operação trabalha sobre uma cópia e só grava após todas as validações. Dados personalizados e anexos existentes permanecem.

O saldo mantém dias úteis: o novo período tem de corresponder à quantidade de dias úteis retirada. Não permite duplicar férias do próprio colaborador, sobrepor uma baixa própria aprovada ou ultrapassar o saldo do ano de destino. Considera também dias reservados em pedidos pendentes. Não calcula escalas/turnos: cobertura é uma estimativa de pessoas ativas da mesma função/clínica.

As notificações são internas e dirigidas ao colaborador/CEO/Administração, no armazenamento local já usado pelo protótipo. Podem ser abertas no Meu RH e no Centro de alertas conforme permissões. Não são enviados emails nem acedidas bases de dados externas. O preview usa o localStorage do seu próprio domínio; não partilha os dados locais da produção.

## Verificação executada

- `npm test`: parsing de 43 ficheiros JavaScript e **45 testes** de execução do código real em DOM simulado passaram.
- A suite cobre CEO e os seis perfis configurados: Administração, Administrativa, Call Center, Médico/a, Técnico/a e Básico; abertura direta, troca de perfil, navegação, permissões persistidas, aprovação, recusa, feriados, férias entre anos, reagendamento parcial, conflitos informativos, proteção de dados, saldo, notificações e reversões de baixas.
- `git diff --check` passou. O script E2E também passou a validação sintática Python.
- `npm run test:browser` foi tentado e bloqueado antes de abrir a aplicação: Chromium termina com `setsockopt: Operation not permitted`. Não se afirma validação de navegador ou backend. `tests/browser.py` inclui os fluxos novos para execução num ambiente que permita Chromium, em contextos de teste isolados.
- A aplicação é estática; não existe passo de compilação de framework. As integrações de preview executam o deployment configurado.

## Roteiro para testar no preview

1. Abrir CEO → RH diretamente → Pedidos de férias → Consultar e decidir. Verificar dados, calendário/contexto e navegação mensal.
2. Criar pedidos de colegas da mesma função/clínica, incluindo férias pendentes/aprovadas e baixa. Confirmar que outra clínica/função não aparece no contexto e que um conflito da equipa não impede aprovação.
3. Aprovar um pedido, abrir novamente pelo calendário: não existe Aprovar; existe Reverter decisão com motivo obrigatório.
4. No período aprovado, escolher Reagendar parte das férias. Selecionar alguns dias e um novo intervalo com o mesmo número de dias úteis, indicar motivo e aplicar. Verificar dias mantidos, dias retirados, saldo, original e histórico.
5. No Médico/a, abrir Meu RH → férias próprias → Solicitar alteração parcial. Confirmar estado Pendente, original intacto e ausência de contexto dos colegas. Aprovar/recusar na Administração e verificar o resultado e a notificação do colaborador.
6. Repetir em Administração com permissões concedidas; revogar `leaveApprove`/`hrManage` e verificar que não consegue editar/decidir. Os outros perfis só consultam/requerem alterações próprias com autorização.
7. Aprovar uma baixa que intersete férias, editar o período ou reverter com motivo. Confirmar que apenas os dias sobrepostos são ajustados e que uma alteração posterior nunca é sobrescrita silenciosamente.
