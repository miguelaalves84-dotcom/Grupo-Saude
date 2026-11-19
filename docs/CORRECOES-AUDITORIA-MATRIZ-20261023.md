# Matriz atualizada após correções — 23/10/2026

Código 125eee8cd3a4e45e67e358f971971eb8d6250b55 · execução 39974365229. Implementado/testado refere-se a cenários sintéticos; autenticação e persistência centrais não estão ativas. A auditoria original permanece preservada.

[Relatório](CORRECOES-AUDITORIA-ENTREGA-20261023.md) · [CSV](CORRECOES-AUDITORIA-MATRIZ-20261023.csv) · [JSON](CORRECOES-AUDITORIA-MATRIZ-20261023.json)

## Grupo 1 — Identidade, sessão e seis perfis

| ID | Requisito | Estado | Prioridade | Resultado / limite |
|---|---|---|---|---|
| G01-01 | Seis perfis e restrições padrão | IMPLEMENTADO/TESTADO | P1 | Navegação e acessos negativos exercitados separadamente. |
| G01-02 | Concessão e revogação de permissões individuais | IMPLEMENTADO/TESTADO | P1 | Testes de domínio e UI distinguem acesso configurado e efetivo. |
| G01-03 | Simulação CEO sem herdar poderes superiores | IMPLEMENTADO/TESTADO | P0 | Perfil efetivo na UI; view-as API só leitura. |
| G01-04 | Cookies, origem e autenticação API | IMPLEMENTADO/TESTADO | P0 | Testes negativos e fornecedor simulado; não login de um fornecedor real. |
| G01-05 | Login real com contas sintéticas em fornecedor ativo | BLOQUEADO POR INFRA | P0 | Proxy preparado; ambiente integrado operacional não demonstrado. |
| G01-06 | Recuperação real de palavra-passe e email | BLOQUEADO POR INFRA | P0 | Rotas/testes simulados; entrega real e fornecedor não ativos. |
| G01-07 | Expiração e revogação reais entre dispositivos | BLOQUEADO POR INFRA | P0 | Política existe; validação integrada com sessões reais ausente. |
| G01-08 | Persistência da identidade e permissões entre dois utilizadores | BLOQUEADO POR INFRA | P0 | SQL descartável não substitui UI/API central operacional. |
| G01-09 | Negação individual CEO coerente entre UI e domínio | IMPLEMENTADO/TESTADO | P1 | Negações guardadas são autoritativas também para CEO; editor permite configuração; valores 0/1 compatíveis; simulação respeita o perfil efetivo. |
| G01-10 | Configuração pública de inscrição desativada no fornecedor | BLOQUEADO POR INFRA | P0 | Sem fornecedor ativo não há confirmação operacional desta configuração. |

## Grupo 2 — Clínicas, documentos e Dashboard

| ID | Requisito | Estado | Prioridade | Resultado / limite |
|---|---|---|---|---|
| G02-01 | Criação e edição do mestre de clínicas | IMPLEMENTADO/TESTADO | P1 | Percurso em Tabelas e âmbito de gestão sintético. |
| G02-02 | Desativação e preservação de referências clínicas | IMPLEMENTADO/TESTADO | P1 | Referências antigas mantidas sem as autorizar automaticamente. |
| G02-03 | Contactos, morada, horários e GPS | IMPLEMENTADO/TESTADO | P1 | Fichas/validações sintéticas; GPS físico não testado. |
| G02-04 | Centro documental separado do mestre | IMPLEMENTADO/TESTADO | P1 | Gestão → Clínicas apresenta acompanhamento documental; Tabelas abre o mestre existente em modal, sem duplicar dados. |
| G02-05 | Documentos obrigatórios, em falta e validade | IMPLEMENTADO/TESTADO | P1 | Regras e alertas de domínio; consulta sintética. |
| G02-06 | Substituição documental e histórico | IMPLEMENTADO/TESTADO | P1 | Motivo/revisão e conservação das versões. |
| G02-07 | Visualização e download de documentos privados reais | BLOQUEADO POR INFRA | P0 | Arquivo privado não configurado no preview estático. |
| G02-08 | Pesquisa e seleção por clínica autorizada | IMPLEMENTADO/TESTADO | P1 | Clínicas não autorizadas excluídas dos percursos testados. |
| G02-09 | Dashboard com filtros de clínica e período | IMPLEMENTADO/TESTADO | P1 | Totais/séries sintéticos, exclusão de clínicas inativas e papéis não gestores. |
| G02-10 | Dashboard ligado à atividade central real | BLOQUEADO POR INFRA | P0 | Dados do navegador não comprovam atividade operacional do grupo. |
| G02-11 | Histórico do mestre e contadores documentais | IMPLEMENTADO/TESTADO | P1 | Testes com referências e estados preservados. |

