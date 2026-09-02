import type { EntradaDicionario } from './tipos'

/**
 * Coluna vertebral: detalhes das vértebras, do sacro e das articulações.
 *
 * Toda vértebra é a mesma peça com ênfases diferentes. Se o aluno entende que
 * o corpo carrega peso, o arco protege a medula e os processos são alavancas
 * para músculo e costela, ele deduz a região olhando a peça, em vez de decorar
 * sete listas. É esse raciocínio que as fichas daqui tentam instalar.
 */
export const COLUNA: EntradaDicionario[] = [
  /* ─────────────────── Regiões ─────────────────── */
  {
    termos: ['Coluna Cervical'],
    classe: 'osso',
    resumo: 'Os sete primeiros segmentos da coluna, os mais móveis e os que carregam menos peso.',
    localizacao:
      'Do crânio ao tórax, com lordose fisiológica. Reconhece-se a vértebra cervical típica por três marcas: forame transverso (exclusivo desta região), processo espinhoso bífido e corpo pequeno com processos uncinados nas bordas.',
    funcao:
      'Sustenta e orienta a cabeça no espaço — os olhos e o labirinto dependem dela para varrer o ambiente. A metade superior (C1–C2) responde por quase toda a rotação; a metade inferior faz a flexão, a extensão e a inclinação.',
    vascularizacao: 'Artérias vertebrais, que sobem pelos forames transversos de C6 a C1, e ramos das artérias cervical ascendente e cervical profunda.',
    inervacao: 'Ramos posteriores dos nervos cervicais para as articulações e os músculos; o gânglio cervicotorácico (estrelado) situa-se ao nível de C7–T1.',
    relacoes: 'À frente, faringe, esôfago, laringe, traqueia e tireoide; nos lados, os feixes vasculonervosos do pescoço; atrás, a musculatura da nuca.',
    clinica:
      'É o segmento mais vulnerável em trauma justamente por ser o mais móvel, e é onde a imobilização pré-hospitalar se concentra. As radiografias precisam mostrar até T1 — a transição cervicotorácica é a região de lesões mais frequentemente perdidas. A espondilose cervical, com osteófitos nos processos uncinados, estreita o forame intervertebral e produz radiculopatia com dor irradiada pelo dermátomo correspondente.',
    memoria:
      'Cervical = a única com buraco no processo transverso. Se você vê forame transverso, é cervical, ponto final.',
    pontos: [
      'Quais três marcas identificam uma vértebra cervical típica?',
      'Onde ocorre a maior parte da rotação da cabeça?',
      'Por que a radiografia cervical precisa incluir T1?',
    ],
  },
  {
    termos: ['Coluna Torácica'],
    classe: 'osso',
    resumo: 'Os doze segmentos que se articulam com as costelas e formam a parede posterior do tórax.',
    localizacao:
      'Entre a cervical e a lombar, com cifose fisiológica. Reconhece-se pelas fóveas costais no corpo e no processo transverso e pelo processo espinhoso longo, oblíquo para baixo, que se sobrepõe ao da vértebra seguinte.',
    funcao:
      'Ancorar as costelas e, com elas, proteger o coração e os pulmões. O preço da estabilidade é a mobilidade: as facetas articulares em plano quase frontal permitem rotação, mas quase nenhuma flexão-extensão.',
    vascularizacao: 'Artérias intercostais posteriores, ramos diretos da aorta torácica, com ramos espinhais que entram pelos forames intervertebrais.',
    inervacao: 'Ramos posteriores dos nervos torácicos; a cadeia simpática torácica corre sobre as cabeças das costelas.',
    relacoes: 'À frente estão o mediastino posterior, a aorta descendente, o esôfago e o ducto torácico; lateralmente, os pulmões.',
    clinica:
      'É o segmento mais frequente de fratura osteoporótica por compressão, tipicamente entre T7 e T12, e o de metástase vertebral mais comum, pela drenagem do plexo venoso vertebral. Como o canal medular é estreito e a irrigação da medula torácica média é precária (território da artéria de Adamkiewicz), a compressão medular aqui evolui mais rápido e recupera pior.',
    memoria:
      'Torácica = a vértebra que tem "cova para costela". Espinhoso longo apontando para baixo, como telhas que se sobrepõem.',
    pontos: [
      'Como identificar uma vértebra torácica isolada?',
      'Por que a rotação é o movimento predominante da torácica?',
      'Por que a compressão medular torácica é especialmente grave?',
    ],
  },
  {
    termos: ['Coluna Lombar'],
    classe: 'osso',
    resumo: 'Os cinco segmentos maiores da coluna, feitos para carregar peso e permitir flexão.',
    localizacao:
      'Entre o tórax e o sacro, com lordose fisiológica. Reconhece-se pelo corpo maciço, ausência de forame transverso e de fóveas costais, processo espinhoso curto e retangular e processos articulares em plano sagital.',
    funcao:
      'Suportar a carga axial do tronco. A orientação sagital das facetas libera flexão e extensão e bloqueia a rotação — motivo pelo qual movimentos rotacionais forçados lesam o disco lombar.',
    vascularizacao: 'Artérias lombares, ramos da aorta abdominal.',
    inervacao: 'Ramos posteriores dos nervos lombares; o ramo medial inerva a articulação zigapofisária, alvo da rizotomia por radiofrequência na dor facetária.',
    relacoes: 'À frente, aorta e veia cava inferior; lateralmente, os músculos psoas maiores; dentro do canal, a cauda equina — a medula termina em L1–L2.',
    clinica:
      'É a sede da hérnia de disco mais comum (L4–L5 e L5–S1), e a regra prática é que a hérnia posterolateral comprime a raiz que sai um nível abaixo: hérnia em L4–L5 dá sintomas de L5, com dificuldade de dorsiflexão do hálux. A punção lombar é feita em L3–L4 ou L4–L5 exatamente porque ali só existe cauda equina, e as raízes se afastam da agulha.',
    memoria:
      'Lombar = corpo grande, sem buracos e sem cova. Facetas "de perfil" (sagitais): dobra bem, gira mal.',
    pontos: [
      'Como reconhecer uma vértebra lombar?',
      'Que raiz é comprimida por uma hérnia póstero-lateral L4–L5?',
      'Por que a punção lombar é segura abaixo de L2?',
    ],
  },
  /* ─────────────────── Atlas e áxis ─────────────────── */
  {
    termos: ['Arco Anterior'],
    classe: 'acidente-osseo',
    resumo: 'Arco ósseo curto que fecha o atlas por diante e recebe o dente do áxis na sua face posterior.',
    localizacao: 'Parte anterior do anel do atlas (C1), com o tubérculo anterior no meio da face externa e a fóvea do dente na face interna.',
    funcao:
      'Substitui o corpo vertebral que o atlas não tem: em vez de sustentar peso, ele forma, com o ligamento transverso, o anel dentro do qual o dente do áxis gira. É por isso que o atlas é um anel e não uma vértebra típica.',
    relacoes: 'Atrás dele está o dente do áxis, e atrás do dente, o ligamento transverso e a medula. À frente, os músculos pré-vertebrais e a faringe.',
    clinica:
      'A fratura de Jefferson é a explosão do anel do atlas por carga axial (mergulho em água rasa), quebrando arco anterior e posterior. Curiosamente, ela costuma não lesar a medula — o anel se abre e o canal aumenta —, mas é instável se o ligamento transverso se rompeu, o que se mede pelo afastamento das massas laterais na radiografia transoral.',
    memoria:
      'O atlas não tem corpo: ele emprestou o corpo para o áxis, que o transformou em dente. O arco anterior é o "encosto" onde esse dente gira.',
    pontos: [
      'Por que o atlas não tem corpo vertebral?',
      'O que forma o anel osteoligamentar em torno do dente?',
      'O que é a fratura de Jefferson e quando ela é instável?',
    ],
  },
  {
    termos: ['Arco Posterior'],
    classe: 'acidente-osseo',
    resumo: 'Arco que fecha o atlas por trás, sulcado em cima pela artéria vertebral.',
    localizacao: 'Parte posterior do anel de C1, com o tubérculo posterior no lugar do processo espinhoso, que o atlas não possui.',
    funcao: 'Completa o anel ósseo que protege a medula e dá inserção ao reto posterior menor da cabeça e à membrana atlanto-occipital posterior.',
    relacoes: 'Sua face superior é escavada pelo sulco da artéria vertebral, por onde o vaso corre antes de perfurar a membrana e entrar no forame magno.',
    clinica:
      'A fratura isolada do arco posterior é a mais comum do atlas e costuma ser estável. Uma variante importante é o ponticulus posticus, uma ponte óssea sobre o sulco vertebral, que transforma o sulco em forame e é armadilha na colocação de parafusos em C1 — o cirurgião pensa estar sobre osso sólido e está sobre a artéria.',
    memoria: 'Atlas não tem espinhoso: tem só um tubérculo. E na sua "asa" posterior corre a artéria vertebral, deitada num sulco.',
    pontos: [
      'Que artéria corre no arco posterior do atlas?',
      'Por que o atlas não tem processo espinhoso?',
      'O que é o ponticulus posticus e por que ele importa?',
    ],
  },
  {
    termos: ['Tubérculo Anterior'],
    classe: 'acidente-osseo',
    resumo: 'Pequena saliência mediana na face externa do arco anterior do atlas — e, nas demais cervicais, a ponta anterior do processo transverso.',
    localizacao:
      'No atlas, no meio do arco anterior. Nas cervicais típicas, na extremidade anterior do processo transverso, à frente do forame transverso; o de C6 é especialmente grande e chama-se tubérculo carotídeo.',
    funcao: 'Dá inserção ao ligamento longitudinal anterior e ao longo do pescoço. Nas cervicais típicas, os tubérculos anteriores são vestígios de costela e ancoram os escalenos anteriores e as raízes do plexo.',
    relacoes: 'O tubérculo carotídeo de C6 fica logo atrás da artéria carótida comum, na altura da cartilagem cricóidea.',
    clinica:
      'O tubérculo carotídeo é a referência clássica para comprimir a carótida contra a coluna e para o bloqueio do gânglio estrelado. Nas radiografias, é também o nível onde o esôfago começa e onde a traqueia é mais superficial.',
    memoria:
      'C6 é o nível da cricóide, da carótida palpável e do começo do esôfago. Um tubérculo, três referências.',
    pontos: [
      'Onde fica o tubérculo carotídeo e para que serve?',
      'Que ligamento se insere no tubérculo anterior do atlas?',
      'Qual a origem embriológica dos tubérculos anteriores cervicais?',
    ],
  },
  {
    termos: ['Tubérculo Posterior'],
    classe: 'acidente-osseo',
    resumo: 'Saliência no arco posterior do atlas, que substitui o processo espinhoso — e a ponta posterior do processo transverso nas cervicais típicas.',
    localizacao: 'Linha média posterior do atlas; nas outras cervicais, extremidade posterior do processo transverso, atrás do forame transverso.',
    funcao: 'No atlas, ancora o reto posterior menor da cabeça. Nas cervicais típicas, o tubérculo posterior dá origem aos escalenos médio e posterior e ao elevador da escápula.',
    relacoes: 'No atlas, está imediatamente abaixo da membrana atlanto-occipital posterior; o nervo suboccipital (C1) emerge entre ela e o arco.',
    clinica:
      'O tubérculo posterior do atlas é o reparo palpável mais alto da linha média posterior do pescoço, útil para orientar bloqueios occipitais e infiltrações. A sua ausência de processo espinhoso explica por que, ao contar espinhosos de cima para baixo, o primeiro que você sente é o de C2.',
    memoria:
      'Descendo a nuca com o dedo, o primeiro espinhoso que aparece é C2 — porque C1 só tem tubérculo. E o mais saliente lá embaixo é C7, a vértebra proeminente.',
    pontos: [
      'Que músculos nascem dos tubérculos posteriores cervicais?',
      'Por que o primeiro espinhoso palpável é o de C2?',
      'Que nervo emerge sob o arco posterior do atlas?',
    ],
  },
  {
    termos: ['Sulco da Artéria Vertebral'],
    classe: 'acidente-osseo',
    resumo: 'Goteira na face superior do arco posterior do atlas onde a artéria vertebral se deita antes de entrar no crânio.',
    localizacao: 'Face superior do arco posterior de C1, atrás da massa lateral, no assoalho do trígono suboccipital.',
    funcao:
      'Aloja o terceiro segmento (V3) da artéria vertebral, que sai do forame transverso do atlas, curva-se medialmente sobre o arco e perfura a membrana atlanto-occipital para entrar no forame magno. A curva generosa existe para que a rotação da cabeça não estire nem oclua o vaso.',
    relacoes: 'O nervo suboccipital (C1) corre entre a artéria e o arco; o plexo venoso vertebral acompanha o vaso.',
    clinica:
      'O sulco da artéria vertebral é a região da dissecção da vertebral por rotação cervical brusca — descrita após manipulação quiroprática, mas também após trauma trivial. Em cirurgia de C1, o sulco é a estrutura que o cirurgião deve identificar antes de qualquer parafuso: errar por milímetros é lesar a vertebral.',
    memoria:
      'A vertebral sobe reta pelos forames transversos e, no atlas, faz uma curva deitada num sulco para poder entrar no crânio sem se romper quando você olha por cima do ombro.',
    pontos: [
      'Que segmento da artéria vertebral corre no sulco?',
      'Por que ela faz uma curva ampla ali?',
      'Que risco isso cria em manipulação cervical e em cirurgia?',
    ],
  },
  {
    termos: ['Processo Odontoide (ou Dente do Áxis)'],
    classe: 'acidente-osseo',
    resumo: 'Pivô ósseo que sobe do corpo do áxis e serve de eixo para a rotação da cabeça.',
    localizacao: 'Face superior do corpo de C2, projetando-se para cima dentro do anel do atlas.',
    funcao:
      'É, embriologicamente, o corpo do atlas que se fundiu ao áxis. Funciona como pino de rotação: o atlas e a cabeça giram em torno dele na articulação atlantoaxial mediana, que responde por cerca de metade da rotação cervical total. É mantido no lugar pelo ligamento transverso, atrás, e pelos ligamentos alares, que o prendem aos côndilos occipitais.',
    relacoes: 'À frente articula-se com o arco anterior do atlas; atrás, com o ligamento transverso, e logo além dele está a medula espinal.',
    clinica:
      'A fratura do dente é a fratura cervical mais comum no idoso, muitas vezes por queda da própria altura; o tipo II, na base, é o que mais evolui para pseudartrose por má vascularização. Na artrite reumatoide e na síndrome de Down, a frouxidão do ligamento transverso permite subluxação atlantoaxial — motivo pelo qual esses pacientes exigem cuidado redobrado na intubação e na sedação.',
    memoria:
      'O dente é o corpo do atlas que o áxis "roubou". Ele é o pino do giro da cabeça, e só um ligamento o separa da medula.',
    pontos: [
      'Qual a origem embriológica do dente do áxis?',
      'Que ligamentos o estabilizam?',
      'Por que a subluxação atlantoaxial é temida na artrite reumatoide?',
    ],
  },
  {
    termos: ['Face Articular Anterior do Dente do Áxis'],
    classe: 'acidente-osseo',
    resumo: 'Superfície oval na frente do dente que articula com a fóvea do arco anterior do atlas.',
    localizacao: 'Face anterior do processo odontoide, voltada para o arco anterior de C1.',
    funcao: 'Forma a articulação atlantoaxial mediana anterior, uma sinovial trocoide — o único encaixe ósseo que guia a rotação da cabeça.',
    relacoes: 'Uma pequena cavidade sinovial a separa do arco anterior do atlas.',
    clinica:
      'A distância entre o arco anterior do atlas e o dente é o intervalo atlantodental, medido na radiografia em perfil: acima de 3 mm no adulto (5 mm na criança) indica ruptura do ligamento transverso e instabilidade. É uma medida de dois segundos que muda a conduta inteira no trauma cervical.',
    memoria:
      'Entre o arco do atlas e o dente cabem 3 milímetros no adulto. Mais que isso, o ligamento transverso rompeu.',
    pontos: [
      'Que tipo de articulação sinovial é a atlantoaxial mediana?',
      'O que é o intervalo atlantodental e qual seu valor normal?',
      'O que um intervalo aumentado significa?',
    ],
  },
  {
    termos: ['Face Articular Posterior do Dente do Áxis'],
    classe: 'acidente-osseo',
    resumo: 'Superfície posterior do dente, revestida de cartilagem, onde desliza o ligamento transverso do atlas.',
    localizacao: 'Face posterior do processo odontoide, voltada para o canal vertebral.',
    funcao:
      'Articula-se com a face anterior do ligamento transverso — uma articulação entre osso e ligamento, com bolsa sinovial própria. É esse contato que mantém o dente aplicado ao arco anterior e impede que ele se desloque para trás, contra a medula.',
    relacoes: 'Imediatamente atrás do ligamento transverso está a medula espinal, na sua porção mais estreita e mais alta.',
    clinica:
      'A regra dos terços de Steel explica por que o dente pode se deslocar bastante antes de causar dano: ao nível de C1, o canal comporta um terço de dente, um terço de medula e um terço de espaço livre. Consumido esse espaço, a compressão é abrupta — e potencialmente fatal, porque ali passa a inervação do diafragma.',
    memoria:
      'Regra dos terços: dente, medula e "sobra". A sobra é o que dá tempo — e é o que a artrite reumatoide consome.',
    pontos: [
      'Contra o que a face posterior do dente se articula?',
      'O que é a regra dos terços de Steel?',
      'Por que a compressão nesse nível é potencialmente fatal?',
    ],
  },
  {
    termos: ['Ápice do Dente'],
    classe: 'acidente-osseo',
    resumo: 'Extremidade superior do processo odontoide, onde se fixam os ligamentos alares e o ligamento apical.',
    localizacao: 'Topo do dente do áxis, apontando para o forame magno.',
    funcao:
      'Ancora o ligamento apical do dente, no meio, e os dois ligamentos alares, que partem dos lados do ápice para os côndilos occipitais e são os freios da rotação da cabeça.',
    relacoes: 'Está imediatamente abaixo da transição bulbomedular; a membrana tectória o cobre por trás.',
    clinica:
      'Os ligamentos alares limitam a rotação a cerca de 30° para cada lado; sua ruptura é uma das lesões descritas no trauma em chicote e produz instabilidade rotatória de difícil diagnóstico. Um ossículo terminal não fusionado no ápice (os odontoideum) simula fratura e é causa de instabilidade em crianças.',
    memoria:
      '"Alar" = asa. Duas asas saem da ponta do dente e se prendem ao crânio: são elas que dizem até onde a cabeça pode girar.',
    pontos: [
      'Que ligamentos se fixam no ápice do dente?',
      'Qual a função dos ligamentos alares?',
      'O que é o os odontoideum e por que ele preocupa?',
    ],
  },
  {
    termos: ['Processo Uncinado'],
    classe: 'acidente-osseo',
    resumo: 'Crista em gancho nas bordas laterais do corpo das vértebras cervicais, que forma as articulações uncovertebrais.',
    localizacao: 'Bordas superolaterais dos corpos de C3 a C7, encaixando-se na borda inferior do corpo suprajacente.',
    funcao:
      'Faz do corpo cervical uma sela: os ganchos impedem o deslizamento lateral e guiam a flexão e a extensão. Formam as articulações uncovertebrais (de Luschka), que não existem ao nascer e se desenvolvem por volta dos 10 anos, com o uso.',
    relacoes: 'Estão imediatamente mediais ao forame transverso (artéria vertebral) e anteriores ao forame intervertebral (raiz nervosa).',
    clinica:
      'É a estrutura que mais produz osteófitos na espondilose cervical. Como o gancho fica entre a artéria vertebral e a raiz, o osteófito uncovertebral estreita o forame intervertebral e causa radiculopatia — a causa mais comum de braquialgia no paciente acima de 50 anos, mais frequente até que a hérnia de disco.',
    memoria:
      '"Uncus" = gancho. Ganchos que seguram a vértebra de cima. Com a idade, o gancho cria esporão, e o esporão aperta a raiz.',
    pontos: [
      'Onde se localizam as articulações uncovertebrais?',
      'Que função mecânica os processos uncinados exercem?',
      'Por que eles são a causa mais comum de radiculopatia cervical no idoso?',
    ],
  },
  /* ─────────────────── Elementos da vértebra típica ─────────────────── */
  {
    termos: ['Face Articular Superior'],
    classe: 'acidente-osseo',
    resumo: 'Superfície do processo articular superior que recebe a vértebra de cima na articulação zigapofisária.',
    localizacao: 'Voltada para trás e para cima na região cervical, para trás na torácica, e medialmente na lombar.',
    funcao:
      'A orientação da faceta é o que determina o movimento permitido em cada região — e essa é a ideia mais rentável de toda a coluna: faceta oblíqua (cervical) libera tudo; faceta frontal (torácica) libera rotação; faceta sagital (lombar) libera flexão e trava rotação.',
    relacoes: 'Forma, com a face articular inferior da vértebra suprajacente, a articulação sinovial plana chamada zigapofisária ou facetária.',
    clinica:
      'A artrose facetária é causa comum de lombalgia axial que piora na extensão e melhora na flexão — o oposto da dor discogênica. O tratamento intervencionista é a rizotomia do ramo medial do ramo posterior, que inerva a cápsula. Na cervical, a luxação facetária unilateral produz o achado radiológico de "faceta pousada" e obriga a excluir lesão da vertebral.',
    memoria:
      'A faceta é a fechadura que decide o movimento. Sagital trava rotação; frontal libera rotação. Olhe a faceta e você sabe a região.',
    pontos: [
      'Como a orientação das facetas muda de região para região?',
      'Que movimento cada orientação permite?',
      'Como diferenciar dor facetária de dor discogênica?',
    ],
  },
  {
    termos: ['Face Articular Inferior'],
    classe: 'acidente-osseo',
    resumo: 'Superfície do processo articular inferior que se apoia na vértebra de baixo.',
    localizacao: 'Voltada para baixo e para a frente na cervical, para a frente na torácica e lateralmente na lombar.',
    funcao: 'Completa a articulação zigapofisária. Na lombar, sua orientação lateral cria um verdadeiro encaixe que impede a vértebra de escorregar para a frente.',
    relacoes: 'Entre o processo articular superior e o inferior de uma mesma vértebra lombar está a pars interarticularis, a ponte óssea mais frágil do arco.',
    clinica:
      'A fratura por estresse da pars é a espondilólise, típica de adolescentes que fazem hiperextensão repetida (ginastas, jogadores de vôlei), e aparece na oblíqua como o "colar do cãozinho da Escocês". Quando bilateral, o corpo escorrega para a frente: é a espondilolistese ístmica, causa comum de lombalgia com irradiação em jovens.',
    memoria:
      'Pars interarticularis é o "pescoço do cachorrinho" na radiografia oblíqua. Coleira no pescoço do cachorro = espondilólise.',
    pontos: [
      'O que é a pars interarticularis?',
      'O que diferencia espondilólise de espondilolistese?',
      'Que gesto esportivo predispõe à espondilólise?',
    ],
  },
  {
    termos: ['Incisura Vertebral Superior'],
    classe: 'acidente-osseo',
    resumo: 'Entalhe raso na borda superior do pedículo, que forma o teto do forame intervertebral.',
    localizacao: 'Margem superior do pedículo, atrás do corpo vertebral.',
    funcao: 'Junto com a incisura inferior da vértebra de cima, delimita o forame intervertebral, a janela por onde a raiz nervosa sai do canal.',
    relacoes: 'O forame é limitado à frente pelo disco e pelo corpo, e atrás pela articulação zigapofisária.',
    clinica:
      'Como o forame é delimitado por três estruturas diferentes, a raiz pode ser comprimida por três frentes: disco à frente, faceta atrás e osteófito uncovertebral lateralmente na cervical. Saber qual das três é a responsável muda a cirurgia — e a resposta está na imagem, não na dor.',
    memoria: 'A incisura de cima é rasa, a de baixo é funda. Duas incisuras encaixadas fazem a janela da raiz.',
    pontos: [
      'Que estruturas formam o forame intervertebral?',
      'Que estruturas o limitam à frente e atrás?',
      'Quais as três causas possíveis de estenose foraminal?',
    ],
  },
  {
    termos: ['Incisura Vertebral Inferior'],
    classe: 'acidente-osseo',
    resumo: 'Entalhe profundo na borda inferior do pedículo, que forma o assoalho do forame intervertebral.',
    localizacao: 'Margem inferior do pedículo; é sempre mais profunda que a superior.',
    funcao: 'Sua profundidade explica por que a raiz nervosa ocupa a parte superior do forame, colada ao pedículo da vértebra de cima.',
    relacoes: 'A raiz sai imediatamente abaixo do pedículo da vértebra de mesmo número na região lombar.',
    clinica:
      'Essa posição alta da raiz dentro do forame é o que explica a regra da hérnia de disco lombar: a hérnia póstero-lateral, que fica no ombro inferior do forame, não pega a raiz que está saindo, mas a raiz que vai sair um nível abaixo. Já a hérnia foraminal — mais lateral — comprime a raiz que sai naquele nível.',
    memoria:
      'A raiz sai "colada no teto" do forame. Hérnia comum passa por baixo dela e pega a próxima raiz; hérnia foraminal pega a dela mesma.',
    pontos: [
      'Por que a raiz nervosa ocupa a parte alta do forame?',
      'Que raiz uma hérnia póstero-lateral comprime?',
      'E uma hérnia foraminal?',
    ],
  },
  {
    termos: ['Fóvea Costal Superior'],
    classe: 'acidente-osseo',
    resumo: 'Meia-face articular na borda superior do corpo torácico que recebe a cabeça da costela de mesmo número.',
    localizacao: 'Ângulo posterossuperior do corpo das vértebras torácicas típicas, junto à raiz do pedículo.',
    funcao:
      'Compõe, com a fóvea costal inferior da vértebra de cima, a cavidade que recebe a cabeça da costela. É por isso que a maioria das costelas se articula com duas vértebras: a de mesmo número e a de cima.',
    relacoes: 'O disco intervertebral passa entre as duas meias-faces e recebe a crista da cabeça costal.',
    clinica:
      'Essa dupla articulação é o que dá enorme estabilidade ao gradil e explica por que a luxação costovertebral é rara e sempre indica trauma de altíssima energia. É também o nível onde o simpático torácico corre e é bloqueado.',
    memoria:
      'Meia cova em cima, meia cova embaixo: duas metades formam a cova inteira. A costela pousa sobre duas vértebras e um disco.',
    pontos: [
      'Com quantas vértebras uma costela típica se articula?',
      'O que ocupa o espaço entre as duas meias-faces?',
      'Por que a articulação costovertebral é tão estável?',
    ],
  },
  {
    termos: ['Fóvea Costal Inferior'],
    classe: 'acidente-osseo',
    resumo: 'Meia-face articular na borda inferior do corpo torácico, que recebe a cabeça da costela seguinte.',
    localizacao: 'Ângulo posteroinferior do corpo das vértebras torácicas típicas.',
    funcao: 'Completa, com a fóvea superior da vértebra de baixo, a cavidade da cabeça costal seguinte.',
    relacoes: 'Fica imediatamente acima do disco intervertebral.',
    clinica:
      'A regra prática que decorre daí é a de contagem: a cabeça da costela de número N articula-se com a vértebra N (fóvea superior) e com a vértebra N–1 (fóvea inferior). Contar costelas na tomografia é o modo mais confiável de numerar vértebras torácicas, o que importa antes de qualquer cirurgia de nível.',
    memoria:
      'Costela N encosta na vértebra N e na de cima. Se você sabe contar costela, sabe contar vértebra.',
    pontos: [
      'Qual a regra de numeração entre costela e vértebra?',
      'Quais costelas fogem à regra (1ª, 10ª, 11ª e 12ª)?',
      'Por que essa contagem importa em cirurgia?',
    ],
  },
  {
    termos: ['Fóvea Costal do Processo Transverso'],
    classe: 'acidente-osseo',
    resumo: 'Face articular na ponta do processo transverso torácico, para o tubérculo da costela.',
    localizacao: 'Face anterior da extremidade do processo transverso das vértebras T1 a T10.',
    funcao:
      'Forma a articulação costotransversária, que é o eixo em torno do qual a costela roda na respiração. A orientação dessa faceta muda no sentido craniocaudal, e é o que explica os dois movimentos costais clássicos.',
    relacoes: 'É reforçada pelos ligamentos costotransversários; T11 e T12 não têm essa faceta, e por isso suas costelas são flutuantes e móveis.',
    clinica:
      'É a base mecânica dos movimentos de "alça de balde" (costelas inferiores, aumentando o diâmetro transverso) e de "braço de bomba" (costelas superiores, aumentando o diâmetro anteroposterior). Entender isso é entender a mecânica da inspiração e o motivo de o tórax em barril do enfisematoso ser tão ineficiente.',
    memoria:
      'Cabeça da costela encosta no corpo; tubérculo encosta no transverso. Dois pontos de apoio formam um eixo — e um eixo permite girar.',
    pontos: [
      'Que parte da costela se articula com o processo transverso?',
      'Que vértebras não têm fóvea costal transversária?',
      'Explique alça de balde e braço de bomba.',
    ],
  },
  {
    termos: ['Processo Transverso sem Fóvea Costal'],
    classe: 'acidente-osseo',
    resumo: 'Processo transverso das últimas torácicas, que não recebe tubérculo costal.',
    localizacao: 'Vértebras T11 e T12, cujos processos transversos são curtos e sem face articular.',
    funcao: 'A ausência da articulação costotransversária libera as costelas 11 e 12, que ficam flutuantes e móveis, sem se ligar ao esterno nem ao processo transverso.',
    relacoes: 'Essas vértebras também têm processos mamilares e acessórios, marcando a transição para o padrão lombar.',
    clinica:
      'A mobilidade das costelas flutuantes explica a síndrome da costela deslizante, dor em pontada no rebordo costal que reproduz à manobra do gancho. É também por serem móveis que as costelas 11 e 12 fraturam menos, mas quando fraturam alertam para lesão renal ou esplênica logo abaixo.',
    memoria:
      'Últimas torácicas já "pensam" como lombares: transverso curto, sem cova, costela solta.',
    pontos: [
      'Por que as costelas 11 e 12 são flutuantes?',
      'Que outras marcas indicam transição toracolombar?',
      'Que órgãos ficam sob as costelas inferiores?',
    ],
  },
  {
    termos: ['Fóvea Costal Única do Corpo Vertebral'],
    classe: 'acidente-osseo',
    resumo: 'Face costal completa em um só corpo vertebral, típica das vértebras atípicas T1, T10, T11 e T12.',
    localizacao: 'Corpo de T1 (que tem uma fóvea inteira para a 1ª costela e meia para a 2ª) e de T10 a T12.',
    funcao: 'Recebe sozinha a cabeça da costela, que passa a se articular com uma única vértebra em vez de duas.',
    relacoes: 'Nessas vértebras, a articulação costovertebral fica inteiramente acima do disco.',
    clinica:
      'É a marca que permite reconhecer uma vértebra torácica atípica numa peça isolada e, na prática, ajuda a orientar-se em tomografias sem contagem completa. A costela de T1, articulada só a ela, é também a que se relaciona com o plexo braquial e a artéria subclávia — relevante na síndrome do desfiladeiro torácico.',
    memoria:
      'T1 e as três últimas fogem à regra: cova inteira, uma costela para cada vértebra. Só as do meio dividem.',
    pontos: [
      'Quais vértebras torácicas são atípicas quanto às fóveas costais?',
      'Como reconhecer T1 numa peça isolada?',
      'Que estruturas cruzam a primeira costela?',
    ],
  },
  {
    termos: ['Corpo Vertebral Volumoso'],
    classe: 'acidente-osseo',
    resumo: 'Corpo alto e largo em rim, característico das vértebras lombares.',
    localizacao: 'Segmento lombar, onde o corpo é o maior de toda a coluna, aumentando progressivamente de L1 a L5.',
    funcao:
      'Suportar a carga axial acumulada de todo o tronco. O aumento progressivo é a resposta óssea a uma carga que cresce de cima para baixo — a forma seguindo a função, na mais literal das ilustrações.',
    relacoes: 'À frente, a aorta e a veia cava inferior; nas laterais, os psoas; atrás, o canal com a cauda equina.',
    clinica:
      'É onde o osso trabecular predomina, e por isso é o primeiro a mostrar osteoporose: a fratura por compressão do corpo lombar ou toracolombar é a fratura osteoporótica mais comum. A densitometria mede justamente L1–L4 por essa razão.',
    memoria:
      'De cima para baixo, os corpos crescem porque o peso cresce. L5 é o maior porque carrega tudo.',
    pontos: [
      'Por que os corpos vertebrais aumentam de cima para baixo?',
      'Que tipo de osso predomina no corpo vertebral?',
      'Por que a densitometria mede a coluna lombar?',
    ],
  },
  {
    termos: ['Processo Mamilar'],
    classe: 'acidente-osseo',
    resumo: 'Tubérculo arredondado na face posterior do processo articular superior lombar.',
    localizacao: 'Borda posterolateral do processo articular superior das vértebras lombares.',
    funcao: 'Dá inserção aos músculos multífidos e intertransversários mediais, parte da musculatura profunda que estabiliza segmento a segmento.',
    relacoes: 'Junto com o processo acessório, delimita o sulco por onde corre o ramo medial do ramo posterior do nervo espinal.',
    clinica:
      'É o marco radiológico da rizotomia facetária: o alvo da agulha é a junção mamilo-acessória, onde o ramo medial cruza o osso. Sem esse reparo, a denervação por radiofrequência não tem alvo.',
    memoria:
      'Dois tubérculos vizinhos — mamilar e acessório — formam um túnel. Dentro do túnel corre o nervo que dói na artrose facetária.',
    pontos: [
      'Onde fica o processo mamilar?',
      'Que músculos se inserem nele?',
      'Qual sua importância na rizotomia facetária?',
    ],
  },
  {
    termos: ['Processo Acessório'],
    classe: 'acidente-osseo',
    resumo: 'Pequena espícula na base do processo costal lombar, vestígio do processo transverso verdadeiro.',
    localizacao: 'Face posteroinferior da raiz do processo costal (o "transverso" lombar), medialmente a ele.',
    funcao:
      'Dá inserção ao longuíssimo e aos intertransversários mediais. Sua existência revela o que o processo costal realmente é: uma costela rudimentar fundida, e não um processo transverso.',
    relacoes: 'Forma, com o processo mamilar, o sulco mamilo-acessório do ramo medial.',
    clinica:
      'Compreender que o "processo transverso lombar" é na verdade um processo costal explica a costela lombar supranumerária e a lombarização/sacralização — variantes que confundem a contagem de níveis e já levaram a cirurgias no nível errado. Antes de operar coluna, conta-se a partir de C2 ou das costelas.',
    memoria:
      'O que você chama de transverso lombar é costela. O transverso de verdade sobrou como o processo acessório, pequenininho atrás.',
    pontos: [
      'Qual a origem embriológica do processo costal lombar?',
      'Que estrutura o processo acessório representa?',
      'Por que variantes de transição causam erro de nível cirúrgico?',
    ],
  },
  {
    termos: ['Processo Costal'],
    classe: 'acidente-osseo',
    resumo: 'Projeção lateral da vértebra lombar, homóloga a uma costela e não a um processo transverso.',
    localizacao: 'Sai lateralmente da junção do pedículo com a lâmina; é longo e achatado, sendo o maior em L3.',
    funcao: 'Serve de alavanca para o quadrado do lombo, os intertransversários e a fáscia toracolombar, e ancora o psoas por arcadas tendíneas.',
    relacoes: 'Sua face anterior está em contato com o psoas maior e, à direita, com o rim; a ponta de L3 é a mais lateral.',
    clinica:
      'A fratura isolada do processo costal indica trauma de flanco e obriga a excluir lesão renal. É também referência do bloqueio do plexo lombar e do bloqueio do quadrado lombar, técnicas de analgesia abdominal cada vez mais usadas.',
    memoria:
      'Lombar não tem costela porque a costela virou o processo costal. E ela é longa em L3, que é a mais "larga" das lombares.',
    pontos: [
      'Que músculos se inserem no processo costal?',
      'Que órgão está imediatamente anterior a ele à direita?',
      'O que sugere uma fratura isolada de processo costal?',
    ],
  },
  /* ─────────────────── Sacro ─────────────────── */
  {
    termos: ['Base do Sacro'],
    classe: 'acidente-osseo',
    resumo: 'Face superior larga do sacro, que se articula com L5 e cuja borda anterior é o promontório.',
    localizacao: 'Topo do sacro, formada pela face superior do corpo da primeira vértebra sacral, com as asas de cada lado.',
    funcao: 'Recebe a carga de toda a coluna e a distribui para os dois ilíacos pelas articulações sacroilíacas — o ponto em que a coluna deixa de ser uma torre e passa a ser um arco.',
    relacoes: 'À frente está a bifurcação da aorta, o plexo hipogástrico superior e o reto; atrás, o canal sacral.',
    clinica:
      'O ângulo entre a base do sacro e a horizontal — o ângulo de incidência pélvica — é o parâmetro que rege todo o alinhamento sagital da coluna e é medido antes de qualquer artrodese lombar. E o promontório, sua borda anterior, é referência da conjugata vera obstétrica e do acesso laparoscópico à promontofixação.',
    memoria:
      'Onde a coluna termina e a bacia começa. O peso desce reto e, aqui, se abre em dois — para os quadris.',
    pontos: [
      'Como a carga é transferida do sacro para os ilíacos?',
      'O que é o promontório e qual sua importância obstétrica?',
      'O que é a incidência pélvica?',
    ],
  },
  {
    termos: ['Asa do Sacro'],
    classe: 'acidente-osseo',
    resumo: 'Superfície triangular lateral à base do sacro, formada pela fusão dos processos costais sacrais.',
    localizacao: 'De cada lado do corpo de S1, entre o promontório e a face auricular.',
    funcao: 'Amplia a superfície de apoio da base e dá passagem, sobre ela, ao tronco lombossacral (L4–L5) que desce para o plexo sacral, e ao músculo psoas.',
    relacoes: 'O tronco lombossacral corre sobre a asa, entre ela e o psoas, e a artéria ilíaca comum a cruza.',
    clinica:
      'Essa passagem justa é o que torna a asa do sacro um ponto de compressão do tronco lombossacral no trabalho de parto prolongado, produzindo pé caído pós-parto. As fraturas da asa (zona I de Denis) costumam poupar as raízes; as que atravessam os forames (zona II) as lesam.',
    memoria:
      'Sobre a asa do sacro passa a "ponte" que liga o plexo lombar ao sacral. Ponte apertada por cabeça fetal = pé caído.',
    pontos: [
      'O que corre sobre a asa do sacro?',
      'Qual a origem embriológica da asa?',
      'Como as zonas de Denis relacionam fratura sacral e lesão nervosa?',
    ],
  },
  {
    termos: ['Ápice Sacral'],
    classe: 'acidente-osseo',
    resumo: 'Extremidade inferior e estreita do sacro, que se articula com o cóccix.',
    localizacao: 'Ponta inferior do osso, na linha média, voltada para baixo e para a frente.',
    funcao: 'Articula-se com a base do cóccix pela sínfise sacrococcígea, uma articulação fibrocartilagínea com alguma mobilidade.',
    relacoes: 'À frente está o reto; a mobilidade sacrococcígea aumenta durante o parto, permitindo aumento do diâmetro anteroposterior da saída pélvica.',
    clinica:
      'É essa mobilidade que faz a retropulsão do cóccix ser possível no período expulsivo — e sua limitação, por fratura antiga ou anquilose, dificultar o parto. A coccidínia pós-traumática localiza-se exatamente nessa junção e se avalia pelo toque retal.',
    memoria: 'O sacro termina numa ponta que "dá espaço" no parto: o cóccix se dobra para trás e a saída pélvica aumenta.',
    pontos: [
      'Que articulação existe entre ápice sacral e cóccix?',
      'Qual seu papel no período expulsivo do parto?',
      'Como se examina a coccidínia?',
    ],
  },
  {
    termos: ['Face Anterior (Pélvica)'],
    classe: 'acidente-osseo',
    resumo: 'Face côncava e lisa do sacro, voltada para a cavidade pélvica, marcada pelas linhas transversas.',
    localizacao: 'Superfície anterior do sacro, olhando para dentro da pelve.',
    funcao: 'Sua concavidade forma a parede posterior do canal do parto e aumenta o volume da cavidade pélvica.',
    relacoes: 'Apoia o reto, o plexo hipogástrico inferior e, mais acima, as artérias sacrais; os músculos piriformes nascem entre os forames.',
    clinica:
      'A curvatura sacral define, com a sínfise, a curva de Carus, o trajeto em J que o feto percorre e que explica os movimentos cardinais do parto. Um sacro retificado estreita o canal e é achado relevante na pelvimetria.',
    memoria: 'Face pélvica = a "calha" onde o bebê desliza. Quanto mais côncava, mais espaço.',
    pontos: [
      'Que músculo nasce entre os forames sacrais anteriores?',
      'O que é a curva de Carus?',
      'Que estrutura nervosa autônoma repousa sobre a face pélvica?',
    ],
  },
  {
    termos: ['Face Posterior'],
    classe: 'acidente-osseo',
    resumo: 'Face convexa e rugosa do sacro, coberta de cristas resultantes da fusão dos elementos vertebrais.',
    localizacao: 'Superfície dorsal do sacro, palpável sob a pele na região sacral.',
    funcao:
      'Dá inserção aos músculos eretores da espinha, ao glúteo máximo e aos ligamentos sacrotuberal e sacroilíacos posteriores. Suas cristas são a memória do que era arco vertebral: mediana (espinhosos), intermédia (articulares) e lateral (transversos).',
    relacoes: 'É perfurada pelos forames sacrais posteriores, por onde saem os ramos posteriores dos nervos sacrais.',
    clinica:
      'É a área do sacro que sofre úlcera por pressão em pacientes acamados, porque o osso é subcutâneo e a pele ali recebe pouca perfusão sob compressão. As fossetas sacrais visíveis na pele correspondem às espinhas ilíacas posterossuperiores e são referência para a punção da articulação sacroilíaca.',
    memoria:
      'Três cristas na face de trás = três processos que se fundiram. Mediana é o espinhoso, intermédia é a faceta, lateral é o transverso.',
    pontos: [
      'A que corresponde cada crista sacral?',
      'O que sai pelos forames sacrais posteriores?',
      'Por que o sacro é sítio preferencial de úlcera de pressão?',
    ],
  },
  {
    termos: ['Linhas Transversas'],
    classe: 'acidente-osseo',
    resumo: 'Quatro linhas horizontais na face pélvica do sacro, marcas da fusão entre os corpos vertebrais sacrais.',
    localizacao: 'Face anterior do sacro, cruzando-o entre os pares de forames sacrais anteriores.',
    funcao: 'São a cicatriz dos discos intervertebrais sacrais ossificados — a prova visível de que o sacro é o resultado da fusão de cinco vértebras, completada por volta dos 25 anos.',
    relacoes: 'Cada linha termina lateralmente num par de forames sacrais anteriores.',
    clinica:
      'A fusão incompleta em adultos jovens é achado normal e não deve ser confundida com fratura na tomografia. Nas fraturas sacrais transversas, as linhas ajudam a localizar o nível e a prever quais raízes estão em risco — abaixo de S2, o risco maior é para a função vesical e esfincteriana.',
    memoria: 'Quatro linhas = quatro discos que viraram osso. Sacro é uma coluna de cinco vértebras soldadas.',
    pontos: [
      'O que as linhas transversas representam?',
      'Quantas vértebras formam o sacro e quando a fusão termina?',
      'Que funções se perdem em lesões abaixo de S2?',
    ],
  },
  {
    termos: ['Forames Sacrais Anteriores Pélvicos'],
    classe: 'passagem-ossea',
    resumo: 'Quatro pares de aberturas na face pélvica do sacro para os ramos anteriores dos nervos sacrais.',
    localizacao: 'Nas extremidades das linhas transversas, de S1 a S4, na face anterior do sacro.',
    funcao: 'Dão passagem aos ramos anteriores de S1 a S4, que se juntam ao tronco lombossacral para formar o plexo sacral, e às artérias sacrais laterais.',
    relacoes: 'O piriforme nasce entre eles; o plexo sacral repousa sobre esse músculo.',
    clinica:
      'São a via do bloqueio sacral transforaminal, usado na dor radicular S1. Uma fratura sacral que os atravessa (zona II de Denis) lesa raízes e produz dor radicular; se for medial a eles (zona III), compromete o canal e a função esfincteriana.',
    memoria:
      'Quatro pares de janelas na frente para o nervo sair e formar o plexo sacral. É por elas que nasce o isquiático.',
    pontos: [
      'Que raízes saem pelos forames sacrais anteriores?',
      'Que músculo nasce entre eles?',
      'O que diferencia as zonas de fratura sacral de Denis?',
    ],
  },
  {
    termos: ['Forames Sacrais Posteriores'],
    classe: 'passagem-ossea',
    resumo: 'Quatro pares de aberturas menores na face dorsal do sacro, para os ramos posteriores dos nervos sacrais.',
    localizacao: 'Entre as cristas sacrais intermédia e lateral, de S1 a S4.',
    funcao: 'Dão passagem aos ramos posteriores dos nervos sacrais, que inervam a pele da região sacral e glútea medial e os músculos profundos do dorso.',
    relacoes: 'São menores que os anteriores, refletindo o menor calibre dos ramos posteriores.',
    clinica:
      'Correspondem aos "pontos de bloqueio" dos ramos posteriores sacrais no tratamento da dor da articulação sacroilíaca. O território que eles inervam explica a dor referida em nádega na sacroileíte.',
    memoria: 'Janelas menores atrás porque o ramo posterior é sempre menor que o anterior. Vale para toda a coluna.',
    pontos: [
      'Que nervos saem pelos forames sacrais posteriores?',
      'Por que eles são menores que os anteriores?',
      'Que padrão de dor referida sua inervação explica?',
    ],
  },
  {
    termos: ['Canal Sacral'],
    classe: 'passagem-ossea',
    resumo: 'Continuação do canal vertebral dentro do sacro, que abriga a cauda equina terminal e o filamento terminal.',
    localizacao: 'Percorre o sacro de cima a baixo, triangular, terminando no hiato sacral.',
    funcao:
      'Aloja as raízes sacrais e coccígeas, o saco dural (que termina em S2 no adulto) e, abaixo dele, gordura epidural e o filamento terminal, que ancora a medula ao cóccix.',
    relacoes: 'Comunica-se lateralmente com os forames sacrais; termina no hiato, entre os cornos sacrais.',
    clinica:
      'É a via da anestesia caudal, muito usada em cirurgia pediátrica: a agulha entra pelo hiato e deposita anestésico no espaço epidural sacral. Como o saco dural desce mais na criança (até S3), o risco de punção acidental da dura é maior nela do que no adulto — a anatomia dita a técnica e a idade dita o risco.',
    memoria:
      'Canal sacral é o "porão" do canal vertebral. No adulto, a dura para em S2; na criança, desce mais — e por isso a agulha entra com mais cuidado.',
    pontos: [
      'Onde termina o saco dural no adulto e na criança?',
      'O que é o filamento terminal?',
      'Como se realiza a anestesia caudal?',
    ],
  },
  {
    termos: ['Crista Sacral Mediana'],
    classe: 'acidente-osseo',
    resumo: 'Crista central e mais alta da face posterior do sacro, formada pela fusão dos processos espinhosos.',
    localizacao: 'Linha média dorsal do sacro, com três ou quatro tubérculos, terminando acima do hiato sacral.',
    funcao: 'Dá inserção aos ligamentos supraespinal e ao eretor da espinha; é a continuação direta da fileira de espinhosos da coluna.',
    relacoes: 'Termina inferiormente nos cornos sacrais, que ladeiam o hiato.',
    clinica:
      'É a referência palpável para localizar o hiato sacral na anestesia caudal: o dedo desce a crista mediana até encontrar a depressão entre os dois cornos. É também a estrutura removida na laminectomia sacral.',
    memoria: 'Três ou quatro caroços na linha do meio da nádega alta = espinhosos fundidos. Siga-os até o buraco.',
    pontos: [
      'A que a crista sacral mediana corresponde?',
      'Como localizar o hiato sacral por palpação?',
      'Que ligamento se insere nela?',
    ],
  },
  {
    termos: ['Crista Sacral Intermédia'],
    classe: 'acidente-osseo',
    resumo: 'Fileira de tubérculos entre os forames posteriores e a crista mediana, formada pelos processos articulares fundidos.',
    localizacao: 'De cada lado da crista mediana, medialmente aos forames sacrais posteriores.',
    funcao: 'Representa a fusão dos processos articulares sacrais; seu tubérculo inferior forma o corno sacral.',
    relacoes: 'Marca, lateralmente, a borda do que seria a lâmina vertebral sacral.',
    clinica:
      'É a referência de entrada para a fixação com parafusos ilíacos e S2-alar-ilíacos em artrodeses longas, e ajuda a orientar o bloqueio dos ramos posteriores sacrais.',
    memoria: 'Do meio para fora: mediana (espinhoso), intermédia (faceta), lateral (transverso). Sempre nessa ordem.',
    pontos: [
      'A que processos a crista intermédia corresponde?',
      'Que estrutura ela forma na extremidade inferior?',
      'Onde ela se situa em relação aos forames posteriores?',
    ],
  },
  {
    termos: ['Crista Sacral Lateral'],
    classe: 'acidente-osseo',
    resumo: 'Série de tubérculos lateralmente aos forames sacrais posteriores, resultante da fusão dos processos transversos.',
    localizacao: 'Borda lateral da face posterior do sacro, lateralmente aos forames posteriores.',
    funcao: 'Dá inserção aos ligamentos sacroilíacos posteriores e ao ligamento sacrotuberal, que estabilizam a articulação sacroilíaca contra a nutação.',
    relacoes: 'Acima, continua-se com a tuberosidade sacral e a face auricular.',
    clinica:
      'Os ligamentos que aqui se inserem são os verdadeiros responsáveis pela estabilidade da sacroilíaca — o osso quase não trava nada. Por isso, na fratura pélvica, o que define instabilidade vertical não é o traço ósseo, e sim a integridade do complexo ligamentar posterior.',
    memoria: 'A estabilidade da bacia não é osso: é ligamento posterior. E ele se prende na crista lateral.',
    pontos: [
      'Que ligamentos se inserem na crista sacral lateral?',
      'O que dá estabilidade real à articulação sacroilíaca?',
      'Como isso define instabilidade em fratura pélvica?',
    ],
  },
  {
    termos: ['Corno Sacral'],
    classe: 'acidente-osseo',
    resumo: 'Par de projeções que ladeiam o hiato sacral, restos dos processos articulares inferiores de S5.',
    localizacao: 'Extremidade inferior das cristas sacrais intermédias, de cada lado do hiato.',
    funcao: 'Delimitam o hiato sacral e articulam-se com os cornos do cóccix.',
    relacoes: 'O ligamento sacrococcígeo posterior fecha o hiato entre eles.',
    clinica:
      'São o reparo tátil decisivo da anestesia caudal: os dois cornos formam um V invertido palpável, e a agulha entra entre eles, atravessando o ligamento sacrococcígeo com um estalido característico. Sem localizar os cornos, o índice de falha do bloqueio sobe muito.',
    memoria: 'Dois "chifrinhos" com um vale no meio. O vale é a porta; os chifres são a placa da porta.',
    pontos: [
      'Que estruturas os cornos sacrais representam?',
      'Como eles orientam a anestesia caudal?',
      'O que fecha o hiato sacral em vida?',
    ],
  },
  {
    termos: ['Tuberosidade Sacral'],
    classe: 'acidente-osseo',
    resumo: 'Área rugosa atrás da face auricular, onde se fixam os potentes ligamentos sacroilíacos interósseos.',
    localizacao: 'Face lateral do sacro, posterior e superior à face auricular.',
    funcao: 'Ancora os ligamentos sacroilíacos interósseos, os mais fortes do corpo, que suspendem o sacro entre os dois ilíacos como uma ponte pênsil.',
    relacoes: 'Encaixa-se na tuberosidade ilíaca correspondente.',
    clinica:
      'A metáfora da ponte pênsil não é retórica: o peso do tronco tende a empurrar o sacro para baixo e para a frente, e são esses ligamentos, e não uma superfície articular, que o seguram. Sua frouxidão pela relaxina na gravidez é o que explica a dor sacroilíaca da gestante.',
    memoria:
      'O sacro está pendurado, não apoiado. Quem o segura é o ligamento interósseo, preso na tuberosidade.',
    pontos: [
      'Que ligamentos se fixam na tuberosidade sacral?',
      'Como o sacro é sustentado entre os ilíacos?',
      'Por que a gestante tem dor sacroilíaca?',
    ],
  },
  {
    termos: ['Face Auricular'],
    classe: 'acidente-osseo',
    resumo: 'Superfície em forma de orelha na face lateral do sacro, que articula com o ilíaco.',
    localizacao: 'Face lateral do sacro, ao nível de S1 a S3, voltada para trás e para fora.',
    funcao:
      'Forma a metade sacral da articulação sacroilíaca, uma sinovial plana com superfícies irregulares e interdigitadas — desenhada para transmitir carga, não para se mover.',
    relacoes: 'Encontra a face auricular do ilíaco; atrás dela está a tuberosidade sacral com os ligamentos interósseos.',
    clinica:
      'Sua morfologia muda de modo previsível com a idade, e por isso a face auricular é um dos melhores estimadores de idade em antropologia forense. Clinicamente, é o alvo da infiltração sacroilíaca guiada por imagem na sacroileíte das espondiloartrites, em que a alteração dessa articulação é o achado radiográfico mais precoce.',
    memoria: 'Tem forma de orelha, daí o nome. Uma orelha de cada lado, onde a coluna "escuta" a bacia.',
    pontos: [
      'Que tipo de articulação é a sacroilíaca?',
      'Por que a face auricular é usada em estimativa de idade?',
      'Que doença tem na sacroileíte seu achado mais precoce?',
    ],
  },
  {
    termos: ['Processo Articular Superior (1º vértebra sacral)'],
    classe: 'acidente-osseo',
    resumo: 'Par de processos na base do sacro que recebem os processos articulares inferiores de L5.',
    localizacao: 'Nas bordas posterolaterais da base do sacro, voltados para trás e para dentro.',
    funcao: 'Formam a articulação zigapofisária L5–S1, que é o último freio ósseo contra o deslizamento anterior de L5 sobre o sacro.',
    relacoes: 'A raiz de L5 sai acima deles, pelo forame L5–S1, e a raiz de S1 desce medialmente.',
    clinica:
      'A displasia desses processos é a causa da espondilolistese displásica em crianças, em que L5 escorrega sem que exista fratura da pars. É também nesse nível que ocorre a maioria das espondilolisteses degenerativas do idoso, com estenose de recesso lateral e claudicação neurogênica.',
    memoria:
      'É o último "batente" da coluna. Batente malformado ou gasto e L5 escorrega para dentro da bacia.',
    pontos: [
      'Que articulação esses processos formam?',
      'Que raízes correm perto deles?',
      'Como se diferencia espondilolistese displásica de ístmica?',
    ],
  },
  /* ─────────────────── Articulações da coluna e do gradil ─────────────────── */
  {
    termos: ['Articulação dos Corpos Vertebrais'],
    classe: 'articulacao',
    resumo: 'Sínfise entre dois corpos vertebrais adjacentes, mediada pelo disco intervertebral.',
    localizacao: 'Entre as faces superior e inferior de corpos vizinhos, de C2 ao sacro, reforçada pelos ligamentos longitudinais anterior e posterior.',
    funcao:
      'É uma articulação cartilagínea secundária: pouco movimento em cada nível, muito movimento na soma dos 23 discos. O disco funciona como amortecedor hidráulico — o núcleo pulposo redistribui pressão em todas as direções, e o ânulo fibroso a contém.',
    vascularizacao: 'O disco adulto é avascular: nutre-se por difusão através das placas terminais, o que explica sua capacidade de reparo quase nula.',
    inervacao: 'Terço externo do ânulo pelo nervo sinuvertebral (de Luschka), ramo do ramo anterior com contribuição simpática — é a base anatômica da dor discogênica.',
    relacoes: 'O ligamento longitudinal posterior é estreito na região lombar, o que deixa desprotegida justamente a região póstero-lateral.',
    clinica:
      'É essa fraqueza póstero-lateral que decide para onde o disco hernia — e, portanto, qual raiz é comprimida. A avascularidade explica por que a degeneração discal não regride, e por que a espondilodiscite hematogênica começa na placa terminal, onde ainda há vasos, especialmente na criança.',
    memoria:
      'Disco é uma almofada de água presa por um anel. O anel é frouxo atrás e de lado — e é para lá que a almofada vaza.',
    pontos: [
      'Como o disco intervertebral se nutre?',
      'Por que a hérnia é tipicamente póstero-lateral?',
      'Que nervo inerva o ânulo fibroso?',
    ],
  },
  {
    termos: ['Articulação dos Processos Articulares'],
    classe: 'articulacao',
    resumo: 'Articulação sinovial plana entre as facetas de vértebras vizinhas — a zigapofisária.',
    localizacao: 'Entre o processo articular inferior de uma vértebra e o superior da vértebra de baixo, com cápsula própria e líquido sinovial.',
    funcao:
      'Guia a direção do movimento e divide a carga com o disco: em pé, cerca de 20% do peso passa pelas facetas; na extensão, essa fração aumenta muito. É a articulação que decide o que a coluna pode fazer em cada região.',
    inervacao: 'Ramo medial do ramo posterior, que inerva duas articulações consecutivas — por isso a denervação exige tratar dois níveis.',
    relacoes: 'Sua cápsula forma a parede posterior do forame intervertebral; um cisto sinovial facetário pode comprimir a raiz.',
    clinica:
      'A artrose facetária dá dor lombar que piora em pé e na extensão, com irradiação até a coxa mas não abaixo do joelho — o padrão que a distingue da radicular. A hipertrofia facetária é a principal responsável pela estenose de canal do idoso e pela claudicação neurogênica, aquela que melhora ao inclinar o tronco para a frente (o "sinal do carrinho de supermercado").',
    memoria:
      'A faceta é uma articulação sinovial como o joelho: tem cartilagem, cápsula e artrose. E artrose de faceta dói na extensão, alivia na flexão.',
    pontos: [
      'Que nervo inerva a articulação zigapofisária?',
      'Como diferenciar dor facetária de dor radicular?',
      'Por que o estenótico melhora inclinando-se para a frente?',
    ],
  },
  {
    termos: ['Articulação Costovertebral'],
    classe: 'articulacao',
    resumo: 'Articulação sinovial entre a cabeça da costela e os corpos de duas vértebras torácicas.',
    localizacao: 'Entre a cabeça costal, com sua crista, e as fóveas costais superior e inferior de duas vértebras vizinhas mais o disco entre elas.',
    funcao:
      'Um dos dois pontos de apoio do eixo de rotação costal. O ligamento radiado, em leque, e o intra-articular, que fixa a crista ao disco, dão-lhe estabilidade quase absoluta.',
    relacoes: 'A cadeia simpática torácica corre imediatamente sobre a cabeça das costelas; os vasos intercostais correm logo acima.',
    clinica:
      'Sua rigidez é por que o trauma torácico fratura costela em vez de luxar a articulação. Na espondilite anquilosante, a fusão dessas articulações reduz a expansibilidade torácica — parâmetro medido com fita métrica e critério diagnóstico da doença.',
    memoria: 'Cabeça da costela pousa sobre duas vértebras e o disco entre elas: é um tripé, e tripé não balança.',
    pontos: [
      'Com quantas superfícies a cabeça costal se articula?',
      'Que estrutura nervosa cruza essa articulação?',
      'Por que a expansibilidade torácica é medida na espondilite anquilosante?',
    ],
  },
  {
    termos: ['Articulação Costotransversária'],
    classe: 'articulacao',
    resumo: 'Articulação sinovial entre o tubérculo da costela e o processo transverso da vértebra de mesmo número.',
    localizacao: 'Entre a faceta do tubérculo costal e a fóvea costal do processo transverso, de T1 a T10.',
    funcao:
      'Fecha o eixo de rotação da costela, junto com a costovertebral. A mudança de orientação da faceta ao longo do tórax — mais plana em cima, mais curva embaixo — é o que muda o movimento de braço de bomba para alça de balde.',
    relacoes: 'Reforçada pelos ligamentos costotransversário superior, lateral e o interósseo.',
    clinica:
      'A disfunção dessas articulações é causa reconhecida de dorsalgia mecânica que se reproduz à respiração profunda. Em cirurgia, elas são liberadas na costotransversectomia para acessar o corpo vertebral torácico por via posterolateral, sem abrir o tórax.',
    memoria:
      'Dois pontos fazem uma linha, e a linha é o eixo do giro. Costovertebral atrás, costotransversária de lado: a costela roda entre as duas.',
    pontos: [
      'Que costelas possuem articulação costotransversária?',
      'Como a orientação da faceta muda o tipo de movimento costal?',
      'Que via cirúrgica utiliza a liberação dessas articulações?',
    ],
  },
  {
    termos: ['Articulações Esternocostais'],
    classe: 'articulacao',
    resumo: 'Articulações entre as cartilagens costais e as incisuras do esterno.',
    localizacao: 'Da 1ª à 7ª cartilagem costal, nas bordas laterais do manúbrio, do corpo e do processo xifoide.',
    funcao:
      'Transmitem ao esterno o movimento das costelas. A primeira é uma sincondrose — a cartilagem funde-se ao manúbrio, sem cavidade —, e as demais são sinoviais.',
    relacoes: 'A artéria torácica interna desce atrás delas, a cerca de 1 cm da borda do esterno.',
    clinica:
      'A costocondrite (síndrome de Tietze quando há tumefação) é causa muito comum de dor torácica que simula angina e se caracteriza por dor reproduzível à palpação — um dado de exame físico que resolve o diagnóstico em segundos. A proximidade da torácica interna importa na punção esternal e na dissecção da mamária interna para revascularização coronária.',
    memoria:
      'Dor no peito que dói quando você aperta com o dedo raramente é coração. Costocondrite é diagnóstico de palpação.',
    pontos: [
      'Quais articulações esternocostais são sinoviais?',
      'Que artéria corre atrás delas?',
      'Como diferenciar costocondrite de dor coronariana no exame físico?',
    ],
  },
  {
    termos: ['Articulação Costocondral'],
    classe: 'articulacao',
    resumo: 'União fibrocartilagínea entre a extremidade anterior da costela óssea e sua cartilagem costal.',
    localizacao: 'Na extremidade anterior de cada costela, onde o osso se continua na cartilagem hialina.',
    funcao: 'É uma sincondrose sem cavidade nem movimento: o periósteo continua-se diretamente com o pericôndrio, e por isso não há deslocamento entre as duas partes.',
    relacoes: 'Forma, com as demais, a linha costocondral, palpável como uma fileira de saliências na parede anterior do tórax.',
    clinica:
      'É a sede do rosário raquítico na criança com deficiência de vitamina D — alargamento das junções costocondrais palpável como contas. No adulto, é a linha em que costuma se localizar a dor da costocondrite.',
    memoria: 'Osso vira cartilagem sem articulação nenhuma no meio. Em criança com raquitismo, essa emenda incha e vira "rosário".',
    pontos: [
      'Que tipo de junção é a costocondral?',
      'O que é o rosário raquítico?',
      'Por que não há movimento nessa junção?',
    ],
  },
  {
    termos: ['Articulação Manubrioesternal'],
    classe: 'articulacao',
    resumo: 'Sínfise entre o manúbrio e o corpo do esterno, que forma o ângulo esternal.',
    localizacao: 'Na parede anterior do tórax, palpável como uma crista transversal a cerca de 5 cm abaixo da incisura jugular.',
    funcao: 'Permite pequeno movimento em dobradiça durante a inspiração profunda; ossifica-se com a idade em boa parte das pessoas.',
    relacoes:
      'O ângulo esternal (de Louis) é o reparo mais rentável do tórax: marca o nível da 2ª cartilagem costal, o disco T4–T5, o início e o fim do arco aórtico, a bifurcação da traqueia, o limite entre mediastino superior e inferior e o nível em que a veia ázigo desemboca.',
    clinica:
      'Contar costelas começa aqui: acha-se o ângulo esternal, encontra-se a 2ª costela e desce-se dali. Sem esse ponto, qualquer ausculta ou punção torácica é feita por estimativa.',
    memoria:
      'Ângulo de Louis: 2ª costela, T4–T5, carina, arco da aorta, ázigo. Uma crista no peito e cinco respostas de prova.',
    pontos: [
      'Que estruturas o ângulo esternal marca?',
      'Como se conta costelas a partir dele?',
      'Que tipo de articulação é a manubrioesternal?',
    ],
  },
  {
    termos: ['Articulação Xifoesternal'],
    classe: 'articulacao',
    resumo: 'Sínfise entre o corpo do esterno e o processo xifoide, que ossifica por volta dos 40 anos.',
    localizacao: 'Extremidade inferior do corpo do esterno, no ápice do ângulo infraesternal.',
    funcao: 'Une o xifoide ao corpo; é ponto de inserção do diafragma, do reto do abdome e da linha alba.',
    relacoes: 'Marca o limite superior do fígado e o nível aproximado de T9.',
    clinica:
      'É a referência de posicionamento das mãos na compressão torácica da reanimação — dois dedos acima do processo xifoide —, precaução que existe justamente para não fraturar o xifoide e lacerar o fígado. É também o ponto de punção no acesso pericárdico subxifoide.',
    memoria: 'Ponta do esterno: acima dela se comprime, abaixo dela está o fígado. Errar o ponto é lacerar fígado.',
    pontos: [
      'Que estruturas se inserem no processo xifoide?',
      'Por que a compressão torácica evita o xifoide?',
      'Que nível vertebral ele marca?',
    ],
  },
  {
    termos: ['Sincondrose da Primeira Costela'],
    classe: 'articulacao',
    resumo: 'União cartilagínea imóvel entre a primeira cartilagem costal e o manúbrio.',
    localizacao: 'Entre a cartilagem da 1ª costela e a incisura costal correspondente do manúbrio.',
    funcao:
      'Ao contrário das demais esternocostais, não tem cavidade sinovial: é uma sincondrose, praticamente imóvel. Essa rigidez faz da primeira costela uma peça de sustentação, e não de respiração.',
    relacoes: 'Sobre a primeira costela cruzam a artéria e a veia subclávias e o plexo braquial; abaixo dela passa a pleura cervical.',
    clinica:
      'A rigidez explica por que a fratura da primeira costela exige energia altíssima e é marcador de trauma grave, com alta associação a lesão de grandes vasos e do plexo braquial. Já a sua relação com o feixe vasculonervoso é a base da síndrome do desfiladeiro torácico e das ressecções da primeira costela.',
    memoria:
      'A primeira costela é curta, grossa e soldada: ela não respira, ela sustenta. Se ela quebrou, o trauma foi muito grande.',
    pontos: [
      'Por que a sincondrose da 1ª costela é imóvel?',
      'O que uma fratura de 1ª costela indica?',
      'Que estruturas cruzam a primeira costela?',
    ],
  },
  /* ─────────────────── Plurais do acervo ─────────────────── */
  {
    termos: ['Corpos Vertebrais'],
    classe: 'acidente-osseo',
    resumo: 'A coluna de blocos ósseos que sustenta o peso do corpo, empilhados e separados por discos.',
    localizacao: 'Porção anterior de cada vértebra, formando a coluna anterior; crescem em tamanho de cima para baixo.',
    funcao:
      'Sustentar carga axial. Cada corpo é uma caixa de osso cortical fino preenchida por osso trabecular orientado nas linhas de força, com placas terminais cartilagíneas em cima e embaixo, por onde o disco se nutre.',
    vascularizacao: 'Artérias segmentares (intercostais e lombares) por ramos nutrícios posteriores; drenam para o plexo venoso vertebral interno, sem válvulas.',
    relacoes: 'À frente e atrás, os ligamentos longitudinais; atrás, o canal vertebral e a medula.',
    clinica:
      'A ausência de válvulas no plexo venoso vertebral (de Batson) é a explicação anatômica de por que próstata, mama, pulmão, rim e tireoide metastatizam preferencialmente para a coluna: a manobra de Valsalva reverte o fluxo e leva células tumorais direto para lá, sem passar pelo pulmão. É o achado que transforma uma dor lombar noturna em bandeira vermelha.',
    memoria:
      'Plexo de Batson: veias sem válvula ligando pelve, tórax e coluna. Tossiu, o sangue volta — e leva o que estiver nele.',
    pontos: [
      'Como o corpo vertebral se nutre e como nutre o disco?',
      'O que é o plexo venoso de Batson e por que ele importa?',
      'Que tumores metastatizam preferencialmente para a coluna?',
    ],
  },
  {
    termos: ['Processos Espinhosos'],
    classe: 'acidente-osseo',
    resumo: 'Projeções posteriores medianas das vértebras, palpáveis sob a pele em toda a coluna.',
    localizacao:
      'Da união das duas lâminas, apontando para trás. Bífidos e curtos na cervical, longos e oblíquos na torácica, retangulares e horizontais na lombar.',
    funcao: 'Alavancas para os músculos e ligamentos do dorso: quanto mais longo, maior o braço de momento para a extensão do tronco.',
    relacoes: 'Ligados entre si pelos ligamentos supraespinal e interespinais; na cervical, pelo ligamento nucal.',
    clinica:
      'São a régua da coluna à beira do leito: C7 é a vértebra proeminente, T3 corresponde à espinha da escápula, T7 ao ângulo inferior da escápula e L4 à linha que une as cristas ilíacas — referência da punção lombar. A fratura isolada do espinhoso de C7 por tração muscular é a "fratura do escavador de argila".',
    memoria:
      'Linha entre as cristas ilíacas = L4. Ângulo inferior da escápula = T7. Duas réguas que você carrega no paciente.',
    pontos: [
      'Como o formato do espinhoso muda em cada região?',
      'Que reparos de superfície correspondem a T3, T7 e L4?',
      'Que ligamentos unem os espinhosos?',
    ],
  },
  {
    termos: ['Processos Transversos'],
    classe: 'acidente-osseo',
    resumo: 'Projeções laterais do arco vertebral, alavancas para os músculos rotadores e para as costelas.',
    localizacao: 'Da junção do pedículo com a lâmina, projetando-se lateralmente em cada vértebra.',
    funcao:
      'Alavanca lateral para os músculos que rodam e inclinam o tronco, e ponto de apoio das costelas no tórax. Na cervical, contêm o forame transverso; na lombar, o que se chama transverso é na verdade costal.',
    relacoes:
      'Cervical: artéria vertebral dentro do forame transverso. Torácica: articulação com o tubérculo costal. Lombar: psoas e quadrado do lombo.',
    clinica:
      'O bloqueio do plano do eretor da espinha, hoje muito usado em analgesia torácica e abdominal, deposita anestésico exatamente sobre a ponta do processo transverso. E a fratura do processo transverso lombar, embora estável, é marcador de trauma de flanco e obriga a investigar rim e baço.',
    memoria:
      'Um mesmo nome para três coisas diferentes: buraco na cervical, cova para costela na torácica, costela disfarçada na lombar.',
    pontos: [
      'O que diferencia o processo transverso em cada região?',
      'Que estrutura vascular a cervical carrega?',
      'O que sugere uma fratura de transverso lombar?',
    ],
  },
]
