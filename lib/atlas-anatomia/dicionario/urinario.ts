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
    termos: ['Polo Superior', 'Polo Inferior'],
    classe: 'viscera',
    sistemas: ['urinario'],
    resumo: 'Extremidades superior e inferior do rim, com relações e vulnerabilidades distintas.',
    localizacao: 'O polo superior é mais medial e coberto pela glândula suprarrenal; o inferior é mais lateral e mais próximo da crista ilíaca.',
    funcao: 'O eixo longitudinal do rim é oblíquo, com os polos superiores mais próximos da linha média — o rim "abraça" o psoas.',
    relacoes: 'O polo inferior é o mais acessível à palpação bimanual e à punção percutânea.',
    clinica:
      'Essa obliquidade é usada no diagnóstico do rim em ferradura: nele, os polos inferiores se fundem e o eixo se inverte, com os polos inferiores mais mediais. O istmo fundido fica preso sob a artéria mesentérica inferior, o que impede a ascensão embrionária e explica a posição baixa do rim em ferradura, sua maior exposição a trauma e a estase que favorece cálculos e infecções.',
    memoria:
      'Rim normal: polos de cima mais juntos. Rim em ferradura: polos de baixo colados e presos sob a mesentérica inferior.',
    pontos: [
      'Qual a orientação do eixo renal normal?',
      'O que é o rim em ferradura?',
      'Por que ele não ascende normalmente?',
    ],
  },
  {
    termos: ['Cápsula Fibrosa'],
    classe: 'viscera',
    resumo: 'Membrana fibrosa fina e inelástica que reveste diretamente o parênquima renal.',
    localizacao: 'Aderida à superfície do rim, sob a gordura perirrenal; desprende-se facilmente no rim normal.',
    funcao: 'Contém o parênquima e limita sua expansão; é ricamente inervada e sensível à distensão.',
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
    termos: ['Medula Renal', 'Pirâmide Renal'],
    classe: 'viscera',
    resumo: 'Porção interna do parênquima, organizada em pirâmides cujos ápices são as papilas renais.',
    localizacao: 'Entre o córtex e o seio renal; cada rim tem de 8 a 18 pirâmides, com base voltada para o córtex e ápice para o cálice.',
    funcao:
      'Contém as alças de Henle e os ductos coletores, responsáveis pela concentração da urina. O gradiente osmótico corticomedular, criado pelo mecanismo multiplicador em contracorrente, é o que permite produzir urina mais concentrada que o plasma.',
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
    termos: ['Artéria Renal Direita', 'Artéria Renal Esquerda'],
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
    termos: [
      'Artéria do Segmento Superior',
      'Artéria do Segmento Anterossuperior',
      'Artéria do Segmento Anteroinferior',
      'Artéria do Segmento Inferior',
      'Artéria do Segmento Posterior',
    ],
    classe: 'arteria',
    resumo: 'As cinco artérias segmentares do rim, cada uma irrigando um território independente.',
    localizacao: 'Ramificam-se da artéria renal no seio renal; quatro correm à frente da pelve e apenas a posterior corre atrás.',
    funcao: 'Definem os cinco segmentos renais cirúrgicos, cada um com irrigação exclusiva e sem colaterais.',
    relacoes: 'O ramo posterior é o único que passa atrás da pelve renal — detalhe crítico na pieloplastia.',
    clinica:
      'Essa independência permite a nefrectomia parcial guiada por clampeamento seletivo, que preserva função renal em tumores pequenos — hoje o padrão para lesões até 4 cm. E é o ramo posterior, cruzando por trás da pelve, o que mais frequentemente é lesado nas cirurgias da junção ureteropélvica.',
    memoria:
      'Quatro artérias segmentares na frente da pelve e uma atrás. A de trás é a que o cirurgião corta sem querer.',
    pontos: [
      'Quantos segmentos renais existem?',
      'Qual artéria segmentar corre atrás da pelve renal?',
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
    termos: ['Veia Renal Direita', 'Veia Renal Esquerda', 'Veia Renal'],
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
    termos: ['Glândula Suprarrenal Direita', 'Glândula Suprarrenal Esquerda'],
    classe: 'glandula',
    resumo: 'Glândulas endócrinas sobre os polos superiores dos rins, com córtex e medula de origens distintas.',
    localizacao: 'A direita é piramidal e apoia-se sobre o polo superior direito, atrás da veia cava; a esquerda é semilunar e desce ao longo da margem medial do rim esquerdo.',
    funcao:
      'O córtex, de origem mesodérmica, produz mineralocorticoides (zona glomerulosa), glicocorticoides (fasciculada) e androgênios (reticulada); a medula, de origem da crista neural, é um gânglio simpático modificado que secreta catecolaminas.',
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
    termos: ['Ureter Direito', 'Ureter Esquerdo'],
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
    termos: ['Colo da Bexiga', 'Óstio Interno da Uretra'],
    classe: 'viscera',
    resumo: 'Porção inferior da bexiga que circunda o óstio interno da uretra e forma o esfíncter interno.',
    localizacao: 'Ponto mais fixo e mais inferior da bexiga, apoiado na próstata no homem e no diafragma pélvico na mulher.',
    funcao:
      'Suas fibras musculares lisas circulares formam o esfíncter uretral interno, involuntário, sob controle simpático (T11–L2) — que o contrai na ejaculação, impedindo a ejaculação retrógrada.',
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
    termos: ['Trígono Vesical', 'Prega Interuretérica'],
    classe: 'viscera',
    resumo: 'Área triangular lisa no fundo da bexiga, entre os dois óstios ureterais e o óstio interno da uretra.',
    localizacao: 'Fundo da bexiga; a prega interuretérica une os dois óstios ureterais e é sua borda superior.',
    funcao:
      'Sua mucosa é firmemente aderida à musculatura subjacente e não se pregueia, ao contrário do restante da bexiga. Origina-se do ducto mesonéfrico, e não do seio urogenital como o resto da bexiga.',
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
    termos: ['Óstio do Ureter Direito', 'Óstio do Ureter Esquerdo'],
    classe: 'viscera',
    resumo: 'Aberturas dos ureteres nos ângulos superiores do trígono vesical.',
    localizacao: 'Ângulos posterolaterais do trígono, com trajeto intramural oblíquo de cerca de 1,5 a 2 cm.',
    funcao:
      'O trajeto oblíquo através da parede vesical é um mecanismo valvular: quando a bexiga se enche e se contrai, ela comprime o segmento intramural contra si mesma e o fecha, impedindo o refluxo.',
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
    termos: ['Músculo Detrusor da Bexiga', 'Túnica Mucosa'],
    classe: 'viscera',
    resumo: 'Músculo liso da parede vesical, disposto em três camadas entrelaçadas, e a mucosa que ele sustenta.',
    localizacao: 'Parede da bexiga, com camadas longitudinal externa, circular média e longitudinal interna; a mucosa é de epitélio de transição (urotélio).',
    funcao:
      'O detrusor contrai a bexiga inteira de uma vez na micção, sob comando parassimpático de S2–S4. O urotélio é impermeável à urina e adapta sua espessura à distensão, passando de 6 camadas na bexiga vazia a 2 ou 3 na cheia.',
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
    termos: ['Colículo Seminal', 'Utrículo Prostático', 'Seio Uretral'],
    classe: 'viscera',
    resumo: 'Elevação na crista uretral prostática, com o utrículo no centro e os ductos ejaculatórios nas laterais.',
    localizacao: 'Meio da parede posterior da uretra prostática; os seios prostáticos, de cada lado, recebem os ductos da glândula.',
    funcao:
      'O utrículo prostático é um pequeno divertículo em fundo cego, remanescente dos ductos paramesonéfricos — o homólogo masculino do útero e da vagina. Os ductos ejaculatórios abrem-se de cada lado dele.',
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
    termos: ['Uretra - Parte Esponjosa', 'Parte Esponjosa da Uretra', 'Fossa Navicular'],
    classe: 'viscera',
    resumo: 'Segmento mais longo da uretra masculina, dentro do corpo esponjoso, terminando na fossa navicular.',
    localizacao: 'Do bulbo do pênis ao óstio externo, com cerca de 15 cm; dilata-se no bulbo e novamente na fossa navicular, na glande.',
    funcao: 'Conduz urina e sêmen; recebe os ductos das glândulas bulbouretrais no seu início e das glândulas uretrais em todo o trajeto.',
    relacoes: 'É a única porção envolvida por tecido erétil, o que a mantém pérvia durante a ereção.',
    clinica:
      'A queda em cavaleiro comprime o bulbo contra a sínfise e produz a lesão de uretra anterior, com hematoma perineal em asa de borboleta — quadro distinto da lesão posterior. As estenoses pós-infecciosas e pós-instrumentação também se concentram aqui, e a fossa navicular é o ponto mais estreito da uretra masculina depois do meato, o que limita o calibre das sondas.',
    memoria:
      'Uretra anterior é queda em cavaleiro; uretra posterior é fratura de bacia. Dois mecanismos, dois segmentos.',
    pontos: [
      'Qual a extensão da uretra esponjosa?',
      'Que mecanismo lesa a uretra anterior?',
      'Onde estão os estreitamentos da uretra masculina?',
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
]
