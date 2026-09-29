import type { DoencaZoom } from '../tipos'

/** Doenças infecciosas e granulomatosas. */
export const DOENCAS_INFECCOES: DoencaZoom[] = [
  {
    id: 'tuberculose',
    nome: 'Tuberculose',
    sinonimos: ['linfadenite tuberculosa', 'escrófula', 'tuberculose ganglionar', 'tuberculose miliar'],
    nomesEmIngles: ['tuberculosis', 'tuberculous lymphadenitis', 'caseating granulomatous inflammation'],
    sistema: 'linfoide',
    orgao: 'linfonodo',
    prioridade: 1,
    resumo:
      'Infecção por Mycobacterium tuberculosis que provoca inflamação granulomatosa com necrose caseosa: granulomas de macrófagos epitelioides, células gigantes de Langhans e linfócitos em torno de um centro de necrose amorfa.',
    epidemiologia:
      'Cerca de um quarto da população mundial tem infecção latente; o Brasil está entre os países de alta carga, com mais de 80 mil casos novos por ano. Risco maior em HIV, desnutrição, diabetes, uso de imunossupressores (anti-TNF) e populações privadas de liberdade. A forma ganglionar é a extrapulmonar mais comum, sobretudo cervical.',
    patogenese: [
      'O bacilo inalado é fagocitado por macrófagos alveolares, mas bloqueia a fusão do fagossomo com o lisossomo e se multiplica dentro deles.',
      'Após 2–3 semanas, linfócitos T CD4 Th1 específicos secretam IFN-γ, que ativa os macrófagos: eles viram células epitelioides e se fundem em células gigantes de Langhans.',
      'O TNF organiza o granuloma, que contém a infecção; no centro, a resposta imune mata macrófagos infectados e o tecido — necrose caseosa.',
      'Pelos linfáticos, o bacilo chega aos linfonodos regionais, que aumentam, caseificam e podem fistulizar para a pele (escrófula).',
      'Se a imunidade falha, o bacilo se espalha pelo sangue e semeia granulomas pequenos em vários órgãos (tuberculose miliar).',
    ],
    roteiro: [
      'Panorâmico: o linfonodo perdeu a arquitetura de folículos e seios; grandes áreas rosa-pálidas, amorfas e confluentes (caseose) estão cercadas por uma faixa arroxeada.',
      'Médio aumento: na borda da necrose, procure a coroa de macrófagos epitelioides e as células gigantes.',
      'Grande aumento: células de Langhans com núcleos em ferradura; macrófagos epitelioides de núcleo alongado; linfócitos por fora.',
      'No tecido linfoide residual, procure granulomas pequenos, ainda sem necrose, em formação.',
      'Lembre: o bacilo não se vê em H&E — confirme com Ziehl-Neelsen (BAAR), cultura ou PCR.',
    ],
    achados: [
      {
        achado: 'necrose-caseosa',
        tipo: 'especifico',
        comoAparece: 'Áreas extensas de necrose amorfa, eosinofílica e granular, sem arquitetura, no centro dos granulomas confluentes.',
        peso: 'criterio',
      },
      {
        achado: 'granuloma-epitelioide',
        tipo: 'especifico',
        comoAparece: 'Macrófagos epitelioides em paliçada ao redor da necrose e granulomas pequenos em formação.',
        peso: 'criterio',
      },
      {
        achado: 'celula-gigante-de-langhans',
        tipo: 'especifico',
        comoAparece: 'Células gigantes com núcleos em ferradura na borda dos granulomas.',
        peso: 'frequente',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Coroa de linfócitos em torno dos granulomas.',
        peso: 'frequente',
      },
      {
        achado: 'fibrose-cicatricial',
        tipo: 'geral',
        comoAparece: 'Fibrose e calcificação nas lesões antigas ou tratadas.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Sarcoidose',
        comoSeparar: 'Granulomas "nus", compactos, bem delimitados e SEM necrose caseosa, com poucos linfócitos; pesquisa de BAAR e fungos negativa.',
      },
      {
        nome: 'Infecção fúngica (histoplasmose, criptococose, paracoccidioidomicose)',
        comoSeparar: 'Pode ter necrose; as leveduras aparecem no PAS ou na prata (Grocott). A paracoccidioidomicose, frequente no Brasil, mostra leveduras com brotamento múltiplo ("roda de leme").',
      },
      {
        nome: 'Doença da arranhadura do gato',
        comoSeparar: 'Granulomas com necrose SUPURATIVA (neutrófilos no centro), em forma estrelada.',
      },
      {
        nome: 'Linfoma com necrose',
        comoSeparar: 'Necrose tumoral cercada por células atípicas, não por granulomas epitelioides e células de Langhans.',
      },
    ],
    correlacaoClinica: [
      'Forma ganglionar: linfonodos cervicais aumentados, endurecidos e confluentes, às vezes fistulizados para a pele; pode haver febre vespertina, sudorese noturna e emagrecimento.',
      'Diagnóstico: biópsia (granuloma caseoso), BAAR, cultura, teste molecular rápido (GeneXpert); investigar HIV em todo caso.',
      'Tratamento: RIPE (rifampicina, isoniazida, pirazinamida e etambutol) por 2 meses, seguido de RI por 4 meses; notificação compulsória.',
      'Antes de anti-TNF, rastrear tuberculose latente — o TNF é o que mantém o granuloma organizado.',
    ],
    comparacaoComNormal: [
      'O linfonodo normal tem cápsula, seio subcapsular, folículos linfoides no córtex, paracórtex e cordões e seios medulares — todos formados por células pequenas e escuras.',
      'Na tuberculose, grande parte do linfonodo vira necrose rosa e amorfa, e o tecido linfoide que resta é invadido por granulomas pálidos.',
    ],
  },
]
