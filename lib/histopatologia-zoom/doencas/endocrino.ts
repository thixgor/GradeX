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
]
