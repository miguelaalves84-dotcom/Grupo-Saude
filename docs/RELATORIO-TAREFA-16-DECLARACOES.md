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

Local: npm test e build aprovados; 398 verificações específicas; 73 PDFs analisados por pypdf, incluindo paginação, A4, PT-PT e assinatura/data única. GitHub Actions concluído: **52/52 jobs aprovados**, zero falhas, no código `979c5674995bf52fc41ef9e8d4b46c0cf68365fb`. Chromium: **2 220 verificações**, seis perfis × dois temas × computador/tablet/telemóvel; geração, pesquisa, limpeza, casos vazios, pré-visualização, downloads reais, impressão e pedidos. PostgreSQL isolado: pedidos entre identidades, fontes consultadas no servidor, IDOR/permissões, conferência, aprovação e assinatura manuscrita distinta; emissão digital bloqueada.

Preview exclusivamente sintético/local ao navegador, sem autenticação central, partilha entre dispositivos ou arquivo privado operacional. O serviço autenticado mantém-se bloqueado por configuração e ambiente; testes API/PostgreSQL isolados não provam operação real em produção. A integração de assinatura, envio e armazenamento exige configuração e validação externas. Os glifos fora de WinAnsi são rejeitados explicitamente na geração PDF, sem substituir silenciosamente caracteres; impressão HTML preserva Unicode. A revisão jurídica dos textos continua necessária. Chromium tátil não é um Android físico.


## Entrega verificada

- Código publicado: `979c5674995bf52fc41ef9e8d4b46c0cf68365fb`.
- Implementação: `d3c2c5f1`; correção do YAML: `070c849b`; correção de integridade JSONB e notificações: `979c5674`.
- [GitHub Actions — execução efetiva](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41536536363).
- [Capturas, PDFs sintéticos e matriz Chromium](https://github.com/miguelaalves84-dotcom/Grupo-Saude/actions/runs/41536536363/artifacts/13184002502), disponíveis até 16/11/2026.
- [Resultados estruturados](RESULTADOS-TAREFA-16-DECLARACOES.json).
- Preview protegido **READY**, deployment `dpl_J3wK4R17p6N1QMfwKsddKR5Cfwmx`: https://grupo-saude-v4-validacao-sintetica-ja9t4ggfw-grupo-saude.vercel.app
- HTTP 200 autenticado em `/`, `/api/version` e sete módulos/estilos alterados; comparação integral do conteúdo servido com o build testado. Manifesto confirma o SHA e capacidades desativadas. Não foi confundida uma página de autenticação Vercel com a aplicação.
- Acesso: Meu RH → Documentos e regulamentos → Modelos de declarações. Gestão: Recursos Humanos → Documentos da empresa e declarações → Modelos de declarações.
- A origem do novo preview é diferente: dados guardados no navegador de previews antigos não são transferidos automaticamente. Nenhum deployment antigo foi apagado.

## Problemas encontrados e resolvidos

1. O exportador antigo simplificava acentos. O modo A4 de declaração usa WinAnsi e mantém o comportamento das exportações anteriores.
2. JSONB altera a ordem das propriedades; a primeira execução PostgreSQL detetou uma falsa divergência na conferência. Reutilizada a função canónica partilhada do projeto; o teste reordena chaves e confirma que alterações efetivas continuam bloqueadas. A execução final PostgreSQL passou.
3. O estado de assinatura manuscrita tinha de concluir a pendência da gestão e notificar o colaborador. Foi integrado no sistema de atenção existente, com acesso ao pedido e sem apresentar assinatura eletrónica ou email fictício.
4. Uma instrução YAML com `:all:` precisava de aspas; foi corrigida antes da execução final aprovada. Não houve alteração funcional nesse commit.

## Segurança e validação ainda necessária

Verificados os ficheiros enviados e o pacote estático: sem padrões de credenciais reais, .env, bases de dados, caches ou documentos privados. A main mantém `84fba5a2d6d7afcb0723ca312f4e617acc22823d`. PR #13 em rascunho. Configuração/proteção dos projetos Vercel mantida, sem produção, migrações ou serviços reais ativados.

Ficam pendentes: revisão jurídica dos textos, assinatura digital qualificada/adequada e verificável por fornecedor validado, arquivo privado, notificações reais e ligação autenticada operacional entre dispositivos. A aprovação de um gerente e o registo de papel não substituem esses serviços. Validação física do novo fluxo PDF/impressão num tablet Android ainda deve ser feita pelo utilizador; os testes Chromium são emulação.
