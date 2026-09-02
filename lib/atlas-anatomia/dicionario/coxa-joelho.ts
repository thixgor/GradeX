import type { EntradaDicionario } from './tipos'

/**
 * Coxa, patela e joelho.
 *
 * O joelho é uma articulação sem encaixe ósseo que carrega o corpo inteiro: dois
 * côndilos redondos sobre um platô quase plano. Tudo o que o segura — meniscos,
 * cruzados, colaterais, quadríceps — existe para compensar essa geometria
 * improvável, e é por isso que o joelho é a articulação que mais se lesiona no
 * esporte.
 */
export const COXA_JOELHO: EntradaDicionario[] = [
  /* ─────────────────── Fêmur proximal e diáfise ─────────────────── */
  {
    termos: ['Colo do Fêmur'],
    classe: 'acidente-osseo',
    resumo: 'Ponte óssea entre a cabeça e o corpo do fêmur, inclinada cerca de 125° e anteverida cerca de 15°.',
    localizacao: 'Entre a cabeça femoral e a linha intertrocantérica; é predominantemente intracapsular na sua face anterior.',
    funcao:
      'Afasta o fêmur da pelve, permitindo amplitude de movimento, e converte a carga axial em carga de flexão. É por isso que o colo tem trabéculas dispostas em dois sistemas — de compressão medial e de tração lateral — com um triângulo de menor densidade entre eles, o triângulo de Ward.',
    vascularizacao:
      'Vasos retinaculares que sobem pelo colo, ramos da circunflexa femoral medial (dominante) e lateral; eles correm de baixo para cima, contra o sentido da fratura.',
    relacoes: 'A cápsula cobre toda a face anterior do colo e apenas os dois terços proximais da posterior.',
    clinica:
      'A fratura do colo do fêmur é a fratura de fragilidade mais temida do idoso: mortalidade em um ano de 20 a 30%, e alto risco de necrose da cabeça, porque o traço rompe os vasos retinaculares. Daí a regra prática: fratura desviada do colo no idoso é artroplastia; fratura transtrocantérica, extracapsular, é osteossíntese. O triângulo de Ward é a zona onde a osteoporose primeiro se instala.',
    memoria:
      'O sangue sobe pelo colo de baixo para cima. Quebrou o colo, cortou a subida — e a cabeça morre.',
    pontos: [
      'Qual o ângulo de inclinação e a anteversão normais do colo?',
      'Por que a fratura do colo leva à necrose da cabeça?',
      'O que é o triângulo de Ward?',
    ],
  },
  {
    termos: ['Fossa Trocantérica'],
    classe: 'acidente-osseo',
    resumo: 'Depressão na face medial do trocânter maior, onde se insere o obturador externo.',
    localizacao: 'Face medial do trocânter maior, na sua base, atrás do colo do fêmur.',
    funcao: 'Recebe o tendão do obturador externo; os demais rotadores externos curtos inserem-se na face medial do trocânter, logo acima dela.',
    relacoes:
      'O ramo profundo da artéria circunflexa femoral medial passa imediatamente atrás do tendão do obturador externo, e é essa a principal fonte de sangue da cabeça femoral no adulto.',
    clinica:
      'A relação com o obturador externo é o segredo das abordagens cirúrgicas seguras do quadril: preservar esse tendão protege a artéria e, com ela, a viabilidade da cabeça. Na luxação cirúrgica do quadril, o obturador externo íntegro é literalmente o que evita a necrose.',
    memoria:
      'O obturador externo é o "guarda-costas" da artéria que nutre a cabeça do fêmur. Preservou o tendão, preservou o sangue.',
    pontos: [
      'Que músculo se insere na fossa trocantérica?',
      'Que artéria corre logo atrás dele?',
      'Por que preservá-lo protege a cabeça femoral?',
    ],
  },
  {
    termos: ['Trocânter Maior do Fêmur'],
    classe: 'acidente-osseo',
    resumo: 'Grande saliência lateral na base do colo, onde se inserem os abdutores e os rotadores externos.',
    localizacao: 'Extremidade proximal do fêmur, lateralmente ao colo; é o ponto ósseo mais lateral do quadril e palpável sob a pele.',
    funcao:
      'Recebe o glúteo médio e o mínimo, principais abdutores, e os rotadores externos curtos. É a alavanca sobre a qual os abdutores estabilizam a pelve no apoio unipodal — sem eles, a pelve cai para o lado oposto.',
    relacoes: 'A bolsa trocantérica o separa do trato iliotibial e do glúteo máximo.',
    clinica:
      'A queda da pelve contralateral ao andar é o sinal de Trendelenburg, que indica insuficiência dos abdutores — por lesão do nervo glúteo superior, por tendinopatia glútea ou por artrose avançada. E a dor lateral do quadril, antes chamada bursite trocantérica, é hoje reconhecida como tendinopatia dos glúteos médio e mínimo na sua inserção aqui, um dos diagnósticos mais frequentes e mais mal tratados da ortopedia.',
    memoria:
      'Trendelenburg: o quadril que cai é o do lado bom; o abdutor doente é o do lado do apoio. Sempre inverta antes de responder.',
    pontos: [
      'Que músculos se inserem no trocânter maior?',
      'O que é o sinal de Trendelenburg e que lado ele acusa?',
      'Qual a causa mais comum de dor lateral do quadril?',
    ],
  },
  {
    termos: ['Corpo do Fêmur', 'Corpo do Fêmur (Diáfise)'],
    classe: 'acidente-osseo',
    resumo: 'Diáfise do maior e mais forte osso do corpo, com curvatura anterior e a linha áspera no dorso.',
    localizacao: 'Entre a região trocantérica e os côndilos; é cilíndrica, com discreta convexidade anterior e uma crista posterior rugosa.',
    funcao:
      'Transmite a carga do quadril ao joelho. A curvatura anterior é fisiológica e precisa ser reproduzida nas hastes intramedulares — hastes retas em fêmures muito curvos perfuram a cortical anterior distal.',
    vascularizacao: 'Artéria nutrícia da perfurante e vasos periosteais; a irrigação endosteal é destruída na fresagem.',
    relacoes: 'A artéria femoral profunda e suas perfurantes cruzam a face posterior; o nervo isquiático desce mais posteriormente.',
    clinica:
      'A fratura de diáfise femoral exige alta energia no jovem e pode sangrar de 1 a 1,5 litro dentro da coxa — motivo pelo qual é causa de choque hipovolêmico oculto no politraumatizado. A embolia gordurosa é sua complicação sistêmica clássica, com hipoxemia, confusão e petéquias 24 a 72 horas após o trauma.',
    memoria:
      'Um fêmur quebrado esconde um litro de sangue na coxa. Dois fêmures quebrados são um choque, mesmo sem ferida aberta.',
    pontos: [
      'Quanto sangue pode se acumular numa fratura de fêmur?',
      'Que complicação sistêmica ela pode causar?',
      'Por que a curvatura anterior importa na haste intramedular?',
    ],
  },
  {
    termos: ['Linha Áspera'],
    classe: 'acidente-osseo',
    resumo: 'Crista rugosa vertical na face posterior do fêmur, com lábios medial e lateral.',
    localizacao: 'Percorre o terço médio da face posterior da diáfise; em cima diverge nas linhas pectínea e glútea, embaixo nas linhas supracondilares.',
    funcao:
      'É a espinha dorsal muscular da coxa: recebe os adutores (magno, longo e curto), o vasto medial e o vasto lateral, e a cabeça curta do bíceps femoral. Funciona como um septo ósseo que separa os compartimentos.',
    relacoes: 'As artérias perfurantes da femoral profunda atravessam o adutor magno junto à linha áspera.',
    clinica:
      'É a referência de redução rotacional nas fraturas femorais: alinhar a linha áspera é alinhar o fêmur. E as perfurantes que a cruzam são a fonte de sangramento nas osteotomias femorais — o cirurgião que "raspa" a linha áspera sem cuidado encontra hemorragia difícil.',
    memoria:
      'Uma crista áspera onde o fêmur, que é liso e redondo, oferece um lugar para os músculos se prenderem. Sem ela, não haveria onde ancorar os adutores.',
    pontos: [
      'Que músculos se inserem na linha áspera?',
      'Como ela se divide em cima e embaixo?',
      'Por que ela é referência na redução de fraturas?',
    ],
  },
  {
    termos: ['Linha Pectínia'],
    classe: 'acidente-osseo',
    resumo: 'Crista que sobe da linha áspera até a base do trocânter menor, onde se insere o músculo pectíneo.',
    localizacao: 'Face posteromedial do fêmur proximal, entre o lábio medial da linha áspera e o trocânter menor.',
    funcao: 'Recebe o músculo pectíneo, que flete e aduz o quadril e é o único adutor com contribuição do nervo femoral, além do obturatório.',
    relacoes: 'Está próxima da inserção do iliopsoas no trocânter menor.',
    clinica:
      'A dupla inervação do pectíneo — femoral e, com frequência, obturatório — é a razão de ele poder ser poupado em lesões isoladas de um dos dois nervos, o que confunde o exame dos adutores. Na cirurgia de hérnia inguinal, o pectíneo forma o assoalho do canal femoral.',
    memoria:
      'Pectíneo é o adutor "que também é flexor" e o único com dois patrões nervosos. Ele fica na esquina entre os dois compartimentos.',
    pontos: [
      'Que músculo se insere na linha pectínea?',
      'Qual sua inervação e por que ela é peculiar?',
      'Que ações ele realiza?',
    ],
  },
  {
    termos: ['Linha Supracondilar Medial'],
    classe: 'acidente-osseo',
    resumo: 'Divergência medial da linha áspera que desce até o tubérculo do adutor.',
    localizacao: 'Face posterior do fêmur distal, do fim da linha áspera até o epicôndilo medial.',
    funcao: 'Delimita medialmente a face poplítea do fêmur e conduz o tendão do adutor magno até o tubérculo do adutor.',
    relacoes:
      'O hiato dos adutores, abertura na inserção do adutor magno junto a essa linha, é por onde a artéria femoral passa da coxa anterior para a fossa poplítea, tornando-se artéria poplítea.',
    clinica:
      'É um ponto fixo do trajeto arterial, e por isso um sítio de lesão vascular nas fraturas supracondilares do fêmur — o fragmento distal, tracionado pelo gastrocnêmio, desloca-se posteriormente e pode romper a poplítea. Toda fratura supracondilar exige checar pulsos distais e, se alterados, angiotomografia imediata.',
    memoria:
      'No hiato dos adutores, a femoral vira poplítea. É uma porta estreita num túnel — e artéria presa em porta estreita é artéria que se rompe.',
    pontos: [
      'O que é o hiato dos adutores?',
      'Que artéria muda de nome ao atravessá-lo?',
      'Por que a fratura supracondilar ameaça a artéria poplítea?',
    ],
  },
  {
    termos: ['Linha Supracondilar Lateral'],
    classe: 'acidente-osseo',
    resumo: 'Divergência lateral da linha áspera, que desce até o epicôndilo lateral.',
    localizacao: 'Face posterior do fêmur distal, do fim da linha áspera até o epicôndilo lateral.',
    funcao: 'Dá inserção à cabeça curta do bíceps femoral e ao septo intermuscular lateral, e limita lateralmente a face poplítea.',
    relacoes: 'A face poplítea, triangular, é o assoalho da fossa poplítea e está em contato direto com a artéria e a veia poplíteas.',
    clinica:
      'Esse contato direto entre osso e artéria explica a lesão vascular por fragmento ósseo nas fraturas distais e, na luxação do joelho, o risco de até 20% de lesão da poplítea — a razão de toda luxação de joelho exigir avaliação vascular obrigatória, mesmo com pulsos presentes.',
    memoria:
      'A artéria poplítea está deitada no osso, sem colchão entre eles. Osso que quebra ali corta a artéria.',
    pontos: [
      'Que estruturas se inserem na linha supracondilar lateral?',
      'O que é a face poplítea do fêmur?',
      'Por que a luxação do joelho exige avaliação vascular?',
    ],
  },
  {
    termos: ['Tubérculo do Adutor'],
    classe: 'acidente-osseo',
    resumo: 'Pequena saliência no topo do epicôndilo medial, onde termina a porção tendínea do adutor magno.',
    localizacao: 'Extremidade superior do epicôndilo medial do fêmur, palpável na face medial do joelho.',
    funcao: 'Recebe a porção isquiocondilar do adutor magno — a parte do músculo inervada pelo nervo tibial e que age como um isquiotibial.',
    relacoes: 'Serve de referência para a origem do ligamento colateral medial, logo abaixo e à frente dele.',
    clinica:
      'É a referência anatômica mais confiável para localizar a origem do colateral medial e do ligamento patelofemoral medial nas reconstruções — o chamado ponto de Schöttle é definido em relação a ele. Errar essa origem em milímetros muda a tensão do enxerto ao longo do arco de flexão e leva à falha da cirurgia.',
    memoria:
      'Um caroço no lado de dentro do joelho, logo acima do colateral medial. É a bússola dos ligamentos mediais.',
    pontos: [
      'Que músculo se insere no tubérculo do adutor?',
      'Que ligamentos têm origem próxima a ele?',
      'Por que ele é referência em reconstruções ligamentares?',
    ],
  },
  /* ─────────────────── Fêmur distal ─────────────────── */
  {
    termos: ['Côndilo Femoral Medial'],
    classe: 'acidente-osseo',
    resumo: 'Côndilo mais longo e mais projetado do fêmur, responsável pelo mecanismo de parafuso do joelho.',
    localizacao: 'Extremidade distal do fêmur, medialmente à fossa intercondilar; é mais longo no sentido anteroposterior que o lateral.',
    funcao:
      'Sua maior superfície faz com que, nos últimos graus de extensão, o fêmur rode medialmente sobre a tíbia — o mecanismo de parafuso, que "tranca" o joelho em extensão e permite ficar em pé com mínimo gasto muscular. O poplíteo é quem destrava esse mecanismo.',
    vascularizacao: 'Artérias geniculares superior e inferior mediais.',
    relacoes: 'Dá inserção ao ligamento cruzado posterior na sua face intercondilar e ao colateral medial no epicôndilo.',
    clinica:
      'A assimetria dos côndilos explica o valgo fisiológico do joelho e por que a sobrecarga medial é a regra na artrose: o compartimento medial recebe cerca de 60 a 70% da carga em pé. Por isso a artrose de joelho é predominantemente medial e a osteotomia valgizante da tíbia funciona — ela simplesmente muda o eixo de carga para o lado poupado.',
    memoria:
      'Côndilo medial mais comprido = joelho que "atarraxa" na extensão. Ficar em pé quase não gasta músculo por causa dele.',
    pontos: [
      'O que é o mecanismo de parafuso do joelho?',
      'Que músculo destrava o joelho para iniciar a flexão?',
      'Por que a artrose de joelho é predominantemente medial?',
    ],
  },
  {
    termos: ['Côndilo Femoral Lateral'],
    classe: 'acidente-osseo',
    resumo: 'Côndilo mais largo e mais proeminente anteriormente, que segura a patela na tróclea.',
    localizacao: 'Extremidade distal do fêmur, lateralmente à fossa intercondilar; sua faceta troclear anterior é mais alta que a medial.',
    funcao:
      'Sua projeção anterior forma a parede lateral da tróclea e é o principal contentor ósseo contra a luxação lateral da patela. Dá inserção ao ligamento cruzado anterior na sua face intercondilar e ao colateral lateral no epicôndilo.',
    relacoes: 'O tendão do poplíteo tem origem em um sulco na sua face lateral, dentro da cápsula.',
    clinica:
      'A displasia troclear, com achatamento dessa parede, é o fator anatômico mais importante da instabilidade patelar recorrente. E o sulco terminal do côndilo lateral é o local da fratura por impacção na lesão do ligamento cruzado anterior — o "sinal do sulco profundo" na radiografia, que denuncia a lesão ligamentar sem precisar de ressonância.',
    memoria:
      'A parede lateral da tróclea é o muro que impede a patela de escapar. Muro baixo (displasia) = patela que luxa.',
    pontos: [
      'Que estrutura o côndilo lateral contém anteriormente?',
      'Que ligamento cruzado nasce nele?',
      'O que é o sinal do sulco profundo?',
    ],
  },
  {
    termos: ['Fossa Intercondilar'],
    classe: 'acidente-osseo',
    resumo: 'Sulco profundo entre os dois côndilos femorais, onde se alojam os ligamentos cruzados.',
    localizacao: 'Face posteroinferior do fêmur distal, entre os côndilos medial e lateral.',
    funcao: 'Aloja o ligamento cruzado anterior, que nasce na parede medial do côndilo lateral, e o posterior, que nasce na parede lateral do côndilo medial. Ambos são intracapsulares mas extrassinoviais.',
    relacoes: 'O teto da fossa desliza sobre o cruzado anterior na extensão.',
    clinica:
      'Uma fossa estreita — medida pelo índice intercondilar — é fator de risco reconhecido para rotura do cruzado anterior, sobretudo em mulheres, e explica em parte a maior incidência nesse grupo. Na reconstrução, a notchplasty amplia a fossa para evitar o impacto do enxerto no teto durante a extensão.',
    memoria:
      'Os cruzados moram numa caverna entre os côndilos. Caverna estreita aperta o ligamento — e ligamento apertado rompe.',
    pontos: [
      'Onde nascem os ligamentos cruzados na fossa intercondilar?',
      'Por que uma fossa estreita é fator de risco para lesão do LCA?',
      'O que é a notchplasty?',
    ],
  },
  {
    termos: ['Face Patelar'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico', 'articular'],
    resumo: 'Superfície em sela na frente do fêmur distal — a tróclea — sobre a qual a patela desliza.',
    localizacao: 'Face anterior da extremidade distal do fêmur, com uma faceta lateral mais alta e ampla e uma medial menor, separadas por um sulco.',
    funcao:
      'É o trilho da patela. A assimetria — parede lateral mais alta — compensa o vetor lateral do quadríceps, que puxa a patela para fora por causa do ângulo Q entre a espinha ilíaca anterossuperior e a tuberosidade da tíbia.',
    relacoes: 'Contínua com as superfícies condilares posteriormente; o ligamento patelofemoral medial complementa a contenção nos primeiros 20° de flexão.',
    clinica:
      'A patela é mais instável nos primeiros 20 a 30° de flexão, quando ainda não entrou na tróclea — é por isso que a luxação ocorre quase sempre nessa faixa e que o ligamento patelofemoral medial é o principal estabilizador aí. A displasia da tróclea, o ângulo Q aumentado e a patela alta são o tripé de fatores de risco da instabilidade.',
    memoria:
      'A patela só está segura depois de "entrar no trilho", a partir de uns 30°. Antes disso, quem segura é ligamento, não osso.',
    pontos: [
      'Por que a faceta lateral da tróclea é mais alta?',
      'Em que arco de flexão a patela é mais instável?',
      'Quais os três fatores anatômicos de risco para instabilidade patelar?',
    ],
  },
  /* ─────────────────── Patela ─────────────────── */
  {
    termos: ['Base da Patela'],
    classe: 'acidente-osseo',
    resumo: 'Borda superior e larga da patela, onde se insere o tendão do quadríceps.',
    localizacao: 'Margem proximal do osso, voltada para cima, palpável com o joelho estendido e relaxado.',
    funcao: 'Recebe as quatro cabeças do quadríceps em camadas — reto femoral superficialmente, vastos medial e lateral nas laterais e vasto intermédio profundamente.',
    relacoes: 'A bolsa suprapatelar comunica-se com a cavidade articular acima dela, formando o recesso onde o derrame se acumula.',
    clinica:
      'É por isso que o derrame articular é pesquisado comprimindo o recesso suprapatelar para baixo e provocando o rechaço patelar. A rotura do tendão do quadríceps, mais comum acima dos 40 anos, produz patela baixa e incapacidade de estender o joelho contra a gravidade — a extensão ativa é o teste que separa rotura de contusão.',
    memoria:
      'Acima dos 40, rompe o tendão do quadríceps; abaixo dos 40, o tendão patelar. A idade decide qual lado da patela cede.',
    pontos: [
      'Que estruturas se inserem na base da patela?',
      'Como se pesquisa derrame articular no joelho?',
      'Como diferenciar rotura do aparelho extensor de contusão?',
    ],
  },
  {
    termos: ['Ápice da Patela'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico', 'articular'],
    resumo: 'Extremidade inferior pontiaguda da patela, de onde parte o ligamento patelar.',
    localizacao: 'Polo inferior do osso, não revestido de cartilagem, apontando para a tuberosidade da tíbia.',
    funcao: 'Origem do ligamento patelar, que continua a tração do quadríceps até a tíbia. A patela funciona como sesamoide, afastando o tendão do eixo articular e aumentando o braço de alavanca da extensão em até 30%.',
    relacoes: 'O corpo adiposo infrapatelar preenche o espaço atrás do ligamento; a bolsa infrapatelar profunda fica entre o ligamento e a tíbia.',
    clinica:
      'É o local da tendinopatia patelar, o "joelho do saltador", com dor à palpação do polo inferior e ao agachamento. Na criança e no adolescente, a mesma sobrecarga produz a doença de Sinding-Larsen-Johansson no polo inferior e a de Osgood-Schlatter na tuberosidade da tíbia — mesma cadeia, três idades, três diagnósticos.',
    memoria:
      'A patela é a roldana do joelho: ela não move nada, ela multiplica força. Sem ela, o quadríceps precisaria de 30% mais força.',
    pontos: [
      'Qual a função mecânica da patela como sesamoide?',
      'O que é o joelho do saltador?',
      'Que doenças da mesma cadeia ocorrem na infância?',
    ],
  },
  {
    termos: ['Face Anterior da Patela'],
    classe: 'acidente-osseo',
    resumo: 'Superfície subcutânea e rugosa da patela, sulcada verticalmente pelas fibras tendíneas.',
    localizacao: 'Face voltada para a frente, coberta apenas pela bolsa pré-patelar e pela pele.',
    funcao: 'Recebe as fibras superficiais do tendão do quadríceps, que a atravessam e continuam no ligamento patelar; protege a articulação do trauma direto.',
    relacoes: 'A bolsa pré-patelar, subcutânea, separa-a da pele.',
    clinica:
      'A bursite pré-patelar — "joelho da empregada", "joelho do carpeteiro" — é inflamação por apoio repetido de joelhos, com tumefação flutuante à frente da patela e movimento articular preservado, o que a distingue de artrite. Como a bolsa é extra-articular, sua infecção não é artrite séptica e se trata sem artrotomia.',
    memoria:
      'Inchaço na frente da patela com joelho que dobra normal = bursite. Inchaço difuso com joelho que não dobra = dentro da articulação.',
    pontos: [
      'Que estrutura separa a patela da pele?',
      'O que é a bursite pré-patelar e o que a causa?',
      'Como diferenciá-la de artrite séptica?',
    ],
  },
  {
    termos: ['Face Articular'],
    classe: 'acidente-osseo',
    sistemas: ['esqueletico'],
    resumo: 'Face posterior da patela, dividida em facetas medial e lateral pela crista vertical.',
    localizacao: 'Superfície posterior do osso, revestida pela cartilagem mais espessa do corpo humano — até 5 a 7 mm.',
    funcao:
      'Desliza sobre a tróclea femoral. A cartilagem é tão espessa porque as pressões patelofemorais são enormes: cerca de 3 vezes o peso corporal ao subir escadas e até 7 vezes no agachamento profundo.',
    relacoes: 'A faceta lateral é maior; uma faceta acessória medial ("odd facet") só entra em contato na flexão extrema.',
    clinica:
      'A dor femoropatelar é a queixa mais comum do joelho em jovens, e essas pressões explicam por que ela piora ao subir escadas e ao levantar de uma cadeira, e não na marcha em plano. A condromalácia patelar é o correlato anatômico do amolecimento dessa cartilagem.',
    memoria:
      'A cartilagem mais grossa do corpo está atrás da patela — porque é ali que a pressão é maior. Forma seguindo carga.',
    pontos: [
      'Por que a cartilagem patelar é a mais espessa do corpo?',
      'Que atividades aumentam mais a pressão patelofemoral?',
      'O que é a odd facet?',
    ],
  },
  /* ─────────────────── Joelho: partes moles ─────────────────── */
  {
    termos: ['Ligamento Colateral Fibular'],
    classe: 'ligamento',
    resumo: 'Cordão fibroso extracapsular do epicôndilo lateral do fêmur à cabeça da fíbula, freio do estresse em varo.',
    localizacao: 'Face lateral do joelho, separado do menisco lateral pelo tendão do poplíteo — ao contrário do colateral medial, que está aderido ao seu menisco.',
    funcao: 'Resiste ao estresse em varo, sobretudo com o joelho entre 0 e 30° de flexão. Faz parte do canto posterolateral, junto com o tendão do poplíteo e o ligamento popliteofibular.',
    relacoes: 'O nervo fibular comum contorna o colo da fíbula imediatamente posterior e distal à sua inserção.',
    clinica:
      'Essa separação do menisco explica por que a lesão do colateral lateral não vem acompanhada de lesão meniscal, ao contrário do lado medial. A lesão do canto posterolateral é a causa clássica de falha de reconstrução do cruzado anterior: se o varo residual não é corrigido, o enxerto rompe de novo. E a proximidade do fibular comum torna obrigatório testar a dorsiflexão do pé em qualquer trauma lateral do joelho.',
    memoria:
      'Do lado de fora, o ligamento não encosta no menisco — por isso não tem "tríade". Do lado de dentro, encosta — e por isso tem.',
    pontos: [
      'Por que a lesão do colateral fibular não envolve o menisco?',
      'Que estruturas compõem o canto posterolateral?',
      'Que nervo corre próximo à sua inserção?',
    ],
  },
  {
    termos: ['Ligamento Menisco-Femoral Posterior'],
    classe: 'ligamento',
    resumo: 'Feixe que vai do corno posterior do menisco lateral ao côndilo femoral medial, passando atrás do cruzado posterior.',
    localizacao:
      'Do corno posterior do menisco lateral ao côndilo medial do fêmur. O que passa à frente do cruzado posterior é o ligamento de Humphrey; o que passa atrás é o de Wrisberg — este último.',
    funcao: 'Traciona o corno posterior do menisco lateral para a frente durante a extensão, mantendo-o na posição correta e evitando que fique preso entre os côndilos.',
    relacoes: 'Presente em pelo menos um dos dois formatos em cerca de 90% dos joelhos.',
    clinica:
      'Pode ser confundido com uma lesão do corno posterior do menisco lateral na ressonância — um falso positivo bem descrito, chamado "pseudorrotura". Reconhecer os ligamentos meniscofemorais evita indicar artroscopia por um achado normal.',
    memoria:
      'Humphrey na frente, Wrisberg atrás — do cruzado posterior. Dois "guias" que puxam o menisco lateral no lugar.',
    pontos: [
      'Qual a diferença entre os ligamentos de Humphrey e de Wrisberg?',
      'Qual sua função sobre o menisco lateral?',
      'Que erro de interpretação eles podem causar na ressonância?',
    ],
  },
  {
    termos: ['Corpo Adiposo Infrapatelar'],
    classe: 'estrutura',
    resumo: 'Coxim de gordura de Hoffa, entre o ligamento patelar, o fêmur e a tíbia, dentro da articulação mas fora da sinovial.',
    localizacao: 'Atrás do ligamento patelar, preenchendo o espaço anterior do joelho abaixo da patela.',
    funcao:
      'Preenche o espaço morto que se forma e desfaz a cada movimento, distribui líquido sinovial e amortece a região anterior. É ricamente inervado e vascularizado — é um dos tecidos mais sensíveis à dor do joelho.',
    relacoes: 'Continua-se com a prega sinovial infrapatelar; está imediatamente atrás do ligamento patelar.',
    clinica:
      'A síndrome de Hoffa — impacto e inflamação desse coxim — produz dor anterior do joelho que piora na hiperextensão e sensibilidade nas laterais do ligamento patelar. Sua inervação abundante é a razão de a artroscopia por portais anteriores doer, e de a sua fibrose ser causa de rigidez e de dor anterior persistente após cirurgia.',
    memoria:
      'A gordura de Hoffa não é gordura inerte: é um órgão sensível. É por causa dela que o joelho dói na frente sem nada aparecer na ressonância.',
    pontos: [
      'Qual a função do corpo adiposo infrapatelar?',
      'Por que ele é tão sensível à dor?',
      'O que é a síndrome de Hoffa?',
    ],
  },
  {
    termos: ['Prega Sinovial Infrapatelar'],
    classe: 'estrutura',
    resumo: 'Prega sinovial que vai do coxim adiposo à fossa intercondilar — o ligamento mucoso, resquício embrionário.',
    localizacao: 'Da gordura de Hoffa até o teto da fossa intercondilar, à frente do ligamento cruzado anterior.',
    funcao:
      'É o vestígio do septo que dividia o joelho embrionário em três compartimentos separados. Não tem função mecânica no adulto; sua importância é topográfica e clínica.',
    relacoes: 'As demais pregas — suprapatelar, medial e lateral — têm a mesma origem embrionária.',
    clinica:
      'A prega medial é a que dá sintomas: espessada e fibrosada, ela cavalga o côndilo medial e produz estalido, dor medial e sensação de travamento que simula lesão meniscal — a síndrome da plica. Já a prega infrapatelar é, sobretudo, um obstáculo visual na artroscopia, escondendo o cruzado anterior.',
    memoria:
      'As pregas são "paredes" que o embrião não terminou de derrubar. A medial é a que atrapalha; a infrapatelar é a que atrapalha a vista.',
    pontos: [
      'Qual a origem embriológica das pregas sinoviais?',
      'Que prega causa a síndrome da plica?',
      'Por que a prega infrapatelar importa na artroscopia?',
    ],
  },
  {
    termos: ['Trígono Femoral'],
    classe: 'estrutura',
    resumo: 'Região triangular na raiz da coxa que contém, de lateral para medial, nervo, artéria e veia femorais.',
    localizacao:
      'Limitado acima pelo ligamento inguinal, lateralmente pelo sartório e medialmente pelo adutor longo; o assoalho é feito pelo iliopsoas e pelo pectíneo.',
    funcao: 'Corredor por onde os grandes vasos e o nervo femoral entram na coxa; contém também os linfonodos inguinais profundos e o canal femoral.',
    relacoes:
      'De lateral para medial: Nervo, Artéria, Veia, e o Espaço vazio do canal femoral com os Linfonodos — a ordem que se decora como NAVEL.',
    clinica:
      'Essa ordem é usada todos os dias: a punção arterial femoral é feita medialmente ao pulso? Não — sobre ele, e a punção venosa, um centímetro medial. O canal femoral, o compartimento mais medial, é por onde a hérnia femoral desce, e sua rigidez explica a alta taxa de encarceramento. O linfonodo de Cloquet ocupa a entrada do canal.',
    memoria:
      'NAVEL, de fora para dentro: Nervo, Artéria, Veia, Espaço vazio, Linfonodo. Vale para o trígono femoral inteiro.',
    pontos: [
      'Quais os limites do trígono femoral?',
      'Qual a ordem das estruturas de lateral para medial?',
      'Por que a hérnia femoral encarcera com facilidade?',
    ],
  },
  {
    termos: ['Cabeça Longa do Músculo Bíceps Femoral'],
    classe: 'musculo',
    resumo: 'Isquiotibial lateral que nasce do túber isquiático e cruza duas articulações.',
    localizacao: 'Do túber isquiático, junto com o semitendíneo, descendo lateralmente até a cabeça da fíbula.',
    funcao: 'Estende o quadril e flete o joelho; com o joelho fletido, roda a perna lateralmente. Por cruzar duas articulações, é vulnerável ao alongamento excessivo.',
    vascularizacao: 'Artérias perfurantes da femoral profunda.',
    inervacao: 'Divisão tibial do nervo isquiático (L5–S2) — diferente da cabeça curta.',
    relacoes: 'Seu tendão forma a borda superolateral da fossa poplítea; o nervo fibular comum corre medialmente a ele e depois o contorna.',
    clinica:
      'É o músculo mais lesado do corpo em atletas de velocidade, tipicamente na fase final do balanço, quando ele trabalha excentricamente para desacelerar a perna. A prevenção baseada em exercício excêntrico (nórdico) reduziu drasticamente essa lesão — e a lógica é exatamente a do mecanismo. Seu tendão é ainda o guia para localizar o nervo fibular comum.',
    memoria:
      'Isquiotibiais rompem freando, não acelerando. É no fim do passo, quando eles seguram a perna, que a lesão acontece.',
    pontos: [
      'Que articulações a cabeça longa do bíceps femoral cruza?',
      'Em que fase da corrida ela costuma se lesionar?',
      'Que nervo corre junto ao seu tendão?',
    ],
  },
  {
    termos: ['Cabeça Curta do Músculo Bíceps Femoral'],
    classe: 'musculo',
    resumo: 'Única porção dos isquiotibiais que não cruza o quadril e é inervada pelo nervo fibular comum.',
    localizacao: 'Do lábio lateral da linha áspera e do septo intermuscular lateral, unindo-se à cabeça longa antes da cabeça da fíbula.',
    funcao: 'Flete o joelho e roda a perna lateralmente; não age sobre o quadril, por não cruzá-lo.',
    vascularizacao: 'Artérias perfurantes da femoral profunda.',
    inervacao: 'Divisão fibular comum do nervo isquiático (L5–S2) — a única exceção entre os isquiotibiais.',
    relacoes: 'Une-se à cabeça longa formando um tendão conjunto que se insere na cabeça da fíbula, abraçando o ligamento colateral fibular.',
    clinica:
      'Essa inervação diferente é a razão de o bíceps femoral ser o único músculo com dupla inervação pelos dois ramos do isquiático — dado usado em eletroneuromiografia para localizar lesões altas do nervo. Seu tendão conjunto é também referência da reconstrução do canto posterolateral.',
    memoria:
      'Um músculo, dois nervos: a cabeça longa é tibial, a curta é fibular. É a exceção que a eletroneuromiografia usa a favor.',
    pontos: [
      'Por que a cabeça curta não age sobre o quadril?',
      'Qual sua inervação e por que ela é peculiar?',
      'Como isso é usado na eletroneuromiografia?',
    ],
  },
  {
    termos: ['Músculo Quadrado Femoral'],
    classe: 'musculo',
    resumo: 'Músculo quadrangular entre o túber isquiático e a crista intertrocantérica, rotador externo puro do quadril.',
    localizacao: 'O mais inferior dos rotadores externos curtos, entre o gêmeo inferior acima e o adutor magno abaixo.',
    funcao: 'Roda lateralmente e aduz o quadril; é um estabilizador dinâmico da cabeça femoral, comprimindo-a contra o acetábulo.',
    vascularizacao: 'Artéria circunflexa femoral medial, que corre profundamente a ele.',
    inervacao: 'Nervo do quadrado femoral (L4–S1), que também inerva o gêmeo inferior.',
    relacoes: 'O espaço isquiofemoral, entre o túber isquiático e o trocânter menor, é ocupado por ele.',
    clinica:
      'O estreitamento desse espaço produz a síndrome do impacto isquiofemoral, causa reconhecida de dor glútea profunda e de dor irradiada tipo ciática, com edema do quadrado femoral visível na ressonância. É um diagnóstico relativamente recente que explica muitos casos antes rotulados como "ciática sem hérnia".',
    memoria:
      'O quadrado femoral mora num corredor estreito entre dois ossos. Corredor apertado, músculo espremido, dor na nádega.',
    pontos: [
      'Qual a ação do músculo quadrado femoral?',
      'Que artéria importante corre profundamente a ele?',
      'O que é a síndrome do impacto isquiofemoral?',
    ],
  },
  {
    termos: ['Músculo Gêmeo Superior'],
    classe: 'musculo',
    resumo: 'Pequeno rotador externo que nasce da espinha isquiática e se une ao tendão do obturador interno.',
    localizacao: 'Entre o piriforme, acima, e o gêmeo inferior, abaixo; funde-se ao tendão do obturador interno.',
    funcao: 'Roda lateralmente o quadril estendido e abduz o quadril fletido; com os demais rotadores curtos, é o "manguito rotador do quadril".',
    inervacao: 'Nervo do obturador interno (L5–S2).',
    relacoes: 'O feixe pudendo cruza a espinha isquiática imediatamente medial à sua origem.',
    clinica:
      'A metáfora do manguito rotador do quadril é útil: assim como no ombro, esses músculos pequenos comprimem a cabeça no acetábulo e são os primeiros a atrofiar na artrose e na denervação. São também os músculos seccionados e reparados na via posterior de artroplastia — e seu reparo cuidadoso reduz a taxa de luxação da prótese.',
    memoria:
      'Piriforme, gêmeo superior, obturador interno, gêmeo inferior, quadrado femoral — de cima para baixo. Cinco rotadores externos em fila.',
    pontos: [
      'Que músculos formam o grupo dos rotadores externos curtos, em ordem?',
      'Por que são chamados de manguito rotador do quadril?',
      'Qual sua relevância na artroplastia por via posterior?',
    ],
  },
  {
    termos: ['Músculo Gêmeo Inferior'],
    classe: 'musculo',
    resumo: 'Rotador externo curto que nasce do túber isquiático e acompanha o obturador interno.',
    localizacao: 'Entre o obturador interno, acima, e o quadrado femoral, abaixo, inserindo-se com o tendão do obturador interno na fossa trocantérica.',
    funcao: 'Roda lateralmente o quadril e o estabiliza; funciona junto com o obturador interno como uma unidade funcional tríplice.',
    inervacao: 'Nervo do quadrado femoral (L4–S1).',
    relacoes: 'Está imediatamente acima da artéria circunflexa femoral medial, na sua passagem para o colo femoral.',
    clinica:
      'Essa relação é decisiva: nas vias posteriores do quadril, a secção do gêmeo inferior e do quadrado femoral pode lesar a circunflexa medial e comprometer a cabeça femoral. Por isso as técnicas modernas de luxação cirúrgica preservam o obturador externo e limitam a dissecção nesse plano.',
    memoria:
      'Os dois gêmeos são "reforços" laterais do tendão do obturador interno, que passa entre eles como um sanduíche.',
    pontos: [
      'Com que tendão os gêmeos se fundem?',
      'Que artéria corre próxima ao gêmeo inferior?',
      'Por que isso limita a dissecção cirúrgica posterior?',
    ],
  },
  {
    termos: ['Tendão do Músculo Obturador Interno'],
    classe: 'tendao',
    resumo: 'Tendão que sai da pelve pelo forame isquiático menor e faz uma curva de 90° sobre o ísquio.',
    localizacao: 'Da face interna da membrana obturatória, atravessa o forame isquiático menor e insere-se na face medial do trocânter maior.',
    funcao:
      'Roda lateralmente o quadril. A curva de quase 90° sobre a margem do ísquio funciona como polia, e a superfície óssea nesse ponto é revestida de cartilagem, com uma bolsa entre eles.',
    inervacao: 'Nervo do obturador interno (L5–S2).',
    relacoes: 'Sua saída da pelve é o marco do canal pudendo (de Alcock), formado por um desdobramento da fáscia obturatória, por onde correm o nervo e os vasos pudendos internos.',
    clinica:
      'O canal de Alcock é o local mais frequente de aprisionamento do nervo pudendo, causa de dor perineal crônica que piora ao sentar e melhora em pé ou deitado de lado — os critérios de Nantes. Diagnóstico feito pela história e confirmado por bloqueio; a fisiopatologia é inteiramente anatômica.',
    memoria:
      'Um tendão que dá a volta em uma esquina óssea, e um nervo que corre num túnel na fáscia desse músculo. A esquina e o túnel doem.',
    pontos: [
      'Que trajeto o tendão do obturador interno percorre?',
      'O que é o canal de Alcock?',
      'Que quadro clínico o aprisionamento do pudendo produz?',
    ],
  },
]
