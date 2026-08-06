/**
 * Paletas do papel de eletrocardiograma.
 *
 * Duas, e só duas, porque são as duas que existem na vida real:
 *
 *  - `claro`  — o papel térmico de verdade: fundo creme-arrosado, quadriculado
 *               vermelho impresso e traçado em tinta preta. É o que se recebe
 *               na mão no pronto-socorro e o que cai na prova;
 *  - `verde`  — o monitor hospitalar: fundo preto, grade verde discreta e
 *               traçado em fósforo verde. É o que se vê na beira do leito.
 *
 * O módulo é puro de propósito: o <canvas> do simulador, o SVG dos
 * laboratórios da trilha e o seletor de tema em React leem todos daqui, então
 * "claro" quer dizer exatamente a mesma coisa nos três lugares.
 */

export type EcgPaperTheme = 'claro' | 'verde'

/** Cores de anotação (colchetes, cursores, faixas) legíveis sobre o papel. */
export interface EcgAnnotColors {
  sky: string
  amber: string
  pink: string
  emerald: string
  violet: string
  orange: string
  rose: string
  slate: string
}

export interface EcgPaperPalette {
  key: EcgPaperTheme
  /** nome curto para o botão de troca */
  label: string
  /** descrição do que a pessoa vai ver */
  hint: string
  /** fundo do papel */
  bg: string
  /** linha fina do quadriculado (1 mm) */
  gridFine: string
  /** linha grossa do quadriculado (5 mm) */
  gridBold: string
  /** traçado do ECG */
  trace: string
  /** traçado de um padrão grave (marca-passo sem captura, por exemplo) */
  traceBad: string
  /** traçado secundário: batimento de referência, trecho ainda não construído */
  ghost: string
  /** linha isoelétrica tracejada */
  baseline: string
  /** rótulos sobre o papel (nome da derivação, medidas) */
  ink: string
  /** texto auxiliar sobre o papel */
  inkSoft: string
  /** moldura do papel */
  border: string
  /** pulso de calibração de 1 mV */
  calibration: string
  annot: EcgAnnotColors
}

export const ECG_PAPER_LIGHT: EcgPaperPalette = {
  key: 'claro',
  label: 'Claro',
  hint: 'Papel milimetrado impresso',
  bg: '#fdf5f1',
  gridFine: 'rgba(221,120,96,0.48)',
  gridBold: 'rgba(196,63,45,0.62)',
  trace: '#17120f',
  traceBad: '#b91c1c',
  ghost: 'rgba(63,45,40,0.34)',
  baseline: 'rgba(120,70,58,0.45)',
  ink: '#7c2d12',
  inkSoft: 'rgba(124,45,18,0.65)',
  border: 'rgba(198,110,86,0.42)',
  calibration: '#a16207',
  annot: {
    sky: '#0369a1', amber: '#a16207', pink: '#be185d', emerald: '#047857',
    violet: '#6d28d9', orange: '#c2410c', rose: '#be123c', slate: '#475569',
  },
}

export const ECG_PAPER_GREEN: EcgPaperPalette = {
  key: 'verde',
  label: 'Hospitalar',
  hint: 'Monitor verde de beira de leito',
  bg: '#07100c',
  gridFine: 'rgba(45,160,90,0.20)',
  gridBold: 'rgba(45,200,110,0.38)',
  trace: '#3ff08a',
  traceBad: '#fb7185',
  ghost: 'rgba(148,163,184,0.30)',
  baseline: 'rgba(148,163,184,0.32)',
  ink: '#6ee7b7',
  inkSoft: 'rgba(148,163,184,0.78)',
  border: 'rgba(16,185,129,0.24)',
  calibration: '#fbbf24',
  annot: {
    sky: '#38bdf8', amber: '#facc15', pink: '#f472b6', emerald: '#34d399',
    violet: '#a78bfa', orange: '#fb923c', rose: '#fb7185', slate: '#94a3b8',
  },
}

export const ECG_PAPERS: Record<EcgPaperTheme, EcgPaperPalette> = {
  claro: ECG_PAPER_LIGHT,
  verde: ECG_PAPER_GREEN,
}

/** O padrão do produto: papel claro — é nele que o ECG é lido e provado. */
export const ECG_PAPER_DEFAULT: EcgPaperTheme = 'claro'

export function ecgPalette(theme: EcgPaperTheme): EcgPaperPalette {
  return ECG_PAPERS[theme] ?? ECG_PAPER_LIGHT
}

/** Cor com opacidade, aceitando hex (#rgb/#rrggbb) ou rgba() já pronto. */
export function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('rgba')) return color.replace(/[\d.]+\)$/, `${alpha})`)
  if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
  const hex = color.replace('#', '')
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
