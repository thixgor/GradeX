import type { Campo, Ferramenta, Nivel, Resultado } from '../tipos'
import {
  campoIdade,
  campoNum,
  campoOpc,
  campoPeso,
  campoSeg,
  campoSimNao,
  fmt,
  fmtInt,
  fmtLivre,
  fmtPct,
  num,
  numOu,
  opc,
  sim,
  somaSimNao,
} from '../helpers'

const apache: Ferramenta = {
  id: 'apache-ii',
  nome: 'APACHE II',
  sinonimos: ['apache', 'apache 2', 'gravidade uti', 'prognostico uti'],
  resumo: 'Escore fisiológico agudo e de saúde crônica, com estimativa de mortalidade hospitalar.',
  categorias: ['emergencia', 'gastroenterologia'],
  campos: [
    campoNum('temp', 'Temperatura retal (pior valor em 24 h)', { unidade: '°C', min: 25, max: 45, passo: 0.1, padrao: '37' }),
    campoNum('pam', 'Pressão arterial média', { unidade: 'mmHg', min: 20, max: 200, passo: 1, padrao: '90' }),
    campoNum('fc', 'Frequência cardíaca', { unidade: 'bpm', min: 20, max: 250, passo: 1, padrao: '80' }),
    campoNum('fr', 'Frequência respiratória', { unidade: 'irpm', min: 3, max: 70, passo: 1, padrao: '16' }),
    campoNum('oxigenacao', 'Oxigenação', { min: 20, max: 700, passo: 1, padrao: '90', ajuda: 'Se FiO₂ ≥ 0,5, informe o gradiente alvéolo-arterial; se FiO₂ < 0,5, informe a PaO₂.' }),
    campoSeg('fio2Alta', 'FiO₂ ≥ 0,5', [
      { valor: 'nao', rotulo: 'Não (usar PaO₂)' },
      { valor: 'sim', rotulo: 'Sim (usar gradiente A-a)' },
    ]),
    campoNum('ph', 'pH arterial', { min: 6.5, max: 8, passo: 0.01, padrao: '7.40' }),
    campoNum('na', 'Sódio', { unidade: 'mEq/L', min: 90, max: 200, passo: 1, padrao: '140' }),
    campoNum('k', 'Potássio', { unidade: 'mEq/L', min: 1, max: 10, passo: 0.1, padrao: '4' }),
    campoNum('creatinina', 'Creatinina', { unidade: 'mg/dL', min: 0.1, max: 20, passo: 0.01, padrao: '1' }),
    campoSimNao('lra', 'Lesão renal aguda', 1, 'Dobra a pontuação da creatinina.'),
    campoNum('ht', 'Hematócrito', { unidade: '%', min: 10, max: 70, passo: 0.1, padrao: '42' }),
    campoNum('leuco', 'Leucócitos', { unidade: '×10³/mm³', min: 0.1, max: 100, passo: 0.1, padrao: '8' }),
    campoNum('gcs', 'Escala de Coma de Glasgow', { min: 3, max: 15, passo: 1, padrao: '15' }),
    campoIdade({ min: 16 }),
    campoOpc('cronica', 'Estado de saúde crônico', [
      { valor: '0', rotulo: 'Sem doença crônica grave', pontos: 0 },
      { valor: '2', rotulo: 'Doença crônica grave, pós-operatório eletivo', pontos: 2 },
      { valor: '5', rotulo: 'Doença crônica grave, clínico ou pós-operatório de urgência', pontos: 5 },
    ], { ajuda: 'Insuficiência hepática, cardíaca (classe IV), respiratória, renal dialítica ou imunossupressão, documentadas antes da internação.' }),
  ],
  calcular: (v) => {
    const temp = num(v, 'temp')
    const pam = num(v, 'pam')
    const fc = num(v, 'fc')
    const fr = num(v, 'fr')
    const oxi = num(v, 'oxigenacao')
    const ph = num(v, 'ph')
    const na = num(v, 'na')
    const k = num(v, 'k')
    const cr = num(v, 'creatinina')
    const ht = num(v, 'ht')
    const leuco = num(v, 'leuco')
    const gcs = num(v, 'gcs')
    const idade = num(v, 'idade')
    const cronica = num(v, 'cronica')
    if ([temp, pam, fc, fr, oxi, ph, na, k, cr, ht, leuco, gcs, idade, cronica].some((x) => x === null)) return null

    const pTemp = temp! >= 41 ? 4 : temp! >= 39 ? 3 : temp! >= 38.5 ? 1 : temp! >= 36 ? 0 : temp! >= 34 ? 1 : temp! >= 32 ? 2 : temp! >= 30 ? 3 : 4
    const pPam = pam! >= 160 ? 4 : pam! >= 130 ? 3 : pam! >= 110 ? 2 : pam! >= 70 ? 0 : pam! >= 50 ? 2 : 4
    const pFc = fc! >= 180 ? 4 : fc! >= 140 ? 3 : fc! >= 110 ? 2 : fc! >= 70 ? 0 : fc! >= 55 ? 2 : fc! >= 40 ? 3 : 4
    const pFr = fr! >= 50 ? 4 : fr! >= 35 ? 3 : fr! >= 25 ? 1 : fr! >= 12 ? 0 : fr! >= 10 ? 1 : fr! >= 6 ? 2 : 4
    const fio2Alta = sim(v, 'fio2Alta')
    const pOxi = fio2Alta
      ? oxi! >= 500 ? 4 : oxi! >= 350 ? 3 : oxi! >= 200 ? 2 : 0
      : oxi! > 70 ? 0 : oxi! >= 61 ? 1 : oxi! >= 55 ? 3 : 4
    const pPh = ph! >= 7.7 ? 4 : ph! >= 7.6 ? 3 : ph! >= 7.5 ? 1 : ph! >= 7.33 ? 0 : ph! >= 7.25 ? 2 : ph! >= 7.15 ? 3 : 4
    const pNa = na! >= 180 ? 4 : na! >= 160 ? 3 : na! >= 155 ? 2 : na! >= 150 ? 1 : na! >= 130 ? 0 : na! >= 120 ? 2 : na! >= 111 ? 3 : 4
    const pK = k! >= 7 ? 4 : k! >= 6 ? 3 : k! >= 5.5 ? 1 : k! >= 3.5 ? 0 : k! >= 3 ? 1 : k! >= 2.5 ? 2 : 4
    let pCr = cr! >= 3.5 ? 4 : cr! >= 2 ? 3 : cr! >= 1.5 ? 2 : cr! >= 0.6 ? 0 : 2
    if (sim(v, 'lra')) pCr *= 2
    const pHt = ht! >= 60 ? 4 : ht! >= 50 ? 2 : ht! >= 46 ? 1 : ht! >= 30 ? 0 : ht! >= 20 ? 2 : 4
    const pLeuco = leuco! >= 40 ? 4 : leuco! >= 20 ? 2 : leuco! >= 15 ? 1 : leuco! >= 3 ? 0 : leuco! >= 1 ? 2 : 4
    const pGcs = 15 - gcs!
    const pIdade = idade! >= 75 ? 6 : idade! >= 65 ? 5 : idade! >= 55 ? 3 : idade! >= 45 ? 2 : 0

    const fisiologico = pTemp + pPam + pFc + pFr + pOxi + pPh + pNa + pK + pCr + pHt + pLeuco + pGcs
    const total = fisiologico + pIdade + cronica!
    const mortalidade = total <= 4 ? '≈ 4%' : total <= 9 ? '≈ 8%' : total <= 14 ? '≈ 15%' : total <= 19 ? '≈ 25%' : total <= 24 ? '≈ 40%' : total <= 29 ? '≈ 55%' : total <= 34 ? '≈ 75%' : '≈ 85%'
    const nivel: Nivel = total >= 25 ? 'critico' : total >= 15 ? 'alerta' : total >= 10 ? 'atencao' : 'ok'
    return {
      titulo: 'APACHE II',
      valor: String(total),
      unidade: 'de 71 pontos',
      nivel,
      rotuloNivel: `Mortalidade hospitalar estimada: ${mortalidade}`,
      detalhes: [
        { rotulo: 'Escore fisiológico agudo', valor: `${fisiologico} pontos` },
        { rotulo: 'Pontos por idade', valor: `${pIdade} pontos` },
        { rotulo: 'Pontos por saúde crônica', valor: `${cronica} pontos` },
        { rotulo: 'Glasgow', valor: `${pGcs} pontos`, nota: 'Contribui com 15 menos o valor da escala — pode chegar a 12 pontos, o maior peso individual.' },
        { rotulo: 'Mortalidade estimada', valor: mortalidade, nota: 'A estimativa formal usa também o peso da categoria diagnóstica e a condição cirúrgica, que variam; esta é a faixa por pontuação.' },
      ],
      conduta: [
        'Use o APACHE II para **comparar desempenho entre unidades, ajustar casuística em pesquisa e auditar resultados**, não para decidir o destino de um paciente. Ele estima a mortalidade de um grupo com aquelas características, e a taxa de mortalidade padronizada (observada ÷ esperada) é seu uso mais legítimo.',
        'Calcule com os **piores valores das primeiras 24 horas** de internação em terapia intensiva, e apenas uma vez: recalculá-lo em outro momento não é APACHE II e invalida a comparação com os dados publicados.',
        'Reconheça que o escore está **desatualizado**: foi derivado em 1985, e a mortalidade real de hoje é substancialmente menor para o mesmo escore, porque o cuidado intensivo mudou. Isso significa que ele **superestima** a mortalidade esperada — o que é aceitável para comparação relativa, e enganoso se lido como probabilidade individual.',
        'Prefira **SAPS 3 ou APACHE IV** quando quiser estimativa prognóstica mais calibrada à prática contemporânea, e o **SOFA** quando o objetivo for acompanhar a evolução da disfunção orgânica ao longo da internação — o APACHE não foi feito para uso seriado.',
        'Nunca use o escore isoladamente para **limitar suporte**. Decisões de fim de vida devem se basear na trajetória clínica, na reversibilidade da causa, na função prévia e nos valores do paciente, discutidos com a família. Um número derivado de coorte de quatro décadas atrás não substitui essa conversa.',
      ],
      interpretacao: [
        'O APACHE II usa o **pior valor de cada variável nas primeiras 24 horas** de internação em terapia intensiva. Colher os valores da admissão em vez do pior valor do dia subestima sistematicamente o escore.',
        'Foi desenvolvido em 1985 e permanece o escore de gravidade mais citado da literatura, embora hoje esteja **mal calibrado** para populações contemporâneas: a mortalidade real da terapia intensiva caiu muito desde os anos 1980, e o APACHE II superestima. SAPS 3 e APACHE IV têm calibração melhor.',
        'Em **pancreatite aguda**, APACHE II ≥ 8 nas primeiras 24 horas define quadro grave — é uma das poucas aplicações fora da terapia intensiva geral em que o escore permanece no algoritmo diagnóstico.',
        '**O escore descreve populações, não indivíduos.** Um APACHE II de 30 significa que, num grupo de pacientes semelhantes, cerca de três em quatro morreriam — não que este paciente tenha 75% de chance de morrer. Usá-lo para limitar cuidado individual é uma extrapolação que os autores rejeitaram explicitamente.',
      ],
      alertas: ['O escore não se aplica a queimados, a pacientes coronarianos pós-cirúrgicos, a menores de 16 anos nem a internações com menos de 8 horas.'],
    }
  },
  formula: ['APACHE II = escore fisiológico agudo (12 variáveis) + pontos por idade + pontos por saúde crônica'],
  fundamento:
    'O APACHE parte da premissa de que a gravidade da doença aguda pode ser quantificada pelo grau de desvio das variáveis fisiológicas em relação ao normal, e que esse desvio é modulado por dois fatores prévios: a idade (reserva fisiológica) e a doença crônica (reserva de órgão). Cada variável recebe pontos proporcionais ao afastamento da faixa normal, em ambas as direções — hipotermia e hipertermia pontuam igualmente.',
  armadilhas: [
    'A escala de Glasgow em paciente sedado prejudica o escore. Use o melhor valor antes da sedação.',
    'A pontuação da creatinina dobra na lesão renal aguda; esquecer esse detalhe subestima o escore em pacientes graves.',
  ],
  referencias: [
    { texto: 'Knaus WA, Draper EA, Wagner DP, Zimmerman JE. APACHE II: a severity of disease classification system. Crit Care Med. 1985;13(10):818-829.' },
    { texto: 'Zimmerman JE, Kramer AA, McNair DS, Malila FM. Acute Physiology and Chronic Health Evaluation (APACHE) IV: hospital mortality assessment for today\'s critically ill patients. Crit Care Med. 2006;34(5):1297-1310.' },
  ],
}

