# Separação visual de Candidatos e Colaboradores — 05/11/2026

Base: `02575795dfb8abfe79371e283738069e95e379f9`; branch `dev/v4-stabilization-20261017`; PR #13 em rascunho.

## Causa e correção

As duas entradas reutilizam a mesma vista `hr`. O cabeçalho exterior conservava as ações de gestão dos colaboradores; `HRPortalV4.enhance()` tratava qualquer conteúdo de RH como destino para Backoffice RH; `ApprovalsV4.sync()` voltava a inserir Aprovações RH durante a atualização periódica do funil. Não era necessário recuperar ou recriar o recrutamento.

O renderizador existente passa a identificar explicitamente o contexto da vista. Em Candidatos, o cabeçalho é «Candidatos» / «Recrutamento e seleção». Os menus administrativos do cabeçalho não são apresentados; os componentes automáticos deixam de inserir Backoffice/Aprovações nesse contexto. Ao abrir Colaboradores, o contexto e o cabeçalho são restaurados e os componentes de gestão continuam disponíveis.

A pesquisa contextual existente é reutilizada, sem um segundo campo/motor. Acrescentado filtro de visibilidade por etapa, com limpeza através de «Todas as etapas», sem alterações aos processos. O botão «+ Candidato / CV» e o funil aparecem diretamente, com controlos de pelo menos 44 px e barra adaptável ao telemóvel.

Mantêm-se as cinco colunas e a ordem da fonte canónica, CV, documentos, entrevistas, notas, histórico, conversão e controladores de mudança de etapa. O seletor e o controlador Pointer Events de arrastar por toque não foram substituídos. Não foram introduzidas cópias de candidatos, tabelas, notificações ou controladores.

## Ficheiros

- `clinic-hr-architecture.js`: contexto, cabeçalho e apresentação do funil existente; filtro por etapa e pesquisa partilhada.
- `hr-portal-ui-v4.js`: impedir inserção do Backoffice no contexto Candidatos.
- `approvals-center-v4.js`: impedir inserção periódica de Aprovações RH no contexto Candidatos.
- `hr-management-v4.css`: regras visuais delimitadas ao contexto Candidatos.
- `tests/candidates-navigation.cjs` e `tests/runtime.cjs`: regressões funcionais no DOM simulado existente.

## Validação executada

- `node tests/runtime.cjs`: **106 aprovadas**, incluindo quatro novas regressões de contexto/cabeçalho, cinco colunas, preservação do processo, prevenção de inserção automática, recuperação de Backoffice em Colaboradores, seis perfis e aplicação/limpeza do filtro reutilizando a pesquisa. DOM simulado, não Chromium.
- `node tests/recruitment.cjs`: **41 aprovadas, zero falhas**. Domínio/API, CV sintético privado temporário, SQLite e fornecedor de email simulado. Não foi usado PostgreSQL, email real ou qualquer base Neon.
- `node tests/hr-management.cjs`: aprovado; permissões e âmbito clínico da gestão de colaboradores preservados.
- `node tests/text-editing.cjs`: aprovado; composição e escrita sem ligações duplicadas.
- `node tests/syntax.cjs`: **277 JavaScript** aprovados.
- `npm run build`: **119 assets estáticos**; backend, segredos e documentos excluídos.
- `git diff --check`: aprovado.

Não executados: Chromium, capturas, medições de responsividade em computador/tablet/telemóvel, temas claro/escuro e gesto real de arrastar após esta correção. O Chromium permanece bloqueado pelas permissões da sandbox e não se repetiu o arranque. O preview destina-se à validação manual, sem apresentar estes testes como concluídos.

## Segurança

Sem alterações a main, V3, produção, Neon, credenciais, migrações, seeds ou integrações. P0.1 bloqueada; PR em rascunho; sem merge. Apenas publicação estática sintética em URL de deployment próprio, sem alterar o domínio geral antigo. Os dados de navegador existentes não são eliminados pela alteração; a publicação num novo domínio não transfere automaticamente dados locais de outro preview/dispositivo.
