import type { Ferramenta, Nivel, Resultado } from '../tipos'
import {
  campoAltura,
  campoIdade,
  campoNum,
  campoOpc,
  campoPeso,
  campoSeg,
  campoSexo,
  campoSimNao,
  fmt,
  fmtInt,
  fmtPct,
  imc as calcImc,
  num,
  numOu,
  opc,
  pts,
  sim,
  somaSimNao,
} from '../helpers'

const childPugh: Ferramenta = {
  id: 'child-pugh',
  nome: 'Classificação de Child-Pugh',
  sinonimos: ['child', 'child pugh', 'cirrose', 'reserva hepatica'],
  resumo: 'Classifica a reserva funcional hepática na cirrose em A, B ou C.',
  categorias: ['gastroenterologia'],
  campos: [
    campoOpc('bilirrubina', 'Bilirrubina total', [
      { valor: '1', rotulo: '< 2 mg/dL', pontos: 1 },
      { valor: '2', rotulo: '2 a 3 mg/dL', pontos: 2 },
      { valor: '3', rotulo: '> 3 mg/dL', pontos: 3 },
    ]),
    campoOpc('albumina', 'Albumina', [
      { valor: '1', rotulo: '> 3,5 g/dL', pontos: 1 },
      { valor: '2', rotulo: '2,8 a 3,5 g/dL', pontos: 2 },
      { valor: '3', rotulo: '< 2,8 g/dL', pontos: 3 },
    ]),
    campoOpc('inr', 'INR', [
      { valor: '1', rotulo: '< 1,7', pontos: 1 },
      { valor: '2', rotulo: '1,7 a 2,3', pontos: 2 },
      { valor: '3', rotulo: '> 2,3', pontos: 3 },
    ]),
    campoOpc('ascite', 'Ascite', [
      { valor: '1', rotulo: 'Ausente', pontos: 1 },
      { valor: '2', rotulo: 'Leve, controlada com diurético', pontos: 2 },
      { valor: '3', rotulo: 'Moderada a tensa, refratária', pontos: 3 },
    ]),
    campoOpc('encefalopatia', 'Encefalopatia hepática', [
      { valor: '1', rotulo: 'Ausente', pontos: 1 },
      { valor: '2', rotulo: 'Graus I a II (ou controlada com medicação)', pontos: 2 },
      { valor: '3', rotulo: 'Graus III a IV (ou refratária)', pontos: 3 },
    ]),
  ],
  calcular: (v) => {
    const ids = ['bilirrubina', 'albumina', 'inr', 'ascite', 'encefalopatia']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const classe = total <= 6 ? 'A' : total <= 9 ? 'B' : 'C'
    const idx = classe === 'A' ? 0 : classe === 'B' ? 1 : 2
    const nivel: Nivel = (['ok', 'alerta', 'critico'] as Nivel[])[idx]
    return {
      titulo: `Child-Pugh ${classe}`,
      valor: String(total),
      unidade: 'de 15 pontos',
      nivel,
      rotuloNivel: `Classe ${classe}`,
      detalhes: [
        { rotulo: 'Sobrevida em 1 ano', valor: ['100%', '80%', '45%'][idx] },
        { rotulo: 'Sobrevida em 2 anos', valor: ['85%', '60%', '35%'][idx] },
        { rotulo: 'Mortalidade perioperatória em cirurgia abdominal', valor: ['≈ 10%', '≈ 30%', '≈ 70 a 80%'][idx], nota: 'É o uso mais consequente do escore fora da hepatologia.', nivel },
      ],
      interpretacao: [
        idx === 0
          ? 'Classe A: cirrose compensada. Rastreio semestral de carcinoma hepatocelular com ultrassonografia, endoscopia para varizes conforme critérios de Baveno, e vacinação para hepatites A e B.'
          : idx === 1
            ? 'Classe B: descompensação estabelecida. Encaminhamento para avaliação de transplante deve ser considerado, sobretudo se houver ascite refratária, encefalopatia recorrente ou peritonite bacteriana espontânea.'
            : 'Classe C: doença avançada, com alta mortalidade. Avaliação de transplante é prioritária; discuta cuidados paliativos concomitantes.',
        'A grande limitação do Child-Pugh é conter **dois itens subjetivos** — ascite e encefalopatia — cuja graduação varia entre observadores e é modificada pelo tratamento. Um paciente com ascite controlada por diurético pontua menos que o mesmo paciente sem diurético, o que confunde gravidade com tratamento. Foi essa fragilidade que motivou a criação do MELD para alocação de órgãos.',
        'Ainda assim, o Child-Pugh continua insubstituível em duas situações: estimativa de risco cirúrgico e ajuste de dose de medicamentos com metabolismo hepático — as bulas se referem a ele, não ao MELD.',
      ],
      tabela: {
        titulo: 'Classes',
        colunas: ['Pontos', 'Classe', 'Sobrevida em 1 ano'],
        linhas: [['5 – 6', 'A', '100%'], ['7 – 9', 'B', '80%'], ['10 – 15', 'C', '45%']],
        destaque: idx,
      },
    }
  },
  formula: ['Soma de 5 variáveis, 1 a 3 pontos cada (5 a 15 no total)'],
  fundamento:
    'A classificação nasceu em 1964 com Child e Turcotte, para estratificar risco de derivação portossistêmica cirúrgica, e usava estado nutricional como quinto item. Pugh substituiu o estado nutricional pelo tempo de protrombina em 1973, tornando o escore objetivo o suficiente para se generalizar. Suas cinco variáveis cobrem as duas funções hepáticas essenciais — síntese (albumina, INR) e depuração (bilirrubina) — e as duas consequências da hipertensão portal e da insuficiência (ascite e encefalopatia).',
  armadilhas: [
    'Albumina baixa por desnutrição, síndrome nefrótica ou perda intestinal infla o escore sem que haja pior função hepática.',
    'INR alterado por anticoagulação oral invalida o item — registre a limitação.',
    'Colestase crônica (cirrose biliar primária, colangite esclerosante) eleva desproporcionalmente a bilirrubina; nesses casos alguns autores usam pontos de corte diferentes.',
  ],
  referencias: [
    { texto: 'Pugh RN, Murray-Lyon IM, Dawson JL, Pietroni MC, Williams R. Transection of the oesophagus for bleeding oesophageal varices. Br J Surg. 1973;60(8):646-649.' },
    { texto: 'Tsoris A, Marlar CA. Use of the Child Pugh Score in liver disease. StatPearls. 2023.' },
  ],
}

const meld: Ferramenta = {
  id: 'meld',
  nome: 'MELD, MELD-Na e MELD 3.0',
  sinonimos: ['meld', 'meld na', 'transplante hepatico', 'fila de transplante'],
  resumo: 'Prioriza transplante hepático e estima mortalidade em 90 dias.',
  categorias: ['gastroenterologia'],
  campos: [
    campoNum('bilirrubina', 'Bilirrubina total', { unidade: 'mg/dL', min: 0.1, max: 60, passo: 0.1 }),
    campoNum('inr', 'INR', { min: 0.5, max: 12, passo: 0.01 }),
    campoNum('creatinina', 'Creatinina', { unidade: 'mg/dL', min: 0.1, max: 15, passo: 0.01 }),
    campoNum('sodio', 'Sódio', { unidade: 'mEq/L', min: 100, max: 160, passo: 1, opcional: true, ajuda: 'Habilita o MELD-Na e o MELD 3.0.' }),
    campoNum('albumina', 'Albumina', { unidade: 'g/dL', min: 0.5, max: 6, passo: 0.1, opcional: true, ajuda: 'Entra apenas no MELD 3.0.' }),
    campoSexo(),
    campoSimNao('dialise', 'Duas ou mais sessões de diálise nos últimos 7 dias, ou 24 h de hemodiálise contínua', 1, 'Nesse caso a creatinina é fixada em 4,0 mg/dL.'),
  ],
  calcular: (v) => {
    const bili = num(v, 'bilirrubina')
    const inr = num(v, 'inr')
    let cr = num(v, 'creatinina')
    if (bili === null || inr === null || cr === null) return null
    if (sim(v, 'dialise')) cr = 4
    const b = Math.max(bili, 1)
    const i = Math.max(inr, 1)
    const c = Math.min(Math.max(cr, 1), 4)
    const meldBruto = 3.78 * Math.log(b) + 11.2 * Math.log(i) + 9.57 * Math.log(c) + 6.43
    const meld = Math.min(40, Math.max(6, Math.round(meldBruto)))
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'MELD clássico', valor: String(meld), nota: 'Valores abaixo de 1,0 são arredondados para 1,0; a creatinina é limitada a 4,0.' },
    ]
    let final = meld
    const na = num(v, 'sodio')
    if (na !== null) {
      const naLim = Math.min(Math.max(na, 125), 137)
      const meldNa = meld > 11 ? meld + 1.32 * (137 - naLim) - 0.033 * meld * (137 - naLim) : meld
      const meldNaFinal = Math.min(40, Math.max(6, Math.round(meldNa)))
      detalhes.push({ rotulo: 'MELD-Na', valor: String(meldNaFinal), nota: 'Sódio limitado à faixa de 125 a 137. A hiponatremia acrescenta risco de morte não capturado pelo MELD clássico.' })
      final = meldNaFinal
      const alb = num(v, 'albumina')
      if (alb !== null) {
        const f = opc(v, 'sexo') === 'f'
        const albLim = Math.min(Math.max(alb, 1.5), 3.5)
        const crLim = Math.min(Math.max(cr, 1), 3)
        const m3 =
          1.33 * (f ? 1 : 0) +
          4.56 * Math.log(b) +
          0.82 * (137 - naLim) -
          0.24 * (137 - naLim) * Math.log(b) +
          9.09 * Math.log(i) +
          11.14 * Math.log(crLim) +
          1.85 * (3.5 - albLim) -
          1.83 * (3.5 - albLim) * Math.log(crLim) +
          6
        const m3Final = Math.min(40, Math.max(6, Math.round(m3)))
        detalhes.push({ rotulo: 'MELD 3.0', valor: String(m3Final), nota: 'Versão de 2021, adotada nos Estados Unidos em 2023. Acrescenta sexo e albumina, corrigindo a desvantagem histórica das mulheres na fila (creatinina mais baixa para a mesma função renal).' })
        final = m3Final
      }
    }
    const mortalidade = final >= 40 ? '71,3%' : final >= 30 ? '52,6%' : final >= 20 ? '19,6%' : final >= 10 ? '6,0%' : '1,9%'
    detalhes.push({ rotulo: 'Mortalidade estimada em 3 meses', valor: mortalidade })
    const nivel: Nivel = final >= 30 ? 'critico' : final >= 20 ? 'alerta' : final >= 15 ? 'atencao' : 'ok'
    return {
      titulo: na !== null ? 'MELD-Na / MELD 3.0' : 'MELD',
      valor: String(final),
      nivel,
      rotuloNivel: `Mortalidade em 90 dias de ${mortalidade}`,
      detalhes,
      interpretacao: [
        'O MELD foi criado para prever mortalidade após derivação portossistêmica intra-hepática transjugular e depois validado como preditor de mortalidade em lista. Sua adoção para alocação de fígados em 2002 mudou o princípio de distribuição: da urgência baseada em tempo de espera para a urgência baseada em risco de morte — "sickest first".',
        final >= 15
          ? '**MELD ≥ 15** é o limiar clássico a partir do qual o benefício de sobrevida do transplante supera o risco do procedimento. Abaixo disso, transplantar pode reduzir a sobrevida.'
          : 'MELD abaixo de 15: o benefício do transplante ainda não supera claramente o risco cirúrgico. Mantenha acompanhamento e recalcule periodicamente — a frequência de recálculo exigida cresce com o valor.',
        'Existem situações que geram **pontuação especial** (exception points) porque o MELD não captura a gravidade: carcinoma hepatocelular dentro dos critérios de Milão, síndrome hepatopulmonar, hipertensão portopulmonar, polineuropatia amiloidótica familiar, colangite bacteriana de repetição.',
      ],
      alertas: ['Creatinina elevada por causa não hepática — nefropatia diabética, por exemplo — infla o MELD e é uma das fontes conhecidas de distorção na fila.'],
    }
  },
  formula: [
    'MELD = 3,78×ln(bilirrubina) + 11,2×ln(INR) + 9,57×ln(creatinina) + 6,43',
    'Valores < 1,0 são elevados a 1,0; creatinina limitada a 4,0; diálise fixa a creatinina em 4,0',
    'MELD-Na = MELD + 1,32×(137 − Na) − 0,033 × MELD × (137 − Na), quando MELD > 11',
  ],
  fundamento:
    'As três variáveis do MELD são objetivas e não manipuláveis — foi essa a exigência de projeto, justamente para eliminar os itens subjetivos do Child-Pugh num contexto de alocação de recurso escasso. Elas medem colestase e função excretora (bilirrubina), síntese proteica (INR) e a repercussão renal da doença hepática avançada (creatinina), que é um dos marcadores prognósticos mais fortes na cirrose.',
  armadilhas: [
    'INR alterado por varfarina invalida o cálculo para fins de alocação.',
    'A creatinina subestima a disfunção renal em cirróticos sarcopênicos — o mesmo problema que afeta qualquer equação baseada em creatinina, agravado pela massa muscular reduzida.',
    'MELD não se aplica a insuficiência hepática **aguda**: nesse cenário, os critérios do King’s College são os apropriados.',
  ],
  referencias: [
    { texto: 'Malinchoc M, Kamath PS, Gordon FD, et al. A model to predict poor survival in patients undergoing transjugular intrahepatic portosystemic shunts. Hepatology. 2000;31(4):864-871.' },
    { texto: 'Kim WR, Biggins SW, Kremers WK, et al. Hyponatremia and mortality among patients on the liver-transplant waiting list. N Engl J Med. 2008;359(10):1018-1026.' },
    { texto: 'Kim WR, Mannalithara A, Heimbach JK, et al. MELD 3.0: the model for end-stage liver disease updated for the modern era. Gastroenterology. 2021;161(6):1887-1895.' },
  ],
}

