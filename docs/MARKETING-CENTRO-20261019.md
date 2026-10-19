# Centro de Marketing — consolidação e entrega por fases

Branch exclusiva `dev/v4-stabilization-20261017`, PR #13 em rascunho. Base preservada `7b4c2a6`. Não altera main, produção, recursos ou credenciais reais.

## Inventário anterior e decisões

- `app.js` / `operation-core-v4.js`: abertura canónica, capacidades RH, fecho e estatísticas. Retirados apenas os detalhes de capacidade/vagas e textos de abertura/atualização dos médicos na abertura. As capacidades continuam a vir da ficha RH e permanecem no modelo; os técnicos e o botão único mantêm-se. Se faltar a capacidade RH, o erro identifica o médico/categoria e pede a configuração à Administração; não se inventa uma capacidade nem uma taxa de ocupação.
- `gs-enterprise.js`: já criava o separador Marketing e `state.marketing.campaigns`, ideias, aprovações, chat e revisão publicitária. Mantém-se a entrada e todos os dados. O renderer, editores e funções públicas legadas encaminham para o centro novo. A secção usa o mesmo ID no HTML inicial; a instalação antiga deteta a sua existência e não a recria, corrigindo a corrida de abertura por URL antes do temporizador legado. O verificador textual continua disponível como auxiliar; aprovação requer intervenção humana e nunca equivale a conformidade jurídica automática.
- O chat antigo escrevia uma resposta fixa do “agente” sem chamada a IA. Deixa de produzir essas respostas no fluxo consolidado. Conversas e rascunhos históricos permanecem intactos; IA fica explicitamente indisponível.
- Especialidades: consulta dos catálogos canónicos `masterSpecialties`/`clinicSpecialties` e, no servidor, das tabelas existentes `specialties`/`clinic_specialties`. Não é criado catálogo de especialidades de Marketing; uma campanha só pode escolher uma especialidade disponível nas clínicas selecionadas. A representação antiga `clinic.specialties` é apenas compatibilidade quando não existem associações canónicas.
- Call Center: `state.requests` / tabela PostgreSQL `requests` já contêm o funil de pedidos. São a única fonte de contactos. Origem, campanha, consentimento e evidência da realização são acrescentados ao mesmo pedido, com revisão e histórico. Não há segunda tabela ou array de contactos. Leituras deduplicam IDs de pedidos e campanhas, evitando duplicação de contagens/investimento; registos antigos repetidos permanecem preservados para reconciliação, sem eliminação automática.
- `attention-core-v4.js` e `attention-ui-v4.js`: reutilizados para contadores globais. Alertas derivados das campanhas, despesas, conteúdos e tarefas, sem cópia persistida de notificações. A auditoria das configurações não aninha cópias do histórico anterior, prevenindo crescimento exponencial em edições repetidas do catálogo. Associações clínicas antigas por nome só são resolvidas se unívocas. Registos sem correspondência são preservados e podem ser associados explicitamente por gestores autorizados.
- `CandidateDragV4`: reutilizado para rato, toque e caneta, com pega para separar arrastamento de deslocação horizontal e seletor alternativo.
- Servidor: política de autorização existente, `FinanceService`, `app_settings` e `requests`. Sem nova tabela de contactos, campanhas ou migração remota. Documento de Marketing em `app_settings.marketing_v4`; as campanhas mantêm um único ID mesmo quando abrangem várias clínicas. Escritas usam transação e comparação da versão anterior, com rollback se houver conflito.

## Fase 1 — base funcional implementada

Dashboard com filtros por clínica autorizada, especialidade, campanha, canal e dia/semana/mês/trimestre/ano/intervalo. Comparação com intervalo anterior de igual duração, série diária interativa e comparação de clínicas. Campanhas com objetivo, público-alvo descritivo, especialidade, canal, datas, responsável, orçamento, texto/material descritivo, estados internos, revisão humana e histórico. Registo de investimento efetivo por data/clínica e referência documental; não confundir orçamento com despesa.

Catálogo de canais extensível em Tabelas internas do centro, sem alterar código e sem criar ligações a fornecedores. Política de conservação proposta pode ser registada por gestores, com execução explicitamente pendente e sem eliminação automática.

Objetivos mensais e orçamentos por clínica, especialidade, campanha e canal. Consulta do progresso das contagens e diferença entre previsto/registado. Atribuição a campanhas usa apenas campanhas da clínica do pedido e mantém o ID original. Nenhum investimento ou anúncio é executado pela aplicação.

### Semântica dos indicadores

