import type { Ferramenta, Nivel, Resultado } from '../tipos'
import {
  campoIdade,
  campoNum,
  campoOpc,
  campoPeso,
  campoSeg,
  campoSexo,
  campoSimNao,
  fmt,
  fmtInt,
  num,
  numOu,
  opc,
  pts,
  sim,
  somaSimNao,
} from '../helpers'

/* ═══════════════════════ Escores de deterioração ═══════════════════════ */

const qsofa: Ferramenta = {
  id: 'qsofa',
  nome: 'qSOFA',
  sinonimos: ['qsofa', 'quick sofa', 'sepse rastreio'],
  resumo: 'Três sinais de beira de leito que sinalizam risco de desfecho ruim na infecção.',
  categorias: ['infectologia', 'emergencia'],
  campos: [
    campoSimNao('fr', 'Frequência respiratória ≥ 22 irpm', 1, 'Conte por 60 segundos observando o tórax. Corte mais alto que o da SIRS (que usa 20) justamente para ganhar especificidade — 22 irpm já é desvio claro, não variação de ansiedade.'),
    campoSimNao('mental', 'Alteração do estado mental (Glasgow < 15)', 1, 'Qualquer redução em relação ao basal, inclusive Glasgow 14 por desorientação leve. No idoso é frequentemente o primeiro e único sinal de sepse — compare com o basal relatado pelo cuidador, não com a normalidade.'),
    campoSimNao('pas', 'PA sistólica ≤ 100 mmHg', 1, 'Corte mais permissivo que o de choque (90 mmHg), porque o escore busca deterioração antes do colapso. Num hipertenso crônico, 110 mmHg já pode ser hipotensão relativa que o escore não vê.'),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'fr', pontos: 1 },
      { id: 'mental', pontos: 1 },
      { id: 'pas', pontos: 1 },
    ])
    return {
      titulo: 'qSOFA',
      valor: String(total),
      unidade: 'de 3 pontos',
      nivel: total >= 2 ? 'critico' : total === 1 ? 'atencao' : 'ok',
      rotuloNivel: total >= 2 ? 'Positivo — alto risco' : 'Negativo',
      detalhes: [{ rotulo: 'Ponto de corte', valor: '≥ 2 pontos' }],
      interpretacao: [
        total >= 2
          ? 'qSOFA ≥ 2 em paciente com infecção suspeita identifica risco elevado de morte ou permanência prolongada em UTI. Isso **não** faz diagnóstico de sepse: acione a avaliação de disfunção orgânica (SOFA completo, lactato, gasometria, função renal e hepática) e inicie o pacote de tratamento.'
          : 'qSOFA negativo. **Não exclui sepse.** A sensibilidade do qSOFA é baixa — em torno de 50 a 60% —, e vários pacientes com sepse instalada têm qSOFA de 0 ou 1. Se a suspeita clínica é forte, prossiga com a investigação.',
        'A Surviving Sepsis Campaign de 2021 **desaconselha** o uso do qSOFA como ferramenta única de rastreio, recomendando preferencialmente SIRS, NEWS ou MEWS, que são mais sensíveis. O qSOFA continua útil como marcador prognóstico, não como triagem.',
        'A grande vantagem é operacional: três variáveis, nenhuma exige exame, e podem ser obtidas em segundos por qualquer profissional em qualquer ponto do atendimento.',
        'Não é coincidência que os três itens sejam **respiração, consciência e pressão**: eles são as três janelas mais precoces para a disfunção orgânica da sepse, e cada um reflete um mecanismo distinto. A **taquipneia** tem dupla origem — a acidose metabólica da hipoperfusão tecidual, que estimula quimiorreceptores centrais e periféricos, somada ao aumento do espaço morto alveolar e ao shunt por lesão endotelial pulmonar mediada por citocinas. Como a ventilação é o único mecanismo compensatório com latência de segundos e capacidade de amplificar dez vezes, é o primeiro a se mover. A **alteração de consciência** é a encefalopatia séptica, cuja fisiopatologia combina redução do fluxo sanguíneo cerebral, disfunção da barreira hematoencefálica com passagem de citocinas, desequilíbrio de neurotransmissores e disfunção mitocondrial em neurônios — e ela aparece precocemente porque o cérebro não estoca substrato. A **hipotensão** é a mais tardia das três: resulta da vasodilatação por óxido nítrico induzível, da fuga capilar por lesão do glicocálice endotelial e da depressão miocárdica induzida por citocinas, mas só se manifesta depois que a vasoconstrição compensatória e a taquicardia esgotam sua capacidade de sustentar a pressão. Essa hierarquia temporal tem consequência prática direta: qSOFA de 1 ponto por taquipneia isolada, em paciente com infecção, não é escore negativo — é possivelmente o estágio inicial do mesmo processo, e merece reavaliação em curto intervalo em vez de alta.',
      ],
      conduta: total >= 2
        ? [
            'Trate como paciente de alto risco **imediatamente**. qSOFA ≥ 2 com infecção suspeita associa-se a mortalidade intra-hospitalar em torno de 10 vezes maior que qSOFA 0 — é gatilho de ação, não de observação.',
            'Colha o que define sepse e orienta o tratamento: lactato, gasometria, hemograma, creatinina, bilirrubina, plaquetas e coagulograma para calcular o **SOFA completo**. Colha hemoculturas de dois sítios antes do antibiótico, sem atrasar a primeira dose.',
            'Aplique o **pacote de 1 hora**: antibiótico de amplo espectro conforme o foco provável, cristaloide 30 mL/kg na hipotensão ou lactato ≥ 4 mmol/L, e noradrenalina para manter PAM ≥ 65 mmHg se o volume não responder. Repita o lactato em 2 a 4 horas — clareamento é o marcador de resposta.',
            'Procure e trate o **foco**: exame físico dirigido, urina, radiografia de tórax, imagem conforme a hipótese. Controle de foco (drenagem de abscesso, retirada de cateter, desbridamento, descompressão biliar ou urinária) é determinante de mortalidade e não pode esperar pela cultura.',
            'Reavalie o nível de cuidado e comunique a equipe assistencial e a família. Considere leito monitorizado ou UTI — o escore foi otimizado justamente para predizer morte e permanência prolongada em terapia intensiva.',
          ]
        : total === 1
          ? [
              'Um ponto não é escore negativo em paciente com infecção: dada a hierarquia temporal dos três itens, pode ser o estágio inicial do mesmo processo. Reavalie em intervalo curto, de 1 a 2 horas, com sinais vitais completos.',
              'Colha lactato e função orgânica se a suspeita de infecção for consistente. A decisão de investigar disfunção orgânica se baseia na suspeita clínica, não no escore.',
              'Aplique em paralelo um instrumento mais sensível de rastreio — SIRS, NEWS2 ou MEWS —, que é o que a Surviving Sepsis Campaign de 2021 recomenda para essa finalidade.',
              'Trate a infecção identificada e defina explicitamente o gatilho de reavaliação e quem reavalia antes de qualquer decisão de alta.',
            ]
          : [
              'qSOFA negativo **não exclui sepse**. A sensibilidade é de apenas 50 a 60%, e boa parte dos pacientes com sepse instalada tem qSOFA 0 ou 1 — sobretudo idoso, imunossuprimido, neutropênico, urêmico, cirrótico e betabloqueado.',
              'Se a suspeita clínica de infecção grave persistir, investigue independentemente do escore: lactato, função orgânica, busca de foco. Nenhum rastreio negativo encerra suspeita bem fundamentada.',
              'Use um instrumento mais sensível para vigilância seriada (NEWS2 ou MEWS) em vez de repetir o qSOFA, que foi construído para prognóstico e não para triagem.',
              'Trate a infecção conforme o sítio e a gravidade, e oriente sinais de alarme ao paciente e à família se a conduta for ambulatorial.',
            ],
      alertas: [
        'qSOFA **não é critério diagnóstico de sepse**. Sepse é infecção suspeita com aumento de 2 ou mais pontos no SOFA. Usar o qSOFA como definição gera subdiagnóstico, porque ele é específico e pouco sensível.',
        'A Surviving Sepsis Campaign de 2021 **desaconselha** o qSOFA como ferramenta única de rastreio, por baixa sensibilidade, recomendando SIRS, NEWS2 ou MEWS para essa função. O qSOFA permanece útil como marcador prognóstico.',
        'Sinais atenuados em idoso, imunossuprimido, urêmico, cirrótico e em uso de betabloqueador mantêm o escore em zero até fase avançada — exatamente os grupos de maior mortalidade.',
        'Não foi validado em pediatria, em gestantes nem em pacientes já internados em UTI, contexto em que o SOFA completo é o instrumento apropriado.',
      ],
      tabela: {
        titulo: 'qSOFA e mortalidade intra-hospitalar na infecção suspeita',
        colunas: ['Pontos', 'Interpretação', 'Mortalidade relativa', 'Conduta'],
        linhas: [
          ['0', 'Negativo', 'Referência', 'Não exclui sepse; seguir suspeita clínica'],
          ['1', 'Negativo pelo corte', 'Levemente maior', 'Reavaliar em 1 a 2 h; instrumento mais sensível'],
          ['2 – 3', 'Positivo, alto risco', 'Cerca de 10 vezes maior', 'SOFA, lactato e pacote de 1 hora agora'],
        ],
        destaque: total === 0 ? 0 : total === 1 ? 1 : 2,
      },
    }
  },
  formula: ['1 ponto para cada: FR ≥ 22 | alteração mental | PAS ≤ 100 mmHg'],
  fundamento:
    'O qSOFA nasceu com o Sepsis-3, em 2016, quando a força-tarefa buscou um substituto rápido para o SOFA fora da UTI. Derivado de mais de 1,3 milhão de registros eletrônicos, foi otimizado para **predizer mortalidade**, não para detectar infecção — e essa distinção explica sua alta especificidade com baixa sensibilidade. É um ponto conceitual que gera confusão persistente e vale desfazer: um modelo treinado para separar quem morre de quem sobrevive aprende a reconhecer doença **já avançada**, porque é nela que o desfecho é previsível. Um modelo treinado para detectar doença precoce aprende o oposto. Não existe instrumento que faça as duas coisas bem com três variáveis, e o qSOFA escolheu a primeira. Os três itens selecionados não são arbitrários: correspondem às três janelas mais precoces de disfunção orgânica na sepse, cada uma com mecanismo próprio. A taquipneia resulta da acidose metabólica da hipoperfusão somada ao aumento de espaço morto por lesão endotelial pulmonar, e é a primeira a aparecer porque a ventilação compensa em segundos. A alteração de consciência é a encefalopatia séptica — fluxo cerebral reduzido, barreira hematoencefálica permeável a citocinas, desequilíbrio de neurotransmissores e disfunção mitocondrial neuronal. A hipotensão é a mais tardia, porque vasoconstrição e taquicardia sustentam a pressão até o esgotamento da reserva, e resulta de vasodilatação por óxido nítrico induzível, fuga capilar por degradação do glicocálice endotelial e depressão miocárdica por citocinas. Essa hierarquia explica por que o escore é tão específico: quando dois dos três estão presentes, o processo já avançou. E explica por que, na prática, a Surviving Sepsis Campaign de 2021 o retirou da recomendação de rastreio — para rastrear é preciso sensibilidade, e o preço da especificidade do qSOFA é deixar passar cerca de metade dos casos.',
  armadilhas: [
    'qSOFA não é critério diagnóstico de sepse. Sepse é infecção suspeita com aumento de 2 pontos no SOFA.',
    'Em imunossuprimidos, idosos e pacientes em uso de betabloqueador, os sinais podem estar atenuados e o escore permanece zero até fase avançada.',
    'Um ponto é frequentemente lido como negativo e arquivado. Em paciente com infecção, taquipneia isolada pode ser o estágio inicial do processo e merece reavaliação em curto intervalo.',
    'A alteração de consciência exige comparação com o basal. Em demência, delirium hipoativo se manifesta como sonolência e apatia, é o mais comum no idoso e passa por "paciente tranquilo".',
    'Os cortes são fixos e populacionais: no hipertenso crônico, 110 mmHg de sistólica pode ser hipotensão relativa e não pontua; no atleta ou no betabloqueado, a compensação é atípica.',
    'Usá-lo para rastreio contraria a recomendação atual. Se a intenção é rastrear, use SIRS, NEWS2 ou MEWS; o qSOFA responde "qual o risco de este paciente morrer?", não "este paciente tem sepse?".',
  ],
  referencias: [
    { texto: 'Singer M, Deutschman CS, Seymour CW, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801-810.' },
    { texto: 'Evans L, Rhodes A, Alhazzani W, et al. Surviving Sepsis Campaign: international guidelines for management of sepsis and septic shock 2021. Intensive Care Med. 2021;47(11):1181-1247.' },
  ],
}

const sofa: Ferramenta = {
  id: 'sofa',
  nome: 'SOFA — avaliação sequencial de falência orgânica',
  sinonimos: ['sofa', 'disfuncao organica', 'sepsis 3'],
  resumo: 'Quantifica a disfunção de seis órgãos e define sepse pelo critério Sepsis-3.',
  categorias: ['infectologia', 'emergencia'],
  campos: [
    campoOpc('resp', 'Respiração — PaO₂/FiO₂', [
      { valor: '0', rotulo: '≥ 400', pontos: 0 },
      { valor: '1', rotulo: '< 400', pontos: 1 },
      { valor: '2', rotulo: '< 300', pontos: 2 },
      { valor: '3', rotulo: '< 200 com suporte ventilatório', pontos: 3 },
      { valor: '4', rotulo: '< 100 com suporte ventilatório', pontos: 4 },
    ]),
    campoOpc('coag', 'Coagulação — plaquetas (×10³/µL)', [
      { valor: '0', rotulo: '≥ 150', pontos: 0 },
      { valor: '1', rotulo: '< 150', pontos: 1 },
      { valor: '2', rotulo: '< 100', pontos: 2 },
      { valor: '3', rotulo: '< 50', pontos: 3 },
      { valor: '4', rotulo: '< 20', pontos: 4 },
    ]),
    campoOpc('figado', 'Fígado — bilirrubina (mg/dL)', [
      { valor: '0', rotulo: '< 1,2', pontos: 0 },
      { valor: '1', rotulo: '1,2 a 1,9', pontos: 1 },
      { valor: '2', rotulo: '2,0 a 5,9', pontos: 2 },
      { valor: '3', rotulo: '6,0 a 11,9', pontos: 3 },
      { valor: '4', rotulo: '≥ 12,0', pontos: 4 },
    ]),
    campoOpc('cardio', 'Cardiovascular', [
      { valor: '0', rotulo: 'PAM ≥ 70 mmHg', pontos: 0 },
      { valor: '1', rotulo: 'PAM < 70 mmHg sem vasopressor', pontos: 1 },
      { valor: '2', rotulo: 'Dopamina ≤ 5 ou dobutamina em qualquer dose', pontos: 2 },
      { valor: '3', rotulo: 'Dopamina > 5, ou noradrenalina/adrenalina ≤ 0,1 µg/kg/min', pontos: 3 },
      { valor: '4', rotulo: 'Dopamina > 15, ou noradrenalina/adrenalina > 0,1 µg/kg/min', pontos: 4 },
    ]),
    campoOpc('snc', 'Sistema nervoso — Escala de Coma de Glasgow', [
      { valor: '0', rotulo: '15', pontos: 0 },
      { valor: '1', rotulo: '13 a 14', pontos: 1 },
      { valor: '2', rotulo: '10 a 12', pontos: 2 },
      { valor: '3', rotulo: '6 a 9', pontos: 3 },
      { valor: '4', rotulo: '< 6', pontos: 4 },
    ]),
    campoOpc('renal', 'Renal — creatinina ou diurese', [
      { valor: '0', rotulo: 'Creatinina < 1,2 mg/dL', pontos: 0 },
      { valor: '1', rotulo: '1,2 a 1,9 mg/dL', pontos: 1 },
      { valor: '2', rotulo: '2,0 a 3,4 mg/dL', pontos: 2 },
      { valor: '3', rotulo: '3,5 a 4,9 mg/dL, ou diurese < 500 mL/dia', pontos: 3 },
      { valor: '4', rotulo: '≥ 5,0 mg/dL, ou diurese < 200 mL/dia', pontos: 4 },
    ]),
    campoNum('basal', 'SOFA basal conhecido', { min: 0, max: 24, passo: 1, padrao: '0', opcional: true, ajuda: 'Em paciente sem disfunção prévia conhecida, o basal é zero.' }),
  ],
  calcular: (v) => {
    const ids = ['resp', 'coag', 'figado', 'cardio', 'snc', 'renal']
    let total = 0
    const detalhes: Resultado['detalhes'] = []
    const nomes = ['Respiratório', 'Coagulação', 'Hepático', 'Cardiovascular', 'Neurológico', 'Renal']
    for (let i = 0; i < ids.length; i++) {
      const x = num(v, ids[i])
      if (x === null) return null
      total += x
      detalhes.push({ rotulo: nomes[i], valor: `${x} ponto(s)`, nivel: x >= 3 ? 'alerta' : x >= 1 ? 'atencao' : 'ok' })
    }
    const basal = numOu(v, 'basal', 0)
    const delta = total - basal
    const mortalidade = total <= 6 ? '< 10%' : total <= 9 ? '15 a 20%' : total <= 12 ? '40 a 50%' : total <= 14 ? '50 a 60%' : '> 80%'
    detalhes.push({ rotulo: 'Variação em relação ao basal', valor: `${delta >= 0 ? '+' : ''}${delta} ponto(s)`, nota: 'Aumento ≥ 2 pontos em paciente com infecção suspeita **define sepse** pelo Sepsis-3.', nivel: delta >= 2 ? 'critico' : 'ok' })
    detalhes.push({ rotulo: 'Mortalidade hospitalar aproximada', valor: mortalidade })
    const nivel: Nivel = total >= 12 ? 'critico' : total >= 8 ? 'alerta' : total >= 4 ? 'atencao' : 'ok'
    return {
      titulo: 'SOFA total',
      valor: String(total),
      unidade: 'de 24 pontos',
      nivel,
      rotuloNivel: delta >= 2 ? 'Critério de sepse preenchido (Δ ≥ 2)' : 'Sem aumento de 2 pontos em relação ao basal',
      detalhes,
      conduta: [
        'Use o SOFA para **acompanhar a trajetória**, não apenas para pontuar uma vez: a variação do escore nas primeiras 48–72 h prediz mortalidade melhor que o valor de admissão. SOFA que sobe apesar do tratamento sinaliza falha da estratégia e obriga reavaliar foco, antimicrobiano e suporte.',
        'Um **aumento ≥ 2 pontos** sobre o basal, em paciente com infecção suspeita ou confirmada, define **sepse** pela Sepsis-3. Em quem não tem disfunção prévia conhecida, presuma basal zero. Feito o diagnóstico, dispare o pacote de 1 hora: lactato, hemoculturas antes do antibiótico, antimicrobiano de amplo espectro, 30 mL/kg de cristaloide se houver hipotensão ou lactato ≥ 4 mmol/L, e vasopressor para manter PAM ≥ 65 mmHg.',
        'Trate cada componente que pontua, porque cada um tem intervenção própria: **respiratório** (otimizar ventilação, ventilação protetora, posição prona se PaO₂/FiO₂ < 150), **cardiovascular** (volume, noradrenalina, vasopressina de segunda linha), **renal** (evitar nefrotóxicos, indicações de diálise), **hematológico** (transfusão de plaquetas por gatilhos, não por número isolado), **hepático** e **neurológico** (afastar causas estruturais e metabólicas do rebaixamento).',
        'SOFA **≥ 11** associa-se a mortalidade acima de 80% e é um bom momento para **conversa sobre objetivos de cuidado** com a família. Use-o como gatilho de comunicação, nunca como critério isolado de limitação: o escore descreve populações e não determina o desfecho de um indivíduo.',
        'Lembre das limitações que distorcem o cálculo: o componente neurológico é inválido em paciente **sedado**, o respiratório depende de gasometria arterial que nem sempre existe, e a bilirrubina e a creatinina podem estar cronicamente alteradas. Registre o SOFA basal do paciente crônico — sem ele, o critério de aumento de 2 pontos não pode ser aplicado.',
      ],
      alertas: [
        'O componente neurológico é inválido em paciente sedado, e bilirrubina e creatinina podem estar cronicamente alteradas. Sem registrar o SOFA basal do paciente crônico, o critério de aumento de 2 pontos que define sepse não pode ser aplicado.',
      ],
      interpretacao: [
        '**Sepse (Sepsis-3)** = infecção suspeita ou documentada **mais** aumento de 2 ou mais pontos no SOFA. **Choque séptico** = sepse com necessidade de vasopressor para manter PAM ≥ 65 mmHg **e** lactato acima de 2 mmol/L, ambos apesar de ressuscitação volêmica adequada. A mortalidade do choque séptico assim definido supera 40%.',
        'A tendência do SOFA vale mais do que o valor isolado: SOFA que sobe nas primeiras 48 a 72 horas de UTI associa-se a mortalidade muito maior do que SOFA alto e estável.',
        'O escore foi criado para **descrever** morbidade em populações, não para decidir conduta individual. Usá-lo como critério de alocação de recurso escasso — como se propôs em protocolos de pandemia — é uma extrapolação que os próprios autores criticaram.',
      ],
    }
  },
  formula: ['SOFA = soma de 6 componentes, 0 a 4 pontos cada (máximo 24)', 'Sepse = infecção + ΔSOFA ≥ 2'],
  fundamento:
    'O SOFA foi criado em 1996 por um grupo de consenso da sociedade europeia de terapia intensiva, inicialmente chamado "sepsis-related organ failure assessment" e depois renomeado para "sequential" ao se perceber que servia a qualquer paciente crítico. Cada componente representa um órgão com um marcador barato, disponível e de gradação clara — a escolha das variáveis privilegiou reprodutibilidade sobre sofisticação.',
  armadilhas: [
    'O componente neurológico usa a escala de Glasgow, que fica prejudicada em paciente sedado. Pontue pelo melhor valor antes da sedação, ou registre a limitação.',
    'Doença crônica hepática ou renal eleva o SOFA basal — sem descontar o basal, todo cirrótico "tem sepse".',
  ],
  referencias: [
    { texto: 'Vincent JL, Moreno R, Takala J, et al. The SOFA score to describe organ dysfunction/failure. Intensive Care Med. 1996;22(7):707-710.' },
    { texto: 'Singer M, et al. Sepsis-3. JAMA. 2016;315(8):801-810.' },
  ],
}

