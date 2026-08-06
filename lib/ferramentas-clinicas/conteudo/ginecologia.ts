import type { Ferramenta, Nivel, Resultado } from '../tipos'
import {
  campoAltura,
  campoNum,
  campoOpc,
  campoPeso,
  campoSeg,
  campoSimNao,
  fmt,
  fmtInt,
  fmtLivre,
  fmtPct,
  imc as calcImc,
  num,
  numOu,
  opc,
  sim,
  somaSimNao,
} from '../helpers'

/** Converte dias em "Xs Yd". */
function semanasDias(dias: number): string {
  const s = Math.floor(dias / 7)
  const d = Math.round(dias % 7)
  return `${s}s ${d}d`
}

const idadeGestacional: Ferramenta = {
  id: 'idade-gestacional',
  nome: 'Idade gestacional, data provável do parto e datação por ultrassonografia',
  sinonimos: ['ig', 'dpp', 'naegele', 'dum', 'idade gestacional', 'data provavel do parto', 'datacao'],
  resumo: 'Calcula idade gestacional e DPP pela última menstruação e decide quando redatar pela ultrassonografia.',
  categorias: ['ginecologia'],
  campos: [
    campoNum('diasDum', 'Dias desde a última menstruação', { unidade: 'dias', min: 0, max: 320, passo: 1, ajuda: 'Conte a partir do primeiro dia da última menstruação até hoje.' }),
    campoNum('cicloDias', 'Duração habitual do ciclo', { unidade: 'dias', min: 21, max: 45, passo: 1, padrao: '28', ajuda: 'Ciclos diferentes de 28 dias deslocam a ovulação e, com ela, a idade gestacional real.' }),
    campoNum('igUsgSemanas', 'Idade gestacional pela ultrassonografia — semanas', { unidade: 'semanas', min: 5, max: 42, passo: 1, opcional: true }),
    campoNum('igUsgDias', 'Idade gestacional pela ultrassonografia — dias', { unidade: 'dias', min: 0, max: 6, passo: 1, padrao: '0', opcional: true }),
    campoNum('diasDesdeUsg', 'Dias decorridos desde a ultrassonografia', { unidade: 'dias', min: 0, max: 250, passo: 1, padrao: '0', opcional: true }),
  ],
  calcular: (v) => {
    const diasDum = num(v, 'diasDum')
    const ciclo = numOu(v, 'cicloDias', 28)
    const usgS = num(v, 'igUsgSemanas')
    const usgD = numOu(v, 'igUsgDias', 0)
    const desdeUsg = numOu(v, 'diasDesdeUsg', 0)
    if (diasDum === null) return null
    const ajusteCiclo = ciclo - 28
    const igDum = diasDum - ajusteCiclo
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Idade gestacional pela última menstruação', valor: semanasDias(igDum), nota: ajusteCiclo !== 0 ? `Ajustada em ${ajusteCiclo > 0 ? '−' : '+'}${Math.abs(ajusteCiclo)} dias pelo ciclo de ${fmtInt(ciclo)} dias.` : 'Ciclo de 28 dias, sem ajuste.' },
      { rotulo: 'Dias até a data provável do parto', valor: `${fmtInt(280 - igDum)} dias`, nota: 'A regra de Naegele soma 280 dias (40 semanas) ao primeiro dia da última menstruação: some 7 dias, subtraia 3 meses e some 1 ano.' },
      { rotulo: 'Idade gestacional em semanas decimais', valor: fmt(igDum / 7, 1) },
    ]
    let igFinal = igDum
    let fonte = 'última menstruação'
    if (usgS !== null) {
      const igUsgHoje = usgS * 7 + usgD + desdeUsg
      const diferenca = Math.abs(igUsgHoje - igDum)
      const igNaUsg = usgS * 7 + usgD
      let limite: number
      if (igNaUsg <= 62) limite = 5
      else if (igNaUsg <= 111) limite = 7
      else if (igNaUsg <= 153) limite = 10
      else if (igNaUsg <= 195) limite = 14
      else limite = 21
      const redatar = diferenca > limite
      detalhes.push({ rotulo: 'Idade gestacional pela ultrassonografia (hoje)', valor: semanasDias(igUsgHoje) })
      detalhes.push({ rotulo: 'Divergência entre os métodos', valor: `${fmtInt(diferenca)} dias`, nota: `Limite de tolerância para a idade em que a ultrassonografia foi feita (${semanasDias(igNaUsg)}): ${limite} dias.`, nivel: redatar ? 'alerta' : 'ok' })
      detalhes.push({
        rotulo: 'Decisão de datação',
        valor: redatar ? 'Redatar pela ultrassonografia' : 'Manter a data da última menstruação',
        nota: redatar ? 'A divergência ultrapassa o limite aceito pelo ACOG — a ultrassonografia deve prevalecer.' : 'A divergência está dentro da tolerância; mantenha a datação original, que é o padrão.',
        nivel: redatar ? 'alerta' : 'ok',
      })
      if (redatar) {
        igFinal = igUsgHoje
        fonte = 'ultrassonografia'
      }
    }
    const semanas = igFinal / 7
    const classe = semanas < 22 ? 'Primeiro/segundo trimestre — antes da viabilidade' : semanas < 28 ? 'Pré-termo extremo, se nascer agora' : semanas < 34 ? 'Pré-termo moderado' : semanas < 37 ? 'Pré-termo tardio' : semanas < 39 ? 'Termo precoce' : semanas < 41 ? 'Termo pleno' : semanas < 42 ? 'Termo tardio' : 'Pós-termo'
    const nivel: Nivel = semanas >= 42 ? 'alerta' : semanas >= 37 ? 'ok' : 'atencao'
    return {
      titulo: `Idade gestacional (por ${fonte})`,
      valor: semanasDias(igFinal),
      nivel,
      rotuloNivel: classe,
      detalhes,
      interpretacao: [
        '**A ultrassonografia do primeiro trimestre é o método mais acurado de datação**, com margem de ± 5 a 7 dias quando feita pelo comprimento cabeça-nádega entre 7 e 13 semanas e 6 dias. Depois disso a variabilidade biológica do crescimento fetal cresce, e a acurácia cai progressivamente: ± 7 a 10 dias no segundo trimestre e ± 21 a 30 dias no terceiro.',
        '**Datar uma única vez e nunca mais mudar.** A data estabelecida no primeiro exame confiável vale para toda a gestação. Redatar no terceiro trimestre porque o feto "está pequeno" é o erro que transforma restrição de crescimento em "idade gestacional errada" — e retira a chance de intervir.',
        'A regra de Naegele pressupõe ciclo de 28 dias com ovulação no 14º. Ciclos longos deslocam a ovulação para frente e fazem a idade gestacional pela última menstruação **superestimar** a real; ciclos curtos fazem o contrário.',
        'A idade gestacional é contada a partir do primeiro dia da última menstruação, e não da concepção — o que significa que as duas primeiras semanas "de gestação" antecedem a fecundação. A idade concepcional é aproximadamente 2 semanas menor.',
      ],
      alertas: ['Em gestação por fertilização in vitro, a datação é feita pela data da transferência e pelo estágio do embrião — não pela última menstruação nem pela ultrassonografia.'],
    }
  },
  formula: [
    'Naegele: DPP = primeiro dia da última menstruação + 7 dias − 3 meses + 1 ano (280 dias)',
    'Idade gestacional = (hoje − última menstruação) ÷ 7, ajustada pelo ciclo',
    'Redatar se a divergência exceder: 5 d (≤ 8s6d) · 7 d (9–15s6d) · 10 d (16–21s6d) · 14 d (22–27s6d) · 21 d (≥ 28s)',
  ],
  fundamento:
    'A gestação humana dura em média 280 dias a partir do primeiro dia da última menstruação — cerca de 266 dias a partir da concepção. Franz Naegele formalizou a regra em 1812. A superioridade da ultrassonografia precoce vem de uma razão biológica simples: no primeiro trimestre, o crescimento embrionário é notavelmente uniforme entre indivíduos; a variabilidade genética e ambiental do tamanho só se manifesta depois.',
  armadilhas: [
    'Última menstruação incerta, sangramento de implantação confundido com menstruação, uso recente de contraceptivo hormonal e amamentação tornam a datação menstrual pouco confiável.',
    'Nunca redate no terceiro trimestre para "acertar" o crescimento. Feto pequeno para a idade gestacional é um diagnóstico, não um erro de conta.',
  ],
  referencias: [
    { texto: 'American College of Obstetricians and Gynecologists. Committee Opinion No. 700: Methods for estimating the due date. Obstet Gynecol. 2017;129(5):e150-e154.' },
  ],
}

const ganhoPeso: Ferramenta = {
  id: 'ganho-peso-gestacao',
  nome: 'Ganho de peso recomendado na gestação',
  sinonimos: ['ganho de peso gestante', 'iom', 'peso na gravidez'],
  resumo: 'Define a faixa total e a velocidade semanal de ganho conforme o IMC pré-gestacional.',
  categorias: ['ginecologia', 'nutricao'],
  campos: [
    campoNum('pesoPre', 'Peso pré-gestacional', { unidade: 'kg', min: 30, max: 200, passo: 0.1 }),
    campoAltura(),
    campoNum('pesoAtual', 'Peso atual', { unidade: 'kg', min: 30, max: 220, passo: 0.1 }),
    campoNum('semanas', 'Idade gestacional atual', { unidade: 'semanas', min: 4, max: 42, passo: 0.5 }),
    campoSeg('gemelar', 'Gestação', [
      { valor: 'unica', rotulo: 'Única' },
      { valor: 'gemelar', rotulo: 'Gemelar' },
    ]),
  ],
  calcular: (v) => {
    const pesoPre = num(v, 'pesoPre')
    const altura = num(v, 'altura')
    const pesoAtual = num(v, 'pesoAtual')
    const semanas = num(v, 'semanas')
    if (pesoPre === null || altura === null || pesoAtual === null || semanas === null) return null
    const bmi = calcImc(pesoPre, altura)
    const gemelar = opc(v, 'gemelar') === 'gemelar'
    let faixa: [number, number]
    let taxa: [number, number]
    let categoria: string
    if (bmi < 18.5) { faixa = gemelar ? [22.5, 28] : [12.5, 18]; taxa = [0.44, 0.58]; categoria = 'Baixo peso (IMC < 18,5)' }
    else if (bmi < 25) { faixa = gemelar ? [17, 25] : [11.5, 16]; taxa = [0.35, 0.5]; categoria = 'Eutrofia (IMC 18,5 a 24,9)' }
    else if (bmi < 30) { faixa = gemelar ? [14, 23] : [7, 11.5]; taxa = [0.23, 0.33]; categoria = 'Sobrepeso (IMC 25 a 29,9)' }
    else { faixa = gemelar ? [11, 19] : [5, 9]; taxa = [0.17, 0.27]; categoria = 'Obesidade (IMC ≥ 30)' }
    const ganho = pesoAtual - pesoPre
    const semanasSegundoTerceiro = Math.max(0, semanas - 13)
    const esperadoMin = (bmi < 25 ? 0.5 : 0.5) + taxa[0] * semanasSegundoTerceiro
    const esperadoMax = 2 + taxa[1] * semanasSegundoTerceiro
    const dentro = ganho >= esperadoMin && ganho <= esperadoMax
    const nivel: Nivel = semanas < 14 ? 'neutro' : dentro ? 'ok' : 'alerta'
    return {
      titulo: 'Ganho de peso',
      valor: `${ganho >= 0 ? '+' : ''}${fmt(ganho, 1)} kg`,
      nivel,
      rotuloNivel: categoria,
      detalhes: [
        { rotulo: 'IMC pré-gestacional', valor: `${fmt(bmi, 1)} kg/m²` },
        { rotulo: 'Ganho total recomendado', valor: `${fmt(faixa[0], 1)} a ${fmt(faixa[1], 1)} kg`, nota: gemelar ? 'Faixa para gestação gemelar (recomendações do Institute of Medicine).' : 'Faixa para gestação única.' },
        { rotulo: 'Velocidade no 2º e 3º trimestres', valor: `${fmt(taxa[0], 2)} a ${fmt(taxa[1], 2)} kg/semana` },
        { rotulo: 'Ganho esperado nesta idade gestacional', valor: `${fmt(esperadoMin, 1)} a ${fmt(esperadoMax, 1)} kg`, nota: 'Considerando 0,5 a 2 kg no primeiro trimestre mais a velocidade semanal a partir da 14ª semana.', nivel: dentro ? 'ok' : 'alerta' },
        { rotulo: 'Peso final projetado', valor: `${fmt(pesoPre + faixa[0], 1)} a ${fmt(pesoPre + faixa[1], 1)} kg` },
      ],
      interpretacao: [
        dentro || semanas < 14
          ? 'Ganho dentro do esperado para a idade gestacional.'
          : ganho > esperadoMax
            ? '**Ganho acima do recomendado.** Associa-se a macrossomia, cesariana, diabetes gestacional, distúrbio hipertensivo e retenção de peso pós-parto. A abordagem é nutricional e de atividade física, não restrição calórica agressiva.'
            : '**Ganho abaixo do recomendado.** Associa-se a restrição de crescimento fetal, baixo peso ao nascer e parto pré-termo. Investigue náuseas e vômitos persistentes, insegurança alimentar, transtorno alimentar e doenças consumptivas.',
        'O ganho recomendado é **menor quanto maior o IMC pré-gestacional** porque a obesidade já fornece reserva energética; ganhar muito nesse contexto acrescenta risco sem benefício fetal.',
        'Distribuição típica do ganho a termo: feto cerca de 3,5 kg, placenta 0,7 kg, líquido amniótico 0,8 kg, útero 1 kg, mamas 0,5 kg, sangue 1,5 kg, líquido extracelular 1,5 kg e reserva de gordura materna 2 a 4 kg.',
        '**Nunca recomende perda de peso durante a gestação**, mesmo em obesidade grave. A restrição calórica pode induzir cetose materna, associada a prejuízo do neurodesenvolvimento fetal.',
      ],
    }
  },
  formula: ['Faixas do Institute of Medicine por IMC pré-gestacional', 'Ganho esperado = ganho do 1º trimestre + (taxa semanal × semanas após a 13ª)'],
  fundamento:
    'As faixas do Institute of Medicine, revisadas em 2009, foram derivadas de coortes que relacionaram ganho de peso a desfechos maternos e fetais simultaneamente — buscando o intervalo que minimiza tanto o risco de recém-nascido pequeno para a idade gestacional quanto o de macrossomia, cesariana e retenção de peso.',
  armadilhas: [
    'O peso pré-gestacional referido pela paciente costuma ser subestimado. Sempre que houver registro anterior, use-o.',
    'Ganho abrupto no terceiro trimestre com edema pode ser retenção hídrica de pré-eclâmpsia, não ganho nutricional — meça a pressão e pesquise proteinúria.',
  ],
  referencias: [
    { texto: 'Institute of Medicine and National Research Council. Weight Gain During Pregnancy: Reexamining the Guidelines. Washington: National Academies Press; 2009.' },
    { texto: 'ACOG Committee Opinion No. 548: Weight gain during pregnancy. Obstet Gynecol. 2013;121(1):210-212.' },
  ],
}

