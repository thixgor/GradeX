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
