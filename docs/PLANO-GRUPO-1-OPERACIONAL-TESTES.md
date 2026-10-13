# Grupo 1 operacional — plano aprovado com condições

Base: ebc2df5c38903fd8faf62e17b8b0a0c92faad49b. Branch local: dev/v4-group1-operational-tests.
Este documento é um plano, não uma prova de integração operacional. Nenhum recurso remoto, fornecedor, credencial ou migração foi utilizado para o preparar.

Autorização do utilizador registada nesta sessão: recursos de testes novos, dados sintéticos, custo adicional máximo de 0 EUR, quotas/acessos confirmados antes de criação, backup inicial e registo de migrações, separação de papéis técnicos. Não voltar a pedir a autorização geral já concedida. Operações pagas ou fora deste âmbito exigem autorização específica.

## Arquitetura proposta

- Criar um projeto Vercel novo `grupo-saude-v4-integracao-testes`, separado dos projetos de produção e do preview demonstrativo. Publicação manual, sem associar Git no primeiro bloco, sem crons e sem domínio personalizado. Usar exclusivamente o endereço atribuído a este projeto; proteger o acesso com Vercel Authentication quando disponível no plano atual.
- Criar um projeto Neon novo `grupo-saude-v4-grupo1-testes`, região UE disponível próxima do backend (preferência Frankfurt), sem clone, importação ou vínculo a qualquer base existente. Base `gs_v4_test`, com dados exclusivamente sintéticos. Confirmar região, plano e quotas antes de finalizar a criação.
- Proposta de fornecedor: Better Auth autoalojado no backend de testes, com PostgreSQL Neon. Não criar tenant Clerk/Auth0 nem depender de autenticação da produção. Fixar versão e lockfile após verificação de compatibilidade e segurança. A proposta ainda não está implementada.
- Manter os utilizadores, os seis perfis e as associações clínicas existentes como fonte de autorização. As tabelas técnicas do fornecedor ficam num schema `auth_test` separado; `users.auth_subject` liga a identidade autenticada ao utilizador existente. Não duplicar cadastro de negócio.
- Criar papéis técnicos separados: migrador temporário com DDL limitado aos schemas de teste, runtime sem DDL/sem superuser/sem acesso a outras bases e leitor de verificação. O runtime só pode executar as operações explicitamente necessárias. Não usar o proprietário Neon como credencial da aplicação.
- Ligação TLS obrigatória, pool limitado e credenciais próprias no gestor de segredos do projeto novo. Não puxar `.env` de projetos existentes, não colocar tokens no browser, Git, relatórios ou artefactos.
- Browser e APIs na mesma origem. Reutilizar account/session/authorization existentes, adaptando o contrato real Better Auth e o encaminhamento. Sem token proxy no cliente, sem origens globais ou wildcard. Cookies HttpOnly/Secure/SameSite, validação CSRF/Origin no servidor.
- Retirar a dependência de Blob/Financeiro da identidade antes de configurar o backend. Sem Blob, uploads ou autoresponders nesta primeira fase; endpoints financeiros e escritores RH, Operação Diária e Stock ficam bloqueados.
- Recuperação de palavra-passe: entrega numa caixa de email de testes isolada, nunca em logs ou resposta pública da API. Proposta concreta: Mailtrap Email Testing, inbox `grupo-saude-v4-grupo1-testes`, em plano gratuito se elegível, com destinatários sintéticos e sem envio para terceiros. Confirmar quotas e contrato antes da configuração. Se exigir subscrição, domínio ou pagamento, interromper antes de contratar e apresentar alternativa.

## Recursos e operações abrangidos pelo pedido de autorização

1. Criar somente os dois projetos novos acima e a caixa SMTP de testes gratuita, se disponível.
2. Configurar Better Auth exclusivamente no novo backend e criar seis contas de teste, uma por perfil, mais duas contas sintéticas para concorrência e associação multiclínica. Inscrição pública desativada; criação de contas pelo processo controlado de seed.
3. Gerar credenciais exclusivas e segredo de sessão, com origens e destinos exatos. Configurar apenas o projeto novo. Não enviar nem pedir segredos na conversa.
4. Preparar scripts de migração versionados e listar o SQL exato, checksum e ordem antes da execução. A autorização do plano abrange apenas a execução destes scripts revistos na base nova vazia e em PostgreSQL local descartável; qualquer alteração de escopo exige nova autorização.
5. Reutilizar `db/schema.sql` e selecionar só as migrações necessárias de permissões, limites de autenticação, clínicas e auditoria; não executar automaticamente todas as migrações financeiras/Gmail/Stock. Sem DDL nas rotas HTTP, sem migração automática no arranque.
6. Semear clínicas e utilizadores fictícios; limitar as primeiras escritas a permissões autorizadas e dados administrativos das clínicas. Não importar documentos, colaboradores ou pacientes reais.
7. Publicar preview integrado separado, com manifest de commit e testes reais de ponta a ponta. Preservar o preview demonstrativo atual.
8. Reversão: desativar este backend, revogar apenas os seus segredos e contas, eliminar apenas recursos novos depois de preservar relatórios sanitizados. Nenhum rollback sobre produção.

## Custos e limites

Orçamento proposto: 0 EUR de novos custos recorrentes, usando apenas quotas gratuitas ou já incluídas na conta atual. Isto é um objetivo, não uma cotação verificada nem uma garantia de elegibilidade.

