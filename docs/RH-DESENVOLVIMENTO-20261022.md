# RH — melhorias transversais após validação 16fcdbe

Branch dev/v4-stabilization-20261017; PR #13 draft; comentário 6350819261.
Base preservada em backup privado verificado. Nenhuma tabela, documento, histórico ou implementação anterior foi removida.

## Auditoria e alterações

| Assunto | Diagnóstico | Implementação / fonte única |
|---|---|---|
| Horário no Livro de Ponto | Motor aplicava escalas; a interface não mostrava o horário do dia | `GSAttendanceCore.dailyPlan`, utilizado pelo Livro de Ponto e serviço API; horário aprovado, intervalo, folga, férias, baixa ou ausência/sem configuração. Data do mapa não substitui o dia atual. |
| Formação | Apenas array `hrTraining` e cartão sem operação | Operações validadas no mesmo array, com participantes, entidade, datas, duração, horas válidas, imputação anual, anexos documentais e histórico. Submissão pessoal pendente e validação RH. |
| Enquadramento legal | Sem política calculável | Regra anual explicitamente confirmada pelo RH, guardada no próprio `hrTraining`, sem inferir obrigação/isenção do rótulo do contrato. Saldo anual, cobertura do âmbito autorizado e crédito potencial sujeito a análise. Alterações do contrato/datas na ficha suspendem o cálculo da obrigação até revalidação RH; a formação e o histórico mantêm-se. |
| Equipamentos | Apenas `hrEquipment` e cartão | Entrega, referência, conservação, devolução prevista/efetiva, documentos, histórico e prevenção de dupla atribuição de número de série. Escrita reservada à gestão RH. |
| Despesas / deslocações | Apenas `hrExpenses` e cartão | Pedido pessoal, comprovativo, montante, quilómetros, aprovação/recusa e histórico. Sem criação de pagamentos ou movimentos financeiros. |
| Avaliação | Módulo operacional separado já existente | Ligação ao módulo e permissões existentes; regras/pesos, propostas/revisões e validação não são duplicados. |
| Dependentes | Campo disperso em remuneração | Movido para Dados Pessoais, mantendo o mesmo campo e valor. |
| Documentos avulsos | Upload exigia tipo do catálogo | Documento com descrição, categoria, datas, validade e revisão no mesmo `employeeDocuments`; não cria tipo de catálogo nem requisito contratual. Restrito a CEO/Administração autorizados. |
| Cédula | Faltava um caminho útil para carregar comprovativos | Lista de documentos anexados, estado vazio útil, carregar novo e regressar ao formulário com rascunho preservado. Associação/desassociação usa gravação e auditoria profissionais existentes. |
| Secções e apresentação | Várias secções podiam ficar abertas; campos clínicos apareciam em funções administrativas | Um controlador nativo de `details` fecha irmãos no mesmo grupo, preservando controlos/valores e teclado. Navegação e grupos de comparação explícitos são exceções. Aplicado progressivamente às secções existentes; não é uma reescrita de todos os formulários. Cédula/ERS e percentagens clínicas escondidos quando inaplicáveis, sem apagar valores. KPI do ponto e cartões de desenvolvimento adaptáveis. |

Meu RH disponibiliza entradas visíveis para a ficha própria e para Formação/Equipamentos/Despesas, sem exigir acesso ao módulo de gestão RH.

`hr-development-core-v4.js` centraliza regras; `hr-development-ui-v4.js` torna os cartões existentes operacionais. `lib/hr-development-service.js` reutiliza `employees`, `documents`, `app_settings` e `audit_log`, sem migração nem tabela paralela. Endpoint `/api/hr-development` autenticado, desligado por defeito e bloqueado em produção. Dados persistidos em `app_settings` mantêm os mesmos arrays e registos, com CAS e transação. A ligação autenticada da interface ao backend permanece pendente: o preview usa os mesmos comandos em dados sintéticos locais.

## Formação — fontes e limites

Fontes oficiais consultadas em 22/10/2026:
- [Código do Trabalho, artigo 131.º](https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-124448606).
- [Código do Trabalho, artigos 131.º e 132.º](https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-66966857).
- [DGERT — tipologias de formação profissional](https://www.dgert.gov.pt/tipologias-de-formacao-profissional).

Regra base: 40 horas anuais em vínculos laborais; termo de pelo menos três meses proporcional ao período no ano. A implementação usa proporção por dias civis e ano civil (inclui bissextos), explicitamente sujeita à conferência RH/IRCT. Termos inferiores a três meses e vínculos desconhecidos ficam em revisão, sem presunção de isenção. Independência genuína tem de ser expressamente confirmada pela gestão; permite formação voluntária.

Antecipação/diferimento tem intervalo de dois anos; diferimento exige plano registado. Horas só contam como válidas em formação decorrida, após ação explícita da gestão e com certificado documental validado. Cobertura de 10% é apresentada para vínculos confirmados no âmbito atual, indicando os por enquadrar; não certifica automaticamente cumprimento da população anual da empresa. Crédito potencial de anos antigos é assinalado para revisão (incluindo constituição, utilização e caducidade), sem lançamento de créditos definitivos ou pagamentos. Regras especiais de IRCT, suspensões, contratos intermitentes e situações históricas carecem de validação própria; o modo Em revisão evita um cálculo fictício.

## Testes e segurança

Testes de domínio: horário/ausências, seis perfis, enquadramento, proporcionalidade, certificado, limites de horas, imputação, equipamento, despesas, permissões, documentos avulsos e API de produção desligada. PostgreSQL descartável: persistência entre intervenientes, decisões, anexos privados de teste, concorrência e auditoria. Chromium: seis perfis × computador/tablet/telemóvel × claro/escuro, com operações e resultados persistidos no preview.

Os resultados efetivos e o SHA final são apresentados após execução do GitHub Actions. Não considerar uma suite aprovada apenas por estar preparada.

Preview exclusivamente sintético. Arquivo privado central e sessões autenticadas da interface continuam por ligar. Não carregar documentos reais. Nenhum fornecedor, credencial, migração real, pagamento ou escritor de produção ativado. Main e produção preservadas.
