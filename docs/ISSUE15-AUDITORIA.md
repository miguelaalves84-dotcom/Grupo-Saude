# Tarefa #15 — diagnóstico e âmbito

Base: 8e5bcd69, com relatório posterior 1cc02c53 preservado; branch dev/v4-stabilization-20261017, PR #13 draft.

| Área | Diagnóstico | Decisão |
|---|---|---|
| Meu RH | hr-separation-v4.js apresenta um bloco longo; hr-portal-ui-v4.js acrescenta outro grupo de ações | Reorganizar por áreas com os mesmos controladores. Preservar resumo, pedidos e campos existentes em secção recolhível |
| Regulamentos | O contador indica pendências. Biblioteca nova sem conteúdos publicados pode mostrar 0 corretamente; armazenamento é próprio de cada host | Separar número publicado de pendências; estado vazio explicativo; filtros por tipo; testar publicação/consulta/confirmação/nova versão |
| Backoffice | Gestão institucional já existe em Recursos Humanos com filtros | Reutilizar; tornar distinção pessoal/gestão explícita; acrescentar gestão administrativa de saúde ocupacional |
| Formação | hrTraining e regras contratuais já existem; consulta pessoal está num modal pouco expressivo | Página pessoal com progresso, sessões, histórico e referências a certificados permitidos; sem impor 40h nem ampliar gestão de equipamentos/despesas |
| Medicina do Trabalho | Pesquisa por medicina/aptidão/occupational não encontrou implementação | Acrescentar domínio administrativo, reutilizando pessoas, clínicas, catálogo/documentos pessoais, notificações e persistência isolada do portal |
| Documentos | Declarações/assinaturas, regulamentos e questionários versionados da #14 funcionam nas suites | Preservar os fluxos e bloqueios; não substituir confirmação de leitura por assinatura |

## Regras de segurança

Sem diagnósticos, resultados de exames ou notas clínicas neste domínio. Aptidão estritamente administrativa, apenas a informação permitida. Ficha de aptidão associada ao tipo correspondente do Catálogo Mestre, nunca a um documento arbitrário. Validação administrativa não prova assinatura digital nem legalidade do documento.

Periodicidade e próxima data dependem da indicação do médico do trabalho, circunstâncias e enquadramento confirmado; não fixar intervalo comum nem calcular prazos legais automaticamente. Alertas 60/30/7 configuráveis e vencimento são operacionais. Regresso após ausência superior a 30 dias e alteração relevante de condições são eventos administrativos, sem detalhes médicos.

Preview e dados exclusivamente sintéticos; não ativar prestadores, emails, arquivo real, migrações ou produção. Backend isolado testado não equivale a ligação UI/API central operacional. Validação jurídica e Android físico continuam necessárias.

## Alterações entregues

