# Chat — nova experiência de utilização, 25/10/2026

Branch `dev/v4-stabilization-20261017`; PR #13 em rascunho. Base preservada `c51071d` / produto `bd71096`. Decisão final [6391278642](https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6391278642), que prevalece sobre a proposta WhatsApp/Slack anterior. Inspiração em padrões de utilização do WhatsApp; nenhum logótipo, asset, fundo ou marca proprietária copiado. Mantidos identidade, logótipo e cores do Grupo Saúde.

## Implementação

| Área | Alteração | Preservado |
| --- | --- | --- |
| Lista | Iniciais, último texto/ficheiro, hora, contador por conversa; filtros Todas/Não lidas/Grupos; pesquisa dedicada em títulos e mensagens autorizadas | Mesma fonte `conversations`, sem índice paralelo ou contactos de outras clínicas |
| Tablet/computador | Lista à esquerda e conversa à direita; áreas com deslocação própria | Menu global e permissões existentes |
| Telemóvel | Lista ou conversa de cada vez; voltar à lista sem perder o rascunho | Conversa e anexos mantidos na origem local |
| Composição | Barra no fundo do painel, texto multilinha, Shift+Enter, Enter protegido durante IME; adaptação à altura do viewport | Editor nativo, sem normalizar texto durante digitação; `GSSafeActionsV4` |
| Reações | Toque/clique ou pressão de 450 ms abre paleta; movimento superior a 10 px cancela a pressão para permitir deslocação | Ator, nome e data/hora obtidos do contexto; sem confirmação acidental por scroll |
| Emojis | 👍 ❤️ 😂 😮 😢 🙏; uma reação comum ativa por pessoa/mensagem, com substituição/remoção auditadas | ✓ Feito mantém circuito próprio, independente de leitura e emoji |
| ✓ Feito | Chip discreto, estrela da primeira confirmação; tocar abre nomes, datas e histórico | Vários colaboradores; primeira identidade preservada após retirada/recolocação; não conclui tarefas |
| Respostas | Referência à mensagem original, pré-visualização, cancelar resposta e saltar para a origem | Referência validada no domínio/API dentro da conversa autorizada; não copia nem reativa ficheiros expirados |
| Anexos | Cartão compacto com nome, tipo/tamanho e prazo; botão de download só durante a validade | Validador partilhado, cinco ficheiros até 3 MB, confirmação sintética e sete dias exatos por upload |

A pesquisa global genérica deixa de se sobrepor ao campo dedicado do Chat. Não há motor duplicado: a pesquisa opera sobre a lista já filtrada pelo domínio, sem pesquisar anexos binários ou arquivo central. Filtrar uma lista não marca outras conversas como lidas. No telemóvel, a lista inicial também não marca a primeira conversa como lida antes de ser aberta.

## Gestos e acessibilidade

- Pointer Events, sem biblioteca ou dependência nova. Movimento/cancelamento interrompem a pressão; um gesto de scroll não coloca um visto.
- Clique/toque simples na mensagem, botão discreto acessível e Enter/Espaço no balão também abrem as mesmas ações. Ações de ficheiros/chips/respostas não são intercetadas como toque no balão.
- A paleta tem nomes acessíveis, foco de diálogo, Fechar/Escape e ações Responder/Copiar/Histórico. Seleção de texto existente não é tratada como clique para reagir.
- O tempo dos gestos usa relógio monotónico; a validade documental continua a usar timestamp real, nunca o relógio de gestos.
- Reações mostram chips; os botões grandes «Feito/Histórico» foram removidos do corpo permanente das mensagens.

## Segurança e compatibilidade

As regras da [entrega anterior](CHAT-IMPLEMENTACAO-20261024.md) mantêm-se: individuais por clínica, Call Center apenas nas clínicas atribuídas, grupos criados/geridos por CEO/Administração, leitura por membros, revogação, simulação sem herança e arquivo privado ainda não operacional.

