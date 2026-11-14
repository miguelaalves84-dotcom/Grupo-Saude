# Grupo Saúde V4 — tarefa #8 (itens 4–8)

Base remota: PR #7, `1b8f244886fa6a114badad3a78251b207195c158`, incluindo as correções dos PR #5/#7. Branch `feat/v4-rh-performance-issue-8`. Revisão incremental contra a branch do PR #7. Sem merge para main, promoção, restauro ou migração de dados.

## Implementação

### Calendários e férias

- A ficha de férias começa pelo calendário mensal, seguido dos detalhes e histórico. O colaborador vê os próprios dias e feriados; o contexto dos colegas exige autorização CEO/Administração.
- A Central de Aprovações apresenta calendários na lista e na consulta. Cada pedido tem navegação mensal independente, destaque do pedido, férias aprovadas/pendentes, baixas, nomes, sobreposições e cobertura diária de pessoas ativas da mesma clínica/função.
- O mesmo `HRLeaveUIV4.calendarMarkup` serve lista e ficha; os cálculos continuam no domínio do PR #7. O mês mostra também ausências fora dos dias pedidos, sem contar o requerente como ausente nesses dias. Conflitos de equipa não impedem aprovação automaticamente.
- A ficha RH, em Férias/Ausências, tem **Editar / Reagendar** para férias aprovadas quando CEO/Administração têm `hrManage` e `leaveApprove`. A ação reutiliza a seleção parcial e a transação do PR #7: dias restantes, saldo, feriados, motivo obrigatório, original, revisões, auditoria e notificações.
- Foi preservado o seletor de contexto para colaboradores com várias clínicas. Os estilos são responsivos.

### Avaliação de Desempenho

- Acesso em RH → Avaliação de Desempenho, na ficha individual e em Meu RH.
- Novas permissões configuráveis: `performanceManage`, `performanceRead` e `peerReview`. Gestão exige CEO/Administração e `hrManage`; as outras funções consultam avaliações próprias validadas e respondem aos ciclos atribuídos com autorização. Defaults só preenchem permissões ausentes, preservando `false`.
- Apenas o CEO valida versões de regras e decisões. Administração autorizada propõe avaliações. Frequências mensal (`AAAA-MM`), trimestral (`AAAA-T1`…`T4`) e anual (`AAAA`).
- Critérios e pesos configuráveis, com total de 100%, escala de 1 a 5, pontuação ponderada, objetivos individuais, metas, progresso manual e feedback. Defaults: assiduidade, pontualidade, produtividade, qualidade, tarefas e trabalho em equipa. Nenhuma pontuação é inferida automaticamente do livro de ponto.
- Regras, propostas e decisões são acrescentadas a coleções versionadas; não há edição/apagamento de propostas submetidas ou decisões. A revisão de uma avaliação validada cria outro registo referenciando o anterior. O colaborador consulta as versões validadas, incluindo as anteriores. Propostas/recusas da gestão não são publicadas ao colaborador.
- Cada avaliação preserva uma cópia das regras/critérios utilizados; alterações posteriores não recalculam o passado. A interface do CEO permite consultar versões antigas das regras.
- Integração futura com bónus preparada por uma referência somente de leitura (`financialReviewReference`) para uma avaliação validada, acessível apenas ao CEO, sem montante ou pagamento automático. Remuneração, movimentos e pagamentos existentes não são modificados.

### Questionários entre colegas — versão piloto

- Regras iniciais inativas até validação/ativação explícita pelo CEO. Critérios iniciais: cooperação, comunicação e profissionalismo; nomes/pesos são configuráveis.
- O CEO abre e fecha ciclos por clínica e período. O ciclo preserva os membros e regras de base. São necessários pelo menos `limiar + 1` membros ativos na clínica; limiar mínimo 3, máximo 10.
- Cada membro autorizado avalia outros membros da mesma clínica, independentemente da função. Autoavaliação, colegas de outra clínica, membros inativos, pessoas não atribuídas e respostas repetidas ao mesmo par/ciclo são rejeitados sem escrita.
- A autorização e a pertença atual à clínica são verificadas ao submeter. Revogar `peerReview` ou desativar os questionários bloqueia novos envios. Respostas já válidas permanecem preservadas.
- Respostas definitivas não são alteradas pela interface. Sem comentários livres, para reduzir identificação indireta.
- Nenhum resultado é divulgado durante um ciclo aberto. No fecho explícito pelo CEO, os resultados são congelados. Cada destinatário só recebe um agregado se houver pelo menos o limiar de avaliadores distintos; abaixo disso não são retornados pontuações, contagens exatas ou respostas individuais.
- A interface não apresenta identidades de avaliadores, datas de respostas individuais ou listas de quem respondeu a cada destinatário. Cada participante vê somente o estado dos seus próprios envios. A gestão vê agregados; o colaborador só vê o seu resultado. Médias arredondadas a uma casa decimal.
- Eventos dos pares ficam numa coleção privada do domínio; o log geral não recebe avaliador/destinatário/pontuações de uma resposta. Abertura/fecho do ciclo são auditados sem divulgar os pares.
- Não são permitidos ciclos com períodos sobrepostos na mesma clínica, nem reabertura de ciclos fechados. Não existem filtros de subgrupos no resultado, para reduzir inferência por comparação de cortes.

