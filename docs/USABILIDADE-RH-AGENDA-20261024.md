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
- Financeiro independente mantém navegação quando não existe menu lateral. Meu RH também deixa de repetir os botões globais de férias e baixas quando há menu lateral. Rotas e controladores mantidos; nenhuma limpeza de base de dados.

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

Resultados finais e evidências constam abaixo; a aprovação refere-se exclusivamente aos cenários efetivamente executados.

## Regressão encontrada na primeira execução

Commit `85aa48c`, execução [40080138642](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40080138642): 30 jobs aprovados, 3 falhados (Operação, RH follow-up e Fornecedores), ligados à navegação durante mudança/simulação de perfil. O novo ramo de inicialização do RH estava a chamar `showView(hr)` mesmo com outra página ativa. Corrigido para apenas selecionar o conteúdo se RH já estiver ativo, preservando a página e permitindo a limpeza/atualização do módulo atual. Acrescentado teste explícito de preservação da página e uso de toque real no intervalo livre da Agenda em viewports táteis.

A suite Agenda/RH da primeira execução teve 1 158 verificações aprovadas. A nova execução integral é obrigatória; não considerar a versão aprovada pelo resultado parcial anterior.

## Entrega verificada

- **Código/preview:** [`00a3aa9`](https://github.com/miguelaalves84-dotcom/Grupo-Saude/commit/00a3aa9eb70f2dadd1f68a63d0cf39b3da2e8ec0).
- **Preview READY protegido:** [Abrir Grupo Saúde V4](https://grupo-saude-v4-validacao-sintetica-85nt29xzc-grupo-saude.vercel.app).
- **CI aprovado:** [GitHub Actions 40081900962](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40081900962), **33/33 jobs**, incluindo 31 suites Chromium, regressão `npm test`/build e PostgreSQL 17 descartável com dados sintéticos.
- Índice, manifesto, `/api/version` e 14 assets principais comparados com o pacote publicado, byte a byte. CSP mantida. `/api/agenda` e `/api/finance`: 404 esperado no preview estático.
- Deployment: `dpl_AQ5QKNGiJ2rAYGWNwf21wSFW4ydf`, destino `staging`, projeto isolado `grupo-saude-v4-validacao-sintetica`; SSO continua ativo para todos os deployments.
- Não houve Chromium remoto autenticado por SSO: o navegador foi executado no CI isolado com os assets do commit; a verificação do deployment foi HTTP protegido e comparação do conteúdo. Não se apresenta o teste PostgreSQL descartável como persistência central autenticada.

### Resultados específicos

| Perfil | Verificações Agenda/RH aprovadas | Falhas |
|---|---:|---:|
| Call Center | 144 | 0 |
| Médico | 150 | 0 |
| Técnico | 150 | 0 |
| Administrativo | 228 | 0 |
| Administração | 258 | 0 |
| CEO | 264 | 0 |
| **Total** | **1 194** | **0** |

As contagens diferem conforme os acessos permitidos. Casos negativos e simulação CEO incluídos; não se concedeu Dashboard a perfis sem essa autorização.

- Auditoria de perfis: **4 548 aprovados, zero falhas, 180 não testáveis** no ambiente demonstrativo. Estas verificações sobrepõem-se a outros testes e não devem ser somadas como funcionalidades independentes.
- Caixas: **642 verificações**, zero falhas, incluindo proteção do comprovativo e navegação após consolidação.
- Conferência salarial: **13 grupos de cenários**, incluindo valor diário sem mínimo arbitrário, ausências, multiclínica sem duplicação, vigências e compatibilidade contratual.
- Novas fórmulas trimestrais: **6 grupos de cenários**, com quantidades e funções distintas, acesso restrito e bloqueios das situações ambíguas. A interface preliminar foi aberta e consultada; confirmou-se que não cria movimentos financeiros.
- Revisão visual expandida: 12 contextos, zero sobreposições visíveis; 10 interseções fora da área pintada classificadas como recorte; 12 controlos negativos detetados. Não equivale a aprovação visual humana ou comparação universal por pixels.
- Computador, tablet e telemóvel emulados; temas claro/escuro. Toque real via Playwright nos intervalos livres em contextos táteis; reagendamento continua pelo formulário acessível.

### Capturas e evidências

Artefactos sintéticos, com retenção até **07/11/2026**:

- [Capturas e resultados Agenda/RH](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40081900962/artifacts/12555592502).
- [Auditoria dos seis perfis](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40081900962/artifacts/12556080432).
- [Revisão visual expandida](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40081900962/artifacts/12555975865).
- [Caixas e comprovativos](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40081900962/artifacts/12555174189).

### Correções adicionais e rastreabilidade

- `85aa48c`: UX, entidade jurídica, alimentação diária e conferência preliminar das fórmulas.
- `19f62c7`: preservação da página durante inicialização de RH e simulação de perfis.
- `efcb53b`: teste usa Meu RH autorizado, mantendo Dashboard exclusivo; execução 40081018950 com 33/33 aprovados.
- `c7e488b`: compatibilidade de contratos históricos; o teste novo detetou que o campo da clínica contratual não integrava ainda a validação de pedidos repetidos.
- `00a3aa9`: corrigida essa validação; guardar uma alteração não contratual não obriga a nova vigência por preenchimento automático, enquanto alterações contratuais explícitas exigem vigência própria. Pedido reutilizado com outros dados é rejeitado. Execução final 40081900962: 33/33 aprovados.

## Estado e próximos passos

| Pedido | Estado efetivo |
|---|---|
| Agenda intuitiva | Melhorada e testada; criação por toque, pesquisa e três modos; sem copiar assets Setmore |
| Navegação repetida | Consolidados Financeiro, RH e atalhos globais de férias/baixas em Meu RH; rotas e ações contextuais mantidas |
| Entidade empregadora | Cadastro jurídico canónico, preenchimento e correção manual; principal multiclínica explícita; versões anteriores preservadas |
| Alimentação | Cálculo diário e conferência/exportação, sem mínimo arbitrário; revisão contabilística das exceções continua necessária |
| Novas fórmulas trimestrais | **Parciais:** conferência preliminar funcional e testada; **sem nova aprovação/pagamento/API operacional** |

Antes de integrar as novas fórmulas no circuito de pagamento, confirmar regras de população ativa e vigências, entradas/saídas no trimestre, administrativas multiclínica, inelegibilidade por baixa no denominador, atribuição/anulações/devoluções, universo de produtos e arredondamentos. A origem atual de vendas de produtos no fecho cobre os produtos com comissão configurados; consumo total não é prova de venda e não foi convertido em vendas. A tabela histórica de lasers existe no backend anterior, mas não foi ligada nem simulada como importação real neste preview. Falta configurar/validar o editor das vigências unitárias e reconciliar ambas as fontes antes de ativar aprovação/pagamento das regras novas.

O circuito financeiro histórico foi preservado e identificado separadamente; não equivale às novas fórmulas. Não foram criados movimentos diários ou pagamentos em duplicado. Nenhuma fonte desconhecida foi tratada como zero confirmado.

A persistência deste preview é local por origem/navegador; dados sintéticos de previews anteriores permanecem nesses endereços e não são transferidos automaticamente entre URLs/dispositivos. Autenticação real e persistência central continuam fora daquilo que foi ativado nesta entrega.

## Estado do ambiente e segurança final

A sincronização inicial foi interrompida sem mudar a branch; o trabalho foi recuperado e preservado através das ferramentas GitHub. O executor local ficou indisponível posteriormente. Não se reescreveu nem apagou a worktree local: antes de voltar a usá-la, verificar alterações em staging e compará-las com a branch remota atual; não criar commits sobre o checkout antigo sem reconciliação. O código final está recuperável no GitHub na branch autorizada, com todos os commits acima.

Foram verificados os ficheiros alterados e o pacote estático: sem ficheiros .env, backups, bases, caches ou credenciais incluídos. Arquivos privados ficaram fora do GitHub. Nenhum serviço de email, IA, gravação, anúncios, Neon ou escritor real foi ativado.

Main permanece em `84fba5a2d6d7afcb0723ca312f4e617acc22823d`; projeto de produção mantém `updatedAt=1791725971672`. PR #13 permanece em rascunho. Este relatório pode ter um commit documental posterior; o SHA do código servido pelo preview é sempre **00a3aa9**.