const saps3: Ferramenta = {
  id: 'saps-3',
  nome: 'SAPS 3',
  sinonimos: ['saps', 'saps 3', 'gravidade uti', 'simplified acute physiology'],
  resumo: 'Escore de gravidade baseado na primeira hora de admissão em terapia intensiva.',
  categorias: ['emergencia'],
  campos: [
    campoOpc('idade', 'Idade', [
      { valor: '0', rotulo: 'Menos de 40 anos', pontos: 0 },
      { valor: '5', rotulo: '40 a 59 anos', pontos: 5 },
      { valor: '9', rotulo: '60 a 69 anos', pontos: 9 },
      { valor: '13', rotulo: '70 a 74 anos', pontos: 13 },
      { valor: '15', rotulo: '75 a 79 anos', pontos: 15 },
      { valor: '18', rotulo: '80 anos ou mais', pontos: 18 },
    ]),
    campoOpc('comorbidade', 'Comorbidade de maior peso', [
      { valor: '0', rotulo: 'Nenhuma', pontos: 0 },
      { valor: '3', rotulo: 'Quimioterapia em curso', pontos: 3 },
      { valor: '6', rotulo: 'Insuficiência cardíaca classe IV ou neoplasia hematológica', pontos: 6 },
      { valor: '8', rotulo: 'Cirrose ou aids', pontos: 8 },
      { valor: '11', rotulo: 'Neoplasia metastática', pontos: 11 },
    ]),
    campoOpc('internacao', 'Tempo de internação hospitalar antes da UTI', [
      { valor: '0', rotulo: 'Menos de 14 dias', pontos: 0 },
      { valor: '6', rotulo: '14 a 27 dias', pontos: 6 },
      { valor: '7', rotulo: '28 dias ou mais', pontos: 7 },
    ]),
    campoOpc('origem', 'Procedência', [
      { valor: '0', rotulo: 'Centro cirúrgico ou sala de recuperação', pontos: 0 },
      { valor: '5', rotulo: 'Emergência', pontos: 5 },
      { valor: '7', rotulo: 'Outra UTI', pontos: 7 },
      { valor: '8', rotulo: 'Outro (enfermaria, outro hospital)', pontos: 8 },
    ]),
    campoSimNao('vasoativo', 'Uso de droga vasoativa antes da admissão na UTI', 3, 'Vasopressor ou inotrópico em uso na hora anterior à admissão na UTI, em qualquer dose.'),
    campoSimNao('naoPlanejada', 'Admissão não planejada', 3, 'Admissão que não estava programada no momento em que a cirurgia ou a internação começou.'),
    campoOpc('cirurgia', 'Condição cirúrgica', [
      { valor: '0', rotulo: 'Cirurgia eletiva', pontos: 0 },
      { valor: '5', rotulo: 'Sem cirurgia', pontos: 5 },
      { valor: '6', rotulo: 'Cirurgia de urgência', pontos: 6 },
    ]),
    campoOpc('infeccao', 'Infecção na admissão', [
      { valor: '0', rotulo: 'Ausente ou comunitária não respiratória', pontos: 0 },
      { valor: '4', rotulo: 'Nosocomial', pontos: 4 },
      { valor: '5', rotulo: 'Respiratória', pontos: 5 },
    ]),
    campoOpc('gcs', 'Escala de Coma de Glasgow', [
      { valor: '0', rotulo: '15', pontos: 0 },
      { valor: '2', rotulo: '13 a 14', pontos: 2 },
      { valor: '5', rotulo: '7 a 12', pontos: 5 },
      { valor: '10', rotulo: '5 a 6', pontos: 10 },
      { valor: '15', rotulo: '3 a 4', pontos: 15 },
    ]),
    campoOpc('bilirrubina', 'Bilirrubina', [
      { valor: '0', rotulo: 'Menos de 2 mg/dL', pontos: 0 },
      { valor: '4', rotulo: '2 a 5,9 mg/dL', pontos: 4 },
      { valor: '5', rotulo: '6 mg/dL ou mais', pontos: 5 },
    ]),
    campoSimNao('temperatura', 'Temperatura < 35 °C', 7),
    campoOpc('creatinina', 'Creatinina', [
      { valor: '0', rotulo: 'Menos de 1,2 mg/dL', pontos: 0 },
      { valor: '2', rotulo: '1,2 a 1,9 mg/dL', pontos: 2 },
      { valor: '7', rotulo: '2,0 a 3,4 mg/dL', pontos: 7 },
      { valor: '8', rotulo: '3,5 mg/dL ou mais', pontos: 8 },
    ]),
    campoOpc('fc', 'Frequência cardíaca', [
      { valor: '0', rotulo: 'Menos de 120 bpm', pontos: 0 },
      { valor: '5', rotulo: '120 a 159 bpm', pontos: 5 },
      { valor: '7', rotulo: '160 bpm ou mais', pontos: 7 },
    ]),
    campoSimNao('leucocitos', 'Leucócitos ≥ 15.000/mm³', 2),
    campoSimNao('ph', 'pH ≤ 7,25', 3),
    campoOpc('plaquetas', 'Plaquetas', [
      { valor: '0', rotulo: '100.000/mm³ ou mais', pontos: 0 },
      { valor: '5', rotulo: '50.000 a 99.000/mm³', pontos: 5 },
      { valor: '8', rotulo: '20.000 a 49.000/mm³', pontos: 8 },
      { valor: '13', rotulo: 'Menos de 20.000/mm³', pontos: 13 },
    ]),
    campoOpc('pas', 'PA sistólica', [
      { valor: '0', rotulo: '120 mmHg ou mais', pontos: 0 },
      { valor: '3', rotulo: '70 a 119 mmHg', pontos: 3 },
      { valor: '8', rotulo: '40 a 69 mmHg', pontos: 8 },
      { valor: '11', rotulo: 'Menos de 40 mmHg', pontos: 11 },
    ]),
    campoOpc('oxigenacao', 'Oxigenação', [
      { valor: '0', rotulo: 'PaO₂ ≥ 60 mmHg sem ventilação mecânica', pontos: 0 },
      { valor: '5', rotulo: 'PaO₂ < 60 mmHg sem ventilação mecânica', pontos: 5 },
      { valor: '7', rotulo: 'PaO₂/FiO₂ ≥ 100 com ventilação mecânica', pontos: 7 },
      { valor: '11', rotulo: 'PaO₂/FiO₂ < 100 com ventilação mecânica', pontos: 11 },
    ]),
  ],
  calcular: (v) => {
    const opcoes = ['idade', 'comorbidade', 'internacao', 'origem', 'cirurgia', 'infeccao', 'gcs', 'bilirrubina', 'creatinina', 'fc', 'plaquetas', 'pas', 'oxigenacao']
    let soma = 0
    for (const id of opcoes) {
      const x = num(v, id)
      if (x === null) return null
      soma += x
    }
    soma += somaSimNao(v, [
      { id: 'vasoativo', pontos: 3 },
      { id: 'naoPlanejada', pontos: 3 },
      { id: 'temperatura', pontos: 7 },
      { id: 'leucocitos', pontos: 2 },
      { id: 'ph', pontos: 3 },
    ])
    const saps = 16 + soma
    const logit = -32.6659 + 7.3068 * Math.log(saps + 20.5958)
    const mortalidade = (Math.exp(logit) / (1 + Math.exp(logit))) * 100
    const nivel: Nivel = mortalidade >= 60 ? 'critico' : mortalidade >= 30 ? 'alerta' : mortalidade >= 10 ? 'atencao' : 'ok'
    return {
      titulo: 'SAPS 3',
      valor: String(saps),
      unidade: 'pontos',
      nivel,
      rotuloNivel: `Mortalidade hospitalar estimada: ${fmtPct(mortalidade, 1)}`,
      detalhes: [
        { rotulo: 'Constante do modelo', valor: '16 pontos', nota: 'O SAPS 3 parte de 16 pontos, aos quais se somam os pontos das três caixas.' },
        { rotulo: 'Soma das variáveis', valor: `${soma} pontos` },
        { rotulo: 'Mortalidade estimada (equação global)', valor: fmtPct(mortalidade, 1), nota: 'logit = −32,6659 + 7,3068 × ln(SAPS 3 + 20,5958)' },
      ],
      conduta: [
        'Prefira o SAPS 3 ao APACHE II para estimativa de mortalidade em terapia intensiva contemporânea: ele foi derivado de coorte multinacional recente, usa dados de **±1 hora da admissão** (o que o torna aplicável já na entrada) e possui **equação de calibração específica para a América do Sul**, que corrige o viés de aplicar modelos derivados em outras populações.',
        'Aplique a **equação regional correta**. Usar a equação global em um serviço brasileiro distorce a mortalidade esperada e, portanto, a taxa de mortalidade padronizada — que é justamente o indicador de qualidade que se pretende medir.',
        'Use a **taxa de mortalidade padronizada (observada ÷ esperada)** como indicador de desempenho da unidade: valor abaixo de 1 sugere desempenho melhor que o previsto pela gravidade dos pacientes; acima de 1, pior. Esse é o uso para o qual o escore foi desenhado.',
        'Não use o SAPS 3 para **decisão individual de admissão, alta ou limitação de suporte**. A discriminação em nível individual é insuficiente para isso, e um escore alto em paciente com causa reversível não justifica negar cuidado intensivo.',
        'Combine com **SOFA seriado** para acompanhar a evolução, e registre as variáveis de forma padronizada e auditável. A qualidade da coleta é o principal determinante da utilidade do escore: dados colhidos de forma inconsistente produzem comparações sem sentido entre períodos e entre unidades.',
      ],
      interpretacao: [
        'O SAPS 3 rompeu com a lógica do APACHE em dois pontos importantes. Primeiro, usa os dados da **primeira hora** de admissão, e não as primeiras 24 horas — o que reduz o viés de tratamento (no APACHE, um paciente bem tratado nas primeiras horas parece menos grave e o escore "credita" isso à unidade). Segundo, foi derivado de uma coorte multinacional de mais de 16 mil pacientes de 300 unidades, com equações regionais próprias, inclusive para a América do Sul.',
        'Sua estrutura em três caixas reflete três perguntas: **quem é o paciente** (idade, comorbidade, procedência, tratamento prévio), **por que ele foi internado** (planejamento, cirurgia, infecção, motivo) e **quão grave ele está agora** (fisiologia).',
        'O uso principal é **avaliação de desempenho de unidades de terapia intensiva** por meio da razão entre mortalidade observada e esperada. Razão abaixo de 1 sugere desempenho melhor que o previsto pelo modelo.',
        '⚠ Esta implementação usa as pontuações principais das três caixas. O modelo completo inclui pesos específicos por motivo de admissão e por sítio anatômico cirúrgico, que variam — o resultado aqui é aproximado e serve para estudo e ordenação de gravidade.',
      ],
      alertas: ['Escore de gravidade nunca deve orientar decisão individual de limitação de suporte. Ele descreve probabilidade populacional.'],
    }
  },
  formula: ['SAPS 3 = 16 + soma das três caixas', 'logit = −32,6659 + 7,3068 × ln(SAPS 3 + 20,5958)', 'Mortalidade = e^logit / (1 + e^logit)'],
  fundamento:
    'O SAPS 3 nasceu do reconhecimento de que os escores anteriores estavam mal calibrados fora das populações em que foram derivados. Ele foi construído sobre uma coorte deliberadamente heterogênea e internacional, com equações customizadas por região geográfica, e usa exclusivamente dados da primeira hora — período em que a intervenção da equipe ainda não modificou substancialmente a fisiologia do paciente.',
  armadilhas: [
    'Use a equação regional apropriada quando disponível; a equação global superestima ou subestima conforme a região.',
    'Coletar dados além da primeira hora descaracteriza o escore.',
  ],
  referencias: [
    { texto: 'Moreno RP, Metnitz PG, Almeida E, et al. SAPS 3 — From evaluation of the patient to evaluation of the intensive care unit. Part 2: development of a prognostic model. Intensive Care Med. 2005;31(10):1345-1355.' },
    { texto: 'Silva Junior JM, Malbouisson LMS, Nuevo HL, et al. Aplicabilidade do escore fisiológico agudo simplificado (SAPS 3) em hospitais brasileiros. Rev Bras Anestesiol. 2010;60(1):20-31.' },
  ],
}

