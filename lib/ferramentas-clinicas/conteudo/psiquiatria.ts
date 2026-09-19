import type { Campo, Ferramenta, Nivel } from '../tipos'
import { campoOpc, campoSeg, campoSexo, campoSimNao, fmtInt, opc, ptsOpc, sim } from '../helpers'

/* ═══════════════════════ Utilidades da categoria ═══════════════════════ */

/**
 * Alternativas de frequência dos últimos 14 dias, na redação do PHQ e do GAD.
 *
 * Os dois instrumentos compartilham a mesma âncora temporal e a mesma escala de
 * 0 a 3, e é isso que permite somá-los na mesma consulta sem trocar de régua.
 */
const FREQUENCIA_14_DIAS = [
  { valor: '0', rotulo: 'Nenhum dia', pontos: 0 },
  { valor: '1', rotulo: 'Vários dias', pontos: 1 },
  { valor: '2', rotulo: 'Mais da metade dos dias', pontos: 2 },
  { valor: '3', rotulo: 'Quase todos os dias', pontos: 3 },
]

/** Cria um item de escala de frequência, que é a forma dominante nesta categoria. */
function itemFrequencia(id: string, rotulo: string, ajuda?: string) {
  return campoOpc(id, rotulo, FREQUENCIA_14_DIAS, { padrao: '0', ajuda })
}

/* ═══════════════════════════ 1. PHQ-9 / PHQ-2 ═══════════════════════════ */

const ITENS_PHQ9 = ['interesse', 'humor', 'sono', 'energia', 'apetite', 'autoimagem', 'concentracao', 'psicomotor', 'ideacao']

const phq9: Ferramenta = {
  id: 'phq-9',
  nome: 'PHQ-9 e PHQ-2 — rastreio e gravidade da depressão',
  sigla: 'PHQ-9',
  sinonimos: ['phq9', 'phq2', 'patient health questionnaire', 'rastreio depressao', 'escala de depressao'],
  resumo: 'Rastreia depressão em dois itens e mede gravidade em nove, na mesma escala usada para acompanhar resposta ao tratamento.',
  categorias: ['psiquiatria'],
  campos: [
    itemFrequencia('interesse', '1. Pouco interesse ou pouco prazer em fazer as coisas', 'Este item e o seguinte formam o PHQ-2: se ambos somarem 3 ou mais, o rastreio é positivo e o questionário completo se justifica.'),
    itemFrequencia('humor', '2. Sentir-se para baixo, deprimido ou sem perspectiva'),
    itemFrequencia('sono', '3. Dificuldade para pegar no sono, permanecer dormindo, ou dormir demais', 'Insônia terminal — acordar de madrugada sem voltar a dormir — é a mais associada a depressão melancólica; hipersonia aponta o padrão atípico.'),
    itemFrequencia('energia', '4. Sentir-se cansado ou com pouca energia'),
    itemFrequencia('apetite', '5. Falta de apetite ou comer demais', 'Registre também a variação de peso: perda não intencional maior que 5% em um mês é critério adicional de gravidade.'),
    itemFrequencia('autoimagem', '6. Sentir-se mal consigo mesmo, um fracasso, ou ter decepcionado a família'),
    itemFrequencia('concentracao', '7. Dificuldade de concentração, como ler ou assistir televisão', 'Em idosos, a queixa de concentração e memória exige diferenciar depressão de comprometimento cognitivo — os dois coexistem com frequência.'),
    itemFrequencia('psicomotor', '8. Lentidão para se mover ou falar, ou o oposto, inquietação incomum', 'É o único item que o entrevistador pode observar diretamente, e a lentificação psicomotora é marcador de gravidade.'),
    itemFrequencia('ideacao', '9. Pensar em se ferir de alguma maneira ou que seria melhor estar morto', 'Qualquer resposta diferente de "nenhum dia" obriga avaliação de risco na mesma consulta, com o C-SSRS ou equivalente. Este item não pode ser somado e esquecido.'),
    campoSimNao('dificuldade', 'Os sintomas dificultam o trabalho, a vida em casa ou o relacionamento com as pessoas', 0, 'Pergunta final do questionário. Não entra na soma, mas é ela que separa sintoma de transtorno — sem prejuízo funcional, não há diagnóstico.'),
  ],
  calcular: (v) => {
    const respostas = ITENS_PHQ9.map((id) => Number(opc(v, id) ?? '0'))
    if (respostas.some((r) => Number.isNaN(r))) return null
    const total = respostas.reduce((a, b) => a + b, 0)
    const phq2 = respostas[0] + respostas[1]
    const ideacao = respostas[8]
    const itensPresentes = respostas.filter((r) => r >= 2).length
    const nucleares = respostas[0] >= 2 || respostas[1] >= 2

    const nivel: Nivel = total >= 20 ? 'critico' : total >= 15 ? 'alerta' : total >= 10 ? 'atencao' : total >= 5 ? 'atencao' : 'ok'
    const faixa =
      total >= 20 ? 'Depressão grave' : total >= 15 ? 'Moderadamente grave' : total >= 10 ? 'Moderada' : total >= 5 ? 'Leve' : 'Mínima'

    const interpretacao: string[] = [
      `**Total de ${total} pontos — ${faixa.toLowerCase()}.** As faixas do PHQ-9 são 0 a 4 (mínima), 5 a 9 (leve), 10 a 14 (moderada), 15 a 19 (moderadamente grave) e 20 a 27 (grave). O ponto de corte de **10** é o mais usado, com sensibilidade e especificidade em torno de 85% para episódio depressivo maior.`,
      `**PHQ-2 (itens 1 e 2): ${phq2} pontos.** Três ou mais indica rastreio positivo — é a versão de dois itens, feita para caber em qualquer consulta e usada como porta de entrada para o questionário completo.`,
    ]
    if (ideacao > 0) {
      interpretacao.push(
        `**Item 9 positivo (${FREQUENCIA_14_DIAS[ideacao].rotulo.toLowerCase()}).** Isso não é um ponto a mais na soma: é o achado que muda a consulta. Avalie risco de suicídio agora, com pergunta direta sobre plano, meio disponível, intenção e tentativa prévia.`,
      )
    }
    if (!nucleares && total >= 10) {
      interpretacao.push(
        'Atenção: o total está na faixa de depressão moderada, mas **nenhum dos dois sintomas nucleares** (anedonia e humor deprimido) atinge a frequência de "mais da metade dos dias". O diagnóstico de episódio depressivo maior exige pelo menos um deles — reveja se o quadro não é melhor explicado por ansiedade, doença clínica, uso de substância ou transtorno do sono.',
      )
    }
    interpretacao.push(
      `Pelo **algoritmo diagnóstico** (e não pela soma), o PHQ-9 sugere episódio depressivo maior quando há ${itensPresentes} de 9 itens em "mais da metade dos dias" — são necessários 5 ou mais, incluindo o item 1 ou o item 2. Aqui: ${itensPresentes} item(ns) e sintoma nuclear ${nucleares ? 'presente' : 'ausente'}.`,
    )

    const conduta: string[] = []
    if (ideacao > 0) {
      conduta.push(
        '**Antes de qualquer outra coisa:** conduza a avaliação de risco de suicídio nesta consulta. Pergunte de forma direta sobre plano, meio disponível, intenção, tentativas prévias e fatores de proteção — perguntar não induz o ato, e não perguntar é a omissão mais documentada nesse cenário. Restrinja o acesso ao meio (arma, medicamento acumulado), envolva alguém de confiança e defina retorno em dias, não semanas.',
      )
    }
    if (total < 5) {
      conduta.push('**Mínima (0 a 4):** nenhum tratamento específico. Se houver queixa apesar do escore baixo, investigue causas clínicas — hipotireoidismo, anemia, deficiência de vitamina B12, apneia do sono — e fatores de vida.')
    } else if (total < 10) {
      conduta.push('**Leve (5 a 9):** vigilância ativa com reavaliação em 2 a 4 semanas. Psicoterapia, atividade física estruturada e higiene do sono têm eficácia nessa faixa; antidepressivo tem benefício pequeno sobre placebo e não é primeira escolha.')
    } else if (total < 15) {
      conduta.push('**Moderada (10 a 14):** ofereça psicoterapia (cognitivo-comportamental ou interpessoal) **ou** antidepressivo — as duas têm eficácia semelhante nessa faixa, e a escolha deve considerar preferência, disponibilidade e tentativas anteriores.')
    } else if (total < 20) {
      conduta.push('**Moderadamente grave (15 a 19):** trate com antidepressivo **e** psicoterapia combinados, que superam qualquer das duas isoladas nessa gravidade. Reavalie em 2 semanas para adesão e efeito adverso.')
    } else {
      conduta.push('**Grave (≥ 20):** tratamento combinado, com limiar baixo para encaminhamento ao psiquiatra. Avalie sintomas psicóticos, catatonia, recusa alimentar e risco — todos indicam avaliação de internação, e a eletroconvulsoterapia é opção de primeira linha na depressão grave com risco iminente ou catatonia.',
      )
    }
    conduta.push(
      'Use o mesmo PHQ-9 para **medir resposta**, e não apenas para diagnosticar: redução de 50% do escore basal define resposta, e total abaixo de 5 define remissão, que é a meta. Uma queda de 5 pontos já é clinicamente perceptível ao paciente.',
      'Reavalie em **2 a 4 semanas** após iniciar ou ajustar tratamento. O antidepressivo leva 2 a 4 semanas para efeito inicial e 6 a 8 para efeito pleno — trocar antes disso confunde ausência de tempo com falha terapêutica, e é a causa mais comum de "depressão refratária" aparente.',
      'Antes de rotular como depressão, **exclua bipolaridade** com o MDQ ou com a pergunta direta sobre períodos de humor elevado, energia aumentada e redução da necessidade de sono. Antidepressivo isolado em depressão bipolar pode virar a fase e induzir mania.',
    )

    return {
      titulo: 'PHQ-9',
      valor: fmtInt(total),
      unidade: 'de 27 pontos',
      nivel,
      rotuloNivel: faixa,
      detalhes: [
        { rotulo: 'PHQ-2 (itens 1 e 2)', valor: `${phq2} de 6`, nivel: phq2 >= 3 ? 'alerta' : 'ok', nota: phq2 >= 3 ? 'Rastreio positivo' : 'Rastreio negativo' },
        { rotulo: 'Item 9 — ideação', valor: ideacao > 0 ? FREQUENCIA_14_DIAS[ideacao].rotulo : 'Nenhum dia', nivel: ideacao > 0 ? 'critico' : 'ok' },
        { rotulo: 'Sintoma nuclear presente', valor: nucleares ? 'Sim' : 'Não', nota: 'Anedonia ou humor deprimido em mais da metade dos dias' },
        { rotulo: 'Itens em ≥ metade dos dias', valor: `${itensPresentes} de 9`, nota: 'O algoritmo diagnóstico exige 5 ou mais' },
        { rotulo: 'Prejuízo funcional relatado', valor: sim(v, 'dificuldade') ? 'Sim' : 'Não' },
      ],
      interpretacao,
      conduta,
      alertas:
        ideacao > 0
          ? ['**Item 9 positivo.** Avaliação de risco de suicídio nesta consulta, não na próxima. Pergunte sobre plano, meio e intenção, restrinja o acesso ao meio e defina um plano de segurança por escrito com o paciente.']
          : ['O PHQ-9 é instrumento de rastreio e de medida de gravidade — **não é diagnóstico**. O diagnóstico exige entrevista clínica, prejuízo funcional e exclusão de causa clínica, de substância e de bipolaridade.'],
    }
  },
  formula: ['PHQ-9 = soma dos 9 itens (0 a 3 cada), total de 0 a 27', 'PHQ-2 = itens 1 e 2, corte ≥ 3'],
  fundamento:
    'O PHQ-9 é a tradução direta dos nove critérios sintomáticos do DSM para episódio depressivo maior, um item por critério, ancorados nos últimos 14 dias — a mesma janela temporal que o manual exige. Essa correspondência item a critério é o que o distingue das escalas dimensionais construídas por análise fatorial e o que lhe dá dupla função: somado, mede gravidade; lido item a item, aplica o algoritmo diagnóstico. A escala de 0 a 3 por frequência, e não por intensidade, foi escolhida porque frequência é mais reprodutível entre pacientes e entre aplicações: "quase todos os dias" significa a mesma coisa para pessoas diferentes, enquanto "muito intenso" não. O instrumento deriva do PRIME-MD, desenhado nos anos 1990 para que médicos não psiquiatras pudessem identificar transtornos mentais na atenção primária em minutos, e é hoje a escala de depressão mais usada no mundo justamente por ser breve, autoaplicável, de domínio público e sensível a mudança.',
  armadilhas: [
    'Somatizar o escore em idosos e em doentes crônicos infla o total: fadiga, alteração de sono, apetite e concentração têm causa clínica frequente. A **escala geriátrica de depressão (GDS)**, que evita itens somáticos, discrimina melhor nessa população.',
    'O item 9 é sobre ideação passiva **ou** ativa, e um escore total baixo com item 9 positivo é mais perigoso que um total alto com item 9 zerado. Nunca leia apenas a soma.',
    'Aplicar o PHQ-9 sem excluir bipolaridade leva a prescrever antidepressivo isolado a quem tem depressão bipolar — risco de virada maníaca e de ciclagem rápida.',
    'Em pessoas com dor crônica, doença de Parkinson, hipotireoidismo, apneia do sono ou uso de corticoide, betabloqueador ou isotretinoína, o escore alto pode refletir a condição de base. Tratar a causa muda o escore sem antidepressivo.',
  ],
  referencias: [
    { texto: 'Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med. 2001;16(9):606-613.' },
    { texto: 'Santos IS, Tavares BF, Munhoz TN, et al. Sensibilidade e especificidade do Patient Health Questionnaire-9 (PHQ-9) entre adultos da população geral. Cad Saúde Pública. 2013;29(8):1533-1543.' },
    { texto: 'US Preventive Services Task Force. Screening for Depression and Suicide Risk in Adults: US Preventive Services Task Force Recommendation Statement. JAMA. 2023;329(23):2057-2067.' },
  ],
}

