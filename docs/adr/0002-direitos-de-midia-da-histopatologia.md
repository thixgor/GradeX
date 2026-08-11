# ADR 0002 — Mídia da Histopatologia

- **Estado:** aceito
- **Data:** 2026-08-09
- **Decisores:** equipe editorial do Domine Aqui

## Decisão

As duas fontes do catálogo incorporado estão aprovadas para exibição remota. As
três coleções adicionais entram apenas como referências externas selecionadas:

| Fonte | Estado |
| --- | --- |
| Atlas de Anatomia Patológica — FCM/Unicamp | Direitos aprovados |
| Histopathology Atlas / patolojiAI | Direitos aprovados |
| Pathology Outlines | Somente consulta externa |
| WebPathology | Somente consulta externa |
| WebPath — University of Utah | Somente consulta externa |

As imagens continuam hospedadas e servidas pelas instituições de origem. O Domine Aqui mantém o crédito e o link para a página-fonte junto de cada item e não armazena cópias locais.

Pathology Outlines, WebPathology e WebPath/Utah não são usados como origem de
`<img>`, visualizador embutido ou quadro. Para eles, a aplicação armazena somente
metadados editoriais autorais e a URL da página pública, aberta em nova aba. Essa
separação preserva o objetivo didático sem reproduzir os recursos protegidos.

O filtro de domínios permanece ativo para impedir que selos, rastreadores e outros recursos externos capturados pelo catálogo sejam tratados como lâminas.

## Implementação

- `lib/histopatologia/direitos.ts` distingue incorporação autorizada de consulta externa.
- `lib/histopatologia/midia.ts` libera a URL remota apenas para fontes aprovadas e domínios permitidos.
- `lib/histopatologia/editorial/referencias-visuais.ts` registra links externos,
  títulos traduzidos e roteiros de observação sem armazenar URL de imagem.
- A revisão biomédica do texto didático continua independente da autorização das imagens.