const bishop: Ferramenta = {
  id: 'bishop',
  nome: 'Escore de Bishop',
  sinonimos: ['bishop', 'colo favoravel', 'inducao de parto', 'amadurecimento cervical'],
  resumo: 'Avalia se o colo está favorável à indução do trabalho de parto.',
  categorias: ['ginecologia'],
  campos: [
    campoOpc('dilatacao', 'Dilatação cervical', [
      { valor: '0', rotulo: 'Fechado', pontos: 0 },
      { valor: '1', rotulo: '1 a 2 cm', pontos: 1 },
      { valor: '2', rotulo: '3 a 4 cm', pontos: 2 },
      { valor: '3', rotulo: '5 cm ou mais', pontos: 3 },
    ]),
    campoOpc('apagamento', 'Apagamento cervical', [
      { valor: '0', rotulo: '0 a 30%', pontos: 0 },
      { valor: '1', rotulo: '40 a 50%', pontos: 1 },
      { valor: '2', rotulo: '60 a 70%', pontos: 2 },
      { valor: '3', rotulo: '80% ou mais', pontos: 3 },
    ]),
    campoOpc('altura', 'Altura da apresentação (planos de De Lee)', [
      { valor: '0', rotulo: '−3', pontos: 0 },
      { valor: '1', rotulo: '−2', pontos: 1 },
      { valor: '2', rotulo: '−1 ou 0', pontos: 2 },
      { valor: '3', rotulo: '+1 ou +2', pontos: 3 },
    ]),
    campoOpc('consistencia', 'Consistência do colo', [
      { valor: '0', rotulo: 'Firme', pontos: 0 },
      { valor: '1', rotulo: 'Média', pontos: 1 },
      { valor: '2', rotulo: 'Amolecida', pontos: 2 },
    ]),
    campoOpc('posicao', 'Posição do colo', [
      { valor: '0', rotulo: 'Posterior', pontos: 0 },
      { valor: '1', rotulo: 'Central', pontos: 1 },
      { valor: '2', rotulo: 'Anterior', pontos: 2 },
    ]),
  ],
  calcular: (v) => {
    const ids = ['dilatacao', 'apagamento', 'altura', 'consistencia', 'posicao']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const favoravel = total >= 8
    const desfavoravel = total <= 6
    return {
      titulo: 'Escore de Bishop',
      valor: String(total),
      unidade: 'de 13 pontos',
      nivel: favoravel ? 'ok' : desfavoravel ? 'alerta' : 'atencao',
      rotuloNivel: favoravel ? 'Colo favorável' : desfavoravel ? 'Colo desfavorável' : 'Colo intermediário',
      detalhes: [
        { rotulo: 'Ponto de corte de colo favorável', valor: '≥ 8', nota: 'Com Bishop ≥ 8, a probabilidade de parto vaginal após indução é semelhante à do trabalho de parto espontâneo.' },
        { rotulo: 'Colo desfavorável', valor: '≤ 6', nota: 'Indica necessidade de amadurecimento cervical antes da indução com ocitocina.' },
      ],
      interpretacao: [
        favoravel
          ? '**Colo favorável.** A indução pode ser feita diretamente com ocitocina, com ou sem amniotomia. A chance de parto vaginal é alta.'
          : '**Colo desfavorável ou intermediário: amadureça antes de induzir.** Opções: prostaglandinas (misoprostol por via vaginal ou oral, dinoprostona) ou métodos mecânicos (sonda de Foley intracervical, dilatadores higroscópicos). Métodos mecânicos e farmacológicos combinados encurtam o tempo até o parto.',
        'O **misoprostol é contraindicado em gestantes com cesariana prévia ou qualquer cicatriz uterina**, pelo risco de rotura. Nesses casos, a sonda de Foley é a alternativa mais segura.',
        'O ensaio **ARRIVE** (2018) mostrou que a indução eletiva com 39 semanas em nulíparas de baixo risco **reduziu** a taxa de cesariana em comparação com a conduta expectante, contrariando a crença tradicional — e mudou a conversa sobre indução eletiva.',
        'A dilatação é o item de maior peso preditivo isolado. Versões simplificadas do escore, usando apenas dilatação, apagamento e altura da apresentação, têm desempenho semelhante ao do escore completo.',
      ],
      tabela: {
        titulo: 'Interpretação',
        colunas: ['Pontos', 'Colo', 'Conduta'],
        linhas: [
          ['0 – 6', 'Desfavorável', 'Amadurecimento cervical antes da indução'],
          ['7', 'Intermediário', 'Individualizar'],
          ['8 – 13', 'Favorável', 'Indução direta com ocitocina'],
        ],
        destaque: total <= 6 ? 0 : total === 7 ? 1 : 2,
      },
    }
  },
  formula: ['Soma de 5 parâmetros do exame cervical (0 a 13 pontos)'],
  fundamento:
    'Edward Bishop publicou o escore em 1964, derivado de multíparas em que se pretendia induzir eletivamente o parto. Os cinco parâmetros descrevem o mesmo processo por ângulos diferentes: o amadurecimento cervical envolve reorganização do colágeno, aumento de água e de ácido hialurônico, com amolecimento, apagamento, dilatação e anteriorização do colo — que passa de estrutura de contenção a canal de passagem.',
  armadilhas: [
    'A avaliação é subjetiva e a concordância entre examinadores é apenas moderada, sobretudo para apagamento e consistência.',
    'O comprimento cervical medido por ultrassonografia transvaginal é alternativa mais objetiva, embora não tenha substituído o Bishop na prática.',
  ],
  referencias: [
    { texto: 'Bishop EH. Pelvic scoring for elective induction. Obstet Gynecol. 1964;24:266-268.' },
    { texto: 'Grobman WA, Rice MM, Reddy UM, et al. Labor induction versus expectant management in low-risk nulliparous women (ARRIVE). N Engl J Med. 2018;379(6):513-523.' },
  ],
}

