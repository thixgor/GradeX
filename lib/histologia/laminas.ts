/**
 * "O que esta lâmina mostra" — em português e aprofundado.
 *
 * ## Por que por título, e não por página
 *
 * As 1.522 páginas compartilham 746 títulos: "Epitélio simples colunar" nomeia
 * várias lâminas do mesmo assunto, vistas em aumentos e órgãos diferentes.
 * Escrever por página repetiria o mesmo texto e o deixaria dessincronizado em
 * cada cópia; escrever por *título* faz o aprofundamento aparecer em todas as
 * lâminas daquele assunto, mantido num lugar só. É a mesma alavanca usada em
 * `dossies.ts` para estruturas e em `resumos.ts` para setores.
 *
 * A chave é o título **original** em minúsculas — a mesma de `titulos.ts` —,
 * então tradução e aprofundamento ficam alinhados por construção.
 *
 * ## O que é, e o que não é
 *
 * É conteúdo próprio, de livro-texto, escrito para orientar a observação: o que
 * procurar, em que ordem, e por que aquilo importa. Substitui a descrição em
 * inglês do acervo, que continua acessível como prova de origem.
 *
 * **Não passou por revisão biomédica.** Enquanto não passar, a tarja de
 * pendência continua na página. Onde não há texto escrito, a interface mostra o
 * original do acervo com aviso — nunca uma tradução automática silenciosa.
 */

export interface DescricaoDeLamina {
  /** O que a lâmina mostra e por que ela existe no currículo. */
  panorama: string
  /** Roteiro de observação, do menor ao maior aumento. */
  roteiro?: string[]
  /** O erro que o aluno costuma cometer nesta lâmina. */
  atencao?: string
}

export const DESCRICOES: Record<string, DescricaoDeLamina> = {
  /* ═══════════ Fundamentos da célula ═══════════ */

  'cell polarity': {
    panorama:
      'Polaridade é a propriedade que permite ao epitélio fazer transporte com direção — absorver de um lado e entregar do outro. A célula epitelial mantém três domínios de membrana quimicamente distintos: o **apical**, voltado para a luz, com microvilosidades, estereocílios ou cílios; o **lateral**, onde ficam as junções que a prendem às vizinhas; e o **basal**, ancorado à lâmina basal por hemidesmossomos. O que impede que as proteínas de um domínio escorreguem para o outro é a **zônula de oclusão**, uma cinta contínua no topo da face lateral: ela sela o espaço entre células e funciona como cerca de difusão dentro da própria membrana. Sem essa cerca não há gradiente, e sem gradiente não há absorção — é por isso que a polaridade é pré-requisito da função, não consequência dela.',
    roteiro: [
      'Localize a membrana basal: ela define onde é a base e orienta toda a leitura.',
      'Compare o topo com a base da mesma célula — microvilosidades, altura do citoplasma e posição do núcleo.',
      'Procure a linha do complexo juncional logo abaixo da superfície apical.',
    ],
    atencao:
      'Perda de polaridade é um dos primeiros sinais de displasia: núcleos que sobem de nível e perdem o alinhamento basal.',
  },

  'cell shapes: squamous': {
    panorama:
      'A forma pavimentosa — achatada, com o núcleo fazendo saliência — é a solução onde a prioridade é **distância curta**. Aparece exatamente onde algo precisa atravessar a célula depressa: alvéolo (hematose), endotélio (troca capilar), folheto parietal da cápsula de Bowman (filtrado) e mesotélio (deslizamento com atrito mínimo). Em corte, o citoplasma some numa linha fina de cada lado do núcleo, e é comum reconhecer a célula apenas pelo núcleo alongado projetado para a luz.',
    atencao:
      'Num corte que passe longe do núcleo, o epitélio pavimentoso parece ausente — a fatia pega só citoplasma e some.',
  },

  'cell shapes: columnar': {
    panorama:
      'A célula colunar é mais alta que larga, e a altura é proporcional à carga de trabalho: quanto mais absorção ou secreção, mais espaço para retículo, Golgi e mitocôndrias. O núcleo fica na base, alinhado com os das vizinhas — esse alinhamento é o que distingue um epitélio simples colunar de um pseudoestratificado à primeira vista. A superfície apical costuma trazer microvilosidades (borda em escova) quando a função é absorver.',
  },

  'cell shapes: cuboidal': {
    panorama:
      'Altura e largura semelhantes, núcleo redondo e central — a forma intermediária entre a pavimentosa, que privilegia a difusão, e a colunar, que privilegia o volume de trabalho. É o formato dos epitélios de ducto e de superfícies secretoras de intensidade moderada: túbulos renais, ductos de glândulas exócrinas, superfície do ovário, folículos tireoidianos e o epitélio pigmentar da retina. A altura não é fixa nem decorativa: no folículo tireoidiano ela acompanha a atividade da glândula — baixa, quase pavimentosa, quando o folículo está distendido de coloide e em repouso; alta, quase colunar, quando o TSH estimula a reabsorção. Ou seja, a forma que você vê registra o estado funcional no momento da fixação.',
    atencao:
      'Num corte tangencial, o epitélio cúbico pode parecer estratificado — confirme localizando a lâmina basal antes de classificar.',
  },

  /* ═══════════ Epitélios ═══════════ */

  'simple squamous epithelium': {
    panorama:
      'Uma única camada de células achatadas sobre a lâmina basal. A escolha evolutiva aqui é clara: onde o que importa é atravessar, a barreira tem de ser a mais fina possível. Reveste alvéolos (onde forma a barreira hematoaérea junto ao endotélio), vasos (endotélio), cavidades serosas (mesotélio) e o folheto parietal da cápsula de Bowman. Não protege contra atrito — por isso nunca aparece onde há abrasão.',
    roteiro: [
      'Siga a linha de núcleos: eles são o único sinal confiável da presença do epitélio.',
      'Confirme que é uma camada só, procurando a lâmina basal logo abaixo.',
    ],
  },

  'simple columnar epithelium': {
    panorama:
      'Camada única de células altas, com núcleos basais alinhados na mesma altura — e é esse alinhamento, não a altura, que o separa do pseudoestratificado à primeira vista. É o epitélio do tubo digestório do estômago ao reto, e sua altura acompanha a demanda funcional: mais baixa no estômago, onde a tarefa é secretar e proteger; máxima no intestino delgado, onde a absorção domina. Convivem nele três populações que vale distinguir: os **enterócitos**, com borda em escova de microvilosidades; as **células caliciformes**, que lubrificam a superfície e aumentam em número do duodeno ao cólon; e as **enteroendócrinas**, dispersas e discretas, que em H&E passam despercebidas e só se revelam com imuno-histoquímica.',
    atencao:
      'Se os núcleos estiverem em alturas diferentes, provavelmente é pseudoestratificado — acompanhe o citoplasma até a base antes de decidir.',
  },

  'pseudostratified columnar epithelium': {
    panorama:
      'Parece estratificado e não é: **todas as células tocam a lâmina basal**, mas só algumas alcançam a superfície, e por isso os núcleos ficam em alturas diferentes. É o epitélio das vias aéreas condutoras, onde as células ciliadas movem o tapete de muco produzido pelas caliciformes, e as células basais funcionam como reserva regenerativa. Aparece também no epidídimo e no ducto deferente, ali com estereocílios em vez de cílios.',
    roteiro: [
      'Confirme que é uma camada só: siga o citoplasma de uma célula alta até a base.',
      'Procure cílios na superfície e caliciformes intercaladas.',
      'Note os núcleos das células basais, mais próximos da lâmina basal.',
    ],
  },

  'transitional epithelium': {
    panorama:
      'O urotélio resolve um problema mecânico específico: revestir um órgão que muda de volume sem romper a barreira contra a urina, que é hipertônica e ácida. As células superficiais são grandes, em cúpula, muitas vezes binucleadas, e sua membrana apical tem placas rígidas de uroplaquina que se dobram para dentro quando a bexiga esvazia. Por isso a mesma parede parece ter seis camadas vazia e três distendida — é a mesma estrutura, acomodada.',
    atencao:
      'Contar camadas para classificar urotélio leva a erro: o número depende do estado de repleção no momento da fixação.',
  },

  'stratified squamous, keratinized (dry) epithelium': {
    panorama:
      'A epiderme e as mucosas mastigatórias trocam capacidade de troca por resistência. Da base para a superfície: **estrato basal** (mitoses, ancoragem), **espinhoso** (desmossomos abundantes e tonofilamentos, responsáveis pelas "espinhas" do artefato de retração), **granuloso** (grânulos de querato-hialina e corpos lamelares que impermeabilizam) e **córneo** (células mortas, anucleadas, cheias de queratina). Cada célula leva cerca de quatro semanas para percorrer esse caminho.',
    roteiro: [
      'Identifique o estrato granuloso: é ele que marca o ponto onde a célula morre.',
      'Compare a espessura do córneo com a do restante — é o que separa pele fina de espessa.',
    ],
  },

  'stratified squamous, nonkeratinized (moist) epithelium': {
    panorama:
      'Mesmo desenho do queratinizado, sem o desfecho: as células superficiais mantêm o núcleo, conservam organelas e permanecem hidratadas em vez de morrer e virar escama. É o epitélio do esôfago, da mucosa oral de revestimento, da vagina, da ectocérvice e da córnea — todas superfícies que sofrem abrasão mas precisam continuar úmidas e, na córnea, transparentes. A proteção vem da espessura e da renovação rápida, não da queratina: como não há estrato granuloso desenvolvido nem barreira lipídica de corpos lamelares, essas superfícies dependem de secreção externa (saliva, muco, lágrima) para não ressecar. É por isso que a mesma cavidade oral tem epitélio queratinizado onde há atrito mastigatório — gengiva e palato duro — e não queratinizado onde há só deslizamento.',
    atencao:
      'A presença de núcleos nas células mais superficiais é o critério: se há núcleo lá em cima, não é queratinizado.',
  },

  /* ═══════════ Conjuntivo ═══════════ */

  'loose connective tissue': {
    panorama:
      'Muitas células, pouca fibra, muita substância fundamental — é o tecido onde a inflamação acontece. Preenche o espaço entre estruturas, dá passagem a vasos e nervos e hospeda a população imune residente: fibroblastos, macrófagos, mastócitos perivasculares, plasmócitos e eosinófilos. É o que forma a lâmina própria das mucosas e a camada papilar da derme, justamente onde o corpo precisa reagir rápido a uma agressão externa.',
    roteiro: [
      'Compare a densidade de núcleos com a de fibras — no frouxo, célula ganha.',
      'Procure o mastócito perto de um vaso; ele quase sempre está lá.',
    ],
  },

  'dense regular connective tissue': {
    panorama:
      'Feixes de colágeno paralelos, alinhados na direção da força — tendão e ligamento. A regularidade não é estética: colágeno resiste à tração no seu eixo, então alinhá-lo com a carga é o que dá resistência. Entre os feixes sobram fileiras de fibrócitos comprimidos, com núcleos achatados e citoplasma quase invisível. Pouca célula e pouco vaso explicam por que tendão cicatriza devagar.',
  },

  'dense irregular connective tissue': {
    panorama:
      'Mesmos feixes espessos de colágeno do denso modelado, mas entrelaçados em todas as direções. A desorganização aparente **é** o projeto: resistência multidirecional exige justamente que nenhuma direção predomine, porque um feixe alinhado só resiste bem no seu próprio eixo. Aparece onde a tração chega de vários lados ao mesmo tempo — derme reticular, cápsulas de órgãos parenquimatosos, submucosa do tubo digestório, dura-máter, periósteo e bainhas de tendão. As células são poucas e discretas: fibrócitos comprimidos entre os feixes, com núcleos achatados que se confundem com as fibras num aumento pequeno. Comparar este tecido com o denso modelado do tendão, lado a lado, é o exercício que fixa a relação entre arranjo das fibras e direção da carga.',
  },

  /* ═══════════ Osso e cartilagem ═══════════ */

  'hyaline cartilage': {
    panorama:
      'Matriz homogênea e basófila, com condrócitos alojados em lacunas e frequentemente reunidos em **grupos isógenos** — clones de uma mesma célula-mãe, que são a prova visível do crescimento intersticial. A basofilia vem dos glicosaminoglicanos sulfatados, e é mais intensa na matriz territorial, logo em volta da lacuna, do que na interterritorial. O traço que explica quase tudo sobre esta cartilagem é ser **avascular**: nutre-se por difusão a partir do pericôndrio, o que limita sua espessura possível, torna seu metabolismo lento e explica por que praticamente não se repara. Forma a superfície articular (onde, sem pericôndrio, o problema do reparo é ainda maior), o molde do osso endocondral, os anéis traqueais e as cartilagens costais.',
    roteiro: [
      'Procure grupos isógenos: dois a quatro condrócitos dentro de uma mesma cápsula.',
      'Compare a matriz territorial (mais escura, ao redor da lacuna) com a interterritorial.',
      'Localize o pericôndrio e suas duas camadas, fibrosa e condrogênica.',
    ],
    atencao:
      'O espaço claro em volta do condrócito costuma ser artefato de retração, não a lacuna real.',
  },

  'bone: the organ - compact bone': {
    panorama:
      'O osso compacto organiza-se em **ósteons**: cilindros de lamelas concêntricas em torno de um canal de Havers que carrega vaso e nervo. Entre ósteons sobram **lamelas intersticiais**, restos de ósteons antigos reabsorvidos — o registro fóssil da remodelação. **Canais de Volkmann** cruzam transversalmente ligando os canais de Havers. Os osteócitos ficam em lacunas conectadas por canalículos, e é por essa rede que a célula, emparedada em matriz mineralizada, ainda se comunica e percebe deformação.',
    roteiro: [
      'Conte as lamelas de um ósteon e ache o canal de Havers no centro.',
      'Procure lamelas intersticiais entre ósteons vizinhos — elas contam a história da remodelação.',
      'Siga os canalículos saindo de uma lacuna.',
    ],
  },

  /* ═══════════ Músculo ═══════════ */

  'skeletal muscle': {
    panorama:
      'Fibras cilíndricas longas, multinucleadas, com **núcleos periféricos** sob o sarcolema e estriações transversais visíveis. A estriação vem do alinhamento dos sarcômeros: banda I (só actina), banda A (miosina, com sobreposição nas bordas), banda H e linha M no centro, tudo delimitado por linhas Z. O acoplamento entre excitação e contração passa pelas **tríades** — um túbulo T flanqueado por duas cisternas do retículo sarcoplasmático, na junção A-I.',
    roteiro: [
      'Confirme os núcleos periféricos: é o critério mais rápido para separar de cardíaco.',
      'Num corte longitudinal, identifique bandas A e I pela alternância clara-escura.',
      'Num corte transversal, note os fascículos e o endomísio entre fibras.',
    ],
  },

  'cardiac muscle': {
    panorama:
      'Fibras ramificadas, estriadas, com **um a dois núcleos centrais** e **discos intercalares** — as linhas escuras transversais que só existem aqui. O disco intercalar não é uma estrutura só: reúne fáscias aderentes, que ancoram os miofilamentos de uma célula na seguinte; desmossomos, que resistem à tração; e **junções comunicantes**, que acoplam as células eletricamente e fazem o miocárdio se comportar como sincício funcional. As díades ficam na linha Z, e não na junção A-I como no esquelético.',
    roteiro: [
      'Ache o disco intercalar: ele é o achado que fecha o diagnóstico.',
      'Confirme o núcleo central e único, e procure um ponto de ramificação da fibra.',
    ],
  },

  'smooth muscle': {
    panorama:
      'Células fusiformes, mononucleadas, sem estriação — porque actina e miosina não estão em registro sarcomérico, e sim ancoradas em **corpos densos** dispersos pelo citoplasma e na membrana. A contração é lenta, sustentada e barata em ATP, regulada por calmodulina e pela quinase da cadeia leve da miosina. Em corte transversal, o mesmo feixe mostra perfis de diâmetros muito diferentes: só a fatia que passa pelo meio da célula contém núcleo.',
    atencao:
      'A ausência de núcleo em muitos perfis de um corte transversal é geometria, não patologia.',
  },

  /* ═══════════ Sistemas ═══════════ */

  'renal corpuscle': {
    panorama:
      'O corpúsculo renal é o filtro. O tufo de capilares glomerulares, com endotélio fenestrado, é envolvido pelos **podócitos**, cujos processos primários se dividem em **pedicelos** que se interdigitam sobre a membrana basal glomerular. Entre pedicelos vizinhos ficam as fendas de filtração, fechadas por um diafragma de nefrina. As três camadas juntas — endotélio fenestrado, membrana basal e diafragma de fenda — retêm células, proteínas grandes e, pela carga negativa do heparam sulfato, também a albumina.',
    roteiro: [
      'Distinga o polo vascular (onde entram e saem as arteríolas) do polo urinário.',
      'Procure a mácula densa encostada na arteríola aferente.',
      'Compare o folheto parietal, pavimentoso, com o visceral, de podócitos.',
    ],
  },

  'liver': {
    panorama:
      'O lóbulo hepático clássico é um hexágono com a veia centrolobular no meio e **espaços porta** nos vértices, cada um trazendo ramo da artéria hepática, ramo da veia porta e ducto biliar — a tríade. Os cordões de hepatócitos irradiam do centro para a periferia, separados por **sinusoides** de endotélio descontínuo. Sangue e bile correm em sentidos opostos: o sangue vai da periferia para a veia central; a bile, dos canalículos entre hepatócitos para os ductos do espaço porta.',
    roteiro: [
      'Ache um espaço porta e nomeie os três componentes da tríade.',
      'Siga um cordão de hepatócitos do espaço porta até a veia centrolobular.',
      'Procure as células de Kupffer dentro da luz do sinusoide.',
    ],
    atencao:
      'A zona 3, ao redor da veia central, é a mais distante do oxigênio — por isso é a primeira a sofrer na isquemia e na toxicidade por paracetamol.',
  },

  'alveolus': {
    panorama:
      'O alvéolo é onde toda a arquitetura respiratória converge. A parede é finíssima: **pneumócitos tipo I** cobrem 95% da superfície e formam a barreira; **tipo II**, cúbicos e salientes nos ângulos, produzem surfactante em corpos lamelares e repovoam o epitélio depois de lesão. O septo interalveolar aloja capilares tão colados ao epitélio que as lâminas basais se fundem — a barreira hematoaérea inteira tem cerca de 0,2 µm. Macrófagos alveolares circulam livres na luz.',
    roteiro: [
      'Encontre um pneumócito tipo II: cúbico, no ângulo entre dois alvéolos.',
      'Siga um septo e localize o capilar dentro dele.',
    ],
  },

  'lymph node': {
    panorama:
      'O linfonodo filtra linfa e organiza a resposta adaptativa em territórios separados. A linfa entra por vasos aferentes no **seio subcapsular**, percorre seios corticais e medulares e sai pelo hilo. O **córtex** abriga nódulos de linfócitos B, com **centros germinativos** onde ocorrem proliferação, hipermutação somática e seleção por afinidade. O **paracórtex** é território T e contém vênulas de endotélio alto, por onde os linfócitos do sangue entram no nó. A **medula** tem cordões ricos em plasmócitos e seios que confluem para o vaso eferente.',
    roteiro: [
      'Separe córtex, paracórtex e medula antes de olhar o detalhe.',
      'Num centro germinativo, procure os macrófagos de corpos tingíveis — sinal de seleção ativa.',
    ],
  },

  'spleen': {
    panorama:
      'O baço faz duas coisas ao mesmo tempo, e sua histologia separa as duas. A **polpa branca** é imune: bainha linfoide periarteriolar de células T em torno da arteríola central, nódulos B e zona marginal. A **polpa vermelha** é hemocaterética: cordões esplênicos e sinusoides revestidos por células alongadas com fendas entre elas — a hemácia precisa se deformar para passar, e a que não consegue é retirada pelos macrófagos. É um teste mecânico de flexibilidade celular, feito milhões de vezes por segundo.',
  },

  'epidermis': {
    panorama:
      'A epiderme é um epitélio estratificado pavimentoso queratinizado em renovação permanente: uma célula nasce por mitose no estrato basal e leva cerca de quatro semanas até descamar na superfície. O trajeto é uma diferenciação programada — no **espinhoso** acumula tonofilamentos e desmossomos; no **granuloso**, grânulos de querato-hialina e corpos lamelares que despejam lipídios no espaço intercelular e criam a barreira contra a perda de água; no **córneo**, perde núcleo e organelas e vira uma placa de queratina. Convivem ali quatro linhagens de origens completamente diferentes: queratinócitos (ectoderma de superfície), melanócitos (crista neural), células de Langerhans (medula óssea, apresentadoras de antígeno) e células de Merkel (mecanorreceptoras). Reconhecer que três delas são imigrantes ajuda a entender por que cada uma tem doença própria.',
    roteiro: [
      'Conte os estratos e verifique se há lúcido — sua presença indica pele espessa.',
      'Procure células claras na basal: melanócitos, com halo perinuclear em H&E.',
    ],
  },

  'trachea': {
    panorama:
      'A traqueia reúne, num corte só, quase tudo o que caracteriza a porção condutora das vias aéreas: **epitélio respiratório** pseudoestratificado colunar ciliado com células caliciformes, lâmina própria rica em fibras elásticas, submucosa com glândulas seromucosas cujos ductos atravessam a mucosa, e anéis de **cartilagem hialina em C**, abertos posteriormente e fechados pelo músculo traqueal liso. Cada elemento tem função clara: os cílios e o muco formam o tapete mucociliar que varre partículas em direção à faringe; a cartilagem mantém a luz aberta contra a pressão negativa da inspiração; e a abertura posterior do anel não é acaso — é ela que permite ao esôfago, logo atrás, se expandir durante a deglutição. Compare este corte com um de bronquíolo: o que sumiu ali (cartilagem e glândulas) é exatamente o que define a transição.',
    roteiro: [
      'Identifique o epitélio e confirme os cílios na superfície.',
      'Localize as glândulas na submucosa — elas somem no bronquíolo, e é isso que o define.',
    ],
  },

  /* ═══════════ Célula e organelas ═══════════ */

  'mitochondria': {
    panorama:
      'A mitocôndria não é visível ao microscópio óptico, mas seu efeito é: onde elas se acumulam, o citoplasma fica intensamente **acidófilo**, porque as proteínas da matriz e das cristas se ligam à eosina. É isso que se está lendo ao chamar de "eosinofílico" o citoplasma do túbulo contorcido proximal, da célula parietal gástrica ou da fibra cardíaca. A localização também informa: nas **estriações basais** do ducto estriado das glândulas salivares e do túbulo renal, as mitocôndrias ficam alinhadas em fileiras verticais entre invaginações da membrana basal — arranjo que aproxima a fonte de ATP das bombas de sódio que gastam esse ATP. Ao microscópio eletrônico aparecem as duas membranas, a externa lisa e a interna pregueada em **cristas**, cuja densidade acompanha a demanda energética do tecido.',
    roteiro: [
      'Procure regiões de acidofilia intensa e pergunte que trabalho aquela célula faz.',
      'Nas glândulas salivares, localize as estriações basais do ducto estriado.',
    ],
    atencao:
      'Acidofilia citoplasmática é mitocôndria; basofilia citoplasmática é retículo rugoso. Trocar os dois inverte o diagnóstico funcional da célula.',
  },

  'rough endoplasmic reticulum': {
    panorama:
      'O retículo rugoso é o compartimento onde nasce toda proteína destinada à secreção, à membrana ou às organelas. Ao microscópio óptico ele se traduz em **basofilia citoplasmática** — e a hematoxilina aqui não está corando DNA, e sim o RNA ribossômico dos ribossomos aderidos. Essa distinção é o que permite ler a lâmina funcionalmente: a substância de Nissl do neurônio, o citoplasma azulado do plasmócito e a região basal da célula acinosa pancreática são todos a mesma coisa vista em tecidos diferentes. Ao microscópio eletrônico, as cisternas achatadas e paralelas com ribossomos na face citosólica, contínuas com a membrana externa do envoltório nuclear.',
    roteiro: [
      'Localize a região basófila e confirme que ela é citoplasmática, não nuclear.',
      'Compare com o polo apical da mesma célula, onde predominam grânulos de secreção.',
    ],
  },

  'golgi apparatus': {
    panorama:
      'O complexo de Golgi recebe do retículo rugoso, modifica, endereça e empacota. Em H&E ele aparece por ausência: uma área clara justanuclear que não se cora, a **imagem negativa do Golgi**, muito evidente no plasmócito como halo perinuclear. Para vê-lo diretamente é preciso impregnação argêntica ou microscopia eletrônica, que revela a pilha de cisternas com polaridade funcional — a face **cis**, voltada ao retículo, recebe as vesículas de transporte; a face **trans** e a rede trans-Golgi despacham vesículas de secreção, lisossomos e proteínas de membrana para seus destinos. A posição do Golgi na célula denuncia a direção da secreção: entre o núcleo e o polo apical nas células que secretam para uma luz.',
    atencao:
      'A área clara justanuclear costuma ser confundida com artefato ou vacúolo; procure sua posição constante em relação ao núcleo e à superfície secretora.',
  },

  'secretory granules': {
    panorama:
      'Grânulos de secreção são o produto acabado esperando o sinal para sair. Concentram-se no **polo apical** das células exócrinas, entre o Golgi e a superfície luminal, e sua afinidade tintorial revela o conteúdo: acidófilos quando proteicos, como os grânulos de zimogênio do ácino pancreático e da célula principal gástrica; pálidos ou vazios em H&E quando mucosos, porque a mucina se perde no processamento e só aparece em PAS. O gradiente dentro da mesma célula — basofilia basal do retículo, Golgi claro no meio, grânulos acidófilos no ápice — é a via secretora inteira desenhada num único corte, e vale a pena percorrê-la com o olho na ordem certa.',
    roteiro: [
      'Percorra uma célula acinosa da base ao ápice e nomeie os três compartimentos.',
      'Compare um ácino seroso com um mucoso no mesmo campo.',
    ],
  },

  'glycogen': {
    panorama:
      'Glicogênio é a reserva rápida de glicose, e em H&E ele **não aparece**: os solventes do processamento o dissolvem e deixam vacúolos claros ou apenas um citoplasma de aspecto lavado. Isso é rotineiro no hepatócito e na fibra muscular estriada, e explica por que o fígado "parece vazio" em algumas áreas. Para demonstrá-lo é preciso **PAS**, que o cora em magenta intenso, com a confirmação clássica pela digestão prévia com diastase: se a coloração some depois da enzima, era glicogênio; se permanece, era outro carboidrato. Ao microscópio eletrônico surge como partículas elétron-densas, isoladas (partículas beta) ou em rosetas (partículas alfa), livres no citosol e sem membrana.',
    atencao:
      'Vacúolo claro no hepatócito pode ser glicogênio dissolvido ou lipídio dissolvido — só a técnica separa os dois, e o significado clínico é oposto.',
  },

  'lipid droplets': {
    panorama:
      'As gotículas lipídicas também desaparecem no processamento de rotina: o xilol dissolve o triglicerídeo e sobra um vacúolo de contorno nítido. No adipócito unilocular esse vacúolo único empurra o núcleo para a periferia e produz o aspecto de **anel de sinete**; no multilocular do tecido adiposo pardo, várias gotículas menores mantêm o núcleo central. Para ver a gordura de fato é preciso abandonar a parafina e usar **corte por congelação** com Sudan III ou óleo vermelho O. A gotícula não tem membrana verdadeira, apenas uma monocamada de fosfolipídios com perilipinas — por isso coalesce com facilidade quando o acúmulo aumenta, como na esteatose hepática.',
    roteiro: [
      'Distinga adipócito unilocular de multilocular pela posição do núcleo.',
      'Note que o vacúolo tem contorno liso e regular, diferente de um espaço de retração.',
    ],
  },

  'chromatin': {
    panorama:
      'A cromatina é o DNA associado a histonas, e seu grau de condensação é um relatório direto da atividade transcricional da célula. A **eucromatina**, frouxa e pálida, é a fração em transcrição; a **heterocromatina**, condensada e intensamente basófila, está silenciada e tende a se acumular contra o envoltório nuclear e ao redor do nucléolo. Um núcleo claro, volumoso e nucleolado indica célula ativa — neurônio, hepatócito, plasmócito; um núcleo pequeno e denso indica repouso ou morte — linfócito pequeno, fibrócito, célula picnótica. O padrão também identifica: a cromatina em **roda de carroça** do plasmócito e o **corpúsculo de Barr**, o X inativo encostado no envoltório em células de indivíduos com dois cromossomos X.',
    roteiro: [
      'Compare o núcleo de um linfócito pequeno com o de um plasmócito no mesmo campo.',
      'Procure heterocromatina marginal no envoltório de um núcleo qualquer.',
    ],
  },

  'nucleus': {
    panorama:
      'O núcleo é a estrutura mais basófila da célula e o ponto de partida de qualquer leitura histológica: seu tamanho, forma, textura de cromatina e nucléolo dizem o que a célula está fazendo. O **envoltório** tem duas membranas com poros e é contínuo com o retículo rugoso, o que explica por que a basofilia perinuclear é frequente. A relação entre volume nuclear e citoplasmático — a relação núcleo/citoplasma — é baixa em células diferenciadas e alta em células jovens ou neoplásicas, e é um dos primeiros parâmetros que o patologista avalia. Núcleos múltiplos aparecem por fusão (osteoclasto, célula gigante, fibra esquelética) ou por divisão nuclear sem citocinese (hepatócito, cardiomiócito).',
    atencao:
      'Um "núcleo" solto no meio do citoplasma quase sempre é corte tangencial de célula vizinha, não binucleação.',
  },

  'cilia': {
    panorama:
      'Cílios são prolongamentos móveis de cerca de 10 µm com um **axonema 9+2** — nove pares periféricos de microtúbulos e um par central — ancorado num corpúsculo basal derivado de centríolo. O batimento é coordenado e metacronal, sempre na mesma direção, e é ele que empurra o tapete de muco das vias aéreas em direção à faringe e conduz o ovócito pela tuba uterina. Em H&E aparecem como uma franja bem definida na superfície apical, e distinguem-se das microvilosidades por serem mais longos, mais espessos e por assentarem sobre a linha escura dos corpúsculos basais — que é o achado decisivo quando a dúvida aparece.',
    roteiro: [
      'Procure a linha de corpúsculos basais logo abaixo da franja apical.',
      'Compare a espessura desta franja com a borda em escova de um enterócito.',
    ],
    atencao:
      'Estereocílios do epidídimo parecem cílios mas não têm axonema nem corpúsculo basal — são microvilosidades longas e imóveis.',
  },

  'anaphase': {
    panorama:
      'A anáfase é o momento em que as cromátides-irmãs se separam e migram para polos opostos, e é a fase mais curta e mais reconhecível da mitose numa lâmina: duas massas cromossômicas distintas afastando-se, com a região equatorial já sem cromatina. A separação depende da clivagem das coesinas pela separase, liberada quando o complexo promotor da anáfase é ativado — o que só ocorre depois que **todos** os cinetocoros estão ligados ao fuso. Esse ponto de checagem é a garantia de que nenhuma célula-filha receberá cromossomo a mais ou a menos, e sua falha é uma das origens da aneuploidia tumoral.',
    roteiro: [
      'Localize as duas massas cromossômicas e o espaço vazio entre elas.',
      'Compare com uma metáfase no mesmo campo: lá a cromatina está numa placa só.',
    ],
  },

  /* ═══════════ Tecidos ═══════════ */

  'elastic and collagen fibers': {
    panorama:
      'Colágeno e elastina resolvem problemas mecânicos opostos e por isso convivem em proporções que variam com a função local. O **colágeno** resiste à tração e praticamente não estira: em H&E é acidófilo, em feixes ondulados sem ramificação, e fica azul ou verde no tricrômico. A **elastina** faz o contrário — estira até 150% do comprimento e volta —, é fina, ramificada e refringente, mal se cora em H&E e exige orceína, resorcina-fucsina ou Verhoeff. Comparar as duas na mesma lâmina é o exercício que fixa a relação entre composição e propriedade: onde a estrutura precisa voltar à forma (artéria elástica, pulmão, cartilagem elástica), a elastina domina; onde precisa não ceder (tendão, cápsula), o colágeno.',
    roteiro: [
      'Identifique cada tipo de fibra pela espessura e pela presença de ramificação.',
      'Verifique qual coloração está sendo usada antes de concluir que "não há elástica".',
    ],
  },

  'active fibroblast': {
    panorama:
      'O fibroblasto ativo é a célula que constrói e remodela a matriz, e sua morfologia denuncia o estado funcional com clareza incomum. Ativo: núcleo grande, ovalado, **claro** por predomínio de eucromatina, com nucléolo evidente, e citoplasma abundante e basófilo pela quantidade de retículo rugoso — porque colágeno é proteína de exportação e exige máquina de síntese. Inativo (fibrócito): núcleo pequeno, alongado, denso e escuro, com citoplasma tão escasso que quase não se distingue das fibras ao redor. Encontrar muitos fibroblastos ativos num tecido conjuntivo é sinal de reparo em andamento, e a transição para miofibroblasto — que acrescenta actina de músculo liso — é o que contrai a ferida.',
    roteiro: [
      'Compare o núcleo de um fibroblasto ativo com o de um fibrócito no mesmo campo.',
      'Procure basofilia citoplasmática: ela é a assinatura da síntese ativa.',
    ],
  },

  'fibrocartilage': {
    panorama:
      'A fibrocartilagem é o meio-termo entre tendão e cartilagem hialina, e aparece onde há **compressão e tração ao mesmo tempo**: disco intervertebral, sínfise púbica, menisco e as inserções de tendões no osso. Histologicamente ela se reconhece por feixes grossos de colágeno tipo I visíveis em H&E — o que não acontece na hialina, cuja matriz é homogênea — com condrócitos dispostos em **fileiras** entre os feixes, em vez de grupos isógenos arredondados. Não tem pericôndrio, o que a distingue das outras duas cartilagens e limita ainda mais sua capacidade de reparo. É sempre uma transição: some gradualmente para tecido conjuntivo denso de um lado e para cartilagem hialina do outro.',
    atencao:
      'Ver feixes de colágeno nítidos numa cartilagem exclui hialina — na hialina o colágeno II é mascarado pelos proteoglicanos.',
  },

  'elastic cartilage': {
    panorama:
      'A cartilagem elástica tem a mesma matriz da hialina com uma rede densa de **fibras elásticas** somada a ela, e essa adição muda a propriedade mecânica: em vez de rígida, torna-se flexível e capaz de retornar à forma depois de dobrada. Está exatamente onde isso é necessário — aurícula, meato acústico externo, tuba auditiva e epiglote. Em H&E as fibras elásticas mal se distinguem, e a lâmina pode ser confundida com hialina; só com orceína ou Verhoeff a rede aparece, escura e ramificada, entre os condrócitos. Diferente da hialina, praticamente não calcifica com a idade, o que é coerente com a função de manter a flexibilidade a vida inteira.',
    roteiro: [
      'Confirme qual coloração está em uso antes de classificar a cartilagem.',
      'Procure a rede elástica na matriz interterritorial, entre grupos de condrócitos.',
    ],
  },

  'bone matrix': {
    panorama:
      'A matriz óssea é 35% orgânica e 65% mineral, e essa proporção define tudo o que se pode fazer com ela na bancada. A fração orgânica — o **osteoide** — é sobretudo colágeno tipo I mais proteínas não colágenas (osteocalcina, osteopontina, sialoproteína); a mineral é hidroxiapatita depositada em registro com as fibrilas. Para cortar osso é preciso **descalcificar** (e então se perde o mineral, mas se preserva a célula) ou **desgastar** (e então se preserva a arquitetura mineral, mas as células morrem e as lacunas ficam vazias, preenchidas por detritos). Saber qual técnica foi usada é pré-requisito para interpretar a lâmina: lacuna vazia em osso desgastado é normal; em osso descalcificado, é necrose.',
    roteiro: [
      'Determine primeiro se o corte é de osso descalcificado ou desgastado.',
      'Procure a orientação alternada das lamelas sob luz polarizada, quando disponível.',
    ],
  },

  'bone remodeling': {
    panorama:
      'O osso é substituído continuamente por unidades de remodelação que avançam pelo tecido como um túnel: na frente, **osteoclastos** escavam um cone de corte; atrás, **osteoblastos** revestem a superfície escavada e depositam lamelas concêntricas de dentro para fora, até restar apenas o canal de Havers central. O limite entre o osso velho reabsorvido e o novo depositado fica registrado como **linha cementante**, e é ela que delimita cada ósteon. As lamelas intersticiais entre ósteons são restos de ósteons anteriores parcialmente reabsorvidos — o registro estratigráfico de toda a história de remodelação daquele osso. O processo responde a carga mecânica, sinalizada pelos osteócitos, e à demanda sistêmica de cálcio.',
    roteiro: [
      'Ache uma linha cementante e use-a para delimitar um ósteon inteiro.',
      'Compare a orientação das lamelas de ósteons vizinhos.',
    ],
  },

  'bone: deposition': {
    panorama:
      'Deposição é o trabalho do osteoblasto, e a lâmina mostra a sequência com clareza: uma fileira de células cúbicas e **basófilas** — pela quantidade de retículo rugoso, já que colágeno é proteína de exportação — alinhadas sobre a superfície óssea, com uma faixa clara de **osteoide** entre elas e o osso mineralizado. O osteoide é matriz recém-depositada e ainda não calcificada; a defasagem entre deposição e mineralização é de cerca de dez dias, e é justamente essa faixa que se alarga na osteomalácia e no raquitismo, quando falta substrato mineral. Osteoblastos que ficam aprisionados na matriz que produziram tornam-se **osteócitos**; os que permanecem na superfície e cessam a atividade viram células de revestimento.',
    roteiro: [
      'Meça mentalmente a espessura da faixa de osteoide entre osteoblastos e osso mineralizado.',
      'Procure osteoblastos em transição, já parcialmente rodeados por matriz.',
    ],
  },

  'bone: intramembranous formation': {
    panorama:
      'Na ossificação intramembranosa o osso se forma **diretamente no mesênquima**, sem molde de cartilagem: células mesenquimais condensam-se, diferenciam-se em osteoblastos e começam a depositar osteoide, criando espículas que crescem e se fundem em trabéculas. É assim que se formam os ossos planos do crânio, a maior parte da clavícula e a mandíbula. As lâminas mostram espículas de osso primário — não lamelar, com osteócitos grandes e desordenados — envoltas por osteoblastos ativos, imersas em mesênquima muito celular e vascularizado. Esse osso primário é depois substituído por lamelar; nos ossos do crânio, as tábuas externa e interna ficam compactas e o meio permanece esponjoso, formando o díploe.',
    atencao:
      'Osso primário não é patológico aqui: é o estágio esperado. Ele só é anormal quando persiste no adulto fora de reparo recente.',
  },

  'endochondral ossification': {
    panorama:
      'Na ossificação endocondral o osso substitui um **molde de cartilagem hialina**, e o disco epifisário conserva esse processo em atividade, organizado em zonas que se leem da epífise para a diáfise: **repouso** (cartilagem hialina inalterada), **proliferação** (condrócitos empilhados em colunas, como moedas), **hipertrofia** (células enormes, com lacunas dilatadas), **calcificação** da matriz (que mata os condrócitos por bloqueio da difusão) e **ossificação**, onde vasos invadem, osteoclastos limpam e osteoblastos depositam osso sobre as espículas de cartilagem calcificada remanescente. É o mecanismo de crescimento em comprimento de todos os ossos longos, e sua parada com o fechamento do disco define a estatura final.',
    roteiro: [
      'Percorra o disco epifisário nomeando as cinco zonas na ordem.',
      'Na zona de ossificação, procure o eixo de cartilagem calcificada dentro da espícula óssea.',
    ],
  },

  /* ═══════════ Nervoso ═══════════ */

  'peripheral nerve': {
    panorama:
      'Um nervo periférico é um cabo organizado em três envoltórios concêntricos, e cada um tem função distinta. O **endoneuro** é conjuntivo frouxo em volta de cada fibra individual; o **perineuro** envolve cada fascículo e é formado por camadas de células achatadas unidas por junções de oclusão — é ele que constitui a barreira hematonervosa e mantém o microambiente do axônio; o **epineuro** é conjuntivo denso que reúne os fascículos e carrega os vasos maiores. Em corte transversal, cada fibra mielinizada aparece como um anel claro (a mielina dissolvida) com um ponto central (o axônio) e, na periferia, o núcleo achatado da célula de Schwann.',
    roteiro: [
      'Nomeie os três envoltórios de fora para dentro antes de olhar as fibras.',
      'Compare o calibre das fibras dentro de um mesmo fascículo.',
    ],
    atencao:
      'O halo claro em volta do axônio é mielina dissolvida pelo processamento, não espaço vazio.',
  },

  'multipolar neuron': {
    panorama:
      'O neurônio multipolar tem um axônio e vários dendritos, e é o tipo mais comum do sistema nervoso — motoneurônios do corno ventral, células piramidais do córtex, células de Purkinje do cerebelo. Numa lâmina de medula ele se reconhece pelo corpo celular grande, núcleo vesiculoso com nucléolo proeminente e citoplasma cheio de **substância de Nissl**, o retículo rugoso agregado que dá a basofilia em grumos. O detalhe que resolve a identificação do axônio: a Nissl está presente nos dendritos e ausente no **cone de implantação**, então a região pálida de onde parte um prolongamento marca o início do axônio.',
    roteiro: [
      'Ache o corpo celular maior do campo e localize seu nucléolo.',
      'Procure a região pálida do cone de implantação e siga o prolongamento que sai dela.',
    ],
  },

  'schwann cells': {
    panorama:
      'A célula de Schwann é a glia do sistema nervoso periférico e trabalha de dois modos, dependendo do calibre do axônio. Em fibras **mielinizadas**, uma célula envolve um único segmento de um único axônio e enrola sua membrana dezenas de vezes, formando um internódulo de mielina; entre internódulos ficam os **nós de Ranvier**, onde se concentram os canais de sódio e onde o potencial de ação "salta". Em fibras **amielínicas**, uma única célula acomoda vários axônios em invaginações separadas da sua superfície, sem enrolamento. Depois de uma secção nervosa, as células de Schwann sobrevivem, proliferam e formam as bandas de Büngner, que guiam o rebrote axonal — é essa capacidade que o SNC não tem.',
  },

  'sensory retina': {
    panorama:
      'A retina sensorial tem dez camadas, e o contraintuitivo é que a luz atravessa quase todas antes de chegar aos fotorreceptores, que ficam no fundo, encostados no epitélio pigmentar. A sequência a partir da coroide: epitélio pigmentar, segmentos dos fotorreceptores, limitante externa, camada **nuclear externa** (corpos celulares de cones e bastonetes), **plexiforme externa** (sinapse com bipolares), **nuclear interna** (bipolares, horizontais, amácrinas, Müller), **plexiforme interna** (sinapse com ganglionares), camada de células ganglionares, camada de fibras nervosas e limitante interna. Três neurônios em série — fotorreceptor, bipolar, ganglionar — e os axônios das ganglionares formam o nervo óptico.',
    roteiro: [
      'Conte as camadas nucleares: são duas, e elas orientam toda a leitura.',
      'Localize o epitélio pigmentar e use-o para saber de que lado está a coroide.',
    ],
  },

  /* ═══════════ Vasos ═══════════ */

  'continuous capillary': {
    panorama:
      'O capilar contínuo é o mais restritivo dos três tipos: endotélio sem fenestras, unido por junções de oclusão, sobre lâmina basal contínua, com pericitos por fora. A troca acontece por difusão através da célula (gases, lipossolúveis) e por vesículas de transcitose, não por poros. Predomina onde a seletividade importa mais que o volume — músculo, pulmão, pele, tecido conjuntivo — e atinge o extremo no **sistema nervoso central**, onde as junções de oclusão são especialmente cerradas e formam a barreira hematoencefálica, reforçada pelos pés perivasculares dos astrócitos. Em corte, muitas vezes só se reconhece o capilar pela hemácia que cabe justo na luz.',
    atencao:
      'O tipo de capilar é previsível pela função do órgão: filtrar ou secretar em volume pede fenestrado, não contínuo.',
  },

  'elastic artery': {
    panorama:
      'A artéria elástica — aorta, tronco pulmonar, carótida comum — tem a túnica média dominada por dezenas de **lamelas elásticas concêntricas**, com células musculares lisas entre elas. A função dessas lamelas é armazenar energia: na sístole a parede se distende e acumula; na diástole ela recolhe e devolve, mantendo fluxo e pressão contínuos a jusante. É o **efeito Windkessel**, e é ele que transforma um bombeamento pulsátil numa perfusão constante. A parede é tão espessa que não pode se nutrir por difusão da luz: os dois terços externos dependem de **vasa vasorum**. Em H&E as lamelas aparecem como linhas onduladas refringentes; com orceína ou Verhoeff, ficam evidentes e contáveis.',
    roteiro: [
      'Conte aproximadamente as lamelas elásticas da média.',
      'Procure vasa vasorum na adventícia e no terço externo da média.',
    ],
  },

  'medium (muscular) artery': {
    panorama:
      'A artéria muscular é a de distribuição, e sua média é dominada por **músculo liso circular** — de várias a dezenas de camadas — entre uma lâmina elástica interna muito evidente e uma externa mais discreta. É essa musculatura que ajusta o fluxo regional por vasoconstrição e vasodilatação sob controle autonômico. O achado que identifica a artéria muscular num campo é a **lâmina elástica interna ondulada**: a ondulação é artefato de fixação, produzido pela contração da média depois da morte, e por isso é tão constante que virou critério. A luz permanece redonda e aberta, ao contrário da veia acompanhante, que colapsa.',
    roteiro: [
      'Ache a lâmina elástica interna e siga seu contorno ondulado.',
      'Compare a espessura da média com o diâmetro da luz — na artéria, a média é espessa.',
    ],
  },

  'large vein (vena cava)': {
    panorama:
      'As veias de grande calibre invertem a proporção das túnicas: a média é fina, e a **adventícia** é a camada mais espessa da parede, com feixes longitudinais de músculo liso na cava inferior e nas veias das extremidades. A luz é ampla e frequentemente colapsada ou irregular no corte, porque a pressão intraluminal é baixa e a parede não se sustenta sozinha. O retorno depende de fatores externos — bomba muscular esquelética, pressão negativa torácica — e de **válvulas** formadas por pregas da íntima nas veias dos membros, que impedem o refluxo. É a falência dessas válvulas que produz as varizes.',
    atencao:
      'Comparar artéria e veia acompanhantes no mesmo campo é mais confiável que julgar cada uma isoladamente.',
  },

  /* ═══════════ Digestório ═══════════ */

  'esophagus': {
    panorama:
      'O esôfago é um tubo de condução, e cada camada reflete isso. A mucosa tem **epitélio estratificado pavimentoso não queratinizado**, que resiste à abrasão do bolo alimentar; a lâmina própria contém glândulas cárdicas esofágicas nas extremidades; e a muscular da mucosa é espessa. Na **submucosa** ficam as glândulas esofágicas próprias, secretoras de muco — sua localização submucosa é rara no tubo digestório e, junto com as glândulas de Brunner do duodeno, é um dos dois casos que valem memorizar. A muscular externa muda de natureza ao longo do órgão: esquelética no terço superior, mista no médio, lisa no inferior — o que corresponde à transição da deglutição voluntária para a peristalse involuntária.',
    roteiro: [
      'Confirme o epitélio e verifique se há núcleos nas células superficiais.',
      'Procure glândulas na submucosa e siga o ducto atravessando a mucosa.',
      'Determine o tipo de músculo da muscular externa para localizar o segmento.',
    ],
  },

  'stomach: fundus and body': {
    panorama:
      'A mucosa fúndica é onde o estômago secreta ácido, e sua organização vertical é o que se deve ler. A superfície e as **fovéolas gástricas** são revestidas por células mucosas superficiais, que produzem o muco alcalino que protege o epitélio do próprio ácido. No fundo das fovéolas abrem-se as glândulas fúndicas, divididas em colo, corpo e base: no **colo**, células mucosas do colo e as células-tronco que renovam a mucosa; no **corpo**, as **células parietais**, grandes, arredondadas e intensamente acidófilas pelas mitocôndrias, que produzem HCl e fator intrínseco; na **base**, as **células principais**, basófilas, com grânulos de pepsinogênio. Enteroendócrinas aparecem dispersas e discretas.',
    roteiro: [
      'Meça a proporção entre a profundidade das fovéolas e o comprimento das glândulas.',
      'Localize as parietais pela acidofilia e as principais pela basofilia, nas alturas certas.',
    ],
    atencao:
      'Fovéolas profundas com glândulas curtas indicam região pilórica, não fúndica — a proporção é o critério regional.',
  },

  'large intestine': {
    panorama:
      'O cólon abandona a absorção de nutrientes e assume a de água e eletrólitos, e a mucosa muda de acordo. **Não há vilosidades**: a superfície é plana, com criptas de Lieberkühn retas, profundas e paralelas, como tubos de ensaio lado a lado. As **células caliciformes** são numerosas e aumentam ainda mais em direção ao reto, porque o conteúdo vai desidratando e precisa de lubrificação. Não há células de Paneth no cólon normal — sua presença indica metaplasia. A muscular externa tem a peculiaridade de condensar a camada longitudinal em três faixas, as **tênias do cólon**, cujo tônus produz as haustrações; e a serosa carrega os apêndices epiploicos de gordura.',
    roteiro: [
      'Confirme a ausência de vilosidades — é o primeiro critério.',
      'Compare a densidade de caliciformes com a de uma lâmina de delgado.',
    ],
  },

  'pancreas': {
    panorama:
      'O pâncreas é duas glândulas no mesmo órgão, e a lâmina mostra as duas de uma vez. A porção **exócrina** ocupa quase todo o parênquima: ácinos serosos intensamente basófilos na base (retículo rugoso) e acidófilos no ápice (grânulos de zimogênio), drenados por ductos intercalares cujas primeiras células se projetam para dentro do ácino como **células centroacinosas** — um achado exclusivo do pâncreas. A porção **endócrina** são as **ilhotas de Langerhans**, ilhas pálidas de cordões celulares entremeados por capilares fenestrados, dispersas no meio do tecido exócrino. Falta ao pâncreas o ducto estriado que a parótida tem, o que ajuda a separar os dois quando o campo é pequeno.',
    roteiro: [
      'Ache uma ilhota pela palidez e confirme os capilares entre os cordões.',
      'Procure uma célula centroacinosa dentro da luz de um ácino.',
    ],
  },

  'parotid gland': {
    panorama:
      'A parótida é uma glândula **puramente serosa**, e por isso todos os seus ácinos têm o mesmo aspecto: células piramidais com núcleo redondo basal, base basófila e ápice acidófilo, em torno de uma luz estreita. O que a distingue do pâncreas — que tem ácinos igualmente serosos — é o sistema de ductos: a parótida tem **ductos estriados** proeminentes, com epitélio cúbico alto acidófilo e estriações basais visíveis, que modificam a composição iônica da saliva reabsorvendo sódio. Outro achado característico é a presença de **adipócitos** entre os lóbulos, que aumenta com a idade.',
    atencao:
      'Ácinos serosos + ductos estriados = salivar; ácinos serosos + células centroacinosas + ilhotas = pâncreas.',
  },

  'submandibular gland': {
    panorama:
      'A submandibular é uma glândula **mista com predomínio seroso**, e é a lâmina onde melhor se estuda a diferença entre os dois tipos de ácino no mesmo campo. Os ácinos serosos são escuros, basófilos, com luz estreita; os túbulos mucosos são pálidos e vacuolados em H&E, porque a mucina se perde no processamento, com núcleos achatados contra a base. O achado clássico é a **semilua serosa** (de Gianuzzi): um capuz de células serosas encaixado sobre a extremidade de um túbulo mucoso, cuja secreção alcança a luz por canalículos intercelulares. Os ductos estriados são bem desenvolvidos, como convém a uma glândula que produz saliva em grande volume.',
    roteiro: [
      'Encontre uma semilua serosa sobre um túbulo mucoso.',
      'Compare a afinidade tintorial dos dois tipos de unidade secretora.',
    ],
  },

  'sublingual gland': {
    panorama:
      'A sublingual inverte a proporção da submandibular: é **mista com predomínio mucoso**, e a lâmina fica dominada por túbulos pálidos e vacuolados, com poucas unidades serosas puras. As semiluas serosas continuam presentes, mas os ductos estriados são escassos e curtos — coerente com uma glândula que contribui pouco para o volume salivar e muito para a viscosidade. Os septos de tecido conjuntivo são proeminentes e dividem o parênquima em lóbulos bem delimitados. Comparar parótida, submandibular e sublingual lado a lado é o modo mais econômico de fixar a relação entre tipo de ácino, tipo de ducto e função da saliva produzida.',
  },

  'tooth': {
    panorama:
      'O dente reúne três tecidos mineralizados de origens e propriedades diferentes. O **esmalte** é o mais duro do corpo (96% mineral), de origem ectodérmica, produzido por ameloblastos que morrem após a erupção — por isso não se regenera; em corte descalcificado ele desaparece e sobra um espaço. A **dentina** (70% mineral) é mesenquimal, atravessada pelos **túbulos dentinários** que abrigam os prolongamentos dos odontoblastos, e continua sendo produzida a vida toda a partir da polpa — é por isso que dói. O **cemento** recobre a raiz e ancora as fibras do ligamento periodontal. No centro, a **polpa**, conjuntivo frouxo muito vascularizado e inervado, com a camada de odontoblastos na periferia.',
    roteiro: [
      'Determine se o corte é descalcificado (esmalte ausente) ou desgastado.',
      'Siga os túbulos dentinários da polpa em direção à junção dentino-esmalte.',
    ],
  },

  /* ═══════════ Reprodutor e endócrino ═══════════ */

  'seminiferous tubules - convoluted portion': {
    panorama:
      'O túbulo seminífero contém o epitélio germinativo, organizado em uma sequência espacial que é também temporal: da lâmina basal para a luz, **espermatogônias** (pequenas, encostadas na base), **espermatócitos primários** (as maiores células, muitas vezes flagradas em prófase, com cromossomos condensados), **espermatócitos secundários** (raros, porque duram pouco), **espermátides** (pequenas e arredondadas, depois alongadas) e espermatozoides liberados na luz. Entre as células germinativas, as **células de Sertoli** se estendem da base à luz e formam, com junções de oclusão, a **barreira hematotesticular**, que isola o compartimento adluminal — necessária porque os gametas surgem depois da tolerância imunológica e seriam atacados como estranhos.',
    roteiro: [
      'Leia o epitélio da base para a luz, nomeando cada estágio na ordem.',
      'Identifique o núcleo pálido e triangular da célula de Sertoli, com nucléolo evidente.',
      'Procure as células de Leydig no interstício, entre túbulos.',
    ],
  },

  'prostate': {
    panorama:
      'A próstata é um conjunto de glândulas tubuloalveolares imersas num estroma **fibromuscular** abundante — e é essa mistura de músculo liso com conjuntivo, incomum, que identifica o órgão de imediato. O epitélio glandular é simples colunar a pseudoestratificado, com pregueamento acentuado que dá às luzes um contorno irregular e recortado. Dentro das luzes aparecem com frequência as **concreções prostáticas** (corpora amylacea), condensações lamelares de glicoproteína que aumentam com a idade e são achado normal. A zona periférica é onde nasce a maioria dos adenocarcinomas; a transicional é onde ocorre a hiperplasia benigna que comprime a uretra.',
    roteiro: [
      'Note o estroma fibromuscular antes de olhar as glândulas — é ele que fecha o diagnóstico.',
      'Procure concreções nas luzes glandulares.',
    ],
  },

  'seminal vesicle': {
    panorama:
      'A glândula seminal não armazena espermatozoides, apesar do nome antigo: ela secreta o fluido rico em **frutose** que os nutre, e responde por cerca de 70% do volume do ejaculado. Histologicamente é um tubo único muito enovelado, o que num corte produz o padrão característico de múltiplas luzes que se comunicam entre si por **arcadas de mucosa** — pregas altas e ramificadas que se anastomosam. O epitélio é simples colunar a pseudoestratificado, com secreção acidófila nas luzes e grânulos de lipofuscina no citoplasma, que aumentam com a idade. A parede tem músculo liso, responsável pela expulsão durante a emissão.',
    atencao:
      'As múltiplas "glândulas" do corte são o mesmo tubo cortado várias vezes — reconhecer isso evita descrevê-lo como glândula composta.',
  },

  'thyroid gland': {
    panorama:
      'A tireoide é o único órgão endócrino que **armazena seu hormônio fora da célula**, e sua histologia é inteiramente construída em torno disso: folículos esféricos revestidos por epitélio simples cúbico, com **coloide** de tireoglobulina preenchendo o centro. A altura do epitélio é um indicador funcional direto — baixo e achatado com folículos distendidos indica repouso; alto e colunar com coloide reabsorvido, e vacúolos de reabsorção em sua borda, indica estimulação por TSH. Entre os folículos, ou na parede folicular sem tocar o coloide, ficam as **células parafoliculares (C)**, maiores e mais pálidas, que produzem calcitonina e têm origem em crista neural.',
    roteiro: [
      'Avalie a altura do epitélio folicular e o quanto o coloide preenche a luz.',
      'Procure células C, pálidas, entre a lâmina basal e o epitélio folicular.',
    ],
  },

  'parathyroid gland': {
    panorama:
      'A paratireoide é uma glândula endócrina compacta, organizada em cordões e ninhos de células separados por capilares, sem folículos. Duas populações convivem: as **células principais**, pequenas, pálidas e majoritárias, que produzem o PTH, e as **células oxífilas**, maiores, intensamente acidófilas pela quantidade de mitocôndrias, cuja função permanece incerta e que aumentam após a puberdade. Adipócitos aparecem no estroma e sua proporção cresce com a idade — chegando a metade do órgão no adulto, o que é normal. O PTH eleva a calcemia mobilizando osso (via osteoblastos e RANKL), reabsorvendo cálcio no rim e ativando a vitamina D.',
    atencao:
      'A presença de gordura no parênquima é normal e não deve ser lida como atrofia.',
  },

  'pars distalis': {
    panorama:
      'A pars distalis é a maior porção da adeno-hipófise e concentra as células que produzem os hormônios tróficos. Classificam-se em H&E pela afinidade tintorial: **acidófilas** (somatotrofos, que fazem GH; lactotrofos, prolactina), **basófilas** (corticotrofos, ACTH; tireotrofos, TSH; gonadotrofos, FSH e LH) e **cromófobas**, pálidas, que são células degranuladas ou de reserva. Essa classificação é grosseira — só imuno-histoquímica identifica cada tipo com segurança —, mas é o que a lâmina de rotina permite, e reconhecer a proporção entre os três grupos já orienta. O parênquima é organizado em cordões percorridos por capilares fenestrados do sistema porta-hipofisário, que traz os fatores liberadores do hipotálamo.',
    roteiro: [
      'Separe os três grupos pela cor antes de tentar identificar tipos específicos.',
      'Compare com a pars nervosa no mesmo corte: lá não há cordões nem cromófilas.',
    ],
  },

  // ---- Títulos genéricos, escopados por rota ----

  'celulas::membranes': {
    panorama:
      'A membrana plasmática só aparece como linha definida na microscopia eletrônica: um **trilaminar** de 7,5 a 10 nm — duas faixas escuras separadas por uma clara —, imagem do ósmio ligado às cabeças polares dos fosfolipídios enquanto as caudas apolares, no meio, ficam sem contraste. Na microscopia de luz, o que se vê como "limite celular" é a soma da membrana com o glicocálice e a matriz vizinha, muito abaixo do poder de resolução. O modelo do **mosaico fluido** explica o resto: uma bicamada com proteínas integrais que a atravessam e periféricas ancoradas em uma das faces, todas com mobilidade lateral, e colesterol modulando a fluidez.',
    roteiro: [
      'Confirme a espessura antes de nomear: abaixo de 7 nm, provavelmente é artefato de corte oblíquo.',
      'Siga a membrana até uma especialização — microvilo, junção, invaginação — para ver a mesma bicamada mudando de função.',
    ],
    atencao:
      'A linha escura não é a membrana inteira: são as duas faces hidrofílicas. O miolo claro é a parte lipídica.',
  },

  'orgaos-e-sistemas::membranes': {
    panorama:
      'Aqui "membrana" tem outro sentido: não é a bicamada da célula, e sim a **lâmina de revestimento** que forra cavidades e superfícies do corpo — epitélio mais o tecido conjuntivo que o sustenta, funcionando como unidade. As **membranas mucosas** revestem cavidades abertas ao exterior (digestório, respiratório, urinário, genital) e são sempre úmidas por secreção própria; têm epitélio, lâmina própria e, em alguns órgãos, uma muscular da mucosa. As **membranas serosas** — pleura, pericárdio, peritônio — revestem cavidades fechadas, com mesotélio simples pavimentoso sobre conjuntivo frouxo, e deslizam sobre líquido ultrafiltrado do plasma.',
    roteiro: [
      'Decida primeiro se a cavidade é aberta ou fechada: isso separa mucosa de serosa antes de qualquer detalhe.',
      'Procure a muscular da mucosa: sua presença confirma mucosa de tubo digestório.',
    ],
    atencao:
      'Serosa e adventícia não são sinônimos: a adventícia é só conjuntivo, sem mesotélio de revestimento.',
  },

  'orgaos-e-sistemas/pele::receptors': {
    panorama:
      'A pele hospeda um conjunto de terminações sensoriais cuja localização já entrega a função. Os **corpúsculos de Meissner** ficam nas papilas dérmicas, logo abaixo da epiderme, e respondem ao toque leve e discriminativo — são densos em polpa digital e lábios. Os **corpúsculos de Pacini** ficam fundo, na derme reticular e na hipoderme, e têm o aspecto inconfundível de cebola cortada: dezenas de lamelas concêntricas de células achatadas em torno de um axônio central; detectam vibração e pressão profunda. Os **discos de Merkel** ficam na camada basal e sinalizam pressão sustentada e textura, e as **terminações livres** sobem entre os queratinócitos levando dor e temperatura.',
    roteiro: [
      'Meça a profundidade antes de nomear: Meissner é papilar, Pacini é profundo.',
      'Conte as lamelas do Pacini — a estrutura concêntrica é o achado diagnóstico, não o tamanho.',
    ],
    atencao:
      'Um Pacini cortado fora do plano equatorial parece um cacho irregular; procure o axônio central antes de descartá-lo.',
  },

  'tecidos/tecido-nervoso::receptors': {
    panorama:
      'Do lado do tecido nervoso, o receptor é classificado pelo que transduz e por como o axônio termina. **Terminações livres** são ramos amielínicos nus, sem cápsula, e cobrem nocicepção, temperatura e tato grosseiro — são as mais numerosas e as menos visíveis. **Terminações encapsuladas** envolvem o axônio em lamelas de tecido conjuntivo e células de sustentação, o que filtra o estímulo mecanicamente antes de ele chegar à membrana: Meissner, Pacini, Ruffini e os bulbos terminais. Os **fusos neuromusculares** e os **órgãos tendinosos de Golgi** completam o quadro, informando comprimento e tensão para o controle da postura.',
    roteiro: [
      'Pergunte primeiro se há cápsula: ela divide o campo em duas famílias inteiras.',
      'Nos fusos, procure as fibras intrafusais — mais finas e envolvidas por cápsula própria dentro do músculo.',
    ],
  },

  'orgaos-e-sistemas/conceitos-gerais::organs': {
    panorama:
      'Um órgão é o degrau seguinte da hierarquia: tecidos diferentes reunidos numa unidade funcional. Praticamente todo órgão pode ser lido pela dupla **parênquima** — as células que fazem o trabalho característico — e **estroma** — o arcabouço de conjuntivo, vasos e nervos que as sustenta. Órgãos maciços, como fígado e rim, se organizam em cápsula, septos e lóbulos; órgãos tubulares, como intestino e vaso, repetem camadas concêntricas em torno de uma luz. Reconhecer qual dos dois planos você está vendo, antes de tentar nomear o órgão, resolve boa parte das lâminas.',
    roteiro: [
      'Procure a luz: se houver, o plano é o tubular, e as camadas devem ser lidas de dentro para fora.',
      'Se não houver, procure cápsula e septos para achar a unidade lobular.',
    ],
  },

  'orgaos-e-sistemas/sistema-endocrino::organs': {
    panorama:
      'Os órgãos endócrinos são exceções ao padrão glandular: não têm ducto, e a secreção cai direto no capilar. Isso impõe uma arquitetura reconhecível — parênquima em **cordões**, **ninhos** ou **folículos**, sempre encostado num leito capilar fenestrado abundante, com estroma reticular fino em vez de septos grossos. Hipófise, tireoide, paratireoide, suprarrenal e pineal são os órgãos exclusivamente endócrinos; pâncreas, gônadas, rim e placenta acumulam função endócrina dentro de órgãos com outras tarefas. A ausência de ductos é o achado negativo que mais orienta: se você procura um ducto e não acha, considere endócrino.',
    roteiro: [
      'Classifique o arranjo em cordão, ninho ou folículo antes de tentar nomear o órgão.',
      'Confirme a densidade capilar: endócrino sem capilar farto quase sempre é erro de identificação.',
    ],
  },

  'orgaos-e-sistemas/sistema-linfoide::organs': {
    panorama:
      'Os órgãos linfoides se dividem por função. Os **primários** — medula óssea e timo — produzem e educam linfócitos: é onde B e T adquirem receptor e passam pela seleção. Os **secundários** — linfonodo, baço, tonsilas e o tecido linfoide associado a mucosas — são onde o linfócito já competente encontra o antígeno e responde. A distinção aparece na lâmina: órgão primário não tem centro germinativo (o timo não monta nódulos), enquanto órgão secundário se organiza em nódulos com centro germinativo claro cercado de manto escuro, sinal de proliferação em curso.',
    roteiro: [
      'Procure centro germinativo: sua presença já classifica o órgão como secundário.',
      'No timo, separe córtex escuro de medula clara e procure os corpúsculos de Hassall.',
    ],
  },

  'orgaos-e-sistemas/ouvido::overview': {
    panorama:
      'O ouvido reúne três compartimentos com histologia bem distinta. O **ouvido externo** — pavilhão e meato acústico externo — é pele sobre cartilagem elástica, com glândulas ceruminosas apócrinas modificadas na porção cartilaginosa. O **ouvido médio** é uma cavidade aérea no temporal, revestida por epitélio simples pavimentoso a cúbico, atravessada pela cadeia de ossículos e ligada à faringe pela tuba auditiva. O **ouvido interno** é o labirinto ósseo escavado no rochedo, contendo o labirinto membranoso suspenso em perilinfa e preenchido por endolinfa, onde ficam a cóclea, o vestíbulo e os canais semicirculares — os epitélios sensoriais propriamente ditos.',
    roteiro: [
      'Identifique o tipo de cartilagem do pavilhão: elástica, não hialina.',
      'No labirinto, separe sempre os espaços peri e endolinfáticos antes de procurar epitélio sensorial.',
    ],
  },

  'orgaos-e-sistemas/sistema-cardiovascular::overview': {
    panorama:
      'O sistema cardiovascular é um circuito fechado cujo plano geral se repete: **túnica íntima** (endotélio, lâmina basal e conjuntivo subendotelial), **túnica média** (músculo liso e elastina) e **túnica adventícia** (conjuntivo, vasa vasorum e nervos). O que muda de um vaso para outro é a proporção entre elas, e é essa proporção que se lê na lâmina. Artérias elásticas amortecem a sístole com lamelas de elastina; artérias musculares distribuem o fluxo e têm média espessa; arteríolas controlam a resistência periférica; capilares fazem a troca com uma só camada de endotélio; veias devolvem o sangue com paredes finas, luz ampla e válvulas.',
    roteiro: [
      'Compare a espessura da média com o diâmetro da luz — é a razão que classifica, não o tamanho absoluto.',
      'Procure as lâminas elásticas interna e externa: elas separam artéria muscular de veia com segurança.',
    ],
    atencao:
      'Em cortes histológicos a artéria costuma parecer menor e mais redonda que a veia acompanhante, porque a média contraída não colaba.',
  },

  'orgaos-e-sistemas/sistema-digestorio/tubular-digestive-system/stomach::overview': {
    panorama:
      'O estômago mantém o plano de quatro camadas do tubo digestório, mas com marcas próprias. A mucosa é espessa e cheia de **fossetas gástricas** (fovéolas), funis onde desembocam as glândulas; todo o epitélio de superfície é simples colunar secretor de muco neutro, sem células caliciformes — a ausência delas é um dos achados mais úteis para distinguir estômago de intestino. A muscular externa tem **três** camadas, e não duas: oblíqua interna, circular média e longitudinal externa, arranjo que permite triturar além de propelir. Pregas longitudinais chamadas rugas, formadas por mucosa e submucosa, somem quando o órgão distende.',
    roteiro: [
      'Confirme a ausência de células caliciformes antes de qualquer outra coisa.',
      'Meça a proporção fosseta/glândula: ela muda entre cárdia, fundo e piloro e identifica a região.',
    ],
  },

  'orgaos-e-sistemas/sistema-digestorio/tubular-digestive-system/small-intestine::overview': {
    panorama:
      'O intestino delgado é desenhado para maximizar superfície, e faz isso em três escalas encaixadas: as **pregas circulares** (válvulas de Kerckring), dobras permanentes de mucosa e submucosa; as **vilosidades**, projeções digitiformes só de mucosa, com eixo de lâmina própria contendo um quilífero central e um plexo capilar; e as **microvilosidades** da borda estriada de cada enterócito. Juntas multiplicam a área em cerca de 600 vezes. Entre as bases das vilosidades abrem-se as **criptas de Lieberkühn**, com células-tronco, células de Paneth e células enteroendócrinas. Caliciformes aparecem no epitélio e vão ficando mais numerosas em direção ao íleo.',
    roteiro: [
      'Comece pela vilosidade: sua presença exclui estômago e intestino grosso de imediato.',
      'Desça até a base das criptas e procure os grânulos acidófilos das células de Paneth.',
    ],
    atencao:
      'Uma vilosidade cortada transversalmente vira uma ilha de epitélio isolada na luz — não é um pólipo nem descamação.',
  },

  'orgaos-e-sistemas/sistema-endocrino::overview': {
    panorama:
      'A visão geral do sistema endócrino contrasta dois modos de sinalizar. A glândula **exócrina** entrega sua secreção por um ducto a uma superfície; a **endócrina** perdeu o ducto no desenvolvimento e lança o hormônio no interstício, de onde ele alcança o capilar e viaja pelo sangue até a célula-alvo que tiver receptor. Por isso o desenho é sempre o mesmo: parênquima em cordões, ninhos ou folículos, encostado num leito de capilares fenestrados, com pouco conjuntivo entre eles. Hormônios peptídicos ficam estocados em grânulos e a célula que os produz tem RER e Golgi proeminentes; hormônios esteroides não se estocam, e a célula tem REL abundante, mitocôndrias de cristas tubulares e gotículas lipídicas.',
    roteiro: [
      'Classifique a célula pelo citoplasma: granular e basófilo sugere peptídico; vacuolado e acidófilo sugere esteroide.',
      'Confirme sempre a proximidade capilar — é ela que define o órgão como endócrino.',
    ],
  },

  'orgaos-e-sistemas/sistema-reprodutor/masculino::overview': {
    panorama:
      'O aparelho reprodutor masculino combina uma gônada com função dupla e uma via de condução com glândulas anexas. O **testículo** produz espermatozoides nos túbulos seminíferos e testosterona nas células de Leydig do interstício. A via começa nos **túbulos retos** e na **rede testicular**, segue pelos **dúctulos eferentes** — de epitélio caracteristicamente ondulado, com grupos ciliados e não ciliados alternando —, chega ao **epidídimo**, onde o espermatozoide amadurece e é estocado, e continua pelo **ducto deferente**, de muscular espessa em três camadas. As glândulas anexas — vesícula seminal, próstata e bulbouretrais — fornecem quase todo o volume do ejaculado.',
    roteiro: [
      'Use a altura do epitélio e a espessura da muscular para situar-se na via: elas crescem em sentido oposto ao longo do trajeto.',
      'No testículo, separe sempre o compartimento tubular do intersticial antes de descrever células.',
    ],
  },

  'orgaos-e-sistemas/sistema-reprodutor/feminino/overview-of-the-female-reproductive-system::overview': {
    panorama:
      'O aparelho reprodutor feminino difere do masculino por ser cíclico: quase toda estrutura muda de aparência conforme o dia do ciclo, e ler a lâmina é também datar o material. O **ovário** aloja folículos em vários estágios no córtex e produz estrogênio e progesterona. A **tuba uterina** capta o oócito e é onde ocorre a fecundação; seu epitélio alterna células ciliadas e secretoras em proporção que também varia no ciclo. O **útero** tem endométrio que prolifera, secreta e descama a cada ciclo sobre um miométrio espesso. **Colo** e **vagina** mudam de epitélio e fecham a via para o exterior.',
    roteiro: [
      'Antes de nomear a estrutura, tente datar o ciclo: isso muda o que é normal na lâmina.',
      'No ovário, conte as camadas da granulosa e procure o antro para estagiar o folículo.',
    ],
  },

  'orgaos-e-sistemas/sistema-reprodutor/feminino/uterus::overview': {
    panorama:
      'A parede uterina tem três camadas. O **endométrio** é a mucosa: epitélio simples colunar com glândulas tubulares que mergulham num estroma peculiar, celular e semelhante a mesênquima. Divide-se funcionalmente em **camada funcional**, superficial, que descama a cada menstruação, e **camada basal**, profunda, preservada, de onde parte a reepitelização. O **miométrio** é a maior parte da parede: feixes espessos de músculo liso em orientações entrelaçadas, que hipertrofiam muito na gravidez. O **perimétrio** é serosa ou adventícia conforme a face. A irrigação explica o ciclo: artérias retas nutrem a basal, artérias espiraladas nutrem a funcional e são elas que se contraem na menstruação.',
    roteiro: [
      'Localize o limite entre funcional e basal pela mudança no calibre e na tortuosidade das glândulas.',
      'Avalie a espessura do endométrio em relação ao miométrio antes de datar a fase.',
    ],
  },

  'tecidos/tecido-conjuntivo::overview': {
    panorama:
      'O tecido conjuntivo é o único em que a **matriz extracelular** importa mais que as células. Ele é definido pela composição dessa matriz: fibras (colágenas, reticulares e elásticas) mergulhadas em substância fundamental de glicosaminoglicanos, proteoglicanos e glicoproteínas adesivas, tudo altamente hidratado. As células vêm em dois grupos — as **residentes**, que constroem e mantêm (fibroblasto, adipócito, macrófago, mastócito), e as **transitórias**, vindas do sangue durante a resposta imune (linfócito, plasmócito, neutrófilo, eosinófilo). Deriva do mesênquima e cumpre quatro papéis: sustentação, ligação entre tecidos, transporte por difusão entre capilar e célula, e defesa.',
    roteiro: [
      'Descreva a matriz antes das células: é a proporção fibra/substância fundamental que classifica o tecido.',
      'Identifique o tipo de fibra dominante — colágena grossa e acidófila, elástica fina e ondulada, reticular só visível com prata.',
    ],
  },

  'tecidos/tecido-conjuntivo/tecido-conjuntivo-propriamente-dito::overview': {
    panorama:
      'A classificação do conjuntivo propriamente dito usa dois eixos: a **densidade** de fibras e a **organização** delas. O **frouxo** (areolar) tem fibras esparsas, muita substância fundamental e muitas células — é o tecido de preenchimento por excelência, sede das trocas e da resposta inflamatória, e o que se encontra na lâmina própria e ao redor de vasos. O **denso** tem fibras dominando o campo e poucas células: quando os feixes seguem uma direção só, é **denso modelado**, típico de tendão e ligamento, feito para resistir à tração num eixo; quando se cruzam em todas as direções, é **denso não modelado**, como na derme reticular e nas cápsulas, resistindo a tração vinda de qualquer lado.',
    roteiro: [
      'Compare área de fibra com área de núcleo no mesmo campo: essa razão separa frouxo de denso.',
      'Se for denso, gire a lâmina mentalmente 90° e veja se os feixes mantêm a mesma direção.',
    ],
    atencao:
      'Um denso modelado cortado transversalmente parece não modelado; procure os núcleos alinhados dos fibrócitos entre os feixes.',
  },

  'tecidos/tecido-conjuntivo/cartilage::overview': {
    panorama:
      'A cartilagem é conjuntivo especializado: matriz firme e hidratada, mas sem vasos, sem nervos e sem linfáticos. Suas células, os **condrócitos**, vivem isoladas ou em grupos isógenos dentro de cavidades chamadas **lacunas** e se nutrem por difusão através da matriz — o que explica a cicatrização lenta e a espessura limitada da peça. A matriz tem colágeno tipo II e uma quantidade enorme de proteoglicanos (agrecana), que retêm água e dão resistência à compressão. O **pericôndrio**, conjuntivo denso na periferia, traz os vasos e contém células-tronco que permitem o crescimento por aposição; o crescimento por dentro, intersticial, vem da divisão dos próprios condrócitos.',
    roteiro: [
      'Confirme lacuna com condrócito dentro — matriz homogênea sem lacunas pode ser osso descalcificado ou fibrina.',
      'Procure o pericôndrio: sua ausência em uma superfície é achado, não descuido do corte.',
    ],
    atencao:
      'O condrócito costuma retrair no processamento e deixa um halo claro dentro da lacuna; isso é artefato, não espaço real.',
  },

  // ---- Restante, por número de lâminas ----

  dermis: {
    panorama:
      'A derme é o conjuntivo que sustenta a epiderme e responde pela resistência mecânica da pele. Divide-se em duas camadas sem limite abrupto. A **derme papilar**, superficial, é conjuntivo frouxo que sobe em papilas encaixadas nas cristas epidérmicas — esse entrelaçamento aumenta a área de ancoragem e a superfície de troca, e é onde ficam as alças capilares e os corpúsculos de Meissner. A **derme reticular**, profunda e muito mais espessa, é conjuntivo denso não modelado, com feixes grossos de colágeno tipo I em várias direções e uma rede elástica que devolve a forma. Nela se alojam folículos pilosos, glândulas sebáceas e sudoríparas, e os corpúsculos de Pacini nas porções mais fundas.',
    roteiro: [
      'Ache a junção dermoepidérmica e siga as papilas: a mudança de calibre das fibras marca o limite entre papilar e reticular.',
      'Compare a espessura das duas camadas — a reticular domina largamente.',
    ],
    atencao:
      'A hipoderme, rica em adipócitos, não faz parte da derme, embora venha logo abaixo e no corte pareça contínua.',
  },

  'compound tubuloacinar gland': {
    panorama:
      'Nas glândulas compostas, "composto" se refere ao **ducto ramificado**, e o restante do nome descreve a forma das porções secretoras. Na tubuloacinar, as duas formas convivem: porções alongadas em tubo e porções arredondadas em ácino, muitas vezes com ácinos brotando da extremidade de um túbulo. É o padrão da glândula submandibular, do pâncreas exócrino em parte e das glândulas salivares menores. O parênquima fica organizado em **lóbulos** separados por septos de conjuntivo, e os ductos são nomeados pelo trajeto: intralobulares (intercalares e estriados), interlobulares e, por fim, o ducto excretor principal.',
    roteiro: [
      'Siga um ducto do centro do lóbulo para fora para ver a mudança de calibre e epitélio.',
      'Só chame de composta depois de encontrar a ramificação do ducto — a forma da porção secretora sozinha não decide.',
    ],
  },

  'compound acinar gland': {
    panorama:
      'A glândula acinar composta tem ducto ramificado e porções secretoras exclusivamente arredondadas, os **ácinos**, com luz muito estreita — às vezes imperceptível no corte, o que faz o conjunto parecer uma esfera maciça de células piramidais. O pâncreas exócrino é o exemplo clássico: ácinos intensamente basófilos na base, pelo RER que sustenta a síntese de zimogênios, e apicais acidófilos pelos grânulos. A próstata e as glândulas mamárias em repouso seguem o mesmo plano geral. O contraste com a glândula tubular é direto: o túbulo tem luz visível e paredes paralelas; o ácino é esférico e a luz é virtual.',
    roteiro: [
      'Procure o gradiente de cor dentro da célula — base azul, ápice rosa — antes de tentar identificar o órgão.',
      'Se a luz não aparece, conte os núcleos em roda: a disposição radial já indica ácino.',
    ],
  },

  penis: {
    panorama:
      'O pênis é formado por três colunas de tecido erétil envolvidas por conjuntivo e pele. Os dois **corpos cavernosos**, dorsais, são a maior parte do volume e têm espaços vasculares amplos e irregulares separados por trabéculas de conjuntivo denso e músculo liso; o **corpo esponjoso**, ventral, envolve a uretra peniana e tem espaços menores e mais uniformes, o que impede que a uretra colabe na ereção. A **túnica albugínea**, densa, envolve cada corpo e é o que transforma o enchimento vascular em rigidez. As **artérias helicinas** trazem o sangue e ficam enroladas quando flácido; o relaxamento do músculo liso, mediado por óxido nítrico, as abre e enche os espaços.',
    roteiro: [
      'Localize a uretra para orientar o corte: ela marca o corpo esponjoso e, portanto, a face ventral.',
      'Compare o calibre dos espaços entre cavernoso e esponjoso — é o achado que separa os dois.',
    ],
  },

  'uterus: secretory phase (days 14-26)': {
    panorama:
      'Depois da ovulação, a progesterona do corpo lúteo transforma o endométrio proliferado em tecido pronto para receber o embrião. As glândulas, que eram retas e estreitas, ficam largas e intensamente **tortuosas**, com aspecto serrilhado ou em dente de serra no corte, e a luz se enche de secreção rica em glicogênio. No começo da fase, o glicogênio se acumula abaixo do núcleo — os **vacúolos subnucleares** são o primeiro sinal confiável de que houve ovulação. O estroma incha por edema e, no fim da fase, as células estromais aumentam e ficam pálidas na **reação decidual**. As artérias espiraladas alongam-se e se enovelam mais que o crescimento da camada funcional.',
    roteiro: [
      'Procure os vacúolos subnucleares para datar o início da fase.',
      'Avalie a tortuosidade glandular e o edema do estroma juntos: eles progridem em paralelo.',
    ],
    atencao:
      'Glândula tortuosa por si só não é diagnóstico — no corte oblíquo, glândula reta também parece sinuosa.',
  },

  'uterus: cervix': {
    panorama:
      'O colo uterino é a porção que se projeta na vagina e tem histologia distinta do corpo. O **canal endocervical** é revestido por epitélio simples colunar secretor de muco, com criptas ramificadas profundas cuja secreção muda de viscosidade no ciclo — fluida e filante na ovulação, espessa na fase lútea. A **ectocérvice** é coberta por epitélio estratificado pavimentoso não queratinizado, contínuo com o da vagina. O encontro dos dois é a **junção escamocolunar**, e a faixa em que o colunar foi substituído por escamoso é a zona de transformação — território de metaplasia fisiológica e o sítio de origem da grande maioria dos carcinomas de colo. A parede tem pouco músculo liso e muito conjuntivo denso.',
    roteiro: [
      'Ache a transição de epitélio antes de descrever qualquer outra coisa: ela orienta o corte inteiro.',
      'Compare a parede com o miométrio: aqui domina colágeno, não músculo.',
    ],
  },

  'structure of compound glands': {
    panorama:
      'Toda glândula composta se lê pelos mesmos componentes, e nomeá-los na ordem certa resolve a lâmina. A **cápsula** envolve o órgão e emite **septos** que o dividem em **lobos** e **lóbulos**; dentro do lóbulo ficam as **porções secretoras** — tubulares, acinares ou mistas — drenadas por uma hierarquia de ductos. Os **ductos intercalares** são os primeiros, de epitélio simples cúbico baixo; seguem os **ductos estriados**, com estriações basais que são invaginações da membrana com mitocôndrias alinhadas, responsáveis pelo transporte de íons; ambos são intralobulares. Fora do lóbulo vêm os **ductos interlobulares**, no septo, e o ducto excretor principal, com epitélio que vai ficando estratificado.',
    roteiro: [
      'Situe-se pelo septo: o que está dentro dele é interlobular; o que está entre ácinos é intralobular.',
      'Use as estriações basais para reconhecer o ducto estriado sem depender do calibre.',
    ],
  },

  'unicellular gland': {
    panorama:
      'A glândula unicelular é o caso mais simples de secreção exócrina: uma única célula dispersa em um epitélio de revestimento, sem ducto próprio, entregando o produto direto na superfície. O exemplo universal é a **célula caliciforme**, presente no epitélio respiratório e no intestinal. O nome vem da forma: uma base estreita, com núcleo achatado e comprimido contra a lâmina basal junto ao RER e ao Golgi, e um ápice dilatado abarrotado de grânulos de mucinogênio. Em H&E esse ápice fica pálido ou vazio, porque a mucina é lavada no processamento; PAS e azul de alcião coram-na intensamente e revelam quantas realmente existem.',
    roteiro: [
      'Procure a forma de taça e o núcleo comprimido na base — não confie apenas no vazio apical.',
      'Se a lâmina for PAS, refaça a contagem: em H&E se subestima muito o número de caliciformes.',
    ],
    atencao:
      'No estômago não há células caliciformes; o muco vem do epitélio superficial inteiro, e confundir os dois erra a região.',
  },

  lysosomes: {
    panorama:
      'Os lisossomos são vesículas limitadas por membrana que concentram cerca de cinquenta **hidrolases ácidas** — proteases, lipases, nucleases, glicosidases — com pH interno de aproximadamente 5, mantido por uma bomba de prótons na membrana. Esse ácido é uma proteção: se a vesícula se rompe, as enzimas encontram o citosol neutro e perdem grande parte da atividade. Na microscopia eletrônica aparecem como corpos elétron-densos e heterogêneos, de tamanho variável; em luz, só se reconhecem indiretamente por reação para fosfatase ácida. Fundem-se com fagossomos, endossomos e autofagossomos, e o material não digerido permanece como **corpo residual** — a lipofuscina que se acumula com a idade em neurônios e cardiomiócitos.',
    roteiro: [
      'Compare a densidade eletrônica com a de grânulos de secreção: o lisossomo é mais heterogêneo por dentro.',
      'Procure corpos residuais em células de vida longa — são o registro cumulativo da digestão.',
    ],
  },

  'stroma and parenchyma': {
    panorama:
      'Essa dupla é a chave de leitura de qualquer órgão maciço. O **parênquima** é o conjunto de células que executam a função definidora do órgão — hepatócitos no fígado, néfrons no rim, ácinos no pâncreas. O **estroma** é todo o resto: cápsula, septos, fibras reticulares, vasos, nervos e as células do conjuntivo, servindo de arcabouço, via de suprimento e trilho para a migração celular. Separá-los antes de descrever evita o erro mais comum do iniciante, que é misturar componentes de sistemas diferentes na mesma frase. Em muitos órgãos linfoides e endócrinos, o estroma é reticular e delicado, quase invisível em H&E, mas evidente na impregnação por prata.',
    roteiro: [
      'Percorra o campo uma vez marcando só o estroma, depois outra vez marcando só o parênquima.',
      'Use a coloração por prata quando o estroma reticular não aparecer em H&E.',
    ],
  },

  'semicircular canals': {
    panorama:
      'Os três canais semicirculares — anterior, posterior e lateral — ficam em planos aproximadamente perpendiculares entre si e detectam **aceleração angular**, isto é, rotação da cabeça. Cada canal ósseo aloja um ducto membranoso e tem, numa das extremidades, uma dilatação, a **ampola**. Dentro dela fica a **crista ampular**: uma elevação transversal de conjuntivo coberta por epitélio sensorial com células ciliadas do tipo I e II e células de sustentação. Os estereocílios e o cinocílio mergulham na **cúpula**, uma massa gelatinosa sem otólitos que se comporta como uma porta batente empurrada pelo movimento da endolinfa quando a cabeça gira.',
    roteiro: [
      'Ache a ampola: o epitélio sensorial só existe ali, não ao longo do canal.',
      'Compare com a mácula do utrículo — lá há otólitos, na cúpula não.',
    ],
    atencao:
      'A cúpula quase sempre se retrai no processamento e deixa um espaço vazio sobre a crista; a ausência dela na lâmina é artefato.',
  },

  pituitary: {
    panorama:
      'A hipófise é dois órgãos em um, com origens embriológicas diferentes e histologia que não se parece. A **adeno-hipófise** vem da bolsa de Rathke, uma evaginação do ectoderma oral, e é glândula verdadeira: cordões de células cromófilas e cromófobas entre capilares fenestrados, na pars distalis, mais a pars tuberalis e a pars intermedia. A **neuro-hipófise** vem do assoalho do diencéfalo e é tecido nervoso: axônios amielínicos de neurônios cujos corpos estão nos núcleos supraóptico e paraventricular, mais pituícitos, que são glia. Ela não sintetiza nada — apenas armazena e libera ocitocina e ADH. Reconhecer de qual metade se trata é sempre o primeiro passo.',
    roteiro: [
      'Procure núcleos em cordões coloridos (adeno) contra um fundo fibrilar pálido com poucos núcleos (neuro).',
      'Na pars nervosa, procure os corpos de Herring — dilatações acidófilas dos axônios cheias de neurossecreção.',
    ],
  },

  'intratesticular ducts': {
    panorama:
      'Entre o túbulo seminífero e o epidídimo existe um trecho curto de vias dentro do próprio testículo, e cada segmento tem epitélio característico. Os **túbulos retos** são a transição: a espermatogênese cessa abruptamente e a parede passa a ter só células de Sertoli, depois epitélio simples cúbico. A **rede testicular** (rete testis) é um labirinto de canais anastomosados escavados no mediastino do testículo, revestidos por epitélio simples cúbico baixo, muitas vezes com um único cílio por célula. Dela partem os **dúctulos eferentes**, cujo epitélio alterna grupos de células altas ciliadas e baixas não ciliadas, dando à luz um contorno ondulado, festonado — o achado mais reconhecível de toda a via.',
    roteiro: [
      'Use o contorno da luz para decidir: liso e cúbico é rete; ondulado é dúctulo eferente.',
      'Confirme o mediastino em volta da rete — o conjuntivo denso ali é parte do achado.',
    ],
  },

  'epididymis: head': {
    panorama:
      'A cabeça do epidídimo recebe os dúctulos eferentes, que confluem no **ducto epididimário**: um tubo único de vários metros, enovelado, de modo que um corte mostra dezenas de perfis do mesmo ducto lado a lado. O epitélio é **pseudoestratificado colunar com estereocílios** — que não são cílios, e sim microvilosidades longas e imóveis, especializadas em absorver o líquido que vem do testículo. As células principais são altas; entre suas bases ficam as células basais, de reserva. A luz costuma estar cheia de espermatozoides, e o contorno luminal é regular e liso, ao contrário do dos dúctulos eferentes. Uma camada fina de músculo liso circunda o tubo e vai engrossando em direção à cauda.',
    roteiro: [
      'Compare dois perfis vizinhos: se a luz é lisa e cheia de espermatozoides, é ducto epididimário.',
      'Olhe a espessura do músculo liso — ela cresce da cabeça para a cauda e ajuda a localizar o segmento.',
    ],
  },

  'spermatic cord': {
    panorama:
      'O funículo espermático é um feixe, não um órgão: reúne o **ducto deferente**, o **plexo pampiniforme** de veias, a artéria testicular, linfáticos, nervos e o músculo cremaster, tudo envolto por fáscias. Na lâmina, o ducto deferente é inconfundível — luz estrelada, epitélio pseudoestratificado colunar com estereocílios e, sobretudo, uma muscular **muito** espessa em três camadas (longitudinal interna, circular média, longitudinal externa), desproporcional ao calibre da luz. Em volta, o emaranhado de veias de parede fina do plexo pampiniforme funciona como trocador de calor em contracorrente com a artéria, mantendo o testículo alguns graus abaixo da temperatura corporal.',
    roteiro: [
      'Ache primeiro o ducto deferente pela desproporção músculo/luz; o resto do feixe se organiza a partir dele.',
      'Conte as camadas musculares antes de concluir — duas camadas sugerem outro órgão tubular.',
    ],
  },

  ovary: {
    panorama:
      'O ovário é revestido por um **epitélio germinativo** simples cúbico — nome histórico e enganoso, pois ele não origina os gametas — sob o qual há uma cápsula de conjuntivo denso, a túnica albugínea. O **córtex**, periférico, contém o estroma característico, muito celular e fusiforme, e os folículos em todos os estágios: primordiais em fila logo abaixo da albugínea, primários, secundários com antro e, eventualmente, um folículo maduro. A **medula**, central, é conjuntivo frouxo com vasos espiralados de calibre grande, sem folículos. Corpos lúteos e corpos albicantes, cicatrizes brancas de conjuntivo denso, registram as ovulações já ocorridas.',
    roteiro: [
      'Percorra a periferia contando estágios foliculares antes de olhar a medula.',
      'Distinga corpo lúteo de corpo albicante pela celularidade: o albicante é quase só colágeno.',
    ],
  },

  'ovary: corpus luteum': {
    panorama:
      'Depois da ovulação, o que sobra do folículo colapsa e se converte em uma glândula endócrina temporária. O **corpo lúteo** tem parede pregueada e duas populações derivadas das camadas do folículo: as **células granulosa-luteínicas**, grandes, centrais, pálidas e vacuoladas, que produzem principalmente progesterona, e as **células teca-luteínicas**, menores, mais escuras e periféricas, nas pregas. Ambas têm citoplasma de célula esteroidogênica — REL abundante, mitocôndrias de cristas tubulares, gotículas lipídicas —, e por isso ficam vacuoladas em H&E. Capilares invadem o antigo antro. Sem gravidez, involui em cerca de 14 dias e vira **corpo albicante**; com gravidez, o hCG o mantém por meses.',
    roteiro: [
      'Compare tamanho e cor das duas populações nas pregas para separá-las.',
      'Procure resquício de sangue ou fibrina no centro — o coágulo do antro ainda pode estar lá.',
    ],
  },

  'oviduct: ampulla': {
    panorama:
      'A ampola é o segmento mais largo da tuba uterina e onde normalmente ocorre a fecundação. Sua marca é a **mucosa exuberantemente pregueada**: dobras longitudinais altas e ramificadas que quase preenchem a luz, dando ao corte transversal um aspecto labiríntico. O epitélio é simples colunar com duas populações — **células ciliadas**, que batem em direção ao útero e movem o oócito, e **células secretoras** (em tacha), que nutrem o gameta e o embrião precoce; a proporção entre elas varia com o ciclo, com mais cílios sob estrogênio. A muscular é fina, em duas camadas, e a serosa cobre o órgão. Comparada ao istmo, a ampola tem pregas muito mais complexas e músculo mais delgado.',
    roteiro: [
      'Estime a complexidade das pregas: quanto mais ramificadas, mais próxima do infundíbulo.',
      'Procure a alternância de cílios no epitélio antes de descrever a fase do ciclo.',
    ],
  },

  'placenta: 1st trimester': {
    panorama:
      'A placenta do primeiro trimestre mostra vilosidades **grandes e pouco ramificadas**, com um revestimento duplo bem visível: o **sinciciotrofoblasto**, externo, uma camada contínua e multinucleada sem limites celulares, e o **citotrofoblasto** (células de Langhans), interno, cúbico e com contornos nítidos, que é a camada proliferativa. O eixo da vilosidade é mesênquima frouxo abundante, com vasos fetais ainda centrais e de pequeno calibre, e macrófagos próprios — as células de Hofbauer. A barreira entre sangue materno e fetal, portanto, é espessa: quatro camadas. Ao longo da gestação o citotrofoblasto rareia, o mesênquima diminui e os capilares migram para a periferia, afinando a barreira.',
    roteiro: [
      'Confirme a presença do citotrofoblasto contínuo — é ele que data o material como precoce.',
      'Observe a posição dos capilares no eixo: centrais no início, periféricos no termo.',
    ],
  },

  'trachea and primary bronchus': {
    panorama:
      'A traqueia e o brônquio principal compartilham o mesmo plano. A mucosa tem **epitélio pseudoestratificado colunar ciliado com células caliciformes** — o epitélio respiratório típico — sobre uma lâmina basal espessa e conspícua, seguida de lâmina própria rica em fibras elásticas. A submucosa aloja **glândulas seromucosas**, cujos ductos atravessam a mucosa. O esqueleto é uma série de anéis de **cartilagem hialina em C**, abertos posteriormente, e essa abertura é fechada pelo músculo traqueal liso e por conjuntivo denso — a parede membranácea, encostada no esôfago, que permite a passagem do bolo alimentar. A adventícia prende o órgão às estruturas vizinhas.',
    roteiro: [
      'Oriente o corte pela abertura do C: ela aponta para trás, para o esôfago.',
      'Localize as glândulas na submucosa — sua presença separa traqueia e brônquio de bronquíolo.',
    ],
  },

  bronchiole: {
    panorama:
      'O bronquíolo é definido por três ausências: **não tem cartilagem, não tem glândulas na submucosa e não tem placas ósseas** — e é justamente isso que o distingue do brônquio. Em compensação, a camada de **músculo liso** é proporcionalmente espessa e circunda toda a luz, o que explica por que a resistência das vias aéreas se concentra aqui e por que ele é o alvo da broncoconstrição na asma. O epitélio vai reduzindo de altura no trajeto: simples colunar ciliado nos maiores, simples cúbico nos terminais, com células caliciformes desaparecendo e sendo substituídas pelas **células club** (Clara), não ciliadas, de ápice em cúpula, que secretam surfactante proteico e detoxificam xenobióticos.',
    roteiro: [
      'Verifique a ausência de cartilagem antes de nomear — é o critério, não o calibre.',
      'Procure o ápice abaulado das células club no epitélio cúbico.',
    ],
    atencao:
      'A mucosa do bronquíolo costuma aparecer pregueada em festão por contração post-mortem do músculo liso; é artefato comum, não patologia.',
  },

  medulla: {
    panorama:
      'A medula renal é a metade interna do rim e sua histologia é ditada pelo **gradiente osmótico** que ela precisa manter. Não há corpúsculos renais aqui: o campo é feito de túbulos e vasos correndo paralelos em direção à papila, o que dá à medula um aspecto estriado inconfundível. Encontram-se as porções finas e espessas da **alça de Henle**, os **ductos coletores** — de células cúbicas a colunares pálidas, com limites intercelulares nítidos, o achado mais útil da região — e os **vasos retos**, capilares longos em alça que retiram água sem dissipar o gradiente. O interstício é mais abundante que no córtex e rico em glicosaminoglicanos.',
    roteiro: [
      'Confirme a ausência de glomérulos: é o que separa medula de córtex em qualquer aumento.',
      'Ache os ductos coletores pelos limites celulares visíveis e use-os para se orientar.',
    ],
    atencao:
      'Os raios medulares ficam dentro do córtex, apesar do nome; encontrá-los não significa que você está na medula.',
  },

  nucleolus: {
    panorama:
      'O nucléolo não é uma organela com membrana, e sim uma **região do núcleo** onde se concentra a maquinaria de fabricar ribossomos. Ele se organiza em torno das alças de DNA que carregam os genes de RNA ribossômico — as regiões organizadoras do nucléolo, presentes nos cromossomos acrocêntricos. Ao microscópio eletrônico distinguem-se três zonas: o **centro fibrilar**, o **componente fibrilar denso**, onde ocorre a transcrição do rRNA, e o **componente granular**, onde as subunidades ribossômicas se montam. Em H&E aparece como um corpúsculo redondo intensamente basófilo, e seu tamanho é um indicador direto de atividade: nucléolo grande e destacado significa síntese proteica intensa.',
    roteiro: [
      'Compare o tamanho do nucléolo entre células vizinhas para inferir quem está mais ativo.',
      'Note que ele desaparece na mitose e se reconstrói na telófase — sua ausência pode datar a fase.',
    ],
  },

  vestibule: {
    panorama:
      'O vestíbulo é a porção do labirinto que detecta **aceleração linear** e a posição da cabeça em relação à gravidade. Aloja duas dilatações do labirinto membranoso, o **utrículo** e o **sáculo**, cada uma com uma área sensorial chamada **mácula**. A mácula tem células ciliadas dos tipos I (em forma de garrafa, envolvidas por um cálice nervoso) e II (cilíndricas), mais células de sustentação. Sobre elas repousa a **membrana otolítica**, uma camada gelatinosa coberta de cristais de carbonato de cálcio, as **otocônias** — é a inércia desses cristais que desloca a membrana e inclina os estereocílios. As máculas do utrículo e do sáculo ficam em planos perpendiculares, cobrindo os dois eixos.',
    roteiro: [
      'Procure as otocônias: elas separam mácula de crista ampular imediatamente.',
      'Identifique o cálice nervoso em torno das células tipo I para diferenciá-las das tipo II.',
    ],
  },

  cochlea: {
    panorama:
      'A cóclea é um canal ósseo espiralado de duas voltas e meia em torno de um eixo central, o **modíolo**, por onde entram o nervo coclear e os vasos. Um corte no plano do modíolo mostra a espiral repetida várias vezes, e em cada perfil há três compartimentos: a **rampa vestibular** e a **rampa timpânica**, com perilinfa, e entre elas o **ducto coclear** (rampa média), com endolinfa, de secção triangular. O teto do ducto é a membrana vestibular (de Reissner); o assoalho é a membrana basilar, sobre a qual assenta o **órgão de Corti**; a parede externa é a estria vascular, epitélio vascularizado que produz a endolinfa.',
    roteiro: [
      'Conte os três espaços em cada perfil antes de procurar o órgão de Corti.',
      'Ache o gânglio espiral dentro do modíolo — é ele que confirma a orientação do corte.',
    ],
  },

  'stratum basale: melanocytes': {
    panorama:
      'O melanócito é uma célula da crista neural que migra para a epiderme e se instala na **camada basal**, entre os queratinócitos, sem fazer desmossomos com eles — por isso costuma aparecer como uma célula de citoplasma claro, com halo perinuclear e núcleo pequeno e escuro. Seus prolongamentos dendríticos, invisíveis em H&E mas evidentes em impregnação por prata ou DOPA, alcançam cerca de trinta queratinócitos das camadas basal e espinhosa, formando a **unidade epidérmico-melânica**. A melanina é fabricada em organelas próprias, os **melanossomos**, e transferida por citocrina para os queratinócitos, onde se posiciona como um capuz sobre o núcleo, protegendo o DNA da radiação ultravioleta.',
    roteiro: [
      'Procure o halo claro na fileira basal antes de tentar ver dendritos.',
      'Lembre que a cor da pele não depende do número de melanócitos, e sim do tamanho e da distribuição dos melanossomos.',
    ],
    atencao:
      'Célula clara na basal também pode ser célula de Langerhans ou de Merkel; sem marcação específica, a distinção é insegura.',
  },

  'stratum spinosum': {
    panorama:
      'A camada espinhosa é a mais espessa da epiderme viva e recebe esse nome de um artefato revelador: a retração do citoplasma no processamento afasta as células, mas elas permanecem presas nos pontos de **desmossomo**, e o que sobra são pontes visíveis — os "espinhos". Cada espinho corresponde a um desmossomo ancorado por dentro em feixes de filamentos de queratina, os **tonofilamentos**, que se condensam aqui. É essa malha que dá à epiderme sua resistência à tração e à abrasão; doenças que atacam as proteínas do desmossomo, como o pênfigo vulgar, dissolvem exatamente esta camada e formam bolhas intraepidérmicas. Células de Langerhans, apresentadoras de antígeno, habitam o meio do estrato.',
    roteiro: [
      'Confirme os espinhos em grande aumento — em pequeno aumento a camada só parece poligonal.',
      'Siga a transição para a camada granulosa procurando os primeiros grânulos de querato-hialina.',
    ],
  },

  'fenestrated capillaries': {
    panorama:
      'O capilar fenestrado tem endotélio perfurado por **fenestras** de 60 a 80 nm, poros circulares que atravessam a célula de lado a lado e, na maioria dos leitos, são fechados por um diafragma fino de glicoproteínas. A lâmina basal, ao contrário do que ocorre no capilar sinusoide, é **contínua**. Esse arranjo multiplica a permeabilidade a água e pequenos solutos sem deixar passar proteínas plasmáticas, e por isso ele aparece exatamente onde há troca intensa de fluido ou absorção rápida: glândulas endócrinas, mucosa intestinal, plexos coroides, corpo ciliar e glomérulo renal. No glomérulo as fenestras são maiores e **não têm diafragma**, o que faz parte da barreira de filtração.',
    roteiro: [
      'Só é possível confirmar fenestra em microscopia eletrônica; em luz, use a localização como pista.',
      'Verifique a lâmina basal: contínua no fenestrado, descontínua no sinusoide.',
    ],
  },

  'clusters of endocrine cells': {
    panorama:
      'Nem toda função endócrina mora em um órgão endócrino. Em vários tecidos, células produtoras de hormônio se agrupam em **ilhotas** dentro de um parênquima com outra função principal. O exemplo canônico são as **ilhotas de Langerhans**, cordões pálidos e ricamente capilarizados dispersos no pâncreas exócrino, contrastando com o ácino escuro em volta; produzem insulina (células beta, a maioria, centrais), glucagon (alfa, periféricas), somatostatina (delta) e polipeptídeo pancreático. O mesmo princípio aparece nas células intersticiais de Leydig do testículo, nas células justaglomerulares do rim e nos ninhos de células cromafins da suprarrenal — sempre a mesma assinatura: agrupamento pálido, sem ducto, colado em capilares.',
    roteiro: [
      'Procure a diferença de cor com o parênquima vizinho: a ilhota quase sempre é mais pálida.',
      'Confirme a ausência de ducto saindo do agrupamento antes de chamá-lo de endócrino.',
    ],
  },

  'spleen: white pulp': {
    panorama:
      'A polpa branca do baço é o compartimento imunológico do órgão, e sua organização segue a artéria. Cada artéria central é envolvida por um manguito de linfócitos T, a **bainha linfoide periarteriolar** (PALS); acoplados a ela aparecem **nódulos linfoides** de linfócitos B, com centro germinativo quando há resposta em curso. Em torno de tudo há a **zona marginal**, faixa de transição rica em macrófagos e linfócitos B de memória, onde o sangue chega e o antígeno é apresentado. Em H&E a polpa branca salta como ilhas basófilas em meio ao vermelho da polpa vermelha, e o achado que a identifica com segurança é a artéria central deslocada do centro do nódulo.',
    roteiro: [
      'Ache a arteríola central: sem ela, o agrupamento pode ser de outro órgão linfoide.',
      'Separe PALS de nódulo — território T e território B são adjacentes, não misturados.',
    ],
  },

  'testis overview': {
    panorama:
      'O testículo é envolvido pela **túnica albugínea**, conjuntivo denso que emite septos e o divide em cerca de 250 lóbulos; cada lóbulo contém de um a quatro **túbulos seminíferos** enovelados. O corte transversal mostra, portanto, dezenas de perfis tubulares e, entre eles, o **interstício** com as células de Leydig, vasos e linfáticos. Dentro do túbulo, o epitélio seminífero tem duas linhagens: as **células de Sertoli**, altas, do lâmina basal à luz, com núcleo pálido triangular e nucléolo proeminente, que sustentam e formam a barreira hematotesticular; e as **células germinativas** em maturação, dispostas em camadas da periferia para o centro — espermatogônias, espermatócitos, espermátides, espermatozoides.',
    roteiro: [
      'Separe compartimento tubular e intersticial antes de nomear qualquer célula.',
      'Ache o núcleo pálido com nucléolo grande das Sertoli — é seu ponto de referência dentro do túbulo.',
    ],
  },

  'epididymis: body and tail': {
    panorama:
      'Ao longo do epidídimo o mesmo ducto muda de proporções, e essas mudanças permitem localizar o segmento. Da cabeça para a cauda, o **epitélio vai ficando mais baixo** — de colunar alto com estereocílios longos a cúbico com estereocílios curtos — enquanto a **camada de músculo liso engrossa** progressivamente, chegando a três camadas na cauda, como no ducto deferente que se segue. A luz também aumenta e fica mais cheia de espermatozoides, porque a cauda é o principal reservatório antes da ejaculação. O corpo faz a transição entre os dois extremos; a maturação funcional do espermatozoide, incluindo a aquisição de motilidade, ocorre ao longo desse trajeto.',
    roteiro: [
      'Compare altura do epitélio com espessura do músculo: os dois variam em sentido oposto.',
      'Estime a quantidade de espermatozoides na luz — a cauda é a mais repleta.',
    ],
  },

  'uterus: menstrual phase (days 1-5)': {
    panorama:
      'A menstruação é o desfecho da queda de progesterona e estrogênio quando o corpo lúteo involui. As **artérias espiraladas** entram em vasoconstrição prolongada, a camada funcional isquemia e necrosa, e o relaxamento seguinte rompe as paredes já lesadas, provocando hemorragia e descamação. Na lâmina, o endométrio está fino e desorganizado: fragmentos de estroma colapsado, glândulas fragmentadas e colabadas, sangue, fibrina e infiltrado de neutrófilos, com superfície epitelial ausente em grande parte. A **camada basal**, irrigada pelas artérias retas, permanece intacta — é dela que parte a reepitelização, que começa antes mesmo de o sangramento cessar.',
    roteiro: [
      'Procure a basal preservada sob a área descamada: é o que garante que o achado é fisiológico.',
      'Não tente datar glândulas nesta fase — o colapso distorce a morfologia.',
    ],
  },

  vagina: {
    panorama:
      'A parede vaginal tem três camadas e nenhuma glândula — a lubrificação vem do muco cervical e do transudato vascular. A **mucosa** é epitélio estratificado pavimentoso **não queratinizado**, espesso, cujas células acumulam glicogênio sob ação estrogênica; esse glicogênio é fermentado a ácido lático pela flora de lactobacilos, mantendo o pH baixo que protege contra infecção. A lâmina própria é conjuntivo com muitas fibras elásticas e um plexo venoso rico. A **muscular** é músculo liso em feixes longitudinais e circulares entrelaçados, e a **adventícia** ancora o órgão às estruturas vizinhas. A mucosa forma rugas transversais que permitem grande distensão.',
    roteiro: [
      'Confirme a ausência de glândulas — é o achado negativo que define a vagina.',
      'Observe o clareamento citoplasmático das camadas superficiais: é glicogênio extraído no processamento.',
    ],
  },

  'interalveolar septum': {
    panorama:
      'O septo interalveolar é a parede compartilhada entre dois alvéolos e o lugar onde a hematose acontece. Sua espessura mínima é a **barreira ar-sangue**, com três componentes: o citoplasma delgado do **pneumócito tipo I**, as lâminas basais fundidas do epitélio e do endotélio, e o citoplasma do capilar contínuo — no total, cerca de 0,2 µm. O septo contém ainda uma rede capilar densa, fibras elásticas e reticulares que dão o recuo elástico da expiração, **pneumócitos tipo II** arredondados e vacuolados nos ângulos, produtores de surfactante e células de reserva do epitélio, e macrófagos alveolares. Os **poros de Kohn** o atravessam, permitindo ventilação colateral entre alvéolos.',
    roteiro: [
      'Procure o pneumócito tipo II nos cantos — ele é abaulado e destoa da parede lisa.',
      'Siga um capilar ao longo do septo para ver quantos alvéolos ele serve.',
    ],
    atencao:
      'Quase todo núcleo visível no septo é de capilar ou de tipo II; o tipo I cobre 95% da superfície mas quase nunca mostra o núcleo no corte.',
  },

  bronchus: {
    panorama:
      'O brônquio intrapulmonar difere da traqueia em pontos que a lâmina mostra bem. A cartilagem deixa de ser anel e vira **placas irregulares** que envolvem a via por todos os lados, acompanhando a mudança de tração exercida pelo parênquima. Entre a mucosa e a cartilagem aparece uma camada **completa de músculo liso** em espiral, que na traqueia só existia na parede posterior; sua contração post-mortem é o que deixa a mucosa pregueada em festão nos cortes. O epitélio segue pseudoestratificado ciliado com caliciformes, e ainda há **glândulas seromucosas** na submucosa — sua presença, junto com a cartilagem, é o que separa brônquio de bronquíolo.',
    roteiro: [
      'Procure placas de cartilagem, não anéis: a forma indica que você já está no pulmão.',
      'Confirme glândulas na submucosa antes de descartar bronquíolo.',
    ],
  },

  'bronchial blood vessels': {
    panorama:
      'O pulmão tem duas circulações e confundi-las é erro comum. As **artérias brônquicas** vêm da aorta, carregam sangue oxigenado sob pressão sistêmica e nutrem a parede das vias aéreas até os bronquíolos, a pleura visceral e o estroma; por isso têm parede espessa e luz relativamente pequena, típica de artéria muscular. As **artérias pulmonares** trazem sangue venoso do ventrículo direito para a hematose, operam sob pressão baixa e têm paredes finas para o calibre — acompanham sempre os brônquios lado a lado. As veias pulmonares, por sua vez, correm isoladas nos septos de conjuntivo, longe das vias aéreas, e esse trajeto solitário é a melhor pista para identificá-las.',
    roteiro: [
      'Veja o acompanhante: artéria colada no brônquio é pulmonar; vaso solitário no septo é veia pulmonar.',
      'Compare espessura de parede com calibre para separar brônquica de pulmonar.',
    ],
  },

  'pulmonary artery': {
    panorama:
      'A artéria pulmonar é do tipo elástico na origem e vai se tornando muscular à medida que se ramifica, mas em todo o trajeto sua parede é **desproporcionalmente fina** para o calibre, porque o circuito pulmonar trabalha com cerca de um quinto da pressão sistêmica. Na lâmina ela aparece sempre ao lado de um brônquio ou bronquíolo, formando a unidade broncovascular que é o melhor ponto de orientação em qualquer corte de pulmão. Comparada a uma artéria sistêmica de mesmo diâmetro, tem menos camadas de músculo liso e lâminas elásticas mais frouxas. Na hipertensão pulmonar, essa média se espessa e a artéria passa a parecer sistêmica — a alteração é justamente a perda dessa desproporção.',
    roteiro: [
      'Ache o brônquio primeiro; a artéria pulmonar estará imediatamente ao lado.',
      'Compare a razão parede/luz com a de uma artéria de outro órgão na mesma lâmina.',
    ],
  },

  'junctional complex': {
    panorama:
      'O complexo juncional é o conjunto de junções que aparece de modo estereotipado no ápice de epitélios, logo abaixo da borda livre, e cada componente tem uma função distinta. A **zônula de oclusão** (junção estreita) é a mais apical: fusiona as membranas de células vizinhas em cordões de claudinas e ocludinas, veda o espaço intercelular e cria a barreira que separa os compartimentos, além de impedir que proteínas de membrana migrem entre o domínio apical e o basolateral. Abaixo dela vem a **zônula de adesão**, cinturão que liga o citoesqueleto de actina de uma célula ao da vizinha por caderinas. Mais abaixo, os **desmossomos** ancoram filamentos intermediários em pontos isolados.',
    roteiro: [
      'Leia sempre de cima para baixo: oclusão, adesão, desmossomo — a ordem é constante.',
      'Em luz, procure a barra terminal, que é o complexo inteiro visto como uma linha densa apical.',
    ],
  },

  'simple, coiled tubular gland': {
    panorama:
      'Aqui "simples" indica ducto **não ramificado** e "tubular enovelada" descreve uma porção secretora em tubo único que se enrola sobre si mesma. A **glândula sudorípara écrina** é o exemplo clássico e o mais didático: seu novelo secretor fica na derme profunda ou na hipoderme, e um corte o mostra como um aglomerado de perfis tubulares cortados em vários ângulos. Nesse aglomerado convivem dois tipos de perfil — o secretor, de epitélio simples cúbico pálido com células claras e escuras, envolto por **células mioepiteliais**, e o ducto, de epitélio estratificado cúbico, mais escuro e de luz menor. O ducto sobe reto pela derme e atravessa a epiderme em espiral.',
    roteiro: [
      'Separe os dois calibres dentro do mesmo novelo: o mais escuro e estreito é ducto.',
      'Procure os núcleos achatados das mioepiteliais na periferia dos perfis secretores.',
    ],
  },

  'simple, branched acinar gland': {
    panorama:
      'Nesta configuração o **ducto é único** — daí "simples" — mas várias porções secretoras arredondadas desembocam nele, daí "ramificada". A **glândula sebácea** é o exemplo típico: vários ácinos desembocam num ducto curto que se abre no folículo piloso, formando a unidade pilossebácea. Suas células, os sebócitos, mostram um gradiente que conta a história inteira da secreção **holócrina**: na periferia ficam as células basais pequenas e basófilas, com núcleo íntegro; para o centro elas acumulam lipídio, o citoplasma vira uma espuma de vacúolos, o núcleo picnotiza e por fim a célula se rompe inteira, virando o próprio produto. O turnover completo leva cerca de duas a três semanas.',
    roteiro: [
      'Leia o ácino da periferia para o centro: o gradiente de vacuolização é o achado diagnóstico.',
      'Ache o ducto curto ligando o ácino ao folículo piloso para confirmar a unidade pilossebácea.',
    ],
  },

  'connective tissue proper classification overview': {
    panorama:
      'Classificar o conjuntivo propriamente dito é um exercício de duas perguntas em sequência. Primeiro: **quanta fibra existe** em relação a células e substância fundamental? Pouca fibra e muita célula é **frouxo**; fibra dominando o campo é **denso**. Segundo, se for denso: **as fibras seguem uma direção só?** Se sim, é denso **modelado** — tendões, ligamentos e aponeuroses, feitos para tração num eixo único, com fibrócitos comprimidos em fileiras entre os feixes. Se as fibras se cruzam em todos os planos, é denso **não modelado**, como na derme reticular, nas cápsulas de órgãos e na submucosa, resistindo a estiramento vindo de qualquer direção. Variantes especiais — reticular, elástico, mucoso — completam o quadro.',
    roteiro: [
      'Responda as duas perguntas nessa ordem; pular a primeira leva a erro sistemático.',
      'Use a orientação dos núcleos como pista da direção dos feixes quando o colágeno estiver muito acidófilo.',
    ],
  },

  'pseudounipolar neuron': {
    panorama:
      'O neurônio pseudounipolar tem um único prolongamento saindo do corpo celular, que logo se bifurca em T: um ramo periférico, que vai até o receptor, e um ramo central, que entra no sistema nervoso central. Os dois se comportam como axônios — conduzem potencial de ação e são mielinizados —, e o impulso vai do periférico ao central **sem passar pelo corpo celular**, que fica de lado, como um apoio metabólico. Ele começa bipolar no embrião e os dois prolongamentos se fundem, daí o "pseudo". É a célula sensorial por excelência: povoa os **gânglios da raiz dorsal** e os gânglios sensoriais de nervos cranianos, onde aparece como corpos grandes e redondos cercados por células satélites.',
    roteiro: [
      'Procure o anel de células satélites em volta do corpo — é a marca do gânglio sensorial.',
      'Compare com o gânglio autonômico: lá os corpos são menores, irregulares e mais espaçados.',
    ],
  },

  oligodendrocytes: {
    panorama:
      'O oligodendrócito é a glia mielinizante do sistema nervoso central. Diferentemente da célula de Schwann, que envolve **um único** internódulo de um único axônio, ele emite vários prolongamentos e mieliniza **dezenas de axônios ao mesmo tempo** — o que explica por que a lesão de um oligodendrócito desmieliniza muitas fibras e por que a remielinização no SNC é tão limitada. Em H&E aparece como um núcleo pequeno, redondo e denso, com halo claro em torno (artefato de processamento), disposto em fileiras entre os feixes de axônios da substância branca; no córtex, também aparece como célula satélite encostada em corpos de neurônios. Não produz lâmina basal, ao contrário da célula de Schwann.',
    roteiro: [
      'Procure fileiras interfasciculares na substância branca antes de tentar reconhecer a célula isolada.',
      'Use o halo perinuclear como pista, sabendo que é artefato e não estrutura.',
    ],
  },

  meninges: {
    panorama:
      'As meninges são três camadas de conjuntivo que envolvem encéfalo e medula. A **dura-máter**, externa, é densa e espessa, com feixes colágenos organizados; no crânio adere ao osso e faz as vezes de periósteo interno, e desdobra-se para formar os seios venosos. A **aracnoide**, intermediária, tem uma lâmina justaposta à dura e uma rede de trabéculas que atravessam o **espaço subaracnóideo**, preenchido por líquido cefalorraquidiano e percorrido pelos vasos de superfície; suas granulações drenam o líquor para os seios. A **pia-máter**, interna, é delicada, muito vascularizada e acompanha intimamente todos os relevos do órgão, mergulhando nos sulcos, o que a dura e a aracnoide não fazem.',
    roteiro: [
      'Identifique qual camada acompanha os sulcos: só a pia entra neles.',
      'Localize o espaço subaracnóideo pelas trabéculas — é o único espaço real dos três.',
    ],
    atencao:
      'O espaço subdural é, em condições normais, virtual; sua aparência de fenda no corte costuma ser retração do processamento.',
  },

  interphase: {
    panorama:
      'A intérfase é o intervalo entre duas mitoses e ocupa mais de 90% da vida da célula — não é "repouso", e sim o período de maior atividade metabólica. Divide-se em **G1**, de crescimento e síntese de proteínas e organelas, com o ponto de restrição que decide se a célula prossegue; **S**, em que o DNA é replicado e cada cromossomo passa a ter duas cromátides irmãs; e **G2**, de preparo final, checagem de erros e duplicação dos centrossomos. Na lâmina, a intérfase se reconhece pelo núcleo com envoltório íntegro, cromatina dispersa e nucléolo visível — exatamente o oposto do que se vê em qualquer fase mitótica.',
    roteiro: [
      'Confirme envoltório nuclear e nucléolo: sua presença exclui todas as fases da mitose.',
      'Estime a proporção de células em intérfase no campo — ela indica o índice mitótico do tecido.',
    ],
  },

  prophase: {
    panorama:
      'A prófase é a fase em que a célula desmonta o núcleo e monta o fuso. A cromatina, replicada em S, **condensa** progressivamente até que os cromossomos se tornem individualizáveis, cada um com duas cromátides unidas pelo centrômero. O nucléolo se desfaz, os centrossomos migram para polos opostos organizando microtúbulos, e ao final — na chamada prometáfase — o **envoltório nuclear se fragmenta**, permitindo que os microtúbulos alcancem os cinetocoros. Em H&E, a prófase aparece como um núcleo cujo conteúdo ficou grosseiro e granular, ainda contido, e a perda do nucléolo é a pista mais precoce e confiável.',
    roteiro: [
      'Procure cromatina grumosa dentro de um contorno nuclear ainda reconhecível.',
      'Compare com uma intérfase vizinha: a diferença de textura da cromatina é o achado.',
    ],
  },

  metaphase: {
    panorama:
      'Na metáfase os cromossomos atingem a condensação máxima e se alinham num único plano equatorial, a **placa metafásica**, mantidos ali pelo equilíbrio de tração dos microtúbulos cinetocóricos vindos dos dois polos. É a fase mais fácil de reconhecer em qualquer preparação, e por isso a mais usada em citogenética: bloqueia-se a célula aqui com colchicina, que impede a polimerização do fuso, para montar o cariótipo. O ponto de checagem do fuso só permite a passagem para anáfase quando **todos** os cinetocoros estiverem corretamente ligados — a salvaguarda que evita distribuição desigual de cromossomos.',
    roteiro: [
      'Procure a faixa densa e retilínea de cromatina no meio da célula, sem envoltório em volta.',
      'Gire o foco: em outro plano a mesma placa pode aparecer de face, como um disco.',
    ],
  },

  telophase: {
    panorama:
      'A telófase desfaz tudo o que a prófase montou. Os dois conjuntos de cromátides já separados chegam aos polos, começam a **descondensar**, o envoltório nuclear se reconstrói em torno de cada um a partir de fragmentos do retículo, e os nucléolos reaparecem. Simultaneamente, o anel contrátil de actina e miosina II aperta a região equatorial e produz o **sulco de clivagem**, completando a citocinese e separando os dois citoplasmas. Na lâmina, a telófase aparece como duas massas de cromatina ainda grosseiras, próximas, com a célula estrangulada no meio — muitas vezes ainda unidas por uma ponte citoplasmática estreita, o corpo intermediário.',
    roteiro: [
      'Procure a constrição no equador junto de duas massas de cromatina descondensando.',
      'Diferencie de anáfase pelo reaparecimento do contorno nuclear.',
    ],
  },

  'nuclear envelope': {
    panorama:
      'O envoltório nuclear é feito de **duas membranas** separadas por uma cisterna perinuclear de 20 a 40 nm; a externa é contínua com o retículo endoplasmático rugoso e tem ribossomos na face citosólica, e a interna é forrada pela **lâmina nuclear**, uma malha de filamentos intermediários de laminas A, B e C que dá forma ao núcleo e ancora a cromatina. As duas membranas se fundem em milhares de **poros nucleares**, cada um com um complexo proteico octogonal que faz o transporte seletivo: difusão livre para moléculas pequenas, transporte ativo mediado por sinais para proteínas e RNAs. A fosforilação das laminas na prófase desmonta o envoltório; a desfosforilação na telófase o remonta.',
    roteiro: [
      'Em microscopia eletrônica, confirme as duas membranas antes de chamar de envoltório.',
      'Procure os poros como interrupções onde as membranas se continuam uma na outra.',
    ],
  },

  centrioles: {
    panorama:
      'O centríolo é um cilindro de aproximadamente 0,2 por 0,5 µm formado por **nove trincas de microtúbulos** dispostas em roda, sem microtúbulo central. Eles ocorrem aos pares e perpendiculares entre si, e o par mais o material pericentriolar em volta constitui o **centrossomo**, principal centro organizador de microtúbulos da célula. Duplicam-se na fase S e migram para polos opostos, organizando o fuso mitótico. Em células que precisam de cílios, os centríolos se multiplicam e migram para o ápice, onde cada um vira o **corpúsculo basal** de um cílio — e é por isso que o axonema tem nove pares periféricos, herdados das trincas do corpúsculo basal.',
    roteiro: [
      'Confirme o padrão 9x3 em corte transversal; em corte longitudinal só aparecem duas barras densas.',
      'Procure o par perpendicular: a disposição em L é a assinatura do centrossomo.',
    ],
  },

  polarity: {
    panorama:
      'A polaridade é a propriedade que define o epitélio: a célula tem domínios de membrana funcionalmente distintos e não intercambiáveis. O **domínio apical** volta-se para a luz ou para o exterior e carrega as especializações de superfície — microvilosidades, estereocílios, cílios — e os transportadores de captação. O **domínio basolateral** olha para o conjuntivo e concentra as bombas de sódio e potássio, os receptores hormonais e as moléculas de adesão. As **junções estreitas** separam fisicamente os dois domínios, impedindo a difusão lateral de proteínas de membrana entre eles — é a existência dessa cerca molecular que torna possível o transporte vetorial, isto é, mover substâncias em um sentido só.',
    roteiro: [
      'Ache a lâmina basal para orientar o eixo antes de descrever qualquer especialização.',
      'Confirme que a especialização observada está mesmo no ápice — polaridade invertida é sinal de corte oblíquo.',
    ],
  },

  lumen: {
    panorama:
      'A luz é o espaço interno de qualquer estrutura tubular ou acinar, e reconhecê-la é o primeiro passo para orientar um corte. Sua importância é topológica: o conteúdo da luz está, em rigor, **fora** do corpo — o tubo digestório é um cilindro externo atravessando o organismo, e o epitélio que o forra é a fronteira real. Em consequência, tudo o que entra precisa atravessar uma célula epitelial. Na lâmina, o calibre, o contorno e o conteúdo da luz ajudam a identificar o órgão: luz estrelada indica parede muscular contraída, luz ampla e vazia sugere veia ou ducto excretor, luz repleta de secreção aponta glândula ativa.',
    roteiro: [
      'Use a luz para definir o ápice das células e, a partir dele, ler o resto da parede.',
      'Descreva o conteúdo luminal: ele costuma identificar o órgão melhor que o epitélio isolado.',
    ],
    atencao:
      'Nem todo espaço claro é luz: retração de processamento cria fendas artificiais entre camadas.',
  },

  eyelid: {
    panorama:
      'A pálpebra é um bom exemplo de órgão em que muitos tecidos se organizam numa lâmina só. A face externa é **pele fina**, com pelos, glândulas sebáceas e sudoríparas; a face interna é a **conjuntiva palpebral**, mucosa de epitélio estratificado colunar com células caliciformes. Entre elas está o **tarso**, placa de conjuntivo denso que dá rigidez e aloja as **glândulas de Meibômio** — sebáceas grandes, com ácinos alinhados desembocando num ducto único na margem —, cuja secreção lipídica retarda a evaporação da lágrima. Há ainda o músculo orbicular, esquelético, e, na margem, os cílios com as glândulas de Zeis (sebáceas) e de Moll (sudoríparas apócrinas).',
    roteiro: [
      'Oriente-se pelas duas superfícies: pele de um lado, conjuntiva do outro.',
      'Ache o tarso e siga os ácinos de Meibômio até o ducto na margem livre.',
    ],
  },

  'globe: lens': {
    panorama:
      'O cristalino é uma estrutura epitelial pura, sem vasos e sem nervos, e mantém a transparência por causa disso. Tem três partes: a **cápsula**, uma lâmina basal muito espessa e elástica que o envolve por inteiro; o **epitélio subcapsular**, simples cúbico, presente só na face anterior; e as **fibras do cristalino**, células alongadas, hexagonais em corte transversal, que perderam núcleo e organelas e se encheram de **cristalinas**, proteínas de arranjo regular que evitam o espalhamento de luz. As células do equador continuam se diferenciando em fibras a vida inteira, empilhando camadas sobre as antigas — como o cristalino não descarta nada, ele endurece com a idade, o que explica a presbiopia e, com a agregação das cristalinas, a catarata.',
    roteiro: [
      'Confirme que o epitélio só existe na face anterior — isso orienta o corte.',
      'Procure a perda de núcleos em direção ao centro para ver o gradiente de diferenciação.',
    ],
  },

  'cochlea: innervation': {
    panorama:
      'A informação auditiva sai da cóclea por neurônios **bipolares** cujos corpos formam o **gânglio espiral**, alojado no canal de Rosenthal dentro do modíolo — uma disposição incomum, já que quase todo gânglio sensorial é pseudounipolar. Os prolongamentos periféricos atravessam a lâmina espiral óssea e chegam às células ciliadas do órgão de Corti; os centrais formam o nervo coclear e vão aos núcleos cocleares do tronco. Cerca de 90 a 95% dessas fibras aferentes inervam as **células ciliadas internas**, que são as verdadeiras transdutoras; as **externas**, muito mais numerosas, recebem principalmente inervação eferente e funcionam como amplificador mecânico ativo, ajustando a sintonia.',
    roteiro: [
      'Ache o gânglio espiral no modíolo e siga as fibras até a lâmina espiral.',
      'Separe uma fileira interna de três externas no órgão de Corti antes de falar em inervação.',
    ],
  },

  'stratum basale': {
    panorama:
      'A camada basal é a única camada proliferativa da epiderme: uma fileira de células cúbicas a colunares apoiadas na lâmina basal por **hemidesmossomos**, com citoplasma basófilo pelos ribossomos e queratinas 5 e 14. Dela saem todos os queratinócitos que migrarão para a superfície ao longo de cerca de quatro semanas, e nela residem também os **melanócitos**, os **discos de Merkel** e os precursores que repovoam a epiderme após lesão. Nem toda célula basal se divide continuamente: há células-tronco propriamente ditas, de ciclo lento, e células amplificadoras transitórias, que fazem a maior parte das mitoses. É por isso que figuras de mitose na epiderme normal se concentram aqui e em nenhum outro lugar.',
    roteiro: [
      'Procure mitoses: encontrá-las acima da basal em pele normal é achado a explicar.',
      'Note a basofilia da fileira basal contra o citoplasma mais claro do espinhoso.',
    ],
  },

  'eccrine sweat gland': {
    panorama:
      'A glândula sudorípara écrina é tubular simples enovelada, distribuída por quase toda a pele e responsável pela termorregulação. O **novelo secretor**, na derme profunda ou na hipoderme, tem epitélio simples cúbico com duas populações — **células claras**, que produzem o componente aquoso e assentam sobre canalículos intercelulares, e **células escuras**, que secretam glicoproteínas — envolvidas por **células mioepiteliais** contráteis. O **ducto** é revestido por duas camadas de células cúbicas, o que o torna mais escuro e de luz menor que o segmento secretor; ao longo dele o sódio é reabsorvido, e por isso o suor que chega à superfície é hipotônico. O trecho intraepidérmico do ducto é espiralado e não tem parede própria.',
    roteiro: [
      'Separe os perfis do novelo em dois grupos pelo número de camadas: uma é secretor, duas é ducto.',
      'Compare com a glândula apócrina da axila — lá a luz do segmento secretor é muito mais ampla.',
    ],
  },

  arteriole: {
    panorama:
      'A arteríola é o vaso de resistência: seu calibre pequeno e sua musculatura proporcionalmente espessa fazem dela o principal determinante da pressão arterial sistêmica. Define-se, na prática, por ter **uma a três camadas** de músculo liso circular na média e diâmetro abaixo de 100 µm. A íntima é reduzida a endotélio e uma lâmina elástica interna delgada, que costuma desaparecer nas arteríolas menores; a adventícia é escassa e se confunde com o conjuntivo vizinho. Sua contração é regulada por inervação simpática e por metabólitos locais, e é ali que se decide quanto sangue cada leito capilar recebe. A metarteríola, o último segmento, tem músculo descontínuo e dá origem aos esfíncteres pré-capilares.',
    roteiro: [
      'Conte as camadas musculares: mais de três já sugere artéria muscular pequena.',
      'Compare com a vênula acompanhante — a diferença de espessura de parede é gritante.',
    ],
  },

  venule: {
    panorama:
      'A vênula recolhe o sangue do leito capilar e é, funcionalmente, o segmento mais importante da inflamação. As **vênulas pós-capilares**, as menores, têm apenas endotélio e pericitos, sem músculo liso, e é através da parede delas que ocorre a diapedese de leucócitos e o extravasamento de plasma quando histamina e outros mediadores abrem as junções endoteliais. À medida que aumentam de calibre, ganham uma ou duas camadas descontínuas de músculo liso e passam a **vênulas musculares**. Em qualquer aumento, a vênula se distingue da arteríola acompanhante pela luz maior e irregular, parede fina e contorno frequentemente colabado.',
    roteiro: [
      'Compare sempre em par: no mesmo campo, a de parede fina e luz ampla é a vênula.',
      'Procure leucócitos aderidos ao endotélio — sinal de vênula pós-capilar em atividade.',
    ],
  },

  'high endothelial venules': {
    panorama:
      'As vênulas de endotélio alto são uma exceção anatômica com função imunológica precisa: em vez do endotélio pavimentoso habitual, têm células **cúbicas a colunares**, com núcleos volumosos que fazem a luz parecer estrelada. Localizam-se no paracórtex dos linfonodos, nas tonsilas e nas placas de Peyer, e é por elas que o linfócito circulante deixa o sangue e entra no órgão linfoide — o processo de recirculação (homing), mediado por adressinas no endotélio e selectinas no linfócito. Encontrá-las em um corte é praticamente diagnóstico de tecido linfoide secundário, e frequentemente há linfócitos flagrados no meio da parede, em pleno trânsito.',
    roteiro: [
      'Procure endotélio alto num vaso de parede fina — a combinação é única.',
      'Procure linfócitos entre as células endoteliais: é a diapedese registrada no corte.',
    ],
  },

  'medium vein': {
    panorama:
      'A veia de médio calibre acompanha a artéria muscular correspondente e mostra, lado a lado, o contraste que define o sistema venoso. A **íntima** é fina, com endotélio e pouco subendotélio; a **média** tem apenas algumas camadas de músculo liso circular, muito mais delgada que a da artéria de mesmo diâmetro; e a **adventícia**, ao contrário, é a camada mais espessa, feita de colágeno longitudinal e com vasa vasorum. Nos membros, sobretudo abaixo do coração, aparecem **válvulas**: pregas de íntima em par, voltadas para o coração, que impedem o refluxo e transformam a contração muscular em bomba. Sua incompetência é a base das varizes.',
    roteiro: [
      'Compare com a artéria do feixe: a razão entre média e adventícia é invertida nas duas.',
      'Procure as pregas valvares na luz antes de concluir que o vaso é artéria colabada.',
    ],
  },

  myocardium: {
    panorama:
      'O miocárdio é a camada média e funcional da parede cardíaca, feita de cardiomiócitos organizados em feixes espiralados que envolvem as câmaras. As células são **estriadas**, ramificadas, com **um a dois núcleos centrais** — e não periféricos, como no esquelético —, unidas topo a topo por **discos intercalares**, que em H&E aparecem como linhas transversais escuras. O disco reúne três junções: desmossomos e fáscias de adesão, que transmitem força mecânica, e **junções comunicantes**, que acoplam eletricamente as células e permitem que o miocárdio se comporte como sincício funcional. Entre as fibras corre um endomísio riquíssimo em capilares — a densidade capilar é quase de um por fibra — e o citoplasma é cheio de mitocôndrias.',
    roteiro: [
      'Confirme núcleo central e ramificação antes de chamar de cardíaco.',
      'Ache os discos intercalares em corte longitudinal; em corte transversal eles não aparecem.',
    ],
  },

  'purkinje fibers': {
    panorama:
      'As fibras de Purkinje são cardiomiócitos **modificados para conduzir**, não para contrair, e sua aparência reflete essa troca: são células **maiores** que as contráteis comuns, com poucas miofibrilas deslocadas para a periferia e um citoplasma central pálido e abarrotado de **glicogênio**, o que dá o aspecto vacuolado e claro em H&E. Ficam logo abaixo do endocárdio, geralmente em grupos, e conduzem o impulso muito mais rápido que o miocárdio comum, distribuindo-o ao ápice e às paredes ventriculares de modo praticamente simultâneo. Elas se acoplam às células contráteis por junções comunicantes e são o último elo do sistema de condução.',
    roteiro: [
      'Procure células grandes e claras logo sob o endocárdio — a posição é parte do diagnóstico.',
      'Compare o tamanho com o do miocárdio adjacente no mesmo campo.',
    ],
    atencao:
      'A palidez é glicogênio, não degeneração; interpretá-la como lesão é o erro clássico nesta lâmina.',
  },

  'tongue: circumvallate papillae': {
    panorama:
      'As papilas circunvaladas são as maiores e as menos numerosas — de sete a doze, alinhadas em V no sulco terminal da língua. Cada uma é uma elevação larga **circundada por um sulco profundo**, e é nas paredes laterais desse sulco, e não no topo, que se alojam centenas de **botões gustativos**: estruturas ovoides pálidas, atravessando toda a espessura do epitélio, com células gustativas, de sustentação e basais, abrindo-se por um poro. No fundo do sulco desembocam os ductos das **glândulas serosas de von Ebner**, cuja secreção aquosa lava continuamente o sulco e renova o estímulo — sem esse enxágue, o sabor persistiria e a papila ficaria saturada.',
    roteiro: [
      'Procure o sulco antes das papilas gustativas: os botões estão na parede, não no topo.',
      'Siga os ductos até as glândulas serosas na base — elas fazem parte do conjunto funcional.',
    ],
  },

  'mucosa: intestinal glands': {
    panorama:
      'As glândulas intestinais, ou **criptas de Lieberkühn**, são invaginações tubulares simples que descem da superfície até a muscular da mucosa e existem tanto no delgado quanto no grosso. São o compartimento proliferativo do intestino: na porção média ficam as **células-tronco** e as mitoses, e delas saem, migrando para cima, os enterócitos e as caliciformes, que descamam no ápice da vilosidade em três a cinco dias — um dos turnovers mais rápidos do corpo. No fundo da cripta, migrando para baixo, ficam as **células de Paneth**, com grânulos apicais intensamente acidófilos, que secretam lisozima e defensinas e controlam a flora. Espalhadas, há células enteroendócrinas de grânulos basais.',
    roteiro: [
      'Localize as mitoses na metade da cripta para confirmar o compartimento proliferativo.',
      'Desça até o fundo e procure os grânulos vermelhos das células de Paneth.',
    ],
  },

  'recto-anal junction': {
    panorama:
      'A junção reto-anal concentra, em poucos milímetros, uma sequência de transições que faz dela uma lâmina clássica. O epitélio muda de **simples colunar** com criptas, típico do reto, para **estratificado pavimentoso não queratinizado** na zona de transição anal e, por fim, para **estratificado pavimentoso queratinizado** com anexos cutâneos na pele perianal. As criptas param abruptamente na linha pectínea. A muscular da mucosa se desfaz, a submucosa aloja um plexo venoso hemorroidário volumoso, e a camada circular interna da muscular externa se espessa formando o **esfíncter anal interno**, de músculo liso, envolvido mais externamente pelo esfíncter externo, esquelético e voluntário.',
    roteiro: [
      'Percorra o epitélio da esquerda para a direita marcando cada transição em ordem.',
      'Ache os dois esfíncteres e confirme o tipo de músculo de cada um — é o que explica a continência.',
    ],
  },

  'individual endocrine cells': {
    panorama:
      'Além das glândulas e das ilhotas, há células endócrinas **isoladas** dispersas dentro de epitélios, formando o que se chamou de sistema neuroendócrino difuso. No tubo digestório e nas vias respiratórias, as **células enteroendócrinas** ficam intercaladas entre as demais, com base larga apoiada na lâmina basal e grânulos concentrados justamente nessa base — orientação inversa à da célula exócrina, porque a secreção vai para o capilar e não para a luz. São mais de uma dezena de tipos, cada um com seu produto: gastrina, secretina, colecistocinina, GIP, motilina, serotonina, somatostatina. Em H&E passam despercebidas ou aparecem como células claras; prata e imuno-histoquímica as revelam.',
    roteiro: [
      'Procure células mais claras na base do epitélio, sem contato com a luz.',
      'Lembre da polaridade invertida dos grânulos — é o que distingue endócrina de exócrina no mesmo epitélio.',
    ],
  },

  'pars nervosa': {
    panorama:
      'A pars nervosa não é glândula: é tecido nervoso, e sua histologia mostra isso claramente. O campo é **fibrilar e pálido**, sem cordões celulares e com poucos núcleos, porque a maior parte do volume é feita de axônios amielínicos vindos dos núcleos supraóptico e paraventricular do hipotálamo pelo trato hipotálamo-hipofisário. Os únicos núcleos abundantes pertencem aos **pituícitos**, células gliais de sustentação. Espalhados pelo tecido aparecem os **corpos de Herring**, dilatações acidófilas dos terminais axônicos onde ocitocina e ADH ficam armazenados ligados a neurofisinas até serem liberados no leito capilar. Nada é sintetizado aqui — a pars nervosa apenas estoca e libera.',
    roteiro: [
      'Compare com a pars distalis no mesmo corte: a diferença de densidade nuclear é imediata.',
      'Procure os corpos de Herring como manchas rosadas amorfas entre as fibras.',
    ],
  },

  'adrenal gland': {
    panorama:
      'A suprarrenal são dois órgãos endócrinos fundidos, com origens diferentes. O **córtex**, derivado do mesoderma, produz esteroides e se organiza em três zonas concêntricas: **glomerulosa**, externa, em ninhos arredondados, que faz aldosterona sob controle do sistema renina-angiotensina; **fasciculada**, média e mais espessa, em cordões radiais de células muito vacuoladas — os espongiócitos, cheios de lipídio — que faz cortisol sob ACTH; e **reticular**, interna, em cordões anastomosados de células menores e mais escuras, com lipofuscina, que faz andrógenos fracos. A **medula**, derivada da crista neural, é formada por células cromafins — neurônios simpáticos pós-ganglionares modificados — que liberam adrenalina e noradrenalina direto na circulação.',
    roteiro: [
      'Percorra do exterior para o interior nomeando as três zonas corticais antes de chegar à medula.',
      'Use a vacuolização como guia: a fasciculada é a mais clara de todas.',
    ],
  },

  'adrenal cortex': {
    panorama:
      'O córtex da suprarrenal ilustra melhor que qualquer outro tecido a morfologia da célula esteroidogênica. Como esteroides não são estocados em grânulos, a célula não tem RER abundante nem grânulos de secreção; em vez disso tem **retículo endoplasmático liso** extenso, **mitocôndrias com cristas tubulares** — e não lamelares — que abrigam enzimas da via, e **gotículas lipídicas** de colesterol esterificado, o precursor. Essas gotículas são dissolvidas no processamento e deixam o citoplasma vacuolado e espumoso, aspecto máximo na zona fasciculada. As três zonas diferem também na maquinaria enzimática, e é isso que explica por que cada uma produz uma classe distinta de hormônio a partir do mesmo colesterol.',
    roteiro: [
      'Ligue a vacuolização à função: onde há mais lipídio, há mais síntese de esteroide.',
      'Confirme as cristas tubulares em microscopia eletrônica antes de generalizar a partir do H&E.',
    ],
  },

  'pineal gland': {
    panorama:
      'A pineal é uma pequena projeção do teto do diencéfalo que traduz informação luminosa em sinal hormonal. Seu parênquima é feito de **pinealócitos**, células de núcleo grande e pálido com prolongamentos que terminam em bulbos junto aos capilares, produtoras de **melatonina** a partir da serotonina, com pico noturno; a via que os controla vem da retina pelo núcleo supraquiasmático e pelo simpático cervical superior. Entre eles há astrócitos modificados, de núcleo menor e mais escuro. A marca histológica clássica são os **corpos arenáceos** (areia cerebral), concreções de fosfato e carbonato de cálcio em camadas concêntricas que se acumulam com a idade e servem de ponto de referência radiológico.',
    roteiro: [
      'Procure a areia cerebral: sua presença praticamente identifica o órgão.',
      'Separe pinealócito de glia pelo tamanho e pela palidez do núcleo.',
    ],
  },

  'secondary lymphoid nodule': {
    panorama:
      'O nódulo linfoide secundário é um nódulo primário que **encontrou antígeno** e entrou em resposta. Sua marca é o **centro germinativo**: uma região central pálida, formada por linfócitos B em proliferação (centroblastos e centrócitos), macrófagos de corpo tingível — que fagocitam os B que falharam na seleção e por isso têm restos nucleares no citoplasma — e células dendríticas foliculares, que apresentam o antígeno. Em volta há o **manto**, escuro e denso, de linfócitos B pequenos e virgens comprimidos pela expansão central. É nesse centro que ocorrem a hipermutação somática e a troca de classe de imunoglobulina — o processo que aumenta a afinidade do anticorpo.',
    roteiro: [
      'Procure o contraste claro/escuro entre centro e manto: é o que define o nódulo como secundário.',
      'Ache os macrófagos de corpo tingível como espaços claros salpicados no centro.',
    ],
  },

  thymus: {
    panorama:
      'O timo é órgão linfoide **primário**: é nele que os linfócitos T amadurecem e passam pela seleção positiva e negativa. Uma cápsula emite septos que dividem o órgão em lóbulos incompletos, cada um com **córtex** periférico, escuro pela densidade enorme de timócitos imaturos, e **medula** central, mais clara porque tem menos linfócitos e mais células epiteliorreticulares. Estas últimas formam o estroma — o timo não tem estroma de fibras reticulares como os demais órgãos linfoides — e, na medula, se organizam em camadas concêntricas queratinizadas, os **corpúsculos de Hassall**, achado exclusivo do órgão. Não há nódulos nem centros germinativos, e o córtex é isolado do sangue pela barreira hematotímica.',
    roteiro: [
      'Confirme a ausência de centros germinativos — é o que separa timo de linfonodo.',
      'Ache um corpúsculo de Hassall na medula para fechar a identificação.',
    ],
  },

  'placenta: 3rd trimester': {
    panorama:
      'No termo, a placenta mostra o resultado de nove meses de remodelação voltada para a eficiência das trocas. As vilosidades são **numerosas, pequenas e muito ramificadas**, o oposto das poucas e grossas do primeiro trimestre. O **citotrofoblasto** praticamente desapareceu como camada contínua, restando células isoladas, de modo que o revestimento é quase só sinciciotrofoblasto — e este se adelgaça e concentra os núcleos em aglomerados, os **nós sinciciais**. O mesênquima do eixo diminuiu e os **capilares fetais migraram para a periferia**, encostando na membrana. O conjunto reduz a barreira materno-fetal de quatro camadas para pouco mais de duas. Depósitos de fibrinoide e focos de calcificação são achados normais nessa idade.',
    roteiro: [
      'Compare o número e o calibre das vilosidades com uma lâmina de primeiro trimestre.',
      'Procure os nós sinciciais e a posição periférica dos capilares para datar o material.',
    ],
  },

  'breast: pregnancy': {
    panorama:
      'Na gravidez a mama passa de um órgão predominantemente adiposo e fibroso para um órgão glandular. Sob ação de estrogênio, progesterona, prolactina e lactogênio placentário, os ductos terminais **proliferam e brotam ácinos**, de modo que os lóbulos crescem e passam a ocupar o espaço antes tomado por conjuntivo e gordura — a lâmina do segundo e terceiro trimestres mostra lóbulos expandidos e septos comprimidos, reduzidos a faixas finas. As células acinares ganham RER e Golgi, e no fim da gestação já acumulam gotículas lipídicas e produzem colostro. Linfócitos e plasmócitos infiltram o estroma intralobular e são a fonte da IgA secretora que passará para o leite.',
    roteiro: [
      'Compare a área de lóbulo com a de estroma: essa razão é o que data o estágio.',
      'Procure plasmócitos no estroma intralobular — eles fazem parte do quadro normal aqui.',
    ],
  },

  'breast: lactation': {
    panorama:
      'A mama em lactação mostra os ácinos em plena atividade, e o achado mais característico é a **heterogeneidade** entre eles: alguns aparecem distendidos, com luz ampla cheia de secreção eosinófila e vacúolos lipídicos, enquanto os vizinhos estão colapsados e com epitélio alto — porque a secreção e o esvaziamento não são sincronizados. As células acinares mostram os dois mecanismos de secreção operando lado a lado: a proteína do leite sai por **merócrina**, em vesículas que se fundem com a membrana, e o lipídio sai por **apócrina**, com a gotícula levando consigo um pedaço de citoplasma e de membrana apical. Células mioepiteliais em volta ejetam o leite sob ocitocina.',
    roteiro: [
      'Note a variação entre ácinos vizinhos: a assincronia é normal e ajuda a identificar a lactação.',
      'Procure os vacúolos claros na luz e no ápice das células — são lipídios extraídos no processamento.',
    ],
  },

  larynx: {
    panorama:
      'A laringe conecta a faringe à traqueia e acumula funções de via aérea, esfíncter e fonação, o que se reflete na variedade de tecidos. O esqueleto é feito de cartilagens **hialinas** (tireóidea, cricóidea, aritenóideas) e **elásticas** (epiglote, corniculadas, cuneiformes, processo vocal), unidas por membranas e movidas por músculos esqueléticos intrínsecos. O epitélio muda conforme a exposição ao atrito: **estratificado pavimentoso** na face lingual da epiglote e sobre as pregas vocais verdadeiras, e **pseudoestratificado ciliado com caliciformes** no resto. As **pregas vestibulares** (falsas) têm lâmina própria frouxa e glândulas seromucosas; as **pregas vocais** têm o ligamento vocal elástico e o músculo vocal, e não têm glândulas.',
    roteiro: [
      'Use a mudança de epitélio para localizar a prega vocal verdadeira.',
      'Confirme o tipo de cartilagem antes de nomeá-la: hialina e elástica se alternam aqui.',
    ],
  },

  'pulmonary vein': {
    panorama:
      'As veias pulmonares levam o sangue já oxigenado de volta ao átrio esquerdo, e o traço que as identifica na lâmina é **topográfico, não estrutural**: ao contrário das artérias pulmonares, elas não acompanham as vias aéreas — correm sozinhas pelos **septos de tecido conjuntivo** que separam os lóbulos pulmonares. Sua parede é fina para o calibre, com média muscular escassa e mal delimitada e adventícia que se confunde com o septo. Nas porções extrapulmonares, próximas ao coração, a parede passa a conter cardiomiócitos que se estendem do átrio esquerdo — detalhe com consequência clínica, pois é dessas mangas miocárdicas que partem os focos ectópicos da fibrilação atrial.',
    roteiro: [
      'Verifique se há brônquio acompanhando: sem ele, e dentro de um septo, é veia pulmonar.',
      'Compare com a artéria pulmonar do mesmo campo para calibrar a espessura de parede.',
    ],
  },

  pleura: {
    panorama:
      'A pleura é uma membrana serosa em duas folhas contínuas entre si: a **visceral**, aderida à superfície do pulmão e acompanhando as fissuras, e a **parietal**, forrando a parede torácica, o diafragma e o mediastino. Ambas têm a mesma construção — **mesotélio** simples pavimentoso apoiado numa lâmina basal, sobre conjuntivo com fibras colágenas e elásticas, vasos e linfáticos. Entre elas fica a cavidade pleural, um espaço virtual com poucos mililitros de líquido ultrafiltrado que o mesotélio enriquece com ácido hialurônico, permitindo o deslizamento sem atrito durante a respiração. A visceral é irrigada por artérias brônquicas e não tem inervação dolorosa; a parietal tem, e é ela que dói na pleurite.',
    roteiro: [
      'Procure a camada única de mesotélio na superfície — é o que define a serosa.',
      'Siga a pleura visceral para dentro de uma fissura para confirmar a continuidade.',
    ],
  },

  glomerulus: {
    panorama:
      'O glomérulo é o novelo capilar do corpúsculo renal, e sua parede é uma barreira de filtração com três camadas em série. O **endotélio fenestrado**, com poros grandes e sem diafragma, retém apenas as células do sangue. A **membrana basal glomerular**, espessa e fundida a partir das lâminas do endotélio e do podócito, é a barreira principal: a lâmina densa filtra por tamanho e as lâminas raras, ricas em heparan-sulfato, repelem ânions — o que impede a passagem da albumina, negativa. Os **podócitos** envolvem o capilar com pedicelos entrelaçados, e entre eles ficam as fendas de filtração fechadas por diafragmas de nefrina. As **células mesangiais**, no eixo, dão sustentação, fagocitam resíduos e regulam o fluxo.',
    roteiro: [
      'Distinga os núcleos da periferia (podócitos, na cápsula visceral) dos do eixo (mesangiais).',
      'Localize o polo vascular e o polo urinário antes de descrever o resto do corpúsculo.',
    ],
    atencao:
      'Corpúsculo renal é o conjunto glomérulo mais cápsula de Bowman; usar os termos como sinônimos é impreciso.',
  },

  'cortex: convoluted portion': {
    panorama:
      'A porção contorcida do córtex renal é o labirinto entre os raios medulares e concentra os corpúsculos renais e os túbulos contorcidos. Dois perfis tubulares dominam o campo e devem ser separados. O **túbulo contorcido proximal** é mais numeroso — o corte cruza suas voltas várias vezes —, tem epitélio cúbico alto e intensamente **acidófilo** pela quantidade de mitocôndrias, borda em escova apical que torna a luz mal definida, poucos núcleos por perfil e limites celulares invisíveis. O **túbulo contorcido distal** é menos frequente, mais pálido, sem borda em escova, com luz nítida e mais núcleos por perfil. Onde o distal encosta na arteríola aferente de seu próprio corpúsculo forma-se a **mácula densa**.',
    roteiro: [
      'Conte os núcleos por perfil: mais núcleos e luz limpa apontam para o distal.',
      'Procure a mácula densa como um adensamento de núcleos na parede voltada ao polo vascular.',
    ],
  },

  'urinary bladder': {
    panorama:
      'A bexiga é o exemplo canônico de órgão desenhado para mudar de forma. Sua mucosa tem **urotélio** (epitélio de transição), estratificado, cujas células superficiais — as células em guarda-chuva — são grandes, muitas vezes binucleadas, e têm a membrana apical reforçada por placas de uroplaquina articuladas por dobradiças, além de vesículas fusiformes de reserva. Cheia, a bexiga tem urotélio com três a quatro camadas e superfície achatada; vazia, ele se recolhe em seis a oito camadas com células superficiais abauladas. A lâmina própria é espessa, e a muscular externa é o **músculo detrusor**, feixes de músculo liso entrelaçados em três planos mal delimitados, muito diferente das camadas nítidas do intestino.',
    roteiro: [
      'Ache as células em guarda-chuva antes de contar camadas: elas datam o estado de repleção.',
      'Note que os feixes do detrusor se cruzam — não tente forçar uma leitura em camadas separadas.',
    ],
  },

  'simple cuboidal epithelium': {
    panorama:
      'O epitélio simples cúbico tem uma só camada de células com altura aproximadamente igual à largura e núcleo redondo centralizado — critério que só vale em corte perpendicular, já que um corte oblíquo faz cúbico parecer estratificado e pavimentoso parecer cúbico. É o epitélio de superfícies onde há **absorção e secreção moderadas**: ductos de glândulas, túbulos renais, folículos da tireoide, superfície do ovário, plexo coroide e epitélio pigmentar da retina. Quando a demanda funcional aumenta, ele tende a ficar mais alto; quando o folículo tireoidiano está inativo e distendido, ele achata — a altura, portanto, é um indicador dinâmico de atividade, não uma característica fixa.',
    roteiro: [
      'Confirme o plano de corte pela forma do núcleo antes de classificar a altura.',
      'Procure a lâmina basal para garantir que existe apenas uma camada apoiada nela.',
    ],
  },

  'basement membrane': {
    panorama:
      'A membrana basal é a interface entre todo epitélio e o conjuntivo subjacente, e é uma estrutura composta. A **lâmina basal**, produzida pelo epitélio e visível só em microscopia eletrônica, tem a lâmina lúcida e a lâmina densa, feitas de **colágeno tipo IV** em rede, **laminina**, nidogênio e o proteoglicano perlecan. Abaixo dela, a **lâmina reticular**, produzida pelo conjuntivo, contém colágenos III e VII, este último formando as fibrilas de ancoragem que prendem uma à outra. O conjunto ancora e polariza o epitélio, filtra macromoléculas, orienta a migração celular na cicatrização e serve de trilho para a regeneração. Em H&E só se vê onde é espessa; PAS e prata a evidenciam.',
    roteiro: [
      'Use PAS quando precisar da membrana basal: em H&E ela costuma passar despercebida.',
      'Lembre que "lâmina basal" e "membrana basal" não são sinônimos — a escala de observação é diferente.',
    ],
  },

  microvilli: {
    panorama:
      'As microvilosidades são projeções digitiformes da membrana apical, de aproximadamente 1 µm de comprimento por 0,1 µm de diâmetro, sustentadas por um feixe axial de cerca de vinte a trinta filamentos de **actina** ancorados na trama terminal. São **imóveis** e existem para uma coisa: multiplicar a área de absorção, em até vinte vezes. Onde são muito densas e uniformes, como no enterócito, a fileira aparece em luz como uma faixa rosada contínua no ápice — a **borda estriada**; no túbulo contorcido proximal do rim, menos regular, chama-se **borda em escova**. Na membrana que as recobre ficam ancoradas enzimas digestivas — dissacaridases e peptidases — e o glicocálice espesso que as protege.',
    roteiro: [
      'Procure a faixa rosada apical contínua, e não projeções individuais: em luz elas não se resolvem.',
      'Não confunda com estereocílios, que são bem mais longos e aparecem em tufos.',
    ],
  },

  'simple tubular gland': {
    panorama:
      'A glândula tubular simples é a forma mais elementar de glândula multicelular: um **tubo reto e não ramificado**, com o segmento secretor e o ducto praticamente indistinguíveis, abrindo-se direto na superfície do epitélio de revestimento. O exemplo clássico são as **glândulas intestinais do intestino grosso**, retas, paralelas e apoiadas na muscular da mucosa, tão regulares que um corte transversal do cólon parece uma fileira de círculos alinhados. As glândulas gástricas seguem o mesmo princípio, embora ramificadas. Sua vantagem é a rapidez de renovação: a base abriga as células-tronco, e o produto — muco, no caso do cólon — alcança a luz por um trajeto curtíssimo.',
    roteiro: [
      'Confirme que o tubo é reto e não se ramifica antes de classificar.',
      'Procure a base apoiada na muscular da mucosa para diferenciar de cripta profunda de outro órgão.',
    ],
  },

  'inactive fibroblast': {
    panorama:
      'O fibroblasto quiescente, também chamado **fibrócito**, é a mesma célula do fibroblasto ativo em outro estado funcional, e a diferença é inteiramente legível na lâmina. O núcleo é **pequeno, alongado, escuro e heterocromático**, com nucléolo pouco aparente; o citoplasma é escasso, acidófilo ou quase invisível, porque o RER e o Golgi regrediram. Espremido entre feixes de colágeno já formados, ele aparece como uma linha nuclear fina paralela às fibras — a imagem típica de tendão em corte longitudinal. Sua função é de manutenção, não de construção: repõe lentamente componentes da matriz. Diante de lesão, ele reverte para o estado ativo, um dos exemplos mais claros de plasticidade celular no adulto.',
    roteiro: [
      'Compare a cromatina com a de um fibroblasto ativo no mesmo campo: densa contra vesiculosa.',
      'Note que só o núcleo é visível — se você vê citoplasma abundante, a célula não está quiescente.',
    ],
  },

  adipocyte: {
    panorama:
      'O adipócito uniloculado é a célula do tecido adiposo branco e a maior célula do conjuntivo, chegando a 100 µm. Quase todo o seu volume é uma **única gotícula de triglicerídeo** sem membrana própria, que empurra o citoplasma para uma orla finíssima e achata o núcleo contra a periferia — daí a imagem em anel de sinete. Em H&E a gordura é dissolvida pelos solventes do processamento, e o que resta é um vacúolo vazio delimitado por uma linha rosada; para vê-la é preciso congelar o material e usar sudan ou óleo vermelho. Cada célula tem lâmina basal própria e é envolvida por fibras reticulares e capilares. Além de estocar energia, secreta leptina, adiponectina e outras adipocinas.',
    roteiro: [
      'Procure o núcleo achatado na borda: sem ele, o espaço claro pode ser artefato ou vaso.',
      'Compare com o adipócito multilocular do tecido pardo, que tem várias gotículas e núcleo central.',
    ],
  },

  'mast cell': {
    panorama:
      'O mastócito é uma célula grande e ovoide do conjuntivo, com núcleo redondo e central muitas vezes escondido por **grânulos citoplasmáticos numerosos e metacromáticos** — corados de púrpura pelo azul de toluidina, que é azul, porque a heparina sulfatada altera a cor do corante. Os grânulos contêm heparina, histamina, proteases e fatores quimiotáticos para eosinófilos e neutrófilos. Concentra-se onde o corpo faz fronteira com o meio: derme, submucosa respiratória e digestória, e sempre ao redor de vasos. Sua membrana carrega receptores de alta afinidade para IgE; quando um alérgeno faz a ponte entre duas moléculas de IgE ligadas, ocorre a degranulação explosiva que produz a reação alérgica imediata.',
    roteiro: [
      'Peça uma coloração metacromática: em H&E os grânulos podem quase não aparecer.',
      'Procure a célula junto a vênulas — a posição perivascular é característica.',
    ],
  },

  'plasma cell': {
    panorama:
      'O plasmócito é o linfócito B em sua forma final, dedicado exclusivamente a fabricar anticorpo, e toda a sua morfologia decorre disso. O citoplasma é abundante e **intensamente basófilo** pelo RER que o preenche; junto ao núcleo existe uma área clara, o **halo perinuclear**, correspondente ao Golgi volumoso e ao centrossomo. O núcleo é redondo, excêntrico, com heterocromatina em blocos radiais que lhe deram o apelido de "roda de carroça" ou "mostrador de relógio". Vive de dias a semanas no conjuntivo, e concentra-se onde a exposição antigênica é constante: lâmina própria do intestino, glândulas salivares e mamárias, e órgãos linfoides. Não recircula e não apresenta mais antígeno.',
    roteiro: [
      'Procure a combinação halo claro mais núcleo excêntrico — juntos são específicos.',
      'Compare a basofilia com a de um linfócito vizinho: o plasmócito é muito mais azul.',
    ],
  },

  'bone: endochondral ossification': {
    panorama:
      'A ossificação endocondral substitui um molde de cartilagem hialina por osso e é o mecanismo que forma ossos longos e a maior parte do esqueleto. O processo se lê como uma sequência de zonas na placa epifisária, da epífise para a diáfise: **zona de repouso**, com cartilagem hialina comum; **zona de proliferação**, com condrócitos empilhados em colunas como moedas; **zona de hipertrofia**, em que eles incham enormemente e as lacunas se aproximam; **zona de calcificação**, em que a matriz entre as colunas se mineraliza e os condrócitos morrem; e **zona de ossificação**, invadida por vasos e osteoblastos, que depositam osso sobre as espículas de cartilagem calcificada. O crescimento em comprimento continua enquanto proliferação e substituição se equilibram.',
    roteiro: [
      'Percorra as zonas em ordem e nomeie cada uma antes de descrever células isoladas.',
      'Procure as espículas com centro basófilo de cartilagem e periferia acidófila de osso novo.',
    ],
  },

  'bone marrow: adult': {
    panorama:
      'Na vida adulta a hemopoese fica restrita à **medula vermelha** dos ossos chatos, das vértebras e das epífises proximais de fêmur e úmero; o resto foi substituído por **medula amarela**, adiposa e inativa, que pode reverter em situações de demanda. A medula vermelha é um tecido de estroma reticular sustentando ilhas de células hemopoéticas entre **sinusoides** de parede descontínua, por onde as células maduras entram na circulação atravessando o próprio citoplasma endotelial. O campo é caoticamente heterogêneo, e é isso que o identifica: precursores eritroides em ilhas em torno de um macrófago central, precursores granulocíticos junto ao osso, e os **megacariócitos**, células gigantes e multinucleadas, o achado mais fácil de reconhecer.',
    roteiro: [
      'Ache primeiro um megacariócito para confirmar que o tecido é hemopoético.',
      'Estime a razão entre gordura e células — ela indica a celularidade e varia com a idade.',
    ],
  },

  hemopoiesis: {
    panorama:
      'A hemopoese parte de uma **célula-tronco hematopoética** pluripotente que se autorrenova e origina duas linhagens: a mieloide, que gera eritrócitos, plaquetas, granulócitos e monócitos, e a linfoide, que gera linfócitos B, T e NK. À medida que a célula amadurece, três coisas mudam de forma previsível e legível na lâmina: o **tamanho diminui**, a **cromatina condensa** e o **citoplasma perde basofilia** enquanto ganha o produto específico — hemoglobina na série vermelha, grânulos na série branca. A série eritroide culmina na expulsão do núcleo; a granulocítica, na segmentação nuclear; a megacariocítica, na fragmentação do citoplasma em plaquetas. Citocinas como eritropoetina, trombopoetina e os fatores estimuladores de colônia governam o processo.',
    roteiro: [
      'Use os três eixos — tamanho, cromatina e cor do citoplasma — para estagiar qualquer precursor.',
      'Comece pelas células maiores e mais azuis do campo: são as mais imaturas.',
    ],
  },

  'white adipose connective tissue': {
    panorama:
      'O tecido adiposo branco é o maior reservatório de energia do corpo e um órgão endócrino de pleno direito. É formado por adipócitos **uniloculares** tão apertados uns contra os outros que assumem contorno poligonal, separados por septos finos de conjuntivo com uma rede capilar densa — cada adipócito encosta em pelo menos um capilar, o que é necessário para a rapidez da mobilização. Em H&E o campo parece uma rede de malhas vazias com núcleos achatados na borda, porque o lipídio foi extraído. Além de estocar triglicerídeos e isolar termicamente, secreta **leptina**, que sinaliza a reserva energética ao hipotálamo, além de adiponectina, resistina e citocinas inflamatórias.',
    roteiro: [
      'Confirme a unilocularidade e a posição periférica dos núcleos.',
      'Procure os capilares nos septos — sua densidade é parte do que define o tecido.',
    ],
  },

  'bipolar neuron': {
    panorama:
      'O neurônio bipolar tem exatamente **dois prolongamentos que saem de polos opostos** do corpo celular: um dendrito e um axônio. É uma morfologia rara e restrita a vias sensoriais especiais, onde a informação precisa de um trajeto curto e direto — o **epitélio olfatório**, em que o dendrito sobe até a superfície e termina em cílios com receptores odoríferos e o axônio atravessa a lâmina crivosa até o bulbo olfatório; a **retina**, onde as células bipolares ligam fotorreceptores a células ganglionares; e os gânglios **vestibular e coclear**, únicos gânglios sensoriais em que os corpos permanecem bipolares no adulto em vez de se tornarem pseudounipolares.',
    roteiro: [
      'Confirme os dois polos opostos: prolongamentos saindo do mesmo lado indicam outro tipo.',
      'Use a localização como confirmação — bipolar fora dessas quatro sedes é achado a questionar.',
    ],
  },

  terminals: {
    panorama:
      'Os terminais são o ponto em que o axônio deixa de conduzir e passa a comunicar. No sistema nervoso central e nos gânglios, o terminal forma **sinapses** — o botão pré-sináptico, cheio de vesículas e mitocôndrias, a fenda de 20 a 30 nm e a densidade pós-sináptica. No músculo esquelético, o terminal se expande na **junção neuromuscular** (placa motora), onde o axônio perde a mielina, se ramifica em botões que se alojam em goteiras da fibra e liberam acetilcolina sobre uma membrana pregueada e cheia de receptores. Nos efetores autonômicos, não há placa: o axônio corre entre as células e libera o transmissor por **varicosidades** em série, banhando várias células ao mesmo tempo.',
    roteiro: [
      'Decida o tipo de alvo antes de descrever o terminal — a arquitetura muda completamente entre eles.',
      'Na placa motora, procure a arborização terminal sobre a fibra e a ausência de bainha de mielina no trecho final.',
    ],
  },

  'peripheral nerve: investments': {
    panorama:
      'Um nervo periférico é envolvido por três bainhas de conjuntivo encaixadas, e cada uma tem função e composição distintas. O **endoneuro** é conjuntivo frouxo delicado em torno de **cada fibra**, com fibras reticulares e capilares, e é o meio em que o axônio regenera. O **perineuro** envolve cada **fascículo** e é o mais especializado: camadas concêntricas de células epitelioides unidas por junções estreitas, com lâmina basal, formando a **barreira hematonervosa** que protege o endoneuro — é também o que torna o bloqueio anestésico dependente da difusão através dele. O **epineuro** é conjuntivo denso externo, que reúne os fascículos, carrega os vasos maiores e absorve tração.',
    roteiro: [
      'Nomeie as três bainhas de fora para dentro e associe cada uma ao que ela envolve.',
      'Procure as células achatadas em camadas do perineuro — é a bainha mais fácil de reconhecer.',
    ],
  },

  'cell cycle': {
    panorama:
      'O ciclo celular é a sequência ordenada que leva uma célula a duplicar seu conteúdo e dividi-lo. Tem duas grandes partes: a **intérfase**, com G1, S e G2, e a **fase M**, com mitose e citocinese. Em G1 a célula cresce e decide, no **ponto de restrição**, se prossegue ou entra em **G0**, estado de quiescência de onde muitas células — neurônios, cardiomiócitos — nunca voltam. Em S o DNA é replicado; em G2 há checagem e preparo. O avanço é comandado por **ciclinas** e **quinases dependentes de ciclina**, e vigiado por pontos de checagem que interrompem o ciclo diante de dano no DNA ou fuso mal montado. A perda desses controles é o mecanismo central da transformação maligna.',
    roteiro: [
      'Situe cada figura observada na sequência antes de nomeá-la isoladamente.',
      'Estime quantas células do campo estão em G0 — na maioria dos tecidos adultos, quase todas.',
    ],
  },

  mitosis: {
    panorama:
      'A mitose distribui cópias idênticas do genoma para duas células-filhas, e sua sequência é sempre a mesma: **prófase**, com condensação da cromatina, desmonte do nucléolo e formação do fuso; **prometáfase**, com ruptura do envoltório nuclear e captura dos cinetocoros; **metáfase**, com os cromossomos alinhados na placa equatorial; **anáfase**, com separação das cromátides irmãs e sua migração para os polos; e **telófase**, com descondensação, reconstrução do envoltório e reaparecimento dos nucléolos, seguida pela **citocinese**. Em H&E, o que denuncia uma célula em mitose é a combinação de cromatina densa e grosseira com ausência de contorno nuclear — nenhuma célula em intérfase tem as duas coisas.',
    roteiro: [
      'Use a presença ou ausência do envoltório para separar prófase das fases seguintes.',
      'Procure mitoses nas zonas proliferativas do tecido: basal da epiderme, cripta intestinal, centro germinativo.',
    ],
  },

  'late telophase and cytokinesis': {
    panorama:
      'No final da telófase os dois núcleos já estão praticamente reconstituídos e a divisão do citoplasma domina a cena. O **anel contrátil** de actina e miosina II, ancorado na face interna da membrana no plano equatorial, aperta progressivamente e produz o **sulco de clivagem**, que se aprofunda até que as duas células fiquem unidas apenas por uma ponte estreita. Dentro dela, os microtúbulos remanescentes do fuso central formam o **corpo intermediário** (midbody), plataforma onde a maquinaria de abscisão faz o corte final. As organelas — mitocôndrias, retículo, Golgi já refragmentado — são repartidas estocasticamente entre as filhas, e não por um mecanismo de precisão como o dos cromossomos.',
    roteiro: [
      'Procure duas massas de cromatina descondensando unidas por uma ponte fina.',
      'Note a assimetria possível no tamanho das filhas — a divisão do citoplasma nem sempre é igual.',
    ],
  },

  meiosis: {
    panorama:
      'A meiose é a divisão que reduz o número de cromossomos pela metade e gera variabilidade. São **duas divisões após uma única replicação**. Na **meiose I**, os cromossomos homólogos pareiam na prófase I — leptóteno, zigóteno, paquíteno, diplóteno e diacinese — formando o complexo sinaptonêmico e trocando segmentos no **crossing over**; depois os homólogos, e não as cromátides, se separam: é a divisão reducional, que leva de diploide a haploide. Na **meiose II**, sem nova replicação, as cromátides irmãs se separam como numa mitose comum. O resultado são quatro células haploides geneticamente distintas, e a distinção vem de duas fontes: a recombinação e o sorteio independente dos homólogos na metáfase I.',
    roteiro: [
      'Determine primeiro qual das duas divisões você está vendo: o que se separa é diferente em cada uma.',
      'Procure espermatócitos primários em paquíteno no túbulo seminífero — são as maiores células germinativas.',
    ],
  },

  gametogenesis: {
    panorama:
      'A gametogênese aplica a meiose de modos muito diferentes nos dois sexos. A **espermatogênese** começa na puberdade e é contínua: cada espermatogônia dá origem a quatro espermátides, que se transformam em espermatozoides na espermiogênese, sem divisão, com formação do acrossomo, condensação do núcleo, montagem do flagelo e descarte de citoplasma. A **ovogênese** começa na vida fetal, para no **diplóteno da prófase I** até a ovulação, quando se completa a meiose I com divisão **desigual** — um oócito secundário grande e um corpúsculo polar minúsculo —, e a meiose II só termina se houver fecundação. Um oócito por ciclo, portanto, contra dezenas de milhões de espermatozoides por dia.',
    roteiro: [
      'Compare as duas linhas pelo destino do citoplasma: dividido igualmente no macho, concentrado num só gameta na fêmea.',
      'Lembre da parada prolongada em prófase I: ela explica o aumento de erros meióticos com a idade materna.',
    ],
  },

  'overview of cell structures': {
    panorama:
      'A célula eucariótica se organiza em três compartimentos que orientam qualquer leitura. O **núcleo** guarda o genoma, delimitado pelo envoltório com poros, e contém a cromatina e o nucléolo. O **citoplasma** aloja as organelas membranosas — retículo rugoso e liso, Golgi, lisossomos, peroxissomos e mitocôndrias — e as não membranosas, como ribossomos, centríolos e o citoesqueleto de microfilamentos, filamentos intermediários e microtúbulos. A **membrana plasmática** delimita o conjunto e é a interface com o meio. Uma regra prática vale para quase todas as lâminas: a **basofilia** do citoplasma indica RER e ribossomos, e portanto síntese de proteína para exportação; a **acidofilia** indica mitocôndrias, filamentos e proteína já formada.',
    roteiro: [
      'Leia a cor do citoplasma antes de procurar organelas: ela já prediz a função dominante.',
      'Use o tamanho e a densidade do nucléolo como segunda pista de atividade sintética.',
    ],
  },

  'nuclear pores': {
    panorama:
      'Os poros nucleares são as únicas passagens entre núcleo e citoplasma, e existem aos milhares em cada envoltório. Cada um se forma onde as membranas interna e externa se fundem, e é ocupado por um **complexo do poro nuclear**: cerca de trinta proteínas diferentes montadas com **simetria octogonal**, formando um anel citoplasmático com filamentos, um anel nuclear com a cesta e um canal central de aproximadamente 9 nm. Moléculas pequenas passam por difusão; proteínas e RNAs maiores só atravessam com sinal — importinas reconhecem a sequência de localização nuclear, exportinas fazem o caminho inverso, e o gradiente da GTPase Ran fornece a direção. O número de poros acompanha a atividade transcricional da célula.',
    roteiro: [
      'Procure os poros como interrupções do envoltório em corte tangencial; de face aparecem como anéis.',
      'Relacione a densidade de poros à atividade da célula observada.',
    ],
  },

  'rough endoplasmic reticulum and polysomes': {
    panorama:
      'A distinção entre ribossomos **ligados** e **livres** define o destino da proteína, e a lâmina permite inferi-la. Os ribossomos aderidos à face citosólica do retículo rugoso traduzem proteínas destinadas à exportação, à membrana ou às organelas do sistema endomembranoso; a proteína entra na cisterna pelo translocon durante a própria tradução, guiada pelo peptídeo-sinal. Os **polissomos livres** — vários ribossomos enfileirados no mesmo mRNA, formando rosetas ou espirais no citosol — produzem proteínas de uso interno: enzimas citosólicas, elementos do citoesqueleto, proteínas nucleares e mitocondriais. Ambos coram-se de azul em H&E, e é a distribuição, não a cor, que os diferencia.',
    roteiro: [
      'Em microscopia eletrônica, verifique se os ribossomos estão sobre cisternas ou soltos em roseta.',
      'Em luz, associe basofilia difusa a polissomos livres e basofilia em faixas a RER organizado.',
    ],
  },

  'nissl substance': {
    panorama:
      'A substância de Nissl é o nome clássico dado, no corpo do neurônio, ao conjunto de **retículo endoplasmático rugoso e polissomos livres** organizados em blocos volumosos. Em H&E e sobretudo em corantes básicos como azul de toluidina, aparece como grumos basófilos espalhados pelo pericário e pelos dendritos — e **ausentes no cone de implantação e no axônio**, ausência que é a melhor forma de identificar qual prolongamento é o axônio em uma lâmina de rotina. Ela reflete a intensidade da síntese proteica necessária para manter um citoplasma que pode se estender por mais de um metro. Após lesão axonal, os blocos se dispersam e a coloração se desfaz na **cromatólise**, sinal de reação regenerativa.',
    roteiro: [
      'Ache o prolongamento sem Nissl para identificar o axônio.',
      'Avalie se os grumos estão íntegros ou dispersos — a dispersão é achado, não artefato.',
    ],
  },

  'smooth endoplasmic reticulum': {
    panorama:
      'O retículo endoplasmático liso é uma rede de túbulos anastomosados sem ribossomos, contínua com o rugoso, e sua abundância denuncia a função da célula. Ele sintetiza **lipídios e esteroides**, o que explica seu desenvolvimento máximo nas células da suprarrenal, do corpo lúteo e de Leydig; **detoxifica** fármacos e xenobióticos pelo sistema do citocromo P450, o que explica sua proliferação no hepatócito após exposição a álcool e barbitúricos; e **sequestra cálcio**, função que na fibra muscular é levada ao extremo pelo retículo sarcoplasmático, que envolve cada miofibrila e libera o cálcio que dispara a contração. Como não tem ribossomos, o citoplasma rico em REL é **acidófilo ou pálido**, não basófilo.',
    roteiro: [
      'Use a acidofilia ou palidez do citoplasma como pista indireta de REL abundante.',
      'Relacione o achado à função conhecida do órgão antes de concluir.',
    ],
  },

  cytoskeleton: {
    panorama:
      'O citoesqueleto é uma rede dinâmica de três sistemas de filamentos, cada um com monômero, diâmetro e papel próprios. Os **microfilamentos** de actina, com cerca de 7 nm, sustentam microvilosidades, formam a trama terminal e o anel contrátil, e dão motilidade em conjunto com a miosina. Os **filamentos intermediários**, de 10 nm, são os mais estáveis e puramente estruturais — queratinas nos epitélios, vimentina no conjuntivo, desmina no músculo, neurofilamentos no neurônio, laminas no núcleo —, e essa especificidade de tipo é usada rotineiramente para classificar tumores. Os **microtúbulos**, de 25 nm, são tubos ocos de tubulina que partem do centrossomo, servem de trilho para cinesinas e dineínas e formam fuso, cílios e flagelos.',
    roteiro: [
      'Classifique pelo diâmetro em microscopia eletrônica: 7, 10 e 25 nm não se confundem.',
      'Em luz, deduza o sistema pelo que a célula faz — contrai, resiste a tração ou transporta.',
    ],
  },

  microfilaments: {
    panorama:
      'Os microfilamentos são polímeros de **actina** de aproximadamente 7 nm, o menor dos três sistemas e o mais dinâmico: montam-se e desmontam-se continuamente, com a extremidade mais crescendo e a menos encurtando. Concentram-se logo abaixo da membrana plasmática, formando o **córtex celular** que define a forma e permite as mudanças de superfície. Suas funções derivam sempre da associação com proteínas parceiras: com miosina II fazem contração — do sarcômero muscular ao anel de citocinese —, com fimbrina e vilina sustentam o eixo das microvilosidades, com espectrina ancoram a membrana da hemácia, e sozinhos, em polimerização dirigida, empurram a membrana na formação de lamelipódios e pseudópodos.',
    roteiro: [
      'Procure a faixa densa logo sob a membrana apical, a trama terminal, como manifestação em luz.',
      'Associe cada função à proteína parceira — actina isolada não faz quase nada.',
    ],
  },

  'intermediate filaments': {
    panorama:
      'Os filamentos intermediários têm cerca de 10 nm — diâmetro entre o dos microfilamentos e o dos microtúbulos, daí o nome — e são o componente **puramente estrutural** do citoesqueleto: não têm polaridade, não hidrolisam nucleotídeo e não participam de transporte ou contração. São os mais estáveis e resistem a tração, distribuindo a força mecânica pelo tecido inteiro através de suas ancoragens em desmossomos e hemidesmossomos. Sua composição é **específica de linhagem** — queratinas em epitélios, vimentina em células mesenquimais, desmina em músculo, proteína glial fibrilar ácida em astrócitos, neurofilamentos em neurônios —, e essa especificidade faz deles os marcadores mais usados em imuno-histoquímica para determinar a origem de um tumor.',
    roteiro: [
      'Ligue o tipo de filamento ao tecido: essa correspondência é a base do uso diagnóstico.',
      'Procure os tonofilamentos convergindo para os desmossomos na camada espinhosa da epiderme.',
    ],
  },

  'intermediate filaments and microtubules': {
    panorama:
      'Comparar os dois sistemas esclarece o papel de cada um. Os **filamentos intermediários** são apolares, estáveis, montados a partir de monômeros fibrosos que se enrolam em tétrades antissimétricas, e existem para **resistir a estresse mecânico**; sua composição varia com o tecido. Os **microtúbulos** são polares, instáveis por construção — alternam crescimento e catástrofe na chamada instabilidade dinâmica —, montados de dímeros globulares de alfa e beta-tubulina em treze protofilamentos, e existem para **organizar o espaço e transportar**: nucleiam no centrossomo, servem de trilho para cinesina (em direção à periferia) e dineína (em direção ao centro), formam o fuso mitótico e o axonema. Venenos como colchicina e taxol atacam apenas os microtúbulos.',
    roteiro: [
      'Use estabilidade e polaridade como critérios: eles separam os dois sistemas melhor que o diâmetro.',
      'Relacione a instabilidade dinâmica ao motivo pelo qual antimitóticos funcionam.',
    ],
  },

  'cell shapes: spherical': {
    panorama:
      'A forma esférica é a que uma célula assume quando **nada a deforma**: sem adesão a vizinhas, sem matriz que a estire, a tensão superficial do córtex de actina minimiza a área e produz a esfera. Por isso ela caracteriza células livres ou suspensas — leucócitos circulantes, o oócito, condrócitos e adipócitos isolados na matriz — e também células que se soltaram temporariamente, como qualquer célula aderente prestes a se dividir, que arredonda antes da mitose. O contraste é informativo: célula esférica em meio a um epitélio coeso é achado a explicar, seja migração, apoptose ou perda de adesão. A forma, portanto, é leitura direta das forças mecânicas em que a célula está inserida.',
    roteiro: [
      'Pergunte o que está tocando a célula: a forma é consequência do contato, não uma propriedade fixa.',
      'Procure células arredondadas dentro de epitélios — quase sempre estão em mitose ou em trânsito.',
    ],
  },

  'mucosal membrane': {
    panorama:
      'A membrana mucosa é o revestimento das cavidades que se comunicam com o exterior, e tem sempre pelo menos duas camadas: um **epitélio**, cujo tipo é ditado pela agressão local — estratificado pavimentoso onde há atrito, como boca, esôfago e vagina; simples colunar onde há absorção ou secreção, como estômago e intestino; pseudoestratificado ciliado nas vias aéreas; urotélio na via urinária —, e uma **lâmina própria** de conjuntivo frouxo, ricamente vascularizada e povoada por células de defesa, plasmócitos e nódulos linfoides. No tubo digestório soma-se uma terceira camada, a **muscular da mucosa**, fina lâmina de músculo liso que move a mucosa independentemente da parede e cuja presença define o limite com a submucosa.',
    roteiro: [
      'Identifique o epitélio e pergunte qual agressão ele enfrenta — a resposta explica a escolha.',
      'Procure a muscular da mucosa para saber onde a mucosa termina.',
    ],
  },

  'cortex and medullla': {
    panorama:
      'A dupla córtex e medula é um plano de organização que se repete em órgãos de funções muito distintas, e reconhecê-lo economiza tempo em qualquer lâmina. O **córtex** é a região periférica, logo abaixo da cápsula; a **medula**, a central. No **rim**, o córtex tem corpúsculos e túbulos contorcidos e a medula tem alças e coletores em arranjo estriado. No **linfonodo**, o córtex tem nódulos B e o paracórtex tem T, enquanto a medula tem cordões e seios. No **timo**, o córtex é escuro pelos timócitos e a medula é clara e tem corpúsculos de Hassall. Na **suprarrenal**, o córtex faz esteroides e a medula, catecolaminas — duas origens embriológicas diferentes no mesmo órgão. No **ovário**, o córtex tem folículos e a medula, vasos.',
    roteiro: [
      'Comece toda lâmina de órgão capsulado localizando cápsula, córtex e medula antes de qualquer detalhe.',
      'Lembre que a divisão é topográfica: o que ela significa muda inteiramente de órgão para órgão.',
    ],
  },

  globe: {
    panorama:
      'O bulbo ocular tem três túnicas concêntricas. A **fibrosa**, externa, é a **esclera** opaca em cinco sextos e a **córnea** transparente no sexto anterior, e dá forma e proteção. A **vascular** (úvea), média, compreende a **coroide** posterior, muito vascularizada e pigmentada, o **corpo ciliar**, que produz humor aquoso e ajusta o cristalino pelo músculo ciliar, e a **íris**, diafragma com dois músculos antagonistas que controla a pupila. A **nervosa**, interna, é a **retina**, com sua parte óptica fotossensível e a parte cega anterior. O interior se divide em câmara anterior e posterior, ambas com humor aquoso, e a cavidade vítrea, com o corpo vítreo gelatinoso, atrás do cristalino.',
    roteiro: [
      'Percorra as três túnicas de fora para dentro antes de examinar qualquer região isolada.',
      'Ache o limbo e a ora serrata: são as duas transições que orientam o corte inteiro.',
    ],
  },

  'globe: cornea': {
    panorama:
      'A córnea é transparente e avascular, e cada uma de suas cinco camadas contribui para isso. O **epitélio anterior** é estratificado pavimentoso não queratinizado, com alta capacidade de regeneração a partir de células-tronco do limbo. A **membrana de Bowman**, homogênea e acelular, é a camada mais superficial do estroma. O **estroma** ocupa 90% da espessura e é o segredo da transparência: cerca de 200 a 250 lamelas de colágeno tipo I com fibrilas de diâmetro uniforme e espaçamento regular, o que cancela o espalhamento de luz por interferência. A **membrana de Descemet** é a lâmina basal espessa do **endotélio corneano**, camada simples pavimentoso que bombeia água para fora e mantém o estroma desidratado — sem essa bomba, a córnea incha e opacifica.',
    roteiro: [
      'Conte as cinco camadas em ordem antes de descrever qualquer uma.',
      'Relacione a regularidade do estroma à transparência: é a explicação central da lâmina.',
    ],
  },

  'globe: limbus': {
    panorama:
      'O limbo é a zona de transição entre córnea e esclera e concentra estruturas de grande importância funcional. Nele o **epitélio corneano** passa a conjuntival, o estroma perde a regularidade lamelar e ganha vasos, e a membrana de Bowman termina. Ali reside o nicho de **células-tronco limbares**, responsáveis por repovoar o epitélio corneano — sua destruição, em queimaduras químicas, leva à opacificação permanente. No estroma do limbo fica o sistema de drenagem do humor aquoso: a **rede trabecular**, malha de trabéculas revestidas por endotélio, e o **canal de Schlemm**, vaso circular que recolhe o aquoso e o devolve à circulação venosa. A obstrução dessa via é o mecanismo do glaucoma de ângulo aberto.',
    roteiro: [
      'Ache o canal de Schlemm como uma luz alongada revestida por endotélio no estroma limbar.',
      'Note a chegada dos vasos: a transição de avascular para vascularizado marca o limbo.',
    ],
  },

  'globe: sclera': {
    panorama:
      'A esclera é a porção opaca e resistente da túnica fibrosa, ocupando os cinco sextos posteriores do bulbo. É conjuntivo **denso não modelado** com feixes espessos de colágeno tipo I entremeados de fibras elásticas, dispostos em várias direções — e é justamente essa irregularidade de diâmetro e arranjo, oposta à do estroma corneano, que a torna opaca e branca. Tem poucos vasos e poucos fibroblastos. Sua espessura varia, sendo maior perto do nervo óptico, onde é atravessada pela **lâmina crivosa**, e menor sob a inserção dos músculos extrínsecos. Externamente é recoberta pela cápsula de Tenon e pela conjuntiva; internamente, a lâmina supracoroide faz a transição para a úvea.',
    roteiro: [
      'Compare o arranjo das fibras com o do estroma corneano na mesma lâmina — a diferença explica a opacidade.',
      'Procure a inserção dos músculos extrínsecos para localizar-se no bulbo.',
    ],
  },

  'globe: ciliary body': {
    panorama:
      'O corpo ciliar é o anel que une a coroide à íris e reúne duas funções. Produz o **humor aquoso**: seu epitélio é duplo — uma camada externa pigmentada e uma interna não pigmentada, arranjo herdado da invaginação da vesícula óptica, com os ápices voltados um para o outro —, e a camada não pigmentada secreta ativamente o aquoso a partir do plexo capilar dos **processos ciliares**, pregas radiais na superfície interna. E ajusta o foco: o **músculo ciliar**, liso, com fibras meridionais, radiais e circulares, quando contrai relaxa as **fibras zonulares** que suspendem o cristalino, deixando-o assumir forma mais esférica para a visão de perto. Com a idade o cristalino endurece e essa acomodação se perde.',
    roteiro: [
      'Ache o epitélio duplo — pigmentado por fora, claro por dentro — para confirmar o corpo ciliar.',
      'Siga as fibras zonulares dos processos ciliares até o equador do cristalino.',
    ],
  },

  'globe: iris': {
    panorama:
      'A íris é o diafragma do olho, projetando-se sobre o cristalino e delimitando a pupila. Sua face anterior é irregular e **sem epitélio de revestimento**, formada por fibroblastos e melanócitos dispostos em camada descontínua. O estroma é conjuntivo frouxo e muito vascularizado, com quantidade variável de melanócitos — é a densidade deles, e não uma diferença de pigmento, que determina a cor dos olhos: pouca melanina espalha a luz curta e o olho aparece azul. Na face posterior há duas camadas de epitélio **intensamente pigmentado**, que bloqueiam a luz. Dois músculos antagonistas controlam a pupila: o **esfíncter da pupila**, circular e parassimpático, e o **dilatador**, radial e simpático, ambos de origem neuroectodérmica.',
    roteiro: [
      'Localize a margem pupilar e siga do estroma até o epitélio pigmentado posterior.',
      'Procure o esfíncter como uma banda de músculo liso próxima à margem pupilar.',
    ],
  },

  'globe: choroid': {
    panorama:
      'A coroide é a porção posterior da úvea, situada entre esclera e retina, e existe para nutrir e para absorver luz. É conjuntivo frouxo com uma densidade excepcional de **melanócitos**, que dão a cor escura e impedem a reflexão interna de luz dispersa. Organiza-se em camadas: a lâmina supracoroide, de transição com a esclera; a camada vascular, com artérias e veias de calibre maior; a **coriocapilar**, um plexo de capilares fenestrados de grande calibre logo abaixo da retina, que nutre por difusão o epitélio pigmentar e os fotorreceptores — as camadas retinianas mais externas não têm vasos próprios; e a **membrana de Bruch**, lâmina fina que separa a coriocapilar do epitélio pigmentar e cujo espessamento está no centro da degeneração macular.',
    roteiro: [
      'Ache a coriocapilar encostada na retina: a proximidade é o que viabiliza a nutrição por difusão.',
      'Distinga o pigmento da coroide, difuso no estroma, do pigmento do epitélio retiniano, em fileira única.',
    ],
  },

  retina: {
    panorama:
      'A retina tem duas folhas de origem embriológica comum, vindas da vesícula óptica. O **epitélio pigmentar**, externo, é uma camada simples cúbica apoiada na membrana de Bruch, cheia de melanina, que absorve luz dispersa, fagocita as pontas gastas dos segmentos externos dos fotorreceptores e recicla o retinal. A **retina neural**, interna, contém a cadeia de três neurônios — fotorreceptor, bipolar, ganglionar — mais células horizontais e amácrinas, que fazem o processamento lateral, e a glia de Müller. Uma peculiaridade: a luz atravessa toda a espessura antes de chegar aos fotorreceptores, que ficam no fundo. Entre as duas folhas persiste um espaço virtual, resquício da cavidade da vesícula, por onde ocorre o descolamento de retina.',
    roteiro: [
      'Conte as dez camadas em ordem, de fora para dentro, antes de examinar células isoladas.',
      'Localize a fóvea, onde as camadas internas se afastam e só restam cones.',
    ],
  },

  'external ear: external auditory meatus': {
    panorama:
      'O meato acústico externo é um canal de aproximadamente 2,5 cm revestido por pele, e seu esqueleto muda ao longo do trajeto: o terço externo é sustentado por **cartilagem elástica**, continuação da do pavilhão, e os dois terços internos são escavados no **osso temporal**. Na porção cartilaginosa, a pele tem pelos grossos, glândulas sebáceas e **glândulas ceruminosas**, que são sudoríparas apócrinas modificadas, com luz ampla e epitélio cúbico contendo grânulos de pigmento; a mistura de sua secreção com o sebo e com queratina descamada forma o cerume, que acidifica e protege o canal. Na porção óssea, a pele é fina, quase sem anexos, e adere firmemente ao periósteo — o que torna qualquer inflamação ali muito dolorosa.',
    roteiro: [
      'Determine se o suporte é cartilagem ou osso: isso localiza o segmento e prediz os anexos.',
      'Procure as glândulas ceruminosas pela luz ampla, distinta da sudorípara écrina comum.',
    ],
  },

  'middle ear': {
    panorama:
      'O ouvido médio é uma cavidade aérea no temporal que transforma onda sonora aérea em vibração mecânica, resolvendo o problema de impedância entre ar e líquido. É revestido por epitélio **simples pavimentoso a cúbico**, que se torna ciliado e com caliciformes perto da tuba auditiva. A **membrana timpânica** fecha-o lateralmente: pele por fora, camada intermediária de fibras colágenas radiais e circulares, e mucosa por dentro. A cadeia de ossículos — martelo, bigorna e estribo — articula-se por sinoviais verdadeiras e amplifica a pressão cerca de vinte vezes pela razão entre as áreas do tímpano e da janela oval. Dois músculos esqueléticos, tensor do tímpano e estapédio, amortecem sons intensos. A **tuba auditiva** equaliza a pressão com a faringe.',
    roteiro: [
      'Identifique as três camadas da membrana timpânica antes de descrever a cavidade.',
      'Note a mudança de epitélio em direção à tuba — é gradual e informa a orientação do corte.',
    ],
  },

  'vestibular macula': {
    panorama:
      'A mácula é a área sensorial do utrículo e do sáculo, especializada em detectar **aceleração linear** e a orientação da cabeça em relação à gravidade. É uma placa de epitélio com células ciliadas dos tipos I e II e células de sustentação, sobre a qual repousa a **membrana otolítica**: uma camada gelatinosa de glicoproteínas coberta por cristais de carbonato de cálcio, as **otocônias**. Como esses cristais são mais densos que a endolinfa, sua inércia desloca a membrana quando a cabeça acelera ou se inclina, dobrando os estereocílios. Uma faixa central, a **estríola**, divide a mácula em duas metades com polaridade oposta, de modo que qualquer direção de movimento excita uma parte e inibe a outra.',
    roteiro: [
      'Procure as otocônias sobre o epitélio: elas separam mácula de crista ampular imediatamente.',
      'Compare com a orientação da mácula do sáculo — as duas ficam em planos perpendiculares.',
    ],
  },

  'cochlear duct': {
    panorama:
      'O ducto coclear é o compartimento **endolinfático** da cóclea, de secção triangular, encaixado entre as rampas vestibular e timpânica, que contêm perilinfa. Seus três lados têm histologia distinta: o teto é a **membrana vestibular** (de Reissner), fina, de duas camadas de células pavimentosas, que separa endo de perilinfa mantendo a diferença iônica; a parede externa é a **estria vascular**, um epitélio estratificado atípico e vascularizado — único epitélio do corpo com capilares dentro dele — que secreta a endolinfa e mantém seu potássio alto e seu potencial positivo; e o assoalho é a **membrana basilar**, sobre a qual assenta o órgão de Corti, com o limbo espiral e a membrana tectória cobrindo as células ciliadas.',
    roteiro: [
      'Nomeie os três lados do triângulo antes de examinar o órgão de Corti.',
      'Procure capilares dentro do epitélio da estria vascular — é um achado único no corpo.',
    ],
  },

  'skin overview': {
    panorama:
      'A pele é o maior órgão do corpo e tem duas camadas de origens diferentes. A **epiderme**, ectodérmica, é epitélio estratificado pavimentoso queratinizado, avascular, renovado a cada quatro semanas a partir da camada basal e organizado em estratos que registram a diferenciação progressiva do queratinócito. A **derme**, mesodérmica, é conjuntivo que fornece resistência, vasos e nervos, dividida em papilar frouxa e reticular densa. Abaixo, a **hipoderme** — que não faz parte da pele em sentido estrito — é tecido adiposo que isola e amortece. Os anexos (folículos pilosos, glândulas sebáceas, sudoríparas e unhas) são invaginações epidérmicas alojadas na derme. Fala-se em pele espessa, das palmas e plantas, e pele fina, do restante do corpo.',
    roteiro: [
      'Decida primeiro se a pele é espessa ou fina: a presença de estrato lúcido e a ausência de pelos resolvem.',
      'Conte os estratos da epiderme antes de descrever a derme.',
    ],
  },

  'basal lamina': {
    panorama:
      'A lâmina basal é a porção da membrana basal produzida pelo **próprio epitélio** e só visível em microscopia eletrônica, com 40 a 120 nm. Tem duas sublâminas: a **lâmina lúcida**, clara, onde ficam as porções de laminina e integrinas ancoradas aos hemidesmossomos, e a **lâmina densa**, escura, uma rede bidimensional de **colágeno tipo IV** entrelaçada com laminina, nidogênio e perlecan. Ela existe em toda superfície epitelial, mas também envolve fibras musculares, adipócitos e células de Schwann, e no glomérulo renal se funde com a do endotélio formando a barreira de filtração. Suas funções vão além da adesão: filtra, polariza a célula, orienta a migração e serve de trilho para a regeneração após lesão.',
    roteiro: [
      'Confirme as duas sublâminas em microscopia eletrônica; em luz só se vê a membrana basal como um todo.',
      'Note onde ela existe fora de epitélios — a lista é curta e vale memorizar.',
    ],
  },

  'stratum granulosum': {
    panorama:
      'A camada granulosa é onde o queratinócito decide morrer, e tudo o que acontece nela prepara a barreira. Suas três a cinco fileiras de células achatadas são reconhecíveis pelos **grânulos de querato-hialina**, intensamente basófilos e de contorno irregular, sem membrana, que contêm profilagrina — precursora da filagrina, que agrega os filamentos de queratina em feixes compactos. Ao mesmo tempo, os **corpos lamelares** (grânulos de Odland) despejam por exocitose um conteúdo lipídico no espaço intercelular, formando o cimento impermeável que é a verdadeira barreira contra a perda de água. No fim da camada, enzimas lisossômicas destroem núcleo e organelas, e a célula passa a corneócito.',
    roteiro: [
      'Procure os grânulos escuros e irregulares — sua forma os distingue de qualquer outro grânulo da epiderme.',
      'Note o desaparecimento abrupto dos núcleos na transição para o estrato córneo.',
    ],
  },

  "meissner's corpuscle": {
    panorama:
      'O corpúsculo de Meissner é um mecanorreceptor encapsulado alojado nas **papilas dérmicas**, logo abaixo da epiderme, o que o coloca no ponto mais próximo possível da superfície. Tem forma alongada, perpendicular à pele, e por dentro é feito de células achatadas de sustentação empilhadas em pilha oblíqua, entre as quais serpenteia um axônio mielinizado que perde a mielina ao entrar. Responde ao **toque leve e ao movimento** sobre a pele, adaptando-se rapidamente, e é o receptor da discriminação de dois pontos: sua densidade é máxima na polpa dos dedos, nos lábios e nos mamilos, e cai com a idade, o que explica a perda de sensibilidade tátil fina no idoso.',
    roteiro: [
      'Procure dentro da papila dérmica: fora dela, o corpúsculo é outro.',
      'Note o eixo perpendicular à superfície — é característico e ajuda mesmo em cortes ruins.',
    ],
  },

  'pacinian corpuscle': {
    panorama:
      'O corpúsculo de Pacini é o maior receptor encapsulado, chegando a mais de um milímetro, e o mais fácil de reconhecer: um corte transversal mostra dezenas de **lamelas concêntricas** de células achatadas separadas por espaço com líquido, exatamente como uma cebola cortada, em torno de um **axônio central** único e desmielinizado. Essa arquitetura é um filtro mecânico: as lamelas deslizam e dissipam a pressão estática, de modo que apenas mudanças rápidas — **vibração** e pressão profunda transitória — chegam ao axônio, o que faz dele um receptor de adaptação muito rápida. Localiza-se na derme profunda, na hipoderme, mas também em periósteo, mesentério, cápsulas articulares e pâncreas.',
    roteiro: [
      'Conte as lamelas e ache o axônio central: os dois juntos fecham o diagnóstico.',
      'Não descarte cortes oblíquos — fora do plano equatorial o corpúsculo parece um cacho irregular.',
    ],
  },

  'apocrine sweat gland': {
    panorama:
      'A glândula sudorípara apócrina é restrita a axila, região perianal, aréola e conduto auditivo, só se torna funcional na puberdade e responde a estímulo adrenérgico. Diferencia-se da écrina por três traços visíveis: a **luz do segmento secretor é muito ampla**, várias vezes maior; o epitélio é **simples cúbico a colunar** com ápice abaulado; e o ducto desemboca no **folículo piloso**, não diretamente na superfície. A secreção é viscosa, proteica e lipídica, inodora ao sair — o odor corporal vem da degradação bacteriana na superfície da pele. Apesar do nome, o mecanismo de secreção é predominantemente merócrino; o termo é histórico, herdado de uma interpretação antiga da imagem apical.',
    roteiro: [
      'Compare o calibre da luz com o de uma glândula écrina no mesmo campo.',
      'Siga o ducto até seu destino — o folículo piloso confirma a apócrina.',
    ],
  },

  'sebaceous gland': {
    panorama:
      'A glândula sebácea é acinar ramificada, ligada ao folículo piloso na unidade pilossebácea, e sua secreção é **holócrina**: a célula inteira se desintegra e vira o produto. O ácino mostra esse processo como um gradiente radial — na periferia, células basais pequenas, basófilas, com núcleo íntegro e capacidade proliferativa; para o centro, o citoplasma vai se enchendo de gotículas lipídicas e assume aspecto espumoso, o núcleo picnotiza e finalmente a célula se rompe. O sebo resultante lubrifica pelo e pele e tem ação antimicrobiana leve. A glândula é andrógeno-dependente, o que explica sua ativação na puberdade e seu papel central na acne, quando o ducto se obstrui e a unidade inflama.',
    roteiro: [
      'Leia o ácino de fora para dentro para ver o gradiente holócrino completo.',
      'Localize o ducto curto conectando o ácino ao folículo.',
    ],
    atencao:
      'O aspecto espumoso é lipídio extraído, não degeneração; ele é o próprio produto da glândula.',
  },

  'associated structures': {
    panorama:
      'Chamam-se estruturas associadas os anexos que, embora de origem epidérmica, alojam-se na derme e na hipoderme e trabalham em conjunto com a pele. O **folículo piloso** é uma invaginação com bulbo, papila dérmica indutora, matriz proliferativa e camadas concêntricas que formam pelo e bainhas; o **músculo eretor do pelo**, liso, liga o folículo à derme papilar e produz a piloereção. As **glândulas sebáceas** desembocam no folículo, formando a unidade pilossebácea. As **glândulas sudoríparas écrinas** e **apócrinas** completam o conjunto, e a **unha** é a placa de queratina dura produzida pela matriz ungueal. Todos derivam de brotos epidérmicos que mergulharam na derme durante o desenvolvimento.',
    roteiro: [
      'Localize cada anexo pela profundidade e pelo destino do ducto — os dois dados juntos identificam.',
      'Procure o músculo eretor entre a derme papilar e o folículo para completar a unidade.',
    ],
  },

  'arteries vs veins': {
    panorama:
      'Distinguir artéria de veia é a tarefa mais frequente em lâminas vasculares, e a comparação deve ser feita **entre os dois vasos do mesmo feixe**, nunca isoladamente. A artéria tem **parede espessa em relação à luz**, com média muscular bem desenvolvida e concêntrica, lâmina elástica interna frequentemente visível como uma linha ondulada e refringente, e luz redonda e aberta, porque a média contraída não colaba. A veia tem parede fina, luz ampla, frequentemente colabada ou irregular, média escassa e mal delimitada, adventícia proporcionalmente espessa e, nos membros, válvulas. Em muitos cortes a veia parece maior e mais deformada que a artéria acompanhante, apesar de transportar o mesmo volume.',
    roteiro: [
      'Compare os dois vasos do feixe antes de classificar qualquer um deles sozinho.',
      'Procure a lâmina elástica interna ondulada: quando presente, resolve a questão.',
    ],
  },

  'small artery': {
    panorama:
      'A artéria de pequeno calibre é o degrau entre a artéria muscular e a arteríola, e se define por ter de **quatro a oito camadas** de músculo liso na média — acima disso já é muscular de médio calibre, abaixo é arteríola. A íntima tem endotélio e uma **lâmina elástica interna** ainda evidente, ondulada pela contração post-mortem da média; a lâmina elástica externa é fina ou ausente. A adventícia é delgada. Junto com as arteríolas, é o principal território de resistência periférica e o alvo das alterações da hipertensão crônica, em que a média se espessa e a luz se estreita — a chamada arteriosclerose hialina, que reduz a perfusão de rim, retina e encéfalo.',
    roteiro: [
      'Conte as camadas musculares para separar de arteríola e de artéria muscular.',
      'Verifique se a lâmina elástica interna ainda é contínua — ela some progressivamente com a redução do calibre.',
    ],
  },

  sinusoid: {
    panorama:
      'O sinusoide é o capilar de maior permeabilidade e se distingue por três características que ocorrem juntas: **luz ampla e irregular**, que acompanha os espaços do órgão em vez de ser cilíndrica; **endotélio descontínuo**, com lacunas amplas entre células e sem diafragma; e **lâmina basal ausente ou fragmentada**. O fluxo é lento, o que favorece a troca. Existe onde é preciso que células inteiras ou proteínas grandes cruzem a parede: no **fígado**, forrado também por macrófagos de Kupffer; no **baço**, na polpa vermelha; na **medula óssea**, por onde as células maduras entram na circulação; e em glândulas endócrinas como a suprarrenal e a hipófise.',
    roteiro: [
      'Verifique se a luz acompanha o formato do parênquima em vez de ser regular.',
      'Procure macrófagos residentes na parede — no fígado, as células de Kupffer fazem parte do revestimento.',
    ],
  },

  veins: {
    panorama:
      'As veias contêm cerca de 70% do volume sanguíneo e funcionam como reservatório de capacitância, o que explica sua parede fina e complacente. Classificam-se por calibre: **vênulas**, de pós-capilares sem músculo a musculares; **veias de pequeno e médio calibre**, com média de poucas camadas e adventícia espessa; e **veias de grande calibre**, como a cava, em que a adventícia é a camada dominante e contém **feixes longitudinais de músculo liso**. Em todas, a média é proporcionalmente menor que na artéria correspondente e a adventícia é maior — inversão que é o traço mais constante do sistema. Válvulas em par, projeções da íntima, garantem o fluxo unidirecional onde ele se dá contra a gravidade.',
    roteiro: [
      'Estime a razão média/adventícia: ela é a assinatura venosa em qualquer calibre.',
      'Nas veias grandes, procure músculo liso longitudinal na adventícia.',
    ],
  },

  'small vein': {
    panorama:
      'A veia de pequeno calibre recebe o sangue das vênulas musculares e tem parede fina mas já com as três túnicas identificáveis. A **íntima** é endotélio sobre pouco subendotélio, sem lâmina elástica interna definida; a **média** tem uma a três camadas de músculo liso circular frouxamente arranjadas, com colágeno entre elas; e a **adventícia** é a camada mais espessa, de conjuntivo com fibras colágenas longitudinais. A luz costuma estar colabada ou deformada no corte, e frequentemente contém hemácias, o que a distingue de um linfático de calibre semelhante. Comparada à arteríola ou artéria pequena que a acompanha, sua parede é visivelmente mais fina para uma luz maior.',
    roteiro: [
      'Procure hemácias na luz para separar de vaso linfático.',
      'Compare com o vaso acompanhante antes de decidir o calibre pela aparência isolada.',
    ],
  },

  heart: {
    panorama:
      'A parede cardíaca repete o plano dos vasos com nomes próprios. O **endocárdio** corresponde à íntima: endotélio sobre subendotélio de conjuntivo, com uma camada subendocárdica que aloja vasos, nervos e as **fibras de Purkinje**. O **miocárdio** corresponde à média e é a camada funcional, com cardiomiócitos estriados, ramificados, de núcleo central e unidos por discos intercalares, dispostos em feixes espiralados muito mais espessos no ventrículo esquerdo. O **epicárdio** corresponde à adventícia e é a lâmina visceral do pericárdio seroso: mesotélio sobre conjuntivo com gordura, vasos coronários e nervos. O **esqueleto fibroso**, de conjuntivo denso, ancora as valvas, separa átrios de ventrículos e isola eletricamente as câmaras.',
    roteiro: [
      'Nomeie as três camadas de dentro para fora e associe cada uma à túnica vascular correspondente.',
      'Procure as fibras de Purkinje na região subendocárdica antes de descrever o miocárdio.',
    ],
  },

  'interventricular septum': {
    panorama:
      'O septo interventricular tem duas porções de constituição diferente. A **porção muscular**, que é a maior parte, é miocárdio espesso contínuo com as paredes ventriculares e contribui ativamente para a ejeção. A **porção membranácea**, pequena e situada na parte superior, junto ao esqueleto fibroso, é conjuntivo denso sem músculo — e é o sítio mais comum de comunicação interventricular congênita, porque depende da fusão de vários primórdios durante a septação. Pelo septo desce o **feixe atrioventricular** (de His), que atravessa o esqueleto fibroso pela única via de continuidade elétrica entre átrios e ventrículos e se bifurca em ramos direito e esquerdo, terminando nas fibras de Purkinje subendocárdicas.',
    roteiro: [
      'Localize a transição entre porção muscular e membranácea antes de descrever o septo.',
      'Procure o feixe de condução no subendocárdio de ambos os lados.',
    ],
  },

  'semilunar valve': {
    panorama:
      'As valvas semilunares — aórtica e pulmonar — têm três cúspides em forma de bolso, sem cordas tendíneas, e se fecham passivamente pelo refluxo que enche seus seios. Cada cúspide é uma prega de **endocárdio dos dois lados** com um núcleo central de conjuntivo denso contínuo com o esqueleto fibroso, e a organização desse núcleo tem três estratos com funções mecânicas distintas: a **fibrosa**, no lado arterial, com colágeno que suporta a carga do fechamento; a **esponjosa**, central, rica em glicosaminoglicanos, que amortece; e a **ventricular**, com fibras elásticas que devolvem a forma na abertura. Não há vasos no interior da cúspide: sua nutrição vem por difusão a partir do sangue circulante.',
    roteiro: [
      'Identifique os três estratos do núcleo conjuntivo e associe cada um ao lado da valva.',
      'Confirme a ausência de vasos — é o que explica a lentidão de reparo e a vulnerabilidade a endocardite.',
    ],
  },

  lip: {
    panorama:
      'O lábio é uma boa lâmina de transição porque reúne, em poucos milímetros, três revestimentos diferentes sobre um mesmo núcleo de músculo esquelético, o orbicular da boca. A **face cutânea** é pele fina, com pelos, glândulas sebáceas e sudoríparas. A **zona vermelha** (vermelhão) é epitélio estratificado pavimentoso **queratinizado, mas fino e translúcido**, apoiado em papilas dérmicas altas e muito vascularizadas — daí a cor — e desprovido de glândulas próprias, o que explica por que resseca. A **face mucosa** é estratificado pavimentoso não queratinizado, espesso, com **glândulas salivares labiais** mucosas na submucosa, cujos ductos desembocam na superfície.',
    roteiro: [
      'Percorra as três superfícies em sequência e marque onde cada epitélio começa e termina.',
      'Procure as glândulas labiais para confirmar que você chegou à face mucosa.',
    ],
  },

  'lip: mucosal surface': {
    panorama:
      'A face mucosa do lábio é mucosa oral de revestimento típica. O epitélio é **estratificado pavimentoso não queratinizado**, espesso, com células superficiais que mantêm núcleo — traço que o separa do epitélio queratinizado da gengiva e do palato duro. A lâmina própria é conjuntivo com papilas curtas e irregulares, muito vascularizada, e não há muscular da mucosa; ela passa diretamente a uma **submucosa** frouxa que aloja as **glândulas salivares menores labiais**, predominantemente mucosas com semiluas serosas, e prende a mucosa ao músculo orbicular. Essa fixação frouxa é o que permite a mobilidade do lábio e explica por que a mucosa desliza sobre o músculo.',
    roteiro: [
      'Confirme os núcleos nas células superficiais para classificar como não queratinizado.',
      'Localize as glândulas labiais na submucosa e siga seus ductos até a superfície.',
    ],
  },

  'oral mucosa': {
    panorama:
      'A mucosa oral se divide em três tipos funcionais, e reconhecer qual deles está na lâmina orienta todo o resto. A **mucosa de revestimento** cobre lábios, bochechas, assoalho e face ventral da língua: epitélio estratificado pavimentoso **não queratinizado**, lâmina própria com papilas curtas e submucosa frouxa, tudo voltado para a mobilidade. A **mucosa mastigatória** cobre gengiva e palato duro: epitélio **queratinizado ou paraqueratinizado**, papilas altas e entrelaçadas e submucosa firmemente aderida ao osso, feita para resistir à abrasão. A **mucosa especializada** cobre o dorso da língua, com papilas linguais e botões gustativos. Nenhuma delas tem muscular da mucosa.',
    roteiro: [
      'Classifique o epitélio primeiro; ele decide qual dos três tipos você está vendo.',
      'Verifique se a submucosa é frouxa ou aderida ao osso — o dado confirma a classificação.',
    ],
  },

  'oral mucosa: lining': {
    panorama:
      'A mucosa de revestimento é a mais extensa da cavidade oral e a mais adaptada ao movimento. Seu epitélio é **estratificado pavimentoso não queratinizado**, com as camadas basal, intermediária e superficial, esta última mantendo núcleos, e apresenta grande espessura mas pouca resistência à abrasão. A lâmina própria tem papilas curtas e largas, com rede vascular densa que dá a cor rosada, e passa a uma **submucosa** frouxa e elástica, com glândulas salivares menores mucosas e feixes de fibras elásticas que permitem o estiramento e o retorno. Onde a mobilidade é máxima, como no assoalho da boca, o epitélio é mais fino — o que também torna essa região a de melhor absorção para fármacos sublinguais.',
    roteiro: [
      'Meça a altura das papilas: curtas e largas indicam revestimento, altas e finas indicam mastigatória.',
      'Procure fibras elásticas na submucosa para confirmar a capacidade de estiramento.',
    ],
  },

  tongue: {
    panorama:
      'A língua é uma massa de **músculo esquelético** disposta em três planos ortogonais — o que permite mudar de forma em qualquer direção — recoberta por mucosa cuja aparência muda radicalmente entre as faces. A **face ventral** é lisa, com epitélio não queratinizado e mucosa fina. O **dorso** é mucosa especializada, com quatro tipos de papilas: **filiformes**, as mais numerosas, cônicas e queratinizadas, sem botões gustativos, que dão aspereza; **fungiformes**, em cogumelo, avermelhadas, com alguns botões no topo; **folhadas**, em pregas laterais; e **circunvaladas**, grandes, em V, com botões nas paredes do sulco. O terço posterior tem a **tonsila lingual**. Entre os feixes musculares há glândulas salivares linguais mucosas e serosas.',
    roteiro: [
      'Confirme a orientação do corte pelos três planos musculares antes de tudo.',
      'Classifique as papilas pelo formato e pela presença de botões gustativos.',
    ],
  },

  'secretory units': {
    panorama:
      'A unidade secretora é a porção da glândula que efetivamente produz, e sua forma e conteúdo permitem prever o produto. Pela **forma**, é **tubular** quando alongada com paredes paralelas, **acinar** quando esférica com luz virtual, ou **tubuloacinar** quando combina as duas. Pelo **conteúdo**, é **serosa** quando as células têm base basófila pelo RER, ápice granular e núcleo redondo central, produzindo secreção aquosa rica em enzimas; **mucosa** quando o citoplasma é pálido e vazio em H&E e o núcleo está achatado contra a base, produzindo muco viscoso; e **mista** quando as duas coexistem, muitas vezes com células serosas formando uma **semilua** sobre um ácino mucoso. Células mioepiteliais envolvem a unidade e ajudam a expulsar o produto.',
    roteiro: [
      'Classifique por forma e por conteúdo separadamente — as duas classificações são independentes.',
      'Procure as semiluas serosas para identificar uma unidade mista.',
    ],
  },

  'esophagus: muscularis externa': {
    panorama:
      'A muscular externa do esôfago é a melhor demonstração histológica de uma transição de controle voluntário para involuntário. No **terço superior** ela é inteiramente **músculo esquelético**, contínuo com a musculatura da faringe, o que permite iniciar a deglutição voluntariamente. No **terço médio** as duas variedades se misturam, e um mesmo campo mostra fibras estriadas com núcleos periféricos ao lado de fibras lisas fusiformes de núcleo central. No **terço inferior** só há **músculo liso**, como no resto do tubo digestório. Em toda a extensão as camadas se organizam em circular interna e longitudinal externa, com o plexo mioentérico de Auerbach entre elas coordenando a onda peristáltica.',
    roteiro: [
      'Determine o tipo de músculo antes de mais nada: ele localiza o terço do esôfago no corte.',
      'Procure o plexo mioentérico entre as duas camadas como gânglios pequenos e pálidos.',
    ],
  },

  'esophagogastric junction': {
    panorama:
      'A junção esofagogástrica é uma das transições abruptas mais fáceis de reconhecer. De um lado, o esôfago, com epitélio **estratificado pavimentoso não queratinizado** e glândulas esofágicas próprias na submucosa; do outro, o estômago, com epitélio **simples colunar** secretor de muco, fossetas gástricas e glândulas cárdicas na mucosa. A mudança ocorre em uma linha nítida, a linha Z. A muscular da mucosa se espessa nessa região e a camada circular da muscular externa forma o esfíncter esofágico inferior, funcional mais que anatômico. Quando o refluxo ácido crônico faz o epitélio escamoso ser substituído por epitélio colunar com células caliciformes, tem-se o **esôfago de Barrett**, metaplasia com risco aumentado de adenocarcinoma.',
    roteiro: [
      'Ache a linha Z e descreva os dois lados dela separadamente.',
      'Procure células caliciformes acima da junção — na mucosa gástrica normal elas não existem.',
    ],
  },

  'stomach: cardiac region': {
    panorama:
      'A cárdia é a faixa estreita do estômago que circunda a entrada do esôfago e tem a mucosa mais rasa das três regiões gástricas. Suas **fossetas são profundas**, ocupando cerca de metade da espessura da mucosa, e as **glândulas cárdicas** que nelas desembocam são tubulares, frequentemente ramificadas e enoveladas, com predomínio quase absoluto de **células mucosas** — as células parietais e principais são raras ou ausentes. O produto é muco alcalino que ajuda a proteger a mucosa esofágica adjacente do refluxo ácido. Como o padrão glandular se parece com o da região pilórica, distinguir as duas na lâmina depende da presença do epitélio escamoso esofágico ao lado ou da transição duodenal.',
    roteiro: [
      'Compare a profundidade da fosseta com o comprimento da glândula para separar as três regiões.',
      'Procure a vizinhança do corte: cárdia e piloro só se distinguem com segurança pelo contexto.',
    ],
  },

  'stomach: pylorus': {
    panorama:
      'A região pilórica tem as **fossetas mais profundas** de todo o estômago, ocupando cerca de dois terços da espessura da mucosa, e glândulas curtas, enoveladas e ramificadas que ficam confinadas ao terço restante — proporção inversa à do fundo, e o critério mais confiável para identificar a região. As glândulas pilóricas são predominantemente **mucosas**, com células claras e pálidas; há células parietais esparsas e um número expressivo de **células G**, enteroendócrinas que secretam **gastrina**, o hormônio que estimula a secreção ácida das células parietais do fundo. A muscular externa se espessa aqui na camada circular para formar o **esfíncter pilórico**, que controla o esvaziamento gástrico.',
    roteiro: [
      'Meça a razão fosseta/glândula: dois terços de fosseta identifica o piloro.',
      'Procure o espessamento da camada circular se o corte alcançar o esfíncter.',
    ],
  },

  'gastro-duodenal junction': {
    panorama:
      'A transição gastroduodenal reúne várias mudanças simultâneas em um espaço curto. O epitélio gástrico simples colunar **sem caliciformes** dá lugar ao epitélio intestinal com **vilosidades** e **células caliciformes**; as glândulas pilóricas terminam e começam as criptas de Lieberkühn com células de Paneth no fundo. O achado mais característico do lado duodenal são as **glândulas de Brunner**, tubuloacinares mucosas alojadas na **submucosa** — únicas glândulas submucosas do intestino —, cuja secreção alcalina neutraliza o quimo ácido e protege a mucosa. O espessamento da camada circular da muscular externa forma o esfíncter pilórico, e a mucosa da junção costuma mostrar as duas populações lado a lado.',
    roteiro: [
      'Procure glândulas na submucosa: se existirem no intestino, são de Brunner e o segmento é duodeno.',
      'Confirme o aparecimento simultâneo de vilosidades e caliciformes.',
    ],
  },

  'mucosa: villi': {
    panorama:
      'A vilosidade é uma projeção digitiforme **apenas da mucosa** — epitélio mais lâmina própria — para dentro da luz, exclusiva do intestino delgado, e o segundo nível de amplificação de superfície do órgão. Seu revestimento é epitélio simples colunar com **enterócitos** de borda estriada, responsáveis pela absorção, e **células caliciformes** intercaladas, cuja proporção cresce do duodeno ao íleo. O eixo é lâmina própria com um **quilífero central**, capilar linfático de fundo cego que recolhe os quilomícrons da gordura absorvida, uma rede capilar subepitelial que recolhe açúcares e aminoácidos, feixes de músculo liso vindos da muscular da mucosa que encurtam a vilosidade ritmicamente, e abundantes células imunes.',
    roteiro: [
      'Ache o quilífero central no eixo: ele é maior e mais irregular que os capilares.',
      'Compare a altura e a forma das vilosidades entre segmentos — largas no duodeno, mais afiladas no íleo.',
    ],
  },

  'mucosa: epithelium': {
    panorama:
      'O epitélio da mucosa intestinal é uma folha simples colunar em renovação constante, com quatro tipos celulares principais que compartilham a mesma célula-tronco na cripta. Os **enterócitos**, majoritários, têm borda estriada de microvilosidades com enzimas de membrana e fazem a absorção; suas junções estreitas apicais determinam quanto pode passar pela via paracelular. As **células caliciformes** secretam muco que lubrifica e protege. As **células de Paneth**, no fundo da cripta, com grânulos acidófilos volumosos, secretam lisozima e defensinas e controlam a flora. As **células enteroendócrinas**, dispersas, com grânulos basais, liberam hormônios que coordenam a digestão. Há ainda células M sobre as placas de Peyer, que amostram antígenos da luz.',
    roteiro: [
      'Localize cada tipo pela posição: Paneth no fundo, caliciformes ao longo, enteroendócrinas na base do epitélio.',
      'Confirme a borda estriada como faixa rosada contínua no ápice dos enterócitos.',
    ],
  },

  'mucosa: malt': {
    panorama:
      'O tecido linfoide associado à mucosa é a resposta imune instalada exatamente onde o corpo faz fronteira com o meio. Aparece de duas formas: **difusa**, com linfócitos, plasmócitos e macrófagos espalhados pela lâmina própria, e **nodular**, com nódulos linfoides isolados ou agregados, como as **placas de Peyer** do íleo. Sobre esses agregados o epitélio se modifica: as vilosidades achatam e surgem as **células M**, com dobras em vez de microvilosidades, que transportam antígenos da luz para bolsões onde linfócitos e células dendríticas esperam. A resposta característica é a produção de **IgA dimérica** pelos plasmócitos, que atravessa o enterócito acoplada ao componente secretor e neutraliza patógenos na própria luz, sem inflamação.',
    roteiro: [
      'Procure achatamento das vilosidades como sinal de placa de Peyer logo abaixo.',
      'Note se os nódulos atravessam a muscular da mucosa e alcançam a submucosa — é o padrão das placas.',
    ],
  },

  submucosa: {
    panorama:
      'A submucosa é a camada de conjuntivo **denso não modelado** que fica entre a muscular da mucosa e a muscular externa, e é a via de distribuição do tubo digestório: por ela correm os vasos sanguíneos e linfáticos de maior calibre e o **plexo submucoso de Meissner**, gânglios do sistema nervoso entérico que controlam a secreção glandular e o fluxo sanguíneo local. Sua composição frouxa e resistente permite que a mucosa deslize e se pregueie — as pregas circulares do delgado e as rugas gástricas têm núcleo de submucosa. Glândulas nela só existem em dois lugares: as **esofágicas próprias** e as **de Brunner** do duodeno, e encontrá-las é um dado localizador imediato.',
    roteiro: [
      'Procure gânglios entre as fibras: o plexo submucoso confirma a camada.',
      'Se houver glândulas aqui, use-as para localizar o segmento — só duas regiões as têm.',
    ],
  },

  appendix: {
    panorama:
      'O apêndice vermiforme mantém o plano do intestino grosso, mas em miniatura e com o compartimento imune hipertrofiado. A luz é **estreita, irregular e muitas vezes contém restos**; a mucosa tem criptas de Lieberkühn mais curtas e menos regulares que as do cólon, com caliciformes e algumas células de Paneth. O traço dominante é a **massa de nódulos linfoides** que ocupa a lâmina própria e atravessa a muscular da mucosa até a submucosa, formando um anel quase contínuo — o que fez o órgão ser chamado de tonsila abdominal. A muscular externa tem as duas camadas completas, sem as tênias do cólon, e há serosa. O tecido linfoide regride com a idade e pode ser substituído por fibrose.',
    roteiro: [
      'Confirme a luz pequena e o anel linfoide contínuo: juntos identificam o órgão.',
      'Verifique a ausência de tênias — é o que separa apêndice de cólon em corte transversal.',
    ],
  },

  'liver: sinusoids': {
    panorama:
      'Os sinusoides hepáticos correm entre as placas de hepatócitos, do espaço porta para a veia centrolobular, e sua construção é feita para máxima troca. O endotélio é **descontínuo e fenestrado sem diafragma**, e **não há lâmina basal** — de modo que o plasma banha diretamente a superfície do hepatócito através do **espaço de Disse**, fenda entre o endotélio e as microvilosidades hepatocitárias. Na luz vivem as **células de Kupffer**, macrófagos residentes que depuram bactérias vindas do intestino e hemácias senescentes. No espaço de Disse ficam as **células estreladas** (de Ito), que armazenam vitamina A em gotículas lipídicas e que, ativadas na lesão crônica, viram miofibroblastos e produzem a fibrose da cirrose.',
    roteiro: [
      'Procure as células de Kupffer como núcleos maiores e irregulares dentro da luz.',
      'Note a ausência de lâmina basal — é ela que permite o contato direto plasma-hepatócito.',
    ],
  },

  'gall bladder': {
    panorama:
      'A vesícula biliar concentra e armazena a bile, e sua parede é notavelmente simples para um órgão digestivo: tem apenas **três camadas**, sem submucosa e sem muscular da mucosa. A **mucosa** é epitélio simples colunar alto com microvilosidades, apoiado em lâmina própria vascularizada, e forma pregas altas e ramificadas que, em corte, parecem criptas ou glândulas mas são apenas dobras. A **muscular** é uma malha frouxa de músculo liso em várias direções, não organizada em camadas. A camada externa é **serosa** na face livre e **adventícia** onde ela adere ao fígado. Invaginações profundas do epitélio pela muscular formam os **seios de Rokitansky-Aschoff**, achado comum na colecistite crônica.',
    roteiro: [
      'Confirme a ausência de submucosa e de muscular da mucosa antes de nomear o órgão.',
      'Distinga pregas de glândulas seguindo a continuidade com a superfície.',
    ],
  },

  'gall bladder: epithelium': {
    panorama:
      'O epitélio da vesícula biliar é simples colunar alto, com núcleos basais alinhados e microvilosidades apicais curtas e irregulares, e existe para uma tarefa específica: **absorver água e íons** para concentrar a bile em até dez vezes. O mecanismo é o transporte ativo de sódio pela membrana basolateral, que arrasta cloreto e água por via osmótica através dos espaços intercelulares laterais — que ficam visivelmente dilatados quando a vesícula está absorvendo ativamente, um dos poucos casos em que a atividade de transporte é diretamente visível na lâmina. As junções estreitas apicais impedem que a bile concentrada volte. Perto do colo há algumas glândulas tubuloalveolares mucosas, as únicas do órgão.',
    roteiro: [
      'Procure os espaços intercelulares laterais dilatados como sinal de absorção em curso.',
      'Note a ausência de células caliciformes: sua presença indicaria metaplasia.',
    ],
  },

  'pars intermedia': {
    panorama:
      'A pars intermedia é a faixa estreita entre a pars distalis e a pars nervosa, resquício da parede posterior da bolsa de Rathke, e é rudimentar no ser humano adulto. Sua marca histológica são os **folículos de Rathke**: cistos revestidos por epitélio cúbico e preenchidos por um coloide levemente acidófilo, restos da luz da bolsa embrionária, que se confundem com folículos tireoidianos à primeira vista. Ao redor há células basófilas fracamente coradas, que produzem **pró-opiomelanocortina** e seus derivados, entre eles o hormônio melanotrófico. Em outras espécies a região é bem mais desenvolvida e regula a pigmentação; no ser humano, sua função é pequena, mas a região é sítio frequente de craniofaringiomas.',
    roteiro: [
      'Use os cistos coloides como ponto de referência: eles marcam a fronteira entre as duas metades da hipófise.',
      'Não confunda com tireoide — o contexto de hipófise em volta resolve.',
    ],
  },

  endocrine: {
    panorama:
      'A secreção endócrina se define por não ter ducto: a célula libera seu produto no interstício, ele entra no capilar e alcança células-alvo distantes, que respondem se tiverem o receptor apropriado. Isso impõe uma histologia previsível — parênquima em **cordões, ninhos ou folículos**, sempre em contato íntimo com capilares fenestrados, e estroma reticular escasso. O tipo de hormônio determina a aparência da célula: as produtoras de **peptídeos e proteínas** têm RER e Golgi desenvolvidos e estocam o produto em grânulos, com citoplasma basófilo ou granular; as produtoras de **esteroides** não estocam nada, e têm REL abundante, mitocôndrias de cristas tubulares e gotículas lipídicas que deixam o citoplasma vacuolado e pálido.',
    roteiro: [
      'Classifique o citoplasma antes de tentar nomear o hormônio: granular ou vacuolado já divide o campo.',
      'Confirme a ausência de ducto e a proximidade capilar como critérios definidores.',
    ],
  },

  'diffuse lymphoid tissue': {
    panorama:
      'O tecido linfoide difuso é a forma menos organizada e mais extensa do sistema imune: linfócitos, plasmócitos, macrófagos e células dendríticas espalhados pela lâmina própria de mucosas, **sem cápsula e sem organização nodular**. É a primeira linha de vigilância nas superfícies que fazem contato com o meio — trato digestório, respiratório, urinário e genital — e sua densidade varia continuamente com a exposição antigênica local, sem que isso seja patológico. Não tem arquitetura fixa nem compartimentos B e T separados, embora costume haver predomínio de T no interstício e de plasmócitos produtores de IgA junto às glândulas. Quando a estimulação persiste, ele se organiza em nódulos, e é assim que o tecido nodular aparece.',
    roteiro: [
      'Verifique a ausência de cápsula e de nódulos antes de classificar como difuso.',
      'Procure plasmócitos junto às glândulas — eles são a fonte da IgA secretora.',
    ],
  },

  'primary lymphoid nodule': {
    panorama:
      'O nódulo linfoide primário é um agregado esférico e denso de **linfócitos B pequenos e virgens**, que ainda não encontraram seu antígeno, sustentado por uma rede de células dendríticas foliculares e fibras reticulares. É **homogeneamente escuro** em H&E, porque as células são pequenas, com pouco citoplasma e cromatina condensada, e **não tem centro germinativo** — essa uniformidade é exatamente o critério que o define e o que o distingue do nódulo secundário. Aparece no córtex do linfonodo, na polpa branca do baço e nas mucosas. Assim que um antígeno é apresentado e a resposta começa, ele se converte em nódulo secundário, com centro claro de proliferação e manto escuro periférico.',
    roteiro: [
      'Procure homogeneidade de coloração: qualquer clareamento central já indica nódulo secundário.',
      'Confirme que o agregado é esférico e delimitado, não difuso.',
    ],
  },

  'germinal center': {
    panorama:
      'O centro germinativo é a fábrica de anticorpos de alta afinidade. Forma-se dias após o contato com antígeno, quando linfócitos B ativados voltam ao folículo e proliferam intensamente. Tem duas zonas: a **zona escura**, com centroblastos em divisão rápida que sofrem **hipermutação somática** nos genes das imunoglobulinas, e a **zona clara**, com centrócitos que competem pelo antígeno apresentado nas células dendríticas foliculares e por ajuda de linfócitos T foliculares — quem tem receptor de maior afinidade sobrevive, os demais entram em apoptose. Os restos são fagocitados pelos **macrófagos de corpo tingível**, que aparecem como espaços claros salpicados no centro, o achado que dá ao conjunto o aspecto de céu estrelado.',
    roteiro: [
      'Separe zona escura e zona clara antes de descrever células isoladas.',
      'Ache os macrófagos de corpo tingível — eles confirmam a seleção em curso.',
    ],
  },

  'aggregated lymphoid nodules: tonsils': {
    panorama:
      'As tonsilas são agregados de nódulos linfoides logo abaixo do epitélio da faringe, sem cápsula completa, formando o anel de Waldeyer que guarda a entrada das vias aérea e digestória. As **palatinas** são cobertas por epitélio estratificado pavimentoso não queratinizado que mergulha em **criptas profundas e ramificadas**, o que multiplica enormemente a superfície de amostragem — e também retém detritos, motivo das amigdalites de repetição. As **faríngea** (adenoide) é coberta por epitélio respiratório pseudoestratificado ciliado e tem pregas em vez de criptas. As **linguais**, na base da língua, têm criptas rasas e únicas. Em todas, o epitélio sobre os nódulos fica infiltrado de linfócitos e perde a nitidez de camadas.',
    roteiro: [
      'Identifique o epitélio de superfície: ele diferencia as três tonsilas antes de qualquer outro dado.',
      'Verifique se há cripta e quão profunda ela é.',
    ],
  },

  'lymph node: cortex': {
    panorama:
      'O córtex do linfonodo tem dois territórios com populações distintas. O **córtex externo** é o compartimento **B**: nódulos linfoides primários e secundários alinhados sob a cápsula, com centros germinativos quando há resposta em curso. O **paracórtex**, logo abaixo, é o compartimento **T**: tecido difuso sem nódulos, mais pálido, que se expande nas respostas celulares e contém as **vênulas de endotélio alto** pelas quais os linfócitos circulantes entram no órgão. Entre a cápsula e o córtex corre o **seio subcapsular**, que recebe a linfa aferente e a distribui para os seios trabeculares e medulares. Essa geografia — B fora, T no meio, cordões e seios na medula — é a chave de leitura do órgão.',
    roteiro: [
      'Marque os três territórios antes de descrever qualquer célula.',
      'Procure vênulas de endotélio alto no paracórtex para confirmar a região.',
    ],
  },

  'spleen: red pulp': {
    panorama:
      'A polpa vermelha é o filtro do sangue e ocupa a maior parte do baço. É formada por **cordões esplênicos** (de Billroth) — tecido reticular frouxo cheio de macrófagos, linfócitos, plasmócitos e todas as células do sangue — alternados com **sinusoides esplênicos**, vasos de luz ampla revestidos por células endoteliais alongadas dispostas em paralelo, como as ripas de um barril, apoiadas em uma lâmina basal descontínua em anéis. Para voltar à circulação, a hemácia precisa **espremer-se** pelas fendas entre essas ripas: as flexíveis passam, as senescentes ou deformadas ficam retidas e são fagocitadas pelos macrófagos dos cordões. É esse teste mecânico que faz do baço o principal removedor de hemácias velhas.',
    roteiro: [
      'Distinga cordão de sinusoide pela organização dos núcleos endoteliais em paralelo.',
      'Procure macrófagos com pigmento de hemossiderina nos cordões — são o registro da hemocaterese.',
    ],
  },

  'thymus: cortex': {
    panorama:
      'O córtex do timo é intensamente **basófilo** porque está abarrotado de timócitos imaturos em proliferação, tão densos que quase escondem o estroma. Esse estroma é feito de **células epiteliorreticulares**, e não de fibras reticulares como nos demais órgãos linfoides: elas se unem por desmossomos, formam uma rede tridimensional e desempenham papéis distintos por tipo — as do tipo I revestem a cápsula e os vasos, compondo a **barreira hematotímica** que isola o córtex de antígenos circulantes; as dos tipos II e III expressam MHC e conduzem a **seleção positiva**, em que só sobrevivem os timócitos capazes de reconhecer o MHC próprio. Mais de 95% das células produzidas morrem por apoptose aqui e são removidas por macrófagos.',
    roteiro: [
      'Confirme a densidade nuclear extrema e a ausência de nódulos.',
      'Procure macrófagos com restos apoptóticos: eles são consequência normal da seleção.',
    ],
  },

  'testis proper: endocrine portion': {
    panorama:
      'A porção endócrina do testículo são as **células intersticiais de Leydig**, agrupadas em ninhos no conjuntivo entre os túbulos seminíferos, sempre junto a capilares e vasos linfáticos. São células grandes, poliédricas, com núcleo redondo e citoplasma **acidófilo e vacuolado** — a assinatura da célula esteroidogênica, com REL extenso, mitocôndrias de cristas tubulares e gotículas de colesterol. Produzem **testosterona** sob estímulo do LH, e a concentração intratesticular do hormônio é muito maior que a plasmática, condição indispensável para a espermatogênese. No ser humano contêm ainda os **cristais de Reinke**, inclusões proteicas alongadas de significado desconhecido, presentes só nesta espécie e em poucas outras.',
    roteiro: [
      'Procure ninhos acidófilos no interstício entre túbulos — a posição já sugere Leydig.',
      'Compare a cor com a das células dentro do túbulo: o contraste é imediato.',
    ],
  },

  epididymis: {
    panorama:
      'O epidídimo é um único **ducto de cinco a seis metros** enovelado sobre a face posterior do testículo, dividido em cabeça, corpo e cauda, onde o espermatozoide amadurece, adquire motilidade e é armazenado. Um corte mostra dezenas de perfis do mesmo tubo, com **luz regular e lisa** cheia de espermatozoides, revestidos por epitélio **pseudoestratificado colunar com estereocílios** — microvilosidades longas e imóveis que absorvem a maior parte do líquido vindo do testículo. As células principais são altas na cabeça e vão ficando mais baixas em direção à cauda, enquanto a camada de músculo liso engrossa no sentido inverso, de uma para três camadas, preparando a propulsão da ejaculação.',
    roteiro: [
      'Compare altura do epitélio e espessura muscular para localizar o segmento.',
      'Distinga dos dúctulos eferentes pelo contorno luminal: liso aqui, ondulado lá.',
    ],
  },

  'ovary: secondary follicle': {
    panorama:
      'O folículo secundário, ou antral, se define pelo aparecimento do **antro**: uma cavidade preenchida pelo líquido folicular, que surge entre as células da granulosa quando a proliferação já produziu várias camadas. O oócito primário, envolvido pela **zona pelúcida** — camada acidófila de glicoproteínas ZP1 a ZP3 —, fica excêntrico, apoiado sobre um pedestal de granulosa chamado **cúmulo oóforo**, e a coroa de células que o acompanha na ovulação é a **corona radiata**. Ao redor, o estroma se organiza em **teca interna**, celular, muito vascularizada e produtora de andrógenos, e **teca externa**, fibrosa. Os andrógenos da teca interna são convertidos em estrogênio pela granulosa — o modelo das duas células e duas gonadotrofinas.',
    roteiro: [
      'Ache o antro para classificar o estágio e depois localize o cúmulo oóforo.',
      'Separe teca interna de externa pela celularidade e pela vascularização.',
    ],
  },

  oviduct: {
    panorama:
      'A tuba uterina capta o oócito, oferece o ambiente da fecundação e transporta o embrião até o útero. Tem quatro segmentos — infundíbulo com fímbrias, ampola, istmo e porção intramural — e ao longo deles duas variáveis mudam em sentidos opostos: as **pregas da mucosa** vão de altíssimas e ramificadas no infundíbulo e na ampola a baixas e simples no istmo, enquanto a **camada muscular** faz o inverso, engrossando em direção ao útero. O epitélio é simples colunar com **células ciliadas**, que batem em direção ao útero, e **células secretoras** em tacha, que nutrem gameta e embrião; a proporção varia com o ciclo, com mais cílios sob estrogênio. Não há submucosa, e a serosa cobre o órgão.',
    roteiro: [
      'Use a complexidade das pregas e a espessura muscular juntas para localizar o segmento.',
      'Procure a alternância de células ciliadas e secretoras em grande aumento.',
    ],
  },

  uterus: {
    panorama:
      'O útero é um órgão muscular espesso cuja mucosa se refaz a cada ciclo. O **endométrio** tem epitélio simples colunar e glândulas tubulares simples num estroma celular semelhante a mesênquima, e se divide em camada **funcional**, que descama, e **basal**, que permanece e regenera. O **miométrio** ocupa a maior parte da parede e é músculo liso em feixes entrelaçados, com uma camada vascular média muito irrigada; na gravidez suas células hipertrofiam várias vezes e novas surgem por divisão e por diferenciação. O **perimétrio** é serosa na face posterior e adventícia na anterior inferior. A irrigação explica a fisiologia: artérias retas nutrem a basal, artérias espiraladas nutrem a funcional e são elas que se contraem na menstruação.',
    roteiro: [
      'Meça a espessura e a atividade das glândulas endometriais para datar a fase.',
      'Localize a transição endométrio-miométrio antes de descrever o estroma.',
    ],
  },

  'uterus: proliferative phase (days 6-14)': {
    panorama:
      'A fase proliferativa acompanha o crescimento dos folículos ovarianos e é comandada pelo **estrogênio**. Depois da menstruação, o endométrio recomeça a partir da camada basal: o epitélio superficial é refeito, as glândulas se alongam e a espessura sobe de menos de um milímetro para três ou mais. As **glândulas são retas, estreitas e de luz pequena**, com epitélio colunar alto e pseudoestratificado pelo grande número de mitoses; o estroma é denso, celular e também mitoticamente ativo, sem edema. As **artérias espiraladas** crescem, mas ainda não alcançam o terço superior. É a ausência de secreção na luz glandular e de vacúolos no citoplasma que separa esta fase da secretora.',
    roteiro: [
      'Procure mitoses no epitélio glandular e no estroma — elas confirmam a fase.',
      'Confirme que as glândulas são retas e sem secreção antes de datar.',
    ],
  },

  'uterus: pre-menstrual phase (days 26-28)': {
    panorama:
      'A fase pré-menstrual, ou isquêmica, é o intervalo curto entre a involução do corpo lúteo e o início do sangramento. Com a queda de progesterona e estrogênio, as **artérias espiraladas entram em constrição prolongada e intermitente**, e a camada funcional sofre isquemia: o estroma perde o edema e colapsa, a altura do endométrio diminui, as glândulas ficam com contorno serrilhado e luz irregular, e aparecem focos de necrose, extravasamento de hemácias e infiltrado de neutrófilos. As células estromais próximas às arteríolas mostram a reação decidual já regredindo. A camada **basal**, irrigada pelas artérias retas, permanece intacta — ela não participa da isquemia e é o que garante a regeneração seguinte.',
    roteiro: [
      'Procure focos de hemorragia e neutrófilos na funcional com basal preservada.',
      'Compare a altura do endométrio com a da fase secretora média: a redução é parte do achado.',
    ],
  },

  'breast: inactive': {
    panorama:
      'A mama em repouso — fora da gravidez e da lactação — é dominada por **estroma**, não por glândula. O parênquima é escasso: unidades ducto-lobulares terminais com ductos revestidos por epitélio cúbico a colunar de duas camadas, com células mioepiteliais na periferia, e ácinos rudimentares ou ausentes, presentes apenas como brotos sólidos. Cada lóbulo é envolvido por um **estroma intralobular** frouxo, celular e hormônio-responsivo, que se destaca claramente do **estroma interlobular**, denso, fibroso e adiposo, que compõe a maior parte do volume da mama. Ao longo do ciclo menstrual há discreta proliferação e edema na fase lútea, o que explica a sensibilidade mamária pré-menstrual.',
    roteiro: [
      'Separe os dois estromas: o contraste entre frouxo intralobular e denso interlobular identifica a mama.',
      'Procure a camada mioepitelial nos ductos — sua presença é critério de benignidade.',
    ],
  },

  'nasal cavities: mucosae': {
    panorama:
      'A cavidade nasal tem três mucosas com funções distintas. A do **vestíbulo** é pele modificada, com epitélio estratificado pavimentoso queratinizado, pelos grossos (vibrissas) e glândulas sebáceas e sudoríparas, que filtram partículas grandes. A **mucosa respiratória**, que cobre a maior parte, tem epitélio pseudoestratificado ciliado com caliciformes sobre lâmina própria com glândulas seromucosas e um plexo venoso volumoso, os **corpos cavernosos** dos cornetos, que aquecem e umidificam o ar — e cujo ingurgitamento alternado produz o ciclo nasal. A **mucosa olfatória**, no teto, é epitélio pseudoestratificado alto sem caliciformes, amarelado, com as glândulas de Bowman na lâmina própria.',
    roteiro: [
      'Localize-se pelo epitélio: os três tipos correspondem a três regiões bem definidas.',
      'Procure o plexo venoso na lâmina própria dos cornetos, típico da mucosa respiratória.',
    ],
  },

  'nasal cavities: olfactory epithelium': {
    panorama:
      'O epitélio olfatório é pseudoestratificado colunar **muito alto e sem células caliciformes**, e reúne três tipos celulares dispostos em camadas reconhecíveis. Os **neurônios olfatórios bipolares** ficam no meio: seu dendrito sobe até a superfície e termina numa vesícula da qual partem cílios imóveis e longos, com os receptores odoríferos, e seu axônio desce e se agrupa em filetes que atravessam a lâmina crivosa até o bulbo olfatório — são os únicos neurônios em contato direto com o meio externo, e os únicos que se **renovam** ao longo da vida, a partir das **células basais**. As **células de sustentação**, altas, com núcleos apicais, formam a camada superior. Na lâmina própria, as **glândulas de Bowman** secretam o fluido seroso que dissolve os odorantes.',
    roteiro: [
      'Confirme a ausência de caliciformes e a altura do epitélio para separá-lo do respiratório.',
      'Identifique as três faixas de núcleos: sustentação em cima, neurônios no meio, basais embaixo.',
    ],
  },

  'terminal bronchiole': {
    panorama:
      'O bronquíolo terminal é o último segmento **exclusivamente condutor** da árvore respiratória: nele ainda não há alvéolos, e portanto nenhuma troca gasosa. Tem menos de 0,5 mm de diâmetro, epitélio **simples cúbico** com poucas células ciliadas e predomínio de **células club** (Clara), não ciliadas, de ápice abaulado, que secretam surfactante proteico, detoxificam xenobióticos e servem de célula-tronco do epitélio bronquiolar. Não há cartilagem, glândulas nem caliciformes; há uma camada de músculo liso proporcionalmente espessa e completa. O conjunto formado por um bronquíolo terminal e tudo o que dele deriva é o **ácino pulmonar**, unidade funcional do pulmão.',
    roteiro: [
      'Percorra a parede inteira: um único alvéolo abrindo-se nela já o reclassifica como respiratório.',
      'Procure os ápices abaulados das células club no epitélio cúbico.',
    ],
  },

  'respiratory bronchiole': {
    panorama:
      'O bronquíolo respiratório é a **zona de transição** entre condução e troca, e sua identificação depende de um único achado: a parede é predominantemente bronquiolar, com epitélio cúbico e músculo liso, mas **interrompida por alvéolos** que se abrem diretamente nela. Onde há alvéolo, o epitélio se adelgaça abruptamente para pavimentoso; entre eles, permanece cúbico com células club. Quanto mais distal o segmento, mais alvéolos e menos parede própria, até que a estrutura se converte em ducto alveolar. É também o primeiro ponto em que o ar inspirado pode ser trocado, e o sítio inicial das lesões do enfisema centrolobular do tabagismo.',
    roteiro: [
      'Percorra a circunferência procurando a interrupção da parede por alvéolos.',
      'Note a mudança abrupta de epitélio nas bordas de cada abertura alveolar.',
    ],
  },

  'alveolar ducts': {
    panorama:
      'O ducto alveolar é o segmento em que a parede própria praticamente desapareceu: ele é pouco mais que um corredor **inteiramente delimitado pelas aberturas de alvéolos e sacos alveolares**. O que sobra de estrutura são pequenos nós ou botões nas bordas entre aberturas vizinhas, contendo feixes de **músculo liso**, fibras elásticas e colágenas, revestidos por epitélio cúbico baixo — em corte, esses nós aparecem como espessamentos arredondados que se repetem regularmente ao longo do ducto, e são o achado que o identifica. As fibras elásticas ali ancoradas formam uma rede contínua responsável pelo recuo elástico da expiração, e sua destruição é o mecanismo central do enfisema.',
    roteiro: [
      'Procure os botões de músculo liso nas bordas das aberturas — é o critério, não o calibre.',
      'Siga o ducto até os sacos alveolares para confirmar a sequência.',
    ],
  },

  'alveolar duct': {
    panorama:
      'O ducto alveolar sucede o bronquíolo respiratório e antecede os sacos alveolares. Sua característica é a ausência quase completa de parede própria: o corredor é definido pelas bocas dos alvéolos que se abrem em toda a sua extensão, e a estrutura remanescente se resume a **nós de músculo liso**, elastina e colágeno nas bordas entre aberturas, revestidos por um epitélio cúbico baixo que rapidamente se torna pavimentoso dentro do alvéolo. Esses nós, em corte, aparecem como pequenos botões arredondados repetidos, e distinguem o ducto do saco alveolar, que já não os tem. É aqui que a troca gasosa se torna a função dominante do segmento.',
    roteiro: [
      'Conte os botões ao longo do corredor: sua presença separa ducto de saco alveolar.',
      'Verifique se ainda resta epitélio cúbico entre as aberturas.',
    ],
  },

  'alveolar macrophage': {
    panorama:
      'O macrófago alveolar, ou célula da poeira, é a principal defesa celular do espaço aéreo. Deriva de monócitos do sangue e circula livremente **sobre a superfície alveolar**, dentro do filme de surfactante, fagocitando partículas inaladas, microrganismos e o surfactante usado — cerca de dez por cento da renovação do surfactante é feita por ele. Em H&E aparece como célula grande e arredondada, de citoplasma abundante e frequentemente **pigmentado**: acastanhado por carbono em fumantes e moradores de cidades, ou com hemossiderina na congestão pulmonar crônica, quando é chamado de célula da insuficiência cardíaca. Depois de carregado, migra pelos bronquíolos e é eliminado no escarro ou pelos linfáticos.',
    roteiro: [
      'Procure células livres na luz alveolar, não na parede — a posição é parte da identificação.',
      'Descreva o pigmento: ele conta a história de exposição do paciente.',
    ],
  },

  respiratory: {
    panorama:
      'O sistema respiratório se divide funcionalmente em duas porções. A **porção condutora** — cavidades nasais, faringe, laringe, traqueia, brônquios e bronquíolos até os terminais — leva o ar e o condiciona: aquece, umidifica e filtra, tarefas cumpridas pelo plexo venoso da mucosa, pelas glândulas seromucosas e pelo **aparelho mucociliar**, que move o muco com as partículas retidas em direção à faringe. A **porção respiratória** — bronquíolos respiratórios, ductos e sacos alveolares e alvéolos — faz a hematose. A transição entre elas é gradual e legível: a cartilagem some, as glândulas somem, as caliciformes somem, o epitélio baixa de pseudoestratificado ciliado a pavimentoso, e o músculo liso ganha importância relativa.',
    roteiro: [
      'Situe o segmento pela sequência de desaparecimentos: cartilagem, glândulas, caliciformes, cílios.',
      'Procure o primeiro alvéolo abrindo-se na parede para marcar o início da porção respiratória.',
    ],
  },

  'blood supply': {
    panorama:
      'O suprimento sanguíneo de um órgão é parte da sua histologia, não um detalhe acessório: a arquitetura do leito vascular determina o que o parênquima consegue fazer. Há padrões que se repetem. O mais comum é **artéria, arteríola, capilar, vênula, veia** em série. Outros órgãos têm **sistemas porta**, em que dois leitos capilares ficam em série sem passar pelo coração — o porta-hepático, que leva ao fígado o sangue absorvido no intestino, e o porta-hipofisário, que leva ao lobo anterior os fatores liberadores do hipotálamo. Há ainda a **circulação dupla** do pulmão e do fígado, com um vaso funcional e um nutritivo, e as **anastomoses arteriovenosas**, atalhos que desviam o sangue do leito capilar na termorregulação.',
    roteiro: [
      'Identifique o padrão antes de descrever vasos isolados — ele explica a função do órgão.',
      'Procure dois leitos capilares em série antes de descartar a hipótese de sistema porta.',
    ],
  },

  'pulmonary capillaries': {
    panorama:
      'Os capilares pulmonares formam a rede mais densa do corpo: eles preenchem quase inteiramente o septo interalveolar, e o sangue corre em uma lâmina praticamente contínua, exposta ao ar dos dois lados. São capilares **contínuos**, com endotélio não fenestrado e junções estreitas, o que impede o extravasamento de plasma para o alvéolo — condição indispensável, já que fluido no espaço aéreo bloqueia a troca. A hemácia passa por eles em cerca de 0,75 segundo em repouso, tempo três vezes maior que o necessário para equilibrar o oxigênio, o que dá ao pulmão uma reserva funcional grande. A parede compartilha lâmina basal com o pneumócito tipo I, formando a barreira ar-sangue de aproximadamente 0,2 µm.',
    roteiro: [
      'Siga um capilar ao longo do septo e conte quantos alvéolos ele atende.',
      'Confirme o endotélio contínuo: fenestração aqui seria incompatível com a função.',
    ],
  },

  nephron: {
    panorama:
      'O néfron é a unidade funcional do rim, e são cerca de um milhão em cada um. Começa no **corpúsculo renal**, com o glomérulo e a cápsula de Bowman, onde o plasma é filtrado; segue pelo **túbulo contorcido proximal**, que reabsorve dois terços do filtrado, toda a glicose e os aminoácidos, com epitélio acidófilo e borda em escova; desce pela **alça de Henle**, com porções fina e espessa, que cria o gradiente osmótico medular por multiplicação em contracorrente; e termina no **túbulo contorcido distal**, que ajusta sódio, potássio e ácido sob aldosterona. Os néfrons **corticais** têm alças curtas; os **justamedulares**, alças longas que descem fundo na medula e são os responsáveis pela concentração da urina. O ducto coletor recebe vários néfrons e responde ao ADH.',
    roteiro: [
      'Percorra o néfron na ordem funcional e nomeie o epitélio de cada segmento.',
      'Use a acidofilia e a borda em escova para separar proximal de distal em qualquer campo.',
    ],
  },

  'cortex: juxtaglomerular apparatus': {
    panorama:
      'O aparelho justaglomerular é o sensor que regula a pressão arterial e a filtração, e fica no polo vascular do corpúsculo, onde o túbulo contorcido distal do **próprio néfron** volta e encosta na arteríola aferente. Tem três componentes. A **mácula densa** é a região do túbulo distal ali encostada, com células mais altas e núcleos apinhados, que detecta a concentração de cloreto de sódio no fluido tubular. As **células justaglomerulares** são células musculares lisas modificadas da parede da arteríola aferente, com grânulos de **renina**, que respondem à queda de pressão. As **células mesangiais extraglomerulares** (de Lacis) ficam no triângulo entre as duas e fazem a comunicação. Juntos comandam o sistema renina-angiotensina-aldosterona.',
    roteiro: [
      'Ache o polo vascular primeiro; sem ele, o aparelho não pode ser identificado.',
      'Procure o adensamento de núcleos na parede tubular voltada para a arteríola.',
    ],
  },

  'cortex: medullary ray': {
    panorama:
      'O raio medular é, apesar do nome, uma estrutura **do córtex**: uma faixa de túbulos retos que desce da medula e penetra o córtex, dando-lhe o aspecto listrado. Contém os segmentos **retos** — porção reta do túbulo proximal, ramo espesso ascendente da alça e ducto coletor — e nenhum corpúsculo renal, já que estes ficam apenas na porção contorcida ao redor. Um raio medular com a porção contorcida que o cerca constitui o **lóbulo renal**; um conjunto de raios e a pirâmide a que pertencem constitui o **lobo renal**. Reconhecer o raio é a maneira mais rápida de se orientar em um corte de rim, porque ele dá a direção do eixo córtico-medular.',
    roteiro: [
      'Procure faixas de perfis tubulares alinhados sem glomérulos entre eles.',
      'Use a direção do raio para orientar o corte no eixo córtex-medula.',
    ],
    atencao:
      'Apesar do nome, ele está no córtex; confundi-lo com medula inverte toda a leitura da lâmina.',
  },

  'renal papilla': {
    panorama:
      'A papila renal é o ápice da pirâmide medular e o ponto em que a urina deixa o parênquima. É formada quase inteiramente por **ductos coletores** de grande calibre — os ductos papilares, ou de Bellini —, revestidos por epitélio simples colunar alto e pálido com limites celulares nítidos, além de alças finas e vasos retos, tudo em um interstício abundante. Os ductos se abrem na superfície por dezenas de orifícios que formam a **área crivosa**. O epitélio de revestimento da papila é urotélio, que se continua com o do cálice menor que a abraça. É também o território de maior osmolaridade do rim, e por isso o mais vulnerável à isquemia, o que explica a necrose de papila em diabéticos e no abuso de analgésicos.',
    roteiro: [
      'Procure ductos de grande calibre com limites celulares visíveis convergindo para o ápice.',
      'Ache a transição para urotélio na superfície da papila.',
    ],
  },

  'excretory passageways': {
    panorama:
      'As vias excretoras — cálices, pelve, ureter, bexiga e uretra proximal — repetem um plano comum e existem para conduzir e armazenar urina sem serem alteradas por ela. A **mucosa** é forrada por **urotélio**, epitélio estratificado impermeável cujas células superficiais em guarda-chuva têm placas de uroplaquina, e assenta sobre lâmina própria de conjuntivo denso; não há submucosa nem glândulas, exceto na uretra. A **muscular** é músculo liso em feixes entrelaçados, geralmente descrito como duas camadas, longitudinal interna e circular externa — arranjo **inverso** ao do tubo digestório —, com uma terceira longitudinal externa no terço distal do ureter e na bexiga. A camada externa é adventícia, e serosa apenas onde há peritônio.',
    roteiro: [
      'Confirme o urotélio antes de tudo: ele identifica a via urinária em qualquer nível.',
      'Note a inversão das camadas musculares em relação ao intestino.',
    ],
  },

  ureter: {
    panorama:
      'O ureter é um tubo de aproximadamente 25 cm que conduz a urina da pelve renal à bexiga por peristalse, e seu corte transversal é uma das imagens mais reconhecíveis da histologia: a mucosa se pregueia longitudinalmente com o órgão vazio, dando à luz um contorno **estrelado** característico. O **urotélio** tem quatro a cinco camadas, com células em guarda-chuva na superfície, e a lâmina própria é de conjuntivo denso, sem glândulas. A muscular tem **longitudinal interna e circular externa** — ordem oposta à do intestino —, com uma terceira camada longitudinal externa no terço inferior. A adventícia prende o órgão ao retroperitônio. Na entrada da bexiga o trajeto oblíquo intramural funciona como válvula, impedindo o refluxo.',
    roteiro: [
      'Reconheça a luz estrelada e depois confirme o urotélio.',
      'Conte as camadas musculares e verifique a ordem antes de compará-lo ao intestino.',
    ],
  },

  simple: {
    panorama:
      'Um epitélio é **simples** quando todas as suas células tocam a lâmina basal e alcançam a superfície livre — uma camada única, portanto. Ele aparece onde a demanda é de **troca, absorção ou secreção**, e não de proteção contra atrito: pavimentoso simples em endotélios, mesotélios e alvéolos, onde a fina espessura favorece a difusão; cúbico simples em ductos e túbulos; colunar simples no estômago, no intestino e na vesícula biliar. Um cuidado prático domina a classificação: em **corte oblíquo**, um epitélio simples pode parecer estratificado, porque o plano atravessa células em alturas diferentes. A conferência dos núcleos em relação à lâmina basal, e não a impressão geral, é o que decide.',
    roteiro: [
      'Confira se todos os núcleos se alinham na mesma altura em relação à lâmina basal.',
      'Desconfie de espessamentos localizados: quase sempre são artefato de plano de corte.',
    ],
  },

  stereocilia: {
    panorama:
      'Apesar do nome, estereocílios **não são cílios**: são microvilosidades muito longas, imóveis, sustentadas por feixes de **actina** — e não pelo axonema de microtúbulos —, frequentemente ramificadas e agrupadas em tufos que se aglutinam nas pontas. Existem em três lugares, com funções diferentes. No **epidídimo** e no **ducto deferente**, são altíssimos e servem à absorção do líquido que vem do testículo, aumentando enormemente a área apical. Na **célula ciliada** do ouvido interno, formam feixes escalonados em degraus cuja deflexão abre canais de transdução, ligados uns aos outros por pontes; ali eles são o próprio mecanismo da audição e do equilíbrio, e sua perda é irreversível.',
    roteiro: [
      'Diferencie de cílios pelo comprimento e pela ausência de corpúsculo basal na base.',
      'Use a localização como confirmação: só três epitélios os têm.',
    ],
  },

  desmosomes: {
    panorama:
      'O desmossomo, ou mácula de adesão, é uma junção **pontual** — não circunda a célula — feita para resistir a tração. Nas duas membranas aderidas há uma **placa de ancoragem** citoplasmática densa, com desmoplaquina e placoglobina, na qual se inserem **filamentos intermediários**: queratinas nos epitélios, desmina no músculo cardíaco. Atravessando o espaço intercelular, caderinas da família das desmogleínas e desmocolinas ligam as duas placas. O resultado é uma rede contínua de filamentos que atravessa o tecido inteiro célula a célula, distribuindo a força mecânica — é ela que faz a epiderme resistir à abrasão. Autoanticorpos contra desmogleína 3 destroem essa ligação e produzem as bolhas do pênfigo vulgar.',
    roteiro: [
      'Procure os "espinhos" da camada espinhosa: cada um marca um desmossomo.',
      'Confirme em microscopia eletrônica pelas placas simétricas e pelos filamentos convergindo.',
    ],
  },

  'overview of exocrine glands': {
    panorama:
      'As glândulas exócrinas se classificam por três critérios independentes, e responder aos três resolve qualquer lâmina. Primeiro, o **número de células**: unicelular, como a célula caliciforme, ou multicelular. Segundo, a **forma do ducto**: **simples** quando não ramifica, **composta** quando ramifica. Terceiro, a **forma da porção secretora**: tubular, acinar (alveolar) ou tubuloacinar, e cada uma pode ainda ser reta, enovelada ou ramificada. A isso soma-se a **natureza do produto** — serosa, mucosa ou mista — e o **mecanismo de liberação**: **merócrina**, por exocitose, sem perda de citoplasma, que é a regra; **apócrina**, com perda de parte do ápice, como no lipídio do leite; e **holócrina**, com destruição da célula inteira, como na sebácea.',
    roteiro: [
      'Responda aos três critérios em ordem antes de nomear a glândula.',
      'Não confunda a classificação do ducto com a da porção secretora — são eixos independentes.',
    ],
  },

  'sheet gland': {
    panorama:
      'A glândula em lâmina, ou epitélio secretor de superfície, é a forma mais simples de secreção multicelular: **todo o epitélio de revestimento secreta**, sem que exista uma porção secretora individualizada nem ducto. O exemplo clássico é o **epitélio superficial do estômago**, cujas células colunares produzem, todas elas, um muco neutro espesso que forma sobre a mucosa uma camada de gel aderente com bicarbonato, protegendo-a do ácido e da pepsina que ela mesma secreta. É por isso que no estômago não há células caliciformes: a função delas já é cumprida pelo epitélio inteiro. O conceito ajuda a entender que "glândula" descreve uma função, não obrigatoriamente uma estrutura separada.',
    roteiro: [
      'Note que não há ducto nem porção secretora distinta — é o critério da categoria.',
      'Compare com a célula caliciforme, em que só algumas células do epitélio secretam.',
    ],
  },

  'simple, branched tubular gland': {
    panorama:
      'Nesta configuração há um **único ducto** — daí "simples" — no qual desembocam duas ou mais porções secretoras tubulares, que por isso se dizem ramificadas. As **glândulas gástricas** do fundo e do corpo são o exemplo padrão: várias glândulas tubulares confluem para uma mesma fosseta. O mesmo arranjo aparece nas glândulas pilóricas, nas cárdicas, nas glândulas uterinas e nas de Brunner do duodeno. A distinção em relação à glândula composta é fácil de errar e vale insistir: o que define "composta" é a **ramificação do ducto**, não a da porção secretora. Aqui o ducto é único do início ao fim, e apenas as porções secretoras se multiplicam a partir dele.',
    roteiro: [
      'Siga o ducto até a superfície: se ele não se dividir, a glândula é simples.',
      'Conte quantas porções secretoras desembocam no mesmo ducto para confirmar a ramificação.',
    ],
  },

  'basic tissues in organs': {
    panorama:
      'Todo órgão do corpo é montado a partir de **quatro tecidos básicos**, e essa redução é a maior economia conceitual da histologia. O **epitelial** reveste superfícies e forma glândulas: células justapostas, pouca matriz, apoiadas em lâmina basal, avasculares. O **conjuntivo** conecta e sustenta: células dispersas em matriz abundante, com fibras e substância fundamental, vascularizado. O **muscular** contrai: células alongadas cheias de filamentos de actina e miosina, em três variedades. O **nervoso** conduz e integra: neurônios e glia. Um órgão maciço qualquer combina os quatro — parênquima epitelial, estroma conjuntivo, vasos com músculo liso e inervação autonômica —, e nomeá-los separadamente antes de descrever é o método mais seguro.',
    roteiro: [
      'Percorra o campo identificando os quatro tecidos antes de tentar nomear o órgão.',
      'Use a proporção entre eles como pista: ela varia caracteristicamente de órgão para órgão.',
    ],
  },

  'connective tissue proper overview': {
    panorama:
      'O conjuntivo propriamente dito é o subgrupo do tecido conjuntivo que exclui as variedades especializadas — cartilagem, osso, sangue e hemocitopoético. É definido pela matriz: **fibras colágenas** grossas e acidófilas, que resistem à tração; **fibras reticulares** de colágeno III, finas, argirófilas, que formam malhas de sustentação em órgãos linfoides e glandulares; e **fibras elásticas**, finas e onduladas, que devolvem a forma. Entre elas há substância fundamental de proteoglicanos e glicosaminoglicanos altamente hidratada. As células residentes constroem e mantêm — fibroblasto, adipócito, macrófago, mastócito —, e as transitórias chegam do sangue na resposta imune. A classificação em frouxo e denso, e este em modelado e não modelado, cobre praticamente todos os casos.',
    roteiro: [
      'Comece pela matriz: tipo de fibra dominante e proporção em relação às células.',
      'Só depois nomeie as células, separando residentes de transitórias.',
    ],
  },

  macrophage: {
    panorama:
      'O macrófago deriva do monócito circulante, que atravessa a parede vascular e se diferencia no tecido, onde pode viver meses. É uma célula grande, de contorno irregular, com **núcleo reniforme ou indentado** e citoplasma abundante e frequentemente vacuolado, muitas vezes contendo material fagocitado — o que é, na prática, a melhor pista de identificação em H&E, já que sem inclusões ele se confunde com o fibroblasto. Faz três coisas: **fagocita** microrganismos, restos celulares e partículas; **apresenta antígeno** aos linfócitos T via MHC de classe II; e **secreta** dezenas de mediadores. Recebe nomes locais conforme o órgão: células de Kupffer no fígado, micróglia no sistema nervoso, osteoclastos no osso, células de Langerhans na pele.',
    roteiro: [
      'Procure inclusões no citoplasma antes de tentar distinguir do fibroblasto pelo núcleo.',
      'Lembre dos nomes locais: a mesma célula muda de nome conforme o tecido.',
    ],
  },

  eosinophil: {
    panorama:
      'O eosinófilo representa de 1 a 4% dos leucócitos e é reconhecido por dois traços simultâneos: **núcleo bilobado**, com os lobos ligados por um filamento fino, e **grânulos específicos grandes, uniformes e intensamente acidófilos**, corados de laranja-avermelhado pela eosina. Em microscopia eletrônica esses grânulos têm um cristaloide central de **proteína básica principal**, tóxica para helmintos — sua função primária. Participa também das reações alérgicas, onde modula e ao mesmo tempo amplifica a resposta, degradando histamina e leucotrienos mas lesando o epitélio brônquico na asma crônica. Migra rapidamente para os tecidos, sobretudo os de mucosa, onde reside em número muito maior que no sangue.',
    roteiro: [
      'Confirme os dois lobos e a uniformidade dos grânulos — o neutrófilo tem mais lobos e grânulos finos.',
      'Procure eosinófilos na lâmina própria intestinal, onde são normais em pequeno número.',
    ],
  },

  'reticular fibers': {
    panorama:
      'As fibras reticulares são feitas de **colágeno tipo III** e formam malhas tridimensionais delicadas, de 0,5 a 2 µm, em vez dos feixes grossos do tipo I. São muito glicosiladas, e é essa característica que as torna **argirófilas** — impregnam-se por sais de prata, aparecendo pretas — e **PAS-positivas**, enquanto em H&E passam praticamente despercebidas. Formam o arcabouço de sustentação onde as células precisam de suporte sem rigidez: órgãos linfoides e hemocitopoéticos, fígado, glândulas endócrinas, e ao redor de fibras musculares, adipócitos e nervos. Também são o primeiro colágeno depositado na cicatrização e no tecido embrionário, sendo depois substituídas por tipo I.',
    roteiro: [
      'Peça impregnação por prata: em H&E a rede reticular é praticamente invisível.',
      'Relacione a presença de rede reticular à necessidade de sustentar células soltas.',
    ],
  },

  'bone cells: osteoblasts': {
    panorama:
      'O osteoblasto deriva de células osteoprogenitoras do periósteo e do endósteo e é a célula que **constrói** o osso. Enquanto ativo, é cúbico a colunar, com citoplasma **intensamente basófilo** pelo RER abundante e um halo claro correspondente ao Golgi, e dispõe-se em uma camada contínua sobre a superfície óssea, lado a lado, como um epitélio — arranjo que é a melhor pista de identificação. Secreta o **osteoide**, matriz orgânica não mineralizada de colágeno tipo I, osteocalcina e osteonectina, e depois promove sua mineralização liberando vesículas com fosfatase alcalina. Ao ser cercado pela matriz que produziu, torna-se **osteócito**. Também comanda a reabsorção indiretamente, expressando RANKL, que ativa os osteoclastos.',
    roteiro: [
      'Procure a fileira contínua de células cúbicas basófilas sobre a superfície óssea.',
      'Note a faixa pálida de osteoide entre o osteoblasto e o osso mineralizado.',
    ],
  },

  'bone cells: osteoclasts': {
    panorama:
      'O osteoclasto é a célula que **reabsorve** o osso, e não pertence à linhagem óssea: deriva da fusão de precursores monocíticos, e por isso é **multinucleada**, com cinco a cinquenta núcleos, gigante e intensamente **acidófila**. Assenta-se em depressões da superfície óssea chamadas **lacunas de Howship**, que ela mesma escava. Sua face voltada ao osso tem duas regiões: a **zona clara**, um anel de adesão selado por integrinas, e a **borda pregueada**, invaginações profundas que ampliam a área de secreção. Ali ela bombeia prótons, acidificando o compartimento selado e dissolvendo a hidroxiapatita, e libera catepsina K e metaloproteinases que digerem o colágeno. É ativada por RANKL e inibida por osteoprotegerina e calcitonina.',
    roteiro: [
      'Procure a célula gigante multinucleada dentro de uma depressão da superfície — os dois achados juntos.',
      'Note a borda pregueada voltada para o osso em grande aumento.',
    ],
  },

  'bone matrix: remodeling (compact bone)': {
    panorama:
      'A remodelação do osso compacto ocorre por **unidades de remodelação óssea** que avançam pelo tecido como um túnel escavando e reconstruindo. À frente vai um **cone de corte** de osteoclastos, que perfura um canal cilíndrico ao longo do eixo do osso; atrás dele entram vasos e, na superfície do túnel recém-aberto, osteoblastos depositam lamelas concêntricas de dentro para fora, até que o canal se estreite e vire o **canal de Havers** de um **ósteon** novo. Por isso o osso compacto adulto é um mosaico de ósteons de idades diferentes, separados por **linhas de cementação**, e cheio de **lamelas intersticiais**, restos de ósteons antigos parcialmente destruídos pelos mais novos.',
    roteiro: [
      'Compare o número de lamelas e a nitidez das linhas de cementação entre ósteons vizinhos.',
      'Procure lamelas intersticiais entre os ósteons — elas são o registro das gerações anteriores.',
    ],
  },

  'bone matrix: remodeling (spongy bone)': {
    panorama:
      'No osso esponjoso a remodelação não escava túneis: ela ocorre **na superfície das trabéculas**, que são finas e banhadas pela medula, de modo que osteoclastos e osteoblastos trabalham lado a lado sobre a mesma face. Um osteoclasto escava uma lacuna de Howship, e osteoblastos a preenchem com lamelas paralelas ao contorno da trabécula — daí o padrão de lamelas planas, não concêntricas, que caracteriza o osso esponjoso. Como a área de superfície por unidade de volume é muito maior que no compacto, o esponjoso tem **taxa de renovação várias vezes mais rápida**, e é ele que responde primeiro a alterações metabólicas: é onde a osteoporose se manifesta antes, e é por isso que a fratura vertebral precede a do colo do fêmur.',
    roteiro: [
      'Confirme que as lamelas acompanham o contorno da trabécula em vez de formar círculos.',
      'Procure osteoclastos e osteoblastos na mesma superfície — a proximidade é característica.',
    ],
  },

  "bone: volkmann's canal": {
    panorama:
      'Os canais de Volkmann, ou canais perfurantes, são condutos vasculares que atravessam o osso compacto **transversal ou obliquamente ao eixo longo**, conectando os canais de Havers entre si e ligando-os às superfícies periosteal e endosteal. Essa orientação é o que os define e distingue: em um corte transversal do osso, os canais de Havers aparecem como círculos no centro de cada ósteon, e os de Volkmann como canais que cruzam de lado, atravessando lamelas em vez de serem envolvidos por elas. Não têm lamelas concêntricas próprias — outro critério prático. Trazem vasos, nervos e linfáticos do periósteo para o interior, garantindo que nenhum osteócito fique a mais de 200 µm de um capilar.',
    roteiro: [
      'Verifique a orientação e a ausência de lamelas concêntricas para separar de um canal de Havers.',
      'Siga o canal até ver se ele conecta dois ósteons ou alcança a superfície.',
    ],
  },

  'bone: resorption': {
    panorama:
      'A reabsorção óssea é feita pelo osteoclasto em um compartimento selado, e o processo tem duas etapas químicas distintas. Primeiro, o **componente mineral**: bombas de prótons na borda pregueada acidificam o espaço abaixo da célula até pH próximo de 4,5, dissolvendo a hidroxiapatita e liberando cálcio e fosfato. Depois, o **componente orgânico**: a catepsina K e metaloproteinases digerem o colágeno tipo I exposto. O resultado é uma cavidade escavada, a lacuna de Howship. O controle é hormonal e local: o PTH age indiretamente, estimulando o osteoblasto a produzir **RANKL**, que ativa o osteoclasto; a osteoprotegerina bloqueia essa via; e a calcitonina inibe o osteoclasto diretamente. Bisfosfonatos exploram exatamente esse eixo.',
    roteiro: [
      'Procure a lacuna escavada e a célula gigante dentro dela para documentar reabsorção ativa.',
      'Note que o osteoblasto vizinho participa do controle — a reabsorção não é autônoma.',
    ],
  },

  'bone: interstitial lamellae': {
    panorama:
      'As lamelas intersticiais são **fragmentos de ósteons antigos** que sobreviveram parcialmente à remodelação e ficaram encaixados entre os ósteons atuais. Reconhecem-se por serem arcos de lamelas paralelas, sem canal central próprio, com contorno angular e limitados por **linhas de cementação** — faixas de matriz pobre em colágeno e rica em glicoproteínas que marcam onde uma unidade de remodelação parou. Sua presença é a prova histológica de que o osso compacto é continuamente reconstruído: em um corte transversal, elas ocupam todo o espaço entre ósteons completos, e sua abundância aumenta com a idade, à medida que gerações sucessivas de ósteons se sobrepõem.',
    roteiro: [
      'Procure grupos de lamelas sem canal central entre ósteons completos.',
      'Siga as linhas de cementação para reconstruir mentalmente qual ósteon veio antes.',
    ],
  },

  blood: {
    panorama:
      'O sangue é um tecido conjuntivo especializado cuja matriz é líquida: o **plasma**, 55% do volume, com água, albumina, globulinas, fibrinogênio, íons e nutrientes. Os elementos figurados são três. As **hemácias**, anucleadas e bicôncavas, com 7,5 µm, transportam gases — seu diâmetro constante faz delas a régua natural de toda lâmina. Os **leucócitos** dividem-se em granulócitos (neutrófilo, eosinófilo, basófilo) e agranulócitos (linfócito, monócito), e só cumprem função depois de deixar o vaso. As **plaquetas** são fragmentos de megacariócito, sem núcleo, que iniciam a hemostasia. Ao contrário dos demais conjuntivos, as células não produzem a matriz em que estão, e não há fibras — exceto durante a coagulação, quando o fibrinogênio vira fibrina.',
    roteiro: [
      'Use a hemácia como referência de tamanho para calibrar o restante do campo.',
      'Peça um esfregaço corado por Giemsa ou Wright: em corte histológico os leucócitos são difíceis de tipar.',
    ],
  },

  'blood: neutrophil': {
    panorama:
      'O neutrófilo é o leucócito mais numeroso, de 50 a 70% do total, e a primeira célula a chegar em uma infecção bacteriana aguda. Identifica-se pelo **núcleo multilobado**, com três a cinco lobos unidos por filamentos finos — daí "polimorfonuclear" —, e por grânulos citoplasmáticos pequenos e pouco corados, que lhe dão aspecto rosa-acinzentado. São dois tipos de grânulo: os **azurófilos** (primários), que são lisossomos com mieloperoxidase, e os **específicos** (secundários), com lisozima, lactoferrina e colagenase. Sobrevive poucas horas no sangue e um a dois dias no tecido. Um aumento na proporção de formas jovens, com núcleo em bastão, é o chamado desvio à esquerda, indicando demanda aguda.',
    roteiro: [
      'Conte os lobos: o número separa neutrófilo de eosinófilo com segurança.',
      'Note que os grânulos são finos e pálidos, o oposto dos grânulos do eosinófilo.',
    ],
  },

  'blood: lymphocyte': {
    panorama:
      'O linfócito é o segundo leucócito mais numeroso e o único que **recircula** entre sangue, linfa e tecidos, podendo viver anos. Em esfregaço, o pequeno linfócito é pouco maior que uma hemácia e tem núcleo redondo, escuro e denso, ocupando quase toda a célula, com apenas uma orla fina de citoplasma basófilo — morfologia que não permite distinguir suas classes funcionais. **B**, **T** e **NK** só se separam por marcadores de superfície: os B originam plasmócitos e anticorpos, os T dividem-se em auxiliares e citotóxicos e comandam a imunidade celular, e os NK matam células infectadas e tumorais sem sensibilização prévia. Ativado, o linfócito aumenta de tamanho, o citoplasma fica mais azul e o nucléolo aparece.',
    roteiro: [
      'Compare o tamanho com a hemácia vizinha para separar linfócito pequeno de monócito.',
      'Não tente classificar em B ou T pela morfologia — é impossível sem imunofenotipagem.',
    ],
  },

  'reticular connective tissue': {
    panorama:
      'O tecido conjuntivo reticular é uma variedade especializada cuja matriz é dominada por **fibras reticulares de colágeno tipo III**, produzidas por **células reticulares** — fibroblastos modificados que não apenas fabricam a rede, mas se apoiam sobre ela, envolvendo-a com seus prolongamentos. O resultado é uma malha tridimensional frouxa e macia, capaz de sustentar células livres sem restringir seu movimento, e por isso é o estroma dos órgãos hemocitopoéticos e linfoides: medula óssea, linfonodo, baço, e também do fígado e de glândulas endócrinas. Em H&E é quase invisível, e só a impregnação por prata revela a rede — motivo pelo qual essa arquitetura passa despercebida na maioria das lâminas de rotina.',
    roteiro: [
      'Peça impregnação argêntica quando quiser ver o estroma de um órgão linfoide.',
      'Note que as células reticulares se confundem com as células livres em H&E.',
    ],
  },

  'brown adipose connective tissue': {
    panorama:
      'O tecido adiposo pardo é especializado em **produzir calor**, não em estocar energia, e sua histologia acompanha essa função. Suas células são **multiloculares**: o lipídio está distribuído em muitas gotículas pequenas, o que multiplica a área de contato com as mitocôndrias, e o núcleo permanece **central e redondo**, não comprimido contra a borda. O citoplasma é abundante e acidófilo pela enorme quantidade de mitocôndrias, cujos citocromos dão a cor parda ao tecido. A vascularização e a inervação simpática são muito mais densas que no tecido branco. O mecanismo é a **termogenina** (UCP1), proteína da membrana mitocondrial interna que desacopla a cadeia respiratória da síntese de ATP, dissipando a energia como calor.',
    roteiro: [
      'Confirme as múltiplas gotículas e o núcleo central para separar do adipócito branco.',
      'Note a densidade capilar, muito maior que a do tecido branco no mesmo aumento.',
    ],
  },

  'mucous connective tissue': {
    panorama:
      'O tecido conjuntivo mucoso é uma variedade essencialmente **embrionária**, cujo exemplo mais conhecido é a **geleia de Wharton** do cordão umbilical. Sua matriz é predominantemente **substância fundamental**, muito rica em ácido hialurônico e portanto extremamente hidratada, com poucas fibras colágenas dispersas e sem fibras elásticas. As células são fibroblastos estrelados, esparsos, com longos prolongamentos que se tocam formando uma rede frouxa. O aspecto em H&E é o de um campo quase vazio, pálido e finamente fibrilar, com raros núcleos — e é justamente essa pobreza celular e fibrilar que o identifica. No cordão, a rigidez conferida pela hidratação impede que os vasos umbilicais sejam comprimidos ou torcidos.',
    roteiro: [
      'Reconheça o campo pálido com poucos núcleos estrelados antes de procurar fibras.',
      'Confirme o contexto: fora do cordão umbilical e do embrião, ele é raro no adulto.',
    ],
  },

  'muscle types': {
    panorama:
      'Há três tipos de músculo, e três perguntas os separam. **Há estriações?** O esquelético e o cardíaco têm, porque seus sarcômeros estão alinhados; o liso não tem. **Onde está o núcleo?** No esquelético, os núcleos são **múltiplos e periféricos**, encostados no sarcolema, porque a fibra é um sincício formado pela fusão de mioblastos; no cardíaco há **um ou dois núcleos centrais**; no liso, um núcleo central em forma de charuto, que se enruga quando a célula contrai. **Há ramificação e disco intercalar?** Só no cardíaco. O controle segue: voluntário no esquelético, involuntário nos outros dois. E a regeneração difere radicalmente: boa no liso, limitada no esquelético via células satélites, praticamente nula no cardíaco.',
    roteiro: [
      'Responda às três perguntas em ordem — elas classificam sem ambiguidade.',
      'Confirme o plano de corte antes de concluir: em corte transversal as estriações não aparecem.',
    ],
  },

  neurons: {
    panorama:
      'O neurônio é a unidade de sinalização do sistema nervoso, e sua morfologia decorre inteiramente disso. O **pericário** contém o núcleo grande, eucromático, com nucléolo proeminente, e um citoplasma cheio de **substância de Nissl** — RER e polissomos em blocos — que sustenta a síntese de um citoplasma potencialmente enorme. Os **dendritos** recebem informação, são múltiplos, afilam-se, ramificam-se perto do corpo e contêm Nissl. O **axônio** é único, emerge do cone de implantação, mantém calibre constante, pode alcançar mais de um metro e **não tem Nissl** — critério prático para identificá-lo. Classificam-se pelo número de prolongamentos em multipolares, bipolares e pseudounipolares, e pela função em sensitivos, motores e interneurônios.',
    roteiro: [
      'Ache o prolongamento sem Nissl para identificar o axônio.',
      'Conte os prolongamentos que saem do corpo para classificar morfologicamente.',
    ],
  },

  'spinal cord': {
    panorama:
      'A medula espinal inverte a organização do encéfalo: aqui a **substância cinzenta é central**, em forma de H ou de borboleta, e a **branca é periférica**. Os cornos anteriores da cinzenta contêm os grandes **motoneurônios** multipolares, cujos axônios saem pela raiz ventral; os cornos posteriores recebem as fibras sensitivas que entram pela raiz dorsal, vindas dos neurônios pseudounipolares do gânglio espinal; e nos segmentos torácicos e lombares altos há cornos laterais com neurônios autonômicos pré-ganglionares. A substância branca é formada por tratos ascendentes e descendentes mielinizados, organizados em funículos, mais a glia. No centro corre o **canal central**, revestido por epêndima.',
    roteiro: [
      'Oriente o corte pelos cornos: os anteriores são mais largos e têm os maiores neurônios.',
      'Localize o canal central para confirmar o eixo dorsoventral.',
    ],
  },

  'schwann cell': {
    panorama:
      'A célula de Schwann é a glia do sistema nervoso periférico e tem duas relações possíveis com o axônio. Nas fibras **mielinizadas**, ela envolve **um único internódulo de um único axônio**, enrolando sua membrana dezenas de vezes até formar a bainha de mielina; entre duas células consecutivas fica um **nó de Ranvier**, onde o axônio se expõe e o potencial de ação salta, tornando a condução saltatória e rápida. Nas fibras **amielínicas**, uma só célula acomoda vários axônios em invaginações separadas da sua superfície, sem enrolamento. Produz **lâmina basal** própria, o que a diferencia do oligodendrócito e é decisivo para a regeneração: é ela que forma o tubo por onde o axônio seccionado volta a crescer.',
    roteiro: [
      'Ache os nós de Ranvier em corte longitudinal para confirmar a relação um-a-um.',
      'Note a lâmina basal em microscopia eletrônica — ela não existe no oligodendrócito.',
    ],
  },

  astrocytes: {
    panorama:
      'O astrócito é a glia mais numerosa do sistema nervoso central e a mais versátil. Tem corpo estrelado com muitos prolongamentos que terminam em **pés vasculares** envolvendo os capilares — é essa cobertura que induz e mantém as junções estreitas do endotélio, isto é, a **barreira hematoencefálica**. Outros prolongamentos formam a membrana glial limitante sob a pia-máter. Funcionalmente, tampona o potássio extracelular, recapta neurotransmissores como o glutamato, fornece lactato ao neurônio e delimita territórios sinápticos. Existem dois tipos: os **protoplasmáticos**, de prolongamentos curtos e ramificados, na substância cinzenta, e os **fibrosos**, de prolongamentos longos e finos, na branca. Marcam-se pela proteína glial fibrilar ácida.',
    roteiro: [
      'Peça imuno-histoquímica para GFAP: em H&E só se vê o núcleo, oval e pálido.',
      'Procure os pés vasculares encostados nos capilares como confirmação funcional.',
    ],
  },

  // ---- Preparo, microscopia e colorações ----

  'tissue preparation - overview': {
    panorama:
      'Nenhuma lâmina mostra tecido vivo: o que se observa é o resultado de uma cadeia de etapas que preserva a estrutura ao custo de alterá-la, e conhecer essa cadeia é o que permite separar achado de artefato. A sequência é sempre a mesma: **fixação**, que estabiliza as proteínas e interrompe a autólise; **desidratação** em álcoois crescentes; **diafanização** em xilol, que torna o tecido miscível com a parafina; **inclusão** em parafina, que dá dureza para o corte; **microtomia**, em fatias de 3 a 8 µm; e **coloração**, precedida de reidratação, já que os corantes usuais são aquosos. Cada etapa deixa marcas — a retração dos solventes, a extração de lipídios, as fendas do micrótomo — e todas aparecem na lâmina final.',
    roteiro: [
      'Antes de descrever uma estrutura, pergunte se ela poderia ter sido criada por uma das etapas.',
      'Lembre que gordura e glicogênio são extraídos na rotina: espaços claros costumam ser eles.',
    ],
  },

  'tissue preparation - fixatives': {
    panorama:
      'A fixação é a etapa que decide a qualidade de tudo o que vem depois. O fixador mais usado é o **formaldeído a 10% tamponado** (formalina), que forma pontes de metileno entre grupos amino das proteínas, preservando bem a morfologia geral e permitindo imuno-histoquímica posterior — embora exija recuperação antigênica, já que as próprias pontes mascaram epítopos. Para microscopia eletrônica usa-se **glutaraldeído**, que faz ligações cruzadas mais estáveis, seguido de **tetróxido de ósmio**, que fixa lipídios e ao mesmo tempo os torna elétron-densos. Fixadores com metais pesados, como o de Bouin e o de Zenker, dão detalhe nuclear superior mas são incompatíveis com muitos anticorpos. Fixar cedo e em volume suficiente importa mais que a escolha do fixador.',
    roteiro: [
      'Relacione o fixador ao que se pretende ver: nenhum preserva tudo igualmente bem.',
      'Suspeite de autólise quando os núcleos estiverem pálidos e os contornos celulares indistintos.',
    ],
  },

  'sectioning – light microscopy': {
    panorama:
      'Para a microscopia de luz, o tecido incluído em parafina é cortado no **micrótomo** em fatias de 3 a 8 µm — espessura escolhida por ser aproximadamente a de uma célula, o que dá contraste sem sobreposição excessiva. Os cortes flutuam em banho aquecido para desfazer as pregas, são pescados em lâminas e desparafinizados antes da coloração. Alternativas existem quando a parafina não serve: o **criostato** corta tecido congelado em minutos, preservando lipídios e atividade enzimática, e é o que se usa no exame intraoperatório de congelação, ao custo de morfologia inferior. Artefatos típicos do corte incluem pregas, riscos paralelos por falha na navalha, e fragmentação de tecidos duros mal descalcificados.',
    roteiro: [
      'Identifique riscos paralelos e pregas antes de interpretá-los como estrutura.',
      'Lembre que a espessura do corte determina quantas camadas de células você vê sobrepostas.',
    ],
  },

  'sectioning – electron microscopy': {
    panorama:
      'A microscopia eletrônica exige cortes **ultrafinos**, de 60 a 90 nm — cerca de cem vezes mais finos que os de rotina —, porque o feixe de elétrons tem baixíssimo poder de penetração. O tecido é fixado em glutaraldeído e ósmio, incluído em **resina epóxi**, que é muito mais dura que a parafina, e cortado no **ultramicrótomo** com navalha de diamante ou de vidro. Os cortes são recolhidos em telinhas de cobre e contrastados com **acetato de uranila** e **citrato de chumbo**, metais pesados que se ligam diferencialmente aos componentes e produzem a imagem em tons de cinza. Antes disso, cortes semifinos de aproximadamente 1 µm, corados com azul de toluidina, são examinados em luz para escolher a área de interesse.',
    roteiro: [
      'Lembre que a imagem é de densidade eletrônica, não de cor: "elétron-denso" não significa escuro por corante.',
      'Use o corte semifino como mapa antes de interpretar o ultrafino.',
    ],
  },

  'section planes': {
    panorama:
      'Toda lâmina é uma fatia bidimensional de um objeto tridimensional, e a maior parte dos erros de interpretação nasce de esquecer isso. Um tubo cortado **transversalmente** aparece como anel; **longitudinalmente**, como duas faixas paralelas; **obliquamente**, como elipse ou como um contorno que parece ramificar. Uma esfera oca cortada fora do equador parece menor e de parede mais espessa. Uma vilosidade cortada de través vira uma ilha de epitélio solta na luz, e um glomérulo cortado na borda parece um aglomerado sem cápsula. A regra prática é sempre a mesma: **reconstrua mentalmente o volume** a partir de vários perfis do mesmo campo antes de concluir, e prefira o perfil mais completo como referência.',
    roteiro: [
      'Procure o perfil mais bem orientado do campo e use-o para interpretar os demais.',
      'Diante de um achado estranho, teste primeiro a hipótese de plano de corte.',
    ],
  },

  staining: {
    panorama:
      'Tecido não corado é praticamente transparente e sem contraste; a coloração existe para introduzir diferenças ópticas. O princípio dominante é químico: corantes **básicos** (catiônicos), como a hematoxilina, ligam-se a componentes **aniônicos** — DNA, RNA, glicosaminoglicanos sulfatados —, e o que se cora por eles chama-se **basófilo**; corantes **ácidos** (aniônicos), como a eosina, ligam-se a grupos catiônicos das proteínas, e o que se cora por eles é **acidófilo** ou eosinófilo. Daí a leitura imediata do H&E: núcleo e RER azuis, citoplasma e colágeno rosas. Outras técnicas seguem princípios diferentes — reações químicas específicas, como o PAS, impregnações metálicas, e a imuno-histoquímica, baseada em antígeno e anticorpo.',
    roteiro: [
      'Traduza a cor observada em composição química antes de nomear a estrutura.',
      'Pergunte que técnica foi usada: a mesma estrutura muda completamente de aparência entre elas.',
    ],
  },

  'types of stains': {
    panorama:
      'As técnicas de coloração se agrupam por mecanismo. As **tintoriais** dependem de carga elétrica e são a base do H&E e dos tricrômicos. As **histoquímicas** usam uma reação química específica para revelar uma classe de molécula: o **PAS** oxida glicóis vicinais e cora carboidratos de magenta; o sudan e o óleo vermelho dissolvem-se em lipídios; o Perls revela ferro. As **impregnações metálicas** depositam prata ou ouro sobre estruturas com afinidade particular, revelando fibras reticulares e prolongamentos neuronais que nenhum corante alcança. As **enzimo-histoquímicas** detectam atividade enzimática preservada. E a **imuno-histoquímica** usa anticorpos contra proteínas específicas, revelados por enzima ou fluorescência, sendo hoje a ferramenta central do diagnóstico.',
    roteiro: [
      'Comece toda leitura perguntando qual técnica foi usada — a interpretação depende disso.',
      'Não conclua ausência a partir de uma técnica que não detecta aquela classe de molécula.',
    ],
  },

  'hematoxylin and esosin (h&e) staining': {
    panorama:
      'O H&E é a coloração de rotina em todo o mundo, e domina-lo é o pré-requisito de qualquer leitura. A **hematoxilina** não é corante por si: oxidada a hemateína e complexada com um mordente de alumínio, torna-se um corante **básico** que se liga a estruturas aniônicas — cromatina, nucléolo, RER e polissomos, matriz cartilaginosa — e as tinge de azul-arroxeado; essas estruturas são ditas **basófilas**. A **eosina** é um corante **ácido** que se liga a grupos catiônicos das proteínas citoplasmáticas, colágeno, fibras musculares e hemácias, tingindo-os de rosa; são as estruturas **acidófilas** ou eosinófilas. A leitura básica é imediata: azul indica ácido nucleico ou síntese proteica, rosa indica proteína estrutural já formada.',
    roteiro: [
      'Traduza azul e rosa em basofilia e acidofilia, e estas em composição — é o raciocínio, não a cor.',
      'Lembre que mucinas e lipídios são extraídos ou não corados e aparecem como espaços claros.',
    ],
  },

  'metal stains for electron microscopy (em)': {
    panorama:
      'Na microscopia eletrônica não há cor: a imagem é formada pelo **espalhamento de elétrons**, e regiões que espalham mais aparecem escuras. Como os elementos do tecido biológico são leves e espalham pouco, é preciso introduzir **metais pesados** que se liguem seletivamente. O **tetróxido de ósmio**, aplicado ainda na fixação, liga-se às duplas ligações dos lipídios insaturados e por isso torna todas as **membranas** visíveis — é ele que produz a imagem trilaminar da membrana plasmática. O **acetato de uranila** liga-se a ácidos nucleicos e proteínas, realçando cromatina e ribossomos. O **citrato de chumbo** aumenta o contraste geral, ligando-se a estruturas já marcadas pelo uranila. Fala-se, portanto, em elétron-denso e elétron-lucente, não em corado.',
    roteiro: [
      'Interprete o tom de cinza como densidade eletrônica, e essa densidade como afinidade por metal.',
      'Atribua a nitidez das membranas ao ósmio antes de supor uma propriedade intrínseca.',
    ],
  },

  'toluidine blue': {
    panorama:
      'O azul de toluidina é um corante básico de uso duplo. Em cortes **semifinos** de resina, de aproximadamente 1 µm, é a coloração padrão para localizar a área de interesse antes da microscopia eletrônica, dando um azul geral com excelente detalhe. Sua propriedade mais interessante, porém, é a **metacromasia**: diante de poliânions muito densos — heparina sulfatada dos grânulos do mastócito, glicosaminoglicanos da matriz cartilaginosa, mucinas ácidas — as moléculas do corante se agregam e passam a absorver em outro comprimento de onda, e o que deveria ser azul aparece **púrpura ou vermelho**. É por isso que os grânulos do mastócito saltam em púrpura enquanto o resto do campo permanece azul.',
    roteiro: [
      'Procure o desvio de cor, não a intensidade: metacromasia é mudança de matiz.',
      'Relacione o púrpura a poliânions densos e use isso para inferir a composição da matriz.',
    ],
  },

  osmium: {
    panorama:
      'O tetróxido de ósmio cumpre duas funções ao mesmo tempo, e é por isso que ocupa lugar central no preparo para microscopia eletrônica. Como **fixador**, é o único de uso rotineiro que estabiliza **lipídios**, reagindo com as duplas ligações dos ácidos graxos insaturados — sem ele, as membranas seriam extraídas pelos solventes da inclusão. Como agente de **contraste**, o ósmio reduzido é um metal pesado que fica depositado exatamente onde reagiu, tornando as membranas elétron-densas. O resultado direto é a imagem **trilaminar** da membrana plasmática: duas linhas escuras, correspondentes às cabeças polares onde o ósmio se ligou, separadas por uma faixa clara, a região das caudas hidrofóbicas. Também enegrece gotículas lipídicas em cortes de luz.',
    roteiro: [
      'Atribua as duas linhas escuras da membrana ao ósmio, não a duas estruturas distintas.',
      'Lembre que o miolo claro é a parte lipídica: ele não é um espaço.',
    ],
  },

  'periodic acid-schiff (pas) stain': {
    panorama:
      'O PAS é uma reação histoquímica, não uma coloração por carga. O **ácido periódico** oxida grupos glicol vicinais dos carboidratos, gerando aldeídos, que reagem com o **reativo de Schiff** e produzem uma cor **magenta** intensa. Marca, portanto, tudo o que é rico em açúcar: **glicogênio** do hepatócito e do músculo, **mucinas neutras** das células caliciformes e do epitélio gástrico, o **glicocálice** da borda estriada, as **membranas basais** e as paredes de fungos. Um controle simples torna a técnica específica: um corte tratado previamente com **diastase** perde a marcação do glicogênio mas mantém a das mucinas e membranas basais, o que permite distinguir uma coisa da outra com segurança.',
    roteiro: [
      'Peça o controle com diastase antes de afirmar que o magenta é glicogênio.',
      'Use o PAS para contar caliciformes: em H&E o número é sempre subestimado.',
    ],
  },

  'cresyl violet-luxol fast blue': {
    panorama:
      'Essa combinação é a coloração padrão para tecido nervoso porque revela, na mesma lâmina, os dois componentes que estruturam o sistema nervoso central. O **luxol fast blue** liga-se às lipoproteínas da **mielina** e tinge de azul a substância branca e as fibras mielinizadas, permitindo delimitar tratos e identificar áreas de desmielinização como falhas na coloração. O **violeta de cresila** é um corante básico que marca a **substância de Nissl** dos corpos neuronais, em roxo, delineando a substância cinzenta e permitindo o mapeamento citoarquitetônico — o método de Nissl clássico. O resultado é um contraste direto entre branca azul e cinzenta arroxeada, ideal para orientação topográfica em cortes de encéfalo e medula.',
    roteiro: [
      'Use o azul para delimitar tratos e o roxo para localizar corpos neuronais.',
      'Procure falhas na coloração azul como sinal de perda de mielina.',
    ],
  },

  "masson's trichrome": {
    panorama:
      'O tricrômico de Masson usa três corantes de tamanhos moleculares diferentes para separar, em uma só lâmina, três componentes. Os **núcleos** ficam pretos ou azul-escuros pela hematoxilina férrica; o **citoplasma, o músculo e as hemácias** ficam vermelhos pela fucsina ácida; e o **colágeno** fica **azul** (ou verde, na variante com verde-luz), porque suas fibras são mais permeáveis e retêm o corante de molécula maior aplicado por último, após o tratamento com ácido fosfomolíbdico. Isso torna a técnica insubstituível para avaliar **fibrose**: em fígado, rim, coração e pulmão, a extensão do azul mede diretamente quanto de parênquima foi substituído por colágeno, e é ela que fundamenta o estadiamento histológico da cirrose.',
    roteiro: [
      'Estime a proporção de azul no campo antes de examinar detalhes celulares.',
      'Distinga músculo de colágeno pela cor, não pela forma — em corte transversal os dois se confundem.',
    ],
  },

  "movat's pentachrome stain": {
    panorama:
      'O pentacrômico de Movat é uma técnica de combinação desenhada para mostrar **cinco componentes do tecido conjuntivo simultaneamente**, e por isso é preferida no estudo de vasos e valvas cardíacas. O resultado típico é: **elastina e núcleos em preto**, **colágeno em amarelo**, **mucopolissacarídeos e substância fundamental em azul-esverdeado**, **fibrina em vermelho intenso** e **músculo em vermelho**. Numa parede arterial, isso permite ver de uma só vez as lâminas elásticas, a média muscular, o colágeno da adventícia e o acúmulo de proteoglicanos da íntima — informação que exigiria três colorações separadas. É a técnica de escolha para caracterizar a estrutura de uma valva, com sua fibrosa, esponjosa e ventricular.',
    roteiro: [
      'Memorize a chave de cores antes de interpretar: sem ela, a imagem é confusa.',
      'Use-a quando a questão for a proporção entre elastina, colágeno e músculo.',
    ],
  },

  "elastin stain (verhoeff's-van gieson)": {
    panorama:
      'A coloração de Verhoeff com contraste de van Gieson é a técnica padrão para **fibras elásticas**, que em H&E são praticamente invisíveis ou aparecem apenas como linhas onduladas pálidas. A hematoxilina férrica de Verhoeff, em excesso e depois diferenciada, permanece ligada apenas à elastina, que fica **preta e nítida**; o contraste de van Gieson tinge o **colágeno de vermelho** e o **restante do tecido de amarelo**. A aplicação principal é vascular: ela demonstra as lâminas elásticas interna e externa das artérias, as lamelas concêntricas da aorta e a rede elástica do pulmão e da derme. Também é usada para documentar a fragmentação elástica de aneurismas e de doenças do tecido conjuntivo.',
    roteiro: [
      'Conte as lamelas elásticas para classificar a artéria como elástica ou muscular.',
      'Procure fragmentação ou rarefação da rede preta como achado patológico.',
    ],
  },

  'silver stain': {
    panorama:
      'As impregnações argênticas não são colorações por afinidade de carga: sais de prata são depositados e depois **reduzidos a prata metálica** sobre estruturas que têm capacidade de reduzi-los ou que foram previamente sensibilizadas, resultando em depósitos **pretos** sobre fundo claro. São insubstituíveis para dois territórios. No conjuntivo, revelam as **fibras reticulares** de colágeno III — argirófilas por causa de sua alta glicosilação —, expondo o arcabouço de fígado, baço, linfonodo e medula óssea, que o H&E não mostra. No tecido nervoso, revelam **prolongamentos neuronais, neurofibrilas e a glia**, permitindo ver a arborização dendrítica inteira de um neurônio, como no método de Golgi.',
    roteiro: [
      'Peça prata quando a pergunta for sobre o arcabouço de sustentação de um órgão.',
      'Lembre que a técnica é caprichosa: variações de intensidade não devem ser lidas como diferença biológica.',
    ],
  },

  stains: {
    panorama:
      'Este é o índice das técnicas de coloração, e vale usá-lo como um mapa de decisões. A pergunta que orienta a escolha é sempre "o que eu quero ver?": para morfologia geral, **H&E**; para carboidratos, glicogênio e membranas basais, **PAS**; para colágeno e fibrose, **tricrômico**; para fibras elásticas, **Verhoeff**; para fibras reticulares e neurônios, **prata**; para mielina e corpos neuronais, **luxol e violeta de cresila**; para grânulos de mastócito e matriz cartilaginosa, **azul de toluidina**, pela metacromasia; para lipídios, **sudan** em corte de congelação; e para uma proteína específica, **imuno-histoquímica**. Nenhuma técnica mostra tudo, e a ausência de marcação diz pouco quando a técnica não detecta aquela classe de molécula.',
    roteiro: [
      'Escolha a técnica a partir da pergunta, não o contrário.',
      'Ao interpretar, considere sempre o que aquela técnica *não* mostra.',
    ],
  },

  'stains 01': {
    panorama:
      'A coloração transforma um corte quase transparente em uma imagem legível, e o mecanismo predominante é eletrostático. Corantes **básicos** carregam carga positiva e se ligam a componentes negativos do tecido — fosfatos do DNA e do RNA, sulfatos dos glicosaminoglicanos —, e o componente que os retém é chamado **basófilo**; a hematoxilina é o exemplo. Corantes **ácidos** carregam carga negativa e se ligam a grupos positivos das proteínas, e o componente é **acidófilo**; a eosina é o exemplo. Compreender essa dupla resolve a maior parte da leitura de rotina: o azul do núcleo e da base do plasmócito é ácido nucleico, o rosa do colágeno e do citoplasma muscular é proteína estrutural.',
    roteiro: [
      'Antes de nomear a estrutura, nomeie a afinidade: basófila ou acidófila.',
      'Ligue a afinidade à composição química, e a composição à função da célula.',
    ],
  },

  microscopy: {
    panorama:
      'A histologia depende de instrumentos, e cada um impõe seus limites. O **microscópio de luz** usa fótons e lentes de vidro, com resolução limitada pela difração a cerca de 0,2 µm — o que permite ver células, núcleos e tecidos, mas não organelas individuais. O **microscópio eletrônico de transmissão** usa elétrons acelerados e lentes eletromagnéticas, alcançando resolução da ordem de 1 nm e revelando membranas, ribossomos e citoesqueleto em cortes ultrafinos. O **de varredura** varre a superfície e produz imagem tridimensional do relevo. Somam-se técnicas especiais de luz: contraste de fase e interferência para material vivo não corado, campo escuro, polarização para estruturas birrefringentes, e **fluorescência** e **confocal** para localização molecular.',
    roteiro: [
      'Pergunte primeiro qual instrumento gerou a imagem: ele define o que é possível estar visível.',
      'Não atribua a organelas o que a resolução do microscópio de luz não alcança.',
    ],
  },

  'magnification and resolution': {
    panorama:
      'Aumento e resolução são propriedades diferentes, e confundi-las é a origem do "aumento vazio". O **aumento** é a razão entre o tamanho da imagem e o do objeto, e resulta simplesmente do produto entre objetiva e ocular; ampliar sem melhorar a resolução apenas torna a imagem maior e mais borrada. A **resolução** é a menor distância entre dois pontos que ainda podem ser vistos separadamente, e é limitada pela física: aproximadamente 0,61 vezes o comprimento de onda dividido pela abertura numérica. Para a luz visível isso dá cerca de **0,2 µm**; para o olho nu, 0,2 mm; para o microscópio eletrônico de transmissão, algo próximo de **1 nm**, porque o comprimento de onda do elétron é milhares de vezes menor.',
    roteiro: [
      'Cheque a abertura numérica antes de culpar o aumento por uma imagem ruim.',
      'Use os três números de referência — 0,2 mm, 0,2 µm, 1 nm — como escala mental.',
    ],
  },

  'light microscopy': {
    panorama:
      'O microscópio óptico composto forma a imagem em duas etapas: a **objetiva** produz uma imagem real ampliada, e a **ocular** a amplia novamente para o olho. O **condensador** concentra a luz na amostra, e sua abertura, junto com a da objetiva, determina a resolução — por isso objetivas de imersão usam óleo, cujo índice de refração próximo ao do vidro aumenta a abertura numérica e permite chegar ao limite de aproximadamente 0,2 µm. Como a maioria dos tecidos é transparente, é necessário corar; alternativas para material vivo incluem **contraste de fase** e **contraste de interferência diferencial**, que convertem diferenças de índice de refração em diferenças de intensidade. Fluorescência e confocal acrescentam especificidade molecular e cortes ópticos.',
    roteiro: [
      'Ajuste o condensador antes de reclamar da imagem: ele afeta a resolução tanto quanto a objetiva.',
      'Escolha entre corar e usar contraste de fase conforme o material esteja fixado ou vivo.',
    ],
  },

  'electron microscopy': {
    panorama:
      'A microscopia eletrônica substitui fótons por **elétrons acelerados** e lentes de vidro por lentes **eletromagnéticas**, operando em alto vácuo. Como o comprimento de onda do elétron é milhares de vezes menor que o da luz, a resolução alcança cerca de 1 nm, revelando membranas, ribossomos, filamentos e a estrutura interna das organelas. O modo de **transmissão** atravessa cortes ultrafinos de 60 a 90 nm contrastados com metais pesados, e a imagem é formada por espalhamento — daí falar-se em elétron-denso e elétron-lucente, e não em cor. O modo de **varredura** recobre a superfície com metal e varre-a com o feixe, produzindo imagem tridimensional do relevo. O preço é alto: só tecido fixado, campo minúsculo e nenhuma observação de material vivo.',
    roteiro: [
      'Determine se a imagem é de transmissão ou de varredura antes de interpretá-la.',
      'Lembre da escala: o campo típico corresponde a uma fração de uma única célula.',
    ],
  },

  'tissue preparation': {
    panorama:
      'Preparar tecido é escolher, a cada etapa, o que preservar e o que sacrificar. A **fixação** interrompe a autólise e estabiliza proteínas, mas altera epítopos; a **desidratação** e a **diafanização** retiram a água e substituem-na por solventes que extraem lipídios e provocam retração de aproximadamente 10 a 30% do volume; a **inclusão** em parafina dá dureza para o corte, mas exige calor; a **microtomia** produz fatias de 3 a 8 µm, com riscos e pregas possíveis; e a **coloração** introduz o contraste. O resultado é uma imagem fiel na topografia e infiel na escala e no conteúdo hidrossolúvel — motivo pelo qual gordura, glicogênio e mucinas aparecem como espaços vazios em H&E de rotina.',
    roteiro: [
      'Antes de interpretar um espaço claro, verifique se ele corresponde a algo extraído no preparo.',
      'Corrija mentalmente a retração ao estimar tamanhos absolutos.',
    ],
  },

  // ---- Membranas e conceitos gerais ----

  'cutaneous membrane': {
    panorama:
      'A membrana cutânea é a pele considerada como membrana de revestimento, e é a única das membranas do corpo que faz fronteira com o **ambiente externo seco**. Diferentemente das mucosas e das serosas, ela é **seca na superfície** — não tem secreção própria que a mantenha úmida, apenas o sebo e o suor — e é **queratinizada**, com um estrato córneo de células mortas cheias de queratina e cimentadas por lipídios, que é a verdadeira barreira contra a perda de água e contra a entrada de microrganismos. Compõe-se de epiderme, epitélio estratificado pavimentoso queratinizado, e derme, o conjuntivo que a sustenta. Essa combinação de queratinização e ressecamento é o que a distingue funcionalmente de todas as outras membranas.',
    roteiro: [
      'Compare com uma mucosa na mesma prancha: queratinização e umidade são os dois eixos da diferença.',
      'Confirme a ausência de núcleos nas camadas superficiais.',
    ],
  },

  'mucosal and serosal membranes': {
    panorama:
      'Mucosas e serosas são as duas grandes membranas internas, e se distinguem pelo tipo de cavidade que revestem. A **mucosa** forra cavidades **abertas ao exterior** — digestória, respiratória, urinária, genital — e é sempre úmida por secreção própria de muco; tem epitélio variável conforme a agressão local e lâmina própria de conjuntivo, mais uma muscular da mucosa no tubo digestório. A **serosa** forra cavidades **fechadas** — pleural, pericárdica e peritoneal — e é sempre feita de **mesotélio** simples pavimentoso sobre conjuntivo frouxo; sua umidade vem de um ultrafiltrado do plasma enriquecido com ácido hialurônico, que permite o deslizamento sem atrito. Cada serosa tem uma folha visceral, aderida ao órgão, e uma parietal, na parede.',
    roteiro: [
      'Pergunte se a cavidade se abre para fora: a resposta separa as duas famílias.',
      'Confirme o mesotélio simples pavimentoso antes de chamar algo de serosa.',
    ],
  },

  'serosal membrane': {
    panorama:
      'A membrana serosa reveste as cavidades fechadas do corpo e é notavelmente uniforme: **mesotélio** simples pavimentoso, apoiado em lâmina basal, sobre uma camada delgada de conjuntivo frouxo com vasos, linfáticos e adipócitos. O mesotélio, de origem mesodérmica, não é um epitélio de revestimento comum — suas células têm microvilosidades curtas que retêm o líquido seroso e secretam ácido hialurônico, o que torna a superfície escorregadia e permite que órgãos deslizem uns sobre os outros a cada batimento ou movimento respiratório. Cada serosa tem folha **visceral**, aderida ao órgão, e **parietal**, na parede, contínuas entre si, com um espaço virtual entre elas contendo poucos mililitros de líquido.',
    roteiro: [
      'Ache a camada única e achatada de mesotélio na superfície livre.',
      'Verifique a continuidade entre folha visceral e parietal para confirmar a organização.',
    ],
  },

  'cortex and medulla': {
    panorama:
      'A divisão em córtex e medula organiza vários órgãos capsulados, mas o que ela significa muda inteiramente conforme o órgão — reconhecê-la é orientação topográfica, não identificação. No **rim**, o córtex tem corpúsculos e túbulos contorcidos e a medula tem alças e coletores em arranjo estriado. No **linfonodo**, o córtex tem nódulos B, o paracórtex tem T e a medula tem cordões e seios. No **timo**, o córtex é escuro pela densidade de timócitos e a medula é clara e tem corpúsculos de Hassall. Na **suprarrenal**, córtex e medula têm origens embriológicas diferentes e produzem classes distintas de hormônio. No **ovário**, o córtex tem folículos e a medula é vascular. No **pelo**, os termos descrevem camadas da haste.',
    roteiro: [
      'Localize cápsula, córtex e medula antes de qualquer detalhe em órgão capsulado.',
      'Nomeie o órgão antes de atribuir significado às duas regiões.',
    ],
  },

  'general concepts': {
    panorama:
      'Antes de estudar órgãos individualmente, alguns conceitos se repetem e economizam esforço. Todo órgão combina os **quatro tecidos básicos** e pode ser lido pela dupla **parênquima e estroma**. Órgãos **maciços** se organizam em cápsula, septos e lóbulos; órgãos **tubulares** repetem camadas concêntricas em torno de uma luz — mucosa, submucosa, muscular e adventícia ou serosa. A divisão em **córtex e medula** aparece sempre que duas funções precisam de compartimentos distintos. As **membranas** de revestimento se classificam pelo tipo de cavidade que forram. E a **luz** de qualquer tubo é, topologicamente, o exterior do corpo. Aplicar essas chaves antes de procurar detalhes resolve boa parte das lâminas sem memorização adicional.',
    roteiro: [
      'Classifique o órgão como maciço ou tubular antes de descrever qualquer estrutura.',
      'Separe parênquima de estroma como segundo passo, sempre.',
    ],
  },

  'daughter cells': {
    panorama:
      'As células-filhas são o produto final da divisão, e compará-las com a mãe revela o que a mitose garante e o que ela não garante. O **genoma** é repartido com precisão: cada filha recebe uma cópia idêntica, porque as cromátides irmãs são separadas por um aparato dedicado e vigiado por ponto de checagem. Já o **citoplasma** é repartido de modo estocástico — mitocôndrias, cisternas do retículo, fragmentos do Golgi e demais organelas se distribuem aproximadamente pela metade, sem mecanismo de contagem. Em algumas linhagens a divisão é deliberadamente **assimétrica**: determinantes citoplasmáticos são segregados para um lado só, e as filhas seguem destinos diferentes — é assim que uma célula-tronco se autorrenova e ao mesmo tempo gera uma célula comprometida.',
    roteiro: [
      'Compare o tamanho das duas filhas: assimetria evidente sugere divisão determinativa.',
      'Note que os núcleos ainda estão descondensando enquanto o citoplasma já se separou.',
    ],
  },

  'overview of mitosis': {
    panorama:
      'A mitose é a divisão que produz duas células geneticamente **idênticas** à mãe, e serve ao crescimento, à renovação de tecidos e ao reparo. Ocorre em quatro fases contínuas — prófase, metáfase, anáfase e telófase, com a prometáfase entre as duas primeiras — precedidas pela replicação do DNA na fase S da intérfase e seguidas pela citocinese. O que se separa é o par de **cromátides irmãs** de cada cromossomo, e não os homólogos, o que preserva a ploidia. Três aparatos comandam o processo: o **fuso mitótico** de microtúbulos nucleados nos centrossomos, os **cinetocoros** que ligam cromossomo a fuso, e o **anel contrátil** de actina e miosina que divide o citoplasma. Pontos de checagem impedem o avanço com ligações incorretas.',
    roteiro: [
      'Localize as figuras mitóticas nas zonas proliferativas do tecido antes de tentar fasear.',
      'Use envoltório nuclear e posição da cromatina como os dois critérios de faseamento.',
    ],
  },

  'light micrographs': {
    panorama:
      'A fotomicrografia de luz é o registro do que se vê ao microscópio óptico, e interpretá-la exige ter em mente três limites do instrumento. A **resolução** máxima é de aproximadamente 0,2 µm, de modo que organelas individuais não aparecem: o que se vê como granulação é sempre um agregado. A **espessura do corte**, de 3 a 8 µm, faz várias camadas de células se sobreporem, o que explica contornos difusos e núcleos aparentemente encavalados. E a **cor** não é do tecido, mas dos corantes, e traduz afinidade química. Uma boa leitura, portanto, começa pelo pequeno aumento — que dá topografia e orientação — e só depois desce ao detalhe, em vez de partir direto para a objetiva de imersão.',
    roteiro: [
      'Comece sempre pelo menor aumento e só então aproxime.',
      'Cheque a escala ou a barra de referência antes de estimar tamanhos.',
    ],
  },

  'meiosis i: prophase': {
    panorama:
      'A prófase I é a fase mais longa e mais importante da meiose, e se subdivide em cinco estágios. No **leptóteno** os cromossomos começam a condensar e aparecem como filamentos finos. No **zigóteno** os homólogos se aproximam e pareiam ponto a ponto, formando o **complexo sinaptonêmico**, uma estrutura proteica em zíper. No **paquíteno** o pareamento se completa em bivalentes de quatro cromátides, e ocorre o **crossing over**, a troca recíproca de segmentos entre cromátides não irmãs — a principal fonte de variabilidade genética. No **diplóteno** o complexo se desfaz e os homólogos se afastam, permanecendo unidos nos **quiasmas**, pontos visíveis onde houve troca. Na **diacinese** a condensação atinge o máximo e o envoltório nuclear se rompe.',
    roteiro: [
      'Procure os bivalentes espessos do paquíteno: são as maiores figuras do túbulo seminífero.',
      'Ache os quiasmas no diplóteno como pontos de contato entre homólogos já separados.',
    ],
  },

  'meiosis i: metaphase': {
    panorama:
      'Na metáfase I são os **bivalentes** — pares de cromossomos homólogos ainda unidos por quiasmas — que se alinham na placa equatorial, e não cromossomos individuais como na mitose. Cada homólogo do par volta seus dois cinetocoros para o **mesmo polo**, arranjo chamado de mono-orientação, e o par inteiro fica sob tração para lados opostos. Duas consequências importantes decorrem daí: a separação seguinte será de homólogos, não de cromátides, e a orientação de cada bivalente na placa é **independente** da dos demais — é esse sorteio, chamado de distribuição independente, que gera 2^23 combinações possíveis no ser humano, somando-se à variabilidade já criada pelo crossing over.',
    roteiro: [
      'Conte as unidades na placa: bivalentes são mais espessos e menos numerosos que cromossomos isolados.',
      'Lembre que a orientação de cada par é aleatória — é o segundo mecanismo de variabilidade.',
    ],
  },

  'meiosis i: anaphase': {
    panorama:
      'A anáfase I é o momento que define a meiose como divisão **reducional**: os **cromossomos homólogos** se separam e migram para polos opostos, mas cada um leva consigo suas **duas cromátides irmãs ainda unidas** pelo centrômero. Isso é possível porque a coesina dos braços é degradada, liberando os quiasmas, enquanto a coesina centromérica permanece protegida pela shugoshina. O resultado é que cada polo recebe metade do número de cromossomos — de 46 para 23 no ser humano —, mas cada um deles ainda duplicado. Erros aqui produzem **não disjunção**, com um polo recebendo os dois homólogos, e são a causa mais frequente das trissomias, cuja incidência aumenta com a idade materna pela longa parada em prófase I.',
    roteiro: [
      'Verifique se as unidades que migram têm duas cromátides: é o que distingue de anáfase mitótica.',
      'Relacione a redução do número à separação de homólogos, e não de cromátides.',
    ],
  },

  'meiosis i: telophase': {
    panorama:
      'Na telófase I os dois conjuntos haploides — porém ainda com cromossomos duplicados — chegam aos polos, e o envoltório nuclear pode se reconstruir parcialmente enquanto a citocinese divide o citoplasma. O grau de descondensação varia muito entre espécies e entre os sexos: em muitos casos os cromossomos permanecem condensados e a célula passa direto à meiose II. Segue-se a **intercinese**, um intervalo curto em que **não há replicação do DNA** — é essa ausência que garante a redução final. No macho, a divisão gera dois espermatócitos secundários de tamanho igual; na fêmea, é radicalmente desigual, produzindo um oócito secundário grande e o primeiro corpúsculo polar, minúsculo.',
    roteiro: [
      'Confirme que não há fase S entre as duas divisões — é o que diferencia meiose de duas mitoses.',
      'Compare o tamanho das duas células resultantes para inferir se a gametogênese é masculina ou feminina.',
    ],
  },

  'completion of meiosis i': {
    panorama:
      'Ao final da meiose I, cada célula-filha é **haploide em número de cromossomos, mas ainda diploide em quantidade de DNA**, já que cada cromossomo mantém suas duas cromátides. É essa aparente contradição que confunde e vale fixar: n cromossomos, 2c de DNA. As células resultantes já são geneticamente distintas entre si e da mãe, por dois mecanismos independentes — o crossing over do paquíteno, que recombinou segmentos, e o sorteio independente dos bivalentes na metáfase I. No homem, as duas filhas são **espermatócitos secundários** de tamanho igual, que entram rapidamente na meiose II. Na mulher, são um **oócito secundário** e o primeiro corpúsculo polar, e o oócito para novamente, agora em metáfase II.',
    roteiro: [
      'Distinga número de cromossomos de quantidade de DNA ao classificar a célula.',
      'Verifique se houve divisão simétrica ou desigual do citoplasma.',
    ],
  },

  'meiosis ii: prophase': {
    panorama:
      'A prófase II é curta e simples, porque não há nada a parear: cada célula tem apenas um representante de cada par de homólogos. Os cromossomos, que podem ter descondensado parcialmente na intercinese, **recondensam**, o envoltório nuclear se rompe novamente e um novo fuso se organiza a partir dos centrossomos, que foram duplicados sem nova replicação de DNA. Não há complexo sinaptonêmico, não há crossing over e não há quiasmas — toda a recombinação já ocorreu na meiose I. A partir daqui, a mecânica é indistinguível da de uma mitose comum, com a diferença fundamental de que a célula é haploide e de que suas cromátides irmãs não são idênticas, por causa das trocas anteriores.',
    roteiro: [
      'Confirme a ausência de pareamento: sem bivalentes, a divisão é a segunda.',
      'Note que as cromátides irmãs já não são cópias exatas uma da outra.',
    ],
  },

  'meiosis ii: metaphase': {
    panorama:
      'Na metáfase II os cromossomos **individuais**, cada um com duas cromátides, alinham-se na placa equatorial exatamente como em uma metáfase mitótica — a diferença é o número, que é haploide, e o fato de as cromátides irmãs não serem geneticamente idênticas por causa do crossing over. Cada cromossomo volta seus dois cinetocoros para polos **opostos**, em bi-orientação, ao contrário do que ocorria na metáfase I. No oócito humano, é precisamente aqui que a célula fica **parada** após a ovulação, e só completa a divisão se houver fecundação: o espermatozoide dispara a onda de cálcio que reativa o ciclo, e o segundo corpúsculo polar é expulso.',
    roteiro: [
      'Compare o número de cromossomos com o de uma metáfase mitótica no mesmo tecido.',
      'Lembre da parada em metáfase II do oócito ao interpretar lâminas de ovário e tuba.',
    ],
  },

  'meiosis ii: anaphase': {
    panorama:
      'A anáfase II é **equacional**: a coesina centromérica, protegida na primeira divisão, é finalmente degradada, e as **cromátides irmãs** se separam, migrando para polos opostos como cromossomos independentes. O número de cromossomos por polo permanece haploide, mas a quantidade de DNA cai pela metade — de 2c para 1c —, completando a redução iniciada na primeira divisão. Cada cromátide carrega uma combinação única de alelos, resultado das trocas do paquíteno. Erros de segregação aqui também produzem aneuploidia, mas com consequências distintas das da não disjunção em anáfase I, porque afetam apenas duas das quatro células resultantes.',
    roteiro: [
      'Verifique que as unidades que migram têm cromátide única — é o critério da divisão equacional.',
      'Relacione a queda de 2c para 1c ao final da redução de DNA.',
    ],
  },

  'meiosis ii: telophase': {
    panorama:
      'Na telófase II os conjuntos haploides de cromossomos simples chegam aos polos, descondensam, o envoltório nuclear se reconstrói e a citocinese completa a separação. O resultado da meiose inteira são **quatro células haploides**, cada uma com n cromossomos e 1c de DNA, e todas geneticamente distintas. No macho, essas quatro se tornam **espermátides**, que ainda passarão pela espermiogênese — formação do acrossomo, condensação nuclear, montagem do flagelo, descarte de citoplasma — antes de virarem espermatozoides. Na fêmea, apenas uma se torna o **óvulo**, e as outras são corpúsculos polares que degeneram; o citoplasma inteiro foi concentrado em um só gameta, para sustentar as primeiras clivagens do embrião.',
    roteiro: [
      'Conte as células resultantes e compare seus tamanhos para identificar o sexo da gametogênese.',
      'Distinga espermátide de espermatozoide: a transformação seguinte não envolve divisão.',
    ],
  },

  'completion of meiosis ii': {
    panorama:
      'Concluída a meiose II, o balanço é o seguinte: de uma célula diploide 2n/4c saíram quatro células **n/1c**, todas com combinações genéticas diferentes. Três mecanismos produziram essa diversidade — o crossing over no paquíteno, o sorteio independente dos bivalentes na metáfase I, e o sorteio independente das cromátides na metáfase II. No macho, o rendimento é de quatro espermátides por espermatócito primário, e o processo é contínuo da puberdade em diante. Na fêmea, o rendimento útil é de um único óvulo, e a segunda divisão só se completa **no momento da fecundação**, com a expulsão do segundo corpúsculo polar, já dentro da tuba uterina, o que faz do óvulo maduro uma célula raramente observada.',
    roteiro: [
      'Verifique o rendimento — quatro gametas ou um — para identificar a linhagem.',
      'Lembre que o óvulo só completa a meiose se houver fecundação.',
    ],
  },

  'comparison of mitosis and meiosis': {
    panorama:
      'Comparar as duas divisões esclarece o papel de cada uma. A **mitose** tem uma divisão após uma replicação, produz **duas** células **diploides idênticas** à mãe, não há pareamento de homólogos nem crossing over, e o que se separa na anáfase são **cromátides irmãs**; serve ao crescimento, à renovação e ao reparo, e ocorre em células somáticas. A **meiose** tem **duas divisões após uma única replicação**, produz **quatro** células **haploides e geneticamente distintas**, inclui pareamento e recombinação na prófase I, e separa **homólogos** na primeira anáfase e cromátides na segunda; serve à reprodução sexuada e ocorre apenas nas linhagens germinativas. A meiose II, isolada, é mecanicamente igual a uma mitose de célula haploide.',
    roteiro: [
      'Pergunte o que se separa na anáfase: homólogos indicam meiose I, cromátides indicam mitose ou meiose II.',
      'Conte as células resultantes e verifique se são idênticas ou distintas.',
    ],
  },

  'cell division': {
    panorama:
      'A divisão celular tem duas modalidades com finalidades opostas. A **mitose** conserva: mantém o número de cromossomos e produz células idênticas, sustentando o crescimento do organismo, a renovação de epitélios e do sangue, e o reparo de lesões. A **meiose** diversifica e reduz: corta o número de cromossomos pela metade e recombina o material genético, produzindo gametas geneticamente únicos e permitindo que a fecundação restaure a diploidia sem duplicá-la a cada geração. Ambas são precedidas por uma única replicação do DNA na fase S, e ambas terminam com a **citocinese**, que reparte o citoplasma. A diferença essencial está em quantas divisões seguem a replicação e no que se separa em cada anáfase.',
    roteiro: [
      'Determine primeiro a modalidade pelo tecido: germinativo permite meiose, somático não.',
      'Depois estabeleça a fase pelo estado do envoltório nuclear e da cromatina.',
    ],
  },

  'endoplasmic reticulum': {
    panorama:
      'O retículo endoplasmático é uma rede contínua de membranas que ocupa boa parte do citoplasma e se apresenta em duas formas funcionalmente distintas, embora fisicamente conectadas. O **rugoso** tem cisternas achatadas e empilhadas cobertas de ribossomos, sintetiza proteínas destinadas à secreção, à membrana e às organelas, faz seu enovelamento e glicosilação inicial, e torna o citoplasma **basófilo** — daí a base azul do plasmócito e do ácino pancreático. O **liso** é uma rede de túbulos sem ribossomos, e faz síntese de lipídios e esteroides, detoxificação de fármacos pelo citocromo P450 e sequestro de cálcio; deixa o citoplasma **acidófilo ou pálido**. A proporção entre os dois é uma leitura direta da função da célula.',
    roteiro: [
      'Use a cor do citoplasma como indicador da forma dominante de retículo.',
      'Confirme em microscopia eletrônica pela presença ou ausência de ribossomos nas cisternas.',
    ],
  },

  'protein secretory pathway': {
    panorama:
      'A via secretora é uma sequência fixa que vale a pena guardar inteira: **RER, vesículas de transporte, face cis do Golgi, cisternas mediais, face trans, rede trans-Golgi, grânulos de secreção e membrana plasmática**. A proteína entra na cisterna do RER durante a própria tradução, guiada pelo peptídeo-sinal; ali é enovelada com auxílio de chaperonas e recebe a glicosilação inicial ligada a asparagina. No Golgi, sofre processamento sequencial — remoção e adição de açúcares, sulfatação, fosforilação — que funciona como endereçamento: manose-6-fosfato, por exemplo, direciona enzimas ao lisossomo. Na rede trans-Golgi, o material é classificado e empacotado. A liberação pode ser **constitutiva**, contínua, ou **regulada**, com grânulos que esperam um sinal.',
    roteiro: [
      'Localize RER e Golgi na mesma célula e note que estão sempre próximos e polarizados.',
      'Procure os grânulos maduros no ápice, do lado da luz — a polaridade revela a via.',
    ],
  },

  golgi: {
    panorama:
      'O complexo de Golgi é a estação de processamento e triagem da via secretora. É formado por uma pilha de quatro a oito **cisternas achatadas e curvas**, com polaridade bem definida: a face **cis** (de formação), convexa, voltada ao RER, recebe as vesículas de transporte; as cisternas **mediais** fazem o processamento; e a face **trans** (de maturação), côncava, dá origem à rede trans-Golgi, onde o material é classificado e empacotado em vesículas de destinos diferentes. As modificações realizadas — glicosilação terminal, sulfatação, fosforilação — funcionam como etiquetas de endereçamento. Em H&E, o Golgi aparece como uma **área clara** junto ao núcleo, negativa porque suas membranas não retêm corante, e é o halo característico do plasmócito.',
    roteiro: [
      'Procure a zona clara justanuclear como assinatura em microscopia de luz.',
      'Em microscopia eletrônica, oriente-se pela curvatura para identificar as faces cis e trans.',
    ],
  },

  microtubules: {
    panorama:
      'Os microtúbulos são tubos ocos de 25 µm de diâmetro externo formados por treze protofilamentos de dímeros de **alfa e beta-tubulina**, e são o maior dos três sistemas do citoesqueleto. São **polares**: a extremidade mais cresce rapidamente, a menos fica ancorada no centro organizador. Sua característica funcional decisiva é a **instabilidade dinâmica** — alternam crescimento e despolimerização abrupta, o que lhes permite explorar o espaço e capturar cinetocoros na mitose. Servem de trilho para as proteínas motoras **cinesina**, que caminha para a periferia, e **dineína**, que caminha para o centro, transportando organelas e vesículas. Formam ainda o fuso mitótico e o axonema de cílios e flagelos, onde a organização passa a 9+2.',
    roteiro: [
      'Confirme o diâmetro de 25 nm em microscopia eletrônica para separar dos demais filamentos.',
      'Relacione a instabilidade dinâmica ao mecanismo de ação dos quimioterápicos antimitóticos.',
    ],
  },

  'diplosome and mtoc': {
    panorama:
      'O diplossomo é o **par de centríolos** dispostos perpendicularmente entre si, e junto com o material pericentriolar amorfo que o envolve constitui o **centrossomo**, o principal centro organizador de microtúbulos (MTOC) da célula animal. É no material pericentriolar, e não nos centríolos em si, que ficam os anéis de **gama-tubulina** que nucleiam os microtúbulos, definindo a extremidade menos e determinando a polaridade de toda a rede citoplasmática. O centrossomo duplica-se na fase S, e os dois pares migram para polos opostos organizando o fuso mitótico. Em células ciliadas, os centríolos se multiplicam e migram para o ápice, onde cada um se torna o corpúsculo basal de um cílio.',
    roteiro: [
      'Procure o par perpendicular em L: a disposição é a assinatura do diplossomo.',
      'Note que a nucleação ocorre no material pericentriolar, não no centríolo.',
    ],
  },

  'diplosomes and mtoc': {
    panorama:
      'Os diplossomos — pares de centríolos perpendiculares — situam-se no centro do **material pericentriolar**, e o conjunto forma o centrossomo, principal centro organizador de microtúbulos. A distinção entre as duas partes importa: os centríolos são cilindros de nove trincas de microtúbulos, mas quem **nucleia** os microtúbulos citoplasmáticos são os complexos anelares de gama-tubulina do material amorfo em volta. É essa nucleação que estabelece a extremidade menos e, portanto, a direção do transporte por cinesina e dineína, organizando a geografia interna da célula. Antes da mitose, o centrossomo duplica; na mitose, os dois organizam os polos do fuso. Células vegetais montam fusos sem centríolos, o que mostra que eles não são indispensáveis à nucleação.',
    roteiro: [
      'Separe conceitualmente centríolo e material pericentriolar antes de atribuir funções.',
      'Siga os microtúbulos a partir do centrossomo para visualizar a polaridade da célula.',
    ],
  },

  lipid: {
    panorama:
      'Os lipídios aparecem nas células como **gotículas** de triglicerídeos ou de ésteres de colesterol, e sua leitura na lâmina depende inteiramente da técnica. Na rotina em parafina, os solventes da desidratação e da diafanização os **dissolvem por completo**, deixando espaços claros e redondos, de contorno nítido — é isso que se vê no adipócito, no espongiócito da suprarrenal, no sebócito e no hepatócito esteatótico. Para demonstrá-los é preciso corte de **congelação** e corantes lipossolúveis como o sudan negro ou o óleo vermelho, ou fixação em **ósmio**, que os enegrece. Funcionalmente, a gotícula não tem membrana verdadeira: é envolvida por uma monocamada de fosfolipídios com perilipinas, que regulam o acesso das lipases.',
    roteiro: [
      'Interprete espaços claros redondos e uniformes como lipídio extraído antes de supor outra coisa.',
      'Peça congelação com sudan quando a presença de gordura for a questão.',
    ],
  },

  structures: {
    panorama:
      'Este setor reúne as organelas e demais componentes internos da célula, e vale organizá-los por critério. Pela **presença de membrana**: têm membrana o núcleo, o retículo rugoso e liso, o Golgi, os lisossomos, os peroxissomos, as mitocôndrias e as vesículas; não têm ribossomos, centríolos, o citoesqueleto e as inclusões. Pela **função**: síntese e processamento (RER, Golgi, ribossomos), energia (mitocôndrias), digestão (lisossomos, peroxissomos), movimento e forma (citoesqueleto, centríolos, cílios), armazenamento (inclusões de glicogênio e lipídio) e controle (núcleo). Em microscopia de luz, quase nenhuma é vista diretamente; o que se vê são efeitos de conjunto, como a basofilia do RER ou o halo claro do Golgi.',
    roteiro: [
      'Classifique cada organela pelos dois critérios antes de estudá-la isoladamente.',
      'Traduza sempre o achado de luz no correlato ultraestrutural que o produz.',
    ],
  },

  'cell shapes: stellate': {
    panorama:
      'A forma estrelada resulta de múltiplos prolongamentos citoplasmáticos que partem de um corpo central, e aparece sempre que uma célula precisa **alcançar muitos parceiros ou cobrir muito território** com pouco volume. É a forma do **astrócito**, cujos prolongamentos envolvem sinapses de um lado e capilares do outro; do **neurônio multipolar**, com seus dendritos; do **osteócito**, cujos prolongamentos correm em canalículos e se acoplam por junções comunicantes, mantendo a comunicação através da matriz mineralizada; das **células dendríticas** e dos **melanócitos**, que distribuem produto a muitas células vizinhas; e das células mesenquimais do tecido conjuntivo mucoso. Em H&E, os prolongamentos finos raramente aparecem, e a célula parece apenas irregular.',
    roteiro: [
      'Peça impregnação por prata ou imuno-histoquímica quando quiser ver os prolongamentos.',
      'Relacione a forma à necessidade de contato múltiplo, e não a um tipo celular específico.',
    ],
  },

  'cell shapes: spindle': {
    panorama:
      'A forma fusiforme — alongada, com extremidades afiladas e núcleo central também alongado — é característica de células que **exercem ou resistem a força ao longo de um eixo**. A **célula muscular lisa** é o exemplo canônico: fusiforme, com núcleo em charuto que se enruga em saca-rolhas quando ela contrai, arranjada em feixes cujas extremidades finas se encaixam nas porções largas das vizinhas, o que permite empacotamento denso. O **fibroblasto** também é fusiforme, alinhado com a direção dos feixes de colágeno que produz, e o **fibrócito** quiescente aparece como uma simples linha nuclear entre as fibras. Em corte transversal, qualquer célula fusiforme vira um círculo pequeno, e apenas parte dos perfis mostra núcleo.',
    roteiro: [
      'Confirme o plano de corte antes de classificar: transversalmente, fusiforme parece redondo.',
      'Procure o enrugamento do núcleo como sinal de músculo liso contraído.',
    ],
  },

  shapes: {
    panorama:
      'A forma de uma célula não é arbitrária: resulta do equilíbrio entre o **córtex de actina**, que tende a minimizar a superfície, e as forças externas de adesão e de matriz. Daí um pequeno repertório recorrente e legível. **Esférica** é a forma de células livres ou suspensas, sem adesão — leucócitos, oócito, condrócito isolado. **Pavimentosa e achatada** aparece onde a difusão precisa ser rápida — endotélio, mesotélio, pneumócito tipo I. **Cúbica e colunar** acompanham a necessidade de espaço interno para organelas de absorção e secreção. **Fusiforme** indica força ao longo de um eixo. **Estrelada** indica contato múltiplo. **Discoide bicôncava** é exclusiva da hemácia e maximiza área de troca e deformabilidade.',
    roteiro: [
      'Pergunte o que toca a célula e que força ela exerce: a forma decorre disso.',
      'Use a forma como hipótese funcional, a ser confirmada pelo contexto do tecido.',
    ],
  },

  basics: {
    panorama:
      'Os fundamentos da célula reúnem o que se aplica a todas elas antes de qualquer especialização. Toda célula tem **membrana plasmática**, uma bicamada lipídica com proteínas móveis que delimita, transporta e sinaliza; um **núcleo** com o genoma, exceto na hemácia madura e na plaqueta; e um **citoplasma** com organelas e citoesqueleto. Três propriedades gerais orientam a leitura de lâminas: a **forma** decorre das forças de adesão e do córtex de actina; a **polaridade** distingue domínios apical e basolateral em epitélios e viabiliza o transporte vetorial; e a **afinidade tintorial** traduz composição química — basofilia indica ácidos nucleicos e síntese proteica, acidofilia indica proteína estrutural, mitocôndrias e filamentos.',
    roteiro: [
      'Aplique as três chaves — forma, polaridade e afinidade — antes de procurar detalhes.',
      'Lembre que quase nenhuma organela é visível diretamente em luz: leia efeitos de conjunto.',
    ],
  },

  // ---- Olho ----

  'eyelid: meibomium gland': {
    panorama:
      'As glândulas de Meibômio, ou tarsais, são glândulas **sebáceas grandes e modificadas** alojadas dentro do tarso, a placa de conjuntivo denso que dá rigidez à pálpebra. Diferentemente das sebáceas comuns, **não estão ligadas a folículos pilosos**: seus ácinos se dispõem enfileirados ao longo de um ducto central longo, que desemboca na margem palpebral, atrás dos cílios. A secreção é **holócrina**, com o mesmo gradiente de vacuolização dos sebócitos, e o produto é o **meibum**, uma mistura lipídica que forma a camada superficial do filme lacrimal e retarda sua evaporação. A obstrução de um ducto produz o calázio, granuloma lipídico crônico, distinto do hordéolo, que é infecção das glândulas de Zeis ou de Moll.',
    roteiro: [
      'Siga os ácinos enfileirados até o ducto central para confirmar a arquitetura.',
      'Confirme a ausência de folículo piloso — é o que separa de uma sebácea comum.',
    ],
  },

  'eyelid: conjunctiva': {
    panorama:
      'A conjuntiva é a mucosa fina e transparente que reveste a face interna das pálpebras e a superfície anterior da esclera. Divide-se em **palpebral**, aderida ao tarso, **bulbar**, frouxamente ligada à esclera, e o **fórnice**, o fundo de saco que as une e permite o movimento do bulbo. O epitélio é **estratificado colunar** na palpebral, tornando-se estratificado pavimentoso não queratinizado perto do limbo, e contém **células caliciformes** dispersas, mais numerosas no fórnice, que produzem a camada de mucina do filme lacrimal. A lâmina própria é conjuntivo frouxo muito vascularizado, com tecido linfoide difuso e nódulos — o tecido linfoide associado à conjuntiva, primeira defesa da superfície ocular.',
    roteiro: [
      'Localize o fórnice para orientar as três porções.',
      'Procure caliciformes: sua ausência prolongada explica a instabilidade do filme lacrimal.',
    ],
  },

  'globe: retina': {
    panorama:
      'A retina é a túnica interna do bulbo e organiza-se em **dez camadas** que, embora numerosas, seguem uma lógica simples: são a cadeia de três neurônios em série mais suas zonas de sinapse. De fora para dentro: epitélio pigmentar; camada de segmentos de cones e bastonetes; membrana limitante externa; camada nuclear externa, com os corpos dos fotorreceptores; camada plexiforme externa, onde eles fazem sinapse com bipolares e horizontais; camada nuclear interna, com bipolares, horizontais, amácrinas e células de Müller; camada plexiforme interna; camada de células ganglionares; camada de fibras nervosas, que convergem para o disco óptico; e membrana limitante interna. A luz atravessa tudo antes de alcançar os fotorreceptores.',
    roteiro: [
      'Conte as camadas de fora para dentro e associe cada nuclear ao neurônio correspondente.',
      'Localize a fóvea e o disco óptico, que quebram o padrão de camadas.',
    ],
  },

  'non-sensory retina': {
    panorama:
      'A retina não sensorial, ou porção cega, é a continuação anterior das duas folhas retinianas sobre o **corpo ciliar** e a **íris**, além da **ora serrata**, onde a porção fotossensível termina. Ali as duas folhas persistem, mas nenhuma delas tem fotorreceptores: a folha externa mantém-se **pigmentada** e a interna torna-se **não pigmentada**, e juntas formam o epitélio duplo característico do corpo ciliar, que secreta o humor aquoso, e o epitélio posterior da íris, intensamente pigmentado, que bloqueia a luz. A disposição dos ápices voltados um para o outro é herança direta da invaginação da vesícula óptica no embrião, e é o que explica essa arquitetura aparentemente estranha.',
    roteiro: [
      'Procure o epitélio duplo com camadas de pigmentação oposta para confirmar a porção cega.',
      'Localize a ora serrata como a fronteira entre as duas porções.',
    ],
  },

  'non-sensory retina: ora serrata': {
    panorama:
      'A ora serrata é a linha ondulada e denteada — daí o nome — que marca a **transição abrupta** entre a retina sensorial e a não sensorial, aproximadamente no equador anterior do bulbo. Ali, as nove camadas da retina neural terminam de uma só vez: os fotorreceptores, os neurônios bipolares e as células ganglionares desaparecem, e o que continua para a frente é apenas um epitélio de duas camadas sobre o corpo ciliar. O epitélio pigmentar, ao contrário, prossegue sem interrupção. É também o ponto de aderência mais firme entre retina e coroide e o limite anterior do descolamento de retina típico, o que faz dele uma referência clínica constante no exame de fundo de olho.',
    roteiro: [
      'Ache o ponto em que as camadas neurais somem simultaneamente.',
      'Verifique que o epitélio pigmentar continua além da transição.',
    ],
  },

  'sensory retina: fovea': {
    panorama:
      'A fóvea central é a região de maior acuidade visual e sua arquitetura é toda desenhada para isso. É uma depressão no centro da mácula em que as **camadas internas da retina são deslocadas lateralmente**, de modo que a luz chega aos fotorreceptores quase sem atravessar tecido interposto. Ali existem **apenas cones**, muito finos e densamente empacotados, e a relação com as células ganglionares aproxima-se de um para um — cada cone tem sua própria linha de saída, ao contrário da periferia, onde dezenas de bastonetes convergem para uma ganglionar. Não há vasos na fovéola, que se nutre exclusivamente por difusão a partir da coriocapilar, o que a torna especialmente vulnerável na degeneração macular.',
    roteiro: [
      'Procure o afastamento lateral das camadas internas como o achado que define a fóvea.',
      'Confirme a ausência de bastonetes e de vasos no centro.',
    ],
  },

  'sensory retina: optic disc': {
    panorama:
      'O disco óptico é o ponto em que todos os axônios das células ganglionares convergem, atravessam a esclera pela **lâmina crivosa** e formam o nervo óptico. Como ali não existem fotorreceptores nem camadas retinianas, ele é o **ponto cego** fisiológico do campo visual. É também por onde entram e saem a artéria e a veia central da retina. Duas particularidades anatômicas explicam boa parte da clínica: a lâmina crivosa é o ponto mecanicamente mais frágil, e o aumento da pressão intraocular a deforma, comprimindo os axônios — o mecanismo do **glaucoma**; e o disco não tem barreira hematoencefálica completa, o que permite que a hipertensão intracraniana se manifeste ali como papiledema.',
    roteiro: [
      'Ache a interrupção súbita de todas as camadas retinianas.',
      'Siga os feixes de axônios atravessando a esclera pela lâmina crivosa.',
    ],
  },

  eye: {
    panorama:
      'O olho é um órgão fotossensível construído como uma câmara. O sistema **dióptrico** — córnea, humor aquoso, cristalino e corpo vítreo — refrata e focaliza a luz; a **córnea** faz a maior parte da refração, e o **cristalino** faz o ajuste fino pela acomodação. O **diafragma** é a íris, que regula a quantidade de luz. O **sensor** é a retina, com cones para visão de detalhe e cor e bastonetes para baixa luminosidade. Três túnicas concêntricas organizam a parede: fibrosa (esclera e córnea), vascular ou úvea (coroide, corpo ciliar e íris) e nervosa (retina). Estruturas anexas — pálpebras, conjuntiva, aparelho lacrimal e músculos extrínsecos — protegem, lubrificam e movem o bulbo.',
    roteiro: [
      'Percorra as três túnicas antes de examinar qualquer região isoladamente.',
      'Separe o que refrata do que capta: são dois sistemas com histologias distintas.',
    ],
  },

  // ---- Ouvido ----

  'overview: outer and middle ear': {
    panorama:
      'O ouvido externo e o médio formam juntos o **aparelho de condução** do som. O externo capta e canaliza: o pavilhão é cartilagem elástica revestida por pele aderente, e o meato acústico externo é um canal sustentado por cartilagem no terço externo e por osso nos dois terços internos, com glândulas ceruminosas e pelos que o protegem. O médio transforma: a **membrana timpânica** vibra, e a cadeia de ossículos — martelo, bigorna e estribo — transmite essa vibração à janela oval, amplificando a pressão em cerca de vinte vezes graças à razão entre as áreas do tímpano e da platina do estribo. Essa amplificação resolve a diferença de impedância entre o ar e a perilinfa. A tuba auditiva equilibra as pressões.',
    roteiro: [
      'Separe o que conduz do que transduz: aqui não há epitélio sensorial algum.',
      'Confirme o tipo de suporte do meato para localizar o segmento no corte.',
    ],
  },

  'overview: inner ear': {
    panorama:
      'O ouvido interno é onde a vibração vira impulso nervoso, e sua organização é a de um **labirinto dentro de outro**. O **labirinto ósseo** é um sistema de cavidades escavadas no osso temporal — vestíbulo, canais semicirculares e cóclea — preenchido por **perilinfa**, líquido semelhante ao extracelular, rico em sódio. Dentro dele, suspenso por trabéculas, está o **labirinto membranoso** — utrículo, sáculo, ductos semicirculares e ducto coclear — preenchido por **endolinfa**, líquido único no corpo por ser rico em **potássio**, secretado pela estria vascular. É essa composição iônica peculiar que cria o potencial endococlear e viabiliza a transdução. Os epitélios sensoriais ficam todos no labirinto membranoso.',
    roteiro: [
      'Identifique os dois espaços líquidos antes de procurar epitélio sensorial.',
      'Lembre da composição iônica invertida da endolinfa — ela é a base da transdução.',
    ],
  },

  'overview of the ear': {
    panorama:
      'O ouvido reúne dois sentidos em um único órgão e três compartimentos com histologias distintas. O **externo** capta o som: pavilhão de cartilagem elástica e meato revestido de pele com glândulas ceruminosas. O **médio** é uma cavidade aérea que casa a impedância entre ar e líquido, com a membrana timpânica e os três ossículos, ligada à faringe pela tuba auditiva. O **interno** transduz: um labirinto ósseo com perilinfa contendo um labirinto membranoso com endolinfa, onde ficam os epitélios sensoriais — o **órgão de Corti**, na cóclea, para a audição; as **máculas** do utrículo e do sáculo, para a aceleração linear e a gravidade; e as **cristas ampulares**, para a aceleração angular.',
    roteiro: [
      'Determine o compartimento antes de qualquer detalhe: cada um tem histologia própria.',
      'Separe o que é auditivo do que é vestibular dentro do labirinto.',
    ],
  },

  'external ear': {
    panorama:
      'O ouvido externo compreende o pavilhão auricular e o meato acústico externo, e tem uma composição notavelmente uniforme: **cartilagem elástica** recoberta por **pele fina e aderente**, com pericôndrio e derme praticamente fundidos. A cartilagem elástica, com sua rede densa de fibras coradas pelo Verhoeff, dá forma e flexibilidade sem rigidez, e é por isso que o pavilhão retorna à forma após deformado. A pele contém pelos, glândulas sebáceas e, na porção cartilaginosa do meato, **glândulas ceruminosas** — sudoríparas apócrinas modificadas de luz ampla. Nos dois terços internos do meato, o suporte passa a ser o osso temporal e a pele fica muito fina e firmemente aderida ao periósteo.',
    roteiro: [
      'Confirme que a cartilagem é elástica e não hialina, com coloração específica se possível.',
      'Verifique se há pelos e glândulas para localizar-se na porção cartilaginosa.',
    ],
  },

  'external ear: auricle': {
    panorama:
      'O pavilhão auricular é uma lâmina de **cartilagem elástica** de contorno complexo, coberta em ambas as faces por pele fina cujo tecido subcutâneo é escasso ou ausente — a derme adere diretamente ao pericôndrio, o que explica a dor intensa de qualquer coleção nessa interface e o risco de necrose da cartilagem no hematoma auricular. A cartilagem elástica tem condrócitos em lacunas dentro de uma matriz permeada por uma rede densa de fibras elásticas, que só se revela em colorações específicas como o Verhoeff ou a orceína; em H&E, ela pode ser confundida com hialina. O lóbulo, na porção inferior, não tem cartilagem: é apenas pele e tecido adiposo.',
    roteiro: [
      'Peça coloração para elastina antes de classificar a cartilagem.',
      'Note a ausência de tecido subcutâneo entre a derme e o pericôndrio.',
    ],
  },

  'stapes and oval window': {
    panorama:
      'O estribo é o menor osso do corpo e o último elo da cadeia ossicular. Sua **platina** encaixa-se na **janela oval**, abertura do labirinto ósseo, presa por um ligamento anular que permite o movimento em pistão. A relação de áreas é o coração do sistema: a membrana timpânica tem cerca de dezessete vezes a área da platina, e a alavanca da cadeia acrescenta mais um fator, de modo que a pressão sobre a perilinfa é amplificada aproximadamente vinte vezes — exatamente o necessário para vencer a impedância do líquido. O músculo **estapédio**, inserido no colo do estribo, reduz essa transmissão diante de sons intensos, no reflexo de proteção. A fixação da platina por otosclerose produz surdez de condução.',
    roteiro: [
      'Ache o ligamento anular entre a platina e a borda da janela.',
      'Relacione a razão de áreas ao ganho de pressão — é a lógica de todo o ouvido médio.',
    ],
  },

  'middle ear: mucosa': {
    panorama:
      'A mucosa que forra a cavidade timpânica é fina e aderente ao periósteo, formando um **mucoperiósteo**, e reveste também os ossículos, os músculos e a face interna da membrana timpânica. O epitélio varia topograficamente: é **simples pavimentoso a cúbico** na maior parte da caixa, e torna-se progressivamente **pseudoestratificado ciliado com células caliciformes** à medida que se aproxima do óstio da tuba auditiva, continuando-se com o epitélio respiratório da nasofaringe. Essa continuidade explica a fisiopatologia da otite média: a inflamação da via aérea superior sobe pela tuba, e o transporte mucociliar em direção à faringe é o mecanismo natural de drenagem da caixa.',
    roteiro: [
      'Siga a mudança de epitélio em direção à tuba: ela é gradual e informa a orientação.',
      'Note que a mucosa adere ao periósteo, sem submucosa própria.',
    ],
  },

  'overview: osseous labyrinth': {
    panorama:
      'O labirinto ósseo é um conjunto de cavidades escavadas na porção petrosa do temporal, revestidas por endósteo e preenchidas por **perilinfa**, líquido de composição semelhante à do extracelular, rico em sódio. Tem três partes contínuas: o **vestíbulo**, câmara central que aloja o utrículo e o sáculo e onde se abrem as janelas oval e redonda; os **canais semicirculares**, três, em planos aproximadamente perpendiculares, cada um com uma ampola; e a **cóclea**, um canal espiralado de duas voltas e meia em torno do modíolo. Dentro do labirinto ósseo, suspenso por trabéculas de conjuntivo, está o labirinto membranoso, que repete a forma do ósseo em escala menor.',
    roteiro: [
      'Localize o modíolo e as janelas para orientar o corte.',
      'Distinga o espaço perilinfático do endolinfático em cada perfil observado.',
    ],
  },

  'overview: membranous labyrinth': {
    panorama:
      'O labirinto membranoso é um sistema fechado de sacos e ductos de tecido conjuntivo revestido por epitélio, suspenso dentro do labirinto ósseo e preenchido por **endolinfa** — um líquido singular no corpo por ser rico em **potássio** e pobre em sódio, produzido pela estria vascular do ducto coclear e pelas células escuras do vestíbulo. Compreende o **utrículo** e o **sáculo**, no vestíbulo, com suas máculas; os três **ductos semicirculares**, com as cristas ampulares; e o **ducto coclear**, com o órgão de Corti. Todas essas regiões sensoriais compartilham o mesmo princípio: células ciliadas cujos estereocílios, ao se dobrarem, abrem canais e despolarizam a célula, graças ao alto potássio da endolinfa.',
    roteiro: [
      'Ache as regiões sensoriais como espessamentos do epitélio, sempre cobertas por massa gelatinosa.',
      'Confirme que o espaço em que elas se abrem é o endolinfático.',
    ],
  },

  'overview: cranial nerve viii': {
    panorama:
      'O oitavo nervo craniano, vestibulococlear, é puramente sensitivo e reúne dois componentes de origens e gânglios distintos. A **divisão coclear** parte do órgão de Corti; seus neurônios são **bipolares**, com corpos no gânglio espiral, alojado no canal de Rosenthal dentro do modíolo, e seus prolongamentos centrais vão aos núcleos cocleares do bulbo. A **divisão vestibular** parte das máculas e das cristas ampulares; seus neurônios também são bipolares, com corpos no gânglio vestibular (de Scarpa), no meato acústico interno, e projetam-se aos núcleos vestibulares. A presença de neurônios bipolares em gânglio sensorial é uma exceção: em quase todo o resto do corpo eles são pseudounipolares.',
    roteiro: [
      'Ache os corpos bipolares no gânglio para confirmar a identidade do nervo.',
      'Separe as duas divisões pelo destino periférico das fibras.',
    ],
  },

  'overview of the inner ear': {
    panorama:
      'O ouvido interno abriga dois órgãos sensoriais distintos que compartilham a mesma solução mecânica. Em ambos, uma **célula ciliada** projeta um feixe escalonado de **estereocílios** que mergulha em uma **massa gelatinosa**; quando o líquido se move, a massa desloca-se, os estereocílios se dobram e canais de transdução se abrem, deixando entrar potássio da endolinfa e despolarizando a célula. O que muda é o estímulo que move o líquido e a natureza da massa: na **cóclea**, é a onda sonora e a massa é a membrana tectória; na **crista ampular**, é a rotação da cabeça e a massa é a cúpula, sem cristais; na **mácula**, é a aceleração linear e a gravidade, e a massa carrega **otocônias**.',
    roteiro: [
      'Identifique a massa gelatinosa e verifique se ela tem cristais — isso classifica o receptor.',
      'Confirme que o feixe de estereocílios está imerso no espaço endolinfático.',
    ],
  },

  audition: {
    panorama:
      'A audição é uma cadeia de conversões, e vale segui-la inteira. A onda sonora aérea move a **membrana timpânica**; a cadeia ossicular a transmite à janela oval com ganho de pressão de cerca de vinte vezes; a platina do estribo empurra a **perilinfa** da rampa vestibular, gerando uma onda que percorre a cóclea e desloca a **membrana basilar**. Essa membrana é estreita e rígida na base e larga e flexível no ápice, de modo que cada frequência tem seu ponto de deslocamento máximo — é a **tonotopia**, com agudos na base e graves no ápice. O deslocamento cisalha os estereocílios das células ciliadas contra a **membrana tectória**, abrindo canais de transdução; as **internas** transduzem, e as **externas** amplificam ativamente.',
    roteiro: [
      'Percorra a cadeia em ordem e nomeie o meio em que a energia trafega em cada etapa.',
      'Relacione a posição ao longo da cóclea à frequência — é a base da audiometria.',
    ],
  },

  'inner ear': {
    panorama:
      'O ouvido interno contém os epitélios sensoriais da audição e do equilíbrio, sempre alojados no **labirinto membranoso**, banhados por endolinfa e envolvidos por perilinfa dentro do labirinto ósseo. São seis regiões sensoriais em cada orelha: o **órgão de Corti** no ducto coclear, as **máculas** do utrículo e do sáculo, e as três **cristas ampulares** dos ductos semicirculares. Todas compartilham a mesma célula transdutora — a célula ciliada, dos tipos I e II —, células de sustentação, e uma cobertura gelatinosa que acopla o movimento do líquido aos estereocílios. A inervação vem de neurônios **bipolares** dos gânglios espiral e vestibular, reunidos no oitavo nervo craniano.',
    roteiro: [
      'Localize a região sensorial pelo espessamento do epitélio e pela massa gelatinosa sobre ele.',
      'Verifique se há otocônias para separar mácula das demais regiões.',
    ],
  },

  ear: {
    panorama:
      'A orelha é um órgão duplo: responde pela **audição** e pelo **equilíbrio**, funções que compartilham a mesma célula transdutora mas ocupam regiões distintas do labirinto. Estruturalmente divide-se em externa, média e interna. As duas primeiras conduzem e amplificam a energia sonora, resolvendo a passagem do ar para o líquido; a terceira transduz. As histologias são bem diferentes: cartilagem elástica e pele na externa; cavidade aérea revestida por epitélio simples com ossículos e músculos esqueléticos na média; e um labirinto ósseo com perilinfa contendo um labirinto membranoso com endolinfa na interna, onde ficam o órgão de Corti, as máculas e as cristas ampulares.',
    roteiro: [
      'Determine o compartimento antes de descrever: cada um exige um vocabulário diferente.',
      'Nas regiões sensoriais, procure sempre a tríade célula ciliada, sustentação e massa gelatinosa.',
    ],
  },

  // ---- Pele ----

  'thick skin': {
    panorama:
      'A pele espessa ocorre apenas nas **palmas das mãos e plantas dos pés**, e o adjetivo se refere à espessura da **epiderme**, não à da pele como um todo. Suas marcas são um **estrato córneo muito espesso**, que pode ter dezenas de camadas, e a presença de um **estrato lúcido** — faixa clara, refringente e acelular entre o granuloso e o córneo, praticamente exclusiva dessa localização. A epiderme forma cristas profundas que se encaixam em papilas dérmicas altas, arranjo que resiste ao cisalhamento e produz as impressões digitais. Não há **folículos pilosos** nem glândulas sebáceas, mas há grande densidade de glândulas sudoríparas écrinas e muitos corpúsculos de Meissner e de Pacini.',
    roteiro: [
      'Procure o estrato lúcido e a ausência de pelos: os dois juntos fecham a classificação.',
      'Compare a espessura do córneo com a da epiderme viva.',
    ],
  },

  'thin skin': {
    panorama:
      'A pele fina cobre a maior parte do corpo, e "fina" refere-se à **epiderme**, que pode ter poucas camadas mesmo onde a derme é espessa — como no dorso, onde a pele total é das mais grossas do corpo. O **estrato córneo** é delgado, o **granuloso** tem uma ou duas fileiras e pode ser descontínuo, e o **estrato lúcido está ausente**. As cristas epidérmicas são rasas e as papilas dérmicas, baixas. Em compensação, a pele fina tem **folículos pilosos** com suas glândulas sebáceas, ausentes na pele espessa, e glândulas sudoríparas em densidade menor. É essa presença de anexos pilossebáceos, mais que a espessura em si, o critério mais confiável na lâmina.',
    roteiro: [
      'Procure folículos pilosos: sua presença já exclui pele espessa.',
      'Confirme a ausência do estrato lúcido antes de concluir.',
    ],
  },

  'thick vs thin skin': {
    panorama:
      'A comparação entre os dois tipos de pele fixa vários conceitos de uma vez. A **espessa**, restrita a palmas e plantas, tem epiderme com cinco estratos, incluindo o **lúcido**, córneo muito espesso, cristas profundas, e **não tem pelos nem glândulas sebáceas**; tem alta densidade de écrinas e de mecanorreceptores. A **fina**, no restante do corpo, tem quatro estratos, córneo delgado, granuloso escasso, cristas rasas, e **tem folículos pilosos e glândulas sebáceas**. Uma advertência importante: o adjetivo qualifica a epiderme, não a pele total — a pele do dorso é fina por esse critério, apesar de sua derme ser das mais espessas do corpo, e a das pálpebras é fina nos dois sentidos.',
    roteiro: [
      'Aplique dois critérios independentes — estrato lúcido e presença de pelos — antes de concluir.',
      'Não use a espessura total da lâmina como critério; ela mede sobretudo a derme.',
    ],
  },

  'overview of the skin': {
    panorama:
      'A pele desempenha funções que vão muito além do revestimento: é **barreira** física, química e imunológica; participa da **termorregulação** pela vasodilatação dérmica e pelo suor; é órgão **sensorial**, com receptores para tato, pressão, vibração, temperatura e dor; sintetiza **vitamina D** sob radiação ultravioleta; e protege contra essa mesma radiação pela melanina. Estruturalmente é epiderme mais derme, com hipoderme abaixo, e reúne anexos de origem epidérmica alojados na derme. Na lâmina, três decisões orientam a leitura: pele espessa ou fina; quais anexos estão presentes; e em que camada da derme se está — papilar frouxa ou reticular densa.',
    roteiro: [
      'Tome as três decisões de orientação antes de descrever qualquer detalhe.',
      'Relacione cada estrutura observada a uma das funções listadas.',
    ],
  },

  'epidermis: light-dark skin': {
    panorama:
      'A diferença de cor entre peles claras e escuras **não está no número de melanócitos**, que é praticamente o mesmo em todas as populações humanas, e sim no comportamento dos **melanossomos**. Em peles escuras eles são maiores, mais numerosos por melanócito, mais melanizados, permanecem **individuais** dentro dos queratinócitos em vez de se agruparem em complexos, e são degradados mais lentamente — de modo que a melanina alcança camadas mais superficiais da epiderme, chegando até o estrato córneo. Em peles claras, os melanossomos são menores, agrupam-se em complexos envoltos por membrana e são degradados cedo, ficando restritos às camadas basais. A melanina posiciona-se como capuz sobre o núcleo, protegendo o DNA.',
    roteiro: [
      'Observe até que altura da epiderme o pigmento chega — é essa distribuição que muda.',
      'Não conte melanócitos esperando encontrar diferença: ela não está no número.',
    ],
  },

  'stratum spinosum: langerhans cell': {
    panorama:
      'A célula de Langerhans é a **apresentadora de antígeno** da epiderme e reside principalmente no meio do estrato espinhoso. Deriva de precursores hematopoéticos, e não do ectoderma, e por isso não faz desmossomos com os queratinócitos — em H&E aparece como uma célula clara, de núcleo indentado, difícil de distinguir de um melanócito sem marcação específica. Seus prolongamentos dendríticos formam uma rede que permeia toda a epiderme, captando antígenos que atravessam a barreira; ao capturá-los, a célula migra pelos linfáticos até o linfonodo regional, onde apresenta o antígeno aos linfócitos T. Sua marca ultraestrutural é o **grânulo de Birbeck**, em forma de raquete, e ela expressa CD1a e langerina.',
    roteiro: [
      'Peça imuno-histoquímica para S-100 ou CD1a: em H&E a identificação é insegura.',
      'Lembre que célula clara na basal é provavelmente melanócito; no espinhoso, Langerhans.',
    ],
  },

  'stratum corneum - thin skin': {
    panorama:
      'Na pele fina, o estrato córneo tem poucas camadas de **corneócitos** — células achatadas, anucleadas e sem organelas, cheias de queratina agregada por filagrina e envoltas por um envelope proteico reticulado. A barreira real, porém, não são as células e sim o **cimento lipídico** entre elas, despejado pelos corpos lamelares na transição do granuloso, que organiza lamelas de ceramidas, colesterol e ácidos graxos livres — daí a metáfora do tijolo e argamassa. Mesmo delgado, esse arranjo reduz a perda de água transepidérmica a valores mínimos. As camadas mais superficiais se soltam por degradação enzimática dos corneodesmossomos, na descamação, e o processo mantém a espessura constante.',
    roteiro: [
      'Confirme a ausência de núcleos e a continuidade da camada.',
      'Compare a espessura com a da epiderme viva subjacente para calibrar.',
    ],
  },

  'strata lucidum and corneum - thick skin': {
    panorama:
      'Na pele espessa, entre o granuloso e o córneo, aparece o **estrato lúcido**: uma faixa fina, clara e homogênea, refringente, formada por células achatadas já anucleadas cujos limites não são visíveis e cujo citoplasma contém **eleidina**, um produto de transformação da querato-hialina. É praticamente exclusivo de palmas e plantas, e sua presença é um dos dois critérios que definem a pele espessa. Acima dele, o **estrato córneo** é muitíssimo espesso, com dezenas de camadas de corneócitos firmemente coesas, capaz de suportar atrito contínuo. A espessura dessa camada é dinâmica: aumenta com o uso, o que produz calosidades, e diminui na ausência de carga mecânica.',
    roteiro: [
      'Procure a faixa clara e homogênea logo acima do granuloso.',
      'Confirme a ausência de folículos pilosos para fechar a identificação de pele espessa.',
    ],
  },

  'stratum corneum': {
    panorama:
      'O estrato córneo é a camada mais superficial da epiderme e a barreira efetiva do corpo. É formado por **corneócitos**: queratinócitos que perderam núcleo e organelas, ficaram achatados e se encheram de filamentos de queratina agregados pela filagrina, revestidos internamente por um **envelope cornificado** de involucrina e loricrina reticuladas por transglutaminase. Entre eles, lamelas de **lipídios** — ceramidas, colesterol e ácidos graxos — formam o cimento impermeável liberado pelos corpos lamelares. O conjunto é frequentemente descrito como tijolos e argamassa. As células se destacam quando enzimas degradam os corneodesmossomos, e o equilíbrio entre produção e descamação mantém a espessura estável; sua ruptura está por trás da psoríase e da dermatite atópica.',
    roteiro: [
      'Note o padrão em cesta trançada do córneo em cortes de rotina — é artefato de processamento, mas é característico.',
      'Meça a espessura relativa à epiderme viva para classificar a pele.',
    ],
  },

  "meisser's corpuscle": {
    panorama:
      'O corpúsculo de Meissner é o mecanorreceptor do **toque leve e discriminativo**, alojado dentro das **papilas dérmicas**, imediatamente sob a epiderme — posição que o coloca no ponto mais próximo possível do estímulo. Tem forma cilíndrica alongada e perpendicular à superfície, e é formado por células de sustentação achatadas empilhadas obliquamente, entre as quais serpenteia um axônio mielinizado que perde a bainha ao entrar no corpúsculo. Adapta-se rapidamente, respondendo a movimento e a variações de textura mais do que a pressão constante. Sua densidade é máxima na polpa digital, nos lábios e nos mamilos, e diminui com a idade, o que explica a perda de sensibilidade tátil fina no idoso.',
    roteiro: [
      'Confirme a localização dentro da papila dérmica antes de nomear.',
      'Note o eixo perpendicular à superfície e o empilhamento oblíquo das células.',
    ],
  },

  'hair follicle': {
    panorama:
      'O folículo piloso é uma invaginação tubular da epiderme para dentro da derme, e sua parte mais importante é o **bulbo**, na base, onde a **matriz** — o compartimento proliferativo — envolve a **papila dérmica**, um tufo de conjuntivo vascularizado que induz e comanda o crescimento. As células da matriz se dividem e diferenciam formando, de dentro para fora, a **medula**, o **córtex** e a **cutícula** do pelo, mais as bainhas radiculares interna e externa. Melanócitos da matriz pigmentam o pelo. O folículo passa por um ciclo com fases de crescimento (anágena), regressão (catágena) e repouso (telógena). A ele se ligam a glândula sebácea e o músculo eretor do pelo, formando a unidade pilossebácea.',
    roteiro: [
      'Ache o bulbo e a papila dérmica para orientar todo o folículo.',
      'Conte as camadas concêntricas do pelo e das bainhas em corte transversal.',
    ],
  },

  fingernail: {
    panorama:
      'A unha é uma placa de **queratina dura**, do mesmo tipo da do pelo e diferente da queratina mole da epiderme, produzida pela **matriz ungueal** — o epitélio proliferativo situado sob a raiz da unha, cuja porção distal aparece como a **lúnula**, a meia-lua esbranquiçada. A placa desliza sobre o **leito ungueal**, um epitélio sem estrato granuloso, firmemente aderido ao periósteo da falange distal por cristas longitudinais que impedem o deslizamento lateral e explicam as estrias visíveis. As pregas ungueais lateral e proximal a delimitam, e o **eponíquio** (cutícula) sela a prega proximal. O crescimento é contínuo, de cerca de 0,1 mm por dia nas mãos, e mais lento nos pés.',
    roteiro: [
      'Localize a matriz sob a prega proximal — é o único sítio de produção da placa.',
      'Note a ausência de estrato granuloso no leito ungueal.',
    ],
  },

  skin: {
    panorama:
      'A pele reúne, num só órgão, exemplos de todos os quatro tecidos básicos e de quase todos os conceitos gerais da histologia — por isso costuma ser a primeira lâmina de órgão do curso. Tem **epiderme**, epitélio estratificado pavimentoso queratinizado em renovação contínua a partir da camada basal, com queratinócitos, melanócitos, células de Langerhans e discos de Merkel; **derme**, conjuntivo papilar frouxo e reticular denso, com vasos, nervos e receptores encapsulados; **hipoderme** adiposa; e **anexos** epidérmicos alojados na derme — folículos pilosos, glândulas sebáceas, sudoríparas écrinas e apócrinas e unhas. Funciona como barreira, termorregulador, órgão sensorial e sintetizador de vitamina D.',
    roteiro: [
      'Classifique a pele como espessa ou fina antes de qualquer descrição.',
      'Percorra epiderme, derme e anexos nessa ordem, sem misturar os compartimentos.',
    ],
  },

  // ---- Sistema cardiovascular ----

  'blood vessels': {
    panorama:
      'Todo vaso, do maior ao menor, é uma variação sobre três túnicas concêntricas, e a lâmina se lê medindo a proporção entre elas. A **íntima** tem endotélio, lâmina basal e um pouco de conjuntivo subendotelial; a **média** tem músculo liso e elastina em quantidade variável; a **adventícia** é conjuntivo com vasa vasorum e nervos. O que muda entre um vaso e outro é quanto de cada uma existe: artéria elástica tem média cheia de lamelas, artéria muscular tem média de músculo circular espesso, arteríola tem uma a três camadas, capilar tem só endotélio, e a veia inverte tudo — média fina e adventícia dominante.',
    roteiro: [
      'Compare parede e luz na mesma imagem: é a razão entre elas que classifica, não o tamanho absoluto.',
      'Procure lâminas elásticas: elas separam artéria muscular de veia com segurança.',
    ],
  },

  'overview of blood vessels': {
    panorama:
      'O circuito vascular é uma sequência de compromissos entre pressão, resistência e troca. Da aorta às **artérias elásticas** parte-se de paredes com lamelas de elastina que amortecem a sístole e devolvem energia na diástole. As **artérias musculares** distribuem o fluxo para os órgãos, com média espessa e as duas lâminas elásticas visíveis. As **arteríolas** controlam a resistência periférica e, portanto, a pressão. Os **capilares** têm uma só camada de endotélio, porque só assim a difusão é viável. As **vênulas** são o palco da diapedese, e as **veias** devolvem o sangue com paredes finas, luz ampla, adventícia dominante e válvulas contra a gravidade.',
    roteiro: [
      'Percorra a sequência em ordem e associe cada segmento a uma função hemodinâmica.',
      'Ao encontrar um vaso isolado, procure seu par no feixe antes de classificá-lo.',
    ],
  },

  'transitional artery': {
    panorama:
      'A artéria de transição é o trecho em que uma artéria elástica se converte em muscular, e a lâmina mostra os dois padrões convivendo. As lamelas de **elastina** da média vão rareando e se fragmentando, enquanto as camadas de **músculo liso** circular ganham espaço e continuidade; a lâmina elástica interna, mal definida nas elásticas, começa a se destacar como uma linha ondulada nítida. É o que se observa em vasos como a subclávia e as ilíacas comuns. A transição é gradual, sem ponto de corte anatômico, e reconhecê-la evita o erro de classificar o mesmo vaso de dois modos conforme o nível do corte.',
    roteiro: [
      'Conte lamelas elásticas e camadas musculares no mesmo campo: a proporção define o estágio da transição.',
      'Procure a lâmina elástica interna começando a se individualizar.',
    ],
  },

  'medium artery and vein': {
    panorama:
      'Vistos lado a lado no mesmo feixe neurovascular, a artéria e a veia de médio calibre ensinam a leitura vascular inteira em um só campo. A **artéria** tem parede espessa em relação à luz, média muscular concêntrica bem delimitada, lâmina elástica interna ondulada e refringente, e luz redonda e aberta, porque a média contraída não colaba. A **veia** tem parede fina, luz ampla e frequentemente deformada, média escassa e mal delimitada, e adventícia proporcionalmente mais espessa que a média — inversão que é a assinatura venosa. Podem aparecer válvulas na luz venosa, pregas duplas da íntima voltadas para o coração.',
    roteiro: [
      'Sempre compare os dois vasos do feixe; classificar um isolado é a origem da maioria dos erros.',
      'Meça mentalmente a razão média/adventícia em cada um deles.',
    ],
    atencao:
      'A veia costuma parecer maior e mais irregular que a artéria acompanhante, embora ambas transportem o mesmo volume.',
  },

  'small artery and vein': {
    panorama:
      'No pequeno calibre, os mesmos critérios continuam valendo, mas as estruturas ficam mais discretas e é preciso olhar melhor. A **artéria pequena** tem de quatro a oito camadas de músculo liso na média e ainda mostra a lâmina elástica interna como uma linha ondulada; sua luz é redonda e a parede, proporcionalmente espessa. A **veia pequena** tem apenas uma a três camadas musculares frouxamente arranjadas, sem lâmina elástica definida, adventícia colágena mais espessa que a média, e a luz costuma estar colabada ou irregular, muitas vezes com hemácias dentro — detalhe útil para separá-la de um vaso linfático de calibre parecido.',
    roteiro: [
      'Procure hemácias na luz para descartar linfático.',
      'Verifique se a lâmina elástica interna ainda é contínua: ela desaparece à medida que o calibre cai.',
    ],
  },

  'small arteries': {
    panorama:
      'As artérias de pequeno calibre são o segmento entre a artéria muscular e a arteríola, e junto com estas respondem pela maior parte da **resistência periférica**. Definem-se por ter de quatro a oito camadas de músculo liso circular na média — acima disso já é muscular de médio calibre, abaixo é arteríola. A íntima ainda mostra uma **lâmina elástica interna** evidente, ondulada pela contração post-mortem da média; a lâmina elástica externa é fina ou ausente, e a adventícia é delgada. São elas que se remodelam na hipertensão crônica, espessando a média e estreitando a luz, com consequências diretas na perfusão de rim, retina e encéfalo.',
    roteiro: [
      'Conte as camadas musculares antes de nomear: é o critério, não o diâmetro aparente.',
      'Relacione o espessamento da média ao contexto clínico da hipertensão.',
    ],
  },

  'arteriole and venule': {
    panorama:
      'Arteríola e vênula são as duas pontas do leito capilar e costumam aparecer juntas no conjuntivo. A **arteríola** tem luz estreita e parede proporcionalmente espessa, com uma a três camadas contínuas de músculo liso circular; é o vaso de resistência, e sua contração decide quanto sangue cada leito recebe. A **vênula** tem luz ampla e parede finíssima — nas pós-capilares, apenas endotélio e pericitos, sem músculo algum. É justamente essa parede mínima que faz da vênula o palco da inflamação: histamina abre as junções endoteliais, o plasma extravasa e os leucócitos atravessam por diapedese. Nenhum outro segmento vascular cumpre esse papel.',
    roteiro: [
      'Compare os dois no mesmo campo: a diferença de espessura de parede é imediata.',
      'Procure leucócitos aderidos ao endotélio venular como sinal de resposta em curso.',
    ],
  },

  arteries: {
    panorama:
      'As artérias levam o sangue para longe do coração e se classificam por como a média é construída. As **elásticas** — aorta, tronco pulmonar, carótidas comuns e ilíacas — têm dezenas de lamelas concêntricas de elastina alternadas com músculo liso, e existem para converter o jato pulsátil da sístole em fluxo contínuo. As **musculares** têm média de músculo liso circular espesso, com lâminas elásticas interna e externa bem definidas, e distribuem o débito conforme a demanda de cada órgão. As **pequenas** e as **arteríolas** regulam a resistência periférica. Em todas, a parede é espessa para a luz — o oposto do que se vê nas veias correspondentes.',
    roteiro: [
      'Decida primeiro se a média é lamelar ou muscular: isso separa as duas grandes famílias.',
      'Use coloração para elastina quando as lamelas não estiverem evidentes em H&E.',
    ],
  },

  'capillaries and sinusoids': {
    panorama:
      'Capilares e sinusoides fazem a mesma coisa — troca — mas com graus de permeabilidade muito diferentes, e a diferença está em três características que devem ser lidas juntas. O **capilar contínuo** tem endotélio sem poros, junções estreitas e lâmina basal contínua: é o mais restritivo, e existe em músculo, pulmão e sistema nervoso, onde compõe a barreira hematoencefálica. O **fenestrado** tem poros com diafragma e lâmina basal contínua, e serve à troca rápida em glândulas endócrinas e mucosa intestinal. O **sinusoide** tem luz ampla e irregular, endotélio **descontínuo** e lâmina basal fragmentada ou ausente, o que permite a passagem de proteínas e até de células inteiras.',
    roteiro: [
      'Avalie sempre os três itens: poros, junções e continuidade da lâmina basal.',
      'Use a localização como confirmação — cada tipo tem territórios característicos.',
    ],
  },

  'venule (pericytic venule)': {
    panorama:
      'A vênula pericítica, ou pós-capilar, é o menor segmento venoso e tem a parede mais simples de todo o sistema: **endotélio e pericitos**, sem qualquer camada de músculo liso. Os pericitos são células ramificadas que compartilham a lâmina basal do endotélio, envolvem-no parcialmente e têm capacidade contrátil e regenerativa. É nesse segmento que ocorrem os dois eventos centrais da inflamação aguda: o **aumento de permeabilidade**, quando histamina e bradicinina afrouxam as junções endoteliais e o plasma extravasa formando o edema, e a **diapedese**, com neutrófilos rolando, aderindo e atravessando a parede. Nenhum outro vaso reúne as duas funções.',
    roteiro: [
      'Procure núcleos externos ao endotélio, compartilhando a mesma lâmina basal: são os pericitos.',
      'Confirme a ausência de camada muscular organizada antes de nomear.',
    ],
  },

  vessels: {
    panorama:
      'Este setor reúne todos os tipos de vaso, e o modo econômico de estudá-los é por **função hemodinâmica**, não por nome. Vasos de **condução** (artérias elásticas) amortecem a pulsatilidade. Vasos de **distribuição** (artérias musculares) direcionam o fluxo. Vasos de **resistência** (artérias pequenas e arteríolas) controlam a pressão. Vasos de **troca** (capilares e sinusoides) fazem o trabalho para o qual todo o resto existe. Vasos de **capacitância** (vênulas e veias) armazenam cerca de 70% do volume sanguíneo. E os **linfáticos** recolhem o líquido que escapou do capilar. Cada função impõe uma arquitetura de parede, e é essa arquitetura que se lê na lâmina.',
    roteiro: [
      'Atribua uma função ao vaso antes de nomeá-lo; o nome decorre da arquitetura, e a arquitetura da função.',
      'Verifique se há hemácias na luz para separar sanguíneo de linfático.',
    ],
  },

  endocardium: {
    panorama:
      'O endocárdio é a camada interna da parede cardíaca e corresponde à túnica íntima dos vasos, com os quais é contínuo. Tem três estratos. O mais interno é o **endotélio** simples pavimentoso, apoiado em uma fina camada de conjuntivo frouxo. Segue-se uma camada de **conjuntivo denso** com fibras elásticas e algumas células musculares lisas, que compõe o grosso do endocárdio. Por fim, a **camada subendocárdica**, de conjuntivo frouxo, faz a transição para o miocárdio e é onde correm vasos, nervos e os ramos do sistema de condução, incluindo as **fibras de Purkinje** — células grandes, claras e cheias de glicogênio, o achado que identifica a região.',
    roteiro: [
      'Procure as fibras de Purkinje logo abaixo do endocárdio para confirmar a camada subendocárdica.',
      'Note a continuidade do endotélio cardíaco com o dos grandes vasos.',
    ],
  },

  epicardium: {
    panorama:
      'O epicárdio é a camada externa da parede cardíaca e corresponde, ao mesmo tempo, à adventícia dos vasos e à **lâmina visceral do pericárdio seroso**. Sua superfície livre é um **mesotélio** simples pavimentoso, que secreta o líquido pericárdico e permite ao coração deslizar dentro do saco a cada batimento. Abaixo dele há conjuntivo frouxo e, mais profundamente, uma camada subepicárdica com quantidade variável de **tecido adiposo**, por onde correm as artérias coronárias, as veias cardíacas e os nervos autonômicos. Encontrar vasos coronários envoltos em gordura logo abaixo de um mesotélio é a maneira mais direta de identificar a face externa do coração em um corte.',
    roteiro: [
      'Ache o mesotélio para confirmar que é a face externa e não o endocárdio.',
      'Siga os vasos coronários no tecido adiposo subepicárdico.',
    ],
  },

  'atrioventricular bundle': {
    panorama:
      'O feixe atrioventricular, ou feixe de His, é a **única via de continuidade elétrica** entre átrios e ventrículos: o esqueleto fibroso isola eletricamente as câmaras, e o feixe é o que o atravessa. Nasce do nó atrioventricular, perfura o trígono fibroso direito, desce pela porção membranácea do septo interventricular e se bifurca em ramo direito e ramo esquerdo, que descem sob o endocárdio até se resolverem nas fibras de Purkinje. Histologicamente é feito de cardiomiócitos modificados, maiores e mais pálidos que os contráteis, com poucas miofibrilas periféricas e muito glicogênio. Sua lesão produz os bloqueios de ramo e o bloqueio atrioventricular total.',
    roteiro: [
      'Procure células grandes e pálidas dentro do septo, distintas do miocárdio comum ao redor.',
      'Relacione o trajeto ao isolamento elétrico imposto pelo esqueleto fibroso.',
    ],
  },

  'annulus fibrosus': {
    panorama:
      'O ânulo fibroso é o anel de **conjuntivo denso** que circunda cada orifício valvar e faz parte do esqueleto fibroso do coração. Cumpre três funções que a lâmina permite deduzir: sustenta a valva, impedindo que o orifício se dilate sob pressão; serve de **ancoragem** para a inserção das fibras miocárdicas atriais e ventriculares, que se prendem nele em vez de se continuarem umas nas outras; e **isola eletricamente** átrios de ventrículos, obrigando o impulso a passar pelo feixe atrioventricular. O eixo conjuntivo de cada cúspide valvar se continua diretamente com ele, de modo que valva e ânulo formam uma unidade mecânica única.',
    roteiro: [
      'Siga o eixo conjuntivo da cúspide até o anel para ver a continuidade.',
      'Note que as fibras miocárdicas terminam no anel, e não o atravessam.',
    ],
  },

  'atrioventricular valve': {
    panorama:
      'As valvas atrioventriculares — mitral à esquerda, tricúspide à direita — impedem o refluxo durante a sístole ventricular. Cada cúspide é uma prega de **endocárdio nas duas faces** com um eixo central de conjuntivo denso contínuo com o ânulo fibroso. Diferentemente das semilunares, elas dependem de um aparato de sustentação: as **cordas tendíneas**, cordões de colágeno que partem da borda livre e das faces ventriculares, prendem-se aos **músculos papilares**, que se contraem junto com o ventrículo e impedem a eversão da cúspide para o átrio. Não há vasos dentro da cúspide — a nutrição vem por difusão do sangue circulante, o que explica a lentidão do reparo e a vulnerabilidade à endocardite.',
    roteiro: [
      'Siga uma corda tendínea da borda livre até o músculo papilar para entender o mecanismo.',
      'Confirme a ausência de vasos no interior da cúspide.',
    ],
  },

  'overview of the cardiovascular system': {
    panorama:
      'O sistema cardiovascular é um circuito fechado com uma bomba e dois trajetos em série. A **circulação sistêmica** sai do ventrículo esquerdo pela aorta, distribui sangue oxigenado a todos os tecidos e volta ao átrio direito pelas cavas, operando sob pressão alta. A **circulação pulmonar** sai do ventrículo direito, faz a hematose e retorna ao átrio esquerdo, operando com cerca de um quinto da pressão — o que se lê diretamente na espessura da parede dos vasos e das câmaras. O plano estrutural é o mesmo do coração à periferia: três túnicas concêntricas cuja proporção muda conforme a função, mais o **sistema linfático**, que devolve à circulação o líquido intersticial não reabsorvido.',
    roteiro: [
      'Identifique o circuito antes do vaso: pressão explica espessura de parede.',
      'Compare a parede do ventrículo esquerdo com a do direito no mesmo corte.',
    ],
  },

  cardiovascular: {
    panorama:
      'Este setor cobre o coração e todos os vasos, e há um princípio que atravessa o conjunto: **estrutura acompanha pressão**. O ventrículo esquerdo tem miocárdio muito mais espesso que o direito porque bombeia contra a resistência sistêmica. A aorta tem lamelas elásticas porque precisa amortecer a sístole; a artéria pulmonar, sob pressão baixa, tem parede fina para o calibre. As arteríolas concentram músculo porque regulam a resistência. Os capilares reduzem a parede a uma camada porque só assim há difusão. As veias têm adventícia dominante e válvulas porque transportam sob pressão mínima, muitas vezes contra a gravidade. Ler um vaso é ler a hemodinâmica a que ele responde.',
    roteiro: [
      'Sempre pergunte sob que pressão o segmento trabalha antes de julgar sua parede.',
      'Compare estruturas homólogas dos dois circuitos para ver o princípio em ação.',
    ],
  },

  // ---- Boca, língua e dente ----

  'lip: comparison of epithelia': {
    panorama:
      'O lábio é a melhor lâmina para comparar epitélios, porque reúne três em poucos milímetros sobre o mesmo núcleo de músculo esquelético. Na **face cutânea**, epitélio estratificado pavimentoso **queratinizado**, com estrato córneo espesso, pelos, glândulas sebáceas e sudoríparas. Na **zona vermelha**, o mesmo epitélio queratinizado, mas fino e translúcido, sobre papilas altas e muito vascularizadas — daí a cor — e sem glândulas próprias, motivo pelo qual resseca. Na **face mucosa**, epitélio estratificado pavimentoso **não queratinizado**, espesso, com células superficiais que mantêm núcleo, sobre submucosa com glândulas salivares labiais.',
    roteiro: [
      'Procure núcleos nas células superficiais: sua presença separa não queratinizado de queratinizado.',
      'Meça a espessura do córneo nas três regiões e relacione à exposição ao meio.',
    ],
  },

  'lip: vermilion zone': {
    panorama:
      'A zona vermelha, ou vermelhão, é a faixa de transição entre a pele e a mucosa oral, e sua cor tem explicação histológica direta. O epitélio é estratificado pavimentoso **queratinizado, mas muito fino e translúcido**, e as **papilas dérmicas** por baixo dele são altas, estreitas e densamente capilarizadas — de modo que o sangue dos capilares se vê através do epitélio. Não há pelos, e o que é mais importante clinicamente: **não há glândulas sebáceas nem sudoríparas** nessa faixa, e as glândulas salivares labiais ficam mais para dentro. Sem secreção própria, o vermelhão depende de umidade externa, o que explica por que resseca e racha com tanta facilidade.',
    roteiro: [
      'Meça a altura das papilas: é ela, mais que a espessura do epitélio, que produz a cor.',
      'Confirme a ausência de anexos para delimitar a zona.',
    ],
  },

  'oral mucosa: gingiva': {
    panorama:
      'A gengiva é mucosa **mastigatória**, adaptada à abrasão e à pressão. Seu epitélio é estratificado pavimentoso **queratinizado ou paraqueratinizado** — neste último, as células superficiais mantêm núcleos picnóticos —, e as papilas de conjuntivo que o sustentam são **altas, finas e muito entrelaçadas** com as cristas epiteliais, arranjo que resiste ao cisalhamento durante a mastigação. Não há submucosa frouxa: a lâmina própria adere firmemente ao periósteo do osso alveolar, formando um mucoperiósteo imóvel. Isso distingue a gengiva da mucosa de revestimento vizinha, que é móvel, não queratinizada e apoiada em submucosa frouxa.',
    roteiro: [
      'Teste mentalmente a mobilidade: mucoperiósteo aderido indica mastigatória.',
      'Compare a altura das papilas com as da mucosa de revestimento adjacente.',
    ],
  },

  'dentogingival junction': {
    panorama:
      'A junção dentogengival é o único lugar do corpo em que um **tecido duro atravessa o epitélio** e alcança o exterior, e por isso é um ponto de fragilidade permanente. A vedação é feita pelo **epitélio juncional**, algumas camadas de células não queratinizadas que aderem ao esmalte por hemidesmossomos e uma lâmina basal interna — um mecanismo de adesão incomum, já que normalmente o epitélio se prende a conjuntivo, não a mineral. Acima dele fica o **sulco gengival**, fenda rasa entre o dente e a gengiva livre. Abaixo, as fibras gengivais e o ligamento periodontal ancoram o conjunto. A perda dessa vedação abre o caminho da gengivite para a periodontite.',
    roteiro: [
      'Localize o fundo do sulco: dele para baixo começa o epitélio juncional.',
      'Note que o epitélio juncional adere ao esmalte, e não ao conjuntivo.',
    ],
  },

  'tongue: filiform papillae': {
    panorama:
      'As papilas filiformes são as mais numerosas da língua e as únicas **sem botões gustativos** — não participam do paladar. Cobrem todo o dorso e as faces laterais, e têm forma de chama ou cone, com um eixo de conjuntivo revestido por epitélio estratificado pavimentoso **queratinizado**, cuja ponta se inclina para trás. Sua função é mecânica: aumentam o atrito entre a língua e o alimento, o que ajuda a manipular e a raspar o bolo. Quando a descamação normal se atrasa, a queratina se acumula e produz a saburra lingual. A ausência de botões gustativos nelas é o critério que as separa, à primeira vista, de qualquer outra papila.',
    roteiro: [
      'Confirme a queratinização da ponta e a ausência de botões gustativos.',
      'Compare a forma com a das fungiformes vizinhas, arredondadas e mais baixas.',
    ],
  },

  'tongue: fungiform papillae': {
    panorama:
      'As papilas fungiformes têm forma de cogumelo — base estreita e topo dilatado e arredondado — e ficam espalhadas entre as filiformes, sobretudo na ponta e nas bordas da língua. Diferem delas em dois pontos decisivos: o epitélio é **não queratinizado ou apenas levemente queratinizado**, e há **botões gustativos**, poucos, localizados na superfície superior. O eixo de conjuntivo é rico em capilares próximos à superfície, o que faz a papila parecer avermelhada a olho nu e permite identificá-la clinicamente sem lâmina. São bem menos numerosas que as filiformes, e essa raridade relativa, somada à forma, resolve a identificação.',
    roteiro: [
      'Procure botões gustativos no topo, não nas laterais — a posição as separa das circunvaladas.',
      'Note a vascularização superficial do eixo conjuntivo.',
    ],
  },

  'tongue: filiform and fungiform papillae': {
    panorama:
      'Vistas juntas, as duas papilas mais comuns do dorso lingual ensinam a lógica das papilas por contraste. As **filiformes** são numerosas, cônicas ou em chama, **queratinizadas** e **sem botões gustativos**: são mecânicas, aumentam o atrito e ajudam a manipular o alimento. As **fungiformes** são esparsas, em cogumelo, **não queratinizadas**, com **botões gustativos** no topo e um eixo conjuntivo muito vascularizado que lhes dá cor avermelhada. Reconhecer a diferença resolve boa parte da lâmina de língua, e a regra prática é direta: se a ponta é afilada e clara, é filiforme; se é abaulada e tem botões, é fungiforme.',
    roteiro: [
      'Percorra o dorso contando as duas populações antes de descrever detalhes.',
      'Use a queratinização da ponta como critério rápido de triagem.',
    ],
  },

  'tongue: taste buds': {
    panorama:
      'O botão gustativo é uma estrutura ovoide e pálida que atravessa toda a espessura do epitélio, abrindo-se na superfície por um **poro gustativo**. Reúne três populações celulares dispostas como gomos de laranja: as **células gustativas**, que são as receptoras e fazem sinapse com fibras aferentes, com vida média de dez dias; as **células de sustentação**, mais numerosas; e as **células basais**, que repõem as demais. Microvilosidades das células receptoras se projetam pelo poro e captam as moléculas dissolvidas na saliva. Localizam-se nas paredes laterais das papilas circunvaladas e folhadas e no topo das fungiformes, além da epiglote e do palato mole.',
    roteiro: [
      'Ache o poro gustativo na superfície para confirmar a orientação do botão.',
      'Lembre que os botões precisam de saliva: sem meio líquido, não há estímulo.',
    ],
  },

  'tongue: musculature': {
    panorama:
      'A língua é uma massa de **músculo esquelético** cuja mobilidade extraordinária vem de um arranjo específico: os feixes correm em **três planos ortogonais** — longitudinal, transversal e vertical — entrelaçados entre si, o que permite mudar de forma em qualquer direção sem depender de articulação. Essa é a definição de um hidrostato muscular. Os músculos **intrínsecos**, contidos inteiramente na língua, alteram sua forma; os **extrínsecos**, que se inserem em ossos vizinhos, alteram sua posição. Entre os feixes há tecido conjuntivo com glândulas salivares linguais, mucosas e serosas, além de tecido adiposo. Um septo fibroso mediano divide a língua em duas metades.',
    roteiro: [
      'Identifique os três planos musculares para orientar o corte antes de qualquer outra coisa.',
      'Procure as glândulas linguais entre os feixes musculares.',
    ],
  },

  general: {
    panorama:
      'Esta seção reúne o que vale para o sistema digestório como um todo, antes de descer a cada órgão. Do esôfago ao ânus, a parede repete **quatro camadas concêntricas**: **mucosa**, com epitélio, lâmina própria e muscular da mucosa; **submucosa**, de conjuntivo denso com vasos maiores e o plexo de Meissner; **muscular externa**, em geral circular interna e longitudinal externa, com o plexo de Auerbach entre elas; e **adventícia** ou **serosa**, conforme haja ou não peritônio. O que muda de um segmento para outro é o tipo de epitélio, a presença ou ausência de glândulas em cada camada e as especializações da superfície — e são essas variações que identificam a região.',
    roteiro: [
      'Nomeie as quatro camadas antes de tentar identificar o órgão.',
      'Procure em qual camada estão as glândulas: esse dado sozinho localiza vários segmentos.',
    ],
  },

  'tooth and dental alveolus': {
    panorama:
      'O dente não é um osso: é uma peça mineralizada alojada em uma cavidade óssea, o **alvéolo dentário**, e ligada a ela por uma articulação fibrosa chamada gonfose. Três tecidos duros o compõem. O **esmalte**, que cobre a coroa, é acelular, o material mais mineralizado do corpo e de origem ectodérmica — uma vez perdido, não se refaz. A **dentina** forma o grosso do dente e é produzida pelos odontoblastos, cujos prolongamentos permanecem dentro dos túbulos dentinários; ela continua sendo depositada a vida inteira. O **cemento** recobre a raiz e ancora as fibras do ligamento. No centro, a **polpa** é conjuntivo frouxo com vasos e nervos.',
    roteiro: [
      'Localize os três tecidos duros pela posição antes de descrevê-los: esmalte na coroa, cemento na raiz, dentina entre eles e a polpa.',
      'Procure o espaço do ligamento periodontal entre o cemento e o osso alveolar.',
    ],
  },

  periodondium: {
    panorama:
      'O periodonto é o conjunto de estruturas que fixam o dente ao maxilar e absorvem a carga da mastigação, e são quatro. O **cemento** recobre a dentina radicular e é o tecido em que as fibras se inserem do lado do dente; assemelha-se ao osso, mas é avascular. O **ligamento periodontal** é conjuntivo denso cujos feixes de colágeno, as fibras de Sharpey, atravessam o espaço entre a raiz e o osso e se ancoram nos dois lados; ele suspende o dente, amortece a força e contém proprioceptores. O **osso alveolar** forma a parede da cavidade e se remodela conforme a carga. A **gengiva** completa o conjunto, vedando a entrada.',
    roteiro: [
      'Nomeie os quatro componentes em ordem, do dente para fora.',
      'Note que o dente está suspenso, e não colado: o espaço do ligamento é funcional.',
    ],
  },

  'periodontal ligament principal fiber groups': {
    panorama:
      'As fibras principais do ligamento periodontal se agrupam por orientação, e cada grupo resiste a um tipo de força. As **fibras da crista alveolar** correm obliquamente da crista óssea ao cemento cervical e resistem a movimentos laterais e à extrusão. As **horizontais** ficam logo abaixo e resistem à inclinação. As **oblíquas** são o grupo mais numeroso, correm do osso para o cemento em direção apical e convertem a **força de mastigação em tração** sobre o osso — é por isso que o dente é suspenso, e não comprimido contra o fundo do alvéolo. As **apicais** resistem à extrusão e protegem os vasos que entram pelo ápice, e as **inter-radiculares** estabilizam dentes multirradiculares.',
    roteiro: [
      'Determine a orientação de cada feixe antes de nomeá-lo; é a direção que define o grupo.',
      'Relacione o grupo oblíquo à conversão de compressão em tração.',
    ],
  },

  'gingival fibers of the periodontal ligament': {
    panorama:
      'As fibras gengivais não fazem parte, em sentido estrito, do ligamento periodontal — não ligam dente a osso —, mas compõem o mesmo sistema de ancoragem e sustentam a gengiva contra o dente. Os grupos principais são: as **dentogengivais**, que partem do cemento cervical e se abrem em leque na lâmina própria da gengiva; as **dentoperiosteais**, que vão do cemento ao periósteo alveolar; as **circulares**, que envolvem o colo do dente como um anel sem se inserir em osso, apertando a gengiva marginal contra a superfície dentária; e as **transeptais**, que cruzam de um dente ao vizinho por cima da crista óssea, mantendo o contato interdental e resistindo à separação dos dentes.',
    roteiro: [
      'Procure o grupo circular no colo: ele não se ancora em osso, o que o distingue.',
      'Siga as transeptais de um dente ao outro por cima da crista alveolar.',
    ],
  },

  'tooth apex and periodontium': {
    panorama:
      'O ápice radicular é a porta de entrada e saída do dente: pelo **forame apical** passam a arteríola, a vênula, os linfáticos e o feixe nervoso que suprem a polpa. Por ser um orifício estreito em um compartimento rígido, qualquer inflamação pulpar que aumente o volume interno comprime esses vasos contra as paredes de dentina e produz isquemia — a razão pela qual a pulpite dói tanto e evolui para necrose. Ao redor do ápice, o ligamento periodontal se organiza no **grupo apical** de fibras, que resiste à extrusão, e o osso alveolar é mais delgado. É por essa via que a infecção pulpar alcança o periodonto e forma o abscesso periapical.',
    roteiro: [
      'Ache o forame apical e siga o feixe vasculonervoso até a polpa.',
      'Note a continuidade entre polpa e ligamento periodontal através do forame.',
    ],
  },

  'molar and dental alveolus': {
    panorama:
      'O molar mostra, em um único corte, todas as relações do dente com seu alvéolo. A **coroa** é recoberta por esmalte e tem várias cúspides; abaixo dela, o colo, e depois **duas ou três raízes** revestidas por cemento, cada uma alojada em sua própria cavidade. Entre as raízes há a **região de furca**, com fibras inter-radiculares próprias. O **osso alveolar** que forra a cavidade é osso compacto perfurado — a lâmina crivosa —, por onde passam vasos que suprem o ligamento. O espaço do **ligamento periodontal**, de aproximadamente 0,2 mm, separa raiz e osso em toda a extensão, e sua largura constante é o sinal de que a carga está bem distribuída.',
    roteiro: [
      'Conte as raízes e localize a furca antes de descrever o ligamento.',
      'Verifique se o espaço do ligamento tem largura uniforme ao longo da raiz.',
    ],
  },

  'dental pulp': {
    panorama:
      'A polpa é o único tecido mole do dente: conjuntivo frouxo, muito vascularizado e inervado, alojado numa câmara de paredes rígidas de dentina. Sua camada mais periférica é uma fileira de **odontoblastos** encostados na dentina, cujos prolongamentos permanecem dentro dos túbulos dentinários — de modo que polpa e dentina são funcionalmente um só complexo. Abaixo dela vêm a zona pobre em células de Weil, a zona rica em células, com fibroblastos e células-tronco, e o centro, com vasos e nervos. A polpa nutre a dentina, deposita dentina secundária ao longo da vida e sinaliza dor. Sua confinação em paredes rígidas é o que torna a pulpite tão grave.',
    roteiro: [
      'Ache a fileira de odontoblastos na periferia e siga seus prolongamentos para dentro da dentina.',
      'Relacione o confinamento rígido à isquemia da pulpite.',
    ],
  },

  'tooth peridontium': {
    panorama:
      'O periodonto reúne os tecidos de suporte do dente, e todos existem para uma tarefa mecânica: transformar a força vertical da mastigação em tração distribuída sobre o osso. O **cemento** cobre a raiz e recebe as fibras do lado do dente. O **ligamento periodontal**, de conjuntivo denso, suspende a raiz dentro do alvéolo e contém, além de colágeno, fibroblastos muito ativos, restos epiteliais de Malassez, vasos e proprioceptores que informam a intensidade da mordida. O **osso alveolar** responde a essa carga remodelando-se continuamente — é isso que torna possível a movimentação ortodôntica. A **gengiva** sela a passagem do dente pela mucosa.',
    roteiro: [
      'Percorra os quatro tecidos do dente para fora, nomeando cada um.',
      'Procure proprioceptores e vasos dentro do espaço ligamentar.',
    ],
  },

  'stages of tooth development': {
    panorama:
      'A odontogênese segue uma sequência de estágios nomeados pela **forma do germe dentário**, e reconhecer a forma resolve a lâmina. Tudo começa com a **lâmina dentária**, um espessamento do epitélio oral. Dela brota o **estágio de botão**, uma condensação epitelial esférica invadindo o mesênquima. No **estágio de capuz**, a base do botão se invagina e passa a envolver uma condensação mesenquimal, a papila dentária. No **estágio de campânula**, a invaginação se aprofunda, o órgão do esmalte se organiza em quatro camadas e a forma da futura coroa fica definida. Segue-se a **coroa**, com deposição de esmalte e dentina, e a **raiz**, com a bainha de Hertwig guiando o alongamento.',
    roteiro: [
      'Determine o estágio pela forma do germe antes de procurar tecidos mineralizados.',
      'Localize sempre as três partes: órgão do esmalte, papila e folículo dentário.',
    ],
  },

  'developing oral cavity': {
    panorama:
      'A cavidade oral em desenvolvimento é o cenário em que a odontogênese começa, e a lâmina mostra as três origens teciduais em jogo. O **epitélio oral**, de origem ectodérmica, reveste a superfície e é dele que parte a **lâmina dentária**, um espessamento em forma de ferradura que mergulha no mesênquima ao longo de cada arcada. O **mesênquima** subjacente, derivado da crista neural — o chamado ectomesênquima —, não é passivo: é ele que induz o epitélio e depois responde formando a papila e o folículo dentário. Da interação recíproca entre esses dois tecidos nasce todo o dente: o epitélio dará esmalte, o ectomesênquima dará dentina, polpa, cemento e ligamento.',
    roteiro: [
      'Localize a lâmina dentária como um espessamento contínuo do epitélio oral.',
      'Note que a indução é recíproca: nenhum dos dois tecidos forma dente sozinho.',
    ],
  },

  'laminae, bud and cap stages': {
    panorama:
      'Os três primeiros momentos da odontogênese aparecem aqui em sequência. A **lâmina dentária** é um espessamento em ferradura do epitélio oral que mergulha no ectomesênquima. Em dez pontos de cada arcada ela prolifera e forma o **botão**, uma condensação epitelial esférica sem organização interna, cercada por mesênquima que começa a se condensar. No **capuz**, a face profunda do botão se invagina e passa a envolver essa condensação, agora chamada **papila dentária**; o epitélio se organiza em epitélio dentário externo, retículo estrelado e epitélio dentário interno, e o mesênquima ao redor de tudo forma o **folículo dentário**. As três partes do germe estão então definidas.',
    roteiro: [
      'Siga a progressão pela forma: espessamento, esfera, taça.',
      'Ache as três partes do germe assim que o capuz se estabelecer.',
    ],
  },

  'bud stage of tooth development': {
    panorama:
      'O estágio de botão é o primeiro em que existe um germe dentário individualizado. A lâmina dentária prolifera em dez pontos de cada arcada, e cada um desses focos forma uma **condensação epitelial esférica ou ovoide** que se projeta para dentro do ectomesênquima, ainda ligada ao epitélio oral por um pedículo. Nessa fase o botão não tem organização interna: é uma massa de células epiteliais mais ou menos uniformes. O que já se observa é a **condensação do mesênquima** imediatamente ao redor dele, sinal de que a indução recíproca começou. Nenhum tecido mineralizado existe ainda, e a forma final do dente ainda não está determinada.',
    roteiro: [
      'Confirme a ausência de organização interna: é isso que separa botão de capuz.',
      'Procure a condensação mesenquimal ao redor como primeiro sinal de indução.',
    ],
  },

  'cap stage of tooth development (early)': {
    panorama:
      'No capuz inicial, a face profunda do botão começa a se **invaginar**, e o germe passa da forma esférica à de taça. Essa invaginação abraça uma condensação de ectomesênquima que, a partir daqui, se chama **papila dentária** — futura polpa e dentina. O epitélio começa a se diferenciar em camadas ainda pouco definidas, e o mesênquima que envolve o conjunto se organiza no **folículo dentário**, futuro cemento, ligamento e osso alveolar. É neste estágio que aparece o **nó do esmalte**, um agrupamento de células epiteliais não proliferativas no centro do capuz que funciona como centro de sinalização e determina onde ficarão as cúspides.',
    roteiro: [
      'Ache o início da invaginação: é o que define a passagem de botão a capuz.',
      'Procure o nó do esmalte no centro, como um adensamento celular.',
    ],
  },

  'cap stage of tooth development': {
    panorama:
      'No estágio de capuz, o germe dentário exibe pela primeira vez suas **três partes** com clareza. O **órgão do esmalte**, epitelial, tem a forma de taça e já mostra o epitélio dentário externo, na convexidade, o **retículo estrelado** no meio — células estreladas separadas por matriz rica em glicosaminoglicanos, que hidrata e dá espaço ao crescimento — e o epitélio dentário interno, na concavidade. A **papila dentária** é a condensação de ectomesênquima abraçada pela taça, e originará a dentina e a polpa. O **folículo dentário** envolve tudo e originará cemento, ligamento periodontal e osso alveolar. Ainda não há nenhum tecido mineralizado.',
    roteiro: [
      'Nomeie as três partes antes de descrever qualquer camada isoladamente.',
      'Confirme a ausência de esmalte e dentina para não confundir com a campânula tardia.',
    ],
  },

  'bell stage of tooth development': {
    panorama:
      'Na campânula, a invaginação se aprofunda e o órgão do esmalte assume forma de sino, com **quatro camadas** agora bem definidas: epitélio dentário externo, retículo estrelado, **estrato intermédio** — recém-surgido, rico em fosfatase alcalina e indispensável à amelogênese — e epitélio dentário interno. É também aqui que a **forma da futura coroa** fica determinada, pelo dobramento da junção entre o epitélio interno e a papila. As células do epitélio dentário interno começam a se alongar e diferenciar em **pré-ameloblastos**, e induzem as células periféricas da papila a virarem **odontoblastos**. A lâmina dentária começa a se fragmentar, desconectando o germe do epitélio oral.',
    roteiro: [
      'Conte as quatro camadas do órgão do esmalte para confirmar o estágio.',
      'Procure o alongamento das células do epitélio dentário interno.',
    ],
  },

  'late bell stage of tooth development': {
    panorama:
      'Na campânula tardia começa a **mineralização**, e a lâmina passa a mostrar tecido duro. A sequência é rígida e vale memorizar: os pré-ameloblastos induzem os **odontoblastos**, que depositam a primeira camada de **pré-dentina**; só então os ameloblastos se tornam funcionais e começam a secretar a matriz do **esmalte** sobre ela. A deposição avança das cúspides em direção ao colo. Os odontoblastos recuam em direção à papila conforme depositam dentina, deixando seus prolongamentos nos túbulos dentinários; os ameloblastos, ao contrário, afastam-se para fora. O retículo estrelado colapsa, aproximando os vasos do epitélio externo dos ameloblastos, que têm demanda metabólica alta.',
    roteiro: [
      'Verifique a ordem: dentina sempre antes de esmalte — o inverso não ocorre.',
      'Note a direção oposta de migração de odontoblastos e ameloblastos.',
    ],
  },

  'crown stage of tooth development': {
    panorama:
      'No estágio de coroa, a deposição de esmalte e dentina já está em pleno curso e a forma coronária está definida. Os **ameloblastos**, células colunares altas com um prolongamento apical característico — o **processo de Tomes** —, secretam a matriz do esmalte em bastões, e é a orientação desses prolongamentos que produz o padrão de prismas do esmalte maduro. Do outro lado da junção, os **odontoblastos** continuam depositando dentina e recuando para dentro da papila. Concluída a espessura total, os ameloblastos entram na fase de maturação, removem água e proteína e elevam a mineralização a mais de 96%. Ao final, degeneram — e por isso o esmalte não se regenera.',
    roteiro: [
      'Procure os processos de Tomes no ápice dos ameloblastos.',
      'Note a junção amelodentinária como a linha em que os dois tecidos se encontram.',
    ],
  },

  'root stage of tooth development': {
    panorama:
      'A raiz se forma depois que a coroa está pronta, e quem a guia é a **bainha epitelial radicular de Hertwig**: uma extensão em manga do epitélio dentário interno e externo, sem retículo estrelado nem estrato intermédio entre eles — e é justamente essa ausência que impede a formação de esmalte na raiz. A bainha induz as células da papila a se diferenciarem em odontoblastos, que depositam a dentina radicular. Conforme a dentina avança, a bainha se fragmenta, e seus restos permanecem no ligamento periodontal como **restos epiteliais de Malassez**. Pelas brechas abertas, células do folículo alcançam a dentina e se diferenciam em **cementoblastos**, que depositam o cemento.',
    roteiro: [
      'Ache a bainha de Hertwig como uma manga epitelial dupla na borda em crescimento.',
      'Relacione a ausência de estrato intermédio à ausência de esmalte na raiz.',
    ],
  },

  'root stage of tooth development - crown region': {
    panorama:
      'Na região da coroa durante o estágio de raiz, a amelogênese já terminou. O esmalte alcançou sua espessura final, os ameloblastos completaram a fase de maturação e regrediram a um **epitélio reduzido do esmalte**, camada fina que recobre a coroa e a protege até a erupção — e que, ao alcançar a mucosa, funde-se com o epitélio oral e dá origem ao **epitélio juncional**. Abaixo do esmalte, a dentina coronária está formada, com os odontoblastos já recuados para a periferia da polpa. O contraste com a região radicular, onde a deposição ainda avança, é o que torna esta lâmina útil: dois estágios do mesmo dente convivendo no mesmo corte.',
    roteiro: [
      'Compare a região coronária com a radicular no mesmo corte para ver a defasagem.',
      'Procure o epitélio reduzido do esmalte sobre a coroa já formada.',
    ],
  },

  'root stage of tooth development - neck region': {
    panorama:
      'A região do colo é onde coroa e raiz se encontram, e é ali que a **bainha de Hertwig** tem origem: as duas camadas do órgão do esmalte, a interna e a externa, encontram-se na alça cervical e se prolongam para baixo como uma manga dupla, agora sem retículo estrelado nem estrato intermédio entre elas. É essa configuração que estabelece a fronteira do esmalte — acima dela há amelogênese, abaixo não. A junção amelocementária, ponto em que esmalte e cemento se encontram, forma-se ali, e sua configuração varia: em cerca de 60% dos dentes o cemento cobre o esmalte, em 30% eles apenas se tocam, e em 10% resta dentina exposta entre os dois, o que explica parte das sensibilidades cervicais.',
    roteiro: [
      'Localize a alça cervical: é dela que a bainha se projeta.',
      'Observe a junção amelocementária e o padrão de contato entre os dois tecidos.',
    ],
  },

  'root stage of tooth development - apex': {
    panorama:
      'O ápice é a última porção da raiz a se formar e permanece **aberto** por um bom tempo depois de o dente já ter irrompido — a chamada raiz incompleta, com forame amplo e paredes de dentina finas e divergentes. Enquanto a bainha de Hertwig continua ativa ali, a raiz se alonga e o forame vai se estreitando por deposição contínua de dentina e cemento, até se fechar em geral dois a três anos após a erupção. Essa cronologia tem consequência clínica direta: um dente jovem com ápice aberto ainda tem potencial de apicificação, e o tratamento endodôntico difere do de um dente com ápice fechado. Pelo forame passa o feixe vasculonervoso da polpa.',
    roteiro: [
      'Avalie o diâmetro do forame e a convergência das paredes para estimar a maturidade da raiz.',
      'Siga o feixe vasculonervoso atravessando o ápice em direção à polpa.',
    ],
  },

  'salivary glands': {
    panorama:
      'As glândulas salivares produzem cerca de um litro e meio de saliva por dia e se dividem em maiores e menores. As **maiores** são pares e extrínsecas: **parótida**, acinar composta, puramente **serosa**; **submandibular**, tubuloacinar composta, **mista com predomínio seroso** e com semiluas serosas sobre túbulos mucosos; e **sublingual**, tubuloacinar composta, **mista com predomínio mucoso**. As **menores** estão dispersas na mucosa oral — labiais, bucais, palatinas, linguais — e secretam continuamente. O sistema de ductos é o mesmo em todas: intercalar, estriado, interlobular e excretor, e os **ductos estriados**, com invaginações basais cheias de mitocôndrias, modificam a composição iônica da saliva.',
    roteiro: [
      'Classifique a glândula pela proporção seroso/mucoso antes de nomeá-la.',
      'Procure os ductos estriados: sua abundância também varia entre as três maiores.',
    ],
  },

  'major salivary glands': {
    panorama:
      'As três glândulas salivares maiores se distinguem na lâmina por dois critérios combinados. A **parótida** tem apenas **ácinos serosos**, arredondados e escuros, base basófila e ápice granular, com ductos estriados numerosos e, no adulto, quantidade variável de tecido adiposo no estroma — o que ajuda a reconhecê-la. A **submandibular** é mista: predominam ácinos serosos, mas há túbulos mucosos pálidos encimados por **semiluas serosas**, e os ductos estriados são longos e conspícuos. A **sublingual** também é mista, com predomínio de **túbulos mucosos** pálidos, poucas semiluas e ductos estriados escassos ou ausentes. A regra prática: só seroso é parótida; misto com semiluas é submandibular; muito mucoso é sublingual.',
    roteiro: [
      'Estime a proporção entre seroso e mucoso em pequeno aumento antes de qualquer detalhe.',
      'Conte os ductos estriados: eles decrescem de parótida para sublingual.',
    ],
    atencao:
      'A semilua serosa clássica é em parte artefato de fixação; em preparações por congelação rápida ela quase desaparece.',
  },

  'oral cavity': {
    panorama:
      'A cavidade oral é o começo do tubo digestório e reúne, num espaço pequeno, uma variedade de tecidos que nenhum outro segmento repete. Seu revestimento é a **mucosa oral**, em três variedades: de **revestimento**, não queratinizada e móvel; **mastigatória**, queratinizada e aderida ao osso; e **especializada**, no dorso da língua, com papilas e botões gustativos. Contém os **dentes**, únicos tecidos mineralizados expostos ao exterior, com seu periodonto; a **língua**, um hidrostato muscular; e as **glândulas salivares** maiores e menores, que umedecem, lubrificam, tamponam e iniciam a digestão do amido. Não há muscular da mucosa em nenhuma parte dela.',
    roteiro: [
      'Classifique a mucosa nos três tipos antes de localizar a região.',
      'Confirme a ausência de muscular da mucosa, que só aparece a partir do esôfago.',
    ],
  },

  components: {
    panorama:
      'Os componentes do tubo digestório se repetem do esôfago ao ânus, e nomeá-los na ordem certa é o método mais seguro de leitura. A **mucosa** tem três subcamadas: o **epitélio**, que varia conforme a agressão local; a **lâmina própria**, de conjuntivo frouxo com vasos, glândulas e tecido linfoide; e a **muscular da mucosa**, fina lâmina de músculo liso que move a mucosa independentemente da parede. A **submucosa** é conjuntivo denso com os vasos maiores e o plexo de Meissner. A **muscular externa** propele o conteúdo e aloja o plexo de Auerbach. A camada externa é **serosa**, onde há peritônio, ou **adventícia**, onde o órgão é retroperitoneal ou está fora da cavidade.',
    roteiro: [
      'Ache a muscular da mucosa: ela é a fronteira entre mucosa e submucosa.',
      'Decida entre serosa e adventícia procurando o mesotélio na superfície externa.',
    ],
  },

  tunics: {
    panorama:
      'As quatro túnicas do tubo digestório são constantes, mas suas proporções e conteúdos variam de modo previsível, e é essa variação que identifica o segmento. O **epitélio** é estratificado pavimentoso onde há atrito — esôfago, canal anal — e simples colunar onde há secreção e absorção. As **glândulas** ocupam camadas diferentes conforme a região: na mucosa no estômago e no intestino, na submucosa apenas no esôfago e no duodeno. A **muscular externa** é esquelética no terço superior do esôfago, lisa no restante, tem três camadas no estômago e forma as tênias no cólon. A camada externa é serosa nas porções intraperitoneais e adventícia nas demais.',
    roteiro: [
      'Percorra as quatro túnicas em ordem, anotando o que cada uma tem de peculiar.',
      'Use a localização das glândulas como o critério mais econômico de identificação.',
    ],
  },

  'diagnostic features': {
    panorama:
      'Cada segmento do tubo digestório tem um punhado de achados que o identificam sem ambiguidade, e vale guardá-los como uma lista curta. **Esôfago**: epitélio estratificado pavimentoso mais glândulas na submucosa. **Estômago**: epitélio simples colunar **sem** células caliciformes, fossetas e três camadas na muscular externa. **Duodeno**: vilosidades mais **glândulas de Brunner** na submucosa. **Jejuno**: vilosidades altas, pregas circulares proeminentes, sem Brunner nem placas de Peyer. **Íleo**: vilosidades mais curtas, muitas caliciformes e **placas de Peyer**. **Cólon**: sem vilosidades, criptas retas e paralelas, muitas caliciformes, **tênias**. **Apêndice**: luz pequena e anel linfoide contínuo.',
    roteiro: [
      'Percorra a lista de achados negativos também: ausência de vilosidade ou de caliciforme identifica tanto quanto presença.',
      'Confirme sempre dois achados antes de nomear o segmento.',
    ],
  },

  'overview of the tubular digestive system': {
    panorama:
      'O tubo digestório é um cilindro contínuo da boca ao ânus, e sua luz é, topologicamente, **exterior ao corpo** — tudo o que entra precisa atravessar uma célula epitelial para ser absorvido. Suas funções se distribuem ao longo do trajeto: ingestão e mastigação na boca, transporte no esôfago, digestão química e mecânica no estômago, digestão final e **absorção** no delgado, recuperação de água e eletrólitos no cólon, e armazenamento e eliminação no reto. O plano de quatro camadas se mantém em todo o percurso; o que muda é o epitélio, a localização das glândulas e as especializações de superfície — e essas variações acompanham exatamente a função de cada trecho.',
    roteiro: [
      'Associe cada segmento à sua função dominante antes de descrever a parede.',
      'Lembre que a luz é o exterior: isso explica por que há tanto tecido linfoide na parede.',
    ],
  },

  'esophagus: epithelium': {
    panorama:
      'O esôfago é revestido por epitélio **estratificado pavimentoso não queratinizado**, e a escolha se explica pela função: o órgão apenas transporta, e o que ele precisa é resistir à abrasão do bolo alimentar, não absorver. As células superficiais permanecem vivas e mantêm núcleo e citoplasma — é isso que o separa do epitélio queratinizado da pele. A camada basal é proliferativa e repõe o epitélio inteiro em poucos dias. A lâmina própria abaixo dele contém, em algumas regiões, as **glândulas cárdicas esofágicas**. A metaplasia desse epitélio para colunar com células caliciformes, sob refluxo ácido crônico, é o esôfago de Barrett, com risco aumentado de adenocarcinoma.',
    roteiro: [
      'Procure núcleos nas células superficiais para confirmar que não é queratinizado.',
      'Note a ausência de células caliciformes: encontrá-las aqui é achado patológico.',
    ],
  },

  'esophagus: mucosa': {
    panorama:
      'A mucosa esofágica tem as três subcamadas habituais e algumas particularidades. O **epitélio** é estratificado pavimentoso não queratinizado, espesso. A **lâmina própria** é conjuntivo frouxo com papilas que sobem para dentro do epitélio, tecido linfoide difuso e, nas extremidades do órgão, as **glândulas cárdicas esofágicas**, mucosas. A **muscular da mucosa** é notavelmente espessa aqui, mais do que em qualquer outro segmento do tubo, e é formada sobretudo por feixes longitudinais — sua contração produz as pregas longitudinais que dão à luz esofágica em repouso o contorno estrelado característico, e que desaparecem quando o bolo passa.',
    roteiro: [
      'Note a espessura incomum da muscular da mucosa como pista de esôfago.',
      'Distinga glândulas na lâmina própria (cárdicas) das da submucosa (esofágicas próprias).',
    ],
  },
}

/**
 * Descrição aprofundada pelo título original, ou `null`.
 *
 * Alguns títulos do acervo são genéricos — "Overview" nomeia lâminas de oito
 * sistemas diferentes, "Membranes" aparece tanto na célula quanto nos órgãos.
 * Uma descrição única ali estaria errada na maioria dos lugares. Para esses, a
 * chave pode ser escopada por prefixo de rota (`'setor/sub::titulo'`) e a busca
 * tenta do escopo mais específico ao mais geral antes de cair no título nu.
 */
export function descricaoDaLamina(
  tituloOriginal: string,
  caminho?: readonly string[],
): DescricaoDeLamina | null {
  const titulo = tituloOriginal.trim().toLowerCase()
  if (caminho) {
    for (let i = caminho.length; i > 0; i--) {
      const achado = DESCRICOES[`${caminho.slice(0, i).join('/')}::${titulo}`]
      if (achado) return achado
    }
  }
  return DESCRICOES[titulo] ?? null
}

export const TOTAL_DE_DESCRICOES = Object.keys(DESCRICOES).length