const sirs: Ferramenta = {
  id: 'sirs',
  nome: 'Critérios de SIRS',
  sinonimos: ['sirs', 'resposta inflamatoria sistemica'],
  resumo: 'Os quatro critérios clássicos de resposta inflamatória, e por que deixaram de definir sepse.',
  categorias: ['infectologia', 'emergencia'],
  campos: [
    campoSimNao('temp', 'Temperatura > 38 °C ou < 36 °C', 1, 'Os dois extremos contam. Hipotermia é mais ominosa que febre no idoso, no urêmico e no imunossuprimido — indica falência da resposta termorreguladora, não infecção branda.'),
    campoSimNao('fc', 'Frequência cardíaca > 90 bpm', 1, 'Corte muito baixo e, por isso, muito inespecífico: dor, ansiedade, febre, anemia, desidratação e abstinência atingem 90 bpm. Betabloqueado e cardiopata com marcapasso podem não atingir mesmo em choque.'),
    campoSimNao('fr', 'Frequência respiratória > 20 irpm ou PaCO₂ < 32 mmHg', 1, 'Basta um dos dois. A PaCO₂ baixa é a hiperventilação já documentada em gasometria — frequentemente positiva antes de a frequência contada passar de 20.'),
    campoSimNao('leuco', 'Leucócitos > 12.000, < 4.000/mm³, ou > 10% de formas jovens', 1, 'Três alternativas, basta uma. As "formas jovens" são os bastonetes — o desvio à esquerda. É o único critério que exige exame laboratorial, o que impede aplicar a SIRS integralmente na triagem.'),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'temp', pontos: 1 },
      { id: 'fc', pontos: 1 },
      { id: 'fr', pontos: 1 },
      { id: 'leuco', pontos: 1 },
    ])
    return {
      titulo: 'Critérios de SIRS',
      valor: String(total),
      unidade: 'de 4',
      nivel: total >= 2 ? 'alerta' : 'ok',
      rotuloNivel: total >= 2 ? 'SIRS presente' : 'SIRS ausente',
      detalhes: [{ rotulo: 'Ponto de corte', valor: '≥ 2 critérios' }],
      interpretacao: [
        'Desde o Sepsis-3 (2016), SIRS **não define mais sepse**. O motivo é que ela é inespecífica — praticamente todo paciente internado com qualquer agressão preenche dois critérios — e insensível: um estudo australiano com mais de 100 mil pacientes mostrou que 1 em cada 8 pacientes com infecção e disfunção orgânica **não** preenchia dois critérios de SIRS, e a mortalidade desse grupo era igual à dos que preenchiam.',
        'Isso não a torna inútil. Justamente por ser sensível a alterações fisiológicas precoces, a SIRS funciona bem como **ferramenta de rastreio** — que é o uso recomendado pela Surviving Sepsis Campaign de 2021, ao lado de NEWS e MEWS.',
        total >= 2 ? 'Com dois ou mais critérios e suspeita de infecção, prossiga imediatamente para a avaliação de disfunção orgânica: lactato, gasometria, hemograma, função renal e hepática, coagulograma.' : 'Menos de dois critérios não exclui infecção grave, sobretudo em idoso, imunossuprimido, urêmico ou em uso de betabloqueador.',
        'Entender **o que** a SIRS mede explica ao mesmo tempo sua sensibilidade e sua inespecificidade. Ela é a leitura clínica da resposta imune innata inicial. Padrões moleculares associados a patógenos (PAMPs — lipopolissacarídeo, peptidoglicano, RNA viral) e padrões associados a dano tecidual (DAMPs — DNA mitocondrial, HMGB1, ATP extracelular liberados por células necróticas) ativam receptores de reconhecimento de padrão, sobretudo os do tipo Toll, em macrófagos e neutrófilos. A via NF-κB é ativada e desencadeia a produção de TNF-α, IL-1β e IL-6, que produzem cada um dos quatro critérios: a IL-1β e a prostaglandina E₂ reajustam o termostato hipotalâmico (febre); a resposta adrenérgica e a vasodilatação mediada por óxido nítrico elevam a frequência cardíaca; a acidose metabólica e os mediadores centrais aumentam a ventilação; e a IL-6 com o G-CSF mobilizam o pool de reserva medular de neutrófilos, gerando leucocitose com desvio à esquerda. O ponto crucial é que **essa via é idêntica** para infecção e para dano tecidual estéril: os DAMPs de um politrauma, de uma pancreatite, de uma queimadura ou de uma cirurgia de grande porte acionam os mesmos receptores que o lipopolissacarídeo bacteriano. A SIRS, portanto, mede com razoável fidelidade que existe inflamação sistêmica — e é constitucionalmente incapaz de dizer se há infecção. Foi exatamente esse limite conceitual, e não um defeito de calibração, que levou o Sepsis-3 a substituí-la pela disfunção orgânica medida pelo SOFA.',
      ],
      conduta: total >= 2
        ? [
            'Pergunte primeiro se há **suspeita de infecção**. SIRS sem foco infeccioso plausível aponta para as causas estéreis da mesma via inflamatória: trauma, pancreatite, queimadura, pós-operatório, tromboembolismo pulmonar, isquemia mesentérica, hemorragia, crise tireotóxica, síndrome de abstinência, reação a fármaco, lise tumoral.',
            'Se houver suspeita de infecção, avance **imediatamente** para a avaliação de disfunção orgânica, que é o que define sepse hoje: lactato, gasometria, hemograma, creatinina, bilirrubina, plaquetas e coagulograma. Calcule o SOFA e o qSOFA e procure o foco com exame físico dirigido, urina, radiografia de tórax e imagem conforme a hipótese.',
            'Com disfunção orgânica presente, aplique o **pacote de 1 hora**: lactato, hemoculturas antes do antibiótico sem atrasar a primeira dose, antibiótico de amplo espectro, cristaloide 30 mL/kg na hipotensão ou lactato ≥ 4 mmol/L, e noradrenalina para PAM ≥ 65 mmHg se o volume não responder. Repita o lactato em 2 a 4 horas.',
            'Controle o foco assim que identificado — drenagem de abscesso, retirada de cateter infectado, desbridamento, descompressão de via biliar ou urinária. Antibiótico sem controle de foco falha, e o atraso na intervenção é determinante de mortalidade.',
            'Se não houver disfunção orgânica, o paciente tem infecção sem sepse: trate a infecção, mantenha vigilância com reavaliação e escore de alerta precoce seriado, e não conclua que está seguro — a disfunção pode se instalar nas horas seguintes.',
          ]
        : [
            'Menos de dois critérios **não** exclui infecção grave. Cerca de 1 em cada 8 pacientes com infecção e disfunção orgânica não preenche dois critérios de SIRS, e a mortalidade desse grupo é igual à dos que preenchem.',
            'Se a suspeita clínica persistir, prossiga com a investigação independentemente do escore: colha lactato e exames de função orgânica, calcule o qSOFA e examine o paciente procurando foco. Nenhum critério de rastreio negativo encerra uma suspeita clínica bem fundamentada.',
            'Suspeite especialmente nos grupos que não montam resposta inflamatória detectável: idoso (que frequentemente se apresenta apenas com queda ou confusão), imunossuprimido, neutropênico, urêmico, cirrótico, em uso de corticoide ou de betabloqueador, e o recém-nascido.',
            'Aplique um escore de alerta precoce seriado (NEWS2 ou MEWS) em vez de repetir a SIRS: eles agregam mais parâmetros, detectam tendência e foram desenhados para vigilância.',
          ],
      alertas: [
        'Desde o Sepsis-3 (2016), a SIRS **não define sepse**. Sepse é infecção com disfunção orgânica, medida por aumento de 2 ou mais pontos no SOFA. Registrar "SIRS positivo" como diagnóstico de sepse é erro conceitual com consequência em codificação, protocolo e conduta.',
        'SIRS é comum e frequentemente benigna: dois critérios em paciente com dor pós-operatória, ansiedade ou desidratação não são sepse, e tratá-los como tal gera antibiótico desnecessário e resistência.',
        'A ausência de SIRS não tranquiliza em idoso, imunossuprimido, urêmico, cirrótico ou betabloqueado — exatamente os grupos de maior mortalidade por sepse.',
        'O critério leucocitário exige hemograma, o que impede aplicar a SIRS completa na triagem. Aplicá-la com três critérios e chamar de SIRS negativa é subestimar sistematicamente.',
      ],
      tabela: {
        titulo: 'O que cada definição responde',
        colunas: ['Instrumento', 'Pergunta que responde', 'Uso recomendado hoje'],
        linhas: [
          ['SIRS', 'Há inflamação sistêmica?', 'Rastreio, ao lado de NEWS e MEWS'],
          ['qSOFA', 'Há risco de desfecho ruim fora da UTI?', 'Rastreio à beira do leito, sem exame'],
          ['SOFA', 'Há disfunção orgânica e qual a magnitude?', 'Define sepse (Sepsis-3)'],
          ['Lactato e PAM', 'Há choque séptico?', 'Vasopressor e lactato > 2 apesar de volume'],
        ],
        destaque: 0,
      },
    }
  },
  formula: ['SIRS = 2 ou mais dos 4 critérios'],
  fundamento:
    'Os critérios foram estabelecidos na conferência de consenso de 1991, com a intenção deliberada de serem simples e sensíveis, capturando a resposta do hospedeiro a qualquer agressão — infecciosa ou não (trauma, pancreatite, queimadura, cirurgia). O erro histórico não foi criá-los, foi transformá-los em definição de sepse, papel para o qual nunca foram desenhados. O que a SIRS mede, mecanisticamente, é a ativação da imunidade innata: padrões moleculares associados a patógenos (lipopolissacarídeo, peptidoglicano, RNA viral) e padrões associados a dano tecidual (DNA mitocondrial, HMGB1, ATP extracelular, liberados por células necróticas) ativam receptores do tipo Toll em macrófagos e neutrófilos, disparam a via NF-κB e a produção de TNF-α, IL-1β e IL-6. Cada critério é a manifestação clínica de um desses mediadores — a IL-1β com a prostaglandina E₂ reajusta o termostato hipotalâmico, a vasodilatação por óxido nítrico e a resposta adrenérgica elevam a frequência cardíaca, a acidose e os mediadores centrais aumentam a ventilação, e a IL-6 com o G-CSF mobilizam o pool de reserva medular produzindo leucocitose com desvio à esquerda. A limitação é estrutural e não corrigível: a via é a mesma para infecção e para dano estéril, de modo que a SIRS é constitucionalmente incapaz de distinguir uma da outra. A ela somou-se um problema de calibração — os cortes são tão baixos (frequência cardíaca acima de 90 bpm, frequência respiratória acima de 20 irpm) que praticamente todo internado os atinge. O estudo de Kaukonen, com mais de 100 mil pacientes australianos e neozelandeses, mostrou o outro lado da moeda e foi decisivo: 1 em cada 8 pacientes com infecção e disfunção orgânica **não** preenchia dois critérios, e sua mortalidade era igual à dos que preenchiam. Um instrumento simultaneamente inespecífico e insensível não pode definir doença. O Sepsis-3 então redefiniu sepse como infecção com disfunção orgânica medida pelo SOFA, e a SIRS foi realocada para a função que sempre desempenhou bem e que a Surviving Sepsis Campaign de 2021 lhe reconhece: rastreio.',
  armadilhas: [
    'SIRS é comum e frequentemente benigna. Dois critérios num paciente com dor pós-operatória não são sepse.',
    'Usá-la como definição de sepse é erro conceitual desde 2016, com impacto em protocolo institucional, codificação e indicação de antibiótico.',
    'Cortes muito baixos de frequência cardíaca e respiratória tornam os critérios positivos em quase todo internado — a especificidade é próxima de inútil em enfermaria.',
    'Insensível justamente nos grupos de maior mortalidade: idoso, imunossuprimido, neutropênico, urêmico, cirrótico e em uso de betabloqueador ou corticoide.',
    'Exige hemograma para o quarto critério. Aplicar apenas os três clínicos e concluir "SIRS negativa" subestima o paciente.',
    'Positividade sem foco infeccioso plausível costuma indicar causa estéril da mesma via — trauma, pancreatite, queimadura, tromboembolismo, isquemia mesentérica, abstinência, lise tumoral. Prescrever antibiótico nesses casos trata o médico.',
  ],
  referencias: [
    { texto: 'Bone RC, Balk RA, Cerra FB, et al. Definitions for sepsis and organ failure. Chest. 1992;101(6):1644-1655.' },
    { texto: 'Kaukonen KM, Bailey M, Pilcher D, et al. Systemic inflammatory response syndrome criteria in defining severe sepsis. N Engl J Med. 2015;372(17):1629-1638.' },
  ],
}

const news2: Ferramenta = {
  id: 'news2',
  nome: 'NEWS2 — escore nacional de alerta precoce',
  sinonimos: ['news', 'news2', 'alerta precoce', 'deterioracao clinica'],
  resumo: 'Sete parâmetros de enfermagem que antecipam deterioração clínica em horas.',
  categorias: ['infectologia', 'emergencia'],
  campos: [
    campoNum('fr', 'Frequência respiratória', { unidade: 'irpm', min: 4, max: 60, passo: 1 }),
    campoNum('spo2', 'SpO₂', { unidade: '%', min: 50, max: 100, passo: 1 }),
    campoSeg('escala', 'Escala de saturação', [
      { valor: '1', rotulo: 'Escala 1 (habitual)' },
      { valor: '2', rotulo: 'Escala 2 (retentor de CO₂)' },
    ], { ajuda: 'A escala 2 se aplica a quem tem alvo de saturação de 88 a 92% por insuficiência respiratória hipercápnica, e precisa ser prescrita por um médico.' }),
    campoSimNao('o2', 'Em uso de oxigênio suplementar', 2),
    campoNum('pas', 'PA sistólica', { unidade: 'mmHg', min: 40, max: 260, passo: 1 }),
    campoNum('fc', 'Frequência cardíaca', { unidade: 'bpm', min: 20, max: 220, passo: 1 }),
    campoSeg('consciencia', 'Nível de consciência', [
      { valor: '0', rotulo: 'Alerta', pontos: 0 },
      { valor: '3', rotulo: 'Confusão nova, responde a voz, dor ou irresponsivo', pontos: 3 },
    ]),
    campoNum('temp', 'Temperatura', { unidade: '°C', min: 30, max: 43, passo: 0.1 }),
  ],
  calcular: (v) => {
    const fr = num(v, 'fr')
    const spo2 = num(v, 'spo2')
    const pas = num(v, 'pas')
    const fc = num(v, 'fc')
    const temp = num(v, 'temp')
    const cons = num(v, 'consciencia')
    if (fr === null || spo2 === null || pas === null || fc === null || temp === null || cons === null) return null
    const usaO2 = sim(v, 'o2')
    const escala2 = opc(v, 'escala') === '2'

    const pFr = fr <= 8 ? 3 : fr <= 11 ? 1 : fr <= 20 ? 0 : fr <= 24 ? 2 : 3
    let pSpo2: number
    if (!escala2) {
      pSpo2 = spo2 <= 91 ? 3 : spo2 <= 93 ? 2 : spo2 <= 95 ? 1 : 0
    } else {
      if (spo2 <= 83) pSpo2 = 3
      else if (spo2 <= 85) pSpo2 = 2
      else if (spo2 <= 87) pSpo2 = 1
      else if (spo2 <= 92) pSpo2 = 0
      else if (!usaO2) pSpo2 = 0
      else if (spo2 <= 94) pSpo2 = 1
      else if (spo2 <= 96) pSpo2 = 2
      else pSpo2 = 3
    }
    const pO2 = usaO2 ? 2 : 0
    const pPas = pas <= 90 ? 3 : pas <= 100 ? 2 : pas <= 110 ? 1 : pas <= 219 ? 0 : 3
    const pFc = fc <= 40 ? 3 : fc <= 50 ? 1 : fc <= 90 ? 0 : fc <= 110 ? 1 : fc <= 130 ? 2 : 3
    const pTemp = temp <= 35 ? 3 : temp <= 36 ? 1 : temp <= 38 ? 0 : temp <= 39 ? 1 : 2
    const componentes = [pFr, pSpo2, pO2, pPas, pFc, cons, pTemp]
    const total = componentes.reduce((a, b) => a + b, 0)
    const algumTres = componentes.some((c) => c === 3)
    const faixa = total >= 7 ? 3 : total >= 5 || algumTres ? 2 : total >= 1 ? 1 : 0
    const nivel: Nivel = (['ok', 'atencao', 'alerta', 'critico'] as Nivel[])[faixa]
    return {
      titulo: 'NEWS2',
      valor: String(total),
      unidade: 'pontos',
      nivel,
      rotuloNivel: ['Risco baixo', 'Risco baixo', 'Risco médio', 'Risco alto'][faixa],
      detalhes: [
        { rotulo: 'Frequência respiratória', valor: `${pFr} ponto(s)` },
        { rotulo: 'Saturação', valor: `${pSpo2} ponto(s)`, nota: escala2 ? 'Escala 2 — alvo de 88 a 92%.' : 'Escala 1 — alvo ≥ 96%.' },
        { rotulo: 'Oxigênio suplementar', valor: `${pO2} ponto(s)` },
        { rotulo: 'Pressão sistólica', valor: `${pPas} ponto(s)` },
        { rotulo: 'Frequência cardíaca', valor: `${pFc} ponto(s)` },
        { rotulo: 'Consciência', valor: `${cons} ponto(s)` },
        { rotulo: 'Temperatura', valor: `${pTemp} ponto(s)` },
        { rotulo: 'Algum parâmetro isolado com 3 pontos', valor: algumTres ? 'Sim' : 'Não', nota: 'Um único parâmetro em 3 já eleva a categoria para risco médio, independentemente do total.', nivel: algumTres ? 'alerta' : 'ok' },
      ],
      conduta: [
        '**NEWS2 0–4 (baixo risco)**: reavaliação a cada 12 horas, cuidado de rotina na enfermaria. Não há necessidade de escalar.',
        '**NEWS2 5–6, ou qualquer parâmetro isolado valendo 3 pontos (risco médio)**: reavaliação horária e **avaliação urgente por médico** com competência em doença aguda. Um único parâmetro extremo — frequência respiratória ≥ 25, saturação ≤ 91%, sistólica ≤ 90 mmHg — é gatilho independentemente da soma.',
        '**NEWS2 ≥ 7 (alto risco)**: monitorização contínua, avaliação imediata por equipe com competência em cuidado crítico e consideração de transferência para unidade de maior complexidade. Esse é o limiar de acionamento do time de resposta rápida.',
        'Preste atenção especial à **frequência respiratória**: é o parâmetro que mais precocemente se altera na deterioração e o mais frequentemente não medido ou estimado à distância. Contar 60 segundos muda o escore e a conduta mais do que qualquer exame laboratorial disponível na enfermaria.',
        'Use a **escala 2 de saturação (alvo 88–92%)** apenas em pacientes com insuficiência respiratória hipercápnica confirmada e prescrição explícita de alvo reduzido. Aplicá-la por presunção em qualquer portador de doença pulmonar obstrutiva mascara hipoxemia real e atrasa a resposta.',
      ],
      alertas: [
        'Um único parâmetro valendo 3 pontos é gatilho de escalada independentemente da soma.',
        'A escala 2 de saturação (alvo 88 a 92%) só vale com insuficiência respiratória hipercápnica confirmada e prescrição explícita. Aplicá-la por presunção a qualquer portador de doença pulmonar obstrutiva mascara hipoxemia real.',
      ],
      interpretacao: [
        ['**Total 0:** monitorização mínima a cada 12 horas.', '**Total 1 a 4:** reavaliação a cada 4 a 6 horas, com decisão do enfermeiro sobre escalonamento.', '**Total 5 a 6, ou qualquer parâmetro em 3:** resposta urgente — avaliação médica em até 1 hora, monitorização de hora em hora, considerar cuidados de maior complexidade.', '**Total ≥ 7:** resposta emergencial — avaliação por equipe com competência em cuidados críticos, monitorização contínua, transferência para leito monitorizado.'][faixa],
        'A grande virtude do NEWS2 é padronizar o gatilho de escalonamento: ele transforma "achei o paciente estranho" numa linguagem comum entre enfermagem, plantão e time de resposta rápida. Sua adoção nacional no Reino Unido associou-se a redução de paradas cardíacas intra-hospitalares não previstas.',
        'A escala 2 de saturação só deve ser usada em pacientes com alvo de 88 a 92% formalmente prescrito por insuficiência respiratória hipercápnica — DPOC avançado, obesidade-hipoventilação, cifoescoliose, doença neuromuscular.',
      ],
    }
  },
  formula: ['Soma de 7 parâmetros; qualquer parâmetro isolado em 3 pontos eleva a categoria de risco'],
  fundamento:
    'O NEWS foi desenvolvido pelo Royal College of Physicians a partir da constatação de que a deterioração clínica precede a parada cardíaca em horas, com alterações mensuráveis de sinais vitais que ninguém sistematizava. A versão 2, de 2017, acrescentou a escala alternativa de saturação para retentores de CO₂ e substituiu a escala AVPU por ACVPU, incluindo confusão nova. O NEWS2 funciona porque a deterioração fisiológica precede a parada cardiorrespiratória em horas, e segue uma sequência previsível: a **frequência respiratória** se altera primeiro, porque a ventilação é o mecanismo de compensação mais rápido disponível para acidose metabólica e para hipóxia; em seguida vêm frequência cardíaca e nível de consciência; a pressão arterial cai por último, quando a compensação simpática se esgota. É por isso que a frequência respiratória tem o maior valor preditivo e é, na prática, o sinal vital menos medido.',
  armadilhas: [
    'Pacientes com sinais vitais cronicamente alterados (DPOC, insuficiência cardíaca avançada, doença neurológica) pontuam alto no basal. O escore mede desvio da normalidade populacional, não do basal individual.',
    'NEWS2 não substitui o julgamento clínico: preocupação da equipe ou da família é motivo suficiente para escalonar, com qualquer pontuação.',
  ],
  referencias: [
    { texto: 'Royal College of Physicians. National Early Warning Score (NEWS) 2: standardising the assessment of acute illness severity in the NHS. Londres: RCP; 2017.' },
    { texto: 'Smith GB, Prytherch DR, Meredith P, et al. The ability of the National Early Warning Score to discriminate patients at risk of early cardiac arrest, unanticipated ICU admission, and death. Resuscitation. 2013;84(4):465-470.' },
  ],
}