const preEclampsia: Ferramenta = {
  id: 'pre-eclampsia',
  nome: 'Pré-eclâmpsia: critérios diagnósticos, gravidade e risco',
  sinonimos: ['pre-eclampsia', 'preeclampsia', 'dheg', 'eclampsia', 'hellp', 'hipertensao na gestacao'],
  resumo: 'Aplica os critérios do ACOG, identifica sinais de gravidade e estratifica risco para profilaxia.',
  categorias: ['ginecologia', 'emergencia'],
  campos: [
    campoNum('semanas', 'Idade gestacional', { unidade: 'semanas', min: 4, max: 42, passo: 0.5 }),
    campoNum('pas', 'PA sistólica', { unidade: 'mmHg', min: 70, max: 260, passo: 1 }),
    campoNum('pad', 'PA diastólica', { unidade: 'mmHg', min: 40, max: 160, passo: 1 }),
    campoSimNao('proteinuria', 'Proteinúria significativa', 1, '≥ 300 mg em 24 h, relação proteína/creatinina ≥ 0,3 mg/mg, ou fita 2+ quando os métodos quantitativos não estão disponíveis.'),
    campoSimNao('plaquetas', 'Plaquetas < 100.000/mm³', 1),
    campoSimNao('creatinina', 'Creatinina > 1,1 mg/dL ou o dobro do basal', 1),
    campoSimNao('transaminases', 'Transaminases ≥ 2 vezes o limite superior do normal', 1),
    campoSimNao('edemaPulmonar', 'Edema agudo de pulmão', 1),
    campoSimNao('neurologico', 'Cefaleia persistente, alterações visuais ou sintomas neurológicos novos', 1),
    campoSimNao('dorEpigastrica', 'Dor epigástrica ou em hipocôndrio direito persistente', 1),
    campoSimNao('riscoAlto', 'Fator de risco alto para pré-eclâmpsia', 1, 'Pré-eclâmpsia prévia, gestação múltipla, hipertensão crônica, diabetes tipo 1 ou 2, doença renal, doença autoimune (lúpus, síndrome antifosfolípide).'),
    campoNum('riscoModerado', 'Número de fatores de risco moderados', { min: 0, max: 6, passo: 1, padrao: '0', ajuda: 'Nuliparidade, IMC > 30, história familiar de pré-eclâmpsia, idade ≥ 35 anos, características sociodemográficas de risco, intervalo interpartal > 10 anos, baixo peso ao nascer prévio.' }),
  ],
  calcular: (v) => {
    const semanas = num(v, 'semanas')
    const pas = num(v, 'pas')
    const pad = num(v, 'pad')
    const riscoModerado = numOu(v, 'riscoModerado', 0)
    if (semanas === null || pas === null || pad === null) return null
    const hipertensao = pas >= 140 || pad >= 90
    const hipertensaoGrave = pas >= 160 || pad >= 110
    const proteinuria = sim(v, 'proteinuria')
    const gravidade = [
      hipertensaoGrave,
      sim(v, 'plaquetas'),
      sim(v, 'creatinina'),
      sim(v, 'transaminases'),
      sim(v, 'edemaPulmonar'),
      sim(v, 'neurologico'),
      sim(v, 'dorEpigastrica'),
    ].filter(Boolean).length
    const apos20 = semanas >= 20
    const diagnostico = apos20 && hipertensao && (proteinuria || gravidade > 0)
    const comGravidade = diagnostico && gravidade > 0
    const profilaxia = sim(v, 'riscoAlto') || riscoModerado >= 2
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Pressão arterial', valor: `${fmtInt(pas)}/${fmtInt(pad)} mmHg`, nota: hipertensaoGrave ? '**Hipertensão grave** (≥ 160/110) — exige tratamento anti-hipertensivo em até 30 a 60 minutos.' : hipertensao ? 'Hipertensão (≥ 140/90), confirmada em duas medidas com pelo menos 4 h de intervalo.' : 'Pressão abaixo do limiar diagnóstico.', nivel: hipertensaoGrave ? 'critico' : hipertensao ? 'alerta' : 'ok' },
      { rotulo: 'Proteinúria significativa', valor: proteinuria ? 'Presente' : 'Ausente', nota: 'Desde 2013, a **proteinúria deixou de ser obrigatória** para o diagnóstico: hipertensão após 20 semanas com qualquer sinal de gravidade já configura pré-eclâmpsia.' },
      { rotulo: 'Sinais de gravidade presentes', valor: `${gravidade} de 7`, nivel: gravidade > 0 ? 'critico' : 'ok' },
      { rotulo: 'Idade gestacional', valor: `${fmt(semanas, 1)} semanas`, nota: apos20 ? 'Após 20 semanas — compatível com pré-eclâmpsia.' : 'Antes de 20 semanas: hipertensão nessa fase é habitualmente crônica. Pré-eclâmpsia precoce sugere doença trofoblástica gestacional.' },
      { rotulo: 'Indicação de profilaxia com AAS', valor: profilaxia ? 'Indicada' : 'Não indicada por estes critérios', nota: 'AAS 100 a 150 mg à noite, iniciado entre 12 e 16 semanas (e até 20 semanas), mantido até 36 semanas. Indicado com **1 fator de alto risco ou 2 ou mais fatores moderados**.', nivel: profilaxia ? 'alerta' : 'neutro' },
    ]
    const nivel: Nivel = comGravidade ? 'critico' : diagnostico ? 'alerta' : hipertensao ? 'atencao' : 'ok'
    return {
      titulo: comGravidade ? 'Pré-eclâmpsia com sinais de gravidade' : diagnostico ? 'Pré-eclâmpsia sem sinais de gravidade' : hipertensao && apos20 ? 'Hipertensão gestacional' : 'Critérios não preenchidos',
      valor: comGravidade ? 'Com gravidade' : diagnostico ? 'Sem gravidade' : hipertensao ? 'Hipertensão sem proteinúria ou disfunção' : 'Não preenche',
      nivel,
      rotuloNivel: `${fmtInt(pas)}/${fmtInt(pad)} mmHg · ${fmt(semanas, 1)} semanas`,
      detalhes,
      interpretacao: [
        comGravidade
          ? '**Pré-eclâmpsia com sinais de gravidade.** Internação, sulfato de magnésio para profilaxia de eclâmpsia, controle pressórico e definição da via e do momento do parto. Com 34 semanas ou mais, o parto é indicado; abaixo disso, considere conduta expectante em centro terciário com corticoide para maturação pulmonar, desde que mãe e feto estejam estáveis.'
          : diagnostico
            ? '**Pré-eclâmpsia sem sinais de gravidade.** Acompanhamento rigoroso, com avaliação laboratorial e de bem-estar fetal seriada. O parto é indicado a partir de **37 semanas**.'
            : hipertensao && apos20
              ? 'Hipertensão gestacional: hipertensão após 20 semanas sem proteinúria e sem disfunção orgânica. Cerca de 15 a 25% evoluem para pré-eclâmpsia — vigilância semanal.'
              : 'Critérios diagnósticos não preenchidos. Se a suspeita persistir, repita a medida da pressão e a avaliação laboratorial.',
        '**Tratamento da hipertensão grave (≥ 160/110):** é emergência, com alvo de redução em 30 a 60 minutos. Opções de primeira linha: nifedipino de liberação imediata por via oral (10 a 20 mg), hidralazina endovenosa (5 a 10 mg) ou labetalol endovenoso. O alvo não é normalizar, e sim manter em torno de 140 a 150 / 90 a 100 mmHg, para preservar a perfusão placentária.',
        '**Síndrome HELLP** (hemólise, elevação de enzimas hepáticas e plaquetopenia) é uma variante grave que pode ocorrer **sem hipertensão significativa** em até 15% dos casos. Suspeite diante de dor epigástrica, náuseas e mal-estar, e dose desidrogenase láctica, bilirrubinas, transaminases e plaquetas.',
        'A **fisiopatologia** começa cedo: invasão trofoblástica deficiente das artérias espiraladas no primeiro trimestre, isquemia placentária, liberação de fatores antiangiogênicos (sFlt-1 e endoglina solúvel) e disfunção endotelial sistêmica. A relação sFlt-1/PlGF é usada em vários países para descartar pré-eclâmpsia em curto prazo, com valor preditivo negativo alto.',
      ],
      alertas: comGravidade ? ['O único tratamento definitivo é o parto. Conduta expectante antes de 34 semanas só se justifica em centro com terapia intensiva materna e neonatal, com monitorização contínua.'] : undefined,
    }
  },
  formula: ['Pré-eclâmpsia = hipertensão após 20 semanas + (proteinúria OU qualquer sinal de gravidade)'],
  fundamento:
    'A pré-eclâmpsia é uma doença de origem placentária com manifestação sistêmica. A remoção da proteinúria como critério obrigatório, em 2013, reconheceu que a lesão renal é apenas uma das faces da disfunção endotelial difusa — e que exigir proteinúria retardava o diagnóstico de pacientes que já tinham comprometimento hepático, hematológico ou neurológico.',
  armadilhas: [
    'Não espere proteinúria para diagnosticar. Cefaleia persistente que não cede a analgésico comum em gestante hipertensa é sinal de gravidade.',
    'A pré-eclâmpsia pode se manifestar **pela primeira vez no puerpério**, até 6 semanas após o parto. Oriente toda puérpera sobre os sinais de alarme.',
  ],
  referencias: [
    { texto: 'ACOG Practice Bulletin No. 222: Gestational hypertension and preeclampsia. Obstet Gynecol. 2020;135(6):e237-e260.' },
    { texto: 'Rolnik DL, Wright D, Poon LC, et al. Aspirin versus placebo in pregnancies at high risk for preterm preeclampsia (ASPRE). N Engl J Med. 2017;377(7):613-622.' },
  ],
}

const sulfatoMagnesio: Ferramenta = {
  id: 'sulfato-magnesio',
  nome: 'Sulfato de magnésio na pré-eclâmpsia e eclâmpsia',
  sinonimos: ['sulfato de magnesio', 'pritchard', 'zuspan', 'eclampsia tratamento', 'neuroprotecao fetal'],
  resumo: 'Monta os esquemas de ataque e manutenção e resume a monitorização de toxicidade.',
  categorias: ['ginecologia', 'emergencia'],
  campos: [
    campoSeg('esquema', 'Esquema', [
      { valor: 'zuspan', rotulo: 'Zuspan (endovenoso)' },
      { valor: 'pritchard', rotulo: 'Pritchard (intramuscular)' },
      { valor: 'neuro', rotulo: 'Neuroproteção fetal' },
    ]),
    campoNum('manutencao', 'Dose de manutenção desejada', { unidade: 'g/h', min: 1, max: 3, passo: 0.5, padrao: '1', mostrarSe: (v) => opc(v, 'esquema') === 'zuspan' }),
    campoNum('creatinina', 'Creatinina sérica', { unidade: 'mg/dL', min: 0.2, max: 8, passo: 0.01, padrao: '0.7' }),
    campoNum('diurese', 'Diurese na última hora', { unidade: 'mL', min: 0, max: 500, passo: 5, opcional: true }),
    campoSimNao('reflexos', 'Reflexo patelar presente', 1),
    campoNum('fr', 'Frequência respiratória', { unidade: 'irpm', min: 4, max: 40, passo: 1, opcional: true }),
  ],
  calcular: (v) => {
    const esquema = opc(v, 'esquema')
    const manutencao = numOu(v, 'manutencao', 1)
    const cr = num(v, 'creatinina')
    const diurese = num(v, 'diurese')
    const fr = num(v, 'fr')
    if (cr === null) return null
    const detalhes: Resultado['detalhes'] = []
    if (esquema === 'zuspan') {
      detalhes.push({ rotulo: 'Ataque', valor: '4 g endovenosos em 20 a 30 minutos', nota: '8 mL de sulfato de magnésio a 50% (ou 20 mL a 20%) diluídos em 100 mL de soro.' })
      detalhes.push({ rotulo: 'Manutenção', valor: `${fmt(manutencao, 1)} g/h em infusão contínua`, nota: 'Manter por 24 h após o parto ou após a última convulsão.' })
      detalhes.push({ rotulo: 'Preparo da manutenção', valor: `${fmtInt(manutencao * 10)} mL de sulfato a 50% em 500 mL de soro, a ${fmtInt(500 / (10 / manutencao))} mL/h`, nota: 'Confira a concentração da ampola disponível no seu serviço antes de preparar.' })
    } else if (esquema === 'pritchard') {
      detalhes.push({ rotulo: 'Ataque', valor: '4 g endovenosos + 10 g intramusculares', nota: '5 g em cada glúteo, com lidocaína a 2% para reduzir a dor.' })
      detalhes.push({ rotulo: 'Manutenção', valor: '5 g intramusculares a cada 4 horas', nota: 'Alternando os glúteos. Esquema de escolha quando não há bomba de infusão.' })
    } else {
      detalhes.push({ rotulo: 'Neuroproteção fetal', valor: '4 g endovenosos em 20 a 30 min + 1 g/h', nota: 'Indicado quando o parto pré-termo é iminente **antes de 32 semanas**. Reduz paralisia cerebral e disfunção motora grave — número necessário para tratar em torno de 63.' })
      detalhes.push({ rotulo: 'Duração', valor: 'Até 24 h, ou até o parto', nota: 'Idealmente iniciado 4 h antes do parto.' })
    }
    detalhes.push({ rotulo: 'Antídoto', valor: 'Gluconato de cálcio 1 g (10 mL a 10%) endovenoso lento', nota: 'Mantenha sempre disponível à beira do leito enquanto o sulfato estiver correndo.', nivel: 'alerta' })
    const renal = cr > 1.1
    if (renal) detalhes.push({ rotulo: 'Função renal', valor: `Creatinina de ${fmt(cr, 2)} mg/dL`, nota: '**Creatinina elevada exige reduzir a manutenção** (habitualmente pela metade, para 0,5 a 1 g/h) e monitorizar a magnesemia, porque a excreção é inteiramente renal. Mantenha a dose de ataque integral.', nivel: 'alerta' })
    if (diurese !== null) detalhes.push({ rotulo: 'Diurese', valor: `${fmtInt(diurese)} mL/h`, nota: diurese < 25 ? '**Abaixo de 25 a 30 mL/h: suspenda ou reduza a manutenção** e reavalie.' : 'Adequada.', nivel: diurese < 25 ? 'critico' : 'ok' })
    if (!sim(v, 'reflexos')) detalhes.push({ rotulo: 'Reflexo patelar', valor: 'Ausente', nota: '**Sinal precoce de toxicidade** (magnesemia em torno de 8 a 12 mg/dL). Suspenda a infusão imediatamente e reavalie.', nivel: 'critico' })
    if (fr !== null && fr < 12) detalhes.push({ rotulo: 'Frequência respiratória', valor: `${fmtInt(fr)} irpm`, nota: '**Abaixo de 12 a 16 irpm indica toxicidade avançada** (12 a 18 mg/dL). Suspenda, administre gluconato de cálcio e prepare suporte ventilatório.', nivel: 'critico' })
    const toxicidade = !sim(v, 'reflexos') || (fr !== null && fr < 12) || (diurese !== null && diurese < 25)
    return {
      titulo: esquema === 'neuro' ? 'Neuroproteção fetal' : esquema === 'zuspan' ? 'Esquema de Zuspan' : 'Esquema de Pritchard',
      valor: toxicidade ? 'Sinais de toxicidade — suspender' : 'Esquema montado',
      nivel: toxicidade ? 'critico' : 'alerta',
      detalhes,
      interpretacao: [
        '**O sulfato de magnésio é anticonvulsivante, não anti-hipertensivo.** Ele previne e trata a eclâmpsia, mas não reduz a pressão de forma clinicamente relevante — o controle pressórico é feito com hidralazina, nifedipino ou labetalol, em paralelo.',
        'O ensaio **Magpie**, com mais de 10 mil mulheres, mostrou redução de 58% no risco de eclâmpsia. Em eclâmpsia estabelecida, o sulfato é superior a diazepam e a fenitoína para prevenir recorrência — resultado do Collaborative Eclampsia Trial.',
        '**Monitorização a cada hora**, e nesta ordem: reflexo patelar, frequência respiratória e diurese. O reflexo patelar desaparece **antes** da depressão respiratória, o que o torna o sinal de alarme mais útil. Dosagem sérica de magnésio de rotina é desnecessária quando a monitorização clínica é adequada; reserve-a para disfunção renal e sinais duvidosos.',
        'Faixas de magnesemia: terapêutica 4,8 a 8,4 mg/dL (2 a 3,5 mmol/L); perda do reflexo patelar 8 a 12; depressão respiratória 12 a 18; alterações de condução cardíaca acima de 18; parada cardíaca acima de 30 mg/dL.',
        'Efeitos maternos comuns e esperados: rubor, calor, náusea, cefaleia, sonolência, visão turva e desconforto no local da infusão. Nenhum deles indica toxicidade por si só.',
      ],
      alertas: ['Sulfato de magnésio e nifedipino podem potencializar bloqueio neuromuscular e hipotensão. A associação é usada com frequência e é segura na prática, mas exige monitorização atenta.'],
    }
  },
  formula: [
    'Zuspan: 4 g EV em 20–30 min, depois 1 a 2 g/h em infusão contínua',
    'Pritchard: 4 g EV + 10 g IM, depois 5 g IM a cada 4 h',
    'Antídoto: gluconato de cálcio 1 g (10 mL a 10%) EV lento',
  ],
  fundamento:
    'O magnésio bloqueia receptores NMDA, antagoniza canais de cálcio e reduz a excitabilidade neuronal, além de causar vasodilatação cerebral — o que atenua o vasoespasmo e o edema associados à encefalopatia da eclâmpsia. Sua excreção é exclusivamente renal, e é por isso que a diurese é um parâmetro de monitorização tão central: rim que não filtra acumula magnésio.',
  armadilhas: [
    'A concentração das ampolas varia (10%, 20%, 50%). Erro na conversão de gramas para mililitros é a causa mais comum de superdosagem — confira sempre.',
    'Não suspenda o sulfato imediatamente após o parto: mantenha por 24 horas, período em que a maioria das eclâmpsias pós-parto ocorre.',
  ],
  referencias: [
    { texto: 'Altman D, Carroli G, Duley L, et al. Do women with pre-eclampsia, and their babies, benefit from magnesium sulphate? The Magpie Trial. Lancet. 2002;359(9321):1877-1890.' },
    { texto: 'Doyle LW, Crowther CA, Middleton P, et al. Magnesium sulphate for women at risk of preterm birth for neuroprotection of the fetus. Cochrane Database Syst Rev. 2009;(1):CD004661.' },
  ],
}

