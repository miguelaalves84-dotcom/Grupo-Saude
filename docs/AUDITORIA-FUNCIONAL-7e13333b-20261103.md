# Auditoria funcional — Grupo Saúde V4

Referência: `7e13333b8fd77d33fb633c0c90ff8411916ea092`. Auditoria iniciada em 03/11/2026 e consolidada em 04/11/2026. Branch: `dev/v4-stabilization-20261017`; HEAD observado: `c8a31c75f65ff2c4b988926a024054c2ad199079`. As diferenças desde a referência são apenas dois relatórios anteriores. O código auditado foi extraído por `git archive` para uma cópia isolada.

**Conclusão: não está comprovadamente preparado para dados reais.** Existe uma aplicação demonstrativa extensa, com mecanismos de segurança e serviços PostgreSQL efetivamente testados em isolamento. Isso não equivale a persistência central autenticada de todos os módulos no preview.

Esta intervenção não alterou código, design, dados, configurações, main, produção ou acesso ao preview. Não executou migrações, envios de email, publicação ou merge. Apenas acrescentou novos documentos de auditoria. PR #13 observado em rascunho; não foi alterado. A próxima fase exige autorização.

## Matriz e critérios

A [matriz completa](AUDITORIA-FUNCIONAL-7e13333b-20261103-MATRIZ.md) contém Módulo, Funcionalidade, Estado, Evidência, Problema e Prioridade. Disponível também em [CSV](AUDITORIA-FUNCIONAL-7e13333b-20261103.csv) e [JSON](AUDITORIA-FUNCIONAL-7e13333b-20261103.json), com caminhos e ligações ao código da referência.

Universo explícito: 192 requisitos históricos, menos três linhas metodológicas que não são funcionalidades, mais 32 requisitos posteriores identificados individualmente: **221 famílias**. Abrange os 14 grupos. Não representa todos os cenários possíveis nem uma percentagem de conclusão do produto. Cada família conta uma vez, sem ponderação por complexidade. Estados são mutuamente exclusivos e limitados ao âmbito declarado:

- Funcional e testada: comportamento comprovado no âmbito especificado, incluindo mecanismos independentes, geradores e interfaces; não certifica operação central do módulo inteiro.
- Simulada: fluxo do preview usa armazenamento local/sintético, mesmo quando o domínio ou serviço também tem testes isolados genuínos.
- Parcial: apenas condições ou subconjuntos suportados.
- Incompleta: falta lógica ou ligação essencial; credenciais, por si só, não resolvem.
- Bloqueada: depende de infraestrutura, configuração ou validação externa.
- Não implementada: não foi encontrada implementação comprovada.

Prioridades: P0 bloqueia uso seguro ou compromete integridade; P1 essencial à operação; P2 melhoria importante; P3 opcional. «—» identifica mecanismos concluídos no âmbito auditado, sem correção pedida; não significa que segurança seja opcional.

| Estado | Famílias | Percentagem do universo auditado |
|---|---:|---:|
| Funcional e testada | 26 | 11.76% |
| Parcial | 25 | 11.31% |
| Simulada | 132 | 59.73% |
| Incompleta | 11 | 4.98% |
| Não implementada | 3 | 1.36% |
| Bloqueada | 24 | 10.86% |

## Cobertura dos 14 grupos

