# RH e Livro de Ponto — auditoria e consolidação

Base preservada: `0a9da9c`. Branch exclusiva: `dev/v4-stabilization-20261017`; PR #13 em rascunho. Main e produção fora do âmbito. Checkpoint privado integral de código versionado verificado antes de alterações; nenhum dado, documento, histórico ou movimento é eliminado.

## Fase 1 — diagnóstico antes da implementação

O Git local tem árvores históricas indisponíveis; a consulta do histórico foi feita também pela API GitHub. Foi consultada a árvore integral de `a6edf53`, sem truncagem, e os commits `6bb0ea1`, `ca97bed` e `96d39ea` das escalas/horas extra. As funcionalidades úteis dessas versões estão presentes. Não se justifica restaurar os módulos inteiros por cima das versões mais recentes.

Inventário técnico: [RH-INVENTARIO-20261020.json](RH-INVENTARIO-20261020.json), com funções, pontos de escrita e listeners de 17 módulos RH. Foram também analisados `app.js`, política de acessos, APIs, serviços, schema e testes. O inventário identifica pontos a consolidar; número de listeners isoladamente não prova duplicação.

| Fase / funcionalidade | Estado à entrada | Problema / ação | Prioridade |
|---|---|---|---|
| Funil de cinco estados e toque | Implementado, testes Chromium existentes | Preservar `recruitment-core/ui`, Pointer Events, CV e histórico; não repor sete estados | P0 preservação |
| Entrevistas e conversão em colaborador | Implementado em demonstração e serviços isolados | Preservar notas/consentimento; email, áudio e IA reais dependem de configuração | P1 |
| Livro de ponto | Parcial e com erros | GPS invertido entre saída/almoço; ordem/duplicação frágeis; saída temporária pode ler `open.id` nulo; correção pede texto mas não aplica uma hora estruturada | P0 |
| Aprovação de ponto | Parcial, sobreposta | `App.reviewOccurrence` e `V4TimeAdmin.decide` têm regras divergentes. Centralizar decisões e validar âmbito/permissões | P0 |
| Histórico de ponto | Duplicação de projeções | `timeHistory` copia `timeEntries/timeOccurrences` e pode ficar desatualizado ou atribuir origem sem identidade ao utilizador atual. Preservar o legado e consultar fontes canónicas | P0 |
| GPS servidor | Verificador existente | `api/v4-clinic-gps.js` valida distância mas não grava marcação atómica; conserva coordenadas precisas nas tentativas antigas. Não apagar o legado; minimizar novos registos | P0 |
| Horários e escalas | Parcial | `HRRostersV4` tem escrita local sem guardas, cópia substitutiva e validação insuficiente. Reutilizar `monthlyRosters`, sem nova tabela paralela | P1 |
| Horas extra / banco | Parcial | `HROvertimeV4` permite transições locais sem guardas e tem ligação financeira antiga. Não gerar pagamentos por deteção de horas | P0/P1 |
| Ficha do colaborador | Parcial | Dados, documentos, férias, capacidade e financeiro funcionam; formação/equipamentos são sobretudo atalhos. Falta ligação coesa à assiduidade e aptidão | P1 |
| Férias, baixas e calendários | Implementado local, persistência central parcial | Reutilizar `HRLeaveV4`, calendários e aprovações; preservar feriados, sobreposições e histórico. Não reescrever regras aprovadas | P0 preservação |
| Catálogo e contratos | Implementado local e serviços isolados | Catálogo independente e checklists já recuperados. Preservar IDs/evidências; uploads privados dependem de infraestrutura | P0 preservação |
| Avaliações e dezembro / ponderações | Implementado local, integração central parcial | Preservar versões e ponderações; confirmar reserva de resultados entre colegas e impedir autoavaliação | P1 |
| Formação, aptidão, equipamentos e saída | Parcial / em falta | Consolidar nos dados RH existentes. Aptidão sem diagnóstico médico; não pedir conteúdo clínico ocupacional | P2 |
| Dashboard RH | Parcial | Painel de assiduidade tem contagens e calendários; rever âmbito, regressos do almoço e custos conforme permissões | P1 |
| Meu RH | Implementado local | Preservar separação; ligar livro unificado e documentos sem criar cópias | P1 |
| Login, recuperação e persistência real | Dependência externa pendente | Sessão demonstrativa não equivale a autenticação real. Não configurar fornecedores, credenciais ou bases reais neste trabalho | P0 antes de uso real |

## Decisões de consolidação

1. Um domínio de ponto partilhado entre demonstração e API; marcações/ocorrências existentes são preservadas. Reutilizar a tabela SQL `time_entries` e o motor de permissões, sem uma segunda tabela de assiduidade.
2. Um formulário de confirmação e um livro individual; entradas antigas `App`, `HRSeparationV4`, `AttendanceV4` e `V4TimeAdmin` passam a encaminhar para esse fluxo, após testes.
3. GPS pontual na entrada e no almoço; saída sem GPS. Não usar `watchPosition`, não conservar novos percursos/coordenadas precisas. Guardar apenas resultado da validação e metadados mínimos.
4. Deteção de horas extra não significa aprovação, banco de horas nem pagamento. Regras laborais, convenções e políticas de conservação exigem validação própria; nenhuma é inventada.
5. Exportação PDF/mapa e folha de cálculo devem respeitar o mesmo âmbito do livro. Não exportar dados médicos ou coordenadas.
6. Código só será removido depois de mapear os chamadores e substituir por adaptadores compatíveis. Arrays históricos, documentos e movimentos não são apagados.

## Limites de aprovação

O baseline `0a9da9c` tinha 20 jobs aprovados. Isto não aprova automaticamente os novos cenários de RH. Cada incremento deve executar testes locais e GitHub Actions, incluindo Chromium/servidor/PostgreSQL sintético. O preview continua sem escritores reais e sem dados reais. As fases não são declaradas completas enquanto os requisitos correspondentes estiverem pendentes.