const choqueObstetrico: Ferramenta = {
  id: 'indice-choque-obstetrico',
  nome: 'Índice de choque obstétrico e hemorragia pós-parto',
  sinonimos: ['hemorragia pos-parto', 'hpp', 'indice de choque obstetrico', 'atonia uterina'],
  resumo: 'Detecta hemorragia obstétrica antes da hipotensão e organiza a conduta.',
  categorias: ['ginecologia', 'emergencia'],
  campos: [
    campoNum('fc', 'Frequência cardíaca', { unidade: 'bpm', min: 40, max: 200, passo: 1 }),
    campoNum('pas', 'PA sistólica', { unidade: 'mmHg', min: 40, max: 200, passo: 1 }),
    campoNum('perda', 'Perda sanguínea estimada', { unidade: 'mL', min: 0, max: 5000, passo: 50, opcional: true }),
    campoSeg('via', 'Via de parto', [
      { valor: 'vaginal', rotulo: 'Vaginal' },
      { valor: 'cesarea', rotulo: 'Cesariana' },
    ]),
    campoNum('hb', 'Hemoglobina', { unidade: 'g/dL', min: 2, max: 16, passo: 0.1, opcional: true }),
  ],
  calcular: (v) => {
    const fc = num(v, 'fc')
    const pas = num(v, 'pas')
    const perda = num(v, 'perda')
    const hb = num(v, 'hb')
    if (fc === null || pas === null || pas <= 0) return null
    const indice = fc / pas
    const cesarea = opc(v, 'via') === 'cesarea'
    const limiarHpp = cesarea ? 1000 : 500
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Faixa normal na gestação', valor: '0,7 a 0,9', nota: 'A gestante tem frequência mais alta e pressão mais baixa que a não gestante — o índice de choque obstétrico tem faixa própria.' },
      { rotulo: 'Limiar de alerta', valor: '≥ 0,9', nota: 'Índice ≥ 0,9 associa-se a necessidade de transfusão maciça e a desfecho adverso, muitas vezes com pressão ainda normal.', nivel: indice >= 0.9 ? 'alerta' : 'ok' },
      { rotulo: 'Limiar de gravidade', valor: '≥ 1,7', nota: 'Associa-se a desfecho materno grave e a necessidade de intervenção imediata.', nivel: indice >= 1.7 ? 'critico' : 'neutro' },
    ]
    if (perda !== null) {
      detalhes.push({ rotulo: 'Perda estimada', valor: `${fmtInt(perda)} mL`, nota: `Define hemorragia pós-parto acima de ${limiarHpp} mL (${cesarea ? 'cesariana' : 'parto vaginal'}), ou qualquer perda com repercussão hemodinâmica. A definição do ACOG usa ≥ 1000 mL para ambas as vias.`, nivel: perda >= limiarHpp ? 'alerta' : 'ok' })
      detalhes.push({ rotulo: 'Percentual da volemia', valor: fmtPct((perda / 5000) * 100, 0), nota: 'Assumindo volemia gestacional de aproximadamente 100 mL/kg — a gestante tem 30 a 50% mais volume que a não gestante, e é por isso que ela sangra muito antes de mostrar sinais.' })
    }
    if (hb !== null) detalhes.push({ rotulo: 'Hemoglobina', valor: `${fmt(hb, 1)} g/dL`, nota: 'A hemoglobina inicial não reflete a perda aguda — a hemodiluição leva horas.', nivel: hb < 7 ? 'critico' : hb < 9 ? 'alerta' : 'ok' })
    const nivel: Nivel = indice >= 1.7 ? 'critico' : indice >= 0.9 ? 'alerta' : 'ok'
    return {
      titulo: 'Índice de choque obstétrico',
      valor: fmt(indice, 2),
      nivel,
      rotuloNivel: indice >= 1.7 ? 'Choque grave' : indice >= 0.9 ? 'Alerta — provável hemorragia significativa' : 'Dentro da faixa normal para a gestação',
      detalhes,
      interpretacao: [
        '**A gestante compensa muito bem e descompensa de repente.** O aumento fisiológico de volume plasmático mascara perdas de até 1.500 mL sem hipotensão. Quando a pressão cai, a perda já é de 30 a 40% da volemia. O índice de choque detecta essa fase compensada e é superior à pressão isolada.',
        '**As quatro causas de hemorragia pós-parto (os 4 T):** **T**ônus (atonia uterina, responsável por 70 a 80% dos casos), **T**rauma (lacerações, rotura, inversão uterina), **T**ecido (restos placentários, acretismo) e **T**rombina (coagulopatia).',
        '**Sequência de tratamento da atonia:** massagem uterina bimanual, ocitocina (10 a 40 UI diluídas), depois um segundo uterotônico — misoprostol 800 µg por via retal ou sublingual, metilergometrina 0,2 mg intramuscular (contraindicada na hipertensão), carbetocina. Se não houver resposta: balão de tamponamento intrauterino, sutura de compressão de B-Lynch, ligadura de artérias uterinas ou hipogástricas, embolização e, por fim, histerectomia.',
        '**Ácido tranexâmico 1 g endovenoso em até 3 horas** do início da hemorragia reduz mortalidade por sangramento — resultado do ensaio WOMAN, com mais de 20 mil mulheres. Quanto mais precoce, maior o benefício; após 3 horas, o benefício desaparece.',
        'Acione **protocolo de transfusão maciça** com relação equilibrada de hemácias, plasma e plaquetas, e monitorize fibrinogênio: na hemorragia obstétrica ele cai precocemente, e valores abaixo de 200 mg/dL predizem hemorragia grave. Considere crioprecipitado ou concentrado de fibrinogênio.',
      ],
      alertas: ['A estimativa visual de perda sanguínea subestima em 30 a 50%. Use pesagem de compressas e coletores graduados sempre que possível.'],
    }
  },
  formula: ['Índice de choque obstétrico = frequência cardíaca ÷ PA sistólica (normal 0,7 a 0,9)'],
  fundamento:
    'A gestante a termo tem volume plasmático 40 a 50% maior e massa eritrocitária 20 a 30% maior que a não gestante — adaptação que a prepara justamente para a perda do parto. Essa reserva é também a armadilha: os sinais clássicos de choque aparecem tarde. O índice de choque captura a resposta cronotrópica compensatória, que antecede a queda pressórica.',
  armadilhas: [
    'Analgesia peridural, betabloqueador e dor alteram a frequência e distorcem o índice.',
    'A hemorragia pós-parto pode ser tardia (após 24 horas e até 12 semanas), por restos placentários, infecção ou subinvolução do leito placentário.',
  ],
  referencias: [
    { texto: 'Nathan HL, El Ayadi A, Hezelgrave NL, et al. Shock index: an effective predictor of outcome in postpartum haemorrhage? BJOG. 2015;122(2):268-275.' },
    { texto: 'WOMAN Trial Collaborators. Effect of early tranexamic acid administration on mortality in women with post-partum haemorrhage. Lancet. 2017;389(10084):2105-2116.' },
    { texto: 'ACOG Practice Bulletin No. 183: Postpartum hemorrhage. Obstet Gynecol. 2017;130(4):e168-e186.' },
  ],
}

const ila: Ferramenta = {
  id: 'indice-liquido-amniotico',
  nome: 'Índice de líquido amniótico',
  sigla: 'ILA',
  sinonimos: ['ila', 'liquido amniotico', 'oligoamnio', 'polidramnio', 'maior bolsao'],
  resumo: 'Soma os quatro quadrantes e classifica oligoâmnio e polidrâmnio.',
  categorias: ['ginecologia'],
  campos: [
    campoNum('q1', 'Quadrante superior direito', { unidade: 'cm', min: 0, max: 20, passo: 0.1 }),
    campoNum('q2', 'Quadrante superior esquerdo', { unidade: 'cm', min: 0, max: 20, passo: 0.1 }),
    campoNum('q3', 'Quadrante inferior direito', { unidade: 'cm', min: 0, max: 20, passo: 0.1 }),
    campoNum('q4', 'Quadrante inferior esquerdo', { unidade: 'cm', min: 0, max: 20, passo: 0.1 }),
    campoNum('maiorBolsao', 'Maior bolsão vertical único', { unidade: 'cm', min: 0, max: 20, passo: 0.1, opcional: true }),
    campoNum('semanas', 'Idade gestacional', { unidade: 'semanas', min: 16, max: 42, passo: 0.5, opcional: true }),
  ],
  calcular: (v) => {
    const q1 = num(v, 'q1')
    const q2 = num(v, 'q2')
    const q3 = num(v, 'q3')
    const q4 = num(v, 'q4')
    const bolsao = num(v, 'maiorBolsao')
    if (q1 === null || q2 === null || q3 === null || q4 === null) return null
    const ila = q1 + q2 + q3 + q4
    const classe = ila < 5 ? 'Oligoâmnio' : ila <= 8 ? 'Líquido reduzido (limítrofe)' : ila <= 24 ? 'Normal' : 'Polidrâmnio'
    const nivel: Nivel = ila < 5 || ila > 24 ? 'alerta' : ila <= 8 ? 'atencao' : 'ok'
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Faixa normal', valor: '8 a 24 cm', nota: 'Alguns serviços usam 5 a 25 cm.' },
    ]
    if (bolsao !== null) detalhes.push({ rotulo: 'Maior bolsão vertical', valor: `${fmt(bolsao, 1)} cm`, nota: 'Normal entre 2 e 8 cm. **É o método preferido**: em comparação direta, o índice de líquido amniótico diagnostica mais oligoâmnio sem melhorar desfechos, gerando mais induções e cesarianas desnecessárias.', nivel: bolsao < 2 ? 'alerta' : bolsao > 8 ? 'alerta' : 'ok' })
    return {
      titulo: 'Índice de líquido amniótico',
      valor: fmt(ila, 1),
      unidade: 'cm',
      nivel,
      rotuloNivel: classe,
      detalhes,
      interpretacao: [
        ila < 5
          ? '**Oligoâmnio.** Investigue rotura prematura de membranas (a causa mais comum), insuficiência placentária com restrição de crescimento, malformação do trato urinário fetal (agenesia renal, obstrução), uso materno de inibidores da ECA ou anti-inflamatórios, e pós-datismo. Avalie o bem-estar fetal e considere antecipação do parto conforme a idade gestacional e a causa.'
          : ila > 24
            ? '**Polidrâmnio.** As causas se agrupam em: diabetes materno (a mais frequente), malformações que impedem a deglutição (atresia esofágica, duodenal, anomalias do sistema nervoso central), hidropisia fetal, infecção congênita, síndrome de transfusão feto-fetal e idiopático (em cerca de 60% dos casos leves). Complicações: parto pré-termo, apresentação anômala, prolapso de cordão, rotura prematura e hemorragia pós-parto por sobredistensão.'
            : ila <= 8
              ? 'Líquido em faixa limítrofe: reavalie em curto prazo e correlacione com crescimento fetal e Doppler.'
              : 'Volume de líquido amniótico dentro da normalidade.',
        'O líquido amniótico é produzido pela **diurese fetal** a partir do segundo trimestre e reabsorvido pela **deglutição fetal**. Essa fisiologia explica quase todo o diferencial: pouco líquido aponta para produção reduzida (hipoperfusão renal por insuficiência placentária, malformação renal) ou perda (rotura de membranas); muito líquido aponta para produção aumentada (hiperglicemia fetal) ou deglutição impedida.',
        'O volume aumenta até cerca de 33 a 34 semanas (aproximadamente 800 mL) e depois declina progressivamente até o termo, chegando a cerca de 400 mL na 42ª semana. Por isso o pós-datismo cursa fisiologicamente com menos líquido.',
      ],
    }
  },
  formula: ['ILA = soma dos maiores bolsões verticais dos 4 quadrantes uterinos', 'Maior bolsão vertical único: normal entre 2 e 8 cm'],
  fundamento:
    'A técnica divide o útero em quatro quadrantes pelas linhas mediana vertical e transversa umbilical, e mede o maior bolsão vertical livre de cordão e de partes fetais em cada um. A soma correlaciona-se moderadamente com o volume real medido por diluição de corante — e essa correlação apenas moderada é a raiz das limitações do método.',
  armadilhas: [
    'O índice depende da técnica: pressão excessiva do transdutor, inclusão de alça de cordão e posição materna alteram o resultado.',
    'Revisões sistemáticas mostram que **usar o índice em vez do maior bolsão aumenta intervenções sem melhorar desfecho perinatal**. Vários serviços já adotaram o maior bolsão como método padrão.',
  ],
  referencias: [
    { texto: 'Phelan JP, Smith CV, Broussard P, Small M. Amniotic fluid volume assessment with the four-quadrant technique at 36-42 weeks gestation. J Reprod Med. 1987;32(7):540-542.' },
    { texto: 'Nabhan AF, Abdelmoula YA. Amniotic fluid index versus single deepest vertical pocket as a screening test for preventing adverse pregnancy outcome. Cochrane Database Syst Rev. 2008;(3):CD006593.' },
  ],
}

