# RH — correções de 22/10/2026

Origem: PR #13, comentário 6329675979. Base preservada: 199cc09. Branch: dev/v4-stabilization-20261017. Sem alterações a main ou produção.

## Incrementos implementados

| Requisito | Estado deste incremento | Localização |
|---|---|---|
| Documentos em falta / total e lista divergentes (8) | Projeção única de documentos materializados e requisitos obrigatórios do contrato; lista integral agrupada por colaborador; estados distintos; upload preenche requisito sem duplicação; atualização dos contadores. | employee-documents-core-v4.js; employee-documents-ui-v4.js; hr-master-v4.js; attention-core-v4.js |
| Escalas rotativas administrativas (2) | Editor semanal, cópia da semana anterior aprovada como proposta, troca pontual, aprovação ou recusa exclusiva CEO/Administração, anterior horário efetivo preservado até aprovação, histórico e notificações. | administrative-rosters-core-v4.js; administrative-rosters-ui-v4.js; lib/administrative-rosters-service.js |
| Restantes pontos 1, 3–7 e 9–11 | Não concluídos neste incremento; exigem auditoria e desenvolvimento próprios. | Ver prioridades abaixo. |

Não foram criadas tabelas paralelas. Escalas aprovadas usam monthlyRosters; propostas/decisões usam timeOccurrences com discriminador roster-change. Serviço isolado usa app_settings existente e auditoria existente. O editor mensal antigo não pode gravar diretamente quando a implementação consolidada está carregada. As decisões genéricas de ponto não aprovam escalas.

## Segurança e limites

- CEO também tem de submeter e aprovar explicitamente; nenhuma proposta é aplicada automaticamente.
- Validação de clínica, colaboradora ativa, ausência aprovada, conflito de turnos, dias repetidos, versão anterior, máximo operacional 8h/dia e 40h/semana, descanso de 11h e pelo menos uma folga. Política conservadora requer revisão laboral e parametrização antes de utilização real; turnos noturnos não suportados.
- Serviço aplica transação, comparação de snapshots e bloqueio para concorrência; decisões são revalidadas. Endpoint de produção permanece desativado.
- Preview estático: persistência demonstrativa apenas neste navegador; não comprova autenticação/persistência central entre dispositivos. Testes PostgreSQL isolados não ativam o backend.
- Uploads do preview continuam sintéticos; arquivo privado real e serviços de email não foram ativados.
- Dados históricos e funcionalidades anteriores preservados; não foram executadas eliminações nem migrações.

## Prioridades restantes do comentário

1. Completar verificação do prazo operacional das Reclamações e alertas 7/3/1 dias.
2. Ausências/documentos em 48h com análise humana; onboarding seguro; licença de técnicos e ERS condicional.
3. Percentagens por técnica/tratamento com vigência e snapshots financeiros preservados.
4. Resumo A4 e impressão contextual; documentos obrigatórios por clínica.
5. Email diário de cobertura e integração central autenticada: dependem de configuração segura; nunca apresentar envios fictícios.

## Verificação

Testes unitários novos: tests/administrative-rosters.cjs e extensão de tests/employee-documents.cjs. PostgreSQL: tests/administrative-rosters-postgres.cjs. Chromium: tests/rh-20261022-browser.py, seis perfis × computador/tablet/telemóvel × claro/escuro; artefactos com imagens e resultados. Resultados efetivos e SHA final são comunicados após conclusão do workflow GitHub Actions. Este documento não constitui declaração de aprovação antecipada.
