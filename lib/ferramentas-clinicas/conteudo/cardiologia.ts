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
    campoNum('pequenos', 'Quadrados pequenos entre dois R', { min: 1, max: 200, passo: 1, mostrarSe: (v) => opc(v, 'metodo') === 'pequenos' }),
    campoNum('grandes', 'Quadrados grandes entre dois R', { min: 0.2, max: 40, passo: 0.2, mostrarSe: (v) => opc(v, 'metodo') === 'grandes' }),
    campoNum('qrs6s', 'QRS contados em 6 segundos (30 quadrados grandes)', { min: 0, max: 60, passo: 1, mostrarSe: (v) => opc(v, 'metodo') === 'irregular' }),
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
      ],
    }
  },
  formula: ['FC = 1500 ÷ (quadrados pequenos entre R-R)', 'FC = 300 ÷ (quadrados grandes entre R-R)', 'FC = QRS em 6 s × 10'],
  fundamento:
    'A régua do ECG é temporal: a 25 mm/s, cada milímetro é 0,04 s e cada quadrado grande (5 mm) é 0,20 s. Um minuto contém 1500 milímetros de papel, ou 300 quadrados grandes — por isso as duas constantes. O método dos 6 segundos existe porque a média é a única medida honesta quando o ritmo é irregular: em fibrilação atrial, dois RR consecutivos podem sugerir 40 e 140 bpm no mesmo traçado.',
  armadilhas: [
    'Verifique sempre a velocidade e a calibração impressas na tira. Traçado a 50 mm/s com leitura a 25 mm/s dobra o erro de todos os intervalos.',
    'Em bloqueio AV de segundo grau, a frequência ventricular e a atrial são diferentes — calcule as duas, medindo P-P e R-R separadamente.',
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
    campoNum('qt', 'Intervalo QT medido', { unidade: 'ms', min: 200, max: 800, passo: 1, padrao: '400' }),
    campoNum('fc', 'Frequência cardíaca', { unidade: 'bpm', min: 25, max: 250, passo: 1, padrao: '75' }),
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
  armadilhas: ['Registre sempre qual fórmula foi usada. Comparar um QTc de Bazett de hoje com um de Fridericia de ontem produz uma variação artificial.'],
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
    campoNum('avf', 'Amplitude líquida do QRS em aVF', { unidade: 'mm', min: -30, max: 30, passo: 0.5 }),
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
      ],
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
    campoNum('sv1', 'Onda S em V1', { unidade: 'mm', min: 0, max: 60, passo: 0.5 }),
    campoNum('rv5', 'Onda R em V5', { unidade: 'mm', min: 0, max: 60, passo: 0.5 }),
    campoNum('rv6', 'Onda R em V6', { unidade: 'mm', min: 0, max: 60, passo: 0.5 }),
    campoNum('ravl', 'Onda R em aVL', { unidade: 'mm', min: 0, max: 40, passo: 0.5 }),
    campoNum('sv3', 'Onda S em V3', { unidade: 'mm', min: 0, max: 60, passo: 0.5 }),
    campoNum('sProfunda', 'Onda S mais profunda de qualquer derivação precordial', { unidade: 'mm', min: 0, max: 60, passo: 0.5, ajuda: 'Usada no critério de Peguero-Lo Presti, o de melhor sensibilidade publicada.' }),
    campoNum('qrsDur', 'Duração do QRS', { unidade: 'ms', min: 60, max: 200, passo: 1, padrao: '90' }),
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
    campoNum('sv1', 'Onda S em V1', { unidade: 'mm', min: 0, max: 60, passo: 0.5 }),
    campoNum('rv5', 'Onda R em V5', { unidade: 'mm', min: 0, max: 60, passo: 0.5 }),
    campoNum('rv6', 'Onda R em V6', { unidade: 'mm', min: 0, max: 60, passo: 0.5 }),
    campoNum('ravl', 'Onda R em aVL', { unidade: 'mm', min: 0, max: 40, passo: 0.5, opcional: true }),
    campoNum('rv1', 'Onda R em V1', { unidade: 'mm', min: 0, max: 40, passo: 0.5, opcional: true, ajuda: 'Para o critério de hipertrofia ventricular direita.' }),
    campoNum('sv5v6', 'Onda S em V5 ou V6', { unidade: 'mm', min: 0, max: 40, passo: 0.5, opcional: true }),
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
      ],
    }
  },
  formula: ['HVE: S(V1) + R(V5 ou V6) ≥ 35 mm', 'HVE: R(aVL) ≥ 11 mm', 'HVD: R(V1) + S(V5 ou V6) > 10,5 mm'],
  fundamento:
    'A hipótese é direta: massa muscular maior gera vetor elétrico maior, e o vetor do ventrículo esquerdo aponta para a esquerda e para trás. Isso produz R alta nas precordiais esquerdas (V5-V6) e S profunda nas direitas (V1). Somar as duas amplifica o sinal e cancela parte da variação individual de posição do coração.',
  armadilhas: [
    'A distância entre o coração e o eletrodo domina o resultado: obesidade e enfisema reduzem a voltagem, magreza a aumenta.',
    'Bloqueio de ramo esquerdo invalida o critério.',
  ],
  referencias: [{ texto: 'Sokolow M, Lyon TP. The ventricular complex in left ventricular hypertrophy as obtained by unipolar precordial and limb leads. Am Heart J. 1949;37(2):161-186.' }],
}

