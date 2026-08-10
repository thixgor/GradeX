import type { DoencaCanonicaEntrada } from '../../esquemas'

/**
 * Trombose venosa — piloto do padrão hemodinâmico.
 *
 * Está no conjunto piloto porque é o caso em que a morfologia responde a uma
 * pergunta que nenhuma outra técnica responde tão bem: *quando* isto aconteceu?
 * Linhas de Zahn, adesão à parede, organização e recanalização compõem uma
 * cronologia legível na lâmina — e a distinção entre trombo verdadeiro e coágulo
 * post mortem é uma das poucas em que a histologia decide sozinha.
 */
export const tromboseVenosa: DoencaCanonicaEntrada = {
  id: 'trombose-venosa',
  slug: 'trombose-venosa',
  nome: 'Trombose venosa',
  sinonimos: ['trombose', 'tromboflebite', 'trombose venosa profunda'],
  sinonimosEmIngles: ['venous thrombosis', 'deep vein thrombosis'],
  sistemaId: 'cardiovascular',
  orgaos: ['Veia', 'Seio venoso dural', 'Microcirculação'],
  natureza: 'nao-neoplasica',
  catalogoIds: [
    'unicamp-trombose-em-pequenos-vasos-e0bad1b7f1',
    'unicamp-vasos-com-trombose-4119e54689',
    'unicamp-trombo-recente-7715eae211',
    'unicamp-trombos-recentes-8a47b36c04',
    'unicamp-quando-ha-lise-parcial-de-um-trombo-ccffbc1c3a',
    'unicamp-trombose-em-aorta-com-aterosclerose-0388170ca7',
    'unicamp-trombose-do-seio-sagital-superior-f085d1db02',
  ],
  midiasPrincipais: [],
  midiasBloqueadas: [],
  mecanismoIds: ['trombose', 'isquemia-infarto', 'reparo-fibrose'],
  padroesMorfologicos: [
    'linhas de Zahn',
    'aderência à parede vascular',
    'organização por tecido de granulação',
    'recanalização',
  ],
  conteudo: {
    objetivos: [
      'Aplicar a tríade de Virchow para explicar por que um trombo se formou naquele vaso.',
      'Distinguir, na lâmina, trombo intravital de coágulo post mortem.',
      'Datar aproximadamente um trombo pela presença de organização e recanalização.',
      'Ligar a morfologia do trombo aos desfechos possíveis: lise, propagação, embolia e organização.',
    ],
    definicao:
      'Formação de massa sólida a partir dos componentes do sangue dentro de um vaso íntegro, em ' +
      'vida, aderida à parede vascular e resultante da combinação de lesão endotelial, alteração ' +
      'do fluxo e hipercoagulabilidade.',
    etiologias: [
      {
        agente: 'Estase venosa',
        categoria: 'fisica',
        explicacao:
          'Fluxo lento impede a diluição dos fatores de coagulação ativados e o aporte de ' +
          'inibidores; permite ainda o contato prolongado de plaquetas e leucócitos com o endotélio. ' +
          'É o componente dominante na trombose venosa.',
      },
      {
        agente: 'Lesão endotelial',
        categoria: 'fisica',
        explicacao:
          'Trauma, cateter, inflamação ou hipóxia convertem o endotélio de superfície ' +
          'antitrombótica em superfície pró-trombótica, com exposição de fator tecidual e perda de ' +
          'trombomodulina e prostaciclina.',
      },
      {
        agente: 'Estados de hipercoagulabilidade',
        categoria: 'genetica',
        explicacao:
          'Herdados (fator V de Leiden, mutação da protrombina, deficiências de proteína C, S e ' +
          'antitrombina) ou adquiridos (neoplasia, síndrome antifosfolípide, gestação, ' +
          'contraceptivos), deslocam o equilíbrio hemostático para a formação de fibrina.',
      },
    ],
    fatoresDeRisco: [
      {
        fator: 'Imobilização prolongada e pós-operatório',
        porQue:
          'A bomba muscular da panturrilha é o principal motor do retorno venoso dos membros ' +
          'inferiores; sem contração, a estase se instala nos seios valvares.',
        forca: 'estabelecido',
      },
      {
        fator: 'Neoplasia maligna',
        porQue:
          'Tumores liberam fator tecidual e micropartículas pró-coagulantes na circulação, além de ' +
          'comprimirem vasos mecanicamente.',
        forca: 'estabelecido',
      },
      {
        fator: 'Gestação e puerpério',
        porQue:
          'Elevação fisiológica de fibrinogênio e de fatores de coagulação, com compressão das veias ' +
          'ilíacas pelo útero gravídico.',
        forca: 'estabelecido',
      },
    ],
    histologiaNormalDeReferencia: [
      {
        titulo: 'Veias normais',
        caminhoNormal: [
          'orgaos-e-sistemas',
          'sistema-cardiovascular',
          'vessels',
          'veins',
          'veins-1',
        ],
        oQueObservar:
          'Parede fina em relação ao lume, camadas mal delimitadas, média pobre em músculo liso, ' +
          'adventícia proeminente e luz ampla, habitualmente colapsada ou contendo apenas hemácias ' +
          'soltas. Endotélio contínuo e liso — nada aderido a ele.',
        aproximado: false,
      },
      {
        titulo: 'Artérias normais, para contraste',
        caminhoNormal: [
          'orgaos-e-sistemas',
          'sistema-cardiovascular',
          'vessels',
          'arteries',
          'arteries-1',
        ],
        oQueObservar:
          'Lâmina elástica interna nítida, média espessa e organizada. Guardar essa diferença é o ' +
          'que permite dizer, diante de um trombo, se o vaso comprometido era artéria ou veia — ' +
          'informação que muda inteiramente a interpretação clínica.',
        aproximado: false,
      },
    ],
    mecanismoPatologicoGeral: [
      {
        mecanismoId: 'trombose',
        aplicacao:
          'No território venoso, a tríade de Virchow pende para a estase. O trombo tipicamente ' +
          'nasce nos seios valvares da panturrilha, onde o fluxo é naturalmente turbilhonar e lento; ' +
          'por isso é rico em hemácias e fibrina e pobre em plaquetas — o "trombo vermelho", ' +
          'diferente do trombo arterial, plaquetário e de crescimento contra o fluxo.',
      },
      {
        mecanismoId: 'reparo-fibrose',
        aplicacao:
          'Se não sofre lise nem emboliza, o trombo é invadido a partir da parede por células ' +
          'endoteliais, células musculares lisas e fibroblastos. Em dias a semanas ele se converte ' +
          'em tecido conjuntivo aderido à íntima, e novos canais endotelizados o atravessam — a ' +
          'recanalização, que restitui fluxo parcial e sequela valvar permanente.',
      },
      {
        mecanismoId: 'isquemia-infarto',
        aplicacao:
          'A oclusão venosa não interrompe o aporte arterial: o sangue continua entrando e não sai. ' +
          'O resultado é congestão intensa, hemorragia intersticial e, quando a pressão iguala a ' +
          'arterial, infarto hemorrágico — mecanismo distinto do infarto branco por oclusão arterial.',
      },
    ],
    fisiopatologiaEspecifica: [
      {
        etapa: 'gatilho',
        titulo: 'Estase no seio valvar, com ou sem lesão endotelial associada',
        porQue:
          'A geometria do seio valvar cria um redemoinho de baixa velocidade. Imobilidade elimina a ' +
          'bomba muscular que normalmente lava esse recesso, e o sangue permanece parado ali por ' +
          'tempo suficiente para que a coagulação escape do controle local.',
      },
      {
        etapa: 'alvo',
        titulo: 'Superfície endotelial e o equilíbrio hemostático local',
        porQue:
          'O endotélio quiescente é ativamente antitrombótico: expressa trombomodulina, heparan ' +
          'sulfato e produz prostaciclina e óxido nítrico. Hipóxia e citocinas do sangue estagnado ' +
          'suprimem esses fatores e induzem fator tecidual e inibidor do ativador de plasminogênio.',
      },
      {
        etapa: 'resposta-celular',
        titulo: 'Adesão plaquetária e ativação da cascata da coagulação',
        porQue:
          'Com a superfície convertida, plaquetas aderem e a trombina gerada localmente converte ' +
          'fibrinogênio em fibrina. Neutrófilos aderentes liberam redes de cromatina extracelular ' +
          'que servem de arcabouço adicional para a malha de fibrina.',
        achadoAssociado: 'Malha de fibrina com plaquetas aderidas ao endotélio',
      },
      {
        etapa: 'resposta-tecidual',
        titulo: 'Crescimento laminar do trombo na direção do fluxo',
        porQue:
          'Cada nova camada de plaquetas e fibrina aprisiona hemácias e se deposita sobre a ' +
          'anterior. A alternância entre camadas claras (plaquetas e fibrina) e escuras (hemácias) ' +
          'é o que produz as linhas de Zahn — prova de que houve fluxo durante a formação, ou seja, ' +
          'de que o trombo é intravital.',
        achadoAssociado: 'Linhas de Zahn e aderência firme à parede',
      },
      {
        etapa: 'morfologia',
        titulo: 'Organização e recanalização',
        porQue:
          'A partir da parede, brotos capilares e miofibroblastos invadem a massa. Ela é ' +
          'progressivamente substituída por tecido conjuntivo, e canais revestidos por endotélio a ' +
          'atravessam. O vaso deixa de estar ocluído, mas nunca volta a ser o que era.',
        achadoAssociado: 'Tecido de granulação dentro do trombo, com neovasos endotelizados',
      },
      {
        etapa: 'disfuncao',
        titulo: 'Hipertensão venosa distal e incompetência valvar',
        porQue:
          'A organização destrói as válvulas envolvidas. Sem elas, a coluna de sangue não é ' +
          'segmentada, e a pressão hidrostática se transmite integralmente à microcirculação distal.',
      },
      {
        etapa: 'clinica',
        titulo: 'Edema, dor e empastamento do membro',
        porQue:
          'A pressão venosa elevada aumenta a filtração capilar além da capacidade de drenagem ' +
          'linfática. A distensão da parede venosa inflamada é o que produz a dor à palpação.',
      },
      {
        etapa: 'complicacao',
        titulo: 'Embolia pulmonar e síndrome pós-trombótica',
        porQue:
          'Um fragmento que se desprende segue o retorno venoso até a artéria pulmonar; o calibre ' +
          'em que impacta define desde silêncio clínico até morte súbita. Nos que não embolizam, a ' +
          'incompetência valvar residual produz hipertensão venosa crônica, hiperpigmentação e ' +
          'úlcera de estase.',
      },
    ],
    macroscopia: [
      {
        achado: 'Massa intraluminal firme, seca e aderida à parede',
        processo: 'Deposição laminar de fibrina e plaquetas sobre endotélio ativado.',
        consequencia:
          'Aderência é o traço macroscópico que separa trombo de coágulo post mortem, que se ' +
          'destaca com facilidade.',
        peso: 'necessário',
      },
      {
        achado: 'Coágulo post mortem com camada superior amarelada e inferior vermelho-escura',
        processo: 'Sedimentação de hemácias após a parada circulatória, sem fluxo e sem adesão.',
        consequencia:
          'Aspecto de "gordura de galinha" sobre "geleia de groselha"; elástico, não aderente — ' +
          'artefato, não doença.',
        peso: 'suficiente',
      },
    ],
    histopatologia: {
      panoramica: {
        procure:
          'Identifique primeiro o vaso: artéria ou veia? Depois, se o material intraluminal toca a ' +
          'parede em algum ponto ou está livre no lume.',
        achados: [
          {
            achado: 'Lume ocupado por massa em contato com a íntima',
            processo: 'Adesão do trombo à superfície endotelial lesada.',
            consequencia:
              'Sem ponto de adesão em nenhum corte, a hipótese de artefato de coleta ou coágulo ' +
              'post mortem precisa ser considerada.',
            peso: 'necessário',
          },
          {
            achado: 'Parede vascular de camadas mal definidas e média delgada',
            processo:
              'Anatomia venosa normal: parede fina, média pobre em músculo liso e lume amplo.',
            consequencia:
              'Estabelece o território — trombose venosa e arterial têm patogenias e consequências ' +
              'distintas.',
            peso: 'frequente',
          },
        ],
      },
      pequeno: {
        procure:
          'Examine a estrutura interna da massa: ela é homogênea ou tem camadas? Há tecido invadindo ' +
          'a partir da parede?',
        achados: [
          {
            achado: 'Linhas de Zahn — alternância de faixas eosinofílicas e faixas de hemácias',
            processo: 'Deposição laminar sob fluxo contínuo.',
            consequencia:
              'Prova morfológica de formação intravital; sua ausência não exclui, pois trombos de ' +
              'estase profunda podem ser predominantemente vermelhos.',
            peso: 'suficiente',
          },
          {
            achado: 'Tecido de granulação penetrando a massa a partir da íntima',
            processo: 'Organização por invasão de fibroblastos e brotos capilares.',
            consequencia: 'Indica trombo com dias a semanas de evolução, não recente.',
            peso: 'necessário',
          },
          {
            achado: 'Canais revestidos por endotélio atravessando a massa organizada',
            processo:
              'Recanalização: brotos endoteliais atravessam a massa organizada e restabelecem ' +
              'canais de fluxo.',
            consequencia: 'Indica trombo antigo; restaura fluxo parcial e deixa sequela valvar.',
            peso: 'suficiente',
          },
        ],
      },
      medio: {
        procure:
          'Caracterize a composição: predomínio de fibrina e plaquetas ou de hemácias? Há leucócitos ' +
          'permeando?',
        achados: [
          {
            achado: 'Malha de fibrina eosinofílica aprisionando hemácias e leucócitos',
            processo: 'Coagulação local com incorporação dos elementos figurados em fluxo.',
            consequencia:
              'A distribuição entremeada difere do coágulo post mortem, em que as hemácias estão ' +
              'sedimentadas em camadas por gravidade.',
            peso: 'sugestivo',
          },
          {
            achado: 'Infiltrado neutrofílico na interface trombo-parede',
            processo: 'Resposta inflamatória à massa aderida (tromboflebite).',
            consequencia:
              'Sugere componente inflamatório ou séptico; muda a conduta quando há infecção.',
            peso: 'frequente',
          },
        ],
      },
      grande: {
        procure:
          'Confirme a natureza das faixas claras e procure hemossiderina, sinal de hemorragia antiga.',
        achados: [
          {
            achado: 'Agregados plaquetários com grânulos, formando as faixas claras',
            processo: 'Adesão e agregação plaquetária em regiões de fluxo mais rápido.',
            consequencia: 'Confirma o caráter laminar do crescimento e, com ele, a intravitalidade.',
            peso: 'sugestivo',
          },
          {
            achado: 'Macrófagos com hemossiderina na periferia do trombo organizado',
            processo: 'Fagocitose de hemácias degradadas ao longo de semanas.',
            consequencia:
              'Datação relativa: pigmento presente significa evolução de pelo menos alguns dias.',
            peso: 'sugestivo',
          },
        ],
      },
      sintese:
        'Uma massa aderida à parede, com linhas de Zahn, estabelece trombo intravital e dispensa a ' +
        'discussão sobre artefato post mortem. A presença ou ausência de organização e de ' +
        'recanalização faz a datação relativa: recente (fibrina e hemácias, sem tecido invadindo), ' +
        'em organização (granulação penetrando), antigo (conjuntivo denso com canais endotelizados). ' +
        'O que a lâmina não responde é *por que* houve trombose — a tríade de Virculow se completa ' +
        'com dados clínicos e laboratoriais, nunca só com morfologia.',
    },
    coloracoesEspeciais: [
      {
        nome: 'Tricrômico de Masson',
        tipo: 'coloracao',
        pergunta: 'Quanta fibrose já substituiu a fibrina? Ou seja: qual a idade aproximada do trombo?',
        padraoEsperado:
          'Fibrina em vermelho-alaranjado; colágeno maduro em azul (ou verde, conforme o protocolo). ' +
          'A proporção entre os dois é o cronômetro.',
        controles: 'Controle de tecido com colágeno maduro conhecido em cada bateria.',
        limitacoes: [
          'A conversão fibrina→colágeno é gradual e influenciada por idade e comorbidades: a datação é aproximada, nunca precisa.',
          'Não distingue trombo organizado de fibrose intimal preexistente sem correlação arquitetural.',
        ],
        mudaODiferencial:
          'Permite separar trombo recente de trombo antigo recanalizado — distinção com implicação ' +
          'direta em contexto médico-legal e na decisão de anticoagular.',
      },
    ],
    imunoHistoquimica: [
      {
        nome: 'CD31 ou CD34',
        tipo: 'imuno-histoquimica',
        pergunta: 'Os canais que atravessam a massa organizada são realmente revestidos por endotélio?',
        padraoEsperado: 'Marcação membranar em células que revestem os neocanais.',
        controles: 'Vasos preexistentes da parede servem como controle interno positivo.',
        limitacoes: [
          'Não distingue neovaso de vaso preexistente englobado pelo trombo.',
          'CD34 também marca células progenitoras e alguns tumores fusocelulares.',
        ],
        mudaODiferencial:
          'Confirma recanalização verdadeira, separando-a de fendas de retração produzidas no ' +
          'processamento.',
      },
    ],
    biologiaMolecular: [],
    correlacaoClinica: [
      {
        achadoMorfologico: 'Trombo oclusivo em veia profunda de membro inferior',
        consequenciaFuncional: 'Bloqueio do retorno venoso com elevação da pressão hidrostática distal.',
        manifestacao: 'Edema unilateral, dor à palpação e empastamento da panturrilha.',
      },
      {
        achadoMorfologico: 'Trombo friável, pouco aderido, em segmento proximal',
        consequenciaFuncional: 'Alto risco de desprendimento e migração pelo retorno venoso.',
        manifestacao: 'Embolia pulmonar: dispneia súbita, dor pleurítica ou colapso hemodinâmico.',
      },
      {
        achadoMorfologico: 'Trombo organizado e recanalizado com destruição valvar',
        consequenciaFuncional: 'Refluxo venoso e hipertensão venosa crônica.',
        manifestacao:
          'Síndrome pós-trombótica: edema crônico, dermatite ocre e úlcera de estase maleolar.',
      },
    ],
    diagnosticosDiferenciais: [
      {
        nome: 'Coágulo post mortem',
        motivoDaConfusao: 'Também ocupa a luz vascular e é encontrado em necropsia.',
        achadosCompartilhados: ['massa intraluminal', 'fibrina', 'hemácias'],
        discriminador:
          'Ausência de adesão à parede, ausência de linhas de Zahn e sedimentação em duas camadas ' +
          'por gravidade. Consistência elástica, "em molde do vaso".',
        armadilhaDeAmostragem:
          'Um único corte pode não incluir o ponto de adesão; cortes adicionais são necessários ' +
          'antes de afirmar que não há aderência.',
      },
      {
        nome: 'Êmbolo tumoral intravascular',
        motivoDaConfusao: 'Material sólido ocluindo a luz, frequentemente com fibrina associada.',
        achadosCompartilhados: ['oclusão luminal', 'fibrina de superfície'],
        discriminador:
          'Presença de células epiteliais ou mesenquimais atípicas coesas dentro da massa.',
        exameQueResolve: 'Painel imuno-histoquímico de citoqueratinas e marcadores de linhagem.',
      },
      {
        nome: 'Vasculite com trombose secundária',
        motivoDaConfusao: 'Trombo presente e evidente; a causa na parede passa despercebida.',
        achadosCompartilhados: ['trombo aderido', 'infiltrado inflamatório'],
        discriminador:
          'Infiltrado inflamatório transmural com necrose fibrinoide na parede, e não apenas na ' +
          'interface com o trombo.',
        exameQueResolve: 'Elástica de van Gieson para avaliar destruição da lâmina elástica; sorologias.',
      },
      {
        nome: 'Endocardite trombótica não bacteriana',
        motivoDaConfusao: 'Vegetações de fibrina e plaquetas, morfologicamente semelhantes ao trombo.',
        achadosCompartilhados: ['fibrina', 'plaquetas', 'ausência de bactérias'],
        discriminador:
          'Localização valvar cardíaca, aderência ao folheto sem destruição valvar e ausência de ' +
          'infiltrado inflamatório significativo.',
      },
    ],
    complicacoes: [
      {
        complicacao: 'Tromboembolismo pulmonar',
        mecanismo:
          'Fragmentação e desprendimento do trombo, com migração pelo sistema venoso até impactar ' +
          'na circulação arterial pulmonar.',
      },
      {
        complicacao: 'Síndrome pós-trombótica',
        mecanismo:
          'Organização destrói as válvulas venosas; o refluxo resultante mantém hipertensão venosa ' +
          'crônica na microcirculação cutânea.',
      },
      {
        complicacao: 'Infarto hemorrágico de território drenado',
        mecanismo:
          'Oclusão venosa com aporte arterial mantido eleva a pressão capilar até a ruptura, ' +
          'inundando o interstício de sangue.',
      },
      {
        complicacao: 'Trombose séptica',
        mecanismo:
          'Colonização bacteriana do trombo, que se torna reservatório protegido e fonte de ' +
          'bacteremia persistente.',
      },
    ],
    normalVersusPatologico: [
      {
        aspecto: 'Conteúdo luminal',
        normal: 'Hemácias soltas, sem estrutura, frequentemente removidas no processamento.',
        patologico: 'Massa estruturada, laminada e aderida à íntima.',
      },
      {
        aspecto: 'Endotélio',
        normal: 'Contínuo, achatado, antitrombótico.',
        patologico: 'Descontínuo ou ativado, com plaquetas e fibrina aderidas.',
      },
      {
        aspecto: 'Válvula venosa',
        normal: 'Folhetos delgados e móveis, com seio valvar livre.',
        patologico:
          'Espessada, retraída ou incorporada ao tecido conjuntivo do trombo organizado; incompetente.',
      },
    ],
    resumoDeProva: [
      'Tríade de Virchow: lesão endotelial, alteração do fluxo, hipercoagulabilidade. Na veia, a estase domina.',
      'Linhas de Zahn = formação sob fluxo = trombo intravital. Coágulo post mortem não as tem e não adere.',
      'Datação morfológica: fibrina fresca → tecido de granulação → conjuntivo com canais recanalizados.',
      'Oclusão venosa com aporte arterial mantido produz infarto hemorrágico, não infarto branco.',
      'A sequela crônica não é o trombo, é a válvula destruída pela organização.',
    ],
    armadilhas: [
      'Concluir por coágulo post mortem sem ter procurado adesão em mais de um plano de corte.',
      'Datar um trombo com precisão de horas — a morfologia dá faixas, não relógios.',
      'Ignorar a parede do vaso: vasculite e neoplasia são causas que só aparecem se forem procuradas.',
      'Assumir trombose arterial por analogia quando a parede examinada é claramente venosa.',
      'Interpretar fendas de retração do processamento como recanalização, sem confirmar endotélio.',
    ],
    perguntasDeAutoavaliacao: [
      {
        pergunta:
          'Numa necropsia, encontra-se massa ocupando a luz de uma veia femoral, aderida à íntima em ' +
          'dois pontos, com faixas claras e escuras alternadas. Qual a interpretação?',
        alternativas: [
          'Coágulo post mortem, pelo aspecto laminado.',
          'Trombo formado em vida: adesão à parede e linhas de Zahn indicam deposição sob fluxo.',
          'Êmbolo tumoral, pelas faixas claras.',
          'Artefato de fixação.',
        ],
        indiceCorreto: 1,
        devolutiva:
          'Adesão firme e linhas de Zahn são os dois achados que estabelecem formação intravital. O ' +
          'coágulo post mortem não adere e apresenta sedimentação em duas camadas por gravidade, não ' +
          'alternância laminar. Êmbolo tumoral exigiria células atípicas coesas; artefato de fixação ' +
          'não produz estrutura laminar organizada.',
        nivel: 'essencial',
      },
      {
        pergunta:
          'Por que a oclusão venosa produz infarto hemorrágico enquanto a oclusão arterial em órgão ' +
          'sólido produz infarto branco?',
        alternativas: [
          'Porque as veias contêm sangue mais rico em hemácias.',
          'Porque na oclusão venosa o aporte arterial permanece e continua bombeando sangue para um leito que não drena, elevando a pressão até a ruptura capilar.',
          'Porque o infarto venoso ocorre apenas em órgãos com circulação dupla.',
          'Porque a necrose venosa é sempre liquefativa.',
        ],
        indiceCorreto: 1,
        devolutiva:
          'A diferença está no que continua funcionando. Ocluída a veia, a artéria segue enchendo o ' +
          'território; sem saída, a pressão capilar sobe até romper a parede e inundar o interstício. ' +
          'Na oclusão arterial de órgão com circulação única, nada entra e o tecido fica pálido. ' +
          'Circulação dupla contribui para infarto vermelho arterial, mas não é o mecanismo do ' +
          'infarto venoso, e o tipo de necrose depende do órgão, não do vaso ocluído.',
        nivel: 'aprofundar',
      },
      {
        pergunta:
          'Um trombo em veia mesentérica mostra tecido conjuntivo denso permeado por canais ' +
          'revestidos por células CD31 positivas. O que isso permite afirmar sobre o tempo de evolução ' +
          'e sobre o risco embólico atual?',
        alternativas: [
          'Trombo recente, com alto risco embólico.',
          'Trombo antigo, organizado e recanalizado; o risco de embolia a partir dessa massa é baixo, embora a causa subjacente possa persistir.',
          'Trombo séptico em atividade.',
          'Não é possível inferir nada sobre o tempo.',
        ],
        indiceCorreto: 1,
        devolutiva:
          'Organização com colágeno maduro e neocanais endotelizados leva semanas a meses; a massa ' +
          'está firmemente incorporada à parede e não se desprende com facilidade. Isso não resolve ' +
          'a causa: se a condição pró-trombótica persiste, novos trombos podem se formar em outros ' +
          'territórios. Trombo recente teria fibrina e hemácias sem invasão de tecido; sepse exigiria ' +
          'infiltrado neutrofílico e agentes.',
        nivel: 'avancado',
      },
    ],
    referencias: [
      {
        citacao:
          'Kumar V, Abbas AK, Aster JC. Robbins & Cotran Pathologic Basis of Disease. 10ª ed. Elsevier; 2021. Capítulo de distúrbios hemodinâmicos, tromboembolismo e choque.',
        organizacao: 'Elsevier',
        edicao: '10ª',
        ano: 2021,
      },
      {
        citacao:
          'Mackman N, Bergmeier W, Stouffer GA, Weitz JI. Therapeutic strategies for thrombosis: new targets and approaches. Nat Rev Drug Discov. 2020;19(5):333-352.',
        ano: 2020,
      },
    ],
  },
  revisao: {
    estado: 'revisao-medica',
    versao: 1,
    atualizadoEm: '2026-08-09',
    pendencias: [
      'Revisão por patologista, com atenção especial aos critérios de datação morfológica — área com implicação médico-legal.',
      'Definir se a página deve se desdobrar em trombose arterial e venosa separadamente após a revisão.',
      'As lâminas da Unicamp estão autorizadas para exibição remota.',
    ],
    historico: [
      {
        data: '2026-08-09',
        autor: 'Edição Domine Aqui',
        nota: 'Primeira redação do conteúdo piloto. Texto autoral, não revisado por profissional habilitado.',
      },
    ],
  },
}