## Grupo 3 — Navegação, interface e notificações

| ID | Requisito | Estado | Prioridade | Resultado / limite |
|---|---|---|---|---|
| G03-01 | Grupos do menu e apenas um expandido | IMPLEMENTADO/TESTADO | P2 | Percursos reais do menu, sem duplicar destinos. |
| G03-02 | Meu RH separado de gestão RH | IMPLEMENTADO/TESTADO | P1 | Entrada e formulários pessoais preservados. |
| G03-03 | Seleção imediata após mudar de perfil | IMPLEMENTADO/TESTADO | P1 | Sem depender de voltar ao CEO ou recarregar. |
| G03-04 | Computador, tablet e telemóvel | IMPLEMENTADO/TESTADO | P2 | Viewports Chromium emulados; dispositivo físico é validação distinta. |
| G03-05 | Tema claro/escuro por utilizador | IMPLEMENTADO/TESTADO | P2 | Preferência por identidade e restauração ao alternar. |
| G03-06 | Modais, fecho e navegação sem ecrãs vazios | IMPLEMENTADO/TESTADO | P2 | Critérios das suites de layout e percursos inventariados. |
| G03-07 | 102 diagnósticos de sobreposição RH | IMPLEMENTADO/TESTADO | P2 | 102 falsos positivos individualmente comprovados em secções recolhidas; 60 secções abertas por interação real, sem confirmar nenhum dos 102 como sobreposição renderizada. |
| G03-08 | Conflitos com cabeçalho ao abrir secções RH | IMPLEMENTADO/TESTADO | P2 | Zero interseções efetivamente visíveis no replay dos 12 contextos/60 secções; cabeçalho fora do corpo deslocável. |
| G03-09 | Comparação por pixels de todas as páginas | PARCIAL | P2 | Há capturas e diagnósticos; não existe comparação universal versionada por pixels. |
| G03-10 | Notificações por perfil e estado tratado | IMPLEMENTADO/TESTADO | P1 | Derivação, leitura e resolução em fontes existentes. |
| G03-11 | Notificações em tempo real entre dispositivos | BLOQUEADO POR INFRA | P1 | Contadores locais não são realtime autenticado. |

## Grupo 4 — RH e ficha central

| ID | Requisito | Estado | Prioridade | Resultado / limite |
|---|---|---|---|---|
| G04-01 | Ficha única com dados pessoais/profissionais | IMPLEMENTADO/TESTADO | P1 | Consulta, edição e histórico sintéticos na mesma identidade. |
| G04-02 | Contratos, clínicas, horários e remuneração | IMPLEMENTADO/TESTADO | P1 | Ficha e escalas reutilizadas, com vigências salariais. |
| G04-03 | Separadores por assuntos e secções recolhíveis | IMPLEMENTADO/TESTADO | P2 | Percursos existentes; diagnóstico visual detalhado separado. |
| G04-04 | Dependentes em Dados Pessoais | IMPLEMENTADO/TESTADO | P2 | Localização do campo exercitada na UI. |
| G04-05 | Documentos em falta geridos na ficha | IMPLEMENTADO/TESTADO | P1 | Catálogo/checklist e retorno contextual sem descartar a ficha. |
| G04-06 | Documentos avulsos e prova da cédula | IMPLEMENTADO/TESTADO | P1 | Associação apenas a documentos próprios/elegíveis; anexos sintéticos. |
| G04-07 | Dados de contrato/remuneração com vigência | IMPLEMENTADO/TESTADO | P1 | Alteração a meio do mês sem reescrever versões anteriores. |
| G04-08 | Faturação em nome próprio ou por empresa | PARCIAL | P1 | Domínio e snapshot exercitados; cadastro/associação documental e central ainda incompletos. |
| G04-09 | Cadastro empresarial, NIPC, morada, IBAN e vigência | PARCIAL | P1 | Existe edição sintética e auditoria; não declarar gestão central completa. |
| G04-10 | Documentos próprios de cada empresa de faturação | PARCIAL | P1 | Arquivo da ficha existe; gestão contextual da empresa incompleta. |
| G04-11 | Formação: criar, editar, concluir e histórico | IMPLEMENTADO/TESTADO | P1 | Operações de gestão exercitadas; exclusão dos outros quatro perfis. |
| G04-12 | Regra de formação por contrato e validação legal | PARCIAL | P1 | Política configurável/testada não substitui revisão jurídica do caso concreto. |
| G04-13 | Equipamentos: atribuir, devolver e estado | IMPLEMENTADO/TESTADO | P1 | Fichas/validações/histórico e anexos de gestão sintéticos. |
| G04-14 | Despesas e deslocações: operações e anexos | IMPLEMENTADO/TESTADO | P1 | Fluxos de gestão; não cria pagamentos automáticos. |
| G04-15 | Dados de Formação/Equipamentos/Despesas só para gestão | IMPLEMENTADO/TESTADO | P0 | Negação em UI, domínio e endpoints isolados aos quatro perfis. |
| G04-16 | Medicina do trabalho e aptidão ocupacional | AUSENTE | P1 | Não localizado fluxo dedicado nem proteção específica de aptidão no código executável. |
| G04-17 | Organigrama por clínica e hierarquia | AUSENTE | P2 | Não localizado módulo/fluxo no código executável atual. |
| G04-18 | Checklist completa de saída do colaborador | PARCIAL | P1 | Inativação/retenção existem; não há processo completo de devoluções e saída integrado. |
| G04-19 | Arquivo RH central e gestão noutro dispositivo | BLOQUEADO POR INFRA | P0 | Fichas demo persistem só no navegador. |
| G04-20 | Livro de ponto resumido na ficha 360 | IMPLEMENTADO/TESTADO | P1 | Ficha Tempo usa eventos e correções aprovadas do núcleo canónico; teste Chromium confirma 8h e domínio cobre múltiplos dias. |
| G04-21 | Histórico e auditoria por identificador | IMPLEMENTADO/TESTADO | P1 | Histórico não é associado pelo nome textual de outra pessoa. |

