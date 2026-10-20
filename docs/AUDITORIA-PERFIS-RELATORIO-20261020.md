# Auditoria funcional por perfil — Grupo Saúde V4

Branch: `dev/v4-stabilization-20261017`. PR #13 em rascunho. Produção e main preservadas.
Diagnóstico anterior às correções: [AUDITORIA-PERFIS-DIAGNOSTICO-20261019.md](AUDITORIA-PERFIS-DIAGNOSTICO-20261019.md).
Inventário: [AUDITORIA-LEGADO-INVENTARIO-20261019.json](AUDITORIA-LEGADO-INVENTARIO-20261019.json).

## Resultados efetivos do checkpoint b570a9d

[GitHub Actions 39330693473](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39330693473): 16 jobs aprovados, incluindo 14 suites Chromium, regressões automáticas/build e PostgreSQL descartável.

Cada perfil foi carregado diretamente numa sessão de navegador independente, sem precisar de alternar para outro perfil. Foram percorridos menus e atalhos autorizados, tentados acessos diretos proibidos e abertos formulários existentes. Os seis contextos por perfil são computador/tablet/telemóvel × claro/escuro. Trata-se de identidades demonstrativas: não representa autenticação real.

| Perfil | Verificações aprovadas no percurso de auditoria | Falhas nesse percurso | Pares módulo/ação distintos | Maior tempo medido de abertura |
|---|---:|---:|---:|---:|
| Call Center | 492 | 0 | 110 | 159 ms |
| Médico | 468 | 0 | 104 | 162 ms |
| Técnico | 468 | 0 | 104 | 160 ms |
| Administrativo | 504 | 0 | 118 | 186 ms |
| Administração | 714 | 0 | 155 | 197 ms |
| CEO | 774 | 0 | 165 | 196 ms |

Os números são verificações, incluindo negativos e repetições nos seis contextos, não contagens de funcionalidades completas. Os tempos incluem um pequeno intervalo de estabilização e foram medidos no servidor local do runner; não demonstram latência em dispositivos reais ou na Vercel. A simulação CEO foi testada nos cinco outros perfis, com Dashboard permitido apenas nos perfis de gestão conforme a política existente.

A matriz detalhada `profile-audit-matrix.json`, com esperado/observado/estado, inventário dos controlos visíveis e capturas por perfil, encontra-se no artefacto **profile-audit-browser-synthetic-<commit>** da execução. Os controlos apenas inventariados estão explicitamente marcados como **ação não exercitada por este percurso**. As suites dedicadas exercitam operações e persistência sintética de RH, férias, documentos, financeiro, recrutamento, entrevistas, Reclamações, Marketing e Operação; isso não aprova automaticamente cada controlo inventariado.

## Correções implementadas

1. **f4959df — Abertura médica:** removida a obrigação de capacidade semanal/diária dos médicos em `capacity`, `validateTeam`, `row` e `closeData` do domínio comum ao cliente e servidor. Os médicos têm três inteiros de contagem. A capacidade antiga permanece armazenada quando já existia, sem limitar novas contagens nem gerar percentagens de ocupação fictícias. Capacidade e vagas continuam validadas para técnicos. A ficha RH oferece a capacidade semanal apenas aos técnicos. Marketing não utiliza capacidade médica histórica para inferir vagas.
2. **b570a9d — RH pessoal:** os formulários existentes de documentos, regularização, baixas e upload de requisito abrem efetivamente o modal partilhado e verificam autorização no próprio método. O botão Voltar regressa a Meu RH e fecha o modal. Não foi criado segundo formulário.
3. **b570a9d — tarefas:** configuração do catálogo global exige `settings`, tanto na navegação como em abrir/criar/arquivar. `clinicTasks` mantém a execução das tarefas do dia, sem alterações ao catálogo, instâncias ou histórico existentes.

Regressões adicionais preparadas depois deste checkpoint verificam explicitamente o fecho médico acima de uma capacidade histórica obsoleta, o bundle da abertura/API sem capacidade médica e o botão Voltar nos seis perfis. Não são apresentadas aqui como aprovadas antes da nova execução no Actions.

## Pendências confirmadas pela inspeção

| Área | Diagnóstico | Estado / próximo passo |
|---|---|---|
| Stock | Ausente nesta branch; domínio, UI, API, migração e testes existem em a6edf53/ebc2df5 | Não implementado nesta branch; recuperar só após comparação de dependências e esquemas |
| Matriz 14 grupos | `docs/MATRIZ-14-GRUPOS.md` preservado nas branches antigas, ausente nesta | Não declarar consolidação completa dos 14 grupos |
| Tabelas — catálogo documental | O botão estático ainda aponta para `ContractTypesV4.open`, abrindo contratos | Falha confirmada na inspeção; editor independente preservado em 112b4e9, ainda não integrado |
| Tabelas — permissões | Botão estático `data-role-permissions` não tem handler e existe entrada injetada separada | Pendência de consolidação das entradas e teste específico de cada cartão |
| Tabelas — especialidades/estrutura | Dois cartões estáticos apontam ao mesmo editor de consulta | Comparar com editor real de associações antes de remover um acesso |
| Catálogo antigo | `document-catalog-core-v4.js` de 112b4e9 migra/apaga a chave masterDocuments; o contrato atual recria essa chave. UI antiga depende de GSModuleDemo, ausente nesta arquitetura | Recuperação direta criaria conflito/dupla fonte. Não copiar nem migrar cegamente |
| Cobertura de todos os controlos | Percurso cobre navegação e formulários selecionados, inventaria restantes controlos | Operações não exercitadas continuam por testar, não aprovadas |
| Sessões/serviços reais | Preview estático, sem configuração central validada | Autenticação real, isolamento real entre dispositivos, emails, IA externa, armazenamento privado e retenção real não testáveis aqui |

Não existem zero problemas no produto: existe zero falhas nos cenários executados do checkpoint. As pendências acima impedem declarar auditoria integral concluída ou todo o programa aprovado.

## Legado, remoções e preservação

O inventário inicial abrange 208 ficheiros versionados, 21 rotas API e 11 ficheiros com definições SQL; 66 ficheiros utilizam chaves/prefixos de armazenamento. Não encontrou script de raiz sem referências textuais. Nomes repetidos em `clinic-hr-architecture.js` e `gs-enterprise.js` pertencem a closures e exigem análise de escopo; não são prova de funções globais sobrepostas.

Nenhum ficheiro, módulo, tabela, migração, documento, registo ou histórico foi apagado. As alterações removeram apenas regras/controlos ativos de capacidade médica indevida e corrigiram ligações/permissões dos fluxos descritos. Wrappers de compatibilidade, chaves antigas, fixtures e dados foram preservados. Não foram executados DROP/TRUNCATE/RESET, limpezas de dados de teste, migrações remotas, merge ou publicação em produção.

Plano de remoções: **nenhuma remoção adicional aprovada como segura**. Para cada candidato futuro, documentar chamadores estáticos/dinâmicos, handlers inline, exports, migrações e dados dependentes, executar regressões e obter autorização antes de qualquer operação destrutiva. A cópia privada fora do repositório preserva o estado observado; o histórico Git local tem objetos antigos em falta e não é apresentado como clone integral verificado.
