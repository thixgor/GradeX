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
      conduta: [
        'Fixe a idade gestacional **uma única vez** e não a recalcule ao longo do pré-natal. A datação definida no primeiro exame confiável é a régua contra a qual todo o crescimento fetal será medido; redatar por ultrassonografia tardia apaga justamente a restrição de crescimento que se quer detectar.',
        'Prefira a **ultrassonografia do primeiro trimestre (comprimento cabeça-nádega entre 7 e 13 semanas)**: ela erra ± 5 a 7 dias, contra ± 2 semanas no segundo trimestre e ± 3 semanas no terceiro. Corrija a data da última menstruação se a divergência for maior que 5 dias antes de 9 semanas, ou maior que 7 dias entre 9 e 13 semanas.',
        'Use a idade gestacional para posicionar as decisões no tempo: rastreio de aneuploidias com translucência nucal entre 11 e 13 semanas e 6 dias, morfológico entre 20 e 24 semanas, rastreio de diabetes gestacional entre 24 e 28 semanas, corticoide antenatal entre 24 e 34 semanas, e *Streptococcus* do grupo B entre 35 e 37 semanas. Errar a datação faz perder todas essas janelas.',
        '**Termo** vai de 37 a 41 semanas e 6 dias, subdividido em precoce (37–38 s 6 d), pleno (39–40 s 6 d) e tardio (41 s). Não programe parto eletivo antes de 39 semanas sem indicação médica: o termo precoce tem mais desconforto respiratório e internação neonatal.',
        'A partir de **41 semanas**, inicie vigilância anteparto (cardiotocografia e índice de líquido amniótico duas vezes por semana) e ofereça indução — a indução em 41 semanas reduz mortalidade perinatal e cesárea em comparação com a conduta expectante até 42.',
      ],
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
    { texto: 'Committee on Obstetric Practice. ACOG Committee Opinion No. 831: Medically Indicated Late-Preterm and Early-Term Deliveries. Obstet Gynecol. 2021;138(1):e35-e39.' },
  ],
}

