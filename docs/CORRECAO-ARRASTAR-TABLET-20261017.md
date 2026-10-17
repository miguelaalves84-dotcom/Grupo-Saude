# Arrastar candidaturas no tablet — correção sobre 30006d0

Branch: dev/v4-stabilization-20261017. Apenas interação do funil; sem alterações ao domínio, cinco etapas, permissões, dados ou serviços de email.

## Correção

`candidate-drag-v4.js` é o único controlador de gestos, reutilizado pelo funil demonstrativo (`clinic-hr-architecture.js`) e pelo autenticado (`recruitment-ui-v4.js`). Usa Pointer Events com captura do apontador para toque, rato e caneta. Mantém compatibilidade com o arrastar nativo de computador.

Cada cartão tem uma pega «⠿ Arrastar», com área mínima de 44 px. Arrastar pela pega mostra o nome em movimento e destaca a coluna de destino. A deslocação horizontal normal continua disponível no corpo do cartão e nos espaços do funil; não altera candidaturas. A separação explícita entre pega e deslocação evita movimentos acidentais. Gestos inferiores a 8 px, cancelamento pelo navegador, Escape, perda de foco, mudança de perfil, revogação de permissões e largar fora do funil não guardam uma etapa.

Próximo das extremidades, o funil desloca-se automaticamente para alcançar colunas fora do ecrã. Ao largar, o controlador chama o fluxo de movimentação já existente, sem escrever diretamente em dados: entrevista, recusa e contratação continuam a exigir os mesmos formulários/confirmações antes de guardar. Mantém-se o seletor acessível de etapa, os cartões, contagens, documentos e histórico.

O cartão existente de Aprovações RH é montado imediatamente ao redesenhar o funil. Assim, a sua atualização periódica não insere um bloco acima das colunas durante um gesto nem desloca o destino de largada. O cartão e todas as suas ações são preservados.

## Validação

- Sintaxe, regressão npm test e build estático.
- `tests/candidate-pointer-browser.py`: eventos de entrada reais do Chromium por CDP (não eventos DOM artificiais), contexto Android/Pixel Tablet com hasTouch/isMobile, retrato 820×1180 e paisagem 1280×800; rato e caneta em computador.
- Gesto mantido durante a atualização periódica de Aprovações RH, sem deslocar as colunas; gestos curtos, pan horizontal sem mudança, pointercancel, indicação visual, autoscroll entre colunas, contagens/histórico sem recarga, formulários obrigatórios, currículo preservado e seletor alternativo.
- CEO e Administração executam os movimentos; os outros quatro perfis são testados contra acesso não autorizado. A regressão anterior mantém seis perfis × três dispositivos × dois temas.
- GitHub Actions conserva resultados JSON e capturas sintéticas durante 14 dias. Aprovação só após resultado efetivo do run do commit.

Os testes Android usam emulação de toque no Chromium, não um tablet físico. A validação no tablet do utilizador continua necessária. O preview publicado permanece estático e sintético, protegido por autenticação Vercel, sem backend ou envios reais. Main/produção não são alteradas e o PR #13 permanece em rascunho.
