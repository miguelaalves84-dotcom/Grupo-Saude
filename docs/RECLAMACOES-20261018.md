# Reclamações — ambiente isolado

Fonte única: `complaints-core-v4.js`, `complaints-ui-v4.js`, `lib/complaints-service.js`, `api/complaints.js`. Não existia módulo equivalente no inventário desta branch. A tabela nova não substitui dados nem módulos anteriores.

## Funcionalidade

Seis etapas permanentes; responsável, registo automático do utilizador, clínica autorizada e colaboradores existentes; dados do reclamante e explicação; original e comprovativos; confirmação da advogada; resposta; envios independentes ao reclamante e ERS; confirmação ou evidência de não receção; encerramento e reabertura justificada. Pesquisa/filtros por clínica, responsável, estado, período e texto. Histórico e revisão otimista. Alertas derivados do registo canónico no sistema global de notificações, sem tabelas de alertas duplicadas.

Prazo: 15 dias de calendário à mesma hora civil em Europe/Lisbon, incluindo fins de semana e feriados e mudança de hora. Não há extensão automática. O envio aos dois destinatários determina cumprimento. Atraso continua visível depois de responder; encerramento remove os assuntos pendentes. É regra operacional do Grupo, sujeita à confirmação de procedimentos e prazos legais pela assessoria jurídica.

## Segurança e limites

Permissões `complaints` e `complaintsManage` configuráveis na matriz existente. CEO/Administração têm gestão; Administrativo pode registar/acompanhhar nas clínicas atribuídas; restantes perfis sem acesso por defeito. Alterações individuais respeitadas. Clínica e permissões verificadas no servidor em cada ação e documento. Simulação autenticada é apenas leitura. Documentos servidor exigem o controlo de segurança/antivírus já existente. Não existe acesso público a ficheiros.

O preview estático é exclusivamente sintético, com persistência no navegador. A entrada `complaints.html` não tem backend no preview e indica indisponibilidade. API desativada por defeito (`GS_COMPLAINTS_ENABLED`); migração aditiva `db/migrations/complaints-v4-001.sql` apenas preparada, sem execução remota. Não há ligação a bases reais.

Preparar email cria estado PendingConfig, nunca Sent. É possível registar envio manual e comprovativos. O envio automático à advogada ainda não está integrado com um fornecedor: exige configuração e validação. Não são enviados emails por estes testes.

Quotas, fornecedores externos, autenticação real, persistência entre dispositivos, agendamento remoto dos alertas e revisão RGPD/jurídica permanecem pendentes. Os alertas do preview atualizam ao consultar os registos; não são emails/push agendados.
