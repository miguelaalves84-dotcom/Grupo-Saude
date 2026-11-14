# Operação Diária — reorganização de 02/11/2026

Branch: `dev/v4-stabilization-20261017`. Base: `c184bb0f`. Desenvolvimento sintético, sem migrações, escritores de produção ou ligações clínicas externas.

## Auditoria e reutilização

O fluxo canónico é `app.js` → `operation-core-v4.js` → `lib/operation-service.js`/`api/operation.js`. Reutiliza `clinic_days`, revisão/CAS transacional, catálogo RH/especialidades, permissões, histórico visual, tarefas, abertura integral e fecho existentes. Os escritores antigos de `V4DailyOps` já estavam desativados quando o domínio canónico está presente; continuam desativados. Não se criou outro controlador nem tabela.

A lista operacional anterior derivava dos pedidos de Call Center. A nova lista é manual e independente: não converte, elimina nem copia esses pedidos. O acesso aos pedidos anteriores mantém-se no módulo Pedidos, também com atalho contextual na nova lista. O antigo contador automático foi retirado da abertura; o contador operacional deriva dos registos manuais.

## Alterações

- Espera e suspensos passam a identificar explicitamente fisioterapia, também ao apresentar catálogos antigos, preservando os nomes históricos guardados.
- Pedidos manuais com nome, telefone, email, especialidade, notas e visto. O visto arquiva sem criar uma marcação clínica; mantém identidade, autoria, data original e histórico.
- Novas consultas: especialidades ativas da clínica, médicos associados, contagens sem nomes de utentes e totais por médico/especialidade/clínica.
- Seguros: tratamentos prescritos, confirmações incrementais, quantidade faturada/restante, validação do limite, idempotência por operação, histórico e arquivo ao atingir o total. Verificação diária Sim/Não separada do estado definitivo do processo.
- SGTD: Sim conclui; Não mantém pendente. Dispensa requer CEO/Administração com permissão de configuração e justificação auditada.
- Faltas do turno anterior: manhã/tarde, contagens e contactos disjuntos (quem ligou sem contacto anterior). A soma não pode exceder as faltas; corrigir um turno substitui os valores atuais, preservando versões, sem somar novamente.
- Fim de tratamento: introdução manual, número de utente opcional, data, notas e classificação humana Alta/Continua. Por definir bloqueia a tarefa. Grava com GUARDAR ABERTURA, sem botão por linha.
- Pendências e seguros continuam referenciados ao dia de origem; não se copiam ao mudar de data. O fecho apresenta as tarefas obrigatórias pendentes e atalhos de resolução. Dias antigos ainda abertos também têm de satisfazer as verificações antes de um novo fecho; dias históricos já fechados não recebem bloqueios retroativos.
- Históricos recolhidos por defeito; botões de acrescentar compactos e campos alinhados, usando os estilos claro/escuro existentes.

## Calendário e limites

A primeira manhã procura a jornada anterior, considerando dias operacionais existentes, `workingDays` da clínica e feriados nacionais/municipais configurados. Sem semana explicitamente configurada, a base é segunda a sexta; deve ser confirmada para clínicas com outras jornadas. Os contactos são agregados sem identificação individual: a validação impede sobrecontagem numérica, mas depende da classificação humana disjunta.

O preview continua a guardar dados apenas no navegador. Testes PostgreSQL isolados não significam persistência central autenticada ativada. Não utilizar dados pessoais reais.

## Clicloud — fase futura, desativada

Os processos já têm ID estável, clínica, origem manual, data de origem, revisão e histórico. A futura importação deverá usar chave única `(clínica, fornecedor, identificador externo)` no mesmo fluxo e transação, reconciliar possíveis registos manuais com validação humana e preservar correções. Não aceitar origem externa fornecida pelo navegador, não copiar linhas por dia e nunca decidir Alta/Continua automaticamente. Não há credenciais, chamadas, sincronização ou dados Clicloud simulados nesta entrega.

## Validação

`npm test` e build locais executados; 28 cenários de regressão do domínio existente e 10 novos cenários operacionais. O primeiro Actions revelou a necessidade de atualizar os pré-requisitos num teste antigo de fecho de Stock e de tratar pedidos legados sem data sem bloquear a navegação. As correções preservam os registos. A execução local de HTTP/Chromium está bloqueada pelo sandbox (`socket: Operation not permitted`); as suites Chromium e PostgreSQL são executadas no GitHub Actions. Resultado final efetivo: **46/46 jobs aprovados**, no commit `62cc6dd27759243843bbff4db2d31aefe4a3f0cc`. [GitHub Actions](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41450714187).


| Suite Chromium | Verificações aprovadas | Falhas |
| --- | ---: | ---: |
| Operação Diária — regressão | 614 | 0 |
| Composição da abertura | 738 | 0 |
| Novos processos diários | 468 | 0 |
| Total destas três suites | 1820 | 0 |

A nova suite verifica os seis perfis, claro/escuro, computador, tablet horizontal 1280×800 e telemóvel. Usa toque em ações no contexto tátil e verifica escrita com acentos, criação, edição, arquivo, contadores, seguros 2/10 → 10/10, transição entre dias, fecho bloqueado, atalhos, reabertura e recarregamento. Os testes PostgreSQL passam pela API/domínio autenticados em base descartável, incluindo dois atores, isolamento, médicos/especialidades e concorrência na faturação. Não equivalem a uma integração central ativa no preview.

[Capturas e resultados sintéticos](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41450714187/artifacts/13143269368), com retenção no Actions até 16/11/2026. As capturas são de Chromium, não de um Android físico; a validação humana no tablet continua necessária.

## Publicação verificada

- Código publicado: `62cc6dd27759243843bbff4db2d31aefe4a3f0cc`.
- Commits funcionais: `2c139b1`, `f42940c`, `62cc6dd`.
- Deployment: `dpl_BqzwMvjcWbWnkejjrryMEfj2Jpif`, READY, target staging, projeto sintético existente.
- URL: https://grupo-saude-v4-validacao-sintetica-c0p28dwqs-grupo-saude.vercel.app
- HTTP 200 confirmado na raiz, `/api/version`, `app.js`, `operation-core-v4.js` e `design-system-v4.css`. O HTML/JS/CSS recebido é igual ao código local testado.
- Pacote estático de 108 ficheiros, sem backend, API executável, credenciais, cron ou documentos privados. Manifesto identifica Clicloud, persistência central e serviços reais como desativados.
- Proteção Vercel mantida; poderá exigir sessão autorizada. Main, produção e configuração dos projetos preservadas; PR #13 em rascunho.