const ganhoPeso: Ferramenta = {
  id: 'ganho-peso-gestacao',
  nome: 'Ganho de peso recomendado na gestação',
  sinonimos: ['ganho de peso gestante', 'iom', 'peso na gravidez'],
  resumo: 'Define a faixa total e a velocidade semanal de ganho conforme o IMC pré-gestacional.',
  categorias: ['ginecologia', 'nutricao'],
  campos: [
    campoNum('pesoPre', 'Peso pré-gestacional', { unidade: 'kg', min: 30, max: 200, passo: 0.1, ajuda: 'Peso antes da concepção, ou o da primeira consulta se ela ocorreu até 12 semanas. Prefira SEMPRE um registro documentado ao autorrelato, que costuma ser subestimado — 3 a 4 kg de erro deslocam a faixa de IMC e mudam toda a recomendação.' }),
    campoAltura(),
    campoNum('pesoAtual', 'Peso atual', { unidade: 'kg', min: 30, max: 220, passo: 0.1, ajuda: 'Medido na mesma balança e com roupas leves, para que a curva seja comparável entre consultas. Ganho abrupto com edema no terceiro trimestre pode ser pré-eclâmpsia, não nutrição.' }),
    campoNum('semanas', 'Idade gestacional atual', { unidade: 'semanas', min: 4, max: 42, passo: 0.5, ajuda: 'O ganho não é linear: no primeiro trimestre espera-se apenas 0,5 a 2 kg no total, e a taxa semanal recomendada vale para o segundo e o terceiro trimestres. Aplicá-la desde a concepção superestima o esperado.' }),
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
        'A gestação é deliberadamente um estado de **resistência insulínica progressiva**, e entender isso explica tanto as faixas de ganho quanto o risco do excesso. A partir da segunda metade da gestação, o lactogênio placentário humano, o hormônio do crescimento placentário, a progesterona, o cortisol e o TNF-α reduzem a sensibilidade materna à insulina em 50 a 60%. O propósito é teleológico: ao dificultar a captação materna de glicose, esses hormônios mantêm a glicemia materna mais alta por mais tempo após as refeições, garantindo gradiente para a transferência placentária — que ocorre por **difusão facilitada** via GLUT1, portanto dependente apenas do gradiente de concentração. A gestante compensa hipersecretando insulina, com hiperplasia de células beta. Quando essa compensação falha, surge o **diabetes gestacional**, que é conceitualmente a mesma falência de célula beta do diabetes tipo 2, revelada por um teste de estresse fisiológico. A consequência fetal segue a **hipótese de Pedersen**: a glicose materna atravessa a placenta livremente, mas a insulina **não** atravessa; o pâncreas fetal responde à hiperglicemia com hiperinsulinemia, e a insulina é o principal hormônio anabólico do feto — daí macrossomia com deposição preferencial de gordura em tronco e ombros (que é o que causa distocia de ombro), organomegalia, e hipoglicemia neonatal quando o aporte materno cessa abruptamente ao nascimento. É por isso que o ganho excessivo não é apenas estético: ele opera sobre um sistema já programado para resistência insulínica.',
        'A recomendação de ganho **menor quanto maior o IMC pré-gestacional** decorre diretamente disso: o tecido adiposo pré-existente já fornece reserva energética e já contribui com resistência insulínica e inflamação de baixo grau, de modo que acrescentar mais massa gorda aumenta risco sem benefício fetal. No extremo oposto, o ganho insuficiente compromete a expansão do volume plasmático (que normalmente aumenta 40 a 50% e é essencial à perfusão placentária) e a reserva energética do terceiro trimestre, quando ocorre a maior parte do crescimento fetal.',
      ],
      conduta: dentro || semanas < 14
        ? [
            'Ganho adequado. Mantenha o acompanhamento com **pesagem em toda consulta**, na mesma balança e com roupas leves, e registre a curva — é a trajetória, e não o valor isolado, que orienta.',
            'Reforce alimentação equilibrada e **atividade física regular** (150 minutos semanais de intensidade moderada, salvo contraindicação obstétrica), que reduz diabetes gestacional, ganho excessivo e distúrbios hipertensivos.',
            'Mantenha a suplementação: ácido fólico (iniciado idealmente antes da concepção), ferro conforme protocolo e hemoglobina, e avalie vitamina D, cálcio e iodo conforme o contexto.',
            'Garanta o rastreio de **diabetes gestacional** entre 24 e 28 semanas com teste oral de tolerância à glicose, e antecipe-o na primeira consulta se houver fatores de risco.',
          ]
        : ganho > esperadoMax
          ? [
              '**Ganho acima do recomendado.** A abordagem é **nutricional e de atividade física, nunca restrição calórica agressiva** — e jamais perda de peso, mesmo em obesidade grave, pelo risco de cetose materna associada a prejuízo do neurodesenvolvimento fetal.',
              'Encaminhe à nutricionista para plano individualizado com distribuição adequada de macronutrientes e fracionamento. O alvo é **desacelerar** a curva, não reverter o ganho já ocorrido.',
              'Antecipe ou repita o rastreio de **diabetes gestacional**: ganho excessivo e diabetes gestacional compartilham a mesma base de resistência insulínica, e um frequentemente antecede o outro.',
              'Monitore pressão arterial e pesquise proteinúria em toda consulta. **Ganho abrupto no terceiro trimestre com edema pode ser retenção hídrica de pré-eclâmpsia**, e não ganho nutricional — nesse caso a conduta é completamente outra.',
              'Acompanhe o crescimento fetal com ultrassonografia seriada pelo risco de macrossomia, e planeje a via de parto considerando peso fetal estimado, história obstétrica e risco de distocia de ombro.',
              'Oriente sobre o pós-parto: retenção de peso após a gestação é preditor de obesidade a longo prazo, e a amamentação favorece a perda. Programe reavaliação metabólica 6 a 12 semanas após o parto.',
            ]
          : [
              '**Ganho abaixo do recomendado.** Investigue a causa antes de simplesmente orientar comer mais: náuseas e vômitos persistentes ou hiperêmese, insegurança alimentar, transtorno alimentar, tabagismo, uso de substâncias, doenças consumptivas, hipertireoidismo e má absorção.',
              'Trate as náuseas de forma efetiva — piridoxina com doxilamina, metoclopramida, ondansetrona conforme necessidade e protocolo. Náusea mal controlada é causa frequente e subtratada de ganho insuficiente.',
              'Encaminhe à nutricionista e avalie insegurança alimentar com pergunta direta e sem julgamento, acionando a rede de apoio social quando necessário. É uma causa comum e invisível se não for perguntada.',
              'Monitore o **crescimento fetal** com ultrassonografia seriada e Doppler de artéria umbilical, pelo risco de restrição de crescimento. Avalie também o risco de parto pré-termo.',
              'Rastreie anemia, deficiências nutricionais e infecções, e revise a adesão à suplementação de ferro e ácido fólico.',
            ],
      alertas: [
        '**Nunca recomende perda de peso durante a gestação**, nem mesmo em obesidade grave. A restrição calórica induz cetose materna, associada a prejuízo do neurodesenvolvimento fetal.',
        'Ganho abrupto no terceiro trimestre acompanhado de edema pode ser **retenção hídrica de pré-eclâmpsia**, não ganho nutricional. Meça a pressão arterial e pesquise proteinúria antes de atribuir à alimentação.',
        'O peso pré-gestacional referido pela paciente costuma ser subestimado. Sempre que houver registro anterior, use-o — um erro de 3 a 4 kg desloca a faixa de IMC e muda toda a recomendação.',
        'As faixas do Institute of Medicine foram derivadas em população norte-americana e são de aplicação individual limitada. Elas orientam a conversa, não definem conduta isolada.',
        'Em gestação **gemelar** as faixas são outras e maiores, e não há recomendação estabelecida para obesidade grau III em gemelar.',
      ],
    }
  },
  formula: ['Faixas do Institute of Medicine por IMC pré-gestacional', 'Ganho esperado = ganho do 1º trimestre + (taxa semanal × semanas após a 13ª)'],
  fundamento:
    'As faixas do Institute of Medicine, revisadas em 2009, foram derivadas de coortes que relacionaram ganho de peso a desfechos maternos e fetais simultaneamente — buscando o intervalo que minimiza tanto o risco de recém-nascido pequeno para a idade gestacional quanto o de macrossomia, cesariana e retenção de peso. O que justifica faixas **decrescentes conforme o IMC pré-gestacional** é a fisiologia metabólica da gravidez. A gestação é deliberadamente um estado de resistência insulínica progressiva: a partir da segunda metade, o lactogênio placentário humano, o hormônio do crescimento placentário, a progesterona, o cortisol e o TNF-α reduzem a sensibilidade materna à insulina em 50 a 60%. O propósito é garantir gradiente de glicose para o feto, cuja captação ocorre por difusão facilitada via GLUT1 e depende apenas da concentração materna. A gestante compensa com hiperplasia de células beta e hipersecreção; quando a compensação falha, surge o diabetes gestacional. A consequência fetal é a **hipótese de Pedersen**: a glicose atravessa a placenta livremente, a insulina não, e o pâncreas fetal responde com hiperinsulinemia — sendo a insulina o principal hormônio anabólico fetal, daí a macrossomia com deposição preferencial em tronco e ombros (que causa distocia de ombro), a organomegalia e a hipoglicemia neonatal quando o aporte cessa ao nascer. Uma gestante que já parte de obesidade tem resistência insulínica e inflamação de baixo grau prévias, além de reserva energética adequada: acrescentar massa gorda opera sobre um sistema já saturado e aumenta risco sem benefício fetal. No extremo oposto, o ganho insuficiente compromete a expansão do volume plasmático — que normalmente aumenta 40 a 50% e é essencial à perfusão placentária — e a reserva energética do terceiro trimestre, quando ocorre a maior parte do crescimento fetal. Vale registrar o que a distribuição do ganho revela: a termo, o feto responde por cerca de 3,5 kg, a placenta por 0,7, o líquido amniótico por 0,8, o útero por 1, as mamas por 0,5, o sangue por 1,5, o líquido extracelular por 1,5 e a reserva de gordura materna por 2 a 4 kg. Ou seja, boa parte do ganho recomendado **não é gordura**, e é por isso que a meta não pode ser extrapolada de recomendações de peso fora da gestação.',
  armadilhas: [
    'O peso pré-gestacional referido pela paciente costuma ser subestimado. Sempre que houver registro anterior, use-o.',
    'Ganho abrupto no terceiro trimestre com edema pode ser retenção hídrica de pré-eclâmpsia, não ganho nutricional — meça a pressão e pesquise proteinúria.',
    'Um erro de 3 a 4 kg no peso pré-gestacional desloca a faixa de IMC e muda toda a recomendação. Vale insistir no registro anterior antes de aceitar o autorrelato.',
    'O ganho não é linear: no primeiro trimestre espera-se de 0,5 a 2 kg no total, e a recomendação semanal se aplica ao segundo e terceiro trimestres. Aplicar a taxa semanal desde a concepção superestima.',
    'As faixas do Institute of Medicine são de base populacional norte-americana. Elas orientam a conversa clínica; usá-las como meta rígida gera ansiedade sem benefício demonstrado.',
    'Em gestação gemelar as faixas são maiores e distintas, e não há recomendação estabelecida para obesidade grau III nesse cenário.',
    'Baixo ganho tratado apenas com orientação dietética, sem investigar náusea, insegurança alimentar e transtorno alimentar, tende a não funcionar — a causa quase sempre é específica e tratável.',
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
      conduta: [
        'Bishop **≥ 8 (colo favorável)**: a probabilidade de parto vaginal após indução é semelhante à do trabalho de parto espontâneo. Induza diretamente com **ocitocina** e amniotomia quando apropriado, sem preparo cervical prévio.',
        'Bishop **≤ 6 (colo desfavorável)**: amadureça o colo antes. As opções são **misoprostol vaginal 25 µg a cada 6 h** (não use em cesárea prévia ou cicatriz uterina, pelo risco de rotura), **dinoprostona**, ou métodos mecânicos — sonda de Foley ou balão duplo, que são os mais seguros no útero cicatricial e têm eficácia comparável.',
        'Bishop **7** é zona intermediária: decida pelo contexto. Multíparas frequentemente respondem à ocitocina isolada; nulíparas costumam se beneficiar do preparo cervical.',
        'A **dilatação** é o item de maior peso do escore, e a **estação da apresentação** o de maior variabilidade entre examinadores. Quando houver dúvida na estação, prefira o Bishop simplificado (dilatação, apagamento e estação), que tem desempenho preditivo equivalente e menos ruído.',
        'Reavalie o Bishop **após cada ciclo de preparo cervical** e antes de declarar falha de indução. Falha de indução só deve ser diagnosticada após ruptura das membranas e pelo menos 12–18 h de ocitocina em contratilidade adequada — encerrar antes disso converte em cesárea induções que ainda dariam certo.',
      ],
      alertas: [
        '**Misoprostol é contraindicado em cesárea prévia ou qualquer cicatriz uterina**, pelo risco de rotura. Nesses casos, use métodos mecânicos — sonda de Foley ou balão duplo —, que têm eficácia comparável.',
        'Não diagnostique falha de indução antes da ruptura das membranas e de 12 a 18 h de ocitocina em contratilidade adequada: encerrar antes disso converte em cesárea induções que ainda dariam certo.',
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
      conduta: [
        'Diagnóstico firmado: defina imediatamente se há **critérios de gravidade** (pressão ≥ 160/110 mmHg, plaquetas < 100.000, transaminases ao dobro do normal, creatinina > 1,1 mg/dL ou o dobro do basal, edema pulmonar, cefaleia ou alterações visuais refratárias). A presença de qualquer um muda a conduta de vigilância para internação e planejamento do parto.',
        '**Crise hipertensiva (≥ 160/110 mmHg)**: trate em até 30–60 minutos com hidralazina IV, labetalol IV ou nifedipino de liberação imediata por via oral. O alvo é 140–150/90–100 mmHg — normalizar a pressão reduz a perfusão placentária e não traz benefício.',
        '**Sulfato de magnésio** é profilaxia de eclâmpsia, não anti-hipertensivo. Indique em pré-eclâmpsia com critérios de gravidade e em toda eclâmpsia, e mantenha por 24 h após o parto ou após a última crise.',
        'O **parto é o único tratamento definitivo**. Com ≥ 37 semanas, interrompa. Entre 34 e 37 semanas com gravidade, interrompa após estabilização. Abaixo de 34 semanas, a conduta expectante só se justifica em centro terciário, com mãe e feto estáveis, e sempre após corticoide antenatal.',
        'Pré-eclâmpsia é **fator de risco cardiovascular vitalício**: dobra o risco de doença coronariana e acidente vascular cerebral. Encaminhe a puérpera para avaliação de pressão, lipídios e glicemia em 3 a 6 meses, e prescreva **aspirina 100–150 mg à noite, a partir de 12–16 semanas**, em toda gestação futura.',
      ],
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
    'A pré-eclâmpsia é uma doença de origem placentária com manifestação sistêmica. A remoção da proteinúria como critério obrigatório, em 2013, reconheceu que a lesão renal é apenas uma das faces da disfunção endotelial difusa — e que exigir proteinúria retardava o diagnóstico de pacientes que já tinham comprometimento hepático, hematológico ou neurológico. A pré-eclâmpsia começa muito antes dos sintomas, com **invasão trofoblástica deficiente das artérias espiraladas**: elas não perdem a camada muscular e permanecem de alta resistência e baixo fluxo, gerando isquemia placentária intermitente. A placenta isquêmica libera fatores antiangiogênicos — sFlt-1, que sequestra VEGF e fator de crescimento placentário, e endoglina solúvel —, que produzem disfunção endotelial sistêmica. É o endotélio doente que explica todo o resto: hipertensão por perda de óxido nítrico, proteinúria por endoteliose glomerular, plaquetopenia por consumo e as alterações hepáticas e neurológicas.',
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
      conduta: [
        'Esquema de **Zuspan**: ataque de 4 g IV em 20 minutos, manutenção de 1–2 g/h em bomba de infusão. Esquema de **Pritchard** (quando não há bomba): 4 g IV mais 10 g intramuscular divididos nas nádegas, seguidos de 5 g intramuscular a cada 4 h. Mantenha por 24 h após o parto ou após a última convulsão.',
        'Monitore de hora em hora a **tríade de segurança**: reflexo patelar presente, frequência respiratória ≥ 12–16 irpm e diurese ≥ 25–30 mL/h. O reflexo patelar é o primeiro a desaparecer e é o sinal de alarme mais precoce — sua ausência precede a depressão respiratória.',
        'Em **intoxicação** (arreflexia, depressão respiratória, alterações de condução): suspenda a infusão e administre **gluconato de cálcio 1 g IV (10 mL a 10%) em 3 minutos**, que antagoniza diretamente o bloqueio neuromuscular. Tenha a ampola fisicamente ao lado do leito de toda paciente em sulfato.',
        'Na **insuficiência renal**, o magnésio se acumula porque sua eliminação é exclusivamente renal. Mantenha o ataque integral, mas reduza a manutenção (1 g/h ou menos) e dose a magnesemia — alvo terapêutico de 4,8 a 8,4 mg/dL (2 a 3,5 mmol/L).',
        'Se houver **convulsão durante a infusão**, aplique 2 g adicionais em bolus. Crises recorrentes apesar de magnesemia terapêutica pedem neuroimagem para afastar hemorragia, trombose venosa cerebral e síndrome da encefalopatia posterior reversível.',
      ],
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
    'O magnésio bloqueia receptores NMDA, antagoniza canais de cálcio e reduz a excitabilidade neuronal, além de causar vasodilatação cerebral — o que atenua o vasoespasmo e o edema associados à encefalopatia da eclâmpsia. Sua excreção é exclusivamente renal, e é por isso que a diurese é um parâmetro de monitorização tão central: rim que não filtra acumula magnésio. O magnésio previne a eclâmpsia por mecanismo central, não anti-hipertensivo: ele **bloqueia receptores NMDA** de forma dependente de voltagem, reduzindo a excitotoxicidade glutamatérgica, promove vasodilatação cerebral que reverte o vasoespasmo associado à encefalopatia hipertensiva, e estabiliza a barreira hematoencefálica reduzindo o edema vasogênico. Perifericamente, compete com o cálcio na junção neuromuscular — daí, na mesma molécula, o efeito terapêutico e a toxicidade que se monitora pelo reflexo patelar.',
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
      conduta: [
        '**Índice de choque ≥ 0,9** é gatilho de alerta na hemorragia pós-parto: ele sobe antes da queda da pressão arterial, porque a gestante jovem compensa perdas de até 1.500 mL mantendo a sistólica normal. Não espere hipotensão para agir.',
        '**Índice ≥ 1,7** indica perda grave e prevê necessidade de transfusão maciça. Acione o protocolo institucional, peça hemocomponentes em proporção 1:1:1 (hemácias, plasma, plaquetas) e chame a equipe cirúrgica.',
        'Percorra os **quatro T** para achar a causa: **Tônus** (atonia, responsável por 70–80%), **Trauma** (laceração, rotura, inversão), **Tecido** (restos placentários, acretismo) e **Trombina** (coagulopatia). O tratamento é específico de cada um e o tempo perdido no diagnóstico é o que mata.',
        'Na **atonia**, execute em sequência: massagem uterina bimanual, ocitocina, ácido tranexâmico 1 g IV (dentro das primeiras 3 horas — depois disso perde eficácia), metilergometrina (contraindicada em hipertensão), misoprostol, balão de tamponamento intrauterino e, persistindo, sutura de B-Lynch, ligadura de artérias ou histerectomia.',
        'O índice **perde validade sob betabloqueador, anestesia raquidiana e em cardiopatia materna**, que desacoplam a frequência da volemia. Nesses casos, guie-se por lactato, diurese, perfusão periférica e perda estimada, não pelo cálculo.',
      ],
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
    'A gestante a termo tem volume plasmático 40 a 50% maior e massa eritrocitária 20 a 30% maior que a não gestante — adaptação que a prepara justamente para a perda do parto. Essa reserva é também a armadilha: os sinais clássicos de choque aparecem tarde. O índice de choque captura a resposta cronotrópica compensatória, que antecede a queda pressórica. A gestante compensa a hemorragia melhor que a não gestante porque chega ao termo com a volemia expandida em 30 a 50% e com débito cardíaco elevado — uma reserva fisiológica construída justamente para o parto. O custo dessa vantagem é diagnóstico: a pressão arterial permanece normal até perdas da ordem de 1.500 mL, e o único sinal precoce é a **taquicardia com estreitamento da pressão de pulso**, que é exatamente o que o índice de choque captura antes que a sistólica se mova.',
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
    campoNum('q1', 'Quadrante superior direito', { unidade: 'cm', min: 0, max: 20, passo: 0.1, ajuda: 'Maior bolsão VERTICAL do quadrante, com o transdutor perpendicular ao chão e sem comprimir o abdome. Pressão excessiva reduz a medida; incluir alça de cordão ou parte fetal a aumenta — use Doppler colorido para excluir cordão.' }),
    campoNum('q2', 'Quadrante superior esquerdo', { unidade: 'cm', min: 0, max: 20, passo: 0.1 }),
    campoNum('q3', 'Quadrante inferior direito', { unidade: 'cm', min: 0, max: 20, passo: 0.1 }),
    campoNum('q4', 'Quadrante inferior esquerdo', { unidade: 'cm', min: 0, max: 20, passo: 0.1 }),
    campoNum('maiorBolsao', 'Maior bolsão vertical único', { unidade: 'cm', min: 0, max: 20, passo: 0.1, opcional: true, ajuda: 'Opcional, mas RECOMENDADO: é o método com melhor desempenho. Cortes de menos de 2 cm para oligoâmnio e mais de 8 cm para polidrâmnio. Revisões sistemáticas mostram que usá-lo no lugar do índice reduz induções e cesarianas sem piorar o desfecho perinatal.' }),
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
        'O líquido amniótico não é um reservatório estático: ele é **reciclado quase inteiramente a cada dia**. A termo, o feto produz cerca de 800 a 1.200 mL de urina por dia e deglute 500 a 1.000 mL, com o restante reabsorvido pela via intramembranosa (através das membranas para a circulação fetal) e uma pequena contribuição da secreção pulmonar. Como produção e reabsorção são da ordem de grandeza do volume total, **pequenos desequilíbrios produzem alterações rápidas e amplas** — é isso que torna o líquido amniótico um marcador sensível, e também volátil. A consequência diagnóstica é direta: pouco líquido significa produção reduzida (hipoperfusão renal fetal por insuficiência placentária, agenesia ou obstrução renal, inibidores da ECA ou anti-inflamatórios que reduzem a filtração fetal) ou perda (rotura de membranas). Muito líquido significa produção aumentada (hiperglicemia fetal gerando poliúria osmótica no diabetes materno) ou deglutição impedida (atresia esofágica ou duodenal, anomalias do sistema nervoso central que comprometem a deglutição, obstrução por massa cervical).',
        'A fisiopatologia do oligoâmnio por insuficiência placentária merece destaque porque é a mais comum e a mais silenciosa. Diante de hipóxia crônica, o feto redistribui o débito cardíaco para cérebro, coração e adrenais — a chamada **centralização** — à custa de rim, intestino e musculatura. A queda do fluxo renal reduz a diurese fetal e, portanto, o líquido amniótico. Isso significa que o oligoâmnio nesse contexto não é um problema em si: é o **sinal tardio** de uma adaptação que já vinha ocorrendo, e por isso ele se associa a restrição de crescimento e a desfecho perinatal adverso. É também a razão de o líquido amniótico integrar o perfil biofísico fetal como o único componente que reflete hipóxia **crônica**, enquanto movimentos, tônus e respiração refletem o estado agudo.',
        'A escolha entre índice de líquido amniótico e **maior bolsão vertical único** já está resolvida pela evidência, e vale aplicá-la: revisões sistemáticas mostram que usar o índice em vez do maior bolsão aumenta o diagnóstico de oligoâmnio, as induções de parto e as cesarianas, **sem melhorar desfecho perinatal**. A explicação é estatística: o índice soma quatro medidas e portanto acumula quatro vezes o erro de cada uma, além de correlacionar-se apenas moderadamente com o volume real medido por diluição de corante. Vários serviços já adotaram o maior bolsão como método padrão, com cortes de menos de 2 cm para oligoâmnio e mais de 8 cm para polidrâmnio.',
      ],
      conduta: ila < 5
        ? [
            '**Confirme antes de agir.** Reavalie com técnica cuidadosa — transdutor perpendicular sem compressão, bolsão livre de cordão (use Doppler colorido) e de partes fetais — e confira o **maior bolsão vertical único**, que tem menos falso-positivo. Oligoâmnio diagnosticado pelo índice isolado gera indução e cesariana sem ganho perinatal.',
            'Procure **rotura prematura de membranas**, a causa mais comum: história de perda de líquido, exame especular com visualização de saída pelo orifício cervical, teste de cristalização ou pesquisa de marcadores bioquímicos. Evite toque vaginal se houver suspeita e a gestação for pré-termo.',
            'Avalie a **placenta e o crescimento fetal**: biometria com peso fetal estimado e percentil, Doppler de artéria umbilical, de artéria cerebral média e relação cerebroplacentária. Oligoâmnio com restrição de crescimento e Doppler alterado configura insuficiência placentária e muda completamente a conduta.',
            'Revise **fármacos maternos**: inibidores da ECA e bloqueadores do receptor de angiotensina (contraindicados na gestação) e anti-inflamatórios não esteroidais reduzem a filtração glomerular fetal e, portanto, o líquido. Suspenda-os.',
            'Se a idade gestacional for compatível, investigue **malformação do trato urinário fetal** — agenesia renal bilateral, rins policísticos, obstrução — com ultrassonografia morfológica dirigida.',
            'Intensifique a vigilância de bem-estar fetal (cardiotocografia e perfil biofísico) e defina o momento do parto conforme idade gestacional, causa e vitalidade. A hidratação materna, oral ou intravenosa, aumenta transitoriamente o líquido e pode ser útil na avaliação, mas não trata a causa.',
          ]
        : ila > 24
          ? [
              'Investigue a causa em três frentes. **Diabetes materno** é a mais frequente: solicite teste oral de tolerância à glicose ou revise o controle glicêmico se o diagnóstico já existe — a hiperglicemia fetal gera poliúria osmótica.',
              '**Ultrassonografia morfológica dirigida** para malformações que impedem a deglutição: atresia esofágica (procure a ausência de bolha gástrica), atresia duodenal (sinal da dupla bolha), anomalias do sistema nervoso central, massas cervicais e defeitos de parede. Avalie também hidropisia fetal e, em gemelares monocoriônicos, síndrome de transfusão feto-fetal.',
              'Considere **infecção congênita** (sorologias para toxoplasmose, citomegalovírus, sífilis, parvovírus B19) e aloimunização com anemia fetal, avaliando o pico de velocidade sistólica da artéria cerebral média.',
              'Cerca de 60% dos casos leves permanecem **idiopáticos** após investigação completa — informe isso à gestante, que costuma ficar mais ansiosa com a ausência de diagnóstico do que com o achado.',
              'Antecipe as complicações da sobredistensão uterina: parto pré-termo, apresentação anômala, **prolapso de cordão** na rotura das membranas (planeje a assistência ao parto), descolamento prematuro de placenta na descompressão súbita e hemorragia pós-parto por atonia. Tenha uterotônico preparado.',
              'Em polidrâmnio grave e sintomático (desconforto respiratório materno, contrações), considere **amniodrenagem** e indometacina antes de 32 semanas, ambas com riscos que exigem indicação criteriosa.',
            ]
          : ila <= 8
            ? [
                'Faixa limítrofe. **Reavalie em curto prazo** (3 a 7 dias) e confira o maior bolsão vertical único antes de qualquer decisão — o índice tem alta taxa de falso-positivo nesta zona e a conduta baseada nele isoladamente aumenta intervenções.',
                'Correlacione com **crescimento fetal e Doppler**. Líquido limítrofe com biometria e Doppler normais tem significado bem diferente de líquido limítrofe com restrição de crescimento e centralização.',
                'Oriente hidratação materna adequada e revise medicamentos. Pesquise perda de líquido por história e exame especular se houver qualquer relato.',
              ]
            : [
                'Volume dentro da normalidade. Mantenha o pré-natal de rotina com a periodicidade habitual de avaliação de crescimento e vitalidade.',
                'Lembre que o volume **declina fisiologicamente após 33 a 34 semanas**, chegando a cerca de 400 mL na 42ª semana. Um índice menor no termo pode ser normal — interprete pela idade gestacional.',
                'Como o líquido é reciclado quase inteiramente a cada dia, ele muda rápido: um valor normal hoje não dispensa reavaliação se surgirem restrição de crescimento, redução dos movimentos fetais ou suspeita de perda de líquido.',
              ],
      alertas: [
        '**Usar o índice em vez do maior bolsão aumenta induções e cesarianas sem melhorar desfecho perinatal** — achado consistente em revisões sistemáticas. Confirme sempre com o maior bolsão vertical único (oligoâmnio abaixo de 2 cm, polidrâmnio acima de 8 cm) antes de intervir.',
        'A técnica domina o resultado: pressão excessiva do transdutor reduz o bolsão medido, inclusão de alça de cordão ou de parte fetal o aumenta, e a posição materna altera a distribuição. Use Doppler colorido para excluir cordão.',
        'Oligoâmnio por insuficiência placentária é **sinal tardio**: a centralização do fluxo fetal, que reduz a diurese, já vinha ocorrendo antes. Avalie crescimento e Doppler, não apenas o líquido.',
        'Suspeita de rotura prematura de membranas contraindica toque vaginal na gestação pré-termo, pelo risco de corioamnionite. Use exame especular.',
        'Inibidores da ECA e bloqueadores do receptor de angiotensina são contraindicados na gestação e causam oligoâmnio com disfunção renal fetal. Anti-inflamatórios não esteroidais têm efeito semelhante e também fecham o ducto arterial.',
        'Polidrâmnio agudo ou de instalação rápida em gemelar monocoriônico sugere **síndrome de transfusão feto-fetal**, que é emergência com tratamento específico (fotocoagulação a laser) e janela terapêutica curta.',
      ],
    }
  },
  formula: ['ILA = soma dos maiores bolsões verticais dos 4 quadrantes uterinos', 'Maior bolsão vertical único: normal entre 2 e 8 cm'],
  fundamento:
    'A técnica divide o útero em quatro quadrantes pelas linhas mediana vertical e transversa umbilical, e mede o maior bolsão vertical livre de cordão e de partes fetais em cada um. A soma correlaciona-se moderadamente com o volume real medido por diluição de corante — e essa correlação apenas moderada é a raiz das limitações do método. O que se está tentando estimar é um compartimento notavelmente dinâmico: a termo, o feto produz 800 a 1.200 mL de urina por dia e deglute 500 a 1.000 mL, com o restante reabsorvido pela via intramembranosa e alguma contribuição da secreção pulmonar. Como a taxa de renovação é da ordem do volume total, **pequenos desequilíbrios entre produção e reabsorção geram alterações rápidas e amplas** — o que torna o líquido amniótico um marcador sensível e, ao mesmo tempo, volátil. Essa fisiologia organiza todo o diagnóstico diferencial em dois eixos. Volume baixo indica produção reduzida (hipoperfusão renal fetal na insuficiência placentária, agenesia ou obstrução renal, inibidores da ECA e anti-inflamatórios que reduzem a filtração fetal) ou perda (rotura de membranas). Volume alto indica produção aumentada (poliúria osmótica pela hiperglicemia fetal no diabetes materno) ou deglutição impedida (atresia esofágica, atresia duodenal, anomalias do sistema nervoso central). No caso particular da insuficiência placentária, o oligoâmnio é consequência da **centralização**: diante de hipóxia crônica, o feto redistribui o débito para cérebro, coração e adrenais à custa de rim, intestino e músculo, e a queda do fluxo renal reduz a diurese. Isso faz do líquido amniótico o único componente do perfil biofísico que reflete hipóxia **crônica**, enquanto movimentos, tônus e respiração refletem o estado agudo — e explica por que ele é um sinal tardio, que aparece depois de a adaptação já estar em curso. Quanto ao método em si, a evidência é desfavorável ao índice: por somar quatro medidas, ele acumula quatro vezes o erro de cada uma, e revisões sistemáticas mostram que substituí-lo pelo maior bolsão vertical único reduz diagnósticos de oligoâmnio, induções e cesarianas **sem piorar** o desfecho perinatal. Vários serviços já adotaram o maior bolsão como padrão.',
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
      conduta: [
        '**Relação ≥ 0,3 mg/mg (ou ≥ 300 mg/g)** confirma proteinúria significativa e, com hipertensão após 20 semanas, fecha o diagnóstico de pré-eclâmpsia. O resultado sai em horas, contra 24 h da coleta convencional — use-o para não atrasar a conduta.',
        'A amostra isolada **substitui a urina de 24 horas** para diagnóstico, com concordância boa. A coleta de 24 h permanece útil apenas quando há dúvida ou quando se quer quantificar de forma mais precisa, e é frequentemente inválida por erro de coleta.',
        '**Proteinúria não é mais critério de gravidade** desde as diretrizes de 2013: a quantidade não prediz desfecho materno ou fetal. Pré-eclâmpsia pode existir sem proteinúria alguma, desde que haja disfunção de órgão-alvo — plaquetopenia, lesão renal, hepática, neurológica ou edema pulmonar.',
        'Colha a amostra preferencialmente na **primeira urina da manhã**, com a paciente em repouso: postura ereta e exercício aumentam a proteinúria de forma transitória e geram falsos positivos. Contaminação por sangue, secreção vaginal ou infecção urinária também eleva o resultado — confirme com sumário de urina.',
        'Proteinúria **antes de 20 semanas** aponta doença renal prévia, não pré-eclâmpsia. Investigue com função renal, sedimento urinário, ultrassonografia de rins e sorologias, e acompanhe em conjunto com a nefrologia: essas gestantes têm risco muito alto de pré-eclâmpsia sobreposta mais adiante.',
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
      conduta: [
        'Com **hCG acima da zona discriminatória (1.500–3.500 mUI/mL, conforme o serviço) e útero vazio à ultrassonografia transvaginal**, a gravidez ectópica é o diagnóstico até prova em contrário. Abaixo dessa zona, repita hCG em 48 h antes de concluir.',
        '**Cinética do hCG**: aumento inferior a 35–50% em 48 h sugere gravidez não tópica ou inviável. Aumento adequado com útero vazio e valor acima da zona discriminatória mantém a suspeita. Queda lenta aponta abortamento ou ectópica em resolução — nenhum padrão isolado é diagnóstico, e a imagem seriada decide.',
        '**Metotrexato** (50 mg/m² intramuscular) é opção quando há estabilidade hemodinâmica, hCG < 5.000 mUI/mL, massa < 3,5–4 cm, ausência de atividade cardíaca embrionária e função hepática, renal e hematológica normais. Dose-chave do seguimento: o hCG deve cair **≥ 15% entre os dias 4 e 7**; se não cair, repita a dose ou opere.',
        '**Cirurgia imediata** em instabilidade hemodinâmica, sinais de rotura, líquido livre volumoso ou contraindicação ao metotrexato. Salpingostomia preserva a trompa em paciente com trompa contralateral comprometida; salpingectomia é preferível quando a contralateral é normal, por menor risco de persistência de tecido trofoblástico.',
        'Na **gravidez de localização indeterminada**, não há pressa em tratar paciente estável: acompanhe com hCG seriado a cada 48 h e ultrassonografia. Administrar metotrexato a uma gravidez tópica viável é um erro irreversível, e ele acontece justamente quando se trata a incerteza como se fosse diagnóstico.',
      ],
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
      conduta: [
        'Classifique pelo **PALM-COEIN** antes de tratar: as causas estruturais — **P**ólipo, **A**denomiose, **L**eiomioma, **M**alignidade e hiperplasia — são vistas por imagem ou histologia, e as não estruturais — **C**oagulopatia, disfunção **O**vulatória, **E**ndometrial, **I**atrogênica e **N**ão classificada — exigem investigação clínica e laboratorial. O tratamento diverge completamente entre os dois blocos.',
        '**Biópsia endometrial** é obrigatória em toda mulher com mais de 45 anos, e antes disso quando há exposição estrogênica não oposta (obesidade, síndrome dos ovários policísticos, anovulação crônica), falha do tratamento clínico ou fator de risco para câncer endometrial, como síndrome de Lynch.',
        'Investigue **coagulopatia** em adolescentes e em mulheres com sangramento intenso desde a menarca: até 20% têm doença de von Willebrand. Peça hemograma com plaquetas, coagulograma, fator de von Willebrand e atividade do cofator de ristocetina — o diagnóstico muda o tratamento e tem implicações familiares.',
        'No **sangramento agudo intenso**, estabilize primeiro: acesso venoso, hemograma, tipagem, e considere estrogênio conjugado IV 25 mg a cada 4–6 h, ácido tranexâmico 1 g a cada 8 h, ou alta dose de progestagênio oral. Curetagem ou tamponamento com balão ficam para a falha do tratamento clínico.',
        'No tratamento **crônico**, o **sistema intrauterino de levonorgestrel** é a primeira linha para sangramento intenso sem causa estrutural — reduz a perda em mais de 80% e evita histerectomia. Alternativas: anticoncepcional combinado contínuo, ácido tranexâmico nos dias de fluxo, ablação endometrial em quem completou a prole e miomectomia ou embolização quando há mioma sintomático.',
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
    { texto: 'National Institute for Health and Care Excellence. Heavy menstrual bleeding: assessment and management. NICE guideline NG88. 2018 (atualizada em 2021).' },
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
      conduta: [
        'A gestação eleva o risco de tromboembolismo em **4 a 5 vezes**, e o puerpério em até 20 vezes, com o pico nas primeiras 3 semanas pós-parto. Por isso a estratificação deve ser refeita no anteparto e no pós-parto — são decisões separadas.',
        '**Trombofilia de alto risco** (antitrombina deficiente, homozigose para fator V Leiden ou protrombina G20210A, dupla heterozigose, síndrome antifosfolípide) ou **tromboembolismo prévio** indicam profilaxia com **heparina de baixo peso molecular durante toda a gestação e por 6 semanas após o parto**.',
        'Com **fatores de risco somados** — cesárea de urgência, obesidade com índice de massa corporal ≥ 30, idade > 35 anos, imobilidade, pré-eclâmpsia, hemorragia pós-parto, infecção, gestação múltipla —, indique profilaxia pós-parto por 7 a 10 dias, estendida a 6 semanas se houver dois ou mais fatores maiores.',
        'Use **heparina de baixo peso molecular, não varfarina**: a varfarina é teratogênica no primeiro trimestre (embriopatia warfarínica) e atravessa a placenta, causando hemorragia fetal. Anticoagulantes orais diretos são contraindicados na gestação e na amamentação por falta de dados de segurança.',
        'Programe a **suspensão periparto**: interrompa a heparina de baixo peso molecular 24 h antes do parto programado ou da anestesia neuroaxial em dose terapêutica (12 h em dose profilática) e reintroduza 6–12 h após o parto vaginal ou 12–24 h após cesárea, desde que não haja sangramento ativo. Esse intervalo é o que separa profilaxia segura de hematoma epidural.',
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
    'O escore do Royal College of Obstetricians and Gynaecologists é o modelo de avaliação de risco obstétrico mais usado no mundo. Ele pesa três categorias: fatores preexistentes (trombose prévia, trombofilia, comorbidade), fatores obstétricos (gestação múltipla, pré-eclâmpsia, via de parto, hemorragia) e fatores transitórios (imobilidade, infecção, hiperêmese). A gestação preenche a tríade de Virchow por inteiro: **hipercoagulabilidade** (aumento dos fatores I, VII, VIII, IX e X, queda da proteína S livre e resistência adquirida à proteína C ativada, com elevação do inibidor do ativador do plasminogênio tipo 2 de origem placentária), **estase** (compressão da veia cava e das ilíacas pelo útero gravídico, com predomínio à esquerda pelo cruzamento da artéria ilíaca direita) e **lesão endotelial** no parto e na cesárea. A alteração é teleológica — prepara o organismo para a hemostasia do descolamento placentário — e o tromboembolismo é seu preço.',
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
      conduta: [
        '**Anemia na gestação** é hemoglobina < 11 g/dL no primeiro e terceiro trimestres e < 10,5 g/dL no segundo — os pontos de corte diferem porque a expansão do volume plasmático dilui fisiologicamente a hemoglobina no meio da gestação.',
        'A **ferritina** é o melhor marcador de estoque: < 30 ng/mL indica deficiência mesmo sem anemia, e nessa faixa já se repõe. Como é proteína de fase aguda, valores entre 30 e 100 ng/mL com proteína C-reativa elevada não excluem deficiência — nesse caso a saturação de transferrina < 20% confirma.',
        '**Ferro oral**: 40–80 mg de ferro elementar, em dias alternados e em jejum. A dose em dias alternados aumenta a absorção, porque o pico de hepcidina induzido por uma dose bloqueia a absorção da dose seguinte nas 24 h subsequentes. Associe vitamina C e evite tomar com cálcio, chá ou café.',
        '**Ferro intravenoso** (carboximaltose férrica ou sacarato) está indicado a partir do segundo trimestre quando há intolerância ao oral, má absorção, anemia moderada a grave (hemoglobina < 9 g/dL), necessidade de correção rápida perto do termo ou falha após 2–4 semanas de tratamento oral adequado. A reposta é mais rápida e a adesão, melhor.',
        'Verifique a resposta com **reticulócitos em 1 semana e hemoglobina em 2 a 4 semanas** (esperado: +1 g/dL). Sem resposta, reveja adesão, sangramento oculto, doença celíaca, infecção por *Helicobacter pylori* e outras causas de anemia — a deficiência de ferro é comum, mas não é a única, e a anemia falciforme e as talassemias têm conduta oposta à reposição indiscriminada.',
      ],
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
    'A queda fisiológica da hemoglobina no segundo trimestre é o motivo do ponto de corte mais baixo nesse período: a expansão plasmática atinge o pico relativo por volta de 28 a 34 semanas, quando a diluição é máxima. Ignorar essa curva leva a diagnosticar anemia em gestantes normais no segundo trimestre e a deixar de diagnosticá-la no primeiro. A demanda de ferro na gestação sobe para cerca de 1.000 mg no total: aproximadamente 300 mg para o feto e a placenta, 500 mg para a expansão da massa eritrocitária materna e 200 mg para perdas basais. A absorção intestinal aumenta progressivamente porque a **hepcidina materna cai** ao longo da gestação, liberando a ferroportina do enterócito — mas raramente o suficiente para cobrir a demanda sem aporte adicional, sobretudo quando a gestante inicia a gravidez já com estoques baixos.',
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
      conduta: [
        '**Índice de risco de malignidade (RMI) > 200** indica encaminhamento a um **ginecologista oncológico**. Esse é o desfecho prático mais importante da ferramenta: a cirurgia inicial feita por especialista, com estadiamento completo, melhora a sobrevida em câncer de ovário mais do que qualquer decisão subsequente.',
        '**RMI ≤ 200**: a massa pode ser conduzida pelo ginecologista geral. Cistos simples, uniloculares, anecoicos e menores que 5 cm em qualquer idade têm risco de malignidade próximo de zero e podem ser apenas acompanhados com ultrassonografia.',
        'Lembre que o **CA-125 sobe em muitas condições benignas**: endometriose, miomas, doença inflamatória pélvica, gestação, menstruação, cirrose com ascite, insuficiência cardíaca, tuberculose peritoneal e derrames serosos. Por isso o RMI multiplica o CA-125 pelo estado menopausal — na pré-menopausa o marcador tem especificidade baixa e não deve decidir sozinho.',
        'Considere marcadores alternativos conforme a idade: em mulheres jovens com massa sólida, dose **alfafetoproteína, beta-hCG e desidrogenase láctica** para tumores de células germinativas, e **inibina** para tumores de células da granulosa — o CA-125 é pouco informativo nesses tipos.',
        'Complete a avaliação com **tomografia de abdome e pelve** em RMI alto para mapear carcinomatose e planejar a citorredução. Quando a doença for irressecável de início, a discussão passa a ser quimioterapia neoadjuvante com cirurgia de intervalo — decisão que pertence à equipe oncológica, o que reforça o encaminhamento precoce.',
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
    'Jacobs e colaboradores propuseram o índice em 1990 combinando os três preditores independentes mais fortes de malignidade em massa anexial. A multiplicação, em vez da soma, é intencional: ela amplifica o efeito quando os três fatores se somam, refletindo a interação real entre eles — CA-125 alto em pós-menopausa com massa complexa é muito mais preocupante do que qualquer um dos três isoladamente. O índice multiplica três variáveis porque cada uma corrige a fraqueza da outra. O **CA-125** é sensível mas pouco específico, sobretudo antes da menopausa, quando endometriose, miomas, doença inflamatória pélvica e a própria menstruação o elevam. O **estado menopausal** entra como multiplicador justamente para compensar essa perda de especificidade. E o **escore ultrassonográfico** acrescenta a morfologia — septos, componente sólido, bilateralidade, ascite, metástase —, que é o dado com maior valor discriminante isolado.',
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
      conduta: [
        'A janela fértil vai de **5 dias antes até o dia da ovulação**: o espermatozoide sobrevive até 5 dias no muco cervical, enquanto o oócito é viável por apenas 12 a 24 h. Isso significa que a relação sexual *antes* da ovulação é a que engravida, e orientar o casal a ter relação só no \'dia da ovulação\' reduz as chances.',
        'Para **buscar gravidez**, a orientação mais eficaz é relação a cada 1 a 2 dias ao longo de todo o ciclo, ou pelo menos na janela fértil. Isso supera qualquer tentativa de cronometragem precisa e reduz a ansiedade, que por si já prejudica a frequência das relações.',
        '**Não use esta estimativa como método contraceptivo confiável.** Os métodos baseados em calendário têm falha típica de 12 a 24% ao ano com uso comum. Ciclos irregulares, estresse, viagem, doença e amamentação deslocam a ovulação de forma imprevisível.',
        'Sinais de ovulação mais confiáveis que o calendário: **muco cervical em clara de ovo** (o melhor preditor prospectivo), **teste de hormônio luteinizante na urina** (a ovulação ocorre 24–36 h após o pico) e elevação de 0,3–0,5 °C na temperatura basal — esta última só confirma a ovulação retrospectivamente e não serve para programar a relação.',
        'Encaminhe para investigação de infertilidade após **12 meses de tentativas** em mulheres com menos de 35 anos, ou **6 meses** a partir dos 35, e imediatamente se houver amenorreia, oligomenorreia, endometriose conhecida, doença inflamatória pélvica prévia, cirurgia pélvica ou fator masculino suspeito.',
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
    'O método de Ogino-Knaus parte de uma constância biológica real: a fase lútea, entre a ovulação e a menstruação, dura de forma bastante estável 13 a 15 dias em quase todas as mulheres. A fase folicular, ao contrário, varia muito — e é por isso que se conta a ovulação **de trás para frente**, a partir da próxima menstruação, e não a partir da anterior. A janela fértil é assimétrica em torno da ovulação por uma razão simples de sobrevida celular: o espermatozoide permanece viável por até 5 dias nas criptas do muco cervical periovulatório, que se torna filante, aquoso e permeável sob estímulo estrogênico, enquanto o **oócito é viável por apenas 12 a 24 horas** após a ovulação. Daí a regra prática de que a relação que engravida é a que antecede a ovulação, e não a que a segue.',
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
