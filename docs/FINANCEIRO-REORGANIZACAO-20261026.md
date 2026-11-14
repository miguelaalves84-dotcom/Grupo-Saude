# Financeiro — reorganização e validação sintética (26/10/2026)

Branch: `dev/v4-stabilization-20261017`. PR #13 mantido em rascunho. Base preservada: `54d0919`. Código candidato: `49f6f67e6fbb5b28e048b94f79a4f9d8244bfc17`.

## Cinco módulos e origem dos dados

| Módulo | Implementação consolidada | Fonte e proteções |
| --- | --- | --- |
| Caixas | Fecho diário, total, multibanco, a depositar, depositado, data, anexos, observações, validação/reabertura/histórico; filtro clínico, período e estado. Removida apenas a checkbox de declaração de ficheiro sintético no upload. | O mesmo `clinic_days.cash`; `finance-cash-core-v4.js` e `finance-cash-service.js`. Não cria créditos, pagamentos ou faturação. Aviso sintético, tipos, assinatura, tamanho, checksum e âmbito preservados. |
| Faturas | Upload próprio, validação/recusa por gestores, estado de pagamento derivado da conta, pagamento com data e atalho para conta corrente. Filtros clínicos, período, colaborador, pesquisa e estado. | Os mesmos `financeV2.invoices`/`finance_invoices`, documentos e créditos `finance-invoice`. Duplicados, substituições, documentos originais e regularizações preservados. |
| Recibos de Vencimento | Upload e conferência humana; valor líquido confirmado conhecido cria crédito único; estados Pendente de conferência, Validado sem valor, Por pagar ou Pago; pagamento e data através do mesmo controlador. | Os mesmos `financeV2.payslips`/`finance_payslips`; crédito `finance-payslip` na conta existente. Sem valor conhecido não há dívida inventada. Substituição de recibo pago mantém pagamentos e exige regularização. |
| Conta Corrente | Consulta individual ou consolidada dos colaboradores autorizados, clínica específica ou todas, datas, pesquisa/estado, totais e PDF existente. Ligações para documentos e origens. | O mesmo `current_account_entries`/`financeV2.entries`, saldo anterior e pagamentos sem dupla subtração. Não existe um segundo livro financeiro. |
| Faturação | Totais manuais por clínica/intervalo, bruta − crédito + débito = líquida; correções justificadas e auditadas; comparações clínica/mês/ano. Exclusivo CEO/Administração. | Namespace único `finance_documentary_turnover_v1` no `app_settings` existente e `financeV2.turnover` no adaptador sintético. CAS e auditoria existentes. Intervalos sobrepostos recusados. Sem migrações ou ligação às caixas/contas dos colaboradores. |

## Navegação, permissões e preservação

O menu Financeiro contém Caixas, Faturas, Recibos de Vencimento, Conta Corrente e Faturação. A anterior Gestão financeira permanece acessível em «Operações e aprovações», dentro dos ecrãs autorizados, conservando os controladores, emails, bónus, arquivo e regularizações. Não foi eliminado nenhum processo financeiro.

Faturação é validada no domínio e em `lib/finance-authorization-service.js`, com âmbito clínico e bloqueio de escrita em simulação autenticada. Uma concessão isolada de `financeManage` a outro perfil não transforma esse perfil em CEO/Administração. O modo servidor continua a exigir sessão real, contexto verificado, origem autorizada e configuração isolada; sem isso falha fechado. O preview estático não demonstra autenticação ou segurança entre dispositivos.

A clínica é preservada nos metadados de novos documentos. Registos históricos sem clínica documentada continuam disponíveis em Todas as clínicas; o filtro específico não atribui arbitrariamente um documento multiclínica. Correções a recibos que já têm crédito não podem alterar silenciosamente proprietário, valor ou período. Os valores de upload originais e o histórico são preservados.

Os totais de faturação só são incluídos quando o intervalo registado está integralmente contido no filtro. Não são repartidos artificialmente por dias, meses ou anos. Intervalos que atravessam meses/anos aparecem em grupos próprios, sem inventar distribuições.

## Evidência e limites

- `npm test` e build locais: aprovados para o código candidato; Chromium executado no GitHub Actions, não no sandbox local.
- Testes adicionais: sete grupos: SQL/ficheiros temporários e proxy isolado simulado, papéis, âmbito, idempotência, sobreposição, CAS, valores inválidos, pagamentos e substituição de recibos.
- PostgreSQL: serviço descartável do CI, exclusivamente `127.0.0.1` / `gs_v4_synthetic`, incluindo concorrência na Faturação. Não equivale a persistência central autenticada operacional.
- Nova suite Chromium: seis perfis × computador/tablet/telemóvel × claro/escuro, pesquisa com e sem resultados, filtros, operações de Faturação e histórico, Caixa sem checkbox, acessos e capturas dos cinco módulos.
- A primeira execução detetou uma opção clínica indevida no seletor da Administração; corrigida no commit `4f2c84b3`. A suite antiga de pesquisa selecionava a primeira opção como se fosse uma pessoa: passou a selecionar «Todos os colaboradores», introduzido nesta reorganização. O teste foi corrigido para escolher um ID individual, e foi acrescentada uma verificação funcional separada da consulta consolidada. A execução inicial falhada não conta como aprovação.
- Resultado final efetivo: **43/43 jobs aprovados**, no SHA `49f6f67e`: regressão, PostgreSQL descartável e **41 suites Chromium**. [Execução GitHub Actions](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40418251803).
- Suite financeira nova: **576 verificações aprovadas, zero falhas**, incluindo consulta consolidada por colaboradores autorizados. [Matriz completa](MATRIZ-FINANCEIRO-TESTES-20261026.csv), [jobs e provas](FINANCEIRO-RESULTADOS-20261026.json).

