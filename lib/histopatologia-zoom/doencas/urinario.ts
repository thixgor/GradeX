import type { DoencaZoom } from '../tipos'

/** Rim e vias urinárias. */
export const DOENCAS_URINARIO: DoencaZoom[] = [
  {
    id: 'pielonefrite-cronica',
    nome: 'Pielonefrite crônica',
    sinonimos: ['nefrite tubulointersticial crônica', 'nefropatia de refluxo', 'pielonefrite crônica obstrutiva'],
    nomesEmIngles: ['chronic pyelonephritis', 'reflux nephropathy'],
    sistema: 'urinario',
    orgao: 'rim',
    prioridade: 1,
    resumo:
      'Inflamação crônica do interstício renal e dos cálices, consequente a infecções urinárias de repetição sobre refluxo vesicoureteral ou obstrução: infiltrado linfoplasmocitário, fibrose intersticial e túbulos atróficos com cilindros ("tireoidização"), com cicatrizes corticais irregulares.',
    epidemiologia:
      'Causa importante de doença renal crônica, sobretudo em crianças com refluxo vesicoureteral (nefropatia de refluxo) e em adultos com obstrução (cálculos, hiperplasia prostática, malformações). Mais comum em mulheres.',
    patogenese: [
      'Bactérias da uretra (E. coli, na maioria) ascendem à bexiga.',
      'Com refluxo vesicoureteral ou obstrução, a urina infectada alcança a pelve e, pelo refluxo intrarrenal nos polos, penetra no parênquima.',
      'Neutrófilos destroem túbulos (pielonefrite aguda); episódios repetidos substituem a inflamação aguda por linfócitos, plasmócitos e fibrose.',
      'Néfrons perdidos deixam túbulos atróficos com cilindros (tireoidização) e cicatrizes grosseiras e irregulares sobre cálices deformados.',
      'Os glomérulos são relativamente poupados no início (fibrose periglomerular); depois, hipertensão e esclerose glomerular secundária agravam a perda de função.',
    ],
    roteiro: [
      'Panorâmico: rim com áreas irregulares de cicatriz — faixas mais escuras (inflamação) e mais pálidas (fibrose) — alternando com parênquima preservado.',
      'Médio aumento: interstício alargado por linfócitos, plasmócitos e colágeno; túbulos afastados e atróficos.',
      'Procure grupos de túbulos dilatados com cilindros rosa homogêneos: a tireoidização.',
      'Observe os glomérulos (relativamente preservados, às vezes com fibrose ao redor) e as artérias (parede espessada).',
      'Busque neutrófilos em túbulos e cilindros leucocitários: indicam surto agudo sobre o crônico.',
    ],
    achados: [
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Linfócitos e plasmócitos densos no interstício, em faixas irregulares.',
        peso: 'criterio',
      },
      {
        achado: 'tireoidizacao-tubular',
        tipo: 'especifico',
        comoAparece: 'Túbulos atróficos e dilatados com cilindros eosinofílicos homogêneos.',
        peso: 'criterio',
      },
      {
        achado: 'fibrose-intersticial',
        tipo: 'geral',
        comoAparece: 'Colágeno afastando os túbulos, nas áreas cicatriciais.',
        peso: 'frequente',
      },
      {
        achado: 'espessamento-arterial',
        tipo: 'geral',
        comoAparece: 'Artérias com íntima espessada — reflexo da hipertensão secundária.',
        peso: 'frequente',
      },
      {
        achado: 'infiltrado-neutrofilico',
        tipo: 'geral',
        comoAparece: 'Neutrófilos em túbulos e no interstício quando há surto agudo.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Nefrite tubulointersticial por drogas',
        comoSeparar: 'Infiltrado difuso com muitos eosinófilos e tubulite, sem cicatrizes corticais grosseiras nem deformidade calicial; história de AINE, antibióticos, IBP.',
      },
      {
        nome: 'Nefroesclerose hipertensiva',
        comoSeparar: 'Cicatrizes finas e difusas, glomérulos globalmente esclerosados e arteríolas hialinas, com pouca inflamação intersticial.',
      },
      {
        nome: 'Pielonefrite xantogranulomatosa',
        comoSeparar: 'Lençóis de macrófagos espumosos (xantomatosos) em torno de cálculo coraliforme, simulando tumor.',
      },
    ],
    correlacaoClinica: [
      'História de infecções urinárias de repetição, refluxo na infância ou obstrução; pode ser silenciosa até surgirem hipertensão e insuficiência renal.',
      'Imagem: rins pequenos, assimétricos, com cicatrizes polares sobre cálices deformados (em taco).',
      'Na urina, piúria, cilindros leucocitários e proteinúria discreta.',
      'Prevenção: tratar infecções e corrigir o refluxo ou a obstrução precocemente.',
    ],
    comparacaoComNormal: [
      'No rim normal, os túbulos contorcidos se encostam uns nos outros, com interstício quase invisível, e os glomérulos se distribuem regularmente no córtex.',
      'Na pielonefrite crônica, o interstício fica largo, inflamado e fibroso, e muitos túbulos encolhem ou viram cistos cheios de cilindros rosa.',
    ],
  },
  {
    id: 'carcinoma-renal-de-celulas-claras',
    nome: 'Carcinoma de células renais de células claras',
    sinonimos: ['carcinoma renal convencional', 'hipernefroma', 'adenocarcinoma renal', 'tumor de Grawitz'],
    nomesEmIngles: ['clear cell renal cell carcinoma', 'conventional renal cell carcinoma'],
    sistema: 'urinario',
    orgao: 'rim',
    prioridade: 12,
    resumo:
      'Tumor maligno do epitélio do túbulo proximal, formado por ninhos de células de citoplasma claro separados por uma rede capilar delicada; é o câncer renal mais comum.',
    epidemiologia:
      'Cerca de 70 % dos carcinomas renais; pico aos 60–70 anos, mais em homens. Fatores de risco: tabagismo, obesidade, hipertensão, doença cística adquirida da diálise e a síndrome de von Hippel-Lindau (tumores múltiplos e precoces).',
    patogenese: [
      'Perda das duas cópias do gene supressor VHL (3p25): deleção de 3p em quase todos os casos e mutação ou metilação da outra cópia.',
      'Sem VHL, o fator induzido por hipóxia (HIF) não é degradado e ativa genes como se a célula estivesse em hipóxia: VEGF, PDGF, transportadores de glicose.',
      'Resultado: acúmulo de glicogênio e lipídios (células claras) e angiogênese intensa (rede capilar, hemorragia).',
      'Mutações adicionais (PBRM1, SETD2, BAP1) aumentam a agressividade; o tumor invade a veia renal e dá metástases para pulmão e osso.',
    ],
    roteiro: [
      'Panorâmico: massa bem delimitada, por pseudocápsula, de aspecto variegado — áreas claras, hemorragia e cistos (na peça, amarelo-ouro).',
      'Médio aumento: ninhos e ácinos de células claras envolvidos por capilares finos ("tela de galinheiro").',
      'Grande aumento: gradue o núcleo pelo nucléolo (ISUP 1–4) e procure áreas sarcomatoides ou rabdoides (grau 4) e necrose.',
      'Procure invasão da cápsula, da gordura perirrenal e da veia renal (estadiamento).',
    ],
    achados: [
      {
        achado: 'celulas-claras-neoplasicas',
        tipo: 'especifico',
        comoAparece: 'Ninhos e ácinos de células poligonais de citoplasma claro e membranas nítidas.',
        peso: 'criterio',
      },
      {
        achado: 'rede-capilar-delicada',
        tipo: 'especifico',
        comoAparece: 'Capilares finos com hemácias envolvendo cada ninho.',
        peso: 'criterio',
      },
      {
        achado: 'hemorragia-intersticial',
        tipo: 'geral',
        comoAparece: 'Hemorragia recente e cistos hemorrágicos dentro do tumor.',
        peso: 'frequente',
      },
      {
        achado: 'pseudocapsula-fibrosa',
        tipo: 'geral',
        comoAparece: 'Faixa fibrosa separando o tumor do rim ou da gordura perirrenal.',
        peso: 'frequente',
      },
      {
        achado: 'necrose-coagulativa',
        tipo: 'geral',
        comoAparece: 'Necrose tumoral nos tumores de alto grau — fator de pior prognóstico.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Carcinoma renal cromófobo',
        comoSeparar: 'Células grandes com membranas espessas, núcleos enrugados e halos perinucleares; vasos de parede grossa em vez de rede capilar delicada.',
      },
      {
        nome: 'Carcinoma papilífero',
        comoSeparar: 'Papilas com eixo fibrovascular e macrófagos espumosos; as células claras, quando existem, são focais.',
      },
      {
        nome: 'Adenoma adrenal cortical',
        comoSeparar: 'Pode invadir o polo superior do rim; células de citoplasma vacuolado (lipídio) em cordões, sem rede capilar de "galinheiro"; imuno (PAX8 negativo).',
      },
    ],
    correlacaoClinica: [
      'A tríade clássica (hematúria, dor lombar e massa palpável) aparece em < 10 %; hoje, a maioria é achado incidental em ultrassom ou TC.',
      'Síndromes paraneoplásicas: policitemia (eritropoetina), hipercalcemia (PTHrP), hipertensão (renina), síndrome de Stauffer.',
      'Tratamento: nefrectomia parcial ou radical; na doença metastática, inibidores de VEGF (sunitinibe) e imunoterapia (anti-PD-1).',
    ],
    comparacaoComNormal: [
      'No rim normal, o túbulo proximal tem células cúbicas de citoplasma rosa (eosinofílico) e borda em escova, ao redor de uma luz.',
      'No carcinoma de células claras, as células perdem a organização tubular, o citoplasma fica branco e os ninhos ficam envoltos por capilares.',
    ],
  },
  {
    id: 'carcinoma-renal-papilifero',
    nome: 'Carcinoma de células renais papilífero',
    sinonimos: ['carcinoma papilar renal', 'carcinoma tubulopapilífero renal', 'carcinoma cromófilo'],
    nomesEmIngles: ['papillary renal cell carcinoma'],
    sistema: 'urinario',
    orgao: 'rim',
    prioridade: 13,
    resumo:
      'Segundo tipo mais comum de carcinoma renal: papilas e túbulos revestidos por células cúbicas, com eixos fibrovasculares frequentemente cheios de macrófagos espumosos.',
    epidemiologia:
      '10–15 % dos carcinomas renais. Mais comum em homens; associado a doença renal terminal (doença cística adquirida). Formas hereditárias: mutação de MET (carcinoma papilífero hereditário) e de fumarato hidratase (FH, leiomiomatose hereditária — tumores agressivos).',
    patogenese: [
      'Ganhos cromossômicos (trissomias 7 e 17) e perda do Y nos casos esporádicos.',
      'Ativação de MET (receptor do fator de crescimento de hepatócitos) nos casos hereditários: proliferação do epitélio tubular sobre eixos vasculares.',
      'Os eixos acumulam macrófagos que fagocitam lipídios e hemácias (espumosos e com hemossiderina).',
    ],
    roteiro: [
      'Panorâmico: tumor bem delimitado por pseudocápsula, ao lado do rim normal (compare túbulos e glomérulos).',
      'Médio aumento: papilas e túbulos; nos eixos, macrófagos espumosos; às vezes corpos psamomatosos e hemossiderina.',
      'Grande aumento: células cúbicas de citoplasma escasso (baixo grau) ou abundante e eosinofílico com núcleos grandes; gradue pelo nucléolo.',
    ],
    achados: [
      {
        achado: 'papilas-com-eixo-fibrovascular',
        tipo: 'especifico',
        comoAparece: 'Papilas e túbulos revestidos por células cúbicas, com eixo conjuntivo-vascular.',
        peso: 'criterio',
      },
      {
        achado: 'celulas-espumosas',
        tipo: 'especifico',
        comoAparece: 'Macrófagos espumosos agrupados nos eixos das papilas.',
        peso: 'frequente',
      },
      {
        achado: 'pseudocapsula-fibrosa',
        tipo: 'geral',
        comoAparece: 'Cápsula fibrosa espessa separando o tumor do córtex renal.',
        peso: 'frequente',
      },
      {
        achado: 'atipia-citologica',
        tipo: 'geral',
        comoAparece: 'Núcleos de tamanho moderado com nucléolos, base da graduação.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'Adenoma papilífero',
        comoSeparar: 'Mesma aparência, mas ≤ 15 mm e de baixo grau — por convenção.',
      },
      {
        nome: 'Carcinoma de células claras com áreas papilíferas (pseudopapilas)',
        comoSeparar: 'Predomínio de ninhos de células claras com rede capilar; as "papilas" surgem por descamação.',
      },
      {
        nome: 'Carcinoma de ductos coletores e carcinoma com deficiência de FH',
        comoSeparar: 'Alto grau, estroma desmoplásico e infiltração; nucléolos gigantes com halo (FH).',
      },
    ],
    correlacaoClinica: [
      'Geralmente achado incidental; pode ser multifocal e bilateral (sobretudo nos hereditários e nos pacientes em diálise).',
      'Tratamento cirúrgico; prognóstico bom nos de baixo grau.',
    ],
    comparacaoComNormal: [
      'Na mesma lâmina, o córtex renal normal mostra glomérulos e túbulos regulares, cada um com uma luz central.',
      'No tumor, os túbulos viram papilas: dobras de epitélio sobre eixos vasculares, flutuando em espaços, sem glomérulos.',
    ],
  },
  {
    id: 'carcinoma-renal-cromofobo',
    nome: 'Carcinoma de células renais cromófobo',
    sinonimos: ['carcinoma cromófobo'],
    nomesEmIngles: ['chromophobe renal cell carcinoma'],
    sistema: 'urinario',
    orgao: 'rim',
    prioridade: 14,
    resumo:
      'Carcinoma renal derivado das células intercaladas do ducto coletor, formado por lençóis de células grandes com membranas espessas ("células vegetais"), núcleos enrugados e halos perinucleares.',
    epidemiologia: '5 % dos carcinomas renais; idade média de 60 anos. Formas múltiplas na síndrome de Birt-Hogg-Dubé (mutação de FLCN). Prognóstico melhor que o de células claras.',
    patogenese: [
      'Perdas de vários cromossomos inteiros (1, 2, 6, 10, 13, 17, 21): genoma hipodiploide.',
      'As células acumulam microvesículas citoplasmáticas derivadas de mitocôndrias anômalas: citoplasma pálido e reticulado, que "não gosta de corante" (cromófobo).',
      'As vesículas empurram as organelas para a periferia, reforçando o contorno da célula (membranas espessas) e deixando um halo claro em volta do núcleo.',
      'O crescimento é lento e expansivo, com cápsula; invasão vascular e transformação sarcomatoide são raras, mas definem os casos agressivos.',
    ],
    roteiro: [
      'Panorâmico: tumor sólido, bem delimitado, com cápsula; na peça, castanho-acinzentado.',
      'Médio aumento: lençóis e trabéculas de células poligonais grandes, de membranas muito nítidas, separados por septos com vasos de parede mais grossa.',
      'Grande aumento: núcleos enrugados (uva-passa), halos perinucleares e células binucleadas; mistura de células pálidas e eosinofílicas.',
    ],
    achados: [
      {
        achado: 'membranas-celulares-vegetais',
        tipo: 'especifico',
        comoAparece: 'Células grandes com membranas espessas, núcleos enrugados, halos perinucleares e binucleação.',
        peso: 'criterio',
      },
      {
        achado: 'pseudocapsula-fibrosa',
        tipo: 'geral',
        comoAparece: 'Faixa fibrosa na periferia do tumor.',
        peso: 'frequente',
      },
      {
        achado: 'hemorragia-intersticial',
        tipo: 'geral',
        comoAparece: 'Focos de hemorragia entre as trabéculas.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Oncocitoma (benigno)',
        comoSeparar: 'Ninhos em estroma edematoso com cicatriz central; células de citoplasma rosa granular e núcleos redondos regulares, sem membranas espessas nem núcleos enrugados. O ferro coloidal de Hale cora difusamente o cromófobo e só a membrana apical no oncocitoma; CK7 difusa favorece cromófobo.',
      },
      {
        nome: 'Carcinoma de células claras',
        comoSeparar: 'Células menores, citoplasma totalmente vazio e rede capilar delicada; sem núcleos enrugados.',
      },
    ],
    correlacaoClinica: [
      'Geralmente assintomático, descoberto em exame de imagem.',
      'Nefrectomia parcial ou radical; metástases são raras (formas sarcomatoides são exceção).',
    ],
    comparacaoComNormal: [
      'No rim normal, as células do túbulo são pequenas, cúbicas, organizadas em volta de uma luz.',
      'No cromófobo, as células são enormes, em lençóis, sem luzes, com contornos grossos como parede de célula vegetal.',
    ],
  },
  {
    id: 'angiomiolipoma-renal',
    nome: 'Angiomiolipoma renal',
    sinonimos: ['AML renal', 'PEComa renal'],
    nomesEmIngles: ['renal angiomyolipoma'],
    sistema: 'urinario',
    orgao: 'rim',
    prioridade: 15,
    resumo:
      'Tumor benigno mesenquimal do rim formado por três componentes em proporções variáveis: vasos de parede espessa anômalos, músculo liso e tecido adiposo maduro.',
    epidemiologia:
      'Tumor benigno renal mais comum. Maioria esporádica, solitária, em mulheres de meia-idade; 20 % associados à esclerose tuberosa (múltiplos e bilaterais) e à linfangioleiomiomatose.',
    patogenese: [
      'A célula de origem é a célula epitelioide perivascular (PEC), que expressa marcadores musculares e melanocíticos (HMB-45, Melan-A).',
      'Perda de TSC1/TSC2 ativa a via mTOR — por isso inibidores de mTOR (everolimo) reduzem os tumores na esclerose tuberosa.',
      'A PEC se diferencia em músculo liso e adipócitos ao redor de vasos anômalos, sem lâmina elástica, que podem formar aneurismas e sangrar.',
    ],
    roteiro: [
      'Panorâmico: massa bem delimitada que comprime o rim, sem cápsula verdadeira; na mesma lâmina, córtex renal normal.',
      'Médio aumento: identifique os três componentes — gordura madura, feixes de músculo liso e vasos de parede grossa.',
      'Grande aumento: músculo liso saindo radialmente da parede dos vasos; células fusiformes sem atipia importante.',
    ],
    achados: [
      {
        achado: 'vasos-de-parede-espessa-dismorficos',
        tipo: 'especifico',
        comoAparece: 'Vasos de parede grossa e desorganizada espalhados pelo tumor.',
        peso: 'criterio',
      },
      {
        achado: 'tecido-adiposo-no-tumor',
        tipo: 'especifico',
        comoAparece: 'Adipócitos maduros em grupos dentro do tumor.',
        peso: 'criterio',
      },
      {
        achado: 'hemorragia-intersticial',
        tipo: 'geral',
        comoAparece: 'Hemorragia intratumoral (risco maior nos tumores > 4 cm).',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Lipossarcoma retroperitoneal',
        comoSeparar: 'Nasce fora do rim e o empurra; tem lipoblastos e células atípicas hipercromáticas, sem vasos dismórficos com músculo radial; MDM2 amplificado.',
      },
      {
        nome: 'Carcinoma de células renais',
        comoSeparar: 'Células epiteliais (claras, papilíferas) em ninhos, sem gordura madura como componente próprio.',
      },
    ],
    correlacaoClinica: [
      'Geralmente achado incidental; a TC mostra gordura dentro da massa renal (densidade negativa).',
      'Tumores > 4 cm podem romper e sangrar no retroperitônio (síndrome de Wunderlich: dor no flanco, massa e choque).',
      'Conduta: vigilância nos pequenos; embolização, nefrectomia parcial ou everolimo nos grandes ou sintomáticos.',
    ],
    comparacaoComNormal: [
      'O córtex renal normal da mesma lâmina tem glomérulos e túbulos, com vasos finos no interstício.',
      'No angiomiolipoma, no lugar do parênquima há gordura, músculo e vasos grossos — tecidos que normalmente só existem no seio renal e na gordura perirrenal.',
    ],
  },
]
