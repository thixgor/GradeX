import type { AchadoPatologico } from '../tipos'

/** Lesão e morte celular, e alterações da luz de vísceras. */
export const ACHADOS_LESAO_CELULAR: AchadoPatologico[] = [
  {
    id: 'necrose-coagulativa',
    nome: 'Necrose coagulativa',
    sinonimos: ['necrose isquêmica', 'infarto', 'gangrena'],
    categoria: 'lesao-celular',
    resumo:
      'Morte celular em que o contorno das células e a arquitetura do tecido persistem por dias, mas os núcleos desaparecem e o citoplasma fica rosa-intenso e homogêneo — "células-fantasma".',
    comoReconhecer: [
      'No pequeno aumento: área mais rosa (hipereosinofílica) e mais pálida de azul que o tecido vivo ao lado, com o desenho geral do órgão ainda reconhecível.',
      'No médio aumento: contornos celulares preservados, sem núcleos corados.',
      'No grande aumento: alterações nucleares em sequência — picnose (núcleo pequeno e escuro), cariorrexe (fragmentação) e cariólise (núcleo que "some").',
      'Na borda, com o tempo: neutrófilos (1–3 dias), macrófagos (3–7 dias), tecido de granulação (a partir de ~1 semana).',
    ],
    mecanismo: [
      'A isquemia derruba a produção de ATP: as bombas iônicas falham, a célula incha e a glicólise anaeróbia acidifica o citoplasma.',
      'A acidose desnatura as proteínas estruturais e também as enzimas que digeririam a célula — por isso a "silhueta" se mantém em vez de liquefazer.',
      'A membrana se rompe, o conteúdo vaza (troponina, transaminases, CK) e desencadeia inflamação na borda.',
    ],
    significado: [
      'Padrão típico do infarto de órgãos sólidos (coração, rim, baço) — exceto o cérebro, que liquefaz.',
      'Na parede intestinal ou do apêndice, a necrose transmural define a forma gangrenosa e antecede a perfuração.',
    ],
    ondeOcorre: ['Infarto do miocárdio', 'Infarto renal e esplênico', 'Apendicite gangrenosa', 'Isquemia intestinal', 'Centro de tumores de crescimento rápido'],
    armadilhas: [
      'Autólise (demora na fixação) também apaga núcleos, mas de forma difusa e sem inflamação na borda.',
      'Tecido cauterizado fica rosa e sem núcleos nítidos, porém só na margem cirúrgica e com núcleos "estirados".',
    ],
  },
  {
    id: 'fecalito',
    nome: 'Fecalito (apendicolito)',
    sinonimos: ['apendicolito', 'coprólito'],
    categoria: 'agente',
    resumo:
      'Concreção de fezes endurecidas, às vezes calcificada, dentro da luz do apêndice: material amorfo em camadas, com restos vegetais e bactérias.',
    comoReconhecer: [
      'No pequeno aumento: massa dentro da luz, de bordas nítidas, com lamelas concêntricas.',
      'No médio aumento: restos vegetais (paredes celulares retangulares refráteis), bactérias em massa basofílica, muco; cálcio aparece em roxo-escuro.',
    ],
    mecanismo: [
      'Fezes retidas na luz estreita do apêndice perdem água e se compactam; sais de cálcio podem se depositar.',
      'O fecalito oclui a luz: a secreção de muco continua, a pressão sobe e começa a cadeia obstrução → isquemia → invasão bacteriana.',
    ],
    significado: [
      'Causa mais comum da obstrução que inicia a apendicite no adulto; associado a maior risco de perfuração.',
      'Frequentemente não aparece no corte: a peça é seccionada em fragmentos e o fecalito pode ter se deslocado.',
    ],
    ondeOcorre: ['Apendicite aguda', 'Divertículos colônicos'],
    armadilhas: [
      'Fezes soltas na luz não são fecalito: falta a organização compacta e lamelar.',
    ],
  },
  {
    id: 'perfuracao-da-parede',
    nome: 'Perfuração da parede',
    sinonimos: ['perfuração', 'ruptura'],
    categoria: 'lesao-celular',
    resumo:
      'Descontinuidade de toda a espessura da parede de uma víscera, com necrose e exsudato comunicando a luz com a serosa ou com o tecido ao redor.',
    comoReconhecer: [
      'No pequeno aumento: a muscular própria se interrompe; no lugar, necrose e pus em continuidade da mucosa ao tecido periorgânico.',
      'No médio aumento: bordas da parede necróticas, cercadas de neutrófilos; abscesso ou peritonite fibrinopurulenta do lado de fora.',
    ],
    mecanismo: [
      'A necrose transmural (isquêmica e inflamatória) destrói a camada muscular, que é o que dá resistência à parede.',
      'A pressão intraluminal rompe o tecido enfraquecido e o conteúdo contaminado sai para a cavidade.',
    ],
    significado: [
      'Complicação grave: peritonite, abscesso e sepse. No apêndice, mais comum em crianças pequenas e idosos, que chegam tarde ao diagnóstico.',
    ],
    ondeOcorre: ['Apendicite perfurada', 'Diverticulite', 'Úlcera péptica perfurada', 'Colite fulminante'],
    armadilhas: ['Rasgo pela manipulação cirúrgica tem bordas limpas, sem necrose nem inflamação.'],
  },
  {
    id: 'esteatose-macrovesicular',
    nome: 'Esteatose macrovesicular',
    sinonimos: ['gota grande', 'degeneração gordurosa', 'esteatose'],
    categoria: 'lesao-celular',
    resumo:
      'Hepatócito ocupado por um único vacúolo grande e redondo de gordura, que empurra o núcleo para a periferia — em H&E o vacúolo é "vazio" porque a gordura se dissolve no processamento.',
    comoReconhecer: [
      'No pequeno aumento: o parênquima fica pálido e "rendado", salpicado de buracos brancos redondos.',
      'No grande aumento: vacúolos claros, nítidos, do tamanho do próprio hepatócito, com o núcleo achatado na borda (como um adipócito).',
      'Na esteatose de gotas pequenas a médias, várias gotas convivem na mesma célula; na microvesicular verdadeira, o citoplasma fica espumoso e o núcleo continua central.',
    ],
    mecanismo: [
      'Entra mais ácido graxo no fígado (obesidade, resistência à insulina, álcool) ou sai menos (menos β-oxidação, menos exportação como VLDL).',
      'Os triglicerídeos se acumulam em gotas que se fundem numa gota única e grande.',
    ],
    significado: [
      'É reversível e, isolada, benigna (esteatose simples). Mais de 5 % dos hepatócitos acometidos define esteatose.',
      'O que faz ela progredir para cirrose é a esteato-hepatite: balonização, inflamação e fibrose.',
    ],
    ondeOcorre: ['Doença hepática esteatótica associada à disfunção metabólica (DHGNA/MASLD)', 'Álcool', 'Corticoides, metotrexato', 'Desnutrição (kwashiorkor)'],
    armadilhas: ['Espaços sinusoidais dilatados e artefato de congelamento também deixam buracos; o vacúolo de gordura é redondo, de borda lisa e dentro da célula.'],
  },
  {
    id: 'esteatose-microvesicular',
    nome: 'Esteatose de gotas pequenas / microvesicular',
    sinonimos: ['microesteatose', 'esteatose de pequenas gotas'],
    categoria: 'lesao-celular',
    resumo:
      'Múltiplas gotas pequenas de gordura no citoplasma do hepatócito, com o núcleo ainda central; na forma microvesicular verdadeira, o citoplasma fica espumoso.',
    comoReconhecer: [
      'Vários vacúolos pequenos por célula, de tamanhos iguais ou variados; o núcleo continua no centro.',
      'Na microvesicular verdadeira, as gotas são tão pequenas que o citoplasma parece "espumoso", sem vacúolos individualizados.',
    ],
    mecanismo: [
      'Gotas pequenas podem ser só uma fase de formação da gota grande.',
      'A microvesicular verdadeira reflete falência mitocondrial (β-oxidação bloqueada) e é mais grave.',
    ],
    significado: [
      'Gotas pequenas misturadas a gotas grandes são comuns na esteatose metabólica e alcoólica.',
      'A microvesicular verdadeira difusa é marca de doenças graves: esteatose aguda da gravidez, síndrome de Reye, toxicidade por valproato ou tetraciclina.',
    ],
    ondeOcorre: ['Esteatose metabólica e alcoólica (mista)', 'Esteatose aguda da gravidez', 'Síndrome de Reye', 'Toxicidade mitocondrial por fármacos'],
    armadilhas: ['Hepatócitos com glicogênio abundante também ficam claros, mas sem vacúolos redondos.'],
  },
  {
    id: 'balonizacao-hepatocitaria',
    nome: 'Balonização hepatocitária',
    sinonimos: ['degeneração balonizante', 'hepatócito balonizado'],
    categoria: 'lesao-celular',
    resumo:
      'Hepatócito aumentado, arredondado, de citoplasma claro e rarefeito (em "teia"), às vezes com corpúsculo de Mallory — a lesão celular que distingue a esteato-hepatite da esteatose simples.',
    comoReconhecer: [
      'Célula 1,5–2 vezes maior que as vizinhas, redonda, com citoplasma pálido e floculado, sem o vacúolo nítido da gordura.',
      'Muitas vezes na zona 3 (perto da veia centrolobular), com inflamação e fibrose pericelular ao redor.',
    ],
    mecanismo: ['Lesão do citoesqueleto (queratinas 8/18 degradadas pelo estresse oxidativo) e retenção de líquido.'],
    significado: ['Critério de esteato-hepatite (MASH/NASH ou alcoólica): indica lesão ativa com risco de fibrose.'],
    ondeOcorre: ['Esteato-hepatite metabólica e alcoólica'],
    armadilhas: ['Hepatócitos claros por glicogênio ou edema de artefato não são balonizados.'],
  },
  {
    id: 'necrose-caseosa',
    nome: 'Necrose caseosa',
    sinonimos: ['caseificação', 'caseum', 'necrose caseificante'],
    categoria: 'lesao-celular',
    resumo:
      'Necrose em que a arquitetura do tecido desaparece por completo e fica um material eosinofílico, amorfo e granuloso, com poeira nuclear — "como queijo" na macroscopia —, cercado por granulomas.',
    comoReconhecer: [
      'No pequeno aumento: áreas rosa-pálidas, homogêneas e amorfas, sem nenhum contorno de célula, vaso ou fibra, com borda arroxeada (a reação granulomatosa).',
      'No grande aumento: material granular fino, eosinofílico, com fragmentos nucleares esparsos; ao redor, macrófagos epitelioides em paliçada, células gigantes de Langhans e linfócitos.',
      'Diferente da necrose coagulativa, as "células-fantasma" não se reconhecem.',
    ],
    mecanismo: [
      'A resposta imune celular (Th1, IFN-γ, TNF) contra antígenos da micobactéria mata os macrófagos infectados e o tecido ao redor.',
      'Os lipídios da parede micobacteriana (ácidos micólicos) e a hipóxia do centro do granuloma dão o aspecto seco e granular.',
      'O caseum pode calcificar (lesão cicatrizada) ou liquefazer e drenar, formando cavidades (tuberculose pulmonar cavitária).',
    ],
    significado: [
      'Muito sugestiva de tuberculose; também ocorre em infecções fúngicas (histoplasmose, criptococose) — confirme com Ziehl-Neelsen, cultura ou PCR.',
      'Granuloma com necrose caseosa × sem necrose (sarcoidose, Crohn) é uma das distinções mais cobradas em prova.',
    ],
    ondeOcorre: ['Tuberculose (pulmão, linfonodos, rim, osso)', 'Infecções fúngicas', 'Algumas micobacterioses atípicas'],
    armadilhas: [
      'Necrose de tumores e de infartos antigos pode ficar amorfa, mas não é cercada por granulomas epitelioides com células de Langhans.',
      'Necrose supurativa (abscesso) é cheia de neutrófilos, não de restos granulares.',
    ],
  },
]
