import type { DoencaZoom } from '../tipos'

/** Pulmão e vias aéreas. */
export const DOENCAS_RESPIRATORIO: DoencaZoom[] = [
  {
    id: 'pneumonia-bacteriana',
    nome: 'Pneumonia bacteriana (lobar e broncopneumonia)',
    sinonimos: ['pneumonia lobar', 'broncopneumonia', 'pneumonia pneumocócica', 'pneumonia adquirida na comunidade', 'hepatização'],
    nomesEmIngles: ['bacterial pneumonia', 'lobar pneumonia', 'bronchopneumonia'],
    sistema: 'respiratorio',
    orgao: 'pulmao',
    prioridade: 1,
    resumo:
      'Infecção bacteriana do parênquima pulmonar em que os alvéolos se enchem de exsudato neutrofílico e fibrinoso: difuso e uniforme em um lobo inteiro (pneumonia lobar) ou em focos centrados nos bronquíolos (broncopneumonia).',
    epidemiologia:
      'Principal causa infecciosa de morte no mundo, sobretudo em crianças pequenas e idosos. Agentes: Streptococcus pneumoniae (o mais comum na comunidade), Haemophilus influenzae, Moraxella, Staphylococcus aureus (pós-influenza), Klebsiella (etilistas), Pseudomonas e anaeróbios (hospitalar, aspiração). Fatores: extremos de idade, doenças crônicas, alcoolismo, tabagismo, disfagia e imunossupressão.',
    patogenese: [
      'As bactérias da orofaringe chegam aos alvéolos quando falham as defesas (tosse, epitélio ciliado, macrófagos): aspiração, infecção viral prévia, álcool.',
      'Macrófagos alveolares reconhecem as bactérias e liberam citocinas que recrutam neutrófilos.',
      'Os capilares dos septos congestionam e deixam sair plasma, fibrina e hemácias: os alvéolos se enchem de exsudato (consolidação).',
      'Na pneumonia lobar (pneumococo), o exsudato se espalha rapidamente pelos poros de Kohn e ocupa um lobo inteiro de modo uniforme; na broncopneumonia, os focos começam nos bronquíolos e ficam em manchas.',
      'Com o tratamento e a resposta imune, os macrófagos removem o exsudato e o pulmão volta ao normal; se não, a fibrina é organizada (fibrose) ou o tecido necrosa (abscesso, empiema).',
    ],
    roteiro: [
      'Panorâmico: o pulmão está sólido? Veja se a consolidação é difusa e homogênea (lobar) ou em focos ao redor de bronquíolos (broncopneumonia).',
      'Médio aumento: os septos alveolares continuam visíveis — o que mudou é o conteúdo dos alvéolos.',
      'Grande aumento: identifique o exsudato — neutrófilos, fibrina, hemácias (hepatização vermelha) ou fibrina com neutrófilos degenerados (cinzenta); macrófagos indicam resolução.',
      'Olhe a pleura: fibrina e neutrófilos na superfície (pleurite fibrinopurulenta, risco de empiema).',
      'Procure complicações: necrose com destruição dos septos (abscesso) e organização (tecido de granulação dentro dos alvéolos).',
    ],
    achados: [
      {
        achado: 'exsudato-alveolar-neutrofilico',
        tipo: 'especifico',
        comoAparece: 'Alvéolos preenchidos por neutrófilos, fibrina e hemácias, com septos preservados.',
        peso: 'criterio',
      },
      {
        achado: 'hiperemia-e-congestao',
        tipo: 'geral',
        comoAparece: 'Capilares septais dilatados e cheios, sobretudo nas fases iniciais.',
        peso: 'frequente',
      },
      {
        achado: 'exsudato-fibrinopurulento',
        tipo: 'geral',
        comoAparece: 'Pleurite fibrinopurulenta sobre o lobo consolidado.',
        peso: 'frequente',
      },
      {
        achado: 'abscesso',
        tipo: 'geral',
        comoAparece: 'Necrose com destruição dos septos (S. aureus, Klebsiella, anaeróbios).',
        peso: 'ocasional',
      },
      {
        achado: 'tecido-de-granulacao',
        tipo: 'geral',
        comoAparece: 'Organização do exsudato quando a resolução falha (pneumonia em organização).',
        peso: 'ocasional',
      },
      {
        achado: 'antracose',
        tipo: 'geral',
        comoAparece: 'Pigmento preto perivascular e subpleural — achado incidental, útil para orientar o aluno no pulmão.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Edema pulmonar',
        comoSeparar: 'Alvéolos com líquido rosa homogêneo, pobre em células; septos congestos; sem neutrófilos nem fibrina em rede.',
      },
      {
        nome: 'Pneumonia viral/atípica',
        comoSeparar: 'Inflamação intersticial (septos alargados por linfócitos), alvéolos relativamente vazios ou com membranas hialinas.',
      },
      {
        nome: 'Dano alveolar difuso',
        comoSeparar: 'Membranas hialinas revestindo os alvéolos, sem o exsudato neutrofílico abundante.',
      },
      {
        nome: 'Adenocarcinoma mucinoso',
        comoSeparar: 'Pode simular consolidação, mas os alvéolos são revestidos por células colunares mucinosas neoplásicas.',
      },
    ],
    correlacaoClinica: [
      'Febre, calafrios, tosse com expectoração purulenta ou ferruginosa, dor pleurítica, dispneia; macicez, frêmito aumentado e estertores no lobo acometido.',
      'Radiografia: consolidação lobar com broncograma aéreo (lobar) ou opacidades em focos (broncopneumonia).',
      'Tratamento: antibiótico conforme gravidade (CURB-65) e cenário; vacinação pneumocócica e contra influenza previne.',
      'Complicações: derrame parapneumônico e empiema, abscesso, bacteremia (meningite, endocardite).',
    ],
    comparacaoComNormal: [
      'No pulmão normal, os alvéolos são espaços vazios (ar) separados por septos finos com capilares; o tecido parece uma renda.',
      'Na pneumonia, os mesmos septos persistem, mas cada alvéolo está cheio de neutrófilos e fibrina: a renda vira um bloco sólido.',
    ],
  },
  {
    id: 'pneumonia-por-pneumocystis',
    nome: 'Pneumonia por Pneumocystis',
    sinonimos: ['pneumocistose', 'PCP', 'pneumonia por Pneumocystis jirovecii', 'pneumonia por P. carinii'],
    nomesEmIngles: ['Pneumocystis pneumonia', 'PCP', 'Pneumocystis jirovecii pneumonia'],
    sistema: 'respiratorio',
    orgao: 'pulmao',
    prioridade: 2,
    resumo:
      'Pneumonia oportunista por Pneumocystis jirovecii em imunossuprimidos: os alvéolos se enchem de um exsudato eosinofílico espumoso ("favo de mel"), com septos discretamente inflamados e pouca reação neutrofílica.',
    epidemiologia:
      'Infecção oportunista definidora de aids (CD4 < 200/µL); também em transplantados, pacientes em quimioterapia, uso crônico de corticoide e imunobiológicos. A profilaxia com sulfametoxazol-trimetoprima reduziu muito sua frequência.',
    patogenese: [
      'Pneumocystis é um fungo adquirido por inalação na infância, mantido sob controle pelos linfócitos T CD4 e macrófagos.',
      'Com a queda da imunidade celular, o organismo prolifera aderido aos pneumócitos tipo I.',
      'Os alvéolos se enchem de organismos, surfactante e restos celulares — o exsudato espumoso — e a troca gasosa cai.',
      'Os septos se espessam discretamente por linfócitos, plasmócitos e pneumócitos tipo II reativos; casos graves evoluem para dano alveolar difuso.',
    ],
    roteiro: [
      'Panorâmico: pulmão com alvéolos preenchidos de material rosa pálido, de modo difuso ou em áreas.',
      'Médio aumento: o conteúdo alveolar é espumoso, "rendado" — diferente do líquido homogêneo do edema e das células da pneumonia bacteriana.',
      'Grande aumento: poucos neutrófilos; septos com linfócitos e pneumócitos tipo II volumosos.',
      'Peça a prata de Grocott (ou imuno): cistos em forma de xícara confirmam o diagnóstico.',
    ],
    achados: [
      {
        achado: 'exsudato-espumoso-alveolar',
        tipo: 'especifico',
        comoAparece: 'Alvéolos cheios de exsudato eosinofílico espumoso em favo de mel.',
        peso: 'criterio',
      },
      {
        achado: 'hiperplasia-de-pneumocitos-tipo-ii',
        tipo: 'geral',
        comoAparece: 'Pneumócitos tipo II reativos revestindo os septos.',
        peso: 'frequente',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Septos discretamente espessados por linfócitos e plasmócitos.',
        peso: 'frequente',
      },
      {
        achado: 'membranas-hialinas',
        tipo: 'geral',
        comoAparece: 'Nos casos graves, dano alveolar difuso sobreposto.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Edema pulmonar',
        comoSeparar: 'Líquido rosa homogêneo, sem textura espumosa; septos congestos; Grocott negativo.',
      },
      {
        nome: 'Proteinose alveolar pulmonar',
        comoSeparar: 'Material granular PAS+ com fendas de colesterol, sem espuma nem organismos; septos finos.',
      },
      {
        nome: 'Pneumonia por citomegalovírus',
        comoSeparar: 'Células aumentadas com inclusões nucleares em "olho de coruja"; pode coexistir com Pneumocystis.',
      },
    ],
    correlacaoClinica: [
      'Dispneia progressiva, tosse seca e febre em imunossuprimido; hipoxemia desproporcional à ausculta; LDH elevada.',
      'Radiografia/TC: opacidades em vidro fosco difusas e bilaterais; pneumotórax é complicação.',
      'Diagnóstico: escarro induzido ou lavado broncoalveolar com coloração ou PCR.',
      'Tratamento: sulfametoxazol-trimetoprima (+ corticoide se hipoxemia grave); profilaxia quando CD4 < 200/µL.',
    ],
    comparacaoComNormal: [
      'No pulmão normal, os alvéolos são vazios e os septos finos, revestidos por pneumócitos tipo I quase invisíveis.',
      'Na pneumocistose, os alvéolos se enchem de espuma rosa, e os septos ficam um pouco mais grossos, com pneumócitos tipo II salientes.',
    ],
  },
  {
    id: 'dano-alveolar-difuso',
    nome: 'Dano alveolar difuso (SDRA)',
    sinonimos: ['síndrome do desconforto respiratório agudo', 'SDRA', 'dano alveolar difuso organizante', 'pneumonia intersticial aguda'],
    nomesEmIngles: ['diffuse alveolar damage', 'acute respiratory distress syndrome', 'ARDS'],
    sistema: 'respiratorio',
    orgao: 'pulmao',
    prioridade: 3,
    resumo:
      'Lesão aguda e difusa da barreira alvéolo-capilar: na primeira semana, edema e membranas hialinas revestindo os alvéolos (fase exsudativa); depois, proliferação de fibroblastos nos septos e hiperplasia de pneumócitos tipo II (fase organizante), que pode deixar fibrose.',
    epidemiologia:
      'Correlato histológico da SDRA, com mortalidade de 30–40 %. Causas: sepse (a mais comum), pneumonia grave (bacteriana, influenza, COVID-19), aspiração, trauma e choque, pancreatite aguda, transfusões, drogas e toxinas inaladas. Sem causa identificada: pneumonia intersticial aguda (síndrome de Hamman-Rich).',
    patogenese: [
      'A agressão (direta ao alvéolo ou via sangue, na sepse) ativa macrófagos e neutrófilos, que liberam proteases, radicais livres e citocinas (IL-1, TNF, IL-8).',
      'O endotélio capilar e os pneumócitos tipo I morrem: plasma rico em proteínas inunda o interstício e os alvéolos (edema não cardiogênico).',
      'Fibrina e restos celulares se depositam sobre a membrana basal desnuda: membranas hialinas (dias 3–7).',
      'Fase organizante (após ~1 semana): pneumócitos tipo II proliferam para reepitelizar; fibroblastos invadem septos e espaços aéreos.',
      'Evolução: resolução, ou fibrose com remodelamento (fase fibrótica) e insuficiência respiratória crônica.',
    ],
    roteiro: [
      'Panorâmico: pulmão difusamente denso, com septos espessos e alvéolos colapsados ou dilatados.',
      'Fase exsudativa: procure membranas hialinas — tiras rosa-vivo coladas às paredes dos alvéolos e ductos alveolares.',
      'Fase organizante: septos alargados por fibroblastos em matriz frouxa (mixoide) e revestidos por pneumócitos tipo II cúbicos.',
      'Busque a causa: exsudato neutrofílico (pneumonia bacteriana), inclusões virais, Pneumocystis, material aspirado.',
    ],
    achados: [
      {
        achado: 'membranas-hialinas',
        tipo: 'especifico',
        comoAparece: 'Membranas eosinofílicas revestindo os alvéolos (fase exsudativa); restos delas na fase organizante.',
        peso: 'criterio',
      },
      {
        achado: 'hiperplasia-de-pneumocitos-tipo-ii',
        tipo: 'especifico',
        comoAparece: 'Pneumócitos tipo II cúbicos e atípicos revestindo os septos (fase organizante).',
        peso: 'frequente',
      },
      {
        achado: 'tecido-de-granulacao',
        tipo: 'especifico',
        comoAparece: 'Proliferação difusa de fibroblastos em matriz mixoide nos septos: é o critério da fase organizante, quando as membranas já foram incorporadas.',
        peso: 'criterio',
      },
      {
        achado: 'hiperemia-e-congestao',
        tipo: 'geral',
        comoAparece: 'Capilares congestos e edema intersticial e alveolar.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'Pneumonia em organização (criptogênica)',
        comoSeparar: 'Plugs de tecido de granulação dentro dos alvéolos e bronquíolos (corpos de Masson), com arquitetura pulmonar preservada e sem membranas hialinas.',
      },
      {
        nome: 'Pneumonia intersticial usual (fibrose pulmonar idiopática)',
        comoSeparar: 'Fibrose crônica heterogênea, subpleural, com faveolamento e focos fibroblásticos; curso de anos, não de dias.',
      },
      {
        nome: 'Edema pulmonar cardiogênico',
        comoSeparar: 'Líquido nos alvéolos sem membranas hialinas nem lesão epitelial; macrófagos com hemossiderina.',
      },
    ],
    correlacaoClinica: [
      'Dispneia de início agudo (< 1 semana), hipoxemia grave (PaO2/FiO2 ≤ 300) e infiltrados bilaterais não explicados por insuficiência cardíaca (critérios de Berlim).',
      'Tratamento: da causa + ventilação protetora (baixo volume corrente), posição prona, balanço hídrico restritivo.',
    ],
    comparacaoComNormal: [
      'No pulmão normal, septos finos com capilares separam alvéolos vazios, revestidos por células planas.',
      'No dano alveolar difuso, os septos engrossam com edema e fibroblastos, os alvéolos ganham um revestimento de membranas rosa e, depois, de pneumócitos cúbicos.',
    ],
  },
  {
    id: 'pneumonite-de-hipersensibilidade',
    nome: 'Pneumonite de hipersensibilidade',
    sinonimos: ['alveolite alérgica extrínseca', 'pulmão do fazendeiro', 'pulmão do criador de pássaros', 'pneumonia de hipersensibilidade'],
    nomesEmIngles: ['hypersensitivity pneumonitis', 'extrinsic allergic alveolitis'],
    sistema: 'respiratorio',
    orgao: 'pulmao',
    prioridade: 4,
    resumo:
      'Doença pulmonar intersticial imunomediada por inalação repetida de antígenos orgânicos (fungos, proteínas de aves, mofo): inflamação linfocitária do interstício centrada nos bronquíolos, granulomas pequenos mal formados e, na forma crônica, fibrose.',
    epidemiologia:
      'Exposições típicas: feno mofado (pulmão do fazendeiro), aves e penas (criadores de pássaros, travesseiros de pena), mofo doméstico, ar-condicionado e umidificadores contaminados. Pode ocorrer em não fumantes — o tabagismo é, curiosamente, protetor.',
    patogenese: [
      'Partículas orgânicas pequenas (< 5 µm) chegam aos bronquíolos e alvéolos.',
      'Em indivíduos sensibilizados, imunocomplexos (reação tipo III) e principalmente linfócitos T (tipo IV) respondem ao antígeno.',
      'Linfócitos e plasmócitos infiltram as paredes bronquiolares e os septos vizinhos; macrófagos formam granulomas pequenos, frouxos, e células gigantes.',
      'Com exposição contínua, a inflamação crônica leva a fibrose — às vezes difícil de distinguir da fibrose pulmonar idiopática.',
    ],
    roteiro: [
      'Panorâmico: arquitetura geral preservada, com septos alargados e mais roxos; o acometimento é mais intenso em volta dos bronquíolos.',
      'Médio aumento: infiltrado linfoplasmocitário intersticial, com alvéolos relativamente vazios (diferente da pneumonia bacteriana).',
      'Procure granulomas pequenos e mal formados e células gigantes isoladas no interstício peribronquiolar.',
      'Avalie fibrose (forma crônica) e bronquiolite.',
    ],
    achados: [
      {
        achado: 'pneumonite-intersticial-cronica',
        tipo: 'especifico',
        comoAparece: 'Septos alargados por linfócitos e plasmócitos, mais intensos ao redor dos bronquíolos.',
        peso: 'criterio',
      },
      {
        achado: 'granuloma-epitelioide',
        tipo: 'especifico',
        comoAparece: 'Granulomas pequenos, frouxos e mal formados, não caseosos, no interstício peribronquiolar.',
        peso: 'frequente',
      },
      {
        achado: 'fibrose-intersticial',
        tipo: 'geral',
        comoAparece: 'Fibrose septal e peribronquiolar na forma crônica.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Sarcoidose',
        comoSeparar: 'Granulomas compactos, bem formados, ao longo dos linfáticos (pleura, septos, feixes broncovasculares), com pouca inflamação intersticial entre eles.',
      },
      {
        nome: 'Pneumonia intersticial não específica',
        comoSeparar: 'Inflamação intersticial uniforme e difusa, sem centralização bronquiolar nem granulomas.',
      },
      {
        nome: 'Fibrose pulmonar idiopática (PIU)',
        comoSeparar: 'Fibrose subpleural heterogênea, focos fibroblásticos e faveolamento, com pouca inflamação.',
      },
    ],
    correlacaoClinica: [
      'Aguda: febre, calafrios, tosse e dispneia 4–8 horas após exposição intensa. Crônica: dispneia progressiva e tosse seca, como neste caso de não fumante.',
      'TC: vidro fosco, nódulos centrolobulares e aprisionamento aéreo; lavado broncoalveolar com linfocitose.',
      'Tratamento: afastar-se do antígeno é essencial; corticoides nas formas persistentes.',
    ],
    comparacaoComNormal: [
      'No pulmão normal, os septos alveolares são finos, com uma fileira de capilares e raríssimas células inflamatórias.',
      'Na pneumonite de hipersensibilidade, os septos ficam grossos, cheios de linfócitos, sobretudo perto dos bronquíolos, mas os alvéolos continuam com ar.',
    ],
  },
  {
    id: 'pneumonia-em-organizacao',
    nome: 'Pneumonia em organização',
    sinonimos: ['pneumonia organizante', 'pneumonia em organização criptogênica', 'COP', 'BOOP', 'bronquiolite obliterante com pneumonia em organização'],
    nomesEmIngles: ['organising pneumonia', 'cryptogenic organizing pneumonia', 'BOOP'],
    sistema: 'respiratorio',
    orgao: 'pulmao',
    prioridade: 5,
    resumo:
      'Padrão de reparo pulmonar em que os espaços aéreos distais (alvéolos, ductos, bronquíolos) são preenchidos por tampões de tecido de granulação jovem — os corpos de Masson —, com a arquitetura pulmonar preservada.',
    epidemiologia:
      'Adultos de 50–60 anos. Pode ser criptogênica (idiopática) ou secundária: pneumonia infecciosa que não se resolve, drogas (amiodarona, metotrexato), colagenoses, radioterapia, transplante, aspiração. Na TC pode simular massa ou pneumonia que não melhora.',
    patogenese: [
      'Lesão do epitélio alveolar deixa exsudato rico em fibrina nos espaços aéreos.',
      'Em vez de reabsorvido (resolução), o exsudato é invadido por fibroblastos e capilares vindos das paredes alveolares.',
      'Formam-se tampões de tecido de granulação que se estendem de alvéolo em alvéolo pelos poros de Kohn e para dentro dos bronquíolos.',
      'Os septos mostram inflamação leve e pneumócitos tipo II reativos; a arquitetura não é destruída — por isso o processo é reversível com corticoide.',
    ],
    roteiro: [
      'Panorâmico: arquitetura preservada, com áreas mais densas em manchas.',
      'Médio aumento: procure tampões pálidos, mixoides, dentro dos espaços aéreos (corpos de Masson).',
      'Grande aumento: fibroblastos em matriz frouxa revestidos por pneumócitos; septos com linfócitos leves e pneumócitos tipo II reativos.',
      'Procure a causa e exclua o que muda a conduta: tumor ao lado (biópsia de "massa"), infecção, granulomas, membranas hialinas (DAD).',
    ],
    achados: [
      {
        achado: 'corpos-de-masson',
        tipo: 'especifico',
        comoAparece: 'Tampões de tecido de granulação mixoide dentro de alvéolos e ductos alveolares.',
        peso: 'criterio',
      },
      {
        achado: 'hiperplasia-de-pneumocitos-tipo-ii',
        tipo: 'geral',
        comoAparece: 'Pneumócitos tipo II volumosos revestindo septos e tampões.',
        peso: 'frequente',
      },
      {
        achado: 'pneumonite-intersticial-cronica',
        tipo: 'geral',
        comoAparece: 'Inflamação intersticial leve nos septos vizinhos.',
        peso: 'frequente',
      },
      {
        achado: 'antracose',
        tipo: 'geral',
        comoAparece: 'Pigmento de carvão em áreas de fibrose, incidental.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Dano alveolar difuso organizante',
        comoSeparar: 'Organização predominantemente INTERSTICIAL e difusa, com restos de membranas hialinas; clínica de SDRA.',
      },
      {
        nome: 'Pneumonia intersticial usual (PIU)',
        comoSeparar: 'Fibrose densa, subpleural e heterogênea com faveolamento; focos fibroblásticos no interstício, não em tampões intra-alveolares.',
      },
      {
        nome: 'Adenocarcinoma ou outra lesão na borda',
        comoSeparar: 'Em biópsias por agulha, a pneumonia em organização pode ser só a reação ao redor de um tumor: correlacione com a imagem e reveja se a lesão persiste.',
      },
    ],
    correlacaoClinica: [
      'Quadro subagudo de semanas: tosse, dispneia, febre e perda de peso, frequentemente tratado como pneumonia sem melhora com antibióticos.',
      'TC: consolidações periféricas migratórias, sinal do halo invertido ("atol"); às vezes massa.',
      'Tratamento: corticoides, com boa resposta; recidivas são comuns ao reduzir a dose.',
    ],
    comparacaoComNormal: [
      'No pulmão normal, alvéolos vazios com septos finos.',
      'Na pneumonia em organização, dentro de muitos alvéolos há "rolhas" pálidas de fibroblastos — como se o alvéolo estivesse cicatrizando por dentro —, mas as paredes continuam no lugar.',
    ],
  },
]
