/**
 * Transparência sobre a espécie de cada peça.
 *
 * Coleções didáticas de histologia misturam material humano (autópsia,
 * cirurgia) e de animais — macaco, rato, coelho, cão, gato — e às vezes nem
 * são de animal (a raiz de feijão da mitose). Na prova e na clínica, o aluno
 * precisa saber o que está vendo: o que numa lâmina de gato é igual ao humano
 * e o que é particularidade da espécie.
 *
 * Três regras:
 *
 * 1. **Espécie só é afirmada quando a fonte a declara.** Nada aqui é inferido
 *    da morfologia; peça sem espécie declarada aparece como "não informada",
 *    com essa frase, e nunca como humana por omissão.
 * 2. **Toda peça não humana tem comparação própria.** O teste do módulo exige
 *    isso: uma lâmina de macaco sem a comparação não publica.
 * 3. **A comparação é por peça**, não por espécie: o que importa numa língua
 *    de macaco (número de papilas valadas) não é o que importa num periodonto
 *    de macaco. Peças irmãs da mesma espécie e órgão compartilham o texto-base
 *    e acrescentam o que é específico daquela lâmina em `nestaPeca`.
 */

export type CategoriaDeOrigem = 'humana' | 'nao-humana' | 'vegetal' | 'nao-informada'

export interface ComparacaoComHumano {
  /** Uma frase: quão diferente é, e por que a peça continua útil para estudar o humano. */
  resumo: string
  /** O que muda em relação à peça humana correspondente. */
  diferencas: string[]
  /** O que vale igual para o humano — o que o aluno pode estudar aqui sem medo. */
  igual: string[]
  /** O que é particular desta lâmina (quando há mais de uma peça do mesmo órgão e espécie). */
  nestaPeca?: string
}

export interface OrigemDaPeca {
  categoria: CategoriaDeOrigem
  /** Nome da espécie em português, ou "Não informada". */
  especie: string
  /** Nome científico, quando a espécie é conhecida com precisão. */
  cientifico?: string
  comparacao?: ComparacaoComHumano
}

export const TEXTO_NAO_INFORMADA =
  'A fonte original não registra a espécie desta peça. Coleções didáticas misturam material humano e animal; por isso não a apresentamos como humana. A ficha de características descreve o órgão humano — confira nela os critérios que valem para qualquer mamífero.'

export const TEXTO_HUMANA = 'Peça humana, conforme registrado pela fonte original.'

// ─── Comparações-base (espécie × órgão) ────────────────────────────────────

const MEDULA_MACACO: ComparacaoComHumano = {
  resumo:
    'Medula de primata não humano: a organização é praticamente a mesma do humano, e a lâmina serve integralmente para estudar a medula humana.',
  diferencas: [
    'Dimensões absolutas menores: a medula humana é mais longa e tem diâmetro maior, sobretudo nas intumescências cervical e lombar.',
    'As conexões corticomotoneuronais diretas (trato corticospinal sobre os neurônios motores) existem no macaco, mas são mais numerosas no humano — ligadas ao controle fino dos dedos. O trato corticospinal lateral ocupa, proporcionalmente, uma área um pouco maior no humano.',
    'O número de segmentos e o nível em que a medula termina no canal vertebral diferem entre as espécies.',
  ],
  igual: [
    'Substância cinzenta em "H" com cornos anteriores, posteriores e, na região torácica, laterais.',
    'Neurônios motores do corno anterior com corpúsculos de Nissl grossos, idênticos aos humanos.',
    'Substância branca em funículos, canal central com epêndima e as três meninges.',
  ],
}

const LABIO_MACACO: ComparacaoComHumano = {
  resumo:
    'Lábio de macaco: mesmas três faces (pele, vermelhão e mucosa) e o mesmo músculo orbicular, com uma diferença marcante no vermelhão.',
  diferencas: [
    'O vermelhão humano é largo, evertido e de papilas dérmicas muito altas — é uma característica quase exclusivamente humana. No macaco, a zona de transição entre pele e mucosa é estreita e pouco evertida.',
    'A face cutânea do macaco tem pelos mais densos que a pele labial humana (excluída a barba).',
  ],
  igual: [
    'Pele fina com folículos pilosos, glândulas sebáceas e sudoríparas na face externa.',
    'Mucosa de epitélio estratificado pavimentoso não queratinizado com glândulas labiais na face interna.',
    'Músculo orbicular da boca (estriado esquelético) no centro.',
  ],
}

