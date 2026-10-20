# Stock — empresas fornecedoras independentes do CEO

Base validada: `7d7ab3f`. Branch `dev/v4-stabilization-20261017`, PR #13 draft. Requisito corrigido: https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6296132772 (substitui a interpretação de fornecedor interno no comentário 6296103522).

## Auditoria anterior à implementação

Já existiam fornecedores por clínica, produtos, preços/custos de stock, pedidos, aprovação, encomendas, receções parciais, lotes/validades, movimentos auditados, revisão CAS e idempotência. Não existiam entidade comercial independente reservada ao CEO nem registo de entrega separado da receção. Não se criaram novos módulos de inventário, pedidos, encomendas, contas correntes ou tabelas de clínicas.

O cadastro geral de fornecedores e os fluxos anteriores mantêm-se. As empresas independentes usam uma área **Stock → Empresas fornecedoras — CEO**; as encomendas continuam nos mesmos `stock_ledgers` e os pedidos nas mesmas listas. Uma empresa não é uma clínica, não é o Grupo Saúde nem uma pessoa singular. Nenhuma empresa real foi cadastrada automaticamente.

Backup privado da base verificado fora do Git: `/workspace/supplier-company-checkpoint-20261020/base-7d7ab3f.tar`, SHA-256 `557e46679ba63c17e0c388a5ccfb5241d5d1ca5248ad60179978d861c7133cc2`.

## Separação de dados e acesso

- Cadastro privado em `app_settings` na chave `stock_supplier_companies_v4`: empresas, NIF, contactos, informação fiscal, catálogo próprio, preços de aquisição, preços indicados de venda, notas, referências documentais e histórico. Sem tabela empresarial duplicada.
- Apenas CEO efetivo, ativo e com gestão de Stock: não basta conceder permissões a Administração ou outro perfil. Sessões revogadas/inativas, impersonação de servidor, modo de leitura e CEO simulado são recusados.
- A API só aceita identidade proveniente do contexto autenticado do servidor; `role`, `actor` e `currentUser` enviados pelo cliente não concedem acesso. O endpoint permanece bloqueado por omissão, em produção e sem configuração autenticada isolada.
- A clínica recebe uma projeção permitida dos produtos disponibilizados àquela clínica. Aquisição, margens, notas fiscais, clientes e documentos privados não são copiados para o ledger clínico.
- O preço na encomenda é o preço de venda disponibilizado à clínica e fixado na criação. Custos clínicos mantêm a permissão `stockCosts`; não são os custos internos de aquisição da outra empresa.
- O catálogo comercial liga-se a produtos **já existentes** no inventário da clínica. Não cria outra ficha clínica para o mesmo produto. Alterações da oferta não reescrevem encomendas anteriores.
- A listagem SQL genérica de configurações exclui a chave privada, incluindo no acesso genérico CEO. Os eventos globais registam ação/revisão/referência, sem conteúdo comercial privado. O histórico comercial completo fica no cadastro reservado.
- No preview sintético, o adaptador público remove o cadastro privado das suas respostas. Restauro de backups com empresas exige CEO; respostas dos backups a outros perfis não expõem o conteúdo privado. Isto não transforma `localStorage` em armazenamento seguro: nunca introduzir dados comerciais reais no preview.

## Fluxo único

1. CEO cria empresa independente e o seu produto comercial.
2. CEO disponibiliza o produto a uma ou várias clínicas, ligando-o ao produto de stock existente e indicando o preço de venda autorizado.
3. Clínica cria pedido pelo formulário existente. Aprovação do pedido é um ato de aquisição da clínica; não concede acesso à gestão comercial da fornecedora.
4. CEO gera a encomenda no ledger existente, aprova, prepara e regista expedição.
5. **Marcar como entregue** regista quantidades, lote, validade, guia/referência, observações públicas, data/hora e autor. Não cria existências nem movimentos de entrada.
6. **Confirmar receção desta entrega** permite aceitar quantidades e registar material recusado/em falta, com justificação obrigatória para divergências. Apenas a quantidade aceite entra em stock, com autor, data e histórico.
7. Entregas parciais ficam pendentes; material recusado pode ser reposto em nova entrega. Não se permite receber mais que o entregue ou voltar a contabilizar uma entrega já conferida, mesmo com nova chave de envio.

Idempotência e revisões protegem repetições; as transações CAS mantêm stock/auditoria atómicos e impedem pedidos/encomendas contra uma oferta alterada durante a gravação. Cancelamentos não apagam entregas ou receções. As receções anteriores de fornecedores convencionais e transferências entre clínicas permanecem no fluxo original.

## Estado e limites

| Área | Disponível nesta alteração | Ainda pendente |
|---|---|---|
| Empresas e catálogo próprio | Criar/editar/desativar; identificação, aquisição/venda e ofertas por clínica; exclusivamente CEO | Cadastro de empresas reais apenas num ambiente autenticado validado |
| Pedidos e encomendas | Reutilizados; ligação à empresa/produto e histórico | Integração fiscal/contabilística externa |
| Preparação, expedição, entregas | Registos explícitos e entregas parciais | Integrações de transportadoras, se futuramente aprovadas |
| Receção e divergências | Aceitação/recusa parcial, reposição e stock só após confirmação | Nenhum envio automático ou entrada fictícia |
| Documentos | Referências reservadas, validação de associação no servidor e segregação dos documentos clínicos | Upload/descarga privados, verificação, retenção e faturação fiscal continuam desativados até infraestrutura validada |
| Persistência e permissões | Domínio/API partilhados; testes PostgreSQL descartáveis | Preview continua sintético/local, sem autenticação/persistência central reais ativadas |

## Testes

- `tests/supplier-companies.cjs`: seis perfis, CEO efetivo/simulado, duas empresas, publicação por clínica, preços privados, pedido/encomenda, entrega sem stock, receção parcial, recusa, reposição, replay e histórico.
- `tests/supplier-companies-postgres.cjs`: API e PostgreSQL descartável, duas empresas, seis atores, persistência entre utilizadores, dados/documentos privados, fronteiras clínicas, concorrência, oferta alterada e atomicidade. Sem alterar contas correntes.
- `tests/supplier-companies-browser.py`: seis perfis × computador/tablet/telemóvel × claro/escuro; interface CEO, pedido por clínica, marcação de entrega, conferência, divergências, reposição, persistência demonstrativa e simulação pelo CEO.
- As suites anteriores de abertura, Stock/Tabelas, RH, Reclamações, recrutamento, Financeiro e Marketing continuam ativas.

Só considerar aprovados os cenários com resultados efetivos no GitHub Actions do commit entregue. Nenhum teste usa uma empresa, documento, credencial ou base de dados de produção. O relatório de entrega inclui o run e o preview READY verificados.