const blatchford: Ferramenta = {
  id: 'glasgow-blatchford',
  nome: 'Escore de Glasgow-Blatchford',
  sinonimos: ['blatchford', 'gbs', 'hemorragia digestiva alta', 'hda'],
  resumo: 'Identifica quem pode ser conduzido ambulatorialmente na hemorragia digestiva alta.',
  categorias: ['gastroenterologia', 'emergencia'],
  campos: [
    campoNum('ureia', 'Ureia', { unidade: 'mg/dL', min: 5, max: 400, passo: 1 }),
    campoNum('hb', 'Hemoglobina', { unidade: 'g/dL', min: 2, max: 20, passo: 0.1 }),
    campoSexo(),
    campoNum('pas', 'PA sistólica', { unidade: 'mmHg', min: 40, max: 250, passo: 1 }),
    campoSimNao('fc', 'Frequência cardíaca ≥ 100 bpm', 1),
    campoSimNao('melena', 'Melena', 1),
    campoSimNao('sincope', 'Síncope', 2),
    campoSimNao('hepatopatia', 'Doença hepática', 2),
    campoSimNao('cardiaca', 'Insuficiência cardíaca', 2),
  ],
  calcular: (v) => {
    const ureia = num(v, 'ureia')
    const hb = num(v, 'hb')
    const pas = num(v, 'pas')
    if (ureia === null || hb === null || pas === null) return null
    const f = opc(v, 'sexo') === 'f'
    const pUreia = ureia < 39 ? 0 : ureia < 48 ? 2 : ureia < 60 ? 3 : ureia < 150 ? 4 : 6
    let pHb = 0
    if (f) pHb = hb >= 12 ? 0 : hb >= 10 ? 1 : 6
    else pHb = hb >= 13 ? 0 : hb >= 12 ? 1 : hb >= 10 ? 3 : 6
    const pPas = pas >= 110 ? 0 : pas >= 100 ? 1 : pas >= 90 ? 2 : 3
    const total =
      pUreia +
      pHb +
      pPas +
      somaSimNao(v, [
        { id: 'fc', pontos: 1 },
        { id: 'melena', pontos: 1 },
        { id: 'sincope', pontos: 2 },
        { id: 'hepatopatia', pontos: 2 },
        { id: 'cardiaca', pontos: 2 },
      ])
    const baixo = total <= 1
    return {
      titulo: 'Glasgow-Blatchford',
      valor: String(total),
      unidade: 'de 23 pontos',
      nivel: total >= 12 ? 'critico' : total >= 6 ? 'alerta' : baixo ? 'ok' : 'atencao',
      rotuloNivel: baixo ? 'Muito baixo risco' : total >= 6 ? 'Alto risco' : 'Risco intermediário',
      detalhes: [
        { rotulo: 'Ureia', valor: `${pUreia} ponto(s)` },
        { rotulo: 'Hemoglobina', valor: `${pHb} ponto(s)`, nota: 'Pontos de corte específicos por sexo.' },
        { rotulo: 'PA sistólica', valor: `${pPas} ponto(s)` },
        { rotulo: 'Necessidade de intervenção (transfusão, endoscopia terapêutica, cirurgia)', valor: baixo ? '< 1%' : total >= 6 ? '> 50%' : 'intermediária' },
      ],
      interpretacao: [
        baixo
          ? '**Escore 0 ou 1 identifica risco muito baixo.** Esses pacientes podem ser manejados ambulatorialmente com endoscopia programada, sem internação — é o uso validado e mais valioso do escore, recomendado pelas diretrizes europeia e americana.'
          : total >= 6
            ? 'Alto risco: internação, reserva de hemocomponentes, inibidor de bomba de prótons endovenoso e **endoscopia digestiva alta em até 24 horas**. Em suspeita de varizes, acrescente antibiótico profilático (ceftriaxona) e droga vasoativa esplâncnica (terlipressina ou octreotida).'
            : 'Risco intermediário: observação hospitalar com endoscopia dentro de 24 horas.',
        'A ureia elevada desproporcionalmente à creatinina é uma pista diagnóstica valiosa: o sangue digerido é uma carga proteica absorvida no intestino delgado, e por isso a hemorragia **alta** eleva a ureia enquanto a baixa não eleva.',
        'A hemoglobina inicial pode ser normal na hemorragia aguda — a hemodiluição leva horas. Não se tranquilize com hemoglobina normal em paciente com sangramento ativo.',
        'Estratégia transfusional **restritiva** (limiar de 7 g/dL, ou 8 g/dL em coronariopatas) foi superior à liberal na hemorragia digestiva alta, com menos ressangramento e menor mortalidade.',
      ],
      alertas: ['Endoscopia muito precoce (antes de 6 horas) não mostrou benefício e pode piorar desfechos em pacientes instáveis. Estabilize primeiro.'],
    }
  },
  formula: ['Soma ponderada de ureia, hemoglobina (por sexo), PA sistólica, frequência, melena, síncope, hepatopatia e insuficiência cardíaca'],
  fundamento:
    'O Blatchford foi derivado para prever **necessidade de intervenção**, e não mortalidade — e essa escolha de desfecho é o que o torna útil na triagem. Ele usa apenas dados pré-endoscópicos, disponíveis na chegada, e por isso responde à pergunta que o emergencista faz primeiro: este paciente precisa ficar?',
  armadilhas: [
    'Não se aplica a hemorragia digestiva baixa.',
    'Pacientes em uso de anticoagulante ou com comorbidade grave podem ter escore baixo e ainda assim exigir internação — o escore não vê antitrombóticos.',
  ],
  referencias: [
    { texto: 'Blatchford O, Murray WR, Blatchford M. A risk score to predict need for treatment for upper-gastrointestinal haemorrhage. Lancet. 2000;356(9238):1318-1321.' },
    { texto: 'Villanueva C, Colomo A, Bosch A, et al. Transfusion strategies for acute upper gastrointestinal bleeding. N Engl J Med. 2013;368(1):11-21.' },
  ],
}

