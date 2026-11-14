# Segurança P0 — publicação do preview desbloqueada

- URL: https://grupo-saude-v4-validacao-sintetica-aaekruecl-grupo-saude.vercel.app
- Código: `40301aeaeb82868a6d4d3b687448ec90709d0154`.
- Deployment: `dpl_Dyqo5FGkcJbYFEoBGEvJ21XWURhU`, READY, staging, projeto sintético existente.
- Projeto: `prj_X02eCkklCYULDAFkyKXbRHWETyT1`, equipa `team_DMxRbNJsBTO11kD0KfyC7sLA`.

## Diagnóstico observado

Antes da operação não existiam deployments BUILDING, QUEUED ou INITIALIZING. O mais recente continuava a ser o Financeiro 49f6f67e; a chamada anterior com o pacote integral (~1,5 MB) não tinha criado deployment. Portanto, não havia logs de build da tentativa interrompida. O bloqueio observado era na submissão pelo conector, antes do build, e não um build falhado. Não existe evidência suficiente para atribuir a causa interna a um limite específico de tamanho ou timeout do fornecedor.

O pedido pequeno com referências SHA respondeu imediatamente `400 missing_files`, request ID `iad1:lhr1:iad1:sfo1::dd7sj-1793089178391-c054d501a7e3`. Isto identificou a etapa necessária nesta via: carregar os objetos antes de criar o deployment. Um upload individual foi aceite. Foram então carregados 108 ficheiros separadamente e criada uma única publicação com referências SHA e tamanhos (~11 KB no pedido). A resposta devolveu o ID do deployment; os logs confirmaram download dos 108 ficheiros, build concluído e outputs publicados. A causa interna do bloqueio original do conector não é exposta pelos logs disponíveis; o envio por objetos independentes resolveu a publicação sem alterar código ou permissões.

## Configuração e segurança

Pacote estático preparado a partir do código testado, sem API/lib/functions, package.json, credenciais, documentos reais ou cron. Framework/build/install nulos e output `.` apenas para esta publicação. Nenhuma configuração global do projeto foi alterada. Proteção Vercel Authentication continua ativa para todos os deployments do projeto sintético. Projeto de produção permanece com updatedAt `1791725971672`; projeto sintético permanece com updatedAt `1792324022829`. Main e bases reais não foram alteradas; PR13 permanece em rascunho.

Não foram ativados backend central, emails, arquivo real ou serviços de produção. Os resultados já aprovados permanecem os de [44/44 jobs](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40430408470); não foram repetidos testes completos.

## Verificações realizadas

Acesso HTTP autorizado com a proteção Vercel mantida:

| Caminho | Resultado |
|---|---|
| `/` | HTTP 200; HTML idêntico ao pacote testado |
| `/api/version` | HTTP 200; SHA 40301aea; backend/email/persistência central desativados |
| `/account.html` | HTTP 200; conteúdo idêntico |
| `/account.js` | HTTP 200; conteúdo idêntico |
| `/security.html` | HTTP 200; conteúdo idêntico |
| `/security-ui-v4.js` | HTTP 200; conteúdo idêntico |
| `/session-v4.js` | HTTP 200; conteúdo idêntico |

Verificação limitada à publicação, respostas HTTP e integridade dos ficheiros; não representa nova validação física Android nem ativação da autenticação central. O utilizador deve abrir o URL com uma conta Vercel autorizada, caso seja pedido login. Não é necessária partilha de tokens ou alteração da proteção.
