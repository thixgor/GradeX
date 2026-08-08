/**
 * Aprofundamento didático por setor do currículo.
 *
 * ## O que mudou em relação ao que havia antes
 *
 * A página de lâmina anunciava seis seções — histogênese, ultraestrutura,
 * manutenção, diferenciais, correlações clínicas e resumo — e declarava que
 * nenhuma delas existia. Declarar a lacuna era honesto, mas o aluno ficava sem
 * o conteúdo. Este módulo escreve as seis.
 *
 * ## Por que a chave é o setor, e não a lâmina
 *
 * Histogênese, ultraestrutura e correlação clínica são propriedades do
 * **tecido ou do órgão**, não do corte específico. A origem embrionária do
 * epitélio é a mesma nas 95 lâminas de epitélio; escrevê-la por lâmina
 * repetiria o mesmo texto 95 vezes e o deixaria dessincronizado em cada cópia.
 * É a mesma alavanca de `resumos.ts`, `dossies.ts` e `laminas.ts`.
 *
 * A busca sobe a árvore do currículo, do nó mais específico ao mais geral. Isso
 * permite escrever um aprofundamento fino onde o subsetor reúne assuntos
 * distintos — cartilagem, osso e sangue convivem em `tecido-conjuntivo` e
 * pedem histogêneses diferentes — sem obrigar a escrever um para cada nó.
 *
 * ## O que este texto é, e o que não é
 *
 * É conteúdo próprio, de livro-texto, escrito para ensinar. **Não passou por
 * revisão biomédica**, e a tarja de pendência da página continua valendo. Não
 * há citação bibliográfica: inventar referência seria pior que não ter — e a
 * página diz isso ao aluno em vez de simular respaldo que não existe.
 */

export interface DiferencialDeDiagnostico {
  /** Com o que esta estrutura é confundida na prática. */
  confundeCom: string
  /** O critério que resolve a dúvida — precisa ser observável na lâmina. */
  comoSeparar: string
}

export interface CorrelacaoClinica {
  /** Condição, achado ou procedimento. */
  condicao: string
  /** O que a histologia explica sobre ela. */
  correlacao: string
}

export interface Aprofundamento {
  /** De que folheto embrionário vem, e como chega à forma adulta. */
  histogenese: string
  /** O que a microscopia eletrônica mostra e a de luz não alcança. */
  ultraestrutura: string
  /** Vascularização, inervação e capacidade de renovação. */
  manutencao: string
  /** Confusões frequentes e o critério que as desfaz. */
  diferenciais: DiferencialDeDiagnostico[]
  /** Onde a histologia explica a clínica. */
  clinica: CorrelacaoClinica[]
  /** Frases curtas, de fixação — o que sobra depois de fechar a página. */
  retencao: string[]
}

