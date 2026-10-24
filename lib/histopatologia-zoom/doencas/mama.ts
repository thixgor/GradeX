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
  {
    id: 'fibroadenoma-da-mama',
    nome: 'Fibroadenoma da mama',
    sinonimos: ['fibroadenoma'],
    nomesEmIngles: ['fibroadenoma of the breast'],
    sistema: 'reprodutor-feminino',
    orgao: 'glandula-mamaria',
    prioridade: 22,
    resumo:
      'Tumor fibroepitelial benigno da mama, bem delimitado, em que estroma intralobular e ductos proliferam juntos — o tumor benigno mais comum da mulher jovem.',
    epidemiologia:
      'Pico entre 15 e 35 anos; pode ser múltiplo e bilateral. Cresce na gestação e na lactação e regride (hialiniza e calcifica) após a menopausa.',
    patogenese: [
      'O componente neoplásico é o estroma especializado do lóbulo, com mutações de MED12 em boa parte dos casos.',
      'Estrógeno e progesterona estimulam o estroma e, a reboque, os ductos do lóbulo, que crescem juntos num nódulo.',
      'O estroma envolve os ductos (padrão pericanalicular) ou os comprime em fendas curvas (padrão intracanalicular); com o tempo fica colágeno e hialino.',
    ],
    roteiro: [
      'Panorâmico: nódulo redondo e bem delimitado, que empurra a gordura e o tecido mamário em volta.',
      'Médio aumento: ductos uniformes, alongados ou comprimidos em fendas, distribuídos homogeneamente em estroma abundante.',
      'Grande aumento: ductos com duas camadas (luminal e mioepitelial); estroma de celularidade baixa, sem atipia nem mitoses.',
    ],
    achados: [
      {
        achado: 'proliferacao-fibroepitelial',
        tipo: 'especifico',
        comoAparece: 'Ductos e estroma crescendo juntos num nódulo bem delimitado, com padrão peri ou intracanalicular.',
        peso: 'criterio',
      },
      {
        achado: 'glandulas-com-dupla-camada',
        tipo: 'geral',
        comoAparece: 'Os ductos do nódulo mantêm células luminais e mioepiteliais — prova de benignidade do componente epitelial.',
        peso: 'frequente',
      },
      {
        achado: 'pseudocapsula-fibrosa',
        tipo: 'geral',
        comoAparece: 'Borda nítida, empurrando o tecido vizinho, sem infiltração.',
        peso: 'frequente',
      },
      {
        achado: 'degeneracao-hialina',
        tipo: 'geral',
        comoAparece: 'Estroma colágeno, hialino e pouco celular nos fibroadenomas antigos e na pós-menopausa, às vezes com calcificação.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Tumor filoide',
        comoSeparar: 'Estroma hipercelular, sobretudo junto aos ductos, frondes em folha que se projetam em espaços císticos, mitoses estromais e às vezes borda infiltrativa; mulheres mais velhas e tumores maiores.',
      },
      {
        nome: 'Carcinoma invasivo',
        comoSeparar: 'Glândulas angulosas de camada única, sem mioepitélio, infiltrando estroma desmoplásico e gordura; nódulo irregular e endurecido.',
      },
    ],
    correlacaoClinica: [
      'Nódulo móvel ("rato da mama"), elástico, indolor, de 1 a 3 cm; na ultrassonografia, oval, circunscrito, mais largo que alto.',
      'Diagnóstico confirmado por biópsia por agulha grossa quando há dúvida de imagem.',
      'Tratamento: acompanhamento; exérese se cresce rápido, se é grande (mais de 3 cm) ou por preferência da paciente. O risco de câncer é praticamente o da população geral.',
    ],
    comparacaoComNormal: [
      'Na mama normal, cada lóbulo tem poucos ácinos pequenos num estroma intralobular frouxo, separado do estroma interlobular denso e da gordura.',
      'No fibroadenoma, esse estroma intralobular se expande como um nódulo e carrega consigo ductos alongados e comprimidos.',
    ],
  },
]
