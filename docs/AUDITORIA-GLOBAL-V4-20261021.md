# Auditoria global — Grupo Saúde V4 — 21/10/2026

Branch exclusiva `dev/v4-stabilization-20261017`; PR #13 em rascunho. Base preservada `2a06a0f`. Sem merge, publicação de produção, migração remota, credenciais ou dados reais.

## Âmbito e evidência

Inventário estático: [AUDITORIA-GLOBAL-INVENTARIO-20261021.json](AUDITORIA-GLOBAL-INVENTARIO-20261021.json). Foram encontrados 71 scripts no HTML principal, sem inclusão repetida, e 14 secções estáticas, além de Stock, Relatórios, Alertas e Segurança criados pelos controladores existentes. Nomes de funções repetidos em closures distintas não provam duplicação. Os quatro scripts fora do index incluem entradas de autenticação/servidor e um adaptador antigo; não foram removidos por parecerem antigos.

A auditoria percorre os seis perfis em sessões Chromium independentes, computador 1366×1000, tablet 820×1180 e telemóvel 390×844, temas claro/escuro. A regressão adicional inclui 700 px: entre 651 e 760 px o menu era escondido sem mostrar o botão que o abre. A simulação CEO verifica o perfil efetivo, sem conceder Dashboard aos perfis sem essa permissão.

O percurso de navegação abre menus, submenus, atalhos, separadores de Marketing/Stock, formulários e separadores reais da ficha RH. O inventário dos controlos mantém expressamente o estado **Inventariado — ação não exercitada por este percurso**. As suites dedicadas exercitam criação, edição, decisões, uploads sintéticos, substituições, movimentos e persistência aplicáveis; uma página abrir não aprova as suas operações.

Baseline antes das correções: commit `e5c1fd1`, [Actions 39621641366](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39621641366), 23 jobs aprovados. [Capturas e matrizes antes](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39621641366/artifacts/12355336904).

| Perfil | Verificações aprovadas no percurso inicial | Falhas |
|---|---:|---:|
| Call Center | 528 | 0 |
| Médico | 504 | 0 |
| Técnico | 504 | 0 |
| Administrativo | 570 | 0 |
| Administração | 852 | 0 |
| CEO | 954 | 0 |

São 3 912 verificações repetidas em seis contextos por perfil, não 3 912 funcionalidades distintas. Permanecem 180 classificações externas não testáveis. O resultado funcional não eliminou os problemas visuais: foram recolhidas 4 656 ocorrências diagnósticas, 708 de corte horizontal e 3 948 de contraste. Não são erros únicos: há repetições entre ecrãs, temas, formatos e perfis. Exemplos incluem filtros/cartões financeiros para além do viewport, etiquetas cinzentas sobre fundo escuro, tabs brancos com texto branco, pills claras com texto claro e Chat com fundos fixos claros.

## Matriz de problemas, gravidade e localização

