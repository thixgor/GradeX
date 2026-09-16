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
  'endoscopia:esofagite-erosiva': {
    param: 'grau',
    rotulo: 'Grau de Los Angeles',
    min: 0,
    max: 3,
    passo: 1,
    padrao: 2,
    formatar: (v) => ['A — erosões até 5 mm', 'B — maiores que 5 mm', 'C — confluentes, < 75%', 'D — ≥ 75% da circunferência'][Math.round(v)] ?? '',
  },
  'endoscopia:barrett': {
    param: 'extensao',
    rotulo: 'Extensão proximal',
    min: 0,
    max: 10,
    passo: 1,
    padrao: 4,
    formatar: (v) => `${v.toFixed(0)} cm`,
    marcos: [{ valor: 3, rotulo: 'segmento longo' }],
  },
  'endoscopia:varizes-esofagicas': {
    param: 'calibre',
    rotulo: 'Calibre máximo',
    min: 1,
    max: 10,
    passo: 1,
    padrao: 6,
    formatar: (v) => `${v.toFixed(0)} mm`,
    marcos: [{ valor: 5, rotulo: 'grandes · profilaxia' }],
  },
  'endoscopia:ulcera-sangrante': {
    param: 'estigma',
    rotulo: 'Estigma de sangramento',
    min: 0,
    max: 3,
    passo: 1,
    padrao: 3,
    formatar: (v) => ['base limpa (Forrest III)', 'mancha pigmentada (IIc)', 'coágulo aderido (IIb)', 'vaso visível / ativo (IIa–I)'][Math.round(v)] ?? '',
  },
  'endoscopia:ulcera-gastrica': {
    param: 'diametro',
    rotulo: 'Diâmetro da úlcera',
    min: 3,
    max: 30,
    passo: 1,
    padrao: 12,
    formatar: (v) => `${v.toFixed(0)} mm`,
    marcos: [{ valor: 20, rotulo: 'gigante' }],
  },
  'endoscopia:cancer-gastrico': {
    param: 'extensao',
    rotulo: 'Extensão da lesão',
    min: 1,
    max: 8,
    passo: 0.5,
    padrao: 4,
    formatar: (v) => `${v.toFixed(1)} cm`,
  },
  'endoscopia:gastrite-erosiva': {
    param: 'erosoes',
    rotulo: 'Número de erosões',
    min: 0,
    max: 30,
    passo: 1,
    padrao: 12,
    formatar: (v) => `${v.toFixed(0)}`,
  },
  'endoscopia:corpo-estranho-esofagico': {
    param: 'obstrucao',
    rotulo: 'Grau de obstrução',
    min: 0,
    max: 100,
    passo: 10,
    padrao: 80,
    formatar: (v) => `${v.toFixed(0)}%`,
    marcos: [{ valor: 100, rotulo: 'não engole saliva' }],
  },
  'endoscopia:polipo-adenomatoso': {
    param: 'diametro',
    rotulo: 'Diâmetro do pólipo',
    min: 2,
    max: 30,
    passo: 1,
    padrao: 12,
    formatar: (v) => `${v.toFixed(0)} mm`,
    marcos: [
      { valor: 10, rotulo: 'adenoma avançado' },
      { valor: 20, rotulo: 'mucosectomia' },
    ],
  },
  'endoscopia:cancer-colorretal': {
    param: 'estenose',
    rotulo: 'Estenose do lúmen',
    min: 0,
    max: 100,
    passo: 10,
    padrao: 60,
    formatar: (v) => `${v.toFixed(0)}%`,
    marcos: [{ valor: 80, rotulo: 'aparelho não passa' }],
  },
  'endoscopia:diverticulose': {
    param: 'diverticulos',
    rotulo: 'Número de divertículos',
    min: 0,
    max: 30,
    passo: 1,
    padrao: 8,
    formatar: (v) => `${v.toFixed(0)}`,
  },
  'endoscopia:colite-ulcerativa': {
    param: 'extensao',
    rotulo: 'Extensão da inflamação',
    min: 5,
    max: 100,
    passo: 5,
    padrao: 40,
    formatar: (v) => `${v.toFixed(0)} cm a partir do reto`,
    marcos: [
      { valor: 15, rotulo: 'proctite' },
      { valor: 60, rotulo: 'colite esquerda' },
    ],
  },
  'endoscopia:angiodisplasia': {
    param: 'area',
    rotulo: 'Área vascular',
    min: 2,
    max: 20,
    passo: 1,
    padrao: 8,
    formatar: (v) => `${v.toFixed(0)} mm`,
  },
  'endoscopia:paralisia-prega-vocal': {
    param: 'amplitude',
    rotulo: 'Mobilidade da prega afetada',
    min: 0,
    max: 100,
    passo: 10,
    padrao: 10,
    formatar: (v) => `${v.toFixed(0)}%`,
    marcos: [{ valor: 100, rotulo: 'normal' }],
  },
  'endoscopia:edema-de-glote': {
    param: 'edema',
    rotulo: 'Grau de edema',
    min: 0,
    max: 3,
    passo: 1,
    padrao: 2,
    formatar: (v) => ['ausente', 'leve', 'moderado', 'obstrutivo'][Math.round(v)] ?? '',
  },
  'endoscopia:lesao-laringea': {
    param: 'tamanho',
    rotulo: 'Tamanho da lesão',
    min: 2,
    max: 20,
    passo: 1,
    padrao: 10,
    formatar: (v) => `${v.toFixed(0)} mm`,
  },
  'endoscopia:corpo-estranho-endobronquico': {
    param: 'obstrucao',
    rotulo: 'Grau de obstrução',
    min: 0,
    max: 100,
    passo: 10,
    padrao: 70,
    formatar: (v) => `${v.toFixed(0)}%`,
  },
  'endoscopia:sangramento-endobronquico': {
    param: 'intensidade',
    rotulo: 'Intensidade do sangramento',
    min: 0,
    max: 3,
    passo: 1,
    padrao: 2,
    formatar: (v) => ['ausente', 'raias', 'moderado', 'maciço'][Math.round(v)] ?? '',
  },
  'endoscopia:tampao-mucoso': {
    param: 'obstrucao',
    rotulo: 'Grau de obstrução',
    min: 0,
    max: 100,
    passo: 10,
    padrao: 80,
    formatar: (v) => `${v.toFixed(0)}%`,
  },
  'ultrassom:apical-derrame': {
    param: 'derrame',
    rotulo: 'Espessura do derrame',
    min: 2,
    max: 40,
    passo: 2,
    padrao: 15,
    formatar: (v) => `${v.toFixed(0)} mm`,
    marcos: [
      { valor: 10, rotulo: 'moderado' },
      { valor: 20, rotulo: 'grande' },
    ],
  },
  'ultrassom:apical-colapso-atrial': {
    param: 'colapso',
    rotulo: 'Duração do colapso atrial',
    min: 0,
    max: 100,
    passo: 10,
    padrao: 40,
    formatar: (v) => `${v.toFixed(0)}% do ciclo`,
    marcos: [{ valor: 33, rotulo: 'específico de tamponamento' }],
  },
  'ultrassom:apical-hipovolemia': {
    param: 'area',
    rotulo: 'Área diastólica do VE',
    min: 2,
    max: 25,
    passo: 1,
    padrao: 8,
    formatar: (v) => `${v.toFixed(0)} cm²`,
    marcos: [{ valor: 10, rotulo: 'cavidade pequena' }],
  },
  'ultrassom:atelectasia': {
    param: 'extensao',
    rotulo: 'Extensão do colapso',
    min: 10,
    max: 100,
    passo: 10,
    padrao: 50,
    formatar: (v) => `${v.toFixed(0)}% do campo`,
  },
  'ultrassom:derrame-pleural-complexo': {
    param: 'debris',
    rotulo: 'Septos e detritos',
    min: 0,
    max: 3,
    passo: 1,
    padrao: 2,
    formatar: (v) => ['líquido simples', 'poucos ecos', 'septos', 'loculado, pleura espessa'][Math.round(v)] ?? '',
  },
  'ultrassom:fast-pelve-liquido': {
    param: 'lamina',
    rotulo: 'Profundidade da lâmina',
    min: 2,
    max: 30,
    passo: 2,
    padrao: 12,
    formatar: (v) => `${v.toFixed(0)} mm`,
  },
  'ultrassom:apendicite': {
    param: 'diametro',
    rotulo: 'Diâmetro do apêndice',
    min: 3,
    max: 15,
    passo: 1,
    padrao: 9,
    formatar: (v) => `${v.toFixed(0)} mm`,
    marcos: [{ valor: 6, rotulo: 'limite superior do normal' }],
  },
  'ultrassom:abscesso-abdominal': {
    param: 'diametro',
    rotulo: 'Maior diâmetro',
    min: 1,
    max: 15,
    passo: 1,
    padrao: 6,
    formatar: (v) => `${v.toFixed(0)} cm`,
    marcos: [{ valor: 3, rotulo: 'drenável' }],
  },
  'ultrassom:gravidez-intrauterina': {
    param: 'semanas',
    rotulo: 'Idade gestacional',
    min: 4,
    max: 12,
    passo: 1,
    padrao: 7,
    formatar: (v) => `${v.toFixed(0)} semanas`,
    marcos: [
      { valor: 5, rotulo: 'vesícula vitelina' },
      { valor: 6, rotulo: 'batimento' },
    ],
  },
  'ultrassom:gestacao-ectopica': {
    param: 'massa',
    rotulo: 'Tamanho da massa anexial',
    min: 5,
    max: 50,
    passo: 5,
    padrao: 25,
    formatar: (v) => `${v.toFixed(0)} mm`,
    marcos: [{ valor: 35, rotulo: 'limite para metotrexato' }],
  },
  'ultrassom:liquido-livre-gestante': {
    param: 'volume',
    rotulo: 'Volume estimado',
    min: 0,
    max: 1000,
    passo: 50,
    padrao: 500,
    formatar: (v) => `${v.toFixed(0)} mL`,
    marcos: [{ valor: 300, rotulo: 'chega a Morrison' }],
  },
  'ultrassom:drenagem-guiada': {
    param: 'profundidade',
    rotulo: 'Profundidade da coleção',
    min: 0.5,
    max: 10,
    passo: 0.5,
    padrao: 3,
    formatar: (v) => `${v.toFixed(1)} cm`,
  },
}

