# Auditoria e correção de Tabelas / Configuração

Base: 854bfe4; branch fix/v4-p0-security-hardening-tables-catalog. Só modo demonstrativo; sem migrações, serviços externos ou produção.

Encontrado: cartão Catálogo mestre abria Tipos de contrato; documentCatalog/masterDocuments eram fontes documentais concorrentes; editor legado misturava catálogo e contratos; cartões de estrutura e especialidades injetados duplicavam os estáticos; dois acessos a permissões com rótulos sobrepostos; especialidades estáticas abriam consulta de estrutura, tornando a edição pouco clara.

Correção: editor independente de catálogo, nome/ativação/obrigatoriedade por defeito/regra de datas/validade em dias/aviso/requisitos; contratos independentes com associação e obrigatoriedade configurável por documento; checklist na ficha RH baseada nas regras atuais; edição só CEO/Administração com settings. Catálogo mantém referências antigas através de mapa de aliases e snapshot de migração local; nenhuma evidência ou documento validado é apagado. Inativação impede novas associações, sem retirar requisitos de contratos existentes.

Uma entrada por assunto: Clínicas; Recursos Humanos (fichas); Especialidades por clínica (edição); Clínicas · Especialidades · Profissionais (consulta); Catálogo mestre de documentos; Tipos de contrato; Funções e permissões; Lista de Emails; Calendários/feriados. A consolidação remove só cartões DOM repetidos, não registos. Contactos, GPS, requisitos clínicos, estruturas/especialidades/RH, férias dos contratos, calendários e configurações de email permanecem nas fontes existentes.

Segurança: os destinos e mutações locais são guardados; perfis não gestores não obtêm acesso só por chamar os editores. Não equivale a autenticação operacional; a API/SQL central não mudou. Validade em dias é regra configurada; não gera automaticamente uma data de expiração num ficheiro legado nem o declara validado.

Verificação: npm test/build e suite tables-browser no Actions, nove destinos por gestor, seis perfis + Básico legado, lista sem duplicados, criação/associação/checklist RH sem perda de documento validado, tablet/mobile. As suites anteriores e baseline mantêm-se; só declarar aprovação após resultados efetivos. Novo preview terá manifesto do novo SHA, Vercel Authentication, sem Git/credenciais/Neon/API.