const rockall: Ferramenta = {
  id: 'rockall',
  nome: 'Escore de Rockall (pré e pós-endoscópico)',
  sinonimos: ['rockall', 'hemorragia digestiva prognostico'],
  resumo: 'Estima ressangramento e mortalidade na hemorragia digestiva alta.',
  categorias: ['gastroenterologia', 'emergencia'],
  campos: [
    campoOpc('idade', 'Idade', [
      { valor: '0', rotulo: '< 60 anos', pontos: 0 },
      { valor: '1', rotulo: '60 a 79 anos', pontos: 1 },
      { valor: '2', rotulo: '≥ 80 anos', pontos: 2 },
    ]),
    campoOpc('choque', 'Estado hemodinâmico', [
      { valor: '0', rotulo: 'Sem choque (PAS ≥ 100 e FC < 100)', pontos: 0 },
      { valor: '1', rotulo: 'Taquicardia (PAS ≥ 100 e FC ≥ 100)', pontos: 1 },
      { valor: '2', rotulo: 'Hipotensão (PAS < 100)', pontos: 2 },
    ]),
    campoOpc('comorbidade', 'Comorbidades', [
      { valor: '0', rotulo: 'Nenhuma maior', pontos: 0 },
      { valor: '2', rotulo: 'Insuficiência cardíaca, doença coronariana ou outra maior', pontos: 2 },
      { valor: '3', rotulo: 'Insuficiência renal, hepática ou neoplasia disseminada', pontos: 3 },
    ]),
    campoSeg('temEndoscopia', 'Endoscopia já realizada', [
      { valor: 'nao', rotulo: 'Não (escore pré-endoscópico)' },
      { valor: 'sim', rotulo: 'Sim (escore completo)' },
    ]),
    campoOpc('diagnostico', 'Diagnóstico endoscópico', [
      { valor: '0', rotulo: 'Mallory-Weiss, sem lesão identificada, sem estigmas', pontos: 0 },
      { valor: '1', rotulo: 'Todos os demais diagnósticos', pontos: 1 },
      { valor: '2', rotulo: 'Neoplasia do trato digestivo alto', pontos: 2 },
    ], { mostrarSe: (v) => sim(v, 'temEndoscopia') }),
    campoOpc('estigmas', 'Estigmas de sangramento recente', [
      { valor: '0', rotulo: 'Nenhum, ou base escura', pontos: 0 },
      { valor: '2', rotulo: 'Sangue no trato alto, sangramento ativo, vaso visível ou coágulo aderido', pontos: 2 },
    ], { mostrarSe: (v) => sim(v, 'temEndoscopia') }),
  ],
  calcular: (v) => {
    const idade = num(v, 'idade')
    const choque = num(v, 'choque')
    const comorb = num(v, 'comorbidade')
    if (idade === null || choque === null || comorb === null) return null
    const pre = idade + choque + comorb
    const completo = sim(v, 'temEndoscopia')
    let total = pre
    const detalhes: Resultado['detalhes'] = [{ rotulo: 'Escore pré-endoscópico', valor: `${pre} de 7`, nota: 'Pré-endoscópico ≤ 0 identifica risco baixo o suficiente para alta precoce em serviços selecionados.' }]
    if (completo) {
      const diag = num(v, 'diagnostico')
      const est = num(v, 'estigmas')
      if (diag === null || est === null) return null
      total = pre + diag + est
      detalhes.push({ rotulo: 'Escore completo', valor: `${total} de 11` })
    }
    const mort = completo
      ? total <= 2
        ? '0,2%'
        : total <= 4
          ? '5 a 11%'
          : total <= 7
            ? '17 a 27%'
            : '41%'
      : '—'
    if (completo) detalhes.push({ rotulo: 'Mortalidade estimada', valor: mort })
    const nivel: Nivel = total >= 8 ? 'critico' : total >= 5 ? 'alerta' : total >= 3 ? 'atencao' : 'ok'
    return {
      titulo: completo ? 'Rockall completo' : 'Rockall pré-endoscópico',
      valor: String(total),
      unidade: completo ? 'de 11 pontos' : 'de 7 pontos',
      nivel,
      rotuloNivel: total <= 2 ? 'Baixo risco' : total <= 4 ? 'Risco intermediário' : 'Alto risco',
      detalhes,
      interpretacao: [
        'O Rockall prediz **ressangramento e mortalidade**, ao passo que o Blatchford prediz **necessidade de intervenção**. Por isso são complementares e não concorrentes: use o Blatchford na triagem inicial e o Rockall depois da endoscopia, para decidir tempo de observação e alta.',
        'Os estigmas endoscópicos seguem a classificação de Forrest e determinam o risco de ressangramento sem tratamento: Ia (sangramento em jato) e Ib (babante) 55 a 90%; IIa (vaso visível) 43%; IIb (coágulo aderido) 22%; IIc (base pigmentada) 10%; III (base limpa) 5%. Forrest Ia, Ib e IIa têm indicação clara de terapia endoscópica.',
        'Após terapia endoscópica em lesão de alto risco, mantenha inibidor de bomba de prótons em infusão contínua (80 mg em bolus seguido de 8 mg/h por 72 h) ou em dose alta intermitente.',
      ],
    }
  },
  formula: ['Pré-endoscópico = idade + choque + comorbidade (0 a 7)', 'Completo = pré + diagnóstico + estigmas (0 a 11)'],
  fundamento:
    'O escore foi derivado de uma auditoria nacional britânica com mais de 4 mil pacientes, cruzando variáveis clínicas e endoscópicas com desfechos. Sua estrutura em duas etapas reflete o fluxo real do atendimento: uma decisão é tomada antes da endoscopia e outra depois dela.',
  armadilhas: ['O escore pré-endoscópico isolado tem desempenho inferior ao Blatchford para identificar quem pode ir para casa.'],
  referencias: [
    { texto: 'Rockall TA, Logan RF, Devlin HB, Northfield TC. Risk assessment after acute upper gastrointestinal haemorrhage. Gut. 1996;38(3):316-321.' },
  ],
}

const bisap: Ferramenta = {
  id: 'bisap',
  nome: 'BISAP para pancreatite aguda',
  sinonimos: ['bisap', 'pancreatite gravidade'],
  resumo: 'Cinco variáveis das primeiras 24 horas que estratificam a pancreatite aguda.',
  categorias: ['gastroenterologia', 'emergencia'],
  campos: [
    campoSimNao('bun', 'Ureia > 53 mg/dL (BUN > 25 mg/dL)', 1),
    campoSimNao('mental', 'Alteração do estado mental', 1),
    campoSimNao('sirs', 'SIRS (2 ou mais critérios)', 1),
    campoSimNao('idade', 'Idade > 60 anos', 1),
    campoSimNao('derrame', 'Derrame pleural na imagem', 1),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'bun', pontos: 1 },
      { id: 'mental', pontos: 1 },
      { id: 'sirs', pontos: 1 },
      { id: 'idade', pontos: 1 },
      { id: 'derrame', pontos: 1 },
    ])
    const mortalidade = ['< 1%', '< 1%', '1,6%', '3,6%', '7,4%', '9,5 a 22%'][total]
    return {
      titulo: 'BISAP',
      valor: String(total),
      unidade: 'de 5 pontos',
      nivel: total >= 3 ? 'critico' : total === 2 ? 'alerta' : 'ok',
      rotuloNivel: total >= 3 ? 'Pancreatite grave' : 'Risco baixo a moderado',
      detalhes: [{ rotulo: 'Mortalidade hospitalar', valor: mortalidade }],
      interpretacao: [
        total >= 3
          ? 'BISAP ≥ 3 identifica alto risco: leito monitorizado, reposição volêmica cuidadosa e vigilância de disfunção orgânica. Considere transferência para centro de referência.'
          : 'BISAP ≤ 2 indica risco baixo, mas **reavalie em 24 e 48 horas** — a pancreatite é uma doença dinâmica e a gravidade se define pela persistência da disfunção orgânica além de 48 horas.',
        'A vantagem do BISAP sobre Ranson e APACHE II é a praticidade: cinco variáveis, todas disponíveis na admissão, contra 11 variáveis em duas coletas (Ranson) ou 12 fisiológicas mais idade e comorbidade (APACHE II). O desempenho discriminativo é comparável.',
        '**A reposição volêmica mudou.** O ensaio WATERFALL (2022) mostrou que hidratação agressiva (bolus de 20 mL/kg seguido de 3 mL/kg/h) causa mais sobrecarga sem reduzir gravidade, comparada à moderada (bolus de 10 mL/kg apenas se hipovolemia, seguido de 1,5 mL/kg/h). Ringer lactato é preferível à salina.',
        'Antibiótico profilático **não** está indicado na pancreatite necrosante estéril. A nutrição enteral precoce, por via oral quando tolerada, é superior ao jejum e à parenteral.',
      ],
    }
  },
  formula: ['B UN > 25 | I mpaired mental status | S IRS | A ge > 60 | P leural effusion'],
  fundamento:
    'O BISAP foi derivado de uma base com mais de 17 mil casos, buscando o menor conjunto de variáveis de primeiras 24 horas capaz de prever mortalidade. Cada item representa uma dimensão: azotemia (perfusão e prognóstico renal), estado mental (gravidade sistêmica), SIRS (resposta inflamatória), idade (reserva) e derrame pleural (extensão da inflamação retroperitoneal).',
  armadilhas: [
    'Nenhum escore substitui a reavaliação seriada. A pancreatite grave se define retrospectivamente, pela disfunção orgânica que **persiste** além de 48 horas.',
    'Tomografia com contraste nas primeiras 72 horas frequentemente subestima a necrose, que leva dias para se demarcar — e não muda a conduta inicial.',
  ],
  referencias: [
    { texto: 'Wu BU, Johannes RS, Sun X, et al. The early prediction of mortality in acute pancreatitis: a large population-based study. Gut. 2008;57(12):1698-1703.' },
    { texto: 'de-Madaria E, Buxbaum JL, Maisonneuve P, et al. Aggressive or moderate fluid resuscitation in acute pancreatitis (WATERFALL). N Engl J Med. 2022;387(11):989-1000.' },
  ],
}

