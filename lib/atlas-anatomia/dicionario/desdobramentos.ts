import type { EntradaDicionario } from './tipos'

/**
 * Desdobramentos: estruturas que dividiam uma ficha e agora têm a sua.
 *
 * O dicionário antigo agrupava famílias inteiras num único verbete — os quatro
 * ventres do quadríceps, os cinco extensores do antebraço, os quatro lobos do
 * cérebro, as três peças do osso do quadril. Funcionava como resumo e falhava
 * como ensino: o aluno tocava em "Músculo Vasto Medial" e lia um texto sobre o
 * quadríceps, sem nada que fosse daquele ventre. Cada entrada aqui devolve a um
 * desses nomes o que só vale para ele — a inserção que o distingue, o nervo que
 * o move, o sinal clínico que o denuncia.
 *
 * Este arquivo vem antes dos demais no `index`, de propósito: no casamento
 * exato vence a primeira entrada encontrada, e a ficha específica precisa vencer
 * a ficha de família que ainda cita o mesmo título.
 */
export const DESDOBRAMENTOS: EntradaDicionario[] = [
  /* ─────────────────── Crânio ─────────────────── */
  {
    termos: ['Sutura Coronal'],
    classe: 'sutura',
    resumo: 'Sutura transversal entre o osso frontal e os dois parietais.',
    localizacao: 'Cruza o topo do crânio de lado a lado, do ptério de um lado ao do outro, encontrando a sutura sagital no bregma.',
    funcao: 'Permite o crescimento anteroposterior do crânio; fecha-se por volta dos 24 anos.',
    relacoes: 'Suas extremidades laterais participam do ptério.',
    clinica:
      'Sua fusão precoce bilateral produz braquicefalia — crânio curto e largo, característico das síndromes de Apert e de Crouzon; unilateral, produz plagiocefalia anterior, com o "sinal do olho de arlequim" na radiografia, em que a órbita do lado fundido aparece alongada para cima.',
    memoria: 'Coronal atravessa o crânio como uma coroa, de orelha a orelha. Fundida, a cabeça fica curta e larga.',
    pontos: [
      'Que ossos a sutura coronal une?',
      'Que deformidade sua fusão bilateral produz?',
      'O que é o sinal do olho de arlequim?',
    ],
  },
  {
    termos: ['Sutura Sagital'],
    classe: 'sutura',
    resumo: 'Sutura mediana entre os dois ossos parietais, do bregma ao lambda.',
    localizacao: 'Linha média do topo do crânio, sob o sulco do seio sagital superior.',
    funcao: 'Permite o crescimento transversal do crânio; é a última das grandes suturas a se fechar.',
    relacoes: 'Os forames parietais abrem-se junto a ela, perto do lambda.',
    clinica:
      'É a sutura mais frequentemente acometida na craniossinostose isolada: sua fusão precoce produz escafocefalia, com crânio longo, estreito e uma crista palpável na linha média. É também a referência da linha média nas trepanações e o local onde uma punção acidental atinge o seio sagital superior.',
    memoria: 'Sagital é a costura do meio. Fechou cedo, a cabeça cresce só para a frente e para trás: vira um barco.',
    pontos: [
      'Que ossos a sutura sagital une?',
      'Que deformidade sua fusão precoce produz?',
      'Que estrutura venosa corre sob ela?',
    ],
  },
  {
    termos: ['Sutura Lambdóidea', 'Sutura Lambdoidea'],
    classe: 'sutura',
    resumo: 'Sutura em forma de lambda entre o occipital e os dois parietais.',
    localizacao: 'Parte posterior do crânio, encontrando a sagital no lambda.',
    funcao: 'Permite o crescimento posterior da abóbada; frequentemente contém ossos suturais (wormianos).',
    relacoes: 'Sob ela, no seu terço lateral, corre o seio transverso.',
    clinica:
      'A sinostose lambdóidea isolada é rara e produz plagiocefalia posterior verdadeira, com orelha deslocada posteriormente do lado fundido — o oposto da plagiocefalia posicional, muito mais comum, em que a orelha se desloca anteriormente. Ossos wormianos numerosos apontam para osteogênese imperfeita e cleidocraniodisplasia.',
    memoria: 'Orelha deslocada para trás é sinostose; para a frente é posicional. A orelha diz o diagnóstico.',
    pontos: [
      'Que ossos a sutura lambdóidea une?',
      'Como diferenciar plagiocefalia posicional de sinostótica?',
      'O que são ossos wormianos?',
    ],
  },
  {
    termos: ['Sutura Escamosa'],
    classe: 'sutura',
    resumo: 'Sutura em bisel entre a escama do temporal e o parietal.',
    localizacao: 'Face lateral do crânio, arqueando-se sobre a orelha; a borda do temporal sobrepõe-se à do parietal como telhas.',
    funcao: 'Sua sobreposição em bisel — e não em serrilha — permite algum deslizamento e distribui impactos laterais.',
    relacoes: 'A artéria meníngea média corre imediatamente por dentro dela.',
    clinica:
      'Essa disposição em telha é o que faz uma fratura da escama do temporal "descolar" a sutura e romper a meníngea média com relativa facilidade — a fratura diastática, uma das formas do hematoma extradural. Diferente das outras suturas, sua descontinuidade em criança não deve ser confundida com fratura.',
    memoria: 'As outras suturas se encaixam como quebra-cabeça; a escamosa se sobrepõe como telhado. Telha desliza.',
    pontos: [
      'Que ossos a sutura escamosa une?',
      'O que a diferencia das demais suturas?',
      'Que artéria corre imediatamente sob ela?',
    ],
  },
  {
    termos: ['Asa Maior do Esfenoide'],
    classe: 'acidente-osseo',
    resumo: 'Lâmina do esfenoide que forma o assoalho da fossa craniana média e parte da parede lateral da órbita.',
    localizacao: 'Estende-se do corpo do esfenoide lateralmente até o ptério, com faces cerebral, orbital, temporal e infratemporal.',
    funcao: 'Sustenta o lobo temporal e é atravessada pelos forames redondo, oval e espinhoso, na sequência anteroposterior.',
    relacoes: 'Sua face orbital forma a parede lateral da órbita, e a fissura orbital superior a separa da asa menor.',
    clinica:
      'A sequência de forames é a mais cobrada da base do crânio: redondo (V2), oval (V3) e espinhoso (artéria meníngea média), de dentro para fora e da frente para trás. O meningioma de asa esfenoidal, um dos mais comuns, produz proptose lentamente progressiva e hiperostose óssea visível na tomografia — massa que empurra o olho para fora sem alterar a visão até tarde.',
    memoria: 'Redondo, Oval, eSpinhoso — R.O.S., da frente para trás. V2, V3 e a artéria que sangra no extradural.',
    pontos: [
      'Que forames atravessam a asa maior do esfenoide?',
      'Que fossa craniana ela forma?',
      'Que tumor típico nasce nessa região?',
    ],
  },
  {
    termos: ['Asa Menor do Esfenoide'],
    classe: 'acidente-osseo',
    resumo: 'Lâmina triangular superior do esfenoide, que separa a fossa craniana anterior da média.',
    localizacao: 'Projeta-se lateralmente do corpo do esfenoide, com o canal óptico na sua raiz e o processo clinoide anterior na sua ponta medial.',
    funcao: 'Sua borda posterior livre é a crista esfenoidal, que marca o limite entre as fossas anterior e média e sustenta o lobo frontal.',
    relacoes: 'A fissura orbital superior está entre a asa menor e a maior, transmitindo os pares III, IV, V1 e VI e a veia oftálmica superior.',
    clinica:
      'A síndrome da fissura orbital superior — oftalmoplegia completa com anestesia da fronte e ptose, sem perda visual — é o quadro de uma lesão que ocupa esse espaço. Quando se acrescenta perda visual, a lesão invadiu o canal óptico, na raiz da asa menor, e passa a chamar-se síndrome do ápice orbitário. Um sintoma a mais desloca a topografia em poucos milímetros.',
    memoria: 'Fissura orbital superior: olho parado e testa dormente. Se a visão também sumiu, a lesão chegou ao canal óptico.',
    pontos: [
      'Que estruturas atravessam a fissura orbital superior?',
      'Que fossas cranianas a asa menor separa?',
      'O que diferencia a síndrome da fissura orbital superior da do ápice orbitário?',
    ],
  },
  {
    termos: ['Arco Zigomático'],
    classe: 'acidente-osseo',
    resumo: 'Ponte óssea entre o osso zigomático e o processo zigomático do temporal.',
    localizacao: 'Face lateral da face, do zigomático ao meato acústico externo; é subcutâneo em toda a extensão.',
    funcao: 'Dá inserção ao masseter na sua borda inferior e serve de polia para o tendão do temporal, que passa por baixo dele.',
    relacoes: 'Sob o arco correm o tendão do temporal e a artéria temporal profunda.',
    clinica:
      'A fratura do arco zigomático com afundamento bloqueia mecanicamente o processo coronoide da mandíbula e produz trismo — um trismo que não melhora com relaxante muscular, porque a causa é óssea e não muscular. A redução por via temporal (Gillies) devolve a abertura bucal imediatamente. O arco é também a referência do ponto de punção para bloqueio do nervo mandibular.',
    memoria: 'Trismo depois de trauma na face não é dor: pode ser osso afundado travando o coronoide.',
    pontos: [
      'Que ossos formam o arco zigomático?',
      'Que estruturas passam por baixo dele?',
      'Por que sua fratura causa trismo?',
    ],
  },
  {
    termos: ['Dorso da Sela'],
    classe: 'acidente-osseo',
    resumo: 'Lâmina óssea que fecha a sela túrcica por trás, terminando nos processos clinoides posteriores.',
    localizacao: 'Face posterior da fossa hipofisária, continuando-se abaixo com o clivo.',
    funcao: 'Delimita a sela posteriormente e dá inserção à borda anterior da tenda do cerebelo pelos processos clinoides posteriores.',
    relacoes: 'Atrás dele estão o tronco encefálico e a artéria basilar, sobre o clivo.',
    clinica:
      'O dorso da sela é a referência que separa a região selar da fossa posterior no planejamento cirúrgico, e sua remoção amplia o acesso transesfenoidal estendido ao topo da basilar. Nos casos de hipertensão intracraniana crônica, a erosão do dorso da sela é um sinal radiográfico clássico, hoje pouco lembrado por ter sido substituído pela tomografia.',
    memoria: 'O dorso da sela é o "encosto da cadeira" da hipófise. Atrás dele já é fossa posterior.',
    pontos: [
      'Que estrutura o dorso da sela delimita?',
      'Que estruturas estão imediatamente atrás dele?',
      'Que sinal radiográfico sua erosão indica?',
    ],
  },
  /* ─────────────────── Coluna e tórax ─────────────────── */
  {
    termos: ['Processo Articular Inferior'],
    classe: 'acidente-osseo',
    resumo: 'Projeção descendente do arco vertebral que se apoia na vértebra de baixo.',
    localizacao: 'Da junção entre a lâmina e o pedículo, descendo em direção à vértebra subjacente.',
    funcao: 'Sua faceta articula-se com o processo articular superior da vértebra inferior; é o componente descendente da articulação zigapofisária.',
    relacoes: 'Entre ele e o processo articular superior da mesma vértebra está a pars interarticularis, na região lombar.',
    clinica:
      'Na luxação facetária cervical, é o processo articular inferior que "cavalga" e trava sobre o superior da vértebra abaixo — a faceta pousada da radiografia, que exige redução urgente. E é sua hipertrofia degenerativa que estreita o recesso lateral, comprimindo a raiz que desce e produzindo claudicação neurogênica no idoso.',
    memoria: 'O de cima desce e o de baixo sobe: cada vértebra dá uma mão para a vizinha. Travou uma mão na outra, é luxação facetária.',
    pontos: [
      'Com que estrutura o processo articular inferior se articula?',
      'O que é a pars interarticularis?',
      'Que quadro sua hipertrofia produz?',
    ],
  },
  {
    termos: ['Pedículo do Arco Vertebral'],
    classe: 'acidente-osseo',
    resumo: 'Ponte óssea curta e espessa que liga o corpo vertebral ao arco posterior.',
    localizacao: 'De cada lado, entre a face posterolateral do corpo e a origem das lâminas e dos processos.',
    funcao:
      'É o segmento de osso mais denso e resistente da vértebra, e a única via de acesso do arco ao corpo — o que faz dele o corredor da fixação por parafusos pediculares.',
    relacoes: 'Suas incisuras superior e inferior formam o forame intervertebral; medialmente está o saco dural, e abaixo, a raiz nervosa.',
    clinica:
      'Essa vizinhança define o risco: um parafuso que desvia medialmente entra no canal e lesa a medula; que desvia inferiormente, lesa a raiz. É por isso que a instrumentação da coluna é feita sob radioscopia ou navegação. E o "sinal do pedículo ausente" na radiografia frontal — um pedículo que desapareceu — é um dos sinais mais precoces de metástase vertebral, porque o osso cortical do pedículo é o primeiro a ser destruído.',
    memoria: 'Pedículo sumido na radiografia de frente é metástase até prova em contrário. Conte os "olhinhos" da coruja.',
    pontos: [
      'Que estruturas o pedículo conecta?',
      'Que estruturas estão em risco na fixação pedicular?',
      'O que é o sinal do pedículo ausente?',
    ],
  },
  {
    termos: ['Lâmina do Arco Vertebral'],
    classe: 'acidente-osseo',
    resumo: 'Lâmina óssea achatada que fecha o arco vertebral por trás, entre o pedículo e o processo espinhoso.',
    localizacao: 'Parte posterior do arco; as duas lâminas se encontram na linha média formando o processo espinhoso.',
    funcao: 'Completa o forame vertebral e dá inserção ao ligamento amarelo, que une lâminas adjacentes por dentro.',
    relacoes: 'O ligamento amarelo é o último plano atravessado pela agulha antes do espaço epidural.',
    clinica:
      'É a lâmina que se remove na laminectomia, a cirurgia descompressiva mais clássica da coluna. E o ligamento amarelo que ela sustenta é o responsável pela "perda de resistência" que o anestesista sente ao alcançar o espaço epidural — a sensação tátil que localiza a agulha sem imagem. Sua hipertrofia é uma das três causas da estenose de canal, junto com o disco e a faceta.',
    memoria: 'A agulha peridural atravessa o ligamento amarelo e "cede". É a lâmina que sustenta esse ligamento.',
    pontos: [
      'Que estruturas a lâmina conecta?',
      'Que ligamento se insere entre lâminas adjacentes?',
      'Qual sua importância na anestesia peridural?',
    ],
  },
  {
    termos: ['Colo da Costela'],
    classe: 'acidente-osseo',
    resumo: 'Segmento estreito entre a cabeça e o tubérculo da costela.',
    localizacao: 'Cerca de 2,5 cm lateralmente à cabeça, apoiado no processo transverso da vértebra correspondente.',
    funcao: 'Dá inserção ao ligamento costotransversário, que o une ao processo transverso e contribui para o eixo de rotação da costela.',
    relacoes: 'A cadeia simpática torácica e os gânglios repousam sobre as cabeças e os colos das costelas.',
    clinica:
      'É essa relação que torna o colo da costela a referência do bloqueio paravertebral torácico e da simpatectomia torácica videoassistida para hiperidrose palmar — a cadeia é seccionada sobre a cabeça da 2ª ou 3ª costela. Localizar a costela certa é o que separa um bom resultado de uma síndrome de Horner iatrogênica.',
    memoria: 'A cadeia simpática deita sobre as cabeças das costelas. Quem opera hiperidrose conta costelas, não vértebras.',
    pontos: [
      'Onde se localiza o colo da costela?',
      'Que estrutura nervosa repousa sobre ele?',
      'Que procedimentos usam essa referência?',
    ],
  },
  {
    termos: ['Tubérculo da Costela'],
    classe: 'acidente-osseo',
    resumo: 'Saliência na junção entre o colo e o corpo da costela, com faceta para o processo transverso.',
    localizacao: 'Face posterior da costela, na transição colo-corpo; tem uma parte articular e uma não articular.',
    funcao: 'Sua faceta articula-se com a fóvea costal do processo transverso, formando o segundo apoio do eixo de rotação costal.',
    relacoes: 'A parte não articular recebe o ligamento costotransversário lateral.',
    clinica:
      'A orientação dessa faceta muda ao longo do tórax e é o que determina o tipo de movimento costal: convexa e arredondada nas costelas superiores, permitindo rotação em torno de um eixo transversal (braço de bomba); plana nas inferiores, permitindo deslizamento (alça de balde). Uma articulação de poucos milímetros que decide como o tórax se expande.',
    memoria: 'Cabeça encosta no corpo vertebral, tubérculo encosta no transverso. Dois apoios criam o eixo do giro.',
    pontos: [
      'Com que estrutura o tubérculo da costela se articula?',
      'Que costelas não possuem essa articulação?',
      'Como a forma da faceta muda o movimento costal?',
    ],
  },
  {
    termos: ['Sulco da Costela'],
    classe: 'acidente-osseo',
    resumo: 'Goteira na borda inferior da face interna da costela, que abriga o feixe intercostal.',
    localizacao: 'Borda inferior da face interna do corpo costal, mais profunda do ângulo em diante e rasa perto do esterno.',
    funcao: 'Protege a veia, a artéria e o nervo intercostais, dispostos nessa ordem de cima para baixo.',
    relacoes: 'O feixe corre entre os músculos intercostais interno e íntimo.',
    clinica:
      'Ser raso perto do esterno é a informação que falta na maioria das aulas: no terço anterior, o feixe já não está protegido pela borda óssea, e uma punção ali é mais arriscada. É por isso que a toracocentese e a drenagem se fazem lateralmente, no triângulo de segurança, onde o sulco é profundo e a técnica de raspar a borda superior da costela inferior realmente protege.',
    memoria: 'VAN de cima para baixo, escondido na calha da costela — mas a calha some perto do esterno.',
    pontos: [
      'Qual a ordem das estruturas no sulco costal?',
      'Onde o sulco é mais profundo?',
      'Por que a punção é feita lateralmente?',
    ],
  },
  /* ─────────────────── Membro superior ─────────────────── */
  {
    termos: ['Músculo Redondo Maior'],
    classe: 'musculo',
    resumo: 'Músculo que vai do ângulo inferior da escápula ao lábio medial do sulco intertubercular — e que não pertence ao manguito.',
    localizacao: 'Da face dorsal do ângulo inferior da escápula ao lábio medial do sulco intertubercular do úmero.',
    funcao: 'Aduz e roda medialmente o braço, e o estende a partir da flexão; trabalha junto com o latíssimo do dorso, ao lado de quem se insere.',
    vascularizacao: 'Artéria subescapular e circunflexa da escápula.',
    inervacao: 'Nervo subescapular inferior (C5–C6) — e não o axilar.',
    relacoes: 'Sua borda superior forma o limite inferior dos espaços quadrangular e triangular.',
    clinica:
      'É o músculo mais confundido do ombro: apesar do nome, não faz parte do manguito rotador, porque não se insere na cápsula nem contribui para centrar a cabeça umeral. Seu tendão é transferido, junto com o latíssimo, para restaurar a rotação externa em lesões irreparáveis do manguito posterior — a transferência de L\'Episcopo.',
    memoria:
      'Redondo menor está no manguito; redondo maior não. O "maior" é sócio do latíssimo, não do manguito.',
    pontos: [
      'Por que o redondo maior não pertence ao manguito rotador?',
      'Que nervo o inerva?',
      'Que músculo tem inserção adjacente à sua?',
    ],
  },
  {
    termos: ['Músculo Redondo Menor'],
    classe: 'musculo',
    resumo: 'O menor componente do manguito rotador, e o único inervado pelo nervo axilar.',
    localizacao: 'Da metade superior da margem lateral da escápula à faceta inferior do tubérculo maior do úmero.',
    funcao: 'Roda lateralmente o braço e deprime a cabeça umeral; contribui com cerca de 40% da força de rotação externa, junto com o infraespinal.',
    vascularizacao: 'Artéria circunflexa da escápula.',
    inervacao: 'Ramo posterior do nervo axilar (C5–C6) — exceção entre os componentes do manguito.',
    relacoes: 'Forma o limite superior do espaço quadrangular, por onde o axilar entra.',
    clinica:
      'Essa inervação isolada pelo axilar é o que produz um achado peculiar: na síndrome do espaço quadrangular, a atrofia do redondo menor aparece na ressonância sem qualquer atrofia dos demais componentes do manguito. É um padrão de denervação seletiva que aponta diretamente para a compressão do axilar, e não para doença do tendão.',
    memoria:
      'Três do manguito são do supraescapular; o redondo menor é do axilar. Um músculo, um nervo diferente, um padrão de atrofia próprio.',
    pontos: [
      'Que nervo inerva o redondo menor e por que isso é excepcional?',
      'Que espaço anatômico ele delimita?',
      'Que achado sua atrofia isolada indica?',
    ],
  },
  {
    termos: ['Músculo Pronador Redondo'],
    classe: 'musculo',
    resumo: 'Músculo superficial do antebraço com duas cabeças, entre as quais passa o nervo mediano.',
    localizacao: 'Da cabeça umeral, no epicôndilo medial, e da cabeça ulnar, no processo coronoide, até o meio da face lateral do rádio.',
    funcao: 'Prona o antebraço com força e velocidade, complementando o pronador quadrado, e auxilia a flexão do cotovelo.',
    vascularizacao: 'Artéria ulnar e recorrente ulnar anterior.',
    inervacao: 'Nervo mediano (C6–C7).',
    relacoes: 'O nervo mediano passa entre suas duas cabeças; a artéria ulnar passa profundamente à cabeça ulnar.',
    clinica:
      'É o local da síndrome do pronador redondo: dor no antebraço proximal e parestesia na mão que, ao contrário do túnel do carpo, poupa a região tenar — porque o ramo cutâneo palmar do mediano sai antes do túnel e é comprimido aqui. Parestesia na palma da mão, e não só nos dedos, muda a topografia da lesão de um lugar para o outro.',
    memoria:
      'Túnel do carpo poupa a palma; pronador redondo não. Se a palma formiga, a compressão é mais alta.',
    pontos: [
      'Que nervo passa entre as duas cabeças do pronador redondo?',
      'Que ação ele realiza?',
      'Como diferenciar sua síndrome do túnel do carpo?',
    ],
  },
  {
    termos: ['Músculo Flexor Radial do Carpo'],
    classe: 'musculo',
    resumo: 'Flexor superficial cujo tendão é a referência do pulso radial e do acesso à artéria radial.',
    localizacao: 'Do epicôndilo medial à base do 2º metacarpo, passando por um compartimento próprio do retináculo dos flexores.',
    funcao: 'Flete e faz o desvio radial do punho; é o segundo tendão mais medial visível na face anterior do punho.',
    inervacao: 'Nervo mediano (C6–C7).',
    relacoes: 'A artéria radial corre imediatamente lateral ao seu tendão no punho; o nervo mediano fica medial a ele.',
    clinica:
      'Essa vizinhança é usada todos os dias: o pulso radial se palpa entre o tendão do flexor radial do carpo e o processo estiloide do rádio, e é ali que se punciona a artéria para gasometria e para cateterismo por via radial. E é o mesmo tendão que se usa como referência para localizar o mediano na anestesia de bloqueio de punho.',
    memoria:
      'No punho, de fora para dentro: artéria radial, flexor radial do carpo, palmar longo, mediano por baixo. Uma fila que orienta agulha e bisturi.',
    pontos: [
      'Onde se palpa o pulso radial em relação a esse tendão?',
      'Que nervo corre medial a ele?',
      'Que ações ele realiza?',
    ],
  },
  {
    termos: ['Músculo Flexor Ulnar do Carpo'],
    classe: 'musculo',
    resumo: 'O único flexor do antebraço inervado pelo nervo ulnar, com duas cabeças formando o túnel cubital.',
    localizacao: 'Da cabeça umeral, no epicôndilo medial, e da cabeça ulnar, no olécrano e na borda posterior da ulna, até o pisiforme.',
    funcao: 'Flete e faz o desvio ulnar do punho; o pisiforme funciona como sesamoide no seu tendão.',
    inervacao: 'Nervo ulnar (C7–T1).',
    relacoes: 'O nervo ulnar entra no antebraço passando entre suas duas cabeças, na arcada de Osborne.',
    clinica:
      'A arcada de Osborne, entre as duas cabeças, é o ponto mais comum de compressão do ulnar no cotovelo — e a razão de os sintomas piorarem com a flexão, que estreita o espaço. Na descompressão cirúrgica, é essa arcada que se abre, e nas transposições, é entre suas cabeças que o nervo é reposicionado.',
    memoria:
      'O ulnar entra no antebraço "por dentro" desse músculo. Dobrar o cotovelo aperta a entrada — daí a piora ao dormir.',
    pontos: [
      'Que nervo inerva o flexor ulnar do carpo?',
      'O que é a arcada de Osborne?',
      'Por que a flexão do cotovelo agrava os sintomas?',
    ],
  },
  {
    termos: ['Músculo Palmar Longo'],
    classe: 'musculo',
    resumo: 'Músculo fino e dispensável do antebraço, ausente em cerca de 15% das pessoas.',
    localizacao: 'Do epicôndilo medial à aponeurose palmar, com ventre curto e tendão longo que passa por cima do retináculo.',
    funcao: 'Tensiona a aponeurose palmar e auxilia fracamente a flexão do punho; sua ausência não produz déficit algum.',
    inervacao: 'Nervo mediano (C7–C8).',
    relacoes: 'Seu tendão é superficial ao retináculo dos flexores, e não dentro do túnel do carpo.',
    clinica:
      'A combinação de ser longo, superficial e dispensável fez dele o enxerto tendíneo mais utilizado da cirurgia — do ligamento colateral ulnar do cotovelo às polias dos flexores. Antes de qualquer plano que dependa dele, testa-se sua presença opondo o polegar ao mínimo com o punho fletido; se não aparece, procura-se o plantar ou o extensor do dedo mínimo do pé.',
    memoria:
      'É o tendão "de reposição" do corpo humano. Um em cada seis não tem — e nem sabe disso.',
    pontos: [
      'Em que proporção da população o palmar longo está ausente?',
      'Seu tendão passa dentro ou fora do túnel do carpo?',
      'Como se testa sua presença?',
    ],
  },
  {
    termos: ['Músculo Extensor dos Dedos'],
    classe: 'musculo',
    resumo: 'Principal extensor dos quatro dedos longos, com quatro tendões unidos por conexões intertendíneas.',
    localizacao: 'Do epicôndilo lateral, pelo tendão extensor comum, até as expansões extensoras dos dedos 2 a 5.',
    funcao: 'Estende as metacarpofalângicas; a extensão das interfalângicas depende dos lumbricais e interósseos, que se inserem no mesmo capuz.',
    inervacao: 'Nervo interósseo posterior (C7–C8).',
    relacoes: 'Ocupa o quarto compartimento extensor, junto com o extensor do indicador.',
    clinica:
      'Sua origem no tendão extensor comum é o epicentro da epicondilite lateral, e o teste é a extensão resistida do dedo médio, que reproduz a dor com precisão maior que a extensão do punho. As conexões intertendíneas mascaram roturas isoladas, por isso cada dedo se testa separadamente e contra resistência.',
    memoria:
      'Um músculo só para quatro dedos, com pontes entre os tendões. Por isso o anular quase não se estende sozinho.',
    pontos: [
      'Que articulação o extensor dos dedos estende diretamente?',
      'Que músculos completam a extensão dos dedos?',
      'Qual o melhor teste para epicondilite lateral?',
    ],
  },
  {
    termos: ['Músculo Extensor Ulnar do Carpo'],
    classe: 'musculo',
    resumo: 'Extensor do sexto compartimento, que estende e faz o desvio ulnar do punho.',
    localizacao: 'Do epicôndilo lateral e da borda posterior da ulna à base do 5º metacarpo, correndo num sulco na cabeça da ulna.',
    funcao: 'Estende e desvia ulnarmente o punho; sua bainha é um estabilizador dinâmico da articulação radioulnar distal.',
    inervacao: 'Nervo interósseo posterior (C7–C8).',
    relacoes: 'Sua bainha fibro-óssea é parte do complexo da fibrocartilagem triangular.',
    clinica:
      'A subluxação do seu tendão, quando a bainha se rompe, produz um estalido audível e visível na pronossupinação com o punho em desvio ulnar — sinal específico que se reproduz no consultório. É a segunda causa mais comum de dor ulnar do punho, atrás apenas das lesões do complexo triangular, e é frequentemente diagnosticada como "tendinite" sem exame dinâmico.',
    memoria:
      'Estalo no lado de fora do punho ao girar o antebraço: o tendão do extensor ulnar do carpo está pulando fora do sulco.',
    pontos: [
      'Em que compartimento extensor esse tendão corre?',
      'Que papel ele tem na estabilidade radioulnar distal?',
      'Como se identifica sua subluxação?',
    ],
  },
  {
    termos: ['Músculo Extensor do Dedo Mínimo'],
    classe: 'musculo',
    resumo: 'Extensor próprio do quinto dedo, no quinto compartimento extensor.',
    localizacao: 'Do tendão extensor comum, no epicôndilo lateral, até o capuz extensor do dedo mínimo, correndo sobre a articulação radioulnar distal.',
    funcao: 'Estende o dedo mínimo isoladamente; junto com o extensor do indicador, permite os únicos dois dedos com extensão independente.',
    inervacao: 'Nervo interósseo posterior (C7–C8).',
    relacoes: 'Corre imediatamente sobre a articulação radioulnar distal e a cabeça da ulna.',
    clinica:
      'Essa posição sobre a cabeça da ulna é a razão de ele ser o primeiro tendão a romper na mão reumatoide, quando a ulna subluxa dorsalmente — o início da rotura em cascata de Vaughan-Jackson, que progride do lado ulnar para o radial. A perda isolada da extensão do dedo mínimo em paciente com artrite reumatoide é indicação de sinovectomia antes que os outros tendões sigam.',
    memoria:
      'Na mão reumatoide, os tendões caem em fila indiana começando pelo mínimo. Perdeu um, corra antes de perder os outros.',
    pontos: [
      'Em que compartimento corre esse tendão?',
      'Que dedos têm extensor próprio?',
      'Por que ele rompe primeiro na artrite reumatoide?',
    ],
  },
  {
    termos: ['Músculo Flexor Superficial dos Dedos'],
    classe: 'musculo',
    resumo: 'Flexor da camada intermediária do antebraço, que flete as interfalângicas proximais.',
    localizacao:
      'Do epicôndilo medial, do processo coronoide e da linha oblíqua do rádio até as falanges médias dos dedos 2 a 5, com os tendões dispostos em dois planos no túnel do carpo.',
    funcao: 'Flete a interfalângica proximal de cada dedo independentemente, porque cada tendão tem ventre muscular próprio.',
    inervacao: 'Nervo mediano (C7–T1).',
    relacoes: 'O nervo mediano passa profundamente ao seu arco fibroso de origem.',
    clinica:
      'A independência dos ventres é o que permite o teste isolado: bloqueiam-se os outros dedos em extensão — o que anula o flexor profundo, de ventre comum — e pede-se a flexão da interfalângica proximal. É também o arco fibroso do flexor superficial um dos pontos de compressão alta do mediano, junto com o pronador redondo e o ligamento de Struthers.',
    memoria:
      'Superficial tem ventre para cada dedo; profundo tem um só para todos. É essa diferença que permite testar um sem o outro.',
    pontos: [
      'Que articulação o flexor superficial flete?',
      'Como se testa isoladamente esse músculo?',
      'Por que o flexor profundo não pode ser testado assim?',
    ],
  },
  {
    termos: ['Músculo Flexor Profundo dos Dedos'],
    classe: 'musculo',
    resumo: 'Flexor da camada profunda, único capaz de fletir as interfalângicas distais, com dupla inervação.',
    localizacao: 'Das faces anterior e medial da ulna e da membrana interóssea às falanges distais dos dedos 2 a 5.',
    funcao: 'Flete as interfalângicas distais; seus tendões perfuram os do flexor superficial no quiasma de Camper.',
    inervacao:
      'Metade radial (indicador e médio) pelo nervo interósseo anterior, ramo do mediano; metade ulnar (anular e mínimo) pelo nervo ulnar — uma das duplas inervações mais cobradas.',
    relacoes: 'Dá origem aos músculos lumbricais na palma.',
    clinica:
      'Essa divisão de inervação é o que explica a mão em garra da lesão ulnar: o flexor profundo do anular e do mínimo permanece ativo enquanto os intrínsecos desses dedos paralisam, e o desequilíbrio flete as interfalângicas e estende as metacarpofalângicas. É também a razão do paradoxo ulnar — uma lesão ulnar mais alta, que também paralisa o flexor profundo, produz uma garra menos evidente.',
    memoria:
      'Paradoxo ulnar: quanto mais alta a lesão, menos feia a garra. Porque o músculo que faz a garra também morre.',
    pontos: [
      'Qual a dupla inervação do flexor profundo dos dedos?',
      'Que articulação só ele flete?',
      'O que é o paradoxo ulnar?',
    ],
  },
  {
    termos: ['Músculo Flexor Longo do Polegar'],
    classe: 'musculo',
    resumo: 'Único flexor longo do polegar, na camada profunda do antebraço.',
    localizacao: 'Da face anterior do rádio e da membrana interóssea à base da falange distal do polegar.',
    funcao: 'Flete a interfalângica do polegar e contribui para a flexão das articulações mais proximais.',
    inervacao: 'Nervo interósseo anterior, ramo do mediano (C7–C8).',
    relacoes: 'Passa pelo túnel do carpo na bursa radial, com bainha própria.',
    clinica:
      'Junto com o flexor profundo do indicador, ele forma o par testado no "sinal do O": pedir ao paciente que faça um círculo com polegar e indicador e observar se o círculo vira um triângulo — a assinatura da síndrome do nervo interósseo anterior, neuropatia puramente motora, sem alteração de sensibilidade, que se distingue de rotura tendínea pelo efeito tenodese preservado.',
    memoria:
      'Peça o gesto de "OK". Círculo virou triângulo? Interósseo anterior — nervo, e não tendão.',
    pontos: [
      'Que nervo inerva o flexor longo do polegar?',
      'O que é o sinal do O?',
      'Como diferenciar lesão nervosa de rotura tendínea?',
    ],
  },
  {
    termos: ['Músculo Abdutor Longo do Polegar'],
    classe: 'musculo',
    resumo: 'Músculo profundo do dorso do antebraço que abduz o polegar e forma a borda anterior da tabaqueira.',
    localizacao: 'Das faces posteriores da ulna, do rádio e da membrana interóssea à base do 1º metacarpo, no primeiro compartimento extensor.',
    funcao: 'Abduz e estende o polegar na carpometacarpal e auxilia o desvio radial do punho.',
    inervacao: 'Nervo interósseo posterior (C7–C8).',
    relacoes: 'Cruza obliquamente por cima dos tendões extensores radiais do carpo.',
    clinica:
      'Esse cruzamento oblíquo é o local da síndrome da interseção — dor e crepitação a cerca de 4 cm proximalmente ao punho, comum em remadores e halterofilistas, e frequentemente confundida com De Quervain, que dói mais distalmente, sobre o processo estiloide do rádio. A localização da dor, em centímetros, separa os dois diagnósticos.',
    memoria:
      'De Quervain dói no estiloide; síndrome da interseção dói quatro dedos acima. Meça antes de nomear.',
    pontos: [
      'Que compartimento extensor esse músculo ocupa?',
      'Que tendões ele cruza obliquamente?',
      'Como diferenciar De Quervain da síndrome da interseção?',
    ],
  },
  {
    termos: ['Músculo Extensor Curto do Polegar'],
    classe: 'musculo',
    resumo: 'Companheiro do abdutor longo no primeiro compartimento, que estende a metacarpofalângica do polegar.',
    localizacao: 'Da face posterior do rádio e da membrana interóssea à base da falange proximal do polegar.',
    funcao: 'Estende a metacarpofalângica do polegar; forma, com o abdutor longo, a borda anterior da tabaqueira anatômica.',
    inervacao: 'Nervo interósseo posterior (C7–C8).',
    relacoes: 'Em cerca de 30% das pessoas ocupa um subcompartimento próprio, separado por um septo.',
    clinica:
      'Esse septo é a explicação anatômica da falha da infiltração na doença de De Quervain: o corticoide alcança apenas o compartimento do abdutor longo e o extensor curto permanece comprimido. Diante de infiltração que não resolve, a suspeita não é de diagnóstico errado, e sim de compartimento não alcançado — e a liberação cirúrgica precisa abrir os dois.',
    memoria:
      'Infiltração de De Quervain que não resolve não é diagnóstico errado: é um septo escondido dentro do compartimento.',
    pontos: [
      'Que articulação o extensor curto do polegar estende?',
      'Que variante anatômica ele apresenta com frequência?',
      'Por que essa variante causa falha terapêutica?',
    ],
  },
  {
    termos: ['Músculo Extensor Longo do Polegar'],
    classe: 'musculo',
    resumo: 'Extensor do terceiro compartimento, que contorna o tubérculo de Lister e retropulsa o polegar.',
    localizacao: 'Da face posterior da ulna e da membrana interóssea à base da falange distal do polegar, contornando o tubérculo dorsal do rádio.',
    funcao: 'Estende a interfalângica e retropulsa o polegar — o único movimento que levanta o polegar do plano da mesa.',
    inervacao: 'Nervo interósseo posterior (C7–C8).',
    relacoes: 'Forma a borda posterior da tabaqueira anatômica; sua curva sobre o tubérculo é um ponto de atrito e de vascularização precária.',
    clinica:
      'A rotura tardia após fratura de Colles é o exemplo clássico da anatomia prevendo a complicação: ocorre semanas depois, mesmo em fraturas não desviadas, por isquemia e atrito na curva. O tratamento é a transferência do extensor do indicador, e o teste é a retropulsão com a palma apoiada na mesa.',
    memoria:
      'Palma na mesa e levante só o polegar. Não subiu semanas depois de uma fratura de punho? O tendão rompeu na curva.',
    pontos: [
      'Que movimento único o extensor longo do polegar realiza?',
      'Por que ele rompe tardiamente após fratura do rádio distal?',
      'Que transferência tendínea o substitui?',
    ],
  },
  {
    termos: ['Músculo Abdutor Curto do Polegar'],
    classe: 'musculo',
    resumo: 'Músculo tenar mais superficial, o mais confiável para testar o nervo mediano na mão.',
    localizacao: 'Do retináculo dos flexores, do escafoide e do trapézio à base da falange proximal do polegar e ao capuz extensor.',
    funcao: 'Abduz o polegar perpendicularmente ao plano da palma — movimento que nenhum outro músculo realiza.',
    inervacao: 'Ramo recorrente do nervo mediano (C8–T1), sem contribuição ulnar.',
    relacoes: 'É o músculo tenar mais superficial e o mais facilmente palpável.',
    clinica:
      'A inervação exclusivamente mediana faz dele o músculo de escolha para testar o mediano distal: pede-se ao paciente que levante o polegar contra resistência, com a mão apoiada na mesa, palma para cima. É esse músculo que atrofia na síndrome do túnel do carpo avançada, produzindo a mão do pregador — e é a comparação entre as duas eminências tenares que revela a atrofia antes que o paciente a perceba.',
    memoria:
      'Palma para cima, polegar para o teto, contra sua mão: se não sobe, o mediano distal está comprometido.',
    pontos: [
      'Que movimento o abdutor curto do polegar realiza?',
      'Por que ele é o melhor teste do nervo mediano distal?',
      'Que sinal sua atrofia produz?',
    ],
  },
  {
    termos: ['Músculo Adutor do Polegar'],
    classe: 'musculo',
    resumo: 'Músculo em leque do compartimento adutor da mão, inervado pelo nervo ulnar.',
    localizacao: 'Cabeça oblíqua, do capitato e das bases dos metacarpos, e cabeça transversa, do 3º metacarpo, até o sesamoide medial e a base da falange proximal do polegar.',
    funcao: 'Aduz o polegar contra a palma e é o principal responsável pela força da pinça lateral — o gesto de segurar uma chave.',
    inervacao: 'Ramo profundo do nervo ulnar (C8–T1).',
    relacoes: 'A artéria radial passa entre suas duas cabeças ao entrar na palma.',
    clinica:
      'Sua fraqueza produz o sinal de Froment: pedindo ao paciente que segure um papel entre polegar e indicador, ele compensa fletindo a interfalângica do polegar, recrutando o flexor longo, inervado pelo mediano. É o teste mais elegante da neuropatia ulnar, feito com uma folha de papel e cinco segundos.',
    memoria:
      'Segure um papel entre o polegar e o dedo e puxe. Se o polegar dobra na ponta, é Froment — o ulnar falhou.',
    pontos: [
      'Que nervo inerva o adutor do polegar?',
      'Que movimento depende dele?',
      'O que é o sinal de Froment?',
    ],
  },
  {
    termos: ['Músculo Abdutor do Dedo Mínimo'],
    classe: 'musculo',
    resumo: 'Músculo hipotenar mais superficial e mais medial, abdutor do quinto dedo.',
    localizacao: 'Do pisiforme e do tendão do flexor ulnar do carpo à base da falange proximal do dedo mínimo e ao capuz extensor.',
    funcao: 'Abduz o dedo mínimo e contribui para aprofundar a concavidade da palma.',
    inervacao: 'Ramo profundo do nervo ulnar (C8–T1).',
    relacoes: 'Forma a borda medial da mão e cobre o canal de Guyon distalmente.',
    clinica:
      'Sua ação é o que produz — quando falha o oposto, os interósseos palmares — o sinal de Wartenberg: o dedo mínimo permanece abduzido em repouso e o paciente engancha o dedo ao colocar a mão no bolso. É um dos sinais mais precoces da neuropatia ulnar e um dos mais fáceis de observar sem qualquer manobra.',
    memoria:
      'Dedo mínimo que fica "aberto" e engancha no bolso: sinal de Wartenberg, e o culpado é o nervo ulnar.',
    pontos: [
      'Que nervo inerva o abdutor do dedo mínimo?',
      'Que ação ele realiza?',
      'O que é o sinal de Wartenberg?',
    ],
  },
  {
    termos: ['Músculos Lumbricais'],
    classe: 'musculo',
    resumo: 'Quatro músculos que nascem de tendão e terminam em tendão, ligando os flexores aos extensores.',
    localizacao: 'Dos tendões do flexor profundo dos dedos, na palma, ao lado radial do capuz extensor de cada dedo.',
    funcao:
      'São os únicos músculos do corpo que se originam e se inserem em tendões. Fletem as metacarpofalângicas e estendem as interfalângicas — exatamente a posição de escrever.',
    inervacao:
      'Os dois laterais (indicador e médio) pelo nervo mediano; os dois mediais (anular e mínimo) pelo ramo profundo do ulnar — a mesma divisão do flexor profundo que os origina.',
    relacoes: 'Correm palmarmente ao ligamento metacarpal transverso profundo, ao contrário dos interósseos.',
    clinica:
      'A origem em tendão móvel cria um fenômeno único: quando o flexor profundo é encurtado por aderência ou por sutura curta, a contração dos lumbricais paradoxalmente estende os dedos em vez de fletir — o "lumbrical plus", em que o paciente tenta fechar a mão e o dedo se abre. É uma das poucas situações em que um músculo faz o oposto da sua função por razão puramente mecânica.',
    memoria:
      'Lumbrical é o músculo da caligrafia: dobra o nó e estica a ponta. E é o único que nasce e morre em tendão.',
    pontos: [
      'O que há de único na origem dos lumbricais?',
      'Que movimento eles produzem?',
      'Qual sua inervação e por que ela é dividida?',
    ],
  },
  {
    termos: ['Falanges Proximais'],
    classe: 'osso',
    resumo: 'Primeira fileira de falanges, a mais longa e a que sustenta o aparelho extensor.',
    localizacao: 'Entre as cabeças dos metacarpos e as falanges médias; sua base é côncava e sua cabeça, em polia.',
    funcao: 'Recebem os interósseos e os lumbricais na base, e o capuz extensor no dorso; formam a alavanca principal da preensão.',
    relacoes: 'A placa volar reforça a face palmar da metacarpofalângica.',
    clinica:
      'É a falange que mais fratura da mão, e sua angulação é mal tolerada: o desvio apical volar, produzido pela tração dos intrínsecos na base e dos extensores no dorso, encurta o dedo e altera o arco de movimento. Fraturas com mais de 10° de angulação ou qualquer rotação exigem redução.',
    memoria:
      'Na falange proximal, os intrínsecos puxam a base para cima e o extensor puxa a ponta para baixo. O osso arqueia no meio.',
    pontos: [
      'Que estruturas se inserem na falange proximal?',
      'Qual o padrão de desvio das suas fraturas e por quê?',
      'Que grau de angulação é aceitável?',
    ],
  },
  {
    termos: ['Falanges Médias'],
    classe: 'osso',
    resumo: 'Segunda fileira de falanges, presente apenas nos quatro dedos longos.',
    localizacao: 'Entre as falanges proximal e distal dos dedos 2 a 5; ausente no polegar.',
    funcao: 'Recebe, na base dorsal, a banda central do aparelho extensor, e na face palmar, o tendão do flexor superficial dos dedos.',
    relacoes: 'A inserção do flexor superficial ocupa quase toda a sua diáfise palmar.',
    clinica:
      'Essa dupla inserção explica o padrão de desvio das fraturas: acima da inserção do flexor superficial, o fragmento distal é fletido; abaixo dela, é estendido. Prever o desvio pelo nível do traço é o que orienta a redução — e é um dos raciocínios mais úteis da traumatologia da mão.',
    memoria:
      'O flexor superficial se insere no meio da falange média. O traço acima ou abaixo dessa inserção decide para onde o osso vai.',
    pontos: [
      'Que tendões se inserem na falange média?',
      'Por que o polegar não tem falange média?',
      'Como o nível da fratura determina o desvio?',
    ],
  },
  {
    termos: ['Falanges Distais'],
    classe: 'osso',
    resumo: 'Última falange de cada dedo, com tuberosidade que sustenta a polpa e o leito ungueal.',
    localizacao: 'Extremidade de cada dedo, com base articular e tuberosidade distal alargada.',
    funcao: 'Recebe o tendão terminal do aparelho extensor no dorso e o flexor profundo na face palmar; sustenta a unha e a polpa digital.',
    relacoes: 'A polpa é dividida em compartimentos por septos fibrosos que ligam a pele ao periósteo.',
    clinica:
      'Esses septos criam um compartimento fechado, e é por isso que o panarício da polpa produz dor pulsátil desproporcional e necrose se não for drenado precocemente. As fraturas de tufo, por esmagamento, quase sempre vêm com hematoma subungueal — e quando ele ocupa mais de 50% da unha, o leito deve ser explorado, sob risco de deformidade ungueal permanente.',
    memoria:
      'A polpa do dedo é um compartimento fechado. Dor que lateja mais do que o dedo parece merecer é panarício: drene.',
    pontos: [
      'Que tendões se inserem na falange distal?',
      'Por que o panarício da polpa dói tanto?',
      'Quando explorar o leito ungueal?',
    ],
  },
  /* ─────────────────── Membro inferior ─────────────────── */
  {
    termos: ['Asa do Ílio'],
    classe: 'acidente-osseo',
    resumo: 'Lâmina larga e curva do ílio, com face glútea externa e fossa ilíaca interna.',
    localizacao: 'Porção superior do osso do quadril, acima da linha arqueada, terminando na crista ilíaca.',
    funcao: 'Dá inserção aos três glúteos por fora, pelas linhas glúteas, e ao músculo ilíaco por dentro.',
    vascularizacao: 'Artérias glútea superior, iliolombar e circunflexa ilíaca profunda.',
    clinica:
      'É o principal sítio doador de enxerto ósseo do corpo, tanto pela crista anterior quanto pela posterior — e a escolha entre elas depende do nervo em risco: à frente, o cutâneo femoral lateral, cuja lesão produz meralgia parestésica; atrás, os nervos clúnios superiores. A dor crônica no sítio doador é complicação frequente e evitável com técnica cuidadosa.',
    memoria: 'Osso de enxerto sai da asa do ílio. Pela frente arrisca o nervo da coxa; por trás, os nervos da nádega.',
    pontos: [
      'Que músculos nascem em cada face da asa do ílio?',
      'Por que ela é o sítio doador preferido de enxerto?',
      'Que nervos correm risco em cada abordagem?',
    ],
  },
  {
    termos: ['Crista Ilíaca'],
    classe: 'acidente-osseo',
    resumo: 'Borda superior espessa e curva do ílio, palpável em toda a sua extensão.',
    localizacao: 'Da espinha ilíaca anterossuperior à posterossuperior, com um tubérculo na sua parte anterolateral.',
    funcao: 'Dá inserção aos oblíquos, ao transverso do abdome, ao latíssimo do dorso, ao quadrado do lombo e à fáscia toracolombar, além dos glúteos por fora.',
    relacoes: 'O ponto mais alto da crista corresponde ao nível de L4.',
    clinica:
      'Essa correspondência com L4 é a linha de Tuffier, referência universal da punção lombar e da raquianestesia: a linha que une as duas cristas cruza o processo espinhoso de L4 ou o espaço L4–L5, seguramente abaixo do fim da medula. A crista é ainda o sítio da biópsia de medula óssea e a origem do enxerto tricortical.',
    memoria: 'Linha entre as cristas ilíacas é L4. Puncione ali ou abaixo, e você está longe da medula.',
    pontos: [
      'Que nível vertebral a crista ilíaca marca?',
      'O que é a linha de Tuffier?',
      'Que músculos se inserem na crista?',
    ],
  },
  {
    termos: ['Espinha Ilíaca Anterossuperior'],
    classe: 'acidente-osseo',
    resumo: 'Extremidade anterior da crista ilíaca, o reparo palpável mais usado da pelve.',
    localizacao: 'Extremidade anterior da crista ilíaca, sob a pele, facilmente palpável em qualquer biotipo.',
    funcao: 'Dá inserção ao músculo sartório e ao ligamento inguinal, cuja outra extremidade é o tubérculo púbico.',
    relacoes: 'O nervo cutâneo femoral lateral passa imediatamente medial a ela, sob o ligamento inguinal.',
    clinica:
      'É a referência de quase tudo na região: mede a discrepância de comprimento dos membros, orienta o ponto de McBurney (a um terço da distância até o umbigo) e define o local da injeção intramuscular ventroglútea. A compressão do cutâneo femoral lateral ali — por cinto, obesidade ou gravidez — produz a meralgia parestésica, com queimação na face lateral da coxa e nenhuma fraqueza.',
    memoria: 'Queimação na lateral da coxa sem fraqueza nenhuma: meralgia parestésica, o nervo preso na virilha.',
    pontos: [
      'Que estruturas se inserem na espinha ilíaca anterossuperior?',
      'Que nervo passa medialmente a ela?',
      'Que medidas e referências ela orienta?',
    ],
  },
  {
    termos: ['Espinha Ilíaca Ântero-Inferior', 'Espinha Ilíaca Ântero-inferior'],
    classe: 'acidente-osseo',
    resumo: 'Saliência abaixo da anterossuperior, origem do reto femoral e do ligamento iliofemoral.',
    localizacao: 'Acima da borda do acetábulo, separada da anterossuperior pela incisura por onde passa o sartório.',
    funcao: 'Recebe a cabeça direta do reto femoral e a inserção proximal do ligamento iliofemoral.',
    relacoes: 'O tendão do reto femoral tem também uma cabeça refletida, na borda superior do acetábulo.',
    clinica:
      'É sítio de avulsão apofisária em adolescentes — o chute a bola com força arranca a apófise antes de romper o tendão, porque a cartilagem de crescimento é o elo mais fraco. E o impacto subespinhal, quando a espinha é proeminente, limita a flexão do quadril em atletas e é hoje reconhecido como causa de dor inguinal, tratado por ressecção artroscópica.',
    memoria: 'Adolescente que chutou a bola e sentiu estalo na virilha: arrancou a apófise, não estirou o músculo.',
    pontos: [
      'Que estruturas se inserem na espinha ilíaca ântero-inferior?',
      'Que lesão típica ocorre em adolescentes?',
      'O que é o impacto subespinhal?',
    ],
  },
  {
    termos: ['Espinha Ilíaca Posterossuperior'],
    classe: 'acidente-osseo',
    resumo: 'Extremidade posterior da crista ilíaca, marcada na pele pelas fossetas sacrais.',
    localizacao: 'Extremidade posterior da crista, correspondendo ao nível de S2.',
    funcao: 'Recebe os ligamentos sacroilíacos posteriores e dá origem a fibras do glúteo máximo e do eretor da espinha.',
    relacoes: 'A linha entre as duas espinhas posterossuperiores marca o nível de S2, onde termina o saco dural.',
    clinica:
      'É o sítio preferencial da biópsia e do aspirado de medula óssea no adulto, por ser subcutânea, ter osso esponjoso abundante e estar longe de estruturas nobres. É também a referência para a infiltração da articulação sacroilíaca e o ponto usado para avaliar assimetria pélvica no exame postural.',
    memoria: 'As "covinhas de Vênus" nas costas são as espinhas posterossuperiores — e elas marcam S2.',
    pontos: [
      'Que nível vertebral a espinha ilíaca posterossuperior marca?',
      'Que procedimento a usa como via de acesso?',
      'Que estrutura termina nesse nível?',
    ],
  },
  {
    termos: ['Espinha Isquiática'],
    classe: 'acidente-osseo',
    resumo: 'Projeção pontiaguda entre as incisuras isquiáticas maior e menor, palpável ao toque vaginal.',
    localizacao: 'Face posterior do ísquio, separando as duas incisuras isquiáticas.',
    funcao: 'Dá inserção ao ligamento sacroespinal, que converte a incisura maior em forame, e ao músculo coccígeo.',
    relacoes: 'O feixe pudendo contorna a espinha ao passar do forame isquiático maior para o menor.',
    clinica:
      'Duas aplicações a tornam indispensável. Em obstetrícia, as espinhas isquiáticas definem o plano zero de De Lee: a altura da apresentação fetal é medida em centímetros acima ou abaixo delas, e é essa medida que decide entre parto vaginal instrumentado e cesariana. E é sobre a espinha, palpada por via vaginal, que se aplica o bloqueio do nervo pudendo.',
    memoria:
      'Plano zero de De Lee é a linha das espinhas isquiáticas. Acima é negativo, abaixo é positivo — e é isso que decide a conduta.',
    pontos: [
      'Que ligamento se insere na espinha isquiática?',
      'Que estrutura nervosa a contorna?',
      'O que é o plano zero de De Lee?',
    ],
  },
  {
    termos: ['Túber Isquiático'],
    classe: 'acidente-osseo',
    resumo: 'Grande tuberosidade inferior do ísquio, sobre a qual o corpo se apoia sentado.',
    localizacao: 'Porção posteroinferior do osso do quadril, palpável na prega glútea com o quadril fletido.',
    funcao: 'Dá origem aos três isquiotibiais e à porção isquiocondilar do adutor magno, e recebe o ligamento sacrotuberal.',
    relacoes: 'O nervo isquiático desce a meio caminho entre ele e o trocânter maior.',
    clinica:
      'É o marco anatômico do bloqueio do nervo isquiático por via posterior e o sítio da bursite isquiática — a "dor do tecelão", que piora ao sentar em superfície dura. Nos atletas adolescentes, a avulsão apofisária do túber, por contração violenta dos isquiotibiais, é uma lesão frequentemente confundida com estiramento muscular, e a radiografia é o que faz a diferença.',
    memoria:
      'É o osso em que você senta e de onde saem os posteriores da coxa. Entre ele e o trocânter passa o isquiático.',
    pontos: [
      'Que músculos nascem do túber isquiático?',
      'Que estrutura nervosa passa perto dele?',
      'Que lesão típica ocorre em adolescentes?',
    ],
  },
  {
    termos: ['Sínfise Púbica'],
    classe: 'articulacao',
    resumo: 'Articulação cartilagínea secundária na linha média anterior da pelve, entre os dois púbis.',
    localizacao: 'Linha média anterior da pelve, com um disco interpúbico de fibrocartilagem entre as faces sinfisiais.',
    funcao:
      'Permite deslocamento mínimo — cerca de 2 mm e 1° de rotação — e resiste às forças de cisalhamento vertical entre os dois hemi-pelves durante a marcha. Reforçada pelos ligamentos púbicos superior e inferior.',
    relacoes: 'Atrás dela está o espaço retropúbico de Retzius, extraperitoneal, com o plexo venoso vesical.',
    clinica:
      'Sua frouxidão hormonal na gestação amplia a pelve e é normal; a diástase acima de 10 mm, com dor e incapacidade de deambular, é disjunção púbica e exige tratamento. E na fratura em livro aberto, a estabilização anterior sobre a sínfise é o primeiro passo do controle da hemorragia pélvica — a cinta pélvica pré-hospitalar funciona pelo mesmo princípio, fechando o anel e reduzindo o volume de sangramento.',
    memoria:
      'Cinta pélvica no trauma fecha o "livro" da bacia. Reduzir o volume é reduzir o sangramento — anatomia salvando vida.',
    pontos: [
      'Que tipo de articulação é a sínfise púbica?',
      'Que mudança ela sofre na gestação?',
      'Por que a cinta pélvica reduz o sangramento no trauma?',
    ],
  },
  {
    termos: ['Tubérculo Púbico'],
    classe: 'acidente-osseo',
    resumo: 'Pequena saliência na extremidade lateral da crista púbica, onde termina o ligamento inguinal.',
    localizacao: 'A cerca de 2 a 3 cm da linha média, na borda superior do corpo do púbis; palpável sob a inserção do reto do abdome.',
    funcao: 'Recebe a extremidade medial do ligamento inguinal e a inserção do tendão conjunto.',
    relacoes: 'O anel inguinal superficial está imediatamente acima e lateralmente a ele.',
    clinica:
      'É o divisor de águas do diagnóstico de hérnias da virilha: a hérnia inguinal aparece acima e medialmente ao tubérculo, e a femoral, abaixo e lateralmente. A distinção muda a urgência, porque a femoral encarcera com muito mais frequência — e é feita com um dedo, sem exame de imagem. Também é referência do bloqueio ilioinguinal e da fixação de telas na hernioplastia.',
    memoria:
      'Ache o tubérculo púbico e pergunte: a hérnia está por cima ou por baixo dele? Por cima, inguinal; por baixo, femoral.',
    pontos: [
      'Que estruturas se inserem no tubérculo púbico?',
      'Como ele distingue hérnia inguinal de femoral?',
      'Por que essa distinção é urgente?',
    ],
  },
  {
    termos: ['Limbo do Acetábulo'],
    classe: 'acidente-osseo',
    resumo: 'Borda óssea do acetábulo, prolongada pelo lábio acetabular fibrocartilagíneo.',
    localizacao: 'Margem do acetábulo, interrompida inferiormente pela incisura do acetábulo.',
    funcao:
      'O lábio que a prolonga aumenta em cerca de 20% a área de contato e cria um selo de vedação que mantém a pressão negativa intra-articular — o efeito de sucção que estabiliza o quadril.',
    relacoes: 'Continua-se inferiormente com o ligamento transverso do acetábulo.',
    clinica:
      'A perda desse selo é a base fisiopatológica da lesão labral: o líquido sinovial deixa de ser retido sob pressão, a lubrificação piora e a cartilagem degenera. É o mecanismo pelo qual o impacto femoroacetabular tipo pincer, com sobrecobertura do limbo, leva à artrose precoce em adultos jovens.',
    memoria:
      'O lábio faz uma ventosa em torno da cabeça do fêmur. Rompeu a ventosa, a articulação começa a se desgastar.',
    pontos: [
      'Qual a função do lábio acetabular?',
      'O que é o efeito de selo?',
      'Como a lesão labral leva à artrose?',
    ],
  },
  {
    termos: ['Fossa do Acetábulo'],
    classe: 'acidente-osseo',
    resumo: 'Depressão central e não articular do acetábulo, ocupada por gordura e pelo ligamento da cabeça do fêmur.',
    localizacao: 'Centro do acetábulo, circundada pela face semilunar e aberta inferiormente pela incisura.',
    funcao: 'Contém o coxim adiposo (pulvinar) e o ligamento da cabeça do fêmur, com o ramo acetabular da artéria obturatória.',
    relacoes: 'É a única parte do acetábulo sem cartilagem articular.',
    clinica:
      'Sua parede medial é a mais fina de todo o acetábulo, e por isso é o ponto de fresagem excessiva na artroplastia — a perfuração medial expõe as estruturas intrapélvicas. Um teto acetabular que migra medialmente até ultrapassar a linha ilioisquiática define a protrusão acetabular, achado da artrite reumatoide e da doença de Paget.',
    memoria:
      'O meio do acetábulo não é articular: é gordura. E é a parede mais fina — cuidado ao fresar.',
    pontos: [
      'O que ocupa a fossa do acetábulo?',
      'Por que ela não tem cartilagem?',
      'O que é a protrusão acetabular?',
    ],
  },
  {
    termos: ['Trocanter Menor'],
    classe: 'acidente-osseo',
    resumo: 'Saliência cônica na face posteromedial da junção colo-diáfise femoral, inserção do iliopsoas.',
    localizacao: 'Face posteromedial do fêmur proximal, abaixo do colo.',
    funcao: 'Recebe o tendão do iliopsoas, o mais potente flexor do quadril.',
    inervacao: 'O iliopsoas é inervado pelo nervo femoral (ilíaco) e por ramos diretos de L1–L3 (psoas).',
    clinica:
      'A fratura isolada do trocanter menor no adulto sem trauma significativo é considerada patológica até prova em contrário — em geral metástase —, porque a tração do iliopsoas só arranca um osso que já está enfraquecido. Na criança e no adolescente, a mesma fratura é apofisária e benigna. A mesma imagem, duas leituras opostas conforme a idade.',
    memoria:
      'Trocanter menor arrancado em adulto sem trauma = metástase. Em adolescente atleta = avulsão benigna.',
    pontos: [
      'Que músculo se insere no trocanter menor?',
      'Por que sua fratura isolada preocupa no adulto?',
      'Por que a mesma lesão é benigna no adolescente?',
    ],
  },
  {
    termos: ['Fóvea da Cabeça do Fêmur'],
    classe: 'acidente-osseo',
    resumo: 'Pequena depressão no centro da cabeça femoral, onde se insere o ligamento da cabeça do fêmur.',
    localizacao: 'Ligeiramente abaixo e atrás do centro da superfície articular da cabeça.',
    funcao: 'É a única área da cabeça femoral sem cartilagem articular; ancora o ligamento que conduz o ramo acetabular da artéria obturatória.',
    relacoes: 'Encontra-se dentro da fossa acetabular quando o quadril está em posição neutra.',
    clinica:
      'É um marco de referência na ressonância e na artroscopia do quadril, e a fratura por cisalhamento que a envolve — a fratura de cabeça femoral tipo Pipkin — acompanha a luxação posterior e tem prognóstico definido pela sua relação com a área de carga: traços abaixo da fóvea poupam a superfície de apoio, traços acima a comprometem.',
    memoria:
      'A fóvea é o "umbigo" da cabeça do fêmur: o único ponto sem cartilagem, por onde entrava sangue na infância.',
    pontos: [
      'Que estrutura se insere na fóvea da cabeça do fêmur?',
      'Por que ela não tem cartilagem?',
      'O que define o prognóstico da fratura de Pipkin?',
    ],
  },
  {
    termos: ['Côndilo Medial'],
    classe: 'acidente-osseo',
    resumo: 'Massa articular medial da extremidade distal do fêmur ou proximal da tíbia, conforme o osso.',
    localizacao: 'No fêmur, medialmente à fossa intercondilar; na tíbia, formando o platô medial côncavo.',
    funcao:
      'No fêmur, é mais longo no sentido anteroposterior que o lateral, e essa assimetria produz o mecanismo de parafuso que trava o joelho em extensão.',
    relacoes: 'Seu epicôndilo recebe o ligamento colateral medial e, acima, o tubérculo do adutor.',
    clinica:
      'O compartimento medial recebe 60 a 70% da carga em pé, e é por isso que a artrose de joelho é predominantemente medial e produz o joelho varo progressivo. A osteotomia tibial valgizante transfere a carga para o compartimento lateral poupado — uma cirurgia que não trata a cartilagem doente, apenas redistribui a carga sobre a que restou.',
    memoria:
      'Compartimento medial carrega mais peso e gasta primeiro. Joelho de idoso entorta para dentro, não para fora.',
    pontos: [
      'Que assimetria existe entre os côndilos femorais?',
      'Que proporção da carga passa pelo compartimento medial?',
      'Como a osteotomia valgizante funciona?',
    ],
  },
  {
    termos: ['Côndilo Lateral'],
    classe: 'acidente-osseo',
    resumo: 'Massa articular lateral do fêmur ou da tíbia, com platô tibial convexo do lado da tíbia.',
    localizacao: 'No fêmur, lateralmente à fossa intercondilar; na tíbia, formando o platô lateral convexo.',
    funcao: 'No fêmur, é mais largo e mais proeminente anteriormente, formando a parede lateral da tróclea; na tíbia, sua convexidade torna o compartimento intrinsecamente menos estável.',
    relacoes: 'O epicôndilo lateral recebe o colateral fibular; o tendão do poplíteo nasce num sulco logo abaixo.',
    clinica:
      'A convexidade do platô lateral é a razão de as fraturas de platô tibial serem muito mais frequentes do lado lateral, no mecanismo em valgo — a antiga fratura do para-choque. E o sulco terminal do côndilo femoral lateral é onde ocorre a impactação óssea na rotura do ligamento cruzado anterior, o "sinal do sulco profundo" que denuncia a lesão ligamentar na radiografia simples.',
    memoria:
      'Platô medial é uma tigela; platô lateral é um morro. Por isso o lateral quebra e o menisco lateral precisa se mexer.',
    pontos: [
      'Qual a diferença de forma entre os platôs tibiais?',
      'Por que a fratura de platô é mais comum lateralmente?',
      'O que é o sinal do sulco profundo?',
    ],
  },
  {
    termos: ['Sustentáculo do Tálus'],
    classe: 'acidente-osseo',
    resumo: 'Prateleira óssea na face medial do calcâneo que sustenta o colo do tálus.',
    localizacao: 'Face medial do calcâneo, palpável cerca de 2 cm abaixo do maléolo medial.',
    funcao: 'Sustenta a faceta média da articulação subtalar e serve de polia para o tendão do flexor longo do hálux, que corre num sulco na sua face inferior.',
    relacoes: 'O ligamento calcaneonavicular plantar (mola) fixa-se na sua borda anterior.',
    clinica:
      'É o fragmento constante nas fraturas de calcâneo — o "fragmento sustentacular", que permanece preso ao tálus pelos ligamentos interósseos e serve de referência fixa para reconstruir o osso. Em toda osteossíntese de calcâneo, é a ele que os demais fragmentos são reduzidos. Uma peça que não se move quando tudo o mais se desfaz.',
    memoria:
      'No calcâneo esmagado, uma peça nunca sai do lugar: o sustentáculo. É a âncora do cirurgião.',
    pontos: [
      'Que estruturas o sustentáculo do tálus sustenta?',
      'Que tendão corre sob ele?',
      'Por que ele é a referência nas fraturas de calcâneo?',
    ],
  },
  {
    termos: ['Músculo Reto Femoral'],
    classe: 'musculo',
    resumo: 'Único componente do quadríceps que cruza o quadril, nascendo da espinha ilíaca ântero-inferior.',
    localizacao: 'Da espinha ilíaca ântero-inferior (cabeça direta) e da borda do acetábulo (cabeça refletida) ao tendão do quadríceps.',
    funcao: 'Estende o joelho e flete o quadril — e por ser biarticular, sua eficiência depende da posição do quadril.',
    inervacao: 'Nervo femoral (L2–L4).',
    relacoes: 'É o mais superficial dos quatro ventres, cobrindo o vasto intermédio.',
    clinica:
      'Ser biarticular é o que o torna o ventre mais lesado do quadríceps, sobretudo em chutes e arrancadas, e o que explica o teste de Ely: com o paciente em decúbito ventral, fletir o joelho eleva a pelve quando o reto femoral está encurtado. É também o único componente do quadríceps cuja força muda conforme o quadril esteja fletido ou estendido — informação essencial na avaliação de fraqueza.',
    memoria:
      'Três vastos que só esticam o joelho e um reto que também dobra o quadril. É o reto que se rompe no chute.',
    pontos: [
      'Por que o reto femoral é o único biarticular do quadríceps?',
      'Que teste avalia seu encurtamento?',
      'Por que ele é o mais lesado do grupo?',
    ],
  },
  {
    termos: ['Músculo Vasto Medial'],
    classe: 'musculo',
    resumo: 'Ventre medial do quadríceps, cujas fibras oblíquas distais estabilizam a patela medialmente.',
    localizacao: 'Da linha áspera e da linha intertrocantérica ao tendão do quadríceps e ao retináculo patelar medial.',
    funcao:
      'Suas fibras mais distais e mais oblíquas — o vasto medial oblíquo — inserem-se quase horizontalmente na patela e são o principal freio muscular contra o deslocamento lateral dela.',
    inervacao: 'Nervo femoral (L2–L4).',
    relacoes: 'É o ventre que forma a proeminência muscular acima e medialmente à patela.',
    clinica:
      'É o primeiro músculo a atrofiar em qualquer patologia do joelho, e visivelmente: comparar as duas coxas quatro dedos acima da patela revela a atrofia antes de qualquer exame. Seu fortalecimento seletivo é a base da reabilitação da dor femoropatelar, precisamente porque ele é o antagonista muscular do vetor lateral do quadríceps.',
    memoria:
      'Joelho que doeu, vasto medial que sumiu. É o primeiro a atrofiar e o último a voltar.',
    pontos: [
      'O que é o vasto medial oblíquo?',
      'Que função ele exerce sobre a patela?',
      'Por que ele é o primeiro a atrofiar?',
    ],
  },
  {
    termos: ['Músculo Vasto Lateral'],
    classe: 'musculo',
    resumo: 'O maior e mais potente ventre do quadríceps, na face lateral da coxa.',
    localizacao: 'Do trocanter maior e do lábio lateral da linha áspera ao tendão do quadríceps e ao retináculo patelar lateral.',
    funcao: 'Estende o joelho; sua tração lateral é contrabalançada pelo vasto medial oblíquo.',
    inervacao: 'Nervo femoral (L2–L4).',
    relacoes: 'Está profundo ao trato iliotibial, com o qual pode formar aderências.',
    clinica:
      'É o local preferencial da injeção intramuscular no lactente — o terço médio da face anterolateral da coxa —, por ser volumoso e distante de nervos e vasos importantes. Seu desequilíbrio com o vasto medial, junto com a retração do retináculo lateral, é o mecanismo da síndrome de hiperpressão lateral da patela.',
    memoria:
      'Vacina em bebê vai no vasto lateral: músculo grande, sem nervo importante por perto. É o lugar mais seguro.',
    pontos: [
      'Por que o vasto lateral é o sítio de injeção no lactente?',
      'Que estrutura o recobre?',
      'Como seu desequilíbrio afeta a patela?',
    ],
  },
  {
    termos: ['Músculo Vasto Intermédio'],
    classe: 'musculo',
    resumo: 'Ventre profundo do quadríceps, coberto pelo reto femoral, com o articular do joelho na sua face profunda.',
    localizacao: 'Das faces anterior e lateral do corpo do fêmur ao tendão do quadríceps, profundamente ao reto femoral.',
    funcao: 'Estende o joelho; suas fibras mais profundas formam o músculo articular do joelho, que traciona a bolsa suprapatelar e impede que ela seja pinçada na extensão.',
    inervacao: 'Nervo femoral (L2–L4).',
    relacoes: 'Adere diretamente ao periósteo do fêmur em boa parte da sua extensão.',
    clinica:
      'Essa aderência ao osso é a razão de ele ser o ventre que mais forma aderências após fratura de fêmur ou cirurgia, produzindo rigidez em extensão do joelho — e é justamente esse plano que se libera na quadricepsplastia de Judet. O músculo articular do joelho, sua porção profunda, é o que evita o pinçamento sinovial doloroso na extensão máxima.',
    memoria:
      'O vasto intermédio está colado no osso. Osso que quebra e cicatriza gruda o músculo — e o joelho não dobra mais.',
    pontos: [
      'Onde se situa o vasto intermédio em relação aos outros ventres?',
      'O que é o músculo articular do joelho?',
      'Por que ele causa rigidez após fraturas de fêmur?',
    ],
  },
  {
    termos: ['Músculo Semitendíneo'],
    classe: 'musculo',
    resumo: 'Isquiotibial medial superficial, com um tendão longo que integra a pata de ganso.',
    localizacao: 'Do túber isquiático à face medial da tíbia, na pata de ganso, junto com o sartório e o grácil.',
    funcao: 'Estende o quadril, flete o joelho e roda a perna medialmente.',
    inervacao: 'Divisão tibial do nervo isquiático (L5–S2).',
    relacoes: 'Seu tendão é o mais posterior e o mais palpável da face medial do joelho.',
    clinica:
      'É o tendão doador mais usado do corpo: com o grácil, forma o enxerto de tendões flexores para reconstrução do ligamento cruzado anterior, uma das cirurgias ortopédicas mais realizadas. O tendão regenera parcialmente em cerca de 70% dos casos, e a perda de força de flexão profunda do joelho é o custo funcional documentado dessa retirada.',
    memoria:
      'Semitendíneo é "meio tendão": ventre curto e tendão longo. É por isso que ele vira enxerto de cruzado.',
    pontos: [
      'Que grupo tendíneo o semitendíneo integra na tíbia?',
      'Que nervo o inerva?',
      'Qual seu uso cirúrgico mais comum?',
    ],
  },
  {
    termos: ['Músculo Semimembranáceo'],
    classe: 'musculo',
    resumo: 'Isquiotibial medial profundo, com aponeurose ampla e inserção complexa no côndilo medial da tíbia.',
    localizacao: 'Do túber isquiático ao côndilo medial da tíbia, com expansões para o ligamento poplíteo oblíquo e para a fáscia do poplíteo.',
    funcao: 'Estende o quadril, flete o joelho, roda a perna medialmente e traciona o menisco medial posteriormente na flexão, evitando que ele seja pinçado.',
    inervacao: 'Divisão tibial do nervo isquiático (L5–S2).',
    relacoes: 'Sua bolsa, entre ele e a cabeça medial do gastrocnêmio, é onde se forma o cisto de Baker.',
    clinica:
      'A tração dinâmica do menisco medial é uma função pouco lembrada e clinicamente relevante: sua perda contribui para a lesão do corno posterior. E a bolsa semimembranosa-gastrocnêmica, que se comunica com a articulação em cerca de metade dos adultos, é a origem do cisto de Baker — cuja rotura simula trombose venosa profunda e é o principal diagnóstico diferencial da panturrilha dolorosa aguda.',
    memoria:
      'Cisto de Baker fica entre o semimembranáceo e o gastrocnêmio medial. Rompeu, parece trombose — e o ultrassom decide.',
    pontos: [
      'Que função o semimembranáceo exerce sobre o menisco medial?',
      'Onde se forma o cisto de Baker?',
      'Que nervo inerva esse músculo?',
    ],
  },
  {
    termos: ['Músculo Bíceps Femoral'],
    classe: 'musculo',
    resumo: 'Isquiotibial lateral com duas cabeças e duas inervações distintas.',
    localizacao: 'Cabeça longa do túber isquiático e cabeça curta da linha áspera, unindo-se num tendão que se insere na cabeça da fíbula.',
    funcao: 'Flete o joelho e roda a perna lateralmente; a cabeça longa também estende o quadril.',
    inervacao:
      'Cabeça longa pela divisão tibial e cabeça curta pela divisão fibular comum do nervo isquiático — o único músculo do corpo inervado pelas duas divisões.',
    relacoes: 'Seu tendão forma a borda superolateral da fossa poplítea, com o nervo fibular comum imediatamente medial a ele.',
    clinica:
      'A dupla inervação faz dele um músculo-chave na eletroneuromiografia: a comparação entre as duas cabeças ajuda a localizar lesões altas do isquiático e a distingui-las de lesões isoladas do fibular comum. E seu tendão é o guia palpável para encontrar o nervo fibular comum antes de qualquer abordagem posterolateral do joelho.',
    memoria:
      'Siga o tendão do bíceps femoral até a cabeça da fíbula: o nervo fibular comum está logo por dentro dele.',
    pontos: [
      'Por que o bíceps femoral tem dupla inervação?',
      'Onde ele se insere?',
      'Como seu tendão ajuda a localizar o nervo fibular comum?',
    ],
  },
  {
    termos: ['Músculo Glúteo Médio'],
    classe: 'musculo',
    resumo: 'Principal abdutor do quadril e estabilizador da pelve no apoio unipodal.',
    localizacao: 'Da face glútea do ílio, entre as linhas glúteas anterior e posterior, à face lateral do trocânter maior.',
    funcao:
      'Abduz o quadril, mas sua função decisiva é outra: na fase de apoio da marcha, ele impede que a pelve caia para o lado que está no ar. Sem ele, cada passo seria uma queda lateral.',
    inervacao: 'Nervo glúteo superior (L4–S1), que sai acima do piriforme.',
    relacoes: 'Suas fibras anteriores rodam medialmente o quadril; as posteriores, lateralmente.',
    clinica:
      'Sua insuficiência produz o sinal de Trendelenburg, e é preciso ter cuidado com o lado: a pelve cai do lado oposto ao músculo doente. A lesão do nervo glúteo superior é complicação conhecida da via lateral da artroplastia de quadril e da injeção intramuscular mal posicionada — motivo pelo qual a técnica ventroglútea substituiu a dorsoglútea.',
    memoria:
      'Trendelenburg: o quadril que cai é o do lado bom. O músculo doente é o do lado em que a pessoa está apoiada.',
    pontos: [
      'Qual a função principal do glúteo médio na marcha?',
      'Que nervo o inerva?',
      'Que lado o sinal de Trendelenburg acusa?',
    ],
  },
  {
    termos: ['Músculo Glúteo Mínimo'],
    classe: 'musculo',
    resumo: 'O mais profundo dos glúteos, abdutor e rotador medial do quadril.',
    localizacao: 'Da face glútea do ílio, entre as linhas glúteas anterior e inferior, à face anterior do trocânter maior.',
    funcao: 'Abduz e roda medialmente o quadril, atuando junto com o glúteo médio; sua parte profunda tem expansão para a cápsula articular, que ele traciona e protege do pinçamento.',
    inervacao: 'Nervo glúteo superior (L4–S1).',
    relacoes: 'Está profundo ao glúteo médio e superficial à cápsula do quadril.',
    clinica:
      'A tendinopatia dos glúteos médio e mínimo na inserção trocantérica é hoje reconhecida como a causa mais comum da dor lateral do quadril, substituindo o antigo rótulo de "bursite trocantérica" — e a distinção importa, porque tendinopatia se trata com carga progressiva, não com infiltração repetida. A rotura desses tendões é o "manguito rotador do quadril" roto, com Trendelenburg persistente.',
    memoria:
      'Dor na lateral do quadril quase nunca é bursa: é tendão de glúteo. Trate como tendinopatia, não como inflamação.',
    pontos: [
      'Que ações o glúteo mínimo realiza?',
      'Que função capsular ele exerce?',
      'Qual a causa mais comum de dor lateral do quadril?',
    ],
  },
  {
    termos: ['Músculo Grácil'],
    classe: 'musculo',
    resumo: 'Músculo mais superficial e mais medial da coxa, o único adutor que cruza o joelho.',
    localizacao: 'Do ramo inferior do púbis à face medial da tíbia, na pata de ganso.',
    funcao: 'Aduz o quadril e flete e roda medialmente o joelho — por ser biarticular, é o único adutor com ação sobre o joelho.',
    inervacao: 'Nervo obturatório (L2–L4).',
    relacoes: 'Seu tendão é o mais anterior dos três da pata de ganso a partir do plano profundo.',
    clinica:
      'É o músculo doador de escolha para transferências funcionais livres com microanastomose: sua retirada não deixa déficit significativo, o pedículo é constante e o ventre é longo. É usado na reanimação do sorriso na paralisia facial de longa data e na reconstrução de esfíncteres — um músculo dispensável que virou peça de reposição.',
    memoria:
      'O grácil é o "músculo sobressalente" da coxa: dá para tirar inteiro e transplantar para a face.',
    pontos: [
      'Por que o grácil é o único adutor que age sobre o joelho?',
      'Que nervo o inerva?',
      'Que usos cirúrgicos ele tem?',
    ],
  },
  {
    termos: ['Músculo Adutor Longo'],
    classe: 'musculo',
    resumo: 'Adutor mais anterior e mais palpável da coxa, cujo tendão delimita o trígono femoral.',
    localizacao: 'Do corpo do púbis, abaixo da crista, ao terço médio do lábio medial da linha áspera.',
    funcao: 'Aduz e auxilia a flexão do quadril; seu tendão de origem é estreito e facilmente palpável na virilha.',
    inervacao: 'Ramo anterior do nervo obturatório (L2–L4).',
    relacoes: 'Sua borda medial forma o limite medial do trígono femoral e o limite lateral do canal dos adutores.',
    clinica:
      'É o músculo do estiramento de virilha do atleta, e sua inserção púbica é o outro polo da pubalgia — o cabo de guerra com o reto do abdome sobre o mesmo osso. A palpação do seu tendão com adução resistida reproduz a dor e distingue a lesão de uma hérnia inguinal, que é o principal diagnóstico diferencial.',
    memoria:
      'Reto do abdome puxa o púbis para cima; adutor longo puxa para baixo. A pubalgia do atleta é esse empate.',
    pontos: [
      'Que estruturas o adutor longo delimita?',
      'Que nervo o inerva?',
      'Como distinguir sua lesão de uma hérnia inguinal?',
    ],
  },
  {
    termos: ['Músculo Gastrocnêmio'],
    classe: 'musculo',
    resumo: 'Músculo superficial da panturrilha, com duas cabeças que nascem acima do joelho.',
    localizacao: 'Das faces posteriores dos côndilos femorais ao tendão do calcâneo.',
    funcao:
      'Flete plantarmente o pé e flete o joelho. Por ser biarticular, sua força de flexão plantar cai quando o joelho está fletido — o que permite testá-lo separadamente do sóleo.',
    inervacao: 'Nervo tibial (S1–S2).',
    relacoes: 'Suas cabeças formam as bordas inferiores da fossa poplítea.',
    clinica:
      'Esse comportamento biarticular é a base do teste de Silfverskiöld: se a dorsiflexão melhora ao fletir o joelho, o encurtamento é do gastrocnêmio; se não muda, é do sóleo — e a cirurgia é diferente em cada caso. O encurtamento isolado do gastrocnêmio é hoje reconhecido como fator de fascite plantar, metatarsalgia e úlcera plantar no diabético.',
    memoria:
      'Dobre o joelho e teste a dorsiflexão: se melhorou, o curto é o gastrocnêmio. Se não, é o sóleo.',
    pontos: [
      'Por que o gastrocnêmio é biarticular?',
      'O que é o teste de Silfverskiöld?',
      'Que problemas o encurtamento do gastrocnêmio causa?',
    ],
  },
  {
    termos: ['Músculo Sóleo'],
    classe: 'musculo',
    resumo: 'Músculo profundo e largo da panturrilha, o motor postural da flexão plantar.',
    localizacao: 'Da linha do sóleo na tíbia, da cabeça e da margem posterior da fíbula, até o tendão do calcâneo, sob o gastrocnêmio.',
    funcao:
      'Flete plantarmente o pé independentemente da posição do joelho, por ser monoarticular. É rico em fibras tipo I, de contração lenta e resistentes à fadiga — o músculo que mantém a postura em pé por horas.',
    inervacao: 'Nervo tibial (S1–S2).',
    relacoes: 'Seu arco tendíneo é atravessado pelo feixe tibial posterior; suas veias intramusculares são amplas e sinusoidais.',
    clinica:
      'Essas veias sinusoidais e a contração intermitente do sóleo formam a "bomba muscular da panturrilha" — o segundo coração —, e sua inatividade na imobilidade é o fator central da estase venosa da tríade de Virchow. É por isso que a deambulação precoce e a compressão pneumática intermitente são a base da profilaxia da trombose venosa profunda.',
    memoria:
      'O sóleo é o segundo coração: cada passo empurra sangue para cima. Parado na cama, o sangue estagna e coagula.',
    pontos: [
      'Por que o sóleo é monoarticular e o que isso implica?',
      'Que tipo de fibra predomina nele?',
      'O que é a bomba muscular da panturrilha?',
    ],
  },
  {
    termos: ['Músculo Fibular Longo'],
    classe: 'musculo',
    resumo: 'Músculo do compartimento lateral cujo tendão cruza toda a planta do pé.',
    localizacao: 'Da cabeça e dos dois terços proximais da fíbula, contornando o maléolo lateral e o cuboide até o cuneiforme medial e a base do 1º metatarso.',
    funcao: 'Everte o pé e faz a flexão plantar do primeiro raio, empurrando a cabeça do 1º metatarso contra o chão na propulsão.',
    inervacao: 'Nervo fibular superficial (L5–S1).',
    relacoes: 'Sua origem forma um túnel fibroso em torno do nervo fibular comum, no colo da fíbula.',
    clinica:
      'Esse túnel fibroso é o ponto exato de compressão do nervo fibular comum, causa mais comum de pé caído. E o desequilíbrio entre o fibular longo, forte, e o tibial anterior, fraco, é o mecanismo do pé cavovaro da doença de Charcot-Marie-Tooth — em que a transferência do fibular longo para o curto é parte do tratamento cirúrgico.',
    memoria:
      'É o único tendão que atravessa a planta do pé de fora para dentro. E, na origem dele, o nervo do pé caído fica preso.',
    pontos: [
      'Qual o trajeto singular do tendão do fibular longo?',
      'Que ação ele exerce sobre o primeiro raio?',
      'Por que sua origem é ponto de compressão nervosa?',
    ],
  },
  {
    termos: ['Músculo Fibular Curto'],
    classe: 'musculo',
    resumo: 'Músculo do compartimento lateral que se insere na base do 5º metatarso — o principal eversor do pé.',
    localizacao: 'Dos dois terços distais da face lateral da fíbula à tuberosidade da base do 5º metatarso.',
    funcao: 'É o eversor mais eficiente, pelo maior braço de alavanca lateral; sua tração é a que arranca a base do 5º metatarso na inversão forçada.',
    inervacao: 'Nervo fibular superficial (L5–S1).',
    relacoes: 'No sulco retromaleolar, corre em contato direto com o osso, com o fibular longo por trás.',
    clinica:
      'Essa posição encostada no osso é a causa das lesões longitudinais por atrito do fibular curto, típicas de instabilidade lateral crônica do tornozelo e frequentemente descobertas apenas na cirurgia. E sua tração na entorse produz a fratura por avulsão da base do 5º metatarso — que consolida bem e não deve ser confundida com a fratura de Jones, 1,5 cm adiante, que evolui para pseudartrose.',
    memoria:
      'Fibular curto se insere perto (5º metatarso); o longo vai longe (1º metatarso). O nome diz o destino.',
    pontos: [
      'Por que o fibular curto é o eversor mais eficiente?',
      'Que fratura sua tração pode causar?',
      'Por que ele sofre lesões longitudinais?',
    ],
  },
  /* ─────────────────── Tronco e neuro ─────────────────── */
  {
    termos: ['Músculo Oblíquo Externo'],
    classe: 'musculo',
    resumo: 'Camada mais superficial da parede abdominal lateral, com fibras que descem para dentro.',
    localizacao: 'Das oito últimas costelas à crista ilíaca, ao ligamento inguinal e à linha alba; suas fibras correm "como as mãos nos bolsos".',
    funcao: 'Flete e roda o tronco para o lado oposto; sua aponeurose forma a lâmina anterior da bainha do reto e o ligamento inguinal.',
    inervacao: 'Nervos intercostais T7 a T11 e subcostal.',
    relacoes: 'A borda inferior enrolada da sua aponeurose forma o ligamento inguinal, e a abertura nele é o anel inguinal superficial.',
    clinica:
      'Sua aponeurose é o tecido preferido para reforço em hernioplastias e o plano incisado nas incisões de McBurney e de Pfannenstiel. A rotação contralateral é a razão de o oblíquo externo direito trabalhar junto com o oblíquo interno esquerdo — e esse par cruzado é a chamada cadeia oblíqua anterior, base dos exercícios funcionais de tronco.',
    memoria:
      'Mãos nos bolsos: as fibras do oblíquo externo descem para dentro. E ele roda o tronco para o lado contrário.',
    pontos: [
      'Qual a direção das fibras do oblíquo externo?',
      'Que estruturas sua aponeurose forma?',
      'Para que lado ele roda o tronco?',
    ],
  },
  {
    termos: ['Músculo Oblíquo Interno'],
    classe: 'musculo',
    resumo: 'Camada média da parede abdominal, com fibras que sobem para dentro, cruzando as do externo.',
    localizacao: 'Da fáscia toracolombar, da crista ilíaca e do ligamento inguinal às três últimas costelas e à linha alba.',
    funcao: 'Flete e roda o tronco para o mesmo lado; sua aponeurose se desdobra e contribui para as duas lâminas da bainha do reto acima da linha arqueada.',
    inervacao: 'Nervos intercostais T7 a T11, subcostal, ílio-hipogástrico e ilioinguinal.',
    relacoes: 'Suas fibras inferiores, com as do transverso, formam o tendão conjunto e originam o músculo cremaster.',
    clinica:
      'O tendão conjunto é o reforço natural da parede posterior do canal inguinal, e sua fraqueza é o mecanismo da hérnia inguinal direta — que sai medialmente aos vasos epigástricos inferiores, enquanto a indireta sai lateralmente a eles, pelo anel profundo. Essa relação com os vasos epigástricos é o critério anatômico que separa os dois tipos, visível na laparoscopia.',
    memoria:
      'Indireta é lateral aos vasos epigástricos; direta é medial. Os vasos são a linha divisória das duas hérnias.',
    pontos: [
      'Qual a direção das fibras do oblíquo interno?',
      'O que é o tendão conjunto?',
      'Como os vasos epigástricos separam hérnia direta de indireta?',
    ],
  },
  {
    termos: ['Músculo Longuíssimo'],
    classe: 'musculo',
    resumo: 'Coluna intermediária e mais longa do eretor da espinha, do sacro ao processo mastoide.',
    localizacao: 'Entre o iliocostal, lateralmente, e o espinal, medialmente; divide-se em porções torácica, cervical e da cabeça.',
    funcao: 'Estende e inclina lateralmente a coluna; a porção da cabeça estende e roda a cabeça para o mesmo lado.',
    inervacao: 'Ramos posteriores dos nervos espinais.',
    relacoes: 'É a coluna mais extensa das três e a que alcança o crânio.',
    clinica:
      'Sua função excêntrica — frear a flexão do tronco — é o que sobrecarrega o eretor ao levantar peso com as costas curvadas, mecanismo da lombalgia mecânica aguda. E o fenômeno de flexão-relaxamento, em que o eretor silencia eletromiograficamente na flexão máxima do tronco em pessoas saudáveis, está ausente em pacientes com lombalgia crônica — um marcador objetivo de disfunção.',
    memoria:
      'I-L-E, de lateral para medial: Iliocostal, Longuíssimo, Espinal. O longuíssimo é o único que chega ao crânio.',
    pontos: [
      'Onde o longuíssimo se situa entre as colunas do eretor?',
      'Que porção dele alcança o crânio?',
      'O que é o fenômeno de flexão-relaxamento?',
    ],
  },
  {
    termos: ['Músculo Iliocostal'],
    classe: 'musculo',
    resumo: 'Coluna mais lateral do eretor da espinha, que se insere nos ângulos das costelas.',
    localizacao: 'Da crista ilíaca e do sacro aos ângulos das costelas e aos processos transversos cervicais, em porções lombar, torácica e cervical.',
    funcao: 'Estende e inclina lateralmente a coluna; por se inserir nas costelas, participa também da mecânica respiratória.',
    inervacao: 'Ramos posteriores dos nervos espinais.',
    relacoes: 'É a coluna mais lateral e mais superficial das três.',
    clinica:
      'Por ser a mais lateral, é a coluna atravessada no bloqueio do plano do eretor da espinha, técnica de analgesia regional que se difundiu rapidamente em cirurgia torácica e abdominal. Sua posição sobre as costelas explica também a dor referida em faixa que acompanha os pontos-gatilho lombares altos, frequentemente confundida com dor renal.',
    memoria:
      'Iliocostal liga o ílio às costelas — o nome descreve o trajeto inteiro. E é a coluna mais de fora.',
    pontos: [
      'Onde o iliocostal se insere?',
      'Que posição ele ocupa entre as colunas do eretor?',
      'Que técnica de analgesia usa esse plano?',
    ],
  },
  {
    termos: ['Lobo Frontal'],
    classe: 'snc',
    resumo: 'Maior lobo do encéfalo, à frente do sulco central e acima do sulco lateral.',
    localizacao: 'Da região polar frontal ao sulco central, ocupando cerca de um terço do córtex.',
    funcao: 'Contém o córtex motor primário, o pré-motor, a área motora suplementar, o campo ocular frontal, a área de Broca e todo o córtex pré-frontal.',
    vascularizacao: 'Artérias cerebrais anterior e média.',
    clinica:
      'É o lobo cuja lesão muda a pessoa e não a função: síndrome disexecutiva na lesão dorsolateral, desinibição na órbito-frontal e apatia na medial. Também é a sede dos reflexos primitivos liberados — preensão, sucção e palmomentual —, cuja reaparição no adulto indica disfunção frontal. E é o lobo mais atingido no TCE por golpe-contragolpe.',
    memoria:
      'Lobo frontal não faz você "perder" nada visível: faz você virar outra pessoa. É por isso que a família percebe antes do médico.',
    pontos: [
      'Que áreas funcionais o lobo frontal contém?',
      'Quais são as três síndromes frontais clássicas?',
      'O que são reflexos primitivos liberados?',
    ],
  },
  {
    termos: ['Lobo Parietal'],
    classe: 'snc',
    resumo: 'Lobo entre o sulco central e o parietoccipital, responsável pela integração somatossensitiva e espacial.',
    localizacao: 'Do sulco central ao sulco parietoccipital, acima do sulco lateral.',
    funcao: 'Contém o córtex somatossensitivo primário, os lóbulos parietais superior e inferior, o giro supramarginal e o angular.',
    vascularizacao: 'Artérias cerebrais média e anterior.',
    clinica:
      'A lateralidade importa mais aqui do que em qualquer outro lobo: à esquerda (dominante), sua lesão produz a síndrome de Gerstmann e apraxias; à direita, a heminegligência espacial com anosognosia. Um mesmo lobo, dois lados, duas síndromes que não se parecem em nada — e é essa dissociação que melhor demonstra a especialização hemisférica.',
    memoria:
      'Parietal esquerdo: não escreve, não calcula. Parietal direito: não enxerga metade do mundo e não sabe disso.',
    pontos: [
      'Que áreas funcionais o lobo parietal contém?',
      'Como suas síndromes diferem entre os hemisférios?',
      'O que é anosognosia?',
    ],
  },
  {
    termos: ['Lobo Temporal'],
    classe: 'snc',
    resumo: 'Lobo abaixo do sulco lateral, sede da audição, da memória e da compreensão da linguagem.',
    localizacao: 'Abaixo do sulco lateral, na fossa craniana média, com face lateral, inferior e medial.',
    funcao: 'Contém o córtex auditivo primário, a área de Wernicke, o hipocampo, a amígdala e o giro fusiforme.',
    vascularizacao: 'Artérias cerebrais média e posterior.',
    clinica:
      'É o lobo mais epileptogênico do encéfalo: a esclerose mesial temporal é a causa mais comum de epilepsia focal refratária do adulto, e a cirurgia — amígdalo-hipocampectomia — tem taxa de controle de crises superior a 60%, muito acima de qualquer medicamento nesses casos. As crises começam com aura epigástrica ascendente, déjà-vu ou medo, e evoluem com automatismos oroalimentares.',
    memoria:
      'Aura de "frio na barriga" subindo, seguida de olhar parado e mastigação: crise de lobo temporal mesial.',
    pontos: [
      'Que estruturas o lobo temporal contém?',
      'Por que ele é o mais epileptogênico?',
      'Como se apresenta uma crise temporal mesial?',
    ],
  },
  {
    termos: ['Lobo Occipital'],
    classe: 'snc',
    resumo: 'Menor lobo do encéfalo, atrás do sulco parietoccipital, dedicado inteiramente à visão.',
    localizacao: 'Porção posterior do hemisfério, acima da tenda do cerebelo.',
    funcao: 'Contém o córtex visual primário (V1), nas margens do sulco calcarino, e as áreas visuais associativas.',
    vascularizacao: 'Artéria cerebral posterior, com contribuição da cerebral média no polo.',
    clinica:
      'Sua lesão bilateral produz cegueira cortical, com pupilas reativas e fundo de olho normal — e, quando acompanhada de negação do déficit, a síndrome de Anton. É também o território mais afetado na síndrome de encefalopatia posterior reversível (PRES), associada a hipertensão grave, eclâmpsia e imunossupressores, com edema occipital bilateral e cegueira que reverte com o tratamento.',
    memoria:
      'Cego com pupila que reage e retina normal: o problema está atrás, no córtex, não no olho.',
    pontos: [
      'Onde se localiza o córtex visual primário?',
      'Que artéria irriga o lobo occipital?',
      'O que é a síndrome de Anton?',
    ],
  },
  {
    termos: ['Ventrículo Lateral'],
    classe: 'ventriculo',
    resumo: 'Maior cavidade ventricular, em forma de C, uma em cada hemisfério cerebral.',
    localizacao: 'Corno frontal, corpo, átrio, corno occipital e corno temporal, acompanhando a curva do hemisfério.',
    funcao: 'Contém o plexo corióideo, que produz a maior parte do líquor; comunica-se com o terceiro ventrículo pelo forame interventricular.',
    relacoes: 'O corno temporal está acima do hipocampo; o átrio contém o glomo corióideo.',
    clinica:
      'A dilatação do corno temporal é o sinal mais precoce e mais sensível de hidrocefalia na tomografia — mais confiável que a medida do índice de Evans. E o corno frontal é a via de acesso da derivação ventricular externa, puncionada no ponto de Kocher, cerca de 11 cm atrás da glabela e 3 cm lateralmente à linha média, para evitar o córtex motor.',
    memoria:
      'Na dúvida sobre hidrocefalia, olhe o corno temporal: ele dilata antes de todo o resto.',
    pontos: [
      'Que partes compõem o ventrículo lateral?',
      'Qual o sinal mais precoce de hidrocefalia?',
      'Onde se punciona o ventrículo na derivação externa?',
    ],
  },
  {
    termos: ['III Ventrículo'],
    classe: 'ventriculo',
    resumo: 'Cavidade estreita e mediana do diencéfalo, entre os dois tálamos.',
    localizacao: 'Linha média, entre os tálamos e os hipotálamos, comunicando-se com os laterais pelos forames interventriculares e com o quarto pelo aqueduto.',
    funcao: 'Conduz o líquor e apresenta recessos característicos: supraóptico, infundibular, pineal e suprapineal.',
    relacoes: 'Seu assoalho é formado pelo quiasma, pelo túber cinéreo, pelos corpos mamilares e pela substância perfurada posterior.',
    clinica:
      'A terceiroventriculostomia endoscópica — perfuração do assoalho entre o infundíbulo e os corpos mamilares — é o tratamento de escolha da hidrocefalia obstrutiva, e evita a derivação ventrículo-peritoneal e suas complicações. É um procedimento definido por milímetros de anatomia: à frente está o infundíbulo, atrás os corpos mamilares, e abaixo, a artéria basilar.',
    memoria:
      'Furar o assoalho do III ventrículo trata hidrocefalia sem válvula. Mas embaixo dele está a basilar — não há margem para erro.',
    pontos: [
      'Que estruturas formam o assoalho do terceiro ventrículo?',
      'Que recessos ele apresenta?',
      'O que é a terceiroventriculostomia endoscópica?',
    ],
  },
  {
    termos: ['IV Ventrículo'],
    classe: 'ventriculo',
    resumo: 'Cavidade losangular entre o tronco encefálico e o cerebelo, com as aberturas por onde o líquor sai.',
    localizacao: 'Entre a ponte e o bulbo, à frente, e o cerebelo, atrás; seu assoalho é a fossa romboide.',
    funcao:
      'É por ele que o líquor deixa o sistema ventricular: pelas duas aberturas laterais (forames de Luschka) e pela abertura mediana (forame de Magendie), alcançando o espaço subaracnóideo.',
    relacoes: 'Seu assoalho contém os núcleos de vários nervos cranianos; o teto é formado pelos véus medulares e pelo cerebelo.',
    clinica:
      'A obstrução dessas saídas produz hidrocefalia não comunicante com dilatação de todos os quatro ventrículos — padrão que distingue esse nível de obstrução da estenose de aqueduto, em que o quarto permanece normal. Na síndrome de Dandy-Walker, a atresia dessas aberturas se associa a cisto da fossa posterior e agenesia do verme.',
    memoria:
      'Todos os quatro ventrículos dilatados: o bloqueio é na saída do IV. Só três dilatados: é no aqueduto.',
    pontos: [
      'Por onde o líquor sai do sistema ventricular?',
      'Que padrão de dilatação sua obstrução produz?',
      'O que é a síndrome de Dandy-Walker?',
    ],
  },
  {
    termos: ['Carina'],
    classe: 'via-aerea',
    resumo: 'Crista sagital na bifurcação da traqueia, entre os dois brônquios principais.',
    localizacao: 'Ao nível do ângulo esternal (T4–T5), no plano transverso do tórax.',
    funcao: 'Marca a divisão da traqueia; sua mucosa é a região mais sensível de toda a via aérea inferior.',
    inervacao: 'Nervo vago, com fibras do reflexo de tosse.',
    relacoes: 'Está imediatamente abaixo do arco aórtico e à frente do esôfago.',
    clinica:
      'É a estrutura mais sensível ao reflexo de tosse, e por isso o contato da ponta do tubo com a carina provoca broncoespasmo e tosse no paciente sob anestesia superficial — motivo pelo dimensionamento da profundidade da intubação. O alargamento do ângulo da carina na radiografia sugere aumento do átrio esquerdo ou massa subcarinal. E o tumor de carina é a lesão de via aérea de ressecção mais complexa que existe.',
    memoria:
      'A carina é o ponto de maior reflexo de tosse do corpo. Tubo encostando nela é paciente tossindo.',
    pontos: [
      'Em que nível se localiza a carina?',
      'Por que ela é a região mais sensível da via aérea?',
      'O que o alargamento do ângulo da carina sugere?',
    ],
  },
  {
    termos: ['Brônquio Principal Direito'],
    classe: 'via-aerea',
    resumo: 'Brônquio mais curto, mais largo e mais vertical, o destino natural dos corpos estranhos.',
    localizacao: 'Da carina ao hilo direito, com cerca de 2,5 cm e ângulo de aproximadamente 25° com a vertical.',
    funcao: 'Ventila o pulmão direito; divide-se em três brônquios lobares, sendo o superior eparterial.',
    relacoes: 'A veia ázigo arqueia-se sobre ele; a artéria pulmonar direita está à sua frente.',
    clinica:
      'Ser mais vertical e mais largo é a razão de a aspiração de corpo estranho e a intubação seletiva acidental ocorrerem quase sempre à direita — e de a atelectasia do lobo superior direito ser a consequência mais comum de um tubo introduzido além do necessário. Em adultos em decúbito dorsal, a pneumonia aspirativa segue o mesmo caminho.',
    memoria:
      'Tudo que cai na traqueia vai para a direita: o brônquio direito é mais largo, mais curto e mais reto.',
    pontos: [
      'Por que corpos estranhos vão preferencialmente para a direita?',
      'Que estrutura venosa arqueia sobre esse brônquio?',
      'O que é um brônquio eparterial?',
    ],
  },
  {
    termos: ['Brônquio Principal Esquerdo'],
    classe: 'via-aerea',
    resumo: 'Brônquio mais longo, mais estreito e mais horizontal, que passa sob o arco aórtico.',
    localizacao: 'Da carina ao hilo esquerdo, com cerca de 5 cm e ângulo de aproximadamente 45° com a vertical.',
    funcao: 'Ventila o pulmão esquerdo; divide-se em apenas dois brônquios lobares.',
    relacoes: 'Passa sob o arco aórtico e à frente do esôfago; a artéria pulmonar esquerda está acima dele.',
    clinica:
      'Seu trajeto sob o arco aórtico e a relação com o átrio esquerdo explicam o sinal de Ortner: o aumento do átrio esquerdo na estenose mitral eleva o brônquio principal esquerdo e estira o nervo laríngeo recorrente, produzindo rouquidão. E a intubação seletiva esquerda, necessária na ventilação monopulmonar, é tecnicamente mais difícil justamente por causa do ângulo.',
    memoria:
      'O brônquio esquerdo passa por baixo do arco da aorta e é mais deitado. Por isso é mais difícil de intubar seletivamente.',
    pontos: [
      'Que diferenças o brônquio esquerdo tem em relação ao direito?',
      'Que estruturas se relacionam com ele?',
      'O que é o sinal de Ortner?',
    ],
  },
  {
    termos: ['Língula'],
    classe: 'via-aerea',
    resumo: 'Projeção em língua do lobo superior esquerdo, equivalente funcional do lobo médio direito.',
    localizacao: 'Porção anteroinferior do lobo superior esquerdo, abaixo da incisura cardíaca, sobre o pericárdio.',
    funcao: 'Contém os segmentos lingulares superior e inferior, ventilados por um brônquio próprio que nasce do brônquio lobar superior esquerdo.',
    relacoes: 'Repousa diretamente sobre a borda esquerda do coração.',
    clinica:
      'Sua consolidação apaga a borda cardíaca esquerda na radiografia — o sinal da silhueta —, o que a localiza sem necessidade de perfil. É também um sítio frequente de bronquiectasias e de infecção por micobactérias não tuberculosas na "síndrome de Lady Windermere", em mulheres idosas que suprimem a tosse, com acometimento característico de língula e lobo médio.',
    memoria:
      'A língula é o lobo médio que a esquerda não teve. Perdeu a borda do coração na radiografia? É ela.',
    pontos: [
      'A que estrutura do pulmão direito a língula corresponde?',
      'Que sinal radiográfico sua consolidação produz?',
      'Que síndrome acomete língula e lobo médio?',
    ],
  },
  {
    termos: ['Pulmão Direito'],
    classe: 'via-aerea',
    resumo: 'Pulmão de três lobos e duas fissuras, maior e mais pesado que o esquerdo.',
    localizacao: 'Cavidade pleural direita, com base mais alta pelo fígado e hilo com brônquio posterior à artéria.',
    funcao: 'Contém dez segmentos broncopulmonares e responde por cerca de 55% da função ventilatória total.',
    relacoes: 'Sua face mediastinal apresenta impressões da veia cava superior, da veia ázigo e do esôfago.',
    clinica:
      'Sua maior participação funcional é o que orienta a decisão cirúrgica: uma pneumonectomia direita retira mais função e tem mortalidade maior que a esquerda, e por isso a avaliação funcional pré-operatória é mais rigorosa. E é para ele que vão os corpos estranhos e as aspirações, pela geometria do brônquio principal.',
    memoria:
      'Direito tem três lobos, duas fissuras e mais função. Também é o que recebe tudo o que é aspirado.',
    pontos: [
      'Quantos lobos e segmentos tem o pulmão direito?',
      'Que proporção da função ventilatória ele representa?',
      'Que impressões marcam sua face mediastinal?',
    ],
  },
  {
    termos: ['Pulmão Esquerdo'],
    classe: 'via-aerea',
    resumo: 'Pulmão de dois lobos, uma fissura e uma incisura cardíaca que abriga o coração.',
    localizacao: 'Cavidade pleural esquerda, com hilo em que a artéria pulmonar é superior ao brônquio.',
    funcao: 'Contém oito a nove segmentos broncopulmonares e é menor em volume por causa do coração.',
    relacoes: 'Sua face mediastinal apresenta a impressão cardíaca profunda, o sulco da aorta e o da subclávia esquerda.',
    clinica:
      'A ausência de fissura horizontal é o que faz um derrame cisural ou uma consolidação lobar terem apresentações radiográficas distintas dos dois lados. E a maior tolerância à pneumonectomia esquerda, por sua menor contribuição funcional, é um dos fatores considerados no planejamento de ressecções pulmonares extensas.',
    memoria:
      'Esquerdo tem dois lobos porque o coração ocupou o lugar do terceiro. E a língula é o que sobrou dele.',
    pontos: [
      'Quantos lobos e fissuras tem o pulmão esquerdo?',
      'Por que ele é menor que o direito?',
      'Que impressões marcam sua face mediastinal?',
    ],
  },
  {
    termos: ['Aurícula Direita'],
    classe: 'camara-cardiaca',
    resumo: 'Apêndice em orelha do átrio direito, de base larga e interior trabeculado.',
    localizacao: 'Prolonga-se para a frente e para a esquerda a partir do átrio direito, cobrindo a raiz da aorta.',
    funcao: 'Sua parede interna é revestida por músculos pectíneos; a base larga a distingue da aurícula esquerda.',
    relacoes: 'O nó sinoatrial está na sua junção com a veia cava superior.',
    clinica:
      'É a estrutura canulada na circulação extracorpórea para drenagem venosa, e a base larga é o que permite a canulação segura — ao contrário da esquerda. É também onde se posiciona a ponta do eletrodo atrial de marca-passo, e onde a canulação inadvertida do nó sinoatrial pode causar disfunção transitória.',
    memoria:
      'Aurícula direita tem base larga e é canulada; a esquerda tem base estreita e forma trombo. Duas orelhas, dois problemas.',
    pontos: [
      'O que distingue a aurícula direita da esquerda?',
      'Que estrutura de condução está próxima a ela?',
      'Qual seu uso em cirurgia cardíaca?',
    ],
  },
  {
    termos: ['Aurícula Esquerda'],
    classe: 'camara-cardiaca',
    resumo: 'Apêndice tubular e estreito do átrio esquerdo, principal sítio de trombos na fibrilação atrial.',
    localizacao: 'Prolonga-se para a frente a partir do átrio esquerdo, sobre o sulco coronário e a artéria circunflexa.',
    funcao: 'Diferentemente da direita, tem base estreita, forma tubular e frequentemente múltiplos lobos.',
    relacoes: 'Sua parede é fina e o fluxo em seu interior é lento.',
    clinica:
      'Base estreita, fluxo lento e superfície trabeculada formam a receita do trombo: mais de 90% dos trombos da fibrilação atrial não valvar se formam aqui. É por isso que o ecocardiograma transesofágico é obrigatório antes da cardioversão eletiva sem anticoagulação plena, e é por isso que existem dispositivos de oclusão da aurícula para pacientes que não podem anticoagular.',
    memoria:
      'Fibrilação atrial forma coágulo num lugar específico: a orelhinha esquerda. Tampar ela substitui o anticoagulante.',
    pontos: [
      'Por que a aurícula esquerda forma trombos?',
      'Que exame a avalia melhor e por quê?',
      'Que alternativa existe à anticoagulação?',
    ],
  },
  {
    termos: ['Glande do Pênis'],
    classe: 'viscera',
    resumo: 'Extremidade cônica do corpo esponjoso, coberta pelo prepúcio e com o meato uretral no ápice.',
    localizacao: 'Extremidade distal do pênis, expandindo o corpo esponjoso; sua borda posterior é a coroa.',
    funcao: 'É a região mais ricamente inervada do pênis, e a única parte do órgão erétil que permanece relativamente macia na ereção, por sua albugínea muito fina.',
    inervacao: 'Nervo dorsal do pênis (S2–S4), com a maior densidade de corpúsculos sensitivos.',
    clinica:
      'Sua albugínea fina explica por que a glande permanece flácida no priapismo isquêmico — sinal que ajuda a distinguir a condição do simples ingurgitamento. E é na glande que se manifestam a balanite, o líquen escleroso (balanite xerótica obliterante), causa de fimose adquirida e de estenose de meato, e o carcinoma espinocelular, cujo principal fator de risco é a fimose com inflamação crônica.',
    memoria:
      'No priapismo, o pênis está duro e a glande mole. Se a glande também está dura, pense em outra coisa.',
    pontos: [
      'Por que a glande não endurece como os corpos cavernosos?',
      'Que nervo lhe dá sensibilidade?',
      'Que doenças a acometem preferencialmente?',
    ],
  },
  {
    termos: ['Corpo do Pênis'],
    classe: 'viscera',
    resumo: 'Porção pêndula do pênis, formada pelos dois corpos cavernosos e pelo corpo esponjoso.',
    localizacao: 'Da raiz, no períneo, até a glande; suspenso pelos ligamentos suspensor e fundiforme.',
    funcao: 'Contém os três cilindros eréteis, envolvidos pela fáscia profunda (de Buck) e pela fáscia superficial (de Dartos).',
    relacoes: 'A fáscia de Buck contém os corpos eréteis e o feixe dorsal; a de Dartos é contínua com Scarpa e Colles.',
    clinica:
      'A fáscia de Buck é o que determina o padrão do hematoma na fratura peniana: íntegra, o hematoma fica confinado ao corpo, dando a deformidade em berinjela; rompida, ele se espalha pelo escroto e pela parede abdominal, seguindo Colles e Scarpa. A fratura é uma emergência cirúrgica, e a extensão do hematoma prevê o que o cirurgião vai encontrar.',
    memoria:
      'Hematoma preso no pênis: Buck íntegra. Hematoma que sobe pelo abdome: Buck rompeu e o sangue seguiu as fáscias.',
    pontos: [
      'Que fáscias envolvem o corpo do pênis?',
      'Como o padrão do hematoma indica a extensão da lesão?',
      'Por que a fratura peniana é emergência?',
    ],
  },
]