const cornell: Ferramenta = {
  id: 'cornell',
  nome: 'Critério de Cornell e produto de Cornell',
  sinonimos: ['cornell voltage', 'produto de cornell', 'cornell product'],
  resumo: 'Critério de voltagem com pontos de corte por sexo e a versão multiplicada pela duração do QRS.',
  categorias: ['cardiologia'],
  campos: [
    campoSexo(),
    campoNum('ravl', 'Onda R em aVL', { unidade: 'mm', min: 0, max: 40, passo: 0.5 }),
    campoNum('sv3', 'Onda S em V3', { unidade: 'mm', min: 0, max: 60, passo: 0.5 }),
    campoNum('qrs', 'Duração do QRS', { unidade: 'ms', min: 60, max: 200, passo: 1, padrao: '90' }),
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
      ],
    }
  },
  formula: ['Cornell: R(aVL) + S(V3) > 28 mm (♂) ou > 20 mm (♀)', 'Produto: [Cornell (+6 mm se ♀)] × QRS > 2440 mm·ms'],
  fundamento:
    'Ao acrescentar a duração do QRS, o produto de Cornell incorpora a segunda consequência elétrica da hipertrofia: o tempo maior que a frente de despolarização leva para percorrer uma parede mais espessa. Isso eleva a sensibilidade sem sacrificar a especificidade, o que raramente acontece quando se ajusta um critério diagnóstico.',
  armadilhas: ['Não some 6 mm em homens — o ajuste é exclusivo do produto e exclusivo do sexo feminino.'],
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
    campoNum('fc', 'Frequência cardíaca', { unidade: 'bpm', min: 20, max: 250, passo: 1 }),
    campoNum('pas', 'Pressão arterial sistólica', { unidade: 'mmHg', min: 40, max: 260, passo: 1 }),
    campoNum('creatinina', 'Creatinina sérica', { unidade: 'mg/dL', min: 0.1, max: 15, passo: 0.01 }),
    campoOpc('killip', 'Classe de Killip', [
      { valor: '1', rotulo: 'I — sem sinais de insuficiência cardíaca', pontos: 0 },
      { valor: '2', rotulo: 'II — estertores, B3 ou turgência jugular', pontos: 20 },
      { valor: '3', rotulo: 'III — edema agudo de pulmão', pontos: 39 },
      { valor: '4', rotulo: 'IV — choque cardiogênico', pontos: 59 },
    ]),
    campoSimNao('parada', 'Parada cardíaca na admissão', 39),
    campoSimNao('desvioST', 'Desvio do segmento ST', 28),
    campoSimNao('marcadores', 'Marcadores de necrose elevados', 14),
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
    campoSimNao('cancer', 'Neoplasia ativa (tratamento atual, nos últimos 6 meses ou paliativo)', 1),
    campoSimNao('paralisia', 'Paralisia, paresia ou imobilização gessada recente de membro inferior', 1),
    campoSimNao('acamado', 'Acamado ≥ 3 dias ou cirurgia de grande porte nas últimas 12 semanas', 1),
    campoSimNao('dor', 'Dor localizada ao longo do trajeto venoso profundo', 1),
    campoSimNao('edemaTodo', 'Edema de todo o membro inferior', 1),
    campoSimNao('panturrilha', 'Panturrilha ≥ 3 cm maior que a contralateral (10 cm abaixo da tuberosidade tibial)', 1),
    campoSimNao('cacifo', 'Edema depressível restrito ao membro sintomático', 1),
    campoSimNao('colaterais', 'Veias superficiais colaterais não varicosas', 1),
    campoSimNao('tvpPrevia', 'TVP previamente documentada', 1),
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
    campoSimNao('sao2', 'SpO₂ < 95% em ar ambiente', 1),
    campoSimNao('edema', 'Edema unilateral de membro inferior', 1),
    campoSimNao('hemoptise', 'Hemoptise', 1),
    campoSimNao('trauma', 'Trauma ou cirurgia com internação nas últimas 4 semanas', 1),
    campoSimNao('tepPrevio', 'TEP ou TVP prévios', 1),
    campoSimNao('hormonio', 'Uso de hormônio exógeno (estrogênio)', 1),
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
    campoSimNao('idade', 'Idade > 65 anos', 1),
    campoSimNao('previo', 'TVP ou TEP prévios', 3),
    campoSimNao('cirurgia', 'Cirurgia sob anestesia geral ou fratura de membro inferior no último mês', 2),
    campoSimNao('cancer', 'Neoplasia sólida ou hematológica ativa, ou curada há menos de 1 ano', 2),
    campoSimNao('dorUnilateral', 'Dor unilateral em membro inferior', 3),
    campoSimNao('hemoptise', 'Hemoptise', 2),
    campoOpc('fc', 'Frequência cardíaca', [
      { valor: '0', rotulo: 'Menos de 75 bpm', pontos: 0 },
      { valor: '3', rotulo: '75 a 94 bpm', pontos: 3 },
      { valor: '5', rotulo: '95 bpm ou mais', pontos: 5 },
    ]),
    campoSimNao('palpacao', 'Dor à palpação de trajeto venoso profundo com edema unilateral', 4),
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
      ],
    }
  },
  formula: ['Soma ponderada de 8 critérios objetivos', 'Versão simplificada: 1 ponto por item (FC ≥ 95 vale 2)'],
  fundamento:
    'O escore de Genebra revisado foi desenhado para eliminar a maior fragilidade do Wells: o item "diagnóstico alternativo menos provável", responsável por 3 pontos e por boa parte da variabilidade interobservador. Todas as suas variáveis são objetivas e verificáveis no prontuário, o que o torna adequado a aplicação por protocolo, por enfermagem ou por sistema informatizado.',
  armadilhas: [
    'Existem três versões em circulação (original de 2001, revisada de 2006 e simplificada de 2008), com pontuações diferentes. Registre qual foi usada.',
    'A frequência cardíaca é a de repouso na admissão, não a do momento da dor.',
  ],
  referencias: [
    { texto: 'Le Gal G, Righini M, Roy PM, et al. Prediction of pulmonary embolism in the emergency department: the revised Geneva score. Ann Intern Med. 2006;144(3):165-171.' },
    { texto: 'Klok FA, Mos IC, Nijkeuter M, et al. Simplification of the revised Geneva score for assessing clinical probability of pulmonary embolism. Arch Intern Med. 2008;168(19):2131-2136.' },
  ],
}