const ranson: Ferramenta = {
  id: 'ranson',
  nome: 'Critérios de Ranson',
  sinonimos: ['ranson', 'pancreatite ranson'],
  resumo: 'O escore clássico de pancreatite, com critérios de admissão e de 48 horas.',
  categorias: ['gastroenterologia'],
  campos: [
    campoSeg('etiologia', 'Etiologia', [
      { valor: 'nao-biliar', rotulo: 'Não biliar' },
      { valor: 'biliar', rotulo: 'Biliar' },
    ], { ajuda: 'Os pontos de corte diferem entre pancreatite biliar e não biliar.' }),
    campoSimNao('idade', 'Idade acima do corte (55 anos se não biliar, 70 se biliar)', 1),
    campoSimNao('leuco', 'Leucócitos acima do corte (16.000 se não biliar, 18.000 se biliar)', 1),
    campoSimNao('glicose', 'Glicose acima do corte (200 mg/dL se não biliar, 220 se biliar)', 1),
    campoSimNao('ldh', 'LDH acima do corte (350 U/L se não biliar, 400 se biliar)', 1),
    campoSimNao('ast', 'AST acima do corte (250 U/L em ambos)', 1),
    campoSimNao('ht', 'Queda do hematócrito > 10%', 1),
    campoSimNao('bun', 'Aumento da ureia > 10,7 mg/dL (BUN > 5 mg/dL) se não biliar, ou > 2 mg/dL se biliar', 1),
    campoSimNao('calcio', 'Cálcio < 8 mg/dL', 1),
    campoSimNao('pao2', 'PaO₂ < 60 mmHg (apenas na não biliar)', 1),
    campoSimNao('be', 'Déficit de base > 4 mEq/L (não biliar) ou > 5 (biliar)', 1),
    campoSimNao('fluidos', 'Sequestro de fluidos > 6 L (não biliar) ou > 4 L (biliar)', 1),
  ],
  calcular: (v) => {
    const admissao = somaSimNao(v, [
      { id: 'idade', pontos: 1 },
      { id: 'leuco', pontos: 1 },
      { id: 'glicose', pontos: 1 },
      { id: 'ldh', pontos: 1 },
      { id: 'ast', pontos: 1 },
    ])
    const h48 = somaSimNao(v, [
      { id: 'ht', pontos: 1 },
      { id: 'bun', pontos: 1 },
      { id: 'calcio', pontos: 1 },
      { id: 'pao2', pontos: 1 },
      { id: 'be', pontos: 1 },
      { id: 'fluidos', pontos: 1 },
    ])
    const total = admissao + h48
    const mortalidade = total <= 2 ? '0 a 3%' : total <= 4 ? '15%' : total <= 6 ? '40%' : '100%'
    return {
      titulo: 'Critérios de Ranson',
      valor: String(total),
      unidade: 'de 11 pontos',
      nivel: total >= 5 ? 'critico' : total >= 3 ? 'alerta' : 'ok',
      rotuloNivel: total >= 3 ? 'Pancreatite grave' : 'Pancreatite leve',
      detalhes: [
        { rotulo: 'Critérios de admissão', valor: `${admissao} de 5` },
        { rotulo: 'Critérios de 48 horas', valor: `${h48} de 6` },
        { rotulo: 'Mortalidade estimada', valor: mortalidade },
      ],
      interpretacao: [
        'A grande limitação do Ranson é estrutural: **só fica completo em 48 horas**, quando a maior parte das decisões críticas já foi tomada. Por isso escores de admissão como o BISAP e a simples presença de SIRS persistente o substituíram na prática.',
        'A lógica dos critérios permanece instrutiva. Os de admissão refletem a **intensidade da agressão inflamatória** (leucocitose, LDH, AST, hiperglicemia por lesão de ilhotas). Os de 48 horas refletem a **consequência sistêmica**: queda do hematócrito e sequestro de fluidos indicam extravasamento para o terceiro espaço; hipocalcemia indica saponificação da gordura peripancreática pelas lipases; azotemia indica hipoperfusão renal.',
        'A classificação de Atlanta revisada, baseada na presença e persistência de disfunção orgânica, é hoje o padrão de definição de gravidade — não os escores numéricos.',
      ],
    }
  },
  formula: ['5 critérios na admissão + 6 critérios em 48 h', 'Pontos de corte diferem entre pancreatite biliar e não biliar'],
  fundamento:
    'Ranson publicou os critérios em 1974, a partir da análise de 100 pacientes com pancreatite alcoólica. Foi o primeiro escore prognóstico da doença e organizou a compreensão fisiopatológica: a pancreatite grave é uma síndrome inflamatória sistêmica com extravasamento capilar, não uma doença localizada no pâncreas.',
  armadilhas: [
    'Amilase e lipase **não** entram no escore e não têm valor prognóstico — o grau de elevação não se correlaciona com a gravidade.',
    'Duas listas de pontos de corte circulam (biliar e não biliar) e são frequentemente confundidas.',
  ],
  referencias: [
    { texto: 'Ranson JH, Rifkind KM, Roses DF, et al. Prognostic signs and the role of operative management in acute pancreatitis. Surg Gynecol Obstet. 1974;139(1):69-81.' },
  ],
}

const atlanta: Ferramenta = {
  id: 'atlanta',
  nome: 'Classificação de Atlanta revisada para pancreatite',
  sinonimos: ['atlanta', 'pancreatite classificacao', 'necrose pancreatica'],
  resumo: 'Define diagnóstico, gravidade e a nomenclatura correta das coleções.',
  categorias: ['gastroenterologia'],
  campos: [
    campoSimNao('dor', 'Dor abdominal característica (epigástrica, de início agudo, com irradiação para o dorso)', 1),
    campoSimNao('enzimas', 'Amilase ou lipase ≥ 3 vezes o limite superior do normal', 1),
    campoSimNao('imagem', 'Achados característicos em tomografia, ressonância ou ultrassom', 1),
    campoSeg('disfuncao', 'Disfunção orgânica (Marshall modificado ≥ 2 em algum sistema)', [
      { valor: 'nenhuma', rotulo: 'Ausente' },
      { valor: 'transitoria', rotulo: 'Presente, resolvida em até 48 h' },
      { valor: 'persistente', rotulo: 'Persistente por mais de 48 h' },
    ]),
    campoSeg('local', 'Complicações locais ou sistêmicas', [
      { valor: 'nao', rotulo: 'Ausentes' },
      { valor: 'sim', rotulo: 'Presentes' },
    ], { ajuda: 'Coleção fluida aguda, pseudocisto, coleção necrótica aguda, necrose encapsulada, ou descompensação de comorbidade prévia.' }),
    campoNum('semanas', 'Semanas desde o início do quadro', { min: 0, max: 20, passo: 0.5, padrao: '1' }),
  ],
  calcular: (v) => {
    const criterios = ['dor', 'enzimas', 'imagem'].filter((id) => sim(v, id)).length
    const diagnostico = criterios >= 2
    const disf = opc(v, 'disfuncao')
    const local = sim(v, 'local')
    const semanas = numOu(v, 'semanas', 1)
    let gravidade = 'Leve'
    let nivel: Nivel = 'ok'
    if (disf === 'persistente') {
      gravidade = 'Grave'
      nivel = 'critico'
    } else if (disf === 'transitoria' || local) {
      gravidade = 'Moderadamente grave'
      nivel = 'alerta'
    }
    const fase = semanas < 4 ? 'precoce (< 4 semanas)' : 'tardia (≥ 4 semanas)'
    const colecoes = semanas < 4
      ? [['Coleção fluida peripancreática aguda', 'Sem necrose, sem parede definida, homogênea, adjacente ao pâncreas'], ['Coleção necrótica aguda', 'Com necrose de parênquima ou peripancreática, conteúdo heterogêneo, sem parede definida']]
      : [['Pseudocisto', 'Coleção encapsulada, sem necrose, conteúdo homogêneo, parede bem definida — surge de coleção fluida aguda'], ['Necrose encapsulada (WON)', 'Coleção encapsulada com conteúdo necrótico heterogêneo — surge de coleção necrótica aguda']]
    return {
      titulo: diagnostico ? `Pancreatite aguda ${gravidade.toLowerCase()}` : 'Critérios diagnósticos incompletos',
      valor: diagnostico ? gravidade : `${criterios} de 3 critérios`,
      nivel: diagnostico ? nivel : 'atencao',
      rotuloNivel: `Fase ${fase}`,
      detalhes: [
        { rotulo: 'Critérios diagnósticos preenchidos', valor: `${criterios} de 3`, nota: 'O diagnóstico exige **2 dos 3** critérios.', nivel: diagnostico ? 'ok' : 'alerta' },
        { rotulo: 'Gravidade', valor: gravidade, nota: 'Leve: sem disfunção orgânica nem complicação. Moderadamente grave: disfunção transitória (< 48 h) ou complicação local/sistêmica. Grave: disfunção orgânica persistente (> 48 h).' },
        { rotulo: 'Fase', valor: fase },
      ],
      interpretacao: [
        '**A disfunção orgânica persistente é o divisor de águas.** Ela define a pancreatite grave e concentra praticamente toda a mortalidade. Disfunção que se resolve em 48 horas tem prognóstico muito melhor, e essa distinção temporal é a principal contribuição da revisão de 2012.',
        'A nomenclatura das coleções foi padronizada porque a antiga era caótica — "abscesso pancreático" e "pseudocisto infectado" descreviam a mesma coisa de formas diferentes. Hoje, a classificação depende de duas perguntas: há necrose e há parede encapsulada?',
        '**Necrose infectada** é a principal causa de morte tardia. Suspeite diante de deterioração após a segunda semana; gás nas coleções é sinal específico. A conduta atual é a abordagem escalonada (*step-up*): drenagem percutânea ou endoscópica primeiro, necrosectomia minimamente invasiva depois se necessário — e adiar a intervenção, sempre que possível, para além de 4 semanas, quando a necrose já está encapsulada.',
        'Pseudocisto assintomático **não** exige drenagem, independentemente do tamanho. A regra antiga dos 6 cm foi abandonada.',
      ],
      tabela: { titulo: `Coleções na fase ${fase}`, colunas: ['Coleção', 'Definição'], linhas: colecoes },
    }
  },
  formula: ['Diagnóstico: 2 de 3 critérios', 'Gravidade: leve | moderadamente grave | grave, pela disfunção orgânica e complicações'],
  fundamento:
    'A revisão de Atlanta, publicada em 2013 após consenso internacional, substituiu a classificação de 1992 por dois motivos: a definição antiga de gravidade era baseada em escores prognósticos, não em desfechos observados, e a nomenclatura das coleções era ambígua. A nova classificação ancorou a gravidade na disfunção orgânica real e sua persistência — o que se mostrou muito mais preditivo.',
  armadilhas: [
    'Amilase e lipase normais não excluem pancreatite, sobretudo em apresentação tardia, em pancreatite crônica agudizada e em hipertrigliceridemia grave (que pode inibir o ensaio).',
    'Tomografia com contraste nas primeiras 72 horas subestima a necrose. Peça pela suspeita de complicação, não por rotina.',
  ],
  referencias: [
    { texto: 'Banks PA, Bollen TL, Dervenis C, et al. Classification of acute pancreatitis — 2012: revision of the Atlanta classification and definitions by international consensus. Gut. 2013;62(1):102-111.' },
    { texto: 'van Santvoort HC, Besselink MG, Bakker OJ, et al. A step-up approach or open necrosectomy for necrotizing pancreatitis (PANTER). N Engl J Med. 2010;362(16):1491-1502.' },
  ],
}

