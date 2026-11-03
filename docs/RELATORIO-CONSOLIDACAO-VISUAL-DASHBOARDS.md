# Consolidação visual final dos sete dashboards

Base: 77e8e861, validada visualmente num tablet Android pelo utilizador. A [auditoria prévia](AUDITORIA-CONSOLIDACAO-VISUAL-DASHBOARDS.md) identificou os componentes comuns antes das alterações. Branch dev/v4-stabilization-20261017; PR #13 em rascunho.

## Componentes corrigidos

| Componente | Correção | Preservação |
|---|---|---|
| Cabeçalho global | Nome curto da página, sem «Visão geral ·»; espaço reservado; quebra apenas entre palavras quando necessária | Pesquisa, perfil, notificações, tema e saudação executiva |
| Cartões | Grelha comum auto-fill, mínimo confortável, máximo de quatro colunas; mantém posições vagas em vez de esticar cartões isolados | Valores, fontes, período e ações existentes |
| Contexto e serviços | Grelha compacta partilhada; etiquetas de estado; serviços globais independentes do filtro clínico | Ausência de serviços centrais ativos no preview |
| Financeiro | Conferência recolhida por defeito, sem repetir o cartão de pagamentos | Créditos e variação do saldo consultáveis, separação Caixas/Faturação/Conta corrente |
| Gestão | Nome da clínica abre diretamente a documentação da clínica, condicionado à permissão | Tabela comparativa, reclamações, prazo original e retorno ao dashboard |
| Atenção | «Implementações pendentes» separado de «Requer atenção» | Centro de atenção e contadores existentes, sem novas notificações |

A folha de estilos partilhada foi consolidada, retirando regras repetidas da grelha e estilos sem elementos correspondentes no dashboard atual. Não foram removidos controladores, formulários ou registos de negócio. Tabelas e gráficos podem continuar a ocupar a largura disponível; os cartões numéricos não são obrigados a preencher uma linha inteira.

## Fontes disponíveis acrescentadas

- Operação: tabela de consultas, técnicas e tratamentos por clínica/categoria a partir de `GSOperationCore.statistics`; não existe uma segunda fórmula de ocupação.
- Técnicos: capacidade, marcações, vagas atuais e do dia seguinte da última abertura/jornada guardada; ocupação calculada por `GSOperationCore.metrics`. A data da jornada e a limitação temporal ficam explícitas. Isto não é disponibilidade sincronizada em tempo real.
- Um rascunho criado pela inicialização de Operação não substitui a última capacidade registada. O teste compara os resultados antes e depois de acrescentar esse rascunho, sem modificar o histórico.
- Área pessoal: documentos próprios por regularizar via checklist existente e próxima escala explicitamente publicada do próprio utilizador, nas clínicas autorizadas. Ausências e folgas continuam a ser interpretadas por `GSAttendanceCore.dailyPlan`.
- Saldo de férias: na demonstração local, reutiliza `HRLeaveV4.balance`, apenas quando existir enquadramento explícito na ficha/tipo de contrato. Sem enquadramento, mostra «Saldo por confirmar», sem aplicar um novo valor presumido. O ano e o âmbito individual, sem repartição clínica fictícia, ficam identificados.

Não foram alteradas regras de férias, baixas, contratos, diuturnidades, escalas, pagamentos, aprovação ou retenção.

## Sete dashboards

| Dashboard | Estado desta intervenção |
|---|---|
| Geral | Quatro indicadores e gráficos anteriores preservados; os quatro resumos por área usam a grelha comum e as permissões anteriores |
| Área pessoal | Cartões compactos; horário, próxima escala publicada, saldo condicionado a dados configurados e documentos exclusivamente próprios |
| Gestão | Grelha preservada; clínicas acionáveis; reclamações e comparação existentes mantidas |
| Operação | Grelha preservada; separação de atividade por categoria, comparação clínica e capacidade dos técnicos nas fontes registadas |
| Recursos Humanos | Indicadores e divisão por assuntos preservados; cartões de assiduidade, documentos, saúde, desenvolvimento e contratos compactados |
| Financeiro | Cartões compactos em todas as secções; moeda EUR e referências temporais mantidas; conferência complementar recolhida |
| Administração do sistema | Contas/auditoria compactadas; serviços em grelha; estados e implementações futuras separados dos incidentes |

A distribuição de colaboradores por clínica continua a representar associações; não é somada como se fossem pessoas únicas. As projeções não fazem novas gravações, não alteram fórmulas operacionais ou financeiras e não criam tabelas paralelas.

## Estados de serviços

Autenticação, base de dados central, emails, arquivo, backups e integrações: **inativos neste preview**, com funcionamento real **não verificado**. A ajuda distingue operacional/verificado, simulado, pendente, inativo e não verificado. Não existe um selo de funcionamento real derivado de configurações ou testes sintéticos.

