# Operação Diária, Stock e Tabelas — consolidação de 20/10/2026

Base: `2fc7b73`, validada pelo utilizador. Branch exclusiva: `dev/v4-stabilization-20261017`; PR #13 em rascunho. Instruções: https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6292822617

## Inventário de recuperação e risco

| Origem Git | Destino nesta branch | Conflito identificado / decisão | Risco controlado |
|---|---|---|---|
| `a6edf538b22a2e282b5b93f275a08eb1ac05edf2`: `stock-core-v4.js` | Mesmo ficheiro | Recuperar o domínio; adaptar a política antiga `enabled` à política atual, sem substituir as permissões dos restantes módulos | Preservar formatos, milésimos, IDs, revisões e chaves idempotentes |
| Mesmo commit: `stock-ui-v4.js` | Mesmo ficheiro + `stock-demo-v4.js` | `GSModuleDemo`/fixtures antigos não existem; adaptar apenas Stock ao armazenamento demonstrativo existente | Não restaurar inicializações globais nem dados antigos reais |
| Mesmo commit: `lib/clinic-stock-service.js`, `api/v4-clinic-stock.js`, migração | `lib/stock-service.js`, `api/stock.js`, `stock-v4-recovery-001.sql` | Serviço antigo também escrevia clínicas e documentos; recuperar apenas Stock, no formato `stock_ledgers`, com CAS/transações da arquitetura atual | Evitar um segundo editor de clínicas e escritores documentais paralelos; nenhuma migração remota |
| Mesmo commit: `tests/stock-domain.cjs` | Mesmo teste | Recuperar 12 casos de Stock; separar o caso antigo de documentação clínica, cujo módulo não está nesta branch | Não declarar testada a documentação clínica ausente |
| `112b4e930d666f371be08e87277d95024e2a806e`: `document-catalog-core-v4.js`, `document-catalog-ui-v4.js` | Mesmos ficheiros, adaptados | Normalizador antigo apagava `masterDocuments`; editor dependia do adaptador ausente | Preservar os dois conjuntos históricos e IDs; `masterDocuments` torna-se a fonte compatível de escrita, catálogo é a projeção |
| Mesmo commit: controlador de Tabelas | Controlador atual preservado e corrigido | Controlador antigo alterava globalmente editores; incompatível com inicialização atual | Não copiar sobre a arquitetura atual |

Antes das alterações: árvore limpa; arquivo privado da base e SHA-256 guardados fora do repositório em `/workspace/stock-tables-checkpoint-20261020/`. Fontes recuperadas originais também preservadas nessa pasta privada. Não foram importados ficheiros de dados, segredos ou backups para o Git.

## Alterações

- Histórico da Operação Diária: projeção visual ordenada, hora Europe/Lisbon, clínica, responsável, ação, pesquisa e detalhes antes/depois. Abrange abertura/alterações/fecho, linhas pendentes e pedidos de consulta. Resumo do fecho legível. Logs originais intocados; campos desconhecidos continuam consultáveis; valores potencialmente secretos são minimizados na projeção. Não foi criada exportação: não existia exportação deste histórico.
- Stock recuperado, um menu e um ledger por clínica, sem carregar existências fictícias automaticamente. Mesmo núcleo no preview e no serviço autenticado de testes. Alertas ligados ao sistema global, respeitando ação e associação exata à clínica, incluindo Call Center.
- Tabelas: catálogo abre o catálogo, contratos abrem contratos; botão de clínicas funcional; um cartão de estrutura; um de permissões; funções profissionais acessíveis num editor próprio, distinto dos seis perfis. Especialidades configuráveis na estrutura e profissionais ligados à ficha RH existente.
- Editor antigo `App.manageContracts` passa a encaminhar para o editor único; callbacks antigos encaminhados, em vez de criar outro formulário. Não se removeu nenhum dado.
- Contratos: documentos ativos podem ser associados como obrigatórios ou opcionais; retirar associação conserva o item com `active:false`; voltar a associar reutiliza o ID e mantém histórico. Catálogo e contratos têm revisão, autor e histórico antes/depois.
- RH: checklist usa regras atuais do catálogo; ao guardar a ficha, requisitos existentes mantêm ficheiros, estados e IDs, registando versões de regras alteradas. Requisitos retirados ficam arquivados, não apagados.
- Integridade antiga: deixou de reconstruir/destruir os itens de contrato; usa o normalizador partilhado. Abertura validada, capacidades de técnicos e três contagens dos médicos preservadas.

