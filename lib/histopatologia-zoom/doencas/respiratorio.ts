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
  {
    id: 'adenocarcinoma-de-pulmao',
    nome: 'Adenocarcinoma de pulmão',
    sinonimos: ['adenocarcinoma pulmonar', 'câncer de pulmão não pequenas células (adenocarcinoma)'],
    nomesEmIngles: ['lung adenocarcinoma'],
    sistema: 'respiratorio',
    orgao: 'pulmao',
    prioridade: 6,
    resumo:
      'Carcinoma de pulmão com diferenciação glandular (glândulas, papilas, crescimento lepídico ou produção de mucina); é o tipo histológico mais comum de câncer de pulmão, inclusive em não fumantes.',
    epidemiologia:
      'Cerca de 40–50 % dos cânceres de pulmão; é o tipo mais frequente em mulheres, em não fumantes e em jovens. Geralmente periférico. Fatores: tabagismo, radônio, poluição, asbesto, história familiar.',
    patogenese: [
      'Precursor: hiperplasia adenomatosa atípica → adenocarcinoma in situ (lepídico) → minimamente invasivo → invasivo.',
      'Mutações "condutoras" (drivers) ativam vias de proliferação: KRAS (fumantes), EGFR (não fumantes, asiáticos, mulheres), fusões de ALK, ROS1, RET, e BRAF, MET, HER2.',
      'O tumor cresce sobre os septos alveolares (lepídico) e depois invade o estroma, formando glândulas (acinar), papilas, micropapilas ou lençóis sólidos com reação desmoplásica.',
      'Essas alterações são alvos terapêuticos: todo adenocarcinoma avançado deve ter pesquisa molecular e de PD-L1.',
    ],
    roteiro: [
      'Panorâmico: nódulo periférico; identifique áreas de arquitetura alveolar preservada (lepídico) e áreas sólidas com fibrose (invasão).',
      'Médio aumento: defina o padrão predominante — lepídico, acinar, papilífero, micropapilífero ou sólido.',
      'Grande aumento: células cúbicas a colunares com núcleos grandes, nucléolos e às vezes mucina; compare com pneumócitos normais.',
      'Procure antracose, invasão pleural e vascular; na biópsia, o laudo inclui a imuno (TTF-1, napsina A) e o material para biologia molecular.',
    ],
    achados: [
      {
        achado: 'glandulas-neoplasicas-complexas',
        tipo: 'especifico',
        comoAparece: 'Glândulas acinares, papilas ou lençóis de células atípicas com formação de luzes.',
        peso: 'criterio',
      },
      {
        achado: 'crescimento-lepidico',
        tipo: 'especifico',
        comoAparece: 'Células atípicas revestindo septos alveolares preservados, na periferia do tumor.',
        peso: 'frequente',
      },
      {
        achado: 'atipia-citologica',
        tipo: 'geral',
        comoAparece: 'Núcleos grandes, vesiculosos, com nucléolos evidentes e às vezes em "tachinha".',
        peso: 'criterio',
      },
      {
        achado: 'reacao-desmoplasica',
        tipo: 'geral',
        comoAparece: 'Estroma fibroso reativo com células tumorais infiltrando — o componente invasivo.',
        peso: 'frequente',
      },
      {
        achado: 'antracose',
        tipo: 'geral',
        comoAparece: 'Pigmento de carvão aprisionado na cicatriz do tumor.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Pneumócitos reativos (pneumonia, dano alveolar)',
        comoSeparar: 'Atipia com inflamação, membranas hialinas ou fibrina; transição gradual, sem glândulas invasivas.',
      },
      {
        nome: 'Metástase de adenocarcinoma (cólon, mama, pâncreas)',
        comoSeparar: 'Clínica e imuno: TTF-1 e napsina A positivos favorecem pulmão; CDX2/CK20 cólon; GATA3 mama.',
      },
      {
        nome: 'Mesotelioma epitelioide',
        comoSeparar: 'Crescimento difuso na pleura, calretinina/WT1/D2-40 positivos, TTF-1 negativo.',
      },
    ],
    correlacaoClinica: [
      'Muitas vezes assintomático, descoberto como nódulo periférico em TC (rastreamento com TC de baixa dose em fumantes de 50–80 anos).',
      'Sintomas tardios: tosse, hemoptise, perda de peso, derrame pleural; metástases para cérebro, osso, adrenal e fígado.',
      'Tratamento: ressecção nos estágios iniciais; terapia-alvo (osimertinibe para EGFR, alectinibe para ALK) e imunoterapia nos avançados.',
    ],
    comparacaoComNormal: [
      'No pulmão normal, os alvéolos são revestidos por pneumócitos achatados, quase invisíveis, e os septos são finos.',
      'No adenocarcinoma, as paredes ficam revestidas por células grandes e atípicas (lepídico) ou são substituídas por glândulas em estroma fibroso.',
    ],
  },
  {
    id: 'carcinoma-escamoso-de-pulmao',
    nome: 'Carcinoma de células escamosas de pulmão',
    sinonimos: ['carcinoma epidermoide de pulmão', 'carcinoma espinocelular de pulmão'],
    nomesEmIngles: ['squamous cell carcinoma of the lung'],
    sistema: 'respiratorio',
    orgao: 'pulmao',
    prioridade: 7,
    resumo:
      'Carcinoma de pulmão com diferenciação escamosa (queratinização ou pontes intercelulares), em geral central, nascido no epitélio brônquico metaplásico de fumantes.',
    epidemiologia:
      'Cerca de 25–30 % dos cânceres de pulmão; fortemente associado ao tabagismo (mais que o adenocarcinoma), mais comum em homens. Tipicamente central (brônquios principais e lobares); pode cavitar.',
    patogenese: [
      'A fumaça lesa o epitélio respiratório ciliado, que é substituído por epitélio escamoso (metaplasia escamosa) — mais resistente, mas sem cílios.',
      'Mutações se acumulam (TP53, CDKN2A, amplificação de SOX2 e FGFR1): metaplasia → displasia → carcinoma in situ.',
      'O carcinoma invade a parede brônquica, cresce para dentro da luz e obstrui o brônquio (atelectasia, pneumonia pós-obstrutiva).',
      'Pode produzir PTHrP: hipercalcemia paraneoplásica.',
    ],
    roteiro: [
      'Panorâmico: tumor em relação com um brônquio (cartilagem e glândulas seromucosas ao lado), ocupando ou obstruindo a luz.',
      'Médio aumento: ninhos e lençóis de células poligonais com citoplasma eosinofílico, separados por estroma; procure necrose central nos ninhos.',
      'Grande aumento: pontes intercelulares, queratinização individual (células muito rosadas) e pérolas córneas; gradue pela quantidade de queratina.',
    ],
    achados: [
      {
        achado: 'ninhos-escamosos-infiltrativos',
        tipo: 'especifico',
        comoAparece: 'Ninhos e lençóis de células poligonais escamosas infiltrando a parede brônquica e o pulmão.',
        peso: 'criterio',
      },
      {
        achado: 'perola-cornea',
        tipo: 'especifico',
        comoAparece: 'Queratina lamelar em pérolas no centro dos ninhos (tumores bem diferenciados).',
        peso: 'frequente',
      },
      {
        achado: 'atipia-citologica',
        tipo: 'geral',
        comoAparece: 'Núcleos grandes, hipercromáticos, pleomórficos, com mitoses.',
        peso: 'frequente',
      },
      {
        achado: 'necrose-coagulativa',
        tipo: 'geral',
        comoAparece: 'Necrose no centro dos ninhos e na superfície do tumor, misturada com queratina.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'Adenocarcinoma sólido',
        comoSeparar: 'Sem queratina nem pontes; mucina em algumas células; TTF-1+ e p40−.',
      },
      {
        nome: 'Metástase de carcinoma escamoso (cabeça e pescoço, colo uterino)',
        comoSeparar: 'Clínica; carcinoma in situ no brônquio adjacente favorece primário pulmonar; p16/HPV em metástases de orofaringe e colo.',
      },
      {
        nome: 'Metaplasia escamosa reativa',
        comoSeparar: 'Epitélio escamoso maduro na superfície, sem atipia importante nem invasão.',
      },
    ],
    correlacaoClinica: [
      'Tosse, hemoptise, sibilo localizado; pneumonia de repetição no mesmo lobo por obstrução brônquica.',
      'Hipercalcemia paraneoplásica (PTHrP); tumor de Pancoast quando no ápice (síndrome de Horner).',
      'Diagnóstico por broncoscopia com biópsia (p40/p63+, TTF-1−). Tratamento: cirurgia nos iniciais; quimio-radioterapia e imunoterapia.',
    ],
    comparacaoComNormal: [
      'O brônquio normal é revestido por epitélio respiratório (pseudoestratificado, ciliado, com células caliciformes), sobre glândulas seromucosas e cartilagem.',
      'No carcinoma escamoso, massas de células escamosas atípicas substituem esse epitélio, crescem para a luz e invadem a parede.',
    ],
  },
  {
    id: 'carcinoma-de-pequenas-celulas-de-pulmao',
    nome: 'Carcinoma de pequenas células de pulmão',
    sinonimos: ['oat cell', 'carcinoma de células em grão de aveia', 'CPPC', 'carcinoma neuroendócrino de pequenas células'],
    nomesEmIngles: ['small cell lung carcinoma', 'SCLC'],
    sistema: 'respiratorio',
    orgao: 'pulmao',
    prioridade: 8,
    resumo:
      'Carcinoma neuroendócrino de alto grau formado por células pequenas, de citoplasma escasso e núcleos que se amoldam, com necrose, muitas mitoses e esmagamento fácil; o mais agressivo dos cânceres de pulmão.',
    epidemiologia:
      'Cerca de 15 % dos cânceres de pulmão; quase exclusivamente em fumantes pesados. Central, perihilar, com metástases linfonodais e a distância precoces (fígado, osso, cérebro, adrenal) — 2/3 já em doença extensa ao diagnóstico.',
    patogenese: [
      'Inativação quase universal de TP53 e RB1 pela carga mutagênica do tabaco.',
      'As células adquirem programa neuroendócrino (ASCL1, NEUROD1): grânulos neurossecretores e produção de hormônios ectópicos.',
      'Proliferação altíssima (Ki-67 > 70 %) com necrose extensa; crescimento na submucosa, em volta dos brônquios, com disseminação linfática precoce.',
      'Hormônios e anticorpos explicam as síndromes paraneoplásicas: SIADH (hiponatremia), Cushing (ACTH), Lambert-Eaton (anticanais de cálcio).',
    ],
    roteiro: [
      'Panorâmico: fragmentos de biópsia brônquica muito azuis, com áreas de esmagamento e necrose.',
      'Médio aumento: lençóis de células pequenas infiltrando o estroma da submucosa, com a mucosa por cima às vezes preservada.',
      'Grande aumento: moldagem nuclear, cromatina fina, ausência de nucléolo, citoplasma escasso, mitoses e apoptoses abundantes.',
      'Confirme com imuno (TTF-1, sinaptofisina, CD56, Ki-67 alto; CD45 negativo para excluir linfoma).',
    ],
    achados: [
      {
        achado: 'celulas-pequenas-com-moldagem-nuclear',
        tipo: 'especifico',
        comoAparece: 'Lençóis de células pequenas com moldagem nuclear, cromatina fina, sem nucléolo.',
        peso: 'criterio',
      },
      {
        achado: 'artefato-de-esmagamento',
        tipo: 'especifico',
        comoAparece: 'Faixas de cromatina estirada nas bordas dos fragmentos.',
        peso: 'frequente',
      },
      {
        achado: 'invasao-estromal',
        tipo: 'geral',
        comoAparece: 'Cordões e ninhos de células tumorais infiltrando o estroma fibroso da parede brônquica.',
        peso: 'frequente',
      },
      {
        achado: 'necrose-coagulativa',
        tipo: 'geral',
        comoAparece: 'Necrose extensa em lençóis.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'Linfoma ou infiltrado linfoide',
        comoSeparar: 'Células sem moldagem, que não formam ninhos; CD45+ e citoqueratina negativa.',
      },
      {
        nome: 'Carcinoide (típico/atípico)',
        comoSeparar: 'Células com citoplasma moderado, arranjo organoide, poucas mitoses, sem necrose extensa; Ki-67 baixo.',
      },
      {
        nome: 'Carcinoma escamoso basaloide',
        comoSeparar: 'Nucléolos, paliçada periférica, p40+ e sem marcadores neuroendócrinos.',
      },
    ],
    correlacaoClinica: [
      'Tosse, dispneia, perda de peso; síndrome da veia cava superior por massa mediastinal.',
      'Síndromes paraneoplásicas: SIADH, Cushing ectópico, Lambert-Eaton, degeneração cerebelar.',
      'Tratamento: quimioterapia (platina + etoposídeo) + imunoterapia; radioterapia torácica e cerebral profilática. Sobrevida mediana de cerca de 1 ano na doença extensa.',
    ],
    comparacaoComNormal: [
      'Na mucosa brônquica normal, as células neuroendócrinas são raras e isoladas na base do epitélio; a submucosa tem glândulas e estroma frouxo.',
      'No carcinoma de pequenas células, lençóis de células "azuis" pequenas ocupam toda a submucosa e se esmagam ao toque da pinça.',
    ],
  },
  {
    id: 'carcinoide-pulmonar',
    nome: 'Tumor carcinoide pulmonar',
    sinonimos: ['carcinoide típico', 'tumor neuroendócrino bem diferenciado do pulmão', 'adenoma brônquico (termo antigo)'],
    nomesEmIngles: ['pulmonary carcinoid tumour', 'typical carcinoid'],
    sistema: 'respiratorio',
    orgao: 'pulmao',
    prioridade: 9,
    resumo:
      'Tumor neuroendócrino bem diferenciado do pulmão: células uniformes em ninhos e trabéculas com cromatina em "sal e pimenta", estroma vascular, poucas mitoses e sem necrose.',
    epidemiologia:
      '1–2 % dos tumores pulmonares; qualquer idade (média 45–55 anos), sem relação forte com tabagismo. É o tumor pulmonar primário mais comum em crianças e adolescentes. Maioria central, em brônquios; associado a NEM-1.',
    patogenese: [
      'Origina-se das células neuroendócrinas (Kulchitsky) do epitélio brônquico, às vezes sobre hiperplasia de células neuroendócrinas (DIPNECH).',
      'Alterações genéticas poucas (MEN1, remodeladores de cromatina) — diferente dos carcinomas neuroendócrinos de alto grau (sem TP53/RB1).',
      'Cresce lentamente como massa polipoide dentro do brônquio, recoberta por mucosa, e se estende pela parede em "iceberg".',
      'Secreta aminas e peptídeos (serotonina, ACTH); a síndrome carcinoide é rara porque o pulmão drena direto para a circulação sistêmica apenas quando há metástases volumosas.',
    ],
    roteiro: [
      'Panorâmico: tumor bem delimitado e muito celular, em relação com brônquio e cartilagem.',
      'Médio aumento: padrão organoide — ninhos, trabéculas, rosetas — separados por septos vasculares finos.',
      'Grande aumento: núcleos redondos a ovais e uniformes, cromatina "sal e pimenta", citoplasma eosinofílico moderado.',
      'Conte mitoses (< 2/2 mm² = típico; 2–10 = atípico) e procure necrose (atípico).',
    ],
    achados: [
      {
        achado: 'ninhos-neuroendocrinos-organoides',
        tipo: 'especifico',
        comoAparece: 'Ninhos e trabéculas de células uniformes com cromatina em sal e pimenta, separados por capilares.',
        peso: 'criterio',
      },
      {
        achado: 'invasao-estromal',
        tipo: 'geral',
        comoAparece: 'Ninhos estendendo-se pela parede brônquica e entre os feixes fibrosos.',
        peso: 'frequente',
      },
      {
        achado: 'necrose-coagulativa',
        tipo: 'geral',
        comoAparece: 'Ausente no carcinoide típico; focal no atípico.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Carcinoma de pequenas células',
        comoSeparar: 'Citoplasma escasso, moldagem, mitoses abundantes, necrose extensa, Ki-67 > 70 %.',
      },
      {
        nome: 'Adenocarcinoma sólido',
        comoSeparar: 'Pleomorfismo, nucléolos, mucina; marcadores neuroendócrinos negativos ou focais.',
      },
      {
        nome: 'Paraganglioma e tumor glômico',
        comoSeparar: 'Raríssimos no pulmão; citoqueratina negativa (paraganglioma) ou actina de músculo liso positiva (glômico).',
      },
    ],
    correlacaoClinica: [
      'Tosse, sibilo localizado, hemoptise (tumor muito vascular) e pneumonia de repetição por obstrução; muitos são achados em exame de imagem.',
      'Diagnóstico por broncoscopia (lesão polipoide vermelho-cereja) e biópsia; cintilografia/PET com análogos de somatostatina.',
      'Tratamento: ressecção cirúrgica conservadora de parênquima (broncoplastia, lobectomia). Sobrevida em 10 anos > 90 % no típico.',
    ],
    comparacaoComNormal: [
      'No brônquio normal, as células neuroendócrinas são poucas, isoladas entre as células ciliadas, invisíveis no H&E.',
      'No carcinoide, elas formam uma massa de ninhos de células iguais, com cromatina pontilhada, que empurra ou atravessa a parede brônquica.',
    ],
  },
]