| ID | Gravidade | Problema confirmado | Localização / correção |
|---|---|---|---|
| G01 | Alta | Escritor antigo sem validações canónicas criava tarefas paralelas no arranque e permitia abertura/fecho próprios | `gs-enterprise.js`, `V4DailyOps`: desativado quando `GSOperationCore` está presente. Chamadas antigas não escrevem; versão antiga sem motor mantém compatibilidade. Sem apagar `dailyOps`, `taskInstances`, alertas ou auditoria históricos |
| G02 | Alta | Abrir Novo colaborador persistia uma identidade vazia antes de guardar; fechar pelo X deixava registo fantasma | `hr-master-v4.js`: rascunho em memória, com proprietário/permissões; gravação só após validação. Cancelar não apaga registos históricos. Testes cobrem abrir, erro, X, cancelar e gravação explícita |
| G03 | Alta | Menu inacessível entre 651 e 760 px | `styles.css`: o botão de menu segue o mesmo breakpoint do menu recolhido; teste Chromium a 700 px |
| G04 | Média | Financeiro alargava implicitamente a grelha a 760 px e cortava filtros, métricas e botões em mobile | `styles.css`, `finance-v4.css`: filhos da grelha com `min-width:0`, quebra de texto e limites; tabelas mantêm deslocação própria |
| G05 | Média | Contraste insuficiente por estilos claros fixos no tema escuro e muted insuficiente no fundo claro | `styles.css`, `finance-v4.css`: tokens comuns para labels, tabs, pills/estados, Chat, cabeçalhos de tabela e superfícies; logótipo original intocado |
| G06 | Média | Modal podia ter título comprido a disputar espaço com o botão de fecho | `styles.css`: título com quebra, fecho com dimensão mínima e altura limitada a viewport dinâmico |
| G07 | Baixa | Polling de 800 ms para um único atalho de calendário | `hr-vacation-planning-v4.js`: eventos de arranque, vista, utilizador e permissões; uma única entrada por ID |
| G08 | Média | Auditoria ainda declarava Stock ausente após recuperação | `tests/profile-audit-browser.py`: verifica controladores recuperados. Relatórios anteriores são snapshots históricos, não estado atual |
| G09 | Baixa | Um separador inventariado como Equipamentos abria fallback Dados, não um separador independente | Corrigido o percurso de teste para os separadores efetivamente definidos; Equipamentos permanece na secção de desenvolvimento existente. Não foi inventado um novo separador |
| G10 | Alta | Botões de Segurança marcavam backup/restauro como concluídos sem os executar | `gs-enterprise.js`: usam cópia local sintética existente e checksum/JSON efetivo; sem marcar restauro real. Registos antigos preservados e identificados como declarativos |
| G11 | Alta | Escritor antigo de clínicas não reutilizava o editor/permissões atuais | `gs-enterprise.js`: entradas antigas delegam para ClinicMaster; escritor antigo bloqueado quando o atual está disponível; testes negativos para os seis perfis |
| G12 | Alta | Administração/Médico/Técnico de demonstração podiam ficar sem associação válida, bloqueando operações autorizadas | `demo-clinic-associations-v4.js`: reparação única, só IDs/emails/perfis sintéticos conhecidos, sem alterar permissões; não repara revogações posteriores nem identidades reais |
| G13 | Alta | Normalizador apagava referências de clínicas/especialidades desconhecidas | `v4-data-integrity.js`: preserva referências originais não resolvidas; não concede acesso a clínicas ausentes/inativas. Dados perdidos anteriormente não são reconstruídos automaticamente |
| G14 | Média | Exportação PDF nativa da conta corrente não incluía o logótipo oficial | `finance-core-v4.js`, `finance-ui-v4.js`: JPEG original reutilizado a partir do único recurso oficial, sem redesenho/recompressão; logo em todas as páginas e preservação de saldos/linhas |
| G15 | Média | Ficha RH reaberta mantinha scroll anterior, deixando campo sob o cabeçalho fixo | `hr-master-v4.js`: reposiciona a ficha no início ao abrir; capturas e diagnóstico de controlos após correção |

## Matriz de módulos e operações

