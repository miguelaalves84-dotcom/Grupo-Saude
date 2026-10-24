# Usabilidade, Agenda e RH — 24/10/2026

Base: `601c34e`; branch `dev/v4-stabilization-20261017`. Instrução: [PR #13, comentário 6377436109](https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6377436109).

## Diagnóstico e alterações incrementais

| Área | Antes | Alteração | Limite |
|---|---|---|---|
| Agenda | Calendário com largura mínima 1020 px; criação apenas no botão | Grelha mais compacta, pesquisa, blocos identificados por pessoa, criação por toque/clique em intervalo livre no dia/semana e no mês | Reagendamento pelo formulário acessível; não acrescentado arrastamento de marcações |
| Financeiro | Separadores repetiam cinco destinos do menu lateral; Gestão repetia três | Na aplicação integrada, navegação exclusivamente pelo menu lateral; acesso independente `finance.html` conserva navegação própria | Ações relativas a um registo/colaborador mantidas |
| RH | Barra Colaboradores/Candidatos e cartões de entrada repetiam menu | Menu lateral reutiliza os mesmos controladores; entrada RH abre a seleção existente ou Colaboradores | Separadores da ficha individual são contextuais e preservados |
| Entidade empregadora | Campos vazios e sem cadastro jurídico na clínica | `clinics[].legalEntity` no cadastro canónico, com histórico; clínica contratual explícita; preenchimento sem sobrescrever correções manuais ou dados contratuais existentes | Nome comercial não é inferido como entidade jurídica; multiclínica não escolhe primeira clínica |
| Alimentação | Mínimo arbitrário de minutos e referência manual visíveis | Campos antigos ocultos; metadados e contratos preservados. Valor diário vigente × dias com trabalho efetivo validável, uma vez por dia mesmo entre clínicas | Exceções legais/contratuais exigem revisão contabilística; dias pendentes não são liquidados |
| Bónus novos | Circuito histórico por produtos; sem conferência das novas fórmulas | Conferência preliminar contextual, três fórmulas por unidades, origens, divisor, funções contratuais explícitas, alertas de ambiguidades | **Não está concluída a integração das novas fórmulas com aprovação/pagamento ou API** |

Não se criaram novos cadastros de pessoas, contactos, clínicas ou movimentos financeiros. Não se apagaram dados ou código histórico. Não foram ocultados botões de operações sobre registos, filtros de contexto ou subtarefas que não têm destino equivalente no menu.

## Fontes e compatibilidade

- Agenda: `agenda-core-v4.js`, `agenda-ui-v4.js`, `agenda-v4.css`; `agendaEvents` no estado existente; API isolada anterior preservada.
- Entidade: `clinic-master-v4.js`, `hr-master-v4.js`; `payrollContracts[].employerClinicId`, `employerName`, `employerNif` com vigência. Faturação (`billingProfiles`) permanece independente.
- Alimentação: `payroll-export-core-v4.js` reutiliza ponto efetivo, escalas e ausências. Nova projeção inclui `mealAmountCents`, versão da política e origem contratual; exportações antigas guardadas não são reescritas. Valores derivados não criam créditos ou pagamentos.
- Novos bónus: `GSStockClosing.assess`, `stock-closing-v4.js`; leitura de vendas atuais de `days[].stockClosing.sales` (correções preservadas no histórico) e unidades `technicianSales[].lasers` do esquema anterior `technician_sales`. Não somar `others` nem `bonus_value`, que duplicariam produtos ou confundiriam unidades e euros. O preview não importa a tabela remota e não simula essa ligação.
- Função beneficiária explícita `hr.quarterlyBonusFunction` é distinta do perfil de acesso. O cálculo não infere vínculo contratual pelo perfil. A alteração fica na auditoria da ficha.
- Prémio dos produtos usa o snapshot unitário histórico do fecho; lasers exigem vigência `bonusRateHistory`. A edição/configuração das vigências dos lasers e a reconciliação da origem continuam pendentes.
- Financeiro independente mantém navegação quando não existe menu lateral. Rotas e controladores mantidos; nenhuma limpeza de base de dados.

## Fórmulas e decisões pendentes

- Técnico: unidades de produtos atribuídos + lasers atribuídos, multiplicadas pelo prémio unitário vigente em cada origem.
- Administrativa: unidades da clínica × 0,25 €, divididas pela população contratual beneficiária confirmada.
- Administração: unidades de todas as clínicas × 0,50 €, divididas pela população contratual Administração confirmada. CEO não é beneficiário.
- Bloqueios: regra para entradas/saídas no trimestre; administrativas multiclínica; significado temporal de «ativas»; atribuição/devolução/anulação de vendas; cobertura e reconciliação dos lasers; arredondamento/distribuição de frações de cêntimo; vigências das funções e prémios unitários.
- Regra existente de baixa superior a 30 dias permanece visível e bloqueante. Confirmar conformidade legal/contratual antes de pagar.
- **A conferência nova é sempre preliminar e não cria movimentos.** O circuito financeiro histórico e seus snapshots/aprovações foram preservados e identificados como históricos; não se apresenta como implementação das novas fórmulas.

## Segurança e validação

Backup privado verificado antes das alterações: 357 ficheiros; SHA-256 `38460a695b4c92601461ee57f660492b97ba47d1a50b8dfa3bdb37a136845a9c`. Fora do GitHub.

Só dados sintéticos. Sem novos serviços, credenciais, migrações, escritores de produção, merge ou mudança de configuração remota de produção. O preview é local por navegador; não constitui persistência central autenticada.

Resultados CI, SHA e URL serão acrescentados após execução efetiva. Nenhuma aprovação Chromium/PostgreSQL é inferida de código preparado.
