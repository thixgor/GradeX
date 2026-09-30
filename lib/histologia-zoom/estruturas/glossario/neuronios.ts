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
    funcoes: ['Síntese de proteínas estruturais, enzimas e neurotransmissores peptídicos.', 'Produzir as proteínas exportadas pelo axônio (transporte axonal anterógrado) e as da membrana e dos receptores.', 'Indicar o estado do neurônio: dispersam-se (cromatólise) quando o axônio é lesado.'],
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
    funcoes: ['Guarda e transcreve o genoma do neurônio, célula pós-mitótica que dura a vida inteira.', 'Sustentar a transcrição intensa para manter o citoplasma e o axônio enormes (núcleo eucromático e nucléolo grande).', 'Controlar a resposta à lesão axonal (genes de regeneração).'],
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
    funcoes: ['Suporte metabólico e tamponamento iônico do neurônio.', 'Participar da reciclagem de neurotransmissores e da oferta de energia.', 'Pode mielinizar se houver necessidade (oligodendrócitos perineuronais).'],
    regeneracao: { nivel: 'moderada', texto: 'Precursores de oligodendrócitos persistem no SNC adulto e podem repor essas células.' },
    ondeEncontrar: ['Em volta dos grandes neurônios do SNC: corno anterior, córtex, núcleos do tronco encefálico.'],
    alteracoes: [
      'Satelitose: aumento das células em volta de um neurônio doente.',
      'Neuronofagia: micróglia fagocitando um neurônio morto (poliomielite, encefalites virais).',
    ],
  },
  {
    id: 'oligodendrocito',
    nome: 'Oligodendrócito',
    sinonimos: ['oligodendroglia', 'oligodendrócito interfascicular'],
    tipo: 'celula',
    resumo: 'Célula da glia do SNC com núcleo pequeno, redondo e escuro, muitas vezes com halo claro em volta; forma a mielina de vários axônios ao mesmo tempo.',
    caracteristicas: ['Núcleo redondo, pequeno (5–8 µm), denso e escuro, menor que o do astrócito.', 'Citoplasma quase invisível; em material fixado costuma ficar um halo claro (aspecto de "ovo frito").', 'Na substância branca forma fileiras entre os feixes de axônios (oligodendrócitos interfasciculares); na cinzenta, fica colado aos neurônios (satélites).'],
    aprofundado: ['Cada oligodendrócito emite vários prolongamentos e mieliniza segmentos de até 40–50 axônios diferentes; a célula de Schwann, no SNP, mieliniza um só segmento de um só axônio.', 'A mielina central tem proteína proteolipídica (PLP) e proteína básica da mielina (MBP); não tem lâmina basal envolvendo a fibra, por isso não há "tubo" para guiar a regeneração.', 'Liberam inibidores do crescimento axonal (Nogo-A, MAG, OMgp), uma das razões de o SNC não regenerar.', 'Origem nas células precursoras de oligodendrócitos (NG2+), que persistem no adulto e permitem remielinização parcial.'],
    funcoes: ['Formar e manter a bainha de mielina no SNC, permitindo a condução saltatória.', 'Fornecer suporte metabólico ao axônio (lactato pelos transportadores MCT1).', 'Organizar os nós de Ranvier e o agrupamento de canais de sódio no axônio.'],
    regeneracao: { nivel: 'moderada', texto: 'Precursores de oligodendrócitos no adulto podem gerar novos oligodendrócitos e remielinizar, mas a mielina nova é mais fina e com internodos curtos.' },
    ondeEncontrar: ['Toda a substância branca do SNC (encéfalo, medula, nervo óptico); satélites na substância cinzenta.'],
    alteracoes: ['Esclerose múltipla: destruição imune da mielina e dos oligodendrócitos (placas).', 'Leucoencefalopatia multifocal progressiva: vírus JC infecta oligodendrócitos em imunossuprimidos.', 'Leucodistrofias (adrenoleucodistrofia, Krabbe, metacromática): defeitos genéticos da mielina.', 'Oligodendroglioma: tumor com células de núcleo redondo e halo claro ("ovo frito"), codeleção 1p/19q.'],
  },
  {
    id: 'astrocito',
    nome: 'Astrócito',
    sinonimos: ['astroglia', 'astrócito protoplasmático', 'astrócito fibroso'],
    tipo: 'celula',
    resumo: 'Célula da glia do SNC em forma de estrela, com núcleo oval e claro, maior que o do oligodendrócito; os prolongamentos terminam em pés sobre vasos e na superfície do SNC.',
    caracteristicas: ['Núcleo oval, claro, com cromatina fina; citoplasma e prolongamentos só aparecem bem com impregnação por prata ou imuno-histoquímica para GFAP.', 'Protoplasmáticos (substância cinzenta): prolongamentos curtos e muito ramificados. Fibrosos (substância branca): prolongamentos longos, finos e ricos em GFAP.'],
    aprofundado: ['O filamento intermediário típico é a GFAP (proteína ácida fibrilar glial), marcador usado em patologia.', 'Os pés perivasculares cobrem os capilares e induzem as junções de oclusão do endotélio (barreira hematoencefálica); os subpiais formam a glia limitante.', 'Captam glutamato da fenda sináptica (transportadores EAAT1/2) e o devolvem como glutamina aos neurônios (ciclo glutamato–glutamina).', 'Ligados entre si por junções comunicantes, formam um sincício que redistribui potássio (tamponamento espacial).'],
    funcoes: ['Sustentar e organizar o tecido nervoso.', 'Induzir e manter a barreira hematoencefálica e regular o fluxo sanguíneo local (acoplamento neurovascular).', 'Remover glutamato e potássio do meio extracelular, impedindo excitotoxicidade.', 'Fornecer energia aos neurônios (glicogênio e lactato — lançadeira astrócito-neurônio).', 'Reparar lesões: formam a cicatriz glial (gliose).'],
    regeneracao: { nivel: 'moderada', texto: 'Proliferam após lesão (astrogliose reativa) e formam a cicatriz glial, que isola a lesão mas bloqueia o crescimento axonal.' },
    ondeEncontrar: ['Todo o SNC; formas especializadas: glia de Bergmann (cerebelo), células de Müller (retina), pituícitos (neuro-hipófise).'],
    alteracoes: ['Gliose reativa: astrócitos aumentados, com citoplasma eosinofílico (gemistocíticos), em qualquer lesão crônica do SNC.', 'Astrocitomas e glioblastoma (tumores primários mais comuns do encéfalo no adulto).', 'Neuromielite óptica: anticorpos contra aquaporina-4 dos pés astrocitários.', 'Encefalopatia hepática: astrócitos de Alzheimer tipo II (núcleo grande e claro) pela amônia.'],
  },
]
