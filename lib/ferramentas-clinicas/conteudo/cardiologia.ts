import type { Campo, Ferramenta, Nivel, Resultado, Valores } from '../tipos'
import {
  bsaMosteller,
  campoAltura,
  campoNum,
  campoOpc,
  campoPeso,
  campoSeg,
  campoSexo,
  campoSimNao,
  fmt,
  fmtInt,
  fmtPct,
  num,
  numOu,
  opc,
  pts,
  ptsOpc,
  sim,
  somaSimNao,
} from '../helpers'

/* ═══════════════════════ Utilidades cardiológicas ═══════════════════════ */

/** Correções do QT. QT em ms, FC em bpm. Devolve QTc em ms. */
export function corrigirQT(qtMs: number, fc: number) {
  const rr = 60 / fc
  return {
    bazett: qtMs / Math.sqrt(rr),
    fridericia: qtMs / Math.cbrt(rr),
    framingham: qtMs + 154 * (1 - rr),
    hodges: qtMs + 1.75 * (fc - 60),
    rr,
  }
}

function nivelQTc(qtc: number, sexo: string): { nivel: Nivel; rotulo: string } {
  const limite = sexo === 'f' ? 460 : 450
  if (qtc >= 500) return { nivel: 'critico', rotulo: 'Muito prolongado — alto risco de torsades' }
  if (qtc >= limite) return { nivel: 'alerta', rotulo: 'Prolongado' }
  if (qtc < 340) return { nivel: 'atencao', rotulo: 'Curto' }
  return { nivel: 'ok', rotulo: 'Normal' }
}

/* ═════════════════════════════ Ferramentas ═════════════════════════════ */

const fcEcg: Ferramenta = {
  id: 'frequencia-cardiaca-ecg',
  nome: 'Frequência cardíaca no ECG',
  sinonimos: ['fc ecg', 'calculo da frequencia', 'quadradinhos', '1500'],
  resumo: 'Converte a distância entre dois QRS em batimentos por minuto, ritmo regular ou irregular.',
  categorias: ['cardiologia'],
  campos: [
    campoSeg('metodo', 'Método', [
      { valor: 'pequenos', rotulo: 'Quadrados pequenos (1500)' },
      { valor: 'grandes', rotulo: 'Quadrados grandes (300)' },
      { valor: 'irregular', rotulo: 'Ritmo irregular (6 s)' },
    ]),
    campoNum('velocidade', 'Velocidade do papel', { unidade: 'mm/s', min: 12.5, max: 50, passo: 12.5, padrao: '25', ajuda: 'O padrão é 25 mm/s. A 50 mm/s todos os intervalos dobram de largura.' }),
    campoNum('pequenos', 'Quadrados pequenos entre dois R', { min: 1, max: 200, passo: 1, ajuda: 'Conte de 1 em 1 mm, do ápice de uma R ao ápice da seguinte. Método mais preciso, indicado em ritmo regular.', mostrarSe: (v) => opc(v, 'metodo') === 'pequenos' }),
    campoNum('grandes', 'Quadrados grandes entre dois R', { min: 0.2, max: 40, passo: 0.2, ajuda: 'Quadrados de 5 mm. Aceita fração (2,4 quadrados, por exemplo) — leitura rápida de porta, menos precisa em taquicardia, onde cada fração de quadrado vale muitos bpm.', mostrarSe: (v) => opc(v, 'metodo') === 'grandes' }),
    campoNum('qrs6s', 'QRS contados em 6 segundos (30 quadrados grandes)', { min: 0, max: 60, passo: 1, ajuda: 'Conte todos os QRS numa tira de 30 quadrados grandes, inclusive extrassístoles. Obrigatório em ritmo irregular: devolve a média, que é a única medida honesta em fibrilação atrial.', mostrarSe: (v) => opc(v, 'metodo') === 'irregular' }),
  ],
  calcular: (v) => {
    const metodo = opc(v, 'metodo')
    const vel = numOu(v, 'velocidade', 25)
    const fator = vel / 25
    let fc: number | null = null
    let rrMs: number | null = null
    let nota = ''
    if (metodo === 'pequenos') {
      const q = num(v, 'pequenos')
      if (q === null || q <= 0) return null
      fc = (1500 * fator) / q
      rrMs = (q * 40) / fator
      nota = 'Cada quadrado pequeno vale 0,04 s a 25 mm/s; 1500 quadrados pequenos formam um minuto.'
    } else if (metodo === 'grandes') {
      const q = num(v, 'grandes')
      if (q === null || q <= 0) return null
      fc = (300 * fator) / q
      rrMs = (q * 200) / fator
      nota = 'Cada quadrado grande vale 0,20 s; 300 quadrados grandes formam um minuto. Daí a sequência decorada 300–150–100–75–60–50.'
    } else {
      const q = num(v, 'qrs6s')
      if (q === null) return null
      fc = q * 10
      rrMs = q > 0 ? 60000 / fc : null
      nota = 'Em ritmo irregular (fibrilação atrial, extrassistolia frequente) a distância entre dois R não representa o ritmo. Conte os QRS de uma tira de 6 segundos e multiplique por 10 — é a média, que é o que importa.'
    }
    const nivel: Nivel = fc < 40 || fc > 150 ? 'critico' : fc < 50 || fc > 120 ? 'alerta' : fc < 60 || fc > 100 ? 'atencao' : 'ok'
    return {
      titulo: 'Frequência cardíaca',
      valor: fmtInt(fc),
      unidade: 'bpm',
      nivel,
      rotuloNivel: fc < 60 ? 'Bradicardia' : fc > 100 ? 'Taquicardia' : 'Frequência normal',
      detalhes: [
        { rotulo: 'Intervalo RR', valor: rrMs === null ? '—' : `${fmtInt(rrMs)} ms` },
        { rotulo: 'Velocidade do papel', valor: `${fmt(vel, 1)} mm/s`, nota: vel !== 25 ? 'Fora do padrão — o cálculo já foi ajustado.' : 'Padrão.' },
      ],
      interpretacao: [
        nota,
        'A sequência 300, 150, 100, 75, 60, 50, 43 corresponde a 1, 2, 3, 4, 5, 6 e 7 quadrados grandes. Decorá-la resolve a leitura de ritmo regular sem calculadora, e é o que se espera de quem lê ECG na porta.',
        'A frequência que o traçado mostra é o resultado de uma competição entre marcapassos e um balanço autonômico, e ler o número sem esse contexto perde metade da informação. O nó sinoatrial dispara espontaneamente por **despolarização diastólica lenta**, gerada sobretudo pela corrente de marcapasso I_f (canais HCN, ativados por hiperpolarização e modulados por AMP cíclico) somada à entrada de cálcio pelos canais tipo T e ao ciclo local de liberação de cálcio do retículo sarcoplasmático. Sua frequência intrínseca é de 90 a 100 bpm; a frequência de repouso de 60 a 80 bpm resulta do **tônus vagal predominante**, em que a acetilcolina ativa receptores muscarínicos M2, abre canais de potássio ativados por acetilcolina e inibe a adenilato ciclase, reduzindo o AMP cíclico e, com ele, a corrente I_f. A estimulação simpática faz o oposto, via receptores beta-1 e aumento de AMP cíclico. Essa hierarquia explica a clínica: o nó sinusal manda porque é o mais rápido, e quando ele falha assumem marcapassos subsidiários com frequências intrínsecas progressivamente menores — juncional em 40 a 60 bpm, ventricular em 20 a 40 bpm. É por isso que uma bradicardia de 35 bpm com QRS largo sugere ritmo idioventricular e instabilidade iminente, enquanto 55 bpm em atleta jovem é tônus vagal aumentado e não doença. E explica por que na taquicardia importa distinguir resposta fisiológica (dor, febre, hipovolemia, anemia, hipoxemia, tireotoxicose, abstinência) de arritmia primária: a primeira exige tratar a causa, e reduzir a frequência nela pode ser deletério, porque a taquicardia é o mecanismo compensatório que sustenta o débito cardíaco.',
      ],
      conduta: fc < 60
        ? [
            'Determine primeiro se a bradicardia é **sintomática**: tontura, síncope ou pré-síncope, dispneia, angina, confusão, hipotensão, sinais de baixo débito. Bradicardia assintomática em atleta, jovem ou durante o sono é frequentemente fisiológica e não exige intervenção.',
            'Analise o **QRS e a relação P-QRS** para localizar o problema: bradicardia sinusal com P normal antes de cada QRS aponta tônus vagal, fármaco ou disfunção do nó sinusal; ausência de relação P-QRS indica bloqueio atrioventricular completo; QRS largo com frequência de 20 a 40 bpm sugere ritmo idioventricular, que é instável.',
            'Procure as causas reversíveis antes de pensar em marcapasso: fármacos (betabloqueador, bloqueador de canal de cálcio não di-hidropiridínico, digoxina, amiodarona, anticolinesterásico, clonidina), hipotireoidismo, hipercalemia, hipotermia, hipóxia, hipertensão intracraniana com tríade de Cushing, infarto de parede inferior (que compromete o nó sinusal e o atrioventricular por irrigação da coronária direita) e doença de Chagas.',
            fc < 40
              ? 'Frequência abaixo de 40 bpm com sintomas é emergência: atropina 0,5 mg intravenosa (repetível até 3 mg), e se não responder, marcapasso transcutâneo ou infusão de adrenalina ou dopamina como ponte até o marcapasso transvenoso. Em intoxicação específica, use o antídoto — glucagon ou dose alta de insulina e glicose no betabloqueador, cálcio no bloqueador de canal de cálcio, anticorpo antidigoxina na intoxicação digitálica.'
              : 'Se houver sintomas atribuíveis e nenhuma causa reversível, o caminho é avaliação eletrofisiológica e indicação de marcapasso definitivo. Suspenda ou reduza fármacos bradicardizantes quando possível antes de indicar dispositivo.',
          ]
        : fc > 100
          ? [
              'Distinga **taquicardia sinusal apropriada** de arritmia primária, porque a conduta é oposta. Taquicardia sinusal é resposta a dor, febre, ansiedade, hipovolemia, anemia, hipoxemia, sepse, embolia pulmonar, tireotoxicose, abstinência ou fármaco — nela, trate a causa e não a frequência, já que a taquicardia sustenta o débito cardíaco.',
              'Analise a largura do QRS e a regularidade. QRS estreito e regular sugere sinusal, taquicardia por reentrada nodal, flutter com condução fixa ou taquicardia atrial; estreito e irregular sugere fibrilação atrial; **largo** obriga a tratar como taquicardia ventricular até prova em contrário — aplique os critérios de Brugada ou de Vereckei, que é a conduta segura.',
              'Avalie estabilidade: hipotensão, alteração do nível de consciência, dor torácica isquêmica, congestão pulmonar aguda ou sinais de choque indicam **cardioversão elétrica sincronizada** imediata, com sedação, em vez de tentativa farmacológica.',
              'Em paciente estável, a estratégia segue o mecanismo: manobra vagal e adenosina na taquicardia supraventricular por reentrada; controle de frequência com betabloqueador ou bloqueador de canal de cálcio na fibrilação atrial, avaliando anticoagulação pelo CHA₂DS₂-VASc e pelo HAS-BLED; amiodarona ou procainamida na taquicardia ventricular estável.',
              'Corrija sempre o que alimenta a arritmia: potássio, magnésio, hipoxemia, acidose, anemia, hipovolemia, febre e isquemia. Arritmia recorrente em eletrólito descompensado não se resolve com antiarrítmico.',
            ]
          : [
              'Frequência normal. Prossiga com a leitura sistemática do traçado: ritmo e origem da P, condução (PR, QRS, QT corrigido), eixo, morfologia, sinais de sobrecarga e repolarização.',
              'Se o motivo do exame foi palpitação, frequência normal no momento do registro não exclui arritmia paroxística — considere Holter de 24 horas, monitor de eventos ou monitorização prolongada conforme a frequência dos sintomas.',
              'Registre o método usado e a velocidade do papel junto do valor, sobretudo se o traçado não estiver a 25 mm/s.',
            ],
      alertas: [
        'Confira a **velocidade do papel** e a calibração impressas na tira antes de qualquer medida. Traçado registrado a 50 mm/s e lido como 25 mm/s dobra o erro de todos os intervalos, e o mesmo vale para o registro em meia voltagem.',
        'Em ritmo irregular — fibrilação atrial, extrassistolia frequente, bloqueio atrioventricular variável — a contagem de quadrados entre dois R **não** representa o ritmo. Use obrigatoriamente o método dos 6 segundos, que devolve a média.',
        'Em bloqueio atrioventricular, a frequência atrial e a ventricular são diferentes e ambas importam: meça P-P e R-R separadamente. Registrar apenas a ventricular esconde o diagnóstico.',
        'Frequência é apenas um número: bradicardia de 35 bpm com QRS largo e frequência de 100 bpm em paciente séptico exigem condutas opostas, e nenhuma delas se deduz do valor isolado.',
      ],
      tabela: {
        titulo: 'Métodos de cálculo e quando usar cada um',
        colunas: ['Método', 'Fórmula (a 25 mm/s)', 'Indicação', 'Limite'],
        linhas: [
          ['Quadrados pequenos', 'FC = 1500 ÷ n', 'Ritmo regular, maior precisão', 'Exige contar 1 mm por 1 mm'],
          ['Quadrados grandes', 'FC = 300 ÷ n', 'Ritmo regular, leitura rápida de porta', 'Menos preciso em taquicardia'],
          ['6 segundos', 'FC = QRS × 10', 'Ritmo irregular — obrigatório', 'Devolve média, não instantânea'],
        ],
        destaque: metodo === 'pequenos' ? 0 : metodo === 'grandes' ? 1 : 2,
      },
    }
  },
  formula: ['FC = 1500 ÷ (quadrados pequenos entre R-R)', 'FC = 300 ÷ (quadrados grandes entre R-R)', 'FC = QRS em 6 s × 10'],
  fundamento:
    'A régua do ECG é temporal: a 25 mm/s, cada milímetro é 0,04 s e cada quadrado grande (5 mm) é 0,20 s. Um minuto contém 1500 milímetros de papel, ou 300 quadrados grandes — por isso as duas constantes. O método dos 6 segundos existe porque a média é a única medida honesta quando o ritmo é irregular: em fibrilação atrial, dois RR consecutivos podem sugerir 40 e 140 bpm no mesmo traçado. Compreender o que gera essa frequência dá sentido ao número. O nó sinoatrial não tem potencial de repouso estável: ele sofre **despolarização diastólica lenta**, produzida principalmente pela corrente de marcapasso I_f, que flui por canais HCN ativados por hiperpolarização e modulados diretamente por AMP cíclico, somada à entrada de cálcio por canais tipo T e ao ciclo local de liberação de cálcio do retículo sarcoplasmático. Sua frequência intrínseca, desnervado, é de 90 a 100 bpm — a frequência de repouso menor que isso é obra do **tônus vagal**, em que a acetilcolina ativa receptores muscarínicos M2, abre canais de potássio I_KACh e inibe a adenilato ciclase, reduzindo o AMP cíclico e, portanto, a corrente I_f. A estimulação simpática faz o inverso pelos receptores beta-1. Essa arquitetura explica a hierarquia dos marcapassos cardíacos: o nó sinusal comanda porque é o mais rápido, e quando falha assumem focos subsidiários de frequência intrínseca progressivamente menor — juncional em 40 a 60 bpm, ventricular em 20 a 40 bpm. Daí a leitura clínica: bradicardia de 35 bpm com QRS largo sugere ritmo idioventricular e instabilidade iminente, enquanto 55 bpm em atleta jovem é apenas tônus vagal aumentado. E explica por que, na taquicardia, distinguir resposta fisiológica de arritmia primária é a decisão mais importante: quando a taquicardia é compensatória, ela sustenta o débito cardíaco, e reduzi-la sem tratar a causa piora o paciente.',
  armadilhas: [
    'Verifique sempre a velocidade e a calibração impressas na tira. Traçado a 50 mm/s com leitura a 25 mm/s dobra o erro de todos os intervalos.',
    'Em bloqueio AV de segundo grau, a frequência ventricular e a atrial são diferentes — calcule as duas, medindo P-P e R-R separadamente.',
    'Usar a contagem de quadrados em ritmo irregular produz qualquer número que se queira: em fibrilação atrial, dois RR consecutivos do mesmo traçado podem sugerir 40 e 140 bpm. Nesses casos o método dos 6 segundos é obrigatório.',
    'A frequência calculada por um único intervalo RR é instantânea e não representa a média em presença de extrassistolia frequente, pausas ou variação respiratória acentuada.',
    'Frequência normal no traçado não exclui arritmia paroxística. Palpitação com ECG normal pede monitorização prolongada, não repetição do mesmo exame.',
    'A frequência informada automaticamente pelo eletrocardiógrafo pode errar na presença de artefato, de onda T alta contada como QRS ou de marcapasso — confira manualmente quando o valor parecer incoerente com o pulso.',
  ],
  referencias: [
    { texto: 'Surawicz B, Knilans TK. Chou’s Electrocardiography in Clinical Practice. 6ª ed. Saunders; 2008.' },
    { texto: 'Kligfield P, Gettes LS, Bailey JJ, et al. Recommendations for the standardization and interpretation of the electrocardiogram. Circulation. 2007;115(10):1306-1324.' },
  ],
}

const qtc: Ferramenta = {
  id: 'qt-corrigido',
  nome: 'Intervalo QT corrigido',
  sigla: 'QTc',
  sinonimos: ['qtc', 'bazett', 'fridericia', 'qt longo', 'torsades'],
  resumo: 'Corrige o QT pela frequência nas quatro fórmulas consagradas e sinaliza risco de torsades.',
  categorias: ['cardiologia'],
  campos: [
    campoNum('qt', 'Intervalo QT medido', { unidade: 'ms', min: 200, max: 800, passo: 1, ajuda: 'Meça na derivação com o QT mais longo e T bem definida — habitualmente DII ou V5. Do início do QRS ao ponto em que a tangente do ramo descendente da T cruza a linha de base.' }),
    campoNum('fc', 'Frequência cardíaca', { unidade: 'bpm', min: 25, max: 250, passo: 1 }),
    campoSexo(),
    campoSeg('qrsLargo', 'QRS ≥ 120 ms (bloqueio de ramo, marca-passo)', [
      { valor: 'nao', rotulo: 'Não' },
      { valor: 'sim', rotulo: 'Sim' },
    ], { ajuda: 'Com QRS largo, parte do QT é despolarização, não repolarização — a correção de Bogossian evita superestimar.' }),
    campoNum('qrs', 'Duração do QRS', { unidade: 'ms', min: 60, max: 250, passo: 1, mostrarSe: (v) => sim(v, 'qrsLargo') }),
  ],
  calcular: (v) => {
    const qt = num(v, 'qt')
    const fc = num(v, 'fc')
    const sexo = opc(v, 'sexo')
    if (qt === null || fc === null || fc <= 0) return null
    const c = corrigirQT(qt, fc)
    const st = nivelQTc(c.bazett, sexo)
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Bazett — QT/√RR', valor: `${fmtInt(c.bazett)} ms`, nota: 'A mais usada e a mais citada em bula. Superestima em taquicardia e subestima em bradicardia.', nivel: nivelQTc(c.bazett, sexo).nivel },
      { rotulo: 'Fridericia — QT/∛RR', valor: `${fmtInt(c.fridericia)} ms`, nota: 'A preferida em estudos de segurança de fármacos e a mais confiável fora da faixa de 60 a 100 bpm.', nivel: nivelQTc(c.fridericia, sexo).nivel },
      { rotulo: 'Framingham — QT + 154×(1−RR)', valor: `${fmtInt(c.framingham)} ms`, nota: 'Correção linear derivada de coorte populacional; desempenho semelhante ao de Fridericia.', nivel: nivelQTc(c.framingham, sexo).nivel },
      { rotulo: 'Hodges — QT + 1,75×(FC−60)', valor: `${fmtInt(c.hodges)} ms`, nota: 'A que melhor se comporta em frequências extremas em vários estudos comparativos.', nivel: nivelQTc(c.hodges, sexo).nivel },
      { rotulo: 'Intervalo RR', valor: `${fmt(c.rr, 3)} s`, nota: `${fmtInt(c.rr * 1000)} ms` },
    ]
    const qrs = num(v, 'qrs')
    if (sim(v, 'qrsLargo') && qrs !== null && qrs > 120) {
      const bogossian = c.bazett - (qrs - 120) * 0.5
      detalhes.push({
        rotulo: 'QTc modificado de Bogossian (QRS largo)',
        valor: `${fmtInt(bogossian)} ms`,
        nota: 'Subtrai 50% do excesso de QRS acima de 120 ms. Aplica-se a bloqueio de ramo esquerdo e ritmo de marca-passo.',
        nivel: nivelQTc(bogossian, sexo).nivel,
      })
    }
    const limite = sexo === 'f' ? 460 : 450
    return {
      titulo: 'QTc (Bazett)',
      valor: fmtInt(c.bazett),
      unidade: 'ms',
      nivel: st.nivel,
      rotuloNivel: st.rotulo,
      detalhes,
      conduta: [
        'Com QTc **normal**, o achado libera a prescrição de fármacos que prolongam o QT, mas registre o valor basal no prontuário: ele é a referência contra a qual qualquer traçado futuro será comparado, e sem basal não se sabe se um QTc de 470 ms é novo ou antigo.',
        'Com QTc **limítrofe (450–480 ms em homens, 460–480 ms em mulheres)**, revise a lista de medicamentos em crediblemeds.org, corrija potássio para > 4,0 mEq/L e magnésio para > 2,0 mg/dL, e repita o ECG em 24–48 h ou após a próxima dose do fármaco suspeito.',
        'Com QTc **> 500 ms** ou aumento **> 60 ms** sobre o basal, suspenda o agente causal, instale monitorização contínua, reponha magnésio mesmo com magnesemia normal e corrija potássio para 4,5–5,0 mEq/L. Esse é o limiar em que o risco de torsades deixa de ser teórico.',
        'Em **torsades de pointes** instalada: sulfato de magnésio 2 g IV em bolus (repetir em 5–15 min se necessário), cardioversão elétrica se houver instabilidade, e aceleração da frequência para 90–110 bpm com marca-passo transvenoso ou isoproterenol — encurtar o QT pela taquicardia interrompe o circuito. Lidocaína pode ajudar; amiodarona e procainamida são proibidas, pois prolongam ainda mais o QT.',
        'QTc persistentemente longo sem causa reversível exige investigação de **síndrome do QT longo congênito**: ECG dos familiares de primeiro grau, teste genético e encaminhamento a eletrofisiologia. Betabloqueador (nadolol ou propranolol) é a base do tratamento, e não se libera esporte competitivo antes dessa avaliação.',
      ],
      interpretacao: [
        `Limite superior adotado: **${limite} ms** para ${sexo === 'f' ? 'mulheres' : 'homens'} (declaração AHA/ACCF/HRS). A diferença entre sexos aparece na puberdade — antes disso os valores são iguais — e reflete o efeito da testosterona sobre a repolarização.`,
        'Acima de **500 ms**, o risco de torsades de pointes cresce de forma acentuada; um aumento de **60 ms ou mais** em relação ao QTc basal após introdução de fármaco também é gatilho de suspensão, mesmo que o valor absoluto ainda pareça aceitável.',
        'A escolha da fórmula importa quando a frequência sai da faixa de 60 a 100 bpm. Bazett foi derivada em 1920 sobre 39 indivíduos jovens e superestima o QTc na taquicardia — é o motivo pelo qual pacientes taquicárdicos recebem rótulo de "QT longo" que desaparece quando a frequência normaliza. Em taquicardia ou bradicardia importantes, prefira Fridericia ou Hodges.',
      ],
      alertas:
        c.bazett >= 500
          ? [
              'QTc ≥ 500 ms: revise a lista de medicamentos (antiarrítmicos classe IA e III, macrolídeos, quinolonas, azólicos, antipsicóticos, metadona, ondansetrona, antidepressivos), corrija potássio, magnésio e cálcio, e monitorize. Magnésio endovenoso é o tratamento da torsades mesmo com magnesemia normal.',
            ]
          : undefined,
      tabela: {
        titulo: 'Faixas de QTc',
        colunas: ['QTc', 'Homens', 'Mulheres'],
        linhas: [
          ['Curto', '< 340 ms', '< 340 ms'],
          ['Normal', '340 – 450 ms', '340 – 460 ms'],
          ['Prolongado', '> 450 ms', '> 460 ms'],
          ['Alto risco', '≥ 500 ms', '≥ 500 ms'],
        ],
        destaque: c.bazett >= 500 ? 3 : c.bazett > limite ? 2 : c.bazett < 340 ? 0 : 1,
      },
    }
  },
  formula: [
    'Bazett:      QTc = QT / √RR',
    'Fridericia:  QTc = QT / ∛RR',
    'Framingham:  QTc = QT + 154 × (1 − RR)',
    'Hodges:      QTc = QT + 1,75 × (FC − 60)',
    'RR em segundos = 60 / FC',
  ],
  fundamento:
    'O QT encurta quando a frequência sobe, porque a duração do potencial de ação depende do ciclo anterior. Comparar QTs medidos em frequências diferentes exige normalizar para 60 bpm — é isso que toda fórmula de correção faz. Bazett usou a raiz quadrada porque foi o que melhor ajustou seus 39 sujeitos; Fridericia, no mesmo ano, propôs a raiz cúbica, que se mostrou superior em quase todas as validações posteriores. Nenhuma correção é perfeita, e é por isso que a recomendação atual é reportar o método usado junto com o valor.',
  armadilhas: [
    'Onda U fundida com a T é a principal fonte de erro de medida. Use o método da tangente e, em caso de dúvida, meça em várias derivações e assuma o maior valor.',
    'Em fibrilação atrial, meça vários ciclos e faça a média — idealmente 10 batimentos consecutivos.',
    'Nunca corrija Bazett em paciente com FC de 130 e conclua "QT longo": recalcule por Fridericia. Esse único erro gera suspensões desnecessárias de antibiótico todos os dias.',
  ],
  referencias: [
    { texto: 'Rautaharju PM, Surawicz B, Gettes LS, et al. AHA/ACCF/HRS recommendations for the standardization and interpretation of the electrocardiogram: part IV. Circulation. 2009;119(10):e241-e250.' },
    { texto: 'Vandenberk B, Vandael E, Robyns T, et al. Which QT correction formulae to use for QT monitoring? J Am Heart Assoc. 2016;5(6):e003264.' },
    { texto: 'Bogossian H, Frommeyer G, Ninios I, et al. New formula for evaluation of the QT interval in patients with left bundle branch block. Heart Rhythm. 2014;11(12):2273-2277.' },
  ],
}

const comparadorQT: Ferramenta = {
  id: 'comparador-formulas-qt',
  nome: 'Comparador das fórmulas de correção do QT',
  sinonimos: ['bazett vs fridericia', 'qual formula qt', 'framingham hodges'],
  resumo: 'Mostra como as quatro fórmulas divergem ao longo da frequência e qual escolher.',
  categorias: ['cardiologia'],
  campos: [
    campoNum('qt', 'Intervalo QT medido', { unidade: 'ms', min: 200, max: 800, passo: 1, padrao: '400', ajuda: 'Do início do QRS ao fim da onda T, medido pelo método da tangente: trace a tangente à porção descendente mais íngreme da T e marque onde ela cruza a linha de base. Use DII ou V5, a derivação com a T mais definida, e escolha o intervalo mais longo entre três batimentos. Onda U não entra.' }),
    campoNum('fc', 'Frequência cardíaca', { unidade: 'bpm', min: 25, max: 250, passo: 1, padrao: '75', ajuda: 'A frequência do mesmo traçado em que o QT foi medido. Em ritmo irregular, use a média de vários intervalos RR — e saiba que em fibrilação atrial nenhuma fórmula de correção é confiável.' }),
  ],
  calcular: (v) => {
    const qt = num(v, 'qt')
    const fc = num(v, 'fc')
    if (qt === null || fc === null || fc <= 0) return null
    const c = corrigirQT(qt, fc)
    const valores = [c.bazett, c.fridericia, c.framingham, c.hodges]
    const amplitude = Math.max(...valores) - Math.min(...valores)
    const linhas: string[][] = []
    for (const f of [40, 50, 60, 75, 90, 110, 130, 150]) {
      const x = corrigirQT(qt, f)
      linhas.push([`${f} bpm`, fmtInt(x.bazett), fmtInt(x.fridericia), fmtInt(x.framingham), fmtInt(x.hodges)])
    }
    return {
      titulo: 'Divergência entre as fórmulas',
      valor: fmtInt(amplitude),
      unidade: 'ms de amplitude',
      nivel: amplitude > 40 ? 'alerta' : amplitude > 20 ? 'atencao' : 'ok',
      rotuloNivel: amplitude > 40 ? 'As fórmulas discordam muito nesta frequência' : amplitude > 20 ? 'Divergência moderada' : 'Concordância boa',
      detalhes: [
        { rotulo: 'Bazett', valor: `${fmtInt(c.bazett)} ms` },
        { rotulo: 'Fridericia', valor: `${fmtInt(c.fridericia)} ms` },
        { rotulo: 'Framingham', valor: `${fmtInt(c.framingham)} ms` },
        { rotulo: 'Hodges', valor: `${fmtInt(c.hodges)} ms` },
        { rotulo: 'Recomendada nesta frequência', valor: fc < 60 || fc > 100 ? 'Fridericia ou Hodges' : 'Qualquer uma (concordam)', nota: fc < 60 || fc > 100 ? 'Fora de 60–100 bpm, Bazett perde acurácia sistematicamente.' : 'Dentro de 60–100 bpm as quatro fórmulas são praticamente intercambiáveis.' },
      ],
      interpretacao: [
        'Todas as fórmulas coincidem exatamente a 60 bpm, porque nessa frequência RR = 1 s e todas as correções se anulam. Quanto mais longe de 60, mais elas divergem — e é aí que a escolha passa a mudar conduta.',
        'Bazett superestima o QTc em taquicardia e subestima em bradicardia. É a fórmula das bulas e dos alarmes automáticos, e responde pela maior parte dos falsos positivos de "QT longo" em pacientes febris ou taquicárdicos.',
        'Para farmacovigilância e ensaios de segurança cardíaca, o guia ICH E14 e a prática regulatória favorecem Fridericia. Para triagem populacional, Framingham e Fridericia têm desempenho semelhante. Hodges tem a melhor performance nos extremos.',
        'O que se está corrigindo, e por quê, esclarece a controvérsia. O intervalo QT representa a duração do **potencial de ação ventricular** — despolarização mais repolarização — e essa duração encurta fisiologicamente quando a frequência aumenta, fenômeno chamado de adaptação do potencial de ação à frequência. O mecanismo é iônico: em frequências altas, os canais lentos de potássio da corrente retificadora tardia I_Ks acumulam ativação entre batimentos sucessivos (o intervalo diastólico é curto demais para a desativação completa), e essa corrente repolarizante residual encurta o potencial de ação seguinte. Somam-se a inativação dependente de cálcio da corrente I_CaL e o aumento do tônus simpático. Corrigir o QT é tentar responder: "quanto duraria este potencial de ação se a frequência fosse 60 bpm?" — de modo que dois pacientes com frequências diferentes possam ser comparados. Bazett propôs em 1920 uma raiz quadrada do intervalo RR a partir de apenas 39 indivíduos jovens e sadios, e a relação real entre QT e RR não é uma raiz quadrada: ela é mais achatada, aproximadamente uma raiz cúbica, o que é exatamente a proposta de Fridericia. Daí o erro sistemático de Bazett — superestimar em taquicardia e subestimar em bradicardia — não ser um defeito de aplicação, mas da forma da curva escolhida. Importa entender o risco que está do outro lado dessa aritmética: o QT prolongado reflete repolarização lenta e heterogênea, que permite reativação de canais de cálcio tipo L antes da repolarização completa, gerando **pós-despolarizações precoces**; em presença de dispersão transmural da repolarização, essas pós-despolarizações disparam reentrada funcional e produzem torsades de pointes. É por isso que hipopotassemia, hipomagnesemia, bradicardia e fármacos bloqueadores de I_Kr se somam de forma multiplicativa, e por que o limiar de 500 ms é tratado como alarme.',
      ],
      conduta: [
        fc < 60 || fc > 100
          ? `A frequência de ${fmtInt(fc)} bpm está fora da faixa em que as fórmulas concordam, e a divergência aqui é de ${fmtInt(amplitude)} ms. **Use Fridericia ou Hodges** e desconsidere o Bazett — que é justamente o que o aparelho costuma imprimir. Registre no prontuário qual fórmula foi usada.`
          : 'Dentro de 60 a 100 bpm as quatro fórmulas são praticamente intercambiáveis: qualquer uma serve, e a discussão perde relevância prática. Ainda assim, registre qual foi usada para permitir comparação futura.',
        'Antes de concluir que há QT longo, **confira a medida manualmente**. O valor automático do eletrocardiógrafo erra com frequência em presença de onda T de baixa amplitude, onda U proeminente, T bifásica, artefato ou ritmo irregular. Use o método da tangente em DII ou V5 e tome o maior de três batimentos.',
        'Corrija os fatores que se somam ao risco, porque eles são multiplicativos e quase sempre reversíveis: **potássio** (alvo 4,0 a 4,5 mEq/L), **magnésio** (alvo acima de 2,0 mg/dL), cálcio, bradicardia, hipotireoidismo, hipotermia e desnutrição. Em QT longo com risco de arritmia, sulfato de magnésio intravenoso é tratamento mesmo com magnesemia normal.',
        'Revise a prescrição item por item procurando fármacos que prolongam o QT — antiarrítmicos das classes IA e III, antipsicóticos (sobretudo haloperidol intravenoso e ziprasidona), macrolídeos e fluoroquinolonas, azóis, ondansetrona, metadona, antidepressivos (citalopram e escitalopram), domperidona, hidroxicloroquina. Aplique o **escore de Tisdale** para quantificar o risco quando houver vários fatores.',
        'Se o QTc corrigido por Fridericia estiver acima de 500 ms, ou se houver aumento superior a 60 ms em relação ao basal, suspenda o fármaco suspeito, monitorize o ritmo, corrija eletrólitos e reavalie. Torsades sustentada ou com instabilidade é emergência: magnésio intravenoso, aumento da frequência por marcapasso ou isoprenalina (o QT é dependente de frequência) e cardioversão se houver degeneração para fibrilação ventricular.',
        'QT longo persistente após correção de tudo o que é reversível, sobretudo em jovem, com síncope de esforço ou história familiar de morte súbita, exige investigação de **síndrome do QT longo congênito**: eletrocardiograma dos familiares de primeiro grau, teste ergométrico e teste genético.',
      ],
      alertas: [
        'Registre sempre qual fórmula foi usada. Comparar um QTc de Bazett de hoje com um de Fridericia de ontem produz variação artificial que pode chegar a dezenas de milissegundos e motivar suspensão indevida de medicamento.',
        'O QTc impresso automaticamente pelo aparelho é quase sempre Bazett, que é a fórmula de pior desempenho fora de 60 a 100 bpm. Em paciente febril, taquicárdico ou bradicárdico, confirme com Fridericia antes de qualquer decisão.',
        'Nenhuma fórmula de correção é confiável em **fibrilação atrial**, em ritmo irregular, sob bloqueio de ramo ou em ritmo de marcapasso. No bloqueio de ramo, o QRS alargado infla o QT e existem correções específicas (subtrair o excesso de duração do QRS) — o QTc bruto superestima.',
        'Corrigir o QT não corrige o risco. Um QTc de 480 ms com potássio de 2,8 mEq/L e três fármacos prolongadores é muito mais perigoso que os mesmos 480 ms sem nenhum desses fatores.',
      ],
      tabela: {
        titulo: `QTc do mesmo QT de ${fmtInt(qt)} ms em diferentes frequências`,
        colunas: ['FC', 'Bazett', 'Fridericia', 'Framingham', 'Hodges'],
        linhas,
      },
    }
  },
  formula: ['A 60 bpm (RR = 1 s), QTc = QT em todas as fórmulas'],
  fundamento:
    'Comparar as fórmulas lado a lado é o modo mais rápido de entender por que a discussão existe. Bazett aplica uma potência de 0,5 ao RR; Fridericia, 0,33; Framingham e Hodges usam correções lineares. Quando a frequência se afasta de 60 bpm, o expoente escolhido domina o resultado, e a diferença entre Bazett e Fridericia pode passar de 40 ms — exatamente a magnitude que separa "normal" de "suspender o medicamento".',
  armadilhas: [
    'Registre sempre qual fórmula foi usada. Comparar um QTc de Bazett de hoje com um de Fridericia de ontem produz uma variação artificial.',
    'O eletrocardiógrafo imprime Bazett por padrão — a pior fórmula fora de 60 a 100 bpm. Aceitar o valor automático em paciente taquicárdico é a causa mais comum de falso "QT longo".',
    'A medida do QT é mais frágil que a correção: onda T de baixa amplitude, T bifásica, onda U proeminente e artefato geram erro de dezenas de milissegundos. Meça pelo método da tangente, em DII ou V5, no maior de três batimentos.',
    'Onda U não faz parte do QT. Incluí-la — erro frequente na hipopotassemia, em que a U é proeminente — prolonga artificialmente a medida justamente no paciente em que o risco real já está aumentado.',
    'Em bloqueio de ramo ou ritmo de marcapasso, o QRS alargado infla o QT. O QTc bruto superestima e existem correções específicas que descontam o excesso de duração do QRS.',
    'Em fibrilação atrial e em qualquer ritmo irregular, nenhuma correção é válida, porque o QT do batimento depende do RR precedente e da história recente de intervalos.',
    'A comparação com o basal vale mais que o valor absoluto: aumento de mais de 60 ms em relação ao eletrocardiograma prévio é sinal de alarme mesmo com QTc ainda abaixo de 500 ms.',
  ],
  referencias: [
    { texto: 'Vandenberk B, et al. Which QT correction formulae to use for QT monitoring? J Am Heart Assoc. 2016;5(6):e003264.' },
    { texto: 'ICH E14 Guideline: The clinical evaluation of QT/QTc interval prolongation. 2005 (com Q&A revisadas).' },
  ],
}

const eixo: Ferramenta = {
  id: 'eixo-eletrico',
  nome: 'Eixo elétrico do QRS',
  sinonimos: ['eixo cardiaco', 'desvio de eixo', 'axis'],
  resumo: 'Calcula o eixo em graus a partir das amplitudes líquidas de DI e aVF.',
  categorias: ['cardiologia'],
  campos: [
    campoNum('di', 'Amplitude líquida do QRS em DI', { unidade: 'mm', min: -30, max: 30, passo: 0.5, ajuda: 'Some as deflexões positivas e subtraia as negativas: R − (Q + S).' }),
    campoNum('avf', 'Amplitude líquida do QRS em aVF', { unidade: 'mm', min: -30, max: 30, passo: 0.5, ajuda: 'Mesma regra: R menos (Q + S), com sinal. aVF ocupa +90° no plano frontal e é perpendicular a DI, o que permite tratar as duas como coordenadas cartesianas.' }),
    campoNum('dii', 'Amplitude líquida em DII', { unidade: 'mm', min: -30, max: 30, passo: 0.5, opcional: true, ajuda: 'Opcional — usada para conferência.' }),
  ],
  calcular: (v) => {
    const di = num(v, 'di')
    const avf = num(v, 'avf')
    const dii = num(v, 'dii')
    if (di === null || avf === null) return null
    if (di === 0 && avf === 0) return null
    const rad = Math.atan2(avf, di)
    let g = (rad * 180) / Math.PI
    if (g > 180) g -= 360
    if (g < -180) g += 360
    let classe = ''
    let nivel: Nivel = 'ok'
    let leitura = ''
    if (g >= -30 && g <= 90) {
      classe = 'Eixo normal'
      leitura = 'Eixo entre −30° e +90°. Alguns autores estendem o normal até +100° em jovens e até 0° em idosos.'
    } else if (g > -90 && g < -30) {
      classe = 'Desvio do eixo para a esquerda'
      nivel = 'atencao'
      leitura = 'Desvio esquerdo: bloqueio divisional anterossuperior (o mais comum), hipertrofia ventricular esquerda, infarto inferior prévio, marca-passo em via de saída de VD, hipercalemia. No bloqueio divisional anterossuperior espera-se rS em DII, DIII e aVF, com qR em DI e aVL.'
    } else if (g > 90 && g <= 180) {
      classe = 'Desvio do eixo para a direita'
      nivel = 'atencao'
      leitura = 'Desvio direito: sobrecarga de ventrículo direito, cor pulmonale, embolia pulmonar, bloqueio divisional posteroinferior, infarto lateral, dextrocardia, criança e longilíneo normais. Sempre confira a colocação dos eletrodos antes de concluir.'
    } else {
      classe = 'Eixo indeterminado (noroeste)'
      nivel = 'alerta'
      leitura = 'Eixo no quadrante superior direito, entre −90° e ±180°: taquicardia ventricular, ritmo de marca-passo, hipercalemia grave, enfisema avançado, dextrocardia, ou — muito frequentemente — troca de eletrodos dos membros.'
    }
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'DI (0°)', valor: `${fmt(di, 1)} mm`, nota: di >= 0 ? 'Positiva' : 'Negativa' },
      { rotulo: 'aVF (+90°)', valor: `${fmt(avf, 1)} mm`, nota: avf >= 0 ? 'Positiva' : 'Negativa' },
      { rotulo: 'Método rápido dos quadrantes', valor: `DI ${di >= 0 ? '+' : '−'} / aVF ${avf >= 0 ? '+' : '−'}`, nota: di >= 0 && avf >= 0 ? 'Ambas positivas → eixo normal, sem necessidade de conta.' : di >= 0 && avf < 0 ? 'DI positiva e aVF negativa → esquerda (confirme com DII: se DII for positiva, o eixo ainda está entre 0° e −30°, normal).' : di < 0 && avf >= 0 ? 'DI negativa e aVF positiva → direita.' : 'Ambas negativas → indeterminado / noroeste.' },
    ]
    if (dii !== null)
      detalhes.push({ rotulo: 'DII (+60°)', valor: `${fmt(dii, 1)} mm`, nota: di >= 0 && avf < 0 ? (dii >= 0 ? 'DII positiva confirma eixo entre 0° e −30°: ainda normal.' : 'DII negativa confirma desvio esquerdo verdadeiro (além de −30°).') : 'Conferência.' })
    return {
      titulo: 'Eixo elétrico do QRS',
      valor: `${fmtInt(g)}°`,
      nivel,
      rotuloNivel: classe,
      detalhes,
      interpretacao: [
        leitura,
        'A derivação em que o QRS é mais isodifásico aponta o eixo perpendicular a ela — é o atalho de leitura visual mais rápido e dispensa medida. Se o QRS é isodifásico em aVL (−30°), o eixo está a +60°.',
        'Por que o eixo normal aponta para baixo e para a esquerda tem explicação anatômica e elétrica. A ativação ventricular começa no endocárdio septal esquerdo, por ramos do feixe de His, e se propaga do endocárdio para o epicárdio em ambos os ventrículos ao mesmo tempo. Como a massa do ventrículo esquerdo é cerca de três vezes a do direito, os vetores de despolarização das duas câmaras se cancelam parcialmente e o **vetor resultante** é dominado pela parede livre do ventrículo esquerdo — que, na posição anatômica normal do coração, aponta para baixo, para a esquerda e para trás. Daí o eixo normal entre −30° e +90°. Essa dependência da massa explica de imediato os dois desvios: hipertrofia ou sobrecarga do ventrículo direito reduz o cancelamento e desloca o eixo para a direita, enquanto perda de massa inferior (infarto inferior prévio) ou bloqueio de condução na divisão anterossuperior do ramo esquerdo desloca para a esquerda. Vale notar que o mecanismo do desvio esquerdo mais comum não é hipertrofia e sim **bloqueio divisional**: quando a divisão anterossuperior deixa de conduzir, a ativação da parede anterolateral ocorre tardiamente, por via transeptal a partir da divisão posteroinferior, e o vetor tardio resultante aponta para cima e para a esquerda. Por isso o padrão típico é rS em DII, DIII e aVF com qR em DI e aVL — a sequência de ativação mudou, não a massa. Também por isso a posição do coração no tórax importa: obesidade e gravidez elevam o diafragma e horizontalizam o coração, deslocando o eixo para a esquerda sem doença nenhuma, enquanto o longilíneo e a criança têm eixo mais à direita por verticalização.',
      ],
      conduta: [
        g >= -30 && g <= 90
          ? 'Eixo normal. Nenhuma investigação é disparada por este achado — prossiga com a leitura sistemática do restante do traçado (ritmo, frequência, intervalos, morfologia, repolarização).'
          : g > -90 && g < -30
            ? 'Desvio esquerdo: confira primeiro a **morfologia** para identificar bloqueio divisional anterossuperior (rS em DII, DIII e aVF com qR em DI e aVL), que é a causa mais comum e isoladamente benigna. Depois procure hipertrofia ventricular esquerda (aplique Sokolow-Lyon, Cornell e o produto de Cornell) e onda Q inferior de infarto prévio. Em paciente com fator de risco cardiovascular, o achado justifica ecocardiograma.'
            : g > 90 && g <= 180
              ? 'Desvio direito: **confira a posição dos eletrodos antes de qualquer conclusão** e procure as causas na ordem de probabilidade clínica — sobrecarga aguda de ventrículo direito (embolia pulmonar, com S1Q3T3, bloqueio de ramo direito novo e taquicardia), cor pulmonale, doença pulmonar crônica, bloqueio divisional posteroinferior, infarto lateral e dextrocardia. Em jovem longilíneo assintomático pode ser variação normal.'
              : 'Eixo indeterminado (quadrante noroeste): a causa mais comum é **troca de eletrodos dos membros**, e o sinal delator é P negativa em DI com aVR positiva. Repita o traçado com o posicionamento conferido antes de investigar taquicardia ventricular, hipercalemia grave, enfisema avançado, ritmo de marcapasso ou dextrocardia.',
        'Compare com traçados anteriores sempre que possível. Desvio de eixo **novo** tem significado inteiramente diferente de desvio antigo e estável: novo desvio direito com taquicardia e dispneia levanta embolia pulmonar, e novo desvio esquerdo pode indicar doença de condução progressiva.',
        'Trate o eixo como pista e não como diagnóstico: ele orienta onde olhar no restante do traçado e na clínica, e praticamente nunca fecha diagnóstico isoladamente.',
        g < -90 || g > 90
          ? 'Se houver taquicardia com QRS largo e eixo no quadrante noroeste, considere taquicardia ventricular — aplique os critérios de Brugada ou de Vereckei e trate como ventricular até prova em contrário, que é a conduta segura.'
          : 'Registre o valor em graus no prontuário. É um dado objetivo e comparável, ao contrário de "desvio leve para a esquerda".',
      ],
      alertas: [
        'Troca de eletrodos dos membros é a causa mais frequente de eixo bizarro e de eixo noroeste. Antes de investigar dextrocardia ou arritmia, verifique P negativa em DI com aVR positiva e repita o traçado.',
        'O eixo depende da posição do coração no tórax, e não apenas da massa: obesidade, gravidez e ascite horizontalizam e desviam para a esquerda; o longilíneo e a criança têm eixo mais à direita. Nenhuma dessas situações é doença.',
        'Bloqueio de ramo, pré-excitação e ritmo de marcapasso alteram a sequência de ativação ventricular, e o eixo calculado deixa de refletir a orientação anatômica do vetor de massa.',
        'Desvio direito **novo** em paciente com dispneia aguda é achado de alarme: aplique o escore de Wells ou o de Genebra e considere embolia pulmonar, sobretudo se houver bloqueio de ramo direito incompleto novo e taquicardia sinusal.',
      ],
      tabela: {
        titulo: 'Quadrantes, leitura rápida e causas',
        colunas: ['DI / aVF', 'Faixa', 'Classificação', 'Causas mais comuns'],
        linhas: [
          ['+ / +', '0° a +90°', 'Normal', 'Sem investigação disparada'],
          ['+ / −', '−30° a −90°', 'Desvio esquerdo (se DII negativa)', 'Bloqueio divisional anterossuperior, HVE, infarto inferior'],
          ['− / +', '+90° a +180°', 'Desvio direito', 'Sobrecarga de VD, embolia pulmonar, DPOC, longilíneo'],
          ['− / −', '−90° a ±180°', 'Indeterminado (noroeste)', 'Troca de eletrodos, TV, hipercalemia, dextrocardia'],
        ],
        destaque: g >= -30 && g <= 90 ? 0 : g > -90 && g < -30 ? 1 : g > 90 && g <= 180 ? 2 : 3,
      },
    }
  },
  formula: ['Eixo = arco-tangente (aVF ÷ DI), com DI em 0° e aVF em +90°'],
  fundamento:
    'O ECG de membros projeta o vetor médio de despolarização ventricular sobre um plano frontal em que cada derivação ocupa um ângulo fixo: DI a 0°, DII a +60°, aVF a +90°, DIII a +120°, aVR a −150° e aVL a −30°. Como DI e aVF são perpendiculares entre si, elas formam um sistema de coordenadas cartesianas — a amplitude líquida em cada uma é a projeção do vetor sobre aquele eixo, e a arco-tangente devolve o ângulo. É geometria vetorial pura aplicada a um traçado de papel.',
  armadilhas: [
    'Amplitude líquida significa somar tudo: uma onda R de 8 mm com S de 12 mm dá −4 mm, não +8.',
    'Troca de eletrodos de braço direito e esquerdo é a causa mais comum de eixo bizarro. O sinal é P negativa em DI com aVR positiva — verifique antes de investigar dextrocardia.',
    'O eixo isolado quase nunca faz diagnóstico; ele é uma pista que exige o restante do traçado e a clínica.',
  ],
  referencias: [
    { texto: 'Surawicz B, Childers R, Deal BJ, Gettes LS. AHA/ACCF/HRS recommendations for the standardization and interpretation of the electrocardiogram: part III. Circulation. 2009;119(10):e235-e240.' },
    { texto: 'Rautaharju PM, Surawicz B, Gettes LS. AHA/ACCF/HRS recommendations for the standardization and interpretation of the electrocardiogram: part IV — the ST segment, T and U waves, and the QT interval. Circulation. 2009;119(10):e241-e250.' },
    { texto: 'Elizari MV, Acunzo RS, Ferreiro M. Hemiblocks revisited. Circulation. 2007;115(9):1154-1163.' },
  ],
}

const criteriosHVE: Ferramenta = {
  id: 'criterios-hve',
  nome: 'Critérios eletrocardiográficos de hipertrofia ventricular esquerda',
  sinonimos: ['hve', 'hvE', 'sobrecarga ventricular esquerda', 'romhilt', 'peguero'],
  resumo: 'Aplica simultaneamente Sokolow-Lyon, Cornell, produto de Cornell, Romhilt-Estes e Peguero.',
  categorias: ['cardiologia'],
  campos: [
    campoSexo(),
    campoNum('sv1', 'Onda S em V1', { ajuda: 'Meça em milímetros, com o ECG calibrado em 10 mm/mV — calibração pela metade é causa frequente de critério falsamente negativo.', unidade: 'mm', min: 0, max: 60, passo: 0.5 }),
    campoNum('rv5', 'Onda R em V5', { ajuda: 'Amplitude da onda R em V5, em milímetros. Use a maior entre V5 e V6 para o índice de Sokolow-Lyon.', unidade: 'mm', min: 0, max: 60, passo: 0.5 }),
    campoNum('rv6', 'Onda R em V6', { unidade: 'mm', min: 0, max: 60, passo: 0.5 }),
    campoNum('ravl', 'Onda R em aVL', { ajuda: 'Onda R em aVL, componente do índice de Cornell, que soma S em V3 e tem melhor especificidade que Sokolow.', unidade: 'mm', min: 0, max: 40, passo: 0.5 }),
    campoNum('sv3', 'Onda S em V3', { unidade: 'mm', min: 0, max: 60, passo: 0.5 }),
    campoNum('sProfunda', 'Onda S mais profunda de qualquer derivação precordial', { unidade: 'mm', min: 0, max: 60, passo: 0.5, ajuda: 'Usada no critério de Peguero-Lo Presti, o de melhor sensibilidade publicada.' }),
    campoNum('qrsDur', 'Duração do QRS', { ajuda: 'Duração do QRS em milissegundos. Acima de 120 ms há bloqueio de ramo, e os critérios de voltagem perdem validade.', unidade: 'ms', min: 60, max: 200, passo: 1, padrao: '90' }),
    campoSimNao('padraoStrain', 'Padrão de sobrecarga (strain): infra de ST com T assimétrica invertida em V5-V6', 3),
    campoSimNao('atrioEsq', 'Sobrecarga atrial esquerda (P bifásica em V1 com componente negativo ≥ 1 mm × 40 ms)', 3),
    campoSimNao('desvioEixo', 'Desvio do eixo ≤ −30°', 2),
    campoSimNao('deflexao', 'Deflexão intrinsecoide em V5-V6 ≥ 50 ms', 1),
  ],
  calcular: (v, ) => {
    const sexo = opc(v, 'sexo')
    const sv1 = num(v, 'sv1')
    const rv5 = num(v, 'rv5')
    const rv6 = num(v, 'rv6')
    const ravl = num(v, 'ravl')
    const sv3 = num(v, 'sv3')
    const sProf = num(v, 'sProfunda')
    const qrsDur = numOu(v, 'qrsDur', 90)
    if (sv1 === null || rv5 === null || rv6 === null || ravl === null || sv3 === null) return null

    const sokolow = sv1 + Math.max(rv5, rv6)
    const sokolowPos = sokolow >= 35
    const cornell = ravl + sv3
    const limiteCornell = sexo === 'f' ? 20 : 28
    const cornellPos = cornell > limiteCornell
    const produtoCornell = (cornell + (sexo === 'f' ? 6 : 0)) * qrsDur
    const produtoPos = produtoCornell > 2440
    const peguero = sProf !== null ? sProf + sv3 : null
    const limitePeguero = sexo === 'f' ? 23 : 28
    const pegueroPos = peguero !== null && peguero >= limitePeguero
    const ravlPos = ravl >= 11

    // Romhilt-Estes
    let romhilt = 0
    const maiorAmplitude = Math.max(sv1, rv5, rv6, ravl, sv3, sProf ?? 0)
    if (maiorAmplitude >= 30 || Math.max(rv5, rv6) >= 30 || sv1 >= 30) romhilt += 3
    if (sim(v, 'padraoStrain')) romhilt += 3
    romhilt += pts(v, 'atrioEsq', 3)
    romhilt += pts(v, 'desvioEixo', 2)
    if (qrsDur >= 90) romhilt += 1
    romhilt += pts(v, 'deflexao', 1)

    const criterios = [sokolowPos, cornellPos, produtoPos, pegueroPos, ravlPos, romhilt >= 5]
    const positivos = criterios.filter(Boolean).length

    return {
      titulo: 'Critérios positivos para HVE',
      valor: `${positivos} de 6`,
      nivel: positivos >= 3 ? 'alerta' : positivos >= 1 ? 'atencao' : 'ok',
      rotuloNivel: positivos === 0 ? 'Nenhum critério preenchido' : positivos >= 3 ? 'Múltiplos critérios positivos' : 'Critérios isolados positivos',
      detalhes: [
        { rotulo: 'Sokolow-Lyon (S V1 + R V5 ou V6)', valor: `${fmt(sokolow, 1)} mm`, nota: 'Positivo ≥ 35 mm. Sensibilidade baixa (cerca de 25%), especificidade alta.', nivel: sokolowPos ? 'alerta' : 'ok' },
        { rotulo: 'R em aVL isolada', valor: `${fmt(ravl, 1)} mm`, nota: 'Positivo ≥ 11 mm — critério de Sokolow para o plano frontal.', nivel: ravlPos ? 'alerta' : 'ok' },
        { rotulo: 'Voltagem de Cornell (R aVL + S V3)', valor: `${fmt(cornell, 1)} mm`, nota: `Positivo > ${limiteCornell} mm em ${sexo === 'f' ? 'mulheres' : 'homens'}.`, nivel: cornellPos ? 'alerta' : 'ok' },
        { rotulo: 'Produto de Cornell', valor: `${fmtInt(produtoCornell)} mm·ms`, nota: 'Positivo > 2440 mm·ms. Ao multiplicar pela duração do QRS, incorpora o atraso de condução da parede espessada — melhora a sensibilidade sem perder especificidade, e é o critério usado no estudo LIFE.', nivel: produtoPos ? 'alerta' : 'ok' },
        { rotulo: 'Peguero-Lo Presti (S mais profunda + S V3)', valor: peguero === null ? '—' : `${fmt(peguero, 1)} mm`, nota: `Positivo ≥ ${limitePeguero} mm. Sensibilidade em torno de 62%, a melhor entre os critérios de voltagem.`, nivel: pegueroPos ? 'alerta' : 'ok' },
        { rotulo: 'Escore de Romhilt-Estes', valor: `${romhilt} pontos`, nota: '≥ 5 pontos = HVE provável; 4 pontos = HVE possível. É o único que combina voltagem, repolarização, átrio e condução.', nivel: romhilt >= 5 ? 'alerta' : romhilt === 4 ? 'atencao' : 'ok' },
      ],
      conduta: [
        'Critério **positivo** não fecha diagnóstico: a sensibilidade do ECG para hipertrofia é de 20–50%. Confirme com **ecocardiograma**, que mede massa ventricular indexada e espessura parietal, e é ele que define a conduta.',
        'Confirmada a hipertrofia, a tarefa seguinte é **descobrir a causa**, porque o tratamento diverge radicalmente: hipertensão (a mais comum), estenose aórtica, cardiomiopatia hipertrófica, amiloidose cardíaca ou doença de Fabry. Baixa voltagem periférica com padrão de hipertrofia ao ecocardiograma é a pista clássica de amiloidose e pede cintilografia com pirofosfato e pesquisa de cadeias leves.',
        'Na hipertrofia **hipertensiva**, a meta pressórica é mais rigorosa (< 130/80 mmHg) e a escolha do fármaco importa: IECA ou BRA promovem regressão da massa ventricular além do efeito pressórico, enquanto vasodilatadores diretos regridem pouco. A regressão da hipertrofia reduz eventos de forma independente da queda da pressão.',
        'O padrão de **sobrecarga** (infradesnivelamento de ST com T invertida assimétrica em V5–V6) marca hipertrofia de maior gravidade e deve ser tratado como marcador de risco, não como isquemia — mas só depois de afastada doença coronariana, que frequentemente coexiste.',
        'Registre que a hipertrofia é **fator de risco independente** para fibrilação atrial, insuficiência cardíaca com fração de ejeção preservada e morte súbita. Isso muda o limiar para investigar palpitações e para rastrear apneia obstrutiva do sono, causa tratável e subdiagnosticada de hipertrofia refratária.',
      ],
      interpretacao: [
        'Nenhum critério eletrocardiográfico de HVE é sensível. Contra o ecocardiograma como padrão, a sensibilidade dos critérios de voltagem clássicos fica entre 20 e 50%, com especificidade de 85 a 95%. Traduzindo: **ECG normal não exclui HVE**, mas critério positivo em paciente com hipertensão tem valor preditivo alto.',
        'A voltagem sofre com tudo que fica entre o coração e o eletrodo: obesidade, enfisema, derrame pericárdico e mama volumosa reduzem as amplitudes; magreza e parede torácica fina as aumentam. Um jovem magro com Sokolow de 40 mm e ecocardiograma normal é achado corriqueiro.',
        'O valor prognóstico é independente do diagnóstico anatômico: a regressão da voltagem de Cornell sob tratamento anti-hipertensivo associou-se a menos eventos cardiovasculares no estudo LIFE, o que faz do critério um alvo de acompanhamento, não apenas de diagnóstico.',
      ],
      alertas: ['Na presença de bloqueio de ramo esquerdo, os critérios de voltagem convencionais perdem validade — a despolarização anômala altera as amplitudes de forma independente da massa.'],
    }
  },
  formula: [
    'Sokolow-Lyon: S(V1) + R(V5 ou V6) ≥ 35 mm  |  R(aVL) ≥ 11 mm',
    'Cornell: R(aVL) + S(V3) > 28 mm (♂) ou > 20 mm (♀)',
    'Produto de Cornell: [R(aVL) + S(V3) (+6 mm em ♀)] × duração do QRS > 2440 mm·ms',
    'Peguero-Lo Presti: S mais profunda + S(V3) ≥ 28 mm (♂) ou ≥ 23 mm (♀)',
  ],
  fundamento:
    'Uma parede ventricular mais espessa gera mais corrente e demora mais para despolarizar. Os critérios de voltagem capturam a primeira consequência (amplitudes maiores nas derivações que "olham" o ventrículo esquerdo); o produto de Cornell captura as duas, multiplicando a voltagem pela duração do QRS. Romhilt-Estes vai além e incorpora os sinais indiretos: sobrecarga atrial esquerda (consequência da disfunção diastólica), padrão de strain (consequência da isquemia subendocárdica relativa) e desvio de eixo.',
  armadilhas: [
    'Confira a calibração do traçado: 10 mm/mV é o padrão. Registro em meia calibração reduz todas as amplitudes pela metade e produz falsos negativos.',
    'Critério de voltagem positivo isoladamente em jovem magro assintomático raramente significa doença — o valor preditivo positivo depende da prevalência, e ela é baixa nessa população.',
  ],
  referencias: [
    { texto: 'Sokolow M, Lyon TP. The ventricular complex in left ventricular hypertrophy. Am Heart J. 1949;37(2):161-186.' },
    { texto: 'Casale PN, Devereux RB, Alonso DR, et al. Improved sex-specific criteria of left ventricular hypertrophy for clinical and computer interpretation of electrocardiograms. Circulation. 1987;75(3):565-572.' },
    { texto: 'Peguero JG, Lo Presti S, Perez J, et al. Electrocardiographic criteria for the diagnosis of left ventricular hypertrophy. J Am Coll Cardiol. 2017;69(13):1694-1703.' },
    { texto: 'Romhilt DW, Estes EH Jr. A point-score system for the ECG diagnosis of left ventricular hypertrophy. Am Heart J. 1968;75(6):752-758.' },
  ],
}

const sokolow: Ferramenta = {
  id: 'sokolow-lyon',
  nome: 'Critério de Sokolow-Lyon',
  sinonimos: ['sokolow', 'sokolow lyon'],
  resumo: 'O critério de voltagem clássico para hipertrofia ventricular esquerda e direita.',
  categorias: ['cardiologia'],
  campos: [
    campoNum('sv1', 'Onda S em V1', { unidade: 'mm', min: 0, max: 60, passo: 0.5, ajuda: 'Profundidade da S, em milímetros, medida da linha de base ao nadir. Confira antes que a calibração esteja em 10 mm/mV — registro em meia voltagem reduz todas as amplitudes pela metade.' }),
    campoNum('rv5', 'Onda R em V5', { unidade: 'mm', min: 0, max: 60, passo: 0.5, ajuda: 'Altura da R, da linha de base ao ápice. O critério usa apenas a MAIOR entre V5 e V6, não a soma das duas.' }),
    campoNum('rv6', 'Onda R em V6', { unidade: 'mm', min: 0, max: 60, passo: 0.5, ajuda: 'Informe as duas derivações: a ferramenta escolhe automaticamente a de maior amplitude, como manda o critério original.' }),
    campoNum('ravl', 'Onda R em aVL', { unidade: 'mm', min: 0, max: 40, passo: 0.5, opcional: true, ajuda: 'Opcional. Critério independente do plano frontal, positivo isoladamente com R ≥ 11 mm — muito específico e pouco sensível.' }),
    campoNum('rv1', 'Onda R em V1', { unidade: 'mm', min: 0, max: 40, passo: 0.5, opcional: true, ajuda: 'Para o critério de hipertrofia ventricular direita.' }),
    campoNum('sv5v6', 'Onda S em V5 ou V6', { unidade: 'mm', min: 0, max: 40, passo: 0.5, opcional: true, ajuda: 'Opcional, usada apenas com a R em V1 para o critério de hipertrofia ventricular DIREITA. Informe a mais profunda das duas.' }),
  ],
  calcular: (v) => {
    const sv1 = num(v, 'sv1')
    const rv5 = num(v, 'rv5')
    const rv6 = num(v, 'rv6')
    const ravl = num(v, 'ravl')
    const rv1 = num(v, 'rv1')
    const sv5v6 = num(v, 'sv5v6')
    if (sv1 === null || rv5 === null || rv6 === null) return null
    const indice = sv1 + Math.max(rv5, rv6)
    const positivo = indice >= 35
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'S em V1', valor: `${fmt(sv1, 1)} mm` },
      { rotulo: 'Maior R entre V5 e V6', valor: `${fmt(Math.max(rv5, rv6), 1)} mm` },
      { rotulo: 'Ponto de corte', valor: '≥ 35 mm (3,5 mV)' },
    ]
    if (ravl !== null) detalhes.push({ rotulo: 'R em aVL (critério do plano frontal)', valor: `${fmt(ravl, 1)} mm`, nota: 'Positivo ≥ 11 mm', nivel: ravl >= 11 ? 'alerta' : 'ok' })
    if (rv1 !== null && sv5v6 !== null)
      detalhes.push({ rotulo: 'Sokolow para HVD: R(V1) + S(V5 ou V6)', valor: `${fmt(rv1 + sv5v6, 1)} mm`, nota: 'Positivo > 10,5 mm', nivel: rv1 + sv5v6 > 10.5 ? 'alerta' : 'ok' })
    return {
      titulo: 'Índice de Sokolow-Lyon',
      valor: fmt(indice, 1),
      unidade: 'mm',
      nivel: positivo ? 'alerta' : 'ok',
      rotuloNivel: positivo ? 'Critério positivo para HVE' : 'Critério negativo',
      detalhes,
      interpretacao: [
        'Descrito em 1949, é o critério mais decorado e o menos sensível: identifica cerca de um quarto das hipertrofias documentadas em ecocardiograma, com especificidade alta. Serve para confirmar, nunca para excluir.',
        'Em adultos jovens abaixo de 35 anos, o ponto de corte convencional gera muitos falsos positivos por causa da parede torácica fina — vários autores sugerem elevar o corte para 40 a 45 mm nessa faixa.',
        'A física por trás do critério explica todas as suas falhas. O eletrocardiograma mede a diferença de potencial na superfície do corpo gerada pela frente de despolarização do miocárdio, e o corpo funciona como um **condutor de volume**: a amplitude que chega ao eletrodo depende do momento dipolar do coração, mas também da distância até o eletrodo e da condutividade dos tecidos interpostos. Como o potencial cai aproximadamente com o quadrado da distância, alguns centímetros de gordura ou de pulmão hiperinsuflado entre o coração e a parede reduzem a voltagem muito mais do que a hipertrofia a aumenta. É por isso que obesidade e enfisema produzem falso-negativo, magreza produz falso-positivo, e derrame pericárdico ou pleural atenuam tudo. Há um segundo limite, ainda mais fundamental: na hipertrofia **concêntrica** — a que resulta de sobrecarga pressórica na hipertensão e na estenose aórtica — o sarcômero se adiciona em paralelo, a parede engrossa e a cavidade não dilata, de modo que a massa total pode aumentar bastante com pouca mudança no vetor elétrico resultante. Na hipertrofia **excêntrica**, por sobrecarga de volume, o sarcômero se adiciona em série, a cavidade dilata e o coração se aproxima da parede torácica: aí a voltagem sobe com fidelidade. O critério de voltagem é, portanto, sistematicamente melhor na hipertrofia excêntrica do que na concêntrica, o que é o inverso do que a prática clínica mais precisa. Isso tem uma consequência importante: sensibilidade baixa é uma limitação intrínseca ao método, não um defeito do ponto de corte, e nenhum ajuste de valor a resolve.',
      ],
      conduta: [
        positivo
          ? 'Critério positivo: solicite **ecocardiograma** para confirmar a hipertrofia, medir a massa ventricular indexada, definir o padrão geométrico (concêntrico ou excêntrico), avaliar função sistólica e diastólica e procurar a causa — estenose aórtica, cardiomiopatia hipertrófica, cardiopatia hipertensiva. O eletrocardiograma sugere; o ecocardiograma decide.'
          : 'Critério negativo **não exclui** hipertrofia: a sensibilidade é de cerca de 25%. Se houver hipertensão de longa data, sopro sistólico, alteração de repolarização, história familiar de cardiomiopatia hipertrófica ou morte súbita precoce, prossiga com ecocardiograma independentemente do índice.',
        'Procure e trate a causa da sobrecarga. Na cardiopatia hipertensiva, o controle pressórico com bloqueador do sistema renina-angiotensina-aldosterona produz **regressão** da massa ventricular — o desfecho do estudo LIFE mostrou que a redução da voltagem eletrocardiográfica ao longo do tratamento se associa a menos eventos cardiovasculares, independentemente da pressão alcançada.',
        'Integre os outros critérios em vez de decidir por um só: Cornell (que ajusta por sexo), produto de Cornell (que incorpora a duração do QRS), Romhilt-Estes (que soma alterações não voltagem) e Peguero-Lo Presti (mais sensível). A concordância entre vários critérios é mais informativa que qualquer um isolado.',
        'Se o índice for positivo em adulto jovem magro e assintomático, sem hipertensão e com repolarização normal, considere **variação da normalidade** antes de investigar: nessa população o corte convencional de 35 mm gera muitos falsos-positivos, e vários autores sugerem 40 a 45 mm.',
        'Registre o valor numérico no prontuário, não apenas "positivo". Acompanhar a evolução do índice ao longo dos anos é uma medida barata e útil de resposta ao tratamento anti-hipertensivo.',
      ],
      alertas: [
        'Voltagem alta isolada não é diagnóstico de hipertrofia, e voltagem normal não a exclui. O padrão de referência é a massa ventricular indexada medida por ecocardiograma ou ressonância.',
        'Bloqueio de ramo esquerdo, pré-excitação, ritmo de marcapasso e bloqueio fascicular invalidam os critérios de voltagem — a sequência de ativação ventricular está alterada e o vetor não reflete mais a massa.',
        'Alteração de repolarização associada (sobrecarga ventricular, inversão de T nas precordiais esquerdas) agrava o significado prognóstico e não deve ser lida como achado secundário. Em adulto jovem, esse conjunto levanta cardiomiopatia hipertrófica e exige investigação.',
        'A calibração do aparelho precisa estar em 10 mm/mV. Registro em meia voltagem, usado quando o traçado satura, reduz todas as amplitudes pela metade e produz falso-negativo sistemático — confira o pulso de calibração antes de medir.',
      ],
      tabela: {
        titulo: 'Critérios de Sokolow-Lyon',
        colunas: ['Critério', 'Cálculo', 'Corte', 'Observação'],
        linhas: [
          ['HVE precordial', 'S(V1) + R(V5 ou V6)', '≥ 35 mm', 'Elevar para 40–45 mm abaixo de 35 anos'],
          ['HVE plano frontal', 'R(aVL)', '≥ 11 mm', 'Muito específico, pouco sensível'],
          ['HVD', 'R(V1) + S(V5 ou V6)', '> 10,5 mm', 'Avaliar sobrecarga pressórica direita'],
        ],
        destaque: 0,
      },
    }
  },
  formula: ['HVE: S(V1) + R(V5 ou V6) ≥ 35 mm', 'HVE: R(aVL) ≥ 11 mm', 'HVD: R(V1) + S(V5 ou V6) > 10,5 mm'],
  fundamento:
    'A hipótese é direta: massa muscular maior gera vetor elétrico maior, e o vetor do ventrículo esquerdo aponta para a esquerda e para trás. Isso produz R alta nas precordiais esquerdas (V5-V6) e S profunda nas direitas (V1). Somar as duas amplifica o sinal e cancela parte da variação individual de posição do coração. A limitação, porém, é física e não estatística. O eletrocardiograma registra a diferença de potencial na superfície de um **condutor de volume**, e a amplitude que chega ao eletrodo depende não só do momento dipolar cardíaco, mas da distância até o eletrodo e da condutividade dos tecidos interpostos — com o potencial caindo aproximadamente com o quadrado da distância. Alguns centímetros de gordura subcutânea ou de pulmão hiperinsuflado atenuam a voltagem mais do que a hipertrofia a amplifica, o que produz falso-negativo no obeso e no enfisematoso, falso-positivo no magro, e atenuação global no derrame pericárdico ou pleural. Existe ainda um limite mais profundo, ligado à geometria da hipertrofia. Na sobrecarga **pressórica** (hipertensão, estenose aórtica) o sarcômero se adiciona em paralelo, a parede engrossa e a cavidade não dilata: a massa cresce com pouca alteração do vetor resultante, e a voltagem sobe pouco. Na sobrecarga de **volume** (insuficiência aórtica ou mitral) o sarcômero se adiciona em série, a cavidade dilata e o coração se aproxima da parede torácica, e aí a voltagem acompanha fielmente. O critério é portanto melhor na hipertrofia excêntrica que na concêntrica — o oposto do que a clínica mais frequentemente precisa. Daí a sensibilidade em torno de 25% com especificidade alta, e daí a regra que resume o instrumento: serve para confirmar, nunca para excluir. Vale registrar que, apesar dessa fragilidade diagnóstica, a voltagem tem valor **prognóstico** independente: no estudo LIFE, a regressão dos critérios de voltagem ao longo do tratamento anti-hipertensivo associou-se a redução de eventos cardiovasculares, independentemente da pressão arterial alcançada.',
  armadilhas: [
    'A distância entre o coração e o eletrodo domina o resultado: obesidade e enfisema reduzem a voltagem, magreza a aumenta.',
    'Bloqueio de ramo esquerdo invalida o critério.',
    'Sensibilidade de apenas cerca de 25%. Critério negativo em hipertenso de longa data não descarta hipertrofia e não dispensa ecocardiograma quando há suspeita clínica.',
    'Pior desempenho justamente na hipertrofia concêntrica da hipertensão e da estenose aórtica, em que a parede engrossa sem dilatar a cavidade e o vetor resultante muda pouco.',
    'Em jovens magros abaixo de 35 anos, o corte de 35 mm gera falso-positivo frequente. Considere 40 a 45 mm nessa faixa antes de investigar um assintomático.',
    'Calibração fora de 10 mm/mV — sobretudo o registro em meia voltagem usado para traçado saturado — reduz todas as amplitudes e produz falso-negativo. Confira o pulso de calibração.',
    'Posicionamento incorreto dos eletrodos precordiais, especialmente V1 e V2 colocados alto no tórax, altera significativamente as amplitudes medidas.',
    'Alteração de repolarização associada não é detalhe: em adulto jovem, voltagem alta com inversão de T nas precordiais esquerdas levanta cardiomiopatia hipertrófica e exige investigação específica.',
  ],
  referencias: [
    { texto: 'Sokolow M, Lyon TP. The ventricular complex in left ventricular hypertrophy as obtained by unipolar precordial and limb leads. Am Heart J. 1949;37(2):161-186.' },
    { texto: 'Pewsner D, Jüni P, Egger M, et al. Accuracy of electrocardiography in diagnosis of left ventricular hypertrophy in arterial hypertension: systematic review. BMJ. 2007;335(7622):711.' },
    { texto: 'Okin PM, Devereux RB, Jern S, et al. Regression of electrocardiographic left ventricular hypertrophy during antihypertensive treatment and the prediction of major cardiovascular events (LIFE). JAMA. 2004;292(19):2343-2349.' },
  ],
}

const cornell: Ferramenta = {
  id: 'cornell',
  nome: 'Critério de Cornell e produto de Cornell',
  sinonimos: ['cornell voltage', 'produto de cornell', 'cornell product'],
  resumo: 'Critério de voltagem com pontos de corte por sexo e a versão multiplicada pela duração do QRS.',
  categorias: ['cardiologia'],
  campos: [
    campoSexo(),
    campoNum('ravl', 'Onda R em aVL', { unidade: 'mm', min: 0, max: 40, passo: 0.5, ajuda: 'Altura da R em aVL, da linha de base ao ápice. aVL registra a parede lateral alta e é a derivação de melhor desempenho isolado para hipertrofia ventricular esquerda.' }),
    campoNum('sv3', 'Onda S em V3', { unidade: 'mm', min: 0, max: 60, passo: 0.5, ajuda: 'Profundidade da S em V3. Se a transição do QRS estiver deslocada e V3 for atípica, confira o posicionamento dos eletrodos antes de medir — V3 mal colocada é a principal fonte de erro deste critério.' }),
    campoNum('qrs', 'Duração do QRS', { unidade: 'ms', min: 60, max: 200, passo: 1, padrao: '90', ajuda: 'Do início da primeira deflexão ao fim da última, na derivação de maior duração. Usada apenas no produto de Cornell. Acima de 120 ms há bloqueio de ramo e o critério perde validade.' }),
  ],
  calcular: (v) => {
    const sexo = opc(v, 'sexo')
    const ravl = num(v, 'ravl')
    const sv3 = num(v, 'sv3')
    const qrs = numOu(v, 'qrs', 90)
    if (ravl === null || sv3 === null) return null
    const soma = ravl + sv3
    const limite = sexo === 'f' ? 20 : 28
    const produto = (soma + (sexo === 'f' ? 6 : 0)) * qrs
    return {
      titulo: 'Voltagem de Cornell',
      valor: fmt(soma, 1),
      unidade: 'mm',
      nivel: soma > limite || produto > 2440 ? 'alerta' : 'ok',
      rotuloNivel: soma > limite ? 'Voltagem positiva para HVE' : produto > 2440 ? 'Voltagem negativa, produto positivo' : 'Ambos negativos',
      detalhes: [
        { rotulo: 'Ponto de corte da voltagem', valor: `> ${limite} mm`, nota: `Específico para ${sexo === 'f' ? 'mulheres' : 'homens'}` },
        { rotulo: 'Produto de Cornell', valor: `${fmtInt(produto)} mm·ms`, nota: 'Positivo > 2440 mm·ms. Em mulheres soma-se 6 mm à voltagem antes de multiplicar.', nivel: produto > 2440 ? 'alerta' : 'ok' },
        { rotulo: 'Duração do QRS usada', valor: `${fmtInt(qrs)} ms` },
      ],
      interpretacao: [
        'Cornell usa aVL e V3 por uma razão anatômica: essas derivações registram o vetor de despolarização da parede lateral alta e do septo em direções quase opostas, de modo que a soma das duas amplitudes reflete bem a massa do ventrículo esquerdo com menos interferência da posição do coração.',
        'Os pontos de corte separados por sexo existem porque, para a mesma massa ventricular, mulheres apresentam voltagens menores — efeito da parede torácica e do tamanho cardíaco médio.',
        'O produto de Cornell foi o critério usado no estudo LIFE: a regressão do produto sob tratamento com losartana associou-se independentemente a redução de morte cardiovascular, infarto e AVC. É um dos poucos achados de ECG com valor demonstrado como alvo terapêutico.',
        'Por que multiplicar pela duração do QRS funciona é a parte mais interessante deste critério, e envolve dois mecanismos distintos que somam informação. O primeiro é **geométrico**: a frente de despolarização se propaga pelo miocárdio a velocidade aproximadamente constante, de modo que uma parede mais espessa simplesmente leva mais tempo para ser atravessada, alargando o QRS. O segundo é **estrutural e fisiopatológico**: a hipertrofia patológica não é apenas miócito maior. Ela vem acompanhada de fibrose intersticial, com deposição de colágeno tipos I e III estimulada por angiotensina II e aldosterona, e de redução da densidade capilar por unidade de massa — o crescimento do miócito não é acompanhado por angiogênese proporcional. O tecido fibrótico conduz mal e cria zonas de condução lenta e de bloqueio local, o que fragmenta e prolonga a ativação ventricular. Ou seja, o QRS alargado não mede só espessura: mede **remodelamento elétrico adverso**, e é justamente esse componente que carrega o valor prognóstico. Isso explica por que o produto de Cornell prediz eventos melhor que a voltagem isolada e por que sua regressão sob tratamento anti-hipertensivo se traduz em redução de desfechos duros. A mesma fibrose que alarga o QRS é o substrato de arritmia ventricular, de disfunção diastólica e de isquemia por reserva coronariana reduzida — e reverter a hipertrofia com bloqueio do sistema renina-angiotensina-aldosterona reverte parcialmente a fibrose, não apenas a massa.',
      ],
      conduta: [
        soma > limite || produto > 2440
          ? '**Critério positivo**: solicite ecocardiograma para confirmar hipertrofia, quantificar a massa ventricular indexada, definir o padrão geométrico (concêntrico ou excêntrico), avaliar função diastólica e sistólica e procurar a causa — cardiopatia hipertensiva, estenose aórtica, cardiomiopatia hipertrófica.'
          : 'Ambos negativos **não excluem** hipertrofia. Se houver hipertensão de longa data, sopro, alteração de repolarização ou história familiar de cardiomiopatia hipertrófica e morte súbita precoce, solicite ecocardiograma independentemente do critério.',
        'Se a causa for hipertensão, priorize **bloqueio do sistema renina-angiotensina-aldosterona** (inibidor da ECA ou bloqueador do receptor de angiotensina) — é a classe com maior efeito documentado de regressão de massa e de fibrose, e foi com losartana que o LIFE demonstrou o benefício de desfecho associado à regressão do produto de Cornell.',
        'Registre o valor numérico do produto, não só "positivo". O produto de Cornell é um dos raros achados eletrocardiográficos que funcionam como **alvo terapêutico mensurável**: acompanhar sua queda ao longo dos anos de tratamento é uma medida barata de resposta, e a redução se associa a menos eventos independentemente da pressão alcançada.',
        'Rastreie as consequências da hipertrofia mesmo com paciente assintomático: disfunção diastólica com risco de insuficiência cardíaca de fração preservada, fibrilação atrial (a hipertrofia e o remodelamento atrial andam juntos) e arritmia ventricular. Considere Holter se houver palpitação, síncope ou QRS muito alargado.',
        'Em adulto jovem com critério positivo, repolarização alterada e sem hipertensão, investigue **cardiomiopatia hipertrófica**: ecocardiograma com atenção ao septo e ao gradiente de via de saída, ressonância cardíaca, história familiar em três gerações e avaliação de risco de morte súbita.',
      ],
      alertas: [
        'O ajuste de 6 mm é exclusivo do **produto** e exclusivo do **sexo feminino**. Aplicá-lo em homens ou à voltagem simples é o erro de cálculo mais comum deste critério.',
        'QRS acima de 120 ms indica bloqueio de ramo, e nessa condição nenhum critério de voltagem — Cornell incluído — é válido, porque a sequência de ativação ventricular está alterada.',
        'Critério positivo não é diagnóstico. O padrão de referência da massa ventricular é o ecocardiograma ou a ressonância cardíaca; o eletrocardiograma apenas levanta a suspeita.',
        'V3 mal posicionada compromete o critério de forma silenciosa, porque a S em V3 é muito sensível à posição do eletrodo na zona de transição. Confira o posicionamento antes de medir.',
        'Alteração de repolarização associada agrava o significado prognóstico e, em jovem, levanta cardiomiopatia hipertrófica — não a trate como achado acessório.',
      ],
      tabela: {
        titulo: 'Cornell: cortes e interpretação',
        colunas: ['Critério', 'Cálculo', 'Corte masculino', 'Corte feminino'],
        linhas: [
          ['Voltagem de Cornell', 'R(aVL) + S(V3)', '> 28 mm', '> 20 mm'],
          ['Produto de Cornell', 'Voltagem × QRS (ms)', '> 2.440 mm·ms', '> 2.440 mm·ms, somando 6 mm à voltagem'],
        ],
        destaque: soma > limite ? 0 : produto > 2440 ? 1 : undefined,
      },
    }
  },
  formula: ['Cornell: R(aVL) + S(V3) > 28 mm (♂) ou > 20 mm (♀)', 'Produto: [Cornell (+6 mm se ♀)] × QRS > 2440 mm·ms'],
  fundamento:
    'Ao acrescentar a duração do QRS, o produto de Cornell incorpora a segunda consequência elétrica da hipertrofia: o tempo maior que a frente de despolarização leva para percorrer uma parede mais espessa. Isso eleva a sensibilidade sem sacrificar a especificidade, o que raramente acontece quando se ajusta um critério diagnóstico. A explicação para esse ganho incomum é que a duração do QRS não é redundante com a voltagem — ela carrega informação de natureza diferente. Além do efeito geométrico óbvio (parede mais espessa, mais tempo de travessia a velocidade de condução constante), o QRS alargado reflete o **remodelamento estrutural** que acompanha a hipertrofia patológica: fibrose intersticial com deposição de colágeno tipos I e III estimulada por angiotensina II e aldosterona, e redução da densidade capilar por unidade de massa, já que o miócito cresce sem angiogênese proporcional. O tecido fibrótico conduz mal, cria zonas de condução lenta e de bloqueio local, e fragmenta a ativação ventricular. É por isso que o produto prediz eventos melhor do que a voltagem isolada: ele mede massa **e** o substrato elétrico adverso — o mesmo substrato que gera arritmia ventricular, disfunção diastólica e isquemia por reserva coronariana reduzida. A escolha das derivações também é deliberada: aVL e V3 registram o vetor de despolarização da parede lateral alta e do septo em direções quase opostas, de modo que somar as amplitudes reflete a massa ventricular com menos interferência da posição do coração no tórax do que o par V1-V5/V6 usado por Sokolow-Lyon. Os cortes separados por sexo, introduzidos por Casale em 1987, corrigem o fato de que, para a mesma massa ventricular indexada, mulheres apresentam voltagens menores — efeito combinado de tamanho cardíaco médio e de composição da parede torácica. Finalmente, o produto de Cornell ocupa uma posição singular na cardiologia: no estudo LIFE, sua regressão sob tratamento com losartana associou-se independentemente a redução de morte cardiovascular, infarto e AVC, o que o torna um dos pouquíssimos achados eletrocardiográficos validados como alvo terapêutico, e não apenas como marcador.',
  armadilhas: [
    'Não some 6 mm em homens — o ajuste é exclusivo do produto e exclusivo do sexo feminino.',
    'QRS acima de 120 ms significa bloqueio de ramo e invalida o critério: a sequência de ativação está alterada e o produto perde sentido.',
    'Usar os cortes masculinos em mulheres subdiagnostica sistematicamente, e o inverso superdiagnostica. O sexo não é detalhe opcional aqui.',
    'A S em V3 é muito sensível ao posicionamento do eletrodo na zona de transição do QRS. Eletrodo deslocado altera o resultado sem qualquer sinal de erro.',
    'Calibração fora de 10 mm/mV, sobretudo o registro em meia voltagem, reduz as amplitudes e produz falso-negativo.',
    'Obesidade e enfisema atenuam a voltagem por aumento da distância e da impedância entre coração e eletrodo — a limitação física vale para Cornell como para qualquer critério de voltagem.',
    'Critério negativo não exclui hipertrofia. Nenhum critério eletrocardiográfico tem sensibilidade suficiente para dispensar ecocardiograma diante de suspeita clínica consistente.',
  ],
  referencias: [
    { texto: 'Casale PN, Devereux RB, Alonso DR, et al. Improved sex-specific criteria of left ventricular hypertrophy. Circulation. 1987;75(3):565-572.' },
    { texto: 'Okin PM, Devereux RB, Jern S, et al. Regression of electrocardiographic left ventricular hypertrophy during antihypertensive treatment and the prediction of major cardiovascular events (LIFE). JAMA. 2004;292(19):2343-2349.' },
  ],
}

const heart: Ferramenta = {
  id: 'heart',
  nome: 'Escore HEART',
  sinonimos: ['heart score', 'dor toracica', 'risco de mace'],
  resumo: 'Estratifica a dor torácica na emergência e define quem pode ter alta segura.',
  categorias: ['cardiologia', 'emergencia'],
  campos: [
    campoOpc('historia', 'História clínica', [
      { valor: '0', rotulo: 'Pouco suspeita', pontos: 0, descricao: 'Sem elementos típicos: dor atípica, sem irradiação, sem relação com esforço, reprodutível à palpação.' },
      { valor: '1', rotulo: 'Moderadamente suspeita', pontos: 1, descricao: 'Mistura de elementos típicos e atípicos.' },
      { valor: '2', rotulo: 'Altamente suspeita', pontos: 2, descricao: 'Dor retroesternal em aperto, irradiada para braço ou mandíbula, desencadeada por esforço, com sudorese, náusea ou dispneia; alívio com nitrato.' },
    ]),
    campoOpc('ecg', 'ECG', [
      { valor: '0', rotulo: 'Normal', pontos: 0 },
      { valor: '1', rotulo: 'Alteração inespecífica de repolarização', pontos: 1, descricao: 'Bloqueio de ramo, alterações por marca-passo, alterações por digital, alterações de repolarização não novas.' },
      { valor: '2', rotulo: 'Desvio significativo do segmento ST', pontos: 2, descricao: 'Infra ou supradesnivelamento novo, não atribuível a bloqueio, digital ou marca-passo.' },
    ]),
    campoOpc('idadeCat', 'Idade', [
      { valor: '0', rotulo: 'Menos de 45 anos', pontos: 0 },
      { valor: '1', rotulo: '45 a 64 anos', pontos: 1 },
      { valor: '2', rotulo: '65 anos ou mais', pontos: 2 },
    ]),
    campoOpc('fatores', 'Fatores de risco', [
      { valor: '0', rotulo: 'Nenhum', pontos: 0 },
      { valor: '1', rotulo: '1 ou 2 fatores', pontos: 1 },
      { valor: '2', rotulo: '3 ou mais fatores, ou doença aterosclerótica conhecida', pontos: 2, descricao: 'Fatores: hipertensão, dislipidemia, diabetes, tabagismo (atual ou < 3 meses), história familiar precoce, obesidade (IMC > 30). Doença conhecida: infarto prévio, revascularização, AVC, doença arterial periférica.' },
    ]),
    campoOpc('troponina', 'Troponina', [
      { valor: '0', rotulo: 'Menor ou igual ao limite normal', pontos: 0 },
      { valor: '1', rotulo: '1 a 3 vezes o limite normal', pontos: 1 },
      { valor: '2', rotulo: 'Mais de 3 vezes o limite normal', pontos: 2 },
    ]),
  ],
  calcular: (v) => {
    const ids = ['historia', 'ecg', 'idadeCat', 'fatores', 'troponina']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const faixa = total <= 3 ? 0 : total <= 6 ? 1 : 2
    const mace = ['1,7%', '16,6%', '50,1%'][faixa]
    const nivel: Nivel = faixa === 0 ? 'ok' : faixa === 1 ? 'alerta' : 'critico'
    return {
      titulo: 'Escore HEART',
      valor: String(total),
      unidade: 'pontos',
      nivel,
      rotuloNivel: ['Baixo risco (0–3)', 'Risco moderado (4–6)', 'Alto risco (7–10)'][faixa],
      detalhes: [
        { rotulo: 'Risco de evento cardíaco maior em 6 semanas', valor: mace, nota: 'Morte, infarto ou revascularização (coorte de validação de Backus et al., 2013).' },
      ],
      conduta: [
        'Escore **0–3 (baixo risco, evento em 30 dias < 2%)**: com duas troponinas negativas separadas por 3 h (ou uma troponina ultrassensível abaixo do limite de detecção na chegada, se o protocolo local validar), o paciente pode receber alta da emergência com reavaliação ambulatorial. Teste funcional de rotina antes da alta não melhora desfecho nesse grupo e gera investigação em cascata.',
        'Escore **4–6 (risco intermediário, 12–17%)**: interne em unidade de dor torácica com troponina seriada e monitorização. Estratifique com teste provocativo ou angiotomografia de coronárias antes da alta — é justamente aqui que a imagem muda conduta, e não nos extremos.',
        'Escore **≥ 7 (alto risco, 50–65%)**: trate como síndrome coronariana aguda até prova em contrário. Dupla antiagregação, anticoagulação e estratégia invasiva precoce (cateterismo em até 24–72 h), com discussão imediata com a cardiologia.',
        'O HEART **não se aplica** a supra de ST, instabilidade hemodinâmica ou quando o diagnóstico já está feito — nesses casos vá direto ao protocolo de reperfusão. Também não vale para dor torácica de causa evidentemente não cardíaca.',
        'Use o escore como **piso, não como teto**: ele não substitui o julgamento clínico. Dissecção de aorta, embolia pulmonar, pneumotórax e ruptura de esôfago não entram no cálculo e continuam sendo obrigação do avaliador afastar.',
      ],
      interpretacao: [
        faixa === 0
          ? '**Baixo risco.** Alta da emergência é razoável, desde que a troponina de alta sensibilidade seja seriada conforme o protocolo institucional (0/1 h ou 0/3 h) e o ECG não mostre alteração dinâmica. O HEART Pathway — HEART ≤ 3 com duas troponinas negativas — permitiu alta precoce de cerca de 40% dos pacientes com dor torácica sem eventos perdidos no ensaio randomizado.'
          : faixa === 1
            ? '**Risco moderado.** Indicação de observação, troponina seriada e investigação não invasiva (teste ergométrico, angiotomografia de coronárias ou cintilografia) antes da alta.'
            : '**Alto risco.** Conduta invasiva precoce, internação em unidade coronariana e terapia antitrombótica conforme diretriz de síndrome coronariana aguda.',
        'O HEART foi desenhado para a emergência indiferenciada, e é aí que ele bate TIMI e GRACE: estes últimos foram derivados em populações que já tinham diagnóstico de síndrome coronariana, e por isso discriminam pior quem não tem doença nenhuma.',
      ],
      alertas: total <= 3 ? ['Escore baixo não substitui julgamento clínico. Dor em curso, alteração dinâmica de ECG, instabilidade hemodinâmica ou equivalente anginoso em diabético ou idoso justificam internação independentemente do escore.'] : undefined,
      tabela: {
        titulo: 'Estratificação',
        colunas: ['Pontos', 'Risco', 'MACE em 6 semanas', 'Conduta'],
        linhas: [
          ['0 – 3', 'Baixo', '1,7%', 'Alta com seguimento ambulatorial'],
          ['4 – 6', 'Moderado', '16,6%', 'Observação e investigação'],
          ['7 – 10', 'Alto', '50,1%', 'Estratégia invasiva precoce'],
        ],
        destaque: faixa,
      },
    }
  },
  formula: ['HEART = História + ECG + Age + Risk factors + Troponin (0 a 2 pontos cada)'],
  fundamento:
    'O HEART nasceu da observação de que os escores existentes (TIMI, GRACE) foram derivados em pacientes já diagnosticados com síndrome coronariana aguda, e por isso funcionavam mal na porta da emergência, onde a maioria não tem doença coronariana. Ele combina o que o emergencista realmente tem em mãos nos primeiros minutos — a história, o ECG, a idade, os fatores de risco e a primeira troponina — e é hoje o escore de dor torácica com melhor desempenho documentado nesse cenário.',
  armadilhas: [
    'A pontuação da história é subjetiva por construção. Concordância entre observadores é apenas moderada, e esse é o principal limite do escore.',
    'Com troponina de alta sensibilidade, o ponto de corte "1 a 3 vezes o normal" precisa ser interpretado com o percentil 99 específico do ensaio e do sexo.',
    'O escore não foi validado para dor torácica com supradesnivelamento de ST — nesse caso a conduta é reperfusão imediata, sem escore.',
  ],
  referencias: [
    { texto: 'Six AJ, Backus BE, Kelder JC. Chest pain in the emergency room: value of the HEART score. Neth Heart J. 2008;16(6):191-196.' },
    { texto: 'Backus BE, Six AJ, Kelder JC, et al. A prospective validation of the HEART score for chest pain patients at the emergency department. Int J Cardiol. 2013;168(3):2153-2158.' },
    { texto: 'Mahler SA, Riley RF, Hiestand BC, et al. The HEART Pathway randomized trial. Circ Cardiovasc Qual Outcomes. 2015;8(2):195-203.' },
  ],
}

const timi: Ferramenta = {
  id: 'timi-sca',
  nome: 'Escore TIMI para síndrome coronariana aguda sem supra de ST',
  sigla: 'TIMI',
  sinonimos: ['timi', 'timi risk score', 'angina instavel'],
  resumo: 'Estima risco de morte, infarto ou revascularização urgente em 14 dias.',
  categorias: ['cardiologia', 'emergencia'],
  campos: [
    campoSimNao('idade', 'Idade ≥ 65 anos', 1),
    campoSimNao('fatores', '3 ou mais fatores de risco para doença coronariana', 1, 'Hipertensão, dislipidemia, diabetes, tabagismo, história familiar precoce.'),
    campoSimNao('dac', 'Doença coronariana conhecida (estenose ≥ 50%)', 1),
    campoSimNao('aas', 'Uso de AAS nos últimos 7 dias', 1, 'Evento apesar do antiagregante indica doença mais agressiva.'),
    campoSimNao('anginaGrave', '2 ou mais episódios de angina nas últimas 24 horas', 1),
    campoSimNao('desvioST', 'Desvio do segmento ST ≥ 0,5 mm', 1),
    campoSimNao('marcadores', 'Marcadores de necrose miocárdica elevados', 1),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'idade', pontos: 1 },
      { id: 'fatores', pontos: 1 },
      { id: 'dac', pontos: 1 },
      { id: 'aas', pontos: 1 },
      { id: 'anginaGrave', pontos: 1 },
      { id: 'desvioST', pontos: 1 },
      { id: 'marcadores', pontos: 1 },
    ])
    const riscos = ['4,7%', '4,7%', '8,3%', '13,2%', '19,9%', '26,2%', '40,9%', '40,9%']
    const nivel: Nivel = total <= 2 ? 'ok' : total <= 4 ? 'alerta' : 'critico'
    return {
      titulo: 'Escore TIMI',
      valor: String(total),
      unidade: 'de 7 pontos',
      nivel,
      rotuloNivel: total <= 2 ? 'Baixo risco' : total <= 4 ? 'Risco intermediário' : 'Alto risco',
      detalhes: [{ rotulo: 'Morte, infarto ou revascularização urgente em 14 dias', valor: riscos[total], nota: 'Coorte de derivação TIMI 11B / ESSENCE.' }],
      conduta: [
        'Escore **0–2 (baixo risco)**: estratégia conservadora com terapia antitrombótica e estratificação não invasiva. A mortalidade ou infarto em 14 dias fica em torno de 3–8%, e o cateterismo imediato não traz benefício demonstrado.',
        'Escore **3–4 (intermediário)**: estratégia invasiva precoce (em 24–72 h) é razoável e ganha força se houver elevação de troponina ou alteração dinâmica de ST. Mantenha dupla antiagregação e anticoagulação plena enquanto aguarda.',
        'Escore **≥ 5 (alto risco, 20–41% de eventos em 14 dias)**: cateterismo em até 24 h, com antiagregação dupla e anticoagulante. O benefício absoluto da estratégia invasiva cresce com o escore — é o grupo em que a intervenção precoce mais reduz eventos.',
        '**Instabilidade hemodinâmica, angina refratária, arritmia ventricular sustentada ou insuficiência cardíaca aguda** determinam cateterismo imediato (< 2 h), independentemente do TIMI. O escore estratifica quem está estável, não quem está deteriorando.',
        'Prefira o **GRACE** quando precisar de estimativa quantitativa de mortalidade intra-hospitalar e em 6 meses: o TIMI foi construído para decisão rápida à beira do leito e perde discriminação em idosos e renais crônicos, justamente os que mais concentram eventos.',
      ],
      alertas: [
        'O TIMI não se aplica a infarto com supra de ST, a instabilidade hemodinâmica nem a angina refratária — nessas situações a conduta é reperfusão ou cateterismo imediato, e calcular o escore só atrasa.',
        'Ele perde discriminação em idosos e em renais crônicos, justamente os grupos que mais concentram eventos. Quando precisar de estimativa quantitativa de mortalidade, use o GRACE.',
      ],
      interpretacao: [
        total >= 3
          ? 'TIMI ≥ 3 é o ponto de corte tradicional para benefício de estratégia invasiva precoce e de terapia antitrombótica mais intensa (inibidor de glicoproteína IIb/IIIa nos estudos originais, hoje substituído por antiagregação dupla potente).'
          : 'TIMI ≤ 2 identifica risco menor, mas **não é critério de alta**: mesmo com escore 0, a incidência de evento em 14 dias foi de quase 5% na coorte original — inaceitável para liberar da emergência.',
        'O TIMI foi derivado em pacientes já com diagnóstico de angina instável ou infarto sem supra, randomizados em ensaios clínicos. Aplicá-lo à dor torácica indiferenciada da emergência subestima o risco e é a razão de o HEART tê-lo substituído nesse cenário.',
      ],
      tabela: {
        titulo: 'Risco de evento em 14 dias',
        colunas: ['Pontos', 'Risco'],
        linhas: [['0 – 1', '4,7%'], ['2', '8,3%'], ['3', '13,2%'], ['4', '19,9%'], ['5', '26,2%'], ['6 – 7', '40,9%']],
        destaque: total <= 1 ? 0 : total === 2 ? 1 : total === 3 ? 2 : total === 4 ? 3 : total === 5 ? 4 : 5,
      },
    }
  },
  formula: ['1 ponto para cada um dos 7 critérios'],
  fundamento:
    'O TIMI é o escore mais simples do grupo: sete variáveis dicotômicas com peso idêntico. Essa simplicidade é deliberada e foi validada — ao contrário do que se esperaria, atribuir pesos diferentes não melhorou a discriminação na derivação original. O escore captura três dimensões: substrato (idade, fatores de risco, doença conhecida), atividade da doença (angina recorrente, evento sob AAS) e dano já ocorrido (desvio de ST, marcadores).',
  armadilhas: [
    'Escore baixo não autoriza alta. O TIMI discrimina gradação de risco dentro de uma população que já tem síndrome coronariana.',
    'Existe um TIMI diferente para infarto com supra de ST, com variáveis e pontuação distintas — não confunda os dois.',
  ],
  referencias: [
    { texto: 'Antman EM, Cohen M, Bernink PJ, et al. The TIMI risk score for unstable angina/non-ST elevation MI. JAMA. 2000;284(7):835-842.' },
    { texto: 'Amsterdam EA, Wenger NK, Brindis RG, et al. 2014 AHA/ACC Guideline for the Management of Patients With Non-ST-Elevation Acute Coronary Syndromes. Circulation. 2014;130(25):e344-e426.' },
  ],
}

const grace: Ferramenta = {
  id: 'grace',
  nome: 'Escore GRACE',
  sinonimos: ['grace', 'grace score', 'risco sca'],
  resumo: 'Estima mortalidade hospitalar e em 6 meses na síndrome coronariana aguda.',
  categorias: ['cardiologia', 'emergencia'],
  campos: [
    campoNum('idade', 'Idade', { unidade: 'anos', min: 18, max: 110, passo: 1 }),
    campoNum('fc', 'Frequência cardíaca', { ajuda: 'Use a frequência da admissão, antes de betabloqueador ou de correção da dor — é assim que o escore foi derivado.', unidade: 'bpm', min: 20, max: 250, passo: 1 }),
    campoNum('pas', 'Pressão arterial sistólica', { ajuda: 'Sistólica da admissão. Se o paciente chegou hipotenso e melhorou com volume, use o valor de chegada.', unidade: 'mmHg', min: 40, max: 260, passo: 1 }),
    campoNum('creatinina', 'Creatinina sérica', { ajuda: 'Creatinina da admissão. É uma das variáveis que dão ao GRACE a vantagem sobre o TIMI em renais crônicos e idosos.', unidade: 'mg/dL', min: 0.1, max: 15, passo: 0.01 }),
    campoOpc('killip', 'Classe de Killip', [
      { valor: '1', rotulo: 'I — sem sinais de insuficiência cardíaca', pontos: 0 },
      { valor: '2', rotulo: 'II — estertores, B3 ou turgência jugular', pontos: 20 },
      { valor: '3', rotulo: 'III — edema agudo de pulmão', pontos: 39 },
      { valor: '4', rotulo: 'IV — choque cardiogênico', pontos: 59 },
    ]),
    campoSimNao('parada', 'Parada cardíaca na admissão', 39, 'Parada cardiorrespiratória ocorrida antes ou durante a chegada ao hospital, revertida.'),
    campoSimNao('desvioST', 'Desvio do segmento ST', 28, 'Infra ou supra de ST em qualquer derivação no ECG de admissão, excluído o supra que já indica reperfusão imediata.'),
    campoSimNao('marcadores', 'Marcadores de necrose elevados', 14, 'Troponina acima do percentil 99, ou CK-MB elevada, na primeira coleta.'),
  ],
  calcular: (v) => {
    const idade = num(v, 'idade')
    const fc = num(v, 'fc')
    const pas = num(v, 'pas')
    const cr = num(v, 'creatinina')
    const killip = num(v, 'killip')
    if (idade === null || fc === null || pas === null || cr === null || killip === null) return null

    const pIdade = idade < 30 ? 0 : idade < 40 ? 8 : idade < 50 ? 25 : idade < 60 ? 41 : idade < 70 ? 58 : idade < 80 ? 75 : idade < 90 ? 91 : 100
    const pFc = fc < 50 ? 0 : fc < 70 ? 3 : fc < 90 ? 9 : fc < 110 ? 15 : fc < 150 ? 24 : fc < 200 ? 38 : 46
    const pPas = pas < 80 ? 58 : pas < 100 ? 53 : pas < 120 ? 43 : pas < 140 ? 34 : pas < 160 ? 24 : pas < 200 ? 10 : 0
    const pCr = cr < 0.4 ? 1 : cr < 0.8 ? 4 : cr < 1.2 ? 7 : cr < 1.6 ? 10 : cr < 2 ? 13 : cr < 4 ? 21 : 28
    const pKillip = [0, 0, 20, 39, 59][killip] ?? 0
    const pParada = pts(v, 'parada', 39)
    const pST = pts(v, 'desvioST', 28)
    const pMarc = pts(v, 'marcadores', 14)
    const total = pIdade + pFc + pPas + pCr + pKillip + pParada + pST + pMarc

    const faixaHosp = total <= 108 ? 0 : total <= 140 ? 1 : 2
    const faixa6m = total <= 88 ? 0 : total <= 118 ? 1 : 2
    const nivel: Nivel = faixaHosp === 0 ? 'ok' : faixaHosp === 1 ? 'alerta' : 'critico'
    return {
      titulo: 'Escore GRACE',
      valor: String(total),
      unidade: 'pontos',
      nivel,
      rotuloNivel: ['Baixo risco', 'Risco intermediário', 'Alto risco'][faixaHosp],
      detalhes: [
        { rotulo: 'Idade', valor: `${pIdade} pontos` },
        { rotulo: 'Frequência cardíaca', valor: `${pFc} pontos` },
        { rotulo: 'Pressão sistólica', valor: `${pPas} pontos` },
        { rotulo: 'Creatinina', valor: `${pCr} pontos` },
        { rotulo: 'Classe de Killip', valor: `${pKillip} pontos` },
        { rotulo: 'Parada / desvio ST / marcadores', valor: `${pParada + pST + pMarc} pontos` },
        { rotulo: 'Mortalidade hospitalar estimada', valor: ['< 1%', '1 a 3%', '> 3%'][faixaHosp] },
        { rotulo: 'Mortalidade em 6 meses após a alta', valor: ['< 3%', '3 a 8%', '> 8%'][faixa6m] },
      ],
      conduta: [
        'Risco **baixo (GRACE ≤ 108, mortalidade hospitalar < 1%)**: estratégia invasiva seletiva, guiada por isquemia recorrente ou teste funcional positivo. Não há ganho em antecipar o cateterismo.',
        'Risco **intermediário (109–140, 1–3%)**: estratégia invasiva em até 72 h. Mantenha monitorização, antiagregação dupla e anticoagulação, e reavalie o escore se houver mudança clínica.',
        'Risco **alto (> 140, > 3%)**: cateterismo em até 24 h. Esse é o corte que as diretrizes europeias usam para indicar invasiva precoce, e o grupo em que ela reduz morte e infarto.',
        'Calcule também o **GRACE pós-alta (6 meses a 3 anos)**: ele orienta a intensidade do seguimento, a agressividade das metas de LDL e a duração da dupla antiagregação. Um escore alto na alta justifica reavaliação em 2–4 semanas em vez de 3 meses.',
        'O GRACE considera **Killip, creatinina e parada cardíaca na admissão** — variáveis que o TIMI ignora. Por isso ele discrimina melhor em idosos, renais crônicos e pacientes com disfunção ventricular, e é o preferido quando o objetivo é quantificar mortalidade e não apenas classificar.',
      ],
      alertas: [
        'Um GRACE calculado sem creatinina, sem classe de Killip ou sem o dado de parada cardíaca na admissão não é GRACE — são justamente essas variáveis que lhe dão a vantagem sobre o TIMI, e omiti-las subestima sistematicamente o risco.',
      ],
      interpretacao: [
        total > 140
          ? '**GRACE > 140** é o critério das diretrizes europeia e brasileira para **estratégia invasiva precoce, em até 24 horas** na síndrome coronariana aguda sem supra de ST. É o uso mais consequente do escore.'
          : total > 108
            ? 'Risco intermediário: estratégia invasiva dentro da internação, com prazo definido pela evolução clínica e pelos demais marcadores de risco.'
            : 'Baixo risco: estratégia inicialmente conservadora com investigação não invasiva é aceitável, conforme a diretriz vigente.',
        'O GRACE é o escore com melhor discriminação para mortalidade entre os disponíveis na síndrome coronariana aguda, e essa superioridade vem de incluir variáveis contínuas de gravidade fisiológica — frequência, pressão, função renal e classe de Killip — que os escores puramente dicotômicos ignoram.',
        'A versão 2.0 substitui a classe de Killip e a creatinina por uso de diurético e história de doença renal quando esses dados faltam, e fornece estimativas até 3 anos. Esta calculadora implementa a versão original de pontos, que é a citada nas diretrizes para o corte de 140.',
      ],
      tabela: {
        titulo: 'Faixas de risco',
        colunas: ['Desfecho', 'Baixo', 'Intermediário', 'Alto'],
        linhas: [
          ['Morte hospitalar', '≤ 108 (< 1%)', '109 – 140 (1–3%)', '> 140 (> 3%)'],
          ['Morte em 6 meses', '≤ 88 (< 3%)', '89 – 118 (3–8%)', '> 118 (> 8%)'],
        ],
      },
    }
  },
  formula: ['Soma ponderada de 8 variáveis; pontos atribuídos por faixa segundo o nomograma original'],
  fundamento:
    'O GRACE foi construído sobre um registro observacional multinacional de mais de 11 mil pacientes com síndrome coronariana aguda de todo tipo — com e sem supra de ST — o que explica sua generalização melhor do que a de escores derivados de ensaios clínicos, cujas populações são selecionadas. As oito variáveis foram escolhidas por regressão logística e refletem três eixos independentes: idade e função renal (reserva), frequência, pressão e Killip (estado hemodinâmico atual) e ECG mais marcadores (extensão do dano).',
  armadilhas: [
    'A pontuação por faixas usada aqui é a do nomograma original, que arredonda a variável contínua. A calculadora oficial GRACE 2.0 usa equações contínuas e pode diferir alguns pontos — perto do corte de 140, vale conferir.',
    'Killip é avaliado na admissão. Piora depois da chegada não recalcula o escore de admissão, embora deva mudar a conduta.',
  ],
  referencias: [
    { texto: 'Granger CB, Goldberg RJ, Dabbous O, et al. Predictors of hospital mortality in the global registry of acute coronary events. Arch Intern Med. 2003;163(19):2345-2353.' },
    { texto: 'Fox KAA, Dabbous OH, Goldberg RJ, et al. Prediction of risk of death and myocardial infarction in the six months after presentation with acute coronary syndrome. BMJ. 2006;333(7578):1091.' },
    { texto: 'Byrne RA, Rossello X, Coughlan JJ, et al. 2023 ESC Guidelines for the management of acute coronary syndromes. Eur Heart J. 2023;44(38):3720-3826.' },
  ],
}

const chads: Ferramenta = {
  id: 'cha2ds2-vasc',
  nome: 'CHA₂DS₂-VASc',
  sinonimos: ['chads', 'chadsvasc', 'fibrilacao atrial', 'anticoagulacao'],
  resumo: 'Risco anual de AVC na fibrilação atrial não valvar e indicação de anticoagulação.',
  categorias: ['cardiologia'],
  campos: [
    campoSimNao('c', 'Insuficiência cardíaca congestiva ou disfunção ventricular esquerda', 1, 'Inclui fração de ejeção ≤ 40% assintomática e cardiomiopatia hipertrófica.'),
    campoSimNao('h', 'Hipertensão arterial', 1, 'Diagnóstico prévio ou em tratamento, mesmo controlada.'),
    campoOpc('idadeCat', 'Idade', [
      { valor: '0', rotulo: 'Menos de 65 anos', pontos: 0 },
      { valor: '1', rotulo: '65 a 74 anos', pontos: 1 },
      { valor: '2', rotulo: '75 anos ou mais', pontos: 2 },
    ]),
    campoSimNao('d', 'Diabetes mellitus', 1),
    campoSimNao('s2', 'AVC, ataque isquêmico transitório ou tromboembolismo prévio', 2, 'É o item de maior peso — dobra a pontuação porque evento prévio é o preditor mais forte de novo evento.'),
    campoSimNao('v', 'Doença vascular', 1, 'Infarto prévio, doença arterial periférica ou placa aórtica complexa.'),
    campoSeg('sexo', 'Sexo', [
      { valor: 'm', rotulo: 'Masculino', pontos: 0 },
      { valor: 'f', rotulo: 'Feminino', pontos: 1 },
    ]),
  ],
  calcular: (v) => {
    const idadeCat = num(v, 'idadeCat')
    if (idadeCat === null) return null
    const sexoF = opc(v, 'sexo') === 'f'
    const total =
      pts(v, 'c', 1) + pts(v, 'h', 1) + idadeCat + pts(v, 'd', 1) + pts(v, 's2', 2) + pts(v, 'v', 1) + (sexoF ? 1 : 0)
    const semSexo = total - (sexoF ? 1 : 0)
    const riscoAnual = ['0,2%', '0,6%', '2,2%', '3,2%', '4,8%', '7,2%', '9,7%', '11,2%', '10,8%', '12,2%']
    const risco = riscoAnual[Math.min(total, 9)]
    const indicado = sexoF ? semSexo >= 2 : total >= 2
    const considerar = sexoF ? semSexo === 1 : total === 1
    const nivel: Nivel = indicado ? 'alerta' : considerar ? 'atencao' : 'ok'
    return {
      titulo: 'CHA₂DS₂-VASc',
      valor: String(total),
      unidade: 'pontos',
      nivel,
      rotuloNivel: indicado ? 'Anticoagulação indicada' : considerar ? 'Anticoagulação a considerar' : 'Anticoagulação não indicada apenas por este escore',
      detalhes: [
        { rotulo: 'Risco anual de AVC estimado', valor: risco, nota: 'Coorte dinamarquesa de Olesen et al. (2011), sem anticoagulação.' },
        { rotulo: 'Pontuação sem o componente sexo', valor: String(semSexo), nota: 'O sexo feminino é modificador de risco, não fator de risco isolado: mulher com escore 1 apenas pelo sexo tem risco equivalente ao do homem com escore 0.' },
      ],
      conduta: [
        'Escore **0 em homens e 1 em mulheres (o sexo feminino isolado não conta)**: não anticoagule. O risco anual de AVC é inferior ao risco de sangramento maior da terapia, e a recomendação é ativa de não tratar, não apenas de omitir.',
        'Escore **1 em homens e 2 em mulheres**: anticoagulação é razoável após decisão compartilhada. Apresente números absolutos — cerca de 1 AVC evitado por ano a cada 100 pacientes tratados — e leve em conta preferência, adesão e risco de queda real (não presumido).',
        'Escore **≥ 2 em homens e ≥ 3 em mulheres**: anticoagule. Prefira **anticoagulantes orais diretos** (apixabana, rivaroxabana, edoxabana, dabigatrana) à varfarina, exceto em **estenose mitral moderada a grave ou prótese valvar mecânica**, situações em que só a varfarina tem evidência.',
        'Ajuste a dose pelos critérios de cada fármaco, não pela impressão de fragilidade: para apixabana, reduza a 2,5 mg 12/12 h se houver **dois** entre idade ≥ 80 anos, peso ≤ 60 kg e creatinina ≥ 1,5 mg/dL. Subdosar por medo de sangrar é a causa mais comum de falha terapêutica na prática.',
        'Reavalie o escore **anualmente**: ele é dinâmico e sobe com a idade, com um novo diagnóstico de diabetes, hipertensão ou doença vascular. Um paciente que não tinha indicação aos 63 anos passa a ter aos 65 apenas pelo aniversário.',
      ],
      interpretacao: [
        indicado
          ? '**Anticoagulação oral recomendada** (classe I nas diretrizes europeia e brasileira), preferencialmente com anticoagulante oral direto em vez de varfarina, salvo estenose mitral moderada a grave ou prótese valvar mecânica — nesses dois casos, varfarina obrigatoriamente.'
          : considerar
            ? 'Escore 1 (homens) ou 2 com o ponto do sexo (mulheres): a anticoagulação **deve ser considerada**, pesando o risco de sangramento, a preferência do paciente e a presença de modificadores não capturados pelo escore (carga de fibrilação, dilatação atrial, doença renal).'
            : 'Escore 0 em homens ou 1 em mulheres apenas pelo sexo: anticoagulação não indicada apenas com base neste escore. Reavalie anualmente — o escore muda com a idade, e a passagem para 65 anos por si só já acrescenta um ponto.',
        'O escore vale para fibrilação e flutter atrial **não valvares**, e independe do padrão: paroxística, persistente e permanente recebem a mesma indicação. Isso surpreende, mas é o que os dados mostram — a carga de arritmia modula o risco menos do que o substrato clínico.',
      ],
      alertas: ['Nunca deixe de anticoagular por causa de um HAS-BLED alto. O escore de sangramento serve para corrigir fatores modificáveis e intensificar seguimento, não para negar a anticoagulação.'],
      tabela: {
        titulo: 'Risco anual de AVC sem anticoagulação',
        colunas: ['Pontos', 'Risco anual'],
        linhas: riscoAnual.map((r, i) => [String(i), r]),
        destaque: Math.min(total, 9),
      },
    }
  },
  formula: ['C 1 + H 1 + A₂ (≥75 anos) 2 + D 1 + S₂ (AVC prévio) 2 + V 1 + A (65-74) 1 + Sc (sexo feminino) 1'],
  fundamento:
    'O CHADS₂ original classificava metade dos pacientes como risco intermediário, faixa em que a decisão ficava sem resposta. O CHA₂DS₂-VASc acrescentou três variáveis (doença vascular, faixa etária de 65 a 74 anos e sexo feminino) com o objetivo específico de refinar o extremo inferior — isto é, identificar com segurança quem realmente tem risco baixo o suficiente para não anticoagular. Ele é melhor que o CHADS₂ não por identificar melhor os de alto risco, mas por identificar melhor os de risco verdadeiramente baixo.',
  armadilhas: [
    'Sexo feminino sozinho não indica anticoagulação. Some os pontos, retire o do sexo e avalie: se o restante for zero, o risco é baixo.',
    'Fibrilação atrial valvar (estenose mitral moderada a grave, prótese mecânica) está fora do escopo — anticoagulação com varfarina é indicada independentemente do escore.',
    'Um único episódio de fibrilação atrial no pós-operatório de cirurgia cardíaca não tem o mesmo significado prognóstico, e a conduta ainda é debatida.',
  ],
  referencias: [
    { texto: 'Lip GY, Nieuwlaat R, Pisters R, Lane DA, Crijns HJ. Refining clinical risk stratification for predicting stroke and thromboembolism in atrial fibrillation. Chest. 2010;137(2):263-272.' },
    { texto: 'Olesen JB, Lip GY, Hansen ML, et al. Validation of risk stratification schemes for predicting stroke and thromboembolism in patients with atrial fibrillation. BMJ. 2011;342:d124.' },
    { texto: 'Van Gelder IC, Rienstra M, Bunting KV, et al. 2024 ESC Guidelines for the management of atrial fibrillation. Eur Heart J. 2024;45(36):3314-3414.' },
  ],
}

const hasbled: Ferramenta = {
  id: 'has-bled',
  nome: 'HAS-BLED',
  sinonimos: ['hasbled', 'risco de sangramento', 'sangramento anticoagulacao'],
  resumo: 'Risco de sangramento maior em anticoagulados — para corrigir fatores, não para negar terapia.',
  categorias: ['cardiologia', 'hematologia'],
  campos: [
    campoSimNao('h', 'Hipertensão não controlada (PA sistólica > 160 mmHg)', 1),
    campoSimNao('aRenal', 'Função renal anormal', 1, 'Diálise, transplante ou creatinina > 2,26 mg/dL (200 µmol/L).'),
    campoSimNao('aHepatica', 'Função hepática anormal', 1, 'Cirrose, ou bilirrubina > 2× o normal com AST/ALT/FA > 3× o normal.'),
    campoSimNao('s', 'AVC prévio', 1),
    campoSimNao('b', 'História de sangramento ou predisposição', 1, 'Sangramento maior prévio, anemia por perda, diátese hemorrágica.'),
    campoSimNao('l', 'INR lábil', 1, 'Tempo na faixa terapêutica < 60%. Não se aplica a anticoagulantes orais diretos.'),
    campoSimNao('e', 'Idade > 65 anos', 1),
    campoSimNao('dDrogas', 'Uso concomitante de antiplaquetários ou anti-inflamatórios', 1),
    campoSimNao('dAlcool', 'Consumo excessivo de álcool (≥ 8 doses por semana)', 1),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'h', pontos: 1 },
      { id: 'aRenal', pontos: 1 },
      { id: 'aHepatica', pontos: 1 },
      { id: 's', pontos: 1 },
      { id: 'b', pontos: 1 },
      { id: 'l', pontos: 1 },
      { id: 'e', pontos: 1 },
      { id: 'dDrogas', pontos: 1 },
      { id: 'dAlcool', pontos: 1 },
    ])
    const taxas = ['1,13', '1,02', '1,88', '3,74', '8,70', '12,50', '12,50', '12,50', '12,50', '12,50']
    const modificaveis: string[] = []
    if (sim(v, 'h')) modificaveis.push('controlar a pressão arterial abaixo de 140/90 mmHg')
    if (sim(v, 'l')) modificaveis.push('melhorar o tempo na faixa terapêutica, ou trocar varfarina por anticoagulante oral direto')
    if (sim(v, 'dDrogas')) modificaveis.push('suspender antiplaquetário ou anti-inflamatório desnecessário')
    if (sim(v, 'dAlcool')) modificaveis.push('reduzir o consumo de álcool')
    return {
      titulo: 'HAS-BLED',
      valor: String(total),
      unidade: 'pontos',
      nivel: total >= 3 ? 'alerta' : total === 2 ? 'atencao' : 'ok',
      rotuloNivel: total >= 3 ? 'Alto risco de sangramento' : 'Risco de sangramento não elevado',
      detalhes: [
        { rotulo: 'Sangramentos maiores por 100 pacientes-ano', valor: taxas[Math.min(total, 9)], nota: 'Coorte de Pisters et al. (2010).' },
        { rotulo: 'Fatores modificáveis presentes', valor: modificaveis.length ? String(modificaveis.length) : 'nenhum' },
      ],
      conduta: [
        'O HAS-BLED **não serve para negar anticoagulação**. Esse é o erro mais frequente no seu uso: pontuação alta identifica quem precisa de vigilância mais próxima e de correção de fatores modificáveis, não quem deve ficar sem proteção contra AVC.',
        'Ataque os fatores **modificáveis** que o escore aponta: controle a pressão para sistólica < 160 mmHg, suspenda anti-inflamatórios e antiagregantes desnecessários, trate álcool ≥ 8 doses por semana, e revise fármacos que interagem. Cada um desses itens reverte pontos de verdade.',
        'Escore **≥ 3 (alto risco)**: mantenha a anticoagulação indicada, mas reavalie em 4 semanas em vez de 6 meses, monitore hemoglobina e função renal, e prefira o anticoagulante direto com menor sangramento gastrointestinal (apixabana) em quem tem histórico digestivo. Associe inibidor de bomba de prótons se houver antecedente de úlcera.',
        'Compare sempre o HAS-BLED com o **CHA₂DS₂-VASc** no mesmo paciente: eles compartilham fatores de risco (idade, hipertensão, AVC prévio), de modo que quem sangra mais é geralmente quem mais se beneficia de não ter AVC. O benefício líquido costuma continuar favorável à anticoagulação.',
        'Em sangramento **maior sob anticoagulante**, tenha o antídoto mapeado: idarucizumabe para dabigatrana, andexanet alfa (onde disponível) ou complexo protrombínico para inibidores do fator Xa, e complexo protrombínico com vitamina K para varfarina. Tratada a causa, reintroduza a anticoagulação — retomar em 1–2 semanas costuma superar o risco de não retomar.',
      ],
      alertas: [
        '**Escore alto não é motivo para suspender a anticoagulação.** Ele identifica quem precisa de vigilância mais próxima e de correção de fatores modificáveis. Como HAS-BLED e CHA₂DS₂-VASc compartilham fatores de risco, quem mais sangra costuma ser quem mais se beneficia de não ter AVC.',
      ],
      interpretacao: [
        '**O HAS-BLED nunca é motivo para não anticoagular.** Essa é a mensagem central das diretrizes atuais e o erro mais comum na prática. Os fatores de risco de sangramento e de AVC se sobrepõem muito, de modo que quem mais sangra costuma ser exatamente quem mais se beneficia da anticoagulação — o benefício absoluto continua favorável.',
        modificaveis.length
          ? `**Fatores modificáveis identificados:** ${modificaveis.join('; ')}. Corrigi-los é o uso legítimo do escore.`
          : 'Nenhum fator modificável identificado; o escore reflete características fixas do paciente.',
        total >= 3 ? 'HAS-BLED ≥ 3 sinaliza necessidade de reavaliação mais frequente (cada 4 semanas em vez de cada 4 a 6 meses) e de atenção redobrada a interações medicamentosas.' : 'Mantenha a reavaliação periódica: o escore muda com a idade, a função renal e novas prescrições.',
      ],
    }
  },
  formula: ['H 1 + A (renal 1 + hepática 1) + S 1 + B 1 + L 1 + E 1 + D (drogas 1 + álcool 1) — máximo 9'],
  fundamento:
    'O escore foi derivado da coorte Euro Heart Survey on Atrial Fibrillation para responder a uma pergunta prática: como identificar quem precisa de vigilância mais próxima ao ser anticoagulado. Ele agrupa fatores fixos (idade, AVC prévio, doença renal e hepática) e modificáveis (pressão descontrolada, INR lábil, antiplaquetários, álcool) — e é a separação entre esses dois grupos que dá utilidade clínica ao número.',
  armadilhas: [
    'O componente "L" (INR lábil) não se aplica a quem usa anticoagulante oral direto; nesse caso a pontuação máxima efetiva é 8.',
    'A hipertensão aqui é a **não controlada**, com sistólica acima de 160 — não o diagnóstico de hipertensão, que é o critério do CHA₂DS₂-VASc. Confundir os dois infla o escore.',
  ],
  referencias: [
    { texto: 'Pisters R, Lane DA, Nieuwlaat R, et al. A novel user-friendly score (HAS-BLED) to assess 1-year risk of major bleeding in patients with atrial fibrillation. Chest. 2010;138(5):1093-1100.' },
    { texto: 'Van Gelder IC, et al. 2024 ESC Guidelines for the management of atrial fibrillation. Eur Heart J. 2024;45(36):3314-3414.' },
  ],
}

const wellsTep: Ferramenta = {
  id: 'wells-tep',
  nome: 'Escore de Wells para tromboembolismo pulmonar',
  sinonimos: ['wells tep', 'wells ep', 'embolia pulmonar'],
  resumo: 'Probabilidade pré-teste de embolia pulmonar, nas versões de três níveis e dicotomizada.',
  categorias: ['cardiologia', 'pneumologia', 'emergencia'],
  campos: [
    campoSimNao('sinaisTvp', 'Sinais clínicos de trombose venosa profunda', 3, 'Edema de membro e dor à palpação do trajeto venoso profundo.'),
    campoSimNao('alternativa', 'TEP é o diagnóstico mais provável, ou tão provável quanto as alternativas', 3, 'É o item mais subjetivo e o de maior peso — e o que mais explica a variabilidade entre examinadores.'),
    campoSimNao('fc', 'Frequência cardíaca > 100 bpm', 1.5),
    campoSimNao('imobilizacao', 'Imobilização ≥ 3 dias ou cirurgia nas últimas 4 semanas', 1.5),
    campoSimNao('previo', 'TEP ou TVP prévios', 1.5),
    campoSimNao('hemoptise', 'Hemoptise', 1),
    campoSimNao('cancer', 'Neoplasia em tratamento nos últimos 6 meses ou paliativa', 1),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'sinaisTvp', pontos: 3 },
      { id: 'alternativa', pontos: 3 },
      { id: 'fc', pontos: 1.5 },
      { id: 'imobilizacao', pontos: 1.5 },
      { id: 'previo', pontos: 1.5 },
      { id: 'hemoptise', pontos: 1 },
      { id: 'cancer', pontos: 1 },
    ])
    const tresNiveis = total < 2 ? 'Baixa (≈ 1,3 a 3%)' : total <= 6 ? 'Moderada (≈ 16 a 28%)' : 'Alta (≈ 38 a 65%)'
    const dicotomica = total <= 4 ? 'TEP improvável' : 'TEP provável'
    const nivel: Nivel = total < 2 ? 'ok' : total <= 6 ? 'atencao' : 'critico'
    return {
      titulo: 'Escore de Wells (TEP)',
      valor: fmt(total, 1),
      unidade: 'pontos',
      nivel,
      rotuloNivel: dicotomica,
      detalhes: [
        { rotulo: 'Modelo de 3 níveis', valor: tresNiveis },
        { rotulo: 'Modelo dicotomizado', valor: `${dicotomica} (corte em 4)` },
      ],
      conduta: [
        'Wells **≤ 4 (improvável)**: solicite **D-dímero**. Negativo, exclui embolia com segurança e encerra a investigação — sem angiotomografia. Positivo, prossiga para a angiotomografia de tórax.',
        'Wells **> 4 (provável)**: vá direto à **angiotomografia**. D-dímero aqui não ajuda: com probabilidade pré-teste alta, um resultado negativo não reduz o risco pós-teste o bastante para liberar o paciente.',
        'Considere o ajuste do D-dímero pela idade (**idade × 10 µg/L** acima de 50 anos) ou o protocolo **YEARS**: ambos reduzem tomografias desnecessárias sem perder embolias, e são especialmente úteis em idosos, em quem o D-dímero é quase sempre positivo por razões inespecíficas.',
        'Se a angiotomografia estiver indisponível ou contraindicada (contraste, gestação, insuficiência renal), use **cintilografia de ventilação-perfusão** ou ultrassonografia de membros inferiores — trombose proximal confirmada em paciente com suspeita clínica autoriza tratar sem imagem torácica.',
        'Com suspeita alta e demora prevista na imagem, **inicie a anticoagulação empírica** enquanto aguarda, desde que não haja risco de sangramento proibitivo. Confirmado o diagnóstico, estratifique a gravidade com **PESI ou sPESI** — é isso que define alta precoce, internação ou trombólise.',
      ],
      alertas: [
        'Com Wells na faixa \'provável\', o D-dímero não ajuda: negativo, ele não reduz o risco pós-teste o suficiente para liberar o paciente. Peça a angiotomografia diretamente.',
        'Gestação, pós-operatório, câncer, infecção e idade avançada elevam o D-dímero por razões inespecíficas. Considere o ajuste pela idade ou o protocolo YEARS antes de encadear tomografias.',
      ],
      interpretacao: [
        total <= 4
          ? '**TEP improvável.** D-dímero é o próximo passo: negativo (abaixo do corte ajustado pela idade em maiores de 50 anos, isto é, idade × 10 ng/mL) exclui embolia com segurança e dispensa imagem. Positivo indica angiotomografia.'
          : '**TEP provável.** Vá direto à angiotomografia de tórax — nesta faixa o D-dímero não tem valor preditivo negativo suficiente para excluir. Se houver instabilidade hemodinâmica, considere ecocardiograma à beira do leito e trombólise empírica antes da confirmação.',
        'Em pacientes de baixa probabilidade que preenchem todos os oito critérios PERC, nem o D-dímero é necessário — a probabilidade pós-teste cai abaixo de 2%, patamar em que investigar causa mais dano do que benefício.',
        'O critério "diagnóstico alternativo menos provável" concentra 3 dos 12,5 pontos possíveis e é inteiramente subjetivo. Ele é a força e a fraqueza do escore: incorpora a impressão clínica, que tem valor real, ao custo de concordância entre observadores apenas moderada.',
      ],
      tabela: {
        titulo: 'Probabilidade pré-teste',
        colunas: ['Pontos', 'Categoria', 'Prevalência de TEP'],
        linhas: [
          ['0 – 1', 'Baixa', '1,3 – 3%'],
          ['2 – 6', 'Moderada', '16 – 28%'],
          ['≥ 7', 'Alta', '38 – 65%'],
        ],
        destaque: total < 2 ? 0 : total <= 6 ? 1 : 2,
      },
    }
  },
  formula: ['Soma ponderada de 7 critérios; corte dicotômico em 4 pontos'],
  fundamento:
    'A grande contribuição de Wells não foi o escore em si, mas a estratégia: estabelecer a probabilidade pré-teste antes de pedir o exame. Um D-dímero negativo reduz a probabilidade de embolia em cerca de dez vezes; se ela já era 3%, cai para 0,3% e a investigação termina. Se era 40%, cai para 4% — insuficiente para dispensar imagem. O mesmo exame, portanto, tem significados diferentes conforme a probabilidade que o antecede, e é isso que o escore torna explícito.',
  armadilhas: [
    'D-dímero é inútil em pacientes internados há dias, no pós-operatório, na gestação avançada e no idoso — a taxa de falso-positivo se aproxima de 100% e o exame só gera tomografias.',
    'Wells não foi validado na gestação. Nesse cenário, use os algoritmos específicos (YEARS adaptado à gestação ou o algoritmo do estudo Artemis).',
    'Escore baixo com paciente instável não exclui nada — hipotensão com dispneia súbita exige investigação imediata.',
  ],
  referencias: [
    { texto: 'Wells PS, Anderson DR, Rodger M, et al. Derivation of a simple clinical model to categorize patients probability of pulmonary embolism. Thromb Haemost. 2000;83(3):416-420.' },
    { texto: 'Konstantinides SV, Meyer G, Becattini C, et al. 2019 ESC Guidelines for the diagnosis and management of acute pulmonary embolism. Eur Heart J. 2020;41(4):543-603.' },
  ],
}

const wellsTvp: Ferramenta = {
  id: 'wells-tvp',
  nome: 'Escore de Wells para trombose venosa profunda',
  sinonimos: ['wells tvp', 'trombose venosa'],
  resumo: 'Probabilidade pré-teste de TVP de membro inferior e caminho até o ultrassom.',
  categorias: ['cardiologia', 'hematologia', 'emergencia'],
  campos: [
    campoSimNao('cancer', 'Neoplasia ativa (tratamento atual, nos últimos 6 meses ou paliativo)', 1, 'Neoplasia em tratamento atual, tratada nos últimos 6 meses, ou em cuidado paliativo.'),
    campoSimNao('paralisia', 'Paralisia, paresia ou imobilização gessada recente de membro inferior', 1),
    campoSimNao('acamado', 'Acamado ≥ 3 dias ou cirurgia de grande porte nas últimas 12 semanas', 1),
    campoSimNao('dor', 'Dor localizada ao longo do trajeto venoso profundo', 1),
    campoSimNao('edemaTodo', 'Edema de todo o membro inferior', 1),
    campoSimNao('panturrilha', 'Panturrilha ≥ 3 cm maior que a contralateral (10 cm abaixo da tuberosidade tibial)', 1, 'Meça 10 cm abaixo da tuberosidade tibial, nos dois membros, com fita métrica — a estimativa visual erra com frequência.'),
    campoSimNao('cacifo', 'Edema depressível restrito ao membro sintomático', 1),
    campoSimNao('colaterais', 'Veias superficiais colaterais não varicosas', 1),
    campoSimNao('tvpPrevia', 'TVP previamente documentada', 1, 'Este item vale **menos 2 pontos** quando há diagnóstico alternativo pelo menos tão provável quanto trombose.'),
    campoSimNao('alternativa', 'Diagnóstico alternativo tão ou mais provável que TVP', -2, 'Celulite, ruptura de cisto de Baker, ruptura muscular, linfedema, insuficiência venosa crônica.'),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'cancer', pontos: 1 },
      { id: 'paralisia', pontos: 1 },
      { id: 'acamado', pontos: 1 },
      { id: 'dor', pontos: 1 },
      { id: 'edemaTodo', pontos: 1 },
      { id: 'panturrilha', pontos: 1 },
      { id: 'cacifo', pontos: 1 },
      { id: 'colaterais', pontos: 1 },
      { id: 'tvpPrevia', pontos: 1 },
      { id: 'alternativa', pontos: -2 },
    ])
    const cat = total <= 0 ? 0 : total <= 2 ? 1 : 2
    return {
      titulo: 'Escore de Wells (TVP)',
      valor: String(total),
      unidade: 'pontos',
      nivel: (['ok', 'atencao', 'critico'] as Nivel[])[cat],
      rotuloNivel: total >= 2 ? 'TVP provável' : 'TVP improvável',
      detalhes: [
        { rotulo: 'Modelo de 3 níveis', valor: ['Baixa probabilidade (≈ 5%)', 'Probabilidade moderada (≈ 17%)', 'Alta probabilidade (≈ 53%)'][cat] },
        { rotulo: 'Modelo dicotomizado', valor: total >= 2 ? 'Provável (≥ 2)' : 'Improvável (< 2)' },
      ],
      conduta: [
        'Wells **≤ 1 (improvável)**: D-dímero negativo exclui trombose e dispensa ultrassonografia. Essa combinação tem valor preditivo negativo superior a 99% e é a rota mais custo-efetiva.',
        'Wells **≥ 2 (provável)**: solicite **ultrassonografia com compressão** diretamente. Se vier negativa mas a suspeita persistir, repita em 5–7 dias — tromboses distais podem progredir e se tornar visíveis nesse intervalo.',
        'Confirmada a trombose **proximal**, anticoagule por no mínimo 3 meses. Anticoagulantes diretos são a primeira escolha, exceto em síndrome antifosfolípide com tripla positividade e em gestação, situações em que se usa heparina de baixo peso molecular.',
        'Trombose **distal isolada** em paciente sem câncer, sem trombose prévia e com sintomas leves pode ser acompanhada com ultrassonografia seriada em vez de anticoagulada — decisão que equilibra o risco de extensão contra o de sangramento.',
        'Investigue **câncer oculto** apenas com rastreio apropriado à idade e sexo, não com tomografia de corpo inteiro: a busca extensiva não melhora a sobrevida. Trombofilia só deve ser pesquisada se o resultado for mudar a duração do tratamento — na maioria dos casos não muda.',
      ],
      alertas: [
        'Ultrassonografia negativa com suspeita clínica mantida não encerra o caso: repita em 5 a 7 dias, porque trombose distal pode progredir e só então se tornar visível.',
      ],
      interpretacao: [
        total < 2
          ? '**TVP improvável.** D-dímero negativo exclui e encerra a investigação. D-dímero positivo indica ultrassom com compressão.'
          : '**TVP provável.** Ultrassom com compressão venosa é o exame inicial. Se o ultrassom for negativo mas a suspeita permanecer alta, repita em 5 a 7 dias ou solicite D-dímero — trombos distais podem propagar-se nesse intervalo.',
        'O ultrassom de compressão de dois pontos (femoral comum e poplítea) tem sensibilidade alta para trombose proximal e baixa para trombose de panturrilha isolada, que é o motivo do exame seriado.',
      ],
    }
  },
  formula: ['Soma de 9 critérios positivos de 1 ponto, menos 2 pontos se houver diagnóstico alternativo provável'],
  fundamento:
    'O escore combina fatores de risco de trombose (câncer, imobilização, cirurgia, trombose prévia) com achados de exame físico que refletem obstrução venosa (edema, assimetria de panturrilha, colaterais). O item negativo é a peça mais inteligente: reconhece explicitamente que celulite, ruptura de cisto de Baker e lesão muscular imitam TVP e devem reduzir a probabilidade, e não apenas deixar de somar.',
  armadilhas: [
    'Não se aplica a trombose de membro superior nem a suspeita de trombose em paciente já anticoagulado.',
    'Em gestantes, use o escore LEFt (Left leg, Edema calf difference ≥ 2 cm, First trimester), específico para a gestação.',
  ],
  referencias: [
    { texto: 'Wells PS, Anderson DR, Bormanis J, et al. Value of assessment of pretest probability of deep-vein thrombosis in clinical management. Lancet. 1997;350(9094):1795-1798.' },
    { texto: 'Wells PS, Anderson DR, Rodger M, et al. Evaluation of D-dimer in the diagnosis of suspected deep-vein thrombosis. N Engl J Med. 2003;349(13):1227-1235.' },
  ],
}

const perc: Ferramenta = {
  id: 'perc',
  nome: 'Critérios de PERC',
  sinonimos: ['perc', 'perc rule', 'exclusao de tep'],
  resumo: 'Oito critérios que, todos negativos em baixo risco, dispensam até o D-dímero.',
  categorias: ['cardiologia', 'pneumologia', 'emergencia'],
  campos: [
    campoSimNao('idade', 'Idade ≥ 50 anos', 1),
    campoSimNao('fc', 'Frequência cardíaca ≥ 100 bpm', 1),
    campoSimNao('sao2', 'SpO₂ < 95% em ar ambiente', 1, 'Saturação medida em ar ambiente, sem oxigênio suplementar. Com oxigênio em uso, o critério não é avaliável.'),
    campoSimNao('edema', 'Edema unilateral de membro inferior', 1, 'Aumento de volume assimétrico da panturrilha ou da coxa, visível ou medido — não vale edema bilateral de estase.'),
    campoSimNao('hemoptise', 'Hemoptise', 1),
    campoSimNao('trauma', 'Trauma ou cirurgia com internação nas últimas 4 semanas', 1, 'Trauma ou cirurgia que exigiu internação nas últimas 4 semanas; procedimento ambulatorial não conta.'),
    campoSimNao('tepPrevio', 'TEP ou TVP prévios', 1),
    campoSimNao('hormonio', 'Uso de hormônio exógeno (estrogênio)', 1, 'Anticoncepcional oral, adesivo, anel, terapia de reposição hormonal ou estrogênio em qualquer via.'),
  ],
  calcular: (v) => {
    const ids = ['idade', 'fc', 'sao2', 'edema', 'hemoptise', 'trauma', 'tepPrevio', 'hormonio']
    const positivos = ids.filter((id) => sim(v, id))
    const total = positivos.length
    return {
      titulo: 'Critérios PERC positivos',
      valor: String(total),
      unidade: 'de 8',
      nivel: total === 0 ? 'ok' : 'atencao',
      rotuloNivel: total === 0 ? 'PERC negativo — TEP excluído em baixo risco' : 'PERC positivo — investigação necessária',
      detalhes: [{ rotulo: 'Critérios presentes', valor: total === 0 ? 'nenhum' : String(total) }],
      conduta: [
        '**Todos os oito critérios negativos** em paciente com probabilidade clínica baixa (< 15%): o risco residual de embolia fica abaixo de 2%, e a investigação pode ser encerrada sem D-dímero e sem imagem. Documente explicitamente os oito itens no prontuário — é essa documentação que sustenta a decisão de não investigar.',
        '**Qualquer critério positivo** não diagnostica embolia; apenas impede o uso do PERC como regra de exclusão. Prossiga pelo caminho habitual: Wells ou Genebra, depois D-dímero ou angiotomografia conforme a probabilidade.',
        'O PERC só é válido quando a probabilidade pré-teste já é **baixa**. Aplicá-lo a um paciente com suspeita moderada ou alta é uso incorreto e produz falsa segurança — a regra foi desenhada para evitar investigação, não para substituí-la.',
        'A grande utilidade prática é **reduzir D-dímeros desnecessários** na emergência. Como o D-dímero é frequentemente positivo por razões inespecíficas, pedi-lo em paciente PERC-negativo desencadeia uma cascata de tomografias com contraste, radiação e achados incidentais sem benefício.',
        'Não use o PERC em **gestantes, em quem já usa anticoagulante** ou em situações de alta prevalência de embolia. A regra foi validada em emergência de baixa prevalência e não transporta para esses contextos.',
      ],
      alertas: [
        'O PERC **só é válido quando a probabilidade pré-teste já é baixa** (menor que 15%). Aplicá-lo a suspeita moderada ou alta é uso incorreto e produz falsa segurança.',
        'Não use em gestantes nem em quem já está anticoagulado — a regra foi validada em emergência de baixa prevalência e não transporta para esses contextos.',
      ],
      interpretacao: [
        total === 0
          ? '**Todos os oito critérios negativos.** Em paciente com probabilidade pré-teste clinicamente baixa (menor que 15%), a probabilidade de embolia cai abaixo de 2% — patamar em que o risco da investigação (radiação, contraste, achados incidentais, falso-positivo do D-dímero) supera o benefício. Nem D-dímero é necessário.'
          : `**PERC positivo** por ${total} critério${total > 1 ? 's' : ''}. A regra não pode ser usada para excluir; siga com D-dímero ou imagem conforme o escore de Wells ou de Genebra.`,
        '**A regra só é válida em quem já é de baixo risco.** Aplicar PERC a paciente com probabilidade pré-teste moderada ou alta é o erro clássico: a regra tem sensibilidade alta mas especificidade baixíssima, e num contexto de prevalência maior o valor preditivo negativo despenca.',
        'O ensaio PROPER (2018) randomizou a estratégia PERC contra a estratégia convencional em emergências francesas e confirmou não inferioridade, com redução do uso de tomografia e do tempo de permanência.',
      ],
    }
  },
  formula: ['Todos os 8 critérios negativos + probabilidade pré-teste baixa = TEP excluído'],
  fundamento:
    'PERC inverte a lógica dos escores diagnósticos: em vez de estimar a probabilidade de doença, ele define um limiar de teste. Kline partiu do princípio de que existe uma probabilidade abaixo da qual investigar causa mais mal do que bem — estimada em 1,8%, considerando mortalidade por sangramento de anticoagulação desnecessária, nefropatia por contraste e câncer induzido por radiação. Os oito critérios foram escolhidos por serem os que, quando ausentes, mantêm a probabilidade abaixo desse limiar.',
  armadilhas: [
    'Nunca aplique PERC sem antes julgar a probabilidade pré-teste como baixa. A regra não substitui esse julgamento — ela o pressupõe.',
    'Não é validada em gestantes nem em pacientes internados.',
    'Uso de hormônio inclui anticoncepcional oral, adesivo, anel vaginal e terapia hormonal — não apenas comprimido.',
  ],
  referencias: [
    { texto: 'Kline JA, Courtney DM, Kabrhel C, et al. Prospective multicenter evaluation of the pulmonary embolism rule-out criteria. J Thromb Haemost. 2008;6(5):772-780.' },
    { texto: 'Freund Y, Cachanado M, Aubry A, et al. Effect of the pulmonary embolism rule-out criteria on subsequent thromboembolic events among low-risk emergency department patients: the PROPER randomized clinical trial. JAMA. 2018;319(6):559-566.' },
  ],
}

const genebra: Ferramenta = {
  id: 'genebra-revisado',
  nome: 'Escore de Genebra revisado',
  sinonimos: ['genebra', 'geneva score', 'wells alternativa'],
  resumo: 'Alternativa ao Wells, sem itens subjetivos — nas versões original e simplificada.',
  categorias: ['cardiologia', 'pneumologia', 'emergencia'],
  campos: [
    campoSimNao('idade', 'Idade > 65 anos', 1, 'Corte estrito: 65 anos exatos não pontua. A idade eleva o risco trombótico por estase venosa, redução da fibrinólise e maior prevalência de comorbidade protrombótica.'),
    campoSimNao('previo', 'TVP ou TEP prévios', 3, 'Evento documentado, não suspeita antiga. É um dos itens de maior peso: recorrência reflete trombofilia, dano valvar venoso residual ou fator de risco persistente.'),
    campoSimNao('cirurgia', 'Cirurgia sob anestesia geral ou fratura de membro inferior no último mês', 2, 'Janela de 1 mês. Anestesia geral (não local ou regional) e fratura de membro inferior — a combinação de imobilidade, lesão endotelial e resposta inflamatória com queda da fibrinólise.'),
    campoSimNao('cancer', 'Neoplasia sólida ou hematológica ativa, ou curada há menos de 1 ano', 2, 'O tumor libera fator tecidual, micropartículas circulantes e mucinas que ativam plaquetas diretamente. Quimioterapia e cateter central somam risco.'),
    campoSimNao('dorUnilateral', 'Dor unilateral em membro inferior', 3, 'Dor espontânea referida, unilateral. Item distinto do achado de palpação abaixo — os dois podem coexistir e somar 7 pontos.'),
    campoSimNao('hemoptise', 'Hemoptise', 2, 'Sugere infarto pulmonar por oclusão de ramo periférico com hemorragia alveolar. Volume habitualmente pequeno; hemoptise maciça aponta outra causa.'),
    campoOpc('fc', 'Frequência cardíaca', [
      { valor: '0', rotulo: 'Menos de 75 bpm', pontos: 0 },
      { valor: '3', rotulo: '75 a 94 bpm', pontos: 3 },
      { valor: '5', rotulo: '95 bpm ou mais', pontos: 5 },
    ], { ajuda: 'Frequência de repouso na admissão, não a do momento da dor. É o único item graduado do escore e o de maior peso máximo: a taquicardia é a resposta compensatória ao débito reduzido pela sobrecarga aguda do ventrículo direito. Atenção ao betabloqueado, que pode não taquicardizar.' }),
    campoSimNao('palpacao', 'Dor à palpação de trajeto venoso profundo com edema unilateral', 4, 'Exige os DOIS achados juntos: dor à palpação do trajeto venoso profundo E edema unilateral. É o item de maior peso do escore, e marcar apenas um dos dois componentes infla o resultado.'),
  ],
  calcular: (v) => {
    const fc = num(v, 'fc')
    if (fc === null) return null
    const total =
      somaSimNao(v, [
        { id: 'idade', pontos: 1 },
        { id: 'previo', pontos: 3 },
        { id: 'cirurgia', pontos: 2 },
        { id: 'cancer', pontos: 2 },
        { id: 'dorUnilateral', pontos: 3 },
        { id: 'hemoptise', pontos: 2 },
        { id: 'palpacao', pontos: 4 },
      ]) + fc
    const simplificado =
      somaSimNao(v, [
        { id: 'idade', pontos: 1 },
        { id: 'previo', pontos: 1 },
        { id: 'cirurgia', pontos: 1 },
        { id: 'cancer', pontos: 1 },
        { id: 'dorUnilateral', pontos: 1 },
        { id: 'hemoptise', pontos: 1 },
        { id: 'palpacao', pontos: 1 },
      ]) + (fc === 5 ? 2 : fc === 3 ? 1 : 0)
    const cat = total <= 3 ? 0 : total <= 10 ? 1 : 2
    return {
      titulo: 'Genebra revisado',
      valor: String(total),
      unidade: 'pontos',
      nivel: (['ok', 'atencao', 'critico'] as Nivel[])[cat],
      rotuloNivel: ['Baixa probabilidade (≈ 8%)', 'Probabilidade intermediária (≈ 28%)', 'Alta probabilidade (≈ 74%)'][cat],
      detalhes: [
        { rotulo: 'Versão simplificada', valor: `${simplificado} pontos`, nota: `Corte dicotômico: ≤ 1 = TEP improvável; ≥ 2 = TEP provável. Aqui: **${simplificado <= 1 ? 'improvável' : 'provável'}**.` },
        { rotulo: 'Corte dicotômico da versão completa', valor: total <= 5 ? 'TEP improvável (≤ 5)' : 'TEP provável (≥ 6)' },
      ],
      interpretacao: [
        'O Genebra foi construído deliberadamente sem nenhum item de julgamento clínico — é inteiramente objetivo, o que lhe dá reprodutibilidade melhor que a de Wells entre examinadores diferentes. O desempenho discriminativo dos dois é equivalente, então a escolha é de preferência institucional.',
        total <= 5
          ? 'Faixa improvável: D-dímero negativo (com corte ajustado pela idade acima de 50 anos) exclui embolia.'
          : 'Faixa provável: siga direto para angiotomografia de tórax.',
        'A versão simplificada, com 1 ponto por item (2 para frequência ≥ 95 bpm), foi validada e tem desempenho equivalente à completa — mais fácil de aplicar de cabeça.',
        'O escore existe para resolver um problema de **probabilidade pré-teste**, e é isso que dá sentido a todo o algoritmo. O D-dímero é um produto de degradação da fibrina reticulada pela plasmina: ele tem sensibilidade alta (acima de 95% nos ensaios quantitativos) e especificidade muito baixa, porque qualquer trombo, hematoma, inflamação, infecção, neoplasia, gravidez, cirurgia recente ou idade avançada eleva o valor. Um teste com essa assinatura serve para **excluir** e nunca para confirmar — e só exclui de forma segura quando a probabilidade pré-teste é baixa o suficiente para que o valor preditivo negativo supere 98%. Daí a arquitetura: nas faixas improvável, D-dímero negativo encerra a investigação; nas faixas provável, a probabilidade pré-teste é alta demais e um D-dímero negativo deixaria um risco residual inaceitável, de modo que a conduta é ir direto à angiotomografia. A fisiopatologia dos itens segue a tríade de Virchow — estase (idade, cirurgia, fratura, imobilidade implícita), lesão endotelial (cirurgia, fratura) e hipercoagulabilidade (neoplasia, evento prévio) — somada aos achados que sugerem o trombo já formado (dor e edema unilaterais, palpação dolorosa do trajeto venoso) e à repercussão hemodinâmica da embolia instalada (taquicardia, hemoptise por infarto pulmonar). É um escore que combina, num só número, fatores de risco e sinais de doença presente.',
      ],
      conduta: total <= 5
        ? [
            'Faixa **improvável**: solicite D-dímero quantitativo. Se negativo, a embolia está excluída com segurança e nenhuma imagem é necessária — encerre a investigação para tromboembolismo e procure o diagnóstico alternativo.',
            'Use o **corte ajustado pela idade** acima de 50 anos (idade × 10 µg/L para o ensaio expresso em unidades equivalentes de fibrinogênio): isso aumenta substancialmente a proporção de pacientes em que a imagem é dispensada, sem aumento de eventos perdidos. As estratégias YEARS e PEGeD refinam ainda mais esse mesmo princípio.',
            'Se o D-dímero for positivo, prossiga para **angiotomografia de tórax**. D-dímero positivo não faz diagnóstico: em idoso, gestante, pós-operatório ou paciente oncológico ele é positivo na maioria das vezes, por razões que nada têm a ver com embolia.',
            'Em gestante, o algoritmo é outro: o D-dímero sobe fisiologicamente ao longo da gestação e os cortes habituais não valem. Siga protocolo específico, que costuma iniciar por ultrassom de membros inferiores e prosseguir com angiotomografia ou cintilografia de perfusão conforme achados e disponibilidade.',
          ]
        : [
            'Faixa **provável**: vá direto à **angiotomografia de tórax**, sem D-dímero. Nessa faixa, o valor preditivo negativo de um D-dímero negativo é insuficiente e solicitá-lo apenas atrasa o diagnóstico.',
            'Considere **anticoagulação empírica** enquanto aguarda a imagem, se o risco hemorrágico for aceitável e a demora prevista for relevante. Heparina de baixo peso molecular em dose terapêutica é a escolha, e a decisão deve estar registrada.',
            'Se houver contraindicação à angiotomografia — insuficiência renal grave, alergia a contraste iodado, gestação —, use alternativas: cintilografia de ventilação-perfusão, ultrassom de membros inferiores (uma trombose venosa profunda proximal em paciente com quadro compatível já autoriza tratar) ou ecocardiograma à beira do leito em paciente instável.',
            'Em paciente **instável** — hipotensão sustentada, choque ou parada —, não espere exame nenhum: ecocardiograma à beira do leito mostrando sobrecarga aguda de ventrículo direito autoriza trombólise sistêmica imediata, porque a mortalidade nessa apresentação é medida em minutos.',
            'Confirmado o diagnóstico, estratifique com PESI ou sPESI, troponina e avaliação do ventrículo direito para decidir tratamento domiciliar, internação ou terapia intensiva.',
          ],
      alertas: [
        'Existem três versões em circulação (original de 2001, revisada de 2006 e simplificada de 2008) com pontuações diferentes, e dois cortes distintos na versão completa (dicotômico em 5/6 e categórico em três faixas). Padronize uma no serviço e registre qual foi usada.',
        'O escore estima **probabilidade diagnóstica**, não gravidade. Um paciente com escore baixo pode ter embolia maciça, e um com escore alto pode ter embolia subsegmentar irrelevante — gravidade se avalia com PESI, sPESI, troponina e imagem do ventrículo direito.',
        'D-dímero negativo só exclui embolia na faixa improvável. Aplicá-lo na faixa provável é erro de algoritmo com risco de diagnóstico perdido.',
        'Paciente instável não entra em algoritmo de probabilidade: hipotensão sustentada com suspeita de embolia é indicação de ecocardiograma imediato e de reperfusão, sem escore.',
        'Não validado em gestantes nem em pacientes já anticoagulados, situação em que tanto o D-dímero quanto a probabilidade pré-teste se comportam de forma diferente.',
      ],
      tabela: {
        titulo: 'Genebra revisado: faixas e algoritmo',
        colunas: ['Pontos (completo)', 'Probabilidade', 'Prevalência de TEP', 'Próximo passo'],
        linhas: [
          ['0 – 3', 'Baixa', '≈ 8%', 'D-dímero; se negativo, exclui'],
          ['4 – 10', 'Intermediária', '≈ 28%', 'D-dímero se ≤ 5; angiotomografia se ≥ 6'],
          ['≥ 11', 'Alta', '≈ 74%', 'Angiotomografia direta'],
        ],
        destaque: cat,
      },
    }
  },
  formula: ['Soma ponderada de 8 critérios objetivos', 'Versão simplificada: 1 ponto por item (FC ≥ 95 vale 2)'],
  fundamento:
    'O escore de Genebra revisado foi desenhado para eliminar a maior fragilidade do Wells: o item "diagnóstico alternativo menos provável", responsável por 3 pontos e por boa parte da variabilidade interobservador. Todas as suas variáveis são objetivas e verificáveis no prontuário, o que o torna adequado a aplicação por protocolo, por enfermagem ou por sistema informatizado. A razão de existir um escore de probabilidade antes de qualquer exame está na natureza do **D-dímero**, que é o teste de triagem disponível. Ele é um produto de degradação da fibrina reticulada pela plasmina, e tem sensibilidade acima de 95% nos ensaios quantitativos com especificidade muito baixa — qualquer trombo, hematoma, inflamação, infecção, neoplasia, gravidez, cirurgia recente ou simplesmente idade avançada o eleva. Um teste assim serve para excluir e jamais para confirmar, e sua capacidade de excluir depende inteiramente da probabilidade pré-teste: com prevalência baixa, o valor preditivo negativo supera 98% e o resultado negativo encerra a investigação com segurança; com prevalência alta, o mesmo resultado negativo deixaria um risco residual inaceitável. É por isso que o algoritmo bifurca — e é por isso que aplicar D-dímero na faixa provável é erro de método, não de preferência. Quanto à composição dos itens, o escore combina duas categorias distintas de informação: fatores de risco que refletem a tríade de Virchow (idade e cirurgia ou fratura para estase e lesão endotelial, neoplasia e evento prévio para hipercoagulabilidade) e achados que sugerem doença já presente (dor e edema unilaterais, palpação dolorosa do trajeto venoso, hemoptise por infarto pulmonar e taquicardia como resposta compensatória à sobrecarga aguda do ventrículo direito). Essa mistura é deliberada e é o que permite discriminação equivalente à do Wells sem nenhum item de julgamento — em validações diretas, o desempenho dos dois é comparável, de modo que a escolha entre eles é institucional. A versão simplificada, com 1 ponto por item, confirma um achado recorrente em modelos de predição: quando as variáveis são correlacionadas, igualar os pesos costuma preservar a discriminação e melhorar a generalização, além de reduzir erro de aplicação.',
  armadilhas: [
    'Existem três versões em circulação (original de 2001, revisada de 2006 e simplificada de 2008), com pontuações diferentes. Registre qual foi usada.',
    'A frequência cardíaca é a de repouso na admissão, não a do momento da dor.',
    'O item de palpação exige dor à palpação do trajeto venoso profundo **e** edema unilateral, simultaneamente. Marcar apenas um dos dois componentes adiciona 4 pontos indevidos e pode mudar a faixa.',
    'A versão completa tem dois cortes em uso: dicotômico (≤ 5 improvável, ≥ 6 provável) e categórico em três faixas. Misturá-los produz conduta incoerente.',
    'Escore alto não indica gravidade nem urgência de reperfusão, apenas probabilidade de o diagnóstico existir. Gravidade se mede com PESI, sPESI, troponina e função do ventrículo direito.',
    'Em paciente já em uso de anticoagulante ou em gestante, o algoritmo derivado do escore não se aplica diretamente, porque o comportamento do D-dímero e a prevalência são diferentes.',
    'Betabloqueado, atleta e paciente com marcapasso podem não atingir a faixa de taquicardia mesmo com embolia significativa, perdendo até 5 pontos do escore.',
  ],
  referencias: [
    { texto: 'Le Gal G, Righini M, Roy PM, et al. Prediction of pulmonary embolism in the emergency department: the revised Geneva score. Ann Intern Med. 2006;144(3):165-171.' },
    { texto: 'Klok FA, Mos IC, Nijkeuter M, et al. Simplification of the revised Geneva score for assessing clinical probability of pulmonary embolism. Arch Intern Med. 2008;168(19):2131-2136.' },
  ],
}

const dasiCampos: Campo[] = [
  campoSimNao('a1', 'Cuidar de si mesmo: comer, vestir-se, tomar banho, usar o banheiro', 2.75, 'Responda pelo que o paciente consegue fazer hoje, sem ajuda e sem sintoma limitante — não pelo que fazia antes de adoecer.'),
  campoSimNao('a2', 'Caminhar dentro de casa', 1.75),
  campoSimNao('a3', 'Caminhar 1 a 2 quarteirões no plano', 2.75),
  campoSimNao('a4', 'Subir um lance de escadas ou uma ladeira', 5.5, 'Este é o item mais próximo do limiar de 4 METs que libera a cirurgia sem investigação adicional. Pergunte se para e por quê: dispneia, dor torácica, dor nas pernas ou artrose levam a condutas diferentes.'),
  campoSimNao('a5', 'Correr uma distância curta', 8, 'Limitação por artrose, doença vascular periférica, obesidade ou doença pulmonar reduz o DASI sem que haja limitação cardíaca — nesse caso o escore baixo não significa risco cardíaco alto.'),
  campoSimNao('a6', 'Trabalho doméstico leve: tirar pó, lavar louça', 2.7),
  campoSimNao('a7', 'Trabalho doméstico moderado: aspirar, varrer, carregar compras', 3.5),
  campoSimNao('a8', 'Trabalho doméstico pesado: esfregar o chão, mover móveis', 8),
  campoSimNao('a9', 'Trabalho de jardim: rastelar folhas, capinar, empurrar cortador', 4.5),
  campoSimNao('a10', 'Manter relações sexuais', 5.25),
  campoSimNao('a11', 'Esporte recreativo moderado: dançar, boliche, golfe, tênis de duplas', 6),
  campoSimNao('a12', 'Esporte extenuante: natação, tênis de simples, futebol, basquete', 7.5),
]

const dasi: Ferramenta = {
  id: 'dasi',
  nome: 'Duke Activity Status Index',
  sigla: 'DASI',
  sinonimos: ['dasi', 'capacidade funcional', 'mets', 'duke activity'],
  resumo: 'Converte atividades do cotidiano em METs e VO₂ de pico estimados.',
  categorias: ['cardiologia', 'cirurgia'],
  campos: dasiCampos,
  calcular: (v) => {
    const total = dasiCampos.reduce((t, c) => t + pts(v, c.id, c.pontos ?? 0), 0)
    const vo2 = 0.43 * total + 9.6
    const mets = vo2 / 3.5
    const nivel: Nivel = mets < 4 ? 'alerta' : mets < 7 ? 'atencao' : 'ok'
    return {
      titulo: 'DASI',
      valor: fmt(total, 2),
      unidade: 'pontos (0 a 58,2)',
      nivel,
      rotuloNivel: mets < 4 ? 'Capacidade funcional ruim (< 4 METs)' : mets < 7 ? 'Capacidade funcional moderada' : 'Capacidade funcional boa',
      detalhes: [
        { rotulo: 'VO₂ de pico estimado', valor: `${fmt(vo2, 1)} mL/kg/min` },
        { rotulo: 'Equivalentes metabólicos', valor: `${fmt(mets, 1)} METs`, nota: '1 MET = 3,5 mL O₂/kg/min = consumo em repouso sentado.' },
      ],
      conduta: [
        'DASI convertido em **METs ≥ 4** (aproximadamente escore > 25 pontos): capacidade funcional adequada. Em cirurgia não cardíaca de risco intermediário, isso permite prosseguir sem teste cardíaco adicional — é o corte clássico das diretrizes perioperatórias.',
        '**METs < 4** ou escore baixo: a capacidade funcional é insuficiente para estratificar clinicamente. Combine com um índice de risco (RCRI ou Gupta MICA) e considere teste funcional se o resultado for mudar a conduta — se não for mudar, não peça.',
        'O estudo **MET-REPAIR** mostrou que o DASI prediz complicações cardíacas perioperatórias melhor que a estimativa subjetiva do médico sobre quantos lances de escada o paciente sobe. Prefira o questionário estruturado à impressão clínica.',
        'Use o DASI também para **medir resposta terapêutica** em insuficiência cardíaca e doença coronariana estável: ele é sensível a mudança e serve de desfecho em reabilitação cardíaca, sem precisar de ergoespirometria.',
        'Cuidado com a **limitação não cardíaca**: artrose, doença vascular periférica, obesidade e doença pulmonar reduzem o DASI sem que haja limitação cardíaca. Nesses casos o escore baixo não significa risco cardíaco alto, e o teste farmacológico (estresse com dobutamina ou dipiridamol) substitui o esforço.',
      ],
      alertas: [
        'Artrose, doença vascular periférica, obesidade e doença pulmonar reduzem o DASI sem que haja limitação cardíaca. Nesses casos, escore baixo não significa risco cardíaco alto, e o teste farmacológico substitui o esforço.',
      ],
      interpretacao: [
        mets < 4
          ? '**Menos de 4 METs.** É o limiar clássico das diretrizes perioperatórias: incapacidade de subir um lance de escadas ou caminhar dois quarteirões no plano identifica capacidade funcional ruim e motiva investigação cardiovascular adicional antes de cirurgia de risco intermediário ou alto.'
          : mets < 7
            ? 'Entre 4 e 7 METs: capacidade suficiente para a maioria dos procedimentos sem investigação adicional, na ausência de outros marcadores de risco.'
            : 'Acima de 7 METs: capacidade funcional boa. Investigação cardiovascular pré-operatória adicional raramente muda conduta.',
        'O DASI ganhou relevância nova depois do estudo METS (2018), que comparou a avaliação subjetiva do médico, o DASI, o peptídeo natriurético e a ergoespirometria antes de cirurgia não cardíaca: a impressão subjetiva do anestesiologista **não** previu complicações, enquanto o DASI previu — e um DASI abaixo de 34 pontos associou-se independentemente a mais morte e infarto no pós-operatório.',
        'Referências de METs: dormir 0,9; caminhar devagar 2,0; subir escadas 4 a 6; correr a 10 km/h 10; nadar vigorosamente 11.',
      ],
    }
  },
  formula: ['VO₂ de pico (mL/kg/min) = 0,43 × DASI + 9,6', 'METs = VO₂ ÷ 3,5'],
  fundamento:
    'O DASI foi validado contra ergoespirometria: os pesos de cada item derivam do custo metabólico real das atividades, medido em laboratório. É por isso que "correr uma distância curta" vale 8 pontos e "caminhar dentro de casa" vale 1,75. O questionário existe porque o teste de esforço formal nem sempre é possível ou necessário, e porque a capacidade funcional é um dos preditores mais robustos de desfecho perioperatório e cardiovascular em geral.',
  armadilhas: [
    'Limitação ortopédica, neurológica ou vascular periférica reduz o DASI sem que a reserva cardíaca esteja comprometida — o escore mede desempenho, não coração.',
    'Pacientes tendem a superestimar a própria capacidade. Pergunte por atividades concretas e recentes, não por autoavaliação genérica.',
  ],
  referencias: [
    { texto: 'Hlatky MA, Boineau RE, Higginbotham MB, et al. A brief self-administered questionnaire to determine functional capacity (the Duke Activity Status Index). Am J Cardiol. 1989;64(10):651-654.' },
    { texto: 'Wijeysundera DN, Pearse RM, Shulman MA, et al. Assessment of functional capacity before major non-cardiac surgery (METS study). Lancet. 2018;391(10140):2631-2640.' },
  ],
}

const debitoCardiaco: Ferramenta = {
  id: 'debito-cardiaco',
  nome: 'Débito cardíaco e índice cardíaco',
  sinonimos: ['debito cardiaco', 'indice cardiaco', 'fick', 'volume sistolico'],
  resumo: 'Calcula débito e índice pelo volume sistólico ou pelo princípio de Fick.',
  categorias: ['cardiologia', 'emergencia'],
  campos: [
    campoSeg('metodo', 'Método', [
      { valor: 'vs', rotulo: 'FC × volume sistólico' },
      { valor: 'fick', rotulo: 'Princípio de Fick' },
    ]),
    campoNum('fc', 'Frequência cardíaca', { ajuda: 'Frequência no momento da medida do volume sistólico — o produto só faz sentido se as duas variáveis forem simultâneas.', unidade: 'bpm', min: 20, max: 250, passo: 1, mostrarSe: (v) => opc(v, 'metodo') === 'vs' }),
    campoNum('vs', 'Volume sistólico', { ajuda: 'Volume sistólico por ecocardiograma (integral velocidade-tempo × área da via de saída), termodiluição ou análise de contorno de pulso.', unidade: 'mL', min: 5, max: 200, passo: 1, normalMin: 60, normalMax: 100, mostrarSe: (v) => opc(v, 'metodo') === 'vs' }),
    campoNum('vo2', 'Consumo de O₂ (VO₂)', { unidade: 'mL/min', min: 50, max: 800, passo: 5, padrao: '250', mostrarSe: (v) => opc(v, 'metodo') === 'fick', ajuda: 'Estimativa comum: 125 mL/min/m² de superfície corporal.' }),
    campoNum('hb', 'Hemoglobina', { ajuda: 'Hemoglobina para o cálculo pelo princípio de Fick, que depende do conteúdo arteriovenoso de oxigênio.', unidade: 'g/dL', min: 3, max: 22, passo: 0.1, mostrarSe: (v) => opc(v, 'metodo') === 'fick' }),
    campoNum('sao2', 'SaO₂', { ajuda: 'Saturação arterial por gasometria, não por oximetria de pulso, quando o objetivo for o cálculo de Fick.', unidade: '%', min: 40, max: 100, passo: 0.1, padrao: '98', mostrarSe: (v) => opc(v, 'metodo') === 'fick' }),
    campoNum('svo2', 'SvO₂ (venosa mista)', { ajuda: 'Saturação venosa mista, colhida da artéria pulmonar. A saturação venosa central, da veia cava superior, é cerca de 5 a 7% maior e não é intercambiável.', unidade: '%', min: 20, max: 100, passo: 0.1, padrao: '70', mostrarSe: (v) => opc(v, 'metodo') === 'fick' }),
    campoPeso({ opcional: true }),
    campoAltura({ opcional: true }),
  ],
  calcular: (v) => {
    const metodo = opc(v, 'metodo')
    let dc: number | null = null
    let vs: number | null = null
    const fc = num(v, 'fc')
    if (metodo === 'vs') {
      const volume = num(v, 'vs')
      if (fc === null || volume === null) return null
      dc = (fc * volume) / 1000
      vs = volume
    } else {
      const vo2 = num(v, 'vo2')
      const hb = num(v, 'hb')
      const sao2 = num(v, 'sao2')
      const svo2 = num(v, 'svo2')
      if (vo2 === null || hb === null || sao2 === null || svo2 === null) return null
      const dav = 1.34 * hb * ((sao2 - svo2) / 100) * 10
      if (dav <= 0) return null
      dc = vo2 / dav
      vs = fc !== null && fc > 0 ? (dc * 1000) / fc : null
    }
    const peso = num(v, 'peso')
    const altura = num(v, 'altura')
    const sc = peso !== null && altura !== null ? bsaMosteller(peso, altura) : null
    const ic = sc ? dc / sc : null
    const detalhes: Resultado['detalhes'] = [{ rotulo: 'Referência de débito cardíaco', valor: '4 a 8 L/min' }]
    if (vs !== null) detalhes.unshift({ rotulo: 'Volume sistólico', valor: `${fmtInt(vs)} mL`, nota: 'Referência 60 a 100 mL' })
    if (sc) {
      detalhes.push({ rotulo: 'Superfície corporal (Mosteller)', valor: `${fmt(sc, 2)} m²` })
      detalhes.push({ rotulo: 'Índice cardíaco', valor: `${fmt(ic!, 2)} L/min/m²`, nota: 'Referência 2,5 a 4,0. Abaixo de 2,2 define baixo débito; abaixo de 1,8 sem suporte define choque cardiogênico.', nivel: ic! < 1.8 ? 'critico' : ic! < 2.2 ? 'alerta' : ic! > 4 ? 'atencao' : 'ok' })
      if (vs !== null) detalhes.push({ rotulo: 'Índice de volume sistólico', valor: `${fmtInt(vs / sc)} mL/m²`, nota: 'Referência 33 a 47 mL/m²' })
    }
    return {
      titulo: 'Débito cardíaco',
      valor: fmt(dc, 2),
      unidade: 'L/min',
      nivel: dc < 3 ? 'critico' : dc < 4 ? 'alerta' : dc > 8 ? 'atencao' : 'ok',
      rotuloNivel: dc < 4 ? 'Débito reduzido' : dc > 8 ? 'Débito elevado' : 'Débito normal',
      detalhes,
      conduta: [
        '**Índice cardíaco < 2,2 L/min/m²** com sinais de hipoperfusão (lactato alto, oligúria, extremidades frias, enchimento capilar lento) caracteriza estado de baixo débito. Determine o mecanismo antes de tratar: pré-carga insuficiente, falência de bomba, pós-carga excessiva ou arritmia.',
        'Com **pré-carga baixa**, reponha volume de forma guiada por resposta (elevação passiva de pernas, variação de pressão de pulso), não por meta fixa. Com **falência de bomba**, introduza inotrópico (dobutamina ou milrinona). Com **pós-carga excessiva**, vasodilate. Os três erros mais comuns são dar volume a quem já está congesto, inotrópico a quem está hipovolêmico e vasopressor a quem tem bomba falha.',
        'Índice cardíaco **alto (> 4,0 L/min/m²)** com hipotensão aponta estado hiperdinâmico: sepse, anemia grave, tireotoxicose, cirrose, fístula arteriovenosa ou beribéri. O tratamento é da causa — vasopressor sustenta a pressão enquanto isso, mas não corrige o problema.',
        'Interprete sempre junto com **saturação venosa central de oxigênio e lactato**: débito \'normal\' pode ser insuficiente para a demanda metabólica de um paciente séptico ou febril. O número absoluto importa menos do que a adequação à demanda.',
        'Lembre que o débito é **frequência × volume sistólico**: taquicardia extrema reduz o tempo de enchimento diastólico e derruba o débito, e bradicardia sem reserva de volume sistólico faz o mesmo. Corrigir a arritmia é, muitas vezes, a intervenção hemodinâmica mais eficaz disponível.',
      ],
      alertas: [
        'Débito \'normal\' pode ser insuficiente para a demanda metabólica de um paciente séptico ou febril. Interprete sempre junto com lactato e saturação venosa central — o número absoluto importa menos que a adequação à demanda.',
      ],
      interpretacao: [
        'O índice cardíaco é mais informativo do que o débito absoluto, porque normaliza pela superfície corporal: 4,5 L/min é excelente numa pessoa de 45 kg e insuficiente numa de 110 kg.',
        'Débito elevado com hipotensão aponta choque distributivo (sepse, anafilaxia, insuficiência hepática, tireotoxicose, beribéri, fístula arteriovenosa). Débito baixo com pressão de enchimento alta aponta choque cardiogênico; com pressão de enchimento baixa, hipovolêmico.',
        'Pelo princípio de Fick, o débito é o consumo de oxigênio dividido pela diferença arteriovenosa de conteúdo — a mesma lógica de "quanto de sangue precisou circular para entregar esse tanto de O₂".',
      ],
    }
  },
  formula: ['DC = FC × VS ÷ 1000', 'DC (Fick) = VO₂ ÷ [1,34 × Hb × (SaO₂ − SvO₂) × 10]', 'IC = DC ÷ superfície corporal'],
  fundamento:
    'O princípio de Fick, formulado em 1870, é a base de toda medida de débito cardíaco: a quantidade de uma substância captada por um órgão é igual ao fluxo sanguíneo multiplicado pela diferença de concentração entre entrada e saída. Aplicado ao pulmão e ao oxigênio, permite calcular o fluxo se o consumo e a diferença arteriovenosa forem conhecidos. A termodiluição, usada no cateter de artéria pulmonar, é uma variação do mesmo princípio com um indicador térmico.',
  armadilhas: [
    'O VO₂ estimado (125 mL/min/m²) é frequentemente impreciso no paciente crítico, febril ou sedado, e o erro se propaga integralmente para o débito. O Fick estimado é orientativo.',
    'A SvO₂ verdadeira exige sangue de artéria pulmonar; a saturação venosa central (ScvO₂), colhida em veia cava superior, corre 5 a 7 pontos acima e não é intercambiável em choque.',
  ],
  referencias: [
    { texto: 'Vincent JL. Understanding cardiac output. Crit Care. 2008;12(4):174.' },
    { texto: 'Monnet X, Teboul JL. Cardiac output monitoring: throw it out or keep it? Crit Care. 2018;22(1):35.' },
  ],
}

const pam: Ferramenta = {
  id: 'pressao-arterial-media',
  nome: 'Pressão arterial média, pressão de pulso e duplo produto',
  sigla: 'PAM',
  sinonimos: ['pam', 'pressao media', 'pressao de pulso', 'duplo produto', 'indice de choque'],
  resumo: 'Quatro derivados hemodinâmicos de beira de leito a partir de PA e frequência.',
  categorias: ['cardiologia', 'emergencia'],
  campos: [
    campoNum('pas', 'Pressão sistólica', { ajuda: 'Medida invasiva quando disponível; a não invasiva subestima a sistólica em choque e vasoconstrição intensa.', unidade: 'mmHg', min: 40, max: 280, passo: 1, normalMin: 100, normalMax: 130 }),
    campoNum('pad', 'Pressão diastólica', { ajuda: 'Diastólica do mesmo momento. A PAM calculada pela fórmula clássica é uma aproximação válida em frequências normais e perde exatidão na taquicardia extrema.', unidade: 'mmHg', min: 20, max: 160, passo: 1, normalMin: 60, normalMax: 85 }),
    campoNum('fc', 'Frequência cardíaca', { ajuda: 'Necessária para o duplo produto, que estima o consumo miocárdico de oxigênio e serve para medir eficácia de betabloqueador.', unidade: 'bpm', min: 20, max: 250, passo: 1, opcional: true }),
    campoNum('pvc', 'PVC ou pressão de átrio direito', { unidade: 'mmHg', min: 0, max: 30, passo: 1, opcional: true, ajuda: 'Opcional — permite calcular a pressão de perfusão.' }),
  ],
  calcular: (v) => {
    const pas = num(v, 'pas')
    const pad = num(v, 'pad')
    const fc = num(v, 'fc')
    const pvc = num(v, 'pvc')
    if (pas === null || pad === null) return null
    const pam = (pas + 2 * pad) / 3
    const pp = pas - pad
    const ppRelativa = (pp / pas) * 100
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Pressão de pulso', valor: `${fmtInt(pp)} mmHg`, nota: 'Referência 40 a 60. Alargada em rigidez arterial, insuficiência aórtica, anemia e tireotoxicose; estreitada em choque, tamponamento e estenose aórtica grave.', nivel: pp < 25 ? 'alerta' : pp > 70 ? 'atencao' : 'ok' },
      { rotulo: 'Pressão de pulso proporcional', valor: `${fmtInt(ppRelativa)}%`, nota: 'Abaixo de 25% na insuficiência cardíaca sugere índice cardíaco < 2,2 L/min/m² com boa acurácia.', nivel: ppRelativa < 25 ? 'alerta' : 'ok' },
    ]
    if (fc !== null) {
      const duplo = fc * pas
      const indiceChoque = fc / pas
      const indiceModificado = fc / pam
      detalhes.push({ rotulo: 'Duplo produto', valor: `${fmtInt(duplo)} mmHg·bpm`, nota: 'Estima o consumo miocárdico de oxigênio. Limiar isquêmico individual costuma situar-se entre 20.000 e 30.000; o pico normal no teste ergométrico ultrapassa 25.000.' })
      detalhes.push({ rotulo: 'Índice de choque (FC/PAS)', valor: fmt(indiceChoque, 2), nota: 'Referência 0,5 a 0,7. Acima de 0,9 associa-se a maior necessidade de transfusão e a pior desfecho no trauma e na sepse, muitas vezes antes de a pressão cair.', nivel: indiceChoque >= 1 ? 'critico' : indiceChoque > 0.9 ? 'alerta' : 'ok' })
      detalhes.push({ rotulo: 'Índice de choque modificado (FC/PAM)', valor: fmt(indiceModificado, 2), nota: 'Referência 0,7 a 1,3. Acima de 1,3 sinaliza hipoperfusão.', nivel: indiceModificado > 1.3 ? 'alerta' : 'ok' })
    }
    if (pvc !== null) detalhes.push({ rotulo: 'Pressão de perfusão sistêmica (PAM − PVC)', valor: `${fmtInt(pam - pvc)} mmHg`, nota: 'É o gradiente que de fato move sangue pelo leito capilar. PVC alta consome pressão de perfusão sem aparecer na PAM.' })
    const nivel: Nivel = pam < 60 ? 'critico' : pam < 65 ? 'alerta' : pam > 110 ? 'atencao' : 'ok'
    return {
      titulo: 'Pressão arterial média',
      valor: fmtInt(pam),
      unidade: 'mmHg',
      nivel,
      rotuloNivel: pam < 65 ? 'Abaixo do alvo de perfusão' : pam > 110 ? 'Elevada' : 'Adequada',
      detalhes,
      conduta: [
        'Mantenha a **PAM ≥ 65 mmHg** como alvo inicial em choque. Alvos mais altos (80–85 mmHg) só se justificam em hipertensos crônicos, em quem a autorregulação está deslocada para a direita, e no paciente com lesão renal aguda em curso — ao custo de mais arritmias atriais.',
        '**Pressão de pulso estreita (< 25% da sistólica)** sugere baixo volume sistólico: hipovolemia, tamponamento, estenose aórtica grave ou choque cardiogênico. **Pressão de pulso larga** aponta insuficiência aórtica, rigidez arterial do idoso, anemia, tireotoxicose ou fístula arteriovenosa. Esse é um dado de exame que orienta o diagnóstico antes de qualquer imagem.',
        'O **duplo produto (FC × PA sistólica)** estima o consumo miocárdico de oxigênio. Em angina, o limiar em que a dor aparece é reprodutível para o mesmo paciente e serve para medir eficácia de betabloqueador: se o limiar subiu, o fármaco está funcionando.',
        'Em **lesão cerebral aguda**, a PAM é o insumo da pressão de perfusão cerebral (PPC = PAM − PIC). Metas de PAM aqui não são genéricas — devem ser derivadas da PPC desejada (geralmente 60–70 mmHg) e da pressão intracraniana medida.',
        'Em **hipertensão aguda grave**, a regra é reduzir a PAM em no máximo **20–25% na primeira hora**, exceto em dissecção de aorta (sistólica < 120 mmHg em 20 min), pré-eclâmpsia grave e hemorragia intracerebral com indicação específica. Quedas maiores deslocam o paciente para fora da faixa de autorregulação e causam isquemia cerebral e renal.',
      ],
      alertas: [
        'Em hipertensão aguda grave, reduzir a PAM mais de 20 a 25% na primeira hora desloca o paciente para fora da faixa de autorregulação e causa isquemia cerebral e renal. As exceções com alvo mais agressivo são dissecção de aorta, pré-eclâmpsia grave e situações específicas de hemorragia intracerebral.',
      ],
      interpretacao: [
        'A PAM é ponderada pela diástole porque, em frequência normal, o coração passa cerca de dois terços do ciclo em diástole — e é a PAM, não a sistólica, que governa a perfusão de rim, cérebro e coração.',
        'O alvo de **65 mmHg** na sepse vem do estudo SEPSISPAM, que não encontrou benefício de mortalidade em mirar 80 a 85 mmHg — exceto no subgrupo de hipertensos crônicos, que teve menos necessidade de terapia renal substitutiva com o alvo mais alto. Em traumatismo cranioencefálico o alvo é outro, ditado pela pressão de perfusão cerebral.',
        'A fórmula (PAS + 2×PAD)/3 vale para frequências fisiológicas. Em taquicardia importante a diástole encurta desproporcionalmente e a fórmula subestima a PAM real — nesses casos, a medida invasiva integrada da curva é mais confiável.',
      ],
    }
  },
  formula: ['PAM = (PAS + 2 × PAD) ÷ 3', 'PP = PAS − PAD', 'Duplo produto = FC × PAS', 'Índice de choque = FC ÷ PAS'],
  fundamento:
    'Todos esses derivados extraem informação de dois números que já estão à disposição em qualquer leito. A PAM traduz a pressão de perfusão; a pressão de pulso traduz o volume sistólico dividido pela complacência arterial; o duplo produto estima o trabalho cardíaco e, com ele, o consumo miocárdico de oxigênio; o índice de choque captura a resposta compensatória — taquicardia antes da hipotensão — e por isso detecta o choque em fase mais precoce do que a pressão isolada.',
  armadilhas: [
    'Manguito de tamanho errado é a maior fonte de erro: manguito estreito superestima a pressão em obesos.',
    'A oscilometria automática mede a PAM diretamente e calcula sistólica e diastólica por algoritmo. Em hipotensão grave, a PAM do monitor é mais confiável do que a sistólica exibida.',
  ],
  referencias: [
    { texto: 'Asfar P, Meziani F, Hamel JF, et al. High versus low blood-pressure target in patients with septic shock (SEPSISPAM). N Engl J Med. 2014;370(17):1583-1593.' },
    { texto: 'Stevenson LW, Perloff JK. The limited reliability of physical signs for estimating hemodynamics in chronic heart failure. JAMA. 1989;261(6):884-888.' },
  ],
}

const riscoCv: Ferramenta = {
  id: 'risco-cardiovascular-10-anos',
  nome: 'Risco cardiovascular em 10 anos (equações do Pooled Cohort)',
  sigla: 'ASCVD',
  sinonimos: ['risco cardiovascular', 'ascvd', 'pooled cohort', 'escore de risco global', 'framingham'],
  resumo: 'Probabilidade de infarto ou AVC em 10 anos e o patamar de indicação de estatina.',
  categorias: ['cardiologia'],
  campos: [
    campoNum('idade', 'Idade', { unidade: 'anos', min: 20, max: 89, passo: 1, ajuda: 'As equações foram derivadas e validadas para 40 a 79 anos.' }),
    campoSexo(),
    campoSeg('etnia', 'Grupo de coorte', [
      { valor: 'branco', rotulo: 'Branco / outros' },
      { valor: 'negro', rotulo: 'Negro' },
    ], { ajuda: 'As equações originais foram estratificadas por autodeclaração racial nas coortes americanas. É uma limitação reconhecida do modelo, não um determinismo biológico — leia as armadilhas.' }),
    campoNum('ct', 'Colesterol total', { unidade: 'mg/dL', min: 100, max: 400, passo: 1 }),
    campoNum('hdl', 'HDL-colesterol', { unidade: 'mg/dL', min: 15, max: 120, passo: 1 }),
    campoNum('pas', 'Pressão sistólica', { unidade: 'mmHg', min: 80, max: 220, passo: 1 }),
    campoSeg('tratado', 'Em uso de anti-hipertensivo', [
      { valor: 'nao', rotulo: 'Não' },
      { valor: 'sim', rotulo: 'Sim' },
    ]),
    campoSeg('diabetes', 'Diabetes', [
      { valor: 'nao', rotulo: 'Não' },
      { valor: 'sim', rotulo: 'Sim' },
    ]),
    campoSeg('tabagismo', 'Tabagismo atual', [
      { valor: 'nao', rotulo: 'Não' },
      { valor: 'sim', rotulo: 'Sim' },
    ]),
  ],
  calcular: (v) => {
    const idade = num(v, 'idade')
    const ct = num(v, 'ct')
    const hdl = num(v, 'hdl')
    const pas = num(v, 'pas')
    if (idade === null || ct === null || hdl === null || pas === null) return null
    const f = opc(v, 'sexo') === 'f'
    const negro = opc(v, 'etnia') === 'negro'
    const tratado = sim(v, 'tratado')
    const dm = sim(v, 'diabetes') ? 1 : 0
    const fuma = sim(v, 'tabagismo') ? 1 : 0
    const lnIdade = Math.log(idade)
    const lnCt = Math.log(ct)
    const lnHdl = Math.log(hdl)
    const lnPas = Math.log(pas)

    let soma = 0
    let media = 0
    let s10 = 0
    if (f && !negro) {
      soma =
        -29.799 * lnIdade +
        4.884 * lnIdade * lnIdade +
        13.54 * lnCt +
        -3.114 * lnIdade * lnCt +
        -13.578 * lnHdl +
        3.149 * lnIdade * lnHdl +
        (tratado ? 2.019 * lnPas : 1.957 * lnPas) +
        7.574 * fuma +
        -1.665 * lnIdade * fuma +
        0.661 * dm
      media = -29.18
      s10 = 0.9665
    } else if (f && negro) {
      soma =
        17.114 * lnIdade +
        0.94 * lnCt +
        -18.92 * lnHdl +
        4.475 * lnIdade * lnHdl +
        (tratado ? 29.291 * lnPas - 6.432 * lnIdade * lnPas : 27.82 * lnPas - 6.087 * lnIdade * lnPas) +
        0.691 * fuma +
        0.874 * dm
      media = 86.61
      s10 = 0.9533
    } else if (!f && !negro) {
      soma =
        12.344 * lnIdade +
        11.853 * lnCt +
        -2.664 * lnIdade * lnCt +
        -7.99 * lnHdl +
        1.769 * lnIdade * lnHdl +
        (tratado ? 1.797 * lnPas : 1.764 * lnPas) +
        7.837 * fuma +
        -1.795 * lnIdade * fuma +
        0.658 * dm
      media = 61.18
      s10 = 0.9144
    } else {
      soma =
        2.469 * lnIdade +
        0.302 * lnCt +
        -0.307 * lnHdl +
        (tratado ? 1.916 * lnPas : 1.809 * lnPas) +
        0.549 * fuma +
        0.645 * dm
      media = 19.54
      s10 = 0.8954
    }
    const risco = (1 - Math.pow(s10, Math.exp(soma - media))) * 100
    const faixa = risco < 5 ? 0 : risco < 7.5 ? 1 : risco < 20 ? 2 : 3
    const nivel: Nivel = (['ok', 'atencao', 'alerta', 'critico'] as Nivel[])[faixa]
    const naoLigado = ct - hdl
    return {
      titulo: 'Risco de evento aterosclerótico em 10 anos',
      valor: fmtPct(risco, 1),
      nivel,
      rotuloNivel: ['Risco baixo (< 5%)', 'Risco limítrofe (5 a 7,4%)', 'Risco intermediário (7,5 a 19,9%)', 'Risco alto (≥ 20%)'][faixa],
      detalhes: [
        { rotulo: 'Colesterol não-HDL', valor: `${fmtInt(naoLigado)} mg/dL`, nota: 'Alvo geral < 130 mg/dL; em alto risco, < 100 mg/dL.' },
        { rotulo: 'Desfecho estimado', valor: 'Infarto não fatal, morte coronariana ou AVC fatal e não fatal' },
      ],
      conduta: [
        'Risco **< 5% (baixo)**: mudança de estilo de vida, sem estatina. Reavalie a cada 4–6 anos, ou antes se houver novo fator de risco.',
        'Risco **5–7,5% (limítrofe)** e **7,5–20% (intermediário)**: é aqui que a decisão exige conversa. Considere fatores potencializadores — histórico familiar precoce, lipoproteína(a) elevada, LDL ≥ 160 mg/dL persistente, síndrome metabólica, doença inflamatória crônica, pré-eclâmpsia prévia, doença renal crônica. Se a decisão continuar incerta, o **escore de cálcio coronariano** resolve: zero permite adiar a estatina, e ≥ 100 (ou percentil ≥ 75) indica tratar.',
        'Risco **≥ 20% (alto)**: estatina de alta intensidade, com meta de redução do LDL de pelo menos 50%. Não espere o escore de cálcio — nesse patamar ele não muda a conduta.',
        'As equações **superestimam o risco** em populações contemporâneas de renda alta e **subestimam** em populações de alto risco não representadas na derivação. No Brasil, use-as como ponto de partida e não como veredito, e prefira recalibrações locais quando disponíveis.',
        'O escore não se aplica a quem **já tem doença aterosclerótica estabelecida, LDL ≥ 190 mg/dL ou diabetes entre 40 e 75 anos** — esses três grupos já têm indicação de estatina independentemente do cálculo, e passar por ele só atrasa o tratamento.',
      ],
      interpretacao: [
        faixa === 0
          ? 'Risco baixo: ênfase em mudança de estilo de vida. Estatina não indicada de rotina, salvo LDL ≥ 190 mg/dL, que por si só define alto risco.'
          : faixa === 1
            ? 'Risco limítrofe: discutir estatina de intensidade moderada se houver fatores potencializadores — história familiar precoce, LDL persistentemente ≥ 160, síndrome metabólica, doença renal crônica, doença inflamatória crônica, pré-eclâmpsia, proteína C reativa ultrassensível ≥ 2,0 mg/L ou lipoproteína(a) elevada.'
            : faixa === 2
              ? 'Risco intermediário: estatina de intensidade moderada indicada, mirando redução de 30 a 49% do LDL. O escore de cálcio coronariano é a ferramenta de desempate mais útil nesta faixa — zero permite adiar a estatina em muitos casos, acima de 100 reforça a indicação.'
              : 'Risco alto: estatina de alta intensidade, mirando redução de 50% ou mais do LDL. Considerar ezetimiba e inibidor de PCSK9 se o alvo não for alcançado.',
        idade < 40 || idade > 79 ? '⚠ **Fora da faixa validada (40 a 79 anos).** O resultado é extrapolação e não deve orientar decisão isoladamente.' : 'Idade dentro da faixa de validação das equações.',
      ],
      alertas: [
        'As equações foram derivadas em coortes americanas das décadas de 1960 a 1990 e superestimam o risco em várias populações contemporâneas, inclusive na brasileira. As diretrizes brasileiras recomendam o Escore de Risco Global adaptado; use este resultado como ponto de partida da conversa, não como veredito.',
        'Risco calculado não se aplica a quem já tem doença aterosclerótica estabelecida, LDL ≥ 190 mg/dL ou diabetes com lesão de órgão-alvo — nesses casos a indicação de estatina independe do escore.',
      ],
    }
  },
  formula: ['Risco = 1 − S₁₀^exp(Σ βᵢxᵢ − média)', 'Coeficientes específicos por sexo e coorte (Goff et al., 2013)'],
  fundamento:
    'As equações do Pooled Cohort agregam cinco coortes populacionais americanas (ARIC, Cardiovascular Health Study, CARDIA, Framingham original e Framingham Offspring) e foram a primeira ferramenta a estimar o risco de um desfecho combinado que inclui AVC, e não apenas eventos coronarianos. Estruturalmente é um modelo de Cox: o somatório dos coeficientes gera um risco relativo, que é aplicado à sobrevida basal da coorte.',
  armadilhas: [
    'A estratificação racial das equações reflete a estrutura das coortes originais, não uma diferença biológica; usá-la mecanicamente em populações miscigenadas, como a brasileira, é problemático. Documente a limitação e priorize a conversa sobre risco global.',
    'Calculadora nenhuma substitui a discussão de risco-benefício com o paciente, que é explicitamente recomendada pelas diretrizes na faixa intermediária.',
  ],
  referencias: [
    { texto: 'Goff DC Jr, Lloyd-Jones DM, Bennett G, et al. 2013 ACC/AHA guideline on the assessment of cardiovascular risk. Circulation. 2014;129(25 Suppl 2):S49-S73.' },
    { texto: 'Grundy SM, Stone NJ, Bailey AL, et al. 2018 AHA/ACC multisociety guideline on the management of blood cholesterol. Circulation. 2019;139(25):e1082-e1143.' },
    { texto: 'Précoma DB, Oliveira GMM, Simão AF, et al. Atualização da Diretriz de Prevenção Cardiovascular da Sociedade Brasileira de Cardiologia. Arq Bras Cardiol. 2019;113(4):787-891.' },
  ],
}

const duke: Ferramenta = {
  id: 'criterios-duke',
  nome: 'Critérios de Duke modificados para endocardite infecciosa',
  sinonimos: ['duke', 'endocardite', 'criterios de duke'],
  resumo: 'Classifica endocardite em definida, possível ou rejeitada pelos critérios maiores e menores.',
  categorias: ['cardiologia', 'infectologia'],
  campos: [
    campoSimNao('hemoculturaTipica', 'Hemoculturas positivas com microrganismo típico em 2 amostras separadas', 1, 'Streptococcus viridans, S. gallolyticus (bovis), grupo HACEK, S. aureus ou Enterococcus adquirido na comunidade sem foco primário.'),
    campoSimNao('hemoculturaPersistente', 'Bacteriemia persistente com microrganismo compatível', 1, 'Duas hemoculturas colhidas com mais de 12 h de intervalo, ou 3 de 3, ou a maioria de 4 ou mais, com pelo menos 1 h entre a primeira e a última.'),
    campoSimNao('coxiella', 'Coxiella burnetii: hemocultura positiva ou IgG de fase I > 1:800', 1),
    campoSimNao('imagem', 'Evidência de acometimento endocárdico em imagem', 1, 'Ecocardiograma com vegetação, abscesso, pseudoaneurisma, fístula, perfuração valvar ou deiscência nova de prótese; ou atividade anormal em PET-CT com FDG ao redor de prótese implantada há mais de 3 meses; ou lesão paravalvar em TC.'),
    campoSimNao('regurgitacao', 'Regurgitação valvar nova', 1),
    campoSimNao('predisposicao', 'Predisposição: cardiopatia predisponente ou uso de droga injetável', 1),
    campoSimNao('febre', 'Febre ≥ 38 °C', 1),
    campoSimNao('vascular', 'Fenômenos vasculares', 1, 'Êmbolo arterial maior, infarto pulmonar séptico, aneurisma micótico, hemorragia intracraniana, hemorragia conjuntival, lesões de Janeway.'),
    campoSimNao('imunologico', 'Fenômenos imunológicos', 1, 'Glomerulonefrite, nódulos de Osler, manchas de Roth, fator reumatoide positivo.'),
    campoSimNao('microbiologico', 'Evidência microbiológica que não preenche critério maior', 1),
  ],
  calcular: (v) => {
    const maiores =
      (sim(v, 'hemoculturaTipica') || sim(v, 'hemoculturaPersistente') || sim(v, 'coxiella') ? 1 : 0) +
      (sim(v, 'imagem') || sim(v, 'regurgitacao') ? 1 : 0)
    const menores = somaSimNao(v, [
      { id: 'predisposicao', pontos: 1 },
      { id: 'febre', pontos: 1 },
      { id: 'vascular', pontos: 1 },
      { id: 'imunologico', pontos: 1 },
      { id: 'microbiologico', pontos: 1 },
    ])
    const definida = maiores === 2 || (maiores === 1 && menores >= 3) || menores >= 5
    const possivel = !definida && ((maiores === 1 && menores >= 1) || menores >= 3)
    return {
      titulo: 'Classificação de Duke',
      valor: definida ? 'Endocardite definida' : possivel ? 'Endocardite possível' : 'Critérios não preenchidos',
      nivel: definida ? 'critico' : possivel ? 'alerta' : 'ok',
      rotuloNivel: `${maiores} critério${maiores !== 1 ? 's' : ''} maior${maiores !== 1 ? 'es' : ''} e ${menores} menor${menores !== 1 ? 'es' : ''}`,
      detalhes: [
        { rotulo: 'Critérios maiores', valor: String(maiores), nota: 'Microbiológico e de imagem/envolvimento endocárdico.' },
        { rotulo: 'Critérios menores', valor: String(menores) },
        { rotulo: 'Regra de definida', valor: '2 maiores, ou 1 maior + 3 menores, ou 5 menores' },
        { rotulo: 'Regra de possível', valor: '1 maior + 1 menor, ou 3 menores' },
      ],
      conduta: [
        '**Endocardite definida** (2 critérios maiores, ou 1 maior + 3 menores, ou 5 menores): inicie antibioticoterapia dirigida após colher pelo menos três pares de hemoculturas, e acione a **equipe multidisciplinar de endocardite** — cardiologia, cirurgia cardíaca e infectologia. A discussão precoce com o cirurgião reduz mortalidade mesmo quando não se opera.',
        '**Endocardite possível** (1 maior + 1 menor, ou 3 menores): não descarte. Repita hemoculturas, solicite **ecocardiograma transesofágico** se o transtorácico foi negativo ou inconclusivo, e considere PET-CT com FDG ou tomografia cardíaca — os critérios de 2023 incorporaram essas imagens justamente para resgatar casos que ficavam indefinidos, especialmente em prótese valvar e dispositivo cardíaco.',
        'Indicações de **cirurgia precoce**: insuficiência cardíaca por disfunção valvar, infecção não controlada (abscesso, fístula, febre persistente após 5–7 dias de antibiótico apropriado) e prevenção de embolia (vegetação > 10 mm com evento embólico prévio, ou > 15 mm em valva nativa). Operar antes da embolia é melhor que operar depois dela.',
        'Hemoculturas **negativas** não excluem: considere *Coxiella burnetii*, *Bartonella*, *Brucella*, grupo HACEK e fungos, e pergunte sobre uso prévio de antibiótico, a causa mais comum de negativação. Sorologias e PCR do material valvar resolvem boa parte desses casos.',
        'Rastreie **focos secundários** sistematicamente: ressonância de crânio (embolia silenciosa muda a conduta cirúrgica e anticoagulante), tomografia de abdome para infartos esplênicos e renais, e avaliação de coluna para espondilodiscite. Encontrar o foco muda a duração do tratamento.',
      ],
      interpretacao: [
        definida
          ? 'Critérios de endocardite **definida**. Antibioticoterapia prolongada guiada por cultura, ecocardiograma transesofágico se ainda não realizado, e avaliação precoce por equipe multidisciplinar de endocardite — a discussão sobre cirurgia deve ser feita nos primeiros dias, não como último recurso.'
          : possivel
            ? 'Endocardite **possível**: mantenha a investigação. Ecocardiograma transesofágico, hemoculturas seriadas antes do antibiótico e imagem avançada (PET-CT com FDG, angiotomografia cardíaca) frequentemente resolvem a dúvida.'
            : 'Critérios insuficientes. Considere diagnóstico alternativo, mas reavalie se a suspeita clínica for forte — a sensibilidade dos critérios cai em endocardite de prótese, em endocardite com hemocultura negativa e em dispositivos cardíacos implantáveis.',
        'A atualização Duke-ISCVID de 2023 ampliou os critérios maiores para incorporar PET-CT com FDG, tomografia cardíaca e novos microrganismos, e reconheceu explicitamente endocardite associada a dispositivos intracardíacos — mudanças pensadas justamente para os cenários em que o Duke de 2000 falhava.',
      ],
      alertas: ['Colha hemoculturas antes do antibiótico. Uma única dose prévia reduz drasticamente o rendimento e transforma um caso diagnosticável numa endocardite com cultura negativa.'],
    }
  },
  formula: ['Definida: 2 maiores | 1 maior + 3 menores | 5 menores', 'Possível: 1 maior + 1 menor | 3 menores'],
  fundamento:
    'Os critérios de Duke substituíram os de von Reyn em 1994 ao incorporar o ecocardiograma e ao reconhecer o uso de droga injetável como fator predisponente. A estrutura de maiores e menores traduz uma hierarquia de evidência: microbiologia compatível e demonstração de acometimento endocárdico são quase suficientes sozinhas; os menores só bastam quando se acumulam. A revisão de 2000 refinou a definição de bacteriemia persistente e removeu a categoria de ecocardiograma "não diagnóstico".',
  armadilhas: [
    'A sensibilidade é limitada em endocardite de prótese valvar e em infecção de dispositivo — nesses casos o Duke clássico perde cerca de 25% dos casos, e a imagem avançada é indispensável.',
    'Os critérios são de classificação, desenhados para pesquisa clínica. Endocardite tratada com base em suspeita clínica forte e Duke "possível" é situação comum e legítima.',
  ],
  referencias: [
    { texto: 'Li JS, Sexton DJ, Mick N, et al. Proposed modifications to the Duke criteria for the diagnosis of infective endocarditis. Clin Infect Dis. 2000;30(4):633-638.' },
    { texto: 'Fowler VG, Durack DT, Selton-Suty C, et al. The 2023 Duke-ISCVID criteria for infective endocarditis. Clin Infect Dis. 2023;77(4):518-526.' },
  ],
}

const sanFrancisco: Ferramenta = {
  id: 'san-francisco-sincope',
  nome: 'Regra de síncope de San Francisco',
  sinonimos: ['sincope', 'san francisco', 'chess', 'desmaio'],
  resumo: 'Cinco variáveis (CHESS) que identificam a síncope de alto risco na emergência.',
  categorias: ['cardiologia', 'emergencia'],
  campos: [
    campoSimNao('c', 'História de insuficiência cardíaca congestiva', 1, 'Diagnóstico prévio, independentemente de estar compensada. Marca cardiopatia estrutural, que é o substrato de arritmia ventricular e de obstrução ao fluxo — os dois mecanismos de síncope com risco de morte.'),
    campoSimNao('h', 'Hematócrito < 30%', 1, 'Único item laboratorial. Aponta perda sanguínea oculta (hemorragia digestiva, aneurisma em expansão, gravidez ectópica) ou anemia que reduz o conteúdo arterial de oxigênio e a reserva para tolerar hipotensão transitória.'),
    campoSimNao('e', 'ECG anormal', 1, 'Ritmo não sinusal, qualquer alteração nova, ou mudança em relação a traçado prévio. É o item de definição mais ampla e de maior variabilidade entre serviços — na dúvida, considere anormal, que é o comportamento seguro.'),
    campoSimNao('s', 'Queixa de dispneia', 1, 'O S de shortness of breath. Aponta doença cardiopulmonar aguda: embolia pulmonar, insuficiência cardíaca descompensada, síndrome coronariana, anemia grave.'),
    campoSimNao('s2', 'Pressão sistólica < 90 mmHg na triagem', 1, 'Aferida na triagem, não a menor de todo o atendimento. Hipotensão persistente após a síncope não é achado residual: indica causa ainda ativa — hemorragia, sepse, embolia, arritmia ou obstrução.'),
  ],
  calcular: (v) => {
    const positivos = ['c', 'h', 'e', 's', 's2'].filter((id) => sim(v, id))
    const alto = positivos.length > 0
    return {
      titulo: 'Regra de San Francisco (CHESS)',
      valor: alto ? 'Alto risco' : 'Baixo risco',
      nivel: alto ? 'alerta' : 'ok',
      rotuloNivel: `${positivos.length} de 5 critérios presentes`,
      detalhes: [
        { rotulo: 'Regra', valor: 'Qualquer critério positivo = alto risco' },
        { rotulo: 'Sensibilidade / especificidade na derivação', valor: '96% / 62%' },
      ],
      interpretacao: [
        alto
          ? 'Pelo menos um critério positivo: risco elevado de desfecho grave em 7 dias (morte, infarto, arritmia, embolia pulmonar, AVC, hemorragia significativa ou retorno à emergência com internação). Indicação de observação e investigação.'
          : 'Nenhum critério positivo: risco baixo de evento grave em 7 dias. Alta com orientação e seguimento é razoável, desde que a história não sugira síncope de esforço, síncope em decúbito, palpitações precedentes ou história familiar de morte súbita — situações que exigem investigação independentemente da regra.',
        'A regra teve validações externas com sensibilidade menor do que a original (74 a 90% em algumas coortes), o que motivou alternativas como o Canadian Syncope Risk Score, mais recente e com melhor calibração. Use-a como apoio, nunca como autorização automática de alta.',
        'Síncope de alto risco tem marcadores que a regra não captura e que devem ser buscados ativamente: síncope durante esforço, sem pródromos, em posição supina, com trauma facial, ou com ECG mostrando Brugada, QT longo, pré-excitação, hipertrofia ou bloqueio bifascicular.',
        'Toda síncope é, por definição, **hipoperfusão cerebral global e transitória** — o cérebro não estoca substrato e perde a consciência após cerca de 6 a 8 segundos de interrupção do fluxo, ou com queda da pressão sistólica abaixo de aproximadamente 60 mmHg. O que separa a síncope banal da letal não é o sintoma, é o mecanismo pelo qual o fluxo caiu, e existem três. O primeiro é **reflexo** (vasovagal, situacional, seno carotídeo): um reflexo de Bezold-Jarisch exagerado, disparado por mecanorreceptores ventriculares em um ventrículo subitamente subpreenchido, produz retirada simpática abrupta com vasodilatação e bradicardia. É benigno e tem pródromos característicos — calor, náusea, sudorese, visão turva, palidez — porque a queda de pressão é progressiva. O segundo é **hipotensão ortostática**, por depleção de volume, disautonomia ou fármaco, e o risco é o da causa de base. O terceiro é **cardíaco**, e é o que mata: arritmia (taquicardia ventricular, bloqueio atrioventricular completo, pausa sinusal, torsades de pointes) ou obstrução mecânica ao fluxo (estenose aórtica, cardiomiopatia hipertrófica obstrutiva, embolia pulmonar maciça, tamponamento, mixoma). A síncope cardíaca tipicamente não tem pródromo, porque a queda de débito é instantânea — daí o trauma facial, que é um marcador de gravidade e não apenas de azar. A regra CHESS é, portanto, uma tentativa de detectar indiretamente o terceiro mecanismo: insuficiência cardíaca e ECG anormal apontam o substrato estrutural de arritmia, hematócrito baixo e hipotensão apontam perda sanguínea ativa, e dispneia aponta doença cardiopulmonar aguda. Ela não contém nenhuma variável de **circunstância** da síncope, e é exatamente por isso que esforço, decúbito, ausência de pródromo, palpitação precedente e história familiar de morte súbita precisam ser buscados fora dela.',
      ],
      conduta: alto
        ? [
            'Pelo menos um critério positivo: **observação e investigação**, não alta. Monitorize o ritmo, repita o eletrocardiograma e reavalie após hidratação e correção do que for corrigível.',
            'Direcione a investigação ao critério que puxou o resultado. Hematócrito baixo: procure sangramento ativo — toque retal, pesquisa de sangue oculto, avaliação de aneurisma de aorta e, em mulher em idade fértil, beta-hCG e ultrassom para gravidez ectópica. Dispneia: considere embolia pulmonar (aplique Wells ou Genebra), insuficiência cardíaca e síndrome coronariana. ECG anormal ou insuficiência cardíaca: ecocardiograma e monitorização prolongada.',
            'Colha troponina e faça ecocardiograma se houver suspeita de cardiopatia estrutural ou isquemia. Monitorização prolongada (telemetria, Holter, monitor de eventos ou, em casos selecionados, monitor implantável) é o que rende diagnóstico quando a arritmia é paroxística e o traçado da porta é normal.',
            'Suspenda ou reduza fármacos que contribuem: anti-hipertensivo, diurético, nitrato, alfabloqueador, antidepressivo tricíclico, e qualquer medicamento que prolongue o QT — aplique o escore de Tisdale se houver vários.',
            'Se houver evidência de arritmia como causa, trate conforme o mecanismo: marcapasso na bradiarritmia sintomática sem causa reversível, e avaliação eletrofisiológica com eventual cardiodesfibrilador implantável na taquicardia ventricular com cardiopatia estrutural.',
          ]
        : [
            'Nenhum critério positivo indica risco baixo de evento grave em 7 dias, e **permite** considerar alta com orientação e seguimento — não a determina. Antes de liberar, exclua ativamente o que a regra não vê.',
            'Investigue independentemente da regra se houver qualquer um destes: síncope **durante esforço** (estenose aórtica, cardiomiopatia hipertrófica, taquicardia ventricular catecolaminérgica), síncope em **decúbito**, **ausência de pródromos**, **palpitação** precedendo o evento, trauma facial ou craniano por queda sem proteção, episódios recorrentes recentes, ou **história familiar de morte súbita** antes dos 50 anos.',
            'Releia o eletrocardiograma procurando especificamente os padrões que a leitura rápida perde: Brugada tipo 1, QT longo ou curto, pré-excitação, onda épsilon ou T invertida em precordiais direitas (displasia arritmogênica), hipertrofia ventricular, bloqueio bifascicular e onda Q de infarto prévio.',
            'Meça a **pressão em ortostase** — deitado e após 1 e 3 minutos em pé — e revise a prescrição: hipotensão ortostática por fármaco é causa comum, subdiagnosticada e imediatamente corrigível.',
            'Oriente o paciente e a família por escrito: manobras de contrapressão física (cruzar as pernas, contrair as mãos e os braços) ao primeiro pródromo, hidratação e sal se não houver contraindicação, evitar gatilhos, deitar-se imediatamente ao sentir sintoma, e proibição temporária de direção conforme a regulamentação local. Defina retorno e sinais de alarme.',
          ],
      alertas: [
        'Validações externas encontraram sensibilidade de apenas 74 a 90%, bem abaixo dos 96% da derivação. A regra é apoio à decisão e nunca autorização automática de alta — o Canadian Syncope Risk Score tem calibração melhor e é alternativa preferível onde disponível.',
        'A regra **não contém nenhuma variável de circunstância** da síncope. Esforço, decúbito, ausência de pródromo, palpitação precedente e história familiar de morte súbita são marcadores de alto risco que precisam ser buscados fora dela.',
        'Não se aplica a perda de consciência com causa já estabelecida — convulsão, hipoglicemia, trauma craniano, intoxicação — nem a quase-síncope isolada, para a qual não foi derivada.',
        'A definição de "ECG anormal" é ampla e pouco padronizada, e é a maior fonte de variabilidade entre serviços. Na dúvida, classifique como anormal.',
        'Síncope em idoso raramente tem causa única: desidratação, fármaco, disautonomia e cardiopatia frequentemente coexistem, e tratar apenas um componente não previne a recorrência.',
      ],
      tabela: {
        titulo: 'CHESS: o que cada item rastreia',
        colunas: ['Letra', 'Critério', 'Mecanismo perigoso que sugere'],
        linhas: [
          ['C', 'Insuficiência cardíaca congestiva', 'Cardiopatia estrutural: arritmia ou obstrução'],
          ['H', 'Hematócrito < 30%', 'Perda sanguínea oculta ou reserva reduzida'],
          ['E', 'ECG anormal', 'Substrato arritmogênico ou isquemia'],
          ['S', 'Dispneia (shortness of breath)', 'Doença cardiopulmonar aguda: embolia, IC, SCA'],
          ['S', 'Sistólica < 90 mmHg na triagem', 'Causa ainda ativa: hemorragia, sepse, arritmia'],
        ],
        destaque: positivos.length > 0 ? 0 : undefined,
      },
    }
  },
  formula: ['CHESS: CHF, Hematócrito < 30%, ECG anormal, Shortness of breath, Sistólica < 90 mmHg'],
  fundamento:
    'A regra parte do princípio de que a síncope em si raramente é o problema — o problema é a doença que a causou. As cinco variáveis funcionam como marcadores de três mecanismos perigosos: cardiopatia estrutural (insuficiência cardíaca, ECG anormal), perda sanguínea oculta (hematócrito baixo, hipotensão) e doença cardiopulmonar aguda (dispneia). Para entender por que essa estratégia é insuficiente, é preciso ver a fisiopatologia completa. Síncope é hipoperfusão cerebral global transitória: a consciência se perde após cerca de 6 a 8 segundos de interrupção do fluxo, ou quando a pressão sistólica cai abaixo de aproximadamente 60 mmHg. Os mecanismos são três, com prognósticos radicalmente diferentes. O **reflexo** (vasovagal, situacional, do seno carotídeo) resulta de um reflexo de Bezold-Jarisch exagerado, disparado por mecanorreceptores de um ventrículo subitamente subpreenchido, que provoca retirada simpática com vasodilatação e bradicardia — é benigno e cursa com pródromos (calor, náusea, sudorese, palidez, visão turva) justamente porque a queda de pressão é progressiva. A **hipotensão ortostática** decorre de depleção de volume, disautonomia ou fármaco, e seu risco é o da causa. A **cardíaca** é a que mata, por arritmia (taquicardia ventricular, bloqueio atrioventricular completo, pausa sinusal, torsades) ou por obstrução mecânica (estenose aórtica, cardiomiopatia hipertrófica obstrutiva, embolia maciça, tamponamento, mixoma); tipicamente não tem pródromo, porque a queda de débito é instantânea, e daí o trauma facial ser marcador de gravidade. A regra CHESS tenta detectar indiretamente esse terceiro grupo por meio de substrato e de repercussão, mas não inclui uma única variável de **circunstância** do episódio. Essa omissão é a origem tanto de sua praticidade — todos os itens são objetivos e disponíveis na primeira hora — quanto de sua limitação, confirmada nas validações externas em que a sensibilidade caiu de 96% para 74 a 90%. Foi essa queda que motivou escores posteriores, notadamente o Canadian Syncope Risk Score, que incorpora predisposição a síncope vasovagal, cardiopatia, pressão arterial, troponina, eixo do QRS, intervalo QT corrigido e o diagnóstico presumido na emergência, obtendo calibração melhor.',
  armadilhas: [
    'A definição de "ECG anormal" é ampla e pouco padronizada, e é onde a variabilidade entre serviços é maior.',
    'A regra não se aplica a perda de consciência com causa já estabelecida (convulsão, hipoglicemia, trauma craniano, intoxicação).',
    'Sensibilidade nas validações externas foi de 74 a 90%, não os 96% da derivação. Tratar resultado negativo como autorização de alta já produziu eventos evitáveis.',
    'Nenhum item cobre circunstância da síncope. Esforço, decúbito, ausência de pródromo, palpitação e história familiar de morte súbita ficam invisíveis ao escore.',
    'Hematócrito normal na primeira coleta não exclui hemorragia aguda: a hemodiluição leva horas, e um sangramento ativo recente pode cursar com hematócrito ainda preservado.',
    'Não distingue síncope de crise epiléptica. Mordedura lateral de língua, movimentos clônicos prolongados, confusão pós-ictal longa e incontinência apontam crise e mudam completamente a investigação.',
    'Em idoso, a hipotensão ortostática por fármaco é causa frequente e não pontua no escore. Medir pressão deitado e em pé, aos 1 e 3 minutos, rende mais que qualquer exame complementar nessa população.',
  ],
  referencias: [
    { texto: 'Quinn JV, Stiell IG, McDermott DA, et al. Derivation of the San Francisco Syncope Rule to predict patients with short-term serious outcomes. Ann Emerg Med. 2004;43(2):224-232.' },
    { texto: 'Thiruganasambandamoorthy V, Kwong K, Wells GA, et al. Development of the Canadian Syncope Risk Score. CMAJ. 2016;188(12):E289-E298.' },
  ],
}

const ldl: Ferramenta = {
  id: 'ldl-calculado',
  nome: 'LDL calculado: Friedewald, Martin-Hopkins e Sampson',
  sinonimos: ['ldl', 'friedewald', 'martin hopkins', 'colesterol ldl', 'sampson'],
  resumo: 'Três equações de LDL lado a lado, com os limites de validade de cada uma.',
  categorias: ['cardiologia', 'endocrinologia'],
  campos: [
    campoNum('ct', 'Colesterol total', { ajuda: 'Colesterol total do mesmo painel lipídico — as três fórmulas exigem que os três valores venham da mesma amostra.', unidade: 'mg/dL', min: 60, max: 600, passo: 1 }),
    campoNum('hdl', 'HDL-colesterol', { ajuda: 'HDL do mesmo painel. Jejum de 12 horas não é mais obrigatório, exceto quando os triglicerídeos passam de 400 mg/dL.', unidade: 'mg/dL', min: 10, max: 150, passo: 1 }),
    campoNum('tg', 'Triglicerídeos', { ajuda: 'É o valor que decide qual fórmula vale: acima de 400 mg/dL nenhuma delas é confiável, e o LDL precisa ser direto ou substituído pelo não-HDL.', unidade: 'mg/dL', min: 20, max: 2000, passo: 1 }),
  ],
  calcular: (v) => {
    const ct = num(v, 'ct')
    const hdl = num(v, 'hdl')
    const tg = num(v, 'tg')
    if (ct === null || hdl === null || tg === null) return null
    const naoHdl = ct - hdl
    const friedewald = tg <= 400 ? ct - hdl - tg / 5 : null
    // Sampson-NIH (2020): equação de segunda ordem, válida até TG de 800 mg/dL.
    const sampson = ct / 0.948 - hdl / 0.971 - (tg / 8.56 + (tg * naoHdl) / 2140 - (tg * tg) / 16100) - 9.44
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Colesterol não-HDL', valor: `${fmtInt(naoHdl)} mg/dL`, nota: 'Não depende de equação nenhuma e não exige jejum. Alvo = alvo de LDL + 30 mg/dL.' },
      {
        rotulo: 'Friedewald',
        valor: friedewald === null ? 'não aplicável' : `${fmtInt(friedewald)} mg/dL`,
        nota: friedewald === null ? 'Inválida com triglicerídeos acima de 400 mg/dL.' : 'CT − HDL − TG/5. Subestima o LDL quando os triglicerídeos estão altos ou o LDL está baixo.',
        nivel: friedewald === null ? 'alerta' : 'neutro',
      },
      { rotulo: 'Sampson-NIH', valor: `${fmtInt(sampson)} mg/dL`, nota: 'Equação de 2020, derivada contra ultracentrifugação; válida até triglicerídeos de 800 mg/dL e superior a Friedewald na faixa de LDL baixo.' },
    ]
    const alvo = friedewald ?? sampson
    const nivel: Nivel = alvo >= 190 ? 'critico' : alvo >= 160 ? 'alerta' : alvo >= 130 ? 'atencao' : 'ok'
    return {
      titulo: 'LDL-colesterol',
      valor: fmtInt(alvo),
      unidade: 'mg/dL',
      nivel,
      rotuloNivel: alvo >= 190 ? 'Muito elevado — investigar hipercolesterolemia familiar' : alvo >= 160 ? 'Elevado' : alvo >= 130 ? 'Limítrofe' : 'Desejável',
      detalhes,
      conduta: [
        'Com triglicerídeos **< 400 mg/dL e LDL ≥ 70 mg/dL**, as três fórmulas concordam e qualquer uma serve. A decisão terapêutica pode ser tomada com o valor calculado, sem custo adicional.',
        'Com triglicerídeos **150–400 mg/dL** ou LDL calculado **< 70 mg/dL**, prefira **Martin-Hopkins ou Sampson**: Friedewald subestima sistematicamente o LDL nessa faixa e classifica erroneamente como \'na meta\' pacientes que ainda precisam de intensificação. Essa subestimação é justamente maior nos pacientes de maior risco.',
        'Com triglicerídeos **> 400 mg/dL**, nenhuma fórmula é confiável. Solicite **LDL direto** ou, melhor, use o **colesterol não-HDL** (colesterol total − HDL), cuja meta é o LDL desejado + 30 mg/dL e que não depende de triglicerídeos.',
        'Meça a **apolipoproteína B** quando houver triglicerídeos altos, diabetes, síndrome metabólica ou LDL discordante do quadro clínico: ela conta partículas aterogênicas diretamente e prediz risco melhor que o LDL nessas situações. Lipoproteína(a) deve ser dosada ao menos uma vez na vida, sobretudo com história familiar precoce.',
        'Metas por risco: **< 100 mg/dL** em risco intermediário, **< 70 mg/dL** em alto risco, **< 55 mg/dL** em muito alto risco (e < 40 mg/dL em eventos recorrentes). Se a meta não for atingida com estatina de alta intensidade na dose máxima tolerada, associe ezetimiba e, persistindo a lacuna, inibidor de PCSK9 ou ácido bempedoico.',
      ],
      interpretacao: [
        'Friedewald assume que a razão entre triglicerídeos e colesterol de VLDL é fixa em 5:1. Essa premissa é razoável em jejum, com triglicerídeos normais e LDL acima de 100 — e falha nos três cenários opostos. O erro é sistemático e no sentido perigoso: **subestima** o LDL, e portanto subtrata justamente quem tem triglicerídeos altos e LDL baixo, o perfil do diabético e do paciente já em estatina de alta intensidade.',
        'Martin-Hopkins substitui o divisor fixo por um fator ajustável, escolhido numa tabela de 180 células segundo o triglicerídeo e o colesterol não-HDL — o fator varia de cerca de 3,1 a 11,9. É a equação recomendada pelas diretrizes americanas de 2018 quando o LDL calculado é inferior a 70 mg/dL.',
        'Sampson-NIH resolve o mesmo problema com uma equação fechada de segunda ordem, sem tabela, e estende a validade até 800 mg/dL de triglicerídeos. É por isso que está implementada aqui de forma exata.',
        'Sempre que a equação for duvidosa (triglicerídeos acima de 400, LDL calculado abaixo de 70, síndrome nefrótica, disbetalipoproteinemia), a saída correta é usar o **colesterol não-HDL** ou dosar a apolipoproteína B — nenhum dos dois depende de estimativa.',
      ],
      alertas: [
        'Martin-Hopkins depende da tabela oficial de 180 fatores e não pode ser reproduzida com fidelidade fora dela; por isso esta ferramenta apresenta Friedewald e Sampson-NIH calculados, e recomenda a calculadora oficial da Johns Hopkins quando o valor de Martin-Hopkins for necessário para decisão.',
        tg > 400 ? 'Triglicerídeos acima de 400 mg/dL: Friedewald é inválida. Use Sampson, não-HDL ou apoB.' : '',
      ].filter(Boolean),
    }
  },
  formula: [
    'Friedewald: LDL = CT − HDL − TG/5      (válida com TG ≤ 400)',
    'Sampson-NIH: LDL = CT/0,948 − HDL/0,971 − [TG/8,56 + (TG × nãoHDL)/2140 − TG²/16100] − 9,44',
    'Não-HDL = CT − HDL',
  ],
  fundamento:
    'O LDL raramente é medido — é calculado, porque a dosagem direta por ultracentrifugação é cara e demorada. Toda equação de LDL tem o mesmo problema: estimar quanto colesterol está no VLDL para subtraí-lo. Friedewald resolveu com uma razão fixa em 1972; Martin-Hopkins e Sampson resolveram com fatores que variam conforme o perfil lipídico, o que os torna mais precisos precisamente onde Friedewald erra mais.',
  armadilhas: [
    'Jejum não é mais exigido rotineiramente para perfil lipídico; quando os triglicerídeos pós-prandiais passam de 400 mg/dL, repita em jejum.',
    'LDL calculado abaixo de 70 mg/dL por Friedewald tem erro relevante — nessa faixa, use Martin-Hopkins ou Sampson antes de concluir que a meta foi atingida.',
  ],
  referencias: [
    { texto: 'Friedewald WT, Levy RI, Fredrickson DS. Estimation of the concentration of low-density lipoprotein cholesterol in plasma, without use of the preparative ultracentrifuge. Clin Chem. 1972;18(6):499-502.' },
    { texto: 'Martin SS, Blaha MJ, Elshazly MB, et al. Comparison of a novel method vs the Friedewald equation for estimating low-density lipoprotein cholesterol levels. JAMA. 2013;310(19):2061-2068.' },
    { texto: 'Sampson M, Ling C, Sun Q, et al. A new equation for calculation of low-density lipoprotein cholesterol in patients with normolipidemia and/or hypertriglyceridemia. JAMA Cardiol. 2020;5(5):540-548.' },
  ],
}

/* ═══════════════════ Killip-Kimball e classificação de Forrester ═══════════════════ */

const killipCampos: Campo[] = [
  campoOpc('killip', 'Classe de Killip-Kimball', [
    { valor: '1', rotulo: 'I — Sem sinais de congestão: ausculta pulmonar limpa, sem B3', pontos: 1 },
    { valor: '2', rotulo: 'II — Estertores em até metade dos campos pulmonares, B3 ou turgência jugular', pontos: 2 },
    { valor: '3', rotulo: 'III — Edema agudo de pulmão: estertores em mais da metade dos campos', pontos: 3 },
    { valor: '4', rotulo: 'IV — Choque cardiogênico: hipotensão com hipoperfusão periférica', pontos: 4 },
  ], { padrao: '1', ajuda: 'Classifique pelo **exame físico na admissão**, antes de diurético e de suporte ventilatório. A classe registrada depois do tratamento não é a classe de Killip e não carrega o mesmo prognóstico.' }),
  campoSimNao('reperfusao', 'Reperfusão realizada (angioplastia primária ou trombólise)', 0, 'A mortalidade por classe caiu substancialmente na era da reperfusão: as taxas originais de 1967 são cerca de três vezes maiores que as atuais em serviços com angioplastia primária disponível.'),
  campoNum('pas', 'Pressão arterial sistólica', { unidade: 'mmHg', min: 40, max: 250, passo: 1, opcional: true, ajuda: 'Sistólica abaixo de 90 mmHg com sinais de hipoperfusão, por mais de 30 minutos e sem hipovolemia, define choque cardiogênico independentemente da ausculta.' }),
]

const killip: Ferramenta = {
  id: 'killip-kimball',
  nome: 'Classificação de Killip-Kimball no infarto',
  sinonimos: ['killip', 'killip kimball', 'iam congestao', 'choque cardiogenico', 'forrester'],
  resumo: 'Gradua a congestão e a hipoperfusão no infarto pelo exame físico da admissão, e estima a mortalidade por classe.',
  categorias: ['cardiologia', 'emergencia'],
  campos: killipCampos,
  calcular: (v) => {
    const classe = ptsOpc(killipCampos, v, 'killip')
    if (classe === null) return null
    const reperfusao = sim(v, 'reperfusao')
    const pas = num(v, 'pas')

    // Mortalidade hospitalar: série original de 1967 e era contemporânea.
    const original = [6, 17, 38, 81][classe - 1]
    const atual = [2, 8, 18, 45][classe - 1]
    const estimada = reperfusao ? atual : Math.round((original + atual) / 2)

    const nivel: Nivel = classe >= 4 ? 'critico' : classe === 3 ? 'critico' : classe === 2 ? 'alerta' : 'ok'
    const rotulos = ['Sem congestão', 'Congestão leve a moderada', 'Edema agudo de pulmão', 'Choque cardiogênico']

    const conduta: string[] = []
    conduta.push(
      '**Reperfusão é a prioridade em qualquer classe de Killip** no infarto com supra de ST: angioplastia primária em até 90 minutos do primeiro contato médico (120 minutos se houver transferência), ou trombólise em até 30 minutos quando a angioplastia não for alcançável no prazo. Quanto pior a classe, maior o benefício absoluto da reperfusão.',
    )
    if (classe === 1) {
      conduta.push('**Killip I:** mantenha monitorização e a terapia antitrombótica e anti-isquêmica plena. Inicie betabloqueador nas primeiras 24 h se não houver contraindicação, e IECA ou BRA, sobretudo com disfunção ventricular, diabetes ou infarto anterior.')
    } else if (classe === 2) {
      conduta.push('**Killip II:** acrescente diurético de alça e vasodilatador conforme a pressão, mantenha oxigênio apenas se a saturação estiver abaixo de 90%, e solicite ecocardiograma para avaliar função ventricular e complicações mecânicas. **Betabloqueador intravenoso está contraindicado** na presença de congestão.')
    } else if (classe === 3) {
      conduta.push('**Killip III (edema agudo):** ventilação não invasiva com pressão positiva, que reduz intubação e mortalidade; nitrato intravenoso se a sistólica permitir; diurético de alça; e reperfusão imediata. Evite volume e betabloqueador.')
    } else {
      conduta.push('**Killip IV (choque cardiogênico):** a mortalidade permanece alta mesmo hoje. Reperfusão imediata da artéria culpada — e **apenas dela**, porque o ensaio CULPRIT-SHOCK mostrou mortalidade maior com revascularização de múltiplos vasos no mesmo tempo. Suporte com noradrenalina como vasopressor de escolha e dobutamina como inotrópico, considerando dispositivo de assistência circulatória em centro habilitado.')
    }
    conduta.push(
      'Busque ativamente as **complicações mecânicas** quando a classe piora de forma abrupta: ruptura de músculo papilar com insuficiência mitral aguda, comunicação interventricular e ruptura de parede livre com tamponamento. Todas aparecem entre o 2º e o 7º dia, todas têm sopro novo ou deterioração súbita, e todas são cirúrgicas — o ecocardiograma à beira do leito é o exame que as separa.',
      'Reavalie a classe ao longo da internação. O Killip é da **admissão** por definição, mas a piora da congestão depois dela é sinal de infarto extenso, de complicação mecânica ou de sobrecarga iatrogênica de volume.',
      'Antes da alta, garanta a **terapia de quatro pilares** quando houver disfunção ventricular: IECA ou BRA (ou sacubitril-valsartana), betabloqueador, antagonista mineralocorticoide e inibidor de SGLT2, somados a estatina de alta intensidade e antiagregação dupla pelo tempo indicado.',
    )

    return {
      titulo: 'Killip-Kimball',
      valor: ['I', 'II', 'III', 'IV'][classe - 1],
      unidade: `classe · ${rotulos[classe - 1]}`,
      nivel,
      rotuloNivel: `Mortalidade hospitalar estimada de ${estimada}%`,
      detalhes: [
        { rotulo: 'Classe', valor: `${['I', 'II', 'III', 'IV'][classe - 1]} — ${rotulos[classe - 1]}` },
        { rotulo: 'Mortalidade na série de 1967', valor: `${original}%`, nota: 'Antes da reperfusão' },
        { rotulo: 'Mortalidade contemporânea', valor: `${atual}%`, nota: 'Com angioplastia primária disponível' },
        { rotulo: 'Reperfusão realizada', valor: reperfusao ? 'Sim' : 'Não', nivel: (reperfusao ? 'ok' : 'alerta') as Nivel },
        ...(pas !== null ? [{ rotulo: 'Sistólica', valor: `${fmtInt(pas)} mmHg`, nivel: (pas < 90 ? 'critico' : 'ok') as Nivel }] : []),
      ],
      interpretacao: [
        `**Classe ${['I', 'II', 'III', 'IV'][classe - 1]} — ${rotulos[classe - 1].toLowerCase()}.** A série original de Killip e Kimball, de 1967, encontrou mortalidade hospitalar de 6%, 17%, 38% e 81% nas classes I a IV. Na era da reperfusão, esses números caíram para aproximadamente 2%, 8%, 18% e 45%.`,
        'A classificação é feita **exclusivamente pelo exame físico** — ausculta pulmonar, terceira bulha, turgência jugular e sinais de hipoperfusão — e é justamente essa simplicidade que a manteve em uso por quase sessenta anos, inclusive como variável do escore GRACE.',
        pas !== null && pas < 90
          ? '**Sistólica abaixo de 90 mmHg.** Com sinais de hipoperfusão (extremidades frias, oligúria, confusão, lactato elevado) por mais de 30 minutos e sem hipovolemia, o quadro é de choque cardiogênico — classe IV — independentemente do que a ausculta mostre.'
          : 'A classificação de Killip não depende da pressão arterial exceto na classe IV, em que a hipotensão com hipoperfusão é o critério definidor.',
        'A classificação **hemodinâmica de Forrester** é o equivalente invasivo, cruzando índice cardíaco com pressão capilar pulmonar em quatro quadrantes: quente e seco, quente e úmido, frio e seco, frio e úmido. O Killip é a leitura clínica dos mesmos quadrantes, feita sem cateter.',
      ],
      conduta,
      alertas: [
        '**Classifique pela admissão.** A classe atribuída após diurético, ventilação não invasiva ou reperfusão não carrega o prognóstico descrito e não é comparável às séries publicadas.',
        'Piora abrupta da classe entre o 2º e o 7º dia exige **ecocardiograma imediato** para afastar complicação mecânica — ruptura de músculo papilar, comunicação interventricular ou ruptura de parede livre. Todas são cirúrgicas e a janela é curta.',
        'Em Killip IV, revascularize **apenas a artéria culpada** no procedimento inicial: o CULPRIT-SHOCK mostrou mortalidade maior com abordagem de múltiplos vasos no mesmo tempo.',
      ],
    }
  },
  formula: ['Classe I a IV pelo exame físico na admissão', 'Mortalidade hospitalar original (1967): 6% · 17% · 38% · 81%'],
  fundamento:
    'As quatro classes de Killip correspondem a estágios sucessivos da mesma cascata: a perda de massa contrátil no infarto reduz o volume sistólico, e o ventrículo esquerdo responde subindo a pressão diastólica final para recrutar pré-carga pelo mecanismo de Frank-Starling. Essa pressão se transmite retrogradamente ao átrio esquerdo e ao capilar pulmonar, e quando ultrapassa a pressão oncótica plasmática — em torno de 18 a 20 mmHg —, o líquido extravasa para o interstício, produzindo os estertores da classe II; acima de 25 a 30 mmHg, inunda o alvéolo e produz o edema agudo da classe III. Quando a perda de massa passa de aproximadamente 40% do ventrículo esquerdo, o débito cai a ponto de não sustentar a perfusão tecidual, e instala-se o choque da classe IV. A escala é portanto uma leitura clínica direta da pressão de enchimento e do débito — os dois eixos que Forrester mediria com cateter de artéria pulmonar alguns anos depois. Killip e Kimball descreveram a classificação em 1967 ao relatar a experiência de uma das primeiras unidades coronarianas do mundo, e o próprio artigo já mostrava que a monitorização sistemática reduzia mortalidade por permitir tratar arritmias antes que matassem.',
  armadilhas: [
    'Estertores por doença pulmonar crônica, fibrose ou pneumonia são confundidos com congestão e inflam a classe.',
    'A hipotensão do infarto de ventrículo direito — que cursa com pulmões limpos, turgência jugular e hipotensão — não é classe IV verdadeira: o tratamento é volume, e diurético ou nitrato podem ser catastróficos nesse cenário.',
    'A classe foi derivada em infarto com supra de ST; seu valor prognóstico em síndromes sem supra é menor.',
    'A mortalidade por classe citada na literatura clássica é pré-reperfusão e superestima muito o prognóstico atual em serviços com angioplastia primária.',
  ],
  referencias: [
    { texto: 'Killip T 3rd, Kimball JT. Treatment of myocardial infarction in a coronary care unit. A two year experience with 250 patients. Am J Cardiol. 1967;20(4):457-464.' },
    { texto: 'Thiele H, Akin I, Sandri M, et al. PCI strategies in patients with acute myocardial infarction and cardiogenic shock (CULPRIT-SHOCK). N Engl J Med. 2017;377(25):2419-2432.' },
    { texto: 'Byrne RA, Rossello X, Coughlan JJ, et al. 2023 ESC Guidelines for the management of acute coronary syndromes. Eur Heart J. 2023;44(38):3720-3826.' },
  ],
}

/* ═══════════════ Critérios de Sgarbossa e Sgarbossa modificado ═══════════════ */

const sgarbossa: Ferramenta = {
  id: 'sgarbossa',
  nome: 'Critérios de Sgarbossa e Sgarbossa modificado (Smith)',
  sinonimos: ['sgarbossa', 'smith sgarbossa', 'iam bloqueio de ramo', 'bre iam', 'marcapasso infarto'],
  resumo: 'Identifica infarto com supra de ST na vigência de bloqueio de ramo esquerdo ou ritmo de marcapasso, em que o supra habitual não pode ser lido.',
  categorias: ['cardiologia', 'emergencia'],
  campos: [
    campoSeg('versao', 'Versão', [
      { valor: 'original', rotulo: 'Sgarbossa original (pontos)' },
      { valor: 'smith', rotulo: 'Sgarbossa modificado (proporção)' },
    ], { ajuda: 'A versão modificada de Smith troca o terceiro critério — supra discordante ≥ 5 mm — por uma **proporção**: supra dividido pela profundidade da onda S ≤ −0,25. Ela é bem mais sensível, porque o supra discordante esperado é proporcional à amplitude do QRS, e o critério fixo de 5 mm perde infartos em QRS de baixa voltagem.' }),
    campoSimNao('concordanteSupra', 'Supra de ST ≥ 1 mm **concordante** com o QRS (mesma direção)', 5, 'Este é o critério mais específico de todos, com especificidade próxima de 98%: na repolarização normal do bloqueio de ramo esquerdo, o ST é sempre **discordante** do QRS, ou seja, aponta na direção oposta. Concordância é, por si, anormal.'),
    campoSimNao('infraV1V3', 'Infra de ST ≥ 1 mm em V1, V2 ou V3', 3, 'Infra concordante nas precordiais direitas, onde o QRS é predominantemente negativo e o ST deveria estar elevado. Equivale a um supra concordante e tem especificidade alta.'),
    campoSimNao('discordante5', 'Supra de ST ≥ 5 mm **discordante** do QRS', 2, 'Critério original. É o de menor especificidade dos três, e é justamente o que a versão modificada substitui.'),
    campoNum('supraMm', 'Supra de ST no ponto J', { unidade: 'mm', min: 0, max: 20, passo: 0.5, mostrarSe: (v) => opc(v, 'versao') === 'smith', ajuda: 'Meça no ponto J, em relação ao segmento PR, na derivação com maior supra discordante.' }),
    campoNum('sMm', 'Profundidade da onda S na mesma derivação', { unidade: 'mm', min: 0.5, max: 50, passo: 0.5, mostrarSe: (v) => opc(v, 'versao') === 'smith', ajuda: 'Amplitude absoluta da onda S (ou da onda R, quando o QRS for positivo) na mesma derivação em que o supra foi medido. É ela que normaliza o supra pelo tamanho do QRS.' }),
  ],
  calcular: (v) => {
    const smith = opc(v, 'versao') === 'smith'
    const concordante = sim(v, 'concordanteSupra')
    const infra = sim(v, 'infraV1V3')
    const discordante5 = sim(v, 'discordante5')
    const supra = num(v, 'supraMm')
    const s = num(v, 'sMm')

    const pontos = (concordante ? 5 : 0) + (infra ? 3 : 0) + (discordante5 ? 2 : 0)
    const proporcao = smith && supra !== null && s !== null && s > 0 ? supra / s : null
    const criterioSmith = proporcao !== null && proporcao >= 0.25

    const positivo = smith ? concordante || infra || criterioSmith : pontos >= 3
    const nivel: Nivel = positivo ? 'critico' : 'atencao'

    const interpretacao: string[] = [
      smith
        ? '**Sgarbossa modificado (Smith):** basta **um** dos três critérios para ser positivo — supra concordante ≥ 1 mm, infra ≥ 1 mm em V1 a V3, ou relação supra/onda S ≥ 0,25 em valor absoluto. A sensibilidade sobe de cerca de 52% (original) para 80 a 91%, mantendo especificidade acima de 90%.'
        : `**Sgarbossa original:** ${pontos} ponto(s), com corte de 3 para positividade. O escore soma 5 pelo supra concordante, 3 pelo infra em V1 a V3 e 2 pelo supra discordante ≥ 5 mm. A especificidade é alta (cerca de 98% com 3 ou mais pontos), mas a sensibilidade é baixa — em torno de 20 a 50%.`,
      concordante
        ? '**Supra concordante presente — o achado mais específico de todos.** Na repolarização normal do bloqueio de ramo esquerdo, o ST é obrigatoriamente **discordante** do QRS: aponta na direção oposta ao complexo. Concordância é, por definição, anormal e aponta lesão transmural.'
        : 'Sem supra concordante, que é o critério isolado de maior especificidade.',
      proporcao !== null
        ? `A relação supra/onda S é de ${fmt(proporcao, 2)}, ${criterioSmith ? '**acima** do corte de 0,25 — critério positivo' : 'abaixo do corte de 0,25'}. A lógica da proporção é que o supra discordante fisiológico é proporcional à amplitude do QRS: um supra de 3 mm com onda S de 8 mm é patológico, e o critério fixo de 5 mm o perderia.`
        : 'A versão original usa o corte fixo de 5 mm para o supra discordante, que perde infartos em QRS de baixa voltagem — foi essa limitação que motivou a versão modificada.',
      '**Um resultado negativo não exclui infarto.** Mesmo a versão modificada tem sensibilidade em torno de 80 a 91%, e o quadro clínico, a troponina seriada e o ecocardiograma continuam mandando. Bloqueio de ramo esquerdo novo com dor torácica típica e instabilidade justifica cateterismo independentemente dos critérios.',
    ]

    return {
      titulo: smith ? 'Sgarbossa modificado (Smith)' : 'Sgarbossa original',
      valor: positivo ? 'Positivo' : 'Negativo',
      nivel,
      rotuloNivel: smith ? 'Um critério basta' : `${pontos} de 10 pontos (corte 3)`,
      detalhes: [
        { rotulo: 'Supra concordante ≥ 1 mm', valor: concordante ? 'Presente' : 'Ausente', nivel: (concordante ? 'critico' : 'ok') as Nivel, nota: 'Especificidade ~98%' },
        { rotulo: 'Infra ≥ 1 mm em V1-V3', valor: infra ? 'Presente' : 'Ausente', nivel: (infra ? 'critico' : 'ok') as Nivel },
        ...(smith
          ? [{ rotulo: 'Relação supra/onda S', valor: proporcao !== null ? fmt(proporcao, 2) : '—', nivel: (criterioSmith ? 'critico' : 'ok') as Nivel, nota: 'Corte ≥ 0,25' }]
          : [{ rotulo: 'Supra discordante ≥ 5 mm', valor: discordante5 ? 'Presente' : 'Ausente', nivel: (discordante5 ? 'alerta' : 'ok') as Nivel }]),
        { rotulo: 'Resultado', valor: positivo ? 'Critérios preenchidos' : 'Critérios não preenchidos' },
      ],
      interpretacao,
      conduta: [
        positivo
          ? '**Critérios positivos: ative o protocolo de infarto com supra de ST.** Angioplastia primária em até 90 minutos do primeiro contato médico, ou trombólise em até 30 minutos quando a angioplastia não for alcançável no prazo. Não espere a troponina.'
          : '**Critérios negativos não afastam infarto.** Mantenha monitorização, colha troponina ultrassensível seriada, repita o ECG a cada 15 a 30 minutos e considere ecocardiograma à beira do leito procurando alteração segmentar nova.',
        'Compare com um **ECG anterior** sempre que houver um. Bloqueio de ramo esquerdo comprovadamente novo, em paciente com dor típica, tem peso clínico próprio — embora a diretriz atual não o trate mais como equivalente automático de supra de ST.',
        'Diante de **instabilidade hemodinâmica, choque, insuficiência cardíaca aguda ou arritmia ventricular** com bloqueio de ramo esquerdo e quadro compatível, leve ao cateterismo independentemente dos critérios. Nesse cenário, o risco de esperar supera o de intervir.',
        'Aplique os mesmos critérios ao **ritmo de marcapasso ventricular**, que produz a mesma discordância fisiológica do bloqueio de ramo esquerdo. A versão modificada tem desempenho melhor também aqui.',
        'Não confunda com os padrões de **oclusão iminente sem supra**: o padrão de Wellens (T bifásica ou profundamente invertida em V2-V3, fora da dor, indicando estenose crítica proximal da artéria descendente anterior) e o padrão de De Winter (infra ascendente no ponto J com T apiculada em precordiais). Nenhum dos dois preenche critério de supra, e ambos indicam cateterismo.',
      ],
      alertas: [
        '**Sgarbossa negativo não exclui infarto.** A sensibilidade é limitada mesmo na versão modificada — a decisão final é clínica, com troponina seriada, ECG seriado e ecocardiograma.',
        'Os critérios exigem **bloqueio de ramo esquerdo ou ritmo de marcapasso**. Em bloqueio de ramo **direito**, o ST e a T são interpretáveis pelas regras habituais nas derivações não afetadas, e Sgarbossa não se aplica.',
      ],
    }
  },
  formula: [
    'Sgarbossa original: supra concordante ≥ 1 mm (5 pts) + infra ≥ 1 mm em V1-V3 (3 pts) + supra discordante ≥ 5 mm (2 pts); positivo com ≥ 3',
    'Modificado (Smith): qualquer um entre supra concordante ≥ 1 mm, infra ≥ 1 mm em V1-V3, ou |supra ÷ onda S| ≥ 0,25',
  ],
  fundamento:
    'No bloqueio de ramo esquerdo, o impulso não desce pelo ramo esquerdo e precisa atravessar o miocárdio célula a célula, o que alarga o QRS e, mais importante, altera completamente a sequência de repolarização. O resultado é a **discordância apropriada**: o segmento ST e a onda T apontam na direção oposta à deflexão principal do QRS — em derivações com QRS negativo, o ST está elevado; em derivações com QRS positivo, está deprimido. Essa alteração de base mascara o supra de ST da lesão transmural, que é o sinal com que o eletrocardiograma detecta infarto. Sgarbossa resolveu o problema procurando o que **não** pode ser explicado pela discordância fisiológica: um ST que aponta na mesma direção do QRS (concordância) é anormal em qualquer circunstância, e é por isso que esse critério tem especificidade próxima de 98%. A contribuição de Smith foi perceber que o terceiro critério original errava de premissa: o supra discordante esperado não é um valor fixo, e sim **proporcional à amplitude do QRS**, de modo que um corte absoluto de 5 mm é permissivo demais em QRS amplo e restritivo demais em QRS de baixa voltagem. Substituir o valor absoluto pela razão entre o supra e a onda S quase dobrou a sensibilidade sem sacrificar especificidade.',
  armadilhas: [
    'Medir o supra na derivação errada: use a derivação com maior desvio, e meça no ponto J em relação ao segmento PR.',
    'Aplicar os critérios a bloqueio de ramo direito, onde eles não valem — ali o ST é interpretável pelas regras habituais nas derivações não afetadas.',
    'Hipertrofia ventricular esquerda com padrão de sobrecarga produz discordância semelhante e é fonte de falso positivo do critério de 5 mm.',
    'Aguardar a troponina em paciente com critérios positivos: eles equivalem a supra de ST, e a conduta é reperfusão imediata.',
  ],
  referencias: [
    { texto: 'Sgarbossa EB, Pinski SL, Barbagelata A, et al. Electrocardiographic diagnosis of evolving acute myocardial infarction in the presence of left bundle-branch block. N Engl J Med. 1996;334(8):481-487.' },
    { texto: 'Smith SW, Dodd KW, Henry TD, Dvorak DM, Pearce LA. Diagnosis of ST-elevation myocardial infarction in the presence of left bundle branch block with the ST-elevation to S-wave ratio in a modified Sgarbossa rule. Ann Emerg Med. 2012;60(6):766-776.' },
    { texto: 'Meyers HP, Limkakeng AT, Jaffa EJ, et al. Validation of the modified Sgarbossa criteria for acute coronary occlusion in the setting of left bundle branch block. Am Heart J. 2015;170(6):1255-1264.' },
  ],
}

/* ═══════════════ NYHA, CCS e critérios de Framingham para insuficiência cardíaca ═══════════════ */

const nyhaCampos: Campo[] = [
  campoSeg('escala', 'O que classificar', [
    { valor: 'nyha', rotulo: 'NYHA (dispneia)' },
    { valor: 'ccs', rotulo: 'CCS (angina)' },
    { valor: 'framingham', rotulo: 'Framingham (diagnóstico de IC)' },
  ], { ajuda: 'NYHA e CCS graduam **sintoma** e mudam com o tratamento; os critérios de Framingham fazem o **diagnóstico clínico** de insuficiência cardíaca, e servem sobretudo em contexto epidemiológico e onde não há acesso rápido a ecocardiograma e peptídeo natriurético.' }),
  campoOpc('nyha', 'Classe funcional NYHA', [
    { valor: '1', rotulo: 'I — Sem limitação: atividade física habitual não causa sintoma', pontos: 1 },
    { valor: '2', rotulo: 'II — Limitação leve: confortável em repouso, sintoma com atividade habitual', pontos: 2 },
    { valor: '3', rotulo: 'III — Limitação acentuada: sintoma com atividade menor que a habitual', pontos: 3 },
    { valor: '4', rotulo: 'IV — Sintoma em repouso, ou com qualquer atividade', pontos: 4 },
  ], { padrao: '1', mostrarSe: (v) => opc(v, 'escala') === 'nyha', ajuda: 'Pergunte por atividades concretas do dia a dia do paciente — subir um lance de escada, caminhar um quarteirão, tomar banho, vestir-se — e não "você se cansa?". A classe é o que ele consegue fazer hoje, não o que fazia antes.' }),
  campoOpc('ccs', 'Classe de angina CCS', [
    { valor: '1', rotulo: 'I — Angina apenas com esforço extenuante, rápido ou prolongado', pontos: 1 },
    { valor: '2', rotulo: 'II — Limitação leve: angina ao subir escada rapidamente, após refeição, no frio ou sob estresse', pontos: 2 },
    { valor: '3', rotulo: 'III — Limitação acentuada: angina ao caminhar 1 a 2 quarteirões ou subir um lance de escada em ritmo normal', pontos: 3 },
    { valor: '4', rotulo: 'IV — Incapaz de qualquer atividade sem angina, ou angina em repouso', pontos: 4 },
  ], { padrao: '1', mostrarSe: (v) => opc(v, 'escala') === 'ccs', ajuda: 'A CCS é mais específica que a NYHA porque ancora cada classe em distância e ritmo: quantos quarteirões, quantos lances, em que velocidade. Registre a âncora usada, para que a comparação ao longo do tempo tenha sentido.' }),
  campoSimNao('dpn', 'Dispneia paroxística noturna ou ortopneia', 0, 'Critério **maior** de Framingham. Pergunte por quantos travesseiros o paciente usa e se acorda com falta de ar — a ortopneia tem sensibilidade modesta mas especificidade alta.'),
  campoSimNao('jugular', 'Turgência jugular', 0, 'Critério **maior**. Avalie a 45°, com a cabeça levemente rodada para o lado oposto, procurando o ponto mais alto de pulsação venosa acima do ângulo esternal.'),
  campoSimNao('estertores', 'Estertores crepitantes', 0, 'Critério **maior**.'),
  campoSimNao('cardiomegalia', 'Cardiomegalia na radiografia', 0, 'Critério **maior**: índice cardiotorácico acima de 0,5 em incidência posteroanterior.'),
  campoSimNao('edemaPulmonar', 'Edema agudo de pulmão', 0, 'Critério **maior**.'),
  campoSimNao('b3', 'Terceira bulha (ritmo de galope)', 0, 'Critério **maior**. É pouco sensível mas muito específico, e sua presença aumenta bastante a probabilidade de pressão de enchimento elevada.'),
  campoSimNao('refluxo', 'Refluxo hepatojugular positivo', 0, 'Critério **maior**: pressão sustentada sobre o quadrante superior direito por 15 segundos elevando a coluna jugular de forma persistente.'),
  campoSimNao('perdaPeso', 'Perda de mais de 4,5 kg em 5 dias com o tratamento', 0, 'Critério **maior** quando a perda responde ao tratamento da insuficiência cardíaca.'),
  campoSimNao('edemaMmii', 'Edema de membros inferiores bilateral', 0, 'Critério **menor**. Tem baixa especificidade: insuficiência venosa, medicamentos (bloqueador de canal de cálcio), hipoalbuminemia e imobilidade causam o mesmo achado.'),
  campoSimNao('tosseNoturna', 'Tosse noturna', 0, 'Critério **menor**.'),
  campoSimNao('dispneiaEsforco', 'Dispneia aos esforços habituais', 0, 'Critério **menor**.'),
  campoSimNao('hepatomegalia', 'Hepatomegalia', 0, 'Critério **menor**.'),
  campoSimNao('derrame', 'Derrame pleural', 0, 'Critério **menor**.'),
  campoSimNao('taquicardia', 'Frequência cardíaca acima de 120 bpm', 0, 'Critério **menor**.'),
]

const nyhaCcs: Ferramenta = {
  id: 'nyha-ccs-framingham',
  nome: 'NYHA, CCS e critérios de Framingham',
  sinonimos: ['nyha', 'classe funcional', 'ccs', 'angina', 'framingham', 'insuficiencia cardiaca diagnostico'],
  resumo: 'Gradua dispneia e angina por classe funcional e aplica os critérios clínicos de Framingham para insuficiência cardíaca.',
  categorias: ['cardiologia'],
  campos: nyhaCampos,
  calcular: (v) => {
    const escala = opc(v, 'escala') ?? 'nyha'

    if (escala === 'framingham') {
      const maiores = ['dpn', 'jugular', 'estertores', 'cardiomegalia', 'edemaPulmonar', 'b3', 'refluxo', 'perdaPeso']
      const menores = ['edemaMmii', 'tosseNoturna', 'dispneiaEsforco', 'hepatomegalia', 'derrame', 'taquicardia']
      const nM = maiores.filter((id) => sim(v, id)).length
      const nm = menores.filter((id) => sim(v, id)).length
      const diagnostico = nM >= 2 || (nM >= 1 && nm >= 2)

      return {
        titulo: 'Critérios de Framingham',
        valor: diagnostico ? 'Critérios preenchidos' : 'Critérios não preenchidos',
        nivel: diagnostico ? 'alerta' : 'atencao',
        rotuloNivel: `${nM} maior(es) e ${nm} menor(es)`,
        detalhes: [
          { rotulo: 'Critérios maiores', valor: `${nM} de 8`, nivel: (nM >= 2 ? 'alerta' : 'ok') as Nivel },
          { rotulo: 'Critérios menores', valor: `${nm} de 6` },
          { rotulo: 'Regra', valor: '2 maiores, ou 1 maior + 2 menores' },
        ],
        interpretacao: [
          diagnostico
            ? `**${nM} critério(s) maior(es) e ${nm} menor(es): os critérios de Framingham estão preenchidos.** A regra exige 2 maiores, ou 1 maior somado a 2 menores, com os menores contando apenas se não houver outra explicação para eles.`
            : `**${nM} maior(es) e ${nm} menor(es): a regra não é satisfeita.** Isso não exclui insuficiência cardíaca — os critérios foram construídos para estudo epidemiológico e têm sensibilidade limitada, sobretudo na insuficiência com fração de ejeção preservada.`,
          'Os critérios de Framingham antecedem o ecocardiograma e o peptídeo natriurético, e hoje têm papel sobretudo **epidemiológico e em contextos sem acesso rápido a esses exames**. O diagnóstico moderno combina sintoma e sinal compatíveis, **BNP ou NT-proBNP** elevados e **ecocardiograma** com alteração estrutural ou funcional.',
          'Os cortes de peptídeo natriurético para **excluir** insuficiência cardíaca no quadro agudo são: BNP abaixo de 100 pg/mL ou NT-proBNP abaixo de 300 pg/mL. No ambulatório, os cortes são mais baixos (BNP 35 e NT-proBNP 125), e valores abaixo deles tornam o diagnóstico improvável.',
          'Fibrilação atrial, idade avançada, insuficiência renal e sepse elevam o peptídeo natriurético; **obesidade o reduz** de forma significativa, e essa é a causa mais comum de falso negativo.',
        ],
        conduta: [
          diagnostico
            ? '**Confirme com ecocardiograma e peptídeo natriurético**, e classifique pela fração de ejeção — reduzida (≤ 40%), levemente reduzida (41 a 49%) ou preservada (≥ 50%) —, porque é isso que define o tratamento.'
            : '**Prossiga a investigação** mesmo sem preencher os critérios: dose BNP ou NT-proBNP e solicite ecocardiograma se a suspeita clínica persistir. Considere também doença pulmonar, anemia, obesidade, descondicionamento, tireoidopatia e depressão como causas de dispneia.',
          'Na **fração de ejeção reduzida**, instale os quatro pilares o mais rápido possível — inibidor do receptor de angiotensina com neprilisina (ou IECA/BRA), betabloqueador, antagonista mineralocorticoide e inibidor de SGLT2. A estratégia atual é iniciar os quatro em doses baixas e titular em paralelo, e não em sequência ao longo de meses: o benefício em mortalidade aparece em semanas.',
          'Na **fração preservada**, o inibidor de SGLT2 é o único com benefício consistente; trate agressivamente hipertensão, fibrilação atrial, obesidade, apneia do sono e diabetes, e investigue causas específicas — amiloidose cardíaca (cintilografia com pirofosfato e pesquisa de cadeias leves), cardiomiopatia hipertrófica e doença de Fabry.',
          'Procure e trate o **fator descompensante** em toda internação: má adesão, transgressão de sal e líquido, infecção, arritmia, isquemia, anemia, disfunção tireoidiana, anti-inflamatórios e embolia pulmonar.',
        ],
        alertas: [
          'Os critérios de Framingham são **clínicos e antigos**, com sensibilidade limitada na insuficiência com fração de ejeção preservada — não os use para excluir o diagnóstico.',
          'Peptídeo natriurético **reduzido pela obesidade** é a causa mais comum de falso negativo; em obesos, use cortes mais baixos e valorize mais a clínica e o ecocardiograma.',
        ],
      }
    }

    const classe = ptsOpc(nyhaCampos, v, escala === 'nyha' ? 'nyha' : 'ccs')
    if (classe === null) return null
    const nivel: Nivel = classe >= 4 ? 'critico' : classe === 3 ? 'alerta' : classe === 2 ? 'atencao' : 'ok'

    const conduta: string[] = []
    if (escala === 'nyha') {
      conduta.push(
        'Trate a **doença**, não a classe: os quatro pilares da insuficiência com fração de ejeção reduzida estão indicados de NYHA II a IV, e o betabloqueador e o inibidor de SGLT2 valem também na classe I com disfunção ventricular assintomática.',
      )
      if (classe >= 3) {
        conduta.push('**NYHA III a IV apesar de terapia otimizada:** avalie indicações de dispositivo — **cardiodesfibrilador implantável** com fração ≤ 35% e expectativa de vida acima de 1 ano, e **terapia de ressincronização** com QRS ≥ 130 ms e morfologia de bloqueio de ramo esquerdo. Considere também encaminhamento para avaliação de transplante e de suporte circulatório.')
        conduta.push('Na **classe IV persistente**, discuta explicitamente objetivos de cuidado e envolva cuidados paliativos: a mortalidade em 1 ano é comparável à de muitas neoplasias, e essa conversa costuma acontecer tarde demais.')
      } else {
        conduta.push('**NYHA I a II:** titule os quatro pilares até a dose-alvo ou a máxima tolerada. A subtitulação é a lacuna mais comum no tratamento da insuficiência cardíaca — a maioria dos pacientes nunca chega à dose dos ensaios.')
      }
      conduta.push(
        'Encaminhe para **reabilitação cardiovascular supervisionada**, que melhora capacidade funcional, qualidade de vida e reduz hospitalização.',
        'Reavalie a classe a cada consulta e **registre a âncora usada** (quantos lances de escada, quantos quarteirões). Piora de classe é o gatilho mais precoce para intensificar tratamento — antes do ganho de peso e antes do edema.',
      )
    } else {
      conduta.push(
        '**Otimize a terapia antianginosa** antes de considerar revascularização em doença estável: betabloqueador ou bloqueador de canal de cálcio como primeira linha, nitrato de longa duração, e ivabradina, ranolazina ou trimetazidina como segunda linha.',
      )
      if (classe >= 3) {
        conduta.push('**CCS III a IV apesar de terapia otimizada** é indicação de estratificação invasiva e de revascularização para alívio de sintoma. Lembre que, em doença estável, a revascularização melhora sintoma mas não reduz infarto nem mortalidade em relação ao tratamento clínico otimizado — o ensaio ISCHEMIA confirmou isso, e essa informação pertence à conversa com o paciente.')
      } else {
        conduta.push('**CCS I a II:** tratamento clínico otimizado, com controle agressivo de fatores de risco. Estratificação invasiva apenas se houver isquemia extensa em teste funcional ou disfunção ventricular.')
      }
      conduta.push(
        'Garanta a **terapia que muda prognóstico**, independentemente da classe: estatina de alta intensidade com meta de LDL abaixo de 55 mg/dL, aspirina, controle pressórico e glicêmico, cessação do tabagismo e atividade física.',
        'Angina **em repouso, de início recente ou em crescendo** não é angina estável: é síndrome coronariana aguda, e a conduta muda inteiramente.',
      )
    }

    return {
      titulo: escala === 'nyha' ? 'Classe funcional NYHA' : 'Classe de angina CCS',
      valor: ['I', 'II', 'III', 'IV'][classe - 1],
      nivel,
      rotuloNivel: escala === 'nyha'
        ? ['Sem limitação', 'Limitação leve', 'Limitação acentuada', 'Sintoma em repouso'][classe - 1]
        : ['Esforço extenuante', 'Limitação leve', 'Limitação acentuada', 'Qualquer atividade ou repouso'][classe - 1],
      detalhes: [
        { rotulo: 'Classe', valor: ['I', 'II', 'III', 'IV'][classe - 1] },
        { rotulo: 'Escala', valor: escala === 'nyha' ? 'New York Heart Association (dispneia)' : 'Canadian Cardiovascular Society (angina)' },
      ],
      interpretacao: [
        escala === 'nyha'
          ? `**NYHA classe ${['I', 'II', 'III', 'IV'][classe - 1]}.** A classificação é **dinâmica**: melhora com o tratamento e piora na descompensação, e por isso serve para acompanhar resposta. A classe na admissão e a classe na alta são informações diferentes e devem ser registradas separadamente.`
          : `**CCS classe ${['I', 'II', 'III', 'IV'][classe - 1]}.** A CCS é mais específica que a NYHA porque ancora cada classe em distância e ritmo — quantos quarteirões, quantos lances, em que velocidade —, o que reduz a variabilidade entre observadores.`,
        'A concordância entre observadores é apenas **moderada** em ambas as escalas, sobretudo entre as classes II e III, que concentram a maior parte dos pacientes. Ancorar a pergunta em atividades concretas do dia a dia do paciente é o que mais melhora a reprodutibilidade.',
        escala === 'nyha'
          ? 'A NYHA classifica **sintoma**, e o estágio A/B/C/D da AHA classifica a **progressão estrutural da doença** — este último é unidirecional e nunca retrocede. Um paciente pode ir de NYHA III para I com tratamento, mas continua em estágio C.'
          : 'Classe alta de angina não implica doença anatomicamente mais grave: há lesões críticas assintomáticas e angina limitante com doença moderada, muitas vezes por componente microvascular ou vasoespástico.',
        classe >= 3
          ? 'Classe III ou IV marca limitação importante e associa-se a mortalidade substancialmente maior — é a faixa em que se avaliam dispositivos, revascularização e, na insuficiência cardíaca avançada, transplante e suporte circulatório.'
          : 'Classe I ou II indica boa capacidade funcional, o que não dispensa a terapia que modifica prognóstico: em insuficiência cardíaca e em doença coronariana, o tratamento de fundo independe do sintoma.',
      ],
      conduta,
      alertas: [
        'A classe funcional mede **sintoma**, não gravidade anatômica nem função ventricular: há fração de ejeção de 20% em NYHA I e de 45% em NYHA III.',
        escala === 'nyha'
          ? 'Não confunda a classe funcional NYHA com o **estágio A/B/C/D** da AHA: a primeira é dinâmica e reversível, o segundo é estrutural e unidirecional.'
          : 'Angina em repouso, de início recente ou em crescendo **não é angina estável** — é síndrome coronariana aguda, e a CCS não se aplica.',
      ],
    }
  },
  formula: ['NYHA I a IV (dispneia) · CCS I a IV (angina)', 'Framingham: 2 critérios maiores, ou 1 maior + 2 menores'],
  fundamento:
    'A classe funcional traduz, num único número, o ponto em que a reserva cardiovascular se esgota — e a fisiologia desse esgotamento explica por que ela se correlaciona tão mal com a fração de ejeção. Na insuficiência cardíaca, a limitação ao esforço depende pouco do débito de repouso e muito da **incapacidade de aumentá-lo**: a reserva cronotrópica está reduzida, a pressão de enchimento sobe abruptamente com o exercício produzindo congestão pulmonar dinâmica, a vasodilatação periférica dependente de endotélio está prejudicada, e o músculo esquelético sofre alterações próprias — perda de fibras tipo I, disfunção mitocondrial, acidose precoce — que geram fadiga independentemente do coração. É por isso que dois pacientes com a mesma fração de ejeção podem estar em classes opostas, e por que o treinamento físico melhora a classe sem mudar a fração. Na angina, a classe reflete o **limiar isquêmico**, que é o ponto em que a demanda miocárdica de oxigênio — estimada pelo duplo produto — ultrapassa a oferta limitada pela estenose; esse limiar é reprodutível para cada paciente e é justamente o que o betabloqueador desloca para cima ao reduzir frequência e contratilidade. Os critérios de Framingham, por sua vez, são um artefato histórico valioso: construídos nos anos 1970 a partir da coorte que deu nome ao estudo, eles codificam o exame físico da congestão numa era anterior ao ecocardiograma, e ainda hoje ensinam quais sinais têm peso — turgência jugular, terceira bulha e refluxo hepatojugular são pouco sensíveis e muito específicos de pressão de enchimento elevada.',
  armadilhas: [
    'A concordância entre observadores é apenas moderada, sobretudo entre as classes II e III — ancorar em atividades concretas reduz o ruído.',
    'Pacientes limitam a própria atividade para evitar sintoma e se autodeclaram em classe melhor do que estão; perguntar o que deixaram de fazer revela mais que perguntar o que sentem.',
    'Comorbidades não cardíacas — artrose, doença pulmonar, obesidade, anemia, depressão — elevam a classe sem piora cardíaca.',
    'Os critérios de Framingham têm sensibilidade baixa na insuficiência com fração de ejeção preservada, justamente a forma mais prevalente hoje.',
  ],
  referencias: [
    { texto: 'The Criteria Committee of the New York Heart Association. Nomenclature and Criteria for Diagnosis of Diseases of the Heart and Great Vessels. 9ª ed. Boston: Little, Brown; 1994.' },
    { texto: 'Campeau L. Grading of angina pectoris. Circulation. 1976;54(3):522-523.' },
    { texto: 'McKee PA, Castelli WP, McNamara PM, Kannel WB. The natural history of congestive heart failure: the Framingham study. N Engl J Med. 1971;285(26):1441-1446.' },
    { texto: 'McDonagh TA, Metra M, Adamo M, et al. 2021 ESC Guidelines for the diagnosis and treatment of acute and chronic heart failure. Eur Heart J. 2021;42(36):3599-3726.' },
  ],
}

/* ═══════════════ ADD-RS — probabilidade de dissecção aórtica ═══════════════ */

const addrsCampos: Campo[] = [
  campoSimNao('marfan', 'Condição de alto risco: Marfan, doença do tecido conjuntivo, história familiar de doença aórtica, valva aórtica bicúspide, aneurisma de aorta conhecido, ou manipulação aórtica recente', 1, 'Categoria I do ADD-RS — **condições predisponentes**. Basta uma para a categoria pontuar. Manipulação recente inclui cateterismo, cirurgia cardíaca e valvoplastia.'),
  campoSimNao('dorAbrupta', 'Dor de início abrupto, intensidade máxima desde o começo, ou de caráter dilacerante ou rasgante', 1, 'Categoria II — **características da dor**. O padrão que importa é o de **instalação**: dor que já nasce no máximo, ao contrário da dor isquêmica, que cresce em minutos. O caráter "rasgante" é clássico mas está presente em menos da metade dos casos.'),
  campoSimNao('exameAlterado', 'Déficit de pulso ou diferença de pressão entre membros, déficit neurológico focal com dor, sopro de insuficiência aórtica novo, ou hipotensão e choque', 1, 'Categoria III — **achados de exame**. Meça a pressão nos **dois braços**: diferença sistólica maior que 20 mmHg é sinal clássico, embora presente em apenas cerca de um terço dos casos.'),
  campoNum('dimero', 'D-dímero', { unidade: 'ng/mL', min: 0, max: 20000, passo: 10, opcional: true, ajuda: 'O D-dímero abaixo de 500 ng/mL, combinado a ADD-RS de 0 ou 1, tem valor preditivo negativo próximo de 99% (estratégia ADvISED) e permite dispensar angiotomografia. **Nunca use o D-dímero isoladamente**: a dissecção com trombose completa do falso lúmen pode cursar com D-dímero normal.' }),
  campoSimNao('mediastino', 'Alargamento de mediastino na radiografia', 0, 'Presente em cerca de 60% dos casos — radiografia normal **não afasta** dissecção, e esse é um dos erros mais frequentes nesse diagnóstico.'),
  campoSeg('instabilidade', 'Estado hemodinâmico', [
    { valor: 'estavel', rotulo: 'Estável' },
    { valor: 'instavel', rotulo: 'Instável (choque, tamponamento, síncope)' },
  ], { ajuda: 'A instabilidade muda a rota do exame: paciente instável vai para **ecocardiograma transesofágico à beira do leito** ou direto ao centro cirúrgico, em vez de ser transportado para a tomografia.' }),
]

const addrs: Ferramenta = {
  id: 'add-rs',
  nome: 'ADD-RS — probabilidade de dissecção aórtica',
  sigla: 'ADD-RS',
  sinonimos: ['add-rs', 'dissecao aortica', 'aorta', 'stanford', 'debakey', 'dor toracica'],
  resumo: 'Estima a probabilidade pré-teste de dissecção aórtica em três categorias e define quando o D-dímero pode dispensar a angiotomografia.',
  categorias: ['cardiologia', 'emergencia'],
  campos: addrsCampos,
  calcular: (v) => {
    const categorias = ['marfan', 'dorAbrupta', 'exameAlterado']
    const total = categorias.filter((id) => sim(v, id)).length
    const dimero = num(v, 'dimero')
    const instavel = opc(v, 'instabilidade') === 'instavel'

    const baixo = total <= 1
    const dimeroNegativo = dimero !== null && dimero < 500
    const podeDispensar = baixo && dimeroNegativo && !instavel

    const nivel: Nivel = total >= 2 || instavel ? 'critico' : total === 1 ? 'alerta' : 'atencao'

    const interpretacao: string[] = [
      `**ADD-RS de ${total} de 3 categorias.** O escore conta **categorias**, não itens: cada uma das três — condição predisponente, características da dor e achados de exame — vale no máximo 1 ponto, por mais itens que estejam presentes dentro dela.`,
      total >= 2
        ? '**ADD-RS de 2 ou 3 é alto risco.** Prossiga direto para imagem definitiva. A sensibilidade do escore para dissecção é de aproximadamente 96%, e nessa faixa o D-dímero não tem papel: um resultado negativo não reduz o risco pós-teste o suficiente para liberar o paciente.'
        : total === 1
          ? '**ADD-RS de 1: risco intermediário.** É aqui que a estratégia **ADvISED** se aplica — D-dímero abaixo de 500 ng/mL com ADD-RS de 0 ou 1 tem valor preditivo negativo próximo de 99% e permite dispensar a angiotomografia.'
          : '**ADD-RS de 0: baixo risco.** Com D-dímero negativo, a dissecção é muito improvável. Ainda assim, mantenha a investigação das outras causas de dor torácica potencialmente letais.',
      dimero !== null
        ? dimeroNegativo
          ? `D-dímero de ${fmtInt(dimero)} ng/mL, **abaixo do corte de 500**. Combinado a ADD-RS de 0 ou 1, isso sustenta a decisão de não fazer angiotomografia — mas o D-dímero **nunca** decide sozinho, e há um cenário específico em que ele engana: a dissecção com **trombose completa do falso lúmen**, em que pode vir normal.`
          : `D-dímero de ${fmtInt(dimero)} ng/mL, acima do corte. Isso não confirma dissecção — o D-dímero é inespecífico e sobe em embolia, infecção, câncer, gestação, pós-operatório e idade avançada —, mas impede que ele seja usado para excluir.`
        : 'O D-dímero não foi informado. Ele só tem papel na estratégia de exclusão quando o ADD-RS é 0 ou 1.',
      instavel
        ? '**Paciente instável:** não o transporte para a tomografia. O **ecocardiograma transesofágico à beira do leito** tem sensibilidade acima de 95% para dissecção tipo A e pode ser feito na sala de emergência ou no centro cirúrgico, com a equipe de cirurgia cardíaca já acionada.'
        : 'Paciente estável, o que permite a angiotomografia de aorta com contraste, que é o exame de escolha.',
    ]

    const conduta: string[] = []
    if (instavel) {
      conduta.push('**Instabilidade: acione a cirurgia cardíaca imediatamente** e faça ecocardiograma transesofágico à beira do leito. Choque em dissecção significa tamponamento, insuficiência aórtica aguda grave, rotura ou infarto — todos cirúrgicos. Pericardiocentese em tamponamento por dissecção é **contraindicada** fora do centro cirúrgico: aliviar a pressão pode reativar o sangramento.')
    } else if (total >= 2) {
      conduta.push('**Alto risco: angiotomografia de aorta com contraste, de toda a aorta**, do arco às ilíacas. Não aguarde o D-dímero.')
    } else if (podeDispensar) {
      conduta.push('**ADD-RS de 0 ou 1 com D-dímero negativo: a angiotomografia pode ser dispensada** pela estratégia ADvISED. Prossiga investigando as demais causas de dor torácica — síndrome coronariana, embolia pulmonar, pneumotórax, rotura de esôfago, pericardite.')
    } else {
      conduta.push('**Risco baixo ou intermediário sem D-dímero negativo documentado:** dose o D-dímero, ou prossiga direto para angiotomografia se a suspeita clínica for relevante e a estratégia de exclusão não estiver disponível.')
    }
    conduta.push(
      'Confirmada a dissecção, **classifique por Stanford**, que é o que define a conduta: **tipo A** envolve a aorta ascendente e é **emergência cirúrgica** — a mortalidade sem operar é de 1 a 2% **por hora** nas primeiras 48 horas; **tipo B** poupa a ascendente e é tratada clinicamente, salvo complicação (má perfusão de órgão, dor refratária, hipertensão incontrolável, expansão rápida, rotura iminente), quando se indica reparo endovascular.',
      '**Controle a pressão e a frequência imediatamente, nessa ordem: primeiro betabloqueador, depois vasodilatador.** Alvo de frequência abaixo de 60 bpm e sistólica de 100 a 120 mmHg, com esmolol, metoprolol ou labetalol. Vasodilatador antes do betabloqueador causa **taquicardia reflexa**, que aumenta a força de cisalhamento (dP/dt) e pode propagar a dissecção — é o erro clássico desse tratamento.',
      'Dê **analgesia eficaz**, com opioide: a dor alimenta a descarga adrenérgica, e controlá-la é parte do controle hemodinâmico, não um conforto acessório.',
      'Investigue as complicações de má perfusão por ramo: **coronária** (o infarto inferior por acometimento da coronária direita é armadilha clássica — trombolisar esse paciente é catastrófico), **carótidas** (acidente vascular), **medular** (paraplegia), **renal**, **mesentérica** e **ilíacas**. Diferença de pulsos entre os membros é o sinal de rastreio.',
      'A classificação de **DeBakey** completa o quadro anatômico: tipo I (ascendente e descendente), tipo II (ascendente apenas) e tipo III (descendente apenas). Stanford A corresponde a DeBakey I e II; Stanford B, a DeBakey III.',
    )

    return {
      titulo: 'ADD-RS',
      valor: fmtInt(total),
      unidade: 'de 3 categorias',
      nivel,
      rotuloNivel: instavel ? 'Instável — via rápida' : total >= 2 ? 'Alto risco' : total === 1 ? 'Risco intermediário' : 'Baixo risco',
      detalhes: [
        { rotulo: 'I — Condição predisponente', valor: sim(v, 'marfan') ? 'Presente' : 'Ausente', nivel: (sim(v, 'marfan') ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'II — Características da dor', valor: sim(v, 'dorAbrupta') ? 'Presente' : 'Ausente', nivel: (sim(v, 'dorAbrupta') ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'III — Achados de exame', valor: sim(v, 'exameAlterado') ? 'Presente' : 'Ausente', nivel: (sim(v, 'exameAlterado') ? 'critico' : 'ok') as Nivel },
        ...(dimero !== null ? [{ rotulo: 'D-dímero', valor: `${fmtInt(dimero)} ng/mL`, nivel: (dimeroNegativo ? 'ok' : 'alerta') as Nivel, nota: 'Corte de 500 ng/mL' }] : []),
        { rotulo: 'Alargamento de mediastino', valor: sim(v, 'mediastino') ? 'Presente' : 'Ausente', nota: 'Presente em ~60% — radiografia normal não afasta' },
        { rotulo: 'Conduta de imagem', valor: instavel ? 'Ecocardiograma transesofágico' : podeDispensar ? 'Angiotomografia dispensável' : 'Angiotomografia de aorta' },
      ],
      interpretacao,
      conduta,
      alertas: [
        '**Betabloqueador antes do vasodilatador, sempre.** Vasodilatar primeiro causa taquicardia reflexa, aumenta o dP/dt e pode propagar a dissecção.',
        '**Radiografia de tórax normal não afasta dissecção** — o alargamento de mediastino aparece em cerca de 60% dos casos.',
        'Infarto inferior com dor de início abrupto pode ser dissecção acometendo a coronária direita. **Trombolisar essa apresentação é catastrófico** — na dúvida, imagem antes de reperfundir.',
        'Tamponamento por dissecção: **não puncione fora do centro cirúrgico**. Aliviar a pressão pode reativar o sangramento e levar à exsanguinação.',
      ],
    }
  },
  formula: ['ADD-RS = número de categorias positivas (0 a 3): condição predisponente · características da dor · achados de exame', 'ADvISED: ADD-RS ≤ 1 com D-dímero < 500 ng/mL permite dispensar angiotomografia'],
  fundamento:
    'A dissecção aórtica começa com uma laceração na **íntima**, por onde o sangue sob pressão sistêmica penetra e descola a camada média ao longo do eixo do vaso, criando um falso lúmen. A força que propaga essa clivagem não é a pressão arterial média, e sim a **dP/dt** — a taxa de variação da pressão ao longo do tempo, isto é, a inclinação da curva de pressão durante a ejeção. Esse detalhe é o que dita todo o tratamento clínico: reduzir apenas a pressão com um vasodilatador provoca taquicardia reflexa e **aumenta** a dP/dt, propagando a dissecção; por isso o betabloqueador vem primeiro, reduzindo simultaneamente a frequência e a velocidade de ejeção, e o vasodilatador só depois. As duas condições predisponentes clássicas atacam a média por caminhos distintos: a **hipertensão crônica** provoca degeneração da média com fragmentação de elastina, e as **doenças do tecido conjuntivo** — Marfan por fibrilina-1, Ehlers-Danlos vascular por colágeno tipo III, Loeys-Dietz por receptores de TGF-beta — comprometem a matriz desde o início. A gravidade do tipo A decorre da anatomia: ali a dissecção pode romper para o pericárdio, causando tamponamento; descolar a valva aórtica, causando insuficiência aguda; ou ocluir os óstios coronarianos, causando infarto. Daí a mortalidade de 1 a 2% por hora nas primeiras 48 horas e a indicação cirúrgica imediata, que contrasta com o tipo B, tratado clinicamente por não ameaçar nenhuma dessas estruturas.',
  armadilhas: [
    'A dor pode ser abdominal, lombar ou já ter cedido quando o paciente chega — a ausência de dor no momento do exame não afasta.',
    'Apenas cerca de um terço dos pacientes tem diferença de pulsos ou de pressão entre os membros; sua ausência não exclui.',
    'D-dímero normal ocorre na dissecção com falso lúmen completamente trombosado, e é o cenário em que a estratégia de exclusão falha.',
    'Síncope isolada, dor abdominal e déficit neurológico focal são apresentações reconhecidas e frequentemente atribuídas a outros diagnósticos.',
  ],
  referencias: [
    { texto: 'Rogers AM, Hermann LK, Booher AM, et al. Sensitivity of the aortic dissection detection risk score. Circulation. 2011;123(20):2213-2218.' },
    { texto: 'Nazerian P, Mueller C, Soeiro AM, et al. Diagnostic accuracy of the aortic dissection detection risk score plus D-dimer for acute aortic syndromes: the ADvISED prospective multicenter study. Circulation. 2018;137(3):250-258.' },
    { texto: 'Isselbacher EM, Preventza O, Hamilton Black J 3rd, et al. 2022 ACC/AHA Guideline for the Diagnosis and Management of Aortic Disease. Circulation. 2022;146(24):e334-e482.' },
  ],
}

/* ═══════════ Índice tornozelo-braquial, Fontaine e Rutherford ═══════════ */

const itbCampos: Campo[] = [
  campoNum('brqD', 'Pressão sistólica braquial direita', { unidade: 'mmHg', min: 40, max: 300, passo: 1, ajuda: 'Meça nos **dois braços** com Doppler. O numerador do índice usa o maior valor entre os dois braquiais — se houver diferença maior que 15 a 20 mmHg, suspeite de estenose de subclávia do lado menor.' }),
  campoNum('brqE', 'Pressão sistólica braquial esquerda', { unidade: 'mmHg', min: 40, max: 300, passo: 1 }),
  campoNum('tibialPost', 'Tibial posterior (membro avaliado)', { unidade: 'mmHg', min: 0, max: 300, passo: 1, ajuda: 'Meça com Doppler, não com estetoscópio. O denominador usa o **maior** valor entre tibial posterior e pediosa do mesmo membro.' }),
  campoNum('pediosa', 'Pediosa (membro avaliado)', { unidade: 'mmHg', min: 0, max: 300, passo: 1 }),
  campoOpc('fontaine', 'Estágio clínico (Fontaine)', [
    { valor: '1', rotulo: 'I — Assintomático', pontos: 1 },
    { valor: '2', rotulo: 'IIa — Claudicação a mais de 200 m', pontos: 2 },
    { valor: '3', rotulo: 'IIb — Claudicação a menos de 200 m', pontos: 3 },
    { valor: '4', rotulo: 'III — Dor isquêmica em repouso', pontos: 4 },
    { valor: '5', rotulo: 'IV — Úlcera isquêmica ou gangrena', pontos: 5 },
  ], { padrao: '1', ajuda: 'Fontaine III e IV constituem **isquemia crítica de membro**, que tem risco de amputação e é emergência vascular — não confundir com claudicação, que é estável e tem tratamento clínico.' }),
  campoSimNao('diabetes', 'Diabetes ou doença renal crônica', 0, 'Nesses pacientes a **calcificação da média (esclerose de Mönckeberg)** torna a artéria incompressível e produz índice falsamente normal ou alto. Se o índice vier acima de 1,3 nesse contexto, ele não é interpretável — use o índice hálux-braquial.'),
]

const itb: Ferramenta = {
  id: 'indice-tornozelo-braquial',
  nome: 'Índice tornozelo-braquial, Fontaine e Rutherford',
  sigla: 'ITB',
  sinonimos: ['itb', 'abi', 'indice tornozelo braquial', 'doenca arterial periferica', 'claudicacao', 'fontaine', 'rutherford'],
  resumo: 'Diagnostica e gradua a doença arterial periférica, e identifica quando o índice não é interpretável por calcificação arterial.',
  categorias: ['cardiologia', 'especialidades'],
  campos: itbCampos,
  calcular: (v) => {
    const brqD = num(v, 'brqD')
    const brqE = num(v, 'brqE')
    const tp = num(v, 'tibialPost')
    const ped = num(v, 'pediosa')
    if (brqD === null || brqE === null || tp === null || ped === null) return null
    const braquial = Math.max(brqD, brqE)
    const tornozelo = Math.max(tp, ped)
    if (braquial === 0) return null
    const indice = tornozelo / braquial

    const incompressivel = indice > 1.3
    const diabetes = sim(v, 'diabetes')
    const fontaine = ptsOpc(itbCampos, v, 'fontaine') ?? 1
    const critica = fontaine >= 4

    const classificacao = incompressivel
      ? 'Não compressível — não interpretável'
      : indice >= 1.0
        ? 'Normal'
        : indice >= 0.9
          ? 'Limítrofe'
          : indice >= 0.7
            ? 'Doença leve'
            : indice >= 0.4
              ? 'Doença moderada'
              : 'Doença grave'

    const nivel: Nivel = incompressivel ? 'atencao' : indice < 0.4 || critica ? 'critico' : indice < 0.9 ? 'alerta' : 'ok'

    const conduta: string[] = []
    if (critica) {
      conduta.push('**Isquemia crítica de membro (Fontaine III ou IV): emergência vascular.** Encaminhe para avaliação de revascularização com urgência — o risco de amputação em 1 ano sem revascularização é alto. Complete com angiotomografia ou arteriografia para mapear o leito distal, e trate infecção associada com antibiótico e desbridamento.')
    } else if (!incompressivel && indice < 0.9) {
      conduta.push('**Doença arterial periférica confirmada.** O tratamento de base é o mesmo em qualquer estágio sintomático: **programa supervisionado de exercício** (caminhar até a dor, descansar, repetir, por 30 a 45 minutos, 3 vezes por semana, por pelo menos 12 semanas) — é a intervenção com melhor evidência para distância de caminhada, superior à angioplastia isolada no seguimento a longo prazo.')
      conduta.push('Acrescente **cilostazol 100 mg duas vezes ao dia** para claudicação, contraindicado em insuficiência cardíaca. Revascularização fica reservada a claudicação limitante e refratária ao tratamento clínico, e a isquemia crítica.')
    } else if (incompressivel) {
      conduta.push('**Índice acima de 1,3: artéria incompressível, resultado não interpretável.** Prossiga com **índice hálux-braquial** (corte de 0,7), que usa artérias digitais poupadas da calcificação da média, ou com medida da pressão transcutânea de oxigênio e ultrassonografia com Doppler.')
    } else {
      conduta.push('**Índice normal em repouso não exclui doença arterial periférica** em paciente com claudicação típica. Faça o **índice pós-exercício**: queda de 20% ou mais após esforço padronizado confirma o diagnóstico que o repouso escondeu.')
    }
    conduta.push(
      '**Trate o paciente, e não a perna.** A doença arterial periférica é marcador de aterosclerose sistêmica: o risco de infarto e de acidente vascular nesses pacientes é maior que o de amputação, e a principal causa de morte é cardiovascular. Prescreva **estatina de alta intensidade** (meta de LDL abaixo de 55 mg/dL), **antiagregante** (clopidogrel tem leve vantagem sobre aspirina nessa população), controle pressórico e glicêmico.',
      '**Cessação do tabagismo é a intervenção isolada de maior impacto**: ela reduz progressão, amputação, eventos cardiovasculares e melhora a patência de qualquer revascularização feita.',
      'Considere **rivaroxabana 2,5 mg duas vezes ao dia associada a aspirina** (estratégia do ensaio COMPASS) em doença arterial periférica sintomática de alto risco: ela reduz eventos cardiovasculares maiores e eventos adversos maiores do membro, ao custo de mais sangramento.',
      'Em diabéticos, faça **exame dos pés em toda consulta**: inspeção, teste do monofilamento e palpação de pulsos. A neuropatia mascara a dor isquêmica, e a primeira manifestação pode ser diretamente a úlcera — o que torna a isquemia crítica um diagnóstico tardio justamente em quem tem mais risco.',
    )

    return {
      titulo: 'Índice tornozelo-braquial',
      valor: fmt(indice, 2),
      nivel,
      rotuloNivel: classificacao,
      detalhes: [
        { rotulo: 'Braquial (maior dos dois)', valor: `${fmtInt(braquial)} mmHg` },
        { rotulo: 'Tornozelo (maior das duas)', valor: `${fmtInt(tornozelo)} mmHg` },
        { rotulo: 'Índice', valor: fmt(indice, 2), nota: '> 1,3 não compressível · 1,0-1,3 normal · 0,9-0,99 limítrofe · 0,7-0,89 leve · 0,4-0,69 moderada · < 0,4 grave' },
        { rotulo: 'Estágio de Fontaine', valor: ['I', 'IIa', 'IIb', 'III', 'IV'][fontaine - 1], nivel: (critica ? 'critico' : fontaine >= 2 ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Diabetes ou doença renal', valor: diabetes ? 'Sim' : 'Não', nivel: (diabetes && incompressivel ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Diferença entre braquiais', valor: `${fmtInt(Math.abs(brqD - brqE))} mmHg`, nota: '> 15-20 mmHg sugere estenose de subclávia' },
      ],
      interpretacao: [
        `**Índice de ${fmt(indice, 2)} — ${classificacao.toLowerCase()}.** O corte diagnóstico é **0,90**, com sensibilidade em torno de 75% e especificidade acima de 95% para estenose maior que 50% em comparação à arteriografia.`,
        incompressivel
          ? `**Índice acima de 1,3 significa artéria incompressível, não artéria saudável.** A calcificação da camada média — esclerose de Mönckeberg — impede o colabamento do vaso pelo manguito, e o resultado é falsamente alto. ${diabetes ? 'O diabetes ou a doença renal assinalados explicam esse achado.' : 'Isso ocorre em diabetes, doença renal crônica avançada e idade muito avançada.'} Use o **índice hálux-braquial**, cujo corte é 0,7.`
          : indice < 0.4
            ? '**Índice abaixo de 0,4 indica doença grave**, com pressão de perfusão insuficiente para cicatrização — é a faixa associada a dor em repouso, úlcera que não fecha e risco de amputação.'
            : indice < 0.9
              ? 'Índice abaixo de 0,90 confirma doença arterial periférica. Lembre que **a maioria dos portadores é assintomática ou tem sintoma atípico**, e que a ausência de claudicação clássica não afasta o diagnóstico.'
              : 'Índice dentro da faixa normal em repouso. Se houver claudicação típica, faça o índice **pós-exercício**: queda de 20% ou mais confirma doença que o repouso não revelou.',
        `**Fontaine ${['I', 'IIa', 'IIb', 'III', 'IV'][fontaine - 1]}.** A classificação de Fontaine tem 4 estágios (com o II subdividido) e a de **Rutherford** tem 7 categorias em 4 graus, mais granular e preferida em publicações cirúrgicas. A equivalência prática: Fontaine I ≈ Rutherford 0; IIa ≈ 1; IIb ≈ 2-3; III ≈ 4; IV ≈ 5-6.`,
        critica
          ? '**Fontaine III e IV constituem isquemia crítica de membro**, com risco de amputação e mortalidade em 1 ano comparável à de várias neoplasias. É condição diferente da claudicação, que é estável e tem tratamento clínico.'
          : 'A claudicação intermitente é relativamente estável ao longo do tempo: cerca de 75% dos pacientes permanecem estáveis ou melhoram, e apenas uma minoria progride para isquemia crítica.',
      ],
      conduta,
      alertas: [
        '**Índice acima de 1,3 não é bom sinal** — é artéria incompressível por calcificação, e o resultado não pode ser usado. Em diabético e em renal crônico, esse achado é frequente.',
        'Índice normal em repouso não exclui doença em quem tem claudicação típica: o índice pós-exercício é o exame que fecha o diagnóstico nesses casos.',
        'Em diabéticos com neuropatia, a dor isquêmica é mascarada e a primeira manifestação pode ser a úlcera. Exame dos pés em toda consulta, com monofilamento e palpação de pulsos.',
      ],
    }
  },
  formula: ['ITB = maior pressão do tornozelo (tibial posterior ou pediosa) ÷ maior pressão braquial', 'Fontaine I a IV · Rutherford 0 a 6'],
  fundamento:
    'O índice tornozelo-braquial se apoia num princípio hidrostático simples: em pessoas sem doença arterial, a pressão sistólica no tornozelo é **igual ou levemente maior** que a braquial, porque a onda de pulso sofre amplificação ao se propagar para a periferia — a reflexão da onda nos leitos distais soma-se à onda incidente e eleva o pico sistólico. Qualquer estenose hemodinamicamente significativa proximal a esse ponto dissipa energia e derruba a pressão distal, e é essa queda que o índice mede. A estenose só se torna hemodinamicamente relevante em repouso quando ultrapassa cerca de 50% do diâmetro, porque abaixo disso a vasodilatação compensatória do leito distal mantém o fluxo — e é exatamente por isso que o índice pode ser normal em repouso e cair após o exercício, quando a demanda esgota essa reserva. A dor da claudicação surge do descompasso entre oferta e demanda no músculo em atividade, com acúmulo de metabólitos e ativação de aferentes do grupo III e IV; a dor em repouso aparece quando a pressão de perfusão já não sustenta nem o metabolismo basal, tipicamente com índice abaixo de 0,4, e piora com a elevação do membro por perda do componente gravitacional — o que explica o paciente que dorme com a perna pendente para fora da cama. A armadilha do índice falsamente alto tem mecanismo próprio: na esclerose de Mönckeberg, a calcificação se deposita na **camada média**, e não na íntima, tornando a parede rígida e incompressível pelo manguito sem que o lúmen esteja necessariamente comprometido.',
  armadilhas: [
    'Medir a pressão do tornozelo com estetoscópio em vez de Doppler subestima e invalida o índice.',
    'Usar a pressão de apenas um braço ignora estenose de subclávia, que derruba o numerador do lado afetado e superestima o índice.',
    'Índice entre 0,90 e 0,99 é zona limítrofe: com sintoma típico, prossiga com índice pós-exercício.',
    'A maioria dos portadores de doença arterial periférica é assintomática ou tem sintoma atípico — ausência de claudicação clássica não afasta.',
  ],
  referencias: [
    { texto: 'Aboyans V, Criqui MH, Abraham P, et al. Measurement and interpretation of the ankle-brachial index: a scientific statement from the American Heart Association. Circulation. 2012;126(24):2890-2909.' },
    { texto: 'Gerhard-Herman MD, Gornik HL, Barrett C, et al. 2016 AHA/ACC Guideline on the Management of Patients With Lower Extremity Peripheral Artery Disease. Circulation. 2017;135(12):e726-e779.' },
    { texto: 'Eikelboom JW, Connolly SJ, Bosch J, et al. Rivaroxaban with or without aspirin in stable cardiovascular disease (COMPASS). N Engl J Med. 2017;377(14):1319-1330.' },
  ],
}

/* ═══════════ Canadian Syncope Risk Score ═══════════ */

const sincopeCampos: Campo[] = [
  campoOpc('predisposicao', 'Predisposição a síncope vasovagal (ambiente quente e cheio, dor, emoção, posição ortostática prolongada)', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '-1', rotulo: 'Presente', pontos: -1 },
  ], { padrao: '0', ajuda: 'É o único item que **subtrai** ponto. O pródromo vasovagal — calor, náusea, sudorese, visão turva, palidez — em contexto compatível reduz o risco de evento grave.' }),
  campoOpc('cardiopatia', 'História de cardiopatia (doença coronariana, valvopatia, arritmia, insuficiência cardíaca)', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '1', rotulo: 'Presente', pontos: 1 },
  ], { padrao: '0' }),
  campoNum('pas', 'Pressão sistólica mais alterada na emergência', { unidade: 'mmHg', min: 40, max: 300, passo: 1, ajuda: 'Use o valor **mais anormal** registrado na emergência. Sistólica **abaixo de 90 ou acima de 180 mmHg** soma 2 pontos.' }),
  campoNum('troponina', 'Troponina (múltiplos do percentil 99)', { min: 0, max: 100, passo: 0.1, opcional: true, ajuda: 'Expresse em múltiplos do limite superior de referência do seu laboratório. Acima do percentil 99 soma 2 pontos — mas troponina elevada na síncope exige diferenciar lesão miocárdica por isquemia de lesão por outra causa.' }),
  campoOpc('qrs', 'QRS acima de 130 ms', [
    { valor: '0', rotulo: 'Não', pontos: 0 },
    { valor: '1', rotulo: 'Sim', pontos: 1 },
  ], { padrao: '0', ajuda: 'QRS alargado sugere doença do sistema de condução, que é substrato para bloqueio atrioventricular paroxístico — uma das causas arrítmicas de síncope mais perigosas justamente por não aparecer no eletrocardiograma entre os episódios.' }),
  campoOpc('qtc', 'QTc acima de 480 ms', [
    { valor: '0', rotulo: 'Não', pontos: 0 },
    { valor: '2', rotulo: 'Sim', pontos: 2 },
  ], { padrao: '0' }),
  campoOpc('diagnostico', 'Diagnóstico na emergência', [
    { valor: '0', rotulo: 'Nenhum dos dois', pontos: 0 },
    { valor: '-2', rotulo: 'Síncope vasovagal', pontos: -2 },
    { valor: '2', rotulo: 'Síncope cardíaca', pontos: 2 },
  ], { padrao: '0', ajuda: 'O diagnóstico do emergencista ao fim da avaliação. Vasovagal **subtrai 2**; cardíaca **soma 2**. É o item de maior amplitude do escore.' }),
]

const sincope: Ferramenta = {
  id: 'canadian-syncope',
  nome: 'Canadian Syncope Risk Score',
  sigla: 'CSRS',
  sinonimos: ['sincope', 'csrs', 'canadian syncope', 'desmaio', 'perda de consciencia transitoria'],
  resumo: 'Estima o risco de evento adverso grave em 30 dias após síncope e define quem pode ir para casa da emergência.',
  categorias: ['cardiologia', 'emergencia'],
  campos: sincopeCampos,
  calcular: (v) => {
    const pas = num(v, 'pas')
    if (pas === null) return null
    const trop = num(v, 'troponina')

    const itens = ['predisposicao', 'cardiopatia', 'qrs', 'qtc', 'diagnostico']
    const pontos = itens.map((id) => ptsOpc(sincopeCampos, v, id))
    if (pontos.some((p) => p === null)) return null
    const pontosPas = pas < 90 || pas > 180 ? 2 : 0
    const pontosTrop = trop !== null && trop > 1 ? 2 : 0
    const total = (pontos as number[]).reduce((a, b) => a + b, 0) + pontosPas + pontosTrop

    const faixa = total <= -2 ? 'Muito baixo' : total <= 0 ? 'Baixo' : total <= 3 ? 'Médio' : total <= 5 ? 'Alto' : 'Muito alto'
    const risco = total <= -2 ? '0,4-0,7%' : total <= 0 ? '1,2-1,9%' : total <= 3 ? '3,1-8,1%' : total <= 5 ? '12,9-19,7%' : '28,9-83,6%'
    const nivel: Nivel = total >= 4 ? 'critico' : total >= 1 ? 'alerta' : 'ok'

    return {
      titulo: 'Canadian Syncope Risk Score',
      valor: fmtInt(total),
      unidade: 'de −3 a +11',
      nivel,
      rotuloNivel: `Risco ${faixa.toLowerCase()} — ${risco} em 30 dias`,
      detalhes: [
        { rotulo: 'Predisposição vasovagal', valor: fmtInt(pontos[0] as number) },
        { rotulo: 'História de cardiopatia', valor: fmtInt(pontos[1] as number) },
        { rotulo: 'Sistólica < 90 ou > 180', valor: `${fmtInt(pontosPas)} (${fmtInt(pas)} mmHg)`, nivel: (pontosPas > 0 ? 'alerta' : 'ok') as Nivel },
        ...(trop !== null ? [{ rotulo: 'Troponina', valor: fmtInt(pontosTrop), nivel: (pontosTrop > 0 ? 'alerta' : 'ok') as Nivel }] : []),
        { rotulo: 'QRS > 130 ms', valor: fmtInt(pontos[2] as number) },
        { rotulo: 'QTc > 480 ms', valor: fmtInt(pontos[3] as number) },
        { rotulo: 'Diagnóstico na emergência', valor: fmtInt(pontos[4] as number) },
      ],
      interpretacao: [
        `**${total} pontos — risco ${faixa.toLowerCase()}, com probabilidade de evento adverso grave em 30 dias de aproximadamente ${risco}.** O escore vai de −3 a +11, e dois itens **subtraem**: predisposição vasovagal (−1) e diagnóstico de síncope vasovagal na emergência (−2).`,
        'O desfecho que o escore prediz é **evento adverso grave em 30 dias**: morte, arritmia ventricular, bradiarritmia significativa, infarto, doença estrutural cardíaca grave, dissecção de aorta, embolia pulmonar, hemorragia grave e necessidade de intervenção.',
        total <= 0
          ? '**Risco baixo ou muito baixo: a alta da emergência é segura**, com seguimento ambulatorial. Nessa faixa, a observação hospitalar prolongada não melhora desfecho e expõe a custo, imobilidade e eventos iatrogênicos.'
          : total <= 3
            ? '**Risco médio:** considere observação de 4 a 6 horas com monitorização, e defina a conduta conforme a evolução e o resultado de exames dirigidos.'
            : '**Risco alto ou muito alto:** monitorização e investigação hospitalar. Nessa faixa, o risco de arritmia grave justifica internação.',
        'O escore foi derivado em mais de 4 mil pacientes e validado em coorte independente, com desempenho superior ao de OESIL, EGSYS e San Francisco. Sua força está em **permitir a alta com segurança**, não em decidir quem interna — nos grupos de alto risco, o julgamento clínico continua mandando.',
      ],
      conduta: [
        total <= 0
          ? '**Alta com seguimento ambulatorial.** Oriente sobre medidas de prevenção da síncope vasovagal: hidratação e sal, reconhecimento do pródromo, manobras de contrapressão física (cruzar as pernas e contrair, apertar as mãos, tensionar os braços), e evitar gatilhos conhecidos.'
          : '**Monitorização cardíaca.** A maioria dos eventos arrítmicos graves ocorre nas primeiras horas; a monitorização prolongada em ambiente hospitalar tem rendimento decrescente, e o **monitor de eventos ambulatorial ou o looper implantável** rendem mais em síncope recorrente de causa indefinida.',
        '**Faça a avaliação inicial completa em todo caso**, que é o que mais rende: história detalhada do episódio (pródromo, posição, gatilho, duração, recuperação, testemunhas), exame físico com **pressão em pé** para hipotensão ortostática, e **eletrocardiograma**. Essa tríade identifica a causa em cerca de metade dos casos.',
        'Procure as **bandeiras vermelhas** que apontam causa cardíaca, independentemente do escore: síncope durante o esforço (não após), síncope em decúbito, ausência de pródromo, palpitações precedendo, história familiar de morte súbita antes dos 50 anos, sopro novo, e alteração eletrocardiográfica.',
        'Não peça exames de rotina sem hipótese: **tomografia de crânio, eletroencefalograma e carótidas têm rendimento muito baixo** na síncope típica e são a fonte mais comum de investigação desnecessária. Peça-os apenas com déficit neurológico focal, trauma craniano significativo ou suspeita real de crise epiléptica.',
        'Diferencie **síncope de crise epiléptica**: mioclonias breves durante a síncope são comuns e não indicam epilepsia; o que aponta crise é a mordedura **lateral** da língua, a confusão pós-ictal prolongada, o desvio ocular tônico e a aura estereotipada.',
      ],
      alertas: [
        '**Síncope durante o esforço é cardíaca até prova em contrário** — estenose aórtica, cardiomiopatia hipertrófica, anomalia coronariana, taquicardia ventricular catecolaminérgica. Síncope logo **após** o esforço costuma ser vasovagal.',
        'Nenhum escore substitui a investigação de **bandeiras vermelhas**: história familiar de morte súbita precoce, palpitações precedendo, síncope em decúbito e ECG alterado pedem investigação mesmo com escore baixo.',
        'Tomografia de crânio e eletroencefalograma de rotina na síncope típica têm rendimento próximo de zero e devem ser reservados a indicação específica.',
      ],
    }
  },
  formula: [
    'Predisposição vasovagal −1 · cardiopatia +1 · sistólica < 90 ou > 180 +2 · troponina elevada +2 · QRS > 130 ms +1 · QTc > 480 ms +2',
    'Diagnóstico: vasovagal −2 · cardíaca +2 · Total de −3 a +11',
    '≤ −2 muito baixo · −1 a 0 baixo · 1 a 3 médio · 4 a 5 alto · ≥ 6 muito alto',
  ],
  fundamento:
    'A síncope é a perda transitória de consciência por **hipoperfusão cerebral global**, e o cérebro tolera essa interrupção por muito pouco: a perda de consciência ocorre após cerca de 6 a 8 segundos de fluxo cessado, ou quando o fluxo cerebral cai para menos de 20 a 30% do basal. Os três mecanismos que produzem isso definem os três grandes grupos, e é essa separação que o escore tenta capturar. A síncope **reflexa ou vasovagal** — a mais comum e a de melhor prognóstico — decorre de um reflexo paradoxal: a redução do retorno venoso ativa mecanorreceptores ventriculares num ventrículo pouco preenchido e vigorosamente contraído, gerando aferência que o tronco encefálico interpreta como hipertensão e respondendo com retirada simpática e ativação vagal, o que produz vasodilatação e bradicardia simultâneas. A **hipotensão ortostática** decorre de falha da vasoconstrição compensatória, por depleção de volume, fármaco ou disautonomia. A síncope **cardíaca** é a que mata: arritmia (bradiarritmia paroxística ou taquiarritmia ventricular) ou obstrução mecânica ao fluxo (estenose aórtica, cardiomiopatia hipertrófica, embolia, tamponamento, mixoma). É por isso que os itens do escore que mais somam pontos são marcadores de substrato cardíaco — QRS alargado, QTc prolongado, troponina, pressão anormal e diagnóstico de síncope cardíaca —, enquanto o contexto vasovagal é o único que subtrai.',
  armadilhas: [
    'O escore não se aplica a perda de consciência por trauma craniano, intoxicação, crise epiléptica ou hipoglicemia — que não são síncope.',
    'Ele foi construído para prever evento em 30 dias, não para decidir internação: risco baixo autoriza alta com segurança, mas risco alto não obriga a uma conduta específica.',
    'Troponina discretamente elevada na síncope é comum e frequentemente reflete lesão miocárdica não isquêmica; interpretá-la como infarto desencadeia investigação desnecessária.',
    'Mioclonias durante a síncope são frequentes e não significam epilepsia — a "síncope convulsiva" é reconhecida e não deve levar a antiepiléptico.',
  ],
  referencias: [
    { texto: 'Thiruganasambandamoorthy V, Kwong K, Wells GA, et al. Development of the Canadian Syncope Risk Score to predict serious adverse events after emergency department assessment of syncope. CMAJ. 2016;188(12):E289-E298.' },
    { texto: 'Thiruganasambandamoorthy V, Sivilotti MLA, Le Sage N, et al. Multicenter Emergency Department Validation of the Canadian Syncope Risk Score. JAMA Intern Med. 2020;180(5):737-744.' },
    { texto: 'Brignole M, Moya A, de Lange FJ, et al. 2018 ESC Guidelines for the diagnosis and management of syncope. Eur Heart J. 2018;39(21):1883-1948.' },
  ],
}

/* ═══════════ CRUSADE — risco de sangramento na síndrome coronariana ═══════════ */

const crusadeCampos: Campo[] = [
  campoNum('hematocrito', 'Hematócrito basal', { unidade: '%', min: 15, max: 60, passo: 0.1, ajuda: 'Hematócrito baixo é o preditor mais forte do escore e frequentemente reflete sangramento já existente, ainda não identificado — anemia na admissão de uma síndrome coronariana merece investigação, não apenas registro.' }),
  campoNum('clearance', 'Clearance de creatinina (Cockcroft-Gault)', { unidade: 'mL/min', min: 5, max: 200, passo: 1, ajuda: 'Use **Cockcroft-Gault**, que foi a fórmula da derivação. A função renal pesa muito no escore porque a maioria dos antitrombóticos tem eliminação renal, e a subdosagem por não ajustar é uma das causas mais comuns de sangramento iatrogênico.' }),
  campoNum('fc', 'Frequência cardíaca', { unidade: 'bpm', min: 30, max: 200, passo: 1 }),
  campoNum('pas', 'Pressão arterial sistólica', { unidade: 'mmHg', min: 50, max: 250, passo: 1, ajuda: 'Tanto a hipotensão (abaixo de 110 mmHg) quanto a hipertensão acentuada (acima de 180 mmHg) somam pontos — a curva de risco é em U.' }),
  campoSexo('sexo', 'Sexo biológico'),
  campoSimNao('icc', 'Sinais de insuficiência cardíaca na admissão', 0, undefined),
  campoSimNao('vascular', 'Doença vascular prévia (arterial periférica ou acidente vascular cerebral)', 0, undefined),
  campoSimNao('diabetes', 'Diabetes mellitus', 0, undefined),
]

const crusade: Ferramenta = {
  id: 'crusade',
  nome: 'CRUSADE — risco de sangramento maior na síndrome coronariana',
  sigla: 'CRUSADE',
  sinonimos: ['crusade', 'sangramento sca', 'risco hemorragico', 'sangramento coronariana'],
  resumo: 'Estima o risco de sangramento maior intra-hospitalar na síndrome coronariana sem supra e orienta o ajuste dos antitrombóticos.',
  categorias: ['cardiologia', 'emergencia', 'hematologia'],
  campos: crusadeCampos,
  calcular: (v) => {
    const ht = num(v, 'hematocrito')
    const cl = num(v, 'clearance')
    const fc = num(v, 'fc')
    const pas = num(v, 'pas')
    if (ht === null || cl === null || fc === null || pas === null) return null

    const pHt = ht < 31 ? 9 : ht < 34 ? 7 : ht < 37 ? 3 : ht < 40 ? 2 : 0
    const pCl = cl <= 15 ? 39 : cl <= 30 ? 35 : cl <= 60 ? 28 : cl <= 90 ? 17 : cl <= 120 ? 7 : 0
    const pFc = fc <= 70 ? 0 : fc <= 80 ? 1 : fc <= 90 ? 3 : fc <= 100 ? 6 : fc <= 110 ? 8 : fc <= 120 ? 10 : 11
    const pPas = pas <= 90 ? 10 : pas <= 100 ? 8 : pas <= 120 ? 5 : pas <= 180 ? 1 : pas <= 200 ? 3 : 5
    const pSexo = opc(v, 'sexo') === 'f' ? 8 : 0
    const pIcc = sim(v, 'icc') ? 7 : 0
    const pVasc = sim(v, 'vascular') ? 6 : 0
    const pDm = sim(v, 'diabetes') ? 6 : 0

    const total = pHt + pCl + pFc + pPas + pSexo + pIcc + pVasc + pDm
    const faixa = total <= 20 ? 'Muito baixo' : total <= 30 ? 'Baixo' : total <= 40 ? 'Moderado' : total <= 50 ? 'Alto' : 'Muito alto'
    const risco = total <= 20 ? '3,1%' : total <= 30 ? '5,5%' : total <= 40 ? '8,6%' : total <= 50 ? '11,9%' : '19,5%'
    const nivel: Nivel = total > 50 ? 'critico' : total > 40 ? 'alerta' : total > 30 ? 'atencao' : 'ok'

    return {
      titulo: 'CRUSADE',
      valor: fmtInt(total),
      unidade: 'de 100 pontos',
      nivel,
      rotuloNivel: `Risco ${faixa.toLowerCase()} — ${risco} de sangramento maior`,
      detalhes: [
        { rotulo: 'Hematócrito', valor: `${fmt(ht, 1)}% → ${pHt} pts`, nivel: (pHt >= 7 ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Clearance de creatinina', valor: `${fmtInt(cl)} mL/min → ${pCl} pts`, nivel: (pCl >= 28 ? 'alerta' : 'ok') as Nivel, nota: 'É o item de maior peso do escore' },
        { rotulo: 'Frequência cardíaca', valor: `${fmtInt(fc)} bpm → ${pFc} pts` },
        { rotulo: 'Pressão sistólica', valor: `${fmtInt(pas)} mmHg → ${pPas} pts`, nota: 'Curva em U: hipotensão e hipertensão somam' },
        { rotulo: 'Sexo feminino', valor: `${pSexo} pts` },
        { rotulo: 'Insuficiência cardíaca', valor: `${pIcc} pts` },
        { rotulo: 'Doença vascular prévia', valor: `${pVasc} pts` },
        { rotulo: 'Diabetes', valor: `${pDm} pts` },
      ],
      interpretacao: [
        `**${total} pontos — risco ${faixa.toLowerCase()}, com probabilidade de sangramento maior intra-hospitalar de aproximadamente ${risco}.** As faixas são: até 20 muito baixo, 21 a 30 baixo, 31 a 40 moderado, 41 a 50 alto, acima de 50 muito alto.`,
        '**O clearance de creatinina é o item de maior peso** — até 39 pontos, mais de um terço do escore. A razão é direta: heparinas de baixo peso molecular, inibidores da glicoproteína IIb/IIIa e alguns anticoagulantes têm eliminação renal, e a **subdosagem por não ajustar à função renal** é uma das causas mais frequentes de sangramento iatrogênico nessa população.',
        'O CRUSADE deve ser lido **junto com o GRACE**, não no lugar dele: um estima o risco isquêmico e o outro o hemorrágico, e a decisão clínica é o balanço entre os dois. Risco isquêmico alto com risco hemorrágico alto é a situação mais difícil, e nela o que se ajusta é a **intensidade e a duração** da terapia, não a sua existência.',
        total > 40
          ? '**Risco alto ou muito alto de sangramento.** Isso não contraindica a terapia antitrombótica — significa que cada escolha precisa ser feita com atenção: acesso radial, doses ajustadas, antiagregante de menor potência quando possível, e proteção gástrica.'
          : 'Risco de sangramento em faixa aceitável, o que dá margem para a terapia antitrombótica plena conforme o risco isquêmico.',
        'Anemia na admissão de uma síndrome coronariana **não é apenas um item do escore**: ela frequentemente sinaliza sangramento já em curso e não identificado, e merece investigação antes de se instalar a anticoagulação plena.',
      ],
      conduta: [
        '**Use acesso radial** em vez de femoral para o cateterismo: essa única escolha reduz sangramento maior e mortalidade, e o benefício é maior justamente nos pacientes de maior risco hemorrágico.',
        '**Ajuste as doses à função renal e ao peso.** A subdosagem por não ajustar é a causa modificável mais comum de sangramento: enoxaparina abaixo de 30 mL/min exige redução; inibidores de glicoproteína IIb/IIIa têm ajuste próprio; e fondaparinux tem menos sangramento que a enoxaparina na síndrome sem supra.',
        'Escolha o **antiagregante** considerando o balanço: prasugrel é contraindicado com acidente vascular prévio e desaconselhado acima de 75 anos ou abaixo de 60 kg; ticagrelor tem mais sangramento espontâneo que o clopidogrel; e o clopidogrel é a opção de menor potência quando o risco hemorrágico domina.',
        'Prescreva **inibidor de bomba de prótons** em quem usa dupla antiagregação com risco gastrointestinal: idade acima de 65 anos, úlcera prévia, infecção por *Helicobacter pylori*, uso de anticoagulante, corticoide ou anti-inflamatório.',
        'Considere **encurtar a dupla antiagregação** em risco hemorrágico alto — estratégias de 1 a 3 meses seguidas de monoterapia com inibidor de P2Y12 mostraram redução de sangramento sem aumento de eventos isquêmicos em populações selecionadas.',
        'Monitore **hemoglobina e função renal** durante a internação, e investigue qualquer queda: sangramento gastrointestinal, retroperitoneal (após acesso femoral) e do sítio de punção são os mais frequentes, e o retroperitoneal se apresenta com dor lombar e hipotensão sem sangramento visível.',
      ],
      alertas: [
        '**Risco hemorrágico alto não contraindica antitrombótico** em síndrome coronariana — ele orienta o ajuste de via, dose, escolha e duração. Negar a terapia por medo de sangrar troca um risco conhecido por outro maior.',
        'O CRUSADE foi derivado em síndrome coronariana **sem supra de ST** tratada conforme a prática dos anos 2000; ele subestima ou superestima em cenários com acesso radial rotineiro e antiagregantes modernos, e deve ser lido como estimativa relativa.',
        'Anemia na admissão pode ser sangramento em curso ainda não identificado. Investigue antes de anticoagular plenamente.',
      ],
    }
  },
  formula: ['CRUSADE = hematócrito + clearance de creatinina + frequência + sistólica + sexo feminino + insuficiência cardíaca + doença vascular + diabetes', 'Faixas: ≤ 20 muito baixo · 21-30 baixo · 31-40 moderado · 41-50 alto · > 50 muito alto'],
  fundamento:
    'O tratamento da síndrome coronariana aguda é, por natureza, um exercício de equilíbrio entre dois riscos opostos: a terapia antitrombótica que impede a progressão do trombo coronariano é a mesma que provoca sangramento em outro lugar. Durante anos esse segundo risco foi tratado como efeito colateral aceitável, até que estudos mostraram que o **sangramento maior intra-hospitalar tem impacto prognóstico comparável ao do próprio reinfarto** — ele aumenta a mortalidade em 30 dias e em 1 ano, tanto pelo evento em si (hipotensão, transfusão, isquemia por anemia) quanto pelo que ele desencadeia: suspensão dos antitrombóticos, trombose de stent e reinfarto. O CRUSADE captura os determinantes desse risco, e os pesos revelam a fisiologia. A **função renal** domina porque o rim elimina a maior parte dos antitrombóticos, e porque a uremia causa disfunção plaquetária qualitativa por acúmulo de toxinas que interferem na agregação mediada pelo receptor IIb/IIIa. O **hematócrito baixo** pesa por dois motivos simultâneos: pode indicar sangramento já ocorrido e reduz a marginação de plaquetas na parede do vaso — as hemácias, ao ocuparem o centro do fluxo, empurram as plaquetas para a periferia, e menos hemácias significam hemostasia primária menos eficiente. O **sexo feminino** soma pontos por menor superfície corporal, maior prevalência de doença renal não reconhecida e uma tendência documentada a receber doses excessivas de antitrombótico.',
  armadilhas: [
    'Foi derivado em síndrome sem supra de ST; aplicá-lo ao infarto com supra ou à fibrilação atrial é extrapolação.',
    'A derivação precede o uso rotineiro do acesso radial e dos antiagregantes de nova geração, o que altera as taxas absolutas.',
    'Use Cockcroft-Gault, e não CKD-EPI: a fórmula da derivação importa, e as duas divergem em extremos de peso.',
    'O escore não inclui uso prévio de anticoagulante oral, trombocitopenia nem história de sangramento — três fatores de peso que exigem julgamento à parte.',
  ],
  referencias: [
    { texto: 'Subherwal S, Bach RG, Chen AY, et al. Baseline risk of major bleeding in non-ST-segment-elevation myocardial infarction: the CRUSADE bleeding score. Circulation. 2009;119(14):1873-1882.' },
    { texto: 'Valgimigli M, Bueno H, Byrne RA, et al. 2017 ESC focused update on dual antiplatelet therapy in coronary artery disease. Eur Heart J. 2018;39(3):213-260.' },
    { texto: 'Byrne RA, Rossello X, Coughlan JJ, et al. 2023 ESC Guidelines for the management of acute coronary syndromes. Eur Heart J. 2023;44(38):3720-3826.' },
  ],
}

export const ferramentas: Ferramenta[] = [
  fcEcg,
  qtc,
  comparadorQT,
  eixo,
  criteriosHVE,
  sokolow,
  cornell,
  heart,
  timi,
  grace,
  chads,
  hasbled,
  wellsTep,
  wellsTvp,
  perc,
  genebra,
  dasi,
  debitoCardiaco,
  pam,
  riscoCv,
  duke,
  sanFrancisco,
  ldl,
  killip,
  sgarbossa,
  nyhaCcs,
  addrs,
  itb,
  sincope,
  crusade,
]

export default ferramentas
