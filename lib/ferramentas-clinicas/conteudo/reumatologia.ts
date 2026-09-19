import type { Campo, Ferramenta, Nivel } from '../tipos'
import { campoNum, campoOpc, campoSeg, campoSimNao, fmt, fmtInt, num, opc, ptsOpc, sim } from '../helpers'

/* ═══════════════════════════════ 1. DAS28 ═══════════════════════════════ */

const das28: Ferramenta = {
  id: 'das28',
  nome: 'DAS28 — atividade da artrite reumatoide',
  sigla: 'DAS28',
  sinonimos: ['das 28', 'atividade artrite reumatoide', 'disease activity score', 'das28-vhs', 'das28-pcr'],
  resumo: 'Mede a atividade da artrite reumatoide em 28 articulações e define a meta de tratamento até a remissão.',
  categorias: ['reumatologia'],
  campos: [
    campoSeg('marcador', 'Marcador inflamatório', [
      { valor: 'vhs', rotulo: 'VHS' },
      { valor: 'pcr', rotulo: 'PCR' },
    ], { ajuda: 'As duas versões existem, mas não são intercambiáveis: o DAS28-PCR tende a dar valores mais baixos, e trocar de versão no meio do seguimento simula uma melhora que não houve.' }),
    campoNum('doloridas', 'Articulações dolorosas (de 28)', { min: 0, max: 28, passo: 1, ajuda: 'As 28 são: ombros, cotovelos, punhos, metacarpofalangeanas, interfalangeanas proximais e joelhos, bilateralmente. Tornozelos e pés ficam de fora — e é por isso que o DAS28 subestima doença de predomínio em antepé.' }),
    campoNum('edemaciadas', 'Articulações edemaciadas (de 28)', { min: 0, max: 28, passo: 1, ajuda: 'Edema é sinovite objetiva e vale mais que dor: articulação dolorida sem edema pode ser fibromialgia, artrose ou dano estrutural já estabelecido, nenhum dos quais responde a imunossupressão.' }),
    campoNum('vhs', 'VHS', { unidade: 'mm/h', min: 1, max: 150, passo: 1, mostrarSe: (v) => opc(v, 'marcador') === 'vhs', ajuda: 'Velocidade de hemossedimentação na primeira hora. Sobe com idade, sexo feminino, anemia e gestação por motivos alheios à atividade da doença.' }),
    campoNum('pcr', 'PCR', { unidade: 'mg/L', min: 0.1, max: 300, passo: 0.1, mostrarSe: (v) => opc(v, 'marcador') === 'pcr', ajuda: 'Proteína C-reativa em mg/L (não em mg/dL). Infecção concomitante eleva a PCR e simula atividade de doença — é a confusão mais perigosa nesse cálculo, porque leva a escalonar imunossupressão em quem tem infecção.' }),
    campoNum('eva', 'Avaliação global do paciente (0 a 100)', { min: 0, max: 100, passo: 1, ajuda: 'Escala visual analógica preenchida pelo **paciente**, não pelo médico, respondendo o quanto a artrite afetou sua saúde na última semana. Em fibromialgia associada, este item infla o escore sem que haja sinovite.' }),
  ],
  calcular: (v) => {
    const usaVhs = opc(v, 'marcador') === 'vhs'
    const dol = num(v, 'doloridas')
    const ede = num(v, 'edemaciadas')
    const eva = num(v, 'eva')
    const marcador = usaVhs ? num(v, 'vhs') : num(v, 'pcr')
    if (dol === null || ede === null || eva === null || marcador === null) return null

    const das = usaVhs
      ? 0.56 * Math.sqrt(dol) + 0.28 * Math.sqrt(ede) + 0.7 * Math.log(marcador) + 0.014 * eva
      : 0.56 * Math.sqrt(dol) + 0.28 * Math.sqrt(ede) + 0.36 * Math.log(marcador + 1) + 0.014 * eva + 0.96

    const nivel: Nivel = das > 5.1 ? 'critico' : das > 3.2 ? 'alerta' : das >= 2.6 ? 'atencao' : 'ok'
    const faixa = das > 5.1 ? 'Atividade alta' : das > 3.2 ? 'Atividade moderada' : das >= 2.6 ? 'Atividade baixa' : 'Remissão'

    const conduta: string[] = []
    if (das < 2.6) {
      conduta.push('**Remissão (< 2,6):** mantenha o esquema atual e reavalie a cada 3 a 6 meses. Só considere reduzir a dose após remissão sustentada por pelo menos 6 meses, e faça isso de forma gradual, com vigilância — a suspensão abrupta recai em grande parte dos casos.')
    } else if (das <= 3.2) {
      conduta.push('**Atividade baixa (2,6 a 3,2):** é alvo aceitável em doença de longa data ou quando a remissão não é alcançável, mas em doença inicial a meta continua sendo a remissão. Reavalie em 3 meses e considere otimizar antes de aceitar esse patamar como definitivo.')
    } else if (das <= 5.1) {
      conduta.push('**Atividade moderada (3,2 a 5,1):** ajuste o tratamento. Otimize o metotrexato (dose, via subcutânea se houver intolerância digestiva, ácido fólico associado) e, se a meta não for atingida em 3 meses, acrescente um segundo medicamento modificador de doença ou um biológico.')
    } else {
      conduta.push('**Atividade alta (> 5,1):** escalone sem esperar. Combine ou troque para biológico (anti-TNF, abatacepte, tocilizumabe, rituximabe) ou inibidor de JAK, conforme comorbidade e disponibilidade. Corticoide em ponte e em dose baixa pode ser usado enquanto o modificador de doença faz efeito, com plano explícito de retirada.')
    }
    conduta.push(
      'Adote a estratégia **treat-to-target**: defina a meta (remissão, ou atividade baixa em doença de longa data), meça o DAS28 a cada 1 a 3 meses enquanto a meta não for atingida, e ajuste o tratamento a cada avaliação em que ela não for alcançada. É essa disciplina de medir e ajustar, mais do que a escolha do fármaco, que muda o desfecho estrutural.',
      'Antes de escalonar por escore alto, **separe inflamação de dor não inflamatória**: fibromialgia associada eleva articulações dolorosas e a escala global do paciente sem elevar edema nem marcador, e o tratamento correto ali não é mais imunossupressão. Confira a razão entre articulações doloridas e edemaciadas.',
      'Rastreie antes de qualquer biológico ou inibidor de JAK: **tuberculose latente** (prova tuberculínica ou IGRA e radiografia), hepatites B e C, HIV, e atualize as vacinas — vacinas de vírus vivo devem ser aplicadas pelo menos 4 semanas antes de iniciar.',
      'Trate o **risco cardiovascular** como parte do tratamento da artrite: a inflamação sistêmica sustentada aumenta o risco de forma independente, e as diretrizes recomendam multiplicar por 1,5 o risco estimado por equações convencionais.',
    )

    return {
      titulo: usaVhs ? 'DAS28-VHS' : 'DAS28-PCR',
      valor: fmt(das, 2),
      nivel,
      rotuloNivel: faixa,
      detalhes: [
        { rotulo: 'Articulações dolorosas', valor: `${fmtInt(dol)} de 28` },
        { rotulo: 'Articulações edemaciadas', valor: `${fmtInt(ede)} de 28`, nivel: ede > 0 ? 'alerta' : 'ok', nota: 'Sinovite objetiva' },
        { rotulo: usaVhs ? 'VHS' : 'PCR', valor: `${fmt(marcador, 1)} ${usaVhs ? 'mm/h' : 'mg/L'}` },
        { rotulo: 'Global do paciente', valor: `${fmtInt(eva)} de 100` },
        { rotulo: 'Razão dolorosas/edemaciadas', valor: ede > 0 ? fmt(dol / ede, 1) : 'não calculável', nota: 'Acima de 2 sugere componente de dor não inflamatória' },
      ],
      interpretacao: [
        `**DAS28 de ${fmt(das, 2)} — ${faixa.toLowerCase()}.** As faixas são: remissão abaixo de 2,6; atividade baixa de 2,6 a 3,2; moderada acima de 3,2 até 5,1; alta acima de 5,1. Uma queda maior que 1,2 ponto é resposta boa pelos critérios EULAR; entre 0,6 e 1,2, resposta moderada.`,
        usaVhs
          ? 'Esta é a versão com VHS. Ela produz valores sistematicamente **mais altos** que a versão com PCR — a diferença chega a 0,5 ponto e é suficiente para mudar a faixa. Escolha uma versão e mantenha-a em todo o seguimento.'
          : 'Esta é a versão com PCR, que produz valores **mais baixos** que a versão com VHS e pode classificar como remissão um paciente que a versão VHS classificaria como atividade baixa. Mantenha a mesma versão ao longo do seguimento.',
        ede === 0 && dol > 3
          ? '**Muitas articulações dolorosas e nenhuma edemaciada.** Esse padrão levanta fortemente a hipótese de dor não inflamatória — fibromialgia, artrose ou dano estrutural sequelar. Imunossupressão adicional não resolve nenhum dos três.'
          : 'A relação entre articulações dolorosas e edemaciadas ajuda a separar inflamação ativa de dor sem sinovite: razões muito acima de 2 apontam componente não inflamatório relevante.',
        'O DAS28 avalia apenas 28 articulações e **exclui tornozelos e pés**, onde a artrite reumatoide frequentemente é ativa. Em doença de predomínio em antepé, ele subestima a atividade — considere o SDAI, o CDAI ou a contagem ampliada.',
      ],
      conduta,
      alertas: [
        'PCR ou VHS elevados por **infecção** simulam atividade de doença. Escalonar imunossupressão nesse cenário é o erro mais grave associado ao uso do escore — afaste infecção antes de interpretar o marcador.',
        'O DAS28 não substitui a avaliação de **dano estrutural**: um paciente pode estar em remissão clínica e continuar progredindo radiograficamente, o que exige imagem periódica e não apenas o escore.',
      ],
    }
  },
  formula: [
    'DAS28-VHS = 0,56 × √(dolorosas) + 0,28 × √(edemaciadas) + 0,70 × ln(VHS) + 0,014 × global',
    'DAS28-PCR = 0,56 × √(dolorosas) + 0,28 × √(edemaciadas) + 0,36 × ln(PCR + 1) + 0,014 × global + 0,96',
  ],
  fundamento:
    'A artrite reumatoide é uma sinovite autoimune em que o pannus — tecido sinovial hiperplásico e invasivo — libera metaloproteinases, RANKL e citocinas (TNF-alfa, interleucinas 1 e 6) que destroem cartilagem e osso subcondral de forma irreversível. O dano estrutural começa cedo, nos primeiros meses, e é cumulativo: é por isso que a estratégia moderna é medir a atividade com frequência e escalonar o tratamento até a remissão, em vez de esperar a falha se tornar evidente. O DAS28 foi construído por regressão sobre a decisão real de reumatologistas de intensificar ou não o tratamento, o que explica a forma peculiar da equação — as raízes quadradas amortecem o peso de contagens articulares altas, o logaritmo do marcador inflamatório reproduz a relação não linear entre reagente de fase aguda e percepção de atividade, e os coeficientes refletem quanto cada componente pesou naquela decisão clínica. Não é uma medida fisiológica, é um modelo da decisão do especialista, e isso é tanto sua força quanto seu limite.',
  armadilhas: [
    'Misturar DAS28-VHS e DAS28-PCR ao longo do seguimento produz variações de até 0,5 ponto que não correspondem a mudança nenhuma na doença.',
    'O escore não inclui tornozelos e pés, e subestima a atividade em pacientes com doença de predomínio em antepé.',
    'A avaliação global é do paciente e carrega a dor, o sono e o humor dele. Em fibromialgia associada, esse item e a contagem de articulações dolorosas sobem juntos sem sinovite alguma.',
    'Remissão pelo DAS28 é menos rigorosa que a remissão pelos critérios ACR/EULAR booleanos, que exigem no máximo 1 articulação dolorosa, 1 edemaciada, PCR de até 1 mg/dL e global de até 1 em 10.',
  ],
  referencias: [
    { texto: 'Prevoo ML, van \'t Hof MA, Kuper HH, et al. Modified disease activity scores that include twenty-eight-joint counts. Arthritis Rheum. 1995;38(1):44-48.' },
    { texto: 'Smolen JS, Landewé RBM, Bergstra SA, et al. EULAR recommendations for the management of rheumatoid arthritis with synthetic and biological disease-modifying antirheumatic drugs: 2022 update. Ann Rheum Dis. 2023;82(1):3-18.' },
  ],
}

