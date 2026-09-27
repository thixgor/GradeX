import type { Orgao } from '../tipos'

/** Sistema urinário, endócrino, reprodutores e embriologia. */
export const ORGAOS_URO_ENDO_REPRO: Orgao[] = [
  // ─── Urinário ─────────────────────────────────────────────────────────────
  {
    id: 'rim',
    nome: 'Rim',
    sistema: 'urinario',
    sinonimos: ['kidney', 'néfron', 'glomérulo', 'corpúsculo renal', 'túbulo contorcido proximal', 'túbulo distal', 'alça de Henle', 'ducto coletor', 'mácula densa', 'córtex renal', 'medula renal'],
    ficha: {
      resumo:
        'Órgão filtrador: córtex com corpúsculos renais e túbulos contorcidos, medula com alças de Henle e ductos coletores.',
      tecidoPrincipal: 'Epitelial de revestimento (túbulos do néfron)',
      epitelios: [
        { tipo: 'Simples pavimentoso', onde: 'Folheto parietal da cápsula de Bowman e ramo delgado da alça de Henle.' },
        { tipo: 'Simples cúbico com borda em escova', onde: 'Túbulo contorcido proximal (eosinófilo, luz irregular).' },
        { tipo: 'Simples cúbico sem borda em escova', onde: 'Túbulo contorcido distal (mais claro, luz ampla).' },
        { tipo: 'Simples cúbico a cilíndrico', onde: 'Ductos coletores (limites celulares nítidos).' },
        { tipo: 'Podócitos (epitélio visceral especializado)', onde: 'Folheto visceral da cápsula de Bowman.' },
      ],
      morfologia: [
        'Cápsula de conjuntivo denso na superfície.',
        'Córtex: corpúsculos renais (glomérulo + cápsula de Bowman com espaço urinário) cercados de túbulos contorcidos.',
        'Túbulos proximais: maiores, mais eosinófilos, borda em escova, luz estrelada — os mais numerosos do córtex.',
        'Túbulos distais: menores, mais claros, luz limpa; mácula densa junto ao polo vascular.',
        'Raios medulares: feixes de túbulos retos que descem do córtex.',
        'Medula: alças de Henle delgadas, vasos retos e ductos coletores convergindo para a papila.',
        'Histoquímica: fosfatase ácida marca lisossomos (túbulo proximal); citocromo-oxidase marca túbulos ricos em mitocôndrias.',
      ],
      celulas: [
        { nome: 'Células do túbulo proximal', pct: 45, nota: 'Eosinófilas, borda em escova.' },
        { nome: 'Células do túbulo distal e alça de Henle', pct: 15, nota: 'Menores, mais claras.' },
        { nome: 'Células endoteliais', pct: 15, nota: 'Glomérulos e capilares peritubulares.' },
        { nome: 'Células dos ductos coletores', pct: 10, nota: 'Principais e intercaladas.' },
        { nome: 'Podócitos e células mesangiais', pct: 10, nota: 'Glomérulo.' },
        { nome: 'Fibroblastos intersticiais', pct: 5, nota: 'Interstício.' },
      ],
      tecidos: [
        { tipo: 'epitelial-revestimento', pct: 75, onde: 'Néfrons e ductos coletores.' },
        { tipo: 'sangue', pct: 10, onde: 'Glomérulos e vasos.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Interstício.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Cápsula renal.' },
      ],
      reconhecer: [
        'Glomérulos — novelos de capilares com espaço claro em volta.',
        'Muitos túbulos cortados em várias direções.',
      ],
      diferencial: [
        'Tireoide: folículos com coloide, sem glomérulos.',
        'Glândula salivar: ácinos e ductos, sem glomérulos.',
      ],
    },
  },
  {
    id: 'ureter',
    nome: 'Ureter',
    sistema: 'urinario',
    sinonimos: ['ureter', 'urotélio', 'epitélio de transição', 'luz estrelada'],
    ficha: {
      resumo:
        'Tubo muscular com luz estrelada revestida por urotélio, que conduz a urina do rim à bexiga por peristalse.',
      tecidoPrincipal: 'Muscular liso e urotélio',
      epitelios: [
        { tipo: 'Urotélio (epitélio de transição)', onde: 'Revestindo a luz, com células em guarda-chuva na superfície.' },
      ],
      morfologia: [
        'Luz em forma de estrela pelas pregas longitudinais da mucosa.',
        'Urotélio com 4–5 camadas; células superficiais grandes, arredondadas, às vezes binucleadas (guarda-chuva).',
        'Lâmina própria de conjuntivo denso-frouxo, sem glândulas e sem muscular da mucosa.',
        'Muscular: longitudinal interna e circular externa (inverso do tubo digestório); no terço distal, nova longitudinal externa.',
        'Adventícia com gordura e vasos.',
      ],
      celulas: [
        { nome: 'Células uroteliais', pct: 35, nota: 'Basais, intermediárias e superficiais.' },
        { nome: 'Células musculares lisas', pct: 35, nota: 'Túnica muscular.' },
        { nome: 'Fibroblastos', pct: 15, nota: 'Lâmina própria e adventícia.' },
        { nome: 'Adipócitos e células endoteliais', pct: 15, nota: 'Adventícia.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 40, onde: 'Túnica muscular.' },
        { tipo: 'conjuntivo-frouxo', pct: 25, onde: 'Lâmina própria e adventícia.' },
        { tipo: 'epitelial-revestimento', pct: 20, onde: 'Urotélio.' },
        { tipo: 'adiposo-unilocular', pct: 15, onde: 'Adventícia.' },
      ],
      reconhecer: ['Luz estrelada com urotélio.', 'Parede muscular espessa sem glândulas.'],
      diferencial: [
        'Ducto deferente: luz também estrelada, mas epitélio pseudoestratificado com estereocílios e muscular muito mais espessa.',
      ],
    },
  },
  {
    id: 'bexiga',
    nome: 'Bexiga urinária',
    sistema: 'urinario',
    sinonimos: ['urinary bladder', 'vesica urinaria', 'urotélio', 'epitélio de transição', 'detrusor', 'células em guarda-chuva'],
    ficha: {
      resumo:
        'Reservatório de urina: urotélio espesso sobre lâmina própria frouxa e o músculo detrusor em feixes cruzados.',
      tecidoPrincipal: 'Muscular liso (detrusor)',
      epitelios: [
        { tipo: 'Urotélio (epitélio de transição)', onde: 'Revestindo a luz; 5–7 camadas na bexiga vazia.' },
      ],
      morfologia: [
        'Urotélio com células superficiais em guarda-chuva, grandes e com citoplasma eosinófilo apical (placas de uroplaquina).',
        'Na bexiga distendida, o urotélio fica fino com 2–3 camadas.',
        'Lâmina própria frouxa e vascularizada, sem glândulas.',
        'Detrusor: três camadas mal definidas de músculo liso em feixes entrecruzados.',
        'Gânglios autonômicos intramurais podem aparecer entre os feixes.',
      ],
      celulas: [
        { nome: 'Células musculares lisas', pct: 45, nota: 'Detrusor.' },
        { nome: 'Células uroteliais', pct: 30, nota: 'Basais, intermediárias, em guarda-chuva.' },
        { nome: 'Fibroblastos', pct: 15, nota: 'Lâmina própria e septos.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Vasos da lâmina própria.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 55, onde: 'Detrusor.' },
        { tipo: 'conjuntivo-frouxo', pct: 25, onde: 'Lâmina própria e septos.' },
        { tipo: 'epitelial-revestimento', pct: 15, onde: 'Urotélio.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Adventícia/serosa.' },
      ],
      reconhecer: [
        'Epitélio com células superficiais grandes e abauladas.',
        'Músculo liso espesso em feixes desordenados.',
      ],
      diferencial: [
        'Esôfago: estratificado pavimentoso achatado na superfície.',
        'Vesícula biliar: simples cilíndrico.',
      ],
    },
  },
  {
    id: 'uretra',
    nome: 'Uretra',
    sistema: 'urinario',
    sinonimos: ['urethra', 'glândulas de Littré', 'corpo esponjoso', 'uretra peniana'],
    ficha: {
      resumo:
        'Conduto final da urina: epitélio que muda de urotélio a pseudoestratificado e estratificado pavimentoso ao longo do trajeto.',
      tecidoPrincipal: 'Epitelial de revestimento e conjuntivo vascular',
      epitelios: [
        { tipo: 'Urotélio', onde: 'Porção prostática.' },
        { tipo: 'Pseudoestratificado a estratificado cilíndrico', onde: 'Porções membranosa e esponjosa.' },
        { tipo: 'Estratificado pavimentoso não queratinizado', onde: 'Fossa navicular, junto ao meato.' },
        { tipo: 'Simples cilíndrico mucoso (glândulas de Littré)', onde: 'Invaginações da mucosa.' },
      ],
      morfologia: [
        'Luz irregular, em fenda.',
        'Glândulas mucosas de Littré e lacunas na mucosa.',
        'Lâmina própria muito vascularizada; na porção esponjosa, envolta pelo corpo esponjoso (tecido erétil).',
        'Músculo liso e, na porção membranosa, o esfíncter externo esquelético.',
      ],
      celulas: [
        { nome: 'Células epiteliais', pct: 30, nota: 'Revestimento.' },
        { nome: 'Células endoteliais', pct: 25, nota: 'Espaços vasculares.' },
        { nome: 'Células musculares lisas', pct: 20, nota: 'Parede e trabéculas eréteis.' },
        { nome: 'Fibroblastos', pct: 15, nota: 'Lâmina própria.' },
        { nome: 'Células glandulares mucosas', pct: 10, nota: 'Glândulas de Littré.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-frouxo', pct: 30, onde: 'Lâmina própria.' },
        { tipo: 'sangue', pct: 20, onde: 'Espaços vasculares do corpo esponjoso.' },
        { tipo: 'muscular-liso', pct: 20, onde: 'Parede e trabéculas.' },
        { tipo: 'epitelial-revestimento', pct: 20, onde: 'Mucosa.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 10, onde: 'Glândulas de Littré.' },
      ],
      reconhecer: ['Luz em fenda cercada por tecido muito vascularizado.'],
    },
  },

  // ─── Endócrino ────────────────────────────────────────────────────────────
  {
    id: 'hipofise',
    nome: 'Hipófise',
    sistema: 'endocrino',
    sinonimos: ['pituitary gland', 'hypophysis', 'adeno-hipófise', 'neuro-hipófise', 'acidófilas', 'basófilas', 'cromófobas', 'corpos de Herring', 'pituícitos'],
    ficha: {
      resumo:
        'Glândula mestra com duas origens: adeno-hipófise epitelial (cordões de células cromófilas) e neuro-hipófise nervosa (axônios e pituícitos).',
      tecidoPrincipal: 'Epitelial glandular endócrino (adeno) e nervoso (neuro)',
      epitelios: [
        { tipo: 'Glandular endócrino em cordões e ninhos', onde: 'Adeno-hipófise (pars distalis).' },
        { tipo: 'Simples cúbico (cistos de Rathke)', onde: 'Pars intermedia.' },
      ],
      morfologia: [
        'Pars distalis: cordões de células entre capilares sinusoides.',
        'Acidófilas (GH, prolactina): citoplasma rosa/laranja; basófilas (TSH, FSH/LH, ACTH): azul-violáceo; cromófobas: pálidas.',
        'Com Mallory, as acidófilas ficam vermelho-alaranjadas e as basófilas azuis — muito mais fácil de separar que no HE.',
        'Pars intermedia com cistos de coloide (restos da bolsa de Rathke).',
        'Neuro-hipófise pálida e fibrilar: axônios amielínicos, pituícitos e corpos de Herring (acúmulos de neurossecreção).',
      ],
      celulas: [
        { nome: 'Células acidófilas', pct: 35, nota: 'Somatotrofos e lactotrofos.' },
        { nome: 'Células cromófobas', pct: 25, nota: 'Degranuladas ou de reserva.' },
        { nome: 'Células basófilas', pct: 15, nota: 'Tireotrofos, gonadotrofos, corticotrofos.' },
        { nome: 'Pituícitos', pct: 15, nota: 'Glia da neuro-hipófise.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Sinusoides.' },
      ],
      tecidos: [
        { tipo: 'epitelial-glandular-endocrino', pct: 70, onde: 'Adeno-hipófise.' },
        { tipo: 'nervoso-snc', pct: 20, onde: 'Neuro-hipófise.' },
        { tipo: 'conjuntivo-reticular', pct: 5, onde: 'Estroma entre os cordões.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Cápsula.' },
      ],
      reconhecer: [
        'Duas metades muito diferentes: uma celular e colorida, outra pálida e fibrilar.',
        'Mosaico de células rosas, azuis e claras.',
      ],
    },
  },
  {
    id: 'tireoide',
    nome: 'Tireoide',
    sistema: 'endocrino',
    sinonimos: ['thyroid gland', 'glandula thyroidea', 'folículo tireoidiano', 'coloide', 'tireoglobulina', 'células C', 'células parafoliculares'],
    ficha: {
      resumo:
        'Glândula formada por folículos: esferas de epitélio simples cheias de coloide com tireoglobulina, entre capilares.',
      tecidoPrincipal: 'Epitelial glandular endócrino folicular',
      epitelios: [
        { tipo: 'Simples cúbico (varia de pavimentoso a cilíndrico com a atividade)', onde: 'Parede dos folículos.' },
      ],
      morfologia: [
        'Folículos de tamanhos variados, preenchidos por coloide eosinófilo homogêneo.',
        'Epitélio folicular baixo em folículo inativo, alto e com vacúolos de reabsorção no coloide quando ativo.',
        'Células C (parafoliculares) claras, maiores, isoladas ou em grupos entre os folículos — produzem calcitonina.',
        'Estroma delicado com rede capilar densa.',
        'Cápsula e septos dividindo em lóbulos.',
      ],
      celulas: [
        { nome: 'Células foliculares (tireócitos)', pct: 75, nota: 'Revestem os folículos.' },
        { nome: 'Células endoteliais', pct: 15, nota: 'Capilares fenestrados.' },
        { nome: 'Células C (parafoliculares)', pct: 5, nota: 'Claras, entre folículos.' },
        { nome: 'Fibroblastos', pct: 5, nota: 'Septos.' },
      ],
      tecidos: [
        { tipo: 'epitelial-glandular-endocrino', pct: 85, onde: 'Folículos e coloide.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Interstício e septos.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Cápsula.' },
      ],
      reconhecer: ['Esferas cheias de material rosa homogêneo (coloide).'],
      diferencial: [
        'Glândula mamária em lactação: alvéolos com secreção, mas com ductos e estroma lobular.',
        'Rim: túbulos sem coloide e com glomérulos.',
      ],
    },
  },
  {
    id: 'paratireoide',
    nome: 'Paratireoide',
    sistema: 'endocrino',
    sinonimos: ['parathyroid', 'glandula parathyroidea', 'células principais', 'células oxífilas', 'PTH', 'paratormônio'],
    ficha: {
      resumo:
        'Pequena glândula de cordões compactos de células principais (PTH) e células oxífilas, com adipócitos que aumentam com a idade.',
      tecidoPrincipal: 'Epitelial glandular endócrino em cordões',
      epitelios: [
        { tipo: 'Glandular endócrino em cordões e ninhos', onde: 'Parênquima.' },
      ],
      morfologia: [
        'Cordões e ninhos densos de células pequenas, sem folículos.',
        'Células principais: pequenas, núcleo central, citoplasma pálido — a maioria.',
        'Células oxífilas: maiores, citoplasma muito eosinófilo e granular (mitocôndrias), isoladas ou em grupos.',
        'Adipócitos dispersos no estroma (aumentam no adulto).',
        'Tireoide adjacente muitas vezes incluída — use-a como referência.',
      ],
      celulas: [
        { nome: 'Células principais', pct: 70, nota: 'Secretam PTH.' },
        { nome: 'Células oxífilas', pct: 10, nota: 'Eosinófilas, grandes.' },
        { nome: 'Adipócitos', pct: 10, nota: 'Estroma.' },
        { nome: 'Células endoteliais e fibroblastos', pct: 10, nota: 'Capilares e septos.' },
      ],
      tecidos: [
        { tipo: 'epitelial-glandular-endocrino', pct: 75, onde: 'Cordões celulares.' },
        { tipo: 'adiposo-unilocular', pct: 15, onde: 'Estroma.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Cápsula e septos.' },
      ],
      reconhecer: [
        'Massa compacta de células pequenas sem folículos, ao lado da tireoide.',
        'Grupos de células rosadas grandes (oxífilas).',
      ],
    },
  },
  {
    id: 'adrenal',
    nome: 'Adrenal (suprarrenal)',
    sistema: 'endocrino',
    sinonimos: ['adrenal gland', 'suprarrenal', 'binyre', 'zona glomerulosa', 'zona fasciculada', 'zona reticulada', 'medula adrenal', 'células cromafins', 'espongiócitos'],
    ficha: {
      resumo:
        'Duas glândulas numa: córtex em três zonas produtoras de esteroides e medula de células cromafins produtoras de catecolaminas.',
      tecidoPrincipal: 'Epitelial glandular endócrino',
      epitelios: [
        { tipo: 'Glandular endócrino em arcos (glomerulosa), cordões retos (fasciculada) e rede (reticulada)', onde: 'Córtex.' },
        { tipo: 'Glandular endócrino em ninhos (células cromafins)', onde: 'Medula.' },
      ],
      morfologia: [
        'Cápsula espessa na superfície.',
        'Zona glomerulosa: arcos e novelos de células pequenas (mineralocorticoides).',
        'Zona fasciculada: a mais espessa — cordões retos e paralelos de espongiócitos claros, vacuolizados (lipídios; glicocorticoides).',
        'Zona reticulada: cordões anastomosados, células menores e mais eosinófilas, com lipofuscina (androgênios).',
        'Medula: células cromafins grandes, basofílicas, em ninhos, com veias de parede muscular e neurônios ganglionares ocasionais.',
      ],
      celulas: [
        { nome: 'Espongiócitos (fasciculada)', pct: 50, nota: 'Claros, vacuolizados.' },
        { nome: 'Células da reticulada', pct: 15, nota: 'Eosinófilas.' },
        { nome: 'Células da glomerulosa', pct: 10, nota: 'Pequenas, em arcos.' },
        { nome: 'Células cromafins', pct: 10, nota: 'Medula.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Sinusoides entre os cordões.' },
        { nome: 'Fibroblastos', pct: 5, nota: 'Cápsula.' },
      ],
      tecidos: [
        { tipo: 'epitelial-glandular-endocrino', pct: 80, onde: 'Córtex (~70 %) e medula (~10 %).' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 10, onde: 'Cápsula.' },
        { tipo: 'sangue', pct: 5, onde: 'Sinusoides e veia central.' },
        { tipo: 'adiposo-unilocular', pct: 5, onde: 'Gordura periadrenal.' },
      ],
      reconhecer: [
        'Faixas concêntricas sob a cápsula, com colunas claras (fasciculada).',
        'Medula escura no centro.',
      ],
      diferencial: ['Fígado: placas irradiando de veias centrais, espaços porta, sem zonas concêntricas.'],
    },
  },

  // ─── Reprodutor masculino ─────────────────────────────────────────────────
  {
    id: 'testiculo',
    nome: 'Testículo e epidídimo',
    sistema: 'reprodutor-masculino',
    sinonimos: ['testis', 'epididymis', 'túbulos seminíferos', 'espermatogênese', 'células de Sertoli', 'células de Leydig', 'espermatogônias', 'espermátides', 'túnica albugínea'],
    ficha: {
      resumo:
        'Túbulos seminíferos com epitélio germinativo em espermatogênese, células de Leydig no interstício e, ao lado, o epidídimo.',
      tecidoPrincipal: 'Epitélio seminífero (germinativo)',
      epitelios: [
        { tipo: 'Epitélio seminífero estratificado (germinativo) com células de Sertoli', onde: 'Túbulos seminíferos.' },
        { tipo: 'Pseudoestratificado cilíndrico com estereocílios', onde: 'Ducto epididimário.' },
        { tipo: 'Simples cúbico/cilíndrico alternado (festonado)', onde: 'Dúctulos eferentes.' },
      ],
      morfologia: [
        'Túnica albugínea espessa de conjuntivo denso envolvendo o órgão.',
        'Túbulos seminíferos com camadas de células germinativas: espermatogônias na base, espermatócitos (núcleos grandes em prófase), espermátides e espermatozoides junto à luz.',
        'Células de Sertoli: núcleo triangular pálido com nucléolo evidente, apoiado na membrana basal.',
        'Células de Leydig no interstício: grupos de células poligonais eosinófilas (testosterona).',
        'Epidídimo: ducto único muito enovelado, epitélio alto com estereocílios, luz cheia de espermatozoides.',
        'Com hematoxilina férrica, os estágios da espermatogênese ficam muito contrastados.',
      ],
      celulas: [
        { nome: 'Células germinativas (espermatogônias a espermátides)', pct: 65, nota: 'Epitélio seminífero.' },
        { nome: 'Células de Sertoli', pct: 10, nota: 'Sustentação e barreira hematotesticular.' },
        { nome: 'Células epiteliais do epidídimo', pct: 10, nota: 'Principais e basais.' },
        { nome: 'Células de Leydig', pct: 5, nota: 'Intersticiais.' },
        { nome: 'Células mioides, fibroblastos e endoteliais', pct: 10, nota: 'Peritubulares e interstício.' },
      ],
      tecidos: [
        { tipo: 'epitelial-revestimento', pct: 65, onde: 'Epitélio seminífero e epidídimo.' },
        { tipo: 'conjuntivo-frouxo', pct: 15, onde: 'Interstício.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 10, onde: 'Túnica albugínea e septos.' },
        { tipo: 'epitelial-glandular-endocrino', pct: 5, onde: 'Células de Leydig.' },
        { tipo: 'muscular-liso', pct: 5, onde: 'Em volta do ducto epididimário.' },
      ],
      reconhecer: [
        'Túbulos com muitas camadas de células em divisão.',
        'Grupos de células rosadas entre os túbulos (Leydig).',
      ],
      diferencial: ['Ovário: folículos isolados em estroma celular, sem túbulos.'],
    },
  },
  {
    id: 'ducto-deferente',
    nome: 'Ducto deferente',
    sistema: 'reprodutor-masculino',
    sinonimos: ['ductus deferens', 'vas deferens', 'spermatic duct', 'estereocílios', 'funículo espermático'],
    ficha: {
      resumo:
        'Tubo de paredes musculares muito espessas e luz pequena e estrelada, que propulsiona os espermatozoides na ejaculação.',
      tecidoPrincipal: 'Muscular liso',
      epitelios: [
        { tipo: 'Pseudoestratificado cilíndrico com estereocílios', onde: 'Mucosa pregueada.' },
      ],
      morfologia: [
        'Luz pequena e estrelada pelas pregas longitudinais da mucosa.',
        'Muscular espessíssima em três camadas: longitudinal interna, circular média e longitudinal externa.',
        'Lâmina própria com fibras elásticas.',
        'Adventícia com vasos do plexo pampiniforme e fibras do cremaster (esquelético) no funículo.',
      ],
      celulas: [
        { nome: 'Células musculares lisas', pct: 65, nota: 'Três camadas.' },
        { nome: 'Células epiteliais', pct: 15, nota: 'Mucosa.' },
        { nome: 'Fibroblastos', pct: 10, nota: 'Lâmina própria e adventícia.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Vasos da adventícia.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 65, onde: 'Túnica muscular.' },
        { tipo: 'conjuntivo-frouxo', pct: 20, onde: 'Lâmina própria e adventícia.' },
        { tipo: 'epitelial-revestimento', pct: 10, onde: 'Mucosa.' },
        { tipo: 'conjuntivo-elastico', pct: 5, onde: 'Lâmina própria.' },
      ],
      reconhecer: ['Parede muscular enorme para uma luz minúscula e estrelada.'],
      diferencial: ['Ureter: urotélio e muscular bem mais fina.'],
    },
  },
  {
    id: 'prostata',
    nome: 'Próstata',
    sistema: 'reprodutor-masculino',
    sinonimos: ['prostate gland', 'prostata', 'corpos amiláceos', 'estroma fibromuscular', 'glândulas tubuloalveolares'],
    ficha: {
      resumo:
        'Glândulas tubuloalveolares de luz ampla e contorno pregueado, imersas num estroma fibromuscular abundante.',
      tecidoPrincipal: 'Epitelial glandular exócrino em estroma fibromuscular',
      epitelios: [
        { tipo: 'Simples a pseudoestratificado cilíndrico (com células basais)', onde: 'Alvéolos glandulares.' },
        { tipo: 'Urotélio', onde: 'Uretra prostática, quando incluída.' },
      ],
      morfologia: [
        'Glândulas de tamanhos variados, com luz ampla e dobras papilares.',
        'Corpos amiláceos (concreções lamelares eosinófilas) na luz — aumentam com a idade.',
        'Estroma fibromuscular denso: músculo liso entremeado com colágeno.',
        'Cápsula fibromuscular na periferia.',
      ],
      celulas: [
        { nome: 'Células musculares lisas do estroma', pct: 40, nota: 'Feixes entre as glândulas.' },
        { nome: 'Células secretoras luminais', pct: 30, nota: 'PSA, fosfatase ácida.' },
        { nome: 'Fibroblastos', pct: 15, nota: 'Estroma.' },
        { nome: 'Células basais', pct: 10, nota: 'Achatadas, sob as secretoras.' },
        { nome: 'Células endoteliais', pct: 5, nota: 'Vasos.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 35, onde: 'Estroma fibromuscular.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 35, onde: 'Glândulas.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 25, onde: 'Estroma e cápsula.' },
        { tipo: 'conjuntivo-frouxo', pct: 5, onde: 'Em volta das glândulas.' },
      ],
      reconhecer: [
        'Glândulas pregueadas com luz ampla.',
        'Corpos amiláceos.',
        'Estroma rosa com músculo liso.',
      ],
      diferencial: ['Glândula mamária: estroma intralobular frouxo, sem músculo liso.'],
    },
  },
  {
    id: 'penis',
    nome: 'Pênis',
    sistema: 'reprodutor-masculino',
    sinonimos: ['penis', 'corpo cavernoso', 'corpo esponjoso', 'túnica albugínea', 'tecido erétil'],
    ficha: {
      resumo:
        'Dois corpos cavernosos e um corpo esponjoso (com a uretra) de tecido erétil, envoltos pela túnica albugínea e pela pele.',
      tecidoPrincipal: 'Tecido erétil (espaços vasculares com trabéculas fibromusculares)',
      epitelios: [
        { tipo: 'Estratificado pavimentoso queratinizado (fino)', onde: 'Pele.' },
        { tipo: 'Pseudoestratificado/estratificado cilíndrico', onde: 'Uretra peniana.' },
        { tipo: 'Simples pavimentoso (endotélio)', onde: 'Revestindo os espaços cavernosos.' },
      ],
      morfologia: [
        'Corpos cavernosos: espaços vasculares irregulares revestidos por endotélio, separados por trabéculas de conjuntivo e músculo liso.',
        'Túnica albugínea espessa em volta de cada corpo (azul intenso no Azan).',
        'Corpo esponjoso com a uretra no centro e albugínea mais fina.',
        'Artérias helicinas nas trabéculas.',
        'Fáscia e pele fina com músculo liso (dartos) na periferia.',
      ],
      celulas: [
        { nome: 'Células endoteliais', pct: 30, nota: 'Espaços cavernosos.' },
        { nome: 'Células musculares lisas', pct: 30, nota: 'Trabéculas e artérias.' },
        { nome: 'Fibroblastos', pct: 25, nota: 'Albugínea e trabéculas.' },
        { nome: 'Células epiteliais', pct: 15, nota: 'Pele e uretra.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 30, onde: 'Túnica albugínea e trabéculas.' },
        { tipo: 'sangue', pct: 25, onde: 'Espaços cavernosos.' },
        { tipo: 'muscular-liso', pct: 25, onde: 'Trabéculas e dartos.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Fáscia.' },
        { tipo: 'epitelial-revestimento', pct: 10, onde: 'Pele e uretra.' },
      ],
      reconhecer: [
        'Esponja de espaços vasculares cercada por cápsula fibrosa espessa.',
        'Uretra dentro do corpo esponjoso.',
      ],
    },
  },

  // ─── Reprodutor feminino ──────────────────────────────────────────────────
  {
    id: 'ovario',
    nome: 'Ovário',
    sistema: 'reprodutor-feminino',
    sinonimos: ['ovary', 'ovarium', 'folículo primordial', 'folículo primário', 'folículo secundário', 'folículo de Graaf', 'corpo lúteo', 'corpo albicans', 'atresia', 'oócito', 'zona pelúcida', 'teca'],
    ficha: {
      resumo:
        'Córtex com folículos em todas as fases de desenvolvimento, corpo lúteo e corpos albicans, sobre uma medula vascular.',
      tecidoPrincipal: 'Estroma cortical (conjuntivo celular) com folículos',
      epitelios: [
        { tipo: 'Simples cúbico (epitélio de superfície, "germinativo")', onde: 'Superfície do ovário.' },
        { tipo: 'Estratificado (camada granulosa)', onde: 'Folículos secundários e maduros.' },
      ],
      morfologia: [
        'Epitélio cúbico de superfície e túnica albugínea logo abaixo.',
        'Folículos primordiais: oócito cercado por uma camada de células achatadas, logo sob a albugínea.',
        'Folículos primários: células foliculares cúbicas, zona pelúcida aparecendo.',
        'Folículos secundários/antrais: granulosa estratificada, antro com líquido, cumulus oophorus e tecas interna e externa.',
        'Corpo lúteo: grandes células luteínicas da granulosa, pálidas, e células teco-luteínicas menores na periferia.',
        'Corpos albicans: cicatrizes hialinas brancas de corpos lúteos antigos.',
        'Folículos atrésicos: oócito degenerado, zona pelúcida colapsada, granulosa desorganizada.',
        'Medula com vasos grandes e tortuosos.',
      ],
      celulas: [
        { nome: 'Células do estroma cortical', pct: 50, nota: 'Fusiformes, em redemoinho.' },
        { nome: 'Células da granulosa', pct: 20, nota: 'Folículos em crescimento.' },
        { nome: 'Células luteínicas', pct: 10, nota: 'Corpo lúteo.' },
        { nome: 'Células da teca', pct: 10, nota: 'Interna (esteroidogênica) e externa.' },
        { nome: 'Oócitos', pct: 5, nota: 'Poucos, mas enormes.' },
        { nome: 'Células endoteliais', pct: 5, nota: 'Medula e tecas.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-frouxo', pct: 45, onde: 'Estroma cortical celular e medula.' },
        { tipo: 'epitelial-glandular-endocrino', pct: 30, onde: 'Folículos (granulosa/teca) e corpo lúteo.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 15, onde: 'Túnica albugínea e corpos albicans.' },
        { tipo: 'sangue', pct: 5, onde: 'Vasos medulares.' },
        { tipo: 'epitelial-revestimento', pct: 5, onde: 'Epitélio de superfície.' },
      ],
      reconhecer: [
        'Estroma celular com folículos de tamanhos diferentes.',
        'Oócitos grandes com zona pelúcida.',
      ],
      diferencial: ['Testículo: túbulos seminíferos, sem folículos.'],
    },
  },
  {
    id: 'tuba-uterina',
    nome: 'Tuba uterina',
    sistema: 'reprodutor-feminino',
    sinonimos: ['uterine tube', 'tuba uterina', 'trompa de Falópio', 'fallopian tube', 'ampola', 'istmo', 'células ciliadas', 'células secretoras'],
    ficha: {
      resumo:
        'Conduto onde ocorre a fertilização: mucosa com pregas longitudinais ramificadas (máximas na ampola) e epitélio ciliado e secretor.',
      tecidoPrincipal: 'Epitelial de revestimento (mucosa pregueada) e muscular liso',
      epitelios: [
        { tipo: 'Simples cilíndrico com células ciliadas e secretoras (peg cells)', onde: 'Mucosa.' },
        { tipo: 'Simples pavimentoso (mesotélio)', onde: 'Serosa.' },
      ],
      morfologia: [
        'Ampola: pregas mucosas altas, ramificadas e complexas, em labirinto; muscular fina.',
        'Istmo: pregas curtas e poucas; luz menor; muscular espessa (circular interna e longitudinal externa).',
        'Epitélio com células ciliadas (claras, cílios) e secretoras (escuras, sem cílios).',
        'Lâmina própria frouxa e vascular.',
        'Serosa externa com mesossalpinge.',
      ],
      celulas: [
        { nome: 'Células ciliadas', pct: 30, nota: 'Movem o oócito.' },
        { nome: 'Células secretoras', pct: 20, nota: 'Nutrem o gameta.' },
        { nome: 'Células musculares lisas', pct: 25, nota: 'Muscular (maior no istmo).' },
        { nome: 'Fibroblastos', pct: 15, nota: 'Lâmina própria.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Vasos.' },
      ],
      tecidos: [
        { tipo: 'epitelial-revestimento', pct: 35, onde: 'Mucosa pregueada.' },
        { tipo: 'muscular-liso', pct: 30, onde: 'Túnica muscular.' },
        { tipo: 'conjuntivo-frouxo', pct: 30, onde: 'Lâmina própria.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Serosa.' },
      ],
      reconhecer: [
        'Labirinto de pregas finas com epitélio ciliado (ampola).',
        'Luz pequena com muscular espessa (istmo).',
      ],
      diferencial: ['Vesícula biliar: sem cílios, pregas mais grossas.'],
    },
  },
  {
    id: 'utero',
    nome: 'Útero (corpo)',
    sistema: 'reprodutor-feminino',
    sinonimos: ['uterus', 'corpus uteri', 'endométrio', 'miométrio', 'fase proliferativa', 'fase secretora', 'decídua', 'glândulas endometriais', 'útero gravídico'],
    ficha: {
      resumo:
        'Endométrio (mucosa funcional que muda a cada ciclo) sobre um miométrio espesso de músculo liso.',
      tecidoPrincipal: 'Muscular liso (miométrio) e endométrio',
      epitelios: [
        { tipo: 'Simples cilíndrico com células ciliadas e secretoras', onde: 'Superfície endometrial.' },
        { tipo: 'Glandular tubular simples', onde: 'Glândulas endometriais no estroma.' },
      ],
      morfologia: [
        'Endométrio: camada funcional (descama na menstruação) sobre a camada basal (regenera).',
        'Fase proliferativa: glândulas retas e estreitas, estroma denso e celular, mitoses.',
        'Fase secretora: glândulas tortuosas em "dente de serra", com secreção na luz e vacúolos subnucleares no início; estroma edemaciado.',
        'Artérias espiraladas no endométrio funcional.',
        'Miométrio muito espesso: feixes de músculo liso em camadas mal definidas, com grandes vasos na camada média.',
        'Na gravidez: células deciduais grandes e poligonais no estroma e miométrio hipertrofiado.',
      ],
      celulas: [
        { nome: 'Células musculares lisas (miométrio)', pct: 45, nota: 'Maior volume do órgão.' },
        { nome: 'Células do estroma endometrial', pct: 25, nota: 'Fusiformes; deciduais na gravidez.' },
        { nome: 'Células epiteliais glandulares', pct: 15, nota: 'Glândulas e superfície.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Artérias espiraladas e vasos.' },
        { nome: 'Leucócitos (células NK uterinas, linfócitos)', pct: 5, nota: 'Estroma.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 55, onde: 'Miométrio.' },
        { tipo: 'conjuntivo-frouxo', pct: 25, onde: 'Estroma endometrial.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 10, onde: 'Glândulas endometriais.' },
        { tipo: 'epitelial-revestimento', pct: 5, onde: 'Superfície endometrial.' },
        { tipo: 'sangue', pct: 5, onde: 'Vasos do miométrio e endométrio.' },
      ],
      reconhecer: [
        'Mucosa com glândulas tubulares em estroma celular sobre músculo liso espesso.',
        'Forma das glândulas indica a fase do ciclo.',
      ],
      diferencial: ['Colo uterino: glândulas mucosas ramificadas e estroma fibroso.'],
    },
  },
  {
    id: 'colo-uterino',
    nome: 'Colo uterino',
    sistema: 'reprodutor-feminino',
    sinonimos: ['cervix uteri', 'cérvix', 'endocérvice', 'ectocérvice', 'zona de transformação', 'cistos de Naboth', 'glândulas cervicais'],
    ficha: {
      resumo:
        'Endocérvice com glândulas mucosas ramificadas e ectocérvice com epitélio estratificado pavimentoso, unidas na zona de transformação.',
      tecidoPrincipal: 'Conjuntivo denso fibroso (estroma cervical)',
      epitelios: [
        { tipo: 'Simples cilíndrico mucossecretor', onde: 'Endocérvice e glândulas cervicais.' },
        { tipo: 'Estratificado pavimentoso não queratinizado', onde: 'Ectocérvice (face vaginal).' },
      ],
      morfologia: [
        'Endocérvice: pregas (plicas palmadas) e glândulas ramificadas de células mucosas altas, com núcleo basal.',
        'Cistos de Naboth: glândulas dilatadas por muco retido.',
        'Ectocérvice: epitélio estratificado pavimentoso rico em glicogênio (células claras).',
        'Zona de transformação: onde um epitélio encontra o outro (metaplasia escamosa) — região das lesões precursoras do câncer do colo.',
        'Estroma rico em colágeno com pouco músculo liso (menos que no corpo).',
      ],
      celulas: [
        { nome: 'Fibroblastos', pct: 35, nota: 'Estroma fibroso.' },
        { nome: 'Células mucosas endocervicais', pct: 25, nota: 'Glândulas e superfície.' },
        { nome: 'Células escamosas', pct: 20, nota: 'Ectocérvice.' },
        { nome: 'Células musculares lisas', pct: 10, nota: 'Escassas no estroma.' },
        { nome: 'Células endoteliais e leucócitos', pct: 10, nota: 'Estroma.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 50, onde: 'Estroma cervical.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 20, onde: 'Glândulas endocervicais.' },
        { tipo: 'epitelial-revestimento', pct: 15, onde: 'Endo e ectocérvice.' },
        { tipo: 'muscular-liso', pct: 10, onde: 'Feixes esparsos.' },
        { tipo: 'conjuntivo-frouxo', pct: 5, onde: 'Lâmina própria sob os epitélios.' },
      ],
      reconhecer: [
        'Glândulas mucosas claras e ramificadas em estroma fibroso.',
        'Transição para epitélio estratificado.',
      ],
    },
  },
  {
    id: 'vagina',
    nome: 'Vagina',
    sistema: 'reprodutor-feminino',
    sinonimos: ['vagina', 'epitélio vaginal', 'glicogênio', 'mucosa vaginal'],
    ficha: {
      resumo:
        'Tubo fibromuscular revestido por epitélio estratificado pavimentoso não queratinizado rico em glicogênio, sem glândulas na parede.',
      tecidoPrincipal: 'Epitelial de revestimento estratificado',
      epitelios: [
        { tipo: 'Estratificado pavimentoso não queratinizado (rico em glicogênio)', onde: 'Mucosa; células das camadas médias e superficiais com citoplasma claro.' },
      ],
      morfologia: [
        'Epitélio espesso, com camadas intermediárias e superficiais de citoplasma claro e vacuolado (glicogênio, extraído no HE).',
        'Lâmina própria de conjuntivo denso, rica em fibras elásticas e com plexo venoso.',
        'Ausência de glândulas: o muco vem do colo uterino.',
        'Camada muscular lisa mal delimitada (circular interna e longitudinal externa).',
        'Adventícia fibrosa externa.',
      ],
      celulas: [
        { nome: 'Queratinócitos (células epiteliais escamosas)', pct: 45, nota: 'Epitélio.' },
        { nome: 'Células musculares lisas', pct: 25, nota: 'Camada muscular.' },
        { nome: 'Fibroblastos', pct: 20, nota: 'Lâmina própria e adventícia.' },
        { nome: 'Células endoteliais e leucócitos', pct: 10, nota: 'Plexo venoso e lâmina própria.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 35, onde: 'Lâmina própria e adventícia.' },
        { tipo: 'muscular-liso', pct: 30, onde: 'Camada muscular.' },
        { tipo: 'epitelial-revestimento', pct: 25, onde: 'Mucosa.' },
        { tipo: 'conjuntivo-elastico', pct: 5, onde: 'Rede elástica da lâmina própria.' },
        { tipo: 'sangue', pct: 5, onde: 'Plexo venoso.' },
      ],
      reconhecer: [
        'Epitélio estratificado espesso com células claras (glicogênio).',
        'Nenhuma glândula na parede.',
      ],
      diferencial: [
        'Esôfago: estratificado sem glicogênio abundante, com muscular da mucosa e glândulas submucosas.',
        'Ectocérvice: mesmo epitélio, mas com glândulas endocervicais por perto.',
      ],
    },
  },
  {
    id: 'glandula-mamaria',
    nome: 'Glândula mamária',
    sistema: 'reprodutor-feminino',
    sinonimos: ['mammary gland', 'mama', 'lóbulo mamário', 'alvéolos', 'lactação', 'células mioepiteliais', 'actina de músculo liso', 'SMA', 'TDLU'],
    ficha: {
      resumo:
        'Glândula tubuloalveolar composta que muda radicalmente com o estado: inativa (ductos e estroma), gestante (proliferação) e lactante (alvéolos cheios de leite).',
      tecidoPrincipal: 'Epitelial glandular exócrino em estroma conjuntivo',
      epitelios: [
        { tipo: 'Simples cúbico a cilíndrico com camada mioepitelial', onde: 'Ductos e alvéolos.' },
        { tipo: 'Estratificado cúbico', onde: 'Ductos lactíferos maiores.' },
      ],
      morfologia: [
        'Inativa: lóbulos pequenos de ductos e ácinos rudimentares em estroma intralobular frouxo; estroma interlobular denso e gordura dominam.',
        'Gestação: lóbulos crescem, alvéolos se multiplicam, estroma diminui.',
        'Lactação: alvéolos dilatados com leite (proteína eosinófila e gotas lipídicas vazias), epitélio achatado ou com vacúolos apicais.',
        'Células mioepiteliais em volta de ductos e alvéolos — marcadas em marrom pela imuno para actina de músculo liso (SMA).',
      ],
      celulas: [
        { nome: 'Adipócitos', pct: 30, nota: 'Estroma (maior na inativa).' },
        { nome: 'Fibroblastos', pct: 25, nota: 'Estroma intra e interlobular.' },
        { nome: 'Células epiteliais luminais', pct: 25, nota: 'Ductos e alvéolos (dominam na lactação).' },
        { nome: 'Células mioepiteliais', pct: 10, nota: 'Camada basal.' },
        { nome: 'Linfócitos, plasmócitos e células endoteliais', pct: 10, nota: 'Estroma.' },
      ],
      tecidos: [
        { tipo: 'adiposo-unilocular', pct: 30, onde: 'Estroma interlobular.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 25, onde: 'Estroma interlobular fibroso.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 25, onde: 'Lóbulos (sobe para ~70 % na lactação).' },
        { tipo: 'conjuntivo-frouxo', pct: 20, onde: 'Estroma intralobular.' },
      ],
      reconhecer: [
        'Ilhas lobulares de ductos em estroma fibroso e gorduroso.',
        'Na lactação, alvéolos com secreção e vacúolos.',
      ],
      diferencial: [
        'Tireoide: folículos com coloide homogêneo, sem ductos nem estroma gorduroso.',
        'Glândulas apócrinas da axila: sem lobulação mamária, ao lado de folículos pilosos.',
      ],
    },
  },

  // ─── Embriologia ──────────────────────────────────────────────────────────
  {
    id: 'blastocisto',
    nome: 'Blastocisto',
    sistema: 'embriologia',
    sinonimos: ['blastocyst', 'trofoblasto', 'embrioblasto', 'massa celular interna', 'blastocele', 'implantação'],
    ficha: {
      resumo:
        'Embrião de cerca de 5 dias: esfera de trofoblasto com a massa celular interna num polo e a cavidade blastocística.',
      tecidoPrincipal: 'Tecidos embrionários iniciais',
      epitelios: [
        { tipo: 'Simples pavimentoso (trofoblasto)', onde: 'Parede do blastocisto.' },
        { tipo: 'Simples cilíndrico (epitélio uterino)', onde: 'Mucosa uterina ao redor, quando incluída.' },
      ],
      morfologia: [
        'Parede fina de trofoblasto (futura parte fetal da placenta).',
        'Massa celular interna (embrioblasto) agrupada num polo — dará origem ao embrião.',
        'Blastocele: cavidade cheia de líquido.',
        'Pode estar livre na luz uterina ou iniciando a implantação no endométrio.',
      ],
      celulas: [
        { nome: 'Células endometriais (estroma e glândulas)', pct: 70, nota: 'Tecido materno em volta.' },
        { nome: 'Trofoblasto', pct: 20, nota: 'Parede do blastocisto.' },
        { nome: 'Embrioblasto', pct: 10, nota: 'Massa celular interna.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-frouxo', pct: 55, onde: 'Estroma endometrial.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 20, onde: 'Glândulas endometriais.' },
        { tipo: 'epitelial-revestimento', pct: 25, onde: 'Trofoblasto e epitélio uterino.' },
      ],
      reconhecer: ['Esfera oca pequena com um acúmulo de células num polo.'],
    },
  },
  {
    id: 'placenta',
    nome: 'Placenta',
    sistema: 'embriologia',
    sinonimos: ['placenta', 'vilosidades coriônicas', 'sinciciotrofoblasto', 'citotrofoblasto', 'espaço interviloso', 'decídua basal', 'células de Hofbauer'],
    ficha: {
      resumo:
        'Órgão de troca materno-fetal: vilosidades coriônicas fetais banhadas pelo sangue materno do espaço interviloso.',
      tecidoPrincipal: 'Vilosidades coriônicas (trofoblasto sobre mesênquima)',
      epitelios: [
        { tipo: 'Sinciciotrofoblasto (sincício) sobre citotrofoblasto', onde: 'Revestimento das vilosidades.' },
        { tipo: 'Âmnio (simples cúbico)', onde: 'Face fetal (placa coriônica).' },
      ],
      morfologia: [
        'Vilosidades cortadas em várias direções, com eixo de mesênquima e capilares fetais.',
        'Sinciciotrofoblasto: camada contínua multinucleada, com nós sinciciais no termo.',
        'Citotrofoblasto: células individuais abaixo do sincício, rarefeitas no fim da gestação.',
        'Espaço interviloso cheio de sangue materno (hemácias sem capilar próprio).',
        'Células de Hofbauer (macrófagos fetais) no eixo viloso.',
        'Fibrinoide eosinófilo e decídua basal (células grandes, poligonais) na face materna.',
      ],
      celulas: [
        { nome: 'Hemácias maternas e fetais', pct: 40, nota: 'Espaço interviloso e capilares.' },
        { nome: 'Núcleos do sinciciotrofoblasto', pct: 20, nota: 'Revestindo as vilosidades.' },
        { nome: 'Células mesenquimais e endoteliais fetais', pct: 20, nota: 'Eixo viloso.' },
        { nome: 'Células deciduais', pct: 10, nota: 'Face materna.' },
        { nome: 'Citotrofoblasto e células de Hofbauer', pct: 10, nota: 'Sob o sincício e no eixo.' },
      ],
      tecidos: [
        { tipo: 'sangue', pct: 40, onde: 'Espaço interviloso e capilares fetais.' },
        { tipo: 'conjuntivo-mucoso', pct: 25, onde: 'Mesênquima das vilosidades (tipo mucoso/embrionário).' },
        { tipo: 'epitelial-revestimento', pct: 20, onde: 'Trofoblasto e âmnio.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Decídua basal e placa coriônica.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Placa coriônica e septos.' },
      ],
      reconhecer: [
        'Muitos perfis redondos (vilosidades) boiando em sangue.',
        'Borda de núcleos escuros agrupados (sincício).',
      ],
    },
  },
  {
    id: 'cordao-umbilical',
    nome: 'Cordão umbilical',
    sistema: 'embriologia',
    sinonimos: ['umbilical cord', 'geleia de Wharton', 'artérias umbilicais', 'veia umbilical', 'tecido conjuntivo mucoso', 'âmnio'],
    ficha: {
      resumo:
        'Duas artérias e uma veia umbilicais imersas em geleia de Wharton (conjuntivo mucoso), revestidas pelo âmnio.',
      tecidoPrincipal: 'Conjuntivo especializado mucoso (geleia de Wharton)',
      epitelios: [
        { tipo: 'Simples cúbico a pavimentoso (âmnio)', onde: 'Superfície do cordão.' },
        { tipo: 'Simples pavimentoso (endotélio)', onde: 'Luz dos vasos umbilicais.' },
      ],
      morfologia: [
        'Duas artérias de parede muscular espessa e luz pequena, sem lâmina elástica interna nítida.',
        'Uma veia de luz maior e parede mais fina (leva sangue oxigenado ao feto).',
        'Geleia de Wharton: matriz gelatinosa pálida, rica em ácido hialurônico, com fibroblastos estrelados.',
        'Âmnio em camada única na superfície.',
        'Não há vasa vasorum, nervos nem linfáticos.',
      ],
      celulas: [
        { nome: 'Células musculares lisas', pct: 45, nota: 'Parede dos vasos umbilicais.' },
        { nome: 'Fibroblastos estrelados (miofibroblastos)', pct: 35, nota: 'Geleia de Wharton.' },
        { nome: 'Células epiteliais amnióticas', pct: 10, nota: 'Superfície.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Vasos.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-mucoso', pct: 65, onde: 'Geleia de Wharton.' },
        { tipo: 'muscular-liso', pct: 30, onde: 'Artérias e veia umbilicais.' },
        { tipo: 'epitelial-revestimento', pct: 5, onde: 'Âmnio e endotélio.' },
      ],
      reconhecer: ['Três vasos (2 artérias + 1 veia) em matriz pálida e gelatinosa.'],
    },
  },
  {
    id: 'membranas-fetais',
    nome: 'Membranas fetais',
    sistema: 'embriologia',
    sinonimos: ['fetal membranes', 'âmnio', 'córion', 'decídua capsular', 'decídua parietal', 'bolsa amniótica'],
    ficha: {
      resumo:
        'Âmnio e córion aderidos à decídua: a parede da bolsa amniótica, em camadas finas e bem definidas.',
      tecidoPrincipal: 'Conjuntivo (camadas do âmnio e do córion)',
      epitelios: [
        { tipo: 'Simples cúbico (epitélio amniótico)', onde: 'Face interna, voltada ao líquido amniótico.' },
        { tipo: 'Trofoblasto extraviloso (células do córion leve)', onde: 'Camada coriônica, junto à decídua.' },
      ],
      morfologia: [
        'Epitélio amniótico em camada única, sem vasos.',
        'Camadas compacta, fibroblástica e esponjosa do âmnio.',
        'Córion com camada reticular e trofoblasto extraviloso.',
        'Decídua (capsular/parietal) aderida por fora, com células deciduais grandes.',
        'Vilosidades atróficas (fantasmas) do córion leve podem aparecer.',
      ],
      celulas: [
        { nome: 'Células deciduais', pct: 35, nota: 'Grandes, poligonais.' },
        { nome: 'Trofoblasto extraviloso', pct: 25, nota: 'Córion leve.' },
        { nome: 'Fibroblastos', pct: 20, nota: 'Âmnio e córion.' },
        { nome: 'Células epiteliais amnióticas', pct: 15, nota: 'Face interna.' },
        { nome: 'Leucócitos maternos', pct: 5, nota: 'Decídua.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-frouxo', pct: 45, onde: 'Camadas do âmnio e do córion, decídua.' },
        { tipo: 'epitelial-revestimento', pct: 35, onde: 'Epitélio amniótico e trofoblasto.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 20, onde: 'Camada compacta do âmnio.' },
      ],
      reconhecer: ['Membrana em camadas finas, com epitélio cúbico de um lado e células deciduais do outro.'],
    },
  },
]
