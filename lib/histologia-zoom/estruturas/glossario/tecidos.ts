import type { Estrutura } from '../tipos'

/** Células e componentes dos tecidos fundamentais, que aparecem em quase todos os órgãos. */
export const ESTRUTURAS_TECIDOS: Estrutura[] = [
  {
    id: 'hemacia',
    nome: 'Hemácia',
    sinonimos: ['eritrócito', 'glóbulo vermelho', 'red blood cell', 'RBC'],
    tipo: 'celula',
    resumo: 'Disco bicôncavo anucleado de ~7,5 µm, cheio de hemoglobina: intensamente eosinófilo em HE.',
    caracteristicas: [
      'Sem núcleo e sem organelas; vermelho-alaranjado em HE, rosa com centro claro no esfregaço.',
      'Tamanho constante (~7,5 µm): serve de régua para medir outras estruturas no corte.',
      'Aparece dentro de vasos, ou fora deles em hemorragias e artefatos.',
    ],
    aprofundado: [
      'A forma bicôncava aumenta a superfície de troca e permite deformar-se para passar em capilares de 3 µm.',
      'Vive ~120 dias; é removida pelos macrófagos do baço e do fígado.',
      'A palidez central no esfregaço ocupa ~1/3 do diâmetro; mais que isso sugere hipocromia.',
    ],
    funcoes: ['Transporte de O₂ e CO₂ pela hemoglobina.', 'Tamponamento do pH sanguíneo.'],
    regeneracao: { nivel: 'alta', texto: 'Produzida continuamente na medula óssea (~2 milhões por segundo), sob estímulo da eritropoetina renal.' },
    ondeEncontrar: ['Dentro de todos os vasos; na medula óssea (precursores); no baço (polpa vermelha).'],
    alteracoes: [
      'Anemia ferropriva: hemácias pequenas e pálidas (microcíticas, hipocrômicas).',
      'Anemia megaloblástica (B12, folato): macrócitos ovais.',
      'Esferocitose, drepanócitos (anemia falciforme), esquizócitos (hemólise microangiopática).',
    ],
  },
  {
    id: 'adipocito-unilocular',
    nome: 'Adipócito unilocular',
    sinonimos: ['célula adiposa', 'gordura branca', 'white adipocyte', 'adipócito'],
    tipo: 'celula',
    resumo: 'Célula grande (até 150 µm) ocupada por uma única gota de gordura, com o núcleo achatado na periferia ("anel de sinete").',
    caracteristicas: [
      'Em HE aparece vazia: a gordura é dissolvida no processamento, sobrando um contorno fino de citoplasma.',
      'Núcleo achatado e excêntrico, comprimido contra a membrana.',
      'Com ósmio ou em cortes congelados com Sudan, a gota fica preta ou vermelha.',
    ],
    aprofundado: [
      'Glândula endócrina: secreta leptina, adiponectina e resistina.',
      'Cada adipócito é envolto por lâmina basal e por capilares.',
    ],
    funcoes: ['Reserva de energia.', 'Isolamento térmico e amortecimento mecânico.', 'Função endócrina (leptina, adiponectina).'],
    regeneracao: { nivel: 'alta', texto: 'Formam-se novos adipócitos a partir de pré-adipócitos perivasculares; os existentes aumentam de volume.' },
    ondeEncontrar: ['Hipoderme, omento, mesentério, medula óssea amarela, epineuro, em volta de órgãos.'],
    alteracoes: ['Lipoma (tumor benigno).', 'Necrose gordurosa (pancreatite, trauma na mama).', 'Lipossarcoma (lipoblastos atípicos).'],
  },
  {
    id: 'celula-muscular-lisa',
    nome: 'Célula muscular lisa',
    sinonimos: ['músculo liso', 'leiomiócito', 'fibra muscular lisa', 'smooth muscle cell'],
    tipo: 'celula',
    resumo: 'Célula fusiforme, sem estrias, com um único núcleo central alongado ("em charuto"), organizada em feixes e camadas.',
    caracteristicas: [
      'Citoplasma eosinófilo e homogêneo, sem estriações transversais.',
      'Núcleo único, central e alongado; na contração, fica ondulado ("saca-rolhas").',
      'Em corte transversal: perfis redondos de tamanhos variados, só alguns com núcleo.',
    ],
    aprofundado: [
      'Actina e miosina em feixes oblíquos presos a corpos densos (equivalentes aos discos Z); por isso não há estrias.',
      'Contração lenta e sustentada, controlada pelo sistema autônomo, por hormônios e pelo estiramento.',
      'Junções comunicantes acoplam as células (músculo unitário das vísceras).',
    ],
    funcoes: ['Contração das vísceras ocas, dos vasos, das vias aéreas e dos ductos.', 'Manter tônus prolongado com pouco gasto de energia (mecanismo de trava, "latch").', 'Produzir matriz extracelular (colágeno, elastina) nas paredes dos vasos e vísceras.', 'Contração controlada pelo sistema autônomo, hormônios e estímulos locais, via cálcio–calmodulina e cinase da cadeia leve da miosina.'],
    regeneracao: { nivel: 'moderada', texto: 'Pode se dividir (hiperplasia) e crescer (hipertrofia), como no útero gravídico e na bexiga obstruída.' },
    ondeEncontrar: ['Parede do tubo digestivo, bexiga, útero, vasos sanguíneos, brônquios, ductos, músculo eretor do pelo, íris.'],
    alteracoes: [
      'Leiomioma (mioma uterino) e leiomiossarcoma.',
      'Hipertrofia do detrusor na obstrução urinária (bexiga de esforço).',
      'Hipertrofia da média arterial na hipertensão.',
    ],
  },
  {
    id: 'fibra-muscular-esqueletica',
    nome: 'Fibra muscular esquelética',
    sinonimos: ['célula muscular estriada esquelética', 'rabdomiócito', 'skeletal muscle fiber', 'miofibra'],
    tipo: 'celula',
    resumo: 'Célula cilíndrica longa e multinucleada, com estriações transversais e núcleos na periferia.',
    caracteristicas: [
      'Cilindro de 10–100 µm de diâmetro e até vários centímetros de comprimento.',
      'Estrias transversais (bandas A escuras e I claras) em corte longitudinal.',
      'Muitos núcleos achatados logo abaixo da membrana (sarcolema).',
      'Em corte transversal: perfis poligonais, com núcleos na borda.',
    ],
    aprofundado: [
      'É um sincício formado pela fusão de mioblastos.',
      'Tipos: I (lenta, oxidativa, rica em mioglobina) e II (rápida, glicolítica).',
      'Organização: endomísio (em volta da fibra), perimísio (feixe) e epimísio (músculo).',
    ],
    funcoes: ['Contração voluntária, rápida e forte: movimento, postura e produção de calor.', 'Manter a postura e estabilizar articulações (tônus).', 'Produzir calor (tremor) e ser o maior reservatório de proteína e de captação de glicose do corpo (sensível à insulina).', 'Secretar miocinas (como a irisina e a IL-6) durante o exercício.'],
    regeneracao: { nivel: 'moderada', texto: 'Regenera a partir das células satélites (células-tronco sob a lâmina basal); perdas grandes cicatrizam com fibrose.' },
    ondeEncontrar: ['Músculos esqueléticos, língua, terço superior do esôfago, diafragma, músculos da face e dos olhos.'],
    alteracoes: [
      'Atrofia neurogênica: fibras angulosas em grupos.',
      'Distrofia de Duchenne: fibras de tamanho variado, necrose, núcleos centrais e fibrose.',
      'Miosites (infiltrado inflamatório) e rabdomiólise.',
    ],
  },
]
