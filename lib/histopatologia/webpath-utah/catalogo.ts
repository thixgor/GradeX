export type GrupoWebPathUtah = 'geral' | 'sistemica'
export type ModalidadeWebPathUtah = 'macroscopia' | 'microscopia'

export interface EntradaWebPathUtahBruta {
  secaoOriginal: string
  tituloOriginal: string
  url: string
  urlImagem: string
}

export interface CapituloWebPathUtahBruto {
  grupo: GrupoWebPathUtah
  id: string
  nome: string
  url: string
  entradas: EntradaWebPathUtahBruta[]
}

export interface CapituloWebPathUtahResumo {
  id: string
  grupo: GrupoWebPathUtah
  nome: string
  nomeOriginal: string
  urlIndice: string
  total: number
  descricao: string
  roteiro: string
}

export const CAPITULOS_WEBPATH_UTAH: CapituloWebPathUtahResumo[] = [
  {
    id: 'aterosclerose-trombose',
    grupo: 'geral',
    nome: 'Aterosclerose e trombose',
    nomeOriginal: 'Atherosclerosis and Thrombosis',
    urlIndice: 'https://webpath.med.utah.edu/ATHHTML/ATHIDX.html',
    total: 41,
    descricao: 'Placas ateromatosas, trombos, tromboembolismo e infartos em vasos e órgãos-alvo.',
    roteiro: 'Comece pela parede vascular, identifique a composição da placa ou do trombo e termine avaliando obstrução, organização e dano isquêmico distal.',
  },
  {
    id: 'lesao-celular',
    grupo: 'geral',
    nome: 'Lesão celular',
    nomeOriginal: 'Cellular Injury',
    urlIndice: 'https://webpath.med.utah.edu/CINJHTML/CINJIDX.html',
    total: 52,
    descricao: 'Degeneração, necrose, apoptose, pigmentos, calcificação e respostas celulares ao estresse.',
    roteiro: 'Compare arquitetura preservada e perdida, procure alterações citoplasmáticas e nucleares e relacione o padrão de morte ao mecanismo de agressão.',
  },
  {
    id: 'patologia-forense',
    grupo: 'geral',
    nome: 'Patologia forense',
    nomeOriginal: 'Forensic Pathology',
    urlIndice: 'https://webpath.med.utah.edu/FORHTML/FORIDX.html',
    total: 63,
    descricao: 'Trauma, feridas, asfixia, queimaduras e padrões macroscópicos relevantes à investigação médico-legal.',
    roteiro: 'Descreva forma, bordas, profundidade e distribuição antes de inferir mecanismo; diferencie vitalidade, temporalidade e artefatos pós-morte.',
  },
  {
    id: 'imunopatologia',
    grupo: 'geral',
    nome: 'Imunopatologia',
    nomeOriginal: 'Immunopathology',
    urlIndice: 'https://webpath.med.utah.edu/IMMHTML/IMMIDX.html',
    total: 33,
    descricao: 'Padrões de hipersensibilidade, autoimunidade, imunodeficiência e depósitos proteicos.',
    roteiro: 'Localize o compartimento atingido, caracterize infiltrado e depósito e relacione a distribuição ao mecanismo imune predominante.',
  },
  {
    id: 'infeccao',
    grupo: 'geral',
    nome: 'Infecção',
    nomeOriginal: 'Infection',
    urlIndice: 'https://webpath.med.utah.edu/INFEHTML/INFECIDX.html',
    total: 47,
    descricao: 'Agentes infecciosos e padrões teciduais supurativos, granulomatosos, necrosantes e citopáticos.',
    roteiro: 'Defina primeiro o padrão de resposta do hospedeiro, procure o agente no compartimento esperado e só então formule a etiologia.',
  },
  {
    id: 'inflamacao',
    grupo: 'geral',
    nome: 'Inflamação',
    nomeOriginal: 'Inflammation',
    urlIndice: 'https://webpath.med.utah.edu/INFLHTML/INFLIDX.html',
    total: 68,
    descricao: 'Inflamação aguda, crônica e granulomatosa, exsudatos, reparo e fibrose.',
    roteiro: 'Reconheça o tipo celular dominante, mapeie necrose e exsudato e avalie se o processo está resolvendo, organizando ou cicatrizando.',
  },
  {
    id: 'neoplasia',
    grupo: 'geral',
    nome: 'Neoplasia',
    nomeOriginal: 'Neoplasia',
    urlIndice: 'https://webpath.med.utah.edu/NEOHTML/NEOPLIDX.html',
    total: 65,
    descricao: 'Tumores benignos e malignos, invasão, metástase, diferenciação e heterogeneidade macroscópica.',
    roteiro: 'Comece pela interface com o tecido, avalie arquitetura e diferenciação e termine procurando invasão, necrose, mitoses e disseminação.',
  },
  {
    id: 'pediatrica-perinatal',
    grupo: 'geral',
    nome: 'Patologia pediátrica e perinatal',
    nomeOriginal: 'Pediatric-Perinatal Pathology',
    urlIndice: 'https://webpath.med.utah.edu/PEDHTML/PEDIDX.html',
    total: 84,
    descricao: 'Malformações, doenças fetais e neonatais, prematuridade, infecções e tumores pediátricos.',
    roteiro: 'Relacione o achado à idade gestacional e ao desenvolvimento normal, separando malformação primária de lesão secundária intrauterina ou perinatal.',
  },
  {
    id: 'placenta',
    grupo: 'geral',
    nome: 'Patologia placentária',
    nomeOriginal: 'Placental Pathology',
    urlIndice: 'https://webpath.med.utah.edu/PLACHTML/PLACIDX.html',
    total: 54,
    descricao: 'Lesões maternas e fetais, inflamação, infarto, implantação anômala e doença trofoblástica.',
    roteiro: 'Separe compartimentos materno e fetal, avalie vilosidades para a idade gestacional e procure inflamação, má perfusão, trombose e proliferação trofoblástica.',
  },
  {
    id: 'cardiovascular',
    grupo: 'sistemica',
    nome: 'Patologia cardiovascular',
    nomeOriginal: 'Cardiovascular Pathology',
    urlIndice: 'https://webpath.med.utah.edu/CVHTML/CVIDX.html',
    total: 117,
    descricao: 'Cardiopatias isquêmicas, valvares, congênitas, inflamatórias, vasculares e neoplásicas.',
    roteiro: 'Oriente a peça por câmaras, válvulas e vasos; na lâmina, conecte miocárdio, endocárdio, pericárdio e circulação ao defeito funcional.',
  },
  {
    id: 'sistema-nervoso-central',
    grupo: 'sistemica',
    nome: 'Patologia do sistema nervoso central',
    nomeOriginal: 'Central Nervous System Pathology',
    urlIndice: 'https://webpath.med.utah.edu/CNSHTML/CNSIDX.html',
    total: 122,
    descricao: 'Doenças vasculares, infecciosas, degenerativas, desmielinizantes e tumores do sistema nervoso.',
    roteiro: 'Localize substância cinzenta, branca, meninges e ventrículos, determine a distribuição anatômica e correlacione perda neuronal, gliose, necrose e efeito de massa.',
  },
  {
    id: 'endocrina',
    grupo: 'sistemica',
    nome: 'Patologia endócrina',
    nomeOriginal: 'Endocrine Pathology',
    urlIndice: 'https://webpath.med.utah.edu/ENDOHTML/ENDOIDX.html',
    total: 54,
    descricao: 'Lesões de tireoide, paratireoide, suprarrenal, hipófise e pâncreas endócrino.',
    roteiro: 'Compare a arquitetura glandular residual, avalie encapsulamento e invasão e relacione quantidade celular à função hormonal clínica.',
  },
  {
    id: 'genital-feminino',
    grupo: 'sistemica',
    nome: 'Patologia do trato genital feminino',
    nomeOriginal: 'Female Genital Tract Pathology',
    urlIndice: 'https://webpath.med.utah.edu/FEMHTML/FEMIDX.html',
    total: 70,
    descricao: 'Doenças da vulva, vagina, colo, endométrio, miométrio, tubas e ovários.',
    roteiro: 'Identifique o compartimento epitelial ou estromal, avalie relação com ciclo e idade e procure displasia, invasão e padrões de disseminação.',
  },
  {
    id: 'gastrointestinal',
    grupo: 'sistemica',
    nome: 'Patologia gastrointestinal',
    nomeOriginal: 'Gastrointestinal Pathology',
    urlIndice: 'https://webpath.med.utah.edu/GIHTML/GIIDX.html',
    total: 103,
    descricao: 'Lesões inflamatórias, vasculares e neoplásicas do esôfago ao canal anal.',
    roteiro: 'Oriente as camadas da parede, defina a profundidade e distribuição da lesão e avalie mucosa, criptas, glândulas, submucosa e margem invasiva.',
  },
  {
    id: 'hematopatologia',
    grupo: 'sistemica',
    nome: 'Hematopatologia',
    nomeOriginal: 'Hematopathology',
    urlIndice: 'https://webpath.med.utah.edu/HEMEHTML/HEMEIDX.html',
    total: 50,
    descricao: 'Medula óssea, linfonodos e doenças mieloides, linfoides e plasmocitárias.',
    roteiro: 'Avalie celularidade, arquitetura e composição populacional antes da citologia; procure padrão difuso, nodular, paracortical, sinusoidal ou medular.',
  },
  {
    id: 'hepatica',
    grupo: 'sistemica',
    nome: 'Patologia hepática',
    nomeOriginal: 'Hepatic Pathology',
    urlIndice: 'https://webpath.med.utah.edu/LIVEHTML/LIVERIDX.html',
    total: 56,
    descricao: 'Hepatites, esteatose, colestase, cirrose, doenças vasculares e tumores hepáticos.',
    roteiro: 'Preserve a leitura lobular: portal, interface, sinusóide e região centrolobular; distribua inflamação, necrose, gordura, bile e fibrose nesses compartimentos.',
  },
  {
    id: 'genital-masculino',
    grupo: 'sistemica',
    nome: 'Patologia do trato genital masculino',
    nomeOriginal: 'Male Genital Tract Pathology',
    urlIndice: 'https://webpath.med.utah.edu/MALEHTML/MALEIDX.html',
    total: 35,
    descricao: 'Lesões de próstata, testículo, paratesticulares e tumores germinativos.',
    roteiro: 'Na próstata, compare glândulas e estroma; no testículo, preserve a relação entre túbulo, interstício, hilo e túnicas e procure componentes tumorais mistos.',
  },
  {
    id: 'pulmonar',
    grupo: 'sistemica',
    nome: 'Patologia pulmonar',
    nomeOriginal: 'Pulmonary Pathology',
    urlIndice: 'https://webpath.med.utah.edu/LUNGHTML/LUNGIDX.html',
    total: 107,
    descricao: 'Infecções, doenças obstrutivas e intersticiais, lesão vascular e tumores pulmonares.',
    roteiro: 'Separe via aérea, alvéolo, interstício, vaso e pleura; determine qual compartimento inicia o processo e como ele compromete ventilação e difusão.',
  },
  {
    id: 'renal',
    grupo: 'sistemica',
    nome: 'Patologia renal',
    nomeOriginal: 'Renal Pathology',
    urlIndice: 'https://webpath.med.utah.edu/RENAHTML/RENALIDX.html',
    total: 104,
    descricao: 'Doenças glomerulares, tubulointersticiais, vasculares, císticas e neoplásicas do rim.',
    roteiro: 'Analise glomérulos, túbulos, interstício e vasos separadamente e depois integre distribuição, cronicidade, imunodepósitos e repercussão cortical.',
  },
]

export const TOTAL_ENTRADAS_WEBPATH_UTAH = CAPITULOS_WEBPATH_UTAH.reduce(
  (total, capitulo) => total + capitulo.total,
  0,
)

export function resumoDoCapituloWebPathUtah(id: string): CapituloWebPathUtahResumo | undefined {
  return CAPITULOS_WEBPATH_UTAH.find((capitulo) => capitulo.id === id)
}

export function modalidadeDaEntradaWebPathUtah(tituloOriginal: string): ModalidadeWebPathUtah {
  return /\bgross\b/i.test(tituloOriginal) ? 'macroscopia' : 'microscopia'
}
