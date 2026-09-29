import type { DoencaZoom } from '../tipos'

/** Coração e vasos. */
export const DOENCAS_CARDIOVASCULAR: DoencaZoom[] = [
  {
    id: 'infarto-do-miocardio',
    nome: 'Infarto do miocárdio',
    sinonimos: ['infarto agudo do miocárdio', 'IAM', 'necrose miocárdica isquêmica', 'infarto cicatrizado'],
    nomesEmIngles: ['myocardial infarction', 'old myocardial infarct'],
    sistema: 'cardiovascular',
    orgao: 'coracao',
    prioridade: 1,
    resumo:
      'Necrose coagulativa do miocárdio por isquemia prolongada, quase sempre por trombo sobre placa aterosclerótica rota; a lâmina muda com o tempo — neutrófilos nos primeiros dias, tecido de granulação na segunda semana e cicatriz colágena após 6–8 semanas.',
    epidemiologia:
      'Principal causa de morte no Brasil e no mundo. Fatores de risco: idade, sexo masculino, tabagismo, hipertensão, diabetes, dislipidemia, obesidade e história familiar.',
    patogenese: [
      'Uma placa aterosclerótica coronariana sofre ruptura ou erosão; o colágeno e o fator tecidual expostos ativam plaquetas e coagulação, formando um trombo oclusivo.',
      'Sem fluxo, o miócito passa à glicólise anaeróbia: em segundos perde contratilidade; em 20–40 minutos, a lesão fica irreversível.',
      'A necrose avança do subendocárdio (mais distante das coronárias epicárdicas) para o epicárdio em 3–6 horas — é a janela para reperfundir.',
      '0–24 h: fibras onduladas e hipereosinofílicas; 1–3 dias: necrose coagulativa com perda de núcleos e neutrófilos na borda; 3–7 dias: macrófagos removem os miócitos mortos (fase mais frágil, risco de ruptura).',
      '1–2 semanas: tecido de granulação; 2–8 semanas: deposição de colágeno; após 2 meses: cicatriz densa e pobre em células.',
    ],
    roteiro: [
      'Panorâmico: procure áreas de cor diferente no miocárdio — faixas arroxeadas (inflamação) ou zonas pálidas e homogêneas (cicatriz).',
      'Infarto agudo: nas fibras, veja hipereosinofilia, perda das estriações e dos núcleos (necrose coagulativa) e, entre elas, neutrófilos e hemorragia.',
      'Compare com o miocárdio viável: fibras com núcleo central, estriações e sem células inflamatórias entre elas.',
      'Infarto antigo: substitua a pergunta "há neutrófilos?" por "o miocárdio foi trocado por colágeno?" — faixas de colágeno denso, rosa-pálido, com poucas células, e ilhas de miócitos presas na borda.',
      'Estime a idade da lesão pelo tipo de célula e de matriz presentes: isso é o que o legista e o patologista fazem na prática.',
    ],
    achados: [
      {
        achado: 'necrose-coagulativa',
        tipo: 'especifico',
        comoAparece: 'Fibras hipereosinofílicas, sem núcleos ou com núcleos picnóticos e fragmentados, com a silhueta preservada (infarto de 1–3 dias).',
        peso: 'criterio',
      },
      {
        achado: 'infiltrado-neutrofilico',
        tipo: 'geral',
        comoAparece: 'Neutrófilos entre as fibras necróticas, mais densos na borda do infarto (pico em 1–3 dias).',
        peso: 'frequente',
      },
      {
        achado: 'hemorragia-intersticial',
        tipo: 'geral',
        comoAparece: 'Hemácias dissecando o interstício, sobretudo em infartos reperfundidos.',
        peso: 'ocasional',
      },
      {
        achado: 'tecido-de-granulacao',
        tipo: 'geral',
        comoAparece: 'Capilares novos, fibroblastos e macrófagos substituindo o músculo necrótico (1–2 semanas).',
        peso: 'frequente',
      },
      {
        achado: 'fibrose-cicatricial',
        tipo: 'especifico',
        comoAparece: 'Colágeno denso e pobre em células no lugar do miocárdio (infarto antigo, após 6–8 semanas).',
        peso: 'criterio',
      },
    ],
    diferenciais: [
      {
        nome: 'Miocardite',
        comoSeparar: 'Infiltrado predominantemente linfocitário, multifocal, com necrose de miócitos isolados — não uma área de necrose em bloco num território coronariano.',
      },
      {
        nome: 'Necrose em bandas de contração (reperfusão, catecolaminas)',
        comoSeparar: 'Faixas transversais hipereosinofílicas nas fibras, por influxo de cálcio; aparecem na borda de infartos reperfundidos e após catecolaminas em excesso.',
      },
      {
        nome: 'Fibrose de cardiomiopatia',
        comoSeparar: 'Fibrose intersticial difusa, sem distribuição de território coronariano e sem cicatriz transmural em bloco.',
      },
    ],
    correlacaoClinica: [
      'Dor torácica em aperto, prolongada, com irradiação; supradesnivelamento de ST no ECG; troponina elevada (liberada pela membrana rota das fibras necróticas).',
      'Tempo é músculo: reperfusão (angioplastia ou trombólise) nas primeiras horas limita a extensão da necrose.',
      'Complicações seguem o calendário histológico: arritmias nas primeiras horas; ruptura de parede, septo ou músculo papilar entre 3 e 7 dias (fase de macrófagos, tecido amolecido); aneurisma ventricular e insuficiência cardíaca com a cicatriz.',
    ],
    comparacaoComNormal: [
      'No miocárdio normal, as fibras são rosa, ramificadas, com um núcleo central, estriações e discos intercalares, e quase não há células entre elas.',
      'No infarto agudo, as fibras ficam mais vermelhas e sem núcleo, e os espaços entre elas se enchem de neutrófilos e hemácias.',
      'No infarto antigo, no lugar das fibras há colágeno — rosa-pálido, sem estriações e com poucos núcleos finos.',
    ],
  },
  {
    id: 'pericardite-fibrinosa',
    nome: 'Pericardite fibrinosa',
    sinonimos: ['pericardite aguda', 'pericardite serofibrinosa', 'coração em pão com manteiga'],
    nomesEmIngles: ['fibrinous pericarditis', 'acute pericarditis'],
    sistema: 'cardiovascular',
    orgao: 'coracao',
    prioridade: 2,
    resumo:
      'Inflamação aguda do pericárdio com exsudato rico em fibrina depositado sobre o epicárdio — a superfície fica áspera e felpuda ("pão com manteiga") — e, com o tempo, organização por tecido de granulação.',
    epidemiologia:
      'A forma mais comum de pericardite. Causas: viral (a maioria dos casos idiopáticos), pós-infarto (precoce, 1–3 dias, ou síndrome de Dressler, semanas depois), uremia, febre reumática, lúpus e outras colagenoses, radiação, pós-cirurgia cardíaca e tuberculose.',
    patogenese: [
      'O agressor (vírus, necrose miocárdica transmural, toxinas urêmicas, imunocomplexos) lesa o mesotélio e os vasos do pericárdio.',
      'A permeabilidade vascular aumenta e sai plasma rico em fibrinogênio, que se converte em fibrina sobre as superfícies serosas.',
      'Neutrófilos e depois macrófagos e linfócitos se juntam à rede de fibrina.',
      'O atrito dos dois folhetos recobertos de fibrina produz o atrito pericárdico audível.',
      'Se a fibrina não é removida, fibroblastos e capilares a invadem (organização): aderências e, raramente, pericardite constritiva.',
    ],
    roteiro: [
      'Panorâmico: identifique o miocárdio e, por fora dele, a gordura epicárdica; procure na superfície externa uma camada rosa, irregular e "felpuda".',
      'Médio aumento: a camada é fibrina em rede ou em placas, com células inflamatórias presas; não há mesotélio liso.',
      'Logo abaixo da fibrina, procure tecido de granulação — capilares novos e fibroblastos — invadindo o exsudato (organização).',
      'Grande aumento: identifique neutrófilos, linfócitos e macrófagos; veja se o miocárdio subjacente está preservado.',
    ],
    achados: [
      {
        achado: 'exsudato-fibrinopurulento',
        tipo: 'especifico',
        comoAparece: 'Fibrina eosinofílica em rede ou em placas sobre o epicárdio, com células inflamatórias presas na malha.',
        peso: 'criterio',
      },
      {
        achado: 'tecido-de-granulacao',
        tipo: 'geral',
        comoAparece: 'Capilares neoformados e fibroblastos sob e dentro da fibrina: organização do exsudato.',
        peso: 'frequente',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Linfócitos e macrófagos no tecido subepicárdico nas fases mais tardias.',
        peso: 'frequente',
      },
      {
        achado: 'infiltrado-neutrofilico',
        tipo: 'geral',
        comoAparece: 'Neutrófilos no exsudato, mais numerosos nas fases iniciais e nas causas bacterianas (purulenta).',
        peso: 'frequente',
      },
      {
        achado: 'hiperemia-e-congestao',
        tipo: 'geral',
        comoAparece: 'Vasos subepicárdicos dilatados.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Pericardite purulenta',
        comoSeparar: 'Exsudato dominado por neutrófilos e pus, geralmente bacteriana; mais grave.',
      },
      {
        nome: 'Pericardite tuberculosa',
        comoSeparar: 'Granulomas com necrose caseosa no pericárdio espessado.',
      },
      {
        nome: 'Pericardite neoplásica',
        comoSeparar: 'Células malignas (carcinoma de pulmão, mama, linfoma) no pericárdio, geralmente com derrame hemorrágico.',
      },
      {
        nome: 'Coágulo aderido à superfície',
        comoSeparar: 'Predominam hemácias em camadas, sem organização por tecido de granulação e sem reação do epicárdio.',
      },
    ],
    correlacaoClinica: [
      'Dor torácica pleurítica que melhora ao sentar inclinado para a frente; atrito pericárdico à ausculta.',
      'ECG com supradesnivelamento difuso do ST e infradesnivelamento do PR; ecocardiograma pode mostrar derrame.',
      'Tratamento da causa; AINE e colchicina na viral/idiopática. Grandes derrames podem causar tamponamento.',
    ],
    comparacaoComNormal: [
      'No coração normal, o epicárdio é uma camada fina de mesotélio sobre tecido adiposo e vasos coronários, com superfície lisa.',
      'Na pericardite fibrinosa, essa superfície fica recoberta por fibrina e células inflamatórias, e o tecido subepicárdico se enche de capilares novos e fibroblastos.',
    ],
  },
  {
    id: 'aterosclerose',
    nome: 'Aterosclerose',
    sinonimos: ['ateroma', 'placa aterosclerótica', 'doença aterosclerótica'],
    nomesEmIngles: ['atherosclerosis', 'atheroma'],
    sistema: 'cardiovascular',
    orgao: 'aorta',
    prioridade: 3,
    resumo:
      'Doença crônica das artérias de grande e médio calibre em que a íntima acumula lipídio, macrófagos espumosos, células musculares lisas e colágeno, formando placas com núcleo necrótico rico em colesterol e capa fibrosa — base do infarto, do AVC e dos aneurismas da aorta.',
    epidemiologia:
      'Principal causa de morte no mundo por suas consequências (infarto, AVC, doença arterial periférica, aneurisma de aorta abdominal). Fatores de risco: idade, sexo masculino, hipercolesterolemia (LDL), hipertensão, tabagismo, diabetes, obesidade e história familiar.',
    patogenese: [
      'Lesão endotelial crônica (hipertensão, tabaco, hiperglicemia, fluxo turbulento nas bifurcações) aumenta a permeabilidade e a adesividade do endotélio.',
      'LDL entra na íntima, é retida e oxidada; monócitos aderem, migram e viram macrófagos que captam a LDL oxidada — células espumosas (estria gordurosa).',
      'Citocinas e fatores de crescimento (PDGF) atraem células musculares lisas da média, que proliferam na íntima e produzem colágeno: forma-se a capa fibrosa.',
      'Células espumosas morrem e liberam lipídio: o núcleo necrótico, com cristais de colesterol, cresce sob a capa.',
      'Placas com capa fina e núcleo grande rompem; o trombo formado sobre elas oclui a artéria (infarto). Na aorta, a placa enfraquece a média e favorece o aneurisma, com trombo mural.',
    ],
    roteiro: [
      'Panorâmico: compare a espessura da parede ao redor da circunferência — a placa é um espessamento excêntrico da íntima.',
      'Na placa, procure o núcleo com fendas de colesterol (agulhas brancas) e material amorfo.',
      'Entre o núcleo e a luz, identifique a capa fibrosa (colágeno e células musculares lisas).',
      'Grande aumento: células espumosas (citoplasma claro vacuolado) ao redor do núcleo; hemorragia dentro da placa.',
      'Procure trombo aderido à superfície (mural) e compare com a parede sem placa (média íntegra, íntima fina).',
    ],
    achados: [
      {
        achado: 'fendas-de-colesterol',
        tipo: 'especifico',
        comoAparece: 'Agulhas brancas no núcleo lipídico-necrótico da placa.',
        peso: 'criterio',
      },
      {
        achado: 'celulas-espumosas',
        tipo: 'especifico',
        comoAparece: 'Macrófagos de citoplasma vacuolado em torno do núcleo e na íntima.',
        peso: 'frequente',
      },
      {
        achado: 'fibrose-cicatricial',
        tipo: 'geral',
        comoAparece: 'Capa fibrosa de colágeno separando o núcleo da luz.',
        peso: 'criterio',
      },
      {
        achado: 'hemorragia-intersticial',
        tipo: 'geral',
        comoAparece: 'Hemorragia dentro da placa, que a expande e desestabiliza.',
        peso: 'ocasional',
      },
      {
        achado: 'trombo-com-linhas-de-zahn',
        tipo: 'geral',
        comoAparece: 'Trombo aderido à placa: oclusivo nas coronárias, mural nos aneurismas.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Arteriosclerose de Mönckeberg',
        comoSeparar: 'Calcificação da MÉDIA de artérias musculares em idosos, sem estreitar a luz nem formar placa.',
      },
      {
        nome: 'Arteriolosclerose hialina',
        comoSeparar: 'Espessamento homogêneo e rosa de arteríolas pequenas (hipertensão, diabetes), sem lipídio nem necrose.',
      },
      {
        nome: 'Aortite (Takayasu, células gigantes, sífilis)',
        comoSeparar: 'Inflamação granulomatosa ou linfoplasmocitária da média e da adventícia, com destruição das lâminas elásticas.',
      },
    ],
    correlacaoClinica: [
      'Silenciosa até estreitar a luz (angina estável, claudicação) ou romper e tromboses (síndrome coronariana aguda, AVC).',
      'Na aorta abdominal, a placa enfraquece a parede: aneurisma, que pode romper (dor abdominal ou lombar e choque).',
      'Prevenção e tratamento: estatinas, controle de pressão, diabetes, cessação do tabagismo, antiagregantes; revascularização quando indicada.',
    ],
    comparacaoComNormal: [
      'Na aorta normal, a íntima é uma camada fina de endotélio; a média é espessa, com lâminas elásticas paralelas e músculo liso.',
      'Na aterosclerose, a íntima cresce muito — colágeno, macrófagos espumosos e um núcleo com fendas de colesterol — e a média sob a placa fica adelgaçada.',
    ],
  },
  {
    id: 'trombose-arterial',
    nome: 'Trombose arterial',
    sinonimos: ['trombo arterial', 'trombose', 'oclusão trombótica'],
    nomesEmIngles: ['arterial thrombosis', 'thrombus'],
    sistema: 'cardiovascular',
    orgao: 'arteria-muscular',
    prioridade: 4,
    resumo:
      'Formação, em vida, de uma massa sólida de plaquetas, fibrina e hemácias dentro de uma artéria, aderida à parede e com linhas de Zahn — obstrui o fluxo e causa isquemia e infarto a jusante.',
    epidemiologia:
      'A trombose sobre placa aterosclerótica é a causa imediata da maioria dos infartos do miocárdio e dos AVC isquêmicos. Outras causas: vasculites, dissecção, síndrome antifosfolipídica, neoplasias e trombofilias.',
    patogenese: [
      'Lesão endotelial expõe colágeno e fator tecidual (placa rota, erosão, vasculite).',
      'Plaquetas aderem (fator de von Willebrand), se ativam, liberam ADP e tromboxano A2 e agregam.',
      'A cascata da coagulação gera trombina e fibrina, que consolidam o tampão e prendem hemácias.',
      'No fluxo arterial, camadas de plaquetas e fibrina se alternam com camadas de hemácias: linhas de Zahn.',
      'O trombo cresce até ocluir a luz; depois pode embolizar, dissolver-se (fibrinólise) ou organizar-se, sendo invadido por células a partir da parede.',
    ],
    roteiro: [
      'Panorâmico: artéria com a luz ocupada por massa vermelha.',
      'Médio aumento: procure camadas alternadas rosa-pálidas (fibrina/plaquetas) e vermelhas (hemácias) — linhas de Zahn — que provam formação em vida.',
      'Localize o ponto de fixação à parede e veja se células e capilares entram no trombo (organização).',
      'Examine a parede: íntima espessada por placa ou fibrose (a causa do trombo).',
    ],
    achados: [
      {
        achado: 'trombo-com-linhas-de-zahn',
        tipo: 'especifico',
        comoAparece: 'Massa aderida à parede, com camadas alternadas de fibrina/plaquetas e hemácias.',
        peso: 'criterio',
      },
      {
        achado: 'organizacao-do-trombo',
        tipo: 'especifico',
        comoAparece: 'Células fusiformes e capilares invadindo o trombo a partir da parede.',
        peso: 'frequente',
      },
      {
        achado: 'espessamento-arterial',
        tipo: 'geral',
        comoAparece: 'Íntima espessada por fibrose ou placa, sobre a qual o trombo se formou.',
        peso: 'frequente',
      },
      {
        achado: 'fendas-de-colesterol',
        tipo: 'geral',
        comoAparece: 'Se a causa é placa aterosclerótica, o núcleo com fendas de colesterol aparece sob o trombo.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Coágulo post-mortem',
        comoSeparar: 'Homogêneo, gelatinoso, sem linhas de Zahn e sem aderência à parede; com camada amarela (plasma) sobre a vermelha.',
      },
      {
        nome: 'Êmbolo',
        comoSeparar: 'Material vindo de outro lugar, sem ponto de fixação na parede local; pode conter placa, gordura, tumor.',
      },
      {
        nome: 'Hiperplasia endotelial papilar intravascular (tumor de Masson)',
        comoSeparar: 'Papilas revestidas por endotélio sobre trombo organizado, dentro de um vaso dilatado.',
      },
    ],
    correlacaoClinica: [
      'Os sintomas dependem do território: infarto do miocárdio, AVC, isquemia mesentérica ou de membros (dor, palidez, ausência de pulso).',
      'Tratamento: antiagregantes, anticoagulação, trombólise ou trombectomia e revascularização conforme o leito.',
      'Trombos venosos (TVP) são mais vermelhos, com menos plaquetas, e embolizam para o pulmão.',
    ],
    comparacaoComNormal: [
      'Na artéria muscular normal, a luz é livre e a íntima é fina, com lâmina elástica interna ondulada e média de músculo liso em camadas.',
      'Na trombose, a luz é ocupada por uma massa em camadas aderida à parede, e a íntima costuma estar espessada.',
    ],
  },
  {
    id: 'cardiopatia-reumatica',
    nome: 'Febre reumática — cardiopatia reumática crônica',
    sinonimos: ['febre reumática', 'doença reumática do coração', 'valvopatia reumática', 'estenose mitral reumática'],
    nomesEmIngles: ['rheumatic heart disease', 'rheumatic fever', 'chronic rheumatic valvulitis'],
    sistema: 'cardiovascular',
    orgao: 'coracao',
    prioridade: 5,
    resumo:
      'Sequela cardíaca da febre reumática: surtos de valvulite imunológica após faringites estreptocócicas deixam os folhetos valvares (sobretudo mitral) espessados, fibrosos, vascularizados e fundidos — estenose e insuficiência valvar.',
    epidemiologia:
      'Ainda frequente no Brasil e em países de baixa renda, em crianças e adolescentes de 5 a 15 anos com faringite estreptocócica não tratada; a valvopatia se manifesta décadas depois. É a principal causa de estenose mitral no mundo.',
    patogenese: [
      'Faringite por estreptococo β-hemolítico do grupo A; em indivíduos predispostos, 2–3 semanas depois surge a resposta imune cruzada.',
      'Anticorpos e linfócitos T contra a proteína M reconhecem proteínas do coração (miosina, proteínas valvares): pancardite aguda com nódulos de Aschoff e verrugas pequenas na linha de fechamento das valvas.',
      'Cada surto inflama o folheto; a cicatrização o espessa com colágeno e faz crescer vasos dentro dele.',
      'Após anos, os folhetos ficam espessos, rígidos e às vezes calcificados; as comissuras se fundem (valva em "boca de peixe") e as cordas tendíneas encurtam.',
      'Resultado: estenose (mitral principalmente) e insuficiência, com dilatação do átrio esquerdo, fibrilação atrial, trombos e hipertensão pulmonar.',
    ],
    roteiro: [
      'Panorâmico: reconheça o folheto valvar — uma lâmina de tecido conjuntivo — e compare sua espessura em toda a extensão: a porção doente fica muito espessa.',
      'Médio aumento: procure vasos dentro do folheto (a valva normal não tem vasos) e colágeno denso desorganizado.',
      'Grande aumento: linfócitos e plasmócitos ao redor dos vasos; procure calcificação (grumos roxos) e, se houver atividade, nódulos de Aschoff.',
    ],
    achados: [
      {
        achado: 'fibrose-cicatricial',
        tipo: 'geral',
        comoAparece: 'Folheto muito espessado por colágeno denso e desorganizado.',
        peso: 'criterio',
      },
      {
        achado: 'neovascularizacao-valvar',
        tipo: 'especifico',
        comoAparece: 'Vasos de parede espessa espalhados no folheto, que normalmente é avascular.',
        peso: 'criterio',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Linfócitos e plasmócitos perivasculares no folheto.',
        peso: 'frequente',
      },
      {
        achado: 'corpusculo-de-aschoff',
        tipo: 'especifico',
        comoAparece: 'Só na fase ativa (cardite aguda); raro na valvopatia crônica.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Valvopatia degenerativa calcificada (aórtica senil)',
        comoSeparar: 'Calcificação nodular na face aórtica dos folhetos, sem fusão de comissuras nem neovascularização inflamatória.',
      },
      {
        nome: 'Degeneração mixomatosa (prolapso mitral)',
        comoSeparar: 'Folheto espessado por matriz mixoide frouxa (azulada), não por colágeno denso com vasos.',
      },
      {
        nome: 'Endocardite infecciosa',
        comoSeparar: 'Vegetações friáveis de fibrina, neutrófilos e colônias bacterianas, com destruição do folheto.',
      },
    ],
    correlacaoClinica: [
      'Febre reumática aguda: critérios de Jones (cardite, poliartrite migratória, coreia de Sydenham, eritema marginado, nódulos subcutâneos) + evidência de estreptococo.',
      'Crônica: estenose mitral — dispneia, hemoptise, fibrilação atrial, AVC embólico; sopro diastólico em ruflar com estalido de abertura.',
      'Prevenção: tratar a faringite estreptocócica (penicilina) e profilaxia secundária com penicilina benzatina após o primeiro surto.',
    ],
    comparacaoComNormal: [
      'O folheto valvar normal é fino, com camadas de colágeno e matriz frouxa, recoberto por endotélio e sem vasos.',
      'Na valvopatia reumática, o folheto fica muitas vezes mais espesso, com colágeno denso, vasos e linfócitos.',
    ],
  },
]
