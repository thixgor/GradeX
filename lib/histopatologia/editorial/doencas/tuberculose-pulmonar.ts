import type { DoencaCanonicaEntrada } from '../../esquemas'

/**
 * Tuberculose pulmonar — piloto do padrão "inflamação granulomatosa com necrose
 * caseosa".
 *
 * Entra no conjunto piloto por duas razões. Primeiro, é o caso em que a
 * morfologia é literalmente a resposta imune: o granuloma não é dano do agente,
 * é a arquitetura que o hospedeiro constrói. Segundo, ela obriga a separar
 * *sugestivo* de *necessário* — necrose caseosa é altamente sugestiva e não é
 * suficiente, e este é o ponto onde o hábito de dizer "patognomônico" mais
 * frequentemente escorrega.
 */
export const tuberculosePulmonar: DoencaCanonicaEntrada = {
  id: 'tuberculose-pulmonar',
  slug: 'tuberculose-pulmonar',
  nome: 'Tuberculose pulmonar',
  sinonimos: ['tuberculose pós-primária', 'tuberculose de reativação', 'tísica'],
  sinonimosEmIngles: ['pulmonary tuberculosis', 'post-primary tuberculosis'],
  sistemaId: 'respiratorio',
  orgaos: ['Pulmão', 'Pleura', 'Linfonodo hilar'],
  natureza: 'nao-neoplasica',
  catalogoIds: [
    'unicamp-tuberculose-pos-primaria-4c2f0d213f',
    'unicamp-tuberculose-pos-primaria-caverna-apical-e-disseminacao-broncogenica-d54e9007b0',
    'unicamp-tuberculose-pos-primaria-caverna-apical-e-disseminacao-broncogenica-exte-fc0608f81a',
    'unicamp-peca-r-66-tuberculose-pulmonar-exsudativa-com-extensa-necrose-caseosa-ou-7e713cd636',
    'unicamp-peca-r-7-tuberculose-pos-primaria-caverna-apical-curada-outro-exemplo-de-e15747841d',
    'unicamp-caverna-antiga-curada-fibrose-pulmonar-e-pleural-tuberculose-da-supra-re-411ecf6f61',
    'unicamp-antracose-pulmonar-tuberculose-miliar-80b3a32976',
  ],
  midiasPrincipais: [],
  midiasBloqueadas: [],
  mecanismoIds: [
    'inflamacao-granulomatosa',
    'necrose-caseosa',
    'infeccao-persistente',
    'reparo-fibrose',
  ],
  padroesMorfologicos: [
    'granuloma com necrose central',
    'células gigantes de Langhans',
    'cavitação apical',
    'fibrose retrátil',
  ],
  conteudo: {
    objetivos: [
      'Explicar por que a resposta ao Mycobacterium tuberculosis produz granuloma, e não supuração.',
      'Descrever como o granuloma passa de estrutura protetora a mecanismo de destruição tecidual.',
      'Justificar a topografia apical e a formação de caverna a partir da fisiologia pulmonar.',
      'Aplicar corretamente os pesos diagnósticos: o que a necrose caseosa sugere e o que ela não prova.',
    ],
    definicao:
      'Doença infecciosa crônica causada por micobactérias do complexo Mycobacterium tuberculosis, ' +
      'cuja lesão característica é o granuloma com necrose caseosa central, com predileção pelos ' +
      'segmentos apicais e posteriores dos lobos superiores na forma pós-primária.',
    etiologias: [
      {
        agente: 'Mycobacterium tuberculosis',
        categoria: 'infecciosa',
        explicacao:
          'Bacilo aeróbio estrito, de parede rica em ácidos micólicos. A parede lipídica resiste à ' +
          'digestão lisossomal e é o que impede a resolução da infecção pela via fagocítica comum, ' +
          'obrigando o hospedeiro a mudar de estratégia.',
      },
    ],
    fatoresDeRisco: [
      {
        fator: 'Imunossupressão celular (HIV, corticoterapia, anti-TNF)',
        porQue:
          'O granuloma depende de linfócitos T CD4+ e de TNF para se manter organizado. Sem eles, o ' +
          'agregado se desfaz e o bacilo dissemina — daí a tuberculose miliar nesses pacientes.',
        forca: 'estabelecido',
      },
      {
        fator: 'Desnutrição, diabetes e etilismo',
        porQue:
          'Comprometem a função de macrófagos e de linfócitos T, reduzindo a capacidade de contenção ' +
          'do bacilo em lesões antigas.',
        forca: 'estabelecido',
      },
      {
        fator: 'Silicose e exposição a poeiras minerais',
        porQue:
          'A partícula inorgânica satura o macrófago alveolar e prejudica sua atividade microbicida, ' +
          'aumentando de forma marcante o risco de tuberculose ativa.',
        forca: 'estabelecido',
      },
    ],
    histologiaNormalDeReferencia: [
      {
        titulo: 'Alvéolos e septo alveolar normais',
        caminhoNormal: [
          'orgaos-e-sistemas',
          'sistema-respiratorio',
          'intrapulmonary-passageways',
          'sistema-respiratorio',
          'alveoli',
        ],
        oQueObservar:
          'Septos delgados com capilares aderidos ao epitélio, pneumócitos tipo I recobrindo quase ' +
          'toda a superfície e tipo II nos ângulos; espaços aéreos limpos e confluentes. A distância ' +
          'entre ar e sangue é de poucos micrômetros — é essa delgadeza que a doença destrói.',
        aproximado: false,
      },
      {
        titulo: 'Visão geral do sistema respiratório',
        caminhoNormal: [
          'orgaos-e-sistemas',
          'sistema-respiratorio',
          'overview-of-the-respiratory-system',
          'overview-1',
        ],
        oQueObservar:
          'A relação entre via aérea condutora, artéria acompanhante e parênquima. Guardar essa ' +
          'relação é o que permite reconhecer, depois, a disseminação broncogênica: lesões que ' +
          'seguem a árvore brônquica, e não o interstício.',
        aproximado: false,
      },
    ],
    mecanismoPatologicoGeral: [
      {
        mecanismoId: 'infeccao-persistente',
        aplicacao:
          'O bacilo inalado é fagocitado pelo macrófago alveolar, mas bloqueia a maturação do ' +
          'fagossomo e a fusão com o lisossomo. Ele então se multiplica dentro da própria célula que ' +
          'deveria destruí-lo — o que torna a fagocitose ineficaz e transfere a tarefa de contenção ' +
          'para a imunidade celular adaptativa.',
      },
      {
        mecanismoId: 'inflamacao-granulomatosa',
        aplicacao:
          'Cerca de três semanas após a exposição, linfócitos T CD4+ sensibilizados produzem ' +
          'interferon-γ e ativam classicamente os macrófagos. Estes se tornam epitelioides, fundem-se ' +
          'em células gigantes de Langhans e se organizam num agregado circundado por linfócitos. O ' +
          'granuloma é a solução arquitetural do hospedeiro para conter o que não consegue eliminar.',
      },
      {
        mecanismoId: 'necrose-caseosa',
        aplicacao:
          'No centro do granuloma, a atividade microbicida intensa somada à isquemia local destrói ' +
          'tanto bacilos quanto tecido. O resultado é material amorfo, sem contornos celulares, com ' +
          'aspecto macroscópico de queijo — e um ambiente hipóxico e ácido em que o bacilo aeróbio ' +
          'sobrevive latente, sem se multiplicar.',
      },
      {
        mecanismoId: 'reparo-fibrose',
        aplicacao:
          'Ao redor do granuloma, fibroblastos depositam colágeno e delimitam a lesão. A fibrose ' +
          'contém a doença e, ao mesmo tempo, produz o dano permanente: retração apical, ' +
          'bronquiectasia de tração e perda irreversível de parênquima.',
      },
    ],
    fisiopatologiaEspecifica: [
      {
        etapa: 'gatilho',
        titulo: 'Inalação de núcleos de Wells contendo bacilos viáveis',
        porQue:
          'Partículas de 1 a 5 µm atravessam as vias condutoras sem sedimentar e alcançam o alvéolo. ' +
          'Poucos bacilos bastam: o inóculo infectante é baixo porque a replicação intracelular ' +
          'inicial não encontra resistência.',
      },
      {
        etapa: 'alvo',
        titulo: 'Macrófago alveolar e a maturação do fagossomo',
        porQue:
          'Componentes da parede micobacteriana interferem no recrutamento das GTPases que conduzem ' +
          'a maturação fagossomal. O compartimento não acidifica e não recebe hidrolases; o bacilo ' +
          'permanece num nicho protegido dentro do fagócito.',
      },
      {
        etapa: 'resposta-celular',
        titulo: 'Ativação clássica do macrófago por linfócitos T CD4+',
        porQue:
          'Células dendríticas levam antígeno ao linfonodo de drenagem e sensibilizam linfócitos T. ' +
          'O interferon-γ que eles produzem induz no macrófago a produção de óxido nítrico e ' +
          'espécies reativas, transformando-o em célula epitelioide microbicida. Esse é o intervalo ' +
          'de três semanas entre a exposição e a conversão da prova tuberculínica.',
        achadoAssociado: 'Macrófagos epitelioides e células gigantes multinucleadas de Langhans',
      },
      {
        etapa: 'resposta-tecidual',
        titulo: 'Organização do granuloma e caseificação central',
        porQue:
          'Macrófagos ativados se agregam e são cercados por linfócitos e fibroblastos. O centro do ' +
          'agregado fica distante da vasculatura e sofre isquemia; somada à toxicidade dos ' +
          'mediadores, ela produz necrose que não preserva contornos — a caseificação.',
        achadoAssociado: 'Granuloma com centro eosinofílico amorfo e coroa epitelioide',
      },
      {
        etapa: 'morfologia',
        titulo: 'Coalescência, erosão brônquica e cavitação',
        porQue:
          'Na doença pós-primária, granulomas confluem em massas caseosas. Quando a massa erode a ' +
          'parede de um brônquio, o material liquefeito é drenado e eliminado: forma-se uma cavidade ' +
          'de paredes fibrosas, aberta para a via aérea e rica em oxigênio — condição ideal para o ' +
          'bacilo aeróbio se multiplicar aos milhões.',
        achadoAssociado: 'Caverna apical de paredes fibrosas; focos satélites broncogênicos',
      },
      {
        etapa: 'disfuncao',
        titulo: 'Perda de superfície de troca e destruição da arquitetura',
        porQue:
          'Cada área caseificada ou cavitada é parênquima que não participa mais da hematose. A ' +
          'fibrose cicatricial retrai o que sobrou, distorce brônquios e reduz complacência: a perda ' +
          'funcional persiste mesmo depois da cura bacteriológica.',
      },
      {
        etapa: 'clinica',
        titulo: 'Tosse produtiva, hemoptise e síndrome consumptiva',
        porQue:
          'A cavidade drena material caseoso para o brônquio, o que produz tosse e escarro ' +
          'infectante; vasos na parede da caverna podem erodir e sangrar. Febre vespertina, sudorese ' +
          'noturna e emagrecimento derivam da produção sustentada de TNF e IL-1 pela lesão ativa.',
      },
      {
        etapa: 'complicacao',
        titulo: 'Disseminação miliar, empiema e sequela fibrótica',
        porQue:
          'A erosão de um vaso lança bacilos na circulação e produz semeadura miliar; a extensão à ' +
          'pleura gera derrame ou empiema; e mesmo com tratamento eficaz a retração fibrosa e as ' +
          'bronquiectasias permanecem como sequela estrutural.',
      },
    ],
    macroscopia: [
      {
        achado: 'Lesão apical de aspecto caseoso, branco-amarelada e friável',
        processo: 'Coalescência de granulomas com necrose caseosa extensa.',
        consequencia:
          'Topografia apical é o dado macroscópico mais informativo da forma pós-primária.',
        peso: 'sugestivo',
      },
      {
        achado: 'Caverna de paredes espessas comunicando-se com brônquio',
        processo: 'Drenagem do material caseoso liquefeito para a via aérea, com fibrose da parede.',
        consequencia:
          'Explica a transmissibilidade e a alta carga bacilar; corresponde ao paciente contagiante.',
        peso: 'sugestivo',
      },
      {
        achado: 'Focos nodulares distribuídos ao longo da árvore brônquica',
        processo: 'Disseminação broncogênica a partir da caverna.',
        consequencia: 'Distingue a progressão intracanalicular da disseminação hematogênica miliar.',
        peso: 'sugestivo',
      },
    ],
    histopatologia: {
      panoramica: {
        procure:
          'Antes de qualquer célula, defina a distribuição: as lesões são nodulares e delimitadas? ' +
          'Concentram-se no ápice? Seguem a árvore brônquica ou o interstício?',
        achados: [
          {
            achado: 'Nódulos bem delimitados, de tamanhos semelhantes, com centro mais eosinofílico',
            processo: 'Granulomas maduros com necrose central.',
            consequencia:
              'Padrão nodular com centro alterado direciona imediatamente para doença granulomatosa.',
            peso: 'necessário',
          },
          {
            achado: 'Distribuição peribrônquica dos focos',
            processo: 'Disseminação broncogênica do material caseoso.',
            consequencia:
              'Separa progressão pela via aérea de disseminação hematogênica, que seria uniforme e ' +
              'de nódulos minúsculos.',
            peso: 'sugestivo',
          },
        ],
      },
      pequeno: {
        procure:
          'Delimite cada granuloma: onde começa o centro necrótico, onde está a coroa celular, onde ' +
          'a fibrose periférica.',
        achados: [
          {
            achado: 'Necrose central amorfa, granular, eosinofílica, sem contornos celulares',
            processo: 'Caseificação por atividade microbicida e isquemia no centro do agregado.',
            consequencia:
              'Altamente sugestiva de tuberculose no contexto adequado — mas ocorre também em ' +
              'micoses profundas e em algumas formas de reação a corpo estranho.',
            peso: 'sugestivo',
          },
          {
            achado: 'Coroa de macrófagos epitelioides com citoplasma abundante e limites indistintos',
            processo: 'Ativação clássica do macrófago por interferon-γ.',
            consequencia: 'Estabelece que a inflamação é granulomatosa e não supurativa.',
            peso: 'necessário',
          },
          {
            achado: 'Fibrose concêntrica delimitando lesões antigas',
            processo: 'Reparo em torno de granuloma contido.',
            consequencia:
              'Indica lesão de longa evolução; permite falar em atividade versus sequela.',
            peso: 'frequente',
          },
        ],
      },
      medio: {
        procure:
          'Caracterize a composição celular do granuloma e a relação entre lesões vizinhas.',
        achados: [
          {
            achado: 'Células gigantes multinucleadas tipo Langhans, com núcleos em ferradura',
            processo: 'Fusão de macrófagos epitelioides.',
            consequencia:
              'Reforça o padrão granulomatoso; a disposição periférica dos núcleos é típica, mas ' +
              'células gigantes ocorrem em qualquer granuloma.',
            peso: 'frequente',
          },
          {
            achado: 'Coroa linfocitária densa ao redor do agregado epitelioide',
            processo: 'Recrutamento de linfócitos T que sustentam a ativação macrofágica.',
            consequencia:
              'Sua rarefação em imunossuprimidos explica granulomas mal formados e maior carga bacilar.',
            peso: 'frequente',
          },
          {
            achado: 'Confluência de granulomas com destruição de septos alveolares',
            processo: 'Expansão das lesões com perda de parênquima interposto.',
            consequencia: 'Marca a transição de doença contida para doença destrutiva.',
            peso: 'sugestivo',
          },
        ],
      },
      grande: {
        procure:
          'Examine o citoplasma dos macrófagos e o material necrótico — e só então recorra à ' +
          'coloração especial.',
        achados: [
          {
            achado: 'Debris nucleares (cariorrexe) na interface entre necrose e coroa celular',
            processo: 'Morte celular contínua na borda do centro caseoso.',
            consequencia: 'Confirma necrose ativa, diferenciando-a de material proteináceo inerte.',
            peso: 'sugestivo',
          },
          {
            achado: 'Bacilos álcool-ácido resistentes, finos e levemente curvos, no Ziehl-Neelsen',
            processo: 'Persistência do agente no material caseoso e no interior de macrófagos.',
            consequencia:
              'É o achado que mais se aproxima de prova morfológica — mas a sensibilidade é baixa e ' +
              'a coloração não distingue espécies de micobactéria.',
            peso: 'necessário',
          },
        ],
      },
      sintese:
        'Inflamação granulomatosa com necrose caseosa em topografia apical, com células de Langhans e ' +
        'fibrose periférica, sustenta fortemente o diagnóstico. Nada disso, porém, identifica o ' +
        'agente: o padrão é compartilhado por micobactérias não tuberculosas, histoplasmose, ' +
        'coccidioidomicose e criptococose. A confirmação exige bacilos no Ziehl-Neelsen e, ' +
        'idealmente, cultura ou teste molecular. A morfologia diz "granulomatosa necrosante"; quem ' +
        'diz "tuberculose" é o conjunto morfologia + agente + contexto.',
    },
    coloracoesEspeciais: [
      {
        nome: 'Ziehl-Neelsen (ou Fite para micobactérias frágeis)',
        tipo: 'coloracao',
        pergunta: 'Há bacilos álcool-ácido resistentes no material caseoso ou dentro dos macrófagos?',
        padraoEsperado:
          'Bastonetes vermelhos, finos, retos ou discretamente curvos, sobre fundo azul; ' +
          'concentram-se na borda da necrose e no citoplasma de macrófagos.',
        controles: 'Controle positivo externo em cada bateria; sem ele, um negativo não é interpretável.',
        limitacoes: [
          'Sensibilidade baixa: exige carga alta e varredura demorada de muitos campos.',
          'Não distingue M. tuberculosis de micobactérias não tuberculosas.',
          'Pacientes tratados podem ter bacilos íntegros porém inviáveis.',
        ],
        mudaODiferencial:
          'Positividade restringe o diferencial às micobacterioses; negatividade não exclui e ' +
          'mantém micoses profundas em disputa, o que torna o Grocott obrigatório na sequência.',
      },
      {
        nome: 'Grocott/GMS e PAS',
        tipo: 'coloracao',
        pergunta: 'A necrose granulomatosa é fúngica em vez de micobacteriana?',
        padraoEsperado:
          'Leveduras ou hifas em preto (Grocott) ou magenta (PAS); a morfologia e o tamanho do ' +
          'fungo orientam a espécie.',
        controles: 'Controle positivo externo; o PAS exige controle de digestão por diástase quando aplicável.',
        limitacoes: [
          'Fungos degenerados podem corar mal.',
          'Estruturas não fúngicas argirófilas produzem falso-positivo no Grocott.',
        ],
        mudaODiferencial:
          'Fungos identificados deslocam integralmente o diagnóstico para micose profunda, com ' +
          'terapêutica distinta da antituberculosa.',
      },
    ],
    imunoHistoquimica: [],
    biologiaMolecular: [
      {
        nome: 'Teste molecular rápido (PCR em tempo real) para complexo M. tuberculosis',
        tipo: 'molecular',
        pergunta:
          'O agente é do complexo M. tuberculosis, e há mutação associada à resistência à rifampicina?',
        padraoEsperado:
          'Detecção de sequência-alvo específica do complexo, com leitura simultânea de mutações no ' +
          'gene rpoB.',
        limitacoes: [
          'Detecta DNA de bacilos inviáveis, o que limita o uso no controle de cura.',
          'Sensibilidade menor em material parafinado do que em escarro fresco.',
          'Painel de resistência restrito aos alvos incluídos no teste.',
        ],
        mudaODiferencial:
          'Confirma a espécie que a coloração não separa e antecipa em semanas a informação de ' +
          'resistência que a cultura levaria a dar.',
      },
    ],
    correlacaoClinica: [
      {
        achadoMorfologico: 'Caverna apical comunicante com brônquio',
        consequenciaFuncional:
          'Ambiente aeróbio com multiplicação bacilar intensa e drenagem contínua para a via aérea.',
        manifestacao: 'Tosse produtiva, escarro altamente infectante e transmissão por via aérea.',
      },
      {
        achadoMorfologico: 'Erosão vascular na parede da caverna',
        consequenciaFuncional: 'Comunicação entre vaso e cavidade aérea.',
        manifestacao: 'Hemoptise, ocasionalmente maciça.',
      },
      {
        achadoMorfologico: 'Fibrose retrátil apical com bronquiectasia de tração',
        consequenciaFuncional: 'Redução de volume e complacência; perda definitiva de área de troca.',
        manifestacao: 'Dispneia persistente e infecções de repetição mesmo após cura bacteriológica.',
      },
      {
        achadoMorfologico: 'Granulomas ativos com produção sustentada de citocinas',
        consequenciaFuncional: 'Estado inflamatório sistêmico e catabolismo aumentado.',
        manifestacao: 'Febre vespertina, sudorese noturna e emagrecimento.',
      },
    ],
    diagnosticosDiferenciais: [
      {
        nome: 'Micose profunda (histoplasmose, coccidioidomicose, criptococose)',
        motivoDaConfusao:
          'Produzem granulomas necrosantes morfologicamente indistinguíveis dos tuberculosos.',
        achadosCompartilhados: [
          'granuloma com necrose central',
          'células gigantes multinucleadas',
          'fibrose periférica',
        ],
        discriminador:
          'Identificação do fungo no Grocott/PAS. Sem coloração, a morfologia do granuloma não separa.',
        exameQueResolve: 'Grocott/GMS, PAS e cultura para fungos.',
        armadilhaDeAmostragem:
          'Fungos concentram-se na necrose central; amostrar só a periferia produz falso-negativo.',
      },
      {
        nome: 'Sarcoidose',
        motivoDaConfusao: 'Doença granulomatosa pulmonar crônica com linfadenopatia hilar.',
        achadosCompartilhados: ['granulomas epitelioides', 'células gigantes', 'fibrose'],
        discriminador:
          'Granulomas não caseosos, compactos, de distribuição linfática (peribroncovascular, ' +
          'subpleural e septal), com necrose ausente ou mínima.',
        exameQueResolve:
          'Colorações negativas para agentes e correlação clínico-radiológica; é diagnóstico de exclusão.',
      },
      {
        nome: 'Micobacteriose não tuberculosa',
        motivoDaConfusao: 'Ziehl-Neelsen positivo em granuloma necrosante.',
        achadosCompartilhados: ['bacilos álcool-ácido resistentes', 'granuloma necrosante', 'cavitação'],
        discriminador:
          'A coloração não separa as espécies; a distinção é microbiológica ou molecular, não morfológica.',
        exameQueResolve: 'Cultura com identificação de espécie ou teste molecular específico.',
      },
      {
        nome: 'Granulomatose com poliangiite',
        motivoDaConfusao: 'Nódulos pulmonares cavitados com necrose e inflamação granulomatosa.',
        achadosCompartilhados: ['nódulos cavitados', 'necrose extensa', 'células gigantes'],
        discriminador:
          'Necrose "geográfica" basofílica com debris, vasculite necrosante e granulomas mal ' +
          'formados; ausência de agente.',
        exameQueResolve: 'ANCA sérico (anti-PR3) e correlação com envolvimento renal e de vias aéreas superiores.',
      },
      {
        nome: 'Carcinoma pulmonar cavitado',
        motivoDaConfusao: 'Cavidade de paredes espessas no ápice, em paciente com perda de peso.',
        achadosCompartilhados: ['lesão cavitada', 'sintomas consumptivos', 'hemoptise'],
        discriminador:
          'Presença de células epiteliais atípicas invasivas na parede da cavidade, ausentes na ' +
          'caverna tuberculosa.',
        armadilhaDeAmostragem:
          'Carcinoma pode surgir na parede de uma cicatriz tuberculosa; encontrar granulomas não ' +
          'dispensa examinar toda a parede.',
      },
    ],
    complicacoes: [
      {
        complicacao: 'Tuberculose miliar',
        mecanismo:
          'Erosão de vaso sanguíneo por lesão caseosa, com semeadura hematogênica de bacilos e ' +
          'formação de micronódulos uniformes em múltiplos órgãos.',
      },
      {
        complicacao: 'Empiema tuberculoso e fibrotórax',
        mecanismo:
          'Extensão da lesão à pleura, com exsudato e organização fibrosa que aprisiona o pulmão.',
      },
      {
        complicacao: 'Aspergiloma em caverna residual',
        mecanismo:
          'Cavidade residual aberta e mal drenada é colonizada por Aspergillus, que forma uma bola ' +
          'fúngica com risco de hemoptise.',
      },
      {
        complicacao: 'Amiloidose AA secundária',
        mecanismo:
          'Inflamação crônica sustentada eleva a proteína sérica amiloide A, cujos fragmentos se ' +
          'depositam como fibrilas em rim, fígado e baço.',
      },
    ],
    normalVersusPatologico: [
      {
        aspecto: 'Septo alveolar',
        normal: 'Delgado, com capilar aderido; distância ar-sangue de poucos micrômetros.',
        patologico:
          'Substituído por agregado epitelioide, necrose caseosa ou colágeno; troca gasosa abolida ' +
          'no território acometido.',
      },
      {
        aspecto: 'Macrófago alveolar',
        normal: 'Célula isolada no espaço aéreo, com citoplasma vacuolado e função fagocítica comum.',
        patologico:
          'Transformado em célula epitelioide agregada, com citoplasma abundante e limites ' +
          'indistintos, ou fundido em célula gigante de Langhans.',
      },
      {
        aspecto: 'Espaço aéreo',
        normal: 'Vazio e confluente, delimitado por septos regulares.',
        patologico:
          'Ocupado por material caseoso ou convertido em caverna de paredes fibrosas comunicante ' +
          'com brônquio.',
      },
    ],
    resumoDeProva: [
      'Granuloma é resposta do hospedeiro, não dano direto do bacilo: sem linfócito T CD4+ e TNF, não há granuloma.',
      'A necrose caseosa é sugestiva, jamais suficiente — micoses profundas fazem o mesmo padrão.',
      'A topografia apical decorre da maior tensão de oxigênio e da menor drenagem linfática nos ápices.',
      'A caverna se forma pela drenagem brônquica do caseo; ela é a fonte da transmissibilidade.',
      'O Ziehl-Neelsen prova micobactéria, não espécie; a espécie é cultura ou biologia molecular.',
    ],
    armadilhas: [
      'Chamar necrose caseosa de patognomônica de tuberculose: ela não é.',
      'Concluir por ausência de tuberculose após um Ziehl-Neelsen negativo sem controle positivo válido.',
      'Confundir sarcoidose com tuberculose curada porque ambas têm granulomas e fibrose.',
      'Não procurar carcinoma na parede de uma cavidade "tuberculosa" em paciente tabagista.',
      'Interpretar granulomas mal formados de imunossuprimido como doença leve — costumam significar carga bacilar alta.',
    ],
    perguntasDeAutoavaliacao: [
      {
        pergunta:
          'Biópsia pulmonar mostra granulomas com necrose central amorfa, células gigantes de ' +
          'Langhans e coroa linfocitária. O Ziehl-Neelsen é negativo, com controle positivo válido. ' +
          'Qual é a conclusão mais correta?',
        alternativas: [
          'Tuberculose está excluída pelo Ziehl-Neelsen negativo.',
          'Trata-se de inflamação granulomatosa necrosante; tuberculose permanece provável e micoses profundas precisam ser afastadas com Grocott/PAS e cultura.',
          'Trata-se de sarcoidose, pois o Ziehl foi negativo.',
          'O diagnóstico é granulomatose com poliangiite, dada a necrose.',
        ],
        indiceCorreto: 1,
        devolutiva:
          'O Ziehl-Neelsen tem sensibilidade baixa: um negativo com controle válido reduz a ' +
          'probabilidade, mas não exclui. Sarcoidose é caracteristicamente não caseosa e diagnóstico ' +
          'de exclusão; granulomatose com poliangiite exige vasculite necrosante e necrose ' +
          'geográfica basofílica. A conduta é nomear o padrão com honestidade e prosseguir com ' +
          'colorações para fungos, cultura e teste molecular.',
        nivel: 'essencial',
      },
      {
        pergunta:
          'Por que a tuberculose pós-primária tem predileção pelos segmentos apicais e posteriores ' +
          'dos lobos superiores?',
        alternativas: [
          'Porque a ventilação apical é maior que a basal.',
          'Porque a relação ventilação/perfusão apical produz maior tensão de oxigênio, favorável ao bacilo aeróbio estrito, com drenagem linfática relativamente menos eficiente.',
          'Porque os bacilos sedimentam por gravidade nos ápices.',
          'Porque o parênquima apical tem menos macrófagos alveolares.',
        ],
        indiceCorreto: 1,
        devolutiva:
          'No ápice, a perfusão cai proporcionalmente mais que a ventilação, elevando a pressão ' +
          'alveolar de oxigênio — condição favorável a um aeróbio estrito. A drenagem linfática ' +
          'apical também é comparativamente menos eficiente, o que retarda a remoção de bacilos. A ' +
          'ventilação absoluta é maior nas bases, e a sedimentação gravitacional favoreceria as ' +
          'bases, não os ápices.',
        nivel: 'aprofundar',
      },
      {
        pergunta:
          'Paciente em uso de anti-TNF desenvolve doença disseminada. A biópsia mostra agregados ' +
          'frouxos de macrófagos, sem células gigantes e sem necrose organizada, com Ziehl-Neelsen ' +
          'fortemente positivo. Como interpretar?',
        alternativas: [
          'Doença leve, porque os granulomas são pouco desenvolvidos.',
          'Falha na formação e manutenção do granuloma por bloqueio de TNF, com perda de contenção e alta carga bacilar — quadro grave.',
          'Reação a corpo estranho.',
          'Contaminação da coloração, dada a discordância entre morfologia e bacilos.',
        ],
        indiceCorreto: 1,
        devolutiva:
          'O TNF é essencial para recrutar e manter a arquitetura do granuloma. Bloqueá-lo desfaz a ' +
          'contenção: o agregado não se organiza, não caseifica de forma delimitada, e o bacilo se ' +
          'multiplica livremente — daí o Ziehl exuberante. A pobreza morfológica indica gravidade, ' +
          'não benignidade, e é o padrão clássico de reativação sob imunobiológicos.',
        nivel: 'avancado',
      },
    ],
    referencias: [
      {
        citacao:
          'Kumar V, Abbas AK, Aster JC. Robbins & Cotran Pathologic Basis of Disease. 10ª ed. Elsevier; 2021. Capítulo de doenças infecciosas e de pulmão.',
        organizacao: 'Elsevier',
        edicao: '10ª',
        ano: 2021,
      },
      {
        citacao:
          'Brasil. Ministério da Saúde. Manual de Recomendações para o Controle da Tuberculose no Brasil. 2ª ed. Brasília; 2019.',
        organizacao: 'Ministério da Saúde do Brasil',
        edicao: '2ª',
        ano: 2019,
      },
      {
        citacao:
          'World Health Organization. WHO consolidated guidelines on tuberculosis: rapid diagnostics for tuberculosis detection. Genebra: WHO; 2021.',
        organizacao: 'Organização Mundial da Saúde',
        ano: 2021,
      },
    ],
  },
  revisao: {
    estado: 'revisao-medica',
    versao: 1,
    atualizadoEm: '2026-08-09',
    pendencias: [
      'Revisão por patologista e por infectologista, sobretudo dos pesos diagnósticos atribuídos à necrose caseosa.',
      'Conferir as recomendações de teste molecular contra a edição vigente do manual do Ministério da Saúde.',
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
