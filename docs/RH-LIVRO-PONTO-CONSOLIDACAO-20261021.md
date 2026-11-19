# RH e Livro de Ponto — consolidação em desenvolvimento

Branch exclusiva: `dev/v4-stabilization-20261017`. PR #13 em rascunho. Não houve merge, migração real, ativação de credenciais ou publicação em produção.

## Fase 1 — auditoria preservada

Matriz e inventário: [auditoria](RH-AUDITORIA-EXCELENCIA-20261020.md), [inventário de ficheiros](RH-INVENTARIO-20261020.json), commit `c51602a`.

O funil de cinco etapas, arrastamento tátil, entrevistas, calendários, regras de férias/baixas, catálogo e contratos existem na base atual. Não foram substituídos por versões antigas. O histórico local contém objetos ausentes; a comparação histórica foi feita também pela API GitHub. Não foi feita limpeza de dados.

## Fase 2 — incremento implementado

| Funcionalidade | Estado efetivo | Código |
|---|---|---|
| Confirmação única e sequência entrada/almoço/regresso/saída | Implementada na demonstração e domínio partilhado | `attendance-core-v4.js`, `attendance-ui-v4.js` |
| GPS pontual na entrada e almoço; saída sem GPS/manual justificada | Implementado, sem guardar novas coordenadas precisas | mesmos ficheiros |
| Entrada antes de horário menos cinco minutos | Recusada pelo domínio | `attendance-core-v4.js` |
| Saída temporária e regresso | Eventos separados e ocorrências auditáveis, sujeitos a decisão | mesmo domínio/controlador |
| Regularização por falta de GPS ou ponto esquecido | Pedido explícito; não cria marcação antes de aprovação | mesmo domínio/controlador |
| Correção estruturada | Pedido e decisão preservam o evento original; apresentação projeta a correção | mesmo domínio/controlador |
| Aprovações CEO/Administração | Papel efetivo, ação e clínica validados; atalhos legados encaminhados | `app.js`, `clinic-hr-architecture.js`, `approvals-center-v4.js` |
| Baixa aprovada | Bloqueia marcação; baixa/férias aprovadas não criam défice horário fictício | domínio partilhado |
| Horas, pausas, saldo, alertas de ponto em falta | Implementados para horários do mesmo dia; nenhum pagamento automático | domínio/controlador |
| Livro por dia/semana/mês/ano e data de referência | Histórico individual filtrado; folha Excel XML e impressão/guardar PDF pelo navegador | controlador |
| Escalas | Permissões, validação e histórico; cópia do mês anterior mantém dias existentes | `hr-rosters-overtime-v4.js` |
| API e PostgreSQL | Endpoint preparado, testado em base descartável; desativado por omissão e em produção | `api/attendance.js`, `lib/attendance-service.js` |
| Autenticação e UI central | **Ainda não ligadas neste preview estático** | Dependência do Grupo 1 |

## Consolidação e preservação

- Os escritores antigos do ponto em `App` e `HRSeparationV4` foram substituídos por encaminhamentos para o mesmo controlador. Os respetivos nomes públicos permanecem compatíveis.
- `V4TimeAdmin` encaminha para o mesmo fluxo; deixou de alterar estados sem validar permissões.
- `V4TimeHistory.normalize` passou a produzir uma projeção sem gravar cópias nem inventar proprietário/data. O array histórico antigo não foi apagado.
- A cópia de escalas deixou de substituir integralmente o mês de destino.
- Foi removido o escritor legado de pagamentos/contas correntes/email dentro das horas extra, depois de verificar os chamadores. Os métodos públicos indicam o percurso Financeiro; movimentos antigos e o módulo financeiro validado mantêm-se. Aprovar tempo não significa pagar.
- O painel de gestão e os formulários/calendários de ausências existentes foram preservados. O gestor pode abrir o próprio livro através de botão independente. Documentos e colaboradores são filtrados por âmbito; relatórios médicos identificados como reservados não ficam acessíveis a outro utilizador nesse percurso.
- A API reutiliza `time_entries`, com discriminador para ocorrências, e `audit_log`. Não cria uma segunda tabela de assiduidade. As escritas usam comparação de estado e transação; repetição não duplica eventos.

## Testes e limites

- `npm test`: regressão local e 18 cenários novos de domínio/escalas.
- `npm run build`: build estático; APIs, documentos privados e credenciais ficam fora do pacote.
- Chromium: suite `tests/attendance-browser.py`, seis perfis × três formatos × dois temas; confirmação, GPS sintético, almoço, saída, persistência no navegador, correção e permissões. Resultados só são aprovados quando o job GitHub termina com sucesso.
- PostgreSQL: `tests/attendance-postgres.cjs`, instância efémera `gs_v4_synthetic`, contas e documentos sintéticos. Inclui concorrência, correções, GPS, duplicados, isolamento e baixa. A migração GPS existente é aplicada **apenas nessa base efémera**, nunca por HTTP.
- Testar a API com atores sintéticos injetados valida autorização e persistência SQL; **não valida um fornecedor real de login**.
- Impressão oferece guardar PDF no navegador. A folha exportada é SpreadsheetML `.xml`, aberta pelo Excel; não é um ficheiro `.xlsx`.
- Capturas Chromium são evidências; não equivalem ainda a uma baseline versionada com comparação por pixels.

## Pendências por prioridade

| Prioridade | Pendente | Condição para concluir |
|---|---|---|
| P0 antes de utilização real | Login, recuperação, sessão e UI/API autenticada central | Contas sintéticas reais e testes em duas sessões; nenhuma credencial nesta versão estática |
| P0 antes de utilização real | Escalas e ausências centrais completas | Atualmente a API lê horário da ficha e baixas documentais aprovadas; não representa ainda todo o motor local de férias/ausências |
| P1 Livro de Ponto | Turnos noturnos e desambiguação da hora de inverno | Regras explícitas e testes de calendário; por enquanto horários inválidos são recusados |
| P1 Livro de Ponto | Banco de horas e regras laborais por contrato | Política validada e integração; sem créditos/pagamentos automáticos |
| P1 Livro de Ponto | Relatórios agregados completos e baseline por pixels | Validar totais por período, atrasos/faltas e referências visuais estáveis |
| P1 Ficha 360 | Consolidar os 12 separadores e formação/equipamentos/aptidão | Reutilizar arrays/documentos existentes, acesso a aptidão sem diagnóstico |
| P1 Férias/documentos | Regressão detalhada das regras anteriores e arquivo privado real | Preservar saldos, sobreposição de baixa, catálogo/contratos/checklists e histórico |
| P2 Recrutamento/avaliações | Validar todos os percursos e restrições de resultados | Preservar dezembro, ponderações e ausência de autoavaliação |
| P2 Organização/dashboard | Onboarding/saída, hierarquia, formação e indicadores | Desenvolvimento posterior às prioridades do ponto |
| Dependência externa | Email, assinatura, armazenamento privado e retenção legal | Não apresentar serviços não configurados como operacionais; nenhuma eliminação automática |

A Fase 2 ainda não está integralmente concluída. As restantes fases permanecem em execução/pendentes conforme esta matriz; não se declara o RH completo.
