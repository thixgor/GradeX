/**
 * Pares de estruturas que o aluno troca de verdade diante do filme.
 *
 * O dossiê de `estruturas.ts` responde "o que é esta estrutura". Um quiz de
 * identificação precisa de outra coisa: por que a alternativa errada era
 * tentadora e qual detalhe do filme separa as duas. É a diferença entre saber
 * a definição de tubérculo maior e conseguir dizer, na radiografia à sua
 * frente, qual dos dois tubérculos está aceso.
 *
 * Cada entrada é simétrica: vale tanto quando a marcada é a primeira quanto
 * quando é a segunda, porque o discriminador é o mesmo nos dois sentidos. Os
 * nomes precisam bater exatamente com os usados em `ESTUDOS_RAIO_X` — o teste
 * `quiz-raio-x.test.ts` recusa qualquer par com nome órfão, para que uma
 * renomeação futura não deixe comentário pendurado no vazio.
 *
 * Quando um par não está aqui, o comentário do quiz cai no descarte automático
 * montado a partir do dossiê da alternativa errada. Esta tabela existe para os
 * casos em que o automático não é suficiente: aqueles em que as duas estruturas
 * são vizinhas, parecidas ou parte da mesma peça óssea.
 */

export interface ConfusaoRaioX {
  /** As duas estruturas confundidas, pelos nomes exatos do atlas. */
  entre: [string, string]
  /** O discriminador: o que, no filme, separa uma da outra. */
  texto: string
}

