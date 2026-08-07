/**
 * Dossiês de estrutura — origem embriológica, função, reconhecimento e clínica.
 *
 * ## Por que por estrutura, e não por lâmina
 *
 * "Lâmina própria" aparece marcada em 76 lâminas diferentes; "núcleo", em 75.
 * Escrever o aprofundamento por página significaria repetir o mesmo texto
 * dezenas de vezes e mantê-lo dessincronizado em cada cópia. Escrever por
 * *estrutura* significa que o aluno aprende uma vez, com profundidade, e o
 * dossiê aparece em toda lâmina onde aquela estrutura estiver marcada.
 *
 * A chave é o rótulo original em minúsculas — a mesma de `GLOSSARIO`, o que
 * mantém tradução e aprofundamento alinhados por construção.
 *
 * ## O que este conteúdo é
 *
 * Histologia de livro-texto, redigida com base na literatura consagrada
 * (Junqueira & Carneiro; Ross & Pawlina; Gartner; Moore & Persaud para
 * embriologia). Não vem do acervo de origem — é conteúdo complementar próprio.
 *
 * ## O que este conteúdo não é
 *
 * **Não passou por revisão biomédica.** Enquanto não passar, a interface exibe
 * a tarja de pendência, e nada aqui promove uma página a `publicado`. As
 * correlações clínicas são *morfológicas* — explicam o que muda na lâmina e por
 * quê — e nunca orientam conduta, dose ou diagnóstico de paciente.
 *
 * Ao acrescentar entradas: se você não sabe a origem embrionária de uma
 * estrutura, **deixe o campo fora**. Campo ausente é honesto; campo plausível e
 * errado é o único defeito deste módulo que o aluno não tem como detectar.
 */

export interface DossieDeEstrutura {
  /** Folheto embrionário e caminho de diferenciação. */
  origemEmbrionaria?: string
  /** O que a estrutura faz — função, não descrição. */
  funcao?: string
  /** Critérios de identificação na lâmina, do menor ao maior aumento. */
  comoReconhecer?: string
  /**
   * Correlações clínicas no formato "o que acontece se X".
   * Morfológicas, sempre: o que muda no tecido e por quê.
   */
  relacoesClinicas?: Array<{ situacao: string; consequencia: string }>
  /** Confusões frequentes e como desfazê-las. */
  armadilha?: string
}

