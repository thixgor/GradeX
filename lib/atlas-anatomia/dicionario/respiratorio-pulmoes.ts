import type { EntradaDicionario } from './tipos'

/**
 * Pulmões, brônquios e diafragma.
 *
 * Os pulmões são assimétricos por uma razão só: o coração ocupa o espaço à
 * esquerda. Dessa assimetria decorre quase toda a anatomia comparada dos dois
 * lados — número de lobos, forma do hilo, ângulo dos brônquios — e, com ela,
 * boa parte da clínica: onde o corpo estranho vai parar, onde a pneumonia
 * aspirativa se instala, onde o dreno precisa chegar.
 *
 * ## Duas circulações, e o cuidado de não trocá-las
 *
 * Toda ficha de peça pulmonar deste arquivo separa o que quase todo resumo
 * mistura. A circulação **funcional** é a pulmonar: a artéria pulmonar traz
 * sangue venoso para ser oxigenado e as veias pulmonares o devolvem arterial ao
 * átrio esquerdo — é a única artéria do corpo que carrega sangue venoso e a
 * única veia que carrega sangue arterial. A circulação **nutritiva** é a
 * brônquica, ramo sistêmico da aorta torácica, de alta pressão, que alimenta a
 * parede das vias aéreas e a pleura visceral.
 *
 * Confundir as duas custa caro na enfermaria: é por isso que o infarto pulmonar
 * após embolia é incomum (o tecido tem duas fontes) e que a hemoptise maciça
 * quase sempre vem da brônquica, sistêmica, e não da pulmonar.
 */
