# Bloco 02 — Chromium isolado no GitHub Actions

Base: e92ab989356b751784fc2ee6d1e82111dcc429b5.
Branch: fix/v4-p0-security-hardening-session, já protegida contra deployment Vercel e writers P0.

O workflow existente foi reutilizado; não se criou uma pipeline duplicada. Executa em push nesta branch e PRs destinados a esta branch. As etapas que descobriam previews externos e consultavam produção foram removidas desta pipeline. Nenhuma configuração remota, main ou ficheiro funcional da aplicação foi alterado. O commit utiliza apenas [CF-Pages-Skip], sem [skip ci], para permitir GitHub Actions e evitar publicação Cloudflare.

## Isolamento

- Checkout fixado por SHA, com persist-credentials false; token limitado a contents:read, nunca passado aos testes.
- Preparação de imagens separada da execução. A imagem Python/Chromium e a biblioteca Playwright usam a versão 1.56.0.
- Testes Node e Chromium em containers --network none, sem capacidades, sem privilégios adicionais, filesystem raiz read-only. Código montado read-only; cópia Node e SQLite sintético apenas em tmpfs descartável. Nenhum segredo de aplicação, .env, DSN real, provider real ou base remota é fornecido.
- Servidor estático exclusivamente em loopback dentro do container. Não executa APIs nem writers da aplicação. Interceção adicional de URLs externas e bloqueio de service workers nos contextos Playwright.
- Não se executam resolve-preview.py, cloudflare-publication.py, p0-migrations.py, migrações remotas, nem publicação da aplicação.
- Artefactos retidos sete dias: screenshots de navegação por perfil, traces por contexto e result.json por suite. Apenas fixtures sintéticas. Logs completos nas etapas GitHub Actions.

## Cobertura disponível

Reutiliza browser, finance-browser, improvements-browser, documents-browser e p0-browser. Seis perfis: CEO, Administração, Administrativa, Call Center, Médico/a, Técnico/a; preserva ainda a cobertura Básico existente. Navegação permitida/negada, RH/ficha central, férias e alterações parciais, notificações, temas/mobile, financeiro e documentos. Autenticação simulada: identidade local falsa recusada, expiração, permissão da conta financeira e logout. Suite complementar daily-leave-browser valida aprovação de baixa, libertação apenas dos dias coincidentes das férias, calendário durante baixa, abertura diária, tarefas obrigatórias a bloquear fecho e resumo após conclusão.

Isto comprova apenas funcionalidades demo e contratos de autenticação com respostas simuladas. Não comprova fornecedor real, sincronização multiutilizador ou persistência central RH/Operação. Capturas e traces são evidência visual, não uma comparação de pixels com baseline aprovada.

## Verificação local e limites

12/10/2026: npm test terminou com código 0 (360 linhas PASS, cadeia anterior completa, incluindo os nove testes de sessão); npm run build aprovado (57 assets). Python compila; YAML analisado; git diff --check aprovado. Revisão confirmou ausência de secrets.*, credenciais de aplicação, chamadas a previews/produção e migrações no workflow.

A rede do terminal falhou na ligação ao proxy; os ficheiros da base foram recuperados pelo conector GitHub, por SHA imutável. Servidor local e Chromium falharam por sockets não permitidos no sandbox. Não se declara navegador local aprovado. Nenhum resultado histórico substitui uma execução da nova pipeline.

Estado da validação remota: PENDENTE até inspecionar um run GitHub Actions do commit sincronizado. Só o run efetivo e os seus artefactos determinam aprovação/falha. Bloqueios de Actions, pull de imagens ou testes devem ser reportados com o link do run, sem os ocultar com skips/retries automáticos.

## Primeiro resultado efetivo e correção da infraestrutura

Run https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/38292500237, commit c62a258: regression aprovado; Chromium falhou. A execução demonstrou Chromium funcional num container sem rede. Falhas concretas: UID do container sem escrita no mount de artefactos (capabilities removidas); fixture Operação usava c1 em vez da clínica canónica da branch. Correções: usar UID/GID do runner, selecionar clínica disponível no estado da demo e guardar evidência antes de Playwright encerrar o event loop. Não se alterou a aplicação para contornar os testes. Nova execução obrigatória antes de aprovação.
