import type { Orgao } from '../tipos'

/**
 * Órgãos e tecidos que o acervo de lâminas inteiras não cobre e entraram por
 * fotomicrografias avulsas de licença aberta (Wikimedia Commons, Human Protein
 * Atlas). As fichas descrevem o órgão; o que a foto mostra — um campo único —
 * vai na nota de curadoria.
 */
export const ORGAOS_COMPLEMENTARES: Orgao[] = [
  {
    id: 'hipocampo',
    nome: 'Hipocampo',
    sistema: 'nervoso',
    sinonimos: ['hippocampus', 'giro denteado', 'dentate gyrus', 'corno de Amon', 'cornu ammonis', 'CA1', 'CA3', 'CA4', 'hilo', 'células granulares', 'formação hipocampal', 'arquicórtex'],
    ficha: {
      resumo:
        'Córtex antigo (arquicórtex) de três camadas, enrolado no lobo temporal medial: o giro denteado e o corno de Amon, essenciais para formar memórias novas.',
      tecidoPrincipal: 'Nervoso — sistema nervoso central',
      epitelios: [],
      semEpitelio: 'O SNC não tem epitélio; o epêndima que forra o corno temporal do ventrículo lateral fica fora deste campo.',
      morfologia: [
        'Giro denteado: faixa em "C" ou "V" de células granulares pequenas, redondas e muito juntas — a camada granular, a mais densa do campo.',
        'Camada molecular do giro denteado: pálida e pobre em núcleos, por fora da concavidade da faixa granular; recebe a via perfurante do córtex entorrinal.',
        'Hilo (região polimórfica, CA4): dentro da concavidade da faixa granular, com neurônios maiores e esparsos (células musgosas) entre glia e vasos.',
        'Corno de Amon (CA1–CA3): uma única camada de neurônios piramidais — grandes e espaçados em CA3, menores e mais juntos em CA1.',
        'Neurópilo: fundo de prolongamentos celulares, onde os núcleos que se veem são sobretudo de glia.',
      ],
      celulas: [
        { nome: 'Células granulares do giro denteado', pct: 50, nota: 'Núcleo redondo e escuro de ~8–10 µm, quase sem citoplasma; formam a faixa densa. Seguem se formando no adulto, na zona subgranular.' },
        { nome: 'Astrócitos', pct: 15, nota: 'Núcleo oval, claro, sem citoplasma visível em HE.' },
        { nome: 'Oligodendrócitos', pct: 15, nota: 'Núcleo pequeno, redondo e escuro, às vezes com halo claro.' },
        { nome: 'Células endoteliais e pericitos', pct: 8, nota: 'Núcleos alongados colados aos capilares.' },
        { nome: 'Neurônios do hilo e piramidais (células musgosas, CA3–CA4)', pct: 6, nota: 'Corpos maiores com núcleo vesiculoso e nucléolo evidente.' },
        { nome: 'Micróglia', pct: 6, nota: 'Núcleo pequeno, alongado ou em bastão.' },
      ],
      tecidos: [
        { tipo: 'nervoso-snc', pct: 98, onde: 'Todo o campo: camadas do giro denteado, hilo e neurópilo.' },
        { tipo: 'conjuntivo-frouxo', pct: 2, onde: 'Adventícia dos vasos maiores.' },
      ],
      reconhecer: [
        'Faixa curva e compacta de células pequenas e redondas (giro denteado) abraçando uma área mais frouxa (hilo).',
        'Camada única de neurônios piramidais continuando a partir do hilo (corno de Amon).',
      ],
      diferencial: [
        'Cerebelo: a camada granular é larga e forma folhas, com células de Purkinje na borda; no giro denteado, a faixa granular é fina e curva, sem Purkinje.',
        'Córtex cerebral (isocórtex): seis camadas sem uma faixa granular isolada tão compacta.',
      ],
    },
  },
  {
    id: 'glandula-pineal',
    nome: 'Glândula pineal',
    sistema: 'endocrino',
    sinonimos: ['pineal gland', 'epífise cerebral', 'corpo pineal', 'pinealócitos', 'melatonina', 'corpora arenacea', 'areia cerebral', 'acérvulo'],
    ficha: {
      resumo:
        'Glândula neuroendócrina do epitálamo que secreta melatonina à noite, sincronizando o ritmo circadiano com o ciclo claro-escuro.',
      tecidoPrincipal: 'Neuroendócrino — pinealócitos em lóbulos (derivado do neuroectoderma)',
      epitelios: [],
      semEpitelio:
        'Não há epitélio de revestimento: os pinealócitos são neurônios modificados, organizados em cordões e lóbulos sem lâmina basal contínua.',
      morfologia: [
        'Cápsula de pia-máter, fina e fibrosa, emitindo septos que dividem o parênquima em lóbulos.',
        'Parênquima muito celular — por isso é confundido com tumor —, com os pinealócitos em cordões e ninhos.',
        'Pinealócitos: núcleo redondo a lobulado, cromatina fina, nucléolo visível e citoplasma claro e mal delimitado em HE (os prolongamentos só aparecem com prata).',
        'Astrócitos intersticiais: núcleos alongados e mais escuros entre os pinealócitos e em volta dos vasos.',
        'Corpora arenacea (areia cerebral): concreções calcificadas lamelares e basófilas, cada vez mais frequentes com a idade — nem todo campo as mostra.',
        'Capilares fenestrados abundantes, sem barreira hematoencefálica.',
      ],
      celulas: [
        { nome: 'Pinealócitos', pct: 80, nota: 'Secretam melatonina a partir da serotonina, sob comando noradrenérgico do gânglio cervical superior.' },
        { nome: 'Astrócitos intersticiais', pct: 10, nota: 'Núcleos alongados e escuros; sustentação entre os cordões.' },
        { nome: 'Células endoteliais e fibroblastos', pct: 8, nota: 'Capilares fenestrados e septos conjuntivos.' },
        { nome: 'Micróglia e mastócitos', pct: 2, nota: 'Esparsos.' },
      ],
      tecidos: [
        { tipo: 'epitelial-glandular-endocrino', pct: 85, onde: 'Lóbulos de pinealócitos (neuroendócrino, de origem neuroectodérmica).' },
        { tipo: 'conjuntivo-frouxo', pct: 12, onde: 'Septos entre os lóbulos, com vasos.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 3, onde: 'Cápsula de pia-máter na superfície.' },
      ],
      reconhecer: [
        'Tecido muito celular, em lóbulos separados por septos finos, com núcleos redondos e citoplasma claro.',
        'Corpora arenacea basófilas e lamelares, quando presentes, fecham o diagnóstico.',
      ],
      diferencial: [
        'Adeno-hipófise: células em cordões com três tinturas (acidófilas, basófilas e cromófobas); a pineal é monótona, sem grânulos corados.',
        'Pineocitoma: forma rosetas pineocitomatosas grandes e perde a arquitetura lobular regular.',
      ],
    },
  },
  {
    id: 'vesicula-seminal',
    nome: 'Vesícula seminal',
    sistema: 'reprodutor-masculino',
    sinonimos: ['seminal vesicle', 'glândula seminal', 'líquido seminal', 'frutose', 'pregas da mucosa', 'lipofuscina', 'ducto ejaculatório'],
    ficha: {
      resumo:
        'Glândula tubular muito enovelada que produz cerca de 70 % do volume do sêmen — um líquido viscoso, alcalino e rico em frutose, que nutre os espermatozoides.',
      tecidoPrincipal: 'Epitelial glandular exócrino sobre parede de músculo liso',
      epitelios: [
        {
          tipo: 'Pseudoestratificado colunar (células colunares secretoras sobre células basais); pode parecer simples colunar ou cúbico',
          onde: 'Revestindo as pregas da mucosa.',
        },
      ],
      morfologia: [
        'Luz ampla e irregular, recortada por pregas da mucosa primárias, secundárias e terciárias que se anastomosam — em corte, um labirinto de "câmaras".',
        'Secreção eosinófila e floculada na luz, às vezes com espermatozoides.',
        'Células colunares com grânulos de lipofuscina (pigmento amarelo-acastanhado) no citoplasma; núcleos às vezes grandes e irregulares em idosos — atipia degenerativa, não tumoral.',
        'Lâmina própria fina, rica em fibras elásticas, no eixo de cada prega.',
        'Parede muscular lisa espessa (circular interna e longitudinal externa), que contrai na ejaculação.',
        'Adventícia de conjuntivo denso com vasos e nervos.',
      ],
      celulas: [
        { nome: 'Células colunares secretoras', pct: 45, nota: 'Secretam frutose, prostaglandinas e semenogelina.' },
        { nome: 'Células musculares lisas', pct: 30, nota: 'Parede espessa, eosinófila.' },
        { nome: 'Células basais', pct: 10, nota: 'Pequenas, junto à membrana basal.' },
        { nome: 'Fibroblastos', pct: 8, nota: 'Eixo das pregas e adventícia.' },
        { nome: 'Células endoteliais', pct: 5, nota: 'Capilares das pregas.' },
        { nome: 'Linfócitos', pct: 2, nota: 'Esparsos na lâmina própria.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 50, onde: 'Parede em volta da mucosa pregueada.' },
        { tipo: 'epitelial-glandular-exocrino', pct: 30, onde: 'Epitélio das pregas.' },
        { tipo: 'conjuntivo-frouxo', pct: 15, onde: 'Lâmina própria no eixo das pregas.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Adventícia.' },
      ],
      reconhecer: [
        'Luz única e grande, com pregas finas e ramificadas em labirinto, cercada por músculo liso espesso.',
        'Pigmento de lipofuscina e núcleos atípicos no epitélio, sem invasão da parede.',
      ],
      diferencial: [
        'Próstata: muitas glândulas separadas num estroma fibromuscular, com corpos amiláceos; a vesícula tem uma luz central só, com pregas.',
        'Ducto deferente: luz pequena com pregas baixas e muscular muito mais espessa (três camadas).',
        'Adenocarcinoma de próstata: a atipia da vesícula é degenerativa, com lipofuscina e arquitetura preservada.',
      ],
    },
  },
  {
    id: 'osso-compacto',
    nome: 'Osso compacto (desgastado)',
    sistema: 'esqueletico',
    sinonimos: ['compact bone', 'ground bone', 'osso cortical', 'ósteon', 'osteon', 'sistema de Havers', 'canal de Havers', 'canal de Volkmann', 'lacunas', 'canalículos', 'lamelas intersticiais', 'linha cimentante'],
    ficha: {
      resumo:
        'Osso cortical preparado por desgaste, sem descalcificar e sem corar: a matriz mineral fica intacta e as cavidades — canais, lacunas e canalículos — aparecem escuras, cheias de ar e resíduo.',
      tecidoPrincipal: 'Ósseo — osso compacto lamelar',
      epitelios: [],
      semEpitelio: 'Tecido de sustentação, sem epitélio.',
      morfologia: [
        'Ósteons (sistemas de Havers): cilindros de 4 a 20 lamelas concêntricas em volta de um canal central.',
        'Canal de Havers: orifício central, escuro no desgaste, por onde correm vasos e nervos.',
        'Lacunas: cavidades fusiformes e escuras entre as lamelas, onde viviam os osteócitos.',
        'Canalículos: traços finos e radiais que saem das lacunas e ligam uma lacuna à outra e ao canal — o aspecto de "aranha".',
        'Lamelas intersticiais: fragmentos angulosos de ósteons antigos, remodelados, entre os ósteons inteiros.',
        'Linhas cimentantes: contornos nítidos em volta de cada ósteon, pobres em colágeno; os canalículos não as atravessam.',
        'Canais de Volkmann: canais transversais ou oblíquos, sem lamelas concêntricas, ligando os canais de Havers entre si e ao periósteo.',
      ],
      celulas: [
        { nome: 'Osteócitos (só as lacunas)', pct: 100, nota: 'No desgaste as células são destruídas: cada lacuna escura marca onde havia um osteócito, e os canalículos, os seus prolongamentos.' },
      ],
      tecidos: [{ tipo: 'osso-compacto', pct: 100, onde: 'Todo o campo: ósteons e lamelas intersticiais.' }],
      reconhecer: [
        'Anéis concêntricos com um orifício escuro no centro, cercados de lacunas escuras com canalículos radiais.',
        'Sem núcleos corados: a imagem é de cavidades vazias contra a matriz mineral clara.',
      ],
      diferencial: [
        'Osso descalcificado em HE: matriz rosa com osteócitos de núcleos corados dentro das lacunas; canalículos quase invisíveis.',
        'Osso esponjoso: trabéculas separadas pela medula óssea, sem ósteons completos.',
      ],
    },
  },
  {
    id: 'fibrocartilagem',
    nome: 'Fibrocartilagem',
    sistema: 'tecidos-fundamentais',
    sinonimos: ['fibrocartilage', 'cartilagem fibrosa', 'disco intervertebral', 'anel fibroso', 'menisco', 'sínfise púbica', 'condrócitos em fileira', 'colágeno tipo I'],
    ficha: {
      resumo:
        'Cartilagem de transição entre o tecido denso e a cartilagem hialina: condrócitos em fileiras entre feixes grossos de colágeno tipo I, que resistem à tração e à compressão.',
      tecidoPrincipal: 'Cartilaginoso — fibrocartilagem',
      epitelios: [],
      semEpitelio: 'Tecido de sustentação, sem epitélio.',
      morfologia: [
        'Feixes grossos e paralelos (ou entrecruzados) de colágeno tipo I — azuis neste tricrômico — ocupando a maior parte da matriz.',
        'Condrócitos em lacunas, isolados, aos pares ou em fileiras curtas alinhadas entre os feixes.',
        'Pouca matriz territorial basófila, só em volta das lacunas.',
        'Sem pericôndrio: a fibrocartilagem se continua com o tendão, ligamento ou cartilagem hialina vizinhos.',
        'Avascular: nutre-se por difusão a partir dos tecidos adjacentes.',
      ],
      celulas: [
        { nome: 'Condrócitos', pct: 80, nota: 'Arredondados, em lacunas, em fileiras entre os feixes de colágeno.' },
        { nome: 'Fibroblastos', pct: 20, nota: 'Alongados e achatados entre os feixes, sem lacuna — mostram a transição para o tecido denso.' },
      ],
      tecidos: [{ tipo: 'fibrocartilagem', pct: 100, onde: 'Todo o campo.' }],
      reconhecer: [
        'Muito colágeno em feixes, como um tendão, mas com células redondas em lacunas enfileiradas.',
        'Sem pericôndrio.',
      ],
      diferencial: [
        'Tendão (denso modelado): fibroblastos achatados e alongados, sem lacunas.',
        'Cartilagem hialina: matriz homogênea e vítrea, grupos isógenos e pericôndrio.',
      ],
    },
  },
  {
    id: 'conjuntivo-frouxo',
    nome: 'Tecido conjuntivo frouxo (areolar)',
    sistema: 'tecidos-fundamentais',
    sinonimos: ['loose connective tissue', 'areolar tissue', 'tecido areolar', 'distensão de mesentério', 'fibras colágenas', 'fibras elásticas', 'fibroblasto', 'mastócito', 'substância fundamental'],
    ficha: {
      resumo:
        'Conjuntivo de sustentação e de defesa, rico em células e em substância fundamental: fibras colágenas e elásticas frouxamente entrelaçadas num gel hidratado.',
      tecidoPrincipal: 'Conjuntivo propriamente dito — frouxo (areolar)',
      epitelios: [],
      semEpitelio: 'Distensão de membrana conjuntiva, sem epitélio de revestimento.',
      morfologia: [
        'Preparação por distensão: a membrana é esticada e corada inteira, sem corte — as fibras aparecem em todo o comprimento.',
        'Fibras colágenas: grossas, rosadas, levemente onduladas, sem se ramificar.',
        'Fibras elásticas: finas, retas ou em espiral, escuras e ramificadas, que se cruzam em rede.',
        'Fibroblastos: núcleos ovais a alongados; o citoplasma quase não aparece.',
        'Mastócitos (grânulos escuros e metacromáticos) e macrófagos costumam aparecer entre as fibras.',
        'Espaços claros entre as fibras correspondem à substância fundamental, que o processamento não retém.',
      ],
      celulas: [
        { nome: 'Fibroblastos', pct: 70, nota: 'Sintetizam as fibras e a substância fundamental.' },
        { nome: 'Macrófagos', pct: 10, nota: 'Núcleo menor e mais escuro, em forma de rim.' },
        { nome: 'Mastócitos', pct: 10, nota: 'Citoplasma cheio de grânulos escuros (histamina, heparina).' },
        { nome: 'Leucócitos, plasmócitos e adipócitos', pct: 10, nota: 'Esparsos.' },
      ],
      tecidos: [{ tipo: 'conjuntivo-frouxo', pct: 100, onde: 'Toda a membrana distendida.' }],
      reconhecer: [
        'Rede frouxa de fibras de dois tipos — grossas rosadas (colágenas) e finas escuras ramificadas (elásticas) — com núcleos esparsos.',
      ],
      diferencial: [
        'Denso não modelado (derme reticular): feixes colágenos grossos e compactos, com poucas células e pouca substância fundamental.',
        'Tecido elástico: predominam as fibras elásticas grossas, em lâminas (como na aorta).',
      ],
    },
  },
]
