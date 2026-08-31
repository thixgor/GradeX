/**
 * Pranchas de anatomia pulmonar — lobos e segmentos broncopulmonares.
 *
 * As quatro pranchas são figuras fechadas: a demarcação já está pintada sobre a
 * radiografia, com chave de cores e nota de rodapé dentro da própria imagem.
 * Por isso elas não entram no atlas de incidências (`raio-x.ts`), cujo modelo é
 * outro — um filme limpo mais uma sobreposição transparente por estrutura, que
 * o aluno acende uma de cada vez.
 *
 * O que este módulo guarda é o texto que a figura não cabe: o dossiê de cada
 * território (onde achar, o que ele ensina, qual erro provoca), as convenções
 * gráficas, a leitura passo a passo, a tradução clínica e a autoavaliação.
 *
 * Ele é importado **apenas por componentes de servidor**. As telas recebem por
 * prop o recorte de que precisam — o catálogo recebe resumos, a página de uma
 * prancha recebe aquela prancha. Assim o navegador nunca baixa o dossiê das
 * outras três.
 */

export type TemaPrancha = 'lobos' | 'segmentos'
export type IncidenciaPrancha = 'PA' | 'Perfil'

/** Um território pintado na prancha: um lobo ou um segmento. */
export interface ItemChave {
  /** Identificador estável — âncora do caderno e deep-link (`?territorio=`). */
  slug: string
  /** Cor exata da mancha na figura, para o quadrado da chave bater com a imagem. */
  cor: string
  /** Sigla curta usada na figura (LSD, S6, S7+8…). */
  sigla: string
  nome: string
  /** Termo anatômico original, como aparece na literatura em inglês. */
  original: string
  /** Como achar a mancha na figura. */
  onde: string
  /** O que este território ensina — a leitura que ele permite. */
  leitura: string
  /** O erro que ele costuma provocar em quem está começando. */
  armadilha?: string
}

/** Bloco da chave de cores: um lobo e os territórios que descendem dele. */
export interface GrupoChave {
  id: string
  titulo: string
  sigla: string
  /** Cor-família do bloco — a mesma do lobo de origem. */
  cor: string
  /** Uma linha explicando o que o bloco reúne. */
  nota: string
  itens: ItemChave[]
}

/** Traço, tracejado, hachura: o vocabulário gráfico da prancha. */
export interface ConvencaoGrafica {
  amostra: 'linha-solida' | 'linha-tracejada' | 'hachura' | 'fantasma' | 'seta'
  nome: string
  significado: string
}

export interface BlocoTexto {
  titulo: string
  paragrafos: string[]
}

export interface ParPergunta {
  pergunta: string
  resposta: string
}

export interface PranchaRadiologica {
  slug: string
  /** Número da figura, como citado na legenda. */
  figura: number
  tema: TemaPrancha
  temaTitulo: string
  incidencia: IncidenciaPrancha
  titulo: string
  /** Uma linha para o cabeçalho: o que esta prancha resolve. */
  subtitulo: string
  /** Uma linha para o card do catálogo. */
  resumo: string
  imagem: string
  /** A mesma radiografia sem nenhuma marcação — para reconhecer antes de ver. */
  imagemLimpa: string
  altImagem: string
  altImagemLimpa: string
  largura: number
  altura: number
  /** Legenda de figura, no registro formal de publicação. */
  legenda: string
  grupos: GrupoChave[]
  convencoes: ConvencaoGrafica[]
  /** Como percorrer a prancha. */
  leitura: BlocoTexto[]
  /** O que isso muda diante de um paciente. */
  clinica: BlocoTexto[]
  armadilhas: string[]
  /** O que a prancha deliberadamente não mostra. */
  limites: string[]
  checagem: ParPergunta[]
  /** Slugs das pranchas que continuam o raciocínio. */
  relacionadas: string[]
}

/**
 * Assets versionados: `/img/*` recebe cache imutável de um ano. Se alguma
 * prancha for redesenhada, publique `v2` em vez de sobrescrever o arquivo.
 */
const RAIZ = '/img/radiologia/pranchas/v1'

/** As duas radiografias de base, sem marcação nenhuma. */
const FILME_LIMPO = {
  PA: `${RAIZ}/torax-pa-limpo.jpg`,
  Perfil: `${RAIZ}/torax-perfil-limpo.jpg`,
} as const

const ALT_LIMPO = {
  PA: 'Radiografia de tórax em incidência posteroanterior, sem nenhuma marcação',
  Perfil: 'Radiografia de tórax em incidência de perfil (lateral), sem nenhuma marcação',
} as const

/* ──────────────────────────── Cores da chave ──────────────────────────── */

/**
 * Família cromática de cada lobo. É o eixo que amarra as quatro pranchas: o
 * segmento herda a cor do lobo de onde nasce, e a hierarquia lobo → segmento
 * fica visível sem precisar de legenda.
 */
const COR = {
  lsd: '#2E86DE',
  lm: '#27AE60',
  lid: '#E74C3C',
  lse: '#F1C40F',
  lingula: '#F39C12',
  lie: '#8E44AD',
} as const

/* ─────────────────── Figura 1 — Lobos, incidência PA ─────────────────── */