const mews: Ferramenta = {
  id: 'mews',
  nome: 'MEWS — escore modificado de alerta precoce',
  sinonimos: ['mews', 'early warning', 'deterioracao'],
  resumo: 'A versão enxuta do alerta precoce, com cinco parâmetros e sem oximetria.',
  categorias: ['infectologia', 'emergencia'],
  campos: [
    campoNum('pas', 'PA sistólica', { unidade: 'mmHg', min: 40, max: 260, passo: 1, ajuda: 'A pontuação é em U: tanto hipotensão quanto sistólica acima de 199 mmHg pontuam. Compare com a pressão habitual do paciente — 100 mmHg num hipertenso crônico de 170 já é hipotensão relativa que o escore não captura.' }),
    campoNum('fc', 'Frequência cardíaca', { unidade: 'bpm', min: 20, max: 220, passo: 1, ajuda: 'Também em U: bradicardia abaixo de 40 pontua igual a taquicardia de 111 a 129. Atenção ao betabloqueado, que não taquicardiza mesmo em choque.' }),
    campoNum('fr', 'Frequência respiratória', { unidade: 'irpm', min: 4, max: 60, passo: 1, ajuda: 'Conte por 60 segundos completos, observando o tórax, com o paciente em repouso e sem saber que está sendo contado. É o parâmetro mais sensível do escore e o mais frequentemente estimado ou copiado da aferição anterior.' }),
    campoNum('temp', 'Temperatura', { unidade: '°C', min: 30, max: 43, passo: 0.1, ajuda: 'Hipotermia abaixo de 35 °C pontua o mesmo que febre acima de 38,4 °C — e no idoso e no imunossuprimido é o achado mais ominoso dos dois.' }),
    campoOpc('avpu', 'Nível de consciência (AVPU)', [
      { valor: '0', rotulo: 'Alerta', pontos: 0 },
      { valor: '1', rotulo: 'Responde a voz', pontos: 1, descricao: 'Abre os olhos ou responde apenas quando chamado.' },
      { valor: '2', rotulo: 'Responde a dor', pontos: 2, descricao: 'Só responde a estímulo doloroso. Equivale aproximadamente a Glasgow 8 a 9 — considere proteção de via aérea.' },
      { valor: '3', rotulo: 'Irresponsivo', pontos: 3, descricao: 'Sem resposta a voz nem a dor. Via aérea em risco imediato.' },
    ], { ajuda: 'AVPU é a versão rápida da avaliação de consciência: Alerta, responde a Voz, responde a Dor (Pain), Irresponsivo (Unresponsive). Qualquer queda em relação ao basal pontua — no idoso, alteração de consciência é frequentemente a primeira manifestação de sepse, antes da febre.' }),
  ],
  calcular: (v) => {
    const pas = num(v, 'pas')
    const fc = num(v, 'fc')
    const fr = num(v, 'fr')
    const temp = num(v, 'temp')
    const avpu = num(v, 'avpu')
    if (pas === null || fc === null || fr === null || temp === null || avpu === null) return null
    const pPas = pas <= 70 ? 3 : pas <= 80 ? 2 : pas <= 100 ? 1 : pas <= 199 ? 0 : 2
    const pFc = fc < 40 ? 2 : fc <= 50 ? 1 : fc <= 100 ? 0 : fc <= 110 ? 1 : fc <= 129 ? 2 : 3
    const pFr = fr < 9 ? 2 : fr <= 14 ? 0 : fr <= 20 ? 1 : fr <= 29 ? 2 : 3
    const pTemp = temp < 35 ? 2 : temp <= 38.4 ? 0 : 2
    const total = pPas + pFc + pFr + pTemp + avpu
    const nivel: Nivel = total >= 5 ? 'critico' : total >= 3 ? 'alerta' : 'ok'
    return {
      titulo: 'MEWS',
      valor: String(total),
      unidade: 'pontos',
      nivel,
      rotuloNivel: total >= 5 ? 'Alto risco' : total >= 3 ? 'Risco intermediário' : 'Baixo risco',
      detalhes: [
        { rotulo: 'Pressão sistólica', valor: `${pPas} ponto(s)` },
        { rotulo: 'Frequência cardíaca', valor: `${pFc} ponto(s)` },
        { rotulo: 'Frequência respiratória', valor: `${pFr} ponto(s)` },
        { rotulo: 'Temperatura', valor: `${pTemp} ponto(s)` },
        { rotulo: 'Consciência', valor: `${avpu} ponto(s)` },
      ],
      interpretacao: [
        total >= 5
          ? 'MEWS ≥ 5 associa-se independentemente a maior mortalidade e a maior necessidade de UTI. Acione avaliação médica imediata e considere transferência para leito monitorizado.'
          : total >= 3
            ? 'Aumente a frequência de monitorização e comunique o plantão.'
            : 'Baixo risco. Mantenha a rotina de monitorização.',
        'O MEWS é anterior ao NEWS e mais simples — dispensa oximetria, o que o torna aplicável em contextos de recurso limitado. Em comparações diretas, o NEWS2 discrimina melhor, mas a diferença é modesta.',
        'A frequência respiratória é o parâmetro mais sensível e o menos aferido de todos. Contar respirações por um minuto inteiro é a medida de maior rendimento diagnóstico e de menor custo em toda a enfermaria.',
        'A razão de a frequência respiratória ser o parâmetro mais precoce é fisiológica e vale entender, porque é o que justifica insistir numa medida tão banal. A ventilação é o único mecanismo compensatório do organismo com **latência de segundos** e capacidade de amplificação de até dez vezes: os quimiorreceptores centrais do bulbo detectam a queda de pH liquórico e os periféricos, nos corpos carotídeos, detectam hipoxemia e acidemia, e a resposta é imediata. Diante de qualquer agressão que gere acidose metabólica — sepse com hipoperfusão e lactato, cetoacidose, insuficiência renal — a hiperventilação começa antes de a pressão cair, porque o sistema cardiovascular compensa por vasoconstrição e taquicardia, mecanismos que **preservam a pressão arterial até o limite** e só falham quando a reserva se esgota. É por isso que a hipotensão é um sinal tardio: ela marca o fracasso da compensação, não o início da doença. O mesmo raciocínio explica a pontuação em U de pressão e frequência cardíaca: bradicardia com hipotensão não é estabilidade, é falência da resposta adrenérgica, e pontua alto justamente por isso. E explica a alteração de consciência, que aparece quando a perfusão cerebral cai ou quando mediadores inflamatórios atravessam a barreira hematoencefálica — no idoso, cuja reserva cerebral é menor, esse é frequentemente o primeiro sinal, precedendo febre e taquicardia.',
      ],
      conduta: total >= 5
        ? [
            'Acione avaliação médica **imediata** e considere ativar o time de resposta rápida. MEWS ≥ 5 associa-se independentemente a maior mortalidade e a maior necessidade de UTI — o escore alto é gatilho de ação, não de nova aferição em duas horas.',
            'Aplique a abordagem ABCDE à beira do leito: via aérea, oxigênio com alvo de SpO₂ 92 a 96% (88 a 92% se houver retenção crônica de CO₂), acesso venoso, glicemia capilar, eletrocardiograma e exames — hemograma, lactato, função renal, eletrólitos, gasometria e hemoculturas se houver suspeita infecciosa.',
            'Procure ativamente a causa da deterioração, porque o escore não a informa: sepse, hemorragia, tromboembolismo pulmonar, síndrome coronariana, arritmia, desidratação, efeito adverso de fármaco, abstinência e dor não controlada são as mais frequentes em enfermaria.',
            'Se houver suspeita de sepse, aplique o **pacote de 1 hora**: lactato, hemoculturas antes do antibiótico (sem atrasar a primeira dose), antibiótico de amplo espectro, cristaloide 30 mL/kg na hipotensão ou lactato ≥ 4 mmol/L, e vasopressor se a PAM não atingir 65 mmHg após o volume. Calcule o qSOFA e o SOFA para documentar disfunção orgânica.',
            'Discuta o nível de cuidado e, se aplicável, as diretivas antecipadas de vontade. Deterioração em enfermaria é o momento de definir se o plano é escalonar ou priorizar conforto — decidir isso depois da parada é decidir mal.',
          ]
        : total >= 3
          ? [
              'Aumente a frequência de monitorização para cada 1 a 2 horas e comunique formalmente o plantão, registrando o escore e o horário. A **tendência** é mais informativa que o valor: MEWS 3 que era 0 há duas horas é mais preocupante que MEWS 3 estável há um dia.',
              'Reavalie à beira do leito em vez de apenas registrar o número. Procure o parâmetro que puxou a pontuação e trate a causa correspondente — taquipneia isolada pede exame do tórax e oximetria; hipotensão isolada pede avaliação de volemia, sangramento e fármaco anti-hipertensivo recém-administrado.',
              'Garanta o básico que frequentemente explica a pontuação: dor tratada, hidratação adequada, oxigênio se necessário, controle de temperatura, correção de glicemia e revisão da prescrição — opioide, sedativo e anti-hipertensivo são causas comuns e reversíveis.',
              'Defina e registre um gatilho explícito de reacionamento: qual valor ou qual sinal obriga a chamar o médico antes da próxima aferição programada.',
            ]
          : [
              'Baixo risco. Mantenha a rotina de monitorização conforme o protocolo da unidade e a reaferição programada.',
              'Registre o valor mesmo sendo baixo: a utilidade dos escores de alerta precoce vem da **série**, não do ponto. Sem o valor basal documentado, a elevação de amanhã não será reconhecida como deterioração.',
              'Lembre que o MEWS não contém oximetria nem oxigênio suplementar. Se houver dispneia, dessaturação ou necessidade crescente de O₂, a avaliação é clínica e independe do escore — considere aplicar o NEWS2, que incorpora esses parâmetros.',
            ],
      alertas: [
        'O MEWS não inclui saturação de oxigênio nem uso de oxigênio suplementar, e é por isso menos sensível à insuficiência respiratória inicial. Paciente em oxigênio alto com sinais vitais compensados pode ter MEWS baixo e estar grave.',
        'Escore baixo nunca sobrepõe a impressão clínica. Preocupação da equipe de enfermagem, da família ou do próprio paciente é gatilho válido e independente para avaliação médica — em séries de eventos adversos, esse sinal precede o escore.',
        'A pontuação compara com faixas populacionais fixas, não com o basal individual. Hipertenso crônico, atleta com bradicardia de repouso, gestante (que tem frequência e ventilação basais mais altas) e paciente betabloqueado são sistematicamente mal classificados.',
        'É escore de rastreio de deterioração, não de diagnóstico nem de prognóstico de doença específica. Ele diz que algo vai mal, e nunca o quê.',
      ],
      tabela: {
        titulo: 'Pontuação por parâmetro',
        colunas: ['Parâmetro', '3 pontos', '2 pontos', '1 ponto', '0 ponto'],
        linhas: [
          ['PA sistólica (mmHg)', '≤ 70', '71 – 80 ou ≥ 200', '81 – 100', '101 – 199'],
          ['Frequência cardíaca (bpm)', '≥ 130', '< 40 ou 111 – 129', '41 – 50 ou 101 – 110', '51 – 100'],
          ['Frequência respiratória (irpm)', '≥ 30', '< 9 ou 21 – 29', '15 – 20', '9 – 14'],
          ['Temperatura (°C)', '—', '< 35 ou > 38,4', '—', '35 – 38,4'],
          ['Consciência (AVPU)', 'Irresponsivo', 'Responde a dor', 'Responde a voz', 'Alerta'],
        ],
      },
    }
  },
  formula: ['Soma de 5 parâmetros; ≥ 5 pontos indica alto risco'],
  fundamento:
    'O MEWS derivou do sistema de alerta precoce original de Morgan (1997), refinado por Subbe em 2001 numa coorte de admissões clínicas agudas. Sua lógica é a mesma do NEWS: quantificar o desvio fisiológico de forma que qualquer profissional aplique e qualquer profissional entenda. A premissa que sustenta toda a família de escores de alerta precoce vem de auditorias de parada cardiorrespiratória intra-hospitalar dos anos 1990, que mostraram algo desconfortável: na grande maioria dos casos havia deterioração documentada nos sinais vitais por **6 a 24 horas** antes do evento, registrada no prontuário e não reconhecida. O problema não era falta de dado, era falta de agregação — cada parâmetro isoladamente parecia tolerável, e a soma dos desvios não era computada por ninguém. Os escores de alerta precoce resolvem isso transformando vários desvios pequenos num número único que dispara ação. A escolha de pontuar em **U** os parâmetros cardiovasculares é o detalhe fisiologicamente mais sofisticado do escore: bradicardia abaixo de 40 bpm pontua como taquicardia de 111 a 129 bpm, e hipertensão acima de 199 mmHg pontua como hipotensão de 71 a 80 mmHg, porque o que se mede é distância da homeostase e não direção do desvio — bradicardia com hipotensão significa falência da resposta adrenérgica, que é mais ameaçadora que a taquicardia compensatória. A hierarquia temporal dos parâmetros também é intencional: a frequência respiratória é o primeiro a se alterar, porque a ventilação é o único mecanismo compensatório com latência de segundos e capacidade de amplificação de dez vezes, enquanto a pressão arterial é a última, porque vasoconstrição e taquicardia a sustentam até o esgotamento da reserva. Em comparações diretas o NEWS2 discrimina melhor, sobretudo por incluir saturação e oxigênio suplementar, mas a diferença é modesta e o MEWS mantém a vantagem de dispensar oximetria — o que importa em contextos de recurso limitado, onde a alternativa não é um escore melhor, é nenhum escore.',
  armadilhas: [
    'Não inclui saturação nem oxigênio suplementar, o que o torna menos sensível a insuficiência respiratória inicial.',
    'A frequência respiratória, que é o parâmetro de maior peso preditivo, é a mais frequentemente estimada, arredondada para 20 por hábito ou copiada da aferição anterior. Um MEWS construído sobre frequência respiratória inventada não vale nada.',
    'Faixas populacionais fixas classificam mal quem tem basal diferente: hipertenso crônico, atleta bradicárdico, gestante e paciente betabloqueado. Compare sempre com o basal individual documentado.',
    'Um valor isolado não cumpre a função do escore, que é detectar tendência. Registre a série, com horário.',
    'Escore normal em paciente que preocupa a equipe não descarta deterioração. A preocupação clínica é gatilho independente e, em auditorias de eventos adversos, costuma anteceder a alteração do escore.',
    'Não foi desenvolvido nem validado para gestantes (existe o MEOWS obstétrico), para crianças (PEWS) nem para paciente em cuidado paliativo exclusivo, em que a deterioração é esperada e o escore não orienta conduta.',
    'O escore não substitui o rastreio de sepse. qSOFA, SOFA e os critérios Sepsis-3 respondem perguntas diferentes, e um MEWS alto deve disparar essa avaliação específica quando há suspeita de infecção.',
  ],
  referencias: [
    { texto: 'Subbe CP, Kruger M, Rutherford P, Gemmel L. Validation of a modified Early Warning Score in medical admissions. QJM. 2001;94(10):521-526.' },
    { texto: 'Morgan RJM, Williams F, Wright MM. An early warning scoring system for detecting developing critical illness. Clin Intensive Care. 1997;8:100.' },
    { texto: 'Smith GB, Prytherch DR, Meredith P, Schmidt PE, Featherstone PI. The ability of the National Early Warning Score (NEWS) to discriminate patients at risk of early cardiac arrest, unanticipated intensive care unit admission, and death. Resuscitation. 2013;84(4):465-470.' },
  ],
}

