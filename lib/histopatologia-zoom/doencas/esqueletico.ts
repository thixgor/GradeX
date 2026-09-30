import type { DoencaZoom } from '../tipos'

/** Ossos e cartilagem. */
export const DOENCAS_ESQUELETICO: DoencaZoom[] = [
  {
    id: 'osteoporose',
    nome: 'Osteoporose',
    sinonimos: ['osteopenia', 'osteoporose pós-menopausa', 'osteoporose senil'],
    nomesEmIngles: ['osteoporosis'],
    sistema: 'esqueletico',
    orgao: 'epifise-osso-longo',
    prioridade: 1,
    resumo:
      'Diminuição da massa óssea com deterioração da microarquitetura: trabéculas finas e desconectadas, cortical adelgaçada, osso de mineralização normal, com risco aumentado de fraturas por baixo impacto.',
    epidemiologia:
      'Doença óssea mais comum; afeta sobretudo mulheres após a menopausa e idosos. Fatores: deficiência de estrogênio, idade, baixo pico de massa óssea, tabagismo, álcool, sedentarismo, corticoides, hipertireoidismo, deficiência de cálcio e vitamina D.',
    patogenese: [
      'Até os 30 anos o osso atinge o pico de massa; depois, a remodelação passa a remover um pouco mais do que forma a cada ciclo.',
      'A queda de estrogênio aumenta RANKL e diminui osteoprotegerina: osteoclastos mais numerosos e ativos.',
      'Com a idade, os osteoblastos perdem capacidade; o osso trabecular, com grande superfície, é perdido primeiro (vértebras, punho).',
      'Trabéculas perfuradas e cortical fina: fraturas com traumas mínimos (vertebrais por compressão, colo do fêmur, rádio distal, costelas).',
    ],
    roteiro: [
      'Panorâmico: compare a densidade da rede trabecular com o osso normal — poucas trabéculas, espaços medulares amplos.',
      'Médio aumento: trabéculas finas, interrompidas, com lamelas normais; medula rica em gordura.',
      'Cortical: fina; em fraturas, calo ósseo com cartilagem e osso novo.',
    ],
    achados: [
      {
        achado: 'trabeculas-osseas-afinadas',
        tipo: 'especifico',
        comoAparece: 'Trabéculas finas, curtas e desconectadas, muito espaçadas.',
        peso: 'criterio',
      },
      {
        achado: 'fibrose-cicatricial',
        tipo: 'geral',
        comoAparece: 'Calo de fratura com tecido fibroso e cartilagem, quando há fratura recente.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Osteomalácia',
        comoSeparar: 'Bordas largas de osteoide não mineralizado sobre as trabéculas (deficiência de vitamina D).',
      },
      {
        nome: 'Hiperparatireoidismo (osteíte fibrosa)',
        comoSeparar: 'Reabsorção osteoclástica em túnel com fibrose da medula e tumores marrons.',
      },
      {
        nome: 'Mieloma múltiplo',
        comoSeparar: 'Lesões líticas com plasmócitos atípicos em lençóis na medula.',
      },
    ],
    correlacaoClinica: [
      'Silenciosa até a fratura: perda de altura, cifose dorsal ("corcunda de viúva"), dor por fraturas vertebrais, fratura de quadril em quedas.',
      'Diagnóstico pela densitometria (T-score ≤ −2,5) ou fratura por fragilidade; FRAX estima o risco.',
      'Tratamento: cálcio e vitamina D, exercício, bisfosfonatos, denosumabe, teriparatida e romosozumabe; prevenção de quedas.',
    ],
    comparacaoComNormal: [
      'No osso esponjoso normal, trabéculas espessas formam uma rede contínua, com medula hematopoética entre elas.',
      'Na osteoporose, as trabéculas ficam finas e soltas, e a gordura ocupa os espaços que se abriram.',
    ],
  },
  {
    id: 'condrossarcoma',
    nome: 'Condrossarcoma',
    sinonimos: ['condrossarcoma convencional', 'sarcoma cartilaginoso'],
    nomesEmIngles: ['chondrosarcoma'],
    sistema: 'esqueletico',
    orgao: 'epifise-osso-longo',
    prioridade: 2,
    resumo:
      'Sarcoma ósseo que produz matriz cartilaginosa: lóbulos de cartilagem com condrócitos atípicos, mais celulares que a cartilagem normal, que infiltram e envolvem o osso.',
    epidemiologia:
      'Segundo sarcoma ósseo primário mais comum (depois do osteossarcoma), em adultos de 40–70 anos. Localizações: pelve, fêmur proximal, úmero, costelas, escápula. Pode surgir de encondroma (síndromes de Ollier e Maffucci) ou de osteocondroma.',
    patogenese: [
      'Mutações de IDH1/IDH2 (em encondromas e condrossarcomas centrais) alteram o metabolismo e a epigenética das células condrogênicas.',
      'Alterações adicionais (CDKN2A, TP53, COL2A1) levam à proliferação de condrócitos atípicos que invadem a medula e envolvem as trabéculas.',
      'O tumor cresce lentamente, erode a cortical por dentro (festonamento endosteal) e pode sair para as partes moles; os de alto grau metastatizam para o pulmão.',
    ],
    roteiro: [
      'Panorâmico: tumor lobulado de matriz cartilaginosa; procure osso aprisionado (permeação) e a interface com as partes moles.',
      'Médio aumento: celularidade maior que a da cartilagem normal, especialmente na periferia dos lóbulos; matriz hialina ou mixoide.',
      'Grande aumento: condrócitos com núcleos aumentados e hipercromáticos, binucleados; mitoses nos de alto grau — defina o grau.',
    ],
    achados: [
      {
        achado: 'condrocitos-atipicos',
        tipo: 'especifico',
        comoAparece: 'Condrócitos pleomórficos, hipercromáticos e binucleados em matriz cartilaginosa.',
        peso: 'criterio',
      },
      {
        achado: 'invasao-estromal',
        tipo: 'geral',
        comoAparece: 'Permeação da medula e envolvimento de trabéculas ósseas pré-existentes.',
        peso: 'frequente',
      },
      {
        achado: 'necrose-coagulativa',
        tipo: 'geral',
        comoAparece: 'Necrose nos tumores de alto grau.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Encondroma',
        comoSeparar: 'Pouca celularidade, sem atipia significativa, sem permeação do osso; lesão pequena e sem dor na radiologia.',
      },
      {
        nome: 'Osteossarcoma condroblástico',
        comoSeparar: 'Jovens; além da cartilagem, há osteoide produzido diretamente por células malignas.',
      },
    ],
    correlacaoClinica: [
      'Dor profunda e progressiva, às vezes noturna, com ou sem massa; radiografia com lesão lítica com calcificações "em anéis e arcos" e festonamento endosteal.',
      'Tratamento cirúrgico com margens amplas; resistente à quimioterapia e à radioterapia. Prognóstico depende do grau.',
    ],
    comparacaoComNormal: [
      'Na cartilagem hialina normal, condrócitos pequenos, esparsos, um ou dois por lacuna, em matriz homogênea, organizados em colunas na placa de crescimento.',
      'No condrossarcoma, as células são numerosas, grandes, irregulares e hipercromáticas, sem organização, e a cartilagem invade o osso.',
    ],
  },
]