const LOBOS_PA: PranchaRadiologica = {
  slug: 'lobos-pa',
  figura: 1,
  tema: 'lobos',
  temaTitulo: 'Lobos pulmonares',
  incidencia: 'PA',
  titulo: 'Lobos pulmonares em PA',
  subtitulo: 'Onde cada lobo se projeta quando a profundidade do tórax vira um plano só',
  resumo:
    'Os cinco lobos e a língula pintados sobre a PA, com a única cissura que a incidência mostra de verdade e as áreas em que dois lobos se sobrepõem.',
  imagem: `${RAIZ}/lobos-pa.png`,
  imagemLimpa: FILME_LIMPO.PA,
  altImagem:
    'Radiografia de tórax em PA com os lobos pulmonares pintados: superior direito em azul, médio em verde, inferior direito em vermelho, superior esquerdo em amarelo, língula em laranja e inferior esquerdo em roxo',
  altImagemLimpa: ALT_LIMPO.PA,
  largura: 1122,
  altura: 1402,
  legenda:
    'Figura 1. Lobos pulmonares em incidência PA. O pulmão direito é dividido em três lobos pelas cissuras horizontal e oblíqua; o esquerdo, em dois lobos pela cissura oblíqua, tendo a língula como equivalente funcional do lobo médio. Na PA apenas a cissura horizontal direita costuma ser visível, como linha fina na altura do 4º arco costal anterior — as demais delimitações são projeções esquemáticas, e por isso os lobos aparecem sobrepostos (áreas hachuradas). Note dois contatos de valor clínico: o lobo médio encosta na borda cardíaca direita e a língula na borda cardíaca esquerda, o que explica o sinal da silhueta (a consolidação que apaga a borda do coração é anterior; a que a preserva é posterior, do lobo inferior). Observe também que os lobos inferiores se projetam abaixo da cúpula diafragmática aparente, ocupando o recesso costofrênico posterior.',
  grupos: [
    {
      id: 'direito',
      titulo: 'Pulmão direito',
      sigla: '3 lobos',
      cor: COR.lsd,
      nota: 'Duas cissuras — horizontal e oblíqua — recortam três lobos.',
      itens: [
        {
          slug: 'lsd',
          cor: COR.lsd,
          sigla: 'LSD',
          nome: 'Lobo superior direito',
          original: 'right upper lobe',
          onde: 'Todo o terço superior do hemitórax direito, do ápice até a linha branca contínua da cissura horizontal, na altura do 4º arco costal anterior.',
          leitura:
            'É o único lobo cujo limite inferior você vê de fato na PA. Ele faz contorno com o mediastino superior direito, e é por isso que uma consolidação que apaga a margem da veia cava superior e a linha paratraqueal direita está nele. No colapso do LSD a cissura horizontal sobe, a traqueia se desloca para a direita e o hemidiafragma direito é puxado para cima.',
          armadilha:
            'O ápice do LSD se projeta atrás das clavículas, da 1ª costela e dos arcos posteriores. Nódulo apical desaparece no meio dessas linhas — compare sempre os dois ápices lado a lado antes de dar por normal.',
        },
        {
          slug: 'lm',
          cor: COR.lm,
          sigla: 'LM',
          nome: 'Lobo médio',
          original: 'right middle lobe',
          onde: 'Cunha entre a cissura horizontal (acima) e a oblíqua (abaixo), encostada na borda direita do coração.',
          leitura:
            'O lobo médio tem contato pleural direto com o átrio direito. Consolidação nele apaga a borda cardíaca direita e preserva a cúpula diafragmática — é o exemplo canônico do sinal da silhueta, e a razão pela qual você localiza uma pneumonia sem precisar do perfil.',
          armadilha:
            'Atelectasia do lobo médio pode ser quase invisível na PA: apenas um borramento da borda cardíaca direita, sem opacidade franca. Quem não conhece o sinal da silhueta laudar um filme desses como normal.',
        },
        {
          slug: 'lid',
          cor: COR.lid,
          sigla: 'LID',
          nome: 'Lobo inferior direito',
          original: 'right lower lobe',
          onde: 'Todo o território atrás e abaixo da cissura oblíqua. Na PA ele se sobrepõe ao lobo médio (área hachurada) e desce abaixo da cúpula diafragmática aparente.',
          leitura:
            'O inverso exato do lobo médio: consolidação do LID apaga o hemidiafragma direito e preserva a borda cardíaca. Esse par — borda do coração apagada versus cúpula apagada — resolve a maioria das pneumonias de base à direita já na PA.',
          armadilha:
            'Uma parte do LID se projeta atrás do fígado e da cúpula. Opacidade infradiafragmática à direita não é "abdome": olhe através do diafragma, como se olha através do coração.',
        },
      ],
    },
    {
      id: 'esquerdo',
      titulo: 'Pulmão esquerdo',
      sigla: '2 lobos',
      cor: COR.lse,
      nota: 'Uma única cissura oblíqua. A língula é parte do lobo superior, não um terceiro lobo.',
      itens: [
        {
          slug: 'lse',
          cor: COR.lse,
          sigla: 'LSE',
          nome: 'Lobo superior esquerdo',
          original: 'left upper lobe',
          onde: 'Do ápice esquerdo até a cissura oblíqua, incluindo a língula, que desce em laranja sobre a borda esquerda do coração.',
          leitura:
            'Faz contorno com o botão aórtico e com o tronco da artéria pulmonar. O colapso do LSE não produz uma opacidade densa como à direita: produz um véu difuso sobre todo o hemitórax esquerdo, com a vascularização ainda visível através dele — e, quando o LIE hiperinsufla para ocupar o espaço, aparece a foice de ar periaórtica do sinal do luftsichel.',
          armadilha:
            'À esquerda não existe cissura horizontal. Qualquer linha horizontal no hemitórax esquerdo é cissura acessória, prega pleural, borda de escápula ou artefato — nunca a divisão entre dois lobos.',
        },
        {
          slug: 'lingula',
          cor: COR.lingula,
          sigla: 'Língula',
          nome: 'Língula (porção do LSE)',
          original: 'lingula of the left upper lobe',
          onde: 'Prolongamento inferomedial do amarelo, pintado em laranja, apoiado na borda esquerda do coração e descendo até o seio costofrênico anterior.',
          leitura:
            'Equivalente funcional do lobo médio no pulmão esquerdo: mesma posição anterior, mesmo contato com a borda do coração, mesmo comportamento no sinal da silhueta — consolidação lingular apaga a borda cardíaca esquerda.',
          armadilha:
            'Tratar a língula como um lobo. Ela não tem cissura própria e não é separada por pleura do resto do LSE, exceto na variante rara de cissura acessória — por isso "lobo lingular" não existe em laudo.',
        },
        {
          slug: 'lie',
          cor: COR.lie,
          sigla: 'LIE',
          nome: 'Lobo inferior esquerdo',
          original: 'left lower lobe',
          onde: 'Atrás da cissura oblíqua esquerda. Na PA fica largamente escondido atrás da sombra cardíaca e desce abaixo da cúpula.',
          leitura:
            'Consolidação do LIE apaga o hemidiafragma esquerdo e preserva a borda do coração. Em geral ela se manifesta como opacidade retrocardíaca — o que se vê é a densidade do coração aumentando, não uma mancha nova.',
          armadilha:
            'Numa PA subpenetrada o terço inferomedial do LIE some dentro do coração. Se o filme não permite ver os corpos vertebrais atrás da silhueta cardíaca, ele não permite excluir pneumonia do LIE.',
        },
      ],
    },
  ],
  convencoes: [
    {
      amostra: 'linha-solida',
      nome: 'Linha branca contínua',
      significado:
        'Cissura de fato visível na incidência. Nesta prancha há uma só: a cissura horizontal direita.',
    },
    {
      amostra: 'linha-tracejada',
      nome: 'Linha tracejada',
      significado:
        'Limite projetivo — a cissura existe no paciente, mas não produz linha nesta incidência. É desenho didático, não achado.',
    },
    {
      amostra: 'hachura',
      nome: 'Área hachurada',
      significado:
        'Dois lobos ocupam o mesmo ponto da imagem porque um está à frente do outro. Ali a PA não decide sozinha de que lobo é a opacidade.',
    },
  ],
  leitura: [
    {
      titulo: 'Primeiro, ache a única cissura que existe mesmo',
      paragrafos: [
        'Antes de olhar as cores, procure a cissura horizontal direita no filme limpo: uma linha fina, de espessura de fio de cabelo, que sai da região hilar direita e corre horizontalmente até a parede lateral do tórax, na altura da extremidade anterior do 4º arco costal (o que corresponde, atrás, ao 6º arco). Ela é a única fronteira lobar que a PA costuma desenhar.',
        'Isso importa por dois motivos. Primeiro, porque a posição dela é um dado: cissura elevada indica perda de volume acima dela (colapso do LSD), cissura rebaixada indica perda de volume abaixo. Segundo, porque ela é o único ponto do filme em que você pode dizer "deste lado é lobo superior, daquele lado é médio" com base no que está vendo, e não no que está lembrando.',
      ],
    },
    {
      titulo: 'Depois, entenda que o resto é projeção',
      paragrafos: [
        'Todas as outras bordas coloridas desta prancha são tracejadas de propósito. A cissura oblíqua desce obliquamente, de trás para a frente, atravessando o tórax — na PA o feixe de raios a atravessa de viés, e uma superfície atravessada de viés não produz linha, produz uma faixa de penumbra que se dilui.',
        'A consequência é a área hachurada. Onde o hachurado aparece, dois lobos se projetam um sobre o outro: à direita, médio sobre inferior; à esquerda, língula sobre inferior. Uma opacidade caindo dentro do hachurado não está localizada pela PA — está localizada pelo sinal da silhueta ou pelo perfil.',
      ],
    },
    {
      titulo: 'Por fim, olhe onde os lobos encostam',
      paragrafos: [
        'Repare em três contatos que a prancha deixa explícitos: o verde encosta na borda direita do coração, o laranja encosta na borda esquerda, e tanto o vermelho quanto o roxo encostam nas cúpulas diafragmáticas. São exatamente esses contatos que produzem o sinal da silhueta.',
        'E repare no que a prancha faz na base: o vermelho e o roxo continuam abaixo da linha da cúpula aparente. Não é erro de desenho — é o recesso costofrênico posterior, o ponto mais baixo do pulmão, que na PA fica escondido atrás do diafragma projetado.',
      ],
    },
  ],
  clinica: [
    {
      titulo: 'O sinal da silhueta, em uma frase',
      paragrafos: [
        'Duas estruturas de densidade de água só produzem uma borda visível entre si quando há ar entre elas. Se a opacidade encosta anatomicamente na borda do coração ou na cúpula, o ar desaparece dali e a borda some.',
        'Traduzindo para esta prancha: opacidade que apaga a borda cardíaca direita é do lobo médio; que apaga a borda cardíaca esquerda é da língula; que apaga a cúpula e preserva o coração é do lobo inferior. A opacidade que se sobrepõe ao coração mas deixa a borda nítida está atrás dele — lobo inferior de novo.',
      ],
    },
    {
      titulo: 'Por que a base "normal" engana',
      paragrafos: [
        'A cúpula diafragmática que você vê na PA é a projeção do ponto mais alto do diafragma, não do mais baixo. Atrás dela, o pulmão continua descendo por vários centímetros — é o recesso costofrênico posterior, território do segmento basal posterior.',
        'É por isso que um derrame pleural pequeno pode não velar o seio costofrênico lateral na PA e ainda assim ser evidente no perfil, e por isso que uma pneumonia basal posterior pode se apresentar como um leve aumento de densidade sobre o abdome superior, sem nenhuma opacidade franca no campo pulmonar.',
      ],
    },
  ],
  armadilhas: [
    'Assumir que a linha horizontal vista à esquerda é uma "cissura horizontal esquerda". Ela não existe: à esquerda há apenas a oblíqua.',
    'Localizar por altura em vez de por profundidade. Uma opacidade "no terço médio" pode ser do LSD, do LM ou do LID — a altura na PA não diz o lobo.',
    'Interpretar o desenho tracejado como se fosse achado. O tracejado é o que a incidência não mostra; se você "vê" a cissura oblíqua na PA, provavelmente está vendo uma cissura acessória ou uma linha pleural.',
    'Parar na primeira alteração. As áreas hachuradas escondem uma segunda lesão atrás da primeira com frequência maior do que parece.',
  ],
  limites: [
    'A PA não separa anterior de posterior: por isso metade da prancha é tracejada e hachurada.',
    'Ela não mostra os limites intersegmentares — segmento é assunto da Figura 3 e, na prática, da tomografia.',
    'A projeção é de um tórax adulto em inspiração adequada; em filme expirado ou em AP de leito, todas essas fronteiras sobem e se distorcem.',
  ],
  checagem: [
    {
      pergunta:
        'Opacidade no terço inferior do hemitórax direito que apaga a borda do coração mas deixa a cúpula nítida. Qual lobo?',
      resposta:
        'Lobo médio. O contato pleural do LM é com o átrio direito; a cúpula preservada exclui o lobo inferior.',
    },
    {
      pergunta: 'A mesma opacidade, agora apagando a cúpula e preservando a borda cardíaca.',
      resposta:
        'Lobo inferior direito. Ele encosta no diafragma e está atrás do coração, não ao lado dele.',
    },
    {
      pergunta: 'Por que a cissura oblíqua não aparece como linha na PA?',
      resposta:
        'Porque o feixe a atravessa obliquamente. Só produz linha a interface tangenciada pelo raio — que é o caso da cissura horizontal direita, aproximadamente perpendicular ao feixe.',
    },
    {
      pergunta: 'Qual é o ponto mais baixo do pulmão, e ele aparece na PA?',
      resposta:
        'O recesso costofrênico posterior. Na PA ele fica escondido atrás da cúpula projetada — quem o mostra é o perfil.',
    },
  ],
  relacionadas: ['lobos-perfil', 'segmentos-pa'],
}

