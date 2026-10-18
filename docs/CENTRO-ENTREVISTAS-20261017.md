# Centro de Entrevistas — desenvolvimento isolado

Base: `9ed3fcd`, branch `dev/v4-stabilization-20261017`. Main/produção intactas.

## Incremento 1 — agendamento

- Tipos Presencial/Tele-entrevista, campos condicionais, clínica da candidatura e morada da tabela existente, editável. A API devolve apenas os campos necessários das clínicas autorizadas.
- Telefone do entrevistador reutilizado por identidade: preferências `app_settings` no servidor e última entrevista do próprio na demonstração sintética. Não é uma configuração global.
- Emails distintos pelo serviço/outbox existente. Atualização opcional, idempotência e estados de envio preservados; PendingConfig não significa enviado.
- Entrevistas online antigas permanecem intactas até reagendamento explícito; histórico mantém valores anteriores. Não há migração destrutiva.
- `npm test` aprovado localmente; 36 verificações recrutamento SQL temporário/API/regras. `npm run build` aprovado. Chromium atualizado para o novo tipo; aprovação depende dos resultados efetivos Actions.

A demonstração estática não ativa backend, envio real, gravação, transcrição, IA ou serviços externos. Testes usam dados sintéticos, SQLite temporário e fornecedor email mock: não validam entrega real, PostgreSQL ou autenticação real.

## Consolidação de 18/10 — base remota b0c36dd e alterações locais preservadas

Foram recuperados 11 commits remotos posteriores a b1e0df6. O erro de sintaxe era uma sequência literal `\\n` entre expressões em recruitment-ui-v4.js, corrigida separadamente em d9cc197. Os cinco ficheiros locais foram preservados em checkpoint privado antes da reconciliação.

Um único Centro de Entrevistas substitui os dois editores concorrentes. Mantém agendamento, CV, notas anteriores da candidatura (sem as apagar), guiões, gravação/pausa/reprodução/carga preparados e adaptadores de transcrição/relatório. As notas novas são estruturadas por entrevista, com versões anteriores, autor e datas, revisão otimista e acesso por clínica no servidor. Não são guardadas gravações no navegador.

- Notas e rascunhos: autosave 700ms; confirmação da última gravação; rascunho sintético separado por utilizador/candidato/entrevista; rascunhos reais não persistem em localStorage. Falhas preservam texto na janela e mostram aviso. Alterações concorrentes no servidor são rejeitadas.
- Questionários: perguntas e respostas editáveis/reordenáveis, critérios profissionais na tabela de funções existente, classificação humana 1–5 com evidências obrigatórias; sem classificação global nem decisão automática. Guião local explicitamente identificado, não IA.
- Transcrição manual: original, texto corrigido e histórico. Relatório manual identificado como humano.
- Gravação, reconhecimento de voz externo e IA desativados. A existência de uma chave de fornecedor não basta para ativar processamento; a API exige validação explícita de processamento e armazenamento. Flags não foram configuradas e serviços externos não foram utilizados.
- Antes de ativar: armazenamento privado com expiração/eliminação e autorização, retenção definida, base legal/consentimento aplicável, fornecedor/localização/subcontratantes, dados enviados, conservação/reutilização, revisão RGPD/DPIA e testes de ponta a ponta. O adaptador de IA existente é apenas preparação: não valida streaming, entrega, consentimento central ou persistência dos resultados.
- Chromium local indisponível (binário ausente); nova suite interview-browser no Actions. Não se declara aprovação até os jobs terminarem.
