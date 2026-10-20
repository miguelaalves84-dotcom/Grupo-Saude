# Pendências reais — prioridade após correção da composição da abertura

Base auditada: `110d32c`. Branch `dev/v4-stabilization-20261017`, PR #13 draft.
Instrução P0: https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6290138392
Este documento atualiza prioridades; relatórios anteriores permanecem como evidência dos checkpoints, não regras atuais.

| Prioridade | Área | Estado real | Próximo passo / evidência |
|---|---|---|---|
| P0 | Composição da abertura | Correção implementada no código, sujeita aos resultados efetivos do Actions | Só médicos, só técnicos, ambos e nenhum com justificação. Domínio partilhado, UI, API/PostgreSQL e Chromium dedicados |
| P0 | Capacidade médica | Correção de 110d32c preservada | Médicos só têm três contagens; capacidade/vagas apenas técnicos |
| P0 | Tarefas e fecho condicionais | Implementado | Planning só com técnicos; fecho médico só com médicos; abertura administrativa sem movimentos clínicos fictícios. Pendências administrativas reais continuam preservadas |
| P0 | Publicidade por presença | Implementado: propostas, não publicação | Apenas especialidades presentes e autorizadas; vagas só quando fiáveis de técnicos. Propostas existentes de especialidades removidas são suspensas com histórico e não geráveis, sem apagar versões |
| P1 | Tabelas — destinos e sobreposições | Parcial; falhas confirmadas | Catálogo ainda aponta para contratos; botão estático de permissões sem handler; entradas de especialidades/estrutura sobrepostas. Consolidar controladores sem perder funções |
| P1 | Stock | Não implementado nesta branch, implementação antiga localizada | Recuperar por comparação; não reconstruir nem copiar versões antigas sobre módulos recentes |
| P1 | Matriz 14 grupos | Ausente nesta branch, preservada historicamente | Recuperar a matriz com revisão do estado real, não os antigos rótulos de concluído |
| P1 | Controlos inventariados | Auditoria parcial | A matriz de navegação não demonstra cada operação. Exercitar controlos não aprovados individualmente antes de declarar auditoria integral concluída |
| P1 | Sessões e persistência real | Não validado no preview estático | 180 cenários externos classificados como não testáveis. Necessário ambiente autenticado isolado, credenciais/quota aprovadas e dois utilizadores/dispositivos reais |
| P1 | Uploads privados e retenção | Infraestrutura/validação pendentes | Serviços de scanner, armazenamento privado, cópia verificada, autorizações, conservação e auditoria existentes não devem ser contornados por localStorage |
| P2 | IA real de Marketing/entrevistas | Código parcial, fornecedor real não validado | Transporte testado com mocks; sem credencial, configuração ou autorização de despesas não chamar serviços externos |
| P2 | Imagens IA | Não implementadas | Proposta gráfica SVG local existe e é identificada como tal; não equivale a imagem IA |
| P2 | Google/Meta, publicação, email e transcrição reais | Não ligados/validados | APIs oficiais, permissões, quotas e revisão humana; não inventar métricas, envios ou conteúdo gerado |

## Recuperações antigas localizadas (não integradas)

Origem preservada: `a6edf538b22a2e282b5b93f275a08eb1ac05edf2` / `ebc2df5c38903fd8faf62e17b8b0a0c92faad49b`.

- `stock-core-v4.js`, `stock-ui-v4.js`, `lib/clinic-stock-service.js`, `api/v4-clinic-stock.js`.
- `db/migrations/v4-clinics-stock-001.sql`, `tests/stock-domain.cjs`, `tests/stock-browser.py`.
- `docs/MATRIZ-14-GRUPOS.md`, `docs/BLOCO-04-CLINICAS-STOCK.md`.

Origem de catálogo e Tabelas: `112b4e930d666f371be08e87277d95024e2a806e`.

- `document-catalog-core-v4.js`, `document-catalog-ui-v4.js`, `tables-canonical-controller-v4.js`, `tests/document-catalog.cjs`, `tests/tables-browser.py`.
- Conflito confirmado: o catálogo antigo migra/remove `masterDocuments`; os contratos atuais continuam a usar/recriar essa chave. A UI antiga depende de `GSModuleDemo`. Recuperar exige uma única fonte canónica e adaptação testada; copiar ficheiros diretamente criaria incompatibilidades.

Nenhuma recuperação foi executada neste bloco. Nenhum registo, ficheiro histórico, documento, migração ou tabela foi apagado. Os objetos históricos em falta no Git local são uma limitação do checkout recuperado; as origens acima foram consultadas no GitHub.

## Regras implementadas neste bloco

- Justificação sem profissionais: texto não vazio, máximo 2000 caracteres, guardado em `clinic_days.data.open.administrativeReason` e no histórico com ator/data/hora/clínica; `administrativeOnly` deriva da equipa real, não de um booleano confiado ao cliente.
- Uma categoria ausente não exige campos nem capacidades. O bundle rejeita linhas adicionais/identidades não autorizadas. A seleção vazia sem justificação falha atomicamente; os valores introduzidos são preservados.
- Dados de profissionais retirados permanecem no dia e no histórico com `selected:false`; não são inventadas linhas de substituição. Não se apagam tarefas/status anteriores: tarefas clínicas inaplicáveis deixam de ser apresentadas/obrigatórias.
- Contadores e pedidos administrativos reais de dias anteriores mantêm-se: ausência de profissionais não apaga pendências nem torna o fecho uma exceção às tarefas administrativas obrigatórias.
- Mudanças de equipa e regravações usam a mesma transação/revisão/recibo existente. Propostas mantêm chave clínica/data/especialidade/versão, suspensão/reativação auditada e aprovação humana. Nenhum anúncio é publicado.

## Testes e limites

`npm test`, build, domínio de Operação/Marketing, PostgreSQL descartável e nova suite `opening-composition-browser` (seis perfis, computador/tablet/telemóvel, claro/escuro). Casos: composição simples/mista/vazia/múltipla, recusa sem justificação, fecho, regravação, mudança de equipa e suspensão de publicidade. Os testes antigos de regressão mantêm-se. Aprovação só após resultados efetivos do Actions no commit entregue.

O preview usa dados sintéticos e armazenamento de navegador. Não demonstra login real, partilha entre dispositivos, envio de emails, IA real, publicação ou acesso a produção. Não houve migração remota, novo recurso pago, merge nem alteração de domínio/projeto de produção.