/* ────────────────── Figura 2 — Lobos, incidência perfil ────────────────── */

const LOBOS_PERFIL: PranchaRadiologica = {
  slug: 'lobos-perfil',
  figura: 2,
  tema: 'lobos',
  temaTitulo: 'Lobos pulmonares',
  incidencia: 'Perfil',
  titulo: 'Lobos pulmonares em perfil',
  subtitulo: 'A única incidência que mostra as cissuras de perfil verdadeiro',
  resumo:
    'Um painel por pulmão, com a cissura oblíqua descendo de T4–T5 até o diafragma anterior e a regra que resolve quase todo caso: médio e língula à frente, inferiores atrás.',
  imagem: `${RAIZ}/lobos-perfil.png`,
  imagemLimpa: FILME_LIMPO.Perfil,
  altImagem:
    'Radiografia de tórax em perfil, em dois painéis: à esquerda o pulmão direito com lobo superior azul, médio verde e inferior vermelho; à direita o pulmão esquerdo com lobo superior amarelo, língula laranja e lobo inferior roxo',
  altImagemLimpa: ALT_LIMPO.Perfil,
  largura: 1122,
  altura: 1402,
  legenda:
    'Figura 2. Lobos pulmonares em incidência lateral. Painel A, pulmão direito; painel B, pulmão esquerdo (o contralateral permanece em cinza). O perfil é a única incidência em que as cissuras são vistas de perfil verdadeiro. A cissura oblíqua parte de T4–T5, posteriormente, e desce para baixo e para frente até o diafragma anterior, separando o compartimento anterior do posterior. À direita, a cissura horizontal sai do ponto médio da oblíqua em direção ao esterno, delimitando a cunha do lobo médio. A regra prática que resolve quase todo caso: lobo médio e língula são ANTERIORES; lobos inferiores são POSTERIORES. Por isso uma opacidade retroesternal é do lobo médio/língula, e uma opacidade retrocardíaca ou sobre as vértebras baixas (perda do sinal da coluna, que normalmente escurece de cima para baixo) é do lobo inferior. Note ainda que o ponto mais baixo do pulmão é o recesso costofrênico posterior, território do segmento basal posterior.',
  grupos: [
    {
      id: 'painel-a',
      titulo: 'Painel A — pulmão direito',
      sigla: 'A',
      cor: COR.lsd,
      nota: 'As duas cissuras aparecem: a oblíqua, que desce de trás para a frente, e a horizontal, que sai do meio dela rumo ao esterno.',
      itens: [
        {
          slug: 'lsd-perfil',
          cor: COR.lsd,
          sigla: 'LSD',
          nome: 'Lobo superior direito',
          original: 'right upper lobe',
          onde: 'Ocupa o ápice e o compartimento anterossuperior, acima da cissura horizontal e à frente da oblíqua.',
          leitura:
            'É ele que preenche o espaço claro retroesternal alto. Uma opacidade que reduz esse espaço claro, sem tocar o diafragma, é do LSD — e no colapso ele se retrai para cima e para a frente, contra o ápice e o esterno.',
          armadilha:
            'Confundir a redução do espaço retroesternal por massa mediastinal anterior (timo, linfonodo, teratoma) com doença do LSD. A massa mediastinal desloca a linha da pleura; o LSD colapsado a acompanha.',
        },
        {
          slug: 'lm-perfil',
          cor: COR.lm,
          sigla: 'LM',
          nome: 'Lobo médio',
          original: 'right middle lobe',
          onde: 'Cunha anterior estreita, entre a horizontal (acima) e a oblíqua (atrás), apontando para o esterno e para o seio costofrênico anterior.',
          leitura:
            'Aqui a atelectasia do lobo médio — que na PA era só um borramento da borda cardíaca — se torna óbvia: uma faixa triangular densa, de vértice hilar e base anterior, sobre a silhueta do coração. O perfil é o exame que fecha o diagnóstico da síndrome do lobo médio.',
          armadilha:
            'Procurar o lobo médio no meio do filme. Ele é anterior e baixo, não central: quem procura "no meio" acaba olhando o lobo inferior.',
        },
        {
          slug: 'lid-perfil',
          cor: COR.lid,
          sigla: 'LID',
          nome: 'Lobo inferior direito',
          original: 'right lower lobe',
          onde: 'Todo o compartimento posterior atrás da cissura oblíqua, descendo até o recesso costofrênico posterior — o ponto mais baixo do filme.',
          leitura:
            'É o território do sinal da coluna: numa lateral normal, as vértebras torácicas ficam progressivamente mais escuras de cima para baixo, porque há cada vez mais pulmão aerado à frente delas. Consolidação do lobo inferior inverte isso — as vértebras baixas ficam mais brancas que as altas.',
          armadilha:
            'Ler o seio costofrênico posterior como "recesso obliterado" quando na verdade a paciente está com o braço mal posicionado. Antes de chamar de derrame, confirme que o ângulo está livre nos dois filmes.',
        },
      ],
    },
    {
      id: 'painel-b',
      titulo: 'Painel B — pulmão esquerdo',
      sigla: 'B',
      cor: COR.lse,
      nota: 'Uma cissura só. A língula ocupa, à frente, o lugar que o lobo médio ocupa do outro lado.',
      itens: [
        {
          slug: 'lse-perfil',
          cor: COR.lse,
          sigla: 'LSE',
          nome: 'Lobo superior esquerdo',
          original: 'left upper lobe',
          onde: 'Todo o compartimento anterior e superior à frente da cissura oblíqua, do ápice até a língula.',
          leitura:
            'No perfil, o LSE é uma faixa contínua que vai do ápice ao seio anterior — não há cissura horizontal para recortá-lo. É essa continuidade que explica por que o colapso do LSE se manifesta como véu difuso, e não como triângulo denso.',
          armadilha:
            'Esperar uma cunha lingular separada por linha própria. Salvo cissura acessória, o limite entre língula e o restante do LSE é anatômico, não radiográfico.',
        },
        {
          slug: 'lingula-perfil',
          cor: COR.lingula,
          sigla: 'Língula',
          nome: 'Língula (porção do LSE)',
          original: 'lingula of the left upper lobe',
          onde: 'Porção inferoanterior do amarelo, destacada em laranja, ocupando o espaço retroesternal baixo.',
          leitura:
            'Anterior, como o lobo médio. É a razão pela qual uma opacidade retroesternal baixa à esquerda é lingular — e nunca do lobo inferior esquerdo, que está atrás.',
          armadilha:
            'Atribuir ao lobo inferior esquerdo uma opacidade que se projeta sobre o coração no perfil. Sobre o coração, no perfil, é anterior; atrás do coração é que é lobo inferior.',
        },
        {
          slug: 'lie-perfil',
          cor: COR.lie,
          sigla: 'LIE',
          nome: 'Lobo inferior esquerdo',
          original: 'left lower lobe',
          onde: 'Compartimento posterior, atrás da cissura oblíqua esquerda, descendo até o recesso posterior.',
          leitura:
            'Território retrocardíaco por excelência. É o lobo que a PA esconde e o perfil revela — e é aqui que o sinal da coluna presta o maior serviço, porque a consolidação retrocardíaca à esquerda quase não muda a PA.',
          armadilha:
            'Ler as duas cúpulas como se fossem uma. No perfil, a cúpula esquerda é a que se interrompe ao encontrar a silhueta cardíaca; a direita atravessa o filme inteiro. Trocar as duas troca o lado da lesão.',
        },
      ],
    },
  ],
  convencoes: [
    {
      amostra: 'linha-solida',
      nome: 'Linha branca contínua',
      significado:
        'Cissura oblíqua e cissura horizontal, agora tangenciadas pelo feixe e por isso visíveis como linha verdadeira.',
    },
    {
      amostra: 'fantasma',
      nome: 'Pulmão em cinza',
      significado:
        'O pulmão contralateral, deixado sem cor em cada painel. No filme real os dois estão sobrepostos — a separação aqui é didática.',
    },
    {
      amostra: 'seta',
      nome: '← ANT / POST →',
      significado:
        'Orientação do painel. Tudo à esquerda da imagem é anterior (esterno); tudo à direita é posterior (coluna).',
    },
  ],
  leitura: [
    {
      titulo: 'Trace a oblíqua antes de qualquer coisa',
      paragrafos: [
        'A cissura oblíqua começa atrás, na altura de T4–T5, e desce para baixo e para a frente até alcançar o diafragma perto da junção esternodiafragmática. Ela é a linha que divide o tórax em dois compartimentos: à frente dela, lobo superior (e médio/língula); atrás dela, lobo inferior.',
        'Como as duas cissuras oblíquas — direita e esquerda — não são exatamente sobrepostas, num perfil real você costuma ver duas linhas finas ligeiramente divergentes. A da esquerda é habitualmente mais posterior e mais vertical; a da direita, mais anterior.',
      ],
    },
    {
      titulo: 'À direita, acrescente a horizontal',
      paragrafos: [
        'A cissura horizontal sai aproximadamente do ponto médio da oblíqua direita e segue para a frente, em direção ao esterno. O que ela recorta é a cunha do lobo médio: um triângulo de vértice posterior (hilar) e base anterior.',
        'É por isso que o lobo médio só tem tamanho no perfil. Na PA ele é uma faixa; aqui ele tem forma, e a forma é o que permite reconhecer a atelectasia.',
      ],
    },
    {
      titulo: 'Use os dois espaços claros como termômetro',
      paragrafos: [
        'O perfil normal tem duas janelas escuras: o espaço retroesternal (entre o esterno e o coração/aorta ascendente) e o espaço retrocardíaco (entre o coração e a coluna, acima do diafragma). Um está no compartimento anterior, o outro no posterior.',
        'Retroesternal opacificado aponta para lobo médio, língula, LSD/LSE anteriores ou massa mediastinal anterior. Retrocardíaco opacificado aponta para lobo inferior, hérnia hiatal, massa mediastinal posterior ou derrame. Ler os dois separadamente é o que transforma o perfil de "filme confuso" em ferramenta.',
      ],
    },
    {
      titulo: 'Fecha com o sinal da coluna',
      paragrafos: [
        'Percorra as vértebras torácicas de cima para baixo. Numa lateral normal elas escurecem progressivamente, porque há cada vez mais pulmão aerado projetado à frente delas e cada vez menos massa muscular da cintura escapular.',
        'Quando as vértebras baixas ficam mais brancas que as altas, alguma coisa densa está projetada sobre elas: consolidação do lobo inferior, derrame pleural posterior ou massa. É um sinal barato e sensível, e a Figura 2 mostra exatamente por que ele funciona — o lobo inferior é justamente o que está à frente das vértebras baixas.',
      ],
    },
  ],
  clinica: [
    {
      titulo: 'A regra que resolve quase todo caso',
      paragrafos: [
        'Lobo médio e língula são anteriores. Lobos inferiores são posteriores. Com essa única frase e um perfil, você localiza a maioria das consolidações sem recorrer à tomografia.',
        'Ela também explica o par de sinais que você já usa na PA: o que apaga a borda do coração é anterior (está encostado nele), o que preserva a borda mas se projeta sobre ela é posterior. O perfil não acrescenta uma regra nova — ele mostra a geometria de onde a regra saiu.',
      ],
    },
    {
      titulo: 'Por que pedir o perfil ainda vale a pena',
      paragrafos: [
        'O perfil recupera três territórios que a PA perde: o retrocardíaco, o retroesternal e a base posterior abaixo da cúpula projetada. São exatamente as regiões onde nódulos e consolidações passam despercebidos numa PA isolada.',
        'Em serviço, isso costuma se traduzir em uma decisão simples: PA duvidosa com clínica compatível — some o perfil antes de pensar em tomografia.',
      ],
    },
  ],
  armadilhas: [
    'Tratar o perfil como "a PA de lado". As estruturas dos dois pulmões estão somadas no mesmo plano; a separação em dois painéis desta prancha é didática, não real.',
    'Localizar pelo lado do filme. No perfil, direito e esquerdo se sobrepõem — quem lateraliza é a PA, ou a comparação das cúpulas e das costelas (as do lado próximo ao filme aparecem menores e mais nítidas).',
    'Esquecer que a cissura oblíqua é oblíqua também no plano axial. Ela não é um plano sagital: uma opacidade "posterior" no perfil pode ser lateral no corte de tomografia.',
    'Considerar o seio costofrênico posterior obliterado sem checar a PA. Ele é o ponto mais baixo e o primeiro a acumular líquido, mas também o primeiro a ser cortado por técnica ruim.',
  ],
  limites: [
    'O perfil não lateraliza: sem a PA, você sabe a profundidade da lesão, não o lado.',
    'As cunhas segmentares só aparecem parcialmente — S4 e S5 se sobrepõem, e o S7 direito não se individualiza (ver Figura 4).',
    'Em paciente que não consegue erguer os braços, a sobreposição dos úmeros arruína justamente o compartimento anterior.',
  ],
  checagem: [
    {
      pergunta: 'Opacidade retroesternal baixa, à esquerda, no perfil. De onde é?',
      resposta:
        'Da língula. O compartimento anterior baixo à esquerda é dela; o lobo inferior esquerdo está atrás da cissura oblíqua.',
    },
    {
      pergunta: 'As vértebras torácicas baixas estão mais brancas que as altas. O que isso significa?',
      resposta:
        'Perda do sinal da coluna: há densidade projetada à frente delas — consolidação de lobo inferior, derrame posterior ou massa. Numa lateral normal a coluna escurece de cima para baixo.',
    },
    {
      pergunta: 'De onde parte e para onde vai a cissura oblíqua?',
      resposta:
        'De T4–T5, posteriormente, para baixo e para a frente, até o diafragma anterior. Ela separa o compartimento anterior do posterior.',
    },
    {
      pergunta: 'Um triângulo denso de base anterior, sobre a silhueta cardíaca, no perfil direito.',
      resposta:
        'Atelectasia do lobo médio. Na PA correspondente, a única pista costuma ser o borramento da borda cardíaca direita.',
    },
  ],
  relacionadas: ['lobos-pa', 'segmentos-perfil'],
}

