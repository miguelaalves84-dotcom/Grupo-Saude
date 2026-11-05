# Tarefa 18 — consolidação de Recursos Humanos → Colaboradores

## Âmbito e arquitetura

A [auditoria prévia](AUDITORIA-TAREFA-18-RH.md) foi registada antes da implementação. A base `bc063f1f` foi preservada. Não se copiou software VitalSoft nem se afirma uma comparação com capturas que não foram fornecidas: foram aplicados os requisitos funcionais da issue #18 ao design já aprovado do Grupo Saúde.

Colaboradores passa a ter navegação interna: lista, visão geral, equipas/organograma, assiduidade/saldos, férias/ausências, Medicina do Trabalho, documentos/integração, formação/avaliações, aprovações e configurações RH. A lista abre imediatamente. Meu RH mantém a área pessoal e as permissões anteriores.

## Matriz após a implementação

| Área | Resultado implementado | Limitação real |
|---|---|---|
| Lista e filtros | Fonte única das fichas; clínica/perfil/estado existentes; profissão/cargo e departamento acrescentados; pesquisa e limpeza preservadas | Sem integração central ativa no preview |
| Ficha completa | Oito grupos nativos preservados; resumo com estrutura organizacional e ação contextual | Não é uma nova ficha nem uma cópia da ficha anterior |
| Equipas/organograma | Departamento, cargo organizacional e responsável por colaborador/clínica; hierarquia visual; histórico, revisão e prevenção de ciclos | Configuração humana; não se inventam equipas ou responsabilidades |
| A minha equipa | Filtro dos subordinados diretos para gestão autorizada | Hierarquia não concede acesso RH a outros perfis; delegação depende de política aprovada |
| Medicina do Trabalho | Acesso à gestão e fichas administrativas existentes, datas/aptidão/documentos e alertas preservados | Não armazena diagnósticos nem valida assinatura médica |
| Documentos/cédulas/onboarding | Atalhos aos editores e catálogo existentes, sem nova tabela documental | Regras por profissão não universais; arquivo privado/envio real pendentes |
| Assiduidade/escalas/férias/baixas | Reutiliza ponto, escala, pedidos, calendário e ficha individual | Saldo de ponto não é banco de horas legal autorizado |
| Banco de horas | Distinção explícita de saldos e regime legal | Constituição, consumo e pagamento dependem de contrato/IRCT e validação; não implementados nesta entrega |
| Formação/avaliação/equipamentos/despesas | Formulários e controladores nativos acessíveis dentro de Colaboradores | Restrições CEO/Administração preservadas; operação central não ativada |
| Aprovações | Índice de pedidos existentes com detalhe antes de decidir; isolamento por clínica e permissões granulares; atualização após tratamento | Backend só declara as fontes efetivamente carregadas; projeção não substitui controladores de decisão |
| Declarações/regulamentos/questionários | Circuitos existentes e 12 PDFs preservados | Emissão eletrónica assinada continua bloqueada sem fornecedor validado |
| Datas comemorativas | Dependência documentada, sem envio fictício | Agendamento/modelos/opt-out/política de privacidade pendentes |
| Estágios | Não criado módulo especulativo | Necessidade e regras por confirmar |
| Autenticação/arquivo/persistência | Domínio/API testáveis em PostgreSQL descartável | Preview estático não é sistema autenticado entre dispositivos |

## Duplicações, conflitos e segurança

- Reposicionadas as ações nativas, sem recriar formulários de férias, documentos, salários, formação ou Medicina do Trabalho.
- A central antiga listava/decidia pedidos sem aplicar uniformemente a clínica. O índice, a consulta e a delegação passam a validar identidade, colaborador, clínica e ação; permissões de ausências/documentos continuam específicas.
- A estrutura utiliza apenas referências às pessoas e clínicas existentes no estado institucional `hr_institutional_v4`. Não existe nova base de colaboradores ou clínicas. Cargo organizacional não altera perfil, profissão, contrato ou remuneração.
- A projeção organizacional é uma lista permitida de metadados, sem salários ou dados clínicos.
- A leitura do estado deixou de gravar novamente em cada consulta; a normalização inicial necessária aos módulos anteriores foi preservada.
- O contador da central só reconstrói a apresentação quando muda; não se acrescentou outro temporizador de inicialização.
- O fallback antigo `App.renderHr` foi mantido: ausência de dependências não foi demonstrada, pelo que não se fez remoção indiscriminada.
- O identificador legado `BASICO` do catálogo de permissões continua preservado por compatibilidade. Os seis perfis aprovados são verificados explicitamente; não foi criado um sétimo perfil operacional.

## Ficheiros principais

