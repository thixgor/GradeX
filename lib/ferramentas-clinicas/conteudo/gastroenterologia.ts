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
      conduta: [
        '**Child A (5–6 pontos)**: função hepática preservada, sobrevida em 1 ano em torno de 100%. Cirurgia eletiva é tolerável, e o paciente é candidato a ressecção hepática e a tratamento pleno de hepatite viral. Mantenha rastreio de carcinoma hepatocelular com ultrassonografia semestral e rastreio endoscópico de varizes.',
        '**Child B (7–9 pontos)**: reserva funcional limítrofe, sobrevida em 1 ano de 80%. Evite cirurgia eletiva, ajuste fármacos hepaticamente metabolizados e comece a discutir **transplante**. É a faixa em que a descompensação costuma se instalar e em que o manejo de ascite e encefalopatia domina o cuidado.',
        '**Child C (10–15 pontos)**: sobrevida em 1 ano de 45%. Cirurgia eletiva é contraindicada — a mortalidade de uma colecistectomia aberta nesse grupo passa de 30%. Encaminhe para avaliação de transplante e considere cuidados paliativos concomitantes.',
        'Use o Child-Pugh para o que ele faz melhor — **prever risco cirúrgico e anestésico, e ajustar dose de fármacos** — e o **MELD** para priorização em fila de transplante, onde ele substituiu o Child por ser objetivo e não depender de itens subjetivos.',
        'Os dois itens subjetivos (**ascite e encefalopatia**) são a fraqueza do escore: ascite controlada por diurético pontua diferente conforme quem avalia, e encefalopatia mínima só aparece em testes psicométricos. Registre o critério usado, para que a comparação ao longo do tempo tenha sentido.',
      ],
      alertas: [
        'Ascite e encefalopatia são itens subjetivos: ascite controlada por diurético pontua diferente conforme quem avalia, e encefalopatia mínima só aparece em testes psicométricos. Registre o critério usado para que a comparação ao longo do tempo tenha sentido.',
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
    campoNum('bilirrubina', 'Bilirrubina total', { ajuda: 'Bilirrubina total em mg/dL. Hemólise e obstrução biliar extra-hepática a elevam por mecanismo alheio à função hepatocelular e distorcem o escore.', unidade: 'mg/dL', min: 0.1, max: 60, passo: 0.1 }),
    campoNum('inr', 'INR', { ajuda: 'INR do tempo de protrombina. Anticoagulante oral em uso invalida o cálculo — registre o uso em vez de aceitar o número.', min: 0.5, max: 12, passo: 0.01 }),
    campoNum('creatinina', 'Creatinina', { ajuda: 'Creatinina em mg/dL, limitada a 4,0 no cálculo. Diálise nos últimos 7 dias entra como valor fixo de 4,0.', unidade: 'mg/dL', min: 0.1, max: 15, passo: 0.01 }),
    campoNum('sodio', 'Sódio', { unidade: 'mEq/L', min: 100, max: 160, passo: 1, opcional: true, ajuda: 'Habilita o MELD-Na e o MELD 3.0.' }),
    campoNum('albumina', 'Albumina', { unidade: 'g/dL', min: 0.5, max: 6, passo: 0.1, opcional: true, ajuda: 'Entra apenas no MELD 3.0.' }),
    campoSexo(),
    campoSimNao('dialise', 'Duas ou mais sessões de diálise nos últimos 7 dias, ou 24 h de hemodiálise contínua', 1, 'Duas ou mais sessões de hemodiálise, ou 24 horas de terapia contínua, nos últimos 7 dias. Nesse caso a creatinina entra no cálculo fixada em 4,0 mg/dL.'),
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
      conduta: [
        'Use o **MELD-Na ou MELD 3.0** para priorização em lista de transplante — são as versões em uso e incorporam sódio (e, no 3.0, sexo e albumina), corrigindo a desvantagem histórica das mulheres, que tinham creatinina mais baixa por menor massa muscular e pontuavam menos para a mesma gravidade.',
        '**MELD ≥ 15** é o limiar em que o benefício de sobrevida do transplante supera o risco do procedimento. Abaixo disso, transplantar pode reduzir a sobrevida. Encaminhe para avaliação em centro transplantador quando o MELD se aproximar de 15 ou ao primeiro evento de descompensação.',
        '**MELD ≥ 20** indica alta mortalidade em 3 meses (acima de 20%) e demanda acompanhamento intensivo, avaliação rápida em centro de transplante e discussão de prioridade. Acima de 30, a mortalidade em 3 meses passa de 50%.',
        'Considere **pontos de exceção** para condições cuja gravidade o MELD não captura: carcinoma hepatocelular dentro dos critérios de Milão, síndrome hepatopulmonar, hipertensão portopulmonar, colangite bacteriana recorrente, polineuropatia amiloidótica familiar e prurido intratável. Sem a exceção, esses pacientes morrem com MELD baixo.',
        'Atenção às **distorções do cálculo**: diálise recente entra como creatinina fixa de 4,0 mg/dL; anticoagulante oral distorce o INR e torna o escore não interpretável; e hemólise ou colestase extra-hepática elevam a bilirrubina por mecanismo alheio à função hepatocelular. Verifique esses três antes de aceitar o número.',
      ],
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
    campoNum('ureia', 'Ureia', { ajuda: 'Ureia em mg/dL. Ela sobe desproporcionalmente à creatinina porque a hemoglobina digerida no intestino delgado é uma carga proteica absorvida.', unidade: 'mg/dL', min: 5, max: 400, passo: 1 }),
    campoNum('hb', 'Hemoglobina', { ajuda: 'Hemoglobina da admissão. Ela subestima a perda nas primeiras horas, antes da hemodiluição compensatória.', unidade: 'g/dL', min: 2, max: 20, passo: 0.1 }),
    campoSexo(),
    campoNum('pas', 'PA sistólica', { ajuda: 'Sistólica da chegada, antes da reposição volêmica.', unidade: 'mmHg', min: 40, max: 250, passo: 1 }),
    campoSimNao('fc', 'Frequência cardíaca ≥ 100 bpm', 1),
    campoSimNao('melena', 'Melena', 1, 'Melena constatada ao exame, não apenas relatada — fezes escurecidas por ferro, bismuto ou beterraba são confundidas com frequência.'),
    campoSimNao('sincope', 'Síncope', 2, 'Síncope ou pré-síncope associada ao episódio de sangramento.'),
    campoSimNao('hepatopatia', 'Doença hepática', 2, 'Doença hepática conhecida ou em investigação — muda também a conduta, por exigir profilaxia antibiótica e agente vasoativo esplâncnico.'),
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
      conduta: [
        '**Escore 0 (ou ≤ 1, conforme o protocolo local)**: o paciente pode receber alta da emergência com endoscopia ambulatorial. Esse é o principal uso da ferramenta — identificar quem não precisa internar nem de endoscopia urgente, com valor preditivo negativo próximo de 99%.',
        '**Escore ≥ 1 e < 7**: interne com endoscopia digestiva alta em até 24 horas, suporte transfusional conforme necessidade e inibidor de bomba de prótons intravenoso.',
        '**Escore ≥ 7**: alto risco de necessidade de intervenção. Endoscopia em até 24 h (não antes de 12 h, pois a endoscopia ultraprecoce não melhora desfecho e piora as condições do exame), reserva de hemocomponentes e leito monitorado.',
        'Adote a estratégia transfusional **restritiva, com gatilho de hemoglobina de 7 g/dL** (8 g/dL em doença cardiovascular): transfundir liberalmente em hemorragia varicosa aumenta a pressão portal e a ressangramento, e associou-se a maior mortalidade no ensaio de referência.',
        'Se houver suspeita de **hemorragia varicosa** (cirrose conhecida, estigmas de hepatopatia), acrescente **terlipressina ou octreotide** e **antibiótico profilático — ceftriaxona 1 g/dia por até 7 dias**, que reduz infecção, ressangramento e mortalidade e é frequentemente esquecido. O Glasgow-Blatchford é superior ao Rockall pré-endoscópico justamente por não exigir a endoscopia para ser calculado.',
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
    'O Blatchford foi derivado para prever **necessidade de intervenção**, e não mortalidade — e essa escolha de desfecho é o que o torna útil na triagem. Ele usa apenas dados pré-endoscópicos, disponíveis na chegada, e por isso responde à pergunta que o emergencista faz primeiro: este paciente precisa ficar? O escore foi construído para prever **necessidade de intervenção** (transfusão, endoscopia terapêutica, cirurgia), não mortalidade — e é essa escolha de desfecho que o torna útil na triagem. Ele captura tanto a magnitude da perda (hemoglobina, pressão, frequência) quanto a resposta fisiológica à digestão do sangue no intestino delgado: a **ureia sobe desproporcionalmente à creatinina** porque a hemoglobina digerida é uma carga proteica absorvida, somada à redução da perfusão renal.',
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
    ], { ajuda: 'Use os valores da admissão, antes da ressuscitação volêmica. Atenção ao betabloqueado e ao cirrótico: o primeiro pode não taquicardizar, e o segundo tem pressão basal baixa, de modo que 100 mmHg pode já ser hipotensão relativa.' }),
    campoOpc('comorbidade', 'Comorbidades', [
      { valor: '0', rotulo: 'Nenhuma maior', pontos: 0 },
      { valor: '2', rotulo: 'Insuficiência cardíaca, doença coronariana ou outra maior', pontos: 2 },
      { valor: '3', rotulo: 'Insuficiência renal, hepática ou neoplasia disseminada', pontos: 3 },
    ], { ajuda: 'Marque apenas a categoria de maior peso, não some as duas. Este item é o de maior peso do escore porque na hemorragia digestiva a morte vem da descompensação de órgão com reserva limitada, não da exsanguinação.' }),
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
    ], { ajuda: 'Corresponde a Forrest Ia, Ib, IIa e IIb. Base pigmentada (IIc) e base limpa (III) valem 0. Se o laudo não classificar os estigmas, o escore completo fica inaplicável — peça a descrição.', mostrarSe: (v) => sim(v, 'temEndoscopia') }),
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
        'Por que o inibidor de bomba de prótons em dose alta muda o ressangramento, e não a mortalidade por si, é uma questão de **química do coágulo**. A hemostasia sobre uma úlcera depende da agregação plaquetária e da formação de fibrina estável, e as duas são dependentes de pH: a agregação plaquetária é inibida abaixo de pH 6, e a pepsina — ativa em pH abaixo de 4 — digere ativamente o coágulo já formado, num processo chamado fibrinólise péptica. Elevar o pH intragástrico acima de 6 de forma sustentada inativa a pepsina e permite que o coágulo amadureça. É por isso que a via de administração importa: o efeito depende de manter o pH alto **continuamente**, e é isso que a infusão contínua ou a dose alta intermitente conseguem, enquanto a dose oral padrão não. O mesmo raciocínio explica por que o inibidor antes da endoscopia reduz a proporção de estigmas de alto risco encontrados, mas não substitui a terapia endoscópica: ele estabiliza o coágulo existente, não oclui o vaso.',
        'Vale entender por que o escore pesa tanto **idade e comorbidade** — juntas somam até 5 dos 7 pontos pré-endoscópicos. Na hemorragia digestiva alta, a morte raramente ocorre por exsanguinação: ela vem da descompensação de órgãos com reserva limitada diante da anemia aguda, da hipovolemia e do estresse fisiológico. A queda do conteúdo arterial de oxigênio numa coronariopatia produz isquemia miocárdica; a hipoperfusão num rim já comprometido produz necrose tubular; no cirrótico, a hipovolemia precipita encefalopatia, síndrome hepatorrenal e translocação bacteriana. É por isso que o Rockall prediz **mortalidade** melhor que qualquer escore baseado só no sangramento, e por que um paciente jovem com Forrest Ia pode ter prognóstico melhor que um octogenário cardiopata com úlcera de base limpa.',
      ],
      conduta: total <= 2
        ? [
            completo
              ? '**Baixo risco** (Rockall completo ≤ 2, mortalidade em torno de 0,2%): alta precoce é apropriada se a endoscopia mostrou lesão de baixo risco (Forrest IIc ou III), o paciente está hemodinamicamente estável, tolera via oral, tem hemoglobina estável e suporte domiciliar com retorno garantido.'
              : '**Pré-endoscópico baixo**: para a decisão de alta sem endoscopia, o instrumento validado é o **Blatchford** — um escore de 0 identifica risco muito baixo de necessidade de intervenção. O Rockall pré-endoscópico isolado tem desempenho inferior para essa finalidade.',
            'Inibidor de bomba de prótons por via oral em dose padrão. Pesquise e trate **Helicobacter pylori** (teste respiratório, antígeno fecal ou histologia) — a erradicação reduz recorrência de úlcera de forma mais eficaz que a manutenção indefinida de inibidor.',
            'Revise a prescrição: suspenda ou substitua anti-inflamatório não esteroidal, reavalie a necessidade de antiagregante e de anticoagulante, e programe gastroproteção se o antiagregante for indispensável. Em úlcera associada a AAS por indicação cardiovascular firme, a conduta é reintroduzir o AAS precocemente com inibidor de bomba, não suspendê-lo em definitivo.',
            'Oriente retorno imediato diante de hematêmese, melena, tontura, síncope, dor abdominal intensa ou palidez progressiva. Programe controle de hemoglobina ambulatorial.',
          ]
        : total <= 4
          ? [
              '**Risco intermediário**: internação com monitorização, acesso venoso calibroso, tipagem sanguínea e reserva de hemocomponentes. Mantenha jejum até definir a conduta endoscópica.',
              completo
                ? 'Após terapia endoscópica em lesão de alto risco, mantenha **inibidor de bomba de prótons em infusão contínua** (80 mg em bolus seguido de 8 mg/h por 72 horas) ou em dose alta intermitente — o alvo é pH intragástrico acima de 6 de forma sustentada, que é o que inativa a pepsina e permite o coágulo amadurecer.'
                : 'Realize **endoscopia digestiva alta nas primeiras 24 horas**. Inicie inibidor de bomba de prótons em dose alta antes do exame: ele reduz a proporção de estigmas de alto risco encontrados, mas não substitui a terapia endoscópica.',
              'Transfunda com estratégia **restritiva**: alvo de hemoglobina em torno de 7 g/dL no paciente sem cardiopatia, 8 g/dL em coronariopata. Transfusão liberal na hemorragia digestiva aumenta mortalidade, sobretudo no cirrótico, por elevar a pressão portal e favorecer ressangramento.',
              'Se houver suspeita de hemorragia varicosa, acrescente **terlipressina ou octreotida** e **antibiótico profilático** (ceftriaxona), que reduz mortalidade no cirrótico independentemente da fonte do sangramento.',
              'Reavalie a hemoglobina em 6 a 12 horas e mantenha vigilância de ressangramento: recorrência de hematêmese, melena, taquicardia, queda de pressão ou queda inesperada de hemoglobina.',
            ]
          : [
              '**Alto risco.** Internação em leito monitorizado ou terapia intensiva, dois acessos venosos calibrosos, reserva de hemocomponentes e acionamento precoce da endoscopia e da equipe cirúrgica ou de radiologia intervencionista.',
              'Ressuscite com cristaloide e hemocomponentes conforme a perda, com alvo transfusional restritivo (7 g/dL, ou 8 em coronariopata) exceto em sangramento maciço em curso, em que se transfunde por protocolo e não por número. Corrija coagulopatia e plaquetopenia significativas.',
              'Reverta a anticoagulação de forma dirigida se houver sangramento maior: vitamina K com complexo protrombínico para antagonista da vitamina K, idarucizumabe para dabigatrana, andexanete alfa ou complexo protrombínico para inibidores do fator Xa. Pese contra o risco trombótico da indicação original.',
              'Endoscopia **urgente**, idealmente em até 12 horas na hemorragia grave. Em úlcera Forrest Ia, Ib ou IIa, faça terapia combinada (injeção mais método térmico ou mecânico) e mantenha inibidor de bomba de prótons em infusão contínua por 72 horas.',
              'Defina o plano de resgate **antes** de precisar dele: ressangramento após terapia endoscópica indica nova endoscopia; falha da segunda tentativa indica embolização por arteriografia ou cirurgia. Em hemorragia varicosa refratária, considere balão de tamponamento como ponte e TIPS de resgate.',
              total >= 8
                ? 'Com Rockall ≥ 8 a mortalidade se aproxima de 40%, e boa parte dela é de causa não hemorrágica — descompensação cardíaca, renal, hepática ou neoplasia. É a faixa em que discutir objetivos de cuidado com o paciente e a família faz parte do tratamento, e em que a otimização das comorbidades pesa tanto quanto a hemostasia.'
                : 'Trate agressivamente as comorbidades em paralelo: a morte na hemorragia digestiva alta vem mais da descompensação de órgão com reserva limitada que da exsanguinação.',
            ],
      alertas: [
        'O escore **pré-endoscópico isolado** tem desempenho inferior ao Blatchford para identificar quem pode ir para casa. Para triagem inicial e decisão de alta sem endoscopia, use o Blatchford; reserve o Rockall para depois do exame.',
        'Rockall prediz ressangramento e mortalidade, não necessidade de intervenção. Escore baixo em paciente com sangramento ativo visível não autoriza conduta expectante.',
        'No **cirrótico**, a estratégia muda: transfusão liberal eleva a pressão portal e favorece ressangramento, antibiótico profilático reduz mortalidade independentemente da fonte, e o prognóstico é governado pela reserva hepática (Child-Pugh, MELD) mais do que pelo escore de sangramento.',
        'Não foi derivado para hemorragia digestiva **baixa**, para sangramento em paciente anticoagulado com reversão pendente, nem para hemorragia de fonte não identificada após endoscopia normal.',
        'Hemoglobina inicial normal **não** exclui sangramento importante: a hemodiluição leva horas a se estabelecer, e no sangramento agudo o hematócrito ainda reflete o estado pré-hemorrágico.',
      ],
      tabela: {
        titulo: 'Rockall completo: mortalidade estimada',
        colunas: ['Pontos', 'Risco', 'Mortalidade', 'Conduta'],
        linhas: [
          ['0 – 2', 'Baixo', '0,2%', 'Alta precoce se lesão de baixo risco'],
          ['3 – 4', 'Intermediário', '5 – 11%', 'Internação e vigilância de ressangramento'],
          ['5 – 7', 'Alto', '17 – 27%', 'Leito monitorizado, endoscopia precoce'],
          ['8 – 11', 'Muito alto', '≈ 41%', 'UTI, plano de resgate, metas de cuidado'],
        ],
        destaque: total <= 2 ? 0 : total <= 4 ? 1 : total <= 7 ? 2 : 3,
      },
    }
  },
  formula: ['Pré-endoscópico = idade + choque + comorbidade (0 a 7)', 'Completo = pré + diagnóstico + estigmas (0 a 11)'],
  fundamento:
    'O escore foi derivado de uma auditoria nacional britânica com mais de 4 mil pacientes, cruzando variáveis clínicas e endoscópicas com desfechos. Sua estrutura em duas etapas reflete o fluxo real do atendimento: uma decisão é tomada antes da endoscopia e outra depois dela. A distribuição de pesos revela a tese central do modelo: idade e comorbidade somam até 5 dos 7 pontos pré-endoscópicos, enquanto o achado endoscópico contribui com no máximo 4 dos 11 do escore completo. Isso parece contraintuitivo até se entender de que os pacientes morrem. Na hemorragia digestiva alta, a morte raramente é por exsanguinação — ela vem da descompensação de órgãos com reserva limitada diante da anemia aguda, da hipovolemia e do estresse fisiológico somados. A queda do conteúdo arterial de oxigênio num coronariopata produz isquemia miocárdica; a hipoperfusão num rim já comprometido produz necrose tubular aguda; no cirrótico, a hipovolemia precipita encefalopatia, síndrome hepatorrenal e translocação bacteriana. O sangramento é o gatilho, e a comorbidade é o que determina se o organismo absorve o golpe. Daí o Rockall predizer mortalidade melhor que qualquer escore construído apenas sobre a magnitude do sangramento, e daí um jovem com úlcera Forrest Ia poder ter prognóstico melhor que um octogenário cardiopata com úlcera de base limpa. A dupla Rockall e Blatchford ilustra bem que escores respondem perguntas diferentes: o Blatchford, construído sobre ureia, hemoglobina, sinais vitais e comorbidade, prediz **necessidade de intervenção** e por isso serve à triagem e à decisão de alta; o Rockall prediz **ressangramento e morte** e por isso serve a definir intensidade de vigilância depois da endoscopia. Usar um no lugar do outro é a falha de aplicação mais comum dos dois.',
  armadilhas: [
    'O escore pré-endoscópico isolado tem desempenho inferior ao Blatchford para identificar quem pode ir para casa.',
    'Prediz ressangramento e mortalidade, não necessidade de intervenção — são desfechos diferentes, e é por isso que Rockall e Blatchford são complementares e não concorrentes.',
    'Idade e comorbidade somam até 5 dos 7 pontos pré-endoscópicos, de modo que um octogenário estável já parte de alto risco. Isso é intencional (a morte vem da descompensação de órgão, não da exsanguinação), mas leva ao erro oposto de internar todo idoso com melena.',
    'Hemoglobina inicial normal não exclui sangramento importante: a hemodiluição leva horas, e o hematócrito da admissão reflete o estado pré-hemorrágico.',
    'No cirrótico, transfundir liberalmente eleva a pressão portal e favorece ressangramento. O alvo é restritivo, e o antibiótico profilático reduz mortalidade independentemente da fonte.',
    'O item de estigmas exige laudo endoscópico descritivo. Laudos que registram apenas "úlcera gástrica" sem classificação de Forrest tornam o escore completo inaplicável.',
    'Não vale para hemorragia digestiva baixa nem para sangramento de fonte não identificada após endoscopia normal.',
  ],
  referencias: [
    { texto: 'Rockall TA, Logan RF, Devlin HB, Northfield TC. Risk assessment after acute upper gastrointestinal haemorrhage. Gut. 1996;38(3):316-321.' },
    { texto: 'Barkun AN, Almadi M, Kuipers EJ, et al. Management of Nonvariceal Upper Gastrointestinal Bleeding: Guideline Recommendations From the International Consensus Group. Ann Intern Med. 2019;171(11):805-822.' },
    { texto: 'Villanueva C, Colomo A, Bosch A, et al. Transfusion strategies for acute upper gastrointestinal bleeding. N Engl J Med. 2013;368(1):11-21.' },
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
        'Compreender a cascata explica por que a gravidade não se define na admissão. O evento inicial é a **ativação intra-acinar de tripsinogênio** — por obstrução ductal biliar, por efeito tóxico direto do etanol sobre o ácino, por hipertrigliceridemia com liberação de ácidos graxos livres pela lipase, ou por fármaco. A tripsina ativada prematuramente dentro da célula ativa as demais proenzimas em cascata (quimotripsinogênio, proelastase, fosfolipase A₂) e desencadeia autodigestão. A colocalização de grânulos de zimogênio com lisossomos, a sobrecarga de cálcio citosólico e a disfunção mitocondrial levam à necrose acinar, que libera padrões moleculares associados a dano (DAMPs) — DNA mitocondrial, HMGB1, ATP. Esses DAMPs ativam receptores do tipo Toll em macrófagos e disparam a resposta inflamatória sistêmica, com TNF-α, IL-1β e IL-6. É aqui que a doença deixa o pâncreas: as citocinas degradam o glicocálice endotelial e abrem as junções interendoteliais, produzindo **fuga capilar generalizada** com hipovolemia intravascular a despeito de balanço hídrico positivo, e lesão alveolar que evolui para SDRA. A elastase digere a parede vascular e causa hemorragia retroperitoneal; a fosfolipase A₂ lesa o surfactante; a lipase saponifica a gordura peripancreática consumindo cálcio, o que explica a hipocalcemia dos critérios de Ranson. Como essa cascata se desenrola ao longo de dias, nenhum escore de admissão pode fazer mais que estimar probabilidade — e é por isso que a classificação de Atlanta define gravidade **retrospectivamente**, pela disfunção orgânica que persiste além de 48 horas.',
      ],
      conduta: total >= 3
        ? [
            '**Alto risco (BISAP ≥ 3).** Leito monitorizado ou terapia intensiva, com vigilância ativa de disfunção orgânica: oximetria contínua, débito urinário horário, gasometria, função renal e hepática, cálcio, triglicerídeos e proteína C reativa seriada.',
            '**Reposição volêmica moderada, não agressiva.** O ensaio WATERFALL mudou a prática: bolus de 10 mL/kg apenas se houver hipovolemia, seguido de 1,5 mL/kg/h, com reavaliação frequente. A estratégia agressiva (20 mL/kg seguido de 3 mL/kg/h) produziu mais sobrecorga hídrica sem reduzir gravidade. Prefira **Ringer lactato** à salina 0,9%.',
            'Titule pela perfusão e não por fórmula: frequência cardíaca, pressão arterial média, débito urinário acima de 0,5 mL/kg/h, lactato e ureia. Procure ativamente sinais de sobrecarga — estertores, aumento da necessidade de oxigênio, balanço muito positivo, pressão intra-abdominal elevada.',
            '**Analgesia adequada** com opioide titulado, sem receio: a dor da pancreatite é intensa e o mito de que morfina agrava por espasmo do esfíncter de Oddi não tem sustentação clínica relevante. Dor mal controlada aumenta a resposta ao estresse e piora a evolução.',
            '**Nutrição enteral precoce**, por via oral nas primeiras 24 a 72 horas quando tolerada, ou por sonda nasogástrica ou nasojejunal se não tolerada. É superior ao jejum e à nutrição parenteral porque preserva a barreira intestinal e reduz translocação bacteriana — que é a principal via de infecção da necrose.',
            'Defina a **etiologia** já na admissão: ultrassonografia de abdome (litíase), triglicerídeos, cálcio, revisão de fármacos e história de etanol. Na pancreatite biliar com colangite ou obstrução persistente, indique **CPRE urgente**; sem colangite, programe colecistectomia na mesma internação, que reduz recorrência.',
            'Antibiótico profilático **não** está indicado na necrose estéril. Reserve antibiótico para infecção documentada ou fortemente suspeita — deterioração clínica após a segunda semana, gás na coleção, hemocultura positiva —, e nesse caso prefira drenagem percutânea escalonada (*step-up*) à necrosectomia aberta precoce.',
          ]
        : [
            '**Risco baixo (BISAP ≤ 2), mas reavalie em 24 e 48 horas.** A pancreatite é doença dinâmica e a gravidade se define pela disfunção orgânica que persiste além de 48 horas, não pelo escore da admissão. Um BISAP de 1 com SIRS persistente merece a mesma vigilância de um escore alto.',
            'Reposição volêmica **moderada** com Ringer lactato, titulada pela perfusão e pelo débito urinário. Evite a hidratação agressiva por protocolo — ela produz sobrecarga sem reduzir gravidade.',
            'Analgesia com opioide titulado e **dieta por via oral precoce**, iniciada nas primeiras 24 horas conforme tolerância, sem esperar normalização de amilase ou lipase. Dieta leve e com baixo teor de gordura é tão segura quanto a progressão lenta e encurta a internação.',
            'Investigue a etiologia antes da alta: ultrassonografia de abdome, triglicerídeos, cálcio e revisão de fármacos e de consumo de etanol. Pancreatite biliar exige **colecistectomia na mesma internação** — postergá-la expõe a recorrência com risco cumulativo alto.',
            'Monitore a proteína C reativa em 48 horas (valores acima de 150 mg/L sugerem necrose) e reavalie clinicamente a cada 12 a 24 horas. Reserve tomografia com contraste para deterioração ou dúvida diagnóstica, e preferencialmente após 72 horas, quando a necrose já se demarcou.',
            'Oriente cessação do etanol e do tabagismo, e tratamento da hipertrigliceridemia quando for a causa. Recorrência é comum e evitável quando a etiologia é tratada.',
          ],
      alertas: [
        'Nenhum escore de admissão define gravidade na pancreatite. A classificação de **Atlanta revisada** define retrospectivamente, pela disfunção orgânica que persiste além de 48 horas — reavalie sempre em 24 e 48 horas.',
        'Amilase e lipase **não têm valor prognóstico**: o grau de elevação não se correlaciona com gravidade, e a normalização não indica resolução nem autoriza progressão de dieta.',
        'Hidratação agressiva por protocolo é dano. O WATERFALL demonstrou mais sobrecarga sem benefício — titule pela perfusão, com Ringer lactato, em estratégia moderada.',
        'Antibiótico profilático na necrose estéril não reduz mortalidade e seleciona resistência e infecção fúngica. Reserve para infecção documentada ou fortemente suspeita.',
        'Tomografia com contraste nas primeiras 72 horas subestima a necrose, que leva dias para se demarcar, e não muda a conduta inicial — além de expor a nefrotoxicidade num paciente frequentemente hipovolêmico.',
        'Na pancreatite biliar, CPRE urgente só está indicada com colangite ou obstrução biliar persistente. Fora disso, CPRE de rotina não melhora desfecho e acrescenta risco de agravar a pancreatite.',
      ],
      tabela: {
        titulo: 'BISAP: itens e mortalidade estimada',
        colunas: ['Pontos', 'Risco', 'Mortalidade aproximada', 'Conduta'],
        linhas: [
          ['0 – 1', 'Baixo', '< 1%', 'Enfermaria, dieta oral precoce, reavaliar em 24 e 48 h'],
          ['2', 'Intermediário', '≈ 2%', 'Enfermaria com vigilância estreita'],
          ['3', 'Alto', '5 – 8%', 'Leito monitorizado, vigiar disfunção orgânica'],
          ['4 – 5', 'Muito alto', '> 20%', 'UTI, considerar centro de referência'],
        ],
        destaque: total <= 1 ? 0 : total === 2 ? 1 : total === 3 ? 2 : 3,
      },
    }
  },
  formula: ['B UN > 25 | I mpaired mental status | S IRS | A ge > 60 | P leural effusion'],
  fundamento:
    'O BISAP foi derivado de uma base com mais de 17 mil casos, buscando o menor conjunto de variáveis de primeiras 24 horas capaz de prever mortalidade. Cada item representa uma dimensão: azotemia (perfusão e prognóstico renal), estado mental (gravidade sistêmica), SIRS (resposta inflamatória), idade (reserva) e derrame pleural (extensão da inflamação retroperitoneal). O BISAP foi desenhado para ser calculável nas **primeiras 24 horas** com cinco variáveis de rotina, superando a principal limitação do Ranson, que exige 48 horas e portanto chega tarde para decidir o nível de cuidado. Cada item corresponde a uma falência em curso: ureia à hipoperfusão renal, estado mental à encefalopatia da resposta inflamatória sistêmica, os critérios de SIRS à própria cascata de citocinas, o derrame pleural ao extravasamento capilar, e a idade à reserva fisiológica.',
  armadilhas: [
    'Nenhum escore substitui a reavaliação seriada. A pancreatite grave se define retrospectivamente, pela disfunção orgânica que **persiste** além de 48 horas.',
    'Tomografia com contraste nas primeiras 72 horas frequentemente subestima a necrose, que leva dias para se demarcar — e não muda a conduta inicial.',
    'Amilase e lipase não entram no escore e não têm valor prognóstico. Usar o grau de elevação para estimar gravidade ou para liberar dieta é erro frequente.',
    'O item de SIRS exige os critérios completos, incluindo leucograma. Aplicá-lo apenas com sinais vitais subestima e derruba o escore em um ponto.',
    'Derrame pleural é item radiológico e depende de radiografia de tórax ter sido feita. Sem ela, o escore fica incompleto e é sistematicamente subestimado.',
    'BISAP baixo com SIRS persistente às 48 horas não é risco baixo. A persistência da resposta inflamatória prediz melhor que o escore da admissão.',
    'O escore não orienta volume de hidratação. Depois do WATERFALL, a estratégia é moderada e titulada pela perfusão, independentemente da pontuação.',
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
    campoSimNao('idade', 'Idade acima do corte (55 anos se não biliar, 70 se biliar)', 1, 'Critério de ADMISSÃO. O corte é mais alto na biliar porque essa etiologia acomete população mais idosa de base.'),
    campoSimNao('leuco', 'Leucócitos acima do corte (16.000 se não biliar, 18.000 se biliar)', 1, 'Critério de ADMISSÃO. Mede a intensidade da resposta inflamatória inicial, não infecção — antibiótico não está indicado por leucocitose na pancreatite.'),
    campoSimNao('glicose', 'Glicose acima do corte (200 mg/dL se não biliar, 220 se biliar)', 1, 'Critério de ADMISSÃO. Reflete lesão de ilhotas pancreáticas somada à resposta ao estresse com cortisol e catecolaminas.'),
    campoSimNao('ldh', 'LDH acima do corte (350 U/L se não biliar, 400 se biliar)', 1, 'Critério de ADMISSÃO. Marcador inespecífico de necrose celular — quanto mais tecido lisado, mais LDH extravasa.'),
    campoSimNao('ast', 'AST acima do corte (250 U/L em ambos)', 1, 'Critério de ADMISSÃO. Único item com corte igual nas duas etiologias. AST muito alta na pancreatite biliar sugere passagem recente de cálculo.'),
    campoSimNao('ht', 'Queda do hematócrito > 10%', 1, 'Critério de 48 HORAS. A queda reflete hemodiluição pela ressuscitação somada a extravasamento para o terceiro espaço — é marcador de fuga capilar, não de sangramento.'),
    campoSimNao('bun', 'Aumento da ureia > 10,7 mg/dL (BUN > 5 mg/dL) se não biliar, ou > 2 mg/dL se biliar', 1),
    campoSimNao('calcio', 'Cálcio < 8 mg/dL', 1, 'Critério de 48 HORAS. A hipocalcemia vem da saponificação da gordura peripancreática pelas lipases, que consome cálcio. Corrija pela albumina antes de pontuar — hipoalbuminemia reduz o cálcio total sem reduzir o ionizado.'),
    campoSimNao('pao2', 'PaO₂ < 60 mmHg (apenas na não biliar)', 1, 'Critério de 48 HORAS, exclusivo da etiologia não biliar. Reflete lesão alveolar pela fosfolipase A2, que degrada o surfactante — é o início da SDRA da pancreatite.'),
    campoSimNao('be', 'Déficit de base > 4 mEq/L (não biliar) ou > 5 (biliar)', 1),
    campoSimNao('fluidos', 'Sequestro de fluidos > 6 L (não biliar) ou > 4 L (biliar)', 1, 'Critério de 48 HORAS. Calculado como balanço hídrico acumulado (entradas menos saídas) nas 48 h. Depende de registro rigoroso de balanço, que é a parte mais frágil do escore na prática.'),
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
        'O valor didático do Ranson está em como ele separa, no tempo, duas fases distintas da doença. Os cinco critérios de **admissão** medem a intensidade da agressão local: leucocitose e LDH refletem lise celular e resposta inflamatória, hiperglicemia reflete lesão das ilhotas somada ao cortisol e às catecolaminas do estresse, e AST elevada sugere passagem recente de cálculo na etiologia biliar. Os seis critérios de **48 horas** medem outra coisa: a consequência sistêmica da cascata que se desenrolou nesse intervalo. A tripsina ativada prematuramente dentro do ácino ativa fosfolipase A₂, elastase e lipase; a necrose acinar libera DAMPs que acionam receptores do tipo Toll em macrófagos, gerando TNF-α, IL-1β e IL-6. Essas citocinas degradam o glicocálice endotelial e abrem junções interendoteliais, e o resultado aparece exatamente nos itens de 48 horas — queda do hematócrito e sequestro de fluidos são a **fuga capilar** medida de duas formas, hipocalcemia é a saponificação da gordura peripancreática pelas lipases consumindo cálcio, azotemia é hipoperfusão renal por hipovolemia intravascular a despeito de balanço positivo, hipoxemia é a fosfolipase A₂ degradando surfactante, e o déficit de base é a hipoperfusão tecidual global. Ler o escore por fase, e não como soma, é o que ainda o torna útil.',
      ],
      conduta: [
        admissao + h48 >= 3
          ? `**Três ou mais critérios indicam pancreatite grave** (mortalidade que sobe de cerca de 1% com 0 a 2 critérios para 15 a 20% com 3 a 4 e acima de 40% com 6 ou mais). Leito monitorizado ou terapia intensiva, com vigilância ativa de disfunção orgânica: oximetria contínua, débito urinário horário, gasometria, função renal, cálcio e proteína C reativa seriada.`
          : 'Menos de 3 critérios sugere curso leve, **mas o escore só fica completo em 48 horas** — e a gravidade se define pela disfunção orgânica que persiste além desse prazo, pela classificação de Atlanta revisada. Reavalie clinicamente a cada 12 a 24 horas.',
        'Na prática, **prefira o BISAP ou a persistência de SIRS** para a decisão de admissão: eles usam variáveis disponíveis nas primeiras 24 horas e têm desempenho discriminativo comparável. O Ranson fica como referência conceitual e para comparação com séries históricas.',
        '**Reposição volêmica moderada com Ringer lactato**, titulada pela perfusão: bolus de 10 mL/kg apenas se houver hipovolemia, seguido de 1,5 mL/kg/h. O ensaio WATERFALL demonstrou que a estratégia agressiva produz mais sobrecarga sem reduzir gravidade. Monitore débito urinário acima de 0,5 mL/kg/h, lactato e sinais de congestão.',
        'Analgesia com opioide titulado e **nutrição enteral precoce** — via oral nas primeiras 24 a 72 horas conforme tolerância, ou por sonda se não tolerada. Não aguarde normalização de amilase e lipase, que não têm valor prognóstico nem definem tolerância a dieta.',
        'Defina a **etiologia** na admissão: ultrassonografia de abdome, triglicerídeos, cálcio, revisão de fármacos e de etanol. Pancreatite biliar com colangite ou obstrução persistente indica CPRE urgente; sem colangite, programe colecistectomia na mesma internação para evitar recorrência.',
        'Antibiótico profilático **não** está indicado na necrose estéril. Reserve-o para infecção documentada ou fortemente suspeita — deterioração após a segunda semana, gás em coleção, hemocultura positiva — e prefira a abordagem escalonada de drenagem percutânea à necrosectomia aberta precoce.',
        'Corrija o cálcio **pela albumina** antes de pontuar o item: hipoalbuminemia reduz o cálcio total sem reduzir o ionizado, e tratar essa pseudo-hipocalcemia com cálcio intravenoso é intervenção sem indicação.',
      ],
      alertas: [
        'O escore **só fica completo em 48 horas**, quando a maior parte das decisões críticas já foi tomada. Para a admissão, use BISAP ou a persistência de SIRS.',
        'Amilase e lipase não entram no escore e **não têm valor prognóstico**. O grau de elevação não se correlaciona com gravidade e a normalização não autoriza progressão de dieta.',
        'Existem **duas listas de cortes** (biliar e não biliar) e elas são frequentemente confundidas. Na etiologia biliar há 10 critérios (sem a PaO₂) e não 11 — confira a etiologia antes de somar.',
        'O item de sequestro de fluidos depende de balanço hídrico acumulado rigorosamente registrado, o que raramente acontece fora da terapia intensiva. Balanço mal anotado subestima o escore.',
        'Foi derivado em 1974 a partir de 100 pacientes com pancreatite alcoólica, antes da tomografia moderna e da ressuscitação atual. Sua calibração para a prática contemporânea é limitada.',
        'Nenhum escore substitui a reavaliação seriada. A pancreatite grave se define retrospectivamente, pela disfunção orgânica que persiste além de 48 horas.',
      ],
      tabela: {
        titulo: 'Critérios por fase e o que cada grupo mede',
        colunas: ['Fase', 'Critérios', 'O que medem'],
        linhas: [
          ['Admissão', 'Idade, leucócitos, glicose, LDH, AST', 'Intensidade da agressão local e da resposta inicial'],
          ['48 horas', 'Queda do hematócrito, sequestro de fluidos', 'Fuga capilar por degradação do glicocálice'],
          ['48 horas', 'Cálcio baixo', 'Saponificação da gordura pelas lipases'],
          ['48 horas', 'Ureia, déficit de base', 'Hipoperfusão renal e tecidual global'],
          ['48 horas', 'PaO₂ (só na não biliar)', 'Fosfolipase A₂ degradando surfactante'],
        ],
        destaque: h48 > 0 ? 1 : 0,
      },
    }
  },
  formula: ['5 critérios na admissão + 6 critérios em 48 h', 'Pontos de corte diferem entre pancreatite biliar e não biliar'],
  fundamento:
    'Ranson publicou os critérios em 1974, a partir da análise de 100 pacientes com pancreatite alcoólica. Foi o primeiro escore prognóstico da doença e organizou a compreensão fisiopatológica: a pancreatite grave é uma síndrome inflamatória sistêmica com extravasamento capilar, não uma doença localizada no pâncreas. Os critérios se dividem em dois momentos por uma razão fisiopatológica: os **da admissão** refletem a magnitude da inflamação inicial e da lise celular (leucócitos, glicose por comprometimento das ilhotas, desidrogenase láctica e transaminases pela necrose), enquanto os **das 48 horas** refletem as consequências sistêmicas — sequestro de líquido para o retroperitônio e para o terceiro espaço, queda do hematócrito, hipocalcemia por saponificação da gordura peripancreática pelos ácidos graxos livres, e hipoxemia por lesão pulmonar aguda.',
  armadilhas: [
    'Amilase e lipase **não** entram no escore e não têm valor prognóstico — o grau de elevação não se correlaciona com a gravidade.',
    'Duas listas de pontos de corte circulam (biliar e não biliar) e são frequentemente confundidas. Na biliar há 10 critérios, não 11 — a PaO₂ não entra.',
    'Só fica completo em 48 horas, quando as decisões críticas já foram tomadas. Para estratificar na admissão, o BISAP resolve com cinco variáveis disponíveis de imediato.',
    'O cálcio deve ser corrigido pela albumina antes de pontuar: hipoalbuminemia reduz o cálcio total sem reduzir o ionizado, gerando falso-positivo.',
    'O item de sequestro de fluidos exige balanço hídrico acumulado bem registrado, o que é raro fora da terapia intensiva — e balanço mal anotado subestima o escore.',
    'Derivado em 1974 sobre 100 pacientes com pancreatite alcoólica, antes da tomografia moderna e da ressuscitação atual. A calibração contemporânea é limitada.',
  ],
  referencias: [
    { texto: 'Ranson JH, Rifkind KM, Roses DF, et al. Prognostic signs and the role of operative management in acute pancreatitis. Surg Gynecol Obstet. 1974;139(1):69-81.' },
    { texto: 'Banks PA, Bollen TL, Dervenis C, et al. Classification of acute pancreatitis 2012: revision of the Atlanta classification and definitions by international consensus. Gut. 2013;62(1):102-111.' },
    { texto: 'de-Madaria E, Buxbaum JL, Maisonneuve P, et al. Aggressive or moderate fluid resuscitation in acute pancreatitis (WATERFALL). N Engl J Med. 2022;387(11):989-1000.' },
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
      conduta: [
        '**Pancreatite leve** (sem falência orgânica nem complicação local): a conduta é **hidratação com Ringer lactato, analgesia e dieta oral precoce**. Ringer lactato reduz a síndrome inflamatória em comparação com salina, e reintroduzir dieta em 24–48 h — mesmo com dor residual ou amilase elevada — encurta a internação. Jejum prolongado não tem respaldo.',
        '**Pancreatite moderadamente grave** (falência orgânica transitória, menor que 48 h, ou complicação local): interne em leito monitorado, mantenha reposição volêmica guiada por diurese, ureia e hematócrito, e programe tomografia com contraste a partir do **3º ao 5º dia** — antes disso a necrose ainda não se delimita e a imagem subestima.',
        '**Pancreatite grave** (falência orgânica persistente por mais de 48 h): UTI, suporte orgânico e **nutrição enteral por sonda**, preferível à parenteral por preservar a barreira intestinal e reduzir infecção e mortalidade. Antibiótico profilático **não** está indicado na necrose estéril.',
        'Determine a **etiologia** desde a admissão, porque ela muda a conduta imediata: litíase biliar (a mais comum) exige **colangiopancreatografia retrógrada urgente se houver colangite**, e **colecistectomia na mesma internação** na forma leve, para evitar recidiva; álcool exige abordagem da dependência; hipertrigliceridemia acima de 1.000 mg/dL exige insulina, jejum e às vezes plasmaférese.',
        'Na suspeita de **necrose infectada** (deterioração clínica a partir da 2ª a 4ª semana, gás na coleção à tomografia), inicie antibiótico com penetração pancreática (carbapenêmico) e adote a estratégia **step-up**: drenagem percutânea ou endoscópica primeiro, necrosectomia minimamente invasiva depois, e cirurgia aberta apenas em falha. O adiamento da intervenção para além de 4 semanas, quando possível, reduz mortalidade.',
      ],
      alertas: [
        'A classificação só é definitiva **após 48 horas**: falência orgânica transitória e persistente só se distinguem retrospectivamente, e classificar na admissão subestima a gravidade.',
        'Tomografia com contraste antes do 3º ao 5º dia subestima a necrose, que ainda não se delimitou. Pedir cedo demais gera falsa tranquilidade.',
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
    'A revisão de Atlanta, publicada em 2013 após consenso internacional, substituiu a classificação de 1992 por dois motivos: a definição antiga de gravidade era baseada em escores prognósticos, não em desfechos observados, e a nomenclatura das coleções era ambígua. A nova classificação ancorou a gravidade na disfunção orgânica real e sua persistência — o que se mostrou muito mais preditivo. A revisão de 2012 substituiu a classificação por gravidade presumida pela classificação por **falência orgânica documentada**, porque os desfechos mostraram que o que mata na pancreatite não é a extensão da necrose em si, e sim a resposta inflamatória sistêmica e a infecção secundária. A distinção entre falência transitória e persistente às 48 horas separa dois grupos com mortalidade muito diferente, e as coleções foram redefinidas por tempo e conteúdo porque o momento da intervenção — depois de 4 semanas, com a parede madura — determina o resultado.',
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
      conduta: [
        '**FIB-4 < 1,3** (ou < 2,0 acima de 65 anos): fibrose avançada é improvável. Encerre a investigação hepática específica e concentre o cuidado nos fatores metabólicos — peso, controle glicêmico, lipídios, pressão. Repita o cálculo a cada 1 a 3 anos conforme o risco.',
        '**FIB-4 entre 1,3 e 2,67**: zona indeterminada, que abrange cerca de 30% dos pacientes. Prossiga com **elastografia hepática transitória** ou teste sorológico proprietário (ELF) — é exatamente aqui que o segundo teste muda a conduta. Rigidez < 8 kPa afasta fibrose avançada; > 12 kPa a torna provável.',
        '**FIB-4 > 2,67**: fibrose avançada provável. Encaminhe ao hepatologista, faça rastreio de **varizes esofágicas** (endoscopia, ou critérios de Baveno para dispensá-la) e inicie **vigilância de carcinoma hepatocelular** com ultrassonografia semestral se houver cirrose.',
        'Use o APRI como alternativa quando faltar GGT ou plaquetas em série histórica, mas saiba que ele tem desempenho inferior ao FIB-4 para fibrose avançada na doença hepática metabólica. Nenhum dos dois é validado para **monitorar resposta ao tratamento** — para isso use elastografia seriada.',
        'Lembre das causas de **resultado falsamente alterado**: a idade entra no numerador e infla o FIB-4 em idosos; plaquetopenia por outra causa (hiperesplenismo, doença hematológica, medicamento) eleva o índice; e hepatite aguda com transaminases muito altas distorce ambos os escores. Em qualquer dessas situações, o índice não deve decidir sozinho.',
      ],
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
    campoSimNao('diabetes', 'Diabetes ou glicemia de jejum alterada', 1, 'Inclui glicemia de jejum alterada, não apenas diabetes estabelecido. É o item de maior coeficiente da fórmula (1,13) — omiti-lo subestima o escore de forma importante.'),
    campoNum('ast', 'AST (TGO)', { unidade: 'U/L', min: 5, max: 500, passo: 1, ajuda: 'Enzima mitocondrial, concentrada na zona centrolobular. Entra na razão AST/ALT, cuja inversão (acima de 1) sinaliza perda de massa hepatocitária funcional.' }),
    campoNum('alt', 'ALT (TGP)', { unidade: 'U/L', min: 5, max: 500, passo: 1, ajuda: 'Enzima citosólica, mais abundante no hepatócito periportal. Cai mais que a AST na fibrose avançada, o que inverte a razão — ALT normal não exclui doença avançada.' }),
    campoNum('plaquetas', 'Plaquetas', { unidade: '×10⁹/L', min: 10, max: 800, passo: 1, ajuda: 'Em ×10⁹/L (250.000/mm³ são 250 aqui). A queda reflete sequestro esplênico por hipertensão portal somado à menor produção hepática de trombopoetina — descarte antes causas hematológicas e medicamentosas.' }),
    campoNum('albumina', 'Albumina', { unidade: 'g/dL', min: 1, max: 6, passo: 0.1, ajuda: 'Marcador de capacidade sintética hepática. Descarte antes perda renal (síndrome nefrótica), enteropatia perdedora de proteína e desnutrição, que reduzem a albumina sem qualquer fibrose.' }),
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
        'Por que **plaquetas e albumina** aparecem num escore de fibrose, e com sinal negativo, é a parte mais informativa da fórmula. As duas são consequências indiretas da fibrose já avançada. A **plaquetopenia** tem tripla origem: a hipertensão portal produz esplenomegalia congestiva com sequestro plaquetário; o fígado fibrótico produz menos **trombopoetina**, que é o principal regulador da produção megacariocítica; e há componente de destruição imune e de supressão medular. A **hipoalbuminemia** reflete perda de capacidade sintética hepatocitária somada a redistribuição para o terceiro espaço pela hipoalbuminemia inflamatória. Já a **relação AST/ALT** invertida (acima de 1) é um dos sinais mais elegantes da hepatologia: no fígado normal a ALT é predominantemente citosólica e mais abundante no hepatócito periportal, enquanto a AST é mitocondrial e mais concentrada na zona centrolobular; com a progressão da fibrose, a depleção de piridoxina e a perda de massa hepatocitária funcional reduzem a ALT mais que a AST, e a razão se inverte. Ou seja, o escore não mede fibrose diretamente — ele mede as **pegadas fisiológicas** que a fibrose avançada deixa. Isso explica sua limitação principal: ele discrimina bem os extremos e deixa cerca de um quarto dos pacientes na zona indeterminada, porque a fibrose intermediária ainda não produziu pegadas mensuráveis.',
        'A cascata que gera a fibrose parte da lipotoxicidade. Quando a capacidade de esterificar ácidos graxos em triglicerídeo é excedida, acumulam-se diacilglicerol, ceramidas e ácidos graxos saturados, que provocam estresse de retículo endoplasmático e disfunção mitocondrial com espécies reativas de oxigênio. O hepatócito lesado libera corpos apoptóticos e sinais que ativam a **célula estrelada hepática** — via TGF-β, PDGF e sinalização de receptores Toll ativados por produtos bacterianos translocados do intestino. A célula estrelada se transdiferencia em miofibroblasto e deposita colágeno tipos I e III no espaço de Disse, processo inicialmente perissinusoidal e que progride para septos em ponte e cirrose. É essa arquitetura alterada que aumenta a resistência ao fluxo portal e fecha o círculo com hipertensão portal, plaquetopenia e queda de síntese.',
      ],
      conduta: nfs > 0.676
        ? [
            '**Fibrose avançada provável** (valor preditivo positivo em torno de 80%). Confirme com **elastografia hepática** (FibroScan, elastografia por ressonância ou ARFI) e encaminhe ao hepatologista. Reserve a biópsia para os casos em que os métodos não invasivos discordam ou há suspeita de etiologia concomitante.',
            'Rastreie as complicações da doença hepática avançada, que passam a valer independentemente de cirrose estabelecida: **carcinoma hepatocelular** com ultrassonografia semestral (com ou sem alfafetoproteína) e **varizes esofágicas** por endoscopia, aplicando os critérios de Baveno VII para decidir quem pode dispensar o exame.',
            'Trate a doença de base com a intervenção de maior efeito: **perda de 7 a 10% do peso corporal**, que reverte esteato-hepatite em boa parte dos casos e pode regredir fibrose. Perda acima de 10% tem efeito ainda maior sobre a fibrose.',
            'Considere farmacoterapia dirigida: **agonistas de GLP-1** (semaglutida) com benefício histológico demonstrado, **resmetirom** (agonista tireoidiano hepático seletivo) aprovado para esteato-hepatite com fibrose F2-F3, além de pioglitazona e inibidores de SGLT2 como opções no diabético. Cirurgia bariátrica é alternativa eficaz na obesidade grave.',
            'Otimize o risco **cardiovascular**, que é a principal causa de morte nesta população — mais que a hepática: estatina (segura na doença hepática gordurosa e frequentemente subprescrita por receio infundado), controle pressórico, controle glicêmico e cessação do tabagismo.',
            'Elimine cofatores de progressão: cessação completa de **álcool**, vacinação para hepatites A e B, rastreio de hepatites virais e de hemocromatose, e revisão de fármacos hepatotóxicos.',
          ]
        : nfs < -1.455
          ? [
              '**Fibrose avançada improvável** (valor preditivo negativo de 88 a 93%). Não há indicação de elastografia nem de encaminhamento imediato ao hepatologista. Atenção ao ajuste etário: em pessoas com **65 anos ou mais**, o corte inferior perde especificidade e passa a ser −0,12.',
              'O foco passa a ser **metabólico e cardiovascular**: perda de peso de 7 a 10% por dieta e atividade física, controle de diabetes, dislipidemia e hipertensão. A principal causa de morte nesta população é cardiovascular, não hepática — calcule o risco em 10 anos e trate conforme a diretriz.',
              'Prescreva estatina quando indicada pelo risco cardiovascular. Ela é **segura** na doença hepática gordurosa, inclusive com transaminases moderadamente elevadas, e é sistematicamente subprescrita por receio infundado de hepatotoxicidade.',
              'Reavalie o escore a cada 1 a 3 anos, ou antes se houver ganho de peso, piora do controle glicêmico ou elevação de transaminases. Fibrose progride ao longo de anos, e um resultado tranquilizador hoje não dispensa vigilância.',
              'Cessação de álcool e vacinação para hepatites A e B reduzem a chance de progressão por cofator somado.',
            ]
          : [
              '**Zona indeterminada**, que abrange cerca de um quarto dos pacientes — resultado esperado e não falha do exame. O próximo passo é **elastografia hepática**, que resolve a maioria desses casos: valores abaixo de 8 kPa tornam fibrose avançada improvável, acima de 12 a 15 kPa a tornam provável.',
              'Aplique também o **FIB-4** como segundo índice: a concordância entre dois escores aumenta a confiança, e a discordância reforça a indicação de elastografia. Se ambos ficarem indeterminados e a elastografia não estiver disponível ou for inconclusiva (obesidade grave, ascite), considere ELF ou biópsia.',
              'Enquanto a estratificação não fecha, trate como doença metabólica ativa: perda de 7 a 10% do peso, controle glicêmico e lipídico, cessação de álcool, otimização cardiovascular e vacinação para hepatites A e B.',
              'Reavalie em 6 a 12 meses. A trajetória do escore ao longo do tempo, num paciente cujo peso e controle metabólico mudaram, informa mais que um valor isolado na zona cinzenta.',
            ],
      alertas: [
        'O corte inferior perde especificidade **acima dos 65 anos** — use −0,12 nessa faixa. Aplicar −1,455 no idoso gera excesso de falso-negativo, porque a idade entra na fórmula com coeficiente positivo.',
        'O escore mede as pegadas fisiológicas da fibrose avançada (plaquetopenia, hipoalbuminemia, razão AST/ALT invertida), não a fibrose em si. Qualquer outra causa dessas alterações distorce o resultado: plaquetopenia imune ou medicamentosa, hipoalbuminemia por síndrome nefrótica, enteropatia perdedora de proteína ou desnutrição.',
        'Não se aplica a hepatopatia de outra etiologia. Em hepatite viral, doença alcoólica, autoimune ou colestática, use os índices e cortes próprios daquela doença.',
        'Fibrose avançada provável **não** equivale a cirrose, mas já exige rastreio de carcinoma hepatocelular e de varizes. Aguardar a cirrose estabelecida para iniciar vigilância perde a janela.',
        'A nomenclatura mudou: NAFLD passou a MASLD, com critério **positivo** de disfunção cardiometabólica em vez de exclusão de álcool. Existe também a categoria MetALD, para consumo de álcool intermediário — o que muda a investigação e a orientação.',
      ],
      tabela: {
        titulo: 'Cortes, desempenho e próximo passo',
        colunas: ['NFS', 'Interpretação', 'Desempenho', 'Próximo passo'],
        linhas: [
          ['< −1,455 (< −0,12 se ≥ 65 anos)', 'Fibrose avançada improvável', 'VPN 88 – 93%', 'Manejo metabólico e cardiovascular'],
          ['−1,455 a 0,676', 'Indeterminado (≈ 25% dos casos)', '—', 'Elastografia; somar FIB-4'],
          ['> 0,676', 'Fibrose avançada provável', 'VPP ≈ 80%', 'Elastografia, hepatologista, rastreio de CHC e varizes'],
        ],
        destaque: nfs < -1.455 ? 0 : nfs > 0.676 ? 2 : 1,
      },
    }
  },
  formula: ['NFS = −1,675 + 0,037×idade + 0,094×IMC + 1,13×(DM ou glicemia alterada) + 0,99×(AST/ALT) − 0,013×plaquetas − 0,66×albumina'],
  fundamento:
    'O escore foi derivado e validado em mais de 700 pacientes com doença hepática gordurosa comprovada por biópsia. As variáveis escolhidas cobrem risco metabólico (idade, IMC, diabetes), lesão hepatocelular relativa (relação AST/ALT) e consequências da hipertensão portal e da falência sintética (plaquetas, albumina). O ponto conceitual central é que nenhuma dessas variáveis mede fibrose diretamente — todas medem **pegadas** que a fibrose avançada deixa na fisiologia. A plaquetopenia tem tripla origem: esplenomegalia congestiva por hipertensão portal com sequestro plaquetário, produção hepática reduzida de trombopoetina (o principal regulador da megacariopoiese) e componentes de destruição imune. A hipoalbuminemia reflete queda da capacidade sintética hepatocitária somada ao componente inflamatório. E a inversão da relação AST/ALT decorre de uma assimetria histológica elegante: a ALT é predominantemente citosólica e mais abundante no hepatócito periportal, enquanto a AST é mitocondrial e concentrada na zona centrolobular, de modo que a perda de massa funcional e a depleção de piridoxina que acompanham a fibrose avançada reduzem a ALT mais que a AST. Compreender isso explica tanto a força quanto o limite do escore: ele discrimina bem os extremos e deixa cerca de um quarto dos pacientes indeterminados, porque a fibrose intermediária ainda não produziu pegadas mensuráveis. Explica também por que ele é específico para esta doença e não transferível: IMC e diabetes entram com peso alto (o coeficiente do diabetes é 1,13, o maior da fórmula) porque são determinantes de progressão na esteato-hepatite metabólica, e não em hepatite viral ou autoimune. Por fim, a razão de todo esse esforço se concentrar em fibrose, e não em gordura ou inflamação, é que a fibrose é o único preditor consistente de desfecho hepático e de mortalidade global nesta doença — a esteatose isolada tem prognóstico hepático essencialmente benigno.',
  armadilhas: [
    'A zona indeterminada abrange cerca de um quarto dos pacientes. Nela, a elastografia é o próximo passo.',
    'O corte inferior perde especificidade acima dos 65 anos; use −0,12 nessa faixa.',
    'Mede pegadas da fibrose, não a fibrose. Plaquetopenia imune ou medicamentosa, hipoalbuminemia por síndrome nefrótica, enteropatia perdedora de proteína ou desnutrição distorcem o resultado sem qualquer fibrose.',
    'Não é transferível a outras hepatopatias. Em hepatite viral, doença alcoólica, autoimune ou colestática, IMC e diabetes não têm o mesmo peso e os cortes não valem.',
    'Fibrose avançada provável não é cirrose, mas já indica rastreio de carcinoma hepatocelular e avaliação de varizes. Esperar a cirrose estabelecida perde a janela de vigilância.',
    'O item de diabetes inclui glicemia de jejum alterada, não apenas diabetes estabelecido — e é o coeficiente de maior peso da fórmula. Omiti-lo subestima de forma importante.',
    'Estatina é segura nesta doença e frequentemente é suspensa por receio infundado. A principal causa de morte na doença hepática gordurosa é cardiovascular, não hepática.',
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
    campoNum('tg', 'Triglicerídeos', { unidade: 'mg/dL', min: 20, max: 2000, passo: 1, ajuda: 'Em jejum de 12 horas. Variam muito com álcool recente, controle glicêmico e a própria refeição — um valor limítrofe merece repetição antes de decidir.' }),
    campoNum('ggt', 'Gama-glutamil transferase', { unidade: 'U/L', min: 5, max: 2000, passo: 1, ajuda: 'Marcador precoce de estresse oxidativo hepático: sua expressão sobe com a depleção de glutationa, antes de as transaminases se elevarem. Cuidado — álcool, anticonvulsivante, colestase e obesidade elevam a gama-GT e inflam o índice sem esteatose.' }),
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
      conduta: [
        '**FLI < 30**: esteatose é improvável (valor preditivo negativo alto). Não é necessário prosseguir com imagem hepática; foque na prevenção cardiometabólica.',
        '**FLI ≥ 60**: esteatose provável. Confirme com **ultrassonografia** e, mais importante, passe imediatamente ao **estadiamento de fibrose com FIB-4** — o que determina prognóstico na doença hepática esteatótica é a fibrose, não a quantidade de gordura. Um paciente com esteatose sem fibrose tem prognóstico hepático benigno.',
        'Independentemente do valor, aplique a intervenção que funciona: **perda de peso**. Uma redução de 5% do peso melhora a esteatose, 7–10% resolve a esteato-hepatite e ≥ 10% pode regredir fibrose. Combine restrição calórica, atividade física (com benefício mesmo sem perda de peso) e redução de frutose e álcool.',
        'Considere farmacoterapia quando houver esteato-hepatite com fibrose: **resmetirom** (aprovado especificamente para essa indicação), **agonistas de GLP-1** como semaglutida ou tirzepatida quando houver obesidade ou diabetes tipo 2, **pioglitazona** em diabetes tipo 2, e vitamina E em não diabéticos selecionados. Cirurgia bariátrica é a intervenção com maior efeito em obesidade grave.',
        'Não pare no fígado: a principal causa de morte na doença hepática esteatótica associada à disfunção metabólica é **cardiovascular**, não hepática. Rastreie e trate hipertensão, dislipidemia, diabetes e apneia do sono — a estatina é segura nesses pacientes e frequentemente subprescrita por receio infundado de hepatotoxicidade.',
      ],
      alertas: [
        'O que determina prognóstico na doença hepática esteatótica é a **fibrose**, não a quantidade de gordura. Um FLI alto sem fibrose tem prognóstico hepático benigno — sempre siga para o FIB-4.',
        'A principal causa de morte nesses pacientes é cardiovascular, não hepática. A estatina é segura aqui e é frequentemente omitida por receio infundado de hepatotoxicidade.',
      ],
      interpretacao: [
        'O índice foi derivado contra ultrassonografia numa coorte italiana de mais de 500 pessoas e é usado sobretudo em estudos epidemiológicos e em rastreio populacional, onde imagem para todos é inviável.',
        'A esteatose por si só tem prognóstico hepático benigno. O que muda o desfecho é a **fibrose** — por isso, um FLI alto deve ser seguido de estadiamento com FIB-4 e, se necessário, elastografia. Detectar gordura sem estadiar fibrose gera ansiedade sem benefício.',
        'A circunferência da cintura entra na fórmula porque a gordura **visceral**, e não a subcutânea, é a metabolicamente ativa: ela drena diretamente para a veia porta, expondo o fígado a ácidos graxos livres e a citocinas inflamatórias.',
        'O mecanismo que liga cintura a fígado gorduroso é a **hipótese portal**. O tecido adiposo visceral drena pela circulação porta, de modo que tudo o que ele libera chega ao fígado em primeira passagem e em concentração muito maior do que na circulação sistêmica. Esse adipócito visceral é resistente à insulina e tem lipólise acelerada, entregando ao hepatócito um fluxo contínuo de ácidos graxos livres; e é também um órgão endócrino inflamado, secretando TNF-α, IL-6, resistina e menos adiponectina. No hepatócito, o excesso de ácidos graxos livres e a hiperinsulinemia ativam os fatores de transcrição SREBP-1c e ChREBP, que aumentam a lipogênese *de novo*, enquanto a resistência insulínica reduz a betaoxidação — entrada alta e saída baixa produzem acúmulo de triglicerídeos. A **gama-GT** entra na fórmula por ser um marcador precoce desse estresse: sua expressão sobe em resposta à depleção de glutationa, ou seja, ao estresse oxidativo hepático gerado pela oxidação de ácidos graxos nas mitocôndrias e nos peroxissomos — e isso acontece antes de o hepatócito necrosar e liberar transaminases. É por isso que gama-GT elevada com ALT normal é achado típico da esteatose inicial.',
        'Vale distinguir esteatose de esteato-hepatite, porque só a segunda progride. O acúmulo de triglicerídeos em si é relativamente inerte — triglicerídeo é uma forma de **armazenamento seguro**. O dano vem quando a capacidade de esterificação é excedida e se acumulam metabólitos lipotóxicos (diacilglicerol, ceramidas, ácidos graxos livres saturados), que provocam estresse de retículo endoplasmático, disfunção mitocondrial com produção de espécies reativas de oxigênio e ativação de vias de morte celular. A necrose e a apoptose de hepatócitos liberam sinais que ativam células estreladas hepáticas, e é a transformação dessas células em miofibroblastos produtores de colágeno que gera a **fibrose** — a única variável que realmente prediz mortalidade hepática. Daí a regra prática: detectar gordura sem estadiar fibrose gera ansiedade sem benefício.',
        'Existe esteatose com IMC normal — a chamada MASLD magra —, mais frequente em asiáticos e associada a resistência insulínica e distribuição visceral de gordura, com prognóstico não melhor do que o da forma clássica.',
      ],
    }
  },
  formula: [
    'z = 0,953×ln(TG) + 0,139×IMC + 0,718×ln(GGT) + 0,053×cintura − 15,745',
    'FLI = (e^z / (1 + e^z)) × 100',
  ],
  fundamento:
    'O FLI é uma regressão logística convertida em probabilidade. Cada variável representa um eixo da doença: triglicerídeos e IMC refletem o excesso de substrato lipídico, a cintura reflete a adiposidade visceral e a gama-GT reflete o estresse oxidativo hepático — que sobe na esteatose antes das transaminases. A escolha da cintura, e não apenas do IMC, decorre da **hipótese portal**: o tecido adiposo visceral drena pela veia porta, de modo que os ácidos graxos livres da sua lipólise acelerada e as citocinas que ele secreta (TNF-α, IL-6, resistina, com adiponectina reduzida) chegam ao hepatócito em primeira passagem e em concentração muito superior à sistêmica. Isso explica por que duas pessoas com o mesmo IMC têm riscos hepáticos diferentes conforme a distribuição da gordura. No hepatócito, o excesso de substrato somado à hiperinsulinemia ativa SREBP-1c e ChREBP, aumentando a lipogênese *de novo*, enquanto a resistência insulínica reduz a betaoxidação — entrada alta com saída baixa produz acúmulo. A gama-GT sobe precocemente porque sua expressão responde à depleção de glutationa, isto é, ao estresse oxidativo da oxidação lipídica mitocondrial e peroxissomal, e isso antecede a necrose hepatocitária que libera transaminases: daí o achado característico de gama-GT elevada com ALT normal na esteatose inicial. Como instrumento, o FLI foi derivado contra ultrassonografia numa coorte italiana de mais de 500 pessoas e tem o desenho típico de ferramenta **epidemiológica**: cortes com razões de verossimilhança assimétricas (0,2 abaixo de 30, 4,3 acima de 60) e uma zona intermediária ampla, aceitável em rastreio populacional e insuficiente para decisão individual. Sua limitação essencial, porém, não é estatística: é que ele mede a variável errada para prognóstico. A esteatose é relativamente inerte, porque o triglicerídeo é forma de armazenamento seguro; o dano vem dos metabólitos lipotóxicos (diacilglicerol, ceramidas, ácidos graxos saturados) que ativam células estreladas hepáticas e geram **fibrose** — e é a fibrose, não a gordura, que prediz mortalidade.',
  armadilhas: [
    'Gama-GT elevada por álcool, medicamentos ou colestase infla o índice sem esteatose.',
    'O índice estima presença de gordura, não gravidade nem fibrose.',
    'FLI alto isolado não é diagnóstico nem indicação de tratamento específico. O próximo passo obrigatório é estadiar fibrose com FIB-4 e, se indeterminado ou alto, elastografia.',
    'Triglicerídeos variam muito com jejum, álcool recente e controle glicêmico. Colha em jejum de 12 horas e repita antes de decidir sobre um valor limítrofe.',
    'Foi derivado contra ultrassonografia, que só detecta esteatose acima de cerca de 20 a 30% de infiltração. Graus leves passam, e o índice herda essa insensibilidade.',
    'Cintura mal medida invalida o resultado: a referência é o ponto médio entre a última costela e a crista ilíaca, ao fim de uma expiração normal, com fita horizontal e sem compressão.',
    'A zona intermediária (30 a 59) abrange parcela grande da população e não decide nada. Nela, prossiga pela avaliação metabólica e pelo estadiamento de fibrose, não por repetição do índice.',
  ],
  referencias: [
    { texto: 'Bedogni G, Bellentani S, Miglioli L, et al. The Fatty Liver Index: a simple and accurate predictor of hepatic steatosis in the general population. BMC Gastroenterol. 2006;6:33.' },
    { texto: 'Rinella ME, Lazarus JV, Ratziu V, et al. A multisociety Delphi consensus statement on new fatty liver disease nomenclature. Hepatology. 2023;78(6):1966-1986.' },
    { texto: 'European Association for the Study of the Liver (EASL), EASD, EASO. EASL-EASD-EASO Clinical Practice Guidelines on the management of metabolic dysfunction-associated steatotic liver disease (MASLD). J Hepatol. 2024;81(3):492-542.' },
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
      conduta: [
        '**Função discriminante de Maddrey ≥ 32** caracteriza hepatite alcoólica grave, com mortalidade de 30–50% em 28 dias sem tratamento. É o limiar clássico para indicar **corticoide — prednisolona 40 mg/dia por 28 dias** (prednisolona, não prednisona, pois a conversão hepática está comprometida).',
        'Antes do corticoide, **exclua ativamente as contraindicações**: infecção ativa não controlada, hemorragia digestiva em curso, insuficiência renal aguda, hepatite viral B ativa e pancreatite. Rastreie infecção com hemoculturas, urocultura, radiografia e paracentese diagnóstica — peritonite bacteriana espontânea é frequente e assintomática nesse grupo.',
        'Aplique o **escore de Lille no 7º dia** para decidir a continuidade: **Lille ≥ 0,45** significa não resposta, com sobrevida em 6 meses de cerca de 25% — suspenda o corticoide, pois manter apenas acrescenta risco infeccioso. **Lille < 0,45** indica resposta e justifica completar os 28 dias.',
        'Associe sempre o cuidado de suporte, que muitas vezes pesa mais que o corticoide: **abstinência absoluta de álcool** (o único fator que altera a história natural a longo prazo), **N-acetilcisteína** em associação nos primeiros dias, suporte nutricional agressivo com meta de 35–40 kcal/kg/dia, e reposição de tiamina, folato e outras vitaminas do complexo B antes de qualquer glicose.',
        'Discuta **transplante precoce** em não respondedores selecionados: os protocolos que dispensam o período fixo de 6 meses de abstinência mostraram sobrevida muito superior em pacientes com bom suporte social e primeira descompensação. Pentoxifilina não demonstrou benefício e foi abandonada como alternativa ao corticoide.',
      ],
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
    'A função discriminante foi derivada nos anos 1970 combinando as duas medidas que melhor refletiam a gravidade da hepatite alcoólica: o comprometimento da síntese de fatores de coagulação e a falência excretora. O coeficiente 4,6 foi ajustado empiricamente para dar aos dois componentes pesos comparáveis. A lógica da função discriminante é combinar os dois marcadores que refletem a **capacidade sintética e excretora do hepatócito**: o tempo de protrombina, que cai quando a síntese de fatores de coagulação falha (e que tem meia-vida curta, o que o torna sensível a mudanças agudas), e a bilirrubina, que sobe quando a conjugação e a excreção canalicular se perdem. O corticoide funciona nessa população porque a hepatite alcoólica grave é sustentada por uma resposta inflamatória mediada por TNF-alfa e por neutrófilos, e não apenas pela toxicidade direta do acetaldeído.',
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
      conduta: [
        '**Critérios preenchidos** significam mortalidade próxima de 90% sem transplante. A conduta é uma só: **contato imediato com centro de transplante hepático e transferência**, não observação. O tempo entre o preenchimento dos critérios e a disponibilidade de um enxerto é o determinante de sobrevida.',
        'Nos casos por **paracetamol**, os critérios são pH < 7,3 após reposição volêmica, **ou** a tríade de INR > 6,5, creatinina > 3,4 mg/dL e encefalopatia grau III–IV. O lactato arterial (> 3,5 mmol/L precoce ou > 3,0 após reposição) acrescenta poder discriminatório e antecipa a decisão.',
        'Nos casos **não relacionados a paracetamol**, basta INR > 6,5 isoladamente, ou três entre: idade < 10 ou > 40 anos, etiologia desfavorável (hepatite não A não B, halotano, reação idiossincrática a fármaco), icterícia por mais de 7 dias antes da encefalopatia, INR > 3,5 e bilirrubina > 17,5 mg/dL.',
        'Enquanto se aguarda, execute o suporte específico: **N-acetilcisteína** (útil mesmo em falência hepática não relacionada a paracetamol), controle da hipertensão intracraniana com cabeceira elevada, salina hipertônica e normotermia, correção de hipoglicemia com infusão contínua de glicose, e vigilância de infecção com limiar baixo para antibiótico.',
        '**Não corrija o INR profilaticamente com plasma**: ele é o principal marcador prognóstico e mascará-lo cega o acompanhamento e a decisão de transplante. Reserve hemocomponentes para sangramento ativo ou procedimento invasivo programado. Lembre que esses pacientes têm hemostasia rebalanceada e não sangram tanto quanto o INR sugere.',
      ],
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
    'Os critérios foram derivados em 1989 no King’s College Hospital, a partir de 588 casos de insuficiência hepática aguda, buscando identificar quem morreria sem transplante. A separação por etiologia foi essencial: a intoxicação por paracetamol tem curso e prognóstico distintos, com potencial de recuperação espontânea muito maior quando não há acidose nem falência renal. Os critérios separam paracetamol dos demais porque as histórias naturais divergem: na intoxicação por paracetamol o dano é **agudo e potencialmente reversível** se o hepatócito sobreviver, e os marcadores que predizem morte são os da gravidade metabólica imediata (pH e lactato, que refletem hipoperfusão e falência mitocondrial). Nas demais causas, o que prediz é a **duração da icterícia antes da encefalopatia** — um curso arrastado indica que a capacidade regenerativa já foi ultrapassada.',
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
      conduta: [
        'Critérios preenchidos com **ausência de sinais de alarme**: faça o diagnóstico positivo do distúrbio funcional e **diga isso ao paciente com clareza**. Nomear a doença, explicar o eixo intestino-cérebro e a hipersensibilidade visceral, e afirmar que não é \'coisa da cabeça\' nem câncer é, em si, uma intervenção terapêutica com efeito demonstrado sobre a intensidade dos sintomas.',
        '**Sinais de alarme obrigam investigação** e afastam o diagnóstico funcional: início após os 50 anos, perda de peso não intencional, sangramento digestivo, anemia, febre, massa palpável, disfagia progressiva, vômitos persistentes, história familiar de câncer colorretal ou doença inflamatória intestinal. Nesses casos, colonoscopia e endoscopia entram antes, não depois.',
        'Investigação mínima na síndrome do intestino irritável sem alarme: **hemograma, proteína C-reativa, sorologia para doença celíaca e calprotectina fecal**. Calprotectina normal afasta doença inflamatória intestinal com boa segurança e evita colonoscopia desnecessária em pacientes jovens.',
        'Trate pelo subtipo predominante: com **constipação**, fibras solúveis (psyllium, não farelo de trigo, que piora distensão), polietilenoglicol, linaclotida; com **diarreia**, loperamida, rifaximina, colestiramina se houver má absorção de sais biliares; com **dor** predominante, antiespasmódico (brometo de otilônio, óleo de hortelã) e **neuromodulador em dose baixa** — amitriptilina 10–25 mg à noite para o subtipo diarreia, inibidor seletivo da recaptação de serotonina para o subtipo constipação.',
        'Ofereça a **dieta FODMAP com orientação de nutricionista** e por tempo limitado: ela funciona na fase de restrição, mas precisa de reintrodução programada para não empobrecer a microbiota e o aporte nutricional. Acrescente **terapias dirigidas ao eixo intestino-cérebro** — terapia cognitivo-comportamental, hipnoterapia dirigida ao intestino — que têm os maiores tamanhos de efeito nos casos refratários.',
      ],
      alertas: [
        'Os critérios de Roma só valem na **ausência de sinais de alarme**. Início após os 50 anos, perda de peso, sangramento, anemia, febre, massa palpável ou história familiar de câncer colorretal obrigam investigação antes de qualquer diagnóstico funcional.',
      ],
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
    'Os critérios de Roma existem porque os distúrbios funcionais não têm marcador biológico, e sem definição operacional a pesquisa clínica seria impossível. Cada revisão refinou a especificidade — o custo foi tornar os critérios mais restritivos que a prática, de modo que muitos pacientes com quadro claramente funcional não os preenchem formalmente. Isso não impede o diagnóstico clínico. Os critérios de Roma IV abandonaram o termo \'funcional\' em favor de **distúrbios da interação intestino-cérebro**, refletindo a compreensão atual: há hipersensibilidade visceral com limiar reduzido de percepção de distensão, alteração da motilidade, disfunção da barreira epitelial, ativação imune de baixo grau, mudança da microbiota e processamento central alterado do sinal visceral. Não é ausência de doença — é doença de um eixo que os exames estruturais de rotina não enxergam.',
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
      conduta: [
        'Padrão **hepatocelular** (transaminases desproporcionalmente mais elevadas que fosfatase alcalina) aponta hepatite viral, hepatite autoimune, medicamentosa, isquêmica ou tóxica. A investigação inicial é sorológica (hepatites A, B e C), autoanticorpos, ferritina e saturação de transferrina, ceruloplasmina em jovens, e revisão minuciosa de fármacos e fitoterápicos.',
        'Padrão **colestático** (fosfatase alcalina desproporcionalmente elevada) exige **imagem das vias biliares** como primeiro passo — ultrassonografia, e colangiorressonância se houver suspeita de obstrução não vista. Confirme a origem hepática da fosfatase alcalina com GGT elevada; se a GGT for normal, a origem é óssea, placentária ou intestinal.',
        '**Relação AST/ALT > 2**, sobretudo com GGT alta e transaminases abaixo de 300 U/L, é fortemente sugestiva de **doença hepática alcoólica** — o mecanismo é a deficiência de piridoxal-5-fosfato, cofator necessário à ALT, e a lesão mitocondrial que libera a fração mitocondrial da AST.',
        '**Relação > 1 na doença hepática não alcoólica** sugere progressão para fibrose avançada, invertendo o padrão inicial em que a ALT predomina. Calcule FIB-4 nesse cenário. Lembre também que a AST não é específica do fígado: sobe em lesão muscular, infarto, hemólise e após exercício intenso — dose **creatinoquinase** antes de investigar o fígado quando a ALT estiver relativamente baixa.',
        '**Transaminases acima de 1.000 U/L** restringem o diagnóstico a poucas causas: hepatite viral aguda, hepatite isquêmica (fígado de choque, em que a elevação é abrupta e cai rapidamente), paracetamol e outras toxinas, hepatite autoimune e obstrução biliar aguda por cálculo. Nessa faixa, dose **INR e bilirrubina com urgência** — é a coagulopatia, não a transaminase, que define falência hepática aguda e indica contato com centro de transplante.',
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