/* ───────────────── Figura 3 — Segmentos, incidência PA ───────────────── */

const SEGMENTOS_PA: PranchaRadiologica = {
  slug: 'segmentos-pa',
  figura: 3,
  tema: 'segmentos',
  temaTitulo: 'Segmentos broncopulmonares',
  incidencia: 'PA',
  titulo: 'Segmentos broncopulmonares em PA',
  subtitulo: 'Dez à direita, oito à esquerda — e a sobreposição que a PA não resolve',
  resumo:
    'Os 18 segmentos pintados na família cromática do lobo de origem, com a fusão de S1+2 e S7+8 à esquerda e as áreas em que a projeção some com a fronteira.',
  imagem: `${RAIZ}/segmentos-pa.png`,
  imagemLimpa: FILME_LIMPO.PA,
  altImagem:
    'Radiografia de tórax em PA com os segmentos broncopulmonares pintados em tons da cor de cada lobo: azuis no lobo superior direito, verdes no médio, vermelhos no inferior direito, amarelos e laranjas no superior esquerdo e roxos no inferior esquerdo',
  altImagemLimpa: ALT_LIMPO.PA,
  largura: 1122,
  altura: 1402,
  legenda:
    'Figura 3. Segmentos broncopulmonares em incidência PA. Cada segmento é uma unidade anatômica e cirúrgica independente, com brônquio, artéria e drenagem próprios — o que permite a segmentectomia. São 10 à direita e 8 à esquerda, a diferença decorrendo da fusão de S1+2 (apicoposterior) e S7+8 (basal anteromedial) no pulmão esquerdo. As cores seguem a família cromática do lobo de origem, para evidenciar a hierarquia lobo → segmento. Dois segmentos merecem atenção: S6 (segmento superior do lobo inferior), que é a porção mais alta do lobo inferior e se projeta na região infra-hilar — sítio clássico de pneumonia aspirativa no paciente em decúbito dorsal; e S1/S2 apicoposteriores, sítio preferencial da tuberculose pós-primária. Como a PA comprime toda a profundidade torácica em um plano, a sobreposição segmentar é intensa (áreas hachuradas): a localização segmentar precisa exige correlação com o perfil ou com a TC.',
  grupos: [
    {
      id: 'lsd',
      titulo: 'Lobo superior direito',
      sigla: 'LSD',
      cor: COR.lsd,
      nota: 'Três segmentos: um para cima, um para trás, um para a frente.',
      itens: [
        {
          slug: 's1-lsd',
          cor: '#1d4699',
          sigla: 'S1',
          nome: 'Apical',
          original: 'apical segment',
          onde: 'Cúpula do hemitórax direito, acima da clavícula.',
          leitura:
            'Junto com o S2, forma o par apicoposterior — sítio preferencial da tuberculose pós-primária, por ser a região de maior tensão de oxigênio e menor clearance linfático do pulmão.',
          armadilha:
            'Projeta-se atrás da clavícula e da 1ª costela. Uma cavidade pequena aqui é confundida com a sobreposição dos arcos; a incidência apicolordótica existe justamente para resolver isso.',
        },
        {
          slug: 's2-lsd',
          cor: '#2158c7',
          sigla: 'S2',
          nome: 'Posterior',
          original: 'posterior segment',
          onde: 'Metade posterolateral do lobo superior direito.',
          leitura:
            'Território dependente do paciente que aspira deitado de costas — o conteúdo escorre pelo brônquio do lobo superior direito para trás. Também é o outro sítio clássico da tuberculose pós-primária.',
          armadilha:
            'Na PA o S2 se projeta exatamente sobre o S3. A distinção entre "anterior" e "posterior" no lobo superior é impossível sem o perfil.',
        },
        {
          slug: 's3-lsd',
          cor: '#80b3ee',
          sigla: 'S3',
          nome: 'Anterior',
          original: 'anterior segment',
          onde: 'Metade anteromedial do lobo superior direito, projetando-se sobre o mediastino superior.',
          leitura:
            'É o segmento que ocupa o espaço claro retroesternal alto no perfil. Consolidação dele apaga a linha paratraqueal direita.',
        },
      ],
    },
    {
      id: 'lm',
      titulo: 'Lobo médio',
      sigla: 'LM',
      cor: COR.lm,
      nota: 'Dois segmentos, ambos anteriores: um para fora, um para dentro.',
      itens: [
        {
          slug: 's4-lm',
          cor: '#166d2a',
          sigla: 'S4',
          nome: 'Lateral',
          original: 'lateral segment',
          onde: 'Porção externa da cunha verde, encostada na parede lateral do tórax.',
          leitura:
            'É o segmento que a PA separa bem — porque na PA lateral e medial estão lado a lado, e não um atrás do outro. A PA é a incidência que individualiza S4 e S5.',
        },
        {
          slug: 's5-lm',
          cor: '#52b35f',
          sigla: 'S5',
          nome: 'Medial',
          original: 'medial segment',
          onde: 'Porção interna da cunha verde, encostada na borda direita do coração.',
          leitura:
            'É o S5 que faz o contato pleural com o átrio direito. Quando se diz que "o lobo médio apaga a borda cardíaca direita", o segmento responsável é este.',
          armadilha:
            'Uma consolidação de S5 pequena pode apagar só um trecho da borda cardíaca. Silhueta parcialmente perdida é silhueta perdida.',
        },
      ],
    },
    {
      id: 'lid',
      titulo: 'Lobo inferior direito',
      sigla: 'LID',
      cor: COR.lid,
      nota: 'Cinco segmentos: o superior (S6) e a coroa dos quatro basais.',
      itens: [
        {
          slug: 's6-lid',
          cor: '#c5231b',
          sigla: 'S6',
          nome: 'Superior (de Fowler)',
          original: 'superior segment',
          onde: 'Região infra-hilar direita — a porção mais alta do lobo inferior, projetada na altura do hilo.',
          leitura:
            'O segmento mais importante da prancha na prática de enfermaria. Seu brônquio sai posteriormente, logo abaixo da carina: no paciente em decúbito dorsal, o que é aspirado cai nele. Pneumonia aspirativa e abscesso de aspiração começam aqui.',
          armadilha:
            'Como se projeta na altura do hilo, uma consolidação de S6 é lida como "aumento hilar" ou "processo do lobo superior". A altura na PA não diz o lobo — S6 é lobo inferior, apesar de alto.',
        },
        {
          slug: 's7-lid',
          cor: '#e96f61',
          sigla: 'S7',
          nome: 'Basal medial',
          original: 'medial basal segment',
          onde: 'Base, junto ao coração e à coluna — a porção mais interna e profunda dos basais.',
          leitura:
            'É o único basal que faz contato com o mediastino inferior. À esquerda ele não existe isolado: funde-se ao S8 no S7+8.',
          armadilha:
            'Praticamente indistinguível numa radiografia simples; no perfil não se individualiza. Quando o laudo precisa de segmento medial basal, o exame é tomografia.',
        },
        {
          slug: 's8-lid',
          cor: '#dd3824',
          sigla: 'S8',
          nome: 'Basal anterior',
          original: 'anterior basal segment',
          onde: 'Base, à frente, acima do seio costofrênico anterior.',
          leitura:
            'Territóro dependente do paciente sentado ou semi-sentado, junto com S9 e S10. É onde a pneumonia aspirativa do paciente acamado com cabeceira elevada tende a se instalar.',
        },
        {
          slug: 's9-lid',
          cor: '#dd6f6b',
          sigla: 'S9',
          nome: 'Basal lateral',
          original: 'lateral basal segment',
          onde: 'Base, contra a parede lateral do tórax, sobre o seio costofrênico lateral.',
          leitura:
            'É o basal que a PA mostra melhor, porque encosta na parede lateral e produz interface com ar. Consolidação aqui apaga o ângulo costofrênico lateral.',
        },
        {
          slug: 's10-lid',
          cor: '#951f1a',
          sigla: 'S10',
          nome: 'Basal posterior',
          original: 'posterior basal segment',
          onde: 'A porção mais baixa e mais posterior do pulmão, projetada abaixo da cúpula aparente.',
          leitura:
            'Ocupa o recesso costofrênico posterior. Como está atrás do diafragma projetado, uma consolidação inteira do S10 pode aparecer na PA apenas como um leve aumento de densidade sobre o hipocôndrio.',
          armadilha:
            'Confundir com opacidade abdominal ou com "diafragma elevado". Se a densidade tem broncograma aéreo, é pulmão, não fígado.',
        },
      ],
    },
    {
      id: 'lse',
      titulo: 'Lobo superior esquerdo',
      sigla: 'LSE',
      cor: COR.lse,
      nota: 'Quatro segmentos: S1 e S2 fundidos em um só, mais o anterior e os dois lingulares.',
      itens: [
        {
          slug: 's1-2-lse',
          cor: '#ca9405',
          sigla: 'S1+2',
          nome: 'Apicoposterior',
          original: 'apicoposterior segment',
          onde: 'Ápice esquerdo e sua porção posterior, em bloco.',
          leitura:
            'A fusão é a razão pela qual o pulmão esquerdo tem 8 segmentos e não 10: à esquerda, apical e posterior nascem de um tronco brônquico único. O sítio da tuberculose pós-primária é este, do lado esquerdo.',
        },
        {
          slug: 's3-lse',
          cor: '#fac106',
          sigla: 'S3',
          nome: 'Anterior',
          original: 'anterior segment',
          onde: 'Porção anterior do lobo superior esquerdo, sobre o mediastino superior.',
          leitura:
            'Espelho do S3 direito: ocupa o espaço retroesternal alto e faz contorno com o botão aórtico.',
        },
        {
          slug: 's4-lse',
          cor: '#e97b12',
          sigla: 'S4',
          nome: 'Lingular superior',
          original: 'superior lingular segment',
          onde: 'Metade superior da língula, sobre a borda esquerda do coração.',
          leitura:
            'Junto com o S5 lingular, é o equivalente esquerdo do lobo médio — anterior e em contato com o coração.',
        },
        {
          slug: 's5-lse',
          cor: '#f7b85c',
          sigla: 'S5',
          nome: 'Lingular inferior',
          original: 'inferior lingular segment',
          onde: 'Metade inferior da língula, descendo até o seio costofrênico anterior esquerdo.',
          leitura:
            'É o segmento que apaga a borda cardíaca esquerda. O equivalente funcional exato do S5 medial do lobo médio.',
          armadilha:
            'Numerar os lingulares como se fossem um "lobo lingular" com segmentos próprios. Eles são S4 e S5 do lobo superior esquerdo.',
        },
      ],
    },
    {
      id: 'lie',
      titulo: 'Lobo inferior esquerdo',
      sigla: 'LIE',
      cor: COR.lie,
      nota: 'Quatro segmentos: o superior e três basais, com o anterior e o medial fundidos.',
      itens: [
        {
          slug: 's6-lie',
          cor: '#4f1b5e',
          sigla: 'S6',
          nome: 'Superior',
          original: 'superior segment',
          onde: 'Região infra-hilar esquerda, a porção mais alta do lobo inferior esquerdo.',
          leitura:
            'Mesmo papel do S6 direito: território dependente do decúbito dorsal e sítio de aspiração. Do lado esquerdo ele fica ainda mais escondido, porque se projeta sobre o coração.',
          armadilha:
            'Numa PA de qualidade média, uma consolidação do S6 esquerdo desaparece dentro da sombra cardíaca. É um dos motivos para pedir o perfil.',
        },
        {
          slug: 's7-8-lie',
          cor: '#6c277b',
          sigla: 'S7+8',
          nome: 'Basal anteromedial',
          original: 'anteromedial basal segment',
          onde: 'Base esquerda, à frente e junto ao coração.',
          leitura:
            'A segunda fusão do pulmão esquerdo: como o coração ocupa o espaço medial, o basal medial e o basal anterior compartilham um tronco brônquico.',
        },
        {
          slug: 's9-lie',
          cor: '#854692',
          sigla: 'S9',
          nome: 'Basal lateral',
          original: 'lateral basal segment',
          onde: 'Base esquerda, contra a parede lateral, sobre o seio costofrênico.',
          leitura: 'Espelho do S9 direito — o basal mais bem demonstrado pela PA.',
        },
        {
          slug: 's10-lie',
          cor: '#572364',
          sigla: 'S10',
          nome: 'Basal posterior',
          original: 'posterior basal segment',
          onde: 'Recesso costofrênico posterior esquerdo, abaixo da cúpula aparente.',
          leitura:
            'Ponto mais baixo do pulmão esquerdo. Junto com o S10 direito, é onde o líquido e o conteúdo aspirado se acumulam no paciente em decúbito.',
        },
      ],
    },
  ],
  convencoes: [
    {
      amostra: 'linha-tracejada',
      nome: 'Linha tracejada',
      significado:
        'Fronteira intersegmentar. Nenhuma delas é visível numa radiografia real: não há pleura entre segmentos, só entre lobos.',
    },
    {
      amostra: 'hachura',
      nome: 'Área hachurada',
      significado:
        'Segmentos que se projetam um sobre o outro na PA. É a maior parte do pulmão — a PA comprime toda a profundidade do tórax em um plano.',
    },
    {
      amostra: 'linha-solida',
      nome: 'Linha branca contínua',
      significado: 'Cissura horizontal direita, a única fronteira real que a PA desenha.',
    },
  ],
  leitura: [
    {
      titulo: 'A cor diz o lobo; o tom diz o segmento',
      paragrafos: [
        'Cada segmento herda a cor do lobo de origem e recebe um tom próprio dentro dessa família. Isso é deliberado: a primeira coisa que você precisa saber diante de uma opacidade é o lobo, e só depois o segmento.',
        'Percorra a prancha primeiro por famílias — azuis, verdes, vermelhos, amarelos/laranjas, roxos. Só depois entre nos tons. Quem tenta decorar 18 manchas de uma vez não fixa nenhuma.',
      ],
    },
    {
      titulo: 'A numeração não é arbitrária',
      paragrafos: [
        'A sequência de Jackson–Huber/Boyden segue o brônquio: S1 a S3 são os ramos do lobo superior (apical, posterior, anterior); S4 e S5 são os do lobo médio ou da língula (lateral e medial, superior e inferior); S6 é o primeiro ramo do lobo inferior, e S7 a S10 são a coroa basal (medial, anterior, lateral, posterior).',
        'Se você guardar essa ordem — apical, posterior, anterior · lateral, medial · superior, e os basais medial → anterior → lateral → posterior — a numeração dos dois pulmões sai sozinha, e as duas fusões da esquerda passam a ser exceções compreensíveis, não itens de memorização.',
      ],
    },
    {
      titulo: 'Por que a esquerda tem oito',
      paragrafos: [
        'O coração ocupa espaço no hemitórax esquerdo, e a árvore brônquica esquerda se adapta a isso. Duas fusões acontecem: apical com posterior (S1+2, apicoposterior) e basal medial com basal anterior (S7+8, anteromedial).',
        'Note que o pulmão esquerdo não perde território — ele perde troncos brônquicos independentes. É por isso que a contagem cirúrgica muda, mas a superfície pintada continua cobrindo o pulmão inteiro.',
      ],
    },
    {
      titulo: 'Onde a PA ainda decide sozinha',
      paragrafos: [
        'Apesar da sobreposição, a PA continua sendo a melhor incidência para dois pares: S4 versus S5 do lobo médio (lateral versus medial estão lado a lado, e não um atrás do outro) e S9 versus S7 dos basais.',
        'Guarde isso como o complemento exato da Figura 4: o que a PA separa, o perfil funde — e vice-versa. As duas incidências não são redundantes, são ortogonais.',
      ],
    },
  ],
  clinica: [
    {
      titulo: 'Segmento é unidade cirúrgica',
      paragrafos: [
        'Cada segmento tem brônquio e artéria próprios e é envolvido por tecido conjuntivo; as veias correm entre segmentos, e não dentro deles. É essa independência que permite ressecar um segmento preservando os vizinhos — a segmentectomia.',
        'Por isso a linguagem do laudo importa: dizer "opacidade no lobo inferior direito" e dizer "consolidação do segmento basal posterior direito" são informações de valor cirúrgico diferente. Quando a decisão é de ressecção, o segmento é o que o cirurgião precisa.',
      ],
    },
    {
      titulo: 'A gravidade escolhe o segmento',
      paragrafos: [
        'A distribuição de uma pneumonia aspirativa é previsível pela posição do paciente no momento da aspiração. Deitado de costas — a situação do paciente internado, sedado ou com rebaixamento — os territórios dependentes são os posteriores: S2 (posterior do lobo superior) e S6 (superior do lobo inferior). Em pé ou sentado, o conteúdo desce mais, e os atingidos são os basais: S8, S9 e S10.',
        'Em decúbito lateral, os dependentes passam a ser os segmentos laterais (axilares) do pulmão que está por baixo. Em qualquer dos casos, o raciocínio é o mesmo: pergunte em que posição o paciente estava, e a prancha já indica onde procurar.',
      ],
    },
    {
      titulo: 'A tuberculose também tem endereço',
      paragrafos: [
        'A tuberculose pós-primária tem predileção pelos segmentos apical e posterior dos lobos superiores (S1 e S2 à direita, S1+2 à esquerda) e pelo segmento superior dos lobos inferiores (S6).',
        'A explicação clássica combina maior tensão de oxigênio no ápice com drenagem linfática relativamente pobre. Para a leitura do filme, o que importa é o hábito: diante de cavitação, olhe primeiro esses endereços.',
      ],
    },
  ],
  armadilhas: [
    'Tentar dar segmento a partir da PA isolada. Fora dos poucos pares que a PA separa, a localização segmentar exige perfil ou tomografia.',
    'Ler o S6 como lobo superior porque ele é alto. S6 é o segmento mais alto do lobo inferior — a altura na PA não define o lobo.',
    'Assumir simetria entre os pulmões. À esquerda não há S1, S2 nem S7 isolados; há S1+2 e S7+8.',
    'Esperar que a fronteira intersegmentar apareça no filme. Não há pleura entre segmentos — todo tracejado desta prancha é esquema.',
  ],
  limites: [
    'A PA sobrepõe anterior e posterior: por isso a hachura cobre boa parte da imagem.',
    'A prancha usa um tórax adulto padrão; variações anatômicas (segmento acessório, cissuras acessórias) não estão representadas.',
    'Nomenclatura de Jackson–Huber/Boyden. Outras escolas numeram e agrupam de modo ligeiramente diferente.',
  ],
  checagem: [
    {
      pergunta: 'Por que o pulmão esquerdo tem 8 segmentos?',
      resposta:
        'Por duas fusões brônquicas: S1+2 (apicoposterior) e S7+8 (basal anteromedial). O território não some — somem dois troncos independentes.',
    },
    {
      pergunta: 'Paciente sedado, deitado de costas, com pneumonia aspirativa. Onde procurar primeiro?',
      resposta:
        'Nos territórios dependentes do decúbito dorsal: S6 (superior do lobo inferior) e S2 (posterior do lobo superior).',
    },
    {
      pergunta: 'Cavitação em ápice pulmonar. Qual a hipótese e qual o segmento?',
      resposta:
        'Tuberculose pós-primária, nos segmentos apical e posterior do lobo superior (S1/S2 à direita, S1+2 à esquerda) ou no S6.',
    },
    {
      pergunta: 'O que permite a segmentectomia?',
      resposta:
        'Cada segmento tem brônquio e artéria próprios, com as veias correndo entre segmentos. Essa independência vascular e brônquica é o que torna a ressecção isolada possível.',
    },
  ],
  relacionadas: ['segmentos-perfil', 'lobos-pa'],
}