As novas operações `emoji` e `replyTo` passam pelo mesmo `chat-core-v4.js` usado no servidor. A resposta só pode referir uma mensagem existente na conversa autorizada. Não se aceita um texto de citação fornecido pelo cliente como se fosse a mensagem original. Emojis são uma lista explícita e ator/nome/data não vêm de campos de autoria do payload.

Dados novos são propriedades das mensagens existentes, sem novas tabelas, perda de IDs, reescrita do histórico ou migração real. O prazo de anexos é calculado a partir de cada upload original; responder não cria nova cópia nem prolonga a validade.

## Testes e estado

Local: `npm test`, build de 101 assets, sintaxe Python/JavaScript e verificação de JavaScript embutido nas expressões Playwright. Primeira fixture de histórico multilinha foi corrigida antes da aprovação do ciclo; não se considera uma execução cancelada/apenas preparada como aprovação.

A suite existente do Chat foi adaptada aos controlos novos mantendo os testes de permissões, grupos, documentos, prazos e histórico. Foram acrescentados testes da paleta, toque real CDP em viewport táctil, cancelamento por movimento, emojis, respostas, pesquisa, contadores, duas colunas, uma só conversa no telemóvel, rascunho e viewport reduzido. As suites de pesquisa e escrita foram atualizadas para abrir explicitamente a conversa no modo telemóvel e usar a pesquisa única do Chat.

