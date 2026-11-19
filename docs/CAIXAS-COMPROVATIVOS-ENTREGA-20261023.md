# Caixas — comprovativos e navegação (23/10/2026)

Implementação do [comentário 6368423394 do PR #13](https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6368423394), sem alargar o âmbito a outros módulos.

- Branch: `dev/v4-stabilization-20261017`; PR #13 continua em rascunho.
- Código e testes: [`9971ccae3dbf16ac26fcfa69dcda7dba289b13f6`](https://github.com/miguelaalves84-dotcom/Grupo-Saude/commit/9971ccae3dbf16ac26fcfa69dcda7dba289b13f6).
- [Preview READY protegido](https://grupo-saude-v4-validacao-sintetica-d6wp9grs8-grupo-saude.vercel.app), deployment `dpl_DJ2pVdg6X7dgjy5cRCW1gtqrNYhe`, target `staging`.
- [GitHub Actions: 32 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40001250821). São 30 suites Chromium, regressão/build e PostgreSQL descartável.

## Alterações efetivas

| Requisito | Implementação e evidência |
| --- | --- |
| Foto/PDF do depósito | JPG, PNG ou PDF até 3 MiB, com validação da assinatura binária pelo validador financeiro existente e checksum SHA-256. Referência textual continua opcional. |
| Segurança do preview | Confirmação explícita de ficheiro sintético; aviso de que o arquivo é local, sem segurança/persistência central. Não carregar comprovativos reais. |
| Consulta e download | Mesmo diálogo financeiro, imagens e PDF isolado sem permissão para executar scripts; download do original. URLs temporários revogados ao fechar; mudança de sessão invalida submissões e consultas em curso. |
| Versões e histórico | Metadados associados à mesma folha/clínica/dia/depósito, com autor, data/hora, checksum e ligação à versão anterior. Substituir preserva as versões anteriores. Repetições não duplicam comprovativos. Bytes ficam fora dos snapshots/histórico. |
| Menu | Entrada própria **Financeiro → Caixas**, reutilizando `FinanceUIV4.open('cash')`, sem nova página de dados, controlador ou ledger. Estado ativo acompanha a navegação. |
| Contador | Derivado das mesmas folhas pelo sistema global de notificações, apenas para CEO/Administração com direito de validação e clínicas autorizadas. Sem contador persistente paralelo. |
| Permissões | Política existente preservada: CEO/Administração autorizados; administrativa nas suas clínicas; Médico/Técnico/Call Center sem acesso a Caixas. Negações configuradas, leitura apenas e simulação respeitadas. |

## Arquitetura preservada

- Folhas continuam em `days[date_clinic].cash`; backend mantém `clinic_days`. Não há novas tabelas, migrações ou movimentos de remuneração/conta corrente.
- Ficheiros sintéticos reutilizam `fileStore` / IndexedDB do Financeiro existente; não foi criado um segundo arquivo. O fallback local existente mantém as mesmas limitações demonstrativas.
- `attachments` guarda apenas metadados versionados na folha, com consulta condicionada à folha e clínica. O documento financeiro genérico não passa a aceitar IDs de comprovativos de Caixa.
- Servidor rejeita `document`/`attachment` enquanto o arquivo privado não estiver integrado. O cliente não pode ativar o contexto sintético do domínio no endpoint real.
- Folhas antigas, referências, valores, histórico, validação, reabertura e ligação ao Fecho foram preservados.

## Testes efetivamente executados

| Verificação | Resultado no SHA indicado |
| --- | --- |
| `npm test`, sintaxe e build | Aprovados localmente e no GitHub Actions; build de 94 assets, sem backend/documentos/segredos. |
| Domínio Caixa | 15 grupos de cenários; seis perfis, clínicas, valores, CAS, repetição, histórico, validação/reabertura, versões sintéticas e recusa do arquivo central não configurado. |
| Chromium Caixa | **444 verificações, zero falhas**, 36 contextos: seis perfis × computador/tablet/telemóvel × claro/escuro. Inclui navegação real pelo menu móvel, upload, consulta PDF, substituição, download com comparação dos bytes, contadores, permissões, reload e ausência de créditos financeiros duplicados. |
| PostgreSQL Caixa | Seis grupos no PostgreSQL 17 descartável do CI: persistência entre utilizadores, seis perfis, isolamento, concorrência/rollback, validação/reabertura e ausência de créditos. **Não prova arquivo central de comprovativos nem UI autenticada operacional.** |
| Auditoria geral de perfis | **4 440 aprovadas, zero falhas, 180 não testáveis** por dependerem de serviços reais. Call Center 606; Médico 582; Técnico 582; Administrativo 636; Administração 984; CEO 1 050. Inclui simulação CEO. Navegação/formulários não substituem os fluxos mutáveis das suites dedicadas. |
| Revisão visual de regressão | 102 alertas anteriores revistos como falsos positivos; 60 secções adicionais, sem achados novos no percurso executado. |
| Pacote publicado | Manifesto, index e quatro assets alterados obtidos via HTTP protegido e comparados byte a byte com o pacote local. Manifesto identifica SHA e run corretos; `/api/finance?action=cash-list` devolve 404, conforme preview estático. |

Capturas e resultados JSON encontram-se nos artefactos do run, nomeados por suite e SHA, com retenção de 14 dias. Chromium correu contra o build sintético em loopback no CI; a publicação protegida foi verificada por HTTP e equivalência dos assets, não por uma sessão Chromium autenticada na Vercel.

## Problemas encontrados durante a validação

- O inventário geral assumia que permissão de conta corrente bastava para entrar em Caixas: corrigida a expectativa para a política específica de Caixa, preservando os bloqueios.
- Visualizador PDF do Chromium falhava ao aceder a `navigator.serviceWorker` dentro do sandbox sem origem: ajustado para `allow-same-origin`, mantendo scripts bloqueados.
- O evento de fecho de um diálogo anterior podia revogar URLs do documento seguinte: corrigido o ciclo de vida.
- O teste móvel tentava clicar no grupo com o menu fechado: passou a abrir o menu e expandir o grupo através dos controlos reais.
- Acrescentada invalidação de leitura/submissão de documentos após mudança de sessão e correção da seleção ativa ao sair do Financeiro.

As execuções intermédias com falhas/cancelamentos não são usadas como aprovação. A aprovação refere-se exclusivamente ao run final acima.

## Limitações e segurança

1. Arquivo privado central de comprovativos **não operacional**. Este preview utiliza exclusivamente ficheiros sintéticos no mesmo navegador; não garante partilha entre dispositivos, backup, retenção ou segurança documental de produção.
2. Backend, autenticação central, emails e escritores reais permanecem desligados neste pacote. Não foram criadas credenciais, bases ou serviços externos.
3. SSO da Vercel continua ativo para todos os deployments; não foram publicados tokens ou links de bypass.
4. `main` permanece em `84fba5a2d6d7afcb0723ca312f4e617acc22823d`; projeto de produção manteve `updatedAt=1791725971672`. Sem merge, force push ou publicação de produção.
5. Checkpoint privado inicial: 343 ficheiros comparados byte a byte, SHA-256 `5f5dc0e3dfa569915d3aa4c15fc40a470c9008180744ffde345700a091ff7044`. A tentativa de bundle integral Git detetou o objeto histórico ausente `655c9e4ec6d512a986d73fc5bed0b3bef0f90716`; não se declara o bundle completo nem se reconstituiu/apagou histórico. O trabalho atual e commits foram preservados e sincronizados sem força.

## Ficheiros alterados

- `finance-cash-core-v4.js`: metadados/versões e fronteira sintético/servidor.
- `finance-demo-v4.js`: reutilização do arquivo, verificação de acesso e transação local.
- `finance-ui-v4.js`: anexar, consultar, descarregar e histórico visual.
- `lib/finance-cash-service.js`: rejeição explícita de anexos sem arquivo privado operacional.
- `workspace-shell-v4.js`: entrada Caixas no grupo Financeiro.
- `tests/finance-cash.cjs`, `tests/finance-cash-browser.py`, `tests/profile-audit-browser.py`: regressões, operações e permissões.

Próximo passo deste bloco: validação manual do novo preview no tablet. A integração do arquivo privado central exige o desbloqueio da infraestrutura previamente identificada; não é apresentada como concluída.
