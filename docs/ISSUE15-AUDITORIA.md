# Tarefa #15 — diagnóstico e âmbito

Base: 8e5bcd69, com relatório posterior 1cc02c53 preservado; branch dev/v4-stabilization-20261017, PR #13 draft.

| Área | Diagnóstico | Decisão |
|---|---|---|
| Meu RH | hr-separation-v4.js apresenta um bloco longo; hr-portal-ui-v4.js acrescenta outro grupo de ações | Reorganizar por áreas com os mesmos controladores. Preservar resumo, pedidos e campos existentes em secção recolhível |
| Regulamentos | O contador indica pendências. Biblioteca nova sem conteúdos publicados pode mostrar 0 corretamente; armazenamento é próprio de cada host | Separar número publicado de pendências; estado vazio explicativo; filtros por tipo; testar publicação/consulta/confirmação/nova versão |
| Backoffice | Gestão institucional já existe em Recursos Humanos com filtros | Reutilizar; tornar distinção pessoal/gestão explícita; acrescentar gestão administrativa de saúde ocupacional |
| Formação | hrTraining e regras contratuais já existem; consulta pessoal está num modal pouco expressivo | Página pessoal com progresso, sessões, histórico e referências a certificados permitidos; sem impor 40h nem ampliar gestão de equipamentos/despesas |
| Medicina do Trabalho | Pesquisa por medicina/aptidão/occupational não encontrou implementação | Acrescentar domínio administrativo, reutilizando pessoas, clínicas, catálogo/documentos pessoais, notificações e persistência isolada do portal |
| Documentos | Declarações/assinaturas, regulamentos e questionários versionados da #14 funcionam nas suites | Preservar os fluxos e bloqueios; não substituir confirmação de leitura por assinatura |

## Regras de segurança

Sem diagnósticos, resultados de exames ou notas clínicas neste domínio. Aptidão estritamente administrativa, apenas a informação permitida. Ficha de aptidão associada ao tipo correspondente do Catálogo Mestre, nunca a um documento arbitrário. Validação administrativa não prova assinatura digital nem legalidade do documento.

Periodicidade e próxima data dependem da indicação do médico do trabalho, circunstâncias e enquadramento confirmado; não fixar intervalo comum nem calcular prazos legais automaticamente. Alertas 60/30/7 configuráveis e vencimento são operacionais. Regresso após ausência superior a 30 dias e alteração relevante de condições são eventos administrativos, sem detalhes médicos.

Preview e dados exclusivamente sintéticos; não ativar prestadores, emails, arquivo real, migrações ou produção. Backend isolado testado não equivale a ligação UI/API central operacional. Validação jurídica e Android físico continuam necessárias.
