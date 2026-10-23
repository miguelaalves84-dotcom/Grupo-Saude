# Ficha do colaborador — auditoria campo a campo (23/10/2026)

Base: `4314b2e`. Inventário sem dados de colaboradores. O JSON adjacente inclui, por campo, origem, consumidores, permissões, validação, vigência, persistência e histórico.

| Campo / conceito | Fonte canónica | Bloco após consolidação | Consumidores e distinção |
| --- | --- | --- | --- |
| `hrName` | `name` | Dados pessoais | identidade, autenticação, todos os módulos; obrigatório |
| `hrEmail` | `email` | Dados pessoais | identidade, recuperação, comunicações; email único; alteração não ativa autenticação |
| `hrRole` | `role` | Função e acesso | matriz de acessos; não profissão clínica; perfil existente |
| `hrReserved` | `hr.reservedAccess` | Função e acesso | área reservada; booleano; não cria sessão real |
| `hrActive` | `active` | Função e acesso | âmbito e acesso; booleano |
| `hrPhoto` | `hr.photoDataUrl` | Dados pessoais | identidade profissional e marketing autorizado; máximo 2 MiB; arquivo local demonstrativo |
| `hrPhone` | `hr.phone` | Dados pessoais | RH, recrutamento, entrevistas; texto de contacto |
| `hrBirth` | `hr.birthDate` | Dados pessoais | RH; data |
| `hrAddress` | `hr.address` | Dados pessoais | RH, faturação própria; texto |
| `hrNif` | `hr.nif` | Dados pessoais | processamento, faturação própria; identificador fiscal; conservar como texto |
| `hrNiss` | `hr.niss` | Dados pessoais | processamento salarial; identificador como texto |
| `hrDependents` | `hr.dependents` | Dados pessoais | informação fiscal autorizada; inteiro não negativo; não calcula retenção |
| `hrIban` | `hr.iban` | Remuneração e subsídio de alimentação | pagamentos e faturação própria; não é o IBAN de uma empresa faturadora |
| `hrLicense` | `hr.professionalLicense` | Dados profissionais | cédula, marketing autorizado; apenas função clínica |
| `hrLicenseIssuer` | `hr.professionalLicenseIssuer` | Dados profissionais | cédula; apenas função clínica |
| `hrLicenseExpiry` | `hr.professionalLicenseExpiry` | Dados profissionais | validade profissional; data quando aplicável |
| `hrLicenseProof` | `hr.professionalLicenseProof` | Dados profissionais | documento já associado à ficha; ID de documento pertencente à ficha; sem segunda cópia |
| `hrERS` | `hr.ers.required` | Dados profissionais | requisito individual ERS; sim/não/por determinar; não obrigação universal |
| `hrERSDate` | `hr.ers.date` | Dados profissionais | ERS; data quando aplicável |
| `hrERSReference` | `hr.ers.reference` | Dados profissionais | ERS; referência |
| `hrERSProof` | `hr.ers.documentId` | Dados profissionais | documento ERS; ID da mesma coleção documental |
| `hrTechniquePercentage` | `hr.percentageHistory[].technique` | Atividade e remuneração variável | Financeiro, atos técnicos; 0–100%; versão com vigência |
| `hrTreatmentPercentage` | `hr.percentageHistory[].treatment` | Atividade e remuneração variável | Financeiro, tratamentos; 0–100%; versão com vigência |
| `hrPercentageFrom` | `hr.percentageHistory[].from` | Atividade e remuneração variável | Financeiro por data do ato; nova versão, sem recalcular movimentos históricos |
| `hrContract` | `hr.contractType` | Contrato | catálogo de contratos e checklist documental; opção do catálogo; distinto do vínculo jurídico confirmado |
| `hrAdmission` | `hr.admissionDate` | Contrato | férias, formação e processamento; data de admissão, distinta da vigência de cada alteração |
| `hrGross` | `hr.grossSalary` | Remuneração e subsídio de alimentação | GSPayrollExport.source → payrollContracts; 0 preservado; ausência distinta de zero |
| `hrMeal` | `hr.mealAllowance` | Remuneração e subsídio de alimentação | processamento e versões contratuais; 0 preservado; não duplica versão salarial |
| `hrPayrollRegime` | `hr.payrollContracts[].regime` | Contrato | processamento; exclusão de prestadores; trabalho sem termo/a termo/prestação confirmados, sem inferir profissão |
| `hrPayrollFrom` | `hr.payrollContracts[].from` | Contrato | processamento histórico; vigência salarial própria |
| `hrPayrollUntil` | `hr.payrollContracts[].until` | Contrato | fim do vínculo a termo; data quando aplicável |
| `hrPayrollEmployerName` | `hr.payrollContracts[].employerName` | Contrato | empregador do processamento; entidade empregadora, não empresa faturadora |
| `hrPayrollEmployerNif` | `hr.payrollContracts[].employerNif` | Contrato | processamento; NIF de empregador confirmado |
| `hrPayrollLegalReference` | `hr.payrollContracts[].legalReference` | Contrato | rastreabilidade contratual; referência do contrato confirmado |
| `hrPayrollMealMinimum` | `hr.payrollContracts[].mealMinimumMinutes` | Remuneração e subsídio de alimentação | conferência de dias de alimentação; regra validada; não inferir legalidade |
| `hrPayrollMealRule` | `hr.payrollContracts[].mealRuleReference` | Remuneração e subsídio de alimentação | conferência de alimentação; referência da validação |
| `hrConsultationFixed` | `hr.consultationFixed` | Atividade e remuneração variável | Financeiro, atos; valor não negativo; função clínica |
| `hrPercentage` | `hr.percentageRate` | Atividade e remuneração variável | compatibilidade de regra global anterior; conservar; só leitura visual se já existem percentagens versionadas por categoria |
| `hrHourlyRate` | `hr.hourlyRate` | Atividade e remuneração variável | regras de valor/hora; não negativo; distinto da remuneração mensal |
| `hrBonus` | `hr.bonusAmount` | Atividade e remuneração variável | vendas → bónus trimestral; não cria movimento financeiro diário |
| `hrVariableRule` | `hr.variablePayRule` | Atividade e remuneração variável | justificação das regras de remuneração; texto |
| `hrMealMethod` | `hr.mealMethod` | Remuneração e subsídio de alimentação | recibo/cartão; opção existente |
| `hrMealCardAccount` | `hr.mealCardAccount` | Remuneração e subsídio de alimentação | cartão de refeição; apenas quando pagamento por cartão |
| `hrBillingMode` | `hr.billingProfiles[].mode` | Faturação — nome próprio ou empresa | Financeiro; modo próprio/empresa com vigência |
| `hrBillingFrom` | `hr.billingProfiles[].from` | Faturação — nome próprio ou empresa | faturas por data; vigência fiscal distinta da salarial |
| `hrBillingCompany` | `employeeBillingCompanies[].id` | Faturação — nome próprio ou empresa | associação por ID; snapshots em billingProfiles; selecionar empresa existente sem reintroduzir dados |
| `hrBillingName` | `employeeBillingCompanies[].versions[].name` | Faturação — nome próprio ou empresa | catálogo de empresas faturadoras; só criar/alterar empresa, não repetir ao selecionar |
| `hrBillingNif` | `employeeBillingCompanies[].nif` | Faturação — nome próprio ou empresa | entidade faturadora; NIPC da empresa, não NIF pessoal |
| `hrBillingAddress` | `employeeBillingCompanies[].versions[].address` | Faturação — nome próprio ou empresa | empresa faturadora; morada fiscal da empresa |
| `hrBillingIban` | `employeeBillingCompanies[].versions[].iban` | Faturação — nome próprio ou empresa | empresa faturadora; IBAN da empresa, não conta do trabalhador |
| `hrStartTime` | `hr.startTime` | Horário | GSAttendanceCore.schedule; escalas sobrepõem horário habitual; hora válida; derivado hr.schedule preservado |
| `hrEndTime` | `hr.endTime` | Horário | assiduidade, processamento; hora válida |
| `hrLunchStart` | `hr.lunchStart` | Horário | assiduidade, processamento; hora válida ou pausa não configurada |
| `hrLunchEnd` | `hr.lunchEnd` | Horário | assiduidade, processamento; hora válida |
| `hrClinicPicker` | `clinics[]` | Local de trabalho | âmbito por clínica, operação, acessos; IDs do cadastro único; espelhos de compatibilidade |
| `hrSpecPicker` | `specialtyIds[]` | Dados profissionais | estrutura clínica, operação, marketing; IDs do catálogo existente; sem escrita livre |