const fib4: Ferramenta = {
  id: 'fib-4',
  nome: 'FIB-4 e APRI — fibrose hepática não invasiva',
  sinonimos: ['fib4', 'fib-4', 'apri', 'fibrose hepatica', 'elastografia'],
  resumo: 'Dois índices calculados com exames de rotina que dispensam biópsia na maioria dos casos.',
  categorias: ['gastroenterologia'],
  campos: [
    campoIdade({ min: 18 }),
    campoNum('ast', 'AST (TGO)', { unidade: 'U/L', min: 5, max: 2000, passo: 1 }),
    campoNum('alt', 'ALT (TGP)', { unidade: 'U/L', min: 5, max: 2000, passo: 1 }),
    campoNum('plaquetas', 'Plaquetas', { unidade: '×10⁹/L', min: 10, max: 800, passo: 1 }),
    campoNum('astLimite', 'Limite superior do normal da AST no laboratório', { unidade: 'U/L', min: 20, max: 60, passo: 1, padrao: '40' }),
  ],
  calcular: (v) => {
    const idade = num(v, 'idade')
    const ast = num(v, 'ast')
    const alt = num(v, 'alt')
    const plq = num(v, 'plaquetas')
    const astLim = numOu(v, 'astLimite', 40)
    if (idade === null || ast === null || alt === null || plq === null || alt <= 0 || plq <= 0) return null
    const fib4 = (idade * ast) / (plq * Math.sqrt(alt))
    const apri = ((ast / astLim) * 100) / plq
    const razao = ast / alt
    const corteBaixo = idade >= 65 ? 2.0 : 1.3
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'FIB-4', valor: fmt(fib4, 2), nota: `Corte inferior ${fmt(corteBaixo, 1)} (exclui fibrose avançada) e superior 2,67 (sugere fibrose avançada).`, nivel: fib4 > 2.67 ? 'alerta' : fib4 < corteBaixo ? 'ok' : 'atencao' },
      { rotulo: 'APRI', valor: fmt(apri, 2), nota: 'Abaixo de 0,5 torna fibrose significativa improvável; acima de 1,5 sugere fibrose avançada; acima de 2,0 sugere cirrose.', nivel: apri > 1.5 ? 'alerta' : apri < 0.5 ? 'ok' : 'atencao' },
      { rotulo: 'Relação AST/ALT', valor: fmt(razao, 2), nota: razao > 2 ? 'Acima de 2 com gama-GT elevada sugere fortemente etiologia alcoólica.' : razao > 1 ? 'Acima de 1 em paciente sem álcool sugere progressão para cirrose (a relação se inverte com a fibrose avançada).' : 'Abaixo de 1 — padrão habitual da doença hepática gordurosa e das hepatites virais sem cirrose.' },
    ]
    const nivel: Nivel = fib4 > 3.25 ? 'critico' : fib4 > 2.67 ? 'alerta' : fib4 < corteBaixo ? 'ok' : 'atencao'
    return {
      titulo: 'FIB-4',
      valor: fmt(fib4, 2),
      nivel,
      rotuloNivel: fib4 > 2.67 ? 'Fibrose avançada provável' : fib4 < corteBaixo ? 'Fibrose avançada improvável' : 'Zona indeterminada',
      detalhes,
      interpretacao: [
        fib4 < corteBaixo
          ? '**Abaixo do corte inferior:** valor preditivo negativo alto para fibrose avançada (F3-F4). Em atenção primária, isso permite dispensar encaminhamento e reavaliar em 1 a 3 anos conforme os fatores de risco metabólicos.'
          : fib4 > 2.67
            ? '**Acima do corte superior:** fibrose avançada provável. Encaminhe ao hepatologista e confirme com elastografia hepática transitória ou ARFI, ou com teste sérico proprietário.'
            : '**Zona indeterminada** — que abrange cerca de 30% dos pacientes e é a principal limitação do índice. O próximo passo é a elastografia: rigidez hepática abaixo de 8 kPa torna fibrose avançada improvável; acima de 12 a 15 kPa a torna provável.',
        'O algoritmo de rastreio de doença hepática esteatótica associada à disfunção metabólica começa com FIB-4 exatamente por ser gratuito: idade, duas transaminases e plaquetas já estão em qualquer exame de rotina.',
        'O corte inferior sobe para **2,0 em pessoas com 65 anos ou mais**, porque o FIB-4 usa a idade no numerador e produz falsos positivos em idosos.',
        'A queda das plaquetas é o elo fisiopatológico: fibrose avançada gera hipertensão portal, que gera hiperesplenismo e sequestro plaquetário. Por isso as plaquetas aparecem no denominador dos dois índices.',
      ],
      alertas: ['Ambos os índices foram derivados em hepatite C e validados depois em outras etiologias. Perdem acurácia em hepatite aguda (com transaminases muito elevadas) e em pacientes com trombocitopenia de outra causa.'],
    }
  },
  formula: ['FIB-4 = (idade × AST) / (plaquetas × √ALT)', 'APRI = [(AST / limite superior do normal) × 100] / plaquetas'],
  fundamento:
    'Os dois índices exploram a mesma correlação: à medida que a fibrose progride, as plaquetas caem (hipertensão portal e redução de trombopoetina) e a AST sobe em relação à ALT (a lesão mitocondrial predomina e a depuração sinusoidal da AST diminui). Combinar essas variáveis num único número gera um marcador substituto barato e razoavelmente acurado nos extremos — que é onde a decisão clínica realmente muda.',
  armadilhas: [
    'Não use FIB-4 durante hepatite aguda: transaminases muito elevadas distorcem o índice em ambas as direções.',
    'A zona indeterminada é grande. Tratá-la como "negativo" é o erro mais comum e deixa passar fibrose avançada.',
  ],
  referencias: [
    { texto: 'Sterling RK, Lissen E, Clumeck N, et al. Development of a simple noninvasive index to predict significant fibrosis in patients with HIV/HCV coinfection. Hepatology. 2006;43(6):1317-1325.' },
    { texto: 'Wai CT, Greenson JK, Fontana RJ, et al. A simple noninvasive index can predict both significant fibrosis and cirrhosis in patients with chronic hepatitis C. Hepatology. 2003;38(2):518-526.' },
    { texto: 'Rinella ME, Neuschwander-Tetri BA, Siddiqui MS, et al. AASLD Practice Guidance on the clinical assessment and management of nonalcoholic fatty liver disease. Hepatology. 2023;77(5):1797-1835.' },
  ],
}

const nafld: Ferramenta = {
  id: 'nafld-fibrosis-score',
  nome: 'NAFLD Fibrosis Score',
  sinonimos: ['nafld', 'nfs', 'esteatose fibrose', 'dhgna'],
  resumo: 'Índice específico para fibrose na doença hepática gordurosa.',
  categorias: ['gastroenterologia', 'endocrinologia'],
  campos: [
    campoIdade({ min: 18 }),
    campoPeso(),
    campoAltura(),
    campoSimNao('diabetes', 'Diabetes ou glicemia de jejum alterada', 1),
    campoNum('ast', 'AST (TGO)', { unidade: 'U/L', min: 5, max: 500, passo: 1 }),
    campoNum('alt', 'ALT (TGP)', { unidade: 'U/L', min: 5, max: 500, passo: 1 }),
    campoNum('plaquetas', 'Plaquetas', { unidade: '×10⁹/L', min: 10, max: 800, passo: 1 }),
    campoNum('albumina', 'Albumina', { unidade: 'g/dL', min: 1, max: 6, passo: 0.1 }),
  ],
  calcular: (v) => {
    const idade = num(v, 'idade')
    const peso = num(v, 'peso')
    const altura = num(v, 'altura')
    const ast = num(v, 'ast')
    const alt = num(v, 'alt')
    const plq = num(v, 'plaquetas')
    const alb = num(v, 'albumina')
    if (idade === null || peso === null || altura === null || ast === null || alt === null || plq === null || alb === null || alt <= 0) return null
    const bmi = calcImc(peso, altura)
    const dm = sim(v, 'diabetes') ? 1 : 0
    const nfs = -1.675 + 0.037 * idade + 0.094 * bmi + 1.13 * dm + 0.99 * (ast / alt) - 0.013 * plq - 0.66 * alb
    const nivel: Nivel = nfs > 0.676 ? 'alerta' : nfs < -1.455 ? 'ok' : 'atencao'
    return {
      titulo: 'NAFLD Fibrosis Score',
      valor: fmt(nfs, 3),
      nivel,
      rotuloNivel: nfs > 0.676 ? 'Fibrose avançada provável' : nfs < -1.455 ? 'Fibrose avançada improvável' : 'Zona indeterminada',
      detalhes: [
        { rotulo: 'IMC', valor: `${fmt(bmi, 1)} kg/m²` },
        { rotulo: 'Relação AST/ALT', valor: fmt(ast / alt, 2) },
        { rotulo: 'Corte inferior', valor: '< −1,455', nota: 'Exclui fibrose avançada com valor preditivo negativo em torno de 88 a 93%. Em pessoas com 65 anos ou mais, use −0,12.' },
        { rotulo: 'Corte superior', valor: '> 0,676', nota: 'Indica fibrose avançada com valor preditivo positivo em torno de 80%.' },
      ],
      interpretacao: [
        'O NFS foi derivado especificamente para doença hepática gordurosa e incorpora duas variáveis que o FIB-4 ignora: IMC e diabetes, ambos determinantes de progressão nessa doença.',
        '**A fibrose é o único preditor consistente de desfecho hepático e de mortalidade global na doença hepática gordurosa** — não a esteatose, não a inflamação isolada. É por isso que todo o esforço de estadiamento se concentra nela.',
        'Tratamento: perda de 7 a 10% do peso corporal reverte esteato-hepatite em boa parte dos casos e pode regredir fibrose. Agonistas de GLP-1 (semaglutida) e o agonista tireoidiano hepático resmetirom mostraram benefício histológico em ensaios randomizados. Inibidores de SGLT2 e pioglitazona são opções em diabéticos.',
        'A nomenclatura mudou em 2023: NAFLD passou a **MASLD** (doença hepática esteatótica associada à disfunção metabólica), com critério positivo de cardiometabolismo em vez de exclusão de álcool.',
      ],
    }
  },
  formula: ['NFS = −1,675 + 0,037×idade + 0,094×IMC + 1,13×(DM ou glicemia alterada) + 0,99×(AST/ALT) − 0,013×plaquetas − 0,66×albumina'],
  fundamento:
    'O escore foi derivado e validado em mais de 700 pacientes com doença hepática gordurosa comprovada por biópsia. As variáveis escolhidas cobrem risco metabólico (idade, IMC, diabetes), lesão hepatocelular relativa (relação AST/ALT) e consequências da hipertensão portal e da falência sintética (plaquetas, albumina).',
  armadilhas: [
    'A zona indeterminada abrange cerca de um quarto dos pacientes. Nela, a elastografia é o próximo passo.',
    'O corte inferior perde especificidade acima dos 65 anos; use −0,12 nessa faixa.',
  ],
  referencias: [
    { texto: 'Angulo P, Hui JM, Marchesini G, et al. The NAFLD fibrosis score: a noninvasive system that identifies liver fibrosis in patients with NAFLD. Hepatology. 2007;45(4):846-854.' },
    { texto: 'Rinella ME, Lazarus JV, Ratziu V, et al. A multisociety Delphi consensus statement on new fatty liver disease nomenclature. Hepatology. 2023;78(6):1966-1986.' },
  ],
}

