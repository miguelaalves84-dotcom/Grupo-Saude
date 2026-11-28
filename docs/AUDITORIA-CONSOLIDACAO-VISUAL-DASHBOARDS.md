# Consolidação visual dos dashboards — auditoria prévia

Base visual validada pelo utilizador: 77e8e861. HEAD inicial 3c1f5c9 (apenas relatório posterior), branch dev/v4-stabilization-20261017 limpa.

| Componente comum | Causa confirmada | Correção delimitada |
|---|---|---|
| workspace-shell-v4.js | Cabeçalho recebe rótulo longo do botão de navegação | Nome curto do módulo e espaço reservado; preservar saudação executiva |
| module-dashboards-v4.css | auto-fit expande colunas sem cartões vizinhos | auto-fill com largura mínima confortável e limite de quatro colunas |
| module-dashboards-ui-v4.js | Contexto/serviços e resumo financeiro inseridos como blocos de largura total | Grelha partilhada para contexto; conferência financeira recolhida |
| Serviços de sistema | Textos idênticos repetidos e futuros trabalhos junto da atenção | Estados explícitos; implementações pendentes separadas de incidentes |
| Tabela de Gestão | Nomes de clínicas são texto apesar de existir destino documental | Link seguro pelo controlador de clínicas, condicionado à permissão |

Fontes disponíveis a reutilizar: GSOperationCore.statistics/metrics, dias e profissionais da abertura; GSEmployeeDocuments.issues; HRLeaveV4.balance (apenas apresentação local quando houver enquadramento configurado); GSAttendanceCore.dailyPlan e monthlyRosters. Não alterar regras nem criar fontes paralelas. Backend que não carregue determinada fonte mantém informação indisponível. Sem serviços reais, migrações, pagamentos ou alterações de produção.

Testar dimensões efetivas de títulos/cartões, não apenas contagens de elementos; seis perfis, três formatos, dois temas e capturas de todos os dashboards autorizados.
