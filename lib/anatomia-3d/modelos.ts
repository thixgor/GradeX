/**
 * Catálogo de modelos anatômicos 3D da seção "Anatomia 3D" do Manual Clínico.
 *
 * Fonte editorial exibida na interface: Universidade de Dundee (crédito único,
 * por decisão de produto — mesmo os modelos oriundos de outras coleções do
 * AnatomyTOOL são apresentados sob essa atribuição).
 *
 * Os embeds do Sketchfab são construídos a partir do `sketchfabId` via
 * `embedUrl()`. Não colocar classes do Tailwind aqui: o content-scan só cobre
 * `app/**` e `components/**`, então cor/ícone ficam como CHAVES semânticas e
 * são mapeados para classes reais nos componentes.
 */

export type CategoriaId =
  | 'coracao'
  | 'coronarias'
  | 'congenitas'
  | 'pulmoes'
  | 'neuro'
  | 'linfatico'
  | 'visceras'
  | 'vertebras'
  | 'costelas'
  | 'cintura'
  | 'axial'
  | 'cranio'

export type CorKey =
  | 'rose'
  | 'red'
  | 'fuchsia'
  | 'sky'
  | 'violet'
  | 'emerald'
  | 'indigo'
  | 'amber'
  | 'orange'
  | 'lime'
  | 'teal'
  | 'cyan'

export type IconKey =
  | 'Heart'
  | 'Activity'
  | 'HeartPulse'
  | 'Wind'
  | 'Brain'
  | 'Droplets'
  | 'Stethoscope'
  | 'Bone'
  | 'Skull'
  | 'PersonStanding'

export interface Categoria {
  id: CategoriaId
  titulo: string
  subtitulo: string
  cor: CorKey
  icon: IconKey
}

export interface SecaoAnatomica {
  titulo: string
  paragrafos: string[]
}

export interface Modelo3D {
  slug: string
  titulo: string
  legenda: string
  categoriaId: CategoriaId
  // ID do modelo no Sketchfab (últimos caracteres da URL). `null` = sem embed.
  sketchfabId: string | null
  resumo: string
  secoes: SecaoAnatomica[]
  destaque?: boolean
}

export const FONTE = 'Universidade de Dundee'

export function embedUrl(sketchfabId: string | null): string | null {
  return sketchfabId ? `https://sketchfab.com/models/${sketchfabId}/embed` : null
}

export const CATEGORIAS: Categoria[] = [
  { id: 'coracao', titulo: 'Coração — Anatomia Normal', subtitulo: 'Morfologia, câmaras, valvas e grandes vasos', cor: 'rose', icon: 'Heart' },
  { id: 'coronarias', titulo: 'Circulação Coronária & Dominância', subtitulo: 'Irrigação do miocárdio e sistema de condução', cor: 'red', icon: 'Activity' },
  { id: 'congenitas', titulo: 'Cardiopatias Congênitas', subtitulo: 'Malformações estruturais e correções cirúrgicas', cor: 'fuchsia', icon: 'HeartPulse' },
  { id: 'pulmoes', titulo: 'Pulmões & Vias Aéreas', subtitulo: 'Árvore brônquica, pulmões e laringe', cor: 'sky', icon: 'Wind' },
  { id: 'neuro', titulo: 'Neuroanatomia & Cabeça/Pescoço', subtitulo: 'Encéfalo, nervos cranianos e musculatura', cor: 'violet', icon: 'Brain' },
  { id: 'linfatico', titulo: 'Sistema Linfático', subtitulo: 'Rede de drenagem e sua relação com os vasos', cor: 'emerald', icon: 'Droplets' },
  { id: 'visceras', titulo: 'Vísceras, Vasos & Músculos', subtitulo: 'Conteúdo e paredes do tórax e abdome', cor: 'indigo', icon: 'Stethoscope' },
  { id: 'vertebras', titulo: 'Coluna Torácica — Vértebras', subtitulo: 'T1 a T12 e suas particularidades', cor: 'amber', icon: 'Bone' },
  { id: 'costelas', titulo: 'Costelas & Esterno', subtitulo: 'Arcos costais, esterno e articulações', cor: 'orange', icon: 'Bone' },
  { id: 'cintura', titulo: 'Cíngulo do Membro Superior', subtitulo: 'Escápula e clavícula', cor: 'lime', icon: 'Bone' },
  { id: 'axial', titulo: 'Esqueleto Axial & Ossos', subtitulo: 'Conjuntos ósseos do tronco', cor: 'teal', icon: 'PersonStanding' },
  { id: 'cranio', titulo: 'Crânio & Ossos da Cabeça', subtitulo: 'Órbita, ossos palatinos e mandíbula', cor: 'cyan', icon: 'Skull' },
]

export function getCategoria(id: CategoriaId): Categoria {
  return CATEGORIAS.find(c => c.id === id) || CATEGORIAS[0]
}

/* ──────────────────────────────────────────────────────────────────────────
 * Construtores de seções para estruturas ósseas repetitivas (vértebras,
 * costelas, escápula, clavícula, esterno). Mantêm o conteúdo anatômico geral
 * consistente e correto, deixando o parágrafo específico do nível/lado por
 * conta de cada modelo.
 * ──────────────────────────────────────────────────────────────────────── */

const RELEVANCIA_VERTEBRA: SecaoAnatomica = {
  titulo: 'Relevância clínica',
  paragrafos: [
    'A sustentação da caixa torácica confere rigidez ao segmento, tornando as fraturas menos frequentes do que na coluna cervical ou lombar; quando ocorrem — trauma de alta energia ou colapso osteoporótico — podem comprometer a medula, pois o canal vertebral é relativamente estreito nesta região. A cifose torácica fisiológica e a predileção por metástases ósseas também tornam o segmento clinicamente importante.',
  ],
}

function secoesVertebra(especifico: SecaoAnatomica): SecaoAnatomica[] {
  return [
    {
      titulo: 'Visão geral',
      paragrafos: [
        'As doze vértebras torácicas (T1–T12) formam o segmento médio e mais estável da coluna e constituem a única região vertebral que se articula diretamente com as costelas. São reconhecidas pelo corpo em forma de coração, pelo forame vertebral pequeno e circular e pelo longo processo espinhoso dirigido para baixo, que se imbrica com o da vértebra seguinte como telhas de um telhado.',
      ],
    },
    {
      titulo: 'Corpo e fóveas costais',
      paragrafos: [
        'Em cada lado do corpo há, tipicamente, duas hemifóveas costais (fóvea costal superior e inferior). A fóvea inferior de uma vértebra e a superior da vértebra subjacente delimitam, com o disco intervertebral interposto, a cavidade que recebe a cabeça da costela de mesmo número — por isso a cabeça de uma costela típica se articula com duas vértebras adjacentes.',
      ],
    },
    {
      titulo: 'Arco vertebral e processos',
      paragrafos: [
        'Pedículos curtos e lâminas largas fecham o forame vertebral. Os processos transversos, dirigidos posterolateralmente, possuem (de T1 a T10) a fóvea costal do processo transverso, que se articula com o tubérculo da costela. As facetas articulares superiores voltam-se posterior e lateralmente, e as inferiores no sentido oposto — orientação próxima do plano frontal que favorece a rotação axial e restringe flexão e extensão.',
      ],
    },
    especifico,
    RELEVANCIA_VERTEBRA,
  ]
}

const RELEVANCIA_COSTELA: SecaoAnatomica = {
  titulo: 'Relevância clínica',
  paragrafos: [
    'Como o feixe neurovascular corre no sulco da margem inferior, punções e drenagens torácicas devem ser feitas rente à margem superior da costela de baixo, poupando vasos e nervo. Fraturas costais são comuns no trauma: as das costelas inferiores podem lesar baço, fígado ou rim, e múltiplas fraturas em segmentos contíguos podem gerar tórax instável (flail chest).',
  ],
}

function secoesCostela(especifico: SecaoAnatomica): SecaoAnatomica[] {
  return [
    {
      titulo: 'Visão geral',
      paragrafos: [
        'As costelas são ossos chatos e curvos que formam a maior parte da caixa torácica — doze pares ao todo. As verdadeiras (1ª–7ª) unem-se ao esterno por cartilagem própria; as falsas (8ª–10ª) unem-se à cartilagem da costela suprajacente; e as flutuantes (11ª–12ª) terminam livremente na parede posterior.',
      ],
    },
    {
      titulo: 'Anatomia da costela típica',
      paragrafos: [
        'Uma costela típica (3ª–9ª) apresenta cabeça com duas facetas separadas por uma crista (articulam-se com o corpo da própria vértebra e o da vértebra suprajacente), um colo, um tubérculo com faceta articular para o processo transverso, um ângulo — onde o corpo muda de direção — e o corpo propriamente dito. Na face interna da margem inferior há o sulco da costela, que aloja o feixe neurovascular intercostal (veia, artéria e nervo, de cima para baixo: VAN).',
      ],
    },
    especifico,
    RELEVANCIA_COSTELA,
  ]
}

function secoesEscapula(especifico: SecaoAnatomica): SecaoAnatomica[] {
  return [
    {
      titulo: 'Visão geral',
      paragrafos: [
        'A escápula é um osso triangular, plano e móvel, que conecta o úmero ao esqueleto axial e desliza sobre a parede posterior do tórax (2ª–7ª costelas). Possui três margens (superior, medial e lateral), três ângulos (superior, inferior e lateral) e duas faces.',
      ],
    },
    {
      titulo: 'Faces, espinha e processos',
      paragrafos: [
        'A face costal (anterior) forma a fossa subescapular. A face posterior é cruzada pela espinha da escápula, que a divide nas fossas supraespinal e infraespinal e se prolonga lateralmente como o acrômio. O processo coracoide projeta-se anteriormente, e o ângulo lateral porta a cavidade glenoidal — rasa e circundada pelos tubérculos supraglenoidal e infraglenoidal — que se articula com a cabeça do úmero.',
      ],
    },
    especifico,
    {
      titulo: 'Relevância clínica',
      paragrafos: [
        'A escápula é protegida por espessa musculatura e só fratura em traumas de alta energia. A rasa cavidade glenoidal, que privilegia mobilidade em detrimento de estabilidade, explica a alta frequência de luxações glenoumerais. A escápula alada denuncia lesão do nervo torácico longo (paralisia do serrátil anterior).',
      ],
    },
  ]
}

function secoesClavicula(especifico: SecaoAnatomica): SecaoAnatomica[] {
  return [
    {
      titulo: 'Visão geral',
      paragrafos: [
        'A clavícula é um osso longo em forma de S que se estende horizontalmente entre o manúbrio do esterno e o acrômio, escorando o membro superior afastado do tronco. É o primeiro osso do corpo a ossificar e o único osso longo de disposição horizontal.',
      ],
    },
    {
      titulo: 'Extremidades e faces',
      paragrafos: [
        'A extremidade esternal (medial) é arredondada e articula-se com o manúbrio; a acromial (lateral) é achatada e articula-se com o acrômio. A face superior é lisa (subcutânea); a inferior apresenta a impressão do ligamento costoclavicular medialmente, o sulco do músculo subclávio no meio e, lateralmente, o tubérculo conoide e a linha trapezoide, onde se fixa o ligamento coracoclavicular.',
      ],
    },
    especifico,
    {
      titulo: 'Relevância clínica',
      paragrafos: [
        'A clavícula é um dos ossos mais fraturados do corpo, tipicamente na junção dos terços médio e lateral após queda sobre o ombro ou a mão estendida; o fragmento medial tende a subir (tração do esternocleidomastóideo) e o lateral a descer. Sua relação íntima com os vasos subclávios e o plexo braquial subjacentes torna essas estruturas vulneráveis no trauma.',
      ],
    },
  ]
}

function secoesEsterno(especifico: SecaoAnatomica): SecaoAnatomica[] {
  return [
    {
      titulo: 'Visão geral',
      paragrafos: [
        'O esterno é o osso chato e alongado da parede anterior do tórax, formado por três partes: o manúbrio (superior), o corpo e o processo xifoide (inferior). Junto com as costelas, protege o coração, os grandes vasos e o mediastino.',
      ],
    },
    {
      titulo: 'Marcos ósseos',
      paragrafos: [
        'O manúbrio apresenta a incisura jugular (supraesternal) na borda superior, as incisuras claviculares laterais e, abaixo, a faceta para a 1ª cartilagem costal. O ângulo do esterno (de Louis), na junção manúbrio-corpo, alinha-se com a 2ª costela e com o disco T4/T5 — plano de referência para a bifurcação da traqueia, o arco da aorta e o limite entre os mediastinos superior e inferior.',
      ],
    },
    especifico,
    {
      titulo: 'Relevância clínica',
      paragrafos: [
        'O ângulo do esterno é o principal ponto de referência para contar as costelas no exame físico. O corpo do esterno, rico em medula óssea vermelha, é local clássico de punção esternal. A esternotomia mediana é a via de acesso padrão à cirurgia cardíaca.',
      ],
    },
  ]
}

/* ──────────────────────────────────────────────────────────────────────────
 * CATÁLOGO DE MODELOS
 * ──────────────────────────────────────────────────────────────────────── */

