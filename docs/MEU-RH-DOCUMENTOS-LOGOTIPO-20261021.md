# Meu RH — documentos pessoais e identidade visual

Origem: [comentário 6315699631 do PR #13](https://github.com/miguelaalves84-dotcom/Grupo-Saude/pull/13#issuecomment-6315699631). Branch exclusiva `dev/v4-stabilization-20261017`; PR em rascunho. Main, produção, bases e dados reais preservados.

## Documentos implementados

O percurso Área Pessoal → Meu RH → Documentos RH permite carregar documentos sintéticos mesmo sem anexos prévios, selecionar um tipo ativo do Catálogo Mestre, indicar clínica autorizada, datas e observações. PDF, PNG e JPEG até 3 MB são validados pelo mesmo validador de ficheiros existente.

As associações usam os IDs do Catálogo Mestre e das checklists contratuais. Um requisito em falta é preenchido, sem criar outro catálogo ou registo duplicado. A ficha RH → Documentos e os atalhos anteriores encaminham para o mesmo controlador. As funções públicas antigas mantêm adaptadores, sem um segundo escritor de upload.

O documento fica Pendente. A validação/rejeição exige a permissão configurável «Validar documentos RH», acesso a RH, âmbito clínico e motivo. CEO/Administração têm os valores padrão; outros perfis podem receber autorização específica, sem novo perfil obrigatório. Uma decisão incrementa a revisão e fica no histórico. O carregamento pessoal pertence sempre ao próprio colaborador.

Substituir um documento requer motivo e revisão atual. A versão anterior mantém ficheiro, estado e datas; a nova versão volta a Pendente. Repetições e ficheiros duplicados são protegidos. O colaborador consulta/descarrega as próprias versões e vê o histórico. Documentos financeiros continuam no seu percurso de permissões existente.

As notificações são derivadas dos registos canónicos pelo sistema global existente: pendentes para os utilizadores autorizados e decisão para o titular, sem uma segunda tabela de notificações. Ler/confirmar uma notificação não valida o documento.

## API e proteção

`api/employee-documents.js` reutiliza identidade/permissões do servidor, o serviço de ficheiros privados e a tabela `documents`. Não cria outra tabela documental. A leitura e o download verificam titular, clínica e permissões; as respostas não expõem chaves de armazenamento ou URLs públicas. O download verifica checksum e regista auditoria. Escritas com revisão divergente são recusadas atomicamente. Ficheiros antigos não são apagados quando se substitui uma versão.

A API está desativada por omissão e em produção. A ativação de uploads reais exige também a validação de segurança documental já existente: identidade, armazenamento privado, análise de ficheiros, recuperação, retenção e privacidade. Sem essa configuração, o serviço informa que o upload real está bloqueado.

**O preview é apenas sintético:** ficheiros de teste guardados neste navegador, sem sessão central nem armazenamento privado operacional. O upload demonstrativo não representa arquivo definitivo. Não carregar documentos reais. Os testes PostgreSQL usam uma instância descartável e armazenamento privado em memória; não provam a configuração de um fornecedor cloud real.

## Logótipo oficial — bloqueado por ficheiro em falta

Não foi encontrado um ficheiro original verificável do logótipo no repositório ou nos anexos acessíveis ao ambiente. Foi solicitado ao utilizador que anexe o SVG/PNG original nesta conversa Codex. Nenhum logótipo alternativo foi desenhado e a marca existente não foi substituída.

A integração no login/password e cabeçalho, com proporções e legibilidade em ambos os temas, continua **pendente desse ficheiro**. Não é apresentada como concluída.

## Ficheiros principais

- `employee-documents-core-v4.js`, `employee-documents-ui-v4.js`.
- `lib/employee-documents-service.js`, `api/employee-documents.js`.
- `hr-separation-v4.js`, `hr-master-v4.js`, `approvals-center-v4.js`.
- `attention-core-v4.js`, `attention-ui-v4.js`, `access-policy-core-v4.js`, `safe-actions-v4.js`, `index.html`.
- `tests/employee-documents.cjs`, `tests/employee-documents-browser.py`, `tests/employee-documents-postgres.cjs`, `package.json`, `.github/workflows/v4-stabilization.yml`.

## Verificação

Executar sintaxe, `npm test`, build, PostgreSQL isolado e Chromium nos seis perfis, três formatos e dois temas. A suite documental cobre upload próprio, catálogo/checklist, estado pendente, validação RH, descarga, substituição, versões, histórico e regresso ao Meu RH. Os resultados válidos são os do commit final no GitHub Actions. As suites anteriores também devem passar antes de publicar o preview.
