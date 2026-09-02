import type { EntradaDicionario } from './tipos'

/**
 * Sistema genital masculino.
 *
 * O testículo nasce no abdome e desce para fora do corpo, e é essa migração que
 * explica quase tudo: por que a dor testicular aparece no abdome, por que a
 * drenagem linfática é lombar e não inguinal, e por que as camadas do escroto
 * repetem, uma a uma, as camadas da parede abdominal.
 */
export const GENITAL_MASCULINO: EntradaDicionario[] = [
  /* ─────────────────── Escroto e envoltórios ─────────────────── */
  {
    termos: ['Pele do Escroto', 'Rafe do Escroto'],
    classe: 'viscera',
    resumo: 'Pele fina, pigmentada e pregueada do escroto, com a rafe marcando a linha média de fusão.',
    localizacao: 'Bolsa escrotal, com a rafe estendendo-se do períneo até a face ventral do pênis.',
    funcao: 'Pele quase sem tecido adiposo, o que favorece a perda de calor e mantém o testículo cerca de 2 a 3 °C abaixo da temperatura corporal — condição para a espermatogênese.',
    inervacao: 'Face anterior pelos nervos ilioinguinal e genitofemoral (L1); posterior pelos ramos escrotais posteriores do pudendo (S3) e do cutâneo femoral posterior.',
    clinica:
      'A rafe é a cicatriz da fusão das pregas labioescrotais, e sua interrupção indica distúrbio do desenvolvimento sexual. A inervação com origem em duas raízes muito distantes — L1 à frente e S3 atrás — explica por que um bloqueio isolado nunca anestesia o escroto inteiro. E a ausência de gordura é o que faz do escroto o sítio clássico da gangrena de Fournier, com disseminação rapidíssima pelas fáscias.',
    memoria:
      'Escroto sem gordura é escroto que perde calor — e é essa perda que faz o espermatozoide existir.',
    pontos: [
      'Por que o testículo precisa de temperatura mais baixa?',
      'Qual a inervação do escroto e por que ela é dupla?',
      'O que a rafe escrotal representa?',
    ],
  },
  {
    termos: ['Túnica Dartos'],
    classe: 'musculo',
    resumo: 'Camada de músculo liso subcutâneo do escroto, que enruga a pele e regula sua superfície.',
    localizacao: 'Imediatamente sob a pele escrotal, contínua com as fáscias de Scarpa e de Colles.',
    funcao:
      'Contrai-se ao frio, enrugando a pele e reduzindo a área de troca térmica; relaxa ao calor. É músculo liso, de resposta lenta e involuntária, ao contrário do cremaster.',
    inervacao: 'Fibras simpáticas do plexo genital.',
    relacoes: 'Forma o septo do escroto, que divide a bolsa em dois compartimentos.',
    clinica:
      'Sua continuidade com as fáscias de Scarpa e de Colles é o que define o trajeto do extravasamento urinário na rotura de uretra anterior: a urina ocupa o escroto e o pênis e sobe pela parede abdominal, sem descer para a coxa — porque a fáscia de Colles se fixa ao ramo isquiopúbico e à membrana perineal. Um padrão de edema que localiza a lesão sem exame de imagem.',
    memoria:
      'Escroto e pênis inchados com urina, subindo para o abdome mas sem descer para a coxa: rotura de uretra anterior.',
    pontos: [
      'Que tipo de músculo é o dartos e como ele responde?',
      'Com que fáscias ele se continua?',
      'Que padrão de extravasamento urinário isso determina?',
    ],
  },
  {
    termos: ['Septo do Escroto'],
    classe: 'fascia',
    resumo: 'Prolongamento do dartos que divide o escroto em dois compartimentos independentes.',
    localizacao: 'Linha média do escroto, correspondendo externamente à rafe.',
    funcao: 'Separa os dois testículos, com suas próprias túnicas vaginais, vasos e linfáticos.',
    relacoes: 'Cada compartimento é anatomicamente independente do outro.',
    clinica:
      'Essa independência é clinicamente útil: uma hidrocele, um hematoma ou um abscesso ficam contidos de um lado só, e a assimetria escrotal permite comparar imediatamente o lado doente com o sadio. Já a gangrena de Fournier atravessa o septo com facilidade, porque se dissemina pelo plano fascial e não pelo compartimento — e o acometimento bilateral rápido é justamente o que denuncia sua gravidade.',
    memoria:
      'Dois compartimentos separados: doença de um lado não passa para o outro — a menos que seja fasciíte, que ignora paredes.',
    pontos: [
      'O que forma o septo do escroto?',
      'Que consequência clínica a compartimentalização traz?',
      'Por que a gangrena de Fournier a ultrapassa?',
    ],
  },
  {
    termos: ['Fáscia Espermática Externa'],
    classe: 'fascia',
    resumo: 'Camada mais externa dos envoltórios do funículo, derivada da aponeurose do músculo oblíquo externo.',
    localizacao: 'Do anel inguinal superficial até o escroto, envolvendo o funículo espermático e o testículo.',
    funcao: 'É a primeira das três camadas que o testículo "vestiu" ao atravessar a parede abdominal.',
    relacoes: 'Segue-se, por dentro, o cremaster (do oblíquo interno) e a fáscia espermática interna (da fáscia transversal).',
    clinica:
      'A correspondência é exata e vale memorizar: oblíquo externo dá a fáscia espermática externa, oblíquo interno dá o cremaster, fáscia transversal dá a fáscia espermática interna — e o peritônio dá o processo vaginal. Entender essa sequência é entender por que a hérnia inguinal indireta desce dentro do funículo e a direta, não.',
    memoria:
      'O testículo se veste ao sair: pega uma camada de cada plano da parede. Três camadas, três músculos.',
    pontos: [
      'De que estrutura deriva a fáscia espermática externa?',
      'Quais são as três camadas do funículo e suas origens?',
      'Por que a hérnia indireta desce dentro do funículo?',
    ],
  },
  {
    termos: ['Músculo Cremaster e Fáscia Espermática Interna'],
    classe: 'musculo',
    resumo: 'Camadas média e interna dos envoltórios do funículo, derivadas do oblíquo interno e da fáscia transversal.',
    localizacao: 'Entre as fáscias espermáticas externa e a túnica vaginal, envolvendo o funículo e o testículo.',
    funcao:
      'O cremaster é músculo estriado que eleva o testículo em resposta ao frio e ao estímulo cutâneo da face medial da coxa — o reflexo cremastérico, com aferência pelo ramo femoral e eferência pelo ramo genital do nervo genitofemoral (L1–L2).',
    inervacao: 'Ramo genital do nervo genitofemoral.',
    relacoes: 'A fáscia espermática interna, por dentro, envolve diretamente o funículo.',
    clinica:
      'A abolição do reflexo cremastérico é um dos sinais mais úteis na torção testicular, junto com dor de início súbito, testículo elevado e horizontalizado e ausência do sinal de Prehn. Na epididimite, ao contrário, o reflexo permanece. E o cremaster hiperativo produz o testículo retrátil na criança, que precisa ser distinguido da criptorquidia verdadeira — um exame feito com a criança agachada resolve a dúvida.',
    memoria:
      'Reflexo cremastérico presente afasta torção; ausente, com dor súbita, é bloco cirúrgico em minutos.',
    pontos: [
      'Que nervo medeia o reflexo cremastérico?',
      'De que camadas da parede derivam o cremaster e a fáscia interna?',
      'Como o reflexo ajuda no diagnóstico da torção testicular?',
    ],
  },
  {
    termos: ['Lâmina Parietal da Túnica Vaginal'],
    classe: 'serosa',
    resumo: 'Folheto externo da túnica serosa que envolve o testículo — resto do processo vaginal do peritônio.',
    localizacao: 'Reveste internamente o escroto e reflete-se sobre o testículo como lâmina visceral, deixando livre a face posterior.',
    funcao: 'Cria uma cavidade serosa virtual que permite ao testículo deslizar dentro do escroto sem atrito.',
    relacoes: 'A face posterior do testículo, onde entra o pedículo, não é revestida — é o ponto de fixação.',
    clinica:
      'O acúmulo de líquido nessa cavidade é a hidrocele, que se distingue de massa sólida pela transiluminação. Quando o processo vaginal não se fecha, resulta a hidrocele comunicante e a hérnia inguinal indireta da criança. E uma túnica vaginal que envolve o testículo por completo, inclusive atrás, deixa-o pendurado como um badalo de sino — a deformidade em badalo de sino, causa anatômica da torção testicular, quase sempre bilateral, o que justifica fixar também o testículo sadio.',
    memoria:
      'Testículo preso só por trás é normal. Testículo envolvido por todos os lados balança e torce: badalo de sino.',
    pontos: [
      'De que estrutura deriva a túnica vaginal?',
      'Que face do testículo não é revestida por ela?',
      'O que é a deformidade em badalo de sino?',
    ],
  },
  /* ─────────────────── Testículo e epidídimo ─────────────────── */
  {
    termos: ['Testículo Direito', 'Testículo Esquerdo'],
    classe: 'viscera',
    resumo: 'Gônadas masculinas, produtoras de espermatozoides e de testosterona, alojadas no escroto.',
    localizacao: 'No escroto, o esquerdo geralmente mais baixo que o direito por ter funículo mais longo.',
    funcao:
      'Os túbulos seminíferos produzem espermatozoides; as células de Sertoli formam a barreira hematotesticular; as células de Leydig, no interstício, produzem testosterona.',
    vascularizacao: 'Artéria testicular, ramo direto da aorta abdominal ao nível de L2 — reflexo da origem abdominal da gônada.',
    linfaticos: 'Linfonodos lombares (para-aórticos), e não inguinais — porque a linfa acompanha os vasos de origem, e não a pele do escroto.',
    clinica:
      'Essa dissociação linfática é uma das informações mais rentáveis da anatomia: o câncer de testículo metastatiza para linfonodos retroperitoneais, enquanto o câncer de pele do escroto vai para os inguinais. Buscar linfonodo inguinal em tumor de testículo é procurar no lugar errado. E a origem alta da artéria testicular explica por que a dor da torção se refere ao abdome, muitas vezes confundida com apendicite no adolescente.',
    memoria:
      'O testículo drena para onde ele nasceu: o abdome. Pele do escroto drena para a virilha. Nunca confunda os dois.',
    pontos: [
      'Para onde drena a linfa do testículo e por quê?',
      'De onde nasce a artéria testicular?',
      'Por que a dor testicular se refere ao abdome?',
    ],
  },
  {
    termos: ['Túnica Albugínea'],
    classe: 'viscera',
    resumo: 'Cápsula fibrosa densa e branca que envolve o testículo e emite septos para dentro.',
    localizacao: 'Sob a lâmina visceral da túnica vaginal, envolvendo todo o parênquima testicular.',
    funcao: 'Contém o parênquima e envia septos que dividem o testículo em 200 a 300 lóbulos, cada um com um a quatro túbulos seminíferos contorcidos.',
    relacoes: 'Espessa-se posteriormente formando o mediastino do testículo.',
    clinica:
      'Sua rotura é a definição de fratura testicular no trauma, e o achado ultrassonográfico de descontinuidade da albugínea é indicação de exploração cirúrgica imediata — a reparação em até 72 horas salva o testículo em mais de 80% dos casos, contra menos de 50% depois disso. É também a rigidez da albugínea que faz o testículo doer tanto: qualquer edema aumenta a pressão dentro de uma cápsula que não cede.',
    memoria:
      'Cápsula que não estica: qualquer inchaço lá dentro vira pressão. É por isso que dor de testículo é dor de verdade.',
    pontos: [
      'Que função a túnica albugínea exerce?',
      'Quantos lóbulos ela delimita?',
      'O que caracteriza a fratura testicular?',
    ],
  },
  {
    termos: ['Parênquima Testicular'],
    classe: 'viscera',
    resumo: 'Conjunto dos lóbulos testiculares, com os túbulos seminíferos e o interstício.',
    localizacao: 'Interior do testículo, dividido em lóbulos pelos septos da albugínea.',
    funcao:
      'Cada testículo contém cerca de 250 metros de túbulos seminíferos. As células de Sertoli formam junções oclusivas que criam a barreira hematotesticular, isolando os espermatozoides do sistema imune.',
    relacoes: 'Os túbulos retos conduzem à rede do testículo, no mediastino.',
    clinica:
      'A barreira hematotesticular é o que torna o espermatozoide "invisível" ao sistema imune — e sua rotura, no trauma, na vasectomia ou na torção, expõe antígenos e permite a formação de anticorpos antiespermatozoide, causa de infertilidade imunológica. É a razão de a orquiectomia ser preferível à preservação de um testículo inviável em alguns casos de torção tardia.',
    memoria:
      'O espermatozoide é estranho ao próprio corpo. Se a barreira quebra, o sistema imune ataca — e o outro testículo pode pagar.',
    pontos: [
      'O que é a barreira hematotesticular e quem a forma?',
      'Que extensão têm os túbulos seminíferos?',
      'Que consequência a rotura da barreira pode ter?',
    ],
  },
  {
    termos: ['Mediastino do Testículo'],
    classe: 'viscera',
    resumo: 'Espessamento posterior da albugínea que aloja a rede do testículo e os vasos.',
    localizacao: 'Borda posterior do testículo, projetando-se para dentro do parênquima.',
    funcao: 'Contém a rede do testículo, para onde convergem os túbulos retos, e de onde partem os ductos eferentes para a cabeça do epidídimo.',
    relacoes: 'Aparece na ultrassonografia como uma linha ecogênica na face posterior — um marco de orientação.',
    clinica:
      'Essa linha é a referência que permite ao ultrassonografista se orientar no testículo e reconhecer a ectasia da rede do testículo, achado benigno frequente em homens acima de 50 anos e após vasectomia, facilmente confundido com neoplasia. Saber que a rede fica ali evita biópsias desnecessárias.',
    memoria:
      'O mediastino do testículo é o "hilo" dele: entra vaso, sai ducto, e tudo se organiza por trás.',
    pontos: [
      'Que estrutura o mediastino do testículo aloja?',
      'Para onde vão os ductos eferentes?',
      'O que é a ectasia da rede do testículo?',
    ],
  },
  {
    termos: ['Epidídimo'],
    classe: 'viscera',
    resumo: 'Órgão em vírgula na face posterolateral do testículo, formado por um único ducto de 6 metros enovelado.',
    localizacao: 'Face posterior e lateral do testículo, com cabeça, corpo e cauda.',
    funcao:
      'Local de maturação e armazenamento dos espermatozoides: eles saem do testículo imóveis e incapazes de fecundar, e adquirem motilidade e capacidade fecundante ao longo dos 10 a 14 dias de trânsito epididimário.',
    vascularizacao: 'Artéria testicular e artéria do ducto deferente.',
    clinica:
      'É a sede da epididimite, principal diagnóstico diferencial da torção testicular: aqui a dor é de instalação gradual, há febre e sintomas urinários, o reflexo cremastérico está presente e a elevação do testículo alivia a dor — o sinal de Prehn positivo. Em jovens sexualmente ativos, os agentes são clamídia e gonococo; acima dos 35 anos, enterobactérias.',
    memoria:
      'Torção: dor súbita, sem febre, reflexo ausente. Epididimite: dor gradual, com febre, reflexo presente. A pressa é da torção.',
    pontos: [
      'Que função o epidídimo desempenha?',
      'Quanto tempo dura o trânsito epididimário?',
      'Como diferenciar epididimite de torção testicular?',
    ],
  },
  {
    termos: ['Cabeça do Epidídimo', 'Corpo do Epidídimo', 'Cauda do Epidídimo'],
    classe: 'viscera',
    resumo: 'As três porções do epidídimo: a cabeça recebe os ductos eferentes, a cauda continua no ducto deferente.',
    localizacao: 'A cabeça repousa sobre o polo superior do testículo; o corpo desce pela face posterior; a cauda está no polo inferior.',
    funcao:
      'A cabeça é formada pelos ductos eferentes convolutos; o corpo e a cauda, pelo ducto do epidídimo propriamente dito. A cauda é o principal reservatório de espermatozoides maduros.',
    relacoes: 'O apêndice do epidídimo, na cabeça, é um resto do ducto mesonéfrico.',
    clinica:
      'A torção do apêndice do epidídimo ou do apêndice do testículo (hidátide de Morgagni) é causa comum de dor escrotal aguda em meninos de 7 a 12 anos, com o característico "sinal do ponto azul" no polo superior — quadro benigno, que se trata com analgesia e que não deve ser confundido com torção do cordão. A cauda é ainda o segmento seccionado na vasectomia reversa quando a anastomose vasovasal não é possível.',
    memoria:
      'Ponto azul no alto do testículo em menino de 10 anos: torceu o apêndice, não o testículo. Alívio e observação.',
    pontos: [
      'Que estruturas formam cada porção do epidídimo?',
      'Onde os espermatozoides são armazenados?',
      'O que é o sinal do ponto azul?',
    ],
  },
  {
    termos: ['Funículo Espermático'],
    classe: 'estrutura',
    resumo: 'Cordão que suspende o testículo, contendo o ducto deferente, vasos, nervos e linfáticos.',
    localizacao: 'Do anel inguinal profundo até a borda posterior do testículo, atravessando o canal inguinal.',
    funcao:
      'Contém o ducto deferente, as artérias testicular, do deferente e cremastérica, o plexo venoso pampiniforme, os linfáticos, o ramo genital do genitofemoral e fibras autonômicas.',
    relacoes: 'O plexo pampiniforme envolve a artéria testicular e realiza troca de calor em contracorrente, resfriando o sangue arterial antes que ele chegue ao testículo.',
    clinica:
      'Esse mecanismo de contracorrente é o que mantém a temperatura testicular baixa — e sua falência na varicocele eleva a temperatura e prejudica a espermatogênese, mecanismo aceito da infertilidade associada. Na exploração escrotal, palpar o deferente como um "fio de espaguete" firme dentro do funículo é o modo de identificá-lo, e sua ausência bilateral está associada a mutações do gene CFTR, mesmo sem fibrose cística clínica.',
    memoria:
      'O plexo pampiniforme é um radiador em torno da artéria: ele resfria o sangue antes de ele chegar ao testículo.',
    pontos: [
      'Que estruturas compõem o funículo espermático?',
      'Como funciona a troca de calor em contracorrente?',
      'Que doença genética se associa à ausência de deferentes?',
    ],
  },
  {
    termos: ['Ducto Deferente', 'Ducto Deferente Direito', 'Ducto Deferente Esquerdo'],
    classe: 'viscera',
    resumo: 'Tubo muscular de parede espessa que conduz os espermatozoides da cauda do epidídimo ao ducto ejaculatório.',
    localizacao:
      'Sobe no funículo, atravessa o canal inguinal, cruza os vasos ilíacos externos, desce na pelve cruzando por cima do ureter e alcança a base da próstata, onde se dilata na ampola.',
    funcao: 'Sua musculatura lisa espessa realiza contrações peristálticas potentes na emissão, sob controle simpático (L1–L2).',
    inervacao: 'Fibras simpáticas do plexo hipogástrico inferior.',
    relacoes: 'Cruza o ureter por cima — "a água passa por baixo da ponte", o mesmo padrão da artéria uterina na mulher.',
    clinica:
      'A parede espessa e o lúmen estreito são o que fazem o deferente ser palpável como um cordão firme no escroto — e é essa palpação que confirma a vasectomia. Sua secção interrompe o transporte sem afetar a testosterona, porque as células de Leydig continuam intactas: o paciente ejacula normalmente, apenas sem espermatozoides.',
    memoria:
      'Deferente cruza por cima do ureter, como a artéria uterina. Nos dois sexos, a "ponte" passa sobre a "água".',
    pontos: [
      'Qual o trajeto do ducto deferente?',
      'Qual sua relação com o ureter?',
      'Por que a vasectomia não altera a testosterona?',
    ],
  },
  /* ─────────────────── Glândulas anexas ─────────────────── */
  {
    termos: ['Glândula Seminal', 'Glândula Seminal Direita', 'Glândula Seminal Esquerda', 'Vesícula Seminal', 'Vesícula Seminal Direita', 'Vesícula Seminal Esquerda', 'Vesicula Seminal Direita', 'Vesicula Seminal Esquerda'],
    classe: 'glandula',
    resumo: 'Glândulas alongadas atrás da bexiga que produzem cerca de 70% do volume do sêmen.',
    localizacao: 'Entre a bexiga e o reto, lateralmente às ampolas dos ductos deferentes, acima da próstata.',
    funcao:
      'Produzem um líquido alcalino rico em frutose — a fonte de energia do espermatozoide — e em prostaglandinas. Não armazenam espermatozoides, apesar do nome antigo "vesícula seminal".',
    vascularizacao: 'Artérias vesicais inferiores e retais médias.',
    relacoes: 'Seu ducto une-se ao deferente para formar o ducto ejaculatório, que atravessa a próstata.',
    clinica:
      'A frutose seminal é o marcador laboratorial da patência dessas vias: sua ausência num espermograma de azoospermia indica obstrução dos ductos ejaculatórios ou agenesia de deferentes e vesículas — um exame de bioquímica que localiza uma lesão anatômica. A relação com o reto é o que permite palpá-las ao toque em processos inflamatórios e o que define o estádio T3b do câncer de próstata.',
    memoria:
      'Vesícula seminal não guarda esperma: ela faz o combustível dele. Sem frutose no sêmen, o caminho está bloqueado.',
    pontos: [
      'Que proporção do sêmen as glândulas seminais produzem?',
      'Qual a função da frutose seminal?',
      'O que a ausência de frutose no espermograma indica?',
    ],
  },
  /* ─────────────────── Pênis ─────────────────── */
  {
    termos: ['Raiz do Pênis', 'Ramos do Pênis'],
    classe: 'viscera',
    resumo: 'Porção fixa do pênis no períneo, formada pelos dois ramos e pelo bulbo.',
    localizacao: 'No espaço perineal superficial, com os ramos fixados aos ramos isquiopúbicos e o bulbo à membrana perineal.',
    funcao:
      'Os ramos são cobertos pelos músculos isquiocavernosos e o bulbo pelo bulboesponjoso; a contração desses músculos comprime as raízes e eleva a pressão intracavernosa acima da pressão sistólica, produzindo a rigidez máxima da ereção.',
    inervacao: 'Nervo pudendo (S2–S4), ramo perineal.',
    clinica:
      'Essa contribuição muscular é o que a fisioterapia do assoalho pélvico treina na disfunção erétil, e explica por que a rigidez final não depende só do fluxo sanguíneo. O bulboesponjoso é também responsável pela expulsão da urina e do sêmen residuais — e o reflexo bulbocavernoso, que ele medeia, é o primeiro reflexo a retornar após o choque medular, marcando o fim dessa fase.',
    memoria:
      'A ereção enche; o músculo endurece. Sangue sozinho não dá rigidez máxima — precisa da contração da raiz.',
    pontos: [
      'Que estruturas formam a raiz do pênis?',
      'Que músculos a recobrem e qual sua função?',
      'O que é o reflexo bulbocavernoso e por que ele importa?',
    ],
  },
  {
    termos: ['Bulbo do Pênis'],
    classe: 'viscera',
    resumo: 'Porção dilatada e mediana do corpo esponjoso, na raiz do pênis, atravessada pela uretra.',
    localizacao: 'Linha média do períneo, fixado à face inferior da membrana perineal, coberto pelo músculo bulboesponjoso.',
    funcao: 'Recebe a uretra, que entra na sua face superior, e os ductos das glândulas bulbouretrais.',
    relacoes: 'A artéria bulbar, ramo da pudenda interna, entra por sua face profunda.',
    clinica:
      'É a região comprimida na queda em cavaleiro — o mecanismo clássico da lesão de uretra anterior, com hematoma perineal em asa de borboleta contido pela fáscia de Colles. É também a área de dissecção mais delicada na cirurgia de próteses penianas e na uretroplastia, pela vascularização abundante.',
    memoria:
      'Queda em cavaleiro esmaga o bulbo contra o púbis. O hematoma vira uma borboleta no períneo.',
    pontos: [
      'Que músculo recobre o bulbo do pênis?',
      'Que estruturas entram nele?',
      'Que mecanismo de trauma o lesa?',
    ],
  },
  {
    termos: ['Corpo Cavernoso do Pênis', 'Corpo Cavernoso'],
    classe: 'viscera',
    resumo: 'Par de cilindros de tecido erétil dorsais, responsáveis pela rigidez da ereção.',
    localizacao: 'Dorsolateralmente no pênis, envoltos individualmente pela túnica albugínea e, juntos, pela fáscia profunda.',
    funcao:
      'Contêm os espaços sinusoidais alimentados pelas artérias helicinas. Na ereção, o relaxamento da musculatura lisa, mediado por óxido nítrico, enche os sinusoides e comprime as vênulas subalbugíneas contra a albugínea rígida — o mecanismo veno-oclusivo, sem o qual não há ereção.',
    vascularizacao: 'Artérias profundas do pênis, ramos da pudenda interna.',
    inervacao: 'Nervos cavernosos, do plexo hipogástrico inferior (parassimpático S2–S4).',
    relacoes: 'Comunicam-se entre si por um septo incompleto, o que os torna funcionalmente uma unidade.',
    clinica:
      'A comunicação entre os dois é a razão de uma única injeção intracavernosa medicar os dois corpos, e de o priapismo isquêmico envolver ambos poupando o corpo esponjoso e a glande. O óxido nítrico é o alvo dos inibidores da fosfodiesterase-5, e a lesão dos nervos cavernosos na prostatectomia radical é a causa da disfunção erétil pós-operatória — motivo do desenvolvimento das técnicas poupadoras de nervos.',
    memoria:
      'Ereção é sangue entrando e não conseguindo sair. A albugínea rígida é quem fecha a saída.',
    pontos: [
      'Como funciona o mecanismo veno-oclusivo?',
      'Que neurotransmissor medeia a ereção?',
      'Por que o priapismo poupa a glande?',
    ],
  },
  {
    termos: ['Corpo Esponjoso do Pênis', 'Corpo Esponjoso'],
    classe: 'viscera',
    resumo: 'Cilindro ventral de tecido erétil que envolve a uretra e termina na glande.',
    localizacao: 'Face ventral do pênis, no sulco entre os corpos cavernosos, expandindo-se no bulbo, atrás, e na glande, à frente.',
    funcao:
      'Sua albugínea é muito mais fina e elástica que a dos cavernosos, de modo que ele nunca atinge a mesma pressão — o que mantém a uretra pérvia durante a ereção e permite a passagem do sêmen.',
    vascularizacao: 'Artérias bulbouretrais e dorsais do pênis.',
    clinica:
      'Essa diferença de pressão é o que se explora na derivação cavernoso-esponjosa (shunt de Winter e similares) para tratar o priapismo isquêmico: cria-se uma comunicação entre os cavernosos hipertensos e o esponjoso de baixa pressão, drenando o sangue estagnado. Uma cirurgia inteira baseada numa diferença de espessura de cápsula.',
    memoria:
      'Cavernoso endurece, esponjoso não — senão a uretra fecharia e o sêmen não sairia.',
    pontos: [
      'Por que o corpo esponjoso não atinge alta pressão?',
      'Que consequência funcional isso tem?',
      'Como isso é usado no tratamento do priapismo?',
    ],
  },
  {
    termos: ['Coroa da Glande', 'Colo da Glande'],
    classe: 'viscera',
    resumo: 'Borda saliente da glande e o sulco imediatamente atrás dela.',
    localizacao: 'A coroa é a margem posterior expandida da glande; o colo é o sulco entre ela e o corpo do pênis.',
    funcao: 'A coroa é a região de maior densidade de terminações nervosas do pênis; o colo é onde o prepúcio se insere.',
    relacoes: 'As glândulas prepuciais do colo produzem o esmegma.',
    clinica:
      'O colo é o ponto onde o prepúcio retraído e não recolocado estrangula a glande: é a parafimose, emergência urológica em que o edema progressivo pode levar à necrose e que exige redução manual imediata. É também no colo que se posicionam corpos estranhos constritivos e onde se instala a balanopostite. A coroa, por sua sensibilidade, é a região preservada nas técnicas de circuncisão.',
    memoria:
      'Prepúcio puxado para trás e esquecido lá: o colo estrangula a glande. Parafimose é conta regressiva.',
    pontos: [
      'Onde se localiza o colo da glande?',
      'O que é parafimose e por que ela é emergência?',
      'Por que a coroa é a área mais sensível?',
    ],
  },
  {
    termos: ['Prepúcio', 'Frênulo do Prepúcio'],
    classe: 'viscera',
    resumo: 'Prega cutânea retrátil que cobre a glande, ancorada ventralmente pelo frênulo.',
    localizacao: 'Continuação da pele do pênis sobre a glande, com o frênulo na face ventral, na linha média.',
    funcao: 'Protege a glande e o meato; o frênulo limita a retração excessiva e contém uma artéria frenular.',
    clinica:
      'A não retração do prepúcio é fisiológica até os 3 a 5 anos e não deve ser forçada, sob risco de aderências e fimose cicatricial. A ruptura do frênulo durante a relação sangra abundantemente por causa da artéria frenular e é uma causa comum de atendimento na emergência. E o frênulo curto, que causa dor e curvatura ventral, resolve-se com frenuloplastia, sem necessidade de circuncisão.',
    memoria:
      'Prepúcio que não retrai em menino pequeno é normal. Forçar é o que cria a fimose de verdade.',
    pontos: [
      'Até que idade a não retração do prepúcio é fisiológica?',
      'Por que a rotura do frênulo sangra tanto?',
      'Qual o tratamento do frênulo curto?',
    ],
  },
  {
    termos: ['Artéria Profunda do Pênis'],
    classe: 'arteria',
    resumo: 'Ramo da pudenda interna que percorre o centro de cada corpo cavernoso e alimenta os sinusoides.',
    localizacao: 'No eixo de cada corpo cavernoso, emitindo as artérias helicinas.',
    funcao: 'É a artéria da ereção: suas artérias helicinas, espiraladas em flacidez, retificam-se com o relaxamento da musculatura lisa e enchem os sinusoides.',
    relacoes: 'Ramo terminal da artéria pudenda interna, da ilíaca interna.',
    clinica:
      'É a artéria avaliada na ultrassonografia com Doppler peniano após injeção de vasodilatador: um pico de velocidade sistólica baixo indica insuficiência arterial, enquanto uma velocidade diastólica final alta indica disfunção veno-oclusiva. Duas medidas que separam as duas grandes causas orgânicas de disfunção erétil — anatomia funcional traduzida em números.',
    memoria:
      'Artérias helicinas são espirais que se esticam. Enquanto enroladas, não passa sangue; esticadas, a ereção acontece.',
    pontos: [
      'Que artérias a profunda do pênis origina?',
      'Como elas participam da ereção?',
      'Que exame avalia sua função?',
    ],
  },
  {
    termos: ['Artéria Dorsal do Pênis'],
    classe: 'arteria',
    resumo: 'Ramo da pudenda interna que corre no dorso do pênis, sob a fáscia profunda, irrigando a glande e a pele.',
    localizacao: 'Dorso do pênis, lateralmente à veia dorsal profunda, com o nervo dorsal ainda mais lateral.',
    funcao: 'Irriga a glande, o prepúcio e a pele; contribui pouco para a ereção dos corpos cavernosos.',
    relacoes: 'A ordem no dorso, de medial para lateral, é: veia dorsal profunda, artérias dorsais e nervos dorsais.',
    clinica:
      'Essa disposição é a base do bloqueio do nervo dorsal do pênis, feito na raiz para circuncisão e para reparo de lacerações — o anestésico é depositado lateralmente à linha média, justamente para evitar a veia dorsal profunda no centro. Um bloqueio guiado por uma sequência anatômica de três estruturas.',
    memoria:
      'No dorso do pênis: veia no meio, artérias ao lado, nervos por fora. Bloqueie nas laterais e evite o centro.',
    pontos: [
      'Que estruturas o dorso do pênis contém e em que ordem?',
      'Que territórios a artéria dorsal irriga?',
      'Como se realiza o bloqueio do nervo dorsal?',
    ],
  },
  {
    termos: ['Veia Dorsal Profunda do Pênis'],
    classe: 'veia',
    resumo: 'Veia mediana do dorso do pênis, que drena os corpos cavernosos para o plexo prostático.',
    localizacao: 'Linha média do dorso, sob a fáscia profunda do pênis, entre as duas artérias dorsais.',
    funcao: 'Recebe as veias circunflexas e emissárias dos corpos cavernosos e passa sob o ligamento arqueado do púbis para alcançar o plexo venoso prostático.',
    relacoes: 'A veia dorsal superficial, acima da fáscia, drena a pele para as veias pudendas externas.',
    clinica:
      'O complexo venoso dorsal é a principal fonte de sangramento na prostatectomia radical retropúbica, e sua ligadura controlada é um dos passos que definem a qualidade da cirurgia. Do outro lado, a comunicação com o plexo prostático é a via pela qual a próstata metastatiza para a coluna vertebral, através do plexo venoso vertebral sem válvulas.',
    memoria:
      'A veia do pênis desemboca no plexo da próstata, que conversa com o plexo da coluna. É por essa estrada que a metástase sobe.',
    pontos: [
      'Para onde drena a veia dorsal profunda do pênis?',
      'Qual a diferença entre ela e a veia dorsal superficial?',
      'Que via de metástase essa drenagem abre?',
    ],
  },
]
