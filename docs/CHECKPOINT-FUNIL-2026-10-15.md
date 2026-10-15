# Checkpoint local do funil e navegação — 15/10/2026

Branch dev/v4-group1-operational-tests, base 1e769bc. O utilizador autorizou guardar o trabalho concluído do funil antes da fase de identidade e RH central. Este commit preserva o funil/recrutamento, âmbito clínico, navegação/atenção, proteção de dados locais e correções do ponto que partilham o controlador App e a sua regressão. Não inclui os backups, credenciais, dependências, capturas ou traces.

O restante trabalho das Fases 2–6 e financeiro permanece no working tree, sem reset, clean, stash ou substituição. Há um manifesto privado dos ficheiros atuais em node_modules/.cache/rh-central-preservation-*/manifest.json.

A contagem histórica de 886 ficheiros não está confirmada: docs/BLOCO-01-SESSAO.md regista que esse conjunto e a branch dev/v4-identidade-rh-central não estavam disponíveis. Não confundir a preservação dos ficheiros presentes com a prova de recuperação desse conjunto histórico.

A regressão npm inicial encontrou uma falha preexistente no teste Gmail (tests/gmail-activation.cjs:41, esperado 2, obtido 0), a investigar na fase seguinte. Os testes específicos de Fase 1 e de sintaxe são registados em docs/evidence/rh-central-20261015/checkpoint-*.log. Este checkpoint não afirma que a suite global está aprovada.

Sem push, merge, main, deploy ou migração real. [CF-Pages-Skip] no commit evita a interpretação do checkpoint como pedido de publicação.
