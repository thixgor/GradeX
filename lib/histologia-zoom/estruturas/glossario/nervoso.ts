import type { Estrutura } from '../tipos'

/** Estruturas do sistema nervoso central e periférico. */
export const ESTRUTURAS_NERVOSO: Estrutura[] = [
  {
    id: 'camada-molecular-cerebelar',
    nome: 'Camada molecular do cerebelo',
    sinonimos: ['molecular layer', 'estrato molecular'],
    tipo: 'camada',
    resumo: 'Camada mais externa do córtex cerebelar: larga, eosinófila e pobre em células.',
    caracteristicas: [
      'Faixa rosa-pálida sob a pia-máter, com poucos núcleos espalhados.',
      'É basicamente neurópilo: dendritos das células de Purkinje e axônios das células granulares (fibras paralelas).',
      'Os poucos neurônios são interneurônios inibitórios: células estreladas (terço externo) e células em cesto (terço interno).',
    ],
    aprofundado: [
      'As fibras paralelas correm ao longo do eixo da folha e cruzam em ângulo reto a árvore dendrítica de cada célula de Purkinje, que é achatada num único plano — como uma espaldeira. Uma Purkinje recebe cerca de 200 mil sinapses de fibras paralelas.',
      'As fibras de Bergmann (prolongamentos radiais da glia de Bergmann) atravessam a camada até a superfície, formando a glia limitante.',
      'As células em cesto envolvem o soma e o segmento inicial do axônio das Purkinje ("pinceau"), um dos pontos de inibição mais potentes do sistema nervoso.',
    ],
    funcoes: [
      'Integração sináptica: as fibras paralelas convergem sobre os dendritos das Purkinje.',
      'Inibição lateral e de alimentação anterior (células estreladas e em cesto), que dá precisão temporal ao sinal de saída do cerebelo.',
    ],
    regeneracao: {
      nivel: 'nula',
      texto: 'Neurônios adultos não se dividem. A glia reage à lesão (gliose), mas a arquitetura perdida não se refaz.',
    },
    ondeEncontrar: ['Exclusiva do córtex cerebelar, em todas as folhas.'],
    alteracoes: [
      'Atrofia com afilamento da camada molecular: alcoolismo crônico (vermis anterossuperior), degenerações cerebelares hereditárias.',
      'Degeneração paraneoplásica (anti-Yo): perda de Purkinje com camada molecular preservada, mas pobre.',
      'Artefato frequente: vacuolização e fendas por processamento tardio post-mortem.',
    ],
  },
  {
    id: 'camada-de-purkinje',
    nome: 'Camada de células de Purkinje',
    sinonimos: ['Purkinje cell layer', 'camada ganglionar do cerebelo'],
    tipo: 'camada',
    resumo: 'Fileira única de corpos de células de Purkinje na interface entre as camadas molecular e granular.',
    caracteristicas: [
      'Uma só fileira de corpos celulares grandes e piriformes, espaçados entre si.',
      'Ocupa a fronteira nítida entre a camada molecular (rosa) e a granular (roxa).',
      'Entre as Purkinje ficam os corpos da glia de Bergmann (astrócitos especializados).',
    ],
    aprofundado: [
      'Não é uma "camada" espessa: tem a altura de um corpo celular. O que a define é a posição, não a densidade.',
      'Em material post-mortem é comum um halo claro de retração em volta de cada Purkinje — artefato, não edema.',
    ],
    funcoes: ['Contém os únicos neurônios de projeção do córtex cerebelar — toda a saída do córtex passa por aqui.', 'Abrigar a glia de Bergmann, cujos prolongamentos radiais guiam a migração das células granulares no desenvolvimento.', 'Ser a interface entre entrada (camada molecular) e saída (axônios para os núcleos profundos).'],
    regeneracao: { nivel: 'nula', texto: 'Purkinje perdidas não são repostas; restam espaços vazios na fileira ("empty baskets").' },
    ondeEncontrar: ['Exclusiva do córtex cerebelar.'],
    alteracoes: [
      'Rarefação de Purkinje com proliferação da glia de Bergmann: hipóxia/isquemia (as Purkinje estão entre os neurônios mais sensíveis do SNC), intoxicação alcoólica, degeneração paraneoplásica, fenitoína.',
      'Torpedos axonais (dilatações do axônio proximal) em ataxias degenerativas.',
    ],
  },
  {
    id: 'celula-de-purkinje',
    nome: 'Célula de Purkinje',
    sinonimos: ['Purkinje cell', 'neurônio de Purkinje'],
    tipo: 'celula',
    resumo: 'Neurônio gigante, em forma de frasco, com árvore dendrítica voltada para a camada molecular.',
    caracteristicas: [
      'Corpo celular grande (50–80 µm), piriforme, com núcleo claro e nucléolo evidente.',
      'Citoplasma com corpúsculos de Nissl; em HE pode ficar escuro e anguloso ("neurônio escuro") por manipulação do tecido.',
      'Dendrito apical grosso que sobe para a camada molecular e se ramifica num único plano.',
      'Axônio que desce pela camada granular até a substância branca.',
    ],
    aprofundado: [
      'É GABAérgica: sua saída é sempre inibitória, sobre os núcleos profundos do cerebelo e vestibulares.',
      'Recebe duas entradas excitatórias opostas: centenas de milhares de fibras paralelas (fracas) e uma única fibra trepadeira da oliva inferior (fortíssima, gera o "potencial complexo").',
      'A plasticidade da sinapse fibra paralela–Purkinje (depressão de longa duração) é a base celular do aprendizado motor.',
      'Na impregnação de Golgi/prata a árvore dendrítica aparece inteira, em leque; em HE só se vê o soma e o início do dendrito.',
    ],
    funcoes: [
      'Única saída do córtex cerebelar: modula (inibe) os núcleos cerebelares profundos.',
      'Coordenação, ajuste fino e aprendizado dos movimentos.',
    ],
    regeneracao: { nivel: 'nula', texto: 'Neurônio pós-mitótico: não é reposto após a morte.' },
    ondeEncontrar: ['Somente no córtex cerebelar, na camada de Purkinje.'],
    alteracoes: [
      'Necrose isquêmica ("neurônio vermelho"): citoplasma hipereosinofílico, núcleo picnótico, 12–24 h após hipóxia.',
      'Perda seletiva: alcoolismo, ataxias espinocerebelares, degeneração paraneoplásica, doença de Creutzfeldt-Jakob.',
      'Artefato de "neurônio escuro" (retraído e hipercromático) por manipulação antes da fixação — não confundir com lesão.',
    ],
  },
  {
    id: 'camada-granular-cerebelar',
    nome: 'Camada granular do cerebelo',
    sinonimos: ['granular layer', 'estrato granuloso'],
    tipo: 'camada',
    resumo: 'Camada interna do córtex cerebelar, densíssima de núcleos pequenos e redondos das células granulares.',
    caracteristicas: [
      'Faixa intensamente basófila (roxa) entre a camada de Purkinje e a substância branca.',
      'Milhões de núcleos redondos pequenos (células granulares), quase sem citoplasma visível.',
      'Entre os grupos de núcleos, ilhas eosinófilas pálidas: os glomérulos cerebelares.',
      'Neurônios maiores e esparsos: células de Golgi.',
    ],
    aprofundado: [
      'Contém mais neurônios do que todo o resto do encéfalo somado: as células granulares cerebelares são cerca de metade dos neurônios humanos.',
      'Recebe as fibras musgosas (medula espinal, ponte, núcleos vestibulares), que terminam nos glomérulos.',
    ],
    funcoes: [
      'Recebe e redistribui a informação das fibras musgosas: cada fibra ativa centenas de células granulares, que a projetam como fibras paralelas.',
      'As células de Golgi fazem retroalimentação inibitória nos glomérulos.',
    ],
    regeneracao: { nivel: 'nula', texto: 'As células granulares se formam até o início da infância (camada granular externa) e depois não se renovam.' },
    ondeEncontrar: ['Córtex cerebelar. Não confundir com a camada granular do giro denteado (hipocampo), onde há neurogênese adulta limitada.'],
    alteracoes: [
      'Autólise post-mortem: a camada granular é a primeira a mostrar "estado criblado"/liquefação — a "lise granular" é artefato de fixação tardia.',
      'Meduloblastoma: tumor embrionário que se origina de precursores da camada granular externa (crianças).',
      'Hipoplasia granular: infecção congênita, intoxicação por metilmercúrio.',
    ],
  },
  {
    id: 'celula-granular-cerebelar',
    nome: 'Células granulares do cerebelo',
    sinonimos: ['granule cells', 'grânulos do cerebelo'],
    tipo: 'celula',
    resumo: 'Os menores neurônios do encéfalo: núcleo redondo, escuro, de 5–8 µm, quase sem citoplasma.',
    caracteristicas: [
      'Núcleo pequeno, redondo, hipercromático, com cromatina grosseira.',
      'Citoplasma escasso, invisível em HE.',
      'Aglomeradas em grupos, separadas pelos glomérulos.',
    ],
    aprofundado: [
      'Glutamatérgicas (excitatórias): o único neurônio excitatório do córtex cerebelar.',
      'Cada uma envia um axônio que sobe à camada molecular e se bifurca em T, formando as fibras paralelas.',
    ],
    funcoes: ['Transformam a entrada das fibras musgosas em sinais das fibras paralelas sobre as Purkinje.', 'Codificar o contexto do movimento (entradas de muitas origens) para o aprendizado motor.', 'Cada célula granular recebe só 4–5 fibras musgosas: combina entradas de modo muito seletivo.'],
    regeneracao: { nivel: 'nula', texto: 'Pós-mitóticas no adulto.' },
    ondeEncontrar: ['Camada granular do córtex cerebelar.'],
    alteracoes: [
      'Confundidas com linfócitos por quem vê a lâmina pela primeira vez — mas estão num órgão sem arquitetura linfoide e cercadas de glomérulos.',
      'Perda granular na doença de Creutzfeldt-Jakob (variante) e em algumas intoxicações.',
    ],
  },
  {
    id: 'glomerulo-cerebelar',
    nome: 'Glomérulo cerebelar',
    sinonimos: ['cerebellar glomerulus', 'ilha cerebelar', 'ilha eosinófila'],
    tipo: 'regiao',
    resumo: 'Ilha eosinófila pálida entre as células granulares: um complexo sináptico sem núcleos.',
    caracteristicas: [
      'Área rosada, pálida, arredondada ou irregular, sem núcleos, cercada por células granulares.',
      'Em HE parece "espaço vazio" rosado; não é vaso nem artefato.',
    ],
    aprofundado: [
      'Cada glomérulo reúne a roseta terminal de uma fibra musgosa, dezenas de dendritos de células granulares e terminais axonais de células de Golgi, envoltos por uma cápsula glial.',
      'É uma unidade de processamento: excitação (fibra musgosa) e inibição (Golgi) sobre as mesmas células granulares, no mesmo lugar.',
    ],
    funcoes: ['Local de sinapse entre fibras musgosas, células granulares e células de Golgi.', 'Ajustar o ganho da transmissão entre fibras musgosas e células granulares (inibição pelas células de Golgi).', 'Formar as "ilhas claras" da camada granular, pontos de convergência de sinapses.'],
    regeneracao: { nivel: 'nula', texto: 'Estrutura sináptica de neurônios pós-mitóticos; sem renovação celular.' },
    ondeEncontrar: ['Camada granular do cerebelo.'],
    alteracoes: ['Autólise post-mortem torna a camada granular rarefeita e os glomérulos pouco distinguíveis.'],
  },
  {
    id: 'substancia-branca-cerebelar',
    nome: 'Substância branca do cerebelo',
    sinonimos: ['white matter', 'árvore da vida', 'arbor vitae', 'eixo medular da folha'],
    tipo: 'regiao',
    resumo: 'Eixo central de cada folha: fibras mielinizadas, eosinófilas, com núcleos gliais enfileirados.',
    caracteristicas: [
      'Fibrilar, eosinófila, sem corpos neuronais.',
      'Núcleos pequenos, redondos e escuros, muitas vezes com halo claro: oligodendrócitos, em fileiras entre as fibras.',
      'Em corte sagital, os eixos ramificados formam a "árvore da vida".',
    ],
    aprofundado: [
      'Traz as fibras aferentes (musgosas e trepadeiras) e leva os axônios das Purkinje aos núcleos profundos (denteado, emboliforme, globoso, fastigial), que ficam mergulhados nela.',
      'Em HE a mielina é quase incolor ou levemente eosinófila; colorações para mielina (Luxol, Weil) a escurecem.',
    ],
    funcoes: ['Condução: entradas para o córtex cerebelar e saída das Purkinje.', 'Levar a saída das células de Purkinje aos núcleos profundos, que projetam ao tálamo, ao núcleo rubro e ao tronco.', 'Trazer as fibras trepadeiras (oliva inferior) e musgosas (ponte, medula, vestíbulo) ao córtex cerebelar.'],
    regeneracao: {
      nivel: 'baixa',
      texto: 'Oligodendrócitos podem remielinizar parcialmente a partir de precursores (células NG2), mas axônios centrais cortados não regeneram de forma útil.',
    },
    ondeEncontrar: ['Centro de cada folha e o corpo medular do cerebelo; substância branca de todo o SNC.'],
    alteracoes: [
      'Desmielinização (esclerose múltipla): placas pálidas com perda de mielina e relativa preservação dos axônios.',
      'Leucoencefalopatias e edema: palidez e vacuolização.',
    ],
  },
]
