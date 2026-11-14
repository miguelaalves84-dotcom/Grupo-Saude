# Entrega — comprovativos de Caixa, ficha RH e Agenda

Implementação dos comentários [6371917460](https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6371917460) e [6372021603](https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6372021603).

- Branch: `dev/v4-stabilization-20261017`; PR #13 mantido em rascunho.
- SHA de código/testes efetivamente aprovado: **`0d9533f1beaa358ee45270b16cefb2b392c0d444`**.
- [Preview READY protegido](https://grupo-saude-v4-validacao-sintetica-53w955ux8-grupo-saude.vercel.app).
- Deployment: `dpl_3FwpyhpvUnZPZXnM8gpmfQEhaQnw`, target `staging`; SSO existente mantido.
- [GitHub Actions — 33/33 jobs aprovados](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40034552514): regressão/build, PostgreSQL descartável e 31 suites Chromium.
- [Manifesto da publicação](https://grupo-saude-v4-validacao-sintetica-53w955ux8-grupo-saude.vercel.app/preview-manifest.json).

## Resultado dos três trabalhos

| Trabalho | Implementação efetiva | Limites |
| --- | --- | --- |
| Comprovativos de Caixa | Corrigido o `Failed to fetch`; bytes recuperados e validados diretamente do arquivo local existente. JPEG, PNG e PDF abrem/descarregam após reload e substituição, conservando versões e histórico. | Apenas ficheiros sintéticos no navegador; arquivo privado central não operacional. |
| Ficha do colaborador | Auditoria de fontes, reorganização de campos existentes, único gravador principal, conservação de contratos/especialidades históricos e auditoria antes/depois. Inventários e correções abaixo. | Não constitui migração central nem certificação jurídica; há validações anuais próprias e oportunidades de consolidação identificadas. |
| Agenda administrativa | Dia/semana/mês, criar/editar/reagendar/cancelar, filtros, conflitos com confirmação, histórico e notificações no centro existente. Permissões na UI, domínio e API; serviço PostgreSQL isolado testado. | UI do preview usa persistência local sintética; a API central permanece desativada, sem sincronização entre dispositivos ou integrações externas. |

## 1. Caixa — causa raiz e correção

O preview anterior `9971cca` serve `connect-src 'self'`. O handler fazia `fetch(file.dataUrl)` sobre `data:application/pdf;base64,...` ou uma imagem: esse pedido é bloqueado pela CSP, produzindo `Failed to fetch`. O CI anterior servia o build por HTTP sem a CSP imposta pela Vercel, pelo que as 444 verificações não representavam essa condição de publicação.

Foi confirmada a política do deployment anterior por HTTP protegido e criada uma regressão que aplica a mesma CSP. O teste antigo de `fetch(data:...)` provoca e verifica uma violação de `connect-src`; a operação corrigida funciona sem alargar a política.

- `GSFinanceCore.documentBytes` valida MIME, assinatura binária e tamanho e descodifica base64 diretamente. `FinanceUIV4` cria o Blob com esses bytes, sem pedido de rede ao URL `data:` ou a uma API central inexistente.
- Reutilizados `fileStore`/IndexedDB e fallback local existentes. Mantidos IDs, associações à folha/clínica/dia, valores de depósito, hashes, versões, referências textuais e histórico. Sem migração destrutiva ou segunda infraestrutura.
- O acesso ao ficheiro é novamente limitado à folha/clínica autorizada; checksum verificado antes da consulta. Ausência dos bytes produz uma mensagem em português que distingue metadados de ficheiro disponível.
- A consulta/download continua a invalidar-se perante mudança de sessão. URLs Blob temporários são revogados ao fechar; PDF mantém isolamento sem permissão para executar scripts do anexo.
- Testes usam um PDF válido, PNG descodificável e JPEG sintético gerado por canvas. Verificam dimensões efetivamente descodificadas, bytes descarregados, versões anteriores, navegação e reload, sob a CSP do preview.

**Limite de origem:** o formato local anterior continua compatível, mas o navegador separa armazenamento por origem. Abrir um novo URL de preview não transfere automaticamente os ficheiros guardados no URL anterior. Não se apagou nem se leu externamente esse arquivo. A partilha/migração entre dispositivos/URLs requer um mecanismo próprio e seguro; não é apresentada como já existente. Não carregar comprovativos reais em nenhum destes previews.

## 2. Auditoria completa da ficha — inventário e correções

- [Auditoria campo a campo e proposta antes/depois](RH-FICHA-AUDITORIA-20261023.md).
- [56 campos/conceitos do formulário principal](RH-FICHA-INVENTARIO-20261023.json): fonte canónica, consumidores, permissões, vigência, validação, persistência e histórico.
- [147 campos/projeções de áreas associadas](RH-FICHA-AREAS-ASSOCIADAS-20261023.json): capacidades, documentos, férias/baixas, ponto, escalas, formação, equipamentos, despesas, avaliações, permissões e conta corrente. Inventário não significa que cada campo corresponda a uma operação independente certificada.

| Problema confirmado | Correção |
| --- | --- |
| `V4HR.savePay` escrevia remuneração/alimentação/dependentes na raiz do colaborador e lia IDs ausentes do formulário atual. | Entry point preservado como adaptador para `HRMasterV4`; deixou de existir esse gravador remuneratório concorrente. Chaves antigas conservadas. |
| `V4HR.addLeave`/`editDoc` permitiam caminhos antigos de escrita livre; não foram encontrados consumidores de UI desses métodos. | Mantidos os nomes de compatibilidade, encaminhando para Férias/Documentos canónicos. Sem inserir uma ausência livre ou declarar documento recebido sem ficheiro. |
| Contrato, percentagens e faturação acabavam misturados no mesmo bloco Remuneração. | Movidos os mesmos nós, sem copiar inputs: contrato/vínculo/empregador; salário/alimentação/IBAN; atividade variável; faturação própria/empresa. |
| Percentagem global antiga concorria visualmente com regras versionadas de técnica/tratamento. | Conservada como referência histórica quando existem regras por categoria, sem segundo editor concorrente. Regras por categoria mantêm vigência própria. |
| Zero em remuneração/alimentação aparecia vazio. | `??` preserva zero e distingue ausência de informação; teste de guardar a ficha sem perder esses valores. |
| Contrato ausente/inativo no catálogo podia deixar a seleção em branco ao editar outro dado. | Opção histórica selecionada preservada; não arquivar requisitos documentais por não conseguir resolver esse contrato no catálogo. |
| Especialidades históricas fora do seletor ativo podiam desaparecer ao guardar. | IDs/nomes não editáveis pelo seletor ativo conservados, sem apagar associações antigas. |
| Resumo Financeiro repetia valores em inputs de consulta. | Vistas derivadas em texto, sem novo formulário de remuneração. |
| Auditoria da gravação concentrava-se nos dados profissionais. | Acrescentado antes/depois dos campos editáveis, preservando o formato anterior. Não duplicar bytes de documentos/fotografias nem dados médicos ocupacionais. |
| Uma chamada antiga podia indicar outro colaborador com um formulário aberto. | Validação de que o formulário pertence ao ID a guardar, além das permissões e proteção contra alteração concorrente/sessão. |

### O que não foi confundido nem eliminado

Perfil de acesso e profissão/especialidade continuam distintos. Tipo de contrato/checklist e vínculo jurídico confirmado não são fundidos. Empregador, empresa faturadora e respetivos NIF/IBAN são entidades diferentes. As vigências de salário, faturação e percentagens mantêm versões próprias. Horário habitual não substitui a escala aprovada do dia. Dependentes ficam em Dados Pessoais. Comprovativos da cédula/ERS continuam a referenciar o mesmo arquivo documental. Formação/equipamentos/despesas mantêm a gestão exclusiva CEO/Administração. Férias, baixas, documentos, avaliações, candidatos, capacidades técnicas e financeiro continuam nos domínios existentes.

Não se apagaram campos guardados, contratos, documentos, associações, movimentos, históricos ou espelhos de compatibilidade `users`/`employees`. Não se fez uma limpeza de base de dados.

### Pendências identificadas pela auditoria

- Formação anual mantém a validação de vínculo/IRCT e snapshot contratual; reutilizar automaticamente todos os dados contratuais já confirmados nesse processo é uma consolidação adicional, ainda não declarada concluída.
- Chaves/espelhos legados continuam guardados. Uma eliminação/migração central exige análise de conflitos por ID, backup, política de retenção e validação separada.
- Edição autenticada central e arquivo privado/documentos por empresa mantêm as limitações dos relatórios anteriores; não foram ativados neste bloco.
- Revisão jurídica/fiscal das regras laborais, formação, retenção e processamento não é substituída por testes de software.

## 3. Agenda — operações e acesso

[Política detalhada e arquitetura](AGENDA-ACESSOS-20261023.md).

| Perfil | Âmbito |
| --- | --- |
| CEO e Administração | Gerem agendas de CEO, Administração e Administrativas. Esta regra global é da Agenda e não alarga as permissões dos outros módulos. |
| Administrativa | Própria agenda pessoal e marcações das outras Administrativas nas clínicas comuns. Não acede a agendas CEO/Administração, a marcações pessoais de colegas ou a outra clínica de uma colega multiclínica. |
| Médico, Técnico, Call Center | Sem menu, domínio ou API, mesmo com concessão indevida. |

- Uma marcação tem um único destinatário e clínica, ou âmbito pessoal. Destinatário/clínica ficam fixos para impedir que o histórico de outra clínica seja revelado por reatribuição; para mudar o âmbito, cancelar e criar outra marcação.
- Dia/semana/mês, filtros por pessoa/clínica/estado, data/hora/duração/local/descrição, edição e reagendamento. `Europe/Lisbon`, transição de hora validada e fim à meia-noite exclusivo.
- Cancelamento com motivo, histórico anterior preservado e consultas posteriores. Conflitos de horário exigem confirmação explícita, sem revelar marcações fora do âmbito autorizado.
- Notificações de alterações por terceiros para o destinatário, reutilizando `GSAttentionCore`/`AttentionUIV4` e os contadores existentes; link abre apenas o registo autorizado. Sem emails fictícios.
- Revisão, idempotência e comparação de snapshot no servidor impedem duplicações/sobrescritas concorrentes. `clinics[]` canónico prevalece sobre aliases antigos.
- `api/agenda.js` reutiliza contexto autenticado existente, utilizadores/clínicas existentes, `app_settings` e `audit_log`; não cria tabelas nem executa migrações. Servidor fecha sem configuração isolada e recusa produção.

## Testes e evidências efetivas

| Verificação | Resultado final |
| --- | --- |
| Regressão, sintaxe e build | Aprovados no GitHub Actions; 97 assets no build estático, sem backend, documentos ou credenciais. |
| Comprovativos Chromium | **606 verificações, zero falhas**, seis perfis × três ecrãs × dois temas, incluindo casos de acesso proibido. JPEG/PNG realmente descodificados, PDF válido, bytes originais e versões recuperados após reload, CSP aplicada e mensagens para ficheiro local ausente. |
| Agenda/RH Chromium | **1 068 verificações, zero falhas**, 36 contextos. Operações reais, negações, multiclínica, conflitos, cancelamento, histórico, notificações, simulação CEO, unicidade de editores, acordeões, zero remuneratório e contrato histórico preservado. |
| PostgreSQL/API | Serviço descartável `gs_v4_synthetic` em loopback; seis perfis, negações por clínica e ator forjado, persistência entre utilizadores, CAS concorrente, cancelamento e auditoria. APIs testadas depois de um contexto de identidade sintético confiável; não representa autenticação central real validada de ponta a ponta. |
| Auditoria independente por perfil | **4 548 aprovadas, zero falhas; 180 casos não testáveis** por integrações externas ausentes. Navegação/formulários são separados dos fluxos mutáveis das suites dedicadas. |
| Revisão geométrica expandida | 12 contextos, 60 secções de referência, zero interseções visíveis. Dez interseções geométricas fora da zona recortada registadas como falsos positivos; 12 controlos negativos confirmam que o detetor rejeita uma sobreposição deliberadamente visível. Não se afirma comparação universal por pixels. |
| P0 | Endpoints sem recursos configurados e produção recusados; zero pedidos externos nos testes de isolamento. |
| Publicação | READY; manifesto, index e 14 assets principais mais `/api/version` obtidos por HTTP protegido e comparados byte a byte com o pacote. CSP idêntica à anterior. `/api/agenda` devolve 404 no preview estático, conforme manifesto `backend:false`. |

Auditoria geral por perfil (não somar de novo às suites dedicadas):

| Perfil | Aprovadas | Falharam |
| --- | ---: | ---: |
| Call Center | 618 | 0 |
| Médico | 594 | 0 |
| Técnico | 594 | 0 |
| Administrativo | 660 | 0 |
| Administração | 1 008 | 0 |
| CEO | 1 074 | 0 |

Capturas e JSON encontram-se nos artefactos do [run final](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/40034552514), com retenção de 14 dias: `finance-cash-browser-synthetic-0d9533f…`, `agenda-rh-browser-synthetic-0d9533f…`, auditorias e restantes suites. Incluem imagens da ficha por secção em tablet e abertura do JPEG. Os testes usaram Chromium emulado com viewport móvel/tablet e toque; não constituem teste num dispositivo físico Android. A validação manual do utilizador no tablet continua importante.

### Falhas intermédias e correções de testes

A execução inicial não foi aprovada: os exemplos de Agenda criavam sobreposições sem confirmação, um teste de percentagens procurava a antiga secção de Remuneração e a regra geométrica confundia recorte invisível com sobreposição visível. Exemplos e navegação foram corrigidos, e o detetor ganhou prova negativa explícita. Não foram ocultadas falhas nem usadas execuções canceladas como aprovação. A evidência de aprovação é exclusivamente o run final do SHA acima.

## Commits e ficheiros

- `3661bf2`: Agenda UI/domínio/API/serviço e regressões; ficha consolidada; bytes de Caixa sem `fetch(data:)`.
- `9a75acb`: conservação de contratos/especialidades históricos, âmbito canónico por clínica e testes corrigidos/reforçados.
- `71b5ffc`: notificações reutilizadas, abertura do registo e histórico autorizado.
- `0d9533f`: prova explícita de JPEG e documentação de fontes/âmbito. Código publicado corresponde a este SHA.

Principais fontes: `finance-core-v4.js`, `finance-demo-v4.js`, `finance-ui-v4.js`, `hr-master-v4.js`, `clinic-hr-architecture.js`, `agenda-core-v4.js`, `agenda-ui-v4.js`, `agenda-v4.css`, `api/agenda.js`, `lib/agenda-service.js`, políticas/navegação/notificações existentes e testes indicados nos inventários.

## Segurança, estado real e próximos passos

O preview continua local/sintético: sem base real, envio real, serviços de IA, sincronização entre dispositivos ou armazenamento privado central. Não foram criados recursos Neon/Mailtrap, credenciais, serviços pagos, domínios de produção ou migrações. Nenhum escritor de produção foi ativado.

`main` manteve `84fba5a2d6d7afcb0723ca312f4e617acc22823d`; projeto de produção manteve `updatedAt=1791725971672`. PR #13 em rascunho; sem merge nem force push. A cópia privada inicial dos 344 ficheiros foi comparada byte a byte (SHA-256 `23965d80415caf8387ac9fc4a9a02953a74d9ffb63c31e007fed2863893dd095`). A interrupção da primeira sincronização não perdeu alterações; os commits estão preservados no GitHub.

A [matriz dos 14 grupos](MATRIZ-14-GRUPOS.md) continua parcial. Próximos passos deste bloco: validação física no tablet do JPEG/PDF, ficha e Agenda; depois, decidir a continuação das pendências de consolidação ou da infraestrutura isolada. Não se avançou para outros módulos nem se ativou integração central.