const fli: Ferramenta = {
  id: 'fatty-liver-index',
  nome: 'Fatty Liver Index e risco hepático pelo IMC',
  sinonimos: ['esteatose', 'figado gorduroso', 'fli', 'imc risco hepatico'],
  resumo: 'Estima a probabilidade de esteatose hepática a partir de medidas simples.',
  categorias: ['gastroenterologia', 'endocrinologia', 'nutricao'],
  campos: [
    campoPeso(),
    campoAltura(),
    campoNum('cintura', 'Circunferência da cintura', { unidade: 'cm', min: 40, max: 200, passo: 0.5, ajuda: 'Medida no ponto médio entre a última costela e a crista ilíaca, ao fim de uma expiração normal.' }),
    campoNum('tg', 'Triglicerídeos', { unidade: 'mg/dL', min: 20, max: 2000, passo: 1 }),
    campoNum('ggt', 'Gama-glutamil transferase', { unidade: 'U/L', min: 5, max: 2000, passo: 1 }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const altura = num(v, 'altura')
    const cintura = num(v, 'cintura')
    const tg = num(v, 'tg')
    const ggt = num(v, 'ggt')
    if (peso === null || altura === null || cintura === null || tg === null || ggt === null || tg <= 0 || ggt <= 0) return null
    const bmi = calcImc(peso, altura)
    const z = 0.953 * Math.log(tg) + 0.139 * bmi + 0.718 * Math.log(ggt) + 0.053 * cintura - 15.745
    const fli = (Math.exp(z) / (1 + Math.exp(z))) * 100
    const classeImc = bmi < 18.5 ? 'Baixo peso' : bmi < 25 ? 'Eutrofia' : bmi < 30 ? 'Sobrepeso' : bmi < 35 ? 'Obesidade grau I' : bmi < 40 ? 'Obesidade grau II' : 'Obesidade grau III'
    const nivel: Nivel = fli >= 60 ? 'alerta' : fli < 30 ? 'ok' : 'atencao'
    return {
      titulo: 'Fatty Liver Index',
      valor: fmt(fli, 1),
      unidade: 'de 100',
      nivel,
      rotuloNivel: fli >= 60 ? 'Esteatose provável' : fli < 30 ? 'Esteatose improvável' : 'Zona intermediária',
      detalhes: [
        { rotulo: 'IMC', valor: `${fmt(bmi, 1)} kg/m² — ${classeImc}` },
        { rotulo: 'Circunferência da cintura', valor: `${fmt(cintura, 1)} cm`, nota: 'Risco cardiometabólico aumentado acima de 94 cm em homens e 80 cm em mulheres (critério europeu); 102 e 88 cm no critério americano.' },
        { rotulo: 'Corte inferior', valor: '< 30 — exclui esteatose (razão de verossimilhança negativa 0,2)' },
        { rotulo: 'Corte superior', valor: '≥ 60 — indica esteatose (razão de verossimilhança positiva 4,3)' },
      ],
      interpretacao: [
        'O índice foi derivado contra ultrassonografia numa coorte italiana de mais de 500 pessoas e é usado sobretudo em estudos epidemiológicos e em rastreio populacional, onde imagem para todos é inviável.',
        'A esteatose por si só tem prognóstico hepático benigno. O que muda o desfecho é a **fibrose** — por isso, um FLI alto deve ser seguido de estadiamento com FIB-4 e, se necessário, elastografia. Detectar gordura sem estadiar fibrose gera ansiedade sem benefício.',
        'A circunferência da cintura entra na fórmula porque a gordura **visceral**, e não a subcutânea, é a metabolicamente ativa: ela drena diretamente para a veia porta, expondo o fígado a ácidos graxos livres e a citocinas inflamatórias.',
        'Existe esteatose com IMC normal — a chamada MASLD magra —, mais frequente em asiáticos e associada a resistência insulínica e distribuição visceral de gordura, com prognóstico não melhor do que o da forma clássica.',
      ],
    }
  },
  formula: [
    'z = 0,953×ln(TG) + 0,139×IMC + 0,718×ln(GGT) + 0,053×cintura − 15,745',
    'FLI = (e^z / (1 + e^z)) × 100',
  ],
  fundamento:
    'O FLI é uma regressão logística convertida em probabilidade. Cada variável representa um eixo da doença: triglicerídeos e IMC refletem o excesso de substrato lipídico, a cintura reflete a adiposidade visceral e a gama-GT reflete o estresse oxidativo hepático — que sobe na esteatose antes das transaminases.',
  armadilhas: [
    'Gama-GT elevada por álcool, medicamentos ou colestase infla o índice sem esteatose.',
    'O índice estima presença de gordura, não gravidade nem fibrose.',
  ],
  referencias: [
    { texto: 'Bedogni G, Bellentani S, Miglioli L, et al. The Fatty Liver Index: a simple and accurate predictor of hepatic steatosis in the general population. BMC Gastroenterol. 2006;6:33.' },
  ],
}

const maddrey: Ferramenta = {
  id: 'maddrey',
  nome: 'Função discriminante de Maddrey e escore de Lille',
  sinonimos: ['maddrey', 'hepatite alcoolica', 'lille', 'corticoide hepatite'],
  resumo: 'Define indicação de corticoide na hepatite alcoólica grave e avalia a resposta.',
  categorias: ['gastroenterologia'],
  campos: [
    campoNum('tp', 'Tempo de protrombina do paciente', { unidade: 's', min: 8, max: 60, passo: 0.1 }),
    campoNum('tpControle', 'Tempo de protrombina do controle', { unidade: 's', min: 8, max: 20, passo: 0.1, padrao: '12' }),
    campoNum('bilirrubina', 'Bilirrubina total', { unidade: 'mg/dL', min: 0.1, max: 60, passo: 0.1 }),
    campoNum('bili7', 'Bilirrubina no 7º dia de corticoide', { unidade: 'mg/dL', min: 0.1, max: 60, passo: 0.1, opcional: true, ajuda: 'Permite avaliar a resposta pelo modelo de Lille simplificado.' }),
  ],
  calcular: (v) => {
    const tp = num(v, 'tp')
    const tpc = numOu(v, 'tpControle', 12)
    const bili = num(v, 'bilirrubina')
    const bili7 = num(v, 'bili7')
    if (tp === null || bili === null) return null
    const mdf = 4.6 * (tp - tpc) + bili
    const grave = mdf >= 32
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Prolongamento do tempo de protrombina', valor: `${fmt(tp - tpc, 1)} s` },
      { rotulo: 'Ponto de corte de gravidade', valor: '≥ 32', nota: 'Acima de 32, a mortalidade em 1 mês sem tratamento fica entre 30 e 50%.' },
    ]
    if (bili7 !== null) {
      const queda = bili - bili7
      detalhes.push({
        rotulo: 'Queda da bilirrubina em 7 dias',
        valor: `${fmt(queda, 1)} mg/dL`,
        nota: queda > 0 ? 'Queda da bilirrubina no 7º dia é o principal componente do modelo de Lille e indica resposta ao corticoide. Lille < 0,45 = respondedor, mantém o corticoide por 28 dias. Lille ≥ 0,45 = não respondedor, suspenda.' : 'Sem queda da bilirrubina: provável não resposta ao corticoide. Reavalie a indicação e considere suspender.',
        nivel: queda > 0 ? 'ok' : 'alerta',
      })
    }
    return {
      titulo: 'Função discriminante de Maddrey',
      valor: fmt(mdf, 1),
      nivel: grave ? 'critico' : 'atencao',
      rotuloNivel: grave ? 'Hepatite alcoólica grave' : 'Hepatite alcoólica não grave',
      detalhes,
      interpretacao: [
        grave
          ? '**Maddrey ≥ 32 define hepatite alcoólica grave** e é a indicação clássica de **prednisolona 40 mg/dia por 28 dias** (prednisolona, não prednisona, porque a conversão hepática está comprometida). O ensaio STOPAH mostrou redução de mortalidade em 28 dias, sem benefício em 90 dias nem em 1 ano — o corticoide compra tempo, não cura.'
          : 'Maddrey abaixo de 32: hepatite alcoólica não grave. O corticoide não está indicado; o tratamento é abstinência, suporte nutricional e manejo das complicações.',
        '**Contraindicações ao corticoide:** infecção não controlada, hemorragia digestiva ativa, insuficiência renal (síndrome hepatorrenal), pancreatite aguda e hepatite viral ativa. Rastreie infecção agressivamente antes de iniciar — a hepatite alcoólica grave cursa com imunoparesia e infecção oculta é comum.',
        'A **abstinência é a intervenção com maior impacto sobre a sobrevida a longo prazo**, superior a qualquer fármaco. Nutrição adequada (35 a 40 kcal/kg/dia e 1,2 a 1,5 g/kg/dia de proteína), reposição de tiamina e rastreio de outras deficiências são parte do tratamento.',
        'O escore MELD acima de 20 é uma alternativa cada vez mais usada para definir gravidade, com desempenho pelo menos equivalente ao Maddrey.',
      ],
      alertas: ['Não confunda prednisolona com prednisona: na disfunção hepática grave, a conversão de prednisona em prednisolona pode estar prejudicada.'],
    }
  },
  formula: ['Maddrey = 4,6 × (TP do paciente − TP do controle) + bilirrubina total'],
  fundamento:
    'A função discriminante foi derivada nos anos 1970 combinando as duas medidas que melhor refletiam a gravidade da hepatite alcoólica: o comprometimento da síntese de fatores de coagulação e a falência excretora. O coeficiente 4,6 foi ajustado empiricamente para dar aos dois componentes pesos comparáveis.',
  armadilhas: [
    'O tempo de protrombina depende do reagente usado; por isso a fórmula exige o **controle do mesmo laboratório**, e não o INR.',
    'Diagnóstico diferencial obrigatório: hepatite viral, medicamentosa, autoimune, isquêmica e doença de Wilson podem imitar o quadro. Biópsia transjugular é uma opção quando a dúvida persiste e o tratamento com corticoide está em jogo.',
  ],
  referencias: [
    { texto: 'Maddrey WC, Boitnott JK, Bedine MS, et al. Corticosteroid therapy of alcoholic hepatitis. Gastroenterology. 1978;75(2):193-199.' },
    { texto: 'Thursz MR, Richardson P, Allison M, et al. Prednisolone or pentoxifylline for alcoholic hepatitis (STOPAH). N Engl J Med. 2015;372(17):1619-1628.' },
    { texto: 'Louvet A, Naveau S, Abdelnour M, et al. The Lille model: a new tool for therapeutic strategy in patients with severe alcoholic hepatitis treated with steroids. Hepatology. 2007;45(6):1348-1354.' },
  ],
}