const vasoativas: Ferramenta = {
  id: 'drogas-vasoativas',
  nome: 'Drogas vasoativas: dose, diluição e velocidade de infusão',
  sinonimos: ['noradrenalina', 'dobutamina', 'adrenalina', 'mcg/kg/min', 'droga vasoativa', 'diluicao', 'ml/h'],
  resumo: 'Converte entre mcg/kg/min e mL/h em qualquer diluição, com as padronizações usuais.',
  categorias: ['emergencia', 'cardiologia', 'farmacologia'],
  campos: [
    campoPeso(),
    campoOpc('farmaco', 'Fármaco', [
      { valor: 'noradrenalina', rotulo: 'Noradrenalina' },
      { valor: 'adrenalina', rotulo: 'Adrenalina' },
      { valor: 'dobutamina', rotulo: 'Dobutamina' },
      { valor: 'dopamina', rotulo: 'Dopamina' },
      { valor: 'nitroprussiato', rotulo: 'Nitroprussiato de sódio' },
      { valor: 'nitroglicerina', rotulo: 'Nitroglicerina' },
      { valor: 'vasopressina', rotulo: 'Vasopressina' },
      { valor: 'milrinona', rotulo: 'Milrinona' },
    ]),
    campoSeg('direcao', 'O que você quer calcular', [
      { valor: 'para-ml', rotulo: 'Dose → velocidade (mL/h)' },
      { valor: 'para-dose', rotulo: 'Velocidade (mL/h) → dose' },
    ]),
    campoNum('dose', 'Dose desejada', { ajuda: 'Dose desejada na unidade que o fármaco usa — µg/kg/min para noradrenalina e dobutamina, µg/min para algumas padronizações, UI/min para vasopressina. Confundir as unidades é a origem mais comum de erro grave.', unidade: 'mcg/kg/min', min: 0.001, max: 100, passo: 0.01, mostrarSe: (v) => opc(v, 'direcao') === 'para-ml' }),
    campoNum('velocidade', 'Velocidade da bomba', { ajuda: 'Velocidade da bomba em mL/h, para o cálculo no sentido inverso.', unidade: 'mL/h', min: 0.1, max: 500, passo: 0.1, mostrarSe: (v) => opc(v, 'direcao') === 'para-dose' }),
    campoNum('massaMg', 'Massa do fármaco na solução', { ajuda: 'Massa total do fármaco diluída na bolsa, em miligramas.', unidade: 'mg', min: 0.1, max: 5000, passo: 0.1, padrao: '16' }),
    campoNum('volumeMl', 'Volume final da solução', { ajuda: 'Volume final da solução, já contando o diluente e o volume das ampolas.', unidade: 'mL', min: 10, max: 1000, passo: 1, padrao: '250' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const massaMg = num(v, 'massaMg')
    const volumeMl = num(v, 'volumeMl')
    const farmaco = opc(v, 'farmaco')
    if (peso === null || massaMg === null || volumeMl === null || volumeMl <= 0) return null
    const concentracaoMcgMl = (massaMg * 1000) / volumeMl
    const paraMl = opc(v, 'direcao') === 'para-ml'
    let dose: number | null = null
    let velocidade: number | null = null
    if (paraMl) {
      dose = num(v, 'dose')
      if (dose === null) return null
      velocidade = (dose * peso * 60) / concentracaoMcgMl
    } else {
      velocidade = num(v, 'velocidade')
      if (velocidade === null) return null
      dose = (velocidade * concentracaoMcgMl) / (peso * 60)
    }
    const faixas: Record<string, { faixa: string; efeito: string; diluicao: string }> = {
      noradrenalina: { faixa: '0,01 a 3 mcg/kg/min (habitual 0,05 a 1)', efeito: 'Agonista α₁ potente com efeito β₁ modesto. Vasoconstritor de primeira escolha no choque séptico, cardiogênico e hipovolêmico após reposição. Eleva a pressão sem taquicardizar significativamente.', diluicao: 'Padrão comum: 16 mg em 250 mL (64 mcg/mL) ou 4 mg em 250 mL (16 mcg/mL). **Confira sempre se a massa da ampola está expressa como base ou como hemitartarato** — a diferença é de aproximadamente 2 vezes.' },
      adrenalina: { faixa: '0,01 a 0,5 mcg/kg/min', efeito: 'Agonista α e β. Em doses baixas predomina o efeito β (inotrópico e cronotrópico); em doses altas, o α. Segunda linha no choque séptico, primeira na anafilaxia e na parada cardíaca.', diluicao: 'Padrão comum: 6 mg em 100 mL (60 mcg/mL) ou 5 mg em 250 mL (20 mcg/mL).' },
      dobutamina: { faixa: '2,5 a 20 mcg/kg/min', efeito: 'Agonista β₁ predominante. Inotrópico e vasodilatador leve — **pode reduzir a pressão arterial**. Indicada no choque cardiogênico e no baixo débito com pressão preservada.', diluicao: 'Padrão comum: 250 mg em 250 mL (1000 mcg/mL) ou 500 mg em 250 mL (2000 mcg/mL).' },
      dopamina: { faixa: '2 a 20 mcg/kg/min', efeito: 'Efeito dose-dependente: dopaminérgico (< 5), β₁ (5 a 10) e α (> 10). Associa-se a **mais arritmias e maior mortalidade** que a noradrenalina no choque cardiogênico — uso restrito. A "dose renal" foi refutada e não deve ser usada.', diluicao: 'Padrão comum: 250 mg em 250 mL (1000 mcg/mL).' },
      nitroprussiato: { faixa: '0,3 a 10 mcg/kg/min (máximo 10 por curtos períodos)', efeito: 'Vasodilatador arterial e venoso de ação imediata e meia-vida de segundos. Emergência hipertensiva, dissecção de aorta (após betabloqueio) e insuficiência cardíaca com pós-carga elevada.', diluicao: 'Padrão comum: 50 mg em 250 mL (200 mcg/mL). **Proteger da luz** — a fotodegradação libera cianeto.' },
      nitroglicerina: { faixa: '5 a 200 mcg/min (não é por quilo)', efeito: 'Vasodilatador predominantemente venoso em doses baixas, arterial em doses altas. Síndrome coronariana, edema agudo de pulmão, emergência hipertensiva.', diluicao: 'Padrão comum: 50 mg em 250 mL (200 mcg/mL). Contraindicada com inibidor de fosfodiesterase-5 nas últimas 24 a 48 h e em infarto de ventrículo direito.' },
      vasopressina: { faixa: '0,01 a 0,04 U/min (dose fixa, não por quilo)', efeito: 'Agonista de receptor V1, vasoconstritor por via independente das catecolaminas. Adjuvante no choque séptico refratário, permitindo reduzir a dose de noradrenalina.', diluicao: 'Padrão comum: 20 U em 100 mL (0,2 U/mL). Não titule acima de 0,04 U/min — o risco de isquemia digital e mesentérica cresce.' },
      milrinona: { faixa: '0,125 a 0,75 mcg/kg/min', efeito: 'Inibidor da fosfodiesterase-3: inotrópico e vasodilatador ("inodilatador"), com ação independente do receptor beta — útil em quem usa betabloqueador. Meia-vida longa e eliminação renal.', diluicao: 'Padrão comum: 20 mg em 100 mL (200 mcg/mL). Reduzir na disfunção renal.' },
    }
    const info = faixas[farmaco]
    const doseMcgMin = dose! * peso
    return {
      titulo: paraMl ? 'Velocidade de infusão' : 'Dose infundida',
      valor: paraMl ? fmtLivre(velocidade!, 2) : fmtLivre(dose!, 3),
      unidade: paraMl ? 'mL/h' : 'mcg/kg/min',
      nivel: 'alerta',
      rotuloNivel: `${fmtLivre(massaMg, 1)} mg em ${fmtInt(volumeMl)} mL = ${fmtLivre(concentracaoMcgMl, 1)} mcg/mL`,
      detalhes: [
        { rotulo: 'Concentração da solução', valor: `${fmtLivre(concentracaoMcgMl, 1)} mcg/mL`, nota: `${fmtLivre(massaMg / volumeMl, 3)} mg/mL` },
        { rotulo: 'Dose em mcg/min', valor: `${fmtLivre(doseMcgMin, 2)} mcg/min` },
        { rotulo: 'Dose em mcg/kg/min', valor: `${fmtLivre(dose!, 3)} mcg/kg/min` },
        { rotulo: 'Velocidade da bomba', valor: `${fmtLivre(velocidade!, 2)} mL/h` },
        { rotulo: 'Faixa terapêutica usual', valor: info.faixa },
        { rotulo: 'Diluição habitual', valor: info.diluicao },
      ],
      conduta: [
        'Escolha o agente pelo **mecanismo do choque**: **noradrenalina** é primeira linha no choque séptico e na maioria dos choques vasoplégicos; **adrenalina** na anafilaxia e na parada cardiorrespiratória; **dobutamina** no choque cardiogênico com débito baixo e pressão preservada; **vasopressina** como segunda linha poupadora de catecolamina; **dopamina** foi abandonada como primeira escolha por causar mais arritmias.',
        'Confira a diluição e a unidade **antes de conectar**: a maioria dos erros graves nasce da confusão entre µg/kg/min e µg/min, e entre diluições padronizadas diferentes. Prescreva a concentração explícita, use bomba de infusão dedicada e etiquete a via — nunca infunda vasopressor em via compartilhada com bolus.',
        'Não atrase o vasopressor por falta de acesso central: a **infusão periférica é aceitável nas primeiras horas**, em veia calibrosa proximal (fossa antecubital ou acima), com vigilância rigorosa do sítio. Se houver extravasamento de noradrenalina, infiltre **fentolamina** localmente para evitar necrose.',
        'Titule pela **perfusão, não só pela pressão**: PAM ≥ 65 mmHg é o alvo inicial, mas o que importa é lactato em queda, diurese, enchimento capilar e estado mental. Alvos pressóricos mais altos (80–85 mmHg) só em hipertensos crônicos, e ao custo de mais fibrilação atrial.',
        'Antes de escalar a dose, **procure o que está sustentando o choque**: hipovolemia não corrigida, pneumotórax hipertensivo, tamponamento, acidose grave, hipocalcemia, **insuficiência adrenal** (considere hidrocortisona 200 mg/dia no choque refratário) e foco infeccioso não controlado. Dose crescente de vasopressor sem reavaliação diagnóstica é o padrão que precede a morte evitável.',
      ],
      interpretacao: [
        info.efeito,
        '**A conta é sempre a mesma**, e vale a pena entendê-la em vez de decorar: a dose está em microgramas por quilo por **minuto**, e a bomba trabalha em mililitros por **hora**. Multiplicar por 60 converte minutos em horas; multiplicar pelo peso converte "por quilo" em dose absoluta; dividir pela concentração converte microgramas em mililitros.',
        '**Padronize as diluições no serviço.** A maior parte dos erros graves com vasoativos vem de diluições improvisadas e de trocas de plantão sem conferência da concentração. Etiquete a bolsa com o fármaco, a massa, o volume e a concentração final.',
        'Vasoativos devem correr preferencialmente em **acesso central e em via exclusiva**. A administração periférica de noradrenalina é aceitável e segura por períodos curtos, em veia calibrosa, com vigilância do sítio — não é motivo para atrasar o início do vasopressor.',
      ],
      alertas: [
        'Extravasamento de noradrenalina causa necrose tecidual. O tratamento é infiltração local de fentolamina; se indisponível, considere nitroglicerina tópica.',
        'Nunca faça bolus de vasoativo em infusão contínua. "Lavar" a via de um vasopressor pode provocar pico hipertensivo grave.',
      ],
    }
  },
  formula: [
    'Concentração (mcg/mL) = massa (mg) × 1000 ÷ volume (mL)',
    'Velocidade (mL/h) = dose (mcg/kg/min) × peso (kg) × 60 ÷ concentração (mcg/mL)',
    'Dose (mcg/kg/min) = velocidade (mL/h) × concentração (mcg/mL) ÷ (peso × 60)',
  ],
  fundamento:
    'Toda infusão contínua é uma conversão entre três grandezas: massa de fármaco, tempo e volume. A dose clínica é expressa por quilo e por minuto porque o efeito hemodinâmico escala com a massa corporal e a meia-vida das catecolaminas é de segundos a poucos minutos — o efeito é praticamente instantâneo e reflete a taxa de entrega, não a dose acumulada. A escolha do vasoativo é uma escolha de receptor. **Alfa-1** produz vasoconstrição arteriolar e eleva a resistência periférica; **beta-1** aumenta contratilidade e frequência; **beta-2** vasodilata e broncodilata; **V1** vasoconstringe por via independente de catecolamina, útil quando a acidose dessensibiliza os receptores adrenérgicos; **dopaminérgicos** dilatam os leitos renal e esplâncnico. A noradrenalina é a primeira linha no choque vasoplégico porque é alfa-1 potente com beta-1 modesto, sustentando a pressão com menos taquiarritmia que a dopamina e a adrenalina.',
  armadilhas: [
    'Nitroglicerina e vasopressina são prescritas em dose **fixa** (mcg/min e U/min), não por quilo. Aplicar a fórmula por peso a esses fármacos gera erro grosseiro.',
    'A apresentação da noradrenalina varia entre países e fabricantes. Confirme se a rotulagem se refere à base ou ao sal.',
  ],
  referencias: [
    { texto: 'Evans L, Rhodes A, Alhazzani W, et al. Surviving Sepsis Campaign 2021. Crit Care Med. 2021;49(11):e1063-e1143.' },
    { texto: 'De Backer D, Biston P, Devriendt J, et al. Comparison of dopamine and norepinephrine in the treatment of shock. N Engl J Med. 2010;362(9):779-789.' },
  ],
}

const infusao: Ferramenta = {
  id: 'taxa-infusao',
  nome: 'Taxa de infusão, gotejamento e tempo de soro',
  sinonimos: ['gotas por minuto', 'gotejamento', 'macrogotas', 'microgotas', 'ml/h', 'soro'],
  resumo: 'Converte entre volume, tempo, mL/h, macrogotas e microgotas por minuto.',
  categorias: ['emergencia', 'farmacologia'],
  campos: [
    campoSeg('modo', 'O que você tem', [
      { valor: 'volume-tempo', rotulo: 'Volume e tempo' },
      { valor: 'gotas', rotulo: 'Gotas por minuto' },
      { valor: 'mlh', rotulo: 'mL/h' },
    ]),
    campoNum('volume', 'Volume a infundir', { unidade: 'mL', min: 1, max: 10000, passo: 1, ajuda: 'Volume total da bolsa ou do frasco a ser administrado.', mostrarSe: (v) => opc(v, 'modo') === 'volume-tempo' }),
    campoNum('horas', 'Tempo de infusão', { unidade: 'h', min: 0.1, max: 72, passo: 0.1, ajuda: 'Em horas, aceitando fração (0,5 para 30 minutos; 0,25 para 15 minutos).', mostrarSe: (v) => opc(v, 'modo') === 'volume-tempo' }),
    campoNum('gotasMin', 'Gotas por minuto', { unidade: 'gtt/min', min: 1, max: 300, passo: 1, ajuda: 'Conte por 60 segundos completos. Contar por 15 segundos e multiplicar por 4 amplifica o erro de contagem em quatro vezes.', mostrarSe: (v) => opc(v, 'modo') === 'gotas' }),
    campoSeg('equipo', 'Equipo', [
      { valor: '20', rotulo: 'Macrogotas (20 gtt/mL)' },
      { valor: '60', rotulo: 'Microgotas (60 gtt/mL)' },
      { valor: '15', rotulo: 'Macrogotas de 15 gtt/mL' },
    ], { mostrarSe: (v) => opc(v, 'modo') === 'gotas' }),
    campoNum('mlh', 'Velocidade', { unidade: 'mL/h', min: 0.1, max: 2000, passo: 0.1, mostrarSe: (v) => opc(v, 'modo') === 'mlh' }),
    campoNum('volumeTotal', 'Volume total da bolsa', { unidade: 'mL', min: 1, max: 5000, passo: 1, opcional: true, mostrarSe: (v) => opc(v, 'modo') !== 'volume-tempo' }),
  ],
  calcular: (v) => {
    const modo = opc(v, 'modo')
    let mlh: number | null = null
    let volume: number | null = null
    let horas: number | null = null
    if (modo === 'volume-tempo') {
      volume = num(v, 'volume')
      horas = num(v, 'horas')
      if (volume === null || horas === null || horas <= 0) return null
      mlh = volume / horas
    } else if (modo === 'gotas') {
      const gtt = num(v, 'gotasMin')
      const fator = Number(opc(v, 'equipo') || '20')
      if (gtt === null) return null
      mlh = (gtt * 60) / fator
      volume = num(v, 'volumeTotal')
      horas = volume !== null ? volume / mlh : null
    } else {
      mlh = num(v, 'mlh')
      if (mlh === null) return null
      volume = num(v, 'volumeTotal')
      horas = volume !== null && mlh > 0 ? volume / mlh : null
    }
    const macro = (mlh! * 20) / 60
    const micro = (mlh! * 60) / 60
    const macro15 = (mlh! * 15) / 60
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Velocidade', valor: `${fmtLivre(mlh!, 1)} mL/h` },
      { rotulo: 'Macrogotas (20 gtt/mL)', valor: `${fmtInt(macro)} gtt/min`, nota: 'Atalho clássico: macrogotas por minuto = volume (mL) ÷ (tempo em horas × 3).' },
      { rotulo: 'Microgotas (60 gtt/mL)', valor: `${fmtInt(micro)} µgtt/min`, nota: 'Microgotas por minuto = mL/h. É a coincidência mais útil da enfermagem: em equipo de microgotas, o número de gotas por minuto é igual à velocidade em mL/h.' },
      { rotulo: 'Macrogotas (15 gtt/mL)', valor: `${fmtInt(macro15)} gtt/min`, nota: 'Alguns equipos usam fator 15 — confira na embalagem antes de calcular.' },
    ]
    if (volume !== null && horas !== null) {
      detalhes.push({ rotulo: 'Volume total', valor: `${fmtInt(volume)} mL` })
      detalhes.push({ rotulo: 'Tempo de infusão', valor: `${fmt(horas, 2)} h`, nota: `${fmtInt(horas * 60)} minutos.` })
      detalhes.push({ rotulo: 'Término previsto', valor: `${fmtInt(Math.floor(horas))} h ${fmtInt((horas % 1) * 60)} min a partir do início` })
    }
    return {
      titulo: 'Velocidade de infusão',
      valor: fmtLivre(mlh!, 1),
      unidade: 'mL/h',
      nivel: 'neutro',
      detalhes,
      interpretacao: [
        'O **fator de gotejamento** do equipo é o número de gotas necessárias para formar 1 mL. Macrogotas padrão usam 20 gotas por mL; microgotas usam 60. O fator vem impresso na embalagem e varia entre fabricantes — conferir é parte do preparo.',
        'A relação "microgotas por minuto = mL por hora" não é coincidência: 60 gotas por mL dividido por 60 minutos por hora dá exatamente 1. Por isso o equipo de microgotas é o de escolha quando se quer precisão sem bomba, sobretudo em pediatria.',
        '**Confira o gotejamento visualmente pelo menos uma vez por plantão.** Equipos por gravidade mudam de velocidade com a posição do membro, a altura do frasco e a obstrução parcial do cateter — a taxa programada não é a taxa entregue.',
        'A física do gotejamento explica por que ele é impreciso e por que a bomba existe. Na infusão por gravidade, o fluxo obedece à lei de Hagen-Poiseuille: é proporcional à quarta potência do raio do cateter e à diferença de pressão, e inversamente proporcional à viscosidade e ao comprimento do sistema. Cada termo dessa equação é instável à beira do leito. A **diferença de pressão** depende da altura do frasco acima do átrio direito e muda quando o paciente senta, deita ou eleva o braço; ela também cai à medida que o frasco esvazia. O **raio efetivo** muda com a posição do membro (flexão do cotovelo com cateter em fossa antecubital), com encostamento da ponta na parede do vaso e com formação de fibrina. A **viscosidade** é maior em manitol, hemoderivados e nutrição parenteral, que gotejam mais devagar que o calculado. E o próprio **tamanho da gota** varia com a viscosidade e a tensão superficial do líquido, o que significa que o fator do equipo, calibrado para soluções aquosas, erra com concentrados. O somatório dessas variações produz desvios que podem passar de 20 a 30% da taxa pretendida — irrelevante para hidratação de manutenção, inaceitável para noradrenalina, insulina ou sedativo.',
      ],
      conduta: [
        '**Confira o fator de gotejamento impresso na embalagem do equipo antes de calcular.** Macrogotas padrão usam 20 gotas por mL e microgotas usam 60, mas há fabricantes com 10, 15 ou 60 — usar o fator errado altera o resultado em até três vezes.',
        'Use **bomba de infusão obrigatoriamente** para vasoativos, insulina, sedativos, opioides em infusão contínua, quimioterápicos, heparina, potássio concentrado e qualquer fármaco de janela terapêutica estreita. Gotejamento por gravidade nesses casos é erro de segurança, não economia.',
        'Em **pediatria e neonatologia**, prefira microgotas ou bomba mesmo para hidratação, e use bureta com volume limitado ao previsto para as próximas horas — assim uma falha de gotejamento não infunde o frasco inteiro.',
        'Memorize os dois atalhos que dispensam calculadora: **macrogotas por minuto ≈ volume ÷ (3 × horas)** e **microgotas por minuto = mL/h**. O segundo não é coincidência: 60 gotas por mL divididas por 60 minutos por hora dão exatamente 1.',
        '**Confira visualmente pelo menos uma vez por plantão** e sempre após mobilizar o paciente. Registre o horário de início e o volume restante esperado, para que o próximo turno consiga detectar desvio sem recalcular tudo.',
        'Ao trocar o frasco ou o equipo, recalcule e reconfira — é o momento de maior risco de erro. E rotule a bolsa com fármaco, dose, diluente, concentração final, velocidade e horário de preparo.',
      ],
      alertas: [
        'Nunca use gotejamento por gravidade para **vasoativos, insulina, sedativos ou qualquer fármaco de janela estreita**. A variação inerente da infusão por gravidade pode passar de 20 a 30% da taxa pretendida.',
        'O fator do equipo **varia entre fabricantes** e vem impresso na embalagem. Conferi-lo é parte do preparo, não detalhe.',
        'Soluções viscosas (manitol, hemoderivados, nutrição parenteral) gotejam mais devagar que o calculado, e o tamanho da gota também muda — o fator do equipo é calibrado para soluções aquosas.',
        'A taxa programada não é a taxa entregue: altura do frasco, posição do membro, esvaziamento da bolsa e obstrução parcial do cateter alteram o fluxo continuamente.',
        'Em criança pequena, use bureta com volume limitado às próximas horas. É a barreira que impede que uma falha de gotejamento se transforme em sobrecarga hídrica grave.',
      ],
    }
  },
  formula: [
    'mL/h = volume (mL) ÷ tempo (h)',
    'Gotas/min = mL/h × fator do equipo ÷ 60',
    'Macrogotas/min = volume (mL) ÷ (tempo em horas × 3)',
    'Microgotas/min = mL/h',
  ],
  fundamento:
    'A conversão é aritmética pura, mas o erro é frequente porque envolve duas mudanças de unidade simultâneas — volume para gotas e hora para minuto. Fixar o atalho "volume dividido por três vezes as horas" para macrogotas e "microgotas igual a mL/h" cobre a esmagadora maioria das situações de beira de leito sem calculadora. O **fator de gotejamento** é o número de gotas necessárias para formar 1 mL, e vem impresso na embalagem porque depende do desenho do gotejador: macrogotas padrão usam 20 gotas por mL e microgotas usam 60. A elegância do equipo de microgotas está em que 60 gotas por mL divididas por 60 minutos por hora resultam exatamente em 1 — de modo que microgotas por minuto e mL por hora são o mesmo número, o que o torna a escolha natural quando se quer precisão sem bomba, sobretudo em pediatria. O limite da técnica, porém, é físico e não aritmético. O fluxo por gravidade segue a lei de Hagen-Poiseuille, sendo proporcional à quarta potência do raio e à diferença de pressão, e inversamente proporcional à viscosidade e ao comprimento do sistema. Todos esses termos oscilam à beira do leito: a pressão hidrostática cai conforme o frasco esvazia e muda com a posição do paciente; o raio efetivo varia com flexão do membro, encostamento da ponta do cateter e fibrina; a viscosidade é maior em manitol, hemoderivados e nutrição parenteral; e o próprio tamanho da gota depende da tensão superficial do líquido, o que faz o fator calibrado para soluções aquosas errar com concentrados. Somadas, essas variações produzem desvios que podem passar de 20 a 30% — irrelevantes para hidratação de manutenção, inaceitáveis para noradrenalina, insulina ou sedativo, e é essa diferença de tolerância ao erro que define quando a bomba deixa de ser conforto e passa a ser requisito de segurança.',
  armadilhas: [
    'Soluções viscosas (manitol, hemoderivados, nutrição parenteral) gotejam mais devagar do que o calculado por gravidade.',
    'Nunca use gotejamento por gravidade para vasoativos, insulina, sedativos ou qualquer fármaco de janela estreita — use bomba de infusão.',
    'O fator do equipo varia entre fabricantes (10, 15, 20 ou 60 gotas/mL). Assumir 20 sem conferir a embalagem é a fonte de erro mais comum, e pode triplicar ou reduzir a um terço a velocidade real.',
    'A taxa entregue não é a programada: altura do frasco, posição do membro, esvaziamento da bolsa e obstrução parcial alteram o fluxo continuamente. Confira visualmente.',
    'Contar gotas por 15 segundos e multiplicar por 4 amplifica o erro de contagem em quatro vezes. Conte por 60 segundos quando a precisão importar.',
    'Trocar frasco ou equipo é o momento de maior risco: recalcule e reconfira, e rotule a bolsa com fármaco, concentração final, velocidade e horário de preparo.',
    'Em pediatria, use bureta com volume limitado às próximas horas — a barreira física que impede uma falha de gotejamento de virar sobrecarga hídrica.',
  ],
  referencias: [
    { texto: 'Institute for Safe Medication Practices. Guidelines for optimizing safe implementation and use of smart infusion pumps. 2020.' },
    { texto: 'Institute for Safe Medication Practices. ISMP List of High-Alert Medications in Acute Care Settings. 2024.' },
    { texto: 'Agência Nacional de Vigilância Sanitária. Protocolo de segurança na prescrição, uso e administração de medicamentos. Ministério da Saúde; 2013.' },
  ],
}

const volemia: Ferramenta = {
  id: 'reposicao-volemica',
  nome: 'Reposição volêmica: sepse, trauma, queimadura e desidratação',
  sinonimos: ['reposicao volemica', 'parkland', 'cristaloide', 'ressuscitacao volemica', 'queimadura'],
  resumo: 'Calcula o volume inicial em cada cenário e resume os alvos de reavaliação.',
  categorias: ['emergencia', 'cirurgia'],
  campos: [
    campoPeso(),
    campoOpc('cenario', 'Cenário', [
      { valor: 'sepse', rotulo: 'Sepse e choque séptico' },
      { valor: 'trauma', rotulo: 'Trauma hemorrágico' },
      { valor: 'queimadura', rotulo: 'Queimadura' },
      { valor: 'desidratacao', rotulo: 'Desidratação / hipovolemia não hemorrágica' },
    ], { ajuda: 'A estratégia muda radicalmente entre os cenários — e em trauma hemorrágico ela é OPOSTA à da sepse: aqui se limita o cristaloide e se aceita hipotensão permissiva até a hemostasia, porque elevar a pressão desloca coágulos.' }),
    campoNum('scq', 'Superfície corporal queimada', { unidade: '%', min: 1, max: 100, passo: 1, ajuda: 'Regra dos nove: cabeça e pescoço 9%, cada membro superior 9%, cada membro inferior 18%, tronco anterior 18%, posterior 18%, períneo 1%. A palma com os dedos equivale a cerca de 1%. Queimaduras de PRIMEIRO grau (eritema simples) NÃO entram na conta. Em crianças use Lund-Browder: a cabeça chega a 19% no lactente.', mostrarSe: (v) => opc(v, 'cenario') === 'queimadura' }),
    campoNum('desidratacaoPct', 'Grau de desidratação', { unidade: '%', min: 1, max: 15, passo: 1, padrao: '8', mostrarSe: (v) => opc(v, 'cenario') === 'desidratacao' }),
    campoSeg('solucao', 'Solução', [
      { valor: 'balanceada', rotulo: 'Cristaloide balanceado (Ringer lactato, Plasma-Lyte)' },
      { valor: 'salina', rotulo: 'Salina 0,9%' },
    ]),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const cenario = opc(v, 'cenario')
    if (peso === null) return null
    const detalhes: Resultado['detalhes'] = []
    let principal = ''
    let valor = ''
    const interp: string[] = []
    if (cenario === 'sepse') {
      const inicial = peso * 30
      principal = 'Volume inicial na sepse'
      valor = `${fmtInt(inicial)} mL`
      detalhes.push({ rotulo: 'Volume inicial (30 mL/kg)', valor: `${fmtInt(inicial)} mL`, nota: 'Recomendação da Surviving Sepsis Campaign para hipotensão ou lactato ≥ 4 mmol/L, nas primeiras 3 horas.' })
      detalhes.push({ rotulo: 'Alíquotas de reavaliação', valor: `${fmtInt(peso * 5)} a ${fmtInt(peso * 10)} mL`, nota: 'Em cardiopatas, nefropatas dialíticos e cirróticos, prefira alíquotas de 250 a 500 mL com reavaliação a cada uma.' })
      detalhes.push({ rotulo: 'Alvo de pressão', valor: 'PAM ≥ 65 mmHg', nota: 'Inicie vasopressor se a hipotensão persistir durante ou após a reposição — não espere terminar o volume.' })
      interp.push(
        '**Os 30 mL/kg são ponto de partida, não dogma.** O ensaio CLOVERS não mostrou diferença de mortalidade entre estratégia liberal de fluidos e estratégia restritiva com vasopressor precoce. O que importa é reavaliar: expandir às cegas até completar o volume prescrito causa sobrecarga, e sobrecarga hídrica associa-se independentemente a mortalidade.',
        '**Cristaloide balanceado é preferível à salina 0,9%.** Os ensaios SMART e BaSICS mostraram menos eventos renais adversos com soluções balanceadas; a salina em grande volume causa acidose hiperclorêmica e vasoconstrição renal.',
        '**Avalie responsividade a volume** antes de expandir mais: elevação passiva das pernas com medida de débito, variação de pressão de pulso em ventilado sem esforço e em ritmo regular, variação do diâmetro da veia cava, ou prova de volume com alíquota pequena. Pressão venosa central isolada **não** prediz resposta.',
      )
    } else if (cenario === 'trauma') {
      principal = 'Estratégia no trauma'
      valor = 'Hipotensão permissiva'
      detalhes.push({ rotulo: 'Cristaloide inicial', valor: '≤ 1000 mL', nota: 'Volume limitado. O excesso de cristaloide dilui fatores de coagulação, agrava a hipotermia e desloca coágulos formados.' })
      detalhes.push({ rotulo: 'Hemocomponentes', valor: 'Relação equilibrada 1:1:1', nota: 'Hemácias, plasma e plaquetas em proporção equilibrada — resultado do ensaio PROPPR. Acione o protocolo de transfusão maciça precocemente.' })
      detalhes.push({ rotulo: 'Ácido tranexâmico', valor: '1 g em 10 min + 1 g em 8 h', nota: 'Em até 3 horas do trauma (ensaio CRASH-2). Depois desse prazo, o benefício desaparece e pode haver dano.' })
      detalhes.push({ rotulo: 'Alvo pressórico', valor: 'PAS 80 a 90 mmHg até a hemostasia', nota: '**Exceto em traumatismo cranioencefálico**, em que o alvo é PAS ≥ 110 mmHg para preservar a perfusão cerebral.', nivel: 'alerta' })
      interp.push(
        '**A tríade letal do trauma** — hipotermia, acidose e coagulopatia — é agravada pela reposição excessiva de cristaloide. A estratégia moderna é **ressuscitação de controle de danos**: volume mínimo, hemocomponentes precoces em proporção equilibrada, controle rápido do sangramento e aquecimento agressivo.',
        'A hipotensão permissiva parte de uma lógica simples: enquanto o sangramento não estiver controlado, elevar a pressão desloca coágulos e aumenta a perda. O conceito não se aplica a traumatismo craniano, em que a hipotensão é devastadora.',
      )
    } else if (cenario === 'queimadura') {
      const scq = num(v, 'scq')
      if (scq === null) return null
      const parkland = 4 * peso * scq
      const modificado = 2 * peso * scq
      principal = 'Fórmula de Parkland (24 h)'
      valor = `${fmtInt(parkland)} mL`
      detalhes.push({ rotulo: 'Parkland — total em 24 h', valor: `${fmtInt(parkland)} mL`, nota: '4 mL × peso × % de superfície corporal queimada, com Ringer lactato.' })
      detalhes.push({ rotulo: 'Primeiras 8 h (metade)', valor: `${fmtInt(parkland / 2)} mL`, nota: `Aproximadamente ${fmtInt(parkland / 16)} mL/h. **Conte a partir do momento da queimadura**, não da chegada ao hospital.`, nivel: 'alerta' })
      detalhes.push({ rotulo: 'Próximas 16 h (metade)', valor: `${fmtInt(parkland / 2)} mL`, nota: `Aproximadamente ${fmtInt(parkland / 32)} mL/h.` })
      detalhes.push({ rotulo: 'Fórmula restritiva (ABA modificada)', valor: `${fmtInt(modificado)} mL em 24 h`, nota: '2 mL/kg/% é o ponto de partida atual em muitos centros, pelo reconhecimento do "fluid creep" — a sobrecarga hídrica iatrogênica que gera síndrome compartimental abdominal e de extremidades.' })
      detalhes.push({ rotulo: 'Alvo de diurese', valor: '0,5 mL/kg/h em adultos (1 mL/kg/h em crianças)', nota: `Aproximadamente ${fmtInt(peso * 0.5)} mL/h. **A diurese é o alvo, a fórmula é só o ponto de partida** — titule para cima ou para baixo a cada hora.`, nivel: 'alerta' })
      detalhes.push({ rotulo: 'Critério de reposição formal', valor: scq >= 20 ? 'Sim (SCQ ≥ 20% em adultos)' : 'Não pela extensão', nota: 'Em crianças, o limiar é 10 a 15%. Abaixo disso, hidratação oral costuma bastar.' })
      interp.push(
        'A regra dos nove estima a superfície queimada: cabeça e pescoço 9%, cada membro superior 9%, cada membro inferior 18%, tronco anterior 18%, tronco posterior 18%, períneo 1%. **Queimaduras de primeiro grau (eritema simples) não entram na conta.** A palma da mão do paciente, com os dedos, equivale a cerca de 1%.',
        'Em crianças, use a tabela de Lund-Browder: a cabeça representa proporcionalmente muito mais superfície (até 19% no lactente) e os membros inferiores, menos.',
        '**Suspeite de lesão inspiratória** diante de queimadura em ambiente fechado, rouquidão, estridor, escarro carbonáceo, queimadura de vibrissas ou face. O edema de via aérea evolui em horas — intube **antes** que a via aérea se torne impossível.',
      )
    } else {
      const pct = numOu(v, 'desidratacaoPct', 8)
      const deficit = (pct / 100) * peso * 1000
      principal = 'Déficit estimado'
      valor = `${fmtInt(deficit)} mL`
      detalhes.push({ rotulo: 'Déficit de volume', valor: `${fmtInt(deficit)} mL`, nota: `${pct}% do peso corporal.` })
      detalhes.push({ rotulo: 'Metade nas primeiras 8 h', valor: `${fmtInt(deficit / 2)} mL`, nota: `Aproximadamente ${fmtInt(deficit / 16)} mL/h.` })
      detalhes.push({ rotulo: 'Manutenção diária', valor: `${fmtInt(peso * 30)} a ${fmtInt(peso * 35)} mL/dia`, nota: '30 a 35 mL/kg/dia no adulto, mais as perdas continuadas.' })
      interp.push(
        'Corrija o déficit de volume antes de se preocupar com a natremia: perfusão vem primeiro. Depois de estabilizada a hemodinâmica, o distúrbio do sódio se corrige na velocidade segura.',
        'A estimativa do déficit por percentual do peso é grosseira porque os sinais clínicos clássicos têm desempenho limitado no adulto: turgor cutâneo é pouco confiável no idoso (a pele perde elasticidade com a idade), mucosas secas ocorrem com respiração bucal, e a hipotensão é tardia. Os achados de melhor rendimento são **hipotensão ortostática**, axila seca, sulcos linguais longitudinais e enchimento capilar prolongado — e mesmo eles funcionam melhor em conjunto que isoladamente.',
        'Vale distinguir **desidratação** de **depleção de volume**, porque o tratamento difere. Desidratação é perda predominante de água livre, com hipernatremia e desidratação intracelular — corrige-se com água livre ou solução hipotônica. Depleção de volume é perda de água **e** sódio (vômitos, diarreia, drenos, terceiro espaço), com contração do extracelular e sódio variável — corrige-se com cristaloide isotônico. Tratar uma como a outra é erro comum: dar água livre a quem perdeu sódio piora a hiponatremia, e dar salina a quem perdeu água livre não corrige a hipernatremia.',
      )
    }
    /* ── Conduta por cenário ── */
    const conduta: string[] = []
    conduta.push(
      '**Reavalie a cada alíquota, não ao fim do volume prescrito.** A reposição volêmica tem curva em U: pouco volume mantém a hipoperfusão, muito causa edema intersticial, disfunção de órgãos e síndrome compartimental. Nenhuma fórmula substitui a reavaliação seriada.',
    )
    if (cenario === 'sepse') {
      conduta.push(
        `Comece com **${fmtInt(peso * 30)} mL** (30 mL/kg) nas primeiras 3 horas se houver hipotensão ou lactato ≥ 4 mmol/L — mas administre em alíquotas de ${fmtInt(peso * 5)} a ${fmtInt(peso * 10)} mL com reavaliação entre elas. Em cardiopata, nefropata dialítico e cirrótico, use alíquotas de 250 a 500 mL.`,
        '**Não espere terminar o volume para iniciar vasopressor.** Se a pressão arterial média não atingir 65 mmHg durante a expansão, comece noradrenalina em paralelo — o ensaio CLOVERS não mostrou diferença de mortalidade entre estratégia liberal de fluidos e restritiva com vasopressor precoce, e a sobrecarga hídrica associa-se independentemente a mortalidade.',
        'Antes de expandir mais, **teste responsividade a volume**: elevação passiva das pernas com medida de débito, variação de pressão de pulso (apenas em ventilado, sem esforço espontâneo e em ritmo regular), variação do diâmetro da veia cava, ou prova de volume com alíquota pequena. Pressão venosa central isolada **não** prediz resposta e não deve ser usada para essa decisão.',
        'Procure ativamente sinais de que já basta: estertores novos, aumento da necessidade de oxigênio, elevação da pressão intra-abdominal, edema periférico progressivo e balanço acumulado muito positivo.',
        'Trate a causa em paralelo — antibiótico na primeira hora, controle de foco e lactato seriado a cada 2 a 4 horas. O clareamento do lactato, e não o volume infundido, é o marcador de resposta.',
      )
    } else if (cenario === 'trauma') {
      conduta.push(
        '**Limite o cristaloide a 1000 mL** e parta para hemocomponentes em proporção equilibrada 1:1:1 (hemácias, plasma e plaquetas). O excesso de cristaloide dilui fatores de coagulação, agrava a hipotermia e desloca coágulos já formados — é a tríade letal sendo alimentada pelo tratamento.',
        '**Ácido tranexâmico 1 g em 10 minutos seguido de 1 g em 8 horas, dentro das primeiras 3 horas** do trauma. Depois desse prazo o benefício desaparece e pode haver dano — o horário do trauma, e não o da chegada, é o que conta.',
        'Mantenha **hipotensão permissiva** com pressão sistólica de 80 a 90 mmHg até a hemostasia definitiva, **exceto em traumatismo cranioencefálico**, em que o alvo é sistólica ≥ 110 mmHg para preservar a perfusão cerebral — nesse caso a hipotensão é devastadora.',
        'Aqueça agressivamente: fluidos aquecidos, mantas térmicas, sala aquecida. A hipotermia piora a coagulopatia de forma não linear e é frequentemente iatrogênica.',
        'Acione o **protocolo de transfusão maciça** precocemente e leve o paciente ao controle cirúrgico ou angiográfico do sangramento — a ressuscitação é ponte, não tratamento.',
      )
    } else if (cenario === 'queimadura') {
      const scqC = num(v, 'scq') ?? 0
      conduta.push(
        `**Conte as horas a partir do momento da queimadura**, não da chegada. Se o paciente chega 3 horas depois, o volume das primeiras 8 horas precisa ser entregue nas 5 restantes — programar a partir da admissão subestima sistematicamente a fase inicial.`,
        `**Titule pela diurese**, que é o alvo real: 0,5 mL/kg/h no adulto (cerca de ${fmtInt(peso * 0.5)} mL/h) e 1 mL/kg/h na criança. A fórmula é ponto de partida; ajuste para cima ou para baixo a cada hora conforme o débito urinário.`,
        'Considere iniciar pela fórmula **restritiva de 2 mL/kg/%** em vez dos 4 mL de Parkland: o reconhecimento do *fluid creep* — sobrecarga hídrica iatrogênica que gera síndrome compartimental abdominal e de extremidades — levou muitos centros a reduzir o ponto de partida.',
        '**Avalie a via aérea antes de qualquer outra coisa** se houver queimadura em ambiente fechado, rouquidão, estridor, escarro carbonáceo ou queimadura de vibrissas e face. O edema evolui em horas: intube **antes** que a via aérea se torne impossível, não depois.',
        scqC >= 20
          ? 'Com superfície queimada ≥ 20% no adulto, a reposição formal está indicada e o paciente deve ser encaminhado a centro de referência em queimados. Avalie necessidade de escarotomia em queimadura circunferencial de tórax ou de membros.'
          : 'Abaixo de 20% de superfície queimada no adulto (10 a 15% na criança), a hidratação oral costuma bastar. Reavalie a extensão com a regra dos nove ou Lund-Browder antes de descartar a reposição formal.',
        'Monitore pressão intra-abdominal em queimaduras extensas: a síndrome compartimental abdominal é complicação da própria ressuscitação e exige reconhecimento precoce.',
      )
    } else {
      conduta.push(
        `Reponha **metade do déficit nas primeiras 8 horas** (cerca de ${fmtInt(((numOu(v, 'desidratacaoPct', 8)) / 100) * peso * 1000 / 2)} mL) e a outra metade nas 16 horas seguintes, somando a manutenção de ${fmtInt(peso * 30)} a ${fmtInt(peso * 35)} mL/dia e as perdas continuadas.`,
        '**Corrija a perfusão antes de se preocupar com a natremia.** Restaurada a hemodinâmica, o distúrbio do sódio se corrige na velocidade segura — e respeite o teto de 8 mEq/L de elevação em 24 horas para evitar desmielinização osmótica.',
        'Atenção à **autocorreção**: ao repor volume, a vasopressina se desliga e o rim passa a excretar água livre rapidamente, elevando o sódio além do planejado. Monitore a cada 2 a 4 horas em hiponatremia significativa.',
        'Prefira a via oral ou enteral quando possível — soro de reidratação oral é eficaz, mais seguro e subutilizado na desidratação leve a moderada.',
        'Identifique e trate a causa das perdas: vômitos, diarreia, poliúria osmótica, febre, drenos e ostomias de alto débito. Repor volume sem estancar a perda é enxugar gelo.',
      )
    }
    const balanceada = opc(v, 'solucao') === 'balanceada'
    detalhes.push({
      rotulo: 'Solução escolhida',
      valor: balanceada ? 'Cristaloide balanceado' : 'Salina 0,9%',
      nota: balanceada
        ? 'Composição mais próxima do plasma, com menos cloro. Evitar Ringer lactato em hepatopatia grave (metabolização do lactato comprometida) e usar com cautela na hipercalemia, embora o potássio de 4 a 5 mEq/L raramente seja problema.'
        : 'Cloro de 154 mEq/L, muito acima do plasmático. Em grande volume causa acidose hiperclorêmica e vasoconstrição renal. Continua indicada na hipercloremia por perda gástrica, na hiponatremia e no traumatismo cranioencefálico.',
    })
    interp.push('Guie a reposição por **resposta dinâmica**, não por meta fixa de volume: elevação passiva de pernas, variação de pressão de pulso ou de volume sistólico, e teste de infusão rápida de 250 mL. Pressão venosa central isolada não prediz resposta a volume e foi abandonada como alvo.')
    interp.push('O balanço hídrico positivo cumulativo associa-se de forma independente a maior mortalidade. Depois da ressuscitação, o objetivo passa a ser **desescalar**: as fases de otimização, estabilização e retirada de volume são tão parte do tratamento quanto o bolus inicial.')
    return {
      conduta,
      titulo: principal,
      valor,
      nivel: 'alerta',
      detalhes,
      interpretacao: interp,
      alertas: ['Reavalie a resposta continuamente. Sobrecarga hídrica é iatrogenia com desfecho mensurável: mais dias de ventilação, mais lesão renal, mais tempo de internação e maior mortalidade.'],
    }
  },
  formula: [
    'Sepse: 30 mL/kg de cristaloide nas primeiras 3 h',
    'Parkland: 4 mL × peso (kg) × % de superfície queimada — metade nas primeiras 8 h',
    'Déficit de volume (mL) = % de desidratação × peso (kg) × 10',
  ],
  fundamento:
    'A reposição volêmica tem uma curva em U: pouco volume mantém a hipoperfusão, muito volume causa edema intersticial, disfunção de órgãos e síndrome compartimental. O conceito atual organiza a terapia em quatro fases (ROSE): **R**essuscitação, **O**timização, **E**stabilização e **E**vacuação — sendo que a última, a fase de balanço negativo, é tão importante quanto a primeira. O que explica o braço descendente dessa curva é a degradação do **glicocálice endotelial**, a camada de glicoproteínas e proteoglicanos que reveste o lúmen vascular e é o verdadeiro determinante da permeabilidade capilar. A equação de Starling revisada mostrou que a pressão oncótica relevante não é a do interstício, e sim a do estreito espaço subglicocálice — de modo que, com o glicocálice íntegro, a reabsorção no extremo venoso é muito menor do que o modelo clássico previa, e o retorno do fluido extravasado se dá quase inteiramente pelos linfáticos. Inflamação, isquemia-reperfusão, cirurgia e hipervolemia degradam essa camada: a hipervolemia estira o átrio, libera **peptídeo natriurético atrial**, e o peptídeo cliva o glicocálice diretamente. Ou seja, expandir demais destrói a barreira que mantém o fluido no vaso, e o volume infundido vaza para o interstício em vez de corrigir a perfusão — um ciclo em que mais volume produz menos volume efetivo, com edema tecidual, maior distância de difusão de oxigênio e disfunção orgânica. Essa mesma fisiologia explica por que os coloides não cumpriram a promessa (os amidos aumentam lesão renal e mortalidade na sepse e estão contraindicados), por que balanço acumulado positivo é preditor independente de mortalidade, e por que a fase de evacuação — remover o excesso ativamente, com diurético ou ultrafiltração — passou a fazer parte do tratamento em vez de ser deixada à natureza.',
  armadilhas: [
    'A fórmula de Parkland conta a partir do horário da queimadura. Se o paciente chega 3 horas depois, o volume das primeiras 8 horas deve ser entregue nas 5 horas restantes.',
    'Coloides (albumina, amido) não são superiores a cristaloides na maioria dos cenários; os amidos aumentam lesão renal e mortalidade na sepse e estão contraindicados.',
  ],
  referencias: [
    { texto: 'Semler MW, Self WH, Wanderer JP, et al. Balanced crystalloids versus saline in critically ill adults (SMART). N Engl J Med. 2018;378(9):829-839.' },
    { texto: 'National Heart, Lung, and Blood Institute PETAL Network. Early restrictive or liberal fluid management for sepsis-induced hypotension (CLOVERS). N Engl J Med. 2023;388(6):499-510.' },
    { texto: 'Baxter CR, Shires T. Physiological response to crystalloid resuscitation of severe burns. Ann N Y Acad Sci. 1968;150(3):874-894.' },
  ],
}

const bicarbonato: Ferramenta = {
  id: 'reposicao-bicarbonato',
  nome: 'Reposição de bicarbonato',
  sinonimos: ['bicarbonato', 'acidose tratamento', 'nabic', 'alcalinizacao'],
  resumo: 'Calcula o déficit e explica os poucos cenários em que repor faz sentido.',
  categorias: ['emergencia', 'nefrologia'],
  campos: [
    campoPeso(),
    campoNum('hco3Atual', 'HCO₃⁻ atual', { unidade: 'mEq/L', min: 1, max: 30, passo: 0.1 }),
    campoNum('hco3Alvo', 'HCO₃⁻ alvo', { unidade: 'mEq/L', min: 8, max: 26, passo: 0.5, padrao: '15', ajuda: 'Na acidose grave, o alvo inicial costuma ser modesto — 12 a 15 mEq/L basta para sair da faixa de risco.' }),
    campoNum('espacoDistribuicao', 'Espaço de distribuição', { min: 0.2, max: 0.9, passo: 0.05, padrao: '0.5', ajuda: '0,4 a 0,5 do peso em acidose leve; até 0,7 a 0,8 em acidose grave, porque o tamponamento intracelular aumenta.' }),
    campoNum('ph', 'pH arterial', { min: 6.5, max: 7.6, passo: 0.01, opcional: true }),
    campoSeg('causa', 'Causa da acidose', [
      { valor: 'perda', rotulo: 'Perda de bicarbonato (diarreia, acidose tubular)' },
      { valor: 'organica', rotulo: 'Ácido orgânico (lactato, cetoácido)' },
      { valor: 'renal', rotulo: 'Uremia / doença renal crônica' },
      { valor: 'intoxicacao', rotulo: 'Intoxicação (salicilato, antidepressivo tricíclico)' },
    ]),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const atual = num(v, 'hco3Atual')
    const alvo = numOu(v, 'hco3Alvo', 15)
    const espaco = numOu(v, 'espacoDistribuicao', 0.5)
    const ph = num(v, 'ph')
    const causa = opc(v, 'causa')
    if (peso === null || atual === null) return null
    const deficit = espaco * peso * (alvo - atual)
    const metade = deficit / 2
    const ampolas = metade / 10
    const indicado = causa === 'perda' || causa === 'renal' || causa === 'intoxicacao' || (ph !== null && ph < 6.9)
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Déficit total calculado', valor: `${fmtInt(deficit)} mEq` },
      { rotulo: 'Metade do déficit (reposição inicial)', valor: `${fmtInt(metade)} mEq`, nota: 'Reponha metade e **redose a gasometria** antes de continuar. Repor o déficit inteiro de uma vez é a receita para alcalose de rebote.', nivel: 'alerta' },
      { rotulo: 'Ampolas de bicarbonato a 8,4%', valor: `${fmt(ampolas, 1)} ampolas de 10 mL`, nota: 'Cada mL de bicarbonato a 8,4% contém 1 mEq. Uma ampola de 10 mL = 10 mEq; um frasco de 250 mL = 250 mEq.' },
      { rotulo: 'Diluição sugerida', valor: `${fmtInt(metade)} mEq em 500 a 1000 mL de água destilada ou glicose a 5%`, nota: 'A infusão de bicarbonato a 8,4% puro em veia periférica é muito hiperosmolar (2000 mOsm/L) e causa flebite e necrose se extravasar.' },
    ]
    if (ph !== null) detalhes.push({ rotulo: 'pH atual', valor: fmt(ph, 2), nota: ph < 6.9 ? 'Abaixo de 6,90: a maioria das diretrizes considera razoável administrar bicarbonato, embora sem benefício demonstrado em desfechos.' : 'Acima de 6,90: o bicarbonato raramente está indicado numa acidose por ácido orgânico.', nivel: ph < 7 ? 'critico' : 'neutro' })
    return {
      titulo: 'Déficit de bicarbonato',
      valor: fmtInt(deficit),
      unidade: 'mEq',
      nivel: indicado ? 'alerta' : 'atencao',
      rotuloNivel: indicado ? 'Cenário em que a reposição costuma fazer sentido' : 'Cenário em que a reposição geralmente NÃO é indicada',
      detalhes,
      conduta: [
        '**Não reponha bicarbonato na cetoacidose diabética nem na acidose lática** de rotina: os ensaios não mostraram benefício, e ele pode piorar a acidose intracelular (o gás carbônico gerado atravessa a membrana mais rápido que o bicarbonato), agravar a hipocalemia e deslocar a curva de dissociação da hemoglobina. O tratamento é da causa — volume, insulina, perfusão, antimicrobiano.',
        'Reserve o bicarbonato para indicações específicas: **acidose com perda de bicarbonato** (diarreia grave, acidose tubular renal, fístula pancreática), **hipercalemia grave com acidose**, **intoxicação por antidepressivo tricíclico** (alvo de pH 7,45–7,55, para reverter o bloqueio de canal de sódio), **intoxicação por salicilato** (alcalinização urinária acelera a eliminação) e **rabdomiólise** em protocolos selecionados.',
        'Quando repor, calcule o **déficit (0,5 × peso × [bicarbonato desejado − medido])** e administre **metade** do valor, reavaliando gasometria em 30–60 minutos. O espaço de distribuição do bicarbonato aumenta quanto mais grave a acidose, tornando o cálculo uma estimativa grosseira.',
        'Antecipe os efeitos adversos: **hipocalemia** (o potássio entra na célula com a correção do pH — redose e reponha), **hipocalcemia ionizada** (a alcalose aumenta a ligação do cálcio à albumina, podendo causar tetania e arritmia), sobrecarga de sódio e volume, e alcalose de rebote.',
        'Em **parada cardiorrespiratória**, o bicarbonato não é rotina: as diretrizes o reservam para hipercalemia conhecida, intoxicação por tricíclicos e acidose preexistente grave. A prioridade é compressão de qualidade e ventilação, que corrigem a acidose respiratória — que é o componente dominante na maioria das paradas.',
      ],
      interpretacao: [
        '**Repor bicarbonato quase nunca é a resposta certa.** Trate a causa: perfusão e antibiótico na acidose lática, insulina e volume na cetoacidose, diálise na uremia. O bicarbonato tem indicação clara em poucos cenários — **perda direta de bicarbonato** (diarreia grave, acidose tubular renal), **acidose da doença renal crônica** (com bicarbonato de sódio oral, que retarda a progressão), **intoxicação por salicilato ou por antidepressivo tricíclico** (alcalinização com finalidade específica) e **hipercalemia grave com acidose**.',
        'Na **acidose lática** e na **cetoacidose**, os ensaios randomizados não mostraram benefício hemodinâmico nem de mortalidade. O ensaio BICAR-ICU sugeriu benefício apenas no subgrupo com lesão renal aguda estágio 2 ou 3.',
        '**Riscos da reposição:** sobrecarga de sódio e volume; hipocalemia (o H⁺ sai da célula e o K⁺ entra); queda do cálcio ionizado com tetania e arritmia; produção de CO₂, que piora a acidose **intracelular** se a ventilação não puder aumentar; e desvio da curva de dissociação da hemoglobina para a esquerda, reduzindo a entrega de oxigênio ao tecido.',
        'O espaço de distribuição varia com a gravidade: cerca de 0,4 a 0,5 do peso em acidose leve, chegando a 0,7 a 0,8 em acidose grave — porque quanto mais ácido, mais tampões intracelulares e ósseos participam.',
      ],
      alertas: [
        'Em paciente ventilado, **aumente o volume-minuto antes** de administrar bicarbonato: o CO₂ gerado precisa ser eliminado, ou a acidose respiratória anula o benefício.',
        'Bicarbonato e cálcio precipitam. Nunca infunda na mesma via sem lavagem intermediária.',
      ],
    }
  },
  formula: [
    'Déficit (mEq) = espaço de distribuição × peso (kg) × (HCO₃⁻ alvo − HCO₃⁻ atual)',
    'Espaço de distribuição = 0,4 a 0,5 (acidose leve) até 0,7 a 0,8 (acidose grave)',
    'Bicarbonato a 8,4%: 1 mL = 1 mEq',
  ],
  fundamento:
    'O bicarbonato não é um íon confinado ao plasma: ele se distribui por um espaço que inclui o líquido extracelular e, na acidose grave, os tampões intracelulares e ósseos. É por isso que o "espaço de distribuição" aumenta conforme a acidose se aprofunda — repor com o coeficiente de acidose leve numa acidose grave subcorrige de forma previsível. O bicarbonato não ajuda na acidose lática e na cetoacidose por um motivo físico-químico: ao tamponar o hidrogênio, ele gera **gás carbônico**, que atravessa a membrana celular muito mais rápido que o íon bicarbonato. O resultado é queda do pH intracelular justamente nos tecidos que se quer proteger — miocárdio e sistema nervoso central —, com piora da contratilidade. Soma-se o desvio da curva de dissociação da hemoglobina para a esquerda, que reduz a liberação de oxigênio aos tecidos, e a queda abrupta do potássio e do cálcio ionizado.',
  armadilhas: [
    'Não persiga a normalização do pH. O alvo é sair da faixa de risco, não chegar a 7,40.',
    'A alcalose de rebote é comum quando o ácido orgânico acumulado (lactato, cetoácido) é metabolizado e regenera bicarbonato endógeno, somando-se ao administrado.',
  ],
  referencias: [
    { texto: 'Jaber S, Paugam C, Futier E, et al. Sodium bicarbonate therapy for patients with severe metabolic acidaemia in the intensive care unit (BICAR-ICU). Lancet. 2018;392(10141):31-40.' },
    { texto: 'Adrogué HJ, Madias NE. Management of life-threatening acid-base disorders. N Engl J Med. 1998;338(1):26-34.' },
  ],
}

