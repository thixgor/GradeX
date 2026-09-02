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
    termos: ['Frênulo do Lábio Superior', 'Frênulo do Lábio Inferior'],
    classe: 'viscera',
    resumo: 'Pregas medianas de mucosa que unem cada lábio à gengiva correspondente.',
    localizacao: 'Linha média do vestíbulo, entre o lábio e a gengiva, acima dos incisivos centrais superiores e abaixo dos inferiores.',
    funcao: 'Limitam a tração excessiva do lábio e ajudam a manter o lábio aposto à arcada.',
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
    termos: ['Gengiva Labial Superior', 'Gengiva Labial Inferior'],
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
    termos: ['Prega Glossoepiglótica Mediana', 'Prega Glossoepiglótica Lateral'],
    classe: 'viscera',
    resumo: 'Pregas de mucosa que unem a raiz da língua à epiglote e delimitam as valéculas.',
    localizacao: 'A mediana, na linha média, separa as duas valéculas; as laterais formam suas bordas externas.',
    funcao: 'Sustentam a epiglote em relação à língua; a prega mediana recobre o ligamento glossoepiglótico.',
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
    termos: ['Incisivos', 'Incisivo Central', 'Incisivo Lateral'],
    classe: 'dente',
    resumo: 'Dentes anteriores de borda cortante, quatro em cada arcada, para cortar o alimento.',
    localizacao: 'Região anterior das arcadas: dois centrais e dois laterais em cada uma.',
    funcao: 'Cortam o alimento e são essenciais à fonética das consoantes labiodentais e à estética do sorriso.',
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
    termos: ['Pré-molares', '1° Pré-Molar', '2° Pré-Molar'],
    classe: 'dente',
    resumo: 'Dentes de transição com duas cúspides, dois em cada quadrante, exclusivos da dentição permanente.',
    localizacao: 'Entre o canino e os molares; substituem os molares decíduos.',
    funcao: 'Combinam corte e trituração; o primeiro pré-molar superior costuma ter duas raízes, os demais têm uma.',
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
    termos: ['Molares', '1° Molar', '2° Molar', '3° Molar'],
    classe: 'dente',
    resumo: 'Dentes posteriores multicuspidados e multirradiculares, responsáveis pela trituração.',
    localizacao: 'Três em cada quadrante na dentição permanente; os superiores com três raízes, os inferiores com duas.',
    funcao:
      'Trituram o alimento e sustentam a dimensão vertical da oclusão. O primeiro molar permanente irrompe por volta dos 6 anos, sem substituir nenhum decíduo — é a "chave da oclusão" de Angle.',
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
]