## Grupo 5 — Candidatos e recrutamento

| ID | Requisito | Estado | Prioridade | Resultado / limite |
|---|---|---|---|---|
| G05-01 | Cinco colunas vazias na ordem aprovada | IMPLEMENTADO/TESTADO | P1 | Migração e renderização sintética. |
| G05-02 | Arrastar com rato, toque Android e caneta | IMPLEMENTADO/TESTADO | P1 | Gestos CDP, cancelamento, pan e pega; seletor alternativo. |
| G05-03 | Seletor de etapa para acessibilidade/tablet | IMPLEMENTADO/TESTADO | P1 | Passa pelas mesmas validações do domínio. |
| G05-04 | Histórico de etapa com autor e hora | IMPLEMENTADO/TESTADO | P1 | Alteração e reload preservam os registos sintéticos. |
| G05-05 | CV manual e prevenção de duplicados | IMPLEMENTADO/TESTADO | P1 | Identificador/email e documento original preservados. |
| G05-06 | Importação real de cv@gruposaude.online | BLOQUEADO POR INFRA | P1 | Fila/adapters e testes com Gmail simulado; caixa real não ligada. |
| G05-07 | Extração completa de nome/email/telefone/função/clínica | PARCIAL | P1 | Campos editáveis/validação humana; extração geral de CV não demonstrada ponta a ponta. |
| G05-08 | Agendamento presencial com clínica/morada | IMPLEMENTADO/TESTADO | P1 | Preenchimento da clínica e dados obrigatórios. |
| G05-09 | Tele-entrevista com telefones por entrevistador | IMPLEMENTADO/TESTADO | P1 | Separação dos campos e reutilização por autor. |
| G05-10 | Notificações reais de entrevista e recusa | BLOQUEADO POR INFRA | P1 | Templates/outbox/deduplicação testados com fornecedor simulado. |
| G05-11 | Centro Abrir entrevista, notas e recuperação | IMPLEMENTADO/TESTADO | P1 | Guardar, continuar, histórico e atualização sintéticos. |
| G05-12 | Questionários e critérios por função | IMPLEMENTADO/TESTADO | P1 | Edição de gestão e evidências de respostas, sem decisão automática. |
| G05-13 | Conversão opcional sem ativar acesso | IMPLEMENTADO/TESTADO | P1 | Duplicados, documentos, identidade e associação preservados. |
| G05-14 | Gravação segura com consentimento e conservação | BLOQUEADO POR INFRA | P0 | Desativada até existir infraestrutura validada; recusa não prejudica candidatura. |
| G05-15 | Transcrição portuguesa, resumo e IA em direto | BLOQUEADO POR INFRA | P1 | Serviços externos não configurados; não há transcrições reais aprovadas. |
| G05-16 | Análise sem inferências pessoais ou contratação automática | IMPLEMENTADO/TESTADO | P0 | Limites/flags e ausência de decisões automáticas exercitados. |

## Grupo 6 — Férias, baixas e calendários

