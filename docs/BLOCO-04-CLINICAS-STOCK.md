# Blocos funcionais — Clínicas e Stock

Branch fix/v4-p0-security-hardening-clinics-stock, desde 4a58d5e. Fonte aprovada, capturas e traces preservados em f342136. Plano global: matriz dos 14 grupos, sem apagar entregas anteriores.

## Clínicas

ClinicMasterV4 preserva nomes, contactos, GPS, ERS e ativação. O editor e catálogo único ficam em Administração do Sistema → Tabelas → Clínicas. Acrescenta horários, configurações administrativas/operacionais, requisitos documentais e histórico. Edição exclusiva CEO/Administração, com âmbito atribuído e deteção de revisão desatualizada. Gestão → Clínicas é consulta documental, com pesquisa, filtros, emissão/validade, versões, visualização/download e substituições pendentes. O original mantém-se até aprovação; versões antigas permanecem acessíveis conforme autorização. Nome de ficheiro legado sem bytes não é declarado documento validado.

## Stock

A auditoria desta branch não encontrou um módulo Stock anterior. Um só domínio e um só ledger por clínica, sem copiar tabelas clinics/documents/audit. Inventário, categorias, referências, unidades, localização, reservas, mínimos/máximos, lotes/validade; entradas, saídas, consumos, ajustes justificados e transferências; fornecedores, pedidos/decisões, encomendas multi-linha, receções parciais, compras/preços, documentos e histórico. Ajustes permitem abate de lotes expirados com motivo; consumo/transferência desses lotes fica bloqueado. Quantidades usam milésimos inteiros; preços são cêntimos.

API aplica contexto autenticado existente, não aceita identidade/permissões do corpo, bloqueia view-as em escrita e valida ambas as pontas de transferências. PostgreSQL bloqueia ledgers em ordem estável, grava estado e auditoria numa transação, e rejeita duplos movimentos/receções, saldo negativo e revisão desatualizada. Receipts pertencem ao ledger canónico; não há uma segunda tabela de movimentos concorrente. Documentos privados reutilizam documents e o store durável existente (scanner/backup obrigatórios para qualquer configuração externa).

Permissões Stock por ação são configuráveis na matriz global dos seis perfis; custos e documentos de compras têm permissões separadas. Alertas derivam dos registos, com contadores no menu e ficha, sem copiar ou aprovar assuntos no centro de notificações. Exemplos sintéticos são opcionais e não substituem inventários existentes.

## Provas e limitações

Run 38312002367: npm test/build, regressões existentes e 14 testes de PostgreSQL/HTTP aprovados; dois cenários por pixels (RH/Administração/mobile nos dois temas) e uma fixture Clínica não aprovados. Corrigir antes de declarar a consolidação validada; tolerância de pixels não foi aumentada. Stock GUI e novos anexos de compras ainda aguardam os seus resultados efetivos.

Browser usa localStorage explicitamente demonstrativo. O serviço SQL foi exercitado em PostgreSQL local descartável com provider de identidade simulado; isso não configura nem prova Neon remoto, fornecedor real, scanners/backup externos ou sessão operacional completa da UI. Nenhum writer real RH, Operação ou Stock foi ativado. Migrações são aditivas, com checksum e runner controlado; nenhuma execução em base remota. Backend prefix P0 e produção continuam bloqueados.

Preview: preparar apenas artefactos estáticos testados, sem APIs/env de produção. Publicação/hospedagem remota exige o plano e aprovação do utilizador; não há URL pública nova enquanto não for efetivamente criada.

## Diagnóstico visual comprovado

Os dois diffs RH/Administração/mobile estavam inteiramente no retângulo 0,0,354,210 do cabeçalho fixo que sobrepunha a captura do elemento após scrollIntoView. Análise local dos PNG: diferença abaixo da linha 215 = zero pixels. O conteúdo RH não mudou. O harness passa a medir a sobreposição na fonte imutável 4a58d5e e no candidato, excluir apenas esse overlay global da comparação do componente e publicar também capturas completas com cabeçalho/navegação. Mantém limite 16/0,3% e exige pelo menos 50% da área visível comparada; não mascara cartões RH nem aumenta tolerância. Alterações deliberadas em Clínicas/Stock permanecem candidatos para revisão humana.

Run 38313552764: 16 testes PostgreSQL/API aprovados, incluindo anexos de compras e proteção de custos no histórico; suites antigas e Clínicas aprovadas. Stock passou gestão de inventário/receção/consumo/encomendas/documentos em CEO/Administração; teste restante falhou por seletor ambíguo Pendente versus Assuntos pendentes, corrigido com âmbito stockPanel.