## Duplicações, conflitos e correções

1. `V4HR.savePay` escrevia remuneração/alimentação/dependentes na raiz de `employees` e usava `hrMealMode`/`hrDeps`, ausentes da ficha atual. Passa pelo único editor/gravador HRMaster; sem segunda escrita nem apagar as chaves antigas.
2. `V4HR.addLeave`/`editDoc`, sem consumidores de UI encontrados, conservam os nomes de compatibilidade mas abrem Férias/Documentos canónicos. Já não inserem ausências livres nem marcam um documento como recebido sem ficheiro.
3. O pós-processamento do formulário colocava percentagens, empregador, vínculo jurídico e faturação dentro de Remuneração. Os nós existentes são movidos, não copiados: Contrato → vínculo/empregador; Remuneração → salário/alimentação/IBAN; Atividade variável → atos/percentagens/bónus; Faturação → empresa/nome próprio.
4. A percentagem global antiga continua conservada; com versões por categoria é apresentada como referência histórica, sem segundo editor concorrente. Percentagem de técnica e tratamento permanecem distintas.
5. Zero em remuneração/alimentação era apresentado como vazio por `||`. Corrigido para `??`: guardar a ficha não transforma zero em informação ausente.
6. Campo pessoal existente apenas na raiz antiga é lido por compatibilidade se o campo `hr` estiver ausente. Nunca substitui um valor explícito em `hr`; o original continua guardado.
7. O resumo Financeiro usava inputs de só leitura para repetir salário/alimentação. Passa a apresentar valores derivados, sem outro formulário.
8. Gravar valida que o formulário pertence ao colaborador indicado; auditoria acrescenta antes/depois dos campos editáveis, sem duplicar bytes de fotografias/documentos nem dados médicos.
9. `users` e `employees` são projeções de compatibilidade por um mesmo ID, não dois colaboradores. Mantida sincronização existente; nenhum novo cadastro.