/* ──────────────── Figura 4 — Segmentos, incidência perfil ──────────────── */

const SEGMENTOS_PERFIL: PranchaRadiologica = {
  slug: 'segmentos-perfil',
  figura: 4,
  tema: 'segmentos',
  temaTitulo: 'Segmentos broncopulmonares',
  incidencia: 'Perfil',
  titulo: 'Segmentos broncopulmonares em perfil',
  subtitulo: 'A distribuição anteroposterior — e as duas coisas que o perfil não separa',
  resumo:
    'Um painel por pulmão: S3 e a cunha anterior contra o esterno, S2–S6–S10 empilhados contra a coluna, mais os dois limites declarados da incidência.',
  imagem: `${RAIZ}/segmentos-perfil.png`,
  imagemLimpa: FILME_LIMPO.Perfil,
  altImagem:
    'Radiografia de tórax em perfil em dois painéis, com os dez segmentos do pulmão direito e os oito do esquerdo pintados em tons da cor de cada lobo',
  altImagemLimpa: ALT_LIMPO.Perfil,
  largura: 1122,
  altura: 1402,
  legenda:
    'Figura 4. Segmentos broncopulmonares em incidência lateral. Painel A, pulmão direito (10 segmentos); painel B, pulmão esquerdo (8 segmentos). O perfil é a incidência que melhor demonstra a distribuição anteroposterior dos segmentos: S3 e a cunha do lobo médio/língula ocupam o espaço retroesternal, enquanto S2, S6 e S10 se alinham contra a coluna torácica, de cima para baixo. Essa disposição tem valor prático direto — S6 e o basal posterior (S10) são os territórios dependentes no decúbito dorsal, junto com o S2, posterior do lobo superior; no decúbito lateral, os dependentes passam a ser os segmentos laterais (axilares) do pulmão de baixo. Duas limitações estão explicitadas na figura: S4 e S5 ocupam a mesma cunha anterior e não se separam no perfil (só na PA ou na TC), e o S7 direito é medial e profundo demais para ser individualizado. Nomenclatura de Jackson–Huber/Boyden.',
  grupos: [
    {
      id: 'painel-a',
      titulo: 'Painel A — pulmão direito',
      sigla: '10 segmentos',
      cor: COR.lsd,
      nota: 'S4 e S5 aparecem juntos, hachurados; o S7 vem em tracejado, porque a incidência não o individualiza.',
      itens: [
        {
          slug: 's1-perfil',
          cor: '#003a8f',
          sigla: 'S1',
          nome: 'Apical (LSD)',
          original: 'apical segment',
          onde: 'Ápice do painel, no alto.',
          leitura: 'No perfil o S1 é o teto: tudo o que estiver acima da cissura oblíqua e no topo é dele.',
        },
        {
          slug: 's2-perfil',
          cor: '#3283ea',
          sigla: 'S2',
          nome: 'Posterior (LSD)',
          original: 'posterior segment',
          onde: 'Contra a coluna, na parte alta — o primeiro da coluna S2 → S6 → S10.',
          leitura:
            'É aqui que o perfil ganha da PA: anterior e posterior, que na PA estavam sobrepostos, agora estão em lados opostos do filme.',
        },
        {
          slug: 's3-perfil',
          cor: '#8fbffb',
          sigla: 'S3',
          nome: 'Anterior (LSD)',
          original: 'anterior segment',
          onde: 'Contra o esterno, ocupando o espaço claro retroesternal alto.',
          leitura:
            'Uma opacidade retroesternal alta é do S3 (ou do S3 esquerdo). Se ela desloca a pleura em vez de acompanhá-la, pense em massa mediastinal anterior.',
        },
        {
          slug: 's4-s5-perfil',
          cor: '#266a39',
          sigla: 'S4+S5',
          nome: 'Lateral e medial, sobrepostos',
          original: 'lateral and medial segments',
          onde: 'Cunha anterior verde hachurada, entre a cissura horizontal e a oblíqua.',
          leitura:
            'S4 é lateral e S5 é medial: no perfil, um está exatamente atrás do outro. A hachura é a declaração honesta de que a incidência não os separa — quem separa é a PA ou a TC.',
          armadilha:
            'Escrever "consolidação do segmento lateral do lobo médio" com base apenas no perfil. O perfil dá o lobo médio; o segmento vem da PA.',
        },
        {
          slug: 's6-perfil',
          cor: '#910b0a',
          sigla: 'S6',
          nome: 'Superior (LID)',
          original: 'superior segment',
          onde: 'Contra a coluna, no meio — o degrau intermediário entre S2 e S10.',
          leitura:
            'O perfil mostra o que a PA esconde: o S6 é alto, mas está atrás. É esse "alto e posterior" que faz dele o destino natural do que se aspira deitado de costas.',
        },
        {
          slug: 's7-perfil',
          cor: '#ae5b55',
          sigla: 'S7',
          nome: 'Basal medial (LID)',
          original: 'medial basal segment',
          onde: 'Tracejado sobre a base, junto ao mediastino — assinalado com asterisco na figura.',
          leitura:
            'Medial e profundo demais para produzir contorno próprio numa lateral. A figura o desenha translúcido para dizer exatamente isso.',
          armadilha:
            'Tentar localizá-lo no perfil. Ele é assunto de PA e, com precisão, de tomografia.',
        },
        {
          slug: 's8-perfil',
          cor: '#da5033',
          sigla: 'S8',
          nome: 'Basal anterior (LID)',
          original: 'anterior basal segment',
          onde: 'Base, à frente, acima do seio costofrênico anterior.',
          leitura: 'Território dependente do paciente sentado — a base anterior é o ponto baixo de quem está ereto.',
        },
        {
          slug: 's9-perfil',
          cor: '#f5abaa',
          sigla: 'S9',
          nome: 'Basal lateral (LID)',
          original: 'lateral basal segment',
          onde: 'Base, no meio da coroa basal.',
          leitura:
            'No perfil o S9 fica espremido entre o S8 (à frente) e o S10 (atrás) — mais um par que a PA separa melhor.',
        },
        {
          slug: 's10-perfil',
          cor: '#560901',
          sigla: 'S10',
          nome: 'Basal posterior (LID)',
          original: 'posterior basal segment',
          onde: 'O canto mais posterior e mais baixo do painel — o recesso costofrênico posterior.',
          leitura:
            'Fecha a coluna S2 → S6 → S10. É o ponto mais baixo do pulmão, o primeiro a receber líquido e o último a ser visto na PA.',
        },
      ],
    },
    {
      id: 'painel-b',
      titulo: 'Painel B — pulmão esquerdo',
      sigla: '8 segmentos',
      cor: COR.lse,
      nota: 'As duas fusões da esquerda em uma imagem só: S1+2 no alto e S7+8 na base anterior.',
      itens: [
        {
          slug: 's1-2-perfil',
          cor: '#967401',
          sigla: 'S1+2',
          nome: 'Apicoposterior (LSE)',
          original: 'apicoposterior segment',
          onde: 'Todo o alto do painel, do esterno à coluna.',
          leitura:
            'A fusão fica evidente no perfil: onde à direita há dois territórios (S1 no topo, S2 atrás), à esquerda há um bloco só, que atravessa de frente para trás.',
        },
        {
          slug: 's3-lse-perfil',
          cor: '#edb803',
          sigla: 'S3',
          nome: 'Anterior (LSE)',
          original: 'anterior segment',
          onde: 'Contra o esterno, no espaço retroesternal alto.',
          leitura: 'Espelho do S3 direito. Junto com ele, define o compartimento anterior superior.',
        },
        {
          slug: 's4-lse-perfil',
          cor: '#e27408',
          sigla: 'S4',
          nome: 'Lingular superior (LSE)',
          original: 'superior lingular segment',
          onde: 'Cunha anterior laranja, metade superior.',
          leitura:
            'À esquerda, os dois lingulares se separam no perfil — porque superior e inferior estão um acima do outro, e não um atrás do outro como S4/S5 do lobo médio.',
        },
        {
          slug: 's5-lse-perfil',
          cor: '#efa953',
          sigla: 'S5',
          nome: 'Lingular inferior (LSE)',
          original: 'inferior lingular segment',
          onde: 'Cunha anterior laranja, metade inferior, até o seio costofrênico anterior.',
          leitura:
            'É este o segmento da opacidade retroesternal baixa à esquerda — e o que apaga a borda cardíaca esquerda na PA.',
        },
        {
          slug: 's6-lie-perfil',
          cor: '#50275c',
          sigla: 'S6',
          nome: 'Superior (LIE)',
          original: 'superior segment',
          onde: 'Contra a coluna, na porção média do painel.',
          leitura:
            'Mesmo papel do S6 direito. Repare que na legenda impressa da prancha ele aparece no bloco do LSE por um detalhe de diagramação — a cor roxa, da família do lobo inferior, mostra a que lobo ele pertence de fato.',
          armadilha:
            'Ler a posição da linha na legenda em vez da cor da mancha. S6 é segmento do lobo inferior esquerdo, em qualquer nomenclatura.',
        },
        {
          slug: 's7-8-perfil',
          cor: '#7e369a',
          sigla: 'S7+8',
          nome: 'Basal anteromedial (LIE)',
          original: 'anteromedial basal segment',
          onde: 'Base esquerda, porção anterior.',
          leitura:
            'A segunda fusão. À direita, este território seria dois segmentos (S7 medial e S8 anterior); à esquerda o coração empurra os dois para um tronco só.',
        },
        {
          slug: 's9-lie-perfil',
          cor: '#b57dc5',
          sigla: 'S9',
          nome: 'Basal lateral (LIE)',
          original: 'lateral basal segment',
          onde: 'Base esquerda, no meio da coroa basal.',
          leitura: 'Espelho do S9 direito, com a mesma limitação de separação no perfil.',
        },
        {
          slug: 's10-lie-perfil',
          cor: '#5c1756',
          sigla: 'S10',
          nome: 'Basal posterior (LIE)',
          original: 'posterior basal segment',
          onde: 'Canto posteroinferior do painel — recesso costofrênico posterior esquerdo.',
          leitura:
            'O ponto mais baixo do pulmão esquerdo, e junto com o S10 direito o endereço da broncoaspiração em decúbito e do derrame precoce.',
        },
      ],
    },
  ],
  convencoes: [
    {
      amostra: 'hachura',
      nome: 'Hachura verde (S4 + S5)',
      significado:
        'S4 e S5 do lobo médio ocupam a mesma cunha anterior no perfil e não são separáveis nesta incidência. Só a PA ou a TC os individualiza.',
    },
    {
      amostra: 'fantasma',
      nome: 'Tracejado translúcido (S7 direito)',
      significado:
        'O segmento basal medial direito é medial e profundo demais para ter contorno próprio na lateral. Está desenhado para completar a contagem, não para ser procurado.',
    },
    {
      amostra: 'seta',
      nome: '← ANTERIOR | POSTERIOR →',
      significado: 'Orientação de cada painel: esterno à esquerda, coluna à direita.',
    },
  ],
  leitura: [
    {
      titulo: 'Leia em duas colunas: esterno e coluna',
      paragrafos: [
        'O perfil organiza os segmentos em duas pilhas. Contra o esterno, de cima para baixo: S3, depois a cunha anterior do lobo médio (S4/S5) ou da língula (S4 e S5 lingulares), e por fim S8 na base anterior. Contra a coluna, de cima para baixo: S2, S6 e S10.',
        'Essa segunda coluna — S2, S6, S10 — é a espinha dorsal do raciocínio de aspiração. Ela responde, sem tomografia, à pergunta "para onde escorre o que o paciente aspirou".',
      ],
    },
    {
      titulo: 'A cunha anterior é uma coisa só nesta incidência',
      paragrafos: [
        'À direita, S4 (lateral) e S5 (medial) estão um atrás do outro em relação ao feixe lateral: por isso a prancha os pinta juntos, com hachura. A informação que falta aqui está na Figura 3.',
        'À esquerda a situação é outra: S4 e S5 lingulares são superior e inferior, e portanto se separam bem no perfil. Duas anatomias parecidas, dois comportamentos radiográficos opostos — é o tipo de detalhe que só uma prancha comparativa mostra.',
      ],
    },
    {
      titulo: 'O S7 direito está lá para contar, não para achar',
      paragrafos: [
        'A figura desenha o S7 em tracejado translúcido e marca com asterisco. É uma declaração de limite: ele completa os dez segmentos do pulmão direito, mas nenhuma lateral o individualiza.',
        'Tratar isso como falha da prancha seria inverter a lição. Uma boa figura anatômica diz também o que a incidência não entrega — e essa é a informação que evita um laudo confiante e errado.',
      ],
    },
    {
      titulo: 'Confira contra o filme limpo',
      paragrafos: [
        'Volte à radiografia sem marcação e tente refazer as duas pilhas de memória: primeiro os três degraus contra a coluna, depois a cunha anterior. Só então reacenda a prancha.',
        'A ordem importa. Olhar a figura pintada primeiro dá a sensação de ter aprendido; refazer no filme limpo mostra o que você de fato consegue localizar sozinho.',
      ],
    },
  ],
  clinica: [
    {
      titulo: 'Onde a gravidade deposita',
      paragrafos: [
        'No paciente deitado de costas — internado, sedado, com rebaixamento de consciência ou pós-operatório — os territórios dependentes são os posteriores: S2 no lobo superior e S6 no lobo inferior. É a distribuição clássica da pneumonia aspirativa hospitalar.',
        'No paciente ereto ou sentado, o conteúdo desce até a coroa basal: S8, S9 e S10. Em decúbito lateral, quem fica dependente são os segmentos laterais (axilares) do pulmão de baixo. Em todos os casos a pergunta clínica é a mesma: em que posição ele estava?',
      ],
    },
    {
      titulo: 'Do achado ao pedido de exame',
      paragrafos: [
        'Se a pergunta é "que lobo?", PA e perfil bastam na maioria das vezes. Se a pergunta é "que segmento?", esta prancha mostra até onde a radiografia vai: bem para os territórios contra a coluna e contra o esterno, mal para os pares que se sobrepõem no eixo do feixe.',
        'Quando a resposta segmentar muda a conduta — planejamento de ressecção, punção guiada, seguimento de nódulo — o exame é tomografia. A radiografia continua sendo o que localiza, tria e acompanha.',
      ],
    },
  ],
  armadilhas: [
    'Dar segmento de lobo médio pelo perfil. S4 e S5 estão sobrepostos aqui: a separação vem da PA.',
    'Procurar o S7 direito na lateral. Ele não se individualiza nesta incidência — a figura o marca com asterisco por isso.',
    'Ler a posição de S6 na legenda impressa em vez da cor. A cor roxa o coloca, corretamente, no lobo inferior.',
    'Somar os painéis. No filme real os dois pulmões estão sobrepostos; a separação em A e B é recurso didático.',
    'Assumir que "posterior no perfil" equivale a "posterior na tomografia". A cissura oblíqua é oblíqua também no plano axial.',
  ],
  limites: [
    'S4 e S5 do lobo médio não são separáveis nesta incidência.',
    'O S7 direito não é individualizável — está desenhado apenas para completar a contagem.',
    'O perfil não lateraliza: sem a PA, ele dá profundidade, não lado.',
    'Nomenclatura de Jackson–Huber/Boyden; outras escolas agrupam de modo ligeiramente diferente.',
  ],
  checagem: [
    {
      pergunta: 'Quais três segmentos se alinham contra a coluna torácica, de cima para baixo?',
      resposta: 'S2 (posterior do lobo superior), S6 (superior do lobo inferior) e S10 (basal posterior).',
    },
    {
      pergunta: 'Por que a prancha pinta S4 e S5 com hachura no painel direito?',
      resposta:
        'Porque são lateral e medial: no perfil ficam um atrás do outro. A hachura declara que a incidência não os separa.',
    },
    {
      pergunta: 'Por que os dois lingulares se separam no perfil, e os dois do lobo médio não?',
      resposta:
        'Porque os lingulares são superior e inferior — estão empilhados no eixo vertical, que o perfil mostra. S4 e S5 do lobo médio são lateral e medial, empilhados no eixo do feixe.',
    },
    {
      pergunta: 'Opacidade retroesternal alta no perfil. Que segmentos entram na lista?',
      resposta: 'S3 do lobo superior (direito ou esquerdo) — e, como diagnóstico diferencial, massa mediastinal anterior.',
    },
  ],
  relacionadas: ['segmentos-pa', 'lobos-perfil'],
}