/* ═══════════════════════════════ 2. GAD-7 ═══════════════════════════════ */

const ITENS_GAD7 = ['nervoso', 'preocupacao', 'preocupaDemais', 'relaxar', 'inquieto', 'irritado', 'medo']

const gad7: Ferramenta = {
  id: 'gad-7',
  nome: 'GAD-7 e GAD-2 — rastreio e gravidade da ansiedade',
  sigla: 'GAD-7',
  sinonimos: ['gad7', 'gad2', 'ansiedade generalizada', 'rastreio ansiedade', 'escala de ansiedade'],
  resumo: 'Mede gravidade de ansiedade em sete itens e rastreia em dois, na mesma escala de frequência do PHQ-9.',
  categorias: ['psiquiatria'],
  campos: [
    itemFrequencia('nervoso', '1. Sentir-se nervoso, ansioso ou muito tenso', 'Este item e o seguinte formam o GAD-2, cujo corte de 3 pontos rastreia os principais transtornos de ansiedade.'),
    itemFrequencia('preocupacao', '2. Não ser capaz de impedir ou controlar as preocupações'),
    itemFrequencia('preocupaDemais', '3. Preocupar-se muito com diversas coisas', 'A preocupação difusa e sobre vários domínios é o que caracteriza o transtorno de ansiedade generalizada e o distingue do pânico e da fobia social.'),
    itemFrequencia('relaxar', '4. Dificuldade para relaxar'),
    itemFrequencia('inquieto', '5. Ficar tão agitado que se torna difícil permanecer sentado'),
    itemFrequencia('irritado', '6. Ficar facilmente aborrecido ou irritado', 'Irritabilidade é manifestação frequente de ansiedade e é o motivo de muitos quadros ansiosos chegarem como "problema de comportamento", sobretudo em adolescentes e homens.'),
    itemFrequencia('medo', '7. Sentir medo como se algo terrível fosse acontecer'),
  ],
  calcular: (v) => {
    const respostas = ITENS_GAD7.map((id) => Number(opc(v, id) ?? '0'))
    if (respostas.some((r) => Number.isNaN(r))) return null
    const total = respostas.reduce((a, b) => a + b, 0)
    const gad2 = respostas[0] + respostas[1]

    const nivel: Nivel = total >= 15 ? 'alerta' : total >= 10 ? 'atencao' : total >= 5 ? 'atencao' : 'ok'
    const faixa = total >= 15 ? 'Ansiedade grave' : total >= 10 ? 'Moderada' : total >= 5 ? 'Leve' : 'Mínima'

    const conduta: string[] = []
    if (total < 5) {
      conduta.push('**Mínima (0 a 4):** sem indicação de tratamento específico. Se há queixa apesar do escore, investigue causa clínica — hipertireoidismo, arritmia, feocromocitoma (raro), abstinência de álcool ou benzodiazepínico, e cafeína em excesso.')
    } else if (total < 10) {
      conduta.push('**Leve (5 a 9):** psicoeducação, atividade física regular, redução de cafeína e álcool, higiene do sono e técnicas de respiração. Reavalie em 4 semanas antes de considerar farmacoterapia.')
    } else if (total < 15) {
      conduta.push('**Moderada (10 a 14):** ofereça **terapia cognitivo-comportamental**, que é a de melhor evidência, ou **inibidor seletivo da recaptação de serotonina** (sertralina, escitalopram) em dose inicial baixa — comece pela metade da dose habitual, porque o ansioso é particularmente sensível à piora inicial da ansiedade.')
    } else {
      conduta.push('**Grave (≥ 15):** combine psicoterapia e farmacoterapia, e encaminhe ao psiquiatra se houver comorbidade, refratariedade ou prejuízo importante. Avalie ativamente pânico, agorafobia e uso de substância, que frequentemente coexistem e mudam o tratamento.')
    }
    conduta.push(
      'Evite **benzodiazepínico como tratamento de manutenção**: ele alivia rápido e por isso é reforçado, mas gera tolerância, dependência, prejuízo cognitivo, quedas em idosos e piora o prognóstico a longo prazo. Se for usado, que seja por poucas semanas, com data de retirada combinada desde a primeira receita.',
      'Mantenha o antidepressivo por **pelo menos 12 meses após a remissão** nos transtornos de ansiedade — a recaída após retirada precoce é alta, e a suspensão deve ser gradual ao longo de semanas.',
      'Rastreie **depressão associada** com o PHQ-9: a comorbidade entre ansiedade e depressão passa de 50%, piora o prognóstico dos dois e muda a escolha do fármaco e a intensidade do acompanhamento.',
    )

    return {
      titulo: 'GAD-7',
      valor: fmtInt(total),
      unidade: 'de 21 pontos',
      nivel,
      rotuloNivel: faixa,
      detalhes: [
        { rotulo: 'GAD-2 (itens 1 e 2)', valor: `${gad2} de 6`, nivel: gad2 >= 3 ? 'alerta' : 'ok', nota: gad2 >= 3 ? 'Rastreio positivo' : 'Rastreio negativo' },
        { rotulo: 'Faixa', valor: faixa, nota: '0-4 mínima · 5-9 leve · 10-14 moderada · ≥ 15 grave' },
        { rotulo: 'Corte de rastreio', valor: total >= 10 ? 'Acima de 10' : 'Abaixo de 10', nota: 'Corte de 10 para ansiedade generalizada provável' },
      ],
      interpretacao: [
        `**Total de ${total} pontos — ${faixa.toLowerCase()}.** O corte de **10** tem sensibilidade de 89% e especificidade de 82% para transtorno de ansiedade generalizada, e desempenho razoável também para pânico, fobia social e estresse pós-traumático — motivo pelo qual o GAD-7 funciona como rastreio de ansiedade em geral, e não só do transtorno que lhe dá o nome.`,
        `**GAD-2: ${gad2} pontos.** Com corte de 3, ele detecta a maioria dos transtornos de ansiedade em menos de um minuto e serve como porta de entrada, igual ao PHQ-2 para depressão.`,
        'Escore alto **não identifica qual** transtorno de ansiedade está presente. A diferenciação é clínica: preocupação difusa e persistente aponta ansiedade generalizada; crises súbitas com sintomas autonômicos e medo de morrer apontam pânico; medo de julgamento em situações sociais aponta fobia social; ansiedade ligada a trauma aponta estresse pós-traumático.',
        'Use o mesmo instrumento em série para medir resposta: **redução de 4 pontos ou mais** é considerada mudança clinicamente relevante, e a meta do tratamento é remissão (abaixo de 5), não apenas melhora.',
      ],
      conduta,
      alertas: [
        'Ansiedade de início recente após os 40 anos, ou sem gatilho identificável, exige **investigação clínica** antes do rótulo psiquiátrico: hipertireoidismo, arritmia, embolia pulmonar, hipoglicemia, feocromocitoma, abstinência de álcool ou benzodiazepínico e efeito de fármacos (corticoide, broncodilatador, descongestionante, estimulante) produzem quadro idêntico.',
      ],
    }
  },
  formula: ['GAD-7 = soma dos 7 itens (0 a 3 cada), total de 0 a 21', 'GAD-2 = itens 1 e 2, corte ≥ 3'],
  fundamento:
    'O GAD-7 foi derivado de um conjunto inicial de 13 itens aplicados a quase 3.000 pacientes de atenção primária: os sete que melhor discriminaram ansiedade generalizada de sua ausência foram mantidos, e o resultado é uma escala unidimensional que mede preocupação, tensão e apreensão — os três componentes centrais da ansiedade patológica. Fisiopatologicamente, esses sintomas refletem a hiperatividade de um circuito de ameaça que tem a amígdala no centro, com falha do controle inibitório exercido pelo córtex pré-frontal ventromedial: a amígdala dispara a resposta de alarme, o eixo hipotálamo-hipófise-adrenal e o simpático produzem as manifestações somáticas, e a preocupação persistente é, em parte, uma estratégia cognitiva de evitação que reduz a ativação emocional no curto prazo e perpetua o transtorno no longo. É por isso que a terapia cognitivo-comportamental, que impede a evitação e força a exposição à incerteza, tem eficácia comparável à farmacoterapia e efeito mais duradouro após a alta.',
  armadilhas: [
    'O GAD-7 não distingue os transtornos de ansiedade entre si nem separa ansiedade de depressão — escores altos nos dois instrumentos são a regra, não a exceção.',
    'Cafeína, nicotina, descongestionantes, broncodilatadores, corticoides, estimulantes e abstinência de álcool ou benzodiazepínico produzem escores altos por mecanismo farmacológico, não psiquiátrico.',
    'Em pacientes com doença clínica ativa, ansiedade proporcional à ameaça real não é transtorno. O que define patologia é a desproporção, a persistência e o prejuízo funcional.',
    'Escore baixo não exclui **transtorno de pânico**, em que o paciente pode estar assintomático entre as crises e pontuar pouco nos 14 dias avaliados.',
  ],
  referencias: [
    { texto: 'Spitzer RL, Kroenke K, Williams JB, Löwe B. A brief measure for assessing generalized anxiety disorder: the GAD-7. Arch Intern Med. 2006;166(10):1092-1097.' },
    { texto: 'Moreno AL, DeSousa DA, Souza AMFLP, et al. Factor structure, reliability, and item parameters of the Brazilian-Portuguese version of the GAD-7 questionnaire. Temas Psicol. 2016;24(1):367-376.' },
  ],
}

