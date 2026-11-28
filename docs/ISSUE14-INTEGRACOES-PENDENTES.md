# Tarefa #14 — limites e ativação futura

## O que o preview demonstra

Os pedidos, versões, confirmações e respostas utilizam o mesmo estado sintético do programa no navegador. A alternância entre perfis testa o fluxo e as permissões do domínio; não demonstra autenticação nem persistência entre dispositivos. O endereço novo tem armazenamento local próprio e não importa automaticamente os registos de previews anteriores.

O backend reutiliza authorization-service, users/employees/clinics, app_settings e audit_log. A API /api/hr-portal fica fechada por defeito: exige GS_HR_PORTAL_ENABLED, configuração isolada existente e sessão autenticada; recusa produção. O preview estático não publica esta API como operacional. Os testes PostgreSQL são executados numa base descartável de CI, sem migrações ou ligações a bases reais.

## Assinatura digital: preparada, não operacional

O SHA-256 atual identifica o rascunho canónico (conteúdo, versão do modelo, origem e destinatário). Não é assinatura digital, nem validação criptográfica de um PDF assinado. Confirmar leitura ou conferir os dados não transforma uma declaração em documento assinado.

Antes de ativar a conclusão real:

1. Escolher e validar juridicamente o método/prestador adequado; confirmar região, subcontratação, conservação, base legal, informação aos titulares, custos e condições de teste. Não presumir assinatura qualificada só pelo nome do serviço.
2. Validar identidade e poderes do gerente autorizado para cada entidade/clínica; usar os utilizadores e autorizações existentes, sem criar perfil de acesso paralelo.
3. Ligar arquivo privado autenticado com verificação de ficheiros, permissões antes de cada consulta/download, retenção, versões, logs e recuperação testada.
4. Implementar o adaptador do prestador exclusivamente no servidor. Associar a versão e os bytes efetivos do documento ao pedido; validar callbacks, autenticidade, cadeia/certificado, integridade, revogação e carimbo temporal conforme o método escolhido. O pedido HTTP do navegador nunca fornece a prova considerada confiável.
5. Preservar o rascunho e a evidência de assinatura, incluindo signatário, data, versão, hash do ficheiro assinado e referência privada. Só então permitir estado Assinada e disponibilização autorizada ao colaborador.
6. Testar adulteração, certificado inválido/revogado, assinatura de gerente não autorizado, callbacks repetidos, concorrência, indisponibilidade do fornecedor, substituição do ficheiro e isolamento por clínica. Validar manualmente uma assinatura efetiva de teste antes de declarar integração concluída.

Não existe adaptador configurado: complete devolve indisponibilidade. Não há opção na interface para forçar a conclusão ou desenhar uma assinatura como substituto. O único ponto de extensão de verificação no domínio é interno ao servidor e não é preenchido pelo serviço atual.

## Outras dependências

- Não enviar emails reais. Notificações internas derivam dos registos; entrega por email requer a integração já prevista, autorização e política apropriada.
- Formação: consulta pessoal mínima a partir de hrTraining; gestão, enquadramento contratual, anexos reservados, equipamentos e despesas permanecem no backoffice existente. Não existe atribuição universal automática de 40 horas.
- Avaliações, ponto, baixas, férias, documentos pessoais e financeiro continuam nos controladores existentes; as limitações anteriores de autenticação/arquivo não são resolvidas apenas por esta interface.
- Permanecem necessárias validação em Android físico, configuração central autenticada e validações legais/operacionais. Não declarar conformidade integral RGPD nem prontidão para dados reais.

Nenhum fornecedor, serviço pago, armazenamento real, envio de email ou recurso de produção foi ativado por esta tarefa.
