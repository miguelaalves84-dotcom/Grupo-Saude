# Candidatos compactos, filtros clínicos e ligação à Agenda — 05/11/2026

Base: `b467b14658dcf8ef9103049fd2ee919ad4ee204e`; branch `dev/v4-stabilization-20261017`; PR #13 em rascunho.

## Auditoria objetiva e reutilização

O funil já tinha cinco etapas, pesquisa contextual, controlador Pointer Events, seletor de mudança de etapa e um editor completo. A Agenda já tinha permissões por perfil/clínica, duração, validação de conflitos, histórico e notificações derivadas pelo Centro de atenção. Não existia uma operação que gravasse candidato e compromisso conjuntamente. O adaptador sintético de comunicações também não filtrava todos os acessos aos candidatos por clínica, apesar das proteções existentes no serviço autenticado.

Reutilizaram-se os dois domínios e os mesmos arrays `candidates` e `agendaEvents`, sem tabelas, listas ou sistemas de notificação paralelos. O módulo `recruitment-workflow-v4.js` coordena-os sem IO externo.

## Funcionalidades implementadas

### Clínica, pesquisa e funil

- Filtro «Clínica» / «Todas as clínicas autorizadas», combinado com a pesquisa existente e o filtro de etapa.
- Leitura, edição, importações repetidas e conversão verificam o âmbito clínico no domínio/adaptador sintético, incluindo tentativas por identificador direto. As alterações de clínica passam pela ficha existente e conservam antes/depois no histórico.
- Processos históricos sem associação confirmada não recebem uma clínica inventada: apenas o CEO os pode consultar para corrigir. Novas importações pela interface exigem clínica.
- Cartões compactos com nome, função, clínica, etapa e entrevista agendada, quando disponível. A ficha abre pelo botão principal ou pela ação contextual já existente.
- A pega de toque/rato e os formulários de confirmação existentes permanecem; o seletor e as ações secundárias ficam num detalhe recolhível por cartão.
- Cinco colunas compactas, listas com scroll próprio e contadores de resultados por etapa. No telemóvel, seletor de coluna e uma etapa apresentada de cada vez; não foi criado outro funil.
- Filtros não reescrevem o campo de pesquisa nem redesenham o funil a cada tecla. O binding existente preserva composição e cursor.

### Entrevista e Agenda — apenas ambiente sintético

- Seleção de entrevistador autorizado, data/hora Portugal, duração, clínica e modalidade presencial/tele-entrevista.
- Criação de um compromisso na Agenda existente, com ligações candidato ↔ entrevista ↔ compromisso.
- Reagendamento, cancelamento e reagendamento após cancelamento conservam o mesmo compromisso e os históricos/notas. A gravação repetida ou de notas não duplica o compromisso nem a notificação.
- Conflitos de horário são verificados antes da gravação, incluindo colisões noutras clínicas; a mensagem não revela detalhes de compromissos reservados.
- Uma única escrita do estado local após validação completa: se houver erro, ficam por alterar candidato e Agenda.
- Notificações do entrevistador reutilizam `agenda-change` e o Centro de atenção existente, incluindo confirmação da notificação na própria agenda quando o autor é o destinatário.
- A Agenda apresenta o compromisso e um acesso ao processo para RH autorizado. As alterações de compromissos de recrutamento passam pelo editor da entrevista, impedindo alterações genéricas que desalinhem as duas fontes.

## Permissões e limites reais

A Agenda aprovada continua limitada a CEO, Administração e Administrativas autorizadas. O seletor não concede Agenda a Médico, Técnico ou Call Center. A Administração continua limitada às clínicas autorizadas no recrutamento; apenas o CEO consulta processos sem âmbito clínico para regularização.

A ligação funciona no mesmo estado sintético/local. Não significa autenticação central, persistência entre dispositivos ou integração PostgreSQL. O transporte autenticado de recrutamento identifica a ligação à Agenda como pendente e não a apresenta como implementada. Não foram modificados serviços SQL, migrações, credenciais, Neon, emails ou calendários externos. Dados guardados noutro domínio de preview não são automaticamente transferidos.

## Testes executados

| Suite | Resultado e âmbito |
|---|---|
| `node tests/recruitment-workflow.cjs` | 9 grupos aprovados: seis perfis, concessões/remoções, clínicas, 100 candidaturas, filtros combinados, alteração clínica auditável, compromisso único, notas, conflitos, cancelamento/reagendamento, mudança de entrevistador, DST e associações forjadas. Estado em memória. |
| `node tests/runtime.cjs` | 109 verificações aprovadas: JavaScript real com DOM simulado; inclui formulário com entrevistador/duração/atalho, gravação pelo adaptador real, Agenda consultável pelo destinatário e funil com 100 cartões/50 autorizados para Administração. |
| `node tests/recruitment.cjs` | 41 aprovados: CV sintético, domínio/API, SQLite temporário, fornecedor de email simulado; sem PostgreSQL, email ou caixa reais. |
| `node tests/agenda.cjs` | 8 grupos aprovados, mais proteção API dos seis perfis e bloqueio de backend sem configuração. |
| `node tests/hr-management.cjs` | Aprovado; âmbito e regras de RH preservados. |
| `node tests/text-editing.cjs` | Aprovado; composição/binding/preservação da escrita. |
| `node tests/syntax.cjs` | 280 JavaScript aprovados. |
| `npm run build` | 120 assets estáticos; backend, segredos e documentos excluídos. |
| `git diff --check` | Aprovado. |

O ensaio de projeção efetua 90 consultas sobre 100 candidaturas, sem duplicar ou alterar a fonte. O tempo observado é da ordem de dezenas de milissegundos neste executor Node; não constitui medição de desempenho do navegador, carregamento de 100 PDFs reais ou capacidade do armazenamento local.

Não executados: Chromium, capturas, medição visual/fluidez e gestos em computador/tablet/telemóvel nos dois temas. O Chromium permanece bloqueado pelas permissões da sandbox e não voltou a ser iniciado. A validação visual e de toque no tablet é obrigatória antes de considerar essa parte aprovada.

## Ficheiros e segurança

Alterações nos componentes existentes: `clinic-hr-architecture.js`, `communications-v4.js`, `recruitment-core-v4.js`, `recruitment-ui-v4.js`, `agenda-core-v4.js`, `agenda-ui-v4.js`, `attention-core-v4.js`, `hr-management-v4.css`, `index.html`. Acrescentada a coordenação pura em `recruitment-workflow-v4.js` e testes em `tests/recruitment-workflow.cjs` / `tests/recruitment-workflow-runtime.cjs`; os testes de navegação/runtime existentes e os comandos de teste foram atualizados.

Apenas desenvolvimento e preview estático sintético. PR #13 em rascunho; sem merge. Main, V3, produção, Neon e credenciais preservados. P0.1 continua bloqueada. Nenhum serviço externo foi ativado, nenhuma migração ou seed remoto foi executado. Aguardar validação antes de qualquer integração real.