- `hr-management-core-v4.js`: projeção, âmbito, organização, ciclos/revisões e autorização da central.
- `hr-management-ui-v4.js`, `hr-management-v4.css`: navegação interna, filtros, organograma e reutilização de ações.
- `hr-portal-core-v4.js`, `lib/hr-portal-service.js`: comando/projeção no estado institucional existente, transações e revisão já existentes.
- `approvals-center-v4.js`, `clinic-hr-architecture.js`, `hr-master-v4.js`, `hr-portal-ui-v4.js`, `hr-development-ui-v4.js`: integração nos controladores anteriores.
- `tests/hr-management.cjs`, `tests/hr-management-browser.py`, `tests/hr-portal-postgres.cjs`: verificações novas; suites anteriores ajustadas aos novos destinos de navegação.

## Validação e publicação

Código publicado: `66eaec92371de710dbd3ff7d99776dfee148b8f5`. Commits incrementais: `8065df3` (consolidação), `2a2206b` (destinos dos testes) e `66eaec9` (persistência do atalho salarial após editar a ficha). A primeira execução detetou dois testes desatualizados: pressuposto de apenas seis entradas num catálogo que preserva `BASICO` legado, e acesso ao Backoffice na posição anterior. Ambos foram corrigidos sem alterar as permissões nem retirar as verificações funcionais.

Os cenários usam dados sintéticos, seis perfis, três formatos de ecrã e dois temas. Chromium com toque simulado não equivale a validação num Android físico. É necessária validação visual do utilizador no tablet após a publicação.

Main, produção, domínios, bases reais e configuração de serviços reais não fazem parte desta alteração. Não foram criadas migrações nem ativados emails, pagamentos, assinatura ou armazenamento privados reais.


## Evidências finais

- [GitHub Actions — 53/53 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41560367995), incluindo unitários, build, segurança, PostgreSQL descartável e regressões Chromium.
- [Capturas e resultados de Colaboradores](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41560367995/artifacts/13196758210).
- [Medicina do Trabalho e Meu RH](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41560367995/artifacts/13196847957).
- [Regressão de processamento salarial](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41560367995/artifacts/13196803076).
- [Resumo de resultados e verificações HTTP](evidencias/tarefa-18-resultados.json).
- **[Preview sintético protegido READY](https://grupo-saude-v4-validacao-sintetica-43btc9dwa-grupo-saude.vercel.app)**, deployment `dpl_62wNer9DnECKbTrDfaeenVoRAR15`. Página inicial e quatro recursos RH/salários com HTTP 200 e conteúdo exatamente igual ao pacote local. Manifesto confirma o SHA publicado. A proteção Vercel continua ativa; requer acesso autorizado à equipa.

| Perfil | Verificações na nova suite RH aprovadas | Falhas |
|---|---:|---:|
| Call Center | 36 | 0 |
| Médico | 36 | 0 |
| Técnico | 36 | 0 |
| Administrativo | 36 | 0 |
| Administração | 210 | 0 |
| CEO | 204 | 0 |
| Total | 558 | 0 |

Os números contam verificações nos cenários executados, não funcionalidades independentes ou certificação integral do sistema. Incluem seis combinações de dispositivo/tema por perfil. Os perfis sem gestão foram testados sobretudo para preservação da área pessoal e negação de acesso; não lhes foram concedidos novos direitos.

A regressão encontrou ainda um erro real de integração: guardar a ficha de origem podia eliminar o atalho de processamento salarial durante a reconstrução de Colaboradores. O controlador salarial passou a utilizar diretamente a âncora existente e é reconciliado após essa reconstrução. A suite completa de exportação passou novamente, sem alterar cálculos, contratos ou movimentos financeiros.

Revisão dos ficheiros alterados: sem ficheiros `.env`, caches, backups privados ou padrões de credenciais identificados. Pacote estático com 138 referências verificadas, sem backend nem configuração de segredos; conserva os 20 PDFs sintéticos de demonstração anteriores. Não foram executadas migrações nem alterações de produção. PR #13 confirmado em rascunho; SHA de main preservado: `84fba5a2d6d7afcb0723ca312f4e617acc22823d`.

### Próxima validação e pendências

Validar no tablet: lista/filtros, equipas, criação/edição organizacional, acesso à ficha e retorno, Medicina do Trabalho, documentos e aprovações. As capturas Chromium estão nos artefactos; não são capturas de Android físico. Artefactos GitHub sujeitos à retenção configurada.

Continuam pendentes: política de acesso delegado às equipas; regime legal/IRCT do banco de horas; comunicações de datas comemorativas com opt-out; regras completas de certificações por profissão; necessidade operacional de estágios; ativação e validação ponta a ponta de autenticação/persistência/arquivo privado/assinatura/envio de emails. PostgreSQL isolado aprovado não torna o preview estático um sistema central operacional.
