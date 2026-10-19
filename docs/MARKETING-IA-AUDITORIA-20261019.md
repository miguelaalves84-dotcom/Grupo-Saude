# Marketing IA — auditoria e incremento de 19/10/2026

Base preservada: `5860b45`, branch `dev/v4-stabilization-20261017`, PR #13 em rascunho.
Especificação consultada: https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6277355065

## Estado comprovável

| Requisito | Estado deste incremento | Evidência / limite |
|---|---|---|
| Campanhas, objetivos, orçamentos, Call Center | Implementação anterior preservada | `marketing-core-v4.js`, `lib/marketing-service.js`; mesmos requests e app_settings |
| Especialidades por clínica | Implementado | Filtros selecionáveis, união canónica, limpeza imediata; interseção nas fichas multiclínica; validação domínio/API |
| Propostas ao guardar abertura | Implementado: fila persistida, sem publicação | `operation-core-v4.js` chama o domínio Marketing no mesmo estado/transação. Chave clínica/data/especialidade/v1, sem nomes nem dados de utentes; apenas profissionais selecionados com specialtyIds ativos e associados à clínica |
| Geração automática de textos da fila | Pendente de infraestrutura | Fila não bloqueia por ausência de IA. Preparação/repetição manual em Assistente; sem worker externo ativado |
| Assistente simples, quatro canais | Implementado no código; IA real não validada | Seletor clínica/especialidade/canal/objetivo/tom; editar/copiar texto e hashtags; variantes ligadas à anterior. Preview estático guarda apenas pendência, nunca simula geração |
| Backend IA | Implementado e testável por transporte injetado | `lib/marketing-ai-service.js`: autenticação/permissões, clínica canónica, payload público permitido, timeout, endpoint fixo, credencial só servidor, resultado validado, persistência e idempotência. Testes sintéticos não demonstram qualidade real do fornecedor |
| Imagens publicitárias | Não implementado / dependência externa | Sem fornecedor de imagem, armazenamento privado ou validação de identidade configurados; sem botão falso de download |
| Campanha/calendário/aprovação | Implementado | Reutiliza os editores existentes, liga sourceCreativeId; sempre rascunho e revisão humana, nunca envia nem investe |
| Calendário mensal | Implementado | 42 dias, segunda–domingo, navegação de meses, mesmos posts e permissões |
| Upload privado/retention executável | Pendente | Serviços existentes `document-storage-service`, `document-security-service`, `document-archive-service` exigem identidade, scanner, cópia privada verificada e revisão da retenção. Sem atalhos via armazenamento demonstrativo; nenhuma eliminação executada |
| Google/Meta | Não ligados, preservado | Estados explícitos de configuração pendente; sem criação de anúncios |
| Abertura três campos médicos / técnicos | Preservado | Sem novo formulário ou segundo writer; suíte de Operação cobre gravação integral, pendências e fecho |
| Reclamações 15 dias | Contador corrigido | Deadline existente +15 dias civis e hora Lisboa preservado. daysRemaining usa diferença de datas civis: já não mostra 16 por arredondamento na mudança da hora |

## Segurança e dependências externas

O estado observado do ambiente não tem segredos nem variáveis de runtime configuradas. Não se procuraram valores de chaves, não se criaram recursos, não se alteraram credenciais remotas e não houve chamadas a fornecedores de IA.

Para testar geração real: backend de testes autenticado + PostgreSQL isolado, `GS_MARKETING_ENABLED=true`, ambiente Finance preview, `GS_MARKETING_AI_APPROVED=true`, modelo aprovado em `GS_MARKETING_TEXT_MODEL` e credencial `OPENAI_API_KEY` no servidor. A rota continua recusada em produção. A autorização de tratamento e orçamento/quota do fornecedor devem estar confirmados antes de ativar. Nunca colocar estas credenciais no frontend, commits ou artefactos.

O pedido de geração aceita apenas escolhas profissionais enumeradas. Não utiliza prompts livres, candidatos, nomes de profissionais, utentes, CV ou notas clínicas. O modelo recebe apenas nome público da clínica, especialidade, canal, objetivo e tom; disponibilidade não confirmada. Filtros automáticos de resposta são uma proteção adicional, não substituem revisão humana de publicidade em saúde. Não existe aprovação ou publicação automática. O envio por WhatsApp não faz parte deste incremento.

O armazenamento de ideias reutiliza `marketing.ideas`; a fila pertence ao dia clínico e é exposta como projeção para Marketing, sem segunda tabela de propostas. Registos e conversas antigos são preservados. O resultado do fornecedor só é marcado pelo serviço interno; o cliente não pode declarar conteúdo gerado pela IA. A mesma chave não repete chamadas; uma nova tentativa é uma versão explícita com histórico. Uma interrupção após reclamar a chave não desencadeia repetição automática nem despesa duplicada.

## Testes

Executar `npm test` e `npm run build`. Novos testes de domínio cobrem especialidades, outbox, permissões, versões, payload e rejeição de afirmações não verificadas. PostgreSQL descartável cobre persistência entre CEO/Administração, fornecedor falso exclusivamente em teste, ausência de configuração, falha, idempotência e concorrência. Chromium percorre seis perfis × três dispositivos × dois temas, incluindo filtros, calendário, pendência IA, edição e botões de cópia. Testes antigos de arrastamento tátil, abertura e Reclamações mantêm-se.

Os resultados efetivos do Actions e URL de preview são entregues após execução; este ficheiro não declara aprovação antecipada. O preview sintético estático não demonstra autenticação real, persistência entre dispositivos ou geração real por IA. Uploads privados, retenção e imagens continuam pendentes, explicitamente.
