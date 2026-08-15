/**
 * Laboratório Virtual — geração de exames fictícios para estudo.
 *
 * ## Por que as referências aparecem de novo aqui
 *
 * Este módulo repete um subconjunto enxuto das faixas de referência que já
 * existem nas fichas de marcador. A duplicação é deliberada e tem uma razão
 * medida: o gerador roda **no navegador** (o usuário clica em "gerar" e o
 * exame aparece na hora, sem ida ao servidor), e as fichas completas somam
 * centenas de kilobytes de texto clínico que ninguém precisa para desenhar um
 * laudo. Importar `marcadores/*` daqui arrastaria todo esse conteúdo para o
 * bundle do cliente.
 *
 * O que fica aqui é só o mínimo para desenhar a folha: nome, unidade, faixa e
 * quantas casas decimais imprimir. A interpretação profunda continua vindo das
 * fichas, no servidor, quando a pessoa clica no marcador.
 *
 * ## Nenhum dado é de paciente real
 *
 * Os pacientes são gerados: sexo e idade sorteados dentro da faixa que o
 * cenário define, e nome nunca é atribuído. Os valores são sorteados dentro de
 * intervalos que reproduzem o comportamento fisiopatológico da condição — não
 * são cópias de exames de ninguém.
 */

import type { Direcao } from './tipos'

/* ══════════════════════════ Base de valores ══════════════════════════ */

interface BaseDoMarcador {
  nome: string
  unidade: string
  /** Limites da faixa de referência, para desenhar o laudo e marcar a seta. */
  min: number
  max: number
  /** Casas decimais na impressão. */
  casas: number
  /** Texto da referência quando ela não é um simples intervalo numérico. */
  refTexto?: string
  /**
   * Ficha que a linha abre, quando ela não tem página própria.
   *
   * A amilase é o caso: ela aparece no laudo da pancreatite porque é o que o
   * laboratório imprime, mas quem a explica é a ficha da lipase, que cobre as
   * duas enzimas. Sem isso, a linha seria a única do laudo que não abre — e o
   * gesto central da seção falharia em silêncio justamente onde ele é mais
   * esperado.
   */
  ficha?: string
}

export const BASE: Record<string, BaseDoMarcador> = {
  // Série vermelha
  hemoglobina: { nome: 'Hemoglobina', unidade: 'g/dL', min: 12, max: 16, casas: 1 },
  hematocrito: { nome: 'Hematócrito', unidade: '%', min: 36, max: 47, casas: 1 },
  hemacias: { nome: 'Hemácias', unidade: 'milhões/mm³', min: 4.0, max: 5.4, casas: 2 },
  vcm: { nome: 'VCM', unidade: 'fL', min: 80, max: 100, casas: 1 },
  hcm: { nome: 'HCM', unidade: 'pg', min: 27, max: 32, casas: 1 },
  chcm: { nome: 'CHCM', unidade: 'g/dL', min: 32, max: 36, casas: 1 },
  rdw: { nome: 'RDW', unidade: '%', min: 11.5, max: 14.5, casas: 1 },
  reticulocitos: { nome: 'Reticulócitos', unidade: '%', min: 0.5, max: 2.5, casas: 1 },
  // Série branca
  leucocitos: { nome: 'Leucócitos', unidade: '/mm³', min: 4000, max: 11000, casas: 0 },
  neutrofilos: { nome: 'Neutrófilos', unidade: '/mm³', min: 1500, max: 7500, casas: 0 },
  linfocitos: { nome: 'Linfócitos', unidade: '/mm³', min: 1000, max: 4000, casas: 0 },
  monocitos: { nome: 'Monócitos', unidade: '/mm³', min: 200, max: 1000, casas: 0 },
  eosinofilos: { nome: 'Eosinófilos', unidade: '/mm³', min: 0, max: 500, casas: 0 },
  basofilos: { nome: 'Basófilos', unidade: '/mm³', min: 0, max: 200, casas: 0 },
  plaquetas: { nome: 'Plaquetas', unidade: '/mm³', min: 150000, max: 450000, casas: 0 },
  vpm: { nome: 'VPM', unidade: 'fL', min: 7.5, max: 11.5, casas: 1 },
  // Ferro
  ferritina: { nome: 'Ferritina', unidade: 'ng/mL', min: 15, max: 200, casas: 0 },
  'ferro-serico': { nome: 'Ferro sérico', unidade: 'µg/dL', min: 50, max: 170, casas: 0 },
  transferrina: { nome: 'Transferrina', unidade: 'mg/dL', min: 200, max: 360, casas: 0 },
  'saturacao-transferrina': { nome: 'Saturação da transferrina', unidade: '%', min: 20, max: 45, casas: 0 },
  'vitamina-b12': { nome: 'Vitamina B12', unidade: 'pg/mL', min: 200, max: 900, casas: 0 },
  'acido-folico': { nome: 'Ácido fólico', unidade: 'ng/mL', min: 3, max: 17, casas: 1 },
  haptoglobina: { nome: 'Haptoglobina', unidade: 'mg/dL', min: 30, max: 200, casas: 0 },
  // Renal
  creatinina: { nome: 'Creatinina', unidade: 'mg/dL', min: 0.6, max: 1.2, casas: 2 },
  ureia: { nome: 'Ureia', unidade: 'mg/dL', min: 15, max: 45, casas: 0 },
  tfg: { nome: 'TFG estimada', unidade: 'mL/min/1,73m²', min: 90, max: 130, casas: 0, refTexto: '≥ 90' },
  'acido-urico': { nome: 'Ácido úrico', unidade: 'mg/dL', min: 2.4, max: 7.0, casas: 1 },
  albuminuria: { nome: 'Relação albumina/creatinina urinária', unidade: 'mg/g', min: 0, max: 30, casas: 0, refTexto: '< 30' },
  proteinuria: { nome: 'Proteinúria de 24h', unidade: 'mg/24h', min: 0, max: 150, casas: 0, refTexto: '< 150' },
  'sodio-urinario': { nome: 'Sódio urinário', unidade: 'mEq/L', min: 20, max: 40, casas: 0, refTexto: 'depende do contexto' },
  'densidade-urinaria': { nome: 'Densidade urinária', unidade: '', min: 1.005, max: 1.03, casas: 3 },
  // Eletrólitos
  sodio: { nome: 'Sódio', unidade: 'mEq/L', min: 135, max: 145, casas: 0 },
  potassio: { nome: 'Potássio', unidade: 'mEq/L', min: 3.5, max: 5.0, casas: 1 },
  cloro: { nome: 'Cloro', unidade: 'mEq/L', min: 98, max: 107, casas: 0 },
  bicarbonato: { nome: 'Bicarbonato', unidade: 'mEq/L', min: 22, max: 26, casas: 0 },
  calcio: { nome: 'Cálcio total', unidade: 'mg/dL', min: 8.5, max: 10.5, casas: 1 },
  'calcio-ionizado': { nome: 'Cálcio ionizado', unidade: 'mmol/L', min: 1.12, max: 1.32, casas: 2 },
  magnesio: { nome: 'Magnésio', unidade: 'mg/dL', min: 1.7, max: 2.4, casas: 1 },
  fosforo: { nome: 'Fósforo', unidade: 'mg/dL', min: 2.5, max: 4.5, casas: 1 },
  'anion-gap': { nome: 'Ânion gap', unidade: 'mEq/L', min: 8, max: 12, casas: 0 },
  // Hepático
  ast: { nome: 'AST (TGO)', unidade: 'U/L', min: 10, max: 40, casas: 0 },
  alt: { nome: 'ALT (TGP)', unidade: 'U/L', min: 10, max: 45, casas: 0 },
  'fosfatase-alcalina': { nome: 'Fosfatase alcalina', unidade: 'U/L', min: 40, max: 130, casas: 0 },
  ggt: { nome: 'GGT', unidade: 'U/L', min: 10, max: 60, casas: 0 },
  'bilirrubina-total': { nome: 'Bilirrubina total', unidade: 'mg/dL', min: 0.2, max: 1.2, casas: 2 },
  'bilirrubina-direta': { nome: 'Bilirrubina direta', unidade: 'mg/dL', min: 0, max: 0.3, casas: 2, refTexto: '< 0,3' },
  'bilirrubina-indireta': { nome: 'Bilirrubina indireta', unidade: 'mg/dL', min: 0.1, max: 1.0, casas: 2 },
  albumina: { nome: 'Albumina', unidade: 'g/dL', min: 3.5, max: 5.2, casas: 1 },
  ldh: { nome: 'LDH', unidade: 'U/L', min: 140, max: 280, casas: 0 },
  amonia: { nome: 'Amônia', unidade: 'µmol/L', min: 11, max: 50, casas: 0 },
  // Coagulação
  inr: { nome: 'INR', unidade: '', min: 0.9, max: 1.1, casas: 2 },
  ttpa: { nome: 'TTPa', unidade: 's', min: 25, max: 35, casas: 1 },
  fibrinogenio: { nome: 'Fibrinogênio', unidade: 'mg/dL', min: 200, max: 400, casas: 0 },
  'd-dimero': { nome: 'D-dímero', unidade: 'ng/mL', min: 0, max: 500, casas: 0, refTexto: '< 500' },
  // Metabólico
  'glicemia-jejum': { nome: 'Glicemia de jejum', unidade: 'mg/dL', min: 70, max: 99, casas: 0 },
  hba1c: { nome: 'Hemoglobina glicada', unidade: '%', min: 4.0, max: 5.6, casas: 1, refTexto: '< 5,7' },
  insulina: { nome: 'Insulina', unidade: 'µUI/mL', min: 2, max: 25, casas: 1 },
  'colesterol-total': { nome: 'Colesterol total', unidade: 'mg/dL', min: 120, max: 190, casas: 0, refTexto: '< 190' },
  ldl: { nome: 'LDL-colesterol', unidade: 'mg/dL', min: 50, max: 130, casas: 0, refTexto: 'conforme risco' },
  hdl: { nome: 'HDL-colesterol', unidade: 'mg/dL', min: 40, max: 80, casas: 0 },
  triglicerideos: { nome: 'Triglicerídeos', unidade: 'mg/dL', min: 50, max: 150, casas: 0, refTexto: '< 150' },
  'nao-hdl': { nome: 'Colesterol não-HDL', unidade: 'mg/dL', min: 70, max: 160, casas: 0 },
  // Inflamatórios
  pcr: { nome: 'PCR', unidade: 'mg/L', min: 0, max: 5, casas: 1, refTexto: '< 5' },
  vhs: { nome: 'VHS', unidade: 'mm/h', min: 0, max: 20, casas: 0, refTexto: '< 20' },
  procalcitonina: { nome: 'Procalcitonina', unidade: 'ng/mL', min: 0, max: 0.25, casas: 2, refTexto: '< 0,25' },
  lactato: { nome: 'Lactato', unidade: 'mmol/L', min: 0.5, max: 2.0, casas: 1 },
  // Cardíaco
  troponina: { nome: 'Troponina', unidade: 'ng/L', min: 0, max: 14, casas: 1, refTexto: '< 14 (percentil 99)' },
  'ck-mb': { nome: 'CK-MB', unidade: 'ng/mL', min: 0, max: 5, casas: 1, refTexto: '< 5' },
  ck: { nome: 'CK total', unidade: 'U/L', min: 25, max: 200, casas: 0 },
  'nt-probnp': { nome: 'NT-proBNP', unidade: 'pg/mL', min: 0, max: 125, casas: 0, refTexto: '< 125' },
  // Endócrino
  tsh: { nome: 'TSH', unidade: 'mUI/L', min: 0.4, max: 4.5, casas: 2 },
  't4-livre': { nome: 'T4 livre', unidade: 'ng/dL', min: 0.8, max: 1.8, casas: 2 },
  t3: { nome: 'T3 total', unidade: 'ng/dL', min: 80, max: 200, casas: 0 },
  pth: { nome: 'PTH', unidade: 'pg/mL', min: 15, max: 65, casas: 0 },
  'vitamina-d': { nome: 'Vitamina D (25-OH)', unidade: 'ng/mL', min: 30, max: 60, casas: 1, refTexto: '≥ 20 (alvo 30–60 em risco)' },
  cortisol: { nome: 'Cortisol (8h)', unidade: 'µg/dL', min: 5, max: 25, casas: 1 },
  // Gasometria
  ph: { nome: 'pH', unidade: '', min: 7.35, max: 7.45, casas: 2 },
  paco2: { nome: 'PaCO₂', unidade: 'mmHg', min: 35, max: 45, casas: 0 },
  pao2: { nome: 'PaO₂', unidade: 'mmHg', min: 80, max: 100, casas: 0 },
  // Pâncreas
  lipase: { nome: 'Lipase', unidade: 'U/L', min: 10, max: 60, casas: 0 },
  amilase: { nome: 'Amilase', unidade: 'U/L', min: 30, max: 110, casas: 0, ficha: 'lipase' },
}

/* ══════════════════════════ Cenários ══════════════════════════ */

/**
 * Como um valor deve sair em relação à referência.
 *
 * `n` = dentro da faixa. `b`/`B` = abaixo, discreto e acentuado. `a`/`A` =
 * acima, discreto e acentuado. `AA` = muito acima (uma ordem de grandeza).
 * A notação é curta de propósito: cada cenário define dezenas de marcadores, e
 * um objeto verboso por valor tornaria o arquivo ilegível.
 */
export type Tendencia = 'n' | 'b' | 'B' | 'a' | 'A' | 'AA'

export interface InterpretacaoDoCenario {
  /** As alterações principais, em linguagem de laudo. */
  alteracoes: string[]
  /** O padrão laboratorial reconhecido. */
  padrao: string
  /** Id do padrão em `padroes.ts`, quando existe. */
  padraoId?: string
  /** O mecanismo fisiopatológico que gera esse conjunto. */
  mecanismo: string
  /** A hipótese principal. */
  hipotese: string
  /** O que mais explica o mesmo padrão. */
  diferenciais: string[]
  /** O que pedir a seguir e por quê. */
  examesAdicionais: string[]
  /** A explicação completa, em parágrafos. */
  explicacao: string[]
}

export interface Cenario {
  id: string
  nome: string
  /** Agrupamento na tela de geração. */
  categoria: 'Normal' | 'Hematologia' | 'Renal' | 'Hepático' | 'Endócrino' | 'Cardiovascular' | 'Metabólico' | 'Infeccioso' | 'Ácido-base' | 'Digestivo'
  /** Contexto clínico curto — o que o "paciente" traz. */
  contexto: string
  /** Faixa etária plausível para o quadro. */
  idade: [number, number]
  /** Sexo fixo quando o quadro exige; caso contrário, sorteado. */
  sexo?: 'M' | 'F'
  /** Blocos de resultados, na ordem em que o laudo deve imprimi-los. */
  blocos: { titulo: string; valores: Record<string, Tendencia> }[]
  interpretacao: InterpretacaoDoCenario
}

const HEMOGRAMA_NORMAL: Record<string, Tendencia> = {
  hemoglobina: 'n', hematocrito: 'n', hemacias: 'n', vcm: 'n', hcm: 'n', chcm: 'n', rdw: 'n',
  leucocitos: 'n', neutrofilos: 'n', linfocitos: 'n', monocitos: 'n', eosinofilos: 'n', plaquetas: 'n',
}