export const DOSSIES: Record<string, DossieDeEstrutura> = {
  /* ═══════════════ Célula ═══════════════ */

  'nucleus': {
    origemEmbrionaria:
      'Presente em toda célula nucleada desde a primeira clivagem do zigoto; não deriva de um folheto específico.',
    funcao:
      'Abriga o DNA e comanda a expressão gênica. O tamanho e a textura da cromatina refletem diretamente quanto a célula está transcrevendo.',
    comoReconhecer:
      'Em H&E é a estrutura mais basófila da célula — roxo-azulado pela afinidade da hematoxilina pelos fosfatos do DNA. Núcleo claro e volumoso, com nucléolo evidente, indica célula ativa; núcleo pequeno, denso e escuro (picnótico) indica célula quiescente ou em morte.',
    relacoesClinicas: [
      {
        situacao: 'Neoplasia maligna',
        consequencia:
          'Aumento da relação núcleo/citoplasma, contorno nuclear irregular, hipercromasia e nucléolos proeminentes. É o conjunto de atipias que o patologista lê antes de qualquer coisa.',
      },
      {
        situacao: 'Apoptose',
        consequencia:
          'A cromatina condensa contra o envoltório (picnose), o núcleo fragmenta (cariorrexe) e some (cariólise) — nessa ordem, sem inflamação ao redor.',
      },
    ],
    armadilha:
      'Um "núcleo" isolado no meio do citoplasma pode ser corte tangencial de uma célula vizinha, não uma célula binucleada.',
  },

  'nucleolus': {
    funcao: 'Sítio de transcrição do RNA ribossômico e montagem das subunidades ribossômicas.',
    comoReconhecer:
      'Área intensamente basófila dentro do núcleo, sem membrana própria. Um nucléolo grande e único denuncia célula com alta demanda de síntese proteica — plasmócito, hepatócito, neurônio.',
    relacoesClinicas: [
      {
        situacao: 'Célula tumoral de alto grau',
        consequencia:
          'Nucléolos múltiplos e proeminentes, refletindo a demanda de ribossomos de uma célula em proliferação acelerada.',
      },
    ],
  },

  'mitochondria': {
    funcao:
      'Fosforilação oxidativa. A quantidade e a localização mapeiam onde a célula gasta ATP.',
    comoReconhecer:
      'No microscópio óptico não se vê a organela, mas sim seu efeito: acidofilia citoplasmática intensa onde há mitocôndrias abundantes. As estriações basais do túbulo contorcido proximal e do ducto estriado das glândulas salivares são mitocôndrias alinhadas entre invaginações da membrana. Ao microscópio eletrônico, as cristas.',
    relacoesClinicas: [
      {
        situacao: 'Miopatias mitocondriais',
        consequencia:
          'Acúmulo subsarcolemal de mitocôndrias anômalas produz as "fibras vermelhas rasgadas" no tricrômico de Gomori modificado.',
      },
      {
        situacao: 'Isquemia',
        consequencia:
          'Tumefação mitocondrial é das primeiras alterações ultraestruturais; se evolui para densidades floculentas na matriz, a lesão passou a irreversível.',
      },
    ],
  },

  'rer': {
    funcao:
      'Síntese de proteínas destinadas à secreção, à membrana ou às organelas. Os ribossômos aderidos dão o "rugoso".',
    comoReconhecer:
      'Basofilia citoplasmática — pela hematoxilina ligada ao RNA ribossômico, não ao DNA. É a substância de Nissl do neurônio, o citoplasma azulado do plasmócito e a região basal da célula acinosa pancreática.',
    relacoesClinicas: [
      {
        situacao: 'Plasmócito em resposta imune ativa',
        consequencia:
          'RER tão desenvolvido que o citoplasma fica francamente basófilo, com halo claro perinuclear correspondente ao Golgi.',
      },
    ],
    armadilha:
      'Basofilia citoplasmática é RER; basofilia nuclear é DNA. Confundir os dois leva a chamar de "núcleo grande" o que é citoplasma rico em ribossomos.',
  },

  'golgi apparatus': {
    funcao: 'Modificação pós-traducional, endereçamento e empacotamento de proteínas em vesículas.',
    comoReconhecer:
      'Em H&E aparece como área clara ("negativa de Golgi") junto ao núcleo, porque não se cora. No plasmócito é o halo perinuclear característico.',
  },

  /* ═══════════════ Epitélios ═══════════════ */

  'epithelium': {
    origemEmbrionaria:
      'Os três folhetos produzem epitélio: ectoderma (epiderme, córnea, epitélio oral), endoderma (revestimento do tubo digestório, respiratório, fígado, pâncreas, tireoide) e mesoderma (endotélio, mesotélio, epitélio renal e das vias genitais).',
    funcao:
      'Reveste superfícies e cavidades, forma glândulas e estabelece barreiras seletivas. É avascular: nutre-se por difusão a partir do conjuntivo subjacente.',
    comoReconhecer:
      'Células justapostas, com pouca matriz entre elas, apoiadas em membrana basal e com polaridade evidente (apical ≠ basal). Sempre procure a membrana basal antes de classificar: é ela que separa epitélio de conjuntivo.',
    relacoesClinicas: [
      {
        situacao: 'Metaplasia',
        consequencia:
          'Um epitélio maduro é substituído por outro mais resistente à agressão — pavimentoso no brônquio do fumante, colunar intestinal no esôfago do refluxo (Barrett). É adaptativo, mas amplia o risco de displasia.',
      },
      {
        situacao: 'Carcinoma in situ',
        consequencia:
          'Atipia em toda a espessura do epitélio com **membrana basal íntegra**. É essa integridade que separa in situ de invasor — e é por isso que a membrana basal é a estrutura mais decisiva da lâmina.',
      },
    ],
  },

  'simple squamous epithelium': {
    funcao:
      'Onde a prioridade é troca rápida por difusão ou deslizamento com atrito mínimo: alvéolo, endotélio, mesotélio, folheto parietal da cápsula de Bowman.',
    comoReconhecer:
      'Camada única de células achatadas; em corte só se vê o núcleo, saliente, com fina lâmina de citoplasma de cada lado.',
    relacoesClinicas: [
      {
        situacao: 'Espessamento da barreira alveolocapilar',
        consequencia:
          'Fibrose ou edema alargam a distância de difusão; o alvéolo continua ventilado mas a hematose piora — hipoxemia com hipercapnia tardia.',
      },
    ],
  },

  'simple columnar epithelium': {
    origemEmbrionaria: 'Endoderma, no tubo digestório do estômago ao reto.',
    funcao: 'Absorção e secreção. Altura da célula acompanha a intensidade da tarefa.',
    comoReconhecer:
      'Células mais altas que largas, núcleos alinhados na mesma altura (basais), borda apical frequentemente com microvilosidades.',
  },

  'pseudostratified columnar epithelium': {
    funcao:
      'Revestimento condutor das vias aéreas e de porções do trato genital masculino: todas as células tocam a membrana basal, mas só algumas alcançam a superfície.',
    comoReconhecer:
      'Núcleos em alturas diferentes sugerem estratificação — mas não há: acompanhe o citoplasma até a base e verá que toda célula chega lá.',
    relacoesClinicas: [
      {
        situacao: 'Tabagismo crônico',
        consequencia:
          'Perda de cílios e metaplasia pavimentosa: o tapete mucociliar deixa de existir, o muco acumula e a tosse produtiva se instala.',
      },
    ],
  },

  'transitional epithelium': {
    origemEmbrionaria: 'Mesoderma intermediário (seio urogenital para a uretra distal).',
    funcao:
      'Reveste a via urinária e acomoda distensão sem romper, mantendo barreira contra a urina hipertônica.',
    comoReconhecer:
      'Células superficiais grandes, em cúpula, frequentemente binucleadas. Bexiga vazia parece ter muitas camadas; distendida, poucas — é a mesma estrutura.',
  },

  'goblet cells': {
    funcao: 'Glândula unicelular que secreta mucinas, lubrificando e protegendo o epitélio.',
    comoReconhecer:
      'Formato de taça: base estreita com o núcleo comprimido, ápice dilatado por grânulos de mucinogênio. Em H&E o ápice fica vazio (a mucina se perde no processamento); em PAS, magenta intenso.',
    relacoesClinicas: [
      {
        situacao: 'Metaplasia intestinal gástrica',
        consequencia:
          'O aparecimento de células caliciformes na mucosa do estômago sinaliza agressão crônica (Helicobacter pylori) e é lesão precursora reconhecida.',
      },
      {
        situacao: 'Fibrose cística',
        consequencia:
          'O defeito no CFTR torna o muco espesso e desidratado; o epitélio permanece, mas a depuração mucociliar falha.',
      },
    ],
  },

  'basement membrane': {
    origemEmbrionaria:
      'Produção conjunta: a lâmina basal vem do epitélio, a lâmina reticular do conjuntivo subjacente.',
    funcao:
      'Ancora o epitélio, filtra seletivamente, orienta a polaridade e guia a regeneração.',
    comoReconhecer:
      'Em H&E costuma ser invisível. Aparece em PAS (magenta, por ser rica em glicoproteínas) e na impregnação argêntica.',
    relacoesClinicas: [
      {
        situacao: 'Invasão neoplásica',
        consequencia:
          'A ruptura da membrana basal é o que define carcinoma invasor. Íntegra, o mesmo grau de atipia é apenas in situ.',
      },
      {
        situacao: 'Nefropatia diabética',
        consequencia:
          'Espessamento da membrana basal glomerular com expansão mesangial; a barreira perde carga negativa e deixa passar albumina.',
      },
      {
        situacao: 'Penfigoide bolhoso',
        consequencia:
          'Autoanticorpos contra hemidesmossomos separam a epiderme na junção dermoepidérmica — bolha subepidérmica, de teto íntegro.',
      },
    ],
  },

  /* ═══════════════ Conjuntivo ═══════════════ */

  'lamina propria': {
    origemEmbrionaria: 'Mesoderma esplâncnico (mesênquima que acompanha o tubo endodérmico).',
    funcao:
      'Sustenta o epitélio da mucosa, leva sua vascularização e inervação e hospeda a primeira linha imune (MALT, plasmócitos, macrófagos).',
    comoReconhecer:
      'Faixa de conjuntivo frouxo logo abaixo do epitélio, sempre acima da muscular da mucosa. É frouxa e celular — se estiver densa e pobre em células, você provavelmente está na submucosa.',
    relacoesClinicas: [
      {
        situacao: 'Doença celíaca',
        consequencia:
          'Infiltrado linfoplasmocitário expande a lâmina própria, com atrofia das vilosidades e hiperplasia das criptas. A superfície absortiva despenca.',
      },
      {
        situacao: 'Doença inflamatória intestinal',
        consequencia:
          'Na retocolite, o infiltrado fica restrito à mucosa e lâmina própria; na doença de Crohn, atravessa toda a parede (transmural). É o critério histológico que separa as duas.',
      },
    ],
    armadilha:
      'Lâmina própria não é membrana basal nem lâmina basal, apesar do nome. É tecido conjuntivo, com vasos e células.',
  },

  'connective tissue': {
    origemEmbrionaria:
      'Mesênquima, derivado principalmente do mesoderma — mas o conjuntivo da cabeça e do pescoço vem da crista neural (ectomesênquima).',
    funcao: 'Sustentação mecânica, nutrição por difusão, defesa e reparo.',
    comoReconhecer:
      'Muita matriz e poucas células, ao contrário do epitélio. A proporção e o arranjo das fibras definem o subtipo.',
  },

  'collagen fibers': {
    funcao:
      'Resistência à tração. O colágeno I suporta carga; o III forma o arcabouço reticular; o IV compõe a lâmina basal.',
    comoReconhecer:
      'Eosinófilas em H&E, em feixes ondulados e sem ramificação. Azuis ou verdes no tricrômico de Masson — que é a coloração de escolha para avaliar fibrose.',
    relacoesClinicas: [
      {
        situacao: 'Cirrose hepática',
        consequencia:
          'Septos de colágeno subdividem o parênquima em nódulos e distorcem a vascularização, gerando hipertensão portal. O tricrômico revela a extensão que o H&E subestima.',
      },
      {
        situacao: 'Escorbuto',
        consequencia:
          'Sem vitamina C não há hidroxilação de prolina e lisina; o colágeno formado é instável — daí a fragilidade vascular, o sangramento gengival e a má cicatrização.',
      },
      {
        situacao: 'Osteogênese imperfeita',
        consequencia:
          'Defeito no colágeno tipo I: osso frágil, escleras azuladas (a coroide transparece por uma esclera fina) e dentinogênese imperfeita.',
      },
    ],
  },

  'elastic fibers': {
    funcao:
      'Devolvem a forma após deformação. Nas grandes artérias, armazenam a energia da sístole e a devolvem na diástole, mantendo o fluxo contínuo.',
    comoReconhecer:
      'Mal coradas em H&E (finas, refringentes). Precisam de orceína, resorcina-fucsina ou Verhoeff, que as revelam em castanho-escuro a preto.',
    relacoesClinicas: [
      {
        situacao: 'Síndrome de Marfam',
        consequencia:
          'Defeito na fibrilina-1 desorganiza as fibras elásticas da aorta — necrose cística da média e risco de dissecção.',
      },
      {
        situacao: 'Enfisema pulmonar',
        consequencia:
          'A elastase de neutrófilos, sem freio da alfa-1-antitripsina, destrói a elastina do septo alveolar. O pulmão perde o recolhimento elástico e as vias aéreas colapsam na expiração.',
      },
    ],
  },

  'fibroblasts': {
    origemEmbrionaria: 'Mesênquima.',
    funcao: 'Produzem e remodelam colágeno, elastina e substância fundamental.',
    comoReconhecer:
      'Núcleo fusiforme, alongado. Ativo: volumoso, claro, com nucléolo e citoplasma basófilo. Inativo (fibrócito): pequeno, denso e escuro, com citoplasma quase invisível.',
    relacoesClinicas: [
      {
        situacao: 'Cicatrização',
        consequencia:
          'Miofibroblastos aparecem por volta do 3º–5º dia e contraem a ferida. Quando persistem, produzem cicatriz hipertrófica ou queloide.',
      },
    ],
  },

  'mast cells': {
    funcao:
      'Sentinela do conjuntivo perivascular: seus grânulos guardam histamina, heparina e proteases.',
    comoReconhecer:
      'Grânulos metacromáticos — com azul de toluidina viram púrpura-avermelhados, não azuis. Em H&E passam facilmente despercebidos.',
    relacoesClinicas: [
      {
        situacao: 'Anafilaxia',
        consequencia:
          'Degranulação maciça mediada por IgE: vasodilatação, aumento da permeabilidade e broncoconstrição em minutos.',
      },
    ],
  },

  'macrophages': {
    origemEmbrionaria:
      'Duas origens: os residentes (Kupffer, micróglia, Langerhans) vêm do saco vitelino e se automantêm; os recrutados derivam de monócitos da medula óssea.',
    funcao: 'Fagocitose, apresentação de antígeno e coordenação do reparo.',
    comoReconhecer:
      'Contorno irregular, citoplasma abundante e muitas vezes com material fagocitado. Frequentemente só se identifica pelo que engoliu — pigmento, hemossiderina, lipídio.',
    relacoesClinicas: [
      {
        situacao: 'Inflamação granulomatosa',
        consequencia:
          'Macrófagos ativados assumem aspecto epitelioide e fundem-se em células gigantes multinucleadas — o granuloma da tuberculose, da sarcoidose e das micoses profundas.',
      },
      {
        situacao: 'Aterosclerose',
        consequencia:
          'Macrófagos captam LDL oxidada e viram células espumosas; sua morte forma o centro necrótico lipídico da placa.',
      },
    ],
  },

  'adipocytes': {
    origemEmbrionaria: 'Mesênquima, a partir de precursores comuns aos fibroblastos.',
    funcao: 'Reserva energética, isolamento térmico, proteção mecânica e função endócrina (leptina, adiponectina).',
    comoReconhecer:
      'Em H&E de rotina o lipídio é dissolvido pelos solventes e sobra um vacúolo vazio com o núcleo comprimido na periferia — o aspecto de "anel de sinete". Para ver a gordura é preciso corte por congelação com Sudan ou óleo vermelho O.',
  },

  /* ═══════════════ Osso e cartilagem ═══════════════ */

  'osteocytes': {
    origemEmbrionaria:
      'Mesênquima (ossificação intramembranosa) ou pericôndrio/cartilagem (endocondral); na face, de origem em crista neural.',
    funcao:
      'Mecanossensores do osso: percebem deformação e sinalizam para osteoblastos e osteoclastos, além de participarem da homeostase do cálcio.',
    comoReconhecer:
      'Células aprisionadas em lacunas, conectadas por prolongamentos em canalículos. Lacuna vazia indica osso não viável.',
    relacoesClinicas: [
      {
        situacao: 'Osteonecrose',
        consequencia:
          'Lacunas vazias em osso preservado no restante — o achado que confirma necrose isquêmica.',
      },
    ],
  },

  'osteoclasts': {
    origemEmbrionaria: 'Linhagem monocítica/macrofágica da medula óssea — não do mesênquima ósseo.',
    funcao: 'Reabsorvem matriz mineralizada, acidificando o microambiente sob a borda pregueada.',
    comoReconhecer:
      'Células grandes e multinucleadas, acidófilas, alojadas em depressões da superfície óssea (lacunas de Howship).',
    relacoesClinicas: [
      {
        situacao: 'Osteoporose',
        consequencia:
          'Desequilíbrio entre reabsorção e formação afina as trabéculas e rompe suas conexões. A perda de conectividade trabecular explica a fragilidade melhor que a densidade isolada.',
      },
      {
        situacao: 'Hiperparatireoidismo',
        consequencia:
          'PTH elevado estimula indiretamente os osteoclastos (via osteoblastos e RANKL), gerando reabsorção subperiosteal e, no extremo, tumores marrons.',
      },
    ],
  },

  'hyaline cartilage': {
    origemEmbrionaria: 'Mesênquima, por condensação e diferenciação em condroblastos.',
    funcao:
      'Superfície articular de baixo atrito, molde do osso endocondral e sustentação flexível das vias aéreas.',
    comoReconhecer:
      'Matriz homogênea e basófila, condrócitos em lacunas e frequentemente em grupos isógenos. Avascular — o que explica sua má capacidade de reparo.',
    relacoesClinicas: [
      {
        situacao: 'Osteoartrite',
        consequencia:
          'Perda de proteoglicanos, fibrilação da superfície e exposição do osso subcondral, que eburna. Sendo avascular e sem pericôndrio na face articular, a cartilagem praticamente não regenera.',
      },
    ],
  },

  /* ═══════════════ Músculo ═══════════════ */

  'skeletal muscle': {
    origemEmbrionaria: 'Miótomo dos somitos (mesoderma paraxial); a musculatura da cabeça vem dos arcos faríngeos.',
    funcao: 'Contração voluntária, rápida e sob controle somático.',
    comoReconhecer:
      'Fibras cilíndricas, longas, com estriações transversais e **núcleos múltiplos na periferia**, logo abaixo do sarcolema.',
    relacoesClinicas: [
      {
        situacao: 'Distrofia de Duchenne',
        consequencia:
          'Ausência de distrofina desestabiliza o sarcolema: fibras em degeneração e regeneração, variação de calibre, núcleos internalizados e substituição progressiva por tecido adiposo e fibroso.',
      },
      {
        situacao: 'Denervação',
        consequencia:
          'Atrofia em grupos de fibras (agrupamento fascicular), diferente da atrofia difusa por desuso.',
      },
    ],
    armadilha:
      'Núcleos periféricos = esquelético; núcleo central único + discos intercalares = cardíaco. É o critério mais rápido e mais confiável.',
  },

  'cardiac muscle': {
    origemEmbrionaria: 'Mesoderma esplâncnico do tubo cardíaco primitivo.',
    funcao: 'Contração involuntária, rítmica e sincronizada por acoplamento elétrico.',
    comoReconhecer:
      'Fibras ramificadas, estriadas, com **um ou dois núcleos centrais** e discos intercalares — linhas transversais escuras que não existem no esquelético.',
    relacoesClinicas: [
      {
        situacao: 'Infarto do miocárdio',
        consequencia:
          'Necrose de coagulação com bandas de contração nas primeiras horas, infiltrado neutrofílico em 1–3 dias, tecido de granulação na semana seguinte e cicatriz colágena ao fim de 2 meses. O cardiomiócito não regenera.',
      },
    ],
  },

  'smooth muscle': {
    origemEmbrionaria: 'Mesênquima esplâncnico; nos vasos, do mesoderma local e, no arco aórtico, da crista neural.',
    funcao: 'Contração involuntária, lenta e sustentada, com baixo custo energético.',
    comoReconhecer:
      'Fusiformes, sem estriações, com núcleo único, central e alongado — que assume aspecto de "saca-rolhas" quando a célula está contraída.',
    relacoesClinicas: [
      {
        situacao: 'Asma',
        consequencia:
          'Hipertrofia e hiperplasia do músculo liso brônquico somam-se à hipersecreção e ao espessamento da membrana basal, estreitando a via aérea de forma progressivamente menos reversível.',
      },
      {
        situacao: 'Hipertensão arterial',
        consequencia:
          'Espessamento da túnica média por hipertrofia das células musculares lisas, com redução da luz e aumento da resistência periférica — um ciclo que se retroalimenta.',
      },
    ],
  },

  /* ═══════════════ Nervoso ═══════════════ */

  'axon': {
    origemEmbrionaria: 'Tubo neural (SNC) ou crista neural (gânglios e nervos periféricos).',
    funcao: 'Conduz o potencial de ação do corpo celular ao terminal.',
    comoReconhecer:
      'Prolongamento único, de calibre uniforme, sem substância de Nissl — a ausência de Nissl no cone de implantação é o que distingue axônio de dendrito.',
    relacoesClinicas: [
      {
        situacao: 'Secção de nervo periférico',
        consequencia:
          'Degeneração walleriana distal ao corte; as células de Schwann sobrevivem e formam as bandas de Büngner, que guiam o rebrote a ~1 mm/dia. No SNC não há esse guia, e por isso não há regeneração funcional.',
      },
    ],
  },

  'myelin sheath': {
    funcao: 'Isolamento elétrico que permite condução saltatória, multiplicando a velocidade sem aumentar o calibre.',
    comoReconhecer:
      'Em H&E, halo claro em volta do axônio — a mielina é lipídica e se dissolve no processamento. Preservada e preta no tetróxido de ósmio ou no Luxol fast blue.',
    relacoesClinicas: [
      {
        situacao: 'Esclerose múltipla',
        consequencia:
          'Placas de desmielinização com axônios relativamente preservados no início; a condução saltatória se perde e o déficit aparece antes de qualquer perda axonal.',
      },
      {
        situacao: 'Síndrome de Guillain-Barré',
        consequencia:
          'Desmielinização segmentar periférica com infiltrado inflamatório perivascular — fraqueza ascendente e arreflexia.',
      },
    ],
  },

  /* ═══════════════ Vasos ═══════════════ */

  'tunica media': {
    origemEmbrionaria: 'Mesoderma local; nos grandes vasos da base do coração, com contribuição da crista neural.',
    funcao:
      'Controla o calibre. Elástica nas artérias de condução (amortece a sístole) e muscular nas de distribuição (regula o fluxo regional).',
    comoReconhecer:
      'Camada média, entre as lâminas elásticas interna e externa. Nas artérias musculares predomina músculo liso circular; na aorta, lamelas elásticas concêntricas.',
    relacoesClinicas: [
      {
        situacao: 'Aterosclerose',
        consequencia:
          'A placa cresce na íntima, mas a média sofre atrofia sob ela; em aneurismas, a destruição da média é o que permite a dilatação.',
      },
      {
        situacao: 'Dissecção aórtica',
        consequencia:
          'O sangue penetra na média através de uma laceração intimal e disseca a parede longitudinalmente, criando falsa luz.',
      },
    ],
  },

  'capillaries': {
    funcao: 'Único ponto da circulação onde há troca efetiva de gases, nutrientes e metabólitos.',
    comoReconhecer:
      'Tubos do calibre de uma hemácia, com parede formada por endotélio e lâmina basal. Muitas vezes só se reconhece pela hemácia dentro.',
    relacoesClinicas: [
      {
        situacao: 'Diabetes mellitus',
        consequencia:
          'Microangiopatia com espessamento da membrana basal capilar — retinopatia, nefropatia e neuropatia derivam desse mesmo mecanismo.',
      },
    ],
    armadilha:
      'Capilar contínuo (músculo, SNC), fenestrado (glomérulo, intestino, endócrino) e sinusoide (fígado, baço, medula) diferem pela permeabilidade — e o tipo é previsível pela função do órgão.',
  },

  'endothelium': {
    origemEmbrionaria: 'Mesoderma, a partir de angioblastos.',
    funcao:
      'Barreira seletiva, superfície antitrombogênica e regulador do tônus vascular (óxido nítrico, endotelina).',
    comoReconhecer: 'Camada única de células pavimentosas revestindo a luz; núcleos achatados fazem saliência para dentro do vaso.',
    relacoesClinicas: [
      {
        situacao: 'Disfunção endotelial',
        consequencia:
          'Perda da produção de óxido nítrico e ganho de moléculas de adesão — é o evento iniciador da aterosclerose, anterior a qualquer placa visível.',
      },
    ],
  },

  /* ═══════════════ Digestório ═══════════════ */

  'mucosa': {
    origemEmbrionaria:
      'Epitélio de endoderma (do esôfago ao reto); lâmina própria e muscular da mucosa, do mesoderma esplâncnico.',
    funcao: 'Interface com a luz: absorve, secreta e protege.',
    comoReconhecer:
      'Sempre três camadas — epitélio, lâmina própria e muscular da mucosa. Contá-las é o que garante que você não confundiu mucosa com submucosa.',
  },

  'muscularis mucosae': {
    funcao:
      'Fina camada muscular lisa que move a mucosa localmente, alterando a superfície de contato com o conteúdo luminal.',
    comoReconhecer: 'Linha fina de músculo liso que fecha a mucosa e a separa da submucosa — é o marco anatômico que orienta toda a leitura da parede.',
    relacoesClinicas: [
      {
        situacao: 'Estadiamento de neoplasia digestiva',
        consequencia:
          'A profundidade da invasão em relação à muscular da mucosa e à muscular externa define o T do estadiamento — e com ele o prognóstico e a conduta.',
      },
    ],
  },

  'intestinal glands': {
    funcao:
      'Criptas de Lieberkühn: abrigam as células-tronco que renovam todo o epitélio intestinal a cada 4–6 dias, além de células de Paneth e enteroendócrinas.',
    comoReconhecer: 'Invaginações tubulares simples da mucosa, perpendiculares à superfície.',
    relacoesClinicas: [
      {
        situacao: 'Quimioterapia e radioterapia',
        consequencia:
          'As células-tronco das criptas estão entre as mais proliferativas do corpo, o que as torna alvo preferencial — daí a mucosite e a diarreia como toxicidade previsível.',
      },
    ],
  },

  'villi': {
    origemEmbrionaria: 'Evaginações do endoderma com eixo de mesoderma esplâncnico.',
    funcao: 'Multiplicam a superfície absortiva; junto com pregas circulares e microvilosidades, ampliam a área em cerca de 600 vezes.',
    comoReconhecer: 'Projeções digitiformes para a luz, com eixo de lâmina própria contendo vaso quilífero central.',
    relacoesClinicas: [
      {
        situacao: 'Doença celíaca',
        consequencia:
          'Atrofia vilositária com hiperplasia de criptas e linfócitos intraepiteliais aumentados. A relação vilosidade/cripta, normalmente 3:1 a 5:1, se inverte.',
      },
    ],
  },

  'parietal cells': {
    funcao: 'Secretam ácido clorídrico e fator intrínseco.',
    comoReconhecer:
      'Células grandes, arredondadas e intensamente acidófilas (eosinofílicas) — a acidofilia vem da enorme quantidade de mitocôndrias. Ficam no terço médio da glândula fúndica.',
    relacoesClinicas: [
      {
        situacao: 'Gastrite autoimune',
        consequencia:
          'Destruição das células parietais causa acloridria e, por falta de fator intrínseco, má absorção de B12 — anemia perniciosa com degeneração combinada subaguda da medula.',
      },
    ],
  },

  'hepatocytes': {
    origemEmbrionaria: 'Endoderma do divertículo hepático (broto do intestino anterior).',
    funcao: 'Metabolismo intermediário, detoxificação, síntese de proteínas plasmáticas e produção de bile.',
    comoReconhecer:
      'Células poliédricas em cordões radiais, com núcleo central e frequentemente binucleadas. Citoplasma granular, muitas vezes vacuolado por glicogênio e lipídio.',
    relacoesClinicas: [
      {
        situacao: 'Esteatose hepática',
        consequencia:
          'Acúmulo de triglicerídeos em vacúolos que deslocam o núcleo (macrovesicular). Reversível, mas com inflamação passa a esteato-hepatite e depois a fibrose.',
      },
      {
        situacao: 'Hepatite viral aguda',
        consequencia:
          'Degeneração balonizante, corpos acidófilos (de Councilman, hepatócitos em apoptose) e infiltrado mononuclear portal.',
      },
    ],
  },

  /* ═══════════════ Respiratório ═══════════════ */

  'alveoli': {
    origemEmbrionaria: 'Endoderma do broto pulmonar; septos e vasos, do mesoderma esplâncnico.',
    funcao: 'Sítio da hematose. Pneumócitos tipo I fazem a barreira; tipo II produzem surfactante e repovoam o epitélio.',
    comoReconhecer:
      'Espaços arredondados de parede finíssima, separados por septos com capilares. O tipo II é cúbico e saliente, nos ângulos do alvéolo.',
    relacoesClinicas: [
      {
        situacao: 'Prematuridade',
        consequencia:
          'Surfactante insuficiente (produzido a partir de ~24 semanas, adequado por volta de 34) eleva a tensão superficial e colapsa o alvéolo — doença da membrana hialina.',
      },
      {
        situacao: 'Enfisema',
        consequencia:
          'Destruição dos septos funde alvéolos em espaços amplos: menos superfície de troca e perda do recolhimento elástico que mantém as vias aéreas abertas.',
      },
    ],
  },

  /* ═══════════════ Urinário ═══════════════ */

  'glomerulus': {
    origemEmbrionaria: 'Mesoderma intermediário — o metanefro, a partir do blastema metanéfrico.',
    funcao:
      'Filtração do plasma através de barreira tripla: endotélio fenestrado, membrana basal glomerular e fendas entre pedicelos dos podócitos.',
    comoReconhecer: 'Novelo capilar dentro da cápsula de Bowman, com polo vascular e polo urinário identificáveis.',
    relacoesClinicas: [
      {
        situacao: 'Síndrome nefrótica',
        consequencia:
          'Lesão da barreira (sobretudo dos podócitos) deixa passar proteína: proteinúria maciça, hipoalbuminemia e edema. Na doença de lesões mínimas, o achado só aparece na microscopia eletrônica — fusão dos pedicelos.',
      },
      {
        situacao: 'Síndrome nefrítica',
        consequencia:
          'Inflamação com proliferação celular e ruptura capilar: hematúria com cilindros hemáticos, oligúria e hipertensão.',
      },
    ],
  },

  'proximal convoluted tubule': {
    funcao: 'Reabsorve cerca de dois terços do filtrado — sódio, água, glicose e aminoácidos — por transporte ativo.',
    comoReconhecer:
      'Luz irregular pela borda em escova proeminente, citoplasma intensamente acidófilo (mitocôndrias) e menos núcleos visíveis por corte que no túbulo distal.',
    relacoesClinicas: [
      {
        situacao: 'Necrose tubular aguda',
        consequencia:
          'O túbulo proximal é o segmento mais vulnerável à isquemia e a nefrotóxicos, por sua altíssima demanda de ATP. Perda da borda em escova é sinal precoce.',
      },
    ],
    armadilha:
      'Proximal e distal se distinguem pela borda em escova e pela contagem de núcleos: o distal tem luz nítida e mais núcleos por circunferência.',
  },

  /* ═══════════════ Pele ═══════════════ */

  'epidermis': {
    origemEmbrionaria: 'Ectoderma de superfície; melanócitos e nervos, da crista neural.',
    funcao: 'Barreira física, química e imunológica; renova-se por completo em cerca de 28 dias.',
    comoReconhecer:
      'Epitélio estratificado pavimentoso queratinizado, com estratos basal, espinhoso, granuloso e córneo — e o lúcido apenas na pele espessa.',
    relacoesClinicas: [
      {
        situacao: 'Psoríase',
        consequencia:
          'Aceleração do turnover: acantose, paraceratose (núcleos retidos no córneo), perda do estrato granuloso e microabscessos de Munro.',
      },
      {
        situacao: 'Queimadura de 2º grau',
        consequencia:
          'A separação ocorre acima da camada basal ou na derme superficial; como os anexos sobrevivem, a reepitelização parte deles e a cicatriz é mínima.',
      },
    ],
  },

  'melanocytes': {
    origemEmbrionaria: 'Crista neural — migram até a camada basal da epiderme durante o desenvolvimento.',
    funcao: 'Produzem melanina e a transferem aos queratinócitos, protegendo o DNA da radiação ultravioleta.',
    comoReconhecer:
      'Células claras na camada basal, com halo perinuclear em H&E. A cor da pele depende do tamanho e distribuição dos melanossomos, não do número de melanócitos, que é semelhante entre indivíduos.',
    relacoesClinicas: [
      {
        situacao: 'Vitiligo',
        consequencia: 'Destruição autoimune dos melanócitos: máculas acrômicas de limite nítido, com melanócitos ausentes na basal.',
      },
      {
        situacao: 'Melanoma',
        consequencia:
          'Proliferação atípica com disseminação pagetoide para camadas superiores. A profundidade de Breslow é o principal fator prognóstico — daí a importância de medir, não só diagnosticar.',
      },
    ],
  },

  /* ═══════════════ Linfoide ═══════════════ */

  'germinal center': {
    funcao:
      'Onde linfócitos B proliferam, sofrem hipermutação somática e troca de classe, e são selecionados por afinidade.',
    comoReconhecer:
      'Região central mais clara do nódulo linfoide, com células grandes; o manto escuro em volta é de linfócitos pequenos.',
    relacoesClinicas: [
      {
        situacao: 'Linfoma folicular',
        consequencia:
          'A translocação t(14;18) superexpressa BCL-2 e bloqueia a apoptose; os folículos ficam monótonos, sem polaridade e sem macrófagos de corpos tingíveis — o oposto do centro germinativo reativo.',
      },
    ],
  },
}

/** Dossiê de uma estrutura pelo rótulo original, ou `null`. */
export function dossieDaEstrutura(rotuloOriginal: string): DossieDeEstrutura | null {
  return DOSSIES[rotuloOriginal.trim().toLowerCase()] ?? null
}

/** Quantas estruturas já têm aprofundamento escrito. */
export const TOTAL_DE_DOSSIES = Object.keys(DOSSIES).length
