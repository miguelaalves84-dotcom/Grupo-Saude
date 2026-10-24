# Auditoria de escrita livre — Grupo Saúde V4

Branch: `dev/v4-stabilization-20261017`, PR #13 em rascunho. Base preservada: `4df67f2`; aplicação anterior: `ff0b6a2`. Sem alterações a main, produção, bases reais, credenciais ou fornecedores.

**A aprovação em Android físico continua pendente.** Composição nativa em Chromium não equivale a Gboard/Samsung Keyboard, nem comprova o funcionamento da barra de sugestões ou das pegas de seleção do Android. Não se declara que todos os campos estão certificados apenas por os testes automáticos passarem.

## Problemas encontrados e correções

| Problema | Origem | Correção |
| --- | --- | --- |
| Pesquisa recriava o editor a cada input | `agenda-ui-v4.js`, `complaints-ui-v4.js`, `attendance-dashboard-v4.js` | Preservar o formulário e os seus antepassados ligados ao DOM, atualizando apenas regiões exteriores. Removidas reposições artificiais de foco/cursor após substituir o editor |
| Reconstruir um editor interrompe a composição | Mesmo fluxo de renderização | Componente partilhado em `safe-actions-v4.js` adia a filtragem até ao fim da composição e mantém uma única ligação de eventos por controlo |
| Enter não distinguia composição de envio | `app.js`, Chat | Respeitar `isComposing`, estado de composição e código 229. Enter de confirmação da palavra não envia a mensagem |
| Atualizar Chat descartava o rascunho e fazia renderizações repetidas | `app.js`, `renderChat`/`sendMessage` | Preservar o compositor na mesma conversa; limpar apenas depois de persistir o envio; uma renderização global em vez de renderizar novamente o Chat |
| Gravação automática podia ocorrer com uma palavra ainda em composição | `recruitment-ui-v4.js`, questionários e transcrição manual | Adiar callbacks de escrita e o flush durante composição. Manter o texto no editor; gravar a versão final após commit |
| Novo pedido podia falhar antes de apresentar os campos | `app.js`, clínica principal antiga/inativa | Escolher a referência inicial dentro das clínicas autorizadas, tratar referência ausente e especialidades vazias sem lançar exceção. Voltar a validar clínica/permissão antes de criar o pedido |

Foi demonstrado o risco de substituição do elemento de edição e foram testados os comportamentos corrigidos. Não se atribui a reprodução de todos os sintomas de um teclado físico apenas ao facto de existir esse risco no código.

## Componente partilhado e segurança

Reutilizado `GSSafeActionsV4`, sem novo módulo visual ou segunda biblioteca de formulários:

- `bindInput`: uma ligação por elemento, callback atualizável, composição adiada e eventos próximos coalescidos. Não escreve no valor do campo, não reaplica teclas e não desativa a autocorreção do dispositivo.
- `renderAround`: mantém o editor/formulário e os seus antepassados ligados ao DOM; atualiza os irmãos ao longo desse percurso. Não depende de capturar e repor a seleção depois de destruir o controlo.
- Identidade/permissões e opções autorizadas têm prioridade: mudanças de utilizador, permissões, campos tornados readonly ou listas de clínicas diferentes impedem conservar um editor privilegiado antigo.
- `composing`: protege os handlers de Enter e a gravação automática.

Os HTML autónomos de Reclamações, Recrutamento e Financeiro carregam o mesmo componente. Os formulários normais que não se reconstruíam durante a escrita continuam a usar edição nativa. Não foram acrescentadas máscaras globais, normalizações por tecla, interceptores de `value` ou bloqueios gerais da autocorreção.

## Inventário e significado das matrizes

A pesquisa estática abrange os ficheiros HTML/JavaScript da aplicação, incluindo componentes e geradores. Encontrou **422 entradas em 33 ficheiros**: 195 definições literais de texto/números, oito templates de tipo dinâmico e 219 chamadas a geradores. Não são 422 campos concretos distintos, nem 422 campos aprovados: um gerador pode criar datas, seletores ou várias instâncias, e existem definições de compatibilidade/legado.

