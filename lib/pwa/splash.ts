/**
 * Telas de partida (splash screens) do app instalado no iPhone/iPad.
 *
 * Por que isto existe: quando alguém toca no ícone do DomineAqui na tela de
 * início do iPhone, o Safari abre a WebView e fica esperando o HTML chegar. Sem
 * `apple-touch-startup-image`, o que aparece nesse intervalo é um retângulo
 * vazio — preto, no aparelho em tema escuro. Para quem tocou no ícone de um
 * app, tela preta parada não parece "carregando": parece que quebrou. O
 * Android não tem esse problema porque o Chrome monta a tela de abertura
 * sozinho, a partir do `background_color` e do ícone do manifest.
 *
 * O iOS escolhe a imagem por MEDIA QUERY EXATA: largura e altura em pixels CSS
 * mais a densidade da tela. Não existe "aproximado" — ou casa, ou o iOS mostra
 * o retângulo vazio de sempre.
 *
 * Duas defesas contra isso, porque uma tabela sozinha envelhece:
 *
 * 1. A tabela abaixo cobre todo aparelho iOS já lançado, incluindo os tamanhos
 *    que o Zoom de Tela produz (o iOS reporta uma resolução lógica MENOR
 *    quando o usuário liga "Ampliado" nos ajustes de exibição — um aparelho
 *    coberto vira um aparelho descoberto só por causa dessa opção).
 * 2. Duas entradas de reserva que casam com QUALQUER aparelho, filtrando só
 *    pela orientação, declaradas ANTES das específicas. Aparelho que ninguém
 *    previu — o iPhone do ano que vem — cai nelas e abre com a marca, um
 *    pouco reescalada, em vez de abrir preto. As específicas continuam
 *    vencendo onde existem.
 *
 * As imagens são geradas por `npm run pwa:splash`
 * (scripts/pwa/gerar-telas-de-partida.py) e versionadas em
 * `public/pwa/splash/`.
 *
 * Retrato E paisagem. O manifest pede `orientation: 'portrait'`, mas isso
 * governa como o app se comporta DEPOIS de aberto — não a orientação em que o
 * aparelho estava no instante do toque no ícone.
 *
 * AO SURGIR UM APARELHO NOVO: acrescente a linha com as medidas em pixels CSS
 * e rode `npm run pwa:splash`. Até lá ele usa a reserva, que é uma degradação
 * aceitável — nunca mais um retângulo preto.
 */

export interface AparelhoDePartida {
  /** Largura da tela em pixels CSS, em retrato. */
  larguraCss: number
  /** Altura da tela em pixels CSS, em retrato. */
  alturaCss: number
  /** Densidade da tela (device pixel ratio). */
  densidade: number
  /** Aparelhos cobertos por esta entrada — documentação, não é usado em código. */
  aparelhos: string
}

export type Orientacao = 'portrait' | 'landscape'

export interface TelaDePartida extends AparelhoDePartida {
  orientacao: Orientacao
}

/** Tela de reserva: casa com qualquer aparelho, só filtra a orientação. */
export interface TelaDeReserva {
  orientacao: Orientacao
  larguraPx: number
  alturaPx: number
}

