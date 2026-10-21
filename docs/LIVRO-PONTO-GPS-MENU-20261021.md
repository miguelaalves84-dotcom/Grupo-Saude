# Correção de GPS, pedidos manuais e navegação — 21/10/2026

Branch: `dev/v4-stabilization-20261017`; PR #13 em rascunho. A instrução atual substitui a regra anterior que dispensava GPS na saída e nos movimentos temporários.

## Alterações

- Todas as marcações rápidas exigem coordenadas dentro do raio da clínica, considerando também a precisão: entrada, saída, almoço, regresso, saída temporária e regresso temporário. Horário, baixa, sequência e permissões continuam validados.
- Os botões ficam inicialmente desativados. Uma leitura pontual valida a localização antes de os ativar; a autorização visual expira em 30 segundos. Não existe acompanhamento contínuo por `watchPosition`. A confirmação recolhe uma nova posição, validada pelo mesmo domínio na API contra a configuração da clínica carregada no servidor.
- Fora da clínica, com permissão recusada, GPS indisponível/impreciso ou configuração ausente, o ponto rápido fica bloqueado com o respetivo motivo. A configuração existente de coordenadas/raio de Clínicas foi reutilizada, sem uma nova tabela.
- «Solicitar registo manual de ponto» continua disponível quando o GPS está bloqueado. Permite escolher tipo, clínica autorizada, data/hora declaradas, justificação, marcação original opcional e comprovativo.
- O pedido fica pendente sem criar presença, horas, saldo ou pagamento. A aprovação/recusa exige CEO/Administração autorizados, motivo, âmbito clínico e revisão atual. Hora declarada, hora do pedido e hora da decisão ficam separadas. Pedidos duplicados e decisões repetidas são recusados ou devolvidos idempotentemente.
- A aprovação de um registo em falta acrescenta um evento ligado ao pedido; uma correção de registo existente mantém o original e aplica a projeção aprovada. A sequência resultante é validada. Pedidos históricos continuam preservados.
- O colaborador consulta os seus pedidos e decisões no próprio Livro de Ponto, dentro da Área Pessoal.
- Comprovativos: PDF/PNG/JPEG até 1 MB, com verificação do conteúdo. Na demonstração, apenas ficheiros sintéticos identificados como tal. Na API isolada, reutiliza-se o serviço de armazenamento privado existente; sem armazenamento configurado, o upload falha explicitamente. Documentos usam `documents` e referências de ocorrências existentes, sem novas tabelas. A consulta exige autorização, verificação de integridade e auditoria.
- Menu: grupos existentes com texto maior e mais forte, ícones, separadores, submenus recuados, realce do grupo/página ativos e contraste claro/escuro. O acordeão existente continua a permitir um único grupo expandido. Não foram alteradas permissões nem criados grupos duplicados.

## Ficheiros

`attendance-core-v4.js`, `attendance-ui-v4.js`, `lib/attendance-service.js`, `api/attendance.js`, `safe-actions-v4.js`, `styles.css`, `tests/attendance.cjs`, `tests/attendance-browser.py`, `tests/attendance-postgres.cjs` e este relatório.

## Verificação e limites

Executar `npm test`, build, regressão Chromium nos seis perfis × computador/tablet/telemóvel × claro/escuro e PostgreSQL descartável. Os resultados válidos são os do commit final no GitHub Actions, não a mera existência da suite.

A suite verifica localizações sintéticas dentro/fora do raio, precisão, erros de permissão/disponibilidade, configuração ausente, nova validação na confirmação, quatro movimentos normais, pedidos manuais/comprovativos, histórico, aprovações e permissões. O domínio e o PostgreSQL verificam ainda movimentos temporários, recusas, concorrência, integridade de comprovativos e bloqueios da API.

O preview é estático, sintético e protegido; a sua persistência continua limitada ao navegador. O backend não é publicado nem ativado nesse preview. Login real, ligação central da interface e arquivo privado real continuam dependências do ambiente integrado. Não foram criados recursos, migrações reais, credenciais ou serviços de produção.

O GPS do navegador e a validação de coordenadas no servidor não equivalem a uma solução de atestação contra falsificação da localização pelo próprio dispositivo. Não são conservadas novas coordenadas precisas nas marcações; o resultado da validação é minimizado.

As pendências gerais do RH continuam documentadas em [RH-LIVRO-PONTO-CONSOLIDACAO-20261021.md](RH-LIVRO-PONTO-CONSOLIDACAO-20261021.md). Esta entrega não declara todo o RH concluído.
