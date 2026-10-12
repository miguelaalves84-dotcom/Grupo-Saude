# Bloco 03 — auditoria antes da consolidação

Base aprovada 4a58d5e; nova branch fix/v4-p0-security-hardening-clinics-stock. Main e produção excluídas.

Stock: pesquisa em todo o código JS, HTML, SQL e documentação desta branch não encontrou inventário, movimentos, fornecedores ou encomendas implementados. Não existe tabela Stock a substituir. Histórico de branches/PRs será consultado antes da migração; versões indisponíveis não serão declaradas recuperadas.

Clínicas: ClinicMasterV4 é a ficha mestre atual, sem autorização própria e com uploads a guardar apenas o nome do ficheiro ERS. Preservar esta ficha, especialidades/profissionais, calendários, GPS e histórico; transferir o editor para Tabelas e substituir o conteúdo Gestão → Clínicas por acompanhamento documental. Reutilizar clinics, audit_log, private_documents, política central e atenção global. Nenhuma segunda tabela clinics.

Plano global mantém 14 grupos. Stock integra os grupos 2 (isolamento clínico), 9 (custos), 10 (documentos de compras), 11 (operações), 13 (tabelas) e 14 (segurança/auditoria). As entregas anteriores permanecem.

Baseline: preservar artefactos do run 38293004119 e capturar a fonte imutável 4a58d5e antes de qualquer alteração visual. Seis perfis × desktop/tablet/mobile × claro/escuro × Clínicas/Stock/RH/Operação. Ausência de Stock e acessos negados são registados, nunca screenshots fictícios de um módulo inexistente. Capturas determinísticas, Chromium 1.56.0, relógio sintético fixo. Limite de comparação: diferenças de canal >16 e até 0,3% de pixels alterados para antialiasing. Alterações intencionais Clínicas/Stock exigem baseline nova identificada; baseline original nunca é sobrescrita.

As imagens/traces são sintéticas. Apenas o passo de preservação tem token GitHub com escrita na branch; containers de testes não recebem tokens, credenciais ou rede. O publicador recusa head divergente e force push. Desativação Git Vercel adicionada apenas para a nova branch no ficheiro versionado; nenhuma configuração remota alterada. Commits mantêm CF-Pages-Skip.