const LINGUA_MACACO: ComparacaoComHumano = {
  resumo:
    'Língua de macaco: arquitetura muscular e mucosa equivalentes às humanas; as diferenças estão no número e na distribuição das papilas.',
  diferencas: [
    'Papilas valadas: o humano tem de 8 a 12, dispostas em "V" diante do sulco terminal; os macacos costumam ter bem menos (em geral 3, dispostas em triângulo).',
    'Papilas foliadas: bem desenvolvidas e ricas em botões gustativos no macaco; no humano adulto são rudimentares (mais visíveis na criança).',
  ],
  igual: [
    'Músculo estriado esquelético em três planos, com septo lingual.',
    'Botões gustativos com a mesma estrutura (células receptoras, de sustentação e basais, e poro gustativo).',
    'Glândulas serosas de von Ebner drenando no sulco das papilas valadas.',
  ],
}

const PERIODONTO_MACACO: ComparacaoComHumano = {
  resumo:
    'Periodonto de macaco: é o modelo animal mais próximo do humano em pesquisa periodontal — a estrutura é a mesma.',
  diferencas: [
    'Dentes e raízes menores; caninos proporcionalmente muito maiores (sobretudo nos machos), com raízes longas.',
    'Espessuras absolutas de ligamento periodontal e de osso alveolar ligeiramente menores.',
  ],
  igual: [
    'Cemento, ligamento periodontal com fibras de Sharpey e osso alveolar organizados como no humano.',
    'Dentina tubular e polpa com odontoblastos na periferia.',
    'Restos epiteliais de Malassez no ligamento.',
  ],
}

const GLANDULA_MACACO: ComparacaoComHumano = {
  resumo:
    'Glândula submandibular de macaco: histologicamente quase indistinguível da humana.',
  diferencas: [
    'O tamanho absoluto é menor; a proporção entre ácinos serosos e túbulos mucosos varia um pouco entre indivíduos e espécies, mas o predomínio seroso é o mesmo.',
    'Com a idade, a glândula humana acumula mais tecido adiposo e fibrose no estroma.',
  ],
  igual: [
    'Glândula mista seromucosa, com semiluas serosas.',
    'Ductos intercalares e estriados bem desenvolvidos.',
    'Células mioepiteliais em volta das unidades secretoras.',
  ],
}

const GERME_MACACO: ComparacaoComHumano = {
  resumo:
    'Germe dentário de macaco: as fases da odontogênese são as mesmas do humano; muda o calendário.',
  diferencas: [
    'O desenvolvimento e a erupção são mais rápidos no macaco — as fases que no humano levam anos se completam em meses.',
    'Forma e tamanho das coroas diferem (os molares do macaco têm cúspides em cristas, bilofodontes).',
  ],
  igual: [
    'Órgão do esmalte com epitélios interno e externo, estrato intermediário e retículo estrelado.',
    'Papila dentária com odontoblastos em paliçada e folículo dentário em volta.',
    'Sequência botão → capuz → campânula → coroa.',
  ],
}

const INCISIVO_RATO: ComparacaoComHumano = {
  resumo:
    'Incisivo de rato: um dente de crescimento contínuo — o que permite ver, numa mesma lâmina, fases da formação do esmalte que no humano acontecem uma única vez.',
  diferencas: [
    'Os incisivos dos roedores crescem a vida inteira (erupção contínua): a extremidade apical está sempre formando dente novo. Os dentes humanos formam-se uma vez e param quando a raiz se completa.',
    'Ao longo do incisivo de rato estão lado a lado, em sequência espacial, as fases pré-secretora, secretora e de maturação dos ameloblastos. No humano essas fases se sucedem no tempo, no mesmo lugar.',
    'O esmalte do incisivo do rato cobre apenas a face vestibular (labial) — por isso ele se desgasta em bisel e fica afiado. No humano o esmalte recobre a coroa inteira.',
    'O esmalte do rato recebe pigmento com ferro na fase de maturação, que dá a cor alaranjada; o esmalte humano não tem esse pigmento.',
  ],
  igual: [
    'Ameloblastos altos e polarizados com processo de Tomes na fase secretora.',
    'Ameloblastos mais baixos, em modulação, na fase de maturação.',
    'Odontoblastos e dentina com a mesma organização.',
  ],
}