const anafilaxia: Ferramenta = {
  id: 'anafilaxia',
  nome: 'Anafilaxia: critérios, gravidade e dose de adrenalina',
  sinonimos: ['anafilaxia', 'choque anafilatico', 'adrenalina', 'reacao alergica grave'],
  resumo: 'Aplica os critérios diagnósticos, gradua a gravidade e calcula a adrenalina.',
  categorias: ['emergencia'],
  campos: [
    campoPeso({ min: 3 }),
    campoSimNao('pele', 'Envolvimento de pele ou mucosa', 1, 'Urticária generalizada, prurido, rubor, edema de lábios, língua ou úvula.'),
    campoSimNao('respiratorio', 'Comprometimento respiratório', 1, 'Dispneia, broncoespasmo, estridor, hipoxemia, redução do pico de fluxo.'),
    campoSimNao('cardiovascular', 'Hipotensão ou sinais de hipoperfusão', 1, 'Colapso, síncope, incontinência.'),
    campoSimNao('gastrointestinal', 'Sintomas gastrointestinais persistentes e graves', 1, 'Cólica abdominal intensa, vômitos repetidos.'),
    campoSimNao('exposicao', 'Exposição a alérgeno conhecido ou provável para o paciente', 1),
    campoSimNao('betabloqueador', 'Em uso de betabloqueador', 1),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    if (peso === null) return null
    const pele = sim(v, 'pele')
    const resp = sim(v, 'respiratorio')
    const cardio = sim(v, 'cardiovascular')
    const gi = sim(v, 'gastrointestinal')
    const exposicao = sim(v, 'exposicao')
    const criterio1 = pele && (resp || cardio)
    const sistemas = [pele, resp, cardio, gi].filter(Boolean).length
    const criterio2 = exposicao && sistemas >= 2
    const criterio3 = exposicao && cardio
    const anafilaxia = criterio1 || criterio2 || criterio3
    const doseAdrenalina = Math.min(peso * 0.01, 0.5)
    const volumeAdrenalina = doseAdrenalina
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Critério 1', valor: criterio1 ? 'Preenchido' : 'Não preenchido', nota: 'Início agudo com envolvimento de pele/mucosa **mais** comprometimento respiratório ou cardiovascular.', nivel: criterio1 ? 'critico' : 'ok' },
      { rotulo: 'Critério 2', valor: criterio2 ? 'Preenchido' : 'Não preenchido', nota: 'Após exposição a alérgeno provável: 2 ou mais sistemas acometidos (pele, respiratório, cardiovascular, gastrointestinal).', nivel: criterio2 ? 'critico' : 'ok' },
      { rotulo: 'Critério 3', valor: criterio3 ? 'Preenchido' : 'Não preenchido', nota: 'Hipotensão após exposição a alérgeno **conhecido** para aquele paciente, mesmo sem outros sinais.', nivel: criterio3 ? 'critico' : 'ok' },
      { rotulo: 'Adrenalina intramuscular', valor: `${fmtLivre(doseAdrenalina, 2)} mg = ${fmtLivre(volumeAdrenalina, 2)} mL da solução 1:1.000`, nota: '**0,01 mg/kg, máximo de 0,5 mg no adulto e 0,3 mg na criança.** Aplicar na face anterolateral da coxa (vasto lateral), que absorve mais rápido que o deltoide ou o subcutâneo. Repetir a cada 5 a 15 minutos se necessário.', nivel: 'critico' },
      { rotulo: 'Posição', valor: 'Decúbito dorsal com membros inferiores elevados', nota: 'Sentar ou levantar bruscamente um paciente em anafilaxia pode causar colapso e morte por síndrome do ventrículo vazio.', nivel: 'alerta' },
      { rotulo: 'Volume', valor: `${fmtInt(peso * 20)} mL de cristaloide em bolus`, nota: 'A vasodilatação e o extravasamento capilar podem sequestrar até 35% do volume intravascular em minutos.' },
    ]
    if (sim(v, 'betabloqueador')) detalhes.push({ rotulo: 'Betabloqueador em uso', valor: 'Considerar glucagon', nota: 'Anafilaxia refratária em paciente betabloqueado: **glucagon 1 a 5 mg endovenoso em 5 minutos**, seguido de infusão de 5 a 15 µg/min. O glucagon age por via independente do receptor beta.', nivel: 'alerta' })
    return {
      titulo: anafilaxia ? 'Anafilaxia — critérios preenchidos' : 'Critérios não preenchidos',
      valor: anafilaxia ? 'Anafilaxia' : `${sistemas} sistema(s) acometido(s)`,
      nivel: anafilaxia ? 'critico' : 'atencao',
      rotuloNivel: cardio ? 'Choque anafilático' : resp ? 'Com comprometimento respiratório' : '',
      detalhes,
      conduta: [
        '**Adrenalina intramuscular na face anterolateral da coxa é a primeira e imediata medida**: 0,01 mg/kg (máximo 0,5 mg em adultos, 0,3 mg em crianças) da solução 1:1000, repetível a cada 5 a 15 minutos. Não há contraindicação absoluta na anafilaxia, e o atraso na aplicação é o fator mais associado a morte.',
        '**Não substitua a adrenalina por anti-histamínico ou corticoide.** Anti-histamínico trata urticária e prurido, não obstrução de via aérea nem choque; corticoide tem início de ação em horas e não previne comprovadamente a reação bifásica. Ambos são adjuvantes, jamais tratamento primário.',
        'Complete o suporte: **posição supina com membros inferiores elevados** (sentar ou levantar o paciente em hipotensão pode causar colapso e morte súbita por síndrome do ventrículo vazio), oxigênio, acesso venoso calibroso, **cristaloide em bolus de 20 mL/kg** e preparo para via aérea difícil, pelo risco de edema de glote.',
        'Em **choque refratário**, inicie **adrenalina em infusão contínua**, e lembre do paciente em uso de **betabloqueador**, que pode não responder: nesse caso, use **glucagon 1 a 5 mg intravenoso**, que ativa a adenilato ciclase por via independente do receptor beta.',
        'Antes da alta, faça as três coisas que previnem a próxima morte: **observe por 4 a 6 horas** (mais tempo se a reação foi grave, bifásica ou houve necessidade de doses repetidas), **prescreva autoinjetor de adrenalina — dois dispositivos — e ensine a técnica**, e **encaminhe ao alergista** com orientação escrita de plano de ação e de evitação do agente. A alta sem prescrição de adrenalina é a falha mais comum e mais consequente.',
      ],
      interpretacao: [
        '**A adrenalina intramuscular é o único tratamento que salva vidas na anafilaxia, e não tem contraindicação absoluta nesse contexto.** O erro mais comum e mais letal é atrasá-la em favor de anti-histamínico e corticoide — que não tratam a obstrução de via aérea nem o colapso circulatório e agem em horas, não em minutos.',
        '**Anti-histamínicos** aliviam prurido e urticária, nada mais. **Corticoides** não têm efeito na fase aguda e a evidência de que previnam reação bifásica é fraca. Nenhum dos dois substitui a adrenalina, e nenhum dos dois deve preceder a adrenalina.',
        '**Reação bifásica** ocorre em cerca de 1 a 20% dos casos, tipicamente entre 1 e 72 horas após a resolução (mediana de 6 a 10 horas). Observe por 4 a 8 horas nos casos leves e por 12 a 24 horas nos graves, nos que precisaram de mais de uma dose de adrenalina, e nos que têm asma.',
        '**Na alta, três coisas são obrigatórias:** prescrição de autoinjetor de adrenalina (ou seringa preenchida, onde o autoinjetor não estiver disponível), plano de ação escrito por escrito, e encaminhamento ao alergista para identificação do agente.',
        'Se houver refratariedade apesar de doses repetidas: infusão contínua de adrenalina, considerar via aérea definitiva precocemente (o edema evolui rápido e a intubação se torna impossível), e associar vasopressor adicional.',
      ],
      alertas: [
        'Adrenalina 1:1.000 (1 mg/mL) é para uso **intramuscular**. A solução 1:10.000 (0,1 mg/mL) é para uso endovenoso em parada cardíaca. Trocar as duas é erro potencialmente fatal.',
        'Estridor, rouquidão ou edema de língua indicam via aérea em risco — chame ajuda para via aérea difícil imediatamente.',
      ],
    }
  },
  formula: ['Adrenalina intramuscular: 0,01 mg/kg (máximo 0,5 mg no adulto), solução 1:1.000, no vasto lateral', 'Repetir a cada 5 a 15 minutos conforme a resposta'],
  fundamento:
    'A adrenalina atua nos três eixos da anafilaxia simultaneamente: agonismo α₁ reverte a vasodilatação e o extravasamento capilar (e reduz o edema de via aérea), agonismo β₁ aumenta a contratilidade e a frequência, e agonismo β₂ broncodilata e inibe a liberação adicional de mediadores por mastócitos e basófilos. Nenhum outro fármaco cobre esses três mecanismos. A anafilaxia é desgranulação maciça de mastócitos e basófilos, mediada por IgE ou por via independente de IgE, com liberação de histamina, triptase, prostaglandina D2, leucotrienos e fator ativador de plaquetas. O efeito dominante é **vasodilatação com aumento extremo da permeabilidade capilar**: até 35% do volume intravascular pode migrar para o interstício em 10 minutos. Isso explica por que a adrenalina é insubstituível — só ela reverte simultaneamente a vasodilatação (alfa-1), o broncoespasmo (beta-2) e a própria desgranulação (beta-2 nos mastócitos), e por que a posição supina evita o colapso do retorno venoso.',
  armadilhas: [
    'Anafilaxia pode ocorrer **sem manifestação cutânea** em cerca de 10 a 20% dos casos — especialmente na induzida por alimento em crianças e nas reações a medicamentos endovenosos. Ausência de urticária não exclui.',
    'A via subcutânea absorve de forma errática e lenta, e não deve ser usada.',
    'Anafilaxia bifásica e anafilaxia prolongada existem; a observação por tempo adequado é parte do tratamento.',
  ],
  referencias: [
    { texto: 'Cardona V, Ansotegui IJ, Ebisawa M, et al. World Allergy Organization anaphylaxis guidance 2020. World Allergy Organ J. 2020;13(10):100472.' },
    { texto: 'Sampson HA, Muñoz-Furlong A, Campbell RL, et al. Second symposium on the definition and management of anaphylaxis. J Allergy Clin Immunol. 2006;117(2):391-397.' },
  ],
}

