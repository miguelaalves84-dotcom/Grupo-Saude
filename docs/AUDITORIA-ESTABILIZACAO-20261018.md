# Auditoria e estabilização V4 — 18/10/2026

Branch exclusiva: dev/v4-stabilization-20261017. Sem main, produção, migrações remotas ou dados reais. PR #13 permanece em desenvolvimento.

## Recuperação e problemas corrigidos

- GitHub tinha 11 commits posteriores ao checkpoint local b1e0df6 (até b0c36dd). Cinco ficheiros locais do Centro de Entrevistas estavam por guardar. Ambos os estados preservados em backups privados verificados, fora do repositório; histórico remoto recuperado sem force push.
- Token literal `\\n` fora de string bloqueava integralmente recruitment-ui-v4.js. Correção isolada d9cc197. [Actions efetivos, 9 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39126763629).
- Dois trabalhos concorrentes para o Centro de Entrevistas unificados num editor. Preservados agendamento, CV, notas antigas, guiões e adaptadores. Notas por entrevista, versões e revisão otimista substituem concatenação de texto que truncava os registos no limite das observações da candidatura.
- Reconhecimento de voz do navegador podia transmitir áudio a terceiros; adaptador de IA podia ser ativado apenas pela existência de uma chave. Ambos passaram a estar bloqueados até validação de infraestrutura e tratamento de dados. Não houve chamadas externas.
- Editor legado da candidatura reutiliza a validação e revisão canónicas em vez de modificar diretamente o registo e contornar a concorrência. Documentos contratuais continuam na ficha de colaborador; documentos existentes não são apagados.
- Uma falha na nova suite Chromium resultou de a condição de prontidão devolver uma função, que o Playwright invocava sem argumentos. Corrigida em c62effa. [Actions efetivos, 10 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39127292801). Não foi escondida nem considerada aprovada a execução anterior falhada.

## Inventário e cobertura

| Área | Fontes principais | Verificação / limites |
|---|---|---|
| Dashboard / navegação | workspace-shell-v4.js, access-scope-v4.js, app.js | Regressões browser e stabilization, grupos exclusivos e identidade preservada |
| Clínicas / configuração | clinic-master-v4.js, clinic-single-source-v4.js, tables-canonical-controller-v4.js | Reutilização das fontes existentes; suites improvements/documents |
| RH / colaboradores | hr-master-v4.js, clinic-hr-architecture.js, hr-separation-v4.js | Suites runtime/stabilization; área pessoal independente |
| Recrutamento / entrevistas | recruitment-core-v4.js, recruitment-ui-v4.js, lib/recruitment-service.js | 41 verificações locais; Chromium recrutamento, toque e entrevistas; adaptadores externos bloqueados |
| Férias / baixas / ponto | hr-leave-domain-v4.js, hr-leave-ui-v4.js, attendance-dashboard-v4.js | Testes existentes e regressões seis perfis; escritores remotos não ativados |
| Documentos / email | communications-v4.js, lib/document-security-service.js, lib/gmail-sync-service.js | Suites documentos/Gmail/segurança; fornecedores de testes mock |
| Financeiro | finance-core-v4.js, finance-ui-v4.js, lib/finance-service.js | Suites financeiro/API/browser preservadas |
| Operação / tarefas | app.js, scheduled-indicators.js, v4-master-integrations.js | Regressões existentes; sem escritores de produção |
| Chat / notificações | app.js, attention-core-v4.js, attention-ui-v4.js | Notificações derivadas, sem duplicar processos |
| Stock | gs-enterprise.js e módulos existentes | Preservado; esta fase não reimplementa Stock nem declara completo o backend |
| Perfis / simulação | access-policy-core-v4.js, role-access-admin-v4.js, lib/authorization-service.js | Seis perfis, permissões individuais e bloqueio de escrita em simulação autenticada |
| Reclamações | complaints-core-v4.js, complaints-ui-v4.js, lib/complaints-service.js | Novo módulo com tabela canónica única; serviços desativados por defeito |

A inspeção cobre fontes carregadas, ligações, sobreposições e suites existentes. Não é uma certificação de todos os botões nem aprovação de funcionalidades não exercitadas. Módulos antigos com dependências continuam preservados; não houve remoção generalizada de inicializadores, tabelas ou código legado. Os scripts de movimento do funil de pedidos e de candidatos têm domínios distintos; o controlador Pointer Events de candidatos mantém-se único.

## Estado real / pendências

- Preview estático: dados sintéticos, seis perfis simulados, estado no navegador. Não demonstra autenticação real nem persistência entre dispositivos.
- API/SQLite sintéticos: persistência e política real dos serviços testadas, sessões e fornecedores substituídos por fixtures explícitas.
- PostgreSQL: preparado job descartável em localhost; só aprovado após resultado efetivo Actions. Não é Neon nem autenticação real.
- IA, gravação segura e transcrição em direto: indisponíveis até fornecedor, autorização, consentimento/base legal, retenção, armazenamento privado, revisão RGPD e testes reais. Não há emoções, personalidade, honestidade, sotaque, adequação global ou decisões automáticas.
- Email de reclamações: preparação PendingConfig e registo manual com comprovativos; envio automático pendente.
- Alertas remotos: integração no agregador condicionada à ativação isolada e à existência da migração. Sem ativação ou alterações remotas.
- Validação Chrome Android: Chromium com viewport/toque emulado; não substitui teste num tablet físico.

Detalhes: [Centro de Entrevistas](CENTRO-ENTREVISTAS-20261017.md) · [Reclamações](RECLAMACOES-20261018.md).

## Correções verificadas pelas regressões novas

O job PostgreSQL revelou mutação acidental do objeto JSONB original ao editar critérios; o serviço passou a copiar o valor antes de aplicar o compare-and-swap. O funil de Reclamações passou a ter seletores próprios, para não ser confundido com o de candidatos. A clínica virtual Administração foi excluída das escolhas operacionais.

A demonstração antiga contém associações a clínicas legadas que podem estar inativas, em particular no perfil Administrativo. Não são remapeadas nem ampliadas automaticamente. Reclamações informa quando não existem clínicas ativas atribuídas e bloqueia o registo. As fixtures Chromium configuram explicitamente uma associação sintética válida para testar o fluxo. Rever as associações reais exige a ficha RH e autorização; não é uma falha corrigível concedendo acesso a todas as clínicas.

O refrescamento de Aprovações a cada 700ms ainda podia inserir o respetivo cartão na área RH após revogação de hrManage, se leaveApprove continuasse autorizado. O painel dentro de RH passou a exigir também hrManage. Aprovações globais autorizadas mantêm-se. A suite confirma limpeza imediata e após 850ms, sem esconder a falha com reexecuções.