const EPIGLOTE_COELHO: ComparacaoComHumano = {
  resumo:
    'Epiglote de coelho: o tecido que a lâmina ensina — cartilagem elástica — é idêntico ao humano; a peça é menor e tem outra posição funcional.',
  diferencas: [
    'O coelho respira obrigatoriamente pelo nariz: a epiglote fica alta, encaixada atrás do palato mole. No humano adulto a laringe é baixa e a epiglote se afasta do palato.',
    'A peça é menor e mais delgada; a lâmina própria e a quantidade de glândulas variam em relação à epiglote humana, que tem glândulas em depressões e perfurações da cartilagem.',
  ],
  igual: [
    'Eixo de cartilagem elástica com rede densa de fibras elásticas (evidente na orceína e na resorcina).',
    'Condrócitos em lacunas e pericôndrio nas duas faces.',
    'Mucosa com epitélio estratificado pavimentoso na face lingual.',
  ],
}

const BEXIGA_COELHO: ComparacaoComHumano = {
  resumo:
    'Bexiga de coelho: o urotélio, que é o foco desta lâmina, tem a mesma organização do humano.',
  diferencas: [
    'A parede é mais fina e o órgão, menor; o número de camadas do urotélio muda com a distensão nas duas espécies, e a bexiga humana vazia costuma mostrar um urotélio mais espesso.',
    'A urina do coelho é rica em cristais de carbonato de cálcio — os coelhos excretam o excesso de cálcio pelos rins —, o que não se reflete no urotélio, mas explica achados na luz.',
  ],
  igual: [
    'Urotélio com células basais, intermediárias e superficiais em guarda-chuva.',
    'Lâmina própria sem glândulas e detrusor de músculo liso em feixes cruzados.',
  ],
}

const VESICULA_COBAIA: ComparacaoComHumano = {
  resumo:
    'Vesícula biliar de cobaia: mucosa pregueada com epitélio simples cilíndrico, como no humano.',
  diferencas: [
    'Órgão bem menor, com parede mais fina e camada muscular menos espessa.',
    'Na vesícula humana adulta são frequentes os seios de Rokitansky-Aschoff (invaginações da mucosa na camada muscular), associados à idade e à inflamação; são raros na peça de animal jovem de laboratório.',
  ],
  igual: [
    'Epitélio simples cilíndrico alto, sem células caliciformes.',
    'Ausência de muscular da mucosa e de submucosa.',
    'Camada muscular lisa em feixes de várias direções e serosa externa.',
  ],
}

const FIGADO_RATO: ComparacaoComHumano = {
  resumo:
    'Fígado de rato: o lóbulo e as placas de hepatócitos são como no humano; há diferenças de anatomia e de ploidia celular.',
  diferencas: [
    'O rato não tem vesícula biliar — a bile vai direto ao duodeno. No humano ela existe e armazena a bile.',
    'O fígado do rato é dividido em vários lobos bem separados; o humano é mais compacto.',
    'No rato adulto a maioria dos hepatócitos é poliploide (4n, 8n); no humano a poliploidia existe, mas em fração menor das células — por isso os núcleos do rato variam mais de tamanho.',
  ],
  igual: [
    'Placas de hepatócitos separadas por sinusoides, sem septos conjuntivos delimitando os lóbulos (diferente do porco, onde os septos são visíveis).',
    'Espaços porta com ramo da veia porta, da artéria hepática e ducto biliar.',
    'Células de Kupffer e espaço de Disse.',
  ],
  nestaPeca:
    'Corte semifino em resina: a resolução revela gotículas de lipídio, grânulos de glicogênio e núcleos com nitidez que o parafina não dá — em qualquer espécie.',
}

