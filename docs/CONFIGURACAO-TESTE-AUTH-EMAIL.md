# Integração de teste: autenticação e email

O utilizador confirmou que ainda não existe serviço: preparar uma integração segura e documentar a configuração pendente. Nenhuma credencial foi solicitada, recebida ou escrita no repositório. Este trabalho não ativa autenticação de produção nem migra dados.

## Estado real

- O programa atual é um protótipo com dados no navegador. `index.html` e o seletor CEO continuam destinados a testes, não constituem autenticação real.
- `account.html` apresenta entrada e definição/recuperação de palavra-passe. Não guarda palavras-passe, sessão ou tokens no localStorage; remove o token da URL antes da utilização.
- `functions/api/preview.js` é uma Pages Function independente dos endpoints Vercel existentes. Responde 503 sem configuração. Não executa seeds, migrações, consultas à base de produção ou chamadas de email nessa situação.
- Nenhum backend de identidade/email foi provisionado. O consumo único e a expiração de tokens, a entrega de email, o vínculo verificado à ficha e a autorização sobre dados persistentes **ainda não foram implementados num serviço real**. O proxy sozinho não os garante.
- A aplicação principal ainda não consome uma sessão real para carregar dados do servidor. Após o login de teste, a página não transforma a sessão em permissões de demonstração nem apresenta a demonstração como área autenticada.

## Configuração necessária — só no ambiente Preview

Criar um backend e base de dados exclusivamente de teste, escolher fornecedor de identidade e email/OAuth e configurar secrets no painel Cloudflare, nunca no código:

| Variável | Utilização |
| --- | --- |
| `GS_ENVIRONMENT` | Deve ser exatamente `preview`; produção é bloqueada. |
| `GS_TEST_BACKEND_URL` | Origem HTTPS do backend isolado, terminada em `/`, sem credenciais, query ou caminho adicional. |
| `GS_TEST_BACKEND_TOKEN` | Secret do canal Cloudflare → backend. Não substitui a autenticação/permissões do colaborador. |
| `GS_PREVIEW_ORIGINS` | Lista explícita de origens HTTPS autorizadas, separadas por vírgula, incluindo o preview a testar. |

O proxy rejeita origens externas, POST sem Origin, formatos diferentes de JSON, ações/métodos não permitidos e corpos acima de 64 KiB. Não segue redirecionamentos; tem timeout; não expõe mensagens internas de indisponibilidade. As respostas não são armazenadas em cache. Só aceita cookies com `HttpOnly`, `Secure`, `SameSite=Lax/Strict` e sem `Domain`. Recomenda-se `__Host-gs_session` com `Path=/` e rotação após login/reset.

## Contrato a implementar no backend

| Ação do proxy | Endpoint no backend | Obrigações |
| --- | --- | --- |
| session | GET `/auth/session` | Resolver cookie autenticado, utilizador ativo, email verificado, função e permissões individuais. |
| signIn | POST `/auth/sign-in` | Validar credenciais através do fornecedor, limitar tentativas e rodar sessão. |
| requestReset | POST `/auth/request-reset` | Resposta genérica sem revelar existência do email; email autorizado na ficha; token aleatório, hash no servidor, expiração curta e utilização única. |
| reset | POST `/auth/reset` | Consumo atómico do token, política de palavra-passe do fornecedor, revogar sessões antigas. |
| changeEmail | POST `/auth/change-email` | Reautenticação, verificação do novo endereço, unicidade e atualização atómica da ficha e identidade; conservar email anterior até verificação. |
| signOut | POST `/auth/sign-out` | Revogar sessão no servidor e limpar cookie seguro. |
| importCV | POST `/integrations/cv/import` | Utilizador/serviço autorizado, OAuth do fornecedor, validação de anexos e transação idempotente. |
| runEmails | POST `/integrations/email/run` | Validar sessão CEO/Administração + settings, destinatários e ação; responder com `status: Pendente/Concluído` e `runId`; não confiar no perfil enviado pelo cliente. |

A tabela de Emails configura destinatários e intenção. OAuth/tokens renováveis ficam no servidor/secret store, com scopes mínimos; nunca utilizar palavras-passe de email no navegador. Os cinco tipos iniciais ficam sem endereço e inativos. A ativação da linha não provisiona o fornecedor.

A importação automática deve usar chave única `(provider, mailbox, messageId, attachmentId)`, registo de execução, retentativas limitadas e dead-letter/revisão manual. O teste manual do mesmo controlo usa `sourceId` e email normalizado. Duas identidades já existentes com o mesmo email exigem revisão, não fusão automática.

Exportação de documentos de inativos: selecionar documentos, fundamento e prazo de retenção; guardar plano auditado, validar política no servidor, produzir links temporários ou arquivo cifrado, enviar apenas ao destinatário autorizado. O protótipo regista o plano mas não elimina documentos nem envia anexos. Backups/notificações também exigem jobs autenticados e registo persistente no backend.

## Validação pendente após provisionamento

Executar login/primeiro acesso/reset com os seis perfis, expiração/reutilização de tokens, revogação de sessão, alteração e verificação de email, tentativas cruzadas entre colaboradores/clínicas, CSRF/rate limits, reprocessamento da mesma mensagem, falha do fornecedor, documentos maliciosos, exportação e retenção. Não utilizar ficheiros ou dados pessoais reais neste preview.
