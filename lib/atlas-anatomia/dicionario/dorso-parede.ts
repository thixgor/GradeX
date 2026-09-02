import type { EntradaDicionario } from './tipos'

/**
 * Dorso, parede torácica e abdominal, e a arquitetura do osso.
 *
 * O dorso é organizado em camadas, e a camada revela a função: os superficiais
 * movem o braço, os intermediários ajudam a respirar e só os profundos movem de
 * fato a coluna. Quem entende a estratificação não precisa decorar a lista.
 */
export const DORSO_PAREDE: EntradaDicionario[] = [
  /* ─────────────────── Dorso superficial ─────────────────── */
  {
    termos: ['Músculo Trapézio (rebatido)'],
    classe: 'musculo',
    resumo: 'Músculo triangular superficial do dorso, o único do grupo inervado por um nervo craniano.',
    localizacao: 'Da linha nucal superior, do ligamento nucal e dos processos espinhosos de C7 a T12 até a clavícula lateral, o acrômio e a espinha da escápula.',
    funcao:
      'Suas três porções agem em direções diferentes: a descendente eleva a escápula, a transversa a retrai e a ascendente a deprime. Juntas, as porções superior e inferior fazem a rotação superior da escápula, indispensável para elevar o braço acima da cabeça.',
    vascularizacao: 'Artéria cervical transversa (ramo superficial) e ramos das intercostais posteriores.',
    inervacao: 'Nervo acessório (XI par craniano), com contribuição sensitiva proprioceptiva de C3–C4.',
    relacoes: 'O nervo acessório desce superficialmente no trígono cervical posterior, coberto apenas por fáscia e pele.',
    clinica:
      'Essa superficialidade é a razão de o XI par ser o nervo mais lesado em biópsias de linfonodo cervical posterior — um procedimento pequeno com sequela grande: ombro caído, dor crônica e incapacidade de abduzir o braço acima de 90°. O trapézio é ainda o músculo que o examinador testa pedindo para "encolher os ombros contra resistência" no exame dos nervos cranianos.',
    memoria:
      'Encolher os ombros testa um nervo craniano, não um nervo espinal. É o XI par, e ele passa raso no pescoço.',
    pontos: [
      'Que nervo inerva o trapézio e por que isso é peculiar?',
      'Que ações as três porções realizam?',
      'Que procedimento comumente lesa esse nervo?',
    ],
  },
  {
    termos: ['Músculo Latíssimo do Dorso (rebatido)', 'Músculo Latíssimo do Dorso e Aponeurose Toracolombar'],
    classe: 'musculo',
    resumo: 'O músculo mais largo do corpo, que leva o braço para baixo e para trás.',
    localizacao:
      'Dos processos espinhosos de T7 ao sacro pela aponeurose toracolombar, da crista ilíaca e das últimas costelas, convergindo para o assoalho do sulco intertubercular do úmero.',
    funcao:
      'Estende, aduz e roda medialmente o braço. É o músculo da escalada e da remada: puxa o corpo para cima quando o braço está fixo. Suas fibras giram quase 180° antes da inserção, o que amplia a amplitude de encurtamento útil.',
    vascularizacao: 'Artéria toracodorsal, ramo da subescapular.',
    inervacao: 'Nervo toracodorsal (C6–C8), do fascículo posterior do plexo braquial.',
    relacoes: 'Sua borda lateral, com o oblíquo externo e a crista ilíaca, delimita o trígono lombar (de Petit).',
    clinica:
      'O pedículo toracodorsal, longo e constante, faz do latíssimo o retalho miocutâneo mais versátil da cirurgia reconstrutiva — usado em reconstrução mamária, cobertura de defeitos torácicos e transferência funcional para restaurar flexão do cotovelo. O trígono lombar é sítio de hérnia lombar, rara mas descrita.',
    memoria:
      'É o músculo do "coçar as costas" e do "puxar na barra". E é o retalho preferido do cirurgião plástico, porque tem um pedículo confiável.',
    pontos: [
      'Que ações o latíssimo do dorso realiza?',
      'Qual seu nervo e sua importância em cirurgia reconstrutiva?',
      'Que trígono ele delimita?',
    ],
  },
  {
    termos: ['Músculo Romboide Maior'],
    classe: 'musculo',
    resumo: 'Músculo retangular entre os espinhosos torácicos e a margem medial da escápula, que a retrai.',
    localizacao: 'Dos processos espinhosos de T2 a T5 até a margem medial da escápula, abaixo da espinha.',
    funcao: 'Retrai, eleva e roda inferiormente a escápula; suas fibras descem obliquamente, o que dá o vetor de rotação para baixo.',
    vascularizacao: 'Artéria escapular dorsal.',
    inervacao: 'Nervo dorsal da escápula (C5), que corre ao longo da margem medial da escápula.',
    relacoes: 'Está profundamente ao trapézio e superficialmente ao serrátil posterior superior.',
    clinica:
      'Sua fraqueza produz alamento escapular medial discreto, diferente do alado do serrátil: aqui a escápula se afasta da linha média em repouso e o alamento piora com a extensão do ombro, não com o empurrão contra a parede. A "dor interescapular" tão comum na postura de trabalho ao computador tem os romboides sobrecarregados como componente central.',
    memoria:
      'Serrátil empurra a escápula para a frente; romboide puxa para trás. Alado do serrátil piora empurrando a parede; do romboide, empurrando para trás.',
    pontos: [
      'Que ações o romboide maior realiza?',
      'Que nervo o inerva?',
      'Como diferenciar alamento por romboide e por serrátil?',
    ],
  },
  {
    termos: ['Músculo Romboide Menor'],
    classe: 'musculo',
    resumo: 'Fita muscular acima do romboide maior, do ligamento nucal à raiz da espinha da escápula.',
    localizacao: 'Da parte inferior do ligamento nucal e dos processos espinhosos de C7 e T1 até a margem medial da escápula, na altura da raiz da espinha.',
    funcao: 'Retrai e eleva a escápula, junto com o romboide maior; é frequentemente fundido ao maior.',
    vascularizacao: 'Artéria escapular dorsal.',
    inervacao: 'Nervo dorsal da escápula (C5).',
    relacoes: 'O nervo dorsal da escápula perfura o escaleno médio antes de descer sob os romboides.',
    clinica:
      'Essa perfuração do escaleno médio é o local de aprisionamento do nervo dorsal da escápula, causa reconhecida — e frequentemente esquecida — de dor interescapular crônica, que se confunde com dor facetária ou muscular. O bloqueio diagnóstico no ponto de perfuração é o que confirma a hipótese.',
    memoria:
      'Menor em cima, maior embaixo, ambos puxando a escápula em direção à coluna. Um nervo só para os dois: C5, dorsal da escápula.',
    pontos: [
      'Onde se insere o romboide menor?',
      'Que músculo o nervo dorsal da escápula perfura?',
      'Que quadro clínico esse aprisionamento produz?',
    ],
  },
  {
    termos: ['Músculo Levantador da Escápula'],
    classe: 'musculo',
    resumo: 'Músculo alongado que vai dos processos transversos cervicais ao ângulo superior da escápula.',
    localizacao: 'Dos tubérculos posteriores dos processos transversos de C1 a C4 até o ângulo superior e a parte superior da margem medial da escápula.',
    funcao: 'Eleva a escápula e a roda inferiormente; com a escápula fixa, inclina lateralmente o pescoço.',
    vascularizacao: 'Artérias cervical ascendente e escapular dorsal.',
    inervacao: 'Nervo dorsal da escápula (C5) e ramos diretos de C3–C4.',
    relacoes: 'Forma parte do assoalho do trígono cervical posterior; é atravessado pelo nervo acessório na sua superfície.',
    clinica:
      'É o músculo do "peso no ombro": encurtado em quase todo paciente com cervicalgia postural, com ponto-gatilho constante no ângulo superior da escápula. O padrão de dor referida — nuca, base do pescoço e borda medial da escápula — reproduz a queixa típica de quem trabalha muitas horas sentado.',
    memoria:
      'Se você já apertou o ponto no alto da escápula de alguém tenso e ela pulou, apertou o levantador da escápula.',
    pontos: [
      'De onde a onde vai o levantador da escápula?',
      'Que ações ele realiza?',
      'Por que ele é ponto-gatilho tão frequente?',
    ],
  },
  {
    termos: ['Escápula e Músculos Escapuloumerais (rebatidos)', 'Afastamento da Escápula e Músculos Escapuloumerais'],
    classe: 'musculo',
    resumo: 'Conjunto formado pela escápula e pelos músculos que a ligam ao úmero — o manguito e os redondos.',
    localizacao:
      'Face dorsal e costal da escápula: supraespinal, infraespinal, redondo menor e subescapular formam o manguito; o redondo maior e o deltoide completam o grupo escapuloumeral.',
    funcao:
      'Convertem o movimento da escápula em movimento do braço. A relação entre a rotação escapular e a elevação umeral — o ritmo escapuloumeral de 2:1 — é o que permite elevar o braço 180° com apenas 120° de movimento glenoumeral.',
    vascularizacao: 'Artérias supraescapular, circunflexa da escápula e circunflexas umerais.',
    inervacao: 'Nervos supraescapular, axilar, subescapulares e toracodorsal.',
    relacoes: 'A escápula rebatida na dissecção expõe o espaço escapulotorácico e a face costal.',
    clinica:
      'Compreender o ritmo escapuloumeral explica por que a discinesia escapular, uma alteração puramente de movimento, produz dor no ombro: o acrômio não se afasta a tempo, e o supraespinal é comprimido. Reabilitar a escápula é, muitas vezes, o tratamento da dor do ombro.',
    memoria:
      'Elevar o braço 180° é 120° de ombro mais 60° de escápula. Se a escápula não faz a parte dela, o tendão é esmagado.',
    pontos: [
      'Que músculos ligam a escápula ao úmero?',
      'O que é o ritmo escapuloumeral?',
      'Como a discinesia escapular causa dor no ombro?',
    ],
  },
  {
    termos: ['Músculo Infraespinhal'],
    classe: 'musculo',
    resumo: 'Componente posterior do manguito rotador e o principal rotador externo do ombro.',
    localizacao: 'Da fossa infraespinhal da escápula até a faceta média do tubérculo maior do úmero.',
    funcao: 'Roda lateralmente o braço, responde por cerca de 60% da força de rotação externa e deprime a cabeça umeral, mantendo-a centrada na elevação.',
    vascularizacao: 'Artérias supraescapular e circunflexa da escápula.',
    inervacao: 'Nervo supraescapular (C5–C6), que chega contornando a base da espinha da escápula.',
    relacoes: 'Coberto pelo deltoide e pelo trapézio; sua fossa é palpável no dorso.',
    clinica:
      'Sua atrofia isolada, visível como um afundamento abaixo da espinha da escápula, é o achado clássico da compressão do supraescapular na incisura espinoglenoidal, típica de jogadores de vôlei. Testa-se pela rotação externa resistida com o cotovelo junto ao corpo; a incapacidade de manter a mão afastada do abdome é o sinal do lag externo.',
    memoria:
      'Olhe as costas do paciente por trás: uma fossa cavada abaixo da espinha da escápula é infraespinhal atrofiado.',
    pontos: [
      'Qual a principal ação do infraespinhal?',
      'Que nervo o inerva e onde ele pode ser comprimido?',
      'Como se testa esse músculo?',
    ],
  },
  {
    termos: ['Músculo Esplênio da Cabeça'],
    classe: 'musculo',
    resumo: 'Músculo em faixa que vai do ligamento nucal ao mastoide, envolvendo os músculos profundos como uma bandagem.',
    localizacao: 'Da metade inferior do ligamento nucal e dos espinhosos de C7 a T3 até o processo mastoide e o terço lateral da linha nucal superior.',
    funcao: 'Bilateralmente estende a cabeça; unilateralmente, roda e inclina a cabeça para o mesmo lado — a mesma direção da rotação, ao contrário do esternocleidomastóideo.',
    vascularizacao: 'Artéria occipital e ramos da cervical profunda.',
    inervacao: 'Ramos posteriores dos nervos cervicais médios.',
    relacoes: 'Cobre os músculos eretores e semiespinais do pescoço; forma parte do assoalho do trígono cervical posterior.',
    clinica:
      'O par esplênio/esternocleidomastóideo é o exemplo mais didático de rotação: o esplênio gira a cabeça para o seu lado, o esternocleidomastóideo para o lado oposto. No torcicolo congênito, é a fibrose do esternocleidomastóideo que inclina a cabeça para o lado da lesão e roda o queixo para o lado contrário.',
    memoria:
      '"Splenion" é bandagem em grego: um músculo que enfaixa a nuca. E ele roda a cabeça para o próprio lado.',
    pontos: [
      'Que ações o esplênio da cabeça realiza?',
      'Como sua rotação difere do esternocleidomastóideo?',
      'Que nervos o inervam?',
    ],
  },
  {
    termos: ['Músculo Esplênio do Pescoço'],
    classe: 'musculo',
    resumo: 'Porção inferior do esplênio, que se insere nos processos transversos cervicais superiores.',
    localizacao: 'Dos processos espinhosos de T3 a T6 até os tubérculos posteriores dos processos transversos de C1 a C3.',
    funcao: 'Estende o pescoço bilateralmente e o roda para o mesmo lado unilateralmente, atuando junto com o esplênio da cabeça.',
    inervacao: 'Ramos posteriores dos nervos cervicais inferiores.',
    relacoes: 'Está profundamente ao serrátil posterior superior e superficialmente aos eretores da espinha.',
    clinica:
      'É um dos músculos mais frequentemente envolvidos na cefaleia cervicogênica, com ponto-gatilho que refere dor para o ápice da cabeça e para a órbita — uma dor de cabeça cuja origem está no pescoço e que não responde a analgésicos comuns.',
    memoria:
      'Esplênio da cabeça vai para o crânio; esplênio do pescoço para a cervical alta. Mesma bandagem, dois destinos.',
    pontos: [
      'Onde se insere o esplênio do pescoço?',
      'Que ações ele realiza?',
      'Que padrão de dor referida ele produz?',
    ],
  },
  {
    termos: ['Músculo Espinal do Tórax'],
    classe: 'musculo',
    resumo: 'Coluna mais medial do eretor da espinha, que corre de espinhoso a espinhoso.',
    localizacao: 'Dos processos espinhosos de T11 a L2 até os espinhosos torácicos superiores; é a mais medial das três colunas do eretor.',
    funcao: 'Estende a coluna vertebral; junto com o longuíssimo e o iliocostal, forma o eretor da espinha, que também controla excentricamente a flexão do tronco.',
    vascularizacao: 'Ramos dorsais das artérias intercostais posteriores e lombares.',
    inervacao: 'Ramos posteriores dos nervos espinais correspondentes.',
    relacoes: 'De medial para lateral: espinal, longuíssimo e iliocostal — a sequência das três colunas.',
    clinica:
      'O eretor da espinha é o alvo do bloqueio do plano do eretor (ESP block), uma das técnicas de analgesia regional mais difundidas dos últimos anos, com o anestésico depositado entre o músculo e o processo transverso. Sua função excêntrica explica ainda por que a lombalgia mecânica piora ao levantar peso com o tronco fletido: nessa posição o eretor trabalha com péssimo braço de alavanca.',
    memoria:
      '"I Love Spaghetti", de lateral para medial: Iliocostal, Longuíssimo, Espinal. Três colunas, uma função.',
    pontos: [
      'Quais são as três colunas do eretor da espinha, em ordem?',
      'Que nervos as inervam?',
      'O que é o bloqueio do plano do eretor da espinha?',
    ],
  },
  {
    termos: ['Músculo Serrátil Posterior Superior', 'Afastamento do Músculo Serrátil Posterior Superior'],
    classe: 'musculo',
    resumo: 'Fina lâmina muscular do dorso intermediário que eleva as costelas superiores.',
    localizacao: 'Do ligamento nucal e dos espinhosos de C7 a T3 até as bordas superiores da 2ª à 5ª costela.',
    funcao: 'Eleva as costelas superiores, auxiliando a inspiração. Pertence ao grupo intermediário do dorso — respiratório, e não postural.',
    vascularizacao: 'Artérias intercostais posteriores.',
    inervacao: 'Nervos intercostais superiores (T2–T5) — ramos anteriores, e não posteriores, o que confirma que ele não é um músculo próprio do dorso.',
    relacoes: 'Está entre os romboides, acima, e os eretores da espinha, abaixo.',
    clinica:
      'A inervação por ramos anteriores é a prova anatômica de que os serráteis posteriores não são músculos "verdadeiros" do dorso: eles migraram para lá. Clinicamente têm importância modesta, mas são referência de camada nas abordagens posteriores do tórax.',
    memoria:
      'Se é inervado por ramo anterior, não é músculo próprio do dorso. É a regra que separa os três grupos.',
    pontos: [
      'A que grupo do dorso pertence o serrátil posterior superior?',
      'Que nervos o inervam e por que isso importa?',
      'Qual sua função?',
    ],
  },
  {
    termos: ['Músculo Serrátil Posterior Inferior', 'Afastamento do Músculo Serrátil Posterior Inferior'],
    classe: 'musculo',
    resumo: 'Lâmina muscular que abaixa as últimas costelas, resistindo à tração do diafragma.',
    localizacao: 'Dos processos espinhosos de T11 a L2, pela aponeurose toracolombar, até as bordas inferiores da 9ª à 12ª costela.',
    funcao: 'Abaixa e estabiliza as últimas costelas durante a inspiração, impedindo que o diafragma as puxe para cima.',
    inervacao: 'Nervos intercostais inferiores (T9–T12), ramos anteriores.',
    relacoes: 'Sua aponeurose funde-se com a lâmina posterior da fáscia toracolombar.',
    clinica:
      'A síndrome do serrátil posterior inferior é causa reconhecida de dor lombar alta e de dor referida na parede lateral do abdome, frequentemente confundida com dor renal ou visceral — e o que a distingue é a reprodução da dor à palpação da inserção costal.',
    memoria:
      'Um puxa as costelas para cima na inspiração, o outro segura as de baixo. Ambos são "músculos de respirar disfarçados de músculos do dorso".',
    pontos: [
      'Qual a função do serrátil posterior inferior?',
      'Por que ele é considerado músculo respiratório?',
      'Que quadro doloroso ele pode causar?',
    ],
  },
  {
    termos: ['Aponeurose Toracolombar'],
    classe: 'fascia',
    resumo: 'Lâmina fibrosa espessa que envolve os músculos profundos do dorso e liga o tronco superior ao inferior.',
    localizacao:
      'Da região sacral à cervical, em três lâminas na região lombar: posterior (sobre os eretores), média (entre eretores e quadrado do lombo) e anterior (sobre o quadrado do lombo).',
    funcao:
      'É o elo de transmissão de força entre o latíssimo do dorso de um lado e o glúteo máximo do lado oposto — a chamada cadeia oblíqua posterior, que transfere força da marcha e do arremesso. Também funciona como cinta hidráulica: a contração dos músculos aumenta a pressão dentro do compartimento e estabiliza a coluna lombar.',
    inervacao: 'Ricamente inervada por ramos posteriores, com alta densidade de nociceptores na lâmina posterior.',
    relacoes: 'O transverso do abdome e o oblíquo interno se inserem na sua lâmina média, ligando parede abdominal e coluna.',
    clinica:
      'Essa inervação abundante faz da fáscia toracolombar uma fonte real de dor lombar inespecífica, hoje reconhecida como origem plausível em pacientes sem alteração de imagem. A conexão com o transverso do abdome é a base fisiológica dos programas de estabilização do core: contrair o transverso tensiona a fáscia e estabiliza a coluna.',
    memoria:
      'É a "camisa de força" do dorso: latíssimo de um lado, glúteo do outro, e no meio uma lona que transmite força cruzada.',
    pontos: [
      'Quais são as três lâminas da fáscia toracolombar?',
      'Que músculos ela conecta em cadeia cruzada?',
      'Por que ela pode ser fonte de dor lombar?',
    ],
  },
  /* ─────────────────── Parede torácica ─────────────────── */
  {
    termos: ['Porcão Clavicular do Músculo Peitoral Maior'],
    classe: 'musculo',
    resumo: 'Porção superior do peitoral maior, que nasce da clavícula e flete o braço.',
    localizacao: 'Da metade medial da clavícula até o lábio lateral do sulco intertubercular do úmero.',
    funcao: 'Flete e aduz horizontalmente o braço; é a porção que atua ao empurrar algo para cima e para a frente, como no supino inclinado.',
    vascularizacao: 'Ramo peitoral da artéria toracoacromial.',
    inervacao: 'Nervo peitoral lateral (C5–C7), do fascículo lateral do plexo braquial.',
    relacoes: 'Com o deltoide, delimita o sulco deltopeitoral, onde corre a veia cefálica.',
    clinica:
      'A separação de inervação das duas porções — lateral para a clavicular, medial para a esternocostal — permite que uma seja preservada quando a outra é transferida. Na agenesia da porção esternocostal (síndrome de Poland), a clavicular costuma estar presente, e é a assimetria da prega axilar anterior que denuncia o diagnóstico.',
    memoria:
      'Duas porções, dois nervos, dois vetores: a de cima empurra para cima, a de baixo puxa para baixo. Elas podem trabalhar uma contra a outra.',
    pontos: [
      'Qual a ação da porção clavicular do peitoral maior?',
      'Que nervo a inerva?',
      'O que é a síndrome de Poland?',
    ],
  },
  {
    termos: ['Porçâo Esternocostal do Músculo Peitoral Maior', 'Músculo Peitoral Maior (rebatido)'],
    classe: 'musculo',
    resumo: 'Porção principal do peitoral maior, que nasce do esterno e das cartilagens costais.',
    localizacao: 'Do esterno e das seis primeiras cartilagens costais até o lábio lateral do sulco intertubercular, com as fibras inferiores inserindo-se mais alto que as superiores.',
    funcao:
      'Aduz e roda medialmente o braço; a partir da flexão, também o estende com força. Essa torção de 180° das fibras na inserção é o que permite ao músculo manter tensão em todo o arco de movimento.',
    vascularizacao: 'Ramo peitoral da toracoacromial e perfurantes da torácica interna.',
    inervacao: 'Nervo peitoral medial (C8–T1), que atravessa o peitoral menor.',
    relacoes: 'Forma a parede anterior da axila; sua borda inferior é a prega axilar anterior.',
    clinica:
      'A rotura do peitoral maior ocorre quase sempre na porção esternocostal, na fase excêntrica do supino com carga máxima, e produz equimose, defeito na prega axilar e perda de força de adução — lesão que se tornou comum com a musculação e cujo reparo cirúrgico dá resultados muito melhores que o tratamento conservador em atletas.',
    memoria:
      'A prega da axila que você aperta entre os dedos é a borda do peitoral maior. Se ela sumiu de um lado, o músculo rompeu.',
    pontos: [
      'Que ações a porção esternocostal realiza?',
      'Que nervo a inerva?',
      'Em que gesto ocorre tipicamente sua rotura?',
    ],
  },
  {
    termos: ['Músculo Peitoral Menor'],
    classe: 'musculo',
    resumo: 'Músculo triangular profundo que puxa a escápula para a frente e para baixo, e que divide a artéria axilar.',
    localizacao: 'Da 3ª à 5ª costela até o processo coracoide da escápula.',
    funcao: 'Protrai e roda inferiormente a escápula, e a estabiliza contra o gradil. Com a escápula fixa, eleva as costelas na inspiração forçada.',
    vascularizacao: 'Ramo peitoral da toracoacromial.',
    inervacao: 'Nervo peitoral medial (C8–T1), que o perfura para alcançar o peitoral maior.',
    relacoes:
      'É a referência que divide a artéria axilar em três partes: a primeira é medial ao músculo, a segunda está atrás dele e a terceira é lateral. Os ramos seguem a numeração: 1 ramo, 2 ramos, 3 ramos.',
    clinica:
      'Sua contratura é a causa da síndrome do desfiladeiro por compressão retropeitoral, com sintomas que pioram ao elevar o braço. E a regra "1-2-3" da artéria axilar organiza a descrição da anatomia da axila em cirurgias oncológicas e vasculares. Além disso, o encurtamento do peitoral menor é fator de discinesia escapular e de dor no ombro.',
    memoria:
      'Peitoral menor divide a axilar em três: 1 ramo antes, 2 atrás, 3 depois. É a régua da axila.',
    pontos: [
      'Como o peitoral menor divide a artéria axilar?',
      'Que ações ele realiza sobre a escápula?',
      'Que síndrome sua contratura pode causar?',
    ],
  },
  {
    termos: ['Músculo Subclávio'],
    classe: 'musculo',
    resumo: 'Pequeno músculo entre a primeira costela e a clavícula, que serve de amortecedor dos vasos subclávios.',
    localizacao: 'Da junção da 1ª costela com sua cartilagem até o sulco na face inferior da clavícula.',
    funcao: 'Deprime e estabiliza a clavícula; sua função protetora é mais relevante que a motora — ele é o colchão entre a clavícula e os vasos subclávios.',
    vascularizacao: 'Ramo clavicular da toracoacromial.',
    inervacao: 'Nervo para o subclávio (C5–C6), que frequentemente origina o nervo frênico acessório.',
    relacoes: 'A veia subclávia corre imediatamente abaixo dele.',
    clinica:
      'O nervo frênico acessório, presente em cerca de 30% das pessoas e originado aqui, é a explicação de paralisias diafragmáticas incompletas após lesão do frênico principal — e uma armadilha em cirurgias cervicais. O músculo é ainda o anteparo que evita lesão vascular nas fraturas de clavícula.',
    memoria:
      'Um músculo pequeno com dois papéis grandes: colchão dos vasos e berço de um nervo frênico extra.',
    pontos: [
      'Qual a principal função protetora do subclávio?',
      'Que nervo acessório ele frequentemente origina?',
      'Que estrutura corre imediatamente abaixo dele?',
    ],
  },
  {
    termos: ['Músculos Intercostais Externos'],
    classe: 'musculo',
    resumo: 'Camada mais superficial dos intercostais, com fibras oblíquas para baixo e para a frente.',
    localizacao:
      'Dos tubérculos costais até a junção costocondral, onde continuam como a membrana intercostal anterior. As fibras correm de cima e de trás para baixo e para a frente — "as mãos nos bolsos".',
    funcao: 'Elevam as costelas na inspiração, aumentando os diâmetros anteroposterior e transverso do tórax.',
    vascularizacao: 'Artérias intercostais posteriores e anteriores.',
    inervacao: 'Nervos intercostais correspondentes.',
    relacoes: 'Continuam-se, na parede abdominal, com o músculo oblíquo externo — mesma direção de fibras.',
    clinica:
      'Reconhecer a direção das fibras é o que orienta a dissecção na toracotomia e explica por que os intercostais externos são inspiratórios e os internos, expiratórios: a direção da fibra determina o vetor. É também a razão de a musculatura acessória "puxar" o tórax de modo visível na insuficiência respiratória.',
    memoria:
      'Externos: mãos nos bolsos, fibras para baixo e para a frente, e inspiram. Internos: fibras cruzadas, e expiram.',
    pontos: [
      'Qual a direção das fibras dos intercostais externos?',
      'Que ação respiratória eles realizam?',
      'Com que músculo abdominal eles se continuam?',
    ],
  },
  {
    termos: ['Músculos Intercostais Internos'],
    classe: 'musculo',
    resumo: 'Camada média dos intercostais, com fibras cruzadas em relação aos externos, ativa na expiração forçada.',
    localizacao: 'Do esterno até os ângulos das costelas, onde continuam como a membrana intercostal posterior; fibras de baixo e de trás para cima e para a frente.',
    funcao:
      'A porção interóssea abaixa as costelas na expiração forçada; a porção intercondral, entre as cartilagens, na verdade eleva as costelas e é inspiratória — um detalhe que costuma escapar.',
    inervacao: 'Nervos intercostais correspondentes.',
    relacoes: 'O feixe intercostal (veia, artéria, nervo) corre entre o intercostal interno e o íntimo, protegido no sulco costal.',
    clinica:
      'Essa posição do feixe entre as duas camadas mais profundas é a base do bloqueio intercostal: o anestésico é depositado no plano entre o intercostal interno e o íntimo, junto ao ângulo da costela. A mesma anatomia explica por que a punção deve raspar a borda superior da costela inferior.',
    memoria:
      'Externo inspira, interno expira — mas a parte entre as cartilagens do interno inspira. É a exceção que a prova adora.',
    pontos: [
      'Qual a direção das fibras dos intercostais internos?',
      'Qual a exceção da porção intercondral?',
      'Entre que camadas corre o feixe intercostal?',
    ],
  },
  /* ─────────────────── Parede abdominal ─────────────────── */
  {
    termos: ['Musculatura da Parede Abdominal'],
    classe: 'musculo',
    resumo: 'Cinco pares de músculos em camadas cruzadas que contêm as vísceras e movem o tronco.',
    localizacao:
      'Ântero-lateralmente, de fora para dentro: oblíquo externo (fibras para baixo e para dentro), oblíquo interno (para cima e para dentro) e transverso do abdome (horizontais). Na linha média, os retos do abdome dentro de suas bainhas, e o piramidal.',
    funcao:
      'A disposição em três camadas com fibras cruzadas é uma solução de engenharia: como o compensado de madeira, resiste a tração em qualquer direção. Juntos, aumentam a pressão intra-abdominal para a expiração forçada, a defecação, a micção e o parto, e flexionam e rodam o tronco.',
    vascularizacao: 'Artérias epigástricas superior e inferior, intercostais inferiores, subcostal e lombares.',
    inervacao: 'Nervos intercostais T7–T11, subcostal (T12), ílio-hipogástrico e ilioinguinal (L1).',
    relacoes: 'A linha alba, na linha média, é o entrecruzamento das aponeuroses dos três músculos laterais.',
    clinica:
      'A linha alba é avascular e por isso é a via de acesso da laparotomia mediana — rápida, extensível e com pouco sangramento, ao custo de maior taxa de hérnia incisional. A diástase dos retos, comum no pós-parto, é o alargamento dessa linha, e não uma hérnia. O nível de inervação explica a dor referida: irritação do peritônio parietal em T10 dói ao redor do umbigo.',
    memoria:
      'Três camadas com fibras cruzadas, como compensado. É o que faz a parede resistir a pressão vinda de qualquer direção.',
    pontos: [
      'Qual a direção das fibras de cada camada da parede abdominal?',
      'Por que a linha alba é a via da laparotomia mediana?',
      'Que nervos inervam a parede abdominal?',
    ],
  },
  {
    termos: ['Músculo Reto do Abdome - Ventre', 'Ventre Muscular'],
    classe: 'musculo',
    resumo: 'Faixa muscular vertical na linha média do abdome, dividida por intersecções tendíneas.',
    localizacao: 'Do púbis à 5ª, 6ª e 7ª cartilagens costais e ao processo xifoide, dentro da bainha do reto.',
    funcao:
      'Flete o tronco e aumenta a pressão intra-abdominal. As intersecções tendíneas — geralmente três — dividem o ventre em segmentos e são o que desenha o "tanquinho"; elas aderem à lâmina anterior da bainha, mas não à posterior.',
    vascularizacao: 'Artérias epigástricas superior (da torácica interna) e inferior (da ilíaca externa), que se anastomosam dentro do músculo.',
    inervacao: 'Nervos intercostais T7 a T12, entrando pela borda lateral.',
    relacoes: 'A linha arqueada, cerca de um terço do caminho entre o umbigo e o púbis, marca o fim da lâmina posterior da bainha.',
    clinica:
      'A anastomose epigástrica dentro do reto é uma via colateral importante na coartação da aorta e no acesso cirúrgico. Abaixo da linha arqueada, o músculo repousa direto sobre a fáscia transversal, o que torna o hematoma do reto — em anticoagulados ou após tosse intensa — capaz de se difundir e simular abdome agudo. E é justamente o pedículo epigástrico inferior que sustenta o retalho TRAM na reconstrução mamária.',
    memoria:
      'Acima da linha arqueada, a bainha envolve o músculo dos dois lados; abaixo, só pela frente. É por isso que o sangue "escapa" na parte de baixo.',
    pontos: [
      'Que artérias irrigam o reto do abdome?',
      'O que é a linha arqueada e qual sua consequência clínica?',
      'Por que as intersecções tendíneas desenham o "tanquinho"?',
    ],
  },
  {
    termos: ['Músculo Reto do Abdome - Tendão'],
    classe: 'tendao',
    resumo: 'As intersecções tendíneas e a inserção púbica do reto do abdome.',
    localizacao: 'Três a quatro faixas fibrosas transversais no ventre — uma no umbigo, uma no xifoide e uma entre elas — e a inserção tendínea na crista e na sínfise púbica.',
    funcao:
      'As intersecções impedem que o músculo se "enrole" ao contrair, mantendo-o achatado contra a parede, e aderem à lâmina anterior da bainha, compartimentando eventuais hematomas na parte alta.',
    relacoes: 'A inserção púbica funde-se com o ligamento inguinal e com a aponeurose do oblíquo externo.',
    clinica:
      'Essa inserção compartilhada é onde se instala a pubalgia do atleta ("hérnia do esporte"): a tração conflitante entre o reto do abdome, que puxa para cima, e os adutores, que puxam para baixo, sobre um mesmo ponto do púbis. Entender que se trata de um conflito de vetores, e não de uma hérnia, é o que orienta o tratamento com reabilitação antes de cirurgia.',
    memoria:
      'No púbis, o reto do abdome puxa para cima e os adutores para baixo. É um cabo de guerra num osso só — e é aí que dói no atleta.',
    pontos: [
      'Qual a função das intersecções tendíneas?',
      'Por que hematomas altos do reto ficam contidos?',
      'O que é a pubalgia do atleta?',
    ],
  },
  /* ─────────────────── Músculos da mastigação ─────────────────── */
  {
    termos: ['Músculo Pterigoideo Medial'],
    classe: 'musculo',
    resumo: 'Músculo espesso que sobe da fossa pterigóidea ao ângulo da mandíbula, espelhando o masseter por dentro.',
    localizacao: 'Da fossa pterigóidea, na face medial da lâmina lateral do pterigoide, até a face medial do ângulo da mandíbula.',
    funcao: 'Eleva e protrai a mandíbula; unilateralmente, produz o movimento de lateralidade para o lado oposto. Com o masseter, forma a alça pterigomassetérica que abraça o ângulo.',
    vascularizacao: 'Ramos da artéria maxilar.',
    inervacao: 'Nervo pterigóideo medial, ramo do V3.',
    relacoes: 'Sua face medial está em contato com o espaço parafaríngeo; o nervo alveolar inferior e o lingual descem entre ele e o ramo da mandíbula.',
    clinica:
      'Esse trajeto entre músculo e osso é o espaço pterigomandibular, alvo do bloqueio do nervo alveolar inferior e sede de abscessos odontogênicos com trismo intenso. O trismo é justamente o espasmo desse músculo — e ele é o motivo de o paciente com infecção do terceiro molar não conseguir abrir a boca.',
    memoria:
      'Masseter por fora, pterigóideo medial por dentro: um sanduíche de músculo com a mandíbula no meio. Os dois elevam.',
    pontos: [
      'Qual a ação do pterigóideo medial?',
      'Que espaço fica entre ele e o ramo da mandíbula?',
      'Por que infecções ali causam trismo?',
    ],
  },
  {
    termos: ['Músculo Pterigoideo Lateral'],
    classe: 'musculo',
    resumo: 'Único músculo que abre a boca ativamente, puxando o côndilo e o disco da ATM para a frente.',
    localizacao:
      'Duas cabeças: a superior, da asa maior do esfenoide, insere-se no disco e na cápsula da ATM; a inferior, da lâmina lateral do pterigoide, insere-se na fóvea do colo do côndilo.',
    funcao:
      'Protrai a mandíbula e, com isso, abre a boca — o abaixamento é feito pela translação do côndilo, não por um "abaixador". Unilateralmente, desvia a mandíbula para o lado oposto.',
    vascularizacao: 'Artéria maxilar, que costuma passar entre suas duas cabeças.',
    inervacao: 'Nervo pterigóideo lateral, ramo do V3.',
    relacoes: 'A cabeça superior é a única inserção muscular direta no disco articular da ATM.',
    clinica:
      'Essa inserção discal é o coração da patologia da ATM: o desequilíbrio entre as duas cabeças traciona o disco anteriormente e produz o deslocamento discal com redução — o estalido característico ao abrir a boca. Na paralisia unilateral, a mandíbula desvia para o lado paralisado ao abrir, porque o lado sadio empurra sozinho.',
    memoria:
      'Todos os músculos da mastigação fecham a boca, menos um: o pterigóideo lateral. É ele que abre, puxando para a frente.',
    pontos: [
      'Por que o pterigóideo lateral é o único que abre a boca?',
      'Qual sua relação com o disco da ATM?',
      'Para que lado a mandíbula desvia na sua paralisia?',
    ],
  },
  /* ─────────────────── Arquitetura do osso ─────────────────── */
  {
    termos: ['Osso Compacto'],
    classe: 'osso',
    resumo: 'Tecido ósseo denso da cortical, organizado em ósteons concêntricos em torno de canais vasculares.',
    localizacao: 'Camada externa de todos os ossos, espessa na diáfise dos ossos longos e fina nas epífises e nos ossos curtos.',
    funcao:
      'Suporta carga e resiste à flexão e à torção. Sua unidade é o ósteon: lamelas concêntricas em torno de um canal de Havers, com osteócitos em lacunas comunicadas por canalículos. Os canais de Volkmann conectam os ósteons transversalmente.',
    vascularizacao: 'Terço externo por vasos periosteais; dois terços internos pela artéria nutrícia, a partir da medular.',
    relacoes: 'Recoberto pelo periósteo por fora e pelo endósteo por dentro.',
    clinica:
      'A rede de canalículos é como o osteócito percebe carga mecânica e sinaliza remodelação — a base da lei de Wolff: o osso se adapta à carga que recebe. É por isso que o exercício com impacto previne osteoporose e que o osso sob uma placa muito rígida se afina (stress shielding), complicação real das fixações modernas.',
    memoria:
      'O osso é um tecido vivo que "escuta" a carga. Carga demais, ele engrossa; carga de menos, ele desaparece.',
    pontos: [
      'Qual a unidade estrutural do osso compacto?',
      'Como o osteócito percebe a carga mecânica?',
      'O que é stress shielding?',
    ],
  },
  {
    termos: ['Osso Esponjoso', 'Trabéculas Ósseas'],
    classe: 'osso',
    resumo: 'Rede tridimensional de trabéculas orientadas nas linhas de força, que ocupa as epífises e as metáfises.',
    localizacao: 'Interior das epífises dos ossos longos, dos corpos vertebrais e dos ossos curtos e planos, com a medula óssea entre as trabéculas.',
    funcao:
      'Suporta carga com o mínimo de massa: as trabéculas se alinham exatamente segundo as trajetórias de tensão e compressão, como se o osso resolvesse um problema de engenharia estrutural. No colo do fêmur, esse alinhamento é tão nítido que se descrevem sistemas trabeculares nomeados.',
    vascularizacao: 'Vasos metafisários e epifisários; a medula óssea vermelha entre as trabéculas é hematopoética.',
    relacoes: 'Contínuo com a cortical, que ele reforça internamente.',
    clinica:
      'A superfície do osso trabecular é muito maior que a do compacto, e o metabolismo ósseo acontece nas superfícies — por isso a osteoporose se manifesta primeiro aqui, e a primeira fratura de fragilidade é a vertebral, não a do fêmur. É também esse alto turnover que faz da coluna o primeiro alvo das metástases e o local preferido para biópsia de medula óssea.',
    memoria:
      'Trabécula é osso que segue as linhas de força, como as vigas de uma ponte. Onde há mais superfície, há mais metabolismo — e é ali que a osteoporose começa.',
    pontos: [
      'Por que as trabéculas se orientam segundo as linhas de força?',
      'Por que a osteoporose atinge primeiro o osso esponjoso?',
      'Que tecido ocupa os espaços entre as trabéculas?',
    ],
  },
  {
    termos: ['Cavidade Medular'],
    classe: 'osso',
    resumo: 'Canal central da diáfise dos ossos longos, ocupado pela medula óssea e forrado pelo endósteo.',
    localizacao: 'Interior da diáfise, delimitado pela cortical e revestido pelo endósteo.',
    funcao:
      'Aloja a medula óssea — vermelha e hematopoética na criança, substituída progressivamente por medula amarela adiposa no adulto, que persiste vermelha sobretudo em vértebras, esterno, costelas, ilíaco e crânio.',
    vascularizacao: 'Artéria nutrícia, que se ramifica em ramos ascendente e descendente dentro do canal.',
    relacoes: 'O endósteo contém células osteoprogenitoras responsáveis pela remodelação interna.',
    clinica:
      'É a via do acesso intraósseo, alternativa ao acesso venoso na emergência: qualquer fármaco ou fluido infundido na cavidade medular alcança a circulação central em segundos, porque os sinusoides medulares não colapsam. Sítios preferenciais são a tíbia proximal, o úmero proximal e o esterno. É também o canal fresado para hastes intramedulares e a origem da embolia gordurosa nesse procedimento.',
    memoria:
      'A cavidade medular é uma veia que não colapsa. É por isso que, na criança em choque sem acesso, a agulha vai no osso.',
    pontos: [
      'O que ocupa a cavidade medular na criança e no adulto?',
      'Por que o acesso intraósseo funciona em choque?',
      'Que estrutura reveste a cavidade medular?',
    ],
  },
]