const kings: Ferramenta = {
  id: 'kings-college',
  nome: 'Critérios do King’s College para insuficiência hepática aguda',
  sinonimos: ['kings college', 'insuficiencia hepatica aguda', 'transplante urgente', 'paracetamol'],
  resumo: 'Identifica quem precisa de transplante urgente na falência hepática fulminante.',
  categorias: ['gastroenterologia', 'emergencia'],
  campos: [
    campoSeg('etiologia', 'Etiologia', [
      { valor: 'paracetamol', rotulo: 'Paracetamol' },
      { valor: 'outras', rotulo: 'Outras causas' },
    ]),
    campoSimNao('ph', 'pH arterial < 7,30 após ressuscitação volêmica adequada', 1),
    campoSimNao('inr3', 'INR > 6,5 (TP > 100 s)', 1),
    campoSimNao('creatinina', 'Creatinina > 3,4 mg/dL', 1),
    campoSimNao('encefalopatia3', 'Encefalopatia grau III ou IV', 1),
    campoSimNao('lactato', 'Lactato > 3,0 mmol/L após ressuscitação (critério adicional)', 1),
    campoSimNao('idade', 'Idade < 10 ou > 40 anos', 1),
    campoSimNao('etiologiaDesfavoravel', 'Etiologia desfavorável (hepatite não-A não-B, medicamentosa, halotano)', 1),
    campoSimNao('ictericia7', 'Icterícia por mais de 7 dias antes da encefalopatia', 1),
    campoSimNao('inr35', 'INR > 3,5', 1),
    campoSimNao('bilirrubina', 'Bilirrubina > 17,5 mg/dL', 1),
  ],
  calcular: (v) => {
    const paracetamol = opc(v, 'etiologia') === 'paracetamol'
    let preenche = false
    let explicacao = ''
    const detalhes: Resultado['detalhes'] = []
    if (paracetamol) {
      const criterioA = sim(v, 'ph')
      const criterioB = sim(v, 'inr3') && sim(v, 'creatinina') && sim(v, 'encefalopatia3')
      const criterioLactato = sim(v, 'lactato')
      preenche = criterioA || criterioB || criterioLactato
      explicacao = 'Na intoxicação por paracetamol, basta **pH < 7,30** após ressuscitação, **ou** a tríade INR > 6,5 + creatinina > 3,4 + encefalopatia III/IV.'
      detalhes.push({ rotulo: 'Critério A — acidose', valor: criterioA ? 'Preenchido' : 'Não preenchido', nivel: criterioA ? 'critico' : 'ok' })
      detalhes.push({ rotulo: 'Critério B — tríade', valor: criterioB ? 'Preenchido' : 'Não preenchido', nivel: criterioB ? 'critico' : 'ok' })
      detalhes.push({ rotulo: 'Critério do lactato (modificação de 2002)', valor: criterioLactato ? 'Preenchido' : 'Não preenchido', nota: 'Lactato > 3,5 mmol/L na chegada ou > 3,0 após reposição melhora a sensibilidade dos critérios originais.' })
    } else {
      const inrAlto = sim(v, 'inr3')
      const menores = ['idade', 'etiologiaDesfavoravel', 'ictericia7', 'inr35', 'bilirrubina'].filter((id) => sim(v, id)).length
      preenche = inrAlto || menores >= 3
      explicacao = 'Nas demais etiologias: **INR > 6,5 isoladamente**, ou **3 de 5 critérios menores** (idade < 10 ou > 40 anos, etiologia desfavorável, icterícia por mais de 7 dias antes da encefalopatia, INR > 3,5, bilirrubina > 17,5 mg/dL).'
      detalhes.push({ rotulo: 'INR > 6,5 isolado', valor: inrAlto ? 'Preenchido' : 'Não preenchido', nivel: inrAlto ? 'critico' : 'ok' })
      detalhes.push({ rotulo: 'Critérios menores', valor: `${menores} de 5`, nota: '3 ou mais preenchem o critério.', nivel: menores >= 3 ? 'critico' : 'ok' })
    }
    return {
      titulo: preenche ? 'Critérios de transplante preenchidos' : 'Critérios não preenchidos',
      valor: preenche ? 'Transplante urgente indicado' : 'Não preenche',
      nivel: preenche ? 'critico' : 'alerta',
      rotuloNivel: paracetamol ? 'Etiologia: paracetamol' : 'Outras etiologias',
      detalhes,
      interpretacao: [
        explicacao,
        preenche
          ? '**Contate imediatamente um centro de transplante.** Os critérios têm alta especificidade — quem os preenche tem prognóstico muito ruim sem transplante —, mas sensibilidade apenas moderada: **não preenchê-los não é tranquilizador**.'
          : 'Critérios não preenchidos neste momento. Isso **não** significa bom prognóstico: a sensibilidade dos critérios é limitada e a insuficiência hepática aguda evolui em horas. Reavalie continuamente e discuta com o centro de transplante desde o início.',
        '**N-acetilcisteína está indicada em toda insuficiência hepática aguda**, não apenas na intoxicação por paracetamol — melhora a sobrevida livre de transplante em casos não relacionados a paracetamol com encefalopatia de graus I e II.',
        'O manejo intensivo inclui: vigilância de hipoglicemia (dextrose contínua), controle de amônia e edema cerebral (salina hipertônica, cabeceira elevada, evitar hiperventilação profilática), rastreio agressivo de infecção, e **não corrigir coagulopatia profilaticamente** — o INR é o principal marcador prognóstico e corrigi-lo cega a avaliação.',
      ],
      alertas: ['O grau de encefalopatia é o parâmetro que mais muda em poucas horas. Reavalie com frequência e antecipe a via aérea nos graus III e IV.'],
    }
  },
  formula: [
    'Paracetamol: pH < 7,30, OU (INR > 6,5 + creatinina > 3,4 + encefalopatia III/IV)',
    'Outras causas: INR > 6,5, OU 3 de 5 critérios menores',
  ],
  fundamento:
    'Os critérios foram derivados em 1989 no King’s College Hospital, a partir de 588 casos de insuficiência hepática aguda, buscando identificar quem morreria sem transplante. A separação por etiologia foi essencial: a intoxicação por paracetamol tem curso e prognóstico distintos, com potencial de recuperação espontânea muito maior quando não há acidose nem falência renal.',
  armadilhas: [
    'Sensibilidade limitada — cerca de 60 a 70% nas validações. Não usar como critério para **não** encaminhar.',
    'O INR corrigido com plasma perde valor prognóstico. Não transfunda plasma sem sangramento ativo ou procedimento invasivo planejado.',
  ],
  referencias: [
    { texto: 'O’Grady JG, Alexander GJ, Hayllar KM, Williams R. Early indicators of prognosis in fulminant hepatic failure. Gastroenterology. 1989;97(2):439-445.' },
    { texto: 'Bernal W, Wendon J. Acute liver failure. N Engl J Med. 2013;369(26):2525-2534.' },
  ],
}