const sepse: Ferramenta = {
  id: 'criterios-sepse',
  nome: 'Critérios de sepse e choque séptico (Sepsis-3) e pacote de 1 hora',
  sinonimos: ['sepse', 'choque septico', 'sepsis 3', 'bundle', 'pacote de sepse'],
  resumo: 'Confere os critérios diagnósticos e monta o pacote de tratamento inicial.',
  categorias: ['infectologia', 'emergencia'],
  campos: [
    campoSimNao('infeccao', 'Infecção suspeita ou documentada', 1),
    campoSimNao('sofa2', 'Aumento de 2 ou mais pontos no SOFA', 1),
    campoSimNao('vasopressor', 'Necessidade de vasopressor para manter PAM ≥ 65 mmHg', 1),
    campoNum('lactato', 'Lactato', { unidade: 'mmol/L', min: 0, max: 30, passo: 0.1 }),
    campoSimNao('volumeAdequado', 'Ressuscitação volêmica já realizada (≥ 30 mL/kg de cristaloide)', 1),
    campoPeso({ opcional: true }),
  ],
  calcular: (v) => {
    const lactato = num(v, 'lactato')
    const peso = num(v, 'peso')
    if (lactato === null) return null
    const infeccao = sim(v, 'infeccao')
    const sofa2 = sim(v, 'sofa2')
    const vaso = sim(v, 'vasopressor')
    const volume = sim(v, 'volumeAdequado')
    const temSepse = infeccao && sofa2
    const temChoque = temSepse && vaso && lactato > 2 && volume
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Infecção', valor: infeccao ? 'Presente' : 'Ausente', nivel: infeccao ? 'alerta' : 'ok' },
      { rotulo: 'Disfunção orgânica (ΔSOFA ≥ 2)', valor: sofa2 ? 'Presente' : 'Ausente', nivel: sofa2 ? 'alerta' : 'ok' },
      { rotulo: 'Lactato', valor: `${fmt(lactato, 1)} mmol/L`, nota: lactato > 4 ? 'Acima de 4 mmol/L: marcador independente de mortalidade, mesmo sem hipotensão.' : lactato > 2 ? 'Hiperlactatemia — reavalie em 2 a 4 horas; a queda (clearance de lactato) é marcador de resposta.' : 'Normal.', nivel: lactato > 4 ? 'critico' : lactato > 2 ? 'alerta' : 'ok' },
    ]
    if (peso !== null) detalhes.push({ rotulo: 'Volume inicial recomendado (30 mL/kg)', valor: `${fmtInt(peso * 30)} mL`, nota: 'Cristaloide balanceado, nas primeiras 3 horas. Em cardiopata, nefropata dialítico e cirrótico, reavalie a resposta a cada 250 a 500 mL em vez de infundir o volume completo às cegas.' })
    const nivel: Nivel = temChoque ? 'critico' : temSepse ? 'alerta' : 'ok'
    return {
      titulo: temChoque ? 'Choque séptico' : temSepse ? 'Sepse' : 'Critérios não preenchidos',
      valor: temChoque ? 'Choque séptico' : temSepse ? 'Sepse' : 'Sem critérios',
      nivel,
      rotuloNivel: temChoque ? 'Mortalidade > 40%' : temSepse ? 'Mortalidade em torno de 10%' : 'Reavalie se a suspeita clínica persistir',
      detalhes,
      conduta: [
        'Confirmada a sepse, execute o **pacote de 1 hora**: dosar lactato, colher hemoculturas **antes** do antimicrobiano, administrar antimicrobiano de amplo espectro, iniciar 30 mL/kg de cristaloide se houver hipotensão ou lactato ≥ 4 mmol/L, e aplicar vasopressor se a pressão não responder, com alvo de PAM ≥ 65 mmHg. Cada hora de atraso no antimicrobiano aumenta a mortalidade em cerca de 4 a 8% no choque séptico.',
        '**Controle do foco** em até 6–12 horas é tão determinante quanto o antibiótico: drenagem de abscesso, remoção de cateter infectado, desbridamento de fasciíte, descompressão de via biliar ou urinária. Nenhum esquema antimicrobiano compensa um foco não controlado, e esse é o erro que mais mata em sepse tratada \'corretamente\'.',
        'Use **noradrenalina como vasopressor de primeira linha**, por acesso central assim que possível (mas não atrase por falta dele — a periférica é aceitável nas primeiras horas). Acrescente **vasopressina** como segundo agente, poupador de catecolamina, e **hidrocortisona 200 mg/dia** em choque refratário a doses crescentes.',
        'Reavalie a **resposta** com lactato seriado (a depuração é melhor marcador que o valor isolado), tempo de enchimento capilar, diurese e estado mental. Depois da reposição inicial, guie volume por **resposta dinâmica** — elevação passiva de pernas, variação de volume sistólico — e não por metas fixas: balanço hídrico positivo cumulativo associa-se a maior mortalidade.',
        '**Descalone** o antimicrobiano assim que as culturas e a evolução permitirem, e reavalie a duração — 7 dias bastam na maioria das infecções, e a procalcitonina pode apoiar a suspensão. Manter espectro largo por inércia produz resistência, *Clostridioides difficile* e disfunção orgânica sem qualquer ganho.',
      ],
      interpretacao: [
        '**Sepse** = infecção + disfunção orgânica (ΔSOFA ≥ 2). **Choque séptico** = sepse + vasopressor para PAM ≥ 65 + lactato > 2 mmol/L, apesar de reposição volêmica adequada. Os dois critérios do choque são cumulativos, não alternativos.',
        '**Pacote de 1 hora (Surviving Sepsis Campaign):** (1) dosar lactato e repetir se > 2 mmol/L; (2) colher hemoculturas **antes** do antibiótico, desde que isso não atrase mais que 45 minutos; (3) administrar antimicrobiano de amplo espectro; (4) iniciar 30 mL/kg de cristaloide se houver hipotensão ou lactato ≥ 4; (5) iniciar vasopressor se a hipotensão persistir durante ou após a reposição, mirando PAM ≥ 65 mmHg.',
        'A antibioticoterapia é a intervenção com maior impacto: cada hora de atraso no choque séptico associa-se a aumento mensurável de mortalidade. Noradrenalina é o vasopressor de primeira escolha e pode ser iniciada em veia periférica calibrosa enquanto o acesso central é obtido — a espera pelo central não se justifica.',
        'Após a estabilização inicial, a reavaliação frequente da perfusão substitui os alvos fixos: tempo de enchimento capilar, lactato seriado, diurese, extremidades, nível de consciência. O ensaio ANDROMEDA-SHOCK mostrou que guiar pela perfusão periférica não é inferior a guiar pelo lactato.',
      ],
      alertas: temSepse ? ['Não postergue o antimicrobiano à espera de exame de imagem, de parecer ou de hemocultura difícil. Colha o que der em 45 minutos e trate.'] : undefined,
    }
  },
  formula: ['Sepse = infecção + ΔSOFA ≥ 2', 'Choque séptico = sepse + vasopressor + lactato > 2 mmol/L após volume'],
  fundamento:
    'A definição de 2016 abandonou o conceito de "sepse grave" e reposicionou a sepse como disfunção orgânica ameaçadora à vida causada por resposta desregulada do hospedeiro à infecção. A mudança teve consequência prática direta: infecção com SIRS mas sem disfunção deixou de ser sepse, e a atenção se deslocou de "quem está inflamado" para "quem está falindo órgão". A Sepsis-3 abandonou os critérios de SIRS porque eles são **sensíveis demais e inespecíficos**: qualquer inflamação os preenche, e um em cada oito pacientes com infecção grave e disfunção orgânica não os preenchia. A nova definição desloca o eixo para a **disfunção orgânica causada por resposta desregulada do hospedeiro**, e é essa desregulação que explica o quadro — ativação simultânea de vias pró e anti-inflamatórias, lesão do glicocálice endotelial, extravasamento capilar, microtrombose e disfunção mitocondrial com incapacidade de extrair oxigênio.',
  armadilhas: [
    'Nem toda hiperlactatemia é hipoperfusão: convulsão, uso de beta-agonista, metformina, insuficiência hepática e neoplasia elevam o lactato por outros mecanismos.',
    'Os 30 mL/kg são um ponto de partida, não um dogma. Em insuficiência cardíaca avançada e doença renal dialítica, avalie a resposta em alíquotas menores.',
  ],
  referencias: [
    { texto: 'Singer M, et al. Sepsis-3. JAMA. 2016;315(8):801-810.' },
    { texto: 'Evans L, et al. Surviving Sepsis Campaign 2021. Crit Care Med. 2021;49(11):e1063-e1143.' },
    { texto: 'Hernández G, Ospina-Tascón GA, Damiani LP, et al. Effect of a resuscitation strategy targeting peripheral perfusion status vs serum lactate levels (ANDROMEDA-SHOCK). JAMA. 2019;321(7):654-664.' },
  ],
}

/* ═══════════════════ Faringite, meningite e antibiograma ═══════════════════ */

const centor: Ferramenta = {
  id: 'centor',
  nome: 'Escore de Centor',
  sinonimos: ['centor', 'faringite', 'amigdalite', 'estreptococo'],
  resumo: 'Os quatro critérios originais de faringite estreptocócica em adultos.',
  categorias: ['infectologia'],
  campos: [
    campoSimNao('exsudato', 'Exsudato ou hipertrofia amigdaliana', 1),
    campoSimNao('adenopatia', 'Adenopatia cervical anterior dolorosa', 1),
    campoSimNao('febre', 'História de febre (> 38 °C)', 1),
    campoSimNao('semTosse', 'Ausência de tosse', 1),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'exsudato', pontos: 1 },
      { id: 'adenopatia', pontos: 1 },
      { id: 'febre', pontos: 1 },
      { id: 'semTosse', pontos: 1 },
    ])
    const prob = ['2 a 3%', '4 a 6%', '10 a 12%', '27 a 28%', '38 a 63%'][total]
    return {
      titulo: 'Escore de Centor',
      valor: String(total),
      unidade: 'de 4 pontos',
      nivel: total >= 3 ? 'alerta' : total === 2 ? 'atencao' : 'ok',
      rotuloNivel: `Probabilidade de estreptococo do grupo A: ${prob}`,
      detalhes: [{ rotulo: 'Probabilidade de cultura positiva', valor: prob }],
      conduta: [
        '**Centor/McIsaac 0–1**: não teste nem trate com antibiótico. A probabilidade de faringite estreptocócica é de 1 a 10%, e o quadro é viral. Oriente sintomáticos — analgésico, anti-inflamatório, hidratação — e sinais de retorno.',
        '**Centor/McIsaac 2–3**: faça o **teste rápido de detecção de antígeno**. Positivo, trate; negativo em criança ou adolescente, confirme com cultura de orofaringe, pois a sensibilidade do teste rápido cai nessa faixa e a febre reumática é uma consequência real.',
        '**Centor/McIsaac ≥ 4**: a probabilidade fica em torno de 50%. Teste e trate conforme o resultado. Tratar empiricamente sem testar é aceitável apenas quando o teste for indisponível e o risco de febre reumática for alto na população atendida.',
        'Quando indicado, o tratamento é **penicilina V ou amoxicilina por 10 dias** — a duração completa é o que previne febre reumática, mesmo com a melhora sintomática em 48 h. Em alergia, use cefalexina (se não houver anafilaxia), azitromicina ou clindamicina. O objetivo primário do antibiótico é prevenir a complicação, não abreviar a dor de garganta, que ele encurta em apenas cerca de 16 horas.',
        '**Afaste os diagnósticos que o escore não vê**: abscesso peritonsilar (trismo, voz abafada, desvio de úvula — exige drenagem), epiglotite (estridor, sialorreia, posição de tripé), mononucleose (adenomegalia posterior, esplenomegalia, linfocitose atípica — e amoxicilina causa exantema), e angina de Ludwig. Nenhum deles se resolve com o escore.',
      ],
      interpretacao: [
        total <= 1
          ? 'Baixa probabilidade: nem teste nem antibiótico. A causa é viral na esmagadora maioria dos casos, e tratamento sintomático é o suficiente.'
          : total <= 3
            ? 'Faixa intermediária: **teste** com pesquisa rápida de antígeno ou cultura de orofaringe, e trate apenas se positivo.'
            : 'Escore 4: mesmo aqui a probabilidade não passa de 63%. As diretrizes americanas recomendam testar antes de tratar; algumas europeias aceitam tratamento empírico.',
        'O objetivo do escore é reduzir prescrição desnecessária de antibiótico. A faringite é uma das principais fontes de uso inadequado de antimicrobiano na atenção primária, e a maioria absoluta é viral.',
        'O tratamento do estreptococo do grupo A visa sobretudo prevenir febre reumática — e essa prevenção funciona mesmo se o antibiótico começar até 9 dias após o início dos sintomas. Não há pressa: dá tempo de esperar o resultado do teste.',
      ],
      alertas: ['Procure sinais de alarme que mudam completamente a conduta: trismo, sialorreia, voz abafada, desvio de úvula, dor cervical intensa, torcicolo, estridor. Abscesso periamigdaliano, epiglotite e síndrome de Lemierre são os diagnósticos a excluir.'],
    }
  },
  formula: ['1 ponto para cada: exsudato | adenopatia cervical anterior | febre | ausência de tosse'],
  fundamento:
    'Centor derivou os critérios em 1981 numa emergência de adultos, buscando os achados clínicos que melhor discriminavam cultura positiva para estreptococo beta-hemolítico do grupo A. A lógica dos quatro itens é reconhecível: três apontam inflamação bacteriana focal e o quarto, a ausência de tosse, aponta contra infecção viral de vias aéreas. Os quatro critérios de Centor selecionam a apresentação típica do estreptococo beta-hemolítico do grupo A e, o que é mais importante, **excluem os sinais de infecção viral**: a ausência de tosse é um item porque tosse, coriza, rouquidão e conjuntivite apontam vírus com força considerável. O ajuste de McIsaac pela idade existe porque a prevalência da faringite estreptocócica varia enormemente ao longo da vida — é alta entre 5 e 15 anos, e baixa acima dos 45, o que muda o valor preditivo dos mesmos sinais.',
  armadilhas: [
    'Derivado em adultos. Em crianças de 3 a 14 anos a prevalência é bem maior, e o ajuste de McIsaac é indispensável.',
    'Portador crônico de estreptococo com faringite viral tem teste positivo e não se beneficia de antibiótico — situação comum em crianças em idade escolar.',
  ],
  referencias: [
    { texto: 'Centor RM, Witherspoon JM, Dalton HP, Brody CE, Link K. The diagnosis of strep throat in adults in the emergency room. Med Decis Making. 1981;1(3):239-246.' },
    { texto: 'Shulman ST, Bisno AL, Clegg HW, et al. Clinical practice guideline for the diagnosis and management of group A streptococcal pharyngitis: 2012 update by the Infectious Diseases Society of America. Clin Infect Dis. 2012;55(10):e86-e102.' },
  ],
}

const mcisaac: Ferramenta = {
  id: 'mcisaac',
  nome: 'Escore de McIsaac (Centor modificado)',
  sinonimos: ['mcisaac', 'centor modificado', 'faringite crianca'],
  resumo: 'O Centor corrigido pela idade, aplicável de 3 anos em diante.',
  categorias: ['infectologia', 'pediatria'],
  campos: [
    campoSimNao('exsudato', 'Exsudato ou hipertrofia amigdaliana', 1, 'Exsudato branco-amarelado ou aumento agudo das amígdalas. Não confunda com criptas amigdalianas crônicas e cáseo, que são achado habitual e não pontuam.'),
    campoSimNao('adenopatia', 'Adenopatia cervical anterior dolorosa', 1, 'Cadeia cervical ANTERIOR, dolorosa à palpação. Adenopatia posterior ou occipital aponta para outra etiologia, sobretudo mononucleose, rubéola ou toxoplasmose.'),
    campoSimNao('febre', 'História de febre (> 38 °C)', 1, 'Vale a história referida, mesmo sem medida documentada — o critério original é histórico e não exige aferição na consulta.'),
    campoSimNao('semTosse', 'Ausência de tosse', 1, 'Item invertido: a AUSÊNCIA de tosse pontua. Tosse, coriza, rouquidão, conjuntivite e diarreia apontam para etiologia viral e reduzem a probabilidade de estreptococo.'),
    campoOpc('idadeCat', 'Idade', [
      { valor: '1', rotulo: '3 a 14 anos', pontos: 1 },
      { valor: '0', rotulo: '15 a 44 anos', pontos: 0 },
      { valor: '-1', rotulo: '45 anos ou mais', pontos: -1 },
    ], { ajuda: 'O único item que pode SUBTRAIR ponto, e é justamente o que McIsaac acrescentou ao Centor. A prevalência de faringite estreptocócica vai de mais de 30% em escolares a menos de 5% acima dos 45 anos.' }),
  ],
  calcular: (v) => {
    const idadeP = num(v, 'idadeCat')
    if (idadeP === null) return null
    const total =
      somaSimNao(v, [
        { id: 'exsudato', pontos: 1 },
        { id: 'adenopatia', pontos: 1 },
        { id: 'febre', pontos: 1 },
        { id: 'semTosse', pontos: 1 },
      ]) + idadeP
    const idx = Math.max(0, Math.min(total, 5))
    const prob = ['1 a 2,5%', '5 a 10%', '11 a 17%', '28 a 35%', '51 a 53%', '51 a 53%'][idx]
    const nivel: Nivel = total >= 4 ? 'alerta' : total >= 2 ? 'atencao' : 'ok'
    return {
      titulo: 'Escore de McIsaac',
      valor: String(total),
      unidade: 'pontos',
      nivel,
      rotuloNivel: `Probabilidade de estreptococo: ${prob}`,
      detalhes: [
        { rotulo: 'Ajuste pela idade', valor: `${idadeP >= 0 ? '+' : ''}${idadeP} ponto`, nota: 'A prevalência de faringite estreptocócica é máxima entre 5 e 15 anos e cai bastante após os 45.' },
        { rotulo: 'Probabilidade estimada', valor: prob },
      ],
      interpretacao: [
        total <= 1
          ? 'Sem teste e sem antibiótico. Tratamento sintomático.'
          : total <= 3
            ? 'Faixa intermediária: teste rápido ou cultura, tratando apenas se positivo.'
            : 'Escore alto: teste e trate se positivo. Em contextos sem acesso a teste, o tratamento empírico é aceito nesta faixa por várias diretrizes.',
        'Tratamento de escolha: **penicilina V ou amoxicilina por 10 dias**. Amoxicilina 50 mg/kg/dia (máximo 1 g) em dose única diária tem eficácia equivalente e melhor adesão. Em alérgicos, cefalexina (se a alergia não for anafilática), azitromicina ou clindamicina.',
        'A resistência do estreptococo do grupo A à penicilina permanece **inexistente** — sete décadas depois. É um dos poucos casos em que a droga original continua sendo a de escolha sem qualquer erosão de eficácia.',
        'O motivo pelo qual se trata uma doença autolimitada merece ser explícito, porque é o que justifica todo o esforço diagnóstico. A faringite estreptocócica resolve espontaneamente em 3 a 5 dias, e o antibiótico abrevia os sintomas em apenas cerca de 16 horas — um ganho modesto. O objetivo real é prevenir a **febre reumática**, que é uma doença autoimune pós-infecciosa: proteínas M de certos sorotipos do estreptococo do grupo A compartilham epítopos com miosina cardíaca, tropomiosina, laminina e proteínas do tecido sinovial e dos núcleos da base. Anticorpos e linfócitos T gerados contra a bactéria reagem de forma cruzada com esses tecidos — é o fenômeno de mimetismo molecular — produzindo cardite (com a valvite que pode evoluir para estenose mitral décadas depois), artrite migratória, coreia de Sydenham, eritema marginado e nódulos subcutâneos. A resposta autoimune leva de 2 a 3 semanas para se estabelecer, e é por isso que existe uma janela terapêutica generosa: erradicar o estreptococo da orofaringe **até o nono dia** de sintomas ainda previne a febre reumática. Isso tem duas implicações práticas importantes. Primeira: não há urgência em prescrever antibiótico na primeira consulta — é seguro aguardar o resultado do teste, e essa espera é exatamente o que evita antibiótico desnecessário na maioria dos casos, que são virais. Segunda: a glomerulonefrite pós-estreptocócica, ao contrário da febre reumática, **não** é prevenida pelo antibiótico, porque seu mecanismo é deposição de imunocomplexos que já se formaram.',
      ],
      conduta: total <= 1
        ? [
            'Não teste e não prescreva antibiótico. A probabilidade de estreptococo é de 1 a 10%, e nessa faixa o teste gera mais falso-positivo (por portador assintomático) do que informação útil.',
            'Tratamento sintomático: analgésico e antitérmico (paracetamol ou ibuprofeno, que tem melhor efeito na dor de garganta), hidratação, gargarejo com água salgada morna, pastilhas anestésicas. Oriente que a melhora esperada é em 3 a 5 dias.',
            'Explique ao paciente ou à família por que não há antibiótico — é a conversa que evita a busca por outro atendimento e a prescrição desnecessária. Diga que a maioria das dores de garganta é viral e que o antibiótico não abrevia quadro viral nem previne complicação nele.',
            'Oriente retorno se houver piora, febre persistente por mais de 5 dias, dificuldade para engolir saliva, trismo, voz abafada, desvio de úvula, dispneia ou abaulamento cervical — sinais de abscesso periamigdaliano, epiglotite ou infecção de espaço profundo.',
          ]
        : total <= 3
          ? [
              'Faixa intermediária: **teste rápido de antígeno** (ou cultura de orofaringe) e trate apenas se positivo. É aqui que o escore mais rende, porque a probabilidade de 11 a 35% é exatamente a faixa em que nem tratar todos nem não tratar ninguém é aceitável.',
              'Em criança e adolescente com teste rápido negativo, faça **cultura de confirmação**: a sensibilidade do teste rápido é de cerca de 85% e a febre reumática é uma consequência que se quer evitar nessa faixa etária. Em adulto, teste rápido negativo dispensa cultura.',
              'Se positivo, trate com **penicilina V ou amoxicilina por 10 dias** — amoxicilina 50 mg/kg/dia (máximo 1 g) em dose única diária tem eficácia equivalente e melhor adesão. Penicilina G benzatina em dose única é alternativa útil quando a adesão é duvidosa. Em alergia não anafilática, cefalexina; em alergia anafilática, azitromicina ou clindamicina.',
              'Não há urgência em iniciar: prevenir febre reumática exige erradicação até o nono dia de sintomas, de modo que aguardar o resultado do teste é seguro e é justamente o que reduz prescrição desnecessária.',
            ]
          : [
              'Escore alto (probabilidade acima de 50%): **teste e trate se positivo**. Em contextos sem acesso a teste rápido ou cultura, várias diretrizes aceitam tratamento empírico nesta faixa — registre a justificativa.',
              'Penicilina V ou amoxicilina por 10 dias completos. Os 10 dias não são negociáveis para a prevenção da febre reumática, ainda que o paciente melhore em 48 horas: cursos curtos erradicam menos. Amoxicilina em dose única diária melhora a adesão.',
              'Procure ativamente complicações supurativas antes de tratar como faringite simples: trismo, voz abafada, desvio de úvula, abaulamento amigdaliano unilateral e sialorreia sugerem abscesso periamigdaliano e exigem drenagem; rigidez de nuca, torcicolo e abaulamento cervical posterior sugerem abscesso retrofaríngeo.',
              'Se houver **escarlatina** (exantema micropapular áspero em lixa, língua em framboesa, linhas de Pastia, palidez perioral), o diagnóstico está feito clinicamente e o tratamento é o mesmo, independentemente do escore ou do teste.',
              'Oriente retorno ao trabalho ou à escola após 24 horas de antibiótico e afebril. Não faça teste de controle pós-tratamento em paciente assintomático — portador crônico é comum e não precisa de tratamento.',
            ],
      alertas: [
        'O escore estima probabilidade de estreptococo, e não gravidade. Sinais de complicação supurativa — trismo, voz abafada, sialorreia, desvio de úvula, dificuldade de engolir saliva, dispneia, abaulamento cervical — indicam avaliação urgente e imagem, com qualquer pontuação.',
        'Abaixo de 3 anos, faringite estreptocócica é rara e a febre reumática praticamente não ocorre. O escore não se aplica e não se recomenda testar rotineiramente.',
        'Teste rápido positivo não distingue infecção de **estado de portador**, que ocorre em 5 a 20% das crianças assintomáticas. Em quadro clinicamente viral, um teste positivo pode significar portador com faringite viral concomitante.',
        'A glomerulonefrite pós-estreptocócica **não** é prevenida pelo antibiótico — apenas a febre reumática é. Não use esse argumento para justificar prescrição.',
        'Considere diagnósticos que mudam completamente a conduta: mononucleose (adenopatia posterior, esplenomegalia, linfocitose com atipia — e risco de exantema com amoxicilina), infecção gonocócica de orofaringe, HIV agudo, difteria em não vacinado, e síndrome de Lemierre em quadro arrastado com sepse.',
      ],
      tabela: {
        titulo: 'Pontuação, probabilidade e conduta',
        colunas: ['Pontos', 'Probabilidade de estreptococo', 'Conduta'],
        linhas: [
          ['≤ 0', '1 – 2,5%', 'Sem teste, sem antibiótico'],
          ['1', '5 – 10%', 'Sem teste, sem antibiótico'],
          ['2', '11 – 17%', 'Testar; tratar se positivo'],
          ['3', '28 – 35%', 'Testar; tratar se positivo'],
          ['≥ 4', '51 – 53%', 'Testar e tratar se positivo; empírico se não houver teste'],
        ],
        destaque: idx,
      },
    }
  },
  formula: ['Centor (4 itens) + 1 ponto se 3–14 anos, 0 se 15–44, −1 se ≥ 45'],
  fundamento:
    'McIsaac validou o Centor numa população de atenção primária que incluía crianças e observou que a idade é um preditor independente forte — a prevalência de faringite estreptocócica varia de menos de 5% em adultos acima de 45 anos a mais de 30% em escolares. O ajuste etário melhorou substancialmente a calibração. O escore original de Centor foi derivado em adultos de emergência, população com prevalência alta, e ao ser aplicado na atenção primária superestimava sistematicamente o risco; acrescentar um item que pode **subtrair** ponto foi a solução elegante para recalibrar sem refazer o modelo. Vale entender o propósito de todo esse cuidado diagnóstico, porque ele não é óbvio: a faringite estreptocócica é autolimitada e resolve em 3 a 5 dias, e o antibiótico abrevia os sintomas em cerca de 16 horas apenas. O que se quer prevenir é a **febre reumática**, doença autoimune pós-infecciosa em que proteínas M de certos sorotipos compartilham epítopos com miosina cardíaca, tropomiosina, laminina, tecido sinovial e proteínas dos núcleos da base; por mimetismo molecular, a resposta imune antiestreptocócica ataca esses tecidos e produz cardite, artrite migratória, coreia de Sydenham, eritema marginado e nódulos subcutâneos. Como essa resposta leva 2 a 3 semanas para se estabelecer, existe uma janela terapêutica de até nove dias de sintomas em que a erradicação ainda previne a doença — e é essa janela que torna legítimo aguardar o resultado do teste em vez de prescrever empiricamente, que é o comportamento que o escore existe para viabilizar. A lógica do instrumento, portanto, é probabilística e não diagnóstica: nas pontas ele dispensa o teste (embaixo porque a probabilidade é baixa demais, em cima porque é alta o suficiente para tratamento empírico onde não há teste), e no meio ele identifica exatamente quem precisa do exame. Duas advertências fecham o raciocínio: nenhum dos itens é específico o bastante isoladamente, e a glomerulonefrite pós-estreptocócica — cujo mecanismo é deposição de imunocomplexos já formados — não é prevenida pelo antibiótico.',
  armadilhas: [
    'Abaixo de 3 anos, faringite estreptocócica é rara e a febre reumática praticamente não ocorre — não se recomenda testar rotineiramente.',
    'Escarlatina (exantema micropapular áspero, língua em framboesa, linhas de Pastia) muda a conduta independentemente do escore.',
    'O item da tosse é invertido: pontua a **ausência** dela. Marcar presença de tosse como ponto positivo é erro frequente e inverte o sentido do escore.',
    'Adenopatia cervical **posterior** não pontua e aponta para outro diagnóstico — mononucleose, rubéola, toxoplasmose. Só a cadeia anterior dolorosa conta.',
    'Teste rápido positivo pode refletir estado de portador, presente em 5 a 20% das crianças assintomáticas, e não infecção ativa. Em quadro claramente viral, interprete com cautela.',
    'Cripta amigdaliana com cáseo, comum e crônica, é frequentemente confundida com exsudato agudo e infla a pontuação.',
    'O escore não avalia gravidade nem complicação: abscesso periamigdaliano, epiglotite, abscesso retrofaríngeo e síndrome de Lemierre exigem avaliação urgente independentemente da pontuação.',
    'Mononucleose merece consideração ativa antes de prescrever amoxicilina, que provoca exantema em grande parte desses pacientes e é frequentemente rotulado como alergia permanente à penicilina de forma equivocada.',
  ],
  referencias: [
    { texto: 'McIsaac WJ, White D, Tannenbaum D, Low DE. A clinical score to reduce unnecessary antibiotic use in patients with sore throat. CMAJ. 1998;158(1):75-83.' },
    { texto: 'Shulman ST, Bisno AL, Clegg HW, et al. Clinical practice guideline for the diagnosis and management of group A streptococcal pharyngitis. Clin Infect Dis. 2012;55(10):e86-e102.' },
  ],
}