A matriz de fontes conserva definições não conciliadas. A matriz de execução identifica o campo/gerador, contexto, tipo, permissões, formato, tema, resultado e confirmação física pendente. Não se marca um campo como testado só porque foi encontrado no código.

Campos de ficheiros, datas, checkboxes e seletores não foram tratados como texto arbitrário. Continuam cobertos pelos testes funcionais existentes. Campos numéricos têm teste específico de edição decimal/apagar; não se inventa uma seleção de texto por API onde o controlo nativo não a disponibiliza.

## Cobertura automática

Os testes usam apenas dados sintéticos e o build em loopback; pedidos externos são bloqueados. São testados os seis perfis, três formatos e dois temas nos fluxos partilhados; o censo alargado de formulários é feito com CEO autorizado em viewport tablet. Isso não equivale a repetir cada campo de cada formulário nas 36 combinações.

Testes exercitados:

- Escrita sequencial com acentos portugueses e comparação exata.
- Inserção no meio, seleção e Backspace, com verificação da posição do cursor quando o tipo nativo o permite.
- Cópia/colagem pelo clipboard do browser; textarea com várias linhas e pontuação.
- Composição nativa através de `Input.imeSetComposition`/`Input.insertText`, preservando a identidade e ligação do controlo.
- Enter de composição sem envio, envio explícito uma única vez e rascunho do Chat preservado durante atualização.
- Gravação de textos acentuados da Agenda, perfil RH e mensagens no adaptador local; notas de entrevista sem persistir fragmentos IME.
- Limites nativos como `maxlength`, campos readonly/disabled e simulação de perfil do CEO sem reter o editor privilegiado.
- Edição normal dos formulários de pedidos, candidaturas, RH, clínicas, contratos, documentos, marketing, financeiro, caixas, stock, fornecedores, formação, equipamentos e despesas.

A execução em `3b65202` teve 36/37 jobs aprovados; o inventário encontrou o erro de clínica antiga ao abrir Novo pedido. O ciclo `f5030e4` passou **37/37 jobs**, incluindo 35 suites Chromium, regressão Node e PostgreSQL descartável. O primeiro censo alargado testou 130 instâncias de campos em 26 aberturas; o Catálogo exigia primeiro abrir o editor antes de chamar a edição, precondição corrigida no teste seguinte.

## Resultado final automático e preview

Commit testado e publicado: `f87e3445382b4f4caa55308b60f7bdd68305732d`.

[GitHub Actions — 37/37 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40113904877): 35 suites Chromium, regressão Node e PostgreSQL descartável. Build estático local aprovado: 98 assets, sem backend/documentos/segredos.

| Campanha de escrita | Verificações | Falhas | Contextos de campos |
| --- | ---: | ---: | ---: |
| Fluxos partilhados, seis perfis, três formatos e dois temas | 2736 | 0 | 294 |
| Censo de formulários, CEO/tablet/claro e login sintético | 820 | 0 | 151 |
| Notas e transcrição manual de entrevistas | 216 | 0 | 24 |
| Total | 3772 | 0 | 469 |

Os 469 são instâncias/contextos repetidos, não campos únicos: 430 passaram nos cenários automáticos, 37 têm edição numérica parcialmente testada e 2 mantiveram proteção contra edição. O censo alargado não submeteu todos os formulários; os fluxos de gravação explicitamente testados e as regressões existentes têm âmbito próprio. Não é certificação de todas as 422 definições/chamadas inventariadas.

[Matriz de campos exercitados](MATRIZ-ESCRITA-LIVRE-CAMPOS-20261024.csv) · [Inventário de fontes e limites de conciliação](MATRIZ-ESCRITA-LIVRE-FONTES-20261024.csv). Os artefactos do run incluem JSON e capturas sintéticas; as métricas/limites foram preservados nestas matrizes versionadas.