const roma: Ferramenta = {
  id: 'roma-iv',
  nome: 'Critérios de Roma IV para distúrbios funcionais',
  sinonimos: ['roma', 'roma iv', 'sii', 'intestino irritavel', 'dispepsia funcional'],
  resumo: 'Aplica os critérios diagnósticos da síndrome do intestino irritável e da dispepsia funcional.',
  categorias: ['gastroenterologia'],
  campos: [
    campoSeg('sindrome', 'Síndrome a avaliar', [
      { valor: 'sii', rotulo: 'Síndrome do intestino irritável' },
      { valor: 'dispepsia', rotulo: 'Dispepsia funcional' },
      { valor: 'constipacao', rotulo: 'Constipação funcional' },
    ]),
    campoSimNao('duracao', 'Sintomas iniciados há mais de 6 meses e presentes nos últimos 3 meses', 1),
    campoSimNao('frequencia', 'Sintomas em pelo menos 1 dia por semana (SII) ou 3 dias por mês (demais)', 1),
    campoSimNao('defecacao', 'Dor relacionada à defecação', 1),
    campoSimNao('frequenciaEvac', 'Mudança na frequência das evacuações', 1),
    campoSimNao('forma', 'Mudança na forma ou aparência das fezes', 1),
    campoSimNao('plenitude', 'Plenitude pós-prandial incômoda', 1),
    campoSimNao('saciedade', 'Saciedade precoce', 1),
    campoSimNao('dorEpigastrica', 'Dor ou queimação epigástrica', 1),
    campoSimNao('esforco', 'Esforço evacuatório em mais de 25% das evacuações', 1),
    campoSimNao('fezesDuras', 'Fezes duras ou fragmentadas em mais de 25% das evacuações', 1),
    campoSimNao('alarme', 'Algum sinal de alarme presente', 1, 'Idade acima de 50 anos com início recente, perda de peso não intencional, sangramento, anemia, febre, massa palpável, história familiar de câncer colorretal ou doença inflamatória intestinal, sintomas noturnos.'),
  ],
  calcular: (v) => {
    const s = opc(v, 'sindrome')
    const base = sim(v, 'duracao') && sim(v, 'frequencia')
    const alarme = sim(v, 'alarme')
    let preenche = false
    let explicacao = ''
    if (s === 'sii') {
      const criterios = ['defecacao', 'frequenciaEvac', 'forma'].filter((id) => sim(v, id)).length
      preenche = base && criterios >= 2
      explicacao = `Síndrome do intestino irritável (Roma IV): **dor abdominal recorrente**, em média pelo menos 1 dia por semana nos últimos 3 meses, associada a **2 ou mais** de: relação com a defecação, mudança na frequência das evacuações, mudança na forma das fezes. Aqui: ${criterios} de 3 critérios.`
    } else if (s === 'dispepsia') {
      const criterios = ['plenitude', 'saciedade', 'dorEpigastrica'].filter((id) => sim(v, id)).length
      preenche = base && criterios >= 1
      explicacao = `Dispepsia funcional (Roma IV): **1 ou mais** de plenitude pós-prandial incômoda, saciedade precoce, dor epigástrica ou queimação epigástrica, sem evidência de doença estrutural que explique os sintomas (incluindo endoscopia normal). Aqui: ${criterios} de 4 sintomas cardinais.`
    } else {
      const criterios = ['esforco', 'fezesDuras'].filter((id) => sim(v, id)).length
      preenche = base && criterios >= 2
      explicacao = `Constipação funcional (Roma IV): **2 ou mais** de esforço, fezes duras ou fragmentadas, sensação de evacuação incompleta, sensação de obstrução anorretal, manobras manuais, menos de 3 evacuações espontâneas por semana — cada um em mais de 25% das evacuações. Aqui: ${criterios} dos critérios avaliados.`
    }
    return {
      titulo: preenche ? 'Critérios preenchidos' : 'Critérios não preenchidos',
      valor: preenche ? 'Compatível' : 'Não compatível',
      nivel: alarme ? 'critico' : preenche ? 'ok' : 'atencao',
      rotuloNivel: alarme ? '⚠ Sinal de alarme presente' : preenche ? 'Distúrbio funcional provável' : 'Reavaliar',
      detalhes: [{ rotulo: 'Critérios', valor: explicacao }],
      interpretacao: [
        alarme
          ? '**Sinal de alarme presente.** Investigue estrutural antes de rotular como funcional: colonoscopia, endoscopia, exames laboratoriais e de imagem conforme o quadro.'
          : 'Sem sinais de alarme relatados. Roma IV é um diagnóstico **positivo**, feito por critérios — não de exclusão por eliminação exaustiva. Investigação mínima e dirigida basta na maioria dos casos.',
        'A investigação mínima na suspeita de síndrome do intestino irritável inclui hemograma, proteína C reativa ou calprotectina fecal (para excluir doença inflamatória intestinal) e sorologia para doença celíaca. Colonoscopia só com sinal de alarme ou idade de rastreio.',
        'Roma IV trocou "desconforto abdominal" por **dor abdominal** e elevou a frequência mínima para 1 dia por semana, tornando os critérios mais específicos que os de Roma III.',
        'Os distúrbios funcionais são hoje entendidos como **distúrbios da interação intestino-cérebro**: envolvem hipersensibilidade visceral, alteração de motilidade, disbiose, permeabilidade aumentada e processamento central alterado da dor. Isso muda o tratamento — dieta com baixo teor de FODMAPs, neuromoduladores em dose baixa, terapia cognitivo-comportamental e hipnoterapia dirigida ao intestino têm evidência de eficácia.',
      ],
    }
  },
  formula: [],
  fundamento:
    'Os critérios de Roma existem porque os distúrbios funcionais não têm marcador biológico, e sem definição operacional a pesquisa clínica seria impossível. Cada revisão refinou a especificidade — o custo foi tornar os critérios mais restritivos que a prática, de modo que muitos pacientes com quadro claramente funcional não os preenchem formalmente. Isso não impede o diagnóstico clínico.',
  armadilhas: [
    'Não use os critérios para negar investigação a quem tem sinal de alarme.',
    'Doença celíaca, intolerância à lactose, supercrescimento bacteriano e insuficiência pancreática exócrina imitam a síndrome do intestino irritável e são tratáveis.',
  ],
  referencias: [
    { texto: 'Drossman DA. Functional gastrointestinal disorders: history, pathophysiology, clinical features and Rome IV. Gastroenterology. 2016;150(6):1262-1279.' },
    { texto: 'Lacy BE, Pimentel M, Brenner DM, et al. ACG clinical guideline: management of irritable bowel syndrome. Am J Gastroenterol. 2021;116(1):17-44.' },
  ],
}

const astAlt: Ferramenta = {
  id: 'relacao-ast-alt',
  nome: 'Relação AST/ALT e padrão de lesão hepática',
  sinonimos: ['ast alt', 'tgo tgp', 'de ritis', 'transaminases', 'padrao colestatico'],
  resumo: 'Separa lesão hepatocelular de colestática e aponta a etiologia pelo padrão.',
  categorias: ['gastroenterologia'],
  campos: [
    campoNum('ast', 'AST (TGO)', { unidade: 'U/L', min: 5, max: 10000, passo: 1 }),
    campoNum('alt', 'ALT (TGP)', { unidade: 'U/L', min: 5, max: 10000, passo: 1 }),
    campoNum('fa', 'Fosfatase alcalina', { unidade: 'U/L', min: 10, max: 3000, passo: 1 }),
    campoNum('altLimite', 'Limite superior do normal da ALT', { unidade: 'U/L', min: 15, max: 70, passo: 1, padrao: '40' }),
    campoNum('faLimite', 'Limite superior do normal da fosfatase alcalina', { unidade: 'U/L', min: 60, max: 200, passo: 1, padrao: '120' }),
  ],
  calcular: (v) => {
    const ast = num(v, 'ast')
    const alt = num(v, 'alt')
    const fa = num(v, 'fa')
    const altLim = numOu(v, 'altLimite', 40)
    const faLim = numOu(v, 'faLimite', 120)
    if (ast === null || alt === null || fa === null || alt <= 0) return null
    const razao = ast / alt
    const r = alt / altLim / (fa / faLim)
    const padrao = r >= 5 ? 'Hepatocelular' : r <= 2 ? 'Colestático' : 'Misto'
    const vezesAlt = alt / altLim
    const magnitude = vezesAlt > 25 ? 'Elevação maciça (> 25× o normal)' : vezesAlt > 5 ? 'Elevação acentuada (5 a 25×)' : vezesAlt > 2 ? 'Elevação moderada (2 a 5×)' : 'Elevação leve (< 2×)'
    return {
      titulo: `Padrão ${padrao.toLowerCase()}`,
      valor: fmt(razao, 2),
      unidade: 'AST/ALT',
      nivel: vezesAlt > 25 ? 'critico' : vezesAlt > 5 ? 'alerta' : 'atencao',
      rotuloNivel: magnitude,
      detalhes: [
        { rotulo: 'Índice R', valor: fmt(r, 2), nota: '(ALT ÷ limite) ÷ (FA ÷ limite). R ≥ 5 hepatocelular; R ≤ 2 colestático; entre 2 e 5, misto.' },
        { rotulo: 'Relação AST/ALT (De Ritis)', valor: fmt(razao, 2) },
        { rotulo: 'ALT em múltiplos do normal', valor: `${fmt(vezesAlt, 1)}×` },
      ],
      interpretacao: [
        '**A magnitude aponta a causa melhor do que qualquer outra pista.** Elevação acima de 25 vezes o normal restringe o diagnóstico a três famílias: hepatite viral aguda, hepatite isquêmica (fígado de choque) e hepatotoxicidade — sobretudo paracetamol. Elevações leves a moderadas são inespecíficas e compatíveis com doença hepática gordurosa, hepatite crônica, álcool e medicamentos.',
        razao > 2
          ? '**Relação AST/ALT acima de 2** com gama-GT elevada é altamente sugestiva de doença hepática alcoólica. O mecanismo é duplo: a deficiência de piridoxina, comum no etilista, reduz a síntese de ALT, e o álcool causa dano mitocondrial, liberando a isoforma mitocondrial da AST.'
          : razao > 1
            ? 'Relação acima de 1 sem consumo de álcool sugere progressão para **cirrose** — a relação se inverte com a fibrose avançada, independentemente da etiologia.'
            : 'Relação abaixo de 1 é o padrão habitual da doença hepática gordurosa não avançada e das hepatites virais crônicas.',
        'AST não é específica do fígado: também vem de músculo esquelético, miocárdio e hemácias. AST desproporcionalmente elevada com ALT normal e creatinoquinase alta é lesão **muscular**, não hepática.',
        padrao === 'Colestático'
          ? 'Padrão colestático: a primeira pergunta é se há obstrução. Ultrassonografia de vias biliares é o exame inicial. Se não houver dilatação, investigue colestase intra-hepática — medicamentos, colangite biliar primária (anticorpo antimitocôndria), colangite esclerosante (colangiorressonância), infiltração e sepse.'
            : 'Padrão hepatocelular: investigue sorologias virais, autoanticorpos, ferritina e saturação de transferrina, ceruloplasmina em jovens, alfa-1-antitripsina, e revise cuidadosamente a lista de medicamentos e fitoterápicos.',
      ],
      alertas: ['Transaminases normais **não** excluem doença hepática avançada. A cirrose em fase terminal frequentemente cursa com transaminases normais ou baixas, porque resta pouco hepatócito para lesar.'],
    }
  },
  formula: ['Índice R = (ALT / limite superior) ÷ (FA / limite superior)', 'Relação de De Ritis = AST / ALT'],
  fundamento:
    'ALT é praticamente exclusiva do citoplasma do hepatócito, o que a torna o marcador mais específico de lesão hepatocelular. AST existe no citoplasma e na mitocôndria, e em vários outros tecidos. A fosfatase alcalina se origina do epitélio dos canalículos biliares e sobe quando há obstrução ou colestase. Combinar as três num índice permite classificar o padrão de lesão antes de qualquer exame de imagem — e o padrão restringe drasticamente o diferencial.',
  armadilhas: [
    'Fosfatase alcalina também sobe em doença óssea, gestação e crescimento. A gama-GT confirma origem hepática: elevada junto, é fígado.',
    'Macro-AST é uma causa rara de AST persistentemente elevada sem doença — complexo de AST com imunoglobulina, sem significado clínico.',
  ],
  referencias: [
    { texto: 'Kwo PY, Cohen SM, Lim JK. ACG clinical guideline: evaluation of abnormal liver chemistries. Am J Gastroenterol. 2017;112(1):18-35.' },
    { texto: 'Botros M, Sikaris KA. The De Ritis ratio: the test of time. Clin Biochem Rev. 2013;34(3):117-130.' },
  ],
}

export const ferramentas: Ferramenta[] = [
  childPugh,
  meld,
  blatchford,
  rockall,
  bisap,
  ranson,
  atlanta,
  fib4,
  nafld,
  fli,
  maddrey,
  kings,
  roma,
  astAlt,
]

export default ferramentas
