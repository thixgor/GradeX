/**
 * Camada editorial leve para a cauda longa do atlas.
 *
 * O catálogo-fonte permanece imutável. Estas funções produzem apenas os nomes,
 * capítulos e sistemas usados na interface do Domine Aqui. Códigos de coleta
 * continuam disponíveis na proveniência sem virar o título principal.
 */

export const CAPITULOS_DO_ATLAS = [
  {
    id: 'diagnosticos-e-lesoes',
    nome: 'Doenças e lesões',
    descricao: 'Entidades diagnósticas, variantes e padrões lesionais.',
  },
  {
    id: 'anatomia-e-controles',
    nome: 'Anatomia e controles',
    descricao: 'Tecidos normais, controles e referências comparativas.',
  },
  {
    id: 'tecnicas-e-marcadores',
    nome: 'Colorações e marcadores',
    descricao: 'Histoquímica, imuno-histoquímica e métodos complementares.',
  },
  {
    id: 'macroscopia-e-imagem',
    nome: 'Macroscopia e imagem',
    descricao: 'Peças, radiologia, neuroimagem e correlação anatomopatológica.',
  },
  {
    id: 'casos-e-series',
    nome: 'Casos e séries',
    descricao: 'Casos individuais, séries didáticas e lâminas identificadas por código.',
  },
] as const

export type CapituloDoAtlasId = (typeof CAPITULOS_DO_ATLAS)[number]['id']

const CAPITULO_POR_ID = new Map(CAPITULOS_DO_ATLAS.map((capitulo) => [capitulo.id, capitulo]))

export function obterCapituloDoAtlas(id: string) {
  return CAPITULO_POR_ID.get(id as CapituloDoAtlasId)
}

const ACRONIMOS = new Map(
  [
    'ae1ae3',
    'alk',
    'bcl2',
    'bcl6',
    'cd3',
    'cd4',
    'cd8',
    'cd10',
    'cd20',
    'cd30',
    'cd34',
    'cd56',
    'cd68',
    'cd99',
    'cd117',
    'cd138',
    'ck7',
    'ck20',
    'ema',
    'flair',
    'gfap',
    'he',
    'h&e',
    'ihq',
    'ki-67',
    'pas',
    'pcr',
    'rm',
    's100',
    't1',
    't2',
    'tc',
    'wsi',
  ].map((sigla) => [sigla, sigla === 'ki-67' ? 'Ki-67' : sigla.toUpperCase()]),
)

const SERIES: Record<string, string> = {
  adenoma: 'Adenoma',
  angioamiloide: 'Angiopatia amiloide',
  asecg: 'Astrocitoma subependimário de células gigantes',
  astroana: 'Astrocitoma anaplásico',
  astroblastoma: 'Astroblastoma',
  astrocelgran: 'Astrocitoma de células granulares',
  astrodifuso: 'Astrocitoma difuso',
  astropilo: 'Astrocitoma pilocítico',
  astropilomixo: 'Astrocitoma pilomixoide',
  atrt: 'Tumor teratoide/rabdoide atípico',
  caplexo: 'Carcinoma do plexo coroide',
  cavernoma: 'Malformação cavernosa',
  cisti: 'Cisticercose',
  cistepidermico: 'Cisto epidermoide',
  cistepidural: 'Cisto epidural',
  cistodermoide: 'Cisto dermoide',
  cistcoloid: 'Cisto coloide',
  cistopineal: 'Cisto pineal',
  cistrathke: 'Cisto da bolsa de Rathke',
  cordoma: 'Cordoma',
  craniofar: 'Craniofaringioma',
  cripto: 'Criptococose',
  desmiel: 'Doença desmielinizante',
  displasiacort: 'Displasia cortical',
  dnt: 'Tumor neuroepitelial disembrioplásico',
  encefherp: 'Encefalite herpética',
  ependimoma: 'Ependimoma',
  ependimomamixo: 'Ependimoma mixopapilar',
  esclemult: 'Esclerose múltipla',
  esquistossomose: 'Esquistossomose',
  gangliocitoma: 'Gangliocitoma',
  gangliodesmo: 'Ganglioglioma desmoplásico infantil',
  ganglioglioma: 'Ganglioglioma',
  ganglioneuroblastoma: 'Ganglioneuroblastoma',
  germinoma: 'Germinoma',
  glioblastoma: 'Glioblastoma',
  gliomatose: 'Gliomatose cerebral',
  gliossarcoma: 'Gliossarcoma',
  hamarthipot: 'Hamartoma hipotalâmico',
  hemangioblastoma: 'Hemangioblastoma',
  heterotopia: 'Heterotopia',
  histiocitose: 'Histiocitose',
  lemp: 'Leucoencefalopatia multifocal progressiva',
  lhermitte: 'Tumor de Lhermitte-Duclos',
  linfoma: 'Linfoma',
  malform: 'Malformação do sistema nervoso',
  mav: 'Malformação arteriovenosa',
  meduloblastoma: 'Meduloblastoma',
  meningioma: 'Meningioma',
  meta: 'Metástase',
  mielinolise: 'Mielinólise pontina central',
  mieloma: 'Mieloma',
  neuroblastoma: 'Neuroblastoma',
  neurocitoma: 'Neurocitoma central',
  neurotbc: 'Neurotuberculose',
  nf: 'Neurofibromatose',
  oligo: 'Oligodendroglioma',
  oligoastro: 'Oligoastrocitoma',
  papiplexo: 'Papiloma do plexo coroide',
  paracoco: 'Paracoccidioidomicose',
  paraganglioma: 'Paraganglioma',
  pineoblastoma: 'Pineoblastoma',
  pineocitoma: 'Pineocitoma',
  pnet: 'Tumor neuroectodérmico primitivo',
  polimicrogiria: 'Polimicrogiria',
  ppnet: 'Tumor neuroectodérmico primitivo periférico',
  radionecrose: 'Radionecrose',
  sarcoidose: 'Sarcoidose',
  schwannoma: 'Schwannoma',
  sida: 'Alterações neurológicas associadas à AIDS',
  subependimoma: 'Subependimoma',
  teratomapineal: 'Teratoma pineal',
  toxo: 'Toxoplasmose',
  tucelgran: 'Tumor de células granulares',
  tufibrosol: 'Tumor fibroso solitário',
  tuglioneuron: 'Tumor glioneuronal',
  vasculite: 'Vasculite',
  xantoastro: 'Xantoastrocitoma pleomórfico',
}

