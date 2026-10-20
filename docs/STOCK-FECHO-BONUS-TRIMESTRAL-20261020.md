# Stock, fornecedores, fecho e bónus trimestral — 20/10/2026

Branch exclusiva: `dev/v4-stabilization-20261017`; PR #13 permanece em rascunho. Base preservada: `c58721e`. Correção prevalente: [6300978060](https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6300978060), que revoga movimentos financeiros diários e taxa na ficha do produto.

## Auditoria e consolidação

| Fluxo | Antes | Alteração |
|---|---|---|
| Empresas fornecedoras independentes | Implementado, CEO efetivo; simulação bloqueada | Reutilizado; ligação do fornecedor à empresa existente, sem nova entidade comercial |
| Encomendas, entregas parciais e divergências | Implementado | Entrada prevista na aceitação; só receção física incrementa existências |
| Vários fornecedores por produto | Em falta | Preços EUR, validade, preferencial e histórico na ficha existente; preço congelado na encomenda |
| Consumo diário | Movimentos Stock individuais | Tarefa obrigatória no motor existente, todos os produtos/lotes, incluindo zero; gravação atómica |
| Vendas por técnico | Endpoint legado `technician-sales` gerava bónus diário | Escrita antiga bloqueada; consulta/histórico preservados. Novos registos no `clinic_days` existente |
| Prémio por unidade | Campo RH `hr.bonusAmount` já existente | Campo reutilizado e rotulado; snapshot individual. Falta de taxa não é convertida implicitamente em zero |
| Bónus trimestral | Movimento manual `Bónus` e verificação antiga de baixas do trimestre atual | Agrega vendas do trimestre escolhido ao mesmo movimento, discrimina outras componentes e exige aprovação |
| Elegibilidade | Verificação local de baixas, sem apuramento de vendas | Trimestre terminado, admissão até início, baixas >30 dias excluem; dias sobrepostos contados uma vez |

A integração PostgreSQL detetou e corrigiu também a conversão de datas SQL no Financeiro: o driver pode devolver objetos `Date`; agora são normalizados para ISO, sem cortar o texto do dia da semana.

Não foram apagadas tabelas, documentos, registos financeiros, históricos ou dados de candidaturas. O escritor financeiro diário contraditório foi desativado; movimentos históricos diários NÃO foram automaticamente convertidos, estornados ou incluídos no trimestre, pois isso exigiria reconciliação para evitar dupla contagem.

## Fontes únicas e comportamento

- `stock-core-v4.js`: produtos, fornecedores, preços, encomendas, entradas previstas e movimentos no ledger existente.
- `stock-closing-v4.js`: regras partilhadas de consumo e vendas; dados guardados em `clinic_days.data.stockClosing`, sem tabela de comissões nem lançamento diário.
- `operation-core-v4.js` / `app.js`: duas tarefas obrigatórias de fecho, formulário único e bloqueios do fecho. Sem produtos aplicáveis: tarefa concluída sem movimento. Dias históricos já fechados antes da introdução destas tarefas não ficam retroativamente bloqueados; não são criados consumos/vendas históricos.
- `lib/operation-service.js`: persistência atómica de dia e Stock, comparação de revisões e snapshots RH; autor vem da sessão.
- `finance-demo-v4.js` / `lib/finance-service.js` / `lib/quarterly-bonus-service.js`: apuramento no movimento trimestral existente; outras componentes são preservadas. Duplicação por colaborador/trimestre bloqueada.
- `finance-ui-v4.js`: detalhe legível por dia, clínica, produto e técnico; valor observado e parcela elegível discriminados.

O consumo total inclui as vendas. A validação exige vendas <= consumo do produto e aplica uma única baixa de stock. Correções exigem justificação, repõem apenas o consumo anterior e aplicam o novo total, conservando movimentos e histórico. A taxa histórica é preservada. Reaberturas tornam o apuramento pendente; aprovação/pagamento bloqueados até reapuramento do mesmo movimento. Movimentos com pagamentos não são editados automaticamente.

## Segurança e limites

A consulta operacional e o respetivo histórico ocultam taxas e montantes individuais a perfis sem gestão financeira; a evidência original mantém-se armazenada e disponível no apuramento autorizado. Replays continuam sujeitos às permissões efetivas atuais.

O preview é sintético/local, não é um backend partilhado nem prova de autenticação real. Os testes API/PostgreSQL usam exclusivamente o serviço efémero do GitHub Actions (`gs_v4_synthetic`); escritores reais continuam desativados. Não foram criados recursos remotos, usadas credenciais reais ou executadas migrações em bases existentes.

O servidor usa as datas de baixa dos documentos RH existentes; documentos de baixa sem datas bloqueiam o apuramento. A validação de completude das ausências e do vínculo RH na integração central continua necessária antes de utilização real. Admissão em falta bloqueia elegibilidade, sem inventar datas. O trimestre em curso permite registo de vendas, mas não lançamento antecipado do bónus.

Uploads privados, retenção/fiscalidade da empresa e autenticação/persistência central do preview permanecem pendentes da infraestrutura já identificada. Não se apresentam documentos ou emails simulados como reais. Moeda atualmente suportada: EUR. Produtos/lotes históricos desativados podem exigir revisão antes de correção de consumo; não são apagados.

## Verificação

- `npm test`: sintaxe, regressões existentes e doze cenários de domínio específicos.
- `npm run build`: pacote estático sem backend, segredos ou documentos privados.
- `tests/stock-closing-postgres.cjs`: Stock + dia na mesma transação, concorrência, seis perfis, isolamento clínico, apuramento único, aprovação e bloqueio de pagamento desatualizado.
- `tests/stock-closing-browser.py`: controlos reais, seis perfis × três formatos × dois temas; guardar, corrigir, recarregar, fechar e discriminar bónus.
- Workflow: `.github/workflows/v4-stabilization.yml`. Os resultados efetivos do commit final são comunicados na entrega; preparação local não equivale a aprovação no GitHub Actions.