/* ════════════════════ 2. Critérios de classificação do LES ════════════════════ */

/**
 * Domínios dos critérios EULAR/ACR 2019, em constante nomeada.
 * 
 * `ptsOpc` precisa do array de campos para resolver os pontos da alternativa
 * escolhida, e dentro de `calcular` só existe o mapa de valores.
 */
const lesCampos: Campo[] = [
  campoSimNao('fan', 'FAN ≥ 1:80 em células HEp-2, em algum momento', 0, 'É o **critério de entrada**: sem FAN positivo em pelo menos uma ocasião, os critérios de 2019 não se aplicam, qualquer que seja a pontuação dos demais domínios. Lúpus com FAN persistentemente negativo existe, mas é raro e não é classificável por este conjunto.'),
  campoOpc('constitucional', 'Constitucional', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '2', rotulo: 'Febre acima de 38,3 °C sem outra causa', pontos: 2 },
  ], { padrao: '0' }),
  campoOpc('hematologico', 'Hematológico', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '3', rotulo: 'Leucopenia < 4.000/mm³', pontos: 3 },
    { valor: '4', rotulo: 'Trombocitopenia < 100.000/mm³', pontos: 4 },
    { valor: '5', rotulo: 'Hemólise autoimune', pontos: 5 },
  ], { padrao: '0', ajuda: 'Pontue apenas o item de maior peso dentro do domínio — os domínios não somam internamente.' }),
  campoOpc('neuro', 'Neuropsiquiátrico', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '2', rotulo: 'Delirium', pontos: 2 },
    { valor: '3', rotulo: 'Psicose', pontos: 3 },
    { valor: '5', rotulo: 'Convulsão', pontos: 5 },
  ], { padrao: '0' }),
  campoOpc('mucocutaneo', 'Mucocutâneo', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '2', rotulo: 'Alopecia não cicatricial', pontos: 2 },
    { valor: '2b', rotulo: 'Úlceras orais', pontos: 2 },
    { valor: '4', rotulo: 'Lúpus cutâneo subagudo ou discoide', pontos: 4 },
    { valor: '6', rotulo: 'Lúpus cutâneo agudo (rash malar)', pontos: 6 },
  ], { padrao: '0' }),
  campoOpc('serosite', 'Serosite', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '5', rotulo: 'Derrame pleural ou pericárdico', pontos: 5 },
    { valor: '6', rotulo: 'Pericardite aguda', pontos: 6 },
  ], { padrao: '0' }),
  campoOpc('musculo', 'Musculoesquelético', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '6', rotulo: 'Acometimento articular (sinovite em 2+ ou dor em 2+ com rigidez matinal)', pontos: 6 },
  ], { padrao: '0' }),
  campoOpc('renal', 'Renal', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '4', rotulo: 'Proteinúria > 0,5 g/24 h', pontos: 4 },
    { valor: '8', rotulo: 'Nefrite classe II ou V na biópsia', pontos: 8 },
    { valor: '10', rotulo: 'Nefrite classe III ou IV na biópsia', pontos: 10 },
  ], { padrao: '0', ajuda: 'O domínio renal tem o maior peso do conjunto porque a nefrite lúpica é o principal determinante de morbidade e mortalidade — e porque a biópsia, que define a classe, também define o tratamento.' }),
  campoOpc('antifosfolipide', 'Anticorpos antifosfolípides', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '2', rotulo: 'Anticardiolipina, anti-beta2GP1 ou anticoagulante lúpico', pontos: 2 },
  ], { padrao: '0' }),
  campoOpc('complemento', 'Complemento', [
    { valor: '0', rotulo: 'Normal', pontos: 0 },
    { valor: '3', rotulo: 'C3 **ou** C4 baixo', pontos: 3 },
    { valor: '4', rotulo: 'C3 **e** C4 baixos', pontos: 4 },
  ], { padrao: '0', ajuda: 'O consumo de complemento reflete formação e deposição de imunocomplexos, e costuma acompanhar a atividade da doença — sobretudo da nefrite.' }),
  campoOpc('especificos', 'Anticorpos específicos', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '6', rotulo: 'Anti-DNA nativo **ou** anti-Sm', pontos: 6 },
  ], { padrao: '0', ajuda: 'Anti-DNA de dupla hélite e anti-Sm são os mais específicos para lúpus; o anti-DNA correlaciona-se com atividade renal e é útil no seguimento.' }),
]