/** Séries identificadas na auditoria integral de 2026-08-11. */
const SERIES_COMPLEMENTARES: Record<string, string> = {
  abscesso: 'Abscesso cerebral',
  adem: 'Encefalomielite aguda disseminada',
  anemiafalc: 'Doença falciforme',
  asper: 'Aspergilose do sistema nervoso central',
  astrodesmo: 'Astrocitoma desmoplásico',
  cahipof: 'Carcinoma hipofisário',
  caneuroend: 'Carcinoma neuroendócrino sinonasal',
  cistarac: 'Cisto aracnoide',
  cistneuroent: 'Cisto neuroentérico',
  cistoplexo: 'Cisto do plexo coroide',
  cjd: 'Doença de Creutzfeldt-Jakob',
  coa: 'Cisto ósseo aneurismático',
  condroblastoma: 'Condroblastoma',
  condroma: 'Condroma',
  displasiafibrosa: 'Displasia fibrosa',
  encefalocele: 'Encefalocele',
  ependimoblastoma: 'Ependimoblastoma',
  equinococose: 'Equinococose',
  fibrocondromixo: 'Fibroma condromixoide',
  gbmmultifocal: 'Glioblastoma multifocal',
  gliomacongen: 'Glioma congênito',
  gliomacord: 'Glioma cordoide',
  gliomalinhamedia: 'Glioma difuso da linha média',
  gliomamen: 'Glioma leptomeníngeo primário',
  gliomangio: 'Glioma angiocêntrico',
  granrepcelsgigs: 'Granuloma reparador de células gigantes',
  hemangioma: 'Hemangioma',
  hemimegalo: 'Hemimegalencefalia',
  hiperplexo: 'Hiperplasia do plexo coroide',
  hpericit: 'Hemangiopericitoma',
  leucodist: 'Leucodistrofia',
  leiomioma: 'Leiomioma',
  lipoma: 'Lipoma',
  liponeurocitoma: 'Liponeurocitoma',
  melanocitoma: 'Melanocitoma',
  menangio: 'Meningioangiomatose',
  meningiomat: 'Meningioma',
  mielolipoma: 'Mielolipoma',
  mielomen: 'Meningomielocele',
  mixoma: 'Mixoma intracraniano',
  mpnst: 'Tumor maligno da bainha do nervo periférico',
  mucor: 'Mucormicose rino-órbito-cerebral',
  neurofibroma: 'Neurofibroma',
  neuroma: 'Neuroma traumático',
  osteossarcoma: 'Osteossarcoma',
  pituicitoma: 'Pituicitoma',
  sturgeweber: 'Síndrome de Sturge-Weber',
  tcg: 'Tumor de células gigantes',
  telang: 'Telangiectasia capilar cerebral',
  teratoma: 'Teratoma',
  trm: 'Tumor rabdoide maligno',
  tumiofibro: 'Tumor miofibroblástico inflamatório',
  tumormarrom: 'Tumor marrom do hiperparatireoidismo',
}

