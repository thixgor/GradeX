import type { EntradaDicionario } from './tipos'

/**
 * Base do crânio, calvária por dentro e crânio do recém-nascido.
 *
 * É a região em que o aluno mais decora e menos entende. A régua aqui foi
 * sempre a mesma: nenhum buraco da base existe por acaso — cada um é o caminho
 * de alguma coisa, e é essa coisa que explica a síndrome quando o buraco é
 * invadido por tumor, por fratura ou por infecção.
 */
export const CRANIO_BASE: EntradaDicionario[] = [
  /* ─────────────────── Base externa: esqueleto ─────────────────── */
  {
    termos: ['Osso Temporal (Processo Mastoide)'],
    classe: 'acidente-osseo',
    resumo: 'Saliência cônica atrás do pavilhão auricular, cheia de células aéreas em continuidade com a orelha média.',
    localizacao:
      'Desce do osso temporal logo atrás e abaixo do meato acústico externo. Você acha no vivo em um segundo: passe o dedo atrás da orelha e a proeminência óssea que resiste é o mastoide.',
    funcao:
      'Dá inserção ao esternocleidomastóideo, ao esplênio da cabeça e ao longuíssimo da cabeça — por isso é robusto: ele é o braço de alavanca da rotação da cabeça. Por dentro é oco, pneumatizado, e essas células comunicam-se com a cavidade timpânica pelo ádito do antro mastóideo.',
    vascularizacao:
      'Artéria occipital e artéria auricular posterior, com a artéria estilomastóidea entrando pelo forame homônimo. A veia emissária mastóidea o atravessa e liga o seio sigmóideo às veias do couro cabeludo — via de disseminação da infecção mastóidea para a trombose de seio sigmóideo.',
    relacoes:
      'Medial a ele passa o forame estilomastóideo (nervo facial saindo) e, mais fundo, o seio sigmoide escava a face interna. Anteriormente está o meato acústico externo; medialmente, o processo estiloide.',
    clinica:
      'A mastoidite é a complicação clássica da otite média não tratada: a infecção sobe pelo ádito, ocupa as células, e o paciente aparece com a orelha empurrada para fora, dor e apagamento do sulco retroauricular. Como o seio sigmoide e o facial são vizinhos íntimos, a mastoidite complicada dá trombose do seio sigmoide e paralisia facial periférica. O sinal de Battle — equimose sobre o mastoide — indica fratura de base de crânio na fossa posterior.',
    memoria:
      'Mastoide é um osso oco atrás de uma orelha: pense nele como um "porão ventilado" da orelha média. Porão que enche de pus é mastoidite; porão que fica roxo é fratura de base.',
    pontos: [
      'Que músculo puxa o mastoide e o que acontece se ele encurta (torcicolo)?',
      'Por que a otite média pode virar mastoidite, anatomicamente?',
      'Que estruturas correm risco na mastoidite complicada?',
    ],
  },
  {
    termos: ['Osso Vômer'],
    classe: 'osso',
    resumo: 'Osso ímpar, fino e em forma de relha de arado, que forma a metade posteroinferior do septo nasal.',
    localizacao:
      'Na linha média da cavidade nasal, entre as duas coanas. Articula-se acima com a lâmina perpendicular do etmoide e com o rostro do esfenoide, e abaixo com a crista nasal da maxila e do palatino.',
    funcao:
      'Completa o septo ósseo e mantém as duas fossas nasais separadas e simétricas — condição para que o fluxo de ar seja turbulento e condicionado dos dois lados.',
    vascularizacao:
      'Artéria esfenopalatina, pelo ramo nasopalatino, que desce pela sua face e atravessa o canal incisivo. É esse vaso que sangra na epistaxe posterior de septo e o que se cauteriza na septoplastia.',
    relacoes:
      'É a única peça óssea que você vê na linha média olhando as coanas de baixo. Atrás dele está a nasofaringe; à frente, a cartilagem do septo.',
    clinica:
      'O desvio de septo geralmente é do vômer ou da lâmina perpendicular do etmoide, e explica a obstrução nasal unilateral crônica. Em fraturas do terço médio da face (Le Fort), o vômer se desloca junto com o palato, e o exame do septo denuncia a fratura.',
    memoria:
      '"Vômer" vem de relha de arado — a lâmina que corta a terra. Olhe uma peça pela coana: a lâmina fina no meio, exatamente como uma relha, é o vômer.',
    pontos: [
      'Que três peças formam o septo nasal (vômer, lâmina perpendicular do etmoide e cartilagem septal)?',
      'Por que o desvio de septo dá obstrução unilateral?',
      'Como o vômer se relaciona com as coanas?',
    ],
  },
  {
    termos: ['Osso Esfenoide (Processo Pterigoide)', 'Processo Pterigoide'],
    classe: 'acidente-osseo',
    resumo: 'Par de lâminas que descem do esfenoide atrás da maxila, ancorando os músculos que movem a mandíbula.',
    localizacao:
      'Desce verticalmente da junção entre o corpo e a asa maior do esfenoide, atrás do último molar superior. Divide-se em lâmina medial e lâmina lateral, separadas pela fossa pterigóidea.',
    funcao:
      'É a plataforma de origem dos músculos pterigóideos, que fazem a mandíbula protruir e mover-se lateralmente na mastigação. A lâmina medial termina no hâmulo, que serve de roldana para o tensor do véu palatino.',
    vascularizacao:
      'Ramos pterigóideos da artéria maxilar e artéria do canal pterigóideo, que atravessa sua base. O plexo venoso pterigóideo, que o envolve, comunica-se com o seio cavernoso pelas veias emissárias do forame oval — a via pela qual uma infecção dentária pode chegar ao crânio.',
    relacoes:
      'À frente está a fossa pterigopalatina, encruzilhada de nervos e vasos da face; lateralmente, a fossa infratemporal com o plexo pterigóideo; medialmente, a coana e a tuba auditiva.',
    clinica:
      'É o pilar da classificação de Le Fort: por definição, toda fratura de Le Fort atravessa os processos pterigóideos — se eles estão íntegros na tomografia, não é Le Fort. Tumores da nasofaringe invadem a base pela fossa pterigopalatina e o primeiro sinal costuma ser trismo, por infiltração dos pterigóideos.',
    memoria:
      '"Pterigoide" = asa. Duas lâminas como asas penduradas atrás da maxila, com os músculos da mastigação presos nelas. Fratura de face que quebra as asas é Le Fort.',
    pontos: [
      'Quais músculos nascem das lâminas pterigóideas?',
      'Por que toda fratura de Le Fort envolve o processo pterigoide?',
      'O que o hâmulo pterigóideo faz pelo tensor do véu palatino?',
    ],
  },
  {
    termos: ['Lâmina Lateral'],
    classe: 'acidente-osseo',
    resumo: 'Lâmina externa e mais larga do processo pterigoide, origem dos dois músculos pterigóideos.',
    localizacao:
      'Face lateral do processo pterigoide, voltada para a fossa infratemporal. Sua face externa olha para fora; a interna forma a parede lateral da fossa pterigóidea.',
    funcao:
      'A face lateral dá origem ao pterigóideo lateral (cabeça inferior); a face medial, ao pterigóideo medial. Ou seja: uma lâmina só sustenta os dois motores da protrusão e da lateralidade mandibular.',
    relacoes:
      'Cobre-se lateralmente pelo plexo venoso pterigóideo e pela artéria maxilar; a nervo alveolar inferior e o lingual descem por trás dela rumo ao forame da mandíbula.',
    clinica:
      'Referência do bloqueio anestésico do nervo mandibular: a agulha toca a lâmina lateral e, a partir dela, se redireciona. Em trauma, a fratura da lâmina lateral costuma sangrar muito por causa do plexo pterigóideo logo em cima.',
    memoria:
      'Uma lâmina, dois músculos: o pterigóideo lateral nasce por fora, o medial nasce por dentro. Os dois se abraçam na mesma parede.',
    pontos: [
      'Que músculo nasce de cada face da lâmina lateral?',
      'Que plexo venoso a recobre e por que isso importa no trauma?',
      'Como ela orienta o bloqueio do nervo mandibular?',
    ],
  },
  {
    termos: ['Lâmina Medial'],
    classe: 'acidente-osseo',
    resumo: 'Lâmina interna e mais estreita do processo pterigoide, que termina no hâmulo e delimita a coana.',
    localizacao:
      'Face medial do processo pterigoide, formando a borda lateral da coana. Estende-se para baixo e termina no gancho do hâmulo pterigóideo.',
    funcao:
      'Delimita a passagem posterior do nariz e ancora a fáscia faringobasilar e o constritor superior da faringe pela rafe pterigomandibular. Sua extremidade superior escava o sulco por onde corre a tuba auditiva.',
    relacoes:
      'Medialmente está a coana e a nasofaringe; sua raiz sustenta a porção cartilagínea da tuba auditiva.',
    clinica:
      'A relação com a tuba auditiva explica por que tumores e cirurgias dessa região cursam com otite média serosa unilateral no adulto — sinal que, em adulto, obriga a examinar a nasofaringe.',
    memoria:
      'Medial = a lâmina que faz a moldura do "fundo do nariz". Se algo cresce ali, a tuba entope e a orelha enche de líquido.',
    pontos: [
      'Que estrutura da orelha se apoia na raiz da lâmina medial?',
      'Por que otite serosa unilateral no adulto exige olhar a nasofaringe?',
      'Que músculo da faringe se ancora na rafe pterigomandibular?',
    ],
  },
  {
    termos: ['Fossa Pterigóidea'],
    classe: 'acidente-osseo',
    resumo: 'Depressão em V entre as duas lâminas pterigóideas, onde se aloja o pterigóideo medial.',
    localizacao: 'Entre a lâmina lateral e a lâmina medial do processo pterigoide, abrindo-se posteriormente.',
    funcao: 'Aloja e dá origem ao músculo pterigóideo medial, que eleva e protrai a mandíbula, e ao tensor do véu palatino na sua parte superior.',
    relacoes: 'Atrás dela está o espaço parafaríngeo; à frente, o processo pterigoide separa-a da fossa pterigopalatina.',
    clinica:
      'O abscesso do espaço pterigomandibular, complicação de infecção do terceiro molar, se instala aqui e produz trismo intenso — o paciente não consegue abrir a boca, e isso muda toda a abordagem da via aérea.',
    memoria: 'Duas lâminas formando um V; dentro do V mora o pterigóideo medial. É o "berço" do músculo.',
    pontos: [
      'Que músculo ocupa a fossa pterigóidea?',
      'Por que abscesso nessa região causa trismo?',
      'Que fossa fica na frente, e o que passa por ela?',
    ],
  },
  {
    termos: ['Hâmulo Pterigoide'],
    classe: 'acidente-osseo',
    resumo: 'Gancho ósseo na ponta da lâmina medial que funciona como roldana para o tensor do véu palatino.',
    localizacao:
      'Extremidade inferior da lâmina medial do processo pterigoide, palpável na boca atrás do último molar superior, medialmente.',
    funcao:
      'É uma polia: o tendão do tensor do véu palatino contorna o hâmulo e muda de direção quase 90°, de vertical para horizontal, e só assim consegue tracionar o palato mole lateralmente e abrir a tuba auditiva ao deglutir.',
    relacoes: 'A mucosa da boca o recobre; a rafe pterigomandibular parte dele em direção à mandíbula.',
    clinica:
      'É por causa dessa roldana que a fissura palatina cursa com disfunção tubária e otite média de repetição: sem a inserção correta do tensor, a tuba não abre. Em palatoplastia, a fratura cirúrgica do hâmulo já foi usada para aliviar a tensão do retalho.',
    memoria:
      'Hâmulo = anzol. O tendão do tensor do véu passa pelo anzol e vira a esquina. Sem a esquina, a tuba não abre e a orelha enche.',
    pontos: [
      'Qual músculo usa o hâmulo como polia?',
      'Por que fissura palatina causa otite média de repetição?',
      'Onde você palparia o hâmulo na boca?',
    ],
  },
  {
    termos: ['Osso Palatino (Lâmina Horizontal)'],
    classe: 'osso',
    resumo: 'Lâmina que forma o terço posterior do palato duro, atrás dos processos palatinos da maxila.',
    localizacao:
      'Fecha o palato ósseo por trás. Encontra sua homóloga na linha média pela sutura palatina mediana e a maxila pela sutura palatina transversa.',
    funcao:
      'Completa o assoalho do nariz e o teto da boca, separando definitivamente respiração de deglutição. Sua borda posterior livre dá inserção à aponeurose do palato mole.',
    vascularizacao:
      'Artéria palatina maior, ramo terminal da palatina descendente, que emerge do forame palatino maior junto ao terceiro molar e corre para a frente num sulco ósseo. É o vaso que limita a largura do enxerto de palato na periodontia e o que sangra na palatoplastia.',
    relacoes:
      'Perfurada nas suas bordas pelos forames palatinos maior e menores, por onde chegam vasos e nervos palatinos vindos da fossa pterigopalatina.',
    clinica:
      'É onde termina a fissura palatina posterior. A anestesia do nervo palatino maior, feita no forame correspondente, dorme toda a mucosa do palato duro daquele lado — é o bloqueio de escolha para extrações dos molares superiores.',
    memoria:
      'O palato duro é feito por dois ossos: maxila na frente (2/3) e palatino atrás (1/3). Quem fecha a porta dos fundos é o palatino.',
    pontos: [
      'Que dois ossos formam o palato duro e em que proporção?',
      'O que atravessa o forame palatino maior?',
      'Onde se insere a aponeurose do palato mole?',
    ],
  },
  {
    termos: ['Osso Maxilar (Processo Palatino)'],
    classe: 'acidente-osseo',
    resumo: 'Lâmina horizontal da maxila que forma os dois terços anteriores do palato duro.',
    localizacao:
      'Parte medialmente do corpo da maxila, logo acima do arco alveolar, e encontra o do lado oposto na sutura palatina mediana.',
    funcao: 'Sustenta o teto da boca e o assoalho do nariz e transmite ao crânio a carga da mastigação vinda dos dentes superiores.',
    vascularizacao:
      'Artéria palatina maior, vindo de trás, e artéria nasopalatina, que desce pelo canal incisivo — as duas se anastomosam na porção anterior do palato duro.',
    relacoes:
      'Perfura-se à frente pelo canal incisivo (nervo nasopalatino). Acima está o assoalho da cavidade nasal; abaixo, a mucosa palatina.',
    clinica:
      'A fenda palatina anterior é a falta de fusão desses processos entre si e com o palatino — e sua consequência funcional é a comunicação boca-nariz, com refluxo alimentar nasal e fala hipernasal. A fusão ocorre por volta da 10ª semana; falhar aí é o que produz a fenda.',
    memoria:
      'Dois "abas" que se encontram no meio: se não se encontram, sobra um corredor da boca para o nariz. É essa a fenda palatina.',
    pontos: [
      'Em que semana os processos palatinos se fundem?',
      'O que passa pelo canal incisivo?',
      'Por que a fenda palatina causa fala hipernasal?',
    ],
  },
  {
    termos: ['Processos Alveolares', 'Arco Alveolar'],
    classe: 'acidente-osseo',
    resumo: 'Crista óssea escavada pelos alvéolos dentários, que existe apenas enquanto existirem dentes.',
    localizacao: 'Borda inferior da maxila e borda superior do corpo da mandíbula, formando o arco que carrega os dentes.',
    funcao:
      'Fixa a raiz de cada dente por meio do ligamento periodontal, transformando a mordida em carga distribuída pelo esqueleto facial. É osso dependente de função: existe porque o dente o estimula.',
    relacoes: 'Cada alvéolo é separado do vizinho pelos septos interalveolares; abaixo dele corre o canal mandibular ou o plexo alveolar superior.',
    clinica:
      'É o exemplo mais didático de atrofia por desuso do esqueleto: perdido o dente, o processo alveolar reabsorve em meses, e é essa reabsorção que faz a face do desdentado parecer encurtada e dificulta a colocação de implantes. Por isso o implante precoce preserva osso.',
    memoria:
      'Osso alveolar nasce com o dente e morre com o dente. Ele não é a casa do dente: ele é feito pelo dente.',
    pontos: [
      'Por que o processo alveolar reabsorve após a perda dentária?',
      'O que é o ligamento periodontal e qual sua função mecânica?',
      'Como isso muda o perfil facial do desdentado?',
    ],
  },
  {
    termos: ['Espinha Nasal Posterior'],
    classe: 'acidente-osseo',
    resumo: 'Pequena ponta óssea na linha média da borda posterior do palato duro.',
    localizacao: 'Extremidade posterior da sutura palatina mediana, entre as duas coanas, formada pelos ossos palatinos.',
    funcao: 'Dá inserção ao músculo úvula e é o ponto de ancoragem posterior da aponeurose palatina.',
    relacoes: 'Projeta-se para a nasofaringe; logo atrás dela começa o palato mole.',
    clinica:
      'É ponto cefalométrico de referência (ENP) em ortodontia e em cirurgia ortognática: a linha espinha nasal anterior–posterior define o plano palatino, usado para medir o quanto a maxila está rodada.',
    memoria: 'Ponta da frente e ponta de trás do palato duro: unidas, dão a régua do plano palatino.',
    pontos: [
      'Que músculo se insere na espinha nasal posterior?',
      'O que é o plano palatino em cefalometria?',
      'Onde termina o palato duro e começa o mole?',
    ],
  },
  {
    termos: ['Cóanos'],
    classe: 'passagem-ossea',
    resumo: 'As duas aberturas posteriores das cavidades nasais, por onde o ar passa do nariz para a nasofaringe.',
    localizacao:
      'Vistas de baixo, na base do crânio: duas janelas retangulares separadas na linha média pelo vômer, limitadas em cima pelo corpo do esfenoide, embaixo pela lâmina horizontal do palatino e lateralmente pela lâmina medial do pterigoide.',
    funcao: 'São a saída do ar condicionado pelo nariz — aquecido, umidificado e filtrado — para a faringe e a via aérea inferior.',
    vascularizacao:
      'Artéria esfenopalatina, que emerge do forame homônimo poucos milímetros acima e lateralmente a eles — o vaso da epistaxe posterior grave.',
    inervacao:
      'Nervo nasopalatino e ramos nasais posteriores de V2. A atresia coanal bilateral é emergência do recém-nascido, porque ele é respirador nasal obrigatório: a criança fica cianótica ao repouso e melhora ao chorar, o padrão paradoxal que faz o diagnóstico.',
    relacoes: 'Imediatamente atrás está a nasofaringe, com o óstio faríngeo da tuba auditiva na parede lateral e a tonsila faríngea no teto.',
    clinica:
      'A atresia de coanas é emergência neonatal: o recém-nascido é respirador nasal obrigatório, e a obstrução bilateral produz cianose que melhora ao chorar (porque aí ele abre a boca) e piora à mamada — um padrão paradoxal que fecha o diagnóstico à beira do leito. Testa-se passando uma sonda pela narina.',
    memoria:
      'Coana é a porta dos fundos do nariz. Recém-nascido com porta fechada fica cianótico calado e rosado chorando — o inverso de tudo o que você espera.',
    pontos: [
      'Quais ossos delimitam a coana?',
      'Por que a atresia de coanas dá cianose que melhora ao choro?',
      'O que existe imediatamente atrás das coanas?',
    ],
  },
  {
    termos: ['Fossa Mandibular'],
    classe: 'acidente-osseo',
    resumo: 'Concavidade do temporal que recebe o côndilo da mandíbula na articulação temporomandibular.',
    localizacao:
      'Face inferior da parte escamosa do temporal, imediatamente à frente do meato acústico externo, limitada à frente pelo tubérculo articular.',
    funcao:
      'Aloja o côndilo em repouso. Na abertura da boca, porém, o côndilo não fica aqui: ele desliza para a frente sobre o tubérculo articular — a ATM é uma articulação de rotação seguida de translação, e a fossa só responde pela primeira metade do movimento.',
    relacoes: 'Seu teto é fino e separa a articulação da fossa craniana média; atrás está a fissura petrotimpânica, por onde sai a corda do tímpano.',
    clinica:
      'O teto fino explica por que um golpe no mento pode empurrar o côndilo para dentro da fossa craniana média. E é a translação para o tubérculo que explica a luxação anterior da ATM: bocejo amplo, o côndilo passa do tubérculo e não volta — a boca trava aberta.',
    memoria:
      'Fossa = casa; tubérculo = rampa. Boca fechada, o côndilo está em casa; boca aberta, subiu a rampa. Quem passa da rampa luxa.',
    pontos: [
      'Que dois movimentos a ATM combina, e em que ordem?',
      'Por que a luxação da ATM é anterior?',
      'Que estrutura sai pela fissura petrotimpânica?',
    ],
  },
  {
    termos: ['Fossa Condilar'],
    classe: 'acidente-osseo',
    resumo: 'Depressão do occipital atrás do côndilo occipital, onde se abre o canal condilar.',
    localizacao: 'Na face externa da base, imediatamente posterior a cada côndilo occipital.',
    funcao: 'Acomoda o processo articular do atlas na extensão da cabeça e transmite a veia emissária condilar, que liga o plexo venoso vertebral ao seio sigmoide.',
    relacoes: 'À frente está o côndilo occipital e o canal do hipoglosso; atrás, a escama do occipital.',
    clinica:
      'Suas veias emissárias são uma via de disseminação de infecção e de trombose entre o pescoço e os seios durais — a mesma lógica das emissárias do escalpo. Em cirurgia da fossa posterior, são fonte de sangramento venoso incômodo.',
    memoria: 'Fossa atrás do côndilo, veia atravessando: é uma porta de mão dupla entre o plexo do pescoço e o crânio.',
    pontos: [
      'O que atravessa o canal condilar?',
      'Por que veias emissárias importam clinicamente?',
      'Qual a relação da fossa condilar com o movimento da cabeça?',
    ],
  },
  {
    termos: ['Côndilo Occipital'],
    classe: 'acidente-osseo',
    resumo: 'Par de superfícies convexas nas bordas do forame magno que articulam o crânio com o atlas.',
    localizacao: 'Nas margens laterais do forame magno, na parte lateral do osso occipital, com o eixo maior oblíquo para a frente e para dentro.',
    funcao:
      'Formam a articulação atlanto-occipital, que é a articulação do "sim": permite flexão e extensão da cabeça e um leve deslizamento lateral, mas praticamente nenhuma rotação — a rotação é do atlas sobre o áxis, uma articulação abaixo.',
    relacoes: 'À frente e por dentro corre o canal do nervo hipoglosso; medialmente está o forame magno com a transição bulbomedular.',
    clinica:
      'A fratura de côndilo occipital acompanha traumas de alta energia e pode lesar o XII par (língua desviando para o lado da lesão) e comprometer os ligamentos alares — instabilidade craniocervical, que é potencialmente fatal. Costuma passar despercebida na radiografia simples e exige tomografia.',
    memoria:
      'Côndilo occipital = "sim" (flexão/extensão). Atlas sobre o áxis = "não" (rotação). Duas articulações, dois gestos.',
    pontos: [
      'Que movimento a articulação atlanto-occipital permite?',
      'Que nervo corre logo à frente do côndilo?',
      'Por que a fratura condilar é perigosa?',
    ],
  },
  /* ─────────────────── Base externa: forames ─────────────────── */
  {
    termos: ['Canal do Nervo Hipoglosso'],
    classe: 'passagem-ossea',
    resumo: 'Canal que atravessa a base do côndilo occipital e dá saída ao XII par craniano.',
    localizacao: 'Na parte lateral do occipital, imediatamente acima e à frente do côndilo occipital, atravessando-o de dentro para fora.',
    funcao: 'Transmite o nervo hipoglosso, motor de toda a musculatura intrínseca e da maior parte da extrínseca da língua, além de um ramo meníngeo e um plexo venoso.',
    relacoes: 'Está anterior ao forame jugular; o XII cruza lateralmente à carótida interna depois de sair.',
    clinica:
      'Lesão aqui produz hemiatrofia e fasciculações da língua, que, protruída, desvia para o lado da lesão — porque o genioglosso sadio empurra a língua para o lado doente. É um dos sinais mais elegantes do exame neurológico: o desvio aponta a lesão.',
    memoria:
      '"A língua aponta para a lesão." Repita isso e você nunca mais erra o lado do XII par.',
    pontos: [
      'Qual nervo passa pelo canal do hipoglosso e o que ele inerva?',
      'Para que lado a língua desvia na lesão do XII?',
      'Qual a relação do canal com o forame jugular?',
    ],
  },
  {
    termos: ['Canal Carótico'],
    classe: 'passagem-ossea',
    resumo: 'Túnel na parte petrosa do temporal por onde a artéria carótida interna entra no crânio.',
    localizacao:
      'Abre-se na face inferior da parte petrosa, à frente do forame jugular, sobe verticalmente, faz uma curva de quase 90° e segue horizontalmente para a frente, terminando junto ao ápice da petrosa, acima do forame lacerado.',
    funcao:
      'Conduz a carótida interna e seu plexo simpático periarterial para dentro do crânio. O trajeto em cotovelo não é capricho: ele amortece a onda de pulso antes de o sangue chegar ao encéfalo.',
    relacoes:
      'Separado do forame jugular apenas pela crista petrosa — artéria à frente, veia atrás. Medialmente à sua porção horizontal está a cóclea e a orelha média.',
    clinica:
      'Fraturas transversas da petrosa podem lacerar a carótida no canal e produzir fístula carótido-cavernosa. Um paranganglioma ou uma carótida aberrante no ouvido médio é causa de zumbido pulsátil — a proximidade anatômica é a explicação.',
    memoria:
      'Na base, olhe dois buracos vizinhos: o da frente é a artéria (canal carótico), o de trás é a veia (forame jugular). Sangue entra pela frente, sai por trás.',
    pontos: [
      'Que estruturas entram pelo canal carótico?',
      'Como você distingue o canal carótico do forame jugular numa peça?',
      'Por que a carótida faz um trajeto em cotovelo?',
    ],
  },
  {
    termos: ['Forame Lacerado'],
    classe: 'passagem-ossea',
    resumo: 'Abertura irregular que, no vivo, é preenchida por cartilagem — não é uma passagem de verdade.',
    localizacao: 'Entre o ápice da parte petrosa do temporal, o corpo do esfenoide e a parte basilar do occipital.',
    funcao:
      'No crânio seco parece um grande buraco; no vivo está fechado por fibrocartilagem. Nada o atravessa verticalmente de forma completa: a carótida interna apenas cruza a sua face superior, saindo do canal carótico, e o nervo do canal pterigoideo o percorre por cima.',
    relacoes: 'Logo acima passa a carótida interna a caminho do seio cavernoso; à frente, o canal pterigoideo.',
    clinica:
      'A pegadinha clássica de prova é dizer que a carótida interna "passa pelo forame lacerado". Ela entra pelo canal carótico e passa por cima do lacerado — a diferença separa quem entendeu o trajeto de quem decorou uma lista.',
    memoria:
      'Lacerado é o buraco que engana: no cadáver seco é enorme, no vivo é cartilagem. É um buraco de mentira.',
    pontos: [
      'O forame lacerado é uma passagem verdadeira? Por quê?',
      'Por onde a carótida interna realmente entra no crânio?',
      'O que percorre o canal pterigoideo?',
    ],
  },
  {
    termos: ['Forames Palatinos (Maiores e Menores)'],
    classe: 'passagem-ossea',
    resumo: 'Aberturas na porção posterolateral do palato duro por onde chegam os nervos e vasos palatinos.',
    localizacao: 'O maior fica medial ao terceiro molar superior; os menores, logo atrás dele, no processo piramidal do palatino.',
    funcao:
      'O forame palatino maior transmite o nervo e a artéria palatina maior, que correm para a frente sob a mucosa do palato duro. Os menores transmitem os nervos palatinos menores para o palato mole e a tonsila.',
    relacoes: 'Ambos são a saída inferior do canal palatino, que desce da fossa pterigopalatina.',
    clinica:
      'É o alvo do bloqueio palatino maior, que anestesia a mucosa palatina de um lado até o canino. A artéria palatina maior é também a fonte do sangramento tardio pós-amigdalectomia e pós-palatoplastia — e por isso o retalho palatino tem seu pedículo desenhado em torno dela.',
    memoria:
      'Maior = palato duro (à frente); menores = palato mole (atrás). O tamanho do buraco acompanha o tamanho da área que ele inerva.',
    pontos: [
      'O que passa pelo forame palatino maior?',
      'Qual território os nervos palatinos menores atendem?',
      'Onde se aplica o bloqueio palatino maior?',
    ],
  },
  {
    termos: ['Fossa e Canal Incisivo'],
    classe: 'passagem-ossea',
    resumo: 'Depressão e canal na linha média anterior do palato, por onde passa o nervo nasopalatino.',
    localizacao: 'Imediatamente atrás dos incisivos centrais superiores, na sutura palatina mediana; o canal comunica o palato com o assoalho do nariz.',
    funcao: 'Transmite o nervo nasopalatino (ramo de V2) e a artéria esfenopalatina terminal, que inervam e irrigam a mucosa palatina anterior e a gengiva dos incisivos.',
    relacoes: 'É o marco embriológico do limite entre palato primário (à frente) e secundário (atrás).',
    clinica:
      'Sede do bloqueio nasopalatino, o mais desconfortável da odontologia. É também onde se instalam os cistos do canal incisivo (cisto do ducto nasopalatino), o cisto não odontogênico mais comum da maxila — imagem em coração na radiografia oclusal.',
    memoria:
      'Atrás dos dois incisivos há um buraquinho: é a fronteira entre o palato que veio da frente e o que veio dos lados no embrião.',
    pontos: [
      'Que nervo atravessa o canal incisivo?',
      'Que limite embriológico ele marca?',
      'Que cisto tipicamente se forma ali?',
    ],
  },
  {
    termos: ['Forame Estilomastoide'],
    classe: 'passagem-ossea',
    resumo: 'Orifício entre os processos estiloide e mastoide por onde o nervo facial deixa o crânio.',
    localizacao: 'Face inferior do temporal, exatamente entre a base do processo estiloide e o processo mastoide.',
    funcao:
      'Dá saída ao nervo facial já puramente motor: a corda do tímpano e o nervo petroso maior saíram antes, dentro do canal facial. Do forame, o VII entra na parótida e se divide nos cinco ramos terminais.',
    relacoes: 'A artéria estilomastóidea entra por ele; a parótida está imediatamente lateral.',
    clinica:
      'Distinguir lesão do facial acima ou abaixo desse forame é o que separa uma paralisia com olho seco e perda do gosto (proximal, dentro do canal) de uma paralisia puramente motora (distal). No recém-nascido, o mastoide ainda não se desenvolveu e o forame é superficial — por isso a incisão retroauricular no neonato lesa o facial com facilidade.',
    memoria:
      'Facial sai entre o "estilete" e o "mastro". Saiu do buraco, já é só músculo da mímica — gosto e lágrima ficaram para trás.',
    pontos: [
      'Que ramos o facial já emitiu antes de chegar ao forame?',
      'Como diferenciar lesão proximal e distal do VII?',
      'Por que o forame é vulnerável no recém-nascido?',
    ],
  },
  {
    termos: ['Forame Mastoideo'],
    classe: 'passagem-ossea',
    resumo: 'Pequeno orifício atrás do processo mastoide para a veia emissária mastóidea.',
    localizacao: 'Perto da sutura occipitomastóidea, na face posterior do processo mastoide. Sua presença e seu calibre variam muito de crânio para crânio.',
    funcao: 'Transmite a veia emissária mastóidea, que liga o seio sigmoide às veias occipitais e auriculares posteriores, e um ramo meníngeo da artéria occipital.',
    relacoes: 'Logo por dentro passa o seio sigmoide no seu sulco.',
    clinica:
      'É uma das rotas pelas quais infecção do couro cabeludo alcança os seios durais e produz trombose séptica. Em cirurgia do osso temporal, é o sinalizador da posição do seio sigmoide: sangramento por ali indica que a broca chegou perto demais.',
    memoria: 'Buraquinho atrás do mastoide = atalho de veia entre couro cabeludo e seio venoso. Atalho serve para o sangue e serve para a bactéria.',
    pontos: [
      'Que veia atravessa o forame mastóideo?',
      'A que seio dural ela se conecta?',
      'Por que ele é referência cirúrgica no osso temporal?',
    ],
  },
  {
    termos: ['Forame Cego'],
    classe: 'passagem-ossea',
    resumo: 'Pequeno orifício à frente da crista galli, entre o frontal e o etmoide.',
    localizacao: 'Na linha média da fossa craniana anterior, imediatamente anterior à crista galli.',
    funcao:
      'No adulto costuma ser fechado — daí "cego". Quando patente, transmite uma veia emissária que liga o seio sagital superior às veias da cavidade nasal. Na criança, é frequentemente permeável.',
    vascularizacao:
      'Transmite, quando pérvio, uma veia emissária que liga as veias nasais ao seio sagital superior — comunicação sem válvulas entre o nariz e o interior do crânio.',
    inervacao:
      'Não transmite nervo. Sua importância é outra: é o trajeto embrionário do divertículo dural que dá origem ao trato nasal, e a persistência dele produz o glioma nasal, o encefalocele nasofrontal e o cisto dermoide da linha média — massas nasais da criança que jamais devem ser biopsiadas sem imagem antes.',
    relacoes: 'Está entre a lâmina cribiforme, atrás, e o seio frontal, à frente.',
    clinica:
      'A permeabilidade explica as encefaloceles e os gliomas nasais da linha média na criança: tecido neural herniado por um forame cego que não se fechou. Toda massa nasal mediana em criança precisa de imagem antes de qualquer biópsia — biopsiar cérebro herniado é desastre.',
    memoria:
      '"Cego" porque no adulto não leva a lugar nenhum. Na criança, às vezes leva — e o que passa por ali pode ser cérebro.',
    pontos: [
      'Por que se chama forame cego?',
      'O que pode herniar por ele na criança?',
      'Por que não se biopsia massa nasal mediana infantil sem imagem?',
    ],
  },
  /* ─────────────────── Base interna ─────────────────── */
  {
    termos: ['Osso Etmoide (Crista Etmoidal)', 'Crista Etmoidal'],
    classe: 'acidente-osseo',
    resumo: 'Lâmina óssea vertical do etmoide que se projeta para a fossa craniana anterior — a crista galli.',
    localizacao: 'Na linha média da fossa craniana anterior, entre as duas lâminas cribiformes, apontando para cima.',
    funcao: 'Ancora a foice do cérebro, a prega de dura-máter que separa os dois hemisférios e impede que eles deslizem um sobre o outro nos movimentos da cabeça.',
    vascularizacao:
      'Artérias etmoidais anterior e posterior, ramos da oftálmica e portanto da carótida interna. Correm sobre a base do crânio em canais ósseos por vezes deiscentes — e a retração de uma delas para a órbita, na cirurgia endoscópica, produz hematoma retro-orbitário com risco de cegueira.',
    relacoes: 'À frente está o forame cego; lateralmente, as lâminas cribiformes com os filamentos olfatórios; abaixo, a cavidade nasal.',
    clinica:
      'É a âncora anterior da foice; quando a pressão intracraniana desloca o encéfalo, a foice é a lâmina rígida contra a qual o giro do cíngulo se hernia (hérnia subfalcina), comprimindo a artéria cerebral anterior. Meningiomas da goteira olfatória crescem exatamente aqui e produzem anosmia insidiosa.',
    memoria:
      '"Galli" é crista de galo. A crista de galo é o prego onde se pendura a foice do cérebro.',
    pontos: [
      'O que se insere na crista galli?',
      'Que hérnia cerebral a foice condiciona?',
      'Que sintoma precoce dá um meningioma da goteira olfatória?',
    ],
  },
  {
    termos: ['Lâmina Cribiforme'],
    classe: 'passagem-ossea',
    resumo: 'Lâmina peneirada do etmoide por onde os filamentos do nervo olfatório sobem do nariz ao bulbo olfatório.',
    localizacao: 'Assoalho da fossa craniana anterior, de cada lado da crista galli, formando o teto da cavidade nasal.',
    funcao:
      'Deixa passar cerca de vinte filamentos olfatórios de cada lado, prolongamentos centrais dos neurônios bipolares da mucosa olfatória, que sobem para fazer sinapse no bulbo olfatório apoiado sobre ela.',
    relacoes: 'Acima, o bulbo e o trato olfatório; abaixo, a fenda olfatória do nariz. A dura-máter e a aracnoide acompanham cada filamento por um curto trecho.',
    clinica:
      'É a lâmina mais fina da base do crânio, e por isso a anosmia é a sequela neurológica mais comum do traumatismo cranioencefálico: o cérebro desliza, os filamentos se rompem na peneira. As bainhas meníngeas que acompanham os filamentos explicam a fístula liquórica nasal (rinorreia de LCR) e a meningite pós-traumática, e são a rota pela qual amebas de água doce chegam ao encéfalo.',
    memoria:
      'É uma peneira. Peneira quebra fácil, e o que passa por ela sobe direto para dentro do crânio — cheiro, líquor e, na pior hipótese, infecção.',
    pontos: [
      'Que nervo craniano atravessa a lâmina cribiforme?',
      'Por que anosmia é comum após TCE?',
      'Como se forma a rinorreia de líquor?',
    ],
  },
  {
    termos: ['Osso Esfenoide (Corpo)', 'Corpo do Esfenoide (Sela Túrcica)'],
    classe: 'acidente-osseo',
    resumo: 'Bloco central e oco do esfenoide, escavado em cima pela sela túrcica e ocupado por dentro pelo seio esfenoidal.',
    localizacao:
      'No centro geométrico da base do crânio, entre as duas asas maiores. Acima está a fossa hipofisária; à frente, o tubérculo da sela e o sulco pré-quiasmático; atrás, o dorso da sela e o clivo.',
    funcao:
      'Aloja e protege a hipófise e ancora as demais peças da base — o esfenoide se articula com doze ossos, o que faz dele a chave de abóbada do crânio. O seio esfenoidal aligeira o bloco e é a porta de acesso cirúrgico à sela.',
    vascularizacao:
      'Ramos da artéria esfenopalatina e da artéria do canal pterigóideo para o osso e a mucosa do seio; a artéria carótida interna corre no sulco carótico da sua face lateral, dentro do seio cavernoso, separada do seio esfenoidal por uma lâmina óssea às vezes deiscente — o risco maior da cirurgia transesfenoidal da hipófise.',
    relacoes:
      'Lateralmente, os seios cavernosos com a carótida interna e os pares III, IV, V1, V2 e VI; acima, o quiasma óptico.',
    clinica:
      'A cirurgia transesfenoidal atravessa nariz e seio esfenoidal para chegar ao adenoma hipofisário sem abrir o crânio: é a anatomia definindo a via. E é a relação com o quiasma que faz o macroadenoma dar hemianopsia bitemporal — as fibras nasais cruzadas são as primeiras a serem comprimidas de baixo para cima.',
    memoria:
      'O esfenoide é a pedra de fecho do crânio, e no meio dela há uma sela onde senta a hipófise. Quem cresce na sela empurra o quiasma e apaga os campos temporais.',
    pontos: [
      'Por que a hipófise é abordada por via transesfenoidal?',
      'Que déficit visual o macroadenoma causa e por quê?',
      'Que estruturas correm nos seios cavernosos, ao lado do corpo?',
    ],
  },
  {
    termos: ['Tubérculo da Sela'],
    classe: 'acidente-osseo',
    resumo: 'Elevação transversal que marca a borda anterior da fossa hipofisária.',
    localizacao: 'Entre o sulco pré-quiasmático, à frente, e a fossa hipofisária, atrás, no corpo do esfenoide.',
    funcao: 'Delimita a sela por diante e serve de apoio à prega de dura-máter (diafragma da sela) que fecha a fossa hipofisária.',
    relacoes: 'Imediatamente acima e atrás dele está o quiasma óptico; lateralmente, os processos clinoides médios.',
    clinica:
      'Os meningiomas do tubérculo da sela são famosos porque comprimem o quiasma por baixo e à frente, produzindo perda visual assimétrica que se confunde por meses com neurite óptica — um caso em que a anatomia do sítio prediz o erro diagnóstico.',
    memoria: 'Tubérculo = degrau da frente da sela. É o degrau que empurra o nervo óptico quando um tumor cresce ali.',
    pontos: [
      'Que estrutura visual está logo acima do tubérculo da sela?',
      'O que é o diafragma da sela?',
      'Por que meningioma do tubérculo simula neurite óptica?',
    ],
  },
  {
    termos: ['Processo Clinoide Anterior'],
    classe: 'acidente-osseo',
    resumo: 'Ponta medial e posterior da asa menor do esfenoide, que aponta para a sela como o encosto de uma cadeira.',
    localizacao: 'Extremidade posteromedial da asa menor, lateralmente ao canal óptico e acima do seio cavernoso.',
    funcao: 'Fixa a borda livre da tenda do cerebelo e faz o teto da porção anterior do seio cavernoso, formando o anel dural por onde a carótida interna deixa o seio.',
    relacoes:
      'Medial a ele passa o nervo óptico saindo do canal; abaixo, a carótida interna faz o seu último giro; lateralmente corre o nervo oculomotor entrando no seio cavernoso.',
    clinica:
      'A clinoidectomia anterior é passo obrigatório para expor aneurismas do segmento oftálmico da carótida: sem retirar essa ponta óssea, o colo do aneurisma não aparece. É também onde o III par é comprimido primeiro na herniação uncal — daí a midríase precoce.',
    memoria:
      '"Clinoide" vem de leito. São os quatro pés da cama onde deita a hipófise: dois anteriores, dois posteriores.',
    pontos: [
      'Que nervo passa medial ao processo clinoide anterior?',
      'Que prega dural se fixa nele?',
      'Por que ele é removido em cirurgia de aneurisma oftálmico?',
    ],
  },
  {
    termos: ['Osso Temporal (Parte Petrosa)'],
    classe: 'acidente-osseo',
    resumo: 'Pirâmide de osso densíssimo que abriga toda a orelha interna e separa a fossa média da posterior.',
    localizacao:
      'Encravada entre o esfenoide e o occipital, com o ápice apontando anteromedialmente. Sua face anterossuperior forma o assoalho da fossa média; a posterior, a parede anterior da fossa posterior.',
    funcao:
      'Protege a cóclea, o vestíbulo e os canais semicirculares — as estruturas mais delicadas do corpo, que exigem o osso mais compacto do corpo. Transmite ainda a carótida interna pelo canal carótico e o facial e o vestibulococlear pelo meato acústico interno.',
    vascularizacao:
      'Artéria carótida interna atravessa-a pelo canal carótico; a artéria estilomastóidea e ramos da meníngea média irrigam o osso. O ápice petroso tem medula óssea vascularizada em cerca de 30% das pessoas — a razão de a apicite petrosa (síndrome de Gradenigo) existir: otorreia, dor retro-orbitária e paralisia do VI par.',
    relacoes:
      'Sua borda superior aloja o seio petroso superior e sustenta a tenda do cerebelo; a borda posterior, o seio petroso inferior; a face posterior tem o meato acústico interno.',
    clinica:
      'A classificação da fratura de temporal segue o eixo da pirâmide: as longitudinais (mais comuns) rompem a orelha média e dão perda auditiva condutiva, otorragia e otorreia liquórica; as transversas atravessam a orelha interna e dão surdez neurossensorial, vertigem e paralisia facial. Saber o eixo do osso é saber prever o déficit.',
    memoria:
      '"Petrosa" = pedra. É pedra porque protege o mais frágil que existe. Fratura ao longo da pedra = orelha média; fratura atravessando a pedra = orelha interna.',
    pontos: [
      'Que estruturas a parte petrosa aloja?',
      'Diferencie fratura longitudinal e transversa quanto ao déficit.',
      'Que fossas cranianas ela separa?',
    ],
  },
  {
    termos: ['Crista Occipital Interna'],
    classe: 'acidente-osseo',
    resumo: 'Crista mediana na face interna da escama do occipital, que ancora a foice do cerebelo.',
    localizacao: 'Desce da protuberância occipital interna até o forame magno, dividindo as duas fossas cerebelares.',
    funcao: 'Fixa a foice do cerebelo e aloja, na sua espessura, o seio occipital.',
    relacoes: 'Cruza-se com os sulcos dos seios transversos na protuberância occipital interna, formando a eminência cruciforme.',
    clinica:
      'A eminência cruciforme marca a confluência dos seios (tórcula de Herófilo): trepanar acima ou abaixo dela é escolher entre entrar na fossa média ou na posterior — e romper a confluência é hemorragia venosa de controle difícil.',
    memoria:
      'Por dentro do occipital há uma cruz: braços horizontais são os seios transversos, o inferior é a crista occipital interna. No centro da cruz, a tórcula.',
    pontos: [
      'Que prega dural se insere na crista occipital interna?',
      'O que é a eminência cruciforme?',
      'Que seio venoso corre dentro da crista?',
    ],
  },
  {
    termos: ['Fossa Cerebelar'],
    classe: 'acidente-osseo',
    resumo: 'Depressão profunda de cada lado da crista occipital interna, que acomoda um hemisfério cerebelar.',
    localizacao: 'Parte inferior da face interna da escama do occipital, abaixo dos sulcos dos seios transversos.',
    funcao: 'Aloja os hemisférios do cerebelo e, com o clivo à frente, delimita a fossa craniana posterior, onde ficam também a ponte e o bulbo.',
    relacoes: 'Acima, a tenda do cerebelo a separa dos lobos occipitais; à frente e abaixo, o forame magno.',
    clinica:
      'A fossa posterior é um compartimento pequeno e inelástico: qualquer expansão ali — hematoma, AVC cerebelar edemaciado, tumor — comprime rapidamente o IV ventrículo e o tronco encefálico, e leva à herniação das tonsilas pelo forame magno. É por isso que um AVC cerebelar pode matar com um volume que seria banal no hemisfério cerebral.',
    memoria:
      'Fossa posterior é o "porta-malas" do crânio: pequeno, sem folga e com o tronco encefálico dentro. Nada cresce ali impunemente.',
    pontos: [
      'Que estruturas ocupam a fossa craniana posterior?',
      'Por que lesões expansivas ali são especialmente perigosas?',
      'Que prega dural forma o teto da fossa cerebelar?',
    ],
  },
  {
    termos: ['Sulco do Seio Sigmoide'],
    classe: 'acidente-osseo',
    resumo: 'Goteira em S na face interna do temporal e do occipital que aloja o seio sigmoide.',
    localizacao: 'Continua o sulco do seio transverso, curva-se em S descendo por trás da parte petrosa e termina no forame jugular.',
    funcao: 'Aloja o segmento final do sistema venoso dural, que se torna a veia jugular interna ao cruzar o forame jugular.',
    relacoes: 'Está imediatamente medial às células mastóideas — separado delas, às vezes, por menos de um milímetro de osso.',
    clinica:
      'Essa vizinhança de milímetros explica a trombose do seio sigmoide como complicação de mastoidite, e explica também por que a mastoidectomia é uma cirurgia de precisão: entrar no sulco é abrir um seio venoso. A síndrome de Lemierre e a hipertensão intracraniana por trombose do sigmoide nascem daqui.',
    memoria: 'Transverso corre reto, sigmoide faz o S e vira jugular. Do lado dele, só as células do mastoide.',
    pontos: [
      'Em que estrutura o seio sigmoide se transforma?',
      'Que estrutura da orelha é sua vizinha imediata?',
      'Por que mastoidite pode causar trombose venosa cerebral?',
    ],
  },
  {
    termos: ['Sulco do Seio Transverso'],
    classe: 'acidente-osseo',
    resumo: 'Goteira horizontal que corre da protuberância occipital interna para os lados, alojando o seio transverso.',
    localizacao: 'Face interna do occipital, na inserção da tenda do cerebelo, seguindo até o ângulo posteroinferior do parietal.',
    funcao: 'Aloja o seio transverso, que recebe o sangue da confluência dos seios e o leva ao seio sigmoide. Costuma ser assimétrico, com o direito habitualmente dominante.',
    relacoes: 'A tenda do cerebelo se insere nas suas bordas — o sulco é, portanto, a linha divisória entre o supra e o infratentorial.',
    clinica:
      'A assimetria fisiológica dos transversos é a causa número um de falso positivo de trombose venosa em angiorressonância. Na prática cirúrgica, o sulco marca a linha para não cruzar quando se faz uma craniotomia suboccipital.',
    memoria:
      'Os braços horizontais da cruz occipital interna. À direita, quase sempre o mais calibroso — e isso é normal, não é trombose do esquerdo.',
    pontos: [
      'Que seios se conectam pelo transverso?',
      'Por que a assimetria dos transversos confunde a imagem?',
      'Que prega dural se insere nas bordas do sulco?',
    ],
  },
  /* ─────────────────── Vistas externas da calvária ─────────────────── */
  {
    termos: ['Sulco do Seio Sagital Superior'],
    classe: 'acidente-osseo',
    resumo: 'Goteira mediana na face interna da calvária que aloja o maior seio dural.',
    localizacao: 'Percorre a linha média por dentro do frontal, dos parietais e do occipital, aprofundando-se de diante para trás até a confluência dos seios.',
    funcao: 'Aloja o seio sagital superior, que drena a maior parte do córtex e recebe o líquor reabsorvido pelas granulações aracnóideas.',
    relacoes: 'Suas bordas dão inserção à foice do cérebro; ao seu lado abrem-se as fovéolas granulares e as lacunas laterais.',
    clinica:
      'A ferida penetrante ou a craniotomia sobre a linha média pode abrir o seio: hemorragia maciça e risco de embolia aérea, porque a pressão dentro dele é próxima de zero. A trombose do seio sagital superior dá cefaleia, papiledema e crises — quadro de hipertensão intracraniana sem massa.',
    memoria: 'Rego no meio do teto do crânio. Cortar o teto no meio é abrir o esgoto principal do cérebro.',
    pontos: [
      'O que o seio sagital superior drena?',
      'Por que abrir esse seio traz risco de embolia aérea?',
      'Que prega dural se insere nas bordas do sulco?',
    ],
  },
  {
    termos: ['Fovéolas Granulares'],
    classe: 'acidente-osseo',
    resumo: 'Escavações da tábua interna do crânio produzidas pelas granulações aracnóideas.',
    localizacao: 'Aos lados do sulco do seio sagital superior, principalmente nos parietais e no frontal, junto às lacunas laterais.',
    funcao:
      'Alojam as granulações aracnóideas (de Pacchioni), tufos de aracnoide que projetam para dentro do seio venoso e por onde o líquor é reabsorvido para o sangue. São, literalmente, a marca que a reabsorção liquórica deixa no osso.',
    relacoes: 'Comunicam-se com o seio sagital superior; aumentam em número e profundidade com a idade.',
    clinica:
      'Compreender essa via explica a hidrocefalia comunicante: após hemorragia subaracnóidea ou meningite, as granulações entopem, o líquor continua sendo produzido e a pressão sobe sem que haja bloqueio dentro dos ventrículos. As fovéolas profundas também podem ser confundidas com lesões líticas na radiografia de crânio.',
    memoria:
      'Buraquinhos no teto porque o líquor "gotejou" para dentro da veia por ali durante a vida inteira. Entupiu o ralo, a água sobe: hidrocefalia comunicante.',
    pontos: [
      'O que são granulações aracnóideas e para que servem?',
      'Como a obstrução delas causa hidrocefalia comunicante?',
      'Por que fovéolas aumentam com a idade?',
    ],
  },
  {
    termos: ['Sulco para Artéria Meníngea e seus Ramos'],
    classe: 'acidente-osseo',
    resumo: 'Ramificações em árvore escavadas na face interna do crânio pela artéria meníngea média.',
    localizacao: 'Na face interna do parietal e da escama do temporal, subindo do forame espinhoso e dividindo-se em ramo frontal e ramo parietal.',
    funcao: 'Aloja a artéria meníngea média, que nutre a dura-máter e o osso vizinho. O sulco é tanto mais profundo quanto mais idoso o crânio, e às vezes se converte em canal completo.',
    relacoes: 'O ramo frontal cruza justamente o ptério, região onde o osso é mais fino.',
    clinica:
      'É a anatomia do hematoma extradural: trauma no ptério, fratura, laceração da meníngea média, sangue arterial descolando a dura do osso, intervalo lúcido e depois deterioração rápida. A imagem é uma lente biconvexa que não cruza suturas, porque a dura está aderida a elas.',
    memoria:
      'Uma árvore desenhada no osso, com a raiz no forame espinhoso. Bater onde a árvore é mais fina — o ptério — é o extradural clássico.',
    pontos: [
      'Por onde a artéria meníngea média entra no crânio?',
      'Por que o hematoma extradural tem forma de lente biconvexa?',
      'Que região do crânio é a mais vulnerável e por quê?',
    ],
  },
  {
    termos: ['Forame Parietal'],
    classe: 'passagem-ossea',
    resumo: 'Pequeno orifício inconstante perto da borda sagital do parietal, para uma veia emissária.',
    localizacao: 'A poucos centímetros do lambda, junto à sutura sagital, num ou nos dois parietais.',
    funcao: 'Transmite a veia emissária parietal, que liga as veias do couro cabeludo ao seio sagital superior, e às vezes um ramo da artéria occipital.',
    relacoes: 'Abre-se diretamente sobre o seio sagital superior.',
    clinica:
      'Faz parte da "área perigosa" do escalpo: infecção do couro cabeludo pode descer por essa veia e produzir trombose do seio sagital superior. Forames parietais muito alargados são uma condição hereditária benigna, mas assustam na radiografia por parecerem lesões líticas.',
    memoria: 'Buraquinho no alto da cabeça, ligado direto ao seio sagital. Furúnculo no couro cabeludo tem estrada pronta para dentro.',
    pontos: [
      'Que veia atravessa o forame parietal?',
      'Por que ele participa da "área perigosa" do escalpo?',
      'O que são forames parietais alargados?',
    ],
  },
  {
    termos: ['Protuberância Occipital Externa'],
    classe: 'acidente-osseo',
    resumo: 'Saliência mediana na nuca, o ínio, ponto de referência palpável da linha média posterior.',
    localizacao: 'No centro da face externa da escama do occipital, na altura em que o pescoço encontra o crânio.',
    funcao: 'Dá inserção ao ligamento nucal e à parte superior do trapézio, e é o marco superficial de onde parte a linha nucal superior.',
    relacoes: 'Por dentro, a poucos milímetros, está a protuberância occipital interna e a confluência dos seios.',
    clinica:
      'É referência para posicionar eletrodos occipitais no EEG, para o bloqueio do nervo occipital maior na neuralgia de Arnold e para saber onde não trepanar: por dentro dela está a tórcula. Em crianças, a projeção exagerada é achado normal.',
    memoria: 'O "calombo da nuca" é o ínio. Por fora é referência; por dentro, é encontro de seios venosos — não fure.',
    pontos: [
      'O que se insere na protuberância occipital externa?',
      'Que estrutura venosa está logo por dentro dela?',
      'Que bloqueio nervoso usa esse reparo?',
    ],
  },
  {
    termos: ['Crista Occipital Externa'],
    classe: 'acidente-osseo',
    resumo: 'Crista mediana que desce do ínio ao forame magno, dando inserção ao ligamento nucal.',
    localizacao: 'Linha média da face externa da escama do occipital, entre a protuberância occipital externa e o forame magno.',
    funcao: 'Ancora o ligamento nucal, o septo elástico mediano que sustenta a cabeça contra a gravidade e serve de origem aos músculos do dorso do pescoço.',
    relacoes: 'De cada lado dela partem as linhas nucais inferiores; sob ela estão os músculos suboccipitais.',
    clinica:
      'O ligamento nucal é o alvo do bloqueio nas cervicalgias posteriores e um dos sítios de dor na cefaleia cervicogênica. Sua ossificação, comum com a idade, aparece na radiografia como uma faixa densa na nuca e não é doença.',
    memoria: 'Uma quilha na nuca onde se prende a "vela" que segura a cabeça: o ligamento nucal.',
    pontos: [
      'Que ligamento se insere na crista occipital externa?',
      'Que função mecânica o ligamento nucal desempenha?',
      'Que músculos ocupam a região abaixo dela?',
    ],
  },
  {
    termos: ['Linha Nucal Superior'],
    classe: 'acidente-osseo',
    resumo: 'Crista transversal que parte do ínio para os lados, marcando o limite superior das inserções da nuca.',
    localizacao: 'Face externa do occipital, estendendo-se lateralmente da protuberância occipital externa até o processo mastoide.',
    funcao: 'Dá inserção ao trapézio (parte descendente), ao esternocleidomastóideo, ao esplênio da cabeça e ao occipital do epicrânio. É a fronteira entre o couro cabeludo e o dorso do pescoço.',
    relacoes: 'Acima dela, o crânio é liso e coberto pela gálea; abaixo, começa a musculatura da nuca.',
    clinica:
      'O nervo occipital maior (C2) emerge logo abaixo dela, medialmente — referência do bloqueio na neuralgia occipital, feito a cerca de dois centímetros lateralmente à protuberância, ao lado da artéria occipital pulsátil.',
    memoria: 'A linha onde o couro cabeludo "termina" e o pescoço começa. Logo abaixo dela sai o nervo occipital maior.',
    pontos: [
      'Que músculos se inserem na linha nucal superior?',
      'Onde emerge o nervo occipital maior em relação a ela?',
      'Que limite anatômico ela representa?',
    ],
  },
  {
    termos: ['Linha Nucal Inferior'],
    classe: 'acidente-osseo',
    resumo: 'Crista transversal mais baixa, para a inserção dos músculos suboccipitais profundos.',
    localizacao: 'A meio caminho entre a linha nucal superior e o forame magno, partindo do meio da crista occipital externa.',
    funcao: 'Dá inserção aos retos posteriores maior e menor da cabeça e ao oblíquo superior — os músculos do trígono suboccipital, responsáveis pelo ajuste fino da posição da cabeça.',
    relacoes: 'No trígono suboccipital, sob esses músculos, correm a artéria vertebral e o nervo suboccipital (C1).',
    clinica:
      'A contratura desses músculos é uma causa frequente de cefaleia tensional occipital. E a artéria vertebral, ao percorrer o trígono, é vulnerável em manipulações cervicais bruscas — dissecção vertebral é complicação descrita da quiropraxia cervical.',
    memoria:
      'Linha de cima: músculos grandes e superficiais. Linha de baixo: os pequenos suboccipitais, e sob eles a artéria vertebral.',
    pontos: [
      'Que músculos se inserem na linha nucal inferior?',
      'O que corre no trígono suboccipital?',
      'Por que manipulação cervical brusca pode ser perigosa?',
    ],
  },
  {
    termos: ['Arco Superciliar'],
    classe: 'acidente-osseo',
    resumo: 'Relevo arqueado do frontal acima da órbita, mais marcado no crânio masculino.',
    localizacao: 'Na escama do frontal, acima da margem supraorbital, convergindo medialmente para a glabela.',
    funcao:
      'Reforça mecanicamente a borda superior da órbita e é um dos pilares que dissipam a força da mastigação e do trauma frontal. É também caractere sexual secundário do crânio, usado em antropologia forense.',
    relacoes: 'Por dentro dele, na maior parte dos crânios, está o seio frontal; abaixo, a margem supraorbital e o conteúdo da órbita.',
    clinica:
      'Uma laceração supraciliar sangra muito e assusta, mas a preocupação real é a fratura do seio frontal por baixo — que exige tomografia, porque a parede posterior rota comunica a face com a fossa anterior. Na cirurgia de feminilização facial, é justamente o arco superciliar que se remodela.',
    memoria: 'A "sobrancelha óssea". Por fora é sobrancelha; por dentro, seio frontal.',
    pontos: [
      'Que seio paranasal está por trás do arco superciliar?',
      'Por que ele é usado na determinação do sexo em antropologia?',
      'O que preocupa numa fratura dessa região?',
    ],
  },
  {
    termos: ['Incisura Supraorbital'],
    classe: 'passagem-ossea',
    resumo: 'Entalhe (ou forame) na margem supraorbital por onde saem o nervo e os vasos supraorbitais.',
    localizacao: 'Na junção do terço medial com os dois terços laterais da margem supraorbital do frontal, na mesma vertical da pupila.',
    funcao: 'Dá passagem ao nervo supraorbital (ramo de V1) e à artéria supraorbital, que sobem para inervar e irrigar a fronte e o couro cabeludo até o vértice.',
    relacoes: 'Em cerca de um quarto dos crânios, a incisura é fechada e vira forame supraorbital.',
    clinica:
      'Dois usos de beira de leito: é o ponto de compressão para avaliar resposta à dor no paciente com rebaixamento de consciência, e é o alvo do bloqueio supraorbital para sutura de ferimentos da testa. Lembre também que a região da fronte pertence ao V1 — o herpes-zóster oftálmico segue exatamente esse território.',
    memoria:
      'Linha da pupila: supraorbital em cima, infraorbital no meio, mentual embaixo. Os três buracos do trigêmeo estão na mesma vertical.',
    pontos: [
      'Que nervo atravessa a incisura supraorbital e de que divisão do V ele vem?',
      'Qual o alinhamento vertical dos três forames faciais?',
      'Para que serve a compressão supraorbital no exame neurológico?',
    ],
  },
  {
    termos: ['Canal Óptico'],
    classe: 'passagem-ossea',
    resumo: 'Canal na asa menor do esfenoide por onde o nervo óptico deixa a órbita e a artéria oftálmica entra nela.',
    localizacao: 'Na raiz da asa menor do esfenoide, medial à fissura orbital superior e separado dela pela raiz óssea óptica.',
    funcao:
      'Transmite o nervo óptico envolto pelas três meninges — e, portanto, por líquor — e a artéria oftálmica, primeiro ramo intradural da carótida interna, que corre inferolateralmente ao nervo.',
    relacoes: 'O canal está imediatamente lateral ao corpo do esfenoide e ao seio esfenoidal; acima, o quiasma óptico.',
    clinica:
      'Como o nervo óptico carrega bainha meníngea, o aumento da pressão intracraniana se transmite até o disco: é assim que se forma o papiledema. Fraturas do canal produzem neuropatia óptica traumática com perda visual imediata e defeito pupilar aferente. E a proximidade com o seio esfenoidal explica a neurite óptica por sinusite esfenoidal.',
    memoria:
      'Pelo canal óptico entra artéria e sai nervo. E o nervo leva líquor junto — por isso a pressão do crânio aparece no fundo de olho.',
    pontos: [
      'O que atravessa o canal óptico, em cada sentido?',
      'Por que hipertensão intracraniana causa papiledema?',
      'Que estrutura separa o canal óptico da fissura orbital superior?',
    ],
  },
  {
    termos: ['Abertura Piriforme'],
    classe: 'passagem-ossea',
    resumo: 'Abertura anterior em forma de pera do esqueleto nasal, fechada em vida pelas cartilagens do nariz.',
    localizacao: 'Na face anterior do crânio, delimitada pelos ossos nasais em cima e pelas maxilas nos lados e embaixo, terminando na espinha nasal anterior.',
    funcao: 'É a entrada óssea do trato respiratório. Sua área determina, em boa parte, a resistência nasal ao fluxo de ar.',
    relacoes: 'Sua borda inferolateral corresponde, no vivo, à válvula nasal — o ponto mais estreito de toda a via aérea.',
    clinica:
      'A estenose congênita da abertura piriforme é causa de obstrução nasal grave no recém-nascido, com quadro semelhante ao da atresia de coanas. No adulto, o colapso da válvula nasal explica por que muitos pacientes só respiram bem quando tracionam a bochecha lateralmente — a manobra de Cottle.',
    memoria: 'Buraco em forma de pera na frente do crânio. É onde o nariz de carne se encaixa no nariz de osso.',
    pontos: [
      'Que ossos delimitam a abertura piriforme?',
      'Onde fica o ponto mais estreito da via aérea nasal?',
      'Que quadro neonatal a estenose piriforme simula?',
    ],
  },
  {
    termos: ['Espinha Nasal Anterior'],
    classe: 'acidente-osseo',
    resumo: 'Projeção mediana na base da abertura piriforme, formada pelas duas maxilas.',
    localizacao: 'Linha média da margem inferior da abertura piriforme, onde as maxilas se encontram.',
    funcao: 'Sustenta a base da cartilagem do septo nasal e, portanto, a projeção e o ângulo da ponta do nariz.',
    relacoes: 'Acima está a cartilagem septal; atrás, o assoalho do nariz e o palato duro.',
    clinica:
      'É ponto cefalométrico (ENA) e alvo cirúrgico em rinoplastia: reduzir a espinha diminui o ângulo nasolabial e "abaixa" a ponta do nariz. Sua fratura acompanha traumas nasais e causa desabamento da base do septo.',
    memoria: 'A ponta óssea de onde o nariz de cartilagem se levanta. Mexer nela muda o ângulo entre nariz e lábio.',
    pontos: [
      'O que se apoia na espinha nasal anterior?',
      'Que efeito estético sua redução produz?',
      'Que outro ponto cefalométrico faz par com ela?',
    ],
  },
  {
    termos: ['Concha Nasal Média'],
    classe: 'osso',
    resumo: 'Lamela enrolada do etmoide que cobre o meato médio, para onde drena a maioria dos seios paranasais.',
    localizacao: 'Parede lateral da cavidade nasal, projetando-se medialmente a partir do labirinto etmoidal, acima da concha inferior.',
    funcao:
      'Aumenta a superfície mucosa e cria turbulência no ar inspirado, mas seu papel decisivo é abrigar, sob si, o meato médio, onde se abrem o seio maxilar, o frontal e as células etmoidais anteriores — o chamado complexo ostiomeatal.',
    vascularizacao:
      'Artéria esfenopalatina e artéria etmoidal anterior, que se encontram nela — carótida externa e interna irrigando o mesmo osso.',
    inervacao:
      'Ramos nasais posteriores superiores de V2 e ramo nasal interno do etmoidal anterior (V1). É a referência anatômica central da cirurgia endoscópica: sua inserção na base do crânio define o limite superior seguro, e sua lateralização é o passo que abre o complexo ostiomeatal.',
    relacoes: 'Sob sua inserção corre o processo uncinado e a bula etmoidal; medialmente está o septo, formando a fenda olfatória em cima.',
    clinica:
      'É a estrutura-chave da cirurgia endoscópica nasal: quase toda sinusite crônica se resolve desobstruindo o complexo ostiomeatal sob a concha média. Sua pneumatização (concha bolhosa) estreita o meato e é causa anatômica reconhecida de sinusite de repetição.',
    memoria:
      'Concha média = telhado do meato médio, e o meato médio é a "boca de lobo" de quase todos os seios. Entupiu ali, entope tudo.',
    pontos: [
      'Que seios drenam para o meato médio?',
      'O que é o complexo ostiomeatal?',
      'O que é uma concha bolhosa e por que ela importa?',
    ],
  },
  {
    termos: ['Concha Nasal Inferior'],
    classe: 'osso',
    resumo: 'Osso independente que forma a maior das conchas e cobre o meato inferior.',
    localizacao: 'Presa à parede lateral do nariz, abaixo da concha média; é um osso próprio, não uma parte do etmoide.',
    funcao:
      'É a principal responsável por aquecer e umidificar o ar: sua mucosa é rica em sinusoides venosos que enchem e esvaziam alternadamente, produzindo o ciclo nasal. Sob ela abre-se o ducto nasolacrimal.',
    vascularizacao:
      'Artéria nasal posterior lateral, ramo da esfenopalatina, que entra pela sua extremidade posterior e corre num sulco ósseo próprio. Sob a mucosa há sinusoides venosos cavernosos que enchem e esvaziam alternadamente — o ciclo nasal, responsável por uma narina entupir a cada poucas horas em pessoa saudável.',
    inervacao:
      'Nervo nasal posterior inferior lateral, ramo de V2, com fibras parassimpáticas do gânglio pterigopalatino que comandam a vasodilatação e a secreção. É o alvo da turbinectomia e da cauterização na rinite crônica.',
    relacoes: 'Articula-se com a maxila, o lacrimal, o etmoide e o palatino; medialmente está o septo.',
    clinica:
      'A hipertrofia de conchas inferiores é a causa mais comum de obstrução nasal crônica na rinite, e responde a corticoide tópico antes de qualquer cirurgia. O ducto nasolacrimal abrindo no meato inferior explica por que se chora pelo nariz — e é a via da dacriocistorrinostomia.',
    memoria:
      'A concha grandalhona de baixo é o "aquecedor" do nariz. Debaixo dela pinga a lágrima: meato inferior = ducto nasolacrimal.',
    pontos: [
      'O que drena para o meato inferior?',
      'Por que a concha inferior é a principal responsável pelo condicionamento do ar?',
      'O que é o ciclo nasal?',
    ],
  },
  {
    termos: ['Processo Estilo-hioideo'],
    classe: 'acidente-osseo',
    resumo: 'Espícula óssea fina que desce do temporal e dá origem ao aparelho estilo-hióideo.',
    localizacao: 'Face inferior da parte petrosa do temporal, entre o forame estilomastóideo (atrás) e a fossa mandibular (à frente), dirigindo-se para baixo, para a frente e medialmente.',
    funcao:
      'Ancora três músculos — estiloglosso, estilo-hióideo e estilofaríngeo — e dois ligamentos, o estilo-hióideo e o estilomandibular. É o "ramo de árvore" de onde pendem língua, hioide e faringe.',
    relacoes:
      'É o divisor entre a carótida interna e a jugular (por dentro) e a parótida e a carótida externa (por fora). Entre os três músculos passam o glossofaríngeo e o facial.',
    clinica:
      'Quando alongado ou ossificado, produz a síndrome de Eagle: dor cervicofacial ao virar a cabeça e ao deglutir, sensação de corpo estranho na garganta, às vezes compressão carotídea com síncope. Diagnóstico por palpação da fossa tonsilar e tomografia.',
    memoria:
      'Um estilete apontando para baixo, com três músculos que começam por "estilo-". Se cresce demais, espeta a garganta: síndrome de Eagle.',
    pontos: [
      'Quais três músculos nascem do processo estiloide?',
      'Que estruturas vasculares ele separa?',
      'O que é a síndrome de Eagle?',
    ],
  },
  {
    termos: ['Fossa Temporal'],
    classe: 'acidente-osseo',
    resumo: 'Depressão rasa da face lateral do crânio, acima do arco zigomático, ocupada pelo músculo temporal.',
    localizacao:
      'Limitada acima pelas linhas temporais, abaixo pelo arco zigomático e pela crista infratemporal, à frente pelo osso zigomático. Seu assoalho é formado por frontal, parietal, temporal e esfenoide — que se encontram no ptério.',
    funcao: 'Aloja o músculo temporal, o corpo adiposo temporal e os vasos temporais profundos, e conduz o tendão do temporal para baixo do zigomático, até o processo coronoide da mandíbula.',
    relacoes: 'Comunica-se, abaixo do arco zigomático, com a fossa infratemporal — a continuidade que faz a infecção descer.',
    clinica:
      'A craniotomia pterional, a via de acesso mais usada da neurocirurgia, começa exatamente aqui; a fossa também é a região do hematoma extradural pela meníngea média. A atrofia do corpo adiposo temporal, com afundamento da região, é sinal precoce de desnutrição grave e de caquexia.',
    memoria:
      'A "têmpora": osso fino, músculo grande e uma artéria perigosa por dentro. É a região onde mais se abre e mais se sangra o crânio.',
    pontos: [
      'Que ossos se encontram no assoalho da fossa temporal?',
      'Que músculo a ocupa e onde ele se insere?',
      'Por que essa região é crítica no trauma craniano?',
    ],
  },
  {
    termos: ['Fossa Infratemporal'],
    classe: 'acidente-osseo',
    resumo: 'Espaço profundo abaixo do arco zigomático e atrás da maxila, cheio de músculos, vasos e nervos da mastigação.',
    localizacao:
      'Delimitada lateralmente pelo ramo da mandíbula, medialmente pela lâmina lateral do pterigoide, à frente pela maxila e acima pela asa maior do esfenoide.',
    funcao:
      'Contém os músculos pterigóideos, a artéria maxilar e seus ramos, o plexo venoso pterigóideo, o nervo mandibular (V3) com seus ramos e o gânglio ótico. É a sala de máquinas da mastigação.',
    relacoes:
      'Comunica-se com a fossa temporal acima, com a órbita pela fissura orbital inferior, com a fossa pterigopalatina pela fissura pterigomaxilar e com a cavidade craniana pelos forames oval e espinhoso.',
    clinica:
      'Essa rede de comunicações é a razão de tumores e infecções dali serem tão traiçoeiros: sobem para o crânio pelo oval, entram na órbita, invadem o seio cavernoso. O plexo pterigóideo comunica-se com o seio cavernoso por veias emissárias — via clássica de tromboflebite a partir de infecção dentária.',
    memoria:
      'É o "porão" da face: escuro, cheio de encanamento e com portas para todos os cômodos vizinhos — órbita, crânio, faringe e nariz.',
    pontos: [
      'Que estruturas ocupam a fossa infratemporal?',
      'Com que espaços ela se comunica e por quais aberturas?',
      'Como uma infecção dentária pode chegar ao seio cavernoso?',
    ],
  },
  {
    termos: ['Forame Esfenopalatino'],
    classe: 'passagem-ossea',
    resumo: 'Porta entre a fossa pterigopalatina e a cavidade nasal, atravessada pela artéria esfenopalatina.',
    localizacao: 'Na parede lateral do nariz, atrás da inserção da concha média, entre o corpo do esfenoide e o osso palatino.',
    funcao: 'Transmite a artéria esfenopalatina — ramo terminal da maxilar e principal fonte de sangue do nariz — e os nervos nasais posteriores.',
    relacoes: 'Abre-se na fossa pterigopalatina, que por sua vez se comunica com a órbita, o crânio e a boca.',
    clinica:
      'É o alvo da ligadura endoscópica da artéria esfenopalatina, tratamento definitivo da epistaxe posterior grave que não cede ao tamponamento. Saber que a artéria entra ali, atrás da cauda da concha média, é o que permite parar um sangramento que já consumiu bolsas de hemácias.',
    memoria:
      'Epistaxe anterior = plexo de Kiesselbach, no septo, e cede com compressão. Epistaxe posterior = esfenopalatina, e o endereço dela é o forame esfenopalatino.',
    pontos: [
      'Que artéria atravessa o forame esfenopalatino e de quem ela é ramo?',
      'Onde ele se localiza em relação à concha média?',
      'Qual seu papel no tratamento da epistaxe posterior?',
    ],
  },
  /* ─────────────────── Crânio do recém-nascido ─────────────────── */
  {
    termos: ['Crânio de Recém-Nascido'],
    classe: 'osso',
    resumo: 'Crânio ainda incompleto, com ossos separados por suturas membranosas e fontículos abertos.',
    localizacao:
      'Neurocrânio proporcionalmente enorme (a face é cerca de 1/8 do crânio, contra 1/2 no adulto), ossos planos ainda sem díploe, sem processo mastoide e sem seios paranasais desenvolvidos.',
    funcao:
      'A separação entre os ossos serve a duas coisas ao mesmo tempo: permite o cavalgamento das peças na passagem pelo canal de parto (moldagem) e deixa o crânio crescer junto com o encéfalo, que triplica de volume no primeiro ano.',
    vascularizacao:
      'Rede periosteal densa alimentada pelas artérias do couro cabeludo, ainda sem os sulcos meníngeos profundos do adulto. Os seios venosos durais e as fontanelas permitem que o crânio se molde no parto — e o cavalgamento das suturas é normal nas primeiras horas de vida, não sinal de fratura.',
    relacoes: 'Os fontículos anterior e posterior, na linha média, são as janelas mais úteis; o anterior fecha entre 18 e 24 meses, o posterior por volta dos 2 a 3 meses.',
    clinica:
      'O fontículo anterior é um manômetro clínico gratuito: abaulado e tenso na hipertensão intracraniana e na meningite, deprimido na desidratação. Fechamento precoce de suturas é craniossinostose e deforma o crânio de modo previsível pela regra de Virchow — o crânio cresce paralelamente à sutura fundida e perpendicular às abertas. E a ausência de mastoide explica por que o nervo facial é superficial e vulnerável no neonato.',
    memoria:
      'Cabeça grande, cara pequena, ossos soltos. Os fontículos não são falhas — são a folga que o cérebro precisa para crescer.',
    pontos: [
      'Quando fecham o fontículo anterior e o posterior?',
      'O que o fontículo anterior informa no exame físico?',
      'O que é craniossinostose e como ela deforma o crânio?',
    ],
  },
  {
    termos: ['Sutura Frontal'],
    classe: 'sutura',
    resumo: 'Sutura mediana que separa as duas metades do frontal na criança e normalmente desaparece.',
    localizacao: 'Na linha média da testa, do bregma à raiz do nariz (nasio), dividindo o osso frontal em duas peças.',
    funcao: 'Permite o crescimento transversal da fronte nos primeiros anos. Fecha-se em geral entre o segundo e o oitavo ano; quando persiste no adulto, chama-se sutura metópica e é variação anatômica normal.',
    relacoes: 'Encontra a sutura coronal e a sagital no bregma.',
    clinica:
      'Seu fechamento precoce produz trigonocefalia: a testa fica em quilha, triangular vista de cima, com hipotelorismo. No adulto, a sutura metópica persistente pode ser confundida com fratura linear na radiografia — a diferença está nas bordas escleróticas e serrilhadas.',
    memoria: 'A sutura que separa a testa em duas e depois some. Se sumir cedo demais, a testa fica em quilha de barco.',
    pontos: [
      'Quando a sutura frontal normalmente se fecha?',
      'Que deformidade seu fechamento precoce causa?',
      'Como diferenciar sutura metópica de fratura?',
    ],
  },
  {
    termos: ['Sutura Lambidoidea'],
    classe: 'sutura',
    resumo: 'Sutura entre o occipital e os dois parietais, em forma da letra grega lambda.',
    localizacao: 'Na parte posterior do crânio, unindo a escama do occipital às bordas posteriores dos parietais; encontra a sutura sagital no lambda.',
    funcao: 'Permite o crescimento anteroposterior da abóbada. Frequentemente contém ossículos suturais (ossos wormianos), pequenas peças ósseas independentes.',
    relacoes: 'O lambda é o ponto onde ela encontra a sutura sagital, sob o fontículo posterior no recém-nascido.',
    clinica:
      'Sua sinostose isolada é rara e produz plagiocefalia posterior verdadeira, que precisa ser distinguida da plagiocefalia posicional — muito mais comum desde a recomendação de dormir em decúbito dorsal. Ossos wormianos numerosos apontam para osteogênese imperfeita, cleidocraniodisplasia e hipotireoidismo congênito.',
    memoria:
      'Λ é a letra lambda: dois traços descendo do vértice, exatamente o desenho da sutura na nuca.',
    pontos: [
      'Que ossos a sutura lambdóidea une?',
      'O que são ossos wormianos e o que eles podem indicar?',
      'Como diferenciar plagiocefalia posicional de sinostótica?',
    ],
  },
  {
    termos: ['Fontículo Anterolateral (Astérica)'],
    classe: 'fonticulo',
    resumo: 'Fontículos laterais, pequenos e pares, que correspondem no adulto ao ptério e ao astério.',
    localizacao:
      'O anterolateral (esfenoidal) fica na junção de frontal, parietal, esfenoide e temporal — futuro ptério; o posterolateral (mastóideo) fica na junção de parietal, occipital e temporal — futuro astério.',
    funcao: 'Completam a flexibilidade da calota durante o parto e permitem o crescimento das paredes laterais do crânio nos primeiros meses.',
    relacoes: 'Sob o esfenoidal passa o ramo frontal da artéria meníngea média; sob o mastóideo, o seio sigmoide.',
    clinica:
      'A relação com esses vasos é o que dá importância clínica ao ponto: o ptério permanece, a vida inteira, a região mais fina da calota e o sítio clássico do hematoma extradural. Os fontículos laterais fecham cedo — o esfenoidal por volta dos 6 meses e o mastóideo entre 6 e 18 meses.',
    memoria:
      'Os dois pequenos das laterais viram os dois pontos perigosos do adulto: ptério (artéria meníngea média) e astério (seio sigmoide).',
    pontos: [
      'Que ossos se encontram em cada fontículo lateral?',
      'Que vaso corre sob o ptério?',
      'Quando esses fontículos se fecham?',
    ],
  },
  {
    termos: [
      'Fontículo Posterolateral (Ptérica)',
    ],
    classe: 'fonticulo',
    resumo:
      'Fontanela mastóidea, no encontro do parietal, do occipital e do temporal — a que fecha por último entre as laterais.',
    localizacao:
      'De cada lado, na junção das suturas lambdóidea, occipitomastóidea e parietomastóidea, atrás da orelha. Corresponde, no adulto, ao ponto craniométrico ástrio.',
    funcao:
      'Permite o cavalgamento dos ossos no parto e acomoda o crescimento encefálico. Fecha entre o sexto e o décimo oitavo mês — bem depois da fontanela anterolateral, que fecha por volta do sexto mês.',
    vascularizacao:
      'Ramos da artéria occipital e da auricular posterior. Sob ela passa a veia emissária mastóidea, que liga o seio sigmóideo às veias extracranianas.',
    inervacao: 'Ramos do nervo occipital menor (C2) e do auricular magno na pele suprajacente.',
    linfaticos: 'Linfonodos mastóideos (retroauriculares).',
    relacoes:
      'No adulto, sob esse ponto correm o seio sigmóideo e as células mastóideas — vizinhança que muda o risco de qualquer abordagem cirúrgica na região.',
    clinica:
      'A nomenclatura do acervo troca os nomes tradicionais, e vale fixar o que importa de fato: a fontanela ASTÉRICA (posterolateral, mastóidea) recobre o seio sigmóideo, e é por isso que a mastoidite do lactente pode evoluir para trombose de seio sigmóideo. Já o PTÉRIO, no lado oposto, à frente da orelha, é onde a artéria meníngea média corre sob osso fino — o ponto do hematoma epidural. Duas regiões, dois vasos, duas emergências diferentes.',
    memoria:
      'Atrás da orelha corre veia (seio sigmóideo); à frente da orelha corre artéria (meníngea média). Uma tromboso, a outra sangra.',
    pontos: [
      'Quando fecha a fontanela posterolateral?',
      'Que seio venoso corre sob ela?',
      'Qual a diferença de risco entre a região astérica e o ptério?',
    ],
  },
]
