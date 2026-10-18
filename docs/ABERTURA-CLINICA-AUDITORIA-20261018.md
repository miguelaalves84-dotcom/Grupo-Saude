# Abertura da Clínica — auditoria e consolidação

Branch: `dev/v4-stabilization-20261017`; base preservada `a4b17ca`; PR #13 permanece em rascunho.

## Inventário e conflitos verificados antes da implementação

| Origem | Estado anterior | Decisão |
| --- | --- | --- |
| `app.js` | Único ecrã de operação; `days`, `open`, `close`, `taskStatus`, indicadores e auditoria já existentes. Nomes livres; fecho não copiava a equipa. | Conservar e consolidar esse ecrã e essas estruturas. Extrair as regras para `operation-core-v4.js`, partilhado com servidor e testes. |
| `professional-selects.js` | Observer exclusivo de `operationContent`, lista fixa c1/c2/c3 e reconhecimento de eventos inline que já não correspondia às ações seguras. | Retirado apenas do carregamento de `index.html`; ficheiro preservado para histórico. Listas passam a consultar as identidades ativas RH, por clínica e ID. Nenhuma dependência externa encontrada. |
| `validation-fixes.js` | Ocultava os cartões depois da abertura e bloqueava abertura/fecho guardados. | Removidos apenas o observer e o wrapper de bloqueio operacional; mantidas correções de contratos, documentos, auditoria e ponto. A autoria da primeira abertura mantém-se sem impedir alterações auditadas. |
| `scheduled-indicators.js` | Contadores paralelos sem equipa e observer que removia/reinseria o seu próprio cartão repetidamente. | Mantidos horários e entrada de atualização; guarda snapshot do dia canónico, valida permissões e usa eventos existentes, sem observer autorreferente nem segunda fonte de contadores. |
| `gs-enterprise.js`, `clinic-single-source-v4.js`, `clinic-relations-v4.js`, `v4-master-integrations.js` | Catálogos e espelhos de profissionais ligados ao RH e às especialidades; referências antigas sem identidade. | Preservados para pedidos, especialidades e estrutura clínica. A equipa diária usa apenas identidades RH ativas e associadas; nomes antigos ficam consultáveis no histórico e não são convertidos por adivinhação. |
| `hr-master-v4.js`, `hr-form-fix-v4.js` | Ficha RH e sincronização de identidades já existentes; sem capacidade semanal. | Novo separador na ficha existente, sem segundo editor de colaboradores; capacidade em `hr.weeklyCapacity`, com auditoria e edição CEO/Administração. |
| `api/v4.js`, `clinic_days` | Rotas antigas aceitavam JSON livre e fechavam sem validar tarefas. | Rotas encaminhadas para `api/operation.js`/serviço que usa o mesmo domínio e a mesma tabela. Migração aditiva apenas preparada/testada em base descartável; não executada remotamente. |
| `AccessScopeV4`, `RoleAccessAdminV4`, notificações globais | Permissões, âmbito clínico, dashboard e alertas já existentes. | Reutilizados. Operação limita não-CEO às clínicas atribuídas, mesmo em ações diretas. Dashboard distingue consultas médicas dos outros atos; notificações continuam a consultar as tarefas originais. |

## Fluxo implementado

1. Seleção obrigatória de pelo menos um médico e um técnico ativos da clínica, por ID. Três categorias médicas e tratamentos técnicos; sem nomes livres. A primeira abertura conserva utilizador, clínica, data e hora. Mudanças de equipa mantêm as linhas anteriores e o histórico.
2. Capacidades por dia da semana nas fichas RH. Ajustes diários não alteram a capacidade habitual; vagas de hoje determinam marcações atuais e vagas de amanhã são separadas. Capacidade em falta exige configuração ou ajuste explícito.
3. Marcações na abertura conservadas; marcações finais e realizados registados no fecho. Ocupação usa os marcados finais; comparência usa realizados/marcados finais. Faltas são registadas explicitamente, separadas de desmarcações, remarcações e não realização. Preenchimentos acumulados e saldo líquido ficam separados.
4. Suspensos e espera são campos independentes, inicializados uma única vez a partir do fecho anterior da mesma clínica, sem substituir valores já editados.
5. Novas avaliações e confirmações geram linhas identificadas; avaliações antigas são somadas às novas sem cópia de filas. Números de utente e datas de consulta são preservados. As conclusões e reaberturas guardam autor, data/hora e valores anteriores/novos.
6. Pendências anteriores referenciam a fonte original. A interface distingue anteriores, novas, atrasadas e concluídas; o seletor de data permite consultar todo o histórico. Contadores legados são recuperados uma única vez como linhas por identificar, sem inventar números de utente.
7. Catálogo de tarefas existente mantido numa única definição partilhada. Tarefas numéricas concluem a zero e reabrem quando volta a existir trabalho. Fecho exige abertura, resultados e todas as tarefas obrigatórias, incluindo anteriores. O código demonstrativo de exceção deixou de contornar o bloqueio; exceções antigas permanecem nos dados.
8. Estatísticas por dia, semana (segunda-feira), mês, ano, clínica, profissional e categoria, com somas e taxas ponderadas. Dias abertos são provisórios. Zero no denominador apresenta ausência de taxa.
9. Serviço isolado usa a tabela `clinic_days`, política de sessão/permissões existente, controlo de revisão e transação com validação de todos os dias afetados. Não há tabelas diárias paralelas. Escritores reais permanecem desativados.

## Testes e limites

- `npm test`/build e testes do domínio; cenários de 3 avaliações antigas + 5 novas, vários dias, identificadores estáveis, confirmações atrasadas, isolamento por clínica, seis perfis, revisões, reabertura, capacidades e taxas 32/32/30.
- Suite Chromium dedicada usa controlos reais em computador/tablet/telemóvel e temas claro/escuro; verifica ficha RH, equipa, capacidade, filas, outro utilizador simulado, fecho, persistência após reload e estatísticas. Restantes suites de recrutamento, reclamações, RH e permissões mantidas.
- PostgreSQL real descartável no GitHub Actions: concorrência, filas entre dias, persistência entre atores autorizados e auditoria. Resultados só aprovados após execução efetiva no commit publicado.
- Preview exclusivamente sintético, com armazenamento no mesmo navegador e atualização entre separadores da mesma origem. Não representa persistência central entre dispositivos nem autenticação real. A API preparada/testada não está ativada no preview estático; não foram criados recursos ou credenciais. A demonstração não deve receber números de utente ou dados pessoais reais.
- Nenhuma alteração à main, produção, domínios existentes ou dados reais. Sem merge, force push ou migração remota. Não foram eliminados ficheiros ou históricos válidos.
