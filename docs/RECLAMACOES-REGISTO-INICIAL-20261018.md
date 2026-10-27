# Reclamações — registo inicial, documentos e envolvidos

Branch exclusiva: `dev/v4-stabilization-20261017`. Base preservada: `19a8931`. PR #13 em rascunho.

## Implementação

- O registo inicial apresenta o utilizador atual em campo de leitura, sem seletor de responsável. A regra partilhada com a API força `responsible` e `registeredBy` para a identidade do servidor, ignorando um responsável adulterado no pedido. O primeiro evento mantém autor, data/hora e clínica. A gestão posterior do acompanhamento é preservada e não altera a autoria inicial.
- Campo de múltiplos documentos no formulário inicial e na ficha: PDF, JPG e PNG, até 3 MB por documento e 10 por envio. O primeiro documento selecionado é marcado como queixa original; os restantes são anexos. Um registo sem documentos continua possível, com o alerta existente de queixa em falta, permitindo não perder uma reclamação recebida.
- Validação de tamanho, tipo e assinatura do ficheiro antes de criar o registo; a API volta a validar os bytes e mantém a exigência de aprovação de segurança, análise antimalware e armazenamento privado. Os corpos dos ficheiros não são copiados para o histórico.
- Os envios são sequenciais e identificados. Falhas parciais mostram quantos documentos foram confirmados e permitem repetir os pendentes. Não se apresenta sucesso integral numa falha. Identificadores estáveis no registo e nos anexos impedem duplicação após repetição de um pedido confirmado; armazenamento com chave física única protege ficheiros de uma corrida concorrente. Não existe transação atómica única para todos os uploads: os documentos já confirmados são preservados.
- A lista de envolvidos depende da clínica selecionada, admite seleção múltipla e elimina seleções que deixaram de ser válidas ao mudar de clínica. A regra de pertença é verificada também na API, incluindo pedidos do CEO.
- Uma única clínica autorizada é pré-selecionada; várias exigem escolha entre as permitidas. CEO/Administração continuam sujeitos à política existente, sem concessão automática de novas associações.
- Preservados: seis etapas, arrastamento por toque/rato, seletor, confirmações, auditoria, linha cronológica, concorrência por revisão, reabertura e prazo original de 15 dias corridos em Europe/Lisbon.

## Verificação

`npm test`, `npm run build` e sintaxe Python executados localmente. A suite Chromium existente foi ampliada para o formulário inicial, rejeição de ficheiro adulterado, múltiplos documentos, autoria automática, falha parcial/repetição e atualização multiclínica dos envolvidos. Conserva gestos táteis confiáveis via CDP em tablet Android emulado, percurso completo, reabertura e recarregamento. As suites existentes conservam a regressão dos seis perfis, computador/tablet/telemóvel e candidatos.

Testes PostgreSQL descartáveis ampliados para autoria imposta no servidor, vários documentos privados, repetição idempotente, rejeição de conteúdo inválido e leitura por outro utilizador autorizado. Os resultados só são aprovados após execução efetiva do GitHub Actions no commit publicado.

## Limites do preview

Preview estático protegido, apenas dados sintéticos e armazenamento neste navegador. Não utilizar dados pessoais ou documentos reais. O backend central não é ativado nem é simulada persistência entre dispositivos. Os serviços de servidor são testados separadamente em SQLite/PostgreSQL descartáveis; armazenamento e scanner são fixtures sintéticas nesses testes. Sem emails reais, migrações remotas, credenciais, alteração da main ou publicação em produção.

Ficheiros: `complaints-core-v4.js`, `complaints-ui-v4.js`, `complaints.html`, `lib/complaints-service.js`, `tests/complaints.cjs`, `tests/complaints-browser.py`, `tests/complaints-enhancements-browser.py`, `tests/interviews-complaints-postgres.cjs`.