| Área | Alteração | Fonte única preservada |
|---|---|---|
| Navegação pessoal | Oito acessos por assunto: Férias/ausências, Horário/ponto, Documentos/regulamentos, Medicina do Trabalho, Formação, Avaliações, Recibos/financeiro e Comunicados | Controladores existentes; sem novas entradas paralelas no menu |
| Resumo pessoal | Nome visível no cabeçalho; dados, saldos, pedidos e documentação anteriores mantidos num resumo recolhível | hr-separation-v4.js; campos e registos não removidos |
| Regulamentos | Contagem de publicados separada de pendências, filtro por tipo, estado vazio explicativo, publicação/consulta/confirmação por versão | hrCompanyDocuments e hrCompanyResponses da tarefa #14 |
| Pesquisa | Cartões pesquisáveis; resultados em dados pessoais recolhidos abrem o resumo; limpar restaura o estado anterior, sem recriar os campos | global-search-v4.js, com alteração limitada ao resumo do Meu RH |
| Formação pessoal | Página dedicada, progresso do ano corrente, cursos/sessões, horas validadas e certificados pessoais permitidos; estado vazio útil e meta apenas quando validada | hrTraining, regras contratuais e documentos existentes; sem meta universal automática |
| Backoffice | Acessos dentro de Recursos Humanos a documentos institucionais, saúde ocupacional, formação, avaliações e aprovações; filtros de clínica/colaborador | Cadastros e controladores anteriores reutilizados |
| Medicina do Trabalho | Ficha administrativa única por colaborador/clínica; exames de admissão, periódicos e ocasionais, datas, prestador, indicação de periodicidade, aptidão permitida, convocatória manual e histórico | hrOccupational no mesmo estado/persistência do portal; sem nova base/tabela ou arquivo de ficheiros |
| Estados e prazos | Por agendar, Agendado, Realizado, Pendente validação, Válido; Vencido calculado pela data. Avisos 60/30/7 selecionáveis e vencimento, com atualização diária em Europe/Lisbon | Datas e alertas derivados da ficha, sem reiniciar prazos por consulta |
| Eventos | Regresso após ausência superior a 30 dias e alteração relevante de condições; datas e autoria preservadas | Informação administrativa, sem motivo clínico ou diagnósticos |
| Documentos de aptidão | Associação apenas ao tipo Ficha de aptidão do Catálogo Mestre; documento validado, próxima data e conferência exigidos para estado Válido | employeeDocuments e serviço de documentos existente; não copiar os ficheiros para saúde ocupacional |
| Permissões | CEO/Administração gerem conforme âmbito; os restantes consultam apenas a própria informação administrativa. Validação exige revisão documental; sem essa permissão é possível agendar sem listar documentos restritos | Domínio, API isolada, interface e cadastros existentes |
| Notificações | Um alerta corrente por ficha, faixas de antecedência e vencimento; ação abre o colaborador/clínica corretos | Sistema de atenção existente, sem segunda fila nem email fictício |
| Declarações e questionários | Bloqueio de assinatura real das declarações preservado; regulamento não exige assinatura; questionários materialmente alterados exigem nova resposta | Domínio institucional da #14 preservado |

Não foram removidos dados, documentos, históricos, tabelas ou módulos anteriores. O modal pessoal de formação foi substituído pela página de consulta; a gestão continua no componente RH anterior. O resumo anterior mantém as funcionalidades que já existiam, agora recolhidas por defeito. Não foram alteradas regras de ponto/GPS, férias, salários, Financeiro, Stock ou Operação Diária.

## Diagnóstico dos regulamentos

O contador anterior contava pendências; 0 não comprovava ausência de regulamentos. A biblioteca institucional padrão também podia começar vazia. Não foi lido o armazenamento do tablet, pelo que não se afirma ter inspecionado os dados concretos desse dispositivo. A nova interface distingue publicados de ações pendentes, mostra os filtros e explica o vazio. A publicação real do conteúdo sintético pelo backoffice foi testada antes da consulta por cada perfil.

Nenhum regulamento real foi inventado ou automaticamente publicado. Dados guardados noutro host de preview não são importados automaticamente; os deployments anteriores não foram alterados. Ver [percursos de validação e limites](ISSUE15-LIMITES-E-VALIDACAO.md).

## Problemas encontrados e corrigidos durante a execução

- O nome do colaborador ficou inicialmente no resumo recolhido: restaurado no cabeçalho visível.
- A nova navegação precisava de continuar pesquisável: cartões associados à pesquisa existente.
- A pesquisa anterior esperava linhas sempre abertas: corrigida a abertura contextual do resumo e restaurado o estado ao limpar; o teste também percorre o novo resumo antes de consultar os dados anteriores.
- Prevenção de segunda ficha para o mesmo colaborador/clínica e preservação do histórico na atualização.
- Registo de alertas diário, mesmo sem alteração de dados, usando o dia de Lisboa.
- Respeito pela permissão de revisão documental no formulário de saúde; não ampliar o acesso de gestores sem essa permissão.

## Commits e validação efetiva

