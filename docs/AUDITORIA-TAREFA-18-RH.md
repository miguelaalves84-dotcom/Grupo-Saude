# Tarefa 18 — auditoria prévia e plano mínimo

Base auditada: `bc063f1f`, código `1dbf0cd4`, branch `dev/v4-stabilization-20261017`. Referência funcional: descrição da issue #18. Não foram disponibilizadas imagens VitalSoft nesta tarefa; não se afirma comparação visual direta nem reprodução de um produto externo. Mantém-se o design aprovado do Grupo Saúde.

A execução anterior [41547725914](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41547725914) passou 52 jobs. É evidência dos cenários já executados, não certificação integral de todos os requisitos abaixo. A nova entrega será novamente testada.

| Área | Estado antes | Fonte/controlador e acesso | Achado e decisão |
|---|---|---|---|
| Lista/pesquisa por clínica, perfil e estado | Existe e testada | clinic-hr-architecture.js → V4ClinicHR.showEmployees, hrManage + AccessScope | Falta filtro por departamento/cargo; rótulo Função confunde perfil de acesso |
| Ficha única 360° | Existe e testada | hr-master-v4.js → HRMasterV4.workspace | Reutilizar os oito grupos, documentos, contratos e histórico |
| Meu RH | Existe e testado | hr-separation-v4.js + hr-portal-ui-v4.js, personal | Preservar separado; não conceder gestão a perfis simulados |
| Profissão/perfil/contrato/empresa | Existe parcialmente | HRMaster + payroll-export-core + finance-core | Fontes já separadas; não criar nova ficha ou tabela de clínicas |
| Medicina do Trabalho | Existe e testada nos cenários | hr-occupational-core-v4.js, HRPortalV4.health(true) | Aptidão administrativa, ficha validada, alertas e periodicidade confirmada; sem diagnósticos; reutilizar |
| Documentos, checklist e onboarding | Existe parcialmente | employee-documents-core/UI, document-catalog-core, CommunicationsV4.onboardingForm | Fonte única e validação existentes; entrega/email/arquivo reais não operacionais |
| Cédulas/ERS | Existe parcialmente | hr-master-v4.js + attention-core-v4.js | Número, emissor, validade e comprovativo existentes; regras por profissão não universais; acesso contextual à ficha |
| Assiduidade/escalas/correções | Existe e testada nos cenários | attendance-core/UI, administrative-rosters-core/UI | GPS, pedidos e histórico já existem; reutilizar |
| Banco de horas legal | Parcial | GSAttendanceCore.summary, HRMaster tab tempo | O saldo de ponto não equivale a banco de horas autorizado. Regime/IRCT/regras de constituição e utilização ainda pendentes; não criar crédito/pagamento automático |
| Férias, baixas, conflitos e saldos | Existe e testado nos cenários | hr-leave-domain/UI, vacation planning | Reutilizar calendário e aprovações; sem novo registo de ausências |
| Formação/equipamentos/despesas | Existe e testado nos cenários | hr-development-core/UI | Gestão CEO/Administração; formação individual permitida em Meu RH apenas pela projeção pessoal já aprovada |
| Avaliação | Existe parcialmente | hr-performance-domain/UI | Regras/ponderações e publicação existentes; operação central e processos completos dependem da infraestrutura |
| Declarações/regulamentos/questionários | Existe e testado nos cenários | hr-portal-core/UI, hr-declarations-core/UI | Preservar pedidos/versionamento/assinatura bloqueada e 12 modelos |
| Aprovações centrais | Parcial com falha de isolamento UI legada | approvals-center-v4.js | Lista/ações antigas não aplicam uniformemente âmbito por clínica; falta incluir pedidos institucionais/formação no mesmo índice. Corrigir seleção e delegar decisões aos controladores originais |
| Equipas/responsáveis/organograma | Em falta | Pesquisa nos JS de produção, sem registo organizacional identificado | Implementar metadados referenciais por colaborador/clínica no estado RH institucional existente; sem cópia de pessoas/clínicas/perfis |
| Departamentos/cargo organizacional | Em falta | Nenhuma fonte mestre identificada | Associar à mesma estrutura organizacional; não inferir profissão ou acesso do cargo |
| A minha equipa | Em falta | Nenhuma política de delegação RH aprovada | Vista para gestão autorizada; hierarquia não concede permissões. Acesso delegado a outros perfis exige política explícita, não será presumido |
| Datas comemorativas | Em falta | Não encontrado agendador/opt-out/modelos RH específicos | Pendente de política de privacidade, destinatários e envio. Não simular mensagens nem agendar duplicados |
| Contas/recuperação/autenticação | Parcial/isolada | backend identidade e testes de segurança existentes | Não operacional no preview estático; não ativar contas ao criar hierarquia |
| Titulares/retenção/arquivo | Parcial/preparado | communications retention + security foundations | Sem eliminação automática; prazos e processos reais requerem validação jurídica e infraestrutura |
| Estágios | Não implementado | Sem necessidade operacional documentada | Não criar módulo especulativo |
| Navegação RH | Duplicada/dispersa | header actions + workspace-shell + portalBackofficeEntry + hrApprovalsCard | Concentrar em Colaboradores; mover/reutilizar ações nativas, sem dez entradas novas no menu principal |
| Renderização antiga | Código anterior ainda presente | App.renderHr substituído por V4ClinicHR | Não remover sem testes de dependência. Evitar novas sobreposições; corrigir leitura que grava estado sem ação explícita |

## Plano mínimo, não destrutivo

1. Consolidar o ecrã existente de Colaboradores com navegação interna, lista imediata, filtros adicionais e ligações aos formulários nativos.
2. Corrigir âmbito de contadores/listas/ações da central legada e incluir índices de pedidos sem duplicar decisões.
3. Equipas/organograma: metadados referenciais dentro do estado institucional já existente, permissões no domínio/API, validação de clínica e ciclos, histórico/revisão/idempotência existentes.
4. Ligar Medicina do Trabalho, documentos/cédulas/onboarding, formação/avaliações e configurações aos editores já existentes. Distinguir assiduidade de banco de horas legal.
5. Testar seis perfis e simulação, multiclínica, mutações, filtros, navegação, tablet/telemóvel e temas. PostgreSQL apenas descartável; preview sintético protegido. Sem produção, main ou migrações reais.
