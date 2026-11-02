# Tarefa 16 — declarações automáticas RH

## Âmbito e auditoria

Base preservada: `7bc53762` / código `e6129741`, branch `dev/v4-stabilization-20261017`. PR #13 mantém-se em rascunho. Nenhuma alteração à main, produção, serviços externos ou bases reais.

Reutilização: `hr-portal-core-v4.js` (pedidos, versões, permissões, revisões, idempotência e auditoria), `hr-portal-ui-v4.js` (Documentos e regulamentos/backoffice), `employee-documents-core-v4.js` (identidade), `payroll-export-core-v4.js` (vigências e conferência), `attendance-core-v4.js` (horários/escala), `finance-core-v4.js` (PDF A4, imagem e serialização). Não foi criada uma segunda tabela de pedidos, contratos, documentos ou colaboradores.

## Matriz dos modelos

| Modelo | Origem adicional à identificação/entidade contratual | Situação |
|---|---|---|
| Antiguidade | Admissão e data de referência | Rascunho automático |
| Assiduidade | Conferência existente de ponto/ausências validadas | Rascunho; divergências bloqueiam conferência |
| Cessação de vínculo | Data efetiva, enquadramento e conferência na ficha RH | Rascunho; nunca infere cessação de fim previsto |
| Experiência profissional | Admissão e atividades confirmadas na ficha | Rascunho automático |
| Funções | Profissão e atividades; não usa perfil de acesso como profissão | Rascunho automático |
| Férias | Datas aprovadas no módulo existente | Rascunho; sem datas aprovadas fica A validar |
| Horário de trabalho | Escala/horário efetivo de cada dia selecionado | Rascunho automático |
| Horário para creche/escola | Mesmo horário efetivo, finalidade indicada | Rascunho automático |
| Remuneração | Versão contratual confirmada na referência | Rascunho automático |
| Vínculo e remuneração | Contrato e remuneração com vigência | Rascunho automático |
| Vínculo laboral | Contrato confirmado e admissão | Rascunho automático |
| Vínculo laboral para creche | Mesmo vínculo, finalidade indicada | Rascunho automático |

Informação inexistente aparece «A validar»; permite rascunho, impede conferência. Prestação de serviços não é apresentada como vínculo laboral validado. A entidade vem do contrato confirmado, nunca da empresa de faturação nem por inferência da clínica operacional. Gestores podem consultar histórico de colaboradores inativos; isso não ativa contas.

## PDF e circuitos

- PDF real A4, texto PT-PT/WinAnsi, logótipo oficial preservado; exportações financeiras anteriores mantêm comportamento.
- Todos os PDFs são `RASCUNHO — NÃO ASSINADO`. Rodapé obrigatório uma única vez, na última página: Local em branco, Data em branco, O Gerente, Assinatura em branco.
- Período/referência são critérios de dados, não datas de assinatura. Não existe segunda data de emissão/assinatura no rodapé. Na impressão HTML, desativar os cabeçalhos/rodapés automáticos do navegador; o PDF descarregado não os acrescenta.
- Pedir → conferir RH com hash → aprovar por gerente autorizado → assinatura externa. Conteúdo alterado na origem exige repetir conferência e aprovação.
- Registo de conferência do original manuscrito separado, com data efetiva e referência; não transforma o rascunho em PDF assinado.
- Emissão eletrónica final bloqueada: não existe fornecedor de assinatura verificável nem arquivo privado configurado. Indicadores/eventos locais não são emails enviados.
- Os 12 modelos têm corpo automático protegido e complemento institucional versionado por clínica; os modelos livres anteriores continuam disponíveis. Pedidos preservam a versão original, incluindo os criados antes de personalizar um modelo.

## Ficheiros

- `hr-declarations-core-v4.js`: catálogo e projeções sem nova fonte de dados.
- `hr-declarations-ui-v4.js`: pesquisa, pré-visualização, PDF, impressão, pedidos, conferência/aprovação e versões.
- `hr-portal-core-v4.js`, `hr-portal-ui-v4.js`, `lib/hr-portal-service.js`: integração e validação no domínio/API existente.
- `finance-core-v4.js`: modo de declaração no exportador partilhado.
- `hr-master-v4.js`: origem editável das funções e cessação efetiva, com histórico existente.
- `styles.css`, `index.html`: apresentação e carregamento.
- `tests/hr-declarations.cjs`, `tests/hr-declarations-pdf.py`, `tests/hr-declarations-browser.py`, `tests/hr-portal-postgres.cjs`, workflow e package.json: validação.

## Testes e limitações

Local: npm test e build aprovados; 397 verificações específicas; 73 PDFs analisados por pypdf, incluindo paginação, A4, PT-PT e assinatura/data única. A execução Chromium e PostgreSQL será registada com o resultado efetivo do GitHub Actions antes de aprovação.

Preview exclusivamente sintético/local ao navegador, sem autenticação central, partilha entre dispositivos ou arquivo privado operacional. O serviço autenticado mantém-se bloqueado por configuração e ambiente; testes API/PostgreSQL isolados não provam operação real em produção. A integração de assinatura, envio e armazenamento exige configuração e validação externas. Os glifos fora de WinAnsi são rejeitados explicitamente na geração PDF, sem substituir silenciosamente caracteres; impressão HTML preserva Unicode. A revisão jurídica dos textos continua necessária. Chromium tátil não é um Android físico.
