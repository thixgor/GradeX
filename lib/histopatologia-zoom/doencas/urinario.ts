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
]
