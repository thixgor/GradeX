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
}

/** Descrição aprofundada pelo título original, ou `null`. */
export function descricaoDaLamina(tituloOriginal: string): DescricaoDeLamina | null {
  return DESCRICOES[tituloOriginal.trim().toLowerCase()] ?? null
}

export const TOTAL_DE_DESCRICOES = Object.keys(DESCRICOES).length