| Grupo | Famílias | Distribuição |
|---|---:|---|
| 1 — Identidade, sessão e seis perfis | 13 | Funcional e testada: 7; Simulada: 1; Bloqueada: 4; Parcial: 1 |
| 2 — Clínicas, documentos e Dashboard | 17 | Simulada: 15; Bloqueada: 2 |
| 3 — Navegação, interface e notificações | 10 | Funcional e testada: 7; Parcial: 1; Simulada: 1; Bloqueada: 1 |
| 4 — RH e ficha central | 27 | Simulada: 20; Parcial: 3; Incompleta: 2; Bloqueada: 1; Funcional e testada: 1 |
| 5 — Candidatos e recrutamento | 16 | Simulada: 10; Bloqueada: 2; Parcial: 2; Incompleta: 2 |
| 6 — Férias, baixas e calendários | 12 | Simulada: 8; Funcional e testada: 1; Bloqueada: 2; Incompleta: 1 |
| 7 — Ponto, escalas e GPS | 16 | Simulada: 11; Parcial: 2; Bloqueada: 1; Incompleta: 2 |
| 8 — Desempenho e questionários | 7 | Simulada: 3; Parcial: 2; Bloqueada: 1; Incompleta: 1 |
| 9 — Financeiro, pagamentos, bónus e processamento salarial | 20 | Simulada: 11; Parcial: 3; Funcional e testada: 3; Não implementada: 2; Incompleta: 1 |
| 10 — Faturas, recibos e substituições | 8 | Simulada: 5; Parcial: 1; Bloqueada: 2 |
| 11 — Operação Diária e Stock | 25 | Simulada: 24; Bloqueada: 1 |
| 12 — Pedidos, tarefas, Chat, Reclamações e relatórios | 16 | Simulada: 13; Bloqueada: 1; Parcial: 2 |
| 13 — Tabelas, email, Marketing e automação | 17 | Simulada: 10; Bloqueada: 3; Não implementada: 1; Incompleta: 1; Funcional e testada: 1; Parcial: 1 |
| 14 — Segurança, arquivo, auditoria, backups e preview | 17 | Funcional e testada: 6; Bloqueada: 3; Parcial: 7; Incompleta: 1 |

## Achados prioritários e fundamentação

### P0 — Autenticação central

Better Auth, Argon2id, MFA e sessões têm testes reais isolados. O guard exige CI, base loopback e marcador sintético; não equivale a autenticação operacional do preview.