const TITULOS_EXATOS: Record<string, string> = {
  'heart pathology': 'Patologia cardiovascular — atlas de lâminas',
  'endocrine pathology': 'Patologia endócrina — atlas de lâminas',
  'endocrine glands pathology': 'Patologia endócrina — atlas de lâminas',
  'gastrointestinal pathology': 'Patologia gastrointestinal — atlas de lâminas',
  'female genital tract pathology': 'Patologia do trato genital feminino — atlas de lâminas',
  'male genital tract pathology': 'Patologia do trato genital masculino — atlas de lâminas',
  'hemopoietic pathology': 'Patologia hematolinfoide — atlas de lâminas',
  'hemopoietic organs pathology': 'Patologia hematolinfoide — atlas de lâminas',
  'bone pathology': 'Patologia óssea — atlas de lâminas',
  'skin pathology': 'Patologia cutânea — atlas de lâminas',
  'lung pathology': 'Patologia pulmonar — atlas de lâminas',
  'neuropathology case studies': 'Estudos de caso em neuropatologia',
  'neuroimaging case studies': 'Estudos de caso em neuroimagem',
  '📋 neuropathology case studies': 'Estudos de caso em neuropatologia',
  '🖥️ neuroimaging case studies': 'Estudos de caso em neuroimagem',
  'abdominal mesothelioma': 'Mesotelioma abdominal',
  'adenocarcinoma of ampulla of vater': 'Adenocarcinoma da ampola de Vater',
  'alcian blue/periodic acid–schiff': 'Azul de Alcian/PAS',
  'anthracosis, anthracotic pigment': 'Antracose — pigmento antracótico',
  biinflhelicobacter: 'Helicobacter pylori — coloração de Warthin-Starry',
  bineugliomatronco: 'Glioma do tronco encefálico',
  'brain mucormycosis gms': 'Mucormicose cerebral — Grocott',
  'brain mucormycosis he': 'Mucormicose cerebral — HE',
  'brain, metastatic hepatoblastoma': 'Cérebro — metástase de hepatoblastoma',
  'brown fat': 'Tecido adiposo marrom',
  'cholesterol polyp': 'Pólipo de colesterol',
  'congo red birefringence': 'Birrefringência pelo vermelho Congo',
  'congo red stain for amyloidosis': 'Vermelho Congo para amiloidose',
  'extramural venous invasion': 'Invasão venosa extramural',
  'extramural venous invasion in adenocarcinoma':
    'Invasão venosa extramural em adenocarcinoma',
  'gallbladder adenomyoma': 'Adenomioma da vesícula biliar',
  'gallbladder pathology': 'Patologia da vesícula biliar',
  'gallbladder rokitansky-aschoff sinus': 'Seio de Rokitansky-Aschoff da vesícula biliar',
  'granular cell tumor in esophagus': 'Tumor de células granulares do esôfago',
  hacettepecom: 'Coleção de histopatologia',
  'ischemic colitis': 'Colite isquêmica',
  'keloid - skar': 'Queloide',
  'melanosis coli': 'Melanose do cólon',
  'melanosis coli pas': 'Melanose do cólon — PAS',
  'metastatic carcinoma, omentum': 'Carcinoma metastático no omento',
  'nasopharyngeal carcinoma, nonkeratinizing squamous cell carcinoma':
    'Carcinoma escamoso não queratinizante da nasofaringe',
  'pediatric autopsy': 'Autópsia pediátrica — coleção GBD, caso 2',
  'pediatric autopsy, brain': 'Autópsia pediátrica do encéfalo — coleção GBD, caso 1',
  'stomach signet ring cell carcinoma': 'Carcinoma gástrico de células em anel de sinete',
  templateen: 'Material complementar',
  'venous invasion': 'Invasão venosa',
  'acute appendicitis': 'Apendicite aguda',
  'acute perforated appendicitis': 'Apendicite aguda perfurada',
  'ampulla wdnet well differantiated neuroendocrine tumor':
    'Tumor neuroendócrino bem diferenciado da ampola de Vater',
  'angiosarcoma, liver': 'Angiossarcoma hepático',
  'angiosarcoma, spleen': 'Angiossarcoma esplênico',
  'appendix b — katkıda bulunmak i̇çin': 'Apêndice B — Como contribuir',
  'appendix c — add comments': 'Apêndice C — Adicionar comentários',
  'appendix d — augmented reality': 'Apêndice D — Realidade aumentada',
  'apple kitaplar - apple books': 'Apple Books',
  'arachnoid cyst': 'Cisto aracnoide',
  'artırılmış gerçeklik (augmented reality)': 'Realidade aumentada',
  'atıf - citation': 'Citação',
  'atlas of medical foreign bodies': 'Atlas de corpos estranhos em medicina',
  'benign prostate hyperplasia': 'Hiperplasia prostática benigna',
  'brain arteriovenous malformation': 'Malformação arteriovenosa cerebral',
  'brain invasive meningioma': 'Meningioma com invasão cerebral',
  'breast carcinoma metastasis in cerebrospinal fluid':
    'Metástase de carcinoma mamário no líquido cefalorraquidiano',
  'bs3 - macrovesicular and microvesicular steatosis, lipogranuloma, liver':
    'Esteatose macrovesicular e microvesicular com lipogranuloma hepático',
  'candida albicans in cervicovaginal smear':
    'Candida albicans em esfregaço cervicovaginal',
  'celiac disease': 'Doença celíaca',
  'cervix squamous cell carcinoma': 'Carcinoma escamoso do colo uterino',
  cholesteatoma: 'Colesteatoma',
  chorioamnionitis: 'Corioamnionite',
  'chromogenic in situ hybridization (cish)': 'Hibridização cromogênica in situ (CISH)',
  'chronic pyelonephritis': 'Pielonefrite crônica',
  'cmv hepatitis, liver': 'Hepatite por CMV',
  'colon adenocarcinoma': 'Adenocarcinoma do cólon',
  'colon adenocarcinoma pt4a': 'Adenocarcinoma do cólon pT4a',
  'colon hyperplastic polyp': 'Pólipo hiperplásico do cólon',
  'colon submucosal lipoma': 'Lipoma submucoso do cólon',
  'colon tumor spread to cervix': 'Disseminação de tumor colônico para o colo uterino',
  'colon tumor spread to endometrium': 'Disseminação de tumor colônico para o endométrio',
  'colon tumor spread to over': 'Disseminação de tumor colônico para o ovário',
  'colon tumor spread to small intestine':
    'Disseminação de tumor colônico para o intestino delgado',
  'congestion in spleen': 'Congestão esplênica',
  'crohn disease fistule': 'Fístula na doença de Crohn',
  'crohn’s disease': 'Doença de Crohn',
  cryptosporidium: 'Criptosporidiose',
  'curtain comparison': 'Comparação por sobreposição',
  'cystic fibrosis, sinusoidal obstruction, liver':
    'Fibrose cística e obstrução sinusoidal hepática',
  'damar duvarlarında amiloid birikimi': 'Depósito de amiloide em paredes vasculares',
  'duodenum wdnet': 'Tumor neuroendócrino bem diferenciado do duodeno',
  'duodenum, net': 'Tumor neuroendócrino do duodeno',
  'ectopic adrenal tissue in paratubal adnexal region':
    'Tecido adrenal ectópico em região anexial paratubária',
  'ectopic pancreas in stomach': 'Pâncreas ectópico no estômago',
  'embolisation microspheres': 'Microesferas de embolização',
  'endometrial polyp': 'Pólipo endometrial',
  'endometriosis in small intestine wall, causing loop obstruction':
    'Endometriose na parede do intestino delgado com obstrução de alça',
  'endometriosis, colon wall': 'Endometriose na parede do cólon',
  'erosion in gastric mucosa': 'Erosão da mucosa gástrica',
  'esophagus, eosinophilic esophagitis': 'Esofagite eosinofílica',
  'esophagus, keratin granulomas after radiotherapy for scc':
    'Granulomas de queratina no esôfago após radioterapia para carcinoma escamoso',
  'exostosis (osteochondroma)': 'Exostose (osteocondroma)',
  'fat necrosis and saponification': 'Necrose gordurosa e saponificação',
  fibrosis: 'Fibrose',
  'ganglioneuroma in adrenal gland': 'Ganglioneuroma da glândula adrenal',
  'gastritis cystica profunda': 'Gastrite cística profunda',
  gbd3: 'Coleção GBD — caso 3 (lâmina virtual)',
  giardiasis: 'Giardíase',
  'giardiasis, duodenum': 'Giardíase duodenal',
  'glycogen storage disease in liver biopsy':
    'Doença de armazenamento de glicogênio em biópsia hepática',
  'granulamatous hepatitis, tbc vs anti-tbc drug induced reaction':
    'Hepatite granulomatosa — tuberculose versus reação a fármacos antituberculose',
  'granular cell tumor, colon': 'Tumor de células granulares do cólon',
  'hamartomatous polyp': 'Pólipo hamartomatoso',
  'hepatocellular carcinoma': 'Carcinoma hepatocelular',
  'hepatocellular carcinoma, fibrolamellar': 'Carcinoma hepatocelular fibrolamelar',
  'herpes simplex virus (hsv)': 'Vírus herpes simples (HSV)',
  'high grade glioma squash slide': 'Citologia por esmagamento de glioma de alto grau',
  'histopathology atlas': 'Atlas de histopatologia',
  'hodgkin lymphoma': 'Linfoma de Hodgkin',
  'hydronephrosis and chronic pyelonephritis': 'Hidronefrose e pielonefrite crônica',
  'insidious lymph node metastasis he': 'Metástase oculta em linfonodo — HE',
  'insidious lymph node metastasis oskar panck':
    'Metástase oculta em linfonodo — OSKAR panCK',
  'intrapancreatic spleen, heterotopic spleen': 'Baço intrapancreático ectópico',
  'ischemia in gangrenous cholecystitis': 'Isquemia em colecistite gangrenosa',
  isospora: 'Isosporíase',
  'kayexalate, sevelamer, gastrointestinal tract injury, chronic kidney failure':
    'Lesão gastrointestinal por Kayexalate e sevelâmer na doença renal crônica',
  'lenfositik gastrit': 'Gastrite linfocítica',
  'lenfositik gastrit cd20': 'Gastrite linfocítica — CD20',
  'lenfositik gastrit cd3': 'Gastrite linfocítica — CD3',
  'lenfositik gastrit cd8': 'Gastrite linfocítica — CD8',
  'leptomeningeal metastasis of lobular breast carcinoma, csf metastasis':
    'Metástase leptomeníngea de carcinoma lobular da mama',
  lipopeliosis: 'Lipopeliose hepática',
  'liver hemangioma': 'Hemangioma hepático',
  'liver transplant, acute rejection': 'Rejeição aguda de transplante hepático',
  'lymphangiectasia duodenum': 'Linfangiectasia duodenal',
  'lymphocytic gastritis': 'Gastrite linfocítica',
  'mammary analogue secretory carcinoma of salivary gland':
    'Carcinoma secretor de glândula salivar análogo ao mamário',
  'meningioma bone infiltration': 'Infiltração óssea por meningioma',
  'metaplasia, dysplasia, carcinoma': 'Metaplasia, displasia e carcinoma',
  'metastatic pannet, liver': 'Metástase hepática de tumor neuroendócrino pancreático',
  'metastatic sarcoma in liver': 'Sarcoma metastático no fígado',
  'molluscum contagiosum': 'Molusco contagioso',
  'mucicarmine histochemistry stain showing intracellular mucin in a normal colon':
    'Mucicarmina demonstrando mucina intracelular no cólon normal',
  'mucinous adenocarcinoma of colon arising from tubulovillus adenoma':
    'Adenocarcinoma mucinoso do cólon originado em adenoma tubuloviloso',
  'myxoid adenomatosis, liver': 'Adenomatose mixoide hepática',
  'myxoid liposarcoma': 'Lipossarcoma mixoide',
  'necrotising granulomatous inflammation in liver':
    'Inflamação granulomatosa necrosante no fígado',
  'necrotising sialometaplasia, radiotherapy after scc':
    'Sialometaplasia necrosante após radioterapia para carcinoma escamoso',
  'neuroendocrine tumor cytology giemsa': 'Citologia de tumor neuroendócrino — Giemsa',
  ochronosis: 'Ocronose',
  oncocytoma: 'Oncocitoma',
  'pancreatic acinar metaplasia, stomach': 'Metaplasia acinar pancreática no estômago',
  parasite: 'Parasita',
  pasd: 'PAS-D',
  'peliosis in cirrhotic nodule': 'Peliose em nódulo cirrótico',
  'pilocytic astrocytoma': 'Astrocitoma pilocítico',
  'pituitary adenoma': 'Adenoma hipofisário',
  pleomorphism: 'Pleomorfismo',
  'polyp with stalk': 'Pólipo pediculado',
  'portal gastropathy': 'Gastropatia portal',
  'pseudoinclusion, drug-induced injury, liver, bone marrow transplantation history':
    'Pseudoinclusão em lesão hepática medicamentosa após transplante de medula óssea',
  'reactive atypia in an ulcerated colon polyp':
    'Atipia reativa em pólipo ulcerado do cólon',
  'ring mitosis, taxane treatment': 'Mitose em anel associada ao tratamento com taxano',
  'rosai collection': 'Coleção Rosai',
  'schwann cell hamartoma in a colon polyp':
    'Hamartoma de células de Schwann em pólipo do cólon',
  'secretory meningioma': 'Meningioma secretor',
  'seed, food remnant': 'Semente e resíduo alimentar',
  'sesile polyp, flat tubular adenoma': 'Pólipo séssil — adenoma tubular plano',
  'sesile serrated adenoma lesion polyp': 'Lesão serrilhada séssil',
  'side by side comparison': 'Comparação lado a lado',
  'thrombosis, fnh-like nodule, budd-chiari':
    'Trombose e nódulo semelhante à hiperplasia nodular focal na síndrome de Budd-Chiari',
  trypsin: 'Tripsina',
  'trypsin immunohistochemistry': 'Imuno-histoquímica para tripsina',
  'tumor heterogeneity: heterogenous her2 immunexpression in breast tumor':
    'Heterogeneidade tumoral — expressão imuno-histoquímica heterogênea de HER2 na mama',
  'virtual pathology slide library': 'Biblioteca de lâminas virtuais de patologia',
  'google kitaplar - google books': 'Google Livros',
}

