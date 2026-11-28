# Aperfeiçoamento da Abertura da Clínica

Base: `0279ecf`, branch `dev/v4-stabilization-20261017`, PR #13 em rascunho. Produção e main excluídas.

## Auditoria e consolidação

| Problema observado | Correção / preservação |
| --- | --- |
| Três cartões com o mesmo médico | Uma ficha por identidade RH, com três categorias. Mantêm-se as linhas internas por categoria e os cálculos de abertura, fecho e estatísticas. Capacidade acessível nos detalhes. |
| Gravações individuais ao perder foco e botões para cada ação | Rascunho em memória por utilizador/clínica/dia. Um único GUARDAR ABERTURA valida equipa, capacidades, contadores e linhas de avaliação/confirmação. Um erro não grava parcialmente nem apaga os valores do formulário. A gravação tem revisão e identificador idempotente; repetição sem alterações não cria histórico adicional. |
| Contador manual interno separado dos pedidos | Fonte única `state.requests` no preview e tabela existente `requests` no servidor. Contagem por clínica e ID, sem nova tabela/lista nem cópia entre dias. O antigo `internalQueue` de compatibilidade não passa a armazenar pedidos. Valores manuais legados preservados em histórico e `legacyManualCurrent`. |
| Consultas a trabalhar/marcar na abertura | Retirado o campo da interface e bloqueadas novas escritas desse contador; dados históricos permanecem. Avaliações, confirmações, espera de tratamentos e suspensos mantêm processos separados. |
| Falta de tarefa ligada à lista interna | Tarefa automática Durante o dia abre a tabela dos pedidos originais. Visto marca o pedido; retirar exige justificação. Registos guardam responsável, instante, clínica, estados e número anterior/novo. Zero pendentes conclui a tarefa, correção reabre. |
| Possibilidade de conflito entre filas/contadores | Nenhum pedido é copiado para `pendingRows`. Estas filas continuam exclusivas de avaliações e confirmações. Leituras deduplicam IDs sem apagar registos antigos. Datas originais mantidas e pedidos anteriores assinalados. |
| Risco de gravação parcial no servidor | Serviço existente partilha o domínio, carrega apenas pedidos da clínica autorizada e atualiza `requests` e `clinic_days` na mesma transação. Comparação de versões/dados e validação final de todas as alterações, com rollback em conflito. Sem migração adicional. |

A lista interna inclui estados de consulta ainda não concluídos: Novo pedido, Por contactar, Contactado, A aguardar vaga, Proposta de consulta, Lista interna, Sem resposta e o estado legado Pedido de Consulta. Marcados continuam consultáveis para correção/histórico, sem contar; Recusou, Cancelado, Suspenso, arquivados e inativos não contam. Não confundir com utentes suspensos de tratamentos.

Não foram apagados ficheiros ou históricos. O fluxo existente `App`, domínio partilhado, serviço, tabelas RH e tarefas foi reutilizado. A gravação de atualizações Durante o dia permanece disponível; apenas a abertura passou a uma submissão integral.

## Verificação e limites

- Testes de domínio: submissão conjunta, rollback, repetição, referências num envio, contadores derivados, vistos, correções, autoria, datas e isolamento, além dos cenários anteriores.
- Chromium: controlos reais em computador, tablet e telemóvel; seis perfis e temas claro/escuro. Verifica edição compacta, ausência de escrita antecipada, validação, fila canónica, fecho e pendências entre dias. Tablet Android é emulado, não um aparelho físico.
- PostgreSQL descartável: gravação integral, rollback de pedido concorrente, persistência entre atores e isolamento. CI exclusivamente sintético, sem segredos ou ligação a bases reais.
- Aprovação apenas após resultados efetivos do workflow no commit publicado. O link de entrega identifica a execução e o preview exatos.
- Preview estático protegido: dados exclusivamente sintéticos no navegador. Persiste após atualizar nesse navegador; não representa sincronização central entre dispositivos ou autenticação real. API e PostgreSQL são testados separadamente e não ativados no preview. Nenhum envio real, gravação áudio ou IA foi ativado.
