import type { EntradaDicionario } from './tipos'

/**
 * Membro inferior.
 *
 * Cada entrada responde por títulos exatos do acervo. Ver `tipos.ts` para a
 * régua de redação e para o motivo de o casamento ser por igualdade.
 */
export const MEMBRO_INFERIOR: EntradaDicionario[] = [
  {
    termos: ['Ílio', 'Asa do Ílio', 'Crista Ilíaca'],
    resumo: 'A maior das três peças do osso do quadril, formando a asa larga da pelve.',
    localizacao: 'Superiormente no osso do quadril, com a crista ilíaca no alto e as espinhas ilíacas anterior e posterior nas extremidades.',
    funcao: 'Ancora os músculos abdominais, glúteos e o ilíaco, e transmite a carga do tronco ao membro inferior pela articulação sacroilíaca.',
    vascularizacao: 'Artérias ilíacas circunflexas profunda e superficial e glútea superior.',
    inervacao: 'Nervos ílio-hipogástrico, ilioinguinal e cutâneo femoral lateral, que cruza junto à espinha ilíaca anterossuperior.',
    clinica:
      'A crista ilíaca é o sítio clássico de coleta de enxerto ósseo e de punção de medula. A linha entre as cristas cruza a coluna em L4, guiando a punção lombar. A compressão do nervo cutâneo femoral lateral junto à espinha ilíaca anterossuperior causa meralgia parestésica.',
    pontos: ['Crista ilíaca cruza L4 — referência da punção lombar', 'Sítio de enxerto ósseo e punção medular', 'Meralgia parestésica na espinha ilíaca anterossuperior'],
  },
  {
    termos: ['Ísquio', 'Túber Isquiático', 'Espinha Isquiática'],
    resumo: 'Peça posteroinferior do osso do quadril, sobre a qual nos sentamos.',
    localizacao: 'Inferoposteriormente no osso do quadril, com o túber isquiático embaixo e a espinha isquiática entre as incisuras isquiáticas maior e menor.',
    funcao: 'Suporta o peso na posição sentada e dá origem aos isquiotibiais e a parte do adutor magno.',
    vascularizacao:
      'Artéria obturatória, artéria glútea inferior e artéria pudenda interna, com o ramo acetabular da obturatória alcançando a fossa do acetábulo. O túber isquiático, que sustenta o peso ao sentar, recebe irrigação periosteal abundante — e é por isso que a úlcera de pressão isquiática do paciente cadeirante compromete o osso rapidamente.',
    inervacao: 'Nervo pudendo contorna a espinha isquiática ao voltar para o períneo.',
    clinica:
      'A espinha isquiática é o reparo palpável pelo toque vaginal para o bloqueio do nervo pudendo e é o ponto de referência do plano zero de De Lee na avaliação da descida fetal. A avulsão do túber isquiático acomete atletas adolescentes.',
    pontos: ['Espinha isquiática: bloqueio do pudendo e plano 0 de De Lee', 'Túber isquiático: origem dos isquiotibiais', 'Suporta o peso sentado'],
  },
  {
    termos: ['Púbis', 'Sínfise Púbica', 'Tubérculo Púbico'],
    resumo: 'Peça anterior do osso do quadril, que se une à do lado oposto na sínfise púbica.',
    localizacao: 'Na parte anterior da pelve, com corpo, ramo superior e ramo inferior delimitando o forame obturado.',
    funcao: 'Fecha o anel pélvico à frente e dá inserção aos adutores, ao reto do abdome e ao ligamento inguinal.',
    vascularizacao:
      'Artéria obturatória e ramo púbico da epigástrica inferior, que se anastomosam por trás do ramo superior do púbis. Em cerca de 25% das pessoas esse ramo é calibroso e substitui a obturatória — é a corona mortis, que sangra de forma alarmante na fratura de pelve e na hernioplastia inguinal, e cujo nome traduz o que acontecia antes de ela ser conhecida.',
    clinica:
      'O tubérculo púbico é o reparo que diferencia a hérnia inguinal (acima e medial a ele) da femoral (abaixo e lateral). A diástase da sínfise integra as fraturas em livro aberto da pelve, com risco de sangramento maciço do plexo venoso pélvico.',
    pontos: ['Tubérculo púbico diferencia hérnia inguinal de femoral', 'Sínfise púbica é articulação cartilagínea', 'Fratura em livro aberto e sangramento pélvico'],
  },
  {
    termos: ['Acetábulo', 'Limbo do Acetábulo', 'Fossa do Acetábulo'],
    resumo: 'Cavidade esférica na face lateral do osso do quadril, formada pela fusão de ílio, ísquio e púbis.',
    localizacao: 'Na face lateral do osso do quadril, voltada lateral, anterior e inferiormente, com a incisura acetabular embaixo.',
    funcao: 'Recebe a cabeça do fêmur; sua profundidade e a orientação são o que dá ao quadril estabilidade muito maior que a do ombro.',
    clinica:
      'A displasia do desenvolvimento do quadril é a cobertura acetabular insuficiente, rastreada com as manobras de Ortolani e Barlow no recém-nascido. As fraturas de acetábulo seguem a classificação de Judet-Letournel pelas colunas anterior e posterior.',
    pontos: ['Fusão de ílio, ísquio e púbis na cartilagem trirradiada', 'Lábio acetabular aprofunda a cavidade', 'Displasia do desenvolvimento e manobras de Ortolani/Barlow'],
  },
  {
    termos: ['Fêmur'],
    resumo: 'O osso mais longo e resistente do corpo, do quadril ao joelho.',
    localizacao:
      'Cabeça no acetábulo, colo em ângulo de inclinação com a diáfise, trocanteres maior e menor na junção, diáfise levemente arqueada e côndilos medial e lateral distalmente.',
    funcao: 'Transmite todo o peso do tronco ao joelho e serve de alavanca para os músculos mais potentes do corpo.',
    vascularizacao:
      'Artéria circunflexa femoral medial, principal fonte da cabeça do fêmur, com a artéria do ligamento da cabeça contribuindo pouco no adulto; perfurantes da femoral profunda na diáfise.',
    inervacao: 'Nervos femoral, obturatório e isquiático inervam os compartimentos que o cercam.',
    clinica:
      'A fratura do colo é intracapsular e interrompe a circunflexa femoral medial, com alto risco de necrose avascular — daí a artroplastia como conduta frequente no idoso. A fratura de diáfise sangra volumes que justificam choque hipovolêmico.',
    pontos: [
      'Colo intracapsular: risco de necrose avascular',
      'Circunflexa femoral medial é a principal irrigação da cabeça',
      'Fratura de diáfise pode causar choque hipovolêmico',
    ],
  },
  {
    termos: ['Cabeça do Fêmur', 'Fóvea da Cabeça do Fêmur'],
    resumo: 'Extremidade proximal esférica do fêmur, que se encaixa no acetábulo.',
    localizacao: 'Dentro do acetábulo, revestida por cartilagem, exceto na fóvea, onde se insere o ligamento da cabeça do fêmur.',
    funcao: 'Forma a articulação coxofemoral, esferóidea, que permite movimento em três eixos com grande estabilidade.',
    vascularizacao: 'Ramos retinaculares da artéria circunflexa femoral medial, ascendendo pelo colo; contribuição menor pela artéria do ligamento da cabeça.',
    clinica:
      'A necrose avascular da cabeça femoral segue fratura do colo, luxação, uso de corticoide e anemia falciforme. Na criança, a doença de Legg-Calvé-Perthes é a osteonecrose idiopática da cabeça.',
    pontos: ['Irrigação ascendente e vulnerável', 'Necrose avascular pós-fratura do colo', 'Perthes na infância'],
  },
  {
    termos: ['Trocanter Maior', 'Trocanter Menor'],
    resumo: 'Saliências na junção do colo com a diáfise femoral, onde se inserem os músculos do quadril.',
    localizacao: 'O trocanter maior é lateral e palpável; o menor é posteromedial e não é palpável.',
    funcao: 'O maior recebe glúteo médio, glúteo mínimo e os rotadores curtos; o menor recebe o iliopsoas.',
    clinica:
      'A dor sobre o trocanter maior sugere síndrome dolorosa do trocanter (antiga bursite trocantérica). As fraturas transtrocantéricas são extracapsulares, sangram mais que as do colo, mas preservam a irrigação da cabeça.',
    pontos: ['Maior: glúteos médio e mínimo', 'Menor: iliopsoas', 'Fratura transtrocantérica é extracapsular'],
  },
  {
    termos: ['Patela'],
    resumo: 'O maior osso sesamoide do corpo, dentro do tendão do quadríceps.',
    localizacao: 'À frente do joelho, deslizando na tróclea femoral, ancorada abaixo pelo ligamento patelar até a tuberosidade da tíbia.',
    funcao:
      'Aumenta o braço de alavanca do quadríceps em cerca de 30%, tornando a extensão do joelho muito mais eficiente, e protege a articulação anteriormente.',
    vascularizacao: 'Rede anastomótica peripatelar, formada pelas artérias geniculares.',
    clinica:
      'A luxação patelar é quase sempre lateral, favorecida pelo ângulo Q aumentado. A fratura transversa separa os fragmentos pela tração do quadríceps e abole a extensão ativa. A síndrome femoropatelar é a causa mais comum de dor anterior do joelho no jovem.',
    pontos: ['Aumenta o braço de alavanca do quadríceps', 'Luxação é lateral', 'Fratura abole a extensão ativa'],
  },
  {
    termos: ['Tíbia'],
    resumo: 'Osso medial e de sustentação da perna, o segundo mais longo do corpo.',
    localizacao:
      'Do platô tibial, que recebe os côndilos femorais, até o maléolo medial. Sua face anteromedial é subcutânea em toda a extensão — a "canela".',
    funcao: 'Transmite praticamente toda a carga do joelho ao tornozelo; a fíbula participa com uma fração mínima.',
    vascularizacao: 'Artéria nutrícia ramo da tibial posterior, com circulação periosteal escassa na face anteromedial.',
    inervacao: 'Nervo safeno (ramo do femoral) para a pele medial da perna.',
    clinica:
      'A fratura exposta mais comum do corpo, justamente por ser subcutânea. A tuberosidade da tíbia é o sítio da doença de Osgood-Schlatter no adolescente e o local da punção intraóssea de emergência, 2 cm abaixo e medial à tuberosidade.',
    pontos: ['Face anteromedial subcutânea: fratura exposta frequente', 'Punção intraóssea abaixo da tuberosidade', 'Osgood-Schlatter no adolescente'],
  },
  {
    termos: ['Fíbula'],
    resumo: 'Osso lateral e fino da perna, com função quase exclusivamente de inserção e estabilização.',
    localizacao: 'Lateralmente à tíbia, da cabeça (abaixo do joelho) ao maléolo lateral, unida por membrana interóssea e sindesmose tibiofibular distal.',
    funcao: 'Serve de origem aos músculos fibulares e à musculatura lateral e posterior da perna, e o maléolo lateral estabiliza o tornozelo.',
    vascularizacao: 'Artéria fibular.',
    inervacao: 'O nervo fibular comum contorna o colo da fíbula logo abaixo da cabeça, onde é superficial e vulnerável.',
    clinica:
      'A fratura do colo da fíbula, ou a compressão por gesso ou posicionamento cirúrgico, lesa o nervo fibular comum e produz pé caído com perda da sensibilidade dorsal do pé. É o osso doador clássico de enxerto vascularizado.',
    pontos: ['Nervo fibular comum no colo — pé caído', 'Sustenta pouca carga', 'Osso doador de enxerto vascularizado'],
  },
  {
    termos: ['Tálus', 'Sustentáculo do Tálus'],
    resumo: 'Osso do tarso que recebe todo o peso do corpo vindo da perna e o distribui para o pé.',
    localizacao: 'Encaixado entre os maléolos, sobre o calcâneo, articulando-se à frente com o navicular.',
    funcao: 'Distribui a carga da tíbia para o retropé e o antepé; não tem nenhuma inserção muscular, o que é único no corpo.',
    vascularizacao: 'Irrigação frágil e em grande parte retrógrada, por ramos da artéria tibial posterior, dorsal do pé e fibular, com o seio do tarso como porta de entrada.',
    clinica:
      'A ausência de inserções musculares e a irrigação retrógrada explicam a alta taxa de necrose avascular após fratura do colo do tálus (classificação de Hawkins). O sustentáculo do tálus sustenta o tálus e é atravessado pelo tendão do flexor longo do hálux.',
    pontos: ['Nenhum músculo se insere nele', 'Necrose avascular após fratura do colo', 'Distribui carga para retropé e antepé'],
  },
  {
    termos: ['Calcâneo'],
    resumo: 'O maior osso do tarso, que forma o calcanhar.',
    localizacao: 'Abaixo do tálus, com a tuberosidade posterior recebendo o tendão do calcâneo.',
    funcao: 'Serve de alavanca para o tríceps sural na propulsão e sustenta o arco longitudinal medial pela aponeurose plantar.',
    vascularizacao: 'Ramos calcâneos das artérias tibial posterior e fibular.',
    inervacao: 'Ramos calcâneos do nervo tibial e do nervo sural.',
    clinica:
      'A fratura do calcâneo tipicamente resulta de queda de altura e obriga a procurar fratura de coluna lombar associada. A fasciíte plantar dói na inserção medial da aponeurose na tuberosidade, com piora aos primeiros passos do dia.',
    pontos: ['Fratura por queda de altura → investigar coluna lombar', 'Inserção do tendão do calcâneo', 'Fasciíte plantar na tuberosidade medial'],
  },
  {
    termos: ['Ligamento Cruzado Anterior'],
    resumo: 'Ligamento intracapsular do joelho que impede o deslocamento anterior da tíbia sobre o fêmur.',
    localizacao: 'Da área intercondilar anterior da tíbia até a face medial do côndilo lateral do fêmur, cruzando o cruzado posterior.',
    funcao: 'Freia a translação anterior da tíbia e limita a rotação interna, sendo o principal estabilizador rotacional do joelho.',
    vascularizacao: 'Artéria genicular média — irrigação escassa, que explica a má cicatrização e a indicação frequente de reconstrução.',
    clinica:
      'A ruptura ocorre em desaceleração com rotação, com estalido audível e hemartrose precoce. Testes de Lachman (o mais sensível), gaveta anterior e pivot shift. Integra a tríade infeliz com o menisco medial e o colateral medial.',
    pontos: ['Impede a translação anterior da tíbia', 'Teste de Lachman é o mais sensível', 'Hemartrose precoce e tríade infeliz'],
  },
  {
    termos: ['Ligamento Cruzado Posterior'],
    resumo: 'Ligamento intracapsular mais resistente do joelho, que impede o deslocamento posterior da tíbia.',
    localizacao: 'Da área intercondilar posterior da tíbia até a face lateral do côndilo medial do fêmur.',
    funcao: 'Freia a translação posterior da tíbia e é o estabilizador central do joelho em flexão.',
    clinica:
      'Rompe-se no trauma do painel do carro (dashboard injury), com a tíbia empurrada para trás com o joelho fletido. Avaliado pelo teste da gaveta posterior e pelo sinal do sulco (sagging) da tuberosidade tibial.',
    pontos: ['Impede a translação posterior da tíbia', 'Dashboard injury', 'Mais resistente que o cruzado anterior'],
  },
  {
    termos: ['Ligamento Patelar'],
    resumo: 'Continuação do tendão do quadríceps abaixo da patela, até a tuberosidade da tíbia.',
    localizacao: 'Do polo inferior da patela à tuberosidade da tíbia, superficial e facilmente palpável.',
    funcao: 'Transmite a força do quadríceps à tíbia, completando o mecanismo extensor do joelho.',
    inervacao: 'Reflexo patelar mediado pela raiz L4 (nervo femoral) — o reflexo mais pesquisado do exame neurológico.',
    clinica:
      'É o tendão percutido no reflexo patelar. A tendinopatia patelar ("joelho do saltador") acomete sua inserção proximal. Sua ruptura, como a fratura de patela, abole a extensão ativa e produz patela alta.',
    pontos: ['Reflexo patelar avalia L4', 'Joelho do saltador na inserção proximal', 'Ruptura abole a extensão ativa'],
  },
  {
    termos: ['Menisco Medial'],
    resumo: 'Fibrocartilagem semilunar na face medial do platô tibial, em forma de C aberto.',
    localizacao: 'Sobre o côndilo medial da tíbia, aderido à cápsula e ao ligamento colateral medial.',
    funcao: 'Aprofunda a superfície de contato, distribui carga e aumenta a congruência entre côndilo femoral e platô tibial.',
    vascularizacao: 'Apenas o terço periférico é vascularizado (zona vermelha); os dois terços internos nutrem-se do líquido sinovial.',
    clinica:
      'Por ser menos móvel (fixo ao colateral medial), lesa-se mais que o lateral. Dor na interlinha medial, bloqueio articular e testes de McMurray e Apley. Lesões da zona vermelha podem ser suturadas; as da branca costumam ser ressecadas.',
    pontos: ['Em C, aderido ao colateral medial e menos móvel', 'Mais lesado que o lateral', 'Zona vermelha sutura, zona branca ressecção'],
  },
  {
    termos: ['Menisco Lateral'],
    resumo: 'Fibrocartilagem quase circular sobre o platô tibial lateral, mais móvel que o medial.',
    localizacao: 'Sobre o côndilo lateral da tíbia, sem aderência ao ligamento colateral lateral, com o tendão do poplíteo separando-o da cápsula.',
    funcao: 'Distribui carga e aumenta a congruência da compartimento lateral, acompanhando o grande deslocamento do côndilo femoral lateral.',
    clinica: 'A maior mobilidade o protege: lesa-se menos que o medial. O menisco discoide, variação anatômica congênita, é quase sempre lateral e causa estalido no joelho da criança.',
    pontos: ['Quase circular e mais móvel', 'Não adere ao colateral lateral', 'Menisco discoide é tipicamente lateral'],
  },
  {
    termos: ['Músculo Glúteo Máximo'],
    resumo: 'O maior e mais superficial músculo da nádega, extensor potente do quadril.',
    localizacao: 'Do ílio, do sacro e do ligamento sacrotuberal até o trato iliotibial e a tuberosidade glútea do fêmur.',
    funcao: 'Extensão e rotação lateral do quadril, recrutado sobretudo para subir escadas, levantar da cadeira e correr — não na marcha em terreno plano.',
    vascularizacao: 'Artérias glúteas superior e inferior.',
    inervacao: 'Nervo glúteo inferior (L5–S2).',
    clinica: 'Sua função explica por que a fraqueza aparece ao subir escadas antes de aparecer na marcha. O quadrante superolateral da nádega é a zona segura da injeção intramuscular, distante do nervo isquiático.',
    pontos: ['Extensor potente do quadril', 'Nervo glúteo inferior', 'Difícil subir escadas quando fraco'],
  },
  {
    termos: ['Músculo Glúteo Médio', 'Músculo Glúteo Mínimo'],
    resumo: 'Abdutores do quadril, profundos ao glúteo máximo.',
    localizacao: 'Da face lateral do ílio até o trocanter maior do fêmur.',
    funcao:
      'Abduzem o quadril e, sobretudo, estabilizam a pelve no plano frontal durante o apoio unipodal — impedem que a pelve caia para o lado oposto a cada passo.',
    vascularizacao: 'Artéria glútea superior.',
    inervacao: 'Nervo glúteo superior (L4–S1).',
    clinica:
      'A insuficiência produz o sinal de Trendelenburg: no apoio sobre o lado acometido, a pelve contralateral cai. A marcha compensatória inclina o tronco para o lado do apoio — marcha em Duchenne.',
    pontos: ['Estabilizam a pelve no apoio unipodal', 'Nervo glúteo superior', 'Sinal de Trendelenburg'],
  },
  {
    termos: ['Músculo Piriforme'],
    resumo: 'Músculo em pera que sai da pelve pelo forame isquiático maior — a referência da região glútea.',
    localizacao: 'Da face anterior do sacro até o trocanter maior, atravessando o forame isquiático maior.',
    funcao: 'Roda lateralmente o quadril estendido e abduz o quadril fletido.',
    vascularizacao:
      'Artéria glútea superior, acima dele, e glútea inferior, abaixo — as duas saem da pelve justamente contornando suas bordas, pelos forames supra e infrapiriforme. É a chave anatômica da região glútea: tudo o que entra ou sai da pelve por trás passa acima ou abaixo do piriforme.',
    inervacao: 'Ramos do plexo sacral (S1–S2).',
    relacoes: 'Divide o forame isquiático maior: acima dele passam os vasos e o nervo glúteos superiores; abaixo, os glúteos inferiores, o nervo isquiático, o pudendo e o cutâneo femoral posterior.',
    clinica:
      'É o marco anatômico de toda a região glútea. A síndrome do piriforme comprime o nervo isquiático em seu trajeto e simula ciatalgia de origem discal; em cerca de 10% das pessoas o nervo fibular comum atravessa o próprio músculo.',
    pontos: ['Referência do forame isquiático maior', 'Divide a passagem supra e infrapiriforme', 'Síndrome do piriforme simula ciatalgia'],
  },
  {
    termos: ['Músculo Iliopsoas'],
    resumo: 'Principal flexor do quadril, formado pela união do psoas maior com o ilíaco.',
    localizacao: 'Do corpo e dos processos transversos das vértebras lombares (psoas) e da fossa ilíaca (ilíaco) até o trocanter menor do fêmur, passando sob o ligamento inguinal.',
    funcao: 'Flexiona o quadril e, com o membro fixo, flexiona o tronco sobre a coxa (o movimento do abdominal).',
    vascularizacao: 'Ramos lombares e artéria ilíaca circunflexa profunda.',
    inervacao: 'Ramos ventrais de L1–L3 diretamente para o psoas; nervo femoral (L2–L4) para o ilíaco.',
    relacoes: 'O nervo femoral emerge entre o psoas e o ilíaco; o ureter cruza sua face anterior.',
    clinica:
      'O sinal do psoas (dor à extensão do quadril) sugere apendicite retrocecal ou abscesso do psoas. O hematoma do psoas em anticoagulados comprime o nervo femoral e causa fraqueza do quadríceps com anestesia da face anterior da coxa.',
    pontos: ['Principal flexor do quadril', 'Nervo femoral emerge entre psoas e ilíaco', 'Sinal do psoas na apendicite retrocecal'],
  },
  {
    termos: ['Músculo Reto Femoral', 'Músculo Vasto Lateral', 'Músculo Vasto Medial', 'Músculo Vasto Intermédio'],
    resumo: 'Grupo extensor do joelho, com quatro ventres que convergem no tendão do quadríceps.',
    localizacao: 'Compartimento anterior da coxa; o reto femoral vem da espinha ilíaca anteroinferior e os vastos, do próprio fêmur.',
    funcao: 'Extensão do joelho; o reto femoral, por cruzar duas articulações, também flexiona o quadril.',
    vascularizacao: 'Artéria femoral profunda e circunflexa femoral lateral.',
    inervacao: 'Nervo femoral (L2–L4).',
    clinica:
      'O reflexo patelar avalia L4. O vasto lateral é o sítio preferencial da injeção intramuscular em lactentes. A atrofia do vasto medial oblíquo desequilibra a tração patelar e contribui para a dor femoropatelar.',
    pontos: ['Nervo femoral; reflexo patelar = L4', 'Reto femoral cruza duas articulações', 'Vasto lateral: injeção intramuscular no lactente'],
  },
  {
    termos: ['Músculo Bíceps Femoral', 'Músculo Semitendíneo', 'Músculo Semimembranáceo'],
    resumo: 'Os isquiotibiais — grupo posterior da coxa que estende o quadril e flexiona o joelho.',
    localizacao: 'Do túber isquiático até a cabeça da fíbula (bíceps femoral) e a face medial da tíbia (semitendíneo e semimembranáceo), delimitando a fossa poplítea.',
    funcao: 'Estendem o quadril e flexionam o joelho; com o joelho fletido, o bíceps roda a perna lateralmente e os mediais, medialmente.',
    vascularizacao: 'Perfurantes da artéria femoral profunda.',
    inervacao:
      'Divisão tibial do nervo isquiático para todos, exceto a cabeça curta do bíceps femoral, inervada pela divisão fibular comum.',
    clinica:
      'A distensão dos isquiotibiais é uma das lesões mais frequentes do esporte, e o encurtamento limita a elevação da perna estendida (teste de Lasègue precisa ser interpretado com isso em mente). O tendão do semitendíneo é enxerto para reconstrução do cruzado anterior.',
    pontos: ['Estendem o quadril e flexionam o joelho', 'Nervo isquiático (divisão tibial)', 'Semitendíneo como enxerto do LCA'],
  },
  {
    termos: ['Músculo Sartório'],
    resumo: 'O músculo mais longo do corpo, cruzando a coxa em diagonal.',
    localizacao: 'Da espinha ilíaca anterossuperior até a face medial superior da tíbia, na pata de ganso.',
    funcao: 'Flexiona, abduz e roda lateralmente o quadril e flexiona o joelho — a posição de sentar de pernas cruzadas, que lhe deu o nome (alfaiate).',
    vascularizacao:
      'Ramos musculares da artéria femoral e da circunflexa femoral lateral, em pedículos segmentares múltiplos ao longo do músculo. Essa irrigação segmentar limita seu uso como retalho pediculado, mas é o que permite mobilizá-lo em partes para cobrir o trígono femoral após infecção de prótese vascular.',
    inervacao: 'Nervo femoral (L2–L3).',
    relacoes: 'Forma o limite lateral do trígono femoral e o teto do canal dos adutores.',
    clinica: 'Sua borda medial é reparo do trígono femoral, onde se palpa o pulso femoral. A pata de ganso (sartório, grácil e semitendíneo) é sítio de bursite, causa comum de dor medial do joelho.',
    pontos: ['O músculo mais longo do corpo', 'Limite lateral do trígono femoral', 'Pata de ganso: sartório, grácil e semitendíneo'],
  },
  {
    termos: ['Músculo Adutor Longo', 'Músculo Grácil'],
    resumo: 'Compartimento medial da coxa — os adutores do quadril.',
    localizacao: 'Do púbis e do ísquio até a linha áspera do fêmur; o grácil alcança a tíbia, na pata de ganso.',
    funcao: 'Aduzem a coxa e estabilizam a pelve na marcha; o adutor magno tem uma porção isquiocondilar que também estende o quadril.',
    vascularizacao: 'Artéria obturatória e perfurantes da femoral profunda.',
    inervacao:
      'Nervo obturatório (L2–L4) para o grupo; a porção isquiocondilar do adutor magno recebe a divisão tibial do isquiático, e o pectíneo pode receber o femoral.',
    clinica:
      'O hiato dos adutores, no adutor magno, é a passagem da artéria femoral para a fossa poplítea, onde vira artéria poplítea. A pubalgia do atleta acomete a inserção do adutor longo. A dor do quadril pode ser referida ao joelho pelo nervo obturatório.',
    pontos: ['Nervo obturatório', 'Hiato dos adutores: femoral vira poplítea', 'Adutor magno tem dupla inervação'],
  },
  {
    termos: ['Músculo Tibial Anterior'],
    resumo: 'Principal dorsiflexor do pé, no compartimento anterior da perna.',
    localizacao: 'Da face lateral da tíbia e da membrana interóssea até o cuneiforme medial e a base do 1º metatarsal; seu tendão é o mais medial no dorso do tornozelo.',
    funcao: 'Dorsiflexão e inversão do pé; controla excentricamente a descida do pé após o toque do calcanhar na marcha.',
    vascularizacao: 'Artéria tibial anterior.',
    inervacao: 'Nervo fibular profundo (L4–L5).',
    clinica:
      'Sua fraqueza é o pé caído, com marcha escarvante. A lesão do nervo fibular comum no colo da fíbula é a causa mais comum. A dorsiflexão contra resistência é o teste motor de L4–L5.',
    pontos: ['Dorsiflexão e inversão', 'Nervo fibular profundo', 'Pé caído e marcha escarvante'],
  },
  {
    termos: ['Músculo Gastrocnêmio', 'Músculo Sóleo'],
    resumo: 'Tríceps sural — gastrocnêmio (duas cabeças) e sóleo, que formam a panturrilha e o tendão do calcâneo.',
    localizacao: 'Do fêmur (gastrocnêmio) e da tíbia e fíbula (sóleo) até o calcâneo, pelo tendão do calcâneo.',
    funcao: 'Flexão plantar potente, essencial à propulsão na marcha e à corrida; o gastrocnêmio também flexiona o joelho.',
    vascularizacao: 'Artérias surais, ramos da poplítea.',
    inervacao: 'Nervo tibial (S1–S2).',
    clinica:
      'O reflexo aquileu avalia S1. O sóleo é a "bomba muscular" do retorno venoso e as veias em seu interior são sítio frequente de trombose venosa profunda. O teste de Thompson diagnostica a ruptura do tendão do calcâneo.',
    pontos: ['Flexão plantar; reflexo aquileu = S1', 'Sóleo é a bomba venosa da panturrilha', 'Teste de Thompson na ruptura do tendão'],
  },
  {
    termos: ['Músculo Fibular Longo', 'Músculo Fibular Curto'],
    resumo: 'Músculos do compartimento lateral da perna, os eversores do pé.',
    localizacao: 'Da face lateral da fíbula, seus tendões passam atrás do maléolo lateral: o curto vai à base do 5º metatarsal e o longo cruza a planta até o 1º metatarsal e o cuneiforme medial.',
    funcao: 'Eversão e flexão plantar do pé; o fibular longo sustenta ativamente o arco transverso da planta.',
    vascularizacao: 'Artéria fibular.',
    inervacao: 'Nervo fibular superficial (L5–S1).',
    clinica:
      'A lesão do nervo fibular comum ou superficial abole a eversão e predispõe a entorses em inversão recorrentes. A avulsão da base do 5º metatarsal, pela tração do fibular curto, é achado comum na entorse de tornozelo.',
    pontos: ['Eversores do pé', 'Nervo fibular superficial', 'Fibular curto e a avulsão da base do 5º metatarsal'],
  },
  {
    termos: ['Tendão do Calcâneo'],
    resumo: 'O tendão mais espesso e forte do corpo, formado pelo gastrocnêmio e pelo sóleo.',
    localizacao: 'Da junção musculotendínea da panturrilha até a tuberosidade do calcâneo, envolvido por paratendão e não por bainha sinovial.',
    funcao: 'Transmite toda a força da flexão plantar, suportando cargas de várias vezes o peso corporal na corrida e no salto.',
    vascularizacao: 'Zona hipovascular a 2–6 cm da inserção, onde ocorrem a maioria das rupturas.',
    clinica:
      'A ruptura ocorre na zona hipovascular, com estalo audível e teste de Thompson positivo (a compressão da panturrilha não produz flexão plantar). Fluoroquinolonas e corticoides aumentam o risco de tendinopatia e ruptura.',
    pontos: ['Zona hipovascular a 2–6 cm da inserção', 'Teste de Thompson', 'Risco aumentado por fluoroquinolonas'],
  },
  {
    termos: ['Espinha Ilíaca Anterossuperior', 'Espinha Ilíaca Ântero-Inferior', 'Espinha Ilíaca Ântero-inferior', 'Espinha Ilíaca Posterossuperior'],
    resumo: 'Saliências da margem do ílio — os reparos palpáveis que orientam quase todo exame da pelve e do quadril.',
    localizacao:
      'A anterossuperior termina a crista ilíaca à frente e recebe o sartório e o ligamento inguinal; a anteroinferior, logo abaixo, recebe o reto femoral; a posterossuperior marca a fosseta de Vênus e o nível de S2.',
    funcao: 'Áreas de inserção muscular e ligamentar, e pontos de referência constantes para medida e palpação.',
    inervacao: 'O nervo cutâneo femoral lateral cruza logo medialmente à espinha ilíaca anterossuperior.',
    clinica:
      'A avulsão da anterossuperior (sartório) e da anteroinferior (reto femoral) é lesão típica do atleta adolescente em arrancada. A compressão do cutâneo femoral lateral ali produz meralgia parestésica — queimação na face lateral da coxa, sem déficit motor. A posterossuperior projeta S2, referência da punção sacroilíaca.',
    pontos: [
      'EIAS: sartório e ligamento inguinal',
      'EIAI: reto femoral — avulsão no adolescente',
      'Meralgia parestésica pelo cutâneo femoral lateral',
    ],
  },
  {
    termos: ['Côndilo Medial', 'Côndilo Lateral'],
    resumo: 'Massas articulares arredondadas das extremidades do fêmur e da tíbia, que formam a articulação do joelho.',
    localizacao:
      'No fêmur, projetam-se posteriormente e são separados pela fossa intercondilar, com os epicôndilos por fora recebendo os colaterais. Na tíbia, formam o platô que recebe os côndilos femorais, com os meniscos entre eles.',
    funcao: 'Transmitem carga e, pelo raio de curvatura diferente entre medial e lateral, produzem a rotação automática que "trava" o joelho na extensão completa.',
    clinica:
      'A fratura do platô tibial lateral é a mais comum, por trauma em valgo, e é sítio clássico de afundamento articular. A necrose avascular espontânea do côndilo femoral medial acomete mulheres acima dos 60 anos com dor súbita no joelho.',
    pontos: [
      'Fossa intercondilar aloja os cruzados',
      'Rotação de travamento na extensão completa',
      'Fratura de platô lateral por trauma em valgo',
    ],
  },
]