const lesEular: Ferramenta = {
  id: 'criterios-les',
  nome: 'Critérios de classificação do lúpus (EULAR/ACR 2019)',
  sinonimos: ['les', 'lupus', 'criterios lupus', 'eular acr 2019', 'slicc'],
  resumo: 'Aplica os critérios de classificação do lúpus, com FAN como porta de entrada obrigatória e domínios ponderados.',
  categorias: ['reumatologia'],
  campos: lesCampos,
  calcular: (v) => {
    if (!sim(v, 'fan')) {
      return {
        titulo: 'Critérios EULAR/ACR 2019',
        valor: 'Não aplicável',
        nivel: 'neutro',
        rotuloNivel: 'Critério de entrada ausente',
        detalhes: [{ rotulo: 'FAN ≥ 1:80', valor: 'Negativo', nota: 'Sem ele, os critérios não se aplicam' }],
        interpretacao: [
          '**Os critérios de 2019 exigem FAN ≥ 1:80 em células HEp-2 como porta de entrada obrigatória.** Sem ele, não se classifica lúpus por este conjunto, qualquer que seja a pontuação dos demais domínios.',
          'Isso não exclui o diagnóstico clínico. **Lúpus com FAN negativo existe** — associado a anti-Ro isolado, a nefrite lúpica com consumo maciço de anticorpos, ou a erro técnico de substrato —, mas é incomum e exige reavaliação cuidadosa antes de ser aceito.',
          'Confirme também a técnica: o FAN deve ser por **imunofluorescência indireta em HEp-2**, e não por ensaio imunoenzimático automatizado, que tem sensibilidade menor e é fonte reconhecida de falso negativo.',
        ],
        conduta: [
          'Repita o FAN por imunofluorescência indireta em HEp-2 em laboratório de referência, se o exame anterior foi automatizado ou se a suspeita clínica é forte.',
          'Reavalie o diagnóstico diferencial: dermatomiosite, doença mista do tecido conjuntivo, vasculites, infecções (endocardite, HIV, hepatite C, parvovírus B19), neoplasias e lúpus induzido por fármaco (hidralazina, procainamida, minociclina, anti-TNF, inibidores de checkpoint).',
          'Se houver nefrite com sedimento ativo e proteinúria, a **biópsia renal** decide independentemente da sorologia, e o tratamento é guiado pela classe histológica.',
        ],
        alertas: ['Critérios de classificação foram feitos para selecionar populações homogêneas em ensaios clínicos, **não para diagnosticar**. Um paciente pode ter lúpus e não preencher os critérios, e o contrário também ocorre.'],
      }
    }

    const dominios: [string, string][] = [
      ['Constitucional', 'constitucional'],
      ['Hematológico', 'hematologico'],
      ['Neuropsiquiátrico', 'neuro'],
      ['Mucocutâneo', 'mucocutaneo'],
      ['Serosite', 'serosite'],
      ['Musculoesquelético', 'musculo'],
      ['Renal', 'renal'],
      ['Antifosfolípides', 'antifosfolipide'],
      ['Complemento', 'complemento'],
      ['Anticorpos específicos', 'especificos'],
    ]
    let total = 0
    const detalhes = dominios.map(([rotulo, id]) => {
      const p = ptsOpc(lesCampos, v, id) ?? 0
      total += p
      return { rotulo, valor: p > 0 ? `${p} ponto(s)` : '—', nivel: (p > 0 ? 'alerta' : 'ok') as Nivel }
    })
    const classifica = total >= 10
    const renal = (ptsOpc(lesCampos, v, 'renal') ?? 0) > 0

    return {
      titulo: 'Critérios EULAR/ACR 2019',
      valor: fmtInt(total),
      unidade: 'pontos',
      nivel: classifica ? 'alerta' : 'atencao',
      rotuloNivel: classifica ? 'Classifica como lúpus (≥ 10)' : 'Não classifica (< 10)',
      detalhes: [{ rotulo: 'FAN ≥ 1:80', valor: 'Presente', nota: 'Critério de entrada cumprido', nivel: 'ok' as Nivel }, ...detalhes],
      interpretacao: [
        `**${total} pontos, com corte de 10.** Os critérios de 2019 exigem FAN positivo como entrada, pelo menos um critério clínico, e total de 10 ou mais pontos — contando apenas o item de maior peso dentro de cada domínio. A sensibilidade é de 96% e a especificidade de 93%, o melhor desempenho entre os conjuntos já propostos.`,
        classifica
          ? 'O caso **preenche os critérios de classificação**. Isso significa que ele seria elegível para um ensaio clínico de lúpus; o diagnóstico continua sendo clínico e exige exclusão ativa de mimetizadores.'
          : 'O caso **não preenche os critérios**, o que não exclui o diagnóstico. Lúpus inicial, oligossintomático ou tratado precocemente frequentemente não pontua o suficiente — reavalie ao longo do tempo, porque os domínios se acumulam.',
        renal
          ? '**O domínio renal está positivo.** A nefrite lúpica é o principal determinante de morbidade e mortalidade, e a classe histológica — que só a biópsia define — muda completamente o tratamento: classes III e IV exigem imunossupressão de indução, classe V isolada segue outra lógica, e classes I e II frequentemente não exigem imunossupressão específica.'
          : 'Sem domínio renal pontuado, mantenha vigilância ativa: a nefrite pode surgir a qualquer momento e é frequentemente assintomática no início — sumário de urina com sedimento e relação proteína/creatinina a cada consulta.',
        'Cada critério só conta se **não houver explicação mais provável**: infecção, fármaco ou outra doença. Essa exigência está no texto dos critérios e é o que impede que o conjunto classifique como lúpus quadros infecciosos com FAN reagente.',
      ],
      conduta: [
        '**Hidroxicloroquina para praticamente todos os pacientes**, salvo contraindicação: ela reduz atividade, surtos, dano acumulado, trombose e mortalidade, e é o único fármaco com efeito sobre sobrevida no lúpus. Dose de até 5 mg/kg/dia de peso real, com avaliação oftalmológica basal e anual após 5 anos pelo risco de retinopatia.',
        'Use **corticoide na menor dose e pelo menor tempo possível**, com estratégia explícita de retirada: boa parte do dano acumulado no lúpus a longo prazo é iatrogênica — catarata, osteoporose, necrose avascular, diabetes, infecção.',
        'Escolha o imunossupressor pelo órgão acometido: **micofenolato ou ciclofosfamida** na nefrite proliferativa (com belimumabe ou voclosporina associados nos esquemas atuais), **azatioprina** como poupador em manifestações moderadas, **metotrexato** em doença articular predominante, **rituximabe** em citopenias refratárias.',
        'Na presença de **anticorpos antifosfolípides**, avalie profilaxia: aspirina em baixa dose em portadores com perfil de alto risco, e anticoagulação plena com varfarina (não com anticoagulante direto, que falhou na tripla positividade) após evento trombótico.',
        'Trate as comorbidades que definem o prognóstico a longo prazo: **risco cardiovascular acelerado**, que exige meta lipídica e pressórica mais rigorosa; prevenção de infecção com vacinas em dia; proteção óssea; e fotoproteção rigorosa, que reduz surtos cutâneos e sistêmicos.',
      ],
      alertas: [
        'Critérios de **classificação** não são critérios **diagnósticos**. Usá-los para negar diagnóstico a um paciente com quadro compatível e menos de 10 pontos é o erro mais comum e mais danoso.',
        'Antes de fechar o diagnóstico, afaste **lúpus induzido por fármaco** (hidralazina, procainamida, minociclina, isoniazida, anti-TNF, inibidores de checkpoint): o quadro regride com a suspensão e costuma ter anti-histona positivo e anti-DNA negativo.',
      ],
    }
  },
  formula: ['Entrada obrigatória: FAN ≥ 1:80 em HEp-2', 'Soma apenas o item de maior peso de cada domínio', 'Classifica com ≥ 10 pontos e pelo menos 1 critério clínico'],
  fundamento:
    'O lúpus é a doença autoimune sistêmica prototípica por imunocomplexos: a falha na depuração de material apoptótico expõe antígenos nucleares, que ativam linfócitos B autorreativos através de receptores Toll-like intracelulares e do estímulo do interferon tipo I. Os autoanticorpos resultantes formam imunocomplexos que se depositam em glomérulo, pele, serosas e plexo coroide, ativam complemento — daí o consumo de C3 e C4, que serve de marcador de atividade — e recrutam neutrófilos e macrófagos que produzem a lesão tecidual. A arquitetura dos critérios de 2019 reflete essa fisiopatologia: o FAN como entrada porque a autoimunidade antinuclear é o substrato comum; os pesos diferentes por domínio porque manifestações raras e específicas (nefrite proliferativa, anti-DNA, anti-Sm) informam muito mais que manifestações comuns e inespecíficas (febre, artralgia); e a regra de contar apenas o maior item de cada domínio porque manifestações do mesmo sistema compartilham mecanismo e não são evidências independentes.',
  armadilhas: [
    'FAN positivo em título baixo ocorre em até 15% da população saudável e em muitas outras condições — ele é sensível e pouco específico, e só ganha valor no contexto clínico certo.',
    'Somar mais de um item dentro do mesmo domínio é erro de aplicação: apenas o de maior peso conta.',
    'Um critério não deve ser contado se houver explicação mais provável — infecção, fármaco ou outra doença. Essa cláusula é parte dos critérios e é frequentemente ignorada.',
    'Os critérios não medem **atividade** nem **dano**: para isso existem o SLEDAI-2K e o índice de dano SLICC/ACR, que são instrumentos distintos e com finalidade distinta.',
  ],
  referencias: [
    { texto: 'Aringer M, Costenbader K, Daikh D, et al. 2019 European League Against Rheumatism/American College of Rheumatology classification criteria for systemic lupus erythematosus. Ann Rheum Dis. 2019;78(9):1151-1159.' },
    { texto: 'Fanouriakis A, Kostopoulou M, Andersen J, et al. EULAR recommendations for the management of systemic lupus erythematosus: 2023 update. Ann Rheum Dis. 2024;83(1):15-29.' },
  ],
}