const sequenciaRapida: Ferramenta = {
  id: 'sequencia-rapida-intubacao',
  nome: 'Critérios de intubação e checklist de sequência rápida',
  sinonimos: ['intubacao', 'sequencia rapida', 'via aerea', 'rsi', 'ivl', 'macocha'],
  resumo: 'Confere as indicações de via aérea definitiva e monta o checklist com doses calculadas.',
  categorias: ['emergencia'],
  campos: [
    campoPeso(),
    campoSimNao('protecao', 'Incapacidade de proteger a via aérea', 1, 'Rebaixamento do nível de consciência, perda de reflexos de proteção, sangue ou secreção na via aérea sem capacidade de eliminá-los.'),
    campoSimNao('oxigenacao', 'Falência de oxigenação refratária', 1),
    campoSimNao('ventilacao', 'Falência de ventilação (hipercapnia com acidose)', 1),
    campoSimNao('curso', 'Curso clínico previsto de deterioração', 1, 'Anafilaxia com edema progressivo, queimadura de via aérea, hematoma cervical expansivo, transporte prolongado.'),
    campoSeg('hemodinamica', 'Estado hemodinâmico', [
      { valor: 'estavel', rotulo: 'Estável' },
      { valor: 'instavel', rotulo: 'Instável ou choque' },
    ]),
    campoSimNao('viaAereaDificil', 'Preditores de via aérea difícil', 1, 'Mnemônica LEMON: Look externally, Evaluate 3-3-2, Mallampati, Obstruction, Neck mobility. Ou MACOCHA em terapia intensiva.'),
    campoSeg('inducao', 'Agente indutor', [
      { valor: 'etomidato', rotulo: 'Etomidato' },
      { valor: 'quetamina', rotulo: 'Quetamina' },
      { valor: 'propofol', rotulo: 'Propofol' },
      { valor: 'midazolam', rotulo: 'Midazolam' },
    ]),
    campoSeg('bloqueador', 'Bloqueador neuromuscular', [
      { valor: 'rocuronio', rotulo: 'Rocurônio' },
      { valor: 'succinilcolina', rotulo: 'Succinilcolina' },
    ]),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    if (peso === null) return null
    const indicacoes = ['protecao', 'oxigenacao', 'ventilacao', 'curso'].filter((id) => sim(v, id))
    const instavel = opc(v, 'hemodinamica') === 'instavel'
    const inducao = opc(v, 'inducao')
    const bloqueador = opc(v, 'bloqueador')
    const dosesInducao: Record<string, { mgkg: number; nota: string }> = {
      etomidato: { mgkg: instavel ? 0.15 : 0.3, nota: 'Hemodinamicamente o mais estável dos indutores. Causa supressão adrenal transitória (dose única, sem impacto demonstrado em mortalidade). Reduza a dose no choque.' },
      quetamina: { mgkg: instavel ? 1 : 1.5, nota: 'Preserva o drive respiratório e broncodilata — excelente em asma grave. Libera catecolaminas endógenas, mas em choque prolongado com reserva esgotada pode causar depressão miocárdica direta. Reduza a dose.' },
      propofol: { mgkg: instavel ? 0.5 : 1.5, nota: '**Causa hipotensão significativa.** Evite em instabilidade hemodinâmica ou reduza drasticamente a dose.' },
      midazolam: { mgkg: instavel ? 0.1 : 0.3, nota: 'Início mais lento e hipotensão relevante. É a pior escolha isolada para sequência rápida, mas é o que muitas vezes está disponível.' },
    }
    const dosesBloqueador: Record<string, { mgkg: number; nota: string }> = {
      rocuronio: { mgkg: 1.2, nota: 'Início em 45 a 60 s com 1,2 mg/kg; duração de 45 a 70 min. Reversível com sugamadex 16 mg/kg. É a escolha preferencial na maioria dos serviços.' },
      succinilcolina: { mgkg: 1.5, nota: 'Início em 45 s, duração de 6 a 10 min. **Contraindicada** em hipercalemia, queimadura ou trauma extenso com mais de 48 h, doença neuromuscular, imobilização prolongada, rabdomiólise e história de hipertermia maligna.' },
    }
    const di = dosesInducao[inducao]
    const db = dosesBloqueador[bloqueador]
    return {
      titulo: indicacoes.length ? 'Indicação de via aérea definitiva presente' : 'Sem indicação clara pelos critérios marcados',
      valor: `${indicacoes.length} de 4 indicações`,
      nivel: indicacoes.length ? 'critico' : 'atencao',
      rotuloNivel: instavel ? 'Paciente instável — ajuste as doses' : 'Paciente estável',
      detalhes: [
        { rotulo: `Indução — ${inducao}`, valor: `${fmtLivre(peso * di.mgkg, 1)} mg (${fmt(di.mgkg, 2)} mg/kg)`, nota: di.nota, nivel: 'alerta' },
        { rotulo: `Bloqueio — ${bloqueador}`, valor: `${fmtLivre(peso * db.mgkg, 1)} mg (${fmt(db.mgkg, 1)} mg/kg)`, nota: db.nota, nivel: 'alerta' },
        { rotulo: 'Vasopressor de resgate (push-dose)', valor: 'Adrenalina 10 a 20 µg em bolus, ou fenilefrina 50 a 200 µg', nota: 'Deixe preparado **antes** da indução em qualquer paciente com risco de colapso.' },
        { rotulo: 'Preditores de via aérea difícil', valor: sim(v, 'viaAereaDificil') ? 'Presentes' : 'Não identificados', nota: sim(v, 'viaAereaDificil') ? '**Chame ajuda antes de induzir.** Considere via aérea acordada com anestésico tópico, videolaringoscópio de primeira escolha e material de resgate aberto (dispositivo supraglótico, kit de cricotireoidostomia).' : undefined, nivel: sim(v, 'viaAereaDificil') ? 'critico' : 'ok' },
      ],
      conduta: [
        'Percorra os **sete P** com disciplina: **P**reparação, **P**ré-oxigenação, **P**ré-tratamento/otimização fisiológica, **P**aralisia com indução, **P**osicionamento, **P**assagem do tubo com confirmação e **P**ós-intubação. Pular a preparação é o que transforma uma via aérea difícil prevista em uma catástrofe não prevista.',
        'Pré-oxigene por **3 minutos com máscara não reinalante ou 8 respirações de capacidade vital**, e mantenha **oxigenação apneica com cateter nasal a 15 L/min** durante a laringoscopia — ela prolonga substancialmente o tempo até a dessaturação. Em paciente com shunt importante, use ventilação não invasiva ou alto fluxo para pré-oxigenar.',
        'Corrija a **fisiologia antes de induzir**: hipotensão (volume e vasopressor em bomba já conectados — a indução derruba a pressão e pode causar parada peri-intubação), hipoxemia grave, acidose metabólica profunda (a apneia interrompe a compensação respiratória e o pH despenca) e hipercalemia, que contraindica succinilcolina.',
        'Escolha os fármacos pelo perfil hemodinâmico: **etomidato ou cetamina** em instabilidade (evite propofol, que causa hipotensão); **rocurônio 1,2 mg/kg** ou **succinilcolina 1,5 mg/kg** para bloqueio. Evite succinilcolina em hipercalemia, queimadura ou trauma com mais de 48 h, doença neuromuscular, rabdomiólise e história de hipertermia maligna.',
        '**Confirme o posicionamento com capnografia em forma de onda**, que é o padrão-ouro — ausculta e condensação no tubo não bastam. Tenha o **plano de resgate definido em voz alta antes de induzir** (dispositivo supraglótico, videolaringoscópio, cricotireoidostomia) e, na intubação difícil não prevista, verbalize a transição de plano em vez de repetir tentativas: mais de três laringoscopias aumenta muito a taxa de complicação grave.',
      ],
      interpretacao: [
        '**As quatro perguntas que indicam intubação:** o paciente consegue proteger a via aérea? A oxigenação está adequada? A ventilação está adequada? Qual é o curso clínico esperado? Uma resposta desfavorável a qualquer uma delas indica via aérea definitiva.',
        '**Checklist da sequência rápida (os 7 P):** **P**reparação (material, monitorização, acessos, equipe, papéis definidos); **P**ré-oxigenação (3 minutos com máscara com reservatório ou ventilação não invasiva, com oxigenação apneica por cateter nasal a 15 L/min mantida durante a laringoscopia); **P**ré-tratamento e otimização hemodinâmica; **P**aralisia com indução; **P**osicionamento (alinhamento do meato auditivo com a fúrcula esternal; rampa em obesos); **P**assagem do tubo com confirmação; **P**ós-intubação (capnografia, sedação e analgesia contínuas, ajuste do ventilador, radiografia).',
        '**Otimize antes de induzir.** O colapso peri-intubação é comum e previsível: o paciente hipotenso, hipoxêmico ou acidótico piora com a indução e com a pressão positiva. Corrija a pressão, pré-oxigene bem e tenha vasopressor pronto. A mnemônica de risco é **HOP**: **H**ipotensão, **H**ipoxemia, acidose (**p**H baixo).',
        '**A capnografia em forma de onda é o padrão-ouro de confirmação.** Ausculta e condensação no tubo enganam. Capnografia com curva persistente por 6 ventilações confirma posicionamento traqueal.',
        instavel ? '**Paciente instável:** reduza a dose do indutor (a hipotensão pós-indução é dose-dependente) e **mantenha a dose plena do bloqueador** — a paralisia inadequada é a principal causa de falha de primeira tentativa.' : 'Paciente estável: doses convencionais.',
      ],
      alertas: [
        'Nunca administre bloqueador neuromuscular sem sedação adequada. Paralisia com consciência preservada é uma das piores experiências relatadas por pacientes.',
        'Tenha sempre o plano B e o plano C definidos em voz alta antes da indução: dispositivo supraglótico e cricotireoidostomia. "Não intubo, não ventilo" é uma emergência de segundos.',
      ],
    }
  },
  formula: [
    'Etomidato 0,3 mg/kg (0,15 no choque) · Quetamina 1 a 2 mg/kg · Propofol 1,5 mg/kg (muito menos no choque)',
    'Rocurônio 1,2 mg/kg · Succinilcolina 1,5 mg/kg',
  ],
  fundamento:
    'A sequência rápida existe para minimizar o intervalo entre a perda dos reflexos protetores e a proteção definitiva da via aérea, reduzindo o risco de aspiração. A escolha dos fármacos segue essa lógica: indutor de início rápido e bloqueador de início rápido, administrados em sequência imediata, sem ventilação com bolsa-válvula-máscara entre eles — embora a ventilação suave durante a apneia tenha se mostrado segura e reduza a hipoxemia no ensaio PreVent.',
  armadilhas: [
    'A oxigenação apneica com cateter nasal a 15 L/min durante a laringoscopia é simples, barata e prolonga o tempo seguro de apneia — ainda é subutilizada.',
    'Em obesos, a dose de succinilcolina é calculada pelo **peso real**; a de rocurônio, pelo peso ideal ou ajustado.',
  ],
  referencias: [
    { texto: 'Higgs A, McGrath BA, Goddard C, et al. Guidelines for the management of tracheal intubation in critically ill adults. Br J Anaesth. 2018;120(2):323-352.' },
    { texto: 'Casey JD, Janz DR, Russell DW, et al. Bag-mask ventilation during tracheal intubation of critically ill adults (PreVent). N Engl J Med. 2019;380(9):811-821.' },
    { texto: 'De Jong A, Molinari N, Terzi N, et al. Early identification of patients at risk for difficult intubation in the intensive care unit (MACOCHA score). Am J Respir Crit Care Med. 2013;187(8):832-839.' },
  ],
}