const proteinuria: Ferramenta = {
  id: 'proteina-creatinina-urinaria',
  nome: 'Relação proteína/creatinina urinária',
  sinonimos: ['proteinuria', 'relacao proteina creatinina', 'p/c urinaria', 'albuminuria'],
  resumo: 'Converte amostra isolada em estimativa de proteinúria de 24 horas.',
  categorias: ['ginecologia', 'nefrologia'],
  campos: [
    campoNum('proteina', 'Proteína urinária', { unidade: 'mg/dL', min: 1, max: 2000, passo: 1 }),
    campoNum('creatininaU', 'Creatinina urinária', { unidade: 'mg/dL', min: 5, max: 500, passo: 1 }),
    campoSeg('contexto', 'Contexto', [
      { valor: 'gestacao', rotulo: 'Gestação' },
      { valor: 'geral', rotulo: 'Nefrologia geral' },
    ]),
  ],
  calcular: (v) => {
    const p = num(v, 'proteina')
    const cr = num(v, 'creatininaU')
    if (p === null || cr === null || cr <= 0) return null
    const razao = p / cr
    const razaoMgG = razao * 1000
    const estimativa24h = razao * 1000
    const gestacao = opc(v, 'contexto') === 'gestacao'
    const corte = gestacao ? 0.3 : 0.2
    const acima = razao >= corte
    const nivel: Nivel = razao >= 3.5 ? 'critico' : acima ? 'alerta' : 'ok'
    return {
      titulo: 'Relação proteína/creatinina',
      valor: fmt(razao, 3),
      unidade: 'mg/mg',
      nivel,
      rotuloNivel: razao >= 3.5 ? 'Faixa nefrótica' : acima ? 'Proteinúria significativa' : 'Abaixo do limiar',
      detalhes: [
        { rotulo: 'Relação em mg/g', valor: `${fmtInt(razaoMgG)} mg/g` },
        { rotulo: 'Proteinúria estimada em 24 h', valor: `${fmtInt(estimativa24h)} mg/24 h`, nota: 'A relação em mg/mg aproxima diretamente a proteinúria em gramas por 24 h — 0,3 mg/mg ≈ 300 mg/dia.' },
        { rotulo: 'Ponto de corte', valor: gestacao ? '≥ 0,3 mg/mg (300 mg/g)' : '≥ 0,15 a 0,2 mg/mg', nota: gestacao ? 'Critério de proteinúria significativa na pré-eclâmpsia.' : 'Limiar de proteinúria em nefrologia geral.' },
        { rotulo: 'Faixa nefrótica', valor: '≥ 3,5 mg/mg (3,5 g/24 h)', nivel: razao >= 3.5 ? 'critico' : 'neutro' },
      ],
      interpretacao: [
        'A relação funciona porque a creatinina é excretada em ritmo razoavelmente constante ao longo do dia — cerca de 1 g por 24 horas num adulto médio. Dividir a proteína pela creatinina na mesma amostra **normaliza pela diluição urinária**, o que torna uma amostra isolada quase tão informativa quanto a coleta de 24 horas, sem os erros de coleta incompleta.',
        gestacao
          ? 'Na gestação, a relação **substituiu a coleta de 24 horas** na maioria dos protocolos para o diagnóstico de pré-eclâmpsia. A magnitude da proteinúria, porém, **não** define gravidade e não deve ser usada para indicar parto — o ACOG removeu explicitamente a "proteinúria maciça" da lista de critérios de gravidade.'
          : 'Em nefrologia, a albuminúria (relação albumina/creatinina) é preferível à proteinúria total para rastreio e estadiamento da doença renal crônica, por detectar lesão glomerular mais precocemente.',
        'A **primeira urina da manhã** é a amostra preferencial: reduz a interferência da proteinúria ortostática e do exercício.',
      ],
      alertas: ['A relação é menos confiável em extremos de massa muscular (a excreção de creatinina varia) e em lesão renal aguda com creatinina em desequilíbrio.'],
    }
  },
  formula: ['Relação = proteína urinária (mg/dL) ÷ creatinina urinária (mg/dL)', 'Proteinúria de 24 h (mg) ≈ relação (mg/mg) × 1000'],
  fundamento:
    'A coleta de 24 horas é o padrão histórico e o mais sujeito a erro: coleta incompleta, descarte da primeira micção, armazenamento inadequado. A relação em amostra isolada elimina esses problemas com uma premissa razoável — a de que a excreção de creatinina é aproximadamente constante e conhecida —, e sua concordância com a coleta de 24 horas é boa o suficiente para decisão clínica na maioria dos contextos.',
  armadilhas: [
    'Infecção urinária, hematúria macroscópica, febre, exercício intenso e ortostatismo elevam a proteinúria transitoriamente.',
    'Fita reagente detecta sobretudo albumina e pode ser negativa em proteinúria de cadeias leves (mieloma) — nesse caso, peça eletroforese de proteínas urinárias.',
  ],
  referencias: [
    { texto: 'Ginsberg JM, Chang BS, Matarese RA, Garella S. Use of single voided urine samples to estimate quantitative proteinuria. N Engl J Med. 1983;309(25):1543-1546.' },
    { texto: 'ACOG Practice Bulletin No. 222: Gestational hypertension and preeclampsia. Obstet Gynecol. 2020;135(6):e237-e260.' },
  ],
}

const ectopica: Ferramenta = {
  id: 'gravidez-ectopica',
  nome: 'Avaliação de gravidez ectópica e cinética do hCG',
  sinonimos: ['ectopica', 'hcg', 'gravidez de localizacao indeterminada', 'zona discriminatoria'],
  resumo: 'Interpreta a curva do hCG e a zona discriminatória na gestação de localização indeterminada.',
  categorias: ['ginecologia', 'emergencia'],
  campos: [
    campoNum('hcg1', 'β-hCG inicial', { unidade: 'mUI/mL', min: 1, max: 200000, passo: 1 }),
    campoNum('hcg2', 'β-hCG após 48 horas', { unidade: 'mUI/mL', min: 1, max: 200000, passo: 1, opcional: true }),
    campoNum('horas', 'Intervalo entre as dosagens', { unidade: 'h', min: 24, max: 96, passo: 1, padrao: '48', opcional: true }),
    campoSeg('usg', 'Ultrassonografia transvaginal', [
      { valor: 'indeterminada', rotulo: 'Sem saco gestacional visível' },
      { valor: 'intrauterina', rotulo: 'Gestação intrauterina visível' },
      { valor: 'ectopica', rotulo: 'Massa anexial ou gestação ectópica visível' },
    ]),
    campoSimNao('instabilidade', 'Instabilidade hemodinâmica ou sinais de abdome agudo', 1),
  ],
  calcular: (v) => {
    const h1 = num(v, 'hcg1')
    const h2 = num(v, 'hcg2')
    const horas = numOu(v, 'horas', 48)
    const usg = opc(v, 'usg')
    if (h1 === null) return null
    const zona = 3500
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Zona discriminatória', valor: `${fmtInt(zona)} mUI/mL`, nota: 'Acima desse valor, uma gestação intrauterina única e viável deveria ser visível à ultrassonografia transvaginal. O corte foi elevado de 1.500 a 2.000 para 3.500 justamente para reduzir interrupções equivocadas de gestações desejadas e viáveis.' },
      { rotulo: 'β-hCG em relação à zona', valor: h1 >= zona ? 'Acima' : 'Abaixo', nota: h1 >= zona && usg === 'indeterminada' ? 'β-hCG acima da zona discriminatória **sem** gestação intrauterina visível é altamente suspeito de gestação ectópica ou de gestação intrauterina inviável.' : undefined, nivel: h1 >= zona && usg === 'indeterminada' ? 'alerta' : 'neutro' },
    ]
    if (h2 !== null && h1 > 0) {
      const variacao = ((h2 - h1) / h1) * 100
      const variacao48 = (variacao * 48) / horas
      const minimoEsperado = h1 < 1500 ? 49 : h1 < 3000 ? 40 : 33
      detalhes.push({ rotulo: 'Variação no intervalo', valor: `${variacao >= 0 ? '+' : ''}${fmt(variacao, 1)}%`, nota: `Normalizada para 48 h: ${variacao48 >= 0 ? '+' : ''}${fmt(variacao48, 1)}%.` })
      detalhes.push({
        rotulo: 'Aumento mínimo esperado em 48 h',
        valor: `+${fmtInt(minimoEsperado)}%`,
        nota: `O aumento mínimo de uma gestação intrauterina viável depende do valor inicial: +49% se abaixo de 1.500, +40% entre 1.500 e 3.000, +33% acima de 3.000 mUI/mL.`,
        nivel: variacao48 >= minimoEsperado ? 'ok' : 'alerta',
      })
      detalhes.push({
        rotulo: 'Padrão da curva',
        valor: variacao48 >= minimoEsperado ? 'Compatível com gestação viável' : variacao48 <= -21 ? 'Queda compatível com abortamento em curso' : 'Curva anormal',
        nota: variacao48 >= minimoEsperado ? 'Não exclui ectópica, mas a torna menos provável.' : variacao48 <= -21 ? 'Queda maior que 21 a 35% em 48 h sugere gestação não viável em resolução — mas ectópica em involução também cai.' : '**Platô ou aumento subótimo é o padrão mais associado à gestação ectópica.**',
        nivel: variacao48 >= minimoEsperado ? 'ok' : 'alerta',
      })
    }
    const instavel = sim(v, 'instabilidade')
    const nivel: Nivel = instavel || usg === 'ectopica' ? 'critico' : usg === 'intrauterina' ? 'ok' : 'alerta'
    return {
      titulo: instavel ? 'Emergência cirúrgica' : usg === 'ectopica' ? 'Gestação ectópica' : usg === 'intrauterina' ? 'Gestação intrauterina confirmada' : 'Gestação de localização indeterminada',
      valor: `${fmtInt(h1)} mUI/mL`,
      nivel,
      rotuloNivel: instavel ? 'Instabilidade hemodinâmica presente' : usg === 'indeterminada' ? 'Localização ainda não definida' : '',
      detalhes,
      interpretacao: [
        instavel
          ? '**Instabilidade hemodinâmica com suspeita de ectópica é indicação de laparotomia ou laparoscopia imediata.** Não aguarde exames.'
          : usg === 'intrauterina'
            ? 'Gestação intrauterina confirmada. Gestação heterotópica (intrauterina e ectópica simultâneas) é rara em concepção espontânea (1 em 4.000 a 30.000), mas sobe para até 1 em 100 após fertilização in vitro — mantenha atenção se houver dor ou massa anexial.'
            : usg === 'ectopica'
              ? 'Gestação ectópica identificada. **Tratamento clínico com metotrexato** é opção se: estabilidade hemodinâmica, ausência de atividade cardíaca embrionária, massa menor que 3,5 a 4 cm, β-hCG abaixo de 5.000 mUI/mL, ausência de contraindicações (hepatopatia, discrasia, doença renal, imunodeficiência, aleitamento) e possibilidade de seguimento confiável. Caso contrário, tratamento cirúrgico — salpingostomia ou salpingectomia.'
              : '**Gestação de localização indeterminada.** Não intervenha com base numa única dosagem. Repita o β-hCG em 48 horas e a ultrassonografia conforme a curva. A pressa aqui interrompe gestações desejadas e viáveis.',
        'Cerca de **1 a 2% de todas as gestações são ectópicas**, e elas respondem por uma parcela desproporcional da mortalidade materna no primeiro trimestre. Fatores de risco: ectópica prévia, cirurgia tubária, doença inflamatória pélvica, endometriose, dispositivo intrauterino em uso, tabagismo e fertilização in vitro.',
        'Após metotrexato, acompanhe o β-hCG nos dias 4 e 7: **a queda esperada é de pelo menos 15% entre o 4º e o 7º dia**. Se não houver, repita a dose ou considere cirurgia. É comum o β-hCG **subir** entre o dia 1 e o dia 4 — isso não é falha.',
      ],
      alertas: ['Sempre determine o tipo sanguíneo: gestante Rh negativo com sangramento no primeiro trimestre deve receber imunoglobulina anti-D.'],
    }
  },
  formula: [
    'Aumento mínimo esperado em 48 h: +49% (hCG < 1.500) · +40% (1.500 a 3.000) · +33% (> 3.000)',
    'Zona discriminatória (transvaginal): 3.500 mUI/mL',
  ],
  fundamento:
    'A cinética do hCG numa gestação intrauterina viável é previsível: ele praticamente dobra a cada 48 horas no início, com desaceleração progressiva conforme sobe. A curva de uma ectópica é tipicamente mais lenta ou em platô, porque a implantação anômala não sustenta a proliferação trofoblástica normal. A zona discriminatória expressa a mesma lógica no eixo da imagem: acima de determinado título, o saco gestacional já deveria ser visível.',
  armadilhas: [
    '**Nenhum valor de hCG exclui ectópica.** Ectópicas ocorrem com títulos baixíssimos e altíssimos.',
    'Gestação múltipla eleva o hCG e desloca a zona discriminatória para cima — o saco pode não ser visível com títulos que seriam suficientes numa gestação única.',
    'Curva normal não garante localização intrauterina; até 20% das ectópicas têm cinética normal.',
  ],
  referencias: [
    { texto: 'ACOG Practice Bulletin No. 193: Tubal ectopic pregnancy. Obstet Gynecol. 2018;131(3):e91-e103.' },
    { texto: 'Barnhart KT. Ectopic pregnancy. N Engl J Med. 2009;361(4):379-387.' },
    { texto: 'Doubilet PM, Benson CB, Bourne T, Blaivas M. Diagnostic criteria for nonviable pregnancy early in the first trimester. N Engl J Med. 2013;369(15):1443-1451.' },
  ],
}

