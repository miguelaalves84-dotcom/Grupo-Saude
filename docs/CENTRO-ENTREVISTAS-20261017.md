# Centro de Entrevistas — desenvolvimento isolado

Base: `9ed3fcd`, branch `dev/v4-stabilization-20261017`. Main/produção intactas.

## Incremento 1 — agendamento

- Tipos Presencial/Tele-entrevista, campos condicionais, clínica da candidatura e morada da tabela existente, editável. A API devolve apenas os campos necessários das clínicas autorizadas.
- Telefone do entrevistador reutilizado por identidade: preferências `app_settings` no servidor e última entrevista do próprio na demonstração sintética. Não é uma configuração global.
- Emails distintos pelo serviço/outbox existente. Atualização opcional, idempotência e estados de envio preservados; PendingConfig não significa enviado.
- Entrevistas online antigas permanecem intactas até reagendamento explícito; histórico mantém valores anteriores. Não há migração destrutiva.
- `npm test` aprovado localmente; 36 verificações recrutamento SQL temporário/API/regras. `npm run build` aprovado. Chromium atualizado para o novo tipo; aprovação depende dos resultados efetivos Actions.

A demonstração estática não ativa backend, envio real, gravação, transcrição, IA ou serviços externos. Testes usam dados sintéticos, SQLite temporário e fornecedor email mock: não validam entrega real, PostgreSQL ou autenticação real.
