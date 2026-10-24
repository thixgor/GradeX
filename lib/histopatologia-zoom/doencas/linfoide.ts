import type { DoencaZoom } from '../tipos'

/** Linfonodos, baço e timo. */
export const DOENCAS_LINFOIDE: DoencaZoom[] = [
  {
    id: 'linfoma-de-hodgkin',
    nome: 'Linfoma de Hodgkin clássico',
    sinonimos: ['doença de Hodgkin', 'linfoma de Hodgkin esclerose nodular', 'LH'],
    nomesEmIngles: ['classical Hodgkin lymphoma', 'nodular sclerosis Hodgkin lymphoma'],
    sistema: 'linfoide',
    orgao: 'linfonodo',
    prioridade: 2,
    resumo:
      'Linfoma em que as células tumorais — de Reed-Sternberg e suas variantes — são raras e ficam imersas num fundo reativo de linfócitos, eosinófilos, histiócitos e plasmócitos; no subtipo esclerose nodular, faixas de colágeno dividem o linfonodo em nódulos com células lacunares.',
    epidemiologia:
      'Distribuição bimodal: pico entre 15 e 35 anos e outro após os 55. Esclerose nodular é o subtipo mais comum, sobretudo em adolescentes e mulheres jovens, frequentemente com massa mediastinal. Associação com o vírus Epstein-Barr em parte dos casos (mais na celularidade mista e no HIV).',
    patogenese: [
      'Uma célula B do centro germinativo com mutações que deveriam levá-la à apoptose sobrevive graças à ativação de NF-κB (às vezes pelo EBV).',
      'A célula perde a identidade de célula B (CD20, receptor de imunoglobulina) e ganha CD30 e CD15: é a célula de Reed-Sternberg.',
      'Ela secreta citocinas que atraem linfócitos T, eosinófilos, histiócitos e plasmócitos — o tumor é, na maior parte, inflamação.',
      'Expressa PD-L1 (amplificação de 9p24) e escapa dos linfócitos T que a cercam.',
      'Citocinas fibrogênicas produzem as faixas de colágeno da esclerose nodular; a doença se espalha de forma contígua, de uma cadeia linfonodal para a vizinha.',
    ],
    roteiro: [
      'Panorâmico: o linfonodo perdeu a arquitetura normal; na esclerose nodular, faixas rosa de colágeno o dividem em nódulos e a cápsula está espessada.',
      'Médio aumento: dentro dos nódulos, fundo misto e, espalhadas, células grandes com halo claro (células lacunares).',
      'Grande aumento: procure a célula de Reed-Sternberg — núcleo bilobado com nucléolos grandes, eosinofílicos — e células de Hodgkin mononucleares.',
      'No fundo, identifique eosinófilos (grânulos vermelhos), linfócitos pequenos, histiócitos e plasmócitos.',
      'O diagnóstico é confirmado por imuno-histoquímica (CD30+, CD15+, CD45−) — neste caso de Leeds, há lâminas de CD30 e CD15 do mesmo linfonodo.',
    ],
    achados: [
      {
        achado: 'celula-de-reed-sternberg',
        tipo: 'especifico',
        comoAparece: 'Células grandes, de núcleo lobulado e nucléolos proeminentes; na esclerose nodular, células lacunares com halo claro.',
        peso: 'criterio',
      },
      {
        achado: 'faixas-de-esclerose-colagena',
        tipo: 'especifico',
        comoAparece: 'Faixas de colágeno dividindo o linfonodo em nódulos (subtipo esclerose nodular).',
        peso: 'frequente',
      },
      {
        achado: 'eosinofilos-teciduais',
        tipo: 'geral',
        comoAparece: 'Eosinófilos espalhados no fundo reativo.',
        peso: 'frequente',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Fundo de linfócitos pequenos e plasmócitos, que são a maioria das células.',
        peso: 'criterio',
      },
      {
        achado: 'necrose-coagulativa',
        tipo: 'geral',
        comoAparece: 'Focos de necrose em alguns casos de esclerose nodular (variante sincicial).',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Linfoma de Hodgkin predominância linfocitária nodular',
        comoSeparar: 'Células "em pipoca" (LP) CD20+, CD30− e CD15−, em nódulos de células B; sem células lacunares nem fundo com eosinófilos.',
      },
      {
        nome: 'Linfoma anaplásico de grandes células',
        comoSeparar: 'Lençóis de células grandes CD30+ (células "em ferradura"), coesas, muitas vezes ALK+; CD15 geralmente negativo.',
      },
      {
        nome: 'Linfadenite reativa / mononucleose',
        comoSeparar: 'Imunoblastos grandes, mas arquitetura parcialmente preservada, sem faixas de colágeno; sorologia para EBV; imunoblastos CD15−.',
      },
      {
        nome: 'Linfoma difuso de grandes células B rico em células T',
        comoSeparar: 'Células grandes CD20+ fortes, CD15−, em fundo de linfócitos T sem eosinófilos.',
      },
    ],
    correlacaoClinica: [
      'Linfonodos cervicais ou supraclaviculares aumentados, indolores e elásticos; massa mediastinal no raio X (tosse, dispneia).',
      'Sintomas B: febre (às vezes cíclica, de Pel-Ebstein), sudorese noturna, perda de peso > 10 %; prurido; dor nos linfonodos após álcool (raro, mas clássico).',
      'Estadiamento por PET-CT (Ann Arbor/Lugano); tratamento com quimioterapia (ABVD) ± radioterapia — cura em mais de 80 %.',
      'Nos refratários, brentuximabe (anti-CD30) e anti-PD-1.',
    ],
    comparacaoComNormal: [
      'No linfonodo normal, cápsula fina, seio subcapsular, folículos com centros germinativos no córtex e paracórtex de linfócitos pequenos — arquitetura organizada.',
      'No Hodgkin esclerose nodular, a cápsula engrossa, faixas de colágeno cortam o órgão em nódulos e, dentro deles, células grandes com halo (lacunares) aparecem num fundo misto com eosinófilos.',
    ],
  },
  {
    id: 'sarcoidose',
    nome: 'Sarcoidose',
    sinonimos: ['doença de Besnier-Boeck-Schaumann', 'linfadenite granulomatosa sarcoide'],
    nomesEmIngles: ['sarcoidosis'],
    sistema: 'linfoide',
    orgao: 'linfonodo',
    prioridade: 24,
    resumo:
      'Doença sistêmica de causa desconhecida caracterizada por granulomas epitelioides compactos e não necrosantes em vários órgãos, sobretudo linfonodos hilares e pulmão.',
    epidemiologia:
      'Adultos de 20 a 40 anos, mais frequente em mulheres e em pessoas negras. Mais de 90 % têm acometimento torácico (adenomegalia hilar bilateral). Diagnóstico de exclusão: é preciso afastar tuberculose, fungos e reações a corpo estranho.',
    patogenese: [
      'Em pessoas geneticamente predispostas (HLA-DRB1), um antígeno ainda não identificado — talvez micobacteriano ou ambiental — ativa linfócitos T CD4 do tipo Th1.',
      'Os linfócitos produzem interferon-γ e IL-2, que transformam macrófagos em histiócitos epitelioides; estes se agrupam e se fundem em células gigantes.',
      'O resultado são granulomas compactos, "nus" (com poucos linfócitos em volta) e sem necrose, que podem regredir ou ser substituídos por fibrose hialina.',
      'Os macrófagos ativados produzem 1-α-hidroxilase (hipercalcemia) e enzima conversora da angiotensina (marcador sérico).',
    ],
    roteiro: [
      'Panorâmico: linfonodo com a arquitetura substituída por nódulos pálidos, redondos e de tamanho parecido, muitas vezes confluentes.',
      'Médio aumento: granulomas compactos de histiócitos epitelioides, bem delimitados, com coroa fina de linfócitos.',
      'Grande aumento: células gigantes multinucleadas (Langhans ou tipo corpo estranho), às vezes com corpos asteroides ou de Schaumann; confirme a ausência de necrose caseosa.',
    ],
    achados: [
      {
        achado: 'granuloma-epitelioide',
        tipo: 'especifico',
        comoAparece: 'Granulomas compactos, bem delimitados, não necrosantes, de tamanho uniforme, substituindo o linfonodo.',
        peso: 'criterio',
      },
      {
        achado: 'celula-gigante-de-langhans',
        tipo: 'especifico',
        comoAparece: 'Células gigantes multinucleadas no interior dos granulomas.',
        peso: 'frequente',
      },
      {
        achado: 'necrose-caseosa',
        tipo: 'geral',
        comoAparece: 'Deve faltar: necrose caseosa aponta para tuberculose ou fungo.',
        peso: 'ocasional',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Linfócitos em coroa fina e no tecido linfoide residual entre os granulomas.',
        peso: 'frequente',
      },
      {
        achado: 'fibrose-cicatricial',
        tipo: 'geral',
        comoAparece: 'Fibrose hialina concêntrica substituindo granulomas antigos (sarcoidose "queimada").',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Tuberculose',
        comoSeparar: 'Granulomas com necrose caseosa central, mais irregulares e confluentes; Ziehl-Neelsen, cultura e PCR positivos.',
      },
      {
        nome: 'Infecção fúngica (histoplasmose, criptococose)',
        comoSeparar: 'Necrose e organismos visíveis em Grocott ou PAS.',
      },
      {
        nome: 'Reação sarcoide a tumor (linfoma, carcinoma)',
        comoSeparar: 'Granulomas no linfonodo de drenagem de uma neoplasia; procure o tumor no próprio linfonodo e no contexto clínico.',
      },
    ],
    correlacaoClinica: [
      'Muitos casos são achado de radiografia (adenomegalia hilar bilateral). Outros têm tosse, dispneia, eritema nodoso, uveíte, artralgias (síndrome de Löfgren) ou lesões cutâneas (lúpus pérnio).',
      'Laboratório: enzima conversora da angiotensina sérica elevada, hipercalcemia e hipercalciúria; lavado broncoalveolar com relação CD4/CD8 alta.',
      'Tratamento: observação nas formas leves (regressão espontânea frequente); corticoide quando há doença pulmonar progressiva, cardíaca, neurológica, ocular ou hipercalcemia.',
    ],
    comparacaoComNormal: [
      'O linfonodo normal tem cápsula, seios, folículos linfoides no córtex, paracórtex e cordões medulares.',
      'Na sarcoidose, essa arquitetura é substituída por granulomas pálidos e compactos que ocupam o lugar do tecido linfoide.',
    ],
  },
]
