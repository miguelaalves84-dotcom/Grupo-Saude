# Correções após validação visual — 22/10/2026

Base preservada: beb8ddb, branch dev/v4-stabilization-20261017. PR #13, comentário 6345607645.

## Alterações

- Escalas CEO/Administração: aplicação direta, sem motivo nem aprovação adicional. Pedidos dos colaboradores: justificação e aprovação; aprovação sem motivo, recusa com motivo obrigatório. Mantidos registos antes/depois, validação de ausências, limites operacionais, isolamento e controlo de concorrência existente.
- Conversão: profissão removida da confirmação, preservada da candidatura, também no serviço central. Os seis perfis de acesso mantêm-se independentes.
- Ficha: campos existentes agrupados em secções recolhíveis por assunto, sem desmontar campos ou perder rascunhos. Remuneração e pagamento do subsídio juntos; contrato separado. Secções abertas inicialmente para preservar a descoberta dos campos e compatibilidade.
- Documentos: reutilização integral do catálogo/checklist e controlador existentes. CEO/Administração pode carregar em nome do colaborador autorizado, com proprietário e autor distintos no histórico. Retorno à mesma ficha, sem mudar de módulo. Outros perfis não adquirem esta permissão mesmo com permissões personalizadas de revisão. Validação, versões, validade, histórico e contadores mantidos.

## Validação

npm test e build executados localmente. Testes de domínio cobrem gravação direta, pedido pendente, aprovação sem motivo, recusa com motivo, seis perfis, âmbito clínico e upload pela gestão. Suites Chromium atualizadas para a nova regra e ampliadas com gravação direta, secções da ficha, upload por terceiro, validação e retorno. Teste PostgreSQL de documentos ampliado com CEO/Administração e negações dos restantes perfis.

Resultados Chromium e PostgreSQL só são aprovados após execução efetiva no GitHub Actions no novo SHA. O relatório final deve indicar o run e o preview efetivos; este documento não representa aprovação antecipada.

## Limitações preservadas

Preview exclusivamente sintético: ficheiros de teste no navegador, sem arquivo privado central autenticado ligado, sem envio real de emails e sem dados reais. Testes PostgreSQL descartáveis não significam persistência central ativa no preview. Nenhuma migração ou configuração de produção foi autorizada ou alterada.