/* ═══════════ Critérios ACR/EULAR 2015 para gota ═══════════ */

const gotaCampos: Campo[] = [
  campoSimNao('entrada', 'Houve pelo menos um episódio de edema, dor ou sensibilidade em articulação periférica ou bursa', 0, '**Critério de entrada obrigatório.** Sem ele, os critérios não se aplicam. Note que não é necessário que o episódio esteja ativo no momento da avaliação.'),
  campoSimNao('cristais', 'Cristais de urato monossódico identificados em líquido sinovial ou tofo', 0, '**Critério suficiente.** Cristais em forma de agulha com birrefringência negativa forte à luz polarizada **fecham o diagnóstico** e dispensam toda a pontuação. Esse é o padrão-ouro e continua subutilizado — a artrocentese é simples e resolve a maior parte das dúvidas.'),
  campoOpc('padrao', 'Padrão de acometimento articular', [
    { valor: '0', rotulo: 'Outra articulação (nem tornozelo/médio-pé, nem 1ª metatarsofalangeana)', pontos: 0 },
    { valor: '1', rotulo: 'Tornozelo ou médio-pé, sem a 1ª metatarsofalangeana', pontos: 1 },
    { valor: '2', rotulo: 'Primeira metatarsofalangeana (podagra)', pontos: 2 },
  ], { padrao: '0', ajuda: 'A **podagra** — acometimento da primeira metatarsofalangeana — é o padrão clássico e vale o máximo de pontos. Ela reflete a temperatura mais baixa da articulação periférica distal, que reduz a solubilidade do urato e favorece a precipitação.' }),
  campoOpc('caracteristicas', 'Características do episódio: eritema sobre a articulação, dor intensa ao toque, e dificuldade importante para caminhar ou usar a articulação', [
    { valor: '0', rotulo: 'Nenhuma', pontos: 0 },
    { valor: '1', rotulo: 'Uma', pontos: 1 },
    { valor: '2', rotulo: 'Duas', pontos: 2 },
    { valor: '3', rotulo: 'Três', pontos: 3 },
  ], { padrao: '0' }),
  campoOpc('cronologia', 'Cronologia típica: pico de dor em menos de 24 h, resolução em menos de 14 dias, e resolução completa entre as crises', [
    { valor: '0', rotulo: 'Nenhum episódio típico', pontos: 0 },
    { valor: '1', rotulo: 'Um episódio típico', pontos: 1 },
    { valor: '2', rotulo: 'Episódios típicos recorrentes', pontos: 2 },
  ], { padrao: '0', ajuda: 'A cronologia é o que melhor distingue gota de artrite séptica e de artrite reumatoide: **pico em menos de 24 horas** e **resolução completa** entre as crises. Dor que cresce ao longo de dias não é gota típica.' }),
  campoOpc('tofo', 'Tofo clinicamente evidente', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '4', rotulo: 'Presente', pontos: 4 },
  ], { padrao: '0', ajuda: 'Nódulo subcutâneo com material esbranquiçado ou amarelado sob pele fina e vascularizada, em localizações típicas: pavilhão auricular, olécrano, bursas, tendões e polpas digitais.' }),
  campoNum('uricemia', 'Ácido úrico sérico', { unidade: 'mg/dL', min: 0, max: 20, passo: 0.1, ajuda: 'Meça **fora da crise**, idealmente 4 semanas após, e sem tratamento hipouricemiante. Durante a crise, o ácido úrico pode estar **normal ou baixo** em até um terço dos casos — e uricemia normal na crise é a fonte mais comum de diagnóstico perdido.' }),
  campoOpc('imagem', 'Imagem', [
    { valor: '0', rotulo: 'Sem sinais ou não realizada', pontos: 0 },
    { valor: '4', rotulo: 'Sinal do duplo contorno à ultrassonografia, ou depósito de urato na tomografia de dupla energia', pontos: 4 },
    { valor: '8', rotulo: 'Erosão em saca-bocado à radiografia, somada a sinal de depósito', pontos: 8 },
  ], { padrao: '0', ajuda: 'O **sinal do duplo contorno** é a deposição de urato sobre a cartilagem hialina, visível como uma linha hiperecoica paralela à cortical óssea. A erosão "em saca-bocado", com bordas esclerosadas e margens salientes, é radiologicamente característica e preserva o espaço articular.' }),
]

