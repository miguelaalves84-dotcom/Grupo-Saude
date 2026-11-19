# Auditoria — aperfeiçoamento dos sete dashboards

Base preservada: e7e6d6c8; relatório posterior 203df3d8; branch dev/v4-stabilization-20261017.
Validação visual dos sete grupos num tablet Android comunicada pelo utilizador.

| Prioridade | Achado | Fonte / reutilização | Intervenção |
|---|---|---|---|
| P0 | Gráfico de indicadores repete cartões nos seis hubs | module-dashboards-ui-v4.js | Retirar; substituir por análises com significado |
| P0 | Contagens genéricas sem unidade/origem explícitas | module-dashboards-core-v4.js | Metadados, referência temporal e estados indisponíveis |
| P0 | Cabeçalho repete seletor ou mostra título truncado | workspace-shell-v4.js / CSS | Um filtro clínico por dashboard; título legível |
| P0 | Dashboard Geral repete nome como submenu único | workspace-shell-v4.js | Destino direto no grupo, preservando controlo de acesso |
| P1 | RH agrega associações em vez de priorizar gestão | users/employees, leave, documents, hrOccupational | Ativos/inativos, ausências, ocorrências e regularizações |
| P1 | Operação conta jornadas em vez de atividade | GSOperationCore.statistics, rows, workflowRows | Reutilizar estatísticas e pendências canónicas |
| P1 | Reclamações sem prioridade de prazo nos hubs | GSComplaintsCore.timing | Prazo original; tabela clínica e acesso à ficha |
| P1 | Financeiro sem faturação documental no hub | GSFinanceCore.turnover/ledger | Manter fontes separadas; não estimar lucro |
| P1 | Serviços globais representados como contagem zero | Configuração real não operacional | Estados inativos/não verificados; fora dos filtros clínicos |
| P1 | Área pessoal genérica | GSAttendanceCore.dailyPlan e fontes próprias | Horário do próprio e pedidos/documentos próprios |
| P2 | Série mistura entidades diferentes | métricas genéricas | Séries tipificadas e comparação clínica, só com dados suficientes |

Permissões: conservar GSAccessPolicy/EmployeeDocuments, ator efetivo e filtros serverScoped; API GET existente continua bloqueada por defeito. Nenhuma nova tabela, escritor, integração ou migração. Fontes que não são carregadas pelo backend devem continuar indisponíveis; não alegar paridade operacional central.

Não remover cálculos, controladores ou histórico de negócio. Manter todos os atalhos úteis; não converter marcadores sem destino em links. Testar ausência de dados, clínicas proibidas, propriedade, períodos e navegação além da apresentação.
