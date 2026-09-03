import type { EntradaDicionario } from './tipos'

/**
 * Cavidade oral, língua e dentes.
 *
 * A boca é o único lugar do corpo em que osso, mucosa e um órgão muscular
 * trabalham juntos em milissegundos, e onde quatro nervos cranianos dividem o
 * mesmo território. Por isso a regra que organiza esta seção é sempre a mesma:
 * quem inerva o quê, e o que o paciente perde quando esse nervo falha.
 */
export const DIGESTORIO_ORAL: EntradaDicionario[] = [
  /* ─────────────────── Lábios e vestíbulo ─────────────────── */
  {
    termos: ['Lábios'],
    classe: 'viscera',
    resumo: 'Pregas musculocutâneas móveis que fecham a boca e vedam a cavidade oral.',
    localizacao: 'Delimitam a rima da boca; têm face cutânea, borda do vermelhão e face mucosa.',
    funcao:
      'Vedam a boca para a sucção e para a fase oral da deglutição, articulam as consoantes bilabiais e participam da expressão facial. O músculo orbicular da boca é o esfíncter que os move.',
    vascularizacao: 'Artérias labiais superior e inferior, ramos da facial, correndo submucosas na borda do vermelhão.',
    inervacao: 'Sensitiva pelo infraorbital (V2) e mentual (V3); motora pelos ramos bucal e marginal do facial.',
    clinica:
      'A competência labial é o que se perde primeiro na paralisia facial: o paciente derrama líquidos e não consegue assobiar. E o lábio inferior é o sítio mais comum do carcinoma de lábio, por exposição solar crônica — enquanto o superior, mais protegido, adoece muito menos. A assimetria da exposição explica a assimetria da doença.',
    memoria:
      'Câncer de lábio é quase sempre no lábio de baixo, porque é ele que fica virado para o sol.',
    pontos: [
      'Que músculo forma o esqueleto dos lábios?',
      'Qual a inervação sensitiva de cada lábio?',
      'Por que o carcinoma prefere o lábio inferior?',
    ],
  },
  {
    termos: ['Comissura Labial'],
    classe: 'viscera',
    resumo: 'Ângulo da boca, onde os lábios superior e inferior se encontram.',
    localizacao: 'Extremidade lateral da rima da boca, normalmente na vertical do primeiro pré-molar.',
    funcao: 'Ponto de convergência de vários músculos da mímica — o modíolo, nó fibromuscular onde se cruzam orbicular, bucinador, zigomático maior, risório e abaixador do ângulo da boca.',
    vascularizacao:
      'Anastomose das artérias labiais superior e inferior, ramos da facial, que se encontram exatamente aqui formando o anel arterial perioral. É um vaso superficial, submucoso e de alto fluxo — a razão de um corte pequeno na comissura sangrar de forma desproporcional e de a hemostasia se fazer por compressão bidigital, e não por pinçamento.',
    inervacao: 'Ramos bucais do nervo facial.',
    relacoes: 'A artéria facial passa a cerca de 1,5 cm lateralmente à comissura.',
    clinica:
      'O modíolo é o que dá ao sorriso sua forma, e é ele que se reconstrói nas cirurgias de reanimação facial. O desvio da comissura é o sinal mais visível da paralisia facial. E a queilite angular — fissura e inflamação nos cantos da boca — associa-se a deficiência de ferro, de vitaminas do complexo B e a próteses dentárias mal ajustadas, que aprofundam a prega e retêm saliva e Candida.',
    memoria:
      'O canto da boca é um "nó" onde cinco músculos se encontram. É o nó que faz o sorriso — e o que a paralisia desmancha.',
    pontos: [
      'O que é o modíolo e quais músculos convergem nele?',
      'Que artéria passa próxima à comissura?',
      'Que causas se associam à queilite angular?',
    ],
  },
  {
    termos: ['Filtro Labial'],
    classe: 'viscera',
    resumo: 'Sulco vertical mediano do lábio superior, entre o nariz e o arco do cupido.',
    localizacao: 'Linha média do lábio superior, delimitado por duas cristas filtrais.',
    funcao:
      'É a cicatriz da fusão dos processos nasais mediais com os maxilares, entre a 5ª e a 7ª semana do desenvolvimento embrionário.',
    vascularizacao:
      'Ramos da artéria labial superior, que sobem de cada lado do sulco. A linha média é relativamente avascular — plano que a queiloplastia da fenda labial aproveita.',
    inervacao:
      'Nervo infraorbital, ramo terminal da divisão maxilar do trigêmeo (V2), que emerge do forame infraorbital. É o nervo bloqueado na anestesia do lábio superior.',
    relacoes: 'Termina inferiormente no arco do cupido, o contorno em M do vermelhão.',
    clinica:
      'A falha dessa fusão produz a fenda labial, unilateral ou bilateral, frequentemente associada à fenda palatina. E um filtro liso e apagado, com lábio superior fino e fissuras palpebrais curtas, compõe a fácies da síndrome alcoólica fetal — três sinais faciais que permitem suspeitar do diagnóstico à primeira vista.',
    memoria:
      'O filtro é a costura do lábio superior. Costura que não fechou é fenda labial; costura apagada levanta a suspeita de álcool na gestação.',
    pontos: [
      'O que o filtro labial representa embriologicamente?',
      'Que malformação resulta da falha dessa fusão?',
      'Que síndrome apresenta filtro liso?',
    ],
  },
  {
    termos: ['Sulco Mentoniano'],
    classe: 'viscera',
    resumo: 'Sulco horizontal entre o lábio inferior e o mento.',
    localizacao: 'Face anterior do terço inferior da face, separando o lábio inferior da proeminência do queixo.',
    funcao: 'Marca o limite entre a unidade estética labial e a mentoniana; sua profundidade depende da atividade do músculo mentual.',
    vascularizacao:
      'Artéria labial inferior e artéria submentual, ambas ramos da facial, com a mentual, ramo terminal da alveolar inferior, emergindo do forame mentual logo abaixo.',
    inervacao: 'Nervo mentual (V3), que emerge pelo forame mentual logo acima.',
    clinica:
      'É o local do bloqueio do nervo mentual, que anestesia lábio inferior e mento do lado correspondente — útil na sutura de lacerações. A hipoestesia mentual isolada, o "sinal do queixo dormente", é um sinal de alarme oncológico: associa-se a metástases mandibulares e a linfoma, e nunca deve ser atribuída a causa banal sem investigação.',
    memoria:
      'Queixo dormente sem trauma é bandeira vermelha. Procure metástase na mandíbula.',
    pontos: [
      'Que nervo inerva a região do sulco mentoniano?',
      'Que bloqueio se realiza ali?',
      'O que significa o sinal do queixo dormente?',
    ],
  },
  {
    termos: ['Prega Vestibular (Mucolabial)'],
    classe: 'viscera',
    resumo: 'Reflexão da mucosa do lábio para o processo alveolar, no fundo do vestíbulo oral.',
    localizacao: 'Fundo do vestíbulo, entre a mucosa labial e a gengiva alveolar.',
    funcao: 'Permite a mobilidade do lábio sem tracionar a gengiva; é revestida por mucosa de revestimento, não queratinizada.',
    vascularizacao:
      'Ramos das artérias labiais e alveolares. A submucosa frouxa desta prega é o plano de difusão dos anestésicos odontológicos e a via natural por onde o pus de um abscesso dentário migra até apontar na gengiva.',
    inervacao:
      'Nervos alveolares superiores (V2) na arcada superior e nervo bucal e mentual (V3) na inferior. É o local da punção da anestesia infiltrativa em odontologia.',
    relacoes: 'Sua profundidade determina a estabilidade de próteses totais.',
    clinica:
      'É por essa prega que se faz a anestesia infiltrativa supraperióstea, a mais comum da odontologia: a agulha entra na mucosa móvel e o anestésico difunde pelo osso alveolar fino da maxila. Na mandíbula, onde a cortical é espessa, essa técnica não funciona — daí a necessidade do bloqueio do alveolar inferior. A anatomia decide a técnica de anestesia em cada arcada.',
    memoria:
      'Maxila tem osso fino: infiltração resolve. Mandíbula tem osso grosso: precisa bloquear o nervo.',
    pontos: [
      'Que tipo de mucosa reveste a prega vestibular?',
      'Que técnica anestésica é usada nela?',
      'Por que essa técnica não funciona na mandíbula?',
    ],
  },
  {
    termos: ['Frênulo do Lábio Superior'],
    classe: 'viscera',
    resumo: 'Pregas medianas de mucosa que unem cada lábio à gengiva correspondente.',
    localizacao: 'Linha média do vestíbulo, entre o lábio e a gengiva, acima dos incisivos centrais superiores e abaixo dos inferiores.',
    funcao: 'Limitam a tração excessiva do lábio e ajudam a manter o lábio aposto à arcada.',
    vascularizacao:
      'Ramos da artéria labial superior, que sobem pela linha média. Vaso fino, mas o frênulo é rico em fibras elásticas e sangra pouco.',
    inervacao:
      'Nervo nasopalatino e ramos do infraorbital (V2). Sua inserção baixa entre os incisivos centrais mantém aberto o diastema mediano, e a frenectomia é o que permite fechá-lo ortodonticamente.',
    relacoes: 'O frênulo superior é sempre mais desenvolvido que o inferior.',
    clinica:
      'Um frênulo labial superior com inserção baixa mantém um diastema entre os incisivos centrais que não fecha espontaneamente — o teste é tracionar o lábio e observar isquemia da papila interincisiva. A frenectomia é indicada, mas só após a erupção dos caninos permanentes, porque muitos diastemas fecham sozinhos até lá. Em recém-nascidos, o frênulo labial curto pode dificultar a pega na amamentação.',
    memoria:
      'Puxe o lábio: se a gengiva entre os dentes da frente branquear, o frênulo está baixo demais.',
    pontos: [
      'Qual a função dos frênulos labiais?',
      'Como se avalia um frênulo superior com inserção baixa?',
      'Quando se indica a frenectomia?',
    ],
  },
  {
    termos: ['Gengiva Labial Superior'],
    classe: 'viscera',
    resumo: 'Mucosa queratinizada aderida ao osso alveolar e ao colo dos dentes.',
    localizacao: 'Recobre os processos alveolares; divide-se em gengiva livre (marginal), sulco gengival e gengiva inserida.',
    funcao:
      'É mucosa mastigatória: queratinizada e firmemente aderida ao periósteo, resiste ao atrito do alimento. O sulco gengival, de até 3 mm, é o espaço entre o dente e a gengiva livre.',
    vascularizacao: 'Ramos das artérias alveolares superiores e inferior, palatinas e linguais.',
    inervacao: 'Ramos do trigêmeo, correspondentes a cada arcada e face.',
    clinica:
      'O aprofundamento do sulco gengival além de 3 mm cria a bolsa periodontal, o nicho anaeróbio onde a periodontite progride e destrói o osso alveolar — hoje reconhecida como fator de risco independente para doença cardiovascular, diabetes descompensado e parto prematuro. A medida do sulco com sonda periodontal é o exame que define a doença.',
    memoria:
      'Até 3 milímetros é sulco; mais que isso é bolsa. E bolsa é onde a bactéria mora e o osso se perde.',
    pontos: [
      'Que tipo de mucosa é a gengiva e por quê?',
      'O que é o sulco gengival e qual sua profundidade normal?',
      'Que repercussões sistêmicas a periodontite tem?',
    ],
  },
  /* ─────────────────── Assoalho da boca e língua ─────────────────── */
  {
    termos: ['Frênulo da Língua'],
    classe: 'viscera',
    resumo: 'Prega mediana de mucosa que une a face inferior da língua ao assoalho da boca.',
    localizacao: 'Linha média do assoalho da boca, da face ventral da língua à mucosa alveolar lingual.',
    funcao: 'Ancora a língua e limita sua elevação e protrusão excessivas.',
    vascularizacao:
      'Artérias profundas da língua, ramos terminais da lingual, visíveis de cada lado dele como as veias linguais profundas — os vasos que a incisão da frenotomia precisa evitar.',
    inervacao:
      'Nervo lingual (V3). Um frênulo curto (anquiloglossia) limita a elevação da língua e prejudica a pega da amamentação, e o teste da linguinha avalia justamente essa mobilidade.',
    relacoes: 'De cada lado da sua base estão as carúnculas sublinguais; o nervo lingual e o ducto submandibular correm lateralmente.',
    clinica:
      'Um frênulo curto é a anquiloglossia: a língua não ultrapassa os incisivos nem alcança o palato, o que dificulta a pega na amamentação, com dor mamilar e ganho ponderal insuficiente. A frenotomia é procedimento simples e imediato, feito no consultório — e um dos poucos em que o resultado se vê na mesma mamada.',
    memoria:
      'Peça para a criança encostar a língua no céu da boca. Se não alcança, o frênulo é curto.',
    pontos: [
      'Qual a função do frênulo da língua?',
      'O que é anquiloglossia e como ela se manifesta?',
      'Que estruturas correm lateralmente a ele?',
    ],
  },
  {
    termos: ['Carúncula Sublingual'],
    classe: 'viscera',
    resumo: 'Papila de cada lado da base do frênulo lingual, onde se abre o ducto submandibular.',
    localizacao: 'Assoalho da boca, de cada lado do frênulo da língua.',
    funcao: 'Abertura do ducto submandibular (de Wharton) e, com frequência, do ducto sublingual maior.',
    vascularizacao: 'Artéria sublingual, ramo da lingual, que corre imediatamente sob ela no assoalho da boca.',
    inervacao:
      'Nervo lingual (V3), que cruza sob o ducto submandibular exatamente nesta região — de lateral para medial, passando por baixo. É por isso que a exérese de cálculo do ducto arrisca o nervo, e a anestesia lingual precede o procedimento.',
    relacoes: 'O ducto sobe de trás para a frente, contra a gravidade, cruzando por cima do nervo lingual.',
    clinica:
      'É onde se manifesta a sialolitíase submandibular: o cálculo impacta perto da carúncula e produz dor e aumento da glândula às refeições. A palpação bimanual do assoalho da boca frequentemente identifica o cálculo, e a sialolitotomia transoral o remove. O cruzamento entre ducto e nervo lingual — o nervo passa por baixo e depois por cima — é a relação mais comentada da região e o risco cirúrgico do procedimento.',
    memoria:
      'O nervo lingual passa por baixo do ducto e sai por cima: ele "dá um laço" no ducto submandibular.',
    pontos: [
      'Que ducto se abre na carúncula sublingual?',
      'Qual a relação entre esse ducto e o nervo lingual?',
      'Como se manifesta a sialolitíase submandibular?',
    ],
  },
  {
    termos: ['Prega Franjada'],
    classe: 'viscera',
    resumo: 'Prega irregular na face inferior da língua, lateral ao frênulo.',
    localizacao: 'Face ventral da língua, de cada lado do frênulo, convergindo para o ápice.',
    funcao: 'É uma prega de mucosa sem função conhecida; representa um resquício da mucosa lingual ventral.',
    vascularizacao: 'Ramos da artéria sublingual, da lingual, num plexo submucoso muito superficial.',
    inervacao:
      'Nervo lingual (V3). A mucosa do assoalho da boca aqui é delgada e altamente permeável — a razão de a via sublingual absorver nitrato e outros fármacos em segundos, direto para a circulação sistêmica, sem passar pelo fígado.',
    relacoes: 'Medialmente a ela corre a veia lingual profunda, visível através da mucosa fina.',
    clinica:
      'A mucosa ventral da língua é a mais permeável da boca, e é por isso que medicamentos sublinguais — nitrato, buprenorfina, midazolam — são absorvidos em segundos e escapam do metabolismo hepático de primeira passagem. Uma via de administração inteira que existe por causa da espessura e da vascularização dessa mucosa.',
    memoria:
      'A mucosa embaixo da língua é fina e cheia de veias. É por isso que o comprimido sublingual age em segundos.',
    pontos: [
      'Onde se localiza a prega franjada?',
      'Que estrutura vascular é visível ao lado dela?',
      'Por que a via sublingual é tão rápida?',
    ],
  },
  {
    termos: ['Veia Lingual Profunda'],
    classe: 'veia',
    resumo: 'Veia visível por transparência na face inferior da língua, ao lado do frênulo.',
    localizacao: 'Face ventral da língua, medialmente à prega franjada, sob mucosa muito fina.',
    funcao: 'Drena a língua para a veia lingual e daí para a jugular interna, acompanhando o nervo hipoglosso.',
    relacoes: 'É a veia mais facilmente visível de todo o corpo através da mucosa.',
    clinica:
      'Sua visibilidade fez dela a via de acesso venoso de emergência em animais e, na medicina, a base do exame das varizes sublinguais, associadas à idade e à hipertensão. A drenagem para a jugular interna, sem válvulas confiáveis, é uma das razões de a infecção do assoalho da boca — a angina de Ludwig — poder ascender e produzir trombose séptica.',
    memoria:
      'Duas veias azuis embaixo da língua, uma de cada lado. São as veias mais visíveis do corpo humano.',
    pontos: [
      'Para onde drena a veia lingual profunda?',
      'Por que ela é visível através da mucosa?',
      'Que risco a drenagem dessa região representa?',
    ],
  },
  {
    termos: ['Cavidade Oral Propriamente Dita'],
    classe: 'viscera',
    resumo: 'Espaço interno às arcadas dentárias, do palato ao assoalho da boca.',
    localizacao: 'Limitada pelas arcadas dentárias à frente e nos lados, pelo palato acima, pela língua e pelo assoalho abaixo, e pelo istmo das fauces atrás.',
    funcao: 'Aloja a língua e é onde ocorre a mastigação, a formação do bolo alimentar e a fase oral da deglutição.',
    vascularizacao:
      'Artérias lingual, facial e maxilar, todas da carótida externa, com anastomoses generosas através da linha média — a razão de a mucosa oral cicatrizar mais rápido que qualquer outro epitélio e de a cirurgia oral sangrar tanto.',
    inervacao:
      'Palato e arcada superior pelo nervo maxilar (V2); assoalho, arcada inferior e dois terços anteriores da língua pelo mandibular (V3). Gustação pela corda do tímpano (VII) à frente do sulco terminal e pelo glossofaríngeo (IX) atrás dele.',
    relacoes: 'Comunica-se com o vestíbulo pelos espaços interdentais e pelo espaço retromolar.',
    clinica:
      'A comunicação pelo espaço retromolar é a via pela qual se alimenta e se hidrata o paciente com trismo ou com bloqueio maxilomandibular — detalhe prático que decorre diretamente da anatomia. E é a cavidade oral própria que se avalia na classificação de Mallampati, preditora de via aérea difícil.',
    memoria:
      'Mesmo com os dentes cerrados, existe um caminho atrás do último molar. É por ele que se alimenta quem está com a boca fechada por fio.',
    pontos: [
      'Que estruturas delimitam a cavidade oral própria?',
      'Como ela se comunica com o vestíbulo?',
      'Que aplicação prática essa comunicação tem?',
    ],
  },
  {
    termos: ['Ápice da Língua'],
    classe: 'viscera',
    resumo: 'Ponta livre e móvel da língua, a região de maior sensibilidade tátil do corpo.',
    localizacao: 'Extremidade anterior da língua, em contato com os incisivos.',
    funcao: 'Realiza os movimentos mais finos da articulação da fala e da manipulação do alimento; tem a maior densidade de mecanorreceptores por área do organismo.',
    vascularizacao:
      'Artérias profundas da língua, ramos terminais da lingual, que se anastomosam livremente através da linha média — exceção à regra do septo lingual, que é avascular no restante do órgão. É por isso que a ponta da língua sangra tanto quando mordida.',
    inervacao: 'Sensibilidade geral pelo nervo lingual (V3) e gustativa pela corda do tímpano (VII).',
    clinica:
      'Essa densidade de receptores explica a discriminação de dois pontos de cerca de 1 mm na ponta da língua, e é a base do teste clássico de sensibilidade. A drenagem linfática do ápice é bilateral e vai para os linfonodos submentuais — motivo pelo qual o câncer da ponta da língua exige esvaziamento cervical dos dois lados, ao contrário do de borda lateral.',
    memoria:
      'A ponta da língua é a região mais sensível do corpo, e drena para os dois lados. Tumor ali exige olhar os dois pescoços.',
    pontos: [
      'Por que o ápice da língua é tão sensível?',
      'Qual sua inervação sensitiva e gustativa?',
      'Para onde drena sua linfa?',
    ],
  },
  {
    termos: ['Sulco Terminal'],
    classe: 'viscera',
    resumo: 'Sulco em V na face dorsal da língua que separa o corpo da raiz.',
    localizacao: 'Dorso da língua, com o vértice do V apontando para trás, onde está o forame cego.',
    funcao: 'Marca a fronteira entre a porção oral e a faríngea da língua — porções de origem embriológica e inervação distintas.',
    vascularizacao: 'Artéria lingual nas duas vertentes, com ramos dorsais da língua irrigando a mucosa de cada lado.',
    inervacao:
      'É a fronteira mais importante da língua, e a razão é embriológica: à frente dele, derivado dos arcos faríngeos 1 e 2, a sensibilidade é do lingual (V3) e o gosto é da corda do tímpano (VII); atrás dele, derivado dos arcos 3 e 4, tanto a sensibilidade quanto o gosto são do glossofaríngeo (IX). Uma linha em V que separa dois nervos e duas origens.',
    relacoes: 'À sua frente alinham-se as papilas circunvaladas; no seu vértice está o forame cego.',
    clinica:
      'É o divisor de tudo o que importa na língua: à frente, primeiro arco faríngeo, sensibilidade pelo V3 e gustação pelo VII; atrás, terceiro arco, tudo pelo IX. Uma única linha explica por que a perda de gosto no terço posterior aponta para o glossofaríngeo, enquanto nos dois terços anteriores aponta para o facial — e, portanto, para a orelha média.',
    memoria:
      'Um V no dorso da língua separa dois mundos: na frente é VII e V3; atrás é IX. A linha é a fronteira embrionária.',
    pontos: [
      'Que porções da língua o sulco terminal separa?',
      'Que arcos faríngeos originam cada porção?',
      'Como isso se traduz na inervação?',
    ],
  },
  {
    termos: ['Papila Circunvalada'],
    classe: 'viscera',
    resumo: 'Papilas grandes e circundadas por um sulco, dispostas em V à frente do sulco terminal.',
    localizacao: 'Dorso da língua, em número de 7 a 12, alinhadas imediatamente à frente do sulco terminal.',
    funcao:
      'Contêm a maior parte dos botões gustativos da língua, nas paredes laterais do sulco que as circunda. As glândulas serosas de von Ebner desembocam no fundo do sulco e lavam continuamente os botões, permitindo a percepção de sabores sucessivos.',
    vascularizacao:
      'Ramos dorsais da artéria lingual, com um plexo denso ao redor do sulco de cada papila — necessário para renovar continuamente o líquido que banha os botões gustativos das glândulas de von Ebner.',
    inervacao: 'Nervo glossofaríngeo (IX), apesar de estarem à frente do sulco terminal — exceção que a embriologia explica.',
    clinica:
      'Essa inervação pelo IX, apesar da posição anterior, é a pegadinha clássica: elas migraram para a frente durante o desenvolvimento, mas mantiveram a inervação de origem. Por serem grandes e visíveis, são frequentemente confundidas pelo próprio paciente com tumores — a "cancerofobia lingual" é um motivo comum de consulta, resolvida com uma explicação anatômica.',
    memoria:
      'Estão na frente do V mas obedecem ao nervo de trás. Migraram, mas não trocaram de chefe.',
    pontos: [
      'Onde se localizam as papilas circunvaladas?',
      'Que nervo as inerva e por que isso surpreende?',
      'Qual a função das glândulas de von Ebner?',
    ],
  },
  {
    termos: ['Valécula Epiglótica'],
    classe: 'viscera',
    resumo: 'Depressão entre a raiz da língua e a epiglote, de cada lado da prega glossoepiglótica mediana.',
    localizacao: 'Entre a base da língua e a face anterior da epiglote, delimitada pelas pregas glossoepiglóticas.',
    funcao: 'Recolhe temporariamente a saliva e pequenas quantidades de alimento antes da deglutição.',
    vascularizacao: 'Ramos da artéria lingual e da faríngea ascendente, num plexo submucoso delicado.',
    inervacao:
      'Nervo glossofaríngeo (IX) e laríngeo interno (X) — os dois nervos do reflexo de vômito e do reflexo de fechamento glótico. É por isso que tocar a valécula em paciente pouco anestesiado provoca engasgo e laringoespasmo, e por que a anestesia tópica antes da laringoscopia acordada precisa alcançar esta região.',
    relacoes: 'É o ponto onde a lâmina curva do laringoscópio é apoiada.',
    clinica:
      'Esse detalhe é o coração da laringoscopia: com a lâmina curva (Macintosh), a ponta vai à valécula e a tração do ligamento hioepiglótico levanta a epiglote indiretamente; com a lâmina reta (Miller), a epiglote é calçada diretamente. Saber a diferença é a diferença entre ver e não ver a glote. A valécula é também sítio de impactação de corpos estranhos e de estase de saliva na disfagia.',
    memoria:
      'Lâmina curva na valécula, lâmina reta por baixo da epiglote. Duas lâminas, dois pontos de apoio.',
    pontos: [
      'Que estruturas delimitam a valécula?',
      'Como cada tipo de lâmina de laringoscópio a utiliza?',
      'Que função ela exerce na deglutição?',
    ],
  },
  {
    termos: ['Prega Glossoepiglótica Mediana'],
    classe: 'viscera',
    resumo: 'Pregas de mucosa que unem a raiz da língua à epiglote e delimitam as valéculas.',
    localizacao: 'A mediana, na linha média, separa as duas valéculas; as laterais formam suas bordas externas.',
    funcao: 'Sustentam a epiglote em relação à língua; a prega mediana recobre o ligamento glossoepiglótico.',
    vascularizacao:
      'Ramos da artéria lingual. É a prega ímpar, na linha média, que liga a raiz da língua à epiglote e contém o ligamento glossoepiglótico.',
    inervacao:
      'Nervo laríngeo interno, ramo do laríngeo superior (X), com contribuição do glossofaríngeo. Pressionar esta prega com a ponta da lâmina de Macintosh traciona o ligamento e levanta a epiglote indiretamente — a manobra que expõe a glote sem tocar na epiglote.',
    relacoes: 'O ligamento hioepiglótico, mais profundo, é o que transmite a tração do laringoscópio.',
    clinica:
      'A prega glossoepiglótica mediana é o marco visual que confirma a posição correta da lâmina curva na linha média — se ela aparece deslocada, a lâmina está lateralizada e a visão da glote será ruim. É um dos pontos de referência ensinados em todo treinamento de via aérea.',
    memoria:
      'Uma prega no meio, duas valéculas dos lados. Se a prega não está no centro do seu campo, a lâmina está torta.',
    pontos: [
      'Que estruturas as pregas glossoepiglóticas unem?',
      'Que espaços elas delimitam?',
      'Que utilidade prática têm na laringoscopia?',
    ],
  },
  {
    termos: ['Istmo das Fauces'],
    classe: 'viscera',
    resumo: 'Passagem entre a cavidade oral e a orofaringe, delimitada pelos arcos palatinos.',
    localizacao: 'Entre o palato mole acima, os arcos palatoglossos nos lados e a raiz da língua abaixo.',
    funcao: 'É a fronteira funcional entre a boca e a faringe, e o ponto onde a deglutição deixa de ser voluntária e se torna reflexa.',
    vascularizacao:
      'Artéria tonsilar, ramo da facial, principal vaso da tonsila palatina, com contribuição da palatina ascendente, da faríngea ascendente e da lingual dorsal. Cinco artérias convergindo — a razão de a hemorragia pós-amigdalectomia ser a complicação temida e às vezes exigir ligadura da carótida externa.',
    inervacao: 'Nervo glossofaríngeo — a mucosa do istmo é a zona de gatilho do reflexo de deglutição e de vômito.',
    clinica:
      'Essa transição do voluntário para o reflexo é o que estrutura toda a avaliação da disfagia: alterações antes do istmo são de fase oral (preparo do bolo, escape), e depois dele, de fase faríngea (atraso do disparo, aspiração). É também o istmo que se avalia no Mallampati e que se estreita nas faringoplastias para apneia.',
    memoria:
      'Passou do istmo, a deglutição não volta atrás: vira reflexo. É a linha entre o que você controla e o que o corpo faz.',
    pontos: [
      'Que estruturas delimitam o istmo das fauces?',
      'Que transição funcional ocorre nele?',
      'Que nervo medeia o reflexo dessa região?',
    ],
  },
  {
    termos: ['Úvula Palatina'],
    classe: 'viscera',
    resumo: 'Projeção mediana pendente da borda posterior do palato mole.',
    localizacao: 'Linha média da borda livre do palato mole, contendo o músculo da úvula.',
    funcao: 'Contribui para o fechamento velofaríngeo e para a produção de secreção; sua elevação é o sinal visível da contração do palato.',
    vascularizacao:
      'Artéria palatina menor, ramo da palatina descendente, e ramos da palatina ascendente. Sua submucosa frouxa e rica em vasos é o que permite o edema volumoso e rápido do angioedema.',
    inervacao: 'Plexo faríngeo (nervo vago).',
    clinica:
      'Pedir ao paciente que diga "a" e observar a úvula é o teste do X par: na paralisia unilateral, ela desvia para o lado sadio. A úvula alongada e edemaciada contribui para o ronco e é ressecada na uvulopalatofaringoplastia. A úvula bífida é sinal de palato submucoso, e sua identificação é obrigatória antes de indicar adenoidectomia, pelo risco de insuficiência velofaríngea.',
    memoria:
      'A úvula bífida é a ponta do iceberg: pode haver fenda submucosa escondida. Nunca tire a adenoide sem olhar o palato.',
    pontos: [
      'Como se avalia o nervo vago pela úvula?',
      'Que estrutura a úvula bífida denuncia?',
      'Por que isso importa antes da adenoidectomia?',
    ],
  },
  /* ─────────────────── Dentes ─────────────────── */
  {
    termos: ['Incisivos'],
    classe: 'dente',
    resumo: 'Dentes anteriores de borda cortante, quatro em cada arcada, para cortar o alimento.',
    localizacao: 'Região anterior das arcadas: dois centrais e dois laterais em cada uma.',
    funcao: 'Cortam o alimento e são essenciais à fonética das consoantes labiodentais e à estética do sorriso.',
    vascularizacao:
      'Artérias alveolares superiores anteriores, ramos do infraorbital, nos superiores, e artéria alveolar inferior, ramo da maxilar, nos inferiores. Cada dente recebe uma arteríola terminal única que entra pelo forame apical — sem colateral nenhuma, e é essa a razão anatômica de a necrose pulpar ser irreversível.',
    inervacao: 'Nervos alveolares superiores anteriores (V2) em cima; alveolar inferior (V3) embaixo.',
    relacoes: 'O incisivo central superior é o dente de raiz mais longa da região anterior; o incisivo lateral superior é o mais variável em forma.',
    clinica:
      'São os dentes mais fraturados em traumatismos, sobretudo o incisivo central superior. A regra da avulsão é anatômica: o dente permanente avulsionado deve ser reimplantado nos primeiros 30 a 60 minutos, manipulado apenas pela coroa, para preservar as células do ligamento periodontal na superfície radicular — se elas morrem, ocorre anquilose e reabsorção. Dente decíduo avulsionado nunca se reimplanta, pelo risco ao germe permanente.',
    memoria:
      'Dente permanente que caiu: segure pela coroa, lave rápido e reimplante. O tempo é o ligamento periodontal morrendo.',
    pontos: [
      'Quantos incisivos existem em cada arcada?',
      'Qual a conduta na avulsão de um dente permanente?',
      'Por que não se reimplanta um dente decíduo?',
    ],
  },
  {
    termos: ['Canino'],
    classe: 'dente',
    resumo: 'Dente de cúspide única e raiz mais longa de toda a dentição, um em cada quadrante.',
    localizacao: 'Entre o incisivo lateral e o primeiro pré-molar, no ângulo da arcada.',
    funcao:
      'Rasga o alimento e, sobretudo, guia a oclusão: na lateralidade mandibular, o canino desocluí todos os outros dentes, protegendo-os das forças laterais. É a "guia canina".',
    vascularizacao:
      'Artéria alveolar superior anterior no canino superior e alveolar inferior no inferior. Tem a raiz mais longa de toda a dentição, e por isso a arteríola apical que o nutre percorre o maior trajeto intraósseo.',
    inervacao:
      'Nervo alveolar superior anterior (V2) em cima e alveolar inferior (V3) embaixo. A eminência canina que sua raiz produz na maxila é o reparo da fossa canina — via de acesso ao seio maxilar na cirurgia de Caldwell-Luc.',
    relacoes: 'Sua raiz longa produz a eminência canina na face vestibular da maxila.',
    clinica:
      'É o último dente anterior a irromper e, por isso, o mais frequentemente incluso depois do siso — a inclusão de canino superior é um dos problemas ortodônticos mais comuns e exige tracionamento cirúrgico-ortodôntico. A perda da guia canina sobrecarrega os posteriores e acelera o desgaste. A fossa canina é ainda a via de acesso à antrostomia maxilar por Caldwell-Luc.',
    memoria:
      'O canino é o dente mais comprido e o "para-choque" da mordida lateral. Perdeu a guia canina, os molares pagam a conta.',
    pontos: [
      'Que particularidade tem a raiz do canino?',
      'O que é a guia canina?',
      'Por que ele é frequentemente incluso?',
    ],
  },
  {
    termos: ['Pré-molares'],
    classe: 'dente',
    resumo: 'Dentes de transição com duas cúspides, dois em cada quadrante, exclusivos da dentição permanente.',
    localizacao: 'Entre o canino e os molares; substituem os molares decíduos.',
    funcao: 'Combinam corte e trituração; o primeiro pré-molar superior costuma ter duas raízes, os demais têm uma.',
    vascularizacao:
      'Artéria alveolar superior média, ramo do infraorbital, nos superiores, e alveolar inferior nos inferiores. As raízes dos pré-molares inferiores ficam a poucos milímetros do forame mentual.',
    inervacao:
      'Nervo alveolar superior médio (V2) em cima; nervo alveolar inferior (V3) embaixo, com o ramo mentual emergindo entre os ápices dos dois pré-molares — relação que faz da cirurgia dessa região a de maior risco de parestesia do lábio inferior.',
    relacoes: 'Os ápices dos pré-molares superiores frequentemente se relacionam com o assoalho do seio maxilar.',
    clinica:
      'São os dentes mais extraídos por indicação ortodôntica, para criar espaço no arco. Sua relação com o seio maxilar explica por que a extração pode abrir comunicação bucossinusal, e por que um abscesso periapical desses dentes pode se manifestar como sinusite maxilar unilateral — sinusite de um lado só, com dor dentária, é odontogênica até prova em contrário.',
    memoria:
      'Sinusite maxilar unilateral em adulto: olhe os dentes antes de olhar o nariz.',
    pontos: [
      'Quantos pré-molares existem em cada quadrante?',
      'Que relação eles têm com o seio maxilar?',
      'Por que sinusite unilateral sugere origem dentária?',
    ],
  },
  {
    termos: ['Molares'],
    classe: 'dente',
    resumo: 'Dentes posteriores multicuspidados e multirradiculares, responsáveis pela trituração.',
    localizacao: 'Três em cada quadrante na dentição permanente; os superiores com três raízes, os inferiores com duas.',
    funcao:
      'Trituram o alimento e sustentam a dimensão vertical da oclusão. O primeiro molar permanente irrompe por volta dos 6 anos, sem substituir nenhum decíduo — é a "chave da oclusão" de Angle.',
    vascularizacao:
      'Artérias alveolares superiores posteriores, ramos diretos da maxilar, nos superiores, e artéria alveolar inferior, no canal mandibular, nos inferiores. A proximidade das raízes dos molares superiores com o assoalho do seio maxilar é a razão de a infecção periapical evoluir para sinusite odontogênica e de a extração poder abrir comunicação buco-sinusal.',
    inervacao: 'Nervos alveolares superiores posteriores e médio (V2); alveolar inferior (V3).',
    relacoes: 'As raízes dos molares superiores projetam-se no seio maxilar; as dos inferiores, próximas ao canal mandibular.',
    clinica:
      'Como o primeiro molar irrompe cedo e não substitui ninguém, ele é frequentemente confundido com dente de leite e negligenciado — e acaba sendo o dente mais cariado da dentição. O terceiro molar é o mais frequentemente incluso, e sua relação com o canal mandibular é o que se avalia na tomografia antes da exodontia: a proximidade prevê o risco de parestesia do lábio inferior.',
    memoria:
      'O primeiro molar nasce aos 6 anos e não substitui nenhum dente de leite. Muita gente o perde por achar que vai cair sozinho.',
    pontos: [
      'Por que o primeiro molar permanente é a chave da oclusão?',
      'Que relação anatômica preocupa na extração do terceiro molar inferior?',
      'Quantas raízes têm os molares superiores e inferiores?',
    ],
  },
  {
    termos: ['Coroa do Dente'],
    classe: 'dente',
    resumo: 'Porção do dente revestida por esmalte e visível acima da gengiva.',
    localizacao: 'Do colo do dente para cima, projetando-se na cavidade oral.',
    funcao:
      'Revestida pelo esmalte, o tecido mais duro e mais mineralizado do corpo — cerca de 96% de mineral — e o único de origem epitelial, produzido pelos ameloblastos, que desaparecem após a erupção.',
    vascularizacao:
      'O esmalte é acelular e completamente avascular — o único tecido do corpo que não se regenera de forma alguma, porque os ameloblastos que o produziram morrem quando o dente irrompe. A dentina sob ele é nutrida indiretamente, pelos prolongamentos dos odontoblastos que partem da polpa.',
    inervacao:
      'Fibras do plexo dentário, ramos dos nervos alveolares (V2 e V3), que só alcançam a polpa e o terço interno da dentina. Toda dor de dente é dor de polpa, e o esmalte é insensível — a sensibilidade ao frio aparece quando o desgaste expõe os túbulos dentinários.',
    relacoes: 'Sob o esmalte está a dentina, e no centro, a câmara pulpar.',
    clinica:
      'Que os ameloblastos morram após a erupção é o fato que define toda a odontologia preventiva: o esmalte não se regenera, e qualquer perda é definitiva. A fluoretação funciona porque converte a hidroxiapatita em fluorapatita, mais resistente ao ácido, e a remineralização precoce da lesão de cárie é possível justamente antes da cavitação — depois dela, só restauração.',
    memoria:
      'Esmalte não volta: a célula que o faz morre quando o dente nasce. É o único tecido do corpo que não se repara.',
    pontos: [
      'Qual a composição e a origem do esmalte?',
      'Por que ele não se regenera?',
      'Como o flúor protege o dente?',
    ],
  },
  {
    termos: ['Colo do Dente'],
    classe: 'dente',
    resumo: 'Junção entre a coroa e a raiz, onde o esmalte encontra o cemento.',
    localizacao: 'Ao nível da margem gengival, na junção amelocementária.',
    funcao: 'É a transição entre os dois revestimentos do dente e o ponto de referência para medir a perda de inserção periodontal.',
    vascularizacao:
      'Ramos gengivais das artérias alveolares e do plexo gengival, que formam um anel vascular ao redor do dente sob a gengiva marginal. É esse plexo que sangra à sondagem — o sinal mais precoce e mais confiável de gengivite.',
    inervacao:
      'Ramos gengivais dos nervos alveolares (V2 e V3). É a linha em que esmalte e cemento se encontram, e onde a recessão gengival expõe uma superfície sem esmalte, sensível e vulnerável à cárie radicular.',
    relacoes: 'Em cerca de 10% dos dentes existe uma pequena faixa de dentina exposta, sem cobertura de esmalte nem de cemento.',
    clinica:
      'Essa faixa é uma das explicações da hipersensibilidade cervical, junto com a recessão gengival e a abfração. É também no colo que se instalam as lesões cervicais não cariosas, e é a partir dele que se mede a perda de inserção, o parâmetro que define a gravidade da periodontite — mais confiável que a profundidade de sondagem isolada.',
    memoria:
      'Onde o esmalte acaba e o cemento começa. Quando a gengiva recua e expõe essa junção, o dente dói com o frio.',
    pontos: [
      'O que é a junção amelocementária?',
      'Por que ela pode causar hipersensibilidade?',
      'Que parâmetro periodontal é medido a partir dela?',
    ],
  },
  {
    termos: [
      'Lábio Inferior',
    ],
    classe: 'viscera',
    resumo:
      'Lábio de baixo — e, apesar da simetria aparente, um território de nervo, de linfa e de risco oncológico diferente do superior.',
    localizacao: 'Da comissura labial de um lado à do outro, limitado abaixo pelo sulco mentolabial.',
    funcao:
      'Contém o músculo orbicular da boca e é o principal responsável pela competência labial — manter a boca fechada e o alimento dentro. É também o lábio que mais se move na fala e o mais exposto ao sol na posição ereta.',
    vascularizacao:
      'Artéria labial inferior, ramo da facial, que corre entre o músculo orbicular e a mucosa — mais profunda do que se imagina, o que é justamente o que a torna difícil de comprimir por fora numa laceração.',
    inervacao:
      'Nervo mentual, ramo terminal do alveolar inferior (V3), que emerge do forame mentual entre os ápices dos pré-molares. É a divisão MANDIBULAR do trigêmeo — enquanto o lábio superior é da maxilar.',
    linfaticos:
      'Aqui está a distinção que decide conduta: o terço MÉDIO do lábio inferior drena para os linfonodos SUBMENTUAIS, e as porções laterais para os submandibulares. Drenagem bilateral no meio — e é por isso que um tumor de linha média do lábio inferior exige avaliação dos dois lados do pescoço.',
    relacoes: 'O forame mentual, por onde sai seu nervo, fica a poucos milímetros do ápice do segundo pré-molar.',
    clinica:
      'O lábio inferior concentra mais de 90% dos cânceres de lábio, e a razão é a exposição solar: em pé, ele recebe a luz de frente, enquanto o superior fica na sombra do nariz. O tumor típico é carcinoma espinocelular em homem de meia-idade com exposição ocupacional, e a drenagem submentual da linha média é o que orienta o esvaziamento. Já a parestesia do lábio inferior após extração de terceiro molar é lesão do alveolar inferior no canal mandibular — complicação que a tomografia pré-operatória existe para prevenir.',
    memoria:
      'Lábio de baixo pega sol e pega câncer; lábio de cima fica na sombra do nariz. E o de baixo drena para o submentual, dos dois lados.',
    pontos: [
      'Que nervo inerva o lábio inferior?',
      'Para onde drena a linfa do terço médio do lábio inferior?',
      'Por que o câncer de lábio é quase sempre no lábio inferior?',
    ],
  },
  {
    termos: [
      'Frênulo do Lábio Inferior',
    ],
    classe: 'viscera',
    resumo:
      'Prega mucosa mediana que une o lábio inferior à gengiva — mais discreta que a superior, e com outro problema.',
    localizacao:
      'Na linha média do vestíbulo inferior, entre a face interna do lábio inferior e a gengiva dos incisivos centrais inferiores.',
    funcao:
      'Limita a tração do lábio e ancora a mucosa móvel à gengiva. É menos desenvolvido que o superior e raramente se insere entre os dentes.',
    vascularizacao: 'Ramos da artéria labial inferior, da facial, num plexo submucoso fino.',
    inervacao:
      'Nervo mentual, ramo do alveolar inferior (V3) — e não o infraorbital (V2), que inerva o frênulo superior.',
    linfaticos: 'Linfonodos submentuais.',
    relacoes:
      'Sua inserção pode alcançar a gengiva inserida, o que traciona a margem gengival a cada movimento do lábio.',
    clinica:
      'Ao contrário do frênulo superior, que produz diastema, o inferior causa outro problema: quando se insere alto, na gengiva inserida, ele traciona a margem gengival dos incisivos inferiores a cada fala e a cada sorriso, e essa tração repetida produz recessão gengival progressiva, com exposição de raiz e sensibilidade. O tratamento é a frenectomia associada a enxerto gengival — corrigir a tração não devolve a gengiva perdida.',
    memoria:
      'Frênulo de cima abre diastema; frênulo de baixo puxa a gengiva e a faz recuar. Mesma prega, dois estragos diferentes.',
    pontos: [
      'Que nervo inerva o frênulo do lábio inferior?',
      'Que problema sua inserção alta produz?',
      'Como isso difere do frênulo superior?',
    ],
  },
  {
    termos: [
      'Gengiva Labial Inferior',
    ],
    classe: 'viscera',
    resumo: 'Gengiva que reveste o processo alveolar mandibular pela face voltada ao lábio.',
    localizacao:
      'Face vestibular do processo alveolar da mandíbula, na região anterior, do fundo do vestíbulo até a margem gengival dos incisivos e caninos inferiores.',
    funcao:
      'Divide-se em gengiva inserida, firmemente aderida ao osso e queratinizada, e mucosa alveolar, móvel e não queratinizada, separadas pela linha mucogengival. Só a inserida resiste ao atrito da escovação e da mastigação.',
    vascularizacao:
      'Ramos da artéria alveolar inferior, que emergem pelo forame mentual, e da artéria submentual. A faixa de gengiva inserida é fina na região anterior inferior — a mais estreita de toda a boca.',
    inervacao: 'Nervo mentual e incisivo, ramos do alveolar inferior (V3).',
    linfaticos: 'Linfonodos submentuais e submandibulares.',
    relacoes: 'É a região de menor espessura de osso alveolar vestibular de toda a arcada.',
    clinica:
      'A combinação de faixa estreita de gengiva inserida, osso vestibular fino e tração do frênulo faz desta a área de maior risco de recessão gengival da boca — a raiz exposta do incisivo inferior é o achado mais comum da periodontia. É também por essa fragilidade que o implante na região anterior inferior exige avaliação de espessura óssea: um osso vestibular de menos de 1 mm reabsorve e expõe a rosca.',
    memoria:
      'Gengiva de baixo, na frente, é a mais fina de todas e ainda leva puxão do frênulo. Por isso é onde a raiz aparece primeiro.',
    pontos: [
      'Qual a diferença entre gengiva inserida e mucosa alveolar?',
      'Que nervo inerva a gengiva labial inferior?',
      'Por que a recessão gengival é mais comum nesta região?',
    ],
  },
  {
    termos: [
      'Prega Glossoepiglótica Lateral',
    ],
    classe: 'viscera',
    resumo: 'Cada uma das duas pregas pares que ligam a lateral da epiglote à parede da faringe.',
    localizacao:
      'De cada lado, da borda lateral da epiglote à parede lateral da faringe, delimitando externamente as valéculas.',
    funcao:
      'Delimitam lateralmente as duas valéculas. Ao contrário da prega mediana, não contêm ligamento nenhum que ligue a epiglote à língua — são apenas dobras de mucosa.',
    vascularizacao: 'Ramos da artéria lingual e da faríngea ascendente.',
    inervacao: 'Nervo laríngeo interno (X) e glossofaríngeo (IX).',
    linfaticos: 'Linfonodos cervicais profundos superiores, bilateralmente.',
    relacoes: 'Marcam a fronteira entre a base da língua, medialmente, e o recesso piriforme, lateralmente.',
    clinica:
      'A diferença entre a prega mediana e as laterais decide se a laringoscopia dá certo. A ponta da lâmina de Macintosh é apoiada na valécula e a tração levanta a epiglote porque traciona o ligamento glossoepiglótico MEDIANO. Apoiar a lâmina lateralmente, sobre uma prega lateral, traciona mucosa sem ligamento nenhum: a epiglote não sobe e a glote não aparece. É a diferença entre uma intubação limpa e uma laringoscopia difícil por erro de posicionamento.',
    memoria: 'Só a prega do meio tem ligamento e levanta a epiglote. Apoiar a lâmina de lado é puxar mucosa à toa.',
    pontos: [
      'O que as pregas glossoepiglóticas laterais delimitam?',
      'Por que elas não levantam a epiglote?',
      'Onde a lâmina do laringoscópio deve ser apoiada?',
    ],
  },
  {
    termos: [
      'Incisivo Central',
    ],
    classe: 'dente',
    resumo: 'O dente mais anterior e mediano da arcada, e o primeiro a irromper na dentição permanente.',
    localizacao:
      'Adjacente à linha média, um de cada lado, em ambas as arcadas. O central superior é o maior dos incisivos; o central inferior é o menor dente da boca.',
    funcao:
      'Corta o alimento com sua borda incisal. É também o dente que mais define a estética do sorriso e o que mais participa da articulação dos fonemas dentais e labiodentais.',
    vascularizacao:
      'Artéria alveolar superior anterior nos superiores e artéria alveolar inferior, pelo ramo incisivo, nos inferiores. Recebe uma única arteríola pelo forame apical.',
    inervacao:
      'Nervo alveolar superior anterior (V2) em cima; ramo incisivo do alveolar inferior (V3) embaixo. O nervo nasopalatino inerva a gengiva palatina correspondente.',
    linfaticos: 'Linfonodos submentuais nos inferiores e submandibulares nos superiores.',
    relacoes: 'Raiz única e cônica; a raiz do central superior está a poucos milímetros do assoalho da cavidade nasal.',
    clinica:
      'É o dente mais traumatizado do corpo: responde sozinho por cerca de 80% das fraturas dentárias, pela posição de vanguarda na arcada. Uma avulsão de incisivo central permanente é urgência de minutos — o dente deve ser reimplantado no alvéolo em até uma hora, transportado em leite ou soro e nunca em água, para preservar as células do ligamento periodontal. Reimplantado a tempo, ele pega; depois disso, anquilosa.',
    memoria:
      'É o dente da frente e o que mais quebra. Caiu inteiro: bota de volta no buraco em menos de uma hora, transportado no leite.',
    pontos: [
      'Que nervo inerva o incisivo central superior?',
      'Por que ele é o dente mais traumatizado?',
      'Como se conduz uma avulsão dentária?',
    ],
  },
  {
    termos: [
      'Incisivo Lateral',
    ],
    classe: 'dente',
    resumo: 'Segundo dente a partir da linha média, menor que o central e o mais variável da arcada.',
    localizacao: 'Entre o incisivo central e o canino, em ambas as arcadas.',
    funcao:
      'Complementa o corte do alimento. É o dente de maior variação anatômica da boca: pode ser conoide, reduzido, ou simplesmente ausente por agenesia.',
    vascularizacao: 'Artéria alveolar superior anterior em cima; ramo incisivo da alveolar inferior embaixo.',
    inervacao: 'Nervo alveolar superior anterior (V2) e ramo incisivo do alveolar inferior (V3).',
    linfaticos: 'Linfonodos submandibulares e submentuais.',
    relacoes:
      'Sua raiz é a mais delgada e frequentemente curva distalmente — detalhe que dificulta o tratamento endodôntico.',
    clinica:
      'A agenesia do incisivo lateral superior é a segunda ausência dentária mais comum, depois dos terceiros molares, e tem forte componente hereditário. Sua importância vai além do dente: em pacientes com fenda labiopalatina, a fenda passa exatamente na região do incisivo lateral, que costuma estar ausente, duplicado ou malformado — a linha da fenda embrionária entre o processo nasal medial e o maxilar. O dente denuncia a costura.',
    memoria:
      'O incisivo lateral é a testemunha da fenda embrionária: é bem ali que o palato primário se soldou ao secundário.',
    pontos: [
      'Por que o incisivo lateral é o dente mais variável?',
      'Que relação ele tem com a fenda labiopalatina?',
      'Qual a segunda agenesia dentária mais comum?',
    ],
  },
  {
    termos: [
      '1° Pré-Molar',
    ],
    classe: 'dente',
    resumo: 'Primeiro dente da região posterior, com duas cúspides — e, no superior, frequentemente duas raízes.',
    localizacao: 'Imediatamente atrás do canino, em ambas as arcadas. Substitui o primeiro molar decíduo.',
    funcao:
      'Faz a transição entre cortar e triturar: tem uma cúspide vestibular pontiaguda, herdeira da função do canino, e uma palatina ou lingual menor, que já participa da trituração.',
    vascularizacao: 'Artéria alveolar superior média nos superiores; artéria alveolar inferior nos inferiores.',
    inervacao: 'Nervo alveolar superior médio (V2) em cima; alveolar inferior (V3) embaixo.',
    linfaticos: 'Linfonodos submandibulares.',
    relacoes:
      'O primeiro pré-molar de cima tem duas raízes em cerca de 60% dos casos — vestibular e palatina —, o que o distingue do segundo, geralmente unirradicular.',
    clinica:
      'É o dente mais extraído do mundo por indicação ortodôntica: quando falta espaço na arcada, é ele que se sacrifica, porque sua remoção abre espaço no ponto mais estratégico sem comprometer estética nem mastigação. E a presença de duas raízes no superior é a razão de sua endodontia ser mais complexa do que o tamanho do dente sugere — dois canais, um deles frequentemente esquecido.',
    memoria:
      'É o dente que a ortodontia sacrifica quando falta espaço. E o de cima tem duas raízes — dois canais para achar.',
    pontos: [
      'Quantas cúspides e quantas raízes tem o primeiro pré-molar superior?',
      'Que nervo inerva os pré-molares superiores?',
      'Por que ele é o dente mais extraído por indicação ortodôntica?',
    ],
  },
  {
    termos: [
      '2° Pré-Molar',
    ],
    classe: 'dente',
    resumo: 'Segundo pré-molar, geralmente de raiz única — e o dente com maior risco de lesão nervosa na sua extração.',
    localizacao: 'Entre o primeiro pré-molar e o primeiro molar, em ambas as arcadas.',
    funcao:
      'Tem duas cúspides de altura mais parecida que as do primeiro, o que aumenta sua eficiência trituradora. É o dente que mais se assemelha, em função, a um molar pequeno.',
    vascularizacao: 'Artéria alveolar superior média em cima; alveolar inferior embaixo.',
    inervacao: 'Nervo alveolar superior médio (V2) em cima; alveolar inferior (V3) embaixo.',
    linfaticos: 'Linfonodos submandibulares.',
    relacoes:
      'Sua raiz inferior está imediatamente acima do forame mentual, e a raiz superior costuma projetar-se no assoalho do seio maxilar.',
    clinica:
      'Duas vizinhanças perigosas, uma em cada arcada. Embaixo, o forame mentual: a extração ou o implante nessa região arrisca o nervo mentual, com parestesia definitiva do lábio inferior e do mento — motivo de a tomografia ser obrigatória antes do implante aqui. Em cima, o seio maxilar: a extração pode abrir comunicação buco-sinusal, que não fecha sozinha se maior que 2 mm e exige retalho. É também o dente com maior taxa de agenesia depois do terceiro molar e do incisivo lateral.',
    memoria:
      'Segundo pré-molar de baixo mora em cima do forame mentual; o de cima mora embaixo do seio. Extrair sem imagem é apostar.',
    pontos: [
      'Que estrutura está imediatamente abaixo da raiz do segundo pré-molar inferior?',
      'Que complicação a extração do superior pode produzir?',
      'Como ele difere do primeiro pré-molar?',
    ],
  },
  {
    termos: [
      '1° Molar',
    ],
    classe: 'dente',
    resumo: 'O maior e mais importante dente da arcada — e o primeiro permanente a irromper, aos seis anos.',
    localizacao:
      'Atrás do segundo pré-molar. Irrompe por trás do último molar decíduo, sem substituir nenhum dente de leite — motivo pelo qual é tão frequentemente confundido com um dente decíduo pelos pais.',
    funcao:
      'É o dente que suporta a maior carga mastigatória e o que define a chave de oclusão de Angle: a relação entre a cúspide mesiovestibular do primeiro molar superior e o sulco do inferior é a referência de toda classificação ortodôntica.',
    vascularizacao:
      'Artérias alveolares superiores posteriores, ramos diretos da maxilar, nos superiores; alveolar inferior nos inferiores. É o dente de maior volume pulpar da arcada.',
    inervacao:
      'Nervo alveolar superior posterior (V2) em cima; alveolar inferior (V3) embaixo. A raiz mesiovestibular do superior recebe também o alveolar superior médio, e é por isso que a anestesia isolada do posterior às vezes falha nesse dente.',
    linfaticos: 'Linfonodos submandibulares e cervicais profundos superiores.',
    relacoes:
      'Três raízes no superior — duas vestibulares e uma palatina — e duas no inferior, mesial e distal. As raízes do superior projetam-se no assoalho do seio maxilar.',
    clinica:
      'Por irromper aos seis anos, sem substituir dente algum, e com sulcos profundos numa criança que ainda não escova bem, é o dente que mais cariou na história da odontologia — e a razão de existir o selante de fóssulas e fissuras. Sua perda precoce colapsa a oclusão: os dentes vizinhos inclinam e o antagonista extrui, e a reabilitação passa a exigir ortodontia antes da prótese.',
    memoria:
      'Nasce aos seis anos, por trás dos de leite, e ninguém percebe que é permanente. É o dente que mais caria — e o que segura a mordida inteira.',
    pontos: [
      'Por que o primeiro molar é confundido com dente decíduo?',
      'Quantas raízes ele tem em cada arcada?',
      'O que é a chave de oclusão de Angle?',
    ],
  },
  {
    termos: [
      '2° Molar',
    ],
    classe: 'dente',
    resumo: 'Segundo molar permanente, que irrompe por volta dos doze anos, atrás do primeiro.',
    localizacao: 'Entre o primeiro e o terceiro molar, no fundo da arcada.',
    funcao:
      'Complementa a trituração. É menor que o primeiro molar e suas raízes são mais convergentes, às vezes fusionadas — o que facilita a extração e dificulta a endodontia.',
    vascularizacao: 'Artérias alveolares superiores posteriores em cima; alveolar inferior embaixo.',
    inervacao: 'Nervo alveolar superior posterior (V2) em cima; alveolar inferior (V3) embaixo.',
    linfaticos: 'Linfonodos submandibulares e cervicais profundos superiores.',
    relacoes:
      'Suas raízes inferiores estão em contato íntimo com o canal mandibular, e as superiores, com o assoalho do seio maxilar — mais até que as do primeiro molar.',
    clinica:
      'É o dente que mais sofre a consequência do terceiro molar impactado: o siso semi-incluso, inclinado para a frente, cria um nicho entre os dois em que a escova não entra, e o resultado é cárie na face distal do SEGUNDO molar — que é um dente saudável e útil. Perder um segundo molar por causa de um siso é a razão principal de se indicar a extração profilática do terceiro, e a lesão aparece justamente onde a radiografia panorâmica costuma ser mal olhada.',
    memoria:
      'O siso não estraga a si mesmo: estraga o vizinho. A cárie aparece atrás do segundo molar, onde a escova não chega.',
    pontos: [
      'Quando o segundo molar irrompe?',
      'Que relação suas raízes têm com o canal mandibular?',
      'Por que o terceiro molar impactado ameaça o segundo?',
    ],
  },
  {
    termos: [
      '3° Molar',
    ],
    classe: 'dente',
    resumo: 'O dente do siso — último a irromper, mais variável e o mais frequentemente ausente ou impactado.',
    localizacao: 'Extremidade posterior de cada arcada, irrompendo entre os 17 e os 25 anos, quando irrompe.',
    funcao:
      'Função mastigatória hoje residual. É o dente em franca regressão evolutiva: a mandíbula humana encurtou mais depressa que o número de dentes, e o siso ficou sem espaço — daí a agenesia em cerca de 20 a 25% das pessoas e a impactação em boa parte do restante.',
    vascularizacao:
      'Artéria alveolar superior posterior em cima; alveolar inferior embaixo. Coroa e raízes de anatomia imprevisível, com número de raízes variando de uma a quatro.',
    inervacao:
      'Nervo alveolar superior posterior (V2) em cima; alveolar inferior (V3) embaixo, com o nervo LINGUAL correndo na cortical lingual, a poucos milímetros — os dois nervos em risco na exodontia.',
    linfaticos: 'Linfonodos submandibulares e cervicais profundos superiores.',
    relacoes:
      'As raízes do siso inferior podem envolver o canal mandibular; o nervo lingual corre imediatamente medial a ele, às vezes acima da crista óssea.',
    clinica:
      'A extração do siso inferior é a cirurgia oral mais realizada e a de complicação nervosa mais temida: lesão do alveolar inferior produz parestesia do lábio e do mento; lesão do lingual, dormência e perda de gosto em metade da língua. Os sinais radiográficos de proximidade com o canal — escurecimento da raiz, desvio do canal, interrupção da linha cortical — são o que indica tomografia antes de operar. A pericoronarite, infecção do capuz de mucosa sobre um siso semi-incluso, é a razão mais comum de urgência odontológica em adulto jovem.',
    memoria:
      'Dois nervos ao lado de um dente que quase não serve: o alveolar inferior embaixo e o lingual por dentro. É por isso que siso pede tomografia.',
    pontos: [
      'Por que o siso é tão frequentemente impactado?',
      'Que dois nervos correm risco na sua extração?',
      'O que é pericoronarite?',
    ],
  },
]