export const CENARIOS: Cenario[] = [
  {
    id: 'normal',
    nome: 'Exame normal',
    categoria: 'Normal',
    contexto: 'Consulta de rotina, assintomático, sem comorbidades conhecidas.',
    idade: [20, 55],
    blocos: [
      { titulo: 'Hemograma', valores: HEMOGRAMA_NORMAL },
      { titulo: 'Função renal', valores: { creatinina: 'n', ureia: 'n', tfg: 'n' } },
      { titulo: 'Função hepática', valores: { ast: 'n', alt: 'n', 'fosfatase-alcalina': 'n', ggt: 'n', 'bilirrubina-total': 'n', albumina: 'n' } },
      { titulo: 'Metabólico', valores: { 'glicemia-jejum': 'n', hba1c: 'n', 'colesterol-total': 'n', ldl: 'n', hdl: 'n', triglicerideos: 'n' } },
    ],
    interpretacao: {
      alteracoes: ['Nenhuma alteração significativa.'],
      padrao: 'Sem padrão patológico identificável.',
      mecanismo: 'Todos os parâmetros dentro dos intervalos de referência para a idade e o sexo.',
      hipotese: 'Exames sem alterações relevantes.',
      diferenciais: ['Vale lembrar que exames normais não excluem doença: muitas condições cursam com laboratório normal em fases iniciais.'],
      examesAdicionais: ['Conforme o rastreio indicado pela idade, pelo sexo e pelos fatores de risco individuais.'],
      explicacao: [
        'Um exame normal é uma informação, não a ausência de informação: ele afasta um conjunto de hipóteses e reorienta o raciocínio para o que o laboratório não vê.',
        'Vale o princípio que atravessa toda esta seção: resultado laboratorial isolado não estabelece nem exclui diagnóstico. Ele soma-se à história, ao exame físico e à evolução.',
      ],
    },
  },

  {
    id: 'anemia-ferropriva',
    nome: 'Anemia ferropriva',
    categoria: 'Hematologia',
    contexto: 'Fadiga progressiva há três meses, palidez de mucosas, menorragia referida.',
    idade: [18, 45],
    sexo: 'F',
    blocos: [
      { titulo: 'Hemograma', valores: { hemoglobina: 'B', hematocrito: 'B', hemacias: 'b', vcm: 'B', hcm: 'B', chcm: 'b', rdw: 'A', leucocitos: 'n', neutrofilos: 'n', linfocitos: 'n', plaquetas: 'a' } },
      { titulo: 'Metabolismo do ferro', valores: { ferritina: 'B', 'ferro-serico': 'B', transferrina: 'A', 'saturacao-transferrina': 'B' } },
      { titulo: 'Resposta medular', valores: { reticulocitos: 'b' } },
    ],
    interpretacao: {
      alteracoes: ['Anemia microcítica e hipocrômica', 'RDW elevado (anisocitose)', 'Ferritina e saturação da transferrina reduzidas', 'Transferrina elevada', 'Trombocitose reativa'],
      padrao: 'Anemia microcítica hipocrômica com estoque de ferro esgotado',
      padraoId: 'anemia-microcitica-hipocromica',
      mecanismo:
        'A perda crônica de ferro esgotou o estoque. Sem ferro, a síntese de heme fica limitada, o precursor eritroide executa divisões extras tentando alcançar a concentração-alvo de hemoglobina e a célula sai pequena e pálida. O fígado responde produzindo mais transferrina para capturar o pouco ferro disponível.',
      hipotese: 'Anemia ferropriva por perda menstrual aumentada',
      diferenciais: ['Talassemia menor (RDW normal, contagem de hemácias preservada, ferritina normal)', 'Anemia da inflamação (ferritina normal ou alta, transferrina baixa)', 'Anemia sideroblástica'],
      examesAdicionais: [
        'Investigação da fonte de perda — obrigatória em homens e em mulheres na pós-menopausa, com avaliação do trato digestivo.',
        'Rastreio de doença celíaca quando não houver fonte de sangramento identificada.',
        'Reticulócitos após 7 dias de reposição: o pico confirma o diagnóstico e a adesão.',
      ],
      explicacao: [
        'A sequência das alterações na ferropenia é previsível e útil. O estoque acaba primeiro — a ferritina cai antes de qualquer coisa. Depois cai o ferro circulante, e só então a hemoglobinização das novas hemácias fica comprometida. Por isso ferritina baixa com hemoglobina normal já é ferropenia, ainda sem anemia.',
        'O RDW alto é a assinatura temporal do processo: as hemácias antigas ainda são normais e as novas já saem pequenas. Enquanto as duas populações convivem, a heterogeneidade é alta. É isso que separa a ferropenia da talassemia, em que o defeito é genético e todas as células são igualmente pequenas.',
        'A trombocitose acompanha com frequência a ferropenia por estímulo cruzado à megacariopoese. Microcitose com plaquetas altas é combinação tão típica que, por si só, sugere o diagnóstico.',
        'A parte que mais se esquece: repor ferro trata o número, não a causa. Em homem adulto e em mulher na pós-menopausa, ferropenia é perda digestiva até prova em contrário — e a investigação não pode ser adiada pela melhora da hemoglobina.',
      ],
    },
  },

  {
    id: 'anemia-megaloblastica',
    nome: 'Anemia megaloblástica',
    categoria: 'Hematologia',
    contexto: 'Astenia, parestesias em extremidades e alteração de marcha há seis meses. Gastrectomia parcial prévia.',
    idade: [55, 80],
    blocos: [
      { titulo: 'Hemograma', valores: { hemoglobina: 'B', hematocrito: 'B', hemacias: 'B', vcm: 'A', hcm: 'a', rdw: 'A', leucocitos: 'b', neutrofilos: 'b', plaquetas: 'b' } },
      { titulo: 'Resposta medular e hemólise', valores: { reticulocitos: 'b', ldh: 'AA', 'bilirrubina-indireta': 'a', haptoglobina: 'b' } },
      { titulo: 'Vitaminas', valores: { 'vitamina-b12': 'B', 'acido-folico': 'n' } },
    ],
    interpretacao: {
      alteracoes: ['Anemia macrocítica', 'Reticulócitos baixos', 'LDH muito elevada e bilirrubina indireta aumentada', 'Vitamina B12 reduzida', 'Discreta leucopenia e plaquetopenia'],
      padrao: 'Anemia macrocítica com eritropoese ineficaz',
      padraoId: 'anemia-macrocitica',
      mecanismo:
        'A falta de B12 bloqueia a síntese de timidilato e, com ela, a replicação do DNA. O núcleo atrasa enquanto o citoplasma continua amadurecendo: a célula sai grande, e muitos precursores morrem ainda na medula. Essa destruição intramedular libera LDH e bilirrubina indireta — o padrão bioquímico da hemólise, mas com reticulócito baixo.',
      hipotese: 'Anemia megaloblástica por deficiência de vitamina B12, provavelmente por má absorção pós-gastrectomia',
      diferenciais: ['Deficiência de folato', 'Macrocitose alcoólica ou hepática', 'Síndrome mielodisplásica', 'Hipotireoidismo', 'Medicamentos (hidroxiureia, metotrexato, zidovudina)'],
      examesAdicionais: [
        'Ácido metilmalônico e homocisteína quando a B12 estiver limítrofe — ambos sobem antes de a B12 cair.',
        'Esfregaço de sangue periférico à procura de neutrófilos hipersegmentados.',
        'Anti-fator intrínseco e anticélula parietal na suspeita de anemia perniciosa.',
      ],
      explicacao: [
        'A combinação que identifica este quadro não existe em nenhum outro: marcadores de destruição celular muito altos (LDH, bilirrubina indireta) com resposta medular baixa (reticulócitos). É o retrato da eritropoese ineficaz — a medula produz, mas os precursores morrem antes de sair.',
        'A ordem de aparecimento importa clinicamente. Os sintomas neurológicos da deficiência de B12 podem preceder qualquer alteração do hemograma, e a lesão medular (degeneração combinada subaguda) pode tornar-se irreversível se o tratamento demorar. VCM normal não afasta deficiência.',
        'Há um erro com consequência grave a evitar: repor folato sem excluir deficiência de B12 corrige a anemia — e permite que a neuropatia progrida silenciosamente. Dose sempre os dois.',
        'A absorção da B12 depende de ácido gástrico, fator intrínseco e íleo terminal íntegro. Gastrectomia, cirurgia bariátrica, gastrite atrófica, doença de Crohn ileal, metformina e inibidores de bomba de prótons rompem essa cadeia em pontos diferentes.',
      ],
    },
  },

  {
    id: 'hemolise',
    nome: 'Anemia hemolítica',
    categoria: 'Hematologia',
    contexto: 'Icterícia, colúria e fraqueza de instalação em dias. Baço palpável.',
    idade: [25, 60],
    blocos: [
      { titulo: 'Hemograma', valores: { hemoglobina: 'B', hematocrito: 'B', vcm: 'a', chcm: 'a', rdw: 'A', leucocitos: 'n', plaquetas: 'n' } },
      { titulo: 'Painel de hemólise', valores: { reticulocitos: 'AA', ldh: 'A', haptoglobina: 'B', 'bilirrubina-total': 'A', 'bilirrubina-indireta': 'A', 'bilirrubina-direta': 'n' } },
      { titulo: 'Função hepática', valores: { ast: 'a', alt: 'n', 'fosfatase-alcalina': 'n', ggt: 'n' } },
    ],
    interpretacao: {
      alteracoes: ['Anemia com reticulocitose intensa', 'LDH elevada e haptoglobina consumida', 'Hiperbilirrubinemia às custas da fração indireta', 'CHCM elevada (esferócitos)'],
      padrao: 'Padrão de hemólise com resposta medular adequada',
      padraoId: 'hemolise',
      mecanismo:
        'A hemácia é destruída antes dos 120 dias. Cada achado é consequência direta disso: o conteúdo citoplasmático aparece no plasma (LDH sobe), a haptoglobina é consumida ao capturar a hemoglobina livre e removida junto, o heme degradado excede a capacidade hepática de conjugação (bilirrubina indireta sobe) e a medula acelera a produção (reticulocitose).',
      hipotese: 'Anemia hemolítica, provavelmente autoimune (CHCM elevada sugere esferócitos)',
      diferenciais: ['Anemia hemolítica autoimune', 'Esferocitose hereditária', 'Microangiopatia trombótica', 'Deficiência de G6PD', 'Hemólise medicamentosa'],
      examesAdicionais: [
        'Coombs direto: positivo define hemólise imune.',
        'Esfregaço de sangue periférico: esferócitos apontam autoimune ou esferocitose; esquizócitos apontam microangiopatia.',
        'Se houver plaquetopenia associada com esquizócitos, considerar PTT — é emergência.',
      ],
      explicacao: [
        'A bilirrubina é indireta e a urina é escura por urobilinogênio, não por bilirrubina: a fração indireta é lipossolúvel e não é filtrada. Colúria com bilirrubina indireta alta e direta normal é achado de hemólise, não de colestase.',
        'A haptoglobina cai porque é consumida, e não porque deixa de ser produzida. Cada molécula de hemoglobina livre leva uma haptoglobina embora. Atenção à armadilha: ela é reagente de fase aguda e pode estar falsamente normal em paciente inflamado.',
        'O reticulócito alto é o que diferencia esta anemia daquelas por produção reduzida. A medula está competente e reagindo — o problema está depois dela, no sangue periférico.',
        'A próxima bifurcação é o Coombs direto: positivo indica destruição imunomediada e muda completamente o tratamento; negativo direciona para causas de membrana, enzimáticas, mecânicas ou hemoglobinopatias.',
      ],
    },
  },

  {
    id: 'talassemia-menor',
    nome: 'Talassemia menor',
    categoria: 'Hematologia',
    contexto: 'Achado em exame de rotina. Assintomático, sem resposta a reposição de ferro anterior.',
    idade: [18, 50],
    blocos: [
      { titulo: 'Hemograma', valores: { hemoglobina: 'b', hematocrito: 'b', hemacias: 'a', vcm: 'B', hcm: 'B', chcm: 'n', rdw: 'n', leucocitos: 'n', plaquetas: 'n' } },
      { titulo: 'Metabolismo do ferro', valores: { ferritina: 'n', 'ferro-serico': 'n', 'saturacao-transferrina': 'n' } },
    ],
    interpretacao: {
      alteracoes: ['Microcitose acentuada com anemia leve', 'Contagem de hemácias normal ou aumentada', 'RDW normal', 'Estoque de ferro preservado'],
      padrao: 'Microcitose desproporcional ao grau de anemia, com população homogênea',
      padraoId: 'anemia-microcitica-hipocromica',
      mecanismo:
        'A produção de uma cadeia de globina é deficiente. O ferro está disponível, mas falta proteína para montar o tetrâmero: as células saem pequenas e em número preservado. Como o defeito é genético e afeta todas as células igualmente, a população é homogênea — e o RDW permanece normal.',
      hipotese: 'Traço talassêmico',
      diferenciais: ['Anemia ferropriva (RDW alto, ferritina baixa, contagem de hemácias baixa)', 'Anemia da inflamação'],
      examesAdicionais: [
        'Eletroforese de hemoglobina: HbA2 acima de 3,5% confirma beta-talassemia menor.',
        'Ferritina normal já afasta ferropenia como causa da microcitose.',
        'Aconselhamento genético quando houver planejamento reprodutivo.',
      ],
      explicacao: [
        'A pista mais forte está na discordância: VCM muito baixo com anemia apenas discreta e contagem de hemácias normal ou alta. Na ferropenia, a produção cai junto — poucas células e pequenas. Na talassemia, a produção se mantém — muitas células, todas pequenas.',
        'O RDW normal é o segundo pilar do raciocínio, e ele decorre diretamente da genética: não existem duas populações, porque não houve um "antes" e um "depois" — todas as células nasceram com o mesmo defeito.',
        'Reconhecer este quadro evita dois danos frequentes: a reposição prolongada e ineficaz de ferro, com risco de sobrecarga, e a investigação repetida de sangramento oculto que não existe.',
      ],
    },
  },

  {
    id: 'anemia-doenca-cronica',
    nome: 'Anemia da inflamação',
    categoria: 'Hematologia',
    contexto: 'Artrite reumatoide em atividade, fadiga persistente.',
    idade: [40, 75],
    blocos: [
      { titulo: 'Hemograma', valores: { hemoglobina: 'b', hematocrito: 'b', vcm: 'n', rdw: 'n', leucocitos: 'n', plaquetas: 'a' } },
      { titulo: 'Metabolismo do ferro', valores: { ferritina: 'A', 'ferro-serico': 'B', transferrina: 'b', 'saturacao-transferrina': 'b' } },
      { titulo: 'Inflamatórios', valores: { pcr: 'A', vhs: 'A', albumina: 'b' } },
    ],
    interpretacao: {
      alteracoes: ['Anemia normocítica normocrômica', 'Ferro sérico baixo com ferritina elevada', 'Transferrina reduzida', 'PCR e VHS elevados'],
      padrao: 'Anemia da inflamação com ferro sequestrado',
      padraoId: 'anemia-doenca-cronica',
      mecanismo:
        'A IL-6 eleva a hepcidina hepática, que degrada a ferroportina — o único canal de saída do ferro do enterócito e do macrófago. O ferro deixa de ser absorvido e fica preso dentro do macrófago: existe no corpo, mas não chega ao eritroblasto. A ferritina sobe justamente porque é onde ele está guardado.',
      hipotese: 'Anemia da inflamação secundária a doença reumatológica em atividade',
      diferenciais: ['Anemia ferropriva associada (ferritina até 100 ng/mL não a afasta neste contexto)', 'Anemia da doença renal crônica', 'Anemia induzida por medicamentos'],
      examesAdicionais: [
        'Se houver dúvida sobre ferropenia associada, considerar receptor solúvel de transferrina — não é reagente de fase aguda.',
        'Avaliar função renal, já que a anemia da DRC compartilha o padrão normocítico.',
        'O tratamento é o da doença de base: ferro isolado tem eficácia limitada enquanto a hepcidina permanecer alta.',
      ],
      explicacao: [
        'Ferro sérico baixo com ferritina alta é o achado que separa esta anemia da ferropriva — e o mecanismo é oposto. Na ferropenia falta ferro; aqui ele sobra e está trancado.',
        'A transferrina reforça o raciocínio: é reagente de fase aguda negativo. Na ferropenia ela sobe (o corpo fabrica mais transportadores); na inflamação, cai. Duas anemias com ferro sérico baixo e comportamentos opostos do transportador.',
        'A consequência prática é direta: reposição oral de ferro funciona mal, porque a hepcidina bloqueia justamente a absorção intestinal. O que resolve é controlar a inflamação.',
      ],
    },
  },

  {
    id: 'infeccao-bacteriana',
    nome: 'Infecção bacteriana',
    categoria: 'Infeccioso',
    contexto: 'Febre alta há dois dias, tosse produtiva, dor pleurítica à direita.',
    idade: [30, 75],
    blocos: [
      { titulo: 'Hemograma', valores: { hemoglobina: 'n', leucocitos: 'A', neutrofilos: 'A', linfocitos: 'b', monocitos: 'n', plaquetas: 'a' } },
      { titulo: 'Inflamatórios', valores: { pcr: 'AA', procalcitonina: 'A', vhs: 'A' } },
      { titulo: 'Função renal e perfusão', valores: { creatinina: 'n', ureia: 'a', lactato: 'n', sodio: 'b' } },
    ],
    interpretacao: {
      alteracoes: ['Leucocitose com neutrofilia', 'PCR muito elevada', 'Procalcitonina elevada', 'Trombocitose reativa'],
      padrao: 'Resposta inflamatória de padrão bacteriano',
      padraoId: 'infeccao-bacteriana',
      mecanismo:
        'O reconhecimento de padrões microbianos dispara IL-1, TNF e IL-6, que aceleram a granulopoese e liberam o pool medular de neutrófilos maduros. A IL-6 reprograma a síntese hepática para proteínas de fase aguda (PCR), e a endotoxina bacteriana induz a expressão da procalcitonina em tecidos que normalmente a mantêm silenciada.',
      hipotese: 'Pneumonia bacteriana',
      diferenciais: ['Infecção viral (procalcitonina baixa, linfocitose)', 'Inflamação estéril (necrose, pós-operatório)', 'Leucocitose por corticoide ou estresse'],
      examesAdicionais: [
        'Culturas antes do antibiótico — uma dose prévia reduz drasticamente o rendimento.',
        'Lactato, para avaliar perfusão e prever gravidade.',
        'PCR seriada: falha em cair em 48 a 72 horas sugere foco não drenado ou agente inadequado.',
      ],
      explicacao: [
        'A procalcitonina é o marcador que mais se aproxima de discriminar bacteriano de viral, e a razão é mecanística: endotoxina e IL-1β induzem sua expressão, enquanto o interferon-gama das infecções virais a inibe. Duas vias opostas atuando sobre o mesmo gene.',
        'A neutrofilia com desvio à esquerda significa que a demanda periférica excedeu o pool de reserva medular, obrigando a liberação de formas jovens. Não é exclusiva de infecção — qualquer estresse medular intenso a produz.',
        'A trombocitose é reativa: a IL-6 estimula a produção hepática de trombopoetina. Se as plaquetas caírem em vez de subir, o cenário muda: consumo séptico é sinal de gravidade.',
        'A leitura mais útil não é o valor de hoje, e sim a tendência. Uma PCR que cai é a evidência mais precoce de que o tratamento está funcionando.',
      ],
    },
  },

  {
    id: 'infeccao-viral',
    nome: 'Infecção viral',
    categoria: 'Infeccioso',
    contexto: 'Febre, odinofagia, adenomegalia cervical e fadiga há uma semana em adulto jovem.',
    idade: [15, 35],
    blocos: [
      { titulo: 'Hemograma', valores: { hemoglobina: 'n', leucocitos: 'n', neutrofilos: 'b', linfocitos: 'A', monocitos: 'a', plaquetas: 'b' } },
      { titulo: 'Inflamatórios', valores: { pcr: 'a', procalcitonina: 'n', vhs: 'a' } },
      { titulo: 'Função hepática', valores: { ast: 'a', alt: 'A', 'fosfatase-alcalina': 'a', 'bilirrubina-total': 'n' } },
    ],
    interpretacao: {
      alteracoes: ['Linfocitose com leucócitos totais normais', 'Neutropenia relativa', 'Transaminases moderadamente elevadas', 'Procalcitonina normal', 'Plaquetopenia discreta'],
      padrao: 'Resposta inflamatória de padrão viral com hepatite associada',
      padraoId: 'infeccao-viral',
      mecanismo:
        'A resposta antiviral é predominantemente celular: clones de linfócitos T ativados proliferam e circulam como linfócitos atípicos. O interferon-gama liberado nessa resposta inibe a produção de procalcitonina — daí ela permanecer baixa apesar da infecção ativa. A hepatite é consequência da resposta imune contra hepatócitos infectados.',
      hipotese: 'Mononucleose infecciosa (EBV) ou infecção por CMV',
      diferenciais: ['Toxoplasmose aguda', 'HIV agudo', 'Hepatites virais', 'Reação medicamentosa'],
      examesAdicionais: [
        'Sorologias para EBV, CMV, toxoplasmose e HIV, respeitando a janela imunológica.',
        'Esfregaço de sangue periférico para caracterizar os linfócitos atípicos.',
        'Evitar amoxicilina na suspeita de mononucleose: provoca exantema característico.',
      ],
      explicacao: [
        'Leucograma normal ou baixo com linfocitose relativa e atipia é o retrato clássico da resposta antiviral. Repare que o total de leucócitos pode nem se alterar — é o diferencial que informa, e sempre em valores absolutos.',
        'A procalcitonina baixa em paciente febril com transaminases elevadas é uma informação forte contra infecção bacteriana. Não é um dado a ignorar: é uma das poucas maneiras laboratoriais de evitar antibiótico desnecessário.',
        'Transaminases moderadamente elevadas em quadro febril com adenomegalia em adulto jovem tornam a mononucleose muito provável. A esplenomegalia associada tem consequência prática: contraindica esporte de contato pelo risco de rotura esplênica.',
      ],
    },
  },

  {
    id: 'lesao-renal-pre-renal',
    nome: 'Lesão renal aguda pré-renal',
    categoria: 'Renal',
    contexto: 'Vômitos e diarreia há três dias, com redução do volume urinário. Mucosas secas, taquicardia.',
    idade: [45, 85],
    blocos: [
      { titulo: 'Função renal', valores: { creatinina: 'A', ureia: 'AA', tfg: 'B' } },
      { titulo: 'Eletrólitos', valores: { sodio: 'a', potassio: 'b', cloro: 'a', bicarbonato: 'b' } },
      { titulo: 'Urina', valores: { 'sodio-urinario': 'B', 'densidade-urinaria': 'A' } },
      { titulo: 'Hemograma', valores: { hemoglobina: 'a', hematocrito: 'a', leucocitos: 'a', plaquetas: 'n' } },
    ],
    interpretacao: {
      alteracoes: ['Elevação de ureia desproporcional à creatinina (relação > 40)', 'Sódio urinário baixo', 'Densidade urinária elevada', 'Hemoconcentração'],
      padrao: 'Azotemia pré-renal',
      padraoId: 'lesao-renal-aguda',
      mecanismo:
        'O parênquima renal está íntegro, mas a perfusão caiu. O túbulo, vivo e sob ação da aldosterona e da ADH, reabsorve avidamente sódio e água — e a ureia vem junto, por arraste e difusão facilitada. A creatinina não é reabsorvida, e é essa diferença que produz a dissociação entre as duas.',
      hipotese: 'Lesão renal aguda pré-renal por hipovolemia (perdas digestivas)',
      diferenciais: ['Necrose tubular aguda (sódio urinário alto, isostenúria, cilindros granulosos)', 'Obstrução urinária', 'Síndrome cardiorrenal ou hepatorrenal'],
      examesAdicionais: [
        'FENa (ou fração de excreção de ureia, se houver diurético em uso).',
        'Sedimento urinário: ausência de cilindros granulosos favorece pré-renal.',
        'Ultrassonografia para excluir obstrução.',
        'Reavaliar a creatinina após reposição volêmica — a reversão confirma o diagnóstico.',
      ],
      explicacao: [
        'A dissociação entre ureia e creatinina é o achado central, e ela tem explicação fisiológica direta: a ureia é reabsorvida no túbulo coletor sob ação da ADH, e a creatinina não. Quando o corpo está retendo água, ele retém ureia junto.',
        'O sódio urinário baixo e a urina concentrada dizem a mesma coisa por outro caminho: o túbulo está funcionando e desesperado por volume. Se ele estivesse lesado, não conseguiria reter sódio nem concentrar — que é exatamente o que se vê na necrose tubular aguda.',
        'A hemoconcentração (hemoglobina e hematócrito no limite superior ou acima) confirma a depleção de volume: não houve produção de hemácias, houve perda de plasma.',
        'A reversibilidade é o que define este quadro. Restaurada a perfusão, a filtração retorna em 24 a 72 horas — não há lesão estrutural a curar. Persistindo a hipoperfusão, porém, ele evolui para necrose tubular.',
      ],
    },
  },

  {
    id: 'necrose-tubular-aguda',
    nome: 'Necrose tubular aguda',
    categoria: 'Renal',
    contexto: 'Pós-operatório de cirurgia de grande porte com hipotensão prolongada e uso de contraste iodado.',
    idade: [50, 85],
    blocos: [
      { titulo: 'Função renal', valores: { creatinina: 'A', ureia: 'A', tfg: 'B' } },
      { titulo: 'Eletrólitos', valores: { sodio: 'n', potassio: 'A', cloro: 'n', bicarbonato: 'B', calcio: 'b', fosforo: 'a' } },
      { titulo: 'Urina', valores: { 'sodio-urinario': 'A', 'densidade-urinaria': 'n', proteinuria: 'a' } },
    ],
    interpretacao: {
      alteracoes: ['Ureia e creatinina elevadas em proporção (relação 10 a 20)', 'Sódio urinário alto', 'Isostenúria', 'Hipercalemia e acidose metabólica'],
      padrao: 'Lesão renal aguda intrínseca',
      padraoId: 'lesao-renal-aguda',
      mecanismo:
        'A isquemia prolongada e o contraste lesaram o epitélio tubular. Sem ele, perde-se a capacidade de reabsorver sódio e de concentrar a urina; células descamadas formam cilindros que obstruem o lúmen, e o filtrado retrodifunde. A excreção de potássio e a regeneração de bicarbonato caem junto.',
      hipotese: 'Necrose tubular aguda isquêmica e por contraste',
      diferenciais: ['Azotemia pré-renal persistente', 'Nefrite intersticial aguda (eosinofilia, leucocitúria estéril)', 'Obstrução urinária', 'Glomerulonefrite'],
      examesAdicionais: [
        'Sedimento urinário à procura de cilindros granulosos pigmentares.',
        'FENa acima de 2% reforça a origem tubular.',
        'Ultrassonografia para excluir componente obstrutivo.',
        'Revisão completa de nefrotóxicos em uso.',
      ],
      explicacao: [
        'A comparação com o cenário pré-renal é o que mais ensina: lá o túbulo estava vivo e reabsorvia tudo; aqui ele está lesado e perde sódio. Os índices urinários não são regras a decorar — são a consequência direta de o túbulo estar íntegro ou não.',
        'A isostenúria (densidade fixa em torno de 1.010, igual à do plasma) significa que o rim perdeu tanto a capacidade de concentrar quanto a de diluir. É um marcador de lesão tubular estabelecida.',
        'A hipercalemia com acidose metabólica é a repercussão que exige atenção imediata: a secreção distal de potássio depende de fluxo tubular e de aldosterona, ambos comprometidos. Hipercalemia com alteração eletrocardiográfica é emergência.',
        'A recuperação leva de uma a três semanas e frequentemente passa por uma fase poliúrica, em que o túbulo em regeneração ainda não reabsorve adequadamente — período em que a reposição de volume e eletrólitos precisa ser cuidadosa.',
      ],
    },
  },

  {
    id: 'doenca-renal-cronica',
    nome: 'Doença renal crônica',
    categoria: 'Renal',
    contexto: 'Diabetes há 15 anos, hipertensão, edema de membros inferiores e fadiga progressiva.',
    idade: [55, 85],
    blocos: [
      { titulo: 'Função renal', valores: { creatinina: 'A', ureia: 'A', tfg: 'B', albuminuria: 'AA' } },
      { titulo: 'Eletrólitos e mineral', valores: { potassio: 'a', bicarbonato: 'b', calcio: 'b', fosforo: 'A', pth: 'AA' } },
      { titulo: 'Hemograma', valores: { hemoglobina: 'B', vcm: 'n', rdw: 'n', plaquetas: 'n' } },
      { titulo: 'Metabólico', valores: { 'glicemia-jejum': 'A', hba1c: 'A', 'acido-urico': 'a' } },
    ],
    interpretacao: {
      alteracoes: ['TFG reduzida com albuminúria acentuada', 'Anemia normocítica', 'Hiperfosfatemia com PTH muito elevado', 'Acidose metabólica', 'Hipercalemia'],
      padrao: 'Doença renal crônica com repercussão sistêmica',
      padraoId: 'sindrome-uremica',
      mecanismo:
        'A perda progressiva de néfrons compromete todas as funções renais ao mesmo tempo: excreção de nitrogênio, potássio e fosfato; regeneração de bicarbonato; ativação da vitamina D; e produção de eritropoetina. É o conjunto — e não a creatinina isolada — que caracteriza a cronicidade.',
      hipotese: 'Doença renal crônica de etiologia diabética, em estágio avançado',
      diferenciais: ['Lesão renal aguda sobreposta', 'Nefroesclerose hipertensiva', 'Glomerulopatia primária'],
      examesAdicionais: [
        'Ultrassonografia renal: rins pequenos reforçam cronicidade.',
        'Estadiamento pelos dois eixos KDIGO — TFG e albuminúria.',
        'Rastreio das complicações: vitamina D, ferro para a anemia, controle de fosfato.',
      ],
      explicacao: [
        'A anemia normocítica com PTH elevado e hiperfosfatemia é o que distingue doença crônica de lesão aguda. Essas alterações levam meses a anos para se instalar — sua presença data a doença.',
        'A albuminúria não é um detalhe do estadiamento: é metade dele. Um paciente com TFG de 40 e albuminúria normal tem prognóstico melhor que outro com TFG de 55 e albuminúria elevada. Ela prediz progressão e risco cardiovascular de forma independente.',
        'O hiperparatireoidismo secundário segue uma cadeia previsível: o rim retém fosfato e deixa de produzir calcitriol; o cálcio cai; a paratireoide responde elevando o PTH, que mobiliza cálcio do osso. A doença mineral e óssea da DRC é essa cadeia sustentada por anos.',
        'Aqui não há normalização a esperar: os néfrons perdidos não voltam. O objetivo passa a ser frear a progressão — controle pressórico e glicêmico, bloqueio do sistema renina-angiotensina, inibidores de SGLT2 e evitar nefrotóxicos.',
      ],
    },
  },

  {
    id: 'hepatite-aguda',
    nome: 'Hepatite aguda',
    categoria: 'Hepático',
    contexto: 'Icterícia, náuseas e astenia há uma semana, precedidas de quadro gripal.',
    idade: [20, 55],
    blocos: [
      { titulo: 'Lesão hepatocelular', valores: { ast: 'AA', alt: 'AA', ldh: 'a' } },
      { titulo: 'Colestase', valores: { 'fosfatase-alcalina': 'a', ggt: 'a', 'bilirrubina-total': 'A', 'bilirrubina-direta': 'A' } },
      { titulo: 'Função sintética', valores: { albumina: 'n', inr: 'a' } },
      { titulo: 'Hemograma', valores: { hemoglobina: 'n', leucocitos: 'b', linfocitos: 'a', plaquetas: 'b' } },
    ],
    interpretacao: {
      alteracoes: ['Transaminases muito elevadas, com predomínio de ALT', 'Hiperbilirrubinemia com fração direta elevada', 'Fosfatase alcalina apenas discretamente alterada', 'INR discretamente alargado'],
      padrao: 'Padrão hepatocelular',
      padraoId: 'hepatocelular',
      mecanismo:
        'A resposta imune contra hepatócitos infectados provoca necrose celular. A ALT, citoplasmática e quase exclusiva do fígado, vaza primeiro e em maior quantidade. A relação R muito acima de 5 caracteriza o padrão hepatocelular: a lesão é da célula, não do canalículo.',
      hipotese: 'Hepatite viral aguda',
      diferenciais: ['Hepatite medicamentosa (incluindo paracetamol)', 'Hepatite isquêmica (LDH proporcionalmente muito alta, queda rápida)', 'Hepatite autoimune', 'Doença de Wilson em pessoa jovem'],
      examesAdicionais: [
        'Sorologias virais: anti-HAV IgM, HBsAg, anti-HBc IgM, anti-HCV.',
        'Revisão de medicamentos, fitoterápicos e suplementos.',
        'INR seriado — é o marcador que define gravidade e a necessidade de avaliar transplante.',
        'Autoanticorpos e imunoglobulinas se as sorologias forem negativas.',
      ],
      explicacao: [
        'A relação entre transaminases e enzimas canaliculares define o padrão, e é o que orienta a próxima investigação. Predomínio de AST e ALT aponta a célula; predomínio de FA e GGT apontaria o fluxo biliar, com investigação por imagem em vez de sorologia.',
        'O INR é o marcador de gravidade, não as transaminases. Um paciente com ALT de 3.000 e INR normal está em situação muito melhor que outro com ALT de 800 e INR de 2,0 — porque o segundo já perdeu função sintética.',
        'Há uma armadilha temporal importante: transaminases que caem enquanto a bilirrubina sobe e o INR alarga não significam melhora. Podem significar que resta menos fígado para lesar.',
        'A magnitude ajuda no diferencial: acima de 1.000 U/L, o diferencial é curto — viral, isquêmica, medicamentosa (paracetamol acima de tudo) e, ocasionalmente, obstrução aguda por cálculo.',
      ],
    },
  },

  {
    id: 'colestase',
    nome: 'Colestase obstrutiva',
    categoria: 'Hepático',
    contexto: 'Icterícia progressiva, colúria, acolia fecal e prurido há duas semanas.',
    idade: [45, 80],
    blocos: [
      { titulo: 'Colestase', valores: { 'fosfatase-alcalina': 'AA', ggt: 'AA', 'bilirrubina-total': 'AA', 'bilirrubina-direta': 'AA' } },
      { titulo: 'Lesão hepatocelular', valores: { ast: 'a', alt: 'a' } },
      { titulo: 'Função sintética', valores: { albumina: 'n', inr: 'a' } },
      { titulo: 'Hemograma e inflamatórios', valores: { leucocitos: 'a', neutrofilos: 'a', pcr: 'A' } },
    ],
    interpretacao: {
      alteracoes: ['Fosfatase alcalina e GGT muito elevadas', 'Hiperbilirrubinemia às custas da fração direta', 'Transaminações apenas discretamente elevadas', 'INR discretamente alargado'],
      padrao: 'Padrão colestático',
      padraoId: 'colestatico',
      mecanismo:
        'O fluxo biliar está bloqueado. Os ácidos biliares acumulados induzem a síntese das enzimas canaliculares (FA e GGT) e as liberam da membrana. A bilirrubina já conjugada reflui para o sangue: por ser hidrossolúvel, é filtrada (colúria) e falta no intestino (acolia).',
      hipotese: 'Colestase obstrutiva extra-hepática',
      diferenciais: ['Coledocolitíase', 'Neoplasia periampular ou de cabeça de pâncreas', 'Colangite biliar primária', 'Colestase medicamentosa'],
      examesAdicionais: [
        'Ultrassonografia de vias biliares: dilatação indica obstrução extra-hepática.',
        'Se houver febre com dor e icterícia, considerar colangite — é emergência com necessidade de drenagem.',
        'Anticorpo antimitocôndria se as vias não estiverem dilatadas.',
        'INR: alarga por má absorção de vitamina K, e costuma corrigir com reposição parenteral.',
      ],
      explicacao: [
        'A GGT tem papel decisivo aqui: ela confirma que a fosfatase alcalina veio do fígado. FA alta com GGT normal apontaria osso, placenta ou intestino — e mudaria a investigação por completo.',
        'A colúria e a acolia são a tradução semiológica da bioquímica. A bilirrubina direta é hidrossolúvel e escurece a urina; sua ausência no intestino tira a cor das fezes. Icterícia sem colúria seria hiperbilirrubinemia indireta, com diferencial completamente diferente.',
        'O INR alargado nesta situação costuma ser deficiência de vitamina K, e não falência hepática: a vitamina é lipossolúvel e depende de sais biliares para ser absorvida. A resposta à vitamina K parenteral em 12 a 24 horas distingue as duas — e o fator V confirma.',
        'Icterícia progressiva e indolor em pessoa de mais idade tem um diferencial que não pode ser adiado: neoplasia periampular.',
      ],
    },
  },

  {
    id: 'cirrose',
    nome: 'Cirrose descompensada',
    categoria: 'Hepático',
    contexto: 'Ascite, confusão mental flutuante e história de etilismo pesado.',
    idade: [45, 75],
    blocos: [
      { titulo: 'Função sintética', valores: { albumina: 'B', inr: 'A', 'bilirrubina-total': 'A' } },
      { titulo: 'Enzimas hepáticas', valores: { ast: 'a', alt: 'n', ggt: 'A', 'fosfatase-alcalina': 'a' } },
      { titulo: 'Hemograma', valores: { hemoglobina: 'b', vcm: 'a', leucocitos: 'b', plaquetas: 'B' } },
      { titulo: 'Eletrólitos e metabólico', valores: { sodio: 'B', potassio: 'n', creatinina: 'a', ureia: 'b', amonia: 'A' } },
    ],
    interpretacao: {
      alteracoes: ['Albumina baixa com INR alargado', 'Plaquetopenia', 'Relação AST/ALT invertida com GGT elevada', 'Hiponatremia', 'Amônia elevada com ureia baixa'],
      padrao: 'Insuficiência hepática com hipertensão portal',
      padraoId: 'insuficiencia-hepatica',
      mecanismo:
        'A fibrose substituiu o parênquima e distorceu a arquitetura vascular, produzindo dois conjuntos de consequências: perda de função sintética e detoxificadora, e hipertensão portal com hiperesplenismo. As transaminases podem ser quase normais — resta pouco hepatócito para lesar.',
      hipotese: 'Cirrose hepática descompensada de etiologia alcoólica, com encefalopatia',
      diferenciais: ['Insuficiência hepática aguda sobre crônica', 'Trombose de veia porta', 'Peritonite bacteriana espontânea como precipitante'],
      examesAdicionais: [
        'Paracentese diagnóstica: contagem de polimorfonucleares no líquido ascítico afasta ou confirma peritonite bacteriana espontânea.',
        'Buscar precipitantes de encefalopatia: infecção, sangramento, constipação, distúrbio eletrolítico, hipocalemia.',
        'Escores de Child-Pugh e MELD para estratificar gravidade.',
      ],
      explicacao: [
        'Este cenário ilustra por que "provas de função hepática" é um nome enganoso. As transaminações estão quase normais e o fígado está gravemente insuficiente — quem denuncia isso são albumina, INR e bilirrubina.',
        'A plaquetopenia tem dupla origem e é frequentemente o primeiro sinal laboratorial de hipertensão portal: menos trombopoetina hepática somada ao sequestro esplênico.',
        'Ureia baixa com amônia alta é um par que confunde quem lê a ureia como marcador renal. Aqui ela está baixa exatamente porque o ciclo da ureia hepático falhou — e é essa falha que permite a amônia acumular e produzir encefalopatia.',
        'A hiponatremia decorre da vasodilatação esplâncnica, que reduz o volume arterial efetivo e ativa a ADH. É marcador prognóstico independente e entra no MELD-Na.',
        'A hipocalemia, quando presente, merece correção ativa: ela aumenta a amoniogênese renal e agrava a encefalopatia.',
      ],
    },
  },

  {
    id: 'esteatose',
    nome: 'Doença hepática gordurosa',
    categoria: 'Hepático',
    contexto: 'Achado incidental de esteatose à ultrassonografia. Obesidade e sedentarismo.',
    idade: [35, 65],
    blocos: [
      { titulo: 'Enzimas hepáticas', valores: { alt: 'A', ast: 'a', ggt: 'A', 'fosfatase-alcalina': 'n', 'bilirrubina-total': 'n' } },
      { titulo: 'Função sintética', valores: { albumina: 'n', inr: 'n', plaquetas: 'n' } },
      { titulo: 'Metabólico', valores: { 'glicemia-jejum': 'a', hba1c: 'a', triglicerideos: 'A', hdl: 'b', ldl: 'a', 'acido-urico': 'a' } },
      { titulo: 'Ferro', valores: { ferritina: 'A', 'saturacao-transferrina': 'n' } },
    ],
    interpretacao: {
      alteracoes: ['ALT elevada com relação AST/ALT abaixo de 1', 'GGT elevada', 'Triglicerídeos altos com HDL baixo', 'Glicemia e glicada no limite superior', 'Ferritina elevada com saturação normal'],
      padrao: 'Padrão hepatocelular leve com síndrome metabólica',
      padraoId: 'hepatocelular',
      mecanismo:
        'A resistência à insulina aumenta o fluxo de ácidos graxos ao fígado e a lipogênese de novo. O acúmulo de triglicerídeos no hepatócito gera lipotoxicidade e inflamação de baixo grau — que é o que eleva discretamente a ALT e a GGT.',
      hipotese: 'Doença hepática gordurosa associada à disfunção metabólica',
      diferenciais: ['Doença hepática alcoólica (AST/ALT > 2)', 'Hepatite C', 'Hemocromatose (saturação da transferrina alta)', 'Hepatite autoimune'],
      examesAdicionais: [
        'Sorologias virais e autoanticorpos para excluir outras causas.',
        'Saturação da transferrina para afastar hemocromatose — ferritina alta isolada aqui é inflamatória, não sobrecarga.',
        'Escores de fibrose (FIB-4, NFS) e elastografia para estratificar risco.',
      ],
      explicacao: [
        'Esta é a causa mais comum de transaminases cronicamente elevadas na população geral — e a única em que a mudança de estilo de vida é, ela própria, o tratamento. Perda de 7 a 10% do peso costuma normalizar as enzimas.',
        'A relação AST/ALT abaixo de 1 é o que separa da doença alcoólica, em que ela costuma ficar acima de 2. Inversão dessa relação na esteatose sugere fibrose avançada e muda o prognóstico.',
        'A ferritina alta com saturação de transferrina normal é o detalhe que evita um erro comum: aqui ela é reagente de fase aguda, refletindo inflamação e esteatose — não sobrecarga de ferro. Saturação acima de 45% seria outra história e pediria pesquisa de hemocromatose.',
        'Triglicerídeos altos com HDL baixo, ácido úrico elevado e glicemia limítrofe não são cinco achados independentes: são o mesmo mecanismo de resistência à insulina visto de ângulos diferentes.',
      ],
    },
  },

  {
    id: 'hipotireoidismo-primario',
    nome: 'Hipotireoidismo primário',
    categoria: 'Endócrino',
    contexto: 'Ganho de peso, intolerância ao frio, constipação e sonolência há meses.',
    idade: [30, 70],
    sexo: 'F',
    blocos: [
      { titulo: 'Eixo tireoidiano', valores: { tsh: 'AA', 't4-livre': 'B', t3: 'b' } },
      { titulo: 'Repercussão metabólica', valores: { 'colesterol-total': 'A', ldl: 'A', ck: 'A', sodio: 'b' } },
      { titulo: 'Hemograma', valores: { hemoglobina: 'b', vcm: 'a' } },
    ],
    interpretacao: {
      alteracoes: ['TSH muito elevado com T4 livre reduzido', 'Hipercolesterolemia', 'CK elevada', 'Anemia leve com VCM no limite superior'],
      padrao: 'Hipotireoidismo primário',
      padraoId: 'hipotireoidismo-primario',
      mecanismo:
        'A glândula perdeu capacidade de produzir T4. A queda desinibe a hipófise íntegra, que eleva o TSH — e como a relação entre eles é logarítmica, o TSH sobe muito antes de o T4 sair da faixa. A falta de hormônio tireoidiano reduz a expressão de receptores hepáticos de LDL (colesterol sobe) e altera o metabolismo muscular (CK sobe).',
      hipotese: 'Hipotireoidismo primário, provavelmente por tireoidite de Hashimoto',
      diferenciais: ['Hipotireoidismo central (TSH baixo ou inapropriadamente normal)', 'Síndrome do eutireoidiano doente', 'Interferência por biotina'],
      examesAdicionais: [
        'Anti-TPO para confirmar etiologia autoimune.',
        'Reavaliar TSH em 6 a 8 semanas após iniciar levotiroxina — antes disso, o valor ainda reflete a dose anterior.',
        'A dislipidemia costuma melhorar com a correção do hipotireoidismo: reavaliar antes de iniciar estatina.',
      ],
      explicacao: [
        'A leitura correta parte de uma única pergunta: o TSH está apropriado para esse T4? Aqui está — o T4 caiu e a hipófise, íntegra, cobrou. Se o TSH estivesse baixo ou "normal" com T4 baixo, a lesão seria central, e a investigação iria para a hipófise.',
        'A CK elevada é um achado que costuma passar despercebido e gerar investigação de miopatia. Vale a regra prática: CK elevada inexplicada pede dosagem de TSH — é causa frequente e facilmente tratável.',
        'A hipercolesterolemia aqui é secundária e reversível. Excluir hipotireoidismo antes de rotular como dislipidemia primária evita tratar por anos a consequência em vez da causa.',
        'A hiponatremia dos casos mais graves decorre da redução do clearance de água livre — mais um exemplo de como um distúrbio endócrino se escreve no painel eletrolítico.',
      ],
    },
  },

  {
    id: 'hipertireoidismo-primario',
    nome: 'Hipertireoidismo primário',
    categoria: 'Endócrino',
    contexto: 'Perda de peso com apetite preservado, palpitações, tremor e intolerância ao calor.',
    idade: [25, 55],
    sexo: 'F',
    blocos: [
      { titulo: 'Eixo tireoidiano', valores: { tsh: 'B', 't4-livre': 'A', t3: 'A' } },
      { titulo: 'Repercussão metabólica', valores: { 'colesterol-total': 'b', ldl: 'b', 'fosfatase-alcalina': 'a', calcio: 'a' } },
      { titulo: 'Hemograma', valores: { hemoglobina: 'n', leucocitos: 'b', neutrofilos: 'b' } },
    ],
    interpretacao: {
      alteracoes: ['TSH suprimido com T4 livre e T3 elevados', 'Colesterol reduzido', 'Fosfatase alcalina elevada', 'Discreta leucopenia'],
      padrao: 'Hipertireoidismo primário',
      padraoId: 'hipertireoidismo-primario',
      mecanismo:
        'A tireoide produz hormônio sem obedecer ao TSH — por autoanticorpo estimulador do receptor, por autonomia nodular ou por liberação do estoque numa glândula em destruição. O excesso de hormônio suprime a hipófise e acelera o catabolismo, o turnover ósseo e a frequência cardíaca.',
      hipotese: 'Hipertireoidismo primário, a esclarecer se por doença de Graves ou tireoidite',
      diferenciais: ['Doença de Graves', 'Bócio multinodular tóxico', 'Tireoidite subaguda ou pós-parto', 'Tireotoxicose factícia', 'Interferência por biotina'],
      examesAdicionais: [
        'TRAb: positivo confirma doença de Graves.',
        'Cintilografia com captação: alta em Graves e nódulo tóxico; baixa em tireoidite destrutiva — e essa diferença muda o tratamento por completo.',
        'Tireoglobulina baixa sugere origem exógena.',
        'Avaliar repercussão cardíaca: fibrilação atrial é complicação frequente.',
      ],
      explicacao: [
        'A distinção entre Graves e tireoidite destrutiva é a decisão mais importante deste cenário. Na tireoidite não há síntese aumentada — há liberação de hormônio pré-formado por uma glândula que está sendo destruída. Antitireoidianos, que bloqueiam a síntese, não funcionam.',
        'Colesterol baixo em paciente sem tratamento hipolipemiante é uma pista subutilizada: o catabolismo acelerado o consome. Junto a perda de peso e taquicardia, aponta tireotoxicose.',
        'A fosfatase alcalina elevada reflete turnover ósseo aumentado — e antecipa o risco de perda de massa óssea na tireotoxicose prolongada.',
        'Vale sempre perguntar sobre suplementos: a biotina em altas doses produz exatamente este padrão laboratorial (TSH baixo com T4 e T3 altos) em pessoa sem doença alguma.',
      ],
    },
  },

  {
    id: 'cetoacidose-diabetica',
    nome: 'Cetoacidose diabética',
    categoria: 'Metabólico',
    contexto: 'Poliúria, polidipsia, dor abdominal e respiração profunda. Diabetes tipo 1 com omissão de insulina.',
    idade: [15, 45],
    blocos: [
      { titulo: 'Metabólico', valores: { 'glicemia-jejum': 'AA', hba1c: 'A' } },
      { titulo: 'Gasometria', valores: { ph: 'B', paco2: 'B', bicarbonato: 'B', 'anion-gap': 'AA', lactato: 'a' } },
      { titulo: 'Eletrólitos', valores: { sodio: 'b', potassio: 'a', cloro: 'b', fosforo: 'a', magnesio: 'b' } },
      { titulo: 'Função renal e hemograma', valores: { creatinina: 'a', ureia: 'A', leucocitos: 'A', neutrofilos: 'A', hematocrito: 'a' } },
    ],
    interpretacao: {
      alteracoes: ['Hiperglicemia acentuada', 'Acidose metabólica com ânion gap muito elevado', 'PaCO₂ baixa (compensação respiratória)', 'Potássio no limite superior com déficit corporal', 'Hiponatremia (corrigir pela glicemia)', 'Leucocitose sem infecção'],
      padrao: 'Cetoacidose diabética',
      padraoId: 'cetoacidose-diabetica',
      mecanismo:
        'A deficiência de insulina com excesso de hormônios contrarreguladores libera a lipólise; os ácidos graxos são convertidos em cetoácidos no fígado, que consomem bicarbonato e elevam o ânion gap. A hiperglicemia causa diurese osmótica, com desidratação e perda de potássio, fósforo e magnésio.',
      hipotese: 'Cetoacidose diabética por omissão de insulina',
      diferenciais: ['Estado hiperglicêmico hiperosmolar (sem acidose significativa)', 'Cetoacidose alcoólica', 'Acidose lática', 'Intoxicações com ânion gap alto'],
      examesAdicionais: [
        'Cetonemia (beta-hidroxibutirato) é preferível à cetonúria: a fita detecta acetoacetato e subestima na fase inicial.',
        'Buscar o precipitante: infecção, infarto, omissão de insulina, gestação.',
        'Acompanhar o fechamento do ânion gap, e não apenas a glicemia.',
      ],
      explicacao: [
        'O potássio deste cenário é a lição mais importante e a que mais causa dano quando ignorada. O plasmático está normal ou até alto — a acidose e a falta de insulina o empurraram para fora da célula. Mas o corporal total está gravemente depletado pela diurese osmótica. Iniciar insulina sem repor potássio joga o íon de volta para dentro da célula e produz hipocalemia grave.',
        'O sódio precisa ser corrigido pela glicemia antes de qualquer conclusão: some 1,6 mEq/L para cada 100 mg/dL de glicose acima de 100. A hiponatremia é verdadeira e apropriada — a glicose puxou água do intracelular —, e tratá-la com salina sem corrigir a glicemia trata um problema que não existe.',
        'A leucocitose aqui não significa infecção: a desidratação e o estresse metabólico produzem leucocitose por desmarginação. Isso não dispensa procurar um foco, mas impede concluir infecção pelo hemograma.',
        'O parâmetro de acompanhamento é o fechamento do ânion gap, não a glicemia. Ela normaliza antes da acidose, e suspender a insulina nesse momento reabre o quadro. Inibidores de SGLT2, aliás, causam cetoacidose com glicemia quase normal.',
      ],
    },
  },

  {
    id: 'diabetes-descompensado',
    nome: 'Diabetes descompensado',
    categoria: 'Metabólico',
    contexto: 'Poliúria e perda de peso há dois meses, sem sinais de descompensação aguda.',
    idade: [40, 75],
    blocos: [
      { titulo: 'Metabólico', valores: { 'glicemia-jejum': 'AA', hba1c: 'AA', insulina: 'a' } },
      { titulo: 'Perfil lipídico', valores: { triglicerideos: 'A', hdl: 'b', ldl: 'a', 'colesterol-total': 'a' } },
      { titulo: 'Rastreio de complicações', valores: { creatinina: 'a', tfg: 'b', albuminuria: 'A' } },
      { titulo: 'Hepático', valores: { alt: 'a', ggt: 'a' } },
    ],
    interpretacao: {
      alteracoes: ['Hiperglicemia com glicada muito elevada', 'Dislipidemia aterogênica', 'Albuminúria aumentada com TFG limítrofe', 'Transaminases discretamente elevadas'],
      padrao: 'Diabetes tipo 2 descompensado com complicação microvascular em instalação',
      mecanismo:
        'A resistência à insulina somada à falência progressiva da célula beta eleva a glicemia. A mesma resistência aumenta o fluxo de ácidos graxos ao fígado (triglicerídeos altos, HDL baixo, esteatose) e a hiperfiltração glomerular inicia a lesão que aparece como albuminúria.',
      hipotese: 'Diabetes mellitus tipo 2 descompensado com nefropatia incipiente',
      diferenciais: ['Diabetes tipo 1 de instalação tardia (LADA)', 'Diabetes secundário a pancreatopatia ou medicamentos'],
      examesAdicionais: [
        'Repetir a albuminúria: o diagnóstico exige duas de três amostras alteradas em 3 a 6 meses.',
        'Fundoscopia e avaliação de neuropatia.',
        'Peptídeo C e autoanticorpos se houver dúvida sobre o tipo.',
      ],
      explicacao: [
        'A albuminúria é o marcador mais precoce de nefropatia diabética: aparece anos antes de a creatinina se mover, e é justamente por isso que o rastreio anual existe.',
        'A dislipidemia aterogênica — triglicerídeos altos com HDL baixo — costuma coexistir e responde à mesma fisiopatologia. Com triglicerídeos elevados, o LDL calculado subestima o risco: não-HDL e apoB são melhores alvos.',
        'ALT e GGT discretamente elevadas apontam esteatose hepática associada, que faz parte do mesmo espectro metabólico e tem seu próprio risco de progressão para fibrose.',
        'A glicada leva de 8 a 12 semanas para refletir uma mudança terapêutica. Repetir antes disso induz ajustes de dose baseados em informação desatualizada.',
      ],
    },
  },

  {
    id: 'infarto-agudo',
    nome: 'Infarto agudo do miocárdio',
    categoria: 'Cardiovascular',
    contexto: 'Dor torácica opressiva há três horas, com irradiação para o membro superior esquerdo e sudorese.',
    idade: [50, 80],
    blocos: [
      { titulo: 'Marcadores de lesão', valores: { troponina: 'AA', 'ck-mb': 'A', ck: 'a' } },
      { titulo: 'Contexto', valores: { creatinina: 'n', hemoglobina: 'n', 'glicemia-jejum': 'a', potassio: 'n' } },
      { titulo: 'Perfil lipídico', valores: { 'colesterol-total': 'a', ldl: 'A', hdl: 'b', triglicerideos: 'a' } },
      { titulo: 'Inflamatórios', valores: { pcr: 'a', leucocitos: 'a' } },
    ],
    interpretacao: {
      alteracoes: ['Troponina muito elevada', 'CK-MB elevada', 'Hiperglicemia de estresse', 'Perfil lipídico aterogênico'],
      padrao: 'Síndrome coronariana aguda',
      padraoId: 'sindrome-coronariana-aguda',
      mecanismo:
        'A ruptura ou erosão de placa aterosclerótica desencadeou trombose coronária. O miocárdio a jusante necrosou e liberou troponina — primeiro o pool citoplasmático, depois, mais lentamente, o aparelho contrátil. Isso produz a curva de ascensão e queda que caracteriza a lesão aguda.',
      hipotese: 'Infarto agudo do miocárdio',
      diferenciais: ['Miocardite', 'Takotsubo', 'Embolia pulmonar', 'Dissecção de aorta', 'Infarto tipo 2 por desequilíbrio de oferta e demanda'],
      examesAdicionais: [
        'Troponina seriada em 1 a 3 horas: é o delta entre coletas que caracteriza lesão aguda.',
        'Eletrocardiograma seriado e ecocardiograma.',
        'Creatinina e hemoglobina orientam contraste e estratégia antitrombótica.',
      ],
      explicacao: [
        'Troponina elevada significa lesão miocárdica — não necessariamente infarto. O infarto exige, além da elevação, variação dinâmica entre coletas e contexto clínico de isquemia. Sem esse segundo componente, chama-se lesão miocárdica, e o tratamento é outro.',
        'É a segunda dosagem que diagnostica. Uma troponina isolada alta, sem delta e sem contexto, pode ser doença renal, insuficiência cardíaca ou hipertrofia — condições em que anticoagular e cateterizar não beneficiam.',
        'A hiperglicemia de estresse é esperada e não estabelece diagnóstico de diabetes: catecolaminas e cortisol elevam a glicemia na fase aguda. A glicada, colhida depois, é quem responde a essa pergunta.',
        'O perfil lipídico colhido nas primeiras horas ainda é confiável; a partir daí, permanece alterado por 6 a 8 semanas e não deve ser usado para decisões terapêuticas de longo prazo.',
      ],
    },
  },

  {
    id: 'insuficiencia-cardiaca',
    nome: 'Insuficiência cardíaca descompensada',
    categoria: 'Cardiovascular',
    contexto: 'Dispneia progressiva, ortopneia, edema de membros inferiores e ganho de peso em duas semanas.',
    idade: [55, 90],
    blocos: [
      { titulo: 'Sobrecarga ventricular', valores: { 'nt-probnp': 'AA', troponina: 'a' } },
      { titulo: 'Função renal e eletrólitos', valores: { creatinina: 'A', ureia: 'A', tfg: 'B', sodio: 'B', potassio: 'a' } },
      { titulo: 'Hemograma', valores: { hemoglobina: 'b', vcm: 'n' } },
      { titulo: 'Hepático', valores: { ast: 'a', alt: 'a', ggt: 'a', 'bilirrubina-total': 'a', albumina: 'b' } },
    ],
    interpretacao: {
      alteracoes: ['NT-proBNP muito elevado', 'Piora da função renal', 'Hiponatremia', 'Elevação discreta de troponina', 'Enzimas hepáticas alteradas por congestão'],
      padrao: 'Insuficiência cardíaca descompensada com síndrome cardiorrenal',
      padraoId: 'insuficiencia-cardiaca',
      mecanismo:
        'O aumento da pressão de enchimento ventricular estira o miócito, que cliva o proBNP em BNP e NT-proBNP. A queda do volume arterial efetivo ativa a ADH e o sistema renina-angiotensina-aldosterona, retendo água (hiponatremia) e comprometendo a perfusão renal. A congestão venosa hepática altera as enzimas.',
      hipotese: 'Insuficiência cardíaca descompensada',
      diferenciais: ['Doença pulmonar como causa da dispneia', 'Embolia pulmonar', 'Doença renal crônica com sobrecarga volêmica'],
      examesAdicionais: [
        'Ecocardiograma para fração de ejeção e etiologia.',
        'Investigar o precipitante: infecção, arritmia, isquemia, má adesão, excesso de sal.',
        'Se houver uso de sacubitril, acompanhar com NT-proBNP, e não com BNP.',
      ],
      explicacao: [
        'A hiponatremia não é um detalhe: é marcador prognóstico independente na insuficiência cardíaca e decorre diretamente da ativação da ADH pelo volume arterial efetivo reduzido — mesmo com o paciente edemaciado.',
        'A troponina discretamente elevada não indica infarto aqui: reflete lesão subendocárdica por sobrecarga de parede. É a diferença entre lesão miocárdica e síndrome coronariana.',
        'As alterações hepáticas — transaminases, GGT e bilirrubina discretamente elevadas com albumina baixa — são de congestão passiva, o "fígado cardíaco". Melhoram com a descongestão.',
        'A piora da função renal durante a descompensação é a síndrome cardiorrenal, e resulta tanto do baixo débito quanto da congestão venosa renal — que muitas vezes pesa mais que o débito.',
      ],
    },
  },

  {
    id: 'sepse',
    nome: 'Sepse',
    categoria: 'Infeccioso',
    contexto: 'Febre, hipotensão e confusão mental. Foco urinário provável.',
    idade: [55, 90],
    blocos: [
      { titulo: 'Perfusão e inflamação', valores: { lactato: 'AA', pcr: 'AA', procalcitonina: 'AA' } },
      { titulo: 'Hemograma', valores: { leucocitos: 'A', neutrofilos: 'A', linfocitos: 'B', plaquetas: 'B', hemoglobina: 'b' } },
      { titulo: 'Função orgânica', valores: { creatinina: 'A', ureia: 'A', 'bilirrubina-total': 'a', inr: 'a', albumina: 'B' } },
      { titulo: 'Gasometria', valores: { ph: 'b', bicarbonato: 'b', 'anion-gap': 'A', paco2: 'b' } },
    ],
    interpretacao: {
      alteracoes: ['Lactato muito elevado', 'Leucocitose com neutrofilia e linfopenia', 'Plaquetopenia', 'Lesão renal aguda', 'Acidose metabólica com ânion gap elevado', 'Hipoalbuminemia'],
      padrao: 'Sepse com disfunção orgânica múltipla',
      padraoId: 'sepse',
      mecanismo:
        'A resposta desregulada à infecção causa vasodilatação, extravasamento capilar e disfunção microcirculatória. A hipoperfusão desvia o metabolismo para a via anaeróbia (lactato) e compromete rim, fígado, coagulação e sistema nervoso — a disfunção orgânica que define sepse.',
      hipotese: 'Sepse de foco urinário',
      diferenciais: ['Choque cardiogênico', 'Choque hipovolêmico', 'Pancreatite grave', 'Insuficiência adrenal aguda'],
      examesAdicionais: [
        'Hemoculturas e urocultura antes do antibiótico — sem atrasar o antibiótico por elas.',
        'Lactato seriado: o clearance orienta a reanimação melhor que qualquer valor isolado.',
        'Imagem para identificar e controlar o foco.',
      ],
      explicacao: [
        'O lactato é o marcador funcional de perfusão: sobe antes que a pressão arterial caia e prediz mortalidade. Acompanhar sua queda durante a reanimação é mais útil do que o valor de admissão.',
        'A linfopenia com neutrofilia é achado frequente e subvalorizado na sepse, e associa-se a pior prognóstico. Se houver leucopenia em vez de leucocitose, o sinal é de gravidade — não de ausência de infecção.',
        'A hipoalbuminemia aguda aqui não é desnutrição: a IL-6 desvia a síntese hepática para proteínas de fase aguda, e o extravasamento capilar redistribui a albumina para o interstício.',
        'A elevação de bilirrubina reflete colestase funcional — citocinas inibem os transportadores canaliculares sem que exista obstrução alguma.',
        'Nenhum antibiótico resolve sepse com foco não controlado. Identificar e drenar é parte do tratamento, não um passo posterior.',
      ],
    },
  },

  {
    id: 'hiponatremia-siadh',
    nome: 'Hiponatremia por SIADH',
    categoria: 'Metabólico',
    contexto: 'Confusão mental e náuseas. Euvolêmico ao exame. Em uso de antidepressivo iniciado há um mês.',
    idade: [55, 85],
    blocos: [
      { titulo: 'Eletrólitos', valores: { sodio: 'B', potassio: 'n', cloro: 'b', bicarbonato: 'n' } },
      { titulo: 'Função renal', valores: { creatinina: 'n', ureia: 'b', 'acido-urico': 'B' } },
      { titulo: 'Urina', valores: { 'sodio-urinario': 'A', 'densidade-urinaria': 'a' } },
      { titulo: 'Endócrino', valores: { tsh: 'n', cortisol: 'n' } },
    ],
    interpretacao: {
      alteracoes: ['Hiponatremia significativa', 'Sódio urinário elevado', 'Urina inapropriadamente concentrada', 'Ureia e ácido úrico baixos'],
      padrao: 'Hiponatremia euvolêmica com ADH inapropriada',
      padraoId: 'siadh',
      mecanismo:
        'A ADH é secretada apesar de a osmolalidade plasmática estar baixa. O rim retém água livre e o sódio dilui. A leve expansão de volume resultante aumenta a excreção renal de sódio e de urato — por isso o sódio urinário é alto e a ureia e o ácido úrico são baixos, o oposto do que se vê na hipovolemia.',
      hipotese: 'SIADH, provavelmente medicamentoso',
      diferenciais: ['Hiponatremia hipovolêmica', 'Hiponatremia hipervolêmica (insuficiência cardíaca, cirrose)', 'Hipotireoidismo grave', 'Insuficiência adrenal', 'Polidipsia primária'],
      examesAdicionais: [
        'Osmolalidade plasmática e urinária.',
        'TSH e cortisol — o diagnóstico de SIADH é de exclusão e exige afastá-los.',
        'Revisão de medicamentos: ISRS, carbamazepina, antipsicóticos.',
        'Investigar causas ocultas quando não houver fármaco: neoplasia pulmonar, doença do SNC, pneumopatia.',
      ],
      explicacao: [
        'Ureia e ácido úrico baixos são o detalhe que separa SIADH de hipovolemia com mais elegância que qualquer outro achado. Na hipovolemia, o túbulo é ávido e retém tudo — ureia e urato sobem. No SIADH, a discreta expansão faz o rim excretá-los.',
        'O sódio urinário alto em paciente hiponatrêmico parece contraditório e não é: o rim está excretando sódio normalmente, porque não falta volume. O que sobra é água.',
        'A conduta segue diretamente do mecanismo: restrição hídrica, não salina. Infundir salina isotônica no SIADH pode piorar a hiponatremia, porque o rim excreta o sódio e retém a água.',
        'A velocidade de correção é o ponto de maior risco. Na hiponatremia crônica, o cérebro se adaptou exportando osmóis; corrigir rápido demais retira água do neurônio bruscamente e causa desmielinização osmótica, muitas vezes irreversível. O limite é de 8 a 10 mEq/L em 24 horas.',
      ],
    },
  },

  {
    id: 'acidose-metabolica-lactica',
    nome: 'Acidose lática',
    categoria: 'Ácido-base',
    contexto: 'Hipotensão, extremidades frias e oligúria após quadro infeccioso.',
    idade: [50, 85],
    blocos: [
      { titulo: 'Gasometria', valores: { ph: 'B', paco2: 'B', bicarbonato: 'B', 'anion-gap': 'AA', lactato: 'AA', pao2: 'b' } },
      { titulo: 'Eletrólitos', valores: { sodio: 'n', potassio: 'a', cloro: 'n' } },
      { titulo: 'Função orgânica', valores: { creatinina: 'A', ureia: 'A', 'bilirrubina-total': 'a', inr: 'a' } },
    ],
    interpretacao: {
      alteracoes: ['Acidose metabólica grave com ânion gap muito elevado', 'Lactato muito elevado', 'Compensação respiratória presente', 'Lesão renal aguda'],
      padrao: 'Acidose metabólica com ânion gap aumentado por lactato',
      padraoId: 'acidose-metabolica-anion-gap-alto',
      mecanismo:
        'A oferta de oxigênio não sustenta a demanda tecidual. O piruvato é desviado para lactato a fim de regenerar NAD⁺ e manter a glicólise. O lactato consome bicarbonato ao ser tamponado, e seu ânion ocupa o lugar dele — elevando o ânion gap.',
      hipotese: 'Acidose lática por hipoperfusão (choque)',
      diferenciais: ['Cetoacidose (cetonas positivas)', 'Uremia', 'Intoxicação por metanol, etilenoglicol ou salicilato', 'Acidose lática tipo B (metformina, linezolida, deficiência de tiamina)'],
      examesAdicionais: [
        'Se não houver lactato nem cetonas que expliquem o gap, calcular o gap osmolar e considerar intoxicação.',
        'Corrigir o ânion gap pela albumina — sem isso, o diagnóstico se perde nos pacientes mais graves.',
        'Lactato seriado para acompanhar a resposta à reanimação.',
      ],
      explicacao: [
        'A compensação respiratória pode ser conferida pela fórmula de Winter: PaCO₂ esperada ≈ 1,5 × bicarbonato + 8 ± 2. Fora dessa faixa, existe um segundo distúrbio — e descobri-lo muda a conduta.',
        'Nem todo lactato alto é hipoperfusão. Beta-2-agonistas em dose alta, adrenalina, metformina, linezolida e deficiência de tiamina o elevam sem déficit de oferta de oxigênio. Perseguir esses casos com volume pode ser prejudicial.',
        'A correção da acidose com bicarbonato não trata a causa e tem indicações restritas: o que resolve é restaurar a perfusão. O lactato cai quando o tecido volta a receber oxigênio.',
        'A correção do ânion gap pela albumina é obrigatória em internados: some 2,5 mEq/L para cada 1 g/dL de albumina abaixo de 4.',
      ],
    },
  },

  {
    id: 'acidose-respiratoria-cronica',
    nome: 'Acidose respiratória crônica',
    categoria: 'Ácido-base',
    contexto: 'DPOC avançado com piora da dispneia e sonolência.',
    idade: [60, 85],
    blocos: [
      { titulo: 'Gasometria', valores: { ph: 'b', paco2: 'AA', bicarbonato: 'A', pao2: 'B' } },
      { titulo: 'Hemograma', valores: { hemoglobina: 'a', hematocrito: 'a', leucocitos: 'a' } },
      { titulo: 'Eletrólitos', valores: { sodio: 'n', potassio: 'n', cloro: 'b' } },
    ],
    interpretacao: {
      alteracoes: ['Hipercapnia acentuada com acidemia discreta', 'Bicarbonato elevado (compensação renal)', 'Hipoxemia', 'Policitemia secundária'],
      padrao: 'Acidose respiratória crônica agudizada',
      padraoId: 'acidose-respiratoria',
      mecanismo:
        'A ventilação alveolar não elimina o CO₂ produzido. O rim compensa retendo bicarbonato — processo que leva de 3 a 5 dias, e é justamente por isso que o bicarbonato elevado data o distúrbio como crônico. A hipoxemia crônica estimula a eritropoetina e produz policitemia secundária.',
      hipotese: 'Acidose respiratória crônica agudizada em DPOC',
      diferenciais: ['Acidose respiratória aguda (bicarbonato normal)', 'Depressão do centro respiratório por sedativos', 'Doença neuromuscular', 'Síndrome de hipoventilação da obesidade'],
      examesAdicionais: [
        'Comparar com gasometrias anteriores para estabelecer o basal do paciente.',
        'Avaliar necessidade de ventilação não invasiva.',
        'Investigar o precipitante da agudização: infecção, embolia, pneumotórax, sedativos.',
      ],
      explicacao: [
        'O bicarbonato é quem separa agudo de crônico, e a distinção muda a conduta inteira. Normal significa que o distúrbio se instalou nas últimas horas; elevado significa que o rim teve dias para compensar — e que o paciente vive com essa PaCO₂.',
        'O pH quase normal apesar de PaCO₂ muito alta é a assinatura da compensação estabelecida. Um pH muito baixo com bicarbonato alto indica agudização sobre a doença crônica.',
        'A policitemia secundária é a resposta esperada à hipoxemia crônica: o rim detecta hipóxia, produz eritropoetina e a medula responde. É adaptação, não doença hematológica.',
        'Oxigênio em fração alta no retentor crônico pode agravar a hipercapnia, por piora da relação ventilação-perfusão e pelo efeito Haldane. A oxigenoterapia é titulada para alvos de saturação, não maximizada.',
      ],
    },
  },

  {
    id: 'alcalose-metabolica-vomitos',
    nome: 'Alcalose metabólica por vômitos',
    categoria: 'Ácido-base',
    contexto: 'Vômitos incoercíveis há cinco dias, fraqueza muscular e câimbras.',
    idade: [25, 70],
    blocos: [
      { titulo: 'Gasometria', valores: { ph: 'A', paco2: 'a', bicarbonato: 'A' } },
      { titulo: 'Eletrólitos', valores: { sodio: 'b', potassio: 'B', cloro: 'B', magnesio: 'b', calcio: 'n' } },
      { titulo: 'Função renal', valores: { creatinina: 'a', ureia: 'A' } },
    ],
    interpretacao: {
      alteracoes: ['Alcalose metabólica', 'Hipocalemia e hipocloremia acentuadas', 'Azotemia pré-renal', 'Hipomagnesemia'],
      padrao: 'Alcalose metabólica hipoclorêmica e hipocalêmica',
      padraoId: 'alcalose-metabolica',
      mecanismo:
        'A perda de ácido clorídrico gástrico eleva o bicarbonato. A hipovolemia resultante ativa a aldosterona, que reabsorve sódio em troca de potássio e H⁺ no túbulo coletor — perpetuando a alcalose e agravando a hipocalemia. A contração de volume impede o rim de excretar o bicarbonato excedente.',
      hipotese: 'Alcalose metabólica por perdas gástricas, responsiva a cloreto',
      diferenciais: ['Uso de diuréticos', 'Hiperaldosteronismo primário (não responsivo a cloreto)', 'Síndrome de Cushing', 'Síndrome de Bartter ou Gitelman'],
      examesAdicionais: [
        'Cloro urinário: baixo confirma alcalose responsiva a cloreto e indica correção com salina.',
        'Repor magnésio junto ao potássio — sem magnésio, a hipocalemia não corrige.',
        'Se o cloro urinário for alto e houver hipertensão, rastrear hiperaldosteronismo.',
      ],
      explicacao: [
        'Um ponto contraintuitivo: a perda de potássio no vômito é pequena. Quem elimina o potássio é o rim, sob ação da aldosterona ativada pela hipovolemia e pela bicarbonatúria. É o rim, e não o estômago, o responsável pela hipocalemia.',
        'O cloro urinário é o exame que decide a conduta. Baixo indica que o rim está retendo cloro por falta de volume — e a salina corrige. Alto aponta excesso mineralocorticoide, e a salina não resolve.',
        'A hipomagnesemia perpetua a hipocalemia ao desinibir os canais ROMK do túbulo coletor. Repor potássio sem repor magnésio simplesmente não funciona.',
        'A relação ureia/creatinina elevada confirma o componente pré-renal: o túbulo íntegro está reabsorvendo avidamente água, e a ureia vem junto.',
      ],
    },
  },

  {
    id: 'civd',
    nome: 'Coagulação intravascular disseminada',
    categoria: 'Hematologia',
    contexto: 'Sangramento por sítios de punção em paciente séptico grave.',
    idade: [40, 85],
    blocos: [
      { titulo: 'Coagulação', valores: { inr: 'A', ttpa: 'A', fibrinogenio: 'B', 'd-dimero': 'AA' } },
      { titulo: 'Hemograma', valores: { plaquetas: 'B', hemoglobina: 'B', leucocitos: 'A' } },
      { titulo: 'Função orgânica', valores: { creatinina: 'A', 'bilirrubina-total': 'a', ldh: 'A', lactato: 'A' } },
    ],
    interpretacao: {
      alteracoes: ['INR e TTPa alargados', 'Fibrinogênio reduzido', 'D-dímero muito elevado', 'Plaquetopenia', 'Anemia com LDH elevada'],
      padrao: 'Coagulopatia de consumo',
      mecanismo:
        'A ativação sistêmica da coagulação consome plaquetas e fatores mais rápido do que o fígado os repõe. A fibrinólise secundária gera D-dímero em grande quantidade. A deposição de fibrina na microcirculação fragmenta hemácias, produzindo esquizócitos e hemólise.',
      hipotese: 'CIVD secundária a sepse',
      diferenciais: ['Coagulopatia hepática (fibrinogênio pode estar preservado, fator V baixo)', 'PTT (coagulação plasmática normal)', 'Coagulopatia dilucional pós-transfusão maciça', 'Deficiência de vitamina K'],
      examesAdicionais: [
        'Esfregaço de sangue periférico à procura de esquizócitos.',
        'Fibrinogênio seriado: a tendência importa mais que o valor isolado, pois é reagente de fase aguda e pode partir de um valor alto.',
        'Identificar e tratar a causa desencadeante — é o único tratamento efetivo.',
      ],
      explicacao: [
        'A combinação que define a CIVD e a separa das demais plaquetopenias é o consumo simultâneo de plaquetas e de fatores: INR e TTPa alargados com fibrinogênio baixo e D-dímero muito alto. Na PTT, ao contrário, a coagulação plasmática permanece normal.',
        'O fibrinogênio merece cuidado interpretativo: por ser reagente de fase aguda, ele sobe na sepse. Um valor "normal" em paciente séptico pode representar queda importante em relação ao esperado — daí a importância das dosagens seriadas.',
        'O D-dímero muito elevado indica que houve formação e lise de fibrina em grande escala. Isoladamente é inespecífico, mas dentro deste conjunto é peça essencial.',
        'Não existe tratamento da CIVD que não seja o tratamento da causa. A reposição de hemocomponentes é orientada por sangramento ativo e por procedimentos, não pelos números isolados.',
      ],
    },
  },

  {
    id: 'pancreatite-aguda',
    nome: 'Pancreatite aguda',
    categoria: 'Digestivo',
    contexto: 'Dor abdominal intensa em faixa, irradiada para o dorso, com vômitos. Litíase biliar conhecida.',
    idade: [35, 75],
    blocos: [
      { titulo: 'Enzimas pancreáticas', valores: { lipase: 'AA', amilase: 'AA' } },
      { titulo: 'Hepático', valores: { alt: 'A', ast: 'A', 'fosfatase-alcalina': 'A', ggt: 'A', 'bilirrubina-total': 'a' } },
      { titulo: 'Gravidade', valores: { pcr: 'AA', calcio: 'B', ureia: 'A', hematocrito: 'a', 'glicemia-jejum': 'A', leucocitos: 'A' } },
    ],
    interpretacao: {
      alteracoes: ['Lipase e amilase muito elevadas', 'ALT elevada (mais de três vezes o normal)', 'Hipocalcemia', 'PCR muito elevada', 'Hemoconcentração'],
      padrao: 'Pancreatite aguda de etiologia biliar',
      padraoId: 'pancreatite-aguda',
      mecanismo:
        'O cálculo obstrui a ampola, gerando refluxo e hipertensão ductal que ativam o tripsinogênio dentro do ácino. A autodigestão glandular libera enzimas para a circulação e desencadeia resposta inflamatória sistêmica. A necrose gordurosa peripancreática saponifica o cálcio, que cai.',
      hipotese: 'Pancreatite aguda biliar',
      diferenciais: ['Pancreatite alcoólica', 'Pancreatite hipertrigliceridêmica', 'Úlcera perfurada', 'Isquemia mesentérica', 'Colecistite aguda'],
      examesAdicionais: [
        'Ultrassonografia de vias biliares para confirmar litíase.',
        'Triglicerídeos e cálcio para excluir outras etiologias.',
        'PCR em 48 horas e avaliação de disfunção orgânica para estratificar gravidade.',
      ],
      explicacao: [
        'ALT acima de três vezes o limite superior em pancreatite aguda favorece fortemente a etiologia biliar — é um dos achados mais úteis para direcionar a investigação e a conduta.',
        'A magnitude da elevação enzimática não indica gravidade e não deve ser acompanhada: repetir a lipase não acrescenta informação. A gravidade se avalia por PCR, ureia, hematócrito, cálcio e disfunção orgânica.',
        'A hipocalcemia é consequência da saponificação do cálcio com ácidos graxos liberados na necrose gordurosa, e integra os critérios clássicos de gravidade.',
        'Se a amilase vier desproporcionalmente baixa em quadro sugestivo, considere pancreatite hipertrigliceridêmica: a lipemia intensa pode inibir o ensaio. Nesse cenário, a lipase é mais confiável.',
      ],
    },
  },

  {
    id: 'hepatopatia-alcoolica',
    nome: 'Hepatopatia alcoólica',
    categoria: 'Hepático',
    contexto: 'Consumo alcoólico pesado e diário há anos. Hepatomegalia dolorosa e icterícia leve.',
    idade: [40, 70],
    blocos: [
      { titulo: 'Enzimas hepáticas', valores: { ast: 'A', alt: 'a', ggt: 'AA', 'fosfatase-alcalina': 'a', 'bilirrubina-total': 'A' } },
      { titulo: 'Função sintética', valores: { albumina: 'b', inr: 'a' } },
      { titulo: 'Hemograma', valores: { hemoglobina: 'b', vcm: 'A', plaquetas: 'b', leucocitos: 'a' } },
      { titulo: 'Metabólico', valores: { triglicerideos: 'A', 'acido-urico': 'a', magnesio: 'b', fosforo: 'b' } },
    ],
    interpretacao: {
      alteracoes: ['AST maior que ALT (relação acima de 2)', 'GGT muito elevada', 'Macrocitose sem anemia proporcional', 'Plaquetopenia', 'Hipomagnesemia e hipofosfatemia'],
      padrao: 'Padrão hepatocelular de perfil alcoólico',
      padraoId: 'hepatocelular',
      mecanismo:
        'O metabolismo do etanol gera acetaldeído e estresse oxidativo, com lesão preferencial da mitocôndria — rica em AST — e deficiência funcional de piridoxal-5-fosfato, cofator de que a ALT depende mais. Daí a relação AST/ALT acima de 2. O etanol também induz o sistema microssomal (GGT), altera a membrana eritrocitária (macrocitose) e é tóxico para o megacariócito.',
      hipotese: 'Doença hepática alcoólica',
      diferenciais: ['Doença hepática gordurosa metabólica (AST/ALT < 1)', 'Hepatite viral', 'Hepatite medicamentosa', 'Hemocromatose'],
      examesAdicionais: [
        'Sorologias virais e ferritina com saturação de transferrina para excluir causas associadas.',
        'GGT no acompanhamento: normaliza em 2 a 6 semanas de abstinência e é o marcador mais sensível de recaída.',
        'Repor magnésio, fósforo e tiamina antes de qualquer aporte calórico — o risco de síndrome de realimentação é real.',
      ],
      explicacao: [
        'A relação AST/ALT acima de 2 é o achado que mais aponta para o álcool, e ela tem explicação bioquímica: o etanol lesa preferencialmente a mitocôndria (rica em AST) e reduz o piridoxal-5-fosfato, de que a ALT depende mais para funcionar no ensaio.',
        'Um detalhe que ajuda a calibrar a suspeita: na hepatopatia alcoólica as transaminases raramente ultrapassam 300 U/L. Valores muito altos em etilista pedem outra explicação associada — viral, isquêmica ou medicamentosa.',
        'A macrocitose sem anemia proporcional é altamente sugestiva e frequentemente ignorada. Some-se GGT alta e plaquetopenia, e o perfil fica bastante característico mesmo sem história declarada.',
        'A hipomagnesemia e a hipofosfatemia não são detalhes: elas precedem a síndrome de realimentação, que pode ser fatal quando se reintroduz aporte calórico sem corrigi-las antes.',
      ],
    },
  },

  {
    id: 'plaquetopenia-imune',
    nome: 'Púrpura trombocitopênica imune',
    categoria: 'Hematologia',
    contexto: 'Petéquias em membros inferiores e sangramento gengival há uma semana. Sem outras queixas.',
    idade: [18, 60],
    blocos: [
      { titulo: 'Hemograma', valores: { plaquetas: 'B', vpm: 'A', hemoglobina: 'n', leucocitos: 'n', neutrofilos: 'n', linfocitos: 'n' } },
      { titulo: 'Coagulação', valores: { inr: 'n', ttpa: 'n', fibrinogenio: 'n', 'd-dimero': 'n' } },
      { titulo: 'Contexto', valores: { creatinina: 'n', ldh: 'n', 'bilirrubina-indireta': 'n' } },
    ],
    interpretacao: {
      alteracoes: ['Plaquetopenia acentuada e isolada', 'VPM elevado', 'Coagulação plasmática normal', 'Demais séries normais'],
      padrao: 'Plaquetopenia isolada por destruição periférica',
      mecanismo:
        'Autoanticorpos revestem a plaqueta e o baço a remove. Como a destruição é periférica e seletiva, a medula responde liberando plaquetas jovens — maiores, daí o VPM elevado — e nenhuma outra linhagem nem a cascata da coagulação são afetadas.',
      hipotese: 'Púrpura trombocitopênica imune (PTI)',
      diferenciais: ['Pseudoplaquetopenia por EDTA', 'CIVD (coagulação alterada)', 'PTT (anemia com esquizócitos)', 'Hiperesplenismo', 'Plaquetopenia medicamentosa', 'Viroses (HIV, hepatite C, dengue)'],
      examesAdicionais: [
        'Antes de tudo: esfregaço de sangue periférico para excluir pseudoplaquetopenia por EDTA.',
        'Sorologias para HIV e hepatite C — ambas causam plaquetopenia imune e mudam a conduta.',
        'Revisão de medicamentos: heparina, sulfas, vancomicina, quinina, valproato.',
      ],
      explicacao: [
        'O que define este quadro é o que **não** está alterado. Coagulação normal afasta CIVD; ausência de anemia e de esquizócitos afasta microangiopatia; demais séries normais afastam doença medular. A PTI é, por natureza, um diagnóstico de exclusão.',
        'O VPM elevado é a assinatura da destruição periférica: a medula está compensando com plaquetas jovens, que são maiores e mais hemostáticas. É por isso que o paciente com PTI costuma sangrar menos do que a contagem sugeriria.',
        'A primeira hipótese diante de qualquer plaquetopenia nova em paciente sem sangramento é a pseudoplaquetopenia: o EDTA induz agregação in vitro e o contador lê o agregado como uma célula só. Recoletar em citrato resolve — e evita uma investigação inteira desnecessária.',
      ],
    },
  },

  {
    id: 'sindrome-nefrotica',
    nome: 'Síndrome nefrótica',
    categoria: 'Renal',
    contexto: 'Edema periorbitário matinal progredindo para membros inferiores, urina espumosa há um mês.',
    idade: [20, 70],
    blocos: [
      { titulo: 'Urina', valores: { proteinuria: 'AA', albuminuria: 'AA' } },
      { titulo: 'Bioquímica', valores: { albumina: 'B', 'colesterol-total': 'A', ldl: 'A', triglicerideos: 'A' } },
      { titulo: 'Função renal', valores: { creatinina: 'a', ureia: 'a', tfg: 'b' } },
      { titulo: 'Eletrólitos e hemograma', valores: { sodio: 'b', calcio: 'b', hemoglobina: 'b' } },
    ],
    interpretacao: {
      alteracoes: ['Proteinúria em faixa nefrótica', 'Hipoalbuminemia acentuada', 'Hipercolesterolemia', 'Cálcio total baixo por hipoalbuminemia'],
      padrao: 'Síndrome nefrótica',
      mecanismo:
        'A lesão da barreira de filtração glomerular deixa passar albumina em grande quantidade. A hipoalbuminemia reduz a pressão oncótica e produz edema; o fígado responde aumentando a síntese de lipoproteínas, o que explica a hipercolesterolemia. A perda urinária inclui também antitrombina e imunoglobulinas.',
      hipotese: 'Síndrome nefrótica a esclarecer',
      diferenciais: ['Doença de lesão mínima', 'Glomeruloesclerose segmentar e focal', 'Nefropatia membranosa', 'Nefropatia diabética', 'Amiloidose'],
      examesAdicionais: [
        'Quantificar por proteinúria de 24h ou relação proteína/creatinina.',
        'Investigar causas secundárias: glicemia e glicada, sorologias virais, FAN e complemento, eletroforese de proteínas.',
        'Biópsia renal conforme a idade e o contexto.',
      ],
      explicacao: [
        'O cálcio total baixo aqui é um exemplo perfeito de armadilha interpretativa: ele acompanha a albumina, e o cálcio ionizado costuma estar normal. Corrigir pela albumina — ou dosar o ionizado — evita tratar uma hipocalcemia que não existe.',
        'A hipercolesterolemia não é coincidência nem doença separada: é resposta hepática direta à queda da pressão oncótica. Ela melhora quando a proteinúria melhora.',
        'A perda urinária de antitrombina, somada à hemoconcentração, cria estado pró-trombótico. Trombose de veia renal e tromboembolismo são complicações reconhecidas da síndrome nefrótica, sobretudo com albumina muito baixa.',
      ],
    },
  },

  {
    id: 'hipercalemia-renal',
    nome: 'Hipercalemia por doença renal',
    categoria: 'Metabólico',
    contexto: 'Fraqueza muscular e palpitações. Doença renal crônica em uso de IECA e espironolactona.',
    idade: [55, 85],
    blocos: [
      { titulo: 'Eletrólitos', valores: { potassio: 'A', sodio: 'b', cloro: 'a', bicarbonato: 'B', magnesio: 'n' } },
      { titulo: 'Função renal', valores: { creatinina: 'A', ureia: 'A', tfg: 'B' } },
      { titulo: 'Gasometria', valores: { ph: 'b', 'anion-gap': 'a' } },
      { titulo: 'Hemograma', valores: { hemoglobina: 'b' } },
    ],
    interpretacao: {
      alteracoes: ['Hipercalemia significativa', 'Acidose metabólica', 'TFG reduzida', 'Anemia normocítica'],
      padrao: 'Hipercalemia com acidose na doença renal crônica',
      mecanismo:
        'A secreção de potássio ocorre no túbulo coletor e depende de fluxo distal e de aldosterona. Com a TFG reduzida, o fluxo cai; o IECA reduz a aldosterona e a espironolactona bloqueia seu receptor. A acidose agrava, deslocando potássio de dentro da célula para o plasma.',
      hipotese: 'Hipercalemia multifatorial: doença renal crônica somada a bloqueio duplo do eixo renina-angiotensina-aldosterona',
      diferenciais: ['Pseudo-hipercalemia por hemólise da amostra', 'Insuficiência adrenal', 'Acidose tubular renal tipo 4', 'Rabdomiólise', 'Síndrome de lise tumoral'],
      examesAdicionais: [
        'Eletrocardiograma imediato — a decisão de tratar é clínica e eletrocardiográfica, não apenas laboratorial.',
        'Confirmar em nova amostra se houver suspeita de hemólise no tubo e o paciente estiver assintomático.',
        'Revisar todas as medicações: IECA/BRA, espironolactona, AINEs, trimetoprima, heparina.',
      ],
      explicacao: [
        'A primeira pergunta diante de potássio alto inesperado é sempre se o valor é real: hemólise da amostra, garrote prolongado, punho cerrado na coleta e demora no processamento produzem pseudo-hipercalemia com frequência.',
        'Confirmada, o risco é de bradiarritmia e assistolia — e a velocidade de instalação pesa mais que o número. Um dialítico crônico tolera 6,5 mEq/L que mataria alguém que chegou lá em horas.',
        'A combinação de bloqueio duplo do eixo (IECA + espironolactona) com TFG reduzida é uma das causas ambulatoriais mais frequentes, e também uma das mais evitáveis: pede monitorização de potássio e creatinina após cada ajuste de dose.',
        'A acidose metabólica associada não é um segundo problema: ela é parte do mesmo mecanismo, e corrigi-la ajuda a deslocar potássio de volta para dentro da célula.',
      ],
    },
  },

  {
    id: 'dislipidemia-aterogenica',
    nome: 'Dislipidemia aterogênica',
    categoria: 'Metabólico',
    contexto: 'Consulta de rotina. Obesidade abdominal, hipertensão e sedentarismo.',
    idade: [35, 65],
    blocos: [
      { titulo: 'Perfil lipídico', valores: { 'colesterol-total': 'a', ldl: 'a', hdl: 'B', triglicerideos: 'A', 'nao-hdl': 'A' } },
      { titulo: 'Metabólico', valores: { 'glicemia-jejum': 'a', hba1c: 'a', insulina: 'A', 'acido-urico': 'A' } },
      { titulo: 'Hepático', valores: { alt: 'a', ggt: 'a' } },
    ],
    interpretacao: {
      alteracoes: ['Triglicerídeos elevados com HDL baixo', 'Não-HDL elevado com LDL apenas discretamente alterado', 'Insulina de jejum alta', 'Ácido úrico elevado', 'Transaminases discretamente elevadas'],
      padrao: 'Dislipidemia aterogênica da resistência à insulina',
      mecanismo:
        'A resistência à insulina não suprime a lipólise do tecido adiposo; o fluxo de ácidos graxos ao fígado aumenta e ele exporta mais VLDL. A CETP troca lipídios entre a VLDL e a HDL, que enriquecida em triglicerídeos é catabolizada mais rápido — por isso o HDL cai. A insulina alta ainda aumenta a reabsorção tubular de urato.',
      hipotese: 'Dislipidemia aterogênica no contexto de resistência à insulina',
      diferenciais: ['Dislipidemia familiar combinada', 'Hipotireoidismo', 'Dislipidemia secundária a medicamentos', 'Consumo alcoólico'],
      examesAdicionais: [
        'TSH, função renal e hepática para excluir causas secundárias.',
        'ApoB ou não-HDL como alvo: com triglicerídeos altos, o LDL calculado subestima o risco.',
        'Rastreio de esteatose hepática, que acompanha o mesmo mecanismo.',
      ],
      explicacao: [
        'O achado central aqui não é o LDL: é a discordância entre um LDL aparentemente aceitável e um não-HDL claramente elevado. Isso significa muitas partículas pequenas e densas, cada uma pobre em colesterol — e é a apoB, não o LDL, que representa o risco real.',
        'Triglicerídeos altos, HDL baixo, ácido úrico elevado, glicemia limítrofe e ALT alterada não são cinco achados independentes: são o mesmo mecanismo de resistência à insulina visto de cinco ângulos diferentes.',
        'Essa é também a dislipidemia que mais responde a mudança de estilo de vida. Redução de peso, atividade física e corte de açúcares e álcool derrubam os triglicerídeos em semanas.',
      ],
    },
  },

  {
    id: 'hipercolesterolemia-familiar',
    nome: 'Hipercolesterolemia familiar',
    categoria: 'Metabólico',
    contexto: 'LDL persistentemente muito alto desde jovem. Pai com infarto aos 45 anos. Xantomas em tendão de Aquiles.',
    idade: [20, 50],
    blocos: [
      { titulo: 'Perfil lipídico', valores: { 'colesterol-total': 'AA', ldl: 'AA', 'nao-hdl': 'AA', hdl: 'n', triglicerideos: 'n' } },
      { titulo: 'Causas secundárias', valores: { tsh: 'n', 'glicemia-jejum': 'n', creatinina: 'n', alt: 'n', proteinuria: 'n' } },
    ],
    interpretacao: {
      alteracoes: ['LDL muito elevado com triglicerídeos e HDL normais', 'Ausência de causa secundária identificável'],
      padrao: 'Hipercolesterolemia isolada grave',
      mecanismo:
        'Mutação no receptor de LDL, na apoB ou na PCSK9 reduz a remoção hepática de partículas de LDL. Elas permanecem em circulação, e a exposição arterial começa na infância — décadas antes do que ocorre nas dislipidemias adquiridas.',
      hipotese: 'Hipercolesterolemia familiar heterozigótica',
      diferenciais: ['Hipotireoidismo', 'Síndrome nefrótica', 'Colestase', 'Dislipidemia secundária a medicamentos'],
      examesAdicionais: [
        'Excluir causas secundárias: TSH, glicemia, função renal e hepática, proteinúria — feito neste painel.',
        'Rastreamento em cascata dos familiares de primeiro grau: é a intervenção de maior impacto.',
        'Lp(a), que agrega risco independente e é geneticamente determinada.',
      ],
      explicacao: [
        'O perfil chama atenção pela seletividade: o LDL está muito alto enquanto triglicerídeos e HDL estão normais. Isso separa a hipercolesterolemia familiar da dislipidemia aterogênica, em que os três se movem juntos.',
        'O que torna a doença tão grave não é o valor, é o tempo: a exposição arterial começa no nascimento. Por isso o evento coronário ocorre décadas antes, e por isso o diagnóstico precoce muda tanto o desfecho.',
        'Rastrear a família é parte do diagnóstico, não um extra. A heterozigose afeta cerca de 1 em 250 pessoas e permanece amplamente subdiagnosticada.',
      ],
    },
  },

  {
    id: 'hipertrigliceridemia-grave',
    nome: 'Hipertrigliceridemia grave',
    categoria: 'Metabólico',
    contexto: 'Dor abdominal e soro leitoso na coleta. Diabetes descompensado e consumo alcoólico recente.',
    idade: [30, 60],
    blocos: [
      { titulo: 'Perfil lipídico', valores: { triglicerideos: 'AA', 'colesterol-total': 'A', hdl: 'B' } },
      { titulo: 'Metabólico', valores: { 'glicemia-jejum': 'A', hba1c: 'A' } },
      { titulo: 'Pâncreas', valores: { lipase: 'A', amilase: 'n', calcio: 'b', pcr: 'A' } },
      { titulo: 'Interferências', valores: { sodio: 'b', hemoglobina: 'n' } },
    ],
    interpretacao: {
      alteracoes: ['Triglicerídeos em faixa de risco pancreático', 'Lipase elevada', 'Amilase inapropriadamente normal', 'Sódio falsamente baixo'],
      padrao: 'Hipertrigliceridemia grave com pancreatite',
      padraoId: 'pancreatite-aguda',
      mecanismo:
        'A lipase pancreática hidrolisa os quilomícrons acumulados e libera ácidos graxos livres em concentração tóxica ao ácino; os próprios quilomícrons obstruem a microcirculação pancreática. O diabetes descompensado e o álcool aumentam a produção hepática de VLDL e reduzem a depuração.',
      hipotese: 'Pancreatite aguda por hipertrigliceridemia',
      diferenciais: ['Pancreatite biliar (ALT elevada)', 'Pancreatite alcoólica', 'Quilomicronemia familiar'],
      examesAdicionais: [
        'Ultrassonografia e ALT para excluir etiologia biliar concomitante.',
        'Controle glicêmico rigoroso e abstinência alcoólica.',
        'Reavaliar triglicerídeos após a fase aguda para decidir terapia de manutenção.',
      ],
      explicacao: [
        'Este cenário traz duas armadilhas laboratoriais no mesmo tubo. A primeira: a lipemia intensa inibe o ensaio de amilase, que pode vir falsamente normal em plena pancreatite — a lipase é mais confiável aqui.',
        'A segunda: a pseudo-hiponatremia. Em métodos indiretos, a fase sólida aumentada pela gordura reduz artificialmente o sódio medido, enquanto a osmolalidade permanece normal. Corrigir esse sódio com salina seria tratar um problema inexistente.',
        'Acima de 500 mg/dL, e sobretudo acima de 1.000, a preocupação com triglicerídeos deixa de ser cardiovascular e passa a ser pancreática. O tratamento imediato é outro: jejum, controle glicêmico, abstinência e fibrato.',
      ],
    },
  },

  {
    id: 'hipotireoidismo-subclinico',
    nome: 'Hipotireoidismo subclínico',
    categoria: 'Endócrino',
    contexto: 'Achado em exame de rotina. Assintomática, sem uso de medicações.',
    idade: [30, 70],
    sexo: 'F',
    blocos: [
      { titulo: 'Eixo tireoidiano', valores: { tsh: 'A', 't4-livre': 'n', t3: 'n' } },
      { titulo: 'Repercussão', valores: { 'colesterol-total': 'a', ldl: 'a', hemoglobina: 'n', sodio: 'n' } },
    ],
    interpretacao: {
      alteracoes: ['TSH elevado com T4 livre normal', 'Discreta elevação do colesterol'],
      padrao: 'Hipotireoidismo subclínico',
      padraoId: 'hipotireoidismo-primario',
      mecanismo:
        'A reserva tireoidiana está reduzida, mas a glândula ainda mantém o T4 dentro da faixa às custas de um estímulo hipofisário maior. Como a relação entre TSH e T4 é logarítmica, o TSH sobe bem antes de o hormônio periférico sair da referência — é o que define a forma subclínica.',
      hipotese: 'Hipotireoidismo subclínico, provavelmente autoimune',
      diferenciais: ['Recuperação de doença aguda', 'TSH fisiologicamente mais alto do idoso', 'Interferência laboratorial', 'Insuficiência adrenal não tratada'],
      examesAdicionais: [
        'Repetir TSH e T4 livre em 6 a 8 semanas antes de qualquer decisão — boa parte normaliza sozinha.',
        'Anti-TPO: positivo aumenta a chance de progressão para hipotireoidismo franco.',
        'Individualizar o tratamento por idade, sintomas, valor do TSH e planejamento de gestação.',
      ],
      explicacao: [
        'A tentação aqui é tratar o número. Mas o TSH sobe fisiologicamente com a idade, e alterações transitórias são comuns — tratar todo idoso com TSH de 5 é sobretratamento, com risco de fibrilação atrial e perda óssea.',
        'A repetição em 6 a 8 semanas não é formalidade: uma fração relevante dos casos normaliza espontaneamente, sobretudo após doença aguda.',
        'O anti-TPO muda o prognóstico, não o diagnóstico: positivo, indica tireoidite autoimune e maior chance de evolução para a forma franca — o que justifica acompanhamento mais próximo.',
      ],
    },
  },

  {
    id: 'pre-diabetes',
    nome: 'Pré-diabetes',
    categoria: 'Metabólico',
    contexto: 'Rastreamento em pessoa com sobrepeso e história familiar de diabetes tipo 2.',
    idade: [35, 65],
    blocos: [
      { titulo: 'Metabólico', valores: { 'glicemia-jejum': 'a', hba1c: 'a', insulina: 'a' } },
      { titulo: 'Perfil lipídico', valores: { triglicerideos: 'a', hdl: 'b', ldl: 'n' } },
      { titulo: 'Rastreio', valores: { creatinina: 'n', tfg: 'n', albuminuria: 'n', alt: 'a' } },
    ],
    interpretacao: {
      alteracoes: ['Glicemia de jejum entre 100 e 125 mg/dL', 'Glicada entre 5,7 e 6,4%', 'Insulina de jejum no limite superior', 'Triglicerídeos altos com HDL baixo'],
      padrao: 'Alteração precoce do metabolismo glicídico',
      mecanismo:
        'A resistência periférica à insulina aumenta, e a célula beta compensa secretando mais. Enquanto essa compensação basta, a glicemia permanece próxima do normal; quando começa a falhar, aparecem os valores intermediários que caracterizam o pré-diabetes.',
      hipotese: 'Pré-diabetes com resistência à insulina',
      diferenciais: ['Hiperglicemia de estresse', 'Diabetes tipo 2 já estabelecido (confirmar com segunda dosagem)', 'Interferência na glicada por hemoglobinopatia ou anemia'],
      examesAdicionais: [
        'Teste de tolerância à glicose: é o mais sensível e pode revelar diabetes que jejum e glicada perderiam.',
        'Reavaliar anualmente; rastrear albuminúria e perfil lipídico junto.',
        'Mudança de estilo de vida é a intervenção com melhor evidência nesta fase.',
      ],
      explicacao: [
        'Este é o momento em que a intervenção rende mais e a conduta costuma ser mais tímida. A progressão para diabetes não é inevitável: mudança de estilo de vida reduz o risco de forma consistente.',
        'A insulina de jejum no limite superior conta a história que a glicemia ainda esconde: o pâncreas está trabalhando mais para manter o mesmo resultado. Essa compensação precede o diagnóstico em anos.',
        'Triglicerídeos altos com HDL baixo confirmam que a resistência à insulina já tem tradução metabólica, ainda que a glicemia esteja quase normal — os dois eixos andam juntos desde o começo.',
      ],
    },
  },

  {
    id: 'coagulopatia-hepatica',
    nome: 'Coagulopatia da hepatopatia',
    categoria: 'Hematologia',
    contexto: 'Sangramento gengival e equimoses em cirrótico conhecido.',
    idade: [45, 75],
    blocos: [
      { titulo: 'Coagulação', valores: { inr: 'A', ttpa: 'a', fibrinogenio: 'b', 'd-dimero': 'a' } },
      { titulo: 'Função sintética', valores: { albumina: 'B', 'bilirrubina-total': 'A' } },
      { titulo: 'Hemograma', valores: { plaquetas: 'B', hemoglobina: 'b', vcm: 'a' } },
    ],
    interpretacao: {
      alteracoes: ['INR alargado com albumina baixa', 'Fibrinogênio reduzido', 'Plaquetopenia', 'Hiperbilirrubinemia'],
      padrao: 'Coagulopatia por falência de síntese hepática',
      padraoId: 'insuficiencia-hepatica',
      mecanismo:
        'O fígado sintetiza quase todos os fatores da coagulação e a trombopoetina. Com a perda de massa funcionante, o INR alarga (o fator VII, de meia-vida curta, falta primeiro), o fibrinogênio cai e as plaquetas diminuem — estas também por sequestro esplênico da hipertensão portal.',
      hipotese: 'Coagulopatia da hepatopatia crônica',
      diferenciais: ['Deficiência de vitamina K (fator V normal, corrige com reposição)', 'CIVD (D-dímero muito alto, consumo mais intenso)', 'Anticoagulação oral'],
      examesAdicionais: [
        'Fator V: normal aponta deficiência de vitamina K; baixo confirma falência hepática.',
        'Teste terapêutico com vitamina K parenteral — corrige em 12 a 24 horas se for deficiência.',
        'Escores de Child-Pugh e MELD para estratificar gravidade.',
      ],
      explicacao: [
        'O fator V é o desempate deste cenário, e por uma razão elegante: ele é sintetizado no fígado mas não depende de vitamina K. Fator V normal com fator VII baixo significa falta de vitamina K; ambos baixos significam falta de fígado.',
        'Vale uma ressalva importante: o INR alargado do cirrótico não significa proteção contra trombose. A hepatopatia reduz também os anticoagulantes naturais (proteínas C e S, antitrombina), e o equilíbrio resultante é instável nos dois sentidos — cirróticos têm trombose de veia porta com frequência.',
        'A plaquetopenia tem dupla origem: menos trombopoetina hepática e sequestro esplênico. Costuma ser o primeiro sinal laboratorial de hipertensão portal, muitas vezes anos antes da descompensação.',
      ],
    },
  },

  {
    id: 'anticoagulacao-varfarina',
    nome: 'Anticoagulação com varfarina',
    categoria: 'Hematologia',
    contexto: 'Fibrilação atrial em uso de varfarina, com antibiótico iniciado há cinco dias.',
    idade: [55, 85],
    blocos: [
      { titulo: 'Coagulação', valores: { inr: 'AA', ttpa: 'a', fibrinogenio: 'n', 'd-dimero': 'n' } },
      { titulo: 'Função hepática e renal', valores: { albumina: 'n', alt: 'n', creatinina: 'n' } },
      { titulo: 'Hemograma', valores: { hemoglobina: 'b', plaquetas: 'n' } },
    ],
    interpretacao: {
      alteracoes: ['INR muito acima da faixa terapêutica', 'Fibrinogênio e plaquetas normais', 'Anemia leve'],
      padrao: 'Alargamento do INR por interação medicamentosa',
      mecanismo:
        'A varfarina inibe a epóxido-redutase da vitamina K, impedindo a carboxilação dos fatores II, VII, IX e X. Antibióticos de largo espectro potencializam por dois caminhos: reduzem a microbiota produtora de vitamina K e competem pelo metabolismo hepático do fármaco.',
      hipotese: 'Supraterapia de varfarina por interação com antibiótico',
      diferenciais: ['Insuficiência hepática (albumina baixa, fator V baixo)', 'Deficiência nutricional de vitamina K', 'CIVD (fibrinogênio baixo, plaquetopenia)', 'Erro de dose'],
      examesAdicionais: [
        'Revisar todas as medicações iniciadas nas últimas duas semanas.',
        'Avaliar sangramento ativo: a conduta depende muito mais dele que do valor do INR.',
        'Reavaliar o INR em 24 a 48 horas após o ajuste.',
      ],
      explicacao: [
        'A distinção deste quadro para uma coagulopatia hepática está no que permanece normal: albumina, fibrinogênio e plaquetas. Na hepatopatia, os três se alteram; aqui, o bloqueio é seletivo sobre a carboxilação dependente de vitamina K.',
        'A interação com antibióticos é a causa mais frequente de descontrole do INR na prática, e é previsível o bastante para justificar monitorização sempre que um antibiótico é iniciado.',
        'A conduta se decide pela clínica: INR alto sem sangramento costuma se resolver com suspensão temporária e ajuste; com sangramento, a reversão é urgente e usa vitamina K com concentrado de complexo protrombínico.',
      ],
    },
  },

  {
    id: 'embolia-pulmonar',
    nome: 'Embolia pulmonar',
    categoria: 'Cardiovascular',
    contexto: 'Dispneia súbita e dor pleurítica após viagem longa. Taquicardia e hipoxemia.',
    idade: [35, 80],
    blocos: [
      { titulo: 'Coagulação', valores: { 'd-dimero': 'AA', inr: 'n', ttpa: 'n', fibrinogenio: 'a' } },
      { titulo: 'Cardíaco', valores: { troponina: 'a', 'nt-probnp': 'A' } },
      { titulo: 'Gasometria', valores: { ph: 'a', paco2: 'B', pao2: 'B', lactato: 'a' } },
      { titulo: 'Contexto', valores: { creatinina: 'n', hemoglobina: 'n', leucocitos: 'a' } },
    ],
    interpretacao: {
      alteracoes: ['D-dímero muito elevado', 'Hipoxemia com hipocapnia (alcalose respiratória)', 'Troponina e NT-proBNP elevados', 'Coagulação plasmática normal'],
      padrao: 'Hipoxemia com alcalose respiratória e sobrecarga de ventrículo direito',
      mecanismo:
        'O trombo obstrui o leito arterial pulmonar: aumenta o espaço morto e o desequilíbrio ventilação-perfusão, gerando hipoxemia. A hiperventilação compensatória derruba a PaCO₂. A sobrecarga aguda do ventrículo direito distende o miócito (NT-proBNP) e isquemia a parede livre (troponina).',
      hipotese: 'Embolia pulmonar com repercussão sobre o ventrículo direito',
      diferenciais: ['Pneumonia', 'Síndrome coronariana aguda', 'Insuficiência cardíaca descompensada', 'Pneumotórax', 'Crise de ansiedade'],
      examesAdicionais: [
        'Angiotomografia de tórax — em alta probabilidade clínica, vai-se direto à imagem sem passar pelo D-dímero.',
        'Ecocardiograma para avaliar disfunção de ventrículo direito.',
        'Ultrassonografia venosa de membros inferiores.',
      ],
      explicacao: [
        'O D-dímero é exame de exclusão, e é assim que ele deve ser usado: valor normal em paciente de probabilidade baixa ou intermediária afasta o diagnóstico. Elevado, não confirma nada — infecção, câncer, gestação, cirurgia e idade também o elevam.',
        'Troponina e NT-proBNP não estão aqui para diagnosticar embolia: estão para estratificar risco. Ambos elevados indicam sobrecarga do ventrículo direito e identificam o paciente de maior mortalidade.',
        'A alcalose respiratória com hipoxemia é a assinatura gasométrica: o paciente hiperventila e mesmo assim não oxigena, porque o problema não é ventilatório — é de perfusão.',
      ],
    },
  },

  {
    id: 'infeccao-urinaria',
    nome: 'Infecção urinária alta',
    categoria: 'Infeccioso',
    contexto: 'Febre, dor lombar e disúria há dois dias.',
    idade: [20, 80],
    sexo: 'F',
    blocos: [
      { titulo: 'Urina', valores: { 'densidade-urinaria': 'n', proteinuria: 'a' } },
      { titulo: 'Hemograma', valores: { leucocitos: 'A', neutrofilos: 'A', hemoglobina: 'n', plaquetas: 'a' } },
      { titulo: 'Inflamatórios', valores: { pcr: 'AA', procalcitonina: 'A' } },
      { titulo: 'Função renal', valores: { creatinina: 'a', ureia: 'a' } },
    ],
    interpretacao: {
      alteracoes: ['Leucocitose com neutrofilia', 'PCR e procalcitonina elevadas', 'Discreta proteinúria', 'Elevação leve da creatinina'],
      padrao: 'Infecção bacteriana com acometimento renal',
      padraoId: 'infeccao-bacteriana',
      mecanismo:
        'A invasão bacteriana do parênquima renal desencadeia resposta inflamatória sistêmica: citocinas elevam PCR e procalcitonina, o G-CSF libera o pool medular de neutrófilos, e a inflamação intersticial produz proteinúria discreta e queda transitória da filtração.',
      hipotese: 'Pielonefrite aguda',
      diferenciais: ['Cistite (sem febre nem marcadores sistêmicos)', 'Litíase com infecção', 'Abscesso renal', 'Apendicite e outras causas abdominais'],
      examesAdicionais: [
        'Urina tipo I e urocultura com antibiograma, colhidas antes do antibiótico.',
        'Cilindros leucocitários no sedimento diferenciam infecção alta de cistite.',
        'Imagem se não houver melhora em 48 a 72 horas — pensar em obstrução ou abscesso.',
      ],
      explicacao: [
        'O que separa pielonefrite de cistite não é a urina: é a repercussão sistêmica. Febre, leucocitose, PCR e procalcitonina elevadas indicam acometimento do parênquima renal, e mudam a duração e a via do antibiótico.',
        'Os cilindros leucocitários são o achado que confirma origem renal alta: eles só se formam dentro do túbulo, moldados na proteína de Tamm-Horsfall.',
        'A elevação discreta da creatinina costuma ser reversível e reflete tanto a inflamação intersticial quanto a desidratação da febre. Persistindo após hidratação e antibiótico, pede investigação de obstrução.',
      ],
    },
  },

  {
    id: 'glomerulonefrite',
    nome: 'Glomerulonefrite aguda',
    categoria: 'Renal',
    contexto: 'Urina escura, edema palpebral e hipertensão, duas semanas após faringite.',
    idade: [6, 40],
    blocos: [
      { titulo: 'Função renal', valores: { creatinina: 'A', ureia: 'A', tfg: 'B' } },
      { titulo: 'Urina', valores: { proteinuria: 'A', albuminuria: 'A', 'densidade-urinaria': 'a' } },
      { titulo: 'Eletrólitos', valores: { sodio: 'b', potassio: 'a', bicarbonato: 'b' } },
      { titulo: 'Imunologia e hemograma', valores: { pcr: 'a', hemoglobina: 'b' } },
    ],
    interpretacao: {
      alteracoes: ['Creatinina elevada com proteinúria', 'Hematúria (a fita e o sedimento definem)', 'Retenção de sódio com hipertensão', 'Anemia dilucional'],
      padrao: 'Síndrome nefrítica',
      mecanismo:
        'A deposição de imunocomplexos no glomérulo desencadeia inflamação com proliferação celular. A superfície de filtração cai (creatinina sobe), a barreira se rompe (hematúria e proteinúria) e a retenção de sódio e água produz hipertensão e edema.',
      hipotese: 'Glomerulonefrite aguda pós-infecciosa',
      diferenciais: ['Nefropatia por IgA (hematúria concomitante à infecção, não após)', 'Nefrite lúpica', 'Vasculite ANCA-associada', 'Glomerulonefrite membranoproliferativa'],
      examesAdicionais: [
        'Sedimento urinário: hemácias dismórficas e cilindros hemáticos definem origem glomerular.',
        'Complemento C3 e C4: o C3 baixo com C4 normal favorece a pós-estreptocócica.',
        'ASLO, FAN, anti-DNA e ANCA conforme o contexto.',
      ],
      explicacao: [
        'A hematúria dismórfica com cilindros hemáticos é praticamente patognomônica de doença glomerular, e é o achado que separa esta hipótese de sangramento urológico — em que as hemácias são isomórficas.',
        'O intervalo entre a infecção e o quadro renal é informativo: duas semanas favorecem a glomerulonefrite pós-estreptocócica; hematúria simultânea à infecção favorece nefropatia por IgA.',
        'O complemento consumido reforça a hipótese de doença mediada por imunocomplexos, e sua normalização em 6 a 8 semanas é esperada na forma pós-infecciosa. Se não normalizar, o diagnóstico precisa ser revisto.',
      ],
    },
  },

]