Evidência: [lib/security-isolation.cjs](https://github.com/miguelaalves84-dotcom/Grupo-Saude/blob/7e13333b/lib/security-isolation.cjs). Próxima ação proposta, **não executada**: Adaptar o ambiente de testes central sem remover as proteções; validar convite, recuperação, revogação e duas sessões.

### P0 — Persistência e paridade UI/API

A interface principal continua local. Não foi comprovado escritor central equivalente da ficha RH completa, transações de férias/baixas e ciclo integral de desempenho. Serviços especializados existentes não cobrem automaticamente estes fluxos.

Evidência: [hr-leave-domain-v4.js](https://github.com/miguelaalves84-dotcom/Grupo-Saude/blob/7e13333b/hr-leave-domain-v4.js). Próxima ação proposta, **não executada**: Reutilizar o domínio e completar os caminhos centrais; testar concorrência, saldos e isolamento.

### P0 — Arquivo privado

Cifragem e controlos têm testes; fornecedor, scanner, custódia de chaves e recuperação operacional não estão verificados. Download de anexo central do Chat termina em 503 mesmo após validar permissões e prazo.

Evidência: [lib/chat-service.js](https://github.com/miguelaalves84-dotcom/Grupo-Saude/blob/7e13333b/lib/chat-service.js). Próxima ação proposta, **não executada**: Concluir a ligação segura e testar ficheiros entre sessões antes de aceitar documentos reais.

### P0 — Recuperação e migração

Há testes reais de dump/restauro cifrado em clone, mas não há prova de serviço automático, RPO/RTO acordados ou importação reconciliada de todos os dados locais e ficheiros.

Evidência: [scripts/migrate-development.cjs](https://github.com/miguelaalves84-dotcom/Grupo-Saude/blob/7e13333b/scripts/migrate-development.cjs). Próxima ação proposta, **não executada**: Validar plano completo, ensaio reversível, reconciliação de IDs, valores, históricos e hashes.

### P1 — Raio GPS incoerente

Prova sintética: pedido de raio 100 m fica guardado como 50 m na ficha; UI limita 10–50 m, API aceita 1–5000 m. Inconsistência comprovada, sem demonstração de bypass de autorização.

Evidência: [clinic-master-v4.js](https://github.com/miguelaalves84-dotcom/Grupo-Saude/blob/7e13333b/clinic-master-v4.js). Próxima ação proposta, **não executada**: Confirmar política pretendida antes de uniformizar os limites.

### P1 — Horários noturnos e banco de horas

Horário que termina antes do início é rejeitado; diferenças de assiduidade não constituem ciclo completo de crédito/débito legalmente autorizado.

Evidência: [attendance-core-v4.js](https://github.com/miguelaalves84-dotcom/Grupo-Saude/blob/7e13333b/attendance-core-v4.js). Próxima ação proposta, **não executada**: Definir âmbito e enquadramento; não gerar pagamentos ou créditos automáticos.

### P1 — Bónus trimestrais

Reconciliação e fórmulas existem; multiclínica, períodos parciais e outras decisões configuráveis continuam a impedir aprovação automática segura.

Evidência: [stock-closing-v4.js](https://github.com/miguelaalves84-dotcom/Grupo-Saude/blob/7e13333b/stock-closing-v4.js). Próxima ação proposta, **não executada**: Resolver decisões e reconciliar com o livro existente sem movimentos duplicados; manter pagamentos bloqueados.

### P1 — Dependência excessiva do contexto central

O contexto de autorização depende da configuração financeira, incluindo arquivo, dificultando iniciar apenas identidade e clínicas.

Evidência: [lib/authorization-service.js](https://github.com/miguelaalves84-dotcom/Grupo-Saude/blob/7e13333b/lib/authorization-service.js). Próxima ação proposta, **não executada**: Rever a separação de requisitos mantendo a política de falha fechada.

### P1 — Defesa adicional e validação operacional

CSP legado permite inline; não foram encontradas políticas RLS ativas. ACL de servidor é testada, pelo que isto não demonstra por si só exploração ou ausência de proteção.

Evidência: [vercel.json](https://github.com/miguelaalves84-dotcom/Grupo-Saude/blob/7e13333b/vercel.json). Próxima ação proposta, **não executada**: Rever endurecimento e teste independente; não remover controlos existentes.

### P2 — IA e serviços de entrevista

Gravação, transcrição em direto e IA estão desativadas na interface. Endpoint batch não comprova fluxo contínuo, diarização ou arquivo seguro.

Evidência: [interview-services-ui-v4.js](https://github.com/miguelaalves84-dotcom/Grupo-Saude/blob/7e13333b/interview-services-ui-v4.js). Próxima ação proposta, **não executada**: Manter bloqueado até configuração, autorização, consentimento e validação completa.

### P3 — Integrações opcionais

Imagens atuais de marketing são propostas SVG locais, não geração de imagem por IA. Adaptadores salariais proprietários não têm compatibilidade certificada.

Evidência: [lib/marketing-ai-service.js](https://github.com/miguelaalves84-dotcom/Grupo-Saude/blob/7e13333b/lib/marketing-ai-service.js). Próxima ação proposta, **não executada**: Não impedir a operação mínima pelo que é opcional; não declarar integração inexistente como ativa.

## Preparação para utilização real — dez áreas

| Área | Existe e foi exercitado | Falta para operação real |
|---|---|---|
| Identidade individual | Better Auth, Argon2id Node 24, MFA e sessões em ambiente sintético isolado | Ambiente central autorizado, convite/reset reais de testes e revogação entre sessões; guard atual deliberadamente impede uso remoto |
| PostgreSQL/Neon | SQL, serviços e privilégios testados em PostgreSQL descartável | Base remota de testes verificada, TLS, perfis mínimos e sequência integral de migrações; não foi criado Neon |
| Entre dispositivos | APIs para vários domínios e testes SQL reais | Ligar UI e concluir paridade de RH/férias/desempenho; armazenamento local não sincroniza dispositivos |
| Arquivo privado | Envelope cifrado, ACL e validações isoladas | Fornecedor, scanner, chaves, versões, retenção e restauro operacional; concluir caminho dos anexos Chat |
| Emails | Adaptadores, filas e idempotência; caixa sintética | Quatro canais configurados em sandbox, associação humana e entrega verificada; nenhum envio real realizado |
| Backups | Dump cifrado e restauro em clone exercitados | Agendamento, monitorização, custódia, RPO/RTO e ensaio operacional; backup existente no código não prova serviço ativo |
| Auditoria | Cadeia de eventos de segurança e triggers contra alteração de audit_log/finance_events | Operação central completa, retenção e monitorização; validar privilégios de implantação. Não generalizar imutabilidade a qualquer armazenamento local |
| Permissões servidor | Serviços com ACL, seis perfis e testes negativos/multiclínica | Provar UI→API→BD de cada fluxo e simulação efetiva no ambiente central; elementos escondidos não bastam |
| Dados pessoais/clínicos | Minimização e barreiras implementadas em vários serviços | Validar fornecedores, bases legais, informação, retenção, incidentes e acessos ocupacionais com revisão jurídica/operacional |
| Migração | Scripts controlados e algumas reversões específicas | Inventário de todas as origens locais, importação idempotente, reconciliação, sequência global reversível e autorização de cutover |

## Processos críticos e regras preservadas

- Férias/baixas: regras de sobreposição e reposição existem no domínio local; leitura de ausências pela API de ponto não prova transação central completa de férias e saldo.
- Ponto/escalas: horários, pedidos, aprovação, GPS e isolamento têm testes; GPS declarado pelo dispositivo não é prova inviolável de presença. Validar permissões/precisão em equipamento físico. Diferenças de assiduidade não autorizam banco ou pagamento.
- Contratos/diuturnidades: mecanismos configuráveis e históricos existem; exigir regime/IRCT e vigências validados, sem presumir direito universal.
- Candidatos: cinco estados, toque/seletor, entrevista presencial/tele-entrevista, notas, critérios e conversão opcional existem. Não criar conta automaticamente. Extração universal de qualquer CV não foi comprovada.
- Reclamações: prazo operacional de 15 dias corridos desde receção original, sem reiniciar na reabertura. Data efetiva de envio à advogada é obrigatória; confirmação de receção foi retirada conforme decisão posterior. Não recuperar essa exigência antiga. Enquadramento legal específico sujeito a assessoria.
- Operação: abertura integral, técnicos/capacidades, resultados finais e pendências têm domínio/testes. Preservar lista interna manual, datas originais e histórico; não reintroduzir a antiga lista automática substituída.
- Financeiro: Caixas, Faturação e Conta Corrente são fontes distintas. Testes cobrem idempotência, pagamentos e substituições; não somar documentos com os movimentos derivados nem confundir testes com escritores reais ativos.
- Chat: permissões multiclínica, grupos administrativos e ✓ Feito têm domínio local. Os sete dias são prazo exato de acesso ao anexo, não autorização para apagar mensagens/histórico nem política jurídica geral de retenção.

## Duplicações, legado e regressões

Não foi autorizada nem executada qualquer remoção. Wrappers de compatibilidade, delegações para fonte canónica e transportes Vercel/Cloudflare não são duplicações removíveis apenas por coexistirem. Há definições legadas de schema e função de preparação em api/v4.js; a declaração isolada não prova execução de DDL no handler ativo. Qualquer remoção exige grafo de dependências e regressão dirigida.

O checkout é superficial: 324 commits alcançáveis na recolha. Não constitui inventário completo de todas as branches históricas/remotas. Código ausente da árvore atual não pode ser declarado irrecuperável.

Os 102 alertas visuais históricos não são 102 defeitos atuais: a revisão anterior identificou falsos positivos de secções recolhidas e corrigiu sobreposições reais. Não se voltou a alterar o design. As provas atuais de RH mostram 480 minutos → 8h; a permissão CEO configurada como negada é negada na interface/domínio; Gestão de Clínicas e Tabelas estão separadas. Não repetir estas correções já comprovadas.

## Testes e evidências

**Execução nova nesta auditoria:** npm test na cópia exata isolada, saída 0; provas de domínio de horas RH/permissões CEO/navegação de clínicas; prova do raio GPS. O replay histórico dependente de GS_BASELINE_DIR foi explicitamente ignorado, não aprovado. O campo legado productModified:true do instrumento de diagnóstico não indica edição do produto: as mutações ocorreram apenas nos fixtures em memória.

**Evidência CI existente, verificada para o SHA exato:** [execução 41684994674](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41684994674), 54/54 jobs aprovados. Inclui PostgreSQL descartável, segurança, serviços de domínio e Chromium. Segurança browser: 366 verificações aprovadas/zero falhas, 36 contextos (seis perfis × três formatos × dois temas). Consolidação dos dashboards: 2262 verificações (CEO 532, Administração 530, Call Center 282, Médico 282, Técnico 282, Administrativo 354). Restauro isolado: cinco cenários. Estes números são verificações dos respetivos suites, não funcionalidades únicas nem cobertura integral do programa.

A instalação local de dependências está incompleta; não se confundiu isso com ausência de Better Auth no projeto. Não foi feita instalação, nova execução local PostgreSQL/Chromium ou nova publicação. Os testes de infraestrutura/browser citados são os do CI da referência. npm audit nesse CI terminou com zero vulnerabilidades reportadas, válido para aquele lockfile e momento, sem garantia sobre avisos futuros.

Pesquisa de assinaturas de segredos: 564 ficheiros de texto no âmbito da varredura, cinco categorias; dois candidatos confirmados como URLs de PostgreSQL sintético loopback em fixtures de testes. Nenhum segredo real identificado nesse âmbito. Não é certificação de todo o histórico Git, ficheiros ignorados ou gestores de segredos. Não foram divulgados valores.

Capturas existentes da referência: [dashboards](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41684994674/artifacts/13253848614), [layout](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41684994674/artifacts/13254977769), [design executivo](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41684994674/artifacts/13253353796). Artefactos podem expirar e exigir login. Não foram produzidas novas capturas nesta conclusão documental.

A validação visual física dos sete dashboards foi comunicada pelo utilizador. Chromium com viewport/toque não é Android físico. Os cinco testes de escrita físicos anteriores pertencem ao preview f87e344, não constituem teste físico de todos os fluxos desta referência. Não foram exercitados todos os botões possíveis: a matriz explicita evidência e limites por requisito. Histórico de CI verde não prova ausência de todos os defeitos.

## Trabalho concluído a preservar

Não reconstruir: sete dashboards e design validado; menu/perfis/temas; abertura única e pendências; funis e formulários existentes; Medicina do Trabalho e organograma demonstrativos; catálogo documental e checklists; modelos de declarações/PDF e impressão; exportador salarial universal; serviços SQL/API existentes; Argon2id, MFA, sessões e envelope privado testados. Assinatura digital válida continua bloqueada, não simulada. Mailparser não deve ser reinstalado por hábito: Gmail atual usa parser MIME próprio e não foi encontrado import atual dessa dependência.

## Plano proposto — dependências e caminho mínimo

1. **P0, ambiente central de testes:** aprovar escopo/quotas/acessos; adaptar isolamento explicitamente, base própria com marcador e privilégios mínimos, migrações globais controladas e restauro inicial comprovado. Não remover guards indiscriminadamente.
2. **P0, fatia vertical:** identidade → clínicas → ficha RH central → férias/baixas transacionais → ponto/escalas. Reutilizar domínio, ligar UI e provar duas sessões independentes, revogação, concorrência, proprietário e clínica. Corrigir na origem, sem bases paralelas.
3. **P0, documentos e recuperação:** arquivo privado/scanner/chaves e backup/restauro antes de documentos reais. Email apenas em sandbox. Concluir os anexos Chat e expiração exata de acesso.
4. **P1, integração por blocos:** Financeiro/Caixas, Operação, Stock, recrutamento, Agenda/Chat; paridade de cálculos, CAS/idempotência, rollback e reconciliação. Resolver política GPS, regimes noturnos/banco/bónus sem inventar decisões.
5. **Porta de entrada real:** validações jurídicas/operacionais, avaliação independente de segurança, Android físico, RPO/RTO acordados e recuperação exercitada. Ensaio de migração de todas as origens/ficheiros com totais e históricos reconciliados. Produção apenas após autorização expressa separada.
6. **P2/P3 depois do indispensável:** IA, integrações publicitárias e adaptadores proprietários. Não bloqueiam o processamento universal nem justificam ativar serviços não validados.

## Decisão

A auditoria termina com diagnóstico e proposta, sem implementação. Não há novo preview porque não se alterou o produto. O preview de referência anteriormente verificado mantém-se identificado nos relatórios de consolidação; não foi feita nova verificação HTTP nesta auditoria. **Aguardar autorização para iniciar correções.**
