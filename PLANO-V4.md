# Grupo Saúde — V4

Branch de desenvolvimento: `teste-escrita-chatgpt`

> Regra: não alterar `main`/produção até a nova versão estar testada e aprovada.

## Prioridades

- Dashboard executivo e operacional multi-clínica
- Agenda: vagas e consultas por hora
- Novos pedidos de consulta com registo histórico
- Consultas efetivamente realizadas
- Estatísticas por hora, dia, semana, mês e ano
- Filtros por clínica, terapeuta e especialidade
- Horários dos terapeutas editáveis
- Preparação da integração Clicloud/API e vários tipos de tempos
- Recursos Humanos
- Livro de ponto com geolocalização e assinatura
- Caixa e contas correntes
- Tarefas e marketing
- Persistência/autenticação/backend na fase de integração

## Tarefas operacionais das administrativas

O sistema terá uma área "O Meu Dia" por clínica e por colaborador, com feedback de execução ao longo do dia.

Exemplos fornecidos pela operação:
- Preencher vagas existentes (Planning)
- Ligar lista de espera
- Ligar suspensos
- Ligar último tratamento / credencial de continuidade
- Marcação de consulta de reavaliação (9.º tratamento)
- Confirmar consultas do dia seguinte
- Ligar aos utentes com mais de 3 faltas consecutivas
- Autorizações / faturação de seguros, quando aplicável
- Preencher mapa de pedidos de novas consultas
- Atualização da lista de suspensos
- Atualização da lista de espera
- Preencher plataforma SGTD (Bombeiros)
- Enviar email de faltas / férias

### Comportamento

- Checklists configuráveis por clínica.
- Separação entre tarefas de abertura, tarefas durante o dia e tarefas de fecho.
- Tarefas recorrentes com horário/prazo configurável.
- Responsável e/ou equipa responsável.
- Estados: por fazer, em curso, concluída, não aplicável e atrasada.
- Feedback em tempo real da percentagem concluída por clínica.
- Registo de quem concluiu e data/hora.
- Observações e evidências/anexos quando necessário.
- Alertas para tarefas próximas do prazo e atrasadas.
- Administração/CEO com visão consolidada das clínicas e tarefas pendentes.
- Histórico para consulta e estatísticas de cumprimento.

## Segurança de lançamento

1. Desenvolver fora de `main`.
2. Testar funcionalidades e dados.
3. Validar experiência desktop/mobile.
4. Só promover para produção após aprovação.