| Componente | Previsão | Condição antes de criar |
|---|---|---|
| Better Auth | Sem licença SaaS; usa compute/base do projeto | Confirmar licença e versão do pacote selecionado |
| Neon novo | 0 EUR se o plano gratuito permitir novo projeto e carga de teste | Confirmar quotas de projetos, compute, armazenamento, retenção e disponibilidade regional |
| Vercel novo | 0 EUR adicional se incluído na conta e uso elegível | Confirmar elegibilidade do plano, proteção, funções e limites; não mudar subscrição |
| Caixa SMTP sandbox | 0 EUR se existir plano gratuito adequado | Confirmar destinatários, quotas e proteção; não contratar plano pago |
| GitHub Actions | Sem custo adicional dentro da quota disponível | Confirmar minutos/armazenamento; limitar execução e retenção de artefactos |

Não criar recurso pago, ativar cobrança por consumo, mudar plano ou aceitar custo incerto. Se a conta atual não permitir este desenho sem custo adicional, apresentar custo real e pedir aprovação específica antes de prosseguir. Referências a consultar: https://neon.com/pricing, https://vercel.com/pricing, https://www.better-auth.com/, https://mailtrap.io/pricing/.

## Riscos e mitigação

- Contrato do fornecedor: os handlers atuais usam formato Better Auth/Neon mas o harness usa fornecedor fictício; validar cookies, origens, revogação e reset no SDK real, sem assumir equivalência.
- Migrações/privilégios: rever dependências SQL e grants; ensaiar antes numa base descartável. Nunca reutilizar nomes de conexão/credenciais existentes.
- Permissões/cache: carregar permissões e clínicas no servidor, negar por omissão e invalidar após alterações. Não aceitar role, userId ou clinicId do corpo como prova de acesso.
- Concorrência: versões/revisões, transações e conflitos explícitos; provar que duas sessões/dispositivos leem o mesmo estado persistido.
- Email/reset: destinatários sintéticos autorizados, tokens de utilização única/expiração, resposta neutra para email desconhecido, revogação de sessões conforme política. Não expor links de reset em artefactos.
- Preview: proteção de deployment não substitui login/permissões da aplicação. Testes automáticos usam acesso restrito sem publicar segredo de bypass.
- Git local: checkout superficial importado com evidências binárias marcadas skip-worktree e alguns blobs ausentes localmente. Preservar todos os hashes na árvore do checkpoint, sem remover entradas. Um clone completo do GitHub é necessário para recuperar a cópia integral destas evidências; o pacote local de recuperação não as substitui.

## Blocos de implementação e critérios de aprovação

A. Preservar checkpoint Git e recuperar checkout completo; separar identidade das dependências financeiras; preparar configuração negada por omissão, adapter Better Auth e testes locais. Nenhuma configuração remota nesta etapa.
B. Depois da autorização: confirmar quotas/custos e criar os recursos novos; executar apenas SQL revisto; semear identidades sintéticas e testar login, palavra-passe incorreta, expiração, logout, recuperação e revogação em dois contextos.
C. Ligar perfil/permissões/clínicas aos serviços canónicos. CEO/Administração editam apenas ações autorizadas; restantes perfis leem o âmbito concedido. Testar concessão e remoção, multiclínica, inativação e tentativa de escalar privilégios.
D. Provar persistência: utilizador A edita clínica; utilizador B autorizado consulta noutra sessão/contexto; reiniciar backend e voltar a consultar; utilizador sem âmbito recebe negação. Testar concorrência e integridade de auditoria.
E. Executar npm test/build, PostgreSQL, API, testes de segurança, Chromium para seis perfis em três tamanhos/dois temas e regressão por pixels da demonstração. Só aprovar após resultados efetivos no Actions. Separar testes locais, harness e deployment remoto nos relatórios.
F. Publicar preview integrado, fornecer URL/commit/resultados e matriz central versus demonstrativa. Grupo 1 só concluído após as provas remotas acima; não alargar escritores a outros módulos neste bloco.

## Matriz de ligação central atual e alvo deste bloco

| Funcionalidade | Estado no commit base | Alvo autorizado após aprovação específica |
|---|---|---|
| Login/identidade/perfil | Harness SQL descartável com fornecedor fictício; preview estático indisponível | Better Auth real + Neon novo |
| Sessões/expiração/logout | Validados isoladamente, não operacional remoto | Cookies e sessões centrais reais de testes |
| Recuperação/revogação/auditoria de sessão | Recuperação real pendente; parte da revogação exercitada no harness | Fluxo real com SMTP sandbox e duas sessões |
| Permissões/associações clínicas | Servidor testado no harness; editor demo local | Consulta e alterações centrais com controlo por ação |
| Clínicas: consulta/edição administrativa | Leituras autenticadas no harness; editor demo | Leitura/escrita Neon, concorrência e auditoria |
| Documentos clínicos/Stock | Serviços SQL sintéticos testados; preview demo | Preservados; uploads/escritores remotos desativados neste bloco |
| RH/férias/ponto/desempenho | Demonstração, serviços centrais parciais | Preservados como demonstrativos, explicitamente identificados |
| Financeiro/faturas/recibos | Demonstração e serviços isolados parciais | Preservados; sem ativação operacional neste bloco |
| Operação Diária/pedidos/tarefas/Chat | Demonstração; central incompleta | Preservados, sem escritores reais |
| Tabelas/email/automação/notificações globais | Demo e adaptadores preparados | Só identidade/permissões entram neste bloco; restantes continuam identificados como demo/preparados |

## Autorização concedida e condições ainda pendentes

Os recursos e operações limitados acima estão autorizados com orçamento adicional de 0 EUR, sem planos pagos e sem alteração de recursos existentes. Quotas efetivas Vercel e acessos Neon/Mailtrap ainda não confirmados. Se quotas/preços/SMTP/proteção impedirem este limite, parar a criação afetada e apresentar alternativa/custo antes de continuar. Better Auth não instalado; backend operacional não implementado. Consultar RECUPERACAO-AMBIENTE-GRUPO-1.md antes de retomar.
