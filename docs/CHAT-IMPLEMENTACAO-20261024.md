# Chat V4 — implementação e limites, 24/10/2026

Branch `dev/v4-stabilization-20261017`, PR #13 draft. Base preservada `90983ba`; nenhum merge, produção, recurso pago, migração ou dado real. Especificações: [6389345466](https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6389345466) e [6389411318](https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6389411318), consolidadas com a instrução atual do utilizador.

## Auditoria e consolidação

| Origem | Diagnóstico anterior | Alteração / preservação |
| --- | --- | --- |
| `app.js`, `state.conversations` | Canal efetivamente utilizado; CEO lia sem pertencer; qualquer perfil criava grupos; destinatários sem âmbito clínico | Mesma lista, mesmo controlador App e mesmos IDs/dados; regras partilhadas em `chat-core-v4.js`. CEO/Administração comunicam com todos, mas leem mensagens apenas quando membros. Gestão global de metadados dos grupos separada da leitura |
| `gs-enterprise.js`, `V4Chat` / `chatMessages` | Escritor antigo para `equipa`, sem clínica/membros; nenhuma chamada encontrada fora da própria declaração | API antiga conservada, escritor e leitura global desativados; contador próprio passa pelo domínio canónico e apenas para utilizador atual. Dados antigos não apagados nem importados indiscriminadamente: destinatário `equipa` exige reconciliação |
| `attention-core-v4.js` | Regras de notificação só testavam IDs dos membros; não revalidavam conversas individuais após perda de clínica | Reutiliza a mesma política do Chat antes de criar a notificação; sem novo contador paralelo |
| Editor de mensagens | Correções IME e preservação de foco existentes em f87e344 | `GSSafeActionsV4` preservado, Enter em composição não envia; rascunhos por utilizador/conversa e limpeza em mudança de identidade/permissões |
| Documentos | Validador PDF/JPEG/PNG existente; arquivo privado central pendente | Reutilizado `GSFinanceCore.file`; anexos do Chat em IndexedDB exclusivo de demonstração, sem misturar documentos de RH/Financeiro |
| Backend | Sem Chat central operacional; utilizadores, clínicas, `app_settings` e auditoria já existem | Serviço isolado reutiliza essas estruturas. Sem tabela de colaboradores, conversas ou notificações duplicada. API desligada sem configuração/autenticação de testes |

Conversas antigas e mensagens/históricos permanecem no estado. Uma conversa individual antiga passa a ser revalidada contra as clínicas atuais. Grupos antigos sem tipo explícito só aparecem aos membros cujo âmbito permita os restantes participantes; grupos incompatíveis permanecem preservados para revisão CEO/Administração, que pode confirmar a composição no editor de grupos. Não se alarga automaticamente uma audiência histórica.

## Matriz de permissões

| Ação | CEO / Administração | Administrativo / Médico / Técnico | Call Center |
| --- | --- | --- | --- |
| Nova conversa individual | Qualquer colaborador ativo com Chat permitido | Colegas com pelo menos uma clínica comum; CEO/Administração; Call Center quando exista âmbito comum | Clínicas explicitamente atribuídas; CEO/Administração. Sem presunção de acesso global |
| Multiclínica | Âmbito global de comunicação | União das clínicas atribuídas | União das clínicas explicitamente autorizadas; lista vazia não concede acesso |
| Criar/gerir grupos | Sim, incluindo várias clínicas | Não | Não |
| Ler/enviar/reagir/descarregar | Apenas como membro autorizado; gerir grupo não equivale a ler | Como membro autorizado | Como membro autorizado |
| Alterar membros/nome do grupo | Sim, com revisão/concorrência e histórico | Não | Não |
| ✓ Feito | Apenas o próprio visto | Apenas o próprio visto | Apenas o próprio visto |
| Permissão pessoal revogada / inativo | Bloqueado | Bloqueado | Bloqueado |
| Simulação no servidor | Perfil efetivo, sem privilégios herdados; escrita recusada em `readOnly` | — | — |