const dasiCampos: Campo[] = [
  campoSimNao('a1', 'Cuidar de si mesmo: comer, vestir-se, tomar banho, usar o banheiro', 2.75),
  campoSimNao('a2', 'Caminhar dentro de casa', 1.75),
  campoSimNao('a3', 'Caminhar 1 a 2 quarteirões no plano', 2.75),
  campoSimNao('a4', 'Subir um lance de escadas ou uma ladeira', 5.5),
  campoSimNao('a5', 'Correr uma distância curta', 8),
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
    campoNum('fc', 'Frequência cardíaca', { unidade: 'bpm', min: 20, max: 250, passo: 1, mostrarSe: (v) => opc(v, 'metodo') === 'vs' }),
    campoNum('vs', 'Volume sistólico', { unidade: 'mL', min: 5, max: 200, passo: 1, normalMin: 60, normalMax: 100, mostrarSe: (v) => opc(v, 'metodo') === 'vs' }),
    campoNum('vo2', 'Consumo de O₂ (VO₂)', { unidade: 'mL/min', min: 50, max: 800, passo: 5, padrao: '250', mostrarSe: (v) => opc(v, 'metodo') === 'fick', ajuda: 'Estimativa comum: 125 mL/min/m² de superfície corporal.' }),
    campoNum('hb', 'Hemoglobina', { unidade: 'g/dL', min: 3, max: 22, passo: 0.1, mostrarSe: (v) => opc(v, 'metodo') === 'fick' }),
    campoNum('sao2', 'SaO₂', { unidade: '%', min: 40, max: 100, passo: 0.1, padrao: '98', mostrarSe: (v) => opc(v, 'metodo') === 'fick' }),
    campoNum('svo2', 'SvO₂ (venosa mista)', { unidade: '%', min: 20, max: 100, passo: 0.1, padrao: '70', mostrarSe: (v) => opc(v, 'metodo') === 'fick' }),
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
    campoNum('pas', 'Pressão sistólica', { unidade: 'mmHg', min: 40, max: 280, passo: 1, normalMin: 100, normalMax: 130 }),
    campoNum('pad', 'Pressão diastólica', { unidade: 'mmHg', min: 20, max: 160, passo: 1, normalMin: 60, normalMax: 85 }),
    campoNum('fc', 'Frequência cardíaca', { unidade: 'bpm', min: 20, max: 250, passo: 1, opcional: true }),
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
    campoSimNao('c', 'História de insuficiência cardíaca congestiva', 1),
    campoSimNao('h', 'Hematócrito < 30%', 1),
    campoSimNao('e', 'ECG anormal', 1, 'Ritmo não sinusal, qualquer alteração nova, ou mudança em relação a traçado prévio.'),
    campoSimNao('s', 'Queixa de dispneia', 1),
    campoSimNao('s2', 'Pressão sistólica < 90 mmHg na triagem', 1),
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
      ],
    }
  },
  formula: ['CHESS: CHF, Hematócrito < 30%, ECG anormal, Shortness of breath, Sistólica < 90 mmHg'],
  fundamento:
    'A regra parte do princípio de que a síncope em si raramente é o problema — o problema é a doença que a causou. As cinco variáveis funcionam como marcadores de três mecanismos perigosos: cardiopatia estrutural (insuficiência cardíaca, ECG anormal), perda sanguínea oculta (hematócrito baixo, hipotensão) e doença cardiopulmonar aguda (dispneia).',
  armadilhas: [
    'A definição de "ECG anormal" é ampla e pouco padronizada, e é onde a variabilidade entre serviços é maior.',
    'A regra não se aplica a perda de consciência com causa já estabelecida (convulsão, hipoglicemia, trauma craniano, intoxicação).',
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
    campoNum('ct', 'Colesterol total', { unidade: 'mg/dL', min: 60, max: 600, passo: 1 }),
    campoNum('hdl', 'HDL-colesterol', { unidade: 'mg/dL', min: 10, max: 150, passo: 1 }),
    campoNum('tg', 'Triglicerídeos', { unidade: 'mg/dL', min: 20, max: 2000, passo: 1 }),
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
]

export default ferramentas