| Perfil sintético | Verificações aprovadas | Falhas |
| --- | ---: | ---: |
| Call Center | 72 | 0 |
| Médico | 72 | 0 |
| Técnico | 72 | 0 |
| Administrativo | 72 | 0 |
| Administração | 144 | 0 |
| CEO | 144 | 0 |

Estas são contagens de verificações, incluindo dispositivos e temas, não de funcionalidades únicas.

## Preview publicado e capturas

**[Abrir preview READY](https://grupo-saude-v4-validacao-sintetica-14mdrjwel-grupo-saude.vercel.app)** — fonte `49f6f67e6fbb5b28e048b94f79a4f9d8244bfc17`, deployment `dpl_7GyRgRZkBhhn2JNa59nHfsCK1BQC`, ambiente staging do projeto sintético. Proteção Vercel Authentication mantida; pode exigir login autorizado Vercel. Não é autenticação operacional do Grupo Saúde.

Página inicial, `/api/version` e seis ficheiros JS/CSS foram consultados no deployment protegido: HTTP 200 e conteúdo exatamente igual ao pacote fonte testado. O manifesto identifica persistência exclusiva deste navegador e backend/escritores reais desativados. [Prova da publicação](FINANCEIRO-PREVIEW-20261026.json).

**[Capturas dos cinco módulos — ZIP GitHub Actions](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40418251803/artifacts/12697540726)**. Contém 30 PNG: cinco módulos × computador/tablet/telemóvel × claro/escuro, além da matriz JSON da suite. Capturas sintéticas automáticas; a transferência para inspeção visual local ficou bloqueada no pedido de rede interrompido, que não foi repetido. A evidência permanece no GitHub Actions até ao prazo do artefacto; consultar a data em `FINANCEIRO-RESULTADOS-20261026.json`. Não é apresentada como validação física Android ou revisão visual manual.

| Módulo | Tablet claro, no ZIP | Tablet escuro, no ZIP |
| --- | --- | --- |
| Caixas | `cash-tablet-light.png` | `cash-tablet-dark.png` |
| Faturas | `invoices-tablet-light.png` | `invoices-tablet-dark.png` |
| Recibos | `payslips-tablet-light.png` | `payslips-tablet-dark.png` |
| Conta corrente | `account-tablet-light.png` | `account-tablet-dark.png` |
| Faturação | `turnover-tablet-light.png` | `turnover-tablet-dark.png` |

## Commits e ficheiros

- `8e6aca27`: cinco áreas financeiras, filtros, faturação documental e pagamentos auditados.
- `4f2c84b3`: clínicas autorizadas, associação clínica documental e comparações.
- `53b77476`: histórico de upload, validação de valores e proteção das correções de origem.
- `49f6f67e`: encaminhamento no proxy, âmbito histórico estrito, estados de depósito e regressões de pesquisa/consulta consolidada.

Apresentação: `finance-ui-v4.js`, `workspace-shell-v4.js`. Domínio e adaptador sintético existentes: `finance-core-v4.js`, `finance-demo-v4.js`. Servidor: `api/v4-finance.js`, `functions/api/finance.js`, `lib/finance-authorization-service.js`, `lib/finance-service.js`, `lib/finance-document-workflow.js`; novo serviço `lib/finance-turnover-service.js` reutiliza o armazenamento de configurações/auditoria existente. Testes: `tests/finance-reorganization.cjs`, `tests/finance-reorganization-browser.py` e suites existentes atualizadas de acordo com os novos comportamentos. Nenhuma migração foi criada ou executada.

## Próximos passos e dependências reais

1. Validar este URL no tablet físico, sobretudo filtros, formulário de Caixa sem checkbox e navegação entre documentos/conta corrente.
2. Configurar e testar, numa fase autorizada própria, autenticação e persistência central, arquivo privado, recuperação e conectores de email. Não foram ativados por esta entrega.
3. Reconciliar explicitamente registos históricos sem clínica ou valor confirmado; nenhuma atribuição foi inventada e nenhum documento/histórico apagado.


O preview utiliza exclusivamente dados e documentos sintéticos e persistência neste navegador. Arquivo privado central, sessões reais entre dispositivos, caixa de email e envio efetivo não estão ativados. Os adaptadores de email existentes foram preservados; não é apresentado envio fictício como real. O upload sintético não protege documentos reais. Não carregar dados pessoais ou documentos salariais reais.

A validação física em Android permanece pendente; Chromium com viewport/toque de tablet não a substitui. Main, produção, domínios, bases reais e credenciais permanecem inalterados.