export const RESPIRATORIO_PULMOES: EntradaDicionario[] = [
  {
    termos: ['Ápice do Pulmão'],
    classe: 'via-aerea',
    resumo: 'Extremidade superior arredondada do pulmão, que ultrapassa a clavícula e alcança a raiz do pescoço.',
    localizacao: 'Projeta-se de 2 a 3 cm acima do terço medial da clavícula, coberto pela cúpula pleural e pela membrana suprapleural de Sibson.',
    funcao: 'É a região de menor perfusão e maior relação ventilação/perfusão do pulmão em pé, por efeito da gravidade sobre a circulação pulmonar.',
    vascularizacao:
      'Ramo apical do tronco anterior da artéria pulmonar traz o sangue a ser oxigenado; o retorno sobe pela veia pulmonar superior do lado correspondente. A nutrição da parede vem das artérias brônquicas, ramos da aorta torácica — e é essa, sistêmica e de alta pressão, que sangra na hemoptise.',
    inervacao:
      'Plexo pulmonar: fibras parassimpáticas do vago, que broncoconstringem e aumentam a secreção, e simpáticas dos gânglios torácicos altos, que broncodilatam. Não há fibra somática: o parênquima apical não dói. A dor do tumor de Pancoast não é do pulmão — é do plexo braquial e das costelas que ele invade.',
    linfaticos:
      'Plexo subpleural e plexo profundo convergem para os linfonodos broncopulmonares do hilo e daí para os traqueobrônquicos superiores e paratraqueais — a cadeia que a mediastinoscopia amostra no estadiamento.',
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
    termos: ['Ápice do Pulmão Direito'],
    classe: 'via-aerea',
    resumo: 'Ápice do pulmão direito, que se apoia sobre a artéria subclávia direita, ramo do tronco braquiocefálico.',
    localizacao:
      'Acima da primeira costela e do terço medial da clavícula direita, à direita da traqueia. Em relação ao esquerdo, tende a alcançar um nível ligeiramente mais alto.',
    funcao: 'Ventila o segmento apical do lobo superior direito, o primeiro segmento a se individualizar na árvore brônquica.',
    vascularizacao:
      'Ramo apical do tronco anterior da artéria pulmonar direita — o primeiro ramo dela. O sangue oxigenado desce pela veia pulmonar superior direita. Nutrição pela artéria brônquica direita, que costuma nascer de um tronco comum com a 3ª intercostal posterior.',
    inervacao: 'Plexo pulmonar direito, com vago e simpático de T1 a T5. Fibras aferentes viscerais acompanham o vago e não produzem dor localizada.',
    linfaticos:
      'Drena para os linfonodos hilares direitos, depois traqueobrônquicos superiores direitos e paratraqueais direitos, terminando no ducto linfático direito. É uma via curta e homolateral — ao contrário do que ocorre à esquerda.',
    relacoes:
      'A artéria subclávia direita e o tronco braquiocefálico o sulcam anteriormente; o tronco inferior do plexo braquial (C8–T1) e o gânglio estrelado ficam logo atrás.',
    clinica:
      'É o ápice em que a punção de veia subclávia direita mais frequentemente produz pneumotórax — e também o mais escolhido para o acesso, justamente por não haver ducto torácico aqui. Punção à direita arrisca o pulmão; à esquerda, arrisca o pulmão e a linfa.',
    memoria:
      'Ápice direito: subclávia e plexo por cima, sem ducto torácico. É por isso que a punção subclávia prefere a direita.',
    pontos: [
      'Que vaso arterial sulca o ápice direito?',
      'Para onde drena a linfa do ápice direito?',
      'Por que o acesso subclávio prefere o lado direito?',
    ],
  },
  {
    termos: ['Ápice do Pulmão Esquerdo'],
    classe: 'via-aerea',
    resumo: 'Ápice do pulmão esquerdo, sulcado pela artéria subclávia esquerda e vizinho do arco do ducto torácico.',
    localizacao: 'Acima da primeira costela esquerda, à esquerda da traqueia e do esôfago, atrás da articulação esternoclavicular.',
    funcao: 'Ventila o segmento apicoposterior — que à esquerda é único, porque apical e posterior se fundem.',
    vascularizacao:
      'Ramo apicoposterior da artéria pulmonar esquerda, único para os dois territórios fundidos. Retorno pela veia pulmonar superior esquerda. As duas artérias brônquicas esquerdas nascem diretamente da aorta torácica, e não de um tronco intercostal.',
    inervacao: 'Plexo pulmonar esquerdo, de vago e simpático torácico alto; sem inervação somática, portanto sem dor de origem parenquimatosa.',
    linfaticos:
      'Hilares esquerdos e depois subaórticos, na janela aortopulmonar. Uma parcela cruza a linha média para os paratraqueais direitos — motivo pelo qual um tumor de ápice esquerdo pode dar linfonodo positivo à direita e mudar de estádio.',
    relacoes:
      'A artéria subclávia esquerda o marca profundamente; o ducto torácico faz seu arco por aqui, entre a subclávia e a pleura, antes de desembocar no ângulo venoso esquerdo.',
    clinica:
      'É a razão de a punção subclávia esquerda carregar um risco a mais: além do pneumotórax, a lesão do ducto torácico, com quilotórax. Um dreno que devolve líquido leitoso após acesso central à esquerda é ducto torácico até prova em contrário.',
    memoria:
      'Ducto torácico faz a curva no ápice esquerdo. Líquido leitoso no dreno depois de puncionar à esquerda: quilotórax.',
    pontos: [
      'Por que o segmento apical e o posterior se fundem à esquerda?',
      'Que estrutura linfática arqueia sobre o ápice esquerdo?',
      'Como um tumor de ápice esquerdo pode acometer linfonodos à direita?',
    ],
  },
  {
    termos: ['Base do Pulmão', 'Face Diafragmática (Base do Pulmão)'],
    classe: 'via-aerea',
    resumo: 'Face inferior côncava do pulmão, apoiada sobre a cúpula do diafragma.',
    localizacao: 'Face inferior, moldada pela convexidade diafragmática; a base direita é mais alta que a esquerda, por causa do fígado.',
    funcao: 'É a região de maior perfusão e maior ventilação em pé, mas com relação ventilação/perfusão menor que a do ápice.',
    vascularizacao:
      'Ramos basais das artérias pulmonares, os de maior calibre da árvore — daí a maior perfusão. O retorno é pelas veias pulmonares inferiores. A pleura visceral que a reveste é nutrida pelas artérias brônquicas.',
    inervacao:
      'Plexo pulmonar para o parênquima e para a pleura visceral, sem sensibilidade dolorosa. A pleura parietal diafragmática abaixo dela é outra história: os nervos intercostais inferiores inervam sua periferia e o frênico, sua porção central — e essa dói.',
    linfaticos:
      'Segue a via profunda, ao longo dos brônquios e vasos, até os linfonodos broncopulmonares e, daí, aos traqueobrônquicos inferiores (subcarinais).',
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
    vascularizacao:
      'É o próprio pedículo vascular: a artéria pulmonar entra, as duas veias pulmonares saem, e as artérias brônquicas — uma à direita, duas à esquerda — acompanham a face posterior do brônquio. As veias brônquicas do hilo drenam para a ázigo à direita e para a hemiázigo à esquerda.',
    inervacao:
      'Plexos pulmonares anterior e posterior envolvem o hilo, o posterior bem mais volumoso. Aqui passam também os nervos que apenas margeiam a raiz: o frênico à frente dela e o vago atrás — relação que decide o lado da rouquidão nos tumores hilares.',
    linfaticos:
      'Concentra os linfonodos broncopulmonares (hilares, estação 10), a primeira estação de qualquer câncer de pulmão e o alvo do ultrassom endobrônquico.',
    relacoes:
      'A disposição difere entre os lados: à direita o brônquio é a estrutura mais posterior e o lobar superior passa acima da artéria (brônquio eparterial); à esquerda a artéria é a mais superior.',
    clinica:
      'Essa diferença é o que orienta a leitura da tomografia e a dissecção na lobectomia. As adenopatias hilares são o achado central da sarcoidose (bilaterais e simétricas), da tuberculose primária (unilaterais) e do linfoma. O ligamento pulmonar, abaixo do hilo, é seccionado nas cirurgias para permitir a expansão do pulmão remanescente.',
    memoria:
      'RALS: Right Anterior, Left Superior — posição da artéria pulmonar em relação ao brônquio, de cada lado. E lembre da regra do frênico e do vago: frente e trás da raiz.',
    pontos: [
      'Que estruturas compõem a raiz do pulmão?',
      'Como a artéria pulmonar se posiciona em cada hilo?',
      'Que nervos passam à frente e atrás da raiz do pulmão?',
    ],
  },
  {
    termos: ['Fissura Oblíqua'],
    classe: 'via-aerea',
    resumo: 'Fissura presente nos dois pulmões, que separa o lobo inferior dos demais.',
    localizacao:
      'Corre do processo espinhoso de T2, atrás, até a 6ª cartilagem costal, à frente — o trajeto da borda medial da escápula com o braço elevado acima da cabeça.',
    funcao: 'Divide o pulmão esquerdo em dois lobos e separa, no direito, o lobo inferior dos lobos superior e médio.',
    vascularizacao:
      'A fissura não é tecido próprio: é a dupla lâmina de pleura visceral que mergulha entre os lobos, nutrida pelas artérias brônquicas e drenada pelas veias pulmonares. No fundo dela corre a artéria pulmonar interlobar — e é por isso que a dissecção da fissura é a manobra central e mais sangrenta da lobectomia.',
    inervacao:
      'Só plexo pulmonar autonômico, como toda pleura visceral: a fissura não tem sensibilidade dolorosa. É a razão de uma consolidação que chega à fissura não doer, enquanto uma que toca a pleura parietal produz dor pleurítica.',
    linfaticos: 'Linfonodos interlobares (estação 11) ocupam o fundo da fissura e são a estação seguinte aos linfonodos lobares.',
    relacoes: 'Revestida por pleura visceral nas duas faces, com a artéria pulmonar interlobar no seu assoalho.',
    clinica:
      'Esse trajeto é o que permite localizar os lobos na ausculta: à frente e acima da fissura ouve-se o lobo superior (e o médio, à direita); nas costas, abaixo dela, o lobo inferior. Auscultar apenas o dorso é auscultar quase só lobos inferiores — erro comum que faz pneumonias de lobo médio passarem despercebidas. Na radiografia em perfil, a fissura oblíqua é a linha que localiza qualquer consolidação.',
    memoria:
      'Peça ao paciente para levantar o braço: a borda da escápula desenha a fissura oblíqua. Na frente é lobo de cima, atrás é lobo de baixo.',
    pontos: [
      'Qual o trajeto de superfície da fissura oblíqua?',
      'Que artéria corre no fundo da fissura?',
      'Por que a fissura não dói e a pleura parietal dói?',
    ],
  },
  {
    termos: ['Lobo Superior Direito', 'Lobo Superior do Pulmão Direito'],
    classe: 'via-aerea',
    resumo: 'Lobo mais alto do pulmão direito, acima da fissura horizontal.',
    localizacao: 'Ocupa a porção superior do pulmão direito, delimitado abaixo pela fissura horizontal e atrás pela oblíqua.',
    funcao: 'Contém três segmentos: apical, posterior e anterior.',
    vascularizacao:
      'O tronco anterior, primeiro e maior ramo da artéria pulmonar direita, irriga os segmentos apical e anterior; um ramo ascendente posterior, que nasce na fissura, completa o segmento posterior. Todo o retorno vai para a veia pulmonar superior direita — que também recebe o lobo médio, detalhe que decide a ligadura na lobectomia.',
    inervacao:
      'Plexo pulmonar direito: vago para broncoconstrição e secreção, simpático de T1 a T5 para broncodilatação. Sem fibras de dor no parênquima.',
    linfaticos:
      'Linfonodos lobares e interlobares, depois hilares direitos, traqueobrônquicos superiores direitos e paratraqueais direitos — drenagem inteiramente homolateral, até o ducto linfático direito.',
    relacoes: 'É ventilado pelo brônquio lobar superior direito, que sai acima da artéria pulmonar. A veia ázigo arqueia sobre seu limite superior.',
    clinica:
      'O segmento posterior do lobo superior direito é, junto com o superior do lobo inferior, o destino preferencial da aspiração no paciente em decúbito dorsal — porque são os segmentos mais posteriores e o brônquio direito é mais vertical. Saber isso permite prever, pela posição do paciente, onde a pneumonia aspirativa vai aparecer na radiografia.',
    memoria:
      'Aspirou deitado de costas: pneumonia no segmento posterior do lobo superior ou no superior do inferior, à direita.',
    pontos: [
      'Quantos segmentos tem o lobo superior direito?',
      'Que veia recebe o sangue do lobo superior e do lobo médio?',
      'Onde se instala a pneumonia aspirativa em decúbito dorsal?',
    ],
  },
  {
    termos: ['Lobo Médio', 'Lobo Médio do Pulmão Direito'],
    classe: 'via-aerea',
    resumo: 'Lobo exclusivo do pulmão direito, entre as fissuras horizontal e oblíqua.',
    localizacao: 'Porção anteroinferior do pulmão direito, com projeção na parede anterior do tórax, entre a 4ª e a 6ª costela.',
    funcao: 'Contém dois segmentos: lateral e medial.',
    vascularizacao:
      'Uma ou duas artérias do lobo médio nascem da porção interlobar da artéria pulmonar direita, à frente. A veia do lobo médio não é independente: desemboca na veia pulmonar superior direita, junto com a do lobo superior — e ligar essa veia sem identificar o ramo médio é o erro clássico que infarta o lobo médio numa lobectomia superior.',
    inervacao: 'Plexo pulmonar direito, com o mesmo arranjo vagal e simpático dos demais lobos; sem inervação somática.',
    linfaticos:
      'Linfonodos interlobares e hilares direitos cercam de perto seu brônquio — e essa proximidade é a própria causa da síndrome do lobo médio.',
    relacoes: 'Seu brônquio é longo, estreito e sai em ângulo agudo, circundado por linfonodos.',
    clinica:
      'Essa geometria desfavorável é a base da síndrome do lobo médio: atelectasia crônica e recorrente por compressão extrínseca do brônquio pelos linfonodos ou por má drenagem, com infecções de repetição no mesmo lugar. É também o lobo mais frequentemente auscultado de forma inadequada, porque só se ouve bem na face anterior e na axila.',
    memoria:
      'O lobo médio só existe à direita, e seu brônquio é fino, longo e cercado de gânglios. Por isso ele fecha e não abre.',
    pontos: [
      'Que fissuras delimitam o lobo médio?',
      'Em que veia o lobo médio drena?',
      'O que é a síndrome do lobo médio?',
    ],
  },
  {
    termos: ['Lobo Inferior Direito', 'Lobo Inferior do Pulmão Direito'],
    classe: 'via-aerea',
    resumo: 'Maior lobo do pulmão direito, com cinco segmentos, abaixo e atrás da fissura oblíqua.',
    localizacao: 'Ocupa a maior parte da face posterior e toda a base do pulmão direito, abaixo da fissura oblíqua.',
    funcao:
      'Contém cinco segmentos: o superior, que aponta para trás logo abaixo da fissura, e quatro basais — medial, anterior, lateral e posterior.',
    vascularizacao:
      'A artéria pulmonar direita, já interlobar, emite a artéria do segmento superior e depois o tronco basal comum. O retorno é pela veia pulmonar inferior direita, que drena exclusivamente este lobo — ao contrário da superior, compartilhada com o lobo médio.',
    inervacao: 'Plexo pulmonar direito; a pleura visceral que o cobre é insensível à dor, e a dor pleurítica das pneumonias basais vem da pleura parietal vizinha, por nervos intercostais.',
    linfaticos:
      'Drena para os linfonodos interlobares e, sobretudo, para os traqueobrônquicos inferiores (subcarinais, estação 7) — a estação que a punção transbrônquica alcança com mais facilidade.',
    relacoes: 'Sua face inferior é a base, apoiada na cúpula direita do diafragma, e portanto sobre o fígado.',
    clinica:
      'O segmento superior do lobo inferior direito é o campeão da pneumonia aspirativa em decúbito dorsal e o sítio preferencial do abscesso pulmonar, porque seu brônquio sai voltado para trás num paciente deitado. Somem-se as atelectasias pós-operatórias por decúbito e dor, e este passa a ser o lobo que mais aparece na radiografia de enfermaria.',
    memoria:
      'Cinco segmentos à direita embaixo. O superior olha para trás — quem vomita deitado enche justamente ele.',
    pontos: [
      'Quantos segmentos tem o lobo inferior direito?',
      'Que veia drena exclusivamente este lobo?',
      'Por que o abscesso pulmonar prefere o segmento superior?',
    ],
  },
  {
    termos: ['Lobo Inferior Esquerdo', 'Lobo Inferior do Pulmão Esquerdo'],
    classe: 'via-aerea',
    resumo: 'Lobo posteroinferior do pulmão esquerdo, com quatro segmentos, abaixo da fissura oblíqua.',
    localizacao: 'Face posterior e base do pulmão esquerdo, apoiado sobre a cúpula esquerda do diafragma.',
    funcao:
      'Contém quatro segmentos: o superior e três basais — o anteromedial, resultado da fusão do medial com o anterior, o lateral e o posterior. Um segmento a menos que à direita, pela mesma razão de sempre: o coração.',
    vascularizacao:
      'Artéria do segmento superior e tronco basal, ramos terminais da artéria pulmonar esquerda depois de ela contornar o brônquio. Retorno pela veia pulmonar inferior esquerda, que passa por trás do átrio esquerdo — relação usada como referência na ablação de fibrilação atrial.',
    inervacao: 'Plexo pulmonar esquerdo. Vale a advertência de sempre: a dor de uma pneumonia basal esquerda é pleural parietal e intercostal, nunca do parênquima.',
    linfaticos:
      'Aqui está a assimetria que muda conduta: a linfa do lobo inferior esquerdo vai aos subcarinais e, de lá, cruza em boa parte para os paratraqueais do lado direito. Um tumor de base esquerda pode, portanto, dar linfonodo contralateral — o que o classifica como N3 e costuma tirá-lo da cirurgia.',
    relacoes: 'À frente e acima, o coração; abaixo do diafragma, o estômago e o baço. A aorta descendente o sulca medialmente.',
    clinica:
      'A consolidação do lobo inferior esquerdo esconde-se atrás da silhueta cardíaca na radiografia em incidência frontal — o "sinal do coração denso" — e é a pneumonia mais frequentemente perdida por quem não olha o perfil ou não repara que a cúpula esquerda sumiu.',
    memoria:
      'À esquerda embaixo são quatro segmentos, e a linfa atravessa para a direita. Pneumonia aí se esconde atrás do coração.',
    pontos: [
      'Quantos segmentos tem o lobo inferior esquerdo e por quê?',
      'Para que lado cruza a drenagem linfática dele?',
      'Por que essa pneumonia é fácil de perder na radiografia frontal?',
    ],
  },
  {
    termos: ['Lobo Superior Esquerdo', 'Lobo Superior do Pulmão Esquerdo'],
    classe: 'via-aerea',
    resumo: 'Lobo superior do pulmão esquerdo, que incorpora a língula — o equivalente do lobo médio.',
    localizacao: 'Acima da fissura oblíqua, ocupando a porção anterossuperior do pulmão esquerdo.',
    funcao: 'Contém quatro ou cinco segmentos: apicoposterior, anterior e os dois lingulares, superior e inferior.',
    vascularizacao:
      'É o território de irrigação mais variável do pulmão: de três a oito ramos partem da artéria pulmonar esquerda para ele, e essa variabilidade responde por boa parte dos acidentes hemorrágicos na lobectomia superior esquerda. Todo o retorno vai para a veia pulmonar superior esquerda, incluindo a veia lingular.',
    inervacao: 'Plexo pulmonar esquerdo, de vago e simpático torácico alto. Sem sensibilidade dolorosa própria.',
    linfaticos:
      'Drena para os linfonodos hilares esquerdos e, de modo característico, para os subaórticos da janela aortopulmonar (estação 5) e os para-aórticos (estação 6) — estações que só interessam ao câncer de lobo superior esquerdo e que a mediastinoscopia convencional não alcança.',
    relacoes: 'A incisura cardíaca escava sua borda anterior; o arco da aorta o sulca acima do hilo.',
    clinica:
      'A fusão dos segmentos apical e posterior num único apicoposterior, e a ausência de fissura horizontal, são consequências diretas da presença do coração à esquerda. Na prática, a segmentectomia lingular esquerda é o equivalente funcional da lobectomia média direita — mesma cirurgia, nomes diferentes por acidente anatômico.',
    memoria:
      'À esquerda não há lobo médio: há língula, incorporada ao superior. O coração tomou o lugar — e levou a linfa para a janela aortopulmonar.',
    pontos: [
      'Que segmentos o lobo superior esquerdo contém?',
      'Por que a lobectomia superior esquerda é a de irrigação mais traiçoeira?',
      'Que estação linfonodal é típica dos tumores desse lobo?',
    ],
  },
  {
    termos: ['Língula do Pulmão Esquerdo'],
    classe: 'via-aerea',
    resumo: 'Projeção em língua do lobo superior esquerdo, abaixo da incisura cardíaca.',
    localizacao: 'Porção anteroinferior do lobo superior esquerdo, contornando o coração por baixo.',
    funcao: 'Contém os segmentos lingulares superior e inferior, homólogos aos segmentos do lobo médio direito.',
    vascularizacao:
      'Uma ou duas artérias lingulares nascem da artéria pulmonar esquerda, e às vezes da porção interlobar. A veia lingular desemboca na veia pulmonar superior esquerda — exatamente como a veia do lobo médio desemboca na superior direita. A simetria vale também para o erro cirúrgico correspondente.',
    inervacao: 'Plexo pulmonar esquerdo; sem inervação somática, portanto sem dor própria.',
    linfaticos: 'Linfonodos hilares esquerdos e subaórticos, na janela aortopulmonar.',
    relacoes: 'Repousa sobre o pericárdio, à frente do coração, e é separada dele apenas pelas duas lâminas pleurais.',
    clinica:
      'É a porção de pulmão que se interpõe entre o coração e a parede torácica: sua consolidação apaga a borda cardíaca esquerda na radiografia — o sinal da silhueta, que localiza a pneumonia sem precisar de perfil. O mesmo raciocínio vale à direita: consolidação que apaga a borda direita do coração está no lobo médio.',
    memoria:
      'Sumiu a borda do coração na radiografia? A consolidação está encostada nele — língula à esquerda, lobo médio à direita.',
    pontos: [
      'Que segmentos a língula contém?',
      'Em que veia a língula drena?',
      'O que é o sinal da silhueta?',
    ],
  },
  {
    termos: ['Incisura Cardíaca'],
    classe: 'via-aerea',
    resumo: 'Recorte na borda anterior do pulmão esquerdo que acomoda o coração.',
    localizacao: 'Borda anterior do pulmão esquerdo, entre a 4ª e a 6ª cartilagem costal.',
    funcao: 'Abre espaço para o coração, deixando uma área em que o pericárdio contata diretamente a parede torácica.',
    vascularizacao:
      'A borda que a delimita é pulmão comum, com ramos do segmento lingular superior e nutrição brônquica. O que interessa aqui, porém, são os vasos que a incisura deixa expostos na parede: a artéria torácica interna esquerda desce a um través de dedo da borda do esterno, e é ela que a agulha paraesternal precisa evitar.',
    inervacao:
      'A pleura parietal mediastinal que forra a incisura é inervada pelo nervo frênico — sensibilidade somática, ao contrário da pleura visceral vizinha. Dor nessa região pode ser referida ao ombro esquerdo, por C3–C5.',
    linfaticos: 'A pleura parietal da região drena para os linfonodos paraesternais, ao longo dos vasos torácicos internos.',
    relacoes: 'Corresponde à área de macicez cardíaca à percussão, entre os recessos pleurais.',
    clinica:
      'É essa área desprovida de pulmão que torna possível a punção pericárdica pela via paraesternal esquerda e que define a janela acústica do ecocardiograma. Na percussão do tórax, a macicez cardíaca nessa região é normal — e seu desaparecimento sugere enfisema, com hiperinsuflação do pulmão cobrindo o coração.',
    memoria:
      'Um pedaço de coração encostado no peito, sem pulmão no meio. É por essa janela que o eco enxerga e a agulha entra — a um dedo do esterno, para não pegar a torácica interna.',
    pontos: [
      'Que estrutura ocupa a incisura cardíaca?',
      'Que artéria a agulha paraesternal precisa evitar?',
      'O que significa o desaparecimento da macicez cardíaca?',
    ],
  },
  {
    termos: ['Impressão Cardíaca'],
    classe: 'via-aerea',
    resumo: 'Concavidade na face mediastinal do pulmão moldada pelo coração.',
    localizacao: 'Face medial de cada pulmão, à frente do hilo; muito mais profunda à esquerda.',
    funcao: 'Acomoda o coração e o pericárdio; sua profundidade assimétrica reflete a posição levogira do coração.',
    vascularizacao:
      'O parênquima que a forma pertence ao lobo médio à direita e à língula à esquerda, com a irrigação pulmonar e brônquica desses territórios. A impressão em si é um molde, não um órgão: nada a irriga além do pulmão que a compõe.',
    inervacao: 'Plexo pulmonar. A pleura parietal mediastinal aplicada sobre ela, essa sim, é território do nervo frênico.',
    linfaticos: 'Linfonodos hilares do lado correspondente.',
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
    vascularizacao:
      'A pleura visceral que forma essa face é nutrida pelas artérias brônquicas e drenada pelas veias pulmonares. Do outro lado da fenda pleural, a pleura parietal costal é irrigada pelas artérias intercostais posteriores e torácica interna — duas pleuras encostadas, com duas irrigações distintas.',
    inervacao:
      'Aqui está a lição: a pleura visceral tem apenas plexo pulmonar autonômico e não dói; a pleura parietal costal, colada a ela, é inervada pelos nervos intercostais e dói muito. Essa fronteira de um décimo de milímetro separa o pulmão silencioso da dor pleurítica.',
    linfaticos: 'A pleura visceral drena para os hilares; a parietal costal, para os intercostais e paraesternais.',
    relacoes: 'Correspondem às costelas e aos espaços intercostais.',
    clinica:
      'Esse contato íntimo, mantido pela pressão negativa intrapleural, é o que faz o pulmão acompanhar a expansão do tórax — o acoplamento sem o qual não haveria ventilação. Quando o espaço pleural admite ar, esse acoplamento se desfaz e o pulmão colapsa por sua própria retração elástica: é o pneumotórax.',
    memoria:
      'Duas pleuras encostadas: a de dentro não dói, a de fora dói. Quando a dor pleurítica aparece, a doença já chegou à parede.',
    pontos: [
      'O que as impressões costais revelam?',
      'Por que a pleura visceral não dói e a parietal dói?',
      'O que acontece quando o acoplamento pleural se perde?',
    ],
  },
  {
    termos: ['Brônquio Lobar Superior Direito'],
    classe: 'via-aerea',
    resumo: 'Primeiro brônquio lobar do lado direito, que sai acima da artéria pulmonar — o brônquio eparterial.',
    localizacao: 'Sai da face lateral do brônquio principal direito, cerca de 2 cm após a carina, e divide-se em três brônquios segmentares.',
    funcao: 'Ventila o lobo superior direito; é o único brônquio lobar que passa acima da artéria pulmonar.',
    vascularizacao:
      'Sua parede é nutrida pela artéria brônquica direita, que corre na face posterior do brônquio — território sistêmico, de pressão aórtica. As veias brônquicas dessa altura drenam para a veia ázigo. A mucosa é o sítio da hemoptise volumosa justamente por essa pressão.',
    inervacao:
      'Vago, pelos ramos do plexo pulmonar posterior: broncoconstrição, secreção glandular e, sobretudo, o reflexo de tosse — a mucosa brônquica é densamente inervada por aferentes vagais irritativos. O simpático torácico alto broncodilata.',
    linfaticos: 'Linfonodos lobares próprios e depois hilares e traqueobrônquicos superiores direitos.',
    relacoes: 'Essa relação com a artéria define o brônquio eparterial, exclusivo do lado direito. A veia ázigo arqueia logo acima dele.',
    clinica:
      'Sua origem alta é uma armadilha da intubação seletiva: um tubo introduzido além do necessário entra no brônquio principal direito e frequentemente ultrapassa a origem do lobar superior, ventilando apenas os lobos médio e inferior. O resultado é atelectasia do lobo superior direito — uma das causas mais comuns de hipoxemia inexplicada após intubação, corrigida apenas tracionando o tubo.',
    memoria:
      'Tubo fundo demais entra à direita e "esquece" o lobo superior. Se dessaturou depois de intubar, cheque a profundidade.',
    pontos: [
      'O que é um brônquio eparterial?',
      'Que artéria nutre a parede brônquica e de onde ela vem?',
      'Que complicação a intubação profunda produz?',
    ],
  },
  {
    termos: ['Brônquio Lobar Médio/Inferior Direito'],
    classe: 'via-aerea',
    resumo: 'Continuação do brônquio principal direito após o lobar superior — o brônquio intermédio e seus ramos.',
    localizacao: 'Do brônquio intermédio partem o lobar médio, anteriormente, e o lobar inferior, que continua para baixo e para trás.',
    funcao: 'Ventilam o lobo médio, com dois segmentos, e o lobo inferior, com cinco.',
    vascularizacao:
      'Ramos da artéria brônquica direita acompanham cada divisão pela face posterior. As veias brônquicas profundas, curiosamente, drenam para as veias pulmonares — um pequeno curto-circuito fisiológico de sangue não oxigenado que ajuda a explicar por que a saturação arterial normal não chega a 100%.',
    inervacao:
      'Plexo pulmonar posterior, de predomínio vagal. A carina, logo acima, é o ponto mais sensível de toda a árvore: tocá-la na broncoscopia ou com a aspiração desencadeia tosse violenta e resposta vagal, com bradicardia.',
    linfaticos: 'Linfonodos interlobares (estação 11) e traqueobrônquicos inferiores (subcarinais, estação 7).',
    relacoes: 'O brônquio do segmento superior do lobo inferior sai da face posterior, imediatamente à frente da origem do lobar médio.',
    clinica:
      'A posição posterior desse brônquio segmentar superior é o que faz dele o destino da aspiração em decúbito dorsal, junto com o segmento posterior do lobo superior. E o brônquio lobar médio, longo e estreito, é o que se obstrui na síndrome do lobo médio. Na broncoscopia, essa árvore é percorrida em ordem fixa, e conhecer a sequência é o que permite descrever a lesão com precisão.',
    memoria:
      'Direita: superior, intermédio, médio e inferior. Um brônquio a mais que a esquerda — porque há um lobo a mais.',
    pontos: [
      'O que é o brônquio intermédio?',
      'Por que as veias brônquicas profundas criam um shunt fisiológico?',
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
    vascularizacao:
      'Como toda artéria de grande calibre, alimenta a própria parede por uma rede de vasa vasorum que penetra a adventícia e o terço externo da média. Quando essa rede é comprometida — na sífilis terciária, na aortite — a média enfraquece e o aneurisma se instala; é irrigação de artéria, não por artéria.',
    inervacao:
      'Plexo aórtico torácico, de fibras simpáticas dos gânglios torácicos, que ajustam o tônus, e aferentes viscerais que acompanham o simpático. A dor da dissecção aórtica sobe por essas fibras e chega à medula torácica alta — daí a dor interescapular, rasgante, tão característica.',
    linfaticos: 'Linfonodos para-aórticos e mediastinais posteriores, ao longo de todo o seu trajeto.',
    relacoes: 'O esôfago está à sua frente e cruza para a esquerda ao descer; o ducto torácico e a ázigo estão à direita.',
    clinica:
      'As artérias brônquicas que dela nascem são a irrigação nutritiva do pulmão — ao contrário das pulmonares, que são funcionais. É essa dupla circulação que explica por que o infarto pulmonar após embolia é relativamente incomum, e por que hemoptises maciças são quase sempre de origem brônquica, sistêmica e de alta pressão — o que faz da embolização das artérias brônquicas o tratamento de escolha.',
    memoria:
      'Pulmão tem duas circulações: a pulmonar oxigena o sangue, a brônquica alimenta o órgão. Hemoptise grave vem da brônquica.',
    pontos: [
      'Que ramos a aorta torácica emite para o pulmão?',
      'O que são os vasa vasorum e por que importam na aorta?',
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
    vascularizacao:
      'Artérias pericardiacofrênicas e musculofrênicas, ramos da torácica interna, chegam por cima; as frênicas inferiores, primeiros ramos da aorta abdominal, chegam por baixo e são a fonte principal. Sendo aponeurose, o centro tendíneo é pouco vascularizado em si — irriga-se pelas bordas, o que torna sua cicatrização mais lenta que a do músculo.',
    inervacao: 'Nervo frênico (C3, C4 e C5), tanto motor quanto sensitivo para a porção central.',
    linfaticos:
      'Linfonodos frênicos superiores, sobre a face torácica, e daí para os paraesternais e mediastinais. Essa comunicação transdiafragmática é a via pela qual uma ascite maligna vira derrame pleural.',
    relacoes: 'O forame da veia cava, ao nível de T8, atravessa o próprio centro tendíneo.',
    clinica:
      'Atravessar o tendão, e não o músculo, é o que permite à veia cava ser tracionada e mantida aberta na inspiração, favorecendo o retorno venoso — enquanto o esôfago, que atravessa músculo, é comprimido. A inervação central pelo frênico é a razão da dor referida no ombro em irritação diafragmática: sangue, ar ou pus subfrênicos doem em C4, no ombro (sinal de Kehr).',
    memoria:
      'Dor no ombro sem trauma no ombro, com abdome agudo: é o diafragma falando por C4.',
    pontos: [
      'Que estrutura atravessa o centro tendíneo e em que nível?',
      'De onde vem a irrigação principal do diafragma?',
      'O que é o sinal de Kehr?',
    ],
  },
  {
    termos: ['Parte Esternal'],
    classe: 'musculo',
    resumo: 'Porção do diafragma que nasce da face posterior do processo xifoide.',
    localizacao: 'Duas pequenas digitações que partem do processo xifoide em direção ao centro tendíneo.',
    funcao: 'É a menor das três porções de origem do diafragma, junto com a costal e a lombar.',
    vascularizacao:
      'Artérias musculofrênica e pericardiacofrênica, ramos da torácica interna, e ramos da epigástrica superior — que é justamente o vaso que atravessa o trígono esternocostal ao seu lado. Drenagem para as veias torácicas internas.',
    inervacao:
      'Nervo frênico, como todo o diafragma na função motora. A sensibilidade da periferia muscular, porém, é dos nervos intercostais inferiores — e é por isso que a irritação da borda diafragmática dói na parede, e não no ombro.',
    linfaticos: 'Linfonodos paraesternais, ao longo dos vasos torácicos internos.',
    relacoes: 'Entre ela e a porção costal fica o trígono esternocostal (fenda de Larrey ou de Morgagni), atravessado pelos vasos epigástricos superiores.',
    clinica:
      'Esse trígono é um ponto de fraqueza congênito: a hérnia de Morgagni, anterior e geralmente à direita, é rara e frequentemente assintomática, descoberta como massa cardiofrênica na radiografia. É também a via de acesso da pericardiocentese subxifoide e da janela pericárdica.',
    memoria:
      'Morgagni é na frente e é rara; Bochdalek é atrás e é a comum. Duas fendas, dois nomes, duas frequências.',
    pontos: [
      'De onde nasce a parte esternal do diafragma?',
      'Que vasos atravessam o trígono esternocostal?',
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
    vascularizacao:
      'Artérias frênicas inferiores, primeiro par de ramos da aorta abdominal, que sobem justamente pelos pilares — são a irrigação dominante do diafragma. As veias frênicas inferiores drenam à direita para a veia cava inferior e à esquerda, com frequência, para a veia suprarrenal esquerda.',
    inervacao:
      'Frênico para o motor. A porção posterior recebe sensibilidade também dos nervos subcostal e dos intercostais inferiores, o que explica a dor em faixa no dorso baixo de algumas irritações diafragmáticas posteriores.',
    linfaticos: 'Linfonodos frênicos inferiores e daí para os lombares (aórticos laterais), na cadeia que acompanha a aorta abdominal.',
    relacoes: 'Entre a parte lombar e a costal fica o trígono lombocostal, ponto de fraqueza posterior.',
    clinica:
      'É esse trígono posterior — a fenda de Bochdalek — que falha na hérnia diafragmática congênita, a mais comum das hérnias diafragmáticas, geralmente à esquerda, com vísceras abdominais no tórax e hipoplasia pulmonar. O recém-nascido apresenta abdome escavado, desconforto respiratório grave e ruídos hidroaéreos no tórax — e a intubação imediata, sem ventilação com máscara, é o que evita distender ainda mais as alças.',
    memoria:
      'Recém-nascido com abdome vazio, tórax cheio e desconforto: hérnia de Bochdalek. Não ventile com máscara.',
    pontos: [
      'Que estruturas formam a parte lombar do diafragma?',
      'Que artérias sobem pelos pilares e de onde nascem?',
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
    vascularizacao:
      'O próprio conteúdo é a maior artéria do corpo; a moldura fibromuscular que o forma é nutrida pelas artérias frênicas inferiores, que nascem da aorta poucos milímetros abaixo do hiato — a passagem alimenta quem a cerca.',
    inervacao: 'Frênico para os pilares. Ao redor do hiato corre o plexo aórtico, e logo abaixo está o gânglio celíaco, cuja compressão dói.',
    linfaticos: 'É a porta de entrada do ducto torácico no tórax — todo o linfático abaixo do diafragma passa por aqui.',
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
    vascularizacao:
      'Ramos esofágicos da artéria gástrica esquerda sobem por ele e ramos da frênica inferior esquerda descem — e é justamente aqui que se encontram a circulação portal e a sistêmica. Essa anastomose portossistêmica é a origem das varizes esofágicas na hipertensão portal.',
    inervacao:
      'Frênico para a musculatura do pilar; os troncos vagais que atravessam o hiato levam toda a inervação parassimpática do estômago e de boa parte do intestino. Seccioná-los aqui era a antiga vagotomia troncular.',
    linfaticos: 'Linfonodos paracardíacos e gástricos esquerdos — a via pela qual o adenocarcinoma da junção dissemina para o abdome.',
    relacoes: 'A membrana frenoesofágica fixa o esôfago ao hiato, permitindo mobilidade sem perder a vedação.',
    clinica:
      'O afrouxamento dessa membrana produz a hérnia de hiato por deslizamento, em que a junção esofagogástrica sobe para o tórax e a pinça diafragmática deixa de reforçar o esfíncter — mecanismo central da doença do refluxo gastroesofágico. A fundoplicatura recompõe justamente essa geometria, e não apenas "aperta" o esfíncter.',
    memoria:
      'Dois esfíncteres num só lugar: o músculo liso do esôfago e a pinça do diafragma. Herniou, perdeu um dos dois — e o refluxo aparece.',
    pontos: [
      'Que estruturas atravessam o hiato esofágico?',
      'Que anastomose portossistêmica existe nesse nível?',
      'Como a hérnia de hiato favorece o refluxo?',
    ],
  },
  {
    termos: ['Corpo Vertebral (representação)'],
    classe: 'acidente-osseo',
    resumo: 'Corpos das vértebras lombares altas, referência dos níveis das aberturas diafragmáticas.',
    localizacao: 'Coluna toracolombar, atrás do diafragma; os pilares se inserem em L1 a L3.',
    funcao: 'Serve de âncora posterior ao diafragma e de referência de nível para todas as suas passagens.',
    vascularizacao:
      'Ramos segmentares — intercostais posteriores no tórax, lombares no abdome — penetram o corpo vertebral pelos forames nutrícios da face posterior. A drenagem é pelas veias basivertebrais, que desembocam no plexo venoso vertebral interno de Batson, sem válvulas e em comunicação livre com as veias do tórax e da pelve.',
    inervacao:
      'Nervo sinuvertebral (de Luschka), ramo recorrente de cada nervo espinal que reentra pelo forame e inerva o periósteo, o ligamento longitudinal posterior e o anel fibroso externo — a origem anatômica da dor discogênica.',
    linfaticos: 'Linfonodos lombares e mediastinais posteriores, ao longo da aorta.',
    relacoes: 'T8 para a veia cava, T10 para o esôfago e T12 para a aorta.',
    clinica:
      'O plexo de Batson, sem válvulas, é a explicação anatômica de por que próstata, mama, tireoide, rim e pulmão metastatizam para a coluna sem passar pelo pulmão: um aumento da pressão abdominal desvia sangue para o plexo vertebral. É também a razão de a coluna ser o sítio ósseo mais comum de metástase.',
    memoria:
      'Cava em T8, esôfago em T10, aorta em T12. E lembre do plexo de Batson: veia sem válvula é rodovia de metástase para a coluna.',
    pontos: [
      'Em que níveis vertebrais estão as três grandes aberturas diafragmáticas?',
      'O que é o plexo venoso de Batson e por que ele importa?',
      'Que nervo inerva o corpo vertebral e o anel fibroso?',
    ],
  },
]
