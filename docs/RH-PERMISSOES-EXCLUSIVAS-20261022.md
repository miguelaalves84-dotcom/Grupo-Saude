# Correção expressa de permissões RH — 22/10/2026

Regra prevalecente: comentário PR #13 / 6352287217. Branch dev/v4-stabilization-20261017, base 366fc39. Sem alterações a main, produção, bases reais ou dados existentes.

| Área | CEO | Administração | Call Center, Médico, Técnico, Administrativo |
|---|---|---|---|
| Formação, equipamentos, despesas/deslocações | Gestão direta na ficha | Gestão no âmbito autorizado por clínica | Sem acesso, incluindo registos próprios |
| Anexos contextuais novos | Consulta, upload e gestão | Consulta, upload e gestão autorizada | Sem consulta, alteração ou download |
| Documentos pessoais normais | Mantidos | Mantidos | Acesso legítimo preservado |
| Ponto, férias, baixas, avaliação autorizada | Mantidos | Mantidos | Acessos legítimos preservados |

## Correções

- Ocultação do separador Desenvolvimento para os quatro perfis e remoção do atalho pessoal redundante.
- Regra única no domínio, incluindo listagens, saldos, alertas, regras anuais e comandos. Uma concessão individual hrManage não contorna a exclusividade por perfil.
- Backend recusa antes de consultar dados. Simulação usa o perfil efetivo. Mudança de perfil/permissões elimina o conteúdo do modal.
- Anexos carregados pelo formulário de desenvolvimento reutilizam employeeDocuments, com restrição managementOnly persistida e preservada nas substituições. Listagens, versões, revisão e download respeitam essa restrição.
- Um anexo reservado novo não preenche nem substitui automaticamente um requisito normal em falta do contrato; os dois circuitos reutilizam o mesmo arquivo, mantendo visibilidade e validação próprias.
- Documentos pessoais normais já existentes não são reclassificados nem retirados indiscriminadamente. Dados e históricos não são apagados.
- Regras legais de formação, revisões, prevenção de duplicados e concorrência preservadas.

## Verificação

Testes locais: npm test, sintaxe, build. Testes Chromium e PostgreSQL descartável são executados no GitHub Actions para o novo SHA; só o resultado efetivo da execução permite aprovação. Cobertura: seis perfis, três formatos, dois temas, simulação CEO, acesso direto, concessões personalizadas, anexos contextuais e documentos pessoais.

## Limites

O preview é estático e exclusivamente sintético. O armazenamento local demonstrativo não constitui proteção contra o proprietário do navegador nem persistência central autenticada. A API permanece desligada por omissão e em produção. Os testes PostgreSQL isolados não ativam serviços reais, arquivo privado central ou escritores de produção.