/** O controle de uma cena, se ela tiver um — pelo par `id:cena` da ilustração. */
export function controleDaCena(ilustracao: { id: string; params?: Record<string, unknown> }): ControleDeIlustracao | undefined {
  const cena = ilustracao.params?.cena
  if (typeof cena !== 'string') return undefined
  return CONTROLES_DE_CENA[`${ilustracao.id}:${cena}`]
}

/**
 * Controles por **sinal**, para as fichas cuja figura é compartilhada com
 * outros sinais (um só fonocardiograma serve sopro, B3 e sibilos; um só mapa
 * do tórax serve macicez e frêmito). A chave é o slug do sinal. Cada faixa
 * carrega o limiar que a ficha ensina — 20 mmHg na ortostática, 10 no pulso
 * paradoxal, 0,9 no ITB, 3 mm entre petéquia e púrpura.
 */
export const CONTROLES_DE_SINAL: Record<string, ControleDeIlustracao> = {
  'pressao-arterial-ortostatica': {
    param: 'valor', rotulo: 'Queda da PAS ao ficar em pé', min: 0, max: 60, passo: 5, padrao: 30,
    formatar: (v) => `${v.toFixed(0)} mmHg`,
    marcos: [{ valor: 20, rotulo: 'hipotensão ortostática' }],
  },
  'pulso-irregularmente-irregular': {
    param: 'valor', rotulo: 'Variabilidade dos intervalos', min: 0, max: 100, passo: 10, padrao: 60,
    formatar: (v) => (v === 0 ? 'ritmo regular' : `${v.toFixed(0)}%`),
    marcos: [{ valor: 30, rotulo: 'irregularmente irregular' }],
  },
  'pulso-paradoxal': {
    param: 'valor', rotulo: 'Queda inspiratória da PAS', min: 0, max: 30, passo: 2, padrao: 15,
    formatar: (v) => `${v.toFixed(0)} mmHg`,
    marcos: [{ valor: 10, rotulo: 'limite normal' }, { valor: 20, rotulo: 'tamponamento provável' }],
  },
  'refluxo-hepatojugular': {
    param: 'altura', rotulo: 'Coluna jugular durante a compressão', min: 3, max: 20, passo: 1, padrao: 12,
    formatar: (v) => `${v.toFixed(0)} cmH₂O`,
    marcos: [{ valor: 8, rotulo: 'limite basal' }, { valor: 11, rotulo: 'refluxo positivo (+3 cm)' }],
  },
  'sopro-de-estenose-aortica': {
    param: 'intensidade', rotulo: 'Intensidade (Levine)', min: 0, max: 6, passo: 1, padrao: 3,
    formatar: (v) => (v === 0 ? 'sem sopro' : `${v.toFixed(0)}/6`),
    marcos: [{ valor: 4, rotulo: 'com frêmito' }],
  },
  'sopro-de-insuficiencia-mitral': {
    param: 'intensidade', rotulo: 'Intensidade (Levine)', min: 0, max: 6, passo: 1, padrao: 4,
    formatar: (v) => (v === 0 ? 'sem sopro' : `${v.toFixed(0)}/6`),
    marcos: [{ valor: 3, rotulo: 'regurgitação significativa' }],
  },
  'terceira-bulha': {
    param: 'intensidade', rotulo: 'B3', min: 0, max: 3, passo: 1, padrao: 2,
    formatar: (v) => ['ausente', 'discreta', 'nítida', 'galope'][Math.round(v)] ?? '',
  },
  'quarta-bulha': {
    param: 'intensidade', rotulo: 'B4', min: 0, max: 3, passo: 1, padrao: 2,
    formatar: (v) => ['ausente', 'discreta', 'nítida', 'galope'][Math.round(v)] ?? '',
  },
  'pulsos-assimetricos': {
    param: 'valor', rotulo: 'Diferença de amplitude entre os lados', min: 0, max: 100, passo: 10, padrao: 70,
    formatar: (v) => (v === 0 ? 'simétricos' : `${v.toFixed(0)}%`),
    marcos: [{ valor: 50, rotulo: 'pulso reduzido' }, { valor: 100, rotulo: 'ausente' }],
  },
  'extremidade-fria-com-pulso-reduzido': {
    param: 'valor', rotulo: 'Temperatura da pele', min: 20, max: 36, passo: 1, padrao: 26,
    formatar: (v) => `${v.toFixed(0)} °C`,
    marcos: [{ valor: 30, rotulo: 'fria ao dorso da mão' }],
  },
  'estridor-inspiratorio': {
    param: 'intensidade', rotulo: 'Estridor', min: 0, max: 3, passo: 1, padrao: 2,
    formatar: (v) => ['ausente', 'ao esforço', 'em repouso', 'bifásico'][Math.round(v)] ?? '',
    marcos: [{ valor: 2, rotulo: 'via aérea crítica' }],
  },
  'uso-de-musculatura-acessoria': {
    param: 'frequencia', rotulo: 'Frequência respiratória', min: 8, max: 45, passo: 1, padrao: 32,
    formatar: (v) => `${v.toFixed(0)} irpm`,
    marcos: [{ valor: 20, rotulo: 'limite' }, { valor: 30, rotulo: 'esforço evidente' }],
  },
  'sibilos-difusos': {
    param: 'intensidade', rotulo: 'Sibilância', min: 0, max: 3, passo: 1, padrao: 2,
    formatar: (v) => ['ausente', 'expiratória', 'bifásica', 'tórax silencioso próximo'][Math.round(v)] ?? '',
  },
  'sibilo-monofonico-localizado': {
    param: 'intensidade', rotulo: 'Frequência da nota', min: 100, max: 1000, passo: 50, padrao: 400,
    formatar: (v) => `${v.toFixed(0)} Hz`,
  },
  'estertores-crepitantes': {
    param: 'intensidade', rotulo: 'Extensão dos crepitantes', min: 0, max: 3, passo: 1, padrao: 2,
    formatar: (v) => ['ausentes', 'bases', 'até o terço médio', 'difusos'][Math.round(v)] ?? '',
  },
  'murmurio-vesicular-abolido': {
    param: 'valor', rotulo: 'Redução do murmúrio no lado afetado', min: 0, max: 100, passo: 10, padrao: 80,
    formatar: (v) => (v === 0 ? 'simétrico' : v >= 90 ? 'abolido' : `${v.toFixed(0)}%`),
  },
  'macicez-a-percussao': {
    param: 'valor', rotulo: 'Altura da macicez a partir da base', min: 0, max: 20, passo: 1, padrao: 10,
    formatar: (v) => (v === 0 ? 'som claro' : `${v.toFixed(0)} cm`),
    marcos: [{ valor: 3, rotulo: '~300 mL' }, { valor: 10, rotulo: 'derrame moderado' }],
  },
  'fremito-toracovocal-aumentado': {
    param: 'valor', rotulo: 'Aumento do frêmito', min: 0, max: 100, passo: 10, padrao: 60,
    formatar: (v) => (v === 0 ? 'simétrico' : `+${v.toFixed(0)}%`),
  },
  'fremito-toracovocal-reduzido': {
    param: 'valor', rotulo: 'Redução do frêmito', min: 0, max: 100, passo: 10, padrao: 70,
    formatar: (v) => (v === 0 ? 'simétrico' : v >= 90 ? 'abolido' : `−${v.toFixed(0)}%`),
  },
  'anisocoria-nao-reativa': {
    param: 'diferenca', rotulo: 'Diferença entre as pupilas', min: 0, max: 8, passo: 0.5, padrao: 4,
    formatar: (v) => `${v.toFixed(1)} mm`,
    marcos: [{ valor: 1, rotulo: 'limite fisiológico' }],
  },
  'deficit-de-campo-visual-por-confrontacao': {
    param: 'valor', rotulo: 'Campo perdido', min: 0, max: 50, passo: 5, padrao: 25,
    formatar: (v) => (v === 0 ? 'campo íntegro' : `${v.toFixed(0)}%`),
  },
  'hemianopsia-homonima': {
    param: 'valor', rotulo: 'Hemicampo perdido', min: 0, max: 50, passo: 5, padrao: 45,
    formatar: (v) => (v === 0 ? 'campo íntegro' : v >= 50 ? 'hemianopsia completa' : `${v.toFixed(0)}%`),
  },
  'desvio-de-lingua': {
    param: 'valor', rotulo: 'Ângulo de desvio', min: 0, max: 30, passo: 5, padrao: 15,
    formatar: (v) => (v === 0 ? 'linha média' : `${v.toFixed(0)}°`),
  },
  'pronator-drift': {
    param: 'valor', rotulo: 'Queda do braço em 30 s', min: 0, max: 30, passo: 1, padrao: 15,
    formatar: (v) => (v === 0 ? 'mantém' : `${v.toFixed(0)} cm`),
    marcos: [{ valor: 5, rotulo: 'deriva sutil' }],
  },
  disartria: {
    param: 'valor', rotulo: 'Inteligibilidade da fala', min: 0, max: 100, passo: 10, padrao: 50,
    formatar: (v) => `${v.toFixed(0)}%`,
  },
  afasia: {
    param: 'valor', rotulo: 'Fluência', min: 0, max: 100, passo: 10, padrao: 30,
    formatar: (v) => (v === 0 ? 'mutismo' : `${v.toFixed(0)}%`),
  },
  'marcha-ataxica': {
    param: 'valor', rotulo: 'Largura da base', min: 5, max: 30, passo: 1, padrao: 20,
    formatar: (v) => `${v.toFixed(0)} cm`,
    marcos: [{ valor: 10, rotulo: 'normal' }, { valor: 15, rotulo: 'marcha ebriosa' }],
  },
  nistagmo: {
    param: 'valor', rotulo: 'Frequência das batidas', min: 0, max: 6, passo: 0.5, padrao: 3,
    formatar: (v) => (v === 0 ? 'olhos estáveis' : `${v.toFixed(1)} Hz`),
  },
  'rigidez-de-nuca': {
    param: 'valor', rotulo: 'Flexão do pescoço alcançada', min: 0, max: 90, passo: 5, padrao: 20,
    formatar: (v) => `${v.toFixed(0)}°`,
    marcos: [{ valor: 45, rotulo: 'resistência dolorosa' }],
  },
  'sinal-de-kernig': {
    param: 'valor', rotulo: 'Extensão do joelho alcançada', min: 90, max: 180, passo: 5, padrao: 110,
    formatar: (v) => `${v.toFixed(0)}°`,
    marcos: [{ valor: 135, rotulo: 'Kernig positivo abaixo' }],
  },
  'sinal-de-grey-turner': {
    param: 'valor', rotulo: 'Área da equimose', min: 0, max: 40, passo: 2, padrao: 12,
    formatar: (v) => (v === 0 ? 'sem equimose' : `${v.toFixed(0)} cm²`),
  },
  'sinal-de-cullen': {
    param: 'valor', rotulo: 'Raio do halo periumbilical', min: 0, max: 15, passo: 1, padrao: 5,
    formatar: (v) => (v === 0 ? 'sem halo' : `${v.toFixed(0)} cm`),
  },
  'defesa-abdominal': {
    param: 'valor', rotulo: 'Grau de contratura', min: 0, max: 3, passo: 1, padrao: 2,
    formatar: (v) => ['ausente', 'leve', 'moderada', 'em tábua'][Math.round(v)] ?? '',
  },
  'massa-abdominal-pulsatil': {
    param: 'valor', rotulo: 'Diâmetro da aorta', min: 1.5, max: 8, passo: 0.5, padrao: 5,
    formatar: (v) => `${v.toFixed(1)} cm`,
    marcos: [{ valor: 3, rotulo: 'aneurisma' }, { valor: 5.5, rotulo: 'cirurgia' }],
  },
  hepatomegalia: {
    param: 'valor', rotulo: 'Borda abaixo do rebordo', min: 0, max: 15, passo: 1, padrao: 6,
    formatar: (v) => (v === 0 ? 'não palpável' : `${v.toFixed(0)} cm`),
    marcos: [{ valor: 2, rotulo: 'limite' }],
  },
  esplenomegalia: {
    param: 'valor', rotulo: 'Borda abaixo do rebordo', min: 0, max: 20, passo: 1, padrao: 6,
    formatar: (v) => (v === 0 ? 'não palpável' : `${v.toFixed(0)} cm`),
    marcos: [{ valor: 8, rotulo: 'maciça' }],
  },
  'descompressao-dolorosa-localizada': {
    param: 'valor', rotulo: 'Dor à descompressão', min: 0, max: 10, passo: 1, padrao: 7,
    formatar: (v) => (v === 0 ? 'indolor' : `${v.toFixed(0)}/10`),
  },
  'indice-tornozelo-braquial-reduzido': {
    param: 'valor', rotulo: 'Índice tornozelo-braquial', min: 0.3, max: 1.5, passo: 0.05, padrao: 0.7,
    formatar: (v) => v.toFixed(2),
    marcos: [{ valor: 0.5, rotulo: 'isquemia crítica' }, { valor: 0.9, rotulo: 'DAP' }, { valor: 1.4, rotulo: 'não compressível' }],
  },
  'ulcera-arterial': {
    param: 'valor', rotulo: 'Área da úlcera', min: 0, max: 20, passo: 0.5, padrao: 3,
    formatar: (v) => (v === 0 ? 'sem úlcera' : `${v.toFixed(1)} cm²`),
  },
  'ulcera-venosa': {
    param: 'valor', rotulo: 'Área da úlcera', min: 0, max: 20, passo: 0.5, padrao: 8,
    formatar: (v) => (v === 0 ? 'sem úlcera' : `${v.toFixed(1)} cm²`),
  },
  'isquemia-aguda-de-membro': {
    param: 'valor', rotulo: 'Horas desde o início da dor', min: 0, max: 12, passo: 1, padrao: 4,
    formatar: (v) => `${v.toFixed(0)} h`,
    marcos: [{ valor: 6, rotulo: 'nervo e músculo em risco' }],
  },
  'celulite-extensa': {
    param: 'valor', rotulo: 'Área acometida', min: 0, max: 1000, passo: 50, padrao: 500,
    formatar: (v) => (v === 0 ? 'pele normal' : `${v.toFixed(0)} cm²`),
    marcos: [{ valor: 450, rotulo: '~1% da superfície' }],
  },
  'fasciite-necrosante': {
    param: 'valor', rotulo: 'Área de necrose', min: 0, max: 500, passo: 25, padrao: 200,
    formatar: (v) => (v === 0 ? 'sem necrose visível' : `${v.toFixed(0)} cm²`),
  },
  'eritema-multiforme': {
    param: 'valor', rotulo: 'Diâmetro das lesões', min: 0, max: 30, passo: 1, padrao: 15,
    formatar: (v) => (v === 0 ? 'sem lesões' : `${v.toFixed(0)} mm`),
  },
  purpura: {
    param: 'valor', rotulo: 'Tamanho das lesões', min: 1, max: 20, passo: 1, padrao: 2,
    formatar: (v) => `${v.toFixed(0)} mm`,
    marcos: [{ valor: 3, rotulo: 'petéquia | púrpura' }, { valor: 10, rotulo: 'equimose' }],
  },
  urticaria: {
    param: 'valor', rotulo: 'Superfície acometida', min: 0, max: 100, passo: 10, padrao: 30,
    formatar: (v) => (v === 0 ? 'sem urticas' : `${v.toFixed(0)}%`),
  },
  'angioedema-de-lingua': {
    param: 'valor', rotulo: 'Aumento da língua', min: 0, max: 100, passo: 10, padrao: 40,
    formatar: (v) => (v === 0 ? 'normal' : `+${v.toFixed(0)}%`),
    marcos: [{ valor: 50, rotulo: 'voz abafada' }, { valor: 80, rotulo: 'via aérea crítica' }],
  },
}

/**
 * O controle de um sinal: pelo slug primeiro, pela cena da figura depois, pela
 * figura por último. É a ordem da especificidade.
 */
export function controleDoSinal(sinal: { slug: string; ilustracao?: { id: string; params?: Record<string, unknown> } }): ControleDeIlustracao | undefined {
  if (CONTROLES_DE_SINAL[sinal.slug]) return CONTROLES_DE_SINAL[sinal.slug]
  if (!sinal.ilustracao) return undefined
  return controleDaCena(sinal.ilustracao) ?? CONTROLES[sinal.ilustracao.id]
}