/* ═══════════ Canadian C-Spine Rule e NEXUS — liberação da coluna cervical ═══════════ */

const cspine: Ferramenta = {
  id: 'canadian-c-spine',
  nome: 'Canadian C-Spine Rule e NEXUS — liberação da coluna cervical',
  sinonimos: ['c-spine', 'canadian cspine', 'nexus', 'coluna cervical', 'colar cervical', 'trauma cervical'],
  resumo: 'Decide quem pode ter a coluna cervical liberada sem imagem após trauma, por duas regras validadas com sensibilidade próxima de 100%.',
  categorias: ['emergencia', 'especialidades'],
  campos: [
    campoSeg('regra', 'Regra', [
      { valor: 'ccr', rotulo: 'Canadian C-Spine' },
      { valor: 'nexus', rotulo: 'NEXUS' },
    ], { ajuda: 'A Canadian C-Spine tem especificidade maior (evita mais exames) e exige paciente alerta, estável e com Glasgow 15; o NEXUS é mais simples e aplicável a uma população um pouco mais ampla. As duas têm sensibilidade próxima de 100%, e a escolha costuma ser institucional.' }),
    campoSimNao('idade65', 'Idade de 65 anos ou mais', 0, 'Fator de alto risco na Canadian C-Spine: o osso osteoporótico e a artrose cervical fazem o idoso fraturar com mecanismo trivial, inclusive queda da própria altura.'),
    campoSimNao('mecanismoPerigoso', 'Mecanismo perigoso', 0, 'Queda de altura maior que 1 metro ou 5 degraus, carga axial sobre a cabeça (mergulho), colisão em alta velocidade (acima de 100 km/h), capotamento, ejeção, acidente com veículo recreativo motorizado, ou colisão de bicicleta.'),
    campoSimNao('parestesia', 'Parestesias em extremidades', 0, 'Formigamento ou dormência em qualquer extremidade — na Canadian C-Spine, é fator de alto risco e obriga imagem, mesmo isolado.'),
    campoSimNao('colisaoTraseira', 'Colisão traseira simples (sem os agravantes)', 0, 'Fator de baixo risco que permite testar a rotação. **Não** vale se houve empurrão para o tráfego oncoming, colisão por ônibus ou caminhão grande, capotamento ou impacto por veículo em alta velocidade.'),
    campoSimNao('sentado', 'Permaneceu sentado na emergência', 0, undefined),
    campoSimNao('deambulou', 'Deambulou em algum momento após o trauma', 0, undefined),
    campoSimNao('dorTardia', 'Dor cervical de início tardio (não imediata)', 0, undefined),
    campoSimNao('semDorLinhaMedia', 'Ausência de dor à palpação da linha média cervical posterior', 0, 'Palpe os processos espinhosos de C1 a C7. Dor na musculatura paravertebral não conta — o critério é a linha média posterior.'),
    campoSimNao('rotacao', 'Consegue rodar ativamente o pescoço 45° para os dois lados', 0, 'Peça ao paciente para rodar ativamente, sem ajuda. **Só teste a rotação se não houver nenhum fator de alto risco e houver pelo menos um fator de baixo risco** — testar antes disso pode mobilizar uma coluna instável.'),
    campoSimNao('nAlerta', 'Alerta e orientado (Glasgow 15)', 0, undefined),
    campoSimNao('nFoco', 'Sem déficit neurológico focal', 0, 'Force, sensibilidade e reflexos normais nos quatro membros.'),
    campoSimNao('nIntoxicado', 'Sem sinais de intoxicação', 0, 'Álcool, drogas ou medicação sedativa em uso recente impedem a aplicação da regra, porque mascaram a dor.'),
    campoSimNao('nDistrator', 'Sem lesão dolorosa distrativa', 0, 'Fratura de ossos longos, queimadura extensa, lesão visceral ou qualquer dor intensa que desvie a atenção da coluna.'),
  ],
  calcular: (v) => {
    const nexus = opc(v, 'regra') === 'nexus'

    if (nexus) {
      const criterios: [string, boolean][] = [
        ['Sem dor à palpação da linha média posterior', sim(v, 'semDorLinhaMedia')],
        ['Sem sinais de intoxicação', sim(v, 'nIntoxicado')],
        ['Alerta e orientado', sim(v, 'nAlerta')],
        ['Sem déficit neurológico focal', sim(v, 'nFoco')],
        ['Sem lesão dolorosa distrativa', sim(v, 'nDistrator')],
      ]
      const todos = criterios.every(([, c]) => c)
      return {
        titulo: 'NEXUS',
        valor: todos ? 'Coluna liberável sem imagem' : 'Imagem indicada',
        nivel: todos ? 'ok' : 'alerta',
        rotuloNivel: `${criterios.filter(([, c]) => c).length} de 5 critérios cumpridos`,
        detalhes: criterios.map(([rotulo, c]) => ({ rotulo, valor: c ? 'Cumprido' : 'Não cumprido', nivel: (c ? 'ok' : 'alerta') as Nivel })),
        interpretacao: [
          todos
            ? '**Os cinco critérios estão cumpridos: a coluna cervical pode ser liberada sem imagem.** O NEXUS tem sensibilidade de 99,6% para lesão cervical clinicamente significativa, com valor preditivo negativo próximo de 100%.'
            : '**Pelo menos um critério não foi cumprido: a imagem está indicada.** Basta um para indicar — os cinco precisam ser simultaneamente negativos.',
          'A **tomografia** substituiu a radiografia como exame de escolha no trauma cervical: a radiografia em três incidências perde de 30 a 50% das fraturas, sobretudo na transição cervicotorácica e em C1-C2, e a tomografia multidetectores tem sensibilidade acima de 99%.',
          'O NEXUS é mais simples que a Canadian C-Spine e não exige julgamento sobre mecanismo, mas tem **especificidade menor** — ou seja, indica mais exames para a mesma segurança.',
          'A **lesão dolorosa distrativa** é o critério mais subjetivo e mal aplicado: a definição não é rígida, e cabe ao avaliador julgar se há dor suficiente para mascarar a cervical.',
        ],
        conduta: [
          todos
            ? '**Retire o colar cervical.** Manter colar sem indicação causa dor, úlcera de pressão, dificuldade de via aérea, aumento da pressão intracraniana e desconforto, sem qualquer benefício em coluna já liberada.'
            : '**Solicite tomografia de coluna cervical** e mantenha a imobilização até o resultado, com colar bem ajustado, cabeça neutra e mobilização em bloco.',
          'Diante de **déficit neurológico com tomografia normal**, prossiga com **ressonância magnética**: ela detecta lesão ligamentar, hematoma epidural e contusão medular, incluindo a lesão medular sem anormalidade radiográfica, mais comum em crianças e em idosos com canal estreito.',
          'Em idosos, mantenha o limiar baixo: a **fratura do odontoide** é a mais comum nessa faixa, ocorre com trauma trivial e pode cursar com pouca dor. Queda da própria altura em maior de 65 anos já é mecanismo suficiente.',
          'Registre no prontuário **qual regra foi aplicada e cada critério avaliado**. É essa documentação que sustenta a decisão de não pedir exame, e é ela que falta quando a decisão é questionada depois.',
        ],
        alertas: [
          'O NEXUS **não se aplica** a paciente intoxicado, rebaixado, com déficit focal ou com lesão distrativa — nesses casos não há regra a aplicar, e a imagem é obrigatória.',
          'Radiografia simples não é mais aceitável como exame de liberação no adulto: a tomografia é o padrão, e a radiografia perde uma fração grande das fraturas.',
        ],
      }
    }

    const altoRisco = sim(v, 'idade65') || sim(v, 'mecanismoPerigoso') || sim(v, 'parestesia')
    const baixoRisco = sim(v, 'colisaoTraseira') || sim(v, 'sentado') || sim(v, 'deambulou') || sim(v, 'dorTardia') || sim(v, 'semDorLinhaMedia')
    const rodou = sim(v, 'rotacao')
    const liberavel = !altoRisco && baixoRisco && rodou

    return {
      titulo: 'Canadian C-Spine Rule',
      valor: liberavel ? 'Coluna liberável sem imagem' : 'Imagem indicada',
      nivel: liberavel ? 'ok' : 'alerta',
      rotuloNivel: altoRisco ? 'Fator de alto risco presente' : !baixoRisco ? 'Nenhum fator de baixo risco' : rodou ? 'Rotação preservada' : 'Rotação limitada',
      detalhes: [
        { rotulo: 'Passo 1 — fator de alto risco', valor: altoRisco ? 'Presente' : 'Ausente', nivel: (altoRisco ? 'alerta' : 'ok') as Nivel, nota: 'Idade ≥ 65, mecanismo perigoso ou parestesias' },
        { rotulo: 'Passo 2 — fator de baixo risco', valor: baixoRisco ? 'Presente' : 'Ausente', nivel: (baixoRisco ? 'ok' : 'alerta') as Nivel, nota: 'Permite testar a rotação' },
        { rotulo: 'Passo 3 — rotação de 45° bilateral', valor: rodou ? 'Consegue' : 'Não consegue', nivel: (rodou ? 'ok' : 'alerta') as Nivel },
      ],
      interpretacao: [
        'A regra tem **três passos em ordem obrigatória**. Primeiro: há fator de alto risco? Se sim, imagem, e o raciocínio para aqui. Segundo: há algum fator de baixo risco que permita avaliar a rotação com segurança? Se não, imagem. Terceiro: o paciente roda o pescoço 45° para os dois lados? Se sim, a coluna é liberável.',
        altoRisco
          ? '**Há fator de alto risco: a imagem está indicada e a rotação não deve ser testada.** Mobilizar ativamente uma coluna potencialmente instável é justamente o que a sequência dos passos existe para evitar.'
          : !baixoRisco
            ? '**Nenhum fator de baixo risco foi identificado**, o que impede testar a rotação com segurança. A imagem está indicada.'
            : rodou
              ? '**Sem alto risco, com fator de baixo risco e rotação preservada: a coluna pode ser liberada sem imagem.** A Canadian C-Spine tem sensibilidade de 99,4% e especificidade superior à do NEXUS, evitando mais exames para a mesma segurança.'
              : '**A rotação está limitada**, o que indica imagem mesmo na ausência de fatores de alto risco.',
        'A regra **exige paciente alerta (Glasgow 15), estável e cooperativo**, com trauma nas últimas 48 horas. Ela não se aplica a menores de 16 anos, gestantes, pacientes com doença vertebral prévia conhecida ou com paralisia.',
        'A comparação direta entre as duas regras mostrou sensibilidade semelhante e **especificidade maior para a Canadian C-Spine** (cerca de 45% contra 37%), o que se traduz em menos tomografias para a mesma taxa de detecção.',
      ],
      conduta: [
        liberavel
          ? '**Retire o colar cervical.** Colar mantido sem indicação causa dor, úlcera de pressão, dificuldade de acesso à via aérea, aumento da pressão intracraniana e agitação — sem benefício algum em coluna já liberada.'
          : '**Solicite tomografia de coluna cervical** e mantenha a imobilização até o resultado, com mobilização em bloco.',
        'Se houver **déficit neurológico com tomografia normal**, prossiga com ressonância magnética para lesão ligamentar, hematoma epidural e contusão medular.',
        'Em **idosos**, a fratura do odontoide ocorre com trauma trivial e com pouca dor; em **crianças**, considere a lesão medular sem anormalidade radiográfica, pela maior elasticidade ligamentar e maior proporção cefálica.',
        'Documente cada passo no prontuário. A decisão de **não** pedir exame precisa ser rastreável tanto quanto a de pedir.',
      ],
      alertas: [
        '**Não teste a rotação antes de percorrer os dois primeiros passos.** A sequência existe para não mobilizar ativamente uma coluna possivelmente instável.',
        'A regra não se aplica a menores de 16 anos, a pacientes não alertas, instáveis ou intoxicados, nem a trauma com mais de 48 horas.',
      ],
    }
  },
  formula: [
    'Canadian C-Spine: (1) fator de alto risco → imagem · (2) sem fator de baixo risco → imagem · (3) não roda 45° bilateral → imagem',
    'NEXUS: liberável apenas se os 5 critérios forem negativos',
  ],
  fundamento:
    'A coluna cervical concentra risco desproporcional no trauma porque reúne a maior mobilidade da coluna vertebral com a menor proteção óssea e com a estrutura de maior consequência: a medula cervical alta, cuja lesão acima de C4 abole a inervação diafragmática e causa parada respiratória. Cerca de 2 a 3% dos traumas fechados significativos têm lesão cervical, e uma fração relevante delas é instável. Por outro lado, imobilizar e tomografar todo mundo tem custo real — radiação em população jovem, tempo de emergência, e os danos diretos do colar, que aumenta a pressão intracraniana por dificultar o retorno venoso jugular, provoca úlcera de pressão em horas e atrapalha o manejo da via aérea. As duas regras foram derivadas e validadas prospectivamente com desenho deliberadamente assimétrico: sensibilidade próxima de 100%, aceitando especificidade baixa, porque perder uma fratura instável é um desfecho catastrófico e irreversível enquanto um exame a mais é um custo recuperável. A sequência de três passos da Canadian C-Spine incorpora ainda uma precaução de segurança que o NEXUS não tem — só se pede ao paciente que rode o pescoço depois de afastados os fatores de alto risco.',
  armadilhas: [
    'Aplicar as regras fora de sua população de derivação — intoxicados, rebaixados, menores de 16 anos, trauma antigo — invalida a sensibilidade relatada.',
    '"Lesão distrativa" é um critério subjetivo e a fonte mais comum de divergência entre avaliadores no NEXUS.',
    'A dor deve ser pesquisada na **linha média posterior**: dor paravertebral muscular não é o critério e leva a exames desnecessários quando confundida.',
    'Tomografia normal não exclui lesão ligamentar pura nem lesão medular sem anormalidade radiográfica — com déficit neurológico, a ressonância é obrigatória.',
  ],
  referencias: [
    { texto: 'Stiell IG, Wells GA, Vandemheen KL, et al. The Canadian C-spine rule for radiography in alert and stable trauma patients. JAMA. 2001;286(15):1841-1848.' },
    { texto: 'Hoffman JR, Mower WR, Wolfson AB, Todd KH, Zucker MI. Validity of a set of clinical criteria to rule out injury to the cervical spine in patients with blunt trauma (NEXUS). N Engl J Med. 2000;343(2):94-99.' },
    { texto: 'Stiell IG, Clement CM, McKnight RD, et al. The Canadian C-spine rule versus the NEXUS low-risk criteria in patients with trauma. N Engl J Med. 2003;349(26):2510-2518.' },
  ],
}