## Regressão detetada e corrigida

Transformar o nome da clínica em botão expôs uma dependência da pesquisa transversal: o indexador ignora botões de ação. A linha passou a declarar explicitamente o nome pesquisável através do mecanismo existente `data-search-text`. Não se alterou o indexador global nem se retirou o teste de pesquisa por maiúsculas e acentos. A regressão é coberta pela suite transversal e por um teste de consulta/retorno à ficha.

## Validação e publicação

Código publicado: **7e13333b8fd77d33fb633c0c90ff8411916ea092**.

Preview protegido **READY**: https://grupo-saude-v4-validacao-sintetica-ke8jvcol8-grupo-saude.vercel.app

- [GitHub Actions: 54/54 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41684994674).
- Suite específica: **2262 verificações, zero falhas**, seis perfis × três formatos × dois temas. São verificações, não funcionalidades distintas.
- CEO 532; Administração 530; Call Center 282; Médico 282; Técnico 282; Administrativo 354.
- Sintaxe, `npm test` e build aprovados no CI; verificações locais de sintaxe, domínio e build também aprovadas.
- PostgreSQL descartável, API/permissões, segurança, pesquisa transversal, edição de texto, referência visual e regressões existentes aprovados.
- HTTP 200 confirmado através do conector autorizado Vercel em seis caminhos: raiz, manifesto e quatro ficheiros JS/CSS. Os conteúdos correspondem exatamente ao pacote local e o manifesto/metadados identificam o código acima. O acesso pode exigir conta Vercel autorizada; a proteção não foi desativada.
- Os testes Chromium ocorreram no CI isolado, com toque e viewport simulados. A verificação remota foi HTTP e comparação de ficheiros; não foi apresentada como validação física Android nem como navegação Chromium no URL protegido.
- [Capturas dos sete dashboards](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41684994674/artifacts/13253848614), [comparação com a referência](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41684994674/artifacts/13254977769) e [Dashboard Geral com cenário executivo sintético](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41684994674/artifacts/13253353796).
- [Índice versionado de jobs, resultados e capturas](evidencias/consolidacao-visual-dashboards.json). Os ficheiros PNG estão nos artefactos, sujeitos à retenção do workflow.

### Capturas de tablet — 1280 × 800

No artefacto «Capturas dos sete dashboards», os nomes são:

| Dashboard | Claro | Escuro |
|---|---|---|
| Geral | u1-tablet-light-general.png | u1-tablet-dark-general.png |
| Área pessoal | u1-tablet-light-personal.png | u1-tablet-dark-personal.png |
| Gestão | u1-tablet-light-management.png | u1-tablet-dark-management.png |
| Operação | u1-tablet-light-operation.png | u1-tablet-dark-operation.png |
| RH | u1-tablet-light-hr.png | u1-tablet-dark-hr.png |
| Financeiro | u1-tablet-light-finance.png | u1-tablet-dark-finance.png |
| Sistema | u1-tablet-light-system.png | u1-tablet-dark-system.png |

A pesquisa de padrões de credenciais nos sete ficheiros alterados não encontrou correspondências; não equivale a garantia absoluta de ausência de segredos. Os 143 ficheiros publicados foram conferidos por hash/tamanho e excluem backend, bases de dados e credenciais. Os exemplos PDF preservados são sintéticos. Main manteve o mesmo commit e o projeto de produção manteve a configuração; nenhuma migração, ativação de serviços ou pagamento foi executado.

Os testes cobrem os seis perfis, três formatos, dois temas, dimensões efetivas do cabeçalho/cartões, filtros, fontes canónicas, isolamento, dados próprios, clínicas acionáveis e regressões. As capturas incluem o Dashboard Geral para CEO/Administração e os seis dashboards de área quando autorizados.

## Pendências objetivas

1. Validar estas alterações no tablet Android físico; a validação física comunicada pelo utilizador refere-se à base 77e8e861.
2. Saldo sem enquadramento contratual explícito fica por confirmar. Escalas futuras não publicadas não são inventadas.
3. Capacidade/vagas são as últimas guardadas e datadas; sincronização clínica em tempo real não existe neste preview.
4. Leitores centrais podem não carregar todas as fontes auxiliares; fontes ausentes permanecem indisponíveis. Saldo na apresentação local não significa saldo integrado numa API central ativa.
5. Autenticação central, persistência, arquivo privado, backups operacionais e integrações reais continuam fora do âmbito desta intervenção e desativados.

A demonstração utiliza dados sintéticos no navegador. Não partilha dados entre dispositivos nem transfere automaticamente o armazenamento de um URL anterior. Produção, main e dados reais devem permanecer intactos.