| ID | Requisito | Estado | Prioridade | Resultado / limite |
|---|---|---|---|---|
| G06-01 | Pedidos de férias próprios e consulta do estado | IMPLEMENTADO/TESTADO | P1 | Pedido, decisão e histórico sintéticos. |
| G06-02 | Aprovar, recusar, alterar e cancelar férias | IMPLEMENTADO/TESTADO | P1 | Permissões, motivos aplicáveis e preservação de dias originais. |
| G06-03 | Calendários mensal/anual e filtro clínico | IMPLEMENTADO/TESTADO | P1 | Navegação e permissões dos percursos exercitados. |
| G06-04 | Saldos de férias e conflitos por equipa | IMPLEMENTADO/TESTADO | P1 | Cálculos/testes de domínio; regras contratuais específicas exigem validação. |
| G06-05 | Baixa sobre férias devolve só dias afetados | IMPLEMENTADO/TESTADO | P1 | Interseção limitada e histórico preservado. |
| G06-06 | Baixa: prolongar/corrigir/suspender com histórico | IMPLEMENTADO/TESTADO | P1 | Decisões de gestão e justificações. |
| G06-07 | Bloquear ponto durante baixa aprovada | IMPLEMENTADO/TESTADO | P0 | Chamadas diretas e UI testadas; não é controlo médico real. |
| G06-08 | Comprovativos e prazo de entrega/validação | IMPLEMENTADO/TESTADO | P1 | Estados, notificações e revisão de provas sintéticas. |
| G06-09 | Feriados nacionais e municipais por clínica | IMPLEMENTADO/TESTADO | P1 | Regra partilhada e anulação conservada, incluindo autorizações diretas. |
| G06-10 | Retenção legal de comprovativos e dados de saúde | BLOQUEADO POR INFRA | P0 | Política/serviços preparados; infraestrutura e validação legal não ativadas. |
| G06-11 | Saldo concorrente entre utilizadores reais | BLOQUEADO POR INFRA | P0 | SQL isolado e CAS não demonstram dois dispositivos no preview. |

## Grupo 7 — Ponto, escalas e GPS

| ID | Requisito | Estado | Prioridade | Resultado / limite |
|---|---|---|---|---|
| G07-01 | Entrada, almoço, regresso, saída e temporárias | IMPLEMENTADO/TESTADO | P1 | Sequência, confirmação, história e bloqueios por perfil. |
| G07-02 | GPS obrigatório em todas as marcações rápidas | IMPLEMENTADO/TESTADO | P0 | Dentro/fora/recusa/imprecisão e clínica sem GPS nos testes sintéticos. |
| G07-03 | Raio e precisão novamente validados no servidor | IMPLEMENTADO/TESTADO | P0 | Endpoint/domínio com pontos sintéticos, sem coordenadas contínuas conservadas. |
| G07-04 | GPS físico no tablet Android | BLOQUEADO POR INFRA | P1 | Emulação não prova sensor real, precisão, permissões e teclado físicos. |
| G07-05 | Tolerância de cinco minutos antes da entrada | IMPLEMENTADO/TESTADO | P1 | Limite temporal no domínio. |
| G07-06 | Pedido manual disponível fora da clínica | IMPLEMENTADO/TESTADO | P1 | Pedido pendente sem produzir marcação definitiva. |
| G07-07 | Aprovação/recusa de regularização e duplicados | IMPLEMENTADO/TESTADO | P1 | Horas declarada/pedido/decisão separadas; aprovação cria registo uma vez. |
| G07-08 | Correções e horas extra aprovadas | IMPLEMENTADO/TESTADO | P1 | Originais imutáveis e minutos aprovados reconciliados. |
| G07-09 | Escalas diárias, semanais, mensais e em lote | IMPLEMENTADO/TESTADO | P1 | Operações e persistência local testadas. |
| G07-10 | Gestão altera diretamente; colaborador pede aprovação | IMPLEMENTADO/TESTADO | P1 | Justificação só no pedido/recusa; concessão/revogação e notificações. |
| G07-11 | Horário efetivo do dia no Livro de Ponto | IMPLEMENTADO/TESTADO | P1 | Escala vigente/ficha e estado de ausência. |
| G07-12 | Trabalho em várias clínicas sem duplicar identidade | IMPLEMENTADO/TESTADO | P1 | Marcação/âmbito e conferência de turnos separados. |
| G07-13 | Turnos noturnos e atravessar a meia-noite | PARCIAL | P1 | schedule rejeita end<=start e exige configuração própria não concluída. |
| G07-14 | Banco de horas configurável e operacional | PARCIAL | P1 | Saldos/extra são apresentados; não há ciclo completo de crédito/débito validado. |
| G07-15 | Mapas PDF/Excel de assiduidade | IMPLEMENTADO/TESTADO | P1 | Exportação/impressão existentes; compatibilidade fiscal não é inferida. |

