import type { DoencaZoom } from '../tipos'

/** Mama. */
export const DOENCAS_MAMA: DoencaZoom[] = [
  {
    id: 'carcinoma-ductal-invasivo-da-mama',
    nome: 'Carcinoma invasivo da mama (tipo não especial / ductal)',
    sinonimos: ['carcinoma ductal invasivo', 'carcinoma mamário invasivo', 'câncer de mama', 'CDI'],
    nomesEmIngles: ['invasive ductal carcinoma', 'invasive breast carcinoma of no special type'],
    sistema: 'reprodutor-feminino',
    orgao: 'glandula-mamaria',
    prioridade: 1,
    resumo:
      'Carcinoma do epitélio ductal-lobular da mama que infiltra o estroma em ninhos, cordões, glândulas e células isoladas, cercado por reação desmoplásica — o tipo mais comum de câncer de mama.',
    epidemiologia:
      'Câncer mais frequente em mulheres no Brasil (excluída a pele não melanoma) e principal causa de morte por câncer feminino. Risco aumenta com a idade, exposição estrogênica prolongada (menarca precoce, menopausa tardia, nuliparidade, terapia hormonal), obesidade pós-menopausa, álcool e mutações de BRCA1/BRCA2.',
    patogenese: [
      'Estímulo estrogênico e mutações acumuladas nas células da unidade ductolobular terminal geram proliferação atípica.',
      'Surge o carcinoma ductal in situ: células malignas preenchem ductos, contidas pelas células mioepiteliais e pela membrana basal.',
      'Com novas alterações (perda da camada mioepitelial, degradação da membrana basal), as células invadem o estroma.',
      'As células invasivas recrutam fibroblastos: a desmoplasia endurece o tumor (nódulo pétreo) e retrai a pele e o mamilo.',
      'Pelos linfáticos, o tumor chega aos linfonodos axilares (linfonodo sentinela); pelo sangue, a osso, pulmão, fígado e cérebro.',
      'O perfil molecular (receptores de estrogênio/progesterona, HER2, Ki-67) define subtipos com prognóstico e tratamento diferentes.',
    ],
    roteiro: [
      'Panorâmico: área irregular, estrelada e mais densa que o parênquima mamário ao redor (tecido adiposo e lóbulos normais na periferia).',
      'Médio aumento: ninhos, cordões e glândulas irregulares infiltrando um estroma fibroso — sem o contorno liso dos ductos.',
      'Procure ductos distendidos com células atípicas e necrose central: é o componente in situ.',
      'Grande aumento: núcleos grandes, pleomórficos, com nucléolos; conte mitoses — é a base do grau de Nottingham (formação tubular + pleomorfismo + mitoses).',
      'Na borda, verifique invasão linfovascular e a distância às margens.',
    ],
    achados: [
      {
        achado: 'invasao-estromal',
        tipo: 'especifico',
        comoAparece: 'Ninhos, cordões e células isoladas infiltrando o estroma, sem camada mioepitelial.',
        peso: 'criterio',
      },
      {
        achado: 'reacao-desmoplasica',
        tipo: 'especifico',
        comoAparece: 'Estroma fibroso, celular, envolvendo as células invasivas — responsável pela consistência endurecida.',
        peso: 'frequente',
      },
      {
        achado: 'carcinoma-in-situ-comedo',
        tipo: 'especifico',
        comoAparece: 'Ductos cheios de células atípicas com necrose central, junto ao componente invasivo.',
        peso: 'frequente',
      },
      {
        achado: 'atipia-citologica',
        tipo: 'geral',
        comoAparece: 'Núcleos aumentados, pleomórficos e com nucléolos; o grau de pleomorfismo entra na graduação.',
        peso: 'criterio',
      },
      {
        achado: 'glandulas-neoplasicas-complexas',
        tipo: 'geral',
        comoAparece: 'Formação de túbulos/glândulas pelo tumor — quanto mais túbulos, mais bem diferenciado.',
        peso: 'ocasional',
      },
      {
        achado: 'invasao-angiolinfatica',
        tipo: 'geral',
        comoAparece: 'Êmbolos tumorais em linfáticos peritumorais (fator prognóstico).',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Carcinoma lobular invasivo',
        comoSeparar: 'Células pequenas, discoesas, em fila indiana e em alvo ao redor dos ductos, sem formar ninhos coesos; perda de E-caderina.',
      },
      {
        nome: 'Adenose esclerosante',
        comoSeparar: 'Proliferação benigna lobulocêntrica de túbulos comprimidos, MANTENDO a camada mioepitelial; arquitetura lobular preservada no pequeno aumento.',
      },
      {
        nome: 'Cicatriz radial',
        comoSeparar: 'Centro fibroelastótico com túbulos aprisionados, mas com mioepitélio preservado.',
      },
      {
        nome: 'Fibroadenoma',
        comoSeparar: 'Nódulo bem delimitado, benigno, com proliferação de estroma e ductos comprimidos, sem atipia nem invasão.',
      },
    ],
    correlacaoClinica: [
      'Nódulo endurecido, indolor, de bordas irregulares e pouco móvel; retração de pele (casca de laranja) ou do mamilo nos casos avançados.',
      'Mamografia: nódulo espiculado e/ou microcalcificações (do componente in situ com necrose).',
      'Diagnóstico por biópsia com agulha grossa; o laudo traz tipo, grau, receptores hormonais, HER2 e Ki-67.',
      'Tratamento combina cirurgia, radioterapia, quimioterapia, hormonioterapia (se RE+) e terapia anti-HER2 (se HER2+).',
    ],
    comparacaoComNormal: [
      'Na mama normal, lóbulos de ácinos pequenos e ductos com duas camadas (luminal e mioepitelial) ficam imersos em estroma frouxo e tecido adiposo.',
      'No carcinoma invasivo, a arquitetura lobular se perde: células atípicas formam ninhos e cordões espalhados num estroma denso, sem a camada mioepitelial.',
    ],
  },
]