/* ════════════════════════════ 3. AUDIT / CAGE ════════════════════════════ */

/**
 * Campos do AUDIT-C e do CAGE, extraídos para uma constante nomeada.
 *
 * `ptsOpc` precisa do array de campos para achar os pontos da alternativa
 * escolhida, e dentro de `calcular` só existe o mapa de valores. Nomear os
 * campos é o padrão que o catálogo já usa em `dasiCampos`.
 */
const auditCampos: Campo[] = [
  campoSeg('instrumento', 'Instrumento', [
    { valor: 'auditc', rotulo: 'AUDIT-C (3 itens)' },
    { valor: 'cage', rotulo: 'CAGE (4 itens)' },
  ], { ajuda: 'O AUDIT-C mede quantidade e padrão de consumo e detecta uso de risco; o CAGE detecta dependência estabelecida e é pouco sensível ao consumo de risco sem dependência.' }),
  campoSexo('sexo', 'Sexo biológico'),
  campoOpc('c1', 'Com que frequência você consome bebida alcoólica?', [
    { valor: '0', rotulo: 'Nunca', pontos: 0 },
    { valor: '1', rotulo: 'Uma vez por mês ou menos', pontos: 1 },
    { valor: '2', rotulo: '2 a 4 vezes por mês', pontos: 2 },
    { valor: '3', rotulo: '2 a 3 vezes por semana', pontos: 3 },
    { valor: '4', rotulo: '4 ou mais vezes por semana', pontos: 4 },
  ], { padrao: '0', mostrarSe: (v) => opc(v, 'instrumento') === 'auditc', ajuda: 'Uma dose padrão tem cerca de 14 g de etanol: uma lata de cerveja de 350 mL, uma taça de vinho de 150 mL ou uma dose de destilado de 45 mL.' }),
  campoOpc('c2', 'Quantas doses você consome num dia normal em que bebe?', [
    { valor: '0', rotulo: '1 ou 2', pontos: 0 },
    { valor: '1', rotulo: '3 ou 4', pontos: 1 },
    { valor: '2', rotulo: '5 ou 6', pontos: 2 },
    { valor: '3', rotulo: '7 a 9', pontos: 3 },
    { valor: '4', rotulo: '10 ou mais', pontos: 4 },
  ], { padrao: '0', mostrarSe: (v) => opc(v, 'instrumento') === 'auditc' }),
  campoOpc('c3', 'Com que frequência você consome 5 (homens) ou 4 (mulheres) doses ou mais numa ocasião?', [
    { valor: '0', rotulo: 'Nunca', pontos: 0 },
    { valor: '1', rotulo: 'Menos que uma vez por mês', pontos: 1 },
    { valor: '2', rotulo: 'Mensalmente', pontos: 2 },
    { valor: '3', rotulo: 'Semanalmente', pontos: 3 },
    { valor: '4', rotulo: 'Diariamente ou quase', pontos: 4 },
  ], { padrao: '0', mostrarSe: (v) => opc(v, 'instrumento') === 'auditc', ajuda: 'Este item isolado — o padrão de beber pesado episódico — é o que mais se associa a trauma, violência e intoxicação aguda, mesmo em quem bebe pouco no total da semana.' }),
  campoSimNao('cut', 'C — Já sentiu que deveria diminuir (cut down) a bebida?', 1, undefined),
  campoSimNao('annoyed', 'A — Já se sentiu incomodado (annoyed) com críticas sobre seu modo de beber?', 1, undefined),
  campoSimNao('guilty', 'G — Já se sentiu culpado (guilty) pelo seu modo de beber?', 1, undefined),
  campoSimNao('eyeopener', 'E — Já bebeu logo ao acordar (eye-opener) para acalmar os nervos ou curar a ressaca?', 1, 'Este item é o de maior peso clínico: beber ao acordar indica tolerância e abstinência matinal, ou seja, dependência fisiológica instalada.'),
]