const CORNEA_CAMUNDONGO: ComparacaoComHumano = {
  resumo:
    'Córnea de camundongo: as mesmas camadas do humano, em outra proporção — e uma delas quase ausente.',
  diferencas: [
    'A córnea humana tem cerca de 0,5 mm de espessura central; a do camundongo, cerca de 0,1 mm.',
    'No camundongo o epitélio ocupa proporcionalmente muito mais da espessura (cerca de um terço); no humano, o estroma responde por cerca de 90 %.',
    'A membrana de Bowman, nítida no humano, é ausente ou rudimentar no camundongo.',
  ],
  igual: [
    'Epitélio estratificado pavimentoso não queratinizado na face anterior.',
    'Estroma avascular de lamelas colágenas com ceratócitos.',
    'Membrana de Descemet e endotélio simples pavimentoso na face posterior.',
  ],
}

const GENGIVA_CAO: ComparacaoComHumano = {
  resumo:
    'Gengiva de cão: mesma organização epitelial em torno do dente — o cão é modelo clássico de doença periodontal.',
  diferencas: [
    'Pigmentação melânica na gengiva é comum em muitas raças; no humano varia com a etnia e costuma ser mais discreta.',
    'Dentes e raízes têm outra forma (dentição de carnívoro, com caninos e carniceiros), o que muda o contorno gengival.',
  ],
  igual: [
    'Epitélio gengival oral queratinizado, epitélio sulcular e epitélio juncional aderido ao dente.',
    'Lâmina própria densa com fibras gengivais.',
    'Infiltrado inflamatório discreto junto ao sulco.',
  ],
}

const PANCREAS_CAO: ComparacaoComHumano = {
  resumo:
    'Pâncreas de cão com imuno-histoquímica para insulina: a marcação das células β funciona igual no humano; a distribuição das células na ilhota pode variar entre espécies.',
  diferencas: [
    'O arranjo das células dentro da ilhota varia entre espécies. No humano, células α e β ficam intercaladas por toda a ilhota; nos roedores, as β formam um núcleo central com as α na periferia. Não use esta peça para aprender o arranjo humano — compare com a lâmina "Pâncreas — humano" desta coleção.',
    'O tamanho e a quantidade de ilhotas por área também variam entre as espécies.',
  ],
  igual: [
    'Células β são a maioria das células das ilhotas e são as únicas marcadas pela insulina.',
    'O pâncreas exócrino, sem marcação, é equivalente ao humano (ácinos serosos, células centroacinares).',
  ],
}

const PAROTIDA_GATO: ComparacaoComHumano = {
  resumo:
    'Parótida de gato: glândula serosa como a humana — é a comparação mais segura desta coleção.',
  diferencas: [
    'Na parótida humana há adipócitos entremeados no parênquima, que aumentam com a idade; na peça de gato eles são escassos.',
    'O gato tem glândulas salivares a mais que o humano não possui (zigomática e molar), mas isso não aparece nesta peça.',
  ],
  igual: [
    'Ácinos serosos de citoplasma basófilo e grânulos de zimogênio apicais.',
    'Ductos intercalares longos e ductos estriados evidentes.',
    'No Azan, o colágeno dos septos em azul e as células serosas em tons avermelhados.',
  ],
}

const FEIJAO: ComparacaoComHumano = {
  resumo:
    'Peça vegetal (raiz de feijão), não animal: as fases da mitose são as mesmas de uma célula humana, mas a célula vegetal se divide de outro jeito em dois pontos.',
  diferencas: [
    'A célula vegetal tem parede de celulose, que dá o contorno retangular; a célula humana tem só a membrana plasmática.',
    'Não há centríolos: o fuso mitótico vegetal se forma sem centrossomo. Na célula humana, os centrossomos com centríolos organizam os polos do fuso.',
    'A citocinese vegetal ocorre por placa celular (fragmoplasto), que cresce do centro para a periferia. Na célula humana, um anel contrátil de actina e miosina estrangula a célula de fora para dentro (sulco de clivagem).',
    'O número de cromossomos é o da planta, diferente dos 46 humanos.',
  ],
  igual: [
    'Prófase, metáfase, anáfase e telófase com a mesma sequência e a mesma aparência dos cromossomos.',
    'A reação de Feulgen marca o DNA da mesma forma em qualquer célula.',
  ],
}