const TITULOS_POR_PAGINA: Record<string, string> = {
  ecard: 'Patologia cardiovascular — atlas de lâminas',
  eendo: 'Patologia endócrina — atlas de lâminas',
  'epathadditions04-06': 'Coleção de neuropatologia — novos casos (2004–2006)',
  eresp: 'Patologia pulmonar — atlas de lâminas',
  erim: 'Patologia do trato genital masculino — atlas de lâminas',
  eosso: 'Patologia óssea — atlas de lâminas',
  epele: 'Patologia cutânea — atlas de lâminas',
  etgi: 'Patologia gastrointestinal — atlas de lâminas',
  egin: 'Patologia do trato genital feminino — atlas de lâminas',
  ehemo: 'Patologia hematolinfoide — atlas de lâminas',
  enptneominis: 'Estudos de caso em neuropatologia',
  erpgneominis: 'Estudos de caso em neuroimagem',
  atlasneuropatoindice: 'Atlas de neuropatologia — índice de estruturas',
  bineuarteriatemporalnl: 'Artéria temporal normal — fibras elásticas',
  bineufiloterminalnl: 'Filo terminal humano normal — histologia',
  bineumeningioma: 'Meningioma — banco de imagens',
  bineuoligodendroglioma: 'Oligodendroglioma — banco de imagens',
  bineucerebrocoronalindice: 'Anatomia seccional coronal do encéfalo — índice',
  bineucerebrosagital2: 'Anatomia seccional sagital do encéfalo — formação hipocampal',
  'bineufatcoronal-12a': 'Anatomia seccional coronal da cabeça — couro cabeludo e órbita',
  bineuhemorragia: 'Hemorragias intracranianas hipertensivas — banco de imagens',
  bineuherniaamigdalas: 'Hérnia de tonsilas cerebelares com extrusão subaracnóidea espinal',
  bineuescletuber: 'Esclerose tuberosa e astrocitoma subependimário de células gigantes',
  biinflparacoco4: 'Paracoccidioidomicose — cortes semifinos com azul de toluidina',
  biinflcromomic1b: 'Cromomicose — coloração de Grocott',
  lamcard12: 'Miocardite chagásica aguda',
  lamcard13: 'Miocardite chagásica crônica',
  lamdegn20: 'Atrofia de fibras musculares esqueléticas',
  lamdegn21: 'Atrofia dos túbulos seminíferos na hanseníase',
  lamdegn6a: 'Nefrosclerose benigna com hialinose arteriolar',
  lamdc6a: 'Hemorragia antiga com macrófagos siderófagos',
  lamfig3: 'Hepatite crônica em evolução para cirrose',
  lamfig4: 'Hepatite B crônica',
  lamfig6: 'Esteato-hepatite alcoólica',
  lamfig7: 'Cirrose pós-necrótica',
  lamfig8: 'Colestase hepatocelular',
  lamfig9: 'Esquistossomose hepática com fibrose periportal',
  lamfig11: 'Esquistossomose hepatoesplênica com esplenomegalia fibrocongestiva',
  lamgin2: 'Metaplasia escamosa atípica da endocérvice',
  lamneo15a: 'Adenocarcinoma intramucoso',
  nervhansenv: 'Hanseníase virchowiana — neuropatia periférica',
  neupatadicoes: 'Neuropatologia — casos adicionados recentemente',
  'neupatadicoes04-06': 'Coleção de neuropatologia — novos casos (2004–2006)',
  'neupatadicoes07-08': 'Coleção de neuropatologia — novos casos (2007–2008)',
  'neupatadicoes09-10': 'Coleção de neuropatologia — novos casos (2009–2010)',
  'neupatadicoes11-12': 'Coleção de neuropatologia — novos casos (2011–2012)',
  'neupatadicoes13-14': 'Coleção de neuropatologia — novos casos (2013–2014)',
  'neupatadicoes15-16': 'Coleção de neuropatologia — novos casos (2015–2016)',
  'neupatadicoes17-18': 'Coleção de neuropatologia — novos casos (2017–2018)',
  neupatimagemlista: 'Correlação clinicorradiológica em neuropatologia — coleção de casos',
  npthansen1: 'Hanseníase neural — inflamação e perda axonal em nervo periférico',
  npthipofisite1: 'Hipofisite linfocitária — histologia e imuno-histoquímica',
  nptneominisorig: 'Estudos de caso em neuropatologia — versão original',
  nptneominisvasc: 'Neuropatologia vascular — coleção de casos',
  nptneominis: 'Estudos de caso em neuropatologia',
  rpgneominis: 'Estudos de caso em neuroimagem',
  neurorotaulasgeral: 'Neuropatologia geral — roteiro didático',
  neurorotaulasvasc: 'Doenças vasculares do sistema nervoso — roteiro didático',
  nptganglioglioma32a: 'Ganglioglioma da medula espinal — caso 32A',
  nptganglioglioma37a: 'Ganglioglioma — caso 37A — segunda amostra',
  rpgganglioglioma5a: 'Ganglioglioma recidivado — caso 5A',
  nptpnet8d: 'Tumor neuroectodérmico primitivo — caso 8D — EMA',
  nptsarcoma3g: 'Sarcoma intracraniano — caso 3G — índice proliferativo Ki-67',
  nptatrt2b: 'Tumor teratoide/rabdoide atípico — caso 2B — AE1/AE3',
  nptganglioglioma44d: 'Ganglioglioma — caso 44D — S100',
  nptcaplexo4c: 'Carcinoma do plexo coroide — caso 4C — Ki-67 heterogêneo',
  nptneurocitoma5: 'Neurocitoma central — caso 5 — CD34 restrito aos vasos',
  pecascard13: 'Dissecção crônica da aorta com luz de reentrada',
  pecasgin28: 'Adenocarcinoma invasivo da mama — macroscopia',
  pecastgi13: 'Linfoma gástrico — macroscopia',
  pecasfig4: 'Cirrose hepática micronodular',
  pecaspele5: 'Melanoma maligno primário da pele',
  pecaspele6: 'Melanoma maligno do pé',
  taatrofia: 'Atrofia simples por redução do volume celular',
  textotfshpc: 'Tumor fibroso solitário/hemangiopericitoma — classificação',
  bineuangioressovennla: 'Angiorressonância venosa normal',
  bineuleucodist5: 'Leucodistrofia — substância branca occipital',
  bicard: 'Banco de imagens de patologia cardiovascular',
  biinfl: 'Banco de imagens de inflamações e doenças infecciosas',
  bineudmc1: 'Distrofia muscular associada a leucodistrofia — biópsia muscular',
  bineuhipocamponlsnf: 'Hipocampo normal — distribuição da sinaptofisina',
  lamdc13: 'Infarto cerebral antigo',
  lamdc19: 'Dano alveolar difuso — membranas hialinas e regeneração de pneumócitos',
  lamdc5a: 'Necrose centrolobular hepática',
  lamdegn10: 'Amiloidose glomerular avançada',
  lamdegn4a: 'Carcinoma gástrico de células em anel de sinete',
  lamgin16: 'Epitélio mülleriano seroso — lâmina A. 104',
  laminfl30: 'Glomerulonefrite difusa aguda — lâmina A. 140',
  lamneo20a: 'Leiomioma — arquitetura fasciculada',
  lampele3: 'Paracoccidioidomicose — aspecto em roda de leme',
  pecasdc6: 'Infarto antigo com fibrose',
  pecasneo31: 'Linfangite carcinomatosa por carcinoma mamário',
  radlacunaris1: 'Infartos lacunares dos núcleos da base — RM T2',
  rpghemangioma1: 'Hemangioma cervical — macroscopia e ressonância magnética',
  rpghistoplasmose1a: 'Histoplasmose cerebral — caso 1A — ressonância magnética',
  rpgmalform7: 'Malformação do corpo caloso com esquizencefalia — RM T1',
  lamneuro13: 'Astrocitoma fibrilar bem diferenciado',
  'rpgmeningiomat1.3': 'Meningioma calcificado frontal — caso 1.3',
  'rpgmeningiomat1.5': 'Meningioma maligno frontal — caso 1.5',
  'rpgmeningiomat6.2': 'Meningioma infiltrativo do esfenoide — caso 6.2',
  tanecrose2: 'Calcificação — mecanismos',
}