## Informação que não deve ser fundida

- Perfil de acesso ≠ profissão/especialidade. Não inferir contrato, remuneração ou obrigações pela profissão.
- Tipo de contrato/checklist ≠ vínculo jurídico confirmado. Admissão ≠ início de cada alteração contratual.
- Entidade empregadora ≠ empresa que emite faturas. NIF/IBAN pessoais ≠ NIPC/IBAN da empresa.
- Vigência salarial ≠ vigência de faturação ≠ vigência das percentagens dos atos. Preservar versões em cada domínio.
- Horário habitual ≠ escala aprovada do dia. Livro de Ponto usa a escala efetiva; não duplicar os seus campos na ficha.
- Associação à cédula/ERS é um ID do arquivo documental existente, não outro upload nem outra cópia.

## Áreas associadas auditadas

Férias/baixas: `leave`, projeção HRLeave e saldos existentes. Ponto: eventos e correções aprovadas GSAttendanceCore, sem somas paralelas. Documentos: `employeeDocuments`/GSEmployeeDocuments, com regras do catálogo e contrato. Formação/equipamentos/despesas: GSHRDevelopment e ficheiros existentes, gestão exclusiva CEO/Administração. Avaliações: HRPerformance existente, sem autoavaliação duplicada. Financeiro: GSFinanceCore e snapshots salariais existentes. Recrutamento: ligação candidato→ID colaborador preservada. Capacidades habituais: apenas técnicos, sem introduzir capacidade médica.

## Limites e pendências

O inventário não certifica conformidade jurídica/fiscal nem converte persistência local em central. Não foram eliminados registos, documentos, versões, associações ou chaves legadas. Não se executou uma migração da base de dados. As rotas de RH existentes continuam com as limitações de autenticação/arquivo central dos relatórios anteriores. Dados médicos ocupacionais não são incluídos no novo snapshot genérico. Revisões jurídicas de contratos/formação/retenção continuam necessárias antes de ativação real.

Resultados de testes e novo preview serão registados no relatório de entrega deste bloco.
