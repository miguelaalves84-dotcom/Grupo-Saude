# Grupo 1 — preparação central isolada

Reutiliza sessão, autorização, API e serviços existentes. Não cria outro fornecedor ou modelo de utilizadores/permissões/clínicas.

## Fronteiras concretas

1. account.html/account.js envia login ao encaminhador isolado.
2. api/v4-auth.js delega num fornecedor **sintético** no harness; exige email verificado, utilizador SQL ativo e expiração válida; cookie HttpOnly/Secure/SameSite=Lax. Nenhum token em JSON/localStorage.
3. session-v4.js mantém snapshot imutável em memória e elimina respostas tardias após mudança/terminação. Eventos de confirmação atualizam a área autenticada; uma ação recusada revalida a identidade sem terminar uma sessão válida.
4. authenticated-modules-v4.js apresenta leituras Clínicas/Stock/conformidade documental com textContent e dados do servidor. Sem fallback demo ou botões de escrita nesta área.
5. Fachada modules chama /api/clinic-stock. No harness esse caminho reutiliza api/v4-clinic-stock.js e ClinicStockService com PostgreSQL real **descartável**, transações/locks e autorização independente do corpo.

session tem 120 consultas por janela de 10 minutos/IP; tentativas de credenciais continuam limitadas a 10. Sem expiração, endpoint de sessão e ator API recusam antes de consultar dados operacionais.

## Execução e evidência

central-integration constrói tests/ci/Dockerfile.central e executa central-browser.py com --network none, fonte read-only e PostgreSQL por socket Unix em /tmp. central-server.cjs exige GS_TEST_DISPOSABLE_POSTGRES=true, não aceita DSN fornecido e recusa VERCEL_ENV=production. HTTPS loopback com certificado sintético efémero (exceção de confiança apenas neste navegador de teste, sem rede externa). Fornecedor/storage efémeros, schemas e migrações aditivas existentes.

Seis perfis, três tamanhos/dois temas; formulário/cookies/identidade SQL; leituras UI/API; default/custom permissions SQL; isolamento/spoofing; consume/concorrência/idempotência API; documentos; view-as; expiração ausente; inativação/revogação; resposta SQL tardia após troca de cookie. matrix-central.json, capturas, traces e log sem credenciais reais. Só resultados efetivos no Actions aprovam casos novos.

Controlos /__synthetic__/fixture existem **apenas no servidor de testes**, nunca numa Function/route do produto, build ou pacote publicado. Não é um backend de preview remoto.

## Limites e próximos passos

- Preview publicado continua estático; /api/auth e /api/clinic-stock indisponíveis. Área autenticada falha fechada sem backend.
- Nenhum tenant real, Neon/Blob, cookie de produção, OAuth ou variável remota utilizado/configurado.
- Recuperação/reset real, fornecedor operacional, storage remoto e writers centrais RH/Operação/Chat continuam pendentes.
- Encaminhamento remoto /api/clinic-stock exige backend/proxy isolados e autorização específica. O harness prova a interface e handlers, não um deployment remoto autenticado.
- Próximo bloco: apresentar tenant/Neon/storage de teste, custos/origens/configuração; segredos apenas no gestor do ambiente; dados exclusivamente sintéticos. Validar fornecedor real e duas sessões, migrações aditivas e leituras; writers só após validação/autorização. Produção permanece bloqueada.
