# Reclamações — associações, toque e linha cronológica

Branch: `dev/v4-stabilization-20261017`; base preservada: `0c34722`.

## Correções

- A identidade sintética `test_adm`, com email exato `administrativa.teste@gruposaude.local`, tinha a associação antiga `c1`, sem clínica operacional canónica correspondente. Reparação única para `abranfir`, com auditoria e preservação das referências antigas. Não altera identidades reais, permissões personalizadas, associações personalizadas nem restabelece associações posteriormente revogadas. Sem clínicas válidas, o acesso continua bloqueado.
- Seleção de clínica limitada às associações ativas. O servidor continua a validar perfil, ação, clínica e colaboradores envolvidos. A associação real em produção não foi consultada ou alterada.
- Reutilização do controlador Pointer Events dos candidatos, com pega própria para reclamações, limiar de movimento, captura do ponteiro, cancelamento, indicação visual e coluna de destino. Fora da pega, mantém-se a deslocação horizontal. Seletor acessível preservado.
- Arrastar ou usar o seletor abre a mesma ficha com a etapa pretendida. Nenhuma mudança é guardada antes da confirmação e validação de todos os requisitos. Regressos exigem gestão e justificação; encerramento e reabertura mantêm as proteções.
- Histórico estruturado de mudanças e anexos: data/hora, autor, clínica, etapa anterior/nova, observações, justificação e referências/metadados de documentos. Não duplica os corpos dos ficheiros no histórico.
- Linha cronológica apresenta todas as visitas, incluindo regressos e reaberturas, duração de cada etapa, documentos e ações. Preserva os registos antigos sem migração destrutiva. A reabertura não reinicia o prazo original de 15 dias corridos em Europe/Lisbon.
- Revisão capturada ao abrir a ficha impede que um formulário antigo substitua uma alteração mais recente.

## Validação e limites

- `npm test`: aprovado localmente, incluindo 17 verificações de Reclamações e 41 de recrutamento.
- `npm run build`: aprovado; 67 recursos estáticos, sem backend, segredos ou documentos privados.
- Nova suite Chromium: CEO, Administração e Administrativa Teste, computador e tablet Android em duas orientações; gestos táteis reais via CDP, cancelamento, campos obrigatórios, associação padrão, multiclínica, histórico e recarregamento. Fluxo completo e reabertura pela interface no computador.
- Regressões existentes mantidas, incluindo permissões dos seis perfis e arrastamento dos candidatos. Suite PostgreSQL isolada ampliada para histórico persistido e multiclínica.
- Resultados Chromium/PostgreSQL só são aprovados após execução efetiva no GitHub Actions. Consultar a execução associada ao commit desta entrega; este ficheiro não substitui os resultados da execução.
- O preview é exclusivamente sintético: guarda no navegador e conserva as alterações ao recarregar esse navegador. Não é persistência central entre dispositivos. A implementação de servidor é testada separadamente em SQLite/PostgreSQL descartáveis e não está ativada no preview estático.
- Sem migrações remotas, credenciais, emails reais, gravações, IA ou alterações à produção. Os 15 dias são a regra operacional; procedimentos legais continuam sujeitos a confirmação jurídica.

## Ficheiros principais

`complaints-core-v4.js`, `complaints-ui-v4.js`, `lib/complaints-service.js`, `candidate-drag-v4.js`, `demo-clinic-associations-v4.js`, `tests/complaints.cjs`, `tests/complaints-enhancements-browser.py`, `tests/interviews-complaints-postgres.cjs`, `.github/workflows/v4-stabilization.yml`.