## Matriz real de Stock

| Área | Estado implementado | Limite |
|---|---|---|
| Inventário, categorias, referências, unidades, localização, mínimo/máximo | Recuperado e integrado | Demonstração usa persistência neste navegador |
| Disponível/reservado, lotes, validade, existências e movimentos | Recuperado e integrado | Sem importação de dados reais |
| Entradas, saídas, consumos, ajustes justificados, reservas | Recuperado e integrado | Validação, quantidades e idempotência partilhadas com servidor |
| Transferências | Recuperado e integrado | Exige acesso às duas clínicas; transação/CAS no servidor isolado |
| Fornecedores, pedidos, aprovação/recusa | Recuperado e integrado | Permissões configuráveis existentes, sem criar perfil adicional |
| Encomendas, aprovação, receção parcial/total, cancelamento | Recuperado e integrado | Conferência de quantidades e histórico |
| Preços, compras e custos de consumos | Recuperado e integrado | Ocultos sem `stockCosts`; relatórios avançados por período continuam pendentes |
| Alertas mínimo/zero/validade/pedidos/encomendas | Recuperado e integrado | Notificações derivadas, sem duplicar filas de alertas |
| Documentos de encomendas | Parcial | IDs anteriores preservados; servidor valida associação à clínica/encomenda. Upload e descarga privados bloqueados neste preview |
| API e persistência central | Preparadas para testes isolados | Endpoints bloqueados por omissão, em produção e sem configuração autenticada. Preview estático não chama estas APIs |

## Testes e evidências

`npm test` inclui os testes anteriores, os 12 recuperados de Stock e os novos testes do catálogo/histórico. `npm run build` exclui API, documentos e segredos.

CI `.github/workflows/v4-stabilization.yml`: 16 suites Chromium e jobs de regressão/PostgreSQL. Nova suite `stock-tables-browser` cobre os seis perfis × computador/tablet/telemóvel × claro/escuro, fluxos de pedido/consumo, aprovações, encomendas, receções parciais, destinos de Tabelas, catálogo/contratos, preservação de evidências e revogação de acesso. A suite específica de abertura permanece ativa. Testes PostgreSQL novos exercitam persistência entre atores, isolamento, concorrência, documentos, auditoria e catálogo sem substituir os existentes.

Resultados só aprovados após execução efetiva no GitHub Actions do commit entregue. Capturas e JSON da nova suite são artefactos por 14 dias. O relatório final deve apontar para o run e preview efetivamente verificados, sem assumir aprovação a partir desta preparação.

## Pendências por prioridade

**P0:** qualquer falha nos testes desta consolidação bloqueia a entrega como aprovada. Nenhuma autorização para main, merge, produção ou limpeza de dados.

**P1:** autenticação e persistência central ligadas à interface continuam pendentes fora dos testes isolados; uploads privados, verificação de ficheiros e retenção de Stock; reconciliação supervisionada de catálogos históricos com IDs diferentes mas nomes equivalentes (conservados, não fundidos automaticamente); integração das regras SQL legadas `document_requirements` do antigo `api/v4.js` com o catálogo central antes de ativar esse fluxo real. Não foi feita migração nem apagada a tabela legada. Relatórios avançados de Stock por período e validação de todos os controlos inventariados fora dos percursos executados.

**P2:** recuperar e rever a matriz global dos 14 grupos e os relatórios históricos (não copiar estados antigos como atuais); IA real, imagens geradas por fornecedor, Google/Meta, emails, áudio e transcrição dependem de configuração e autorização próprias. Continuam desativados neste preview.

Não foram removidos ficheiros de módulos antigos nem executadas operações destrutivas. Remoções nesta fase limitam-se a cartões duplicados de navegação e ao corpo do editor de contratos substituído por encaminhamento para o editor único. Funcionalidades e referências públicas preservadas.
