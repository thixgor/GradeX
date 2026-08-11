# ADR 0002 — Mídia da Histopatologia

- **Estado:** aceito
- **Data:** 2026-08-09
- **Decisores:** equipe editorial do Domine Aqui

## Decisão

Três fontes estão aprovadas para exibição remota. Duas coleções adicionais
permanecem apenas como referências externas selecionadas:

| Fonte | Estado |
| --- | --- |
| Atlas de Anatomia Patológica — FCM/Unicamp | Direitos aprovados |
| Histopathology Atlas / patolojiAI | Direitos aprovados |
| Pathology Outlines | Somente consulta externa |
| WebPathology | Somente consulta externa |
| WebPath — University of Utah | Direitos aprovados para o Domine Aqui |

As imagens continuam hospedadas e servidas pelas instituições de origem. O Domine Aqui mantém o crédito e o link para a página-fonte junto de cada item e não armazena cópias locais.

Pathology Outlines e WebPathology não são usados como origem de `<img>`,
visualizador embutido ou quadro. A WebPath autorizou por escrito a exibição e a
incorporação no Domine Aqui e seus subdomínios, incluindo visualizador interno
com ampliação. A autorização é gratuita, educacional e não comercial, não permite
modificação ou redistribuição e não implica endosso ou afiliação.

O filtro de domínios permanece ativo para impedir que selos, rastreadores e outros recursos externos capturados pelo catálogo sejam tratados como lâminas.

## Implementação

- `lib/histopatologia/direitos.ts` distingue incorporação autorizada de consulta externa.
- `lib/histopatologia/midia.ts` libera a URL remota apenas para fontes aprovadas e domínios permitidos.
- `lib/histopatologia/editorial/referencias-visuais.ts` registra links externos,
  títulos traduzidos, roteiros de observação e, apenas para a WebPath, URLs remotas autorizadas.
- `data/histopatologia/webpath-utah/` registra 1.325 páginas e suas URLs remotas de imagem em
  19 fragmentos; nenhum arquivo de imagem é armazenado. Os capítulos estão incorporados ao
  índice único em `/atlas` e abrem em `/atlas/webpath-utah/[capitulo]`, com
  imagem direta, ampliação, tradução, busca, paginação e leitura guiada dentro do Domine Aqui.
- O comprovante é o documento `WP-AUTH-DOMINEAQUI-2026-08-11`, verificado em
  2026-08-11 e registrado por identificador e SHA-256 no portão de direitos.
- A revisão biomédica do texto didático continua independente da autorização das imagens.
