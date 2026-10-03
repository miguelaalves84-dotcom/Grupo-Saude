# Grupo Saúde V4 — Seleção de profissionais

## Regra funcional

Sempre que um utilizador tenha de selecionar um médico ou técnico já registado no sistema, a interface deve apresentar uma lista de opções em vez de permitir escrita livre.

## Fluxo para consultas

1. A clínica é determinada pelo contexto do utilizador ou escolhida quando o perfil tem permissão para alterar a clínica.
2. O utilizador escolhe a especialidade entre as especialidades disponíveis nessa clínica.
3. O campo de profissional apresenta apenas médicos/técnicos associados à clínica e à especialidade escolhidas.
4. Ao alterar a clínica ou especialidade, a seleção de profissional é novamente validada e, se deixar de ser válida, é limpa.
5. Não deve ser possível gravar um profissional que não pertença à lista válida para aquela clínica/especialidade.

## Objetivo

Reduzir erros de digitação, duplicação de nomes e inconsistências nos relatórios, mantendo uma identificação uniforme dos profissionais em todo o sistema.

## Aplicação

Esta regra deve ser reutilizada nos módulos de Call Center, operação diária das clínicas, agendas, listas de espera e restantes formulários onde sejam selecionados profissionais.
