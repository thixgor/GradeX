/**
 * Resumos densos por setor do currículo.
 *
 * O objetivo é o "mapa antes do território": ao abrir um sistema, o aluno lê em
 * trinta segundos o vocabulário e a arquitetura que vai reencontrar em dezenas
 * de lâminas. São propositalmente **densos em termos** — cada palavra técnica
 * aqui é uma que aparece marcada nas lâminas daquele setor, e reconhecê-la
 * antes de ver a imagem é o que transforma "olhar" em "identificar".
 *
 * A chave é o caminho de slugs do currículo (`caminho.join('/')`).
 *
 * Conteúdo próprio, de livro-texto, **pendente de revisão biomédica** como todo
 * o restante. Onde não há resumo escrito, a interface não inventa: mostra a
 * hierarquia e segue.
 */

export interface ResumoDeSetor {
  /** Frase única que situa o setor. */
  chamada: string
  /** Parágrafo denso, com o vocabulário que se repete nas lâminas. */
  panorama: string
  /** O que o aluno deve conseguir fazer ao fim do setor. */
  objetivos: string[]
  /** Critérios rápidos de identificação — o "cola mental" do setor. */
  chavesDeIdentificacao?: Array<{ estrutura: string; pista: string }>
}

export const RESUMOS: Record<string, ResumoDeSetor> = {
  /* ═══════════ Histologia Básica ═══════════ */

  'histologia-basica/preparacao-do-tecido': {
    chamada: 'Por que a lâmina tem a aparência que tem.',
    panorama:
      'Toda imagem histológica é o produto de uma cadeia de agressões controladas ao tecido. A **fixação** (formaldeído, que faz ligações cruzadas entre proteínas; glutaraldeído e tetróxido de ósmio para microscopia eletrônica) interrompe a autólise por enzimas hidrolíticas e enrijece a peça. A **desidratação** em série alcoólica crescente retira a água, a **diafanização** pelo xilol torna o tecido miscível com a parafina, e a **inclusão** produz o bloco. A **microtomia** corta fatias de 5 a 20 µm no micrótomo rotativo; para eletrônica, o ultramicrótomo produz 30 a 60 nm em resina epóxi. O corte é distendido em banho-maria, pescado na lâmina, desparafinado, reidratado, **corado**, desidratado de novo e montado sob lamínula com meio de índice de refração adequado. Cada etapa deixa marca: o lipídio dissolvido pelo xilol vira vacúolo vazio, a retração cria fendas artefatuais em torno das células, e a faca cega produz estrias paralelas (chatter).',
    objetivos: [
      'Explicar o que cada etapa faz ao tecido e o que aconteceria se fosse omitida.',
      'Reconhecer, numa lâmina, os artefatos produzidos por falha de cada etapa.',
      'Justificar por que gordura e glicogênio exigem técnicas específicas.',
    ],
    chavesDeIdentificacao: [
      { estrutura: 'Vacúolo vazio de contorno nítido', pista: 'Lipídio dissolvido no processamento — não é "buraco" no tecido.' },
      { estrutura: 'Fenda em volta de células ou feixes', pista: 'Retração pela desidratação; artefato, não espaço real.' },
      { estrutura: 'Estrias transversais paralelas', pista: 'Vibração da navalha (chatter) durante a microtomia.' },
    ],
  },

  'histologia-basica/corantes': {
    chamada: 'A cor não é do tecido: é da química entre corante e molécula.',
    panorama:
      'A **hematoxilina** é um corante básico (catiônico) e se liga ao que é ácido — DNA nuclear, RNA ribossômico do retículo rugoso, glicosaminoglicanos sulfatados da matriz. O que a capta é chamado **basófilo** e fica azul-arroxeado. A **eosina** é ácida (aniônica) e cora estruturas básicas: a maior parte das proteínas citoplasmáticas, colágeno, filamentos, hemácias — o **acidófilo** ou **eosinófilo**, em rosa a vermelho. Fora da rotina, o **PAS** oxida os grupos 1,2-glicol dos carboidratos a aldeídos, revelados pelo reativo de Schiff em magenta: glicogênio, mucinas neutras e membranas basais. O **tricrômico de Masson** separa colágeno (azul ou verde) de músculo e citoplasma (vermelho) e é a coloração da fibrose. A **impregnação argêntica** revela fibras reticulares de colágeno III em preto. A **orceína** e o **Verhoeff** demonstram elastina. O **azul de toluidina** é metacromático: vira púrpura onde há polianions concentrados, como nos grânulos do mastócito e na matriz cartilaginosa.',
    objetivos: [
      'Prever se uma estrutura será basófila ou acidófila a partir de sua composição.',
      'Escolher a coloração adequada para uma pergunta específica (fibrose, carboidrato, elastina).',
      'Explicar a metacromasia e onde ela ocorre.',
    ],
  },

  /* ═══════════ Tecidos ═══════════ */

  'tecidos/epitelio': {
    chamada: 'Células justapostas, avasculares e polarizadas, sobre membrana basal.',
    panorama:
      'Classifica-se por **número de camadas** (simples, estratificado, pseudoestratificado) e **forma da célula superficial** (pavimentoso, cúbico, colunar). Toda célula epitelial repousa em **membrana basal** — lâmina basal (lâmina lúcida + lâmina densa, ricas em colágeno IV, laminina e perlecana) mais lâmina reticular de colágeno III. A **polaridade** define três domínios: apical (microvilosidades, estereocílios, cílios), lateral (complexo juncional: zônula de oclusão, zônula de adesão, desmossomos, junções comunicantes) e basal (hemidesmossomos ancorando à lâmina basal). Epitélios glandulares derivam de invaginações: **exócrinos** mantêm ducto; **endócrinos** perdem a conexão e secretam no sangue. Os exócrinos classificam-se pelo ducto (simples/composto), pela forma da unidade secretora (tubular, acinosa, tubuloacinosa) e pelo modo de secreção (merócrina, apócrina, holócrina). Sendo avascular, o epitélio depende por completo da difusão a partir da lâmina própria — e é por isso que a membrana basal íntegra separa carcinoma in situ de invasor.',
    objetivos: [
      'Classificar qualquer epitélio pelo número de camadas e pela forma superficial.',
      'Localizar a membrana basal e explicar por que ela é decisiva em oncologia.',
      'Distinguir os componentes do complexo juncional e a função de cada um.',
      'Classificar uma glândula exócrina pelo ducto, unidade secretora e modo de secreção.',
    ],
    chavesDeIdentificacao: [
      { estrutura: 'Pseudoestratificado', pista: 'Núcleos em alturas diferentes, mas toda célula toca a membrana basal.' },
      { estrutura: 'Transição (urotélio)', pista: 'Células superficiais em cúpula, frequentemente binucleadas.' },
      { estrutura: 'Célula caliciforme', pista: 'Taça de base estreita e ápice claro em H&E, magenta em PAS.' },
    ],
  },

  'tecidos/tecido-conjuntivo': {
    chamada: 'Pouca célula, muita matriz — e é a matriz que define o subtipo.',
    panorama:
      'A **matriz extracelular** combina fibras e substância fundamental. As **fibras colágenas** (tipo I) dão resistência à tração em feixes ondulados e eosinófilos; as **reticulares** (tipo III) formam arcabouço em malha, visíveis só por prata; as **elásticas** (elastina + fibrilina) devolvem a forma e exigem orceína. A **substância fundamental** é gel de glicosaminoglicanos (ácido hialurônico, condroitim e dermatam sulfato), proteoglicanos e glicoproteínas adesivas (fibronectina, laminina). As células fixas — **fibroblasto** (núcleo fusiforme; ativo é claro e nucleolado, inativo é denso), **adipócito**, **macrófago**, **mastócito** — convivem com as transitórias vindas do sangue: plasmócitos, linfócitos, neutrófilos e eosinófilos. O **frouxo** tem muitas células e pouca fibra, e é onde a inflamação acontece; o **denso modelado** alinha feixes numa direção (tendão, ligamento); o **denso não modelado** entrelaça em todas as direções (derme reticular, cápsulas). Cartilagem, osso e sangue são conjuntivos especializados, definidos pela consistência da matriz: gel, mineralizada e líquida.',
    objetivos: [
      'Diferenciar frouxo, denso modelado e denso não modelado pela proporção e arranjo das fibras.',
      'Associar cada tipo de fibra à coloração que a revela e à propriedade mecânica que confere.',
      'Reconhecer as células residentes pelo núcleo e pelo citoplasma.',
    ],
    chavesDeIdentificacao: [
      { estrutura: 'Fibroblasto ativo × fibrócito', pista: 'Núcleo claro, volumoso e nucleolado × núcleo pequeno, denso e escuro.' },
      { estrutura: 'Mastócito', pista: 'Grânulos metacromáticos: púrpura no azul de toluidina, não azul.' },
      { estrutura: 'Adipócito', pista: 'Anel de sinete — vacúolo vazio com núcleo comprimido na periferia.' },
    ],
  },

  'tecidos/tecido-muscular': {
    chamada: 'Três músculos, três núcleos, três histórias.',
    panorama:
      'O **esquelético** é formado por fibras cilíndricas multinucleadas, com **núcleos periféricos** sob o sarcolema, estriações transversais e organização em **sarcômeros** (de linha Z a linha Z: banda I de actina, banda A de miosina, banda H e linha M no centro). O acoplamento excitação-contração passa pelo **sistema T** e pelo retículo sarcoplasmático em **tríades** na junção A-I; o envoltório é endomísio → perimísio → epimísio. O **cardíaco** tem fibras ramificadas, **um a dois núcleos centrais** e **discos intercalares** — junções especializadas que reúnem fáscias aderentes (ancoram os miofilamentos), desmossomos (resistem à tração) e **junções comunicantes** (acoplam eletricamente, permitindo o sincício funcional); as díades ficam na linha Z, e o sistema de condução inclui as fibras de Purkinje, pálidas e ricas em glicogênio. O **liso** tem células fusiformes mononucleadas, sem estriação, com **corpos densos** no lugar das linhas Z, cavéolas em vez de sistema T, e contração regulada por calmodulina e quinase da cadeia leve da miosina — lenta, sustentada e barata em ATP.',
    objetivos: [
      'Identificar o tipo muscular em qualquer corte pela posição dos núcleos e pela presença de estriação e discos intercalares.',
      'Nomear as bandas do sarcômero e dizer o que muda em cada uma durante a contração.',
      'Explicar por que o miocárdio se comporta como sincício funcional.',
    ],
    chavesDeIdentificacao: [
      { estrutura: 'Esquelético', pista: 'Estriado + muitos núcleos periféricos.' },
      { estrutura: 'Cardíaco', pista: 'Estriado + núcleo central + disco intercalar (linha escura transversal).' },
      { estrutura: 'Liso', pista: 'Sem estriação + núcleo único central, em saca-rolhas quando contraído.' },
    ],
  },

  'tecidos/tecido-nervoso': {
    chamada: 'Neurônios conduzem; a glia é quem viabiliza.',
    panorama:
      'O **neurônio** tem corpo celular (pericário) com **substância de Nissl** — retículo rugoso e polissomos, intensamente basófilos —, dendritos (que contêm Nissl) e um axônio único que parte do **cone de implantação**, onde a Nissl desaparece. Classificam-se em multipolar, bipolar e pseudounipolar. A **glia central** reúne astrócitos (protoplasmáticos na substância cinzenta, fibrosos na branca; fazem a barreira hematoencefálica pelos pés perivasculares), oligodendrócitos (mielinizam vários axônios), micróglia (macrófagos residentes, de origem no saco vitelino) e epêndima (reveste ventrículos e canal central). Na **periferia**, a célula de Schwann mieliniza **um único internódulo** de um único axônio, e os axônios amielínicos ficam em invaginações compartilhadas. A mielina é interrompida nos **nós de Ranvier**, onde se concentram os canais de sódio — base da condução saltatória. O nervo é envolvido por endoneuro, perineuro (que faz a barreira hematonervosa) e epineuro.',
    objetivos: [
      'Distinguir axônio de dendrito pela presença de substância de Nissl.',
      'Associar cada célula glial à sua função e ao seu território.',
      'Explicar por que o nervo periférico regenera e o SNC praticamente não.',
    ],
  },

  /* ═══════════ Órgãos e Sistemas ═══════════ */

  'orgaos-e-sistemas/sistema-cardiovascular': {
    chamada: 'Três túnicas, e a proporção entre elas conta a função do vaso.',
    panorama:
      'Todo vaso tem **íntima** (endotélio + subendotelial + lâmina elástica interna), **média** (músculo liso e/ou lamelas elásticas, entre as lâminas elásticas interna e externa) e **adventícia** (conjuntivo, com vasa vasorum e nervos nos calibres maiores). As **artérias elásticas** (aorta, tronco pulmonar) têm média com dezenas de lamelas elásticas concêntricas: amortecem a sístole e devolvem a energia na diástole, mantendo fluxo contínuo. As **musculares** (de distribuição) têm média espessa de músculo liso circular e lâmina elástica interna ondulada muito evidente. As **arteríolas** têm uma a três camadas musculares e são o principal sítio de resistência periférica. Os **capilares** são endotélio + lâmina basal + pericitos, e classificam-se em contínuo (músculo, SNC), fenestrado (glomérulo, intestino, endócrino) e sinusoide (fígado, baço, medula). As **veias** têm parede fina, luz ampla e frequentemente colapsada, e **válvulas** nos membros. O coração acrescenta endocárdio, miocárdio e epicárdio, com esqueleto fibroso isolando eletricamente átrios de ventrículos exceto pelo fascículo atrioventricular.',
    objetivos: [
      'Classificar um vaso pelas três túnicas e pela proporção entre elástico e muscular.',
      'Prever o tipo de capilar a partir da função do órgão.',
      'Distinguir artéria de veia no mesmo campo.',
    ],
    chavesDeIdentificacao: [
      { estrutura: 'Artéria muscular', pista: 'Lâmina elástica interna ondulada e nítida; luz redonda e aberta.' },
      { estrutura: 'Veia acompanhante', pista: 'Parede fina, luz ampla e irregular, frequentemente colapsada.' },
    ],
  },

  'orgaos-e-sistemas/sistema-digestorio': {
    chamada: 'Quatro túnicas do esôfago ao ânus — o que muda é o detalhe de cada uma.',
    panorama:
      'O plano geral é **mucosa** (epitélio + lâmina própria + muscular da mucosa), **submucosa** (conjuntivo denso não modelado, com o plexo submucoso de Meissner), **muscular externa** (circular interna + longitudinal externa, com o plexo mientérico de Auerbach entre elas) e **adventícia ou serosa**. O **esôfago** tem epitélio estratificado pavimentoso não queratinizado e glândulas esofágicas próprias na submucosa. O **estômago** troca para simples colunar com **fovéolas gástricas**; nas glândulas fúndicas, células mucosas do colo, **parietais** (acidófilas, produzem HCl e fator intrínseco), **principais/zimogênicas** (basófilas, pepsinogênio) e enteroendócrinas; a muscular externa ganha uma terceira camada oblíqua. O **intestino delgado** maximiza superfície em três níveis — pregas circulares, **vilosidades** e microvilosidades — com enterócitos, caliciformes, **células de Paneth** (grânulos acidófilos, defensinas) no fundo das criptas, e **glândulas de Brunner** exclusivas da submucosa duodenal. O **cólon** perde vilosidades, ganha caliciformes em profusão e condensa a longitudinal externa em **tênias**. Fígado (lóbulos, espaços porta, sinusoides, células de Kupffer, canalículos biliares) e pâncreas (ácinos serosos com células centroacinosas + ilhotas) completam o sistema.',
    objetivos: [
      'Identificar o segmento do tubo digestório por epitélio, relevo e glândulas.',
      'Localizar cada tipo celular gástrico e intestinal na profundidade correta da glândula.',
      'Explicar como pregas, vilosidades e microvilosidades multiplicam a área absortiva.',
    ],
    chavesDeIdentificacao: [
      { estrutura: 'Duodeno', pista: 'Glândulas de Brunner na submucosa — só existem aqui.' },
      { estrutura: 'Íleo', pista: 'Placas de Peyer, agregados linfoides que atravessam a muscular da mucosa.' },
      { estrutura: 'Cólon', pista: 'Sem vilosidades, criptas retas e muitas caliciformes.' },
      { estrutura: 'Estômago fúndico', pista: 'Parietais acidófilas no meio, principais basófilas no fundo.' },
    ],
  },

  'orgaos-e-sistemas/sistema-respiratorio': {
    chamada: 'Uma porção condutora que se simplifica progressivamente até a porção respiratória.',
    panorama:
      'A **porção condutora** vai das cavidades nasais aos bronquíolos terminais e é revestida por **epitélio respiratório** — pseudoestratificado colunar ciliado com células caliciformes — sobre lâmina própria com glândulas seromucosas. Traqueia e brônquios mantêm cartilagem (anéis em C na traqueia, placas nos brônquios) e músculo liso. Os **bronquíolos** perdem cartilagem e glândulas, o epitélio baixa para simples cúbico e surgem as **células clara (de Club)**, sem cílios, com secreção protetora. A **porção respiratória** começa no bronquíolo respiratório, onde aparecem os primeiros alvéolos na parede, e segue por ductos alveolares, sacos alveolares e alvéolos. A parede alveolar tem **pneumócitos tipo I** (pavimentosos, 95% da superfície, formam a barreira) e **tipo II** (cúbicos, nos ângulos, com corpos lamelares de surfactante e capacidade de repovoar o epitélio), além de macrófagos alveolares. A **barreira hematoaérea** soma citoplasma do pneumócito I, lâminas basais fusionadas e endotélio capilar — cerca de 0,2 µm.',
    objetivos: [
      'Ordenar os segmentos da árvore respiratória pelas transições de epitélio, cartilagem e glândulas.',
      'Reconhecer o bronquíolo respiratório pela presença de alvéolos na parede.',
      'Descrever os componentes da barreira hematoaérea.',
    ],
    chavesDeIdentificacao: [
      { estrutura: 'Bronquíolo', pista: 'Sem cartilagem e sem glândulas — é isso que o separa do brônquio.' },
      { estrutura: 'Bronquíolo respiratório', pista: 'Parede interrompida por alvéolos.' },
      { estrutura: 'Pneumócito tipo II', pista: 'Cúbico e saliente no ângulo do alvéolo, citoplasma vacuolado.' },
    ],
  },

  'orgaos-e-sistemas/sistema-urinario': {
    chamada: 'Filtrar muito e reabsorver quase tudo — a histologia do néfron é a dessa economia.',
    panorama:
      'O **corpúsculo renal** reúne o tufo de capilares glomerulares fenestrados e a cápsula de Bowman (folheto parietal pavimentoso, folheto visceral de **podócitos** com processos primários e **pedicelos**). A **barreira de filtração** tem três camadas: endotélio fenestrado, membrana basal glomerular (colágeno IV, laminina e heparam sulfato, que dá a carga negativa) e as fendas de filtração com diafragma de nefrina. Mesângio intraglomerular sustenta e fagocita. O **túbulo contorcido proximal** reabsorve dois terços do filtrado: borda em escova proeminente, luz irregular, citoplasma muito acidófilo por mitocôndrias. A **alça de Henle** cria o gradiente medular por multiplicação em contracorrente, com ramos delgados e o ascendente espesso. O **túbulo contorcido distal** tem luz nítida, sem borda em escova, e mais núcleos por corte; onde encosta na arteríola aferente forma a **mácula densa**, que junto às células justaglomerulares (produtoras de renina) compõe o **aparelho justaglomerular**. Os **ductos coletores** respondem à ADH com aquaporinas e reúnem células principais e intercaladas.',
    objetivos: [
      'Distinguir túbulo proximal de distal em qualquer corte de córtex.',
      'Enumerar as três camadas da barreira de filtração e o que cada uma retém.',
      'Explicar como o aparelho justaglomerular acopla fluxo tubular e pressão sistêmica.',
    ],
    chavesDeIdentificacao: [
      { estrutura: 'Túbulo proximal', pista: 'Borda em escova, luz irregular, poucos núcleos por circunferência.' },
      { estrutura: 'Túbulo distal', pista: 'Luz limpa e ampla, sem borda em escova, mais núcleos por circunferência.' },
    ],
  },

  'orgaos-e-sistemas/sistema-linfoide': {
    chamada: 'Onde o linfócito nasce, amadurece e encontra o antígeno.',
    panorama:
      'Órgãos **primários** — medula óssea (linfócitos B) e **timo** (linfócitos T) — geram e selecionam o repertório; o timo tem córtex denso de timócitos, medula clara com **corpúsculos de Hassall** e células reticulares epiteliais que apresentam o próprio para a seleção. Órgãos **secundários** são onde a resposta acontece. O **linfonodo** tem cápsula, seio subcapsular, córtex com nódulos e **centros germinativos** (proliferação B, hipermutação somática, macrófagos de corpos tingíveis), **paracórtex** timo-dependente com vênulas de endotélio alto, e medula com cordões e seios medulares. O **baço** separa **polpa branca** (bainha linfoide periarteriolar de células T, nódulos B, zona marginal) de **polpa vermelha** (cordões esplênicos e sinusoides, onde as hemácias senescentes são removidas). O **MALT** distribui tecido linfoide difuso e nodular pelas mucosas — tonsilas, placas de Peyer, apêndice.',
    objetivos: [
      'Separar órgãos linfoides primários de secundários pela função.',
      'Localizar territórios B e T em linfonodo e baço.',
      'Reconhecer um centro germinativo reativo e dizer o que acontece dentro dele.',
    ],
  },

  'orgaos-e-sistemas/sistema-endocrino': {
    chamada: 'Glândulas sem ducto: o produto vai para o capilar, e a histologia reflete isso.',
    panorama:
      'A **hipófise** divide-se em adeno-hipófise (origem ectodérmica na bolsa de Rathke; pars distalis com acidófilas — somatotrofos e lactotrofos —, basófilas — corticotrofos, tireotrofos, gonadotrofos — e cromófobas) e neuro-hipófise (extensão do diencéfalo, com axônios amielínicos, pituícitos e **corpos de Herring**, onde ocitocina e ADH se acumulam). A **tireoide** é o único órgão endócrino que estoca secreção fora da célula: folículos revestidos por epitélio cúbico com **coloide** de tireoglobulina no centro, mais células parafoliculares (C) produtoras de calcitonina. A **paratireoide** reúne células principais e **oxífilas**. A **suprarrenal** tem córtex de origem mesodérmica em três zonas — glomerulosa (mineralocorticoides), fasciculada (glicocorticoides, com espongiócitos claros de lipídio) e reticular (androgênios) — e medula de origem em crista neural, com **células cromafins** que são neurônios pós-ganglionares modificados. A **pineal** tem pinealócitos e concreções calcificadas (areia cerebral).',
    objetivos: [
      'Reconhecer cada glândula endócrina pelo padrão de organização do parênquima.',
      'Explicar por que a tireoide armazena hormônio extracelularmente.',
      'Associar cada zona da suprarrenal ao seu produto e à sua origem embrionária.',
    ],
  },

  'orgaos-e-sistemas/pele': {
    chamada: 'A barreira que se renova inteira a cada quatro semanas.',
    panorama:
      'A **epiderme** é epitélio estratificado pavimentoso queratinizado com quatro estratos na pele fina — basal (mitoticamente ativo, ancorado por hemidesmossomos), espinhoso (desmossomos e **tonofilamentos**), granuloso (**grânulos de querato-hialina** e corpos lamelares que impermeabilizam) e córneo — mais o **lúcido** na pele espessa. Convivem quatro linhagens: queratinócitos, **melanócitos** (crista neural, na basal, transferem melanossomos), **células de Langerhans** (apresentadoras de antígeno, de origem medular, no espinhoso) e células de Merkel (mecanorreceptoras). A **derme** tem camada papilar (conjuntivo frouxo, com papilas dérmicas que interdigitam com as cristas epidérmicas e alojam alças capilares e corpúsculos de Meissner) e reticular (denso não modelado, com corpúsculos de Pacini na profundidade). Anexos: folículo piloso com bulbo e papila dérmica, glândula sebácea (holócrina), sudorípara écrina (merócrina, termorregulação) e apócrina (axila e região anogenital).',
    objetivos: [
      'Nomear os estratos da epiderme e o que caracteriza cada um.',
      'Distinguir pele fina de espessa e justificar pela função regional.',
      'Localizar as quatro linhagens celulares epidérmicas e os receptores dérmicos.',
    ],
  },

  'orgaos-e-sistemas/sistema-reprodutor': {
    chamada: 'Duas gametogêneses, dois calendários, duas arquiteturas.',
    panorama:
      'No **masculino**, os **túbulos seminíferos** contêm epitélio germinativo com espermatogônias na base, espermatócitos primários e secundários, espermátides e espermatozoides em direção à luz, apoiados pelas **células de Sertoli** — que formam a **barreira hematotesticular** por junções de oclusão, isolando o compartimento adluminal. No interstício, as **células de Leydig** produzem testosterona. A via segue por túbulos retos, rede testicular, **dúctulos eferentes** (epitélio de altura irregular, com células ciliadas e absortivas), ducto do epidídimo (pseudoestratificado com estereocílios), ducto deferente (muscular espessa em três camadas) e uretra. No **feminino**, o ovário evolui de folículos primordiais a primários, secundários (com **antro**, **cumulus oophorus** e tecas interna e externa) e maduros; após a ovulação forma-se o corpo lúteo com células granulosa-luteínicas e teca-luteínicas. A tuba uterina tem epitélio simples colunar ciliado e secretor; o **endométrio** alterna camada funcional (descamada na menstruação) e basal (regenerativa), com artérias espiraladas; o colo troca para epitélio estratificado pavimentoso na ectocérvice. A **placenta** reúne vilosidades coriônicas com cito e sinciciotrofoblasto sobre eixo de mesênquima e vasos fetais.',
    objetivos: [
      'Ordenar as células da espermatogênese da base à luz do túbulo seminífero.',
      'Explicar a barreira hematotesticular e por que ela é necessária.',
      'Classificar folículos ovarianos e relacioná-los à fase do ciclo.',
      'Correlacionar as fases do endométrio com a histologia observada.',
    ],
  },

  'orgaos-e-sistemas/olho': {
    chamada: 'Três túnicas concêntricas e dez camadas de retina.',
    panorama:
      'A túnica **fibrosa** externa é esclera (denso não modelado) e **córnea** — avascular e transparente, com epitélio estratificado pavimentoso não queratinizado, camada de Bowman, estroma de lamelas de colágeno regularmente espaçadas, **membrana de Descemet** e endotélio que bombeia água para manter a transparência. A túnica **vascular** (úvea) reúne coroide (com **coriocapilar** e membrana de Bruch), corpo ciliar (processos ciliares que produzem humor aquoso; músculo ciliar da acomodação) e íris (com músculos esfíncter e dilator da pupila, este de origem neuroectodérmica). A túnica **nervosa** é a retina, com epitélio pigmentar externo e, da coroide para o vítreo: segmentos de fotorreceptores, membrana limitante externa, camada nuclear externa, plexiforme externa, nuclear interna, plexiforme interna, camada de células ganglionares, fibras nervosas e limitante interna. A **fóvea** concentra cones e afasta as camadas internas para máxima acuidade; o **disco óptico** não tem fotorreceptores — é a mancha cega.',
    objetivos: [
      'Nomear as três túnicas e seus componentes regionais.',
      'Ordenar as camadas da retina e localizar o corpo celular de cada neurônio.',
      'Explicar o que mantém a córnea transparente.',
    ],
  },

  'orgaos-e-sistemas/ouvido': {
    chamada: 'Um labirinto ósseo com um labirinto membranoso dentro.',
    panorama:
      'A **orelha externa** vai da aurícula (cartilagem elástica) ao meato acústico externo, com **glândulas ceruminosas** apócrinas modificadas. A **média** contém a membrana timpânica e os ossículos, com os músculos tensor do tímpano e estapédio, e comunica-se com a faringe pela tuba auditiva. A **interna** é o labirinto ósseo (vestíbulo, canais semicirculares, cóclea) preenchido por perilinfa, contendo o labirinto membranoso com endolinfa. Na cóclea, o **ducto coclear** separa a rampa vestibular da rampa timpânica, delimitado pela **membrana vestibular** e pela **membrana basilar**, com a **estria vascular** produzindo endolinfa. Sobre a basilar assenta o **órgão de Corti**, com células ciliadas internas e externas, células de sustentação e a **membrana tectória** por cima. O equilíbrio depende das **máculas** do utrículo e sáculo (com otólitos) e das **cristas ampulares** dos ductos semicirculares (com cúpula).',
    objetivos: [
      'Separar labirinto ósseo de membranoso e perilinfa de endolinfa.',
      'Descrever o órgão de Corti e como o movimento da basilar vira estímulo.',
      'Associar mácula e crista ampular aos tipos de aceleração que detectam.',
    ],
  },

  'orgaos-e-sistemas/conceitos-gerais': {
    chamada: 'O vocabulário comum a todos os órgãos.',
    panorama:
      'Órgãos combinam os quatro tecidos em dois arranjos típicos. Os **tubulares** (digestório, respiratório, urinário, genital) organizam-se em túnicas concêntricas em torno de uma **luz**: mucosa, submucosa, muscular e adventícia ou serosa. Os **parenquimatosos** (fígado, rim, baço, glândulas) separam **parênquima** — as células que fazem o trabalho do órgão — de **estroma**, o conjuntivo de sustentação que carrega vasos e nervos, organizado em cápsula, trabéculas e septos que subdividem o órgão em lobos e **lóbulos**. Reconhecer o padrão antes de olhar o detalhe resolve metade da identificação: se há luz revestida por epitélio e camadas concêntricas, procure as quatro túnicas; se há cápsula e septos delimitando lóbulos, procure a unidade funcional repetida.',
    objetivos: [
      'Distinguir órgão tubular de parenquimatoso à primeira vista.',
      'Separar parênquima de estroma em qualquer corte.',
      'Usar o padrão geral para orientar a identificação antes de descer ao detalhe.',
    ],
  },

  /* ═══════════ Células ═══════════ */

  'celulas/estruturas': {
    chamada: 'O que a coloração revela — e o que só a microscopia eletrônica mostra.',
    panorama:
      'Ao microscópio óptico não se veem organelas: vê-se o **efeito** delas sobre a afinidade tintorial. Basofilia citoplasmática denuncia **retículo endoplasmático rugoso** e polissomos (o RNA é ácido); acidofilia intensa denuncia **mitocôndrias** abundantes; uma área clara justanuclear é a **imagem negativa do Golgi**. Só a microscopia eletrônica resolve cristas mitocondriais, cisternas do rugoso e liso, faces cis e trans do Golgi, lisossomos, peroxissomos e o citoesqueleto — microfilamentos de actina, filamentos intermediários (queratina no epitélio, vimentina no mesênquima, desmina no músculo, GFAP na glia, neurofilamentos no neurônio) e microtúbulos partindo do centro organizador. A superfície apical especializa-se em **microvilosidades** (actina, absorção), **estereocílios** (microvilosidades longas, não móveis) e **cílios** (axonema 9+2, motilidade). O núcleo mostra envoltório com poros, cromatina em euc e heterocromatina e nucléolo com pars fibrosa e granulosa.',
    objetivos: [
      'Prever a aparência de uma célula em H&E a partir das organelas que ela precisa ter.',
      'Associar cada filamento intermediário ao seu tipo tecidual.',
      'Distinguir microvilosidade, estereocílio e cílio por estrutura e função.',
    ],
  },

  'celulas/divisao-celular': {
    chamada: 'Mitose conserva o número; meiose o reduz e recombina.',
    panorama:
      'A **intérfase** ocupa a maior parte do ciclo (G1, S, G2) e mostra núcleo com cromatina dispersa e nucléolo evidente. Na **prófase** a cromatina condensa em cromossomos com duas cromátides-irmãs, o nucléolo desaparece e o fuso se organiza a partir dos centrossomos; na **metáfase** os cromossomos alinham-se na placa equatorial; na **anáfase** as cromátides separam-se para os polos; na **telófase** os núcleos se reconstituem e o **anel contrátil** de actina e miosina II produz o sulco de clivagem da citocinese. A **meiose** acrescenta a prófase I longa, com pareamento de homólogos e crossing-over, e duas divisões sem replicação intermediária — daí a redução a haploide e a recombinação. Na espermatogênese as quatro células resultantes viram espermatozoides; na ovogênese, uma vira ovócito e as demais, corpúsculos polares.',
    objetivos: [
      'Identificar a fase da mitose numa lâmina pelo arranjo da cromatina.',
      'Explicar as duas diferenças essenciais entre mitose e meiose.',
      'Justificar a assimetria da ovogênese frente à espermatogênese.',
    ],
  },

  'celulas/fundamentos-da-celula': {
    chamada: 'Forma, polaridade e tamanho seguem a função.',
    panorama:
      'A forma celular reflete o que a célula faz e as forças a que responde: pavimentosa onde a prioridade é difusão, colunar onde há absorção ou secreção intensa, fusiforme onde há contração, estrelada onde há sustentação e comunicação. A **polaridade** — domínios apical, lateral e basal distintos em composição de membrana e citoesqueleto — é o que permite transporte vetorial, e é sustentada pelas junções de oclusão, que impedem a mistura das proteínas de membrana entre domínios. O tamanho é limitado pela relação superfície/volume e pela difusão intracelular, o que explica por que células grandes multiplicam superfície (microvilosidades) ou contam com transporte ativo por citoesqueleto.',
    objetivos: [
      'Inferir função a partir da forma celular observada.',
      'Explicar o que mantém a polaridade e o que acontece quando ela se perde.',
    ],
  },

  'tecidos/fundamentos-dos-tecidos': {
    chamada: 'Quatro tecidos fundamentais, e todo órgão é combinação deles.',
    panorama:
      'O **epitelial** reveste e secreta: células justapostas, pouca matriz, avascular, polarizado, sobre membrana basal. O **conjuntivo** sustenta, nutre e defende: muitas células diferentes e muita matriz, vascularizado. O **muscular** contrai: células alongadas com aparato de actina e miosina, em três variedades. O **nervoso** conduz e integra: neurônios mais glia, praticamente sem matriz. A primeira pergunta diante de qualquer lâmina é qual desses quatro predomina — e a resposta vem da razão célula/matriz e da presença de membrana basal. Tudo o mais é detalhe dentro dessa escolha.',
    objetivos: [
      'Classificar qualquer campo microscópico em um dos quatro tecidos fundamentais.',
      'Usar a razão célula/matriz como primeiro critério de triagem.',
    ],
  },
}

/** Resumo do setor pelo caminho de slugs, ou `null`. */
export function resumoDoSetor(caminho: string[] | string): ResumoDeSetor | null {
  const chave = Array.isArray(caminho) ? caminho.join('/') : caminho
  return RESUMOS[chave] ?? null
}

export const TOTAL_DE_RESUMOS = Object.keys(RESUMOS).length
