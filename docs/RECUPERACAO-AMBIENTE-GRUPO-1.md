# Recuperação segura — Grupo Saúde V4, Grupo 1

## Checkpoint e limites

- Branch de trabalho: `dev/v4-group1-operational-tests`.
- Base obrigatória: `ebc2df5c38903fd8faf62e17b8b0a0c92faad49b`.
- Antes deste checkpoint existia apenas um ficheiro novo não guardado: `docs/PLANO-GRUPO-1-OPERACIONAL-TESTES.md`. Não havia alterações ao código da aplicação.
- O checkpoint guarda o plano, este guia e a desativação de deployments Git automáticos para esta branch em `vercel.json`. Mantém todas as definições das outras branches, crons e domínios. A mensagem de commit inclui `[CF-Pages-Skip]`.
- Nenhum projeto remoto, secret, migração, base ou domínio criado/alterado. Nenhum custo adicional incorrido nestas operações.
- Better Auth não está instalado; backend operacional do Grupo 1 não implementado. Testes locais da base não validam fornecedor real, Neon ou integração operacional.

## Porque o ambiente bloqueou

Comandos de rede e acesso ao socket Docker foram recusados pelo sandbox. As chamadas com permissões adicionais ficaram pendentes e terminaram sem resultado de execução. Não repetir essas chamadas enquanto a camada de execução não estiver recuperada. O conector GitHub é uma via independente e deve ser usado para sincronização, com `force=false` e comparação da cabeça remota.

O estado do ambiente não tem bindings de segredos Neon/Mailtrap. O conector Vercel confirmou a equipa mas não devolveu quota/faturação disponível. Ofertas públicas gratuitas não provam que a conta dispõe de quota. Não provisionar recursos até confirmar estas condições.

## Recuperação preferida numa nova sessão

1. Abrir o repositório `miguelaalves84-dotcom/Grupo-Saude` num ambiente novo com acesso GitHub autorizado.
2. Fazer um clone completo, selecionar `dev/v4-group1-operational-tests` e confirmar o SHA do checkpoint no relatório de recuperação. Se a branch não existir remotamente, usar o procedimento do pacote abaixo.
3. Executar `git status --short` e confirmar que não há ficheiros em falta. O checkout atual é superficial; evidências binárias continuam na árvore Git mas algumas não estão no disco/objeto local. Um clone completo deve recuperá-las sem alterar hashes ou eliminar entradas.
4. Ler `docs/PLANO-GRUPO-1-OPERACIONAL-TESTES.md`, este guia e `docs/MATRIZ-14-GRUPOS.md`. A autorização geral já foi concedida; respeitar o limite 0 EUR e os restantes limites.
5. Executar `npm test` e `npm run build`, que não instalam dependências nem acedem a serviços externos.
6. Testar acesso a rede com timeout curto apenas depois da recuperação de permissões; não repetir uma chamada pendente. PostgreSQL local requer instalação/acesso recuperado; Docker não é um pré-requisito se existir PostgreSQL local descartável.
7. Confirmar quotas e acessos seguros antes da fase remota. Nunca usar credenciais herdadas de produção ou pedir ao utilizador que as cole na conversa.

## Recuperação pelo pacote local

O pacote `grupo1-recuperacao.tar.gz` fica fora do repositório, em `/workspace/grupo1-recuperacao/`. Inclui apenas ficheiros deste checkpoint, `checkpoint.patch`, manifest com hashes SHA-256 e este guia. Não inclui `.env`, credenciais, node_modules, dados de produção nem as evidências binárias da base remota. Guardar uma cópia do pacote antes de descartar a sessão.

1. Clonar o repositório completo num diretório novo e confirmar que a base `ebc2df5c38903fd8faf62e17b8b0a0c92faad49b` existe.
2. Criar uma branch local de recuperação a partir dessa base, sem selecionar main. Não sobrepor uma branch ou diretório com trabalho existente.
3. Extrair o pacote num diretório temporário. Confirmar os hashes de `manifest.json` antes de usar os ficheiros.
4. Executar `git apply --check /caminho/para/checkpoint.patch`. Só depois aplicar o patch com `git apply /caminho/para/checkpoint.patch`.
5. Comparar os três caminhos alterados listados no manifest; executar os testes offline; criar um commit e sincronizar sem force push. Se a branch remota tiver avançado, comparar e integrar numa branch de recuperação separada, sem substituir trabalho remoto.

## Acessos a preparar pelo utilizador, sem partilhar segredos

- Vercel: confirmar no painel da equipa Grupo Saude plano, quota incluída e proteção do preview sem custo adicional. Não modificar o limite global de gastos, porque poderia afetar outros projetos. Nenhum upgrade, add-on ou plano pago.
- Neon: confirmar conta Free com capacidade para projeto novo na UE. Criar/ligar acessos exclusivamente pelo gestor seguro do ambiente quando o ambiente estiver recuperado. Não escolher uma base existente nem copiar dados.
- Mailtrap: confirmar Email Testing Free, uma caixa sandbox e capacidade para testes de recuperação (50 emails/mês, 10 guardados, no máximo 1 envio/10 segundos conforme preço público consultado). Não configurar Email Sending nem encaminhamento real.
- Instalação do fornecedor e execução SQL só depois de recuperar o ambiente e cumprir as condições do plano, incluindo backup inicial, confirmação do destino e grants mínimos.

## O que permanece por fazer

Instalar/fixar Better Auth e dependências; separar identidade das dependências Financeiro/Blob; implementar fornecedor real, sessões/reset/revogação, APIs de identidade/permissões/clínicas; preparar SQL revisto e seed sintético; provar persistência entre duas sessões, isolamento multiclínica, concorrência e auditoria; obter resultados efetivos no Actions; publicar preview integrado novo. RH, Stock, Financeiro e Operação Diária não devem ganhar escritores reais neste bloco.
