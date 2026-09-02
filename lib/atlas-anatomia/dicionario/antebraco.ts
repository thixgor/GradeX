import type { EntradaDicionario } from './tipos'

/**
 * Antebraço.
 *
 * Dois ossos paralelos que existem para uma coisa só: girar um sobre o outro.
 * A pronossupinação é o que separa o antebraço humano do de quase todo o resto
 * dos mamíferos, e cada detalhe daqui — a cabeça arredondada do rádio, a
 * incisura radial da ulna, a membrana interóssea oblíqua — serve a esse giro.
 */
export const ANTEBRACO: EntradaDicionario[] = [
  /* ─────────────────── Rádio ─────────────────── */
  {
    termos: ['Osso Rádio'],
    classe: 'osso',
    resumo: 'Osso lateral do antebraço, o que gira sobre a ulna e o que sustenta a mão.',
    localizacao:
      'Do cotovelo ao punho, no lado do polegar. Estreito em cima, largo embaixo — o inverso da ulna, que é larga em cima e fina embaixo. Essa inversão é a assinatura do par.',
    funcao:
      'É o osso da mão: cerca de 80% da carga que sobe do punho passa por ele. E é o osso que gira: na pronação, o rádio cruza por cima da ulna, levando a mão junto.',
    vascularizacao: 'Artéria radial e interóssea anterior; artéria nutrícia entrando no terço proximal.',
    relacoes: 'Une-se à ulna pela membrana interóssea e pelas articulações radioulnares proximal e distal, que funcionam sempre em conjunto.',
    clinica:
      'A fratura do rádio distal é a fratura mais comum do esqueleto humano: Colles (desvio dorsal, queda com a mão espalmada, "dorso de garfo") e Smith (desvio volar, queda com o punho flexionado). Como as radioulnares trabalham em par, uma fratura de um osso com luxação da articulação do outro é regra: Monteggia (fratura da ulna proximal com luxação da cabeça do rádio) e Galeazzi (fratura do rádio distal com luxação radioulnar distal).',
    memoria:
      'Rádio é o osso do polegar e o osso que gira. "Rádio" de roda: ele roda em torno da ulna, que fica parada.',
    pontos: [
      'Qual osso carrega a maior parte da carga do punho?',
      'Diferencie fratura de Colles e de Smith.',
      'O que são as lesões de Monteggia e de Galeazzi?',
    ],
  },
  {
    termos: ['Cabeça do Rádio'],
    classe: 'acidente-osseo',
    resumo: 'Disco articular na extremidade proximal do rádio, que gira dentro do ligamento anular.',
    localizacao: 'Extremidade superior do rádio, logo abaixo do capítulo do úmero, palpável na face lateral do cotovelo durante a pronossupinação.',
    funcao:
      'Tem duas superfícies articulares ao mesmo tempo: a fóvea, em cima, para o capítulo do úmero, e a circunferência, na lateral, para a incisura radial da ulna. É o que permite a ela flexionar e girar simultaneamente.',
    relacoes: 'Mantida no lugar pelo ligamento anular, que forma quatro quintos de um anel fibroso em torno dela.',
    clinica:
      'É a fratura mais comum do cotovelo no adulto, e o exame é simples: dor à palpação lateral e bloqueio da pronossupinação. A cabeça do rádio é ainda o estabilizador secundário contra o valgo — por isso a ressecção simples é abandonada quando o colateral ulnar está lesado, sob pena de instabilidade. Na criança pequena, o anel é frouxo e a tração no braço faz a cabeça escapar: é a pronação dolorosa.',
    memoria:
      'Uma roda dentro de um anel. Roda que quebra trava o giro; anel frouxo deixa a roda escapar.',
    pontos: [
      'Quais são as duas superfícies articulares da cabeça do rádio?',
      'Que estrutura a mantém no lugar?',
      'Por que sua ressecção pode causar instabilidade?',
    ],
  },
  {
    termos: ['Fóvea da Cabeça do Rádio'],
    classe: 'acidente-osseo',
    resumo: 'Depressão rasa no topo da cabeça do rádio que recebe o capítulo do úmero.',
    localizacao: 'Face superior da cabeça do rádio, côncava e revestida de cartilagem.',
    funcao: 'Forma a articulação umerorradial, esferóidea, que participa da flexão-extensão do cotovelo e da pronossupinação — ela desliza sobre o capítulo em ambos os movimentos.',
    relacoes: 'O capítulo é esférico apenas na sua metade anterior, o que limita o contato à flexão.',
    clinica:
      'É onde se instala a osteocondrite dissecante do capítulo e, no adulto, a artrose umerorradial isolada. Fraturas com afundamento da fóvea alteram a congruência e produzem crepitação e dor na rotação, mesmo com o cotovelo parado — o sinal que aponta a articulação certa.',
    memoria:
      'Cabeça do rádio é como um pires virado para cima: o pires recebe a bolinha do capítulo, e o "corpo" do pires roda na ulna.',
    pontos: [
      'Que articulação a fóvea da cabeça do rádio forma?',
      'Em que movimentos ela participa?',
      'Que lesão típica atinge o capítulo do úmero?',
    ],
  },
  {
    termos: ['Circunferência Articular da Cabeça do Rádio'],
    classe: 'acidente-osseo',
    resumo: 'Faixa cartilagínea que contorna a cabeça do rádio e gira contra a incisura radial da ulna.',
    localizacao: 'Toda a superfície lateral e circunferencial da cabeça do rádio.',
    funcao:
      'Faz a articulação radioulnar proximal, do tipo pivô: a cabeça roda dentro do anel formado pela incisura radial da ulna e pelo ligamento anular. É a metade proximal do mecanismo da pronossupinação.',
    relacoes: 'A face interna do ligamento anular é revestida de cartilagem, porque a cabeça desliza contra ele.',
    clinica:
      'Qualquer coisa que altere a circunferência — fratura com degrau, calo exuberante, sinovite reumatoide — trava a pronossupinação. É por isso que, na prótese de cabeça do rádio, o dimensionamento é crítico: implante muito grande ("overstuffing") bloqueia o giro e sobrecarrega a articulação.',
    memoria:
      'A cabeça do rádio tem duas caras: em cima ela dobra, do lado ela gira. Duas funções, um osso só.',
    pontos: [
      'Que articulação a circunferência forma?',
      'De que tipo é essa articulação?',
      'O que acontece se a circunferência for alterada?',
    ],
  },
  {
    termos: ['Colo'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico'],
    resumo: 'Segmento estreito do rádio entre a cabeça e a tuberosidade radial.',
    localizacao: 'Imediatamente abaixo da cabeça do rádio, oblíquo em relação ao corpo do osso.',
    funcao: 'Faz a transição da cabeça para a diáfise e transmite a rotação; é envolvido por uma bolsa e cercado pelo ramo profundo do nervo radial ao entrar no supinador.',
    relacoes: 'O nervo interósseo posterior contorna o colo lateralmente, dentro do músculo supinador.',
    clinica:
      'A fratura do colo do rádio é a mais comum na criança, e a redução deve respeitar o nervo interósseo posterior, que está a milímetros. Nas abordagens laterais do cotovelo, prona-se o antebraço antes de expor o colo: a manobra afasta o nervo do campo, e é o tipo de detalhe que só a anatomia justifica.',
    memoria:
      'Prone o antebraço e o interósseo posterior "foge" do bisturi. Uma manobra de dois segundos que evita um pé de mão caído.',
    pontos: [
      'Que nervo contorna o colo do rádio?',
      'Por que se prona o antebraço na abordagem lateral?',
      'Que fratura do colo é típica da criança?',
    ],
  },
  {
    termos: ['Tuberosidade Radial'],
    classe: 'acidente-osseo',
    resumo: 'Saliência oval na face medial do rádio proximal, onde se insere o tendão do bíceps braquial.',
    localizacao: 'Abaixo do colo do rádio, na face anteromedial; roda para trás na pronação e para a frente na supinação.',
    funcao:
      'É o ponto de aplicação da supinação: como está fora do eixo de rotação do rádio, o bíceps age como manivela. Isso explica por que o bíceps é o supinador mais forte, sobretudo com o cotovelo fletido a 90°.',
    relacoes: 'Uma bolsa bicipitorradial separa o tendão do osso; a artéria recorrente radial corre próximo.',
    clinica:
      'A rotura distal do bíceps ocorre justamente na sua inserção aqui, e ao contrário da proximal, costuma exigir reparo: sem ele, perde-se cerca de 40% da força de supinação e 30% da flexão. O teste do "hook" — tentar enganchar o dedo sob o tendão na fossa cubital — é o exame mais sensível. Na reinserção, o risco é o nervo interósseo posterior, e por isso se usa a técnica de duas incisões ou fixação anterior cuidadosa.',
    memoria:
      'O bíceps é um saca-rolhas: ele puxa e gira. Puxa no cotovelo, gira na tuberosidade radial. Por isso ele abre garrafa com a mão direita.',
    pontos: [
      'Que músculo se insere na tuberosidade radial?',
      'Por que o bíceps é o supinador mais forte?',
      'Como se diagnostica a rotura distal do bíceps?',
    ],
  },
  {
    termos: ['Corpo do Rádio'],
    classe: 'acidente-osseo',
    resumo: 'Diáfise do rádio, com curvatura lateral própria que é decisiva para a pronossupinação.',
    localizacao: 'Entre a tuberosidade radial e a extremidade distal; é triangular ao corte, com uma borda interóssea afiada voltada para a ulna.',
    funcao:
      'Sua curvatura lateral — o "arco radial" — é o que dá espaço para o rádio cruzar por cima da ulna na pronação. Perder essa curvatura é perder o giro.',
    relacoes: 'A membrana interóssea o une à ulna; o pronador redondo se insere no seu ponto de maior convexidade.',
    clinica:
      'É por isso que fraturas de diáfise de antebraço em adulto são quase sempre cirúrgicas: reduzir "aceitavelmente" não basta, é preciso restaurar o arco radial em milímetros, sob pena de perda permanente da pronossupinação. Antebraço, aqui, se trata como uma articulação, não como um osso.',
    memoria:
      'O rádio é curvo de propósito. Osso reto não gira em torno de outro — encosta nele e trava.',
    pontos: [
      'Por que a curvatura do rádio é funcionalmente essencial?',
      'Que estrutura une o rádio à ulna ao longo da diáfise?',
      'Por que fraturas diafisárias de antebraço são cirúrgicas no adulto?',
    ],
  },
  {
    termos: ['Borda Interóssea'],
    classe: 'acidente-osseo',
    resumo: 'Crista afiada nas faces voltadas uma para a outra do rádio e da ulna, onde se prende a membrana interóssea.',
    localizacao: 'Face medial do rádio e face lateral da ulna, ao longo de quase toda a diáfise.',
    funcao:
      'Ancora a membrana interóssea, cujas fibras principais correm obliquamente de cima (rádio) para baixo (ulna). Essa direção não é decorativa: ela transfere para a ulna a carga axial que sobe pelo rádio a partir da mão.',
    relacoes: 'A artéria interóssea comum divide-se em anterior e posterior nas margens da membrana.',
    clinica:
      'A banda central da membrana é o estabilizador longitudinal do antebraço. Sua ruptura, associada à fratura da cabeça do rádio e à lesão radioulnar distal, é a lesão de Essex-Lopresti: o rádio migra proximalmente e o punho passa a doer. É um diagnóstico que se perde com facilidade se ninguém examinar o punho de quem fraturou o cotovelo.',
    memoria:
      'Fibras que descem do rádio para a ulna: a carga entra pela mão, sobe pelo rádio e é repassada para a ulna no meio do caminho.',
    pontos: [
      'Qual a direção das fibras da membrana interóssea e por quê?',
      'Que função de transferência de carga ela exerce?',
      'O que é a lesão de Essex-Lopresti?',
    ],
  },
  {
    termos: ['Tubérculo Dorsal'],
    classe: 'acidente-osseo',
    resumo: 'Saliência na face dorsal do rádio distal — o tubérculo de Lister — que funciona como polia para o extensor longo do polegar.',
    localizacao: 'Face dorsal da extremidade distal do rádio, palpável no dorso do punho, em linha com o segundo espaço interósseo.',
    funcao:
      'Serve de roldana: o tendão do extensor longo do polegar contorna o tubérculo e muda bruscamente de direção, ganhando o vetor que permite estender e retropulsar o polegar.',
    relacoes: 'Separa o segundo compartimento extensor (radiais do carpo) do terceiro (extensor longo do polegar).',
    clinica:
      'Essa curva fechada num ponto de atrito é o motivo de o extensor longo do polegar romper espontaneamente semanas após uma fratura de Colles, mesmo sem desvio — a chamada rotura tardia. O tubérculo é também referência da entrada artroscópica do punho e do posicionamento de placas dorsais, que precisam ser rebaixadas para não atritar o tendão.',
    memoria:
      'Tubérculo de Lister é um esporão onde um tendão faz a curva. Curva apertada, atrito, e um dia o tendão arrebenta sozinho.',
    pontos: [
      'Que tendão contorna o tubérculo dorsal?',
      'Por que ele rompe tardiamente após fratura de Colles?',
      'Que compartimentos extensores ele separa?',
    ],
  },
  {
    termos: ['Sulcos e Cristas Ósseas para os Tendões dos Extensores'],
    classe: 'acidente-osseo',
    resumo: 'Relevo da face dorsal do rádio distal que organiza os seis compartimentos extensores do punho.',
    localizacao: 'Face dorsal da extremidade distal do rádio e da ulna, sob o retináculo dos extensores.',
    funcao:
      'Os septos do retináculo se fixam nas cristas e criam seis túneis osteofibrosos, cada um com sua bainha sinovial. A separação impede que os tendões se cruzem e permite que cada um puxe na sua direção.',
    relacoes:
      'De radial para ulnar: 1º abdutor longo e extensor curto do polegar; 2º radiais longo e curto do carpo; 3º extensor longo do polegar; 4º extensor dos dedos e extensor do indicador; 5º extensor do dedo mínimo; 6º extensor ulnar do carpo.',
    clinica:
      'Cada compartimento tem sua tenossinovite típica: o primeiro dá a doença de De Quervain, com teste de Finkelstein positivo; o sexto, a tendinite do extensor ulnar do carpo, muito comum em tenistas. Saber a numeração transforma uma "dor no punho" em diagnóstico topográfico.',
    memoria:
      'Seis compartimentos, do polegar para o dedo mínimo: 2 tendões, 2 tendões, 1, 2, 1, 1. A sequência "2-2-1-2-1-1" resolve a prova.',
    pontos: [
      'Quantos compartimentos extensores existem e o que há em cada um?',
      'O que é a doença de De Quervain?',
      'Que estrutura cria os septos entre compartimentos?',
    ],
  },
  {
    termos: ['Incisura Ulnar'],
    classe: 'acidente-osseo',
    resumo: 'Concavidade na face medial do rádio distal que recebe a cabeça da ulna.',
    localizacao: 'Face medial da extremidade distal do rádio, voltada para a ulna.',
    funcao: 'Forma a articulação radioulnar distal, um pivô em que o rádio gira em torno da ulna — é o rádio que se move, não a ulna.',
    relacoes: 'O complexo da fibrocartilagem triangular fixa-se na sua borda inferior e é o principal estabilizador dessa articulação.',
    clinica:
      'A instabilidade radioulnar distal, testada pela manobra da tecla de piano na cabeça da ulna, acompanha fraturas do rádio distal e lesões do complexo triangular, e é uma causa frequente de dor ulnar crônica do punho após consolidação "perfeita" da fratura. Restaurar o comprimento e a inclinação do rádio na fratura é o que evita esse desfecho.',
    memoria:
      'Na pronossupinação, a ulna fica quieta e o rádio corre em volta dela — em cima e embaixo. Duas articulações, um só movimento.',
    pontos: [
      'Que articulação a incisura ulnar forma?',
      'Que estrutura estabiliza a radioulnar distal?',
      'Como se testa a instabilidade radioulnar distal?',
    ],
  },
  {
    termos: ['Face Articular Cárpica'],
    classe: 'acidente-osseo',
    resumo: 'Superfície distal do rádio, dividida em duas facetas, que recebe o escafoide e o semilunar.',
    localizacao: 'Extremidade distal do rádio, inclinada cerca de 11° em direção volar e 22° em direção ulnar.',
    funcao:
      'Forma a maior parte da articulação radiocárpica. Suas duas facetas — escafoidea, lateral e triangular, e semilunar, medial e quadrangular — são separadas por uma crista sagital.',
    relacoes: 'A parte medial da superfície de recepção do carpo é completada pela fibrocartilagem triangular, e não por osso.',
    clinica:
      'As duas inclinações (volar e ulnar) são os parâmetros que se medem em toda radiografia de fratura do rádio distal, junto com a altura radial. Perdê-los é perder força de preensão e mobilidade; restaurá-los é o objetivo de toda redução. Um degrau intra-articular maior que 2 mm evolui para artrose radiocárpica em poucos anos.',
    memoria:
      'Onze graus volar, vinte e dois ulnar. Dois números que decidem se uma fratura de punho está reduzida ou não.',
    pontos: [
      'Que ossos do carpo se articulam com o rádio?',
      'Quais as inclinações normais da superfície articular do rádio?',
      'O que completa medialmente a superfície de recepção do carpo?',
    ],
  },
  /* ─────────────────── Ulna ─────────────────── */
  {
    termos: ['Incisura Troclear'],
    classe: 'acidente-osseo',
    resumo: 'Grande concavidade em C na ulna proximal, entre o olécrano e o processo coronoide, que abraça a tróclea do úmero.',
    localizacao: 'Face anterior da extremidade proximal da ulna, formando cerca de 180° de arco articular.',
    funcao:
      'É a única articulação verdadeiramente encaixada do membro superior. O abraço quase completo em torno da tróclea é o que faz do cotovelo uma dobradiça estável — o oposto do ombro.',
    relacoes: 'Uma faixa transversal sem cartilagem ("nuda area") divide a incisura em porção olecraniana e coronoidea.',
    clinica:
      'Esse encaixe explica por que a luxação do cotovelo exige energia alta e por que a "tríade terrível" — luxação com fratura da cabeça do rádio e do processo coronoide — é tão instável: perdem-se de uma vez o encaixe ósseo, o pilar lateral e o batente anterior. É uma das lesões mais difíceis da ortopedia do cotovelo.',
    memoria:
      'O cotovelo é uma chave inglesa fechada em torno da tróclea. Para luxar, é preciso quebrar a chave — e por isso a luxação vem quase sempre com fratura.',
    pontos: [
      'Que superfície umeral a incisura troclear recebe?',
      'Por que o cotovelo é uma articulação estável?',
      'O que é a tríade terrível do cotovelo?',
    ],
  },
  {
    termos: ['Incisura Radial'],
    classe: 'acidente-osseo',
    resumo: 'Pequena face articular na lateral do processo coronoide que recebe a circunferência da cabeça do rádio.',
    localizacao: 'Face lateral da ulna proximal, imediatamente abaixo e lateralmente à incisura troclear.',
    funcao: 'Forma, com o ligamento anular, o anel osteofibroso dentro do qual a cabeça do rádio gira — a articulação radioulnar proximal.',
    relacoes: 'O ligamento anular fixa-se nas duas bordas da incisura, completando o círculo.',
    clinica:
      'A fratura da incisura radial ou a sua incongruência após trauma travam a pronossupinação. Nas fraturas de Monteggia, é a integridade dessa relação que se restaura ao reduzir a ulna: reduzida a ulna, a cabeça do rádio volta ao lugar sozinha na maioria dos casos — um dos exemplos mais elegantes de anatomia aplicada.',
    memoria:
      'Um quarto do anel é osso (incisura radial), três quartos são ligamento (anular). O anel inteiro segura a cabeça do rádio.',
    pontos: [
      'Que articulação a incisura radial forma?',
      'Que proporção do anel é óssea e qual é ligamentar?',
      'Por que reduzir a ulna reduz a cabeça do rádio na Monteggia?',
    ],
  },
  {
    termos: ['Tuberosidade Ulnar'],
    classe: 'acidente-osseo',
    resumo: 'Rugosidade abaixo do processo coronoide, onde se insere o músculo braquial.',
    localizacao: 'Face anterior da ulna proximal, imediatamente distal ao processo coronoide.',
    funcao:
      'Recebe o tendão do braquial, o flexor mais constante do cotovelo. Por estar na ulna, que não roda, essa inserção é o que faz o braquial fletir independentemente da posição do antebraço.',
    relacoes: 'A artéria braquial e o nervo mediano descem à frente dela, no assoalho da fossa cubital.',
    clinica:
      'A avulsão da tuberosidade ulnar é rara, mas a ossificação heterotópica do braquial junto a ela é comum após luxação do cotovelo, e limita a flexão. Nas vias anteriores, a proximidade do feixe braquial exige atenção redobrada.',
    memoria: 'Bíceps se prende no rádio (que gira); braquial se prende na ulna (que não gira). Por isso um supina e o outro só flete.',
    pontos: [
      'Que músculo se insere na tuberosidade ulnar?',
      'Por que essa inserção torna o braquial um flexor puro?',
      'Que estruturas passam à frente dela?',
    ],
  },
  {
    termos: ['Fossa do Músculo Supinador'],
    classe: 'acidente-osseo',
    resumo: 'Depressão na face lateral da ulna proximal onde se aloja a porção profunda do músculo supinador.',
    localizacao: 'Face lateral da ulna, abaixo da incisura radial, entre a crista do supinador e a borda interóssea.',
    funcao: 'Aloja e dá origem à parte ulnar do supinador, que envolve o colo do rádio e o gira para fora.',
    relacoes: 'O nervo interósseo posterior atravessa o músculo supinador, passando pela arcada de Frohse — um arco fibroso na borda superior da cabeça superficial.',
    clinica:
      'A arcada de Frohse é o local da síndrome do túnel radial e da síndrome do interósseo posterior. A primeira dá dor no antebraço proximal sem fraqueza e confunde-se com epicondilite lateral; a segunda dá queda dos dedos sem queda do punho, porque o extensor radial longo do carpo já foi inervado antes. Essa dissociação é o achado que fecha o diagnóstico.',
    memoria:
      'Punho cai = radial lá em cima, no braço. Só os dedos caem = interósseo posterior, no supinador. A altura da lesão está no que sobra.',
    pontos: [
      'Que músculo nasce na fossa do supinador?',
      'O que é a arcada de Frohse?',
      'Como diferenciar lesão do radial alto e do interósseo posterior?',
    ],
  },
  {
    termos: ['Crista do Músculo Supinador'],
    classe: 'acidente-osseo',
    resumo: 'Crista óssea na face lateral da ulna proximal, origem do supinador e inserção do colateral ulnar lateral.',
    localizacao: 'Desce da porção posterior da incisura radial ao longo da face lateral da ulna.',
    funcao: 'Dá origem à porção ulnar do supinador e recebe a inserção distal do ligamento colateral ulnar lateral — o estabilizador rotatório do cotovelo.',
    relacoes: 'Faz o limite posterior da fossa do supinador.',
    clinica:
      'É a referência anatômica da reconstrução do ligamento colateral ulnar lateral na instabilidade rotatória posterolateral: o túnel ósseo distal é feito exatamente na crista do supinador. Reconstruir fora dela não restaura o vetor correto.',
    memoria:
      'Uma crista, duas funções: músculo que gira o rádio e ligamento que impede o cotovelo de desengatar para trás.',
    pontos: [
      'Que estruturas se fixam na crista do supinador?',
      'Que instabilidade sua lesão permite?',
      'Onde se posiciona o túnel ósseo na reconstrução?',
    ],
  },
  {
    termos: ['Corpo da Ulna'],
    classe: 'acidente-osseo',
    resumo: 'Diáfise da ulna, triangular e subcutânea em toda a sua borda posterior.',
    localizacao: 'Do processo coronoide à cabeça da ulna; sua borda posterior é palpável do olécrano ao processo estiloide.',
    funcao: 'É a barra fixa do antebraço: enquanto o rádio gira, a ulna serve de eixo. Dá origem aos flexores e extensores profundos e ancora a membrana interóssea.',
    relacoes: 'A artéria e o nervo ulnares descem na sua face anteromedial, sob o flexor ulnar do carpo.',
    clinica:
      'Sua posição subcutânea explica a fratura do "bastão de defesa" (nightstick), fratura isolada da diáfise ulnar em quem levanta o antebraço para proteger a cabeça. Diante dela, é obrigatório radiografar cotovelo e punho: fratura isolada da ulna sem luxação associada é a exceção, não a regra.',
    memoria:
      'A borda de trás da ulna é a única linha óssea que você segue com o dedo do cotovelo ao punho sem perder o contato. Osso subcutâneo é osso que quebra em defesa.',
    pontos: [
      'Por que a ulna funciona como eixo do antebraço?',
      'O que é a fratura do bastão de defesa?',
      'Por que radiografar as duas articulações vizinhas?',
    ],
  },
  {
    termos: ['Cabeça da Ulna'],
    classe: 'acidente-osseo',
    resumo: 'Extremidade distal arredondada da ulna, que não toca o carpo — a fibrocartilagem triangular se interpõe.',
    localizacao: 'Extremidade distal da ulna, com o processo estiloide projetando-se posteromedialmente; proeminente no dorso do punho em pronação.',
    funcao:
      'Articula-se com a incisura ulnar do rádio na radioulnar distal. Do carpo, é separada pelo complexo da fibrocartilagem triangular, que transmite cerca de 20% da carga do punho.',
    relacoes: 'O tendão do extensor ulnar do carpo corre em um sulco na sua face dorsal, e é ele próprio um estabilizador dinâmico da articulação.',
    clinica:
      'A variância ulnar — quanto a ulna é mais longa ou mais curta que o rádio — decide dois quadros opostos: variância positiva causa impacto ulnocarpal, com dor ulnar e degeneração do complexo triangular; variância negativa se associa à doença de Kienböck, necrose do semilunar. Uma medida de milímetros em radiografia simples que orienta toda a conduta.',
    memoria:
      'A ulna não encosta no carpo: tem um "disco" entre eles. Ulna comprida demais esmaga o disco; curta demais sobrecarrega o semilunar.',
    pontos: [
      'Por que a ulna não se articula diretamente com o carpo?',
      'O que é variância ulnar e o que ela causa?',
      'Que tendão corre no sulco dorsal da cabeça da ulna?',
    ],
  },
  {
    termos: ['Forame Nutrício'],
    classe: 'passagem-ossea',
    resumo: 'Orifício por onde a artéria nutrícia entra na diáfise para irrigar a medula óssea e o córtex interno.',
    localizacao: 'Na diáfise dos ossos longos, com direção oblíqua constante: nos ossos do membro superior, aponta na direção do cotovelo.',
    funcao:
      'Conduz a artéria nutrícia, responsável por até 70% do suprimento sanguíneo do osso adulto — irriga a medula e os dois terços internos do córtex, enquanto os vasos periosteais nutrem o terço externo.',
    relacoes: 'A obliquidade segue a regra "foge do cotovelo, corre para o joelho": os forames se afastam da epífise que mais cresce.',
    clinica:
      'A dupla irrigação explica dois fatos da prática: na fresagem do canal medular para haste intramedular, destrói-se o suprimento endosteal, e o osso passa a depender do periósteo — por isso o descolamento periosteal excessivo em cirurgia aberta é tão prejudicial. E é por isso também que fraturas cominutas com grande descolamento evoluem para pseudartrose.',
    memoria:
      '"Foge do cotovelo, corre para o joelho." A ponta da agulha do forame nutrício aponta para longe do lado que mais cresce.',
    pontos: [
      'Que proporção do osso a artéria nutrícia irriga?',
      'Qual a regra da direção dos forames nutrícios?',
      'Por que o descolamento periosteal prejudica a consolidação?',
    ],
  },
  /* ─────────────────── Músculos do antebraço ─────────────────── */
  {
    termos: ['Músculo Supinador'],
    classe: 'musculo',
    resumo: 'Músculo profundo que envolve o terço proximal do rádio e o gira para fora.',
    localizacao:
      'Da crista e da fossa do supinador na ulna, do epicôndilo lateral e do ligamento anular, enrolando-se em torno do colo e do terço proximal do rádio até a face anterior.',
    funcao:
      'Supina o antebraço com o cotovelo estendido — situação em que o bíceps perde eficiência. Na supinação lenta e sem carga, ele age sozinho; com força, o bíceps entra.',
    vascularizacao: 'Artéria recorrente radial e interóssea posterior.',
    inervacao: 'Ramo profundo do nervo radial (C5–C6), que o atravessa entre suas duas camadas.',
    relacoes: 'A arcada de Frohse, borda fibrosa da camada superficial, é o ponto em que o nervo entra no músculo.',
    clinica:
      'É o cenário da síndrome do interósseo posterior: paralisia dos extensores dos dedos e do polegar com preservação da extensão do punho em desvio radial. O músculo também é liberado nas abordagens ao rádio proximal, sempre com o antebraço pronado para afastar o nervo.',
    memoria:
      'Supinador com cotovelo esticado, bíceps com cotovelo dobrado. Por isso você abre uma porta com o braço estendido e o parafuso com o braço dobrado.',
    pontos: [
      'Quando o supinador atua sozinho e quando o bíceps entra?',
      'Que nervo atravessa o supinador?',
      'O que caracteriza a síndrome do interósseo posterior?',
    ],
  },
  {
    termos: ['Músculo Pronador Quadrado'],
    classe: 'musculo',
    resumo: 'Músculo quadrangular profundo que une o quarto distal da ulna ao do rádio.',
    localizacao: 'Face anterior do quarto distal do antebraço, sob todos os tendões flexores, com fibras transversais.',
    funcao:
      'É o pronador primário, ativo em toda pronação, com ou sem resistência; o pronador redondo só se junta a ele quando é preciso força ou velocidade. Sua cabeça profunda também aproxima o rádio da ulna, estabilizando a radioulnar distal.',
    vascularizacao: 'Artéria interóssea anterior.',
    inervacao: 'Nervo interósseo anterior, ramo do mediano (C8–T1).',
    relacoes: 'Repousa diretamente sobre o rádio e a ulna distais, formando o assoalho do compartimento anterior.',
    clinica:
      'É o retalho de escolha para cobrir placas volares do rádio distal e evitar a rotura de tendões flexores por atrito com o metal. Na síndrome do interósseo anterior, sua fraqueza acompanha a incapacidade de fazer o "O" com polegar e indicador, por paralisia do flexor longo do polegar e do flexor profundo do indicador.',
    memoria:
      'Quadrado, profundo e sempre ligado: é o pronador do dia a dia. O redondo é o "turbo", só entra quando precisa.',
    pontos: [
      'Qual a diferença funcional entre pronador quadrado e redondo?',
      'Que nervo inerva o pronador quadrado?',
      'Qual seu uso como retalho em cirurgia do punho?',
    ],
  },
  {
    termos: ['Músculo Abdutor Longo do Polegar (Grupo Profundo)'],
    classe: 'musculo',
    resumo: 'Músculo profundo do dorso do antebraço que abduz o polegar e forma a borda anterior da tabaqueira anatômica.',
    localizacao:
      'Das faces posteriores da ulna, da membrana interóssea e do rádio, cruzando obliquamente os tendões radiais até a base do primeiro metacarpo.',
    funcao: 'Abduz e estende o polegar na articulação carpometacarpal e auxilia o desvio radial do punho.',
    vascularizacao: 'Artéria interóssea posterior.',
    inervacao: 'Nervo interósseo posterior (C7–C8).',
    relacoes: 'Ocupa, com o extensor curto do polegar, o primeiro compartimento extensor, sob o retináculo.',
    clinica:
      'A tenossinovite estenosante desse primeiro compartimento é a doença de De Quervain, típica de puérperas que sustentam o bebê e de quem usa o celular por horas. O teste de Finkelstein — desvio ulnar do punho com o polegar preso — reproduz a dor. Um septo separando os dois tendões dentro do compartimento é variante comum e causa de falha do tratamento com infiltração.',
    memoria:
      'Primeiro compartimento, dois tendões, uma doença famosa: De Quervain. Polegar dentro da mão, punho para o lado ulnar, e a dor aparece.',
    pontos: [
      'Que compartimento extensor esse músculo ocupa?',
      'O que é a doença de De Quervain e como testá-la?',
      'Que variante anatômica explica falhas de tratamento?',
    ],
  },
  {
    termos: ['Músculo Extensor Curto do Polegar (Grupo Profundo)'],
    classe: 'musculo',
    resumo: 'Companheiro do abdutor longo no primeiro compartimento, estende a falange proximal do polegar.',
    localizacao: 'Da face posterior do rádio e da membrana interóssea até a base da falange proximal do polegar.',
    funcao: 'Estende a articulação metacarpofalângica do polegar e auxilia sua abdução; forma a borda anterior da tabaqueira anatômica com o abdutor longo.',
    vascularizacao: 'Artéria interóssea posterior.',
    inervacao: 'Nervo interósseo posterior (C7–C8).',
    relacoes: 'Sua ausência é variante conhecida; é o tendão mais frequentemente encontrado em subcompartimento próprio.',
    clinica:
      'A tabaqueira anatômica que ele ajuda a delimitar é o reparo de superfície mais importante do punho: no seu assoalho está o escafoide, e dor à palpação ali após queda significa fratura de escafoide até prova em contrário — mesmo com radiografia inicial normal, o punho se imobiliza e se repete a imagem. Pela tabaqueira também passa a artéria radial.',
    memoria:
      'Tabaqueira: dois tendões na frente (abdutor longo e extensor curto), um atrás (extensor longo). No fundo, o escafoide; por cima, a artéria radial.',
    pontos: [
      'Que tendões delimitam a tabaqueira anatômica?',
      'Que osso está no seu assoalho e por que isso importa?',
      'Que artéria a atravessa?',
    ],
  },
  {
    termos: ['Músculo Extensor do Indicador'],
    classe: 'musculo',
    resumo: 'Músculo profundo que dá ao indicador um extensor próprio, independente do extensor comum.',
    localizacao: 'Da face posterior da ulna distal e da membrana interóssea até o capuz extensor do indicador, no quarto compartimento.',
    funcao:
      'Estende o indicador isoladamente — é o que permite apontar com o dedo enquanto os demais permanecem fletidos. Seu tendão corre sempre ulnarmente ao do extensor comum para o indicador, detalhe constante e útil na cirurgia.',
    vascularizacao: 'Artéria interóssea posterior.',
    inervacao: 'Nervo interósseo posterior (C7–C8).',
    relacoes: 'Divide o quarto compartimento com os quatro tendões do extensor dos dedos.',
    clinica:
      'É o tendão doador preferido para transferência na rotura do extensor longo do polegar — o clássico "EIP para EPL" — porque é dispensável (o extensor comum mantém a extensão do indicador) e tem excursão adequada. Um exemplo em que a redundância anatômica vira recurso cirúrgico.',
    memoria:
      'Só o indicador e o mínimo têm extensor próprio. Por isso você consegue apontar e fazer o gesto de "chifrinhos" — e não com o médio e o anular.',
    pontos: [
      'Que dedos têm extensor próprio além do comum?',
      'Onde corre o tendão em relação ao do extensor comum?',
      'Por que ele é o doador ideal para transferência tendínea?',
    ],
  },
  {
    termos: ['Tendão do Músculo Palmar Longo'],
    classe: 'tendao',
    resumo: 'Tendão longo e superficial no meio do punho, ausente em cerca de 15% das pessoas.',
    localizacao:
      'Na linha média do punho, superficialmente ao retináculo dos flexores, terminando na aponeurose palmar. Aparece à vista quando se opõe o polegar ao dedo mínimo com o punho levemente fletido.',
    funcao: 'Tensiona a aponeurose palmar e auxilia fracamente a flexão do punho. Funcionalmente, é dispensável — sua ausência não produz déficit algum.',
    vascularizacao: 'Ramos da artéria ulnar.',
    inervacao: 'Nervo mediano (C7–C8).',
    relacoes: 'Passa por cima do retináculo, e não dentro do túnel do carpo — detalhe cobrado com frequência. O nervo mediano está imediatamente radial e profundo a ele.',
    clinica:
      'É o enxerto tendíneo mais usado do corpo: reconstrução do colateral ulnar do cotovelo, de tendões flexores, de polias, de ligamentos do punho. E é o reparo de superfície do túnel do carpo: a incisão e a agulha da infiltração ficam ulnares a ele, para não atingir o mediano, que está logo abaixo e um pouco radial.',
    memoria:
      'Um em cada seis não tem, e ninguém sente falta. É o tendão "sobressalente" que a cirurgia usa como matéria-prima.',
    pontos: [
      'O tendão do palmar longo passa dentro ou fora do túnel do carpo?',
      'Qual sua relação com o nervo mediano?',
      'Por que ele é o enxerto tendíneo preferido?',
    ],
  },
  {
    termos: ['Retináculo dos Extensores', 'Retináculo dos Músculos Extensores'],
    classe: 'fascia',
    resumo: 'Faixa fibrosa transversal no dorso do punho que prende os tendões extensores ao osso.',
    localizacao: 'Cruza obliquamente o dorso do punho, do rádio distal lateralmente ao piramidal e ao pisiforme medialmente; septos partem dele para as cristas do rádio.',
    funcao:
      'Impede o "encordoamento" dos tendões: sem ele, ao estender o punho os tendões saltariam para trás como cordas de arco e perderiam eficiência. Os septos criam os seis compartimentos, cada um com bainha sinovial própria.',
    relacoes: 'Superficialmente a ele correm os ramos superficiais dos nervos radial e ulnar e a veia cefálica.',
    clinica:
      'É o retináculo que é aberto nas tenossinovites estenosantes: a liberação do primeiro compartimento trata a De Quervain. Sua reconstrução é necessária após liberações extensas, sob pena de subluxação dos tendões. E é sob ele que se acumula a sinovite reumatoide dorsal, que rompe tendões em sequência, do lado ulnar para o radial — a síndrome de Vaughan-Jackson.',
    memoria:
      'Sem retináculo, tendão vira corda de arco. É a "abraçadeira" que mantém o cabo colado ao osso.',
    pontos: [
      'Que problema mecânico o retináculo resolve?',
      'Quantos compartimentos os septos formam?',
      'O que é a síndrome de Vaughan-Jackson?',
    ],
  },
  {
    termos: ['Artéria e Nervo Ulnar'],
    classe: 'arteria',
    resumo: 'Feixe que desce no lado ulnar do antebraço e entra na mão por fora do túnel do carpo.',
    localizacao:
      'A artéria ulnar, ramo terminal maior da braquial, desce profundamente ao pronador redondo e junta-se ao nervo ulnar no terço médio do antebraço; ambos correm sob o flexor ulnar do carpo até o punho.',
    funcao:
      'A artéria é a principal fonte do arco palmar superficial; o nervo é motor de quase toda a musculatura intrínseca da mão e sensitivo do dedo mínimo e da metade ulnar do anular.',
    vascularizacao: 'A ulnar dá a interóssea comum, as recorrentes ulnares e, na mão, o arco palmar superficial e o ramo palmar profundo.',
    inervacao: 'O nervo ulnar (C8–T1) inerva o flexor ulnar do carpo e a metade ulnar do flexor profundo dos dedos no antebraço.',
    relacoes:
      'No punho, os dois atravessam o canal de Guyon, entre o pisiforme e o hâmulo do hamato — superficialmente ao retináculo dos flexores, e não dentro do túnel do carpo.',
    clinica:
      'É por essa passagem própria que a liberação do túnel do carpo não alivia sintomas ulnares. A compressão no canal de Guyon — por cisto, por trauma repetitivo do ciclista ou por trombose da artéria ulnar (síndrome do martelo hipotenar) — produz fraqueza intrínseca com sensibilidade dorsal preservada, porque o ramo dorsal saiu antes do punho. O teste de Allen avalia a contribuição das duas artérias antes de qualquer punção radial.',
    memoria:
      'Mediano entra pelo túnel; ulnar entra pelo canal de Guyon, por cima. Dois túneis, duas síndromes diferentes.',
    pontos: [
      'Por onde o nervo ulnar entra na mão?',
      'Que músculos ele inerva no antebraço?',
      'Por que a sensibilidade dorsal é poupada na compressão em Guyon?',
    ],
  },
]