/* ═══════════════ Índice de comorbidade de Charlson ═══════════════ */

const charlsonItens: [string, string, number][] = [
  ['iam', 'Infarto do miocárdio prévio', 1],
  ['icc', 'Insuficiência cardíaca congestiva', 1],
  ['vascular', 'Doença vascular periférica', 1],
  ['avc', 'Doença cerebrovascular (AVC ou AIT)', 1],
  ['demencia', 'Demência', 1],
  ['dpoc', 'Doença pulmonar crônica', 1],
  ['conectivo', 'Doença do tecido conjuntivo', 1],
  ['ulcera', 'Doença ulcerosa péptica', 1],
  ['hepaticaLeve', 'Hepatopatia leve', 1],
  ['diabetes', 'Diabetes sem lesão de órgão-alvo', 1],
  ['diabetesAlvo', 'Diabetes com lesão de órgão-alvo', 2],
  ['hemiplegia', 'Hemiplegia ou paraplegia', 2],
  ['renal', 'Doença renal moderada a grave', 2],
  ['tumor', 'Tumor sólido sem metástase (nos últimos 5 anos)', 2],
  ['leucemia', 'Leucemia', 2],
  ['linfoma', 'Linfoma', 2],
  ['hepaticaGrave', 'Hepatopatia moderada a grave', 3],
  ['metastase', 'Tumor sólido metastático', 6],
  ['hiv', 'HIV/aids', 6],
]

const charlson: Ferramenta = {
  id: 'charlson',
  nome: 'Índice de comorbidade de Charlson',
  sigla: 'CCI',
  sinonimos: ['charlson', 'cci', 'comorbidade', 'indice de comorbidade', 'mortalidade 10 anos'],
  resumo: 'Soma a carga de comorbidade com pesos derivados de mortalidade e estima a sobrevida em 10 anos.',
  categorias: ['emergencia', 'geriatria'],
  campos: [
    campoIdade({ min: 18, ajuda: 'A versão ajustada acrescenta 1 ponto por década a partir dos 50 anos: 1 ponto dos 50 aos 59, 2 dos 60 aos 69, e assim por diante. Em populações idosas, a idade costuma contribuir mais que as próprias comorbidades.' }),
    ...charlsonItens.map(([id, rotulo, pontos]) =>
      campoSimNao(id, `${rotulo} (${pontos} ${pontos === 1 ? 'ponto' : 'pontos'})`, pontos, undefined),
    ),
  ],
  calcular: (v) => {
    const idade = num(v, 'idade')
    if (idade === null) return null
    const comorbidades = somaSimNao(v, charlsonItens.map(([id, , pontos]) => ({ id, pontos })))
    const pontosIdade = idade < 50 ? 0 : Math.min(4, Math.floor((idade - 40) / 10))
    const total = comorbidades + pontosIdade

    // Sobrevida estimada em 10 anos pela fórmula original de Charlson.
    const sobrevida = Math.pow(0.983, Math.exp(total * 0.9) * 100) * 100
    const nivel: Nivel = total >= 5 ? 'critico' : total >= 3 ? 'alerta' : total >= 1 ? 'atencao' : 'ok'

    const presentes = charlsonItens.filter(([id]) => sim(v, id))

    return {
      titulo: 'Índice de Charlson ajustado pela idade',
      valor: fmtInt(total),
      unidade: 'pontos',
      nivel,
      rotuloNivel: total >= 5 ? 'Carga muito alta' : total >= 3 ? 'Carga alta' : total >= 1 ? 'Carga baixa a moderada' : 'Sem comorbidade',
      detalhes: [
        { rotulo: 'Comorbidades', valor: fmtInt(comorbidades) },
        { rotulo: 'Pontos por idade', valor: fmtInt(pontosIdade), nota: '1 por década a partir dos 50 anos, teto de 4' },
        { rotulo: 'Sobrevida estimada em 10 anos', valor: fmtPct(Math.max(0, Math.min(100, sobrevida)), 0), nota: 'Estimativa da coorte original de 1987' },
        { rotulo: 'Comorbidades assinaladas', valor: presentes.length > 0 ? presentes.map(([, r]) => r.split(' (')[0]).join(', ') : 'nenhuma' },
      ],
      interpretacao: [
        `**${total} pontos**, sendo ${comorbidades} de comorbidade e ${pontosIdade} de idade. As faixas usuais são: 0 sem comorbidade, 1 a 2 carga baixa, 3 a 4 carga moderada, e 5 ou mais carga alta, com mortalidade progressivamente maior em cada uma.`,
        'Os pesos não são arbitrários: foram derivados do **risco relativo de morte em 1 ano** associado a cada condição na coorte original. Por isso tumor metastático e HIV/aids valem 6 pontos, enquanto diabetes sem lesão de órgão vale 1 — a escala reflete letalidade, não prevalência nem complexidade de manejo.',
        `A sobrevida estimada em 10 anos, de aproximadamente ${fmtPct(Math.max(0, Math.min(100, sobrevida)), 0)}, vem da fórmula original e deve ser lida com reserva: a coorte é de 1987, e o prognóstico de várias das condições mudou radicalmente desde então — HIV, em particular, deixou de ser sentença e hoje tem expectativa de vida próxima da população geral sob tratamento antirretroviral.`,
        idade >= 50
          ? `A idade contribuiu com ${pontosIdade} ponto(s). Em populações idosas, ela costuma pesar mais que as próprias comorbidades, e é por isso que a versão ajustada substituiu a original na maioria dos usos.`
          : 'Abaixo de 50 anos, a idade não acrescenta pontos ao índice.',
      ],
      conduta: [
        'Use o índice para **ajustar risco em comparações e para informar conversas de prognóstico**, não para decidir sobre um tratamento específico. Ele foi construído para ajustar casuística em pesquisa e em auditoria de resultados.',
        'Em **decisão sobre rastreamento de câncer**, o índice ajuda a estimar se o paciente viverá o suficiente para se beneficiar: rastrear câncer de cólon ou de mama em quem tem expectativa de vida menor que 10 anos expõe a dano imediato com benefício que nunca chegará.',
        'Antes de restringir tratamento por carga de comorbidade, avalie **fragilidade e funcionalidade** — elas predizem desfecho melhor que a contagem de doenças, e um paciente com Charlson alto pode estar funcionalmente íntegro.',
        'Trate cada comorbidade identificada de forma ativa: a soma alta é, antes de tudo, uma lista de intervenções pendentes. Insuficiência cardíaca, doença renal, diabetes e doença pulmonar têm tratamentos que modificam desfecho.',
        'Reavalie o índice em cada transição de cuidado — ele muda com novo diagnóstico, e a versão registrada na admissão anterior envelhece rápido.',
      ],
      alertas: [
        'A coorte de derivação é de **1987**. A estimativa de sobrevida em 10 anos é historicamente calibrada e superestima a mortalidade de condições cujo tratamento mudou, sobretudo HIV/aids, linfoma, leucemia e hepatite C.',
        'O índice **não mede funcionalidade, fragilidade nem cognição**, que são preditores mais fortes de desfecho em idosos. Usá-lo sozinho para decidir intensidade de cuidado é uso indevido.',
      ],
    }
  },
  formula: ['CCI = soma dos pesos das comorbidades presentes', 'Ajustado: acrescenta 1 ponto por década a partir dos 50 anos (teto de 4)', 'Sobrevida em 10 anos ≈ 0,983^(e^(CCI × 0,9)) × 100'],
  fundamento:
    'Charlson e colaboradores partiram de um problema metodológico concreto: comparar desfechos entre serviços ou entre tratamentos é injusto quando as populações diferem em carga de doença, e contar comorbidades sem pesá-las trata um diabetes bem controlado como equivalente a um tumor metastático. Eles acompanharam uma coorte de pacientes internados, mediram o **risco relativo de morte em 1 ano** associado a cada condição e converteram esses riscos em pesos inteiros — daí a escala assimétrica, em que algumas condições valem 1 e outras valem 6. A racionalidade fisiológica por trás do índice é a de **reserva orgânica**: cada comorbidade consome a margem entre a função basal de um sistema e o limiar em que ele falha, e a soma dessas margens consumidas determina a capacidade de sobreviver a um novo insulto. Isso explica por que o índice prediz melhor em coortes do que em indivíduos, e por que fragilidade — que mede diretamente a reserva, em vez de inferi-la a partir da lista de diagnósticos — acaba superando o Charlson em predição individual no idoso.',
  armadilhas: [
    'Comorbidades registradas de forma incompleta no prontuário subestimam sistematicamente o índice, e é assim que ele costuma ser calculado em estudos retrospectivos.',
    'A gravidade dentro de cada categoria não é capturada: uma insuficiência cardíaca classe I e uma classe IV valem o mesmo ponto.',
    'Hipertensão, dislipidemia, obesidade, tabagismo e transtornos mentais não entram no índice, ainda que afetem prognóstico.',
    'Existem versões adaptadas para bases administrativas (Deyo, Romano, Quan), com códigos diferentes e resultados não intercambiáveis com a versão clínica.',
  ],
  referencias: [
    { texto: 'Charlson ME, Pompei P, Ales KL, MacKenzie CR. A new method of classifying prognostic comorbidity in longitudinal studies. J Chronic Dis. 1987;40(5):373-383.' },
    { texto: 'Charlson M, Szatrowski TP, Peterson J, Gold J. Validation of a combined comorbidity index. J Clin Epidemiol. 1994;47(11):1245-1251.' },
    { texto: 'Quan H, Li B, Couris CM, et al. Updating and validating the Charlson comorbidity index and score for risk adjustment in hospital discharge abstracts using data from 6 countries. Am J Epidemiol. 2011;173(6):676-682.' },
  ],
}