## Grupo 8 — Desempenho e questionários

| ID | Requisito | Estado | Prioridade | Resultado / limite |
|---|---|---|---|---|
| G08-01 | Avaliações e questionários reservados à gestão | IMPLEMENTADO/TESTADO | P0 | Regras de leitura e resultados privados. |
| G08-02 | Sem autoavaliação entre pares | IMPLEMENTADO/TESTADO | P1 | Questionários negam autoatribuição e preservam resposta. |
| G08-03 | Critérios, pesos e versões de avaliação | IMPLEMENTADO/TESTADO | P1 | Validação de domínio e interface. |
| G08-04 | Regras de dezembro e ciclo anual aprovado | PARCIAL | P1 | Regras presentes/testadas em domínio; ciclo anual real completo não demonstrado. |
| G08-05 | Objetivos, feedback e plano de desenvolvimento | PARCIAL | P1 | Dados/fluxos parciais; não há validação operacional anual de todos os casos. |
| G08-06 | Persistência e confidencialidade entre sessões reais | BLOQUEADO POR INFRA | P0 | Sessão central e dispositivos não ligados. |

## Grupo 9 — Financeiro, pagamentos, bónus e processamento salarial

| ID | Requisito | Estado | Prioridade | Resultado / limite |
|---|---|---|---|---|
| G09-01 | Conta corrente própria e gestão clínica | IMPLEMENTADO/TESTADO | P1 | Cêntimos, estados, isolamento e limites de pagamentos. |
| G09-02 | Pagamentos parciais e prova/histórico | IMPLEMENTADO/TESTADO | P1 | Operações sintéticas; não ligação bancária. |
| G09-03 | Prémio por produto acumula no bónus trimestral | IMPLEMENTADO/TESTADO | P1 | Não cria movimentos diários em paralelo; duplicados impedidos. |
| G09-04 | Remuneração bruta seleciona qualquer função | IMPLEMENTADO/TESTADO | P1 | Vínculo desconhecido fica visível; prestador segue faturação. |
| G09-05 | Vigência contratual e mudança salarial no mês | IMPLEMENTADO/TESTADO | P1 | Segmentos e fonte RH, sem reentrada paralela no processamento. |
| G09-06 | Conferência diária/mensal de ponto e ausências | IMPLEMENTADO/TESTADO | P1 | Horas, feriados, férias/baixas/parciais, lacunas e extra com fonte. |
| G09-07 | Não duplicar ausências e dias de alimentação multiclínica | IMPLEMENTADO/TESTADO | P1 | União de intervalos, sobreposições e regra confirmada. |
| G09-08 | Faltas com/sem perda remuneratória segundo regime | PARCIAL | P1 | Sem matriz legal completa validada; não há descontos automáticos. |
| G09-09 | Atalho clicável direto a cada registo de origem | PARCIAL | P1 | Identificadores e abertura da ficha existem; faltam atalhos específicos de cada marcação/escala. |
| G09-10 | Resumo completo de conferência por clínica | PARCIAL | P1 | Seleção clínica existe; resumo agregado de conferência por clínica incompleto. |
| G09-11 | Preflight bloqueia dados em falta/fontes alteradas | IMPLEMENTADO/TESTADO | P0 | Não permite conferir/exportar snapshot desatualizado. |
| G09-12 | Exportações XLSX/CSV/PDF/JSON/ZIP | IMPLEMENTADO/TESTADO | P1 | Downloads reais gerados e containers/hashes validados independentemente. |
| G09-13 | Snapshot imutável, histórico e entrega declarada | IMPLEMENTADO/TESTADO | P1 | Descarregar não equivale a enviar ao contabilista. |
| G09-14 | Adaptadores Primavera/PHC/Sage/TOConline certificados | AUSENTE | P2 | Há preparação arquitetural, nenhum formato proprietário certificado. |
| G09-15 | Exclusivo CEO/Administração; prestadores excluídos | IMPLEMENTADO/TESTADO | P0 | UI/domínio/API negam os outros quatro perfis e simulação. |
| G09-16 | Processamento fiscal e pagamentos salariais reais | BLOQUEADO POR INFRA | P0 | Exportador de incidências não é motor fiscal nem sistema de pagamentos. |

## Grupo 10 — Faturas, recibos e substituições

