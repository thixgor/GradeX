/**
 * Quais figuras aceitam ser varridas pelo aluno, e em que faixa.
 *
 * Esta é a parte do módulo que uma fotografia nunca faz. A pergunta clínica
 * real não é "como é a icterícia" — é **"isto já é amarelo o bastante?"**, e
 * essa pergunta só se responde vendo a transição. Um controle deslizante
 * transforma o limiar de detecção de um número decorado ("2,5 mg/dL") em coisa
 * observada: o aluno arrasta, não vê nada acontecer, continua arrastando e o
 * amarelo nasce — na esclera primeiro, na pele depois, com o atraso que a
 * afinidade pela elastina explica.
 *
 * Só aparece controle onde o parâmetro é **clinicamente significativo**. Botar
 * um deslizador em tudo viraria enfeite e ensinaria que qualquer variação da
 * figura carrega informação, o que é falso.
 */
export interface ControleDeIlustracao {
  param: string
  rotulo: string
  min: number
  max: number
  passo: number
  padrao: number
  /** Como o valor é lido em voz alta e escrito na tela. */
  formatar: (valor: number) => string
  /** Marcos anotados na régua — os limiares que importam. */
  marcos?: { valor: number; rotulo: string }[]
}

export const CONTROLES: Record<string, ControleDeIlustracao> = {
  ictericia: {
    param: 'bilirrubina',
    rotulo: 'Bilirrubina total',
    min: 0.5,
    max: 25,
    passo: 0.5,
    padrao: 8,
    formatar: (v) => `${v.toFixed(1)} mg/dL`,
    marcos: [
      { valor: 2.5, rotulo: 'limiar escleral' },
      { valor: 5, rotulo: 'pele começa' },
      { valor: 15, rotulo: 'icterícia franca' },
    ],
  },
  jugular: {
    param: 'altura',
    rotulo: 'Pressão venosa jugular',
    min: 3,
    max: 20,
    passo: 1,
    padrao: 7,
    formatar: (v) => `${v.toFixed(0)} cmH₂O`,
    marcos: [{ valor: 8, rotulo: 'limite superior' }],
  },
  baqueteamento: {
    param: 'grau',
    rotulo: 'Grau',
    min: 0,
    max: 3,
    passo: 0.5,
    padrao: 2,
    formatar: (v) => (v < 0.5 ? 'normal' : v < 1.5 ? 'incipiente' : v < 2.5 ? 'evidente' : 'avançado'),
    marcos: [{ valor: 1.7, rotulo: 'Lovibond 180°' }],
  },
  'enchimento-capilar': {
    param: 'segundos',
    rotulo: 'Tempo de enchimento',
    min: 1,
    max: 8,
    passo: 0.5,
    padrao: 4,
    formatar: (v) => `${v.toFixed(1)} s`,
    marcos: [{ valor: 3, rotulo: 'limite' }],
  },
  palidez: {
    param: 'hemoglobina',
    rotulo: 'Hemoglobina',
    min: 3,
    max: 15,
    passo: 0.5,
    padrao: 7,
    formatar: (v) => `${v.toFixed(1)} g/dL`,
    marcos: [
      { valor: 7, rotulo: 'gatilho transfusional usual' },
      { valor: 12, rotulo: 'limite inferior' },
    ],
  },
  ascite: {
    param: 'volume',
    rotulo: 'Volume de líquido',
    min: 0,
    max: 5,
    passo: 1,
    padrao: 3,
    formatar: (v) => ['sem ascite', '~500 mL', '~1,5 L (limiar clínico)', '~3 L', '~6 L', '~10 L'][Math.round(v)] ?? '',
    marcos: [{ valor: 2, rotulo: 'detectável ao exame' }],
  },
}