/* ═══════════ Canadian CT Head Rule e New Orleans Criteria ═══════════ */

const ctHeadCampos: Campo[] = [
  campoSeg('regra', 'Regra', [
    { valor: 'canadian', rotulo: 'Canadian CT Head Rule' },
    { valor: 'neworleans', rotulo: 'New Orleans Criteria' },
  ], { ajuda: 'A Canadian exige perda de consciência, amnésia ou desorientação e tem especificidade bem maior (evita mais tomografias); a New Orleans aplica-se a quem teve perda de consciência com Glasgow 15 e é mais sensível para qualquer achado, ao custo de indicar muito mais exames.' }),
  campoSimNao('gcs15_2h', 'Glasgow abaixo de 15 duas horas após o trauma', 0, 'Critério de **alto risco** da Canadian, isto é, de necessidade de intervenção neurocirúrgica. Reavalie o Glasgow às 2 horas, e não apenas na chegada.'),
  campoSimNao('fraturaAberta', 'Suspeita de fratura aberta ou com afundamento', 0, 'Critério de alto risco.'),
  campoSimNao('fraturaBase', 'Qualquer sinal de fratura de base do crânio', 0, 'Hemotímpano, equimose periorbital bilateral em óculos, equimose retroauricular (sinal de Battle), otorreia ou rinorreia de líquor. Critério de alto risco.'),
  campoSimNao('vomitos2', 'Dois ou mais episódios de vômito', 0, 'Critério de alto risco na Canadian. Um episódio isolado não conta.'),
  campoSimNao('idade65', 'Idade de 65 anos ou mais', 0, 'Critério de alto risco. A atrofia cerebral do idoso estira as veias emissárias e as torna vulneráveis — é por isso que o hematoma subdural ocorre com trauma trivial e pode se manifestar semanas depois.'),
  campoSimNao('amnesia30', 'Amnésia retrógrada de 30 minutos ou mais', 0, 'Critério de **médio risco** na Canadian, ou seja, de lesão visível na tomografia mas sem necessidade cirúrgica.'),
  campoSimNao('mecanismoPerigoso', 'Mecanismo perigoso', 0, 'Atropelamento de pedestre, ejeção de veículo, ou queda de mais de 1 metro ou 5 degraus. Critério de médio risco.'),
  campoSimNao('noCefaleia', 'Cefaleia', 0, undefined),
  campoSimNao('noVomito', 'Vômito', 0, undefined),
  campoSimNao('noIdade60', 'Idade acima de 60 anos', 0, undefined),
  campoSimNao('noIntoxicacao', 'Intoxicação por álcool ou drogas', 0, undefined),
  campoSimNao('noMemoria', 'Déficit persistente de memória anterógrada', 0, undefined),
  campoSimNao('noTrauma', 'Evidência de trauma acima das clavículas', 0, undefined),
  campoSimNao('noConvulsao', 'Convulsão', 0, undefined),
]

const ctHead: Ferramenta = {
  id: 'ct-head-rule',
  nome: 'Canadian CT Head Rule e New Orleans Criteria',
  sinonimos: ['canadian ct head', 'new orleans', 'tce leve', 'tomografia cranio adulto', 'concussao'],
  resumo: 'Decide quem precisa de tomografia após trauma craniano leve no adulto, por duas regras validadas com sensibilidade próxima de 100%.',
  categorias: ['emergencia', 'neurologia'],
  campos: ctHeadCampos,
  calcular: (v) => {
    const canadian = opc(v, 'regra') === 'canadian'

    if (!canadian) {
      const criterios: [string, boolean][] = [
        ['Cefaleia', sim(v, 'noCefaleia')],
        ['Vômito', sim(v, 'noVomito')],
        ['Idade > 60 anos', sim(v, 'noIdade60')],
        ['Intoxicação por álcool ou drogas', sim(v, 'noIntoxicacao')],
        ['Déficit persistente de memória anterógrada', sim(v, 'noMemoria')],
        ['Trauma visível acima das clavículas', sim(v, 'noTrauma')],
        ['Convulsão', sim(v, 'noConvulsao')],
      ]
      const positivos = criterios.filter(([, c]) => c)
      const indica = positivos.length > 0
      return {
        titulo: 'New Orleans Criteria',
        valor: indica ? 'Tomografia indicada' : 'Tomografia dispensável',
        nivel: indica ? 'alerta' : 'ok',
        rotuloNivel: `${positivos.length} de 7 critérios`,
        detalhes: criterios.map(([rotulo, c]) => ({ rotulo, valor: c ? 'Presente' : 'Ausente', nivel: (c ? 'alerta' : 'ok') as Nivel })),
        interpretacao: [
          indica
            ? `**${positivos.length} critério(s) presente(s): tomografia indicada.** Basta um. A New Orleans tem sensibilidade próxima de 100% para qualquer lesão intracraniana, mas especificidade muito baixa — em torno de 5 a 12% —, o que significa que ela indica exame para quase todo mundo.`
            : '**Nenhum critério presente: tomografia dispensável.** Com os sete negativos, a probabilidade de lesão intracraniana é muito baixa.',
          'A New Orleans aplica-se a pacientes com **Glasgow 15 e perda de consciência**, e seu desfecho é **qualquer lesão na tomografia**, não apenas a que exige cirurgia. Essa diferença de desfecho explica a especificidade baixa.',
          'Na comparação direta com a Canadian CT Head Rule, as duas têm sensibilidade semelhante para lesão neurocirúrgica, mas a **Canadian evita muito mais exames** — e por isso é a preferida na maioria dos protocolos.',
          'Nenhuma das duas se aplica a paciente anticoagulado, com distúrbio de coagulação, com déficit neurológico focal, trauma penetrante ou Glasgow abaixo de 15.',
        ],
        conduta: [
          indica
            ? 'Solicite **tomografia de crânio sem contraste**. Considere aplicar a Canadian CT Head Rule em paralelo: se ela for negativa, há margem para decisão compartilhada, porque a lesão que a New Orleans encontra a mais raramente muda a conduta.'
            : 'Dispense a tomografia e dê alta com orientação escrita de sinais de retorno, desde que haja acompanhante e possibilidade de retorno rápido ao serviço.',
          'Oriente sobre **síndrome pós-concussional**: cefaleia, tontura, irritabilidade, dificuldade de concentração e alteração do sono são comuns nas primeiras semanas e costumam resolver. Repouso cognitivo e físico relativo por 24 a 48 horas, com retorno gradual — repouso absoluto prolongado piora os sintomas.',
          'Em atletas, aplique protocolo de **retorno gradual ao esporte** e não libere no mesmo dia: a síndrome do segundo impacto, embora rara, é catastrófica.',
        ],
        alertas: ['A New Orleans indica tomografia em quase todos os pacientes que avalia. Onde a redução de exames importa, a Canadian CT Head Rule é a regra a usar.'],
      }
    }

    const alto = sim(v, 'gcs15_2h') || sim(v, 'fraturaAberta') || sim(v, 'fraturaBase') || sim(v, 'vomitos2') || sim(v, 'idade65')
    const medio = sim(v, 'amnesia30') || sim(v, 'mecanismoPerigoso')
    const indica = alto || medio

    return {
      titulo: 'Canadian CT Head Rule',
      valor: indica ? 'Tomografia indicada' : 'Tomografia dispensável',
      nivel: alto ? 'critico' : medio ? 'alerta' : 'ok',
      rotuloNivel: alto ? 'Critério de alto risco' : medio ? 'Critério de médio risco' : 'Nenhum critério',
      detalhes: [
        { rotulo: 'Glasgow < 15 em 2 h', valor: sim(v, 'gcs15_2h') ? 'Sim' : 'Não', nivel: (sim(v, 'gcs15_2h') ? 'critico' : 'ok') as Nivel },
        { rotulo: 'Fratura aberta ou com afundamento', valor: sim(v, 'fraturaAberta') ? 'Sim' : 'Não', nivel: (sim(v, 'fraturaAberta') ? 'critico' : 'ok') as Nivel },
        { rotulo: 'Sinais de fratura de base', valor: sim(v, 'fraturaBase') ? 'Sim' : 'Não', nivel: (sim(v, 'fraturaBase') ? 'critico' : 'ok') as Nivel },
        { rotulo: '≥ 2 episódios de vômito', valor: sim(v, 'vomitos2') ? 'Sim' : 'Não', nivel: (sim(v, 'vomitos2') ? 'critico' : 'ok') as Nivel },
        { rotulo: 'Idade ≥ 65 anos', valor: sim(v, 'idade65') ? 'Sim' : 'Não', nivel: (sim(v, 'idade65') ? 'critico' : 'ok') as Nivel },
        { rotulo: 'Amnésia retrógrada ≥ 30 min', valor: sim(v, 'amnesia30') ? 'Sim' : 'Não', nivel: (sim(v, 'amnesia30') ? 'alerta' : 'ok') as Nivel, nota: 'Médio risco' },
        { rotulo: 'Mecanismo perigoso', valor: sim(v, 'mecanismoPerigoso') ? 'Sim' : 'Não', nivel: (sim(v, 'mecanismoPerigoso') ? 'alerta' : 'ok') as Nivel, nota: 'Médio risco' },
      ],
      interpretacao: [
        indica
          ? `**${alto ? 'Critério de alto risco presente' : 'Critério de médio risco presente'}: tomografia indicada.** A regra separa os dois níveis por desfecho: os de **alto risco** predizem necessidade de **intervenção neurocirúrgica** (sensibilidade de 100% nas validações) e os de **médio risco** predizem lesão visível na tomografia sem indicação cirúrgica (sensibilidade de 98 a 100%).`
          : '**Nenhum critério: tomografia dispensável.** A Canadian CT Head Rule tem sensibilidade de 100% para lesão que exige neurocirurgia e especificidade em torno de 50%, o que a torna a mais eficiente entre as regras disponíveis — ela evita cerca de metade das tomografias sem perder lesões cirúrgicas.',
        'A regra **exige** perda de consciência, amnésia ou desorientação testemunhadas, com Glasgow de 13 a 15 na chegada. Sem esse pré-requisito, ela não se aplica.',
        sim(v, 'idade65')
          ? '**Idade de 65 anos ou mais é critério de alto risco por si só.** A atrofia cerebral do idoso estira as veias emissárias que atravessam o espaço subdural e as torna vulneráveis a rupturas com trauma trivial — daí o hematoma subdural que se manifesta dias ou semanas depois, muitas vezes sem que o paciente se lembre do trauma.'
          : 'A idade não atingiu o corte de 65 anos, que é critério de alto risco isolado na regra.',
        'Ficam **fora** das duas regras: anticoagulados, com distúrbio de coagulação, déficit neurológico focal, convulsão pós-traumática, trauma penetrante, Glasgow abaixo de 13, gestantes e menores de 16 anos — que seguem o PECARN.',
      ],
      conduta: [
        indica
          ? '**Solicite tomografia de crânio sem contraste.** Diante de critério de alto risco, mantenha o paciente monitorado enquanto aguarda: são justamente esses os que podem precisar de neurocirurgia.'
          : '**Dispense a tomografia** e dê alta com orientação escrita, desde que haja acompanhante e possibilidade de retorno rápido. Documente os critérios avaliados no prontuário — é essa documentação que sustenta a decisão de não pedir exame.',
        '**Anticoagulado com trauma craniano é caso à parte.** As regras não se aplicam: tomografia para todos, e considere tomografia de controle em 6 a 24 horas ou observação prolongada mesmo com a primeira normal, pelo risco de hemorragia tardia. Reverta a anticoagulação imediatamente se houver hemorragia.',
        'Oriente sobre **síndrome pós-concussional** — cefaleia, tontura, irritabilidade, dificuldade de concentração e alteração do sono nas primeiras semanas. Repouso relativo por 24 a 48 horas e retorno gradual às atividades; repouso absoluto prolongado piora e prolonga os sintomas.',
        'Em idoso com trauma aparentemente trivial e alteração cognitiva ou funcional nas semanas seguintes, pense em **hematoma subdural crônico**: ele pode se manifestar semanas depois, muitas vezes sem memória do trauma, e é uma das causas reversíveis de declínio cognitivo que mais passam despercebidas.',
      ],
      alertas: [
        '**Nenhuma das duas regras vale para anticoagulados** ou com distúrbio de coagulação. Nesses pacientes, o limiar é imagem para todos, com vigilância para hemorragia tardia.',
        'A regra exige perda de consciência, amnésia ou desorientação testemunhadas, com Glasgow de 13 a 15. Fora desse quadro, ela não se aplica.',
        'Tomografia normal não exclui **lesão axonal difusa**, que é diagnóstico de ressonância e de clínica — suspeite quando houver rebaixamento desproporcional aos achados de imagem.',
      ],
    }
  },
  formula: [
    'Canadian — alto risco: Glasgow < 15 em 2 h · fratura aberta ou afundada · sinais de fratura de base · ≥ 2 vômitos · idade ≥ 65',
    'Canadian — médio risco: amnésia retrógrada ≥ 30 min · mecanismo perigoso',
    'New Orleans: cefaleia · vômito · idade > 60 · intoxicação · déficit de memória · trauma acima das clavículas · convulsão',
  ],
  fundamento:
    'O trauma craniano leve é o problema clássico de agulha no palheiro: mais de 90% dos pacientes que chegam com Glasgow 13 a 15 têm tomografia normal, e menos de 1% precisa de neurocirurgia — mas esse menos de 1% morre ou fica sequelado se não for encontrado. As duas regras atacam o problema de ângulos diferentes porque escolheram **desfechos diferentes**, e é isso que explica seus perfis. A New Orleans prediz **qualquer lesão na tomografia**, o que a obriga a ser permissiva e lhe dá especificidade de 5 a 12%. A Canadian separa dois níveis: critérios de alto risco predizem **necessidade de intervenção neurocirúrgica**, e os de médio risco predizem lesão visível sem cirurgia — uma estratificação que lhe permite especificidade de cerca de 50% mantendo sensibilidade de 100% para o desfecho que importa. A inclusão da idade de 65 anos como critério de alto risco isolado tem base anatômica direta: com a atrofia cerebral, o encéfalo se retrai da calota e as **veias emissárias** que atravessam o espaço subdural ficam estiradas e tensas, de modo que uma aceleração-desaceleração leve basta para rompê-las. O sangramento venoso é lento, e o espaço subdural agora amplo acomoda volume sem sintoma — daí o hematoma subdural crônico que se manifesta semanas depois, em um paciente que nem lembra do trauma.',
  armadilhas: [
    'A Canadian exige perda de consciência, amnésia ou desorientação como porta de entrada — sem isso, não há regra a aplicar.',
    'Ambas excluem anticoagulados, coagulopatas, déficit focal, convulsão pós-traumática e trauma penetrante, que são justamente os de maior risco.',
    'Intoxicação alcoólica confunde a avaliação do Glasgow e da amnésia; na dúvida, observe e reavalie em vez de aplicar a regra sobre dados não confiáveis.',
    'Tomografia normal não exclui lesão axonal difusa nem síndrome pós-concussional, que é clínica e frequentemente subestimada na alta.',
  ],
  referencias: [
    { texto: 'Stiell IG, Wells GA, Vandemheen K, et al. The Canadian CT Head Rule for patients with minor head injury. Lancet. 2001;357(9266):1391-1396.' },
    { texto: 'Haydel MJ, Preston CA, Mills TJ, et al. Indications for computed tomography in patients with minor head injury. N Engl J Med. 2000;343(2):100-105.' },
    { texto: 'Stiell IG, Clement CM, Rowe BH, et al. Comparison of the Canadian CT Head Rule and the New Orleans Criteria in patients with minor head injury. JAMA. 2005;294(12):1511-1518.' },
  ],
}

export const ferramentas: Ferramenta[] = [
  apache,
  saps3,
  vasoativas,
  infusao,
  volemia,
  bicarbonato,
  anafilaxia,
  sequenciaRapida,
  cspine,
  charlson,
  ctHead,
]

export default ferramentas
