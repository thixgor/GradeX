/**
 * Valores normais de referência do ECG do adulto.
 *
 * Cada medida exibida no simulador (FC, PR, QRS, QT, QTc, eixo, RR e amplitude
 * de R) ganha aqui a sua faixa de normalidade e o classificador que diz se o
 * valor medido está dentro, abaixo ou acima dela. Os limiares seguem as
 * recomendações AHA/ACCF/HRS para padronização do ECG (2009) e os textos de
 * referência do módulo (Goldberger; Marriott; Chou; Hampton) — os mesmos que
 * o laudo automático (`lib/ecg/report.ts`) já usa, para que card e laudo nunca
 * se contradigam.
 *
 * `faixa` é o texto curto impresso no card (sem unidade — o card já mostra a
 * unidade ao lado do valor); `detalhe` é a explicação completa, exibida no
 * tooltip.
 */

export type RefStatus = 'normal' | 'baixo' | 'alto' | 'neutro'

export interface RefValue {
  /** Faixa normal em texto compacto, para caber sob o valor. */
  faixa: string
  /** Explicação completa da faixa (tooltip). */
  detalhe: string
  /** Classifica a medida; `neutro` = sem julgamento automático possível. */
  classificar: (v: number | null) => RefStatus
}

/** Classificador genérico de faixa fechada. */
const entre = (min: number, max: number) => (v: number | null): RefStatus =>
  v == null ? 'neutro' : v < min ? 'baixo' : v > max ? 'alto' : 'normal'

/** Normaliza um ângulo qualquer para −180°..180°. */
function normalizarAngulo(a: number): number {
  let x = a
  while (x > 180) x -= 360
  while (x < -180) x += 360
  return x
}

export const ECG_REFERENCIA = {
  hr: {
    faixa: '60–100',
    detalhe: 'FC normal do adulto em repouso: 60–100 bpm. < 60 = bradicardia; > 100 = taquicardia.',
    classificar: entre(60, 100),
  },
  pr: {
    faixa: '120–200',
    detalhe: 'Intervalo PR normal: 120–200 ms. < 120 ms sugere pré-excitação (WPW) ou ritmo juncional; > 200 ms define BAV de 1º grau.',
    classificar: entre(120, 200),
  },
  qrs: {
    faixa: '< 120',
    detalhe: 'QRS normal (estreito): < 120 ms — tipicamente 80–110 ms. ≥ 120 ms indica condução intraventricular aberrante (BRD, BRE, ritmo ventricular, pré-excitação).',
    classificar: (v) => (v == null ? 'neutro' : v >= 120 ? 'alto' : 'normal'),
  },
  qt: {
    faixa: '350–440',
    detalhe: 'QT absoluto varia com a frequência cardíaca (encurta na taquicardia, alonga na bradicardia) — por isso a leitura válida é a do QTc. Faixa habitual em FC normal: 350–440 ms.',
    // Sem julgamento automático: um QT de 320 ms é normal a 110 bpm e curto a
    // 55 bpm. Quem decide é o QTc, ao lado.
    classificar: () => 'neutro',
  },
  qtc: {
    faixa: '350–460',
    detalhe: 'QTc (Bazett) normal: ≤ 450 ms em homens e ≤ 460 ms em mulheres (adotamos o limite mais permissivo). > 500 ms = alto risco de torsades. < 350 ms = QT curto.',
    classificar: (v) => (v == null ? 'neutro' : v < 350 ? 'baixo' : v > 460 ? 'alto' : 'normal'),
  },
  axis: {
    faixa: '−30 a +90°',
    detalhe: 'Eixo elétrico do QRS normal no plano frontal: −30° a +90°. Além de +90° = desvio para a direita; aquém de −30° = desvio para a esquerda; −90° a −180° = desvio extremo (noroeste).',
    classificar: (v) => {
      if (v == null) return 'neutro'
      const a = normalizarAngulo(v)
      if (a >= -30 && a <= 90) return 'normal'
      return a > 90 ? 'alto' : 'baixo'
    },
  },
  rr: {
    faixa: '600–1000',
    detalhe: 'Intervalo RR de 600–1000 ms corresponde a FC de 60–100 bpm (FC = 60000 / RR). RR > 1000 ms = bradicardia; < 600 ms = taquicardia.',
    classificar: entre(600, 1000),
  },
  rAmp: {
    faixa: '0.5–2.0',
    detalhe: 'Amplitude da onda R em DII: 0,5–2,0 mV. Acima disso, considere critérios de voltagem para sobrecarga ventricular; QRS < 0,5 mV em todas as derivações dos membros define baixa voltagem (derrame, obesidade, DPOC, amiloidose).',
    classificar: entre(0.5, 2),
  },
} satisfies Record<string, RefValue>

export type RefKey = keyof typeof ECG_REFERENCIA

/** Faixa + status de uma medida, prontos para o card. */
export function referenciaDe(chave: RefKey, valor: number | null): { faixa: string; detalhe: string; status: RefStatus } {
  const r = ECG_REFERENCIA[chave]
  return { faixa: r.faixa, detalhe: r.detalhe, status: r.classificar(valor) }
}