const GENERICO = /^(?:anterior|pr[oó]xim[oa]|seguinte|voltar|mais|recidivar|sem contraste|com contraste|p[aá]gina(?: [ií]ndice)?|mais imagens|he|ihq|histologia|macroscopicamente|microscopicamente|mecanismos|miniresumo|neuroimagem|neuropatologia|literatura|this (?:page|section)(?: in english)?|click for (?:video|full screen wsi)|see microscopy with viewer:)$/i
const CODIGO_DE_LAMINA = /^(?:\*?a\.?\s*[\d/]+[a-z]*|[a-z]{1,5}-?\d+[a-z0-9-]*|\d{1,4}(?:\s*(?:[–—/-]|e)\s*\d{1,4})*)$/i

function limpar(valor: string): string {
  return valor
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim()
}

function restaurarAcronimos(valor: string): string {
  return valor.replace(/\b[\w&-]+\b/g, (token) => ACRONIMOS.get(token.toLowerCase()) ?? token)
}

/** Sentence case em português, preservando siglas médicas frequentes. */
export function formatarTextoCatalogado(valor: string): string {
  const limpo = limpar(valor)
  if (!limpo) return ''

  const letras = limpo.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '')
  const todoMaiusculo = letras.length > 2 && letras === letras.toLocaleUpperCase('pt-BR')
  const base =
    todoMaiusculo && !ACRONIMOS.has(limpo.toLowerCase())
      ? limpo.toLocaleLowerCase('pt-BR')
      : limpo
  const comInicial = base.replace(
    /^([\s("'«]*)([a-zà-öø-ÿ])/u,
    (_, prefixo: string, letra: string) => prefixo + letra.toLocaleUpperCase('pt-BR'),
  )
  return restaurarAcronimos(comInicial)
}

function tituloDaSerie(codigo: string): string | null {
  const correspondencia = codigo.toLowerCase().match(/^(?:rpg|npt)([a-z]+?)(\d+[a-z0-9.-]*)$/)
  if (!correspondencia) return null
  const [, serie, caso] = correspondencia
  const nome = SERIES[serie] ?? SERIES_COMPLEMENTARES[serie]
  if (!nome) return null
  return nome + ' — caso ' + caso.toLocaleUpperCase('pt-BR')
}

function tituloDeCasoCatalogado(codigo: string): string | null {
  const hacettepe = codigo.match(/^hacettepe-com-case-(\d+)$/i)
  if (hacettepe) return `Série Hacettepe — caso ${hacettepe[1]}`

  const caso = codigo.match(/^case-(\d+)$/i)
  if (caso) return `Caso didático ${caso[1]}`

  const banco = codigo.match(/^bs-?(\d+)$/i)
  if (banco) return `Banco de casos — lâmina ${banco[1]}`

  return null
}

function tituloPeloEndereco(paginasFonte: readonly string[]): string | null {
  for (const pagina of paginasFonte) {
    try {
      const arquivo = new URL(pagina).pathname.split('/').pop()?.replace(/\.[a-z0-9]+$/i, '') ?? ''
      const titulo =
        TITULOS_POR_PAGINA[arquivo.toLowerCase()] ??
        tituloDaSerie(arquivo) ??
        tituloDeCasoCatalogado(arquivo)
      if (titulo) return titulo
    } catch {
      // Endereço inválido permanece apenas na proveniência; não vira título.
    }
  }
  return null
}

function tituloDaDescricao(descricao?: string): string | null {
  if (!descricao) return null
  const limpa = limpar(descricao)
  if (!limpa || GENERICO.test(limpa)) return null

  const semIdentificacaoDaLamina = limpa.replace(
    /\s+(?:L[aâ]m?\.?|l[aâ]mina)\s+A?\.?\s*\d+[a-z]*(?:\s*\/\s*\d+[a-z]*)*(?:\s*,\s*corte\s+\w+)?/i,
    '',
  )
  const primeira = semIdentificacaoDaLamina.split(/(?<=[.!?])\s+/)[0]
  const semNumeroDaLamina = primeira
    .replace(/\s+(?:L[aâ]m?\.?|l[aâ]mina)\s+A\.?\s*[\d/]+.*$/i, '')
    .replace(/\s+\(?(?:L[aâ]m?\.?|l[aâ]mina)\s*\d+\)?$/i, '')
    .replace(/[.;:]$/, '')
    .trim()
  const candidata = semNumeroDaLamina.length >= 4 ? semNumeroDaLamina : primeira
  if (GENERICO.test(candidata) || candidata.length < 4) return null
  return formatarTextoCatalogado(
    candidata.length > 120 ? candidata.slice(0, 117).trimEnd() + '…' : candidata,
  )
}

const ROTULO_EDITORIAL = /^(?:mais\s+sobre|sobre|textos?\b|banco de imagens|o mesmo|os tumores|macroscopicamente|microscopicamente|cortes?\b|peça\b|amostra\b|neuroimagem\b|neuropatologia\b|últimas adições)/i

const ROTULO_OPERACIONAL = /^(?:(?:fem|masc|f|m|homem|mulher)[.,]?\s*\d+|(?:cortes?|imagem|figura|l[aâ]m(?:ina)?|peça|espécime|biópsia|amostra|detalhes?|anterior|abaixo|acima|aqui|esta|este|o material|a superfície|aprenda|banco de imagens|mais sobre|sobre|textos?|idem|para página|para mais|já na classificação)|(?:cd\d+|ki-?67|p53|map2|nf|pas(?:-d)?|grocott|he|ihq|tc|rm|t1|t2|flair)\b|(?:additions?|adições|últimas adições|patologia|pathology|página|page|índice|coleção|collection|material complementar)|(?:[a-z]-?\d+(?:\s*[;,]\s*[a-z]-?\d+)+)|(?:\d+[a-z]?[.)]\s+)|(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|20\d{2}(?:\s*[,–—/-]\s*20\d{2})?))\b/i

function retirarIdentificacaoDePaciente(valor: string): string {
  return valor
    .replace(
      /^(?:(?:fem(?:inino)?|masc(?:ulino)?|f|m|homem|mulher)[.,]?\s*\d+(?:\s*a(?:nos?)?\.?)(?:\s*\d+\s*m(?:eses?)?\.?)?)[,;:.]?\s*/i,
      '',
    )
    .trim()
}

function retirarCodigoDeLamina(valor: string): string {
  return valor
    .replace(/^[A-Z]\)\s+/i, '')
    .replace(/\s*[([]?\s*(?:l[aâ]m(?:ina)?\.?\s*)?\bA\.?\s*\d+(?:\s*\/\s*\d+)?[a-z]?\s*[)\]]?/gi, '')
    .replace(/\s+(?:1[ªa]|2[ªa]|3[ªa])\s+l[aâ]mina\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/[.,;:\s]+$/, '')
    .trim()
}