export const APROFUNDAMENTOS: Record<string, Aprofundamento> = {
  /* ═══════════ Histologia Básica ═══════════ */

  'histologia-basica/preparacao-do-tecido': {
    histogenese:
      'Esta seção não trata de um tecido, e sim do **método** que torna qualquer tecido visível — por isso não há folheto embrionário a rastrear. O que vale reconstruir é a história do procedimento: a microtomia em parafina se consolidou no fim do século XIX, quando a substituição da secagem ao ar pela inclusão em meio sólido permitiu cortes finos e reprodutíveis, e a padronização da fixação em formaldeído tornou possível comparar preparações feitas em laboratórios diferentes. Toda lâmina que o aluno examina é, portanto, o resultado de uma cadeia de decisões técnicas tomadas há mais de um século — e cada uma delas continua deixando marca reconhecível no que se vê.',
    ultraestrutura:
      'O preparo para microscopia eletrônica é uma versão mais exigente do mesmo roteiro, e as diferenças explicam por que as imagens são tão distintas. A fixação usa **glutaraldeído**, que faz ligações cruzadas mais estáveis por ter dois grupos aldeído, seguido de **tetróxido de ósmio**, que fixa lipídios e ao mesmo tempo os torna elétron-densos — é dele que vem a imagem trilaminar da membrana. A inclusão é em **resina epóxi**, muito mais dura que a parafina, e o corte sai do ultramicrótomo com **60 a 90 nm**, cerca de cem vezes mais fino que o de rotina, porque o feixe de elétrons quase não penetra. O contraste vem de **acetato de uranila** e **citrato de chumbo**. Antes disso, cortes semifinos de aproximadamente 1 µm corados por azul de toluidina são examinados em luz para escolher a área.',
    manutencao:
      'O que mantém a qualidade de uma preparação é o controle de cada etapa, e as falhas têm assinatura própria. **Fixação tardia ou insuficiente** produz autólise: núcleos pálidos, contornos celulares indistintos, citoplasma granuloso. **Volume de fixador insuficiente** — a regra prática é vinte vezes o volume da peça — fixa a periferia e deixa o centro autolisado, com um gradiente visível do bordo para o miolo. **Desidratação incompleta** impede a parafina de infiltrar e o bloco esfarela ao corte. **Navalha cega ou vibração** produz estrias transversais paralelas, o chatter. **Banho-maria frio** deixa pregas. **Descalcificação excessiva** em osso destrói o detalhe nuclear e impede a coloração. Reconhecer o artefato é tão importante quanto reconhecer a estrutura: metade dos erros de iniciante é descrever um artefato como achado.',
    diferenciais: [
      {
        confundeCom: 'espaço anatômico real',
        comoSeparar:
          'A fenda de retração acompanha o contorno de uma célula ou de um feixe e tem largura uniforme; o espaço real tem revestimento próprio — endotélio, mesotélio ou epitélio — e conteúdo.',
      },
      {
        confundeCom: 'vacúolo de degeneração',
        comoSeparar:
          'O vacúolo de lipídio extraído é redondo, de contorno nítido e ocorre onde se espera gordura; degeneração hidrópica é irregular, dispersa e acompanhada de outras alterações celulares.',
      },
      {
        confundeCom: 'depósito patológico',
        comoSeparar:
          'Precipitado de formol é acastanhado, refringente e distribuído sobre o tecido inteiro, inclusive fora dele; pigmento verdadeiro respeita compartimentos celulares.',
      },
    ],
    clinica: [
      {
        condicao: 'Exame de congelação intraoperatório',
        correlacao:
          'O criostato corta tecido congelado em minutos e permite decidir margem cirúrgica com o paciente ainda na mesa. O preço é a morfologia: cristais de gelo distorcem o citoplasma, e o diagnóstico definitivo sempre espera a parafina.',
      },
      {
        condicao: 'Imuno-histoquímica e recuperação antigênica',
        correlacao:
          'As pontes de metileno do formaldeído mascaram epítopos, e por isso a imuno-histoquímica exige recuperação antigênica por calor ou protease. Fixação prolongada demais pode tornar um marcador irrecuperável — a lâmina fica tecnicamente perfeita e imunologicamente muda.',
      },
      {
        condicao: 'Tempo de isquemia fria',
        correlacao:
          'O intervalo entre a retirada da peça e a imersão no fixador degrada RNA e fosfoproteínas. Em oncologia, isso decide se um teste molecular será possível — e é por isso que o protocolo de coleta faz parte do laudo.',
      },
    ],
    retencao: [
      'Toda lâmina é uma **sequência de agressões controladas**: fixar, desidratar, diafanizar, incluir, cortar, corar.',
      'O que some no processamento: **lipídio** e **glicogênio** — os espaços claros são eles.',
      'Microscopia eletrônica: glutaraldeído mais **ósmio**, resina epóxi, corte de **60 a 90 nm**.',
      'Antes de chamar algo de achado, pergunte se **uma etapa do preparo** poderia tê-lo criado.',
    ],
  },

  'histologia-basica/corantes': {
    histogenese:
      'A coloração histológica nasceu da indústria têxtil: os corantes de anilina sintetizados a partir de 1856 chegaram aos laboratórios porque tingiam fibras, e descobriu-se que tingiam tecido biológico com seletividade. A **hematoxilina** é anterior e vem do cerne de uma árvore centro-americana; sozinha não cora, e só funciona depois de oxidada a hemateína e complexada a um mordente metálico, em geral alumínio. A combinação com **eosina** se firmou como rotina no início do século XX porque separa, com dois corantes apenas, os dois grandes compartimentos da célula — e por isso continua sendo a primeira lâmina que qualquer aluno vê.',
    ultraestrutura:
      'Em microscopia eletrônica não existe cor: a imagem se forma por **espalhamento de elétrons**, e o que espalha mais aparece escuro. Como os elementos biológicos são leves, o contraste depende de introduzir metais pesados que se liguem seletivamente. O **ósmio** reage com as duplas ligações dos lipídios insaturados e torna todas as membranas visíveis. O **acetato de uranila** liga-se a ácidos nucleicos e proteínas, realçando cromatina e ribossomos. O **citrato de chumbo** aumenta o contraste geral. Fala-se, portanto, em **elétron-denso** e **elétron-lucente**, nunca em corado — e traduzir tons de cinza em afinidade química é a leitura correta de qualquer eletromicrografia.',
    manutencao:
      'A qualidade da coloração depende de variáveis que o aluno deve saber reconhecer no resultado. **Hematoxilina sobre-oxidada** perde poder e deixa núcleos pálidos e acinzentados. **Diferenciação excessiva** em álcool ácido remove o corante do núcleo e a lâmina fica rosa. **Viragem insuficiente** deixa a hematoxilina avermelhada em vez de azul, porque a cor depende do pH. **Eosina concentrada demais** apaga a distinção entre citoplasma e colágeno. Em técnicas especiais, o controle importa ainda mais: sem o corte tratado com **diastase**, não se pode afirmar que o magenta do PAS é glicogênio, e sem controle positivo conhecido, uma imuno-histoquímica negativa não distingue ausência de antígeno de falha técnica.',
    diferenciais: [
      {
        confundeCom: 'basofilia por RNA e por glicosaminoglicano',
        comoSeparar:
          'Ambas captam hematoxilina, mas a de RNA é citoplasmática e desaparece após digestão por ribonuclease; a de matriz é extracelular e persiste, além de ser metacromática ao azul de toluidina.',
      },
      {
        confundeCom: 'PAS de glicogênio e de mucina',
        comoSeparar:
          'O corte tratado com diastase perde a marcação do glicogênio e mantém a das mucinas e da membrana basal. Sem esse controle, a afirmação não se sustenta.',
      },
      {
        confundeCom: 'colágeno e músculo liso no H&E',
        comoSeparar:
          'Em H&E os dois são acidófilos e se confundem em corte transversal. O tricrômico resolve: colágeno em azul ou verde, músculo em vermelho.',
      },
    ],
    clinica: [
      {
        condicao: 'Estadiamento de fibrose hepática',
        correlacao:
          'A extensão do azul no tricrômico mede diretamente quanto de parênquima foi substituído por colágeno, e é ela que fundamenta a graduação histológica da cirrose.',
      },
      {
        condicao: 'Amiloidose',
        correlacao:
          'O vermelho Congo cora o depósito de amiloide e, sob luz polarizada, produz birrefringência verde-maçã. Nenhuma outra substância do tecido reproduz essa combinação, o que torna a técnica praticamente diagnóstica.',
      },
      {
        condicao: 'Imuno-histoquímica em oncologia',
        correlacao:
          'Determinar receptor hormonal, HER2 ou marcadores de linhagem decide tratamento. A técnica exige controles interno e externo em cada lâmina — sem eles, o resultado não é interpretável.',
      },
    ],
    retencao: [
      'Corante **básico** cora o que é ácido: núcleo, RER, matriz sulfatada. Isso é **basofilia**.',
      'Corante **ácido** cora o que é básico: citoplasma, colágeno, hemácia. Isso é **acidofilia**.',
      '**PAS** revela carboidrato; só com controle de **diastase** ele prova glicogênio.',
      '**Tricrômico** para fibrose, **prata** para fibras reticulares, **Verhoeff** para elastina.',
      'Metacromasia: o corante **muda de cor**, não de intensidade — mastócito e cartilagem.',
    ],
  },

  /* ═══════════ Células ═══════════ */

  celulas: {
    histogenese:
      'Toda célula do corpo humano descende do **zigoto**, e a diversidade que se observa nas lâminas resulta de expressão gênica diferencial, não de conteúdo genético diferente: com poucas exceções, cada célula carrega o mesmo genoma. A partir do zigoto, a clivagem produz a mórula e o blastocisto, e a gastrulação estabelece os três folhetos — **ectoderma**, **mesoderma** e **endoderma** — de que derivam todos os tecidos. A **crista neural**, que se desprende do ectoderma, é um caso à parte pela variedade do que origina: melanócitos, células de Schwann, medula da suprarrenal, gânglios sensitivos e boa parte do mesênquima da cabeça. Rastrear o folheto de origem explica associações que, de outro modo, pareceriam arbitrárias.',
    ultraestrutura:
      'A microscopia de luz não resolve organelas individuais, e quase tudo o que se atribui a elas é inferência a partir de efeitos de conjunto: **basofilia** citoplasmática indica retículo rugoso e polissomos, **acidofilia** indica mitocôndrias e filamentos, e o **halo claro** justanuclear é o Golgi, que não retém corante. A microscopia eletrônica mostra o que produz esses efeitos: cisternas empilhadas cobertas de ribossomos no rugoso, túbulos anastomosados sem ribossomos no liso, pilha de sacos achatados com polaridade cis-trans no Golgi, dupla membrana com cristas nas mitocôndrias, corpos elétron-densos heterogêneos nos lisossomos, e os três calibres do citoesqueleto — 7 nm de actina, 10 nm dos filamentos intermediários, 25 nm dos microtúbulos.',
    manutencao:
      'A célula se mantém por renovação contínua de seus componentes, e três sistemas fazem isso. A **via secretora** produz e endereça proteínas do retículo ao Golgi e daí ao destino final. A **via endocítica** internaliza material e o conduz a endossomos e lisossomos. A **autofagia** sequestra organelas envelhecidas em autofagossomos que se fundem a lisossomos, reciclando componentes — é o que impede o acúmulo de material danificado, e sua falência progressiva é parte do envelhecimento celular. A capacidade de **divisão** varia radicalmente: células lábeis, como as do epitélio intestinal e da epiderme, dividem-se continuamente; estáveis, como o hepatócito, dividem-se sob estímulo; e permanentes, como o neurônio e o cardiomiócito, saem do ciclo definitivamente.',
    diferenciais: [
      {
        confundeCom: 'basofilia nuclear e citoplasmática',
        comoSeparar:
          'A nuclear é cromatina e nucléolo, delimitada pelo envoltório; a citoplasmática é retículo rugoso e polissomos, difusa ou em blocos, e indica síntese proteica para exportação.',
      },
      {
        confundeCom: 'vacúolo de lipídio e de glicogênio',
        comoSeparar:
          'Ambos ficam vazios em H&E, mas o lipídio é redondo e de contorno nítido e o glicogênio é irregular e finamente granular. O PAS com diastase separa os dois com segurança.',
      },
      {
        confundeCom: 'grânulo de secreção e lisossomo',
        comoSeparar:
          'Em microscopia eletrônica, o grânulo de secreção tem conteúdo homogêneo e fica no polo apical; o lisossomo é heterogêneo, de tamanho variável, e não respeita polaridade.',
      },
    ],
    clinica: [
      {
        condicao: 'Doenças de depósito lisossômico',
        correlacao:
          'A falta de uma hidrolase específica faz o substrato acumular dentro do lisossomo, que incha e distende a célula. Tay-Sachs, Gaucher e as mucopolissacaridoses são variações do mesmo mecanismo em enzimas diferentes.',
      },
      {
        condicao: 'Ciliopatias',
        correlacao:
          'Defeitos no axonema ou no transporte intraflagelar produzem um quadro previsível a partir de onde há cílio: infecção respiratória de repetição, infertilidade, situs inversus e doença renal cística.',
      },
      {
        condicao: 'Alvos quimioterápicos no citoesqueleto',
        correlacao:
          'A instabilidade dinâmica dos microtúbulos é explorada por vincristina, que impede a polimerização, e por taxanos, que a estabilizam em excesso. Ambos bloqueiam a mitose por caminhos opostos.',
      },
    ],
    retencao: [
      'Mesmo genoma, **expressão diferente** — é isso que produz a diversidade celular.',
      'Basofilia é **RER e polissomos**; acidofilia é **mitocôndria e filamento**; halo claro é **Golgi**.',
      'Três calibres do citoesqueleto: **7 nm** actina, **10 nm** intermediários, **25 nm** microtúbulo.',
      'Lábil, estável, permanente — a capacidade de divisão prediz **se o tecido cicatriza ou fibrosa**.',
    ],
  },
  /* ═══════════ Tecidos ═══════════ */

  'tecidos/fundamentos-dos-tecidos': {
    histogenese:
      'Os quatro tecidos básicos se distribuem pelos folhetos embrionários de modo que vale memorizar porque explica associações inteiras. O **epitelial** é o único que deriva dos **três folhetos**: epiderme e anexos do ectoderma, revestimento do tubo digestório e das vias respiratórias do endoderma, e endotélio, mesotélio e epitélio urogenital do mesoderma. O **conjuntivo**, o **muscular** e o **sangue** derivam quase inteiramente do **mesoderma**, via mesênquima. O **nervoso** deriva do **ectoderma**, pelo tubo neural e pela crista neural. A crista neural é a grande exceção do sistema: sendo ectodérmica, ela produz tecidos com aparência mesenquimal — o ectomesênquima da cabeça, que forma dentina, cemento e boa parte do conjuntivo facial.',
    ultraestrutura:
      'Cada tecido básico tem uma assinatura ultraestrutural que a microscopia de luz apenas insinua. O **epitelial** exibe complexos juncionais completos no ápice — zônula de oclusão, zônula de adesão, desmossomos — mais hemidesmossomos na base e uma lâmina basal com lâmina lúcida e lâmina densa. O **conjuntivo** mostra fibrilas de colágeno com o padrão de bandas de 67 nm, fibras elásticas com núcleo amorfo e bainha de microfibrilas, e proteoglicanos que aparecem como material floculento. O **muscular** mostra o sarcômero com suas bandas, ou os corpos densos do liso. O **nervoso** mostra a bainha de mielina em lamelas concêntricas, as vesículas sinápticas e os feixes de neurofilamentos.',
    manutencao:
      'Os quatro diferem radicalmente em como se mantêm, e essa diferença prediz o desfecho de qualquer lesão. O **epitelial** é avascular e se nutre por difusão a partir do conjuntivo, mas se renova rapidamente a partir de células-tronco definidas — epiderme em quatro semanas, intestino em cinco dias. O **conjuntivo** é vascularizado, renova-se com lentidão e responde à lesão com fibrose. O **muscular** varia: o liso regenera bem e ainda faz hiperplasia, o esquelético repara de modo limitado pelas células satélites, e o cardíaco praticamente não regenera. O **nervoso** é o mais restrito: o axônio periférico regenera guiado pela lâmina basal da célula de Schwann, mas o corpo neuronal perdido não é reposto, e no sistema central nem o axônio se recupera.',
    diferenciais: [
      {
        confundeCom: 'epitélio e mesotélio',
        comoSeparar:
          'Mesotélio é epitélio simples pavimentoso de origem mesodérmica que reveste cavidades fechadas; funcionalmente pertence à serosa, e sua identificação depende do contexto — cavidade fechada, não aberta ao exterior.',
      },
      {
        confundeCom: 'conjuntivo denso e músculo liso em corte transversal',
        comoSeparar:
          'Em H&E os dois são acidófilos e fibrilares. O tricrômico separa por cor, e os núcleos ajudam: no músculo liso eles são centrais e ovoides; no conjuntivo denso, achatados e periféricos aos feixes.',
      },
      {
        confundeCom: 'tecido nervoso e conjuntivo frouxo',
        comoSeparar:
          'O neurópilo do sistema nervoso central é fibrilar e sem matriz extracelular visível; o conjuntivo frouxo tem fibras colágenas identificáveis, vasos e células de defesa.',
      },
    ],
    clinica: [
      {
        condicao: 'Cicatrização por primeira e segunda intenção',
        correlacao:
          'Bordas aproximadas permitem reepitelização rápida com pouca fibrose; perda extensa exige tecido de granulação, contração e cicatriz, porque o conjuntivo repara depositando colágeno, não restaurando a arquitetura original.',
      },
      {
        condicao: 'Metaplasia',
        correlacao:
          'Um epitélio maduro pode ser substituído por outro melhor adaptado à agressão — escamoso no brônquio do fumante, colunar no esôfago de Barrett. É adaptação reversível, mas o terreno metaplásico tem risco aumentado de displasia.',
      },
      {
        condicao: 'Origem tecidual de um tumor',
        correlacao:
          'Carcinoma vem de epitélio, sarcoma de conjuntivo, linfoma de tecido linfoide, glioma de glia. Quando a morfologia não basta, o filamento intermediário resolve: queratina em epitélio, vimentina em mesenquimal, desmina em músculo, GFAP em astrócito.',
      },
    ],
    retencao: [
      'Quatro tecidos básicos; só o **epitelial** vem dos três folhetos embrionários.',
      'A capacidade de renovação prediz o desfecho: quem não regenera, **fibrosa**.',
      'O **filamento intermediário** é específico de linhagem — é o que classifica tumor indiferenciado.',
      'Todo órgão se lê pela dupla **parênquima e estroma** antes de qualquer detalhe.',
    ],
  },

  'tecidos/epitelio': {
    histogenese:
      'O epitélio é o único tecido básico derivado dos **três folhetos**, e a origem explica nomes e comportamentos. Do **ectoderma** vêm a epiderme e seus anexos, o epitélio da córnea, o esmalte dentário e a adeno-hipófise. Do **endoderma** vêm o revestimento do tubo digestório e das vias respiratórias, mais o parênquima do fígado, do pâncreas e da tireoide. Do **mesoderma** vêm o **endotélio** dos vasos, o **mesotélio** das serosas e o epitélio urogenital — e é por isso que esses dois recebem nome próprio: têm função epitelial com origem mesenquimal. As glândulas se formam por invaginação de um epitélio de revestimento; quando o cordão de células mantém conexão com a superfície, ela vira ducto e a glândula é exócrina; quando a perde, a glândula é endócrina.',
    ultraestrutura:
      'A polaridade epitelial é uma construção ultraestrutural, e cada domínio tem seu aparato. No **apical** ficam as especializações de superfície: microvilosidades com eixo de actina e cerca de 1 µm, estereocílios que são microvilosidades longas e imóveis, e cílios com axonema 9+2 sobre corpúsculo basal 9+3. No topo do domínio lateral vem o **complexo juncional**: zônula de oclusão, com cordões de claudina e ocludina que vedam o espaço e impedem a difusão lateral de proteínas de membrana; zônula de adesão, cinturão de caderinas ligado à actina; e desmossomos, pontuais, ancorando filamentos intermediários. Espalhadas pelo lateral há **junções comunicantes** de conexinas. Na base, **hemidesmossomos** com integrina α6β4 prendem a célula à lâmina basal.',
    manutencao:
      'Todo epitélio é **avascular** e se nutre por difusão a partir do conjuntivo subjacente — é essa dependência que limita sua espessura e que torna a lâmina basal uma interface obrigatória, e não um detalhe. A renovação é rápida e parte de compartimentos de células-tronco bem localizados: a camada basal na epiderme, o istmo na glândula gástrica, o meio da cripta no intestino, o limbo na córnea. A inervação é rica em terminações livres sensitivas que sobem entre as células, mas não há vasos entre elas. Quando o epitélio é lesado, a reparação ocorre por migração das células vizinhas sobre a lâmina basal preservada, seguida de proliferação — e é por isso que a integridade da lâmina basal decide entre restituição perfeita e cicatriz.',
    diferenciais: [
      {
        confundeCom: 'pseudoestratificado e estratificado',
        comoSeparar:
          'No pseudoestratificado todas as células tocam a lâmina basal, embora nem todas alcancem a superfície. Confirme seguindo as células mais baixas até a base antes de contar camadas.',
      },
      {
        confundeCom: 'simples cortado obliquamente e estratificado verdadeiro',
        comoSeparar:
          'O corte oblíquo faz um epitélio simples parecer ter várias camadas. Verifique a forma dos núcleos e procure uma região do mesmo corte em que o plano seja perpendicular.',
      },
      {
        confundeCom: 'urotélio e estratificado pavimentoso',
        comoSeparar:
          'As células superficiais do urotélio são grandes, abauladas e frequentemente binucleadas, e mudam de forma com a distensão. O estratificado pavimentoso tem células superficiais achatadas e descamantes.',
      },
      {
        confundeCom: 'cílios e microvilosidades',
        comoSeparar:
          'Cílios têm 5 a 10 µm e corpúsculo basal, que em luz aparece como faixa escura sob o ápice. Microvilosidades têm cerca de 1 µm e formam uma borda estriada homogênea, sem faixa basal.',
      },
    ],
    clinica: [
      {
        condicao: 'Pênfigo vulgar e penfigoide bolhoso',
        correlacao:
          'Autoanticorpos contra desmogleína rompem desmossomos e produzem bolha **intraepidérmica**; contra componentes do hemidesmossomo, produzem bolha **subepidérmica**. O nível da separação, visível na lâmina, distingue as duas doenças.',
      },
      {
        condicao: 'Esôfago de Barrett',
        correlacao:
          'O refluxo ácido crônico substitui o epitélio estratificado pavimentoso por colunar com células caliciformes. É metaplasia adaptativa, e o terreno resultante tem risco aumentado de adenocarcinoma — daí a vigilância endoscópica.',
      },
      {
        condicao: 'Discinesia ciliar primária',
        correlacao:
          'Defeitos nos braços de dineína imobilizam o axonema. O resultado é previsível a partir de onde há cílio: infecção respiratória de repetição, infertilidade masculina e situs inversus em cerca de metade dos casos.',
      },
      {
        condicao: 'Carcinoma',
        correlacao:
          'É o tumor de origem epitelial e o mais frequente do adulto, porque epitélios se renovam muito e acumulam mutações. A expressão de queratina na imuno-histoquímica é o que o separa de sarcoma e linfoma.',
      },
    ],
    retencao: [
      'Epitélio é **avascular**, polarizado e apoiado em **lâmina basal** — as três coisas juntas.',
      'Classifique por **camadas** e depois pela **forma das células superficiais**, nessa ordem.',
      'Pseudoestratificado: **todas** tocam a base, nem todas chegam ao topo.',
      'Complexo juncional, de cima para baixo: **oclusão, adesão, desmossomo**.',
      'A integridade da **lâmina basal** decide entre restituição e cicatriz.',
    ],
  },

  'tecidos/tecido-muscular': {
    histogenese:
      'As três variedades têm origens que explicam suas diferenças. O **esquelético** vem dos **somitos** mesodérmicos: mioblastos migram, alinham-se e se **fundem** em miotubos multinucleados, que amadurecem em fibras — e é essa fusão que explica os muitos núcleos periféricos e o fato de a fibra ser um sincício. Algumas células não se fundem e permanecem como **células satélites** sob a lâmina basal, reserva regenerativa para a vida toda. O **cardíaco** vem do mesoderma esplâncnico que envolve o tubo cardíaco primitivo; suas células **não se fundem** — permanecem individuais e se unem por discos intercalares, o que explica o núcleo central único. O **liso** vem do mesênquima, com exceções notáveis de origem ectodérmica: os músculos da íris e as células mioepiteliais.',
    ultraestrutura:
      'No estriado, a unidade é o **sarcômero**, de linha Z a linha Z. A **banda A** corresponde ao comprimento do filamento de miosina e tem no meio a banda H, só de miosina, com a linha M ao centro. A **banda I** contém apenas actina e é atravessada pela linha Z. A contração desliza a actina sobre a miosina: as bandas I e H encurtam, a banda A **não muda**. O retículo sarcoplasmático envolve cada miofibrila e forma cisternas terminais que, com o túbulo T, compõem a **tríade** no esquelético e a **díade** no cardíaco. No **liso** não há sarcômero: actina e miosina se ancoram em **corpos densos** citoplasmáticos e em placas de adesão na membrana, e a contração encurta a célula em todas as direções, com o núcleo enrugando-se em saca-rolhas.',
    manutencao:
      'A vascularização acompanha a demanda metabólica: o **cardíaco** tem densidade capilar quase de um por fibra, porque seu metabolismo é estritamente aeróbio e ele não tolera isquemia; o **esquelético** varia conforme o tipo de fibra, com as vermelhas de contração lenta mais capilarizadas que as brancas. A inervação distingue radicalmente as três: o esquelético recebe **placa motora** individualizada e é voluntário; o liso recebe **varicosidades** difusas do autonômico, que banham várias células ao mesmo tempo; e o cardíaco é **autoexcitável**, com o autonômico apenas modulando um ritmo que nasce no nó sinoatrial. A regeneração vai de boa no liso, que ainda faz hiperplasia, a limitada no esquelético pelas células satélites, e praticamente nula no cardíaco — daí o infarto cicatrizar com fibrose.',
    diferenciais: [
      {
        confundeCom: 'cardíaco e esquelético',
        comoSeparar:
          'Núcleo central e ramificação indicam cardíaco; núcleos múltiplos e periféricos indicam esquelético. O disco intercalar fecha o diagnóstico, mas só aparece em corte longitudinal.',
      },
      {
        confundeCom: 'liso e conjuntivo denso',
        comoSeparar:
          'O músculo liso tem núcleos ovoides centrais e citoplasma acidófilo homogêneo; o conjuntivo denso tem núcleos achatados entre feixes fibrilares. O tricrômico separa por cor.',
      },
      {
        confundeCom: 'estriado em corte transversal e liso',
        comoSeparar:
          'Em corte transversal as estriações somem e a confusão é fácil. Procure as miofibrilas como pontos no sarcoplasma e verifique a posição dos núcleos.',
      },
      {
        confundeCom: 'miofibrila e miofilamento',
        comoSeparar:
          'A miofibrila é visível em luz e agrupa miofilamentos, que só aparecem em microscopia eletrônica. Trocar os termos é o deslize mais comum na descrição.',
      },
    ],
    clinica: [
      {
        condicao: 'Distrofia muscular de Duchenne',
        correlacao:
          'A falta de distrofina desconecta o citoesqueleto da matriz e a fibra se rompe a cada contração. A biópsia mostra variação de calibre, necrose, regeneração e substituição progressiva por gordura e fibrose.',
      },
      {
        condicao: 'Miastenia gravis',
        correlacao:
          'Autoanticorpos reduzem os receptores nicotínicos da placa motora. A margem de segurança da junção neuromuscular desaparece e surge fadiga que piora com o uso e melhora com o repouso.',
      },
      {
        condicao: 'Infarto do miocárdio',
        correlacao:
          'O cardiomiócito não regenera. A área necrosada é substituída por tecido fibroso, que não contrai nem conduz — e é essa cicatriz que sustenta tanto a insuficiência cardíaca quanto as arritmias tardias.',
      },
      {
        condicao: 'Hipertrofia e hiperplasia uterina',
        correlacao:
          'Na gravidez o miométrio cresce por hipertrofia das células e também por hiperplasia — o músculo liso é o único dos três que conserva capacidade mitótica significativa no adulto.',
      },
    ],
    retencao: [
      'Três perguntas classificam: **há estriação**, **onde e quantos são os núcleos**, **há disco intercalar**.',
      'Na contração, a **banda A não muda**; I e H encurtam.',
      'Tríade no esquelético, **díade** no cardíaco, cavéolas no liso.',
      'Regeneração: liso boa, esquelético limitada por **células satélites**, cardíaco nula.',
    ],
  },
  'tecidos/tecido-nervoso': {
    histogenese:
      'O tecido nervoso vem do **ectoderma**, por duas vias distintas. A notocorda induz a placa neural, que se invagina e fecha em **tubo neural** — dele saem o encéfalo, a medula, e toda a glia central: astrócitos, oligodendrócitos e ependimárias. A **micróglia** é a exceção: vem de precursores mieloides do saco vitelino que colonizam o sistema nervoso ainda no desenvolvimento, e por isso é funcionalmente um macrófago, não uma glia de origem neural. Da borda do tubo desprende-se a **crista neural**, que migra e origina os gânglios sensitivos e autonômicos, as células de Schwann, as satélites, a medula da suprarrenal e os melanócitos. Rastrear essas duas origens explica por que a lesão periférica regenera e a central não: a célula de Schwann produz lâmina basal, o oligodendrócito não.',
    ultraestrutura:
      'O **pericário** mostra a substância de Nissl como blocos de retículo rugoso com polissomos entre as cisternas, além de um Golgi extenso e neurofilamentos abundantes. O **cone de implantação** é reconhecível pela ausência de Nissl e pelo início do segmento inicial do axônio, com sua densidade submembranosa e alta concentração de canais de sódio. A **bainha de mielina** aparece como lamelas concêntricas com periodicidade de aproximadamente 12 nm, resultado do enrolamento repetido da membrana glial com extrusão do citoplasma; entre segmentos ficam os **nós de Ranvier**. A **sinapse** exibe vesículas ancoradas na zona ativa, fenda de 20 a 30 nm e densidade pós-sináptica. Nos axônios amielínicos, vários deles ocupam invaginações separadas de uma única célula de Schwann.',
    manutencao:
      'O sistema nervoso central consome cerca de 20% do oxigênio do corpo e não tolera isquemia: quatro a seis minutos bastam para lesão irreversível. Sua vascularização é protegida pela **barreira hematoencefálica**, formada por endotélio contínuo com junções estreitas, induzido e mantido pelos pés vasculares dos astrócitos. Não há vasos linfáticos convencionais no parênquima; a drenagem se faz pelo líquido cefalorraquidiano e pelos espaços perivasculares. A renovação é a mais limitada de todos os tecidos: o neurônio é célula **permanente** e não se repõe, com neurogênese adulta restrita a poucos sítios. No periférico, o axônio seccionado regenera a cerca de 1 mm por dia, guiado pelo tubo de lâmina basal das células de Schwann — condição que não existe no central, onde a cicatriz glial ainda bloqueia o crescimento.',
    diferenciais: [
      {
        confundeCom: 'axônio e dendrito',
        comoSeparar:
          'O axônio é único, mantém calibre constante, ramifica-se em ângulo reto e **não tem substância de Nissl** — nem ele nem o cone de implantação de onde parte. Dendritos são múltiplos, afilam-se e contêm Nissl.',
      },
      {
        confundeCom: 'gânglio sensitivo e autonômico',
        comoSeparar:
          'No sensitivo os corpos são grandes, redondos e cercados por um anel completo e regular de células satélites; no autonômico são menores, irregulares, mais espaçados e o anel satélite é incompleto.',
      },
      {
        confundeCom: 'núcleo de neurônio pequeno e de célula glial',
        comoSeparar:
          'O neurônio tem núcleo grande, eucromático e com nucléolo evidente, além de citoplasma com Nissl; a glia tem núcleo menor, mais denso, e citoplasma que não se distingue em H&E.',
      },
      {
        confundeCom: 'substância branca e conjuntivo',
        comoSeparar:
          'A branca é fibrilar, sem fibras colágenas identificáveis e sem vasos entre as fibras salvo os que a atravessam. Conjuntivo no sistema nervoso central só existe nas meninges e no espaço perivascular.',
      },
    ],
    clinica: [
      {
        condicao: 'Esclerose múltipla',
        correlacao:
          'A agressão é ao oligodendrócito e à mielina central. Como cada oligodendrócito mieliniza dezenas de axônios, a lesão de poucas células desmieliniza territórios amplos — e a remielinização central é lenta e incompleta.',
      },
      {
        condicao: 'Regeneração de nervo periférico',
        correlacao:
          'Após secção, o coto distal sofre degeneração walleriana, mas a lâmina basal das células de Schwann permanece como tubo-guia. O axônio cresce a cerca de 1 mm por dia — daí ser possível estimar o tempo de reinervação pela distância.',
      },
      {
        condicao: 'Cromatólise',
        correlacao:
          'Após lesão axonal, o corpo neuronal incha, o núcleo se desloca para a periferia e a substância de Nissl se dispersa. É reação de reparo, e sua presença numa lâmina indica agressão ao axônio daquele neurônio.',
      },
      {
        condicao: 'Barreira hematoencefálica e fármacos',
        correlacao:
          'Só moléculas pequenas e lipossolúveis atravessam livremente. É por isso que a levodopa é usada em vez de dopamina, e por que muitos antibióticos exigem dose maior ou via intratecal na meningite.',
      },
    ],
    retencao: [
      'O prolongamento **sem Nissl** é o axônio — critério prático e infalível.',
      'Schwann mieliniza **um** internódulo; oligodendrócito mieliniza **dezenas**.',
      'A **lâmina basal** da Schwann é o que permite regeneração periférica e falta no central.',
      'Barreira hematoencefálica: endotélio contínuo induzido pelos **pés astrocitários**.',
      'Neurônio é célula **permanente**: o que se perde não se repõe.',
    ],
  },

  'tecidos/tecido-conjuntivo': {
    histogenese:
      'Todo conjuntivo deriva do **mesênquima**, tecido embrionário de células estreladas em matriz gelatinosa abundante, que por sua vez vem sobretudo do **mesoderma** — com a exceção do ectomesênquima da cabeça, oriundo da crista neural, que forma dentina, cemento e boa parte do conjuntivo facial. Do mesênquima saem, por diferenciação progressiva, o fibroblasto, o adipócito, o condroblasto, o osteoblasto e as células do sangue. Essa origem comum explica a plasticidade do grupo: fibroblastos podem se converter em miofibroblastos na cicatrização, células estreladas hepáticas viram miofibroblastos na cirrose, e pericitos vasculares conservam potencial mesenquimal. O tecido conjuntivo **mucoso**, da geleia de Wharton, é essencialmente mesênquima que persistiu.',
    ultraestrutura:
      'A matriz é o que define o tecido, e a microscopia eletrônica mostra sua construção. O **colágeno** se organiza em hierarquia: tripla hélice de tropocolágeno de aproximadamente 300 nm, fibrilas de 20 a 90 nm com o padrão de bandas de **67 nm** produzido pelo deslocamento regular das moléculas, fibras visíveis em luz e feixes nos tecidos densos. A **fibra elástica** tem núcleo amorfo de elastina, reticulada por desmosina e isodesmosina, envolto por microfibrilas de **fibrilina** que orientam sua deposição. A **substância fundamental** aparece como material floculento: proteoglicanos com eixo proteico e cadeias de glicosaminoglicanos, agregados a ácido hialurônico, retendo água em volume muitas vezes superior ao próprio.',
    manutencao:
      'O conjuntivo é **vascularizado** — é justamente ele que leva vasos aos epitélios avasculares — e sua substância fundamental hidratada é o meio por onde nutrientes e resíduos difundem entre o capilar e a célula. A inervação é rica em terminações livres e encapsuladas. A renovação da matriz é contínua mas lenta, e depende do equilíbrio entre síntese pelos fibroblastos e degradação por **metaloproteinases**, cuja atividade é controlada por inibidores teciduais; o desequilíbrio para qualquer lado produz fibrose ou destruição. A síntese de colágeno exige **vitamina C** como cofator das hidroxilases que estabilizam a tripla hélice — sem ela, o colágeno formado é instável, e é isso que produz a fragilidade vascular e a má cicatrização do escorbuto.',
    diferenciais: [
      {
        confundeCom: 'frouxo e denso',
        comoSeparar:
          'Compare no mesmo campo a área ocupada por fibras com a ocupada por núcleos. No frouxo os núcleos dominam e há muitas células de tipos variados; no denso as fibras dominam e restam poucos fibrócitos.',
      },
      {
        confundeCom: 'denso modelado cortado transversalmente e não modelado',
        comoSeparar:
          'O modelado em corte transversal perde o paralelismo aparente. Procure as fileiras de núcleos de fibrócitos comprimidos entre os feixes — elas mantêm o alinhamento mesmo assim.',
      },
      {
        confundeCom: 'fibra reticular e colágena fina',
        comoSeparar:
          'A reticular é colágeno III, ramifica-se, forma malha e só aparece com impregnação por prata ou PAS. Em H&E ela é praticamente invisível, e o que se vê como fibra fina é colágeno I.',
      },
      {
        confundeCom: 'macrófago e fibroblasto',
        comoSeparar:
          'O macrófago tem núcleo reniforme ou indentado e frequentemente material fagocitado no citoplasma; o fibroblasto ativo tem núcleo oval, grande e claro, sem inclusões.',
      },
    ],
    clinica: [
      {
        condicao: 'Síndrome de Marfan',
        correlacao:
          'A mutação na fibrilina desorganiza a fibra elástica. As consequências aparecem onde a elastina é estrutural: aorta, com risco de dissecção; cristalino, com ectopia; e esqueleto, com desproporção de membros.',
      },
      {
        condicao: 'Síndrome de Ehlers-Danlos',
        correlacao:
          'Defeitos na síntese ou no processamento do colágeno produzem pele hiperextensível, hipermobilidade articular e fragilidade vascular — a tríade decorre diretamente de onde o colágeno resiste a tração.',
      },
      {
        condicao: 'Escorbuto',
        correlacao:
          'Sem vitamina C, as prolil e lisil-hidroxilases não estabilizam a tripla hélice. O colágeno formado é frágil, e o resultado é sangramento gengival, má cicatrização e reabertura de cicatrizes antigas.',
      },
      {
        condicao: 'Fibrose',
        correlacao:
          'Lesão crônica converte fibroblastos e células estreladas em miofibroblastos, que depositam colágeno em excesso. O parênquima funcional é substituído, e o tricrômico mede diretamente essa substituição.',
      },
    ],
    retencao: [
      'No conjuntivo, quem define o tecido é a **matriz**, não a célula.',
      'Duas perguntas classificam: **quanta fibra** e, se muita, **em uma direção ou em todas**.',
      'Colágeno **I** resiste à tração, **II** é da cartilagem, **III** é reticular, **IV** é da lâmina basal.',
      'Fibra elástica é elastina **mais fibrilina** — e é a fibrilina que falha no Marfan.',
      'Sem **vitamina C** não há tripla hélice estável.',
    ],
  },
  'tecidos/tecido-conjuntivo/cartilage': {
    histogenese:
      'A cartilagem vem do mesênquima por **condrogênese**: células mesenquimais se condensam, retraem os prolongamentos, arredondam-se e passam a **condroblastos**, que secretam matriz ao redor de si; cercados por ela, tornam-se **condrócitos** alojados em lacunas. A periferia da condensação não se diferencia e forma o **pericôndrio**, que conserva células com potencial condrogênico. Daí os dois modos de crescimento: **intersticial**, por divisão dos condrócitos já dentro da matriz, formando grupos isógenos, e **aposicional**, por diferenciação de novas células a partir do pericôndrio. No embrião, a cartilagem hialina forma o molde de quase todo o esqueleto, depois substituído por osso na ossificação endocondral — mas persiste na superfície articular, na placa epifisária, nas costelas e nas vias aéreas.',
    ultraestrutura:
      'O condrócito tem retículo rugoso e Golgi bem desenvolvidos, compatíveis com uma célula que produz muita matriz, além de glicogênio e gotículas lipídicas. A **matriz** é o que interessa: colágeno **tipo II** em fibrilas finas cujo índice de refração é próximo ao da substância fundamental — razão pela qual a hialina parece homogênea e vítrea em luz, apesar de conter fibras. Entre as fibrilas há uma quantidade enorme de **agrecana**, proteoglicano com centenas de cadeias de condroitim e queratam-sulfato, agregado a ácido hialurônico por proteínas de ligação. Essas cargas negativas retêm água sob pressão osmótica, e é essa água pressurizada, não o colágeno, que sustenta a compressão. Ao redor de cada grupo isógeno, a **matriz territorial** é mais basófila por concentração de glicosaminoglicanos.',
    manutencao:
      'A cartilagem é **avascular, aneural e alinfática**, e essas três ausências explicam quase tudo o que ela faz e deixa de fazer. Os condrócitos se nutrem por **difusão** através da matriz, o que limita a espessura viável da peça e torna o metabolismo predominantemente anaeróbio. Na cartilagem articular, a difusão é auxiliada pela compressão intermitente do movimento, que bombeia líquido sinovial para dentro e para fora — imobilização prolongada literalmente desnutre a cartilagem. A renovação da matriz é lenta e o balanço entre agrecanases e inibidores decide o destino do tecido. A capacidade de reparo é **mínima**: sem pericôndrio na superfície articular e sem vasos que tragam células, a lesão condral não cicatriza como cartilagem, e sim como fibrocartilagem de qualidade mecânica inferior.',
    diferenciais: [
      {
        confundeCom: 'cartilagem elástica e hialina',
        comoSeparar:
          'Em H&E as duas se parecem. Peça orceína ou Verhoeff: a elástica mostra rede densa de fibras escuras na matriz. Outras pistas: condrócitos mais numerosos e menos matriz proporcionalmente.',
      },
      {
        confundeCom: 'fibrocartilagem e conjuntivo denso',
        comoSeparar:
          'A fibrocartilagem tem condrócitos arredondados em lacunas, em geral alinhados em fileiras entre feixes colágenos. O conjuntivo denso tem fibrócitos achatados, sem lacuna e sem citoplasma visível.',
      },
      {
        confundeCom: 'lacuna vazia e condrócito retraído',
        comoSeparar:
          'O halo claro em torno do condrócito é retração pelo processamento, não espaço real. Lacuna genuinamente vazia ocorre na cartilagem em regressão da ossificação endocondral.',
      },
    ],
    clinica: [
      {
        condicao: 'Osteoartrose',
        correlacao:
          'A degradação da cartilagem articular é progressiva e não se reverte, justamente porque o tecido é avascular e sem pericôndrio na superfície. A dor vem do osso subcondral e da sinóvia — a cartilagem em si não tem inervação.',
      },
      {
        condicao: 'Acondroplasia',
        correlacao:
          'A mutação ativadora do receptor FGFR3 inibe a proliferação dos condrócitos na placa epifisária. O crescimento em comprimento é comprometido, mas o intramembranoso não — daí membros curtos com crânio e tronco relativamente preservados.',
      },
      {
        condicao: 'Hérnia de disco',
        correlacao:
          'O ânulo fibroso é fibrocartilagem; sua ruptura permite ao núcleo pulposo, remanescente da notocorda, herniar e comprimir raiz nervosa. A perda de hidratação do núcleo com a idade é o que predispõe.',
      },
    ],
    retencao: [
      'Cartilagem é **avascular, aneural e alinfática** — daí a nutrição por difusão e o reparo mínimo.',
      'Quem resiste à compressão é a **água retida pela agrecana**, não o colágeno.',
      'Crescimento **intersticial** (por dentro) e **aposicional** (a partir do pericôndrio).',
      'Hialina tem colágeno **II**; a fibrocartilagem tem **I** e não tem pericôndrio.',
    ],
  },

  'tecidos/tecido-conjuntivo/bone': {
    histogenese:
      'O osso se forma por dois mecanismos, e todo osso usa pelo menos um. Na **intramembranosa**, células mesenquimais se condensam e se diferenciam diretamente em osteoblastos, que depositam osteoide num centro de ossificação; é assim que se formam os ossos chatos do crânio, a maxila, a mandíbula e a clavícula, e é também o mecanismo do crescimento em **espessura** de qualquer osso, a partir do periósteo. Na **endocondral**, um molde de cartilagem hialina é progressivamente substituído: forma-se o colar periosteal, vasos invadem o centro da diáfise instalando o centro primário, e mais tarde surgem os centros secundários nas epífises, restando entre eles a **placa epifisária** que sustenta o crescimento em **comprimento** até a fusão. O primeiro osso formado é sempre **primário**, depois remodelado em lamelar.',
    ultraestrutura:
      'A matriz óssea combina duas fases cuja proporção explica suas propriedades. A **orgânica**, cerca de 35%, é colágeno **tipo I** com osteocalcina, osteonectina e sialoproteínas; ela dá resistência à tração e à fratura. A **mineral**, cerca de 65%, são cristais de **hidroxiapatita** alinhados sobre as fibrilas colágenas e nos espaços entre elas; ela dá rigidez e dureza. Nenhuma basta sozinha: descalcificado, o osso dobra; desproteinizado, quebra como giz. O **osteócito** ocupa uma lacuna e emite prolongamentos por **canalículos**, acoplando-se aos vizinhos por junções comunicantes — é essa rede que percebe deformação mecânica e sinaliza a necessidade de remodelação. O **osteoclasto** tem borda pregueada e zona clara de adesão, selando o compartimento onde acidifica e digere.',
    manutencao:
      'O osso é irrigado por artérias nutrícias que entram por forames e por vasos do periósteo; dentro do compacto, o sangue corre nos **canais de Havers**, interligados pelos **canais de Volkmann** — arranjo que garante que nenhum osteócito fique a mais de aproximadamente 200 µm de um capilar, limite da difusão pelos canalículos. A inervação sensitiva é rica no periósteo, o que explica a dor à percussão. A renovação é contínua: cerca de **10% do esqueleto por ano** no adulto, em unidades de remodelação em que osteoclastos escavam primeiro e osteoblastos preenchem depois. O acoplamento é regido pelo eixo **RANKL–RANK–osteoprotegerina**, e a assimetria de duração — reabsorção em semanas, formação em meses — explica por que acelerar a remodelação tende a causar perda óssea.',
    diferenciais: [
      {
        confundeCom: 'osso primário e lamelar',
        comoSeparar:
          'O primário tem colágeno desordenado, mais células e osteócitos em lacunas arredondadas sem orientação comum; o lamelar tem camadas paralelas com orientação alternada e osteócitos alinhados entre elas.',
      },
      {
        confundeCom: 'canal de Havers e de Volkmann',
        comoSeparar:
          'O de Havers corre no eixo longo e é envolvido por lamelas concêntricas; o de Volkmann cruza transversalmente, atravessa lamelas e não tem lamelas próprias.',
      },
      {
        confundeCom: 'preparação por desgaste e por descalcificação',
        comoSeparar:
          'No desgaste veem-se lacunas e canalículos com nitidez, mas não há célula alguma — foram destruídas. Na descalcificação há células, mas a arquitetura mineral perde definição. A ausência de células pode ser método, não achado.',
      },
      {
        confundeCom: 'osteoclasto e célula gigante de corpo estranho',
        comoSeparar:
          'Ambas são multinucleadas. O osteoclasto ocupa uma lacuna de Howship escavada na superfície óssea e tem borda pregueada voltada para o osso; a de corpo estranho envolve material estranho.',
      },
    ],
    clinica: [
      {
        condicao: 'Osteoporose',
        correlacao:
          'A reabsorção supera a formação. O osso **esponjoso** sofre primeiro, porque sua área de superfície por volume é muito maior e sua renovação é mais rápida — daí a fratura vertebral preceder a do colo do fêmur.',
      },
      {
        condicao: 'Osteopetrose',
        correlacao:
          'Osteoclastos disfuncionais não reabsorvem. O osso fica denso mas desorganizado e frágil, e a cavidade medular é obliterada, produzindo anemia e infecções por falência da hematopoese.',
      },
      {
        condicao: 'Bisfosfonatos e denosumabe',
        correlacao:
          'Os primeiros são captados pela hidroxiapatita e envenenam o osteoclasto que a reabsorve; o segundo é anticorpo anti-RANKL. Ambos atuam sobre o eixo que a lâmina permite entender, e ambos podem suprimir demais a remodelação.',
      },
      {
        condicao: 'Consolidação de fratura',
        correlacao:
          'O hematoma é substituído por tecido de granulação, depois por calo cartilaginoso e osso primário, que só então é remodelado em lamelar. O periósteo íntegro é decisivo — daí o cuidado cirúrgico em preservá-lo.',
      },
    ],
    retencao: [
      'Duas fases da matriz: **orgânica** resiste à tração, **mineral** dá rigidez. Nenhuma basta sozinha.',
      'Intramembranosa faz crescimento em **espessura**; endocondral, em **comprimento**.',
      'Nenhum osteócito fica a mais de **200 µm** de um capilar — é o limite dos canalículos.',
      'Remodelação é **acoplada**: osteoclasto escava, osteoblasto preenche, via **RANKL**.',
      'O esponjoso renova mais rápido e por isso **adoece primeiro**.',
    ],
  },

  'tecidos/tecido-conjuntivo/blood-and-hemopoiesis': {
    histogenese:
      'A hematopoese muda de sítio três vezes antes de se fixar. A fase **mesoblástica** começa na terceira semana, nas ilhotas sanguíneas do saco vitelino, e produz eritrócitos nucleados primitivos. Da sexta semana ao segundo trimestre predomina a fase **hepática**, com participação do baço. A partir do quinto ao sexto mês instala-se a fase **medular**, e ao nascimento toda a medula é vermelha e ativa. Depois, a medula vermelha regride progressivamente para os ossos chatos, as vértebras e as epífises proximais de fêmur e úmero, sendo substituída por **medula amarela** adiposa — que pode reverter diante de demanda. Todas as linhagens descendem de uma **célula-tronco hematopoética** pluripotente, que se autorrenova e origina os ramos mieloide e linfoide.',
    ultraestrutura:
      'Cada linhagem madura tem assinatura ultraestrutural própria. A **hemácia** perde núcleo e todas as organelas, restando citoesqueleto de espectrina e anquirina ancorado à membrana — é ele que permite a deformação reversível ao atravessar capilares mais estreitos que ela. O **neutrófilo** tem dois tipos de grânulo: azurófilos, que são lisossomos com mieloperoxidase, e específicos, com lisozima e lactoferrina. O **eosinófilo** tem grânulos com cristaloide central de proteína básica principal. O **mastócito** e o **basófilo** têm grânulos com heparina e histamina. A **plaqueta** tem grânulos alfa e densos, sistema canalicular aberto e um anel marginal de microtúbulos que sustenta a forma discoide.',
    manutencao:
      'A medula vermelha é um tecido de **estroma reticular** sustentando ilhas de células em maturação entre **sinusoides** de parede descontínua, por onde as células maduras entram na circulação atravessando o próprio citoplasma endotelial — mecanismo que retém seletivamente as imaturas. A produção é regulada por citocinas específicas: **eritropoetina** renal para a série vermelha, **trombopoetina** hepática para as plaquetas, e fatores estimuladores de colônia para os granulócitos. As meias-vidas são muito diferentes e explicam a ordem em que as citopenias aparecem após uma agressão medular: neutrófilo dura horas a poucos dias, plaqueta cerca de dez dias, e hemácia **120 dias** — por isso a neutropenia surge primeiro e a anemia por último.',
    diferenciais: [
      {
        confundeCom: 'eosinófilo e neutrófilo',
        comoSeparar:
          'Conte os lobos: dois no eosinófilo, três a cinco no neutrófilo. Os grânulos também separam — grandes, uniformes e intensamente laranja contra finos e pálidos.',
      },
      {
        confundeCom: 'basófilo e eosinófilo',
        comoSeparar:
          'No basófilo os grânulos são irregulares e **encobrem o núcleo**; no eosinófilo o núcleo bilobado permanece visível entre eles.',
      },
      {
        confundeCom: 'monócito e linfócito grande',
        comoSeparar:
          'O monócito tem núcleo em ferradura, cromatina frouxa e citoplasma abundante cinza-azulado; o linfócito, mesmo ativado, mantém núcleo redondo e cromatina densa.',
      },
      {
        confundeCom: 'megacariócito e osteoclasto',
        comoSeparar:
          'O megacariócito tem **um** núcleo gigante multilobado, produto de endomitose; o osteoclasto tem **vários** núcleos separados e ocupa uma lacuna sobre superfície óssea.',
      },
    ],
    clinica: [
      {
        condicao: 'Desvio à esquerda',
        correlacao:
          'O aumento de formas jovens — bastonetes e metamielócitos — no sangue periférico indica que a medula está liberando células antes da maturação completa, tipicamente por infecção bacteriana aguda.',
      },
      {
        condicao: 'Anemia ferropriva e megaloblástica',
        correlacao:
          'A ferropriva produz eritrócitos pequenos e pálidos, porque falta hemoglobina para preencher o citoplasma. A megaloblástica, por falta de B12 ou folato, dissocia a maturação: o citoplasma amadurece e o núcleo não, gerando células grandes e neutrófilos hipersegmentados.',
      },
      {
        condicao: 'Contagem de reticulócitos',
        correlacao:
          'O reticulócito ainda tem ribossomos residuais, corados pelo azul de cresil brilhante. Sua contagem informa se a medula está respondendo a uma anemia ou se o problema é de produção.',
      },
      {
        condicao: 'Quimioterapia e ordem das citopenias',
        correlacao:
          'A supressão medular se manifesta primeiro como neutropenia, depois plaquetopenia e por último anemia — reflexo direto das meias-vidas de horas, dias e 120 dias.',
      },
    ],
    retencao: [
      'Três regras para estagiar precursor: **tamanho cai**, **cromatina condensa**, **basofilia cede** ao produto.',
      'Meias-vidas: neutrófilo **horas**, plaqueta **10 dias**, hemácia **120 dias**.',
      'O sinusoide medular retém as imaturas: a célula sai **atravessando o endotélio**.',
      'Megacariócito tem núcleo **único** multilobado — endomitose, não multinucleação.',
    ],
  },
  /* ═══════════ Órgãos e Sistemas ═══════════ */

  'orgaos-e-sistemas/conceitos-gerais': {
    histogenese:
      'Um órgão se forma quando tecidos de origens diferentes se organizam numa unidade funcional, e quase sempre isso envolve **indução recíproca** entre epitélio e mesênquima: o epitélio invagina, o mesênquima responde condensando-se, e cada um instrui o outro a se diferenciar. É esse diálogo que produz glândulas, dentes, pulmão e rim, e é por isso que a maioria dos órgãos maciços se resolve na dupla **parênquima** — epitelial, derivado da invaginação — e **estroma** — mesenquimal, derivado da condensação. Órgãos tubulares seguem outro plano: um tubo endodérmico ou mesodérmico é envolvido por camadas concêntricas de mesoderma que se diferenciam em conjuntivo e músculo liso.',
    ultraestrutura:
      'O que sustenta um órgão em nível ultraestrutural é o **estroma**, e sua natureza varia com a função. Órgãos que precisam sustentar células livres em trânsito — linfoides, hemocitopoéticos — usam malha **reticular** de colágeno III, frouxa e macia, invisível em H&E e revelada por prata. Órgãos que precisam resistir a pressão usam **cápsula e septos** de conjuntivo denso. Em ambos, a interface entre parênquima e estroma é uma **lâmina basal**, e é ela que o tumor precisa romper para deixar de ser in situ e passar a invasivo. Os vasos que percorrem o estroma têm endotélio adaptado à função: contínuo onde há barreira, fenestrado onde há troca rápida, descontínuo onde células inteiras precisam passar.',
    manutencao:
      'A regra que atravessa todos os órgãos é que o **estroma leva o suprimento** e o parênquima o consome. Como o epitélio é avascular, a distância entre uma célula parenquimatosa e o capilar mais próximo é limitada por difusão, e é isso que impõe a arquitetura lobular: septos trazem vasos até perto de cada grupo de células. A capacidade de regeneração do órgão é a do seu parênquima — fígado e epitélios regeneram, coração e sistema nervoso não —, mas depende também da integridade do estroma: se o arcabouço reticular é destruído, mesmo um parênquima capaz de proliferar reconstrói de forma desorganizada, e é exatamente isso que acontece na cirrose.',
    diferenciais: [
      {
        confundeCom: 'serosa e adventícia',
        comoSeparar:
          'A serosa tem **mesotélio** na superfície livre; a adventícia é só conjuntivo que se funde ao tecido vizinho. Procurar a camada única de células achatadas resolve.',
      },
      {
        confundeCom: 'cápsula e parênquima comprimido',
        comoSeparar:
          'A cápsula é conjuntivo denso contínuo com septos que penetram o órgão; parênquima comprimido mantém suas células reconhecíveis, apenas achatadas.',
      },
      {
        confundeCom: 'lobo e lóbulo',
        comoSeparar:
          'O lobo é subdivisão macroscópica delimitada por septos maiores; o lóbulo é a unidade microscópica drenada por um ducto intralobular ou centrada por uma veia. Confundi-los inverte a leitura do fígado.',
      },
    ],
    clinica: [
      {
        condicao: 'Carcinoma in situ e invasivo',
        correlacao:
          'A ruptura da **lâmina basal** é o que define a passagem de in situ a invasivo, e é ela que abre acesso a vasos e linfáticos. Toda a diferença de prognóstico está numa estrutura de dezenas de nanômetros.',
      },
      {
        condicao: 'Cirrose',
        correlacao:
          'O hepatócito regenera, mas quando o arcabouço reticular é destruído a regeneração produz nódulos desorganizados cercados por septos fibrosos. Função e arquitetura se perdem juntas — a capacidade de proliferar não basta.',
      },
      {
        condicao: 'Metástase por via linfática',
        correlacao:
          'O estroma leva não só vasos sanguíneos mas linfáticos, e é por eles que carcinomas alcançam o linfonodo regional. Isso fundamenta a pesquisa de linfonodo sentinela.',
      },
    ],
    retencao: [
      'Todo órgão maciço se lê pela dupla **parênquima e estroma** — nomeie os dois antes de detalhar.',
      'Órgão tubular: **mucosa, submucosa, muscular, serosa ou adventícia**, de dentro para fora.',
      'Serosa tem **mesotélio**; adventícia, não.',
      'A **lâmina basal** separa in situ de invasivo.',
    ],
  },

  'orgaos-e-sistemas/sistema-cardiovascular': {
    histogenese:
      'O sistema cardiovascular é o **primeiro a funcionar** no embrião, por volta da terceira semana, porque a difusão deixa de bastar assim que o disco embrionário ganha espessura. Os vasos surgem por **vasculogênese**: ilhotas sanguíneas do mesoderma esplâncnico originam angioblastos que se organizam em tubos endoteliais, e as camadas musculares e conjuntivas se diferenciam do mesênquima ao redor, instruídas pelo próprio endotélio. Depois disso, novos vasos surgem por **angiogênese**, brotamento a partir dos existentes. O coração começa como dois tubos que se fundem, dobram-se em alça e são septados; os erros dessa septação produzem as cardiopatias congênitas mais comuns, e a **porção membranácea** do septo interventricular é o ponto mais sujeito a falha por depender da fusão de vários primórdios.',
    ultraestrutura:
      'O **endotélio** é o componente-chave e é muito mais que revestimento: tem junções de oclusão que definem permeabilidade, corpos de **Weibel-Palade** com fator de von Willebrand e P-selectina, cavéolas para transcitose, e produz óxido nítrico, prostaciclina e endotelina. Seu fenótipo varia por leito: **contínuo** com junções estreitas na barreira hematoencefálica; **fenestrado** com poros de 60 a 80 nm e diafragma onde há troca rápida, sem diafragma no glomérulo; **descontínuo**, com lacunas amplas e lâmina basal fragmentada, no fígado, no baço e na medula. Na média, a célula muscular lisa é envolvida por lâmina externa e apresenta cavéolas e corpos densos.',
    manutencao:
      'A parede dos vasos maiores é espessa demais para se nutrir da luz e possui vasos próprios, os **vasa vasorum**, que irrigam a adventícia e o terço externo da média; o terço interno se nutre por difusão a partir do sangue circulante — e é essa dependência que torna o espessamento da íntima tão danoso na aterosclerose. A inervação é simpática, controlando o tônus por meio de varicosidades na adventícia. O endotélio se renova lentamente em condições normais, mas prolifera rapidamente diante de lesão; a **disfunção endotelial**, com queda da produção de óxido nítrico e expressão de moléculas de adesão, é o evento iniciador da aterosclerose. O cardiomiócito, ao contrário, praticamente não se renova, e é isso que torna o infarto uma perda definitiva.',
    diferenciais: [
      {
        confundeCom: 'artéria e veia',
        comoSeparar:
          'Compare **os dois vasos do mesmo feixe**, nunca um isolado. A artéria tem parede espessa para a luz, média concêntrica e lâmina elástica interna ondulada; a veia tem parede fina, luz ampla e adventícia mais espessa que a média.',
      },
      {
        confundeCom: 'veia e vaso linfático',
        comoSeparar:
          'Procure hemácias na luz. O linfático tem parede ainda mais fina, válvulas mais frequentes e conteúdo pálido ou vazio.',
      },
      {
        confundeCom: 'artéria elástica e muscular',
        comoSeparar:
          'Conte as lamelas elásticas da média: dezenas indicam elástica; poucas camadas de músculo circular com lâminas elásticas interna e externa nítidas indicam muscular.',
      },
      {
        confundeCom: 'capilar fenestrado e sinusoide',
        comoSeparar:
          'Avalie três itens juntos: poros, junções e continuidade da lâmina basal. O fenestrado tem lâmina basal **contínua**; o sinusoide, fragmentada ou ausente, e luz ampla e irregular.',
      },
    ],
    clinica: [
      {
        condicao: 'Aterosclerose',
        correlacao:
          'Começa por disfunção endotelial, com entrada de LDL na íntima, recrutamento de monócitos e formação de células espumosas. A placa cresce na íntima e compromete a nutrição do terço interno da média por difusão.',
      },
      {
        condicao: 'Varizes e insuficiência valvar',
        correlacao:
          'As válvulas venosas transformam a contração muscular em bomba. Sua incompetência produz refluxo, hipertensão venosa e dilatação — e a lâmina mostra a dilatação com adventícia espessada.',
      },
      {
        condicao: 'Hipertensão pulmonar',
        correlacao:
          'A artéria pulmonar normalmente tem parede fina para o calibre, porque opera com um quinto da pressão sistêmica. Na hipertensão pulmonar sua média se espessa e ela passa a parecer sistêmica — a perda dessa desproporção é o achado.',
      },
      {
        condicao: 'Fibrilação atrial de origem em veias pulmonares',
        correlacao:
          'A porção extrapulmonar das veias pulmonares contém mangas de cardiomiócitos que se estendem do átrio esquerdo. É desses focos que partem os disparos ectópicos, e é por isso que a ablação os isola.',
      },
    ],
    retencao: [
      'Três túnicas em todo vaso; o que muda é a **proporção** entre elas.',
      'Compare sempre **artéria e veia do mesmo feixe** antes de classificar.',
      'Endotélio contínuo, fenestrado ou descontínuo — avalie **poros, junções e lâmina basal** juntos.',
      'A **vênula pós-capilar** é o palco da inflamação: extravasamento e diapedese.',
      'Estrutura acompanha **pressão**: é a regra que explica o sistema inteiro.',
    ],
  },

  'orgaos-e-sistemas/pele': {
    histogenese:
      'A pele nasce da interação entre dois folhetos. A **epiderme** vem do ectoderma de superfície, inicialmente uma camada única que estratifica e queratiniza ao longo da gestação; dela brotam, por invaginação no mesênquima, todos os **anexos** — folículos pilosos, glândulas sebáceas, sudoríparas e unhas. A **derme** vem do mesoderma, exceto na face, onde é ectomesênquima de crista neural. Três populações migram para a epiderme e não são queratinócitos: os **melanócitos**, da crista neural; as **células de Langerhans**, de precursores mieloides; e as **células de Merkel**, de origem ainda debatida. A indução é recíproca — a papila dérmica instrui o folículo, e sem ela o pelo não se forma.',
    ultraestrutura:
      'A queratinização é um programa de diferenciação legível camada a camada. No **basal**, hemidesmossomos ancoram à lâmina basal e há queratinas 5 e 14. No **espinhoso**, tonofilamentos convergem para desmossomos — os "espinhos" são artefato de retração que revela onde eles estão. No **granuloso**, aparecem os grânulos de **querato-hialina** com profilagrina e os **corpos lamelares**, que despejam lipídios no espaço intercelular. No **córneo**, o corneócito é uma casca sem núcleo nem organelas, com envelope de involucrina e loricrina reticulado por transglutaminase, cimentado pelas lamelas de ceramidas — a metáfora de tijolo e argamassa descreve exatamente isso, e a argamassa é a barreira real.',
    manutencao:
      'A epiderme é **avascular** e se nutre por difusão a partir do plexo dérmico; a derme tem dois plexos, o **subpapilar** e o **profundo**, e é a vasodilatação neles, somada à evaporação do suor, que faz a termorregulação. A inervação é densa e variada: terminações livres para dor e temperatura, Meissner nas papilas para tato leve, Pacini na hipoderme para vibração, Merkel na basal para pressão sustentada. A renovação é uma das mais rápidas do corpo — o queratinócito leva cerca de **quatro semanas** da basal ao descamamento — e parte de células-tronco da camada basal e do bulge do folículo piloso, reserva que é decisiva na reepitelização de queimaduras.',
    diferenciais: [
      {
        confundeCom: 'pele espessa e fina',
        comoSeparar:
          'Aplique dois critérios independentes: presença de **estrato lúcido** e ausência de **folículos pilosos** indicam espessa. A espessura total da lâmina não serve, porque mede sobretudo a derme.',
      },
      {
        confundeCom: 'melanócito e célula de Langerhans',
        comoSeparar:
          'Ambos são células claras. A posição ajuda — melanócito na basal, Langerhans no espinhoso —, mas a separação segura exige imuno-histoquímica.',
      },
      {
        confundeCom: 'glândula écrina e apócrina',
        comoSeparar:
          'A luz do segmento secretor da apócrina é muito mais ampla, e seu ducto desemboca no folículo piloso, não na superfície.',
      },
      {
        confundeCom: 'Meissner e Pacini',
        comoSeparar:
          'Meça a profundidade: Meissner ocupa a papila dérmica; Pacini fica na derme profunda ou na hipoderme e mostra lamelas concêntricas em cebola.',
      },
    ],
    clinica: [
      {
        condicao: 'Profundidade de queimadura',
        correlacao:
          'Se os anexos profundos sobrevivem, a reepitelização parte deles e a cicatriz é mínima. Destruídos os anexos, só resta migração a partir das bordas — daí a necessidade de enxerto nas queimaduras de espessura total.',
      },
      {
        condicao: 'Psoríase',
        correlacao:
          'O tempo de trânsito do queratinócito cai de quatro semanas para poucos dias. A maturação não se completa, restam núcleos no córneo (paraqueratose) e a camada granulosa desaparece.',
      },
      {
        condicao: 'Melanoma e profundidade de Breslow',
        correlacao:
          'O prognóstico depende de quanto o tumor penetrou na derme, porque é lá que estão os vasos e linfáticos. A medida em milímetros a partir da camada granulosa traduz diretamente o acesso à disseminação.',
      },
      {
        condicao: 'Dermatite atópica',
        correlacao:
          'Mutações na filagrina comprometem a agregação dos filamentos e a formação do fator natural de hidratação. A barreira falha, a perda de água aumenta e alérgenos penetram — a doença começa na argamassa.',
      },
    ],
    retencao: [
      'Espessa ou fina: decida por **estrato lúcido** e **ausência de pelos**, não por espessura total.',
      'A barreira é o **cimento lipídico** entre os corneócitos, não os corneócitos.',
      'Trânsito do queratinócito: cerca de **quatro semanas**.',
      'Três células não queratinócitas na epiderme: **melanócito, Langerhans e Merkel**.',
      'A cor da pele depende do **tamanho e da distribuição** dos melanossomos, não do número de melanócitos.',
    ],
  },
  'orgaos-e-sistemas/sistema-digestorio': {
    histogenese:
      'O tubo digestório se forma pelo dobramento do embrião, que incorpora parte do saco vitelino como **intestino primitivo**, revestido por **endoderma** — de onde vêm o epitélio e as glândulas — envolvido por **mesoderma esplâncnico**, de onde vêm a lâmina própria, a submucosa, a muscular e a serosa. As extremidades são exceções: a cavidade oral vem do **estomodeu**, uma invaginação ectodérmica, e o canal anal distal do **proctodeu**, também ectodérmico — o que explica por que ali o epitélio é estratificado pavimentoso e a drenagem linfática muda de território. O sistema nervoso entérico é colonizado por células da **crista neural** que migram no sentido craniocaudal; a falha dessa migração no segmento distal produz a doença de Hirschsprung.',
    ultraestrutura:
      'O enterócito é o exemplo mais completo de célula epitelial polarizada: no ápice, **microvilosidades** com eixo de actina ancorado à trama terminal, cobertas por glicocálice espesso onde ficam ancoradas dissacaridases e peptidases — a digestão terminal ocorre literalmente na membrana. Logo abaixo, o **complexo juncional** veda o espaço paracelular e define quanto pode passar sem atravessar a célula. Na base, transportadores e a bomba de sódio e potássio criam o gradiente que move a absorção. A **célula caliciforme** mostra o Golgi supranuclear volumoso e o ápice repleto de grânulos de mucinogênio. A **célula parietal** exibe canalículos intracelulares e um sistema tubulovesicular que se funde à membrana ao secretar ácido.',
    manutencao:
      'A mucosa digestória tem a **renovação mais rápida do corpo**: o epitélio intestinal se substitui inteiramente a cada três a cinco dias, a partir de células-tronco na base da cripta, e o gástrico em poucos dias a partir do istmo. Essa velocidade é uma defesa — descarta células agredidas — e uma vulnerabilidade, porque torna o epitélio alvo preferencial de quimioterapia e radiação. A irrigação vem de artérias mesentéricas com arcadas anastomóticas generosas, mas a ponta da vilosidade é irrigada em contracorrente e é a primeira a sofrer na isquemia. A inervação é o **sistema nervoso entérico**, com cerca de cem milhões de neurônios em dois plexos, capaz de gerar peristalse mesmo desconectado do sistema nervoso central.',
    diferenciais: [
      {
        confundeCom: 'estômago e intestino',
        comoSeparar:
          'Procure **células caliciformes**: existem no intestino e não no estômago normal. Encontrá-las na mucosa gástrica indica metaplasia intestinal, não erro de identificação.',
      },
      {
        confundeCom: 'duodeno e jejuno',
        comoSeparar:
          'As **glândulas de Brunner** na submucosa são exclusivas do duodeno. Vilosidades sozinhas não localizam o segmento.',
      },
      {
        confundeCom: 'íleo e cólon',
        comoSeparar:
          'O íleo tem vilosidades e placas de Peyer; o cólon não tem vilosidades e suas criptas são retas, paralelas e ricas em caliciformes.',
      },
      {
        confundeCom: 'vilosidade cortada transversalmente e pólipo',
        comoSeparar:
          'Uma vilosidade cortada de través aparece como ilha de epitélio isolada na luz. Procure outras vilosidades no mesmo campo com eixo contínuo à mucosa.',
      },
    ],
    clinica: [
      {
        condicao: 'Doença celíaca',
        correlacao:
          'A agressão imunomediada ao enterócito produz atrofia das vilosidades com hiperplasia das criptas — a superfície absortiva desaparece enquanto o compartimento proliferativo se expande tentando compensar.',
      },
      {
        condicao: 'Úlcera péptica',
        correlacao:
          'A defesa gástrica é a camada de muco com bicarbonato produzida por todo o epitélio de superfície. Quando *H. pylori* ou anti-inflamatórios comprometem essa barreira, o ácido que a mucosa produz passa a digeri-la.',
      },
      {
        condicao: 'Doença de Hirschsprung',
        correlacao:
          'A falha de migração da crista neural deixa um segmento distal **sem plexo mioentérico**. Sem ele não há peristalse coordenada, o segmento permanece contraído e o cólon proximal dilata.',
      },
      {
        condicao: 'Mucosite por quimioterapia',
        correlacao:
          'O epitélio digestório se renova em dias e por isso é atingido junto com o tumor. A perda da barreira produz dor, diarreia e porta de entrada para infecção.',
      },
    ],
    retencao: [
      'Quatro camadas do esôfago ao ânus; o que muda é **epitélio** e **onde estão as glândulas**.',
      'Glândulas na **submucosa** só em dois lugares: esôfago e **duodeno (Brunner)**.',
      'Estômago **não tem caliciformes**; encontrá-las é metaplasia.',
      'Muscular externa do estômago tem **três** camadas — é o que permite triturar.',
      'A luz do tubo é, topologicamente, o **exterior** do corpo.',
    ],
  },

  'orgaos-e-sistemas/sistema-respiratorio': {
    histogenese:
      'O aparelho respiratório inferior brota como um divertículo **endodérmico** do assoalho da faringe primitiva, que se alonga e se divide dicotomicamente cerca de 23 vezes, envolvido por **mesoderma esplâncnico** que fornece cartilagem, músculo liso, conjuntivo e vasos. A separação incompleta entre o broto e o esôfago produz as fístulas traqueoesofágicas. O desenvolvimento passa por estágios nomeados, e o decisivo é o **saculado**, no terceiro trimestre, quando os pneumócitos tipo II começam a produzir **surfactante** — antes disso o alvéolo colapsa a cada expiração, e é esse fato que define a viabilidade do prematuro e o momento de indicar corticoide antenatal. Os alvéolos continuam se multiplicando até vários anos após o nascimento.',
    ultraestrutura:
      'A **barreira ar-sangue** tem três componentes somando cerca de 0,2 µm: o citoplasma adelgaçado do pneumócito tipo I, as lâminas basais fundidas do epitélio e do endotélio, e o citoplasma da célula endotelial do capilar contínuo. O **pneumócito tipo II** é reconhecível pelos **corpos lamelares**, organelas com membranas concêntricas onde o surfactante é armazenado — em H&E aparecem como vacúolos, porque o lipídio é extraído. O epitélio respiratório mostra cílios com axonema 9+2 e braços de dineína, ancorados em corpúsculos basais que formam a faixa escura apical. As **células club** têm ápice abaulado, retículo liso abundante e grânulos de secreção proteica.',
    manutencao:
      'O pulmão tem **duas circulações**: a **pulmonar**, funcional, que acompanha as vias aéreas e opera com um quinto da pressão sistêmica, e a **brônquica**, nutritiva, vinda da aorta, que irriga a parede das vias até os bronquíolos e a pleura visceral. A defesa é feita em camadas: filtragem mecânica no nariz, **transporte mucociliar** que move o muco a cerca de 1 cm por minuto em direção à faringe, IgA secretora, e **macrófagos alveolares** que patrulham a superfície. A renovação epitelial parte de células basais nas vias maiores e de **células club** e pneumócitos tipo II na periferia — o tipo II é a célula-tronco que repõe o tipo I, que não se divide. A elastina dos septos é o que devolve o pulmão ao repouso, tornando a expiração passiva.',
    diferenciais: [
      {
        confundeCom: 'brônquio e bronquíolo',
        comoSeparar:
          'Cheque **cartilagem e glândulas submucosas**: as duas somem juntas na passagem para bronquíolo. O calibre não classifica — há bronquíolos largos e brônquios estreitos.',
      },
      {
        confundeCom: 'bronquíolo terminal e respiratório',
        comoSeparar:
          'Percorra a circunferência inteira: **um único alvéolo** abrindo-se na parede já reclassifica o segmento como respiratório.',
      },
      {
        confundeCom: 'ducto alveolar e saco alveolar',
        comoSeparar:
          'O ducto conserva **botões de músculo liso** nas bordas entre aberturas; o saco não tem mais nada de parede própria.',
      },
      {
        confundeCom: 'artéria pulmonar e brônquica',
        comoSeparar:
          'A pulmonar acompanha o brônquio e tem parede fina para o calibre; a brônquica tem parede espessa de artéria muscular. Vaso solitário no septo é veia pulmonar.',
      },
    ],
    clinica: [
      {
        condicao: 'Síndrome do desconforto respiratório do prematuro',
        correlacao:
          'Sem surfactante suficiente, a tensão superficial colapsa os alvéolos a cada expiração. O corticoide antenatal acelera a maturação do pneumócito tipo II — a intervenção age exatamente sobre a célula que a lâmina mostra.',
      },
      {
        condicao: 'Enfisema',
        correlacao:
          'A destruição da elastina dos septos, por desequilíbrio entre protease e antiprotease, elimina o recuo elástico e a tração que mantinha os bronquíolos abertos. A expiração deixa de ser passiva e o ar fica aprisionado.',
      },
      {
        condicao: 'Asma',
        correlacao:
          'O bronquíolo não tem cartilagem e sua camada de músculo liso é proporcionalmente a mais espessa da árvore — é por isso que a broncoconstrição encontra ali seu efeito máximo.',
      },
      {
        condicao: 'Fibrose cística e discinesia ciliar',
        correlacao:
          'As duas comprometem o transporte mucociliar por caminhos diferentes: muco espesso demais numa, cílio imóvel na outra. O desfecho é o mesmo — infecção respiratória de repetição e bronquiectasias.',
      },
    ],
    retencao: [
      'Sequência de desaparecimentos: **cartilagem e glândulas** juntas, depois caliciformes, depois cílios.',
      'Porção respiratória começa no **primeiro alvéolo** que se abre na parede.',
      'Barreira ar-sangue: **0,2 µm**, três camadas.',
      'Tipo I cobre 95% da área; **tipo II** é mais numeroso, faz surfactante e é a célula-tronco.',
      'Duas circulações: **pulmonar** acompanha o brônquio, **brônquica** nutre a parede.',
    ],
  },

  'orgaos-e-sistemas/sistema-linfoide': {
    histogenese:
      'Os órgãos linfoides têm origens distintas que explicam suas arquiteturas. O **timo** vem do endoderma da **terceira bolsa faríngea**, e é por isso que seu estroma é **epitelial** — as células epiteliorreticulares — e não reticular conjuntivo como em todos os demais; os corpúsculos de Hassall são a expressão mais visível dessa origem. O **baço** vem do mesênquima do mesogástrio dorsal. **Linfonodos** e vasos linfáticos vêm de sacos linfáticos que brotam do endotélio venoso. O tecido linfoide associado a mucosas se organiza depois do nascimento, sob estímulo antigênico — motivo pelo qual o recém-nascido tem poucos centros germinativos e a criança colonizada os desenvolve rapidamente.',
    ultraestrutura:
      'O que distingue os órgãos linfoides em nível fino é o **estroma** e o modo como o antígeno é apresentado. A **célula dendrítica folicular** do centro germinativo tem prolongamentos que retêm imunocomplexos na superfície por longos períodos, servindo de painel de seleção para os centrócitos. A **vênula de endotélio alto** tem endotélio cúbico com adressinas de superfície, e é por transmigração através dela que o linfócito circulante entra no órgão. A **célula M** sobre as placas de Peyer troca microvilosidades por dobras irregulares e forma um bolsão basal que aloja linfócitos e dendríticas. O **sinusoide esplênico** tem endotélio em ripas paralelas sobre lâmina basal em anéis, e é essa fenda que testa a deformabilidade da hemácia.',
    manutencao:
      'A circulação linfática é de **sentido único**: capilares de fundo cego recolhem o líquido intersticial, coletores com válvulas frequentes o conduzem por pelo menos um linfonodo, e o ducto torácico o devolve às veias subclávias. O linfócito, por sua vez, **recircula** continuamente entre sangue, linfa e órgãos — entra pelas vênulas de endotélio alto, percorre o parênquima e sai pelo eferente. Essa recirculação é o que dá ao sistema a chance estatística de encontrar o antígeno certo. Os órgãos secundários se expandem e retraem conforme o estímulo: o número e o tamanho dos centros germinativos são um retrato do que está acontecendo, não uma característica fixa. O **timo**, ao contrário, involui fisiologicamente após a puberdade.',
    diferenciais: [
      {
        confundeCom: 'linfonodo e baço',
        comoSeparar:
          'Ache a **arteríola central** dentro do agregado linfoide: ela identifica o baço. O linfonodo tem nódulos restritos ao córtex, seio subcapsular e cordões medulares.',
      },
      {
        confundeCom: 'timo e linfonodo',
        comoSeparar:
          'O timo **não tem nódulos nem centros germinativos** e tem corpúsculos de Hassall na medula. A ausência de centro germinativo em órgão encapsulado é o critério.',
      },
      {
        confundeCom: 'nódulo primário e secundário',
        comoSeparar:
          'O secundário tem **centro germinativo** pálido com manto escuro ao redor; o primário é homogeneamente escuro.',
      },
      {
        confundeCom: 'tonsila e linfonodo',
        comoSeparar:
          'A tonsila tem epitélio de superfície que se invagina em criptas e cápsula **incompleta**; o linfonodo é totalmente encapsulado e não tem epitélio.',
      },
    ],
    clinica: [
      {
        condicao: 'Linfonodo sentinela',
        correlacao:
          'Como a linfa de um território drena para um linfonodo específico antes dos demais, marcá-lo e examiná-lo informa sobre disseminação sem esvaziar toda a cadeia. Toda a técnica se apoia na anatomia dos aferentes e do eferente único.',
      },
      {
        condicao: 'Esplenectomia e risco infeccioso',
        correlacao:
          'A polpa branca do baço responde a antígenos polissacarídicos capsulares. Sem ela, o risco de sepse fulminante por pneumococo, meningococo e *H. influenzae* aumenta — daí a vacinação obrigatória antes da cirurgia.',
      },
      {
        condicao: 'Linfedema',
        correlacao:
          'A remoção ou obstrução de vasos linfáticos impede o retorno das proteínas extravasadas. Elas se acumulam no interstício, elevam a pressão oncótica tecidual e o edema se torna crônico e fibrosante.',
      },
      {
        condicao: 'Imunossenescência',
        correlacao:
          'O timo involui e é substituído por gordura; a produção de linfócitos T novos cai, e a imunidade do idoso passa a depender de clones já formados — parte da resposta reduzida a vacinas.',
      },
    ],
    retencao: [
      'Duas classificações cruzadas: **primário ou secundário** e **difuso, nodular, agregado ou encapsulado**.',
      '**Centro germinativo só existe em órgão secundário.**',
      'Arteríola central identifica **baço**; corpúsculo de Hassall identifica **timo**.',
      'Muitos aferentes, **um** eferente — é o que faz a linfa atravessar o linfonodo inteiro.',
      'O estroma é **reticular** em todos, menos no timo, que é **epitelial**.',
    ],
  },
  'orgaos-e-sistemas/sistema-urinario': {
    histogenese:
      'O rim se forma em **três gerações sucessivas**, e só a última persiste. O **pronefro** é rudimentar e regride; o **mesonefro** funciona transitoriamente e seu ducto origina, no homem, o epidídimo e o ducto deferente; o **metanefro** aparece na quinta semana e se torna o rim definitivo. Ele resulta de uma indução recíproca clássica: o **broto ureteral**, evaginação do ducto mesonéfrico, invade o **blastema metanefrogênico** e ramifica-se — dessa ramificação vêm ureter, pelve, cálices e todos os **ductos coletores**; do blastema, induzido pelo broto, vêm os **néfrons**, do corpúsculo ao túbulo distal. É por isso que néfron e ducto coletor têm origens diferentes e histologias distinguíveis. O rim ascende da pelve e gira durante o desenvolvimento.',
    ultraestrutura:
      'A **barreira de filtração** é o ponto mais fino do órgão e tem três camadas em série. O **endotélio fenestrado** tem poros de 70 a 90 nm **sem diafragma** e retém apenas células. A **membrana basal glomerular**, espessa e fundida a partir das lâminas do endotélio e do podócito, é a barreira principal: a lâmina densa filtra por tamanho e as lâminas raras, ricas em heparan-sulfato, repelem ânions — é essa carga que impede a passagem da albumina. Os **podócitos** envolvem o capilar com pedicelos entrelaçados, e entre eles ficam as **fendas de filtração** de 25 a 60 nm, fechadas por diafragmas de **nefrina** e podocina. No túbulo proximal, a borda em escova e as invaginações basais com mitocôndrias alinhadas explicam a acidofilia.',
    manutencao:
      'O rim recebe cerca de **20 a 25% do débito cardíaco** para filtrar 180 litros de plasma por dia, e sua vascularização é peculiar: o glomérulo é um capilar interposto entre **duas arteríolas**, o que permite regular pressão de filtração e fluxo independentemente. O sangue segue para um **segundo leito capilar** — peritubular no córtex, vasos retos na medula —, arranjo de sistema porta arterial que torna os túbulos dependentes do que já passou pelo glomérulo e explica a vulnerabilidade isquêmica da medula, que trabalha com baixa tensão de oxigênio para manter o gradiente. A regeneração é limitada: o epitélio tubular se recupera bem de necrose tubular aguda se a membrana basal estiver íntegra, mas o **néfron perdido não é reposto** — não há nefrogênese após o nascimento.',
    diferenciais: [
      {
        confundeCom: 'túbulo proximal e distal',
        comoSeparar:
          'Conte núcleos por perfil e olhe a luz: o proximal é acidófilo, com borda em escova e luz mal definida, e tem **poucos** núcleos; o distal é pálido, de luz limpa e tem **mais** núcleos.',
      },
      {
        confundeCom: 'ducto coletor e túbulo do néfron',
        comoSeparar:
          'O coletor tem **limites celulares nítidos** e citoplasma pálido — nenhum túbulo do néfron mostra os contornos com essa clareza.',
      },
      {
        confundeCom: 'córtex e medula',
        comoSeparar:
          'Corpúsculos renais só existem no **córtex**. A medula tem perfis paralelos, sem glomérulo algum.',
      },
      {
        confundeCom: 'raio medular e medula',
        comoSeparar:
          'Apesar do nome, o raio medular está **dentro do córtex**: é uma faixa de túbulos retos entre as porções contorcidas. Confundi-los inverte a leitura do corte.',
      },
    ],
    clinica: [
      {
        condicao: 'Síndrome nefrótica',
        correlacao:
          'A lesão do podócito — apagamento dos pedicelos, perda da nefrina — destrói a seletividade por carga e tamanho. O resultado é proteinúria maciça, e a alteração pode ser invisível em luz e evidente em microscopia eletrônica.',
      },
      {
        condicao: 'Necrose tubular aguda',
        correlacao:
          'O túbulo proximal é o segmento de maior demanda metabólica e o primeiro a sofrer na isquemia ou na nefrotoxicidade. Se a membrana basal se preserva, o epitélio regenera e a função retorna.',
      },
      {
        condicao: 'Necrose de papila',
        correlacao:
          'A papila trabalha com a menor tensão de oxigênio do rim, porque os vasos retos sacrificam oxigenação para preservar o gradiente. Diabetes, anemia falciforme e abuso de analgésicos a levam à necrose.',
      },
      {
        condicao: 'Aparelho justaglomerular e hipertensão',
        correlacao:
          'A mácula densa lê o sódio no túbulo distal e as células justaglomerulares liberam renina. Toda a farmacologia dos inibidores da ECA e dos bloqueadores de receptor age sobre esse eixo.',
      },
    ],
    retencao: [
      'Néfron vem do **blastema**; ducto coletor vem do **broto ureteral** — origens diferentes.',
      'O glomérulo é capilar entre **duas arteríolas**: é isso que sustenta a pressão de filtração.',
      'Barreira: endotélio fenestrado **sem diafragma**, membrana basal e **fendas com nefrina**.',
      'Proximal: acidófilo, borda em escova, poucos núcleos. Distal: pálido, luz limpa, mais núcleos.',
      'O **raio medular fica no córtex** — apesar do nome.',
    ],
  },

  'orgaos-e-sistemas/sistema-endocrino': {
    histogenese:
      'As glândulas endócrinas se formam por **invaginação de um epitélio que depois perde a conexão com a superfície**, e é essa perda que as define. A **hipófise** é o exemplo mais didático porque tem origem dupla: a adeno-hipófise vem da **bolsa de Rathke**, evaginação do ectoderma do estomodeu, e a neuro-hipófise vem do assoalho do diencéfalo — duas origens, duas histologias que não se parecem. A **tireoide** desce do assoalho da faringe pelo ducto tireoglosso, cujo trajeto explica o cisto de linha média e a tireoide lingual. As **paratireoides** vêm da terceira e quarta bolsas faríngeas. A **suprarrenal** é dupla: o córtex do mesoderma celômico, a medula da **crista neural** — daí ela ser, funcionalmente, um gânglio simpático modificado.',
    ultraestrutura:
      'O tipo de hormônio se lê na ultraestrutura, e a distinção é rígida. A célula produtora de **peptídeo** tem retículo rugoso abundante, Golgi desenvolvido e **grânulos de secreção** delimitados por membrana, prontos para exocitose — seu citoplasma é basófilo ou granular em luz. A produtora de **esteroide** não estoca produto algum, porque o esteroide difunde assim que é formado: ela tem **retículo liso** extenso, **mitocôndrias com cristas tubulares** — e não lamelares — que abrigam enzimas da via, e **gotículas lipídicas** de colesterol esterificado, que se dissolvem no processamento e deixam o citoplasma vacuolado e pálido. A tireoide é a exceção que confirma a regra: armazena o hormônio **fora** da célula, no coloide folicular.',
    manutencao:
      'Toda glândula endócrina é irrigada por um leito de **capilares fenestrados** desproporcionalmente denso, encostado no parênquima — é a condição para que o hormônio alcance a circulação. Dois arranjos vasculares merecem destaque: o **sistema porta-hipofisário**, em que capilares da eminência mediana recolhem os fatores liberadores hipotalâmicos e os entregam a um segundo leito na adeno-hipófise, e a irrigação da **suprarrenal**, em que o sangue entra pela cápsula, percola o córtex e só então alcança a medula, banhando as células cromafins em cortisol concentrado — o que é necessário para a enzima que converte noradrenalina em adrenalina. A regulação se dá por **retroalimentação negativa**, e é ela que explica a atrofia glandular sob hormônio exógeno.',
    diferenciais: [
      {
        confundeCom: 'tireoide e paratireoide',
        comoSeparar:
          'A tireoide tem **folículos com coloide**; a paratireoide tem cordões e ninhos, sem folículos, e adipócitos no estroma que aumentam com a idade.',
      },
      {
        confundeCom: 'pars distalis e pars nervosa',
        comoSeparar:
          'A pars distalis tem cordões celulares com basófilas e acidófilas; a pars nervosa é pálida e fibrilar, com poucos núcleos, todos de pituícitos, e corpos de Herring.',
      },
      {
        confundeCom: 'córtex e medula da suprarrenal',
        comoSeparar:
          'O córtex é vacuolado — célula esteroidogênica; a medula é mais basófila e não vacuolada, e é onde estão as veias de grande calibre.',
      },
      {
        confundeCom: 'ilhota de Langerhans e ácino pancreático',
        comoSeparar:
          'A ilhota é um agrupamento **pálido**, ricamente capilarizado, sem ducto; o ácino é escuro, com base basófila e ápice granular, e drena para um ducto.',
      },
    ],
    clinica: [
      {
        condicao: 'Cisto do ducto tireoglosso',
        correlacao:
          'O trajeto de descida da tireoide, do forame cego da língua até o pescoço, pode deixar resquício epitelial. O cisto resultante fica na **linha média** e se move com a deglutição — a anatomia embrionária determina a apresentação.',
      },
      {
        condicao: 'Atrofia adrenal por corticoide exógeno',
        correlacao:
          'O corticoide suprime o ACTH, e a zona fasciculada, dependente dele, atrofia. A retirada abrupta produz insuficiência adrenal — daí o desmame gradual.',
      },
      {
        condicao: 'Hiperparatireoidismo',
        correlacao:
          'O PTH mobiliza cálcio do osso via RANKL, reabsorve cálcio no rim e ativa vitamina D. O excesso produz reabsorção óssea, hipercalcemia e litíase — três achados que decorrem de um só eixo.',
      },
      {
        condicao: 'Bócio',
        correlacao:
          'A falta de iodo reduz a produção de hormônio, o TSH sobe e o epitélio folicular hipertrofia. A glândula cresce enquanto tenta compensar — a lâmina mostra folículos com epitélio alto e pouco coloide.',
      },
    ],
    retencao: [
      'Endócrina é a glândula que **perdeu o ducto** — e por isso vive colada em capilar fenestrado.',
      'Peptídeo: **RER e grânulos**, citoplasma basófilo. Esteroide: **REL, cristas tubulares, lipídio**, citoplasma vacuolado.',
      'A **tireoide** é a única que estoca hormônio fora da célula.',
      'Hipófise: **duas origens**, adeno da bolsa de Rathke, neuro do diencéfalo.',
      'Suprarrenal: córtex **mesodérmico**, medula da **crista neural**.',
    ],
  },

  'orgaos-e-sistemas/sistema-reprodutor': {
    histogenese:
      'Os dois aparelhos partem de um **estágio indiferenciado** idêntico até a sétima semana, com gônada bipotencial e **dois pares de ductos**: os **mesonéfricos (de Wolff)** e os **paramesonéfricos (de Müller)**. O gene **SRY** do cromossomo Y determina a diferenciação testicular; as células de Sertoli produzem hormônio antimülleriano, que faz os ductos de Müller regredirem, e as de Leydig produzem testosterona, que mantém os de Wolff — daí epidídimo, ducto deferente e vesícula seminal. Sem SRY, os ductos de Müller persistem e formam tubas, útero e terço superior da vagina, enquanto os de Wolff regridem. As **células germinativas primordiais** têm origem extragonadal, no saco vitelino, e migram para as cristas gonadais — trajeto que explica os teratomas de linha média.',
    ultraestrutura:
      'A **barreira hematotesticular**, formada por junções estreitas entre células de Sertoli, divide o epitélio seminífero em compartimento basal e adluminal, isolando as células meióticas do sistema imune — elas expressam proteínas novas, ausentes quando a tolerância se estabeleceu, e seriam atacadas sem esse isolamento. A **espermiogênese** é uma transformação ultraestrutural completa: o Golgi forma o acrossomo, o núcleo condensa substituindo histonas por protaminas, os centríolos organizam o flagelo com axonema 9+2, mitocôndrias se enrolam na peça intermediária, e o excesso de citoplasma é descartado como corpo residual. Do lado feminino, a **zona pelúcida** é uma matriz de glicoproteínas ZP1 a ZP3 atravessada por prolongamentos que mantêm oócito e granulosa acoplados.',
    manutencao:
      'O testículo depende de temperatura **alguns graus abaixo da corporal**, mantida pelo plexo pampiniforme em contracorrente e pelos músculos cremaster e dartos — a criptorquidia compromete a espermatogênese exatamente por isso. Sua produção é **contínua** a partir da puberdade, com ciclo de cerca de 74 dias, e declina lentamente com a idade. O ovário é o oposto: a reserva de oócitos é **finita e estabelecida antes do nascimento**, cai de cerca de sete milhões no feto para trezentos mil na puberdade, e se esgota na menopausa; mais de 99% dos folículos se perdem por **atresia**, processo fisiológico em qualquer idade. A vascularização do endométrio é peculiar — artérias retas para a basal, espiraladas para a funcional — e é essa divisão que torna a menstruação possível sem destruir o órgão.',
    diferenciais: [
      {
        confundeCom: 'túbulo seminífero e ducto epididimário',
        comoSeparar:
          'O seminífero tem parede estratificada germinativa e luz com poucos espermatozoides; o epididimário tem epitélio pseudoestratificado com **estereocílios**, luz lisa e repleta.',
      },
      {
        confundeCom: 'dúctulo eferente e ducto epididimário',
        comoSeparar:
          'O contorno da luz resolve: **festonado** no dúctulo eferente, pela alternância de células altas e baixas; **liso e regular** no epididimário.',
      },
      {
        confundeCom: 'corpo lúteo e corpo albicante',
        comoSeparar:
          'O lúteo é muito celular, com células grandes e vacuoladas; o albicante é tecido cicatricial, quase só colágeno, com pouquíssimas células.',
      },
      {
        confundeCom: 'fases do endométrio',
        comoSeparar:
          'Avalie glândulas, estroma e espessura juntos: retas e sem secreção na proliferativa; tortuosas em dente de serra com estroma edemaciado na secretora. **Vacúolos subnucleares** marcam que houve ovulação.',
      },
    ],
    clinica: [
      {
        condicao: 'Criptorquidia',
        correlacao:
          'O testículo que não desce permanece a temperatura corporal. A espermatogênese falha e o risco de neoplasia germinativa aumenta — daí a orquidopexia precoce.',
      },
      {
        condicao: 'Varicocele',
        correlacao:
          'A dilatação do plexo pampiniforme compromete a troca de calor em contracorrente. A temperatura testicular sobe e a espermatogênese cai — a estrutura vascular explica a infertilidade.',
      },
      {
        condicao: 'Datação endometrial',
        correlacao:
          'A biópsia permite estimar o dia do ciclo pela morfologia glandular e estromal. É a aplicação direta do fato de que quase toda estrutura do aparelho feminino muda com o ciclo.',
      },
      {
        condicao: 'Gravidez ectópica tubária',
        correlacao:
          'A ampola é o sítio normal de fecundação, e o transporte depende de cílios e peristalse. Quando eles falham — após salpingite, por exemplo — o embrião implanta na tuba, que não tem submucosa para acomodar a invasão trofoblástica.',
      },
    ],
    retencao: [
      '**SRY** decide: Sertoli faz antimülleriano, Leydig faz testosterona, Wolff persiste.',
      'Masculino é **contínuo**; feminino é **cíclico e finito** — datar o material faz parte da leitura.',
      'Barreira hematotesticular isola as células **meióticas** do sistema imune.',
      'Na via masculina, epitélio **baixa** e muscular **engrossa** ao longo do trajeto.',
      'Mais de **99%** dos folículos se perdem por atresia, em qualquer idade.',
    ],
  },
  'orgaos-e-sistemas/olho': {
    histogenese:
      'O olho é o órgão em que a origem embrionária mais diretamente explica a histologia adulta. A **vesícula óptica** brota do diencéfalo e se invagina em **cálice óptico** de parede dupla — e é por isso que a retina tem **duas folhas** com os ápices voltados um para o outro, arranjo que persiste no epitélio duplo do corpo ciliar e da íris, e que deixa entre elas um espaço virtual por onde ocorre o descolamento de retina. O **cristalino** vem do ectoderma de superfície, induzido pela vesícula: o placódio se invagina e se destaca como vesícula, cujas células posteriores se alongam em fibras. A **córnea** vem do ectoderma de superfície e da crista neural, e **esclera, coroide e músculos** vêm do mesênquima de crista neural e mesoderma.',
    ultraestrutura:
      'A transparência é uma conquista ultraestrutural, e cada tecido a obtém de um jeito. No **estroma corneano**, 200 a 250 lamelas de colágeno tipo I com fibrilas de diâmetro uniforme e espaçamento regular cancelam o espalhamento de luz por interferência — basta o edema desorganizar esse espaçamento para a córnea opacificar. No **cristalino**, as fibras perdem núcleo e organelas e se enchem de **cristalinas** em arranjo regular; a agregação dessas proteínas com a idade é a catarata. No **fotorreceptor**, o segmento externo é uma pilha de centenas de discos membranosos com rodopsina, renovados continuamente na base e fagocitados no ápice pelo epitélio pigmentar — cerca de dez por cento por dia.',
    manutencao:
      'Estruturas transparentes não podem ter vasos, e o olho resolve isso com nutrição indireta. A **córnea** se nutre do humor aquoso, do filme lacrimal e dos vasos do limbo, e é essa avascularidade que a torna um dos transplantes de menor rejeição. O **cristalino** e o **corpo vítreo** também são avasculares. O **humor aquoso** é produzido pelo epitélio não pigmentado do corpo ciliar, circula da câmara posterior para a anterior e é drenado no limbo pela **rede trabecular** e pelo **canal de Schlemm** — e é o equilíbrio entre produção e drenagem que define a pressão intraocular. A retina tem dupla nutrição: as camadas internas pelos vasos retinianos, as **externas por difusão a partir da coriocapilar**, através da membrana de Bruch.',
    diferenciais: [
      {
        confundeCom: 'retina sensorial e não sensorial',
        comoSeparar:
          'A transição é a **ora serrata**, onde as camadas neurais terminam de uma vez e restam duas camadas de epitélio sobre o corpo ciliar. O epitélio pigmentar continua para a frente sem interrupção.',
      },
      {
        confundeCom: 'esclera e córnea',
        comoSeparar:
          'O arranjo do colágeno decide: regular e de diâmetro uniforme na córnea, irregular na esclera. É a mesma proteína produzindo transparência ou opacidade conforme a organização.',
      },
      {
        confundeCom: 'coroide e epitélio pigmentar',
        comoSeparar:
          'O pigmento da coroide é difuso no estroma, em melanócitos; o do epitélio pigmentar está numa **fileira única** de células cúbicas sobre a membrana de Bruch.',
      },
      {
        confundeCom: 'fóvea e disco óptico',
        comoSeparar:
          'Na fóvea as camadas internas se afastam lateralmente e só há cones; no disco **todas** as camadas retinianas se interrompem e os axônios atravessam a esclera.',
      },
    ],
    clinica: [
      {
        condicao: 'Glaucoma',
        correlacao:
          'A obstrução da drenagem na rede trabecular eleva a pressão intraocular, que deforma a **lâmina crivosa** — o ponto mecanicamente mais frágil da esclera — e comprime os axônios das células ganglionares que a atravessam.',
      },
      {
        condicao: 'Catarata',
        correlacao:
          'O cristalino não descarta células: cada camada de fibras se soma às antigas. Com a idade o núcleo endurece, as cristalinas se agregam e a transparência se perde — e a mesma rigidez explica a presbiopia.',
      },
      {
        condicao: 'Descolamento de retina',
        correlacao:
          'A separação ocorre no espaço virtual entre as duas folhas do cálice óptico, que nunca se fundiram. A retina neural descolada perde o suporte da coriocapilar e os fotorreceptores degeneram em horas a dias.',
      },
      {
        condicao: 'Degeneração macular relacionada à idade',
        correlacao:
          'O espessamento da membrana de Bruch e o acúmulo de drusas comprometem a difusão entre a coriocapilar e o epitélio pigmentar. A fóvea, que não tem vasos próprios, é a mais atingida.',
      },
    ],
    retencao: [
      'A retina tem **duas folhas** porque a vesícula óptica se invaginou — daí o espaço do descolamento.',
      'Transparência da córnea: **regularidade** das fibrilas, não ausência de colágeno.',
      'A luz atravessa a retina inteira **antes** de alcançar os fotorreceptores.',
      'Aquoso: produzido no **corpo ciliar**, drenado no **limbo** — o equilíbrio define a pressão.',
      'Retina externa se nutre por **difusão a partir da coriocapilar**.',
    ],
  },

  'orgaos-e-sistemas/ouvido': {
    histogenese:
      'As três porções da orelha têm origens distintas, e é isso que explica por que compartilham tão pouco. O **ouvido interno** aparece primeiro: o **placódio ótico**, espessamento do ectoderma de superfície, invagina-se e se destaca como **vesícula ótica**, que se diferencia em todo o labirinto membranoso e nos epitélios sensoriais; o labirinto ósseo se forma ao redor, no mesênquima. O **ouvido médio** vem da **primeira bolsa faríngea** endodérmica, que se expande em cavidade timpânica e tuba auditiva — daí seu epitélio ser contínuo com o respiratório da nasofaringe. Os **ossículos** vêm da cartilagem dos primeiro e segundo arcos faríngeos. O **ouvido externo** vem do primeiro sulco faríngeo ectodérmico e dos montículos auriculares dos dois primeiros arcos.',
    ultraestrutura:
      'A célula ciliada é a peça central, e sua ultraestrutura é o mecanismo da transdução. Seus **estereocílios** não são cílios: são microvilosidades sustentadas por actina, dispostas em feixe **escalonado** em degraus, unidas por pontas de ligação (tip links). Quando o feixe se inclina em direção ao mais alto, essas pontas tracionam canais de transdução e os abrem; o potássio da **endolinfa** — líquido singular no corpo por ser rico em K⁺ e pobre em Na⁺ — entra e despolariza a célula. Inclinação no sentido oposto fecha os canais e hiperpolariza. A endolinfa é produzida pela **estria vascular**, o único epitélio vascularizado dos mamíferos, e é ela que mantém o potencial endococlear de cerca de +80 mV, força motriz da transdução.',
    manutencao:
      'O labirinto é irrigado pela artéria labiríntica, **ramo terminal sem colaterais** — condição que torna a cóclea especialmente vulnerável à isquemia e explica a surdez súbita. Os dois líquidos são mantidos separados e com composições opostas: a **perilinfa**, semelhante ao extracelular, e a **endolinfa**, rica em potássio, produzida pela estria vascular e reabsorvida no saco endolinfático; o desequilíbrio dessa produção e reabsorção é o mecanismo proposto para a hidropisia endolinfática. As **células ciliadas do ser humano não se regeneram** — ao contrário do que ocorre em aves e peixes —, e é por isso que a perda auditiva neurossensorial por ruído, ototoxicidade ou idade é definitiva.',
    diferenciais: [
      {
        confundeCom: 'mácula e crista ampular',
        comoSeparar:
          'A mácula tem **otocônias** sobre a membrana gelatinosa e detecta aceleração linear; a crista tem cúpula **sem cristais** e detecta aceleração angular.',
      },
      {
        confundeCom: 'rampa vestibular e ducto coclear',
        comoSeparar:
          'Conte os três espaços do perfil coclear: as rampas contêm perilinfa e o ducto coclear, de secção triangular entre elas, contém endolinfa e o órgão de Corti.',
      },
      {
        confundeCom: 'estereocílios e cílios',
        comoSeparar:
          'Estereocílios têm eixo de **actina**, são imóveis e escalonados; cílios têm axonema 9+2 e corpúsculo basal. O cinocílio da célula vestibular é um cílio verdadeiro e único.',
      },
      {
        confundeCom: 'gânglio espiral e gânglio sensitivo comum',
        comoSeparar:
          'Os neurônios do gânglio espiral são **bipolares** no adulto — exceção rara, já que quase todo gânglio sensitivo tem neurônios pseudounipolares.',
      },
    ],
    clinica: [
      {
        condicao: 'Otite média',
        correlacao:
          'O epitélio da caixa timpânica é contínuo com o respiratório da nasofaringe pela tuba auditiva. A inflamação da via aérea superior sobe por essa continuidade — e a tuba mais curta e horizontal da criança explica a maior incidência nessa idade.',
      },
      {
        condicao: 'Otosclerose',
        correlacao:
          'A remodelação óssea anômala fixa a platina do estribo na janela oval. A cadeia deixa de transmitir e instala-se surdez de **condução**, com o ouvido interno íntegro.',
      },
      {
        condicao: 'Perda auditiva induzida por ruído',
        correlacao:
          'As células ciliadas externas da base da cóclea são as primeiras a se perder, e a base codifica os **agudos** — daí o entalhe característico em 4 kHz na audiometria. Como elas não se regeneram, a perda é definitiva.',
      },
      {
        condicao: 'Vertigem posicional paroxística benigna',
        correlacao:
          'Otocônias deslocadas da mácula migram para um ducto semicircular e passam a estimular a cúpula com o movimento da cabeça. O tratamento é uma manobra que as reconduz — anatomia aplicada diretamente.',
      },
    ],
    retencao: [
      'Três origens: **placódio ótico** (interno), **primeira bolsa faríngea** (médio), **primeiro sulco** (externo).',
      'Endolinfa é rica em **potássio** — é essa inversão que viabiliza a transdução.',
      'A **estria vascular** é o único epitélio vascularizado do corpo.',
      'Otocônias na mácula; cúpula **sem cristais** na crista ampular.',
      'Célula ciliada humana **não regenera**: a perda neurossensorial é definitiva.',
    ],
  },

  'celulas/divisao-celular': {
    histogenese:
      'A divisão celular é o mecanismo pelo qual toda a histogênese acontece: do zigoto às 37 trilhões de células do adulto, e depois disso na renovação diária dos tecidos lábeis. Duas modalidades com finalidades opostas. A **mitose** conserva — mantém o número de cromossomos e produz células idênticas, sustentando crescimento, renovação e reparo. A **meiose** diversifica e reduz — corta o número pela metade e recombina, produzindo gametas únicos e permitindo que a fecundação restaure a diploidia sem duplicá-la a cada geração. Nas linhagens germinativas as duas se sucedem: espermatogônias e ovogônias se multiplicam por mitose antes de entrar em meiose.',
    ultraestrutura:
      'O **fuso mitótico** é feito de microtúbulos nucleados nos centrossomos, cujo par de centríolos perpendiculares se duplica na fase S. Três populações se distinguem: os **cinetocóricos**, que ligam cromossomo a polo; os **polares**, que se sobrepõem no equador e empurram os polos; e os **astrais**, que ancoram o fuso ao córtex celular. O **cinetocoro** é uma placa proteica multicamada montada sobre o centrômero. Na citocinese, o **anel contrátil** de actina e miosina II aperta a região equatorial e produz o sulco de clivagem, e os microtúbulos remanescentes formam o **corpo intermediário**, plataforma da abscisão final. Na meiose I, o **complexo sinaptonêmico** parea os homólogos como um zíper proteico.',
    manutencao:
      'O avanço pelo ciclo é comandado por **ciclinas** e quinases dependentes de ciclina, e vigiado por pontos de checagem que interrompem o processo diante de problemas. O **ponto de restrição** em G1 decide entre prosseguir e entrar em **G0**, estado de quiescência de onde neurônios e cardiomiócitos nunca voltam. Checagens em G1/S e G2/M detectam dano no DNA, e o **ponto de checagem do fuso** só libera a anáfase quando todos os cinetocoros estiverem corretamente ligados. Essas salvaguardas são o que impede a propagação de erros — e sua perda, por mutação em p53, Rb ou nos reguladores do fuso, é o mecanismo central da transformação maligna e da instabilidade cromossômica dos tumores.',
    diferenciais: [
      {
        confundeCom: 'prófase e intérfase',
        comoSeparar:
          'A prófase tem cromatina grumosa e **perde o nucléolo**; a intérfase mantém envoltório nuclear íntegro, cromatina dispersa e nucléolo visível.',
      },
      {
        confundeCom: 'anáfase I e anáfase mitótica',
        comoSeparar:
          'Verifique o que migra: na anáfase I são **homólogos** com duas cromátides cada; na mitótica são **cromátides irmãs** individuais.',
      },
      {
        confundeCom: 'telófase e prófase',
        comoSeparar:
          'Ambas têm cromatina intermediária e envoltório em transição. A constrição equatorial e as **duas** massas de cromatina identificam a telófase.',
      },
      {
        confundeCom: 'figura mitótica normal e atípica',
        comoSeparar:
          'Fusos tripolares, cromossomos retardatários e pontes anafásicas indicam divisão anômala — achado com peso diagnóstico em patologia, e não variação normal.',
      },
    ],
    clinica: [
      {
        condicao: 'Índice mitótico e graduação tumoral',
        correlacao:
          'A contagem de mitoses por campo entra na graduação de vários tumores. Figuras **atípicas** pesam ainda mais, porque indicam instabilidade cromossômica, não apenas proliferação.',
      },
      {
        condicao: 'Antimitóticos',
        correlacao:
          'Alcaloides da vinca impedem a polimerização dos microtúbulos e taxanos a estabilizam em excesso. Ambos travam a mitose por caminhos opostos, e ambos atingem também os tecidos lábeis normais.',
      },
      {
        condicao: 'Não disjunção e idade materna',
        correlacao:
          'O oócito permanece parado em prófase I por décadas, e a coesão entre cromátides se deteriora com o tempo. É essa parada prolongada que explica o aumento das trissomias com a idade materna.',
      },
      {
        condicao: 'Cariótipo e bloqueio em metáfase',
        correlacao:
          'A colchicina impede a formação do fuso e acumula células em metáfase, quando os cromossomos estão em condensação máxima. É a técnica que torna a citogenética convencional possível.',
      },
    ],
    retencao: [
      'Mitose **conserva**; meiose **reduz e recombina**.',
      'Duas divisões após **uma única** replicação — é isso que define a meiose.',
      'Anáfase I separa **homólogos**; anáfase II e a mitótica separam **cromátides**.',
      'Envoltório nuclear e nucléolo: presentes na intérfase, ausentes da prometáfase à telófase.',
      'A perda dos **pontos de checagem** é o mecanismo central da transformação maligna.',
    ],
  },
}

/**
 * Aprofundamento aplicável a um caminho do currículo.
 *
 * Sobe do nó mais específico ao mais geral e devolve o primeiro que existir,
 * de modo que `tecidos/tecido-conjuntivo/bone/...` encontre o texto do osso
 * antes de cair no do conjuntivo em geral.
 */
export function aprofundamentoDe(caminho: readonly string[]): Aprofundamento | null {
  for (let i = caminho.length; i > 0; i--) {
    const achado = APROFUNDAMENTOS[caminho.slice(0, i).join('/')]
    if (achado) return achado
  }
  return null
}

export const TOTAL_DE_APROFUNDAMENTOS = Object.keys(APROFUNDAMENTOS).length