const audit: Ferramenta = {
  id: 'audit-c',
  nome: 'AUDIT, AUDIT-C e CAGE — rastreio de uso de álcool',
  sigla: 'AUDIT',
  sinonimos: ['audit', 'auditc', 'cage', 'alcool', 'rastreio alcoolismo', 'uso de risco'],
  resumo: 'Rastreia consumo de risco, uso nocivo e dependência de álcool em três, dez ou quatro perguntas.',
  categorias: ['psiquiatria'],
  campos: auditCampos,
  calcular: (v) => {
    const instrumento = opc(v, 'instrumento') ?? 'auditc'
    const feminino = opc(v, 'sexo') === 'f'

    if (instrumento === 'cage') {
      const itens: [string, boolean][] = [
        ['C — Deveria diminuir', sim(v, 'cut')],
        ['A — Incomodado com críticas', sim(v, 'annoyed')],
        ['G — Culpado', sim(v, 'guilty')],
        ['E — Bebe ao acordar', sim(v, 'eyeopener')],
      ]
      const total = itens.filter(([, s]) => s).length
      const positivo = total >= 2
      return {
        titulo: 'CAGE',
        valor: fmtInt(total),
        unidade: 'de 4',
        nivel: total >= 3 ? 'critico' : positivo ? 'alerta' : total === 1 ? 'atencao' : 'ok',
        rotuloNivel: total >= 3 ? 'Dependência muito provável' : positivo ? 'Rastreio positivo' : total === 1 ? 'Limítrofe' : 'Negativo',
        detalhes: itens.map(([rotulo, s]) => ({ rotulo, valor: s ? 'Sim' : 'Não', nivel: (s ? 'alerta' : 'ok') as Nivel })),
        interpretacao: [
          `**${total} de 4 respostas afirmativas.** O corte clássico é **2 ou mais**, com sensibilidade de cerca de 70% e especificidade de 90% para dependência de álcool. Com 3 ou 4, o valor preditivo positivo é alto o bastante para tratar a dependência como estabelecida.`,
          'O CAGE tem uma limitação importante de desenho: ele pergunta sobre **a vida inteira**, não sobre o consumo atual. Um paciente em remissão há 20 anos continua respondendo sim, e um bebedor de risco recente pode responder não a tudo.',
          'Ele detecta **dependência**, não consumo de risco. Para identificar quem bebe acima do limiar seguro sem ainda ter dependência — o grupo em que a intervenção breve mais funciona —, o AUDIT-C é muito superior.',
          sim(v, 'eyeopener')
            ? '**Beber ao acordar é o item mais grave da escala.** Indica abstinência matinal e, portanto, dependência fisiológica, com risco de síndrome de abstinência grave se houver interrupção abrupta.'
            : 'O item "beber ao acordar" está negativo, o que torna menos provável a abstinência fisiológica matinal.',
        ],
        conduta: [
          positivo
            ? '**Rastreio positivo:** aprofunde com entrevista sobre quantidade, frequência, tolerância, abstinência, perda de controle e prejuízo, e aplique os critérios de transtorno por uso de álcool. Quantifique o consumo semanal em doses padrão.'
            : '**Rastreio negativo pelo CAGE não exclui consumo de risco.** Aplique o AUDIT-C, que detecta quantidade e padrão — a maioria dos bebedores de risco não tem dependência e escapa do CAGE.',
          'Ofereça **intervenção breve** estruturada em qualquer resultado positivo: devolva o resultado de forma não julgadora, informe o limiar de baixo risco, relacione o consumo a queixas que o paciente já tem (sono, pressão, refluxo, humor), e negocie uma meta concreta. Cinco a dez minutos de intervenção breve reduzem o consumo de forma mensurável.',
          'Em dependência, avalie o risco de **síndrome de abstinência** antes de qualquer orientação de parar: histórico de convulsão ou delirium tremens, consumo diário elevado e comorbidade clínica indicam desintoxicação supervisionada, com benzodiazepínico guiado pelo CIWA-Ar e tiamina antes de qualquer glicose.',
          'Para manutenção da abstinência, os fármacos com evidência são **naltrexona** (reduz o beber pesado; contraindicada com opioide), **acamprosato** (ajuda a manter abstinência já alcançada) e **dissulfiram** (apenas com supervisão de terceiro). Combine com grupos de apoio e acompanhamento estruturado.',
          'Rastreie e trate o que costuma acompanhar: depressão, ansiedade, transtorno do sono, hepatopatia (calcule FIB-4), desnutrição, deficiência de tiamina e folato, e outras substâncias.',
        ],
        alertas: [
          'O CAGE pergunta sobre a vida inteira e não sobre o momento atual — ele **não serve para monitorar** resposta ao tratamento nem para avaliar consumo recente.',
          'Nunca oriente interrupção abrupta em dependência grave sem avaliar risco de abstinência: convulsão e delirium tremens têm mortalidade real e são desfecho de conselho bem-intencionado.',
        ],
      }
    }

    const c1 = ptsOpc(auditCampos, v, 'c1')
    const c2 = ptsOpc(auditCampos, v, 'c2')
    const c3 = ptsOpc(auditCampos, v, 'c3')
    if (c1 === null || c2 === null || c3 === null) return null
    const total = c1 + c2 + c3
    const corte = feminino ? 3 : 4
    const positivo = total >= corte

    return {
      titulo: 'AUDIT-C',
      valor: fmtInt(total),
      unidade: 'de 12 pontos',
      nivel: total >= 8 ? 'critico' : positivo ? 'alerta' : 'ok',
      rotuloNivel: total >= 8 ? 'Consumo de alto risco' : positivo ? 'Consumo de risco' : 'Baixo risco',
      detalhes: [
        { rotulo: 'Frequência de consumo', valor: fmtInt(c1) },
        { rotulo: 'Doses por ocasião', valor: fmtInt(c2) },
        { rotulo: 'Beber pesado episódico', valor: fmtInt(c3), nivel: c3 >= 2 ? 'alerta' : 'ok' },
        { rotulo: 'Corte aplicado', valor: `≥ ${corte}`, nota: feminino ? 'Mulheres: corte 3' : 'Homens: corte 4' },
      ],
      interpretacao: [
        `**${total} pontos, com corte de ${corte} para ${feminino ? 'mulheres' : 'homens'}.** O corte é menor em mulheres porque, para a mesma dose, a alcoolemia é maior: menor volume de distribuição, menor proporção de água corporal e menor atividade da álcool-desidrogenase gástrica.`,
        positivo
          ? '**Consumo de risco identificado.** Isso não equivale a dependência: a maioria das pessoas nessa faixa não preenche critérios de transtorno por uso de álcool, e é exatamente nesse grupo que a intervenção breve tem maior efeito por paciente abordado.'
          : 'Consumo abaixo do limiar de risco pelo instrumento. Lembre que o rastreio depende do autorrelato e que a subnotificação é sistemática — reforce a pergunta se houver marcadores laboratoriais sugestivos (GGT, VCM, AST/ALT > 2).',
        c3 >= 2
          ? '**O item de beber pesado episódico está elevado.** Esse padrão se associa de forma independente a trauma, violência, acidente de trânsito, intoxicação aguda e arritmia, mesmo em quem consome pouco no total da semana.'
          : 'O padrão de beber pesado episódico é pouco frequente neste caso, o que reduz o risco de eventos agudos.',
        'Limiares de baixo risco habitualmente citados: até 14 doses por semana em homens e 7 em mulheres, com no máximo 4 e 3 doses por ocasião, respectivamente. Não há consumo com benefício cardiovascular comprovado — as análises que sugeriam benefício sofriam de viés do "abstêmio doente".',
      ],
      conduta: [
        positivo
          ? '**Aplique o AUDIT completo (10 itens)** para separar consumo de risco (8 a 15), uso nocivo (16 a 19) e provável dependência (≥ 20), porque a conduta difere em cada faixa: intervenção breve, intervenção breve com acompanhamento, e encaminhamento para tratamento especializado.'
          : '**Reforce o resultado como positivo:** dizer explicitamente que o consumo está dentro do limiar de baixo risco é uma intervenção preventiva, e evita a escalada silenciosa.',
        'Faça **intervenção breve** nos casos positivos: devolva o resultado sem julgamento, informe os limiares, conecte o consumo a sintomas que o paciente já relatou, negocie uma meta específica e mensurável, e marque retorno. O efeito é pequeno por paciente e grande em população.',
        'Quantifique em **gramas de etanol** para a conversa clínica: dose padrão de 14 g, e acima de 30 a 40 g/dia em homens e 20 g/dia em mulheres cresce o risco de hepatopatia, hipertensão, fibrilação atrial e câncer de mama, boca, faringe, esôfago, fígado e cólon.',
        'Rastreie **outras substâncias** com o ASSIST e o tabagismo com o Fagerström — o uso combinado é a regra, e o risco de câncer de cabeça e pescoço do álcool com tabaco é multiplicativo, não aditivo.',
        'Em gestantes, o limiar é **zero**: não existe quantidade segura estabelecida, e a síndrome alcoólica fetal é a principal causa evitável de deficiência intelectual.',
      ],
      alertas: [
        'AUDIT-C positivo indica **consumo de risco**, não dependência — e tratar os dois da mesma forma afasta o paciente que mais se beneficiaria da intervenção breve.',
        'Nunca oriente parar abruptamente quem bebe muito e diariamente sem avaliar risco de abstinência: convulsão e delirium tremens matam, e o conselho de "parar de uma vez" é o gatilho.',
      ],
    }
  },
  formula: ['AUDIT-C = soma dos 3 primeiros itens do AUDIT (0 a 12)', 'Corte: ≥ 4 em homens, ≥ 3 em mulheres', 'CAGE = número de respostas afirmativas (0 a 4), corte ≥ 2'],
  fundamento:
    'O AUDIT foi desenvolvido pela Organização Mundial da Saúde em um estudo de seis países com o objetivo explícito de detectar o **consumo de risco antes da dependência**, invertendo a lógica dos instrumentos anteriores, que só encontravam o problema depois de instalado. Seus três primeiros itens — frequência, quantidade por ocasião e frequência de beber pesado episódico — capturam a exposição total ao etanol e o padrão em que ela ocorre, e sozinhos têm desempenho próximo ao do questionário completo. A diferença de corte entre sexos tem base farmacocinética: para a mesma dose por quilo, a mulher atinge alcoolemia mais alta porque tem menor proporção de água corporal, menor volume de distribuição e menor atividade da álcool-desidrogenase gástrica, de modo que uma fração maior do etanol ingerido alcança a circulação. O CAGE, mais antigo, foi construído sobre a experiência subjetiva da dependência — preocupação, crítica alheia, culpa e abstinência matinal — e por isso detecta bem quem já perdeu o controle e mal quem ainda não perdeu.',
  armadilhas: [
    'O autorrelato subestima o consumo de forma sistemática, sobretudo diante de julgamento percebido. Perguntar sem juízo de valor e de forma normalizada aumenta bastante a acurácia.',
    'Marcadores laboratoriais (GGT, volume corpuscular médio, relação AST/ALT maior que 2, transferrina deficiente em carboidrato) confirmam, mas são pouco sensíveis — um laboratório normal não afasta consumo de risco.',
    'O AUDIT-C tem desempenho reduzido em idosos, em que a mesma dose produz alcoolemia maior e dano com consumo menor; considere cortes mais baixos nessa faixa.',
    'Escore alto não define o transtorno: o diagnóstico de transtorno por uso de álcool exige critérios clínicos de perda de controle, salience, tolerância, abstinência e prejuízo, e é gradado em leve, moderado e grave.',
  ],
  referencias: [
    { texto: 'Bush K, Kivlahan DR, McDonell MB, Fihn SD, Bradley KA. The AUDIT alcohol consumption questions (AUDIT-C). Arch Intern Med. 1998;158(16):1789-1795.' },
    { texto: 'Babor TF, Higgins-Biddle JC, Saunders JB, Monteiro MG. AUDIT: The Alcohol Use Disorders Identification Test — Guidelines for Use in Primary Care. 2ª ed. Genebra: OMS; 2001.' },
    { texto: 'Ewing JA. Detecting alcoholism: the CAGE questionnaire. JAMA. 1984;252(14):1905-1907.' },
  ],
}


