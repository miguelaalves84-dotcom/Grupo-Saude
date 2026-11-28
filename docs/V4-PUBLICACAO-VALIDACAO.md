# V4 — consolidação da publicação e validação

## Referência verificada

PR #11 em rascunho, branch efetiva `feat/v4-consolidation-dashboard-access`, head remoto inicial `07dc4120758bd9b795642cf88d8e18ef93d64676`. O nome abreviado `feat/v4-consolidation-dashboard` não é a branch deste PR.

O check Cloudflare desse commit confirma o preview imutável https://e7e3c34d.grupo-saude.pages.dev e o alias https://feat-v4-consolidation-dashbo.grupo-saude.pages.dev. O endereço principal `grupo-saude.pages.dev` é distinto do preview. O GitHub tem `main` como default, mas isso não confirma a branch de produção configurada no Cloudflare. A sessão não dispõe de acesso administrativo Cloudflare nem credenciais; foi solicitada a confirmação dos campos do painel, sem segredos.

PRs encadeados, todos abertos e não integrados: #5 → main; #7 → branch #5; #9 → branch #7; #11 → branch #9. GitHub indica mergeable=true em todos; #11 unstable devido à verificação Vercel. O head inicial #11 tem 18 commits à frente de main e zero atrás. Integrar apenas #11 na sua base atual não publica main. Nenhum PR foi integrado/retargetado.

Assim, há alterações recentes publicadas como preview que não foram integradas na branch default. Essa separação explica uma versão anterior no endereço principal **caso** a produção esteja ligada a main. A branch efetiva, redirects, DNS e TLS não foram confirmados no painel; não se declara essa hipótese como configuração comprovada.

## Erro Vercel comprovado

Deployment `dpl_FcZRXPE126cXqXr2MvBBBtp25RjG`, commit 07dc412, projeto grupo-saude-v3, logs autenticados: build executava `node tests/build.cjs`; este copiava 52 assets para uma pasta temporária e removia-a. Em seguida: `No Output Directory named "public" found after the Build completed`.

Correção: `scripts/build-static.cjs` valida dependências locais e conserva recursos em `dist/`; `vercel.json` declara outputDirectory=dist. Backend, SQL, testes, configuração, credenciais e documentos não são copiados. O comando antigo de testes reutiliza este único builder. Não foi desativada a Vercel; não foram alteradas definições da conta.

Cloudflare pode continuar a publicar a raiz com o `.cfignore` existente. `dist/` e `scripts/` ficam excluídos desse modo para evitar cópias públicas repetidas. Para migrar o painel a output=dist, configurar Build command=`npm run build`, output=`dist`; conservar `functions/` e todas as configurações/bindings existentes. Não adicionar uma segunda aplicação nem sobrepor variáveis do painel com defaults no código. Essa alteração de painel não foi realizada sem acesso à conta.

## Correções de carregamento/publicação

- `_headers` e headers Vercel exigem revalidação dos recursos estáticos. Não limpar localStorage/IndexedDB nem dados do utilizador.
- `/api/version` devolve exclusivamente branch/commit Cloudflare quando disponíveis; nenhuma configuração/credencial. Métodos GET/HEAD, no-store. Ausência de variáveis é apresentada como desconhecida.
- Badge discreto nos três entrypoints identifica a versão recebida; falha do endpoint não impede nenhum módulo.
- CI verifica os bytes de app.js, finance-ui-v4.js e deployment-version-v4.js no preview do commit exato, lê a identidade e inspeciona app.js da produção apenas em leitura. Não tenta atualizar produção nem DNS.

## Correções de segurança encontradas

O endpoint legado `/api/v4?health=1` inicializava tabelas/configurações e inseria clínicas através de GET, inclusive sem sessão. Agora exige CEO/Administração e só consulta a hora do servidor. As definições antigas de schema permanecem no ficheiro; não há execução, restauro, seed ou remoção de registos nessa consulta.

`resource=clinics` exige sessão; CEO consulta todas, os restantes apenas relações user_clinics do seu ID SQL, ignorando IDs enviados pelo cliente. Erros SQL não devolvem mensagens internas. Não há mudança em permissões guardadas.

## Duplicações e arquitetura

HTML/classic JS, aplicação principal de demonstração local, domínios partilhados de acesso/RH/financeiro, serviços Node autenticados SQL/storage privados e proxies Pages de preview. Não é uma SPA reconstruída. Análise mecânica: 47 scripts incluídos em index.html sem repetições; nenhum root JS integralmente duplicado. Há camadas legadas de wrappers/renderização, portanto não se afirma ausência de toda a duplicação semântica. RH mantém a seleção de renderer consolidado existente; não foi introduzido renderer adicional. Regressão cobre acesso direto e alternância CEO.

## Testes

282 testes locais (266 anteriores + 16 de publicação/API), incluindo seis perfis, saúde read-only, ausência de seed por GET, consultas de clínicas por identidade, isolamento de assets e identidade Cloudflare sem segredos. Build: 53 assets. Sintaxe de 95 ficheiros JS (saída dist ignorada para evitar contagem duplicada), compilação Python e git diff --check. Os fornecedores reais não são configurados nem exercitados por fixtures.

Quatro suites Chromium são executadas pela CI em localhost e no preview Cloudflare exato: módulos/acessos/alternância, financeiro, melhorias e documentos. A CI também verifica assets servidos e compara produção sem escrever. Resultados/URLs do novo commit são publicados no PR após conclusão; não considerar esta previsão resultado aprovado.

## Preservação e limites de produção

Sem migração, exclusão de ficheiros/documentos/dados, reset de histórico, alteração de main, merge, DNS ou deployment de produção. A remoção de dist afeta exclusivamente saída gerada.

A demonstração principal ainda é pública e usa armazenamento local; não se considera autenticação real de todos os módulos. Backend financeiro/auth/Gmail permanece preview-only e bloqueado sem fornecedores/segurança aprovados. Neon Auth/SQL/PITR, dois stores privados, antivírus, OAuth Google/Microsoft, cron e recuperação real precisam de configuração e ensaio externo. Publicar o protótipo no domínio definitivo não resolve estes requisitos.

Não se recomenda merge/produção antes de confirmar painel Cloudflare, acesso autenticado integral, separação dados reais/teste, recuperação e serviços externos. DNS/associação gruposaude.online/www, redirects e certificados dependem dessa etapa e de autorização explícita. O preview é apropriado para regressão controlada; não inserir documentos confidenciais enquanto a segurança real não for validada.

## Ficheiros alterados

`.cfignore`, `.gitignore`, `.github/workflows/v4-preview-regression.yml`, `_headers`, `vercel.json`, `package.json`, `scripts/build-static.cjs`, `tests/build.cjs`, `tests/syntax.cjs`, `tests/release-readiness.cjs`, `tests/cloudflare-publication.py`, `functions/api/version.js`, `deployment-version-v4.js`, `index.html`, `account.html`, `finance.html`, `api/v4.js` e este relatório.
