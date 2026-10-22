# RH — seguimento do feedback cd2a325

Branch dev/v4-stabilization-20261017, PR #13 em rascunho. Comentários de origem: 6340128371 e 6329675979. Sem main, produção, credenciais ou bases reais.

## Correções prioritárias

- Fila explícita no cabeçalho: **Aprovar escalas (N)** → Consultar e decidir → motivo → Aprovar/Recusar. Agrega todas as clínicas autorizadas, propostas dos gestores e pedidos das administrativas. A Central de Aprovações identifica escalas pelo nome, em vez de as apresentar apenas como ocorrências de ponto.
- Em Meu RH / Recursos Humanos / Livro de ponto: **Escalas — diário / semanal / mensal**. Seleção clara do período, preenchimento em lote dos dias de trabalho, cópia da semana anterior aprovada e cobertura aprovada por clínica. Mês inclui fronteiras de semana para validar descanso e limites; modo diário requer horários de referência corretamente configurados.
- Conversão de candidato: profissão separada de seis perfis de acesso; opção obsoleta Psicólogo/a removida apenas do seletor da conversão, sem eliminar a tabela ou especialidades. Currículo, candidatura e histórico preservados; não ativa acesso automaticamente.

## Oito requisitos

| Requisito | Implementação / estado | Dependências e limites |
|---|---|---|
| Email diário | Configuração e pré-visualização em Lista de Emails → Email diário de ausências; hora, destinatários autorizados, cobertura e pendências deduplicadas. Motivos/diagnósticos/comprovativos excluídos. | **PendingConfig**: agendador e envio autenticado real não ativados. |
| Justificativos | Ficha da baixa/ausência permite upload posterior, substituições preservadas, prazo operacional 48h e alerta de análise RH. Não transforma ausência automaticamente em injustificada. | Arquivo sintético no preview; revisão jurídica e transporte/arquivo privado central pendentes. |
| Onboarding | Preparação automática ao criar/converter colaborador, lista do catálogo/contrato, sem anexos pessoais, histórico e deduplicação. | **PendingConfig**: ligação de ativação segura e envio/reenvio real dependem de autenticação e fornecedor. Não há emails apresentados como enviados. |
| Cédula técnica | Ficha RH: número, entidade emissora, validade aplicável, ligação a comprovativo do catálogo e alertas. | Documentos usam o circuito existente; arquivo real pendente. |
| Percentagens | Técnica e tratamento separados, vigência e histórico; movimento financeiro pode aplicar a versão vigente e guardar snapshot. Movimentos com snapshot exigem correção separada. Consultas e regras manuais preservadas. | UI sintética e serviço isolado; não ativa escritores em produção. |
| ERS | Sim/Não/Por determinar, data e referência/comprovativo, validação condicional e auditoria. | Necessidade deve ser confirmada por profissão/atividade; sem obrigação universal presumida. |
| Impressão A4 | Ficha RH → Imprimir ficha A4; resumo mínimo autorizado, logótipo oficial, sem IBAN, valores salariais ou informação médica. | PDF através da impressão do navegador. |
| Documentos das clínicas | Ficha/linha da clínica → Documentos da clínica; catálogo existente, obrigatoriedade, periodicidade, responsável, datas, upload sintético, estados, versões e notificações. | Arquivo privado central/controlo servidor deste novo fluxo ainda pendentes; não é arquivo definitivo. |

## Segurança e testes

Reutilizadas as fontes monthlyRosters/timeOccurrences, leave.document, hr, financeV2/current_account_entries, communicationRuns/emailActions e clinics. Sem tabelas novas, sem eliminações nem migrações.

Os testes novos devem confirmar a acessibilidade real dos controlos, notificação ao CEO, aprovação pela fila visível, mudança efetiva do horário só após decisão, seis perfis, formatos/temas, conversão, comprovativos, impressão e configuração documental. Resultados finais correspondem ao SHA entregue e à execução efetiva no GitHub Actions; não são antecipados neste relatório.

## Estabilidade da infraestrutura Chromium

No seguimento da execução 39802712124, cinco suites ficaram retidas na instalação apt/Chromium, antes dos testes. O job browser passa a usar a imagem oficial `mcr.microsoft.com/playwright/python:v1.56.0-noble`, alinhada com `playwright==1.56.0`, verificando o executável pré-instalado. Cada suite mantém contentor próprio, dados sintéticos, rede de navegador limitada ao loopback e permissões GitHub apenas de leitura. Não há repetição de apt nem download do navegador dentro das suites. O serviço PostgreSQL descartável mantém-se separado.
