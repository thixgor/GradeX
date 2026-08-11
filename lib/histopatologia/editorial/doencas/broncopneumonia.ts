import type { DoencaCanonicaEntrada } from '../../esquemas'

export const broncopneumonia: DoencaCanonicaEntrada = {
  id: 'broncopneumonia',
  slug: 'broncopneumonia',
  nome: 'Broncopneumonia aguda',
  sinonimos: ['pneumonia lobular', 'pneumonia supurativa multifocal'],
  sinonimosEmIngles: ['bronchopneumonia', 'lobular pneumonia'],
  sistemaId: 'respiratorio',
  orgaos: ['Pulmão', 'Bronquíolos', 'Alvéolos'],
  natureza: 'nao-neoplasica',
  catalogoIds: [
    'unicamp-broncopneumonia-exemplo-de-inflamacao-aguda-serofibrinosa-lam-a-209-8942b54c70',
  ],
  mecanismoIds: ['inflamacao-aguda', 'reparo-fibrose'],
  padroesMorfologicos: [
    'consolidação peribronquiolar multifocal',
    'neutrófilos nos espaços aéreos',
    'exsudato serofibrinoso',
    'distribuição lobular e confluente',
  ],
  conteudo: {
    objetivos: [
      'Reconhecer a distribuição multifocal centrada em bronquíolos e sua progressão para alvéolos.',
      'Relacionar exsudato neutrofílico, consolidação e prejuízo da troca gasosa.',
      'Distinguir broncopneumonia de pneumonia lobar, dano alveolar difuso e edema pulmonar.',
      'Procurar necrose, abscesso, organização e sinais morfológicos que indiquem complicação.',
    ],
    definicao:
      'Padrão de pneumonia aguda em que focos supurativos ou serofibrinosos, geralmente centrados em bronquíolos, espalham-se para grupos de alvéolos adjacentes. Os focos têm idades e extensões diferentes, podem permanecer separados ou confluir e, quando numerosos, reduzem de modo importante a área pulmonar ventilada.',
    etiologias: [
      {
        agente: 'Bactérias piogênicas aspiradas ou inaladas',
        categoria: 'infecciosa',
        explicacao:
          'Microrganismos alcançam pequenas vias aéreas, aderem ao epitélio e ativam macrófagos residentes. A resposta inata recruta neutrófilos e produz exsudato que se propaga pelos bronquíolos e poros alveolares.',
      },
      {
        agente: 'Aspiração de conteúdo orofaríngeo ou gástrico com infecção secundária',
        categoria: 'infecciosa',
        explicacao:
          'Material aspirado lesa quimicamente a via aérea distal e transporta flora polimicrobiana; a distribuição tende a acompanhar segmentos dependentes da gravidade e pode evoluir com necrose e abscesso.',
      },
    ],
    fatoresDeRisco: [
      {
        fator: 'Extremos de idade, fragilidade ou imobilização prolongada',
        porQue:
          'Tosse menos eficaz, depuração mucociliar reduzida e menor reserva respiratória facilitam retenção de secreções e disseminação peribronquiolar da infecção.',
        forca: 'estabelecido',
      },
      {
        fator: 'Alteração da consciência ou disfagia',
        porQue:
          'A perda dos reflexos de proteção permite que secreção contaminada e conteúdo gástrico alcancem bronquíolos e alvéolos em territórios dependentes.',
        forca: 'estabelecido',
      },
      {
        fator: 'Obstrução brônquica e doença pulmonar crônica',
        porQue:
          'Muco retido distalmente à obstrução funciona como meio de crescimento, enquanto dano estrutural e depuração deficiente impedem a eliminação do agente.',
        forca: 'estabelecido',
      },
    ],
    histologiaNormalDeReferencia: [
      {
        titulo: 'Alvéolos normais — espaço aéreo e barreira ar-sangue',
        caminhoNormal: [
          'orgaos-e-sistemas',
          'sistema-respiratorio',
          'intrapulmonary-passageways',
          'sistema-respiratorio',
          'alveoli',
        ],
        oQueObservar:
          'Espaços aéreos abertos, septos muito delgados e poucos macrófagos livres. Na broncopneumonia, o ar é substituído por líquido rico em proteína, fibrina, neutrófilos e debris, aumentando radicalmente a distância de difusão do oxigênio.',
        aproximado: false,
      },
    ],
    mecanismoPatologicoGeral: [
      {
        mecanismoId: 'inflamacao-aguda',
        aplicacao:
          'Macrófagos reconhecem produtos microbianos e liberam citocinas; vasos septais tornam-se permeáveis e neutrófilos migram para bronquíolos e alvéolos. O exsudato elimina agentes, mas ocupa o espaço que deveria conter ar e pode lesar o parênquima.',
      },
      {
        mecanismoId: 'reparo-fibrose',
        aplicacao:
          'Quando o exsudato não é removido, fibroblastos e capilares invadem fibrina intra-alveolar. Essa organização converte material potencialmente reabsorvível em tecido conjuntivo, deixando focos de fibrose e distorção arquitetural.',
      },
    ],
    fisiopatologiaEspecifica: [
      {
        etapa: 'gatilho',
        titulo: 'Agente alcança bronquíolos terminais e respiratórios',
        porQue:
          'Inalação, microaspiração ou aspiração maciça deposita microrganismos em vias aéreas distais, sobretudo quando os mecanismos mecânicos de defesa estão comprometidos.',
      },
      {
        etapa: 'alvo',
        titulo: 'Epitélio bronquiolar e macrófago alveolar reconhecem perigo',
        porQue:
          'Receptores da imunidade inata detectam estruturas microbianas e dano celular, iniciando uma resposta localizada ao redor da via aérea infectada.',
      },
      {
        etapa: 'resposta-celular',
        titulo: 'Neutrófilos são recrutados da microcirculação septal',
        porQue:
          'Quimiocinas e complemento promovem adesão, diapedese e quimiotaxia; as células liberam proteases, espécies reativas e redes extracelulares contra o agente.',
      },
      {
        etapa: 'resposta-tecidual',
        titulo: 'Forma-se exsudato serofibrinoso e supurativo',
        porQue:
          'A permeabilidade vascular permite saída de água, fibrinogênio e outras proteínas, enquanto neutrófilos e debris se acumulam na luz bronquiolar e alveolar.',
        achadoAssociado: 'Alvéolos preenchidos por neutrófilos, fibrina e edema.',
      },
      {
        etapa: 'morfologia',
        titulo: 'Focos peribronquiolares se expandem e confluem',
        porQue:
          'Exsudato atravessa vias aéreas pequenas e comunicações interalveolares, produzindo lóbulos consolidados separados por parênquima ainda aerado.',
      },
      {
        etapa: 'disfuncao',
        titulo: 'A consolidação cria desequilíbrio ventilação-perfusão',
        porQue:
          'Capilares continuam perfundindo unidades cujos alvéolos não recebem ar, gerando efeito de shunt, hipoxemia e aumento do trabalho respiratório.',
      },
      {
        etapa: 'complicacao',
        titulo: 'Necrose, abscesso, bacteremia ou organização',
        porQue:
          'Agentes virulentos e defesa insuficiente destroem paredes alveolares; persistência permite extensão pleural, entrada vascular ou substituição do exsudato por fibrose.',
      },
    ],
    macroscopia: [
      {
        achado: 'Focos múltiplos, mal delimitados, vermelho-acinzentados e firmes',
        processo: 'Preenchimento de bronquíolos e alvéolos por exsudato inflamatório em territórios lobulares.',
        consequencia: 'O padrão salpicado e basal bilateral favorece broncopneumonia, mas focos confluentes podem simular consolidação lobar.',
        peso: 'sugestivo',
      },
      {
        achado: 'Secreção purulenta exprimível de pequenas vias aéreas',
        processo: 'Acúmulo de neutrófilos, muco e debris no centro bronquiolar.',
        consequencia: 'Orienta amostragem e cultura; necrose ou cavidade exige pesquisa dirigida de abscesso e aspiração.',
        peso: 'frequente',
      },
    ],
    histopatologia: {
      panoramica: {
        procure:
          'Mapeie a relação dos focos com bronquíolos, compare áreas consolidadas e aeradas e avalie pleura, vasos e cavidades.',
        achados: [
          {
            achado: 'Consolidações multifocais de distribuição bronquiolocêntrica',
            processo: 'Propagação desigual da infecção a partir de pequenas vias aéreas para lóbulos adjacentes.',
            consequencia: 'A heterogeneidade espacial e temporal separa o padrão broncopneumônico da consolidação lobar uniforme.',
            peso: 'sugestivo',
          },
        ],
      },
      pequeno: {
        procure:
          'Identifique a via aérea central de cada foco e observe como o exsudato ocupa alvéolos próximos, poupando territórios entre eles.',
        achados: [
          {
            achado: 'Bronquíolo preenchido por exsudato com extensão aos alvéolos vizinhos',
            processo: 'Bronquiolite infecciosa serve como centro de disseminação lobular do processo agudo.',
            consequencia: 'Estabelece o padrão de broncopneumonia e orienta a busca de material aspirado ou obstrução.',
            peso: 'necessário',
          },
        ],
      },
      medio: {
        procure:
          'Caracterize as proporções de neutrófilos, fibrina, edema e hemácias e verifique se os septos permanecem íntegros.',
        achados: [
          {
            achado: 'Alvéolos contendo neutrófilos, fibrina e líquido proteináceo',
            processo: 'Resposta vascular exsudativa e migração leucocitária para o território infectado.',
            consequencia: 'A ocupação do espaço aéreo explica a consolidação radiológica e a hipoxemia clínica.',
            peso: 'necessário',
          },
          {
            achado: 'Congestão capilar e edema dos septos sem membranas hialinas difusas',
            processo: 'Vasodilatação local e aumento de permeabilidade acompanham a inflamação infecciosa focal.',
            consequencia: 'A distribuição focal e a ausência de dano alveolar difuso ajudam a afastar síndrome do desconforto respiratório agudo isolada.',
            peso: 'frequente',
          },
        ],
      },
      grande: {
        procure:
          'Examine neutrófilos e macrófagos, procure colônias, material vegetal, necrose septal, trombos e organização fibroblástica.',
        achados: [
          {
            achado: 'Neutrófilos degenerados misturados a debris celulares e microrganismos ocasionais',
            processo: 'Fagocitose e liberação de enzimas microbicidas produzem pus e dano colateral no espaço aéreo.',
            consequencia: 'Colônias ou estruturas aspiradas orientam etiologia, mas cultura e correlação clínica continuam necessárias.',
            peso: 'sugestivo',
          },
          {
            achado: 'Broto fibroblástico organizando fibrina intra-alveolar',
            processo: 'Falha da depuração do exsudato permite crescimento de tecido de granulação dentro do alvéolo.',
            consequencia: 'Indica fase de organização e risco de sequela fibrosa, não necessariamente infecção ainda ativa.',
            peso: 'frequente',
          },
        ],
      },
      sintese:
        'O diagnóstico morfológico combina distribuição bronquiolocêntrica multifocal com preenchimento neutrofílico e fibrinoso de bronquíolos e alvéolos. A lâmina deve ainda responder se existe necrose, abscesso, aspiração, envolvimento pleural, trombose ou organização, porque esses achados refinam a causa, a fase e o risco clínico.',
    },
    coloracoesEspeciais: [
      {
        nome: 'Gram, Grocott/GMS e PAS conforme o contexto',
        tipo: 'coloracao',
        pergunta: 'Há bactérias ou fungos demonstráveis no foco inflamatório?',
        padraoEsperado: 'Microrganismos corados no exsudato, na necrose ou no interior de fagócitos.',
        controles: 'Controles externos positivos adequados para cada método.',
        limitacoes: [
          'Antibioticoterapia prévia reduz a carga e a sensibilidade.',
          'Precipitado e material aspirado podem simular microrganismos.',
          'A coloração não substitui cultura nem teste molecular.',
        ],
        mudaODiferencial:
          'Um agente demonstrado direciona o diagnóstico etiológico; resultado negativo não exclui pneumonia infecciosa e deve ser interpretado com cultura e história terapêutica.',
      },
    ],
    correlacaoClinica: [
      {
        achadoMorfologico: 'Alvéolos consolidados ainda perfundidos',
        consequenciaFuncional: 'Shunt intrapulmonar e queda da oxigenação arterial.',
        manifestacao: 'Dispneia, taquipneia, crepitações e hipoxemia.',
      },
      {
        achadoMorfologico: 'Exsudato neutrofílico comunicado com a via aérea',
        consequenciaFuncional: 'Secreção inflamatória é mobilizada pela tosse.',
        manifestacao: 'Tosse produtiva com escarro purulento e febre.',
      },
    ],
    diagnosticosDiferenciais: [
      {
        nome: 'Pneumonia lobar',
        motivoDaConfusao: 'Também preenche alvéolos com neutrófilos e fibrina e pode produzir consolidação extensa.',
        achadosCompartilhados: ['exsudato intra-alveolar', 'congestão', 'fibrina', 'neutrófilos'],
        discriminador: 'Na pneumonia lobar, a consolidação tende a ser contínua e relativamente uniforme em grande parte de um lobo; na broncopneumonia, focos bronquiolocêntricos alternam com pulmão aerado.',
        exameQueResolve: 'Correlação do mapa histológico com a distribuição radiológica e macroscópica.',
      },
      {
        nome: 'Dano alveolar difuso',
        motivoDaConfusao: 'Edema, fibrina e inflamação podem acompanhar insuficiência respiratória grave.',
        achadosCompartilhados: ['edema alveolar', 'congestão septal', 'fibrina'],
        discriminador: 'Membranas hialinas difusas e hiperplasia de pneumócitos tipo II sem supuração bronquiolocêntrica favorecem dano alveolar difuso.',
        exameQueResolve: 'Amostragem ampla e correlação com evolução temporal da síndrome respiratória.',
      },
      {
        nome: 'Edema pulmonar cardiogênico',
        motivoDaConfusao: 'Espaços alveolares são preenchidos por líquido e pode haver hemorragia focal.',
        achadosCompartilhados: ['edema intra-alveolar', 'congestão capilar'],
        discriminador: 'Líquido róseo pouco celular, distribuição mais difusa e macrófagos com hemossiderina contrastam com focos neutrofílicos centrados em bronquíolos.',
        exameQueResolve: 'Coloração para ferro e correlação com disfunção cardíaca e imagem.',
      },
      {
        nome: 'Pneumonia em organização',
        motivoDaConfusao: 'Pode surgir após infecção e manter opacidades pulmonares multifocais.',
        achadosCompartilhados: ['fibrina', 'macrófagos', 'distribuição em focos'],
        discriminador: 'Plugues fibroblásticos intra-alveolares e bronquiolares predominam sobre neutrófilos; a arquitetura fica preservada e o agente pode já ter desaparecido.',
        exameQueResolve: 'Avaliação da fase histológica em múltiplos fragmentos e correlação temporal.',
      },
    ],
    complicacoes: [
      {
        complicacao: 'Abscesso pulmonar',
        mecanismo: 'Necrose liquefativa destrói septos e cria cavidade preenchida por pus, especialmente em aspiração ou agentes virulentos.',
      },
      {
        complicacao: 'Empiema pleural',
        mecanismo: 'Extensão de foco subpleural leva microrganismos e neutrófilos à cavidade pleural, onde o exsudato pode locular e organizar.',
      },
      {
        complicacao: 'Bacteremia e focos metastáticos',
        mecanismo: 'Invasão de capilares pulmonares permite disseminação hematogênica, sepse e implantação infecciosa em outros órgãos.',
      },
      {
        complicacao: 'Organização e fibrose focal',
        mecanismo: 'Fibrina persistente é invadida por fibroblastos e convertida em tecido conjuntivo que reduz a complacência local.',
      },
    ],
    normalVersusPatologico: [
      {
        aspecto: 'Espaço alveolar',
        normal: 'Aberto e preenchido por ar, com raros macrófagos livres.',
        patologico: 'Ocupado por neutrófilos, fibrina, edema e debris, sem ventilação efetiva.',
      },
      {
        aspecto: 'Distribuição',
        normal: 'Parênquima uniformemente aerado ao redor das pequenas vias aéreas.',
        patologico: 'Focos consolidados centrados em bronquíolos alternam com áreas relativamente preservadas.',
      },
      {
        aspecto: 'Septo alveolar',
        normal: 'Muito delgado, com capilar aderido ao epitélio.',
        patologico: 'Congesto e edemaciado; pode sofrer necrose nos focos mais agressivos.',
      },
    ],
    resumoDeProva: [
      'Broncopneumonia é padrão multifocal bronquiolocêntrico; pneumonia lobar é consolidação mais uniforme.',
      'A hipoxemia decorre de perfusão de alvéolos preenchidos por exsudato e sem ventilação.',
      'Neutrófilos e fibrina definem fase aguda; fibroblastos intra-alveolares indicam organização.',
      'Sempre procure aspiração, necrose, abscesso, empiema e envolvimento vascular.',
    ],
    armadilhas: [
      'Inferir o microrganismo apenas pela morfologia do exsudato.',
      'Confundir foco confluente com pneumonia lobar sem mapear a relação com bronquíolos.',
      'Chamar organização de infecção ativa sem procurar neutrófilos e agente.',
      'Ignorar material aspirado em territórios dependentes do pulmão.',
    ],
    perguntasDeAutoavaliacao: [
      {
        pergunta: 'Qual achado melhor sustenta o padrão de broncopneumonia?',
        alternativas: [
          'Focos neutrofílicos centrados em bronquíolos, alternando com parênquima aerado.',
          'Membranas hialinas difusas em todos os lobos.',
          'Edema róseo acelular com macrófagos siderófagos.',
          'Granulomas compactos não necrosantes ao longo de linfáticos.',
        ],
        indiceCorreto: 0,
        devolutiva:
          'A broncopneumonia começa em pequenas vias aéreas e se espalha para alvéolos próximos, formando focos de idades diferentes. As demais alternativas descrevem dano alveolar difuso, edema cardiogênico e sarcoidose.',
        nivel: 'essencial',
      },
      {
        pergunta: 'Por que a broncopneumonia extensa causa hipoxemia?',
        alternativas: [
          'Porque alvéolos com exsudato continuam perfundidos, mas não ventilam adequadamente.',
          'Porque todos os capilares pulmonares ficam trombosados.',
          'Porque a hemoglobina perde permanentemente a afinidade por oxigênio.',
          'Porque a pleura deixa de produzir líquido seroso.',
        ],
        indiceCorreto: 0,
        devolutiva:
          'O exsudato substitui o ar e cria unidades com perfusão preservada e ventilação baixa ou ausente. Esse desequilíbrio ventilação-perfusão, próximo de um shunt, reduz a oxigenação arterial.',
        nivel: 'aprofundar',
      },
    ],
    referencias: [
      {
        citacao:
          'Jain V, Vashisht R, Yilmaz G, Bhardwaj A. Pneumonia Pathology. StatPearls Publishing; atualização contínua. Revisão da resposta inflamatória e dos padrões morfológicos de pneumonia.',
        url: 'https://www.ncbi.nlm.nih.gov/sites/books/NBK526116/',
        organizacao: 'National Center for Biotechnology Information',
        ano: 2025,
      },
      {
        citacao:
          'Macfarlane JT et al. Comparative radiographic and pathological features of community-acquired pneumonia. Journal of Clinical Pathology. Estudo anatomopatológico clássico de distribuição e evolução.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC502375/',
        organizacao: 'Journal of Clinical Pathology',
        ano: 1984,
      },
    ],
  },
  revisao: {
    estado: 'revisao-medica',
    atualizadoEm: '2026-08-10',
    pendencias: ['Revisão por patologista pulmonar e infectologista.'],
    historico: [
      {
        data: '2026-08-10',
        autor: 'Edição Domine Aqui',
        nota: 'Capítulo aprofundado com integração de lâminas autorizadas e referências visuais externas.',
      },
    ],
  },
}