/* ═══════════════════ 4. CIWA-Ar — abstinência alcoólica ═══════════════════ */

/** Alternativa de 0 a 7 usada nos oito itens escalares do CIWA-Ar. */
function itemCiwa(id: string, rotulo: string, rotulos: string[], ajuda?: string) {
  return campoOpc(
    id,
    rotulo,
    rotulos.map((r, i) => ({ valor: String(i), rotulo: `${i} — ${r}`, pontos: i })),
    { padrao: '0', ajuda },
  )
}

const ciwaCampos: Campo[] = [
  itemCiwa('nausea', 'Náusea e vômito', ['Ausente', 'Náusea leve, sem vômito', '', '', 'Náusea intermitente com ânsia', '', '', 'Náusea constante, ânsia e vômito'],
    'Pergunte "seu estômago está embrulhado? você vomitou?" e observe. Náusea persistente em abstinência exige afastar pancreatite, hepatite alcoólica e hemorragia digestiva antes de atribuí-la à síndrome.'),
  itemCiwa('tremor', 'Tremor (braços estendidos, dedos afastados)', ['Ausente', 'Não visível, sentido na ponta dos dedos', '', '', 'Moderado, com os braços estendidos', '', '', 'Grave, mesmo com os braços em repouso'],
    'Peça ao paciente para estender os braços e afastar os dedos. Tremor é um dos primeiros sinais e aparece de 6 a 12 h após a última dose.'),
  itemCiwa('sudorese', 'Sudorese paroxística', ['Não visível', 'Palmas úmidas', '', '', 'Gotículas de suor na testa', '', '', 'Sudorese profusa'],
    'Observe a testa e as palmas. Sudorese profusa com taquicardia marca hiperatividade autonômica importante.'),
  itemCiwa('ansiedade', 'Ansiedade', ['Tranquilo', 'Levemente ansioso', '', '', 'Moderadamente ansioso ou reticente', '', '', 'Equivalente a pânico agudo, como em delirium grave'],
    'Pergunte "você está nervoso?" e observe.'),
  itemCiwa('agitacao', 'Agitação', ['Atividade normal', 'Um pouco mais que o normal', '', '', 'Inquieto, muda de posição com frequência', '', '', 'Anda de um lado para outro ou se debate'], undefined),
  itemCiwa('tatil', 'Alterações táteis', ['Nenhuma', 'Prurido, formigamento, queimação ou dormência muito leves', 'Leves', 'Moderadas', 'Alucinações moderadamente graves', 'Alucinações graves', 'Alucinações extremamente graves', 'Alucinações contínuas'],
    'Pergunte sobre coceira, formigamento, queimação, dormência e sensação de insetos na pele. A formigação — sensação de insetos caminhando — é clássica da abstinência grave.'),
  itemCiwa('auditiva', 'Alterações auditivas', ['Ausentes', 'Sons muito leves ou capazes de assustar', 'Leves', 'Moderadas', 'Alucinações moderadamente graves', 'Alucinações graves', 'Alucinações extremamente graves', 'Alucinações contínuas'],
    'Pergunte se os sons parecem mais altos, ásperos ou assustadores, e se ouve coisas que sabe não estarem ali.'),
  itemCiwa('visual', 'Alterações visuais', ['Ausentes', 'Sensibilidade muito leve à luz', 'Leves', 'Moderadas', 'Alucinações moderadamente graves', 'Alucinações graves', 'Alucinações extremamente graves', 'Alucinações contínuas'],
    'Pergunte se a luz está incomodando, se as cores parecem diferentes e se vê coisas que sabe não estarem ali. Alucinações visuais com sensório preservado caracterizam a alucinose alcoólica; com sensório rebaixado, delirium tremens.'),
  itemCiwa('cefaleia', 'Cefaleia ou sensação de plenitude na cabeça', ['Ausente', 'Muito leve', 'Leve', 'Moderada', 'Moderadamente grave', 'Grave', 'Muito grave', 'Extremamente grave'],
    'Não pontue tontura ou vertigem aqui. Cefaleia de instalação súbita e intensa em etilista exige afastar hemorragia subaracnóidea e hematoma subdural, que são frequentes nessa população por trauma e coagulopatia.'),
  campoOpc('orientacao', 'Orientação e obnubilação do sensório', [
    { valor: '0', rotulo: '0 — Orientado, faz somas seriadas', pontos: 0 },
    { valor: '1', rotulo: '1 — Não consegue somar, incerto quanto à data', pontos: 1 },
    { valor: '2', rotulo: '2 — Desorientado no tempo em até 2 dias de calendário', pontos: 2 },
    { valor: '3', rotulo: '3 — Desorientado no tempo em mais de 2 dias', pontos: 3 },
    { valor: '4', rotulo: '4 — Desorientado no espaço ou quanto à pessoa', pontos: 4 },
  ], { padrao: '0', ajuda: 'Este item vai só até 4, e é o mais importante: desorientação com sensório obnubilado é o que separa abstinência de **delirium tremens**, cuja mortalidade sem tratamento chega a 15%.' }),
]

