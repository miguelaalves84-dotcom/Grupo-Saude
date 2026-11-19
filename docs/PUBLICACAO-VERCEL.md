# Publicação na Vercel — decisões em vigor

Atualizado a 2026-11-13.

## Projetos

| Projeto Vercel | Para quê | Como é publicado |
|---|---|---|
| `grupo-saude-v3` | Site oficial atual (**gruposaude.online**), versão antiga | **Congelado**: «Ignored Build Step → Don't build anything». Não se atualiza sozinho com envios para nenhuma branch, incluindo a `main`. |
| `grupo-saude-v4-validacao-sintetica` | Endereço de testes do V4 (`grupo-saude-v4-login-testes.vercel.app`) | Publicado à mão a partir do código desta branch; só dados fictícios. |

O `vercel.json` também desliga as publicações automáticas das branches `dev/v4-stabilization-20261017` e `claude/*`.

## Porquê o V3 ficou congelado

A produção do V3 vinha da `main` deste repositório. Sem o congelamento, juntar o PR do V4 à `main` mudaria o site oficial para uma versão ainda em testes.

## Passagem para o V4 (no dia escolhido)

1. Criar o projeto V4 de produção (base de dados e chaves próprias, separado do de testes).
2. Testá-lo num endereço provisório.
3. Mudar o domínio `gruposaude.online` para o projeto V4. Reverte-se voltando a apontar o domínio para o V3, que fica intacto.
4. Mais tarde, desligar o V3 deste repositório.
