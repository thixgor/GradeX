import type { Estrutura } from '../tipos'

/** Estruturas do neurônio e da glia vistas ao microscópio de luz (SNC e SNP). */
export const ESTRUTURAS_NEURONIOS: Estrutura[] = [
  {
    id: 'corpusculos-de-nissl',
    nome: 'Corpúsculos de Nissl',
    sinonimos: ['Nissl bodies', 'substância tigroide', 'substância cromófila', 'retículo endoplasmático rugoso neuronal'],
    tipo: 'celula',
    resumo:
      'Grumos basófilos no citoplasma do neurônio — pilhas de retículo endoplasmático rugoso — que dão ao corpo celular o aspecto "tigrado".',
    caracteristicas: [
      'Grânulos e placas azul-violeta no pericário e nos dendritos proximais, com corantes básicos (tionina, azul de toluidina, cresil violeta) e, mais discretos, em HE.',
      'Ausentes no cone de implantação e no axônio — é assim que se reconhece o polo axonal.',
      'Mais grosseiros e abundantes nos neurônios grandes e muito ativos em síntese (motoneurônios, células de Purkinje).',
    ],
    aprofundado: [
      'Ultraestrutura: cisternas paralelas de retículo endoplasmático rugoso com polirribossomos livres entre elas; a basofilia vem do RNA ribossômico.',
      'Sustentam a síntese contínua de proteínas que o neurônio exporta pelo transporte axonal para um axônio que pode ter 1 metro.',
      'A coloração de Nissl não mostra prolongamentos: é a técnica de escolha para contar e mapear corpos neuronais (citoarquitetura).',
    ],
    funcoes: ['Síntese de proteínas estruturais, enzimas e neurotransmissores peptídicos.'],
    regeneracao: {
      nivel: 'moderada',
      texto:
        'Após lesão do axônio, dispersam-se (cromatólise central) e se reorganizam se o neurônio sobreviver e o axônio regenerar — o que só acontece no SNP.',
    },
    ondeEncontrar: ['Corpo de todo neurônio; mais evidentes nos motoneurônios do corno anterior, nas células de Purkinje e nos neurônios ganglionares.'],
    alteracoes: [
      'Cromatólise central (reação axonal): neurônio inchado, núcleo deslocado para a periferia e Nissl dissolvido no centro, dias após a secção do axônio.',
      'Neurônio vermelho (isquemia aguda): citoplasma eosinófilo, sem Nissl, com núcleo picnótico — 12 a 24 h após a hipóxia.',
      'Perda de motoneurônios e do seu Nissl na esclerose lateral amiotrófica e na atrofia muscular espinal.',
    ],
  },
  {
    id: 'nucleo-do-neuronio',
    nome: 'Núcleo do neurônio',
    sinonimos: ['núcleo vesiculoso', 'núcleo eucromático', 'neuronal nucleus'],
    tipo: 'celula',
    resumo:
      'Núcleo grande, redondo e claro (eucromático), geralmente central, típico de célula com transcrição intensa; muitas vezes com um nucléolo nítido.',
    caracteristicas: [
      'Redondo, de posição central, com cromatina fina e dispersa — por isso claro, "vesiculoso".',
      'Nucléolo grande e basófilo quando o plano de corte passa por ele; em cortes tangenciais do núcleo, não aparece.',
      'Contrasta com os núcleos pequenos e escuros da glia em volta.',
    ],
    aprofundado: [
      'A eucromatia reflete a transcrição intensa exigida por um citoplasma enorme; o nucléolo grande, a produção de ribossomos para o Nissl.',
      'Em mulheres, pode-se ver o corpúsculo de Barr (cromatina sexual) junto ao nucléolo ou ao envoltório nuclear.',
    ],
    funcoes: ['Guarda e transcreve o genoma do neurônio, célula pós-mitótica que dura a vida inteira.'],
    regeneracao: {
      nivel: 'nula',
      texto: 'O neurônio maduro não se divide: um núcleo perdido não é reposto.',
    },
    ondeEncontrar: ['Todo corpo neuronal, mais evidente nos grandes: motoneurônios, Purkinje, piramidais, neurônios de gânglios.'],
    alteracoes: [
      'Deslocamento para a periferia na cromatólise (reação axonal).',
      'Picnose e cariorrexe na necrose isquêmica.',
      'Inclusões virais intranucleares (Cowdry A no herpes).',
    ],
  },
  {
    id: 'celula-satelite-do-snc',
    nome: 'Célula satélite (oligodendrócito perineuronal)',
    sinonimos: ['oligodendrócito satélite', 'perineuronal oligodendrocyte', 'satelitose'],
    tipo: 'celula',
    resumo:
      'Célula da glia colada ao corpo de um neurônio do SNC, quase sempre um oligodendrócito: núcleo pequeno, redondo e escuro encostado no pericário.',
    caracteristicas: [
      'Núcleo pequeno (5–8 µm), redondo, denso, sem citoplasma visível, na borda do corpo neuronal.',
      'Um a três por neurônio, sobretudo nos neurônios grandes.',
      'No SNP, o equivalente são as células satélites dos gânglios, que formam uma camada contínua em volta de cada neurônio.',
    ],
    aprofundado: [
      'Os oligodendrócitos perineuronais não formam mielina; participam da regulação iônica e metabólica do neurônio.',
      'Diferenciar da micróglia: a micróglia tem núcleo alongado, em bastão, e se aproxima do neurônio quando ele está morrendo.',
    ],
    funcoes: ['Suporte metabólico e tamponamento iônico do neurônio.'],
    regeneracao: { nivel: 'moderada', texto: 'Precursores de oligodendrócitos persistem no SNC adulto e podem repor essas células.' },
    ondeEncontrar: ['Em volta dos grandes neurônios do SNC: corno anterior, córtex, núcleos do tronco encefálico.'],
    alteracoes: [
      'Satelitose: aumento das células em volta de um neurônio doente.',
      'Neuronofagia: micróglia fagocitando um neurônio morto (poliomielite, encefalites virais).',
    ],
  },
]