export const CONFUSOES_RAIO_X: ConfusaoRaioX[] = [
  // ───────────────────────────────── Tórax ─────────────────────────────────
  {
    entre: ['Clavículas', 'Escápulas'],
    texto:
      'As duas se projetam sobre os campos pulmonares, mas em direções opostas: a clavícula é uma barra horizontal em S que cruza o ápice, e a escápula é uma borda vertical no terço externo do hemitórax. Se a linha continua para fora do gradil costal, é escápula; se ela termina numa articulação com o manúbrio, é clavícula.',
  },
  {
    entre: ['Largura cardíaca', 'Largura torácica'],
    texto:
      'São o numerador e o denominador do mesmo índice. A largura cardíaca vai de borda a borda do coração, atravessando a linha média; a torácica vai de face interna a face interna das costelas, no ponto mais largo do gradil. Confundir as duas inverte o índice cardiotorácico e transforma um coração normal em cardiomegalia.',
  },
  {
    entre: ['Bolha gástrica', 'Ângulos costofrênicos'],
    texto:
      'A bolha gástrica é ar dentro de uma víscera, abaixo da cúpula esquerda, com nível líquido horizontal em ortostase; o ângulo costofrênico é um recesso pleural aerado por pulmão, acima do diafragma, terminando em vértice agudo contra a parede. Um está sob o diafragma, o outro sobre ele — a linha diafragmática é o divisor.',
  },
  {
    entre: ['Sombras mamárias', 'Ângulos costofrênicos'],
    texto:
      'A mama produz velamento simétrico das bases com borda inferior curva que ultrapassa o gradil lateralmente; o ângulo costofrênico é o vértice agudo logo acima, e permanece nítido mesmo por baixo da sombra mamária. Perder o vértice é derrame; apenas embaçá-lo é partes moles sobrepostas.',
  },
  {
    entre: ['Diafragma', 'Ângulos costofrênicos'],
    texto:
      'O diafragma é a cúpula inteira, do mediastino à parede lateral; o ângulo costofrênico é apenas o vértice em que essa cúpula encontra o gradil. A distinção importa porque derrame apaga primeiro o ângulo e só depois eleva ou apaga a cúpula.',
  },
  {
    entre: ['Arco aórtico', 'Hilos pulmonares'],
    texto:
      'O botão aórtico é a saliência mais alta da borda mediastinal esquerda, imediatamente acima do hilo esquerdo; o hilo é uma densidade ramificada, mais baixa e mais lateral, formada por artérias pulmonares. Regra de posição: o hilo esquerdo é sempre mais alto que o direito, mas ambos ficam abaixo do botão.',
  },
  {
    entre: ['Arco aórtico', 'Confluência VCS-ázigos'],
    texto:
      'São os dois marcos do mediastino superior, um de cada lado: o botão aórtico faz a borda esquerda, a confluência entre veia cava superior e ázigos faz a direita. Alargamento à esquerda pensa em aorta; à direita, em cava, ázigos e volemia.',
  },
  {
    entre: ['Átrio direito', 'Ventrículo esquerdo'],
    texto:
      'Na PA, a borda cardíaca direita é atrial direita e a esquerda inferior é ventricular esquerda. O ventrículo direito não faz borda na PA — ele aparece no perfil, encostado no esterno. Atribuir a borda errada à câmara errada é o erro que faz interpretar dilatação de câmara ao contrário.',
  },
  {
    entre: ['Apêndice atrial esquerdo', 'Ventrículo esquerdo'],
    texto:
      'Descendo a borda esquerda em ordem: botão aórtico, tronco da pulmonar, apêndice atrial esquerdo e, por último, o ventrículo esquerdo, que forma o segmento mais longo até o ápice. O apêndice é um segmento curto e normalmente côncavo; quando fica convexo ("retificação do arco médio"), pensa-se em aumento atrial esquerdo.',
  },
  {
    entre: ['Ventrículo direito', 'Ventrículo esquerdo'],
    texto:
      'No perfil, a borda anterior do coração — a que encosta no esterno — é ventricular direita; a borda posteroinferior é ventricular esquerda. Ocupação do espaço retroesternal aponta câmara direita; invasão do espaço retrocardíaco por baixo aponta câmara esquerda.',
  },
  {
    entre: ['Átrio esquerdo', 'Ventrículo esquerdo'],
    texto:
      'No perfil, as duas fazem a borda posterior: o átrio esquerdo em cima, o ventrículo esquerdo embaixo. O aumento atrial empurra o esôfago para trás no terço superior; o aumento ventricular ultrapassa a linha da veia cava inferior no terço inferior.',
  },
  {
    entre: ['Esterno', 'Manúbrio do esterno'],
    texto:
      'O manúbrio é o segmento superior do esterno, o que se articula com as clavículas e a primeira costela; "esterno" é a peça inteira, manúbrio mais corpo mais processo xifoide. O ângulo esternal — o degrau entre manúbrio e corpo — é o reparo de T4-T5, carina e arco aórtico.',
  },
  {
    entre: ['Traqueia', 'Corpos vertebrais'],
    texto:
      'A traqueia é uma coluna de ar, portanto mais escura que tudo à volta; os corpos vertebrais são blocos ósseos, mais claros. As duas se sobrepõem na linha média da PA justamente porque a traqueia corre à frente da coluna — a densidade é o que separa uma da outra.',
  },

  // ───────────────────────────────── Cabeça ─────────────────────────────────
  {
    entre: ['Seio frontal', 'Células etmoidais'],
    texto:
      'O seio frontal é uma cavidade única e ampla acima das órbitas, com contorno festonado; as células etmoidais são um agrupamento de câmaras pequenas entre as órbitas, na linha média. Altura e número resolvem: uma cavidade grande em cima, várias pequenas no meio.',
  },
  {
    entre: ['Seio esfenoidal', 'Sela túrcica'],
    texto:
      'A sela túrcica é a depressão óssea que aloja a hipófise e senta-se exatamente sobre o teto do seio esfenoidal. No perfil, procure primeiro a cavidade aerada central da base — o esfenoidal; a sela é o contorno ósseo em forma de sela logo acima dele.',
  },
  {
    entre: ['Sutura coronal', 'Sutura lambdoide'],
    texto:
      'A coronal é anterior e separa frontal de parietais; a lambdoide é posterior e separa parietais do occipital. As duas têm bordas serrilhadas e escleróticas — o que as distingue de uma fratura, que é linear, sem esclerose e não respeita o trajeto anatômico.',
  },
  {
    entre: ['Sutura coronal', 'Osso parietal'],
    texto:
      'A sutura é a linha; o parietal é a lâmina óssea que ela delimita. No perfil, siga a linha serrilhada de cima para baixo: à frente dela está o frontal, atrás está o parietal.',
  },
  {
    entre: ['Processo mastoide', 'Células mastoideas'],
    texto:
      'O processo mastoide é a projeção óssea cônica atrás da orelha; as células mastoideas são a trama aerada em favo dentro dele. Densidade decide: uma é osso compacto, a outra é ar. Perder a transparência das células com o processo íntegro é o sinal precoce de mastoidite.',
  },
  {
    entre: ['Osso zigomático', 'Maxila'],
    texto:
      'O zigoma é o arco lateral que forma a proeminência da bochecha e a parede externa da órbita; a maxila é o corpo central que sustenta os dentes superiores e contém o seio maxilar. O ponto de encontro das duas — a sutura zigomaticomaxilar — é um dos pilares que se procura no trauma de face.',
  },
  {
    entre: ['Seio maxilar', 'Maxila'],
    texto:
      'O seio é a cavidade aerada; a maxila é o osso que a contém. Na frontal, procure o triângulo escuro abaixo da órbita: isso é seio. O contorno ósseo em volta dele, incluindo o rebordo alveolar, é maxila.',
  },
  {
    entre: ['Septo nasal', 'Células etmoidais'],
    texto:
      'O septo é uma linha vertical única na linha média; as células etmoidais são simétricas e ficam de cada lado dele. Se a estrutura marcada é uma barra central sem par, é septo.',
  },
  {
    entre: ['Osso temporal', 'Osso parietal'],
    texto:
      'O temporal é inferolateral, denso, e carrega a pirâmide petrosa e as mastoides; o parietal é a grande lâmina lisa e superior da calota. A sutura escamosa, arqueada, é o limite entre os dois no perfil.',
  },

  // ───────────────────────────────── Abdome ─────────────────────────────────
  {
    entre: ['Intestino delgado', 'Intestino grosso'],
    texto:
      'O critério é a prega, não o calibre: no delgado as válvulas coniventes atravessam toda a luz, de parede a parede, e ficam juntas; no cólon as haustrações são incompletas, param antes da parede oposta e ficam espaçadas. A posição ajuda — delgado central, cólon periférico e emoldurando o abdome.',
  },
  {
    entre: ['Haustrações', 'Válvulas coniventes'],
    texto:
      'São as impressões que identificam cada intestino. Haustração é incompleta, espaçada e colônica; válvula conivente é completa, atravessando toda a luz, apinhada, e é do delgado. É por esse detalhe que se decide se uma distensão é obstrução alta ou baixa.',
  },
  {
    entre: ['Rins', 'Músculos psoas'],
    texto:
      'O rim é uma opacidade ovalada e oblíqua, com eixo maior acompanhando o psoas; o psoas é uma faixa triangular retilínea que desce da coluna à pelve. Regra prática: o psoas é uma linha, o rim é uma massa apoiada sobre essa linha.',
  },
  {
    entre: ['Fígado', 'Baço'],
    texto:
      'Lateralidade resolve: fígado à direita, ocupando o hipocôndrio direito e empurrando a flexura hepática para baixo quando aumenta; baço à esquerda, menor, apagando a bolha gástrica e deslocando a flexura esplênica quando aumenta.',
  },
  {
    entre: ['Estômago', 'Gás na flexura hepática'],
    texto:
      'Os dois são bolsões de ar no andar superior, mas em lados opostos: o estômago é à esquerda, sob a cúpula esquerda; a flexura hepática é à direita, encaixada sob o fígado. Ar à direita sob o diafragma pede um segundo olhar — distinguir cólon interposto de pneumoperitônio depende de ver haustração dentro do gás.',
  },
  {
    entre: ['Reto', 'Intestino grosso'],
    texto:
      'O reto é o segmento terminal, na linha média da pelve, atrás da bexiga e frequentemente com fezes e gás; "intestino grosso" é toda a moldura colônica que chega até ele. Marcação baixa e central é reto; marcação periférica e emoldurando o abdome é cólon.',
  },
  {
    entre: ['Cristas ilíacas', 'Articulações sacroilíacas'],
    texto:
      'A crista é a borda superior do osso ilíaco, convexa e periférica; a sacroilíaca é a interlinha oblíqua entre sacro e ílio, central e mais baixa. Uma é contorno externo, a outra é articulação interna.',
  },

  // ───────────────────────────────── Ombro ─────────────────────────────────
  {
    entre: ['Tubérculo maior', 'Tubérculo menor'],
    texto:
      'Na AP com o braço em rotação externa, o tubérculo maior é lateral e forma o contorno externo do úmero proximal; o menor é medial e se projeta sobre a cabeça umeral. Em rotação interna os dois se sobrepõem e o úmero fica com aspecto de "pirulito" — o mesmo sinal que se procura na luxação posterior.',
  },
  {
    entre: ['Colo anatômico do úmero', 'Colo cirúrgico do úmero'],
    texto:
      'O colo anatômico é o sulco estreito logo abaixo da superfície articular, entre a cabeça e os tubérculos; o colo cirúrgico é o estreitamento mais baixo, abaixo dos tubérculos. O nome não é decorativo: a fratura comum é a do colo cirúrgico, e é ela que ameaça o nervo axilar e a artéria circunflexa.',
  },
  {
    entre: ['Processo coracoide', 'Extremidade acromial da clavícula'],
    texto:
      'O coracoide é uma projeção anterior da escápula que aponta para a frente e para fora, medial e abaixo do acrômio; a extremidade acromial da clavícula é o fim lateral da clavícula, formando a articulação acromioclavicular. A distância coracoclavicular medida entre eles é o que define lesão acromioclavicular grave.',
  },
  {
    entre: ['Cavidade glenoidal', 'Cabeça do úmero'],
    texto:
      'A glenoide é a superfície côncava e rasa da escápula; a cabeça do úmero é a esfera que se apoia nela. O que se avalia é a relação: espaço glenoumeral regular e superfícies paralelas indicam congruência — perda desse paralelismo é luxação até prova em contrário.',
  },
  {
    entre: ['Tubérculo supraglenoidal', 'Tubérculo infraglenoidal'],
    texto:
      'Ambos ficam na borda da glenoide, um acima e outro abaixo. O supraglenoidal ancora a cabeça longa do bíceps; o infraglenoidal, a cabeça longa do tríceps. Posição relativa à interlinha glenoumeral é o único discriminador na radiografia.',
  },
  {
    entre: ['Ângulo inferior', 'Ângulo lateral'],
    texto:
      'O ângulo inferior é o vértice mais baixo da escápula, onde as bordas medial e lateral se encontram; o ângulo lateral é a região espessa que sustenta a cavidade glenoidal. Um é ponta livre, o outro é a base do encaixe do ombro.',
  },
  {
    entre: ['Borda medial', 'Borda lateral'],
    texto:
      'A borda medial (vertebral) é a que corre paralela à coluna e é a maior responsável por falso pneumotórax na radiografia de tórax; a borda lateral (axilar) é mais espessa, voltada para a axila, e converge para o ângulo lateral e a glenoide.',
  },
  {
    entre: ['Extremidade acromial da clavícula', 'Extremidade esternal da clavícula'],
    texto:
      'A extremidade acromial é lateral e articula-se com o acrômio; a esternal é medial e articula-se com o manúbrio. Na radiografia de tórax em PA, é a distância das extremidades esternais aos processos espinhosos que julga rotação.',
  },

  // ───────────────────────── Cotovelo, punho e mão ─────────────────────────
  {
    entre: ['Capítulo do úmero', 'Tróclea do úmero'],
    texto:
      'O capítulo é lateral e arredondado, e articula-se com a cabeça do rádio; a tróclea é medial e tem forma de carretel, articulando-se com a incisura troclear da ulna. É por isso que a linha radiocapitelar — traçada pelo eixo do rádio — precisa cruzar o capítulo, e não a tróclea, em qualquer incidência.',
  },
  {
    entre: ['Epicôndilo medial', 'Epicôndilo lateral'],
    texto:
      'O medial é maior e ancora os flexores e pronadores, com o nervo ulnar no sulco atrás dele; o lateral ancora os extensores. Na criança, o epicôndilo medial deslocado pode migrar para dentro da articulação e ser confundido com a tróclea — a ordem de ossificação (CRITOE) é o que evita esse erro.',
  },
  {
    entre: ['Fossa do olécrano', 'Olécrano'],
    texto:
      'A fossa é uma depressão no úmero distal posterior, que aparece como área mais escura por afinamento ósseo; o olécrano é a proeminência da ulna que se encaixa nela na extensão. Uma é buraco no úmero, a outra é osso da ulna — e a fossa cheia de líquido é onde nasce o sinal do coxim adiposo posterior.',
  },
  {
    entre: ['Cabeça do rádio', 'Colo do rádio'],
    texto:
      'A cabeça é o disco articular proximal, achatado; o colo é o segmento estreito imediatamente abaixo dela, antes da tuberosidade. A fratura de cabeça do rádio é a mais frequente do cotovelo do adulto e às vezes só se anuncia pelo coxim adiposo — daí a importância de saber qual dos dois se está olhando.',
  },
  {
    entre: ['Processo coronoide', 'Olécrano'],
    texto:
      'No perfil, a ulna proximal tem duas pontas: o olécrano, posterior e superior, e o processo coronoide, anterior e inferior. As duas delimitam a incisura troclear. A fratura de coronoide costuma vir com luxação — é parte da "tríade terrível" do cotovelo.',
  },
  {
    entre: ['Incisura troclear', 'Incisura radial da ulna'],
    texto:
      'A incisura troclear é a grande concavidade em C da ulna que abraça a tróclea umeral; a incisura radial é uma faceta pequena e lateral, onde a cabeça do rádio gira. Tamanho e direção resolvem: uma abraça o úmero, a outra encara o rádio.',
  },
  {
    entre: ['Escafoide', 'Semilunar'],
    texto:
      'Na fileira proximal do carpo, o escafoide é o mais lateral (do lado do polegar), alongado e oblíquo; o semilunar é central, com formato de meia-lua e vértice para baixo. É o semilunar que muda de forma na luxação — assume aspecto triangular, o "sinal da fatia de torta" — enquanto o escafoide é o que fratura na queda com mão espalmada.',
  },
  {
    entre: ['Semilunar', 'Capitato'],
    texto:
      'O semilunar é da fileira proximal e se articula com o rádio; o capitato é o maior osso do carpo, da fileira distal, e sua cabeça se encaixa na concavidade do semilunar. O alinhamento rádio-semilunar-capitato no perfil é a checagem que revela luxação perilunar.',
  },
  {
    entre: ['Piramidal', 'Pisiforme'],
    texto:
      'O piramidal é o osso da fileira proximal do lado ulnar; o pisiforme é um sesamoide pequeno e redondo apoiado sobre ele, na face palmar. Na PA os dois se sobrepõem — o pisiforme é a densidade oval sobreposta, e é o perfil que o descola.',
  },
  {
    entre: ['Trapézio', 'Trapezoide'],
    texto:
      'O trapézio é o mais lateral da fileira distal e articula-se com o primeiro metacarpo, formando a articulação em sela do polegar; o trapezoide é o menor, imediatamente medial a ele, atrás do segundo metacarpo. Siga o metacarpo até o carpo: é o modo mais rápido de nomear os dois.',
  },
  {
    entre: ['Hamato', 'Capitato'],
    texto:
      'Os dois são da fileira distal: o capitato é central e o maior de todos, o hamato é o mais medial e traz o hâmulo — um anel denso sobreposto que parece um "olho" na PA. Ver esse anel é o jeito de nomear o hamato sem contar ossos.',
  },
  {
    entre: ['Processo estiloide do rádio', 'Processo estiloide da ulna'],
    texto:
      'O estiloide radial é lateral e desce mais que o ulnar — em média 10 a 12 mm a mais. Perder essa diferença de altura (inclinação radial reduzida) é o que denuncia impactação numa fratura de rádio distal.',
  },
  {
    entre: ['Falanges médias', 'Falanges proximais'],
    texto:
      'Conte a partir do metacarpo: a primeira falange é a proximal, a segunda é a média, a terceira é a distal com sua tuberosidade em leque. O polegar não tem falange média — só proximal e distal.',
  },
  {
    entre: ['Rádio', 'Ulna'],
    texto:
      'O rádio é lateral, do lado do polegar, e alarga distalmente; a ulna é medial, do lado do dedo mínimo, e é mais espessa na região proximal, onde forma o olécrano. Identificar o polegar na imagem resolve a lateralidade e, com ela, os dois ossos.',
  },

  // ───────────────────────────── Pelve e quadril ─────────────────────────────
  {
    entre: ['Trocânter maior', 'Trocânter menor'],
    texto:
      'O trocânter maior é lateral, alto e volumoso; o menor é uma projeção posteromedial, mais baixa, e só aparece bem com o quadril em rotação externa. Trocânter menor muito proeminente numa AP significa rotação externa do membro — achado que acompanha fratura de colo femoral.',
  },
  {
    entre: ['Cabeça do fêmur', 'Colo do fêmur'],
    texto:
      'A cabeça é a esfera articular dentro do acetábulo; o colo é o segmento que a liga aos trocânteres. A linha de Shenton — arco contínuo entre a borda inferior do colo e a borda superior do forame obturatório — é o que denuncia fratura ou luxação, e ela passa pelo colo, não pela cabeça.',
  },
  {
    entre: ['Acetábulo', 'Cabeça do fêmur'],
    texto:
      'O acetábulo é a taça do osso ilíaco; a cabeça femoral é a esfera dentro dela. O que se avalia é o espaço entre os dois: uniforme em toda a extensão no quadril normal, reduzido superiormente na artrose e assimétrico no derrame ou na luxação.',
  },
  {
    entre: ['Espinha ilíaca anterossuperior', 'Espinha ilíaca anteroinferior'],
    texto:
      'A anterossuperior é o ponto mais anterior da crista ilíaca, onde se inserem o sartório e o ligamento inguinal; a anteroinferior fica abaixo dela, acima do acetábulo, e ancora o reto femoral. As duas são sítios clássicos de avulsão apofisária no atleta adolescente — e a altura é o que diz qual delas se soltou.',
  },
  {
    entre: ['Ramo superior do púbis', 'Ramo inferior do púbis'],
    texto:
      'Os dois delimitam o forame obturatório: o superior forma o teto, indo do corpo do púbis ao acetábulo; o inferior forma o assoalho anterior e desce até o ísquio. Fratura de um ramo obriga a procurar a segunda quebra — o anel pélvico raramente se rompe em um ponto só.',
  },
  {
    entre: ['Sínfise púbica', 'Corpo do púbis'],
    texto:
      'A sínfise é a articulação fibrocartilagínea na linha média; o corpo do púbis é a massa óssea de cada lado dela. Diástase da sínfise acima de cerca de 10 mm indica ruptura do anel anterior e obriga a avaliar o anel posterior e as sacroilíacas.',
  },
  {
    entre: ['Tuberosidade isquiática', 'Espinha isquiática'],
    texto:
      'A tuberosidade é a massa inferior sobre a qual o corpo se senta e onde se inseriam os isquiotibiais; a espinha é uma projeção fina e medial, acima dela, ponto de reparo do ligamento sacroespinhal. Uma é volumosa e baixa, a outra é pontiaguda e mais alta.',
  },
  {
    entre: ['Forame obturatório', 'Estreito superior da pelve'],
    texto:
      'O forame obturatório é a janela oval de cada lado, delimitada pelos ramos púbicos e pelo ísquio; o estreito superior é a linha contínua que contorna a entrada pélvica, do promontório sacral à sínfise. Um é buraco pareado, o outro é um anel único — e assimetria entre os forames é sinal indireto de fratura do anel.',
  },
  {
    entre: ['Sacro', 'Cóccix'],
    texto:
      'O sacro é o bloco triangular grande, com forames anteriores em pares e arcos que devem formar linhas contínuas; o cóccix é o pequeno apêndice curvo abaixo dele. Fratura do sacro se procura nas linhas dos arcos sacrais; o cóccix quase nunca muda conduta.',
  },
  {
    entre: ['Ílio', 'Crista ilíaca'],
    texto:
      'O ílio é a asa inteira do osso do quadril; a crista ilíaca é apenas sua borda superior, palpável e curva. A crista serve de referência para altura (nível de L4) e para punção de medula óssea; o ílio é o campo onde se procuram fraturas e lesões líticas.',
  },
  {
    entre: ['Articulação sacroilíaca', 'Sacro'],
    texto:
      'A sacroilíaca é a interlinha oblíqua entre o sacro e o ílio, com duas corticais paralelas; o sacro é o osso medial que ela delimita. Esclerose e irregularidade nessa interlinha — e não no corpo do sacro — é o que se procura nas espondiloartrites.',
  },

  // ───────────────────────── Joelho, perna e pé ─────────────────────────
  {
    entre: ['Côndilo femoral medial', 'Côndilo femoral lateral'],
    texto:
      'Na AP, o medial é o mais volumoso e desce mais que o lateral; a interlinha medial é a que primeiro se estreita na artrose. Sem saber a lateralidade da imagem, use a fíbula: ela é sempre lateral, e resolve os dois côndilos, os dois platôs e as duas espinhas de uma vez.',
  },
  {
    entre: ['Platô tibial medial', 'Platô tibial lateral'],
    texto:
      'O platô lateral é convexo e fica do lado da fíbula; o medial é côncavo e sustenta mais carga. A fratura de platô lateral é a mais comum, típica do impacto em valgo, e pode aparecer só como afundamento sutil da cortical — comparar as alturas dos dois platôs é o método.',
  },
  {
    entre: ['Espinha tibial medial', 'Espinha tibial lateral'],
    texto:
      'São os dois tubérculos da eminência intercondilar, entre os platôs, e servem de ancoragem para os ligamentos cruzados e os meniscos. Avulsão da espinha, principalmente em criança, equivale a lesão do cruzado anterior — o osso cede antes do ligamento.',
  },
  {
    entre: ['Cabeça da fíbula', 'Colo da fíbula'],
    texto:
      'A cabeça é a extremidade proximal alargada, articulando-se com a tíbia; o colo é o estreitamento logo abaixo, por onde passa o nervo fibular comum. Fratura de colo da fíbula pede exame neurológico do pé caído — é a razão clínica de distinguir os dois.',
  },
  {
    entre: ['Coxins adiposos', 'Recesso suprapatelar'],
    texto:
      'Os coxins adiposos são faixas de gordura, mais escuras que partes moles, que emolduram o recesso; o recesso suprapatelar é o espaço articular entre eles, acima da patela. Derrame preenche o recesso, separa os coxins e cria a densidade em faixa maior que 5 mm que se procura no perfil.',
  },
  {
    entre: ['Tendão patelar', 'Tendão do quadríceps'],
    texto:
      'O quadríceps chega por cima, inserindo-se no polo superior da patela; o patelar sai do polo inferior e desce até a tuberosidade da tíbia. Patela alta sugere ruptura do tendão patelar; patela baixa sugere ruptura do quadríceps — o sentido do deslocamento nomeia o tendão roto.',
  },
  {
    entre: ['Tálus', 'Calcâneo'],
    texto:
      'O tálus é o osso superior, encaixado entre as maléolos e transmitindo a carga da perna; o calcâneo é o osso do calcanhar, abaixo e atrás dele. O ângulo de Böhler é medido no calcâneo e cai nas fraturas por queda de altura — que costumam vir acompanhadas de fratura da coluna toracolombar.',
  },
  {
    entre: ['Tíbia', 'Fíbula'],
    texto:
      'A tíbia é o osso medial, espesso, que sustenta a carga; a fíbula é o osso lateral, fino, que quase não sustenta peso e forma o maléolo lateral. A fíbula é a referência de lateralidade em qualquer radiografia de perna, joelho ou tornozelo.',
  },

  // ─────────────────────────── Coluna cervical e lombar ───────────────────────────
  {
    entre: ['Processo odontoide (dente)', 'Arco anterior do atlas (C1)'],
    texto:
      'O odontoide é a projeção vertical do corpo de C2; o arco anterior de C1 é a barra óssea à frente dele, vista de topo no perfil. O que se mede é o intervalo entre os dois: até 3 mm no adulto e 5 mm na criança. Alargamento indica lesão do ligamento transverso.',
  },
  {
    entre: ['Massas laterais do atlas (C1)', 'Massas laterais do áxis (C2)'],
    texto:
      'Na incidência transoral, as massas de C1 ficam acima e as de C2 abaixo, e suas bordas laterais devem estar alinhadas em coluna. Desalinhamento maior que 7 mm somando os dois lados sugere fratura de Jefferson — mas rotação da cabeça simula esse desvio.',
  },
  {
    entre: ['Processos articulares superiores', 'Processos articulares inferiores'],
    texto:
      'Cada vértebra tem os dois: os superiores sobem para receber a vértebra de cima, os inferiores descem para se apoiar na de baixo. É o par entre vértebras vizinhas que forma a articulação zigapofisária — e uma faceta "saltada" para frente é o que caracteriza a luxação facetária.',
  },
  {
    entre: ['Pars interarticularis', 'Articulações zigapofisárias'],
    texto:
      'A pars é a ponte óssea entre os processos articulares superior e inferior da mesma vértebra; a zigapofisária é a articulação entre duas vértebras. Defeito da pars é espondilólise — o "cachorrinho com coleira" nas oblíquas — e é distinto de artrose facetária.',
  },
  {
    entre: ['Forames intervertebrais', 'Espaços discais intervertebrais'],
    texto:
      'O forame é a janela óssea por onde sai a raiz nervosa, mais bem vista nas oblíquas cervicais; o espaço discal é a altura entre dois platôs vertebrais, avaliada no perfil. Um é orifício lateral, o outro é altura entre corpos — e osteófitos podem estreitar o forame com disco ainda preservado.',
  },
  {
    entre: ['Pedículos', 'Processos transversos'],
    texto:
      'Na frontal, os pedículos são os dois "olhos" ovais e corticalizados dentro do contorno do corpo vertebral; os processos transversos são as projeções laterais que saem para fora dele. Pedículo apagado é o sinal da "coruja piscando", clássico de metástase; processo transverso fraturado na lombar levanta suspeita de lesão renal.',
  },
  {
    entre: ['Processos espinhosos', 'Processos transversos'],
    texto:
      'Na frontal, o processo espinhoso é visto de topo, como uma densidade oval na linha média; os transversos saem lateralmente, um de cada lado. Alinhar os espinhosos é o método de julgar rotação da incidência e desvio da linha média.',
  },
  {
    entre: ['Arco anterior do atlas (C1)', 'Arco posterior do atlas (C1)'],
    texto:
      'C1 é um anel sem corpo vertebral: o arco anterior é a barra pequena à frente do odontoide, o posterior é o arco mais longo atrás, que compõe a linha espinolaminar. É pelo arco posterior que passa a terceira das quatro linhas de alinhamento cervical.',
  },
  {
    entre: ['Costelas', 'Processos transversos'],
    texto:
      'Na radiografia frontal da coluna, os dois se cruzam: o processo transverso é curto e nasce do arco vertebral, a costela continua lateralmente muito além dele, curvando-se para fora. Seguir a densidade para a periferia é o que separa uma da outra — e uma costela em L1 ou um processo transverso alargado em L5 mudam a contagem dos níveis.',
  },
  {
    entre: ['Corpos vertebrais', 'Espaços discais intervertebrais'],
    texto:
      'O corpo é o bloco ósseo; o espaço discal é o intervalo radiotransparente entre dois corpos, onde está o disco, que a radiografia não mostra diretamente. Perda de altura do corpo é fratura; perda de altura do espaço é doença discal.',
  },
]

function chave(a: string, b: string): string {
  return `${a} ${b}`
}

const INDICE_CONFUSOES = new Map<string, string>()
for (const { entre, texto } of CONFUSOES_RAIO_X) {
  INDICE_CONFUSOES.set(chave(entre[0], entre[1]), texto)
  INDICE_CONFUSOES.set(chave(entre[1], entre[0]), texto)
}

/** Discriminador curado entre duas estruturas, quando existe um. */
export function confusaoEntre(a: string, b: string): string | undefined {
  return INDICE_CONFUSOES.get(chave(a, b))
}

/** Todas as estruturas que têm par curado com `nome`. */
export function paresConfundiveis(nome: string): string[] {
  const pares: string[] = []
  for (const { entre } of CONFUSOES_RAIO_X) {
    if (entre[0] === nome) pares.push(entre[1])
    else if (entre[1] === nome) pares.push(entre[0])
  }
  return pares
}