const meningite: Ferramenta = {
  id: 'risco-meningite-bacteriana',
  nome: 'Escore de meningite bacteriana',
  sinonimos: ['meningite', 'nigrovic', 'bacterial meningitis score', 'liquor'],
  resumo: 'Identifica, em crianças com pleocitose liquórica, quem tem risco muito baixo de meningite bacteriana.',
  categorias: ['infectologia', 'pediatria', 'neurologia'],
  campos: [
    campoSimNao('gram', 'Coloração de Gram do líquor positiva', 1, 'Basta este item para tratar como meningite bacteriana, independentemente do restante. Gram positivo tem especificidade próxima de 100% e não admite conduta expectante.'),
    campoSimNao('neutroLiquor', 'Neutrófilos no líquor ≥ 1.000/µL', 1, 'Neutrófilos ABSOLUTOS no líquor, não o percentual nem a celularidade total. Converta: celularidade total × percentual de neutrófilos / 100.'),
    campoSimNao('proteinaLiquor', 'Proteína no líquor ≥ 80 mg/dL', 1, 'Proteinorraquia reflete a permeabilidade da barreira hematoencefálica. Atenção: punção traumática eleva a proteína por contaminação com sangue e pode gerar falso-positivo.'),
    campoSimNao('neutroSangue', 'Neutrófilos no sangue periférico ≥ 10.000/µL', 1, 'Valor absoluto do hemograma periférico (segmentados + bastonetes), não o total de leucócitos. É o único item que não vem do líquor.'),
    campoSimNao('convulsao', 'Convulsão na apresentação ou antes dela', 1, 'Crise associada ao quadro atual. Crise febril simples típica em criança de 6 meses a 5 anos, sem sinais meníngeos, é achado distinto — mas na dúvida o item conta e o escore fica positivo, que é o comportamento seguro.'),
  ],
  calcular: (v) => {
    const gram = sim(v, 'gram')
    const total = somaSimNao(v, [
      { id: 'gram', pontos: 1 },
      { id: 'neutroLiquor', pontos: 1 },
      { id: 'proteinaLiquor', pontos: 1 },
      { id: 'neutroSangue', pontos: 1 },
      { id: 'convulsao', pontos: 1 },
    ])
    const muitoBaixo = total === 0
    return {
      titulo: 'Escore de meningite bacteriana',
      valor: String(total),
      unidade: 'de 5 critérios',
      nivel: gram ? 'critico' : muitoBaixo ? 'ok' : 'alerta',
      rotuloNivel: gram ? 'Gram positivo — meningite bacteriana até prova em contrário' : muitoBaixo ? 'Risco muito baixo' : 'Não é risco baixo',
      detalhes: [
        { rotulo: 'Critérios presentes', valor: String(total) },
        { rotulo: 'Valor preditivo negativo com 0 critérios', valor: '≈ 99,9%', nota: 'Em coortes de validação com mais de 5 mil crianças com pleocitose.' },
      ],
      interpretacao: [
        muitoBaixo
          ? 'Nenhum critério presente: risco muito baixo de meningite bacteriana. Em serviços com bom seguimento, permite considerar observação sem antibiótico ou alta precoce após reavaliação — sempre com decisão compartilhada e retorno garantido.'
          : 'Pelo menos um critério presente: **trate empiricamente como meningite bacteriana** até o resultado das culturas. Ceftriaxona (ou cefotaxima) mais vancomicina, com dexametasona antes ou junto da primeira dose em crianças com suspeita de Haemophilus influenzae tipo b ou pneumococo.',
        'O escore foi derivado e validado em **crianças de 29 dias a 19 anos com pleocitose liquórica**. Não se aplica a neonatos, a quem não tem pleocitose, a imunossuprimidos, a portadores de derivação ventricular, a pós-neurocirurgia nem a quem recebeu antibiótico nas 72 horas anteriores.',
        'Não use em paciente que já parece gravemente doente, com petéquias, instabilidade ou alteração significativa do sensório — o escore existe para poupar antibiótico em quem está bem, não para postergá-lo em quem está mal.',
        'Os cinco critérios são, na prática, cinco leituras da **intensidade da resposta inflamatória meníngea** — e entender isso mostra por que a combinação funciona melhor que qualquer item isolado. A bactéria que alcança o espaço subaracnóideo se multiplica num compartimento praticamente desprovido de imunidade humoral e de complemento; seus componentes de parede (peptidoglicano, ácido lipoteicoico no pneumococo, lipopolissacarídeo no meningococo) ativam receptores do tipo Toll em astrócitos, micróglia e células endoteliais, disparando produção local de TNF-α, IL-1β e IL-6. Essas citocinas induzem expressão de selectinas e integrinas no endotélio dos capilares meníngeos, e o resultado é migração maciça de neutrófilos — daí a **neutrofilia liquórica** — muito mais intensa do que a resposta linfocitária das meningites virais, que é mediada por interferons e quimiocinas diferentes. As mesmas citocinas abrem as junções oclusivas do endotélio, aumentando a permeabilidade da barreira hematoencefálica, o que explica a **proteinorraquia** elevada: albumina sérica extravasa para o líquor. A **neutrofilia periférica** reflete a mobilização medular sistêmica pela IL-6 e pelo G-CSF, isto é, a resposta que transborda o compartimento meníngeo. E a **convulsão** marca irritação cortical direta, vasculite das artérias que cruzam o espaço subaracnóideo e, eventualmente, hiponatremia por secreção inapropriada de vasopressina. O Gram positivo é categoricamente diferente dos demais: não é medida de inflamação, é a demonstração do agente. Por isso um único critério, o Gram, é suficiente para tratar, enquanto os outros quatro fazem sentido como conjunto.',
      ],
      conduta: gram
        ? [
            'Gram positivo é diagnóstico até prova em contrário: **antibiótico imediato**, na primeira hora, sem aguardar mais nenhum exame. Ceftriaxona 100 mg/kg/dia (ou cefotaxima) associada a vancomicina 60 mg/kg/dia para cobrir pneumococo com resistência intermediária à penicilina.',
            'Ajuste a cobertura pela morfologia vista no Gram e pela faixa etária: diplococos gram-positivos sugerem pneumococo, diplococos gram-negativos sugerem meningococo, bastonetes gram-negativos em lactente pequeno ou imunossuprimido pedem cobertura ampliada, e cocobacilos gram-positivos levantam Listeria (acrescente ampicilina).',
            '**Dexametasona** 0,15 mg/kg a cada 6 horas por 2 a 4 dias, administrada antes ou junto com a primeira dose do antibiótico, reduz perda auditiva e sequela neurológica na meningite por Haemophilus influenzae tipo b e, com evidência mais modesta, na pneumocócica. Dada depois do antibiótico, perde o benefício.',
            'Internação, monitorização e vigilância das complicações: hipertensão intracraniana, crise convulsiva, hiponatremia por secreção inapropriada de vasopressina, choque, coagulação intravascular disseminada e coleção subdural. Programe avaliação audiológica antes da alta.',
            'Notifique o caso e providencie **quimioprofilaxia dos contatos** quando confirmado meningococo (rifampicina, ceftriaxona ou ciprofloxacino conforme idade e disponibilidade) ou Haemophilus influenzae tipo b. Isso é responsabilidade do serviço, não da família.',
          ]
        : muitoBaixo
          ? [
              'Nenhum critério presente: risco muito baixo, com valor preditivo negativo em torno de 99,9%. Isso **permite** considerar observação sem antibiótico ou alta precoce — não obriga. A decisão é compartilhada com a família e depende de o paciente estar clinicamente bem, de haver retorno garantido e de o serviço conseguir seguir as culturas.',
              'Antes de aplicar o resultado, confirme que o paciente está de fato **fora** dos grupos em que o escore não vale: idade entre 29 dias e 19 anos, presença de pleocitose, ausência de imunossupressão, de derivação ventricular, de neurocirurgia recente e de antibiótico nas 72 horas anteriores.',
              'Se optar por observação sem antibiótico, mantenha o paciente em vigilância por 24 a 36 horas com reavaliações clínicas documentadas, acompanhe as culturas de líquor e de sangue e defina explicitamente quem reavalia e quando.',
              'Trate como meningite viral: analgesia adequada (a cefaleia é intensa e frequentemente subtratada), antitérmico, hidratação e repouso. Considere aciclovir se houver suspeita de encefalite herpética — alteração de comportamento, déficit focal, crise convulsiva ou alteração de sinal em lobo temporal na imagem —, situação em que o retardo do tratamento é devastador.',
              'Oriente retorno imediato se houver febre persistente, piora da cefaleia, vômitos, sonolência, irritabilidade progressiva, crise convulsiva ou qualquer lesão de pele nova.',
            ]
          : [
              'Pelo menos um critério presente: **trate empiricamente como meningite bacteriana** até o resultado das culturas. Ceftriaxona (ou cefotaxima) mais vancomicina, com dexametasona antes ou junto da primeira dose.',
              'Não aguarde exame para iniciar o antibiótico. Se houver indicação de tomografia antes da punção (déficit focal, papiledema, rebaixamento importante, imunossupressão), colha hemoculturas e administre o antibiótico primeiro — o rendimento da cultura de líquor cai, mas o atraso custa mais.',
              'Internação com monitorização e vigilância ativa de hipertensão intracraniana, crise convulsiva, hiponatremia, choque e coleção subdural. Programe avaliação audiológica antes da alta, porque a perda auditiva é a sequela mais comum e é tratável quando detectada.',
              'Reavalie o diagnóstico com as culturas em 48 a 72 horas. Cultura negativa em paciente que melhorou e cujo perfil liquórico é viral permite suspender o antibiótico — a decisão de descalonar é tão importante quanto a de iniciar.',
              'Notifique e providencie quimioprofilaxia de contatos se o agente for meningococo ou Haemophilus influenzae tipo b.',
            ],
      alertas: [
        'Antibiótico prévio pode "esterilizar" o líquor e reduzir os parâmetros inflamatórios, invalidando o escore.',
        'O escore **não se aplica** a neonatos (até 28 dias), a quem não tem pleocitose, a imunossuprimidos, a portadores de derivação ventricular, a pós-neurocirúrgicos nem a quem usou antibiótico nas 72 horas anteriores. Fora desses limites, o valor preditivo negativo de 99,9% simplesmente não existe.',
        'Petéquia ou púrpura indica antibiótico imediato, com qualquer pontuação: a meningococcemia pode cursar com líquor pouco alterado e evoluir para óbito em horas.',
        'Aparência clinicamente grave, instabilidade hemodinâmica, rebaixamento do sensório ou déficit focal prevalecem sobre o escore. Ele serve para poupar antibiótico em criança que está bem, nunca para postergá-lo em criança que está mal.',
        'Suspeita de encefalite herpética exige aciclovir empírico independentemente do escore, que foi construído para meningite bacteriana e não avalia esse risco.',
      ],
      tabela: {
        titulo: 'O que cada critério mede',
        colunas: ['Critério', 'Compartimento', 'Mecanismo'],
        linhas: [
          ['Gram positivo', 'Líquor', 'Demonstração do agente — não é medida de inflamação'],
          ['Neutrófilos no líquor ≥ 1.000/µL', 'Líquor', 'Migração neutrofílica por TNF-α e IL-1β locais'],
          ['Proteína no líquor ≥ 80 mg/dL', 'Líquor', 'Abertura de junções oclusivas da barreira'],
          ['Neutrófilos no sangue ≥ 10.000/µL', 'Sistêmico', 'Mobilização medular por IL-6 e G-CSF'],
          ['Convulsão', 'Córtex', 'Irritação cortical, vasculite, hiponatremia'],
        ],
        destaque: gram ? 0 : undefined,
      },
    }
  },
  formula: ['Risco muito baixo = nenhum dos 5 critérios presente'],
  fundamento:
    'Nigrovic e colaboradores partiram do problema clínico real: a maioria esmagadora das crianças com pleocitose liquórica tem meningite viral, mas quase todas recebem antibiótico e internação até as culturas ficarem prontas. O escore identifica com segurança altíssima o grupo que não precisa disso — sua utilidade está inteiramente no valor preditivo negativo. Essa é uma classe de instrumento diferente da maioria dos escores: ele não foi construído para graduar risco ao longo de um espectro, e sim para estabelecer um **limiar de exclusão**. Por isso tem apenas dois resultados úteis na prática — zero critérios ou pelo menos um — e por isso sua validação foi dimensionada para demonstrar valor preditivo negativo, não discriminação global. Os quatro critérios inflamatórios medem a mesma coisa por janelas diferentes: a bactéria no espaço subaracnóideo, compartimento praticamente sem imunidade humoral nem complemento, libera componentes de parede que ativam receptores do tipo Toll em micróglia, astrócitos e endotélio, desencadeando TNF-α, IL-1β e IL-6 locais; essas citocinas induzem selectinas e integrinas que recrutam neutrófilos em massa (neutrofilia liquórica), abrem as junções oclusivas do endotélio permitindo extravasamento de albumina (proteinorraquia), transbordam para a circulação mobilizando o pool medular (neutrofilia periférica) e irritam o córtex adjacente, além de provocarem vasculite e secreção inapropriada de vasopressina (convulsão). A meningite viral aciona uma cascata distinta, mediada por interferons, com predomínio linfocitário e barreira menos comprometida — e é essa diferença de mecanismo que o escore explora. O quinto critério, o Gram, não pertence à mesma categoria: não mede inflamação, demonstra o agente, e tem especificidade próxima de 100%. É por isso que ele basta sozinho. O limite mais importante do instrumento é conceitual e não estatístico: qualquer coisa que altere a relação entre bactéria e resposta inflamatória o invalida. Neonato não monta resposta comparável, imunossuprimido e neutropênico não recrutam neutrófilos, derivação ventricular e neurocirurgia alteram a barreira, e antibiótico prévio reduz a carga bacteriana e os quatro parâmetros de uma vez.',
  armadilhas: [
    'Punção traumática altera a contagem de células e a proteína. Correções (regra de 1 leucócito para cada 500 a 700 hemácias) são imprecisas — na dúvida, trate.',
    'Meningococcemia pode cursar com líquor pouco alterado e evolução fulminante. Petéquia ou púrpura é indicação de antibiótico imediato, escore nenhum.',
    'O critério liquórico é de neutrófilos **absolutos**, não de celularidade total nem de percentual. Usar a celularidade total no lugar dos neutrófilos superestima e gera falso-positivo.',
    'A neutrofilia periférica é do hemograma e não do líquor. É o único item extrameníngeo e é frequentemente confundido com o critério liquórico.',
    'Aplicado fora da faixa validada — neonato, ausência de pleocitose, imunossupressão, derivação ventricular, pós-neurocirurgia, antibiótico nas 72 h prévias — o escore perde completamente o valor preditivo negativo que justifica seu uso.',
    'Escore zero não é alta automática. É permissão para considerar observação sem antibiótico em criança clinicamente bem, com retorno garantido e culturas acompanhadas — decisão compartilhada, não protocolo.',
    'Não avalia encefalite herpética. Alteração de comportamento, déficit focal ou crise em contexto compatível exigem aciclovir empírico, independentemente da pontuação.',
  ],
  referencias: [
    { texto: 'Nigrovic LE, Kuppermann N, Macias CG, et al. Clinical prediction rule for identifying children with cerebrospinal fluid pleocytosis at very low risk of bacterial meningitis. JAMA. 2007;297(1):52-60.' },
    { texto: 'Nigrovic LE, Malley R, Kuppermann N. Meta-analysis of bacterial meningitis score validation studies. Arch Dis Child. 2012;97(9):799-805.' },
    { texto: 'Brouwer MC, McIntyre P, Prasad K, van de Beek D. Corticosteroids for acute bacterial meningitis. Cochrane Database Syst Rev. 2015;(9):CD004405.' },
  ],
}