const APARELHOS: AparelhoDePartida[] = [
  // ── iPhone: era pré-Retina e Retina 3,5"/4" ──────────────
  { larguraCss: 320, alturaCss: 480, densidade: 1, aparelhos: 'iPhone (1ª), 3G, 3GS' },
  { larguraCss: 320, alturaCss: 480, densidade: 2, aparelhos: 'iPhone 4, 4s' },
  { larguraCss: 320, alturaCss: 568, densidade: 2, aparelhos: 'iPhone 5, 5c, 5s, SE (1ª)' },

  // ── iPhone 4,7" e 5,5" ───────────────────────────────────
  { larguraCss: 375, alturaCss: 667, densidade: 2, aparelhos: 'iPhone 6, 6s, 7, 8, SE (2ª), SE (3ª)' },
  { larguraCss: 414, alturaCss: 736, densidade: 3, aparelhos: 'iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus' },
  { larguraCss: 375, alturaCss: 667, densidade: 3, aparelhos: 'iPhone 6/7/8 Plus com Zoom de Tela' },

  // ── iPhone com entalhe (Face ID), 2017–2019 ──────────────
  { larguraCss: 375, alturaCss: 812, densidade: 3, aparelhos: 'iPhone X, XS, 11 Pro, 12 mini, 13 mini' },
  { larguraCss: 414, alturaCss: 896, densidade: 2, aparelhos: 'iPhone XR, 11' },
  { larguraCss: 414, alturaCss: 896, densidade: 3, aparelhos: 'iPhone XS Max, 11 Pro Max' },
  { larguraCss: 375, alturaCss: 812, densidade: 2, aparelhos: 'iPhone XR/11 com Zoom de Tela' },

  // ── iPhone 12 em diante ──────────────────────────────────
  { larguraCss: 390, alturaCss: 844, densidade: 3, aparelhos: 'iPhone 12, 12 Pro, 13, 13 Pro, 14, 16e' },
  { larguraCss: 428, alturaCss: 926, densidade: 3, aparelhos: 'iPhone 12 Pro Max, 13 Pro Max, 14 Plus' },
  { larguraCss: 393, alturaCss: 852, densidade: 3, aparelhos: 'iPhone 14 Pro, 15, 15 Pro, 16' },
  { larguraCss: 430, alturaCss: 932, densidade: 3, aparelhos: 'iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus' },
  { larguraCss: 402, alturaCss: 874, densidade: 3, aparelhos: 'iPhone 16 Pro, 17, 17 Pro' },
  { larguraCss: 440, alturaCss: 956, densidade: 3, aparelhos: 'iPhone 16 Pro Max, 17 Pro Max' },
  { larguraCss: 420, alturaCss: 912, densidade: 3, aparelhos: 'iPhone Air' },
  { larguraCss: 320, alturaCss: 693, densidade: 3, aparelhos: 'iPhone 12/13/14/15/16 com Zoom de Tela' },

  // ── iPad ─────────────────────────────────────────────────
  { larguraCss: 768, alturaCss: 1024, densidade: 1, aparelhos: 'iPad (1ª, 2ª), iPad mini (1ª)' },
  { larguraCss: 768, alturaCss: 1024, densidade: 2, aparelhos: 'iPad 3ª–6ª, Air, Air 2, mini 2–5, Pro 9,7"' },
  { larguraCss: 744, alturaCss: 1133, densidade: 2, aparelhos: 'iPad mini 6ª, 7ª (8,3")' },
  { larguraCss: 810, alturaCss: 1080, densidade: 2, aparelhos: 'iPad 7ª, 8ª, 9ª (10,2")' },
  { larguraCss: 820, alturaCss: 1180, densidade: 2, aparelhos: 'iPad Air 4ª–6ª, iPad 10ª, 11ª (10,9"/11")' },
  { larguraCss: 834, alturaCss: 1112, densidade: 2, aparelhos: 'iPad Pro 10,5", Air 3ª' },
  { larguraCss: 834, alturaCss: 1194, densidade: 2, aparelhos: 'iPad Pro 11" (todas), Air 11" M2/M3' },
  { larguraCss: 1024, alturaCss: 1366, densidade: 2, aparelhos: 'iPad Pro 12,9" / 13"' },
]

/**
 * Reserva dimensionada pelo maior iPhone atual (proporção ~2,17:1), que é a
 * proporção para onde os aparelhos novos vêm convergindo. Numa tela de
 * proporção diferente o iOS reescala — e como o desenho é fundo chapado com o
 * ícone no centro, reescalar quase não se percebe.
 */
export const TELAS_DE_RESERVA: TelaDeReserva[] = [
  { orientacao: 'portrait', larguraPx: 1320, alturaPx: 2868 },
  { orientacao: 'landscape', larguraPx: 2868, alturaPx: 1320 },
]

/** Cor de fundo da tela de partida — a mesma do `background_color` do manifest. */
export const COR_DE_FUNDO_DA_PARTIDA = '#0B1F1A'

/** Cada aparelho vira duas telas: uma em retrato e uma em paisagem. */
export const TELAS_DE_PARTIDA: TelaDePartida[] = APARELHOS.flatMap((aparelho) => [
  { ...aparelho, orientacao: 'portrait' as const },
  { ...aparelho, orientacao: 'landscape' as const },
])

export function arquivoDaTelaDePartida(tela: TelaDePartida): string {
  const sufixo = tela.orientacao === 'landscape' ? '-paisagem' : ''
  return `/pwa/splash/partida-${tela.larguraCss}x${tela.alturaCss}@${tela.densidade}x${sufixo}.png`
}

export function arquivoDaTelaDeReserva(tela: TelaDeReserva): string {
  const sufixo = tela.orientacao === 'landscape' ? '-paisagem' : ''
  return `/pwa/splash/partida-reserva${sufixo}.png`
}

/**
 * `device-width`/`device-height` descrevem a tela FÍSICA e não giram com o
 * aparelho, então as duas orientações usam os mesmos números — o que muda é a
 * cláusula `orientation` e, no arquivo, a proporção da imagem.
 */
export function mediaDaTelaDePartida(tela: TelaDePartida): string {
  return [
    `(device-width: ${tela.larguraCss}px)`,
    `(device-height: ${tela.alturaCss}px)`,
    `(-webkit-device-pixel-ratio: ${tela.densidade})`,
    `(orientation: ${tela.orientacao})`,
  ].join(' and ')
}

export function mediaDaTelaDeReserva(tela: TelaDeReserva): string {
  return `(orientation: ${tela.orientacao})`
}
