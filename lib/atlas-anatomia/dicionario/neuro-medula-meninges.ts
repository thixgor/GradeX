import type { EntradaDicionario } from './tipos'

/**
 * Medula espinal, meninges, diencéfalo e vascularização encefálica.
 *
 * A medula é o único lugar do sistema nervoso em que a anatomia é literalmente
 * legível num corte: cada funículo carrega uma via, e cada via tem uma
 * modalidade. Por isso as síndromes medulares são as mais dedutíveis da
 * neurologia — e as fichas daqui tentam ensinar a dedução, não a lista.
 */
export const NEURO_MEDULA_MENINGES: EntradaDicionario[] = [
  /* ─────────────────── Medula: forma externa ─────────────────── */
  {
    termos: ['Intumescência Cervical'],
    classe: 'snc',
    resumo: 'Alargamento da medula entre C4 e T1, onde nascem as raízes do plexo braquial.',
    localizacao: 'Segmentos medulares C4 a T1, correspondendo aproximadamente às vértebras C3 a C7.',
    funcao:
      'O alargamento não é acidental: ele reflete a quantidade de neurônios motores necessários para inervar o membro superior, e o aumento correspondente de substância cinzenta no corno anterior.',
    vascularizacao: 'Artéria espinal anterior reforçada por artérias radiculares cervicais.',
    relacoes: 'Dela partem as raízes de C5 a T1, que formam o plexo braquial.',
    clinica:
      'A siringomielia se instala tipicamente aqui, e sua clínica decorre da anatomia: a cavidade cresce no centro da medula e interrompe primeiro as fibras espinotalâmicas que cruzam pela comissura branca anterior, produzindo perda de dor e temperatura "em capa" sobre ombros e braços, com tato e propriocepção preservados. Uma dissociação sensitiva que aponta o diagnóstico sem imagem.',
    memoria:
      'Onde o membro é mais complexo, a medula é mais gorda. Cervical para o braço, lombar para a perna.',
    pontos: [
      'Por que a medula se alarga nas intumescências?',
      'Que raízes saem da intumescência cervical?',
      'Que dissociação sensitiva a siringomielia produz e por quê?',
    ],
  },
  {
    termos: ['Intumescência Lombar'],
    classe: 'snc',
    resumo: 'Alargamento da medula entre L1 e S3, origem das raízes dos plexos lombar e sacral.',
    localizacao: 'Segmentos medulares L1 a S3, situados nas vértebras T9 a T12 — uma dissociação que é a chave de toda a clínica medular.',
    funcao: 'Contém os neurônios motores do membro inferior e os centros autonômicos sacrais para bexiga, reto e função sexual.',
    vascularizacao: 'Artéria de Adamkiewicz, principal reforço radicular do território toracolombar.',
    relacoes: 'Continua-se com o cone medular, que termina em L1–L2 no adulto.',
    clinica:
      'A diferença entre nível vertebral e nível medular é o erro conceitual mais comum do estudante: uma fratura de T12 não lesa o "segmento T12", e sim os segmentos lombossacrais que ali se alojam, produzindo paraplegia flácida com bexiga neurogênica. Saber converter nível ósseo em nível medular é o que permite prever o déficit a partir da radiografia.',
    memoria:
      'A medula é mais curta que a coluna. Vértebra T12 abriga segmentos lombossacrais — nunca confunda os dois níveis.',
    pontos: [
      'Que segmentos medulares a intumescência lombar contém?',
      'A que vértebras ela corresponde?',
      'Por que é essencial distinguir nível vertebral de nível medular?',
    ],
  },
  {
    termos: ['Cone Medular'],
    classe: 'snc',
    resumo: 'Extremidade cônica e inferior da medula espinal, que termina em L1–L2 no adulto.',
    localizacao: 'Termina na borda inferior de L1 ou na superior de L2 no adulto; no recém-nascido desce até L3.',
    funcao: 'Contém os segmentos sacrais e coccígeos, com os centros parassimpáticos da micção, da defecação e da ereção.',
    relacoes: 'Continua-se pelo filamento terminal; as raízes lombossacrais descem em torno dele formando a cauda equina.',
    clinica:
      'A síndrome do cone medular é simétrica, com disfunção esfincteriana precoce, anestesia em sela e sinais de neurônio motor superior — enquanto a síndrome da cauda equina é assimétrica, com dor radicular intensa e sinais de neurônio motor inferior. A retenção urinária aguda com anestesia em sela é emergência cirúrgica em ambas: a descompressão precoce é o que preserva a continência.',
    memoria:
      'Cone é simétrico e mija cedo; cauda equina é assimétrica e dói muito. Anestesia em sela em qualquer um dos dois é bisturi hoje.',
    pontos: [
      'Onde termina o cone medular no adulto e na criança?',
      'Como diferenciar síndrome do cone e da cauda equina?',
      'Por que a anestesia em sela é uma emergência?',
    ],
  },
  {
    termos: ['Filamento Terminal'],
    classe: 'snc',
    resumo: 'Prolongamento fibroso da pia-máter que ancora o cone medular ao cóccix.',
    localizacao: 'Do ápice do cone medular até a face posterior do primeiro segmento coccígeo, atravessando o saco dural em S2.',
    funcao:
      'Fixa a medula inferiormente e amortece os movimentos da coluna. A porção interna é intradural; a externa, revestida de dura, forma o ligamento coccígeo.',
    relacoes: 'Corre no meio das raízes da cauda equina, das quais se distingue por ser mais espesso e brilhante.',
    clinica:
      'Um filamento terminal espessado ou infiltrado por gordura mantém a medula tracionada e produz a síndrome da medula ancorada: dor lombar, deformidade de pés, escoliose e disfunção esfincteriana progressiva na criança. O tratamento é a secção cirúrgica do filamento — uma das poucas cirurgias em que se corta uma estrutura anatômica para curar.',
    memoria:
      'Um "fio" que segura a medula por baixo. Se o fio encurta ou engorda, a medula fica esticada e a criança piora crescendo.',
    pontos: [
      'Qual a origem e a função do filamento terminal?',
      'O que é a síndrome da medula ancorada?',
      'Como ela se trata?',
    ],
  },
  {
    termos: ['Fissura Mediana Anterior'],
    classe: 'snc',
    resumo: 'Sulco profundo na linha média anterior da medula, ocupado pela artéria espinal anterior.',
    localizacao: 'Linha média da face anterior da medula, em toda a sua extensão.',
    funcao: 'Divide a medula anteriormente e aloja a artéria espinal anterior, cujos ramos sulcais penetram alternadamente para cada lado.',
    relacoes: 'No seu fundo cruzam as fibras espinotalâmicas na comissura branca anterior.',
    clinica:
      'A artéria espinal anterior irriga os dois terços anteriores da medula: sua oclusão produz a síndrome da artéria espinal anterior, com paralisia abaixo da lesão, perda de dor e temperatura e — o dado característico — preservação da propriocepção e do tato fino, porque os funículos posteriores são irrigados pelas espinais posteriores. Uma síndrome que se diagnostica pelo que está preservado.',
    memoria:
      'Uma artéria na frente para dois terços; duas artérias atrás para um terço. Isquemia medular poupa a vibração.',
    pontos: [
      'Que artéria ocupa a fissura mediana anterior?',
      'Que território ela irriga?',
      'Que modalidade é preservada na sua oclusão e por quê?',
    ],
  },
  {
    termos: ['Sulco Mediano Posterior'],
    classe: 'snc',
    resumo: 'Sulco raso na linha média posterior da medula, com um septo que penetra até quase o canal central.',
    localizacao: 'Linha média da face posterior da medula, em toda a extensão.',
    funcao: 'Divide os funículos posteriores em duas metades e dá passagem ao septo mediano posterior, de tecido glial.',
    relacoes: 'Nos segmentos acima de T6, o sulco intermédio posterior o subdivide, separando o fascículo grácil do cuneiforme.',
    clinica:
      'É o plano da mielotomia mediana posterior, usada para acessar cavidades siringomiélicas e tumores intramedulares centrais — uma via que aproveita o septo glial avascular. A localização exata da linha média é crítica: um desvio de milímetros lesa os funículos posteriores e produz perda proprioceptiva permanente.',
    memoria:
      'Atrás, a medula tem uma "costura" glial na linha média. É por ela que o cirurgião entra sem cortar via nenhuma.',
    pontos: [
      'Que estrutura ocupa o sulco mediano posterior?',
      'O que o sulco intermédio posterior separa?',
      'Que via cirúrgica utiliza esse plano?',
    ],
  },
  {
    termos: ['Canal Central'],
    classe: 'ventriculo',
    resumo: 'Canal microscópico no centro da medula, resto do lúmen do tubo neural.',
    localizacao: 'Centro da comissura cinzenta, percorrendo toda a medula; comunica-se acima com o quarto ventrículo.',
    funcao: 'Revestido de epêndima e contendo líquor, é o vestígio da cavidade do tubo neural embrionário. No adulto é frequentemente obliterado em parte da extensão.',
    relacoes: 'Está cercado pela comissura cinzenta, entre os cornos posteriores.',
    clinica:
      'Sua dilatação patológica é a hidromielia; quando a cavidade se estende além do epêndima, é siringomielia — associada classicamente à malformação de Chiari tipo I. A cavidade cresce de dentro para fora e por isso interrompe primeiro as fibras que cruzam a linha média, gerando a perda suspensa e dissociada da sensibilidade.',
    memoria:
      'O buraco no meio da medula é o que sobrou do tubo neural. Quando ele enche, corta primeiro o que cruza no meio.',
    pontos: [
      'O que o canal central representa embriologicamente?',
      'O que diferencia hidromielia de siringomielia?',
      'Por que a siringomielia produz déficit dissociado?',
    ],
  },
  {
    termos: ['Coluna Anterior'],
    classe: 'snc',
    resumo: 'Corno anterior da substância cinzenta medular, onde estão os neurônios motores inferiores.',
    localizacao: 'Porção anterior do H de substância cinzenta, mais volumosa nas intumescências.',
    funcao:
      'Contém os motoneurônios alfa e gama, organizados somatotopicamente: os que inervam a musculatura axial ficam mediais e os dos membros, laterais; os flexores são mais posteriores e os extensores mais anteriores.',
    relacoes: 'Suas fibras saem pelas raízes ventrais.',
    clinica:
      'É a estrutura destruída na poliomielite e degenerada na esclerose lateral amiotrófica e na atrofia muscular espinal, com o quadro típico de neurônio motor inferior: fraqueza, atrofia, fasciculações, hipotonia e arreflexia, sem alteração sensitiva. A ausência de déficit sensitivo, com fraqueza grave, é o dado que aponta para o corno anterior.',
    memoria:
      'Fraqueza com atrofia e fasciculação, mas sensibilidade normal: a lesão está no corno anterior, não no nervo nem no músculo.',
    pontos: [
      'Que neurônios a coluna anterior contém?',
      'Como eles se organizam somatotopicamente?',
      'Que doenças a acometem seletivamente?',
    ],
  },
  {
    termos: ['Coluna Posterior'],
    classe: 'snc',
    resumo: 'Corno posterior da substância cinzenta, primeira estação das vias sensitivas na medula.',
    localizacao: 'Porção posterior do H de substância cinzenta, alcançando quase a superfície da medula.',
    funcao:
      'Recebe as fibras aferentes da raiz dorsal. A substância gelatinosa, na sua ponta, é onde as fibras de dor fazem sinapse e onde funciona o portão da dor — o mecanismo pelo qual estímulos táteis inibem a transmissão dolorosa.',
    relacoes: 'Os axônios de segunda ordem cruzam pela comissura branca anterior e sobem como trato espinotalâmico.',
    clinica:
      'A teoria do portão explica por que esfregar o local de uma batida alivia a dor e por que a estimulação elétrica transcutânea funciona: fibras grossas do tato ativam interneurônios inibitórios que fecham o portão às fibras finas da dor. É um dos poucos mecanismos anatômicos que o paciente aplica intuitivamente todos os dias.',
    memoria:
      'Você esfrega onde bateu, e melhora. A explicação está na substância gelatinosa: tato fecha o portão da dor.',
    pontos: [
      'Que fibras chegam ao corno posterior?',
      'O que é a substância gelatinosa?',
      'Como funciona a teoria do portão da dor?',
    ],
  },
  {
    termos: ['Funículo Anterior'],
    classe: 'snc',
    resumo: 'Cordão de substância branca entre a fissura mediana anterior e a raiz ventral.',
    localizacao: 'Face anterior da medula, de cada lado da fissura mediana anterior.',
    funcao:
      'Conduz o trato corticoespinal anterior (as fibras que não cruzaram na decussação), os tratos vestibuloespinal, tectoespinal e reticuloespinal, e parte do espinotalâmico anterior.',
    relacoes: 'Continua-se lateralmente com o funículo lateral, sem limite nítido.',
    clinica:
      'Os tratos vestibuloespinal e reticuloespinal que aqui correm são as vias extrapiramidais responsáveis pelo tônus antigravitacional — e sua liberação, quando o controle cortical se perde, produz as posturas de decorticação e descerebração. A postura observada no coma diz o nível da lesão: decorticação acima do núcleo rubro, descerebração abaixo.',
    memoria:
      'Braços flexionados (decorticação) é lesão mais alta; braços estendidos (descerebração) é mais baixa e pior.',
    pontos: [
      'Que tratos o funículo anterior conduz?',
      'Que vias controlam o tônus antigravitacional?',
      'O que diferencia decorticação de descerebração?',
    ],
  },
  {
    termos: ['Funículo Lateral'],
    classe: 'snc',
    resumo: 'Cordão de substância branca entre as raízes ventral e dorsal, com as vias motoras e da dor.',
    localizacao: 'Face lateral da medula, entre a saída da raiz ventral e a entrada da raiz dorsal.',
    funcao:
      'Conduz o trato corticoespinal lateral — a principal via motora voluntária —, o trato espinotalâmico lateral (dor e temperatura, já cruzado) e os tratos espinocerebelares.',
    relacoes: 'O corticoespinal lateral é somatotópico, com as fibras cervicais mediais e as sacrais laterais.',
    clinica:
      'Essa somatotopia explica o poupamento sacral nas lesões intramedulares centrais — a sensibilidade perianal permanece porque suas fibras estão nas bordas — e, ao contrário, a preservação relativa dos membros superiores nas compressões extramedulares, que começam de fora. Reconhecer o poupamento sacral distingue lesão intra de extramedular à beira do leito.',
    memoria:
      'Sacral é o mais lateral, cervical é o mais medial. Lesão de dentro poupa o sacro; lesão de fora começa por ele.',
    pontos: [
      'Que tratos correm no funículo lateral?',
      'Como o corticoespinal lateral se organiza somatotopicamente?',
      'O que é o poupamento sacral e o que ele indica?',
    ],
  },
  {
    termos: ['Funículo Posterior'],
    classe: 'snc',
    resumo: 'Cordão posterior da medula, com os fascículos grácil e cuneiforme.',
    localizacao: 'Entre o sulco mediano posterior e a entrada da raiz dorsal, dividido acima de T6 pelo sulco intermédio posterior.',
    funcao:
      'Conduz propriocepção consciente, tato discriminativo e sensibilidade vibratória, ipsilateralmente e sem cruzar — as fibras só decussam no bulbo, como lemnisco medial. O fascículo grácil carrega o membro inferior; o cuneiforme, o superior.',
    vascularizacao: 'Artérias espinais posteriores.',
    relacoes: 'É a única grande via ascendente que sobe sem cruzar na medula.',
    clinica:
      'Sua degeneração seletiva ocorre na deficiência de vitamina B12 (degeneração combinada subaguda), na neurossífilis (tabes dorsalis) e na ataxia de Friedreich, com ataxia sensitiva e sinal de Romberg positivo — o paciente se equilibra com os olhos abertos e cai ao fechá-los, porque a visão compensava a propriocepção perdida. Romberg positivo é sinal de coluna posterior, não de cerebelo.',
    memoria:
      'Romberg positivo é coluna posterior. Se o paciente já cambaleia de olhos abertos, é cerebelo — e Romberg não se aplica.',
    pontos: [
      'Que modalidades o funículo posterior conduz?',
      'Onde suas fibras decussam?',
      'O que significa um sinal de Romberg positivo?',
    ],
  },
  {
    termos: ['Filamentos Radiculares'],
    classe: 'nervo',
    resumo: 'Feixes finos que emergem da medula e se reúnem para formar as raízes dorsal e ventral.',
    localizacao: 'Emergem em série ao longo dos sulcos laterais anterior e posterior de cada segmento medular.',
    funcao: 'Os anteriores são motores (axônios dos motoneurônios), os posteriores são sensitivos (prolongamentos centrais dos neurônios do gânglio espinal).',
    relacoes: 'Reúnem-se em raízes que se unem no forame intervertebral formando o nervo espinal.',
    clinica:
      'Essa separação anatômica entre motor e sensitivo tem consequência prática: a radiculopatia por hérnia comprime a raiz já formada e dá déficit misto, enquanto a poliomielite atinge apenas o corno anterior e dá déficit puramente motor. A anatomia da lesão dita a composição do déficit.',
    memoria:
      'Motor sai pela frente, sensitivo entra por trás. É a lei de Bell-Magendie, e ela vale em toda a medula.',
    pontos: [
      'Qual a diferença funcional entre filamentos anteriores e posteriores?',
      'Onde eles se reúnem?',
      'O que é a lei de Bell-Magendie?',
    ],
  },
  {
    termos: ['Raiz Dorsal do Nervo Espinal'],
    classe: 'nervo',
    resumo: 'Raiz sensitiva do nervo espinal, com o gânglio espinal no seu trajeto.',
    localizacao: 'Da face posterolateral da medula até o forame intervertebral, onde apresenta o gânglio espinal.',
    funcao: 'Conduz toda a informação sensitiva de um dermátomo à medula. Seus corpos celulares estão no gânglio, fora do sistema nervoso central.',
    relacoes: 'Une-se à raiz ventral distalmente ao gânglio para formar o nervo espinal.',
    clinica:
      'Como o gânglio fica fora da medula, uma lesão da raiz proximal ao gânglio (avulsão) não produz degeneração walleriana do nervo periférico, e o estudo de condução sensitiva vem normal apesar da anestesia — achado que distingue avulsão radicular de lesão do plexo, com implicações cirúrgicas opostas. Os dermátomos, mapeados por essas raízes, são a régua do exame sensitivo do trauma raquimedular.',
    memoria:
      'Anestesia com condução sensitiva normal só existe se a lesão for antes do gânglio — ou seja, dentro do canal.',
    pontos: [
      'Onde estão os corpos celulares das fibras da raiz dorsal?',
      'O que é um dermátomo?',
      'Como se distingue avulsão radicular de lesão de plexo?',
    ],
  },
  {
    termos: ['Gânglio Espinal'],
    classe: 'ganglio',
    resumo: 'Dilatação da raiz dorsal que aloja os corpos dos neurônios sensitivos pseudounipolares.',
    localizacao: 'No forame intervertebral, imediatamente antes da união com a raiz ventral.',
    funcao:
      'Contém neurônios pseudounipolares cujo prolongamento periférico vai ao receptor e o central entra na medula, sem sinapse no gânglio — não é uma estação de processamento, é apenas onde os corpos moram.',
    relacoes: 'Situa-se dentro do forame intervertebral, fora da dura-máter na maior parte dos níveis.',
    clinica:
      'É o santuário do vírus varicela-zóster, que ali permanece latente por décadas e, ao reativar, produz herpes-zóster com dor e vesículas restritas a um dermátomo — a imagem clínica mais didática de anatomia radicular que existe. A neuralgia pós-herpética é a sequela da destruição desses neurônios.',
    memoria:
      'Uma faixa de vesículas que para exatamente na linha média: é um dermátomo, e o vírus estava dormindo no gânglio.',
    pontos: [
      'Que tipo de neurônio o gânglio espinal contém?',
      'Por que não há sinapse nele?',
      'Que doença o utiliza como reservatório?',
    ],
  },
  {
    termos: ['Nervo Espinal'],
    classe: 'nervo',
    resumo: 'Tronco misto formado pela união das raízes ventral e dorsal no forame intervertebral.',
    localizacao: 'No forame intervertebral; logo após emergir, divide-se em ramo anterior e ramo posterior.',
    funcao:
      'Existem 31 pares. O nervo espinal propriamente dito é curtíssimo — poucos milímetros —, porque se divide imediatamente em ramo posterior, para a musculatura profunda do dorso e a pele dorsal, e ramo anterior, muito maior, para todo o resto.',
    relacoes: 'Os ramos anteriores formam os plexos cervical, braquial, lombar e sacral; os posteriores nunca formam plexo.',
    clinica:
      'Essa divisão é a razão de a musculatura profunda do dorso ser a única inervada segmentarmente, sem plexo — e por isso a única que preserva um padrão metamérico puro. Também explica por que lesões de plexo poupam completamente o dorso.',
    memoria:
      'Ramo posterior é pequeno e vai só para o dorso; ramo anterior é grande e faz todos os plexos. Um dorso metamérico, um corpo plexual.',
    pontos: [
      'Quantos pares de nervos espinais existem?',
      'Em que ramos o nervo espinal se divide?',
      'Por que os ramos posteriores não formam plexos?',
    ],
  },
  /* ─────────────────── Meninges ─────────────────── */
  {
    termos: ['Ligamento Denticulado'],
    classe: 'ligamento',
    resumo: 'Prega triangular da pia-máter que fixa lateralmente a medula à dura-máter.',
    localizacao:
      'De cada lado da medula, entre as raízes dorsal e ventral, com cerca de 21 processos triangulares que se fixam à dura-máter, do forame magno até T12.',
    funcao: 'Suspende a medula dentro do saco dural, mantendo-a centrada no líquor e amortecendo os movimentos da coluna.',
    relacoes: 'Divide o espaço subaracnóideo espinal em compartimentos anterior e posterior.',
    clinica:
      'É a referência cirúrgica de orientação na medula: como está sempre entre as raízes motora e sensitiva, ele indica ao cirurgião onde é anterior e onde é posterior. Sua secção é o primeiro passo da cordotomia anterolateral para dor oncológica refratária, em que se secciona o trato espinotalâmico contralateral.',
    memoria:
      'Vinte e um "dentes" de cada lado segurando a medula como um hamaca. E eles marcam a fronteira entre motor e sensitivo.',
    pontos: [
      'Qual a origem e a função do ligamento denticulado?',
      'Entre que estruturas ele se situa?',
      'Qual sua importância cirúrgica?',
    ],
  },
  {
    termos: ['Dura-máter e Aracnoide'],
    classe: 'meninge',
    resumo: 'As duas meninges externas, separadas por um espaço apenas virtual e atravessadas pelas raízes.',
    localizacao: 'A dura-máter forma o saco dural, que termina em S2; a aracnoide a forra por dentro, com o espaço subaracnóideo cheio de líquor abaixo dela.',
    funcao:
      'A dura é resistente e define o compartimento; a aracnoide é avascular e delimita o líquor. Entre elas há apenas um espaço virtual — o subdural —, e é por isso que o hematoma subdural se espalha livremente por toda a convexidade.',
    vascularizacao: 'Artérias meníngeas para a dura; a aracnoide é avascular.',
    inervacao: 'A dura-máter é ricamente inervada pelo trigêmeo e pelos primeiros cervicais; a aracnoide e a pia não têm inervação sensitiva.',
    relacoes: 'As veias-ponte atravessam o espaço subdural do córtex ao seio sagital superior.',
    clinica:
      'Duas consequências dominam a clínica. Como só a dura dói, a cefaleia de qualquer lesão intracraniana vem da tração dural — e o próprio cérebro é insensível, o que permite cirurgias com paciente acordado. E as veias-ponte, esticadas pela atrofia cerebral, rompem com traumas triviais no idoso: é o hematoma subdural crônico, em crescente, que cruza suturas mas não passa da foice.',
    memoria:
      'Extradural é lente biconvexa e não cruza sutura; subdural é crescente e cruza sutura. A dura aderida ao osso explica os dois.',
    pontos: [
      'Por que o hematoma subdural cruza suturas e o extradural não?',
      'Que estrutura dói na cefaleia de origem intracraniana?',
      'Que veias rompem no hematoma subdural crônico?',
    ],
  },
  {
    termos: ['Foice do Cérebro'],
    classe: 'meninge',
    resumo: 'Prega falciforme da dura-máter que desce na fissura longitudinal, entre os hemisférios.',
    localizacao: 'Da crista galli à protuberância occipital interna, fixando-se acima ao sulco do seio sagital superior.',
    funcao: 'Separa os hemisférios e limita seu deslocamento lateral. Contém o seio sagital superior na borda superior, o inferior na borda livre inferior e o seio reto na sua junção com a tenda.',
    relacoes: 'Sua borda livre inferior está próxima do corpo caloso e do giro do cíngulo.',
    clinica:
      'É a estrutura contra a qual ocorre a herniação subfalcina, em que o giro do cíngulo desliza sob a borda livre e pode comprimir a artéria cerebral anterior. Os meningiomas da foice e parassagitais são dos mais comuns e crescem lentamente até produzir paraparesia — um tumor de cabeça que se apresenta como problema de perna.',
    memoria:
      'A foice é uma parede rígida no meio do crânio. Cérebro inchado escorrega por baixo dela — e leva a artéria junto.',
    pontos: [
      'Que seios venosos a foice do cérebro contém?',
      'O que é a herniação subfalcina?',
      'Que artéria pode ser comprimida por ela?',
    ],
  },
  {
    termos: ['Tentório do Cerebelo'],
    classe: 'meninge',
    resumo: 'Prega dural horizontal que separa o cerebelo dos lobos occipitais.',
    localizacao:
      'Da protuberância occipital interna e dos sulcos dos seios transversos até os processos clinoides, com uma borda livre anterior que delimita a incisura da tenda.',
    funcao:
      'Divide a cavidade craniana em compartimentos supra e infratentorial e sustenta o peso dos lobos occipitais, impedindo que comprimam o cerebelo.',
    relacoes: 'Pela incisura da tenda passam o mesencéfalo, o III par e a artéria cerebral posterior.',
    clinica:
      'Essa incisura é o palco da herniação uncal: o unco desce por ela e comprime o III par (midríase), o mesencéfalo e a artéria cerebral posterior — cuja oclusão produz infarto occipital com hemianopsia, sequela frequente de quem sobrevive. A divisão em compartimentos organiza também a classificação de todos os tumores encefálicos entre supra e infratentoriais.',
    memoria:
      'A tenda tem um buraco no meio por onde passa o tronco. Tudo o que hernia para baixo passa por esse buraco.',
    pontos: [
      'Que compartimentos a tenda do cerebelo separa?',
      'Que estruturas atravessam a incisura da tenda?',
      'Que sequela a herniação uncal pode deixar?',
    ],
  },
  {
    termos: ['Seio Sagital Inferior'],
    classe: 'seio-venoso',
    resumo: 'Seio venoso da borda livre inferior da foice do cérebro.',
    localizacao: 'Borda inferior e livre da foice, acima do corpo caloso, correndo de diante para trás.',
    funcao: 'Drena a face medial dos hemisférios e a foice, terminando no seio reto ao se unir à veia cerebral magna.',
    relacoes: 'Corre imediatamente acima do giro do cíngulo.',
    clinica:
      'Sua trombose isolada é rara, mas ele participa da trombose do sistema venoso profundo, que é a forma mais grave de trombose venosa cerebral: acomete tálamos bilateralmente, com rebaixamento de consciência rápido e alta mortalidade. Diante de edema talâmico bilateral, a primeira hipótese é venosa, não arterial.',
    memoria:
      'Tálamos edemaciados dos dois lados quase nunca são AVC arterial — são trombose venosa profunda.',
    pontos: [
      'Onde corre o seio sagital inferior?',
      'Onde ele termina?',
      'Que achado de imagem sugere trombose venosa profunda?',
    ],
  },
  {
    termos: ['Seio Reto'],
    classe: 'seio-venoso',
    resumo: 'Seio venoso na junção da foice com a tenda, formado pela união do sagital inferior com a veia cerebral magna.',
    localizacao: 'Na linha média, da extremidade posterior da foice até a confluência dos seios.',
    funcao: 'Drena todo o sistema venoso profundo do encéfalo — tálamos, núcleos da base e substância branca profunda — para a confluência dos seios.',
    relacoes: 'Recebe a veia cerebral magna (de Galeno) na sua origem.',
    clinica:
      'É a via final do sistema venoso profundo, e por isso sua trombose ou a da veia de Galeno produz infarto venoso bilateral dos tálamos. A malformação da veia de Galeno, no recém-nascido, cursa com insuficiência cardíaca de alto débito e sopro craniano audível — uma cardiopatia cuja causa está na cabeça.',
    memoria:
      'Superficial drena pelo sagital superior; profundo drena pela veia de Galeno e pelo seio reto. Dois sistemas, uma confluência.',
    pontos: [
      'Que estruturas formam o seio reto?',
      'Que território ele drena?',
      'O que é a malformação da veia de Galeno?',
    ],
  },
  /* ─────────────────── Diencéfalo e vias visuais ─────────────────── */
  {
    termos: ['Diencéfalo'],
    classe: 'snc',
    resumo: 'Porção do encéfalo entre o telencéfalo e o mesencéfalo, formada por tálamo, hipotálamo, epitálamo e subtálamo.',
    localizacao: 'Ao redor do terceiro ventrículo, entre os hemisférios cerebrais e o tronco encefálico.',
    funcao:
      'O tálamo é a estação obrigatória de quase toda informação sensitiva a caminho do córtex — a olfação é a única exceção. O hipotálamo comanda o sistema autônomo, a hipófise, a temperatura, a fome, a sede e o ciclo circadiano.',
    vascularizacao: 'Ramos perfurantes da artéria cerebral posterior e da comunicante posterior.',
    relacoes: 'Suas paredes formam o terceiro ventrículo; abaixo estão o quiasma óptico, a haste hipofisária e os corpos mamilares.',
    clinica:
      'Que tudo passe pelo tálamo, menos o olfato, é a razão de a perda do olfato não acompanhar as síndromes talâmicas e de o olfato ser a única modalidade que chega direto ao córtex. A síndrome talâmica de Déjerine-Roussy produz hemi-hipoestesia seguida, semanas depois, de dor central intensa e refratária no mesmo hemicorpo.',
    memoria:
      'Tudo passa pelo tálamo, menos o cheiro. E o hipotálamo, embaixo, cuida de tudo o que o corpo faz sem você mandar.',
    pontos: [
      'Que estruturas compõem o diencéfalo?',
      'Que modalidade sensorial não passa pelo tálamo?',
      'O que é a síndrome de Déjerine-Roussy?',
    ],
  },
  {
    termos: ['Pulvinar do Tálamo'],
    classe: 'snc',
    resumo: 'Porção posterior e mais volumosa do tálamo, projetando-se sobre o teto do mesencéfalo.',
    localizacao: 'Extremidade posterior do tálamo, acima dos colículos superiores, medialmente aos corpos geniculados.',
    funcao: 'Núcleo de associação com conexões recíprocas com os córtices parietal, temporal e occipital; participa da atenção visual e da filtragem de estímulos relevantes.',
    vascularizacao: 'Artérias coroideas posteriores e ramos da cerebral posterior.',
    relacoes: 'Está imediatamente acima da glândula pineal e do teto mesencefálico.',
    clinica:
      'O "sinal do pulvinar" — hipersinal bilateral em ressonância — é o achado de imagem característico da variante da doença de Creutzfeldt-Jakob. Sua lesão participa também da negligência visual, e o pulvinar é hoje alvo experimental de neuromodulação em epilepsias refratárias.',
    memoria:
      '"Pulvinar" quer dizer travesseiro: é a almofada posterior do tálamo, deitada sobre o mesencéfalo.',
    pontos: [
      'Que funções o pulvinar desempenha?',
      'Que estruturas estão logo abaixo dele?',
      'O que é o sinal do pulvinar?',
    ],
  },
  {
    termos: ['Aderência Intertalâmica'],
    classe: 'snc',
    resumo: 'Ponte de substância cinzenta que une os dois tálamos através do terceiro ventrículo.',
    localizacao: 'Atravessa o terceiro ventrículo na sua porção média, unindo as faces mediais dos dois tálamos.',
    funcao:
      'Apesar do nome "comissura intertalâmica" às vezes usado, ela contém poucas fibras cruzadas: é sobretudo uma aderência de contato, ausente em cerca de 20 a 30% das pessoas, sem qualquer déficit associado.',
    relacoes: 'Atravessa o líquor do terceiro ventrículo.',
    clinica:
      'Sua ausência é variante normal e não deve ser interpretada como patologia. Em cirurgia endoscópica do terceiro ventrículo, ela é um obstáculo à visualização e às vezes precisa ser contornada — e sua secção inadvertida não produz déficit reconhecível, o que confirma seu papel funcional mínimo.',
    memoria:
      'Uma "ponte" entre os tálamos que um terço das pessoas não tem — e ninguém sente falta. Nem toda estrutura anatômica é essencial.',
    pontos: [
      'O que é a aderência intertalâmica?',
      'Ela é uma comissura verdadeira? Por quê?',
      'Que consequência tem sua ausência?',
    ],
  },
  {
    termos: ['Comissura Posterior'],
    classe: 'snc',
    resumo: 'Feixe de fibras que cruza a linha média na transição entre o diencéfalo e o mesencéfalo.',
    localizacao: 'Na parede posterior do terceiro ventrículo, acima da abertura do aqueduto e abaixo da glândula pineal.',
    funcao: 'Conecta as áreas pré-tectais dos dois lados, sendo a via do componente consensual do reflexo fotomotor, e participa do controle do olhar vertical.',
    relacoes: 'É o limite posterior do plano CA–CP usado em estereotaxia.',
    clinica:
      'Sua lesão é o elemento central da síndrome de Parinaud: paralisia do olhar vertical para cima, retração palpebral (sinal de Collier) e dissociação luz-perto das pupilas. Como está logo abaixo da pineal, qualquer tumor dessa região a compromete — e nos meninos é o pinealoma que se apresenta, além disso, com puberdade precoce.',
    memoria:
      'A comissura posterior é a "ponte" das pupilas e do olhar para cima. Tumor de pineal senta em cima dela.',
    pontos: [
      'Que funções a comissura posterior integra?',
      'Que síndrome sua lesão produz?',
      'Qual sua relação com a glândula pineal?',
    ],
  },
  {
    termos: ['Comissura das Habênulas'],
    classe: 'snc',
    resumo: 'Feixe que cruza a linha média unindo os núcleos habenulares dos dois lados.',
    localizacao: 'Na haste da glândula pineal, à frente e acima da comissura posterior.',
    funcao:
      'Conecta as habênulas, que recebem do sistema límbico pela estria medular do tálamo e projetam aos núcleos monoaminérgicos do tronco pelo fascículo retroflexo.',
    relacoes: 'Faz parte do epitálamo, junto com a pineal e as habênulas.',
    clinica:
      'A habênula lateral é hoje uma das estruturas mais estudadas na neurobiologia da depressão: ela é ativada por eventos aversivos e pela ausência de recompensa esperada, e sua hiperatividade está associada ao comportamento depressivo — sendo alvo experimental de estimulação cerebral profunda em depressão refratária.',
    memoria:
      'A habênula é o "centro da decepção": ela dispara quando a recompensa esperada não vem. Hiperativa, ela deprime.',
    pontos: [
      'Que estruturas a comissura das habênulas une?',
      'Que vias conectam as habênulas ao restante do encéfalo?',
      'Que relevância clínica moderna elas têm?',
    ],
  },
  {
    termos: ['Glândula Pineal'],
    classe: 'glandula',
    resumo: 'Glândula endócrina ímpar do epitálamo, produtora de melatonina.',
    localizacao: 'No teto posterior do terceiro ventrículo, entre os colículos superiores e sob o esplênio do corpo caloso.',
    funcao:
      'Converte o sinal de luz — que chega pela retina, pelo núcleo supraquiasmático e por uma via simpática que passa pelo gânglio cervical superior — em secreção de melatonina, que sobe no escuro e sincroniza o ritmo circadiano.',
    vascularizacao: 'Artérias coroideas posteriores.',
    relacoes: 'Calcifica-se com a idade na maioria dos adultos.',
    clinica:
      'A via simpática longa e tortuosa explica um achado curioso: a síndrome de Horner e a lesão cervical alta podem reduzir a secreção de melatonina. A calcificação fisiológica torna a pineal a melhor referência de linha média na tomografia — seu desvio quantifica o efeito de massa. Os tumores da região se apresentam com Parinaud e hidrocefalia.',
    memoria:
      'A pineal traduz "escuro" em melatonina. E, calcificada, ela é a régua da linha média na tomografia.',
    pontos: [
      'Como o sinal luminoso chega à glândula pineal?',
      'Que hormônio ela produz e quando?',
      'Por que ela é útil na leitura da tomografia?',
    ],
  },
  {
    termos: ['Corpos Mamilares', 'Corpo Mamilar'],
    classe: 'snc',
    resumo: 'Duas eminências esféricas na face inferior do hipotálamo, estação do circuito da memória.',
    localizacao: 'Face inferior do diencéfalo, atrás do túber cinéreo e à frente da fossa interpeduncular.',
    funcao: 'Recebem o fórnix, vindo do hipocampo, e projetam ao núcleo anterior do tálamo pelo trato mamilotalâmico — dois elos consecutivos do circuito de Papez.',
    vascularizacao: 'Ramos perfurantes da artéria comunicante posterior.',
    relacoes: 'Estão imediatamente atrás da haste hipofisária.',
    clinica:
      'São o sítio da lesão na encefalopatia de Wernicke, por deficiência de tiamina: hemorragias petequiais nos corpos mamilares e ao redor do terceiro ventrículo produzem a tríade de confusão, ataxia e oftalmoplegia. Não tratada, evolui para a psicose de Korsakoff, com amnésia anterógrada e confabulação — motivo pelo qual se administra tiamina antes de glicose em todo etilista.',
    memoria:
      'Tiamina antes da glicose. A glicose sem tiamina consome o que resta e precipita Wernicke.',
    pontos: [
      'Que conexões os corpos mamilares estabelecem?',
      'Qual a tríade da encefalopatia de Wernicke?',
      'Por que se administra tiamina antes de glicose?',
    ],
  },
  {
    termos: ['Bulbo Olfatório'],
    classe: 'snc',
    resumo: 'Estrutura ovoide sobre a lâmina cribiforme, primeira estação da via olfatória.',
    localizacao: 'Face inferior do lobo frontal, no sulco olfatório, apoiada sobre a lâmina cribiforme do etmoide.',
    funcao:
      'Recebe os filamentos do nervo olfatório e faz sinapse nos glomérulos com as células mitrais, cujos axônios formam o trato olfatório. É um dos dois únicos locais de neurogênese comprovada no adulto.',
    vascularizacao: 'Artéria olfatória, ramo da cerebral anterior.',
    relacoes: 'Está separado da mucosa nasal apenas pela espessura da lâmina cribiforme.',
    clinica:
      'Essa proximidade é uma porta: é por ela que a Naegleria fowleri e certos vírus alcançam o encéfalo, e é ela que explica a anosmia como sintoma precoce de infecções virais. A anosmia é também sinal precoce da doença de Parkinson e do Alzheimer, precedendo os sintomas em anos — o que fez do teste de olfato um instrumento de rastreio em pesquisa.',
    memoria:
      'A via olfatória é a única que chega ao córtex sem passar pelo tálamo — e é a mais curta ponte entre o nariz e o cérebro.',
    pontos: [
      'Que células fazem sinapse no bulbo olfatório?',
      'Por que a via olfatória é peculiar em relação ao tálamo?',
      'Em que doenças a anosmia é sinal precoce?',
    ],
  },
  {
    termos: ['Trato Olfatório'],
    classe: 'snc',
    resumo: 'Feixe que conduz os axônios das células mitrais do bulbo olfatório às áreas olfatórias primárias.',
    localizacao: 'No sulco olfatório, do bulbo até o trígono olfatório, onde se divide em estrias olfatórias medial e lateral.',
    funcao:
      'Leva a informação olfatória diretamente ao córtex piriforme, ao unco e à amígdala, sem relé talâmico — a única via sensorial com essa característica.',
    relacoes: 'Termina no trígono olfatório, à frente da substância perfurada anterior.',
    clinica:
      'A conexão direta com a amígdala e o córtex entorrinal, sem filtro talâmico, é a base neural de um fenômeno que todo mundo já viveu: um cheiro que evoca uma memória vívida e uma emoção imediata, sem mediação consciente. É também a razão de as crises uncinadas — epilepsia do lobo temporal mesial — começarem com uma alucinação olfatória desagradável.',
    memoria:
      'Cheiro vai direto para a memória e para a emoção, sem passar pelo tálamo. É por isso que um perfume te leva à infância.',
    pontos: [
      'Onde o trato olfatório termina?',
      'Por que a olfação não passa pelo tálamo?',
      'O que é uma crise uncinada?',
    ],
  },
  {
    termos: ['Nervo Óptico'],
    classe: 'nervo',
    resumo: 'II par craniano — na verdade um trato do sistema nervoso central, envolto pelas três meninges.',
    localizacao: 'Do disco óptico ao quiasma, atravessando a órbita e o canal óptico; mede cerca de 5 cm.',
    funcao:
      'Conduz os axônios das células ganglionares da retina. Não é um nervo periférico: é mielinizado por oligodendrócitos, envolto por meninges e banhado por líquor.',
    vascularizacao: 'Artéria central da retina e artérias ciliares posteriores curtas, ramos da oftálmica.',
    relacoes: 'A artéria central da retina corre dentro do nervo, entrando cerca de 1 cm atrás do globo.',
    clinica:
      'Ser sistema nervoso central explica tudo o que importa: ele não se regenera após secção, é alvo de doenças desmielinizantes como a neurite óptica da esclerose múltipla, e transmite a pressão intracraniana até o disco, produzindo papiledema. A perda visual monocular com dor à movimentação ocular e defeito pupilar aferente é neurite óptica até prova em contrário.',
    memoria:
      'O nervo óptico não é nervo: é cérebro esticado. Por isso não regenera e por isso o fundo de olho mostra a pressão do crânio.',
    pontos: [
      'Por que o nervo óptico é considerado um trato do SNC?',
      'Que consequências isso traz para regeneração e doenças?',
      'Como se manifesta a neurite óptica?',
    ],
  },
  {
    termos: ['Quiasma Óptico'],
    classe: 'snc',
    resumo: 'Cruzamento parcial das fibras dos nervos ópticos, acima da sela túrcica.',
    localizacao: 'Sobre o diafragma da sela, à frente da haste hipofisária, no assoalho do terceiro ventrículo.',
    funcao:
      'As fibras nasais de cada retina — que captam o campo visual temporal — cruzam para o lado oposto; as temporais seguem sem cruzar. É esse cruzamento parcial que permite a visão binocular e a representação de cada hemicampo num só hemisfério.',
    relacoes: 'Está imediatamente acima da hipófise e entre as duas artérias carótidas internas.',
    clinica:
      'A compressão de baixo, pelo macroadenoma hipofisário, atinge primeiro as fibras nasais cruzadas e produz hemianopsia bitemporal — o paciente perde a visão periférica dos dois lados e frequentemente só percebe ao bater em batentes de porta ou ao dirigir. É o defeito de campo mais característico da neuroanatomia, e ele nasce inteiramente da geometria do cruzamento.',
    memoria:
      'O que cruza é o nasal, e o nasal vê o temporal. Comprimiu no meio, perde os dois lados de fora: bitemporal.',
    pontos: [
      'Que fibras cruzam no quiasma óptico?',
      'Que defeito campimétrico a compressão central produz?',
      'Que estrutura está imediatamente abaixo do quiasma?',
    ],
  },
  {
    termos: ['Trato Óptico'],
    classe: 'snc',
    resumo: 'Feixe que vai do quiasma ao corpo geniculado lateral, já carregando o hemicampo contralateral.',
    localizacao: 'Do quiasma, contorna o pedúnculo cerebral e termina no corpo geniculado lateral do tálamo.',
    funcao:
      'Cada trato conduz as fibras temporais ipsilaterais e as nasais contralaterais — ou seja, todo o hemicampo visual oposto. Alguns axônios se desviam para a área pré-tectal, mediando o reflexo fotomotor, e para o núcleo supraquiasmático, sincronizando o relógio biológico.',
    relacoes: 'Contorna o pedúnculo cerebral; o corpo geniculado lateral tem seis camadas laminadas.',
    clinica:
      'A partir do trato óptico, todo defeito de campo é homônimo — atinge o mesmo hemicampo dos dois olhos. Essa é a regra que localiza a lesão: defeito monocular é anterior ao quiasma; heterônimo é quiasmático; homônimo é retroquiasmático. Três perguntas resolvem a topografia da via visual inteira.',
    memoria:
      'Um olho só: antes do quiasma. Bitemporal: no quiasma. Homônimo: depois do quiasma. Três respostas, três lugares.',
    pontos: [
      'Que fibras o trato óptico conduz?',
      'Que colaterais ele emite e para quê?',
      'Como o tipo de defeito de campo localiza a lesão?',
    ],
  },
  /* ─────────────────── Visão geral do encéfalo ─────────────────── */
  {
    termos: ['Telencéfalo', 'Telencéfalo - Hemisfério Direito', 'Telencéfalo - Hemisfério Esquerdo', 'Hemisfério Cerebral Direito', 'Hemisfério Cerebral Esquerdo'],
    classe: 'snc',
    resumo: 'A maior divisão do encéfalo: os dois hemisférios cerebrais, com córtex, substância branca e núcleos da base.',
    localizacao: 'Ocupa as fossas cranianas anterior e média e a região supratentorial, cobrindo o diencéfalo e o mesencéfalo.',
    funcao:
      'Sede das funções corticais superiores. Os hemisférios não são idênticos: no hemisfério dominante — o esquerdo em cerca de 95% dos destros e 70% dos canhotos — residem a linguagem e o cálculo; no não dominante, a atenção espacial, a prosódia e a percepção musical.',
    vascularizacao: 'Artérias cerebrais anterior, média e posterior, com territórios de fronteira entre elas.',
    relacoes: 'Separados pela fissura longitudinal e unidos pelo corpo caloso.',
    clinica:
      'Os territórios de fronteira entre as três artérias — as zonas de watershed — são os primeiros a sofrer em hipotensão sistêmica e parada cardíaca, produzindo o infarto "em rosário" e a síndrome do homem no barril, com fraqueza proximal dos braços e preservação distal. É a anatomia vascular explicando um padrão de déficit que parece arbitrário.',
    memoria:
      'Oclusão de artéria dá infarto no centro do território; queda de pressão dá infarto nas bordas. Dois mecanismos, dois mapas.',
    pontos: [
      'Como se distribui a dominância hemisférica?',
      'O que são zonas de watershed?',
      'O que é a síndrome do homem no barril?',
    ],
  },
  {
    termos: ['Fissura Longitudinal do Cérebro'],
    classe: 'snc',
    resumo: 'Fenda sagital profunda que separa os dois hemisférios cerebrais.',
    localizacao: 'Linha média, da região frontal à occipital, ocupada pela foice do cérebro.',
    funcao: 'Separa os hemisférios; no seu fundo está o corpo caloso, que os reconecta.',
    relacoes: 'As artérias cerebrais anteriores sobem por ela e se tornam pericalosas.',
    clinica:
      'É a via de acesso inter-hemisférica, usada para lesões do corpo caloso, do terceiro ventrículo e da região pineal — um corredor natural que evita atravessar córtex funcional. O sangue na fissura inter-hemisférica na tomografia é sinal de hemorragia subaracnóidea por aneurisma da comunicante anterior, e no lactente levanta a suspeita de trauma não acidental.',
    memoria:
      'Uma fenda que separa e uma ponte que reúne: fissura longitudinal por cima, corpo caloso por baixo.',
    pontos: [
      'Que estruturas ocupam a fissura longitudinal?',
      'Que artérias correm nela?',
      'O que sugere sangue nessa fissura na tomografia?',
    ],
  },
  {
    termos: ['Tronco Encefálico'],
    classe: 'snc',
    resumo: 'Conjunto formado por mesencéfalo, ponte e bulbo, por onde passa tudo o que liga o cérebro ao corpo.',
    localizacao: 'Da transição diencefálica ao forame magno, na fossa craniana posterior, à frente do cerebelo.',
    funcao:
      'Contém os núcleos de dez dos doze nervos cranianos (todos exceto o I e o II), todas as vias ascendentes e descendentes, e a formação reticular — responsável pelo nível de consciência e pelo controle cardiorrespiratório.',
    vascularizacao: 'Artéria basilar e vertebrais, com ramos paramedianos, circunferenciais curtos e longos.',
    relacoes: 'O quarto ventrículo fica entre ele e o cerebelo.',
    clinica:
      'A concentração de funções vitais num espaço pequeno é o que faz do tronco a estrutura cuja lesão define a morte encefálica: o protocolo avalia justamente reflexos de tronco — fotomotor, corneopalpebral, oculocefálico, vestibulocalórico, de tosse — e o teste de apneia. Cada reflexo testa um nível, e a ausência de todos define a morte de todo o eixo.',
    memoria:
      'Déficit cruzado — nervo craniano de um lado, corpo do outro — só existe no tronco. É a assinatura anatômica da região.',
    pontos: [
      'Que estruturas o tronco encefálico contém?',
      'Que núcleos de nervos cranianos não estão nele?',
      'Por que ele define a morte encefálica?',
    ],
  },
  /* ─────────────────── Vascularização encefálica ─────────────────── */
  {
    termos: ['Artéria Vertebral Direita', 'Artéria Vertebral Esquerda'],
    classe: 'arteria',
    resumo: 'Primeiro ramo da artéria subclávia, que sobe pelos forames transversos e entra no crânio pelo forame magno.',
    localizacao:
      'Quatro segmentos: V1 da subclávia ao forame transverso de C6; V2 dentro dos forames transversos até C2; V3 contornando o atlas no trígono suboccipital; V4 intradural, até unir-se à contralateral formando a basilar.',
    funcao: 'Irriga o bulbo, o cerebelo inferior e a medula cervical, e forma a circulação posterior do polígono de Willis.',
    relacoes: 'A esquerda costuma ser dominante; em cerca de 10% das pessoas uma delas é hipoplásica.',
    clinica:
      'O segmento V3, móvel e desprotegido, é o mais sujeito a dissecção por rotação cervical brusca — trauma, manipulação, até um espirro violento. O quadro é dor cervical e occipital seguida de sintomas de fossa posterior horas ou dias depois, e é uma das principais causas de AVC em adultos jovens. A hipoplasia de uma vertebral é variante normal e não deve ser lida como oclusão.',
    memoria:
      'Dor na nuca em jovem, seguida de vertigem e ataxia: pense em dissecção de vertebral, não em torcicolo.',
    pontos: [
      'Quais são os quatro segmentos da artéria vertebral?',
      'Que segmento é mais sujeito a dissecção e por quê?',
      'Que territórios ela irriga?',
    ],
  },
  {
    termos: ['Artéria Carótida Interna Esquerda'],
    classe: 'arteria',
    resumo: 'Ramo da carótida comum que entra no crânio pelo canal carótico e irriga a circulação anterior do encéfalo.',
    localizacao:
      'Da bifurcação carotídea, sobe sem emitir ramos no pescoço, entra pelo canal carótico, atravessa o seio cavernoso formando o sifão carotídeo e emerge medialmente ao processo clinoide anterior.',
    funcao: 'Dá a artéria oftálmica, a comunicante posterior, a coroidea anterior e termina bifurcando-se em cerebral anterior e cerebral média.',
    relacoes: 'No seio cavernoso é acompanhada pelo VI par e cercada pelo III, IV, V1 e V2 na parede lateral.',
    clinica:
      'Não emitir ramos no pescoço é o que permite o clampeamento seguro na endarterectomia. Dentro do seio cavernoso, sua rotura produz fístula carótido-cavernosa, com exoftalmia pulsátil, quemose e sopro orbital. E um aneurisma da comunicante posterior comprime o III par com midríase — motivo pelo qual paralisia do III com pupila dilatada é aneurisma até prova em contrário.',
    memoria:
      'Paralisia do III com pupila grande = aneurisma (compressão de fora). Com pupila normal = isquemia (diabete, de dentro).',
    pontos: [
      'Que ramos a carótida interna emite no crânio?',
      'O que é a fístula carótido-cavernosa?',
      'Por que a pupila diferencia as causas de paralisia do III par?',
    ],
  },
  {
    termos: ['Artéria Cerebral Posterior Direita', 'Artéria Cerebral Posterior Esquerda'],
    classe: 'arteria',
    resumo: 'Ramo terminal da artéria basilar, que irriga o lobo occipital, o temporal medial e o tálamo.',
    localizacao: 'Da bifurcação da basilar, contorna o mesencéfalo e alcança a face medial do lobo occipital.',
    funcao: 'Irriga o córtex visual, o hipocampo e o giro para-hipocampal, o tálamo e o mesencéfalo por ramos perfurantes.',
    relacoes: 'Recebe a comunicante posterior, que a liga à carótida interna, fechando o polígono de Willis.',
    clinica:
      'Sua oclusão produz hemianopsia homônima contralateral com poupamento macular, sem déficit motor. Quando bilateral — por embolia no topo da basilar —, causa cegueira cortical: o paciente não enxerga mas tem pupilas reativas e fundo de olho normal, e às vezes nega a cegueira (síndrome de Anton). É também a artéria comprimida na herniação uncal.',
    memoria:
      'Cego com pupila que reage e fundo de olho normal: a lesão está no córtex, não no olho.',
    pontos: [
      'Que territórios a cerebral posterior irriga?',
      'Que déficit sua oclusão unilateral produz?',
      'O que é a síndrome de Anton?',
    ],
  },
  {
    termos: ['Artéria Comunicante Posterior Esquerda'],
    classe: 'arteria',
    resumo: 'Ramo que une a carótida interna à cerebral posterior, fechando lateralmente o polígono de Willis.',
    localizacao: 'Da face posterior da carótida interna à artéria cerebral posterior, sobre o nervo oculomotor.',
    funcao: 'Estabelece a comunicação entre as circulações anterior e posterior, permitindo suprimento colateral quando uma delas falha.',
    relacoes: 'O nervo oculomotor passa imediatamente abaixo dela.',
    clinica:
      'É o segundo local mais comum de aneurisma intracraniano, e sua relação com o III par produz o sinal mais característico da neurocirurgia vascular: paralisia do oculomotor com midríase, porque as fibras parassimpáticas pupilares correm na periferia do nervo e são as primeiras a serem comprimidas. Uma pupila que dilata é indicação de angiotomografia imediata.',
    memoria:
      'A comunicante posterior deita sobre o III par. Aneurisma ali dilata a pupila antes de qualquer outra coisa.',
    pontos: [
      'Que artérias a comunicante posterior conecta?',
      'Que nervo passa abaixo dela?',
      'Por que a midríase é o primeiro sinal de compressão do III par?',
    ],
  },
  {
    termos: ['Artéria Cerebelar Superior Direita', 'Artéria Cerebelar Superior Esquerda'],
    classe: 'arteria',
    resumo: 'Último ramo da basilar antes de sua bifurcação, que irriga a face superior do cerebelo.',
    localizacao: 'Nasce da basilar imediatamente abaixo da sua bifurcação, contorna o mesencéfalo abaixo do nervo oculomotor.',
    funcao: 'Irriga a face superior do cerebelo, o verme superior, o núcleo denteado e parte do tegmento pontino superior.',
    relacoes: 'O nervo troclear passa entre ela e a cerebral posterior; a artéria costuma comprimir a raiz do trigêmeo.',
    clinica:
      'É a artéria responsável pelo conflito neurovascular da neuralgia do trigêmeo em cerca de 75% dos casos, e é ela que se afasta na descompressão microvascular. Seu infarto produz ataxia ipsilateral, disartria e, quando extenso, edema com compressão do quarto ventrículo — situação em que a craniectomia suboccipital salva a vida.',
    memoria:
      'A cerebelar superior é a "vizinha barulhenta" do trigêmeo. Afastar as duas cura a neuralgia.',
    pontos: [
      'Que territórios a artéria cerebelar superior irriga?',
      'Que nervo ela frequentemente comprime?',
      'Que risco tem o infarto cerebelar extenso?',
    ],
  },
  {
    termos: ['Artéria Cerebelar Inferior Anterior Esquerda'],
    classe: 'arteria',
    resumo: 'Ramo da basilar que irriga a face anteroinferior do cerebelo e a ponte lateral.',
    localizacao: 'Nasce do terço inferior da basilar e corre em direção ao ângulo pontocerebelar.',
    funcao: 'Irriga o flóculo, o pedúnculo cerebelar médio, a ponte lateral e — por meio da artéria labiríntica, seu ramo — a orelha interna.',
    relacoes: 'Faz uma alça no ângulo pontocerebelar, em contato com os nervos VII e VIII.',
    clinica:
      'Seu infarto produz a síndrome pontina lateral, que se distingue da síndrome bulbar lateral por acrescentar surdez súbita e paralisia facial periférica — porque só ela irriga a orelha interna e o núcleo do facial. Surdez súbita unilateral com vertigem e ataxia não é labirintite: é AVC até prova em contrário.',
    memoria:
      'Wallenberg não fica surdo; o infarto da cerebelar inferior anterior fica. A surdez é o que separa as duas síndromes.',
    pontos: [
      'Que territórios essa artéria irriga?',
      'Que ramo importante ela emite?',
      'Como diferenciar seu infarto da síndrome bulbar lateral?',
    ],
  },
  {
    termos: ['Artéria Cerebelar Inferior Posterior Direita'],
    classe: 'arteria',
    resumo: 'Maior ramo da artéria vertebral, que irriga a face inferior do cerebelo e o bulbo lateral.',
    localizacao: 'Nasce da porção intradural da vertebral, contorna o bulbo e alcança a face inferior do cerebelo.',
    funcao: 'Irriga a região lateral do bulbo, o pedúnculo cerebelar inferior, o verme inferior, as tonsilas e o plexo corióideo do quarto ventrículo.',
    relacoes: 'Sua alça caudal desce até próximo do forame magno, em relação com as tonsilas cerebelares.',
    clinica:
      'Sua oclusão — ou a da vertebral, mais frequentemente — produz a síndrome de Wallenberg, a mais comum das síndromes de tronco: vertigem, disfagia, rouquidão, soluços, Horner e ataxia ipsilaterais, com perda termoalgésica cruzada. É notável que não haja fraqueza: a pirâmide fica na face anterior, fora do território. Reconhecer isso evita descartar o AVC por "não ter déficit motor".',
    memoria:
      'AVC sem fraqueza nenhuma existe: Wallenberg. Se você exigir hemiparesia para diagnosticar AVC, vai perder este.',
    pontos: [
      'Que territórios essa artéria irriga?',
      'Que síndrome sua oclusão produz?',
      'Por que não há hemiparesia nessa síndrome?',
    ],
  },
  {
    termos: ['Artéria Labiríntica Esquerda'],
    classe: 'arteria',
    resumo: 'Ramo fino que acompanha os nervos VII e VIII até a orelha interna, geralmente da cerebelar inferior anterior.',
    localizacao: 'Entra no meato acústico interno com os nervos facial e vestibulococlear e se distribui à cóclea e ao vestíbulo.',
    funcao: 'É a única fonte de sangue da orelha interna: cóclea, sáculo, utrículo e canais semicirculares dependem exclusivamente dela.',
    relacoes: 'Nasce da cerebelar inferior anterior em cerca de 80% dos casos, e diretamente da basilar nos demais.',
    clinica:
      'Ser artéria terminal, sem colaterais, é o que torna a orelha interna tão vulnerável: sua oclusão produz surdez neurossensorial súbita e irreversível com vertigem intensa. Em paciente com fatores de risco vascular, a surdez súbita deve ser investigada como possível evento isquêmico de circulação posterior, e não apenas como perda auditiva idiopática.',
    memoria:
      'Uma artéria fininha e única alimentando a orelha interna. Fechou, não tem plano B — a audição não volta.',
    pontos: [
      'De que artéria a labiríntica costuma se originar?',
      'Que estruturas ela irriga?',
      'Por que sua oclusão causa perda auditiva irreversível?',
    ],
  },
]