A interpretação do Call Center é deliberadamente restritiva e simétrica: outro colaborador não consegue criar uma conversa que o Call Center não estaria autorizado a ler. Quando fornecido pelo contexto, um âmbito mais restrito do Call Center é respeitado; não existe novo configurador remoto ligado. Na sua ausência usam-se as associações explícitas existentes. Arrays explícitos de clínicas, incluindo um array vazio, prevalecem sobre campos escalares antigos: estes não recuperam uma associação removida. O preview continua a ser simulação local, não autenticação real.

Conversas associadas a pedidos mantêm o acesso de origem; participantes sem clínica adequada são recusados. O atalho antigo deixa de criar automaticamente um grupo com todos os utilizadores e passa pelo formulário canónico. A futura associação ao pedido no backend necessita do adapter autenticado de origem; é recusada se a origem não estiver carregada/autorizada.

## ✓ Feito e histórico

Cada confirmação guarda ID, nome histórico, data/hora e colocação/remoção. Vários membros podem confirmar independentemente. A primeira confirmação histórica fica destacada mesmo depois de retirada, devidamente identificada. Recolocar cria novo evento e preserva os anteriores. Visto de leitura é independente de visto de execução; não fecha pedidos, tarefas ou reclamações.

Comandos têm identificador idempotente e ator obtido do contexto, nunca dos campos `from`, `actor`, nome ou data enviados pelo cliente. Alterar grupo exige revisão atual. Remover um membro revoga imediatamente o acesso ao grupo/anexos nas ações do domínio/API; não apaga as mensagens ou confirmações antigas.

## Anexos — prazo exato e segurança

- PDF, JPEG e PNG, até 3 MB por ficheiro, cinco anexos por mensagem; formato e assinatura verificados pelo validador existente. HTML/SVG/executáveis não são aceites. Isto não substitui um scanner de malware.
- Upload local exige confirmação explícita de ficheiros sintéticos. Bytes ficam no IndexedDB; o estado da mensagem só contém metadados, remetente e datas, sem URL pública ou base64.
- O instante de upload concluído de cada ficheiro determina o limite: `uploadedAt + 604800000 ms`, independentemente de fins de semana, mudança de hora e momento de envio dos restantes anexos.
- Download permitido apenas quando `agora < limite`. No limite exato e depois, é recusado. O domínio recalcula o limite a partir do upload; um campo `expiresAt` adulterado não o prolonga.
- Cada download volta a verificar membro/permissão/expiração antes e depois da leitura assíncrona. URLs Blob existem apenas temporariamente para o download e são revogados, nunca publicados no histórico.
- Após expiração, mensagem/metadados/histórico permanecem e a interface mostra «Anexo expirado». Não há eliminação física automática, nem promessa de revogar uma cópia já descarregada.
- A data do navegador/IndexedDB não constitui segurança central contra o dono do dispositivo ou DevTools. A futura aplicação autenticada precisa de relógio do servidor e arquivo privado/scanner; nenhuma capacidade central é simulada como operacional.

A API preparada não aceita anexos arbitrários na criação de mensagens. A rota de ficheiros aplica ACL e prazo e recusa os restantes casos com infraestrutura pendente. Não existe endpoint público de upload, URL permanente ou armazenamento remoto configurado nesta entrega.

## Persistência, concorrência e P0

A UI do preview usa apenas `state.conversations` neste navegador. Alterações locais não comprovam duas sessões/dispositivos autenticados. O serviço de testes usa a mesma política, snapshots em `app_settings`, transação serializável, comparação de versão/CAS e auditoria. Conflitos são recusados para atualização/repetição, nunca resolvidos descartando silenciosamente mensagens.

Antes de funcionar realmente: autenticação/sessões revogáveis, UI ligada à API, persistência central autorizada, arquivo privado e scanner, restauro, retenção e testes de carga/paginação. A estrutura de snapshot é uma preparação isolada, não certificação de escala/latência em produção. Nenhum dos quatro P0 da auditoria geral fica encerrado.

## Testes e entrega