const ciwa: Ferramenta = {
  id: 'ciwa-ar',
  nome: 'CIWA-Ar — gravidade da abstinência alcoólica',
  sigla: 'CIWA-Ar',
  sinonimos: ['ciwa', 'abstinencia alcoolica', 'delirium tremens', 'sindrome de abstinencia', 'desintoxicacao'],
  resumo: 'Gradua a abstinência alcoólica em dez itens e define a dose de benzodiazepínico hora a hora, em vez de esquema fixo.',
  categorias: ['psiquiatria', 'emergencia'],
  campos: ciwaCampos,
  calcular: (v) => {
    const ids = ['nausea', 'tremor', 'sudorese', 'ansiedade', 'agitacao', 'tatil', 'auditiva', 'visual', 'cefaleia', 'orientacao']
    const pontos = ids.map((id) => ptsOpc(ciwaCampos, v, id))
    if (pontos.some((p) => p === null)) return null
    const total = (pontos as number[]).reduce((a, b) => a + b, 0)
    const orientacao = pontos[9] as number
    const alucinacoes = Math.max(pontos[5] as number, pontos[6] as number, pontos[7] as number)

    const nivel: Nivel = total >= 20 ? 'critico' : total >= 15 ? 'alerta' : total >= 9 ? 'atencao' : 'ok'
    const faixa = total >= 20 ? 'Grave' : total >= 15 ? 'Moderada a grave' : total >= 9 ? 'Leve a moderada' : 'Mínima'

    const conduta: string[] = []
    if (total < 9) {
      conduta.push('**Abaixo de 9:** abstinência mínima. Reavalie a cada 4 a 8 horas enquanto durar o período de risco (as primeiras 72 h). Não é necessário benzodiazepínico de rotina nessa faixa.')
    } else if (total < 15) {
      conduta.push('**9 a 14:** inicie benzodiazepínico guiado por sintoma — por exemplo, diazepam 10 a 20 mg ou lorazepam 2 a 4 mg por via oral, repetindo conforme a reavaliação. Reavalie o CIWA a cada 1 a 2 horas.')
    } else if (total < 20) {
      conduta.push('**15 a 19:** abstinência moderada a grave. Benzodiazepínico em doses maiores e reavaliação horária, em ambiente monitorado. Considere leito de maior vigilância.')
    } else {
      conduta.push('**20 ou mais:** abstinência grave, com risco de convulsão e de delirium tremens. Trate agressivamente com benzodiazepínico intravenoso e monitorização contínua, em leito de terapia intensiva ou semi-intensiva. Considere fenobarbital ou propofol nos casos refratários a doses altas de benzodiazepínico.')
    }
    conduta.push(
      'Prefira o **esquema guiado por sintoma** ao esquema de dose fixa: ele usa menos benzodiazepínico no total, encurta o tempo de tratamento e não aumenta convulsão nem delirium. Esquema fixo só se justifica quando a reavaliação frequente não é possível.',
      'Escolha o benzodiazepínico pela função hepática: **diazepam e clordiazepóxido** têm meia-vida longa e autodesmame suave, mas acumulam em cirrose e em idosos; **lorazepam** é metabolizado por glicuronidação, que a hepatopatia preserva, e é a escolha nesses pacientes.',
      '**Tiamina 300 a 500 mg por via intravenosa antes de qualquer glicose**, por 3 a 5 dias, depois por via oral. A glicose consome tiamina no metabolismo do piruvato, e administrá-la a um depletado precipita encefalopatia de Wernicke — dano neurológico irreversível causado pelo tratamento. Reponha também magnésio, folato e potássio.',
      'Procure ativamente o que se esconde atrás da abstinência: **hematoma subdural, hemorragia subaracnóidea, meningite, pneumonia, pancreatite, hepatite alcoólica, hemorragia digestiva, hipoglicemia e distúrbio eletrolítico** são frequentes em etilistas e podem tanto mimetizar quanto agravar o quadro.',
      'Antes da alta, ofereça tratamento para o transtorno por uso de álcool — **naltrexona, acamprosato ou dissulfiram**, com grupos de apoio e acompanhamento estruturado. A desintoxicação isolada, sem tratamento de manutenção, tem taxa de recaída muito alta e não muda a história natural.',
    )

    return {
      titulo: 'CIWA-Ar',
      valor: fmtInt(total),
      unidade: 'de 67 pontos',
      nivel,
      rotuloNivel: faixa,
      detalhes: [
        { rotulo: 'Orientação e sensório', valor: fmtInt(orientacao), nivel: (orientacao >= 2 ? 'critico' : 'ok') as Nivel, nota: orientacao >= 2 ? 'Obnubilação: avalie delirium tremens' : undefined },
        { rotulo: 'Pior alucinação (tátil, auditiva ou visual)', valor: fmtInt(alucinacoes), nivel: (alucinacoes >= 4 ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Faixa', valor: faixa, nota: '< 9 mínima · 9-14 leve a moderada · 15-19 moderada a grave · ≥ 20 grave' },
      ],
      interpretacao: [
        `**${total} de 67 pontos — abstinência ${faixa.toLowerCase()}.** O corte de **9** costuma ser o gatilho para iniciar benzodiazepínico guiado por sintoma, e o de **15** marca a faixa em que o risco de convulsão e de delirium tremens cresce de forma significativa.`,
        orientacao >= 2
          ? '**Há obnubilação do sensório.** Esse é o achado que diferencia abstinência de **delirium tremens**, que se instala tipicamente entre 48 e 96 horas após a última dose, cursa com desorientação, alucinações e hiperatividade autonômica intensa, e tem mortalidade de até 15% sem tratamento e de 1 a 4% com tratamento adequado.'
          : 'O sensório está preservado, o que afasta delirium tremens neste momento — mas não afasta a possibilidade de ele surgir: o pico de risco é entre 48 e 96 horas após a última dose.',
        alucinacoes >= 4
          ? 'Há alucinações significativas. Com **sensório preservado**, o quadro é de **alucinose alcoólica**, que aparece em 12 a 24 horas e tem bom prognóstico; com sensório obnubilado, trata-se de delirium tremens, que é uma emergência.'
          : 'Sem alucinações significativas relatadas neste momento.',
        'O CIWA-Ar **não diagnostica** abstinência: ele gradua a gravidade em quem já se sabe estar em abstinência. Aplicá-lo a um paciente cuja agitação tem outra causa — sepse, hipóxia, hipoglicemia, hematoma subdural, encefalopatia hepática — produz escore alto e leva a sedar quem precisa de outro tratamento.',
        'A cronologia orienta a vigilância: **tremor e ansiedade em 6 a 12 h**, **convulsão entre 12 e 48 h** (tônico-clônica generalizada, geralmente única), **alucinose entre 12 e 24 h** e **delirium tremens entre 48 e 96 h**.',
      ],
      conduta,
      alertas: [
        '**O CIWA-Ar exige paciente capaz de comunicar-se.** Ele não é válido em quem está intubado, sedado, com barreira de idioma ou com rebaixamento por outra causa — nesses casos, use escalas objetivas de hiperatividade autonômica e trate empiricamente.',
        'Escore alto atribuído à abstinência em paciente que na verdade tem **sepse, hipóxia, hipoglicemia, hemorragia intracraniana ou encefalopatia hepática** leva a sedar quem precisa de diagnóstico. Afaste essas causas antes de aceitar o escore.',
        'Nunca administre **glicose antes da tiamina** em etilista: a precipitação de encefalopatia de Wernicke é iatrogênica, evitável e irreversível.',
      ],
    }
  },
  formula: ['CIWA-Ar = soma de 9 itens de 0 a 7 mais 1 item de 0 a 4 (total de 0 a 67)'],
  fundamento:
    'O etanol potencia o receptor GABA-A e inibe o receptor NMDA do glutamato. Sob exposição crônica, o sistema nervoso compensa reduzindo a expressão e a sensibilidade dos receptores GABA-A e aumentando a de receptores NMDA — uma adaptação que mantém o equilíbrio enquanto o álcool está presente. Quando ele é retirado, a inibição gabaérgica desaparece e resta uma neurotransmissão glutamatérgica amplificada sem freio: é essa hiperexcitabilidade que produz tremor, ansiedade, hiperatividade autonômica, convulsão e, no extremo, delirium tremens. O benzodiazepínico funciona porque atua exatamente no receptor cujo tônus foi perdido, substituindo o álcool no mesmo sítio e permitindo que a regulação se reverta de forma gradual. O fenômeno do **kindling** explica por que cada episódio de abstinência tende a ser pior que o anterior: desintoxicações repetidas sensibilizam progressivamente os circuitos límbicos, de modo que o histórico de abstinências prévias, e sobretudo de convulsão ou delirium prévios, é um dos melhores preditores de gravidade — melhor, inclusive, que a quantidade consumida.',
  armadilhas: [
    'Aplicar o escore a quem não está em abstinência infla a pontuação por sintomas inespecíficos e leva a sedar um paciente com outra doença.',
    'Pacientes com abstinência grave podem ter escore baixo se estiverem obnubilados demais para relatar os sintomas subjetivos, que dominam a escala — o sensório é o item a olhar nesse caso.',
    'O CIWA não contempla os preditores de gravidade mais fortes: convulsão ou delirium tremens em abstinências anteriores, consumo diário elevado e comorbidade clínica. Para isso existe o PAWSS, aplicado na admissão.',
    'Betabloqueador e clonidina controlam os sinais autonômicos e **mascaram o escore** sem tratar a hiperexcitabilidade glutamatérgica — podem esconder a progressão para delirium tremens.',
  ],
  referencias: [
    { texto: 'Sullivan JT, Sykora K, Schneiderman J, Naranjo CA, Sellers EM. Assessment of alcohol withdrawal: the revised Clinical Institute Withdrawal Assessment for Alcohol scale (CIWA-Ar). Br J Addict. 1989;84(11):1353-1357.' },
    { texto: 'Mayo-Smith MF, Beecher LH, Fischer TL, et al. Management of alcohol withdrawal delirium: an evidence-based practice guideline. Arch Intern Med. 2004;164(13):1405-1412.' },
    { texto: 'The ASAM Clinical Practice Guideline on Alcohol Withdrawal Management. J Addict Med. 2020;14(3S Suppl 1):1-72.' },
  ],
}

/* ═══════════ C-SSRS — avaliação de risco de suicídio ═══════════ */

const cssrsCampos: Campo[] = [
  campoOpc('ideacao', 'Ideação suicida — intensidade máxima no último mês', [
    { valor: '0', rotulo: '0 — Ausente', pontos: 0 },
    { valor: '1', rotulo: '1 — Desejo de estar morto ("queria não acordar")', pontos: 1 },
    { valor: '2', rotulo: '2 — Pensamentos suicidas ativos inespecíficos, sem método', pontos: 2 },
    { valor: '3', rotulo: '3 — Ideação ativa com **método** pensado, sem plano nem intenção', pontos: 3 },
    { valor: '4', rotulo: '4 — Ideação ativa com alguma **intenção** de agir, sem plano definido', pontos: 4 },
    { valor: '5', rotulo: '5 — Ideação ativa com **plano e intenção** específicos', pontos: 5 },
  ], { padrao: '0', ajuda: 'A escala é **hierárquica e progressiva**: cada nível engloba os anteriores. A transição decisiva está entre os níveis 3 e 4 — do método pensado para a intenção de agir. **Níveis 4 e 5 são considerados risco alto** e mudam a conduta imediatamente.' }),
  campoSimNao('comportamento', 'Comportamento preparatório ou tentativa nos últimos 3 meses', 0, 'Inclui tentativa real, tentativa interrompida (por terceiro), tentativa abortada (pelo próprio) e **atos preparatórios**: comprar ou juntar o meio, escrever carta, dar pertences, pesquisar métodos. Comportamento recente é o preditor isolado mais forte.'),
  campoSimNao('tentativaPrevia', 'Tentativa de suicídio ao longo da vida', 0, 'É o preditor mais forte de suicídio consumado — o risco permanece elevado por décadas. Pergunte sobre número de tentativas, método, letalidade percebida e intenção na ocasião.'),
  campoSimNao('meio', 'Acesso a meio letal (arma de fogo, medicamento acumulado, agrotóxico, altura)', 0, 'A **restrição de acesso ao meio letal** é uma das poucas intervenções com redução comprovada de mortalidade por suicídio em nível populacional. Perguntar e agir sobre isso é parte da consulta, não um detalhe.'),
  campoSimNao('protecao', 'Fatores de proteção presentes (vínculos, responsabilidade por filhos, razões para viver, suporte, crença)', 0, 'Pergunte explicitamente: "o que o tem segurado?". A resposta orienta o plano de segurança e, frequentemente, é o que sustenta a conduta ambulatorial.'),
  campoSimNao('substancia', 'Uso de álcool ou outra substância, ou intoxicação atual', 0, 'O álcool aumenta a impulsividade e reduz o julgamento, e está presente em parcela grande das tentativas. Avaliação feita sob intoxicação não é confiável — reavalie sóbrio.'),
  campoSimNao('psicose', 'Sintomas psicóticos, agitação grave ou desesperança intensa', 0, 'A **desesperança** prediz suicídio melhor que a própria intensidade da depressão, e alucinações de comando são situação de risco imediato.'),
]

const cssrs: Ferramenta = {
  id: 'c-ssrs',
  nome: 'C-SSRS — avaliação de risco de suicídio',
  sigla: 'C-SSRS',
  sinonimos: ['c-ssrs', 'columbia', 'risco de suicidio', 'ideacao suicida', 'sad persons'],
  resumo: 'Gradua a ideação suicida em cinco níveis hierárquicos e organiza a avaliação de risco em conduta imediata.',
  categorias: ['psiquiatria', 'emergencia'],
  campos: cssrsCampos,
  calcular: (v) => {
    const ideacao = ptsOpc(cssrsCampos, v, 'ideacao')
    if (ideacao === null) return null
    const comportamento = sim(v, 'comportamento')
    const previa = sim(v, 'tentativaPrevia')
    const meio = sim(v, 'meio')
    const protecao = sim(v, 'protecao')
    const substancia = sim(v, 'substancia')
    const psicose = sim(v, 'psicose')

    const alto = ideacao >= 4 || comportamento || psicose
    const moderado = !alto && (ideacao === 3 || (ideacao >= 1 && (previa || meio || substancia)))
    const categoria = alto ? 'alto' : moderado ? 'moderado' : ideacao >= 1 ? 'baixo' : 'sem ideação'

    const nivel: Nivel = alto ? 'critico' : moderado ? 'alerta' : ideacao >= 1 ? 'atencao' : 'ok'

    const conduta: string[] = []
    if (alto) {
      conduta.push(
        '**Risco alto: não deixe o paciente sozinho.** Garanta supervisão contínua enquanto organiza a avaliação psiquiátrica de urgência. Retire o acesso ao meio letal antes de qualquer outra coisa — é a medida com maior impacto imediato.',
        '**Avaliação psiquiátrica presencial e urgente**, com consideração de internação. A internação está indicada quando o risco não pode ser manejado com segurança no ambiente atual: plano definido com acesso ao meio, tentativa recente de alta letalidade, psicose com comando, agitação grave, ausência de suporte, ou recusa de plano de segurança.',
      )
    } else if (moderado) {
      conduta.push('**Risco moderado:** avaliação de saúde mental em curto prazo (dias, não semanas), plano de segurança escrito, restrição de acesso ao meio e envolvimento de alguém de confiança. Defina retorno explícito e um contato em caso de piora.')
    } else if (ideacao >= 1) {
      conduta.push('**Risco baixo:** acompanhamento com reavaliação periódica e plano de segurança simples. Trate a condição de base — depressão, ansiedade, dor crônica, uso de substância — que é o que sustenta a ideação.')
    } else {
      conduta.push('**Sem ideação relatada.** Mantenha o rastreio periódico, sobretudo em depressão, dor crônica, doença grave, transição de cuidado e após alta psiquiátrica — os 30 dias seguintes à alta são um período de risco particularmente alto.')
    }
    conduta.push(
      '**Construa um plano de segurança escrito, com o paciente**, e não um "contrato de não suicídio", que não tem eficácia demonstrada. O plano de Stanley e Brown tem seis passos: reconhecer sinais de alerta pessoais, estratégias próprias de enfrentamento, pessoas e lugares que distraem, pessoas a quem pedir ajuda, profissionais e serviços com telefone, e **tornar o ambiente seguro**.',
      '**Restrinja o acesso ao meio letal de forma concreta**: entregar a arma a terceiro, dispensar medicamento acumulado, fornecer receita de quantidade limitada, envolver a família na guarda. É a intervenção com melhor evidência populacional, e depende de ser combinada explicitamente.',
      'Trate a **condição psiquiátrica de base** com vigor, e atente ao período de latência: nas primeiras semanas de antidepressivo, a energia e a iniciativa podem melhorar antes do humor, o que é uma janela de risco. Monitore de perto nesse intervalo. **Lítio** em transtorno bipolar e **clozapina** em esquizofrenia são os dois fármacos com redução específica de suicídio demonstrada.',
      'Envolva a rede: família ou pessoa de confiança informada, com orientação sobre sinais de alerta e sobre como agir. O isolamento é fator de risco, e a rede é o que sustenta o plano entre as consultas.',
      'Garanta a **continuidade do cuidado**. Contatos breves de acompanhamento — telefonema, mensagem, carta — após atendimento por tentativa reduzem repetição, e a transição entre serviços é onde os pacientes mais se perdem.',
    )

    return {
      titulo: 'C-SSRS',
      valor: categoria === 'sem ideação' ? 'Sem ideação' : `Risco ${categoria}`,
      nivel,
      rotuloNivel: `Ideação nível ${ideacao} de 5`,
      detalhes: [
        { rotulo: 'Nível de ideação', valor: `${fmtInt(ideacao)} de 5`, nivel: (ideacao >= 4 ? 'critico' : ideacao >= 2 ? 'alerta' : ideacao >= 1 ? 'atencao' : 'ok') as Nivel },
        { rotulo: 'Comportamento nos últimos 3 meses', valor: comportamento ? 'Presente' : 'Ausente', nivel: (comportamento ? 'critico' : 'ok') as Nivel },
        { rotulo: 'Tentativa ao longo da vida', valor: previa ? 'Sim' : 'Não', nivel: (previa ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Acesso a meio letal', valor: meio ? 'Sim' : 'Não', nivel: (meio ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Fatores de proteção', valor: protecao ? 'Presentes' : 'Ausentes', nivel: (protecao ? 'ok' : 'atencao') as Nivel },
        { rotulo: 'Uso de substância', valor: substancia ? 'Sim' : 'Não', nivel: (substancia ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Psicose, agitação ou desesperança intensa', valor: psicose ? 'Sim' : 'Não', nivel: (psicose ? 'critico' : 'ok') as Nivel },
      ],
      interpretacao: [
        `**Ideação em nível ${ideacao} de 5 — risco ${categoria}.** A escala de ideação do C-SSRS é **hierárquica**: cada nível engloba os anteriores, e a transição decisiva está entre o nível 3 (método pensado) e o **nível 4 (alguma intenção de agir)**. Níveis 4 e 5 são considerados risco alto.`,
        comportamento
          ? '**Há comportamento suicida nos últimos 3 meses**, incluindo atos preparatórios. Esse é o preditor isolado mais forte de nova tentativa e eleva o risco independentemente do nível de ideação relatado.'
          : 'Sem comportamento suicida recente relatado. Lembre que **atos preparatórios contam** — comprar ou juntar o meio, escrever carta, dar pertences —, e que eles precisam ser perguntados de forma específica.',
        previa
          ? '**Tentativa prévia ao longo da vida é o preditor mais forte de suicídio consumado**, e o risco permanece elevado por décadas, não apenas nos meses seguintes.'
          : 'Sem tentativa prévia relatada, o que reduz mas não elimina o risco — a maioria dos suicídios consumados ocorre na primeira tentativa em algumas populações, sobretudo em homens e com métodos de alta letalidade.',
        'Uma verdade que precisa ser dita: **perguntar sobre suicídio não induz o ato**. Isso foi testado e refutado repetidamente, e o receio de perguntar é a barreira mais comum — e mais custosa — à avaliação adequada.',
        'O C-SSRS é um instrumento de **avaliação estruturada**, não uma calculadora de probabilidade. Nenhum escore prediz suicídio individual com acurácia útil; a função dele é garantir que as perguntas certas sejam feitas e que a conduta decorra delas.',
      ],
      conduta,
      alertas: [
        '**Perguntar sobre suicídio não induz o ato.** Não perguntar é a omissão mais documentada nesse cenário.',
        '**Contrato de não suicídio não funciona** e não tem eficácia demonstrada. O que funciona é o plano de segurança escrito e a restrição de acesso ao meio letal.',
        'Avaliação feita sob **intoxicação** não é confiável: reavalie o paciente sóbrio antes de qualquer decisão de alta.',
        'Os **30 dias após alta psiquiátrica** e as primeiras semanas de antidepressivo são janelas de risco elevado — a energia melhora antes do humor. Monitore de perto nesses períodos.',
      ],
    }
  },
  formula: [
    'Ideação: 1 desejo de morrer · 2 pensamentos ativos inespecíficos · 3 com método · 4 com intenção · 5 com plano e intenção',
    'Risco alto: ideação 4 ou 5, comportamento nos últimos 3 meses, ou psicose/agitação/desesperança intensa',
  ],
  fundamento:
    'O suicídio não é um evento aleatório nem um desfecho previsível por escore: décadas de pesquisa mostraram que **nenhum instrumento prediz suicídio individual com acurácia clinicamente útil** — os valores preditivos positivos são baixos mesmo nas melhores escalas, porque o desfecho é raro em termos estatísticos e multifatorial em termos causais. O que o C-SSRS oferece, e onde está seu valor, é outra coisa: **estrutura**. Ele garante que a pergunta seja feita de forma graduada, do desejo passivo de morrer até o plano com intenção, e que atos preparatórios — frequentemente omitidos quando se pergunta apenas "você pensou em se matar?" — sejam capturados. A hierarquia da escala reflete um achado consistente: a progressão de ideação passiva para ativa, depois para método, depois para intenção e plano, corresponde a aumentos de risco mensuráveis, com a transição mais importante entre o método pensado e a intenção de agir. O modelo de **ideação para ação** ajuda a entender por que: os fatores que geram ideação (dor psicológica, desesperança, sensação de ser um fardo, pertencimento frustrado) são diferentes dos que permitem a passagem ao ato (capacidade adquirida para o autodano, impulsividade, acesso ao meio). É essa distinção que explica por que a restrição de acesso ao meio letal funciona tão bem em nível populacional: ela não altera a ideação, mas interrompe a passagem ao ato num momento em que a crise é frequentemente breve e ambivalente.',
  armadilhas: [
    'Perguntar apenas "você pensa em se matar?" perde ideação passiva e atos preparatórios — a graduação existe para isso.',
    'Ausência de ideação relatada não afasta risco: pacientes negam por vergonha, por medo de internação ou porque já decidiram.',
    'Escores e escalas não substituem a avaliação clínica e não devem ser usados para justificar alta em paciente que preocupa.',
    'O risco flutua em horas: uma avaliação não vale para a semana inteira, e a reavaliação é parte do manejo.',
  ],
  referencias: [
    { texto: 'Posner K, Brown GK, Stanley B, et al. The Columbia-Suicide Severity Rating Scale: initial validity and internal consistency findings. Am J Psychiatry. 2011;168(12):1266-1277.' },
    { texto: 'Stanley B, Brown GK. Safety Planning Intervention: a brief intervention to mitigate suicide risk. Cogn Behav Pract. 2012;19(2):256-264.' },
    { texto: 'Zalsman G, Hawton K, Wasserman D, et al. Suicide prevention strategies revisited: 10-year systematic review. Lancet Psychiatry. 2016;3(7):646-659.' },
  ],
}

export const ferramentas: Ferramenta[] = [phq9, gad7, audit, ciwa, cssrs]

export default ferramentas