## Segurança, história e limites reais

Todas as operações novas validam o perfil ativo, sem herdar `ceoRealUser`. A troca de perfil e a alteração de permissões fecham modais privados; interfaces independentes não restauram o detalhe de férias que estava aberto anteriormente. Fichas de outro colaborador exigem autorização RH; a edição da ficha já não depende apenas do nome da função. Conteúdo textual é escapado no HTML.

Coleções anteriores, incluindo registos `hrPerformance` legados, são preservadas. As operações trabalham em cópias e só gravam após validação; não há migração, limpeza ou chamada a APIs/bases de dados de produção. Os previews usam o armazenamento local do seu domínio.

**Este frontend é um protótipo com sessões e dados em localStorage.** As restrições e a confidencialidade são aplicadas nos fluxos da aplicação; uma pessoa com acesso às ferramentas de desenvolvimento do navegador pode inspecionar ou alterar esse armazenamento, incluindo respostas e eventos privados. O histórico é append-only pelas operações suportadas, mas não é criptograficamente imutável. A versão é adequada para testes com dados fictícios. Confidencialidade e imutabilidade robustas com pessoas reais exigem autenticação/autorizações no servidor, respostas privadas separadas, controlos de integridade e auditoria persistente; isso não foi implementado nem ativado em produção nesta tarefa.

A cobertura de férias é uma estimativa de pessoas, não uma escala de turnos. Avaliações/objetivos e questionários não constituem decisões financeiras. Notificações são internas, sem emails enviados.

## Decisões pendentes para versão final

- Critérios, pesos, escala e frequência oficiais; inclusão de indicadores objetivos e revisão de evidências.
- Política de alteração/contestação de respostas e avaliações, substituindo sempre versões sem apagar histórico.
- Limiar definitivo de anonimato, dimensão de grupos, participantes elegíveis (incluindo gestão), retenção, consentimento e acesso a dados privados no backend.
- Política de divulgação quando pessoas mudam de clínica ou função; tratamento de equipas pequenas e períodos sucessivos.
- Se resultados entre colegas entram na avaliação formal; regras de prémios dependem de futura decisão explícita do CEO, sem automatização nesta versão.

## Testes e verificação

- `npm test`: análise sintática de **46 ficheiros JavaScript** e **78 testes** de execução do código real em DOM simulado passaram.
- `GS_BASELINE_DIR=/tmp/gs-baseline npm test`: **81 testes passaram**, incluindo 3 reproduções dos erros históricos do arranque do RH.
- Cobertura: CEO e seis perfis, navegação direta, sessões, permissões persistidas/revogadas, férias, baixas, saldos, reversões, calendários da lista/ficha, edição parcial, regras versionadas, propostas/validação, revisões, objetivos, proteção de acesso, escape HTML, unicidade dos pares, limiar de anonimato, resultados congelados e ausência de alterações financeiras.
- `git diff --check` e análise sintática Python do E2E passaram.
- `npm run test:browser` foi tentado: Chromium foi bloqueado antes de abrir a aplicação (`setsockopt: Operation not permitted`). Não se afirma aprovação dos testes num navegador real. `tests/browser.py` inclui os fluxos anteriores e os novos formulários, proposta/validação CEO e resposta de questionário em contextos isolados.
- Aplicação estática, sem build de framework. O deployment de preview será confirmado pelos checks do Cloudflare.

## Roteiro de teste no preview

1. CEO → RH diretamente → Pedidos de férias: verificar calendários na lista e na ficha, nomes, cobertura, feriados e navegação mensal. Aprovado não tem Aprovar novamente.
2. RH → Colaboradores → ficha → Férias/Ausências → Editar / Reagendar: selecionar parte dos dias, novo intervalo e motivo; conferir restantes dias, saldo e histórico.
3. CEO → Avaliação de Desempenho → Configurar / validar regras: rever critérios/pesos, indicar motivo e guardar uma versão. Ativar questionários apenas para o teste piloto.
4. Administração → Nova avaliação: selecionar colaborador/período, preencher todos os critérios, objetivos, feedback e motivo; enviar proposta. Apenas o CEO consegue Validar/Recusar com motivo.
5. Colaborador → Meu RH → Avaliação de Desempenho: consultar somente avaliações próprias validadas. Propor uma revisão pela gestão e verificar que a versão anterior continua no histórico.
6. Para questionários, usar pelo menos quatro colaboradores ativos na mesma clínica (limiar 3). CEO → abrir ciclo. Cada participante → Meu RH → Questionários → responder aos outros colegas. Confirmar impossibilidade de autoavaliação ou envio repetido.
7. Confirmar resultados ocultos antes de fechar. Fechar pelo CEO: com menos de três respostas distintas para uma pessoa, resultado suprimido; com três ou mais, apenas agregado, sem avaliadores. Depois do fecho não são aceites novos envios.
8. Revogar permissões, trocar perfis e abrir módulos diretamente; confirmar ausência de modais privados persistentes e preservação dos dados do protótipo. Não utilizar dados reais nesta validação de privacidade.