| ID | Requisito | Estado | Prioridade | Resultado / limite |
|---|---|---|---|---|
| G10-01 | Upload próprio de faturas/consulta e validação | IMPLEMENTADO/TESTADO | P1 | Formulários, metadados e ficheiros sintéticos. |
| G10-02 | Recibos de vencimento e associação ao colaborador | IMPLEMENTADO/TESTADO | P1 | Gestão e acesso próprio com regras de estado. |
| G10-03 | Ficheiros duplicados exatos e semelhantes | IMPLEMENTADO/TESTADO | P0 | Hash, contexto e identidade da fatura. |
| G10-04 | Substituições com motivo e revisão | IMPLEMENTADO/TESTADO | P1 | Original e pagamentos preservados. |
| G10-05 | Regularizações financeiras após substituição | IMPLEMENTADO/TESTADO | P1 | Não duplica créditos; pagamentos existentes mantidos. |
| G10-06 | Titular empresarial à data da fatura | PARCIAL | P1 | Snapshot de domínio testado; integração central da edição e anexos incompleta. |
| G10-07 | Anexos financeiros reais privados e scanner | BLOQUEADO POR INFRA | P0 | Serviços e aprovação de segurança pendentes. |
| G10-08 | Receção de recibos/faturas por email real | BLOQUEADO POR INFRA | P1 | Adapters e filas exercitados com respostas simuladas. |

## Grupo 11 — Operação Diária e Stock

| ID | Requisito | Estado | Prioridade | Resultado / limite |
|---|---|---|---|---|
| G11-01 | Abrir só com médicos, só técnicos ou ambos | IMPLEMENTADO/TESTADO | P1 | Presenças e validação de campos condicionais. |
| G11-02 | Abrir sem profissionais com justificação | IMPLEMENTADO/TESTADO | P1 | Sem atividade clínica, vagas ou publicidade fictícias. |
| G11-03 | Médico num cartão com três contagens | IMPLEMENTADO/TESTADO | P2 | Sem capacidade obrigatória RH ou secções expansíveis removidas. |
| G11-04 | Técnico: capacidade semanal e ajuste só do dia | IMPLEMENTADO/TESTADO | P1 | Não altera a ficha habitual. |
| G11-05 | Guardar abertura completa numa operação | IMPLEMENTADO/TESTADO | P1 | Erros conservam rascunho, sem gravações parciais. |
| G11-06 | Suspensos e espera de tratamentos separados | IMPLEMENTADO/TESTADO | P1 | Transporte do fecho anterior e edição. |
| G11-07 | Avaliações a marcar e confirmações pendentes acumulam | IMPLEMENTADO/TESTADO | P1 | Números/data original e tarefas de dias anteriores mantidos. |
| G11-08 | Lista interna de consultas derivada de pedidos | IMPLEMENTADO/TESTADO | P1 | Visto/reversão justificada e contadores sem duplicação. |
| G11-09 | Tarefas obrigatórias impedem fecho | IMPLEMENTADO/TESTADO | P1 | Conclusão/reabertura, histórico e valores de fecho. |
| G11-10 | Ocupação usa marcações do fecho e faltas separadas | IMPLEMENTADO/TESTADO | P1 | Domínio/fluxo sintético; não deduz faltas de toda não realização. |
| G11-11 | Histórico visual sem JSON técnico | IMPLEMENTADO/TESTADO | P2 | Fonte e histórico legados preservados. |
| G11-12 | Abertura gera propostas só das especialidades presentes | IMPLEMENTADO/TESTADO | P1 | Propostas idempotentes, sem publicar ou inventar disponibilidade. |
| G11-13 | Inventário por clínica, categorias, referências e unidades | IMPLEMENTADO/TESTADO | P1 | Catálogo e ledger clínico canónicos. |
| G11-14 | Reservas, mínimos/máximos, lotes e validade | IMPLEMENTADO/TESTADO | P1 | Alertas e quantidades inválidas testados. |
| G11-15 | Entradas/saídas/consumos/ajustes justificados | IMPLEMENTADO/TESTADO | P1 | Revisão, autor e idempotência. |
| G11-16 | Transferências e isolamento entre clínicas | IMPLEMENTADO/TESTADO | P0 | Concorrência SQL descartável e permissões. |
| G11-17 | Fornecedores, pedidos, encomendas e aprovação | IMPLEMENTADO/TESTADO | P1 | Estados e ações autorizadas no fluxo sintético. |
| G11-18 | Empresa fornecedora reservada ao CEO | IMPLEMENTADO/TESTADO | P0 | Gestão comercial interna negada aos outros perfis; pedidos clínicos separados. |
| G11-19 | Entregas parciais e confirmação de receção | IMPLEMENTADO/TESTADO | P1 | Stock só aumenta após confirmação clínica; repetição não duplica. |
| G11-20 | Custos/documentos/histórico e alertas Stock | IMPLEMENTADO/TESTADO | P1 | Sem segundo módulo Stock; documentos reais dependem de arquivo. |
| G11-21 | Colaboração em tempo real abertura/fecho/Stock | BLOQUEADO POR INFRA | P0 | Writers não ativados na demonstração, apesar dos testes SQL. |