/* ═══════════════════════ Antimicrobianos ═══════════════════════ */

const vancomicina: Ferramenta = {
  id: 'vancomicina-dose',
  nome: 'Dose de vancomicina e AUC/CIM',
  sinonimos: ['vancomicina', 'vanco', 'auc', 'nivel de vancomicina', 'vale'],
  resumo: 'Calcula ataque, manutenção e a área sob a curva pelos dois métodos aceitos.',
  categorias: ['infectologia', 'farmacologia'],
  campos: [
    campoPeso({ ajuda: 'Use o peso corporal **real**, inclusive em obesos — a dose de ataque de vancomicina é calculada sobre peso real.' }),
    campoIdade({ min: 18 }),
    campoSexo(),
    campoNum('creatinina', 'Creatinina sérica', { unidade: 'mg/dL', min: 0.1, max: 15, passo: 0.01 }),
    campoNum('cim', 'CIM da vancomicina', { unidade: 'mg/L', min: 0.25, max: 4, passo: 0.25, padrao: '1', ajuda: 'Assuma 1 mg/L quando não houver antibiograma — é a CIM modal do S. aureus sensível.' }),
    campoSeg('metodo', 'Cálculo da AUC', [
      { valor: 'populacional', rotulo: 'Estimativa populacional' },
      { valor: 'niveis', rotulo: 'Dois níveis séricos' },
    ]),
    campoNum('dose24', 'Dose diária total planejada', { unidade: 'mg', min: 250, max: 6000, passo: 50, mostrarSe: (v) => opc(v, 'metodo') === 'populacional' }),
    campoNum('c1', 'Primeiro nível (pico, 1 a 2 h após o fim da infusão)', { unidade: 'mg/L', min: 1, max: 80, passo: 0.1, mostrarSe: (v) => opc(v, 'metodo') === 'niveis' }),
    campoNum('t1', 'Tempo do primeiro nível após o início da infusão', { unidade: 'h', min: 0.5, max: 12, passo: 0.1, padrao: '2', mostrarSe: (v) => opc(v, 'metodo') === 'niveis' }),
    campoNum('c2', 'Segundo nível (vale, antes da dose seguinte)', { unidade: 'mg/L', min: 0.5, max: 60, passo: 0.1, mostrarSe: (v) => opc(v, 'metodo') === 'niveis' }),
    campoNum('t2', 'Tempo do segundo nível após o início da infusão', { unidade: 'h', min: 1, max: 48, passo: 0.1, padrao: '11', mostrarSe: (v) => opc(v, 'metodo') === 'niveis' }),
    campoNum('intervalo', 'Intervalo entre doses', { unidade: 'h', min: 6, max: 48, passo: 1, padrao: '12', mostrarSe: (v) => opc(v, 'metodo') === 'niveis' }),
    campoNum('doseAdm', 'Dose administrada por vez', { unidade: 'mg', min: 250, max: 3000, passo: 50, mostrarSe: (v) => opc(v, 'metodo') === 'niveis' }),
    campoNum('infusao', 'Duração da infusão', { unidade: 'h', min: 0.5, max: 4, passo: 0.5, padrao: '1', mostrarSe: (v) => opc(v, 'metodo') === 'niveis' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const idade = num(v, 'idade')
    const cr = num(v, 'creatinina')
    const cim = numOu(v, 'cim', 1)
    if (peso === null || idade === null || cr === null || cr <= 0) return null
    const f = opc(v, 'sexo') === 'f'
    const clcr = (((140 - idade) * peso) / (72 * cr)) * (f ? 0.85 : 1)
    const ataque = Math.min(Math.round((peso * 25) / 250) * 250, 3000)
    const ataqueAlto = Math.min(Math.round((peso * 30) / 250) * 250, 3000)
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Dose de ataque (25 a 30 mg/kg)', valor: `${fmtInt(ataque)} a ${fmtInt(ataqueAlto)} mg`, nota: 'Peso real, máximo de 2000 a 3000 mg. **Não se ajusta pela função renal** — depende do volume de distribuição, não do clearance.' },
      { rotulo: 'Clearance de creatinina', valor: `${fmtInt(clcr)} mL/min` },
      { rotulo: 'Clearance de vancomicina estimado', valor: `${fmt(clcr * 0.06 * 0.7, 2)} L/h`, nota: 'Aproximadamente 70% do clearance de creatinina.' },
    ]
    let auc: number | null = null
    if (opc(v, 'metodo') === 'populacional') {
      const dose24 = num(v, 'dose24')
      if (dose24 === null) return null
      const clVanco = clcr * 0.06 * 0.7
      if (clVanco <= 0) return null
      auc = dose24 / clVanco
      const doseAlvo500 = 500 * clVanco
      detalhes.push({ rotulo: 'Dose diária planejada', valor: `${fmtInt(dose24)} mg`, nota: `${fmt(dose24 / peso, 1)} mg/kg/dia` })
      detalhes.push({ rotulo: 'Dose diária para AUC de 500', valor: `${fmtInt(doseAlvo500)} mg`, nota: 'Alvo central da faixa recomendada.' })
    } else {
      const c1 = num(v, 'c1')
      const t1 = num(v, 't1')
      const c2 = num(v, 'c2')
      const t2 = num(v, 't2')
      const intervalo = numOu(v, 'intervalo', 12)
      const inf = numOu(v, 'infusao', 1)
      if (c1 === null || t1 === null || c2 === null || t2 === null || c2 <= 0 || t2 <= t1) return null
      const ke = Math.log(c1 / c2) / (t2 - t1)
      if (!(ke > 0)) return null
      const meiaVida = Math.log(2) / ke
      const cmax = c1 * Math.exp(ke * (t1 - inf))
      const cmin = c2 * Math.exp(-ke * (intervalo - t2))
      const aucInfusao = ((cmax + cmin) / 2) * inf
      const aucEliminacao = (cmax - cmin) / ke
      const aucTau = aucInfusao + aucEliminacao
      auc = aucTau * (24 / intervalo)
      detalhes.push({ rotulo: 'Constante de eliminação (ke)', valor: `${fmt(ke, 4)} h⁻¹` })
      detalhes.push({ rotulo: 'Meia-vida', valor: `${fmt(meiaVida, 1)} h`, nota: 'Referência com função renal normal: 6 a 12 h. Meia-vida longa exige intervalo maior, não dose menor.' })
      detalhes.push({ rotulo: 'Cmax extrapolado', valor: `${fmt(cmax, 1)} mg/L` })
      detalhes.push({ rotulo: 'Cmin extrapolado (vale)', valor: `${fmt(cmin, 1)} mg/L` })
      detalhes.push({ rotulo: 'AUC no intervalo', valor: `${fmt(aucTau, 1)} mg·h/L` })
    }
    const razao = auc !== null && cim > 0 ? auc / cim : null
    if (auc !== null) detalhes.unshift({ rotulo: 'AUC₂₄', valor: `${fmtInt(auc)} mg·h/L` })
    if (razao !== null)
      detalhes.unshift({
        rotulo: 'AUC₂₄/CIM',
        valor: fmtInt(razao),
        nota: 'Alvo 400 a 600. Abaixo de 400, risco de falha terapêutica; acima de 600, risco de nefrotoxicidade que cresce de forma acentuada.',
        nivel: razao < 400 ? 'alerta' : razao > 600 ? 'critico' : 'ok',
      })
    const nivel: Nivel = razao === null ? 'neutro' : razao < 400 ? 'alerta' : razao > 600 ? 'critico' : 'ok'
    return {
      titulo: 'AUC₂₄/CIM da vancomicina',
      valor: razao === null ? '—' : fmtInt(razao),
      nivel,
      rotuloNivel: razao === null ? '' : razao < 400 ? 'Abaixo do alvo — risco de falha' : razao > 600 ? 'Acima do alvo — risco de nefrotoxicidade' : 'Dentro do alvo (400 a 600)',
      detalhes,
      conduta: [
        'Dose pelo alvo de **AUC/CIM ≥ 400 (e < 600 para segurança renal)**, não pelo vale isolado. As diretrizes de 2020 abandonaram a meta de vale de 15–20 mg/L porque ela expõe o paciente a nefrotoxicidade sem garantir a exposição eficaz — a mudança é a mais importante dos últimos anos no uso do fármaco.',
        'Administre **dose de ataque de 20–25 mg/kg (peso real, teto habitual de 2–3 g)** em infecção grave: sem ela, o estado de equilíbrio demora 24–48 h e as primeiras horas — justamente as mais decisivas — ficam subdosadas.',
        'Colha os níveis de forma correta: para AUC por duas amostras, uma no pico (1–2 h após o fim da infusão) e uma no vale; para vale isolado, imediatamente antes da 4ª dose. Colher antes do equilíbrio produz decisões erradas em ambas as direções.',
        'Infunda em **no mínimo 1 hora (60 minutos por grama)** para evitar a síndrome do homem vermelho, que é liberação direta de histamina e não alergia — trata-se com anti-histamínico e redução da velocidade, não com troca de antimicrobiano.',
        'Monitore **creatinina a cada 2–3 dias** (diariamente em instabilidade) e reavalie a necessidade da vancomicina a cada 48–72 h. O risco de nefrotoxicidade cresce com AUC > 600, com duração acima de 7 dias e com uso concomitante de **piperacilina-tazobactam**, combinação cuja nefrotoxicidade aditiva é bem documentada. Se o agente for sensível a betalactâmico, a troca é superior em eficácia e em segurança.',
      ],
      interpretacao: [
        'A diretriz de consenso de 2020 **abandonou o vale de 15 a 20 mg/L** como alvo. O motivo é direto: manter vales nessa faixa produzia AUCs frequentemente acima de 600, com nefrotoxicidade significativa e sem ganho de eficácia. O alvo passou a ser a AUC₂₄/CIM entre 400 e 600.',
        'A AUC pode ser estimada de duas formas: por equação populacional de primeira ordem (menos precisa, dispensa níveis) ou por dois níveis séricos com cálculo bayesiano ou trapezoidal (mais precisa, é a recomendada). Esta ferramenta implementa a versão trapezoidal analítica.',
        'A dose de ataque de 25 a 30 mg/kg é a intervenção mais negligenciada: sem ela, a concentração alvo só é atingida após 24 a 48 horas, exatamente o período em que a bacteremia por S. aureus mais determina o desfecho.',
        'Se a CIM da vancomicina for **2 mg/L ou maior**, atingir AUC/CIM ≥ 400 exigiria doses nefrotóxicas. Nesse cenário, troque o antimicrobiano — daptomicina, linezolida ou ceftarolina, conforme o sítio.',
      ],
      alertas: [
        'Monitorize creatinina pelo menos duas vezes por semana em tratamento prolongado, e diariamente em paciente instável ou em uso concomitante de piperacilina-tazobactam, cuja associação com vancomicina eleva a incidência de lesão renal.',
        'Não use a AUC estimada em paciente com função renal instável — a premissa de estado de equilíbrio se rompe. Nesses casos, meça níveis.',
      ],
    }
  },
  formula: [
    'Ataque = 25 a 30 mg/kg de peso real (máximo 2000 a 3000 mg)',
    'AUC₂₄ = dose diária ÷ clearance de vancomicina',
    'Cl vanco ≈ 0,7 × ClCr (convertido para L/h)',
    'Por dois níveis: ke = ln(C1/C2)/(t2−t1); AUC = [(Cmax+Cmin)/2 × t infusão] + [(Cmax−Cmin)/ke]',
  ],
  fundamento:
    'A vancomicina tem atividade **dependente da exposição total**, não do pico nem do tempo acima da CIM. O parâmetro farmacodinâmico que melhor prediz morte bacteriana em modelos animais e desfecho clínico em infecção por S. aureus resistente à meticilina é a razão entre a área sob a curva de 24 horas e a concentração inibitória mínima. O vale foi adotado historicamente apenas como marcador substituto, fácil de medir — e a diretriz de 2020 reconheceu que o substituto se distanciou demais do alvo real.',
  armadilhas: [
    'O vale isolado não estima bem a AUC: para o mesmo vale, AUCs podem variar mais de duas vezes conforme o intervalo e a dose.',
    'Em obesidade grave, o clearance de vancomicina não escala linearmente com o peso; doses acima de 4,5 g/dia exigem monitorização rigorosa.',
    'Colha o vale imediatamente antes da dose e o pico 1 a 2 horas após o **fim** da infusão. Colher no cateter por onde a droga passou produz níveis absurdos.',
  ],
  referencias: [
    { texto: 'Rybak MJ, Le J, Lodise TP, et al. Therapeutic monitoring of vancomycin for serious MRSA infections: a revised consensus guideline of ASHP, IDSA, PIDS and SIDP. Am J Health Syst Pharm. 2020;77(11):835-864.' },
    { texto: 'Moise-Broder PA, Forrest A, Birmingham MC, Schentag JJ. Pharmacodynamics of vancomycin and other antimicrobials in patients with S. aureus lower respiratory tract infections. Clin Pharmacokinet. 2004;43(13):925-942.' },
  ],
}

const conversorAtb: Ferramenta = {
  id: 'conversor-antimicrobianos',
  nome: 'Conversor de doses de antimicrobianos e troca para via oral',
  sinonimos: ['conversor antibiotico', 'ev para vo', 'switch oral', 'dose antimicrobiano'],
  resumo: 'Dose por peso, equivalência endovenosa para oral e critérios de descalonamento.',
  categorias: ['infectologia', 'farmacologia'],
  campos: [
    campoPeso(),
    campoOpc('farmaco', 'Antimicrobiano', [
      { valor: 'amoxicilina', rotulo: 'Amoxicilina / amoxicilina-clavulanato' },
      { valor: 'cefalexina', rotulo: 'Cefalexina' },
      { valor: 'ceftriaxona', rotulo: 'Ceftriaxona' },
      { valor: 'cipro', rotulo: 'Ciprofloxacino' },
      { valor: 'levo', rotulo: 'Levofloxacino' },
      { valor: 'clinda', rotulo: 'Clindamicina' },
      { valor: 'metronidazol', rotulo: 'Metronidazol' },
      { valor: 'sulfa', rotulo: 'Sulfametoxazol-trimetoprima' },
      { valor: 'linezolida', rotulo: 'Linezolida' },
      { valor: 'fluconazol', rotulo: 'Fluconazol' },
    ]),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const farmaco = opc(v, 'farmaco')
    if (peso === null) return null
    const dados: Record<string, { ev: string; vo: string; biod: string; pediatria: string; obs: string }> = {
      amoxicilina: { ev: 'Ampicilina 1 a 2 g 6/6 h', vo: 'Amoxicilina 500 a 1000 mg 8/8 h', biod: '75 a 90%', pediatria: '50 mg/kg/dia (até 90 mg/kg/dia em otite e pneumonia), 8/8 h ou 12/12 h', obs: 'Biodisponibilidade oral excelente — a troca é praticamente 1:1 em termos de exposição.' },
      cefalexina: { ev: 'Cefazolina 1 a 2 g 8/8 h', vo: 'Cefalexina 500 mg 6/6 h', biod: '90%', pediatria: '25 a 50 mg/kg/dia, 6/6 h', obs: 'Não cobre S. aureus resistente à meticilina nem Gram-negativos além dos comunitários.' },
      ceftriaxona: { ev: '1 a 2 g 24/24 h (2 g 12/12 h em meningite)', vo: 'Sem equivalente oral direto; converter conforme cultura', biod: '—', pediatria: '50 a 75 mg/kg/dia (100 mg/kg/dia em meningite)', obs: 'Não usar em neonatos com hiperbilirrubinemia ou em uso de cálcio endovenoso. Não cobre Pseudomonas nem Enterococcus.' },
      cipro: { ev: '400 mg 8/8 h ou 12/12 h', vo: '500 a 750 mg 12/12 h', biod: '70 a 80%', pediatria: 'Uso restrito; 20 a 30 mg/kg/dia quando indicado', obs: '750 mg por via oral produzem exposição equivalente a 400 mg endovenosos. Cátions divalentes (antiácido, cálcio, ferro, leite) reduzem a absorção — espaçar 2 h.' },
      levo: { ev: '500 a 750 mg 24/24 h', vo: '500 a 750 mg 24/24 h', biod: '99%', pediatria: 'Uso restrito', obs: 'Biodisponibilidade praticamente completa: a troca é 1:1. Não há razão farmacocinética para manter por via endovenosa em paciente que come.' },
      clinda: { ev: '600 a 900 mg 8/8 h', vo: '300 a 450 mg 6/6 h', biod: '90%', pediatria: '20 a 40 mg/kg/dia, 6/6 h ou 8/8 h', obs: 'Maior risco de colite por C. difficile entre os antimicrobianos de uso comum.' },
      metronidazol: { ev: '500 mg 8/8 h', vo: '500 mg 8/8 h', biod: '~100%', pediatria: '30 mg/kg/dia, 8/8 h', obs: 'Biodisponibilidade oral completa — manter por via endovenosa é desperdício de recurso.' },
      sulfa: { ev: '15 a 20 mg/kg/dia de trimetoprima em pneumocistose', vo: 'Mesma dose; comprimido de 800/160 mg', biod: '~90 a 100%', pediatria: '8 a 12 mg/kg/dia de trimetoprima', obs: 'A dose é sempre expressa pelo componente trimetoprima. Monitorize potássio e creatinina.' },
      linezolida: { ev: '600 mg 12/12 h', vo: '600 mg 12/12 h', biod: '~100%', pediatria: '10 mg/kg 8/8 h', obs: 'Troca 1:1. Mielossupressão a partir de 2 semanas; risco de síndrome serotoninérgica com antidepressivos.' },
      fluconazol: { ev: '400 a 800 mg no primeiro dia, depois 200 a 400 mg/dia', vo: 'Mesma dose', biod: '> 90%', pediatria: '6 a 12 mg/kg/dia', obs: 'Troca 1:1. Não cobre Candida krusei e tem atividade reduzida contra C. glabrata.' },
    }
    const d = dados[farmaco]
    return {
      titulo: 'Equivalência e dose',
      valor: d.biod,
      unidade: 'biodisponibilidade oral',
      nivel: 'neutro',
      detalhes: [
        { rotulo: 'Dose endovenosa habitual', valor: d.ev },
        { rotulo: 'Dose oral equivalente', valor: d.vo },
        { rotulo: 'Dose pediátrica', valor: d.pediatria, nota: `Para ${fmt(peso, 1)} kg, calcule sobre este valor por quilo.` },
        { rotulo: 'Observação', valor: d.obs },
      ],
      conduta: [
        'Faça a **troca para via oral (terapia sequencial)** assim que o paciente preencher os critérios: estabilidade hemodinâmica por 24 h, afebril, melhora clínica, trato gastrointestinal funcionante e ausência de foco que exija concentração intravenosa. Isso reduz tempo de internação, infecção de cateter e custo, sem perda de eficácia.',
        'Conheça os fármacos com **biodisponibilidade oral próxima de 100%**, que permitem troca sem perda de exposição: fluoroquinolonas, linezolida, metronidazol, fluconazol, doxiciclina, sulfametoxazol-trimetoprima e rifampicina. Esses podem substituir o esquema intravenoso praticamente na mesma dose.',
        '**Não troque para via oral** em endocardite, meningite, abscesso cerebral, osteomielite em fase inicial de tratamento, neutropenia febril não resolvida, bacteremia por *Staphylococcus aureus* não controlada, ou em má absorção. Nesses casos, a concentração no sítio depende da via intravenosa.',
        'Ao converter, **recalcule pela função renal do momento**, não pela da admissão: muitos pacientes recuperam filtração durante a internação e permanecem subdosados com a prescrição reduzida inicial — falha terapêutica silenciosa e frequente.',
        'Aproveite a conversão para **reavaliar espectro e duração**: é o momento natural de descalonar conforme cultura e antibiograma, e de definir a data de término. Prescrever \'até reavaliação\' sem data é o que produz tratamentos de 3 semanas em infecções de 7 dias.',
      ],
      interpretacao: [
        '**Critérios para trocar endovenoso por oral:** melhora clínica com estabilidade por 24 a 48 horas, ausência de febre por 24 horas, trato gastrointestinal funcionante e absorvendo, ausência de sítio que exija concentração elevada (endocardite, meningite, abscesso não drenado, osteomielite em fase inicial) e disponibilidade de agente oral com espectro adequado.',
        'Antimicrobianos com biodisponibilidade oral próxima de 100% — levofloxacino, moxifloxacino, linezolida, metronidazol, fluconazol, doxiciclina, sulfametoxazol-trimetoprima, rifampicina, clindamicina — não têm justificativa farmacocinética para permanecerem endovenosos em paciente que se alimenta.',
        'A troca precoce reduz tempo de internação, infecção de corrente sanguínea associada a cateter, custo e tromboflebite. É uma das medidas de maior impacto dos programas de gerenciamento de antimicrobianos.',
      ],
      alertas: ['As doses aqui são de referência para adultos com função renal normal. Ajuste pela função renal e hepática, pelo sítio de infecção e pelo antibiograma.'],
    }
  },
  formula: ['Dose pediátrica = mg/kg/dia × peso, dividida pelo número de tomadas'],
  fundamento:
    'A escolha entre via endovenosa e oral raramente é farmacológica — é cultural. Para muitos antimicrobianos a exposição plasmática por via oral é indistinguível da endovenosa, e a resistência à troca vem de hábito, não de evidência. Reconhecer os fármacos de alta biodisponibilidade é o primeiro passo para o descalonamento. A troca para via oral é possível quando a **biodisponibilidade** do fármaco é alta o bastante para reproduzir a exposição intravenosa — quinolonas, linezolida, metronidazol, fluconazol e sulfametoxazol-trimetoprima chegam perto de 100% porque são bem absorvidos e sofrem pouca metabolização de primeira passagem. O que impede a troca em endocardite, meningite e osteomielite não é a absorção, e sim a **penetração no sítio**: barreiras anatômicas, vegetações avasculares e osso sequestrado exigem concentrações plasmáticas altas e sustentadas.',
  armadilhas: [
    'Absorção comprometida em choque, íleo, síndrome do intestino curto, vômitos e uso de sonda com dieta contínua invalida a premissa da troca.',
    'Interações de absorção são específicas: quinolonas e tetraciclinas quelam com cálcio, ferro, magnésio e alumínio; itraconazol cápsula exige acidez gástrica.',
  ],
  referencias: [
    { texto: 'Barlam TF, Cosgrove SE, Abbo LM, et al. Implementing an antibiotic stewardship program: guidelines by IDSA and SHEA. Clin Infect Dis. 2016;62(10):e51-e77.' },
    { texto: 'Cyriac JM, James E. Switch over from intravenous to oral therapy: a concise overview. J Pharmacol Pharmacother. 2014;5(2):83-87.' },
  ],
}

const antibiograma: Ferramenta = {
  id: 'conversor-antibiograma',
  nome: 'Interpretação de antibiograma e CIM',
  sinonimos: ['antibiograma', 'cim', 'mic', 'sensivel resistente', 'breakpoint'],
  resumo: 'Traduz sensível, intermediário e resistente — e o que a CIM significa de fato.',
  categorias: ['infectologia'],
  campos: [
    campoOpc('categoria', 'Categoria reportada', [
      { valor: 's', rotulo: 'S — sensível' },
      { valor: 'i', rotulo: 'I — sensível com exposição aumentada (antigo intermediário)' },
      { valor: 'r', rotulo: 'R — resistente' },
    ]),
    campoNum('cim', 'CIM reportada', { unidade: 'mg/L', min: 0.008, max: 512, passo: 0.008, opcional: true }),
    campoNum('breakpoint', 'Ponto de corte de sensibilidade do fármaco', { unidade: 'mg/L', min: 0.008, max: 512, passo: 0.008, opcional: true }),
    campoOpc('classe', 'Classe do antimicrobiano', [
      { valor: 'tempo', rotulo: 'Tempo-dependente (beta-lactâmicos, linezolida)' },
      { valor: 'concentracao', rotulo: 'Concentração-dependente (aminoglicosídeos, quinolonas, daptomicina)' },
      { valor: 'auc', rotulo: 'Dependente da exposição total (vancomicina, macrolídeos, tetraciclinas)' },
    ]),
  ],
  calcular: (v) => {
    const cat = opc(v, 'categoria')
    const cim = num(v, 'cim')
    const bp = num(v, 'breakpoint')
    const classe = opc(v, 'classe')
    const detalhes: Resultado['detalhes'] = []
    if (cim !== null && bp !== null && bp > 0) {
      const razao = cim / bp
      detalhes.push({ rotulo: 'CIM / ponto de corte', valor: fmt(razao, 2), nota: razao <= 0.25 ? 'CIM bem abaixo do corte — margem confortável.' : razao <= 1 ? 'CIM dentro da faixa de sensibilidade, mas próxima do corte: em sítios de difícil penetração, considere alternativa.' : 'CIM acima do corte.' })
      detalhes.push({ rotulo: 'Diluições abaixo do corte', valor: razao > 0 ? fmt(Math.log2(1 / razao), 1) : '—', nota: 'A CIM é medida em diluições sucessivas de base 2; diferenças de uma diluição estão dentro do erro do método.' })
    }
    const alvos: Record<string, string> = {
      tempo: 'O alvo é **tempo acima da CIM**: 40 a 70% do intervalo entre doses, conforme a classe. Estratégias que aumentam esse tempo são infusão estendida (3 a 4 h) ou contínua, e intervalos menores — não doses maiores.',
      concentracao: 'O alvo é a **razão Cmax/CIM**, tipicamente ≥ 8 a 10. A estratégia é dose alta e intervalo longo — daí a dose única diária dos aminoglicosídeos, que maximiza o pico, aproveita o efeito pós-antibiótico e reduz a nefrotoxicidade dependente de tempo de exposição.',
      auc: 'O alvo é a **AUC₂₄/CIM**, por exemplo 400 a 600 para vancomicina em S. aureus. A estratégia é a dose diária total, com o fracionamento importando pouco.',
    }
    const nivel: Nivel = cat === 'r' ? 'critico' : cat === 'i' ? 'atencao' : 'ok'
    return {
      titulo: 'Interpretação',
      valor: cat === 's' ? 'Sensível' : cat === 'i' ? 'Sensível com exposição aumentada' : 'Resistente',
      nivel,
      detalhes,
      conduta: [
        'Leia o antibiograma como **relação entre a CIM e o ponto de corte do agente naquele sítio**, não como valor absoluto: uma CIM de 2 µg/mL pode ser sensível para um fármaco e resistente para outro. Comparar CIMs entre antimicrobianos diferentes para escolher \'o mais potente\' é um erro conceitual comum.',
        'Escolha pelo **espectro mais estreito que cubra o agente**, pela penetração no sítio e pela toxicidade — não pelo menor número. Betalactâmico é superior a vancomicina em *Staphylococcus aureus* sensível à oxacilina, mesmo com CIM maior em valor absoluto.',
        'Reconheça os **fenótipos de resistência** que mudam a conduta independentemente do que o papel diz: ESBL exige carbapenêmico em infecção grave (mesmo com cefalosporina aparentemente sensível); AmpC indutível em *Enterobacter*, *Serratia* e *Citrobacter* pode emergir durante o tratamento com cefalosporina de terceira geração; resistência induzível a clindamicina em *Staphylococcus* (teste D positivo) contraindica o fármaco mesmo com sensibilidade relatada.',
        'Use a **relação farmacodinâmica** correta para otimizar a dose: betalactâmicos são tempo-dependentes e se beneficiam de infusão estendida ou contínua e de intervalos menores; aminoglicosídeos e fluoroquinolonas são concentração-dependentes e pedem dose alta em intervalo alargado; vancomicina segue AUC/CIM.',
        'Interprete um resultado **discordante da evolução clínica** com desconfiança do resultado, não do paciente: contaminação, colonização (especialmente em urina, traqueostomia e úlceras), coleta inadequada e foco não drenado explicam a maioria dos casos. Antes de escalar o espectro, revise se há foco a controlar.',
      ],
      interpretacao: [
        cat === 's'
          ? '**S — sensível.** A probabilidade de sucesso terapêutico é alta com o esquema posológico padrão do fármaco no sítio em questão.'
          : cat === 'i'
            ? '**I — sensível com exposição aumentada.** O EUCAST redefiniu a categoria em 2019: não significa mais "zona cinzenta". Significa que o fármaco funciona **desde que** a exposição seja aumentada — dose maior, infusão estendida, ou sítio onde o fármaco se concentra naturalmente (urina, por exemplo). Usar dose padrão nesta categoria é falha previsível.'
            : '**R — resistente.** A probabilidade de falha é alta mesmo com exposição aumentada. Troque o antimicrobiano.',
        '**A CIM não mede potência entre fármacos diferentes.** Comparar a CIM de 0,5 de um beta-lactâmico com a CIM de 2 de uma quinolona não diz qual é melhor — cada fármaco tem seu próprio ponto de corte, definido pela farmacocinética, pela distribuição populacional de CIMs e pelos dados clínicos. O que importa é a posição da CIM **em relação ao corte daquele fármaco**.',
        alvos[classe] ?? alvos.tempo,
        'Dois sistemas de pontos de corte convivem: **CLSI** (americano, revisado anualmente) e **EUCAST** (europeu). Eles divergem em vários fármacos, e o Brasil tem laboratórios usando ambos — a categoria reportada pode mudar conforme o sistema adotado.',
      ],
      alertas: [
        'Alguns mecanismos de resistência não aparecem no antibiograma padrão e exigem testes específicos: beta-lactamase de espectro estendido, carbapenemase, resistência induzível a clindamicina (teste D), AmpC induzível em Enterobacter, Serratia, Citrobacter e Providencia — nestes últimos, cefalosporina de terceira geração pode falhar durante o tratamento mesmo com antibiograma sensível.',
        'Isolado em amostra respiratória, em urina de paciente sondado assintomático ou em ponta de cateter frequentemente representa colonização. Tratar colonização é uma das maiores fontes de uso desnecessário de antimicrobiano.',
      ],
    }
  },
  formula: ['CIM = menor concentração que inibe o crescimento visível após 16 a 20 h de incubação'],
  fundamento:
    'A concentração inibitória mínima é determinada por diluições sucessivas de base 2 — 0,25; 0,5; 1; 2; 4 mg/L — e por isso a resolução do método é grosseira: uma diferença de uma diluição está dentro do erro experimental. A categorização em S, I e R traduz a CIM para uma linguagem clínica, integrando a farmacocinética do fármaco no sítio de infecção e os dados de desfecho clínico disponíveis. A concentração inibitória mínima é uma medida de laboratório, e o ponto de corte que a traduz em \'sensível\' ou \'resistente\' é uma decisão clínica que incorpora farmacocinética, farmacodinâmica, penetração no sítio e dados de desfecho. Por isso comparar CIMs entre fármacos diferentes não faz sentido: cada uma é lida contra a sua própria régua. Os fenótipos de resistência (ESBL, AmpC indutível, resistência induzível a clindamicina) existem porque o mecanismo genético pode não se expressar no ensaio, mas se expressar sob pressão seletiva durante o tratamento.',
  armadilhas: [
    'CIM "baixa" não é sinônimo de melhor escolha: penetração no sítio, toxicidade, espectro e efeito ecológico pesam tanto quanto.',
    'Antibiograma de amostra contaminada leva a tratar o contaminante. Estafilococo coagulase-negativo em uma de duas hemoculturas é quase sempre contaminação de pele.',
  ],
  referencias: [
    { texto: 'EUCAST. New definitions of S, I and R from 2019. European Committee on Antimicrobial Susceptibility Testing.' },
    { texto: 'CLSI. Performance Standards for Antimicrobial Susceptibility Testing. 34ª ed. M100. 2024.' },
  ],
}

const vacinal: Ferramenta = {
  id: 'calendario-vacinal',
  nome: 'Calendário vacinal por idade',
  sinonimos: ['vacina', 'vacinacao', 'calendario vacinal', 'imunizacao', 'pni'],
  resumo: 'Mostra as vacinas previstas pelo Programa Nacional de Imunizações para cada faixa etária.',
  categorias: ['infectologia', 'pediatria'],
  campos: [
    campoOpc('faixa', 'Faixa etária', [
      { valor: 'rn', rotulo: 'Ao nascer' },
      { valor: '2m', rotulo: '2 meses' },
      { valor: '3m', rotulo: '3 meses' },
      { valor: '4m', rotulo: '4 meses' },
      { valor: '5m', rotulo: '5 meses' },
      { valor: '6m', rotulo: '6 meses' },
      { valor: '9m', rotulo: '9 meses' },
      { valor: '12m', rotulo: '12 meses' },
      { valor: '15m', rotulo: '15 meses' },
      { valor: '4a', rotulo: '4 anos' },
      { valor: 'adolescente', rotulo: 'Adolescente (9 a 19 anos)' },
      { valor: 'adulto', rotulo: 'Adulto (20 a 59 anos)' },
      { valor: 'idoso', rotulo: 'Idoso (60 anos ou mais)' },
      { valor: 'gestante', rotulo: 'Gestante' },
    ]),
  ],
  calcular: (v) => {
    const faixa = opc(v, 'faixa')
    const cal: Record<string, string[][]> = {
      rn: [['BCG', 'Dose única, intradérmica no deltoide direito'], ['Hepatite B', 'Preferencialmente nas primeiras 12 a 24 horas de vida']],
      '2m': [['Pentavalente (DTP + Hib + hepatite B)', '1ª dose'], ['VIP (poliomielite inativada)', '1ª dose'], ['Pneumocócica 10-valente', '1ª dose'], ['Rotavírus humano', '1ª dose — janela rígida: até 3 meses e 15 dias']],
      '3m': [['Meningocócica C conjugada', '1ª dose']],
      '4m': [['Pentavalente', '2ª dose'], ['VIP', '2ª dose'], ['Pneumocócica 10-valente', '2ª dose'], ['Rotavírus humano', '2ª dose — até 7 meses e 29 dias']],
      '5m': [['Meningocócica C conjugada', '2ª dose']],
      '6m': [['Pentavalente', '3ª dose'], ['VIP', '3ª dose'], ['Influenza', 'Anual, 2 doses na primovacinação até 8 anos'], ['Covid-19', 'Conforme esquema vigente']],
      '9m': [['Febre amarela', '1ª dose']],
      '12m': [['Tríplice viral (sarampo, caxumba, rubéola)', '1ª dose'], ['Pneumocócica 10-valente', 'Reforço'], ['Meningocócica C', 'Reforço']],
      '15m': [['DTP', '1º reforço'], ['VOP', '1º reforço'], ['Hepatite A', 'Dose única'], ['Tetraviral (tríplice viral + varicela)', 'Dose única']],
      '4a': [['DTP', '2º reforço'], ['VOP', '2º reforço'], ['Varicela', '2ª dose'], ['Febre amarela', 'Reforço']],
      adolescente: [['HPV quadrivalente', 'Dose única de 9 a 14 anos (esquema atualizado); imunossuprimidos e vivendo com HIV, 3 doses'], ['Meningocócica ACWY', '11 a 14 anos, dose única'], ['dT (dupla adulto)', 'Reforço a cada 10 anos'], ['Hepatite B', 'Completar esquema se não vacinado'], ['Tríplice viral', '2 doses até 29 anos']],
      adulto: [['dT', 'Reforço a cada 10 anos'], ['Hepatite B', '3 doses para não vacinados, em qualquer idade'], ['Tríplice viral', '2 doses até 29 anos; 1 dose de 30 a 59 anos'], ['Febre amarela', 'Dose única para residentes ou viajantes de área com recomendação'], ['Influenza', 'Anual para grupos prioritários']],
      idoso: [['Influenza', 'Anual'], ['Pneumocócica 23-valente', 'Para institucionalizados e grupos de risco; 2ª dose 5 anos após'], ['dT', 'Reforço a cada 10 anos'], ['Covid-19', 'Conforme esquema vigente'], ['Herpes-zóster', 'Disponível na rede privada; recombinante em 2 doses']],
      gestante: [['dTpa', '**A partir da 20ª semana, a cada gestação** — protege o recém-nascido contra coqueluche por transferência de anticorpos'], ['Hepatite B', 'Se esquema incompleto'], ['Influenza', 'Em qualquer idade gestacional'], ['Covid-19', 'Conforme esquema vigente'], ['Contraindicadas', 'Vacinas de vírus vivo atenuado: tríplice viral, varicela, febre amarela (avaliar risco-benefício em área de surto)']],
    }
    const lista = cal[faixa] ?? []
    return {
      titulo: 'Vacinas previstas',
      valor: String(lista.length),
      unidade: lista.length === 1 ? 'vacina' : 'vacinas',
      nivel: 'neutro',
      detalhes: lista.map(([nome, obs]) => ({ rotulo: nome, valor: obs })),
      conduta: [
        'Aplique a regra que resolve a maior parte dos atrasos: **intervalo mínimo respeitado, esquema nunca reiniciado**. Doses aplicadas com intervalo maior que o recomendado continuam válidas; só há necessidade de reinício em situações excepcionais, como a vacina oral contra febre tifoide.',
        'Aproveite **toda oportunidade de contato** para vacinar, inclusive durante consultas por doença leve. Febre baixa, resfriado, uso de antibiótico, prematuridade, amamentação e desnutrição **não** são contraindicações — as falsas contraindicações respondem por boa parte da cobertura perdida.',
        'As contraindicações **verdadeiras** são poucas: anafilaxia a dose anterior ou a componente da vacina, e vacinas de vírus vivo atenuado (tríplice viral, varicela, febre amarela, rotavírus, BCG) em imunossupressão significativa e na gestação. Em imunossupressão planejada, vacine com vivos pelo menos 4 semanas antes de iniciar.',
        'Não perca as vacinas **do adulto e do idoso**, sistematicamente esquecidas: dupla adulto a cada 10 anos (e dTpa em cada gestação, entre 20 e 36 semanas, para proteger o lactente por transferência de anticorpos), influenza anual, pneumocócica conforme faixa e comorbidade, herpes-zóster a partir dos 50 anos e hepatite B em não vacinados.',
        'Em **situações especiais**, consulte os centros de referência para imunobiológicos especiais: asplenia (pneumococo, meningococo, *Haemophilus*), transplante, HIV conforme contagem de CD4, doença renal crônica, uso de imunobiológicos e viagem internacional. Esses pacientes têm esquemas próprios e frequentemente precisam de doses adicionais e de sorologia pós-vacinal.',
      ],
      interpretacao: [
        '**Oportunidade perdida é o principal inimigo da cobertura vacinal.** Toda consulta, de qualquer natureza, é oportunidade de conferir a caderneta. Doença leve com ou sem febre, uso de antibiótico, prematuridade, desnutrição e amamentação **não** contraindicam vacinação.',
        'Esquema atrasado não recomeça: retome de onde parou, respeitando os intervalos mínimos. As únicas vacinas com janela rígida de idade são as de rotavírus, pela associação com invaginação intestinal fora da faixa.',
        'Contraindicações verdadeiras são poucas: anafilaxia a dose anterior ou a componente da vacina, e vacinas de vírus vivo atenuado em imunossupressão significativa e na gestação.',
      ],
      alertas: ['O calendário do Programa Nacional de Imunizações é atualizado com frequência. Confirme sempre a versão vigente no site do Ministério da Saúde e as normas da vigilância epidemiológica local antes de aprazar.'],
      tabela: { titulo: 'Esquema da faixa', colunas: ['Vacina', 'Esquema'], linhas: lista },
    }
  },
  formula: [],
  fundamento:
    'O calendário brasileiro é dos mais completos do mundo em oferta pública. Sua arquitetura segue duas lógicas: proteger o quanto antes contra as doenças cuja letalidade é maior no primeiro ano (coqueluche, meningite, pneumococo) e aproveitar janelas imunológicas em que a resposta é melhor (HPV antes da exposição, dTpa na gestação para transferência transplacentária). A ordem e os intervalos do calendário não são convenção administrativa: derivam da **maturação do sistema imune** e da interferência de anticorpos maternos transferidos pela placenta, que neutralizam antígenos vivos nos primeiros meses. Vacinas polissacarídicas puras não funcionam antes dos 2 anos porque a resposta a polissacarídeos é timo-independente e imatura — daí a conjugação com proteína carreadora, que recruta linfócitos T, gera memória e permite proteger lactentes.',
  armadilhas: [
    'Prematuros seguem a **idade cronológica**, não a corrigida, para vacinação — com exceções específicas de dose e de esquema para hepatite B e BCG conforme peso.',
    'Imunossuprimidos, transplantados, asplênicos e pessoas vivendo com HIV têm calendários especiais, disponíveis nos Centros de Referência para Imunobiológicos Especiais.',
  ],
  referencias: [
    { texto: 'Ministério da Saúde. Calendário Nacional de Vacinação. Programa Nacional de Imunizações, atualização vigente.' },
    { texto: 'Sociedade Brasileira de Pediatria / Sociedade Brasileira de Imunizações. Calendários de vacinação, edições anuais.' },
  ],
}

const ppe: Ferramenta = {
  id: 'profilaxia-pos-exposicao',
  nome: 'Profilaxia pós-exposição',
  sinonimos: ['ppe', 'pep', 'acidente perfurocortante', 'exposicao hiv', 'raiva', 'tetano'],
  resumo: 'Conduta imediata após exposição a HIV, hepatites, raiva e ferimento tetanogênico.',
  categorias: ['infectologia', 'emergencia'],
  campos: [
    campoOpc('tipo', 'Tipo de exposição', [
      { valor: 'hiv', rotulo: 'HIV e hepatites (ocupacional ou sexual)' },
      { valor: 'raiva', rotulo: 'Raiva (mordedura, arranhadura, lambedura)' },
      { valor: 'tetano', rotulo: 'Ferimento com risco de tétano' },
    ]),
    campoNum('horas', 'Horas desde a exposição', { unidade: 'h', min: 0, max: 400, passo: 1 }),
  ],
  calcular: (v) => {
    const tipo = opc(v, 'tipo')
    const horas = num(v, 'horas')
    if (horas === null) return null
    let linhas: string[][] = []
    let janela = ''
    let nivel: Nivel = 'atencao'
    if (tipo === 'hiv') {
      janela = horas <= 2 ? 'Janela ideal (até 2 h)' : horas <= 72 ? 'Dentro da janela (até 72 h)' : 'Fora da janela para profilaxia de HIV'
      nivel = horas <= 72 ? 'alerta' : 'critico'
      linhas = [
        ['Prazo', 'Iniciar o quanto antes, idealmente em até 2 h; **limite de 72 h**. Após esse prazo, a profilaxia não está indicada'],
        ['Esquema preferencial (adulto)', 'Tenofovir + lamivudina + dolutegravir, por 28 dias'],
        ['Testagem', 'Teste rápido da pessoa exposta e da fonte, quando disponível. Fonte com carga viral indetectável há mais de 6 meses dispensa profilaxia em exposição sexual'],
        ['Hepatite B', 'Se a pessoa exposta não for vacinada ou não tiver anti-HBs ≥ 10 mUI/mL: imunoglobulina hiperimune (até 7 dias na ocupacional, 14 dias na sexual) mais início do esquema vacinal'],
        ['Hepatite C', 'Não há profilaxia. Acompanhamento sorológico e detecção precoce de infecção aguda, que hoje tem tratamento com resposta virológica sustentada acima de 95%'],
        ['Seguimento', 'Sorologias em 30 e 90 dias. Orientar sexo seguro e não doar sangue durante o período'],
        ['Nunca fazer', 'Espremer o ferimento ou usar substâncias cáusticas. Lavar com água e sabão; mucosa, com soro fisiológico'],
      ]
    } else if (tipo === 'raiva') {
      janela = 'Não há prazo limite — a profilaxia é indicada mesmo semanas após a exposição'
      nivel = 'critico'
      linhas = [
        ['Contato indireto', 'Lavar com água e sabão. Não vacinar'],
        ['Acidente leve', 'Arranhadura, mordedura ou lambedura superficial em tronco e membros: esquema vacinal de 4 doses (dias 0, 3, 7 e 14)'],
        ['Acidente grave', 'Ferimento em cabeça, face, pescoço, mão, polpa digital ou planta do pé; ferimento profundo, múltiplo ou extenso; lambedura de mucosa; qualquer contato com morcego: **soro antirrábico + vacina**'],
        ['Soro', 'Imunoglobulina humana 20 UI/kg ou soro heterólogo 40 UI/kg, infiltrando o máximo possível ao redor da lesão'],
        ['Cão ou gato observável', 'Se o animal estiver sadio e puder ser observado por 10 dias, é possível adiar ou suspender o esquema conforme protocolo'],
        ['Morcego', 'Qualquer contato com morcego, mesmo sem ferimento aparente, é considerado acidente grave'],
      ]
    } else {
      janela = 'Avaliar sempre no atendimento inicial'
      nivel = 'alerta'
      linhas = [
        ['Ferimento limpo e superficial', 'Vacina apenas se esquema incompleto ou última dose há mais de 10 anos'],
        ['Ferimento sujo, profundo ou com tecido desvitalizado', 'Vacina se última dose há mais de 5 anos'],
        ['Esquema desconhecido ou < 3 doses, ferimento de risco', '**Vacina + imunoglobulina antitetânica** (250 a 500 UI) ou soro antitetânico (5.000 UI)'],
        ['Imunossuprimidos', 'Considerar imunoglobulina independentemente do esquema vacinal em ferimento de risco'],
        ['Limpeza', 'Desbridamento e limpeza são parte essencial da profilaxia — o C. tetani é anaeróbio estrito'],
      ]
    }
    return {
      titulo: 'Conduta de profilaxia',
      valor: janela,
      nivel,
      rotuloNivel: `${fmtInt(horas)} h desde a exposição`,
      detalhes: [],
      conduta: [
        'Na exposição ao **HIV**, inicie a profilaxia em **até 2 horas** e no máximo 72 h — depois disso a eficácia é nula. O esquema preferencial é **tenofovir + lamivudina + dolutegravir por 28 dias**. Colha teste rápido do exposto antes de iniciar (mas não espere o resultado para a primeira dose) e do caso-fonte, se disponível: fonte com carga viral indetectável dispensa a profilaxia.',
        'Na exposição à **hepatite B**, a conduta depende do estado vacinal e sorológico: não vacinado ou não respondedor recebe **imunoglobulina hiperimune (HBIG) em até 7 dias (idealmente 24 h) mais início ou complemento do esquema vacinal**. Respondedor documentado (anti-HBs ≥ 10 mUI/mL) não precisa de nada.',
        'Para **hepatite C não há profilaxia**. A conduta é vigilância: RNA viral em 4 a 6 semanas e sorologia em 3 a 6 meses. Se houver infecção aguda, o tratamento com antivirais de ação direta tem taxa de cura acima de 95% — o valor da vigilância é justamente permitir o tratamento precoce.',
        'Na exposição à **raiva**, classifique o acidente: lambedura em pele íntegra dispensa conduta; arranhadura ou lambedura em pele lesada indica vacina; mordedura, ferimento profundo, múltiplo ou em cabeça, pescoço e mãos, e qualquer contato com morcego indicam **vacina mais soro (ou imunoglobulina) infiltrado no local do ferimento**. Lave a ferida abundantemente com água e sabão — essa medida simples reduz substancialmente o risco.',
        'Registre o acidente como **acidente de trabalho (CAT)** quando ocupacional, agende o seguimento sorológico (HIV em 30 e 90 dias; hepatites conforme o protocolo) e oriente medidas de barreira e não doação de sangue durante o período de janela. Aproveite para revisar tétano e para discutir **profilaxia pré-exposição** quando a exposição de risco for recorrente.',
      ],
      interpretacao: [
        tipo === 'hiv'
          ? 'A profilaxia pós-exposição ao HIV reduz substancialmente o risco de soroconversão, e a eficácia cai rapidamente com o tempo — cada hora conta. Não espere resultado de exame para iniciar: comece e reavalie.'
          : tipo === 'raiva'
            ? 'A raiva humana tem letalidade praticamente de 100% depois de instalada. Não existe "tarde demais" para iniciar a profilaxia enquanto não houver sintomas, e a decisão deve ser sempre a favor de profilaxar quando há dúvida.'
            : 'O tétano é integralmente prevenível e sua letalidade permanece alta. A avaliação combina duas perguntas: como é o ferimento e qual é o estado vacinal.',
        'Registre no prontuário o horário da exposição, o mecanismo, o material biológico envolvido, a conduta e as orientações. Comunique ao serviço de saúde ocupacional em acidente de trabalho e notifique conforme a vigilância epidemiológica.',
      ],
      tabela: { titulo: 'Conduta', colunas: ['Situação', 'Recomendação'], linhas },
      alertas: ['Protocolos de profilaxia são atualizados com frequência. Confirme sempre no Protocolo Clínico e Diretrizes Terapêuticas vigente do Ministério da Saúde e nas normas locais.'],
    }
  },
  formula: [],
  fundamento:
    'Toda profilaxia pós-exposição explora a mesma janela biológica: o intervalo entre a inoculação do agente e o estabelecimento da infecção sistêmica. Para o HIV, esse intervalo é de horas a poucos dias, e a profilaxia atua impedindo a infecção das primeiras células e a disseminação para linfonodos. Para a raiva, o período de incubação longo permite que a vacinação ativa alcance o vírus antes de ele chegar ao sistema nervoso central.',
  armadilhas: [
    'A profilaxia para HIV não é indicada em exposições de risco desprezível: contato com pele íntegra, com fluido sem sangue visível como saliva, urina, suor e lágrima.',
    'Não confunda imunoglobulina (proteção passiva, imediata e transitória) com vacina (proteção ativa, que demora a se estabelecer). Nas exposições graves, ambas são necessárias — e devem ser aplicadas em sítios anatômicos diferentes.',
  ],
  referencias: [
    { texto: 'Ministério da Saúde. Protocolo Clínico e Diretrizes Terapêuticas para Profilaxia Pós-Exposição de Risco à Infecção pelo HIV, IST e Hepatites Virais. Edição vigente.' },
    { texto: 'Ministério da Saúde. Normas Técnicas de Profilaxia da Raiva Humana. Edição vigente.' },
  ],
}

const interacoes: Ferramenta = {
  id: 'interacoes-antimicrobianos',
  nome: 'Interações relevantes de antimicrobianos',
  sinonimos: ['interacao antibiotico', 'interacoes medicamentosas', 'cyp450 antibiotico'],
  resumo: 'As interações que realmente mudam conduta, organizadas por antimicrobiano.',
  categorias: ['infectologia', 'farmacologia'],
  campos: [
    campoOpc('farmaco', 'Antimicrobiano', [
      { valor: 'rifampicina', rotulo: 'Rifampicina' },
      { valor: 'macrolideos', rotulo: 'Macrolídeos (claritromicina, eritromicina, azitromicina)' },
      { valor: 'azolicos', rotulo: 'Azólicos (fluconazol, itraconazol, voriconazol)' },
      { valor: 'linezolida', rotulo: 'Linezolida' },
      { valor: 'quinolonas', rotulo: 'Quinolonas' },
      { valor: 'metronidazol', rotulo: 'Metronidazol' },
      { valor: 'sulfa', rotulo: 'Sulfametoxazol-trimetoprima' },
      { valor: 'aminoglicosideos', rotulo: 'Aminoglicosídeos' },
    ]),
  ],
  calcular: (v) => {
    const f = opc(v, 'farmaco')
    const dados: Record<string, { mecanismo: string; linhas: string[][] }> = {
      rifampicina: {
        mecanismo: 'Indutor potente de CYP3A4, CYP2C9, CYP2C19 e da glicoproteína P — talvez o indutor enzimático mais forte da farmacopeia.',
        linhas: [
          ['Anticoncepcionais hormonais', 'Falha contraceptiva. Método adicional obrigatório durante e por 4 semanas após'],
          ['Varfarina', 'Queda acentuada do INR; pode exigir dobrar a dose e monitorização semanal'],
          ['Antirretrovirais', 'Inibidores de protease contraindicados; dolutegravir exige dobrar a dose para 50 mg 12/12 h'],
          ['Inibidores de calcineurina', 'Queda drástica de tacrolimo e ciclosporina — risco de rejeição de enxerto'],
          ['Corticoides', 'Reduz a exposição pela metade; dobrar a dose em insuficiência adrenal'],
          ['Anticoagulantes orais diretos', 'Redução relevante da exposição — associação a evitar'],
        ],
      },
      macrolideos: {
        mecanismo: 'Claritromicina e eritromicina são inibidores potentes de CYP3A4 e prolongam o QT. Azitromicina praticamente não inibe CYP, mas também prolonga o QT.',
        linhas: [
          ['Estatinas', 'Sinvastatina e lovastatina: risco alto de rabdomiólise. Suspender durante o tratamento ou trocar por pravastatina/rosuvastatina'],
          ['Colchicina', 'Toxicidade grave, potencialmente fatal, sobretudo com doença renal'],
          ['Varfarina', 'Aumento do INR — monitorização mais frequente'],
          ['Fármacos que prolongam o QT', 'Efeito aditivo com antiarrítmicos, antipsicóticos, ondansetrona, metadona, quinolonas'],
          ['Inibidores de calcineurina', 'Elevação de tacrolimo e ciclosporina, com nefrotoxicidade'],
        ],
      },
      azolicos: {
        mecanismo: 'Inibição de CYP3A4 (potente com itraconazol, voriconazol e posaconazol; moderada com fluconazol em dose alta) e de CYP2C9.',
        linhas: [
          ['Estatinas', 'Risco de miopatia — mesma lógica dos macrolídeos'],
          ['Varfarina', 'Elevação importante do INR, sobretudo com fluconazol, por inibição de CYP2C9'],
          ['Inibidores de calcineurina', 'Elevação de níveis; reduzir dose preventivamente e monitorizar'],
          ['Inibidores da bomba de prótons', 'Reduzem a absorção do itraconazol em cápsula (que exige acidez). A solução oral não sofre esse efeito'],
          ['Anticoagulantes orais diretos', 'Elevação da exposição, com risco de sangramento'],
        ],
      },
      linezolida: {
        mecanismo: 'Inibidor reversível não seletivo da monoaminoxidase.',
        linhas: [
          ['Antidepressivos serotoninérgicos', 'Risco de síndrome serotoninérgica com inibidores seletivos de recaptação de serotonina, venlafaxina, duloxetina, tramadol, triptanos'],
          ['Simpaticomiméticos', 'Crise hipertensiva com pseudoefedrina, dopamina, adrenalina — reduzir a dose inicial de vasopressor'],
          ['Alimentos ricos em tiramina', 'Queijos curados, embutidos, chucrute, cerveja artesanal — evitar'],
          ['Mielotoxicidade', 'Trombocitopenia e anemia a partir de 10 a 14 dias; hemograma semanal'],
        ],
      },
      quinolonas: {
        mecanismo: 'Quelação por cátions divalentes; prolongamento do QT; inibição de CYP1A2 (ciprofloxacino).',
        linhas: [
          ['Cátions divalentes', 'Antiácidos, cálcio, ferro, zinco, magnésio, sucralfato e laticínios reduzem drasticamente a absorção. Espaçar 2 h antes ou 6 h depois'],
          ['Teofilina e cafeína', 'Ciprofloxacino inibe CYP1A2 e eleva os níveis — risco de convulsão'],
          ['Varfarina', 'Elevação do INR'],
          ['Corticoides', 'Efeito aditivo no risco de tendinopatia e ruptura de tendão, sobretudo em idosos'],
          ['Fármacos que prolongam o QT', 'Efeito aditivo'],
        ],
      },
      metronidazol: {
        mecanismo: 'Inibição da aldeído desidrogenase e de CYP2C9.',
        linhas: [
          ['Álcool', 'Reação tipo dissulfiram: rubor, náusea, vômito, cefaleia, taquicardia. Evitar durante e por 3 dias após (a evidência para essa recomendação é fraca, mas ela permanece padrão)'],
          ['Varfarina', 'Elevação significativa do INR'],
          ['Lítio', 'Elevação dos níveis, com risco de toxicidade'],
          ['Dissulfiram', 'Psicose aguda quando associados'],
        ],
      },
      sulfa: {
        mecanismo: 'Inibição de CYP2C9, competição pela secreção tubular de creatinina e efeito antifolato.',
        linhas: [
          ['Varfarina', 'Uma das interações mais perigosas da clínica: elevação acentuada do INR com risco de sangramento maior'],
          ['Inibidores da ECA, bloqueadores do receptor de angiotensina, espironolactona', 'Hipercalemia grave, sobretudo em idosos — associação relacionada a morte súbita em estudos de base populacional'],
          ['Metotrexato', 'Toxicidade hematológica grave por deslocamento proteico e efeito antifolato somado'],
          ['Creatinina', 'Elevação de até 0,4 mg/dL por bloqueio da secreção tubular, **sem** queda da filtração real'],
          ['Sulfonilureias', 'Hipoglicemia'],
        ],
      },
      aminoglicosideos: {
        mecanismo: 'Nefrotoxicidade e ototoxicidade aditivas; bloqueio neuromuscular.',
        linhas: [
          ['Outros nefrotóxicos', 'Anfotericina B, vancomicina, contraste iodado, anti-inflamatórios, cisplatina — risco somado'],
          ['Diuréticos de alça', 'Ototoxicidade aditiva, com perda auditiva potencialmente irreversível'],
          ['Bloqueadores neuromusculares', 'Prolongamento do bloqueio; cuidado em miastenia gravis'],
          ['Monitorização', 'Nível sérico e creatinina obrigatórios a partir de 48 a 72 h de uso'],
        ],
      },
    }
    const d = dados[f]
    return {
      titulo: 'Mecanismo',
      valor: d.mecanismo,
      nivel: 'atencao',
      detalhes: [],
      conduta: [
        'Antes de prescrever, verifique as interações de maior impacto clínico: **rifampicina** é indutora potente do citocromo P450 3A4 e derruba a concentração de anticoncepcionais, anticoagulantes orais diretos, inibidores de protease, tacrolimo, ciclosporina, corticoides e metadona — a falha terapêutica resultante é silenciosa até virar evento.',
        'Cuidado com os **inibidores enzimáticos**: macrolídeos (claritromicina e eritromicina, não a azitromicina) e azólicos (fluconazol, voriconazol, itraconazol) elevam a concentração de estatinas (risco de rabdomiólise), de anticoagulantes diretos, de tacrolimo e de amiodarona. A dupla claritromicina com sinvastatina é contraindicação formal.',
        'Some o risco de **prolongamento do QT**: fluoroquinolonas, macrolídeos e azólicos somam-se a antiarrítmicos, antipsicóticos, antidepressivos, ondansetrona e metadona. Em paciente com QTc já limítrofe, faça ECG antes e durante, e corrija potássio e magnésio.',
        'Atenção às interações com **varfarina**, que é afetada por quase todos os antimicrobianos, por inibição enzimática ou por redução da flora produtora de vitamina K. Sulfametoxazol-trimetoprima, metronidazol e fluconazol são os mais perigosos: antecipe o INR para 3 a 5 dias após o início e ajuste a dose preventivamente.',
        'Lembre das interações **não enzimáticas**, frequentemente esquecidas: quinolonas e tetraciclinas quelam com cálcio, ferro, magnésio, zinco e antiácidos, perdendo grande parte da absorção — separe em 2 h antes ou 4–6 h depois. **Linezolida** é inibidor da monoamina oxidase e pode causar síndrome serotoninérgica com antidepressivos. E **sulfametoxazol-trimetoprima** eleva potássio e creatinina (esta por bloqueio da secreção tubular, sem queda real da filtração), o que é lido erroneamente como lesão renal.',
      ],
      interpretacao: [
        'A maioria das interações clinicamente relevantes de antimicrobianos passa por dois mecanismos: modulação do citocromo P450 (sobretudo CYP3A4) e efeito farmacodinâmico aditivo (prolongamento do QT, nefrotoxicidade, hipercalemia).',
        '**Indutores** — rifampicina é o arquétipo — reduzem a concentração dos fármacos que metabolizam, com risco de falha terapêutica. O efeito demora dias a se instalar e dias a desaparecer após a suspensão, o que gera toxicidade tardia quando a dose foi aumentada e o indutor é retirado.',
        '**Inibidores** — macrolídeos e azólicos — elevam a concentração, com risco de toxicidade. O efeito é rápido, praticamente imediato.',
      ],
      tabela: { titulo: 'Interações relevantes', colunas: ['Com', 'Consequência e conduta'], linhas: d.linhas },
      alertas: ['Esta é uma lista das interações de maior impacto, não exaustiva. Verifique sempre a lista completa de medicamentos do paciente em base de dados de interações antes de prescrever.'],
    }
  },
  formula: [],
  fundamento:
    'A relevância clínica de uma interação depende de três fatores: a magnitude da alteração farmacocinética, a janela terapêutica do fármaco afetado e a gravidade do desfecho. Rifampicina com varfarina é grave porque reúne os três — indução potente, janela estreita e desfecho trombótico. Já muitas interações listadas em bula têm magnitude pequena e janela larga, e não mudam conduta. Os antimicrobianos concentram interações por três razões estruturais: muitos são **substratos, indutores ou inibidores potentes do citocromo P450** (rifampicina como indutora clássica, azólicos e macrolídeos como inibidores); vários alteram a **flora intestinal produtora de vitamina K**, desestabilizando a varfarina; e alguns interferem em alvos fisiológicos compartilhados — prolongamento do QT por bloqueio de canais de potássio hERG, inibição da monoamina oxidase pela linezolida, e bloqueio da secreção tubular de creatinina pelo trimetoprima.',
  armadilhas: [
    'Interações com fitoterápicos são subnotificadas. Erva-de-são-joão é indutor potente de CYP3A4 e reduz a eficácia de antirretrovirais, imunossupressores e anticoncepcionais.',
    'A suspensão de um indutor exige reavaliação de dose com a mesma atenção que a introdução.',
  ],
  referencias: [
    { texto: 'Pea F, Viale P. The antimicrobial therapy puzzle: could pharmacokinetic-pharmacodynamic relationships be helpful? Clin Infect Dis. 2006;42(12):1764-1771.' },
    { texto: 'Fralick M, Macdonald EM, Gomes T, et al. Co-trimoxazole and sudden death in patients receiving inhibitors of renin-angiotensin system. BMJ. 2014;349:g6196.' },
  ],
}

export const ferramentas: Ferramenta[] = [
  qsofa,
  sofa,
  sirs,
  news2,
  mews,
  sepse,
  centor,
  mcisaac,
  meningite,
  vancomicina,
  conversorAtb,
  antibiograma,
  vacinal,
  ppe,
  interacoes,
]

export default ferramentas