Código final **`07f3d4bf8820c2d906ef5ddc6d2b4e1f1a273ec7`**. [Preview protegido READY](https://grupo-saude-v4-validacao-sintetica-afinm432j-grupo-saude.vercel.app). [GitHub Actions 40183714251](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40183714251): **38/38 jobs aprovados**, incluindo 36 suites Chromium, regressão Node/build e PostgreSQL descartável. A aprovação física de cinco testes de escrita em f87e344 não certifica este novo desenho. Gboard/Samsung, teclado real, pressão prolongada e ergonomia do novo Chat continuam a exigir validação física.

## Limites operacionais

Preview apenas com dados sintéticos neste navegador. Não fornece autenticação central, entrega entre dispositivos, arquivo privado, scanner ou restauro real. A API/persistência são exercitadas isoladamente em PostgreSQL descartável, com identidade de teste fornecida pelo harness. Nenhum dos quatro P0 é declarado resolvido por este redesign. Não há alterações de main, produção ou serviços pagos.

## Regressões encontradas durante a implementação

1. A primeira digitação na pesquisa trocava a identidade usada pelo renderizador entre pesquisa/compositor. Isso recriava o input e perdia foco. Corrigido com identidade estável da conversa; o teste usa digitação sequencial literal, não apenas `fill`.
2. A nova pesquisa dedicada precisava de integrar o atalho Ctrl+F existente; passou a ser o destino único desse atalho no Chat.
3. No tema escuro, o badge de não lidas precisava de texto escuro sobre o fundo claro. Corrigido e testado por contraste real calculado no navegador (mínimo 4,5:1 para texto pequeno).
4. Corrigida a representação de quebras de linha da fixture sintética; não se alteraram as mensagens do produto para contornar o teste.

Ciclo `f034085`, [40182888856](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40182888856): **38/38 jobs aprovados**, 1512 verificações específicas sem falhas em 36 contextos. A revisão das capturas confirmou duas colunas no tablet e uma só conversa no telemóvel. O ciclo final acrescentou contraste e preservação de Ctrl+F e terminou com **38/38 aprovados** no run 40183714251.

## Validação física a realizar no novo preview

Usar apenas mensagens e ficheiros sintéticos. Confirmar em Android:

1. Pressionar uma mensagem e escolher emoji/✓ Feito; verificar nome, data/hora e primeiro confirmador no painel.
2. Deslocar verticalmente a conversa sem abrir paleta nem reagir por acidente.
3. Escrever com Gboard/Samsung: acentos, sugestões, correção a meio, Shift+Enter quando disponível, copiar/colar e responder sem perder rascunho.
4. Abrir/fechar teclado, rodar o tablet e verificar a barra de composição. O teste automatizado de viewport reduzido não substitui o teclado físico/virtual real.
5. No telemóvel, voltar à lista, procurar uma conversa e regressar ao rascunho; verificar badges e tema escuro.
6. Descarregar um documento sintético e consultar o prazo. O limite exato de sete dias é exercitado automaticamente, não exige esperar sete dias para esta validação.

A nova origem do preview tem armazenamento local separado das anteriores. Não significa eliminação dos dados guardados na origem anterior nem sincronização central.


## Resultado final e evidências

Suite específica: **1560 verificações, zero falhas**, em 36 contextos — seis perfis × computador/tablet/telemóvel × claro/escuro. [Matriz CSV](MATRIZ-CHAT-REDESIGN-20261025.csv) · [Resumo JSON](CHAT-REDESIGN-EVIDENCIAS-20261025.json).

| Perfil | Verificações | Falhas |
| --- | ---: | ---: |
| Call Center | 256 | 0 |
| Médico | 256 | 0 |
| Técnico | 256 | 0 |
| Administrativo | 256 | 0 |
| Administração | 268 | 0 |
| CEO | 268 | 0 |

São asserções, não funcionalidades distintas. Incluem operações existentes de membros, confirmação, upload/download de três MIME e expiração, além dos novos percursos. Os testes de toque enviam eventos CDP confiáveis recebidos pelo Chromium; isso não equivale a hardware Android. O viewport reduzido testa preservação do editor, não o comportamento de um teclado Gboard/Samsung real.

Foram revistos exemplos das capturas de tablet/escuro e telemóvel/claro. O estado «Nenhuma conversa encontrada» nas capturas corresponde ao filtro Não lidas após abrir as mensagens, não a perda de conversas: limpar o filtro recupera a lista e foi testado. Os balões de histórico da fixture são dados sintéticos preparados para exercitar scroll, não conversas de colaboradores reais.

Artefactos do [run final](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40183714251), conservação informada até 08/11/2026:

| Evidência | Artefacto | SHA256 |
| --- | --- | --- |
| Chat — resultados/capturas | [12594834500](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40183714251/artifacts/12594834500) | `0f003262079a49d203c598b58e9d9bfe132bd16a4a6546eff90881aa450c7028` |
| Escrita nativa/IME | [12594944318](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40183714251/artifacts/12594944318) | `96136c3075964937d71f84aa6ffca489141b3300bff57c3ded02d20c72f33e68` |
| Regressão visual | [12595581257](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40183714251/artifacts/12595581257) | `ef2e66e5f42bc81f731c6f4e34d3e13529682f6205be03dbe1c9b2aaae5bce6e` |

### Integridade da publicação

Deployment `dpl_CSBmikEuHYsBrjqoDy748aSpzLR8`, target staging no projeto sintético existente, com proteção Vercel para todos os deployments. Os 101 assets foram comparados byte a byte com o build testado; só manifesto e cabeçalhos isolados foram adicionados. HTTP autenticado confirmou manifesto/SHA, página, App, domínio/CSS do Chat e logótipo oficial exatos. `/api/chat` e `/api/auth` devolveram 404: o preview não publica backend central. O navegador completo foi executado em loopback no GitHub Actions, não numa sessão SSO remota inventada.

Main permanece `84fba5a2d6d7afcb0723ca312f4e617acc22823d`; PR #13 draft; produção `updatedAt=1791725971672`, igual à referência. Sem force push, migrações, serviços pagos contratados ou alteração de domínios. Backup privado do código de partida preservado/verificado pelo SHA256 `bff08974d552e647a1f309c84558a02b98673d88095bb7b9e44cbd73f16fa168`.

### Estado de entrega

Implementado e testado no âmbito sintético: novo layout, lista/filtros/pesquisa, respostas, paleta/gestos, chips e painel de reações/Feito, composição e navegação móvel. Mantidos grupos de gestão, ACL, histórico e anexos de sete dias. Sem novos módulos ou cadastros paralelos.

Pendentes: validação física deste novo preview; autenticação/sessões reais, persistência/UI/API central, transporte entre dispositivos, arquivo privado/scanner e recuperação. Nenhuma destas capacidades é declarada operacional por os testes SQL terem passado.