/* ─────────────────────────── Acervo e consultas ─────────────────────────── */

export const PRANCHAS: PranchaRadiologica[] = [
  LOBOS_PA,
  LOBOS_PERFIL,
  SEGMENTOS_PA,
  SEGMENTOS_PERFIL,
]

/**
 * Fundamentos comuns às quatro pranchas.
 *
 * Vive fora das pranchas de propósito: são as regras que valem para todas, e
 * repeti-las em cada figura faria o aluno pular o texto na terceira vez.
 */
export const GUIA_PRANCHAS: BlocoTexto[] = [
  {
    titulo: 'Lobo e segmento não são a mesma escala',
    paragrafos: [
      'O lobo é uma unidade pleural: dois lobos são separados por uma cissura, que é uma dobra de pleura visceral. Por isso o lobo pode aparecer no filme — a cissura tem espessura, e quando o feixe a tangencia ela vira uma linha.',
      'O segmento é uma unidade broncovascular: brônquio próprio, artéria própria, veias correndo por fora. Não há pleura entre segmentos, e por isso nenhuma fronteira intersegmentar aparece numa radiografia. Todo limite segmentar destas pranchas é esquema; o que existe de verdade no filme é a distribuição da doença dentro daquele território.',
    ],
  },
  {
    titulo: 'O que aparece é o que o feixe tangencia',
    paragrafos: [
      'Uma interface só produz linha quando o raio passa rente a ela. É a razão de a cissura horizontal direita ser visível na PA — ela é aproximadamente perpendicular ao feixe — e de a cissura oblíqua não ser: atravessada de viés, ela vira penumbra difusa.',
      'No perfil a situação se inverte: as duas cissuras ficam tangenciadas e aparecem como linhas finas verdadeiras. Nenhuma incidência é melhor que a outra; elas são ortogonais, e a informação que uma perde é justamente a que a outra guarda.',
    ],
  },
  {
    titulo: 'Sinal da silhueta: profundidade a partir de uma imagem plana',
    paragrafos: [
      'Coração, diafragma e uma consolidação têm a mesma densidade radiográfica. A borda entre eles só existe porque há pulmão aerado no meio. Quando a lesão encosta na estrutura, o ar some e a borda também.',
      'Como o lobo médio e a língula são anteriores e encostam nas bordas do coração, e os lobos inferiores são posteriores e encostam no diafragma, o sinal converte "apagou o quê?" em "está onde?". É o instrumento que mais rende com o mínimo de tecnologia.',
    ],
  },
  {
    titulo: 'Sinal da coluna: o mesmo raciocínio, no perfil',
    paragrafos: [
      'Numa lateral normal as vértebras torácicas escurecem de cima para baixo, porque há progressivamente mais pulmão aerado projetado sobre elas. Perder esse gradiente — vértebras baixas mais brancas que as altas — indica densidade à frente delas.',
      'Como o que está à frente das vértebras baixas é o lobo inferior, a perda do sinal aponta para consolidação de lobo inferior, derrame posterior ou massa. É o complemento posterior do sinal da silhueta.',
    ],
  },
  {
    titulo: 'Como estudar estas pranchas',
    paragrafos: [
      'Abra primeiro a radiografia limpa e tente delimitar mentalmente. Depois acenda a prancha e confira o que você errou — o erro é a informação. Repita a mesma figura invertendo o filme (negativo), que muda o contraste e revela bordas que passaram despercebidas.',
      'Estude sempre os pares: lobos em PA com lobos em perfil, segmentos em PA com segmentos em perfil. Cada par é a mesma anatomia vista por dois eixos, e é a comparação — não a figura isolada — que fixa a profundidade.',
    ],
  },
]

