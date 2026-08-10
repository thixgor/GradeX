# ADR 0002 — Mídia da Histopatologia

- **Estado:** aceito
- **Data:** 2026-08-09
- **Decisores:** equipe editorial do Domine Aqui

## Decisão

As duas fontes catalogadas estão aprovadas para exibição remota no módulo:

| Fonte | Estado |
| --- | --- |
| Atlas de Anatomia Patológica — FCM/Unicamp | Direitos aprovados |
| Histopathology Atlas / patolojiAI | Direitos aprovados |

As imagens continuam hospedadas e servidas pelas instituições de origem. O Domine Aqui mantém o crédito e o link para a página-fonte junto de cada item e não armazena cópias locais.

O filtro de domínios permanece ativo para impedir que selos, rastreadores e outros recursos externos capturados pelo catálogo sejam tratados como lâminas.

## Implementação

- `lib/histopatologia/direitos.ts` registra a autorização das duas fontes.
- `lib/histopatologia/midia.ts` libera a URL remota apenas para fontes aprovadas e domínios permitidos.
- A revisão biomédica do texto didático continua independente da autorização das imagens.