export const MODELOS: Modelo3D[] = [
  /* ===================== CORAÇÃO — ANATOMIA NORMAL ===================== */
  {
    slug: 'coracao-humano-plastinado',
    titulo: 'Coração humano (peça plastinada)',
    legenda: 'Modelo rotacionável baseado em escaneamento 3D de um coração plastinado.',
    categoriaId: 'coracao',
    // NOTA: na versão anterior este ID (8e86582b...) aparecia duplicado no card
    // "Artérias coronárias". A divergência foi reconciliada: as coronárias agora
    // usam o modelo correto da Dundee (slug 'arterias-coronarias').
    sketchfabId: '8e86582b400843eba805f5ad81747911',
    destaque: true,
    resumo:
      'Reconstrução fiel de um coração real plastinado, ideal para reconhecer a morfologia externa e a orientação do órgão no tórax.',
    secoes: [
      {
        titulo: 'Situação e orientação',
        paragrafos: [
          'O coração ocupa o mediastino médio, envolto pelo pericárdio, com cerca de dois terços de sua massa à esquerda da linha mediana. Tem formato de pirâmide deitada: a base (posterossuperior) é formada sobretudo pelo átrio esquerdo e volta-se para trás; o ápice, formado pelo ventrículo esquerdo, aponta para baixo, para a frente e para a esquerda, geralmente no 5º espaço intercostal na linha hemiclavicular.',
        ],
      },
      {
        titulo: 'Câmaras e faces',
        paragrafos: [
          'As quatro câmaras — dois átrios e dois ventrículos — desenham as faces do órgão: a face esternocostal (anterior) é dominada pelo ventrículo direito; a face diafragmática (inferior) pelos ventrículos direito e esquerdo; e a face pulmonar esquerda pelo ventrículo esquerdo. Os sulcos coronário (atrioventricular) e interventriculares marcam externamente os limites entre as câmaras e alojam os vasos coronários.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'Conhecer a projeção do ápice é essencial para localizar o ictus cordis e reconhecer cardiomegalia. A plastinação preserva a arquitetura tridimensional real, tornando o modelo útil para correlacionar o coração com a radiografia de tórax e a ausculta dos focos valvares.',
        ],
      },
    ],
  },
  {
    slug: 'coracao-e-vasos-vallance',
    titulo: 'Coração e seus vasos',
    legenda: 'O coração inteiro com os grandes vasos da base.',
    categoriaId: 'coracao',
    sketchfabId: '33c93ec8f852471cad6270f1c089e5fe',
    resumo:
      'Visão do coração com os grandes vasos que entram e saem da base, útil para entender as conexões da circulação sistêmica e pulmonar.',
    secoes: [
      {
        titulo: 'Grandes vasos da base',
        paragrafos: [
          'Da base do coração emergem e chegam os grandes vasos: a aorta ascendente (do ventrículo esquerdo), o tronco pulmonar (do ventrículo direito), as veias cavas superior e inferior (para o átrio direito) e as quatro veias pulmonares (para o átrio esquerdo). O tronco pulmonar cruza anteriormente à aorta e bifurca-se nas artérias pulmonares direita e esquerda.',
        ],
      },
      {
        titulo: 'Circuitos em série',
        paragrafos: [
          'O lado direito bombeia sangue pouco oxigenado ao pulmão (pequena circulação) e o lado esquerdo bombeia sangue oxigenado ao corpo (grande circulação). Os dois circuitos operam em série, de modo que o débito das duas bombas precisa se equilibrar batimento a batimento.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A relação espacial entre aorta e tronco pulmonar é a chave para compreender as cardiopatias conotruncais. O calibre das câmaras e vasos, avaliado por ecocardiografia, reflete sobrecargas de pressão e volume nas diversas cardiopatias.',
        ],
      },
    ],
  },
  {
    slug: 'coracao-vista-externa',
    titulo: 'Vista externa do coração',
    legenda: 'Anatomia externa do coração humano, com anotações das características gerais.',
    categoriaId: 'coracao',
    sketchfabId: 'a3f0ea2030214a6bbaa97e7357eebd58',
    resumo:
      'Superfície externa do coração com sulcos, câmaras e o trajeto dos vasos coronários — a melhor porta de entrada para a anatomia cardíaca.',
    secoes: [
      {
        titulo: 'Sulcos e limites',
        paragrafos: [
          'O sulco coronário (atrioventricular) circunda o coração separando os átrios dos ventrículos e aloja a artéria coronária direita, a circunflexa e o seio coronário. Os sulcos interventriculares anterior e posterior marcam o septo entre os ventrículos e contêm os ramos interventriculares (descendente anterior e posterior).',
        ],
      },
      {
        titulo: 'Aurículas e ápice',
        paragrafos: [
          'As aurículas direita e esquerda — expansões dos átrios — abraçam a raiz dos grandes vasos anteriormente. A margem direita, aguda, é formada pelo átrio direito; a margem esquerda, obtusa, pelo ventrículo esquerdo, que constitui o ápice.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'O reconhecimento dos sulcos permite localizar as artérias coronárias em angiografias e na cirurgia. A aurícula esquerda é sítio frequente de trombos na fibrilação atrial, com risco de embolia sistêmica.',
        ],
      },
    ],
  },
  {
    slug: 'veias-cardiacas',
    titulo: 'Veias cardíacas',
    legenda: 'As veias do coração humano.',
    categoriaId: 'coracao',
    sketchfabId: 'faa6c5b169ec4928bda1f6bf36e0fcb6',
    resumo:
      'Sistema de drenagem venosa do miocárdio, culminando no seio coronário — frequentemente esquecido, mas essencial para procedimentos e para a fisiologia cardíaca.',
    secoes: [
      {
        titulo: 'Drenagem para o seio coronário',
        paragrafos: [
          'A maior parte do sangue venoso do coração converge para o seio coronário, que corre no sulco coronário posterior e desemboca no átrio direito. Seus tributários principais são a veia cardíaca magna (acompanha a interventricular anterior), a veia cardíaca média (interventricular posterior), a veia cardíaca parva e a veia posterior do ventrículo esquerdo.',
        ],
      },
      {
        titulo: 'Vias acessórias',
        paragrafos: [
          'Além do seio coronário, veias cardíacas anteriores drenam a parede anterior do ventrículo direito diretamente no átrio direito, e as minúsculas veias mínimas (de Tebésio) drenam para dentro das câmaras.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'O seio coronário é a via de acesso para o eletrodo do ventrículo esquerdo na terapia de ressincronização cardíaca e para o mapeamento em ablações. A anatomia venosa também define a rota da cardioplegia retrógrada na cirurgia.',
        ],
      },
    ],
  },
  {
    slug: 'coracao-esquerdo-ventriculo-atrio',
    titulo: 'Ventrículo e átrio esquerdos',
    legenda: 'Ventrículo e átrio esquerdos e as artérias adjacentes.',
    categoriaId: 'coracao',
    sketchfabId: 'f2d4a2b2e9114a93ad8635f6a7fb59df',
    resumo:
      'Câmaras esquerdas isoladas com a raiz da aorta, destacando a bomba sistêmica de alta pressão.',
    secoes: [
      {
        titulo: 'Átrio esquerdo',
        paragrafos: [
          'O átrio esquerdo recebe as quatro veias pulmonares e forma a maior parte da base do coração. Sua parede é lisa, exceto na aurícula, trabeculada. Comunica-se com o ventrículo esquerdo pela valva mitral (atrioventricular esquerda), de dois folhetos.',
        ],
      },
      {
        titulo: 'Ventrículo esquerdo',
        paragrafos: [
          'O ventrículo esquerdo tem paredes espessas (2–3 vezes as do direito) para gerar a pressão da circulação sistêmica. Seu interior mostra trabéculas cárneas, dois músculos papilares (anterolateral e posteromedial) e as cordas tendíneas que ancoram os folhetos mitrais. O sangue sai pela via de saída em direção à valva aórtica e à aorta ascendente.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A hipertrofia do ventrículo esquerdo é resposta comum à hipertensão e à estenose aórtica. A disfunção dos músculos papilares — por isquemia, por exemplo — causa insuficiência mitral aguda.',
        ],
      },
    ],
  },
  {
    slug: 'coracao-neonatal-normal',
    titulo: 'Coração neonatal normal',
    legenda: 'Vista externa e anatomia de um coração neonatal normal.',
    categoriaId: 'coracao',
    sketchfabId: '9c0dcc64acd74f0aaa9847736a9a87af',
    resumo:
      'Referência de normalidade do coração do recém-nascido — base indispensável para reconhecer as cardiopatias congênitas.',
    secoes: [
      {
        titulo: 'Transição da circulação fetal',
        paragrafos: [
          'Ao nascimento, a expansão pulmonar reduz a resistência vascular pulmonar e o fechamento do canal arterial e do forame oval separa definitivamente as circulações. O coração neonatal normal serve de gabarito para identificar comunicações e conexões anômalas persistentes.',
        ],
      },
      {
        titulo: 'Proporções das câmaras',
        paragrafos: [
          'No feto, os ventrículos têm espessuras semelhantes porque ambos enfrentam resistências altas. Após o nascimento, o ventrículo esquerdo passa a predominar progressivamente, enquanto o direito se adapta à baixa resistência pulmonar.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'Reconhecer a anatomia normal do recém-nascido é o passo inicial para o diagnóstico da cardiopatia congênita, a categoria mais comum de malformação ao nascimento. Cardiopatias ducto-dependentes descompensam quando o canal arterial se fecha.',
        ],
      },
    ],
  },
  {
    slug: 'coracao-e-pulmoes-normais',
    titulo: 'Coração e pulmões normais',
    legenda: 'Ventrículos, átrios e grandes vasos normais em conjunto com os pulmões.',
    categoriaId: 'coracao',
    sketchfabId: '5c62cd4d4ba04243be1062d2263d3ef0',
    resumo:
      'Coração e pulmões em relação anatômica, mostrando ventrículos, átrios, aorta, cavas, tronco e veias pulmonares. Rótulos numerados em inglês.',
    secoes: [
      {
        titulo: 'Conjunto cardiopulmonar',
        paragrafos: [
          'O modelo integra as duas bombas em série: o coração no mediastino médio e os pulmões nas cavidades pleurais laterais. As artérias pulmonares levam sangue venoso aos pulmões e as veias pulmonares trazem sangue arterializado de volta ao átrio esquerdo.',
        ],
      },
      {
        titulo: 'Hilos e raízes',
        paragrafos: [
          'Cada raiz pulmonar reúne, no hilo, o brônquio principal, a artéria pulmonar, as veias pulmonares e vasos e nervos. A relação entre esses elementos difere entre os lados, o que se reflete na anatomia do hilo direito e esquerdo.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A interdependência cardiopulmonar explica por que doenças pulmonares crônicas sobrecarregam o ventrículo direito (cor pulmonale) e por que a insuficiência ventricular esquerda congestiona os pulmões.',
        ],
      },
    ],
  },
  {
    slug: 'fluxo-sanguineo-no-coracao',
    titulo: 'Fluxo sanguíneo no coração',
    legenda: 'O percurso do sangue através das câmaras cardíacas. Rótulos em inglês.',
    categoriaId: 'coracao',
    sketchfabId: '395666697531489aa445674a133969b9',
    destaque: true,
    resumo:
      'Trajeto do sangue: entrada venosa no átrio direito, ida aos pulmões, retorno oxigenado ao átrio esquerdo e ejeção para a aorta.',
    secoes: [
      {
        titulo: 'Circuito direito (pulmonar)',
        paragrafos: [
          'O sangue pouco oxigenado chega pelas veias cavas ao átrio direito, cruza a valva tricúspide para o ventrículo direito e é ejetado pela valva pulmonar no tronco pulmonar rumo aos pulmões, onde ocorre a hematose.',
        ],
      },
      {
        titulo: 'Circuito esquerdo (sistêmico)',
        paragrafos: [
          'Oxigenado, o sangue retorna pelas veias pulmonares ao átrio esquerdo, passa pela valva mitral para o ventrículo esquerdo e é bombeado pela valva aórtica para a aorta, distribuindo-se por todo o corpo.',
        ],
      },
      {
        titulo: 'Papel das valvas',
        paragrafos: [
          'As quatro valvas garantem o fluxo unidirecional: as atrioventriculares (tricúspide e mitral) impedem o refluxo durante a sístole, e as semilunares (pulmonar e aórtica) impedem o retorno durante a diástole. As bulhas cardíacas correspondem ao fechamento dessas valvas.',
        ],
      },
    ],
  },
  {
    slug: 'sistema-de-conducao-cardiaca',
    titulo: 'Sistema de condução cardíaca',
    legenda: 'Principais componentes do sistema de condução do coração. Rótulos numerados em inglês.',
    categoriaId: 'coracao',
    sketchfabId: '20a5e36391474f2b99e1a4c94c707b47',
    destaque: true,
    resumo:
      'Nó sinoatrial, nó atrioventricular, feixe de His, ramos e fibras de Purkinje — a rede que dispara e coordena cada batimento.',
    secoes: [
      {
        titulo: 'Marca-passo e retardo nodal',
        paragrafos: [
          'O nó sinoatrial (SA), na parede do átrio direito junto à desembocadura da veia cava superior, é o marca-passo fisiológico. O impulso propaga-se pelos átrios até o nó atrioventricular (AV), no assoalho do átrio direito, onde sofre um retardo que permite o enchimento ventricular antes da sístole.',
        ],
      },
      {
        titulo: 'Feixe de His e Purkinje',
        paragrafos: [
          'Do nó AV, o feixe de His atravessa o esqueleto fibroso — única ponte elétrica entre átrios e ventrículos — e divide-se nos ramos direito e esquerdo, que se ramificam nas fibras de Purkinje, distribuindo o estímulo ao miocárdio ventricular de forma rápida e sincronizada, do ápice para a base.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'Lesões nesse sistema produzem bloqueios: a interrupção no feixe ou nos ramos gera bloqueios de ramo ou atrioventriculares, por vezes exigindo marca-passo. A disfunção do nó SA causa bradiarritmias, e reentradas no nó AV geram taquicardias supraventriculares.',
        ],
      },
    ],
  },

  /* ===================== CIRCULAÇÃO CORONÁRIA & DOMINÂNCIA ===================== */
  {
    slug: 'arterias-coronarias',
    titulo: 'Artérias coronárias do coração',
    legenda: 'As artérias coronárias do coração humano.',
    categoriaId: 'coronarias',
    sketchfabId: '00b5f4ec0b984325b453f8df07cd0cb5',
    destaque: true,
    resumo:
      'As duas coronárias e seus ramos principais, responsáveis por irrigar todo o miocárdio a partir da raiz da aorta.',
    secoes: [
      {
        titulo: 'Origem e ramos principais',
        paragrafos: [
          'As coronárias direita e esquerda nascem dos seios aórticos, logo acima da valva aórtica. A coronária esquerda bifurca-se em ramo interventricular anterior (descendente anterior) — que irriga a parede anterior e o septo — e ramo circunflexo, que contorna a margem esquerda. A coronária direita percorre o sulco coronário direito e origina o ramo marginal direito.',
        ],
      },
      {
        titulo: 'Territórios de irrigação',
        paragrafos: [
          'A descendente anterior nutre a maior parte do ventrículo esquerdo e do septo anterior; a circunflexa, a parede lateral e posterior esquerda; e a coronária direita, o ventrículo direito, a face inferior e boa parte do sistema de condução (nós SA e AV na maioria das pessoas).',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A oclusão de cada artéria produz um padrão previsível de infarto: a descendente anterior (a "viúva") causa infartos anteriores extensos; a coronária direita, infartos inferiores com bradiarritmias. As coronárias são funcionalmente terminais, com anastomoses insuficientes para compensar oclusões agudas.',
        ],
      },
    ],
  },
  {
    slug: 'suprimento-coronario-aos-ventriculos',
    titulo: 'Suprimento sanguíneo dos ventrículos pelas coronárias',
    legenda: 'Como as artérias coronárias irrigam os ventrículos.',
    categoriaId: 'coronarias',
    sketchfabId: '60e1da3fbef542c6bcf61cdac312ce4f',
    resumo:
      'Distribuição do fluxo coronário pela musculatura ventricular, evidenciando quais artérias nutrem cada parede.',
    secoes: [
      {
        titulo: 'Fluxo predominante na diástole',
        paragrafos: [
          'Diferentemente da maioria dos leitos, o miocárdio ventricular esquerdo é perfundido sobretudo na diástole, pois durante a sístole a contração comprime os vasos intramurais. Frequências muito altas encurtam a diástole e reduzem a reserva coronária.',
        ],
      },
      {
        titulo: 'Gradiente subendocárdico',
        paragrafos: [
          'As camadas subendocárdicas, mais distantes da origem epicárdica dos vasos e submetidas a maior tensão de parede, são as mais vulneráveis à isquemia — motivo pelo qual o infarto costuma começar no subendocárdio.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A relação entre demanda (frequência, contratilidade, tensão de parede) e oferta (pressão diastólica, calibre coronário) define a angina. Compreender o suprimento ventricular fundamenta a interpretação do teste ergométrico e da revascularização.',
        ],
      },
    ],
  },
  {
    slug: 'coracao-codominancia',
    titulo: 'Coração com codominância coronária',
    legenda: 'Padrão de codominância entre as coronárias.',
    categoriaId: 'coronarias',
    sketchfabId: '42d07ac1517748ea82bb05b0a362b298',
    resumo:
      'Variante em que direita e circunflexa compartilham a irrigação da face inferior, um dos três padrões de dominância coronária.',
    secoes: [
      {
        titulo: 'O que define a dominância',
        paragrafos: [
          'A dominância coronária é determinada pela artéria que origina o ramo interventricular posterior (descendente posterior) e irriga a face inferior e o nó AV. Na codominância, tanto a coronária direita quanto a circunflexa contribuem para esse território.',
        ],
      },
      {
        titulo: 'Implicações',
        paragrafos: [
          'Na codominância (cerca de 5–10% das pessoas), a parede inferior recebe suprimento duplo, o que altera a interpretação de qual artéria é responsável por um infarto inferior e influencia o planejamento de revascularização.',
        ],
      },
    ],
  },
  {
    slug: 'coracao-dominancia-esquerda',
    titulo: 'Coração com dominância esquerda',
    legenda: 'Padrão de dominância coronária esquerda.',
    categoriaId: 'coronarias',
    sketchfabId: '5c10cea34fd54b5eb9e3d0ecc8ab0da2',
    resumo:
      'Variante (cerca de 10%) em que a circunflexa origina a descendente posterior e irriga a face inferior e o nó AV.',
    secoes: [
      {
        titulo: 'Anatomia da dominância esquerda',
        paragrafos: [
          'Aqui o ramo interventricular posterior nasce da artéria circunflexa (coronária esquerda). Assim, a coronária esquerda irriga praticamente todo o ventrículo esquerdo e o septo, e ainda a face inferior e o nó AV.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A dominância esquerda concentra maior massa miocárdica na dependência de uma única árvore arterial: uma lesão proximal na coronária esquerda pode comprometer território muito extenso, com pior prognóstico.',
        ],
      },
    ],
  },
  {
    slug: 'coracao-dominancia-direita',
    titulo: 'Coração com dominância direita',
    legenda: 'Padrão de dominância coronária direita.',
    categoriaId: 'coronarias',
    sketchfabId: '89ad76f1e61847e6b4b0af215bb237dc',
    resumo:
      'O padrão mais comum (cerca de 80%): a coronária direita origina a descendente posterior e nutre a face inferior e o nó AV.',
    secoes: [
      {
        titulo: 'Anatomia da dominância direita',
        paragrafos: [
          'Na maioria das pessoas, a coronária direita cruza a crux cordis e origina o ramo interventricular posterior, irrigando a face inferior do coração e o nó atrioventricular.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'Por isso, o infarto inferior por oclusão da coronária direita associa-se frequentemente a bradicardia e bloqueio AV. O reconhecimento do padrão dominante orienta a leitura da coronariografia.',
        ],
      },
    ],
  },
  {
    slug: 'sistema-conducao-e-coronarias',
    titulo: 'Sistema de condução e artérias coronárias',
    legenda: 'Relação entre o sistema de condução e as artérias coronárias.',
    categoriaId: 'coronarias',
    sketchfabId: 'f314c85abb6a481592ffa5dd973ca0c0',
    resumo:
      'Sobreposição do sistema de condução com a irrigação coronária, explicando por que certos infartos causam arritmias específicas.',
    secoes: [
      {
        titulo: 'Irrigação dos nós',
        paragrafos: [
          'Na maioria das pessoas, a coronária direita irriga tanto o nó sinoatrial quanto o nó atrioventricular. Assim, sua obstrução compromete simultaneamente marca-passo e retardo nodal.',
        ],
      },
      {
        titulo: 'Correlação isquemia–arritmia',
        paragrafos: [
          'A dependência do sistema de condução em relação à coronária direita explica a associação entre infarto inferior e bradiarritmias/bloqueios AV, ao passo que lesões da descendente anterior tendem a afetar os ramos do feixe de His.',
        ],
      },
    ],
  },

  /* ===================== CARDIOPATIAS CONGÊNITAS ===================== */
  {
    slug: 'comunicacao-interventricular',
    titulo: 'Comunicação interventricular (CIV)',
    legenda: 'Defeito no septo entre os ventrículos.',
    categoriaId: 'congenitas',
    sketchfabId: 'e4e0143741f64025af101658210c8c5d',
    resumo:
      'A cardiopatia congênita isolada mais comum: um orifício no septo interventricular que gera shunt esquerda–direita.',
    secoes: [
      {
        titulo: 'Anatomia do defeito',
        paragrafos: [
          'A CIV é uma falha no septo interventricular, mais frequentemente na porção membranosa (perimembranosa). O tamanho e a localização determinam a repercussão hemodinâmica.',
        ],
      },
      {
        titulo: 'Hemodinâmica',
        paragrafos: [
          'Como a pressão no ventrículo esquerdo é maior, o sangue flui da esquerda para a direita, aumentando o fluxo pulmonar. Defeitos grandes e não tratados podem elevar cronicamente a pressão pulmonar e inverter o shunt (síndrome de Eisenmenger).',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A CIV produz um sopro holossistólico em barra na borda esternal esquerda. Pequenas comunicações costumam fechar espontaneamente; grandes exigem correção cirúrgica ou percutânea.',
        ],
      },
    ],
  },
  {
    slug: 'comunicacao-interatrial',
    titulo: 'Comunicação interatrial (CIA)',
    legenda: 'Defeito no septo entre os átrios.',
    categoriaId: 'congenitas',
    sketchfabId: '3398e00958054779a07554eaffc8b329',
    resumo:
      'Orifício no septo interatrial com shunt esquerda–direita, muitas vezes silencioso até a idade adulta.',
    secoes: [
      {
        titulo: 'Tipos anatômicos',
        paragrafos: [
          'A forma mais comum é a ostium secundum, na região da fossa oval. Existem ainda a ostium primum (baixa, associada a defeitos das valvas AV) e a do seio venoso (junto às cavas, associada a drenagem venosa pulmonar anômala).',
        ],
      },
      {
        titulo: 'Hemodinâmica',
        paragrafos: [
          'O shunt esquerda–direita sobrecarrega o coração direito e o leito pulmonar. A repercussão costuma ser mais lenta que na CIV, o que atrasa o diagnóstico.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A CIA gera desdobramento fixo da segunda bulha e sopro sistólico pulmonar por hiperfluxo. Também permite embolia paradoxal. Muitas são fechadas por dispositivo percutâneo.',
        ],
      },
    ],
  },
  {
    slug: 'defeito-septo-atrioventricular',
    titulo: 'Defeito do septo atrioventricular',
    legenda: 'Defeito combinado dos septos atrial e ventricular.',
    categoriaId: 'congenitas',
    sketchfabId: '27ed828188d8496399cd7393e457be32',
    resumo:
      'Falha central que envolve os septos e as valvas atrioventriculares, fortemente associada à síndrome de Down.',
    secoes: [
      {
        titulo: 'Anatomia do defeito',
        paragrafos: [
          'Resulta da falha de fusão dos coxins endocárdicos, que normalmente formam a porção central do coração. Na forma completa há uma comunicação atrial baixa, uma ventricular alta e uma única valva atrioventricular comum sobre os dois ventrículos.',
        ],
      },
      {
        titulo: 'Hemodinâmica',
        paragrafos: [
          'Coexistem shunts em nível atrial e ventricular, com hiperfluxo pulmonar importante e risco precoce de hipertensão pulmonar. A valva comum costuma ser regurgitante.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'É a cardiopatia mais associada à trissomia do 21. Exige correção cirúrgica na infância, com reconstrução dos septos e separação das valvas atrioventriculares.',
        ],
      },
    ],
  },
  {
    slug: 'defeito-atrioventricular-4-camaras',
    titulo: 'Defeito atrioventricular (vista de 4 câmaras)',
    legenda: 'Corte em quatro câmaras evidenciando o defeito atrioventricular.',
    categoriaId: 'congenitas',
    sketchfabId: 'd899d6e674054c3bb265f9cd687fd967',
    resumo:
      'Mesma malformação vista no plano ecocardiográfico de quatro câmaras, o corte de escolha para diagnosticá-la.',
    secoes: [
      {
        titulo: 'O corte de 4 câmaras',
        paragrafos: [
          'A vista de quatro câmaras alinha simultaneamente os dois átrios, os dois ventrículos e a "cruz" do coração, formada pelo encontro dos septos com as valvas atrioventriculares. É o plano ideal para demonstrar o defeito central.',
        ],
      },
      {
        titulo: 'Perda da cruz do coração',
        paragrafos: [
          'No defeito atrioventricular, a nítida cruz desaparece: as valvas inserem-se no mesmo nível e há continuidade entre as comunicações atrial e ventricular, aspecto que sela o diagnóstico à ecocardiografia fetal ou neonatal.',
        ],
      },
    ],
  },
  {
    slug: 'conexao-anomala-parcial-veias-pulmonares',
    titulo: 'Conexão anômala parcial das veias pulmonares',
    legenda: 'Defeito congênito raro no retorno venoso pulmonar.',
    categoriaId: 'congenitas',
    sketchfabId: 'd4124af6ebc746ab957a986018297c45',
    resumo:
      'Uma ou mais veias pulmonares drenam no lado direito do coração em vez do átrio esquerdo, criando shunt esquerda–direita.',
    secoes: [
      {
        titulo: 'Anatomia do defeito',
        paragrafos: [
          'Parte das veias pulmonares conecta-se ao átrio direito ou a veias sistêmicas (cava superior, seio coronário). Associa-se com frequência à comunicação interatrial do tipo seio venoso.',
        ],
      },
      {
        titulo: 'Hemodinâmica e clínica',
        paragrafos: [
          'O sangue oxigenado que retorna ao coração direito representa um shunt esquerda–direita, sobrecarregando o circuito pulmonar. A repercussão depende de quantas veias estão envolvidas; casos significativos exigem correção cirúrgica.',
        ],
      },
    ],
  },
  {
    slug: 'coartacao-da-aorta',
    titulo: 'Coartação da aorta',
    legenda: 'Estreitamento congênito da aorta.',
    categoriaId: 'congenitas',
    sketchfabId: 'a2e1447abe49490b95c9dd193c78eefb',
    resumo:
      'Estreitamento localizado da aorta, tipicamente junto ao istmo, que impõe hipertensão nos membros superiores e hipofluxo nos inferiores.',
    secoes: [
      {
        titulo: 'Localização',
        paragrafos: [
          'A coartação situa-se em geral no istmo aórtico, próximo à inserção do canal arterial, distal à artéria subclávia esquerda. Pode ser pré ou pós-ductal.',
        ],
      },
      {
        titulo: 'Consequências hemodinâmicas',
        paragrafos: [
          'A obstrução eleva a pressão a montante (membros superiores, cabeça) e reduz o fluxo a jusante (abdome e membros inferiores). Desenvolve-se circulação colateral pelas artérias intercostais, que pode erodir as costelas.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'Clássicos são a hipertensão em membros superiores com pulsos femorais fracos e retardados e as incisuras costais na radiografia. Casos graves no recém-nascido são ducto-dependentes.',
        ],
      },
    ],
  },
  {
    slug: 'coartacao-da-aorta-corrigida',
    titulo: 'Coartação da aorta corrigida',
    legenda: 'Aorta após a correção cirúrgica do estreitamento.',
    categoriaId: 'congenitas',
    sketchfabId: 'b19c8ec599584697884d235ff34def27',
    resumo:
      'Resultado anatômico após a reparação do segmento estreitado, restabelecendo o calibre da aorta.',
    secoes: [
      {
        titulo: 'Estratégias de correção',
        paragrafos: [
          'A correção pode ser feita por ressecção do segmento com anastomose término-terminal, aortoplastia com retalho ou angioplastia com balão e stent, dependendo da idade e da anatomia.',
        ],
      },
      {
        titulo: 'Seguimento',
        paragrafos: [
          'Mesmo após correção bem-sucedida, há risco de recoartação, aneurisma no sítio de reparo e hipertensão residual, o que exige acompanhamento por imagem a longo prazo.',
        ],
      },
    ],
  },
  {
    slug: 'transposicao-grandes-arterias',
    titulo: 'Transposição das grandes artérias',
    legenda: 'As duas artérias principais trocadas de posição.',
    categoriaId: 'congenitas',
    sketchfabId: 'ee41d9d7c8854a98aa67feeeaf430584',
    resumo:
      'A aorta sai do ventrículo direito e o tronco pulmonar do esquerdo — dois circuitos em paralelo, incompatíveis com a vida sem uma mistura.',
    secoes: [
      {
        titulo: 'Discordância ventriculoarterial',
        paragrafos: [
          'Na transposição, a aorta emerge do ventrículo direito e o tronco pulmonar do ventrículo esquerdo. O sangue sistêmico volta ao corpo sem passar pelos pulmões e o pulmonar recircula pelos pulmões — dois circuitos independentes.',
        ],
      },
      {
        titulo: 'Dependência de misturas',
        paragrafos: [
          'A sobrevida depende de comunicações que misturem o sangue: forame oval, canal arterial ou CIV. O fechamento do canal arterial precipita cianose grave no recém-nascido.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'É uma causa importante de cianose neonatal. O manejo inclui manter o canal aberto com prostaglandina, atriosseptostomia e a cirurgia de troca arterial (switch) definitiva.',
        ],
      },
    ],
  },
  {
    slug: 'transposicao-eixo-longo',
    titulo: 'Transposição — corte no eixo longo',
    legenda: 'Corte no plano do eixo longo em coração com transposição das grandes artérias.',
    categoriaId: 'congenitas',
    sketchfabId: 'f7c8acca3614485499af11a01e52f89d',
    resumo:
      'Transposição demonstrada no plano paraesternal de eixo longo, evidenciando a relação anômala das grandes artérias.',
    secoes: [
      {
        titulo: 'Achado no eixo longo',
        paragrafos: [
          'No eixo longo, os grandes vasos deixam de se cruzar e emergem em paralelo, com a aorta anterior originando-se do ventrículo direito — sinal-chave da discordância ventriculoarterial.',
        ],
      },
      {
        titulo: 'Valor do plano de corte',
        paragrafos: [
          'Correlacionar o modelo tridimensional com o plano ecocardiográfico treina o raciocínio espacial necessário para interpretar as janelas do ecocardiograma na prática.',
        ],
      },
    ],
  },
  {
    slug: 'transposicao-valva-aortica-eixo-curto',
    titulo: 'Transposição — valva aórtica no eixo curto',
    legenda: 'Corte no plano curto da valva aórtica em coração com transposição.',
    categoriaId: 'congenitas',
    sketchfabId: 'd4408616f1f24b1882ad338a572fa557',
    resumo:
      'A relação das grandes artérias vista no eixo curto ao nível da valva aórtica, com aorta e pulmonar lado a lado.',
    secoes: [
      {
        titulo: 'Relação das grandes artérias',
        paragrafos: [
          'No coração normal, o eixo curto mostra a aorta central circundada pela via de saída direita. Na transposição, aorta e tronco pulmonar aparecem lado a lado (aspecto de "olhos de coruja"), com a aorta habitualmente anterior e à direita.',
        ],
      },
      {
        titulo: 'Origem das coronárias',
        paragrafos: [
          'Esse plano é decisivo para mapear a origem das coronárias, informação crítica para o planejamento da cirurgia de troca arterial.',
        ],
      },
    ],
  },
  {
    slug: 'transposicao-corrigida-cirurgicamente',
    titulo: 'Transposição após correção cirúrgica',
    legenda: 'Coração após a correção da transposição das grandes artérias.',
    categoriaId: 'congenitas',
    sketchfabId: '57423ea25d304a1ab0da376e7f041be8',
    resumo:
      'Anatomia resultante da cirurgia de troca arterial, com os grandes vasos e as coronárias reposicionados.',
    secoes: [
      {
        titulo: 'A cirurgia de troca arterial',
        paragrafos: [
          'No switch arterial, a aorta e o tronco pulmonar são seccionados e reanastomosados aos ventrículos corretos, e as artérias coronárias são reimplantadas na neoaorta. Restabelece-se a concordância entre ventrículos e grandes vasos.',
        ],
      },
      {
        titulo: 'Seguimento',
        paragrafos: [
          'O acompanhamento vigia estenoses nas linhas de sutura (sobretudo na neopulmonar) e a perviedade das coronárias reimplantadas, determinantes do prognóstico a longo prazo.',
        ],
      },
    ],
  },
  {
    slug: 'transposicao-com-ducto-aberto',
    titulo: 'Transposição com canal arterial patente',
    legenda: 'Transposição das grandes artérias com canal arterial pérvio.',
    categoriaId: 'congenitas',
    sketchfabId: 'cf8e87888ae544d59131662aca6c96b2',
    resumo:
      'Transposição em que o canal arterial permanece aberto, oferecendo a mistura sanguínea que mantém o recém-nascido vivo.',
    secoes: [
      {
        titulo: 'O papel do canal arterial',
        paragrafos: [
          'Com circuitos em paralelo, o canal arterial pérvio permite a mistura entre sangue sistêmico e pulmonar, sustentando alguma oxigenação até a intervenção.',
        ],
      },
      {
        titulo: 'Manejo',
        paragrafos: [
          'A prostaglandina E1 mantém o canal aberto enquanto se prepara a atriosseptostomia e a correção definitiva. O fechamento espontâneo do canal é uma emergência.',
        ],
      },
    ],
  },
  {
    slug: 'tronco-arterial-comum',
    titulo: 'Tronco arterial comum',
    legenda: 'Doença congênita rara com um único tronco arterial.',
    categoriaId: 'congenitas',
    sketchfabId: '8547abf2bbd941b28ab630a62e21955b',
    resumo:
      'Um único vaso arterial deixa o coração e dá origem à aorta, às pulmonares e às coronárias, quase sempre sobre uma CIV.',
    secoes: [
      {
        titulo: 'Anatomia do defeito',
        paragrafos: [
          'Falha na septação do tronco arterial embrionário resulta em um vaso único, com uma valva truncal, cavalgando uma comunicação interventricular. Dele partem a circulação sistêmica, a pulmonar e a coronária.',
        ],
      },
      {
        titulo: 'Hemodinâmica',
        paragrafos: [
          'Há mistura obrigatória de sangue e hiperfluxo pulmonar precoce, com cianose leve e insuficiência cardíaca nas primeiras semanas, evoluindo rapidamente para doença vascular pulmonar sem correção.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'Associa-se à deleção 22q11 (síndrome de DiGeorge). Requer correção cirúrgica precoce, com fechamento da CIV e conexão do ventrículo direito às artérias pulmonares por conduto.',
        ],
      },
    ],
  },
  {
    slug: 'atresia-tricuspide-fontan-unilateral',
    titulo: 'Atresia tricúspide (correção de Fontan unilateral)',
    legenda: 'Atresia da valva tricúspide com correção unilateral.',
    categoriaId: 'congenitas',
    sketchfabId: '5d25e5608a7b4bb2a15ea842cdb5b01d',
    resumo:
      'Ausência da valva tricúspide (coração univentricular funcional) tratada pela circulação de Fontan.',
    secoes: [
      {
        titulo: 'Anatomia da atresia tricúspide',
        paragrafos: [
          'Sem valva tricúspide, não há comunicação direta entre átrio e ventrículo direitos; o ventrículo direito é hipoplásico. A sobrevida depende de uma CIA (para o sangue deixar o átrio direito) e de uma CIV ou canal (para chegar aos pulmões).',
        ],
      },
      {
        titulo: 'A circulação de Fontan',
        paragrafos: [
          'A paliação de Fontan direciona o retorno venoso sistêmico diretamente às artérias pulmonares, contornando o ventrículo direito ausente, de modo que o único ventrículo funcional sustente a circulação sistêmica.',
        ],
      },
    ],
  },
  {
    slug: 'atresia-tricuspide-fontan-bilateral',
    titulo: 'Atresia tricúspide (correção de Fontan bilateral)',
    legenda: 'Atresia da valva tricúspide com correção bilateral.',
    categoriaId: 'congenitas',
    sketchfabId: 'fceaf8b48d6b43fbb6dd78d189a120e4',
    resumo:
      'Mesma malformação com uma variante de conexão cavopulmonar bilateral, usada quando há veia cava superior esquerda persistente.',
    secoes: [
      {
        titulo: 'Conexão cavopulmonar bilateral',
        paragrafos: [
          'Quando existe veia cava superior esquerda persistente, as duas cavas superiores são anastomosadas às respectivas artérias pulmonares (Glenn bilateral), integrando-se depois à circulação de Fontan.',
        ],
      },
      {
        titulo: 'Fisiologia de Fontan',
        paragrafos: [
          'Sem uma bomba subpulmonar, o fluxo aos pulmões é passivo e depende de baixa resistência pulmonar e boa função do ventrículo único — princípios que explicam as complicações tardias de Fontan.',
        ],
      },
    ],
  },
  {
    slug: 'tetralogia-de-fallot',
    titulo: 'Tetralogia de Fallot',
    legenda: 'Coração com tetralogia de Fallot.',
    categoriaId: 'congenitas',
    sketchfabId: '00c9b0e352a84e9c9efdae1269ac5302',
    resumo:
      'A cardiopatia congênita cianótica mais comum, definida por quatro achados que decorrem de um único desvio do septo infundibular.',
    secoes: [
      {
        titulo: 'Os quatro componentes',
        paragrafos: [
          'A tétrade reúne estenose pulmonar (obstrução da via de saída direita), comunicação interventricular, aorta cavalgando o septo e hipertrofia do ventrículo direito. Todos derivam do desvio anterossuperior do septo conal.',
        ],
      },
      {
        titulo: 'Hemodinâmica',
        paragrafos: [
          'A obstrução direita associada à CIV gera shunt direita–esquerda e cianose. A intensidade depende do grau de estenose pulmonar; espasmos infundibulares provocam as crises hipoxêmicas ("tet spells").',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A radiografia mostra o clássico coração "em bota". As crianças adotam a posição de cócoras para aliviar a cianose. O tratamento é a correção cirúrgica completa na infância.',
        ],
      },
    ],
  },
  {
    slug: 'tetralogia-de-fallot-eixo-longo',
    titulo: 'Tetralogia de Fallot — eixo longo paraesternal',
    legenda: 'Corte ecográfico paraesternal de eixo longo na tetralogia de Fallot.',
    categoriaId: 'congenitas',
    sketchfabId: 'f1c72fb9919c40d5bb2856e22e5a6943',
    resumo:
      'Plano paraesternal de eixo longo evidenciando a aorta cavalgando a comunicação interventricular.',
    secoes: [
      {
        titulo: 'Achados no eixo longo',
        paragrafos: [
          'Nesse corte, veem-se com clareza a grande CIV subaórtica e a aorta dilatada montada a cavaleiro sobre o septo interventricular, recebendo sangue dos dois ventrículos.',
        ],
      },
      {
        titulo: 'Correlação por imagem',
        paragrafos: [
          'A cavalgadura aórtica e a descontinuidade septoaórtica são sinais diretos ao ecocardiograma. O modelo ajuda a traduzir esses achados bidimensionais na anatomia tridimensional real.',
        ],
      },
    ],
  },

  /* ===================== PULMÕES & VIAS AÉREAS ===================== */
  {
    slug: 'pulmoes-normais',
    titulo: 'Pulmões',
    legenda: 'Anatomia dos pulmões normais.',
    categoriaId: 'pulmoes',
    sketchfabId: '79149850d98842f981a1c60e7498413b',
    destaque: true,
    resumo:
      'Os dois pulmões com seus lobos e fissuras — o órgão da hematose, alojado nas cavidades pleurais.',
    secoes: [
      {
        titulo: 'Lobos e fissuras',
        paragrafos: [
          'O pulmão direito tem três lobos (superior, médio e inferior), separados pelas fissuras oblíqua e horizontal; o esquerdo tem dois (superior e inferior) separados pela fissura oblíqua, com a língula e a incisura cardíaca acomodando o coração.',
        ],
      },
      {
        titulo: 'Hilo e raiz',
        paragrafos: [
          'No hilo entram e saem os elementos da raiz pulmonar: brônquio principal, artéria pulmonar, veias pulmonares, vasos brônquicos, linfáticos e nervos. A disposição desses elementos difere entre os lados.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A anatomia lobar e segmentar orienta a localização de pneumonias, atelectasias e tumores e fundamenta as ressecções (lobectomia, segmentectomia). As fissuras delimitam derrames e a propagação de doenças.',
        ],
      },
    ],
  },
  {
    slug: 'traqueia-e-bronquios',
    titulo: 'Traqueia e brônquios',
    legenda: 'Anatomia da traqueia e da árvore brônquica.',
    categoriaId: 'pulmoes',
    sketchfabId: 'ec147b3fe06a41689711710024c1342a',
    resumo:
      'Via aérea condutora, da traqueia à ramificação brônquica — o caminho do ar até os alvéolos.',
    secoes: [
      {
        titulo: 'Traqueia',
        paragrafos: [
          'A traqueia estende-se da laringe (C6) até a carina (nível do ângulo do esterno, T4/T5), sustentada por anéis cartilaginosos em forma de C, abertos posteriormente, onde o músculo traqueal se apoia sobre o esôfago.',
        ],
      },
      {
        titulo: 'Brônquios principais',
        paragrafos: [
          'O brônquio principal direito é mais curto, largo e vertical que o esquerdo; por isso corpos estranhos aspirados alojam-se preferencialmente à direita. Cada brônquio principal divide-se em lobares e segmentares, seguindo a organização dos pulmões.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A carina é referência anatômica na broncoscopia e na conferência da profundidade do tubo endotraqueal — introduzido demais, tende a entrar no brônquio direito, ventilando apenas um pulmão.',
        ],
      },
    ],
  },
  {
    slug: 'vias-aereas-pulmoes-transparentes',
    titulo: 'Vias aéreas com pulmões transparentes',
    legenda: 'Árvore aérea evidenciada com o parênquima pulmonar transparente.',
    categoriaId: 'pulmoes',
    sketchfabId: 'ad7d7e16b98f421db0cda79f265fcc8d',
    resumo:
      'A árvore traqueobrônquica destacada dentro de pulmões translúcidos, revelando a distribuição segmentar do ar.',
    secoes: [
      {
        titulo: 'Distribuição segmentar',
        paragrafos: [
          'Com o parênquima transparente, percebe-se como cada brônquio segmentar ventila um segmento broncopulmonar — unidade funcional e cirúrgica com irrigação e drenagem próprias.',
        ],
      },
      {
        titulo: 'Aplicação',
        paragrafos: [
          'Essa visão ajuda a compreender a drenagem postural, a broncoscopia e a lógica das ressecções segmentares que poupam parênquima sadio.',
        ],
      },
    ],
  },
  {
    slug: 'vias-aereas-pulmoes-opacos',
    titulo: 'Vias aéreas com pulmões opacos',
    legenda: 'Árvore aérea dentro do parênquima pulmonar opaco.',
    categoriaId: 'pulmoes',
    sketchfabId: '1cd55d26c1254ab7a5d0845fb9a207fe',
    resumo:
      'Complemento do modelo transparente: mostra a superfície externa dos pulmões que envolve a mesma árvore aérea.',
    secoes: [
      {
        titulo: 'Superfície e contorno',
        paragrafos: [
          'Com os pulmões opacos, evidenciam-se as impressões dos órgãos vizinhos e o contorno lobar externo, complementando a visão interna da árvore brônquica.',
        ],
      },
      {
        titulo: 'Correlação',
        paragrafos: [
          'Alternar entre as versões opaca e transparente treina a correlação entre a superfície pulmonar e a árvore aérea subjacente, útil na interpretação da tomografia de tórax.',
        ],
      },
    ],
  },
  {
    slug: 'anatomia-da-laringe',
    titulo: 'Anatomia da laringe',
    legenda: 'A anatomia da laringe. Rótulos numerados em inglês.',
    categoriaId: 'pulmoes',
    sketchfabId: 'a00bc73a303c46248db6a13a88b23404',
    resumo:
      'Esqueleto cartilaginoso da laringe — órgão da fonação e esfíncter que protege a via aérea inferior.',
    secoes: [
      {
        titulo: 'Cartilagens',
        paragrafos: [
          'A laringe é sustentada por cartilagens: a tireóidea (com a proeminência laríngea), a cricóidea (único anel completo), a epiglote e os pares aritenóideas, corniculadas e cuneiformes. A membrana cricotireóidea, entre a tireóidea e a cricóidea, é o sítio da cricotireoidostomia de emergência.',
        ],
      },
      {
        titulo: 'Pregas vocais e inervação',
        paragrafos: [
          'As pregas vocais estendem-se das aritenóideas à tireóidea. O nervo laríngeo recorrente inerva todos os músculos intrínsecos (exceto o cricotireóideo, pelo laríngeo superior) e a mucosa infraglótica — sua lesão causa rouquidão ou obstrução.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'O trajeto longo do laríngeo recorrente esquerdo (contorna o arco aórtico) o expõe a compressões torácicas e a lesões na cirurgia de tireoide. A cricóide, por ser anel completo, é usada na manobra de Sellick.',
        ],
      },
    ],
  },

  /* ===================== NEUROANATOMIA & CABEÇA/PESCOÇO ===================== */
  {
    slug: 'nervos-cranianos',
    titulo: 'Nervos cranianos',
    legenda: 'Pontos de saída dos 12 nervos cranianos, com origem, função e tipo.',
    categoriaId: 'neuro',
    sketchfabId: '82d87cb89d6c48f0984a59c4f2a4cf9a',
    destaque: true,
    resumo:
      'Encéfalo com os doze pares cranianos e seus forames de saída — mapa essencial da neuroanatomia clínica.',
    secoes: [
      {
        titulo: 'Os doze pares',
        paragrafos: [
          'Numerados de I a XII no sentido rostrocaudal: olfatório (I), óptico (II), oculomotor (III), troclear (IV), trigêmeo (V), abducente (VI), facial (VII), vestibulococlear (VIII), glossofaríngeo (IX), vago (X), acessório (XI) e hipoglosso (XII). Emergem do encéfalo em pontos característicos, do prosencéfalo ao bulbo.',
        ],
      },
      {
        titulo: 'Componentes funcionais',
        paragrafos: [
          'Há nervos puramente sensitivos (I, II, VIII), puramente motores (III, IV, VI, XI, XII) e mistos (V, VII, IX, X). Vários carregam fibras parassimpáticas (III, VII, IX, X) para pupila, glândulas e vísceras.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'Cada nervo atravessa forames específicos da base do crânio; conhecer esses trajetos permite localizar lesões — por exemplo, síndromes do seio cavernoso (III, IV, V1, V2, VI) ou do ângulo pontocerebelar (VII, VIII). O exame dos pares cranianos é pilar do exame neurológico.',
        ],
      },
    ],
  },
  {
    slug: 'musculatura-cabeca-e-pescoco',
    titulo: 'Musculatura da cabeça e do pescoço',
    legenda: 'Écorché anatômico da cabeça e do pescoço.',
    categoriaId: 'neuro',
    sketchfabId: 'a2cff87ffd2f4dad822919d5e1818d56',
    resumo:
      'Dissecção em écorché exibindo os músculos superficiais e profundos da face e do pescoço.',
    secoes: [
      {
        titulo: 'Músculos da mímica e mastigação',
        paragrafos: [
          'Os músculos da expressão facial, inervados pelo nervo facial (VII), inserem-se na pele e movem os lábios, as pálpebras e a testa. Os músculos da mastigação (masseter, temporal, pterigóideos), inervados pelo trigêmeo (V3), movem a mandíbula.',
        ],
      },
      {
        titulo: 'Trígonos do pescoço',
        paragrafos: [
          'O esternocleidomastóideo divide o pescoço nos trígonos anterior e posterior, referências para localizar vasos (carótida, jugular), nervos e linfonodos. Os músculos infra e supra-hióideos posicionam a laringe e o osso hioide.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A paralisia do facial (Bell) apaga as rugas e desvia a boca; o torcicolo envolve o esternocleidomastóideo. O conhecimento das camadas musculares orienta acessos cirúrgicos e a interpretação de imagens cervicais.',
        ],
      },
    ],
  },
  {
    slug: 'cerebro-vista-inferior',
    titulo: 'Vista inferior do cérebro',
    legenda: 'Vista inferior de um cérebro normal, de autópsia (fotogrametria).',
    categoriaId: 'neuro',
    sketchfabId: '0de8a436e4c4411a903e35267ba1d254',
    resumo:
      'Face basal do encéfalo, onde emergem a maioria dos nervos cranianos e se dispõe o polígono arterial.',
    secoes: [
      {
        titulo: 'Estruturas da base',
        paragrafos: [
          'Na face inferior identificam-se os bulbos e tratos olfatórios, o quiasma óptico, a haste hipofisária, os corpos mamilares, a ponte, o bulbo e os lobos temporais. É por aqui que a maioria dos nervos cranianos deixa o encéfalo.',
        ],
      },
      {
        titulo: 'Círculo arterial do cérebro',
        paragrafos: [
          'A base aloja o círculo arterial (polígono de Willis), anastomose entre as circulações carotídea e vertebrobasilar que oferece rotas colaterais e é sítio frequente de aneurismas saculares.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'Tumores da base (como o adenoma hipofisário sobre o quiasma, causando hemianopsia bitemporal) e aneurismas do polígono manifestam-se por acometimento das estruturas aqui reunidas.',
        ],
      },
    ],
  },
  {
    slug: 'ventriculos-do-cerebro',
    titulo: 'Ventrículos do cérebro',
    legenda: 'Os ventrículos do cérebro e as estruturas adjacentes.',
    categoriaId: 'neuro',
    sketchfabId: 'a5c44ec4384a423f8df9c17d3dab43fc',
    resumo:
      'Sistema ventricular — as cavidades onde o líquor é produzido e circula dentro do encéfalo.',
    secoes: [
      {
        titulo: 'O sistema ventricular',
        paragrafos: [
          'Compõe-se dos dois ventrículos laterais, do terceiro ventrículo (entre os tálamos) e do quarto (entre a ponte/bulbo e o cerebelo). Comunicam-se pelos forames interventriculares (de Monro) e pelo aqueduto do mesencéfalo (de Sylvius).',
        ],
      },
      {
        titulo: 'Circulação do líquor',
        paragrafos: [
          'O plexo coróideo produz o líquido cerebrospinal, que flui dos ventrículos laterais ao quarto ventrículo e alcança o espaço subaracnóideo pelos forames de Luschka e Magendie, sendo reabsorvido nas granulações aracnóideas.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A obstrução do fluxo causa hidrocefalia. O aqueduto do mesencéfalo, estreito, é ponto crítico de bloqueio. A morfologia ventricular é referência em neuroimagem e na derivação ventricular.',
        ],
      },
    ],
  },
  {
    slug: 'regioes-do-cerebro',
    titulo: 'Regiões do cérebro',
    legenda: 'Destaque das diferentes regiões do cérebro.',
    categoriaId: 'neuro',
    sketchfabId: 'b2aac93ee4c440ed911f5765158edc9f',
    resumo:
      'Lobos e principais áreas funcionais do córtex, base para localizar sintomas neurológicos.',
    secoes: [
      {
        titulo: 'Lobos cerebrais',
        paragrafos: [
          'O córtex divide-se em lobos frontal (motricidade, funções executivas, área de Broca), parietal (somestesia), temporal (audição, memória, área de Wernicke), occipital (visão) e a ínsula, profunda ao sulco lateral.',
        ],
      },
      {
        titulo: 'Áreas funcionais',
        paragrafos: [
          'O giro pré-central abriga o córtex motor primário e o pós-central, o somatossensitivo, ambos organizados somatotopicamente (homúnculo). As áreas da linguagem localizam-se no hemisfério dominante.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A localização das funções permite deduzir o sítio da lesão a partir do déficit: afasia de Broca (frontal), afasia de Wernicke (temporal), hemianopsia (occipital), negligência (parietal direito).',
        ],
      },
    ],
  },

  /* ===================== SISTEMA LINFÁTICO ===================== */
  {
    slug: 'sistema-linfatico',
    titulo: 'Sistema linfático',
    legenda: 'Visão geral do sistema linfático humano.',
    categoriaId: 'linfatico',
    sketchfabId: '14800d739ecb46678d7584a401b0aa77',
    resumo:
      'Rede de vasos e linfonodos que drena a linfa de volta ao sangue, mostrada com esqueleto e vasos de referência.',
    secoes: [
      {
        titulo: 'Organização geral',
        paragrafos: [
          'Os capilares linfáticos recolhem o líquido intersticial e o conduzem por vasos cada vez maiores até os ductos torácico (que drena a maior parte do corpo) e linfático direito, que desembocam nas junções jugulossubclávias. No trajeto, a linfa atravessa linfonodos.',
        ],
      },
      {
        titulo: 'Relação com os vasos',
        paragrafos: [
          'Os linfáticos acompanham as veias nos membros e as artérias no tronco — por isso o modelo exibe também parte da aorta, do sistema venoso e o esqueleto como referência espacial, além da traqueia.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A drenagem linfática determina as vias de disseminação de infecções (linfangite, linfadenite) e de metástases (linfonodo sentinela). A obstrução gera linfedema, e o conhecimento das cadeias orienta o estadiamento oncológico.',
        ],
      },
    ],
  },

  /* ===================== VÍSCERAS, VASOS & MÚSCULOS ===================== */
  {
    slug: 'trato-gastrointestinal',
    titulo: 'Trato gastrointestinal',
    legenda: 'Órgãos do trato gastrointestinal, a partir de dados de tomografia.',
    categoriaId: 'visceras',
    sketchfabId: '26d08389de354277be032be39af5aba4',
    resumo:
      'Reconstrução tomográfica do tubo digestório, do estômago ao reto, mostrando a disposição real das vísceras abdominais.',
    secoes: [
      {
        titulo: 'Trajeto do tubo digestório',
        paragrafos: [
          'Após o esôfago, o alimento passa pelo estômago, duodeno, jejuno e íleo (intestino delgado) e pelo cólon (ceco, ascendente, transverso, descendente, sigmoide) até o reto. Fígado e pâncreas lançam suas secreções no duodeno.',
        ],
      },
      {
        titulo: 'Relações peritoneais',
        paragrafos: [
          'Órgãos intraperitoneais (estômago, jejuno, íleo, transverso, sigmoide) têm mesentério e mobilidade; retroperitoneais (grande parte do duodeno, pâncreas, cólons ascendente e descendente) são fixos. Essa distinção orienta a cirurgia e a propagação de coleções.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A reconstrução por TC é hoje central no diagnóstico de obstruções, apendicite, diverticulite e tumores, e o modelo tridimensional ajuda a traduzir os cortes axiais na anatomia real.',
        ],
      },
    ],
  },
  {
    slug: 'arterias-e-veias-torax-abdome',
    titulo: 'Tórax e abdome: artérias e veias',
    legenda: 'Algumas artérias e veias do tórax e do abdome.',
    categoriaId: 'visceras',
    sketchfabId: '23c06605ccfa415e8f384a09e50d73fa',
    resumo:
      'Grandes vasos do tronco: aorta e seus ramos, veias cavas e o sistema porta, referência para a vascularização visceral.',
    secoes: [
      {
        titulo: 'Aorta e ramos',
        paragrafos: [
          'A aorta torácica desce pelo mediastino posterior e, ao cruzar o diafragma, torna-se aorta abdominal, emitindo os ramos viscerais (tronco celíaco, mesentéricas superior e inferior, renais) antes de bifurcar-se nas ilíacas comuns.',
        ],
      },
      {
        titulo: 'Retorno venoso',
        paragrafos: [
          'A veia cava inferior recolhe o sangue do abdome e dos membros inferiores; o sistema ázigo drena a parede torácica. O sangue do tubo digestório converge para a veia porta, que atravessa o fígado antes de alcançar a cava.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A anatomia vascular fundamenta o entendimento do aneurisma de aorta, da isquemia mesentérica e da hipertensão portal, além de guiar acessos endovasculares.',
        ],
      },
    ],
  },
  {
    slug: 'musculos-torax-abdome',
    titulo: 'Tórax e abdome: músculos importantes',
    legenda: 'Músculos importantes do tórax e do abdome.',
    categoriaId: 'visceras',
    sketchfabId: 'a6831716a15540d1889efb57305572f8',
    resumo:
      'Musculatura da parede do tronco e o diafragma — a mecânica da respiração e da prensa abdominal.',
    secoes: [
      {
        titulo: 'Parede torácica e diafragma',
        paragrafos: [
          'Os músculos intercostais externos, internos e íntimos ocupam os espaços entre as costelas e participam da respiração. O diafragma, principal músculo inspiratório, separa o tórax do abdome e é atravessado pela aorta, pelo esôfago e pela cava inferior.',
        ],
      },
      {
        titulo: 'Parede abdominal',
        paragrafos: [
          'O reto do abdome (vertical, dentro da bainha) e os três músculos laterais (oblíquo externo, oblíquo interno e transverso) sustentam as vísceras, fletem e giram o tronco e elevam a pressão intra-abdominal.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A disposição das camadas explica as hérnias da parede e as incisões cirúrgicas. A paralisia diafragmática (lesão do nervo frênico, C3–C5) compromete gravemente a ventilação.',
        ],
      },
    ],
  },

  /* ===================== COLUNA TORÁCICA — VÉRTEBRAS ===================== */
  {
    slug: 'vertebras-toracicas-conjunto',
    titulo: 'Vértebras torácicas (conjunto)',
    legenda: 'Escaneamento 3D de vértebras torácicas, sem rótulos.',
    categoriaId: 'vertebras',
    sketchfabId: 'f12ae58b62944c2abac2b5e6da8b4711',
    resumo:
      'Várias vértebras torácicas articuladas, mostrando como se empilham para formar a curvatura cifótica.',
    secoes: secoesVertebra({
      titulo: 'Empilhamento e cifose',
      paragrafos: [
        'Empilhadas, as vértebras torácicas descrevem a cifose fisiológica, com processos espinhosos imbricados que limitam a extensão. A altura ligeiramente maior na porção posterior dos corpos contribui para essa curvatura.',
      ],
    }),
  },
  {
    slug: 'vertebra-toracica-th5-antwerpen',
    titulo: 'Vértebra torácica T5 (anotada)',
    legenda: 'Escaneamento 3D da quinta vértebra torácica, com nomenclatura latina/holandesa.',
    categoriaId: 'vertebras',
    sketchfabId: '2a25e30e1f8c4f07b00622f56e97788c',
    resumo:
      'Uma vértebra torácica típica de meio de segmento, com todos os acidentes ósseos bem demonstrados.',
    secoes: secoesVertebra({
      titulo: 'Particularidades de T5',
      paragrafos: [
        'A T5 é uma vértebra torácica típica: apresenta as duas hemifóveas costais no corpo (para as costelas 5 e 6), a fóvea costal do processo transverso e um longo processo espinhoso oblíquo. Situa-se aproximadamente ao nível do ângulo do esterno.',
      ],
    }),
  },
  {
    slug: 'vertebra-toracica-generica',
    titulo: 'Vértebra torácica (modelo geral)',
    legenda: 'Escaneamento 3D de uma vértebra torácica genérica, pintada para estudo.',
    categoriaId: 'vertebras',
    sketchfabId: '3e944d43bade419da488ed4efaba0c5a',
    resumo:
      'Modelo didático com estruturas coloridas para reconhecer os acidentes ósseos de uma vértebra torácica típica.',
    secoes: secoesVertebra({
      titulo: 'Estruturas em destaque',
      paragrafos: [
        'As cores diferenciam corpo, pedículos, lâminas, processos transversos e espinhoso e as facetas articulares, facilitando a identificação das partes que compõem qualquer vértebra torácica típica.',
      ],
    }),
  },
  {
    slug: 'vertebra-toracica-elon',
    titulo: 'Vértebra torácica (T5 ou T6)',
    legenda: 'Vértebra torácica, provavelmente T5 ou T6.',
    categoriaId: 'vertebras',
    sketchfabId: 'abd1b3a2116a449f94bccb86d1e17f54',
    resumo:
      'Vértebra do terço médio torácico, ideal para estudar a articulação com a cabeça e o tubérculo da costela.',
    secoes: secoesVertebra({
      titulo: 'Vértebra do terço médio',
      paragrafos: [
        'No terço médio (T5–T6), as vértebras são plenamente típicas, com fóveas costais completas no corpo e no processo transverso e o processo espinhoso longo e acentuadamente inclinado para baixo.',
      ],
    }),
  },
  {
    slug: 'coluna-vertebral-thunthu',
    titulo: 'Anatomia da coluna vertebral',
    legenda: 'Anatomia geral da coluna vertebral.',
    categoriaId: 'vertebras',
    sketchfabId: '1ce94666922f48c9b68cd0e196b74a0a',
    resumo:
      'Coluna inteira com suas cinco regiões e curvaturas, situando o segmento torácico no conjunto.',
    secoes: [
      {
        titulo: 'Regiões e curvaturas',
        paragrafos: [
          'A coluna tem 33 vértebras em cinco regiões: cervical (7), torácica (12), lombar (5), sacral (5 fundidas) e coccígea (4 fundidas). As curvaturas primárias (torácica e sacral, côncavas para a frente) e secundárias (cervical e lombar, convexas) equilibram a postura.',
        ],
      },
      {
        titulo: 'Características regionais',
        paragrafos: [
          'Cada região tem vértebras adaptadas à função: as cervicais têm forames transversários; as torácicas, fóveas costais; as lombares, corpos volumosos para carga. O segmento torácico é o único que articula costelas.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'Curvaturas patológicas (escoliose, hipercifose, hiperlordose) e a degeneração discal são causas frequentes de dor e deformidade. As transições entre regiões são pontos de maior estresse mecânico.',
        ],
      },
    ],
  },
  {
    slug: 'vertebra-toracica-t1',
    titulo: 'Vértebra torácica T1',
    legenda: 'Primeira vértebra torácica.',
    categoriaId: 'vertebras',
    sketchfabId: 'faa799c6438d4863968368da2d54d27a',
    resumo: 'Vértebra de transição cervicotorácica, atípica em suas fóveas costais.',
    secoes: secoesVertebra({
      titulo: 'Particularidades de T1',
      paragrafos: [
        'A T1 é atípica: possui uma fóvea costal superior completa (arredondada), que recebe integralmente a cabeça da 1ª costela, e uma hemifóvea inferior para a 2ª costela. O corpo assemelha-se ao de uma vértebra cervical e o processo espinhoso é longo e quase horizontal.',
      ],
    }),
  },
  {
    slug: 'vertebra-toracica-t2',
    titulo: 'Vértebra torácica T2',
    legenda: 'Segunda vértebra torácica.',
    categoriaId: 'vertebras',
    sketchfabId: '60046267be8943318b794d27054e4821',
    resumo: 'Vértebra torácica alta, já com o padrão típico de fóveas costais.',
    secoes: secoesVertebra({
      titulo: 'Particularidades de T2',
      paragrafos: [
        'A T2 já é praticamente típica, com hemifóveas costais superior e inferior para as costelas 2 e 3. Costuma ser uma das vértebras torácicas mais altas, situada logo abaixo da transição cervicotorácica.',
      ],
    }),
  },
  {
    slug: 'vertebra-toracica-t3',
    titulo: 'Vértebra torácica T3',
    legenda: 'Terceira vértebra torácica.',
    categoriaId: 'vertebras',
    sketchfabId: 'f700b59c2ab34299b79b33643828d858',
    resumo: 'Vértebra torácica típica do terço superior.',
    secoes: secoesVertebra({
      titulo: 'Particularidades de T3',
      paragrafos: [
        'A T3 é totalmente típica, com duas hemifóveas costais por lado (costelas 3 e 4), fóvea no processo transverso e longo processo espinhoso. Projeta-se, na superfície, próximo à espinha da escápula.',
      ],
    }),
  },
  {
    slug: 'vertebra-toracica-t4',
    titulo: 'Vértebra torácica T4',
    legenda: 'Quarta vértebra torácica.',
    categoriaId: 'vertebras',
    sketchfabId: '90c03fac7a6f463aab9cf57cf0b3c91e',
    resumo: 'Vértebra do nível do ângulo do esterno e da bifurcação traqueal.',
    secoes: secoesVertebra({
      titulo: 'Particularidades de T4',
      paragrafos: [
        'Vértebra típica; seu interesse é sobretudo topográfico: o plano do disco T4/T5 corresponde ao ângulo do esterno, à bifurcação da traqueia (carina), ao início e fim do arco da aorta e ao limite entre os mediastinos superior e inferior.',
      ],
    }),
  },
  {
    slug: 'vertebra-toracica-t5',
    titulo: 'Vértebra torácica T5',
    legenda: 'Quinta vértebra torácica.',
    categoriaId: 'vertebras',
    sketchfabId: 'c6acc2b940d4408b95775172f68fcc6e',
    resumo: 'Vértebra torácica típica do terço médio.',
    secoes: secoesVertebra({
      titulo: 'Particularidades de T5',
      paragrafos: [
        'A T5 é modelo de vértebra torácica típica, com hemifóveas costais para as costelas 5 e 6 e todos os acidentes ósseos bem desenvolvidos. Situa-se logo abaixo do plano do ângulo do esterno.',
      ],
    }),
  },
  {
    slug: 'vertebra-toracica-t6',
    titulo: 'Vértebra torácica T6',
    legenda: 'Sexta vértebra torácica.',
    categoriaId: 'vertebras',
    sketchfabId: 'c55ea5464c3740cba5451903aee346c9',
    resumo: 'Vértebra torácica típica do terço médio.',
    secoes: secoesVertebra({
      titulo: 'Particularidades de T6',
      paragrafos: [
        'A T6 mantém o padrão típico, com duas hemifóveas costais por lado (costelas 6 e 7) e processo espinhoso longo e oblíquo, que se sobrepõe ao corpo da vértebra subjacente.',
      ],
    }),
  },
  {
    slug: 'vertebra-toracica-t7',
    titulo: 'Vértebra torácica T7',
    legenda: 'Sétima vértebra torácica.',
    categoriaId: 'vertebras',
    sketchfabId: '7613f3b326e544c6bf23bcbac5163f01',
    resumo: 'Vértebra torácica típica, no nível de referência do ângulo inferior da escápula.',
    secoes: secoesVertebra({
      titulo: 'Particularidades de T7',
      paragrafos: [
        'Vértebra típica, com hemifóveas costais para as costelas 7 e 8. Seu processo espinhoso projeta-se, na superfície, aproximadamente no nível do ângulo inferior da escápula — referência para contagem no exame físico.',
      ],
    }),
  },
  {
    slug: 'vertebra-toracica-t8',
    titulo: 'Vértebra torácica T8',
    legenda: 'Oitava vértebra torácica.',
    categoriaId: 'vertebras',
    sketchfabId: '9e5b443780f849ebb071ea38ceb6400c',
    resumo: 'Vértebra típica do terço inferior torácico.',
    secoes: secoesVertebra({
      titulo: 'Particularidades de T8',
      paragrafos: [
        'A T8 é típica, com hemifóveas costais para as costelas 8 e 9. Aproxima-se do nível em que a veia cava inferior atravessa o diafragma (forame da veia cava, T8).',
      ],
    }),
  },
  {
    slug: 'vertebra-toracica-t9',
    titulo: 'Vértebra torácica T9',
    legenda: 'Nona vértebra torácica.',
    categoriaId: 'vertebras',
    sketchfabId: '674bda19a5ac4e11bb5db0693d66d9ce',
    resumo: 'Vértebra de transição no padrão de fóveas costais.',
    secoes: secoesVertebra({
      titulo: 'Particularidades de T9',
      paragrafos: [
        'A T9 pode começar a se afastar do padrão típico: em muitos indivíduos apresenta a hemifóvea costal superior, mas não a inferior, prenunciando as facetas costais únicas das vértebras torácicas mais baixas.',
      ],
    }),
  },
  {
    slug: 'vertebra-toracica-t10',
    titulo: 'Vértebra torácica T10',
    legenda: 'Décima vértebra torácica.',
    categoriaId: 'vertebras',
    sketchfabId: '7a58bfc8b92548c486c5d9f8f97a4651',
    resumo: 'Vértebra atípica, com faceta costal única.',
    secoes: secoesVertebra({
      titulo: 'Particularidades de T10',
      paragrafos: [
        'A T10 é atípica: costuma ter uma única fóvea costal (completa) de cada lado, articulando-se apenas com a 10ª costela. A fóvea costal do processo transverso pode estar reduzida ou ausente.',
      ],
    }),
  },
  {
    slug: 'vertebra-toracica-t11',
    titulo: 'Vértebra torácica T11',
    legenda: 'Décima primeira vértebra torácica.',
    categoriaId: 'vertebras',
    sketchfabId: '4b4cca41d220489aad4cc08774066a3c',
    resumo: 'Vértebra atípica que articula uma costela flutuante.',
    secoes: secoesVertebra({
      titulo: 'Particularidades de T11',
      paragrafos: [
        'A T11 tem uma única fóvea costal grande de cada lado, para a 11ª costela, e processos transversos curtos, sem fóvea costal — coerente com o fato de a 11ª costela ser flutuante. O corpo começa a lembrar o das lombares.',
      ],
    }),
  },
  {
    slug: 'vertebra-toracica-t12',
    titulo: 'Vértebra torácica T12',
    legenda: 'Décima segunda vértebra torácica.',
    categoriaId: 'vertebras',
    sketchfabId: 'bbe68758a54040829a9b9247f3686ae2',
    resumo: 'Vértebra de transição toracolombar, com características das duas regiões.',
    secoes: secoesVertebra({
      titulo: 'Particularidades de T12',
      paragrafos: [
        'A T12 é transicional: possui fóvea costal única para a 12ª costela (flutuante) e processos transversos rudimentares. Seus processos articulares inferiores já se voltam lateralmente, no padrão lombar, marcando a mudança de mecânica entre as regiões torácica e lombar.',
      ],
    }),
  },

  /* ===================== COSTELAS & ESTERNO ===================== */
  {
    slug: 'primeira-costela-insercoes',
    titulo: 'Primeira costela com inserções musculares',
    legenda: 'Escaneamento 3D da 1ª costela mostrando inserções musculares.',
    categoriaId: 'costelas',
    sketchfabId: '4a30ca75777b40b0bdeb0b3ded0ce404',
    resumo:
      'A costela mais atípica do tórax, chave do desfiladeiro torácico superior e ponto de passagem de vasos e nervos.',
    secoes: secoesCostela({
      titulo: 'A 1ª costela, atípica',
      paragrafos: [
        'A 1ª costela é curta, larga e a mais curva; suas faces são superior e inferior (e não interna/externa). Na face superior, o tubérculo do escaleno anterior separa o sulco da veia subclávia (à frente) do sulco da artéria subclávia e do plexo braquial (atrás). Recebe também o escaleno médio e o serrátil anterior. Sua cabeça tem faceta única para a T1.',
      ],
    }),
  },
  {
    slug: 'segunda-costela-antwerpen',
    titulo: 'Segunda costela',
    legenda: 'Escaneamento 3D da segunda costela.',
    categoriaId: 'costelas',
    sketchfabId: 'd3cd68d9f8ae476f88735ee8c23bfe57',
    resumo:
      'Costela de transição entre a atípica 1ª e as costelas típicas, marcada pela tuberosidade do serrátil anterior.',
    secoes: secoesCostela({
      titulo: 'Particularidades da 2ª costela',
      paragrafos: [
        'A 2ª costela é cerca de duas vezes mais longa que a 1ª e menos curva. Sua face externa apresenta a tuberosidade do músculo serrátil anterior. Articula-se em nível do ângulo do esterno, referência para localizá-la no exame físico.',
      ],
    }),
  },
  {
    slug: 'quinta-costela-antwerpen',
    titulo: 'Quinta costela',
    legenda: 'Escaneamento 3D da quinta costela.',
    categoriaId: 'costelas',
    sketchfabId: 'cbca5f68942f41b7a1e2cdba7d2a2f1b',
    resumo:
      'Exemplo de costela verdadeira típica, com todos os acidentes ósseos clássicos.',
    secoes: secoesCostela({
      titulo: 'Uma costela típica',
      paragrafos: [
        'A 5ª costela é o protótipo da costela típica e verdadeira: cabeça com duas facetas, colo, tubérculo articular, ângulo bem definido e corpo com o sulco da costela na margem inferior. Une-se ao esterno pela sua própria cartilagem costal.',
      ],
    }),
  },
  {
    slug: 'decima-primeira-costela',
    titulo: 'Décima primeira costela',
    legenda: 'Escaneamento 3D da 11ª costela.',
    categoriaId: 'costelas',
    sketchfabId: '3d1e182808ef432a95d228151ce6e625',
    resumo:
      'Uma das costelas flutuantes, curta e sem tubérculo, que termina livre na parede posterior.',
    secoes: secoesCostela({
      titulo: 'Costela flutuante',
      paragrafos: [
        'A 11ª costela é flutuante: curta, com cabeça de faceta única (articula só com a T11) e sem colo nem tubérculo, já que não alcança nenhum processo transverso para articular. Termina em ponta cartilaginosa na musculatura abdominal, sem sulco costal evidente.',
      ],
    }),
  },
  {
    slug: 'decima-segunda-costela-direita',
    titulo: 'Décima segunda costela direita',
    legenda: 'Modelo 3D rotativo da 12ª costela direita.',
    categoriaId: 'costelas',
    sketchfabId: '4d0e5894afdd4a0b8a327c45e905859f',
    resumo:
      'A menor e mais inferior das costelas, flutuante, referência do ângulo costovertebral.',
    secoes: secoesCostela({
      titulo: 'A 12ª costela',
      paragrafos: [
        'A 12ª costela é curta, quase reta, flutuante e com faceta única na cabeça. Não tem tubérculo, colo nem ângulo definidos. Serve de referência ao ângulo costovertebral, ponto de projeção do rim e de pesquisa da dor à punho-percussão (sinal de Giordano).',
      ],
    }),
  },
  {
    slug: 'costela-central-direita',
    titulo: 'Costela central direita',
    legenda: 'Modelo de costela central (típica) do lado direito.',
    categoriaId: 'costelas',
    sketchfabId: '6ca3afdf9a084b0db8b6141f50a94f49',
    resumo:
      'Costela típica do meio do gradil, ideal para revisar a anatomia padrão e a orientação do sulco costal.',
    secoes: secoesCostela({
      titulo: 'Referência de costela típica',
      paragrafos: [
        'Uma costela central típica exibe com clareza a sequência cabeça–colo–tubérculo–ângulo–corpo e o sulco costal na margem inferior interna. O lado direito ajuda a treinar a lateralidade em radiografias e na cirurgia torácica.',
      ],
    }),
  },
  {
    slug: 'costela-direita-1',
    titulo: 'Primeira costela direita',
    legenda: 'Primeira costela, na borda do desfiladeiro torácico.',
    categoriaId: 'costelas',
    sketchfabId: '77cad2f6211f4355b7cdab42ebb92562',
    resumo:
      'A 1ª costela do lado direito, limite ósseo do desfiladeiro torácico superior.',
    secoes: secoesCostela({
      titulo: 'A 1ª costela e o desfiladeiro torácico',
      paragrafos: [
        'Achatada de cima para baixo, a 1ª costela forma o assoalho do desfiladeiro torácico superior, por onde passam a artéria e a veia subclávias e o plexo braquial. A compressão desse espaço causa a síndrome do desfiladeiro torácico.',
      ],
    }),
  },
  {
    slug: 'costela-direita-2',
    titulo: 'Segunda costela direita',
    legenda: 'Segunda costela do lado direito.',
    categoriaId: 'costelas',
    sketchfabId: 'f10f4b90bbba4ab8806b3c19883643e1',
    resumo: 'A 2ª costela direita, marcada pela tuberosidade do serrátil anterior.',
    secoes: secoesCostela({
      titulo: 'Particularidades da 2ª costela',
      paragrafos: [
        'Mais longa e menos curva que a 1ª, a 2ª costela apresenta a tuberosidade do serrátil anterior em sua face externa e articula-se ao esterno no nível do ângulo esternal.',
      ],
    }),
  },
  {
    slug: 'costela-direita-3',
    titulo: 'Terceira costela direita',
    legenda: 'Terceira costela do lado direito.',
    categoriaId: 'costelas',
    sketchfabId: '84fe9613ce994d589eeb399611857a93',
    resumo: 'A partir da 3ª, as costelas assumem plenamente o padrão típico.',
    secoes: secoesCostela({
      titulo: 'Início das costelas típicas',
      paragrafos: [
        'A 3ª costela é a primeira plenamente típica: cabeça com duas facetas para T2 e T3, colo, tubérculo articular, ângulo e sulco costal. É costela verdadeira, com cartilagem própria até o esterno.',
      ],
    }),
  },
  {
    slug: 'costela-direita-4',
    titulo: 'Quarta costela direita',
    legenda: 'Quarta costela do lado direito.',
    categoriaId: 'costelas',
    sketchfabId: '466ab7138f3a47d5af2ba22bf3b51767',
    resumo: 'Costela verdadeira típica do terço superior do gradil.',
    secoes: secoesCostela({
      titulo: 'Particularidades da 4ª costela',
      paragrafos: [
        'Costela típica e verdadeira, articula-se com T3 e T4 pela cabeça e com o processo transverso de T4 pelo tubérculo. No terço superior, os arcos costais são relativamente horizontais.',
      ],
    }),
  },
  {
    slug: 'costela-direita-5',
    titulo: 'Quinta costela direita',
    legenda: 'Quinta costela do lado direito.',
    categoriaId: 'costelas',
    sketchfabId: 'a2ce68cf4acb4ba4a18fa80b1b49bfc9',
    resumo: 'Costela verdadeira típica; nível de referência para o ápice cardíaco à esquerda.',
    secoes: secoesCostela({
      titulo: 'Particularidades da 5ª costela',
      paragrafos: [
        'A 5ª costela é típica. No lado esquerdo, o 5º espaço intercostal na linha hemiclavicular corresponde à projeção do ápice do coração — referência clássica para palpar o ictus e posicionar o foco mitral.',
      ],
    }),
  },
  {
    slug: 'costela-direita-6',
    titulo: 'Sexta costela direita',
    legenda: 'Sexta costela do lado direito.',
    categoriaId: 'costelas',
    sketchfabId: 'a1e37e7ff430431e914b348dd23064cb',
    resumo: 'Última das costelas ainda relativamente horizontais do terço médio.',
    secoes: secoesCostela({
      titulo: 'Particularidades da 6ª costela',
      paragrafos: [
        'Costela verdadeira típica, articula-se com T5 e T6. A partir desse nível, os arcos costais tornam-se progressivamente mais oblíquos, o que amplia a excursão inspiratória inferior do tórax.',
      ],
    }),
  },
  {
    slug: 'costela-direita-7',
    titulo: 'Sétima costela direita',
    legenda: 'Sétima costela do lado direito.',
    categoriaId: 'costelas',
    sketchfabId: '2abf855e4ef84fc6ae88f04b028095c2',
    resumo: 'A última costela verdadeira, a mais longa do gradil costal.',
    secoes: secoesCostela({
      titulo: 'A 7ª costela',
      paragrafos: [
        'A 7ª costela é geralmente a mais longa e a última costela verdadeira — a última cuja cartilagem se articula diretamente com o esterno. Abaixo dela começam as costelas falsas, que se unem à cartilagem suprajacente.',
      ],
    }),
  },
  {
    slug: 'esterno-antwerpen',
    titulo: 'Esterno',
    legenda: 'Escaneamento 3D do esterno com anotações.',
    categoriaId: 'costelas',
    sketchfabId: '64e1a764e7c348b18230fdb035e8b323',
    resumo:
      'O osso da parede anterior do tórax, com manúbrio, corpo e processo xifoide.',
    secoes: secoesEsterno({
      titulo: 'Partes do esterno',
      paragrafos: [
        'O modelo mostra o manúbrio (com a incisura jugular e as incisuras claviculares), o corpo — que recebe as cartilagens costais — e o processo xifoide, cartilaginoso na juventude e ossificado no adulto. As incisuras costais nas margens laterais recebem as cartilagens da 1ª à 7ª costela.',
      ],
    }),
  },
  {
    slug: 'esterno-forame-esternal',
    titulo: 'Esterno com forame esternal',
    legenda: 'Esterno com variação anatômica (forame esternal).',
    categoriaId: 'costelas',
    sketchfabId: '394e7d34bf8a4614be125d90fa11e87e',
    resumo:
      'Variação anatômica comum: um orifício congênito no corpo do esterno, com implicações clínicas importantes.',
    secoes: secoesEsterno({
      titulo: 'O forame esternal',
      paragrafos: [
        'O forame esternal é uma falha de fusão dos centros de ossificação do corpo do esterno, resultando em um orifício persistente. É benigno, mas pode ser confundido com lesão lítica na imagem e representa risco em procedimentos como a punção/biópsia esternal e a acupuntura, pelo perigo de atingir estruturas mediastinais.',
      ],
    }),
  },
  {
    slug: 'manubrio-do-esterno',
    titulo: 'Manúbrio do esterno',
    legenda: 'O manúbrio esternal isolado.',
    categoriaId: 'costelas',
    sketchfabId: '4bb87bf477dd418d86cea9641bbd474d',
    resumo:
      'A porção superior do esterno, que se articula com as clavículas e as duas primeiras costelas.',
    secoes: secoesEsterno({
      titulo: 'O manúbrio',
      paragrafos: [
        'O manúbrio tem a incisura jugular na borda superior, ladeada pelas incisuras claviculares (articulação esternoclavicular). Lateralmente, recebe a 1ª cartilagem costal (por faceta completa) e, no ângulo do esterno, a metade superior da 2ª cartilagem costal. Sua junção com o corpo forma o proeminente ângulo esternal.',
      ],
    }),
  },

  /* ===================== CÍNGULO DO MEMBRO SUPERIOR ===================== */
  {
    slug: 'clavicula-direita-antwerpen',
    titulo: 'Clavícula direita',
    legenda: 'Escaneamento 3D da clavícula direita.',
    categoriaId: 'cintura',
    sketchfabId: 'c1e8d74bf5dc465e86f9025174a279ae',
    resumo: 'A clavícula do lado direito, escora horizontal do ombro.',
    secoes: secoesClavicula({
      titulo: 'Identificando o lado',
      paragrafos: [
        'Na clavícula direita, a extremidade esternal, arredondada e volumosa, fica medial, e a acromial, achatada, lateral. A dupla curvatura em S (convexa à frente medialmente, côncava à frente lateralmente) e a face inferior rugosa permitem determinar o lado e a orientação.',
      ],
    }),
  },
  {
    slug: 'clavicula-esquerda-bluelink',
    titulo: 'Clavícula esquerda',
    legenda: 'Clavícula do lado esquerdo.',
    categoriaId: 'cintura',
    sketchfabId: '28aaac75ed4246c8b9fd0d6b70515abf',
    resumo: 'A clavícula do lado esquerdo, para comparação de lateralidade.',
    secoes: secoesClavicula({
      titulo: 'Identificando o lado',
      paragrafos: [
        'Comparar as claviculas direita e esquerda treina o reconhecimento da lateralidade: a extremidade esternal arredondada aponta para a linha média e a acromial achatada para o ombro, com a curvatura em S invertida em relação ao lado oposto.',
      ],
    }),
  },
  {
    slug: 'clavicula-direita-bluelink',
    titulo: 'Clavícula direita (BlueLink)',
    legenda: 'Clavícula direita, modelo baseado em escaneamento.',
    categoriaId: 'cintura',
    sketchfabId: 'ab785f3108044ac688b31a3d95634719',
    resumo: 'Outra reconstrução da clavícula direita, útil para revisar os acidentes ósseos.',
    secoes: secoesClavicula({
      titulo: 'Acidentes da face inferior',
      paragrafos: [
        'A face inferior concentra os marcos: a impressão do ligamento costoclavicular na extremidade esternal, o sulco do subclávio no corpo e o tubérculo conoide com a linha trapezoide na extremidade acromial, onde o ligamento coracoclavicular ancora a clavícula ao processo coracoide.',
      ],
    }),
  },
  {
    slug: 'clavicula-esquerda-elon',
    titulo: 'Clavícula esquerda (anotada)',
    legenda: 'Clavícula esquerda com anotações.',
    categoriaId: 'cintura',
    sketchfabId: 'fd3ae947be90403d9a79d8e9669af236',
    resumo: 'Clavícula esquerda com estruturas rotuladas para estudo.',
    secoes: secoesClavicula({
      titulo: 'Estruturas anotadas',
      paragrafos: [
        'As anotações destacam as extremidades esternal e acromial, as faces superior (lisa) e inferior (rugosa) e as impressões ligamentares, facilitando associar cada acidente ósseo à sua função na estabilidade do ombro.',
      ],
    }),
  },
  {
    slug: 'escapula-faces-antwerpen',
    titulo: 'Escápula — faces e margens',
    legenda: 'Escaneamento 3D mostrando as faces da escápula.',
    categoriaId: 'cintura',
    sketchfabId: 'acc2157209e34a0fad78169657f92e6e',
    resumo: 'Escápula com destaque para suas faces costal e posterior e suas margens.',
    secoes: secoesEscapula({
      titulo: 'Faces e margens em destaque',
      paragrafos: [
        'O modelo evidencia a face costal (côncava, formando a fossa subescapular que desliza sobre as costelas) e a face posterior, dividida pela espinha nas fossas supra e infraespinal, além das três margens (superior, medial e lateral) que delimitam o osso triangular.',
      ],
    }),
  },
  {
    slug: 'escapula-estruturas-antwerpen',
    titulo: 'Escápula — estruturas específicas',
    legenda: 'Escápula com anotação de estruturas específicas.',
    categoriaId: 'cintura',
    sketchfabId: '8047731b0ae740678e09a8af45a7f515',
    resumo: 'Escápula anotada, com ênfase nos processos e na cavidade glenoidal.',
    secoes: secoesEscapula({
      titulo: 'Processos e cavidade glenoidal',
      paragrafos: [
        'As anotações destacam a espinha, o acrômio, o processo coracoide, a incisura da escápula e a cavidade glenoidal com seus tubérculos supra e infraglenoidais — pontos de origem do bíceps e do tríceps, respectivamente.',
      ],
    }),
  },
  {
    slug: 'escapula-elon',
    titulo: 'Escápula (anotada)',
    legenda: 'Escápula com anotações.',
    categoriaId: 'cintura',
    sketchfabId: '0745bbb368b4401db89e73babe440ee8',
    resumo: 'Modelo anotado da escápula para revisão dos principais acidentes ósseos.',
    secoes: secoesEscapula({
      titulo: 'Revisão anotada',
      paragrafos: [
        'As anotações reúnem os acidentes essenciais — ângulos, margens, espinha, fossas, acrômio, coracoide e glenoide — servindo de mapa completo para reconhecer a escápula em qualquer orientação.',
      ],
    }),
  },
  {
    slug: 'escapula-lexington',
    titulo: 'Escápula (Lexington)',
    legenda: 'Modelo anotado da escápula.',
    categoriaId: 'cintura',
    sketchfabId: '4eb3b5eee74a422e8b870f40e7c032ca',
    resumo: 'Outra reconstrução anotada da escápula, útil para comparação.',
    secoes: secoesEscapula({
      titulo: 'Comparação de modelos',
      paragrafos: [
        'Comparar reconstruções diferentes da escápula ajuda a perceber a variação individual e a consolidar o reconhecimento das mesmas estruturas em modelos distintos.',
      ],
    }),
  },
  {
    slug: 'escapula-direita-bluelink',
    titulo: 'Escápula direita',
    legenda: 'Escápula direita, baseada em escaneamento.',
    categoriaId: 'cintura',
    sketchfabId: '165f125de982464783904a0f9c2c3afe',
    resumo: 'Escápula do lado direito, para estudo da lateralidade.',
    secoes: secoesEscapula({
      titulo: 'Identificando o lado',
      paragrafos: [
        'Para lateralizar a escápula: a cavidade glenoidal aponta lateralmente, a espinha e o acrômio ficam na face posterior, e a margem lateral (axilar), espessa, dirige-se ao ângulo inferior. Na escápula direita, essas referências situam-se do lado direito do corpo.',
      ],
    }),
  },
  {
    slug: 'escapula-esquerda-bluelink',
    titulo: 'Escápula esquerda',
    legenda: 'Escápula do lado esquerdo.',
    categoriaId: 'cintura',
    sketchfabId: '1b3fd5207bc2457a94c7594e98634f62',
    resumo: 'Escápula do lado esquerdo, complemento para a comparação de lateralidade.',
    secoes: secoesEscapula({
      titulo: 'Identificando o lado',
      paragrafos: [
        'A escápula esquerda espelha a direita: com a face costal voltada para as costelas, a cavidade glenoidal aponta lateralmente à esquerda e o processo coracoide projeta-se para a frente, servindo de teste prático de lateralidade.',
      ],
    }),
  },
  {
    slug: 'ossos-membro-superior',
    titulo: 'Ossos do membro superior (cíngulo)',
    legenda: 'Escaneamento 3D dos ossos do cíngulo do membro superior.',
    categoriaId: 'cintura',
    sketchfabId: '95e0fbaf04644312b0e6f99c5b49db2f',
    resumo: 'Clavícula e escápula articuladas, formando o cíngulo que ancora o membro superior.',
    secoes: [
      {
        titulo: 'O cíngulo do membro superior',
        paragrafos: [
          'O cíngulo (cintura escapular) é formado pela clavícula e pela escápula. Ele conecta o membro superior ao esqueleto axial por uma única articulação óssea — a esternoclavicular —, o que confere enorme mobilidade ao ombro.',
        ],
      },
      {
        titulo: 'Articulações e estabilidade',
        paragrafos: [
          'A clavícula articula-se com o esterno (medialmente) e com o acrômio (lateralmente). A estabilidade depende mais de músculos e ligamentos (coracoclavicular, acromioclavicular) do que de encaixe ósseo, o que explica luxações acromioclaviculares e a fixação escapular ao tronco pela musculatura.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A mobilidade privilegiada do ombro tem como preço a instabilidade: luxações glenoumerais e acromioclaviculares e fraturas de clavícula são lesões frequentes. O ritmo escapuloumeral coordenado é essencial à elevação plena do braço.',
        ],
      },
    ],
  },
  {
    slug: 'clavicula-e-escapula',
    titulo: 'Clavícula e escápula',
    legenda: 'Escaneamento 3D da clavícula e da escápula articuladas.',
    categoriaId: 'cintura',
    sketchfabId: '5bc2f90b379945f08844395cac42c673',
    resumo: 'As duas peças do cíngulo em relação, mostrando a articulação acromioclavicular.',
    secoes: [
      {
        titulo: 'A articulação acromioclavicular',
        paragrafos: [
          'A extremidade acromial da clavícula encontra o acrômio da escápula na articulação acromioclavicular, estabilizada pelos ligamentos acromioclavicular e coracoclavicular (conoide e trapezoide). Juntas, clavícula e escápula formam o arco sob o qual se movimenta o ombro.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A separação acromioclavicular (luxação do ombro "por cima") resulta de queda direta sobre o ombro e é graduada conforme a ruptura desses ligamentos, o que define o tratamento conservador ou cirúrgico.',
        ],
      },
    ],
  },

  /* ===================== ESQUELETO AXIAL & OSSOS ===================== */
  {
    slug: 'esqueleto-axial-com-cintura',
    titulo: 'Esqueleto axial com clavículas e escápulas',
    legenda: 'Escaneamento 3D do esqueleto axial incluindo clavículas e escápulas.',
    categoriaId: 'axial',
    sketchfabId: '6a7a7bcac16f42b48894f79102cbf83e',
    resumo:
      'O esqueleto do tronco somado ao cíngulo do membro superior, mostrando como o ombro se apoia no tórax.',
    secoes: [
      {
        titulo: 'Esqueleto axial e apendicular',
        paragrafos: [
          'O esqueleto axial (crânio, coluna, costelas e esterno) forma o eixo do corpo; o apendicular inclui os membros e seus cíngulos. Este modelo une o axial ao cíngulo do membro superior (clavículas e escápulas), demonstrando a interface entre os dois.',
        ],
      },
      {
        titulo: 'Apoio do ombro sobre o tórax',
        paragrafos: [
          'As escápulas repousam sobre a face posterior do gradil costal (2ª a 7ª costelas) e conectam-se ao axial apenas pela clavícula, via articulação esternoclavicular — arranjo que sustenta a mobilidade do ombro.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A caixa torácica protege coração e pulmões e serve de inserção à musculatura respiratória. Deformidades da parede (pectus, escoliose) alteram tanto a estética quanto a mecânica ventilatória.',
        ],
      },
    ],
  },
  {
    slug: 'esqueleto-axial-sem-cranio',
    titulo: 'Esqueleto axial sem o crânio',
    legenda: 'Escaneamento 3D do esqueleto axial sem os ossos do crânio.',
    categoriaId: 'axial',
    sketchfabId: '36a8c0607db441ea8d68cc230a5d3626',
    resumo:
      'Coluna, costelas e esterno em conjunto — o arcabouço ósseo do tronco.',
    secoes: [
      {
        titulo: 'A caixa torácica',
        paragrafos: [
          'A caixa torácica é formada pelas 12 vértebras torácicas atrás, pelos 12 pares de costelas nas laterais e pelo esterno à frente, unidos pelas cartilagens costais. Tem forma de cone truncado, mais estreita em cima.',
        ],
      },
      {
        titulo: 'Aberturas do tórax',
        paragrafos: [
          'A abertura torácica superior dá passagem à traqueia, ao esôfago e aos grandes vasos e nervos rumo ao pescoço e aos membros; a abertura inferior é fechada pelo diafragma. A coluna torácica sustenta o conjunto e confere a curvatura cifótica.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A elasticidade das cartilagens costais permite a expansão respiratória; sua calcificação com a idade enrijece o tórax. Fraturas múltiplas podem comprometer a mecânica ventilatória.',
        ],
      },
    ],
  },
  {
    slug: 'ossos-do-torax',
    titulo: 'Ossos do tórax',
    legenda: 'Escaneamento 3D dos ossos do tórax.',
    categoriaId: 'axial',
    sketchfabId: '9ff3680f64c24da488f14ccd28787a48',
    resumo:
      'A caixa torácica isolada, ideal para estudar as articulações costovertebrais e costocondrais.',
    secoes: [
      {
        titulo: 'Articulações da caixa torácica',
        paragrafos: [
          'Atrás, cada costela articula-se com a coluna em dois pontos: a cabeça, com os corpos vertebrais (articulação costovertebral), e o tubérculo, com o processo transverso (costotransversária). À frente, as cartilagens costais unem-se ao esterno (esternocostais) e entre si (intercondrais).',
        ],
      },
      {
        titulo: 'Mecânica respiratória',
        paragrafos: [
          'Os movimentos das costelas — "alça de balde" (elevação lateral) e "braço de bomba" (elevação anteroposterior) — aumentam os diâmetros do tórax na inspiração, reduzindo a pressão intratorácica.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'A compreensão dessas articulações fundamenta a mecânica da respiração e explica dores da parede torácica, como a costocondrite (síndrome de Tietze).',
        ],
      },
    ],
  },
  {
    slug: 'esqueleto-toracoabdominal',
    titulo: 'Esqueleto torácico e abdominal',
    legenda: 'Estruturas ósseas do tórax e do abdome (a partir de dados de TC).',
    categoriaId: 'axial',
    sketchfabId: 'a423ea77377f41438d017e108e060d5e',
    resumo:
      'Arcabouço ósseo do tronco reconstruído por tomografia, unindo tórax, coluna e pelve.',
    secoes: [
      {
        titulo: 'Do tórax à pelve',
        paragrafos: [
          'A reconstrução mostra a continuidade entre a caixa torácica, a coluna toracolombar e a pelve óssea, evidenciando como o eixo axial transmite a carga do tronco aos membros inferiores.',
        ],
      },
      {
        titulo: 'Referências por imagem',
        paragrafos: [
          'Modelos derivados de TC reproduzem a anatomia real do paciente e são referência para localizar estruturas em cortes axiais, planejar cirurgias e interpretar traumas do tronco.',
        ],
      },
    ],
  },
  {
    slug: 'grandes-ossos-do-corpo',
    titulo: 'Grandes ossos do corpo',
    legenda: 'Os principais ossos do corpo.',
    categoriaId: 'axial',
    sketchfabId: '3c5d1fdbc69d482b9fbdb8d7b96ff4a1',
    resumo:
      'Panorama dos principais ossos do esqueleto, situando o tórax no conjunto do corpo.',
    secoes: [
      {
        titulo: 'Visão de conjunto do esqueleto',
        paragrafos: [
          'O esqueleto adulto tem cerca de 206 ossos, divididos em axial (80) e apendicular (126). Este panorama ajuda a situar a caixa torácica e a coluna em relação ao crânio, à pelve e aos ossos longos dos membros.',
        ],
      },
      {
        titulo: 'Funções do esqueleto',
        paragrafos: [
          'Além de sustentar e proteger, os ossos alavancam o movimento, armazenam cálcio e fósforo e abrigam a medula óssea hematopoética — sobretudo nos ossos chatos, como esterno, costelas e ossos do quadril.',
        ],
      },
    ],
  },

  /* ===================== CRÂNIO & OSSOS DA CABEÇA ===================== */
  {
    slug: 'ossos-da-orbita-e-palatinos',
    titulo: 'Ossos da órbita, incluindo os palatinos',
    legenda: 'Destaque dos ossos que formam a órbita, incluindo os ossos palatinos.',
    categoriaId: 'cranio',
    sketchfabId: '4d76805781d34070926dd9797a4e5013',
    resumo:
      'A cavidade orbitária e sua parede, formada por múltiplos ossos, com destaque para os palatinos.',
    secoes: [
      {
        titulo: 'Ossos que formam a órbita',
        paragrafos: [
          'A órbita é uma pirâmide óssea formada por sete ossos: frontal, zigomático, maxila, lacrimal, etmoide, esfenoide e palatino. O processo orbitário do palatino participa de uma pequena porção do assoalho posterior.',
        ],
      },
      {
        titulo: 'Forames e fissuras',
        paragrafos: [
          'Pelo ápice orbitário passam o canal óptico (nervo óptico e artéria oftálmica) e as fissuras orbitárias superior (III, IV, V1, VI) e inferior (V2), portas de comunicação com a fossa craniana média e a fossa pterigopalatina.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'As paredes finas — sobretudo o assoalho e a lâmina papirácea do etmoide — fraturam-se facilmente (fratura em blow-out), podendo aprisionar músculos e causar diplopia. Infecções do etmoide podem alcançar a órbita (celulite orbitária).',
        ],
      },
    ],
  },
  {
    slug: 'crânio-e-mandibula-corte-sagital',
    titulo: 'Corte sagital do crânio e da mandíbula',
    legenda: 'Ossos do crânio individualmente coloridos e anotados. Nomenclatura em inglês.',
    categoriaId: 'cranio',
    sketchfabId: '7565dbc2297149d29ee76b7bd270e7d2',
    resumo:
      'Hemicorte do crânio com os ossos coloridos individualmente, revelando as paredes das cavidades nasal e craniana.',
    secoes: [
      {
        titulo: 'Ossos do neurocrânio e viscerocrânio',
        paragrafos: [
          'O corte separa o neurocrânio (frontal, parietal, temporal, occipital, esfenoide, etmoide), que aloja o encéfalo, do viscerocrânio (maxila, mandíbula, palatino, vômer, nasais, zigomáticos), que forma a face. As cores distinguem cada osso e suas suturas.',
        ],
      },
      {
        titulo: 'Cavidades reveladas',
        paragrafos: [
          'O plano sagital expõe a cavidade nasal com seus cornetos e o septo (vômer e lâmina perpendicular do etmoide), a sela túrcica do esfenoide (que aloja a hipófise) e as fossas cranianas anterior, média e posterior, onde repousa o encéfalo.',
        ],
      },
      {
        titulo: 'Relevância clínica',
        paragrafos: [
          'Compreender essa arquitetura fundamenta a cirurgia endoscópica nasossinusal, o acesso transesfenoidal à hipófise e a interpretação de fraturas de base de crânio, que podem cursar com fístula liquórica.',
        ],
      },
    ],
  },
]

/* ──────────────────────────────────────────────────────────────────────────
 * Acessores
 * ──────────────────────────────────────────────────────────────────────── */

export function getModeloBySlug(slug: string): Modelo3D | undefined {
  return MODELOS.find(m => m.slug === slug)
}

export function getModelosPorCategoria(id: CategoriaId): Modelo3D[] {
  return MODELOS.filter(m => m.categoriaId === id)
}

export function getRelacionados(modelo: Modelo3D, limite = 6): Modelo3D[] {
  return MODELOS.filter(m => m.categoriaId === modelo.categoriaId && m.slug !== modelo.slug).slice(0, limite)
}

export function getDestaques(): Modelo3D[] {
  return MODELOS.filter(m => m.destaque)
}

export const TOTAL_MODELOS = MODELOS.length
