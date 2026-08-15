import type { Marcador } from '../tipos'

/**
 * Marcadores inflamatórios.
 *
 * Todos respondem à mesma via — IL-6 age no hepatócito e muda o repertório de
 * proteínas produzidas — e mesmo assim informam coisas diferentes, porque têm
 * cinéticas diferentes. PCR sobe em horas e cai em dias; VHS sobe em dias e
 * cai em semanas; a procalcitonina discrimina infecção bacteriana melhor que
 * as duas. Discordância entre eles não é erro de laboratório: é a linha do
 * tempo da inflamação sendo lida por três relógios distintos.
 */
export const marcadores: Marcador[] = [
  {
    id: 'pcr',
    nome: 'Proteína C reativa',
    sigla: 'PCR',
    sinonimos: ['proteina c reativa', 'crp', 'pcr quantitativa'],
    grupo: 'inflamatorio',
    sistemas: ['infeccioso', 'imunologico'],
    material: 'Soro',
    unidade: 'mg/L',
    referencias: [
      { rotulo: 'Adultos', texto: '< 5', unidade: 'mg/L' },
      { rotulo: 'Inflamação leve a moderada', texto: '10 a 100', unidade: 'mg/L' },
      { rotulo: 'Inflamação intensa', texto: '> 100', unidade: 'mg/L', observacao: 'Valores acima de 100 mg/L favorecem infecção bacteriana, mas não a provam — vasculites e neoplasias também alcançam esses níveis.' },
    ],
    resumo:
      'A proteína de fase aguda mais usada. Sobe rápido, cai rápido e por isso é o melhor marcador para acompanhar a evolução de um processo inflamatório em dias.',
    entenda:
      'A PCR é sintetizada pelo hepatócito em resposta à IL-6 e opsoniza patógenos e células apoptóticas, ativando a via clássica do complemento. Sua utilidade clínica vem da cinética: começa a subir em 6 horas, duplica a cada 8 horas, atinge o pico em 48 horas e cai com meia-vida de 19 horas — logo, acompanha praticamente em tempo real o que está acontecendo. Uma PCR que cai é a evidência mais precoce de que o tratamento está funcionando; uma que não cai obriga a reavaliar foco, agente ou diagnóstico.',
    aprofundar: [
      'A PCR não distingue infecção de inflamação estéril, e essa é sua limitação central. Infarto, pancreatite, trauma, pós-operatório, doenças reumatológicas, neoplasias e crise vaso-oclusiva elevam a PCR sem nenhuma bactéria envolvida. Também há infecções que a elevam pouco — muitas viroses e infecções localizadas. Por isso a decisão de antibiótico não se toma pela PCR, mas a decisão de manter, escalonar ou suspender pode legitimamente considerar a tendência dela.',
      'A PCR ultrassensível mede a mesma proteína, com sensibilidade analítica maior, para uso em uma pergunta completamente diferente: estratificação de risco cardiovascular. Nesse contexto, valores de 1, 2 e 3 mg/L separam risco baixo, intermediário e alto, refletindo inflamação vascular de baixo grau. Usar o exame ultrassensível para investigar infecção é desperdício, e usar a PCR convencional para risco cardiovascular não tem a resolução necessária.',
    ],
    fisiologia: {
      oQueE: 'Proteína pentamérica da família das pentraxinas, reagente de fase aguda positivo.',
      origem: 'Hepatócito, sob estímulo de IL-6 (e, em menor grau, IL-1 e TNF).',
      funcao: 'Ligar-se à fosfocolina de superfícies bacterianas e de células apoptóticas, opsonizando-as e ativando a via clássica do complemento.',
      meiaVida: 'Cerca de 19 horas — constante, independentemente da causa. É a produção que varia.',
      orgaosEnvolvidos: ['Fígado'],
      percurso: ['Estímulo inflamatório', 'macrófagos liberam IL-6', 'hepatócito sintetiza PCR', 'PCR plasmática ↑ em 6 a 8 horas'],
    },
    aumento: {
      resumo: 'Qualquer inflamação: infecção, trauma, necrose, doença autoimune, neoplasia, cirurgia.',
      mecanismos: [
        {
          titulo: 'Resposta de fase aguda',
          explicacao: 'A IL-6 liberada no sítio inflamatório chega ao fígado e reprograma a síntese proteica hepática.',
          exemplos: [
            { causa: 'Infecção bacteriana', etapas: ['reconhecimento de padrões microbianos', 'IL-6 ↑', 'síntese hepática de PCR ↑', 'PCR ↑ em 6 a 8 horas'], nota: 'Costuma elevar-se mais que nas viroses, mas há sobreposição suficiente para não decidir sozinha.' },
            { causa: 'Doenças reumatológicas (artrite reumatoide, vasculites, arterite de células gigantes)', etapas: ['inflamação sistêmica crônica', 'PCR ↑ persistente'], nota: 'No lúpus, a PCR costuma ser desproporcionalmente baixa em atividade — PCR alta em lúpus sugere infecção associada.' },
            { causa: 'Necrose tecidual (infarto, pancreatite, trauma, pós-operatório)', etapas: ['inflamação estéril', 'IL-6 ↑', 'PCR ↑'], nota: 'No pós-operatório, o pico fisiológico ocorre no 2º ao 3º dia — não cair depois disso sugere complicação.' },
            { causa: 'Neoplasias', etapas: ['produção tumoral de citocinas', 'PCR ↑ com marcador prognóstico adverso'] },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Infecções', 'Pós-operatório', 'Doenças inflamatórias crônicas'],
        comuns: ['Trauma', 'Infarto', 'Obesidade (elevação discreta)'],
        menosComuns: ['Vasculites', 'Neoplasias'],
        naoEsquecer: ['PCR alta em lúpus deve sugerir infecção, não atividade da doença'],
        emergencias: ['Sepse', 'Abscesso não drenado'],
      },
    },
    reducao: { resumo: 'Não há hipoproteinemia C reativa relevante. Valores baixos são o esperado.', mecanismos: [] },
    relacionados: [
      { titulo: 'Comparar cinéticas', ids: ['vhs', 'procalcitonina'], leitura: 'PCR sobe e cai em dias; VHS, em semanas; a procalcitonina discrimina melhor infecção bacteriana. PCR normal com VHS alto sugere processo em resolução, gamopatia ou anemia.' },
      { titulo: 'No paciente séptico', ids: ['lactato', 'leucocitos', 'procalcitonina'], leitura: 'Lactato mede perfusão e prediz mortalidade; PCR e procalcitonina medem a resposta inflamatória. Não substituem um ao outro.' },
    ],
    interferentes: {
      fisiologico: ['Obesidade, tabagismo, gestação e uso de estrogênios elevam discretamente.'],
      medicamentos: ['Corticoides, anti-inflamatórios e imunobiológicos (sobretudo anti-IL-6) reduzem — o tocilizumabe zera a PCR mesmo em infecção ativa, e essa é uma armadilha clínica importante.'],
    },
    cinetica: {
      inicio: '6 a 8 horas após o estímulo.',
      pico: '48 horas.',
      normalizacao: 'Meia-vida de 19 horas: cai pela metade a cada dia após a resolução da causa.',
      tendencia: 'A tendência entre dosagens vale mais que o valor: PCR que não cai em 48 a 72 horas de antibiótico adequado sugere foco não drenado, agente resistente ou diagnóstico errado.',
    },
    normalizacao: [
      { cenario: 'Infecção tratada', caminho: 'Controlar o foco. A PCR cai por si — não existe tratamento da PCR.', prazo: 'Queda visível em 48 horas; normalização em 5 a 7 dias.' },
      { cenario: 'Elevação crônica leve', caminho: 'Investigar inflamação de baixo grau: obesidade, tabagismo, doença periodontal, doença inflamatória. Perda de peso e cessação do tabagismo reduzem.', prazo: 'Meses.' },
    ],
    utilidade: ['diagnostico', 'acompanhamento', 'prognostico'],
    padroes: ['infeccao-bacteriana'],
    estudarTambem: ['vhs', 'procalcitonina', 'ferritina', 'leucocitos'],
  },

  {
    id: 'pcr-ultrassensivel',
    nome: 'PCR ultrassensível',
    sigla: 'PCR-us',
    sinonimos: ['pcr us', 'hs-crp', 'proteina c reativa ultrassensivel'],
    grupo: 'inflamatorio',
    sistemas: ['cardiovascular'],
    material: 'Soro',
    unidade: 'mg/L',
    referencias: [
      { rotulo: 'Risco cardiovascular baixo', texto: '< 1,0', unidade: 'mg/L' },
      { rotulo: 'Risco intermediário', texto: '1,0 a 3,0', unidade: 'mg/L' },
      { rotulo: 'Risco alto', texto: '> 3,0', unidade: 'mg/L', observacao: 'Acima de 10 mg/L, a elevação provavelmente é inflamação aguda, não risco vascular — repetir em 2 semanas.' },
    ],
    resumo:
      'A mesma proteína, medida com resolução suficiente para estratificar risco cardiovascular. É marcador de inflamação vascular de baixo grau, não de infecção.',
    entenda:
      'A aterosclerose é uma doença inflamatória da parede arterial, e a PCR ultrassensível captura essa inflamação crônica de baixo grau. Ela agrega informação prognóstica além do colesterol — pacientes com LDL controlado e PCR-us alta mantêm risco elevado (o chamado risco residual inflamatório). Esse conceito foi validado em ensaios com anti-inflamatórios que reduziram eventos cardiovasculares sem mexer no colesterol.',
    fisiologia: {
      oQueE: 'A mesma proteína C reativa, dosada por método de maior sensibilidade analítica.',
      origem: 'Hepatócito, sob estímulo de IL-6 produzida também no tecido adiposo e na placa aterosclerótica.',
      funcao: 'Marcador de inflamação vascular subclínica.',
      percurso: ['Inflamação da placa e do tecido adiposo', 'IL-6 ↑', 'PCR ↑ discreta e persistente', 'risco cardiovascular ↑'],
    },
    aumento: {
      resumo: 'Inflamação crônica de baixo grau: obesidade, síndrome metabólica, tabagismo, sedentarismo, doença periodontal.',
      mecanismos: [
        {
          titulo: 'Inflamação metabólica',
          explicacao: 'O tecido adiposo visceral é um órgão endócrino que produz IL-6 e TNF continuamente.',
          exemplos: [{ causa: 'Obesidade visceral, síndrome metabólica, diabetes tipo 2', etapas: ['adipócito hipertrofiado', 'IL-6 e TNF ↑', 'PCR-us ↑ crônica', 'inflamação vascular e risco cardiovascular ↑'] }],
        },
      ],
    },
    relacionados: [{ titulo: 'Na estratificação de risco', ids: ['ldl', 'nao-hdl', 'apob', 'lpa'], leitura: 'PCR-us alta com LDL controlado identifica risco residual inflamatório — um alvo terapêutico distinto do lipídico.' }],
    interferentes: { fisiologico: ['Qualquer infecção ou inflamação aguda invalida a interpretação — repetir após 2 semanas de estabilidade clínica.'] },
    utilidade: ['rastreamento', 'prognostico'],
    estudarTambem: ['pcr', 'ldl', 'apob'],
  },

  {
    id: 'procalcitonina',
    nome: 'Procalcitonina',
    sigla: 'PCT',
    sinonimos: ['pct', 'procalcitonina serica'],
    grupo: 'inflamatorio',
    sistemas: ['infeccioso'],
    material: 'Soro ou plasma',
    unidade: 'ng/mL',
    referencias: [
      { rotulo: 'Infecção bacteriana improvável', texto: '< 0,25', unidade: 'ng/mL' },
      { rotulo: 'Infecção bacteriana provável', texto: '> 0,5', unidade: 'ng/mL' },
      { rotulo: 'Sepse / infecção sistêmica grave', texto: '> 2,0', unidade: 'ng/mL' },
    ],
    resumo:
      'Precursor da calcitonina que, na infecção bacteriana, é produzido por tecidos que normalmente não o fazem. É o marcador que melhor separa infecção bacteriana de viral.',
    entenda:
      'Em condições normais, a procalcitonina é produzida apenas pelas células C da tireoide e imediatamente clivada em calcitonina — o que circula é praticamente indetectável. Na infecção bacteriana, endotoxinas e citocinas (IL-1β, TNF) induzem sua produção em fígado, pulmão, rim e adipócitos, sem clivagem. O interferon-gama, liberado nas infecções virais, inibe essa produção — e é exatamente isso que dá à procalcitonina a capacidade de discriminar bacteriano de viral que a PCR não tem.',
    fisiologia: {
      oQueE: 'Pró-hormônio de 116 aminoácidos, precursor da calcitonina.',
      origem: 'Fisiologicamente, células C da tireoide; na infecção bacteriana, praticamente todos os tecidos parenquimatosos.',
      funcao: 'Não se conhece função fisiológica relevante da procalcitonina circulante — seu valor é o de marcador.',
      meiaVida: '24 a 30 horas.',
      percurso: ['Endotoxina bacteriana e IL-1β/TNF', 'expressão do gene CALC-1 em tecidos extratireoidianos', 'procalcitonina não clivada no plasma', 'PCT ↑ em 3 a 6 horas'],
    },
    aumento: {
      resumo: 'Infecção bacteriana sistêmica, sobretudo. Também em choque, grandes queimados, pancreatite grave e carcinoma medular de tireoide.',
      mecanismos: [
        {
          titulo: 'Indução por produtos bacterianos',
          explicacao: 'A endotoxina e as citocinas induzem a expressão do gene em tecidos que normalmente o mantêm silenciado.',
          exemplos: [
            { causa: 'Sepse e infecção bacteriana sistêmica', etapas: ['endotoxina e IL-1β/TNF ↑', 'expressão extratireoidiana do gene CALC-1', 'PCT ↑ em 3 a 6 horas, com pico em 12 a 24 horas'], nota: 'Correlaciona-se com gravidade e permite protocolos de descontinuação precoce de antibiótico.' },
          ],
        },
        {
          titulo: 'Elevação não infecciosa',
          explicacao: 'Estados de agressão sistêmica intensa também a elevam.',
          exemplos: [
            { causa: 'Choque de qualquer causa, grandes queimados, politrauma, pancreatite grave, pós-operatório de grande porte, doença renal crônica', etapas: ['resposta inflamatória sistêmica', 'PCT ↑ sem infecção'], nota: 'Nesses cenários, a PCT perde especificidade — a tendência ao longo dos dias continua útil.' },
            { causa: 'Carcinoma medular de tireoide e tumores neuroendócrinos', etapas: ['produção tumoral do pró-hormônio', 'PCT ↑ persistente'] },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Infecções virais e localizadas cursam com valores baixos — é justamente essa a informação.',
      mecanismos: [
        {
          titulo: 'Inibição pelo interferon-gama',
          explicacao: 'A resposta antiviral suprime a produção de procalcitonina.',
          exemplos: [{ causa: 'Infecções virais', etapas: ['interferon-gama ↑', 'inibição da expressão do gene', 'PCT baixa apesar de infecção ativa'], nota: 'É a base de seu uso para evitar antibiótico em infecções respiratórias virais.' }],
        },
      ],
    },
    relacionados: [{ titulo: 'Na suspeita de sepse', ids: ['pcr', 'lactato', 'leucocitos'], leitura: 'PCT discrimina bacteriano; lactato mede perfusão e prediz mortalidade; PCR acompanha a evolução. São perguntas diferentes.' }],
    cinetica: {
      inicio: '3 a 6 horas',
      pico: '12 a 24 horas',
      normalizacao: 'Meia-vida de 24 a 30 horas: cai pela metade por dia com tratamento eficaz.',
      tendencia: 'A queda de mais de 80% do pico é um dos critérios usados para suspender antibiótico com segurança.',
    },
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    padroes: ['infeccao-bacteriana', 'sepse'],
    estudarTambem: ['pcr', 'lactato', 'leucocitos'],
  },
]