[Preview READY protegido](https://grupo-saude-v4-validacao-sintetica-91s97febp-grupo-saude.vercel.app), deployment `dpl_889oob6tdvFnkNofbZUAwEvGPWWj`, apenas staging. Os 98 assets foram comparados byte a byte com dist antes do envio. Proteção Vercel mantida para todos os deployments. HTTP autenticado confirma página, manifesto e componente partilhado; navegador completo foi executado no GitHub Actions contra o pacote sintético local, não contra uma sessão SSO no deployment.

Os testes PostgreSQL descartáveis não comprovam persistência central autenticada em funcionamento. Preview com persistência apenas no navegador, sem escritores centrais nem serviços reais. Main preservada em `84fba5a2d6d7afcb0723ca312f4e617acc22823d`; PR #13 continua em rascunho; configuração de produção não alterada. Confirmação num tablet Android físico continua pendente.

## Normalizações legítimas e limites

O valor escrito não é normalizado pelo novo componente. Continuam a existir regras anteriores no momento de validar/gravar, por exemplo trim de referências/contactos e a forma canónica de identificadores financeiros. Não foram alteradas regras de negócio para contornar testes. Acentos usados na pesquisa são normalizados numa cópia para comparação, não no texto do editor.

Um `maxlength`, a política de cópia de um campo de palavra-passe ou a validação nativa de um input numérico não são classificados como duplicação de caracteres. A autocorreção do teclado pode substituir uma palavra quando ativada ou quando o utilizador escolhe uma sugestão; a aplicação deve respeitar essa substituição, sem a duplicar ou reverter. Não foi desativada globalmente a autocorreção para esconder o problema.

Autenticação real, partilha entre dispositivos, persistência central e serviços externos continuam desativados no preview. Campos que dependam dessas ligações ou de registos/configurações não preparados não recebem aprovação funcional apenas por o respetivo template existir.

## Confirmação obrigatória num Android físico

Usar apenas nomes, emails e mensagens sintéticos. Registar modelo do tablet, versão Android, versão Chrome, teclado e idioma/layout. Repetir pelo menos com Gboard e, se utilizado, Samsung Keyboard.

| Operação no dispositivo | Resultado esperado | Estado |
| --- | --- | --- |
| Agenda: escrever `João`, `ação`, `São João`, escolher uma sugestão | Uma única palavra final, sem letras repetidas/perdidas; resultados e campo coerentes | Pendente físico |
| Pesquisa de Reclamações e Livro de Ponto: escrever depressa e alterar no meio | Editor mantém foco; cursor fica no ponto de edição | Pendente físico |
| Nome/morada/email na ficha RH | Acentos e correções mantidos; email não recebe espaços/capitalizações impostas pela aplicação | Pendente físico |
| Observações/notas: duas linhas, acentos por toque prolongado, apagar continuamente | Linhas e caracteres preservados, sem salto do cursor | Pendente físico |
| Chat: confirmar palavra pelo teclado, depois tocar Enviar | Confirmação IME não envia; Enviar guarda uma mensagem | Pendente físico |
| Entrevista: pausar durante uma composição e escolher uma sugestão | Não gravar um fragmento como versão final; nota final mantém o texto | Pendente físico |
| Copiar/colar com toque prolongado e pegas de seleção | Colagem única, seleção/cursor coerentes; palavra-passe respeita proteção nativa | Pendente físico |
| Montantes financeiros com teclado português (`12,34`) | Entrada/validação decimal coerentes; sem conversões silenciosas erradas ou dígitos duplicados | Pendente físico |
| Ocultar/mostrar teclado, rodar o tablet e continuar | Texto permanece; sem reinício indevido do editor | Pendente físico |
| Guardar, fechar e reabrir o registo | Texto final corresponde ao pretendido, respeitando validações explícitas | Pendente físico |

Não se deve declarar a tarefa integralmente validada no Android antes desta confirmação. Até lá, o estado é: correções de software testadas no âmbito automático documentado, confirmação física pendente.
