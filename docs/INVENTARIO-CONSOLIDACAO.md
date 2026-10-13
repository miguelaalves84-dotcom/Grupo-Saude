# Inventário antes da integração — 13 outubro 2026

Destino: `fix/v4-p0-security-hardening-consolidation`. Base: `0e2f7996b6c658e3dff2f878202bcce3bca299a9`, auditada no Actions 38371631145 (20 jobs, 15 suites Chromium, 180 cenários API, 84 comparações visuais). Main permanece em `84fba5a2d6d7afcb0723ca312f4e617acc22823d`.

Foram enumeradas 27 branches, 8 Pull Requests e 581 commits únicos recuperáveis nas referências consultadas: 567 antecessores da base e 14 commits laterais, incluindo cinco referências sintéticas de merge dos PRs abertos. Metadados, SHAs, pais, mensagens, origens e diferenças estão em `INVENTARIO-CONSOLIDACAO.json`. Inclui também quatro checkpoints locais, preservados: nenhum contém caminho de fonte único ausente da base auditada; não substituir versões posteriores pelas snapshots anteriores. Não equivale à recuperação de objetos órfãos/branches apagadas que a API não enumera.

| Origem | Destino | Conflitos / risco de perda | Decisão antes de integrar |
|---|---|---|---|
| PR #5 / 53b40da — sessão e navegação RH | Controladores atuais | Antecessor; reaplicar perde correções posteriores | Já incorporado na base |
| PR #7 / 1b8f244 — férias/calendários | HRLeaveV4 e UI atual | Antecessor; preservar reagendamento e histórico | Já incorporado |
| PR #9 / b9a50bd — desempenho e questionários | HRPerformanceV4 e UI atual | Antecessor; preservar privacidade | Já incorporado |
| PR #11 / f999aea — consolidação/Financeiro/Gmail | Serviços e módulos atuais | Antecessor; preservar bloqueios de integrações reais | Já incorporado |
| PR #12 / 8143917 — segurança P0 | Política/serviços atuais | Antecessor; não reintroduzir APIs globais | Já incorporado |
| fix/rh-ceo-empty-view / 3fdd34f (4 commits laterais) | App.showView + V4ClinicHR | `app.js` e renderer RH: versão anterior sem o routing/segurança atuais | Manter entry point atual; mapear aliases antigos para o controlador protegido |
| fix/rh-navigation-isolation / d21c5c2 (3 commits laterais) | V4ClinicHR + navegação atual | Renderer e index: handler adicional atrasado, separadores sobrepostos | Não importar handler duplicado; verificar entrada/separadores com Chromium |
| v4-preview-clinic-master / 3123c9e, 463e898 | HRMasterV4 + lista canónica | Renderer substitui funções, lista sem âmbito, `timeHistory` separado do ponto atual, salários/contratos em campos antigos | Preservar fonte recuperada como evidência; referências V4EmployeeProfile encaminham à ficha existente |
| Outras 18 branches históricas, previews e aliases | Histórico existente | Todas antecessoras ou aliases; reaplicar índices antigos remove módulos novos | Sem merge redundante; históricos preservados |
| PRs #1, #2 e #4, heads/merge refs históricas | Histórico existente | Já alcançáveis na base | Preservar sem repetir alterações |

Nenhum merge para main, alteração de branch de origem, eliminação de histórico, importação de dados ou migração real. A consolidação não exige copiar módulos antigos por já existir equivalência mais completa.

## Equivalência da ficha 360 recuperada

| Capacidade antiga | Fonte única atual | Preservação / verificação |
|---|---|---|
| Lista compacta e pesquisa por nome/função/clínica | V4ClinicHR.showEmployees + GSSearchV4 | Com âmbito AccessScopeV4 e identidades users/employees deduplicadas |
| Dados profissionais / especialidades / contratos | HRMasterV4 dados/contrato | Campos atuais hr e projeção de campos legados; contrato atual antigo/inativo permanece selecionado, sem segunda tabela |
| Remuneração e dependentes | HRMasterV4 dados; FinanceUIV4 | UI de edição autorizada e financeiro próprio/gestão |
| Documentos e regularização | HRMasterV4 docs + HRSeparationV4 | Bytes, checklist, estados e validade nas fontes existentes |
| Férias e ausências | HRLeaveV4/HRLeaveUIV4 | Pedidos, decisões e histórico atuais, sem copiar leave |
| Livro de ponto | timeEntries/timeOccurrences + HRMasterV4 tempo/resumo | Leitura histórica compatível e deduplicada; timeEntries prevalece sobre timeHistory legado |
| Histórico | HRMasterV4 histórico + audit | Não filtrar apenas por nome, preservar referências por identificador |

O ficheiro antigo está em `docs/evidence/recovered-3123c9e/v4-hr-employee-profile.js`, não é carregado nem empacotado no preview. Compatibilidade é delegação às fontes atuais, não outro renderer.

## Grupo 1 e limites

Reutilizar session-v4.js, account.js, api/v4-auth.js, lib/authorization-service.js, FinanceService e ClinicStockService. Preparar leituras autenticadas de Clínicas/Stock e harness navegador → cookie → API → PostgreSQL descartável. Fornecedor sintético, storage efémero, origens loopback e containers sem rede. Não configurar tenant real, Neon, Blob, OAuth, domínio, ambiente remoto ou escritores de produção.

A preparação não certifica autenticação real ou a persistência central de RH/Operação/Chat. O preview continua apenas estático e sintético; APIs centrais não são publicadas. Aprovação depende dos resultados efetivos da nova execução Actions.