const sangramentoUterino: Ferramenta = {
  id: 'sangramento-uterino-anormal',
  nome: 'Classificação do sangramento uterino anormal (PALM-COEIN)',
  sinonimos: ['sangramento uterino', 'sua', 'palm-coein', 'menorragia', 'metrorragia'],
  resumo: 'Organiza o diagnóstico do sangramento uterino anormal pelo sistema FIGO.',
  categorias: ['ginecologia'],
  campos: [
    campoNum('duracao', 'Duração do sangramento', { unidade: 'dias', min: 1, max: 30, passo: 1 }),
    campoNum('intervalo', 'Intervalo entre os episódios', { unidade: 'dias', min: 5, max: 120, passo: 1 }),
    campoSeg('volume', 'Volume percebido', [
      { valor: 'normal', rotulo: 'Normal' },
      { valor: 'aumentado', rotulo: 'Aumentado' },
      { valor: 'reduzido', rotulo: 'Reduzido' },
    ]),
    campoSeg('regularidade', 'Regularidade', [
      { valor: 'regular', rotulo: 'Regular' },
      { valor: 'irregular', rotulo: 'Irregular' },
    ]),
    campoSimNao('polipo', 'Pólipo endometrial ou endocervical identificado', 1),
    campoSimNao('adenomiose', 'Adenomiose', 1),
    campoSimNao('leiomioma', 'Leiomioma (mioma)', 1),
    campoSimNao('malignidade', 'Malignidade ou hiperplasia endometrial', 1),
    campoSimNao('coagulopatia', 'Coagulopatia', 1, 'Rastreie com a triagem estruturada: sangramento menstrual intenso desde a menarca, história de hemorragia pós-parto, sangramento em cirurgia ou odontológico, equimoses frequentes, epistaxe recorrente, história familiar.'),
    campoSimNao('ovulatoria', 'Disfunção ovulatória', 1, 'Síndrome dos ovários policísticos, hipotireoidismo, hiperprolactinemia, obesidade, perimenopausa, adolescência.'),
    campoSimNao('endometrial', 'Disfunção endometrial primária', 1),
    campoSimNao('iatrogenica', 'Causa iatrogênica', 1, 'Anticoagulantes, contraceptivos hormonais, dispositivo intrauterino, tamoxifeno, antipsicóticos.'),
  ],
  calcular: (v) => {
    const duracao = num(v, 'duracao')
    const intervalo = num(v, 'intervalo')
    if (duracao === null || intervalo === null) return null
    const volumeAumentado = opc(v, 'volume') === 'aumentado'
    const irregular = opc(v, 'regularidade') === 'irregular'
    const prolongado = duracao > 8
    const frequente = intervalo < 24
    const infrequente = intervalo > 38
    const anormal = volumeAumentado || irregular || prolongado || frequente || infrequente
    const estruturais = [
      sim(v, 'polipo') && 'P — Pólipo',
      sim(v, 'adenomiose') && 'A — Adenomiose',
      sim(v, 'leiomioma') && 'L — Leiomioma',
      sim(v, 'malignidade') && 'M — Malignidade / hiperplasia',
    ].filter(Boolean) as string[]
    const naoEstruturais = [
      sim(v, 'coagulopatia') && 'C — Coagulopatia',
      sim(v, 'ovulatoria') && 'O — Disfunção ovulatória',
      sim(v, 'endometrial') && 'E — Disfunção endometrial',
      sim(v, 'iatrogenica') && 'I — Iatrogênica',
    ].filter(Boolean) as string[]
    const naoClassificada = anormal && estruturais.length === 0 && naoEstruturais.length === 0
    return {
      titulo: anormal ? 'Sangramento uterino anormal' : 'Padrão menstrual dentro da normalidade',
      valor: estruturais.length + naoEstruturais.length > 0 ? [...estruturais, ...naoEstruturais].join(' · ') : naoClassificada ? 'N — Não classificado' : 'Sem causa identificada',
      nivel: sim(v, 'malignidade') ? 'critico' : anormal ? 'alerta' : 'ok',
      rotuloNivel: `${fmtInt(duracao)} dias a cada ${fmtInt(intervalo)} dias`,
      detalhes: [
        { rotulo: 'Duração', valor: `${fmtInt(duracao)} dias`, nota: 'Normal: até 8 dias. Acima disso, sangramento prolongado.', nivel: prolongado ? 'alerta' : 'ok' },
        { rotulo: 'Frequência', valor: `a cada ${fmtInt(intervalo)} dias`, nota: 'Normal: 24 a 38 dias. Menos que 24 é frequente; mais que 38 é infrequente.', nivel: frequente || infrequente ? 'alerta' : 'ok' },
        { rotulo: 'Regularidade', valor: irregular ? 'Irregular' : 'Regular', nota: 'Normal: variação de até 7 a 9 dias entre os ciclos mais curto e mais longo do ano.' },
        { rotulo: 'Volume', valor: volumeAumentado ? 'Aumentado' : opc(v, 'volume') === 'reduzido' ? 'Reduzido' : 'Normal', nota: 'A definição atual é funcional: sangramento que interfere na qualidade de vida física, emocional, social ou material.' },
        { rotulo: 'Causas estruturais (PALM)', valor: estruturais.length ? estruturais.join(', ') : 'nenhuma identificada' },
        { rotulo: 'Causas não estruturais (COEIN)', valor: naoEstruturais.length ? naoEstruturais.join(', ') : 'nenhuma identificada' },
      ],
      interpretacao: [
        'O sistema **PALM-COEIN** da FIGO organiza o diagnóstico em duas metades. **PALM** reúne as causas **estruturais**, visíveis em imagem ou histologia: Pólipo, Adenomiose, Leiomioma, Malignidade e hiperplasia. **COEIN** reúne as **não estruturais**: Coagulopatia, disfunção Ovulatória, disfunção Endometrial, Iatrogênica e Não classificada.',
        'A grande virtude do sistema é permitir **múltiplos diagnósticos simultâneos**. Uma paciente pode ter mioma e disfunção ovulatória ao mesmo tempo, e presumir que o mioma explica tudo é o erro que o sistema foi desenhado para evitar.',
        '**Investigação:** hemograma e ferritina em toda paciente; β-hCG obrigatório em idade fértil; TSH e prolactina se houver irregularidade; rastreio de coagulopatia em adolescentes e em quem tem história sugestiva (a doença de von Willebrand está presente em cerca de 13% das mulheres com sangramento menstrual intenso). **Ultrassonografia transvaginal** é o exame de imagem inicial; a histerossonografia detecta melhor lesões da cavidade.',
        '**Biópsia endometrial** está indicada acima de 45 anos com sangramento anormal, ou abaixo dessa idade com fatores de risco para hiperplasia (obesidade, anovulação crônica, síndrome dos ovários policísticos, exposição a estrogênio sem oposição, uso de tamoxifeno, síndrome de Lynch) ou com falha do tratamento clínico.',
        '**Tratamento clínico de primeira linha:** sistema intrauterino liberador de levonorgestrel, que é a opção mais eficaz para sangramento menstrual intenso. Alternativas: anticoncepcional combinado, progestagênio cíclico ou contínuo, ácido tranexâmico (reduz o volume em 30 a 60%) e anti-inflamatórios não esteroidais.',
      ],
      alertas: sim(v, 'malignidade') ? ['Malignidade ou hiperplasia identificada exige estadiamento e encaminhamento oncológico imediato.'] : undefined,
    }
  },
  formula: ['PALM (estruturais): Pólipo · Adenomiose · Leiomioma · Malignidade', 'COEIN (não estruturais): Coagulopatia · Ovulatória · Endometrial · Iatrogênica · Não classificada'],
  fundamento:
    'A FIGO publicou o sistema em 2011 para acabar com uma babel terminológica: menorragia, metrorragia, menometrorragia, hipermenorreia e sangramento uterino disfuncional eram usados de formas inconsistentes e frequentemente contraditórias entre autores e países. O novo sistema descreve o sangramento por parâmetros objetivos (frequência, duração, regularidade, volume) e a etiologia por uma lista fechada.',
  armadilhas: [
    'Termos como "menorragia" e "sangramento uterino disfuncional" foram formalmente abandonados — evite-os na documentação.',
    'Sangramento pós-menopausa é categoria à parte e exige investigação de neoplasia endometrial em **todos** os casos, independentemente do volume.',
  ],
  referencias: [
    { texto: 'Munro MG, Critchley HOD, Fraser IS, et al. The two FIGO systems for normal and abnormal uterine bleeding symptoms and classification of causes of abnormal uterine bleeding in the reproductive years: 2018 revisions. Int J Gynaecol Obstet. 2018;143(3):393-408.' },
  ],
}

