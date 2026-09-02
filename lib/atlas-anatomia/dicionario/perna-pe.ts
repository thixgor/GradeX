import type { EntradaDicionario } from './tipos'

/**
 * Perna, tornozelo e pé.
 *
 * O pé humano é uma estrutura de compromisso: precisa ser rígido para empurrar
 * o corpo e flexível para se adaptar ao chão. Os arcos, os retináculos e os
 * tendões que os cruzam existem para alternar entre esses dois estados a cada
 * passo — e quase toda a patologia do pé é a falha dessa alternância.
 */
export const PERNA_PE: EntradaDicionario[] = [
  /* ─────────────────── Tíbia ─────────────────── */
  {
    termos: ['Eminência Intercondilar'],
    classe: 'acidente-osseo',
    resumo: 'Crista no meio do platô tibial, entre as duas superfícies articulares, com dois tubérculos.',
    localizacao: 'Centro da face superior da tíbia, separando os côndilos medial e lateral.',
    funcao: 'Não é articular: serve de barreira e de referência. Os ligamentos cruzados e os cornos dos meniscos inserem-se nas áreas intercondilares à frente e atrás dela, não sobre ela.',
    relacoes: 'Encaixa-se na fossa intercondilar do fêmur na extensão, limitando o deslizamento lateral.',
    clinica:
      'Na criança, o ligamento cruzado anterior não rompe: ele arranca um fragmento da eminência intercondilar — a fratura da espinha tibial, que se fixa cirurgicamente e cicatriza bem, ao contrário da rotura ligamentar do adulto. Mesmo mecanismo, esqueletos diferentes, prognósticos opostos.',
    memoria:
      'Criança arranca osso; adulto rompe ligamento. O elo mais fraco muda com a idade.',
    pontos: [
      'Que estruturas se inserem nas áreas intercondilares?',
      'Por que a eminência não é articular?',
      'Por que a criança sofre fratura da espinha tibial em vez de lesão do LCA?',
    ],
  },
  {
    termos: ['Tubérculo Intercondilar Medial'],
    classe: 'acidente-osseo',
    resumo: 'Elevação medial da eminência intercondilar da tíbia.',
    localizacao: 'Metade medial da eminência intercondilar, no centro do platô tibial.',
    funcao: 'Compõe, com o tubérculo lateral, a crista que se encaixa na fossa intercondilar do fêmur e impede a translação lateral da tíbia.',
    relacoes: 'À sua frente está a área intercondilar anterior, com a inserção do cruzado anterior e dos cornos anteriores dos meniscos.',
    clinica:
      'Na radiografia, os dois tubérculos são o ponto de referência para avaliar alinhamento rotacional e alargamento do espaço articular. A avulsão da espinha tibial que engloba os tubérculos é classificada por Meyers e McKeever, e o grau de desvio decide entre imobilização e fixação.',
    memoria:
      'Dois "dentes" no meio do platô, encaixando na caverna do fêmur. Eles não sustentam peso: eles impedem a tíbia de escorregar.',
    pontos: [
      'Qual a função dos tubérculos intercondilares?',
      'O que se insere imediatamente à frente deles?',
      'Como se classifica a fratura da espinha tibial?',
    ],
  },
  {
    termos: ['Tubérculo Intercondilar Lateral'],
    classe: 'acidente-osseo',
    resumo: 'Elevação lateral da eminência intercondilar, mais proeminente que a medial.',
    localizacao: 'Metade lateral da eminência intercondilar do platô tibial.',
    funcao: 'Completa a barreira central do platô e delimita a face articular do côndilo lateral.',
    relacoes: 'Logo lateralmente a ele, o platô lateral é convexo — ao contrário do medial, que é côncavo.',
    clinica:
      'Essa diferença de forma tem consequência direta: o platô lateral convexo é intrinsecamente instável e depende mais do menisco lateral, que é mais móvel. É também por isso que as fraturas de platô tibial são muito mais frequentes do lado lateral, no mecanismo em valgo do atropelamento — a antiga "fratura do para-choque".',
    memoria:
      'Platô medial côncavo e estável; platô lateral convexo e instável. Duas superfícies opostas no mesmo osso.',
    pontos: [
      'Qual a diferença de forma entre os platôs medial e lateral?',
      'Por que a fratura de platô é mais comum lateralmente?',
      'Como isso afeta a estabilidade da articulação?',
    ],
  },
  {
    termos: ['Área Intercondilar Anterior'],
    classe: 'acidente-osseo',
    resumo: 'Superfície rugosa à frente da eminência intercondilar, onde se fixam o cruzado anterior e os cornos anteriores dos meniscos.',
    localizacao: 'Porção anterior do centro do platô tibial, entre as superfícies articulares.',
    funcao:
      'Recebe, de frente para trás: corno anterior do menisco medial, ligamento cruzado anterior e corno anterior do menisco lateral. Essa vizinhança é o que faz a lesão do cruzado e do menisco andarem juntas.',
    relacoes: 'O ligamento transverso do joelho une os cornos anteriores dos dois meniscos.',
    clinica:
      'É o alvo do túnel tibial na reconstrução do cruzado anterior, e sua localização exata determina se o enxerto vai impactar no teto da fossa intercondilar durante a extensão. Túnel muito anterior é a causa mais comum de perda de extensão e falha do enxerto — um erro de milímetros com consequência funcional grande.',
    memoria:
      'Da frente para trás: menisco medial, cruzado anterior, menisco lateral. Três inserções num espaço do tamanho de uma moeda.',
    pontos: [
      'Que estruturas se inserem na área intercondilar anterior?',
      'Que ligamento une os cornos anteriores dos meniscos?',
      'Por que a posição do túnel tibial é crítica na reconstrução do LCA?',
    ],
  },
  {
    termos: ['Área Intercondilar Posterior'],
    classe: 'acidente-osseo',
    resumo: 'Superfície atrás da eminência, com as inserções dos cornos posteriores dos meniscos e do cruzado posterior.',
    localizacao: 'Porção posterior do centro do platô tibial, descendo pela face posterior da tíbia.',
    funcao: 'Recebe o corno posterior do menisco medial, o corno posterior do menisco lateral e, mais abaixo e atrás, o ligamento cruzado posterior.',
    relacoes: 'A artéria poplítea está imediatamente atrás, separada apenas pela cápsula posterior.',
    clinica:
      'A avulsão óssea da inserção tibial do cruzado posterior — típica do trauma de painel com o joelho fletido — é uma das poucas lesões do LCP com indicação cirúrgica clara, porque a fixação do fragmento restaura a função. A abordagem posterior dessa área exige respeito absoluto pela artéria poplítea.',
    memoria:
      'Atrás do platô, a artéria poplítea encosta no osso. Nada é "só osso" nessa região.',
    pontos: [
      'Que estruturas se fixam na área intercondilar posterior?',
      'Que estrutura vascular está imediatamente atrás?',
      'Que lesão do LCP tem indicação cirúrgica clara?',
    ],
  },
  {
    termos: ['Face Articular do Côndilo Lateral'],
    classe: 'acidente-osseo',
    resumo: 'Superfície superior convexa do côndilo lateral da tíbia, coberta pelo menisco lateral.',
    localizacao: 'Metade lateral do platô tibial; é menor, circular e convexa.',
    funcao:
      'Recebe o côndilo femoral lateral. Sua convexidade obriga o menisco lateral a ser mais espesso e mais móvel — ele cobre proporcionalmente mais superfície e desloca-se até 1 cm na flexão, contra 5 mm do medial.',
    relacoes: 'O tendão do poplíteo passa entre o menisco lateral e a cápsula, no hiato poplíteo.',
    clinica:
      'A maior mobilidade do menisco lateral é o motivo de ele romper menos que o medial, apesar de estar sobre uma superfície pior — ele foge da compressão em vez de resistir a ela. Já sua fixação frouxa explica o menisco discoide, variante que causa o "joelho estalante" da criança.',
    memoria:
      'Menisco lateral se mexe e escapa; menisco medial fica preso e rompe. Mobilidade protege.',
    pontos: [
      'Qual a forma do platô lateral e o que ela exige do menisco?',
      'Por que o menisco lateral rompe menos que o medial?',
      'O que é o hiato poplíteo?',
    ],
  },
  {
    termos: ['Tuberosidade da Tíbia'],
    classe: 'acidente-osseo',
    resumo: 'Saliência anterior da tíbia proximal onde se insere o ligamento patelar.',
    localizacao: 'Face anterior da tíbia, a cerca de 5 cm abaixo da patela, palpável sob a pele.',
    funcao:
      'É o ponto de aplicação final da força do quadríceps. Sua posição lateralizada em relação ao eixo do fêmur cria o ângulo Q, que puxa a patela lateralmente.',
    relacoes: 'A bolsa infrapatelar profunda fica entre ela e o ligamento patelar; a subcutânea, entre o ligamento e a pele.',
    clinica:
      'Na criança e no adolescente é uma apófise de tração, e a sobrecarga repetida produz a doença de Osgood-Schlatter, com aumento doloroso da tuberosidade em meninos entre 10 e 15 anos. No adulto, é o local da osteotomia de medialização (Fulkerson) para tratar instabilidade patelar — mover a tuberosidade para dentro reduz o ângulo Q e corrige o vetor.',
    memoria:
      'Um caroço dolorido embaixo do joelho num adolescente que joga bola: Osgood-Schlatter, e o tratamento é tempo.',
    pontos: [
      'O que se insere na tuberosidade da tíbia?',
      'O que é a doença de Osgood-Schlatter?',
      'Como a osteotomia da tuberosidade corrige a instabilidade patelar?',
    ],
  },
  {
    termos: ['Borda Anterior'],
    classe: 'acidente-osseo',
    resumo: 'Crista afiada e subcutânea da tíbia — a "canela" — que desce da tuberosidade ao maléolo medial.',
    localizacao: 'Face anterior da tíbia, palpável em toda a sua extensão sob a pele.',
    funcao: 'Separa a face medial, subcutânea, da lateral, muscular. Sua exposição é o preço de a tíbia ser o osso de carga da perna.',
    relacoes: 'Coberta apenas por periósteo e pele; nenhum músculo a recobre.',
    clinica:
      'Essa ausência de cobertura muscular explica três coisas: a fratura exposta é mais frequente na tíbia que em qualquer outro osso longo; a consolidação é mais lenta, pela irrigação precária da face anteromedial; e a dor da periostite (canelite) do corredor é tão superficial e localizada. É também o sítio preferencial de acesso intraósseo na criança, dois centímetros abaixo e medialmente à tuberosidade.',
    memoria:
      'Osso sem músculo em cima: quebra e sai pela pele, cicatriza devagar e dói ao menor toque.',
    pontos: [
      'Por que a fratura exposta é comum na tíbia?',
      'Onde se faz o acesso intraósseo tibial?',
      'O que causa a periostite anterior do corredor?',
    ],
  },
  {
    termos: ['Face Medial'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico'],
    resumo: 'Face plana e subcutânea da tíbia, entre a borda anterior e a borda medial.',
    localizacao: 'Face interna da perna, palpável em toda a extensão; recebe, em cima, o tendão conjunto da pata de ganso.',
    funcao: 'Recebe as inserções do sartório, do grácil e do semitendíneo, que formam a pata de ganso — três músculos de três nervos diferentes convergindo num só ponto.',
    relacoes: 'A veia safena magna sobe imediatamente à frente do maléolo medial e cruza a face medial da tíbia.',
    clinica:
      'A bursite anserina, sob a pata de ganso, é causa muito comum de dor medial do joelho em mulheres com sobrepeso e em corredores, e se distingue da lesão meniscal pela dor à palpação cerca de 5 cm abaixo da linha articular. A face medial é também o sítio clássico de acesso à safena magna na dissecção venosa de emergência.',
    memoria:
      'Pata de ganso: Sartório, Grácil, Semitendíneo — "Say Grace before Tea", de fora para dentro e de cima para baixo.',
    pontos: [
      'Que músculos formam a pata de ganso?',
      'Onde se localiza a dor da bursite anserina?',
      'Que veia superficial cruza a face medial da tíbia?',
    ],
  },
  {
    termos: ['Face Lateral'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico'],
    resumo: 'Face da tíbia voltada para a fíbula, coberta pelos músculos do compartimento anterior.',
    localizacao: 'Entre a borda anterior e a borda interóssea, voltada lateralmente.',
    funcao: 'Dá origem ao tibial anterior, ao extensor longo dos dedos e ao extensor longo do hálux, e é coberta pelo compartimento anterior da perna.',
    relacoes: 'O compartimento anterior contém a artéria tibial anterior e o nervo fibular profundo, contra a membrana interóssea.',
    clinica:
      'Esse compartimento é o mais frequentemente acometido pela síndrome compartimental aguda, porque é o menor e o mais rígido dos quatro. O sinal mais precoce e mais confiável é a dor desproporcional à extensão passiva dos dedos, e não a ausência de pulso — que é achado tardio e significa que o dano já está feito.',
    memoria:
      'Compartimento anterior é o mais apertado. Dor ao esticar passivamente os dedos é o alarme; pulso ausente já é o incêndio.',
    pontos: [
      'Que músculos nascem da face lateral da tíbia?',
      'Que estruturas correm no compartimento anterior?',
      'Qual o sinal mais precoce de síndrome compartimental?',
    ],
  },
  {
    termos: ['Linha do Músculo Sóleo'],
    classe: 'acidente-osseo',
    resumo: 'Crista oblíqua na face posterior da tíbia, origem do músculo sóleo.',
    localizacao: 'Face posterior da tíbia proximal, correndo do côndilo lateral para baixo e para dentro.',
    funcao: 'Dá origem ao sóleo e separa a face posterior em uma porção superior, para o poplíteo, e uma inferior, para o tibial posterior e o flexor longo dos dedos.',
    relacoes: 'O arco tendíneo do sóleo, sobre essa linha, é atravessado pelo feixe tibial posterior.',
    clinica:
      'É onde o nervo tibial e a artéria tibial posterior mergulham para o compartimento posterior profundo — ponto potencial de compressão. E é a região da fratura de estresse tibial posteromedial do corredor, que se distingue da canelite anterior por ser mais localizada e por doer ao salto unipodal.',
    memoria:
      'Uma linha diagonal atrás da tíbia divide "o que é poplíteo" do "que é sóleo". E sob o arco do sóleo passa o feixe tibial.',
    pontos: [
      'Que músculo nasce da linha do sóleo?',
      'Que estruturas atravessam o arco tendíneo do sóleo?',
      'Como diferenciar fratura de estresse de periostite?',
    ],
  },
  {
    termos: ['Maléolo Medial'],
    classe: 'acidente-osseo',
    resumo: 'Projeção da tíbia distal que forma a parede medial do encaixe do tornozelo.',
    localizacao: 'Extremidade distal da tíbia, medialmente; é mais curto e mais anterior que o maléolo lateral.',
    funcao: 'Contribui com a parede medial da mortalha tibiofibular e ancora o ligamento deltoide, o mais forte ligamento do tornozelo.',
    relacoes:
      'Atrás dele passam, de frente para trás, o tendão do tibial posterior, o flexor longo dos dedos, a artéria e o nervo tibiais posteriores e o flexor longo do hálux — a sequência que se decora como "Tom, Dick and a Very Nervous Harry".',
    clinica:
      'Essa ordem é usada na palpação do pulso tibial posterior, logo atrás do maléolo, e na descompressão do túnel do tarso. A fratura bimaleolar é instável por definição, porque compromete os dois pilares do encaixe. E o ligamento deltoide é tão forte que, em vez de romper, arranca o maléolo medial — a fratura por avulsão transversa, marca do mecanismo em eversão.',
    memoria:
      '"Tom, Dick and a Very Nervous Harry": Tibial posterior, flexor Digitorum, Vaso, Nervo, flexor Hallucis. Da frente para trás, atrás do maléolo medial.',
    pontos: [
      'Que estruturas passam atrás do maléolo medial, em ordem?',
      'Que ligamento se insere nele?',
      'Por que a fratura medial por avulsão é transversa?',
    ],
  },
  {
    termos: ['Face Articular do Maléolo Medial'],
    classe: 'acidente-osseo',
    resumo: 'Superfície lateral do maléolo medial, revestida de cartilagem, que se articula com o tálus.',
    localizacao: 'Face lateral do maléolo medial, contínua com a superfície inferior da tíbia.',
    funcao: 'Contata a faceta medial do tálus, completando a mortalha que impede o deslizamento lateral do osso.',
    relacoes: 'Forma com a face articular do maléolo lateral e com a face inferior da tíbia o encaixe em forma de U — a mortalha.',
    clinica:
      'Um alargamento de apenas 1 mm da mortalha reduz em cerca de 40% a área de contato do tálus e leva à artrose pós-traumática. Por isso, na fratura do tornozelo, o parâmetro que se persegue não é o alinhamento do osso, e sim a restauração exata do espaço claro medial na radiografia.',
    memoria:
      'A mortalha é uma tomada onde o tálus é o plugue. Um milímetro de folga e a tomada estraga.',
    pontos: [
      'Que estruturas formam a mortalha do tornozelo?',
      'Qual o efeito de 1 mm de alargamento da mortalha?',
      'Que parâmetro radiográfico se avalia na fratura do tornozelo?',
    ],
  },
  {
    termos: ['Incisura Fibular'],
    classe: 'acidente-osseo',
    resumo: 'Sulco na face lateral da tíbia distal que recebe a fíbula na sindesmose tibiofibular.',
    localizacao: 'Face lateral da extremidade distal da tíbia, entre os tubérculos anterior (de Chaput) e posterior (de Volkmann).',
    funcao:
      'Acomoda a fíbula distal na sindesmose, uma articulação fibrosa mantida pelos ligamentos tibiofibulares anterior, posterior, interósseo e transverso. Ela permite alguns graus de rotação e alargamento da mortalha na dorsiflexão, quando a parte mais larga do tálus entra no encaixe.',
    relacoes: 'A membrana interóssea se continua com o ligamento interósseo da sindesmose.',
    clinica:
      'A lesão da sindesmose é a "entorse alta" do tornozelo, com dor acima da linha articular, teste de squeeze positivo e recuperação muito mais lenta que a entorse comum. Na fratura de Maisonneuve, uma entorse aparentemente banal do tornozelo esconde fratura da fíbula proximal — motivo pelo qual se palpa a fíbula em toda a sua extensão em qualquer entorse.',
    memoria:
      'Doeu acima do tornozelo? Aperte a panturrilha e palpe a fíbula até o joelho. Maisonneuve se perde por falta de palpação.',
    pontos: [
      'Que ligamentos compõem a sindesmose tibiofibular?',
      'O que é a entorse alta do tornozelo?',
      'O que é a fratura de Maisonneuve?',
    ],
  },
  /* ─────────────────── Fíbula ─────────────────── */
  {
    termos: ['Cabeça da Fíbula'],
    classe: 'acidente-osseo',
    resumo: 'Extremidade proximal da fíbula, palpável na face lateral do joelho, com o nervo fibular comum logo abaixo.',
    localizacao: 'Face posterolateral do joelho, abaixo do nível do platô tibial; articula-se com o côndilo lateral da tíbia.',
    funcao: 'Recebe o tendão conjunto do bíceps femoral e o ligamento colateral fibular, e forma a articulação tibiofibular proximal, que absorve torção.',
    relacoes: 'O nervo fibular comum contorna o colo da fíbula, imediatamente distal à cabeça, entre o osso e o músculo fibular longo.',
    clinica:
      'É o reparo de superfície mais importante da perna: qualquer procedimento, gesso ou posicionamento cirúrgico que comprima a região do colo produz pé caído. A fratura da cabeça da fíbula quase sempre acompanha lesão do canto posterolateral do joelho — a "fratura do arqueado", cuja lasca óssea na radiografia denuncia uma lesão ligamentar grave.',
    memoria:
      'Coloque o dedo no caroço lateral abaixo do joelho: um centímetro abaixo dele está o nervo fibular comum, com um osso de um lado e nada do outro.',
    pontos: [
      'Que estruturas se inserem na cabeça da fíbula?',
      'Que nervo contorna o colo e o que sua lesão causa?',
      'O que é a fratura do arqueado?',
    ],
  },
  {
    termos: ['Ápice da Cabeça da Fíbula'],
    classe: 'acidente-osseo',
    resumo: 'Projeção pontiaguda no topo da cabeça da fíbula — o processo estiloide.',
    localizacao: 'Extremidade superior e posterior da cabeça da fíbula.',
    funcao: 'Recebe o ligamento popliteofibular e parte do tendão do bíceps femoral, componentes do canto posterolateral.',
    relacoes: 'É a inserção do braço fibular do ligamento arqueado.',
    clinica:
      'Sua avulsão é o marcador radiográfico da lesão do canto posterolateral, que muda inteiramente a conduta de uma entorse de joelho: sem reconstruí-lo, qualquer reconstrução de cruzado falha. Uma pequena lasca óssea na radiografia que vale por uma ressonância.',
    memoria:
      'Uma lasquinha na ponta da fíbula é uma bandeira vermelha: o canto posterolateral se soltou.',
    pontos: [
      'Que estruturas se inserem no ápice da cabeça da fíbula?',
      'Que lesão sua avulsão indica?',
      'Por que essa lesão muda o resultado da reconstrução do cruzado?',
    ],
  },
  {
    termos: ['Colo da Fíbula'],
    classe: 'acidente-osseo',
    resumo: 'Estreitamento abaixo da cabeça da fíbula, contornado pelo nervo fibular comum.',
    localizacao: 'Imediatamente abaixo da cabeça da fíbula, coberto apenas por pele e fáscia na face lateral.',
    funcao: 'Faz a transição da cabeça para a diáfise e dá origem ao músculo fibular longo, que forma um túnel fibroso em torno do nervo.',
    relacoes: 'O nervo fibular comum está preso entre o osso e a fáscia do fibular longo, sem gordura protetora entre eles.',
    clinica:
      'É a neuropatia compressiva mais comum do membro inferior: gesso apertado, cruzar as pernas, imobilidade prolongada no leito, perda rápida de peso. O resultado é o pé caído, com marcha escarvante e anestesia no dorso do pé e no primeiro espaço interdigital. Sua prevenção — acolchoar a região — é uma das intervenções mais baratas e mais esquecidas da enfermaria.',
    memoria:
      'Pé caído + dormência no dorso do pé + história de gesso ou repouso = fibular comum no colo da fíbula. Quase nunca é outra coisa.',
    pontos: [
      'Por que o nervo fibular comum é tão vulnerável no colo da fíbula?',
      'Que déficit motor e sensitivo sua lesão produz?',
      'Como preveni-la em pacientes acamados?',
    ],
  },
  {
    termos: ['Corpo da Fíbula'],
    classe: 'acidente-osseo',
    resumo: 'Diáfise fina da fíbula, que não carrega peso e serve sobretudo de inserção muscular.',
    localizacao: 'Entre o colo e o maléolo lateral, envolvida pelos compartimentos lateral e posterior da perna.',
    funcao:
      'Transmite apenas cerca de 10 a 15% da carga axial. Sua função principal é dar origem aos fibulares, ao extensor longo dos dedos e ao flexor longo do hálux, e completar a mortalha do tornozelo.',
    vascularizacao: 'Artéria fibular, com pedículo periosteal segmentar — a base do retalho ósseo vascularizado.',
    relacoes: 'A membrana interóssea a une à tíbia; o compartimento lateral, o menor da perna, a envolve lateralmente.',
    clinica:
      'É por carregar tão pouco peso que a fíbula é o osso doador de escolha para reconstrução de mandíbula e de defeitos ósseos longos: pode-se retirar até 25 cm mantendo 6 cm em cada extremidade, sem perda funcional significativa. Uma anatomia que virou técnica cirúrgica.',
    memoria:
      'A fíbula é o osso "emprestável": quase não carrega peso, e por isso pode virar mandíbula.',
    pontos: [
      'Que proporção da carga a fíbula transmite?',
      'Por que ela é o osso doador preferido em reconstruções?',
      'Que artéria a irriga?',
    ],
  },
  {
    termos: ['Margem Interóssea'],
    classe: 'acidente-osseo',
    resumo: 'Crista medial da fíbula e lateral da tíbia, onde se fixa a membrana interóssea da perna.',
    localizacao: 'Bordas voltadas uma para a outra da tíbia e da fíbula, ao longo da diáfise.',
    funcao:
      'Ancora a membrana interóssea, cujas fibras descem da tíbia para a fíbula — o inverso do antebraço, porque aqui a carga entra pela tíbia e não pelo osso lateral. A membrana também divide os compartimentos anterior e posterior da perna.',
    relacoes: 'A artéria tibial anterior atravessa a membrana no seu terço proximal, passando para o compartimento anterior.',
    clinica:
      'A membrana é um dos limites rígidos que tornam a síndrome compartimental possível: os quatro compartimentos da perna são delimitados por osso, membrana interóssea e septos fasciais, todos inelásticos. A fasciotomia da perna precisa abrir os quatro compartimentos, e é por isso que a técnica clássica usa duas incisões.',
    memoria:
      'No antebraço as fibras vão do rádio para a ulna; na perna vão da tíbia para a fíbula. A direção segue o osso que carrega o peso.',
    pontos: [
      'Qual a direção das fibras da membrana interóssea da perna?',
      'Por onde a artéria tibial anterior atravessa a membrana?',
      'Quantos compartimentos existem na perna e como se abrem?',
    ],
  },
  {
    termos: ['Maléolo Lateral'],
    classe: 'acidente-osseo',
    resumo: 'Extremidade distal da fíbula, mais longa e mais posterior que o maléolo medial.',
    localizacao: 'Face lateral do tornozelo, descendo cerca de 1 cm mais que o medial e situando-se mais posteriormente.',
    funcao:
      'Forma a parede lateral da mortalha e ancora os três ligamentos laterais: talofibular anterior, calcaneofibular e talofibular posterior. Sua maior extensão distal é o que limita a eversão.',
    relacoes: 'Os tendões fibulares curto e longo correm atrás dele, contidos pelo retináculo superior.',
    clinica:
      'Como o maléolo lateral desce mais, o pé inverte mais facilmente que everte — e por isso 85% das entorses de tornozelo são em inversão, com lesão do talofibular anterior, o mais fraco dos três. As regras de Ottawa dizem quando pedir radiografia: dor na borda posterior de qualquer maléolo, na base do 5º metatarso, no navicular ou incapacidade de dar quatro passos.',
    memoria:
      'O maléolo lateral é mais comprido: ele bloqueia a eversão, e sobra a inversão. Por isso quase toda entorse é "para dentro".',
    pontos: [
      'Que ligamentos se inserem no maléolo lateral?',
      'Por que a entorse em inversão é a mais comum?',
      'Quais são as regras de Ottawa para o tornozelo?',
    ],
  },
  {
    termos: ['Face Articular do Maléolo Lateral'],
    classe: 'acidente-osseo',
    resumo: 'Face medial triangular do maléolo lateral, que se articula com a faceta lateral do tálus.',
    localizacao: 'Face medial do maléolo lateral, voltada para o tálus; atrás dela está a fossa do maléolo lateral.',
    funcao: 'Completa a mortalha lateralmente e impede o deslocamento lateral do tálus.',
    relacoes: 'A fossa do maléolo lateral, atrás dela, dá inserção ao ligamento talofibular posterior.',
    clinica:
      'A classificação de Weber usa o nível da fratura da fíbula em relação à sindesmose: abaixo (A) costuma ser estável; ao nível (B) é a mais comum e depende da lesão medial; acima (C) implica lesão sindesmótica e é instável, exigindo fixação. Uma classificação inteiramente anatômica que decide a conduta.',
    memoria:
      'Weber A abaixo, B ao nível, C acima da sindesmose. Quanto mais alta a fratura da fíbula, mais instável o tornozelo.',
    pontos: [
      'Que estrutura o maléolo lateral impede de se deslocar?',
      'O que é a classificação de Weber?',
      'Por que a fratura Weber C é instável?',
    ],
  },
  /* ─────────────────── Tarso e metatarso ─────────────────── */
  {
    termos: ['Cabeça do Tálus'],
    classe: 'acidente-osseo',
    resumo: 'Extremidade anterior arredondada do tálus, que se articula com o navicular e com o ligamento calcaneonavicular plantar.',
    localizacao: 'Porção anterior do tálus, à frente do colo, apontando anteromedialmente.',
    funcao:
      'Forma a articulação talonavicular, metade da articulação transversa do tarso. É sustentada por baixo pelo ligamento calcaneonavicular plantar — o ligamento "mola" —, que é o principal suporte estático do arco longitudinal medial.',
    relacoes: 'Apoia-se também no sustentáculo do tálus, no calcâneo.',
    clinica:
      'A falência do ligamento mola, junto com a disfunção do tendão tibial posterior, produz o pé plano adquirido do adulto: a cabeça do tálus desaba medialmente e passa a ser palpável e dolorosa na face medial do pé. O sinal dos "muitos dedos" — ver mais dedos por trás no pé acometido — é o achado clínico correspondente.',
    memoria:
      'A cabeça do tálus repousa numa rede: o ligamento mola por baixo e o tibial posterior por dentro. Rasgue a rede e o pé achata.',
    pontos: [
      'Que articulação a cabeça do tálus forma?',
      'O que é o ligamento mola e qual sua função?',
      'Como se manifesta o pé plano adquirido do adulto?',
    ],
  },
  {
    termos: ['Colo do Tálus'],
    classe: 'acidente-osseo',
    resumo: 'Segmento estreito entre o corpo e a cabeça do tálus, por onde entram quase todos os seus vasos.',
    localizacao: 'Entre o corpo e a cabeça do tálus, com um sulco inferior — o sulco do tálus — que forma o seio do tarso.',
    funcao: 'É a única parte do tálus que não é articular e, portanto, a única porta de entrada vascular: o osso não tem inserções musculares e recebe 60% da superfície coberta por cartilagem.',
    vascularizacao: 'Artéria do canal do tarso (da tibial posterior), artéria do seio do tarso e ramos da dorsal do pé, todos entrando pelo colo.',
    relacoes: 'O seio do tarso, entre o tálus e o calcâneo, contém o ligamento talocalcâneo interósseo e vasos.',
    clinica:
      'A fratura do colo do tálus — fratura do aviador — interrompe essa entrada e produz necrose avascular do corpo em até 50% dos casos desviados, taxa que sobe com o grau de Hawkins. O sinal de Hawkins, uma linha radiolúcida subcondral vista em 6 a 8 semanas, indica revascularização e é um raro sinal radiográfico de boa notícia.',
    memoria:
      'Tálus é quase todo cartilagem: o sangue só entra pelo colo. Quebrou o colo, o corpo morre.',
    pontos: [
      'Por que a vascularização do tálus é tão precária?',
      'Que artérias entram pelo colo?',
      'O que é o sinal de Hawkins?',
    ],
  },
  {
    termos: ['Face Maleolar Lateral'],
    classe: 'acidente-osseo',
    resumo: 'Face lateral triangular do corpo do tálus, que se articula com o maléolo lateral.',
    localizacao: 'Face lateral do corpo do tálus, prolongada para baixo no processo lateral do tálus.',
    funcao: 'Contata o maléolo lateral dentro da mortalha; o processo lateral participa também da articulação subtalar posterior.',
    relacoes: 'A tróclea do tálus é mais larga à frente do que atrás.',
    clinica:
      'Essa diferença de largura é a explicação mecânica de o tornozelo ser estável em dorsiflexão e instável em flexão plantar — a parte larga entra na mortalha ao dorsifletir e trava. Daí duas consequências: as entorses ocorrem quase sempre em flexão plantar, e a imobilização do tornozelo é feita a 90°, na posição de máxima estabilidade e de menor risco de encurtamento.',
    memoria:
      'Tálus é uma cunha: larga na frente. Pé para cima, a cunha entra e trava; pé para baixo, sai e o tornozelo bamboleia.',
    pontos: [
      'Por que o tornozelo é mais estável em dorsiflexão?',
      'Em que posição ocorrem a maioria das entorses?',
      'Por que se imobiliza o tornozelo a 90°?',
    ],
  },
  {
    termos: ['Tuberosidade do Calcâneo'],
    classe: 'acidente-osseo',
    resumo: 'Extremidade posterior do calcâneo, onde se insere o tendão do calcâneo e se apoia o calcanhar.',
    localizacao: 'Porção posteroinferior do calcâneo, com processos medial e lateral na sua face plantar.',
    funcao:
      'É o braço de alavanca posterior do pé: a distância entre a tuberosidade e a articulação do tornozelo determina a eficiência do tríceps sural na flexão plantar. O processo medial dá origem à aponeurose plantar, ao abdutor do hálux e ao flexor curto dos dedos.',
    relacoes: 'A bolsa retrocalcânea fica entre o tendão e o osso; o coxim gorduroso do calcanhar a protege por baixo.',
    clinica:
      'É onde se instala a fascite plantar, com dor nos primeiros passos da manhã que melhora com o movimento — a dor de origem em entesopatia, não inflamatória pura. O esporão do calcâneo, visível na radiografia, está na origem do flexor curto dos dedos e é consequência, não causa, da tração crônica. Já a deformidade de Haglund, na face posterossuperior, causa bursite retrocalcânea por atrito com o calçado.',
    memoria:
      'Dor nos primeiros passos da manhã que melhora andando: fascite plantar. O esporão que aparece na radiografia é testemunha, não culpado.',
    pontos: [
      'Que estruturas se inserem na tuberosidade do calcâneo?',
      'Qual o padrão de dor da fascite plantar?',
      'O esporão de calcâneo causa a dor? Por quê?',
    ],
  },
  {
    termos: ['Tróclea Fibular'],
    classe: 'acidente-osseo',
    resumo: 'Pequena crista na face lateral do calcâneo que separa os tendões fibulares longo e curto.',
    localizacao: 'Face lateral do calcâneo, abaixo e à frente do maléolo lateral.',
    funcao: 'Serve de divisor: o tendão do fibular curto passa acima dela, e o do fibular longo, abaixo, a caminho da planta do pé.',
    relacoes: 'O retináculo inferior dos fibulares se fixa a ela.',
    clinica:
      'Sua hipertrofia estreita os canais e causa tenossinovite dos fibulares, com dor lateral do pé em quem tem retropé varo. É também referência anatômica nas osteotomias do calcâneo e no diagnóstico diferencial da dor lateral do tornozelo após entorses de repetição.',
    memoria:
      'Uma "crista de galo" na lateral do calcanhar: fibular curto por cima, fibular longo por baixo. Sempre nessa ordem.',
    pontos: [
      'Que tendões a tróclea fibular separa?',
      'Qual passa acima e qual passa abaixo?',
      'Que quadro sua hipertrofia pode causar?',
    ],
  },
  {
    termos: ['Navicular'],
    classe: 'osso',
    resumo: 'Osso em forma de barco entre a cabeça do tálus e os cuneiformes, chave do arco longitudinal medial.',
    localizacao: 'Face medial do médio-pé, com a tuberosidade do navicular projetando-se medialmente e palpável sob a pele.',
    funcao: 'É a pedra angular do arco longitudinal medial e recebe a inserção principal do tendão tibial posterior na sua tuberosidade.',
    vascularizacao: 'Suprimento em zona de watershed no seu terço central, área de irrigação precária.',
    relacoes: 'Articula-se com o tálus atrás e com os três cuneiformes à frente.',
    clinica:
      'Essa área de watershed explica a doença de Köhler, necrose avascular do navicular em crianças de 4 a 7 anos, e a fratura de estresse do navicular do atleta, notoriamente difícil de ver na radiografia e de consolidar. Um osso acessório frequente, o navicular acessório, é causa de dor medial do pé no adolescente por tração do tibial posterior.',
    memoria:
      'Navicular = pedra angular do arco. Osso do meio do arco com sangue ruim no meio: fratura de estresse que não cola.',
    pontos: [
      'Que tendão se insere na tuberosidade do navicular?',
      'O que é a doença de Köhler?',
      'Por que a fratura de estresse do navicular é problemática?',
    ],
  },
  {
    termos: ['Cuboide'],
    classe: 'osso',
    resumo: 'Osso lateral do tarso, entre o calcâneo e os dois últimos metatarsos, sulcado pelo tendão do fibular longo.',
    localizacao: 'Face lateral do médio-pé, à frente do calcâneo; sua face plantar tem um sulco profundo para o fibular longo.',
    funcao: 'Sustenta o arco longitudinal lateral e serve de polia para o tendão do fibular longo, que muda de direção sobre ele para cruzar a planta até o primeiro metatarso.',
    relacoes: 'A tuberosidade do cuboide fica atrás do sulco; um sesamoide costuma existir dentro do tendão nesse ponto.',
    clinica:
      'A síndrome do cuboide, subluxação sutil da articulação calcaneocuboidea, produz dor lateral do pé que se confunde com entorse crônica e responde à manipulação. As fraturas por compressão do cuboide — "quebra-nozes" — acompanham lesões de Lisfranc e encurtam a coluna lateral, alterando toda a biomecânica do pé.',
    memoria:
      'O cuboide é uma roldana: o fibular longo entra pela lateral, dá a volta por baixo dele e sai do outro lado do pé.',
    pontos: [
      'Que tendão usa o cuboide como polia?',
      'Que arco do pé ele sustenta?',
      'O que é a fratura em quebra-nozes do cuboide?',
    ],
  },
  {
    termos: ['Cuneiformes'],
    classe: 'osso',
    resumo: 'Três ossos em cunha entre o navicular e os três primeiros metatarsos, que formam o arco transverso.',
    localizacao: 'Fileira distal medial do tarso: medial, intermédio e lateral, da borda medial para a lateral.',
    funcao:
      'Suas cunhas apontam em direções opostas — o medial com a base para baixo, os outros dois com a base para cima —, e é justamente essa alternância que constrói o arco transverso do pé, como as aduelas de um arco romano.',
    relacoes: 'O cuneiforme intermédio é recuado em relação aos vizinhos, formando um encaixe onde se aloja a base do 2º metatarso.',
    clinica:
      'Esse encaixe é o que trava a articulação de Lisfranc e é a chave da sua estabilidade. A lesão de Lisfranc é a lesão do médio-pé mais frequentemente perdida: dor e equimose plantar no médio-pé após trauma, com alargamento entre o 1º e o 2º metatarso na radiografia com carga. Não diagnosticada, evolui para artrose e colapso do arco.',
    memoria:
      'Cunhas alternadas fazem um arco. E o 2º metatarso, encaixado entre elas como uma pedra de fecho, é o que trava o médio-pé.',
    pontos: [
      'Como os cuneiformes formam o arco transverso?',
      'Que particularidade tem o cuneiforme intermédio?',
      'O que é a lesão de Lisfranc e por que ela é perdida?',
    ],
  },
  {
    termos: ['Cuneiforme Medial'],
    classe: 'osso',
    resumo: 'O maior dos cuneiformes, base do primeiro metatarso e inserção do tibial anterior.',
    localizacao: 'Borda medial do pé, entre o navicular e o primeiro metatarso.',
    funcao: 'Recebe o tendão do tibial anterior na face medial e o do fibular longo na face plantar lateral — dois músculos antagonistas puxando o mesmo osso em direções opostas, o que o estabiliza.',
    relacoes: 'Sua articulação com o primeiro metatarso tem mobilidade sagital significativa.',
    clinica:
      'A hipermobilidade dessa articulação é fator de risco para hálux valgo, e é isso que a osteotomia de Lapidus corrige, artrodesando a primeira cunha ao metatarso. O equilíbrio entre tibial anterior e fibular longo é também o que o pé cavo perde, com o fibular longo dominante empurrando o primeiro raio para baixo.',
    memoria:
      'Dois tendões puxando o mesmo osso de lados opostos: tibial anterior por cima e por dentro, fibular longo por baixo e por fora. Equilíbrio é o arco.',
    pontos: [
      'Que tendões se inserem no cuneiforme medial?',
      'Como sua hipermobilidade se relaciona ao hálux valgo?',
      'Que desequilíbrio muscular produz o pé cavo?',
    ],
  },
  {
    termos: ['Cuneiforme Intermédio'],
    classe: 'osso',
    resumo: 'O menor dos cuneiformes, recuado entre os vizinhos, formando o encaixe da base do 2º metatarso.',
    localizacao: 'Entre os cuneiformes medial e lateral, mais curto que ambos.',
    funcao: 'Seu recuo cria uma mortalha em que a base do 2º metatarso se encaixa, tornando o 2º raio o mais rígido do pé.',
    relacoes: 'O ligamento de Lisfranc vai do cuneiforme medial à base do 2º metatarso, atravessando obliquamente.',
    clinica:
      'É a chave de abóbada do médio-pé. Como o 2º raio é rígido, ele absorve carga desproporcional: é o local mais frequente da fratura de estresse metatarsal ("fratura da marcha") e da metatarsalgia. A ruptura do ligamento de Lisfranc desestabiliza todo esse conjunto.',
    memoria:
      'O 2º metatarso está encaixado numa fenda como uma chave numa fechadura. Ele quase não se move — e por isso é o que mais sofre.',
    pontos: [
      'Como o cuneiforme intermédio trava o 2º metatarso?',
      'O que é o ligamento de Lisfranc?',
      'Por que o 2º metatarso sofre fratura de estresse?',
    ],
  },
  {
    termos: ['Cuneiforme Lateral'],
    classe: 'osso',
    resumo: 'Cuneiforme mais lateral, entre o intermédio e o cuboide, base do 3º metatarso.',
    localizacao: 'Entre o cuneiforme intermédio, medialmente, e o cuboide, lateralmente.',
    funcao: 'Articula-se com o navicular, com os dois cuneiformes vizinhos, com o cuboide e com o 3º metatarso, além de tocar a base do 2º e do 4º.',
    relacoes: 'Dá inserção a parte do tibial posterior e ao flexor curto do hálux.',
    clinica:
      'Sua posição faz dele a transição entre a coluna medial, móvel, e a lateral, mais rígida na frente e mais móvel atrás. Nas artrodeses do médio-pé por artrose pós-Lisfranc, as articulações mediais são fundidas e as laterais preservadas — porque a coluna lateral precisa de mobilidade para o pé se adaptar ao terreno irregular.',
    memoria:
      'Coluna medial fixa e coluna lateral flexível. O pé precisa de uma parte rígida para empurrar e uma flexível para se adaptar.',
    pontos: [
      'Com quantos ossos o cuneiforme lateral se articula?',
      'Que colunas do pé ele separa?',
      'Por que a coluna lateral não é artrodesada?',
    ],
  },
  {
    termos: ['Metatarsos'],
    classe: 'osso',
    resumo: 'Os cinco ossos longos do antepé, que formam o arco transverso anterior e sustentam a carga do passo.',
    localizacao: 'Entre o tarso e as falanges; o primeiro é curto e robusto, o segundo é o mais longo.',
    funcao:
      'Distribuem a carga na fase de apoio: o primeiro raio suporta cerca do dobro de cada um dos demais. As cabeças formam a região metatarsal, onde se apoia todo o peso na fase de propulsão.',
    relacoes: 'O ligamento metatarsal transverso profundo une as cabeças; os interósseos ocupam os espaços.',
    clinica:
      'O neuroma de Morton se instala entre a 3ª e a 4ª cabeças metatarsais, onde o nervo plantar digital é mais espesso pela união de ramos medial e lateral, com dor em queimação e sensação de "pedra no sapato". A metatarsalgia de transferência aparece quando o primeiro raio deixa de carregar sua parte — no hálux valgo grave ou após cirurgias mal dimensionadas.',
    memoria:
      'O primeiro metatarso carrega o dobro dos outros. Se ele desiste, os vizinhos assumem — e doem.',
    pontos: [
      'Como a carga se distribui entre os metatarsos?',
      'O que é o neuroma de Morton e onde ele ocorre?',
      'O que é metatarsalgia de transferência?',
    ],
  },
  {
    termos: ['Base do V Metatarso'],
    classe: 'acidente-osseo',
    resumo: 'Extremidade proximal do 5º metatarso, com a tuberosidade onde se insere o fibular curto.',
    localizacao: 'Borda lateral do pé, proeminente e palpável; a tuberosidade projeta-se posterolateralmente.',
    funcao: 'Recebe o tendão do fibular curto e a banda lateral da aponeurose plantar.',
    vascularizacao: 'A zona metafisodiafisária, a cerca de 1,5 cm da ponta, é uma área de watershed vascular.',
    relacoes: 'É um dos pontos de palpação obrigatória das regras de Ottawa.',
    clinica:
      'Aqui vivem duas fraturas com prognósticos opostos: a avulsão da tuberosidade (pseudo-Jones), por tração do fibular curto na inversão, que consolida bem com tratamento conservador; e a fratura de Jones, na junção metafisodiafisária, na zona de watershed, que evolui com frequência para pseudartrose e costuma ser fixada, sobretudo em atletas. Um centímetro e meio separa dois tratamentos.',
    memoria:
      'Na pontinha: avulsão, boa. Um centímetro e meio adiante: Jones, ruim. A distância decide o prognóstico.',
    pontos: [
      'Que tendão se insere na tuberosidade do 5º metatarso?',
      'Qual a diferença entre fratura por avulsão e fratura de Jones?',
      'Por que a fratura de Jones evolui mal?',
    ],
  },
  {
    termos: ['Cabeça do V Metatarso'],
    classe: 'acidente-osseo',
    resumo: 'Extremidade distal do 5º metatarso, que forma a articulação metatarsofalângica do dedo mínimo.',
    localizacao: 'Borda lateral do antepé, na base do quinto dedo.',
    funcao: 'Recebe carga na fase de apoio lateral e é um dos três pontos do tripé de apoio plantar, com a cabeça do 1º metatarso e o calcâneo.',
    relacoes: 'Uma bolsa a separa da pele lateralmente.',
    clinica:
      'A proeminência dolorosa dessa cabeça é o bunionette (joanete do alfaiate), correlato lateral do hálux valgo, agravado por calçados estreitos. Nos diabéticos, é um dos três pontos de maior pressão plantar e, portanto, um dos sítios preferenciais de úlcera neuropática — motivo pelo qual o exame do pé diabético insiste nesses três pontos.',
    memoria:
      'Tripé do pé: calcanhar, cabeça do 1º e cabeça do 5º metatarso. Onde há pressão, há calo — e, no diabético, úlcera.',
    pontos: [
      'Que pontos formam o tripé de apoio plantar?',
      'O que é o bunionette?',
      'Por que essa região ulcera no pé diabético?',
    ],
  },
  /* ─────────────────── Articulações do pé ─────────────────── */
  {
    termos: ['Articulação Talocrural'],
    classe: 'articulacao',
    resumo: 'A articulação do tornozelo propriamente dita: uma dobradiça entre a mortalha e a tróclea do tálus.',
    localizacao: 'Entre a face inferior da tíbia com os dois maléolos e a tróclea do tálus.',
    funcao:
      'Permite dorsiflexão (cerca de 20°) e flexão plantar (cerca de 50°). Seu eixo não é puramente transversal, e sim ligeiramente oblíquo, o que faz a dorsiflexão vir acompanhada de discreta abdução.',
    vascularizacao: 'Redes maleolares das artérias tibiais anterior e posterior e da fibular.',
    inervacao: 'Nervos fibular profundo e tibial.',
    relacoes: 'Estabilizada medialmente pelo deltoide, lateralmente pelos três ligamentos laterais e superiormente pela sindesmose.',
    clinica:
      'A dorsiflexão limitada é um dos achados mais subestimados da ortopedia: ela obriga o pé a compensar pronando no médio-pé e é fator causal de fascite plantar, tendinopatia do calcâneo e metatarsalgia. Testa-se com o joelho estendido e fletido para separar encurtamento do gastrocnêmio (biarticular) do sóleo.',
    memoria:
      'Se o tornozelo não sobe, o pé "abre" por dentro para compensar. Muita dor de pé começa numa panturrilha curta.',
    pontos: [
      'Qual a amplitude normal de dorsiflexão e flexão plantar?',
      'Como diferenciar encurtamento de gastrocnêmio e de sóleo?',
      'Que problemas a dorsiflexão limitada causa?',
    ],
  },
  {
    termos: ['Articulação Subtalar'],
    classe: 'articulacao',
    resumo: 'Articulação entre o tálus e o calcâneo, responsável pela inversão e eversão do retropé.',
    localizacao: 'Entre a face inferior do tálus e a superior do calcâneo; anatomicamente compreende as facetas posterior, média e anterior, separadas pelo seio do tarso.',
    funcao:
      'É a articulação que adapta o pé ao terreno. Sua supinação transforma o pé numa alavanca rígida para a propulsão; sua pronação o torna flexível para absorver o impacto. O pé alterna entre esses dois estados a cada passo.',
    relacoes: 'O ligamento talocalcâneo interósseo, no seio do tarso, é seu principal estabilizador.',
    clinica:
      'A rigidez subtalar — por coalizão társica na adolescência, por artrose pós-fratura de calcâneo ou por artrodese — impede essa adaptação e produz o "pé plano rígido doloroso", com marcha desconfortável em terreno irregular. Testa-se a mobilidade segurando o calcâneo e movendo-o em inversão e eversão com o tornozelo bloqueado em dorsiflexão.',
    memoria:
      'O tornozelo sobe e desce; a subtalar vira o pé para dentro e para fora. São duas articulações e dois movimentos diferentes.',
    pontos: [
      'Que movimentos a articulação subtalar permite?',
      'Como ela alterna a rigidez do pé no passo?',
      'O que é a coalizão társica?',
    ],
  },
  {
    termos: ['Articulação Talocalcaneonavicular'],
    classe: 'articulacao',
    resumo: 'Articulação esferóidea em que a cabeça do tálus se apoia no calcâneo, no navicular e no ligamento mola.',
    localizacao: 'Entre a cabeça do tálus e a concavidade formada pelo navicular, pelo sustentáculo do tálus e pelo ligamento calcaneonavicular plantar.',
    funcao:
      'Funciona como o "quadril do pé": uma bola apoiada numa cavidade formada em parte por osso e em parte por ligamento. Com a subtalar, compõe a unidade funcional que inverte e everte o retropé.',
    relacoes: 'O tendão do tibial posterior corre sob o ligamento mola e o reforça dinamicamente.',
    clinica:
      'É a articulação central do pé plano adquirido: a disfunção do tibial posterior sobrecarrega o ligamento mola, que cede, e a cabeça do tálus desliza medial e plantarmente. A artrodese talonavicular isolada elimina cerca de 90% do movimento do retropé — motivo pelo qual é a articulação mais "cara" de fundir no pé.',
    memoria:
      'É o quadril do pé: bola de tálus numa cavidade de osso e ligamento. E é o ligamento que cede primeiro.',
    pontos: [
      'Que estruturas formam a cavidade dessa articulação?',
      'Que tendão reforça dinamicamente o ligamento mola?',
      'Por que a artrodese talonavicular é tão limitante?',
    ],
  },
  {
    termos: ['Articulação Calcaneocubóidea'],
    classe: 'articulacao',
    resumo: 'Articulação selar entre o calcâneo e o cuboide, metade lateral da articulação transversa do tarso.',
    localizacao: 'Entre a face anterior do calcâneo e a posterior do cuboide, lateralmente à talonavicular.',
    funcao:
      'Com a talonavicular, forma a articulação transversa do tarso (de Chopart), a linha em S por onde se faz a amputação de Chopart. Os eixos das duas se tornam paralelos na pronação — liberando movimento — e divergentes na supinação — travando o pé.',
    relacoes: 'O ligamento bifurcado, em Y, une o calcâneo ao cuboide e ao navicular.',
    clinica:
      'Esse mecanismo de eixos paralelos e divergentes é a explicação biomecânica do "windlass" e do travamento do médio-pé na propulsão: quando o calcanhar sai do chão, o pé precisa virar uma barra rígida, e é essa divergência que a produz. O ligamento bifurcado é o mais lesado nas entorses do médio-pé.',
    memoria:
      'Eixos paralelos = pé mole; eixos cruzados = pé duro. O pé troca de estado no meio do passo por pura geometria.',
    pontos: [
      'Que articulações formam a transversa do tarso?',
      'Como a posição dos eixos muda a rigidez do pé?',
      'O que é o ligamento bifurcado?',
    ],
  },
  {
    termos: ['Articulações Tarsometatarsais'],
    classe: 'articulacao',
    resumo: 'Conjunto de articulações planas entre o tarso distal e as bases dos metatarsos — a linha de Lisfranc.',
    localizacao: 'Entre os três cuneiformes e o cuboide, atrás, e as bases dos cinco metatarsos, à frente.',
    funcao:
      'Dividem-se em três colunas com mobilidades diferentes: a medial (1º raio), com mobilidade sagital; a central (2º e 3º), praticamente rígida; e a lateral (4º e 5º), a mais móvel, para adaptação ao terreno.',
    relacoes: 'Não há ligamento entre o 1º e o 2º metatarso; o ligamento de Lisfranc supre essa falta, ligando o cuneiforme medial à base do 2º.',
    clinica:
      'Essa ausência de ligamento intermetatarsal proximal é o ponto fraco: na lesão de Lisfranc, o diastasse entre o 1º e o 2º metatarso é o achado radiográfico, mais evidente na incidência com carga ou em abdução forçada. Até 20% dessas lesões passam despercebidas na avaliação inicial, e o resultado é artrose com colapso do arco.',
    memoria:
      'Entre o 1º e o 2º metatarso não existe ligamento direto — só o de Lisfranc, oblíquo. É a fenda por onde o pé se desmonta.',
    pontos: [
      'Quais são as três colunas do médio-pé e suas mobilidades?',
      'O que é o ligamento de Lisfranc?',
      'Qual o achado radiográfico da lesão de Lisfranc?',
    ],
  },
  {
    termos: ['Articulações Metatarsofalângicas'],
    classe: 'articulacao',
    resumo: 'Articulações condilares entre as cabeças dos metatarsos e as falanges proximais dos dedos.',
    localizacao: 'Base dos dedos, com placa plantar à frente e ligamentos colaterais nas laterais.',
    funcao:
      'Permitem a extensão de até 70° necessária ao desprendimento do pé no fim do passo. É essa extensão que aciona o mecanismo de windlass: a aponeurose plantar se enrola sobre as cabeças metatarsais, encurta e eleva o arco, transformando o pé numa alavanca rígida.',
    relacoes: 'A placa plantar é a estrutura estabilizadora principal; sua degeneração produz instabilidade do dedo.',
    clinica:
      'A insuficiência da placa plantar do 2º dedo é causa comum de metatarsalgia com dedo em garra progressivo e sinal da gaveta positivo. Já a limitação da extensão da primeira metatarsofalângica é o hálux rigidus, que dói justamente no fim do passo, quando o windlass deveria acontecer.',
    memoria:
      'Levante os dedos e o arco do pé sobe sozinho: é o windlass. Sem extensão dos dedos, não há arco na hora de empurrar.',
    pontos: [
      'O que é o mecanismo de windlass?',
      'Que estrutura estabiliza principalmente essas articulações?',
      'O que é o hálux rigidus?',
    ],
  },
  {
    termos: ['Articulação Metatarsofalângica do Hálux'],
    classe: 'articulacao',
    resumo: 'Articulação do hálux, com dois sesamoides plantares que suportam a carga da propulsão.',
    localizacao: 'Entre a cabeça do 1º metatarso e a falange proximal do hálux, com sesamoides medial e lateral na face plantar.',
    funcao:
      'Suporta cerca de duas vezes a carga de cada uma das outras cabeças e precisa de 60 a 70° de extensão para o passo normal. Os sesamoides, dentro do tendão do flexor curto do hálux, aumentam o braço de alavanca e protegem o tendão do flexor longo, que corre entre eles.',
    relacoes: 'O adutor e o abdutor do hálux inserem-se nos sesamoides lateral e medial, respectivamente.',
    clinica:
      'O hálux valgo é um desequilíbrio dessa dupla: o metatarso desvia medialmente enquanto os sesamoides permanecem no lugar, e o abdutor migra para baixo do dedo, deixando de opor-se ao adutor. Entender isso explica por que a cirurgia não é "raspar o osso": é realinhar o metatarso e reequilibrar as partes moles. A sesamoidite e o turf toe (lesão da placa plantar por hiperextensão) são as outras duas queixas frequentes.',
    memoria:
      'No hálux valgo, o osso foge e os sesamoides ficam. O músculo que devia puxar o dedo de volta escorrega para baixo dele e passa a fletir em vez de abduzir.',
    pontos: [
      'Qual a função dos sesamoides do hálux?',
      'Por que o abdutor do hálux perde função no hálux valgo?',
      'Quanta extensão essa articulação precisa no passo normal?',
    ],
  },
  {
    termos: ['Cartilagem Articular da Cabeça do Metatarso'],
    classe: 'cartilagem',
    resumo: 'Revestimento cartilagíneo da cabeça metatarsal, que se estende bem mais na face plantar que na dorsal.',
    localizacao: 'Cabeça de cada metatarso, cobrindo a face plantar e distal e subindo pouco na face dorsal.',
    funcao:
      'A distribuição assimétrica corresponde ao arco de movimento útil: a cabeça é comprimida na face plantar durante a extensão dos dedos, e é ali que a cartilagem precisa ser espessa.',
    relacoes: 'Recebe nutrição exclusivamente do líquido sinovial, sem vasos próprios.',
    clinica:
      'A doença de Freiberg é a necrose avascular da cabeça do 2º metatarso, típica de adolescentes do sexo feminino, com achatamento da face dorsal — exatamente a área menos coberta por cartilagem e mais sujeita a impacto. E no hálux rigidus, o osteófito dorsal cresce onde a cartilagem termina, bloqueando mecanicamente a extensão.',
    memoria:
      'A cartilagem é grossa embaixo, onde se pisa, e fina em cima, onde se bate. E é em cima que o osteófito nasce.',
    pontos: [
      'Por que a cartilagem é mais extensa na face plantar?',
      'O que é a doença de Freiberg?',
      'Como o osteófito dorsal limita a extensão no hálux rigidus?',
    ],
  },
  {
    termos: ['Cavidade Articular'],
    classe: 'articulacao',
    sistemas: ['articular'],
    resumo: 'Espaço fechado entre as superfícies articulares, revestido por membrana sinovial e ocupado por líquido sinovial.',
    localizacao: 'No interior de toda articulação sinovial, delimitado pela cápsula fibrosa e pela membrana sinovial que a forra por dentro.',
    funcao:
      'Contém o líquido sinovial, um ultrafiltrado do plasma enriquecido com ácido hialurônico e lubricina, que reduz o atrito da cartilagem a valores menores que os do gelo sobre gelo e nutre a cartilagem — que é avascular e depende inteiramente dele.',
    vascularizacao: 'A membrana sinovial é ricamente vascularizada; a cartilagem que ela banha não tem vaso algum.',
    inervacao: 'Cápsula e sinovial são inervadas e sensíveis à dor e ao estiramento; a cartilagem articular não tem terminações nervosas.',
    relacoes: 'A cavidade é virtual: contém apenas alguns mililitros de líquido nas grandes articulações.',
    clinica:
      'A ausência de nervos na cartilagem explica por que a artrose pode estar avançada na radiografia e dar pouca dor, e por que a dor vem da sinovial, da cápsula e do osso subcondral. E a análise do líquido sinovial — contagem de células, cristais, Gram e cultura — é o exame que separa artrite séptica de gota e de artrite inflamatória, sendo o procedimento mais decisivo diante de uma monoartrite aguda.',
    memoria:
      'Cartilagem não dói porque não tem nervo, e não cicatriza porque não tem vaso. Quem dói é a sinovial em volta dela.',
    pontos: [
      'Que funções o líquido sinovial exerce?',
      'Por que a cartilagem articular não dói nem cicatriza?',
      'Que exame é decisivo na monoartrite aguda?',
    ],
  },
  /* ─────────────────── Músculos, tendões e retináculos ─────────────────── */
  {
    termos: ['Músculo Extensor Longo dos Dedos'],
    classe: 'musculo',
    resumo: 'Músculo do compartimento anterior que estende os quatro dedos laterais e dorsiflete o pé.',
    localizacao: 'Do côndilo lateral da tíbia, da face medial da fíbula e da membrana interóssea até as falanges média e distal dos dedos 2 a 5, por meio das expansões extensoras.',
    funcao: 'Estende os dedos, dorsiflete o tornozelo e everte discretamente o pé; é o segundo dorsiflexor mais importante, depois do tibial anterior.',
    vascularizacao: 'Artéria tibial anterior.',
    inervacao: 'Nervo fibular profundo (L5–S1).',
    relacoes: 'Seu tendão mais lateral, quando presente, separa-se como fibular terceiro; corre sob os retináculos extensores.',
    clinica:
      'Na lesão do fibular profundo, a queda do pé vem acompanhada de garra dos dedos em compensação: o extensor longo dos dedos, tentando ajudar na dorsiflexão do tornozelo, hiperestende as metatarsofalângicas. É a explicação anatômica de uma deformidade que parece não ter relação com o nervo.',
    memoria:
      'Compartimento anterior levanta o pé e os dedos. Nervo fibular profundo é o dono desse compartimento.',
    pontos: [
      'Que ações o extensor longo dos dedos realiza?',
      'Que nervo o inerva?',
      'Por que a garra dos dedos acompanha o pé caído?',
    ],
  },
  {
    termos: ['Tendão do Músculo Extensor Longo do Hálux'],
    classe: 'tendao',
    resumo: 'Tendão que estende o hálux e é o marcador clínico da raiz L5.',
    localizacao: 'Emerge entre o tibial anterior e o extensor longo dos dedos, cruza o dorso do pé e insere-se na base da falange distal do hálux.',
    funcao: 'Estende o hálux e auxilia a dorsiflexão do tornozelo; ele é o tendão mais medial visível no dorso do pé quando se levanta o dedão.',
    vascularizacao: 'Artéria tibial anterior, que corre imediatamente lateral a ele no tornozelo.',
    inervacao: 'Nervo fibular profundo (L5–S1).',
    relacoes: 'A artéria dorsal do pé corre entre o seu tendão e o do extensor longo dos dedos — a referência para palpar o pulso pedioso.',
    clinica:
      'A força de extensão do hálux é o teste motor mais sensível e mais usado para a raiz L5, e uma hérnia L4–L5 se manifesta caracteristicamente com essa fraqueza. E o tendão é a régua do pulso pedioso: pede-se ao paciente que estenda o hálux, e o pulso é palpado imediatamente lateral ao tendão que salta.',
    memoria:
      'Peça para levantar o dedão contra sua mão: você está testando L5. Do lado de fora do tendão que aparece, o pulso pedioso.',
    pontos: [
      'Que raiz nervosa o extensor longo do hálux avalia?',
      'Onde se palpa o pulso pedioso em relação a ele?',
      'Que hérnia discal produz sua fraqueza?',
    ],
  },
  {
    termos: ['Tendão do Músculo Tibial Anterior'],
    classe: 'tendao',
    resumo: 'O mais forte dorsiflexor do pé, e o tendão mais medial e mais volumoso do dorso do tornozelo.',
    localizacao: 'Desce medialmente no compartimento anterior, cruza sob os retináculos e insere-se no cuneiforme medial e na base do 1º metatarso.',
    funcao: 'Dorsiflete e inverte o pé; na marcha, controla excentricamente o abaixamento do pé após o contato do calcanhar, evitando o "tapa" do pé no chão.',
    inervacao: 'Nervo fibular profundo (L4–L5).',
    relacoes: 'Antagoniza o fibular longo, que se insere no mesmo cuneiforme pela face plantar.',
    clinica:
      'Sua fraqueza produz o pé caído com marcha escarvante e o característico foot slap. A rotura espontânea do tendão, em idosos acima de 60 anos, é subdiagnosticada: produz pé caído sem alteração de sensibilidade, o que a distingue de neuropatia. E é o tendão transferido na cirurgia do pé equinovaro.',
    memoria:
      'Pé caído sem dormência = tendão. Pé caído com dormência no dorso do pé = nervo. Uma pergunta separa as duas causas.',
    pontos: [
      'Que ações o tibial anterior realiza?',
      'Que papel ele exerce logo após o contato do calcanhar?',
      'Como diferenciar rotura tendínea de lesão nervosa no pé caído?',
    ],
  },
  {
    termos: ['Tendão do Músculo Tibial Posterior'],
    classe: 'tendao',
    resumo: 'O principal sustentador dinâmico do arco longitudinal medial, que passa atrás do maléolo medial.',
    localizacao:
      'Do compartimento posterior profundo, contorna o maléolo medial, passa sob o sustentáculo do tálus e se abre em leque para o navicular, os cuneiformes e as bases dos metatarsos médios.',
    funcao:
      'Inverte o pé e sustenta o arco medial. Na marcha, é ele que bloqueia o retropé em varo no fim do apoio, permitindo que o pé se transforme em alavanca rígida para a propulsão.',
    inervacao: 'Nervo tibial (L4–L5).',
    relacoes: 'É a estrutura mais anterior no túnel do tarso; passa por trás do eixo da subtalar, o que lhe dá o vetor inversor.',
    clinica:
      'A disfunção do tibial posterior é a causa mais comum de pé plano adquirido no adulto, especialmente em mulheres de meia-idade. O teste é o "single heel rise": pede-se ao paciente que fique na ponta de um pé só — se o calcanhar não vira em varo, o tendão está insuficiente. Os estágios de Johnson e Strom, do tendão doente com pé flexível ao pé rígido com artrose, definem toda a conduta.',
    memoria:
      'Fique na ponta de um pé só: o calcanhar deve virar para dentro. Se não vira, o tibial posterior falhou — e o pé vai achatar.',
    pontos: [
      'Qual a função do tibial posterior no arco medial?',
      'Como se testa clinicamente sua função?',
      'Qual a consequência de sua disfunção crônica?',
    ],
  },
  {
    termos: ['Tendão do Calcâneo (de Aquiles)'],
    classe: 'tendao',
    resumo: 'O tendão mais forte e mais espesso do corpo, formado pelos gastrocnêmios e pelo sóleo.',
    localizacao: 'Desce do meio da panturrilha até a tuberosidade do calcâneo, girando cerca de 90° no seu trajeto — as fibras mediais tornam-se posteriores.',
    funcao:
      'Transmite a força do tríceps sural, que suporta até 12 vezes o peso corporal na corrida. A torção das fibras armazena energia elástica e a devolve no impulso, tornando a marcha humana energeticamente eficiente.',
    vascularizacao: 'Suprimento precário em uma zona de watershed de 2 a 6 cm acima da inserção, entre os territórios da fibular e da tibial posterior.',
    relacoes: 'A bolsa retrocalcânea o separa do osso; o coxim gorduroso de Kager preenche o espaço à sua frente.',
    clinica:
      'A zona hipovascular é exatamente onde ocorrem a tendinopatia do terço médio e a maioria das roturas. A rotura dá o "sinal do tiro na perna", incapacidade de ficar na ponta do pé e teste de Thompson positivo — apertar a panturrilha não produz flexão plantar. Fluoroquinolonas e corticoides são fatores de risco reconhecidos. O teste de Thompson é o que evita o erro comum de achar que há função porque os flexores longos ainda fletem os dedos.',
    memoria:
      'Aperte a panturrilha: o pé deve descer. Se não desce, o tendão de Aquiles está roto — mesmo que o paciente consiga mexer os dedos.',
    pontos: [
      'Que músculos formam o tendão do calcâneo?',
      'Onde fica sua zona hipovascular e por que ela importa?',
      'Como se realiza e interpreta o teste de Thompson?',
    ],
  },
  {
    termos: ['Cabeça Medial do Músculo Gastrocnêmio'],
    classe: 'musculo',
    resumo: 'Cabeça mais volumosa do gastrocnêmio, que nasce acima do côndilo femoral medial.',
    localizacao: 'Face posterior do fêmur, acima do côndilo medial, descendo até se unir ao sóleo no tendão do calcâneo.',
    funcao: 'Flete plantarmente o pé e flete o joelho — por ser biarticular, sua ação no tornozelo depende da posição do joelho.',
    vascularizacao: 'Artéria sural medial, ramo direto da poplítea.',
    inervacao: 'Nervo tibial (S1–S2).',
    relacoes: 'Forma a borda inferomedial da fossa poplítea; o cisto de Baker se forma entre ela e o tendão do semimembranáceo.',
    clinica:
      'A "síndrome da perna de tenista" é a rotura parcial da junção miotendínea da cabeça medial, com dor súbita na panturrilha que simula trombose venosa profunda — e exige ultrassom para diferenciar. O cisto de Baker, na mesma região, comunica-se com a articulação do joelho e sua ruptura também simula trombose.',
    memoria:
      'Dor súbita na panturrilha: pense em três coisas — Aquiles, gastrocnêmio medial e trombose. O ultrassom decide.',
    pontos: [
      'Por que a ação do gastrocnêmio depende da posição do joelho?',
      'O que é a síndrome da perna de tenista?',
      'Onde se forma o cisto de Baker?',
    ],
  },
  {
    termos: ['Cabeça Lateral do Músculo Gastrocnêmio'],
    classe: 'musculo',
    resumo: 'Cabeça lateral do gastrocnêmio, que nasce acima do côndilo femoral lateral.',
    localizacao: 'Face posterior do fêmur, acima do côndilo lateral; forma a borda inferolateral da fossa poplítea.',
    funcao: 'Flexão plantar e flexão do joelho, em conjunto com a cabeça medial.',
    vascularizacao: 'Artéria sural lateral, ramo da poplítea.',
    inervacao: 'Nervo tibial (S1–S2).',
    relacoes: 'A fabela, um sesamoide presente em cerca de 20% das pessoas, pode existir no seu tendão de origem.',
    clinica:
      'É a estrutura que comprime a artéria poplítea na síndrome do aprisionamento poplíteo, causa de claudicação em jovens atletas sem fatores de risco cardiovascular — um diagnóstico que só se faz pensando nele. A fabela pode ser confundida com corpo livre na radiografia e, raramente, comprime o nervo fibular comum.',
    memoria:
      'Jovem atleta com claudicação de panturrilha e pulsos normais em repouso: pense em aprisionamento poplíteo pelo gastrocnêmio.',
    pontos: [
      'Que síndrome vascular envolve a cabeça lateral do gastrocnêmio?',
      'O que é a fabela?',
      'Que nervo inerva o gastrocnêmio?',
    ],
  },
  {
    termos: ['Músculo Plantar'],
    classe: 'musculo',
    resumo: 'Músculo pequeno e vestigial com ventre curto e o tendão mais longo do corpo.',
    localizacao: 'Da linha supracondilar lateral do fêmur, com ventre de poucos centímetros e um tendão fino que desce medialmente até o calcâneo.',
    funcao: 'Auxilia fracamente a flexão plantar e a flexão do joelho; ausente em cerca de 10% das pessoas, sem consequência funcional.',
    inervacao: 'Nervo tibial (S1–S2).',
    relacoes: 'Seu tendão corre entre o gastrocnêmio e o sóleo, e depois medialmente ao tendão do calcâneo.',
    clinica:
      'É rico em fusos musculares, o que sugere papel proprioceptivo mais que motor. Clinicamente serve como enxerto tendíneo, e sua rotura isolada é uma das causas do quadro de dor súbita na panturrilha. Foi durante muito tempo o responsabilizado pela "perna de tenista", papel que hoje se atribui ao gastrocnêmio medial.',
    memoria:
      'Ventre minúsculo, tendão gigante: é o "palmar longo da perna", dispensável e por isso útil como enxerto.',
    pontos: [
      'Qual a proporção entre ventre e tendão no músculo plantar?',
      'Qual sua provável função principal?',
      'Que uso clínico ele tem?',
    ],
  },
  {
    termos: ['Aponeurose Plantar'],
    classe: 'fascia',
    resumo: 'Faixa fibrosa espessa da sola do pé, do calcâneo às bases dos dedos, que sustenta o arco longitudinal.',
    localizacao: 'Do processo medial da tuberosidade do calcâneo até as cabeças metatarsais e as bainhas dos flexores, em bandas medial, central e lateral.',
    funcao:
      'É o tirante do arco: como a corda de um arco de flecha, impede que o arco se abra sob carga. Na extensão dos dedos, ela se enrola sobre as cabeças metatarsais, encurta e eleva o arco — o mecanismo de windlass.',
    inervacao: 'Ramos do nervo calcâneo medial e do nervo para o abdutor do dedo mínimo.',
    relacoes: 'O nervo de Baxter, primeiro ramo do plantar lateral, corre entre o abdutor do hálux e o quadrado plantar, junto à sua origem.',
    clinica:
      'A fascite plantar é a causa mais comum de dor no calcanhar, com dor máxima nos primeiros passos após repouso — porque a fáscia encurtou durante a noite e é estirada de uma vez. O tratamento se apoia em alongamento da fáscia e do tríceps sural. A neuropatia de Baxter é o diagnóstico diferencial que se deve lembrar quando a dor não melhora e há dor mais medial e distal.',
    memoria:
      'A aponeurose é a corda do arco. Levantar os dedos puxa a corda e levanta o arco — e é a mesma corda que dói de manhã.',
    pontos: [
      'Qual a função mecânica da aponeurose plantar?',
      'Qual o padrão de dor típico da fascite plantar?',
      'O que é a neuropatia de Baxter?',
    ],
  },
  {
    termos: ['Músculo Abdutor do Hálux', 'Músculo Abdutor Longo do Hálux'],
    classe: 'musculo',
    resumo: 'Músculo da primeira camada plantar, na borda medial do pé, que abduz e flete o hálux.',
    localizacao: 'Do processo medial da tuberosidade do calcâneo e da aponeurose plantar até o lado medial da base da falange proximal do hálux.',
    funcao: 'Abduz e flete o hálux; funciona como estabilizador do arco medial e como antagonista do adutor do hálux.',
    inervacao: 'Nervo plantar medial (S1–S2).',
    relacoes: 'Forma o teto do túnel do tarso distal; o nervo de Baxter passa profundamente à sua origem.',
    clinica:
      'É esse músculo que perde a linha de ação no hálux valgo: com o desvio do dedo, ele migra para a face plantar e passa a fletir em vez de abduzir, deixando o adutor sem oponente e perpetuando a deformidade. Sua fáscia profunda é também o ponto de compressão do nervo de Baxter, causa de dor no calcanhar que não responde ao tratamento da fascite.',
    memoria:
      'No hálux valgo, o abdutor "escorrega para baixo do dedo" e vira flexor. Perdido o freio, o dedo não volta mais sozinho.',
    pontos: [
      'Qual a ação normal do abdutor do hálux?',
      'O que acontece com ele no hálux valgo?',
      'Que nervo pode ser comprimido na sua origem?',
    ],
  },
  {
    termos: ['Músculo Flexor Curto dos Dedos'],
    classe: 'musculo',
    resumo: 'Músculo central da primeira camada plantar, análogo ao flexor superficial dos dedos da mão.',
    localizacao: 'Do processo medial da tuberosidade do calcâneo e da aponeurose plantar até as falanges médias dos dedos 2 a 5, dividindo-se para deixar passar o flexor longo.',
    funcao: 'Flete as articulações interfalângicas proximais e ajuda a manter o arco longitudinal durante o apoio.',
    inervacao: 'Nervo plantar medial (S1–S2).',
    relacoes: 'Seus tendões se dividem em Y, como na mão, para dar passagem aos tendões do flexor longo dos dedos.',
    clinica:
      'Sua origem no calcâneo é onde se forma o esporão do calcâneo — que, ao contrário do que o nome sugere, não é a causa da dor. A fascite plantar e a fasciose envolvem tanto a aponeurose quanto essa origem muscular, e é por isso que o alongamento e o fortalecimento intrínseco do pé funcionam melhor que a ressecção do esporão.',
    memoria:
      'A planta do pé repete a mão: um flexor curto que se abre em Y para o longo passar. A solução mecânica é a mesma.',
    pontos: [
      'Qual a analogia entre o flexor curto dos dedos e a mão?',
      'Onde nasce esse músculo?',
      'Qual sua relação com o esporão do calcâneo?',
    ],
  },
  {
    termos: ['Músculo Quadrado Plantar'],
    classe: 'musculo',
    resumo: 'Músculo da segunda camada plantar que corrige a direção de tração do flexor longo dos dedos.',
    localizacao: 'Das duas faces do calcâneo até a borda lateral do tendão do flexor longo dos dedos, na planta do pé.',
    funcao:
      'O flexor longo dos dedos vem de trás do maléolo medial e puxa os dedos obliquamente. O quadrado plantar corrige esse vetor, alinhando a tração com o eixo dos dedos — é literalmente um "acessório de direção".',
    inervacao: 'Nervo plantar lateral (S1–S2).',
    relacoes: 'O nervo de Baxter corre entre ele e o abdutor do hálux.',
    clinica:
      'Sua existência explica por que a flexão dos dedos permanece razoavelmente alinhada apesar da entrada oblíqua do tendão. Nas transferências tendíneas do flexor longo dos dedos para o tibial posterior, a perda desse ajuste é um dos motivos da flexão residual em garra dos dedos menores.',
    memoria:
      'Um músculo cuja única função é "endireitar" a puxada de outro. É o volante do flexor longo dos dedos.',
    pontos: [
      'Qual a função do quadrado plantar?',
      'Por que o flexor longo dos dedos precisa dessa correção?',
      'Que nervo o inerva?',
    ],
  },
  {
    termos: ['Cabeça Oblíqua do Músculo Adutor do Hálux'],
    classe: 'musculo',
    resumo: 'Porção maior do adutor do hálux, que nasce das bases dos metatarsos médios.',
    localizacao: 'Terceira camada plantar, das bases do 2º ao 4º metatarso e da bainha do fibular longo até o sesamoide lateral e a base da falange proximal do hálux.',
    funcao: 'Aduz e flete o hálux; com a cabeça transversa, mantém o arco transverso anterior do pé.',
    inervacao: 'Ramo profundo do nervo plantar lateral (S2–S3).',
    relacoes: 'Insere-se no sesamoide lateral, junto com a cabeça transversa.',
    clinica:
      'É o antagonista que "vence" no hálux valgo: com o abdutor deslocado para baixo, o adutor traciona a falange lateralmente sem oposição, e a deformidade se agrava progressivamente. Por isso a liberação da inserção do adutor é passo padrão da cirurgia do hálux valgo — sem ela, a correção óssea recidiva.',
    memoria:
      'Um puxa para dentro, outro para fora. No hálux valgo o abdutor sai do jogo, e o adutor puxa sozinho até o fim.',
    pontos: [
      'Onde se insere o adutor do hálux?',
      'Que papel ele tem na progressão do hálux valgo?',
      'Por que sua liberação faz parte da cirurgia?',
    ],
  },
  {
    termos: ['Tendão do Músculo Flexor Longo do Hálux'],
    classe: 'tendao',
    resumo: 'Tendão profundo que corre sob o sustentáculo do tálus e entre os sesamoides até a falange distal do hálux.',
    localizacao:
      'Do compartimento posterior profundo, passa entre os tubérculos posteriores do tálus, sob o sustentáculo do tálus e cruza a planta do pé sobre o flexor longo dos dedos, no quiasma plantar.',
    funcao:
      'Flete o hálux e é o último tendão a empurrar o corpo para a frente no fim do passo — é o "motor do impulso". Contribui também para o arco longitudinal medial.',
    inervacao: 'Nervo tibial (S1–S3).',
    relacoes: 'É o mais posterior dos tendões no túnel do tarso; corre num túnel fibro-ósseo entre os tubérculos do tálus.',
    clinica:
      'A tenossinovite estenosante nesse túnel é a "síndrome do hálux do bailarino", com dor posteromedial do tornozelo e travamento do hálux, agravada pelo os trigonum — ossículo acessório posterior ao tálus. É uma dor de tornozelo que se explica pedindo ao paciente que mova apenas o dedão.',
    memoria:
      'É o último tendão a agir no passo: o pé sai do chão pelo dedão. E o túnel dele fica atrás do tornozelo, não no pé.',
    pontos: [
      'Qual o trajeto do flexor longo do hálux?',
      'Qual sua função no ciclo da marcha?',
      'O que é a síndrome do hálux do bailarino?',
    ],
  },
  {
    termos: ['Tendão do Músculo Flexor Longo dos Dedos'],
    classe: 'tendao',
    resumo: 'Tendão que cruza a planta do pé obliquamente e se divide para os quatro dedos laterais.',
    localizacao: 'Passa atrás do maléolo medial, cruza superficialmente o tendão do flexor longo do hálux no quiasma plantar e se divide em quatro tendões.',
    funcao: 'Flete as interfalângicas distais dos dedos 2 a 5 e ajuda na flexão plantar e na inversão. Recebe o quadrado plantar, que alinha sua tração, e origina os lumbricais.',
    inervacao: 'Nervo tibial (L5–S2).',
    relacoes: 'É o segundo tendão no túnel do tarso, entre o tibial posterior e o feixe vasculonervoso.',
    clinica:
      'É o tendão doador padrão na reconstrução da disfunção do tibial posterior: sua transferência para o navicular restaura parte da função inversora, e a perda de flexão dos dedos é bem tolerada. Um exemplo de como a redundância anatômica do pé permite trocas funcionais.',
    memoria:
      'Dois tendões se cruzam no meio da planta: o do hálux por baixo, o dos dedos por cima. É o quiasma plantar.',
    pontos: [
      'Qual o trajeto do flexor longo dos dedos na planta?',
      'O que é o quiasma plantar?',
      'Por que ele é o doador na reconstrução do tibial posterior?',
    ],
  },
  {
    termos: ['Tendão do Músculo Fibular Longo'],
    classe: 'tendao',
    resumo: 'Tendão que contorna o maléolo lateral, dá a volta sob o cuboide e cruza a planta até o primeiro metatarso.',
    localizacao: 'Do compartimento lateral, passa atrás do maléolo lateral, abaixo da tróclea fibular, entra no sulco do cuboide e cruza a planta obliquamente até o cuneiforme medial e a base do 1º metatarso.',
    funcao:
      'Everte o pé e, mais importante, faz a flexão plantar do primeiro raio — ele empurra a cabeça do 1º metatarso contra o chão, estabilizando o apoio medial na propulsão.',
    inervacao: 'Nervo fibular superficial (L5–S1).',
    relacoes: 'É o único tendão que cruza a planta do pé de lateral para medial, sustentando o arco transverso como uma corda de estribo com o tibial anterior.',
    clinica:
      'O desequilíbrio entre fibular longo (que abaixa o 1º metatarso) e tibial anterior (que o levanta) é o mecanismo central do pé cavovaro da doença de Charcot-Marie-Tooth: o fibular longo permanece forte enquanto o tibial anterior enfraquece, e o primeiro raio mergulha. Entender isso explica por que a transferência do fibular longo para o curto é parte do tratamento.',
    memoria:
      'Tibial anterior levanta o dedão por cima; fibular longo o empurra por baixo. Os dois formam um estribo em volta do pé.',
    pontos: [
      'Qual o trajeto singular do tendão do fibular longo?',
      'Qual sua ação sobre o primeiro raio?',
      'Como esse par muscular explica o pé cavovaro?',
    ],
  },
  {
    termos: ['Tendão do Músculo Fibular Curto'],
    classe: 'tendao',
    resumo: 'Tendão que corre atrás do maléolo lateral e se insere na tuberosidade do 5º metatarso.',
    localizacao: 'Atrás do maléolo lateral, acima da tróclea fibular, até a tuberosidade da base do 5º metatarso.',
    funcao: 'É o principal eversor do pé; seu braço de alavanca lateral o torna mais eficiente nessa ação que o fibular longo.',
    inervacao: 'Nervo fibular superficial (L5–S1).',
    relacoes: 'No sulco retromaleolar, é o tendão que fica em contato direto com o osso, com o fibular longo por trás dele.',
    clinica:
      'É essa posição encostada no osso que produz as lesões longitudinais por atrito do fibular curto, típicas de instabilidade lateral crônica do tornozelo. Sua tração é também a responsável pela fratura por avulsão da base do 5º metatarso na entorse em inversão — a lesão que se confunde com a fratura de Jones.',
    memoria:
      'Curto se insere perto (5º metatarso); longo vai longe (1º metatarso, do outro lado do pé). O nome diz o destino.',
    pontos: [
      'Onde se insere o fibular curto?',
      'Por que ele é o principal eversor?',
      'Que fratura sua tração pode causar?',
    ],
  },
  {
    termos: ['Tendão do Músculo Fibular Terceiro'],
    classe: 'tendao',
    resumo: 'Tendão inconstante do compartimento anterior, que ajuda na dorsiflexão e na eversão.',
    localizacao: 'Parte lateral do extensor longo dos dedos, inserindo-se na base do 5º metatarso pelo lado dorsal.',
    funcao: 'Dorsiflete e everte o pé. Ausente em 5 a 10% das pessoas, sem prejuízo funcional.',
    inervacao: 'Nervo fibular profundo (L5–S1) — e é essa a chave: apesar do nome "fibular", ele pertence ao compartimento anterior.',
    relacoes: 'Corre sob os retináculos extensores, junto ao extensor longo dos dedos.',
    clinica:
      'A pegadinha clássica de prova é a inervação: fibular longo e curto são do fibular superficial; o fibular terceiro é do fibular profundo. A confusão nasce do nome, não da anatomia — ele é, de fato, uma parte separada do extensor longo dos dedos, e é uma aquisição evolutiva ligada à marcha bípede.',
    memoria:
      'O "terceiro fibular" não é da família: mora no compartimento anterior e obedece ao fibular profundo. Nome enganoso, endereço diferente.',
    pontos: [
      'A que compartimento o fibular terceiro pertence?',
      'Que nervo o inerva, e por que isso surpreende?',
      'Qual sua ação?',
    ],
  },
  {
    termos: ['Tendões do Músculo Extensor Longo dos Dedos'],
    classe: 'tendao',
    resumo: 'Quatro tendões que se abrem em expansões extensoras no dorso dos dedos 2 a 5.',
    localizacao: 'Do dorso do pé até as falanges médias e distais, formando o capuz extensor de cada dedo.',
    funcao: 'Estendem as metatarsofalângicas diretamente; a extensão das interfalângicas depende dos lumbricais e interósseos, que se inserem no mesmo capuz — exatamente como na mão.',
    relacoes: 'Recebem, lateralmente, os tendões do extensor curto dos dedos.',
    clinica:
      'Essa dependência dos intrínsecos é a base do dedo em garra: com a fraqueza dos intrínsecos — no diabético neuropata, no pé cavo neurológico —, os extensores longos hiperestendem as metatarsofalângicas e os flexores longos fletem as interfalângicas. O resultado é a cabeça metatarsal empurrada para o chão e o calo plantar, porta de entrada da úlcera diabética.',
    memoria:
      'Intrínseco fraco = garra. Garra = cabeça do metatarso pressionando a sola. Pressão = calo, e no diabético, úlcera.',
    pontos: [
      'Que músculos estendem as interfalângicas dos dedos do pé?',
      'Como se forma o dedo em garra?',
      'Por que essa deformidade leva à úlcera no diabético?',
    ],
  },
  {
    termos: ['Tendões do Músculo Extensor Curto dos Dedos', 'Tendão do Músculo Extensor Curto do Hálux'],
    classe: 'tendao',
    resumo: 'Tendões do único músculo intrínseco do dorso do pé, que nasce no calcâneo.',
    localizacao:
      'Da face dorsolateral do calcâneo, formando um ventre carnoso visível na frente do maléolo lateral; envia tendões para os dedos 1 a 4. A parte destinada ao hálux chama-se extensor curto do hálux.',
    funcao: 'Auxilia a extensão dos quatro dedos mediais, com vantagem quando as metatarsofalângicas já estão estendidas.',
    inervacao: 'Nervo fibular profundo (L5–S1).',
    relacoes: 'Seu ventre é palpável e visível à frente do maléolo lateral quando os dedos são estendidos.',
    clinica:
      'O ventre é frequentemente confundido com edema pós-entorse por quem não o conhece — um "inchaço" que na verdade é músculo normal. A atrofia do extensor curto dos dedos é ainda um sinal de neuropatia do fibular profundo, e o músculo serve como referência na medida de amplitude nas cirurgias do dorso do pé.',
    memoria:
      'Um caroço carnoso na frente do maléolo lateral que aparece quando os dedos sobem: é músculo, não é inchaço.',
    pontos: [
      'Onde nasce o extensor curto dos dedos?',
      'Que nervo o inerva?',
      'Por que ele pode ser confundido com edema?',
    ],
  },
  {
    termos: ['Retináculo Superior dos Músculos Extensores'],
    classe: 'fascia',
    resumo: 'Faixa transversal acima do tornozelo que mantém os tendões extensores contra a tíbia e a fíbula.',
    localizacao: 'Entre a fíbula e a tíbia, imediatamente acima da articulação do tornozelo.',
    funcao: 'Impede o encordoamento dos tendões extensores na dorsiflexão, mantendo-os aplicados ao esqueleto.',
    relacoes: 'Sob ele passam, de medial para lateral: tibial anterior, extensor longo do hálux, artéria tibial anterior com o nervo fibular profundo, e extensor longo dos dedos.',
    clinica:
      'Essa ordem é a base do "túnel do tarso anterior": a compressão do nervo fibular profundo sob o retináculo produz dor no dorso do pé e hipoestesia no primeiro espaço interdigital, tipicamente por calçados apertados ou botas de esqui. É um diagnóstico que se faz percutindo o dorso do tornozelo — sinal de Tinel positivo.',
    memoria:
      'Sob o retináculo, o nervo fibular profundo vai no meio do sanduíche de tendões. Aperte o sanduíche e o dorso do pé formiga.',
    pontos: [
      'Que estruturas passam sob o retináculo extensor superior?',
      'O que é a síndrome do túnel do tarso anterior?',
      'Qual sua manifestação sensitiva?',
    ],
  },
  {
    termos: ['Retináculo Inferior dos Músculos Extensores'],
    classe: 'fascia',
    resumo: 'Faixa em Y no dorso do pé que ancora os tendões extensores ao calcâneo e ao lado medial.',
    localizacao: 'Do seio do tarso, no calcâneo, abrindo-se em duas bandas: uma para o maléolo medial e outra para a aponeurose plantar.',
    funcao: 'Mantém os tendões extensores no lugar durante a dorsiflexão e a inversão, funcionando como uma tipoia sobre o dorso do pé.',
    relacoes: 'Sua raiz no seio do tarso é a mesma região do ligamento talocalcâneo interósseo.',
    clinica:
      'É também sob ele que o nervo fibular profundo pode ser comprimido, no ramo medial, produzindo dor localizada no primeiro espaço sem fraqueza. E sua liberação é passo de várias abordagens ao dorso do pé — reconstituí-lo evita a subluxação dos tendões.',
    memoria:
      'Um Y deitado no dorso do pé, com a raiz no seio do tarso. É a alça que segura os tendões quando o pé sobe.',
    pontos: [
      'Qual o formato e a inserção do retináculo extensor inferior?',
      'Que nervo pode ser comprimido sob ele?',
      'Por que ele deve ser reconstituído em cirurgias?',
    ],
  },
  {
    termos: ['Retináculo Superior dos Músculos Fibulares'],
    classe: 'fascia',
    resumo: 'Faixa que prende os tendões fibulares no sulco retromaleolar da fíbula.',
    localizacao: 'Do maléolo lateral à face lateral do calcâneo, cobrindo os tendões fibulares atrás do maléolo.',
    funcao: 'Impede que os tendões fibulares escapem para a frente do maléolo lateral durante a dorsiflexão com eversão.',
    relacoes: 'O sulco retromaleolar é raso ou até convexo em uma parcela das pessoas, o que reduz a contenção óssea.',
    clinica:
      'Sua ruptura produz a luxação dos tendões fibulares, que saltam para a frente do maléolo com estalido audível — lesão típica do esqui e frequentemente diagnosticada como "entorse crônica" por anos. O tratamento envolve reparar o retináculo e, quando o sulco é raso, aprofundá-lo cirurgicamente.',
    memoria:
      'Estalo na lateral do tornozelo com a sensação de algo "pulando": não é entorse, são os fibulares luxando.',
    pontos: [
      'Que tendões o retináculo fibular superior contém?',
      'O que acontece quando ele se rompe?',
      'Que variante anatômica predispõe a essa lesão?',
    ],
  },
  {
    termos: ['Retináculo Inferior dos Músculos Fibulares'],
    classe: 'fascia',
    resumo: 'Faixa que fixa os tendões fibulares à face lateral do calcâneo, separada pela tróclea fibular.',
    localizacao: 'Face lateral do calcâneo, contínua com o retináculo extensor inferior, fixando-se à tróclea fibular.',
    funcao: 'Mantém os tendões fibulares longo e curto em seus canais separados, acima e abaixo da tróclea fibular.',
    relacoes: 'Cada tendão tem sua própria bainha sinovial nesse nível.',
    clinica:
      'É onde ocorre a tenossinovite estenosante dos fibulares em pacientes com retropé varo e tróclea fibular hipertrofiada, com dor lateral do pé abaixo do maléolo. A separação em dois canais é o que permite localizar a dor com precisão e distinguir qual dos dois tendões está acometido.',
    memoria:
      'Retináculo superior segura os dois juntos atrás do maléolo; o inferior os separa em dois canais na lateral do calcâneo.',
    pontos: [
      'Que estrutura separa os dois tendões fibulares nesse nível?',
      'Que condição predispõe à tenossinovite dos fibulares?',
      'Como diferenciar qual tendão está acometido?',
    ],
  },
  {
    termos: ['Artéria Tibial Anterior'],
    classe: 'arteria',
    resumo: 'Artéria do compartimento anterior da perna, que se torna a artéria dorsal do pé no tornozelo.',
    localizacao:
      'Nasce da bifurcação da poplítea, atravessa a membrana interóssea e desce sobre ela, entre o tibial anterior e o extensor longo dos dedos, acompanhada do nervo fibular profundo.',
    funcao: 'Irriga o compartimento anterior da perna e o dorso do pé; anastomosa-se com a plantar lateral formando o arco plantar profundo.',
    relacoes: 'No tornozelo passa entre os tendões do extensor longo do hálux e do extensor longo dos dedos, onde se palpa o pulso pedioso.',
    clinica:
      'O pulso pedioso está ausente em cerca de 8% das pessoas normais — motivo pelo qual sua ausência isolada não fecha diagnóstico de doença arterial: verifica-se também o tibial posterior e mede-se o índice tornozelo-braço. Nas síndromes compartimentais anteriores, a artéria é a última estrutura a ser comprometida, e por isso o pulso presente jamais exclui o diagnóstico.',
    memoria:
      'Pulso pedioso presente não garante circulação boa, e pulso ausente não prova doença. O índice tornozelo-braço é que decide.',
    pontos: [
      'Qual o trajeto da artéria tibial anterior?',
      'Onde se palpa o pulso pedioso?',
      'Por que o pulso presente não exclui síndrome compartimental?',
    ],
  },
  {
    termos: ['Vasos Tibiais Posteriores'],
    classe: 'arteria',
    resumo: 'Feixe do compartimento posterior profundo que passa pelo túnel do tarso e irriga a planta do pé.',
    localizacao: 'Desce entre o compartimento posterior superficial e o profundo, acompanhada do nervo tibial, e passa atrás do maléolo medial no túnel do tarso.',
    funcao: 'Irriga o compartimento posterior e, dividindo-se em plantares medial e lateral, toda a planta do pé; dá origem à artéria fibular.',
    relacoes: 'Dentro do túnel do tarso, ocupa a posição intermediária: entre o flexor longo dos dedos, à frente, e o flexor longo do hálux, atrás.',
    clinica:
      'O pulso tibial posterior é o mais confiável do pé — sua ausência tem valor muito maior que a do pedioso na suspeita de doença arterial periférica. E a síndrome do túnel do tarso, compressão do nervo tibial nesse mesmo canal, produz queimação na planta do pé que piora à noite e ao ficar em pé, com Tinel positivo atrás do maléolo medial.',
    memoria:
      'Atrás do maléolo medial passa tudo o que importa para a planta do pé: dois tendões, a artéria, o nervo e mais um tendão.',
    pontos: [
      'Que estruturas a artéria tibial posterior irriga?',
      'Por que seu pulso é mais confiável que o pedioso?',
      'O que é a síndrome do túnel do tarso?',
    ],
  },
  {
    termos: ['Artéria e Nervo Plantares Mediais'],
    classe: 'arteria',
    resumo: 'Ramo maior da divisão do feixe tibial posterior, que corre entre o abdutor do hálux e o flexor curto dos dedos.',
    localizacao: 'Da bifurcação sob o retináculo dos flexores, seguindo medialmente na planta do pé.',
    funcao:
      'O nervo plantar medial é o análogo do mediano na mão: inerva o abdutor do hálux, o flexor curto dos dedos, o flexor curto do hálux e o primeiro lumbrical, e a sensibilidade dos três dedos e meio mediais da planta.',
    relacoes: 'A artéria acompanha o nervo e contribui para o arco plantar.',
    clinica:
      'Essa analogia é a chave: plantar medial equivale ao mediano, plantar lateral equivale ao ulnar. A neuropatia do plantar medial — o "pé de joguer", por compressão sob o abdutor do hálux em corredores — produz dor e parestesia medial da planta. Na neuropatia diabética, a perda da sensibilidade nesse território é o que permite a úlcera indolor.',
    memoria:
      'Plantar medial = mediano do pé; plantar lateral = ulnar do pé. A mão e o pé foram feitos com o mesmo molde.',
    pontos: [
      'Que músculos o nervo plantar medial inerva?',
      'Qual sua analogia com a mão?',
      'Que território sensitivo ele cobre?',
    ],
  },
  {
    termos: ['Ramo Medial do Nervo Fibular Profundo'],
    classe: 'nervo',
    resumo: 'Ramo terminal sensitivo do fibular profundo, que inerva a pele do primeiro espaço interdigital.',
    localizacao: 'Continua no dorso do pé, ao lado da artéria dorsal do pé, até o espaço entre o hálux e o segundo dedo.',
    funcao: 'É puramente sensitivo, e seu território é minúsculo: apenas a pele entre o primeiro e o segundo dedo.',
    relacoes: 'Corre sob o retináculo extensor inferior, junto à artéria dorsal do pé.',
    clinica:
      'Apesar de pequeno, esse território é um dos mais úteis do exame neurológico: uma área de anestesia entre o hálux e o segundo dedo identifica com precisão a lesão do fibular profundo, e ajuda a distingui-la da lesão do fibular comum, que também compromete o fibular superficial e, portanto, a face lateral da perna e o dorso do pé.',
    memoria:
      'Um retalho de pele do tamanho de uma moeda entre o dedão e o segundo dedo. É a assinatura sensitiva do fibular profundo.',
    pontos: [
      'Que território o ramo medial do fibular profundo inerva?',
      'Como esse território ajuda a localizar a lesão nervosa?',
      'O que diferencia lesão do fibular profundo e do comum?',
    ],
  },
]
