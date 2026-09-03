import type { EntradaDicionario } from './tipos'

/**
 * Esterno, costelas e clavícula.
 *
 * O gradil costal é uma gaiola que precisa ser rígida para proteger e flexível
 * para respirar, e todos os detalhes ósseos daqui existem para resolver esse
 * conflito. Onde há sulco, passou vaso ou nervo; onde há tuberosidade, puxou
 * músculo; onde há cartilagem, foi preciso ceder.
 */
export const TORAX_OSSEO: EntradaDicionario[] = [
  {
    termos: ['Manúbrio do Esterno'],
    classe: 'acidente-osseo',
    resumo: 'Peça superior e mais larga do esterno, que recebe as clavículas e as duas primeiras costelas.',
    localizacao:
      'Parte alta da parede anterior do tórax, entre as duas articulações esternoclaviculares. Sua borda superior é escavada pela incisura jugular; abaixo, encontra o corpo no ângulo esternal.',
    funcao:
      'É a peça de ancoragem do cíngulo do membro superior ao esqueleto axial: a única ligação óssea entre braço e tronco passa pela clavícula e termina aqui. Dá inserção ainda ao esternocleidomastóideo e ao esterno-hióideo.',
    vascularizacao:
      'Ramos perfurantes da artéria torácica interna e do tronco costocervical. Contém medula óssea vermelha ativa mesmo no adulto, o que o torna via de acesso intraósseo de emergência e sítio de biópsia medular quando a crista ilíaca não é acessível.',
    relacoes:
      'Atrás dele estão o arco aórtico e seus ramos, as veias braquiocefálicas, a traqueia e o timo (ou seu resíduo gorduroso). A veia braquiocefálica esquerda cruza a linha média imediatamente por trás.',
    clinica:
      'A punção intraóssea esternal usa o manúbrio porque ele é fino, plano e sempre acessível — mas exige agulha com trava, já que atrás dele estão os grandes vasos. A esternotomia mediana, via de acesso da cirurgia cardíaca, começa na incisura jugular e desce por ele; a lesão da braquiocefálica esquerda na reesternotomia é catástrofe conhecida.',
    memoria:
      'Manúbrio = cabo da espada; corpo = lâmina; xifoide = ponta. O esterno é literalmente um punhal, e o cabo é o que segura os ombros.',
    pontos: [
      'Que ossos e cartilagens se articulam com o manúbrio?',
      'Que estruturas estão imediatamente atrás dele?',
      'Por que ele é usado para acesso intraósseo?',
    ],
  },
  {
    termos: ['Corpo do Esterno'],
    classe: 'acidente-osseo',
    resumo: 'Lâmina alongada do esterno que recebe as cartilagens da 2ª à 7ª costela.',
    localizacao: 'Entre o manúbrio (ângulo esternal) e o processo xifoide, com incisuras costais nas bordas laterais.',
    funcao:
      'Fecha o gradil por diante e transmite a movimentação das costelas verdadeiras. É formado pela fusão de quatro esternébras, e as linhas de fusão ainda são visíveis em jovens.',
    relacoes:
      'Atrás dele estão o mediastino anterior, o pericárdio e o coração. A projeção do coração na parede é, em boa parte, retroesternal — o que explica por que a compressão torácica funciona.',
    clinica:
      'A compressão do corpo do esterno contra a coluna é o que gera débito na reanimação cardiopulmonar; fraturas de esterno em acidentes com cinto de segurança obrigam a procurar contusão miocárdica. A fusão incompleta das esternébras deixa o forame esternal, variante presente em cerca de 5% das pessoas e armadilha na punção esternal — a agulha pode atravessar direto para o pericárdio.',
    memoria:
      'Quatro pedaços que viram um. Se ficou um furinho no meio (forame esternal), punção esternal ali é punção de coração.',
    pontos: [
      'Quantas peças formam o corpo do esterno?',
      'O que está imediatamente atrás dele?',
      'O que é o forame esternal e por que ele é perigoso?',
    ],
  },
  {
    termos: ['Incisura Jugular'],
    classe: 'acidente-osseo',
    resumo: 'Entalhe na borda superior do manúbrio, a fúrcula palpável na base do pescoço.',
    localizacao: 'Linha média da borda superior do manúbrio, entre as duas extremidades esternais das clavículas; corresponde ao disco T2–T3.',
    funcao: 'É o limite anterior da abertura superior do tórax e ponto de referência de superfície da transição cervicotorácica.',
    relacoes: 'Atrás dela passam a traqueia, o arco venoso jugular e, em pessoas com bócio mergulhante, a extensão retroesternal da tireoide.',
    clinica:
      'É onde se palpa a traqueia para avaliar desvio — sinal precioso no pneumotórax hipertensivo, em que a traqueia foge do lado acometido. É também o ponto de partida da esternotomia e a referência superior da traqueostomia. A distensão venosa jugular é medida a partir do ângulo esternal, logo abaixo.',
    memoria:
      'A "covinha" no alto do peito. Coloque o dedo nela e sinta a traqueia: se ela não estiver no meio, algo empurrou o mediastino.',
    pontos: [
      'Que nível vertebral a incisura jugular marca?',
      'Como avaliar desvio de traqueia e o que ele significa?',
      'Que estruturas passam logo atrás dela?',
    ],
  },
  {
    termos: ['Incisura Clavicular'],
    classe: 'acidente-osseo',
    resumo: 'Face articular oval nos cantos superolaterais do manúbrio, para a extremidade esternal da clavícula.',
    localizacao: 'De cada lado da incisura jugular, na borda superolateral do manúbrio.',
    funcao:
      'Forma a articulação esternoclavicular, sinovial em sela com disco articular completo — a única articulação verdadeira entre o membro superior e o esqueleto axial, e a que permite à clavícula girar e elevar-se junto com o braço.',
    relacoes: 'Atrás da articulação estão a veia braquiocefálica, o tronco braquiocefálico à direita e a carótida comum à esquerda.',
    clinica:
      'O disco articular torna essa articulação tão estável que a luxação é rara; quando ocorre, a posterior é emergência, porque comprime traqueia e grandes vasos. Uma fratura de clavícula é muito mais provável que uma luxação esternoclavicular — o osso cede antes da articulação.',
    memoria:
      'Todo o peso do braço chega ao tronco por essa única articulação, do tamanho de uma moeda. Por isso ela tem disco e ligamentos fortíssimos.',
    pontos: [
      'Que tipo de articulação é a esternoclavicular?',
      'Por que a luxação posterior é uma emergência?',
      'Por que a clavícula fratura antes de luxar?',
    ],
  },
  {
    termos: ['Incisura Costal para Primeira Costela'],
    classe: 'acidente-osseo',
    resumo: 'Face na borda lateral do manúbrio que recebe a primeira cartilagem costal por sincondrose.',
    localizacao: 'Imediatamente abaixo da incisura clavicular, na borda lateral do manúbrio.',
    funcao: 'Recebe a cartilagem da 1ª costela numa união cartilagínea imóvel, que faz do conjunto manúbrio–1ª costela um bloco rígido.',
    relacoes: 'Logo atrás, a pleura cervical (cúpula pleural) sobe acima da clavícula, alcançando a raiz do pescoço.',
    clinica:
      'Essa rigidez faz da abertura superior do tórax um anel inelástico, e é ali que se instala a síndrome do desfiladeiro torácico. A cúpula pleural ascendendo acima da clavícula explica o pneumotórax como complicação da punção de veia subclávia e do bloqueio de plexo braquial supraclavicular.',
    memoria: 'A porta de cima do tórax é feita de osso duro e não cede. O que cede é o que passa por ela: nervo, artéria e veia.',
    pontos: [
      'Que tipo de junção existe entre 1ª costela e manúbrio?',
      'Que estruturas atravessam a abertura superior do tórax?',
      'Por que a punção subclávia pode causar pneumotórax?',
    ],
  },
  {
    termos: ['Incisuras Costais'],
    classe: 'acidente-osseo',
    resumo: 'Série de entalhes nas bordas laterais do esterno para as cartilagens costais.',
    localizacao: 'Sete pares, do manúbrio ao xifoide; a 2ª fica exatamente no ângulo esternal, dividida entre manúbrio e corpo.',
    funcao: 'Recebem as cartilagens das costelas verdadeiras (1ª a 7ª), que são as únicas com ligação direta ao esterno.',
    relacoes: 'A artéria torácica interna desce verticalmente por trás, a cerca de um centímetro da borda esternal, cruzando essas incisuras.',
    clinica:
      'A localização da 2ª incisura no ângulo esternal é o que permite contar costelas com confiança na ausculta e na drenagem torácica. A artéria torácica interna, atrás delas, é a artéria de escolha da revascularização do miocárdio, por sua patência de mais de 90% em dez anos.',
    memoria:
      'Costelas 1 a 7 são "verdadeiras" (chegam ao esterno), 8 a 10 são "falsas" (chegam pela cartilagem de cima) e 11 e 12 são flutuantes.',
    pontos: [
      'Quais costelas se articulam diretamente com o esterno?',
      'Onde se encontra a 2ª incisura costal?',
      'Que artéria corre atrás das incisuras e qual sua importância?',
    ],
  },
  {
    termos: ['Face para Articulação com o Corpo do Esterno'],
    classe: 'acidente-osseo',
    resumo: 'Superfície da borda inferior do manúbrio que encontra o corpo do esterno na sínfise manubrioesternal.',
    localizacao: 'Borda inferior do manúbrio, coberta por uma fina camada de cartilagem hialina.',
    funcao: 'Forma a sínfise que produz o ângulo esternal, uma dobradiça que se abre alguns graus na inspiração profunda.',
    relacoes: 'O plano horizontal que passa por ela — o plano transverso do tórax — atravessa o disco T4–T5.',
    clinica:
      'É o plano que separa o mediastino superior do inferior, e por isso organiza toda a descrição de massas mediastinais na tomografia. Com a idade, a sínfise costuma ossificar, e o tórax perde parte da sua complacência.',
    memoria: 'Uma dobradiça que fecha com a idade. Tórax de idoso é mais rígido também por causa dela.',
    pontos: [
      'Que plano anatômico passa pela junção manubrioesternal?',
      'Que divisão mediastinal ele estabelece?',
      'O que acontece com essa sínfise ao longo da vida?',
    ],
  },
  {
    termos: ['Corpo da Costela'],
    classe: 'acidente-osseo',
    resumo: 'Lâmina longa e curva da costela, entre o tubérculo e a extremidade anterior, com o sulco costal na borda inferior.',
    localizacao: 'Da tuberosidade costal até a junção costocondral, com o ângulo da costela pouco além do tubérculo, onde a curvatura muda bruscamente.',
    funcao:
      'Forma a parede da caixa torácica e transmite o movimento respiratório. Sua curva dupla — para trás e para baixo — é o que permite ao gradil aumentar os diâmetros do tórax na inspiração.',
    vascularizacao: 'Artéria intercostal posterior (da aorta) e anterior (da torácica interna), correndo no sulco costal.',
    inervacao: 'Nervo intercostal correspondente, no mesmo sulco, sempre abaixo da artéria e da veia.',
    relacoes:
      'No sulco costal, a ordem de cima para baixo é veia, artéria, nervo — o famoso VAN. A pleura parietal reveste a face interna.',
    clinica:
      'A ordem VAN é a regra que evita hemorragia: a punção e a drenagem torácica são feitas rente à borda superior da costela inferior, longe do feixe. O ângulo da costela é o ponto mais frequente de fratura, por ser a região mais curva e mais exposta. Fraturas de arcos consecutivos em dois pontos produzem tórax instável, com respiração paradoxal.',
    memoria:
      'VAN, de cima para baixo, escondido embaixo da costela. Fure sempre por cima da costela de baixo e o VAN fica intacto.',
    pontos: [
      'Qual a ordem das estruturas no sulco costal?',
      'Onde se insere a agulha na toracocentese e por quê?',
      'O que é tórax instável e como ele se forma?',
    ],
  },
  {
    termos: ['Borda Interna'],
    classe: 'acidente-osseo',
    resumo: 'Margem inferior da costela, escavada pelo sulco costal que aloja o feixe intercostal.',
    localizacao: 'Borda inferior e interna do corpo da costela, mais evidente nas costelas médias.',
    funcao: 'Protege dentro do seu sulco a veia, a artéria e o nervo intercostais, que assim ficam abrigados pelo próprio osso.',
    relacoes: 'Dá inserção ao músculo intercostal íntimo; o feixe corre entre o intercostal íntimo e o interno.',
    clinica:
      'Esse abrigo é uma faca de dois gumes: protege o feixe do trauma externo, mas o expõe à ponta da agulha que raspa a borda inferior. Metade das complicações hemorrágicas de drenagem torácica vem de ignorar isso.',
    memoria: 'A costela tem uma "calha" embaixo. Nunca encoste a agulha na calha.',
    pontos: [
      'Que estruturas o sulco costal protege?',
      'Entre que músculos corre o feixe intercostal?',
      'Qual a implicação prática na drenagem torácica?',
    ],
  },
  {
    termos: ['Borda Externa'],
    classe: 'acidente-osseo',
    resumo: 'Margem superior e externa da costela, romba e livre de sulco.',
    localizacao: 'Borda superior do corpo costal, voltada para cima e para fora.',
    funcao: 'Dá inserção aos músculos intercostais externo e interno; por não conter feixe vasculonervoso, é a margem segura.',
    relacoes: 'Está separada da costela de cima pelo espaço intercostal, onde correm os três planos musculares.',
    clinica:
      'É a referência que torna a toracocentese e a drenagem seguras: a agulha desliza sobre a borda superior da costela inferior do espaço escolhido. O ponto de escolha para drenagem é o 5º espaço intercostal, na linha axilar média, dentro do "triângulo de segurança".',
    memoria: 'Borda de cima é segura, borda de baixo é perigosa. Raspe por cima, sempre.',
    pontos: [
      'Por que a borda superior da costela é a margem segura?',
      'Onde fica o triângulo de segurança para drenagem torácica?',
      'Que músculos se inserem nessa borda?',
    ],
  },
  {
    termos: ['Sulco da Artéria Subclávia'],
    classe: 'acidente-osseo',
    resumo: 'Goteira na face superior da primeira costela, atrás do tubérculo do escaleno anterior, onde repousa a artéria subclávia.',
    localizacao: 'Face superior da 1ª costela, imediatamente posterior ao tubérculo do músculo escaleno anterior.',
    funcao: 'Aloja a artéria subclávia e o tronco inferior do plexo braquial, que passam juntos por trás do escaleno anterior.',
    relacoes:
      'A divisão é didática e vale decorar: veia subclávia à frente do escaleno anterior, artéria e plexo atrás dele. O músculo é o divisor de águas do desfiladeiro.',
    clinica:
      'É a base da manobra de Adson e de toda a síndrome do desfiladeiro torácico neurogênica: a costela cervical ou uma banda fibrosa eleva o tronco inferior do plexo (C8–T1) contra a primeira costela, produzindo parestesia no território ulnar e atrofia da mão. Também é onde se comprime a artéria subclávia contra a costela para conter hemorragia de membro superior.',
    memoria:
      'Escaleno anterior é a parede divisória: veia na frente, artéria e nervo atrás. Toda a síndrome do desfiladeiro é essa geografia.',
    pontos: [
      'O que passa à frente e atrás do escaleno anterior?',
      'Que raízes formam o tronco inferior e o que sua compressão causa?',
      'Como se comprime a subclávia para hemostasia?',
    ],
  },
  {
    termos: ['Sulco da Veia Subclávia'],
    classe: 'acidente-osseo',
    resumo: 'Goteira na face superior da primeira costela, à frente do tubérculo do escaleno anterior, para a veia subclávia.',
    localizacao: 'Face superior da 1ª costela, anterior ao tubérculo do escaleno anterior.',
    funcao: 'Aloja a veia subclávia, que segue daí para se juntar à jugular interna e formar a veia braquiocefálica.',
    relacoes: 'A veia é anterior e inferior à artéria; a cúpula pleural está imediatamente abaixo e atrás.',
    clinica:
      'É a anatomia da punção de veia subclávia: a agulha caminha rente à face inferior da clavícula, apontando para a incisura jugular, mantendo-se num plano superficial para não perfurar a pleura logo abaixo. É também por a veia estar aderida à fáscia que ela não colapsa em choque hipovolêmico — vantagem em emergência, e ao mesmo tempo o motivo do risco de embolia aérea.',
    memoria:
      'Veia na frente, artéria atrás, pleura embaixo. Se você furou e entrou ar no peito, foi porque desceu demais.',
    pontos: [
      'Qual a posição da veia subclávia em relação ao escaleno anterior?',
      'Por que a veia subclávia não colapsa no choque?',
      'Que estrutura corre risco na punção subclávia?',
    ],
  },
  {
    termos: ['Tubérculo do Músculo Escaleno Anterior'],
    classe: 'acidente-osseo',
    resumo: 'Saliência na face superior da primeira costela que separa os sulcos da veia e da artéria subclávias.',
    localizacao: 'No meio da face superior da 1ª costela, entre os dois sulcos.',
    funcao:
      'Recebe a inserção do músculo escaleno anterior, que é elevador da primeira costela na inspiração forçada e, mais importante do ponto de vista topográfico, o divisor entre os compartimentos venoso e arterial da raiz do pescoço.',
    relacoes: 'O nervo frênico desce sobre a face anterior do escaleno anterior, de lateral para medial; o ducto torácico cruza atrás dele à esquerda.',
    clinica:
      'É o reparo que organiza a raiz do pescoço inteira. A escalenotomia — secção do escaleno anterior — é parte do tratamento cirúrgico do desfiladeiro torácico, e é justamente o nervo frênico sobre o músculo que precisa ser preservado.',
    memoria:
      'Um caroço na primeira costela divide o mundo em dois: antes dele, veia; depois dele, artéria e plexo. E sobre o músculo, deitado, o frênico.',
    pontos: [
      'Que músculo se insere nesse tubérculo?',
      'Que nervo desce sobre o escaleno anterior?',
      'Por que ele é referência da raiz do pescoço?',
    ],
  },
  {
    termos: ['Tuberosidade do Músculo Serrátil Anterior'],
    classe: 'acidente-osseo',
    resumo: 'Rugosidade na face externa da segunda costela, marca da inserção do serrátil anterior.',
    localizacao: 'Face externa e superior do corpo da 2ª costela, próxima ao seu meio.',
    funcao:
      'Recebe as digitações do serrátil anterior, o músculo que mantém a escápula aplicada ao tórax e a roda para cima, permitindo elevar o braço acima de 90°.',
    relacoes: 'O nervo torácico longo (C5–C7) desce verticalmente sobre a face externa do serrátil, superficial e desprotegido.',
    clinica:
      'A lesão do nervo torácico longo — em mastectomia com esvaziamento axilar, em trauma ou por carregar mochila pesada — produz escápula alada: pede-se ao paciente que empurre a parede e a escápula salta do tórax. É um dos sinais mais visuais da neurologia periférica, e nasce inteiramente desta inserção.',
    memoria:
      '"Serrátil" porque as digitações parecem dentes de serra na lateral do tórax. Perdeu o nervo, a escápula descola: asa de anjo.',
    pontos: [
      'Que músculo se insere nessa tuberosidade e qual sua ação?',
      'Que nervo o inerva e por onde ele corre?',
      'O que é escápula alada e como testá-la?',
    ],
  },
]