const tevGestacao: Ferramenta = {
  id: 'risco-tev-gestacao',
  nome: 'Risco de tromboembolismo na gestação e puerpério',
  sinonimos: ['tromboembolismo gestacao', 'tev gestante', 'rcog', 'profilaxia gestacao'],
  resumo: 'Estratifica o risco trombótico obstétrico e define a profilaxia.',
  categorias: ['ginecologia', 'hematologia'],
  campos: [
    campoSeg('momento', 'Momento', [
      { valor: 'anteparto', rotulo: 'Anteparto' },
      { valor: 'posparto', rotulo: 'Pós-parto' },
    ]),
    campoSimNao('tevPrevio', 'Tromboembolismo venoso prévio', 4, 'Exceto evento único relacionado a cirurgia maior, que vale 3 pontos.'),
    campoSimNao('trombofiliaAlto', 'Trombofilia de alto risco', 3, 'Deficiência de antitrombina, síndrome antifosfolípide, homozigose para fator V de Leiden ou protrombina G20210A, heterozigose combinada.'),
    campoSimNao('trombofiliaBaixo', 'Trombofilia de baixo risco', 1, 'Heterozigose para fator V de Leiden ou protrombina, deficiência de proteína C ou S.'),
    campoSimNao('comorbidade', 'Comorbidade clínica', 3, 'Câncer, insuficiência cardíaca, lúpus ativo, doença inflamatória intestinal, síndrome nefrótica, diabetes tipo 1 com nefropatia, anemia falciforme, uso de droga injetável.'),
    campoSimNao('idade', 'Idade > 35 anos', 1),
    campoSimNao('obesidade', 'IMC ≥ 30', 1),
    campoSimNao('obesidadeGrave', 'IMC ≥ 40', 1),
    campoSimNao('paridade', 'Paridade ≥ 3', 1),
    campoSimNao('tabagismo', 'Tabagismo', 1),
    campoSimNao('varizes', 'Varizes volumosas', 1),
    campoSimNao('preEclampsia', 'Pré-eclâmpsia nesta gestação', 1),
    campoSimNao('imobilidade', 'Imobilidade, desidratação ou hiperêmese', 1),
    campoSimNao('multipla', 'Gestação múltipla ou reprodução assistida', 1),
    campoSimNao('cesarea', 'Cesariana', 2, 'Cesariana de emergência vale 2 pontos; eletiva vale 1.'),
    campoSimNao('hemorragia', 'Hemorragia pós-parto > 1 L ou transfusão', 1),
    campoSimNao('prolongado', 'Trabalho de parto prolongado (> 24 h) ou parto instrumentado médio', 1),
    campoSimNao('pretermo', 'Parto pré-termo (< 37 semanas) nesta gestação', 1),
  ],
  calcular: (v) => {
    const posParto = opc(v, 'momento') === 'posparto'
    const total = somaSimNao(v, [
      { id: 'tevPrevio', pontos: 4 },
      { id: 'trombofiliaAlto', pontos: 3 },
      { id: 'trombofiliaBaixo', pontos: 1 },
      { id: 'comorbidade', pontos: 3 },
      { id: 'idade', pontos: 1 },
      { id: 'obesidade', pontos: 1 },
      { id: 'obesidadeGrave', pontos: 1 },
      { id: 'paridade', pontos: 1 },
      { id: 'tabagismo', pontos: 1 },
      { id: 'varizes', pontos: 1 },
      { id: 'preEclampsia', pontos: 1 },
      { id: 'imobilidade', pontos: 1 },
      { id: 'multipla', pontos: 1 },
      { id: 'cesarea', pontos: 2 },
      { id: 'hemorragia', pontos: 1 },
      { id: 'prolongado', pontos: 1 },
      { id: 'pretermo', pontos: 1 },
    ])
    const corte = posParto ? 2 : 4
    const indicada = total >= corte
    const duracao = posParto ? (total >= 3 ? '6 semanas' : '10 dias') : 'Durante toda a gestação, a partir do primeiro trimestre'
    return {
      titulo: 'Escore de risco trombótico obstétrico',
      valor: String(total),
      unidade: 'pontos',
      nivel: indicada ? 'alerta' : 'ok',
      rotuloNivel: indicada ? 'Profilaxia indicada' : 'Profilaxia não indicada por este escore',
      detalhes: [
        { rotulo: 'Ponto de corte', valor: posParto ? '≥ 2 pontos (pós-parto)' : '≥ 4 pontos (anteparto)', nota: 'No anteparto, 3 pontos indicam profilaxia a partir de 28 semanas.' },
        { rotulo: 'Duração recomendada', valor: indicada ? duracao : '—' },
        { rotulo: 'Agente', valor: 'Heparina de baixo peso molecular', nota: 'Enoxaparina 40 mg/dia, com ajuste por peso: 20 mg se < 50 kg; 40 mg de 50 a 90 kg; 60 mg de 91 a 130 kg; 80 mg de 131 a 170 kg; acima disso, 0,6 mg/kg/dia.' },
      ],
      interpretacao: [
        'A gestação é um **estado protrombótico fisiológico**: aumentam os fatores I, VII, VIII, IX e X, cai a proteína S livre, surge resistência adquirida à proteína C ativada e a fibrinólise é inibida pelos inibidores do ativador de plasminogênio 1 e 2. Some-se a estase por compressão da veia cava e a lesão endotelial do parto, e a tríade de Virchow está completa.',
        'O risco é **cerca de 5 vezes maior** durante a gestação e **20 a 60 vezes maior** nas primeiras 6 semanas de puerpério — com pico nos primeiros 7 dias. É por isso que o ponto de corte pós-parto é mais baixo.',
        '**Heparina de baixo peso molecular é o agente de escolha**: não atravessa a placenta, tem melhor perfil de segurança que a heparina não fracionada e não exige monitorização de rotina. **Varfarina é teratogênica** (embriopatia varfarínica entre 6 e 12 semanas) e os anticoagulantes orais diretos são contraindicados na gestação e na amamentação por falta de dados.',
        'Programe a suspensão para o parto: **24 horas antes** de indução ou cesariana eletiva com dose profilática, e respeite os intervalos para anestesia neuroaxial — 12 horas após dose profilática e 24 horas após dose terapêutica.',
      ],
      alertas: ['Trombose venosa profunda na gestação é predominantemente **à esquerda** (mais de 80%) e **proximal ou iliofemoral**, pela compressão da veia ilíaca esquerda pela artéria ilíaca direita. Dor em flanco, região lombar ou todo o membro exige ultrassonografia com avaliação de veias ilíacas.'],
    }
  },
  formula: ['Soma ponderada de fatores; profilaxia se ≥ 4 pontos no anteparto ou ≥ 2 no pós-parto (RCOG Green-top Guideline No. 37a)'],
  fundamento:
    'O escore do Royal College of Obstetricians and Gynaecologists é o modelo de avaliação de risco obstétrico mais usado no mundo. Ele pesa três categorias: fatores preexistentes (trombose prévia, trombofilia, comorbidade), fatores obstétricos (gestação múltipla, pré-eclâmpsia, via de parto, hemorragia) e fatores transitórios (imobilidade, infecção, hiperêmese).',
  armadilhas: [
    'O tromboembolismo é uma das principais causas diretas de morte materna em países de alta renda, e o subdiagnóstico é o problema central — os sintomas se confundem com queixas fisiológicas da gestação.',
    'D-dímero tem valor limitado na gestação: sobe fisiologicamente com a idade gestacional e raramente exclui.',
  ],
  referencias: [
    { texto: 'Royal College of Obstetricians and Gynaecologists. Reducing the risk of venous thromboembolism during pregnancy and the puerperium. Green-top Guideline No. 37a. 2015.' },
    { texto: 'Bates SM, Rajasekhar A, Middeldorp S, et al. American Society of Hematology 2018 guidelines for management of venous thromboembolism in the context of pregnancy. Blood Adv. 2018;2(22):3317-3359.' },
  ],
}

const ferroGestacao: Ferramenta = {
  id: 'ferro-gestacao',
  nome: 'Anemia e reposição de ferro na gestação',
  sinonimos: ['anemia gestacional', 'ferro na gravidez', 'suplementacao de ferro'],
  resumo: 'Aplica os pontos de corte por trimestre e calcula a reposição.',
  categorias: ['ginecologia', 'hematologia', 'nutricao'],
  campos: [
    campoNum('hb', 'Hemoglobina', { unidade: 'g/dL', min: 3, max: 16, passo: 0.1 }),
    campoNum('trimestre', 'Trimestre', { min: 1, max: 3, passo: 1, padrao: '2' }),
    campoNum('ferritina', 'Ferritina', { unidade: 'ng/mL', min: 1, max: 1000, passo: 1, opcional: true }),
    campoPeso(),
    campoNum('semanas', 'Idade gestacional', { unidade: 'semanas', min: 4, max: 42, passo: 0.5 }),
  ],
  calcular: (v) => {
    const hb = num(v, 'hb')
    const trimestre = numOu(v, 'trimestre', 2)
    const ferritina = num(v, 'ferritina')
    const peso = num(v, 'peso')
    const semanas = num(v, 'semanas')
    if (hb === null || peso === null || semanas === null) return null
    const corte = trimestre === 2 ? 10.5 : 11
    const anemia = hb < corte
    const gravidade = hb < 7 ? 'grave' : hb < 9 ? 'moderada' : hb < corte ? 'leve' : 'ausente'
    const deficit = peso * (12 - hb) * 2.4 + 500
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Ponto de corte do trimestre', valor: `${fmt(corte, 1)} g/dL`, nota: 'A OMS usa 11 g/dL no primeiro e no terceiro trimestres e 10,5 g/dL no segundo — a queda fisiológica reflete a hemodiluição, que é máxima entre 28 e 34 semanas.' },
      { rotulo: 'Suplementação profilática', valor: '30 a 60 mg de ferro elementar por dia', nota: 'Recomendada a **todas** as gestantes, com ácido fólico 400 µg — este iniciado idealmente 1 a 3 meses antes da concepção.' },
    ]
    if (anemia) {
      detalhes.push({ rotulo: 'Dose de tratamento', valor: '100 a 200 mg de ferro elementar por dia', nota: 'Em dose única diária ou em dias alternados — que absorve mais ferro total por evitar a elevação sustentada de hepcidina.' })
      detalhes.push({ rotulo: 'Déficit estimado (Ganzoni)', valor: `${fmtInt(deficit)} mg`, nota: 'Para alvo de hemoglobina de 12 g/dL, incluindo 500 mg de reserva.' })
      detalhes.push({ rotulo: 'Ferro endovenoso', valor: semanas >= 13 ? 'Permitido a partir do 2º trimestre' : 'Evitar no 1º trimestre', nota: 'Indicado em intolerância ou falha do ferro oral, anemia moderada a grave com gestação avançada, ou necessidade de correção rápida. Carboximaltose e derisomaltose são as formulações preferidas.', nivel: semanas < 13 ? 'atencao' : 'ok' })
    }
    if (ferritina !== null) detalhes.push({ rotulo: 'Ferritina', valor: `${fmtInt(ferritina)} ng/mL`, nota: ferritina < 30 ? 'Abaixo de 30 ng/mL confirma deficiência de ferro. Na gestação, alguns autores usam corte de 30 e outros de 15 — o de 30 tem melhor sensibilidade.' : 'Estoque de ferro provavelmente adequado; considere outras causas de anemia.', nivel: ferritina < 30 ? 'alerta' : 'ok' })
    const nivel: Nivel = hb < 7 ? 'critico' : hb < 9 ? 'alerta' : anemia ? 'atencao' : 'ok'
    return {
      titulo: anemia ? `Anemia ${gravidade} na gestação` : 'Sem anemia',
      valor: `${fmt(hb, 1)} g/dL`,
      nivel,
      rotuloNivel: `${fmtInt(trimestre)}º trimestre · ${fmt(semanas, 1)} semanas`,
      detalhes,
      interpretacao: [
        'A gestação aumenta a necessidade de ferro em cerca de **1.000 mg no total**: 300 mg para o feto e a placenta, 500 mg para a expansão da massa eritrocitária materna e 200 mg de perdas basais. Poucas mulheres iniciam a gestação com estoque suficiente para isso, e é por essa razão que a suplementação profilática é universal.',
        'A **hemodiluição fisiológica** explica a queda da hemoglobina: o volume plasmático aumenta 40 a 50%, mais do que a massa eritrocitária (20 a 30%). Essa "anemia dilucional" é adaptativa — melhora a perfusão placentária ao reduzir a viscosidade e protege contra a perda sanguínea do parto.',
        'A anemia materna associa-se a parto pré-termo, baixo peso ao nascer, maior necessidade de transfusão e depressão pós-parto. E a deficiência de ferro **sem** anemia também importa: associa-se a fadiga materna e a estoques neonatais reduzidos.',
        'Anemia que não responde ao ferro oral em 2 a 4 semanas exige reinvestigação: hemoglobinopatia (talassemia é comum e o índice de Mentzer ajuda), deficiência de B12 ou folato, doença crônica, parasitose, perda oculta e má adesão.',
      ],
      alertas: hb < 7 ? ['Hemoglobina abaixo de 7 g/dL próximo ao termo é situação de risco: considere ferro endovenoso e planeje o parto em serviço com hemocomponentes disponíveis.'] : undefined,
    }
  },
  formula: ['Anemia na gestação: Hb < 11 g/dL (1º e 3º trimestres) ou < 10,5 g/dL (2º trimestre)', 'Déficit de ferro (Ganzoni) = peso × (Hb alvo − Hb atual) × 2,4 + 500 mg'],
  fundamento:
    'A queda fisiológica da hemoglobina no segundo trimestre é o motivo do ponto de corte mais baixo nesse período: a expansão plasmática atinge o pico relativo por volta de 28 a 34 semanas, quando a diluição é máxima. Ignorar essa curva leva a diagnosticar anemia em gestantes normais no segundo trimestre e a deixar de diagnosticá-la no primeiro.',
  armadilhas: [
    'A ferritina é proteína de fase aguda e sobe na inflamação, mascarando deficiência real. Na dúvida, avalie saturação de transferrina ou receptor solúvel de transferrina.',
    'Ferro e cálcio competem pela absorção — não administre juntos.',
  ],
  referencias: [
    { texto: 'World Health Organization. Haemoglobin concentrations for the diagnosis of anaemia and assessment of severity. Genebra: WHO; 2011.' },
    { texto: 'Pavord S, Daru J, Prasannan N, et al. UK guidelines on the management of iron deficiency in pregnancy. Br J Haematol. 2020;188(6):819-830.' },
  ],
}

