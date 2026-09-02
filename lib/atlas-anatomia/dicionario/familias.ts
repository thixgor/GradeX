import type { EntradaDicionario } from './tipos'

/**
 * Fichas avulsas e fichas de família.
 *
 * Duas coisas vivem aqui. Primeiro, as estruturas que aparecem em uma prancha
 * só e não pertencem a nenhum bloco regional — o pênis desenhado na prancha da
 * uretra, o ligamento longitudinal anterior visto de dentro da pelve. Segundo,
 * as fichas de família, casadas por `contem` e não por título exato: elas só
 * respondem quando nenhuma ficha específica reivindicou aquele nome, e existem
 * para que um título novo no acervo nunca caia direto no texto de classe.
 */
export const FAMILIAS: EntradaDicionario[] = [
  {
    termos: ['Articulação Sacroilíaca'],
    classe: 'articulacao',
    resumo: 'Articulação entre o sacro e o ilíaco, desenhada para transmitir carga e quase não se mover.',
    localizacao: 'Entre as faces auriculares do sacro e do ilíaco, ao nível de S1 a S3, com superfícies irregulares e interdigitadas.',
    funcao:
      'É sinovial na porção anteroinferior e sindesmose na posterossuperior — uma articulação híbrida. Permite apenas alguns graus de nutação e contranutação, movimentos que aumentam ou reduzem os diâmetros da pelve.',
    vascularizacao: 'Artérias glútea superior, iliolombar e sacral lateral.',
    inervacao: 'Ramos posteriores de L5 a S3 e ramos do plexo sacral — uma inervação difusa que explica a dor mal localizada.',
    relacoes: 'A verdadeira estabilidade vem dos ligamentos sacroilíacos interósseos, posteriores e anteriores, e dos sacrotuberal e sacroespinal.',
    clinica:
      'A nutação — o sacro rodando para a frente — amplia a saída pélvica e é o que a posição de cócoras e a manobra de McRoberts exploram na distocia de ombro. Já a sacroileíte é o achado mais precoce das espondiloartrites, e sua dor difícil de localizar decorre da inervação por múltiplas raízes. A frouxidão pela relaxina explica a dor pélvica posterior da gestante.',
    memoria:
      'Uma articulação feita para não se mexer, mas que precisa se mexer alguns graus no parto. Esse conflito é a fonte de toda a dor sacroilíaca.',
    pontos: [
      'Por que a sacroilíaca é uma articulação híbrida?',
      'O que são nutação e contranutação?',
      'Por que a dor sacroilíaca é mal localizada?',
    ],
  },
  {
    termos: ['Ligamento Longitudinal Anterior'],
    classe: 'ligamento',
    resumo: 'Faixa fibrosa larga que desce pela face anterior dos corpos vertebrais, do occipital ao sacro.',
    localizacao: 'Face anterior dos corpos vertebrais e dos discos, do tubérculo anterior do atlas à face pélvica do sacro; é mais largo e mais forte que o posterior.',
    funcao:
      'Limita a extensão da coluna e reforça a parte anterior do disco. Adere firmemente aos corpos vertebrais e frouxamente aos discos — o oposto do ligamento longitudinal posterior.',
    vascularizacao: 'Ramos segmentares das artérias vertebrais, intercostais e lombares.',
    relacoes: 'Na pelve, funde-se ao periósteo do sacro e contribui para a estabilidade da sacroilíaca anterior.',
    clinica:
      'A limitação da extensão é o que faz sua rotura ocorrer em hiperextensão cervical brusca — o mecanismo em chicote, com dor à extensão e alargamento do espaço discal anterior na radiografia. Sua ossificação progressiva produz a hiperostose esquelética idiopática difusa (DISH), com a característica "cera escorrida" na face anterior da coluna, que enrijece o segmento e aumenta o risco de fraturas instáveis por trauma mínimo.',
    memoria:
      'O ligamento da frente segura a extensão; o de trás segura a flexão. Chicote para trás rompe o da frente.',
    pontos: [
      'Que movimento o ligamento longitudinal anterior limita?',
      'Como sua aderência aos discos difere do ligamento posterior?',
      'O que é a hiperostose esquelética idiopática difusa?',
    ],
  },
  {
    termos: ['Ligamento Púbico Superior'],
    classe: 'ligamento',
    resumo: 'Faixa fibrosa espessa que cruza a borda superior da sínfise púbica, entre os dois tubérculos púbicos.',
    localizacao: 'Sobre a face superior da sínfise, unindo os tubérculos púbicos e as cristas dos dois lados.',
    funcao:
      'Com o ligamento púbico inferior (arqueado), abaixo, forma o principal reforço da sínfise, resistindo às forças de cisalhamento vertical entre os dois ossos do quadril durante a marcha.',
    relacoes: 'O disco interpúbico e os dois ligamentos formam o complexo estabilizador anterior da pelve.',
    clinica:
      'A ruptura desses ligamentos é o que produz a disjunção púbica, com diástase maior que 2,5 cm, dor intensa e incapacidade de deambular — que pode ocorrer no parto e no trauma pélvico. Nas fraturas em livro aberto, a estabilização anterior visa restaurar exatamente essa contenção. E a osteíte púbica, inflamação da sínfise em atletas, produz dor localizada nesses ligamentos, agravada pela adução resistida.',
    memoria:
      'A sínfise é segurada por dois ligamentos, um em cima e um embaixo. Rompeu os dois, a bacia "abre como um livro".',
    pontos: [
      'Que ligamentos reforçam a sínfise púbica?',
      'A que força eles resistem?',
      'A partir de que diástase se considera disjunção púbica?',
    ],
  },
  {
    termos: ['Membrana Interóssea da Perna'],
    classe: 'ligamento',
    resumo: 'Lâmina fibrosa entre a tíbia e a fíbula, que une os dois ossos e divide os compartimentos da perna.',
    localizacao: 'Entre as margens interósseas da tíbia e da fíbula, em toda a extensão da diáfise, contínua abaixo com o ligamento interósseo da sindesmose.',
    funcao:
      'Suas fibras descem da tíbia para a fíbula, transferindo parte da carga axial ao osso lateral. Serve de origem a músculos dos compartimentos anterior e posterior profundo e separa os dois.',
    relacoes: 'A artéria tibial anterior a atravessa por uma abertura no seu terço proximal; a artéria fibular corre em contato com sua face posterior.',
    clinica:
      'Ser um limite rígido é o que torna possível a síndrome compartimental da perna: os quatro compartimentos são delimitados por osso, membrana e septos fasciais inelásticos, e a fasciotomia precisa abrir todos os quatro. Sua ruptura extensa, associada a fratura da fíbula proximal e lesão sindesmótica, produz instabilidade longitudinal — o equivalente na perna da lesão de Essex-Lopresti do antebraço.',
    memoria:
      'No antebraço as fibras descem do rádio; na perna, descem da tíbia. Sempre do osso que carrega peso para o que ajuda.',
    pontos: [
      'Qual a direção das fibras da membrana interóssea da perna?',
      'Que estrutura vascular a atravessa?',
      'Por que ela participa da síndrome compartimental?',
    ],
  },
  {
    termos: ['Pênis'],
    classe: 'viscera',
    sistemas: ['urinario'],
    resumo: 'Órgão masculino da cópula e da micção, com uma porção fixa no períneo e uma porção pêndula.',
    localizacao: 'Raiz no períneo, fixada aos ramos isquiopúbicos e à membrana perineal; corpo pêndulo, suspenso pelos ligamentos suspensor e fundiforme.',
    funcao:
      'Três cilindros de tecido erétil: dois corpos cavernosos dorsais, responsáveis pela rigidez, e um corpo esponjoso ventral, que contém a uretra e termina na glande.',
    vascularizacao: 'Artérias profunda, dorsal e bulbouretral, ramos da pudenda interna; drenagem pela veia dorsal profunda para o plexo prostático.',
    inervacao: 'Nervo dorsal do pênis (pudendo, S2–S4) para a sensibilidade; nervos cavernosos (parassimpático S2–S4) para a ereção; simpático (L1–L2) para a ejaculação.',
    clinica:
      'A divisão da inervação autonômica resume a fisiologia sexual masculina em uma frase que se decora e não se esquece: parassimpático produz a ereção, simpático produz a ejaculação — "Point and Shoot", P de parassimpático para apontar e S de simpático para disparar. É por isso que a lesão dos nervos cavernosos na prostatectomia abole a ereção sem abolir o orgasmo, e que os alfabloqueadores, simpaticolíticos, causam ejaculação retrógrada sem afetar a rigidez.',
    memoria:
      '"Point and Shoot": Parassimpático aponta (ereção), Simpático dispara (ejaculação). S2, S3, S4 mantêm o pênis no chão.',
    pontos: [
      'Que estruturas eréteis compõem o pênis?',
      'Que sistema autonômico medeia a ereção e qual medeia a ejaculação?',
      'Por que a prostatectomia pode abolir a ereção sem abolir o orgasmo?',
    ],
  },

  /* ───────────────── Fichas de família (casamento por conteúdo) ───────────────── */
  {
    termos: [],
    contem: ['costela'],
    classe: 'osso',
    resumo: 'Arco ósseo achatado da parede torácica, que articula atrás com a coluna e se prolonga à frente numa cartilagem.',
    localizacao:
      'Doze pares. Cada costela típica tem cabeça, colo, tubérculo, ângulo e corpo, com o sulco costal na borda inferior. As costelas 1 a 7 são verdadeiras, 8 a 10 falsas e 11 e 12 flutuantes.',
    funcao: 'Formam a caixa que protege coração e pulmões e cujo movimento produz a ventilação, girando em torno do eixo entre as articulações costovertebral e costotransversária.',
    vascularizacao: 'Artérias intercostais posteriores, da aorta, e anteriores, da torácica interna.',
    inervacao: 'Nervo intercostal correspondente, no sulco costal.',
    relacoes: 'No sulco costal, de cima para baixo: veia, artéria e nervo.',
    clinica:
      'A fratura de costela é a lesão torácica mais comum e sua importância está menos no osso e mais no que ela sinaliza: fratura das três primeiras indica trauma de alta energia, com risco de lesão de grandes vasos; das três últimas, lesão de fígado, baço ou rim. E a dor impede a inspiração profunda, levando a atelectasia e pneumonia — motivo pelo qual a analgesia é o tratamento principal.',
    memoria:
      'Costela quebrada não se imobiliza: se analgesia. Quem não respira fundo por dor acaba com pneumonia.',
    pontos: [
      'Que costelas são verdadeiras, falsas e flutuantes?',
      'Qual a ordem das estruturas no sulco costal?',
      'O que sugere fratura das primeiras e das últimas costelas?',
    ],
  },
  {
    termos: [],
    contem: ['vertebra'],
    classe: 'osso',
    resumo: 'Peça óssea da coluna, com um corpo que sustenta carga e um arco que protege a medula.',
    localizacao: 'Empilhadas da base do crânio ao cóccix, em 33 peças: 7 cervicais, 12 torácicas, 5 lombares, 5 sacrais e 4 coccígeas.',
    funcao:
      'O corpo sustenta o peso; o arco, formado por pedículos e lâminas, fecha o forame vertebral; os processos servem de alavanca para músculos e ligamentos e de superfície articular.',
    vascularizacao: 'Artérias segmentares e plexo venoso vertebral sem válvulas.',
    relacoes: 'Os forames vertebrais empilhados formam o canal vertebral; as incisuras formam os forames intervertebrais.',
    clinica:
      'A coluna é a região do esqueleto que mais recebe metástases, pela drenagem para o plexo venoso vertebral sem válvulas. E a distinção entre coluna anterior, média e posterior — o modelo de Denis — define a estabilidade da fratura: lesão de duas ou mais colunas é instável e muda a conduta de conservadora para cirúrgica.',
    memoria:
      'Corpo carrega, arco protege, processos alavancam. Três partes, três funções — e vale para qualquer vértebra.',
    pontos: [
      'Quantas vértebras existem em cada região?',
      'Que partes compõem uma vértebra típica?',
      'O que é o modelo das três colunas de Denis?',
    ],
  },
  {
    termos: [],
    contem: ['metacarp'],
    classe: 'osso',
    resumo: 'Osso longo da palma da mão, com base, corpo e cabeça, entre o carpo e as falanges.',
    localizacao: 'Cinco por mão; o 2º e o 3º são fixos, o 4º e o 5º móveis, e o 1º é livre em todas as direções.',
    funcao: 'Sustentam os arcos da mão e transmitem a força da preensão do dedo ao carpo.',
    relacoes: 'O ligamento metacarpal transverso profundo une as cabeças do 2º ao 5º; os interósseos ocupam os espaços entre os corpos.',
    clinica:
      'A gradação de mobilidade é o que permite a mão se moldar ao objeto — e o que define a tolerância a desvios nas fraturas: o 5º metacarpo aceita até 40° de angulação, o 2º quase nada. Qualquer desvio rotacional, porém, é inaceitável em todos, e se avalia pedindo ao paciente que feche a mão: os dedos não podem se cruzar.',
    memoria:
      'Angulação alguns perdoam; rotação nenhum perdoa. Feche a mão do paciente antes de decidir a conduta.',
    pontos: [
      'Que metacarpos são fixos e quais são móveis?',
      'Que desvio nunca é tolerado nas fraturas?',
      'Como se avalia a deformidade rotacional?',
    ],
  },
  {
    termos: [],
    contem: ['falange'],
    classe: 'osso',
    resumo: 'Osso longo dos dedos, em número de três por dedo, exceto no polegar e no hálux, que têm duas.',
    localizacao: 'Proximal, média e distal em cada dedo longo; proximal e distal no polegar e no hálux.',
    funcao: 'Formam o esqueleto móvel dos dedos, movidas por tendões extrínsecos longos e por músculos intrínsecos.',
    relacoes: 'A falange distal alarga-se na tuberosidade, que sustenta a polpa e a unha.',
    clinica:
      'A regra da imobilização é sempre a mesma e vale a pena guardar: metacarpofalângicas em flexão e interfalângicas em extensão — a posição intrínseca plus, que mantém os ligamentos colaterais tensos e evita a rigidez. E fraturas de falange distal com hematoma subungueal maior que 50% da unha exigem avaliação do leito ungueal, porque a laceração não reparada deixa deformidade permanente.',
    memoria:
      'Imobilize a mão com os nós dobrados e os dedos esticados. Ao contrário disso, ela endurece aberta e não fecha mais.',
    pontos: [
      'Quantas falanges tem cada dedo?',
      'Qual a posição correta de imobilização da mão?',
      'Quando avaliar o leito ungueal numa fratura de falange?',
    ],
  },
  {
    termos: [],
    contem: ['sutura'],
    classe: 'sutura',
    resumo: 'Articulação fibrosa imóvel entre os ossos do crânio, com bordas serrilhadas e interdigitadas.',
    localizacao: 'Entre os ossos da calvária e da face; as principais são a coronal, a sagital, a lambdóidea e a escamosa.',
    funcao:
      'Permitem o crescimento do crânio por deposição óssea nas bordas, perpendicular à direção da sutura, acompanhando a expansão do encéfalo. Fecham-se progressivamente a partir da terceira década.',
    relacoes: 'Os pontos de encontro das suturas são o bregma, o lambda, o ptério e o astério.',
    clinica:
      'A regra de Virchow prevê a deformidade de cada craniossinostose: o crânio deixa de crescer perpendicularmente à sutura fundida e cresce em excesso paralelamente a ela — sagital fundida dá escafocefalia, coronal bilateral dá braquicefalia, metópica dá trigonocefalia. Uma única regra explica todos os formatos.',
    memoria:
      'Sutura fundida: o crânio para de crescer para os lados dela e cresce ao longo dela. É a regra de Virchow.',
    pontos: [
      'Como as suturas permitem o crescimento do crânio?',
      'Quais são os principais pontos de encontro suturais?',
      'O que prevê a regra de Virchow?',
    ],
  },
]
