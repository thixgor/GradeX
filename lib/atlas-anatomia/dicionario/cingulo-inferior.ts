import type { EntradaDicionario } from './tipos'

/**
 * Cíngulo do membro inferior: osso do quadril, articulação coxofemoral e glúteos.
 *
 * A pelve é um anel. Essa única frase organiza quase toda a traumatologia da
 * região — anel não quebra em um lugar só —, e explica também por que os
 * ligamentos posteriores importam mais que o osso. Do lado do quadril, a lógica
 * é oposta à do ombro: aqui o encaixe é profundo, e a estabilidade é comprada
 * com amplitude.
 */
export const CINGULO_INFERIOR: EntradaDicionario[] = [
  /* ─────────────────── Ílio ─────────────────── */
  {
    termos: ['Asa do Ílio'],
    classe: 'acidente-osseo',
    resumo: 'Lâmina larga e curva do ílio que forma a parede lateral da pelve maior.',
    localizacao: 'Porção superior do osso do quadril, acima da linha arqueada, com face glútea externa e fossa ilíaca interna.',
    funcao:
      'Dá inserção aos glúteos por fora e ao ilíaco por dentro. Sua curvatura para fora é o que orienta os glúteos médio e mínimo para abduzir e, sobretudo, estabilizar a pelve no apoio unipodal.',
    vascularizacao: 'Artérias glútea superior, iliolombar e circunflexa ilíaca profunda.',
    relacoes: 'A face glútea é dividida pelas linhas glúteas posterior, anterior e inferior, que delimitam as áreas de origem dos três glúteos.',
    clinica:
      'É a área doadora de enxerto ósseo mais usada da ortopedia, tanto esponjoso quanto corticoesponjoso — mas a retirada exige respeitar o nervo cutâneo femoral lateral, à frente, e o nervo glúteo superior, atrás. A dor crônica no sítio doador é complicação real e subestimada.',
    memoria:
      'A asa é fina no meio e grossa nas bordas. É por isso que ela dá enxerto sem quebrar: você tira do miolo e deixa as bordas.',
    pontos: [
      'Que músculos nascem na face glútea da asa do ílio?',
      'Por que ela é o principal sítio doador de enxerto ósseo?',
      'Que nervos correm risco na retirada de enxerto?',
    ],
  },
  {
    termos: ['Fossa Ilíaca'],
    classe: 'acidente-osseo',
    resumo: 'Concavidade lisa da face interna da asa do ílio, ocupada pelo músculo ilíaco.',
    localizacao: 'Face medial da asa do ílio, acima da linha arqueada, olhando para a cavidade abdominal.',
    funcao: 'Aloja e dá origem ao músculo ilíaco, que se une ao psoas maior para formar o iliopsoas, o mais potente flexor do quadril.',
    relacoes:
      'Sobre o músculo, à direita, repousa o ceco e o apêndice; à esquerda, o colo sigmoide. O nervo femoral corre no sulco entre o psoas e o ilíaco.',
    clinica:
      'Essa vizinhança explica dois sinais clássicos: o sinal do psoas na apendicite retrocecal, em que estender o quadril dói porque o músculo inflamado é estirado, e a posição antálgica em flexão do abscesso do psoas. Um hematoma no compartimento do ilíaco — em anticoagulados — comprime o nervo femoral e produz quadríceps fraco com anestesia da coxa anterior.',
    memoria:
      'Um músculo grande forrando a bacia por dentro, com o apêndice em cima e o nervo femoral no sulco. Três estruturas que se acusam mutuamente.',
    pontos: [
      'Que músculo ocupa a fossa ilíaca?',
      'O que é o sinal do psoas e o que ele sugere?',
      'Que nervo pode ser comprimido por hematoma nessa região?',
    ],
  },
  {
    termos: ['Tuberosidade Ilíaca'],
    classe: 'acidente-osseo',
    resumo: 'Área rugosa atrás da face auricular do ílio, onde se prendem os ligamentos sacroilíacos interósseos.',
    localizacao: 'Face medial da asa do ílio, posterior e superior à face auricular.',
    funcao: 'Recebe os ligamentos sacroilíacos interósseos, os mais fortes do corpo, que suspendem o sacro entre os dois ilíacos.',
    relacoes: 'Encaixa-se na tuberosidade sacral correspondente; à frente está a face auricular.',
    clinica:
      'É esse complexo, e não o osso, que confere estabilidade vertical à pelve. Nas fraturas pélvicas, a classificação de Tile separa lesões estáveis de instáveis exatamente pela integridade do complexo posterior — e é por isso que uma fratura de púbis "pequena" pode estar associada a uma pelve gravemente instável.',
    memoria:
      'A pelve não é uma tigela apoiada: é um sacro pendurado por cordas entre dois ilíacos. Cortadas as cordas, a bacia desmonta.',
    pontos: [
      'Que ligamentos se inserem na tuberosidade ilíaca?',
      'O que confere estabilidade vertical à pelve?',
      'Por que fraturas anteriores podem esconder instabilidade posterior?',
    ],
  },
  {
    termos: ['Espinha Ilíaca Posteroinferior'],
    classe: 'acidente-osseo',
    resumo: 'Pequena projeção abaixo da espinha ilíaca posterossuperior, que marca o topo da incisura isquiática maior.',
    localizacao: 'Borda posterior do ílio, logo abaixo da espinha posterossuperior, no nível aproximado de S2.',
    funcao: 'Ancora fibras dos ligamentos sacroilíacos posteriores e marca o início da incisura isquiática maior.',
    relacoes: 'A espinha posterossuperior, acima dela, corresponde às fossetas cutâneas de Vênus e ao nível de S2 — que é também onde termina o saco dural.',
    clinica:
      'A relação com S2 é um daqueles atalhos que valem ouro: a linha entre as espinhas ilíacas posterossuperiores marca o nível em que a dura-máter termina, informação relevante em punções e bloqueios. As espinhas posteriores são ainda a via de acesso para punção da crista ilíaca no mielograma e biópsia de medula óssea.',
    memoria:
      'As covinhas na base das costas são as espinhas posterossuperiores, e elas apontam S2 — o fim do saco dural.',
    pontos: [
      'Que nível vertebral as espinhas ilíacas posterossuperiores marcam?',
      'Que estrutura termina nesse nível?',
      'Que procedimento usa essa região como acesso?',
    ],
  },
  {
    termos: ['Incisura Isquiática Maior'],
    classe: 'passagem-ossea',
    resumo: 'Grande entalhe na borda posterior do osso do quadril, convertido em forame pelos ligamentos sacrotuberal e sacroespinal.',
    localizacao: 'Entre a espinha ilíaca posteroinferior, acima, e a espinha isquiática, abaixo.',
    funcao:
      'Transformada no forame isquiático maior, é a porta de saída da pelve para a região glútea. O músculo piriforme a atravessa e divide o forame em dois andares.',
    relacoes:
      'Acima do piriforme saem o nervo e os vasos glúteos superiores. Abaixo dele saem o nervo isquiático, o nervo e os vasos glúteos inferiores, o nervo cutâneo femoral posterior, os vasos pudendos internos e o nervo pudendo.',
    clinica:
      'É a base anatômica da síndrome do piriforme, em que o músculo comprime o isquiático e produz dor glútea com irradiação que simula hérnia de disco. Também organiza a regra de segurança da injeção intramuscular glútea: aplica-se no quadrante superolateral, longe do isquiático que emerge abaixo do piriforme, medialmente.',
    memoria:
      'O piriforme é a "prateleira" do forame. Tudo que é superior sai por cima dele; o resto — incluindo o isquiático — sai por baixo.',
    pontos: [
      'Que estruturas saem acima e abaixo do piriforme?',
      'O que é a síndrome do piriforme?',
      'Por que a injeção glútea é feita no quadrante superolateral?',
    ],
  },
  {
    termos: ['Incisura Isquiática Menor'],
    classe: 'passagem-ossea',
    resumo: 'Entalhe abaixo da espinha isquiática, convertido em forame pelos mesmos dois ligamentos.',
    localizacao: 'Entre a espinha isquiática e o túber isquiático.',
    funcao:
      'Transformada no forame isquiático menor, dá passagem ao tendão do obturador interno, ao nervo do obturador interno e ao feixe pudendo, que reentra na pelve por ela após ter saído pelo forame maior.',
    relacoes: 'O feixe pudendo faz um trajeto em U: sai pelo forame maior, contorna a espinha isquiática e volta pelo menor, entrando no canal pudendo.',
    clinica:
      'Esse trajeto em U tem consequência prática direta: o bloqueio do nervo pudendo, usado em obstetrícia, é feito por via transvaginal com a agulha dirigida à espinha isquiática, palpável ao toque. É também o ponto de compressão na neuralgia do pudendo, com dor perineal que piora sentado.',
    memoria:
      'O pudendo sai da pelve e volta para dentro, contornando a espinha isquiática. É o único nervo que faz esse retorno — e é na curva que ele é bloqueado e comprimido.',
    pontos: [
      'Que estruturas atravessam o forame isquiático menor?',
      'Descreva o trajeto em U do nervo pudendo.',
      'Como se faz o bloqueio do pudendo em obstetrícia?',
    ],
  },
  {
    termos: ['Eminência Iliopúbica'],
    classe: 'acidente-osseo',
    resumo: 'Elevação na linha de fusão entre o ílio e o púbis, na borda pélvica.',
    localizacao: 'Face anterior do osso do quadril, sobre a linha arqueada, marcando a união dos dois ossos.',
    funcao: 'Marca a fronteira entre o ílio e o púbis e a transição, na borda pélvica, entre a fossa ilíaca e o ramo superior do púbis.',
    relacoes: 'A bolsa iliopectínea, a maior do corpo, separa-a do tendão do iliopsoas, que desliza sobre ela.',
    clinica:
      'É onde o tendão do iliopsoas "salta" no quadril em ressalto interno — o estalido audível na flexoextensão do quadril, comum em bailarinas. A bursite iliopectínea produz dor inguinal profunda e, por comunicar-se com a articulação em 15% das pessoas, pode indicar patologia intra-articular.',
    memoria:
      'Um degrau na borda da pelve por onde o tendão do psoas passa. Degrau + tendão = estalo.',
    pontos: [
      'Que ossos a eminência iliopúbica une?',
      'Que estrutura desliza sobre ela?',
      'O que causa o quadril em ressalto interno?',
    ],
  },
  /* ─────────────────── Ísquio e púbis ─────────────────── */
  {
    termos: ['Corpo do Ísquio'],
    classe: 'acidente-osseo',
    resumo: 'Porção mais espessa do ísquio, que forma os dois quintos posteroinferiores do acetábulo.',
    localizacao: 'Parte posteroinferior do osso do quadril, acima do túber isquiático, contribuindo para a parede posterior do acetábulo.',
    funcao: 'Suporta o peso do corpo na posição sentada e transmite ao acetábulo a carga da posição em pé.',
    relacoes: 'Sua face posterior está em contato com o nervo isquiático, que desce entre o túber e o trocânter maior.',
    clinica:
      'A parede posterior do acetábulo, formada em boa parte pelo corpo do ísquio, é o fragmento mais frequentemente fraturado nas luxações posteriores do quadril — a "lesão do painel", em que o joelho bate no painel do carro. A lesão do nervo isquiático acompanha até 10% desses casos e precisa ser documentada antes da redução.',
    memoria:
      'Sentar dói no ísquio; luxar o quadril para trás quebra a parede que o ísquio faz. Mesmo osso, duas histórias.',
    pontos: [
      'Que fração do acetábulo o ísquio forma?',
      'Que mecanismo produz a fratura da parede posterior?',
      'Que nervo deve ser examinado antes da redução?',
    ],
  },
  {
    termos: ['Ramo do Ísquio'],
    classe: 'acidente-osseo',
    resumo: 'Braço fino que sobe do túber isquiático para encontrar o ramo inferior do púbis.',
    localizacao: 'Do túber isquiático em direção anteromedial, fundindo-se ao ramo inferior do púbis para formar o ramo isquiopúbico.',
    funcao:
      'Fecha a metade inferior do forame obturado e dá inserção aos músculos do compartimento adutor e à membrana perineal, base do períneo urogenital.',
    relacoes: 'Os corpos cavernosos do pênis e os ramos do clitóris se fixam a ele, junto com os músculos isquiocavernosos.',
    clinica:
      'A fratura de ramo isquiopúbico é comum em idosos após queda e costuma ser tratada conservadoramente, mas exige atenção: quase sempre há uma segunda lesão no anel posterior, e a tomografia é obrigatória se a dor não permite a marcha. É também a região da osteíte púbica e da fratura por estresse em atletas de corrida.',
    memoria:
      'Anel de osso: se você viu uma fratura em um ponto, procure a segunda. Anel de guardanapo não quebra num lugar só.',
    pontos: [
      'Que ramo forma o ramo isquiopúbico com o do ísquio?',
      'Que estruturas eréteis se fixam nele?',
      'Por que é preciso procurar segunda lesão no anel pélvico?',
    ],
  },
  {
    termos: ['Ramo Superior da Púbis'],
    classe: 'acidente-osseo',
    resumo: 'Braço do púbis que vai do corpo até o acetábulo, sulcado em cima pelos vasos obturatórios.',
    localizacao: 'Do corpo do púbis até a eminência iliopúbica, com a crista pectínea na sua borda superior e o sulco obturatório na face inferior.',
    funcao: 'Compõe o quinto anterior do acetábulo e forma, com a linha arqueada, a borda pélvica. A crista pectínea dá inserção ao ligamento pectíneo e ao músculo pectíneo.',
    relacoes:
      'A "coroa da morte" — anastomose entre a artéria obturatória e a epigástrica inferior — cruza o ramo superior em 20 a 30% das pessoas.',
    clinica:
      'Essa anastomose recebeu o nome porque, na cirurgia de hérnia inguinal e na fixação de fraturas do ramo, sua lesão inadvertida produz hemorragia difícil de controlar e retração do vaso para dentro da pelve. Conhecê-la mudou a técnica do reparo herniário laparoscópico.',
    memoria:
      '"Corona mortis": uma coroa vascular sobre o ramo do púbis. Cortou sem ver, o sangramento some para dentro da pelve.',
    pontos: [
      'Que estruturas correm sobre o ramo superior do púbis?',
      'O que é a corona mortis e por que ela importa?',
      'Que fração do acetábulo o púbis forma?',
    ],
  },
  {
    termos: ['Ramo Inferior da Púbis'],
    classe: 'acidente-osseo',
    resumo: 'Braço que desce do corpo do púbis para se fundir com o ramo do ísquio.',
    localizacao: 'Do corpo do púbis para baixo e lateralmente, formando com o ramo do ísquio o arco púbico.',
    funcao: 'Delimita inferiormente o forame obturado e dá inserção ao grácil, ao adutor curto e à membrana perineal.',
    relacoes: 'Os dois ramos inferiores formam, com a sínfise, o arco púbico — cujo ângulo é decisivo na pelvimetria.',
    clinica:
      'O ângulo subpúbico é uma das medidas mais confiáveis para determinar sexo em um esqueleto: acima de 80–85° é feminino, abaixo de 70° é masculino. Obstetricamente, um ângulo estreito reduz a saída pélvica e é fator de distocia.',
    memoria:
      'Ângulo aberto como um arco romano = pelve feminina. Ângulo estreito como um arco gótico = pelve masculina.',
    pontos: [
      'Que estrutura os dois ramos inferiores formam juntos?',
      'Qual a diferença do ângulo subpúbico entre os sexos?',
      'Que músculos se inserem nesse ramo?',
    ],
  },
  {
    termos: ['Corpo do Púbis'],
    classe: 'acidente-osseo',
    resumo: 'Parte central e achatada do púbis, que forma a sínfise na linha média.',
    localizacao: 'Porção anteromedial do osso do quadril, com face sinfisial medial, crista púbica superior e tubérculo púbico lateralmente.',
    funcao: 'Une-se ao do lado oposto pelo disco interpúbico, formando a sínfise púbica. Dá inserção ao reto do abdome, ao piramidal e aos adutores.',
    relacoes: 'A bexiga repousa atrás dele, no espaço retropúbico de Retzius, que é extraperitoneal.',
    clinica:
      'É porque o espaço de Retzius é extraperitoneal que a punção suprapúbica da bexiga é possível sem entrar na cavidade peritoneal — desde que a bexiga esteja cheia e eleve o peritônio. Fraturas do púbis podem lesar a bexiga e a uretra membranosa, e a presença de sangue no meato exige uretrografia antes de qualquer sondagem.',
    memoria:
      'Bexiga cheia sobe atrás do púbis e empurra o peritônio para cima. É essa subida que abre a janela para a punção suprapúbica.',
    pontos: [
      'Que estruturas se inserem no corpo do púbis?',
      'O que é o espaço de Retzius e por que ele importa?',
      'Que lesões urológicas acompanham a fratura de púbis?',
    ],
  },
  {
    termos: ['Crista Púbica'],
    classe: 'acidente-osseo',
    resumo: 'Borda superior e anterior do corpo do púbis, que termina lateralmente no tubérculo púbico.',
    localizacao: 'Margem superior do corpo do púbis, palpável na linha média inferior do abdome.',
    funcao: 'Dá inserção ao músculo reto do abdome e ao piramidal, e é o ponto em que a parede abdominal anterior se ancora no esqueleto.',
    relacoes: 'O tubérculo púbico, no seu extremo lateral, recebe a extremidade medial do ligamento inguinal.',
    clinica:
      'O tubérculo púbico é o divisor de águas do diagnóstico de hérnias: a hérnia inguinal aparece acima e medialmente a ele, e a femoral, abaixo e lateralmente. É um exame de dez segundos que muda a urgência do caso, porque a hérnia femoral encarcera com muito mais frequência.',
    memoria:
      'Ache o tubérculo púbico e pergunte: a hérnia está acima ou abaixo dele? Acima = inguinal. Abaixo = femoral, e essa é a perigosa.',
    pontos: [
      'Que músculos se inserem na crista púbica?',
      'Como o tubérculo púbico distingue hérnia inguinal de femoral?',
      'Por que essa distinção é clinicamente urgente?',
    ],
  },
  {
    termos: ['Face Sinfisial'],
    classe: 'acidente-osseo',
    resumo: 'Superfície medial oval do corpo do púbis que forma a sínfise púbica.',
    localizacao: 'Face medial do corpo do púbis, revestida de cartilagem hialina e unida à contralateral pelo disco fibrocartilagíneo.',
    funcao:
      'Forma uma sínfise — articulação cartilagínea secundária — com mobilidade mínima no adulto, cerca de 2 mm de deslocamento e 1° de rotação, que aumenta na gestação sob ação da relaxina.',
    relacoes: 'Reforçada pelos ligamentos púbicos superior e inferior (arqueado).',
    clinica:
      'Sua morfologia muda ao longo da vida de modo previsível e é um dos métodos mais usados de estimativa de idade em antropologia forense. Clinicamente, o alargamento acima de 10 mm indica lesão do anel pélvico anterior; e a diástase da sínfise pós-parto, com dor à deambulação, decorre exatamente da frouxidão hormonal dessa articulação.',
    memoria:
      'Duas metades de bacia unidas por uma almofada de fibrocartilagem. Na gravidez, a almofada amolece — de propósito.',
    pontos: [
      'Que tipo de articulação é a sínfise púbica?',
      'O que muda nela durante a gestação e por quê?',
      'A partir de que alargamento se considera lesão do anel?',
    ],
  },
  {
    termos: ['Forame Obturado'],
    classe: 'passagem-ossea',
    resumo: 'Grande abertura oval entre o púbis e o ísquio, quase totalmente fechada pela membrana obturatória.',
    localizacao: 'Face anterolateral do osso do quadril, abaixo do acetábulo, delimitada pelos ramos púbicos e isquiáticos.',
    funcao:
      'Apesar do tamanho, é quase todo fechado por membrana — sobra apenas o canal obturatório, no seu ângulo superior, por onde passam o nervo e os vasos obturatórios. A membrana serve de origem aos músculos obturadores interno e externo.',
    relacoes: 'O nervo obturatório (L2–L4) inerva os adutores e a pele da face medial da coxa.',
    clinica:
      'A hérnia obturatória, rara e típica de idosas magras, produz o sinal de Howship-Romberg: dor na face medial da coxa que piora com a extensão e a rotação interna do quadril, por compressão do nervo. É uma causa de obstrução intestinal que só se diagnostica quando se pensa nela. O bloqueio obturatório, por sua vez, é feito na ressecção transuretral de tumores da parede lateral da bexiga, para impedir o reflexo adutor.',
    memoria:
      '"Obturado" porque está tapado. Só sobra um canalzinho em cima — e é por ele que passa o nervo, e por ele que a hérnia escapa.',
    pontos: [
      'O que atravessa o canal obturatório?',
      'O que é o sinal de Howship-Romberg?',
      'Que músculos nascem da membrana obturatória?',
    ],
  },
  {
    termos: ['Sulco Obturatório'],
    classe: 'acidente-osseo',
    resumo: 'Goteira na face inferior do ramo superior do púbis que forma o teto do canal obturatório.',
    localizacao: 'Face inferior do ramo superior do púbis, no ângulo superolateral do forame obturado.',
    funcao: 'Convertido em canal pela membrana obturatória, transmite o nervo obturatório e os vasos obturatórios da pelve para a coxa medial.',
    relacoes: 'O nervo é a estrutura mais superior no canal, seguido pela artéria e pela veia.',
    clinica:
      'É onde a cabeça fetal pode comprimir o nervo obturatório no parto prolongado, produzindo fraqueza dos adutores e hipoestesia medial da coxa no pós-parto imediato. Nas linfadenectomias pélvicas, o nervo obturatório é o principal marco a preservar na fossa obturatória.',
    memoria: 'Nervo em cima, vasos embaixo, dentro de um canal curto e apertado. Canal apertado, nervo vulnerável.',
    pontos: [
      'O que o canal obturatório transmite?',
      'Qual a ordem das estruturas dentro dele?',
      'Que lesão obstétrica pode envolvê-lo?',
    ],
  },
  {
    termos: ['Face Semilunar'],
    classe: 'acidente-osseo',
    resumo: 'Superfície articular em ferradura do acetábulo, a única parte revestida de cartilagem.',
    localizacao: 'Periferia do acetábulo, em forma de C aberto para baixo, contornando a fossa acetabular central.',
    funcao:
      'É a única superfície de contato com a cabeça do fêmur — o centro do acetábulo, a fossa acetabular, não é articular e contém gordura e o ligamento da cabeça do fêmur. A carga se distribui, portanto, apenas pela periferia.',
    relacoes: 'O lábio acetabular a prolonga e aumenta a cobertura da cabeça; o ligamento transverso do acetábulo fecha a incisura inferior.',
    clinica:
      'A distribuição periférica da carga explica por que a displasia do desenvolvimento do quadril, em que a cobertura é insuficiente, concentra pressão numa área menor e leva à artrose precoce. O ângulo centro-borda de Wiberg mede exatamente essa cobertura na radiografia.',
    memoria:
      'O acetábulo é uma ferradura, não um prato. O meio é gordura; quem carrega peso é a borda.',
    pontos: [
      'Que parte do acetábulo é realmente articular?',
      'O que ocupa a fossa acetabular?',
      'Por que a displasia leva à artrose precoce?',
    ],
  },
  {
    termos: ['Incisura do Acetábulo'],
    classe: 'acidente-osseo',
    resumo: 'Falha na borda inferior do acetábulo, fechada pelo ligamento transverso.',
    localizacao: 'Porção inferior da borda acetabular, onde a face semilunar se interrompe.',
    funcao:
      'Dá passagem ao ramo acetabular da artéria obturatória, que entra pelo ligamento da cabeça do fêmur, e converte-se em forame pelo ligamento transverso do acetábulo.',
    relacoes: 'O ligamento transverso é a continuação do lábio acetabular sobre a incisura.',
    clinica:
      'Na artroplastia total do quadril, o ligamento transverso é o marco anatômico usado para orientar a versão do componente acetabular — uma referência que independe da posição do paciente na mesa e por isso reduz o risco de luxação da prótese. E o ramo acetabular que ali entra é a única fonte de sangue da cabeça femoral na criança pequena.',
    memoria:
      'Um "corte" na ferradura, fechado por um ligamento que serve de bússola ao cirurgião. Por ele entra a artéria que nutre a cabeça na criança.',
    pontos: [
      'Que estrutura fecha a incisura do acetábulo?',
      'Que artéria passa por ela?',
      'Qual seu uso como referência na artroplastia?',
    ],
  },
  {
    termos: ['Arco Púbico (Ângulo Subpúbico)'],
    classe: 'acidente-osseo',
    resumo: 'Ângulo formado pelos dois ramos isquiopúbicos abaixo da sínfise — o principal marcador sexual da pelve.',
    localizacao: 'Sob a sínfise púbica, entre os ramos inferiores do púbis e os ramos do ísquio dos dois lados.',
    funcao: 'Delimita a saída pélvica anteriormente e é um dos determinantes do diâmetro transverso disponível para a passagem do feto.',
    relacoes: 'A membrana perineal preenche o arco e sustenta o períneo urogenital.',
    clinica:
      'Um ângulo estreito, típico da pelve androide, empurra a cabeça fetal para trás e aumenta o risco de laceração perineal e de distocia. Junto com o formato do estreito superior e a proeminência das espinhas isquiáticas, é o que a pelvimetria clínica tenta estimar ao toque.',
    memoria:
      'Junte polegar e indicador: esse é o arco masculino. Abra bem os dois: esse é o feminino. O ângulo cabe na sua própria mão.',
    pontos: [
      'Que ossos delimitam o arco púbico?',
      'Qual a diferença entre os sexos?',
      'Que implicação obstétrica tem um arco estreito?',
    ],
  },
  {
    termos: ['Tuberosidade Isquiática'],
    classe: 'acidente-osseo',
    resumo: 'Grande saliência inferior do ísquio, sobre a qual o corpo se apoia sentado e de onde nascem os isquiotibiais.',
    localizacao: 'Porção posteroinferior do osso do quadril, palpável na prega glútea quando o quadril está fletido.',
    funcao:
      'Suporta o peso do tronco na posição sentada — protegida por uma bolsa e pela gordura glútea — e dá origem aos três isquiotibiais e à porção isquiocondilar do adutor magno.',
    relacoes: 'O nervo isquiático desce a meio caminho entre ela e o trocânter maior; o ligamento sacrotuberal se fixa nela.',
    clinica:
      'A avulsão apofisária da tuberosidade é lesão típica do adolescente atleta em arrancada ou chute, e não deve ser confundida com estiramento muscular. A bursite isquiática produz a "dor do tecelão", que piora sentado em superfície dura. E a linha média entre túber e trocânter é a referência de superfície para localizar o nervo isquiático nos bloqueios.',
    memoria:
      'É o osso em que você senta e de onde saem os posteriores da coxa. Sentar dói, correr puxa: dois sintomas, um osso.',
    pontos: [
      'Que músculos nascem da tuberosidade isquiática?',
      'Que estrutura nervosa passa perto dela?',
      'Que lesão típica ocorre em adolescentes atletas?',
    ],
  },
  {
    termos: ['Face Sacropélvica'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico'],
    resumo: 'Face medial da porção posterior do ílio, com a face auricular e a tuberosidade ilíaca.',
    localizacao: 'Parte posterior da face medial do osso do quadril, abaixo e atrás da fossa ilíaca.',
    funcao: 'Reúne as duas superfícies que ligam o ílio ao sacro: a auricular, articular, e a tuberosidade, ligamentar.',
    relacoes: 'A linha arqueada a separa da fossa ilíaca; abaixo dela está a pelve menor, com os vasos ilíacos internos.',
    clinica:
      'É a superfície de fusão nas artrodeses sacroilíacas e a área de erosão na sacroileíte das espondiloartrites — em que a alteração começa na metade ilíaca da articulação, porque a cartilagem ilíaca é mais fina que a sacral. Detalhe que explica por que o osso do lado do ílio se altera primeiro na radiografia.',
    memoria:
      'Do lado do ílio a cartilagem é mais fina, e por isso é ali que a sacroileíte aparece primeiro na imagem.',
    pontos: [
      'Que duas áreas compõem a face sacropélvica?',
      'Por que a sacroileíte se manifesta primeiro do lado ilíaco?',
      'Que estrutura separa essa face da fossa ilíaca?',
    ],
  },
  /* ─────────────────── Articulação do quadril ─────────────────── */
  {
    termos: ['Articulação Coxofemoral'],
    classe: 'articulacao',
    resumo: 'Articulação esferóidea profunda entre a cabeça do fêmur e o acetábulo — o oposto mecânico do ombro.',
    localizacao: 'Entre a cabeça do fêmur e a face semilunar do acetábulo, aprofundada pelo lábio acetabular, com cápsula do acetábulo ao colo femoral.',
    funcao:
      'Combina grande amplitude com estabilidade quase completa, porque o acetábulo cobre mais da metade da cabeça. É a articulação que transfere o peso do tronco para o membro e que, no apoio unipodal, suporta cerca de três vezes o peso corporal.',
    vascularizacao: 'Artérias circunflexas femorais medial e lateral, formando o anel extracapsular, mais o ramo acetabular da obturatória.',
    inervacao:
      'Nervos femoral, obturatório e do quadrado femoral. Como o obturatório também inerva o joelho, dor de quadril se refere ao joelho — a lei de Hilton em ação.',
    relacoes: 'A cápsula insere-se no colo anteriormente até a linha intertrocantérica, mas posteriormente só cobre dois terços do colo.',
    clinica:
      'A dor referida no joelho é a armadilha número um da pediatria ortopédica: uma criança que manca com dor no joelho pode ter epifisiólise ou Legg-Calvé-Perthes no quadril, e examinar apenas o joelho é errar o diagnóstico. A luxação do quadril é rara e exige alta energia, mas a posterior — a mais comum — coloca o nervo isquiático em risco e é emergência, porque a redução tardia multiplica a necrose avascular.',
    memoria:
      'Criança com dor no joelho: examine o quadril. Sempre. É a regra que mais evita diagnósticos perdidos em ortopedia pediátrica.',
    pontos: [
      'Por que a dor do quadril se refere ao joelho?',
      'Qual a principal fonte de irrigação da cabeça femoral no adulto?',
      'Por que a luxação posterior do quadril é uma emergência?',
    ],
  },
  {
    termos: ['Cápsula Articular do Quadril'],
    classe: 'articulacao',
    resumo: 'Manga fibrosa espessa que envolve o quadril, reforçada por três ligamentos em espiral.',
    localizacao: 'Do rebordo acetabular à linha intertrocantérica, anteriormente, e a dois terços do colo, posteriormente.',
    funcao:
      'Os ligamentos iliofemoral, pubofemoral e isquiofemoral formam uma espiral que se enrola na extensão: em pé, o quadril "trava" sozinho, e a musculatura quase não trabalha para mantê-lo estendido. É uma economia energética que só a disposição espiralada permite.',
    vascularizacao: 'Anel arterial extracapsular das circunflexas femorais, do qual partem os vasos retinaculares que sobem pelo colo.',
    relacoes: 'A porção posterior descoberta do colo é extracapsular — informação que muda a classificação das fraturas.',
    clinica:
      'A distinção entre fratura intracapsular (colo) e extracapsular (transtrocantérica) é a decisão central do trauma do quadril no idoso: a intracapsular rompe os vasos retinaculares e leva à necrose, indicando artroplastia; a extracapsular preserva a irrigação e permite osteossíntese. Além disso, o derrame articular distende a cápsula e a posição de menor pressão é flexão com leve rotação externa — a posição antálgica que o paciente adota sozinho.',
    memoria:
      'Os ligamentos se enrolam quando você estende: o quadril fica travado em pé sem gastar músculo. Deite e desenrole que ele fica frouxo.',
    pontos: [
      'Como os ligamentos capsulares travam o quadril em extensão?',
      'Qual a diferença de prognóstico entre fratura intra e extracapsular?',
      'Por que o paciente com derrame mantém o quadril fletido?',
    ],
  },
  {
    termos: ['Ligamento Iliofemoral'],
    classe: 'ligamento',
    resumo: 'O ligamento mais forte do corpo, em forma de Y invertido na frente do quadril.',
    localizacao: 'Da espinha ilíaca anteroinferior e do rebordo acetabular, abrindo-se em duas bandas até a linha intertrocantérica do fêmur.',
    funcao:
      'Limita a extensão e a rotação externa do quadril. É ele que impede o tronco de cair para trás na posição ereta, e por isso é o principal responsável pela postura bípede econômica.',
    relacoes: 'Recobre a face anterior da cápsula; o tendão do reto femoral nasce imediatamente acima dele.',
    clinica:
      'É chamado ligamento de Bigelow ou "ligamento em Y". Sua resistência explica por que a luxação anterior do quadril é rara e por que a luxação posterior, que passa por baixo dele, é a comum. Na artroplastia por via anterior, ele é o principal obstáculo à exposição e sua liberação parcial é etapa da técnica.',
    memoria:
      'Um Y na frente do quadril, mais forte que qualquer outro ligamento do corpo. Ele é o que impede você de cair para trás em pé.',
    pontos: [
      'Que movimentos o ligamento iliofemoral limita?',
      'Qual sua importância na postura ereta?',
      'Por que a luxação posterior do quadril é mais comum?',
    ],
  },
  {
    termos: ['Ligamento Pubofemoral', 'Ligamento Pubofemoral (Seccionado)'],
    classe: 'ligamento',
    resumo: 'Ligamento anteroinferior do quadril, que limita a abdução e a rotação externa.',
    localizacao: 'Da eminência iliopúbica e do ramo superior do púbis à parte inferior da linha intertrocantérica, misturando-se às fibras do iliofemoral.',
    funcao: 'Freia a abdução excessiva e a extensão com rotação externa. Entre ele e o iliofemoral há um ponto de menor resistência da cápsula.',
    relacoes: 'Esse ponto fraco corresponde à bolsa iliopectínea, que comunica-se com a articulação em cerca de 15% das pessoas.',
    clinica:
      'É por essa comunicação que um derrame articular do quadril pode se manifestar como massa inguinal — e que um cisto sinovial pode comprimir a veia femoral, produzindo edema unilateral do membro. A liberação do pubofemoral é passo da capsulotomia artroscópica.',
    memoria:
      'Iliofemoral segura a extensão, pubofemoral segura a abdução, isquiofemoral segura a rotação interna. Três ligamentos, três freios.',
    pontos: [
      'Que movimentos o ligamento pubofemoral limita?',
      'Onde fica o ponto fraco da cápsula anterior?',
      'Que consequência clínica essa comunicação pode ter?',
    ],
  },
  {
    termos: ['Ligamento da Cabeça do Fêmur'],
    classe: 'ligamento',
    resumo: 'Ligamento intracapsular que vai da fóvea da cabeça femoral à incisura do acetábulo, carregando uma artéria.',
    localizacao: 'Dentro da articulação, da fóvea da cabeça do fêmur ao ligamento transverso e às margens da incisura acetabular.',
    funcao:
      'Mecanicamente pouco importante no adulto; sua relevância é vascular: conduz o ramo acetabular da artéria obturatória até a cabeça femoral. Na criança pequena, essa é uma fonte significativa de irrigação; no adulto, contribui com pouco.',
    relacoes: 'Está imerso na gordura da fossa acetabular, coberto por sinovial.',
    clinica:
      'Essa mudança de importância com a idade é a chave para entender a doença de Legg-Calvé-Perthes: entre 4 e 8 anos, os vasos retinaculares ainda são precários e a contribuição do ligamento diminui, criando uma janela de vulnerabilidade em que a cabeça pode necrosar sem trauma. É a idade típica da doença — anatomia explicando epidemiologia.',
    memoria:
      'Um ligamento que serve de mangueira, não de corda. E a mangueira importa mais na criança do que no adulto.',
    pontos: [
      'Qual a real função do ligamento da cabeça do fêmur?',
      'Que artéria ele conduz?',
      'Como isso explica a idade típica da doença de Perthes?',
    ],
  },
]
