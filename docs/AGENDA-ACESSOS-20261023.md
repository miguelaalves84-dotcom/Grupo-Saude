# Agenda administrativa — âmbito e arquitetura

Módulo independente da agenda clínica de consultas/utentes. Reutiliza os colaboradores, clínicas, seis perfis, permissões, auditoria, centro de notificações e armazenamento de aplicação existentes.

| Perfil efetivo | Agendas autorizadas | Marcações e clínica |
| --- | --- | --- |
| CEO | CEO, Administração e Administrativas | Gestão global; clínica da marcação tem de pertencer ao destinatário; marcação pessoal sem clínica permitida. |
| Administração | CEO, Administração e Administrativas | Mesma gestão global de Agenda, conforme pedido; não altera o âmbito dos outros módulos RH/Financeiro. |
| Administrativa | Própria e outras Administrativas com pelo menos uma clínica ativa comum | Própria pessoal; partilhadas apenas com clínica explícita comum. Não vê marcações pessoais das colegas nem de outra clínica da colega multiclínica. |
| Médico, Técnico, Call Center | Nenhuma | Bloqueados na interface, domínio e API, mesmo com concessão indevida da permissão. |

A permissão `agenda` é configurável para os três perfis elegíveis. Negações explícitas são respeitadas. A simulação CEO usa o perfil efetivo; os acessos de CEO não são herdados. A API existente mantém simulações autenticadas sem escrita.

## Um âmbito por marcação

Cada marcação tem um destinatário e uma clínica (ou âmbito pessoal). Não há cópias por clínica nem uma segunda base de utilizadores. Destinatário e clínica ficam fixos após criação, evitando que o histórico de uma clínica passe a outra. Para mudar esse âmbito, cancelar com motivo e criar uma nova marcação. Datas, hora, duração, título, descrição e local são editáveis; reagendar preserva a versão anterior.

As associações canónicas `clinics[]` prevalecem sobre aliases legados. Uma administrativa da clínica A não passa a aceder à B por existir um `clinicId` antigo diferente na ficha. A colega A+B pode ter marcações B e pessoais que a colega A não vê. Avisos de conflitos só consideram marcações visíveis no âmbito autorizado, sem revelar agendas ocultas.

## Operações

- Calendário dia, semana (segunda a domingo) e mês (42 células); navegação, data e filtros por pessoa, clínica e estado.
- Horários interpretados em `Europe/Lisbon`; validação da mudança de hora, duração e datas; fim à meia-noite exclusivo.
- Criar, editar, reagendar e cancelar com validações; cancelamento exige motivo e conserva o registo.
- Sobreposição de horários exige confirmação explícita; nenhum registo parcial antes dessa confirmação.
- Histórico com autor, data/hora, antes/depois, local, descrição, duração e estado.
- Alteração por outra pessoa gera uma notificação do destinatário no centro existente. Identificador usa evento/revisão/estado; não há contador persistente paralelo. O link abre apenas a marcação autorizada.
- Idempotência e revisão evitam repetição e sobrescrita concorrente. Formulários são invalidados ao mudar de sessão/permissões.

## Persistência e segurança

O preview guarda `agendaEvents` na mesma demonstração local (`grupo_saude_v4_demo_2`), com aviso explícito. Funciona no mesmo navegador, sem prometer sincronização entre dispositivos. Não há Google/Outlook, email real ou dados de utentes.

O contrato `/api/agenda` reutiliza `authorization-service.context`, identidade/permissões do servidor, `FinanceService.people`, clínicas, `app_settings` e `audit_log`. O serviço isolado usa comparação de snapshot e transação serializável. Não cria tabelas nem executa migrações. Não existe fallback do backend autenticado para o armazenamento local.

A rota real permanece desativada sem `GS_AGENDA_ENABLED=true` e configuração integral do backend isolado; produção é recusada. Testes PostgreSQL/API no CI não significam que o preview esteja ligado a uma sessão central operacional. Não se ativou este backend nem se configuraram credenciais/recursos remotos.

## Ficheiros e evidência

`agenda-core-v4.js`, `agenda-ui-v4.js`, `agenda-v4.css`, `api/agenda.js`, `lib/agenda-service.js`, matriz de permissões e navegação existentes. Testes: `tests/agenda.cjs`, `tests/agenda-postgres.cjs`, `tests/agenda-rh-browser.py`, regressões dos seis perfis e negações P0. Resultados e SHA efetivamente aprovados constam no relatório de entrega deste bloco.