function detalheComContexto(tituloBase: string, original: string): string {
  const semPaciente = retirarIdentificacaoDePaciente(original)
  if (!semPaciente || (semPaciente === original && GENERICO.test(semPaciente))) return tituloBase

  if (ROTULO_EDITORIAL.test(semPaciente)) return tituloBase

  const detalhe = retirarCodigoDeLamina(formatarTextoCatalogado(semPaciente))
  if (!detalhe || detalhe.length < 4 || detalhe.length > 100 || GENERICO.test(detalhe)) {
    return tituloBase
  }

  const baseNormalizada = semAcento(tituloBase)
  const detalheNormalizado = semAcento(detalhe)
  if (baseNormalizada.includes(detalheNormalizado)) return tituloBase

  const marcador = detalheNormalizado.match(/^(?:ae1ae3|s100|cd\d+|ki-?67|p53|map2|nf|pas(?:-d)?|grocott|he|ihq)\b/)?.[0]
  if (
    marcador &&
    baseNormalizada.replace(/[^a-z0-9]/g, '').includes(marcador.replace(/[^a-z0-9]/g, ''))
  ) {
    return tituloBase
  }

  const termosGenericos = new Set(['tumor', 'doenca', 'sindrome', 'carcinoma', 'colecao', 'patologia', 'atlas'])
  const primeiroTermoClinico = baseNormalizada
    .split(/\s+/)
    .find((termo) => termo.length >= 5 && !termosGenericos.has(termo))

  // Um nome clínico específico capturado depois de sexo/idade é melhor que o
  // rótulo genérico da série (p. ex. “Meningioma petroclival…”). Palavras
  // genéricas como “tumor” nunca bastam para promover o texto bruto.
  if (primeiroTermoClinico && detalheNormalizado.includes(primeiroTermoClinico)) {
    return detalhe
  }

  // Técnicas e achados curtos ganham o diagnóstico como contexto. Rótulos de
  // navegação, datas e frases de apresentação não viram subtítulo.
  if (/^(?:cd\d+|ki-?67|p53|map2|nf|pas(?:-d)?|grocott|he|ihq|tc|rm|t1|t2|flair|cortes?|ressonância|tomografia|imuno|coloração)\b/i.test(detalhe)) {
    return tituloBase + ' — ' + detalhe
  }

  return tituloBase
}

