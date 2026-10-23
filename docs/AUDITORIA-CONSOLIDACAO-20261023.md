# Auditoria e consolidação — 23/10/2026

Branch: `dev/v4-stabilization-20261017`. Base verificada: `e11af05fadaa1aabf76239be4ce23ce8064c998d`. Instruções: PR #13, comentários 6361736649 e 6361858312. PR em rascunho. Não foi alterada a main, produção ou uma base real.

## Âmbito e evidências

Esta entrega é o primeiro bloco da auditoria integral: corrige seleção e origem salarial, repõe a associação de faturação e acrescenta a conferência diária/mensal. Não significa que todas as operações de todos os módulos foram auditadas individualmente.

O inventário reproduzível [JSON](AUDITORIA-CONSOLIDACAO-INVENTARIO-20261023.json) identifica 79 referências de scripts principais, sem includes repetidos, 14 secções estáticas, 21 endpoints, 26 suites Chromium e 46 suites Node identificadas. Identificação de um teste não equivale à sua execução. As entradas dinâmicas não estão limitadas às 14 secções HTML.

Relatórios anteriores consultados: `AUDITORIA-GLOBAL-V4-20261021.md`, `AUDITORIA-GLOBAL-INVENTARIO-20261021.json`, `RH-INVENTARIO-20261020.json`, `PENDENCIAS-PRIORIDADES-20261020.md`, `EXPORTADOR-SALARIAL-20261023.md`. A indicação antiga de Stock ausente foi ultrapassada pelo código atual; não foi reconstruído outro Stock. A matriz histórica dos 14 grupos foi consultada no commit consolidado ebc2df5 e atualizada em [MATRIZ-14-GRUPOS.md](MATRIZ-14-GRUPOS.md).

Antes da sincronização local com e11af05, foram preservados patch, ficheiros alterados e árvore de base num diretório privado fora do repositório. O arquivo local foi verificado byte a byte; não integra o GitHub. Nenhum ficheiro ou histórico de negócio foi apagado.

## Diagnóstico e correções deste bloco

| ID | Prioridade / estado | Problema / correção | Evidência |
|---|---|---|---|
| SAL-01 | P1 corrigido no código | Seleção por remuneração preenchida, incluindo zero explícito, independentemente de profissão/perfil. Vínculo desconhecido fica visível; prestação de serviços encaminhada para faturação, excluída do pacote salarial. Compatibilidade com versões salariais históricas preservada. | `payroll-export-core-v4.js`: candidates/hasGross; `tests/payroll-reconciliation.cjs` |
| SAL-02 | P1 corrigido no código | Removida a reintrodução de valores no modal salarial. Ficha RH guarda os valores existentes e versões com vigência na mesma `hr.payrollContracts`; processamento lê essas versões. Divergência na ficha bloqueia exportação. Não se presume vínculo por nome de contrato. | `hr-master-v4.js`, `payroll-export-ui-v4.js`, captureSource/source/build |
| SAL-03 | P1 corrigido no código | Conferência de todos os dias do período: escala, trabalho, feriados, férias, baixas, faltas justificadas/injustificadas, lacunas, extra aprovada e alimentação. Intervalos sobrepostos não somam ausências duas vezes; discrepâncias bloqueiam. Não cria descontos, pagamentos ou saldos. | review, `attendance-core-v4.js`, `tests/payroll-reconciliation.cjs` |
| SAL-04 | P1 corrigido no código | Feriados reutilizam a regra anteriormente existente de férias; a fórmula foi movida para attendance-core e chamada por HRLeave, sem segunda implementação da regra de conferência. | `hr-leave-domain-v4.js`, `attendance-core-v4.js` |
| SAL-05 | P1 corrigido no código | Conferência incluída em JSON, sétima folha XLSX, CSV por incidência diária, PDF e ZIP. Mantidos os seis separadores originais XLSX, rubricas, histórico, hashes, snapshots e entrega declarada. | `payroll-export-formats-v4.js`, `tests/payroll-formats.py` |
| FAT-01 | P1 parcial | Ficha permite nome próprio/empresa, cadastro de empresas, nome/NIPC/morada/IBAN, vigências, histórico e auditoria. Empresa de faturação distinta da entidade empregadora; nova fatura conserva o titular à sua data. Faturas e movimentos existentes não são reescritos. | `finance-core-v4.js`, `finance-demo-v4.js`, `lib/finance-service.js`, ficha RH |
| FAT-02 | P1 pendente | Anexos continuam no arquivo documental existente da ficha. Falta completar a gestão contextual dos documentos de cada empresa e a persistência central da edição da associação; não existe upload privado remoto ativo no preview. | `employee-documents-core-v4.js`, `lib/employee-documents-service.js` |
| SAL-06 | P1 parcial | Fontes identificadas por tipo/ID/data; acesso à ficha para correções. Falta aprofundar atalhos diretos a cada marcação/escala, resumo agregado de todas as clínicas e regras remuneratórias de ausências validadas juridicamente. | UI da conferência e campo sources |

