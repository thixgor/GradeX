import type { EntradaDicionario } from './tipos'

/**
 * Pulmões, brônquios e diafragma.
 *
 * Os pulmões são assimétricos por uma razão só: o coração ocupa o espaço à
 * esquerda. Dessa assimetria decorre quase toda a anatomia comparada dos dois
 * lados — número de lobos, forma do hilo, ângulo dos brônquios — e, com ela,
 * boa parte da clínica: onde o corpo estranho vai parar, onde a pneumonia
 * aspirativa se instala, onde o dreno precisa chegar.
 */
export const RESPIRATORIO_PULMOES: EntradaDicionario[] = [
  {
    termos: ['Ápice do Pulmão', 'Ápice do Pulmão Direito', 'Ápice do Pulmão Esquerdo'],
    classe: 'via-aerea',
    resumo: 'Extremidade superior arredondada do pulmão, que ultrapassa a clavícula e alcança a raiz do pescoço.',
    localizacao: 'Projeta-se de 2 a 3 cm acima do terço medial da clavícula, coberto pela cúpula pleural e pela membrana suprapleural.',
    funcao: 'É a região de menor perfusão e maior relação ventilação/perfusão do pulmão em pé, por efeito da gravidade sobre a circulação pulmonar.',
    relacoes: 'Sobre o ápice cruzam a artéria e a veia subclávias e o tronco inferior do plexo braquial; a primeira costela o contorna.',
    clinica:
      'Duas consequências opostas nascem daqui. A alta relação ventilação/perfusão apical, com maior tensão de oxigênio, favorece a tuberculose, que é bacilo aeróbio — daí a predileção pelos ápices. E a vizinhança com o plexo e o simpático explica o tumor de Pancoast: dor no ombro e no braço em território ulnar, atrofia da mão e síndrome de Horner, muitas vezes antes de qualquer sintoma respiratório.',
    memoria:
      'O ápice do pulmão sobe acima da clavícula. Por isso ferimento na base do pescoço é ferimento de tórax.',
    pontos: [
      'Quanto o ápice pulmonar ultrapassa a clavícula?',
      'Por que a tuberculose prefere os ápices?',
      'O que caracteriza o tumor de Pancoast?',
    ],
  },
  {
    termos: ['Base do Pulmão', 'Face Diafragmática (Base do Pulmão)'],
    classe: 'via-aerea',
    resumo: 'Face inferior côncava do pulmão, apoiada sobre a cúpula do diafragma.',
    localizacao: 'Face inferior, moldada pela convexidade diafragmática; a base direita é mais alta que a esquerda, por causa do fígado.',
    funcao: 'É a região de maior perfusão e maior ventilação em pé, mas com relação ventilação/perfusão menor que a do ápice.',
    relacoes: 'Abaixo do diafragma, à direita está o fígado; à esquerda, o estômago e o baço.',
    clinica:
      'A maior perfusão basal é o que faz a maioria dos êmbolos e das pneumonias hematogênicas se alojar nas bases. E o desnível entre as cúpulas explica um erro frequente: no trauma toracoabdominal, uma lesão que entra pelo 5º espaço à direita pode atingir o fígado, porque em expiração a cúpula sobe até o 4º espaço. Todo ferimento abaixo da linha mamilar é toracoabdominal até prova em contrário.',
    memoria:
      'A cúpula direita sobe até a altura do mamilo. Faca no peito baixo é faca no fígado.',
    pontos: [
      'Por que a base direita do pulmão é mais alta?',
      'Por que os êmbolos se alojam preferencialmente nas bases?',
      'Por que ferimentos torácicos baixos são considerados toracoabdominais?',
    ],
  },
  {
    termos: ['Hilo do Pulmão'],
    classe: 'via-aerea',
    resumo: 'Região da face medial por onde entram e saem brônquios, vasos e nervos — a raiz do pulmão.',
    localizacao: 'Face mediastinal de cada pulmão, ao nível de T5 a T7.',
    funcao:
      'Reúne o brônquio principal, a artéria pulmonar, as duas veias pulmonares, as artérias e veias brônquicas, os linfáticos e os plexos nervosos, todos envolvidos pela reflexão pleural que se prolonga inferiormente como ligamento pulmonar.',
    relacoes:
      'A disposição difere entre os lados: à direita o brônquio é a estrutura mais posterior e o lobar superior passa acima da artéria (brônquio eparterial); à esquerda a artéria é a mais superior.',
    clinica:
      'Essa diferença é o que orienta a leitura da tomografia e a dissecção na lobectomia. As adenopatias hilares são o achado central da sarcoidose (bilaterais e simétricas), da tuberculose primária (unilaterais) e do linfoma. O ligamento pulmonar, abaixo do hilo, é seccionado nas cirurgias para permitir a expansão do pulmão remanescente.',
    memoria:
      'RALS: Right Anterior, Left Superior — posição da artéria pulmonar em relação ao brônquio, de cada lado.',
    pontos: [
      'Que estruturas compõem a raiz do pulmão?',
      'Como a artéria pulmonar se posiciona em cada hilo?',
      'Que doenças cursam com adenopatia hilar?',
    ],
  },
  {
    termos: ['Fissura Oblíqua'],
    classe: 'via-aerea',
    resumo: 'Fissura presente nos dois pulmões, que separa o lobo inferior dos demais.',
    localizacao:
      'Corre do processo espinhoso de T2, atrás, até a 6ª cartilagem costal, à frente — o trajeto da borda medial da escápula com o braço elevado acima da cabeça.',
    funcao: 'Divide o pulmão esquerdo em dois lobos e separa, no direito, o lobo inferior dos lobos superior e médio.',
    relacoes: 'Revestida por pleura visceral nas duas faces.',
    clinica:
      'Esse trajeto é o que permite localizar os lobos na ausculta: à frente e acima da fissura ouve-se o lobo superior (e o médio, à direita); nas costas, abaixo dela, o lobo inferior. Auscultar apenas o dorso é auscultar quase só lobos inferiores — erro comum que faz pneumonias de lobo médio passarem despercebidas. Na radiografia em perfil, a fissura oblíqua é a linha que localiza qualquer consolidação.',
    memoria:
      'Peça ao paciente para levantar o braço: a borda da escápula desenha a fissura oblíqua. Na frente é lobo de cima, atrás é lobo de baixo.',
    pontos: [
      'Qual o trajeto de superfície da fissura oblíqua?',
      'Que lobos ela separa em cada pulmão?',
      'Por que auscultar só o dorso é insuficiente?',
    ],
  },
  {
    termos: ['Lobo Superior Direito', 'Lobo Superior do Pulmão Direito'],
    classe: 'via-aerea',
    resumo: 'Lobo mais alto do pulmão direito, acima da fissura horizontal.',
    localizacao: 'Ocupa a porção superior do pulmão direito, delimitado abaixo pela fissura horizontal e atrás pela oblíqua.',
    funcao: 'Contém três segmentos: apical, posterior e anterior.',
    relacoes: 'É ventilado pelo brônquio lobar superior direito, que sai acima da artéria pulmonar.',
    clinica:
      'O segmento posterior do lobo superior direito é, junto com o superior do lobo inferior, o destino preferencial da aspiração no paciente em decúbito dorsal — porque são os segmentos mais posteriores e o brônquio direito é mais vertical. Saber isso permite prever, pela posição do paciente, onde a pneumonia aspirativa vai aparecer na radiografia.',
    memoria:
      'Aspirou deitado de costas: pneumonia no segmento posterior do lobo superior ou no superior do inferior, à direita.',
    pontos: [
      'Quantos segmentos tem o lobo superior direito?',
      'Que fissuras o delimitam?',
      'Onde se instala a pneumonia aspirativa em decúbito dorsal?',
    ],
  },
  {
    termos: ['Lobo Médio', 'Lobo Médio do Pulmão Direito'],
    classe: 'via-aerea',
    resumo: 'Lobo exclusivo do pulmão direito, entre as fissuras horizontal e oblíqua.',
    localizacao: 'Porção anteroinferior do pulmão direito, com projeção na parede anterior do tórax, entre a 4ª e a 6ª costela.',
    funcao: 'Contém dois segmentos: lateral e medial.',
    relacoes: 'Seu brônquio é longo, estreito e sai em ângulo agudo, circundado por linfonodos.',
    clinica:
      'Essa geometria desfavorável é a base da síndrome do lobo médio: atelectasia crônica e recorrente por compressão extrínseca do brônquio pelos linfonodos ou por má drenagem, com infecções de repetição no mesmo lugar. É também o lobo mais frequentemente auscultado de forma inadequada, porque só se ouve bem na face anterior e na axila.',
    memoria:
      'O lobo médio só existe à direita, e seu brônquio é fino, longo e cercado de gânglios. Por isso ele fecha e não abre.',
    pontos: [
      'Que fissuras delimitam o lobo médio?',
      'Onde ele é auscultado?',
      'O que é a síndrome do lobo médio?',
    ],
  },
  {
    termos: ['Lobo Inferior Direito', 'Lobo Inferior do Pulmão Direito', 'Lobo Inferior Esquerdo', 'Lobo Inferior do Pulmão Esquerdo'],
    classe: 'via-aerea',
    resumo: 'Lobo posteroinferior de cada pulmão, o maior em volume, abaixo da fissura oblíqua.',
    localizacao: 'Ocupa a maior parte da face posterior e da base de cada pulmão.',
    funcao: 'Contém cinco segmentos à direita (superior e quatro basais) e quatro à esquerda, onde o basal anterior e o medial costumam se fundir.',
    relacoes: 'Sua face inferior é a base, apoiada no diafragma.',
    clinica:
      'É o lobo mais acometido em pneumonias aspirativas, em atelectasias pós-operatórias — pela compressão em decúbito e pela dor que impede a inspiração profunda — e em derrames, que se acumulam por gravidade. A fisioterapia respiratória e a mobilização precoce no pós-operatório existem por causa dessa anatomia.',
    memoria:
      'A maior parte do pulmão está nas costas, não no peito. Quem ausculta só a frente ausculta a menor parte.',
    pontos: [
      'Quantos segmentos tem o lobo inferior de cada lado?',
      'Por que ele é o mais acometido no pós-operatório?',
      'Onde ele é melhor auscultado?',
    ],
  },
  {
    termos: ['Lobo Superior Esquerdo', 'Lobo Superior do Pulmão Esquerdo'],
    classe: 'via-aerea',
    resumo: 'Lobo superior do pulmão esquerdo, que incorpora a língula — o equivalente do lobo médio.',
    localizacao: 'Acima da fissura oblíqua, ocupando a porção anterossuperior do pulmão esquerdo.',
    funcao: 'Contém quatro ou cinco segmentos: apicoposterior, anterior e os dois lingulares, superior e inferior.',
    relacoes: 'A incisura cardíaca escava sua borda anterior.',
    clinica:
      'A fusão dos segmentos apical e posterior num único apicoposterior, e a ausência de fissura horizontal, são consequências diretas da presença do coração à esquerda. Na prática, a segmentectomia lingular esquerda é o equivalente funcional da lobectomia média direita — mesma cirurgia, nomes diferentes por acidente anatômico.',
    memoria:
      'À esquerda não há lobo médio: há língula, incorporada ao superior. O coração tomou o lugar.',
    pontos: [
      'Que segmentos o lobo superior esquerdo contém?',
      'Por que não há lobo médio à esquerda?',
      'Qual o equivalente esquerdo da lobectomia média?',
    ],
  },
  {
    termos: ['Língula do Pulmão Esquerdo'],
    classe: 'via-aerea',
    resumo: 'Projeção em língua do lobo superior esquerdo, abaixo da incisura cardíaca.',
    localizacao: 'Porção anteroinferior do lobo superior esquerdo, contornando o coração por baixo.',
    funcao: 'Contém os segmentos lingulares superior e inferior, homólogos aos segmentos do lobo médio direito.',
    relacoes: 'Repousa sobre o pericárdio, à frente do coração.',
    clinica:
      'É a porção de pulmão que se interpõe entre o coração e a parede torácica: sua consolidação apaga a borda cardíaca esquerda na radiografia — o sinal da silhueta, que localiza a pneumonia sem precisar de perfil. O mesmo raciocínio vale à direita: consolidação que apaga a borda direita do coração está no lobo médio.',
    memoria:
      'Sumiu a borda do coração na radiografia? A consolidação está encostada nele — língula à esquerda, lobo médio à direita.',
    pontos: [
      'Que segmentos a língula contém?',
      'A que porção do pulmão direito ela corresponde?',
      'O que é o sinal da silhueta?',
    ],
  },
  {
    termos: ['Incisura Cardíaca'],
    classe: 'via-aerea',
    resumo: 'Recorte na borda anterior do pulmão esquerdo que acomoda o coração.',
    localizacao: 'Borda anterior do pulmão esquerdo, entre a 4ª e a 6ª cartilagem costal.',
    funcao: 'Abre espaço para o coração, deixando uma área em que o pericárdio contata diretamente a parede torácica.',
    relacoes: 'Corresponde à área de macicez cardíaca à percussão, entre os recessos pleurais.',
    clinica:
      'É essa área desprovida de pulmão que torna possível a punção pericárdica pela via paraesternal esquerda e que define a janela acústica do ecocardiograma. Na percussão do tórax, a macicez cardíaca nessa região é normal — e seu desaparecimento sugere enfisema, com hiperinsuflação do pulmão cobrindo o coração.',
    memoria:
      'Um pedaço de coração encostado no peito, sem pulmão no meio. É por essa janela que o eco enxerga e a agulha entra.',
    pontos: [
      'Que estrutura ocupa a incisura cardíaca?',
      'Que utilidade clínica essa área oferece?',
      'O que significa o desaparecimento da macicez cardíaca?',
    ],
  },
  {
    termos: ['Impressão Cardíaca'],
    classe: 'via-aerea',
    resumo: 'Concavidade na face mediastinal do pulmão moldada pelo coração.',
    localizacao: 'Face medial de cada pulmão, à frente do hilo; muito mais profunda à esquerda.',
    funcao: 'Acomoda o coração e o pericárdio; sua profundidade assimétrica reflete a posição levogira do coração.',
    relacoes: 'Ao redor dela, outras impressões marcam a aorta, o esôfago, a veia ázigo e as artérias subclávias.',
    clinica:
      'Essas impressões, visíveis no cadáver, são o mapa das relações mediastinais e a base da leitura das linhas mediastinais na radiografia de tórax. A linha paraesofágica, a paravertebral e o botão aórtico são exatamente essas impressões vistas em duas dimensões — e seu apagamento ou desvio é o que denuncia massas mediastinais.',
    memoria:
      'O pulmão é uma esponja que guarda o formato dos vizinhos. Cada impressão é o retrato de um órgão do mediastino.',
    pontos: [
      'Por que a impressão cardíaca é maior à esquerda?',
      'Que outras impressões existem na face mediastinal?',
      'Como isso se relaciona com as linhas mediastinais na radiografia?',
    ],
  },
  {
    termos: ['Impressões Costais'],
    classe: 'via-aerea',
    resumo: 'Sulcos transversais na face costal do pulmão, marcados pelas costelas.',
    localizacao: 'Face costal de cada pulmão, sobretudo em pulmões fixados por formol.',
    funcao: 'São artefatos da fixação que revelam o contato íntimo entre o pulmão e a caixa torácica, mediado pelas duas lâminas pleurais.',
    relacoes: 'Correspondem às costelas e aos espaços intercostais.',
    clinica:
      'Esse contato íntimo, mantido pela pressão negativa intrapleural, é o que faz o pulmão acompanhar a expansão do tórax — o acoplamento sem o qual não haveria ventilação. Quando o espaço pleural admite ar, esse acoplamento se desfaz e o pulmão colapsa por sua própria retração elástica: é o pneumotórax.',
    memoria:
      'O pulmão não se expande sozinho: ele é puxado pela caixa. Entre ar no meio e o acoplamento acaba.',
    pontos: [
      'O que as impressões costais revelam?',
      'O que mantém o pulmão acoplado à parede torácica?',
      'O que acontece quando esse acoplamento se perde?',
    ],
  },
  {
    termos: ['Brônquio Lobar Superior Direito'],
    classe: 'via-aerea',
    resumo: 'Primeiro brônquio lobar do lado direito, que sai acima da artéria pulmonar — o brônquio eparterial.',
    localizacao: 'Sai da face lateral do brônquio principal direito, cerca de 2 cm após a carina, e divide-se em três brônquios segmentares.',
    funcao: 'Ventila o lobo superior direito; é o único brônquio lobar que passa acima da artéria pulmonar.',
    relacoes: 'Essa relação define o brônquio eparterial, exclusivo do lado direito.',
    clinica:
      'Sua origem alta é uma armadilha da intubação seletiva: um tubo introduzido além do necessário entra no brônquio principal direito e frequentemente ultrapassa a origem do lobar superior, ventilando apenas os lobos médio e inferior. O resultado é atelectasia do lobo superior direito — uma das causas mais comuns de hipoxemia inexplicada após intubação, corrigida apenas tracionando o tubo.',
    memoria:
      'Tubo fundo demais entra à direita e "esquece" o lobo superior. Se dessaturou depois de intubar, cheque a profundidade.',
    pontos: [
      'O que é um brônquio eparterial?',
      'Quantos segmentos ele ventila?',
      'Que complicação a intubação profunda produz?',
    ],
  },
  {
    termos: ['Brônquio Lobar Médio/Inferior Direito'],
    classe: 'via-aerea',
    resumo: 'Continuação do brônquio principal direito após o lobar superior — o brônquio intermédio e seus ramos.',
    localizacao: 'Do brônquio intermédio partem o lobar médio, anteriormente, e o lobar inferior, que continua para baixo e para trás.',
    funcao: 'Ventilam o lobo médio, com dois segmentos, e o lobo inferior, com cinco.',
    relacoes: 'O brônquio do segmento superior do lobo inferior sai da face posterior, imediatamente à frente da origem do lobar médio.',
    clinica:
      'A posição posterior desse brônquio segmentar superior é o que faz dele o destino da aspiração em decúbito dorsal, junto com o segmento posterior do lobo superior. E o brônquio lobar médio, longo e estreito, é o que se obstrui na síndrome do lobo médio. Na broncoscopia, essa árvore é percorrida em ordem fixa, e conhecer a sequência é o que permite descrever a lesão com precisão.',
    memoria:
      'Direita: superior, intermédio, médio e inferior. Um brônquio a mais que a esquerda — porque há um lobo a mais.',
    pontos: [
      'O que é o brônquio intermédio?',
      'Quantos segmentos cada lobo ventila?',
      'Que segmento recebe a aspiração em decúbito dorsal?',
    ],
  },
  {
    termos: ['Aorta Descendente'],
    classe: 'arteria',
    sistemas: ['respiratorio'],
    resumo: 'Segmento torácico da aorta, que imprime um sulco na face mediastinal do pulmão esquerdo.',
    localizacao: 'Mediastino posterior, à esquerda da coluna, descendo até o hiato aórtico do diafragma em T12.',
    funcao: 'Emite as intercostais posteriores, as brônquicas e as esofágicas; sua impressão no pulmão esquerdo é uma das marcas mais visíveis da peça.',
    relacoes: 'O esôfago está à sua frente e cruza para a esquerda ao descer; o ducto torácico e a ázigo estão à direita.',
    clinica:
      'As artérias brônquicas que dela nascem são a irrigação nutritiva do pulmão — ao contrário das pulmonares, que são funcionais. É essa dupla circulação que explica por que o infarto pulmonar após embolia é relativamente incomum, e por que hemoptises maciças são quase sempre de origem brônquica, sistêmica e de alta pressão — o que faz da embolização das artérias brônquicas o tratamento de escolha.',
    memoria:
      'Pulmão tem duas circulações: a pulmonar oxigena o sangue, a brônquica alimenta o órgão. Hemoptise grave vem da brônquica.',
    pontos: [
      'Que ramos a aorta torácica emite para o pulmão?',
      'Qual a diferença entre circulação funcional e nutritiva?',
      'Por que hemoptises maciças são tratadas por embolização brônquica?',
    ],
  },
  /* ─────────────────── Diafragma ─────────────────── */
  {
    termos: ['Centro Tendíneo'],
    classe: 'fascia',
    resumo: 'Aponeurose trifoliada no centro do diafragma, onde convergem todas as suas fibras musculares.',
    localizacao: 'Porção central do diafragma, fundida ao pericárdio fibroso acima.',
    funcao:
      'É o tendão de inserção de um músculo cujas fibras vêm de todas as direções — esterno, costelas e vértebras. Ao contrair, o diafragma abaixa o centro tendíneo e aumenta o diâmetro vertical do tórax, respondendo por cerca de 70% do volume corrente em repouso.',
    inervacao: 'Nervo frênico (C3, C4 e C5), tanto motor quanto sensitivo para a porção central.',
    relacoes: 'O forame da veia cava, ao nível de T8, atravessa o próprio centro tendíneo.',
    clinica:
      'Atravessar o tendão, e não o músculo, é o que permite à veia cava ser tracionada e mantida aberta na inspiração, favorecendo o retorno venoso — enquanto o esôfago, que atravessa músculo, é comprimido. A inervação central pelo frênico é a razão da dor referida no ombro em irritação diafragmática: sangue, ar ou pus subfrênicos doem em C4, no ombro (sinal de Kehr).',
    memoria:
      'Dor no ombro sem trauma no ombro, com abdome agudo: é o diafragma falando por C4.',
    pontos: [
      'Que estrutura atravessa o centro tendíneo e em que nível?',
      'Por que a veia cava se abre na inspiração?',
      'O que é o sinal de Kehr?',
    ],
  },
  {
    termos: ['Parte Esternal'],
    classe: 'musculo',
    resumo: 'Porção do diafragma que nasce da face posterior do processo xifoide.',
    localizacao: 'Duas pequenas digitações que partem do processo xifoide em direção ao centro tendíneo.',
    funcao: 'É a menor das três porções de origem do diafragma, junto com a costal e a lombar.',
    relacoes: 'Entre ela e a porção costal fica o trígono esternocostal (fenda de Larrey ou de Morgagni), atravessado pelos vasos epigástricos superiores.',
    clinica:
      'Esse trígono é um ponto de fraqueza congênito: a hérnia de Morgagni, anterior e geralmente à direita, é rara e frequentemente assintomática, descoberta como massa cardiofrênica na radiografia. É também a via de acesso da pericardiocentese subxifoide e da janela pericárdica.',
    memoria:
      'Morgagni é na frente e é rara; Bochdalek é atrás e é a comum. Duas fendas, dois nomes, duas frequências.',
    pontos: [
      'De onde nasce a parte esternal do diafragma?',
      'O que é o trígono esternocostal?',
      'O que é a hérnia de Morgagni?',
    ],
  },
  {
    termos: ['Parte Lombar'],
    classe: 'musculo',
    resumo: 'Porção do diafragma que nasce dos pilares e dos ligamentos arqueados, sobre a coluna lombar.',
    localizacao:
      'Pilar direito, mais longo, das vértebras L1 a L3; pilar esquerdo, de L1 a L2; ligamentos arqueados medial (sobre o psoas), lateral (sobre o quadrado do lombo) e mediano (sobre a aorta).',
    funcao: 'Ancora o diafragma na coluna e forma os hiatos por onde passam a aorta e o esôfago.',
    relacoes: 'Entre a parte lombar e a costal fica o trígono lombocostal, ponto de fraqueza posterior.',
    clinica:
      'É esse trígono posterior — a fenda de Bochdalek — que falha na hérnia diafragmática congênita, a mais comum das hérnias diafragmáticas, geralmente à esquerda, com vísceras abdominais no tórax e hipoplasia pulmonar. O recém-nascido apresenta abdome escavado, desconforto respiratório grave e ruídos hidroaéreos no tórax — e a intubação imediata, sem ventilação com máscara, é o que evita distender ainda mais as alças.',
    memoria:
      'Recém-nascido com abdome vazio, tórax cheio e desconforto: hérnia de Bochdalek. Não ventile com máscara.',
    pontos: [
      'Que estruturas formam a parte lombar do diafragma?',
      'O que é a fenda de Bochdalek?',
      'Como se apresenta a hérnia diafragmática congênita?',
    ],
  },
  {
    termos: ['Hiato Aórtico (representação)'],
    classe: 'passagem-ossea',
    resumo: 'Passagem posterior entre os pilares do diafragma, ao nível de T12, para a aorta.',
    localizacao: 'Atrás do ligamento arqueado mediano, entre os dois pilares, ao nível de T12.',
    funcao:
      'Transmite a aorta, o ducto torácico e, com frequência, a veia ázigo. Não é um hiato no músculo, e sim um arco osteofibroso atrás dele — por isso a aorta não é comprimida na contração diafragmática.',
    relacoes: 'É o mais posterior e o mais baixo dos três grandes hiatos.',
    clinica:
      'Que a aorta passe atrás e não através do músculo é o que garante fluxo constante durante a respiração. Uma inserção alta e apertada dos pilares comprime o tronco celíaco e produz a síndrome do ligamento arqueado mediano, com dor abdominal pós-prandial e sopro epigástrico que varia com a respiração — dado semiológico que distingue essa causa das demais isquemias mesentéricas.',
    memoria:
      'Doze, dez, oito: aorta em T12, esôfago em T10, cava em T8. Três hiatos, três números pares descendo.',
    pontos: [
      'Que estruturas atravessam o hiato aórtico?',
      'Por que a aorta não é comprimida na inspiração?',
      'O que é a síndrome do ligamento arqueado mediano?',
    ],
  },
  {
    termos: ['Hiato Esofágico'],
    classe: 'passagem-ossea',
    resumo: 'Abertura no pilar direito do diafragma, ao nível de T10, para o esôfago e os troncos vagais.',
    localizacao: 'Na porção muscular do pilar direito, à esquerda da linha média, ao nível de T10.',
    funcao:
      'Transmite o esôfago e os troncos vagais anterior e posterior. As fibras musculares que o circundam funcionam como pinça diafragmática, componente extrínseco do esfíncter esofágico inferior, contraindo-se na inspiração e na tosse.',
    relacoes: 'A membrana frenoesofágica fixa o esôfago ao hiato, permitindo mobilidade sem perder a vedação.',
    clinica:
      'O afrouxamento dessa membrana produz a hérnia de hiato por deslizamento, em que a junção esofagogástrica sobe para o tórax e a pinça diafragmática deixa de reforçar o esfíncter — mecanismo central da doença do refluxo gastroesofágico. A fundoplicatura recompõe justamente essa geometria, e não apenas "aperta" o esfíncter.',
    memoria:
      'Dois esfíncteres num só lugar: o músculo liso do esôfago e a pinça do diafragma. Herniou, perdeu um dos dois — e o refluxo aparece.',
    pontos: [
      'Que estruturas atravessam o hiato esofágico?',
      'O que é a pinça diafragmática?',
      'Como a hérnia de hiato favorece o refluxo?',
    ],
  },
  {
    termos: ['Corpo Vertebral (representação)'],
    classe: 'acidente-osseo',
    resumo: 'Corpos das vértebras lombares altas, referência dos níveis das aberturas diafragmáticas.',
    localizacao: 'Coluna toracolombar, atrás do diafragma; os pilares se inserem em L1 a L3.',
    funcao: 'Serve de âncora posterior ao diafragma e de referência de nível para todas as suas passagens.',
    relacoes: 'T8 para a veia cava, T10 para o esôfago e T12 para a aorta.',
    clinica:
      'Esses níveis são a régua da tomografia abdominal: identificar o hiato aórtico em T12 orienta a leitura do tronco celíaco, que sai logo abaixo, e da mesentérica superior, um centímetro adiante. Um "mapa vertical" que transforma cortes axiais numa sequência previsível.',
    memoria:
      'Cava em T8 (oito letras em "vena cava"), esôfago em T10 (dez letras em "esophagus"), aorta em T12 (doze em "aortic hiatus"). O truque funciona em inglês e ajuda a fixar.',
    pontos: [
      'Em que níveis vertebrais estão as três grandes aberturas diafragmáticas?',
      'Onde os pilares do diafragma se inserem?',
      'Que estruturas vasculares saem logo abaixo do hiato aórtico?',
    ],
  },
]
