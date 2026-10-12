# Bloco 01 — sessão e continuidade de desenvolvimento

Data: 12/10/2026. Grupo 1 da matriz `MATRIZ-14-GRUPOS.md`.

Base comprovada: PR #12, `81439172a17576970957ebe0af13faec62b19e9f`.
Branch isolada: `fix/v4-p0-security-hardening-session`.
Worktree: `/workspace/Grupo-Saude-session`; repositório comum `/workspace/Grupo-Saude-p0/.git`.
As worktrees e checkpoints anteriores foram preservados. A branch `dev/v4-identidade-rh-central`, os 886 ficheiros e os SHAs a580d6f/986ad20/c742f41/696a9a4/0904c4b/4968b44/af6fd56 continuam indisponíveis. Esta entrega não os reconstrói.

## Correção

- Sessão de cliente exige identidade e expiração válidas recebidas do backend. Expiração fecha a sessão; leitura da identidade verifica também o prazo, mesmo após suspensão de timers pelo navegador.
- Logout invalida a identidade imediatamente e cancela o timer, mesmo se o fornecedor estiver indisponível.
- Refresh atrasado não restaura uma sessão encerrada nem substitui a identidade de um refresh posterior.
- 401/403 atrasado não fecha uma sessão mais recente. Resposta financeira atrasada é descartada quando a geração da sessão mudou, impedindo apresentação de dados da identidade anterior.
- Snapshots de permissões/clínicas não podem ser alterados pelo código consumidor. O servidor continua a ser a autoridade; congelamento frontend não é controlo de autorização servidor.
- Fixture Chromium existente recebe expiração sintética válida, sem retirar as verificações de seis perfis, identidade local falsa e expiração.

## Testes desta entrega

`npm test`: cadeia completa aprovada, incluindo nove novos testes de ciclo de sessão com VM e respostas sintéticas. Os testes anteriores permanecem na cadeia sem remoção; o log integral está no workspace `/workspace/session-regression.log`. Parsing JS aprovado. `npm run build`: aprovado, 57 assets. `git diff --check`: aprovado.

Chromium: **BLOQUEADO neste ambiente**. Playwright está disponível, mas o binário não. A execução de `tests/p0-browser.py` falhou por browser ausente; foi tentada instalação num diretório isolado, sem sucesso no download. Logs `/workspace/session-browser.log` e `/workspace/session-chromium-install.log`. Não se declara regressão atual de navegador aprovada com base nos logs históricos.

Fornecedor real, duas sessões autenticadas reais e persistência central: **BLOQUEADOS**, sem serviços/credenciais de teste. Nenhuma migração foi executada, mesmo em PostgreSQL descartável, nesta entrega. Nenhum writer RH/Operação foi ativado.

## Sincronização de código sem publicação da aplicação

O nome conserva o prefixo protegido pelo backend e middleware P0. O commit usa `[skip ci] [CF-Pages-Skip]`, e `vercel.json` desativa deployment Git **apenas para esta branch**, segundo a configuração oficial `git.deploymentEnabled`. Não se altera a configuração de main/produção no painel nem os seus ficheiros.

O commit deve ser enviado só à branch nova e com pai exato 8143917, sem force push. Verificar identidade da árvore local/remota, head remoto, main inalterada, segredos e ausência de deploy antes de comunicar a sincronização. Não declarar CI remota executada: o marcador skip suspende-a. Nenhum PR é integrado automaticamente.

## Limitações e próximo bloco

P0-01/P0-03 continuam parciais. Esta correção melhora o ciclo de sessão mas não liga todos os módulos ao backend nem comprova autenticação externa. Continuar pelo provider/vínculo verificado, autorização clínica e persistência progressiva, mantendo os bloqueios e sem migrações até autorização explícita. A matriz de 14 grupos é a organização dos requisitos acessíveis; a matriz da sessão perdida não foi recuperada.

Para impedir perda de trabalho: por bloco, manter matriz/relatório, testes e limitações; rever todos os ficheiros do commit por segredos/dados; sincronizar uma branch de desenvolvimento e confirmar o SHA remoto; nunca apresentar um commit apenas local como guardado no GitHub.
