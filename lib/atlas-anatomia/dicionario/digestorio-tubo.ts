import type { EntradaDicionario } from './tipos'

/**
 * Estômago, duodeno e intestinos.
 *
 * O tubo digestório é um cano de nove metros embrulhado em peritônio, e quase
 * toda a clínica abdominal se explica por três perguntas: o segmento é intra ou
 * retroperitoneal, de que artéria ele vive, e qual dermátomo ele usa para doer.
 * As fichas desta seção respondem sempre essas três, porque são elas que
 * transformam "dor abdominal" em diagnóstico.
 */
export const DIGESTORIO_TUBO: EntradaDicionario[] = [
  /* ─────────────────── Estômago ─────────────────── */
  {
    termos: ['Cárdia'],
    classe: 'viscera',
    resumo: 'Região do estômago em torno do óstio cárdico, onde o esôfago desemboca.',
    localizacao: 'À esquerda da linha média, ao nível de T11, cerca de 2 a 3 cm abaixo do hiato esofágico.',
    funcao:
      'Não tem esfíncter anatômico próprio: a competência do esfíncter esofágico inferior vem de quatro fatores anatômicos — a musculatura circular do esôfago distal, a pinça diafragmática, o ângulo de His e o segmento intra-abdominal do esôfago, que a pressão positiva do abdome mantém fechado.',
    vascularizacao: 'Ramos cárdicos da artéria gástrica esquerda.',
    inervacao: 'Troncos vagais anterior e posterior; simpático pelo plexo celíaco.',
    relacoes: 'A junção esofagogástrica é a linha Z, transição do epitélio escamoso para o colunar.',
    clinica:
      'A perda desses fatores — hérnia de hiato, obesidade, aumento da pressão abdominal — produz a doença do refluxo. Na linha Z ocorre a metaplasia intestinal do esôfago de Barrett, lesão precursora do adenocarcinoma. E é da cárdia que partem as varizes gastroesofágicas na hipertensão portal, drenadas pela veia gástrica esquerda — a anastomose portossistêmica mais perigosa do corpo.',
    memoria:
      'Não existe um músculo chamado "esfíncter esofágico inferior": existe uma geometria. Perdeu a geometria, veio o refluxo.',
    pontos: [
      'Que fatores anatômicos compõem o esfíncter esofágico inferior?',
      'O que é a linha Z e que lesão surge nela?',
      'Que veia drena a cárdia e por que isso importa?',
    ],
  },
  {
    termos: ['Incisura Cárdica'],
    classe: 'viscera',
    resumo: 'Ângulo agudo entre o esôfago abdominal e o fundo gástrico — o ângulo de His.',
    localizacao: 'Na junção esofagogástrica, entre a borda esquerda do esôfago e a curvatura maior do estômago.',
    funcao:
      'O ângulo agudo funciona como válvula de retalho: quando o fundo gástrico se distende, ele pressiona a parede esofágica e a fecha. Quanto mais cheio o estômago, mais eficiente o mecanismo.',
    vascularizacao:
      'Ramos cárdicos da artéria gástrica esquerda e as primeiras artérias gástricas curtas, da esplênica. A drenagem venosa é o dado que importa: aqui as veias gástricas curtas e a gástrica esquerda, do sistema porta, anastomosam-se com as esofágicas, do sistema ázigo — e é essa junção que vira variz na hipertensão portal.',
    inervacao:
      'Tronco vagal anterior (vago esquerdo), que desce sobre a face anterior do esôfago e cruza justamente esta incisura. Simpático de T6 a T9 pelo nervo esplâncnico maior, trazendo as aferentes de dor ao epigástrio.',
    relacoes: 'A prega mucosa correspondente, por dentro, é a válvula de Gubaroff.',
    clinica:
      'É esse ângulo que a fundoplicatura de Nissen restaura, e não uma "cinta" apertada: envolve-se o fundo em torno do esôfago para recriar a válvula. O achatamento do ângulo de His é o mecanismo comum a obesos, gestantes e portadores de hérnia de hiato — três populações com refluxo pela mesma razão geométrica.',
    memoria:
      'Ângulo de His é uma válvula de tecido, como a de uma câmara de ar. Estômago cheio aperta a própria porta.',
    pontos: [
      'O que é o ângulo de His e como ele funciona?',
      'Que cirurgia procura restaurá-lo?',
      'Em que situações ele se achata?',
    ],
  },
  {
    termos: ['Fundo'],
    classe: 'viscera',
    sistemas: ['digestorio'],
    resumo: 'Porção mais alta do estômago, acima do nível da cárdia, normalmente ocupada por gás.',
    localizacao: 'Sob a cúpula diafragmática esquerda, em contato com o baço; corresponde ao espaço de Traube na percussão.',
    funcao:
      'Armazena o alimento e acomoda a distensão por relaxamento receptivo, mediado pelo vago — o estômago aumenta de volume sem aumentar a pressão, o que permite comer mais de um litro sem desconforto.',
    inervacao:
      'Tronco vagal anterior e posterior, cujos ramos gástricos comandam a secreção ácida e o relaxamento receptivo — a acomodação do fundo ao alimento, que é reflexo vagovagal puro. Simpático de T6 a T9, com as aferentes de dor que referem ao epigástrio.',
    vascularizacao: 'Artérias gástricas curtas, ramos da esplênica, no ligamento gastroesplênico.',
    relacoes: 'Acima está o diafragma; à esquerda, o baço.',
    clinica:
      'A bolha gástrica no fundo é o que define o espaço de Traube, timpânico à percussão — e seu apagamento sugere esplenomegalia ou derrame pleural esquerdo. A vagotomia abole o relaxamento receptivo e causa saciedade precoce e plenitude, efeito colateral que explicou décadas de queixas pós-operatórias. E é o fundo que se usa na fundoplicatura e na gastrectomia vertical.',
    memoria:
      'O fundo do estômago fica em cima — é "fundo" em relação à cárdia, não em relação ao chão. Nele mora a bolha de ar.',
    pontos: [
      'O que é o relaxamento receptivo e quem o media?',
      'O que é o espaço de Traube?',
      'Que artérias irrigam o fundo gástrico?',
    ],
  },
  {
    termos: ['Corpo'],
    classe: 'viscera',
    sistemas: ['digestorio'],
    resumo: 'Maior porção do estômago, entre o fundo e a incisura angular, onde ficam as glândulas oxínticas.',
    localizacao: 'Entre o fundo, acima, e a parte pilórica, abaixo, delimitado pelas curvaturas maior e menor.',
    funcao:
      'Abriga as glândulas gástricas próprias, com células parietais (ácido clorídrico e fator intrínseco) e principais (pepsinogênio). É onde o alimento é misturado e acidificado.',
    vascularizacao: 'Gástrica esquerda e direita na curvatura menor; gastromentais na maior.',
    inervacao: 'Vago, cujos ramos gástricos estimulam a secreção ácida.',
    clinica:
      'A destruição autoimune das células parietais do corpo produz gastrite atrófica, com acloridria e deficiência de vitamina B12 — a anemia perniciosa, que é uma doença hematológica de causa anatômica. Já a úlcera de corpo gástrico, ao contrário da duodenal, cursa com secreção ácida normal ou baixa e sempre exige biópsia, pelo risco de neoplasia.',
    memoria:
      'Célula parietal faz ácido e fator intrínseco. Perdeu as células, perdeu os dois: acloridria e anemia perniciosa juntas.',
    pontos: [
      'Que células existem nas glândulas do corpo gástrico?',
      'O que causa a anemia perniciosa?',
      'Por que a úlcera gástrica exige biópsia?',
    ],
  },
  {
    termos: ['Curvatura Menor'],
    classe: 'viscera',
    resumo: 'Borda direita e côncava do estômago, da cárdia ao piloro, onde se fixa o omento menor.',
    localizacao: 'Borda superior direita do estômago, com a incisura angular no seu ponto mais baixo.',
    funcao: 'Recebe a inserção do omento menor (ligamentos hepatogástrico e hepatoduodenal) e é percorrida pelas artérias gástricas direita e esquerda.',
    vascularizacao: 'Arco arterial da curvatura menor, formado pelas gástricas esquerda e direita.',
    inervacao: 'Os troncos vagais correm ao longo dela; o ramo hepático e o "nervo criminoso de Grassi" partem daqui.',
    clinica:
      'É a região de maior incidência da úlcera gástrica e do adenocarcinoma, e a que drena para os linfonodos gástricos esquerdos, o primeiro escalão do estadiamento. O nervo de Grassi, ramo vagal que se desprende alto e frequentemente escapa na vagotomia, é a causa clássica de recidiva ulcerosa pós-operatória — um nervo com nome de criminoso por ter sido "culpado" por tantas recidivas.',
    memoria:
      'Úlcera gástrica gosta da curvatura menor; úlcera duodenal, do bulbo. Duas doenças, dois endereços.',
    pontos: [
      'Que estruturas se fixam na curvatura menor?',
      'Que artérias a percorrem?',
      'O que é o nervo criminoso de Grassi?',
    ],
  },
  {
    termos: ['Curvatura Maior'],
    classe: 'viscera',
    resumo: 'Borda esquerda e convexa do estômago, da incisura cárdica ao piloro, de onde pende o omento maior.',
    localizacao: 'Borda inferior esquerda do estômago, quatro a cinco vezes mais longa que a menor.',
    funcao: 'Dá origem ao omento maior e recebe o ligamento gastroesplênico; é percorrida pelo arco das artérias gastromentais.',
    inervacao:
      'Ramos gástricos dos troncos vagais e simpático de T6 a T9. As aferentes de distensão sobem pelo vago e produzem a sensação de saciedade — o alvo funcional da gastrectomia vertical, que retira justamente a curvatura maior.',
    vascularizacao: 'Artérias gastromentais direita (da gastroduodenal) e esquerda (da esplênica), formando um arco a cerca de 1 cm da borda.',
    clinica:
      'A distância constante do arco à borda é o que permite as ligaduras seguras na gastrectomia e na confecção do tubo gástrico para esofagoplastia — em que a sobrevida do tubo depende inteiramente da preservação da gastromental direita. Na gastrectomia vertical para obesidade, é ao longo da curvatura maior que o estômago é seccionado.',
    memoria:
      'Curvatura maior tem dois arcos arteriais e é de onde pende o "avental" do omento. É o lado "generoso" do estômago.',
    pontos: [
      'Que artérias formam o arco da curvatura maior?',
      'Que estruturas se fixam nela?',
      'Por que a gastromental direita é crítica na esofagoplastia?',
    ],
  },
  {
    termos: ['Incisura Angular'],
    classe: 'viscera',
    resumo: 'Ângulo agudo na curvatura menor que marca o limite entre o corpo e a parte pilórica.',
    localizacao: 'Ponto mais baixo da curvatura menor, visível tanto na peça quanto na endoscopia e na radiografia contrastada.',
    funcao: 'Marca a transição entre a mucosa oxíntica do corpo e a mucosa pilórica, produtora de gastrina.',
    vascularizacao:
      'Ramos da artéria gástrica esquerda, que desce pela curvatura menor, e da gástrica direita, que sobe ao seu encontro. As duas se anastomosam exatamente neste ponto, e é justamente numa zona de encontro arterial que a irrigação é mais precária.',
    inervacao:
      'Ramos gástricos dos troncos vagais e simpático de T6 a T9 pelo esplâncnico maior. A dor da úlcera daqui é epigástrica e mal localizada, porque chega à medula pelo simpático e não pelo peritônio parietal — até que perfure.',
    relacoes: 'É um dos pontos de referência obrigatórios da endoscopia digestiva alta.',
    clinica:
      'É a fronteira histológica que se desloca proximalmente na gastrite atrófica — e o mapeamento de biópsias do protocolo de Sydney inclui obrigatoriamente a incisura, porque é ali que a metaplasia intestinal aparece primeiro. Na endoscopia, é a referência para descrever a localização de lesões com precisão reprodutível.',
    memoria:
      'A incisura angular é a "dobra" que separa o estômago que faz ácido do estômago que faz gastrina.',
    pontos: [
      'Que regiões a incisura angular separa?',
      'Que transição histológica ocorre nela?',
      'Por que ela é obrigatória no protocolo de biópsias gástricas?',
    ],
  },
  {
    termos: ['Parte Pilórica'],
    classe: 'viscera',
    resumo: 'Porção distal do estômago, formada pelo antro e pelo canal pilórico.',
    localizacao: 'Da incisura angular ao piloro, à direita da linha média, ao nível de L1.',
    funcao:
      'Sua mucosa contém as células G, produtoras de gastrina, e as células D, produtoras de somatostatina. A musculatura antral tritura o alimento e o impulsiona em jatos ao duodeno.',
    inervacao:
      'Ramos gástricos dos troncos vagais, que comandam o esvaziamento; o simpático de T6 a T9 o inibe. Entre as camadas musculares está o plexo mientérico de Auerbach, cuja ausência congênita das células ganglionares não ocorre aqui, mas cuja hipertrofia muscular produz a estenose hipertrófica do piloro do lactente.',
    vascularizacao: 'Artérias gástrica direita e gastromental direita.',
    clinica:
      'É a região colonizada pelo Helicobacter pylori na gastrite antral, que aumenta a gastrina, eleva a secreção ácida e leva à úlcera duodenal. A antrectomia funcionava justamente por remover as células G. E o adenocarcinoma antral estenosante produz a síndrome de obstrução pilórica, com vômitos de alimento não digerido e alcalose metabólica hipoclorêmica e hipocalêmica.',
    memoria:
      'Antro faz gastrina; corpo faz ácido. H. pylori no antro aumenta a gastrina e a úlcera aparece no duodeno.',
    pontos: [
      'Que células endócrinas existem na mucosa pilórica?',
      'Como a gastrite antral leva à úlcera duodenal?',
      'Que distúrbio metabólico a obstrução pilórica causa?',
    ],
  },
  {
    termos: ['Piloro'],
    classe: 'viscera',
    resumo: 'Esfíncter muscular verdadeiro que controla o esvaziamento gástrico para o duodeno.',
    localizacao: 'Junção gastroduodenal, ao nível de L1, no plano transpilórico; palpável como um anel espesso.',
    funcao:
      'É um espessamento real da camada circular — ao contrário do "esfíncter" da cárdia. Deixa passar apenas partículas menores que 2 mm, retendo o restante para nova trituração, e regula a velocidade de esvaziamento conforme a osmolaridade e o conteúdo lipídico do quimo.',
    inervacao:
      'Vago para o relaxamento coordenado e simpático de T6 a T9 para a contração; o marca-passo real, porém, é intrínseco — as células intersticiais de Cajal do plexo mientérico, cuja perda produz gastroparesia mesmo com os nervos íntegros.',
    vascularizacao: 'Artérias gástrica direita e gastroduodenal; a veia pré-pilórica de Mayo o marca externamente.',
    clinica:
      'Sua hipertrofia no lactente é a estenose hipertrófica do piloro: vômitos em jato não biliosos entre a 3ª e a 6ª semana, oliva palpável no quadrante superior direito, ondas peristálticas visíveis e alcalose metabólica hipoclorêmica. O tratamento é a piloromiotomia — corta-se o músculo e preserva-se a mucosa. A veia de Mayo é a referência que marca a linha da incisão.',
    memoria:
      'Vômito em jato sem bile em bebê de um mês: piloro. Sem bile porque a obstrução está antes da papila duodenal.',
    pontos: [
      'Por que o piloro é um esfíncter verdadeiro?',
      'Que tamanho de partícula ele deixa passar?',
      'Como se apresenta a estenose hipertrófica do piloro?',
    ],
  },
  {
    termos: ['Pregas Gástricas'],
    classe: 'viscera',
    resumo: 'Rugas longitudinais da mucosa gástrica, que desaparecem com a distensão.',
    localizacao: 'Mucosa do corpo e do fundo, mais evidentes ao longo da curvatura menor, onde formam a "estrada gástrica".',
    funcao:
      'Permitem que o estômago passe de 50 mL vazios a mais de 1 litro cheio sem que a mucosa se rompa. A estrada gástrica, ao longo da curvatura menor, é um canal por onde os líquidos escoam rapidamente ao duodeno.',
    vascularizacao:
      'Plexo submucoso alimentado pelos ramos das quatro artérias gástricas, com anastomoses densas dentro da própria parede. É essa rede submucosa que sangra na úlcera e a razão de a hemostasia endoscópica precisar atingir o vaso, e não apenas a mucosa.',
    inervacao:
      'Plexo submucoso de Meissner, que comanda a secreção e o fluxo sanguíneo local, sob modulação vagal. As pregas se apagam quando o estômago distende, e uma prega que não se apaga à insuflação é sinal endoscópico de infiltração tumoral — a linite plástica.',
    relacoes: 'São formadas por mucosa e submucosa, não por músculo.',
    clinica:
      'Pregas gástricas espessadas e que não se apagam à insuflação na endoscopia são sinal de alarme: linite plástica (adenocarcinoma difuso infiltrativo), linfoma MALT ou doença de Ménétrier. É um daqueles achados em que o comportamento da anatomia à manobra — e não sua aparência estática — faz o diagnóstico.',
    memoria:
      'Prega que some quando você insufla é normal. Prega que resiste ao ar é doença infiltrando a parede.',
    pontos: [
      'Que camadas formam as pregas gástricas?',
      'O que é a estrada gástrica?',
      'Que doenças produzem pregas espessadas e rígidas?',
    ],
  },
  /* ─────────────────── Duodeno ─────────────────── */
  {
    termos: ['Parte Superior do Duodeno', 'Parte Superior'],
    classe: 'viscera',
    sistemas: ['digestorio'],
    resumo: 'Primeira porção do duodeno, cujos primeiros 2 cm — o bulbo — são intraperitoneais e lisos.',
    localizacao: 'De L1 até o colo da vesícula biliar, dirigindo-se para a direita, para cima e para trás.',
    funcao:
      'O bulbo duodenal é a única parte do duodeno sem pregas circulares e a única móvel; o restante é retroperitoneal e fixo.',
    inervacao:
      'Vago e simpático de T5 a T9 pelo esplâncnico maior — inervação de intestino anterior. A dor refere ao epigástrio, e é essa a dor clássica da úlcera duodenal, que alivia ao comer e volta duas a três horas depois.',
    vascularizacao: 'Artéria gastroduodenal e supraduodenal, do tronco celíaco.',
    relacoes: 'A artéria gastroduodenal corre imediatamente atrás da parede posterior do bulbo.',
    clinica:
      'Essa relação é a mais dramática do abdome: a úlcera da parede posterior do bulbo erode a gastroduodenal e produz hemorragia digestiva alta maciça, enquanto a úlcera da parede anterior perfura para a cavidade peritoneal, com pneumoperitônio e abdome em tábua. Parede posterior sangra, parede anterior perfura — uma frase que resume duas emergências opostas.',
    memoria:
      'Bulbo: atrás tem artéria, na frente tem cavidade. Úlcera de trás sangra, úlcera da frente fura.',
    pontos: [
      'O que caracteriza o bulbo duodenal?',
      'Que artéria corre atrás dele?',
      'Que complicações diferem entre as paredes anterior e posterior?',
    ],
  },
  {
    termos: ['Parte Descendente do Duodeno', 'Parte Descendente (Pregas Circulares)'],
    classe: 'viscera',
    resumo: 'Segunda porção do duodeno, retroperitoneal, onde desembocam os ductos colédoco e pancreático.',
    localizacao: 'Desce à direita da coluna, de L1 a L3, à frente do hilo renal direito e atrás do colo transverso.',
    funcao: 'Recebe a bile e o suco pancreático pela papila duodenal maior, a cerca de 8 a 10 cm do piloro.',
    inervacao:
      'Território de transição: acima da papila maior é intestino anterior, com dor referida ao epigástrio; abaixo dela é intestino médio, com dor periumbilical. A papila é a fronteira embriológica, e o paciente muda de queixa conforme o lado em que a doença está.',
    vascularizacao: 'Artérias pancreaticoduodenais superior (do tronco celíaco) e inferior (da mesentérica superior) — a fronteira entre os intestinos anterior e médio.',
    relacoes: 'A raiz do mesocolo transverso cruza sua face anterior.',
    clinica:
      'Essa dupla irrigação marca a transição embriológica e explica por que o duodeno é o único segmento intestinal que raramente sofre isquemia: recebe sangue dos dois territórios. É também o segmento acessado na colangiopancreatografia endoscópica, e o local onde um divertículo periampular pode dificultar a canulação da papila.',
    memoria:
      'A papila do duodeno é a fronteira do intestino anterior e médio — e é por isso que ali chegam duas artérias diferentes.',
    pontos: [
      'Que ductos desembocam na parte descendente do duodeno?',
      'Que artérias a irrigam e por que são duas?',
      'Que estrutura cruza sua face anterior?',
    ],
  },
  {
    termos: ['Papila Maior do Duodeno'],
    classe: 'viscera',
    resumo: 'Elevação na parede posteromedial da segunda porção do duodeno, onde se abre a ampola hepatopancreática.',
    localizacao: 'Parede posteromedial da parte descendente, cerca de 8 a 10 cm do piloro, na extremidade da prega longitudinal.',
    funcao:
      'Recebe a ampola de Vater, confluência do ducto colédoco com o ducto pancreático principal, controlada pelo esfíncter de Oddi.',
    vascularizacao:
      'Arcada pancreatoduodenal, formada pelas artérias pancreatoduodenais superior (da gastroduodenal) e inferior (da mesentérica superior). É por essa vizinhança arterial que a papilotomia endoscópica pode sangrar de forma volumosa e exigir hemostasia imediata.',
    inervacao: 'Plexo celíaco; a distensão da via biliar dói em epigástrio e hipocôndrio direito.',
    relacoes: 'A papila menor, cerca de 2 cm acima, recebe o ducto pancreático acessório.',
    clinica:
      'É a encruzilhada onde um único cálculo impactado produz três doenças: colestase com icterícia, colangite ascendente e pancreatite biliar. É também onde se realiza a papilotomia endoscópica. E o tumor periampular — do pâncreas, da papila, do colédoco ou do duodeno — produz a icterícia progressiva e indolor com vesícula palpável: o sinal de Courvoisier, que aponta obstrução maligna e não cálculo.',
    memoria:
      'Icterícia indolor com vesícula palpável não é pedra: é tumor. Pedra faz vesícula fibrosada, que não distende.',
    pontos: [
      'Que ductos convergem na papila maior?',
      'Que três doenças um cálculo impactado ali pode causar?',
      'O que é o sinal de Courvoisier?',
    ],
  },
  {
    termos: ['Parte Horizontal do Duodeno'],
    classe: 'viscera',
    resumo: 'Terceira porção do duodeno, que cruza a linha média sob os vasos mesentéricos superiores.',
    localizacao: 'Ao nível de L3, cruzando da direita para a esquerda, à frente da aorta e da veia cava inferior.',
    funcao: 'Conduz o quimo para a quarta porção; é retroperitoneal e fixa.',
    vascularizacao:
      'Artérias pancreatoduodenais inferiores, ramos da mesentérica superior — já território de intestino médio. A arcada que elas formam com as pancreatoduodenais superiores, da gastroduodenal, é uma das anastomoses mais importantes do abdome: liga o tronco celíaco à mesentérica superior e mantém o fígado perfundido quando um dos dois se oclui.',
    inervacao: 'Vago e simpático de T10, pelo esplâncnico menor. Dor referida à região periumbilical.',
    relacoes: 'Passa na pinça formada pela aorta, atrás, e pela artéria mesentérica superior, à frente, com a raiz do mesentério.',
    clinica:
      'Quando o ângulo entre a aorta e a mesentérica superior se estreita — por perda importante de peso, que consome o coxim gorduroso —, o duodeno é comprimido: é a síndrome da artéria mesentérica superior, com vômitos biliosos e saciedade precoce que melhoram em decúbito ventral ou lateral esquerdo. Também é o segmento mais lesado no trauma abdominal fechado por compressão contra a coluna, com hematoma duodenal e obstrução.',
    memoria:
      'O duodeno passa numa pinça entre a aorta e a mesentérica superior. Emagreceu demais, a pinça fecha.',
    pontos: [
      'Que estruturas comprimem a terceira porção do duodeno?',
      'O que é a síndrome da artéria mesentérica superior?',
      'Por que essa porção é vulnerável no trauma fechado?',
    ],
  },
  {
    termos: ['Parte Ascendente do Duodeno'],
    classe: 'viscera',
    resumo: 'Quarta porção do duodeno, que sobe à esquerda da aorta até a flexura duodenojejunal.',
    localizacao: 'De L3 a L2, à esquerda da aorta, terminando na flexura duodenojejunal, fixada pelo ligamento de Treitz.',
    funcao: 'Faz a transição para o jejuno; o ligamento suspensor do duodeno (músculo de Treitz) a ancora ao pilar direito do diafragma.',
    vascularizacao:
      'Ramos das artérias pancreatoduodenal inferior e da primeira jejunal, ambas da mesentérica superior. O ângulo duodenojejunal é sustentado pelo ligamento de Treitz, que contém fibras musculares lisas e é a referência que separa hemorragia digestiva alta de baixa.',
    inervacao:
      'Vago e simpático de T10. É o último segmento retroperitoneal do duodeno: perfurações aqui produzem ar retroperitoneal e dor lombar, e não abdome em tábua.',
    relacoes: 'O ligamento de Treitz contém fibras musculares lisas e esqueléticas.',
    clinica:
      'O ligamento de Treitz é a fronteira que define hemorragia digestiva: acima dele, alta, com hematêmese e melena; abaixo, baixa, com hematoquezia. É também o marco da má rotação intestinal — uma flexura duodenojejunal à direita da linha média, na radiografia contrastada, indica má rotação e risco de volvo de intestino médio, emergência cirúrgica do lactente com vômito bilioso.',
    memoria:
      'Treitz é a linha divisória da hemorragia digestiva. Acima é alta, abaixo é baixa — e todo o resto decorre disso.',
    pontos: [
      'O que é o ligamento de Treitz?',
      'Que fronteira clínica ele define?',
      'Que malformação sua posição anômala indica?',
    ],
  },
  {
    termos: ['Pregas Circulares'],
    classe: 'viscera',
    resumo: 'Pregas permanentes de mucosa e submucosa do intestino delgado, que multiplicam a área absortiva.',
    localizacao: 'Abundantes no duodeno distal e no jejuno, escassas no íleo distal.',
    funcao:
      'Não se apagam com a distensão, ao contrário das pregas gástricas. Com as vilosidades e as microvilosidades, ampliam a área de absorção do delgado de cerca de 0,4 m² para mais de 200 m² — o fator de amplificação é de cerca de 500 vezes.',
    vascularizacao:
      'Vasos retos que partem das arcadas mesentéricas, penetram a parede e formam o plexo submucoso; cada prega leva no seu eixo uma alça vascular própria. É essa vascularização terminal que faz o intestino delgado tolerar tão mal a isquemia — a necrose da mucosa começa em minutos.',
    inervacao:
      'Plexo submucoso de Meissner, que regula secreção e fluxo local. As pregas são mais altas e mais numerosas no jejuno e vão rareando até desaparecer no íleo distal — o critério que distingue os dois no exame contrastado e na cirurgia.',
    relacoes: 'São mais altas e mais numerosas no jejuno, o que permite distingui-lo do íleo na radiologia e na cirurgia.',
    clinica:
      'A diferença de densidade entre jejuno e íleo é o que permite ao radiologista dizer qual alça está obstruída: alças dilatadas com pregas finas e numerosas ("em pilha de moedas") são jejunais; alças lisas são ileais. Na doença celíaca, o apagamento dessas pregas no jejuno é achado de imagem e de endoscopia.',
    memoria:
      'Jejuno é enrugado e grosso; íleo é liso e fino. Na radiografia, a alça com "moedas empilhadas" é jejuno.',
    pontos: [
      'Qual a diferença entre pregas circulares e pregas gástricas?',
      'Quanto elas amplificam a área absortiva?',
      'Como distinguir jejuno de íleo pelas pregas?',
    ],
  },
  /* ─────────────────── Delgado, mesentério e omentos ─────────────────── */
  {
    termos: ['Jejuno', 'Intestino Delgado (Jejuno)'],
    classe: 'viscera',
    resumo: 'Dois quintos proximais do delgado móvel, sede principal da absorção.',
    localizacao: 'Predominantemente no quadrante superior esquerdo; parede espessa, luz ampla, vasos retos longos e poucas arcadas.',
    funcao: 'Absorve a maior parte dos nutrientes — carboidratos, aminoácidos, lipídios, ferro e cálcio.',
    inervacao:
      'Parassimpático do vago, que aumenta motilidade e secreção, e simpático de T9 a T10 pelos esplâncnicos maior e menor, que as inibem e contraem os vasos. As aferentes de dor sobem com o simpático até T10 — motivo de a dor jejunal ser periumbilical, difusa e em cólica.',
    vascularizacao: 'Artérias jejunais da mesentérica superior, com uma ou duas arcadas e vasos retos longos.',
    relacoes: 'O mesentério do jejuno é menos gorduroso, o que deixa os vasos visíveis por transparência.',
    clinica:
      'A diferença de arcadas e de vasos retos é o que o cirurgião usa para identificar jejuno e íleo em plena laparotomia, sem precisar seguir a alça inteira — e é o que decide qual segmento usar em uma anastomose. Na doença celíaca, é o jejuno proximal que atrofia, e por isso a deficiência de ferro e de cálcio precede a de vitamina B12.',
    memoria:
      'Jejuno: poucas arcadas, vasos retos longos, parede grossa. Íleo: muitas arcadas, vasos curtos, parede fina.',
    pontos: [
      'Como se distingue jejuno de íleo na cirurgia?',
      'Que nutrientes o jejuno absorve preferencialmente?',
      'Por que a celíaca causa anemia ferropriva antes de deficiência de B12?',
    ],
  },
  {
    termos: ['Intestino Delgado (Íleo)', 'Alça de Intestino Delgado'],
    classe: 'viscera',
    resumo: 'Três quintos distais do delgado móvel, com muitas arcadas vasculares e placas de Peyer.',
    localizacao: 'Predominantemente no quadrante inferior direito e na pelve; parede fina, luz estreita, mesentério gorduroso.',
    funcao:
      'Absorve especificamente a vitamina B12 (com o fator intrínseco) e os sais biliares, no íleo terminal — dois transportes que nenhum outro segmento realiza.',
    inervacao:
      'Vago e simpático de T9 a T11. A dor do íleo é periumbilical enquanto é visceral — e é esse o primeiro tempo da apendicite, antes de a inflamação alcançar o peritônio parietal e a dor migrar para a fossa ilíaca direita.',
    vascularizacao: 'Artérias ileais da mesentérica superior, com três a cinco arcadas e vasos retos curtos.',
    relacoes: 'As placas de Peyer, agregados linfoides na borda antimesentérica, são mais numerosas no íleo distal.',
    clinica:
      'A especificidade do íleo terminal é a razão de sua ressecção ou de sua inflamação — na doença de Crohn — produzir deficiência de B12 e diarreia por má absorção de sais biliares, tratada com colestiramina. As placas de Peyer são o sítio de invasão da Salmonella typhi e o ponto de partida da intussuscepção ileocólica na criança.',
    memoria:
      'Só o íleo terminal absorve B12 e sais biliares. Tirou o íleo terminal, o paciente precisa de B12 injetável para sempre.',
    pontos: [
      'Que substâncias só o íleo terminal absorve?',
      'O que são as placas de Peyer?',
      'Que consequências tem a ressecção do íleo terminal?',
    ],
  },
  {
    termos: ['Mesentério'],
    classe: 'serosa',
    resumo: 'Prega peritoneal em leque que suspende o jejuno e o íleo à parede posterior.',
    localizacao:
      'Raiz de cerca de 15 cm, oblíqua da flexura duodenojejunal (à esquerda de L2) até a junção ileocecal (fossa ilíaca direita); borda livre de cerca de 6 metros.',
    funcao: 'Conduz os vasos mesentéricos superiores, os linfáticos e os nervos, e permite a mobilidade das alças.',
    inervacao:
      'Suas duas folhas são peritônio visceral e não doem, mas entre elas correm os nervos autonômicos e as aferentes viscerais que acompanham os vasos mesentéricos. A tração do mesentério, essa sim, é percebida — é a razão de a manipulação de alças provocar náusea e bradicardia no paciente sob raquianestesia.',
    relacoes: 'Sua raiz cruza a terceira porção do duodeno, a aorta, a veia cava inferior, o ureter direito e o psoas.',
    clinica:
      'A desproporção entre uma raiz curta e uma borda longa é o que torna o volvo possível: as alças giram em torno do eixo mesentérico e estrangulam os vasos. Quando a fixação embrionária falha — má rotação —, a raiz fica ainda mais estreita e o volvo de intestino médio se torna a emergência mais temida do lactente. Vômito bilioso no recém-nascido é volvo até prova em contrário.',
    memoria:
      'Seis metros de intestino pendurados numa raiz de quinze centímetros. É um pêndulo esperando para torcer.',
    pontos: [
      'Qual o trajeto da raiz do mesentério?',
      'Que estruturas ela cruza?',
      'Por que a desproporção raiz-borda permite o volvo?',
    ],
  },
  {
    termos: ['Omento Maior', 'Omento Maior (rebatido)'],
    classe: 'serosa',
    resumo: 'Avental de quatro folhetos peritoneais que pende da curvatura maior sobre as vísceras abdominais.',
    localizacao: 'Da curvatura maior do estômago, desce à frente das alças e volta para cima, fundindo-se ao colo transverso.',
    funcao:
      'Rico em gordura, vasos e macrófagos, é imunologicamente ativo e capaz de migrar para focos inflamatórios, aderindo-se a eles e bloqueando a disseminação.',
    inervacao:
      'Peritônio visceral: apenas fibras autonômicas, sem sensibilidade somática. O omento não dói — e é exatamente por isso que ele consegue envolver um foco inflamatório e isolá-lo sem que o paciente sinta, formando o bloqueio que transforma uma perfuração em abscesso localizado em vez de peritonite difusa.',
    vascularizacao: 'Artérias gastromentais direita e esquerda e seus ramos omentais.',
    clinica:
      'Essa capacidade de migrar é o que o consagrou como "polícia do abdome": ele bloqueia perfurações e abscessos, e é o que forma o plastrão apendicular. Cirurgicamente, é usado como retalho vascularizado para cobrir anastomoses e feridas esternais. Do outro lado, é o sítio preferencial da carcinomatose peritoneal — o "omental cake" da tomografia, achado que indica doença avançada de ovário ou de estômago.',
    memoria:
      'O omento é o guarda do abdome: ele corre para o problema e o embrulha. Mas também é onde o tumor se espalha.',
    pontos: [
      'Quantos folhetos peritoneais formam o omento maior?',
      'Por que ele é chamado de polícia do abdome?',
      'O que é o omental cake?',
    ],
  },
  {
    termos: ['Peritônio Parietal'],
    classe: 'serosa',
    resumo: 'Folheto do peritônio que reveste a parede abdominal, ricamente inervado e sensível à dor somática.',
    localizacao: 'Reveste a face interna da parede abdominal, o diafragma e a pelve.',
    funcao:
      'É inervado pelos mesmos nervos somáticos da parede que reveste — intercostais, subcostal e primeiros lombares —, e por isso a dor que ele produz é bem localizada, aguda e agravada pelo movimento.',
    inervacao:
      'Nervos somáticos, e aqui está a diferença que organiza todo o abdome agudo: nervos intercostais inferiores, subcostal e primeiro lombar na parede; nervo frênico (C3–C5) na porção central diafragmática, que refere ao ombro; nervo obturatório na pelve. Dói de forma precisa, localizada, e piora ao movimento — o oposto do peritônio visceral.',
    relacoes: 'O peritônio visceral, ao contrário, é inervado por fibras autonômicas e produz dor vaga e mal localizada.',
    clinica:
      'Essa diferença explica a migração da dor na apendicite: começa periumbilical, vaga, por estímulo visceral referido em T10; quando a inflamação alcança o peritônio parietal da fossa ilíaca direita, a dor se localiza no ponto de McBurney e aparecem a descompressão dolorosa e a defesa. É a mesma anatomia por trás de todo abdome agudo inflamatório.',
    memoria:
      'Dor visceral é vaga e no meio; dor parietal é fina e no lugar exato. A migração da dor é a inflamação chegando à parede.',
    pontos: [
      'Como o peritônio parietal é inervado?',
      'Como sua dor difere da dor visceral?',
      'Como isso explica a migração da dor na apendicite?',
    ],
  },
  {
    termos: ['Mesocolo Transverso'],
    classe: 'serosa',
    resumo: 'Prega peritoneal que suspende o colo transverso e divide a cavidade abdominal em dois andares.',
    localizacao: 'Da parede posterior — cruzando a segunda porção do duodeno, a cabeça e o corpo do pâncreas — até o colo transverso.',
    funcao: 'Conduz a artéria cólica média e delimita o compartimento supramesocólico do inframesocólico.',
    vascularizacao:
      'Artéria cólica média, ramo da mesentérica superior, que sobe pela sua raiz. A drenagem é pela veia cólica média para a mesentérica superior e daí para a porta. Sua raiz cruza a cabeça do pâncreas e a parte descendente do duodeno.',
    inervacao:
      'Peritônio visceral, sem dor somática; entre suas folhas correm os plexos autonômicos que acompanham a cólica média. É a divisória que separa o andar supramesocólico do inframesocólico — e a fronteira que define para onde um abscesso vai escorrer.',
    relacoes: 'Sua raiz é a referência que separa o andar superior (fígado, estômago, baço) do inferior (delgado, colo).',
    clinica:
      'Essa divisão organiza a disseminação de coleções e a topografia dos abscessos intra-abdominais: um abscesso subfrênico é supramesocólico, um abscesso pélvico é inframesocólico, e o fluxo entre eles se faz pelas goteiras paracólicas. Na cirurgia gástrica, é através do mesocolo transverso que se faz a gastrojejunostomia retrocólica.',
    memoria:
      'Uma prateleira atravessando o abdome: em cima, os órgãos do estômago para cima; embaixo, os intestinos.',
    pontos: [
      'Que compartimentos o mesocolo transverso separa?',
      'Que artéria ele conduz?',
      'Que estruturas sua raiz cruza?',
    ],
  },
  {
    termos: ['Veia Mesentérica Superior'],
    classe: 'veia',
    resumo: 'Veia que drena o intestino delgado e o colo direito e forma, com a esplênica, a veia porta.',
    localizacao: 'À direita da artéria mesentérica superior, na raiz do mesentério; une-se à esplênica atrás do colo do pâncreas.',
    funcao: 'Drena todo o território da mesentérica superior; recebe as veias jejunais, ileais, ileocólica, cólica direita e gastromental direita.',
    relacoes: 'Sua posição à direita da artéria é constante e é o marco anatômico do território.',
    clinica:
      'A inversão dessa relação — veia à esquerda da artéria, o "sinal do redemoinho" — é o achado tomográfico da má rotação intestinal, e sua identificação em um lactente com vômito bilioso indica cirurgia imediata. O contato do tumor com a veia mesentérica superior é também o critério que define ressecabilidade no câncer de cabeça de pâncreas.',
    memoria:
      'Veia à direita da artéria é normal. Trocaram de lado? Má rotação — e o volvo pode estar a caminho.',
    pontos: [
      'Que territórios a veia mesentérica superior drena?',
      'Qual sua relação normal com a artéria?',
      'O que a inversão dessa relação indica?',
    ],
  },
  {
    termos: ['Estômago (rebatido)'],
    classe: 'viscera',
    resumo: 'Estômago afastado na dissecção, expondo a bolsa omental e o pâncreas.',
    localizacao: 'Rebatido para cima, revela a parede posterior da bolsa omental e o leito gástrico.',
    funcao: 'A manobra expõe o leito gástrico: pâncreas, rim e suprarrenal esquerdos, baço, diafragma e artéria esplênica.',
    vascularizacao:
      'Quatro artérias no total, duas em cada curvatura, todas do tronco celíaco: gástrica esquerda e gástrica direita na curvatura menor, gastromental esquerda e direita na maior, mais as gástricas curtas no fundo. Essa redundância é o que permite ligar três delas na gastrectomia e o estômago sobreviver com uma só.',
    inervacao:
      'Tronco vagal anterior, derivado do vago esquerdo, sobre a face anterior, e tronco vagal posterior, do vago direito, atrás — a rotação embrionária do estômago é que trocou esquerdo por anterior. O simpático vem de T6 a T9 pelo esplâncnico maior e traz a dor ao epigástrio.',
    relacoes: 'O acesso à bolsa omental se faz pelo forame omental (de Winslow), pelo omento menor ou pelo ligamento gastrocólico.',
    clinica:
      'A bolsa omental é onde se acumulam as coleções da pancreatite aguda, formando o pseudocisto pancreático — que se drena, justamente, por via transgástrica endoscópica, atravessando a parede posterior do estômago. O forame omental é o ponto da manobra de Pringle, em que se clampeia o pedículo hepático para controlar hemorragia do fígado.',
    memoria:
      'Atrás do estômago há um quarto escondido: a bolsa omental. É lá que a pancreatite acumula líquido.',
    pontos: [
      'Que estruturas formam o leito gástrico?',
      'Que vias dão acesso à bolsa omental?',
      'O que é a manobra de Pringle?',
    ],
  },
  /* ─────────────────── Intestino grosso ─────────────────── */
  {
    termos: ['Intestino Grosso (Colo Transverso)', 'Colo Transverso', 'Alça de Intestino Grosso (Colo Transverso)'],
    classe: 'viscera',
    resumo: 'Segmento mais longo e mais móvel do colo, suspenso pelo mesocolo transverso entre as duas flexuras.',
    localizacao: 'Da flexura cólica direita à esquerda, cruzando o abdome; a flexura esquerda é mais alta e mais aguda.',
    funcao: 'Absorve água e eletrólitos e armazena o conteúdo fecal; é onde as haustrações são mais evidentes.',
    inervacao:
      'Fronteira embriológica no meio do trajeto: os dois terços proximais são intestino médio, com vago e simpático de T10 a T11, e dor referida à região periumbilical; o terço distal é intestino posterior, com parassimpático dos nervos esplâncnicos pélvicos (S2–S4) e simpático de L1 a L2, e dor referida ao hipogástrio.',
    vascularizacao:
      'Artéria cólica média (mesentérica superior) nos dois terços proximais e cólica esquerda (mesentérica inferior) no terço distal — a fronteira entre intestino médio e posterior.',
    relacoes: 'A flexura esquerda é fixada ao diafragma pelo ligamento frenocólico.',
    clinica:
      'A transição entre os dois territórios arteriais cria o ponto de Griffith, uma zona de watershed próxima à flexura esquerda — o sítio mais frequente da colite isquêmica, que se apresenta com dor abdominal e sangramento em paciente idoso após hipotensão. É a mesma lógica das zonas de fronteira cerebrais, aplicada ao intestino.',
    memoria:
      'A flexura esquerda é a "esquina mal irrigada" do colo. É lá que a isquemia bate primeiro.',
    pontos: [
      'Que artérias irrigam o colo transverso?',
      'O que é o ponto de Griffith?',
      'Por que a colite isquêmica prefere essa região?',
    ],
  },
  {
    termos: ['Alça de Intestino Grosso (Colo Descendente)'],
    classe: 'viscera',
    resumo: 'Segmento retroperitoneal do colo, da flexura esquerda até a fossa ilíaca esquerda.',
    localizacao: 'Parede posterior esquerda do abdome, secundariamente retroperitoneal, à frente do rim esquerdo e do quadrado do lombo.',
    funcao: 'Conduz e armazena as fezes já formadas; sua luz é mais estreita que a do colo direito.',
    inervacao:
      'Intestino posterior: parassimpático dos nervos esplâncnicos pélvicos (S2–S4), e não do vago, e simpático de L1 a L2 pelos esplâncnicos lombares. A dor visceral refere ao hipogástrio, e é essa a diferença semiológica entre uma diverticulite esquerda e uma apendicite.',
    vascularizacao: 'Artéria cólica esquerda, ramo da mesentérica inferior.',
    relacoes: 'Está fixo à parede posterior pela fáscia de Toldt, plano avascular de dissecção.',
    clinica:
      'A luz mais estreita e as fezes já sólidas explicam por que o câncer de colo esquerdo se apresenta com obstrução e alteração do hábito intestinal, enquanto o de colo direito, com luz ampla e conteúdo líquido, se apresenta com anemia ferropriva e massa palpável. Duas apresentações opostas de uma mesma doença, definidas pela anatomia do calibre.',
    memoria:
      'Colo direito sangra e anemiza; colo esquerdo obstrui. Calibre e consistência decidem o sintoma.',
    pontos: [
      'Por que o colo descendente é retroperitoneal?',
      'Que artéria o irriga?',
      'Como diferem as apresentações do câncer de colo direito e esquerdo?',
    ],
  },
  {
    termos: ['Tênia do Colo'],
    classe: 'viscera',
    resumo: 'Três faixas longitudinais de musculatura lisa que percorrem o colo, do ceco ao reto.',
    localizacao: 'Tênia livre, tênia mesocólica e tênia omental, dispostas a 120° uma da outra.',
    funcao:
      'Concentram a camada muscular longitudinal em três faixas mais curtas que o próprio intestino, o que franze a parede e produz as haustrações.',
    vascularizacao:
      'Ramos dos vasos retos que vêm da artéria marginal de Drummond, correndo paralelos à borda mesentérica. Os vasos retos penetram a parede justamente ao lado das tênias, e é por isso que a dissecção junto à tênia sangra.',
    inervacao:
      'Plexo mientérico entre as camadas musculares. As tênias são a camada longitudinal condensada em três faixas, e sua contração tônica encurta o cólon e cria as saculações — anatomia que é, na verdade, uma função congelada em forma.',
    relacoes: 'Convergem na base do apêndice vermiforme e desaparecem no reto, onde a camada longitudinal volta a ser completa.',
    clinica:
      'A convergência na base do apêndice é a regra de ouro da apendicectomia: seguir a tênia livre a partir do ceco leva invariavelmente à base apendicular, mesmo quando o apêndice está retrocecal ou pélvico. É um dos raros truques anatômicos que funcionam em 100% dos casos e que resolvem a cirurgia mais comum da urgência.',
    memoria:
      'Perdeu o apêndice na cirurgia? Siga a tênia livre. Ela sempre termina na base dele.',
    pontos: [
      'Quantas tênias existem e como se dispõem?',
      'Como elas produzem as haustrações?',
      'Como elas ajudam a localizar o apêndice?',
    ],
  },
  {
    termos: ['Saculação do Colo', 'Saculação'],
    classe: 'viscera',
    resumo: 'Haustrações: dilatações saculares da parede do colo entre as pregas semilunares.',
    localizacao: 'Ao longo de todo o colo, desaparecendo no reto.',
    funcao: 'Resultam do encurtamento produzido pelas tênias e das contrações segmentares; aumentam o tempo de contato com a mucosa e favorecem a absorção de água.',
    vascularizacao:
      'Vasos retos curtos e longos da artéria marginal, que abraçam cada saculação lateralmente. Entre eles, na borda mesentérica, ficam os pontos de menor resistência da parede.',
    inervacao:
      'Plexo mientérico, que coordena as contrações segmentares responsáveis por moldar cada saculação. A pressão gerada nessas contrações é o que empurra a mucosa através dos pontos fracos — o mecanismo da doença diverticular.',
    relacoes: 'São separadas pelas pregas semilunares, que envolvem apenas parte da circunferência.',
    clinica:
      'São a marca radiográfica que distingue colo de delgado numa radiografia de abdome: as haustrações não cruzam toda a luz, enquanto as válvulas coniventes do delgado atravessam de lado a lado. Essa diferença de um segundo permite dizer se uma obstrução é alta ou baixa. Na colite, o apagamento das haustrações produz o "cano de chumbo" da retocolite crônica.',
    memoria:
      'Prega que atravessa a alça toda é delgado; prega que só entra um pouco é grosso. Uma olhada resolve.',
    pontos: [
      'Como as haustrações se formam?',
      'Como diferenciá-las das válvulas coniventes na radiografia?',
      'O que é o sinal do cano de chumbo?',
    ],
  },
  {
    termos: ['Prega Semicircular'],
    classe: 'viscera',
    resumo: 'Pregas transversais incompletas do colo, entre as haustrações.',
    localizacao: 'Parede do colo, projetando-se para a luz entre saculações vizinhas.',
    funcao: 'Formadas por mucosa, submucosa e musculatura circular; separam as haustrações e contribuem para a segmentação do conteúdo.',
    vascularizacao:
      'Vasos retos da artéria marginal, que penetram a parede entre as tênias. As pregas semilunares não têm eixo vascular próprio: são apenas a parede dobrada entre duas saculações.',
    inervacao:
      'Plexo mientérico. Ao contrário das pregas circulares do delgado, que são permanentes e mucosas, estas envolvem toda a espessura da parede e desaparecem quando o cólon distende — o que as torna o sinal radiológico que distingue delgado de grosso na radiografia de abdome.',
    relacoes: 'Ao contrário das pregas circulares do delgado, não circundam toda a luz.',
    clinica:
      'Na colonoscopia, são os degraus atrás dos quais pólipos se escondem — a inspeção cuidadosa da face proximal de cada prega, especialmente na retirada do aparelho, é o que determina a taxa de detecção de adenomas, o principal indicador de qualidade do exame. Anatomia que virou indicador de desempenho.',
    memoria:
      'Todo pólipo gosta de se esconder atrás de uma prega. Por isso a colonoscopia é lenta na saída, não na entrada.',
    pontos: [
      'Que camadas formam as pregas semicirculares?',
      'Como elas diferem das pregas circulares do delgado?',
      'Por que elas importam na colonoscopia?',
    ],
  },
  {
    termos: ['Apêndices Omentais', 'Apêndice Omental'],
    classe: 'viscera',
    resumo: 'Pequenos apêndices de gordura peritoneal pendurados na superfície do colo.',
    localizacao: 'Ao longo das tênias livre e omental, em todo o colo, ausentes no ceco e no reto.',
    funcao: 'São acúmulos de gordura envoltos em peritônio, com um pedículo vascular próprio e frágil.',
    vascularizacao:
      'Um ou dois ramos arteriais finos de vasos retos e uma vênula única, num pedículo estreito. Essa irrigação terminal e o pedículo fino são a receita para a torção — e o infarto de apêndice omental produz dor abdominal aguda que imita apendicite ou diverticulite na tomografia.',
    inervacao:
      'Peritônio visceral, sem dor própria. Quando um apêndice omental infarta, a dor vem da irritação do peritônio parietal vizinho, e por isso é bem localizada e sem febre alta — o quadro que evita uma cirurgia desnecessária quando reconhecido.',
    relacoes: 'Mais numerosos e maiores no colo sigmoide.',
    clinica:
      'A torção do seu pedículo produz a apendagite epiploica: dor abdominal localizada, de início súbito, sem febre nem alteração laboratorial, que simula apendicite ou diverticulite e se resolve sozinha. Na tomografia, aparece como um nódulo gorduroso com halo — e reconhecê-la evita uma cirurgia desnecessária. É o exemplo perfeito de uma estrutura anatômica trivial com valor diagnóstico grande.',
    memoria:
      'Dor abdominal forte, localizada, sem febre e com exames normais: pense em apendagite. É gordura torcida, não infecção.',
    pontos: [
      'O que são os apêndices omentais?',
      'Onde eles são mais numerosos?',
      'O que é apendagite epiploica?',
    ],
  },
  {
    termos: ['Ceco'],
    classe: 'viscera',
    resumo: 'Primeira porção do intestino grosso, em fundo cego abaixo da junção ileocecal.',
    localizacao: 'Fossa ilíaca direita, geralmente intraperitoneal e móvel, com o apêndice na sua face posteromedial.',
    funcao: 'Recebe o conteúdo ileal e inicia a absorção de água; é o segmento de maior calibre do colo.',
    inervacao:
      'Intestino médio: vago e simpático de T10 pelo esplâncnico menor. É por isso que a dor da apendicite começa periumbilical — o apêndice avisa pelo endereço embrionário do ceco, e só depois, quando o peritônio parietal inflama, a dor muda para o ponto de McBurney.',
    vascularizacao: 'Artéria ileocólica, ramo terminal da mesentérica superior.',
    relacoes: 'A base do apêndice é fixa, cerca de 2 cm abaixo da válvula ileocecal, onde as tênias convergem — mas sua ponta pode ocupar qualquer posição.',
    clinica:
      'Ser o segmento de maior calibre tem uma consequência prevista pela lei de Laplace: na obstrução distal com válvula ileocecal competente, é o ceco que atinge primeiro a tensão de parede crítica e é o primeiro a perfurar — acima de 12 cm de diâmetro na radiografia, o risco é iminente. A mobilidade do ceco também permite o volvo cecal, mais raro que o sigmoide.',
    memoria:
      'Obstrução lá embaixo, perfuração lá em cima: o ceco é o maior, e por isso é o primeiro a estourar.',
    pontos: [
      'Que artéria irriga o ceco?',
      'Por que ele é o primeiro a perfurar na obstrução distal?',
      'Onde se localiza a base do apêndice?',
    ],
  },
  {
    termos: ['Porção Terminal do Íleo'],
    classe: 'viscera',
    resumo: 'Último segmento do íleo, que desemboca no ceco pelo óstio ileal.',
    localizacao: 'Fossa ilíaca direita, entrando na parede medial do ceco pela válvula ileocecal.',
    funcao: 'Absorve vitamina B12 e sais biliares e regula a passagem do conteúdo para o colo.',
    inervacao:
      'Vago e simpático de T10 a T11. Vale a nota funcional: é o único segmento que reabsorve sais biliares e vitamina B12, e sua ressecção ou inflamação — na doença de Crohn — produz diarreia por sais biliares e anemia megaloblástica anos depois.',
    vascularizacao: 'Ramo ileal da artéria ileocólica.',
    relacoes: 'É o segmento com maior densidade de placas de Peyer.',
    clinica:
      'É o sítio de eleição da doença de Crohn — daí a ileíte terminal e o "sinal do barbante" na imagem —, da tuberculose intestinal e da yersiniose, todas com quadro semelhante ao da apendicite. Um divertículo de Meckel, resto do ducto onfalomesentérico, situa-se a cerca de 60 cm da válvula e obedece à regra dos dois: 2% da população, 2 polegadas de comprimento, 2 pés da válvula, 2 tipos de mucosa ectópica.',
    memoria:
      'Regra dos 2 do divertículo de Meckel: 2%, 2 polegadas, 2 pés da válvula, 2 tecidos, sintomas antes dos 2 anos.',
    pontos: [
      'Que doenças acometem preferencialmente o íleo terminal?',
      'O que é o divertículo de Meckel?',
      'Qual a regra dos dois?',
    ],
  },
  {
    termos: ['Óstio Ileal'],
    classe: 'viscera',
    resumo: 'Abertura do íleo no ceco, guardada pela válvula ileocecal com seus dois lábios e frênulos.',
    localizacao: 'Parede posteromedial do ceco, na junção com o colo ascendente.',
    funcao:
      'Funciona como válvula unidirecional: retarda o esvaziamento ileal, dando tempo à absorção, e impede o refluxo de conteúdo colônico — com sua carga bacteriana — para o delgado.',
    vascularizacao:
      'Ramos ileais e cecais da artéria ileocólica, último ramo da mesentérica superior. Território terminal, sem colateral generosa — a razão de a anastomose ileocólica exigir cuidado com a vascularização das duas bordas.',
    inervacao:
      'Plexo mientérico local, que gera a contração tônica do esfíncter, sob modulação vagal e simpática de T10. O reflexo gastroileal, disparado pela chegada de alimento ao estômago, relaxa este óstio — e é por isso que se sente vontade de evacuar depois de comer.',
    relacoes: 'Os frênulos são pregas que prolongam os lábios lateralmente, ao redor da circunferência cecal.',
    clinica:
      'Sua competência decide o desfecho da obstrução colônica: com válvula competente, forma-se uma alça fechada entre a válvula e a obstrução, e a distensão progressiva leva à perfuração cecal; incompetente, o conteúdo reflui para o delgado e o quadro se comporta como obstrução de delgado, menos grave. A perda dessa barreira também é uma das causas do supercrescimento bacteriano do delgado.',
    memoria:
      'Válvula ileocecal competente transforma obstrução do colo em alça fechada. Competência aqui é o que torna o quadro perigoso.',
    pontos: [
      'Que funções a válvula ileocecal exerce?',
      'O que muda na obstrução conforme sua competência?',
      'O que sua incompetência pode causar?',
    ],
  },
  {
    termos: [
      'Esfíncter Pilórico',
    ],
    classe: 'viscera',
    resumo: 'Anel de músculo circular espessado dentro do piloro — o músculo, e não a região do estômago.',
    localizacao:
      'Na espessura da parede pilórica, formado pelo espessamento acentuado da camada circular interna da muscular própria, num anel de 1 a 2 cm.',
    funcao:
      'É o único esfíncter verdadeiro do trato digestório alto, no sentido anatômico: um espessamento muscular identificável, e não apenas uma zona de alta pressão. Regula o esvaziamento gástrico deixando passar partículas menores que 2 mm — o que sobra volta para ser remoído pela peristalse antral.',
    vascularizacao:
      'Artérias gástrica direita, acima, e gastromental direita, abaixo, com ramos da gastroduodenal. Rede submucosa densa, e é dela que sangra a úlcera pré-pilórica.',
    inervacao:
      'Vago para o relaxamento coordenado e simpático de T6 a T9 para a contração — mas o marca-passo é intrínseco: as células intersticiais de Cajal do plexo mientérico, que geram as ondas lentas do estômago.',
    linfaticos: 'Linfonodos pilóricos e hepáticos, e daí para os celíacos.',
    relacoes:
      'A veia pré-pilórica de Mayo cruza sua face anterior na linha média — o reparo que o cirurgião usa para localizar o piloro quando a anatomia está distorcida.',
    clinica:
      'A hipertrofia deste anel no lactente é a estenose hipertrófica do piloro, com vômitos em jato não biliosos entre a segunda e a oitava semana, oliva palpável no epigástrio e alcalose metabólica hipoclorêmica — o padrão eletrolítico é tão característico que ajuda a fechar o diagnóstico. A cirurgia é a piloromiotomia de Ramstedt: corta-se apenas o músculo, sem abrir a mucosa. Um dos poucos casos em que a operação consiste em seccionar um músculo e nada mais.',
    memoria:
      'Piloro é o lugar; esfíncter pilórico é o músculo. No bebê, o músculo engrossa e o vômito sai em jato — e a cirurgia só corta o músculo.',
    pontos: [
      'Qual a diferença entre piloro e esfíncter pilórico?',
      'Que distúrbio eletrolítico acompanha a estenose hipertrófica?',
      'Em que consiste a piloromiotomia?',
    ],
  },
  {
    termos: [
      'Tênia Livre',
    ],
    classe: 'viscera',
    resumo:
      'A tênia visível na face anterior do cólon — a única que não tem nada preso a ela, e o trilho que leva ao apêndice.',
    localizacao:
      'Face anterior do ceco e do cólon ascendente, transverso e descendente. É uma das três tênias: a mesocólica ancora o mesocolo, a omental ancora os apêndices omentais, e esta não ancora nada.',
    funcao:
      'Como as outras duas, é a camada muscular longitudinal condensada. Sua contração tônica encurta o cólon e cria as saculações — e sua ausência no reto é o que faz o reto ser liso e sem haustros.',
    vascularizacao: 'Ramos dos vasos retos da artéria marginal de Drummond, que penetram a parede ao lado das tênias.',
    inervacao: 'Plexo mientérico entre as camadas musculares, com modulação vagal no cólon direito e sacral no esquerdo.',
    linfaticos: 'Linfonodos epicólicos e paracólicos ao longo da artéria marginal.',
    relacoes: 'As três tênias convergem exatamente na base do apêndice vermiforme.',
    clinica:
      'É o reparo mais confiável da cirurgia abdominal: quando o apêndice não é encontrado — retrocecal, subseroso, distorcido por aderências —, a manobra é achar a tênia livre no ceco e segui-la para baixo. As três tênias convergem na base do apêndice, sempre, qualquer que seja a posição da ponta. Nenhuma variação anatômica desfaz essa convergência, e é por isso que a regra funciona quando tudo o mais falha.',
    memoria:
      'Perdeu o apêndice na cirurgia? Ache a tênia livre e desça por ela. As três tênias sempre desembocam na base dele.',
    pontos: [
      'Quais são as três tênias e o que cada uma ancora?',
      'Onde as tênias convergem?',
      'Por que a tênia livre é o reparo para achar o apêndice?',
    ],
  },
  {
    termos: [
      'Papila Ileal',
    ],
    classe: 'viscera',
    resumo: 'A saliência que o íleo terminal faz ao se projetar para dentro do ceco — a papila, e não o orifício.',
    localizacao:
      'Na parede medial da junção entre o ceco e o cólon ascendente, projetando-se para dentro da luz do intestino grosso.',
    funcao:
      'É a protrusão do íleo terminal com sua camada muscular espessada. Funciona como válvula unidirecional por geometria, e não por esfíncter: a pressão do conteúdo cecal aplana a papila contra a parede e fecha a passagem, impedindo o refluxo de bactérias colônicas para o delgado.',
    vascularizacao:
      'Ramos ileais e cecais anteriores e posteriores da artéria ileocólica, último ramo da mesentérica superior. Território terminal, sem colateral generosa.',
    inervacao:
      'Plexo mientérico local, com modulação vagal e simpática de T10. O reflexo gastroileal, disparado pela chegada de alimento ao estômago, relaxa a papila e esvazia o íleo.',
    linfaticos: 'Linfonodos ileocólicos, ao longo da artéria homônima.',
    relacoes: 'Da sua borda partem os dois frênulos, que a ancoram à parede do cólon.',
    clinica:
      'Sua competência é o que mantém o delgado com poucas bactérias. Quando ela falha — por ressecção ileocecal, por doença de Crohn, por esclerodermia —, o cólon reflui e instala-se o supercrescimento bacteriano do intestino delgado, com distensão, diarreia e má absorção de gordura e de vitamina B12. É por isso que a ressecção ileocecal tem consequências funcionais que uma ressecção de delgado em outro nível não tem.',
    memoria:
      'Não é esfíncter: é uma dobra que a própria pressão do cólon fecha. Tirou a papila, o cólon sobe para o delgado.',
    pontos: [
      'Como a papila ileal impede o refluxo, se não é um esfíncter?',
      'Que artéria a irriga?',
      'O que acontece quando ela é ressecada?',
    ],
  },
  {
    termos: [
      'Frênulo do Óstio Ileal',
    ],
    classe: 'viscera',
    resumo: 'Cada uma das duas pregas que se estendem das bordas do óstio ileal e o ancoram à parede do cólon.',
    localizacao:
      'Duas pregas horizontais, superior e inferior, que partem dos ângulos do óstio ileal e contornam a luz do intestino grosso.',
    funcao:
      'Ancoram os lábios da papila e mantêm a fenda do óstio na horizontal. São eles que impedem a papila de everter para dentro do ceco quando a pressão do delgado sobe.',
    vascularizacao: 'Ramos cecais anteriores e posteriores da artéria ileocólica.',
    inervacao: 'Plexo mientérico, com aferentes viscerais que sobem por T10.',
    linfaticos: 'Linfonodos ileocólicos.',
    relacoes: 'Continuam-se com as fibras musculares circulares do cólon, formando um anel incompleto ao redor do óstio.',
    clinica:
      'É a falência dessa ancoragem que permite a intussuscepção ileocólica — o íleo terminal e a papila invaginam-se dentro do cólon, arrastando o mesentério e comprometendo a irrigação. É a causa mais comum de obstrução intestinal entre os 6 meses e os 3 anos, com a tríade de dor em cólica intermitente, massa em salsicha no quadrante direito e fezes em geleia de framboesa. O sinal do alvo na ultrassonografia é a papila e seus frênulos vistos de frente, dentro do cólon.',
    memoria:
      'Os frênulos são as amarras da válvula. Soltaram, o íleo entra no cólon — e o bebê faz cólica e fezes de framboesa.',
    pontos: [
      'Qual a função dos frênulos do óstio ileal?',
      'O que é a intussuscepção ileocólica?',
      'Qual a tríade clássica dessa condição?',
    ],
  },
]
