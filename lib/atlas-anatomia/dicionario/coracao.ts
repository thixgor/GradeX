import type { EntradaDicionario } from './tipos'

/**
 * Coração, pericárdio e grandes vasos.
 *
 * O coração é duas bombas em série dentro de um saco. Quase toda a semiologia
 * cardíaca sai de três fatos anatômicos: o ventrículo esquerdo é o que trabalha
 * contra pressão, as valvas são anéis de tecido conjuntivo sem irrigação
 * própria, e o saco pericárdico não estica. Guardadas essas três frases, o resto
 * se deduz.
 */
export const CORACAO: EntradaDicionario[] = [
  /* ─────────────────── Pericárdio ─────────────────── */
  {
    termos: ['Pericárdio Fibroso', 'Coração (Pericárdio Fibroso)'],
    classe: 'serosa',
    resumo: 'Saco de tecido conjuntivo denso e inelástico que envolve o coração e as raízes dos grandes vasos.',
    localizacao:
      'No mediastino médio, fundido abaixo ao centro tendíneo do diafragma, preso à frente ao esterno pelos ligamentos esternopericárdicos e continuando-se acima com a adventícia dos grandes vasos.',
    funcao:
      'Limita o enchimento excessivo do coração e o mantém no lugar dentro do tórax. Sua inelasticidade é a característica que define toda a sua patologia: ele acomoda líquido acumulado lentamente, mas não acomoda líquido acumulado rápido.',
    vascularizacao: 'Artérias pericardiofrênicas, ramos das torácicas internas.',
    inervacao: 'Nervos frênicos (C3–C5) — e é essa inervação, e não a cardíaca, que faz a dor pericárdica irradiar para o ombro.',
    relacoes: 'Os nervos frênicos descem colados às suas faces laterais, entre ele e a pleura mediastinal.',
    clinica:
      'A curva pressão-volume do pericárdio explica dois quadros opostos: 150 a 200 mL acumulados em minutos causam tamponamento cardíaco, enquanto derrames crônicos de mais de um litro podem ser assintomáticos. O tamponamento se manifesta pela tríade de Beck — hipotensão, turgência jugular e bulhas abafadas — e por pulso paradoxal. E a dor que irradia para o trapézio, tão característica da pericardite, é pura anatomia do frênico.',
    memoria:
      'Um saco que não estica. Rápido mata com pouco líquido; devagar tolera muito. E a dor vai para o ombro porque quem inerva é o frênico.',
    pontos: [
      'Por que o pericárdio não acomoda derrames rápidos?',
      'Que nervo o inerva e que dor referida isso produz?',
      'Quais são os componentes da tríade de Beck?',
    ],
  },
  {
    termos: ['Pericárdio Seroso - Lâmina Parietal', 'Lâmina Parietal do Pericárdio Seroso', 'Pericárdio Seroso (Lâmina Parietal)'],
    classe: 'serosa',
    resumo: 'Camada serosa que forra o pericárdio fibroso por dentro.',
    localizacao: 'Aderida à face interna do pericárdio fibroso, refletindo-se sobre os grandes vasos para se continuar com a lâmina visceral.',
    funcao: 'Secreta o líquido pericárdico — cerca de 15 a 50 mL — que lubrifica o deslizamento do coração a cada batimento.',
    vascularizacao:
      'Artérias pericardiacofrênicas, ramos das torácicas internas, que descem junto com os nervos frênicos, e ramos das musculofrênicas e da aorta torácica. A drenagem acompanha as veias pericardiacofrênicas até as braquiocefálicas.',
    inervacao:
      'Nervo frênico (C3–C5) — e aqui está a distinção que decide o exame físico: esta lâmina, colada ao pericárdio fibroso, tem sensibilidade somática e dói; a lâmina visceral, do outro lado da cavidade, tem apenas fibras autonômicas e não dói. Toda a dor da pericardite nasce desta face.',
    linfaticos: 'Linfonodos mediastinais anteriores e traqueobrônquicos, ao longo dos vasos pericardiacofrênicos.',
    relacoes: 'Sua reflexão em torno dos grandes vasos cria os seios transverso e oblíquo do pericárdio.',
    clinica:
      'É a superfície que se inflama na pericardite, produzindo o atrito pericárdico — um ruído áspero, em três tempos, que aparece e desaparece e cuja ausência não afasta o diagnóstico. Na pericardiocentese, a agulha atravessa fibroso e parietal para chegar à cavidade.',
    memoria:
      'Um balão vazio no qual você enfia o punho: a camada que fica em contato com a mão é a visceral; a de fora, a parietal. O coração é o punho.',
    pontos: [
      'Que camada secreta o líquido pericárdico?',
      'Quanto líquido existe normalmente na cavidade?',
      'Que achado ausculta a pericardite produz?',
    ],
  },
  {
    termos: [
      'Pericárdio Seroso - Lâmina Visceral (Epicárdio)',
      'Lâmina Visceral do Pericárdio Seroso (Epicárdio)',
      'Epicárdio',
    ],
    classe: 'serosa',
    resumo: 'Camada serosa aderida à superfície do coração — a camada mais externa da parede cardíaca.',
    localizacao: 'Recobrindo diretamente o miocárdio, contínua com a lâmina parietal na reflexão sobre os grandes vasos.',
    funcao: 'Reveste o coração e aloja, no tecido adiposo subepicárdico, as artérias coronárias, as veias cardíacas, os nervos autonômicos e os gânglios.',
    vascularizacao:
      'Pelas próprias artérias coronárias que ele abriga: ramos epicárdicos finos saem dos vasos que correm no seu tecido adiposo. A drenagem é pelas veias cardíacas, para o seio coronário.',
    inervacao:
      'Somente plexo cardíaco autonômico — e essa é a diferença que muda o raciocínio clínico. O epicárdio não tem inervação somática e não produz dor; a pericardite dói pela lâmina parietal e pelo pericárdio fibroso, inervados pelo frênico. Uma inflamação estritamente epicárdica pode elevar troponina e alterar o eletrocardiograma sem doer.',
    linfaticos:
      'Plexo subepicárdico que segue as coronárias até um tronco principal esquerdo, drenando para os linfonodos traqueobrônquicos inferiores, e um direito, para os braquiocefálicos.',
    relacoes: 'A gordura epicárdica é mais abundante nos sulcos coronário e interventriculares, onde correm os vasos.',
    clinica:
      'É por viverem nessa camada que as coronárias correm na superfície do coração, e não dentro do músculo — o que as torna acessíveis à revascularização cirúrgica. Um segmento que mergulha no miocárdio é uma ponte miocárdica, variante que pode causar isquemia por compressão sistólica. A gordura epicárdica, além disso, é hoje reconhecida como tecido metabolicamente ativo e marcador de risco cardiovascular.',
    memoria:
      'As coronárias andam por fora do músculo, na gordura sob o epicárdio. É essa posição que permite costurar uma ponte de safena nelas.',
    pontos: [
      'Que estruturas correm no tecido subepicárdico?',
      'O que é uma ponte miocárdica?',
      'Por que a posição das coronárias permite a revascularização?',
    ],
  },
  {
    termos: ['Cavidade Pericárdica'],
    classe: 'serosa',
    resumo: 'Espaço virtual entre as lâminas parietal e visceral do pericárdio seroso.',
    localizacao: 'Entre as duas lâminas serosas, contendo apenas uma película de líquido pericárdico.',
    funcao: 'Permite que o coração deslize livremente durante o ciclo cardíaco, com atrito praticamente nulo.',
    vascularizacao:
      'A cavidade em si é um vão: quem a irriga são as duas lâminas que a delimitam — a parietal pelas pericardiacofrênicas, a visceral pelas coronárias. O líquido que a preenche é ultrafiltrado do plasma, produzido pelo mesotélio parietal.',
    inervacao:
      'Não há inervação de um espaço. O que dói quando ele se enche é a lâmina parietal, pelo frênico. É por isso que o tamponamento pode matar praticamente sem dor: o que mata é o volume, não a inflamação.',
    linfaticos: 'O líquido excedente é reabsorvido por estomas linfáticos do mesotélio parietal, que drenam para os linfonodos mediastinais.',
    relacoes: 'Comunica-se com os seios transverso e oblíquo, seus dois recessos.',
    clinica:
      'É o espaço puncionado na pericardiocentese, feita por via subxifóidea com a agulha apontada para o ombro esquerdo, sob orientação ecocardiográfica. Nos derrames, o líquido se acumula primeiro nos recessos posteriores, o que a ecocardiografia detecta com sensibilidade alta — motivo pelo qual o eco é o exame de escolha no tamponamento.',
    memoria:
      'É um espaço "virtual": só existe de verdade quando alguma coisa o preenche. E o que o preenche, no tamponamento, mata.',
    pontos: [
      'O que a cavidade pericárdica contém normalmente?',
      'Como se realiza a pericardiocentese?',
      'Que exame é o de escolha no tamponamento?',
    ],
  },
  {
    termos: ['Seio Transverso do Pericárdio'],
    classe: 'serosa',
    resumo: 'Passagem entre a artéria pulmonar e a aorta, à frente, e os átrios, atrás.',
    localizacao: 'Atrás da aorta ascendente e do tronco pulmonar e à frente da veia cava superior e do átrio esquerdo.',
    funcao: 'Resulta da reflexão do pericárdio seroso em torno de dois grupos de vasos: o arterial, à frente, e o venoso, atrás — e o seio é o espaço entre eles.',
    relacoes: 'Permite passar um dedo ou um clampe por trás da aorta e do tronco pulmonar.',
    clinica:
      'É o corredor por onde o cirurgião passa a fita para clampar a aorta e o tronco pulmonar na entrada em circulação extracorpórea. Sua existência é a razão prática de a canulação cardíaca ser possível — anatomia que virou passo cirúrgico.',
    memoria:
      'Passe o dedo por trás da aorta: se ele sai do outro lado, você está no seio transverso. É o túnel que separa artérias de veias.',
    pontos: [
      'Que estruturas delimitam o seio transverso?',
      'Como ele se forma embriologicamente?',
      'Qual seu uso em cirurgia cardíaca?',
    ],
  },
  {
    termos: ['Seio Oblíquo do Pericárdio'],
    classe: 'serosa',
    resumo: 'Recesso em fundo cego atrás do átrio esquerdo, delimitado pelas veias pulmonares e pela cava inferior.',
    localizacao: 'Atrás do átrio esquerdo, entre as quatro veias pulmonares e a veia cava inferior, aberto inferiormente.',
    funcao: 'É um recesso da cavidade pericárdica formado pela reflexão serosa em torno das veias que chegam ao átrio esquerdo.',
    vascularizacao:
      'A parede anterior do recesso é o epicárdio do átrio esquerdo, irrigado por ramos atriais da artéria circunflexa; a parede posterior é a lâmina parietal, das pericardiacofrênicas. Duas irrigações diferentes de cada lado de um mesmo bolso.',
    inervacao: 'Parede posterior pelo frênico, com sensibilidade dolorosa; parede anterior apenas pelo plexo cardíaco, sem dor.',
    linfaticos: 'Linfonodos traqueobrônquicos inferiores, que ocupam o espaço subcarinal logo acima do recesso.',
    relacoes: 'O esôfago está imediatamente atrás dele, separado apenas pelo pericárdio.',
    clinica:
      'Essa relação com o esôfago é o que torna o ecocardiograma transesofágico tão superior ao transtorácico para ver o átrio esquerdo e sua aurícula — a sede da formação de trombos na fibrilação atrial. É também um recesso onde derrames loculados se acumulam e podem passar despercebidos.',
    memoria:
      'Um bolso cego atrás do átrio esquerdo, com o esôfago colado do outro lado. É por isso que o eco transesofágico enxerga tão bem.',
    pontos: [
      'Que estruturas delimitam o seio oblíquo?',
      'Que órgão está imediatamente posterior a ele?',
      'Por que isso favorece o ecocardiograma transesofágico?',
    ],
  },
  {
    termos: ['Ligamento Pericardiofrênico'],
    classe: 'ligamento',
    resumo: 'Fixação do pericárdio fibroso ao centro tendíneo do diafragma.',
    localizacao: 'Face inferior do pericárdio, fundida ao centro tendíneo do diafragma.',
    funcao: 'Ancora o coração inferiormente e faz com que o pericárdio acompanhe o movimento do diafragma a cada respiração.',
    relacoes: 'Os vasos e nervos pericardiofrênicos correm nessa região.',
    clinica:
      'É essa fixação que faz a silhueta cardíaca mudar de tamanho aparente entre a inspiração e a expiração na radiografia — motivo pelo qual o índice cardiotorácico só é válido em inspiração profunda e em incidência posteroanterior. Um "coração aumentado" numa radiografia em AP e expiração é um erro técnico, não um diagnóstico.',
    memoria:
      'O coração está pendurado no diafragma. Se o diafragma sobe, o coração deita — e parece maior na radiografia.',
    pontos: [
      'A que estrutura o pericárdio se fixa inferiormente?',
      'Por que o índice cardiotorácico exige inspiração profunda?',
      'Que vasos correm nessa região?',
    ],
  },
  /* ─────────────────── Faces e margens do coração ─────────────────── */
  {
    termos: ['Ápice do Coração', 'Ápice'],
    classe: 'cardiaco',
    sistemas: ['circulatorio'],
    resumo: 'Ponta do coração, formada pelo ventrículo esquerdo, dirigida para baixo, para a frente e para a esquerda.',
    localizacao: 'No 5º espaço intercostal esquerdo, na linha hemiclavicular, a cerca de 8 a 9 cm da linha média.',
    funcao: 'É onde o eixo do coração termina; sua posição define o ictus cordis, o batimento apical palpável.',
    vascularizacao:
      'Ramos apicais da artéria interventricular anterior, que na maioria das pessoas contorna a ponta e irriga alguns centímetros da face diafragmática. É território de artéria terminal, sem colateral significativa — daí o aneurisma apical ser a sequela típica do infarto anterior extenso. O retorno é pela veia cardíaca magna, que sobe pelo sulco interventricular anterior.',
    inervacao:
      'Plexo cardíaco. As fibras de dor sobem com o simpático até T1–T5, e não com o vago — é por isso que a dor do infarto apical se projeta no tórax, no braço esquerdo e na mandíbula, e não na ponta do coração.',
    linfaticos: 'Segue o tronco linfático esquerdo, ao longo da interventricular anterior, até os linfonodos traqueobrônquicos inferiores.',
    relacoes: 'Está imediatamente atrás da parede torácica anterior, separado dela pela pleura e pelo recesso costomediastinal.',
    clinica:
      'O ictus é uma das informações mais ricas e mais desperdiçadas do exame físico: deslocado para baixo e para fora indica dilatação do ventrículo esquerdo; sustentado e não deslocado sugere hipertrofia por sobrecarga de pressão. E é sobre o ápice que se ausculta o foco mitral — porque o som da valva é conduzido pelo fluxo, na direção da ponta.',
    memoria:
      'Ictus no 5º espaço, linha hemiclavicular. Se saiu dali para baixo e para fora, o ventrículo esquerdo dilatou.',
    pontos: [
      'Onde se localiza normalmente o ictus cordis?',
      'O que significa um ictus deslocado?',
      'Que foco de ausculta corresponde ao ápice?',
    ],
  },
  {
    termos: ['Base do Coração'],
    classe: 'cardiaco',
    resumo: 'Face posterior do coração, formada sobretudo pelo átrio esquerdo, onde chegam as veias pulmonares.',
    localizacao: 'Voltada para trás e para a direita, ao nível de T6 a T9, apoiada sobre os corpos vertebrais.',
    funcao: 'É o ponto de chegada do sangue: quatro veias pulmonares no átrio esquerdo e as duas cavas no átrio direito.',
    vascularizacao:
      'Ramos atriais da artéria circunflexa irrigam a parede posterior do átrio esquerdo que forma a maior parte desta face. A drenagem faz-se por veias atriais diretamente para o seio coronário, que corre no sulco coronário posterior — bem no meio desta face.',
    inervacao:
      'Predomínio parassimpático: o átrio é o território vagal por excelência, e é por isso que a manobra vagal reduz a frequência atrial mas quase não afeta a força ventricular. Os gânglios do plexo cardíaco concentram-se justamente aqui, em coxins de gordura epicárdica que a ablação de fibrilação atrial procura.',
    linfaticos: 'Linfonodos traqueobrônquicos inferiores (subcarinais), imediatamente acima.',
    relacoes: 'O esôfago e a aorta descendente estão imediatamente atrás; o seio oblíquo do pericárdio se interpõe.',
    clinica:
      'A relação entre átrio esquerdo aumentado e esôfago é clássica: na estenose mitral, o átrio dilata e desloca o esôfago posteriormente — visível no esofagograma e responsável pela disfagia dessa doença. É também o átrio esquerdo dilatado que produz o duplo contorno na radiografia de tórax e a elevação do brônquio principal esquerdo.',
    memoria:
      'A base do coração aponta para trás e para cima; o ápice, para a frente e para baixo. O coração está deitado, não em pé.',
    pontos: [
      'Que câmara forma a maior parte da base do coração?',
      'Que estruturas estão imediatamente posteriores?',
      'Como a estenose mitral produz disfagia?',
    ],
  },
  {
    termos: ['Face Esternocostal'],
    classe: 'cardiaco',
    resumo: 'Face anterior do coração, formada principalmente pelo ventrículo direito.',
    localizacao: 'Voltada para o esterno e as cartilagens costais; compõe-se do ventrículo direito, de parte do átrio direito e de uma faixa do ventrículo esquerdo.',
    funcao: 'É a face que recebe o impacto na compressão torácica e a que está mais próxima da parede anterior.',
    vascularizacao:
      'Ramos do cone e marginal direito, da coronária direita, para o ventrículo direito, e a interventricular anterior no sulco que a divide ao meio. A drenagem tem uma particularidade: as veias cardíacas anteriores desta face não vão para o seio coronário — cruzam o sulco coronário e desembocam diretamente no átrio direito.',
    inervacao:
      'Plexo cardíaco, com boa densidade de terminações simpáticas. As aferentes de dor desta face acompanham os nervos cardíacos até T1–T4, que é a razão de a dor do infarto de ventrículo direito ser indistinguível da do esquerdo pela localização.',
    linfaticos: 'Tronco linfático direito, ao longo da coronária direita, até os linfonodos braquiocefálicos.',
    relacoes: 'Separada do esterno pelos recessos pleurais e pelo pericárdio.',
    clinica:
      'Como o ventrículo direito é a câmara mais anterior, ele é o mais frequentemente lesado no trauma torácico penetrante e o mais atingido na contusão miocárdica após trauma com cinto de segurança. É também a câmara puncionada acidentalmente em pericardiocenteses mal dirigidas — e a que se acessa na biópsia endomiocárdica.',
    memoria:
      'A câmara da frente é o ventrículo direito; a de trás é o átrio esquerdo. Faca no peito atinge o direito; eco pelo esôfago vê o esquerdo.',
    pontos: [
      'Que câmara forma a maior parte da face anterior?',
      'Por que ela é a mais lesada em trauma penetrante?',
      'Que exames aproveitam essa posição?',
    ],
  },
  {
    termos: ['Face Diafragmática'],
    classe: 'cardiaco',
    sistemas: ['circulatorio'],
    resumo: 'Face inferior do coração, apoiada sobre o centro tendíneo do diafragma.',
    localizacao: 'Formada principalmente pelo ventrículo esquerdo e, em menor parte, pelo direito, separada da base pelo sulco coronário.',
    funcao: 'Repousa sobre o diafragma e é percorrida pelo ramo interventricular posterior e pelo seio coronário.',
    vascularizacao:
      'Artéria interventricular posterior, que em 80% das pessoas nasce da coronária direita, mais os ramos posteriores do ventrículo esquerdo. O seio coronário atravessa esta face no sulco coronário, recolhendo a veia cardíaca média que sobe pelo sulco interventricular posterior.',
    inervacao:
      'Plexo cardíaco. Aqui as fibras vagais aferentes são especialmente densas, e é essa a base do reflexo de Bezold-Jarisch: o infarto de parede inferior estimula receptores vagais desta face e produz bradicardia, náusea, vômito e hipotensão — a "vagotonia" que acompanha o infarto inferior.',
    linfaticos: 'Acompanha a interventricular posterior até os linfonodos traqueobrônquicos inferiores.',
    relacoes: 'Sob o diafragma, nessa altura, estão o lobo esquerdo do fígado e o fundo gástrico.',
    clinica:
      'É o território do infarto de parede inferior, irrigado em cerca de 80% das pessoas pela coronária direita (dominância direita). Duas consequências práticas: o infarto inferior costuma cursar com bradicardia e bloqueios, porque a coronária direita irriga os nós sinoatrial e atrioventricular; e a proximidade com o diafragma e o estômago explica por que ele se apresenta com dor epigástrica, náusea e vômito — simulando abdome agudo.',
    memoria:
      'Infarto de parede inferior parece indigestão e vem com bradicardia. Coronária direita irriga a parede de baixo e os nós.',
    pontos: [
      'Que câmara forma a maior parte da face diafragmática?',
      'Que artéria a irriga na maioria das pessoas?',
      'Por que o infarto inferior simula abdome agudo?',
    ],
  },
  {
    termos: ['Face Pulmonar'],
    classe: 'cardiaco',
    resumo: 'Face esquerda do coração, moldada pela impressão do pulmão esquerdo.',
    localizacao: 'Face voltada para a esquerda, formada quase inteiramente pelo ventrículo esquerdo.',
    funcao: 'Ocupa a incisura cardíaca do pulmão esquerdo, o recorte que o coração escava no pulmão desse lado.',
    vascularizacao:
      'Artéria circunflexa no sulco coronário e seus ramos marginais esquerdos, descendo pela parede lateral do ventrículo esquerdo. A veia marginal esquerda acompanha o maior deles e desemboca na veia cardíaca magna.',
    inervacao:
      'Plexo cardíaco. O que corre sobre esta face, porém, não é nervo do coração: o frênico esquerdo apenas passa por cima dela, entre o pericárdio e a pleura, a caminho do diafragma — relação decisiva, porque a dissecção pericárdica nesse ponto pode paralisar o hemidiafragma esquerdo.',
    linfaticos: 'Tronco linfático esquerdo, ao longo da circunflexa, até os linfonodos traqueobrônquicos inferiores.',
    relacoes: 'O nervo frênico esquerdo e os vasos pericardiofrênicos descem sobre ela.',
    clinica:
      'A incisura cardíaca é a razão de o pulmão esquerdo ter dois lobos e uma língula: o coração ocupa o espaço que seria do lobo médio. Também é o motivo de o coração estar em contato direto com a parede torácica anterior à esquerda — a área de macicez cardíaca à percussão.',
    memoria:
      'O coração "morde" o pulmão esquerdo. A mordida é a incisura cardíaca, e o que sobrou abaixo dela é a língula.',
    pontos: [
      'Que estrutura pulmonar corresponde à face pulmonar do coração?',
      'Por que o pulmão esquerdo tem dois lobos?',
      'Que nervo desce sobre essa face?',
    ],
  },
  {
    termos: ['Margem Superior'],
    classe: 'cardiaco',
    sistemas: ['circulatorio'],
    resumo: 'Borda superior do coração, formada pelos dois átrios e pelas raízes dos grandes vasos.',
    localizacao: 'Entre os pontos de saída da aorta ascendente e do tronco pulmonar, à frente, e a chegada das veias cavas e pulmonares, atrás; corresponde ao nível da 3ª cartilagem costal.',
    funcao: 'É a base do pedículo cardíaco: por ela entram e saem todos os grandes vasos, e é ela que ancora o coração ao mediastino superior.',
    vascularizacao:
      'Os ramos atriais das duas coronárias, e entre eles o mais importante do coração: a artéria do nó sinoatrial, que nasce da coronária direita em cerca de 60% das pessoas e da circunflexa nas demais, e cruza a raiz da aurícula direita bem nesta margem. Drenagem por veias atriais para o seio coronário.',
    inervacao:
      'É aqui que os nervos cardíacos chegam: os plexos cardíacos superficial e profundo situam-se logo acima desta margem, entre o arco aórtico e a bifurcação da traqueia, e distribuem simpático e vago a todo o coração. Nenhuma outra margem concentra tanta inervação.',
    linfaticos: 'Os dois troncos linfáticos cardíacos, direito e esquerdo, deixam o coração por esta margem rumo aos linfonodos braquiocefálicos e traqueobrônquicos.',
    relacoes: 'Atrás dela está o seio transverso do pericárdio, que separa o grupo arterial do venoso; acima, a bifurcação da traqueia e o arco aórtico.',
    clinica:
      'É a margem que define o pedículo vascular na radiografia de tórax — o "mediastino superior" cujo alargamento acima de 8 cm no filme em AP sugere dissecção de aorta ou hematoma mediastinal no trauma. E é por trás dela que o cirurgião passa a fita de clampeamento, pelo seio transverso, ao entrar em circulação extracorpórea.',
    memoria:
      'A margem de cima do coração é onde entram e saem todos os canos. Alargou na radiografia do politraumatizado: pense em sangue no mediastino.',
    pontos: [
      'Que estruturas formam a margem superior do coração?',
      'Que recesso pericárdico está imediatamente atrás dela?',
      'O que o alargamento do mediastino superior sugere no trauma?',
    ],
  },
  {
    termos: ['Margem Inferior'],
    classe: 'cardiaco',
    sistemas: ['circulatorio'],
    resumo: 'Borda aguda entre a face esternocostal e a diafragmática, formada pelo ventrículo direito.',
    localizacao: 'Da junção com a margem direita até o ápice; é quase horizontal e nítida.',
    funcao: 'Marca o limite inferior da silhueta cardíaca e é percorrida pelo ramo marginal direito da coronária direita.',
    vascularizacao:
      'Ramo marginal direito (ou marginal agudo) da coronária direita, que corre exatamente sobre esta borda até quase o ápice — é o ramo que a angiografia usa para reconhecer a margem. A veia cardíaca parva o acompanha e drena no seio coronário.',
    inervacao: 'Plexo cardíaco, com fibras vagais aferentes abundantes na parede inferior do ventrículo direito, participantes do reflexo de Bezold-Jarisch.',
    linfaticos: 'Tronco linfático direito, ao longo da coronária direita.',
    relacoes: 'Apoia-se no diafragma; abaixo dela está o fígado, à direita, e o estômago, à esquerda.',
    clinica:
      'É a referência da via subxifóidea para a pericardiocentese e para a janela pericárdica, e é a borda que se procura na janela subcostal do ultrassom FAST — o corte que, no politraumatizado, responde em segundos se há sangue no pericárdio.',
    memoria:
      'A borda de baixo é do ventrículo direito e fica quase encostada no diafragma. É por baixo dela que a agulha entra.',
    pontos: [
      'Que câmara forma a margem inferior do coração?',
      'Que ramo arterial a percorre?',
      'Que exame de emergência usa essa janela?',
    ],
  },
  /* ─────────────────── Parede e câmaras ─────────────────── */
  {
    termos: ['Miocárdio'],
    classe: 'cardiaco',
    resumo: 'Camada muscular do coração, formada por cardiomiócitos estriados unidos por discos intercalares.',
    localizacao: 'Entre o endocárdio, por dentro, e o epicárdio, por fora; muito mais espesso no ventrículo esquerdo que no direito.',
    funcao:
      'Gera a contração. Os cardiomiócitos são unidos por discos intercalares com desmossomos, que resistem à tração, e junções comunicantes, que permitem a propagação elétrica de célula a célula — é por isso que o coração funciona como um sincício funcional e obedece à lei do tudo ou nada.',
    vascularizacao: 'Artérias coronárias, com fluxo predominantemente diastólico no ventrículo esquerdo, porque a sístole comprime seus próprios vasos.',
    inervacao: 'Simpático dos gânglios cervicais e torácicos superiores; parassimpático pelo vago, predominantemente atrial.',
    relacoes: 'A espessura do ventrículo esquerdo é cerca de três vezes a do direito, refletindo a diferença de pressão.',
    clinica:
      'O fluxo coronário diastólico explica por que a taquicardia agrava a isquemia: ela encurta justamente a diástole. E o subendocárdio, sendo o mais distante dos vasos epicárdicos e o mais comprimido na sístole, é a região que sofre primeiro — daí o infarto subendocárdico e a inversão de onda T na isquemia. Como os cardiomiócitos praticamente não se regeneram, a área infartada vira cicatriz fibrosa, base da insuficiência cardíaca pós-infarto.',
    memoria:
      'O coração se irriga quando relaxa. Coração acelerado tem menos tempo de diástole — e menos sangue para si mesmo.',
    pontos: [
      'O que são discos intercalares e qual sua função?',
      'Por que o fluxo coronário é predominantemente diastólico?',
      'Por que o subendocárdio sofre primeiro na isquemia?',
    ],
  },
  {
    termos: ['Endocárdio'],
    classe: 'cardiaco',
    resumo: 'Camada interna lisa que reveste as câmaras e as valvas, contínua com o endotélio dos vasos.',
    localizacao: 'Superfície interna de átrios, ventrículos, valvas, cordas tendíneas e músculos papilares.',
    funcao: 'Fornece uma superfície não trombogênica ao sangue e forma o revestimento das valvas. Contém, na sua camada subendocárdica, as fibras de Purkinje.',
    vascularizacao:
      'Quase não tem vasos próprios: nutre-se por difusão direta do sangue da câmara e pelos capilares subendocárdicos mais profundos, complementados pelas veias cardíacas mínimas (de Tebésio), que se abrem diretamente nas cavidades. Essa nutrição precária, somada à compressão sistólica, faz do subendocárdio a primeira região a sofrer em qualquer isquemia.',
    inervacao:
      'Não tem inervação sensitiva. As fibras que o percorrem são as de Purkinje, que são condução, não sensibilidade — motivo pelo qual a ablação endocárdica é feita sem que o paciente sinta o cateter tocar a parede.',
    linfaticos: 'Plexo linfático subendocárdico, que drena centrifugamente através do miocárdio até o plexo subepicárdico.',
    relacoes: 'É contínuo com o endotélio das veias que chegam e das artérias que saem.',
    clinica:
      'Sua integridade é o que impede a formação de trombos: onde o endocárdio se lesa — sobre uma valva alterada, num jato de regurgitação, numa prótese — instala-se a endocardite infecciosa. Isso explica por que a endocardite tem predileção por valvas com lesão prévia e por que os critérios de Duke valorizam vegetações e hemoculturas persistentes.',
    memoria:
      'Endocárdio íntegro não coagula e não infecta. Endocárdio machucado é onde a bactéria gruda.',
    pontos: [
      'Que estruturas o endocárdio reveste?',
      'Que sistema de condução está na camada subendocárdica?',
      'Por que a endocardite prefere valvas previamente lesadas?',
    ],
  },
  {
    termos: ['Camada Externa do Músculo Estriado Cardíaco'],
    classe: 'cardiaco',
    resumo: 'Camada superficial do miocárdio ventricular, com fibras dispostas em espiral oblíqua.',
    localizacao: 'Face externa da musculatura ventricular, sob o epicárdio, com fibras que descem obliquamente do sulco coronário ao ápice, onde formam o vórtice cardíaco.',
    funcao:
      'Ao contrair, essa espiral produz um movimento de torção do ventrículo, como se torcesse um pano. Essa torção é responsável por parte significativa da ejeção e, ao se desfazer na diástole, gera sucção que auxilia o enchimento ventricular.',
    vascularizacao:
      'É a camada mais bem servida do miocárdio: as coronárias correm no epicárdio, logo acima dela, e seus ramos penetrantes a atravessam primeiro. Essa posição privilegiada é justamente o que faz a isquemia poupar o subepicárdio e atingir o subendocárdio — a onda de necrose avança de dentro para fora.',
    inervacao:
      'Plexo cardíaco, com as fibras simpáticas pós-ganglionares chegando pelo epicárdio e penetrando com os vasos. É a camada de onde parte a maior densidade de terminações adrenérgicas, e a primeira a responder às catecolaminas.',
    linfaticos: 'Plexo subepicárdico, o coletor principal de toda a linfa do miocárdio.',
    relacoes: 'Suas fibras se continuam com as da camada interna no ápice, invertendo o sentido da espiral.',
    clinica:
      'É essa torção que a ecocardiografia moderna mede pelo strain longitudinal global — um índice que detecta disfunção sistólica precoce quando a fração de ejeção ainda está normal, por exemplo na cardiotoxicidade por quimioterápicos. Anatomia microscópica que virou exame de rotina.',
    memoria:
      'O coração não aperta: ele torce, como uma toalha molhada. E depois destorce, sugando sangue para dentro.',
    pontos: [
      'Como as fibras da camada externa se dispõem?',
      'Que movimento essa disposição produz?',
      'Que exame moderno mede essa função?',
    ],
  },
  {
    termos: ['Camada Interna do Músculo Estriado Cardíaco'],
    classe: 'cardiaco',
    resumo: 'Camada profunda do miocárdio ventricular, com fibras em espiral de sentido oposto ao da externa.',
    localizacao: 'Face interna da musculatura ventricular, sob o endocárdio, formando as trabéculas cárneas e os músculos papilares.',
    funcao: 'Completa a arquitetura helicoidal do ventrículo: as duas espirais opostas produzem, juntas, a torção e o encurtamento longitudinal.',
    vascularizacao:
      'É a pior irrigada do coração, e por três razões somadas: está no fim do trajeto dos ramos penetrantes coronários, é comprimida na sístole pela própria pressão da câmara e recebe apenas um complemento marginal das veias de Tebésio. Daí o infarto subendocárdico, que não chega a atravessar a parede e produz infra de ST em vez de supra.',
    inervacao:
      'Plexo cardíaco, e aqui correm as fibras de Purkinje subendocárdicas, que espalham o impulso pelo ventrículo em menos de 100 milissegundos. Isquemia desta camada é, portanto, isquemia do sistema de condução — motivo pelo qual arritmias ventriculares acompanham o infarto.',
    linfaticos: 'Plexo subendocárdico, que atravessa o miocárdio para alcançar o plexo subepicárdico.',
    relacoes: 'Continua-se com a camada externa no vórtice, no ápice do ventrículo esquerdo.',
    clinica:
      'A camada subendocárdica é a mais vulnerável à isquemia — é a mais distante das coronárias epicárdicas e a mais comprimida na sístole. Por isso o strain longitudinal, que reflete sobretudo as fibras longitudinais subendocárdicas, é o primeiro parâmetro a se alterar na doença coronariana e na hipertrofia.',
    memoria:
      'Duas espirais em sentidos opostos, encontrando-se no ápice. É essa geometria que faz o coração torcer.',
    pontos: [
      'Que estruturas a camada interna forma dentro do ventrículo?',
      'Por que ela é mais vulnerável à isquemia?',
      'Como as duas camadas se relacionam no ápice?',
    ],
  },
  {
    termos: ['Trabéculas Cárneas'],
    classe: 'cardiaco',
    resumo: 'Cristas musculares irregulares que revestem a face interna dos ventrículos.',
    localizacao: 'Paredes internas de ambos os ventrículos; muito mais grosseiras e desorganizadas no ventrículo direito.',
    funcao:
      'Aumentam a superfície interna, reduzem o volume residual e evitam a sucção da parede sobre si mesma no fim da sístole. Existem em três formas: cristas fixas, pontes musculares e músculos papilares.',
    vascularizacao:
      'Ramos penetrantes terminais das coronárias, no fim do seu trajeto transmural, mais a difusão a partir do sangue da câmara pelas veias cardíacas mínimas. São, portanto, tecido subendocárdico: sofrem cedo e sofrem muito na isquemia.',
    inervacao:
      'Plexo cardíaco autonômico. O que percorre a banda moderadora, no entanto, não é nervo: é o ramo direito do feixe atrioventricular, tecido de condução cardíaco especializado — uma via elétrica própria do coração, independente do sistema nervoso.',
    linfaticos: 'Plexo subendocárdico, drenando através da parede até o subepicárdico.',
    relacoes: 'A trabécula septomarginal (banda moderadora), no ventrículo direito, conduz o ramo direito do feixe atrioventricular até o músculo papilar anterior.',
    clinica:
      'A diferença de trabeculação entre os ventrículos é o que permite ao ecocardiografista identificar qual câmara é qual — decisivo nas cardiopatias congênitas com transposição. Já o excesso de trabeculação com recessos profundos define a miocárdio não compactado, cardiomiopatia associada a insuficiência cardíaca, arritmias e embolias.',
    memoria:
      'Ventrículo direito é rugoso e trabeculado; o esquerdo é liso e espesso. Na dúvida sobre qual câmara é qual, olhe a parede.',
    pontos: [
      'Qual a função das trabéculas cárneas?',
      'O que é a banda moderadora e o que ela conduz?',
      'Como a trabeculação distingue os dois ventrículos?',
    ],
  },
  {
    termos: ['Músculos Papilares', 'Músculo Papilar'],
    classe: 'cardiaco',
    resumo: 'Projeções musculares cônicas do miocárdio ventricular que tracionam as cordas tendíneas.',
    localizacao: 'Três no ventrículo direito (anterior, posterior e septal) e dois no esquerdo (anterolateral e posteromedial).',
    funcao:
      'Contraem-se um instante antes do restante do ventrículo e mantêm tensão nas cordas tendíneas durante toda a sístole, impedindo que as cúspides das valvas atrioventriculares se evertam para dentro do átrio. Não fecham a valva — impedem que ela se abra para o lado errado.',
    vascularizacao:
      'O papilar posteromedial do ventrículo esquerdo recebe irrigação de um único vaso (descendente posterior); o anterolateral recebe de dois (descendente anterior e circunflexa). No ventrículo direito, o papilar anterior é servido por ramos do marginal direito e o septal, por ramos septais da interventricular anterior.',
    inervacao:
      'Plexo cardíaco. A rigor, o que comanda o instante da contração papilar não é nervo autonômico e sim o próprio sistema de condução: o ramo direito, pela banda moderadora, e os fascículos anterior e posterior do ramo esquerdo, que terminam nos dois papilares esquerdos. É por isso que um bloqueio fascicular pode dessincronizar o fechamento da mitral.',
    linfaticos: 'Plexo subendocárdico do ventrículo correspondente.',
    relacoes: 'Cada papilar envia cordas para duas cúspides adjacentes, o que distribui a carga.',
    clinica:
      'A irrigação única do papilar posteromedial é a razão de ele ser o que rompe no infarto — e a rotura de músculo papilar produz insuficiência mitral aguda, edema agudo de pulmão e choque, uma emergência cirúrgica que aparece tipicamente entre 2 e 7 dias após o infarto. Um detalhe de vascularização que decide um prognóstico.',
    memoria:
      'Papilar posteromedial tem uma artéria só: é o que morre e o que rompe. O anterolateral tem duas e quase nunca falha.',
    pontos: [
      'Qual a função dos músculos papilares?',
      'Por que o papilar posteromedial é o que mais rompe?',
      'Que quadro clínico a rotura produz?',
    ],
  },
  {
    termos: ['Cordas Tendíneas'],
    classe: 'cardiaco',
    resumo: 'Cordões fibrosos que ligam os músculos papilares às bordas e à face ventricular das cúspides.',
    localizacao: 'Do ápice dos músculos papilares às cúspides das valvas mitral e tricúspide.',
    funcao:
      'Funcionam como os cabos de um paraquedas: não puxam a valva para fechar, apenas impedem que ela seja empurrada para dentro do átrio pela pressão sistólica. Classificam-se em primárias (na borda livre), secundárias (na face ventricular) e terciárias (na base).',
    vascularizacao:
      'São avasculares. Colágeno denso revestido de endotélio, sem um único capilar: nutrem-se inteiramente por difusão a partir do sangue que as banha. É a razão de não cicatrizarem depois de rotas — uma corda que arrebenta está perdida, e a valva precisa de reparo mecânico.',
    inervacao:
      'Nenhuma. Não há terminação nervosa em corda tendínea, o que explica por que a rotura é indolor: o paciente não sente a corda romper, sente o edema agudo de pulmão que vem em seguida.',
    linfaticos: 'Ausentes, como em todo tecido avascular.',
    relacoes: 'As cordas secundárias contribuem para a geometria ventricular e são preservadas nas cirurgias modernas de troca valvar.',
    clinica:
      'A rotura de corda tendínea produz prolapso e insuficiência mitral aguda com sopro holossistólico e edema pulmonar. E a preservação do aparelho subvalvar na troca da valva mitral melhora a função ventricular no pós-operatório — descoberta que mudou a técnica cirúrgica: as cordas não são apenas cabos, elas sustentam a forma do ventrículo.',
    memoria:
      'A valva atrioventricular é um paraquedas: as cúspides são o pano, as cordas são as linhas, os papilares são o paraquedista.',
    pontos: [
      'Qual a função das cordas tendíneas?',
      'Que tipos de cordas existem?',
      'Por que se preserva o aparelho subvalvar na cirurgia mitral?',
    ],
  },
  {
    termos: ['Músculos Pectíneos'],
    classe: 'cardiaco',
    resumo: 'Cristas musculares paralelas na parede anterior do átrio direito e nas aurículas.',
    localizacao: 'Parede anterior do átrio direito e interior das duas aurículas; ausentes na parte posterior lisa do átrio.',
    funcao:
      'Marcam a porção do átrio derivada do átrio primitivo, distinguindo-a da porção lisa derivada do seio venoso. A crista terminal, no interior, e o sulco terminal, por fora, são a fronteira entre as duas.',
    vascularizacao:
      'Ramos atriais da coronária direita, entre eles a artéria do nó sinoatrial, que corre dentro da crista terminal e é o vaso mais importante desta região. Drenagem por pequenas veias atriais diretamente para a cavidade e para o seio coronário.',
    inervacao:
      'É o território mais ricamente parassimpático do coração: o vago faz sinapse em gânglios do coxim gorduroso vizinho à veia cava superior e comanda daqui a frequência cardíaca. Estimular esse coxim na cirurgia produz assistolia transitória — demonstração direta de onde o vago manda.',
    linfaticos: 'Tronco linfático direito, para os linfonodos braquiocefálicos.',
    relacoes: 'A crista terminal é onde se situa o nó sinoatrial, na sua extremidade superior, junto à desembocadura da veia cava superior.',
    clinica:
      'A aurícula esquerda, com sua superfície trabeculada e fluxo lento, é a sede de mais de 90% dos trombos na fibrilação atrial não valvar — daí os dispositivos de oclusão da aurícula como alternativa à anticoagulação. E a crista terminal é referência anatômica essencial no mapeamento eletrofisiológico do flutter atrial típico.',
    memoria:
      'Átrio direito tem duas metades: a rugosa (do átrio primitivo) e a lisa (do seio venoso). A fronteira é a crista terminal — e nela mora o marca-passo.',
    pontos: [
      'Que porção do átrio os músculos pectíneos ocupam?',
      'O que é a crista terminal e o que ela abriga?',
      'Por que a aurícula esquerda forma trombos na fibrilação atrial?',
    ],
  },
  {
    termos: ['Cone Arterial'],
    classe: 'cardiaco',
    resumo: 'Via de saída lisa e infundibuliforme do ventrículo direito, que conduz ao tronco pulmonar.',
    localizacao: 'Porção superior e anterior do ventrículo direito, separada da via de entrada pela crista supraventricular.',
    funcao:
      'É a única parte do ventrículo direito com parede lisa, derivada do bulbo cardíaco embrionário. Sua contração ajuda a direcionar o fluxo para o tronco pulmonar.',
    vascularizacao:
      'Artéria do cone (ramo do cone arterial), que em metade das pessoas nasce da coronária direita e na outra metade tem óstio próprio na aorta — é a chamada terceira coronária. Ela forma o anel de Vieussens com a interventricular anterior, e essa anastomose é uma das poucas colaterais naturais do coração: em oclusão proximal da descendente anterior, o anel de Vieussens é o que às vezes salva o miocárdio.',
    inervacao:
      'Plexo cardíaco, com predomínio simpático. Como a obstrução aqui é muscular e dinâmica, ela responde diretamente ao tônus adrenérgico — e é por isso que o betabloqueador alivia a crise hipoxêmica da tetralogia, relaxando o infundíbulo.',
    linfaticos: 'Tronco linfático direito, ao longo do sulco coronário.',
    relacoes: 'A crista supraventricular a separa da porção trabeculada de entrada.',
    clinica:
      'É o local da obstrução na tetralogia de Fallot — a estenose infundibular do ventrículo direito, um dos quatro componentes clássicos. Como a obstrução é muscular e dinâmica, ela piora com a taquicardia e a hipovolemia, o que explica as crises hipoxêmicas do lactente e por que a posição de cócoras, que aumenta a resistência sistêmica, as alivia.',
    memoria:
      'A saída do ventrículo direito é um funil muscular. Funil que se aperta em crise é a tetralogia de Fallot — e a criança se agacha para compensar.',
    pontos: [
      'O que caracteriza o cone arterial em relação ao resto do ventrículo direito?',
      'Que estrutura o separa da via de entrada?',
      'Qual seu papel na tetralogia de Fallot?',
    ],
  },
  {
    termos: ['Septo Interatrial'],
    classe: 'cardiaco',
    resumo: 'Parede que separa os dois átrios, com a fossa oval no seu centro.',
    localizacao: 'Entre os átrios direito e esquerdo, oblíquo, com a face direita voltada para a frente.',
    funcao:
      'Resulta da fusão do septo primum com o septo secundum durante o desenvolvimento. Antes do nascimento, o forame oval permite o desvio do sangue da direita para a esquerda, poupando o pulmão não ventilado.',
    vascularizacao:
      'Ramos atriais das duas coronárias, e sobretudo a artéria do nó atrioventricular, que nasce da dominante no cruz do coração e sobe pela base do septo. Uma oclusão da coronária direita compromete essa artéria e produz o bloqueio atrioventricular do infarto inferior — em geral suprahissiano e reversível.',
    inervacao:
      'Plexo cardíaco. O que atravessa a base do septo, porém, é tecido de condução: o nó atrioventricular e o início do feixe de His, no trígono de Koch. Nervo nenhum decide aqui — quem decide é o próprio miocárdio especializado.',
    linfaticos: 'Drena com os troncos atriais para os linfonodos traqueobrônquicos inferiores.',
    relacoes: 'Sua porção inferior participa do septo atrioventricular; o nó atrioventricular está na sua base, no trígono de Koch.',
    clinica:
      'A falha de fechamento produz a comunicação interatrial, o defeito congênito mais frequentemente diagnosticado na idade adulta, com desdobramento fixo da segunda bulha. O forame oval patente, presente em cerca de 25% dos adultos, é a via da embolia paradoxal — um trombo venoso que alcança a circulação sistêmica e causa AVC em jovem sem fatores de risco.',
    memoria:
      'Uma porta que devia fechar ao nascer. Se ficou entreaberta, um coágulo da perna pode chegar ao cérebro.',
    pontos: [
      'Como se forma o septo interatrial?',
      'O que é o forame oval patente e qual seu risco?',
      'Que achado ausculta a comunicação interatrial produz?',
    ],
  },
  {
    termos: ['Fossa Oval'],
    classe: 'cardiaco',
    resumo: 'Depressão oval no septo interatrial, resto do forame oval fetal.',
    localizacao: 'Face direita do septo interatrial, acima do óstio da veia cava inferior.',
    funcao: 'É a cicatriz do forame oval, a comunicação que, na vida fetal, desviava o sangue oxigenado da placenta do átrio direito para o esquerdo.',
    vascularizacao:
      'Seu assoalho é membranoso e praticamente avascular — duas camadas de endocárdio com pouco tecido entre elas. É exatamente essa pobreza vascular que permite atravessá-la com agulha na punção transeptal sem sangramento significativo, e que faz o orifício se fechar sozinho depois.',
    inervacao: 'Nenhuma inervação sensitiva. A punção transeptal, que atravessa esta membrana, é indolor.',
    linfaticos: 'Ausentes na membrana; a periferia drena com os linfáticos atriais.',
    relacoes: 'Seu assoalho corresponde ao septo primum e é fino, membranoso.',
    clinica:
      'É a porta de entrada do átrio esquerdo em procedimentos por cateter: a punção transeptal, feita através dela, é o acesso para a ablação de fibrilação atrial, para o implante de dispositivos de oclusão de aurícula e para o reparo mitral percutâneo. Todo o intervencionismo estrutural do coração esquerdo passa por um resto de anatomia fetal.',
    memoria:
      'Uma cicatriz de uma porta fetal que hoje é a porta preferida do cateter. O passado do coração virou via de acesso.',
    pontos: [
      'O que a fossa oval representa embriologicamente?',
      'Qual sua posição no átrio direito?',
      'Que procedimentos usam a punção transeptal?',
    ],
  },
  {
    termos: ['Limbo da Fossa Oval'],
    classe: 'cardiaco',
    resumo: 'Borda muscular espessa e proeminente que circunda a fossa oval.',
    localizacao: 'Margem da fossa oval, mais evidente nas bordas superior e anterior; é o remanescente do septo secundum.',
    funcao: 'Forma o batente contra o qual a válvula do forame oval — o septo primum — se aplica após o nascimento, quando a pressão do átrio esquerdo passa a superar a do direito.',
    vascularizacao:
      'Ao contrário do assoalho da fossa, o limbo é muscular e vascularizado: recebe ramos atriais das duas coronárias. Essa diferença é o que o cateter sente — tecido firme e irrigado na moldura, membrana fina e avascular no centro.',
    inervacao: 'Plexo cardíaco, sem componente sensitivo somático.',
    linfaticos: 'Linfáticos atriais, para os traqueobrônquicos inferiores.',
    relacoes: 'Sua ausência de fusão com o septo primum deixa o forame oval patente.',
    clinica:
      'É a estrutura que o eletrofisiologista palpa com o cateter para localizar o ponto da punção transeptal: a agulha desliza pelo limbo e "cai" na fossa, dando a sensação tátil característica. Punção fora da fossa arrisca perfurar a raiz da aorta ou a parede livre do átrio.',
    memoria:
      'A fossa é o buraco e o limbo é a moldura. O cateter desce pela moldura até cair no buraco — é assim que se entra no coração esquerdo.',
    pontos: [
      'O que o limbo da fossa oval representa embriologicamente?',
      'Como ele participa do fechamento do forame oval?',
      'Qual sua importância na punção transeptal?',
    ],
  },
  {
    termos: ['Óstio da Veia Cava Inferior'],
    classe: 'cardiaco',
    resumo: 'Abertura da veia cava inferior no átrio direito, guardada pela válvula de Eustáquio.',
    localizacao: 'Parte inferior da parede posterior do átrio direito, abaixo da fossa oval.',
    funcao:
      'Recebe o sangue de todo o território infradiafragmático. A válvula de Eustáquio, no seu contorno, tinha papel fetal decisivo: dirigia o sangue oxigenado da veia umbilical diretamente para o forame oval, atravessando o átrio direito sem se misturar.',
    vascularizacao:
      'A parede atrial que o contorna é irrigada por ramos atriais da coronária direita; o istmo cavotricuspídeo, logo à frente, recebe ramos da mesma artéria. A própria válvula de Eustáquio é uma prega endocárdica fibrosa, sem vasos.',
    inervacao:
      'Plexo cardíaco. A região é rica em terminações vagais aferentes de estiramento — os receptores de volume que disparam o reflexo de Bainbridge: distensão do átrio direito acelera a frequência cardíaca. É o sensor de pré-carga do coração.',
    linfaticos: 'Linfáticos atriais direitos, para os linfonodos braquiocefálicos.',
    relacoes: 'Entre o óstio da cava inferior, o seio coronário e a valva tricúspide fica o istmo cavotricuspídeo.',
    clinica:
      'O istmo cavotricuspídeo é o alvo da ablação do flutter atrial típico: o circuito de reentrada passa obrigatoriamente por ele, e uma linha de ablação nesse istmo interrompe a arritmia com taxa de sucesso acima de 90%. Uma válvula de Eustáquio proeminente pode dificultar o procedimento e, quando exuberante, forma a rede de Chiari, achado ecocardiográfico benigno.',
    memoria:
      'Do óstio da cava até a tricúspide há uma faixa de tecido: o istmo. É a "ponte estreita" que o flutter atravessa — queime a ponte e a arritmia acaba.',
    pontos: [
      'Que estrutura guarda o óstio da veia cava inferior?',
      'Qual era seu papel na vida fetal?',
      'O que é o istmo cavotricuspídeo e por que ele importa?',
    ],
  },
  {
    termos: ['Seio Coronário'],
    classe: 'veia',
    resumo: 'Coletor venoso do coração, no sulco coronário posterior, que desemboca no átrio direito.',
    localizacao: 'Sulco coronário, na face posterior do coração, entre o átrio e o ventrículo esquerdos, abrindo-se no átrio direito entre o óstio da cava inferior e a valva tricúspide.',
    funcao:
      'Recebe cerca de 60% do retorno venoso do miocárdio, por meio das veias cardíaca magna, média e parva. Sua válvula de Tebésio guarda parcialmente o óstio. É, embriologicamente, o resto do seio venoso esquerdo.',
    vascularizacao:
      'Sua própria parede, delgada e revestida de miocárdio atrial, é nutrida por ramos da artéria circunflexa, que corre paralela a ele no sulco coronário — a poucos milímetros. Essa vizinhança é a razão de a perfuração do seio coronário durante o implante de eletrodo poder lesar a circunflexa.',
    inervacao:
      'Plexo cardíaco. O manguito de miocárdio atrial que reveste sua desembocadura é eletricamente ativo e pode gerar focos ectópicos — o seio coronário é uma das estruturas mapeadas em taquicardias atriais e a referência de cateter em praticamente todo estudo eletrofisiológico.',
    linfaticos: 'Acompanha os linfáticos do sulco coronário até os traqueobrônquicos inferiores.',
    relacoes: 'Corre em íntima relação com a artéria circunflexa e com o anel mitral.',
    clinica:
      'É a via de acesso ao ventrículo esquerdo pelo lado venoso: o eletrodo da terapia de ressincronização cardíaca é implantado numa veia tributária do seio coronário, e a cardioplegia retrógrada na cirurgia cardíaca é infundida por ele. Sua dilatação na ecocardiografia sugere veia cava superior esquerda persistente, variante importante antes de qualquer implante de dispositivo.',
    memoria:
      'O sangue do coração volta por uma veia grossa nas costas dele. É por essa veia que se estimula o ventrículo esquerdo sem furar a câmara.',
    pontos: [
      'Que veias drenam para o seio coronário?',
      'Onde ele desemboca?',
      'Que procedimentos usam essa via?',
    ],
  },
  /* ─────────────────── Valvas ─────────────────── */
  {
    termos: ['Valva Atrioventricular Direita (Tricúspide)'],
    classe: 'valva',
    resumo: 'Valva de três cúspides entre o átrio e o ventrículo direitos — o conjunto inteiro, não uma de suas folhas.',
    localizacao: 'No óstio atrioventricular direito, com cúspides anterior, posterior e septal, ancoradas em três músculos papilares.',
    funcao:
      'Impede o refluxo para o átrio direito na sístole. "Valva" é o aparelho completo: anel, as três cúspides, as cordas tendíneas e os músculos papilares. Sua inserção é mais apical que a da mitral — diferença de poucos milímetros, mas anatomicamente constante.',
    vascularizacao:
      'As cúspides são avasculares e se nutrem por difusão do sangue que as banha; só o terço basal, junto ao anel, recebe capilares. O anel e os papilares que a sustentam são irrigados pela coronária direita. Essa avascularidade é a razão de a vegetação da endocardite ser um santuário: nenhum vaso leva antibiótico até lá, e por isso o tratamento é prolongado e precisa ser bactericida.',
    inervacao:
      'Sem inervação própria — cúspide de valva não tem nervo. O que existe na vizinhança, e importa muito, é o nó atrioventricular, atrás da cúspide septal.',
    linfaticos: 'Ausentes nas cúspides; o anel drena com os linfáticos do sulco coronário.',
    relacoes: 'A cúspide septal está em relação direta com o nó atrioventricular, no trígono de Koch.',
    clinica:
      'Essa diferença de altura de inserção é o que permite ao ecocardiografista identificar qual valva é qual, e é o critério diagnóstico da anomalia de Ebstein, em que a tricúspide se implanta muito mais abaixo, "atrializando" parte do ventrículo direito. A vizinhança com o nó atrioventricular explica os bloqueios após cirurgia valvar tricúspide e após fechamento de comunicação interventricular.',
    memoria:
      'Tricúspide se insere mais para baixo que a mitral. É esse degrau que o eco usa para dizer qual ventrículo é qual.',
    pontos: [
      'Quantas cúspides tem a valva tricúspide e quais são?',
      'Por que as cúspides são avasculares e o que isso muda no tratamento da endocardite?',
      'Que estrutura de condução está próxima da cúspide septal?',
    ],
  },
  {
    termos: ['Válvula Atrioventricular Direita'],
    classe: 'valva',
    resumo: 'Cada uma das três folhas móveis da valva tricúspide — a cúspide propriamente dita.',
    localizacao:
      'Presas ao anel atrioventricular direito, com a borda livre voltada para o ventrículo e ancorada por cordas tendíneas. São três: anterior, posterior e septal.',
    funcao:
      'É a parte que se move. Na diástole as folhas se afastam e deixam o sangue passar; na sístole encostam umas nas outras numa superfície de coaptação de vários milímetros — não é um contato de bordas, é uma sobreposição. Perder essa sobreposição, e não furar a folha, é o que causa a insuficiência.',
    vascularizacao:
      'Avascular na maior parte da sua extensão: apenas o terço junto ao anel tem capilares, e o restante vive por difusão. Uma folha espessada e vascularizada é folha doente — a neovascularização é achado histológico de valvopatia reumática.',
    inervacao: 'Nenhuma. A folha valvar é tecido conjuntivo revestido de endotélio, sem nervo e sem dor.',
    linfaticos: 'Ausentes.',
    relacoes: 'Cada folha recebe cordas de dois músculos papilares diferentes, o que reparte a carga e evita que a falha de um papilar solte a valva inteira.',
    clinica:
      'A distinção entre valva e válvula não é preciosismo de prova: quando o laudo do ecocardiograma diz "espessamento da válvula septal", ele está apontando uma folha específica, e é essa folha que a cirurgia vai reparar. E é o descolamento de uma única folha que produz a insuficiência tricúspide grave da endocardite do usuário de droga injetável.',
    memoria:
      'Valva é o aparelho inteiro; válvula é cada folha. O laudo que nomeia a folha está dizendo onde está o problema.',
    pontos: [
      'Qual a diferença entre valva e válvula?',
      'Quais são as três válvulas da tricúspide?',
      'Por que a coaptação é uma sobreposição, e não um encontro de bordas?',
    ],
  },
  {
    termos: ['Óstio Atrioventricular Direito'],
    classe: 'valva',
    resumo: 'A abertura entre o átrio e o ventrículo direitos — o buraco que a valva guarda, não a valva.',
    localizacao: 'No esqueleto fibroso, entre o átrio e o ventrículo direitos, contornado pelo anel fibroso tricúspide.',
    funcao:
      'É a via de entrada do ventrículo direito. Sua área normal é de 7 a 9 cm², bem maior que a do óstio mitral — porque precisa deixar o mesmo volume passar sob uma pressão atrial muito menor. Área grande é a compensação anatômica de uma pressão de enchimento baixa.',
    vascularizacao: 'O anel que o delimita é irrigado por ramos atrioventriculares da coronária direita, que corre no sulco coronário imediatamente por fora dele.',
    inervacao:
      'O anel é fibroso e sem inervação sensitiva; sua importância elétrica é o oposto: ele isola átrio de ventrículo, e é a barreira que obriga o impulso a descer só pelo feixe atrioventricular.',
    linfaticos: 'Linfáticos do sulco coronário.',
    relacoes: 'A coronária direita percorre o sulco coronário por fora do óstio, e o nó atrioventricular fica na sua borda septal.',
    clinica:
      'A estenose tricúspide é rara, mas quando existe — quase sempre reumática, e quase sempre acompanhada de doença mitral — o óstio reduzido produz turgência jugular com onda "a" gigante e hepatomegalia pulsátil, sem congestão pulmonar. Um paciente congesto sistemicamente com pulmões limpos deve fazer pensar no óstio direito.',
    memoria:
      'O óstio é o vão; a valva é a porta. Óstio direito é grande porque a pressão que o atravessa é pequena.',
    pontos: [
      'Qual a área normal do óstio atrioventricular direito?',
      'Por que ele é maior que o óstio mitral?',
      'Como se manifesta a estenose tricúspide?',
    ],
  },
  {
    termos: ['Valva Atrioventricular Esquerda (Bicúspide)'],
    classe: 'valva',
    resumo: 'Valva mitral: o aparelho completo de duas cúspides entre o átrio e o ventrículo esquerdos.',
    localizacao: 'No óstio atrioventricular esquerdo, com uma cúspide anterior (aórtica) grande e uma posterior (mural) menor, mas de maior extensão de anel.',
    funcao:
      'Suporta a maior pressão de todo o coração. Chamar de valva é falar do conjunto: anel, duas cúspides, cordas e dois músculos papilares — e a falha de qualquer um dos quatro produz insuficiência mitral. A cúspide anterior tem continuidade fibrosa com a valva aórtica, e o sangue passa rente a ela ao sair do ventrículo.',
    vascularizacao:
      'Cúspides avasculares, nutridas por difusão, com capilares apenas no terço basal. O anel é irrigado pela artéria circunflexa, que corre no sulco coronário a poucos milímetros dele; os papilares, pela descendente anterior e pela descendente posterior. Toda a irrigação do aparelho mitral é, portanto, periférica — a folha em si não recebe uma gota.',
    inervacao:
      'Sem inervação própria. Vale registrar o que passa perto: o seio coronário corre junto ao anel posterior, e é dali que se mapeia eletricamente a região na ablação.',
    linfaticos: 'Ausentes nas cúspides; o anel drena com os linfáticos do sulco coronário.',
    relacoes: 'Cada cúspide se divide em três festões (P1, P2, P3 e A1, A2, A3), nomenclatura usada em toda cirurgia e ecocardiografia mitral.',
    clinica:
      'A continuidade mitroaórtica explica a extensão de abscessos da endocardite aórtica para a mitral. O prolapso mais frequente é do festão P2, que é o alvo mais comum da plastia. E a estenose mitral, quase sempre reumática, produz o ruflar diastólico com estalido de abertura e leva à dilatação atrial, fibrilação e embolia — a cascata clássica.',
    memoria:
      'Mitral tem duas cúspides e o nome vem da mitra do bispo. A anterior "encosta" na aorta: as duas valvas se tocam.',
    pontos: [
      'Quantas cúspides tem a mitral e como se nomeiam seus festões?',
      'O que é a continuidade mitroaórtica?',
      'Que cascata a estenose mitral desencadeia?',
    ],
  },
  {
    termos: ['Válvula Atrioventricular Esquerda'],
    classe: 'valva',
    resumo: 'Cada uma das duas folhas móveis da valva mitral — a cúspide, e não o aparelho inteiro.',
    localizacao:
      'Presas ao anel mitral: a anterior ocupa um terço da circunferência mas tem maior área; a posterior ocupa dois terços do anel e é mais curta.',
    funcao:
      'São as folhas que se encostam. A coaptação normal é uma sobreposição de 5 a 10 mm, com a linha de fechamento deslocada para dentro do ventrículo — sobra de tecido que é a reserva de segurança da valva. Quando o ventrículo dilata e afasta os papilares, essa reserva se esgota antes que a folha adoeça: a valva vaza sem estar doente.',
    vascularizacao:
      'Avasculares fora do terço basal. Na cúspide posterior, a artéria circunflexa passa a poucos milímetros por trás do anel — proximidade que a anuloplastia e o clipe percutâneo precisam respeitar.',
    inervacao: 'Nenhuma. A folha não dói, não sente e não avisa quando rompe uma corda.',
    linfaticos: 'Ausentes.',
    relacoes: 'A anterior é contínua com as cúspides aórticas pela cortina mitroaórtica; a posterior tem a circunflexa e o seio coronário logo atrás.',
    clinica:
      'Distinguir a folha do aparelho muda a conduta: insuficiência por doença da folha (prolapso, endocardite, reumática) pede plastia ou troca; insuficiência funcional, em que as folhas são normais e o ventrículo é que dilatou, pede tratar o ventrículo. Duas insuficiências mitrais com o mesmo sopro e tratamentos opostos.',
    memoria:
      'Duas folhas com sobra de pano. Quando o ventrículo dilata, o pano acaba antes da folha adoecer — e a valva vaza sem estar doente.',
    pontos: [
      'Quantas válvulas tem a mitral e qual a proporção de anel de cada uma?',
      'O que é a reserva de coaptação?',
      'Qual a diferença entre insuficiência mitral orgânica e funcional?',
    ],
  },
  {
    termos: ['Óstio Atrioventricular Esquerdo'],
    classe: 'valva',
    resumo: 'A abertura entre o átrio e o ventrículo esquerdos — o vão que a mitral guarda.',
    localizacao: 'No esqueleto fibroso, contornado pelo anel mitral, entre os trígonos fibrosos direito e esquerdo.',
    funcao:
      'Deixa o ventrículo esquerdo encher na diástole. Sua área normal é de 4 a 6 cm² — menor que a do óstio direito, porque a pressão atrial esquerda que empurra o sangue é bem maior. O anel não é rígido: reduz de área na sístole, e essa contração ativa participa do fechamento.',
    vascularizacao: 'Anel irrigado por ramos da artéria circunflexa, que corre paralela a ele no sulco coronário, e da coronária direita na porção posterior.',
    inervacao:
      'O anel é fibroso e insensível; sua função elétrica é isolar átrio de ventrículo. Uma via acessória que atravesse esse anel é o substrato da síndrome de Wolff-Parkinson-White esquerda, ablada por dentro do seio coronário ou por via retrógrada aórtica.',
    linfaticos: 'Linfáticos do sulco coronário.',
    relacoes: 'A circunflexa e o seio coronário acompanham sua porção posterior; a raiz da aorta encosta na porção anterior.',
    clinica:
      'É a área deste óstio que define a gravidade da estenose mitral: abaixo de 1,5 cm² é moderada, abaixo de 1,0 cm² é grave. O número decide a indicação de valvoplastia por balão, e é medido por planimetria ou pelo tempo de meia pressão no eco — um caso raro em que a anatomia é o próprio critério terapêutico, em centímetros quadrados.',
    memoria:
      'Óstio mitral normal tem de 4 a 6 cm². Abaixo de 1,5 é grave, abaixo de 1,0 é cirurgia. A anatomia virou número de conduta.',
    pontos: [
      'Qual a área normal do óstio mitral?',
      'A partir de que área a estenose mitral é considerada grave?',
      'Por que o óstio esquerdo é menor que o direito?',
    ],
  },
  {
    termos: ['Válvula Anterior da Valva Tricúspide', 'Válvula Anterior'],
    classe: 'valva',
    resumo: 'A maior das três cúspides da valva tricúspide.',
    localizacao: 'Entre o óstio atrioventricular direito e o cone arterial, ancorada pelo músculo papilar anterior.',
    funcao: 'É a cúspide de maior área e a principal responsável pela coaptação; recebe cordas do papilar anterior, o maior dos três.',
    vascularizacao:
      'Avascular. Só a inserção no anel recebe capilares de ramos atrioventriculares da coronária direita. O músculo papilar anterior que a sustenta, esse sim, é irrigado por ramos do marginal direito.',
    inervacao: 'A folha não tem nervo. Quem chega ao papilar que a tensiona é o ramo direito do feixe atrioventricular, pela banda moderadora — condução, não inervação.',
    linfaticos: 'Ausentes na cúspide.',
    relacoes: 'A banda moderadora conduz o ramo direito do feixe atrioventricular até a base do papilar anterior.',
    clinica:
      'Essa ligação entre condução e músculo papilar é elegante: a banda moderadora garante que o papilar anterior seja ativado precocemente, tensionando as cordas antes que a pressão ventricular suba. É a anatomia sincronizando mecânica e eletricidade.',
    memoria:
      'A banda moderadora é um "atalho elétrico" que corre pelo ventrículo direito para ativar o músculo papilar antes de todo o resto.',
    pontos: [
      'Qual a maior cúspide da tricúspide?',
      'Que músculo papilar a sustenta?',
      'Qual a função da banda moderadora?',
    ],
  },
  {
    termos: ['Válvula Posterior da Valva Tricúspide', 'Válvula Posterior'],
    classe: 'valva',
    resumo: 'Cúspide inferior da tricúspide, a menor e a mais variável das três.',
    localizacao: 'Porção posteroinferior do óstio atrioventricular direito, ligada ao músculo papilar posterior.',
    funcao: 'Completa a coaptação da tricúspide; pode ser dividida em vários festões e é a mais variável em tamanho.',
    vascularizacao:
      'Avascular, como toda cúspide. O anel posterior a que ela se prende é irrigado pela coronária direita, que passa no sulco coronário imediatamente por fora — e é essa artéria que dilata junto quando o anel se distende.',
    inervacao: 'Sem inervação própria; o papilar posterior que a tensiona é ativado pelo sistema de Purkinje do ventrículo direito.',
    linfaticos: 'Ausentes na cúspide.',
    relacoes: 'Recebe cordas do papilar posterior, que costuma ter várias cabeças.',
    clinica:
      'A insuficiência tricúspide é quase sempre funcional — resultado da dilatação do anel por sobrecarga do ventrículo direito, e não de doença da própria valva. Por isso o tratamento primário é tratar a causa (hipertensão pulmonar, doença mitral) e, quando cirúrgico, é a anuloplastia, que reduz o anel, e não a troca da valva.',
    memoria:
      'A tricúspide raramente adoece sozinha: ela vaza porque o anel esticou. Trate o anel, não a cúspide.',
    pontos: [
      'Que características tem a cúspide posterior da tricúspide?',
      'Por que a insuficiência tricúspide costuma ser funcional?',
      'Qual o tratamento cirúrgico preferencial?',
    ],
  },
  {
    termos: ['Válvula Septal da Valva Tricúspide', 'Válvula Septal'],
    classe: 'valva',
    resumo: 'Cúspide da tricúspide fixada ao septo interventricular, vizinha imediata do nó atrioventricular.',
    localizacao: 'Aderida ao septo interventricular membranoso e muscular, com cordas curtas inserindo-se diretamente no septo.',
    funcao: 'Sua inserção septal é a mais apical das três, e é ela que define a diferença de altura em relação à mitral.',
    vascularizacao:
      'A folha é avascular; o septo em que ela se insere é irrigado pela artéria do nó atrioventricular, ramo da coronária dominante, e por ramos septais da interventricular anterior. Nenhuma cúspide do coração tem vizinhança arterial tão delicada.',
    inervacao:
      'A cúspide não tem nervo, mas está encostada no nó atrioventricular — que é o alvo direto da inervação vagal e simpática do coração. É por isso que a manobra vagal atrasa a condução exatamente aqui, atrás desta folha.',
    linfaticos: 'Ausentes na cúspide.',
    relacoes:
      'O trígono de Koch — delimitado pelo tendão de Todaro, pelo óstio do seio coronário e pela inserção da cúspide septal — contém o nó atrioventricular.',
    clinica:
      'O trígono de Koch é um dos mapas mais importantes da eletrofisiologia: é onde se localiza o nó atrioventricular e onde a ablação da via lenta da taquicardia por reentrada nodal é realizada, com o risco calculado de bloqueio total. Cirurgias na região da cúspide septal — fechamento de CIV, troca tricúspide — carregam o mesmo risco.',
    memoria:
      'Trígono de Koch: três lados, e dentro dele o nó atrioventricular. É a área que ninguém queima sem pensar duas vezes.',
    pontos: [
      'Que estruturas delimitam o trígono de Koch?',
      'O que está contido nele?',
      'Que risco isso cria em ablações e cirurgias?',
    ],
  },
  {
    termos: ['Válvula Anterior da Valva Bicúspide'],
    classe: 'valva',
    resumo: 'Cúspide anterior (aórtica) da valva mitral, em continuidade fibrosa com a valva aórtica.',
    localizacao: 'Porção anteromedial do anel mitral, ocupando cerca de um terço da circunferência mas com maior área de superfície.',
    funcao:
      'Separa a via de entrada da via de saída do ventrículo esquerdo. Na diástole ela se abre para o enchimento; na sístole, forma parte da parede do trato de saída.',
    vascularizacao:
      'Avascular. Sua base, porém, é a cortina mitroaórtica — tecido fibroso contínuo com a raiz da aorta, também mal irrigado. É essa pobreza vascular somada à continuidade anatômica que faz o abscesso da endocardite aórtica caminhar até a mitral sem encontrar barreira.',
    inervacao: 'Nenhuma. Os papilares que a tensionam recebem o fascículo anterior e o posterior do ramo esquerdo.',
    linfaticos: 'Ausentes na cúspide.',
    relacoes: 'Sua base é contínua com as cúspides não coronariana e coronariana esquerda da valva aórtica.',
    clinica:
      'Essa dupla função é a base do movimento anterior sistólico (SAM) na cardiomiopatia hipertrófica: a cúspide anterior é sugada para o trato de saída, obstruindo-o e, ao mesmo tempo, gerando insuficiência mitral. Um único movimento anômalo produz dois problemas — e é isso que explica o sopro dinâmico que aumenta com a manobra de Valsalva.',
    memoria:
      'A cúspide anterior da mitral é uma cortina entre a entrada e a saída do ventrículo. Se ela é sugada para a saída, obstrui e vaza ao mesmo tempo.',
    pontos: [
      'Que relação a cúspide anterior tem com a valva aórtica?',
      'Que dupla função ela exerce no ventrículo esquerdo?',
      'O que é o movimento anterior sistólico (SAM)?',
    ],
  },
  {
    termos: ['Válvula Posterior da Valva Bicúspide'],
    classe: 'valva',
    resumo: 'Cúspide posterior (mural) da mitral, dividida classicamente em três festões.',
    localizacao: 'Ocupa cerca de dois terços da circunferência do anel mitral, com os festões P1 (lateral), P2 (médio) e P3 (medial).',
    funcao: 'É mais curta que a anterior, mas com base mais extensa; sua coaptação com a anterior forma a linha de fechamento em sorriso.',
    vascularizacao:
      'Cúspide avascular; o anel em que ela se prende é irrigado pela artéria circunflexa, que corre por trás dele a 3 ou 4 milímetros. Essa distância mínima é a razão de a artéria ser risco real na anuloplastia e no reparo percutâneo.',
    inervacao: 'Sem nervo. O papilar posteromedial que a sustenta é o de irrigação única, e o primeiro a falhar no infarto.',
    linfaticos: 'Ausentes na cúspide.',
    relacoes: 'A artéria circunflexa corre no sulco coronário imediatamente atrás do anel posterior.',
    clinica:
      'O prolapso do festão P2 é a lesão mitral degenerativa mais comum e a de melhor resultado com plastia — hoje o padrão-ouro, superior à troca valvar. A proximidade com a artéria circunflexa é a razão de a lesão dessa artéria ser complicação descrita na anuloplastia mitral e no reparo percutâneo.',
    memoria:
      'P1, P2, P3 na cúspide posterior; A1, A2, A3 na anterior. É um mapa de seis quadrantes que cirurgião e ecocardiografista compartilham.',
    pontos: [
      'Como se nomeiam os festões da cúspide posterior?',
      'Qual o prolapso mitral mais comum?',
      'Que artéria corre atrás do anel mitral posterior?',
    ],
  },
  {
    termos: ['Válvula Semilunar da Valva Aórtica'],
    classe: 'valva',
    resumo: 'Cada uma das três cúspides em ninho de andorinha da valva aórtica.',
    localizacao:
      'Na raiz da aorta: cúspide coronariana direita, coronariana esquerda e não coronariana, cada uma com seu seio aórtico (de Valsalva) correspondente.',
    funcao:
      'Fecham-se passivamente na diástole, pelo próprio refluxo de sangue. Os seios de Valsalva criam vórtices que afastam as cúspides das paredes e mantêm os óstios coronários abertos — e é na diástole, com a valva fechada, que as coronárias enchem.',
    vascularizacao:
      'Avasculares — e nenhuma valva paga tão caro por isso. Do fundo dos seios que as abrigam saem as duas coronárias, ou seja, as cúspides ficam a milímetros da origem de toda a irrigação do coração e mesmo assim não recebem um vaso. É a causa anatômica de a valva aórtica ser a que mais calcifica: tecido sem circulação não remodela e acumula dano por décadas de estresse mecânico.',
    inervacao: 'Nenhuma. A estenose aórtica não dói pela valva; a angina dela vem do miocárdio hipertrofiado, que passa a exigir mais fluxo do que as coronárias entregam.',
    linfaticos: 'Ausentes nas cúspides.',
    relacoes: 'Os óstios coronários direito e esquerdo nascem dos seios correspondentes; o seio não coronariano não dá origem a artéria.',
    clinica:
      'A valva aórtica bicúspide, presente em 1 a 2% da população, é a malformação cardíaca congênita mais comum e leva a estenose e a insuficiência precoces, além de se associar a dilatação da aorta ascendente. A estenose aórtica dá a tríade angina, síncope e dispneia, com sobrevida curta após o início dos sintomas — o que faz do diagnóstico anatômico uma urgência terapêutica.',
    memoria:
      'Três ninhos de andorinha. Dois deles têm uma coronária saindo do fundo; o terceiro, não — daí o nome "não coronariano".',
    pontos: [
      'Como se chamam as três cúspides aórticas?',
      'Qual a função dos seios de Valsalva?',
      'Que malformação congênita cardíaca é a mais comum?',
    ],
  },
  {
    termos: ['Válvula Semilunar da Valva Pulmonar'],
    classe: 'valva',
    resumo: 'Cada uma das três cúspides da valva pulmonar, na saída do ventrículo direito.',
    localizacao: 'Na junção entre o cone arterial e o tronco pulmonar, com cúspides anterior, direita e esquerda.',
    funcao: 'Impedem o refluxo do tronco pulmonar para o ventrículo direito na diástole; são mais finas que as aórticas, porque trabalham contra uma pressão seis vezes menor.',
    vascularizacao:
      'Avasculares, como todas as cúspides — mas com um desfecho oposto ao da aórtica. Submetidas a um sexto da pressão, sofrem muito menos dano mecânico acumulado e por isso quase nunca calcificam, apesar de terem a mesma nutrição precária por difusão. A prova de que o problema da aórtica é a carga, não a irrigação.',
    inervacao: 'Nenhuma inervação própria; o infundíbulo muscular logo abaixo, sim, responde ao tônus simpático.',
    linfaticos: 'Ausentes nas cúspides.',
    relacoes: 'A valva pulmonar é a mais anterior e superior das quatro valvas cardíacas.',
    clinica:
      'A menor pressão explica por que a valva pulmonar quase nunca sofre degeneração calcificada e por que sua endocardite é rara — exceto em usuários de drogas injetáveis, em que o acometimento das valvas direitas é a regra. A estenose pulmonar congênita, ao contrário, é comum e responde muito bem à valvoplastia por balão.',
    memoria:
      'Valvas direitas trabalham com pressão baixa: quase não calcificam. Quando adoecem em adulto, pense em droga injetável.',
    pontos: [
      'Por que as cúspides pulmonares são mais finas que as aórticas?',
      'Em que população as valvas direitas costumam infectar?',
      'Qual o tratamento da estenose pulmonar congênita?',
    ],
  },
  {
    termos: ['Anel Fibroso Aórtico'],
    classe: 'valva',
    resumo: 'Componente do esqueleto fibroso do coração que sustenta a valva aórtica.',
    localizacao: 'Na raiz da aorta, com forma de coroa em três pontas, ligado aos anéis mitral e tricúspide pelos trígonos fibrosos.',
    funcao:
      'Faz parte do esqueleto fibroso: ancora as valvas, dá inserção ao miocárdio atrial e ventricular e — decisivo — isola eletricamente os átrios dos ventrículos, forçando o impulso a passar apenas pelo feixe atrioventricular.',
    vascularizacao:
      'Colágeno denso, com irrigação escassa vinda dos ramos vizinhos das duas coronárias. Essa avascularidade é uma faca de dois gumes: protege o anel da inflamação, mas o torna incapaz de debelar uma infecção instalada — o abscesso do anel aórtico é a complicação mais temida da endocardite e indicação de cirurgia imediata.',
    inervacao:
      'Sem inervação sensitiva. Sua função elétrica, porém, é decisiva: é ele que impede a passagem do impulso, e o feixe de His atravessa o trígono fibroso direito como única exceção autorizada.',
    linfaticos: 'Ausentes no anel; a periferia drena com os linfáticos do sulco coronário.',
    relacoes: 'O trígono fibroso direito, o mais robusto, contém o feixe de His em seu trajeto.',
    clinica:
      'Esse isolamento elétrico é o que permite ao nó atrioventricular filtrar a frequência atrial: na fibrilação atrial, com 400 a 600 impulsos por minuto, apenas uma fração alcança os ventrículos. Uma via acessória que fura esse isolamento produz a síndrome de Wolff-Parkinson-White. E é o anel aórtico que se mede antes do implante valvar transcateter, cujo dimensionamento decide o sucesso do procedimento.',
    memoria:
      'O esqueleto fibroso é o "isolante elétrico" do coração. Sem ele, átrio e ventrículo bateriam juntos — e a fibrilação atrial seria fatal.',
    pontos: [
      'Que funções o esqueleto fibroso do coração exerce?',
      'Por que o isolamento elétrico é indispensável?',
      'O que é uma via acessória e que síndrome ela causa?',
    ],
  },
  {
    termos: ['Anel Fibroso Pulmonar'],
    classe: 'valva',
    resumo: 'Anel fibroso que sustenta a valva pulmonar, o único não conectado ao restante do esqueleto fibroso.',
    localizacao: 'Na junção do cone arterial com o tronco pulmonar, separado do anel aórtico por músculo — o tendão do cone.',
    funcao: 'Sustenta as cúspides pulmonares. Sua separação dos demais anéis é o que permite a "autonomia" da via de saída direita.',
    vascularizacao:
      'Irrigação escassa, por ramos da artéria do cone que sobem pelo infundíbulo muscular. É justamente por estar montado sobre músculo vivo e irrigado, e não sobre fibrose inerte, que o cilindro pulmonar sobrevive quando transplantado para a posição aórtica.',
    inervacao: 'Sem inervação própria; o infundíbulo muscular que o sustenta recebe fibras simpáticas do plexo cardíaco.',
    linfaticos: 'Linfáticos do sulco coronário direito.',
    relacoes: 'O tendão do cone conecta-o à raiz da aorta.',
    clinica:
      'É justamente essa separação por músculo que torna possível a cirurgia de Ross, em que a valva pulmonar do próprio paciente é retirada com um cilindro muscular e transplantada para a posição aórtica — um autoenxerto vivo, capaz de crescer com a criança. Anatomia que possibilita uma operação inteira.',
    memoria:
      'A valva pulmonar é a única "solta" do esqueleto fibroso. Por ser destacável, ela pode ser transplantada para a posição aórtica.',
    pontos: [
      'Por que o anel pulmonar não faz parte do esqueleto fibroso?',
      'Que estrutura o conecta à raiz da aorta?',
      'O que é a cirurgia de Ross?',
    ],
  },
  /* ─────────────────── Grandes vasos ─────────────────── */
  {
    termos: ['Artéria Aorta'],
    classe: 'arteria',
    resumo: 'A maior artéria do corpo, tronco único de onde deriva toda a circulação sistêmica.',
    localizacao:
      'Do óstio aórtico, no ventrículo esquerdo, até a bifurcação nas ilíacas comuns, em L4. Percorre quatro segmentos: ascendente, arco, descendente torácica e abdominal.',
    funcao:
      'Não é apenas um cano: é um órgão elástico. A parede da aorta tem lâminas de elastina que armazenam energia na sístole e a devolvem na diástole, transformando um jato intermitente em fluxo contínuo. Sem essa complacência, o coração precisaria gerar pressões muito maiores e os capilares receberiam pulsos destrutivos.',
    vascularizacao:
      'Alimenta a própria parede pelos vasa vasorum, que penetram da adventícia e nutrem o terço externo da média; os dois terços internos vivem por difusão a partir do sangue que ela conduz. Quando os vasa vasorum se ocluem — na aortite, na sífilis terciária, na arterite de Takayasu — a média necrosa e o aneurisma se forma.',
    inervacao:
      'Plexo aórtico, de fibras simpáticas que regulam o tônus. Em dois pontos há sensores: os barorreceptores do arco, inervados pelo vago, e os quimiorreceptores dos corpos aórticos. A dor da dissecção sobe por aferentes que acompanham o simpático, e por isso ela migra conforme a dissecção avança — dor que "anda" é dor de aorta.',
    linfaticos: 'Linfonodos para-aórticos, do mediastino posterior ao retroperitônio, acompanhando todo o seu trajeto.',
    relacoes:
      'Cruza três compartimentos: intrapericárdica na ascendente, no mediastino superior e posterior no arco e na torácica, retroperitoneal no abdome. Cada compartimento muda o que uma rotura significa.',
    clinica:
      'A aorta é um órgão de leis próprias: a lei de Laplace diz que a tensão na parede cresce com o raio, e é por isso que um aneurisma, uma vez formado, tende a crescer cada vez mais rápido — o risco de rotura dispara acima de 5,5 cm na aorta abdominal. Perda de complacência com a idade, por outro lado, alarga a pressão de pulso e é a base da hipertensão sistólica isolada do idoso.',
    memoria:
      'A aorta é uma mola, não um cano. Quando a mola endurece, a sistólica sobe e a diastólica cai — e a pressão de pulso abre.',
    pontos: [
      'Quais são os quatro segmentos da aorta?',
      'O que são os vasa vasorum e o que acontece quando falham?',
      'Por que o aneurisma acelera à medida que cresce?',
    ],
  },
  {
    termos: ['Artéria Aorta (Parte Ascendente)'],
    classe: 'arteria',
    resumo: 'Primeiro segmento da aorta, do ventrículo esquerdo ao arco, de onde nascem as coronárias.',
    localizacao: 'Do óstio aórtico até o nível do ângulo esternal; é intrapericárdica em toda a sua extensão.',
    funcao:
      'Recebe todo o débito sistêmico e o transmite com complacência: a aorta ascendente armazena volume na sístole e o devolve na diástole — o efeito Windkessel, que mantém fluxo contínuo nos tecidos e alimenta as coronárias.',
    vascularizacao:
      'É a única artéria do corpo que irriga a si mesma antes de irrigar qualquer outra coisa: as duas coronárias são seus primeiros ramos, e nascem dos seios de Valsalva a poucos milímetros da valva. A parede tem vasa vasorum próprios na adventícia, e a drenagem venosa dela vai para as veias pericárdicas.',
    inervacao:
      'Plexo aórtico, sem sensibilidade somática. As aferentes de dor acompanham o simpático até T1–T4 — exatamente o mesmo segmento das aferentes cardíacas, e é essa convergência medular que faz a dissecção tipo A ser confundida com infarto na sala de emergência.',
    linfaticos: 'Linfonodos mediastinais anteriores e traqueobrônquicos.',
    relacoes: 'À direita está a veia cava superior; atrás, a artéria pulmonar direita e o átrio esquerdo; à frente, o tronco pulmonar cruzando-a.',
    clinica:
      'Ser intrapericárdica é decisivo: a dissecção aórtica tipo A pode romper para dentro do pericárdio e produzir tamponamento fatal — motivo pelo qual ela é emergência cirúrgica, ao contrário da tipo B. A perda de complacência com a idade e a aterosclerose eleva a pressão sistólica e alarga a pressão de pulso, mecanismo da hipertensão sistólica isolada do idoso.',
    memoria:
      'A aorta ascendente vive dentro do saco do coração. Se ela dissecar e romper ali, o sangue tampona — e o paciente morre em minutos.',
    pontos: [
      'O que é o efeito Windkessel?',
      'Por que a dissecção tipo A é emergência cirúrgica?',
      'Por que a hipertensão sistólica isolada é comum no idoso?',
    ],
  },
  {
    termos: ['Arco da Aorta', 'Arco Aórtico'],
    classe: 'arteria',
    resumo: 'Curva da aorta no mediastino superior, de onde saem os três grandes ramos para a cabeça e os membros superiores.',
    localizacao: 'Do ângulo esternal (T4) até o mesmo nível, arqueando-se para trás e para a esquerda sobre o brônquio principal esquerdo.',
    funcao: 'Dá origem, da direita para a esquerda, ao tronco braquiocefálico, à carótida comum esquerda e à subclávia esquerda.',
    relacoes:
      'O nervo laríngeo recorrente esquerdo contorna o arco sob o ligamento arterioso; o ducto torácico e o esôfago passam atrás; o nervo vago esquerdo desce à sua frente.',
    clinica:
      'A relação com o laríngeo recorrente esquerdo é uma das mais rentáveis da anatomia: rouquidão por paralisia de prega vocal esquerda pode ser o primeiro sinal de aneurisma do arco aórtico, de tumor de pulmão no hilo esquerdo ou de aumento do átrio esquerdo — o sinal de Ortner. O istmo aórtico, logo após a subclávia esquerda, é onde o arco se fixa pelo ligamento arterioso e é o local clássico da rotura traumática por desaceleração.',
    memoria:
      'Rouquidão sem dor de garganta em adulto fumante: pense em nervo laríngeo recorrente esquerdo — e portanto em tórax, não em laringe.',
    pontos: [
      'Quais são os três ramos do arco aórtico?',
      'Que nervo contorna o arco e que sinal sua lesão produz?',
      'Por que o istmo aórtico rompe no trauma por desaceleração?',
    ],
  },
  {
    termos: ['Artéria Aorta (Parte Descendente/Torácica)', 'Artéria Aorta (Parte Descendente)'],
    classe: 'arteria',
    resumo: 'Segmento torácico da aorta, no mediastino posterior, de T4 ao hiato aórtico do diafragma.',
    localizacao: 'Desce à esquerda dos corpos vertebrais e vai se tornando mediana; atravessa o diafragma em T12, pelo hiato aórtico.',
    funcao: 'Emite as artérias intercostais posteriores, as brônquicas, as esofágicas e as frênicas superiores.',
    relacoes: 'O esôfago está à sua frente e a cruza; o ducto torácico e a veia ázigo estão à sua direita.',
    clinica:
      'A artéria de Adamkiewicz, maior artéria radicular anterior, costuma nascer de uma intercostal entre T9 e L2, à esquerda, e é a principal fonte da medula toracolombar. Sua interrupção — em cirurgia de aneurisma toracoabdominal ou em dissecção — produz a síndrome da artéria espinal anterior, com paraplegia e perda dissociada de sensibilidade. É a razão de a drenagem liquórica ser usada como proteção medular nessas cirurgias.',
    memoria:
      'Uma única artéria irriga a medula toracolombar, e ela nasce à esquerda, entre T9 e L2. Perdê-la é paraplegia.',
    pontos: [
      'Que ramos a aorta torácica emite?',
      'O que é a artéria de Adamkiewicz?',
      'Que síndrome sua interrupção produz?',
    ],
  },
  {
    termos: ['Tronco Braquiocefálico', 'Tronco Braquiocefálico Direito'],
    classe: 'arteria',
    resumo: 'Primeiro e maior ramo do arco aórtico, que se divide em carótida comum direita e subclávia direita.',
    localizacao: 'Nasce do arco à direita, sobe obliquamente atrás do manúbrio e se bifurca atrás da articulação esternoclavicular direita.',
    funcao: 'Leva sangue ao lado direito da cabeça, do pescoço e ao membro superior direito. Não existe equivalente à esquerda: lá, carótida e subclávia nascem separadamente do arco.',
    relacoes: 'Está imediatamente atrás do manúbrio, cruzado à frente pela veia braquiocefálica esquerda.',
    clinica:
      'Essa posição retroesternal é a razão da fístula traqueoinominada, complicação rara e catastrófica da traqueostomia: a cânula erode a parede posterior do tronco braquiocefálico e produz hemorragia maciça pela traqueia. Um sangramento sentinela pela cânula é sinal de alarme que exige avaliação imediata.',
    memoria:
      'À direita, um tronco só que depois se divide; à esquerda, dois ramos separados. A assimetria é embriológica, não erro de anatomia.',
    pontos: [
      'Em que artérias o tronco braquiocefálico se divide?',
      'Por que não existe um tronco equivalente à esquerda?',
      'O que é a fístula traqueoinominada?',
    ],
  },
  {
    termos: ['Artéria Carótida Comum Direita'],
    classe: 'arteria',
    resumo: 'Ramo do tronco braquiocefálico que sobe no pescoço até se bifurcar na altura da cartilagem tireóidea.',
    localizacao: 'Da bifurcação do tronco braquiocefálico, atrás da articulação esternoclavicular direita, até o nível de C3–C4, dentro da bainha carótica.',
    funcao: 'Conduz sangue à cabeça e ao pescoço; ao contrário da esquerda, não tem porção torácica.',
    relacoes: 'Na bainha carótica, corre medialmente à veia jugular interna, com o nervo vago entre as duas, atrás.',
    clinica:
      'O seio carotídeo, na bifurcação, é um barorreceptor inervado pelo glossofaríngeo: sua compressão desencadeia bradicardia e queda de pressão — base da manobra de massagem do seio carotídeo e da síncope do seio carotídeo hipersensível, causa de queda em idosos ao girar a cabeça ou apertar a gravata. O corpo carotídeo, ao lado, é quimiorreceptor de oxigênio.',
    memoria:
      'Na bainha do pescoço: veia por fora, artéria por dentro, vago atrás, no meio dos dois. VAN em posição vertical.',
    pontos: [
      'Qual a disposição das estruturas na bainha carótica?',
      'Qual a diferença entre seio e corpo carotídeo?',
      'Que nervo inerva o seio carotídeo?',
    ],
  },
  {
    termos: ['Artéria Carótida Comum Esquerda'],
    classe: 'arteria',
    resumo: 'Segundo ramo do arco aórtico, a única carótida comum com porção torácica.',
    localizacao: 'Nasce diretamente do arco aórtico, sobe no mediastino superior à esquerda da traqueia e entra no pescoço atrás da articulação esternoclavicular esquerda.',
    funcao: 'Irriga o lado esquerdo da cabeça e do pescoço; seu segmento torácico é o que a distingue da direita.',
    relacoes: 'No tórax, está à esquerda da traqueia e à frente da subclávia esquerda; o nervo vago esquerdo desce lateralmente a ela.',
    clinica:
      'A bifurcação carotídea é o sítio preferencial da placa aterosclerótica, por causa do fluxo turbulento e do baixo estresse de cisalhamento no bulbo. É onde se faz a endarterectomia, e é dela que partem os êmbolos que causam a amaurose fugaz — cegueira monocular transitória por embolia da artéria central da retina, um alarme de AVC iminente.',
    memoria:
      'Onde o fluxo vira turbulento, a placa cresce. A bifurcação da carótida é a curva mais famosa da aterosclerose.',
    pontos: [
      'O que diferencia a carótida comum esquerda da direita?',
      'Por que a bifurcação carotídea acumula placas?',
      'O que é a amaurose fugaz e o que ela indica?',
    ],
  },
  {
    termos: ['Artéria Subclávia Direita'],
    classe: 'arteria',
    resumo: 'Ramo do tronco braquiocefálico que passa entre os escalenos e se torna a artéria axilar.',
    localizacao: 'Da bifurcação do tronco braquiocefálico, arqueia-se sobre a cúpula pleural e passa entre os escalenos anterior e médio.',
    funcao: 'Irriga o membro superior direito e emite a vertebral, a torácica interna, o tronco tireocervical e o tronco costocervical.',
    relacoes: 'O nervo laríngeo recorrente direito contorna essa artéria — e não o arco aórtico, como o esquerdo.',
    clinica:
      'Essa diferença de altura entre os dois recorrentes é o que faz a rouquidão por lesão do direito ser um sinal de doença cervical ou torácica alta, enquanto a do esquerdo aponta para o mediastino. A artéria subclávia lusória, variante em que a subclávia direita nasce do arco e passa atrás do esôfago, causa disfagia lusória.',
    memoria:
      'Recorrente direito dá a volta na subclávia, lá em cima; o esquerdo, no arco da aorta, lá embaixo. A altura da lesão muda com o lado.',
    pontos: [
      'Que ramos a artéria subclávia emite?',
      'Que nervo contorna a subclávia direita?',
      'O que é a artéria lusória?',
    ],
  },
  {
    termos: ['Artéria Subclávia Esquerda'],
    classe: 'arteria',
    resumo: 'Terceiro e último ramo do arco aórtico, com trajeto torácico mais longo que a direita.',
    localizacao: 'Nasce do arco atrás da carótida comum esquerda, sobe no mediastino e arqueia-se sobre a cúpula pleural esquerda.',
    funcao: 'Irriga o membro superior esquerdo; sua origem no arco define o istmo aórtico, imediatamente distal a ela.',
    relacoes: 'O ducto torácico cruza atrás dela para desembocar no ângulo venoso esquerdo.',
    clinica:
      'A estenose proximal da subclávia — mais comum à esquerda — produz a síndrome do roubo da subclávia: o exercício do braço inverte o fluxo na artéria vertebral, que passa a drenar sangue do encéfalo para o membro, causando tontura e sintomas de insuficiência vertebrobasilar durante o esforço. A diferença de pressão maior que 15 mmHg entre os braços é o sinal de rastreio.',
    memoria:
      'Braço "roubando" sangue do cérebro: o paciente fica tonto quando usa o braço. Meça a pressão nos dois lados.',
    pontos: [
      'Qual a relação da subclávia esquerda com o istmo aórtico?',
      'O que é a síndrome do roubo da subclávia?',
      'Que achado no exame físico sugere estenose subclávia?',
    ],
  },
  {
    termos: ['Artéria Pulmonar Direita'],
    classe: 'arteria',
    resumo: 'Ramo direito do tronco pulmonar, mais longo e horizontal, que cruza a linha média atrás da aorta ascendente.',
    localizacao: 'Do tronco pulmonar até o hilo direito, passando atrás da aorta ascendente e da veia cava superior e à frente do brônquio principal direito.',
    funcao: 'Leva sangue venoso ao pulmão direito; é a artéria que carrega mais sangue dos dois lados, proporcional ao maior volume do pulmão direito.',
    relacoes: 'No hilo direito, a artéria é anterior ao brônquio — o oposto do lado esquerdo.',
    clinica:
      'Essa relação hilar distingue os dois lados na tomografia e é a base da anatomia hilar: à direita, brônquio eparterial (o lobar superior passa acima da artéria); à esquerda, a artéria é superior ao brônquio. E a artéria pulmonar direita, por ser a mais calibrosa e horizontal, é onde se alojam os grandes êmbolos em sela.',
    memoria:
      'RALS: no hilo direito, artéria Anterior ao brônquio; no esquerdo, artéria Superior. Right Anterior, Left Superior.',
    pontos: [
      'Qual a relação da artéria com o brônquio em cada hilo?',
      'O que é um brônquio eparterial?',
      'Por que grandes êmbolos se alojam na pulmonar direita?',
    ],
  },
  {
    termos: ['Artéria Pulmonar Esquerda'],
    classe: 'arteria',
    resumo: 'Ramo esquerdo do tronco pulmonar, mais curto, ligado ao arco aórtico pelo ligamento arterioso.',
    localizacao: 'Do tronco pulmonar ao hilo esquerdo, arqueando-se sobre o brônquio principal esquerdo.',
    funcao: 'Leva sangue venoso ao pulmão esquerdo; é mais curta e mais superior em relação ao brônquio.',
    relacoes: 'O ligamento arterioso — resto do ducto arterioso — a une ao arco aórtico; o nervo laríngeo recorrente esquerdo contorna esse ligamento.',
    clinica:
      'A persistência do ducto arterioso produz um sopro contínuo "em maquinaria" e sobrecarga pulmonar, e seu fechamento — farmacológico com indometacina no prematuro, ou por cateter — é um dos tratamentos mais eficazes da cardiologia pediátrica. A janela aortopulmonar, entre aorta e artéria pulmonar esquerda, é uma estação linfonodal (nível 5) importante no estadiamento do câncer de pulmão.',
    memoria:
      'O ligamento arterioso é o cordão que sobrou do ducto fetal. É nele que o nervo recorrente esquerdo dá a volta — e é por ele que a rouquidão vira sinal de tumor.',
    pontos: [
      'O que é o ligamento arterioso?',
      'Que nervo o contorna?',
      'O que é a janela aortopulmonar e por que ela importa?',
    ],
  },
  {
    termos: ['Artéria Pulmonar Superior Direita'],
    classe: 'arteria',
    resumo: 'Tronco anterior da artéria pulmonar direita — o primeiro e maior ramo, destinado ao lobo superior.',
    localizacao: 'Nasce da artéria pulmonar direita ainda no mediastino, antes do hilo, e cruza por cima do brônquio lobar superior direito.',
    funcao:
      'Leva sangue venoso aos segmentos apical e anterior do lobo superior direito. Por sair tão precocemente, é a única artéria lobar que fica acima do brônquio correspondente — a contrapartida arterial do brônquio eparterial.',
    vascularizacao:
      'Como toda artéria de calibre médio, tem vasa vasorum na adventícia. Vale a distinção que confunde estudante: ela não é irrigada por sangue oxigenado do próprio lúmen, porque o sangue que conduz é venoso — quem a nutre são os ramos brônquicos sistêmicos.',
    inervacao: 'Plexo pulmonar, com fibras simpáticas vasoconstritoras. A hipóxia alveolar contrai esses ramos localmente — a vasoconstrição hipóxica pulmonar, reflexo que desvia sangue de áreas mal ventiladas.',
    linfaticos: 'Linfonodos hilares direitos, que a circundam de perto.',
    relacoes: 'Está à frente e acima do brônquio lobar superior; a veia pulmonar superior direita corre à sua frente e abaixo.',
    clinica:
      'É a artéria de dissecção mais perigosa na lobectomia superior direita: curta, de parede fina e escondida atrás da veia. Sua avulsão é uma das causas clássicas de conversão de toracoscopia em toracotomia de urgência. Na embolia pulmonar, sua oclusão isolada produz defeito perfusional de todo o lobo superior direito com radiografia normal — a clássica dissociação clínico-radiológica.',
    memoria:
      'À direita, a artéria do lobo superior sai cedo e passa por cima do brônquio. É curta, frágil e a que mais assusta o cirurgião.',
    pontos: [
      'Que segmentos a artéria pulmonar superior direita irriga?',
      'Por que ela é a mais perigosa na lobectomia superior?',
      'O que é a vasoconstrição hipóxica pulmonar?',
    ],
  },
  {
    termos: ['Artéria Pulmonar Inferior Direita'],
    classe: 'arteria',
    resumo: 'Porção interlobar e basal da artéria pulmonar direita, que desce na fissura para os lobos médio e inferior.',
    localizacao: 'Continuação da artéria pulmonar direita após o tronco anterior; desce no fundo da fissura oblíqua, atrás do brônquio intermédio.',
    funcao:
      'Emite a artéria do segmento superior do lobo inferior, as artérias do lobo médio e o tronco basal comum, que se divide nos quatro ramos basais. É o vaso de maior fluxo do pulmão direito, porque serve o maior volume de parênquima.',
    vascularizacao: 'Vasa vasorum da adventícia, supridos pelos ramos brônquicos que correm junto ao brônquio intermédio.',
    inervacao: 'Plexo pulmonar; responde à hipóxia com vasoconstrição e à acidose com potencialização dessa resposta.',
    linfaticos: 'Linfonodos interlobares (estação 11), que a envolvem no fundo da fissura.',
    relacoes: 'Corre na fissura, atrás do brônquio intermédio e à frente do brônquio do segmento superior.',
    clinica:
      'É onde se alojam os grandes êmbolos "em sela" que descem da pulmonar direita, e o vaso que a angiotomografia examina primeiro na suspeita de tromboembolismo. Sua posição no fundo da fissura é também a razão de a lobectomia inferior exigir a abertura completa da fissura — manobra que responde por boa parte do sangramento e da fuga aérea do pós-operatório.',
    memoria:
      'A artéria de baixo mora no fundo da fissura. Para chegar nela, o cirurgião precisa abrir o pulmão ao meio — e é daí que vem o vazamento de ar.',
    pontos: [
      'Que territórios a porção interlobar irriga?',
      'Por que ela é o alvo principal da angiotomografia na embolia?',
      'Que estação linfonodal a acompanha?',
    ],
  },
  {
    termos: ['Veia Pulmonar Superior Direita'],
    classe: 'veia',
    resumo: 'Veia que devolve ao átrio esquerdo o sangue oxigenado dos lobos superior e médio do pulmão direito.',
    localizacao:
      'Corre à frente da artéria pulmonar direita, no hilo, e desemboca no ângulo superior direito da parede posterior do átrio esquerdo, atrás da veia cava superior.',
    funcao:
      'Drena dois lobos, e não um — é a única das quatro que recebe território de dois lobos, porque a veia do lobo médio se junta a ela antes da desembocadura. Carrega sangue arterializado, como todas as pulmonares.',
    vascularizacao: 'Parede nutrida por vasa vasorum de origem brônquica; a manga de miocárdio atrial que reveste sua desembocadura recebe ramos atriais da coronária direita.',
    inervacao:
      'Plexo pulmonar, e — decisivo — miocárdio atrial que se estende para dentro dela por até 2 cm. Esse manguito tem automatismo próprio e é a fonte dos disparos ectópicos que iniciam a fibrilação atrial.',
    linfaticos: 'Linfonodos hilares direitos.',
    relacoes: 'É a estrutura mais anterior do hilo direito; a artéria pulmonar está atrás dela e o brônquio, mais atrás ainda.',
    clinica:
      'Ligar esta veia sem identificar o ramo do lobo médio infarta o lobo médio — um dos erros clássicos da lobectomia superior direita. E, por ser a veia de desembocadura mais próxima da veia cava superior, é a que mais frequentemente se estenosa após ablação de fibrilação atrial, com dispneia e hemoptise semanas depois do procedimento.',
    memoria:
      'A veia superior direita drena dois lobos: o superior e o médio. Ligou sem olhar, matou o lobo médio.',
    pontos: [
      'Que lobos a veia pulmonar superior direita drena?',
      'Que erro cirúrgico essa anatomia produz?',
      'Por que ela é fonte de fibrilação atrial?',
    ],
  },
  {
    termos: ['Veia Pulmonar Inferior Direita'],
    classe: 'veia',
    resumo: 'Veia que devolve ao átrio esquerdo o sangue do lobo inferior do pulmão direito.',
    localizacao: 'A mais posterior e mais inferior do hilo direito, desembocando na parede posterior do átrio esquerdo, abaixo da superior.',
    funcao: 'Drena exclusivamente o lobo inferior direito, reunindo a veia do segmento superior e o tronco venoso basal comum.',
    vascularizacao: 'Vasa vasorum brônquicos; manguito atrial na desembocadura, irrigado por ramos atriais.',
    inervacao: 'Plexo pulmonar e manguito de miocárdio atrial — também ela é sítio de foco ectópico, embora menos que as superiores.',
    linfaticos: 'Linfonodos hilares e traqueobrônquicos inferiores.',
    relacoes: 'Corre no ligamento pulmonar, abaixo do hilo — posição que a torna a última estrutura a ser seccionada na pneumonectomia.',
    clinica:
      'Sua posição baixa e posterior faz dela referência ecocardiográfica transesofágica e ponto de reparo na ablação. E é a veia cuja ligadura isolada permite a lobectomia inferior sem tocar no restante do hilo — a razão de a lobectomia inferior ser tecnicamente mais simples que a superior.',
    memoria:
      'A veia de baixo drena um lobo só. Por isso a lobectomia inferior é a mais limpa das quatro.',
    pontos: [
      'Que lobo a veia pulmonar inferior direita drena?',
      'Onde ela corre em relação ao hilo?',
      'Por que a lobectomia inferior é tecnicamente mais simples?',
    ],
  },
  {
    termos: ['Veia Pulmonar Superior Esquerda'],
    classe: 'veia',
    resumo: 'Veia que devolve ao átrio esquerdo o sangue do lobo superior esquerdo, incluindo a língula.',
    localizacao: 'À frente e abaixo da artéria pulmonar esquerda, no hilo esquerdo; desemboca no ângulo superior esquerdo do átrio esquerdo.',
    funcao: 'Drena todo o lobo superior esquerdo e a língula — o equivalente esquerdo do arranjo que, à direita, junta lobo superior e lobo médio.',
    vascularizacao: 'Vasa vasorum das artérias brônquicas esquerdas; manguito atrial irrigado por ramos da artéria circunflexa.',
    inervacao:
      'Plexo pulmonar esquerdo e manguito de miocárdio atrial. Esta é, das quatro, a veia com maior extensão de manga muscular — e, por isso, a que mais frequentemente origina a fibrilação atrial.',
    linfaticos: 'Linfonodos hilares esquerdos e subaórticos.',
    relacoes:
      'Sua parede anterior está a poucos milímetros da aurícula esquerda, e o nervo frênico esquerdo desce logo à frente, no pericárdio.',
    clinica:
      'A proximidade com a aurícula esquerda é o que torna a "crista" entre as duas o ponto tecnicamente mais difícil do isolamento das veias pulmonares — e a proximidade com o frênico é a razão de a paralisia diafragmática ser complicação descrita da ablação nesta veia. Duas estruturas vizinhas, duas complicações distintas.',
    memoria:
      'Superior esquerda: mais músculo atrial dentro dela que qualquer outra. É a veia que mais dispara fibrilação — e a mais difícil de isolar.',
    pontos: [
      'Que territórios a veia pulmonar superior esquerda drena?',
      'Por que ela é a principal fonte de fibrilação atrial?',
      'Que nervo corre à sua frente e qual o risco?',
    ],
  },
  {
    termos: ['Veia Pulmonar Inferior Esquerda'],
    classe: 'veia',
    resumo: 'Veia que devolve ao átrio esquerdo o sangue do lobo inferior esquerdo.',
    localizacao: 'A mais posterior e inferior do hilo esquerdo, no ligamento pulmonar; desemboca na parede posterior do átrio esquerdo.',
    funcao: 'Drena exclusivamente o lobo inferior esquerdo, reunindo a veia do segmento superior e o tronco basal.',
    vascularizacao: 'Vasa vasorum de origem brônquica; manguito atrial de irrigação circunflexa.',
    inervacao: 'Plexo pulmonar esquerdo e manga de miocárdio atrial, também arritmogênica.',
    linfaticos: 'Linfonodos hilares esquerdos e traqueobrônquicos inferiores.',
    relacoes:
      'É a estrutura que mais se aproxima do esôfago: apenas o pericárdio e alguns milímetros de gordura separam sua desembocadura da parede esofágica.',
    clinica:
      'Essa vizinhança é a origem da complicação mais temida da ablação de fibrilação atrial: a fístula atrioesofágica, rara mas quase sempre fatal, que se manifesta dias a semanas depois com febre, disfagia e evento neurológico embólico. É a razão de se monitorar a temperatura esofágica durante o procedimento.',
    memoria:
      'A veia inferior esquerda está encostada no esôfago. Queimar demais ali abre uma fístula entre o coração e o tubo digestivo.',
    pontos: [
      'Que lobo a veia pulmonar inferior esquerda drena?',
      'Que órgão está imediatamente atrás dela?',
      'O que é a fístula atrioesofágica?',
    ],
  },
  {
    termos: ['Veia Braquiocefálica'],
    classe: 'veia',
    resumo: 'Veia formada pela união da jugular interna com a subclávia, que se junta à contralateral para formar a cava superior.',
    localizacao:
      'Cada uma nasce atrás da articulação esternoclavicular; a esquerda é bem mais longa e cruza a linha média atrás do manúbrio para encontrar a direita, quase vertical.',
    funcao: 'Drena cabeça, pescoço, membros superiores e parte da parede torácica. O ângulo venoso — junção da jugular com a subclávia — recebe o ducto torácico à esquerda e o ducto linfático direito à direita.',
    relacoes: 'A esquerda cruza à frente dos ramos do arco aórtico; a direita é curta e quase vertical.',
    clinica:
      'A diferença de trajeto explica a preferência pelo acesso venoso central à direita: o cateter segue um caminho quase reto até a cava superior, enquanto à esquerda precisa fazer uma curva, com maior risco de perfuração da parede lateral. O ângulo venoso esquerdo é ainda o sítio do linfonodo de Virchow, cuja presença sugere neoplasia abdominal — classicamente gástrica.',
    memoria:
      'Direita curta e reta, esquerda longa e atravessada. Por isso o cateter central prefere o lado direito.',
    pontos: [
      'Como se formam as veias braquiocefálicas?',
      'Por que o acesso venoso central prefere o lado direito?',
      'O que é o linfonodo de Virchow?',
    ],
  },
  {
    termos: ['Veia Ázigo', 'Veia Àzigo'],
    classe: 'veia',
    resumo: 'Veia do mediastino posterior direito que drena as paredes do tórax e conecta as duas cavas.',
    localizacao:
      'Sobe à direita dos corpos vertebrais, à direita da aorta e do ducto torácico, e arqueia-se sobre o hilo pulmonar direito para desembocar na veia cava superior ao nível de T4.',
    funcao:
      'Drena as veias intercostais posteriores direitas, as hemiázigos, as esofágicas e as brônquicas. Estabelece uma anastomose entre os sistemas das cavas superior e inferior.',
    relacoes: 'Seu arco cruza acima do brônquio principal direito, um marco reconhecível na broncoscopia e na tomografia.',
    clinica:
      'Essa conexão entre as duas cavas é uma via colateral vital: na obstrução da veia cava superior — por tumor de pulmão, mais comumente — o sangue desvia pelo sistema ázigo, e é isso que impede o quadro de ser imediatamente fatal. A síndrome da veia cava superior se manifesta com edema em esclavina, turgência jugular e circulação colateral torácica.',
    memoria:
      '"Ázigo" = ímpar, sem par. É a veia solitária que liga o andar de cima ao de baixo — e que salva o paciente quando a cava superior fecha.',
    pontos: [
      'Que territórios a veia ázigo drena?',
      'Onde ela desemboca e em que nível?',
      'Que papel ela exerce na síndrome da veia cava superior?',
    ],
  },
  {
    termos: ['Artéria Interventricular Posterior'],
    classe: 'arteria',
    resumo: 'Ramo que percorre o sulco interventricular posterior e define a dominância coronariana.',
    localizacao: 'No sulco interventricular posterior, do cruz do coração até o ápice; nasce da coronária direita em cerca de 80% das pessoas.',
    funcao: 'Irriga o terço posterior do septo interventricular, a parede inferior do ventrículo esquerdo e, em geral, o nó atrioventricular.',
    relacoes: 'A veia cardíaca média a acompanha no sulco.',
    clinica:
      'De qual artéria ela nasce define a dominância: direita (80%), esquerda (10%) ou codominante (10%). Isso importa porque determina qual oclusão coronária produz o infarto de parede inferior e o bloqueio atrioventricular. Na dominância esquerda, a circunflexa irriga um território muito maior, e sua oclusão é proporcionalmente mais grave.',
    memoria:
      'Quem dá a interventricular posterior é o "dominante". Em 8 de cada 10 pessoas, é a coronária direita.',
    pontos: [
      'O que define a dominância coronariana?',
      'Que territórios a interventricular posterior irriga?',
      'Por que a dominância esquerda torna a oclusão mais grave?',
    ],
  },
  {
    termos: ['Ramo Marginal Esquerdo'],
    classe: 'arteria',
    resumo: 'Ramo da artéria circunflexa que desce pela margem esquerda do coração.',
    localizacao: 'Sai da circunflexa no sulco coronário esquerdo e desce pela face lateral do ventrículo esquerdo.',
    funcao: 'Irriga a parede lateral do ventrículo esquerdo.',
    vascularizacao:
      'Sua própria parede é nutrida por vasa vasorum finos da adventícia — e, ao contrário do que a intuição sugere, artéria de pequeno calibre como esta é nutrida sobretudo por difusão a partir do sangue que conduz. O território que ela irriga drena pela veia marginal esquerda, para a veia cardíaca magna e daí ao seio coronário.',
    inervacao:
      'Plexo cardíaco, com fibras simpáticas vasoconstritoras na adventícia. Um detalhe fisiológico que importa: as coronárias respondem muito mais à demanda metabólica local — adenosina, óxido nítrico — do que ao comando nervoso. Por isso o coração se autorregula mesmo transplantado e desnervado.',
    linfaticos: 'Acompanha o tronco linfático esquerdo até os linfonodos traqueobrônquicos inferiores.',
    relacoes: 'Acompanhado pela veia marginal esquerda, tributária da veia cardíaca magna.',
    clinica:
      'A oclusão dos ramos marginais produz o infarto de parede lateral, que se manifesta com supradesnivelamento em D1 e aVL — território eletrocardiográfico frequentemente subestimado, e responsável por infartos "silenciosos" no eletrocardiograma convencional. É a razão de o eletrocardiograma isolado não excluir infarto.',
    memoria:
      'Parede lateral = D1 e aVL. Se você só olha as derivações inferiores e V1–V4, perde o infarto da circunflexa.',
    pontos: [
      'De que artéria nasce o ramo marginal esquerdo?',
      'Que parede ele irriga?',
      'Que derivações eletrocardiográficas correspondem a esse território?',
    ],
  },
  {
    termos: ['Ramo Posterior do Ventrículo Esquerdo'],
    classe: 'arteria',
    resumo: 'Ramo terminal da circunflexa ou da coronária direita para a face posterolateral do ventrículo esquerdo.',
    localizacao: 'Face posterior do ventrículo esquerdo, entre o sulco coronário e o interventricular posterior.',
    funcao: 'Completa a irrigação da parede posterolateral do ventrículo esquerdo, área de transição entre os territórios das duas coronárias.',
    relacoes: 'Sua origem varia conforme a dominância coronariana.',
    clinica:
      'O infarto de parede posterior é o mais difícil de reconhecer, porque não há derivações convencionais que o vejam de frente: manifesta-se como imagem em espelho — infradesnivelamento e onda R alta em V1 e V2 —, e confirma-se com as derivações posteriores V7 a V9. É um dos infartos mais perdidos na emergência.',
    memoria:
      'Infarto posterior aparece "ao contrário" em V1–V2: R alta e infra de ST. Quando ver isso, peça V7, V8 e V9.',
    pontos: [
      'Que território esse ramo irriga?',
      'Por que o infarto posterior é difícil de diagnosticar?',
      'Que derivações adicionais confirmam o diagnóstico?',
    ],
  },
  /* ─────────────────── Baço (faces e artéria) ─────────────────── */
  {
    termos: ['Artéria Esplênica'],
    classe: 'arteria',
    resumo: 'Ramo mais calibroso e tortuoso do tronco celíaco, que segue até o hilo do baço pelo ligamento esplenorrenal.',
    localizacao: 'Do tronco celíaco, corre sinuosa ao longo da borda superior do pâncreas, atrás do estômago, até o hilo esplênico.',
    funcao:
      'Irriga o baço e, no caminho, emite ramos pancreáticos, as gástricas curtas e a gastromental esquerda. Sua tortuosidade acomoda as variações de volume do baço e do estômago.',
    relacoes: 'Corre no ligamento esplenorrenal, junto com a cauda do pâncreas — que alcança o hilo esplênico em cerca de 30% das pessoas.',
    clinica:
      'Essa relação com a cauda do pâncreas é a razão de a esplenectomia poder causar fístula pancreática, e da pancreatite poder trombosar a veia esplênica, produzindo hipertensão portal segmentar com varizes gástricas isoladas — a única hipertensão portal curável por esplenectomia. Os aneurismas de artéria esplênica são os mais comuns das artérias viscerais e têm risco aumentado de rotura na gravidez.',
    memoria:
      'A esplênica é a artéria mais tortuosa do abdome, correndo em cima do pâncreas como uma cobra. Pâncreas doente, veia esplênica trombosa.',
    pontos: [
      'Que ramos a artéria esplênica emite no trajeto?',
      'Qual sua relação com a cauda do pâncreas?',
      'O que é a hipertensão portal segmentar?',
    ],
  },
  {
    termos: ['Face Gástrica'],
    classe: 'viscera',
    resumo: 'Face côncava do baço voltada para o estômago, à frente do hilo.',
    localizacao: 'Face diafragmática interna do baço, anterior ao hilo, moldada pela grande curvatura gástrica.',
    funcao: 'Recebe a impressão do fundo gástrico; o ligamento gastroesplênico, que contém as artérias gástricas curtas, a conecta ao estômago.',
    vascularizacao:
      'Ramos terminais da artéria esplênica que entram pelo hilo, logo atrás desta face, e as gástricas curtas que correm no ligamento gastroesplênico à sua frente. O retorno é pela veia esplênica, que segue para a porta — o baço é território portal, e não sistêmico.',
    inervacao:
      'Plexo esplênico, de fibras simpáticas do gânglio celíaco que acompanham a artéria. São vasomotoras: comandam a contração da cápsula e a expulsão do sangue armazenado na resposta adrenérgica. O baço não tem inervação parassimpática funcional relevante.',
    linfaticos: 'Linfonodos pancreatoesplênicos, ao longo da artéria esplênica, e daí para os celíacos.',
    relacoes: 'O ligamento gastroesplênico é a parede esquerda da bolsa omental.',
    clinica:
      'As gástricas curtas nesse ligamento são o motivo do sangramento na gastrectomia total e são as artérias ligadas na esplenectomia. Elas são também a via colateral que mantém a perfusão do fundo gástrico após a ligadura da gástrica esquerda — e a razão de as varizes gástricas isoladas aparecerem na trombose de veia esplênica.',
    memoria:
      'O baço tem "impressões" dos vizinhos como uma almofada amassada: estômago na frente, rim atrás, cólon embaixo.',
    pontos: [
      'Que ligamento une o baço ao estômago?',
      'Que artérias correm nele?',
      'Que relação isso tem com varizes gástricas?',
    ],
  },
  {
    termos: ['Face Renal'],
    classe: 'viscera',
    resumo: 'Face do baço voltada para o rim esquerdo, atrás do hilo.',
    localizacao: 'Porção posteroinferior da face visceral do baço, moldada pelo polo superior do rim esquerdo e pela glândula suprarrenal.',
    funcao: 'Apoia-se sobre o rim esquerdo; o ligamento esplenorrenal, que a fixa, contém a artéria e a veia esplênicas e a cauda do pâncreas.',
    vascularizacao:
      'É por aqui que o pedículo entra: a artéria e a veia esplênicas correm no ligamento esplenorrenal, imediatamente atrás desta face, acompanhadas da cauda do pâncreas. Nenhuma outra face do baço tem os vasos principais tão próximos — e é a razão de a mobilização posterior do baço ser o passo mais perigoso da esplenectomia.',
    inervacao: 'Plexo esplênico, simpático, que acompanha a artéria dentro do mesmo ligamento.',
    linfaticos: 'Linfonodos do hilo esplênico e pancreatoesplênicos, no trajeto do pedículo.',
    relacoes: 'O rim esquerdo e a suprarrenal esquerda estão imediatamente atrás.',
    clinica:
      'Essa relação explica por que o trauma esplênico pode vir acompanhado de lesão renal esquerda, e por que a nefrectomia esquerda exige cuidado com o baço — a lesão esplênica inadvertida é complicação conhecida da cirurgia do rim, do estômago e do cólon esquerdo.',
    memoria:
      'O baço está encostado no rim esquerdo. Cirurgia de um pode machucar o outro — e a hemorragia costuma vir do baço.',
    pontos: [
      'Que estruturas moldam a face renal do baço?',
      'Que ligamento a fixa e o que ele contém?',
      'Que complicação cirúrgica essa vizinhança gera?',
    ],
  },
  {
    termos: ['Face Cólica'],
    classe: 'viscera',
    resumo: 'Face inferior do baço, apoiada sobre a flexura esquerda do cólon.',
    localizacao: 'Porção inferior da face visceral, sobre a flexura cólica esquerda (esplênica).',
    funcao: 'Repousa sobre o cólon; o ligamento frenocólico, abaixo, funciona como uma prateleira que sustenta o baço.',
    vascularizacao:
      'Ramos do polo inferior da artéria esplênica, frequentemente acompanhados de um ramo da gastromental esquerda. Aqui vale um dado que a esplenectomia parcial explora: o baço tem territórios arteriais segmentares, separados por planos avasculares — dá para ressecar um polo sem sangrar o outro.',
    inervacao: 'Plexo esplênico, simpático. A dor de um infarto esplênico, porém, chega pela pleura e pelo peritônio parietal vizinhos, não pelo próprio baço.',
    linfaticos: 'Linfonodos do hilo esplênico e, pela vizinhança cólica, também os mesentéricos inferiores.',
    relacoes: 'A flexura esplênica é mais alta e mais aguda que a hepática, presa ao diafragma pelo ligamento frenocólico.',
    clinica:
      'Essa fixação alta e angulada é o motivo de a flexura esplênica ser o ponto mais difícil da colonoscopia e um local frequente de perfuração. E a tração excessiva do cólon nessa região é a causa mais comum de lesão esplênica iatrogênica em cirurgia colorretal.',
    memoria:
      'O baço se apoia numa prateleira de ligamento sobre o cólon. Puxe o cólon com força e a prateleira arranca o baço.',
    pontos: [
      'Que estrutura sustenta o baço inferiormente?',
      'Por que a flexura esplênica é difícil na colonoscopia?',
      'Como ocorre a lesão esplênica iatrogênica?',
    ],
  },
  {
    termos: ['Polo Anterior'],
    classe: 'viscera',
    resumo: 'Extremidade anterior e mais larga do baço, voltada para a frente e para baixo.',
    localizacao: 'Extremidade anteroinferior do baço, próxima à flexura cólica esquerda; sua margem superior é entalhada.',
    funcao: 'É a extremidade que se aproxima da linha média quando o baço aumenta de volume.',
    vascularizacao:
      'Ramos terminais do tronco inferior da artéria esplênica. Por ser a extremidade mais distante do hilo, é o território mais vulnerável ao infarto esplênico — o que aparece na tomografia como cunha hipodensa de base periférica, típica da anemia falciforme e da endocardite embólica.',
    inervacao: 'Plexo esplênico, simpático, sem sensibilidade dolorosa própria.',
    linfaticos: 'Drenagem centrípeta para os linfonodos do hilo esplênico.',
    relacoes: 'As incisuras da margem superior são vestígios da lobulação embrionária.',
    clinica:
      'É essa margem entalhada que torna o baço reconhecível à palpação: um órgão que desce do rebordo costal esquerdo em direção à fossa ilíaca direita, com borda anterior serrilhada, é baço — e não rim, que cresce para baixo e não tem incisura. É um dos poucos sinais patognomônicos do exame abdominal.',
    memoria:
      'Baço cresce em direção à fossa ilíaca direita e tem a borda "denteada". Rim cresce para baixo e é liso. A incisura decide.',
    pontos: [
      'Que direção o baço aumentado segue?',
      'Como diferenciar baço de rim na palpação?',
      'O que as incisuras da margem superior representam?',
    ],
  },
  {
    termos: ['Polo Posterior'],
    classe: 'viscera',
    resumo: 'Extremidade posterior e arredondada do baço, dirigida para cima e para trás.',
    localizacao: 'Extremidade posterossuperior do baço, encostada no diafragma, na altura da 9ª a 11ª costela esquerda.',
    funcao: 'Repousa contra a parede torácica posterolateral esquerda, protegido pelo gradil costal.',
    vascularizacao:
      'Ramos do tronco superior da artéria esplênica, que se distribuem em leque a partir do hilo. Toda a drenagem venosa do baço, inclusive deste polo, vai para a veia esplênica e daí para o sistema porta — razão de a esplenomegalia ser sinal cardinal de hipertensão portal.',
    inervacao:
      'Plexo esplênico. A dor do trauma esplênico não vem do órgão: vem do peritônio parietal e da irritação do diafragma, que refere ao ombro esquerdo por C4 — o sinal de Kehr, um dos achados mais úteis do abdome agudo traumático.',
    linfaticos: 'Linfonodos do hilo esplênico e pancreatoesplênicos.',
    relacoes: 'O diafragma e o recesso costodiafragmático da pleura o separam do pulmão.',
    clinica:
      'A projeção entre a 9ª e a 11ª costela explica a associação clássica: fratura de costelas baixas à esquerda obriga a investigar lesão esplênica. E é essa posição alta que faz do baço o órgão mais lesado no trauma abdominal fechado, muitas vezes com hemorragia tardia após dias — a rotura em dois tempos, quando o hematoma subcapsular rompe.',
    memoria:
      'Costelas 9, 10 e 11 do lado esquerdo protegem o baço — e denunciam sua lesão quando quebram.',
    pontos: [
      'Que costelas se relacionam com o baço?',
      'Por que fraturas costais esquerdas baixas preocupam?',
      'O que é a rotura esplênica em dois tempos?',
    ],
  },
]