const EMBRIAO_NAO_INFORMADO: ComparacaoComHumano = {
  resumo:
    'Embrião cuja espécie a fonte não registra: a ossificação endocondral é igual em todos os mamíferos, mas o calendário não.',
  diferencas: [
    'Sem a espécie, não dá para situar a idade gestacional em equivalente humano: o centro primário de ossificação dos ossos longos surge no humano por volta da 7ª–8ª semana, e em roedores nos últimos dias da gestação.',
  ],
  igual: [
    'Molde de cartilagem hialina, colar ósseo periosteal, broto periosteal e centro primário de ossificação.',
    'Condrócitos em proliferação e hipertrofia em direção ao centro.',
  ],
}

// ─── Por peça ────────────────────────────────────────────────────────────────

const peca = (
  categoria: CategoriaDeOrigem,
  especie: string,
  comparacao?: ComparacaoComHumano,
  extra?: { cientifico?: string; nestaPeca?: string },
): OrigemDaPeca => ({
  categoria,
  especie,
  cientifico: extra?.cientifico,
  comparacao: comparacao && extra?.nestaPeca ? { ...comparacao, nestaPeca: extra.nestaPeca } : comparacao,
})

const HUMANA = peca('humana', 'Humana', undefined, { cientifico: 'Homo sapiens' })
const MACACO = 'Macaco (primata não humano)'

/**
 * Origem declarada, peça a peça, pela chave `root` do acervo. Peças fora deste
 * mapa são "não informada".
 */