- Contactos: IDs únicos dos registos existentes com data de entrada no período. Os pedidos legados contam também como contactos; não são inventadas interações publicitárias anteriores.
- Pedidos: contactos já registados como pedidos de consulta. Um eventual registo de tipo `contact` só conta como pedido quando existe a respetiva data de pedido.
- Marcações e realizadas: eventos com datas fiáveis no período. Consultas realizadas exigem uma referência de confirmação registada por utilizador autorizado; não se inferem de uma marcação.
- Conversões: coorte de entrada no período e respetivo percurso conhecido. Não misturar taxas da coorte com volumes de eventos. Marcações antigas sem data fiável são sinalizadas e excluídas dos volumes temporais de marcações.
- Investimento: despesas efetivamente registadas, não o orçamento. A ausência de importações externas significa cobertura incompleta, nunca investimento total confirmado do fornecedor.
- Receita: só pagamentos únicos `Pago` ligados explicitamente a pedidos com realização confirmada. Sem ligação financeira fiável, receita e ROI aparecem indisponíveis; não se calculam receitas a partir de preços, orçamentos ou estimativas. O bootstrap servidor ainda não fornece essa ligação financeira, pelo que aí estes indicadores permanecem indisponíveis.
- Custos sem denominador, conversões sem coorte e retorno sem receita fiável ficam indisponíveis. Associações de campanha desconhecidas são sinalizadas, sem adivinhação.

## Fase 2 — operação interna disponível, com limites

Funil de sete etapas sobre os pedidos existentes, seletor, arrastamento partilhado e ligação ao editor original para atribuição de responsável. Realização exige data/evidência; não conversão exige motivo. Consentimento comercial explícito com prova, oposição e retirada, sempre auditados e sem envio de mensagens. Tarefas ligadas ao ID original, prazos e conclusão.

Planeamento editorial em cartões datados, texto, plataforma, clínica, especialidade, responsável, revisão e histórico. Adaptação cria novo rascunho sem copiar aprovação. Campanhas e conteúdos exigem revisão humana antes de aprovação. A designação interna “Ativa” não publica anúncios nem executa despesa.

Alertas numéricos para campanhas por aprovar, orçamento de campanha a 90%/superior, publicações em revisão, tarefas atrasadas e campanhas concluídas por analisar. Ler uma notificação não resolve o processo. Alertas desaparecem quando a fonte deixa de estar pendente.

**Por concluir nesta fase:** upload privado de materiais/imagens/vídeos, calendário mensal completo, gestão avançada de metas/desvios, política de retenção executável e análise de encerramento das campanhas. Seguimento de pedidos continua também nas notificações existentes do Call Center. Não há contactos comerciais automáticos.

## Fases 3 e 4 — preparação, não ativação

O assistente apresenta “IA indisponível — configuração pendente”. Pode preparar um pacote local de contagens/custos agregados, sem nomes, telefones, notas de utentes, documentos ou dados clínicos individuais, para revisão humana. Isso não é uma resposta de IA nem um fornecedor ligado. Recomendações, distribuição de orçamento, geração de textos e relatórios com LLM estão pendentes de fornecedor, proteção de dados, configuração e testes específicos. Nenhuma chamada externa é efetuada.

Google Ads, GA4, Google Business Profile, Facebook, Instagram e Meta Ads aparecem “Não ligada”. OAuth no servidor, aprovação de contas/aplicações, permissões específicas, importação idempotente, atribuição de conversões e publicação oficial permanecem por implementar/configurar. Não existem credenciais no frontend, métricas simuladas do fornecedor, botões de publicação funcionais ou gasto automático.

Antes de ligar fornecedores: confirmar quotas/custos, titularidade, permissões mínimas, dados estritamente necessários, localização e conservação, base legal e revisão de publicidade em saúde/RGPD. Não usar informação clínica individual para segmentação. Não ativar despesa, publicação ou comunicação sem aprovação explícita. A pré-validação textual antiga não substitui assessoria jurídica.

## Segurança, testes e preview

Permissões de Marketing por ação adicionadas ao catálogo existente, mantendo os seis perfis. CEO/Administração têm âmbito global de Marketing; os restantes só nas clínicas atribuídas e com concessões explícitas. Campanhas que abrangem clínicas adicionais não expõem os respetivos valores a um utilizador com âmbito parcial. O Call Center pode associar um pedido a uma campanha partilhada através de uma projeção mínima (ID, nome, canal e apenas clínicas autorizadas), sem receber orçamento, materiais ou dados de outras clínicas. Endpoint próprio de opções valida a clínica e a permissão de pedidos. O servidor revalida função, clínica, revisão, responsável, consentimento e evidência; o frontend não é a fronteira de segurança. Bootstrap minimiza os pedidos e não entrega nomes/contactos/notas pessoais; referências e histórico só a quem tem acesso a pedidos/marcações.

`api/marketing.js` está desativada por defeito, exige configuração isolada explícita e recusa ativação em produção. Preview continua estático, protegido, sintético e com persistência apenas no navegador. Não equivale a autenticação real ou sincronização entre dispositivos. Backend é verificado separadamente com PostgreSQL descartável; nenhuma migração ou recurso real foi criado.

Testes de domínio, API bloqueada por defeito, permissões, consentimentos, atribuição, custos, aprovação, duplicados, legados e minimização do pacote de IA. Suite Chromium dedicada aos seis perfis, concessões/remoções, três formatos e dois temas, com interações reais e tráfego externo bloqueado. PostgreSQL testa persistência entre atores, isolamento, concorrência e auditoria. Regressões existentes mantidas. Resultados só aprovados após execução efetiva no GitHub Actions do commit entregue.
