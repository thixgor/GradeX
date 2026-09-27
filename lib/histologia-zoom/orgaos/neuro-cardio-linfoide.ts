import type { Orgao } from '../tipos'

/** Sistema nervoso, cardiovascular, linfoide e órgãos dos sentidos. */
export const ORGAOS_NEURO_CARDIO_LINFOIDE: Orgao[] = [
  // ─── Sistema nervoso ──────────────────────────────────────────────────────
  {
    id: 'medula-espinal',
    nome: 'Medula espinal',
    sistema: 'nervoso',
    sinonimos: ['spinal cord', 'medula espinhal', 'corno anterior', 'neurônio motor', 'substância cinzenta', 'substância branca', 'gânglio da raiz dorsal', 'gânglio sensitivo', 'Nissl'],
    ficha: {
      resumo:
        'Corte transversal da medula: substância cinzenta central em "H" ou borboleta, cercada pela substância branca dos tratos.',
      tecidoPrincipal: 'Nervoso — sistema nervoso central',
      epitelios: [
        { tipo: 'Simples cúbico a cilíndrico (epêndima)', onde: 'Revestindo o canal central, no meio da comissura cinzenta.' },
      ],
      morfologia: [
        'Substância cinzenta central em forma de H: cornos anteriores (ventrais) largos e posteriores (dorsais) estreitos.',
        'Neurônios motores do corno anterior: grandes, multipolares, com núcleo claro, nucléolo evidente e corpúsculos de Nissl grossos (tionina).',
        'Substância branca periférica: axônios mielinizados cortados transversalmente, com aspecto pontilhado; poucos núcleos (oligodendrócitos).',
        'Canal central pequeno revestido por epêndima.',
        'Meninges na superfície: pia-máter aderida, aracnoide e dura-máter.',
        'Com Weigert-Weil a mielina escurece: a substância branca fica preta e a cinzenta clara — o inverso do Nissl.',
        'Quando o gânglio da raiz dorsal está incluído: neurônios pseudounipolares redondos envoltos por células satélites.',
      ],
      celulas: [
        { nome: 'Oligodendrócitos', pct: 40, nota: 'Núcleos pequenos e redondos, com halo claro; enfileirados na substância branca.' },
        { nome: 'Astrócitos', pct: 25, nota: 'Núcleos ovais e pálidos na substância cinzenta; o corpo não se vê bem em HE/Nissl.' },
        { nome: 'Neurônios', pct: 15, nota: 'Motores grandes no corno anterior; menores no corno posterior.' },
        { nome: 'Micróglia', pct: 10, nota: 'Núcleos alongados, escuros, em bastonete.' },
        { nome: 'Células endoteliais', pct: 5, nota: 'Capilares do neurópilo.' },
        { nome: 'Células ependimárias', pct: 5, nota: 'Em volta do canal central.' },
      ],
      tecidos: [
        { tipo: 'nervoso-snc', pct: 90, onde: 'Substâncias branca (~60 %) e cinzenta (~30 %).' },
        { tipo: 'conjuntivo-frouxo', pct: 5, onde: 'Pia-máter e aracnoide, com vasos.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Dura-máter, quando incluída.' },
      ],
      reconhecer: [
        'Borboleta/H de substância cinzenta no centro.',
        'Neurônios motores gigantes nos cornos anteriores.',
        'Canal central minúsculo no meio.',
      ],
      diferencial: [
        'Córtex cerebral: substância cinzenta por fora e branca por dentro — o contrário da medula.',
        'Nervo periférico: fascículos com perineuro e sem corpos neuronais.',
      ],
    },
  },
  {
    id: 'cortex-cerebral',
    nome: 'Córtex cerebral',
    sistema: 'nervoso',
    sinonimos: ['cerebral cortex', 'cérebro', 'neurônios piramidais', 'camadas corticais', 'neocórtex', 'impregnação argêntica'],
    ficha: {
      resumo:
        'Neocórtex impregnado pela prata: neurônios piramidais e seus dendritos apicais, organizados em seis camadas.',
      tecidoPrincipal: 'Nervoso — sistema nervoso central (substância cinzenta)',
      epitelios: [],
      semEpitelio: 'O SNC não tem epitélio de superfície; a pia-máter é conjuntivo.',
      morfologia: [
        'Seis camadas paralelas à superfície: molecular, granular externa, piramidal externa, granular interna, piramidal interna e multiforme.',
        'Neurônios piramidais: corpo triangular com o ápice e o dendrito apical voltados para a superfície; axônio descendo para a substância branca.',
        'A impregnação argêntica cora apenas uma fração dos neurônios, mas de forma completa, revelando dendritos e espinhas.',
        'Camada molecular superficial pobre em corpos celulares, rica em fibras.',
        'Substância branca por baixo do córtex, com fibras em direção radial.',
      ],
      celulas: [
        { nome: 'Células da glia (astrócitos, oligodendrócitos, micróglia)', pct: 50, nota: 'Maioria numérica, pouco visível na prata.' },
        { nome: 'Neurônios piramidais', pct: 35, nota: 'Triangulares, dendrito apical para a pia.' },
        { nome: 'Neurônios granulares (estrelados)', pct: 10, nota: 'Pequenos, nas camadas II e IV.' },
        { nome: 'Células endoteliais', pct: 5, nota: 'Capilares.' },
      ],
      tecidos: [
        { tipo: 'nervoso-snc', pct: 95, onde: 'Córtex (substância cinzenta) e substância branca subjacente.' },
        { tipo: 'conjuntivo-frouxo', pct: 5, onde: 'Pia-máter e vasos que penetram o córtex.' },
      ],
      reconhecer: [
        'Neurônios negros em forma de pirâmide, todos apontando para a mesma superfície.',
        'Fundo claro e dourado com dendritos finos.',
      ],
      diferencial: [
        'Cerebelo: camada de Purkinje em fila única e camada granular densíssima.',
        'Medula espinal: substância cinzenta central.',
      ],
    },
  },
  {
    id: 'cerebelo',
    nome: 'Cerebelo',
    sistema: 'nervoso',
    sinonimos: ['cerebellum', 'células de Purkinje', 'camada granular', 'camada molecular', 'folhas cerebelares', 'árvore da vida', 'arbor vitae', 'glomérulo cerebelar'],
    ficha: {
      resumo:
        'Córtex cerebelar dobrado em folhas, com três camadas nítidas — molecular, de Purkinje e granular — sobre um eixo de substância branca.',
      tecidoPrincipal: 'Nervoso — sistema nervoso central',
      epitelios: [],
      semEpitelio: 'O SNC não tem epitélio; a superfície das folhas é coberta pela pia-máter (conjuntivo).',
      morfologia: [
        'Folhas cerebelares: cristas estreitas e paralelas, cada uma com um eixo de substância branca e córtex por fora ("árvore da vida" em corte).',
        'Camada molecular externa: larga, eosinófila e pobre em células (células em cesto e estreladas esparsas), atravessada pelos dendritos das células de Purkinje e pelas fibras paralelas.',
        'Camada de células de Purkinje: uma única fileira de corpos celulares grandes, piriformes, com nucléolo evidente, na interface entre molecular e granular.',
        'Camada granular: faixa densíssima de núcleos pequenos, redondos e basófilos (células granulares), com espaços pálidos — os glomérulos cerebelares.',
        'Substância branca central: fibras mielinizadas pálidas, com núcleos de oligodendrócitos enfileirados.',
        'Pia-máter e vasos sobre a superfície e nos sulcos entre as folhas.',
      ],
      celulas: [
        { nome: 'Células granulares', pct: 75, nota: 'Os menores neurônios do encéfalo; núcleo redondo, escuro, quase sem citoplasma.' },
        { nome: 'Oligodendrócitos', pct: 10, nota: 'Substância branca e camada granular.' },
        { nome: 'Astrócitos (incluindo a glia de Bergmann)', pct: 7, nota: 'Glia de Bergmann: corpos junto às células de Purkinje, fibras radiais até a pia.' },
        { nome: 'Células em cesto e estreladas', pct: 3, nota: 'Interneurônios esparsos da camada molecular.' },
        { nome: 'Células de Purkinje', pct: 2, nota: 'Poucas em número, gigantes em tamanho — a única saída do córtex cerebelar.' },
        { nome: 'Micróglia, células de Golgi e endoteliais', pct: 3, nota: 'Golgi: neurônios maiores na camada granular.' },
      ],
      tecidos: [
        { tipo: 'nervoso-snc', pct: 95, onde: 'Córtex cerebelar (molecular ~40 %, granular ~35 %) e substância branca (~20 %).' },
        { tipo: 'conjuntivo-frouxo', pct: 5, onde: 'Pia-máter e vasos nos sulcos.' },
      ],
      reconhecer: [
        'Folhas com faixa externa rosa (molecular) e faixa interna roxa muito densa (granular).',
        'Fileira única de células grandes entre as duas faixas (Purkinje).',
      ],
      diferencial: [
        'Córtex cerebral: seis camadas sem uma faixa granular tão densa; neurônios piramidais em vez de Purkinje.',
        'Hipocampo: uma camada de piramidais e uma de células granulares (giro denteado), sem folhas.',
      ],
    },
  },
  {
    id: 'nervo-periferico',
    nome: 'Nervo periférico',
    sistema: 'nervoso',
    sinonimos: ['peripheral nerve', 'mielina', 'nó de Ranvier', 'célula de Schwann', 'perineuro', 'endoneuro', 'epineuro', 'ósmio', 'fibra nervosa'],
    ficha: {
      resumo:
        'Feixes de axônios mielinizados envoltos por endo, peri e epineuro. Com ósmio, a mielina aparece em anéis pretos.',
      tecidoPrincipal: 'Nervoso — sistema nervoso periférico',
      epitelios: [],
      semEpitelio:
        'Não há epitélio; o perineuro é um revestimento de células epitelioides unidas por junções, mas é classificado como conjuntivo especializado.',
      morfologia: [
        'Em corte transversal (ósmio): cada fibra mielinizada é um anel preto com o axônio claro no centro; os calibres variam.',
        'Fascículos delimitados pelo perineuro — camadas concêntricas de células achatadas.',
        'Endoneuro: conjuntivo frouxo delicado entre as fibras, com capilares.',
        'Epineuro: conjuntivo denso não modelado envolvendo todo o nervo, com adipócitos e vasos.',
        'Em preparação dissociada (pluck): fibras isoladas mostram os nós de Ranvier — estrangulamentos da mielina.',
      ],
      celulas: [
        { nome: 'Células de Schwann', pct: 60, nota: 'Núcleos alongados colados às fibras; formam a mielina.' },
        { nome: 'Fibroblastos endoneurais', pct: 15, nota: 'Entre as fibras.' },
        { nome: 'Células perineurais', pct: 10, nota: 'Achatadas, em lamelas concêntricas.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Vasa nervorum.' },
        { nome: 'Adipócitos e mastócitos', pct: 5, nota: 'No epineuro.' },
      ],
      tecidos: [
        { tipo: 'nervoso-snp', pct: 65, onde: 'Fibras nervosas nos fascículos.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 20, onde: 'Epineuro e perineuro.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Endoneuro.' },
        { tipo: 'adiposo-unilocular', pct: 5, onde: 'Gordura do epineuro.' },
      ],
      reconhecer: [
        'Anéis pretos de tamanhos variados (ósmio).',
        'Fascículos redondos com bainha perineural.',
      ],
      diferencial: [
        'Tendão: sem bainhas de mielina, núcleos mais escassos e finos.',
        'Músculo liso: sem espaços de mielina, núcleos centrais em charuto.',
      ],
    },
  },
  {
    id: 'ganglio-autonomo',
    nome: 'Gânglio autônomo',
    sistema: 'nervoso',
    sinonimos: ['autonomic ganglion', 'gânglio intramural', 'neurônio pós-ganglionar', 'células satélites', 'parassimpático'],
    ficha: {
      resumo:
        'Gânglio autonômico na parede da bexiga: neurônios multipolares pós-ganglionares cercados por células satélites.',
      tecidoPrincipal: 'Nervoso — sistema nervoso periférico (gânglio)',
      epitelios: [
        { tipo: 'Urotélio (de transição)', onde: 'Na mucosa da bexiga, se incluída no corte.' },
      ],
      morfologia: [
        'Aglomerado de corpos neuronais grandes, com núcleo claro, nucléolo evidente e citoplasma basófilo.',
        'Neurônios multipolares, frequentemente com núcleo excêntrico.',
        'Células satélites pequenas em volta de cada neurônio — menos regulares que no gânglio sensitivo.',
        'Fibras nervosas amielínicas e mielínicas entre os neurônios.',
        'O gânglio fica mergulhado no conjuntivo e no músculo liso da parede do órgão.',
      ],
      celulas: [
        { nome: 'Células musculares lisas (parede do órgão)', pct: 40, nota: 'Em volta do gânglio.' },
        { nome: 'Células satélites e de Schwann', pct: 25, nota: 'Núcleos pequenos ao redor dos neurônios.' },
        { nome: 'Neurônios ganglionares', pct: 15, nota: 'Grandes, citoplasma violáceo.' },
        { nome: 'Fibroblastos', pct: 10, nota: 'Cápsula e septos.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Capilares.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 45, onde: 'Parede da bexiga em volta.' },
        { tipo: 'nervoso-snp', pct: 25, onde: 'O gânglio e suas fibras.' },
        { tipo: 'conjuntivo-frouxo', pct: 25, onde: 'Lâmina própria e septos.' },
        { tipo: 'epitelial-revestimento', pct: 5, onde: 'Urotélio.' },
      ],
      reconhecer: [
        'Grupo de células grandes e redondas com nucléolo, em meio a músculo liso.',
        'Anel de núcleos pequenos (satélites) em volta de cada neurônio.',
      ],
    },
  },

  // ─── Cardiovascular ───────────────────────────────────────────────────────
  {
    id: 'aorta',
    nome: 'Aorta',
    sistema: 'cardiovascular',
    sinonimos: ['aorta', 'artéria elástica', 'lâminas elásticas', 'túnica média', 'vasa vasorum', 'elastic artery'],
    ficha: {
      resumo:
        'Artéria elástica: túnica média espessa com dezenas de lâminas elásticas fenestradas, que amortecem a pressão sistólica.',
      tecidoPrincipal: 'Conjuntivo elástico e muscular liso (túnica média)',
      epitelios: [
        { tipo: 'Simples pavimentoso (endotélio)', onde: 'Revestindo a luz, sobre a túnica íntima.' },
      ],
      morfologia: [
        'Túnica íntima: endotélio e camada subendotelial de conjuntivo frouxo, relativamente espessa.',
        'Túnica média muito espessa: 40–70 lâminas elásticas onduladas e concêntricas, com células musculares lisas entre elas.',
        'Com orceína, resorcina ou Sirius-resorcina, as lâminas elásticas aparecem como linhas escuras paralelas.',
        'Túnica adventícia fina: conjuntivo com vasa vasorum, nervos e adipócitos.',
        'Limite íntima/média pouco nítido — não há lâmina elástica interna única dominante, como nas artérias musculares.',
      ],
      celulas: [
        { nome: 'Células musculares lisas', pct: 70, nota: 'Entre as lâminas elásticas da média; produzem elastina e colágeno.' },
        { nome: 'Fibroblastos', pct: 15, nota: 'Adventícia.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Luz e vasa vasorum.' },
        { nome: 'Adipócitos e linfócitos', pct: 5, nota: 'Adventícia; linfonodo para-aórtico em algumas lâminas.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-elastico', pct: 45, onde: 'Lâminas elásticas da túnica média.' },
        { tipo: 'muscular-liso', pct: 30, onde: 'Túnica média.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 15, onde: 'Adventícia.' },
        { tipo: 'conjuntivo-frouxo', pct: 5, onde: 'Camada subendotelial da íntima.' },
        { tipo: 'epitelial-revestimento', pct: 5, onde: 'Endotélio (camada única, exagerada aqui para visibilidade).' },
      ],
      reconhecer: [
        'Parede espessa com muitas linhas onduladas paralelas.',
        'Média domina a espessura da parede.',
      ],
      diferencial: [
        'Artéria muscular (coronária): média de músculo liso com lâmina elástica interna nítida e poucas lâminas.',
        'Veia: parede fina, adventícia maior que a média, luz ampla e colapsada.',
      ],
    },
  },
  {
    id: 'arteria-coronaria',
    nome: 'Artéria coronária',
    sistema: 'cardiovascular',
    sinonimos: ['coronary artery', 'artéria muscular', 'lâmina elástica interna', 'aterosclerose', 'túnica média muscular'],
    ficha: {
      resumo:
        'Artéria muscular de médio calibre: média de músculo liso entre as lâminas elásticas interna e externa.',
      tecidoPrincipal: 'Muscular liso (túnica média)',
      epitelios: [
        { tipo: 'Simples pavimentoso (endotélio)', onde: 'Revestimento da luz.' },
      ],
      morfologia: [
        'Lâmina elástica interna nítida, ondulada, separando a íntima da média.',
        'Túnica média de músculo liso em arranjo circular, com poucas fibras elásticas.',
        'Lâmina elástica externa menos evidente, no limite com a adventícia.',
        'Íntima pode estar espessada com a idade (espessamento fibromuscular ou placa inicial).',
        'Com Sirius-resorcina-hematoxilina: colágeno vermelho, elástica violeta-escura, músculo amarelado.',
        'Tecido adiposo epicárdico e miocárdio em volta.',
      ],
      celulas: [
        { nome: 'Células musculares lisas', pct: 60, nota: 'Túnica média.' },
        { nome: 'Adipócitos', pct: 15, nota: 'Gordura epicárdica ao redor.' },
        { nome: 'Fibroblastos', pct: 10, nota: 'Adventícia.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Luz e vasa vasorum.' },
        { nome: 'Cardiomiócitos', pct: 5, nota: 'Miocárdio vizinho, se incluído.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 40, onde: 'Túnica média.' },
        { tipo: 'adiposo-unilocular', pct: 20, onde: 'Tecido adiposo epicárdico.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 20, onde: 'Adventícia.' },
        { tipo: 'conjuntivo-elastico', pct: 10, onde: 'Lâminas elásticas interna e externa.' },
        { tipo: 'conjuntivo-frouxo', pct: 5, onde: 'Íntima.' },
        { tipo: 'epitelial-revestimento', pct: 5, onde: 'Endotélio.' },
      ],
      reconhecer: [
        'Uma linha elástica ondulada nítida (interna) sob o endotélio.',
        'Média espessa e uniforme de músculo liso.',
      ],
      diferencial: [
        'Aorta: dezenas de lâminas elásticas na média.',
        'Veia acompanhante: parede fina, sem lâmina elástica interna marcada.',
      ],
    },
  },
  {
    id: 'arteria-muscular',
    nome: 'Artéria muscular (distribuidora)',
    sistema: 'cardiovascular',
    sinonimos: ['artéria tibial', 'tibial artery', 'artéria de médio calibre', 'artéria distribuidora', 'lâmina elástica interna', 'túnica média'],
    ficha: {
      resumo:
        'Artéria de médio calibre: túnica média espessa de músculo liso entre as lâminas elásticas interna e externa, que regula o fluxo para os órgãos.',
      tecidoPrincipal: 'Muscular liso (túnica média)',
      epitelios: [{ tipo: 'Simples pavimentoso (endotélio)', onde: 'Revestimento da luz, sobre a íntima fina.' }],
      morfologia: [
        'Íntima fina: endotélio e pouca camada subendotelial.',
        'Lâmina elástica interna ondulada e refringente, bem nítida — a assinatura da artéria muscular.',
        'Túnica média espessa: 10 a 40 camadas de músculo liso em arranjo circular.',
        'Lâmina elástica externa menos definida, na transição para a adventícia.',
        'Adventícia de conjuntivo com vasa vasorum, nervos e adipócitos.',
        'Após a morte e a fixação, a contração do músculo deixa a luz pequena e a lâmina elástica interna muito pregueada.',
      ],
      celulas: [
        { nome: 'Células musculares lisas', pct: 70, nota: 'Túnica média.' },
        { nome: 'Fibroblastos', pct: 15, nota: 'Adventícia.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Luz e vasa vasorum.' },
        { nome: 'Adipócitos e células de Schwann', pct: 5, nota: 'Adventícia e nervos vasculares.' },
      ],
      tecidos: [
        { tipo: 'muscular-liso', pct: 60, onde: 'Túnica média.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 25, onde: 'Adventícia.' },
        { tipo: 'conjuntivo-elastico', pct: 10, onde: 'Lâminas elásticas interna e externa.' },
        { tipo: 'epitelial-revestimento', pct: 5, onde: 'Endotélio.' },
      ],
      reconhecer: [
        'Anel muscular espesso com uma linha ondulada brilhante logo abaixo do endotélio.',
        'Parede proporcionalmente muito mais grossa que a luz.',
      ],
      diferencial: [
        'Veia de mesmo calibre: parede fina, média delgada, adventícia maior, sem lâmina elástica interna nítida.',
        'Aorta (elástica): dezenas de lâminas elásticas na média.',
      ],
    },
  },
  {
    id: 'coracao',
    nome: 'Parede cardíaca',
    sistema: 'cardiovascular',
    sinonimos: ['coração', 'cardiac wall', 'miocárdio', 'endocárdio', 'epicárdio', 'disco intercalar', 'fibras de Purkinje', 'heart'],
    ficha: {
      resumo:
        'Parede do coração em três camadas — endocárdio, miocárdio e epicárdio —, dominada pelo músculo estriado cardíaco.',
      tecidoPrincipal: 'Muscular estriado cardíaco',
      epitelios: [
        { tipo: 'Simples pavimentoso (endotélio)', onde: 'Endocárdio, revestindo as câmaras.' },
        { tipo: 'Simples pavimentoso (mesotélio)', onde: 'Epicárdio (pericárdio visceral), na superfície externa.' },
      ],
      morfologia: [
        'Miocárdio espesso: fibras ramificadas e anastomosadas, com 1–2 núcleos centrais.',
        'Discos intercalares: linhas transversais escuras em degrau entre as células.',
        'Estrias transversais mais discretas que no músculo esquelético.',
        'Halo claro perinuclear (acúmulo de glicogênio e lipofuscina).',
        'Endocárdio com camada subendocárdica onde podem correr fibras de Purkinje — maiores e mais claras.',
        'Epicárdio com tecido adiposo e os vasos coronários.',
        'Com Sirius, o colágeno do esqueleto fibroso e do interstício fica vermelho.',
      ],
      celulas: [
        { nome: 'Cardiomiócitos', pct: 30, nota: 'Maioria da massa, mas não do número de núcleos.' },
        { nome: 'Células endoteliais', pct: 40, nota: 'Rede capilar densíssima — cada cardiomiócito tem capilares próprios.' },
        { nome: 'Fibroblastos', pct: 20, nota: 'Interstício.' },
        { nome: 'Adipócitos e células do epicárdio', pct: 5, nota: 'Superfície.' },
        { nome: 'Células de condução (Purkinje)', pct: 5, nota: 'Subendocárdio.' },
      ],
      tecidos: [
        { tipo: 'muscular-cardiaco', pct: 75, onde: 'Miocárdio.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Interstício, subendocárdio e subepicárdio.' },
        { tipo: 'adiposo-unilocular', pct: 10, onde: 'Epicárdio.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 5, onde: 'Esqueleto fibroso e endocárdio.' },
      ],
      reconhecer: [
        'Fibras que se ramificam e se unem.',
        'Núcleo central com halo claro.',
        'Discos intercalares em degrau.',
      ],
      diferencial: [
        'Músculo esquelético: núcleos periféricos, sem ramificação nem discos intercalares.',
        'Músculo liso: sem estrias, células fusiformes isoladas.',
      ],
    },
  },

  // ─── Linfoide ─────────────────────────────────────────────────────────────
  {
    id: 'linfonodo',
    nome: 'Linfonodo',
    sistema: 'linfoide',
    sinonimos: ['lymph node', 'gânglio linfático', 'folículo linfoide', 'centro germinativo', 'seio subcapsular', 'fibras reticulares', 'paracórtex'],
    ficha: {
      resumo:
        'Filtro da linfa: cápsula, seios, córtex com folículos, paracórtex de linfócitos T e medula com cordões e seios medulares.',
      tecidoPrincipal: 'Conjuntivo especializado linfoide sobre estroma reticular',
      epitelios: [],
      semEpitelio: 'Órgão linfoide encapsulado; seios revestidos por endotélio descontínuo, não por epitélio.',
      morfologia: [
        'Cápsula de conjuntivo denso com trabéculas penetrando o órgão.',
        'Seio subcapsular logo abaixo da cápsula, recebendo os vasos linfáticos aferentes.',
        'Córtex: folículos linfoides (linfócitos B) com centros germinativos claros quando ativados.',
        'Paracórtex: linfócitos T difusos e vênulas de endotélio alto (HEV).',
        'Medula: cordões medulares (plasmócitos, macrófagos) alternados com seios medulares.',
        'Hilo com artéria, veia e linfático eferente.',
        'Com prata de Gomori, a rede de fibras reticulares aparece em preto sustentando tudo.',
      ],
      celulas: [
        { nome: 'Linfócitos B', pct: 40, nota: 'Folículos e cordões medulares.' },
        { nome: 'Linfócitos T', pct: 40, nota: 'Paracórtex.' },
        { nome: 'Macrófagos', pct: 5, nota: 'Seios; corpos tingíveis nos centros germinativos.' },
        { nome: 'Plasmócitos', pct: 5, nota: 'Cordões medulares; núcleo em roda de carroça.' },
        { nome: 'Células reticulares e dendríticas', pct: 5, nota: 'Estroma.' },
        { nome: 'Células endoteliais (inclusive HEV)', pct: 5, nota: 'Vênulas de endotélio alto no paracórtex.' },
      ],
      tecidos: [
        { tipo: 'linfoide', pct: 75, onde: 'Córtex, paracórtex e cordões medulares.' },
        { tipo: 'conjuntivo-reticular', pct: 10, onde: 'Estroma em todo o órgão (evidente com prata).' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 10, onde: 'Cápsula e trabéculas.' },
        { tipo: 'adiposo-unilocular', pct: 5, onde: 'Gordura pericapsular e hilar.' },
      ],
      reconhecer: [
        'Órgão encapsulado com folículos na periferia.',
        'Seio subcapsular sob a cápsula.',
        'Medula com cordões e seios.',
      ],
      diferencial: [
        'Baço: sem seio subcapsular nem córtex/medula; polpa vermelha dominante e arteríola central nos folículos.',
        'Timo: lóbulos com córtex escuro e medula clara com corpúsculos de Hassall, sem folículos.',
        'Tonsila: epitélio de superfície com criptas.',
      ],
    },
  },
  {
    id: 'baco',
    nome: 'Baço',
    sistema: 'linfoide',
    sinonimos: ['spleen', 'polpa branca', 'polpa vermelha', 'corpúsculo de Malpighi', 'arteríola central', 'seios esplênicos', 'cordões de Billroth'],
    ficha: {
      resumo:
        'Filtro do sangue: polpa vermelha (seios e cordões) com ilhas de polpa branca centradas em arteríolas.',
      tecidoPrincipal: 'Conjuntivo especializado linfoide e sangue',
      epitelios: [
        { tipo: 'Simples pavimentoso (mesotélio)', onde: 'Recobrindo a cápsula (peritônio visceral).' },
      ],
      morfologia: [
        'Cápsula espessa de conjuntivo denso com músculo liso, emitindo trabéculas com vasos.',
        'Polpa branca: bainha linfoide periarteriolar (T) e folículos (B) excêntricos à arteríola central.',
        'Polpa vermelha: seios venosos (endotélio em "aduela de barril") entre cordões esplênicos de Billroth.',
        'Zona marginal entre as polpas, com macrófagos.',
        'Não há córtex/medula nem seio subcapsular.',
      ],
      celulas: [
        { nome: 'Hemácias', pct: 45, nota: 'Polpa vermelha.' },
        { nome: 'Linfócitos', pct: 35, nota: 'Polpa branca e cordões.' },
        { nome: 'Macrófagos', pct: 10, nota: 'Cordões e zona marginal.' },
        { nome: 'Células endoteliais dos seios', pct: 5, nota: 'Alongadas, paralelas ao eixo do seio.' },
        { nome: 'Células reticulares e fibroblastos', pct: 5, nota: 'Estroma e cápsula.' },
      ],
      tecidos: [
        { tipo: 'sangue', pct: 50, onde: 'Polpa vermelha (seios e cordões).' },
        { tipo: 'linfoide', pct: 25, onde: 'Polpa branca.' },
        { tipo: 'conjuntivo-reticular', pct: 10, onde: 'Estroma.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 10, onde: 'Cápsula e trabéculas.' },
        { tipo: 'muscular-liso', pct: 5, onde: 'Cápsula, trabéculas e arteríolas.' },
      ],
      reconhecer: [
        'Mar vermelho com ilhas azuis (polpa branca).',
        'Arteríola dentro de cada ilha azul.',
      ],
      diferencial: ['Linfonodo: folículos só na periferia e seio subcapsular.'],
    },
  },
  {
    id: 'timo',
    nome: 'Timo',
    sistema: 'linfoide',
    sinonimos: ['thymus', 'corpúsculo de Hassall', 'timócitos', 'célula epitelial reticular', 'córtex tímico', 'medula tímica'],
    ficha: {
      resumo:
        'Órgão linfoide primário em que os linfócitos T amadurecem: lóbulos com córtex escuro e medula clara.',
      tecidoPrincipal: 'Linfoide sobre estroma epitelial (citorreticulo)',
      epitelios: [
        { tipo: 'Epitélio reticular (células epiteliais reticulares)', onde: 'Estroma de todo o lóbulo; forma os corpúsculos de Hassall na medula.' },
      ],
      morfologia: [
        'Cápsula fina com septos dividindo o órgão em lóbulos incompletos.',
        'Córtex periférico muito basófilo, lotado de timócitos pequenos.',
        'Medula central mais clara, contínua entre lóbulos vizinhos.',
        'Corpúsculos de Hassall na medula: espirais concêntricas de células epiteliais, eosinófilas, às vezes queratinizadas.',
        'Sem folículos linfoides e sem seios — o estroma é epitelial, não reticular.',
        'Em indivíduo jovem, sem involução adiposa significativa.',
      ],
      celulas: [
        { nome: 'Timócitos (linfócitos T em maturação)', pct: 85, nota: 'Córtex e medula.' },
        { nome: 'Células epiteliais reticulares', pct: 10, nota: 'Núcleos grandes e pálidos no estroma; Hassall.' },
        { nome: 'Macrófagos e células dendríticas', pct: 5, nota: 'Macrófagos com corpos apoptóticos no córtex.' },
      ],
      tecidos: [
        { tipo: 'linfoide', pct: 75, onde: 'Córtex e medula.' },
        { tipo: 'epitelial-revestimento', pct: 10, onde: 'Citorreticulo epitelial e corpúsculos de Hassall.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Cápsula e septos.' },
        { tipo: 'adiposo-unilocular', pct: 5, onde: 'Septos (aumenta com a idade).' },
      ],
      reconhecer: [
        'Lóbulos com periferia escura e centro claro.',
        'Corpúsculos de Hassall — rosa, em cebola.',
      ],
      diferencial: [
        'Linfonodo: folículos com centro germinativo, seios.',
        'Tonsila: epitélio de superfície e criptas.',
      ],
    },
  },
  {
    id: 'tonsila',
    nome: 'Tonsila palatina',
    sistema: 'linfoide',
    sinonimos: ['tonsil', 'amígdala', 'criptas', 'MALT', 'tecido linfoide associado à mucosa'],
    ficha: {
      resumo:
        'Aglomerado linfoide sob o epitélio da orofaringe, com criptas profundas que aumentam a superfície de contato com antígenos.',
      tecidoPrincipal: 'Conjuntivo especializado linfoide',
      epitelios: [
        { tipo: 'Estratificado pavimentoso não queratinizado', onde: 'Superfície e revestimento das criptas, infiltrado por linfócitos.' },
      ],
      morfologia: [
        'Epitélio estratificado pavimentoso que mergulha em criptas longas e ramificadas.',
        'Folículos linfoides com centros germinativos alinhados ao longo das criptas.',
        'Linfócitos invadem o epitélio das criptas, que perde a nitidez (epitélio linfoepitelial).',
        'Cápsula parcial de conjuntivo denso na face profunda.',
        'Glândulas mucosas e músculo esquelético podem aparecer abaixo da cápsula.',
      ],
      celulas: [
        { nome: 'Linfócitos', pct: 80, nota: 'Folículos e região interfolicular.' },
        { nome: 'Células epiteliais (queratinócitos)', pct: 10, nota: 'Superfície e criptas.' },
        { nome: 'Macrófagos e células dendríticas', pct: 5, nota: 'Centros germinativos.' },
        { nome: 'Plasmócitos e células endoteliais', pct: 5, nota: 'Região interfolicular.' },
      ],
      tecidos: [
        { tipo: 'linfoide', pct: 70, onde: 'Folículos e tecido difuso.' },
        { tipo: 'epitelial-revestimento', pct: 15, onde: 'Superfície e criptas.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 10, onde: 'Cápsula profunda e septos.' },
        { tipo: 'muscular-esqueletico', pct: 5, onde: 'Musculatura da faringe abaixo.' },
      ],
      reconhecer: [
        'Epitélio estratificado na superfície com invaginações profundas.',
        'Folículos com centro germinativo em volta das criptas.',
      ],
    },
  },

  // ─── Sentidos ─────────────────────────────────────────────────────────────
  {
    id: 'olho',
    nome: 'Olho (globo ocular)',
    sistema: 'sentidos',
    sinonimos: ['eye', 'retina', 'esclera', 'coroide', 'cristalino', 'íris', 'corpo ciliar', 'bulbo do olho'],
    ficha: {
      resumo:
        'Globo ocular inteiro: três túnicas (fibrosa, vascular e nervosa), cristalino e as câmaras.',
      tecidoPrincipal: 'Nervoso (retina) e conjuntivo (esclera)',
      epitelios: [
        { tipo: 'Estratificado pavimentoso não queratinizado', onde: 'Epitélio anterior da córnea.' },
        { tipo: 'Simples cúbico', onde: 'Epitélio pigmentar da retina, epitélio do corpo ciliar e subcapsular do cristalino.' },
        { tipo: 'Simples pavimentoso (endotélio da córnea)', onde: 'Face posterior da córnea.' },
      ],
      morfologia: [
        'Túnica fibrosa: córnea transparente na frente, esclera de conjuntivo denso atrás.',
        'Túnica vascular (úvea): coroide pigmentada, corpo ciliar com processos ciliares e íris.',
        'Retina com dez camadas: fotorreceptores, camada nuclear externa, plexiforme externa, nuclear interna, plexiforme interna, células ganglionares e fibras do nervo óptico.',
        'Cristalino: fibras alongadas e anucleadas, com cápsula espessa PAS-positiva.',
        'Com PAS, membranas basais (cápsula do cristalino, membrana de Bruch, Descemet) em magenta.',
      ],
      celulas: [
        { nome: 'Fotorreceptores (cones e bastonetes)', pct: 40, nota: 'Camada nuclear externa, a mais densa da retina.' },
        { nome: 'Neurônios da nuclear interna (bipolares, horizontais, amácrinas)', pct: 20, nota: 'Segunda faixa de núcleos.' },
        { nome: 'Fibras do cristalino', pct: 15, nota: 'Células alongadas; as centrais perdem o núcleo.' },
        { nome: 'Fibroblastos e melanócitos', pct: 10, nota: 'Esclera e úvea.' },
        { nome: 'Células epiteliais', pct: 10, nota: 'Córnea, epitélio pigmentar, corpo ciliar.' },
        { nome: 'Células ganglionares e glia de Müller', pct: 5, nota: 'Camada interna da retina.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 30, onde: 'Esclera.' },
        { tipo: 'nervoso-snc', pct: 25, onde: 'Retina (extensão do SNC).' },
        { tipo: 'epitelial-revestimento', pct: 20, onde: 'Cristalino, córnea e epitélios da úvea.' },
        { tipo: 'conjuntivo-frouxo', pct: 15, onde: 'Coroide e estroma da íris e do corpo ciliar.' },
        { tipo: 'conjuntivo-denso-modelado', pct: 5, onde: 'Estroma da córnea (lamelas ortogonais regulares).' },
        { tipo: 'muscular-liso', pct: 5, onde: 'Músculo ciliar e músculos da íris.' },
      ],
      reconhecer: [
        'Estrutura esférica com retina em faixas de núcleos na face interna.',
        'Cristalino oval e homogêneo.',
      ],
    },
  },
  {
    id: 'cornea',
    nome: 'Córnea',
    sistema: 'sentidos',
    sinonimos: ['cornea', 'membrana de Bowman', 'membrana de Descemet', 'estroma corneano', 'endotélio corneano'],
    ficha: {
      resumo:
        'Janela transparente do olho: epitélio, estroma de lamelas colágenas ortogonais e endotélio, sem vasos.',
      tecidoPrincipal: 'Conjuntivo denso modelado (estroma)',
      epitelios: [
        { tipo: 'Estratificado pavimentoso não queratinizado', onde: 'Face anterior, 5–7 camadas.' },
        { tipo: 'Simples pavimentoso (endotélio)', onde: 'Face posterior, sobre a membrana de Descemet.' },
      ],
      morfologia: [
        'Cinco camadas: epitélio, membrana de Bowman, estroma, membrana de Descemet e endotélio.',
        'Estroma: lamelas de colágeno paralelas entre si e ortogonais entre camadas — a base da transparência.',
        'Ceratócitos achatados entre as lamelas.',
        'Ausência completa de vasos sanguíneos.',
        'No camundongo, a membrana de Bowman é pouco evidente.',
      ],
      celulas: [
        { nome: 'Células do epitélio anterior', pct: 55, nota: 'Basais cilíndricas, superficiais achatadas.' },
        { nome: 'Ceratócitos', pct: 35, nota: 'Núcleos finos entre as lamelas do estroma.' },
        { nome: 'Células endoteliais', pct: 10, nota: 'Camada única posterior.' },
      ],
      tecidos: [
        { tipo: 'conjuntivo-denso-modelado', pct: 80, onde: 'Estroma (substância própria).' },
        { tipo: 'epitelial-revestimento', pct: 20, onde: 'Epitélio anterior e endotélio posterior.' },
      ],
      reconhecer: [
        'Faixa rosa homogênea sem vasos entre dois epitélios.',
        'Epitélio anterior estratificado, liso e regular.',
      ],
      diferencial: ['Pele fina: epiderme queratinizada, derme com vasos e anexos.'],
    },
  },
  {
    id: 'nervo-optico',
    nome: 'Nervo óptico',
    sistema: 'sentidos',
    sinonimos: ['optic nerve', 'nervus opticus', 'fascículos', 'bainha meníngea', 'lâmina crivosa'],
    ficha: {
      resumo:
        'Trato do SNC que sai do olho: axônios das células ganglionares mielinizados por oligodendrócitos, envoltos pelas meninges.',
      tecidoPrincipal: 'Nervoso — sistema nervoso central (substância branca)',
      epitelios: [],
      semEpitelio: 'Trato central envolto por meninges; não há epitélio.',
      morfologia: [
        'Fascículos de fibras mielinizadas separados por septos conjuntivos que vêm da pia-máter.',
        'Com ósmio, a mielina fica preta; com Sirius, os septos colágenos ficam vermelhos.',
        'Bainhas meníngeas (dura, aracnoide e pia) em volta de todo o nervo, com espaço subaracnóideo.',
        'Mielina feita por oligodendrócitos, não por células de Schwann — por isso é SNC.',
        'Artéria e veia centrais da retina no eixo, na porção próxima ao globo.',
      ],
      celulas: [
        { nome: 'Oligodendrócitos', pct: 50, nota: 'Núcleos redondos enfileirados entre as fibras.' },
        { nome: 'Astrócitos', pct: 30, nota: 'Núcleos ovais, sobretudo junto aos septos.' },
        { nome: 'Fibroblastos meníngeos', pct: 10, nota: 'Septos e bainhas.' },
        { nome: 'Células endoteliais e micróglia', pct: 10, nota: 'Capilares nos septos.' },
      ],
      tecidos: [
        { tipo: 'nervoso-snc', pct: 70, onde: 'Fascículos de fibras.' },
        { tipo: 'conjuntivo-denso-nao-modelado', pct: 20, onde: 'Dura-máter.' },
        { tipo: 'conjuntivo-frouxo', pct: 10, onde: 'Pia, aracnoide e septos.' },
      ],
      reconhecer: [
        'Nervo grosso com bainha tripla de meninges.',
        'Fascículos poligonais separados por septos vermelhos (Sirius).',
      ],
      diferencial: ['Nervo periférico: perineuro em vez de meninges; mielina de Schwann.'],
    },
  },
  {
    id: 'orelha-interna',
    nome: 'Orelha interna (cóclea)',
    sistema: 'sentidos',
    sinonimos: ['inner ear', 'cóclea', 'órgão de Corti', 'estria vascular', 'membrana basilar', 'ducto coclear', 'labirinto'],
    ficha: {
      resumo:
        'Cóclea em corte axial: espiras com as três rampas e o órgão de Corti sobre a membrana basilar, dentro do osso temporal.',
      tecidoPrincipal: 'Epitélio sensorial e osso',
      epitelios: [
        { tipo: 'Neuroepitélio (órgão de Corti)', onde: 'Sobre a membrana basilar, no ducto coclear.' },
        { tipo: 'Estratificado cúbico vascularizado (estria vascular)', onde: 'Parede lateral do ducto coclear.' },
        { tipo: 'Simples pavimentoso', onde: 'Membrana vestibular (de Reissner) e revestimento das rampas.' },
      ],
      morfologia: [
        'Modíolo ósseo central com o gânglio espiral.',
        'Cada espira mostra três compartimentos: rampa vestibular, ducto coclear (rampa média) e rampa timpânica.',
        'Órgão de Corti: células ciliadas internas (uma fileira) e externas (três), sustentadas por células de sustentação e pilares, sob a membrana tectória.',
        'Estria vascular na parede lateral, produtora da endolinfa.',
        'Cápsula ótica de osso compacto em volta.',
      ],
      celulas: [
        { nome: 'Osteócitos', pct: 35, nota: 'Cápsula ótica e modíolo.' },
        { nome: 'Neurônios do gânglio espiral e células satélites', pct: 25, nota: 'Modíolo.' },
        { nome: 'Células de sustentação do órgão de Corti', pct: 15, nota: 'Deiters, pilares, Hensen.' },
        { nome: 'Células ciliadas', pct: 5, nota: 'Internas e externas.' },
        { nome: 'Células da estria vascular', pct: 10, nota: 'Marginais, intermediárias e basais.' },
        { nome: 'Células de revestimento das rampas', pct: 10, nota: 'Pavimentosas.' },
      ],
      tecidos: [
        { tipo: 'osso-compacto', pct: 45, onde: 'Cápsula ótica e modíolo.' },
        { tipo: 'conjuntivo-frouxo', pct: 20, onde: 'Ligamento espiral e periósteo das rampas.' },
        { tipo: 'nervoso-snp', pct: 20, onde: 'Gânglio espiral e fibras do nervo coclear.' },
        { tipo: 'epitelial-revestimento', pct: 15, onde: 'Órgão de Corti, estria vascular e membranas.' },
      ],
      reconhecer: [
        'Espiras em "caracol" empilhadas em volta de um eixo ósseo.',
        'Três rampas por espira; órgão de Corti triangular na rampa média.',
      ],
    },
  },
]
