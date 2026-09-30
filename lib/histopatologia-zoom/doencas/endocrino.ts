import type { DoencaZoom } from '../tipos'

/** Glândulas endócrinas. */
export const DOENCAS_ENDOCRINO: DoencaZoom[] = [
  {
    id: 'tireoidite-de-hashimoto',
    nome: 'Tireoidite de Hashimoto',
    sinonimos: ['tireoidite linfocítica crônica', 'tireoidite autoimune', 'Hashimoto'],
    nomesEmIngles: ["Hashimoto's thyroiditis", 'chronic lymphocytic thyroiditis'],
    sistema: 'endocrino',
    orgao: 'tireoide',
    prioridade: 1,
    resumo:
      'Doença autoimune que destrói a tireoide: infiltrado linfoplasmocitário denso com folículos linfoides e centros germinativos, folículos atróficos e metaplasia oncocítica (células de Hürthle) — a causa mais comum de hipotireoidismo onde há iodo suficiente.',
    epidemiologia:
      'Muito mais comum em mulheres (7–10 : 1), entre 45 e 65 anos. Associa-se a outras doenças autoimunes (diabetes tipo 1, doença celíaca, anemia perniciosa, vitiligo) e a HLA-DR3/DR5; aumenta o risco de linfoma MALT da tireoide.',
    patogenese: [
      'Falha da tolerância a antígenos da tireoide (tireoperoxidase, tireoglobulina) em indivíduo predisposto.',
      'Linfócitos T CD4 ativam linfócitos T CD8 citotóxicos, que matam as células foliculares; citocinas (IFN-γ) aumentam a expressão de moléculas que sensibilizam as células à apoptose.',
      'Linfócitos B produzem anticorpos anti-TPO e anti-tireoglobulina e formam folículos linfoides com centros germinativos dentro da própria tireoide.',
      'As células foliculares que resistem acumulam mitocôndrias (células de Hürthle); o parênquima destruído é substituído por fibrose.',
      'Fase inicial pode liberar hormônio estocado (hashitoxicose transitória); depois, a perda de folículos leva ao hipotireoidismo.',
    ],
    roteiro: [
      'Panorâmico: a tireoide tem aspecto "roxo" e lobulado, porque o infiltrado linfoide ocupa grande parte do órgão.',
      'Médio aumento: procure folículos linfoides com centro germinativo — tecido linfoide organizado que não existe na tireoide normal.',
      'Veja os folículos tireoidianos: menores, com pouco coloide, espremidos entre linfócitos (atrofia).',
      'Grande aumento: células foliculares grandes e rosa-granulares (Hürthle); plasmócitos e linfócitos entre os folículos.',
      'Procure faixas de fibrose separando lóbulos (variante fibrosa).',
    ],
    achados: [
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Linfócitos e plasmócitos densos entre e ao redor dos folículos.',
        peso: 'criterio',
      },
      {
        achado: 'hiperplasia-linfoide-reativa',
        tipo: 'especifico',
        comoAparece: 'Folículos linfoides com centros germinativos dentro do parênquima tireoidiano.',
        peso: 'criterio',
      },
      {
        achado: 'metaplasia-oncocitica',
        tipo: 'especifico',
        comoAparece: 'Células de Hürthle revestindo folículos pequenos.',
        peso: 'frequente',
      },
      {
        achado: 'atrofia-folicular',
        tipo: 'especifico',
        comoAparece: 'Folículos pequenos, com pouco coloide.',
        peso: 'frequente',
      },
      {
        achado: 'fibrose-cicatricial',
        tipo: 'geral',
        comoAparece: 'Septos fibrosos entre lóbulos na doença avançada.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Tireoidite subaguda granulomatosa (de Quervain)',
        comoSeparar: 'Pós-viral e dolorosa; granulomas com células gigantes em torno de coloide extravasado, sem folículos linfoides abundantes.',
      },
      {
        nome: 'Doença de Graves',
        comoSeparar: 'Hiperplasia folicular com epitélio alto, papilas e coloide "recortado" (vacúolos de reabsorção); infiltrado linfoide discreto.',
      },
      {
        nome: 'Linfoma MALT da tireoide',
        comoSeparar: 'Surge sobre Hashimoto: lençóis monótonos de células B que destroem folículos (lesões linfoepiteliais), com clonalidade.',
      },
      {
        nome: 'Carcinoma papilífero',
        comoSeparar: 'Núcleos em vidro fosco, fendas e pseudoinclusões, papilas com corpos psamomatosos — podem coexistir com Hashimoto.',
      },
    ],
    correlacaoClinica: [
      'Bócio indolor, firme e difuso; hipotireoidismo com fadiga, ganho de peso, intolerância ao frio, pele seca, bradicardia.',
      'Anti-TPO elevado em mais de 90 %; TSH alto e T4 livre baixo na fase hipotireóidea.',
      'Tratamento: levotiroxina. Vigiar nódulos que cresçam rápido (linfoma).',
    ],
    comparacaoComNormal: [
      'Na tireoide normal, folículos de tamanhos variados, cheios de coloide rosa, são revestidos por epitélio cúbico baixo, com pouco estroma entre eles.',
      'No Hashimoto, o espaço entre os folículos é tomado por linfócitos (até com centros germinativos), os folículos encolhem e as células viram oncócitos rosa-granulares.',
    ],
  },
  {
    id: 'carcinoma-papilifero-da-tireoide',
    nome: 'Carcinoma papilífero da tireoide',
    sinonimos: ['carcinoma papilar da tireoide', 'CPT'],
    nomesEmIngles: ['papillary thyroid carcinoma'],
    sistema: 'endocrino',
    orgao: 'tireoide',
    prioridade: 2,
    resumo:
      'Câncer de tireoide mais comum (cerca de 85 %), definido pelas alterações nucleares características — núcleos claros, sobrepostos, com fendas e pseudoinclusões —, geralmente com papilas e corpos psamomatosos.',
    epidemiologia: 'Mulheres de 20–50 anos (3:1). Fatores: radiação ionizante na infância (Chernobyl), história familiar. Prognóstico excelente (sobrevida em 10 anos > 90 %).',
    patogenese: [
      'Ativação da via MAPK: mutação BRAF V600E (mais comum) ou rearranjos RET/PTC (relacionados à radiação), ou RAS na variante folicular.',
      'As células foliculares proliferam formando papilas com eixos fibrovasculares e alteram a arquitetura nuclear.',
      'Dissemina-se por linfáticos para os linfonodos cervicais (frequente e precoce); metástases a distância são raras.',
    ],
    roteiro: [
      'Panorâmico: nódulo infiltrativo ou encapsulado, diferente dos folículos cheios de coloide ao redor; às vezes fibrose e calcificação.',
      'Médio aumento: papilas com eixo fibrovascular e folículos com coloide escuro; procure corpos psamomatosos.',
      'Grande aumento: núcleos em vidro fosco, sobrepostos, com fendas e pseudoinclusões — o critério diagnóstico.',
    ],
    achados: [
      {
        achado: 'nucleos-de-carcinoma-papilifero',
        tipo: 'especifico',
        comoAparece: 'Núcleos claros, alongados e sobrepostos, com fendas e pseudoinclusões.',
        peso: 'criterio',
      },
      {
        achado: 'papilas-com-eixo-fibrovascular',
        tipo: 'especifico',
        comoAparece: 'Papilas ramificadas revestidas pelas células tumorais.',
        peso: 'frequente',
      },
      {
        achado: 'corpos-psamomatosos',
        tipo: 'geral',
        comoAparece: 'Calcificações lamelares nos eixos das papilas ou no estroma.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Nódulo hiperplásico (bócio) com papilas',
        comoSeparar: 'Papilas com núcleos redondos, escuros e regulares, sem vidro fosco nem fendas.',
      },
      {
        nome: 'Neoplasia folicular',
        comoSeparar: 'Padrão folicular sem as alterações nucleares do carcinoma papilífero.',
      },
    ],
    correlacaoClinica: [
      'Nódulo tireoidiano indolor ou linfonodo cervical aumentado; ultrassom com nódulo hipoecoico, microcalcificações e margens irregulares.',
      'Punção aspirativa por agulha fina (Bethesda). Tratamento: tireoidectomia (ou lobectomia nos pequenos), iodo radioativo nos de maior risco e supressão de TSH.',
    ],
    comparacaoComNormal: [
      'Na tireoide normal, folículos redondos cheios de coloide são revestidos por células cúbicas baixas, de núcleo redondo e escuro.',
      'No carcinoma papilífero, as células ficam altas e apinhadas, os núcleos clareiam e se sobrepõem, e o epitélio forma papilas.',
    ],
  },
  {
    id: 'diabetes-tipo-2-pancreas',
    nome: 'Diabetes mellitus tipo 2 (pâncreas)',
    sinonimos: ['diabetes tipo 2', 'DM2', 'amiloidose insular'],
    nomesEmIngles: ['type 2 diabetes mellitus', 'islet amyloidosis'],
    sistema: 'endocrino',
    orgao: 'pancreas',
    prioridade: 3,
    resumo:
      'No diabetes tipo 2, o pâncreas exócrino é normal, mas as ilhotas de Langerhans perdem células beta e acumulam amiloide (amilina), refletindo a falência progressiva da secreção de insulina somada à resistência insulínica.',
    epidemiologia:
      'Cerca de 90 % dos casos de diabetes; adultos, fortemente associado a obesidade, sedentarismo, história familiar e idade. Prevalência crescente no mundo e no Brasil.',
    patogenese: [
      'Resistência à insulina no músculo, fígado e tecido adiposo (obesidade visceral, ácidos graxos, inflamação).',
      'As células beta compensam produzindo mais insulina e amilina.',
      'A glicotoxicidade, a lipotoxicidade e os agregados de amilina (amiloide) lesam as células beta, que diminuem em número e função.',
      'Quando a secreção não compensa mais a resistência, surge a hiperglicemia; com anos de doença, o paciente pode precisar de insulina.',
      'No diabetes tipo 1, ao contrário, há insulite (linfócitos T destruindo as ilhotas) e perda quase total das células beta, sem amiloide.',
    ],
    roteiro: [
      'Panorâmico: pâncreas com ácinos normais — a doença não está no exócrino.',
      'Médio aumento: localize as ilhotas pálidas entre os ácinos e compare o tamanho e a celularidade.',
      'Grande aumento: material rosa, acelular e vítreo dentro das ilhotas (amiloide), com poucas células endócrinas; confirme com Congo.',
      'Procure hialinose arteriolar e aterosclerose, a doença vascular do diabetes.',
    ],
    achados: [
      {
        achado: 'amiloide-insular',
        tipo: 'especifico',
        comoAparece: 'Depósitos eosinofílicos acelulares dentro das ilhotas, substituindo células endócrinas.',
        peso: 'criterio',
      },
      {
        achado: 'espessamento-arterial',
        tipo: 'geral',
        comoAparece: 'Hialinose de arteríolas e aterosclerose das artérias.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Diabetes tipo 1',
        comoSeparar: 'Ilhotas pequenas, sem células beta, com insulite linfocitária no início; sem amiloide.',
      },
      {
        nome: 'Pancreatite crônica (diabetes pancreatogênico)',
        comoSeparar: 'Fibrose extensa com perda de ácinos; as ilhotas ficam agregadas e depois também se perdem.',
      },
    ],
    correlacaoClinica: [
      'Muitas vezes assintomático por anos; poliúria, polidipsia e perda de peso nos casos descompensados. Diagnóstico por glicemia de jejum ≥ 126 mg/dL, HbA1c ≥ 6,5 % ou TOTG.',
      'Complicações: nefropatia, retinopatia, neuropatia e doença cardiovascular aterosclerótica.',
      'Tratamento: dieta, exercício e perda de peso; metformina, inibidores de SGLT2, agonistas de GLP-1, outros hipoglicemiantes e insulina.',
    ],
    comparacaoComNormal: [
      'No pâncreas normal, as ilhotas são grupos redondos de células endócrinas pálidas, cheias de capilares, entre ácinos serosos.',
      'No diabetes tipo 2, essas ilhotas ficam com massas rosadas de amiloide no lugar de parte das células.',
    ],
  },
]