export function tituloEditorialDaEntrada(
  nomeCatalogado: string,
  descricaoCatalogada?: string,
  paginasFonte: readonly string[] = [],
): string {
  const original = limpar(nomeCatalogado)
  const exato = TITULOS_EXATOS[original.toLowerCase()]
  if (exato) return retirarCodigoDeLamina(exato)

  const serie = tituloDaSerie(original)
  if (serie) return serie
  const casoCatalogado = tituloDeCasoCatalogado(original)
  if (casoCatalogado) return casoCatalogado

  const pelaPagina = tituloPeloEndereco(paginasFonte)
  const pareceCodigo = CODIGO_DE_LAMINA.test(original) && !ACRONIMOS.has(original.toLowerCase())
  const marcadorOuTecnica = /^(?:AE1AE3|S100|CD\d+|Ki-?67|P53|MAP2|NF|PAS(?:-D)?|Grocott|HE|IHQ|TC|RM|T1|T2|FLAIR)\b/i.test(original)
  const identificacaoDemografica = /^(?:Fem|Masc|F|M|Homem|Mulher)[.,]?\s*\d+/i.test(original)
  const precisaDeContexto =
    pareceCodigo ||
    marcadorOuTecnica ||
    identificacaoDemografica ||
    GENERICO.test(original) ||
    ROTULO_OPERACIONAL.test(original) ||
    ROTULO_EDITORIAL.test(original) ||
    original.length > 80

  if (pelaPagina && precisaDeContexto) {
    return detalheComContexto(retirarCodigoDeLamina(pelaPagina), original)
  }

  if (precisaDeContexto) {
    const pelaDescricao = tituloDaDescricao(descricaoCatalogada)
    if (pelaDescricao) return retirarCodigoDeLamina(pelaDescricao)
  }

  if (CODIGO_DE_LAMINA.test(original)) {
    return 'Lâmina ' + restaurarAcronimos(original.toLocaleUpperCase('pt-BR'))
  }

  return retirarCodigoDeLamina(formatarTextoCatalogado(original))
}


export function descricaoEditorialDaEntrada(descricaoCatalogada?: string): string | undefined {
  if (!descricaoCatalogada) return undefined
  const descricao = formatarTextoCatalogado(descricaoCatalogada)
  if (!descricao || GENERICO.test(descricao)) return undefined
  return descricao.length > 280 ? descricao.slice(0, 277).trimEnd() + '…' : descricao
}

