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
    campoSimNao('fr', 'Frequência respiratória ≥ 22 irpm', 1),
    campoSimNao('mental', 'Alteração do estado mental (Glasgow < 15)', 1),
    campoSimNao('pas', 'PA sistólica ≤ 100 mmHg', 1),
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
      ],
    }
  },
  formula: ['1 ponto para cada: FR ≥ 22 | alteração mental | PAS ≤ 100 mmHg'],
  fundamento:
    'O qSOFA nasceu com o Sepsis-3, em 2016, quando a força-tarefa buscou um substituto rápido para o SOFA fora da UTI. Derivado de mais de 1,3 milhão de registros eletrônicos, foi otimizado para **predizer mortalidade**, não para detectar infecção — e essa distinção explica sua alta especificidade com baixa sensibilidade.',
  armadilhas: [
    'qSOFA não é critério diagnóstico de sepse. Sepse é infecção suspeita com aumento de 2 pontos no SOFA.',
    'Em imunossuprimidos, idosos e pacientes em uso de betabloqueador, os sinais podem estar atenuados e o escore permanece zero até fase avançada.',
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
    campoSimNao('temp', 'Temperatura > 38 °C ou < 36 °C', 1),
    campoSimNao('fc', 'Frequência cardíaca > 90 bpm', 1),
    campoSimNao('fr', 'Frequência respiratória > 20 irpm ou PaCO₂ < 32 mmHg', 1),
    campoSimNao('leuco', 'Leucócitos > 12.000, < 4.000/mm³, ou > 10% de formas jovens', 1),
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
      ],
    }
  },
  formula: ['SIRS = 2 ou mais dos 4 critérios'],
  fundamento:
    'Os critérios foram estabelecidos na conferência de consenso de 1991, com a intenção deliberada de serem simples e sensíveis, capturando a resposta do hospedeiro a qualquer agressão — infecciosa ou não (trauma, pancreatite, queimadura, cirurgia). O erro histórico não foi criá-los, foi transformá-los em definição de sepse, papel para o qual nunca foram desenhados.',
  armadilhas: ['SIRS é comum e frequentemente benigna. Dois critérios num paciente com dor pós-operatória não são sepse.'],
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
      interpretacao: [
        ['**Total 0:** monitorização mínima a cada 12 horas.', '**Total 1 a 4:** reavaliação a cada 4 a 6 horas, com decisão do enfermeiro sobre escalonamento.', '**Total 5 a 6, ou qualquer parâmetro em 3:** resposta urgente — avaliação médica em até 1 hora, monitorização de hora em hora, considerar cuidados de maior complexidade.', '**Total ≥ 7:** resposta emergencial — avaliação por equipe com competência em cuidados críticos, monitorização contínua, transferência para leito monitorizado.'][faixa],
        'A grande virtude do NEWS2 é padronizar o gatilho de escalonamento: ele transforma "achei o paciente estranho" numa linguagem comum entre enfermagem, plantão e time de resposta rápida. Sua adoção nacional no Reino Unido associou-se a redução de paradas cardíacas intra-hospitalares não previstas.',
        'A escala 2 de saturação só deve ser usada em pacientes com alvo de 88 a 92% formalmente prescrito por insuficiência respiratória hipercápnica — DPOC avançado, obesidade-hipoventilação, cifoescoliose, doença neuromuscular.',
      ],
    }
  },
  formula: ['Soma de 7 parâmetros; qualquer parâmetro isolado em 3 pontos eleva a categoria de risco'],
  fundamento:
    'O NEWS foi desenvolvido pelo Royal College of Physicians a partir da constatação de que a deterioração clínica precede a parada cardíaca em horas, com alterações mensuráveis de sinais vitais que ninguém sistematizava. A versão 2, de 2017, acrescentou a escala alternativa de saturação para retentores de CO₂ e substituiu a escala AVPU por ACVPU, incluindo confusão nova.',
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
    campoNum('pas', 'PA sistólica', { unidade: 'mmHg', min: 40, max: 260, passo: 1 }),
    campoNum('fc', 'Frequência cardíaca', { unidade: 'bpm', min: 20, max: 220, passo: 1 }),
    campoNum('fr', 'Frequência respiratória', { unidade: 'irpm', min: 4, max: 60, passo: 1 }),
    campoNum('temp', 'Temperatura', { unidade: '°C', min: 30, max: 43, passo: 0.1 }),
    campoOpc('avpu', 'Nível de consciência (AVPU)', [
      { valor: '0', rotulo: 'Alerta', pontos: 0 },
      { valor: '1', rotulo: 'Responde a voz', pontos: 1 },
      { valor: '2', rotulo: 'Responde a dor', pontos: 2 },
      { valor: '3', rotulo: 'Irresponsivo', pontos: 3 },
    ]),
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
      ],
    }
  },
  formula: ['Soma de 5 parâmetros; ≥ 5 pontos indica alto risco'],
  fundamento:
    'O MEWS derivou do sistema de alerta precoce original de Morgan (1997), refinado por Subbe em 2001 numa coorte de admissões clínicas agudas. Sua lógica é a mesma do NEWS: quantificar o desvio fisiológico de forma que qualquer profissional aplique e qualquer profissional entenda.',
  armadilhas: ['Não inclui saturação nem oxigênio suplementar, o que o torna menos sensível a insuficiência respiratória inicial.'],
  referencias: [
    { texto: 'Subbe CP, Kruger M, Rutherford P, Gemmel L. Validation of a modified Early Warning Score in medical admissions. QJM. 2001;94(10):521-526.' },
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
    'A definição de 2016 abandonou o conceito de "sepse grave" e reposicionou a sepse como disfunção orgânica ameaçadora à vida causada por resposta desregulada do hospedeiro à infecção. A mudança teve consequência prática direta: infecção com SIRS mas sem disfunção deixou de ser sepse, e a atenção se deslocou de "quem está inflamado" para "quem está falindo órgão".',
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
    'Centor derivou os critérios em 1981 numa emergência de adultos, buscando os achados clínicos que melhor discriminavam cultura positiva para estreptococo beta-hemolítico do grupo A. A lógica dos quatro itens é reconhecível: três apontam inflamação bacteriana focal e o quarto, a ausência de tosse, aponta contra infecção viral de vias aéreas.',
  armadilhas: [
    'Derivado em adultos. Em crianças de 3 a 14 anos a prevalência é bem maior, e o ajuste de McIsaac é indispensável.',
    'Portador crônico de estreptococo com faringite viral tem teste positivo e não se beneficia de antibiótico — situação comum em crianças em idade escolar.',
  ],
  referencias: [
    { texto: 'Centor RM, Witherspoon JM, Dalton HP, Brody CE, Link K. The diagnosis of strep throat in adults in the emergency room. Med Decis Making. 1981;1(3):239-246.' },
  ],
}

