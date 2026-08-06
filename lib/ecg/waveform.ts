/**
 * Formas de onda elementares do eletrocardiograma.
 *
 * Um traçado feito só de gaussianas parece um ECG de longe e denuncia o truque
 * de perto: a R vira uma bolha arredondada, a T fica simétrica (quando a T real
 * sobe devagar e desce rápido) e as caudas infinitas da gaussiana sujam o
 * segmento PR e o TP, que no traçado real são planos de verdade.
 *
 * Aqui ficam as três formas que resolvem isso, todas com SUPORTE COMPACTO — ou
 * seja, valem zero fora da própria janela, o que faz cada onda começar e
 * terminar exatamente onde o relógio do batimento diz que ela começa e termina:
 *
 *  - `spike`  → q, R, S e R′: limbos retos e ápice agudo, como no papel;
 *  - `dome`   → P e U: cúpula arredondada, saindo e voltando à linha de base
 *               com derivada nula (sem "bico" na saída);
 *  - `tWave`  → onda T: subida lenta e descida mais curta e íngreme.
 *
 * Todas recebem e devolvem milivolts, com o tempo em milissegundos.
 */

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

/** Meia-cossenoide 0→1: sobe suave, chega ao topo com derivada nula. */
const halfCos = (u: number) => 0.5 * (1 - Math.cos(Math.PI * clamp01(u)))

/** Suavização cúbica clássica (3u² − 2u³), usada em rampas de segmento. */
export const smoothstep = (u: number) => {
  const x = clamp01(u)
  return x * x * (3 - 2 * x)
}

/**
 * Deflexão rápida de limbos retos e ápice agudo — a forma real do QRS.
 *
 * `left` e `right` são as durações (ms) da subida e da descida, medidas a
 * partir do pico; deixá-las diferentes é o que dá ao R a assimetria de sempre
 * (sobe um pouco mais devagar do que desce) e faz a S voltar à linha de base
 * exatamente no ponto J.
 *
 * `round` é a fração do limbo gasta arredondando o ápice: 0 daria um bico
 * matematicamente perfeito, que não existe em papel térmico nem em tela.
 */
export function spike(
  t: number,
  amp: number,
  peak: number,
  left: number,
  right: number,
  round = 0.16,
): number {
  if (!amp) return 0
  const half = t < peak ? left : right
  if (half <= 0) return 0
  const u = 1 - Math.abs(t - peak) / half
  if (u <= 0) return 0
  const r = Math.min(0.9, Math.max(0.02, round))
  const a = 1 - r
  const k = 1 / (1 - r / 2)
  // reta até (1 − r) e parábola de derivada nula no topo — C¹ na emenda
  const f = u <= a ? k * u : k * (u - ((u - a) * (u - a)) / (2 * r))
  return amp * f
}

/**
 * Cúpula arredondada com início e fim exatos (onda P, onda U).
 * O pico pode ficar fora do meio: é assim que a P de sobrecarga direita fica
 * com o corcovo adiantado.
 */
export function dome(t: number, amp: number, onset: number, peak: number, offset: number): number {
  if (!amp || t <= onset || t >= offset) return 0
  return amp * (t < peak
    ? halfCos((t - onset) / (peak - onset))
    : halfCos((offset - t) / (offset - peak)))
}

/**
 * Onda T normal: sobe devagar, desce rápido.
 *
 * A assimetria vem da própria posição do pico (por volta de 60% da duração da
 * onda) somada ao expoente < 1 no ramo descendente, que "enche" a descida e a
 * deixa quase reta antes de encostar na linha de base — exatamente o desenho
 * que se usa para diferenciar a T normal da T simétrica da isquemia.
 */
export function tWave(
  t: number,
  amp: number,
  onset: number,
  peak: number,
  offset: number,
  fullness = 0.78,
): number {
  if (!amp || t <= onset || t >= offset) return 0
  if (t < peak) return amp * halfCos((t - onset) / (peak - onset))
  return amp * Math.pow(halfCos((offset - t) / (offset - peak)), fullness)
}

/**
 * Deslocamento sustentado de um segmento (ST supra/infra).
 * Sobe no ponto J, mantém o platô e se dissolve dentro da onda T — que é como
 * a corrente de lesão aparece no traçado: ela não "acaba", ela se funde à T.
 */
export function plateau(
  t: number,
  amp: number,
  from: number,
  to: number,
  ramp = 24,
): number {
  if (!amp) return 0
  const start = from - ramp * 0.5
  if (t <= start || t >= to) return 0
  const rise = smoothstep((t - start) / ramp)
  const decay = smoothstep((to - t) / Math.max(ramp, (to - from) * 0.55))
  return amp * rise * decay
}
