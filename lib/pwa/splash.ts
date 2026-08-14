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
 * o retângulo vazio de sempre. Por isso a lista abaixo é uma tabela de
 * aparelhos, e por isso ela precisa crescer quando a Apple lança tela nova.
 *
 * As imagens são geradas por `npm run pwa:splash`
 * (scripts/pwa/gerar-telas-de-partida.py) e versionadas em
 * `public/pwa/splash/`.
 *
 * Retrato E paisagem. O manifest pede `orientation: 'portrait'`, mas isso
 * governa como o app se comporta DEPOIS de aberto — não a orientação em que o
 * aparelho estava no instante do toque no ícone. Quem abre o app deitado na
 * cama, com a trava de rotação desligada, não casava com nenhuma entrada e via
 * exatamente o retângulo preto que este arquivo veio eliminar.
 *
 * IMPORTANTE ao aparecer um iPhone novo: se o aparelho não estiver na tabela,
 * nenhuma imagem casa e ele volta a abrir preto. Acrescente a linha com as
 * medidas em pixels CSS e rode `npm run pwa:splash` de novo.
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

const APARELHOS: AparelhoDePartida[] = [
  // ── iPhone ────────────────────────────────────────────────
  { larguraCss: 320, alturaCss: 568, densidade: 2, aparelhos: 'iPhone SE (1ª), 5s' },
  { larguraCss: 375, alturaCss: 667, densidade: 2, aparelhos: 'iPhone SE (2ª/3ª), 6, 7, 8' },
  { larguraCss: 414, alturaCss: 736, densidade: 3, aparelhos: 'iPhone 6+, 7+, 8+' },
  { larguraCss: 375, alturaCss: 812, densidade: 3, aparelhos: 'iPhone X, XS, 11 Pro, 12 mini, 13 mini' },
  { larguraCss: 414, alturaCss: 896, densidade: 2, aparelhos: 'iPhone XR, 11' },
  { larguraCss: 414, alturaCss: 896, densidade: 3, aparelhos: 'iPhone XS Max, 11 Pro Max' },
  { larguraCss: 390, alturaCss: 844, densidade: 3, aparelhos: 'iPhone 12, 12 Pro, 13, 13 Pro, 14' },
  { larguraCss: 428, alturaCss: 926, densidade: 3, aparelhos: 'iPhone 12/13 Pro Max, 14 Plus' },
  { larguraCss: 393, alturaCss: 852, densidade: 3, aparelhos: 'iPhone 14 Pro, 15, 15 Pro, 16' },
  { larguraCss: 430, alturaCss: 932, densidade: 3, aparelhos: 'iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus' },
  { larguraCss: 402, alturaCss: 874, densidade: 3, aparelhos: 'iPhone 16 Pro' },
  { larguraCss: 440, alturaCss: 956, densidade: 3, aparelhos: 'iPhone 16 Pro Max' },
  // ── iPad ──────────────────────────────────────────────────
  { larguraCss: 768, alturaCss: 1024, densidade: 2, aparelhos: 'iPad 9.7", mini' },
  { larguraCss: 810, alturaCss: 1080, densidade: 2, aparelhos: 'iPad 10.2"' },
  { larguraCss: 820, alturaCss: 1180, densidade: 2, aparelhos: 'iPad Air 10.9", iPad 10.9"' },
  { larguraCss: 834, alturaCss: 1112, densidade: 2, aparelhos: 'iPad Pro 10.5", Air 10.5"' },
  { larguraCss: 834, alturaCss: 1194, densidade: 2, aparelhos: 'iPad Pro 11"' },
  { larguraCss: 1024, alturaCss: 1366, densidade: 2, aparelhos: 'iPad Pro 12.9"' },
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
