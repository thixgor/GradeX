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
      'O papilar posteromedial do ventrículo esquerdo recebe irrigação de um único vaso (descendente posterior); o anterolateral recebe de dois (descendente anterior e circunflexa).',
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
    termos: ['Valva Atrioventricular Direita (Tricúspide)', 'Válvula Atrioventricular Direita', 'Óstio Atrioventricular Direito'],
    classe: 'valva',
    resumo: 'Valva de três cúspides entre o átrio e o ventrículo direitos.',
    localizacao: 'No óstio atrioventricular direito, com cúspides anterior, posterior e septal, ancoradas em três músculos papilares.',
    funcao: 'Impede o refluxo para o átrio direito na sístole. Sua inserção é mais apical que a da mitral — diferença de poucos milímetros, mas anatomicamente constante.',
    relacoes: 'A cúspide septal está em relação direta com o nó atrioventricular, no trígono de Koch.',
    clinica:
      'Essa diferença de altura de inserção é o que permite ao ecocardiografista identificar qual valva é qual, e é o critério diagnóstico da anomalia de Ebstein, em que a tricúspide se implanta muito mais abaixo, "atrializando" parte do ventrículo direito. A vizinhança com o nó atrioventricular explica os bloqueios após cirurgia valvar tricúspide e após fechamento de comunicação interventricular.',
    memoria:
      'Tricúspide se insere mais para baixo que a mitral. É esse degrau que o eco usa para dizer qual ventrículo é qual.',
    pontos: [
      'Quantas cúspides tem a valva tricúspide e quais são?',
      'Como ela se distingue da mitral na ecocardiografia?',
      'Que estrutura de condução está próxima da cúspide septal?',
    ],
  },
  {
    termos: ['Valva Atrioventricular Esquerda (Bicúspide)', 'Válvula Atrioventricular Esquerda', 'Óstio Atrioventricular Esquerdo'],
    classe: 'valva',
    resumo: 'Valva mitral, de duas cúspides, entre o átrio e o ventrículo esquerdos.',
    localizacao: 'No óstio atrioventricular esquerdo, com uma cúspide anterior (aórtica) grande e uma posterior (mural) menor, mas de maior extensão de anel.',
    funcao:
      'Suporta a maior pressão de todo o coração. A cúspide anterior tem continuidade fibrosa com a valva aórtica — as duas compartilham a mesma cortina fibrosa, e o sangue passa rente à cúspide anterior ao sair do ventrículo.',
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
    termos: ['Válvula Anterior da Valva Tricúspide', 'Válvula Anterior'],
    classe: 'valva',
    resumo: 'A maior das três cúspides da valva tricúspide.',
    localizacao: 'Entre o óstio atrioventricular direito e o cone arterial, ancorada pelo músculo papilar anterior.',
    funcao: 'É a cúspide de maior área e a principal responsável pela coaptação; recebe cordas do papilar anterior, o maior dos três.',
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
    termos: ['Artéria Aorta', 'Artéria Aorta (Parte Ascendente)'],
    classe: 'arteria',
    resumo: 'Primeiro segmento da aorta, do ventrículo esquerdo ao arco, de onde nascem as coronárias.',
    localizacao: 'Do óstio aórtico até o nível do ângulo esternal; é intrapericárdica em toda a sua extensão.',
    funcao:
      'Recebe todo o débito sistêmico e o transmite com complacência: a aorta ascendente armazena volume na sístole e o devolve na diástole — o efeito Windkessel, que mantém fluxo contínuo nos tecidos e alimenta as coronárias.',
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
    termos: ['Artéria Pulmonar Superior Direita', 'Artéria Pulmonar Inferior Direita'],
    classe: 'arteria',
    resumo: 'Ramos lobares da artéria pulmonar direita, que acompanham os brônquios até os segmentos.',
    localizacao: 'No hilo direito, dividindo-se conforme o brônquio: um tronco superior para o lobo superior e um tronco interlobar para os lobos médio e inferior.',
    funcao:
      'Levam sangue venoso à rede capilar alveolar. As artérias pulmonares acompanham fielmente os brônquios até o nível segmentar — o par arteriobrônquico é a unidade de leitura da tomografia de tórax.',
    relacoes: 'As veias pulmonares, ao contrário, correm nos septos intersegmentares, entre os segmentos.',
    clinica:
      'Essa diferença — artéria com brônquio, veia entre segmentos — é a base da leitura da tomografia de alta resolução: uma estrutura tubular acompanhando um brônquio é artéria; uma isolada no meio do parênquima é veia. E é o que permite a segmentectomia anatômica, em que se ligam o brônquio e a artéria do segmento e se preserva a drenagem venosa dos vizinhos.',
    memoria:
      'Artéria anda de mãos dadas com o brônquio; veia anda sozinha, no meio do caminho entre dois segmentos.',
    pontos: [
      'Qual a relação entre artérias pulmonares e brônquios?',
      'Onde correm as veias pulmonares?',
      'Como isso orienta a leitura da tomografia de tórax?',
    ],
  },
  {
    termos: ['Veia Pulmonar Superior Direita', 'Veia Pulmonar Inferior Direita', 'Veia Pulmonar Superior Esquerda', 'Veia Pulmonar Inferior Esquerda'],
    classe: 'veia',
    resumo: 'As quatro veias que levam sangue oxigenado dos pulmões ao átrio esquerdo.',
    localizacao: 'Duas de cada pulmão, desembocando separadamente na parede posterior do átrio esquerdo.',
    funcao:
      'São as únicas veias do corpo que carregam sangue arterializado, e as únicas que desembocam num átrio sem passar por uma cava. Correm nos septos intersegmentares, e não com os brônquios.',
    relacoes: 'A superior direita drena os lobos superior e médio; a inferior direita, o lobo inferior; à esquerda, superior e inferior drenam os respectivos lobos, com a língula pela superior.',
    clinica:
      'As mangas musculares que se estendem do átrio esquerdo para dentro das veias pulmonares são a origem de mais de 90% dos focos ectópicos que desencadeiam a fibrilação atrial — motivo pelo qual o isolamento elétrico das veias pulmonares é o procedimento central da ablação. O drenagem anômala total é cardiopatia congênita cianótica que depende de comunicação interatrial para sobreviver.',
    memoria:
      'Quatro veias com sangue vermelho chegando ao coração. E dentro delas há músculo atrial — é dali que nasce a fibrilação.',
    pontos: [
      'Quantas veias pulmonares existem e onde desembocam?',
      'Por que são veias com sangue oxigenado?',
      'Qual sua importância na fibrilação atrial?',
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
