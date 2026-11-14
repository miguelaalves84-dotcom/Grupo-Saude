# Auditoria prévia — RH e dashboards por módulo

Base preservada: `f38cb4f8`, código/preview validado `66eaec92`. Branch `dev/v4-stabilization-20261017`, limpa antes desta alteração. Main e produção fora do âmbito.

| Requisito | Estado anterior / fonte | Intervenção necessária |
|---|---|---|
| Dashboard Geral | Existe, exclusivo CEO/Administração; AccessScope.dashboard e workspace-shell; 11 indicadores, comparação e detalhe | Preservar cálculos; separar no menu dos restantes dashboards |
| Menu principal | Seis grupos, Dashboard dentro de Gestão; acordeão e permissões existentes | Sete grupos; reutilizar organização e acrescentar páginas iniciais internas |
| Dashboards de módulo | Marketing/Stock e RH têm vistas próprias; restantes entradas abrem listas/formulários | Projeção agregada, sem nova base; atalhos para origens, filtros, gráficos e estados vazios honestos |
| Colaboradores/Meu RH | Consolidados na tarefa 18, fichas únicas e áreas separadas | Preservar; reutilizar editores e fontes |
| Diuturnidades | Versões contratuais contêm seniorityCents; processamento/PDF já importam valores confirmados | Falta cálculo com regime validado, escalões e vigência; não presumir direito universal |
| Escalas | Editor diário/semanal/mensal, aprovações e monthlyRosters existentes | Falta opção na ficha e seleção explícita; preservar escalas anteriores e compatibilidade de administrativas legadas |
| Assiduidade/banco | Ponto, escala efetiva, ocorrências e saldos; distinção legal da tarefa 18 | Não criar créditos/compensações/pagamentos automáticos |
| Férias/baixas/documentos | Calendários, sobreposições, checklist e catálogo existentes | Reutilizar, não duplicar registos ou ficheiros |
| Financeiro | Conta corrente e versões remuneratórias existentes | Resumos devem reutilizar origem; não misturar caixas/faturação/pagamentos |
| Desenvolvimento/permissões | Editores especializados e histórico existentes | Preservar privilégios e evitar nova ficha paralela |
| Backend | APIs isoladas, preview estático sem autenticação/persistência centrais ativas | Filtros de projeção verificados no servidor; manter runtime/serviços reais bloqueados |

Plano: implementar navegação/projeções reutilizáveis; completar opção de escalas e regras explicitamente validadas de diuturnidades; testes domínio/API/Chromium e regressões; publicar só preview sintético protegido. Comparações/tendências sem dados devem indicar ausência de registos, nunca crescimento inventado. Zero dados reais ou migrações.
