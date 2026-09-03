import type { EntradaDicionario } from './tipos'

/**
 * Rins, ureteres, bexiga e uretra.
 *
 * O aparelho urinário é um sistema de tubos com três estreitamentos, dois
 * esfíncteres e um órgão que filtra 180 litros por dia para devolver um e meio.
 * Onde há estreitamento, o cálculo para; onde há esfíncter, a continência se
 * perde; onde há filtração, a pressão importa. Esses três eixos organizam tudo
 * o que vem a seguir.
 */
export const URINARIO: EntradaDicionario[] = [
  /* ─────────────────── Rim: envoltórios e forma ─────────────────── */
  {
    termos: ['Rim Direito'],
    classe: 'viscera',
    resumo: 'Rim do lado direito, mais baixo que o esquerdo por causa do fígado.',
    localizacao: 'Retroperitoneal, de T12 a L3, cerca de meia vértebra abaixo do esquerdo; sua face anterior contata fígado, duodeno e flexura cólica direita.',
    funcao: 'Filtra o plasma, regula volume e eletrólitos, produz eritropoetina e renina e ativa a vitamina D.',
    inervacao:
      'Plexo renal, alimentado pelo gânglio aorticorrenal e pelos nervos esplâncnicos menor e imo, com fibras simpáticas de T10 a L1 que acompanham a artéria renal. As aferentes de dor sobem por esses mesmos segmentos: daí a dor renal ser em flanco e irradiar para a virilha e o testículo — a clássica dor \'de lombo à virilha\'.',
    vascularizacao: 'Artéria renal direita, mais longa por passar atrás da veia cava inferior; veia renal direita, curta, desemboca diretamente na cava.',
    relacoes: 'A 12ª costela cruza sua face posterior; o recesso costodiafragmático desce até ali.',
    clinica:
      'A veia renal direita curta é a razão de o rim direito ser o preferido para nefrectomia aberta e o esquerdo o preferido para doação — no transplante, quanto mais longa a veia, mais fácil a anastomose. E o recesso pleural sobre o rim explica o pneumotórax como complicação da nefrostomia percutânea e da biópsia renal: uma punção lombar alta atravessa pleura antes de chegar ao rim.',
    memoria:
      'Doa-se o rim esquerdo porque a veia é longa. Retira-se o direito com mais facilidade porque ele é mais baixo.',
    pontos: [
      'Por que o rim direito é mais baixo?',
      'Por que se prefere o rim esquerdo na doação?',
      'Que estrutura torácica pode ser lesada na punção renal?',
    ],
  },
  {
    termos: ['Polo Superior'],
    classe: 'viscera',
    sistemas: ['urinario'],
    resumo: 'Extremidade superior do rim, arredondada, mais medial que a inferior e encimada pela glândula suprarrenal.',
    localizacao:
      'À altura de T12 no rim esquerdo e de L1 no direito — o direito é mais baixo, porque o fígado o empurra. Está mais próximo da linha média que o polo inferior, porque o rim se apoia obliquamente sobre o psoas.',
    funcao:
      'É a porção mais protegida do rim: fica atrás da 11ª e da 12ª costelas e sob a cúpula diafragmática. Essa proteção tem preço — o acesso percutâneo por cima da 12ª costela atravessa a pleura.',
    vascularizacao:
      'Artéria do segmento superior, primeiro ramo da divisão anterior da artéria renal, e ramos da artéria do segmento posterior. São artérias terminais, sem anastomose entre segmentos — ocluir uma delas infarta o polo inteiro, e é isso que produz a cunha hipodensa típica na tomografia.',
    inervacao:
      'Plexo renal, de fibras simpáticas de T10 a L1 que chegam pelo hilo com a artéria. A cápsula que o reveste tem aferentes de estiramento, e é a distensão dela — não o parênquima — que dói na pielonefrite e na obstrução aguda.',
    relacoes:
      'A glândula suprarrenal o cobre como um chapéu, separada dele por um septo de fáscia renal — separação que permite retirar uma sem tocar na outra. À direita, o fígado e a área nua do diafragma; à esquerda, o baço e a cauda do pâncreas.',
    clinica:
      'O acesso percutâneo ao polo superior é o que melhor alcança a pelve renal e o ureter, e por isso é o preferido em cálculos coraliformes — mas a punção acima da 12ª costela atravessa o recesso costodiafragmático e produz hidrotórax ou pneumotórax em até 15% dos casos. É a punção que dá o melhor ângulo e o maior risco, e a decisão entre subcostal e supracostal se resume a essa troca.',
    memoria:
      'Polo superior: mais medial, mais alto, com a suprarrenal em cima e a pleura logo atrás. Punção acima da 12ª costela entra no tórax.',
    pontos: [
      'Em que nível vertebral está o polo superior de cada rim?',
      'Que estrutura o encima e o que as separa?',
      'Que complicação a punção supracostal produz?',
    ],
  },
  {
    termos: ['Polo Inferior'],
    classe: 'viscera',
    sistemas: ['urinario'],
    resumo: 'Extremidade inferior do rim, mais lateral e mais baixa — a única parte do rim que a mão alcança.',
    localizacao:
      'À altura de L3, cerca de 3 a 4 cm acima da crista ilíaca. É mais lateral que o polo superior, porque o eixo do rim é oblíquo sobre o músculo psoas.',
    funcao:
      'É a porção mais móvel e menos protegida do rim: fica abaixo do gradil costal, coberta apenas por músculo e gordura. Essa exposição é o que a torna palpável e, ao mesmo tempo, vulnerável.',
    vascularizacao:
      'Artéria do segmento inferior, ramo da divisão anterior da artéria renal — e o vaso de maior importância prática do rim, porque em cerca de um quarto das pessoas existe uma artéria polar inferior acessória que cruza a junção ureteropélvica por diante e a comprime. É uma das causas de hidronefrose congênita, e a razão de a pieloplastia exigir transpor a pelve à frente do vaso.',
    inervacao:
      'Plexo renal (T10–L1). A obstrução da junção ureteropélvica, logo abaixo dele, provoca dor em flanco que aparece justamente depois de o paciente beber muito líquido — o sinal de Dietl, quase específico dessa causa.',
    relacoes:
      'É o polo alcançado pela manobra de Guyon, a palpação bimanual do rim, e o alvo eleito da biópsia renal percutânea, porque nele o córtex é espesso e não há vasos hilares.',
    clinica:
      'Duas coisas úteis nascem daqui. A palpação bimanual só encontra o polo inferior, e por isso um rim "palpável" significa rim aumentado ou baixo, nunca rim normal em adulto magro — exceto o direito, que pode ser tocado por ser mais baixo. E o rim em ferradura é definido justamente pela fusão dos polos inferiores: o istmo fundido fica preso sob a artéria mesentérica inferior, o que impede a ascensão embrionária, deixa o rim baixo e exposto ao trauma e cria a estase que favorece cálculos e infecção.',
    memoria:
      'Polo inferior: o único que a mão alcança e o único que se funde no rim em ferradura. Preso embaixo da mesentérica inferior, o rim não sobe.',
    pontos: [
      'Por que só o polo inferior é palpável?',
      'Que variante arterial dele causa hidronefrose?',
      'Por que o rim em ferradura não ascende?',
    ],
  },
  {
    termos: ['Cápsula Fibrosa'],
    classe: 'viscera',
    resumo: 'Membrana fibrosa fina e inelástica que reveste diretamente o parênquima renal.',
    localizacao: 'Aderida à superfície do rim, sob a gordura perirrenal; desprende-se facilmente no rim normal.',
    funcao: 'Contém o parênquima e limita sua expansão; é ricamente inervada e sensível à distensão.',
    vascularizacao:
      'Rede capsular alimentada por ramos das artérias renais, frênica inferior e gonadal — anastomosada e superficial, ao contrário do parênquima, que é de artérias terminais.',
    inervacao:
      'Ricamente inervada por aferentes de estiramento do plexo renal. Aqui está a explicação de um contraste clínico importante: o parênquima renal não dói, mas a cápsula dói muito quando distendida. Um tumor que cresce devagar não dói; uma pielonefrite ou um hematoma subcapsular, que distendem rápido, doem intensamente.',
    relacoes: 'Continua-se, no hilo, com o revestimento do seio renal.',
    clinica:
      'Ser inelástica é o que faz o edema renal doer: na pielonefrite e na trombose de veia renal, a distensão da cápsula produz dor lombar intensa, enquanto doenças que não a distendem — glomerulopatias crônicas — são indolores. É também por isso que a punção-biópsia dói e que o hematoma subcapsular pode comprimir o parênquima e causar hipertensão (rim de Page).',
    memoria:
      'Rim que incha rápido dói; rim que perde função devagar não dói. A dor é da cápsula, não do rim.',
    pontos: [
      'Por que a cápsula fibrosa é fonte de dor?',
      'Que doenças renais são indolores e por quê?',
      'O que é o rim de Page?',
    ],
  },
  {
    termos: ['Gordura Perirrenal (Cápsula Adiposa)', 'Gordura Renal'],
    classe: 'viscera',
    resumo: 'Camada de gordura entre a cápsula fibrosa e a fáscia renal, que envolve o rim e a suprarrenal.',
    localizacao: 'Dentro da fáscia renal, envolvendo rim e suprarrenal; continua-se com a gordura do seio renal pelo hilo.',
    funcao: 'Amortece o rim contra impactos e o mantém em posição, junto com a fáscia renal, os vasos e a pressão intra-abdominal.',
    vascularizacao:
      'Ramos capsulares finos das artérias renal, frênica inferior, gonadal e lombares, formando uma rede que envolve o rim. Essa rede é a colateral que mantém o rim viável em algumas oclusões parciais da artéria renal.',
    inervacao:
      'Fibras do plexo renal e ramos dos nervos subcostal, ílio-hipogástrico e ilioinguinal na periferia. É essa mistura de aferentes que faz a dor da pielonefrite ser lombar e ao mesmo tempo referida à parede abdominal e à virilha.',
    relacoes: 'É separada da gordura pararrenal, mais externa, pela fáscia renal.',
    clinica:
      'Sua perda em pacientes com emagrecimento acentuado é uma das causas da ptose renal, com dor em posição ortostática que alivia deitado. Na tomografia, o borramento dessa gordura — o "encalhe da gordura perirrenal" — é o sinal mais precoce e mais sensível de pielonefrite e de obstrução ureteral aguda, muitas vezes o único achado.',
    memoria:
      'Gordura limpa em volta do rim é normal; gordura "suja" na tomografia é inflamação ali dentro.',
    pontos: [
      'Que estruturas a gordura perirrenal envolve?',
      'O que a separa da gordura pararrenal?',
      'Que sinal tomográfico ela produz na pielonefrite?',
    ],
  },
  {
    termos: ['Fáscia Renal'],
    classe: 'fascia',
    resumo: 'Fáscia de Gerota: envoltório fibroso que delimita o compartimento perirrenal.',
    localizacao: 'Envolve rim, suprarrenal e gordura perirrenal, com folhetos anterior (de Gerota) e posterior (de Zuckerkandl) que se fundem lateralmente e permanecem abertos inferiormente.',
    funcao: 'Delimita o compartimento perirrenal e o separa dos espaços pararrenais anterior e posterior.',
    relacoes: 'A abertura inferior comunica o compartimento com a pelve.',
    clinica:
      'Essa geometria explica o comportamento das coleções: um abscesso perirrenal fica contido e desce para a fossa ilíaca, enquanto a pancreatite, no espaço pararrenal anterior, dissecа separadamente. Na cirurgia oncológica, a nefrectomia radical remove o rim dentro da fáscia de Gerota intacta — princípio que reduz a recidiva local, porque a fáscia é a barreira natural à disseminação.',
    memoria:
      'Gerota é um saco aberto embaixo. Pus lá dentro não atravessa a parede: ele escorre para a pelve.',
    pontos: [
      'Que estruturas a fáscia renal envolve?',
      'Como ela orienta a disseminação de coleções?',
      'Por que a nefrectomia radical a preserva íntegra?',
    ],
  },
  /* ─────────────────── Rim: parênquima ─────────────────── */
  {
    termos: ['Córtex Renal'],
    classe: 'viscera',
    resumo: 'Camada externa do parênquima renal, onde estão os glomérulos e os túbulos contorcidos.',
    localizacao: 'Sob a cápsula, com cerca de 1 cm de espessura, projetando-se entre as pirâmides como colunas renais.',
    funcao:
      'Contém todos os glomérulos e os túbulos contorcidos proximal e distal — é onde ocorre a filtração e a maior parte da reabsorção. Recebe cerca de 90% do fluxo sanguíneo renal.',
    vascularizacao: 'Artérias interlobares, arqueadas e interlobulares, com as arteríolas aferentes e eferentes.',
    clinica:
      'A distribuição desigual do fluxo é a chave da isquemia renal: apesar de o córtex receber quase todo o sangue, é a medula que trabalha em hipóxia relativa, e por isso a necrose tubular aguda atinge preferencialmente o túbulo proximal e a alça de Henle medular. Já a necrose cortical difusa, mais rara, ocorre em choque grave e descolamento prematuro de placenta, com anúria irreversível.',
    memoria:
      'O córtex recebe quase todo o sangue e a medula quase nenhum. Por isso a medula é a que sofre primeiro na hipotensão.',
    pontos: [
      'Que estruturas do néfron ficam no córtex?',
      'Que proporção do fluxo renal ele recebe?',
      'Por que a necrose tubular atinge preferencialmente a medula?',
    ],
  },
  {
    termos: ['Medula Renal'],
    classe: 'viscera',
    resumo: 'Porção interna do parênquima, organizada em pirâmides cujos ápices são as papilas renais.',
    localizacao: 'Entre o córtex e o seio renal; cada rim tem de 8 a 18 pirâmides, com base voltada para o córtex e ápice para o cálice.',
    funcao:
      'Contém as alças de Henle e os ductos coletores, responsáveis pela concentração da urina. O gradiente osmótico corticomedular, criado pelo mecanismo multiplicador em contracorrente, é o que permite produzir urina mais concentrada que o plasma.',
    inervacao:
      'Plexo renal (T10–L1), com fibras escassas. O que comanda a medula não é nervo, e sim gradiente: o mecanismo contracorrente das alças de Henle e dos vasos retos cria a hipertonicidade que concentra a urina, e o hormônio antidiurético é quem regula a permeabilidade dos ductos coletores que a atravessam.',
    vascularizacao: 'Vasos retos, que descem em paralelo às alças e preservam o gradiente por troca em contracorrente.',
    clinica:
      'Esse arranjo, que garante a concentração, cobra o preço da hipóxia: a medula opera com tensão de oxigênio baixíssima e é a primeira a sofrer na desidratação e no uso de anti-inflamatórios, que bloqueiam as prostaglandinas vasodilatadoras. É essa a base da necrose de papila, associada a diabetes, anemia falciforme, pielonefrite e abuso de analgésicos.',
    memoria:
      'A medula concentra a urina vivendo com pouco oxigênio. É um órgão que trabalha no limite — e por isso é o primeiro a morrer.',
    pontos: [
      'Que estruturas do néfron ficam na medula?',
      'Como se cria o gradiente osmótico medular?',
      'Que condições causam necrose de papila?',
    ],
  },
  {
    termos: ['Coluna Renal'],
    classe: 'viscera',
    resumo: 'Prolongamento do córtex entre duas pirâmides adjacentes — as colunas de Bertin.',
    localizacao: 'Entre pirâmides vizinhas, alcançando o seio renal; conduzem os vasos interlobares.',
    funcao: 'Levam os vasos interlobares do seio renal ao córtex e delimitam os lobos renais, cada um formado por uma pirâmide e o córtex que a recobre.',
    vascularizacao:
      'É o corredor por onde sobem as artérias interlobares, da divisão segmentar até a base das pirâmides, onde se curvam como artérias arqueadas. Toda a irrigação do córtex passa por aqui.',
    inervacao:
      'Fibras do plexo renal acompanham as interlobares. Vale a nota radiológica: uma coluna renal proeminente é variante normal (pseudotumor) e se reconhece justamente por conter vasos e captar contraste igual ao córtex.',
    relacoes: 'Cada lobo renal corresponde a um lobo embrionário; a lobulação fetal pode persistir no adulto.',
    clinica:
      'Uma coluna de Bertin hipertrofiada é a pseudotumoral mais comum do rim: aparece como massa na ultrassonografia e é confundida com neoplasia. O que a distingue é ter a mesma ecogenicidade e o mesmo padrão de realce do córtex normal em todas as fases da tomografia — um pseudotumor que se resolve sabendo anatomia, sem biópsia.',
    memoria:
      'Coluna de Bertin é córtex entrando entre as pirâmides. Se "realça igual ao córtex", não é tumor: é córtex mesmo.',
    pontos: [
      'O que são as colunas renais?',
      'Que estruturas elas conduzem?',
      'Como diferenciar uma coluna hipertrofiada de um tumor?',
    ],
  },
  {
    termos: ['Papila Renal'],
    classe: 'viscera',
    resumo: 'Ápice de cada pirâmide renal, perfurado pelos ductos coletores, que se projeta no cálice menor.',
    localizacao: 'Extremidade interna de cada pirâmide, encaixada num cálice menor.',
    funcao: 'A área crivosa, no seu ápice, é onde os ductos papilares desembocam e a urina entra na via excretora.',
    vascularizacao:
      'Vasos retos (vasa recta), ramos das arteríolas eferentes dos glomérulos justamedulares, que descem em alças até a ponta da papila. É a região de menor tensão de oxigênio do rim inteiro — o preço de manter o gradiente osmótico da medula.',
    inervacao:
      'Plexo renal, com fibras escassas. A hipóxia fisiológica desta região é o que a torna vulnerável: analgésicos, anemia falciforme e diabetes produzem necrose de papila, que se desprende e obstrui o ureter como se fosse um cálculo.',
    relacoes: 'As papilas simples são convexas; as compostas, nos polos, são planas ou côncavas.',
    clinica:
      'As papilas compostas dos polos permitem refluxo intrarrenal quando há refluxo vesicoureteral, e é por isso que a cicatriz da nefropatia de refluxo se forma preferencialmente nos polos — anatomia microscópica explicando a topografia de uma doença. A necrose de papila, por sua vez, produz hematúria com eliminação de fragmentos e o "sinal do anel" na urografia.',
    memoria:
      'Papila de polo é chata e deixa a urina refluir para dentro do rim. É por isso que a cicatriz do refluxo é polar.',
    pontos: [
      'O que é a área crivosa?',
      'Qual a diferença entre papilas simples e compostas?',
      'Por que a nefropatia de refluxo cicatriza os polos?',
    ],
  },
  {
    termos: ['Seio Renal'],
    classe: 'viscera',
    resumo: 'Cavidade no interior do rim, aberta no hilo, que aloja os cálices, a pelve, os vasos e gordura.',
    localizacao: 'Interior do rim, comunicando-se com o exterior pelo hilo renal.',
    funcao: 'Aloja o sistema coletor e os ramos vasculares segmentares, envoltos por gordura sinusal.',
    vascularizacao:
      'Contém todo o pedículo intra-renal — ramos segmentares da artéria, tributárias da veia renal e o sistema coletor — mergulhados em gordura. A veia está sempre à frente da artéria também aqui.',
    inervacao:
      'Plexo renal periarterial. A gordura do seio funciona como amortecedor, e sua substituição por fibrose ou por lipomatose empurra o sistema coletor e simula massa na urografia.',
    relacoes: 'A gordura do seio é contínua com a perirrenal pelo hilo.',
    clinica:
      'É onde crescem os cistos parapélvicos, que podem simular hidronefrose na ultrassonografia — a diferença é que os cistos não se comunicam entre si e não convergem para o ureter. A lipomatose do seio renal, comum em obesos e idosos, alonga e afila a pelve e também simula patologia. Reconhecer a gordura do seio é o que evita esses dois falsos positivos.',
    memoria:
      'Hidronefrose comunica e converge para o ureter; cisto parapélvico não. É a comunicação que decide.',
    pontos: [
      'Que estruturas o seio renal aloja?',
      'O que são cistos parapélvicos?',
      'Como diferenciá-los de hidronefrose?',
    ],
  },
  {
    termos: ['Cálice Renal Menor'],
    classe: 'viscera',
    resumo: 'Pequeno funil que se encaixa em uma ou duas papilas renais e recolhe a urina.',
    localizacao: 'Dentro do seio renal, em número de 7 a 14 por rim.',
    funcao: 'Recolhe a urina que sai das papilas e a conduz aos cálices maiores; o fórnice, sua borda superior, é a região mais delgada da via excretora.',
    vascularizacao:
      'Ramos terminais das artérias interlobares, que sobem pelas colunas renais de cada lado da pirâmide que o cálice abraça.',
    inervacao:
      'Plexo renal, com terminações de estiramento no fórnice — a parte mais delgada da parede calicial. Numa obstrução aguda, é o fórnice que rompe primeiro, extravasando urina para o espaço perirrenal: o achado tomográfico de \'rotura de fórnice\', que na verdade é um mecanismo de alívio de pressão.',
    relacoes: 'Vários cálices menores confluem em um cálice maior.',
    clinica:
      'O fórnice é o ponto de menor resistência de toda a via urinária: na obstrução ureteral aguda por cálculo, ele se rompe e produz extravasamento urinário perinéfrico — um mecanismo de alívio de pressão que aparece na tomografia como líquido perirrenal e que, longe de indicar gravidade, explica por que a dor às vezes cede subitamente. Cálices dilatados e romboides são o achado precoce da hidronefrose.',
    memoria:
      'O fórnice do cálice é o "fusível" da via urinária: ele rompe para aliviar a pressão e salvar o rim.',
    pontos: [
      'Quantos cálices menores existem por rim?',
      'O que é o fórnice calicial?',
      'Por que ele se rompe na obstrução aguda?',
    ],
  },
  {
    termos: ['Cálice Renal Maior'],
    classe: 'viscera',
    resumo: 'Confluência de vários cálices menores, geralmente em número de dois ou três por rim.',
    localizacao: 'Seio renal, entre os cálices menores e a pelve renal: superior, médio e inferior.',
    funcao: 'Conduzem a urina dos cálices menores à pelve renal.',
    vascularizacao:
      'Ramos das artérias interlobares que correm nas colunas renais, ao lado de cada cálice. Essa vizinhança tem consequência: na nefrolitotomia percutânea, a punção deve entrar pela papila, no eixo do cálice, e nunca pelo infundíbulo — puncionar o infundíbulo é puncionar a artéria interlobar.',
    inervacao:
      'Plexo renal (T10–L1), com aferentes de estiramento. Dois ou três cálices maiores reúnem os menores e formam a pelve.',
    relacoes: 'O cálice inferior costuma formar um ângulo agudo com a pelve.',
    clinica:
      'Esse ângulo agudo do cálice inferior é o que dificulta a eliminação de fragmentos após litotripsia extracorpórea: quanto mais agudo o ângulo infundíbulo-pélvico e mais longo o infundíbulo, menor a taxa de eliminação — parâmetros medidos antes de escolher entre litotripsia e nefrolitotripsia percutânea. É anatomia definindo a escolha terapêutica em urologia.',
    memoria:
      'Cálculo no cálice inferior é o mais difícil de sair: ele tem que subir uma ladeira contra a gravidade.',
    pontos: [
      'Quantos cálices maiores existem tipicamente?',
      'Por que o cálice inferior é problemático?',
      'Que medidas anatômicas orientam o tratamento da litíase?',
    ],
  },
  {
    termos: ['Pelve Renal'],
    classe: 'viscera',
    resumo: 'Reservatório em funil formado pela confluência dos cálices maiores, que se continua como ureter.',
    localizacao: 'No seio renal e parcialmente fora dele; pode ser intrarrenal ou extrarrenal, com implicações cirúrgicas distintas.',
    funcao: 'Recolhe a urina e a impulsiona ao ureter por ondas peristálticas geradas por células marca-passo dos cálices.',
    vascularizacao:
      'Ramos da artéria renal antes da divisão segmentar, com contribuição de ramos ureterais superiores. A drenagem venosa é para a veia renal. Sua irrigação é longitudinal e frágil, e é por isso que a dissecção circunferencial da pelve na pieloplastia arrisca a necrose da anastomose.',
    inervacao:
      'Plexo renal (T10–L1), com aferentes de distensão abundantes no urotélio e na parede muscular. É a distensão brusca desta pelve que produz a cólica renal — dor visceral em ondas, que o paciente não consegue localizar com o dedo.',
    relacoes: 'A junção ureteropélvica é o primeiro dos três estreitamentos da via urinária.',
    clinica:
      'A estenose da junção ureteropélvica é a causa mais comum de hidronefrose congênita, e em parte dos casos decorre de um vaso polar inferior cruzando a junção — detalhe anatômico que muda a técnica cirúrgica, exigindo transposição do vaso na pieloplastia. Uma pelve extrarrenal é mais fácil de operar; uma intrarrenal, mais difícil.',
    memoria:
      'Hidronefrose em criança começa quase sempre na junção com o ureter. Procure um vaso cruzando por baixo.',
    pontos: [
      'Como a pelve renal se relaciona com o seio?',
      'Onde está o primeiro estreitamento ureteral?',
      'Que achado vascular pode causar estenose da junção?',
    ],
  },
  {
    termos: ['Hilo Renal'],
    classe: 'viscera',
    resumo: 'Fenda vertical na margem medial do rim por onde passam vasos, nervos e a pelve renal.',
    localizacao: 'Margem medial de cada rim, ao nível de L1, abrindo-se no seio renal.',
    funcao:
      'Dá passagem, de frente para trás, à veia renal, à artéria renal e à pelve renal — a ordem "VAP" que se repete em todos os hilos renais.',
    vascularizacao:
      'É o próprio pedículo: a artéria renal entra, a veia renal sai e o ureter desce, nesta ordem de trás para a frente e de cima para baixo. A regra de disposição é VAU — Veia à frente, Artéria no meio, Ureter atrás.',
    inervacao:
      'O plexo renal envolve a artéria e entra por aqui, junto com vasos linfáticos que drenam para os linfonodos lombares (aórticos laterais). A denervação renal por cateter, usada na hipertensão resistente, atua exatamente sobre essas fibras periarteriais.',
    relacoes: 'O ureter continua a pelve inferiormente, ainda no plano posterior.',
    clinica:
      'Essa ordem constante é a regra da nefrectomia: a veia é encontrada primeiro, a artéria atrás dela e a pelve por último — e a ligadura da artéria antes da veia evita a congestão do rim. Na tomografia, é a mesma sequência que orienta a identificação das estruturas hilares, e sua inversão sugere anomalia de rotação.',
    memoria:
      'No hilo renal, de frente para trás: Veia, Artéria, Pelve. VAP — e a ordem nunca muda.',
    pontos: [
      'Qual a ordem das estruturas no hilo renal?',
      'Por que se liga a artéria antes da veia na nefrectomia?',
      'Em que nível vertebral está o hilo?',
    ],
  },
  /* ─────────────────── Vasos renais ─────────────────── */
  {
    termos: ['Artéria Renal Direita'],
    classe: 'arteria',
    resumo: 'Ramos laterais da aorta abdominal ao nível de L1–L2, que levam ao rim cerca de 20% do débito cardíaco.',
    localizacao: 'A direita é mais longa e passa atrás da veia cava inferior; a esquerda é mais curta e ligeiramente mais alta.',
    funcao:
      'Cada artéria se divide em cinco artérias segmentares — apical, anterossuperior, anteroinferior, inferior e posterior —, que são artérias terminais, sem anastomoses entre si.',
    relacoes: 'A linha avascular de Brödel, entre os territórios anterior e posterior, corre pouco atrás da margem lateral do rim.',
    clinica:
      'Serem terminais é o fato que domina a clínica: a oclusão de uma artéria segmentar produz infarto renal em cunha, sem qualquer suprimento colateral. A linha de Brödel é o plano por onde se faz a nefrotomia com menor sangramento e por onde se orienta a punção na nefrolitotripsia percutânea. A estenose de artéria renal, por sua vez, é a causa curável mais comum de hipertensão secundária.',
    memoria:
      'Cinco artérias segmentares, nenhuma conversando com a outra. Fechou uma, morreu o pedaço dela.',
    pontos: [
      'Quantas artérias segmentares existem e por que são terminais?',
      'O que é a linha de Brödel?',
      'Qual a diferença de trajeto entre as artérias renais direita e esquerda?',
    ],
  },
  {
    termos: ['Artéria do Segmento Superior'],
    classe: 'arteria',
    resumo: 'Primeira artéria segmentar da divisão anterior, para o polo superior e a face anterior alta do rim.',
    localizacao: 'Nasce da divisão anterior da artéria renal, dentro do seio renal, e sobe para o polo superior, à frente da pelve renal.',
    funcao:
      'Irriga o segmento superior — o polo mais alto do rim, junto da suprarrenal. É a primeira das cinco segmentares e, como todas elas, uma artéria terminal: seu território não recebe uma gota de nenhuma vizinha.',
    vascularizacao: 'Vasa vasorum da adventícia; é artéria intrarrenal de calibre médio.',
    inervacao: 'Fibras simpáticas do plexo renal, dispostas em torno da adventícia.',
    linfaticos: 'Linfáticos do hilo renal, para os linfonodos lombares.',
    relacoes:
      'Sobe à frente da pelve renal, como as outras três da divisão anterior; só a artéria do segmento posterior passa atrás dela.',
    clinica:
      'A independência dos cinco territórios é o que permite a nefrectomia parcial com clampeamento seletivo, hoje o padrão para tumores de até 4 cm — irriga-se o resto do rim enquanto se ressecа apenas um segmento. Do outro lado da mesma moeda: uma segmentar ligada por engano infarta seu território inteiro, sem chance de resgate por colateral.',
    memoria:
      'Cinco segmentos, cinco artérias, nenhuma anastomose. É um rim feito de cinco rins pequenos e independentes.',
    pontos: [
      'Quantos segmentos renais existem e como se distribuem?',
      'Por que as artérias segmentares são chamadas terminais?',
      'Que cirurgia aproveita a independência dos segmentos?',
    ],
  },
  {
    termos: ['Artéria Renal Extra-Hilar'],
    classe: 'arteria',
    resumo: 'Artéria renal acessória que entra no rim fora do hilo, geralmente em um dos polos.',
    localizacao: 'Nasce da aorta acima ou abaixo da artéria renal principal e alcança diretamente um polo, com frequência o inferior.',
    funcao: 'Irriga um segmento renal de forma exclusiva — é também uma artéria terminal, e não uma redundância.',
    relacoes: 'Presente em cerca de 25 a 30% das pessoas.',
    clinica:
      'Por não ser colateral, sua ligadura infarta o segmento correspondente — erro com consequência permanente na nefrectomia e no transplante. Uma artéria polar inferior é ainda a causa clássica de obstrução extrínseca da junção ureteropélvica, e sua identificação prévia na angiotomografia é obrigatória no preparo do doador vivo.',
    memoria:
      'Artéria acessória não é sobra: é dona exclusiva de um pedaço do rim. Ligou, perdeu o pedaço.',
    pontos: [
      'Com que frequência existem artérias renais acessórias?',
      'Por que sua ligadura é problemática?',
      'Que complicação uma artéria polar inferior pode causar?',
    ],
  },
  {
    termos: ['Veia Renal Direita'],
    classe: 'veia',
    resumo: 'Veias que drenam os rins para a veia cava inferior, com trajetos muito diferentes entre os lados.',
    localizacao:
      'A direita é curta (2 a 4 cm) e desemboca diretamente na cava; a esquerda é longa (6 a 10 cm), cruza a linha média à frente da aorta e passa sob a artéria mesentérica superior.',
    funcao: 'A veia renal esquerda recebe ainda a veia suprarrenal esquerda, a gonadal esquerda e, com frequência, uma veia lombar — a direita não recebe tributárias importantes.',
    relacoes: 'A passagem da esquerda pela pinça aortomesentérica é o ponto crítico do seu trajeto.',
    clinica:
      'Essa assimetria explica três fatos clínicos: a varicocele é predominantemente esquerda, porque a gonadal esquerda drena em ângulo reto numa veia sob compressão; a síndrome do quebra-nozes, com hematúria e dor no flanco, decorre do aprisionamento da veia esquerda na pinça; e uma varicocele direita de aparecimento súbito é sinal de alarme para trombose ou tumor renal.',
    memoria:
      'Varicocele é quase sempre à esquerda. Se aparecer à direita e de repente, procure um tumor no rim.',
    pontos: [
      'Que tributárias a veia renal esquerda recebe?',
      'Por que a varicocele é predominantemente esquerda?',
      'O que é a síndrome do quebra-nozes?',
    ],
  },
  {
    termos: ['Veia Gonadal Esquerda'],
    classe: 'veia',
    resumo: 'Veia testicular ou ovárica esquerda, que drena para a veia renal esquerda em ângulo reto.',
    localizacao: 'Ascende no retroperitônio, à frente do psoas e do ureter, até a veia renal esquerda.',
    funcao: 'Drena o testículo ou o ovário esquerdo; à direita, a gonadal desemboca diretamente na veia cava inferior, em ângulo agudo.',
    relacoes: 'Cruza o ureter esquerdo no seu trajeto ascendente.',
    clinica:
      'A desembocadura em ângulo reto numa veia de maior pressão é a explicação clássica da varicocele esquerda, presente em cerca de 15% dos homens e principal causa corrigível de infertilidade masculina. A veia gonadal é também referência para localizar o ureter na cirurgia retroperitoneal — e sua ligadura é passo da nefrectomia.',
    memoria:
      'À esquerda a gonadal sobe até o rim; à direita ela vai direto na cava. Ângulo reto e coluna alta de sangue: varicocele.',
    pontos: [
      'Onde desembocam as veias gonadais de cada lado?',
      'Por que essa diferença gera varicocele à esquerda?',
      'Que estrutura ela cruza no retroperitônio?',
    ],
  },
  {
    termos: ['Veia Suprarrenal Esquerda'],
    classe: 'veia',
    resumo: 'Veia única da glândula suprarrenal esquerda, que drena para a veia renal esquerda.',
    localizacao: 'Do hilo da suprarrenal esquerda à veia renal esquerda, frequentemente unindo-se à veia frênica inferior.',
    funcao: 'Drena a suprarrenal esquerda; a direita, muito mais curta, desemboca diretamente na veia cava inferior.',
    relacoes: 'Cada suprarrenal tem múltiplas artérias e uma única veia — o inverso do padrão usual dos órgãos.',
    clinica:
      'Essa assimetria é decisiva no cateterismo seletivo das veias suprarrenais, exame padrão-ouro para lateralizar o hiperaldosteronismo primário: a veia esquerda é fácil de cateterizar; a direita, curta e em ângulo, é o desafio técnico que determina o sucesso do exame. Na adrenalectomia, a ligadura precoce da veia evita a descarga de catecolaminas no feocromocitoma.',
    memoria:
      'Suprarrenal tem muitas artérias e uma veia só. E a veia da direita é curtinha, difícil de pegar.',
    pontos: [
      'Onde drena cada veia suprarrenal?',
      'Por que o padrão vascular da suprarrenal é peculiar?',
      'Que exame depende do cateterismo dessas veias?',
    ],
  },
  {
    termos: ['Glândula Suprarrenal Direita'],
    classe: 'glandula',
    resumo: 'Glândulas endócrinas sobre os polos superiores dos rins, com córtex e medula de origens distintas.',
    localizacao: 'A direita é piramidal e apoia-se sobre o polo superior direito, atrás da veia cava; a esquerda é semilunar e desce ao longo da margem medial do rim esquerdo.',
    funcao:
      'O córtex, de origem mesodérmica, produz mineralocorticoides (zona glomerulosa), glicocorticoides (fasciculada) e androgênios (reticulada); a medula, de origem da crista neural, é um gânglio simpático modificado que secreta catecolaminas.',
    inervacao:
      'Caso único no corpo: as células da medula suprarrenal são neurônios simpáticos pós-ganglionares que perderam os axônios, e por isso recebem fibras PRÉ-ganglionares diretas dos nervos esplâncnicos maior e menor, sem sinapse em gânglio nenhum. A glândula é, literalmente, um gânglio simpático que virou órgão endócrino — e é por isso que o susto libera adrenalina em segundos.',
    vascularizacao: 'Artérias suprarrenais superior (frênica inferior), média (aorta) e inferior (renal) — três fontes; drenagem por uma única veia.',
    clinica:
      'A dupla origem embrionária explica por que uma mesma glândula produz doenças tão diferentes: adenoma cortical com síndrome de Cushing ou hiperaldosteronismo, e feocromocitoma da medula, com crises hipertensivas, cefaleia e sudorese. A regra mnemônica das camadas — "GFR: Sal, Açúcar, Sexo" — resume o que cada uma faz.',
    memoria:
      'Glomerulosa faz sal, Fasciculada faz açúcar, Reticulada faz sexo. E a medula, que vem do nervo, faz adrenalina.',
    pontos: [
      'Qual a origem embrionária do córtex e da medula suprarrenal?',
      'O que cada zona cortical produz?',
      'Qual o padrão vascular da glândula?',
    ],
  },
  {
    termos: ['Artéria Aorta (Parte Abdominal)'],
    classe: 'arteria',
    resumo: 'Segmento abdominal da aorta, do hiato aórtico até a bifurcação em L4.',
    localizacao: 'De T12 a L4, à esquerda da linha média, à frente dos corpos vertebrais e à esquerda da veia cava inferior.',
    funcao:
      'Emite três ramos ímpares anteriores para o tubo digestório (tronco celíaco em T12, mesentérica superior em L1, mesentérica inferior em L3), ramos pares laterais para as vísceras urogenitais e suprarrenais, e ramos posteriores segmentares.',
    relacoes: 'A bifurcação em L4 corresponde à linha que une as cristas ilíacas.',
    clinica:
      'A aorta abdominal infrarrenal é o sítio de 90% dos aneurismas, e o rastreio por ultrassonografia em homens acima de 65 anos com histórico de tabagismo é recomendação estabelecida. A rotura de aneurisma dá dor abdominal ou lombar súbita, hipotensão e massa pulsátil — tríade clássica —, mas o quadro se confunde com cólica renal, e essa confusão é a causa mais comum de diagnóstico tardio.',
    memoria:
      'Celíaco em T12, mesentérica superior em L1, mesentérica inferior em L3, bifurcação em L4. Uma escada de números.',
    pontos: [
      'Em que níveis nascem os três ramos ímpares da aorta abdominal?',
      'Onde ela se bifurca?',
      'Qual a tríade da rotura de aneurisma de aorta abdominal?',
    ],
  },
  /* ─────────────────── Ureteres e bexiga ─────────────────── */
  {
    termos: ['Ureter Direito'],
    classe: 'viscera',
    resumo: 'Tubos musculares de 25 a 30 cm que conduzem a urina dos rins à bexiga por peristalse.',
    localizacao:
      'Descem retroperitonealmente sobre o psoas, cruzam os vasos ilíacos na bifurcação e entram na pelve; atravessam a parede vesical obliquamente.',
    funcao:
      'Transportam a urina ativamente, por ondas peristálticas — não por gravidade. Apresentam três estreitamentos: a junção ureteropélvica, o cruzamento dos vasos ilíacos e a junção ureterovesical.',
    vascularizacao: 'Segmentar: renal em cima, gonadal e ilíaca no meio, vesical embaixo — com anastomoses longitudinais na adventícia.',
    inervacao: 'Plexos renal, aórtico e hipogástrico; a dor referida acompanha os dermátomos T11 a L2.',
    relacoes:
      'No homem, o ducto deferente cruza por cima do ureter; na mulher, a artéria uterina cruza por cima, a cerca de 2 cm do colo — "a água passa por baixo da ponte".',
    clinica:
      'Os três estreitamentos são onde os cálculos param, e a dor migra conforme a posição: dor lombar na junção ureteropélvica, dor em flanco irradiada para a virilha no cruzamento ilíaco, e disúria com urgência na junção vesical. E o cruzamento com a artéria uterina é o passo mais perigoso da histerectomia — a lesão ureteral é a complicação urológica mais temida da cirurgia ginecológica.',
    memoria:
      '"Water under the bridge": a artéria uterina passa por cima do ureter. Ligou a ponte sem ver a água, cortou o ureter.',
    pontos: [
      'Quais são os três estreitamentos do ureter?',
      'Qual a relação do ureter com a artéria uterina?',
      'Por que a irrigação segmentar importa na cirurgia ureteral?',
    ],
  },
  {
    termos: ['Fundo da Bexiga'],
    classe: 'viscera',
    resumo: 'Face posterior triangular da bexiga, onde se abrem os ureteres.',
    localizacao: 'Voltada para trás e para baixo; no homem, relaciona-se com o reto, as glândulas seminais e os ductos deferentes; na mulher, com a vagina e o colo do útero.',
    funcao: 'Contém o trígono vesical, área lisa e fixa da mucosa entre os dois óstios ureterais e o óstio interno da uretra.',
    vascularizacao:
      'Artérias vesicais inferiores, ramos da ilíaca interna — na mulher substituídas por ramos da artéria vaginal. A drenagem é pelo plexo venoso vesical para a ilíaca interna; nos homens, esse plexo se comunica com o prostático e, por ele, com o plexo vertebral de Batson.',
    inervacao:
      'Parassimpático dos nervos esplâncnicos pélvicos (S2–S4), que contrai o detrusor, e simpático de T11 a L2, pelo plexo hipogástrico inferior. A comunicação venosa com o plexo de Batson é a via anatômica pela qual o câncer de próstata e de bexiga metastatiza para a coluna sem passar pelo pulmão.',
    relacoes: 'A escavação retovesical, no homem, e a vesicouterina, na mulher, ficam acima dela.',
    clinica:
      'A relação direta com o reto é o que permite palpar o fundo vesical ao toque retal e o que faz um tumor de fundo vesical invadir o reto. No homem, o espaço entre bexiga e reto é o ponto mais baixo da cavidade peritoneal em decúbito dorsal — onde pus e sangue se acumulam e onde a drenagem transretal é feita.',
    memoria:
      'O fundo da bexiga é a parede de trás, encostada no reto. Por isso o toque retal alcança a próstata e a base da bexiga.',
    pontos: [
      'Que estruturas se relacionam com o fundo da bexiga em cada sexo?',
      'O que é o trígono vesical?',
      'Por que o fundo é acessível ao toque retal?',
    ],
  },
  {
    termos: ['Ápice da Bexiga'],
    classe: 'viscera',
    resumo: 'Extremidade anterossuperior da bexiga, de onde parte o úraco em direção ao umbigo.',
    localizacao: 'Aponta para a sínfise púbica; dele parte o ligamento umbilical mediano.',
    funcao: 'O ligamento umbilical mediano é o resto obliterado do úraco, que na vida fetal ligava a bexiga ao alantoide.',
    vascularizacao:
      'Ramos terminais das artérias vesicais superiores. Dele parte o úraco, ou ligamento umbilical mediano, resto do alantoide, que sobe até a cicatriz umbilical entre a fáscia transversal e o peritônio.',
    inervacao:
      'Plexo vesical, de fibras parassimpáticas S2–S4 e simpáticas T11–L2. A persistência do úraco produz drenagem de urina pelo umbigo no recém-nascido, e seu remanescente é o sítio do adenocarcinoma de úraco — tumor raro que aparece no domo da bexiga, e não no trígono.',
    relacoes: 'É o ponto que mais sobe quando a bexiga se enche, elevando-se acima da sínfise.',
    clinica:
      'A persistência do úraco produz um espectro de anomalias — fístula uracal com saída de urina pelo umbigo, cisto e seio uracal —, e o adenocarcinoma de úraco é um tumor raro que nasce na cúpula vesical. É também porque o ápice sobe com o enchimento que a punção suprapúbica é possível: bexiga cheia empurra o peritônio para cima e cria uma janela extraperitoneal.',
    memoria:
      'Urina saindo pelo umbigo de um recém-nascido: o úraco não fechou. É a bexiga conversando com o passado fetal.',
    pontos: [
      'O que é o úraco e o que ele se torna?',
      'Que anomalias sua persistência causa?',
      'Por que a bexiga cheia permite a punção suprapúbica?',
    ],
  },
  {
    termos: ['Corpo da Bexiga'],
    classe: 'viscera',
    sistemas: ['urinario'],
    resumo: 'Porção principal da bexiga, entre o ápice e o fundo, com parede pregueada e distensível.',
    localizacao: 'Na pelve menor quando vazia, no adulto; em criança pequena, é abdominal mesmo vazia.',
    funcao: 'Armazena de 300 a 500 mL de urina com pressão praticamente constante, graças à complacência do detrusor e ao pregueamento da mucosa.',
    vascularizacao:
      'Artérias vesicais superiores, ramos da porção permeável da artéria umbilical, e vesicais inferiores. A vesical superior é o vaso que se liga na cistectomia e o que dá origem ao ligamento umbilical medial quando se oblitera.',
    inervacao:
      'Parassimpático S2–S4 para o detrusor; as aferentes de plenitude sobem pelos mesmos nervos pélvicos e são as que produzem a vontade de urinar. As aferentes de dor por distensão excessiva, ao contrário, sobem pelo simpático — motivo de a retenção urinária doer no hipogástrio.',
    relacoes: 'Coberto por peritônio apenas na face superior.',
    clinica:
      'A posição abdominal da bexiga infantil é o que torna a punção suprapúbica o método de escolha para coleta estéril de urina no lactente. E a complacência é o parâmetro central da urodinâmica: sua perda — na bexiga neurogênica e após radioterapia — eleva a pressão de armazenamento e ameaça o trato urinário superior, com risco de hidronefrose e insuficiência renal.',
    memoria:
      'Bexiga de bebê é órgão abdominal; de adulto, pélvico. Por isso a punção suprapúbica é fácil na criança.',
    pontos: [
      'Que volume a bexiga armazena normalmente?',
      'O que é complacência vesical e por que ela importa?',
      'Por que a bexiga infantil é abdominal?',
    ],
  },
  {
    termos: ['Colo da Bexiga'],
    classe: 'viscera',
    resumo: 'Funil muscular na porção mais baixa da bexiga, onde o detrusor converge e forma o esfíncter interno.',
    localizacao: 'Ponto mais fixo e mais inferior da bexiga, apoiado na próstata no homem e no diafragma pélvico na mulher.',
    funcao:
      'Suas fibras musculares lisas circulares formam o esfíncter uretral interno, involuntário, sob controle simpático (T11–L2) — que o contrai na ejaculação, impedindo a ejaculação retrógrada. É parede muscular, e não abertura: o colo é o músculo que fecha, não o buraco que se fecha.',
    vascularizacao:
      'Artérias vesicais inferiores, ramos da ilíaca interna, com contribuição das prostáticas no homem e das vaginais na mulher. O plexo venoso vesicoprostático que o envolve é volumoso e sangra muito na ressecção endoscópica do colo.',
    inervacao: 'Simpático pelos nervos hipogástricos; parassimpático pelos esplâncnicos pélvicos (S2–S4), que contraem o detrusor.',
    clinica:
      'Essa dupla inervação organiza toda a farmacologia urológica: alfabloqueadores relaxam o colo e melhoram o esvaziamento na hiperplasia prostática — mas causam ejaculação retrógrada, justamente por abolir o fechamento do colo. E a lesão do colo na ressecção prostática é a causa de incontinência e de esclerose do colo vesical.',
    memoria:
      'Simpático guarda (fecha o colo), parassimpático esvazia (contrai o detrusor). "S de estocar, P de pipi."',
    pontos: [
      'Que músculo forma o esfíncter uretral interno?',
      'Qual sua inervação e função na ejaculação?',
      'Por que alfabloqueadores causam ejaculação retrógrada?',
    ],
  },
  {
    termos: ['Óstio Interno da Uretra'],
    classe: 'viscera',
    resumo: 'A abertura no vértice do trígono por onde a urina deixa a bexiga — o orifício, não o músculo que o guarda.',
    localizacao: 'No ângulo anteroinferior do trígono vesical, no ponto mais declive da bexiga em pé, cercado pelo colo vesical.',
    funcao:
      'É a saída da bexiga. Sua posição no fundo do trígono é o que faz a bexiga esvaziar por completo: qualquer outro ponto deixaria urina residual. Ele não se fecha por conta própria — quem o fecha é o músculo do colo em volta dele.',
    vascularizacao: 'Ramos terminais das artérias vesicais inferiores, com rede submucosa densa; drenagem para o plexo venoso vesical.',
    inervacao:
      'Aferentes de S2–S4 abundantes na mucosa que o circunda, e é a irritação desta mucosa que produz a urgência insuportável de um cálculo encravado na saída da bexiga ou da ponta do balão de uma sonda de Foley.',
    relacoes: 'No homem, a próstata está imediatamente abaixo, e seus lobos crescem justamente ao redor dele.',
    clinica:
      'Distinguir óstio de colo é o que torna inteligível a hiperplasia prostática: o lobo médio da próstata cresce para dentro e obstrui o óstio como uma válvula, sem que o colo esteja doente. Daí um paciente com próstata pequena poder ter obstrução grave e outro com próstata enorme urinar bem — o que importa é a geometria do orifício, não o volume da glândula.',
    memoria:
      'O colo é o músculo; o óstio é o buraco. Próstata grande que não obstrui e próstata pequena que obstrui: o que decide é o buraco.',
    pontos: [
      'Qual a diferença entre colo da bexiga e óstio interno da uretra?',
      'Por que a posição do óstio garante o esvaziamento completo?',
      'Por que o volume prostático não prevê o grau de obstrução?',
    ],
  },
  {
    termos: ['Trígono Vesical'],
    classe: 'viscera',
    resumo: 'Área triangular lisa no fundo da bexiga, entre os dois óstios ureterais e o óstio interno da uretra.',
    localizacao: 'Fundo da bexiga; a prega interuretérica une os dois óstios ureterais e é sua borda superior.',
    funcao:
      'Sua mucosa é firmemente aderida à musculatura subjacente e não se pregueia, ao contrário do restante da bexiga. Origina-se do ducto mesonéfrico, e não do seio urogenital como o resto da bexiga.',
    vascularizacao:
      'Artérias vesicais inferiores, com uma rede submucosa mais densa que a do restante da bexiga. É a região mais vascularizada e a mais sangrante à ressecção transuretral.',
    inervacao:
      'Densidade sensitiva muito maior que a do resto da bexiga, com aferentes que sobem pelo plexo hipogástrico inferior. É por isso que um cálculo ou um cateter tocando o trígono provoca urgência intensa e dor referida à ponta do pênis ou ao clitóris, mesmo com a bexiga vazia.',
    relacoes: 'A prega interuretérica é a referência endoscópica para localizar os óstios ureterais.',
    clinica:
      'Essa origem embrionária distinta é a explicação para o trígono ser a área mais sensível da bexiga e o sítio preferencial da cistite — a "trigonite" — e de muitos tumores. Na cistoscopia, seguir a prega interuretérica é o modo de encontrar os óstios para cateterizar os ureteres, passo inicial de qualquer procedimento ureteral retrógrado.',
    memoria:
      'O trígono é liso porque não pregueia, e é diferente porque veio de outro tecido embrionário. Área diferente, doenças diferentes.',
    pontos: [
      'Que estruturas delimitam o trígono vesical?',
      'Qual sua origem embrionária?',
      'Por que ele não se pregueia?',
    ],
  },
  {
    termos: ['Óstio do Ureter Direito'],
    classe: 'viscera',
    resumo: 'Aberturas dos ureteres nos ângulos superiores do trígono vesical.',
    localizacao: 'Ângulos posterolaterais do trígono, com trajeto intramural oblíquo de cerca de 1,5 a 2 cm.',
    funcao:
      'O trajeto oblíquo através da parede vesical é um mecanismo valvular: quando a bexiga se enche e se contrai, ela comprime o segmento intramural contra si mesma e o fecha, impedindo o refluxo.',
    vascularizacao:
      'Ramos ureterais das artérias vesicais inferiores. É o segmento final de uma irrigação que muda de fonte ao longo do trajeto — renal em cima, ilíaca e vesical embaixo —, e por isso a artéria chega ao ureter pela face medial acima e pela lateral abaixo.',
    inervacao:
      'Plexo vesical e aferentes que sobem por S2–S4 e por T11–L1. É o ponto mais estreito de todo o ureter, junto da junção ureteropélvica e do cruzamento com os ilíacos — os três locais onde o cálculo impacta.',
    relacoes: 'A relação entre comprimento do túnel e diâmetro do ureter deve ser de cerca de 5 para 1.',
    clinica:
      'Um túnel curto demais é a base do refluxo vesicoureteral primário, causa de pielonefrites de repetição e de cicatrizes renais na criança. É essa proporção 5:1 que as técnicas de reimplante ureteral reproduzem — a cirurgia consiste literalmente em construir um túnel submucoso mais longo. Anatomia funcional convertida em técnica operatória.',
    memoria:
      'O ureter atravessa a parede da bexiga na diagonal. Bexiga cheia esmaga o túnel e fecha a porta sozinha.',
    pontos: [
      'Como funciona o mecanismo antirrefluxo da junção ureterovesical?',
      'Qual a proporção ideal entre túnel e diâmetro ureteral?',
      'O que acontece quando o túnel é curto?',
    ],
  },
  {
    termos: ['Músculo Detrusor da Bexiga'],
    classe: 'viscera',
    resumo: 'Músculo liso da parede vesical, disposto em três camadas entrelaçadas, e a mucosa que ele sustenta.',
    localizacao: 'Parede da bexiga, com camadas longitudinal externa, circular média e longitudinal interna; a mucosa é de epitélio de transição (urotélio).',
    funcao:
      'O detrusor contrai a bexiga inteira de uma vez na micção, sob comando parassimpático de S2–S4. O urotélio é impermeável à urina e adapta sua espessura à distensão, passando de 6 camadas na bexiga vazia a 2 ou 3 na cheia.',
    vascularizacao:
      'Artérias vesicais superior e inferior, com uma rede intramural densa que permite à parede se manter viável apesar da isquemia relativa durante a distensão máxima.',
    inervacao: 'Parassimpático (S2–S4) para contração; simpático (T11–L2) para relaxamento e armazenamento.',
    clinica:
      'A hiperatividade do detrusor produz urgência e urgeincontinência, tratada com anticolinérgicos e beta-3-agonistas — cada um agindo em um dos braços dessa inervação dupla. A hipertrofia por obstrução prostática produz a bexiga de esforço, com trabéculas e divertículos. E o urotélio, exposto a carcinógenos urinários, é o epitélio de origem do carcinoma urotelial, que pode surgir em qualquer ponto do trato — pelve, ureter ou bexiga — o que obriga a investigar o trato inteiro diante de uma hematúria.',
    memoria:
      'Urotélio é o mesmo do cálice à uretra. Tumor num ponto obriga a olhar todos os outros: é doença de campo.',
    pontos: [
      'Que inervação contrai e qual relaxa o detrusor?',
      'Como o urotélio se adapta à distensão?',
      'Por que a hematúria exige investigar todo o trato urinário?',
    ],
  },
  /* ─────────────────── Uretra ─────────────────── */
  {
    termos: ['Uretra - Parte Prostática', 'Parte Prostática da Uretra'],
    classe: 'viscera',
    resumo: 'Segmento mais largo e mais dilatável da uretra masculina, atravessando a próstata.',
    localizacao: 'Da bexiga até o ápice da próstata, com cerca de 3 a 4 cm; sua parede posterior apresenta a crista uretral.',
    funcao: 'Recebe os ductos ejaculatórios e os ductos prostáticos — é onde as vias urinária e genital se encontram no homem.',
    vascularizacao:
      'Ramos prostáticos das artérias vesical inferior e retal média, ramos da ilíaca interna. O plexo venoso prostático que a envolve comunica-se com o plexo vertebral de Batson — a rota das metástases vertebrais do câncer de próstata.',
    inervacao:
      'Plexo prostático, do plexo hipogástrico inferior, com simpático de T11 a L2 e parassimpático de S2 a S4. As fibras simpáticas fecham o esfíncter uretral interno durante a ejaculação, impedindo o refluxo de sêmen para a bexiga — e seu bloqueio por alfabloqueadores é o que causa a ejaculação retrógrada desses medicamentos.',
    relacoes: 'A crista uretral tem, no seu meio, o colículo seminal, e de cada lado os seios prostáticos.',
    clinica:
      'É o segmento ressecado na RTU de próstata, e seus limites definem o resultado: o colículo seminal é o marco distal que o cirurgião não ultrapassa, porque logo abaixo está o esfíncter externo — passar dele é produzir incontinência definitiva. Um único ponto de referência separa uma cirurgia bem-sucedida de uma sequela permanente.',
    memoria:
      'Na ressecção da próstata, o colículo seminal é a linha de chegada. Ultrapassou, o paciente fica incontinente.',
    pontos: [
      'Que ductos desembocam na uretra prostática?',
      'O que é o colículo seminal?',
      'Por que ele é o limite distal da RTU de próstata?',
    ],
  },
  {
    termos: ['Colículo Seminal'],
    classe: 'viscera',
    resumo: 'Elevação na crista uretral prostática, com o utrículo no centro e os ductos ejaculatórios nas laterais.',
    localizacao: 'Meio da parede posterior da uretra prostática; os seios prostáticos, de cada lado, recebem os ductos da glândula.',
    funcao:
      'O utrículo prostático é um pequeno divertículo em fundo cego, remanescente dos ductos paramesonéfricos — o homólogo masculino do útero e da vagina. Os ductos ejaculatórios abrem-se de cada lado dele.',
    vascularizacao:
      'Ramos prostáticos da artéria vesical inferior, com uma rede submucosa densa; drenagem para o plexo venoso prostático.',
    inervacao:
      'Plexo prostático (T11–L2 e S2–S4), com aferentes densos. É a região mais sensível da uretra masculina e o gatilho reflexo da emissão seminal — e é também o reparo anatômico que limita a ressecção na prostatectomia endoscópica: ressecar além do colículo é lesar o esfíncter externo.',
    relacoes: 'É o marco endoscópico mais confiável da uretra posterior.',
    clinica:
      'Um utrículo aumentado é achado associado a hipospádia grave e a distúrbios do desenvolvimento sexual, e pode causar infecções de repetição e obstrução ejaculatória. A obstrução dos ductos ejaculatórios nessa altura é causa tratável de azoospermia obstrutiva, corrigida por ressecção endoscópica — diagnóstico que só se faz conhecendo essa anatomia.',
    memoria:
      'O utrículo é o "útero" que o homem não desenvolveu: um resto de ducto paramesonéfrico no meio da próstata.',
    pontos: [
      'De que estrutura embrionária deriva o utrículo prostático?',
      'Que ductos se abrem ao lado dele?',
      'Que quadro sua obstrução pode causar?',
    ],
  },
  {
    termos: ['Uretra - Parte Membranácea'],
    classe: 'viscera',
    resumo: 'Segmento mais curto e menos distensível da uretra masculina, que atravessa o diafragma urogenital.',
    localizacao: 'Do ápice da próstata ao bulbo do pênis, com cerca de 1 a 2 cm, atravessando a membrana perineal.',
    funcao: 'É circundada pelo esfíncter uretral externo, de músculo estriado, voluntário, inervado pelo nervo pudendo (S2–S4) — o esfíncter da continência.',
    vascularizacao:
      'Artéria bulbouretral, ramo da pudenda interna, e ramos da artéria do bulbo do pênis. Segmento curto e de irrigação escassa, o que faz dele o sítio preferencial da estenose de uretra após trauma.',
    inervacao:
      'Nervo pudendo (S2–S4), que comanda o esfíncter uretral externo — músculo estriado, de controle voluntário. É o esfíncter que a prostatectomia radical precisa preservar, e cuja lesão produz incontinência definitiva.',
    relacoes: 'As glândulas bulbouretrais estão lateralmente a ela, dentro do diafragma urogenital.',
    clinica:
      'Ser fixa e curta faz dela o segmento que rompe nas fraturas de pelve: o cisalhamento entre a próstata, deslocada para cima, e o bulbo, fixo ao períneo, produz a lesão de uretra posterior. O sinal é sangue no meato com bexiga palpável e próstata alta ao toque — e a sondagem está contraindicada antes da uretrografia retrógrada, sob risco de converter uma lesão parcial em completa.',
    memoria:
      'Sangue no meato depois de fratura de bacia: não sonde. Peça uretrografia antes de encostar uma sonda.',
    pontos: [
      'Que esfíncter circunda a uretra membranácea?',
      'Por que ela se rompe nas fraturas de pelve?',
      'Por que a sondagem é contraindicada nessa suspeita?',
    ],
  },
  {
    termos: ['Uretra - Parte Esponjosa', 'Parte Esponjosa da Uretra'],
    classe: 'viscera',
    resumo: 'Segmento mais longo da uretra masculina, percorrendo o corpo esponjoso do bulbo até a glande.',
    localizacao: 'Do bulbo do pênis ao óstio externo, com cerca de 15 cm; dilata-se no bulbo e novamente na fossa navicular, na glande.',
    funcao: 'Conduz urina e sêmen; recebe os ductos das glândulas bulbouretrais no seu início e das glândulas uretrais em todo o trajeto.',
    vascularizacao:
      'Artéria uretral e artéria do bulbo do pênis, ramos da pudenda interna, que correm dentro do próprio corpo esponjoso. Toda a irrigação chega por dentro do tecido erétil, e é por isso que a uretrotomia sangra de forma difusa e difícil de conter.',
    inervacao:
      'Nervo dorsal do pênis, ramo do pudendo (S2–S4), para a sensibilidade, e fibras autonômicas do plexo prostático para as glândulas. A sensibilidade aqui é somática e intensa — a razão de a passagem de sonda doer tanto sem anestésico tópico.',
    relacoes: 'É a única porção envolvida por tecido erétil, o que a mantém pérvia durante a ereção.',
    clinica:
      'A queda em cavaleiro comprime o bulbo contra a sínfise e produz a lesão de uretra anterior, com hematoma perineal em asa de borboleta — quadro distinto da lesão posterior. As estenoses pós-infecciosas e pós-instrumentação também se concentram aqui, e a fossa navicular é o ponto mais estreito da uretra masculina depois do meato, o que limita o calibre das sondas.',
    memoria:
      'Uretra anterior é queda em cavaleiro; uretra posterior é fratura de bacia. Dois mecanismos, dois segmentos.',
    pontos: [
      'Qual a extensão da uretra esponjosa?',
      'Que mecanismo lesa a uretra anterior?',
      'De onde vem a irrigação da uretra esponjosa?',
    ],
  },
  {
    termos: ['Fossa Navicular'],
    classe: 'viscera',
    resumo: 'Dilatação terminal da uretra dentro da glande, imediatamente antes do meato.',
    localizacao: 'Último centímetro e meio da uretra, na glande, entre a uretra esponjosa e o óstio externo.',
    funcao:
      'É a única porção da uretra revestida por epitélio escamoso estratificado, e não por epitélio colunar — a transição de epitélio acontece aqui, adaptada ao contato com o exterior. Sua dilatação forma um pequeno reservatório que dá ao jato urinário a forma de leque.',
    vascularizacao:
      'Ramos terminais das artérias dorsais do pênis, que descem da superfície para a glande — e não da artéria uretral, que irriga o restante do canal. Essa mudança de fonte é a razão de a reconstrução da fossa navicular exigir retalho de pedículo dorsal.',
    inervacao: 'Nervo dorsal do pênis (S2–S4), com a maior densidade de terminações sensitivas de toda a uretra.',
    relacoes: 'A válvula de Guérin, uma prega mucosa no seu teto, pode reter a ponta de uma sonda mal introduzida.',
    clinica:
      'É o segundo ponto mais estreito da uretra masculina, logo depois do meato, e por isso limita o calibre das sondas. É também onde a estenose por líquen escleroso (balanite xerótica obliterante) começa, porque é o segmento de epitélio escamoso — a doença é de pele, e ataca justamente o trecho de uretra revestido como pele. E a válvula de Guérin é a armadilha que faz a sonda "travar" no último centímetro.',
    memoria:
      'Último trecho da uretra é forrado como pele, e adoece como pele. Líquen escleroso começa no meato e na fossa navicular.',
    pontos: [
      'Que epitélio reveste a fossa navicular e por quê?',
      'Que artéria a irriga, diferente do resto da uretra?',
      'Por que o líquen escleroso a acomete preferencialmente?',
    ],
  },
  {
    termos: ['Uretra Feminina', 'Uretra'],
    classe: 'viscera',
    sistemas: ['urinario', 'genital-feminino'],
    resumo: 'Tubo curto de cerca de 4 cm que conduz a urina da bexiga ao vestíbulo da vagina.',
    localizacao: 'Da bexiga ao óstio externo, no vestíbulo da vagina, à frente do óstio vaginal; corre aderida à parede vaginal anterior.',
    funcao:
      'Exclusivamente urinária, ao contrário da masculina. A continência depende do esfíncter uretral externo, do suporte da parede vaginal anterior e dos ligamentos pubouretrais.',
    vascularizacao:
      'Artéria vesical inferior e artéria vaginal, ramos da ilíaca interna, no terço proximal, e artéria pudenda interna no distal. A rica rede vascular submucosa funciona como coxim de vedação: perdê-la, na atrofia pós-menopausa, contribui para a incontinência tanto quanto a fraqueza muscular — e é a razão de o estrogênio tópico ajudar.',
    inervacao: 'Nervo pudendo (S2–S4) para o esfíncter externo.',
    relacoes: 'As glândulas parauretrais de Skene abrem-se ao lado do óstio externo.',
    clinica:
      'Ser curta e reta é a razão de a infecção urinária ser muito mais frequente na mulher. A perda do suporte da parede vaginal anterior produz hipermobilidade uretral e incontinência de esforço — corrigida pelo sling suburetral, que recria o apoio, e não por apertar o esfíncter. As glândulas de Skene são o sítio do divertículo uretral, com a tríade de disúria, dispareunia e gotejamento pós-miccional.',
    memoria:
      'Continência feminina depende de apoio, não de aperto. O sling devolve o "colchão" sob a uretra.',
    pontos: [
      'Por que a infecção urinária é mais comum na mulher?',
      'De que depende a continência feminina?',
      'O que são as glândulas de Skene?',
    ],
  },
  {
    termos: ['Óstio Externo da Uretra'],
    classe: 'viscera',
    resumo: 'Abertura terminal da uretra, na glande no homem e no vestíbulo da vagina na mulher.',
    localizacao: 'Ápice da glande no homem; entre o clitóris e o óstio vaginal na mulher.',
    funcao: 'É o ponto mais estreito da uretra em ambos os sexos, e determina o calibre máximo de qualquer instrumento.',
    vascularizacao:
      'Artéria dorsal do pênis e ramos da artéria uretral, no homem; artéria pudenda interna, pelos ramos labiais posteriores, na mulher.',
    inervacao:
      'Nervo dorsal do pênis ou do clitóris, ramo do pudendo (S2–S4) — inervação somática densa, que torna a passagem de sonda dolorosa e exige anestesia tópica. É o ponto mais estreito da uretra masculina, e o calibre da sonda é decidido por ele.',
    relacoes: 'No homem, é uma fenda sagital; na mulher, um orifício com bordas evertidas.',
    clinica:
      'Ser o ponto mais estreito é a razão de a estenose de meato limitar a sondagem e a cistoscopia, e de a meatotomia ser o primeiro passo quando o instrumento não passa. A hipospádia — meato em posição ventral anômala — é uma das malformações mais comuns do menino, e sua correção deve preceder qualquer instrumentação. Na mulher, a localização do meato é a referência da cateterização, frequentemente dificultada por atrofia genital na idosa.',
    memoria:
      'O meato é sempre a porta mais estreita. Se a sonda não entra, o problema costuma ser logo na entrada.',
    pontos: [
      'Onde se localiza o óstio externo em cada sexo?',
      'Por que ele limita a instrumentação?',
      'O que é hipospádia?',
    ],
  },
  {
    termos: [
      'Glândula Suprarrenal Esquerda',
    ],
    classe: 'glandula',
    resumo:
      'Glândula suprarrenal do lado esquerdo, em forma de meia-lua, apoiada sobre a borda medial do polo superior do rim.',
    localizacao:
      'Semilunar e mais medial que a direita, estende-se ao longo da margem medial do rim esquerdo, atrás da bolsa omental, do estômago e da cauda do pâncreas.',
    funcao:
      'Córtex e medula com funções distintas: o córtex produz aldosterona, cortisol e androgênios; a medula, catecolaminas. A forma em meia-lua a distingue da direita, piramidal — diferença reconhecível na tomografia.',
    vascularizacao:
      'Três artérias, como a direita: suprarrenal superior da frênica inferior, média da aorta e inferior da renal. A veia, porém, é a diferença que decide tudo: a suprarrenal esquerda é longa e desemboca na veia renal esquerda, e não diretamente na cava — o que dá ao cirurgião um pedículo confortável e permite a adrenalectomia esquerda com margem de segurança bem maior.',
    inervacao:
      'Fibras pré-ganglionares simpáticas dos nervos esplâncnicos maior e menor chegam direto à medula, sem sinapse em gânglio — a glândula É um gânglio simpático modificado.',
    linfaticos: 'Linfonodos lombares (para-aórticos) esquerdos.',
    relacoes: 'À frente, a bolsa omental e o estômago; abaixo e à frente, a cauda do pâncreas e os vasos esplênicos.',
    clinica:
      'Na coleta seletiva de veias suprarrenais — o exame que decide se um hiperaldosteronismo é unilateral e cirúrgico —, o lado esquerdo é o fácil: a veia é longa e o cateter entra sem dificuldade pela renal. A dificuldade está sempre à direita. E a vizinhança com a cauda do pâncreas é a razão de a adrenalectomia esquerda poder cursar com fístula pancreática.',
    memoria: 'Esquerda: meia-lua, veia longa, desemboca na renal. É a adrenalectomia tranquila.',
    pontos: [
      'Qual a forma da suprarrenal esquerda e como ela difere da direita?',
      'Em que veia ela drena?',
      'Por que a cateterização venosa seletiva é mais fácil à esquerda?',
    ],
  },
  {
    termos: [
      'Artéria Renal Esquerda',
    ],
    classe: 'arteria',
    resumo: 'Ramo lateral da aorta abdominal para o rim esquerdo, mais curto que o direito.',
    localizacao:
      'Nasce da face lateral esquerda da aorta ao nível de L1–L2, logo abaixo da artéria mesentérica superior, e segue quase horizontalmente até o hilo renal esquerdo.',
    funcao:
      'Conduz cerca de 10% do débito cardíaco ao rim esquerdo. Divide-se em divisão anterior, que dá quatro artérias segmentares, e posterior, que dá uma — cinco territórios sem anastomose entre si.',
    vascularizacao:
      'Vasa vasorum da adventícia. A parede tem uma camada média espessa, e é justamente nela que se instala a displasia fibromuscular, com o aspecto em colar de contas na arteriografia.',
    inervacao:
      'Plexo renal, de fibras simpáticas de T10 a L1 dispostas em torno da adventícia — o alvo da denervação renal por cateter na hipertensão resistente.',
    linfaticos: 'Linfonodos lombares esquerdos, ao longo da aorta.',
    relacoes:
      'É mais curta que a direita, porque a aorta está à esquerda da linha média. Passa atrás da veia renal esquerda e do corpo do pâncreas.',
    clinica:
      'Sua estenose é a causa mais comum de hipertensão renovascular curável. O mecanismo é o eixo renina-angiotensina-aldosterona: o rim isquêmico interpreta a baixa perfusão como hipovolemia e libera renina indefinidamente. O sinal semiológico é o sopro abdominal sistodiastólico, e a pista laboratorial é a piora da função renal ao iniciar um inibidor da ECA.',
    memoria:
      'Artéria renal esquerda é curta porque a aorta está do lado dela. A direita é longa e passa por trás da cava.',
    pontos: [
      'Por que a artéria renal esquerda é mais curta que a direita?',
      'Quantos segmentos arteriais o rim tem?',
      'Como a estenose da artéria renal causa hipertensão?',
    ],
  },
  {
    termos: [
      'Veia Renal Esquerda',
      'Veia Renal',
    ],
    classe: 'veia',
    resumo: 'Veia longa do rim esquerdo, que cruza a linha média por diante da aorta para alcançar a cava inferior.',
    localizacao:
      'Do hilo renal esquerdo à veia cava inferior, passando à frente da aorta e por baixo da artéria mesentérica superior — uma pinça anatômica de duas artérias.',
    funcao:
      'Drena o rim esquerdo e, ao contrário da direita, recebe três tributárias importantes: a veia suprarrenal esquerda, a veia gonadal (testicular ou ovárica) esquerda e uma veia lombar. À direita, essas veias vão direto para a cava.',
    vascularizacao: 'Vasa vasorum finos na adventícia; a parede é delgada, como a de toda veia de grande calibre.',
    inervacao: 'Fibras do plexo renal na adventícia, vasomotoras.',
    linfaticos: 'Linfonodos lombares esquerdos.',
    relacoes:
      'Mede de 6 a 10 cm — cerca de três vezes o comprimento da direita —, e é essa extensão que a torna o alvo preferido na captação de rim para transplante: um pedículo longo é mais fácil de anastomosar no receptor.',
    clinica:
      'A passagem sob a mesentérica superior é uma pinça: quando o ângulo entre ela e a aorta se fecha — em pessoas magras, após perda de peso —, a veia é comprimida e surge a síndrome do quebra-nozes, com hematúria, dor em flanco esquerdo e, no homem, varicocele à esquerda. E é essa mesma anatomia que explica por que a varicocele é quase sempre esquerda: a veia testicular esquerda desemboca em ângulo reto numa veia comprimida, enquanto a direita entra obliquamente na cava, sem obstáculo.',
    memoria:
      'A veia renal esquerda passa espremida entre a aorta e a mesentérica superior. Quebra-nozes à esquerda, varicocele à esquerda, rim doado da esquerda.',
    pontos: [
      'Por que a veia renal esquerda é três vezes mais longa que a direita?',
      'Que tributárias ela recebe que a direita não recebe?',
      'O que é a síndrome do quebra-nozes?',
    ],
  },
  {
    termos: [
      'Ureter Esquerdo',
    ],
    classe: 'viscera',
    resumo: 'Ureter do lado esquerdo, que desce no retroperitônio atrás do mesocolo sigmoide.',
    localizacao:
      'Da pelve renal esquerda à bexiga. Desce sobre o músculo psoas maior, cruza os vasos ilíacos comuns na bifurcação e entra na pelve; no abdome, passa atrás do mesocolo descendente e sigmoide.',
    funcao:
      'Conduz a urina por ondas peristálticas próprias, geradas por células marca-passo na pelve renal — o ureter empurra a urina, não a deixa escorrer.',
    vascularizacao:
      'Segue a regra de que a origem muda ao longo do trajeto: renal em cima, gonadal e aórtica no meio, ilíaca comum e vesical embaixo. E há um detalhe cirúrgico que decorre disso — no abdome os vasos chegam pela face medial, e na pelve, pela lateral. Dissecar do lado errado o desvasculariza.',
    inervacao:
      'Plexos renal, aórtico e hipogástrico, com aferentes de T11 a L2 e S2 a S4. A cólica ureteral irradia do flanco à virilha porque essas fibras convergem, na medula, com as do dermátomo genitofemoral.',
    linfaticos: 'Lombares esquerdos na porção alta, ilíacos comuns e internos na baixa.',
    relacoes:
      'No abdome está atrás do mesocolo sigmoide e do cólon descendente; na pelve, cruza sob a artéria uterina na mulher e sob o ducto deferente no homem.',
    clinica:
      'A vizinhança com o sigmoide é o que faz a cólica ureteral esquerda ser confundida com diverticulite — e o inverso, o que faz a diverticulite ser confundida com cálculo. É também o motivo de a cirurgia de sigmoide ser a que mais lesa ureter: por segurança, o cateterismo ureteral pré-operatório é rotina em ressecções por diverticulite complicada. Na mulher, vale a regra da \'água sob a ponte\': a artéria uterina cruza POR CIMA do ureter a 2 cm do colo, e é ali que a histerectomia o lesa.',
    memoria:
      'À esquerda o ureter mora atrás do sigmoide. Cólica à esquerda parece diverticulite; cirurgia de sigmoide machuca ureter.',
    pontos: [
      'Por que a irrigação do ureter chega pela face medial acima e lateral abaixo?',
      'Que estrutura cruza o ureter na pelve feminina?',
      'Por que a cólica ureteral esquerda simula diverticulite?',
    ],
  },
  {
    termos: [
      'Artéria do Segmento Anterossuperior',
    ],
    classe: 'arteria',
    resumo: 'Segunda artéria segmentar da divisão anterior da artéria renal, para a porção anterossuperior do rim.',
    localizacao:
      'Nasce da divisão anterior da artéria renal, dentro do seio renal, e distribui-se pela face anterior do terço superior do rim.',
    funcao:
      'Irriga um segmento próprio, sem anastomose com os vizinhos. Junto com as demais, forma o mapa de cinco territórios que organiza toda a nefrectomia parcial.',
    vascularizacao: 'Vasa vasorum finos; é uma artéria intrarrenal de calibre médio.',
    inervacao: 'Fibras simpáticas do plexo renal na adventícia.',
    linfaticos: 'Linfáticos do hilo renal, para os linfonodos lombares.',
    relacoes: 'É a maior das segmentares anteriores e irriga a maior parte da face anterior do rim.',
    clinica:
      'Como todas as segmentares, é artéria terminal: sua oclusão embólica — na fibrilação atrial, na endocardite — produz infarto renal segmentar, com dor em flanco de início súbito, hematúria e elevação isolada da desidrogenase láctica. O achado na tomografia é a cunha hipodensa de base periférica, e o diagnóstico costuma demorar porque o quadro imita cólica renal.',
    memoria: 'Cinco artérias, cinco territórios, nenhuma anastomose. Entupiu uma, morreu o segmento inteiro — em cunha.',
    pontos: [
      'De que divisão da artéria renal ela nasce?',
      'Por que a oclusão de uma segmentar infarta todo o segmento?',
      'Que aspecto o infarto renal tem na tomografia?',
    ],
  },
  {
    termos: [
      'Artéria do Segmento Anteroinferior',
    ],
    classe: 'arteria',
    resumo: 'Terceira artéria segmentar da divisão anterior, para a porção anteroinferior do rim.',
    localizacao: 'Da divisão anterior da artéria renal, no seio renal, para a face anterior do terço médio e inferior.',
    funcao:
      'Irriga a face anterior da metade inferior do rim, num território que não se comunica com o do segmento posterior.',
    vascularizacao: 'Vasa vasorum da adventícia.',
    inervacao: 'Plexo renal, fibras simpáticas periarteriais.',
    linfaticos: 'Linfáticos do hilo, para os linfonodos lombares.',
    relacoes:
      'Sua fronteira com o território posterior forma o plano avascular de Brödel, uma linha longitudinal ao longo da margem convexa do rim, um pouco posterior a ela.',
    clinica:
      'O plano de Brödel é o que torna possível a nefrolitotomia percutânea: entrando por ele, a agulha atravessa o parênquima sem cortar artéria segmentar nenhuma. É anatomia arterial convertida em via de acesso — e ignorá-la é a causa de sangramento maciço e de fístula arteriovenosa pós-punção.',
    memoria:
      'Entre o território da frente e o de trás há uma linha sem vaso: o plano de Brödel. É por ela que a agulha entra.',
    pontos: [
      'Que território esta artéria irriga?',
      'O que é o plano avascular de Brödel?',
      'Por que ele importa na nefrolitotomia percutânea?',
    ],
  },
  {
    termos: [
      'Artéria do Segmento Inferior',
    ],
    classe: 'arteria',
    resumo: 'Artéria segmentar para o polo inferior do rim, a mais variável e a de maior importância cirúrgica.',
    localizacao: 'Última ramificação da divisão anterior da artéria renal, dirigindo-se ao polo inferior.',
    funcao:
      'Irriga o polo inferior. Em cerca de um quarto das pessoas existe, além dela, uma artéria polar inferior acessória que nasce diretamente da aorta e cruza a junção ureteropélvica pela frente.',
    vascularizacao: 'Vasa vasorum finos.',
    inervacao: 'Plexo renal, fibras simpáticas periarteriais.',
    linfaticos: 'Linfáticos do hilo, para os lombares.',
    relacoes:
      'É a única segmentar que costuma cruzar a junção ureteropélvica, e a sua variante acessória cruza-a com frequência.',
    clinica:
      'Um vaso polar inferior cruzando a junção ureteropélvica é uma das causas clássicas de hidronefrose congênita — a obstrução não é do ureter, é de fora dele. Por isso a pieloplastia não se limita a reconstruir a junção: ela transpõe a pelve para diante do vaso, e ignorar isso é garantir a recidiva. Ligar essa artéria não é opção: ela é terminal, e o polo inferior infartaria.',
    memoria:
      'Um vaso cruzando a junção ureteropélvica não pode ser cortado nem ignorado — a pelve é que passa para o outro lado dele.',
    pontos: [
      'Que variante arterial cruza a junção ureteropélvica?',
      'Por que ela causa hidronefrose?',
      'Por que essa artéria não pode ser ligada?',
    ],
  },
  {
    termos: [
      'Artéria do Segmento Posterior',
    ],
    classe: 'arteria',
    resumo: 'Única artéria segmentar da divisão posterior da artéria renal, para a face posterior do rim.',
    localizacao:
      'Nasce da divisão posterior da artéria renal e contorna a pelve renal por trás, antes de se distribuir pela face posterior do órgão.',
    funcao:
      'Irriga sozinha a maior parte da face posterior — cerca de um terço da massa renal —, sem anastomose com os quatro territórios anteriores.',
    vascularizacao: 'Vasa vasorum da adventícia.',
    inervacao: 'Plexo renal, fibras simpáticas.',
    linfaticos: 'Linfáticos do hilo, para os lombares.',
    relacoes:
      'Passa por trás da pelve renal, e essa é sua característica definidora: é a única segmentar que faz esse trajeto retropiélico.',
    clinica:
      'É a artéria em maior risco na pieloplastia e na pielolitotomia, justamente por correr atrás da pelve renal: incisar a pelve pela face posterior sem identificá-la produz infarto de um terço do rim. É também ela que define, junto com as anteriores, o plano avascular de Brödel — a fronteira entre os dois territórios.',
    memoria:
      'Uma artéria só para todas as costas do rim, e ela passa por trás da pelve. Incisão cega ali custa um terço do órgão.',
    pontos: [
      'Que fração do rim a divisão posterior irriga?',
      'Qual seu trajeto em relação à pelve renal?',
      'Que risco cirúrgico ela representa?',
    ],
  },
  {
    termos: [
      'Pirâmide Renal',
    ],
    classe: 'viscera',
    resumo: 'Cada um dos cones de tecido medular, com base voltada ao córtex e ápice na papila.',
    localizacao:
      'Entre as colunas renais, com a base na junção corticomedular e o ápice projetando-se num cálice menor. Há de 8 a 18 por rim.',
    funcao:
      'Cada pirâmide é uma unidade funcional completa: contém as alças de Henle, os ductos coletores e os vasos retos que, juntos, criam o gradiente osmótico que concentra a urina. Uma pirâmide mais sua porção de córtex forma um lobo renal — o rim é um órgão multilobado.',
    vascularizacao:
      'Vasos retos, ramos das arteríolas eferentes dos glomérulos justamedulares, que descem em alças paralelas às alças de Henle. É essa disposição em contracorrente que preserva o gradiente — e que deixa a medula funcionando com a menor tensão de oxigênio do corpo.',
    inervacao: 'Plexo renal (T10–L1), com fibras escassas.',
    linfaticos: 'Linfáticos que acompanham os vasos até o hilo.',
    relacoes:
      'As estriações visíveis a olho nu na pirâmide são os ductos coletores e os vasos retos correndo paralelos rumo à papila.',
    clinica:
      'A lobulação fetal, visível como sulcos na superfície do rim do recém-nascido, é o desenho dessas pirâmides — e sua persistência no adulto é variante normal, não cicatriz. Já a nefrocalcinose medular, com calcificações em todas as pirâmides, aponta para acidose tubular renal distal, hiperparatireoidismo ou rim em esponja medular.',
    memoria: 'Uma pirâmide é um lobo do rim. Contar pirâmides é contar lobos — e o rim tem muitos.',
    pontos: [
      'Quantas pirâmides tem um rim?',
      'O que compõe um lobo renal?',
      'Por que a medula trabalha em hipóxia relativa?',
    ],
  },
  {
    termos: [
      'Túnica Mucosa',
    ],
    sistemas: [
      'urinario',
    ],
    classe: 'viscera',
    resumo: 'Revestimento interno da bexiga, de urotélio pregueado sobre uma lâmina própria frouxa.',
    localizacao:
      'Camada mais interna da parede vesical, pregueada em todo o órgão exceto no trígono, onde é lisa e aderida.',
    funcao:
      'É o urotélio — epitélio de transição, exclusivo da via urinária, com células superficiais em guarda-chuva unidas por junções oclusivas e revestidas por uroplaquinas. Essa camada é a barreira mais impermeável do corpo: ela impede que a urina, hipertônica e ácida, se equilibre com o sangue. Sem ela, a bexiga seria um órgão de diálise.',
    vascularizacao:
      'Plexo submucoso denso alimentado pelas artérias vesicais superior e inferior, que se estira e se acomoda conforme a bexiga enche.',
    inervacao:
      'Aferentes de S2–S4 pelos nervos esplâncnicos pélvicos, com terminações que respondem tanto ao estiramento quanto a irritantes químicos. É a mucosa, e não o músculo, que dispara a urgência da cistite.',
    linfaticos: 'Linfonodos ilíacos externos e internos.',
    relacoes: 'Repousa sobre a lâmina própria, e só abaixo dela vem o músculo detrusor — distinção que não é acadêmica.',
    clinica:
      'Toda a estadiação do câncer de bexiga se apoia nessa fronteira. Um tumor restrito à mucosa e à lâmina própria não invade músculo e é tratado por ressecção endoscópica com BCG; um que atravessa para o detrusor é doença muscular-invasiva e exige cistectomia ou quimiorradioterapia. Uma camada de milímetros separa dois tratamentos e dois prognósticos — e é por isso que o laudo precisa dizer se há músculo na peça ressecada.',
    memoria:
      'Mucosa é o forro, detrusor é o motor. Tumor que ficou no forro se raspa; tumor que chegou ao motor tira a bexiga.',
    pontos: [
      'Que epitélio reveste a bexiga e o que o torna impermeável?',
      'Qual a diferença entre túnica mucosa e músculo detrusor?',
      'Por que essa distinção decide o tratamento do câncer de bexiga?',
    ],
  },
  {
    termos: [
      'Óstio do Ureter Esquerdo',
    ],
    classe: 'viscera',
    resumo: 'Abertura do ureter esquerdo na bexiga, no ângulo posterolateral esquerdo do trígono.',
    localizacao: 'Vértice posterolateral esquerdo do trígono vesical, unido ao contralateral pela prega interuretérica.',
    funcao:
      'O ureter atravessa a parede da bexiga obliquamente por 1,5 a 2 cm antes de se abrir — e é essa oblíquidade, e não um esfíncter, que impede o refluxo: quando a bexiga enche, a pressão comprime o túnel intramural e o fecha.',
    vascularizacao:
      'Ramos ureterais das artérias vesicais inferiores. Aqui a artéria chega pela face lateral, ao contrário do ureter abdominal, servido pela face medial.',
    inervacao:
      'Plexo vesical, com aferentes por S2–S4 e T11–L1. É um dos três pontos de estreitamento do ureter e o local mais frequente de impactação do cálculo.',
    linfaticos: 'Linfonodos ilíacos externos e internos.',
    relacoes:
      'Na mulher, está a poucos centímetros do fórnice vaginal lateral; no homem, o ducto deferente cruza por cima dele.',
    clinica:
      'Um túnel intramural curto demais — congênito — abole esse mecanismo antirrefluxo e produz o refluxo vesicoureteral, causa de pielonefrite de repetição e de cicatriz renal na criança. A correção cirúrgica não fecha nada: ela reimplanta o ureter criando um túnel submucoso mais longo, restaurando exatamente a geometria que faltava.',
    memoria:
      'O que impede o refluxo não é uma válvula, é um túnel oblíquo que a própria urina fecha. Túnel curto, refluxo.',
    pontos: [
      'Que mecanismo impede o refluxo vesicoureteral?',
      'Por que este é um ponto de impactação de cálculo?',
      'Como a cirurgia antirrefluxo funciona?',
    ],
  },
  {
    termos: [
      'Prega Interuretérica',
    ],
    classe: 'viscera',
    resumo: 'Crista transversal que une os dois óstios ureterais — a borda superior do trígono e o marco da cistoscopia.',
    localizacao:
      'Na parede posterior da bexiga, entre os dois óstios do ureter, formando o lado superior do triângulo do trígono.',
    funcao:
      'É a saliência produzida pelo músculo interuretérico, um feixe de fibras longitudinais que continua a musculatura dos dois ureteres através da parede vesical. Sua contração traciona os óstios e participa do fechamento antirrefluxo.',
    vascularizacao:
      'Ramos das artérias vesicais inferiores, num plexo submucoso denso — a prega sangra facilmente ao toque do cistoscópio.',
    inervacao: 'Aferentes de S2–S4 abundantes e simpáticas de T11–L2, como todo o trígono.',
    linfaticos: 'Linfonodos ilíacos externos e internos.',
    relacoes: 'Também chamada barra de Mercier; separa o trígono, abaixo, do fundo pregueado da bexiga, acima.',
    clinica:
      'É o reparo mais importante da cistoscopia: encontrar a prega interuretérica é o que orienta a busca dos dois óstios — seguir a crista de uma ponta à outra leva o cistoscopista direto a eles, sem varredura às cegas. É por isso que o cateterismo ureteral retrógrado começa sempre por identificá-la.',
    memoria: 'Achou a barra que liga os dois óstios, achou os dois óstios. É o trilho da cistoscopia.',
    pontos: [
      'Que estrutura muscular produz a prega interuretérica?',
      'Que lado do trígono ela forma?',
      'Por que ela é o reparo central da cistoscopia?',
    ],
  },
  {
    termos: [
      'Utrículo Prostático',
    ],
    classe: 'viscera',
    resumo: 'Pequeno divertículo em fundo cego no centro do colículo seminal — o resquício uterino do homem.',
    localizacao:
      'Abre-se no ápice do colículo seminal, na parede posterior da uretra prostática, com 5 a 6 mm de profundidade, entre os dois óstios dos ductos ejaculatórios.',
    funcao:
      'Não tem função. É o remanescente dos ductos paramesonéfricos (de Müller), que no embrião feminino formam útero, tubas e terço superior da vagina — e que no masculino regridem sob ação do hormônio antimülleriano, deixando apenas este bolso.',
    vascularizacao: 'Ramos prostáticos das artérias vesical inferior e retal média.',
    inervacao: 'Plexo prostático (T11–L2 e S2–S4).',
    linfaticos: 'Linfonodos ilíacos internos.',
    relacoes:
      'Está entre os dois óstios ejaculatórios, no ápice do colículo — a posição que o torna referência da cateterização dos ductos.',
    clinica:
      'Sua dilatação é um cisto de utrículo, que se associa a hipospádia, criptorquidia e a estados intersexuais — a persistência aumentada da estrutura mülleriana denuncia falha na ação do hormônio antimülleriano. Na prática endoscópica, é também a armadilha que faz um cateter \'entrar\' e não progredir: a ponta cai no fundo cego e a falsa via se abre a partir dali.',
    memoria:
      'É o útero que o homem quase teve. Fundo cego no meio do colículo — cateter que entra ali não vai a lugar nenhum.',
    pontos: [
      'De que estrutura embrionária o utrículo prostático deriva?',
      'Onde exatamente ele se abre?',
      'A que condições o cisto de utrículo se associa?',
    ],
  },
  {
    termos: [
      'Seio Uretral',
    ],
    classe: 'viscera',
    resumo: 'Depressão de cada lado do colículo seminal, onde desembocam os ductos prostáticos.',
    localizacao: 'Sulco par na parede posterior da uretra prostática, ladeando o colículo seminal.',
    funcao:
      'Recebe os 15 a 30 ductos prostáticos, que drenam os ácinos da glândula. É por aqui que a secreção prostática — cerca de 30% do volume do ejaculado, alcalina e rica em PSA e em zinco — entra na uretra.',
    vascularizacao: 'Ramos prostáticos das artérias vesical inferior e retal média, com plexo submucoso.',
    inervacao: 'Plexo prostático (T11–L2 e S2–S4), com aferentes densos.',
    linfaticos: 'Linfonodos ilíacos internos e obturatórios.',
    relacoes: 'Fica lateralmente ao colículo, que separa os dois seios na linha média.',
    clinica:
      'É por esses ductos que a bactéria sobe na prostatite bacteriana — e por eles que o refluxo de urina para dentro dos ácinos produz a prostatite crônica não bacteriana, hoje entendida como fenômeno de refluxo intraductal. É também a via pela qual a prostatite ascende ao epidídimo, produzindo a epididimite do homem jovem.',
    memoria: 'Colículo no meio, um seio de cada lado. É pelos seios que a próstata despeja — e por onde a bactéria sobe.',
    pontos: [
      'Que ductos desembocam no seio uretral?',
      'Que fração do ejaculado a próstata contribui?',
      'Como a prostatite se instala por essa via?',
    ],
  },
]