/** Quantos territórios distintos as quatro pranchas nomeiam, somados. */
export const TOTAL_TERRITORIOS_PRANCHAS = PRANCHAS.reduce(
  (total, prancha) =>
    total + prancha.grupos.reduce((soma, grupo) => soma + grupo.itens.length, 0),
  0,
)

export function getPrancha(slug: string): PranchaRadiologica | undefined {
  return PRANCHAS.find((prancha) => prancha.slug === slug)
}

/* ─────────────────── Recorte magro para o catálogo ─────────────────── */

/**
 * O que a tela de listagem precisa — e só isso.
 *
 * O acervo completo tem o dossiê de 40 territórios e todos os textos de leitura.
 * Mandar isso para o navegador só para desenhar quatro cards seria repetir o
 * erro que `lib/radiologia/catalogo.ts` já corrigiu no atlas de Raio-X.
 */
export interface PranchaResumo {
  slug: string
  figura: number
  tema: TemaPrancha
  temaTitulo: string
  incidencia: IncidenciaPrancha
  titulo: string
  subtitulo: string
  resumo: string
  imagem: string
  altImagem: string
  /** Só as cores e siglas — o suficiente para a fita de cores do card. */
  amostras: { sigla: string; cor: string }[]
  totalTerritorios: number
}

export function resumosPranchas(): PranchaResumo[] {
  return PRANCHAS.map((prancha) => ({
    slug: prancha.slug,
    figura: prancha.figura,
    tema: prancha.tema,
    temaTitulo: prancha.temaTitulo,
    incidencia: prancha.incidencia,
    titulo: prancha.titulo,
    subtitulo: prancha.subtitulo,
    resumo: prancha.resumo,
    imagem: prancha.imagem,
    altImagem: prancha.altImagem,
    amostras: prancha.grupos.flatMap((grupo) =>
      grupo.itens.map((item) => ({ sigla: item.sigla, cor: item.cor })),
    ),
    totalTerritorios: prancha.grupos.reduce((soma, grupo) => soma + grupo.itens.length, 0),
  }))
}

/** Vizinhas de uma prancha, para a trilha do cabeçalho. */
export interface IrmaPrancha {
  slug: string
  figura: number
  titulo: string
  incidencia: IncidenciaPrancha
}

export function irmasDaPrancha(): IrmaPrancha[] {
  return PRANCHAS.map((prancha) => ({
    slug: prancha.slug,
    figura: prancha.figura,
    titulo: prancha.temaTitulo,
    incidencia: prancha.incidencia,
  }))
}