export const CENARIO_POR_ID = new Map(CENARIOS.map((c) => [c.id, c]))

/* ═══════════════════════════ Geração ═══════════════════════════ */

export interface ValorGerado {
  id: string
  /** Marcador cuja ficha a linha abre — igual ao `id`, salvo exceções. */
  ficha: string
  nome: string
  valor: string
  unidade: string
  referencia: string
  direcao: Direcao
}

export interface BlocoGerado {
  titulo: string
  valores: ValorGerado[]
}

export interface ExameGerado {
  cenarioId: string
  nome: string
  contexto: string
  paciente: { sexo: 'M' | 'F'; idade: number }
  blocos: BlocoGerado[]
  /** Semente usada — permite reproduzir exatamente o mesmo exame. */
  semente: number
}

/**
 * Gerador pseudoaleatório com semente (mulberry32).
 *
 * Precisa ser determinístico para que o mesmo exame possa ser recriado a
 * partir da semente: é o que permite compartilhar um caso, voltar a ele depois
 * e comparar a própria interpretação com a resposta sem que os números tenham
 * mudado no caminho.
 */
function criarAleatorio(semente: number): () => number {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Sorteia um valor coerente com a tendência pedida, dentro de faixas plausíveis. */
function sortearValor(base: BaseDoMarcador, tendencia: Tendencia, rnd: () => number): { valor: number; direcao: Direcao } {
  const amplitude = base.max - base.min
  const entre = (a: number, b: number) => a + rnd() * (b - a)

  switch (tendencia) {
    case 'n':
      return { valor: entre(base.min + amplitude * 0.15, base.max - amplitude * 0.15), direcao: 'normal' }
    case 'b':
      return { valor: entre(Math.max(0, base.min - amplitude * 0.35), base.min - amplitude * 0.02), direcao: 'baixo' }
    case 'B':
      return { valor: entre(Math.max(0, base.min - amplitude * 0.9), base.min - amplitude * 0.4), direcao: 'muito-baixo' }
    case 'a':
      return { valor: entre(base.max + amplitude * 0.05, base.max + amplitude * 0.5), direcao: 'alto' }
    case 'A':
      return { valor: entre(base.max + amplitude * 0.7, base.max + amplitude * 2.5), direcao: 'muito-alto' }
    case 'AA':
      return { valor: entre(base.max + amplitude * 4, base.max + amplitude * 14), direcao: 'muito-alto' }
  }
}

function formatar(valor: number, casas: number): string {
  const arredondado = casas === 0 ? Math.round(valor) : Number(valor.toFixed(casas))
  return arredondado.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

function textoDaReferencia(base: BaseDoMarcador): string {
  if (base.refTexto) return base.refTexto
  const casas = base.casas
  return `${formatar(base.min, casas)} a ${formatar(base.max, casas)}`
}

/**
 * Gera um exame fictício a partir de um cenário.
 *
 * Sem `semente`, sorteia uma nova — cada clique produz números diferentes
 * dentro do mesmo padrão fisiopatológico, que é o que permite treinar o
 * reconhecimento do padrão em vez da memorização de um caso específico.
 */
export function gerarExame(cenarioId: string, semente?: number): ExameGerado | null {
  const cenario = CENARIO_POR_ID.get(cenarioId)
  if (!cenario) return null

  const usada = semente ?? Math.floor(Math.random() * 1_000_000)
  const rnd = criarAleatorio(usada)

  const sexo: 'M' | 'F' = cenario.sexo ?? (rnd() > 0.5 ? 'M' : 'F')
  const idade = Math.round(cenario.idade[0] + rnd() * (cenario.idade[1] - cenario.idade[0]))

  const blocos: BlocoGerado[] = cenario.blocos.map((bloco) => ({
    titulo: bloco.titulo,
    valores: Object.entries(bloco.valores)
      .filter(([id]) => BASE[id])
      .map(([id, tendencia]) => {
        const base = BASE[id]
        const { valor, direcao } = sortearValor(base, tendencia, rnd)
        return {
          id,
          ficha: base.ficha ?? id,
          nome: base.nome,
          valor: formatar(Math.max(0, valor), base.casas),
          unidade: base.unidade,
          referencia: textoDaReferencia(base),
          direcao,
        }
      }),
  }))

  return { cenarioId, nome: cenario.nome, contexto: cenario.contexto, paciente: { sexo, idade }, blocos, semente: usada }
}

/** Um cenário aleatório — o botão "gerar exame aleatório". */
export function cenarioAleatorio(excluirNormal = true): Cenario {
  const lista = excluirNormal ? CENARIOS.filter((c) => c.id !== 'normal') : CENARIOS
  return lista[Math.floor(Math.random() * lista.length)]
}

/** Cenários agrupados por categoria, para a grade de escolha. */
export function cenariosPorCategoria(): { categoria: string; cenarios: Cenario[] }[] {
  const mapa = new Map<string, Cenario[]>()
  for (const c of CENARIOS) {
    const lista = mapa.get(c.categoria) ?? []
    lista.push(c)
    mapa.set(c.categoria, lista)
  }
  return Array.from(mapa.entries()).map(([categoria, cenarios]) => ({ categoria, cenarios }))
}