| Área | Implementação / operações abrangidas | Evidência de regressão | Limites / pendências |
|---|---|---|---|
| Dashboard | Âmbito de clínicas, filtros de data, pesquisa, séries, agregações operacionais | `profile-audit`, `runtime`, `consolidation`, `opening-composition` | Dados demonstrativos; latência medida no runner não é desempenho de tablet real |
| Clínicas | Ficha mestre, documentação, datas/validade, configuração, histórico e acessos | `improvements`, `stock-tables`, `documents`, `p0` | Arquivo privado real e verificação documental legal pendentes |
| Operação diária | Equipa só médicos/só técnicos/mista/administrativa, três contagens médicas, capacidade técnica, guardar abertura, listas e fecho | `operation`, `opening-composition`, `stock-closing`, PostgreSQL | Escritores de produção desativados; pendências históricas não são apagadas |
| Tarefas | Catálogo separado da execução, tarefas aplicáveis, pendências, fecho obrigatório, bloqueio do escritor paralelo | `runtime`, `operation`, `global-audit`, `profile-audit` | Alertas antigos requerem reconciliação aprovada; sem limpeza automática |
| Notificações | Agregação por perfil/titular/clínica, contadores, consulta/decisão separadas | `improvements`, `employee-documents`, `attendance`, `stock-closing` | Não demonstra push/email real |
| RH / Ficha 360° | Dados/contrato, resumo, tempo, férias, financeiro, desenvolvimento, histórico, criação explícita sem registo vazio | `profile-audit`, `improvements`, `global-layout`, `stock-tables` | Formação/equipamentos/medicina ocupacional têm cobertura parcial; não é prova de todo o ciclo laboral |
| Livro de Ponto | GPS rápido, horários, baixas, pedido manual, aprovação/recusa, auditoria, concorrência, exportação disponível | `attendance`, PostgreSQL, `branding` | GPS do Chromium é sintético. PDF usa impressão; não é prova de localização real/autenticidade laboral |
| Férias/baixas | Saldos, calendários, períodos exatos, pedidos/decisões, histórico, clínica | `runtime`, `performance`, `profile-audit`, `attendance` | Regras laborais e políticas específicas continuam sujeitas a validação; assinatura não ligada |
| Documentos pessoais | Catálogo/checklist únicos, upload próprio, validação RH, versões, decisões, histórico e download | `employee-documents`, PostgreSQL, `document-catalog` | Preview guarda sintéticos no navegador; serviço real privado/sessões não ligado |
| Candidatos | Cinco etapas, seletor/toque, entrevista/recusa/contratação confirmadas, ligação ao colaborador | `recruitment`, `candidate-pointer`, `stock-tables`, PostgreSQL | Integração real da caixa de email e envio efetivo dependem de configuração |
| Entrevistas | Presencial/tele, clínica/morada/contactos, notas, versões, avaliação, reagendamento e histórico | `interview`, `recruitment`, PostgreSQL | Gravação, transcrição e IA reais continuam desativadas sem infraestrutura segura |
| Financeiro | Faturas, recibos, validações, conta corrente, movimentos, pagamentos, substituição, notificações | `finance`, `documents`, `improvements`, testes SQL temporários | Provedores fiscais/bancários, emails e arquivo de produção não ativados |
| Stock | Inventário, pedidos, encomendas, movimentos, transferências, receções parciais e isolamento | `stock-domain`, `stock-tables`, PostgreSQL | Integração fiscal e arquivo real pendentes; não representa inventário real |
| Empresas fornecedoras | Gestão comercial privada CEO, entregas separadas de receção da clínica | `supplier-companies`, PostgreSQL | Sem faturação automática nem partilha de custos internos com clínicas |
| Fecho e bónus | Vendas/consumos, correções, stock, acumulação trimestral num único movimento existente | `stock-closing`, PostgreSQL | Sem movimentos financeiros diários paralelos; sem pagamento real |
| Marketing | Campanhas, metas, orçamentos, funil, calendário, filtros por clínica, propostas de abertura e aprovações | `marketing`, `candidate-pointer`, PostgreSQL | IA externa, imagens IA, Google/Meta/publicação e investimento não ligados; nunca tratados como reais |
| Reclamações | Clínica/ator, anexos sintéticos, colaboradores envolvidos, funil por toque, etapas, prazo de 15 dias corridos, histórico/reabertura | `complaints`, `complaints-enhancements`, PostgreSQL | Regra operacional de 15 dias preservada; envio efetivo e parecer jurídico não testados aqui |
| Chat | Conversas, envio/leitura sintéticos, contadores e destino; superfícies corrigidas | `browser`, `profile-audit`, diagnóstico visual | Sem comunicação autenticada entre dispositivos no preview |
| Tabelas | Clínicas, catálogo, contratos/checklists, permissões, associações, calendários e emails com destinos próprios | `stock-tables`, `document-catalog`, `profile-audit` | Sem migração destrutiva nem novo catálogo; integrações externas continuam pendentes |
| Relatórios / Segurança | Navegação, dados disponíveis, consultas e isolamento; inventário de controlos | `profile-audit`, `runtime`, `p0`, `release-readiness` | Backups no browser não são cópias privadas operacionais; não executar restauros/limpezas reais |
| Áreas reservadas / login | Acessos próprios, simulação CEO, logo, páginas autenticadas com falha segura sem backend | `profile-audit`, `branding`, `p0`, API/SQL isolados | Não demonstra autenticação central ou persistência entre dispositivos |

## Duplicações e preservação

- Nenhum ficheiro, tabela, histórico, anexo ou registo foi apagado. Nenhum módulo foi reescrito.
- O escritor operacional legado e o motor canónico eram paralelos; apenas o escritor legado fica bloqueado no programa atual. Os dados antigos ficam intactos, sem migração automática.
- O Catálogo Mestre e as checklists existentes, `employeeDocuments`, Stock e permissões existentes continuam como fontes partilhadas.
- O polling do atalho foi substituído pelos eventos existentes, preservando os pontos de entrada antigos.
- O inventário não justifica remover funções com nomes iguais, adaptadores, scripts de login ou compatibilidade antiga.
- `BASICO` é uma compatibilidade antiga ainda presente na política; os seis perfis pedidos são os perfis auditados. Não foi removida nem remapeada silenciosamente essa função antiga, porque poderia alterar permissões de registos existentes.