const gota: Ferramenta = {
  id: 'criterios-gota',
  nome: 'Critérios ACR/EULAR 2015 para gota',
  sinonimos: ['gota', 'acido urico', 'podagra', 'tofo', 'artrite gotosa', 'urato'],
  resumo: 'Classifica gota sem artrocentese quando ela não é possível, e mostra por que a uricemia na crise engana.',
  categorias: ['reumatologia', 'emergencia'],
  campos: gotaCampos,
  calcular: (v) => {
    if (!sim(v, 'entrada')) {
      return {
        titulo: 'Critérios ACR/EULAR 2015',
        valor: 'Não aplicável',
        nivel: 'neutro',
        rotuloNivel: 'Critério de entrada ausente',
        detalhes: [{ rotulo: 'Critério de entrada', valor: 'Não cumprido', nota: 'Exige ao menos um episódio de edema, dor ou sensibilidade em articulação periférica ou bursa' }],
        interpretacao: [
          '**Sem o critério de entrada, os critérios de classificação não se aplicam.** É necessário ao menos um episódio de edema, dor ou sensibilidade em articulação periférica ou bursa — o episódio não precisa estar ativo no momento da avaliação.',
          'Hiperuricemia **assintomática não é gota**: apenas uma minoria dos hiperuricêmicos desenvolve a doença, e as diretrizes não recomendam tratamento hipouricemiante sem manifestação clínica, salvo situações específicas como profilaxia de síndrome de lise tumoral.',
        ],
        conduta: [
          'Em hiperuricemia assintomática, trate os **fatores associados** e não o número: obesidade, síndrome metabólica, consumo de álcool (sobretudo cerveja, rica em purinas e em guanosina), frutose, diuréticos tiazídicos e de alça, e doença renal crônica.',
          'Rastreie e trate comorbidades, que são a causa de morte nesses pacientes: hipertensão, diabetes, dislipidemia, doença renal crônica e doença cardiovascular.',
        ],
        alertas: ['Hiperuricemia assintomática não é gota e, em geral, não se trata com hipouricemiante.'],
      }
    }

    if (sim(v, 'cristais')) {
      return {
        titulo: 'Critérios ACR/EULAR 2015',
        valor: 'Gota confirmada',
        nivel: 'alerta',
        rotuloNivel: 'Cristais identificados — critério suficiente',
        detalhes: [{ rotulo: 'Cristais de urato monossódico', valor: 'Identificados', nivel: 'alerta' as Nivel, nota: 'Agulha, birrefringência negativa forte' }],
        interpretacao: [
          '**Cristais de urato monossódico identificados: o diagnóstico está feito** e a pontuação dos demais critérios é desnecessária. É o padrão-ouro, e a artrocentese continua subutilizada — ela é simples, rápida e resolve a maior parte das dúvidas diagnósticas.',
          'Os cristais de urato são **aciculares, com birrefringência negativa forte** à luz polarizada compensada: amarelos quando paralelos ao eixo do compensador e azuis quando perpendiculares. Os de pirofosfato de cálcio (pseudogota) são romboides, com birrefringência positiva fraca — e a diferença muda o tratamento de longo prazo.',
          '**A presença de cristais não exclui artrite séptica**, e as duas podem coexistir. Diante de febre, toxemia ou líquido de aspecto purulento, peça Gram e cultura e trate empiricamente até o resultado.',
        ],
        conduta: [
          '**Trate a crise agora e comece o hipouricemiante depois — ou junto, com profilaxia.** Para a crise: anti-inflamatório não esteroidal em dose plena, **colchicina em dose baixa** (1,2 mg seguido de 0,6 mg uma hora depois, e depois 0,6 mg uma a duas vezes ao dia — a dose alta antiga causava diarreia em quase todos sem ganho de eficácia), ou **corticoide** oral, intra-articular ou parenteral, que é a escolha em doença renal crônica.',
          '**Inicie ou mantenha o hipouricemiante** com **alopurinol** como primeira linha, começando com 100 mg/dia (50 mg na doença renal crônica) e titulando a cada 2 a 5 semanas até a **meta de uricemia abaixo de 6 mg/dL** (abaixo de 5 com tofos). A estratégia é de **tratar para o alvo**, não de dose fixa — e a subtitulação é a causa mais comum de falha.',
          '**Faça profilaxia de crise durante os primeiros 3 a 6 meses** de hipouricemiante, com colchicina 0,5 a 0,6 mg ao dia ou anti-inflamatório em dose baixa. A queda da uricemia mobiliza urato dos depósitos e **desencadeia crises** — sem profilaxia, o paciente atribui a crise ao remédio e abandona o tratamento.',
          'Nunca **suspenda o alopurinol durante uma crise** em quem já o usa: isso prolonga o episódio. E não o inicie sem profilaxia.',
          'Rastreie **HLA-B*5801** antes do alopurinol em populações de risco (ascendência do sudeste asiático, chinesa Han, tailandesa e coreana com doença renal), pelo risco de síndrome de hipersensibilidade grave.',
          'Trate as **comorbidades**: em hipertenso com gota, prefira losartana, que é uricosúrica; em diabético, inibidor de SGLT2, que também reduz uricemia. Evite tiazídico e considere substituir quando possível.',
        ],
        alertas: [
          '**Cristais presentes não excluem artrite séptica** — as duas coexistem. Com febre ou líquido purulento, colha Gram e cultura e trate empiricamente.',
          'Não suspenda o hipouricemiante durante a crise em quem já o usa, e não o inicie sem profilaxia concomitante.',
        ],
      }
    }

    const itens = ['padrao', 'caracteristicas', 'cronologia', 'tofo', 'imagem']
    const pontos = itens.map((id) => ptsOpc(gotaCampos, v, id))
    if (pontos.some((p) => p === null)) return null
    const urico = num(v, 'uricemia')
    if (urico === null) return null

    const pontosUrico = urico < 4 ? -4 : urico < 6 ? 0 : urico < 8 ? 2 : urico < 10 ? 3 : 4
    const total = (pontos as number[]).reduce((a, b) => a + b, 0) + pontosUrico
    const classifica = total >= 8

    const nivel: Nivel = classifica ? 'alerta' : 'atencao'

    return {
      titulo: 'Critérios ACR/EULAR 2015',
      valor: fmtInt(total),
      unidade: 'de 23 pontos',
      nivel,
      rotuloNivel: classifica ? 'Classifica como gota (≥ 8)' : 'Não classifica (< 8)',
      detalhes: [
        { rotulo: 'Padrão articular', valor: fmtInt(pontos[0] as number) },
        { rotulo: 'Características do episódio', valor: fmtInt(pontos[1] as number) },
        { rotulo: 'Cronologia', valor: fmtInt(pontos[2] as number) },
        { rotulo: 'Tofo', valor: (pontos[3] as number) > 0 ? 'Presente (4)' : 'Ausente', nivel: ((pontos[3] as number) > 0 ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Ácido úrico', valor: `${fmt(urico, 1)} mg/dL → ${pontosUrico > 0 ? '+' : ''}${pontosUrico} ponto(s)`, nota: '< 4: −4 · 4-5,9: 0 · 6-7,9: +2 · 8-9,9: +3 · ≥ 10: +4' },
        { rotulo: 'Imagem', valor: fmtInt(pontos[4] as number) },
      ],
      interpretacao: [
        `**${total} de 23 pontos, com corte de 8.** Os critérios de 2015 foram construídos exatamente para o cenário em que a artrocentese **não foi feita ou não foi possível** — se os cristais estiverem disponíveis, eles são critério suficiente e toda a pontuação é desnecessária.`,
        `**Ácido úrico de ${fmt(urico, 1)} mg/dL contribui com ${pontosUrico > 0 ? '+' : ''}${pontosUrico} ponto(s).** Repare que valores **abaixo de 4 mg/dL subtraem 4 pontos**: uricemia baixa fora da crise torna a gota bem improvável. Mas o inverso também vale — durante a crise, a uricemia pode estar normal ou baixa em até um terço dos casos, e é por isso que ela deve ser medida **4 semanas depois**.`,
        classifica
          ? 'Os critérios **classificam como gota**. Lembre que classificação não é diagnóstico: eles foram construídos para selecionar populações homogêneas em ensaios clínicos, e o diagnóstico definitivo continua sendo a identificação de cristais.'
          : 'Os critérios **não classificam**, o que não exclui gota. Considere artrocentese, que resolve a questão, e mantenha no diferencial artrite séptica, pseudogota (pirofosfato de cálcio), artrite psoriásica, artrite reativa e sarcoidose.',
        'A **podagra** vale o máximo no item de padrão articular por uma razão física: a solubilidade do urato cai com a temperatura, e a primeira metatarsofalangeana é a articulação mais fria e mais distal do corpo — o que a torna o sítio preferencial de precipitação.',
      ],
      conduta: [
        classifica
          ? '**Trate a crise e planeje o tratamento de fundo.** Crise: anti-inflamatório em dose plena, **colchicina em dose baixa** (1,2 mg depois 0,6 mg em 1 hora), ou **corticoide** — oral, intra-articular ou parenteral —, que é a escolha em doença renal crônica e em idosos.'
          : '**Considere artrocentese** para resolver a dúvida: a identificação de cristais é definitiva e afasta ou confirma em uma única punção. Afaste artrite séptica antes de qualquer coisa se houver febre ou toxemia.',
        '**Inicie hipouricemiante** com indicação clara: crises recorrentes (duas ou mais por ano), tofo, nefrolitíase por urato, ou dano articular por imagem. **Alopurinol** é a primeira linha, iniciando com 100 mg/dia (50 mg se houver doença renal) e titulando a cada 2 a 5 semanas até **uricemia abaixo de 6 mg/dL** — ou abaixo de 5 com tofos, para dissolvê-los.',
        '**Profilaxia de crise por 3 a 6 meses** ao iniciar o hipouricemiante, com colchicina em dose baixa ou anti-inflamatório. Sem ela, a mobilização de urato dos depósitos provoca crises que o paciente atribui ao tratamento, e a adesão se perde.',
        'Oriente sobre **dieta com expectativa realista**: restrição de purinas reduz a uricemia em cerca de 1 mg/dL, o que raramente basta sozinho. O que mais importa é reduzir **álcool** (cerveja em primeiro lugar), **frutose e bebidas açucaradas**, e perder peso. Laticínios desnatados e café têm associação protetora.',
        'Reveja a medicação: **tiazídicos e diuréticos de alça elevam a uricemia**; **losartana e inibidores de SGLT2** a reduzem, e são escolhas preferenciais no hipertenso e no diabético com gota. Aspirina em dose baixa eleva pouco e não deve ser suspensa por isso.',
      ],
      alertas: [
        '**Uricemia normal durante a crise não exclui gota** — ela cai em até um terço dos episódios. Meça 4 semanas depois, fora da crise e sem hipouricemiante.',
        '**Artrite séptica é o diagnóstico a afastar primeiro**, e pode coexistir com a gota. Monoartrite aguda com febre pede artrocentese com Gram e cultura antes de qualquer conclusão.',
        'Não inicie hipouricemiante **sem profilaxia** nem o suspenda durante a crise em quem já o usa.',
      ],
    }
  },
  formula: [
    'Entrada obrigatória: ≥ 1 episódio de edema, dor ou sensibilidade em articulação periférica ou bursa',
    'Critério suficiente: cristais de urato monossódico identificados',
    'Soma de padrão articular, características, cronologia, tofo, uricemia e imagem · classifica com ≥ 8 de 23',
  ],
  fundamento:
    'A gota é uma **artrite por cristais** e sua fisiopatologia é notavelmente mecanicista. O urato é o produto final do metabolismo das purinas nos humanos, que perderam a uricase por mutação ao longo da evolução dos primatas — daí nossos níveis séricos serem dez vezes maiores que os de outros mamíferos. Acima da **saturação de aproximadamente 6,8 mg/dL**, o urato monossódico precipita em cristais, e essa saturação depende fortemente da **temperatura**: é por isso que a precipitação ocorre preferencialmente nas articulações mais frias e distais, com a primeira metatarsofalangeana no topo da lista. Os cristais depositados são inertes até serem fagocitados: ali ativam o **inflamassoma NLRP3** nos macrófagos sinoviais, que cliva a pró-interleucina-1-beta em sua forma ativa, desencadeando recrutamento maciço de neutrófilos e a inflamação explosiva característica — pico de dor em menos de 24 horas, eritema, calor e impotência funcional. Essa via explica por que a colchicina funciona (ela inibe a polimerização de microtúbulos e prejudica a quimiotaxia e a ativação do inflamassoma) e por que os **inibidores de interleucina-1**, como o anakinra e o canaquinumabe, resolvem crises refratárias. A autolimitação da crise decorre do recobrimento dos cristais por apolipoproteínas e da resolução ativa mediada por macrófagos — o que explica a "resolução completa entre as crises", que é justamente o item cronológico que distingue gota das artrites crônicas.',
  armadilhas: [
    'Uricemia é medida de risco, não de diagnóstico: normal na crise em até um terço, e alta em muitos que nunca terão gota.',
    'Gota poliarticular e de pequenas articulações das mãos ocorre em idosos e em mulheres pós-menopausa, e é confundida com artrite reumatoide.',
    'Pseudogota (pirofosfato de cálcio) tem apresentação muito semelhante, acomete mais joelho e punho, e se distingue pela morfologia e birrefringência dos cristais e pela condrocalcinose na radiografia.',
    'Tofo pode ser confundido com nódulo reumatoide, xantoma e nódulo de Heberden — a punção com identificação de cristais resolve.',
  ],
  referencias: [
    { texto: 'Neogi T, Jansen TL, Dalbeth N, et al. 2015 Gout Classification Criteria: an American College of Rheumatology/European League Against Rheumatism collaborative initiative. Arthritis Rheumatol. 2015;67(10):2557-2568.' },
    { texto: 'FitzGerald JD, Dalbeth N, Mikuls T, et al. 2020 American College of Rheumatology Guideline for the Management of Gout. Arthritis Rheumatol. 2020;72(6):879-895.' },
    { texto: 'Richette P, Doherty M, Pascual E, et al. 2016 updated EULAR evidence-based recommendations for the management of gout. Ann Rheum Dis. 2017;76(1):29-42.' },
  ],
}

export const ferramentas: Ferramenta[] = [das28, lesEular, gota]

export default ferramentas