- f28e2384: reorganização do Meu RH, regulamentos e domínio administrativo de saúde.
- 5ac8699c: identificação visível, ficha única e atualização diária de alertas.
- d1e62cf8: pesquisa dos cartões, permissões documentais e capturas por área.
- **e61297411d977c0d25c08ae219d45d9bc0b896eb**: pesquisa do resumo recolhido e instruções documentais claras.

[GitHub Actions — 51/51 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41504712701). Somente a execução deste último SHA é considerada aprovada; as falhas intermédias não foram apresentadas como aprovação.

Inclui npm test, sintaxe, build, PostgreSQL descartável, API/permissões, concorrência e regressões Chromium. O PostgreSQL verifica agendamento persistente entre identidades autorizadas, isolamento, rejeição de campos clínicos, CAS e histórico; a conferência de aptidão é testada no domínio e na UI com documento sintético. Não é prova de arquivo privado ou assinatura real operacional.

| Perfil | Tarefa #15 | Regressão #14 | Falhas |
|---|---:|---:|---:|
| Call Center | 138 | 108 | 0 |
| Médico | 138 | 108 | 0 |
| Técnico | 138 | 108 | 0 |
| Administrativo | 138 | 108 | 0 |
| Administração | 138 | 108 | 0 |
| CEO | 138 | 108 | 0 |

**828 + 648 = 1 476 verificações** nas duas suites específicas. Os números contam verificações repetidas nas seis combinações de ecrã/tema, não funcionalidades distintas. Computador 1440×1000, tablet 1280×800 e telemóvel 390×844, claro/escuro; a suite #15 inclui ações por toque nos formatos móveis. Chromium não equivale a Android físico.

- [108 capturas: Meu RH, formação e saúde ocupacional](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41504712701/artifacts/13169114816).
- [36 capturas e regressão dos documentos institucionais](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41504712701/artifacts/13170094138).
- [Resultados detalhados versionados](evidence/issue15-meu-rh-20261102-results.json).

Capturas em artefactos retidos durante 14 dias; resultados e matriz ficam versionados. Foram verificados pesquisa positiva/limpeza, resumo, publicação, confirmação/nova versão, formação em página, criação/agendamento/conferência administrativa, dados próprios, prazos, notificações, histórico, recarregamento e ausência de duplicados nos cenários executados.

## Preview READY e verificação da publicação

https://grupo-saude-v4-validacao-sintetica-fgibj6jjt-grupo-saude.vercel.app

Deployment dpl_7TZ2yb3oRYkkzdqoj8dseVZ1nQ8A, staging protegido; código e61297411d977c0d25c08ae219d45d9bc0b896eb. HTTP 200 autenticado pela ferramenta autorizada na página, manifesto e módulos alterados. HTML, JS e CSS servidos iguais aos ficheiros testados. Pode ser necessário iniciar sessão Vercel com conta autorizada.

Build: 108 assets mais _headers; pacote de 111 objetos estáticos. Sem executáveis de backend, .env, bases de dados, backups ou ficheiros privados. A verificação de padrões de credenciais nos ficheiros alterados não encontrou correspondências.

## O que permanece pendente

- Validação visual e de teclado num Android físico.
- Interface ligada a autenticação/persistência central entre dispositivos; os testes PostgreSQL isolados não demonstram essa integração ativa no preview.
- Arquivo privado, autenticidade dos documentos, assinatura digital das declarações, convocatórias/email reais e prestador operacional.
- Validação médica, jurídica, de privacidade, conservação e recuperação antes de dados reais. Não foram aplicados prazos legais rígidos nem declarada conformidade RGPD integral.

Ver [limites e instruções](ISSUE15-LIMITES-E-VALIDACAO.md). O estado Válido de saúde é conferência administrativa sintética; signatureVerified continua false e não foi simulada assinatura válida.

Branch dev/v4-stabilization-20261017; PR #13 em rascunho; main preservada em 84fba5a2d6d7afcb0723ca312f4e617acc22823d. Sem merge, force push, migrações reais, produção ou ativação de serviços externos.
