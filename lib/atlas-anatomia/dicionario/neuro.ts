import type { EntradaDicionario } from './tipos'

/**
 * Sistema nervoso.
 *
 * Cada entrada responde por títulos exatos do acervo. Ver `tipos.ts` para a
 * régua de redação e para o motivo de o casamento ser por igualdade.
 */
export const NEURO: EntradaDicionario[] = [
  {
    termos: ['Nervo Mediano'],
    resumo: 'Nervo do compartimento anterior do antebraço e da musculatura tenar — o nervo da preensão fina.',
    localizacao:
      'Formado pelos fascículos lateral e medial, desce no braço junto à artéria braquial sem inervar nada nele, cruza a fossa cubital, passa entre as cabeças do pronador redondo e entra na mão pelo túnel do carpo.',
    funcao:
      'Inerva quase todos os flexores do antebraço (exceto o flexor ulnar do carpo e a metade medial do flexor profundo), os três músculos tenares e os dois lumbricais laterais; sensibilidade dos três dedos e meio laterais na palma.',
    clinica:
      'Lesão alta: "mão do pregador", com incapacidade de fletir os dedos indicador e médio ao tentar fechar a mão. Lesão no túnel do carpo: parestesia noturna, atrofia tenar e perda da oposição, com a pele da eminência tenar poupada. Testes de Phalen e Tinel.',
    pontos: [
      'Não inerva nada no braço',
      'Mão do pregador (lesão alta) x atrofia tenar (túnel do carpo)',
      'Ramo cutâneo palmar passa por fora do túnel',
    ],
  },
  {
    termos: ['Nervo Ulnar'],
    resumo: 'Nervo do fascículo medial, comandante da musculatura intrínseca da mão.',
    localizacao:
      'Desce medialmente no braço, atravessa o septo intermuscular medial, passa pelo sulco do nervo ulnar atrás do epicôndilo medial e entra na mão pelo canal de Guyon, superficial ao retináculo dos flexores.',
    funcao:
      'Inerva o flexor ulnar do carpo e a metade medial do flexor profundo dos dedos, além de quase toda a musculatura intrínseca da mão; sensibilidade do dedo mínimo e da metade medial do anular.',
    clinica:
      'Lesão no cotovelo ou no punho produz a mão em garra, mais evidente na lesão distal (paradoxo ulnar: quanto mais distal, pior a garra, porque o flexor profundo continua funcionando). O sinal de Froment testa o adutor do polegar. O canal de Guyon poupa a sensibilidade dorsal.',
    pontos: [
      'Sulco atrás do epicôndilo medial e canal de Guyon',
      'Mão em garra e sinal de Froment',
      'Paradoxo ulnar: lesão distal dá garra maior',
    ],
  },
  {
    termos: ['Nervo Musculocutâneo'],
    resumo: 'Ramo do fascículo lateral que inerva o compartimento anterior do braço.',
    localizacao: 'Perfura o músculo coracobraquial e desce entre o bíceps e o braquial, emergindo lateralmente como nervo cutâneo lateral do antebraço.',
    funcao: 'Inerva coracobraquial, bíceps braquial e braquial; sensibilidade da face lateral do antebraço.',
    clinica: 'Sua lesão isolada é rara; quando ocorre, a flexão do cotovelo é preservada em parte pelo braquiorradial (nervo radial), o que pode mascarar o déficit. O reflexo bicipital fica abolido.',
    pontos: ['Perfura o coracobraquial', 'Bíceps, braquial e coracobraquial', 'Flexão do cotovelo parcialmente preservada pelo braquiorradial'],
  },
  {
    termos: ['Nervo Isquiático'],
    resumo: 'O maior e mais calibroso nervo do corpo, formado por L4 a S3.',
    localizacao: 'Sai da pelve pelo forame isquiático maior, abaixo do piriforme, desce na face posterior da coxa e se divide, geralmente na fossa poplítea, em tibial e fibular comum.',
    funcao: 'Inerva os isquiotibiais e, por seus ramos terminais, toda a musculatura da perna e do pé; sensibilidade de quase todo o membro abaixo do joelho.',
    clinica:
      'A ciatalgia é mais comumente radicular (hérnia L4–L5 ou L5–S1) que troncular. Lesão alta abole a flexão do joelho e tudo abaixo dele. A injeção intramuscular no quadrante superolateral da nádega existe justamente para evitá-lo.',
    pontos: ['L4–S3; sai abaixo do piriforme', 'Divide-se em tibial e fibular comum', 'Injeção no quadrante superolateral da nádega'],
  },
  {
    termos: ['Nervo Tibial'],
    resumo: 'Ramo maior do isquiático, nervo do compartimento posterior da perna e da planta do pé.',
    localizacao: 'Desce pela fossa poplítea e pelo compartimento posterior profundo, passando atrás do maléolo medial no túnel do tarso.',
    funcao: 'Inerva o tríceps sural e os flexores dos dedos; pelos nervos plantares, quase toda a musculatura intrínseca do pé e a sensibilidade da planta.',
    clinica:
      'A síndrome do túnel do tarso comprime o nervo atrás do maléolo medial, com dor e parestesia plantar. Sua lesão abole a flexão plantar e o reflexo aquileu (S1) e anestesia a planta — um risco grave no paciente diabético.',
    pontos: ['Túnel do tarso atrás do maléolo medial', 'Reflexo aquileu = S1', 'Sensibilidade plantar e risco de úlcera'],
  },
  {
    termos: ['Cauda Equina'],
    classe: 'nervo',
    resumo: 'Feixe de raízes lombares, sacrais e coccígeas que desce no canal vertebral abaixo do cone medular.',
    localizacao: 'No saco dural, de L1–L2 até o fim do canal, em torno do filamento terminal.',
    funcao: 'Conduz as raízes que inervam os membros inferiores, o períneo e os esfíncteres até seus respectivos forames.',
    clinica:
      'A síndrome da cauda equina — hérnia volumosa, tumor ou abscesso — cursa com anestesia em sela, retenção urinária, incontinência fecal e déficit assimétrico dos membros inferiores. É emergência cirúrgica de descompressão.',
    pontos: ['Abaixo do cone medular (L1–L2)', 'Espaço seguro para a punção lombar', 'Síndrome da cauda equina é emergência'],
  },
  {
    termos: ['Bulbo'],
    resumo: 'Porção mais caudal do tronco encefálico, entre a ponte e a medula espinal.',
    localizacao: 'Da decussação das pirâmides, no forame magno, até o sulco bulbopontino; contém as pirâmides à frente e as olivas lateralmente.',
    funcao:
      'Abriga os centros respiratório e vasomotor, os núcleos dos nervos cranianos IX, X, XI e XII e a decussação das pirâmides — onde a via corticoespinal cruza.',
    vascularizacao: 'Ramos paramedianos da artéria vertebral (bulbo medial) e artéria cerebelar póstero-inferior/PICA (bulbo lateral).',
    clinica:
      'A síndrome de Wallenberg (bulbo lateral, PICA) combina síndrome de Horner ipsilateral, hipoestesia térmico-dolorosa da hemiface ipsilateral e do corpo contralateral, disfagia e ataxia. A lesão bulbar medial dá hemiparesia contralateral com desvio da língua para o lado da lesão.',
    pontos: ['Centros respiratório e vasomotor', 'Decussação das pirâmides', 'Síndrome de Wallenberg (PICA)'],
  },
  {
    termos: ['Ponte'],
    resumo: 'Porção média e volumosa do tronco encefálico, entre o mesencéfalo e o bulbo.',
    localizacao: 'À frente do cerebelo, ao qual se liga pelos pedúnculos cerebelares médios; contém o IV ventrículo em sua face posterior.',
    funcao: 'Contém os núcleos dos nervos cranianos V, VI, VII e VIII, os núcleos pontinos que fazem a ponte córtico-ponto-cerebelar e o centro pneumotáxico.',
    vascularizacao: 'Ramos perfurantes da artéria basilar.',
    clinica:
      'A lesão pontina ventral extensa pode produzir a síndrome do encarceramento (locked-in): tetraplegia e anartria com consciência preservada e movimentos oculares verticais intactos. A hemorragia pontina hipertensiva cursa com pupilas puntiformes reativas.',
    pontos: ['Núcleos de V, VI, VII e VIII', 'Pedúnculos cerebelares médios', 'Síndrome locked-in'],
  },
  {
    termos: ['Mesencéfalo'],
    resumo: 'Porção mais rostral do tronco encefálico, atravessada pelo aqueduto do mesencéfalo.',
    localizacao: 'Entre o diencéfalo e a ponte, com os pedúnculos cerebrais à frente e a lâmina do teto (colículos) atrás.',
    funcao:
      'Contém os núcleos dos nervos III e IV, a substância negra, o núcleo rubro e os colículos superior (reflexos visuais) e inferior (via auditiva).',
    vascularizacao: 'Ramos da artéria cerebral posterior e da comunicante posterior.',
    clinica:
      'A síndrome de Weber (base do pedúnculo) associa paralisia do III ipsilateral com hemiparesia contralateral. A degeneração da substância negra é a base da doença de Parkinson. A compressão do aqueduto causa hidrocefalia obstrutiva.',
    pontos: ['Núcleos de III e IV', 'Substância negra e Parkinson', 'Aqueduto do mesencéfalo e hidrocefalia obstrutiva'],
  },
  {
    termos: ['Tálamo'],
    resumo: 'Grande massa de substância cinzenta do diencéfalo — a estação de retransmissão sensorial do encéfalo.',
    localizacao: 'De cada lado do III ventrículo, acima do hipotálamo, medialmente à cápsula interna.',
    funcao:
      'Retransmite ao córtex praticamente toda a informação sensorial (exceto a olfatória), além de participar dos circuitos motores, límbicos e da regulação da consciência.',
    vascularizacao: 'Ramos perfurantes da cerebral posterior e da comunicante posterior.',
    clinica:
      'O infarto talâmico causa hemianestesia contralateral completa e pode evoluir para a síndrome de Déjerine-Roussy, com dor central intratável. A hemorragia talâmica hipertensiva costuma cursar com desvio ocular para baixo e para dentro.',
    pontos: ['Estação de todas as vias sensitivas, menos a olfatória', 'Hemianestesia contralateral no infarto', 'Dor central de Déjerine-Roussy'],
  },
  {
    termos: ['Hipotálamo'],
    resumo: 'Pequena região do diencéfalo que comanda o sistema autônomo e o eixo endócrino.',
    localizacao: 'Abaixo do tálamo, formando o assoalho e as paredes inferiores do III ventrículo, ligado à hipófise pelo infundíbulo.',
    funcao: 'Regula temperatura, fome, sede, sono, comportamento sexual, resposta ao estresse e controla a hipófise por hormônios liberadores e pela neuro-hipófise.',
    clinica:
      'Lesões hipotalâmicas produzem diabetes insípido central, alterações de temperatura, distúrbios do apetite e do ciclo sono-vigília. O núcleo supraquiasmático é o relógio biológico central.',
    pontos: ['Controla a hipófise e o sistema autônomo', 'Termorregulação, fome, sede e sono', 'Diabetes insípido central nas lesões'],
  },
  {
    termos: ['Corpo Caloso'],
    resumo: 'A maior comissura do encéfalo, unindo os dois hemisférios cerebrais.',
    localizacao: 'No fundo da fissura longitudinal, com rostro, joelho, tronco e esplênio, formando o teto dos ventrículos laterais.',
    funcao: 'Transfere informação entre os hemisférios, permitindo a integração bilateral da percepção, do movimento e da linguagem.',
    vascularizacao: 'Artéria cerebral anterior (pericalosa) e ramos da cerebral posterior no esplênio.',
    clinica:
      'A síndrome de desconexão calosa produz alexia sem agrafia e a mão alienígena. A calosotomia foi usada como tratamento de epilepsia refratária. Lesões no esplênio aparecem em encefalopatias e desmielinização.',
    pontos: ['Maior comissura inter-hemisférica', 'Teto dos ventrículos laterais', 'Síndromes de desconexão'],
  },
  {
    termos: ['Cápsula Interna'],
    resumo: 'Feixe compacto de substância branca entre os núcleos da base, por onde passam as vias motoras e sensitivas.',
    localizacao: 'Entre o núcleo caudado e o tálamo (medialmente) e o núcleo lentiforme (lateralmente), com perna anterior, joelho e perna posterior.',
    funcao: 'Conduz as fibras corticoespinais, corticobulbares e talamocorticais entre o córtex e o tronco/medula, concentrando num espaço pequeno vias de todo o corpo.',
    vascularizacao: 'Artérias lenticuloestriadas, ramos perfurantes da cerebral média.',
    clinica:
      'É por essa compactação que uma lesão minúscula ali produz hemiplegia completa contralateral — o AVC lacunar motor puro. É também o sítio típico da hemorragia hipertensiva.',
    pontos: ['Perna posterior conduz a via corticoespinal', 'Lenticuloestriadas: lacunas e hemorragia hipertensiva', 'Hemiplegia completa por lesão pequena'],
  },
  {
    termos: ['Ventrículo Lateral', 'III Ventrículo', 'IV Ventrículo'],
    resumo: 'Cavidades encefálicas por onde circula o líquido cerebrospinal.',
    localizacao:
      'Dois ventrículos laterais nos hemisférios, ligados pelos forames interventriculares ao III ventrículo (diencéfalo), que se liga pelo aqueduto do mesencéfalo ao IV ventrículo, entre a ponte e o cerebelo.',
    funcao: 'Contêm os plexos corióideos, que produzem cerca de 500 mL de líquido cerebrospinal por dia, e o conduzem até o espaço subaracnóideo pelos forames de Luschka e Magendie.',
    clinica:
      'O aqueduto do mesencéfalo é o ponto mais estreito do circuito e o local clássico de estenose causadora de hidrocefalia obstrutiva. A dilatação ventricular na imagem indica o nível do bloqueio, e o ventrículo lateral é o alvo da derivação ventricular externa.',
    pontos: [
      'Laterais → III (forame interventricular) → aqueduto → IV → subaracnóideo',
      'Plexos corióideos produzem ~500 mL/dia',
      'Estenose de aqueduto e hidrocefalia obstrutiva',
    ],
  },
  {
    termos: ['Dura-Máter'],
    resumo: 'A meninge mais externa, espessa e resistente, com dois folhetos no crânio.',
    localizacao: 'Adere ao periósteo interno do crânio e envia pregas para dentro — foice do cérebro, tenda do cerebelo, foice do cerebelo e diafragma da sela.',
    funcao: 'Protege o encéfalo, compartimenta a cavidade craniana limitando deslocamentos e aloja os seios venosos entre seus folhetos.',
    vascularizacao: 'Artéria meníngea média, principalmente.',
    inervacao: 'Ramos meníngeos do trigêmeo e dos nervos cervicais superiores — é sensível à dor, ao contrário do parênquima encefálico.',
    clinica:
      'Suas pregas definem os padrões de herniação: subfalcina sob a foice, uncal pela incisura da tenda e tonsilar pelo forame magno. Sua inervação explica a cefaleia da meningite, da hemorragia subaracnóidea e da hipotensão liquórica pós-punção.',
    pontos: ['Foice e tenda definem os padrões de herniação', 'Sensível à dor (o encéfalo não é)', 'Seios venosos entre seus folhetos'],
  },
  {
    termos: ['Pia-máter'],
    resumo: 'Meninge mais interna, finíssima e vascularizada, aderida à superfície do tecido nervoso.',
    localizacao: 'Reveste intimamente giros e sulcos do encéfalo e a superfície da medula, acompanhando os vasos que penetram o parênquima.',
    funcao: 'Sustenta os vasos superficiais, forma o espaço perivascular (de Virchow-Robin) e, na medula, os ligamentos denticulados e o filamento terminal.',
    clinica: 'Os espaços de Virchow-Robin são vias de disseminação de infecções e de células neoplásicas; sua dilatação aparece na ressonância como pequenos focos liquóricos.',
    pontos: ['Aderida ao tecido nervoso', 'Espaços de Virchow-Robin', 'Forma os ligamentos denticulados na medula'],
  },
  {
    termos: ['Cerebelo'],
    classe: 'snc',
    resumo: 'Órgão da fossa craniana posterior que calibra o movimento — não o inicia, mas decide como ele sai.',
    localizacao:
      'Atrás da ponte e do bulbo, sob a tenda do cerebelo, separado dos lobos occipitais. Tem dois hemisférios, o vérmis na linha média e três pares de pedúnculos que o ligam ao tronco encefálico; à frente dele fica o IV ventrículo.',
    funcao:
      'Compara a ordem motora enviada pelo córtex com o que de fato aconteceu, informado pela propriocepção, e corrige a diferença em tempo real. É isso que dá suavidade, precisão e sincronia ao movimento, além de sustentar equilíbrio, tônus e aprendizado motor.',
    vascularizacao:
      'Três artérias, todas do sistema vertebrobasilar: cerebelar superior e ântero-inferior (AICA), da basilar, e póstero-inferior (PICA), da vertebral.',
    inervacao: 'Não emite nervos periféricos; comunica-se pelos pedúnculos cerebelares e envia sua saída pelos núcleos profundos, sobretudo o núcleo denteado.',
    relacoes: 'Ocupa um compartimento apertado: o IV ventrículo à frente, o tronco encefálico adiante e o forame magno logo abaixo.',
    clinica:
      'A regra de ouro é a lateralidade: o cerebelo age no mesmo lado, então a lesão de um hemisfério dá ataxia, dismetria e disdiadococinesia ipsilaterais — o oposto do que se espera de uma lesão cortical. Lesão do vérmis dá ataxia de tronco e marcha ebriosa. E como o espaço é estreito, o edema cerebelar comprime o IV ventrículo e produz hidrocefalia aguda, com risco de herniação tonsilar.',
    pontos: [
      'Sinais cerebelares são ipsilaterais à lesão',
      'Hemisférios = membros; vérmis = tronco e marcha',
      'PICA, AICA e cerebelar superior — e a síndrome de Wallenberg',
    ],
  },
  {
    termos: ['Medula Espinal'],
    classe: 'snc',
    resumo: 'Continuação do tronco encefálico dentro do canal vertebral, do forame magno até o cone medular em L1–L2.',
    localizacao:
      'Ocupa o canal vertebral envolvida pelas meninges, com substância cinzenta central em forma de H e substância branca periférica organizada em funículos. Apresenta duas intumescências: cervical (C4–T1, membro superior) e lombossacral (L2–S3, membro inferior).',
    funcao:
      'Conduz as vias descendentes motoras e ascendentes sensitivas entre encéfalo e corpo, e fecha por conta própria os arcos reflexos — é por isso que o reflexo patelar acontece antes de você perceber a martelada.',
    vascularizacao:
      'Artéria espinal anterior (dois terços anteriores) e duas espinais posteriores, reforçadas pelas radiculares; a maior delas, a artéria de Adamkiewicz, entra geralmente à esquerda entre T9 e L2.',
    inervacao: '31 pares de nervos espinais, cada um com raiz dorsal sensitiva (com gânglio) e raiz ventral motora.',
    relacoes: 'Termina bem acima do fim do canal: abaixo de L2 há apenas cauda equina e líquido cerebrospinal — o espaço que torna a punção lombar segura.',
    clinica:
      'A dissociação entre nível vertebral e nível medular é o que explica tanto a punção lombar quanto o fato de uma fratura de T12 poder lesar segmentos lombares. A síndrome da artéria espinal anterior poupa os cordões posteriores: perde-se motricidade, dor e temperatura, e preserva-se propriocepção e vibração.',
    pontos: [
      'Cone medular em L1–L2 no adulto',
      'Punção lombar abaixo de L3, na cauda equina',
      'Espinal anterior: 2/3 anteriores; cordões posteriores poupados',
    ],
  },
  {
    termos: ['Lobo Occipital', 'Lobo Frontal', 'Lobo Parietal', 'Lobo Temporal'],
    classe: 'snc',
    resumo: 'Lobo do hemisfério cerebral, delimitado por sulcos constantes e definido pela função que concentra.',
    localizacao:
      'O sulco central separa frontal de parietal; o sulco lateral delimita o temporal; o occipital ocupa o polo posterior, atrás do sulco parieto-occipital. A ínsula fica escondida no fundo do sulco lateral.',
    funcao:
      'Frontal: motricidade, funções executivas e a área de Broca. Parietal: sensibilidade somática e integração espacial. Temporal: audição, memória e a área de Wernicke. Occipital: visão, com a área calcarina.',
    vascularizacao:
      'Cerebral anterior para a face medial (território do membro inferior), cerebral média para a face lateral (face e membro superior) e cerebral posterior para o occipital e a face inferior do temporal.',
    clinica:
      'Cada lobo tem sua síndrome: hemiparesia braquiofacial e afasia na cerebral média, incontinência e abulia na cerebral anterior, hemianopsia homônima com preservação macular na cerebral posterior. É esse mapa que transforma o exame neurológico em localização topográfica antes da tomografia.',
    pontos: [
      'Sulco central separa motor de sensitivo',
      'Broca no frontal inferior; Wernicke no temporal superior',
      'Território arterial de cada lobo',
    ],
  },
]