const mcisaac: Ferramenta = {
  id: 'mcisaac',
  nome: 'Escore de McIsaac (Centor modificado)',
  sinonimos: ['mcisaac', 'centor modificado', 'faringite crianca'],
  resumo: 'O Centor corrigido pela idade, aplicável de 3 anos em diante.',
  categorias: ['infectologia', 'pediatria'],
  campos: [
    campoSimNao('exsudato', 'Exsudato ou hipertrofia amigdaliana', 1),
    campoSimNao('adenopatia', 'Adenopatia cervical anterior dolorosa', 1),
    campoSimNao('febre', 'História de febre (> 38 °C)', 1),
    campoSimNao('semTosse', 'Ausência de tosse', 1),
    campoOpc('idadeCat', 'Idade', [
      { valor: '1', rotulo: '3 a 14 anos', pontos: 1 },
      { valor: '0', rotulo: '15 a 44 anos', pontos: 0 },
      { valor: '-1', rotulo: '45 anos ou mais', pontos: -1 },
    ]),
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
      ],
    }
  },
  formula: ['Centor (4 itens) + 1 ponto se 3–14 anos, 0 se 15–44, −1 se ≥ 45'],
  fundamento:
    'McIsaac validou o Centor numa população de atenção primária que incluía crianças e observou que a idade é um preditor independente forte — a prevalência de faringite estreptocócica varia de menos de 5% em adultos acima de 45 anos a mais de 30% em escolares. O ajuste etário melhorou substancialmente a calibração.',
  armadilhas: [
    'Abaixo de 3 anos, faringite estreptocócica é rara e a febre reumática praticamente não ocorre — não se recomenda testar rotineiramente.',
    'Escarlatina (exantema micropapular áspero, língua em framboesa, linhas de Pastia) muda a conduta independentemente do escore.',
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
    campoSimNao('gram', 'Coloração de Gram do líquor positiva', 1),
    campoSimNao('neutroLiquor', 'Neutrófilos no líquor ≥ 1.000/µL', 1),
    campoSimNao('proteinaLiquor', 'Proteína no líquor ≥ 80 mg/dL', 1),
    campoSimNao('neutroSangue', 'Neutrófilos no sangue periférico ≥ 10.000/µL', 1),
    campoSimNao('convulsao', 'Convulsão na apresentação ou antes dela', 1),
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
      ],
      alertas: ['Antibiótico prévio pode "esterilizar" o líquor e reduzir os parâmetros inflamatórios, invalidando o escore.'],
    }
  },
  formula: ['Risco muito baixo = nenhum dos 5 critérios presente'],
  fundamento:
    'Nigrovic e colaboradores partiram do problema clínico real: a maioria esmagadora das crianças com pleocitose liquórica tem meningite viral, mas quase todas recebem antibiótico e internação até as culturas ficarem prontas. O escore identifica com segurança altíssima o grupo que não precisa disso — sua utilidade está inteiramente no valor preditivo negativo.',
  armadilhas: [
    'Punção traumática altera a contagem de células e a proteína. Correções (regra de 1 leucócito para cada 500 a 700 hemácias) são imprecisas — na dúvida, trate.',
    'Meningococcemia pode cursar com líquor pouco alterado e evolução fulminante. Petéquia ou púrpura é indicação de antibiótico imediato, escore nenhum.',
  ],
  referencias: [
    { texto: 'Nigrovic LE, Kuppermann N, Macias CG, et al. Clinical prediction rule for identifying children with cerebrospinal fluid pleocytosis at very low risk of bacterial meningitis. JAMA. 2007;297(1):52-60.' },
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
    'A escolha entre via endovenosa e oral raramente é farmacológica — é cultural. Para muitos antimicrobianos a exposição plasmática por via oral é indistinguível da endovenosa, e a resistência à troca vem de hábito, não de evidência. Reconhecer os fármacos de alta biodisponibilidade é o primeiro passo para o descalonamento.',
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
    'A concentração inibitória mínima é determinada por diluições sucessivas de base 2 — 0,25; 0,5; 1; 2; 4 mg/L — e por isso a resolução do método é grosseira: uma diferença de uma diluição está dentro do erro experimental. A categorização em S, I e R traduz a CIM para uma linguagem clínica, integrando a farmacocinética do fármaco no sítio de infecção e os dados de desfecho clínico disponíveis.',
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
    'O calendário brasileiro é dos mais completos do mundo em oferta pública. Sua arquitetura segue duas lógicas: proteger o quanto antes contra as doenças cuja letalidade é maior no primeiro ano (coqueluche, meningite, pneumococo) e aproveitar janelas imunológicas em que a resposta é melhor (HPV antes da exposição, dTpa na gestação para transferência transplacentária).',
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
    'A relevância clínica de uma interação depende de três fatores: a magnitude da alteração farmacocinética, a janela terapêutica do fármaco afetado e a gravidade do desfecho. Rifampicina com varfarina é grave porque reúne os três — indução potente, janela estreita e desfecho trombótico. Já muitas interações listadas em bula têm magnitude pequena e janela larga, e não mudam conduta.',
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
