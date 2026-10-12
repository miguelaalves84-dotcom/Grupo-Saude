# Plano concreto de preview isolado

Artefacto preparado apenas após regression, todas as suites Chromium, PostgreSQL/HTTP e comparação visual aprovados. Inclui dist, configuração estática sem crons/API/variáveis e manifest com SHA-256 dos assets. Não inclui SQL, backend, .env, documentos de utilizadores, capturas autenticadas nem tokens.

Publicação proposta: novo projeto Vercel estático dedicado `grupo-saude-v4-validacao-sintetica`, na equipa do projeto existente `grupo-saude-v3`. Não reutilizar nem alterar esse projeto de produção. Enviar exclusivamente os assets do artefacto aprovado, com target preview e Git desligado; nenhum domínio de produção, credenciais, Neon, função, cron ou migração.

A interface permite alternar os seis perfis já existentes, em modo explicitamente demonstrativo. Stock inclui botão para carregar exemplos sintéticos apenas em inventários inexistentes; não apaga movimentos. Dados ficam no navegador e não constituem autenticação ou persistência central reais. As APIs foram testadas separadamente num PostgreSQL descartável.

Por instrução 7 do utilizador, criação/configuração do projeto remoto e publicação aguardam aprovação do plano e do artefacto concreto. Só comunicar URL quando a criação terminar READY e a URL for efetivamente testada. Não há preview público novo nesta preparação.
