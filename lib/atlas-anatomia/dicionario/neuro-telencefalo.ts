import type { EntradaDicionario } from './tipos'

/**
 * Telencéfalo: sulcos, giros, comissuras e núcleos da base.
 *
 * O córtex não é uma paisagem decorativa: cada giro tem uma função, e a função
 * prevê o déficit. Ensinar giro sem ensinar o que se perde quando ele é lesado
 * transforma neuroanatomia em geografia — e o aluno esquece em uma semana.
 * Aqui, cada estrutura vem com a síndrome que a torna inesquecível.
 */
export const NEURO_TELENCEFALO: EntradaDicionario[] = [
  /* ─────────────────── Sulcos e polos de referência ─────────────────── */
  {
    termos: ['Sulco Lateral'],
    classe: 'snc',
    resumo: 'O sulco de Sylvius: fenda profunda que separa o lobo temporal dos lobos frontal e parietal.',
    localizacao:
      'Face lateral do hemisfério, correndo de baixo e da frente para cima e para trás. Emite três ramos anteriores: anterior, ascendente e posterior.',
    funcao:
      'É a primeira referência a se procurar num encéfalo: no seu fundo está a ínsula, e ao longo dele corre a artéria cerebral média com todos os seus ramos.',
    vascularizacao: 'A artéria cerebral média percorre toda a sua extensão e emerge dele para irrigar a face lateral do hemisfério.',
    relacoes: 'O opérculo frontal, parietal e temporal cobrem a ínsula no seu fundo.',
    clinica:
      'É o vale por onde passa a artéria mais frequentemente ocluída no AVC isquêmico. Como a cerebral média irriga a área motora e sensitiva da face e do membro superior, a área de Broca e a de Wernicke, o AVC de cerebral média produz a síndrome mais reconhecível da neurologia: hemiparesia braquiofacial contralateral, hemi-hipoestesia, afasia (se no hemisfério dominante) e desvio do olhar para o lado da lesão.',
    memoria:
      'Sulco lateral é o "vale da cerebral média". Todo AVC clássico que você já viu aconteceu dentro desse vale.',
    pontos: [
      'Que lobos o sulco lateral separa?',
      'Que artéria corre nele?',
      'Que síndrome clínica o AVC de cerebral média produz?',
    ],
  },
  {
    termos: ['Sulco Central'],
    classe: 'snc',
    resumo: 'O sulco de Rolando: divide o lobo frontal do parietal e separa o córtex motor do sensitivo.',
    localizacao:
      'Corre obliquamente na face lateral, de cima e de trás para baixo e para a frente, começando um pouco atrás do ponto médio do hemisfério e terminando acima do sulco lateral.',
    funcao: 'É a fronteira funcional mais importante do córtex: à frente, o giro pré-central, motor; atrás, o giro pós-central, sensitivo.',
    vascularizacao:
      'Artéria cerebral média nos dois terços inferiores e cerebral anterior no terço superior, que transborda a borda do hemisfério. Essa fronteira arterial no alto do sulco é o que produz a diferença clínica mais útil do AVC: cerebral média poupa a perna, cerebral anterior poupa a face e a mão.',
    relacoes: 'Sua extremidade superior atravessa a margem do hemisfério e desce um pouco na face medial, junto ao lóbulo paracentral.',
    clinica:
      'Localizá-lo na ressonância é o primeiro passo do planejamento neurocirúrgico: um tumor à frente ou atrás dele tem implicações funcionais completamente diferentes. O "sinal do ômega", a alça do giro pré-central que corresponde à mão, é o marco usado para identificá-lo no corte axial — e é a referência para preservar a motricidade da mão numa ressecção.',
    memoria:
      'Antes do sulco central, você se mexe; depois dele, você sente. É a linha que divide fazer de perceber.',
    pontos: [
      'Que giros o sulco central separa?',
      'O que é o sinal do ômega?',
      'Por que localizá-lo é essencial em neurocirurgia?',
    ],
  },
  {
    termos: ['Sulco Pré-Central'],
    classe: 'snc',
    resumo: 'Sulco paralelo e anterior ao central, que limita à frente o giro pré-central.',
    localizacao: 'Face lateral do lobo frontal, à frente e paralelo ao sulco central; frequentemente descontínuo, em porções superior e inferior.',
    funcao: 'Delimita o córtex motor primário à frente e separa-o do córtex pré-motor.',
    vascularizacao:
      'Ramos pré-frontais e pré-centrais da artéria cerebral média, com a porção superior pela cerebral anterior.',
    relacoes: 'Os sulcos frontais superior e inferior partem dele em direção anterior.',
    clinica:
      'Sua identificação é o método clássico de localizar o sulco central na ressonância: acha-se o sulco frontal superior, segue-se para trás até o pré-central, e o próximo sulco é o central. Um roteiro de três passos que resolve a leitura de qualquer corte axial encefálico.',
    memoria:
      'Sulco frontal superior aponta para o pré-central; atrás do pré-central está o central. Uma escada de três degraus.',
    pontos: [
      'Que áreas corticais o sulco pré-central separa?',
      'Como ele ajuda a localizar o sulco central?',
      'Que sulcos partem dele anteriormente?',
    ],
  },
  {
    termos: ['Giro Pré-Central'],
    classe: 'snc',
    resumo: 'Córtex motor primário (área 4 de Brodmann), onde se origina o trato corticoespinal.',
    localizacao: 'Entre o sulco pré-central e o sulco central, na face lateral do lobo frontal, estendendo-se até a face medial no lóbulo paracentral.',
    funcao:
      'Abriga o homúnculo motor: a representação do corpo invertida e desproporcional, com a face na porção inferior, junto ao sulco lateral, o membro superior no meio e o membro inferior na face medial. As áreas com controle fino — mão, língua, lábios — ocupam território desproporcionalmente grande.',
    vascularizacao: 'Artéria cerebral média para a face e o membro superior; artéria cerebral anterior para o membro inferior.',
    relacoes: 'Suas fibras convergem na coroa radiada e descem pelo joelho e braço posterior da cápsula interna.',
    clinica:
      'Essa divisão vascular é a chave: o AVC de cerebral anterior poupa a face e o braço e paralisa a perna contralateral; o de cerebral média faz o oposto. Diante de uma hemiparesia, a distribuição braquiofacial contra crural diz qual artéria está ocluída antes de qualquer exame. A crise focal motora com marcha jacksoniana é a descarga percorrendo o homúnculo.',
    memoria:
      'Perna na face medial (cerebral anterior), braço e cara na lateral (cerebral média). A geografia do homúnculo é a geografia das artérias.',
    pontos: [
      'Como o corpo está representado no giro pré-central?',
      'Que artérias irrigam cada parte do homúnculo?',
      'O que é a marcha jacksoniana?',
    ],
  },
  {
    termos: ['Sulco Pós-Central'],
    classe: 'snc',
    resumo: 'Sulco posterior e paralelo ao central, que limita atrás o giro pós-central.',
    localizacao: 'Face lateral do lobo parietal, atrás e paralelo ao sulco central; dele parte, para trás, o sulco intraparietal.',
    funcao: 'Delimita o córtex somatossensitivo primário e separa-o do córtex de associação parietal.',
    vascularizacao:
      'Ramos parietais da artéria cerebral média; a porção mais superior, junto à borda do hemisfério, é da cerebral anterior.',
    relacoes: 'Encontra o sulco intraparietal em ângulo reto, formando um T deitado característico.',
    clinica:
      'É o marco que separa o "sentir" do "interpretar o que se sente". Lesões à frente dele produzem perda sensitiva elementar; atrás dele, agnosias táteis — o paciente sente o objeto na mão mas não consegue reconhecê-lo, a astereognosia.',
    memoria:
      'Sentir é à frente do sulco pós-central; entender o que se sente é atrás. A diferença entre tocar e reconhecer.',
    pontos: [
      'Que áreas o sulco pós-central separa?',
      'Que sulco parte dele posteriormente?',
      'O que é astereognosia?',
    ],
  },
  {
    termos: ['Giro Pós-Central'],
    classe: 'snc',
    resumo: 'Córtex somatossensitivo primário (áreas 3, 1 e 2), destino final das vias sensitivas do corpo.',
    localizacao: 'Entre o sulco central e o pós-central, no lobo parietal, com extensão medial no lóbulo paracentral.',
    funcao:
      'Recebe as fibras do núcleo ventral posterolateral (corpo) e ventral posteromedial (face) do tálamo, organizadas no homúnculo sensitivo, com a mesma lógica invertida e desproporcional do motor.',
    vascularizacao: 'Cerebral média para face e membro superior; cerebral anterior para o membro inferior.',
    relacoes: 'Está imediatamente atrás do córtex motor, o que faz lesões vasculares comprometerem os dois juntos.',
    clinica:
      'A proximidade explica por que hemiparesia e hemi-hipoestesia costumam vir juntas no AVC cortical — enquanto lesões da cápsula interna podem dar hemiparesia pura, e lesões talâmicas, hipoestesia pura. Essa dissociação é o que permite localizar a lesão pela clínica antes da imagem.',
    memoria:
      'Motor e sensitivo são vizinhos de parede: quase sempre caem juntos. Quando caem separados, a lesão é mais profunda.',
    pontos: [
      'De que núcleos talâmicos o giro pós-central recebe fibras?',
      'Por que hemiparesia e hipoestesia costumam coexistir no AVC cortical?',
      'Como se apresenta uma lesão capsular pura?',
    ],
  },
  /* ─────────────────── Lobo frontal ─────────────────── */
  {
    termos: ['Giro Frontal Superior'],
    classe: 'snc',
    resumo: 'Giro mais alto do lobo frontal, que se estende à face medial e contém a área motora suplementar.',
    localizacao: 'Da margem superomedial do hemisfério até o sulco frontal superior, continuando-se na face medial até o sulco do cíngulo.',
    funcao: 'Contém a área motora suplementar, responsável pelo planejamento e pela iniciação de sequências motoras, e parte do córtex pré-frontal dorsolateral.',
    vascularizacao: 'Artéria cerebral anterior.',
    relacoes: 'Sua porção posterior, junto ao lóbulo paracentral, contém o campo ocular frontal.',
    clinica:
      'A lesão da área motora suplementar produz uma síndrome curiosa e transitória: mutismo acinético, em que o paciente não fala nem se move espontaneamente, mas responde a estímulos — recuperando-se em dias a semanas. E a lesão bilateral do giro frontal superior medial causa abulia e apatia profunda, frequentemente confundida com depressão.',
    memoria:
      'Área motora suplementar não faz o movimento: ela decide começar o movimento. Lesada, o paciente pode se mexer, mas não inicia nada.',
    pontos: [
      'Que área funcional o giro frontal superior contém?',
      'O que é o mutismo acinético?',
      'Que artéria irriga esse giro?',
    ],
  },
  {
    termos: ['Sulco Frontal Superior'],
    classe: 'snc',
    resumo: 'Sulco anteroposterior que separa os giros frontais superior e médio.',
    localizacao: 'Face lateral do lobo frontal, correndo da região pré-central para a frente.',
    funcao: 'Delimita os dois giros e serve de referência: sua extremidade posterior encontra o sulco pré-central.',
    vascularizacao:
      'Ramos frontais da artéria cerebral anterior e da cerebral média. Sua extremidade posterior encontra o sulco pré-central e marca o campo ocular frontal — a área cuja lesão faz os olhos se desviarem para o lado da lesão.',
    relacoes: 'Na sua junção com o pré-central está o campo ocular frontal.',
    clinica:
      'O campo ocular frontal comanda os movimentos oculares sacádicos para o lado oposto. Sua lesão destrutiva faz os olhos desviarem para o lado da lesão — "o paciente olha para a lesão"; uma crise epiléptica na mesma área faz o oposto, os olhos desviam para longe do foco. Duas regras opostas que se explicam pela mesma anatomia.',
    memoria:
      'AVC: o paciente olha para a lesão. Crise: o paciente olha para longe da lesão. Destruição desvia para o lado, irritação desvia para o lado contrário.',
    pontos: [
      'Que giros o sulco frontal superior separa?',
      'Onde se localiza o campo ocular frontal?',
      'Para que lado os olhos desviam no AVC e na crise?',
    ],
  },
  {
    termos: ['Giro Frontal Médio'],
    classe: 'snc',
    resumo: 'Giro intermediário do lobo frontal, componente central do córtex pré-frontal dorsolateral.',
    localizacao: 'Entre os sulcos frontais superior e inferior, na face lateral do lobo frontal.',
    funcao:
      'Sede das funções executivas: memória de trabalho, planejamento, flexibilidade cognitiva e inibição de respostas automáticas — o que a neuropsicologia chama de controle executivo.',
    vascularizacao: 'Artéria cerebral média.',
    relacoes: 'Sua porção posterior participa do campo ocular frontal.',
    clinica:
      'A lesão dorsolateral produz a síndrome disexecutiva: perseveração, dificuldade de planejar e de alternar entre tarefas, com inteligência formal preservada — o paciente acerta no teste e falha na vida. É o que os testes de Wisconsin e de fluência verbal detectam, e é a base do comprometimento na demência frontotemporal variante comportamental.',
    memoria:
      'Pré-frontal dorsolateral é o "gerente" do cérebro: ele não executa, ele organiza. Sem gerente, tudo continua funcionando e nada se conclui.',
    pontos: [
      'Que funções o córtex pré-frontal dorsolateral exerce?',
      'O que é a síndrome disexecutiva?',
      'Que testes a avaliam?',
    ],
  },
  {
    termos: ['Sulco Frontal Inferior'],
    classe: 'snc',
    resumo: 'Sulco que separa o giro frontal médio do inferior na face lateral do lobo frontal.',
    localizacao: 'Face lateral do lobo frontal, abaixo do sulco frontal superior e acima do giro frontal inferior.',
    funcao: 'Delimita os dois giros; sua extremidade posterior alcança o sulco pré-central inferior.',
    vascularizacao:
      'Ramos frontais da artéria cerebral média. Delimita por cima o giro frontal inferior, onde mora a área de Broca no hemisfério dominante.',
    relacoes: 'Abaixo dele está o giro frontal inferior, com a área de Broca no hemisfério dominante.',
    clinica:
      'É a referência que orienta a localização da área de Broca em cirurgia com paciente acordado: o mapeamento por estimulação elétrica busca as partes triangular e opercular abaixo desse sulco, e a interrupção da fala durante a estimulação identifica o território que não pode ser ressecado.',
    memoria: 'Abaixo do sulco frontal inferior mora a fala. É o andar de baixo do lobo frontal.',
    pontos: [
      'Que giros esse sulco separa?',
      'Que área funcional está imediatamente abaixo dele?',
      'Como se identifica a área de Broca em cirurgia?',
    ],
  },
  {
    termos: ['Giro Frontal Inferior'],
    classe: 'snc',
    resumo: 'Giro mais baixo do lobo frontal, dividido em três partes, que abriga a área de Broca no hemisfério dominante.',
    localizacao: 'Entre o sulco frontal inferior e o sulco lateral, dividido pelos ramos anterior e ascendente do sulco lateral em partes orbital, triangular e opercular.',
    funcao: 'As partes triangular e opercular formam a área de Broca (áreas 44 e 45), responsável pela produção da linguagem — a programação motora da fala e a construção sintática.',
    vascularizacao: 'Ramos da artéria cerebral média (divisão superior).',
    relacoes: 'Conecta-se à área de Wernicke pelo fascículo arqueado.',
    clinica:
      'A afasia de Broca é não fluente: o paciente compreende, sabe o que quer dizer, mas produz frases curtas, telegráficas e com esforço — e tem plena consciência disso, o que a torna frustrante e frequentemente acompanhada de depressão. Como a área é vizinha do homúnculo da face e da mão, a afasia de Broca vem quase sempre com hemiparesia braquiofacial direita.',
    memoria:
      'Broca fala pouco e entende tudo; Wernicke fala muito e não entende nada. Frente produz, trás compreende.',
    pontos: [
      'Que partes compõem o giro frontal inferior?',
      'Quais delas formam a área de Broca?',
      'Como se caracteriza a afasia de Broca?',
    ],
  },
  {
    termos: ['Parte Opercular do Giro Frontal Inferior'],
    classe: 'snc',
    resumo: 'Porção posterior do giro frontal inferior, entre os ramos ascendente e posterior do sulco lateral — área 44.',
    localizacao: 'Imediatamente à frente do giro pré-central inferior, cobrindo a ínsula como um opérculo.',
    funcao: 'Componente posterior da área de Broca, mais ligado à programação motora articulatória da fala.',
    vascularizacao:
      'Ramos pré-centrais da artéria cerebral média. Junto com a parte triangular, forma a área de Broca — e é o território do ramo superior da cerebral média, cuja oclusão produz afasia de expressão com compreensão preservada.',
    relacoes: 'Cobre a porção anterior da ínsula.',
    clinica:
      'A lesão isolada da parte opercular tende a produzir apraxia de fala — o paciente sabe a palavra e tenta articulá-la, errando os sons de forma inconsistente —, distinta da afasia de Broca completa. Essa dissociação, entre programar o som e construir a frase, é o que separa as áreas 44 e 45.',
    memoria:
      '"Opérculo" é tampa. As três partes do giro frontal inferior são a tampa que cobre a ínsula.',
    pontos: [
      'A que área de Brodmann a parte opercular corresponde?',
      'Que função ela desempenha na fala?',
      'O que é apraxia de fala?',
    ],
  },
  {
    termos: ['Parte Triangular do Giro Frontal Inferior'],
    classe: 'snc',
    resumo: 'Porção média e triangular do giro frontal inferior, entre os ramos anterior e ascendente do sulco lateral — área 45.',
    localizacao: 'Entre os ramos anterior e ascendente do sulco lateral, com formato de triângulo bem reconhecível.',
    funcao: 'Componente anterior da área de Broca, mais relacionado ao processamento semântico e à seleção de palavras.',
    vascularizacao:
      'Ramos frontais ascendentes da artéria cerebral média. Com a parte opercular, compõe a área 44/45 de Brodmann — a área de Broca.',
    relacoes: 'É o marco anatômico mais fácil de reconhecer na face lateral do lobo frontal.',
    clinica:
      'Sua forma triangular característica é o que permite localizar a área de Broca numa peça ou numa reconstrução tridimensional em segundos: procura-se o V formado pelos dois ramos do sulco lateral, e o triângulo entre eles é a área 45. Um reparo visual que substitui a memorização de coordenadas.',
    memoria:
      'Procure o "V" na face lateral do frontal: o triângulo dentro do V é a parte triangular, e ao lado dela está o resto de Broca.',
    pontos: [
      'Que ramos do sulco lateral delimitam a parte triangular?',
      'A que área de Brodmann ela corresponde?',
      'Que função ela desempenha?',
    ],
  },
  {
    termos: ['Parte Orbital do Giro Frontal Inferior'],
    classe: 'snc',
    resumo: 'Porção anterior e inferior do giro frontal inferior, que se continua com a face orbital do lobo frontal.',
    localizacao: 'À frente do ramo anterior do sulco lateral, curvando-se para a face inferior do lobo frontal.',
    funcao: 'Faz parte do córtex órbito-frontal lateral, envolvido na avaliação de recompensa, na inibição comportamental e no julgamento social.',
    vascularizacao:
      'Ramos orbitofrontais da artéria cerebral média. É a porção mais anterior do giro frontal inferior e a menos envolvida na linguagem, ao contrário das partes triangular e opercular.',
    relacoes: 'Continua-se com os giros orbitários na face inferior.',
    clinica:
      'A lesão órbito-frontal produz a síndrome de desinibição: impulsividade, comportamento social inadequado, jocosidade inapropriada e perda do julgamento — o caso de Phineas Gage é o exemplo histórico. É a variante comportamental da demência frontotemporal, em que a personalidade muda antes da memória.',
    memoria:
      'Dorsolateral perde a organização; órbito-frontal perde o freio. Um não planeja, o outro não se contém.',
    pontos: [
      'Que funções o córtex órbito-frontal exerce?',
      'O que é a síndrome de desinibição frontal?',
      'Como ela difere da síndrome dorsolateral?',
    ],
  },
  {
    termos: ['Ramo Anterior do Sulco Lateral'],
    classe: 'snc',
    resumo: 'Ramo horizontal do sulco lateral que delimita à frente a parte triangular.',
    localizacao: 'Projeta-se para a frente a partir do tronco do sulco lateral, na face lateral do lobo frontal.',
    funcao: 'Separa a parte orbital da parte triangular do giro frontal inferior.',
    relacoes: 'Com o ramo ascendente, forma o V que delimita a parte triangular.',
    clinica:
      'É um dos dois braços do V que identifica a área de Broca. Reconhecê-lo é o que permite ao neurocirurgião planejar craniotomias frontais laterais sem invadir área eloquente no hemisfério dominante.',
    memoria: 'Dois ramos saindo do sulco lateral formam um "V" deitado. Dentro do V está o triângulo da linguagem.',
    pontos: [
      'Que partes do giro frontal inferior esse ramo separa?',
      'Como ele contribui para localizar a área de Broca?',
      'De onde ele se origina?',
    ],
  },
  {
    termos: ['Ramo Ascendente do Sulco Lateral'],
    classe: 'snc',
    resumo: 'Ramo vertical do sulco lateral, que separa as partes triangular e opercular.',
    localizacao: 'Sobe verticalmente do tronco do sulco lateral, na face lateral do lobo frontal.',
    funcao: 'Delimita, atrás, a parte triangular e, à frente, a parte opercular.',
    vascularizacao:
      'Ramos da artéria cerebral média, que emerge do sulco lateral justamente aqui para se distribuir pela convexidade — é o ponto em que a artéria sai da profundidade e se torna cortical.',
    relacoes: 'É o segundo braço do V característico.',
    clinica:
      'A distinção entre as duas partes que ele separa tem valor clínico real: lesões predominantemente operculares produzem apraxia de fala, e lesões triangulares, dificuldade de acesso lexical. A ressonância funcional consegue separar essas duas ativações em torno do ramo ascendente.',
    memoria: 'Ramo anterior deita, ramo ascendente sobe. Entre os dois, o triângulo.',
    pontos: [
      'Que partes o ramo ascendente separa?',
      'Qual sua direção em relação ao tronco do sulco lateral?',
      'Que relevância funcional essa divisão tem?',
    ],
  },
  {
    termos: ['Ramo Posterior do Sulco Lateral'],
    classe: 'snc',
    resumo: 'Continuação principal e mais longa do sulco lateral em direção posterior.',
    localizacao: 'Corre para trás e ligeiramente para cima, terminando no lobo parietal, onde o giro supramarginal o contorna.',
    funcao: 'Constitui o corpo do sulco lateral e separa o lobo temporal do frontal e do parietal.',
    relacoes: 'Sua extremidade posterior é abraçada pelo giro supramarginal.',
    clinica:
      'É a referência de superfície mais confiável para localizar a fissura silviana na craniotomia pterional. E a dissecção da fissura silviana ao longo dele é a via padrão para aneurismas de cerebral média e do complexo comunicante anterior.',
    memoria:
      'A ponta do ramo posterior é abraçada pelo giro supramarginal, como um dedo que aponta e uma mão que o envolve.',
    pontos: [
      'Onde termina o ramo posterior do sulco lateral?',
      'Que giro contorna sua extremidade?',
      'Que via cirúrgica o utiliza?',
    ],
  },
  /* ─────────────────── Lobo parietal ─────────────────── */
  {
    termos: ['Sulco Intraparietal'],
    classe: 'snc',
    resumo: 'Sulco que divide o lobo parietal em lóbulos parietais superior e inferior.',
    localizacao: 'Face lateral do lobo parietal, correndo para trás a partir do sulco pós-central.',
    funcao: 'Delimita os dois lóbulos parietais e abriga, nas suas paredes, áreas envolvidas na atenção visuoespacial e no controle do alcance e da preensão.',
    vascularizacao:
      'Ramos parietais posteriores da artéria cerebral média. Separa os lóbulos parietais superior e inferior, e sua margem inferior abriga os giros supramarginal e angular — cuja lesão à esquerda produz a síndrome de Gerstmann.',
    relacoes: 'Acima está o lóbulo parietal superior; abaixo, o inferior, com os giros supramarginal e angular.',
    clinica:
      'É a região central da síndrome de Balint quando a lesão é bilateral: simultanagnosia (o paciente vê partes, não o todo), apraxia óptica e ataxia óptica — não consegue alcançar objetos guiado pela visão. Uma síndrome rara, mas que demonstra melhor que qualquer outra a função do parietal na integração visuoespacial.',
    memoria:
      'O parietal transforma "ver" em "alcançar". Sem ele, a mão não encontra o copo que os olhos estão vendo.',
    pontos: [
      'Que lóbulos o sulco intraparietal separa?',
      'Que funções as áreas em suas paredes exercem?',
      'O que é a síndrome de Balint?',
    ],
  },
  {
    termos: ['Lóbulo Parietal Superior'],
    classe: 'snc',
    resumo: 'Porção parietal acima do sulco intraparietal, dedicada à integração somatossensitiva e espacial.',
    localizacao: 'Entre o sulco pós-central, o intraparietal e o sulco parietoccipital, na face lateral e superior do hemisfério.',
    funcao: 'Constrói a representação do corpo no espaço, integrando informação somatossensitiva, visual e proprioceptiva.',
    vascularizacao: 'Artérias cerebrais anterior e média.',
    relacoes: 'Continua-se na face medial como o pré-cúneo.',
    clinica:
      'Sua lesão à direita produz a heminegligência espacial: o paciente ignora o hemiespaço esquerdo — não come a metade esquerda do prato, não se barbeia do lado esquerdo, desenha um relógio só com metade dos números. E o mais desconcertante é a anosognosia: ele não reconhece o próprio déficit. É a síndrome que melhor mostra que consciência do espaço e espaço físico não são a mesma coisa.',
    memoria:
      'Lesão parietal direita apaga o lado esquerdo do mundo — e apaga também a noção de que ele existe.',
    pontos: [
      'Que funções o lóbulo parietal superior integra?',
      'O que é heminegligência e em que lado a lesão ocorre?',
      'O que é anosognosia?',
    ],
  },
  {
    termos: ['Giro Supramarginal'],
    classe: 'snc',
    resumo: 'Giro do lóbulo parietal inferior que contorna a extremidade do ramo posterior do sulco lateral — área 40.',
    localizacao: 'Lóbulo parietal inferior, abraçando a ponta do sulco lateral.',
    funcao: 'Participa do processamento fonológico da linguagem e da integração sensório-motora para o gesto.',
    vascularizacao: 'Artéria cerebral média.',
    relacoes: 'É atravessado pelo fascículo arqueado, que liga Wernicke a Broca.',
    clinica:
      'A lesão do giro supramarginal e do fascículo arqueado produz a afasia de condução: fala fluente, compreensão preservada, mas repetição gravemente comprometida — o paciente entende a frase e não consegue repeti-la, com parafasias fonêmicas e consciência do erro. É a prova clínica de que existe um cabo ligando compreensão e produção.',
    memoria:
      'Compreende e fala, mas não repete: o cabo entre as duas áreas foi cortado. Isso é afasia de condução.',
    pontos: [
      'Que fascículo atravessa o giro supramarginal?',
      'O que caracteriza a afasia de condução?',
      'A que área de Brodmann ele corresponde?',
    ],
  },
  {
    termos: ['Giro Angular'],
    classe: 'snc',
    resumo: 'Giro do lóbulo parietal inferior que contorna a extremidade do sulco temporal superior — área 39.',
    localizacao: 'Atrás do giro supramarginal, na junção dos lobos parietal, temporal e occipital.',
    funcao:
      'É uma área de convergência multimodal: integra informação visual, auditiva e somatossensitiva, sendo essencial para a leitura, a escrita e o cálculo.',
    vascularizacao: 'Artéria cerebral média (divisão inferior).',
    relacoes: 'Situa-se na encruzilhada entre os três lobos posteriores.',
    clinica:
      'Sua lesão no hemisfério dominante produz a síndrome de Gerstmann: agrafia, acalculia, agnosia digital e desorientação direita-esquerda — quatro sinais que, juntos, localizam a lesão com precisão notável. É um dos poucos quadrantes do córtex em que a clínica é praticamente uma coordenada anatômica.',
    memoria:
      'Gerstmann: não escreve, não calcula, não nomeia os dedos e não sabe direita de esquerda. Quatro déficits, um giro.',
    pontos: [
      'Que modalidades sensoriais o giro angular integra?',
      'Quais são os quatro componentes da síndrome de Gerstmann?',
      'A que área de Brodmann ele corresponde?',
    ],
  },
  {
    termos: ['Ramo Marginal'],
    classe: 'snc',
    resumo: 'Ramo ascendente terminal do sulco do cíngulo, na face medial, que separa o lóbulo paracentral do pré-cúneo.',
    localizacao: 'Face medial do hemisfério, subindo do sulco do cíngulo até a margem superior, atrás do lóbulo paracentral.',
    funcao: 'Delimita posteriormente o lóbulo paracentral e marca, na face medial, o limite entre os lobos frontal-parietal anterior e o pré-cúneo.',
    vascularizacao:
      'Artéria calosomarginal, ramo da cerebral anterior. É a referência mais confiável para localizar o sulco central na tomografia e na ressonância no plano axial — o \'sinal do bigode\' que o neurorradiologista procura.',
    relacoes: 'É um dos marcos mais confiáveis para localizar o sulco central na face medial da ressonância sagital.',
    clinica:
      'Na leitura da ressonância sagital, encontrar o ramo marginal — em forma de gancho ascendente — é o passo que permite identificar o lóbulo paracentral e, com ele, o córtex motor e sensitivo do membro inferior. Um tumor parassagital nessa região explica a paraparesia com liberação esfincteriana.',
    memoria:
      'Um "gancho" subindo na face medial: à frente dele está a perna do homúnculo; atrás, o pré-cúneo.',
    pontos: [
      'De que sulco o ramo marginal é continuação?',
      'Que estruturas ele separa?',
      'Por que ele é útil na leitura de ressonância sagital?',
    ],
  },
  {
    termos: ['Lóbulo Paracentral'],
    classe: 'snc',
    resumo: 'Continuação medial dos giros pré e pós-central, onde estão representados o membro inferior e o períneo.',
    localizacao: 'Face medial do hemisfério, entre o sulco do cíngulo, abaixo, e a margem superomedial, acima, à frente do ramo marginal.',
    funcao: 'Abriga a representação motora e sensitiva do membro inferior e a área de controle voluntário dos esfíncteres vesical e anal.',
    vascularizacao: 'Artéria cerebral anterior.',
    relacoes: 'Está a poucos milímetros da foice do cérebro e do seio sagital superior.',
    clinica:
      'Essa combinação — perna e esfíncteres num mesmo território irrigado pela cerebral anterior — explica dois quadros: o AVC de cerebral anterior, com paresia crural e incontinência, e o meningioma parassagital, que comprime os dois lados e produz paraparesia espástica com incontinência, quadro que simula lesão medular e é uma armadilha diagnóstica clássica.',
    memoria:
      'Perna e bexiga moram na face medial, juntas. Paraparesia com incontinência pode ser cabeça, não medula.',
    pontos: [
      'Que partes do corpo estão representadas no lóbulo paracentral?',
      'Que artéria o irriga?',
      'Por que um meningioma parassagital simula lesão medular?',
    ],
  },
  {
    termos: ['Sulco Paracentral'],
    classe: 'snc',
    resumo: 'Ramo ascendente do sulco do cíngulo que delimita à frente o lóbulo paracentral.',
    localizacao: 'Face medial do hemisfério, subindo do sulco do cíngulo à margem superior, à frente do lóbulo paracentral.',
    funcao: 'Separa o lóbulo paracentral do giro frontal superior medial.',
    vascularizacao:
      'Artéria cerebral anterior, pelos ramos calosomarginais. Delimita o lóbulo paracentral, onde estão representados o pé e a região perineal — e por isso o infarto de cerebral anterior produz paresia da perna com incontinência urinária.',
    relacoes: 'Faz par com o ramo marginal, que delimita o lóbulo por trás.',
    clinica:
      'Junto com o ramo marginal, forma as duas "balizas" do lóbulo paracentral na ressonância sagital — a referência mais prática para localizar o córtex da perna antes de uma ressecção parassagital.',
    memoria:
      'Dois ganchos subindo do sulco do cíngulo delimitam o lóbulo paracentral: o paracentral na frente e o marginal atrás.',
    pontos: [
      'Que estruturas o sulco paracentral separa?',
      'Que sulco faz par com ele?',
      'Que estrutura os dois delimitam?',
    ],
  },
  {
    termos: ['Pré-Cúneo'],
    classe: 'snc',
    resumo: 'Área quadrangular da face medial do lobo parietal, entre o ramo marginal e o sulco parietoccipital.',
    localizacao: 'Face medial do hemisfério, atrás do lóbulo paracentral e à frente do cúneo.',
    funcao:
      'Envolvido na memória episódica, na imagética visuoespacial e na autoconsciência. É um dos nós centrais da rede de modo padrão, ativa quando o cérebro está "em repouso" e voltado para si.',
    vascularizacao: 'Artéria cerebral posterior e ramos da cerebral anterior.',
    relacoes: 'Continua-se lateralmente com o lóbulo parietal superior.',
    clinica:
      'É uma das primeiras regiões a mostrar hipometabolismo no PET da doença de Alzheimer, junto com o cíngulo posterior — achado que hoje é usado como biomarcador de imagem no diagnóstico. Sua atividade também se reduz na anestesia geral e no sono profundo, o que o tornou uma das regiões mais estudadas na neurobiologia da consciência.',
    memoria:
      'Pré-cúneo é onde o cérebro "pensa em si mesmo". É a primeira luz que se apaga no Alzheimer e na anestesia.',
    pontos: [
      'Que funções o pré-cúneo desempenha?',
      'O que é a rede de modo padrão?',
      'Qual sua relevância no diagnóstico da doença de Alzheimer?',
    ],
  },
  {
    termos: ['Sulco Parietoccipital'],
    classe: 'snc',
    resumo: 'Sulco profundo da face medial que separa o lobo parietal do occipital.',
    localizacao: 'Face medial do hemisfério, correndo obliquamente de baixo e da frente para cima e para trás, encontrando o sulco calcarino.',
    funcao: 'Delimita o pré-cúneo, à frente, e o cúneo, atrás; é um dos poucos limites lobares reais e visíveis do encéfalo.',
    vascularizacao:
      'Artéria cerebral anterior e cerebral posterior, que se encontram no seu fundo, na face medial. Junto com o sulco calcarino, delimita a cunha (cuneus) — território visual da cerebral posterior.',
    relacoes: 'Encontra o sulco calcarino formando um Y deitado, com o cúneo entre os dois braços.',
    clinica:
      'É a referência da via interemisférica posterior para acesso à região pineal e ao esplênio. E o encontro com o calcarino é o marco para localizar o córtex visual primário na ressonância, essencial para interpretar defeitos de campo visual de origem cortical.',
    memoria:
      'Na face medial de trás há um "Y deitado": parietoccipital em cima, calcarino atrás, e o cúneo é a fatia entre eles.',
    pontos: [
      'Que lobos o sulco parietoccipital separa?',
      'Com que sulco ele se encontra e que forma produzem?',
      'Que estrutura fica entre os dois braços?',
    ],
  },
  /* ─────────────────── Lobo temporal e occipital ─────────────────── */
  {
    termos: ['Giro Temporal Superior'],
    classe: 'snc',
    resumo: 'Giro mais alto do lobo temporal, que contém o córtex auditivo primário na sua face superior.',
    localizacao: 'Entre o sulco lateral e o sulco temporal superior; sua face superior, escondida no sulco lateral, forma o plano temporal e os giros temporais transversos.',
    funcao:
      'Os giros temporais transversos (de Heschl) são o córtex auditivo primário (áreas 41 e 42), com organização tonotópica: sons graves representados lateralmente e agudos medialmente.',
    vascularizacao: 'Artéria cerebral média.',
    relacoes: 'A porção posterior, no hemisfério dominante, corresponde à área de Wernicke.',
    clinica:
      'Como cada orelha projeta para os dois hemisférios, a lesão unilateral do córtex auditivo não causa surdez — apenas dificuldade de localizar sons e de compreender fala em ambiente ruidoso. Surdez cortical exige lesão bilateral. É um princípio geral: vias com decussação parcial não produzem déficit unilateral completo.',
    memoria:
      'Ouvido esquerdo fala com os dois hemisférios. Por isso um AVC não deixa ninguém surdo de um ouvido.',
    pontos: [
      'Onde fica o córtex auditivo primário?',
      'Por que a lesão unilateral não causa surdez?',
      'O que é organização tonotópica?',
    ],
  },
  {
    termos: ['Sulco Temporal Superior'],
    classe: 'snc',
    resumo: 'Sulco longo e paralelo ao lateral, que separa os giros temporais superior e médio.',
    localizacao: 'Face lateral do lobo temporal, correndo paralelamente ao sulco lateral; sua extremidade posterior é contornada pelo giro angular.',
    funcao: 'Além de delimitar os giros, suas paredes contêm áreas envolvidas na percepção de movimento biológico, de faces e de vozes.',
    vascularizacao:
      'Ramos temporais da artéria cerebral média. Sua parede superior, no plano temporal, contém a área de Wernicke no hemisfério dominante — território do ramo inferior da cerebral média.',
    relacoes: 'Sua ponta posterior é abraçada pelo giro angular, assim como a ponta do sulco lateral é abraçada pelo supramarginal.',
    clinica:
      'A porção posterior do sulco temporal superior é hoje reconhecida como parte do sistema de cognição social, e sua alteração funcional está associada ao transtorno do espectro autista, com dificuldade na leitura de intenção pelo olhar e pela expressão facial.',
    memoria:
      'Dois sulcos que terminam em ponta e duas mãos que os abraçam: supramarginal pega o lateral, angular pega o temporal superior.',
    pontos: [
      'Que giros o sulco temporal superior separa?',
      'Que giro contorna sua extremidade posterior?',
      'Que funções sociais suas paredes desempenham?',
    ],
  },
  {
    termos: ['Giro Temporal Médio'],
    classe: 'snc',
    resumo: 'Giro intermediário do lobo temporal, envolvido no acesso ao significado das palavras.',
    localizacao: 'Entre os sulcos temporais superior e inferior, na face lateral do lobo temporal.',
    funcao: 'Sua porção posterior é um hub do processamento semântico: é onde o som de uma palavra encontra seu significado.',
    vascularizacao: 'Artéria cerebral média.',
    relacoes: 'Conecta-se ao lobo frontal pelo fascículo longitudinal superior e ao occipital pelo fascículo longitudinal inferior.',
    clinica:
      'Lesões dessa região no hemisfério dominante produzem afasia transcortical sensitiva ou déficits semânticos isolados, em que o paciente repete perfeitamente uma frase que não compreende — um sinal que demonstra a separação entre a via de repetição e a via do significado.',
    memoria:
      'Repete o que não entende: a via do som está intacta, a do significado não. Som e sentido são estradas diferentes.',
    pontos: [
      'Que função o giro temporal médio posterior exerce?',
      'O que é afasia transcortical sensitiva?',
      'Que fascículos conectam esse giro?',
    ],
  },
  {
    termos: ['Sulco Temporal Inferior'],
    classe: 'snc',
    resumo: 'Sulco que separa os giros temporais médio e inferior, frequentemente descontínuo.',
    localizacao: 'Face lateral do lobo temporal, abaixo do sulco temporal superior; costuma se apresentar em segmentos.',
    funcao: 'Delimita os dois giros; suas paredes participam do processamento visual de alto nível da via ventral.',
    vascularizacao:
      'Ramos temporais da artéria cerebral média em cima e da cerebral posterior embaixo — o sulco é, na prática, a fronteira entre os dois territórios na face lateral do lobo temporal.',
    relacoes: 'Contorna a margem inferolateral do hemisfério.',
    clinica:
      'A via ventral — do occipital ao temporal, a "via do quê" — passa por essa região. Sua lesão bilateral produz agnosia visual: o paciente vê o objeto, descreve sua forma, mas não sabe o que é, e o reconhece imediatamente ao tocá-lo ou ouvi-lo.',
    memoria:
      'Via dorsal é o "onde", via ventral é o "o quê". Cortou a ventral, o paciente vê e não reconhece.',
    pontos: [
      'Que giros esse sulco separa?',
      'O que é a via visual ventral?',
      'O que é agnosia visual?',
    ],
  },
  {
    termos: ['Giro Temporal Inferior'],
    classe: 'snc',
    resumo: 'Giro mais baixo da face lateral do lobo temporal, estação final da via visual ventral.',
    localizacao: 'Abaixo do sulco temporal inferior, estendendo-se até a margem inferolateral do hemisfério.',
    funcao: 'Processa a identidade visual dos objetos: forma, cor e reconhecimento categórico.',
    vascularizacao: 'Artérias cerebrais média e posterior.',
    relacoes: 'Continua-se, na face inferior, com os giros occipitotemporais.',
    clinica:
      'Sua lesão bilateral produz agnosia visual aperceptiva ou associativa, conforme a profundidade. A região adjacente, na face inferior, contém a área fusiforme das faces — cuja lesão bilateral causa prosopagnosia, a incapacidade de reconhecer rostos familiares, inclusive o próprio no espelho, com reconhecimento imediato pela voz.',
    memoria:
      'Não reconhece o rosto da esposa, mas a reconhece pela voz: prosopagnosia. O rosto é processado num lugar só.',
    pontos: [
      'Que função o giro temporal inferior exerce?',
      'O que é prosopagnosia?',
      'Como o paciente com prosopagnosia compensa?',
    ],
  },
  {
    termos: ['Área de Wernicke'],
    classe: 'snc',
    resumo: 'Região do giro temporal superior posterior do hemisfério dominante, responsável pela compreensão da linguagem.',
    localizacao: 'Porção posterior do giro temporal superior (área 22), estendendo-se ao giro supramarginal e angular, no hemisfério esquerdo em cerca de 95% dos destros.',
    funcao: 'Decodifica os sons da fala em significado; é também onde a linguagem é planejada antes de ser enviada a Broca pelo fascículo arqueado.',
    vascularizacao: 'Divisão inferior da artéria cerebral média.',
    relacoes: 'Conectada a Broca pelo fascículo arqueado e pela via ventral.',
    clinica:
      'A afasia de Wernicke é fluente e incompreensível: o paciente fala muito, com neologismos e parafasias, sem perceber que não faz sentido — a anosognosia é parte do quadro e explica por que ele não se frustra, ao contrário do afásico de Broca. Como a área está longe do córtex motor, costuma não haver hemiparesia, o que faz o quadro ser confundido com delirium ou psicose na emergência.',
    memoria:
      'Fala fluente, sem sentido, sem paresia e sem se dar conta. Muito paciente com Wernicke agudo vai parar na psiquiatria antes da neurologia.',
    pontos: [
      'Onde se localiza a área de Wernicke?',
      'Como se caracteriza a afasia de Wernicke?',
      'Por que ela costuma ser confundida com quadro psiquiátrico?',
    ],
  },
  {
    termos: ['Polo Frontal'],
    classe: 'snc',
    resumo: 'Extremidade anterior do hemisfério cerebral, correspondente ao córtex pré-frontal mais anterior.',
    localizacao: 'Ponta anterior do lobo frontal, apoiada sobre a fossa craniana anterior.',
    funcao: 'Área 10 de Brodmann, a maior região do córtex pré-frontal humano, envolvida em metacognição, planejamento de longo prazo e alternância entre objetivos.',
    vascularizacao:
      'Ramo polar frontal da artéria cerebral anterior e ramos orbitofrontais da cerebral média. Território de divisor de águas entre as duas — e por isso o polo frontal é uma das áreas que infartam na hipotensão sistêmica prolongada, sem oclusão de vaso nenhum.',
    relacoes: 'Repousa sobre o teto da órbita, superfície irregular do osso frontal.',
    clinica:
      'A superfície óssea irregular sob ele explica a contusão por golpe-contragolpe: nas desacelerações, os polos frontal e temporal se chocam contra saliências ósseas e são as regiões mais frequentemente contundidas no traumatismo cranioencefálico — independentemente do lado do impacto. É por isso que alterações de comportamento e de julgamento são sequela tão comum do TCE.',
    memoria:
      'Bateu atrás, machucou na frente. Os polos frontal e temporal são as vítimas preferenciais do golpe-contragolpe.',
    pontos: [
      'Que função o polo frontal desempenha?',
      'Por que ele é frequentemente contundido no TCE?',
      'Que sequelas isso produz?',
    ],
  },
  {
    termos: ['Polo Temporal'],
    classe: 'snc',
    resumo: 'Extremidade anterior do lobo temporal, apoiada na fossa craniana média.',
    localizacao: 'Ponta anterior do lobo temporal, acima da asa maior do esfenoide e da parte petrosa do temporal.',
    funcao: 'Área de convergência multimodal ligada ao sistema límbico, importante para memória semântica, emoção e reconhecimento de pessoas.',
    vascularizacao:
      'Ramo temporal anterior da artéria cerebral média e ramos da cerebral posterior. Sua vizinhança com a asa menor do esfenoide é o que o torna o alvo preferencial da contusão por golpe e contragolpe no traumatismo craniano.',
    relacoes: 'Vizinho imediato do unco e da amígdala, medialmente.',
    clinica:
      'É a segunda região mais contundida no TCE, e sua lesão bilateral, associada à das amígdalas, produz a síndrome de Klüver-Bucy: hiperoralidade, hipersexualidade, docilidade e agnosia visual. A atrofia do polo temporal esquerdo é a marca da demência semântica, em que o paciente perde o significado das palavras mantendo a fluência.',
    memoria:
      'Polo temporal é a "ponta" que bate no esfenoide. Lesão bilateral ali muda a pessoa inteira — Klüver-Bucy.',
    pontos: [
      'Que funções o polo temporal desempenha?',
      'O que é a síndrome de Klüver-Bucy?',
      'Que demência atrofia essa região?',
    ],
  },
  {
    termos: ['Polo Occipital'],
    classe: 'snc',
    resumo: 'Extremidade posterior do hemisfério, onde está representada a visão central.',
    localizacao: 'Ponta posterior do lobo occipital, acima da tenda do cerebelo.',
    funcao: 'Contém a representação macular do córtex visual primário, que ocupa desproporcionalmente a maior parte da área 17.',
    vascularizacao: 'Predominantemente artéria cerebral posterior, com contribuição frequente da cerebral média no polo.',
    relacoes: 'Continua-se, na face medial, com o córtex ao redor do sulco calcarino.',
    clinica:
      'Essa dupla irrigação é o que explica o "poupamento macular" na hemianopsia por oclusão da cerebral posterior: a visão central é preservada porque o polo recebe também sangue da cerebral média. É um achado que localiza a lesão no córtex, e não no trato óptico ou no quiasma.',
    memoria:
      'Hemianopsia que poupa a mácula é occipital, e é a cerebral média que salva a visão central.',
    pontos: [
      'Que parte do campo visual está representada no polo occipital?',
      'Que artérias o irrigam?',
      'O que é o poupamento macular e o que ele indica?',
    ],
  },
  {
    termos: ['Sulco Calcarino'],
    classe: 'snc',
    resumo: 'Sulco profundo da face medial do lobo occipital, em cujas paredes está o córtex visual primário.',
    localizacao: 'Face medial do lobo occipital, do polo occipital até encontrar o sulco parietoccipital em forma de Y.',
    funcao:
      'Suas margens abrigam a área 17 (V1). A representação é precisa: campo visual superior na parede inferior (giro lingual) e campo inferior na parede superior (cúneo), com a mácula no polo — tudo invertido e cruzado.',
    vascularizacao: 'Artéria calcarina, ramo da cerebral posterior.',
    relacoes: 'Recebe as radiações ópticas, que chegam pela alça de Meyer (temporal) e pelo trajeto parietal.',
    clinica:
      'Essa organização explica as quadrantanopsias: lesão da alça de Meyer, no lobo temporal, produz quadrantanopsia superior contralateral — a "torta no céu"; lesão parietal produz quadrantanopsia inferior. Um defeito de campo bem caracterizado localiza a lesão sem imagem.',
    memoria:
      'Temporal dá "torta no céu" (quadrante superior); parietal dá quadrante inferior. Campo de cima é processado embaixo, e vice-versa.',
    pontos: [
      'Como o campo visual está representado nas paredes do sulco calcarino?',
      'O que é a alça de Meyer?',
      'Que defeito campimétrico cada lesão produz?',
    ],
  },
  {
    termos: ['Cúneo'],
    classe: 'snc',
    resumo: 'Área triangular da face medial do occipital, entre o sulco parietoccipital e o calcarino.',
    localizacao: 'Face medial do lobo occipital, formando a parede superior do sulco calcarino.',
    funcao: 'Contém a representação do quadrante visual inferior contralateral.',
    vascularizacao: 'Artéria cerebral posterior.',
    relacoes: 'Abaixo do calcarino está o giro lingual, com a representação do campo superior.',
    clinica:
      'A lesão isolada do cúneo produz quadrantanopsia inferior contralateral. E, como toda a face medial do occipital é irrigada pela cerebral posterior, a oclusão desta produz hemianopsia homônima contralateral com poupamento macular — em geral sem qualquer déficit motor, o que faz muitos pacientes só perceberem o defeito ao bater em objetos ou ao ler.',
    memoria:
      '"Cúneo" é cunha. A cunha de cima vê o campo de baixo. Lembre que tudo é invertido no sistema visual.',
    pontos: [
      'Que quadrante visual o cúneo representa?',
      'Que estrutura fica abaixo do sulco calcarino?',
      'Que artéria irriga essa região?',
    ],
  },
  /* ─────────────────── Face inferior e sistema límbico ─────────────────── */
  {
    termos: ['Giro Do Cíngulo', 'Giro do Cíngulo'],
    classe: 'snc',
    resumo: 'Giro em arco que contorna o corpo caloso na face medial — o principal componente cortical do sistema límbico.',
    localizacao: 'Face medial do hemisfério, entre o sulco do cíngulo, acima, e o corpo caloso, abaixo.',
    funcao:
      'A porção anterior participa do processamento emocional, da motivação e da detecção de conflito; a posterior, da memória autobiográfica e da orientação espacial. Faz parte do circuito de Papez.',
    vascularizacao: 'Artéria cerebral anterior (artéria pericalosa).',
    relacoes: 'Continua-se posteriormente com o giro para-hipocampal pelo istmo do cíngulo.',
    clinica:
      'A herniação subfalcina é o deslocamento do giro do cíngulo sob a foice do cérebro, o tipo mais comum e mais precoce de herniação cerebral — pode comprimir a artéria cerebral anterior e produzir infarto secundário com paresia da perna contralateral. E a cingulotomia anterior já foi usada no tratamento de dor crônica e de transtorno obsessivo-compulsivo refratário.',
    memoria:
      'O cíngulo é o "cinturão" que abraça o corpo caloso. Quando o cérebro incha, é ele o primeiro a escorregar por baixo da foice.',
    pontos: [
      'Que funções as porções anterior e posterior do cíngulo exercem?',
      'O que é a herniação subfalcina?',
      'Que artéria pode ser comprimida nela?',
    ],
  },
  {
    termos: ['Sulco do Cíngulo'],
    classe: 'snc',
    resumo: 'Sulco que separa o giro do cíngulo dos giros frontais e do lóbulo paracentral na face medial.',
    localizacao: 'Face medial do hemisfério, arqueando-se acima do giro do cíngulo, paralelo ao corpo caloso.',
    funcao: 'Delimita o giro do cíngulo superiormente; emite os ramos paracentral e marginal.',
    vascularizacao:
      'Artéria calosomarginal, ramo da cerebral anterior, que corre dentro dele em quase toda a extensão. Separa o giro do cíngulo dos giros frontais mediais.',
    relacoes: 'É o marco que separa o córtex límbico do neocórtex na face medial.',
    clinica:
      'Sua identificação organiza a leitura da ressonância sagital: seguindo-o de frente para trás, encontram-se sucessivamente o ramo paracentral, o lóbulo paracentral e o ramo marginal — a sequência que permite localizar o córtex da perna e planejar acessos parassagitais.',
    memoria:
      'Um arco paralelo ao corpo caloso, com dois ganchos subindo. Os ganchos delimitam a perna do homúnculo.',
    pontos: [
      'Que estruturas o sulco do cíngulo separa?',
      'Que ramos ele emite?',
      'Como ele orienta a leitura da ressonância sagital?',
    ],
  },
  {
    termos: ['Tronco do Corpo Caloso'],
    classe: 'snc',
    resumo: 'Porção média e mais longa do corpo caloso, que conecta os córtices frontais e parietais dos dois hemisférios.',
    localizacao: 'Entre o joelho, à frente, e o esplênio, atrás, formando o teto dos ventrículos laterais.',
    funcao:
      'Contém a maior parte dos cerca de 200 milhões de axônios comissurais que unem os hemisférios. Suas fibras se irradiam lateralmente formando o corpo caloso propriamente dito e o teto ventricular.',
    vascularizacao: 'Artéria pericalosa, ramo da cerebral anterior.',
    relacoes: 'Acima dele estão o giro do cíngulo e a foice; abaixo, o septo pelúcido e o fórnix.',
    clinica:
      'A calosotomia — secção do corpo caloso — é feita em epilepsias refratárias com crises de queda, e produz a síndrome de desconexão inter-hemisférica: o paciente não consegue nomear um objeto colocado na mão esquerda, porque a informação chega ao hemisfério direito e não alcança a área da linguagem à esquerda. É a demonstração mais elegante da lateralização cerebral.',
    memoria:
      'Cortou o corpo caloso, os dois hemisférios param de conversar. A mão esquerda passa a saber coisas que a boca não consegue dizer.',
    pontos: [
      'Que regiões corticais o tronco do corpo caloso conecta?',
      'Que artéria o irriga?',
      'O que é a síndrome de desconexão inter-hemisférica?',
    ],
  },
  {
    termos: ['Joelho do Corpo Caloso'],
    classe: 'snc',
    resumo: 'Curvatura anterior do corpo caloso, cujas fibras formam o fórceps menor.',
    localizacao: 'Extremidade anterior do corpo caloso, curvando-se para baixo e para trás em direção ao rostro.',
    funcao: 'Suas fibras se irradiam para os lobos frontais formando o fórceps menor (frontal), que conecta os córtices pré-frontais dos dois lados.',
    vascularizacao:
      'Artéria pericalosa, ramo terminal da cerebral anterior, que o contorna, e ramos da comunicante anterior. É a curva anterior do corpo caloso, e suas fibras formam o fórceps menor, que une os dois lobos frontais.',
    relacoes: 'A artéria cerebral anterior o contorna para se tornar pericalosa.',
    clinica:
      'É a região atingida na esclerose múltipla com lesões perpendiculares ao corpo caloso — os "dedos de Dawson" —, achado altamente sugestivo na ressonância. Lesões do joelho e do rostro também aparecem na doença de Marchiafava-Bignami, associada ao alcoolismo crônico, com desconexão frontal e alteração de comportamento.',
    memoria:
      'Fórceps menor na frente (frontal), fórceps maior atrás (occipital). Duas pinças que apertam os polos do cérebro.',
    pontos: [
      'Que fibras partem do joelho do corpo caloso?',
      'Que regiões elas conectam?',
      'Que doenças acometem tipicamente essa região?',
    ],
  },
  {
    termos: ['Esplênio do Corpo Caloso'],
    classe: 'snc',
    resumo: 'Extremidade posterior e mais espessa do corpo caloso, cujas fibras formam o fórceps maior.',
    localizacao: 'Porção posterior do corpo caloso, acima da glândula pineal e do teto do mesencéfalo.',
    funcao: 'Suas fibras se irradiam para os lobos occipitais formando o fórceps maior, que conecta os córtices visuais dos dois hemisférios.',
    vascularizacao: 'Artéria pericalosa posterior, ramo da cerebral posterior — irrigação diferente do restante do corpo caloso.',
    relacoes: 'Está imediatamente acima da região pineal e do teto mesencefálico.',
    clinica:
      'A lesão do esplênio associada a lesão occipital esquerda produz a alexia sem agrafia: o paciente escreve normalmente e não consegue ler o que acabou de escrever — porque a informação visual, processada apenas à direita, não alcança a área da linguagem à esquerda. É a síndrome de desconexão mais elegante da neurologia clássica, descrita por Dejerine.',
    memoria:
      'Escreve e não consegue ler o que escreveu. A imagem da palavra fica presa no hemisfério direito.',
    pontos: [
      'Que fibras partem do esplênio?',
      'Que artéria o irriga?',
      'O que é alexia sem agrafia e como ela se explica?',
    ],
  },
  {
    termos: ['Rostro do Corpo Caloso'],
    classe: 'snc',
    resumo: 'Prolongamento afilado que desce do joelho até a lâmina terminal.',
    localizacao: 'Face inferior do joelho do corpo caloso, dirigindo-se para trás e para baixo até a comissura anterior e a lâmina terminal.',
    funcao: 'Conecta as porções orbitais e mediais dos lobos frontais; delimita, com o joelho, o limite anterior do septo pelúcido.',
    vascularizacao:
      'Ramos da artéria comunicante anterior e da cerebral anterior. É a porção mais fina e mais anterior, e um dos alvos da desmielinização na doença de Marchiafava-Bignami, associada ao alcoolismo.',
    relacoes: 'A lâmina terminal, atrás dele, marca a extremidade anterior do terceiro ventrículo e do tubo neural.',
    clinica:
      'A agenesia do corpo caloso costuma poupar ou afetar segmentos em ordem inversa ao desenvolvimento: como a formação vai do joelho para trás e o rostro é o último a se formar, ele é o primeiro a faltar nas agenesias parciais. Essa lógica de desenvolvimento permite datar aproximadamente a época da agressão embrionária pela extensão da malformação.',
    memoria:
      'O corpo caloso se forma do meio para as pontas, e o rostro por último. Falta o rostro? A agressão foi tardia.',
    pontos: [
      'Que regiões o rostro conecta?',
      'Qual sua relação com a lâmina terminal?',
      'Por que ele é o segmento mais frequentemente ausente nas agenesias parciais?',
    ],
  },
  {
    termos: ['Septo Pelúcido'],
    classe: 'snc',
    resumo: 'Lâmina dupla e translúcida que separa os cornos anteriores dos dois ventrículos laterais.',
    localizacao: 'Entre o corpo caloso, acima, e o fórnix, abaixo, na linha média.',
    funcao: 'Separa os ventrículos laterais; entre suas duas lâminas pode persistir uma cavidade — o cavum do septo pelúcido, presente em todos os fetos e em cerca de 15% dos adultos.',
    vascularizacao:
      'Ramos subcalosos da artéria cerebral anterior e da comunicante anterior. Lâmina dupla e fina, praticamente translúcida; sua ausência é marcador de displasia septo-óptica, e o cavum entre suas lâminas é achado normal em prematuros.',
    relacoes: 'Suas lâminas fazem parte da parede medial dos cornos frontais.',
    clinica:
      'A ausência do septo pelúcido é achado de imagem que exige investigação: associa-se à displasia septo-óptica (síndrome de De Morsier), com hipoplasia do nervo óptico e disfunção hipofisária, e à holoprosencefalia. Nos boxeadores, o cavum alargado é um dos marcadores de encefalopatia traumática crônica.',
    memoria:
      'Uma cortina fininha entre os dois ventrículos da frente. Se ela não existe, procure o nervo óptico e a hipófise.',
    pontos: [
      'Que estruturas o septo pelúcido separa?',
      'O que é o cavum do septo pelúcido?',
      'Que síndrome se associa à sua ausência?',
    ],
  },
  {
    termos: ['Fórnix'],
    classe: 'snc',
    resumo: 'Feixe arqueado de fibras que liga o hipocampo aos corpos mamilares — a principal via de saída do hipocampo.',
    localizacao:
      'Da fímbria do hipocampo, sobe como a perna do fórnix, curva-se sob o corpo caloso formando o corpo, e desce como coluna até o corpo mamilar; as duas metades se unem na comissura do fórnix.',
    funcao: 'Principal eferente do hipocampo, componente central do circuito de Papez: hipocampo → fórnix → corpo mamilar → trato mamilotalâmico → núcleo anterior do tálamo → giro do cíngulo → hipocampo.',
    vascularizacao:
      'Artéria comunicante posterior, artéria coroidea anterior e ramos da pericalosa posterior. É a principal via eferente do hipocampo, e sua secção bilateral — em cirurgias de terceiro ventrículo — produz amnésia anterógrada grave.',
    relacoes: 'Forma o assoalho do septo pelúcido e o limite do forame interventricular.',
    clinica:
      'Sua lesão produz amnésia anterógrada — a incapacidade de formar novas memórias declarativas —, mesma síndrome da lesão hipocampal bilateral. É também a estrutura lesada na síndrome de Korsakoff, junto com os corpos mamilares, na deficiência de tiamina do alcoolista. E é alvo de estimulação cerebral profunda em estudos sobre doença de Alzheimer.',
    memoria:
      'Circuito de Papez: hipocampo, fórnix, mamilar, tálamo, cíngulo e de volta. Quebrou o anel, a memória nova não se forma.',
    pontos: [
      'Que estruturas o fórnix conecta?',
      'Descreva o circuito de Papez.',
      'Que síndrome sua lesão produz?',
    ],
  },
  {
    termos: ['Comissura Anterior'],
    classe: 'snc',
    resumo: 'Pequeno feixe comissural que atravessa a linha média à frente das colunas do fórnix.',
    localizacao: 'Na parede anterior do terceiro ventrículo, à frente das colunas do fórnix e acima do quiasma óptico.',
    funcao: 'Conecta os lobos temporais dos dois lados, incluindo as amígdalas e os bulbos olfatórios, e parte dos córtices occipitais.',
    vascularizacao:
      'Artéria coroidea anterior e ramos estriados mediais da cerebral anterior. Conecta os lobos temporais e os bulbos olfatórios, e é a única comissura que permanece íntegra na agenesia de corpo caloso — o que preserva alguma transferência inter-hemisférica.',
    relacoes: 'É um marco de referência do plano CA–CP (comissura anterior–comissura posterior), padrão de coordenadas da neuroimagem.',
    clinica:
      'A linha entre as duas comissuras é o referencial estereotáxico universal: toda cirurgia funcional — estimulação cerebral profunda para Parkinson, talamotomias, palidotomias — é planejada nesse sistema de coordenadas. Um feixe pequeno que se tornou o eixo cartesiano do cérebro.',
    memoria:
      'A linha CA–CP é o "GPS" do cérebro. Toda coordenada de estereotaxia parte dela.',
    pontos: [
      'Que estruturas a comissura anterior conecta?',
      'O que é o plano CA–CP?',
      'Por que ele é essencial em neurocirurgia funcional?',
    ],
  },
  {
    termos: ['Forame Interventricular'],
    classe: 'ventriculo',
    resumo: 'Forame de Monro: comunicação entre cada ventrículo lateral e o terceiro ventrículo.',
    localizacao: 'Entre a coluna do fórnix, à frente, e o tubérculo anterior do tálamo, atrás.',
    funcao: 'Permite a passagem do líquor dos ventrículos laterais para o terceiro; o plexo corióideo é contínuo através dele.',
    relacoes: 'É o ponto de referência anatômico da veia cerebral interna e do plexo corióideo.',
    clinica:
      'Sua obstrução — por cisto coloide do terceiro ventrículo, classicamente — produz hidrocefalia obstrutiva com cefaleia posicional intensa e risco de morte súbita, um dos poucos tumores benignos que matam por mecânica pura. Se a obstrução é unilateral, o resultado é hidrocefalia de um ventrículo só, achado que aponta diretamente o nível do bloqueio.',
    memoria:
      'Forame de Monro é o "gargalo" entre os ventrículos laterais e o terceiro. Cisto coloide entope o gargalo e mata de repente.',
    pontos: [
      'Que estruturas delimitam o forame interventricular?',
      'Que estruturas o atravessam?',
      'O que é o cisto coloide e por que ele é perigoso?',
    ],
  },
  {
    termos: ['Giro Para-Hipocampal'],
    classe: 'snc',
    resumo: 'Giro da face medial do lobo temporal que envolve o hipocampo e serve de porta de entrada da memória.',
    localizacao: 'Entre o sulco do hipocampo, medialmente, e o sulco colateral, lateralmente, na face inferior do lobo temporal.',
    funcao:
      'Sua porção anterior é o córtex entorrinal, a principal via de entrada de informação para o hipocampo pela via perfurante. É também região central para a memória de contexto e de cenas.',
    vascularizacao: 'Artéria cerebral posterior.',
    relacoes: 'Sua extremidade anteromedial curva-se para trás formando o unco.',
    clinica:
      'O córtex entorrinal é o local onde os primeiros emaranhados neurofibrilares aparecem na doença de Alzheimer — estágio I de Braak, anos antes dos sintomas. Isso explica por que o déficit inicial é de memória episódica recente e por que a atrofia mesial temporal é o achado precoce na ressonância.',
    memoria:
      'A doença de Alzheimer começa na porta de entrada do hipocampo, não no hipocampo. Por isso o primeiro esquecimento é o do que acabou de acontecer.',
    pontos: [
      'O que é o córtex entorrinal e qual sua função?',
      'Onde começam as alterações do Alzheimer?',
      'Que sulcos delimitam o giro para-hipocampal?',
    ],
  },
  {
    termos: ['Sulco do Hipocampo'],
    classe: 'snc',
    resumo: 'Sulco entre o giro denteado e o giro para-hipocampal, marca do enrolamento do córtex hipocampal.',
    localizacao: 'Face medial do lobo temporal, entre o giro denteado e o subículo.',
    funcao: 'É o vestígio da invaginação que enrolou o arquicórtex sobre si mesmo durante o desenvolvimento, formando o hipocampo.',
    vascularizacao:
      'Artérias hipocampais, ramos da cerebral posterior, e artéria coroidea anterior. O hipocampo é território de irrigação terminal e de altíssima demanda metabólica — a combinação que o torna a região mais vulnerável do encéfalo à hipóxia e à hipoglicemia.',
    relacoes: 'Resíduos císticos ao longo dele são achado normal e comum na ressonância.',
    clinica:
      'Os remanescentes císticos do sulco hipocampal são um dos falsos positivos mais frequentes da ressonância de crânio — pequenos cistos alinhados na face medial do temporal, que não precisam de investigação. Reconhecê-los como variante normal poupa exames e ansiedade.',
    memoria:
      'É a "dobra" que sobrou de quando o córtex se enrolou para virar hipocampo. Cistinhos ali são normais.',
    pontos: [
      'O que o sulco do hipocampo representa embriologicamente?',
      'Que achado normal ele produz na ressonância?',
      'Que estruturas ele separa?',
    ],
  },
  {
    termos: ['Unco'],
    classe: 'snc',
    resumo: 'Extremidade anteromedial recurvada do giro para-hipocampal, vizinha imediata do mesencéfalo.',
    localizacao: 'Face medial do lobo temporal, projetando-se medialmente sobre a borda livre da tenda do cerebelo.',
    funcao: 'Contém parte do córtex olfatório primário e recobre a amígdala.',
    vascularizacao:
      'Artéria coroidea anterior e ramos da cerebral posterior. É a saliência que hernia sobre a incisura da tenda do cerebelo na hipertensão intracraniana, comprimindo o III par — daí a pupila fixa e dilatada ipsilateral ser o sinal de alarme da herniação uncal.',
    relacoes: 'Está imediatamente lateral ao mesencéfalo e ao nervo oculomotor, na incisura da tenda.',
    clinica:
      'A herniação uncal é a mais clássica e a mais temida: o unco desliza sobre a borda da tenda e comprime, na ordem, o III nervo (midríase fixa ipsilateral, o primeiro sinal), o pedúnculo cerebral (hemiparesia contralateral) e o tronco encefálico (rebaixamento e apneia). A compressão do pedúnculo contralateral contra a tenda produz hemiparesia do mesmo lado da lesão — o falso sinal localizatório de Kernohan.',
    memoria:
      'Pupila dilatada de um lado em paciente que rebaixa: herniação uncal até prova em contrário. É emergência de minutos.',
    pontos: [
      'Que estruturas o unco comprime na herniação, e em que ordem?',
      'Qual o primeiro sinal clínico da herniação uncal?',
      'O que é o entalhe de Kernohan?',
    ],
  },
  {
    termos: ['Sulco Colateral'],
    classe: 'snc',
    resumo: 'Sulco da face inferior do lobo temporal que separa o giro para-hipocampal do occipitotemporal medial.',
    localizacao: 'Face inferior do lobo temporal, lateralmente ao giro para-hipocampal, estendendo-se para trás até o lobo occipital.',
    funcao: 'Delimita o córtex para-hipocampal lateralmente; sua profundidade forma a eminência colateral no assoalho do corno temporal do ventrículo lateral.',
    vascularizacao:
      'Ramos temporais da artéria cerebral posterior. Delimita lateralmente o giro para-hipocampal, e sua profundidade é a referência da amigdalo-hipocampectomia na cirurgia de epilepsia.',
    relacoes: 'A eminência colateral é visível no interior do corno temporal.',
    clinica:
      'É a referência lateral da amígdalo-hipocampectomia seletiva, a cirurgia da epilepsia do lobo temporal mesial. O sulco delimita o quanto se pode ressecar sem invadir o córtex temporal lateral, preservando funções de linguagem no hemisfério dominante.',
    memoria:
      'É a "cerca" lateral do território hipocampal. O cirurgião não passa dela no lado dominante.',
    pontos: [
      'Que giros o sulco colateral separa?',
      'O que é a eminência colateral?',
      'Qual sua importância na cirurgia da epilepsia?',
    ],
  },
  {
    termos: ['Sulco Occipitotemporal'],
    classe: 'snc',
    resumo: 'Sulco da face inferior do hemisfério que separa os giros occipitotemporais medial e lateral.',
    localizacao: 'Face inferior dos lobos temporal e occipital, lateralmente ao sulco colateral.',
    funcao: 'Delimita o giro fusiforme (occipitotemporal medial) do giro occipitotemporal lateral.',
    vascularizacao:
      'Ramos temporais inferiores da artéria cerebral posterior, com contribuição da cerebral média na porção anterior.',
    relacoes: 'Costuma ser descontínuo e variável.',
    clinica:
      'É a referência para localizar o giro fusiforme, sede da área de reconhecimento de faces e da área visual da forma das palavras — cuja lesão à esquerda produz alexia pura. Um sulco pouco lembrado que emoldura duas das regiões mais estudadas da neurociência cognitiva.',
    memoria:
      'Entre o sulco colateral e o occipitotemporal está o giro fusiforme: o lugar onde o cérebro reconhece rostos e palavras.',
    pontos: [
      'Que giros esse sulco separa?',
      'Que funções o giro fusiforme desempenha?',
      'O que é alexia pura?',
    ],
  },
  {
    termos: ['Giro Occipitotemporal Medial'],
    classe: 'snc',
    resumo: 'O giro fusiforme: faixa da face inferior do hemisfério onde se reconhecem faces e palavras.',
    localizacao: 'Entre o sulco colateral, medialmente, e o occipitotemporal, lateralmente, na face inferior dos lobos temporal e occipital.',
    funcao:
      'Contém a área fusiforme das faces (à direita, predominantemente) e a área visual da forma das palavras (à esquerda) — dois módulos altamente especializados de reconhecimento visual.',
    vascularizacao: 'Artéria cerebral posterior.',
    relacoes: 'Sua porção posterior faz parte da via visual ventral.',
    clinica:
      'A lesão à direita produz prosopagnosia; à esquerda, alexia pura, em que o paciente escreve mas não lê. A especialização por hemisfério nesse mesmo giro é um dos exemplos mais didáticos de lateralização funcional do córtex.',
    memoria:
      'Mesmo giro, dois lados, duas funções: à direita reconhece rostos, à esquerda reconhece palavras.',
    pontos: [
      'Que áreas funcionais o giro fusiforme contém?',
      'Como a função difere entre os hemisférios?',
      'Que síndromes suas lesões produzem?',
    ],
  },
  {
    termos: ['Giro Occipitotemporal Lateral'],
    classe: 'snc',
    resumo: 'Giro mais lateral da face inferior do lobo temporal, contínuo com o giro temporal inferior.',
    localizacao: 'Lateralmente ao sulco occipitotemporal, na face inferior do lobo temporal, dobrando-se para a face lateral.',
    funcao: 'Participa do processamento visual de alto nível da via ventral, junto com o giro temporal inferior.',
    vascularizacao:
      'Artéria cerebral posterior, por seus ramos temporais inferiores. Corresponde ao giro fusiforme, cuja porção posterior abriga a área de reconhecimento facial — e cuja lesão bilateral produz prosopagnosia, a incapacidade de reconhecer rostos.',
    relacoes: 'É a transição entre a face inferior e a lateral do lobo temporal.',
    clinica:
      'Faz parte da região ressecada na lobectomia temporal anterior para epilepsia refratária, cirurgia com uma das melhores taxas de sucesso da neurologia — cerca de 60 a 70% de pacientes livres de crises. Conhecer os limites desses giros é o que define a extensão segura da ressecção.',
    memoria:
      'Na face de baixo do temporal, três faixas: para-hipocampal, fusiforme e occipitotemporal lateral. De medial para lateral.',
    pontos: [
      'Onde se localiza o giro occipitotemporal lateral?',
      'Que via visual ele integra?',
      'Que cirurgia envolve essa região?',
    ],
  },
  {
    termos: ['Giro Reto'],
    classe: 'snc',
    resumo: 'Giro mais medial da face orbital do lobo frontal, medial ao sulco olfatório.',
    localizacao: 'Face inferior do lobo frontal, entre a margem medial do hemisfério e o sulco olfatório.',
    funcao: 'Faz parte do córtex órbito-frontal medial, ligado à regulação emocional e ao processamento de recompensa.',
    vascularizacao: 'Artéria cerebral anterior.',
    relacoes: 'O bulbo e o trato olfatórios repousam no sulco olfatório, imediatamente lateral a ele.',
    clinica:
      'É a região deslocada e lesada pelos meningiomas da goteira olfatória, que crescem silenciosamente até produzir a síndrome de Foster-Kennedy: anosmia e atrofia óptica ipsilaterais com papiledema contralateral. Uma tríade que, quando presente, praticamente localiza o tumor.',
    memoria:
      'Perdeu o olfato sem gripe e sem trauma? Pense na base do frontal — pode ser tumor crescendo há anos.',
    pontos: [
      'Onde se localiza o giro reto?',
      'Que estrutura repousa no sulco olfatório?',
      'O que é a síndrome de Foster-Kennedy?',
    ],
  },
  {
    termos: ['Sulco Olfatório'],
    classe: 'snc',
    resumo: 'Sulco retilíneo da face orbital do lobo frontal que aloja o bulbo e o trato olfatórios.',
    localizacao: 'Face inferior do lobo frontal, entre o giro reto, medialmente, e os giros orbitários, lateralmente.',
    funcao: 'Aloja o bulbo olfatório, que recebe os filamentos do nervo olfatório vindos da lâmina cribiforme, e o trato olfatório.',
    vascularizacao:
      'Ramos orbitofrontais da artéria cerebral anterior. Aloja o trato olfatório, e sua profundidade separa o giro reto, medialmente, dos giros orbitais.',
    relacoes: 'Sua profundidade é usada como indicador da formação da lâmina cribiforme em imagens fetais.',
    clinica:
      'A avaliação da profundidade do sulco olfatório na ressonância é o método de imagem para o diagnóstico da síndrome de Kallmann — hipogonadismo hipogonadotrófico com anosmia, causado pela falha de migração dos neurônios de GnRH junto com os axônios olfatórios. Uma migração embrionária que, quando falha, produz duas doenças aparentemente sem relação.',
    memoria:
      'Anosmia com puberdade que não vem: Kallmann. Os neurônios do hormônio viajavam junto com os do cheiro e não chegaram.',
    pontos: [
      'Que estruturas o sulco olfatório aloja?',
      'O que é a síndrome de Kallmann?',
      'Por que anosmia e hipogonadismo aparecem juntos?',
    ],
  },
  {
    termos: ['Giros Orbitários'],
    classe: 'snc',
    resumo: 'Giros irregulares da face orbital do lobo frontal, dispostos em H em torno do sulco orbitário.',
    localizacao: 'Face inferior do lobo frontal, lateralmente ao sulco olfatório, apoiados no teto da órbita.',
    funcao: 'Compõem o córtex órbito-frontal, envolvido na avaliação de recompensa e punição, na tomada de decisão e na inibição de comportamento.',
    vascularizacao: 'Ramos orbitofrontais das artérias cerebrais anterior e média.',
    relacoes: 'Apoiam-se sobre o teto irregular da órbita.',
    clinica:
      'Essa superfície óssea irregular é a razão de os giros orbitários serem tão contundidos no TCE, o que produz a síndrome de desinibição frontal. Também é a base de contusões por golpe-contragolpe em quedas occipitais — uma pancada na nuca que muda a personalidade do paciente.',
    memoria:
      'O teto da órbita é rugoso como uma lixa. O cérebro desliza sobre ele no trauma e sai machucado.',
    pontos: [
      'Que funções o córtex órbito-frontal exerce?',
      'Por que ele é contundido com frequência no TCE?',
      'Como se dispõem os giros orbitários?',
    ],
  },
  {
    termos: ['Sulco Rinal'],
    classe: 'snc',
    resumo: 'Sulco curto na face medial do polo temporal, continuação anterior do sulco colateral.',
    localizacao: 'Extremidade anterior da face inferomedial do lobo temporal, à frente do sulco colateral.',
    funcao: 'Delimita lateralmente o córtex entorrinal, marcando a fronteira entre o alocórtex límbico e o neocórtex temporal.',
    vascularizacao:
      'Ramos da artéria cerebral posterior e da coroidea anterior. Delimita o córtex entorrinal, a porta de entrada do hipocampo — e a primeira região do córtex a acumular emaranhados neurofibrilares na doença de Alzheimer.',
    relacoes: 'Sua presença e extensão são variáveis.',
    clinica:
      'É a fronteira citoarquitetônica entre dois tipos de córtex, e por isso serve de referência para a delimitação do córtex entorrinal em estudos de neuroimagem quantitativa do Alzheimer — onde se mede a espessura cortical dessa região como marcador precoce da doença.',
    memoria:
      '"Rinal" vem de nariz: é o sulco que marca o limite do córtex olfatório e da memória. Fronteira entre o cérebro antigo e o novo.',
    pontos: [
      'Que estruturas o sulco rinal delimita?',
      'Que tipos de córtex ele separa?',
      'Qual seu uso em neuroimagem?',
    ],
  },
  /* ─────────────────── Núcleos da base e substância branca ─────────────────── */
  {
    termos: ['Cabeça do Núcleo Caudado'],
    classe: 'snc',
    resumo: 'Porção anterior e mais volumosa do caudado, que abaúla a parede lateral do corno frontal do ventrículo.',
    localizacao: 'Lateralmente ao corno anterior do ventrículo lateral, medialmente ao braço anterior da cápsula interna.',
    funcao:
      'Recebe projeções do córtex pré-frontal e do cíngulo e participa dos circuitos cognitivos e límbicos dos núcleos da base — mais do controle de comportamento e da seleção de ações do que do movimento propriamente dito.',
    vascularizacao: 'Artérias lenticuloestriadas mediais e artéria recorrente de Heubner, ramo da cerebral anterior.',
    relacoes: 'Continua-se com o corpo e a cauda do caudado, que acompanham a curva do ventrículo lateral.',
    clinica:
      'A atrofia da cabeça do caudado, com alargamento dos cornos frontais que dá o aspecto de "asa de morcego", é o achado radiológico clássico da doença de Huntington — e explica a combinação de coreia, alterações comportamentais e demência, já que o caudado participa de circuitos motores e cognitivos. O infarto da artéria de Heubner produz hemiparesia braquiofacial com componente disartrico.',
    memoria:
      'Ventrículos frontais alargados como asas de morcego e coreia: Huntington. O caudado sumiu e o ventrículo ocupou o espaço.',
    pontos: [
      'Que circuitos a cabeça do caudado integra?',
      'Que achado de imagem caracteriza a doença de Huntington?',
      'Que artéria a irriga?',
    ],
  },
  {
    termos: ['Putame'],
    classe: 'snc',
    resumo: 'Núcleo mais lateral dos núcleos da base, que forma com o globo pálido o núcleo lentiforme.',
    localizacao: 'Entre a cápsula externa, lateralmente, e o globo pálido, medialmente.',
    funcao:
      'É a principal porta de entrada motora dos núcleos da base: recebe projeções do córtex motor e sensitivo e participa do circuito que seleciona e ajusta os programas de movimento.',
    vascularizacao: 'Artérias lenticuloestriadas laterais, ramos perfurantes da cerebral média — vasos terminais, sem colaterais.',
    relacoes: 'Com o núcleo caudado forma o corpo estriado, conectados por pontes de substância cinzenta.',
    clinica:
      'As lenticuloestriadas são artérias terminais de pequeno calibre que saem em ângulo reto de um vaso de alta pressão — combinação que faz delas o sítio preferencial da hemorragia intracerebral hipertensiva e dos microaneurismas de Charcot-Bouchard. O hematoma putaminal é a hemorragia cerebral espontânea mais comum, com hemiparesia densa e desvio do olhar.',
    memoria:
      'Artéria fina saindo em ângulo reto de uma artéria grossa, sob pressão alta: é a receita da hemorragia putaminal.',
    pontos: [
      'Que estruturas formam o corpo estriado e o núcleo lentiforme?',
      'Que artérias irrigam o putame?',
      'Por que essa é a região mais comum de hemorragia hipertensiva?',
    ],
  },
  {
    termos: ['Globo Pálido Lateral'],
    classe: 'snc',
    resumo: 'Segmento externo do globo pálido, elo da via indireta dos núcleos da base.',
    localizacao: 'Medialmente ao putame e lateralmente ao segmento medial, separado dele pela lâmina medular medial.',
    funcao:
      'Recebe do estriado e projeta ao núcleo subtalâmico. É a estação intermediária da via indireta, que inibe movimentos indesejados — o "freio" do sistema motor.',
    vascularizacao:
      'Artérias lenticuloestriadas laterais, ramos da cerebral média. Território de perfurantes terminais, sem anastomose — e por isso um dos sítios preferenciais do infarto lacunar e da necrose por intoxicação por monóxido de carbono.',
    relacoes: 'Junto com o putame, forma o núcleo lentiforme.',
    clinica:
      'A via indireta é a chave para entender os distúrbios do movimento: se ela está hipofuncionante, aparecem movimentos involuntários (coreia, balismo); se hiperfuncionante, aparece bradicinesia — o quadro do parkinsonismo. A lesão do núcleo subtalâmico, seu alvo, produz hemibalismo contralateral, com movimentos amplos e violentos do membro.',
    memoria:
      'Via direta acelera, via indireta freia. Freio quebrado dá coreia; freio pisado demais dá Parkinson.',
    pontos: [
      'Qual o papel do globo pálido lateral na via indireta?',
      'O que acontece quando a via indireta é hipofuncionante?',
      'O que é hemibalismo?',
    ],
  },
  {
    termos: ['Globo Pálido Medial'],
    classe: 'snc',
    resumo: 'Segmento interno do globo pálido, principal via de saída dos núcleos da base para o tálamo.',
    localizacao: 'Porção mais medial do núcleo lentiforme, adjacente ao braço posterior da cápsula interna.',
    funcao:
      'É a saída final: projeta fibras inibitórias GABAérgicas ao tálamo motor. As vias direta e indireta convergem aqui, e o resultado dessa soma é o que libera ou bloqueia o movimento.',
    vascularizacao:
      'Artéria coroidea anterior, principalmente — e essa é a diferença que importa: os dois segmentos do globo pálido têm irrigação de artérias distintas, e a oclusão da coroidea anterior atinge o segmento medial, o alvo da estimulação cerebral profunda na distonia e na doença de Parkinson.',
    relacoes: 'Suas fibras eferentes formam a alça lenticular e o fascículo lenticular, que atravessam a cápsula interna.',
    clinica:
      'É um dos alvos consagrados da estimulação cerebral profunda na doença de Parkinson e o alvo de eleição na distonia generalizada, com resultados que transformam a vida do paciente. A palidotomia, sua lesão cirúrgica, foi por décadas o tratamento da rigidez parkinsoniana — e voltou com o ultrassom focalizado guiado por ressonância.',
    memoria:
      'O globo pálido medial é a "torneira" de saída. Fechá-la parcialmente é o que a estimulação profunda faz no Parkinson.',
    pontos: [
      'Qual o papel do globo pálido medial no circuito motor?',
      'Que neurotransmissor suas eferências usam?',
      'Que tratamentos têm nele o alvo?',
    ],
  },
  {
    termos: ['Claustro'],
    classe: 'snc',
    resumo: 'Fina lâmina de substância cinzenta entre a cápsula externa e a cápsula extrema.',
    localizacao: 'Entre o putame, medialmente, e o córtex da ínsula, lateralmente, separado de cada um por uma cápsula.',
    funcao:
      'Sua função permanece incerta. É a estrutura cerebral com maior densidade de conexões recíprocas com o córtex, o que levou à hipótese de que participe da integração de informações sensoriais e da geração de estados conscientes unificados.',
    vascularizacao:
      'Artéria coroidea anterior e ramos lenticuloestriados da cerebral média. Lâmina fina de substância cinzenta entre as cápsulas externa e extrema, com conexões recíprocas com quase todo o córtex — a razão de ter sido proposto como um dos substratos da consciência.',
    relacoes: 'Separado do putame pela cápsula externa e da ínsula pela cápsula extrema.',
    clinica:
      'É uma das poucas estruturas do encéfalo cuja função ainda é objeto de investigação básica. Relatos de estimulação elétrica do claustro humano descrevendo interrupção reversível da consciência, e sua descrição na encefalite límbica com anticorpos, mantiveram o interesse — mas nenhuma síndrome clínica clássica se atribui a ele isoladamente.',
    memoria:
      'Uma lâmina de neurônios ligada a todo o córtex, com função ainda desconhecida. Vale saber que ela existe e que ninguém sabe direito o que faz.',
    pontos: [
      'Onde se localiza o claustro?',
      'Que cápsulas o delimitam?',
      'Que hipótese funcional se atribui a ele?',
    ],
  },
  {
    termos: ['Cápsula Externa'],
    classe: 'snc',
    resumo: 'Lâmina de substância branca entre o putame e o claustro.',
    localizacao: 'Entre a face lateral do putame e a face medial do claustro.',
    funcao: 'Contém fibras corticoestriatais e parte do fascículo unciforme e do fascículo fronto-occipital inferior.',
    vascularizacao:
      'Artérias lenticuloestriadas laterais, ramos da cerebral média. Vasos perfurantes finos, de parede sem colateral, que são justamente os que se rompem na hemorragia hipertensiva e os que se ocluem no infarto lacunar.',
    relacoes: 'É a mais medial das duas lâminas brancas que separam putame e ínsula.',
    clinica:
      'É o plano atravessado na abordagem transinsular a hematomas e gliomas dos núcleos da base — uma via que preserva a cápsula interna, ao custo de atravessar a ínsula e seus vasos. Conhecer a sequência putame–cápsula externa–claustro–cápsula extrema–ínsula é o que torna essa via segura.',
    memoria:
      'De dentro para fora: putame, externa, claustro, extrema, ínsula. Uma sequência de cinco camadas que se decora em ordem.',
    pontos: [
      'Que estruturas a cápsula externa separa?',
      'Que fibras ela contém?',
      'Qual a sequência de camadas do putame à ínsula?',
    ],
  },
  {
    termos: ['Cápsula Extrema'],
    classe: 'snc',
    resumo: 'Lâmina de substância branca entre o claustro e o córtex da ínsula.',
    localizacao: 'A mais lateral das lâminas brancas dos núcleos da base, imediatamente sob o córtex insular.',
    funcao: 'Contém fibras que conectam a ínsula ao claustro e ao córtex temporal, incluindo parte da via ventral da linguagem.',
    vascularizacao:
      'Ramos da artéria coroidea anterior e lenticuloestriados da cerebral média. Separa o claustro da ínsula e conduz o fascículo fronto-occipital inferior, uma das vias ventrais da linguagem.',
    relacoes: 'Separa o claustro do córtex insular.',
    clinica:
      'A via ventral da linguagem, que passa pela cápsula extrema e pelo fascículo fascículo fronto-occipital inferior, é hoje reconhecida como a rota do processamento semântico — complementar ao fascículo arqueado, que faz a rota fonológica. É o correlato anatômico do modelo de dupla via da linguagem, que substituiu o modelo clássico de Wernicke-Geschwind.',
    memoria:
      'Duas vias para a linguagem: a dorsal (arqueado) carrega o som, a ventral (cápsula extrema) carrega o sentido.',
    pontos: [
      'Que estruturas a cápsula extrema separa?',
      'Que via da linguagem passa por ela?',
      'Como isso complementa o fascículo arqueado?',
    ],
  },
  {
    termos: ['Córtex da Ínsula'],
    classe: 'snc',
    resumo: 'Lobo escondido no fundo do sulco lateral, coberto pelos opérculos frontal, parietal e temporal.',
    localizacao: 'Fundo do sulco lateral, exposta apenas quando se afastam os opérculos; delimitada pelo sulco circular da ínsula.',
    funcao:
      'Integra a interocepção — a percepção do estado interno do corpo: dor, temperatura, fome, sede, dispneia, frequência cardíaca —, além do paladar e da consciência emocional. A ínsula anterior é um dos centros da rede de saliência.',
    vascularizacao: 'Ramos perfurantes da artéria cerebral média, que a atravessam para alcançar os núcleos da base.',
    relacoes: 'Está imediatamente lateral ao claustro e ao putame.',
    clinica:
      'Sua lesão está associada a alterações autonômicas cardíacas após AVC — arritmias e morte súbita são mais frequentes em infartos que envolvem a ínsula, sobretudo à direita. É também uma estrutura central na dependência química: lesões da ínsula em tabagistas podem abolir a vontade de fumar de forma abrupta e duradoura.',
    memoria:
      'A ínsula é onde o cérebro "sente o corpo por dentro". É por isso que sua lesão mexe com coração, náusea e vontade de fumar.',
    pontos: [
      'O que é interocepção e por que a ínsula é central nela?',
      'Que estruturas cobrem a ínsula?',
      'Que complicação sistêmica o AVC insular pode causar?',
    ],
  },
  {
    termos: ['Coroa Radiada'],
    classe: 'snc',
    resumo: 'Leque de fibras de projeção que se abre da cápsula interna em direção ao córtex.',
    localizacao: 'Substância branca do centro semioval, acima do nível dos núcleos da base, convergindo para a cápsula interna.',
    funcao:
      'Contém todas as fibras aferentes e eferentes que ligam o córtex ao restante do sistema nervoso: corticoespinais, corticobulbares, talamocorticais e corticopontinas, ainda dispersas antes de se compactarem na cápsula.',
    vascularizacao: 'Ramos perfurantes profundos e artérias medulares longas — território de fronteira vascular.',
    relacoes: 'Continua-se abaixo com a cápsula interna e acima com a substância branca subcortical.',
    clinica:
      'É território de fronteira vascular, e por isso sede das lesões de substância branca profunda associadas à doença de pequenos vasos, à hipertensão e ao envelhecimento — a "leucoaraiose" da tomografia, correlato de declínio cognitivo e de distúrbio da marcha. Por serem fibras ainda dispersas, um infarto pequeno na coroa radiada dá déficit mais restrito que o mesmo infarto na cápsula interna, onde tudo está compactado.',
    memoria:
      'Na coroa radiada as fibras estão espalhadas; na cápsula interna, apertadas. Mesmo tamanho de lesão, déficits muito diferentes.',
    pontos: [
      'Que fibras compõem a coroa radiada?',
      'Por que um infarto ali dá déficit menor que na cápsula interna?',
      'O que é leucoaraiose?',
    ],
  },
  {
    termos: ['Epitálamo'],
    classe: 'snc',
    resumo: 'Porção dorsal e posterior do diencéfalo, formada pela glândula pineal, pelas habênulas e pela comissura posterior.',
    localizacao: 'Teto posterior do terceiro ventrículo, acima do teto do mesencéfalo.',
    funcao:
      'A glândula pineal secreta melatonina em resposta ao escuro, sincronizando o ritmo circadiano; as habênulas conectam o sistema límbico aos núcleos monoaminérgicos do tronco e participam do processamento de recompensa negativa e da aversão.',
    vascularizacao: 'Ramos das artérias coroideas posteriores.',
    relacoes: 'Está imediatamente acima do colículo superior e da região pré-tectal.',
    clinica:
      'Um tumor da região pineal comprime o teto do mesencéfalo e produz a síndrome de Parinaud: paralisia do olhar vertical para cima, dissociação luz-perto das pupilas e nistagmo de convergência-retração. É um dos poucos quadros em que um sinal ocular localiza um tumor com precisão quase cirúrgica. A pineal calcificada é ainda referência de linha média na tomografia.',
    memoria:
      'Adolescente que não consegue olhar para cima: pense em tumor de pineal. Parinaud é o "sol poente" dos olhos.',
    pontos: [
      'Que estruturas compõem o epitálamo?',
      'Qual a função da glândula pineal?',
      'O que é a síndrome de Parinaud?',
    ],
  },
]
