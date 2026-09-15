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

/**
 * Controles por **cena**, para as figuras que servem várias cenas com o mesmo
 * componente — o ultrassom é uma só ilustração com dezenas de janelas dentro.
 *
 * A chave é `id:cena`. O mesmo critério de cima vale aqui: só ganha controle o
 * parâmetro que tem limiar clínico. Contar linhas B importa porque três por
 * campo é o corte; o diâmetro da aorta importa porque 3 cm é aneurisma e
 * 5,5 cm é cirurgia. Um deslizador que só deixa a figura "mais bonita" não
 * entra.
 */
export const CONTROLES_DE_CENA: Record<string, ControleDeIlustracao> = {
  'ultrassom:pulmao-linhas-b': {
    param: 'linhasB',
    rotulo: 'Linhas B por campo',
    min: 0,
    max: 10,
    passo: 1,
    padrao: 5,
    formatar: (v) => `${v.toFixed(0)} linha${v === 1 ? '' : 's'} B`,
    marcos: [{ valor: 3, rotulo: 'campo positivo' }],
  },
  'ultrassom:pulmao-linhas-b-focal': {
    param: 'linhasB',
    rotulo: 'Linhas B no campo afetado',
    min: 0,
    max: 10,
    passo: 1,
    padrao: 5,
    formatar: (v) => `${v.toFixed(0)} linha${v === 1 ? '' : 's'} B`,
    marcos: [{ valor: 3, rotulo: 'campo positivo' }],
  },
  'ultrassom:consolidacao': {
    param: 'profundidade',
    rotulo: 'Profundidade da consolidação',
    min: 0.5,
    max: 5,
    passo: 0.5,
    padrao: 3,
    formatar: (v) => `${v.toFixed(1)} cm`,
  },
  'ultrassom:fast-positivo': {
    param: 'liquido',
    rotulo: 'Espessura da faixa de líquido',
    min: 0.5,
    max: 6,
    passo: 0.5,
    padrao: 3.2,
    formatar: (v) => `${v.toFixed(1)} cm`,
    marcos: [{ valor: 1, rotulo: 'limiar de detecção' }],
  },
  'ultrassom:derrame-pericardico': {
    param: 'derrame',
    rotulo: 'Lâmina de derrame',
    min: 1,
    max: 8,
    passo: 0.5,
    padrao: 5,
    formatar: (v) => `${(v * 2.5).toFixed(0)} mm`,
    marcos: [
      { valor: 2, rotulo: 'pequeno' },
      { valor: 4, rotulo: 'moderado' },
      { valor: 6, rotulo: 'colapso de VD' },
    ],
  },
  'ultrassom:plax-disfuncao-ve': {
    param: 'fracaoEjecao',
    rotulo: 'Fração de ejeção estimada',
    min: 10,
    max: 70,
    passo: 5,
    padrao: 25,
    formatar: (v) => `${v.toFixed(0)}%`,
    marcos: [
      { valor: 30, rotulo: 'gravemente reduzida' },
      { valor: 50, rotulo: 'limite inferior' },
    ],
  },
  'ultrassom:psax-vd-dilatado': {
    param: 'razaoVdVe',
    rotulo: 'Razão VD/VE',
    min: 0.3,
    max: 1.5,
    passo: 0.1,
    padrao: 1.2,
    formatar: (v) => v.toFixed(1),
    marcos: [
      { valor: 0.6, rotulo: 'normal' },
      { valor: 1, rotulo: 'dilatação franca' },
    ],
  },
  'ultrassom:aneurisma-aorta': {
    param: 'diametro',
    rotulo: 'Diâmetro externo',
    min: 1,
    max: 8,
    passo: 0.5,
    padrao: 5.5,
    formatar: (v) => `${v.toFixed(1)} cm`,
    marcos: [
      { valor: 3, rotulo: 'aneurisma' },
      { valor: 5.5, rotulo: 'reparo eletivo' },
    ],
  },
  'ultrassom:colelitiase': {
    param: 'calculos',
    rotulo: 'Número de cálculos',
    min: 0,
    max: 10,
    passo: 1,
    padrao: 3,
    formatar: (v) => (v === 0 ? 'nenhum' : `${v.toFixed(0)} cálculo${v === 1 ? '' : 's'}`),
  },
  'ultrassom:colecistite': {
    param: 'parede',
    rotulo: 'Espessura da parede',
    min: 2,
    max: 8,
    passo: 1,
    padrao: 6,
    formatar: (v) => `${v.toFixed(0)} mm`,
    marcos: [{ valor: 3, rotulo: 'limite superior' }],
  },
  'ultrassom:coledoco-dilatado': {
    param: 'diametro',
    rotulo: 'Diâmetro do colédoco',
    min: 2,
    max: 20,
    passo: 1,
    padrao: 11,
    formatar: (v) => `${v.toFixed(0)} mm`,
    marcos: [
      { valor: 6, rotulo: 'limite superior' },
      { valor: 10, rotulo: 'tolerado pós-colecistectomia' },
    ],
  },
  'ultrassom:hidronefrose': {
    param: 'grau',
    rotulo: 'Grau de hidronefrose',
    min: 0,
    max: 4,
    passo: 1,
    padrao: 3,
    formatar: (v) => ['sem dilatação', 'leve (pelve)', 'moderada (cálices)', 'acentuada', 'grave (córtex afinado)'][Math.round(v)] ?? '',
  },
  'ultrassom:retencao-urinaria': {
    param: 'volume',
    rotulo: 'Volume vesical estimado',
    min: 0,
    max: 1500,
    passo: 50,
    padrao: 800,
    formatar: (v) => `${v.toFixed(0)} mL`,
    marcos: [
      { valor: 300, rotulo: 'globo palpável' },
      { valor: 500, rotulo: 'retenção' },
    ],
  },
  'ultrassom:tvp': {
    param: 'compressibilidade',
    rotulo: 'Quanto a veia colaba',
    min: 0,
    max: 100,
    passo: 10,
    padrao: 10,
    formatar: (v) => `${v.toFixed(0)}%`,
    marcos: [{ valor: 100, rotulo: 'colapso completo = normal' }],
  },
  'ultrassom:abscesso': {
    param: 'diametro',
    rotulo: 'Diâmetro da coleção',
    min: 0.5,
    max: 10,
    passo: 0.5,
    padrao: 4,
    formatar: (v) => `${v.toFixed(1)} cm`,
  },
  'otoscopia:colesteatoma': {
    param: 'area',
    rotulo: 'Área ocupada pela massa',
    min: 5,
    max: 80,
    passo: 5,
    padrao: 30,
    formatar: (v) => `${v.toFixed(0)}% do campo`,
  },
  'otoscopia:otite-media-cronica': {
    param: 'diametro',
    rotulo: 'Diâmetro da perfuração',
    min: 1,
    max: 10,
    passo: 1,
    padrao: 7,
    formatar: (v) => `${v.toFixed(0)} mm`,
    marcos: [{ valor: 4, rotulo: 'pequena' }],
  },
  'otoscopia:timpano-retraido': {
    param: 'retracao',
    rotulo: 'Profundidade da retração',
    min: 0,
    max: 5,
    passo: 0.5,
    padrao: 4,
    formatar: (v) => `${v.toFixed(1)} mm`,
    marcos: [
      { valor: 1, rotulo: 'cone de luz some' },
      { valor: 5, rotulo: 'sobre o promontório' },
    ],
  },
  'fundoscopia:descolamento-de-retina': {
    param: 'extensao',
    rotulo: 'Extensão do descolamento',
    min: 5,
    max: 100,
    passo: 5,
    padrao: 45,
    formatar: (v) => `${v.toFixed(0)}%`,
    marcos: [{ valor: 60, rotulo: 'mácula ameaçada' }],
  },
  'fundoscopia:oclusao-arterial-central': {
    param: 'palidez',
    rotulo: 'Palidez retiniana',
    min: 0,
    max: 3,
    passo: 1,
    padrao: 2,
    formatar: (v) => ['ausente', 'leve', 'evidente', 'intensa'][Math.round(v)] ?? '',
  },
  'fundoscopia:hemorragia-vitrea': {
    param: 'obscurecido',
    rotulo: 'Fundo obscurecido',
    min: 0,
    max: 100,
    passo: 10,
    padrao: 60,
    formatar: (v) => `${v.toFixed(0)}%`,
    marcos: [{ valor: 80, rotulo: 'papila invisível' }],
  },
  'fundoscopia:papila-palida': {
    param: 'palidez',
    rotulo: 'Palidez do disco',
    min: 0,
    max: 3,
    passo: 1,
    padrao: 2,
    formatar: (v) => ['rosado (normal)', 'leve', 'evidente', 'giz'][Math.round(v)] ?? '',
  },
  'orofaringe:abscesso-retrofaringeo': {
    param: 'abaulamento',
    rotulo: 'Abaulamento da parede posterior',
    min: 0,
    max: 20,
    passo: 2,
    padrao: 12,
    formatar: (v) => `${v.toFixed(0)} mm`,
  },
  'orofaringe:epiglotite': {
    param: 'edema',
    rotulo: 'Edema da epiglote',
    min: 0,
    max: 3,
    passo: 1,
    padrao: 2,
    formatar: (v) => ['ausente', 'leve', 'moderado', 'obstrutivo'][Math.round(v)] ?? '',
  },
  'orofaringe:moniliase-extensa': {
    param: 'area',
    rotulo: 'Área coberta por placas',
    min: 0,
    max: 100,
    passo: 10,
    padrao: 60,
    formatar: (v) => `${v.toFixed(0)}%`,
    marcos: [{ valor: 30, rotulo: 'além do focal' }],
  },
  'rinoscopia:hematoma-septal': {
    param: 'reducao',
    rotulo: 'Redução da luz nasal',
    min: 0,
    max: 100,
    passo: 10,
    padrao: 60,
    formatar: (v) => `${v.toFixed(0)}%`,
  },
  'rinoscopia:desvio-septal': {
    param: 'obstrucao',
    rotulo: 'Obstrução da fossa',
    min: 0,
    max: 100,
    passo: 10,
    padrao: 60,
    formatar: (v) => `${v.toFixed(0)}%`,
    marcos: [{ valor: 50, rotulo: 'sintomático' }],
  },
  'rinoscopia:epistaxe': {
    param: 'intensidade',
    rotulo: 'Intensidade do sangramento',
    min: 0,
    max: 3,
    passo: 1,
    padrao: 2,
    formatar: (v) => ['parado', 'gotejante', 'contínuo', 'abundante'][Math.round(v)] ?? '',
  },
  'pupilas:anisocoria-fisiologica': {
    param: 'diferenca',
    rotulo: 'Diferença entre as pupilas',
    min: 0,
    max: 2,
    passo: 0.2,
    padrao: 1,
    formatar: (v) => `${v.toFixed(1)} mm`,
    marcos: [
      { valor: 0.4, rotulo: 'comum' },
      { valor: 1, rotulo: 'limite usual' },
    ],
  },
  'pupilas:defeito-pupilar-aferente': {
    param: 'assimetria',
    rotulo: 'Assimetria da resposta',
    min: 0,
    max: 100,
    passo: 10,
    padrao: 70,
    formatar: (v) => (v === 0 ? 'sem defeito' : `${v.toFixed(0)}%`),
    marcos: [
      { valor: 30, rotulo: 'leve' },
      { valor: 70, rotulo: 'grave' },
    ],
  },
}

/** O controle de uma cena, se ela tiver um — pelo par `id:cena` da ilustração. */
export function controleDaCena(ilustracao: { id: string; params?: Record<string, unknown> }): ControleDeIlustracao | undefined {
  const cena = ilustracao.params?.cena
  if (typeof cena !== 'string') return undefined
  return CONTROLES_DE_CENA[`${ilustracao.id}:${cena}`]
}