## Grupo 12 — Pedidos, tarefas, Chat, Reclamações e relatórios

| ID | Requisito | Estado | Prioridade | Resultado / limite |
|---|---|---|---|---|
| G12-01 | Pedidos e percurso até consulta marcada | IMPLEMENTADO/TESTADO | P1 | Estado, clínica, responsável e histórico locais. |
| G12-02 | Chat próprio e contadores/leitura | IMPLEMENTADO/TESTADO | P1 | Percursos e regras locais testados; não mensagens externas. |
| G12-03 | Chat central/realtime e retenção operacional | BLOQUEADO POR INFRA | P1 | Sem serviço operacional de conversas autenticadas entre dispositivos. |
| G12-04 | Tarefas do dia e pendências transportadas | IMPLEMENTADO/TESTADO | P1 | Idempotência e vínculo a operação existente. |
| G12-05 | Reclamação: autor automático e clínica autorizada | IMPLEMENTADO/TESTADO | P0 | Administrativas só das clínicas associadas. |
| G12-06 | Queixa original múltipla e colaboradores envolvidos | IMPLEMENTADO/TESTADO | P1 | Uploads sintéticos e lista filtrada pela clínica. |
| G12-07 | Funil Reclamações com toque/rato e seletor | IMPLEMENTADO/TESTADO | P1 | Campos obrigatórios antes de gravar. |
| G12-08 | Envio advogada e confirmação de receção | PARCIAL | P1 | Datas/comprovativos/estados existem; envio real não configurado. |
| G12-09 | Resposta reclamante e ERS em registos separados | IMPLEMENTADO/TESTADO | P1 | Registos documentais, canais e prova sintéticos; não submissão real à ERS. |
| G12-10 | Prazo operacional de 15 dias corridos | IMPLEMENTADO/TESTADO | P1 | Fim de semana/feriado não suspendem a regra operacional; validação jurídica separada. |
| G12-11 | Timeline, duração por etapa e reabertura | IMPLEMENTADO/TESTADO | P1 | Histórico anterior mantido e alteração justificada. |
| G12-12 | Pesquisa/filtros e contadores por clínica | IMPLEMENTADO/TESTADO | P1 | CEO/Admin globais conforme âmbito; outros sem dados reservados. |
| G12-13 | Relatórios de gestão e indicadores consolidados | PARCIAL | P1 | Relatórios demo existem; nem todos os indicadores/combinações foram reconciliados centralmente. |

## Grupo 13 — Tabelas, email, Marketing e automação

| ID | Requisito | Estado | Prioridade | Resultado / limite |
|---|---|---|---|---|
| G13-01 | Catálogo Mestre de Documentos separado de contratos | IMPLEMENTADO/TESTADO | P1 | Editores e destinos independentes. |
| G13-02 | Checklists por regras e reutilização nas fichas | IMPLEMENTADO/TESTADO | P1 | Não cria catálogo paralelo para cada colaborador. |
| G13-03 | Cartões Clínicas/Especialidades/Profissionais consolidados | IMPLEMENTADO/TESTADO | P2 | Destinos canónicos e fonte de dados preservada. |
| G13-04 | Tabelas de permissões e associações clínicas | IMPLEMENTADO/TESTADO | P0 | Ações/destinos e permissões efetivas nos percursos testados. |
| G13-05 | Lista de Emails e configurações não duplicadas | IMPLEMENTADO/TESTADO | P1 | Endereços/funções e histórico; configurações sintéticas não enviam. |
| G13-06 | Gmail/Meta/Google reais e credenciais de servidor | BLOQUEADO POR INFRA | P1 | Adapters/flags preparados; ligações não configuradas no preview. |
| G13-07 | Dashboard Marketing por clínica/especialidade/período | IMPLEMENTADO/TESTADO | P1 | Especialidades limitadas à clínica; métricas internas verificáveis. |
| G13-08 | Campanhas, estados, orçamento e objetivos | IMPLEMENTADO/TESTADO | P1 | Criação/edição/aprovação sintéticas; sem gastar dinheiro. |
| G13-09 | Atribuição de contactos do Call Center | IMPLEMENTADO/TESTADO | P1 | Utiliza pedidos existentes, sem segunda base de contactos. |
| G13-10 | Funil de oportunidades e tarefas | IMPLEMENTADO/TESTADO | P1 | Movimento, permissão e origem existente. |
| G13-11 | Calendário editorial mensal e aprovações | IMPLEMENTADO/TESTADO | P1 | Planeamento sintético e transições. |
| G13-12 | Assistente IA e textos por canal | PARCIAL | P1 | Interface/templates/limites preparados; geração externa efetiva depende de fornecedor. |
| G13-13 | Imagens publicitárias realmente geradas por IA | BLOQUEADO POR INFRA | P1 | Não há fornecedor de imagens configurado; materiais locais não são geração externa comprovada. |
| G13-14 | Uploads privados e retenção documental Marketing | BLOQUEADO POR INFRA | P0 | Preparação não equivale a arquivo privado operacional. |
| G13-15 | Publicação automática Google/Meta/WhatsApp | BLOQUEADO POR INFRA | P1 | Não ligada; nunca autorizada publicação/gasto automático. |
| G13-16 | Receita/ROI só com dados confirmados | IMPLEMENTADO/TESTADO | P0 | Não converte estimativas em receitas confirmadas nem permite investimento automático. |
| G13-17 | Consentimentos, oposição e publicidade em saúde | PARCIAL | P1 | Regras/limites existem; revisão jurídica e integração efetiva de todos os canais pendentes. |

