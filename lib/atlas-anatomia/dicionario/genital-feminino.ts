import type { EntradaDicionario } from './tipos'

/**
 * Sistema genital feminino e mama.
 *
 * A pelve feminina tem uma característica que nenhuma outra região do corpo
 * tem: uma cavidade peritoneal aberta para o exterior, pela tuba, pelo útero e
 * pela vagina. Essa continuidade explica a peritonite de origem genital, a
 * gravidez ectópica e a disseminação do câncer de ovário — e é por ela que
 * começam as fichas desta seção.
 */
export const GENITAL_FEMININO: EntradaDicionario[] = [
  /* ─────────────────── Ovário e tuba ─────────────────── */
  {
    termos: ['Ovário Direito'],
    classe: 'glandula',
    resumo: 'Gônadas femininas, do tamanho de uma amêndoa, suspensas na parede lateral da pelve.',
    localizacao: 'Na fossa ovárica, entre os vasos ilíacos externos e internos; sua superfície é a única víscera abdominal não revestida por peritônio.',
    funcao: 'Produzem os oócitos e os hormônios sexuais; a ovulação rompe a superfície do ovário e libera o oócito diretamente na cavidade peritoneal.',
    inervacao:
      'Plexo ovárico, de fibras simpáticas de T10 a T11 que descem com a artéria ovárica desde a aorta. A dor ovárica refere, portanto, à região periumbilical e ao flanco — e é essa a razão de a torção de ovário ser confundida com apendicite, e de a linfa do ovário ir para os linfonodos lombares, e não para os pélvicos.',
    vascularizacao: 'Artéria ovárica, ramo direto da aorta em L2, e ramo ovárico da artéria uterina — dupla irrigação com anastomose.',
    linfaticos: 'Linfonodos lombares (para-aórticos), como o testículo, pela mesma razão embrionária.',
    relacoes: 'O nervo obturatório corre no assoalho da fossa ovárica, imediatamente lateral ao ovário.',
    clinica:
      'A ausência de revestimento peritoneal é o que permite ao câncer de ovário disseminar-se livremente pela cavidade, com carcinomatose e ascite antes de qualquer sintoma local — a razão do diagnóstico habitualmente tardio. E a vizinhança com o nervo obturatório explica a dor referida na face medial da coxa em processos inflamatórios ovarianos, sinal sutil que costuma passar despercebido.',
    memoria:
      'O ovário é o único órgão que "abre" na cavidade peritoneal a cada ciclo. É por essa porta que o tumor se espalha.',
    pontos: [
      'Por que o ovário não é revestido por peritônio?',
      'Para onde drena sua linfa e por quê?',
      'Que nervo corre na fossa ovárica?',
    ],
  },
  {
    termos: ['Ligamento Suspensor do Ovário'],
    classe: 'ligamento',
    resumo: 'Prega peritoneal que leva os vasos ováricos da parede pélvica ao ovário — o ligamento infundibulopélvico.',
    localizacao: 'Da parede lateral da pelve à extremidade tubária do ovário, cruzando os vasos ilíacos externos.',
    funcao: 'Conduz a artéria e a veia ováricas, os linfáticos e os nervos ovarianos.',
    relacoes: 'Cruza o ureter perto da bifurcação ilíaca — relação de poucos milímetros.',
    clinica:
      'Essa proximidade é a razão de o ureter ser lesado na ligadura do infundibulopélvico durante a ooforectomia, uma das complicações urológicas mais frequentes da ginecologia. E é a torção desse pedículo que produz a torção anexial: dor pélvica súbita, náusea e ovário aumentado com fluxo alterado ao Doppler — emergência em que a destorção precoce salva a gônada.',
    memoria:
      'Ligar o infundibulopélvico sem ver o ureter é o erro clássico. Identifique o ureter antes de qualquer pinça.',
    pontos: [
      'Que estruturas o ligamento suspensor conduz?',
      'Que estrutura ele cruza e por que isso importa?',
      'O que é a torção anexial?',
    ],
  },
  {
    termos: ['Ligamento Útero-ovárico'],
    classe: 'ligamento',
    resumo: 'Cordão fibromuscular que liga o ovário ao ângulo do útero, dentro do ligamento largo.',
    localizacao: 'Da extremidade uterina do ovário ao corno uterino, abaixo e atrás da tuba.',
    funcao:
      'É o remanescente superior do gubernáculo, cuja porção inferior se torna o ligamento redondo do útero. Não sustenta o ovário — apenas o mantém em relação ao útero.',
    relacoes: 'Contém o ramo ovárico da artéria uterina.',
    clinica:
      'A continuidade embrionária entre ligamento útero-ovárico e ligamento redondo explica a dor referida na virilha em processos ovarianos e a possibilidade de endometriose no canal inguinal. Cirurgicamente, na histerectomia com preservação dos ovários, é esse ligamento que se secciona — enquanto o infundibulopélvico é poupado, para manter a irrigação ovariana.',
    memoria:
      'Gubernáculo virou dois ligamentos: o de cima liga ovário ao útero, o de baixo vai até a virilha. Um cordão cortado ao meio pelo útero.',
    pontos: [
      'De que estrutura embrionária deriva o ligamento útero-ovárico?',
      'Que ligamento é sua continuação inferior?',
      'Que ligamento se secciona na histerectomia com preservação ovariana?',
    ],
  },
  {
    termos: ['Ligamento Largo do Útero'],
    classe: 'ligamento',
    resumo: 'Prega peritoneal dupla que se estende do útero às paredes laterais da pelve.',
    localizacao: 'Do útero à parede pélvica lateral, dividido em mesossalpinge (para a tuba), mesovário (para o ovário) e mesométrio (a maior parte).',
    funcao:
      'Não é um ligamento de sustentação: é uma prega peritoneal que transporta estruturas. Contém a tuba uterina, o ligamento redondo, o ligamento útero-ovárico, os vasos uterinos e ováricos, o plexo nervoso e restos embrionários.',
    relacoes: 'Na sua base, a artéria uterina cruza por cima do ureter, a cerca de 2 cm lateralmente ao colo.',
    clinica:
      'Esse cruzamento é o passo mais perigoso da histerectomia: a lesão ureteral ocorre mais frequentemente ali do que em qualquer outro ponto. E os restos embrionários no mesossalpinge — epoóforo e paroóforo, remanescentes do ducto mesonéfrico — são a origem dos cistos paratubários, incluindo a hidátide de Morgagni, achado comum e benigno que pode torcer.',
    memoria:
      '"A água passa por baixo da ponte": ureter por baixo, artéria uterina por cima, dois centímetros do colo.',
    pontos: [
      'Que estruturas o ligamento largo contém?',
      'Quais são suas três porções?',
      'Onde a artéria uterina cruza o ureter?',
    ],
  },
  {
    termos: ['Extremidade Tubária'],
    classe: 'glandula',
    resumo: 'Polo superior do ovário, voltado para a tuba — a extremidade por onde os vasos chegam.',
    localizacao: 'Extremidade superior e lateral do ovário, dirigida para o infundíbulo da tuba e para a parede pélvica.',
    funcao:
      'Recebe o ligamento suspensor do ovário, que não é um ligamento comum: é uma prega de peritônio que carrega os vasos ováricos desde a parede posterior do abdome. Por aqui entra a irrigação, e por aqui ela pode ser interrompida.',
    vascularizacao:
      'Artéria e veia ováricas, que descem dentro do ligamento suspensor desde a aorta e a cava — ou, à esquerda, a veia renal. É o pedículo principal do ovário, e o que se liga na ooforectomia.',
    inervacao: 'Plexo ovárico (T10–T11), que desce com a artéria dentro do mesmo ligamento suspensor.',
    relacoes: 'A fímbria ovárica, a mais longa das fímbrias, prende-se justamente a esta extremidade e é o que aproxima a tuba do ovário na ovulação.',
    clinica:
      'O ligamento suspensor é o eixo em torno do qual o ovário torce. Na torção anexial, ele se enrola sobre si mesmo, ocluindo primeiro o retorno venoso e depois a artéria — daí o ovário aparecer aumentado e edemaciado na ultrassonografia antes de infartar. E como o suprimento chega todo por aqui, a distorção precoce salva o órgão, mesmo quando ele já parece escuro na cirurgia.',
    memoria:
      'A extremidade tubária é a alça pela qual o ovário está pendurado — e o eixo em que ele torce. Ligamento suspensor é vaso, não ligamento.',
    pontos: [
      'Que ligamento se fixa à extremidade tubária e o que ele contém?',
      'Que vasos entram no ovário por aqui?',
      'Por que a torção ovariana ocorre em torno desta extremidade?',
    ],
  },
  {
    termos: ['Extremidade Uterina'],
    classe: 'glandula',
    resumo: 'Polo inferior do ovário, ligado ao útero pelo ligamento útero-ovárico.',
    localizacao: 'Extremidade inferior e medial do ovário, voltada para o corno uterino.',
    funcao:
      'Ancora o ovário ao útero pelo ligamento útero-ovárico — que, ao contrário do suspensor, é um ligamento verdadeiro, fibromuscular, resto do gubernáculo. Ele mantém o ovário perto do útero e é o que impede que ele suba para o abdome.',
    vascularizacao:
      'Ramo ovárico da artéria uterina, que sobe pelo ligamento útero-ovárico e se anastomosa com a artéria ovárica dentro do mesovário. É a segunda fonte do ovário — e é ela que mantém o órgão viável quando a artéria ovárica é ligada.',
    inervacao: 'Plexo uterovaginal (T12–L2 e S2–S4), que acompanha o ramo ovárico da uterina.',
    relacoes: 'O ligamento útero-ovárico e o ligamento redondo do útero têm a mesma origem embrionária: são as duas metades do gubernáculo, separadas pela tuba.',
    clinica:
      'A anastomose entre a ovárica e a uterina, feita aqui, é o que torna possível preservar o ovário numa histerectomia com anexectomia unilateral — e o que faz a embolização de miomas ameaçar a reserva ovariana, porque partículas podem alcançar o ovário por essa mesma comunicação.',
    memoria:
      'Duas artérias irrigam o ovário e se encontram aqui: a ovárica vem de cima, a uterina vem de baixo. Ligar uma não mata o ovário.',
    pontos: [
      'Que ligamento se fixa à extremidade uterina?',
      'Que anastomose arterial acontece nesta região?',
      'Qual a origem embrionária comum dos ligamentos útero-ovárico e redondo?',
    ],
  },
  {
    termos: ['Margem Livre do Ovário'],
    classe: 'glandula',
    resumo: 'Borda posterior e convexa do ovário, sem peritônio e sem vasos — a superfície por onde o oócito sai.',
    localizacao: 'Margem posterior do ovário, voltada para a escavação retouterina; a margem oposta, a mesovárica, é o hilo.',
    funcao:
      'É a superfície da ovulação. O ovário é o único órgão do corpo que não é revestido por peritônio: seu epitélio germinativo substitui a serosa justamente para que o folículo possa romper e liberar o oócito diretamente na cavidade — um órgão que precisa vazar para funcionar.',
    vascularizacao:
      'Apenas ramos terminais finos do plexo cortical, vindos do hilo na margem oposta. É a região menos vascularizada do ovário — o que não é acidente: ovular seria hemorrágico se a ruptura ocorresse sobre o hilo.',
    inervacao: 'Plexo ovárico (T10–T11), com aferentes que respondem ao estiramento da cápsula.',
    relacoes: 'Está livre no fundo de saco de Douglas, apenas encostada nas alças e no reto.',
    clinica:
      'Duas coisas nascem dessa geografia. A rotura folicular sobre uma margem pouco vascularizada é o que faz a dor do meio do ciclo (Mittelschmerz) ser autolimitada, com pequeno sangramento — mas quando um vaso maior é atingido, o hemoperitônio pode ser volumoso e simular gravidez ectópica rota. E na cistectomia, incisar pela margem livre e não pelo hilo é o que preserva a reserva folicular da paciente.',
    memoria:
      'Vasos entram na frente, óvulo sai atrás. O ovário é o único órgão sem peritônio — porque precisa se romper todo mês.',
    pontos: [
      'Por que o ovário não é revestido por peritônio?',
      'Por que a margem livre é pouco vascularizada?',
      'Por que a cistectomia deve ser feita pela margem livre?',
    ],
  },
  {
    termos: ['Infundíbulo'],
    classe: 'viscera',
    resumo: 'Extremidade lateral da tuba uterina, alargada em funil sobre o ovário.',
    localizacao: 'Porção mais lateral da tuba, além da ampola, aberta na cavidade peritoneal e apoiada sobre o ovário.',
    funcao:
      'É o funil que recolhe o oócito. Sua mucosa é intensamente ciliada e as células ciliadas batem em direção ao útero, criando uma corrente que carrega o oócito para dentro mesmo sem contato direto com o ovário.',
    vascularizacao: 'Ramos tubários da artéria ovárica, que chegam pelo ligamento suspensor, com anastomose com o ramo tubário da uterina.',
    inervacao: 'Plexo ovárico (T10–T11) e uterovaginal. As aferentes de dor sobem pelo simpático, e por isso a dor de uma salpingite começa vaga e periumbilical.',
    relacoes: 'Suas fímbrias se debruçam sobre o ovário; no seu centro está o óstio abdominal.',
    clinica:
      'O infundíbulo é o segmento onde a estrogenoterapia e a doença inflamatória pélvica mais alteram o batimento ciliar — e a perda desse batimento, mesmo com a tuba pérvia, é causa de infertilidade e de gravidez ectópica. Tuba aberta não significa tuba funcionante: a histerossalpingografia mostra a passagem do contraste, não o movimento dos cílios.',
    memoria:
      'O funil não engole o óvulo: ele o aspira com uma corrente de cílios. Tuba pérvia com cílios parados é tuba inútil.',
    pontos: [
      'Qual a forma e a função do infundíbulo?',
      'Como o oócito é conduzido para dentro da tuba?',
      'Por que uma tuba pérvia pode ainda assim ser infértil?',
    ],
  },
  {
    termos: ['Fímbrias'],
    classe: 'viscera',
    resumo: 'Franjas móveis na borda do infundíbulo, que varrem a superfície do ovário na ovulação.',
    localizacao: 'Borda livre do infundíbulo, em número de 20 a 30, com a fímbria ovárica — a mais longa — fixada à extremidade tubária do ovário.',
    funcao:
      'Na ovulação, as fímbrias ingurgitam e passam a varrer ativamente a superfície do ovário, atraídas por sinais do folículo roto. São elas, e não a tuba, que fazem a captação do oócito — e é por isso que a gravidez pode ocorrer com ovário de um lado e tuba do outro.',
    vascularizacao: 'Ramos tubários terminais das artérias ovárica e uterina, com um plexo que ingurgita no período periovulatório — o que aumenta sua motilidade justamente na hora certa.',
    inervacao: 'Plexo ovárico (T10–T11), com fibras autonômicas que comandam esse ingurgitamento cíclico.',
    relacoes: 'A fímbria ovárica funciona como uma amarra que aproxima a tuba do ovário no momento da ovulação.',
    clinica:
      'A revisão da patologia mudou o que se pensava sobre esta franja: hoje se reconhece que a maioria dos carcinomas serosos de alto grau ditos "de ovário" nasce, na verdade, no epitélio das fímbrias, a partir de lesões precursoras chamadas STIC. Essa descoberta é a razão da salpingectomia oportunista — retirar as tubas em cirurgias pélvicas benignas para prevenir um câncer que sempre se atribuiu ao ovário.',
    memoria:
      'O câncer "de ovário" mais comum começa na franja da tuba. Por isso hoje se tiram as tubas e se deixa o ovário.',
    pontos: [
      'Como as fímbrias captam o oócito?',
      'O que é a fímbria ovárica?',
      'Por que se propõe a salpingectomia oportunista?',
    ],
  },
  {
    termos: ['Óstio Abdominal'],
    classe: 'viscera',
    resumo: 'A abertura da tuba na cavidade peritoneal — o único ponto do corpo em que o peritônio se comunica com o exterior.',
    localizacao: 'No centro do infundíbulo, cercado pelas fímbrias, abrindo-se livremente na cavidade peritoneal.',
    funcao:
      'É a porta por onde o oócito entra na tuba. Sua existência tem uma consequência que vale para todo o corpo da mulher: a cavidade peritoneal feminina não é fechada. Vagina, útero, tuba e peritônio formam um trajeto contínuo com o meio externo.',
    vascularizacao: 'Ramos tubários terminais das artérias ovárica e uterina, num anel periostial fino.',
    inervacao: 'Plexo ovárico (T10–T11). A dor da irritação peritoneal que se instala a partir daqui, porém, é somática e localizada — pelo peritônio parietal, não pelo óstio.',
    relacoes: 'É o ponto de transição entre o epitélio da mucosa tubária e o mesotélio peritoneal.',
    clinica:
      'Essa comunicação aberta é a explicação de três quadros distintos. A infecção ascendente: gonococo e clamídia sobem da vagina e alcançam o peritônio, produzindo a peri-hepatite da síndrome de Fitz-Hugh-Curtis, com aderências em corda de violino sob o diafragma. A menstruação retrógrada, que dissemina endométrio pela cavidade e origina a endometriose. E, no homem, nada disso é possível — a cavidade peritoneal masculina é fechada.',
    memoria:
      'A cavidade peritoneal da mulher tem uma porta para fora, e o homem não tem. É por essa porta que a infecção sobe e o endométrio se espalha.',
    pontos: [
      'Por que a cavidade peritoneal feminina é considerada aberta?',
      'O que é a síndrome de Fitz-Hugh-Curtis?',
      'Como esse óstio se relaciona com a endometriose?',
    ],
  },
  {
    termos: ['Ampola'],
    classe: 'viscera',
    resumo: 'Porção mais longa e mais larga da tuba uterina, onde ocorre a fecundação.',
    localizacao: 'Entre o infundíbulo e o istmo, ocupando cerca de dois terços do comprimento tubário.',
    funcao:
      'Sua mucosa tem pregas altas e ramificadas e epitélio ciliado abundante, que criam o ambiente e o transporte necessários ao encontro dos gametas. É aqui que a fecundação normalmente acontece.',
    vascularizacao:
      'Ramos tubários das artérias ovárica e uterina, anastomosados na mesossalpinge. Território de irrigação terminal e delicada, o que explica a hemorragia volumosa quando uma gravidez ectópica ampular rompe.',
    inervacao:
      'Plexo ovárico e uterovaginal (T10–L1 e S2–S4). As aferentes de dor sobem pelo simpático, e por isso a dor da ectópica é inicialmente vaga e periumbilical — até o sangue atingir o peritônio parietal e a dor virar localizada e com defesa.',
    relacoes: 'Sua parede muscular é mais fina que a do istmo.',
    clinica:
      'É o sítio de cerca de 70% das gravidezes ectópicas — e a parede fina explica a rotura com hemoperitônio, que é a principal causa de morte materna no primeiro trimestre. A tríade de atraso menstrual, dor pélvica e sangramento em mulher em idade fértil obriga a dosar beta-HCG antes de qualquer outra hipótese.',
    memoria:
      'A fecundação acontece na ampola — e é por isso que a maioria das ectópicas também. O embrião fica onde foi feito.',
    pontos: [
      'Onde ocorre normalmente a fecundação?',
      'Por que a ampola é o sítio mais comum de gravidez ectópica?',
      'Que tríade sugere gravidez ectópica?',
    ],
  },
  {
    termos: ['Istmo da Tuba Uterina'],
    classe: 'viscera',
    resumo: 'Porção estreita e de parede espessa da tuba, próxima ao útero.',
    localizacao: 'Entre a ampola e a parte uterina (intramural) da tuba.',
    funcao: 'Sua musculatura espessa funciona como esfíncter funcional, retendo o embrião até que o endométrio esteja receptivo.',
    vascularizacao:
      'Ramos tubários da artéria uterina, ascendendo pela mesossalpinge. Segmento de parede espessa e luz estreita, com irrigação mais escassa que a da ampola.',
    inervacao:
      'Plexo uterovaginal (T12–L2 e S2–S4). É o segmento eleito para a laqueadura tubária, justamente porque a parede é grossa, a luz é estreita e a irrigação é modesta — três características que fazem a oclusão ser eficaz e a recanalização, difícil.',
    relacoes: 'É a porção de menor calibre da tuba, fora da parte intramural.',
    clinica:
      'É o segmento de eleição para a laqueadura tubária: a ligadura e secção do istmo é simples, tem baixa taxa de falha e preserva a maior parte da tuba, o que facilita a reversão. Sua obstrução por salpingite ístmica nodosa é causa reconhecida de infertilidade e de gravidez ectópica.',
    memoria:
      'O istmo é o segmento estreito e forte perto do útero. É lá que se corta a trompa.',
    pontos: [
      'Que característica a parede do istmo tem?',
      'Que função ela desempenha?',
      'Por que o istmo é escolhido na laqueadura?',
    ],
  },
  /* ─────────────────── Útero ─────────────────── */
  {
    termos: ['Fundo do Útero'],
    classe: 'viscera',
    resumo: 'Porção superior arredondada do útero, acima da linha que une os óstios tubários.',
    localizacao: 'Parte mais alta do corpo uterino, entre os dois cornos.',
    funcao: 'É a região de maior massa muscular e onde o embrião mais frequentemente se implanta.',
    vascularizacao:
      'Ramos terminais das artérias uterinas, que sobem tortuosas pelas margens do útero (artérias helicinas), com anastomose ampla com a artéria ovárica através do ligamento largo. Essa dupla origem é a razão de a embolização das artérias uterinas nem sempre resolver o mioma fúndico — a ovárica reperfunde.',
    inervacao:
      'Plexo uterovaginal, com simpático de T12 a L2 e parassimpático de S2 a S4. As aferentes de dor do fundo e do corpo sobem pelo simpático até T10–L1 — motivo de a dor das contrações no primeiro estágio do trabalho de parto ser sentida no abdome inferior e nas costas altas.',
    relacoes: 'Coberto por peritônio, em contato com alças intestinais.',
    clinica:
      'A altura do fundo uterino medida da sínfise púbica é o parâmetro mais simples de acompanhamento do crescimento fetal: entre a 20ª e a 34ª semana, a medida em centímetros corresponde aproximadamente à idade gestacional em semanas. E a manobra de Kristeller sobre o fundo é hoje contraindicada, pelo risco de rotura uterina e de descolamento — o conhecimento anatômico revertendo uma prática consagrada.',
    memoria:
      'Da 20ª à 34ª semana, altura uterina em centímetros é igual à idade gestacional em semanas. Uma fita métrica vale por um ultrassom.',
    pontos: [
      'Que limites definem o fundo do útero?',
      'Como se mede a altura uterina e o que ela indica?',
      'Por que a manobra de Kristeller é contraindicada?',
    ],
  },
  {
    termos: ['Corpo do Útero'],
    classe: 'viscera',
    resumo: 'Porção principal do útero, com uma cavidade triangular e virtual entre as paredes anterior e posterior.',
    localizacao: 'Entre o fundo e o istmo; normalmente em anteversoflexão sobre a bexiga.',
    funcao: 'A cavidade uterina é virtual — as paredes se tocam —, com apenas cerca de 6 cm de comprimento e capacidade de 5 mL fora da gravidez, expandindo-se até 5 litros no termo.',
    vascularizacao:
      'Artéria uterina, ramo da ilíaca interna, que cruza o ureter por cima a cerca de 2 cm do colo — a relação da \'água sob a ponte\', responsável pela lesão ureteral da histerectomia. Dela partem as artérias arqueadas, radiais e, por fim, as espiraladas do endométrio, que são as que se contraem e produzem a menstruação.',
    inervacao:
      'Plexo uterovaginal, com simpático de T12 a L2 e parassimpático de S2 a S4. Aferentes de dor do corpo sobem por T10–L1: é por isso que a analgesia do primeiro estágio do trabalho de parto precisa cobrir esses segmentos torácicos baixos.',
    relacoes: 'A anteversão é a angulação entre o colo e a vagina; a anteflexão, entre o corpo e o colo.',
    clinica:
      'A anteversoflexão é o que determina a direção de introdução de qualquer instrumento uterino, e é sua desconsideração que causa a perfuração uterina na curetagem e na inserção de DIU — motivo pelo qual se histerometriza antes. Em um útero retrovertido, a direção é oposta, e não reconhecer isso multiplica o risco. A capacidade de expansão de mil vezes é uma das mais notáveis de qualquer órgão.',
    memoria:
      'Antes de entrar no útero, saiba para que lado ele aponta. Perfuração quase sempre é instrumento indo na direção errada.',
    pontos: [
      'Qual a diferença entre anteversão e anteflexão?',
      'Que capacidade a cavidade uterina atinge na gravidez?',
      'Por que a versão uterina importa nos procedimentos?',
    ],
  },
  {
    termos: ['Istmo do Útero'],
    classe: 'viscera',
    resumo: 'Segmento estreito de cerca de 1 cm entre o corpo e o colo do útero.',
    localizacao: 'Entre o corpo e o colo, correspondendo internamente ao óstio interno anatômico.',
    funcao: 'Fora da gravidez é apenas uma transição; na gestação, distende-se e forma o segmento inferior do útero.',
    vascularizacao:
      'Ramos da artéria uterina imediatamente após ela cruzar o ureter. É o segmento mais estreito do útero e o de parede mais fina no termo da gravidez.',
    inervacao:
      'Plexo uterovaginal (T12–L2 e S2–S4). O istmo é o que se transforma no segmento uterino inferior na gravidez, e por ser fino e pouco contrátil é justamente onde se faz a incisão da cesariana — com menos sangramento e menor risco de rotura em gestação futura do que a incisão corporal clássica.',
    relacoes: 'O peritônio é frouxamente aderido nessa altura, formando a prega vesicouterina.',
    clinica:
      'Essa frouxidão peritoneal é o que torna o segmento inferior o local da histerotomia na cesariana: abre-se o peritônio, rebaixa-se a bexiga e incisa-se um segmento fino, pouco contrátil e de melhor cicatrização — a incisão de Kerr, que reduziu drasticamente a rotura uterina em gestações subsequentes em comparação com a incisão corporal clássica. A insuficiência istmocervical, por sua vez, causa perdas gestacionais do segundo trimestre.',
    memoria:
      'A cesariana é feita no segmento inferior porque ali a parede é fina, o peritônio descola e a cicatriz aguenta a próxima gravidez.',
    pontos: [
      'O que o istmo se torna na gestação?',
      'Por que a cesariana é feita no segmento inferior?',
      'O que é insuficiência istmocervical?',
    ],
  },
  {
    termos: ['Colo do Útero', 'Colo Uterino'],
    classe: 'viscera',
    resumo: 'Porção inferior e cilíndrica do útero, que se projeta na vagina, com o óstio externo no seu centro.',
    localizacao: 'Entre o istmo e a vagina, com porção supravaginal e porção vaginal (ectocérvice); o canal cervical liga o óstio interno ao externo.',
    funcao:
      'O canal é revestido por epitélio colunar e a ectocérvice por escamoso; a fronteira entre eles é a junção escamocolunar, que se desloca ao longo da vida e cria a zona de transformação por metaplasia.',
    inervacao:
      'Aqui está a diferença que decide a anestesia obstétrica: as aferentes de dor do colo e da vagina superior não sobem pelo simpático, e sim pelos nervos esplâncnicos pélvicos até S2–S4. Por isso a dor do primeiro estágio do parto (dilatação do colo) é referida ao dorso e ao sacro, enquanto a do segundo estágio (distensão do períneo) é pudenda e perineal — e por isso o bloqueio paracervical alivia uma e o bloqueio pudendo alivia a outra.',
    vascularizacao: 'Ramos cervicovaginais da artéria uterina.',
    clinica:
      'A zona de transformação é onde nascem praticamente todas as neoplasias cervicais, e é por isso que a coleta citológica precisa incluí-la — uma amostra sem células endocervicais é uma amostra inadequada. É também o alvo da colposcopia e da conização. O muco cervical, que se torna filante e cristaliza em folha de samambaia no período periovulatório, é um marcador clínico de estrogênio.',
    memoria:
      'Todo câncer de colo nasce na zona de transformação. Coleta que não pega ela é coleta que não serviu.',
    pontos: [
      'O que é a zona de transformação e por que ela importa?',
      'Que epitélios revestem o canal e a ectocérvice?',
      'Por que a amostra citológica precisa de células endocervicais?',
    ],
  },
  {
    termos: ['Endométrio'],
    classe: 'viscera',
    resumo: 'Mucosa que reveste a cavidade uterina, com camada funcional descamável e camada basal permanente.',
    localizacao: 'Camada mais interna da parede uterina, sobre o miométrio.',
    funcao:
      'A camada funcional prolifera sob estrogênio, secreta sob progesterona e descama na menstruação; a camada basal, irrigada pelas artérias retas, é preservada e regenera o endométrio a cada ciclo.',
    inervacao:
      'Praticamente desprovido de terminações nervosas no seu estrato funcional, que é descamado a cada ciclo. A dor menstrual não nasce dele: nasce da isquemia e da contração do miométrio, provocadas pelas prostaglandinas que o próprio endométrio libera ao se degenerar — e é por isso que os anti-inflamatórios, que bloqueiam essas prostaglandinas, funcionam tão bem na dismenorreia.',
    vascularizacao: 'Artérias espiraladas para a camada funcional — sensíveis a hormônios — e artérias retas para a basal.',
    clinica:
      'Essa divisão vascular é a menstruação explicada: a queda da progesterona contrai as artérias espiraladas, isquemia a camada funcional e a faz descamar, enquanto as artérias retas mantêm a basal viva. A destruição da camada basal por curetagem agressiva ou infecção produz sinéquias intrauterinas — a síndrome de Asherman, com amenorreia e infertilidade, em que o endométrio simplesmente não tem mais de onde se regenerar.',
    memoria:
      'Artéria espiralada responde a hormônio e mata a camada de cima; artéria reta não responde e salva a de baixo. Menstruação é isquemia programada.',
    pontos: [
      'Que camadas compõem o endométrio?',
      'Como a vascularização explica a menstruação?',
      'O que é a síndrome de Asherman?',
    ],
  },
  {
    termos: ['Miométrio'],
    classe: 'viscera',
    resumo: 'Camada muscular espessa do útero, com fibras entrelaçadas em três planos.',
    localizacao: 'Entre o endométrio e o perimétrio; sua camada média é a mais espessa e a mais vascularizada.',
    funcao:
      'A disposição entrelaçada das fibras da camada média forma as "ligaduras vivas de Pinard": ao se contrair após o parto, o músculo comprime os vasos que o atravessam e estanca o sangramento do sítio placentário.',
    inervacao:
      'Plexo uterovaginal, com simpático de T12 a L2 e parassimpático de S2 a S4 — mas a contração uterina é, no essencial, independente do nervo: ela é miogênica e hormonal, comandada por ocitocina e prostaglandinas sobre junções comunicantes entre as células. É por isso que o útero contrai normalmente na paciente sob raquianestesia e até no útero transplantado, completamente desnervado.',
    vascularizacao: 'Artérias arqueadas na camada média, das quais partem as radiais para o endométrio.',
    clinica:
      'É a razão de a atonia uterina ser a principal causa de hemorragia pós-parto: sem contração, não há ligadura viva, e o sangramento do leito placentário é arterial e maciço. Toda a conduta — massagem, ocitocina, misoprostol, balão, sutura de B-Lynch — visa restaurar essa contração. Os leiomiomas, tumores benignos dessa camada, são as neoplasias mais comuns da mulher.',
    memoria:
      'O útero não fecha os vasos com pinça: ele os aperta com o próprio músculo. Útero mole é útero que sangra.',
    pontos: [
      'O que são as ligaduras vivas de Pinard?',
      'Por que a atonia uterina causa hemorragia?',
      'Que tumor benigno nasce no miométrio?',
    ],
  },
  {
    termos: ['Perimétrio'],
    classe: 'serosa',
    resumo: 'Revestimento peritoneal do útero, aderido ao fundo e ao corpo e frouxo sobre o istmo.',
    localizacao: 'Cobre o fundo, o corpo e a face posterior até a porção supravaginal do colo, refletindo-se para a bexiga à frente e para o reto atrás.',
    funcao: 'Delimita as escavações vesicouterina e retouterina e continua-se lateralmente com o ligamento largo.',
    vascularizacao:
      'Peritônio visceral, irrigado por ramos subserosos da artéria uterina. Recobre o fundo e a face posterior por inteiro, mas para na altura do istmo à frente, onde se reflete sobre a bexiga.',
    inervacao:
      'Fibras autonômicas do plexo uterovaginal, sem sensibilidade somática — o perimétrio não dói. A dor de uma endometrite ou de uma perfuração uterina só aparece quando o processo alcança o peritônio parietal da pelve.',
    relacoes: 'É frouxamente aderido na região do istmo — a prega vesicouterina —, o que permite descolar a bexiga.',
    clinica:
      'Esse plano de clivagem é o que torna a cesariana segmentar possível e é o mesmo plano dissecado na histerectomia. Sua obliteração por cesarianas prévias, endometriose ou infecção transforma uma cirurgia de rotina em procedimento de risco, com lesão vesical — e é por isso que o número de cesarianas anteriores muda o planejamento cirúrgico.',
    memoria:
      'Sobre o corpo do útero o peritônio está colado; sobre o istmo, solto. É no solto que o cirurgião entra.',
    pontos: [
      'Onde o perimétrio é frouxo e por que isso importa?',
      'Que escavações ele delimita?',
      'O que a obliteração desse plano acarreta?',
    ],
  },
  {
    termos: ['Escavação Vesicouterina'],
    classe: 'serosa',
    resumo: 'Recesso peritoneal raso entre a bexiga e a face anterior do útero.',
    localizacao: 'Entre a face posterossuperior da bexiga e a face anterior do útero, ao nível do istmo.',
    funcao: 'É a mais rasa das escavações pélvicas femininas e permanece vazia na maior parte do tempo.',
    vascularizacao:
      'O peritônio que a forra é irrigado por ramos das artérias vesical superior e uterina. É um fundo de saco raso, e sua abertura é o primeiro passo da cesariana — a prega vesicouterina é incisada e a bexiga rebatida antes de se abrir o útero.',
    inervacao:
      'Peritônio parietal pélvico, com fibras do plexo hipogástrico inferior e aferentes que sobem por S2–S4. Sensibilidade menos precisa que a do peritônio da parede abdominal, e é por isso que a dor pélvica profunda é sempre mal localizada.',
    relacoes: 'Corresponde à prega vesicouterina, aberta na cesariana e na histerectomia.',
    clinica:
      'Ser rasa é o que a torna pouco relevante como local de coleção — ao contrário da escavação retouterina. Sua importância é cirúrgica: é a porta de entrada para descolar a bexiga do segmento inferior. Uma bexiga alta e aderida, por cesarianas prévias, é fator de risco para lesão vesical e sinal indireto de acretismo placentário.',
    memoria:
      'A escavação da frente é rasa e cirúrgica; a de trás é funda e clínica. Uma serve ao bisturi, a outra à agulha.',
    pontos: [
      'Que estruturas delimitam a escavação vesicouterina?',
      'Por que ela é rasa?',
      'Qual sua importância cirúrgica?',
    ],
  },
  {
    termos: ['Escavação Retouterina'],
    classe: 'serosa',
    resumo: 'Fundo de saco de Douglas: o ponto mais baixo da cavidade peritoneal na mulher.',
    localizacao: 'Entre a face posterior do útero e o fundo da vagina, à frente, e o reto, atrás.',
    funcao: 'Por ser o ponto mais declive da cavidade peritoneal, recebe qualquer líquido livre em posição ortostática ou sentada.',
    vascularizacao:
      'Peritônio irrigado por ramos das artérias uterina e retal média. É o ponto mais declive da cavidade peritoneal na mulher em pé ou sentada.',
    inervacao:
      'Plexo hipogástrico inferior, com aferentes por S2–S4. Ser o ponto mais baixo é o que faz sangue, pus e líquido ascítico se acumularem aqui primeiro — e o que fundamenta a culdocentese e o achado de líquido livre no fundo de saco à ultrassonografia, o primeiro sinal de gravidez ectópica rota.',
    relacoes: 'Separado da vagina apenas pela parede vaginal posterior e por uma fina camada de tecido.',
    clinica:
      'Essa combinação — ponto mais baixo e separado da vagina por milímetros — fez da culdocentese o exame clássico para diagnosticar hemoperitônio na gravidez ectópica rota antes da era do ultrassom, e faz do fundo de saco a janela para drenagem de abscessos pélvicos. É também onde a endometriose profunda mais se instala, produzindo dispareunia profunda e nodularidade palpável ao toque.',
    memoria:
      'Tudo que é líquido na pelve da mulher escorre para o Douglas. E o Douglas está a um centímetro da vagina.',
    pontos: [
      'Por que a escavação retouterina é o ponto mais baixo do peritônio?',
      'Que procedimentos usam essa proximidade com a vagina?',
      'Onde a endometriose profunda se instala preferencialmente?',
    ],
  },
  {
    termos: ['Vagina', 'Canal Vaginal'],
    classe: 'viscera',
    resumo: 'Canal fibromuscular de cerca de 8 cm que liga o colo do útero ao vestíbulo.',
    localizacao: 'Entre a bexiga e a uretra, à frente, e o reto, atrás; suas paredes anterior e posterior se tocam em H no corte transversal.',
    funcao:
      'Sem glândulas próprias, é lubrificada pelo transudato da parede e pelo muco cervical; seu epitélio escamoso estratificado não queratinizado é rico em glicogênio, que os lactobacilos convertem em ácido láctico, mantendo o pH abaixo de 4,5.',
    vascularizacao: 'Artérias vaginais, uterinas, retais médias e pudendas internas.',
    inervacao: 'O terço inferior pelo nervo pudendo, sensível; os dois terços superiores por fibras autonômicas, pouco sensíveis à dor.',
    clinica:
      'Essa diferença de inervação explica por que procedimentos no colo e no fundo vaginal são bem tolerados com pouca anestesia, enquanto o terço inferior exige bloqueio. E o pH ácido é a principal defesa contra infecções: sua elevação — na menopausa, com uso de duchas ou após antibióticos — é o que permite a vaginose bacteriana, cujo diagnóstico inclui justamente a medida do pH.',
    memoria:
      'Terço de baixo dói (pudendo); dois terços de cima não (autonômico). E o pH ácido é o porteiro da vagina.',
    pontos: [
      'Como a vagina é lubrificada, se não tem glândulas?',
      'Por que o pH vaginal é ácido e o que o mantém assim?',
      'Como a inervação difere entre os terços da vagina?',
    ],
  },
  /* ─────────────────── Vulva ─────────────────── */
  {
    termos: ['Monte Púbico'],
    classe: 'viscera',
    resumo: 'Elevação de tecido adiposo sobre a sínfise púbica, coberta de pelos após a puberdade.',
    localizacao: 'À frente da sínfise púbica, continuando-se abaixo com os lábios maiores.',
    funcao: 'Amortece a sínfise púbica e é uma das áreas de distribuição pilosa dependente de androgênios.',
    vascularizacao:
      'Artérias pudendas externas superficial e profunda, ramos da femoral, com contribuição da epigástrica superficial. Território de artéria femoral, e não de pudenda interna — a fronteira vascular entre a vulva anterior e a posterior.',
    inervacao: 'Nervos ilioinguinal e ramo genital do genitofemoral (L1).',
    clinica:
      'O padrão de pelos pubianos é um marcador clínico: triangular com borda superior horizontal na mulher, losangular com extensão até o umbigo no homem — e a masculinização desse padrão, no hirsutismo, é um dos sinais da síndrome dos ovários policísticos e de hiperandrogenismo. O desenvolvimento dos pelos pubianos define os estágios de Tanner da puberdade.',
    memoria:
      'Pelo pubiano feminino tem borda reta em cima; masculino sobe em losango até o umbigo. Padrão que muda é padrão hormonal.',
    pontos: [
      'Qual a diferença no padrão de pelos entre os sexos?',
      'Que nervos inervam o monte púbico?',
      'Que estadiamento usa o desenvolvimento piloso?',
    ],
  },
  {
    termos: ['Lábios Maiores', 'Lábio Maior', 'Lábio  Maior'],
    classe: 'viscera',
    resumo: 'Duas pregas cutâneas com gordura e pelos que delimitam lateralmente a rima do pudendo.',
    localizacao: 'Do monte púbico ao períneo, homólogas ao escroto masculino.',
    funcao: 'Protegem as estruturas do vestíbulo; contêm a terminação do ligamento redondo do útero e, ocasionalmente, o processo vaginal (canal de Nuck).',
    vascularizacao:
      'Artérias pudendas externas, da femoral, na porção anterior, e labiais posteriores, da pudenda interna, na posterior. A drenagem linfática é toda para os linfonodos inguinais superficiais — a razão de o estadiamento do câncer de vulva começar pela virilha, e não pela pelve.',
    inervacao: 'Face anterior pelo ilioinguinal (L1); posterior pelos ramos labiais posteriores do pudendo (S3).',
    clinica:
      'A persistência do processo vaginal na mulher produz o cisto do canal de Nuck e permite a hérnia inguinal com conteúdo no lábio maior — o equivalente feminino da hérnia escrotal. E o carcinoma de vulva, mais frequente nos lábios maiores, drena para os linfonodos inguinais superficiais, e não para os pélvicos, o que define a linfadenectomia inguinofemoral como parte do tratamento.',
    memoria:
      'Lábio maior é o escroto que não fechou. Por isso hérnia inguinal na mulher aparece ali.',
    pontos: [
      'A que estrutura masculina os lábios maiores são homólogos?',
      'Que estrutura embrionária pode persistir neles?',
      'Para onde drena a linfa da vulva?',
    ],
  },
  {
    termos: ['Lábios Menores', 'Lábio Menor'],
    classe: 'viscera',
    resumo: 'Pregas cutâneas finas, sem pelos e sem gordura, que delimitam o vestíbulo da vagina.',
    localizacao: 'Mediais aos lábios maiores; unem-se anteriormente formando o prepúcio e o frênulo do clitóris.',
    funcao: 'São ricamente vascularizadas e inervadas, com glândulas sebáceas mas sem folículos pilosos; homólogas à pele da uretra esponjosa masculina.',
    vascularizacao:
      'Artérias labiais posteriores, ramos da pudenda interna, e ramos da artéria profunda do clitóris. Sua rica rede vascular sem gordura subcutânea é o que os faz ingurgitar e mudar de cor na excitação — e o que faz a laceração de parto sangrar tanto apesar de superficial.',
    inervacao: 'Nervo pudendo e ramos labiais posteriores.',
    clinica:
      'Sua vascularização abundante faz as lacerações sangrarem muito no parto e no trauma. E é a fusão anterior deles que forma o prepúcio do clitóris, sede das aderências e do líquen escleroso — doença inflamatória crônica que apaga a arquitetura vulvar, causa dispareunia e aumenta o risco de carcinoma espinocelular, exigindo acompanhamento.',
    memoria:
      'Lábios menores não têm pelo nem gordura, mas têm sangue e nervo de sobra. Cortou, sangra; tocou, dói.',
    pontos: [
      'Que estruturas os lábios menores formam anteriormente?',
      'Por que suas lacerações sangram muito?',
      'Que doença apaga a arquitetura vulvar?',
    ],
  },
  {
    termos: ['Clitóris'],
    classe: 'viscera',
    resumo: 'Órgão erétil feminino, homólogo do pênis, formado por dois corpos cavernosos, ramos e glande.',
    localizacao: 'Sob a comissura anterior dos lábios menores; apenas a glande é visível, e o corpo e os ramos se estendem por vários centímetros no períneo.',
    funcao:
      'É exclusivamente sensorial e erétil — não é atravessado pela uretra. A glande do clitóris tem cerca de 8.000 terminações nervosas, a maior densidade do corpo humano.',
    vascularizacao: 'Artérias profunda e dorsal do clitóris, ramos da pudenda interna.',
    inervacao: 'Nervo dorsal do clitóris, ramo do pudendo (S2–S4).',
    clinica:
      'A extensão real do clitóris, muito maior que a porção visível, só foi bem descrita em imagens de ressonância a partir dos anos 1990 — um exemplo notável de como uma estrutura pode ser subdescrita por razões culturais e não anatômicas. Clinicamente, o nervo dorsal é preservado nas cirurgias de redução de clitoromegalia, e o bloqueio pudendo anestesia todo o território.',
    memoria:
      'O que se vê do clitóris é a ponta: o corpo e os ramos continuam por baixo, abraçando a vagina.',
    pontos: [
      'A que estrutura masculina o clitóris é homólogo?',
      'Por que ele não é atravessado pela uretra?',
      'Que nervo o inerva?',
    ],
  },
  {
    termos: ['Vestíbulo da Vagina'],
    classe: 'viscera',
    resumo: 'Espaço entre os lábios menores, onde se abrem a uretra, a vagina e os ductos das glândulas vestibulares.',
    localizacao: 'Entre os lábios menores; a rima do pudendo é a fenda entre os lábios maiores.',
    funcao:
      'Recebe o óstio externo da uretra, à frente, o óstio da vagina, atrás, e os ductos das glândulas vestibulares maiores (de Bartholin), nas posições de 4 e 8 horas.',
    vascularizacao:
      'Artérias labiais posteriores e artéria do bulbo do vestíbulo, ramos da pudenda interna. Os bulbos do vestíbulo, tecido erétil sob a mucosa de cada lado, são o que sangra de forma alarmante numa laceração vestibular do parto ou de um trauma a cavaleiro.',
    inervacao: 'Nervo pudendo, com sensibilidade somática muito desenvolvida.',
    clinica:
      'A posição das glândulas de Bartholin — posterolateral ao óstio vaginal — é o que permite reconhecer o cisto e o abscesso à inspeção, e é ali que se faz a marsupialização. A vestibulodínia localizada, dor à pressão do vestíbulo sem lesão visível, é hoje reconhecida como causa comum de dispareunia de entrada, e seu mapeamento por pressão com cotonete é um exame puramente anatômico.',
    memoria:
      'Bartholin fica às 4 e às 8 horas do óstio vaginal. Cisto nessas posições tem nome antes mesmo do exame.',
    pontos: [
      'Que estruturas se abrem no vestíbulo da vagina?',
      'Onde se localizam as glândulas de Bartholin?',
      'O que é a vestibulodínia localizada?',
    ],
  },
  /* ─────────────────── Mama ─────────────────── */
  {
    termos: ['Tecido Mamário'],
    classe: 'glandula',
    resumo: 'Glândula sudorípara apócrina modificada, com 15 a 20 lobos drenados por ductos lactíferos independentes.',
    localizacao: 'Da 2ª à 6ª costela, entre o esterno e a linha axilar média, sobre a fáscia peitoral.',
    funcao:
      'Cada lobo é uma glândula independente, com seu ducto próprio abrindo-se na papila. Os ligamentos suspensores de Cooper, septos fibrosos entre a pele e a fáscia peitoral, sustentam a mama.',
    inervacao:
      'Ramos cutâneos anteriores e laterais dos nervos intercostais do segundo ao sexto espaço; a papila e a aréola são território de T4. A secreção láctea, porém, não depende de nervo: depende da ocitocina liberada pela hipófise em resposta à sucção — um reflexo neuroendócrino cuja via aferente é o nervo e cuja via eferente é o sangue.',
    vascularizacao: 'Artéria torácica interna (60%), torácica lateral, torácica superior e perfurantes intercostais.',
    linfaticos: 'Cerca de 75% para os linfonodos axilares; o restante para os paraesternais, sobretudo dos quadrantes mediais.',
    clinica:
      'Os ligamentos de Cooper explicam dois sinais semiológicos clássicos: a retração cutânea, quando um tumor os traciona, e a pele em casca de laranja, quando o bloqueio linfático edemacia a pele ao redor de ligamentos que a mantêm presa. Já a independência dos lobos é o que faz a descarga papilar sanguinolenta ser de um único ducto — e o que orienta a ductografia e a exérese seletiva.',
    memoria:
      'Casca de laranja é pele inchada presa por cordas. As cordas são os ligamentos de Cooper.',
    pontos: [
      'Como o tecido mamário se organiza em lobos e ductos?',
      'O que são os ligamentos de Cooper?',
      'Que sinais semiológicos eles explicam?',
    ],
  },
  {
    termos: ['Papila Mamária'],
    classe: 'glandula',
    resumo: 'Projeção central onde se abrem os ductos lactíferos e a área pigmentada que a circunda.',
    localizacao: 'Geralmente no 4º espaço intercostal na nulípara; a aréola contém os tubérculos de Montgomery.',
    funcao:
      'Os 15 a 20 ductos lactíferos abrem-se independentemente na papila. As glândulas areolares de Montgomery secretam um lubrificante que protege a pele durante a amamentação e emite odor que orienta o recém-nascido.',
    vascularizacao:
      'Plexo subareolar de Haller, alimentado pelos ramos perfurantes da torácica interna e pela torácica lateral. É desse plexo subareolar que partem os linfáticos que convergem para a axila, e é nele que se injeta o corante ou o radiofármaco na pesquisa do linfonodo sentinela.',
    inervacao: 'Ramo cutâneo lateral do 4º nervo intercostal, principal responsável pela sensibilidade da papila.',
    clinica:
      'Preservar esse ramo é o objetivo das técnicas de mamoplastia com pedículo inferior — a perda da sensibilidade papilar é uma das queixas mais frequentes do pós-operatório. A doença de Paget da mama manifesta-se como eczema unilateral e persistente da papila, e qualquer lesão eczematosa papilar que não responde a tratamento tópico em duas semanas exige biópsia: é carcinoma intraductal até prova em contrário.',
    memoria:
      'Eczema em um mamilo só, que não sara: não é dermatite. É doença de Paget até a biópsia dizer o contrário.',
    pontos: [
      'Quantos ductos se abrem na papila mamária?',
      'Que nervo dá a sensibilidade papilar?',
      'O que é a doença de Paget da mama?',
    ],
  },
  {
    termos: ['Quadrante Superior Lateral'],
    classe: 'glandula',
    resumo: 'Quadrante superolateral da mama e seu prolongamento axilar — a cauda de Spence.',
    localizacao: 'Porção superior e externa da mama, com o processo axilar atravessando o forame de Langer na fáscia axilar.',
    funcao: 'Concentra a maior quantidade de tecido glandular de toda a mama.',
    vascularizacao:
      'Artéria torácica lateral e ramos peitorais da toracoacromial, ambos da axilar. É o quadrante de maior volume de tecido glandular e o que aloja o processo axilar — daí concentrar cerca de metade dos cânceres de mama.',
    inervacao:
      'Ramos cutâneos laterais dos nervos intercostais do segundo ao quarto espaço, e o nervo intercostobraquial (T2), que atravessa a axila e cuja secção no esvaziamento axilar produz dormência na face medial do braço.',
    linfaticos: 'Drena predominantemente para os linfonodos axilares.',
    clinica:
      'Concentrar mais tecido glandular é a razão de cerca de metade dos carcinomas de mama surgirem neste quadrante — informação que orienta tanto o autoexame quanto a leitura da mamografia. O processo axilar, por ser tecido mamário verdadeiro dentro da axila, pode desenvolver câncer e ser confundido com linfonodo aumentado, e ingurgita dolorosamente na amamentação.',
    memoria:
      'Metade dos tumores de mama nasce no quadrante de cima e de fora — porque é onde há mais glândula.',
    pontos: [
      'Por que o quadrante superolateral concentra mais tumores?',
      'O que é a cauda de Spence?',
      'Para onde drena a linfa desse quadrante?',
    ],
  },
  {
    termos: ['Quadrante Superior Medial'],
    classe: 'glandula',
    resumo: 'Quadrantes internos da mama, com drenagem linfática predominantemente paraesternal.',
    localizacao: 'Metade medial da mama, entre a papila e o esterno.',
    funcao: 'Drenam, em boa parte, para os linfonodos paraesternais (da cadeia torácica interna), e não para a axila.',
    vascularizacao:
      'Ramos perfurantes da artéria torácica interna, que atravessam os segundo, terceiro e quarto espaços intercostais junto ao esterno — os maiores vasos da mama e a fonte de sangramento na mastectomia medial.',
    inervacao: 'Ramos cutâneos anteriores dos nervos intercostais do segundo ao quarto espaço.',
    relacoes: 'A cadeia torácica interna acompanha os vasos torácicos internos, atrás das cartilagens costais.',
    clinica:
      'Essa drenagem alternativa é a razão de tumores mediais poderem ter axila negativa e metástase paraesternal — o que motivou, historicamente, a mastectomia radical estendida e, hoje, a atenção à drenagem extra-axilar na linfocintilografia do linfonodo sentinela. Um tumor medial com axila livre não significa doença localizada.',
    memoria:
      'Tumor do lado de dentro pode fugir da axila e ir para a cadeia mamária interna. Axila negativa não é sinônimo de tudo bem.',
    pontos: [
      'Para onde drenam preferencialmente os quadrantes mediais?',
      'Que implicação isso tem no estadiamento?',
      'Onde corre a cadeia torácica interna?',
    ],
  },
  {
    termos: ['Quadrante Inferior Lateral'],
    classe: 'glandula',
    resumo: 'Quadrante inferoexterno da mama, com menor densidade glandular.',
    localizacao: 'Porção inferior e externa da mama, acima do sulco inframamário.',
    funcao: 'Contém proporcionalmente mais tecido adiposo que glandular.',
    vascularizacao:
      'Ramos da artéria torácica lateral, da axilar, e das intercostais posteriores. Drena, como todo o lado lateral da mama, para os linfonodos axilares — o primeiro grupo a ser amostrado no linfonodo sentinela.',
    inervacao: 'Ramos cutâneos laterais dos nervos intercostais do quarto ao sexto espaço.',
    relacoes: 'Delimitado abaixo pelo sulco inframamário, estrutura ligamentar bem definida.',
    clinica:
      'O sulco inframamário é uma referência anatômica essencial em cirurgia plástica e oncológica: sua posição define o resultado estético da reconstrução e da mastopexia, e sua violação produz a deformidade em "dupla bolha" nos implantes. A divisão em quadrantes, por sua vez, é a linguagem padrão de localização de achados em mamografia e ultrassonografia.',
    memoria:
      'Quadrantes existem para todo mundo falar a mesma língua: quem examina, quem faz a imagem e quem opera.',
    pontos: [
      'Que composição predomina no quadrante inferolateral?',
      'Qual a importância do sulco inframamário?',
      'Por que a divisão em quadrantes é padronizada?',
    ],
  },
  {
    termos: ['Fáscia Peitoral'],
    classe: 'fascia',
    resumo: 'Fáscia que recobre o músculo peitoral maior e o espaço retromamário que a separa da mama.',
    localizacao: 'Sobre o peitoral maior; entre ela e a face profunda da mama existe o espaço retromamário, de tecido areolar frouxo.',
    funcao: 'O espaço retromamário permite que a mama deslize sobre a parede torácica — é o que dá mobilidade à glândula.',
    vascularizacao:
      'Ramos perfurantes da artéria torácica interna e ramos da toracoacromial, que a atravessam para alcançar a mama. Entre ela e a fáscia posterior da mama existe o espaço retromamário, frouxo e praticamente avascular — o plano que permite descolar a mama do peitoral com o dedo.',
    inervacao:
      'Ramos dos nervos intercostais do segundo ao sexto espaço, que a perfuram a caminho da pele. O nervo peitoral lateral e o medial correm sob ela, para o músculo, e sua preservação é o que evita a atrofia do peitoral maior após mastectomia.',
    relacoes: 'A pele, por sua vez, é fixada à glândula pelos ligamentos de Cooper.',
    clinica:
      'A mobilidade da mama sobre a fáscia é um dado semiológico direto: um tumor que invade a fáscia ou o músculo fixa a mama à parede e reduz sua mobilidade à manobra de contração do peitoral — sinal de doença localmente avançada (T4a). É também no espaço retromamário que se posicionam os implantes na técnica subglandular, e é ele que se dissecа na mastectomia.',
    memoria:
      'Peça para a paciente empurrar a cintura com as mãos: se o nódulo prende, o tumor pegou o músculo.',
    pontos: [
      'O que é o espaço retromamário e qual sua função?',
      'Como se avalia clinicamente a fixação de um tumor?',
      'Que estruturas fixam a pele à glândula?',
    ],
  },
  {
    termos: ['Intestino Grosso'],
    classe: 'viscera',
    sistemas: ['genital-feminino'],
    resumo: 'Alças do colo e do reto que ocupam a pelve atrás do útero e dos anexos.',
    localizacao: 'O colo sigmoide desce à esquerda da pelve e continua no reto, atrás do útero e da escavação retouterina.',
    funcao: 'Nesta prancha, aparece como referência de vizinhança dos órgãos genitais internos.',
    vascularizacao:
      'Mesentérica superior até dois terços do cólon transverso e mesentérica inferior daí em diante, unidas pela artéria marginal de Drummond ao longo de toda a borda. A flexura esplênica, no ponto de encontro, é a zona de divisor de águas — o segmento que sofre primeiro na colite isquêmica.',
    inervacao:
      'Vago e simpático de T10 a T11 na porção de intestino médio; esplâncnicos pélvicos (S2–S4) e simpático de L1 a L2 na de intestino posterior. A fronteira funcional dessa inervação, no cólon esquerdo, é o mesmo ponto onde a doença de Hirschsprung mais costuma terminar.',
    relacoes: 'O sigmoide costuma aderir ao anexo esquerdo; o reto está separado do útero pela escavação retouterina.',
    clinica:
      'Essa vizinhança é a razão de a endometriose profunda acometer preferencialmente o sigmoide e o septo retovaginal, com dor à evacuação durante a menstruação e, em casos avançados, sangramento retal cíclico. E é por ela que a doença inflamatória pélvica e a diverticulite se confundem no diagnóstico diferencial da dor em fossa ilíaca esquerda da mulher.',
    memoria:
      'Dor para evacuar que só aparece na menstruação não é intestino: é endometriose colada no reto.',
    pontos: [
      'Que porções do intestino grosso ocupam a pelve feminina?',
      'Onde a endometriose profunda se instala?',
      'Que diagnósticos se confundem na fossa ilíaca esquerda?',
    ],
  },
  {
    termos: [
      'Ovário Esquerdo',
    ],
    classe: 'glandula',
    resumo: 'Gônada feminina do lado esquerdo, alojada na fossa ovárica da parede pélvica lateral.',
    localizacao:
      'Na fossa ovárica esquerda, delimitada pelos vasos ilíacos externos acima, pela ilíaca interna e pelo ureter atrás, e pela obliteração da artéria umbilical à frente.',
    funcao:
      'Produz oócitos e hormônios em ciclos alternados, embora não estritamente: os dois ovários não se revezam de forma regular, e a ovulação pode ocorrer no mesmo lado meses seguidos.',
    vascularizacao:
      'Artéria ovárica esquerda, ramo direto da aorta em L2, com anastomose com o ramo ovárico da uterina. O retorno é a diferença: a veia ovárica do lado esquerdo desemboca na veia renal esquerda, e não diretamente na cava — exatamente como a testicular no homem.',
    inervacao:
      'Plexo ovárico (T10–T11), descendo com a artéria desde a aorta. É a razão de a dor ovariana ser periumbilical e mal localizada até irritar o peritônio parietal.',
    linfaticos:
      'Linfonodos lombares (para-aórticos), acompanhando a artéria ovárica de volta à aorta. Nunca inguinais — o estadiamento do câncer de ovário se faz no abdome.',
    relacoes:
      'O ureter esquerdo passa imediatamente atrás da fossa ovárica, e o mesocolo sigmoide o cobre por diante — vizinhança que não existe à direita.',
    clinica:
      'Duas consequências práticas da drenagem venosa pela renal esquerda: a síndrome de congestão pélvica, com varizes ováricas e dor pélvica crônica, é predominantemente esquerda, pelo mesmo mecanismo que faz a varicocele ser esquerda no homem. E a proximidade com o sigmoide faz uma torção ou um cisto roto à esquerda ser confundido com diverticulite — a inversão do erro clássico da direita, em que se pensa em apendicite.',
    memoria:
      'À esquerda, a veia do ovário desemboca na renal, como a do testículo. Congestão pélvica e varicocele têm a mesma anatomia.',
    pontos: [
      'Em que veia drena o ovário esquerdo?',
      'Para onde vai a linfa do ovário e por quê?',
      'Que estrutura passa atrás da fossa ovárica esquerda?',
    ],
  },
  {
    termos: [
      'Tuba Uterina Esquerda',
    ],
    classe: 'viscera',
    resumo:
      'Tuba uterina do lado esquerdo, que conduz o oócito do ovário ao útero pela borda superior do ligamento largo.',
    localizacao:
      'Na borda superior do ligamento largo esquerdo, da parede lateral da pelve ao corno uterino esquerdo, com cerca de 10 cm; sua porção livre é envolvida pela mesossalpinge.',
    funcao:
      'Não é um cano passivo. Suas quatro porções — infundíbulo, ampola, istmo e parte uterina — têm epitélio, calibre e motilidade distintos, e é o batimento ciliar somado à peristalse que move o oócito, contra a corrente do líquido peritoneal.',
    vascularizacao:
      'Ramo tubário da artéria uterina esquerda, vindo de medial, e ramo tubário da artéria ovárica esquerda, vindo de lateral, anastomosados dentro da mesossalpinge. Dupla irrigação em arcada — a razão de a tuba resistir bem à ligadura de uma das fontes.',
    inervacao: 'Plexos ovárico e uterovaginal, com simpático de T10 a L2 e parassimpático de S2 a S4.',
    linfaticos: 'Linfonodos lombares, junto com o ovário — e não os pélvicos, como o útero.',
    relacoes: 'Cruza sobre o ovário e sobre o ureter esquerdo; o mesocolo sigmoide fica imediatamente atrás e acima.',
    clinica:
      'A ampola é o sítio de cerca de 70% das gestações ectópicas, e a rotura de uma ectópica tubária esquerda produz hemoperitônio de instalação rápida — o sangue escorre para o fundo de saco de Douglas, que é o que a ultrassonografia procura. E a aderência tubária pós-doença inflamatória pélvica é a principal causa de infertilidade tubária e o principal fator de risco para a própria ectópica: a tuba lesada conduz mal, e o embrião implanta onde parou.',
    memoria:
      'A tuba tem irrigação vindo dos dois lados e se encontra no meio. Mas basta ela conduzir mal para o embrião parar no caminho.',
    pontos: [
      'Quais são as quatro porções da tuba uterina?',
      'Que duas artérias a irrigam e onde se anastomosam?',
      'Por que a doença inflamatória pélvica aumenta o risco de gravidez ectópica?',
    ],
  },
  {
    termos: [
      'Cavidade do Útero',
    ],
    classe: 'viscera',
    resumo: 'O espaço virtual triangular dentro do corpo do útero — o vão, e não a parede que o cerca.',
    localizacao:
      'Dentro do corpo uterino, triangular no plano frontal e uma simples fenda no sagital: as paredes anterior e posterior se tocam. Comunica-se com as tubas nos ângulos superiores e com o canal cervical no vértice inferior.',
    funcao:
      'É o espaço onde o embrião implanta. Sua área normal é de apenas 5 a 10 mL, e ela cresce até 5 litros no termo da gravidez — a maior variação de volume de qualquer cavidade do corpo humano.',
    vascularizacao:
      'As artérias espiraladas do endométrio que a forram são o vaso decisivo: elas se contraem em resposta à queda de progesterona e produzem a isquemia que descama o endométrio — a menstruação é um evento vascular, não epitelial.',
    inervacao:
      'Plexo uterovaginal, com aferentes que sobem por T10 a L1. A distensão da cavidade — por um DIU, por coágulos, pela histerossonografia — dói exatamente como cólica menstrual, porque é a mesma via.',
    linfaticos:
      'Linfonodos ilíacos externos e internos, com uma via acessória para os inguinais superficiais ao longo do ligamento redondo — a única explicação para o câncer de endométrio dar, raramente, linfonodo na virilha.',
    relacoes: 'Suas paredes anterior e posterior estão em aposição; a cavidade só existe de fato quando algo a distende.',
    clinica:
      'Por ser virtual, ela cicatriza aderida quando a camada basal do endométrio é lesada — a síndrome de Asherman, causa de amenorreia e infertilidade após curetagem vigorosa ou infecção. E é medindo essa cavidade que se decide o método: um DIU precisa de histerometria entre 6 e 9 cm, e uma cavidade distorcida por mioma submucoso é a causa mais comum de expulsão do dispositivo e de falha de implantação.',
    memoria:
      'A cavidade do útero é uma fenda, não um balão. Duas paredes encostadas que, se cicatrizarem juntas, não se separam mais.',
    pontos: [
      'Qual o volume normal da cavidade uterina e quanto ele muda na gravidez?',
      'Por que a menstruação é um fenômeno vascular?',
      'O que é a síndrome de Asherman?',
    ],
  },
  {
    termos: [
      'Óstio Uterino',
    ],
    classe: 'viscera',
    resumo: 'A abertura do colo do útero na vagina — o orifício externo, não o colo inteiro.',
    localizacao: 'No centro da porção vaginal do colo, no fundo da vagina, cercado pelos fórnices.',
    funcao:
      'É a porta entre a vagina, colonizada, e a cavidade uterina, estéril. Guardada pelo muco cervical, que muda de viscosidade no ciclo: espesso e impenetrável sob progesterona, fluido e filante sob estrogênio, na ovulação.',
    vascularizacao:
      'Ramos cervicais da artéria uterina, formando os plexos ázigos da vagina na linha média — vasos que sangram na biópsia e na conização.',
    inervacao:
      'Aferentes que sobem por S2–S4 pelos esplâncnicos pélvicos. A manipulação do óstio na inserção de DIU ou na histeroscopia dispara reflexo vagal, com bradicardia e lipotimia — o desconforto que o bloqueio paracervical previne.',
    linfaticos: 'Linfonodos ilíacos internos, obturatórios e parametriais.',
    relacoes:
      'Sua forma muda com a paridade: circular e puntiforme na nulípara, transversal e em fenda na multípara — dado que o exame ginecológico lê de imediato.',
    clinica:
      'É aqui, na junção escamocolunar do óstio, que nasce praticamente todo o câncer de colo uterino. O epitélio escamoso da vagina encontra o colunar do canal cervical, e essa fronteira migra ao longo da vida — para fora na adolescência e na gravidez, para dentro após a menopausa. É a zona de transformação, o alvo obrigatório da coleta citológica: um exame que não a amostrou é um exame que não vale.',
    memoria:
      'O óstio é onde dois epitélios se encontram — e é sempre na fronteira que o câncer começa. Citologia que não pegou a zona de transformação não serviu.',
    pontos: [
      'O que é a junção escamocolunar?',
      'Como a forma do óstio muda com a paridade?',
      'Por que a zona de transformação precisa ser amostrada na citologia?',
    ],
  },
  {
    termos: [
      'Óstio da Vagina',
    ],
    classe: 'viscera',
    resumo: 'A abertura da vagina no vestíbulo, parcialmente fechada pelo hímen.',
    localizacao:
      'Na parte posterior do vestíbulo, atrás do óstio externo da uretra e à frente do frênulo dos lábios menores.',
    funcao:
      'É a via de entrada e saída do canal vaginal. Sua elasticidade vem do bulbo do vestíbulo, tecido erétil que o ladeia, e dos músculos bulboesponjosos, que o estreitam voluntariamente.',
    vascularizacao:
      'Artérias do bulbo do vestíbulo e labiais posteriores, ramos da pudenda interna. O tecido erétil que o cerca é a razão de as lacerações desta região sangrarem tanto no parto.',
    inervacao:
      'Nervo pudendo (S2–S4), pelos ramos perineais. É inervação somática, e é ela que faz a distensão do óstio na expulsão ser a dor do segundo estágio do trabalho de parto — dor perineal aguda, distinta da dor visceral em cólica do primeiro estágio.',
    linfaticos: 'Linfonodos inguinais superficiais — porque está abaixo do hímen, no território de drenagem externa.',
    relacoes:
      'Os ductos das glândulas vestibulares maiores (de Bartholin) abrem-se nas suas margens posterolaterais, às 5 e às 7 horas.',
    clinica:
      'A obstrução do ducto de Bartholin nessa margem produz o cisto e, se infectado, o abscesso — massa dolorosa unilateral no terço posterior do grande lábio, tratada por marsupialização, e não por simples drenagem, para evitar a recidiva. E a contração involuntária dos músculos ao redor do óstio é o vaginismo: um espasmo reflexo, não uma alteração estrutural, e por isso tratado com fisioterapia e dessensibilização.',
    memoria:
      'Cinco e sete horas: é ali que a Bartholin abre e é ali que o abscesso aparece. Abaixo do hímen, a linfa vai para a virilha.',
    pontos: [
      'Onde se abrem os ductos das glândulas de Bartholin?',
      'Por que a dor do segundo estágio do parto é diferente da do primeiro?',
      'Para onde drena a linfa desta região?',
    ],
  },
  {
    termos: [
      'Rima do Pudendo',
    ],
    classe: 'viscera',
    resumo: 'A fenda entre os lábios maiores — o espaço que eles delimitam, não os lábios.',
    localizacao:
      'Fenda mediana entre os dois lábios maiores, do monte púbico à comissura posterior; dentro dela ficam os lábios menores e o vestíbulo.',
    funcao:
      'É a fenda de fechamento da vulva. Os lábios maiores, com seu coxim de gordura, se aproximam em repouso e mantêm a rima fechada — o que protege o vestíbulo e o óstio uretral da contaminação e do ressecamento.',
    vascularizacao:
      'Artérias pudendas externas, ramos da femoral, à frente, e labiais posteriores, ramos da pudenda interna, atrás — as duas fontes que irrigam os lábios que a delimitam.',
    inervacao:
      'Nervo ilioinguinal e ramo genital do genitofemoral (L1) na porção anterior; nervo pudendo (S2–S4) e cutâneo femoral posterior na posterior.',
    linfaticos: 'Linfonodos inguinais superficiais.',
    relacoes:
      'Sua profundidade e o quanto ela permanece fechada dependem inteiramente do volume de gordura dos lábios maiores.',
    clinica:
      'A rima aberta em repouso é sinal, não achado estético: na menopausa, a atrofia do coxim adiposo e a perda de estrogênio deixam a rima entreaberta, expondo o vestíbulo — o que produz ressecamento, dispareunia e infecções urinárias de repetição, o quadro hoje chamado síndrome geniturinária da menopausa. É também por essa exposição que a candidíase e a vulvite de contato se instalam com mais facilidade após a menopausa.',
    memoria:
      'A rima é a fenda; os lábios são as bordas. Rima que não fecha mais expõe o vestíbulo — e é daí que vem a infecção de repetição na menopausa.',
    pontos: [
      'Qual a diferença entre rima do pudendo e lábios maiores?',
      'O que mantém a rima fechada?',
      'Por que a rima entreaberta favorece infecção urinária na menopausa?',
    ],
  },
  {
    termos: [
      'Quadrante Inferior Medial',
    ],
    classe: 'glandula',
    resumo: 'Quadrante inferointerno da mama, o de menor volume glandular e o de pior prognóstico linfático.',
    localizacao:
      'Porção inferior e medial da mama, junto ao esterno e ao rebordo costal, entre o quinto e o sexto espaços intercostais.',
    funcao:
      'Contém a menor massa de tecido glandular dos quatro quadrantes — cerca de 5% do total —, o que o torna o sítio menos frequente de tumor primário.',
    vascularizacao:
      'Ramos perfurantes da artéria torácica interna, dos quarto e quinto espaços, e ramos das intercostais posteriores.',
    inervacao: 'Ramos cutâneos anteriores dos nervos intercostais do quarto ao sexto espaço.',
    linfaticos:
      'Aqui está o que importa: drena preferencialmente para os linfonodos paraesternais, ao longo dos vasos torácicos internos, e daí para o mediastino — e não para a axila, como fazem os quadrantes laterais. Há ainda comunicação com os linfáticos do abdome superior e com a mama contralateral.',
    relacoes: 'Está sobre o reto do abdome e o oblíquo externo, na porção que ultrapassa o rebordo costal.',
    clinica:
      'Um tumor deste quadrante pode ter axila negativa e ainda assim já ter metastatizado para a cadeia mamária interna, invisível ao linfonodo sentinela axilar — motivo pelo qual tumores mediais são estadiados com mais cuidado e frequentemente recebem irradiação da cadeia mamária interna. Localização medial é, por si só, um fator de pior prognóstico, e a razão é puramente anatômica: a linfa foge por uma porta que não se inspeciona.',
    memoria: 'Quadrante medial drena para dentro do peito, não para a axila. Axila limpa não significa doença limitada.',
    pontos: [
      'Para onde drena a linfa dos quadrantes mediais da mama?',
      'Por que a localização medial piora o prognóstico?',
      'Que fração do tecido glandular este quadrante contém?',
    ],
  },
  {
    termos: [
      'Processo Axilar da Mama',
    ],
    classe: 'glandula',
    resumo: 'Prolongamento de tecido mamário que sobe para a axila através do hiato da fáscia — a cauda de Spence.',
    localizacao:
      'Do quadrante superolateral, atravessa o forame de Langer na fáscia axilar e alcança o nível I da axila, junto aos linfonodos peitorais.',
    funcao:
      'É a única parte da mama que fica FORA da fáscia peitoral e dentro da axila. Sendo tecido mamário verdadeiro, responde a estrogênio e progesterona como o restante da glândula — ingurgita no ciclo e na lactação.',
    vascularizacao: 'Artéria torácica lateral, ramo da axilar, e ramos peitorais da toracoacromial.',
    inervacao:
      'Ramos cutâneos laterais dos nervos intercostais do segundo ao quarto espaço e nervo intercostobraquial (T2), que atravessa a axila.',
    linfaticos: 'Linfonodos axilares do nível I, os primeiros da cadeia — vizinhança direta, sem estação intermediária.',
    relacoes:
      'Está no mesmo compartimento dos linfonodos axilares, e não separado deles pela fáscia como o resto da mama.',
    clinica:
      'É a razão de a mastectomia \'total\' precisar incluir a axila baixa: deixar a cauda de Spence é deixar tecido mamário, com risco de recidiva e, no caso de mastectomia profilática, de câncer no que deveria ter sido retirado. Clinicamente, é também a causa mais frequente de \'nódulo axilar\' cíclico e doloroso na mulher jovem — tecido mamário normal ingurgitando no lugar errado, que não precisa de biópsia quando reconhecido.',
    memoria: 'Um pedaço de mama mora dentro da axila. Nódulo axilar que dói na TPM é mama, não gânglio.',
    pontos: [
      'O que é a cauda de Spence e por onde ela passa?',
      'Por que a mastectomia precisa incluí-la?',
      'Por que ela produz nódulo axilar cíclico?',
    ],
  },
  {
    termos: [
      'Aréola Mamária',
    ],
    classe: 'glandula',
    resumo: 'Área circular pigmentada ao redor da papila, com glândulas próprias que a lubrificam.',
    localizacao:
      'Ao redor da papila mamária, com 15 a 25 mm na nulípara e escurecendo de forma permanente na primeira gestação.',
    funcao:
      'Contém os tubérculos de Montgomery — glândulas sebáceas modificadas cuja secreção lubrifica e protege a papila na amamentação, e cujo odor ajuda o recém-nascido a localizar o mamilo. Sob ela há fibras musculares lisas circulares que enrugam a aréola e projetam a papila.',
    vascularizacao:
      'Plexo subareolar de Haller, alimentado pelos ramos perfurantes da torácica interna e pela torácica lateral — o mesmo plexo de onde partem os linfáticos que vão à axila.',
    inervacao:
      'Ramo cutâneo lateral do quarto nervo intercostal (T4), principal via da sensibilidade areolopapilar. É a via aferente do reflexo de ejeção do leite, e sua secção na mastopexia ou na redução mamária é o que pode abolir a amamentação futura.',
    linfaticos:
      'Plexo subareolar, que converge para os linfonodos axilares — é aqui que se injeta o corante na pesquisa do linfonodo sentinela.',
    relacoes:
      'Não tem folículos pilosos nem gordura subcutânea; a pele é fina e diretamente aderida ao tecido subjacente.',
    clinica:
      'A distinção entre aréola e papila decide o diagnóstico de duas doenças: a doença de Paget da mama é um eczema que começa na PAPILA e se espalha para a aréola, e denuncia carcinoma ductal subjacente; um eczema que começa na aréola e poupa a papila é quase sempre dermatite. A regra é seca e útil: lesão eczematosa que começa no mamilo é câncer até prova em contrário, e exige biópsia.',
    memoria: 'Eczema que começa na papila é Paget e é câncer. Eczema que começa na aréola e poupa a papila é dermatite.',
    pontos: [
      'O que são os tubérculos de Montgomery?',
      'Que nervo conduz a sensibilidade areolar e qual sua importância?',
      'Como diferenciar doença de Paget de eczema areolar?',
    ],
  },
  {
    termos: [
      'Pele',
    ],
    sistemas: [
      'genital-feminino',
    ],
    classe: 'fascia',
    resumo: 'Revestimento cutâneo da mama, fino e ancorado à glândula pelos ligamentos suspensores.',
    localizacao:
      'Cobre toda a mama, do rebordo costal à clavícula; é mais fina sobre a aréola e mais espessa na periferia.',
    funcao:
      'Não é um envoltório passivo: os ligamentos suspensores de Cooper partem da fáscia peitoral, atravessam a glândula e se inserem na derme, suspendendo a mama contra a gravidade. A pele é, literalmente, parte do sistema de sustentação.',
    vascularizacao:
      'Plexo subdérmico alimentado pelos ramos perfurantes da torácica interna, pela torácica lateral e pelas intercostais — irrigação vinda de profundidade, através da glândula.',
    inervacao:
      'Ramos cutâneos anteriores e laterais dos nervos intercostais do segundo ao sexto espaço, com T4 na região areolar.',
    linfaticos:
      'Plexo linfático dérmico e subdérmico, que converge para o plexo subareolar e daí para a axila. É a via da disseminação cutânea.',
    relacoes:
      'Está presa à glândula pelos ligamentos de Cooper, e essa aderência é o que produz os sinais clínicos mais importantes do exame de mama.',
    clinica:
      'Toda a semiologia da mama depende dessa ancoragem. Um tumor que traciona os ligamentos de Cooper retrai a pele — a retração ou o umbigamento que aparece quando a paciente eleva os braços. Um tumor que bloqueia os linfáticos dérmicos produz a pele em casca de laranja, com os poros afundados entre um edema que não pode drenar. E o carcinoma inflamatório, com toda a derme tomada por êmbolos tumorais, transforma a mama inteira em pele vermelha, quente e espessa — sem nódulo palpável, e frequentemente tratado como mastite por semanas.',
    memoria:
      'A pele da mama é pendurada na glândula por cordões. Tumor que puxa o cordão enruga a pele; tumor que entope o linfático faz casca de laranja.',
    pontos: [
      'O que são os ligamentos de Cooper?',
      'Como um tumor produz retração cutânea?',
      'Qual o mecanismo da pele em casca de laranja?',
    ],
  },
]