export const ORIGEM_POR_PECA: Record<string, OrigemDaPeca> = {
  // Humanas declaradas
  'Chromosomes/Sample1/': HUMANA,
  'Chromosomes/Sample2/': HUMANA,
  'Pancreas/Sample10/': HUMANA,
  'dental/54-14/': HUMANA,
  'dental/65-10/': HUMANA,
  'dental/66-2/': HUMANA,
  'praep56/': HUMANA,
  'praep79/': HUMANA,
  'praep84/': HUMANA,
  'praepsma/': HUMANA,

  // Vegetal
  'praep6-2new/': peca('vegetal', 'Feijão (planta)', FEIJAO, {
    nestaPeca: 'Varra a ponta da raiz: as fases se agrupam logo atrás da coifa, onde a divisão é mais intensa.',
  }),
  'Mitosis/Sample2/': peca('vegetal', 'Feijão (planta)', FEIJAO, {
    nestaPeca: 'Scan com objetiva de 100×: é aqui que se distinguem os cromossomos individuais na metáfase e na anáfase.',
  }),

  // Macaco
  'Nerve/Sample3/': peca('nao-humana', MACACO, MEDULA_MACACO, {
    nestaPeca: 'Panorâmica: compare a proporção entre substância branca e cinzenta, que muda de um segmento para outro também no humano.',
  }),
  'Nerve/Sample2/': peca('nao-humana', MACACO, MEDULA_MACACO, {
    nestaPeca: 'Corno anterior em alta resolução: os neurônios motores são o ponto de maior semelhança com o humano.',
  }),
  'Nerve/Sample7/': peca('nao-humana', MACACO, MEDULA_MACACO),
  'praep69/': peca('nao-humana', MACACO, LABIO_MACACO),
  'praep69b/': peca('nao-humana', MACACO, LABIO_MACACO),
  'dental/51-15/': peca('nao-humana', MACACO, LABIO_MACACO, {
    nestaPeca: 'Preparação da coleção de odontologia: observe a transição da mucosa labial para a gengiva, quando incluída.',
  }),
  'dental/55-5/': peca('nao-humana', MACACO, LINGUA_MACACO, {
    nestaPeca: 'Corte transversal inteiro: ideal para ver o arranjo muscular em três planos, que é igual ao humano.',
  }),
  'dental/56-6/': peca('nao-humana', MACACO, LINGUA_MACACO, {
    nestaPeca: 'Papila valada: no humano há de 8 a 12 delas; a estrutura de cada uma — sulco, botões gustativos e glândulas de von Ebner — é a mesma.',
  }),
  'dental/57-6/': peca('nao-humana', MACACO, LINGUA_MACACO, {
    nestaPeca: 'Papila foliada bem desenvolvida: no humano adulto esta região é rudimentar, com poucos botões gustativos.',
  }),
  'dental/60-14/': peca('nao-humana', MACACO, GLANDULA_MACACO),
  'dental/63-11/': peca('nao-humana', MACACO, PERIODONTO_MACACO, {
    nestaPeca: 'No Azan, o colágeno do ligamento periodontal fica azul intenso — as fibras de Sharpey aparecem com clareza.',
  }),
  'dental/64-13/': peca('nao-humana', MACACO, PERIODONTO_MACACO),
  'dental/67-14/': peca('nao-humana', MACACO, GERME_MACACO),

  // Rato
  'Liver/Sample9/': peca('nao-humana', 'Rato', FIGADO_RATO, { cientifico: 'Rattus norvegicus' }),
  'dental/68-8/': peca('nao-humana', 'Rato', INCISIVO_RATO, {
    cientifico: 'Rattus norvegicus',
    nestaPeca: 'Fase secretora: ameloblastos altos com processo de Tomes depositando a matriz do esmalte.',
  }),
  'dental/69-2/': peca('nao-humana', 'Rato', INCISIVO_RATO, {
    cientifico: 'Rattus norvegicus',
    nestaPeca: 'Fase de maturação: ameloblastos mais baixos reabsorvendo matriz; o esmalte se mineraliza e se cora menos.',
  }),

  // Coelho
  'Larynx/Sample1/': peca('nao-humana', 'Coelho', EPIGLOTE_COELHO, {
    cientifico: 'Oryctolagus cuniculus',
    nestaPeca: 'Resorcina: fibras elásticas em violeta-escuro.',
  }),
  'Larynx/Sample2/': peca('nao-humana', 'Coelho', EPIGLOTE_COELHO, {
    cientifico: 'Oryctolagus cuniculus',
    nestaPeca: 'Orceína: fibras elásticas em marrom-avermelhado.',
  }),
  'Overgangsep/Sample1/': peca('nao-humana', 'Coelho', BEXIGA_COELHO, { cientifico: 'Oryctolagus cuniculus' }),

  // Cobaia
  'Galdeep/Sample1/': peca('nao-humana', 'Cobaia (porquinho-da-índia)', VESICULA_COBAIA, {
    cientifico: 'Cavia porcellus',
    nestaPeca: 'Panorâmica com objetiva de 4×: a parede inteira num campo só.',
  }),
  'Galdeep/Sample2/': peca('nao-humana', 'Cobaia (porquinho-da-índia)', VESICULA_COBAIA, {
    cientifico: 'Cavia porcellus',
  }),

  // Camundongo
  'Cornea/Sample1/': peca('nao-humana', 'Camundongo', CORNEA_CAMUNDONGO, { cientifico: 'Mus musculus' }),

  // Cão
  'dental/53-1/': peca('nao-humana', 'Cão', GENGIVA_CAO, { cientifico: 'Canis familiaris' }),
  'praep87/': peca('nao-humana', 'Cão', PANCREAS_CAO, { cientifico: 'Canis familiaris' }),

  // Gato
  'dental/59-13/': peca('nao-humana', 'Gato', PAROTIDA_GATO, { cientifico: 'Felis catus' }),

  // Embrião sem espécie declarada: o dado que falta muda a leitura.
  'praep28/': peca('nao-informada', 'Não informada (embrião)', EMBRIAO_NAO_INFORMADO),
}

const NAO_INFORMADA: OrigemDaPeca = { categoria: 'nao-informada', especie: 'Não informada' }

export function origemDaPeca(root: string): OrigemDaPeca {
  return ORIGEM_POR_PECA[root] ?? NAO_INFORMADA
}

export const ROTULO_DA_CATEGORIA: Record<CategoriaDeOrigem, string> = {
  humana: 'Peça humana',
  'nao-humana': 'Peça não humana',
  vegetal: 'Peça vegetal',
  'nao-informada': 'Espécie não informada',
}