## Grupo 14 — Segurança, arquivo, auditoria, backups e preview

| ID | Requisito | Estado | Prioridade | Resultado / limite |
|---|---|---|---|---|
| G14-01 | Controlos UI/domínio/API e acesso direto | IMPLEMENTADO/TESTADO | P0 | Casos negativos sintéticos executados; não pentest externo. |
| G14-02 | Âmbito por clínica e perfis simulados | IMPLEMENTADO/TESTADO | P0 | Isolamento nos serviços e view-as só leitura. |
| G14-03 | Histórico, CAS e prevenção de duplicados | IMPLEMENTADO/TESTADO | P0 | Concorrência e rollback em PostgreSQL descartável. |
| G14-04 | Armazenamento privado, scanner e retenção reais | BLOQUEADO POR INFRA | P0 | Fail closed até revisão/configuração adequadas. |
| G14-05 | Backup/restauro externos e RPO/RTO | BLOQUEADO POR INFRA | P0 | Cópia local/checksum não é restauro operacional da instalação central. |
| G14-06 | Cópia sintética local verificável | IMPLEMENTADO/TESTADO | P1 | Materialização e checksum reais, sem fingir teste de restauro remoto. |
| G14-07 | Assinatura eletrónica adequada/validada | BLOQUEADO POR INFRA | P1 | Sem fornecedor ou validação; não há assinatura eletrónica operacional. |
| G14-08 | Ausência de segredos no pacote sintético | IMPLEMENTADO/TESTADO | P0 | Revisão de ficheiros e scanner de padrões; não prova absoluta de ausência de qualquer segredo histórico. |
| G14-09 | Preview isolado, protegido, manifesto e hash | IMPLEMENTADO/TESTADO | P0 | READY ddb6023, assets conferidos e backend ausente; sem alterar projeto de produção. |
| G14-10 | Main/produção sem alterações nesta auditoria | IMPLEMENTADO/TESTADO | P0 | Verificação de refs/projeto/deployment antes/depois; apenas testes/docs/workflow alterados. |
| G14-11 | Dependências, duplicações e código morto | PARCIAL | P1 | Referências estáticas e writers antigos exercitados; nenhuma remoção segura comprovada nesta fase. |
| G14-12 | Histórico Git integral e funcionalidades antigas | PARCIAL | P1 | Checkout shallow; 30 branches remotas inventariadas, não histórico integral local de todas as branches. |
| G14-13 | Todos os controlos/formulários operados individualmente | PARCIAL | P1 | Inventário separa ações exercitadas e apenas observadas; não declarar cada combinação aprovada. |
| G14-14 | Preparação de identidade e leitores centrais históricos | REGRESSÃO | P1 | Ficheiros identity-service/runtime-config e authenticated-modules do checkpoint a6edf53 não constam da árvore atual; equivalências precisam de reconciliação. |
| G14-15 | Baseline visual e traces históricos na branch | REGRESSÃO | P2 | 121 PNG e 30 ZIP de evidência existem nas árvores históricas e faltam na branch atual; não foram apagados no Git remoto histórico. |
| G14-16 | Tablet Android físico e hardware | BLOQUEADO POR INFRA | P2 | Toque Chromium emulado não valida sensor/GPS/microfone físico. |
