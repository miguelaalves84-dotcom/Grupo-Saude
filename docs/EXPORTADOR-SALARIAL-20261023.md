# Exportador Universal de Processamento Salarial — 23/10/2026

Origem: comentário PR #13 / 6354436727. Branch dev/v4-stabilization-20261017, base d23c859. Main e produção preservadas.

## Auditoria e reutilização

| Fonte existente | Utilização | Preservação / limites |
|---|---|---|
| users / employees.hr, clínicas e seis perfis | Identificação, âmbito clínico e contratos | Mesmas fichas; sem nova tabela de colaboradores |
| attendance-core-v4.js / time_entries | Ponto efetivo com correções aprovadas, pausas, horas aprovadas | Reutiliza regras; não altera ponto nem saldos |
| leave / documentos de ausência no servidor | Datas e tipo mínimo de férias, baixas e ausências aprovadas | Sem comprovativos, diagnósticos ou notas médicas |
| Financeiro / contas correntes / bónus trimestral | Prémios, comissões e atos aprovados de trabalhadores elegíveis | Uma fonte de movimentos, sem somar vendas diárias novamente |
| finance-core-v4.js PDF e logótipo oficial | PDF de conferência | Mesmo motor; exportação financeira anterior preservada |
| app_settings e audit_log | Snapshots, rubricas, estados, geração e entrega declarada | Sem migrações ou tabelas paralelas |

O normalizador de movimentos históricos foi extraído do controlador Financeiro para o núcleo financeiro e reutilizado pelos dois módulos. Não foi criada uma segunda regra de leitura de contas correntes. A função existente de decisão de aprovação do ponto passou a ser exposta ao projetor salarial, sem duplicar a regra.

## Funcionalidades

- RH → Processamento salarial → Exportar para contabilidade. Apenas CEO/Administração com hrManage, incluindo bloqueios no domínio e API. Perfis simulados não herdam privilégios. Administração só acede a colaboradores cujo âmbito clínico completo lhe é autorizado; não recebe valores globais de colaboradores de clínicas não autorizadas.
- Uma/várias/todas as clínicas autorizadas, um/alguns/todos os colaboradores, intervalo de datas e atalho mensal. O atalho mensal não fecha nem altera os módulos de origem.
- Modelo canónico gs-payroll-incidences/1 com fonte e ID de cada incidência, versão contratual, período, unidade, valor em cêntimos quando confirmado, base de apuramento e rubrica universal ou mapeada.
- Versões com vigência em employees.hr.payrollContracts: confirmação jurídica explícita, empregador, NIF, referência e valores. Não se infere trabalho subordinado ou independência por rótulos de contrato, profissão ou perfil. Prestação independente confirmada excluída das linhas salariais, mantendo apenas indicação mínima da exclusão para conferência. Vínculos não confirmados bloqueiam o pacote.
- Referências de remuneração base, alimentação, diuturnidades, férias/Natal; férias/baixas/ausências; entradas/saídas/pausas e correções; minutos trabalhados e suplementares aprovados; prémios, bónus e comissões/atos aprovados. Alterações de remuneração preservam versões. Não duplica remuneração por clínica.
- Validação de identificação (formato NIF/NISS), admissão, lacunas de vigência, alteração de contrato, aprovações pendentes, ponto incompleto/inconsistente e rubricas. Valores não confirmados e ausência de ponto exigem conferência humana explícita. Horas suplementares legadas exigem reconciliação, sem soma automática ao livro de ponto.
- Rascunho → Conferido → Exportado; snapshot preservado, deteção de alterações de fontes, prevenção de rascunhos iguais, aviso de sobreposição com pacotes anteriormente exportados, histórico de gerações e SHA-256. Descarregar não significa entrega. Entrega registada separadamente, por declaração manual com destino e referência, sem envio de email.
- XLSX OOXML real (seis folhas), CSV UTF-8 com identificação e incidências, PDF de conferência com marca oficial e JSON versionado. ZIP com os quatro formatos e manifesto SHA-256. CSV neutraliza fórmulas e XLSX usa células de texto para identificadores.
- Rubricas por entidade e versão imutável. Registo de adaptadores Primavera, PHC, Sage, TOConline e outros com estado NÃO LIGADO / NÃO VALIDADO. Nenhuma compatibilidade proprietária declarada.
- Atalho «A minha ficha» removido de Meu RH para Call Center, Médico, Técnico e Administrativo. Documentos pessoais, ponto, férias, baixas e restantes acessos legítimos preservados nos menus próprios.

## Ficheiros principais

- payroll-export-core-v4.js: autorização, versões, projeções, validação, snapshots e histórico.
- payroll-export-formats-v4.js: formatos universais, CRC/ZIP, OOXML, hashes e manifesto.
- payroll-export-ui-v4.js e payroll-export-v4.css: interface responsiva.
- lib/payroll-export-service.js e api/payroll-export.js: serviço isolado autenticado e proteção de endpoints, comparação de fontes e transações concorrentes.
- tests/payroll-export.cjs, tests/payroll-formats.py, tests/payroll-export-postgres.cjs, tests/payroll-export-browser.py: verificações por formato, perfil e integração.

## Limites e dependências

O programa prepara incidências; não substitui processamento fiscal/contabilístico. Referências mensais/diárias não são liquidações: não se inventam prorratas, retenções, contribuições, valores líquidos, direitos a subsídios ou pagamentos. Dias de ausência identificados não são assumidos como dias remuneráveis sem conferência. Os formatos devem ser conferidos pelo contabilista antes de utilização; os adaptadores proprietários exigem esquemas oficiais e testes próprios.

O preview é sintético e local, sem arquivo salarial privado central nem persistência entre dispositivos. A API fica desligada por omissão e bloqueada em produção; os testes PostgreSQL descartáveis não ativam integração central. Nenhum dado real, fornecedor ou credencial foi configurado. Sem eliminação de dados ou documentos.

Os resultados efetivos do GitHub Actions e o SHA final são apresentados na entrega, não presumidos a partir da existência de testes. O workflow mantém as suites anteriores e acrescenta uma suite Chromium salarial e testes PostgreSQL isolados, sem segredos de produção.