## Testes e evidências finais

Executar `npm test`, build, consolidação executada por `tests/runtime.cjs`, os oito conjuntos PostgreSQL descartáveis e as suites Chromium do workflow `v4-stabilization.yml`. A nova suite `global-layout-browser` verifica Financeiro, filtros, tabelas, modal e menu a 700 px, em ambos os temas. A suite de perfis guarda a matriz esperado/observado, inventário de controlos, tempos de abertura e diagnóstico visual por superfície; os cenários de regressão exercitam as operações dos respetivos módulos.

As imagens antes e depois e as matrizes estão nos artefactos dos commits correspondentes. A comparação quantitativa de diagnósticos não é uma comparação automática de pixels. A recolha não mede carga de produção, não valida serviços externos e não constitui garantia de ausência de todos os defeitos. Os resultados finais só são válidos quando a execução do commit entregue estiver concluída no GitHub Actions.

## Falha intermédia efetivamente encontrada

O commit `7a7d983` teve 23/24 jobs aprovados. O percurso de perfis parou ao tentar selecionar uma clínica para Administração Teste: o seletor não tinha opções autorizadas. Não foi considerado aprovado. As primeiras 2 314 verificações passavam e a inspeção visual não encontrou cortes/contraste nos ecrãs já percorridos; isso não provava o percurso completo. A correção G12 mantém a exigência de clínica e corrige apenas os dados sintéticos identificados. O commit final tem de repetir integralmente a auditoria.

## Resultado intermédio das correções de âmbito e segurança

Commit `9a6b0ed`: [Actions 39637679915](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/39637679915), **24/24 jobs aprovados**. Percurso ampliado: **4 350 verificações, zero falhas**, 180 classificações externas não testáveis. Por perfil: Call Center 600, Médico 576, Técnico 576, Administrativo 612, Administração 960, CEO 1 026. O diagnóstico visual passou de 4 656 ocorrências para **4 sobreposições**, sem cortes ou falhas de contraste nas superfícies inspecionadas. As quatro estavam na reabertura da ficha RH com scroll anterior; G15 corrige esse comportamento e exige nova execução. G14 acrescenta o logótipo ao PDF nativo, preservando bytes do JPEG e contas/linhas; o PDF demonstrativo identifica-se como não oficial. PDF sintético também validado e renderizado localmente, sem dados reais.

## Funcionalidades incompletas e prioridades seguintes

1. **P1 — integração central:** sessões reais, recuperação de palavra-passe, revogação, UI/API autenticada e persistência entre utilizadores/dispositivos ainda não demonstradas neste preview estático. PostgreSQL descartável comprova serviços/concorrência nos cenários executados, não uma instalação Neon operacional.
2. **P1 — documentos reais:** fornecedor privado, scanner, backup verificado, recuperação, retenção legal e ligações da UI a sessão/arquivo real ainda pendentes. Não carregar documentos reais.
3. **P1 — cobertura residual:** ações apenas inventariadas, todos os casos de dados históricos, todos os formulários condicionais e conteúdo extremamente longo não estão automaticamente aprovados pelas suites existentes. Consultar `controls` na matriz para a fila de testes manual/automática. Não apresentar como auditoria exaustiva de cada combinação possível.
4. **P1 — reconciliação de legado:** tarefas/alertas operacionais históricos e função BASICO exigem plano de reconciliação sem perda de história. Nenhuma limpeza de dados foi executada.
5. **P2 — RH completo:** formação, equipamentos, aptidão ocupacional, assinatura eletrónica e geradores oficiais nativos permanecem parciais ou dependentes de infraestrutura/validação. A ficha abrir não os torna concluídos.
6. **P2 — fornecedores externos:** email, fiscalidade, gravação, transcrição, IA, Google/Meta e publicação permanecem não ligados até configuração/autorizações aplicáveis. Não foram inventados envios, métricas, receitas ou decisões automáticas.
7. **P2 — validação humana:** testar o novo preview no tablet Android real; a emulação tátil Chromium não substitui GPS, permissões, teclado, áudio ou desempenho do dispositivo físico.

O preview final continua isolado e sintético, protegido no projeto Vercel já existente. Não altera main, produção, domínios, credenciais ou bases reais.
