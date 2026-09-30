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
  {
    id: 'nefropatia-diabetica',
    nome: 'Nefropatia diabética',
    sinonimos: ['doença renal do diabetes', 'glomeruloesclerose diabética', 'síndrome de Kimmelstiel-Wilson'],
    nomesEmIngles: ['diabetic nephropathy', 'diabetic kidney disease'],
    sistema: 'urinario',
    orgao: 'rim',
    prioridade: 16,
    resumo:
      'Lesão renal do diabetes: espessamento da membrana basal, expansão mesangial difusa e depois nodular (Kimmelstiel-Wilson), hialinose arteriolar e esclerose glomerular — causa de proteinúria, síndrome nefrótica e doença renal crônica.',
    epidemiologia:
      'Principal causa de doença renal crônica terminal e de diálise no mundo, inclusive no Brasil. Afeta 30–40 % dos diabéticos após 10–20 anos de doença; piora com hipertensão, mau controle glicêmico e tabagismo.',
    patogenese: [
      'Hiperglicemia → glicação de proteínas (AGEs), via dos polióis e ativação da PKC: células mesangiais produzem matriz em excesso e a membrana basal engrossa.',
      'Hiperfiltração: a arteríola eferente contrai (angiotensina II) e a pressão intraglomerular sobe, lesando podócitos — microalbuminúria.',
      'A matriz mesangial se expande de forma difusa e depois forma nódulos (Kimmelstiel-Wilson); as arteríolas aferente e eferente sofrem hialinose.',
      'Glomérulos esclerosam, túbulos atrofiam e o interstício fibrosa: proteinúria nefrótica e queda progressiva da filtração.',
    ],
    roteiro: [
      'Panorâmico: proporção de glomérulos globalmente esclerosados, atrofia tubular e fibrose intersticial.',
      'Médio aumento: glomérulos grandes, com mesângio expandido e nódulos acelulares; cápsula de Bowman espessada.',
      'Grande aumento: nódulos de Kimmelstiel-Wilson com capilares periféricos; arteríolas com parede hialina (aferente e eferente).',
      'Classifique (Tervaert I–IV) e procure outra doença sobreposta (hematúria, piora rápida).',
    ],
    achados: [
      {
        achado: 'glomeruloesclerose-nodular',
        tipo: 'especifico',
        comoAparece: 'Nódulos acelulares de matriz mesangial nos lóbulos glomerulares.',
        peso: 'criterio',
      },
      {
        achado: 'esclerose-glomerular-global',
        tipo: 'geral',
        comoAparece: 'Glomérulos obsoletos, hialinizados.',
        peso: 'frequente',
      },
      {
        achado: 'fibrose-intersticial',
        tipo: 'geral',
        comoAparece: 'Fibrose do interstício com atrofia tubular.',
        peso: 'frequente',
      },
      {
        achado: 'espessamento-arterial',
        tipo: 'geral',
        comoAparece: 'Hialinose de arteríolas e espessamento intimal de artérias.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'Amiloidose renal',
        comoSeparar: 'Depósitos homogêneos, pálidos e acelulares no mesângio, alças e vasos; Congo vermelho com birrefringência verde-maçã.',
      },
      {
        nome: 'Doença de depósito de cadeias leves',
        comoSeparar: 'Nódulos idênticos; imunofluorescência com uma única cadeia leve (kappa) linear nas membranas; paciente com gamopatia.',
      },
      {
        nome: 'Glomerulonefrite membranoproliferativa crônica',
        comoSeparar: 'Duplo contorno das alças, hipercelularidade e depósitos imunes.',
      },
    ],
    correlacaoClinica: [
      'Microalbuminúria (30–300 mg/g) é o primeiro sinal; depois proteinúria franca, hipertensão e queda da TFG. Retinopatia costuma acompanhar.',
      'Rastreamento anual de albuminúria e creatinina em todo diabético.',
      'Tratamento: controle glicêmico e pressórico, IECA/BRA, inibidores de SGLT2, finerenona e agonistas de GLP-1 retardam a progressão.',
    ],
    comparacaoComNormal: [
      'No glomérulo normal, as alças capilares são finas e abertas e o mesângio é discreto, só no centro dos lóbulos.',
      'Na nefropatia diabética, o mesângio incha em nódulos rosados que empurram os capilares para a periferia, e muitos glomérulos viram cicatrizes.',
    ],
  },
  {
    id: 'nefropatia-membranosa',
    nome: 'Nefropatia membranosa',
    sinonimos: ['glomerulonefrite membranosa', 'glomerulopatia membranosa', 'GNM'],
    nomesEmIngles: ['membranous nephropathy', 'membranous glomerulonephritis'],
    sistema: 'urinario',
    orgao: 'rim',
    prioridade: 17,
    resumo:
      'Principal causa de síndrome nefrótica primária no adulto: depósitos imunes subepiteliais espessam de modo difuso as paredes dos capilares glomerulares, sem proliferação celular nem inflamação.',
    epidemiologia:
      'Adultos de 40–60 anos, mais homens. 75–80 % primária (autoanticorpos anti-PLA2R, anti-THSD7A); secundária a lúpus, hepatite B e C, tumores sólidos (pulmão, cólon), drogas (AINEs, sais de ouro).',
    patogenese: [
      'Autoanticorpos IgG4 se ligam a antígenos da membrana do podócito (receptor de fosfolipase A2 — PLA2R).',
      'Os imunocomplexos formam-se no lado externo (subepitelial) da membrana basal, longe do sangue: não atraem neutrófilos.',
      'O complemento (C5b-9) lesa os podócitos: apagamento dos pedicelos e perda maciça de proteína.',
      'A membrana basal cresce entre os depósitos (espículas) e depois os envolve: parede capilar difusamente espessa.',
    ],
    roteiro: [
      'Panorâmico: glomérulos de tamanho e celularidade normais — o erro é achar que a biópsia é normal.',
      'Grande aumento: alças capilares abertas, rígidas, de paredes grossas e uniformes em todos os glomérulos.',
      'Prata: espículas na face externa da membrana basal. Imunofluorescência: IgG e C3 granulares finos nas alças; PLA2R positivo.',
      'Avalie cronicidade (glomérulos esclerosados, fibrose) e procure pistas de causa secundária (depósitos mesangiais sugerem lúpus).',
    ],
    achados: [
      {
        achado: 'espessamento-da-parede-capilar-glomerular',
        tipo: 'especifico',
        comoAparece: 'Alças capilares difusamente espessas e rígidas, com celularidade normal.',
        peso: 'criterio',
      },
      {
        achado: 'esclerose-glomerular-global',
        tipo: 'geral',
        comoAparece: 'Glomérulos esclerosados nos casos de longa duração.',
        peso: 'ocasional',
      },
      {
        achado: 'fibrose-intersticial',
        tipo: 'geral',
        comoAparece: 'Fibrose intersticial e atrofia tubular — marcadores de pior prognóstico.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Doença de lesões mínimas',
        comoSeparar: 'Glomérulos realmente normais na microscopia óptica e na imunofluorescência; só a microscopia eletrônica mostra o apagamento dos pedicelos.',
      },
      {
        nome: 'Nefrite lúpica classe V',
        comoSeparar: 'Depósitos também mesangiais e subendoteliais, imunofluorescência "full house" (IgG, IgA, IgM, C1q).',
      },
      {
        nome: 'Glomeruloesclerose segmentar e focal',
        comoSeparar: 'Esclerose de parte de alguns glomérulos, com as outras alças finas.',
      },
    ],
    correlacaoClinica: [
      'Síndrome nefrótica: proteinúria > 3,5 g/dia, hipoalbuminemia, edema, hiperlipidemia; risco alto de trombose (veia renal).',
      'Anti-PLA2R sérico positivo permite o diagnóstico e o acompanhamento.',
      'Um terço remite sozinho; nos demais, bloqueio do SRAA, anticoagulação e imunossupressão (rituximabe, ciclofosfamida com corticoide, inibidores de calcineurina).',
    ],
    comparacaoComNormal: [
      'No glomérulo normal, as alças capilares são finas como linhas delicadas.',
      'Na nefropatia membranosa, as mesmas alças ficam grossas e rígidas — as células não aumentam, só a parede engrossa.',
    ],
  },
  {
    id: 'glomerulonefrite-pos-infecciosa',
    nome: 'Glomerulonefrite pós-infecciosa',
    sinonimos: ['glomerulonefrite difusa aguda', 'GNPE', 'glomerulonefrite pós-estreptocócica', 'glomerulonefrite proliferativa endocapilar'],
    nomesEmIngles: ['post-infectious glomerulonephritis', 'acute diffuse proliferative glomerulonephritis'],
    sistema: 'urinario',
    orgao: 'rim',
    prioridade: 18,
    resumo:
      'Glomerulonefrite por imunocomplexos após infecção (clássica: estreptococo do grupo A), com proliferação endocapilar difusa e neutrófilos nos glomérulos; protótipo da síndrome nefrítica.',
    epidemiologia:
      'Clássica em crianças de 5–12 anos, 1–3 semanas após faringite ou 3–6 semanas após impetigo por cepas nefritogênicas. Em adultos e idosos (diabéticos, etilistas), cada vez mais associada a estafilococo, com infecção ainda ativa e pior prognóstico.',
    patogenese: [
      'Antígenos bacterianos (SpeB, receptor de plasmina) depositam-se nos glomérulos e formam imunocomplexos com anticorpos.',
      'O complemento é ativado pela via alternativa (C3 baixo) e atrai neutrófilos e monócitos.',
      'Células endoteliais e mesangiais proliferam e os leucócitos enchem as alças: o glomérulo "fecha", a filtração cai e sódio e água ficam retidos.',
      'A parede lesada deixa passar hemácias (hematúria, cilindros hemáticos). Nas crianças, o quadro regride em semanas.',
    ],
    roteiro: [
      'Panorâmico: todos os glomérulos aumentados e hipercelulares (difuso).',
      'Grande aumento: luzes capilares ocluídas por células; neutrófilos dentro das alças; às vezes crescentes nos casos graves.',
      'Túbulos com hemácias e cilindros; interstício com edema e inflamação.',
      'Imunofluorescência: C3 granular grosseiro ("céu estrelado"). Microscopia eletrônica: corcovas subepiteliais.',
    ],
    achados: [
      {
        achado: 'proliferacao-endocapilar',
        tipo: 'especifico',
        comoAparece: 'Glomérulos aumentados, hipercelulares, com alças ocluídas, em todos os glomérulos.',
        peso: 'criterio',
      },
      {
        achado: 'infiltrado-neutrofilico',
        tipo: 'geral',
        comoAparece: 'Neutrófilos dentro das alças capilares (glomerulonefrite "exsudativa").',
        peso: 'frequente',
      },
      {
        achado: 'crescente-glomerular',
        tipo: 'geral',
        comoAparece: 'Crescentes em poucos glomérulos nos casos graves.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Nefrite lúpica classe IV',
        comoSeparar: 'Alças em "arame", trombos hialinos, imunofluorescência "full house" com C1q; clínica e sorologia de lúpus.',
      },
      {
        nome: 'Glomerulonefrite membranoproliferativa / glomerulopatia C3',
        comoSeparar: 'Duplo contorno das membranas e acentuação lobular; hipocomplementemia que persiste além de 8 semanas.',
      },
      {
        nome: 'Nefropatia por IgA',
        comoSeparar: 'Proliferação mesangial, IgA dominante na imunofluorescência; hematúria sincrônica à infecção (sem latência).',
      },
    ],
    correlacaoClinica: [
      'Síndrome nefrítica: hematúria (urina "cor de Coca-Cola"), edema periorbital, hipertensão, oligúria; C3 baixo, ASLO elevada.',
      'Tratamento de suporte (restrição de sal, diuréticos, anti-hipertensivos) e da infecção; biópsia só se o quadro for atípico ou não melhorar.',
      'Excelente prognóstico nas crianças; adultos podem evoluir para doença renal crônica.',
    ],
    comparacaoComNormal: [
      'No glomérulo normal, as alças são abertas, com hemácias na luz, e o espaço de Bowman é visível.',
      'Na pós-infecciosa, o glomérulo incha e fica maciço de células, as alças fecham e o espaço de Bowman quase some.',
    ],
  },
  {
    id: 'glomerulonefrite-crescentica',
    nome: 'Glomerulonefrite crescêntica (rapidamente progressiva)',
    sinonimos: ['GNRP', 'glomerulonefrite rapidamente progressiva', 'glomerulonefrite necrosante e crescêntica'],
    nomesEmIngles: ['crescentic glomerulonephritis', 'rapidly progressive glomerulonephritis'],
    sistema: 'urinario',
    orgao: 'rim',
    prioridade: 19,
    resumo:
      'Síndrome nefrítica grave com perda rápida da função renal, cuja base é a formação de crescentes na maioria dos glomérulos, geralmente com necrose fibrinoide do tufo.',
    epidemiologia:
      'Rara, mas emergência nefrológica. Tipo I (anti-MBG, Goodpasture): jovens e idosos, com hemorragia pulmonar. Tipo II (imunocomplexos): lúpus, IgA, pós-infecciosa. Tipo III (pauci-imune, ANCA): o mais comum, sobretudo em idosos.',
    patogenese: [
      'Lesão grave da parede capilar — por anticorpos anti-MBG, imunocomplexos ou neutrófilos ativados por ANCA — causa necrose fibrinoide do tufo.',
      'Fibrina e mediadores extravasam para o espaço de Bowman e estimulam a proliferação das células parietais e a entrada de macrófagos: forma-se o crescente.',
      'O crescente comprime o tufo e a filtração cessa; sem tratamento, evolui para crescente fibroso e esclerose glomerular em semanas.',
    ],
    roteiro: [
      'Panorâmico: conte os glomérulos e a proporção com crescentes (> 50 % define a forma crescêntica).',
      'Médio aumento: meias-luas celulares, fibrocelulares ou fibrosas; tufos comprimidos.',
      'Grande aumento: necrose fibrinoide (material rosa-vivo com restos nucleares) e ruptura da cápsula de Bowman.',
      'Imunofluorescência define o tipo: linear (anti-MBG), granular (imunocomplexos) ou negativa (pauci-imune, ANCA).',
    ],
    achados: [
      {
        achado: 'crescente-glomerular',
        tipo: 'especifico',
        comoAparece: 'Crescentes celulares e fibrocelulares comprimindo os tufos na maioria dos glomérulos.',
        peso: 'criterio',
      },
      {
        achado: 'necrose-fibrinoide',
        tipo: 'especifico',
        comoAparece: 'Necrose fibrinoide segmentar do tufo glomerular.',
        peso: 'frequente',
      },
      {
        achado: 'fibrose-intersticial',
        tipo: 'geral',
        comoAparece: 'Fibrose e inflamação intersticial com atrofia tubular.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'Glomerulonefrite pós-infecciosa',
        comoSeparar: 'Proliferação endocapilar difusa é a lesão dominante; crescentes, quando há, são poucos.',
      },
      {
        nome: 'Necrose tubular aguda',
        comoSeparar: 'Insuficiência renal aguda com glomérulos normais e túbulos lesados.',
      },
    ],
    correlacaoClinica: [
      'Insuficiência renal que se instala em dias a semanas, com hematúria dismórfica, cilindros hemáticos e proteinúria; hemoptise sugere anti-MBG ou vasculite.',
      'Solicitar com urgência ANCA (MPO, PR3), anti-MBG, complemento e FAN; biópsia sem atrasar o tratamento.',
      'Tratamento: pulsos de metilprednisolona, ciclofosfamida ou rituximabe; plasmaférese na doença anti-MBG.',
    ],
    comparacaoComNormal: [
      'No glomérulo normal, o espaço de Bowman é uma fenda vazia entre o tufo e a cápsula.',
      'Na glomerulonefrite crescêntica, esse espaço é preenchido por uma meia-lua de células que esmaga o tufo.',
    ],
  },
]
