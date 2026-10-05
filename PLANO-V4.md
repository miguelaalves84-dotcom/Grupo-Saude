# Grupo Saúde — V4 · Checklist Mestre

Branch de desenvolvimento: `v4-fecho-work`

> Regra: não alterar `main`/produção até a V4 estar testada e aprovada.

## Estado
- [x] Estrutura multi-clínica e tabela mestre de clínicas
- [x] Clínica → especialidades → médicos/técnicos editável
- [x] RH separado em Colaboradores e Candidatos
- [x] Passar candidato para colaborador e adicionar colaborador direto
- [x] Base de documentos, datas e funil documental
- [x] Livro de ponto: histórico, ocorrências, aprovação/recusa/reversão e auditoria
- [x] Férias, baixas, justificações e regra de bónus trimestral (>30 dias de baixa)
- [x] Conta corrente: atos, percentagens, bónus, pago/por pagar
- [x] Matriz dos 6 níveis: Call Center, Médico/a, Técnico/a, Administrativa, Administração, CEO
- [x] Checkpoints operacionais 10h/12h/14h/16h/18h
- [x] Bloqueio de abertura/fecho por uma única administrativa
- [x] Alertas acionáveis, lembretes horários e chat interno (base)
- [x] Funil Pedido de Consulta → A aguardar Vaga → Sem especialidade na clínica → Marcado
- [x] Médico “Indiferente / primeiro disponível”
- [x] Planeamento/vagas e adaptador Clicloud
- [x] BI: comparações, financeiro e deteção base de anomalias
- [x] Marketing IA: compliance de publicidade em saúde + aprovação humana
- [x] Chat dedicado ao Agente de Marketing IA
- [x] Backup local verificável/restauro no Preview

## Em implementação / por fechar antes de produção
- [ ] Backend persistente: substituir localStorage por base de dados
- [ ] Autenticação real, sessões e aplicação server-side das permissões
- [ ] Armazenamento seguro de documentos/anexos
- [ ] Backup externo cifrado + política de retenção + testes automáticos de restauro
- [ ] Integração real com API Clicloud e sincronização programada
- [ ] Integração real do Marketing Chat com modelo IA
- [ ] Consulta atualizada a fontes oficiais da legislação de publicidade em saúde antes de cada publicação
- [ ] Publicação em redes sociais apenas após aprovação humana
- [ ] Email/SMS/push reais para alertas e escalonamentos
- [ ] Relatórios completos hora/dia/semana/mês/ano por clínica, especialidade e profissional
- [ ] Faturação consolidada mensal por clínica e Grupo
- [ ] Análise semanal IA de tendências/anomalias
- [ ] Histórico salarial completo e arquivo de ex-colaboradores
- [ ] Retenção de baixas/justificações conforme política definida
- [ ] Privacidade documental RH limitada a Administração/CEO no backend
- [ ] Testes E2E de todos os 6 perfis
- [ ] Testes multiutilizador simultâneos de abertura/fecho
- [ ] Testes de migração das clínicas e revisão dos dados reais
- [ ] Revisão visual/mobile e acessibilidade
- [ ] Auditoria imutável no backend
- [ ] RGPD: retenção, exportação, eliminação/anonimização e registo de acessos
- [ ] Monitorização/health checks e alertas técnicos
- [ ] Aprovação final do utilizador antes de promover V4 a produção

## Regra de acompanhamento
Cada ponto deve passar por: **Por fazer → Em implementação → Pronto para testar → Validado → Produção**.

## Integrações automáticas de RH e arquivo documental
- [ ] Caixa de email de recrutamento configurável: ler automaticamente novos emails com CV/anexos
- [ ] Criar candidato automaticamente a partir do email, guardar CV, remetente, contacto, clínica/função quando identificáveis, responsável, notas, prazo e alertas
- [ ] Funil de recrutamento com estado e próxima ação
- [ ] Deteção de duplicados de candidatos/CVs e revisão humana dos dados extraídos
- [ ] Email de backup documental configurável
- [ ] Enviar automaticamente cópia dos documentos definidos para o email de backup: recibos, baixas, justificações, faturas, comprovativos, contratos e documentos profissionais
- [ ] Ao tornar colaborador inativo: arquivar e enviar pacote documental completo para o email de backup
- [ ] Baixas e justificações: retenção de 1 ano e eliminação/anonimização controlada após o prazo
- [ ] Histórico de envio, estado entregue/falhou, tentativas e auditoria
- [ ] Acesso aos documentos RH apenas Administração/CEO
- [ ] Alertas também por email; destinatários configuráveis e histórico
- [ ] Pendências obrigatórias: lembrete horário para email da clínica até conclusão, com escalamento configurável
