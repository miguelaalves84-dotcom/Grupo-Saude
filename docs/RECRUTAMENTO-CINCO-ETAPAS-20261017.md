# Recrutamento V4 — cinco etapas (17/10/2026)

Branch exclusiva: `dev/v4-stabilization-20261017`. PR #13 permanece em rascunho, sem merge.

## Implementação e compatibilidade

- Regra única em `recruitment-core-v4.js`: Candidatos → Entrevista marcada → Recusado → Em análise → Contratado (ordem visual; os movimentos não são sequenciais).
- `clinic-hr-architecture.js`: cinco colunas sempre visíveis, cartões com drag & drop e seletor acessível em tablet. Inclui processos convertidos; não elimina candidatos arquivados nem anexos.
- `recruitment-ui-v4.js`: editor único para demonstração e interface autenticada de testes (`recruitment.html`), dados pessoais, função/clínica das tabelas existentes, entrevista presencial/online, notas, documentos, auditoria e notificações.
- `communications-v4.js`: adaptador demonstrativo existente reutilizado. Demonstração guarda apenas no navegador, nunca envia email, identifica as notificações como PendingConfig.
- Editor antigo de contratos/checklists preservado; deixa de mudar etapas para impedir que contorne as confirmações obrigatórias.
- Conversão exige confirmação adicional dos dados. Mantém currículo, documentos e ligação; não ativa acesso ao programa. No backend cria apenas `employees`, sem criar utilizador de autenticação.

Migração não destrutiva, idempotente e auditada: Novo/Recebido/Candidato → Candidatos; Contacto/Contactado/Entrevistado/Proposta/Documentação/Aprovado → Em análise; Entrevista → Entrevista marcada; Contratação/Admissão/Ativo/Convertido → Contratado. Etapas desconhecidas → Em análise com revisão obrigatória. «Aprovado» não significa automaticamente contratado. Valores anteriores, documentos, campos personalizados e histórico são preservados. Leitura do servidor projeta a migração; esta é persistida ao guardar. Na demonstração é persistida ao consultar o funil.

## Servidor e integrações

- `api/recruitment.js` utiliza a sessão verificada e a política central existentes. Não aceita identidade ou permissões do navegador. CEO/Administração com hrManage; revogação e simulação só de leitura respeitadas. Administração limitada às clínicas autorizadas; candidatos sem clínica exigem revisão CEO.
- `lib/recruitment-service.js`: tabelas canónicas candidates/employees/documents; revisão otimista e transações; identidade por email e origem; associação de novos CV sem apagar os anteriores.
- `lib/gmail-sync-service.js`: OAuth encriptado, sincronização incremental, scanner e armazenamento privado existentes. Com GS_RECRUITMENT_ENABLED=true no backend de testes, associa os CV importados ao funil, com revisão humana obrigatória.
- Extração de cabeçalhos e texto MIME disponível: nome, email, telefone e correspondência das funções/clínicas. Não faz OCR nem interpreta automaticamente o conteúdo binário do PDF; estes casos exigem revisão humana. Não cria funções ou clínicas automaticamente.
- Caixa pretendida por defeito: `cv@gruposaude.online`. Endereços personalizados existentes são preservados e precisam de alteração autorizada na Lista de Emails. OAuth Gmail exige que a caixa seja efetivamente Google Workspace/Gmail; Microsoft 365 para CV ainda depende de adaptador específico.
- `lib/recruitment-mail-service.js`: outbox transacional e registo de estado; reutiliza Notificações (`tasks`) de Tabelas → Lista de Emails, com OAuth Gmail ou Resend do servidor. Não duplica configurações.
- Estados: Queued/PendingConfig/Sending/Sent/Failed/Uncertain/Superseded. Sent exige resposta positiva do fornecedor com identificador; significa aceitação do fornecedor, não confirmação de leitura/entrega final. Timeout/resultado desconhecido bloqueia repetição automática. Reenvio de falha exige motivo e conserva a chave de idempotência. Pedidos concorrentes só reclamam um envio. Novas decisões confirmadas invalidam notificações anteriores ainda por enviar.
- Agendamento usa explicitamente Europe/Lisbon. Observações internas nunca são incluídas no email; apenas observações da entrevista destinadas ao candidato.

## Ativação pendente — apenas ambiente isolado

Não foram criados recursos, configuradas credenciais, aplicadas migrações remotas nem enviados emails reais.

1. Confirmar backend de testes, autenticação, base sintética e armazenamento privado já previstos no Grupo 1. Manter bloqueio de produção.
2. Rever e aplicar `db/migrations/recruitment-v4-001.sql` exclusivamente nessa base, com backup e verificação do destino. Migração apenas aditiva (origens, conversões e outbox).
3. Ligar o catálogo central `app_settings.jobRoles` à tabela de funções existente. Se ainda não estiver centralizado, o seletor autenticado fica vazio; não se inventa um catálogo alternativo. A demonstração reutiliza `state.jobRoles`.
4. Configurar Currículos com cv@gruposaude.online e confirmar o fornecedor real. Autorizar OAuth e os controlos de segurança/scan existentes; credenciais apenas no servidor.
5. Configurar Notificações na mesma Lista de Emails: Gmail com gmail.send ou Resend com remetente verificado e chave privada GS_PAYMENT_EMAIL_API_KEY. Não utilizar credenciais de produção.
6. Só nesse backend: GS_RECRUITMENT_ENABLED=true, GS_FINANCE_ENVIRONMENT=preview e demais parâmetros de isolamento já exigidos. Confirmar quotas gratuitas antes de qualquer recurso externo.
7. Validar uma importação e entrega reais com contas sintéticas, sessões reais independentes e PostgreSQL. Estes cenários ainda não estão aprovados.

## Testes e limites

`npm test` inclui os testes anteriores e `tests/recruitment.cjs` (32 cenários com regras reais, SQLite temporário, CV privados sintéticos e fornecedor simulado). `tests/gmail-activation.cjs` acrescenta sincronização Gmail → funil com fornecedor sintético. `npm run build` exclui API, testes, credenciais, documentos e bases do pacote estático.

GitHub Actions: `.github/workflows/v4-stabilization.yml`, regressão + sete suites Chromium. `tests/stabilization-browser.py`: seis perfis × computador/tablet/telemóvel × claro/escuro, navegação preservada e novos fluxos. `tests/recruitment-browser.py`: Chromium → API → SQL/ficheiros temporários, duas sessões sintéticas independentes, seis perfis, edição, entrevistas, notificações e conversão. A fixture não substitui autenticação real, PostgreSQL ou entrega real de email. Os resultados efetivos devem ser consultados no run do commit; código de teste preparado não equivale a aprovação.

Preview estático protegido serve para validação visual e comportamental demonstrativa. Não tem API autenticada nem ligação à caixa. Não utilizar CV/dados reais. O Grupo 1 e a ativação real de recrutamento continuam pendentes de validação integrada.