A alimentação não é inferida de dias úteis. A ficha aceita uma regra explicitamente validada de minutos mínimos e referência; conta no máximo um dia por colaborador, inclusive multiclínica. Sem regra confirmada, apresenta «por apurar» e distingue dias candidatos de dias remuneráveis. Não representa um parecer sobre a regra legal/contratual concreta. Regras mais complexas continuam pendentes.

## Correções após a primeira execução CI

O run 39938910113 aprovou a regressão mas detetou: consulta do cadastro de empresas ao abrir uma ficha própria sem gestão; folgas comuns multiclínica interpretadas como escala em falta; função de renderização mensal definida mas não montada no modal. O commit 2578247 corrige os três problemas. Não foram apresentados como aprovados. São exercitados pela suite RH, PostgreSQL e suite salarial respetivamente.

Na revisão seguinte, corrigidos ainda remoção de remuneração na ficha sem invalidar referência antiga, sobreposição escondida por três ausências parciais e acesso a marcações fora do filtro clínico. Testes específicos acrescentados.

**CAL-01, P0 corrigido no controlador demonstrativo:** as funções exportadas do editor de feriados não validavam o perfil/âmbito, e a anulação removia o registo. `clinic-calendars-v4.js` passa a validar o utilizador efetivo, CEO/Administração, permissão de configuração e clínica, inclusive em chamadas diretas. Não inicia escritas para os outros quatro perfis. Anulação conserva o registo com `active:false` e auditoria. A fórmula duplicada de Páscoa foi substituída pela função canónica já usada pela conferência e férias, com datas UTC. `tests/global-audit.cjs` executa o controlador real nos seis perfis e verifica recusas, âmbito e preservação. Isto não ativa um escritor de calendários autenticado no servidor; essa integração continua pendente.

## Funcionalidades preservadas e duplicações

Mantidos: seis perfis e simulação, documentos e checklists existentes, contratos, calendários, fontes de ponto e correções, movimentos financeiros/bónus, formatos e histórico de exportação, admissões/saídas e dados antigos. Nenhuma migração ou eliminação de dados foi executada.

Consolidada a regra de feriados entre férias e conferência; retirado o formulário paralelo de remunerações do processamento. `users` e `employees` continuam a ser compatibilizados pelos normalizadores existentes; não foram criadas novas tabelas de colaboradores ou incidências. O cadastro de empresas de faturação é distinto do cadastro comercial reservado de fornecedores: não expõe a empresa fornecedora do CEO aos restantes perfis.

Há várias funções com o mesmo nome em closures diferentes; isto não prova código morto. Não foram removidos módulos antigos por comparação nominal. Os wrappers RH/operação e todos os percursos alternativos necessitam de continuar na matriz de regressão.

## Plano por prioridade

1. **P0** — executar a regressão, Chromium dos seis perfis/dispositivos/temas e PostgreSQL descartável; corrigir falhas antes de apresentar preview como validado. Rever acesso direto às funções antigas de calendários/tabelas: encontrar um editor no navegador não demonstra autorização no servidor. Não ativar serviços centrais.
2. **P1 RH/financeiro** — concluir documentos por empresa, atalhos à origem, regras contratuais/fiscais e resumo por clínica; validar toda a cadeia ficha → escala/ponto/ausências → conferência → snapshot → exportação.
3. **P1 restantes módulos** — usar as 26 suites para regressões exercitadas, confrontar inventário de controlos com requisitos de cada módulo e acrescentar testes aos controlos apenas inventariados. Auditar abertura/fecho/espera, Stock/receções/bónus, Reclamações/15 dias, Marketing/Call Center, Tabelas/catálogos, Chat/notificações.
4. **P2** — tratar resultados visuais por viewport/tema; comparar screenshots preservadas com tolerância e revisão humana, sem afirmar baseline universal onde não existe comparação por pixels.
5. **Integração central** — autenticação real, persistência entre dispositivos, arquivo privado, email, backups/restauro e fornecedores externos permanecem separados desta demonstração. Exigem infraestrutura/configuração de testes validada e autorização aplicável.

## Testes e limitações

`npm test`, sintaxe e build são executados localmente; a nova suite cobre dez grupos de cenários de seleção, vigências, horas, feriados, ausências, multiclínica e faturação. A suite salarial anterior preserva dez grupos e valida os cinco formatos com leitores independentes. Resultados definitivos Chromium/PostgreSQL e o SHA de entrega serão indicados no relatório de execução, após GitHub Actions terminar.

O servidor local foi bloqueado pelo sandbox ao criar o socket; a tentativa com permissão adicional foi interrompida. Não foi repetida uma instalação de browsers ou Docker. O workflow usa Chromium pré-instalado e PostgreSQL descartável com dados sintéticos, não bases reais.

Preview estático: armazenamento local sintético, sem autenticação/persistência central, email real, pagamentos ou arquivo privado remoto. Testes PostgreSQL isolados não provam integração central autenticada em funcionamento. Adaptadores de software contabilístico continuam não certificados. Não declarar RH, processamento ou o programa integral concluídos com estas dependências pendentes.