function semAcento(valor: string): string {
  return valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function sistemaEditorialDaEntrada(
  entrada: {
    nomeCatalogado: string
    descricaoCatalogada?: string
    paginasFonte: string[]
  },
  sistemaPadrao: string,
): string {
  const url = semAcento(entrada.paginasFonte.join(' '))
  const texto = semAcento(entrada.nomeCatalogado + ' ' + (entrada.descricaoCatalogada ?? ''))

  if (/\/(?:npt|rpg|bineu|radneu|neupat)/.test(url)) return 'sistema-nervoso'
  if (/anatpat\.unicamp\.br\/(?:nerv|rad|taneu|textotu|neu)/.test(url)) return 'sistema-nervoso'
  if (/anatpat\.unicamp\.br\/mus/.test(url)) return 'ossos-partes-moles'
  if (/anatpat\.unicamp\.br\/(?:egin|liliana)/.test(url)) return 'ginecologico-placenta'
  if (/anatpat\.unicamp\.br\/ehemo/.test(url)) return 'hematolinfoide'
  if (/anatpat\.unicamp\.br\/efig/.test(url)) return 'hepatobiliopancreatico'
  if (/anatpat\.unicamp\.br\/bicard/.test(url)) return 'cardiovascular'
  if (/\/(?:lam|pecas)(?:uro|rim)/.test(url)) return 'urinario-genital-masculino'
  if (/\/(?:lam|pecas)gin/.test(url)) return 'ginecologico-placenta'
  if (/\/(?:lam|pecas)(?:pulm|resp)/.test(url)) return 'respiratorio'
  if (/\/(?:lam|pecas)fig/.test(url)) return 'hepatobiliopancreatico'
  if (/\/(?:lam|pecas)card/.test(url)) return 'cardiovascular'
  if (/\/(?:lam|pecas)tgi|\/bs\d/.test(url)) return 'gastrointestinal'
  if (/\/(?:lam|pecas)(?:pele|derm)/.test(url)) return 'pele'
  if (/\/(?:lam|pecas)(?:hem|linf)/.test(url)) return 'hematolinfoide'
  if (/\/(?:lam|pecas)endo/.test(url)) return 'endocrino'
  if (/\/(?:lam|pecas)mama/.test(url)) return 'mama'
  if (/\/(?:lam|pecas)(?:osso|partesmoles)/.test(url)) return 'ossos-partes-moles'
  if (/histopathologyatlas\.com\/(?:ampulla-vater|gallbladder|liver)/.test(url)) {
    return 'hepatobiliopancreatico'
  }
  if (/histopathologyatlas\.com\/(?:esophagus|stomach|colon|appendix|benign)/.test(url)) {
    return 'gastrointestinal'
  }
  if (/histopathologyatlas\.com\/kidney/.test(url)) return 'urinario-genital-masculino'
  if (/histopathologyatlas\.com\/(?:lung|pleura|nasopharynx|ear)/.test(url)) {
    return 'respiratorio'
  }

  if (sistemaPadrao !== 'nao-classificado') return sistemaPadrao

  const regras: Array<[string, RegExp]> = [
    ['sistema-nervoso', /\b(?:brain|cerebr|cerebel|encefal|mening|glio|astrocit|ependim|hipofis|spinal|medula espinal|nerv|pineal)\w*/],
    ['cardiovascular', /\b(?:heart|cardiac|miocard|coracao|arteri|aorta|vascular|tromboangi|valva)\w*/],
    ['respiratorio', /\b(?:lung|pulmao|pulmonar|pleur|bronqu|alveol|laringe|nasopharyn|nasofaring)\w*/],
    ['gastrointestinal', /\b(?:esophag|esofag|gastric|stomach|estomago|duoden|jejuno|ileon|colon|rectal|retal|appendi|apendic|intestinal)\w*/],
    ['hepatobiliopancreatico', /\b(?:liver|gallbladder|ampulla|figado|hepatic|biliar|colang|pancrea|cirrose)\w*/],
    ['urinario-genital-masculino', /\b(?:kidney|renal|rim\b|glomerul|urotel|bladder|bexiga|prostat|testicul|seminifer)\w*/],
    ['ginecologico-placenta', /\b(?:gynec|ginecolog|uter|endometr|ovari|placent|vilosite|corioamn|cervi|vulva)\w*/],
    ['mama', /\b(?:breast|mama|mamari|fibroadenoma)\w*/],
    ['endocrino', /\b(?:thyroid|tireoi|paratireoi|suprarrenal|adrenal|hipofis)\w*/],
    ['pele', /\b(?:skin|epider|cutane|pele\b|nevocelular|bowen|hanseniase)\w*/],
    ['hematolinfoide', /\b(?:lymph|spleen|linfoma|linfonodo|leucem|timo\b|medula ossea|plasmocit)\w*/],
    ['ossos-partes-moles', /\b(?:bone|muscle|soft tissue|osso\b|osse|muscul|cartilag|osteos|condros|rabdomio|leiomio|tecido mole)\w*/],
  ]
  const sistemaPeloTexto = regras.find(([, padrao]) => padrao.test(texto))?.[0]
  if (sistemaPeloTexto) return sistemaPeloTexto

  // As duas coleções têm páginas gerais, técnicas e índices que não pertencem
  // a um órgão. Mantê-las em Patologia Geral evita um agrupamento residual sem nome.
  if (/anatpat\.unicamp\.br|histopathologyatlas\.com/.test(url)) return 'patologia-geral'
  return sistemaPadrao
}

export function capituloEditorialDaEntrada(entrada: {
  nomeCatalogado: string
  descricaoCatalogada?: string
  modalidades: string[]
  coloracoes: string[]
  temLaminaVirtual: boolean
}): (typeof CAPITULOS_DO_ATLAS)[number] {
  const nomeOriginal = limpar(entrada.nomeCatalogado)
  const codigoDeSerie = /^(?:(?:rpg|npt|bineu|radneu)[a-z]+\d+[a-z0-9-]*|hacettepe-com-case-\d+|case-\d+|bs-?\d+)$/i.test(
    nomeOriginal,
  )
  const titulo = semAcento(
    tituloEditorialDaEntrada(entrada.nomeCatalogado, entrada.descricaoCatalogada),
  )

  let id: CapituloDoAtlasId = 'diagnosticos-e-lesoes'
  if (codigoDeSerie) {
    id = 'casos-e-series'
  } else if (/\b(?:normal|anatomia|controle|comparacao|sem alteracoes)\b/.test(titulo)) {
    id = 'anatomia-e-controles'
  } else if (
    /\b(?:imuno|histoquim|coloracao|marcador|anticorpo|grocott|ziehl|reticulina|tricrom|pas\b|cd\d|gfap|ema\b|ki-?67)\w*/.test(
      titulo,
    )
  ) {
    id = 'tecnicas-e-marcadores'
  } else if (
    /\b(?:ressonancia|tomografia|radiografia|macroscopia|peca cirurgica|t1\b|t2\b|flair)\b/.test(
      titulo,
    )
  ) {
    id = 'macroscopia-e-imagem'
  } else if (
    /\b(?:caso|paciente|masc\.?|fem\.?|anos?\b|serie)\b/.test(titulo)
  ) {
    id = 'casos-e-series'
  }

  return CAPITULO_POR_ID.get(id)!
}