Código final testado e publicado: **`bd71096987ca1356800ded289ad495f6c61fcaab`**. [Preview protegido READY](https://grupo-saude-v4-validacao-sintetica-571xsn1ba-grupo-saude.vercel.app), deployment `dpl_EnDD2LZ5Z4dFAjiH4wcSdweA8v6L`. [GitHub Actions 40135703178](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40135703178): **38/38 jobs aprovados**, incluindo 36 suites Chromium, regressão Node/build e PostgreSQL descartável. Local: `npm test`, sintaxe Python/JavaScript, build (101 assets, sem backend/documentos/segredos) e `git diff --check` aprovados. Treze grupos de testes de domínio e API sintética foram executados; a API em produção/sem configuração permanece recusada.

Novos testes:

- `tests/chat.cjs`: seis perfis, Call Center restrito/multiclínica, compatibilidade de fichas parciais, grupos, negação/simulação, reações/histórico, idempotência, prazo exato e ficheiros inválidos.
- `tests/chat-browser.py`: operações reais na interface, seis perfis × computador/tablet/telemóvel × claro/escuro; conversa, grupo, escrita/IME, notificações, dois vistos, remoção e histórico, uploads e downloads de PDF/JPEG/PNG, limite de sete dias, revogação e responsividade.
- `tests/chat-postgres.cjs`: base descartável, API/domínio, gravação consultada por outro ator, confirmações concorrentes com CAS e repetição, revogação, auditoria e recusa de ficheiros expirados/não membros. Não é preview central autenticado.
- `tests/p0-isolation-boundaries.cjs`: rota Chat incluída nos bloqueios sem recursos/produção. Suites anteriores de escrita, perfis, pesquisas e restantes módulos mantidas.

Validação num tablet físico do novo Chat ainda pendente; a aprovação física dos cinco testes de escrita em f87e344 permanece registada no respetivo âmbito, sem ser convertida em aprovação de todo este módulo.


## Ciclos de verificação

- `1fc25da`: implementação inicial. O run 40134293364 passou os testes existentes/PostgreSQL mas a nova suite parou na preparação da fixture (`const` reatribuído); não foi classificado como aprovação do Chat.
- `c62f7b9`: preparação corrigida e submissão repetida bloqueada; [run 40135012306](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40135012306) **38/38 jobs aprovados**, incluindo 36 suites Chromium e PostgreSQL isolado. Grupos criados pelo formulário real, três formatos de ficheiros descarregados byte a byte e casos negativos.
- `bd71096`: revisão final de clínica explícita versus campos escalares antigos, primeiro visto com ID próprio e limite por ficheiro desde o upload (sem prolongar pelo envio posterior da mensagem). [Run final 40135703178](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40135703178): **38/38 aprovados**. SHA publicado apenas após esse resultado.

O escritor legado `V4Chat.send` para `equipa` fica bloqueado sem tocar nos respetivos registos. Não foi feita importação cega de `chatMessages` históricos nem ativada uma segunda fonte de conversas. A revisão encontrou referências internas apenas; APIs antigas continuam presentes com resposta de bloqueio legível.


## Evidência final e âmbito de aprovação

A suite do novo Chat fez **924 verificações, zero falhas**, em **36 contextos**. [Matriz CSV](MATRIZ-CHAT-20261024.csv) · [Resumo JSON](CHAT-EVIDENCIAS-20261024.json).

| Perfil | Asserções da suite | Falhas |
| --- | ---: | ---: |
| Call Center | 150 | 0 |
| Médico | 150 | 0 |
| Técnico | 150 | 0 |
| Administrativo | 150 | 0 |
| Administração | 162 | 0 |
| CEO | 162 | 0 |

Não são 924 funcionalidades distintas. Todos foram testados em computador, tablet e telemóvel, claro/escuro. Os testes do navegador usam perfis simulados no mesmo armazenamento local; os testes API recebem contexto de identidade do harness, não exercitam fornecedor de autenticação real. PostgreSQL demonstrou persistência e concorrência entre atores de teste em base descartável; não demonstrou login/persistência do preview entre dispositivos.

Capturas tablet/escuro e telemóvel/claro foram inspecionadas. Capturas full-page podem incluir o cabeçalho sticky na posição corrente de scroll; não se declara equivalência pixel a pixel de todos os estados dinâmicos. A suite geral de regressão visual passou. Novo Chat em tablet Android físico ainda requer confirmação; os testes anteriores de escrita física em f87e344 não certificam este incremento inteiro.

### Artefactos com prazo de conservação

| Evidência | Artefacto GitHub | Digest SHA256 |
| --- | --- | --- |
| Novo Chat — JSON e 36 capturas | [12576064546](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40135703178/artifacts/12576064546) | `f830e24d9e48a98d10abcffe31fbebeb2bdd0d66bdf1d1af3f577a48ea6f39f9` |
| Regressão de escrita | [12576975402](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40135703178/artifacts/12576975402) | `1c1f011eef908c56075d4aea365f61bc0e2dbf7b06dd21ef487e7ebf4603b4d3` |
| Regressão visual | [12576729409](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40135703178/artifacts/12576729409) | `15ff990937c4d16bf6c90e5574917cb3033d43430c8991ee16dcb8e0ecb96757` |

Segundo o GitHub, estes artefactos expiram em 07/11/2026; métricas/classificações essenciais ficam versionadas na matriz e resumo. O código de partida teve backup privado verificado (`59bd447d3978f11d17d4aaca94709b87a6ef903176bf2119ea772b5a1d59777c`), sem envio do arquivo ao GitHub ou preview.

### Publicação efetiva

Os 101 assets foram comparados byte a byte com `dist`; só configuração e manifesto isolados foram acrescentados. O deployment é staging no projeto sintético existente, com proteção Vercel mantida para todos os deployments. HTTP autenticado confirmou SHA do manifesto e igualdade da página, domínio Chat, adaptador de ficheiros, CSS, App e logótipo oficial. `/api/chat`, `/api/auth` e `/api/stock` respondem 404: não existe backend publicado neste pacote estático. Chromium completo foi executado no GitHub Actions em loopback; não se inventa uma sessão SSO de navegador remoto.

Main preservada em `84fba5a2d6d7afcb0723ca312f4e617acc22823d`, PR #13 `draft=true`, produção com `updatedAt=1791725971672`, igual à referência. Nenhum force push, merge, migração real, serviço pago ou configuração de produção.

## Estado final por capacidade

| Capacidade | Estado real |
| --- | --- |
| Individuais por clínica, multiclínica e Call Center restrito | Implementado/testado no protótipo e domínio/API isolados |
| Grupos CEO/Administração, membros e revogação | Implementado/testado; metadados de gestão não dão acesso automático às mensagens |
| ✓ Feito, vários autores, primeira confirmação e histórico | Implementado/testado; sem conclusão automática de tarefas |
| Anexos PDF/JPEG/PNG, prazo exato e download | Implementado/testado localmente, com ficheiros sintéticos; não é arquivo privado remoto |
| Notificações, contadores, pesquisa de conversas e escrita | Integrados no sistema existente; regressões aprovadas |
| API/SQL de testes | Preparados e exercitados de forma isolada; UI do preview não está ligada à API |
| Autenticação/sessões/realtime entre dispositivos | Pendente dos P0; não operacional |
| Arquivo privado/scanner/retenção/backup/restauro | Pendente dos P0; sem eliminação física automática |
| Dados `chatMessages` e grupos legados ambíguos | Preservados; reconciliação humana necessária antes de importação/alargamento de audiência |
| Validação física do novo Chat | Pendente no novo preview |

### Percurso de validação no tablet

1. Abrir Chat e criar uma conversa individual; a lista mostra apenas destinatários autorizados.
2. Como CEO/Administração, escolher Tipo → Grupo, adicionar participantes e guardar; usar Gerir grupos/participantes para alterar o nome e membros.
3. Enviar mensagem sintética, alternar perfis no simulador do mesmo navegador e colocar ✓ Feito; abrir Histórico e retirar/recolocar o próprio visto.
4. Expandir Anexar documento sintético, confirmar a natureza dos ficheiros e carregar PDF/JPEG/PNG. Comparar o download com o original. O prazo automático foi testado nos limites exatos sem introduzir um controlo de relógio no produto.

O link de preview é de origem diferente de previews anteriores: o armazenamento local antigo não é sincronizado automaticamente. Isso não significa eliminação dos dados da origem anterior. Não carregar documentos reais, dados de utentes ou credenciais. Nenhum teste desta demonstração deve ser interpretado como entrega de uma mensagem a um dispositivo independente.