const rmi: Ferramenta = {
  id: 'risco-cancer-ovario',
  nome: 'Índice de risco de malignidade ovariana',
  sigla: 'RMI',
  sinonimos: ['rmi', 'cancer de ovario', 'massa anexial', 'ca-125', 'tumor de ovario'],
  resumo: 'Estima a probabilidade de malignidade de uma massa anexial e orienta o encaminhamento.',
  categorias: ['ginecologia'],
  campos: [
    campoNum('ca125', 'CA-125', { unidade: 'U/mL', min: 1, max: 10000, passo: 1 }),
    campoSeg('menopausa', 'Estado menopausal', [
      { valor: 'pre', rotulo: 'Pré-menopausa' },
      { valor: 'pos', rotulo: 'Pós-menopausa' },
    ], { ajuda: 'Pós-menopausa: mais de 1 ano de amenorreia, ou idade acima de 50 anos em histerectomizadas.' }),
    campoSimNao('multilocular', 'Cisto multilocular', 1),
    campoSimNao('solida', 'Áreas sólidas', 1),
    campoSimNao('bilateral', 'Lesão bilateral', 1),
    campoSimNao('ascite', 'Ascite', 1),
    campoSimNao('metastases', 'Metástases intra-abdominais', 1),
  ],
  calcular: (v) => {
    const ca125 = num(v, 'ca125')
    if (ca125 === null) return null
    const caracteristicas = ['multilocular', 'solida', 'bilateral', 'ascite', 'metastases'].filter((id) => sim(v, id)).length
    const u = caracteristicas === 0 ? 0 : caracteristicas === 1 ? 1 : 3
    const pos = opc(v, 'menopausa') === 'pos'
    const m = pos ? 3 : 1
    const rmi = u * m * ca125
    const alto = rmi > 200
    return {
      titulo: 'Índice de risco de malignidade',
      valor: fmtInt(rmi),
      nivel: rmi > 1000 ? 'critico' : alto ? 'alerta' : rmi > 25 ? 'atencao' : 'ok',
      rotuloNivel: alto ? 'Alto risco de malignidade' : 'Baixo risco',
      detalhes: [
        { rotulo: 'U — características ultrassonográficas', valor: String(u), nota: `${caracteristicas} característica(s) presente(s). 0 características = 0 ponto; 1 = 1 ponto; 2 ou mais = 3 pontos.` },
        { rotulo: 'M — estado menopausal', valor: String(m), nota: pos ? 'Pós-menopausa = 3.' : 'Pré-menopausa = 1.' },
        { rotulo: 'CA-125', valor: `${fmtInt(ca125)} U/mL` },
        { rotulo: 'Ponto de corte', valor: '> 200', nota: 'Sensibilidade em torno de 78% e especificidade de 87% para malignidade.' },
      ],
      interpretacao: [
        alto
          ? '**Alto risco.** Encaminhe a um serviço de ginecologia oncológica. A cirurgia inicial realizada por ginecologista oncológico associa-se a estadiamento mais completo, maior taxa de citorredução ótima e melhor sobrevida — é um dos fatores prognósticos mais fortes e mais modificáveis do câncer de ovário.'
          : 'Baixo risco pelo índice. Isso não descarta malignidade: mantenha acompanhamento e reavalie conforme a evolução clínica e de imagem.',
        '**O CA-125 tem baixa especificidade em pré-menopausa.** Ele se eleva em endometriose, doença inflamatória pélvica, miomas, gestação, menstruação, cirrose com ascite, insuficiência cardíaca, tuberculose peritoneal e derrames de qualquer natureza — porque é expresso pelo epitélio celômico, não apenas pelo ovário.',
        '**Não use CA-125 para rastreio populacional.** Os grandes ensaios (PLCO e UKCTOCS) não demonstraram redução de mortalidade por câncer de ovário com rastreio, e geraram cirurgias desnecessárias com complicações.',
        'Em mulheres jovens com massa anexial, considere tumores de células germinativas e dose marcadores específicos: alfafetoproteína, β-hCG e desidrogenase láctica.',
        'Alternativas com desempenho igual ou superior: **ROMA** (que combina CA-125 e HE4 com estado menopausal) e as regras **IOTA Simple Rules**, baseadas exclusivamente em características ultrassonográficas.',
      ],
      alertas: ['Massa anexial com ascite e elevação importante de CA-125 em pós-menopausa é câncer de ovário até prova em contrário — não puncione o cisto nem faça cirurgia laparoscópica com risco de rotura da cápsula fora de um centro de referência.'],
    }
  },
  formula: ['RMI = U × M × CA-125', 'U = 0 (nenhuma característica), 1 (uma) ou 3 (duas ou mais)', 'M = 1 (pré-menopausa) ou 3 (pós-menopausa)'],
  fundamento:
    'Jacobs e colaboradores propuseram o índice em 1990 combinando os três preditores independentes mais fortes de malignidade em massa anexial. A multiplicação, em vez da soma, é intencional: ela amplifica o efeito quando os três fatores se somam, refletindo a interação real entre eles — CA-125 alto em pós-menopausa com massa complexa é muito mais preocupante do que qualquer um dos três isoladamente.',
  armadilhas: [
    'A avaliação ultrassonográfica é operador-dependente, e é a principal fonte de variabilidade do índice.',
    'Existem variantes do índice (RMI 1, 2, 3 e 4) com pontuações e cortes diferentes. Padronize uma no serviço.',
  ],
  referencias: [
    { texto: 'Jacobs I, Oram D, Fairbanks J, et al. A risk of malignancy index incorporating CA 125, ultrasound and menopausal status for the accurate preoperative diagnosis of ovarian cancer. Br J Obstet Gynaecol. 1990;97(10):922-929.' },
    { texto: 'Timmerman D, Van Calster B, Testa A, et al. Predicting the risk of malignancy in adnexal masses based on the Simple Rules from the IOTA group. Am J Obstet Gynecol. 2016;214(4):424-437.' },
  ],
}

const periodoFertil: Ferramenta = {
  id: 'periodo-fertil',
  nome: 'Estimativa do período fértil',
  sinonimos: ['periodo fertil', 'ovulacao', 'janela fertil', 'tabelinha'],
  resumo: 'Estima a janela fértil pelo método do calendário — apenas como referência educativa.',
  categorias: ['ginecologia'],
  campos: [
    campoNum('diasDesdeMenstruacao', 'Dias desde o primeiro dia da última menstruação', { unidade: 'dias', min: 0, max: 60, passo: 1 }),
    campoNum('cicloCurto', 'Ciclo mais curto dos últimos 6 a 12 meses', { unidade: 'dias', min: 20, max: 45, passo: 1, padrao: '28' }),
    campoNum('cicloLongo', 'Ciclo mais longo dos últimos 6 a 12 meses', { unidade: 'dias', min: 20, max: 60, passo: 1, padrao: '28' }),
  ],
  calcular: (v) => {
    const dias = num(v, 'diasDesdeMenstruacao')
    const curto = num(v, 'cicloCurto')
    const longo = num(v, 'cicloLongo')
    if (dias === null || curto === null || longo === null) return null
    const primeiroFertil = curto - 18
    const ultimoFertil = longo - 11
    const ovulacaoEstimada = Math.round((curto + longo) / 2) - 14
    const dentro = dias >= primeiroFertil && dias <= ultimoFertil
    const variabilidade = longo - curto
    const regular = variabilidade <= 7
    return {
      titulo: 'Janela fértil estimada',
      valor: `dia ${fmtInt(primeiroFertil)} ao dia ${fmtInt(ultimoFertil)}`,
      nivel: dentro ? 'atencao' : 'neutro',
      rotuloNivel: dentro ? 'Hoje está dentro da janela estimada' : 'Hoje está fora da janela estimada',
      detalhes: [
        { rotulo: 'Dia atual do ciclo', valor: `${fmtInt(dias)}º dia` },
        { rotulo: 'Ovulação estimada', valor: `${fmtInt(ovulacaoEstimada)}º dia do ciclo`, nota: 'A fase lútea é a mais constante (13 a 15 dias); a variabilidade dos ciclos vem quase toda da fase folicular.' },
        { rotulo: 'Variabilidade dos ciclos', valor: `${fmtInt(variabilidade)} dias`, nota: regular ? 'Ciclos regulares (variação ≤ 7 dias).' : '**Ciclos irregulares (variação > 7 dias): o método do calendário perde qualquer confiabilidade.**', nivel: regular ? 'ok' : 'alerta' },
        { rotulo: 'Sobrevida dos gametas', valor: 'Espermatozoide até 5 dias · óvulo 12 a 24 h', nota: 'É a sobrevida do espermatozoide que estende a janela fértil para os dias que **antecedem** a ovulação.' },
      ],
      interpretacao: [
        '⚠ **Esta ferramenta é educativa e não serve como método contraceptivo.** O método do calendário tem taxa de falha de **12 a 24% ao ano no uso típico** — entre os mais altos de todos os métodos. Para contracepção, use métodos com eficácia comprovada.',
        'A janela fértil real dura cerca de 6 dias: os 5 que antecedem a ovulação mais o dia dela. A assimetria existe porque o espermatozoide sobrevive até 5 dias no muco cervical fértil, enquanto o óvulo permanece viável por apenas 12 a 24 horas.',
        '**Para quem busca engravidar**, os sinais mais confiáveis de ovulação são: muco cervical do tipo clara de ovo (elástico, transparente, filante), teste de ovulação urinário (detecta o pico de LH, que antecede a ovulação em 24 a 36 horas) e elevação sustentada da temperatura basal em 0,3 a 0,5 °C — esta última só confirma **depois** que a ovulação aconteceu, e por isso não ajuda a programar.',
        'Relações a cada 1 a 2 dias durante a janela fértil maximizam a chance. Casais com relações regulares e sem contracepção têm cerca de 85% de chance de gestação em 12 meses; a investigação de infertilidade se inicia após 12 meses, ou após 6 meses acima dos 35 anos.',
      ],
      alertas: ['Ciclos irregulares, uso recente de contraceptivo hormonal, amamentação e perimenopausa invalidam o cálculo.'],
    }
  },
  formula: [
    'Primeiro dia fértil = ciclo mais curto − 18',
    'Último dia fértil = ciclo mais longo − 11',
    'Ovulação ≈ 14 dias antes da próxima menstruação',
  ],
  fundamento:
    'O método de Ogino-Knaus parte de uma constância biológica real: a fase lútea, entre a ovulação e a menstruação, dura de forma bastante estável 13 a 15 dias em quase todas as mulheres. A fase folicular, ao contrário, varia muito — e é por isso que se conta a ovulação **de trás para frente**, a partir da próxima menstruação, e não a partir da anterior.',
  armadilhas: [
    'Estresse, doença, viagem, mudança de peso e exercício intenso deslocam a ovulação de forma imprevisível.',
    'Sangramento de escape pode ser confundido com menstruação, deslocando toda a contagem.',
  ],
  referencias: [
    { texto: 'Wilcox AJ, Weinberg CR, Baird DD. Timing of sexual intercourse in relation to ovulation. N Engl J Med. 1995;333(23):1517-1521.' },
    { texto: 'Trussell J. Contraceptive failure in the United States. Contraception. 2011;83(5):397-404.' },
  ],
}

export const ferramentas: Ferramenta[] = [
  idadeGestacional,
  ganhoPeso,
  bishop,
  preEclampsia,
  sulfatoMagnesio,
  choqueObstetrico,
  ila,
  proteinuria,
  ectopica,
  sangramentoUterino,
  tevGestacao,
  ferroGestacao,
  rmi,
  periodoFertil,
]

export default ferramentas
