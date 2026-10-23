# Correções após auditoria geral — 23/10/2026

Base ec0a3d8, branch dev/v4-stabilization-20261017, PR #13 em rascunho. Instrução: comentário 6366561883. A auditoria original permanece imutável; este documento regista a evolução posterior.

## Bloco A — regressões comprovadas

- RH-TIME-01: a ficha usa eventos, dias, clínicas e correções aprovadas do núcleo do Livro de Ponto. Não soma o campo legado `minutes` de marcações individuais. Não altera eventos originais ou saldos.
- PERM-CEO-01: negações guardadas prevalecem também para CEO, em coerência com os serviços de servidor existentes. A tabela e o editor individual já não indicam permissões CEO fixas nem ignoram as escolhas. A simulação usa a identidade efetiva, sem herdar CEO. A autorização por clínica não contorna uma negação CEO.
- CLINIC-NAV-01: Gestão → Clínicas consulta documentação; Tabelas → Gerir clínicas abre o mestre existente em janela própria. Reutiliza as mesmas clínicas, catálogo, anexos e histórico. O renderer legado delega no atual, evitando sobreposição tardia.
- Testes locais: `npm test`, build e testes específicos de horas/correções/múltiplos dias, seis perfis e separação dos destinos. Chromium e CI só serão declarados aprovados após resultados no GitHub Actions.

## Recuperação de Caixas — diagnóstico de origem

Pesquisa: 30 pontas de branches, 59 blobs de app/index/extensões relevantes e 523 commits do histórico main, em leitura. A implementação encontra-se no `index.html` do commit inicial **fadee5eff1059eafc2c5520656ebb4d050c56e31**, blob **e32abcdc42cf04b50003c0e2a7bbf8451fbb8bc4**, também presente no checkpoint inicial V4 99d5ff4.

Capacidades comprovadas: menu Caixa, folhas por clínica/data, total e multibanco, cálculo a depositar, valor/data de depósito, comprovativo/referência textual, observações, diferença, estados A aguardar depósito / A aguardar validação / Validada, indicador Caixas por validar. O fecho diário antigo exigia folha existente. As funções eram `calcCash`, `saveCash`, `validateCash`, `renderCash` e a coleção era `s.cash`, no armazenamento `grupo_saude_v31` (confirmar a chave exata antes de importar qualquer dado).

Limitações históricas: atualização substituía valores sem histórico estruturado; não havia autorização de validação por perfil demonstrada, controlo de concorrência ou idempotência. O campo de comprovativo era referência textual, não upload privado. Não recuperar essas fragilidades nem inventar integração bancária, receitas ou créditos salariais.

Destino de consolidação: Financeiro existente, folha operacional por clínica/dia, sem segundo ledger de contas correntes. Preservar registos antigos e separar metadados de auditoria; não importar silenciosamente por nome de clínica, não atribuir proprietários fictícios, não mover dados pessoais para o preview. Requisitos ambíguos ficam identificados; apenas capacidades comprovadas serão recuperadas.

## Infraestrutura P0

O ambiente desta sessão não tem credenciais ou identidades de backend configuradas. Preparação e validação descartável são possíveis; autenticação central, arquivo privado e restauro operacional continuam bloqueados até existirem recursos e credenciais de testes confirmados. Não criar recursos remotos, executar migrações reais ou apresentar o preview sintético como central.

## Preservação

Checkpoint privado fora do repositório: `/workspace/correcoes-auditoria-20261023/checkpoint-ec0a3d8.tar`; SHA-256 `f94a91242665a93914c11dd92bdc5a01b395cfd10b40ae2f292a79c4ad05ea70`. Contém código e histórico Git locais, excluindo dependências/build/cache. Não é publicado no GitHub.
