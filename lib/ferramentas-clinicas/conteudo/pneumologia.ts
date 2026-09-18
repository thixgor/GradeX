import type { Ferramenta, Nivel, Resultado } from '../tipos'
import {
  campoAltura,
  campoNum,
  campoOpc,
  campoSeg,
  campoSexo,
  campoSimNao,
  fmt,
  fmtInt,
  fmtPct,
  num,
  numOu,
  opc,
  pesoPredito,
  pts,
  sim,
  somaSimNao,
} from '../helpers'

/* ═══════════════════ Ventilação mecânica: núcleo comum ═══════════════════ */

const campoSexoAltura = [campoSexo(), campoAltura({ ajuda: 'A altura é o único dado antropométrico que entra no peso predito — o peso real do paciente é irrelevante aqui, e essa é a essência da ventilação protetora.' })]

const pesoPreditoFerramenta: Ferramenta = {
  id: 'peso-predito',
  nome: 'Peso corporal predito e volume corrente protetor',
  sinonimos: ['pcp', 'peso ideal ventilacao', 'ardsnet', 'volume corrente'],
  resumo: 'Calcula o peso predito pela altura e devolve a faixa de volume corrente protetor.',
  categorias: ['pneumologia', 'emergencia'],
  campos: [
    ...campoSexoAltura,
    campoNum('mlkg', 'Volume corrente alvo', { unidade: 'mL/kg de peso predito', min: 3, max: 10, passo: 0.5, padrao: '6', ajuda: 'A ventilação protetora usa 6 mL/kg, com faixa aceitável de 4 a 8 conforme pH e driving pressure.' }),
    campoNum('pesoReal', 'Peso real (apenas para comparação)', { ajuda: 'Serve apenas para comparação. O volume corrente **nunca** é calculado sobre o peso real: o pulmão não cresce com a obesidade, e 6 mL/kg de peso real causa lesão induzida pela ventilação.', unidade: 'kg', min: 20, max: 350, passo: 0.5, opcional: true }),
  ],
  calcular: (v) => {
    const sexo = opc(v, 'sexo')
    const altura = num(v, 'altura')
    const mlkg = numOu(v, 'mlkg', 6)
    const pesoReal = num(v, 'pesoReal')
    if (altura === null) return null
    const pp = pesoPredito(sexo, altura)
    if (pp <= 0) return null
    const vt = pp * mlkg
    const detalhes: Resultado['detalhes'] = [
      { rotulo: `Volume corrente a ${fmt(mlkg, 1)} mL/kg`, valor: `${fmtInt(vt)} mL` },
      { rotulo: 'Faixa protetora (4 a 8 mL/kg)', valor: `${fmtInt(pp * 4)} a ${fmtInt(pp * 8)} mL` },
      { rotulo: 'Alvo inicial na SDRA (6 mL/kg)', valor: `${fmtInt(pp * 6)} mL` },
    ]
    if (pesoReal !== null) {
      const dif = ((pesoReal - pp) / pp) * 100
      detalhes.push({
        rotulo: 'Peso real x peso predito',
        valor: `${fmtInt(pesoReal)} kg vs ${fmtInt(pp)} kg`,
        nota: `Diferença de ${dif >= 0 ? '+' : ''}${fmtInt(dif)}%. Ventilar 6 mL/kg de peso **real** neste paciente entregaria ${fmtInt(pesoReal * 6)} mL — ${fmtInt(((pesoReal * 6) / (pp * 6) - 1) * 100)}% ${pesoReal > pp ? 'a mais' : 'a menos'} do que o correto.`,
        nivel: Math.abs(dif) > 25 ? 'alerta' : 'ok',
      })
    }
    return {
      titulo: 'Peso corporal predito',
      valor: fmt(pp, 1),
      unidade: 'kg',
      nivel: 'neutro',
      detalhes,
      conduta: [
        'Calcule o peso predito **pela altura e pelo sexo, nunca pelo peso real**: o pulmão não cresce com a obesidade. Prescrever 6 mL/kg sobre o peso real de um paciente de 120 kg entrega volumes que causam lesão induzida pela ventilação — esse é um dos erros mais consequentes da beira do leito.',
        'Meça a **altura de verdade** (fita métrica, ou estimativa pela distância joelho-calcanhar ou pela envergadura em paciente acamado). Um erro de 10 cm na altura muda o volume corrente prescrito em cerca de 50 mL, o que é clinicamente relevante em pulmão inflamado.',
        'Ajuste o volume corrente para **6 mL/kg de peso predito** em síndrome do desconforto respiratório agudo, com faixa aceitável de 4 a 8 mL/kg, e mantenha **pressão de platô ≤ 30 cmH₂O** e **driving pressure ≤ 15 cmH₂O**. A ventilação protetora reduziu mortalidade em termos absolutos de cerca de 9% no ensaio ARMA — poucos ajustes de parâmetro têm esse efeito.',
        'Aplique a ventilação protetora **também em pulmão sadio**, em ventilação intraoperatória e em pacientes sem lesão pulmonar: volumes altos causam lesão mesmo em pulmão previamente normal, e a estratégia protetora reduz complicações pulmonares pós-operatórias.',
        'Se o paciente apresentar **taquipneia ou acidose respiratória** com o volume protetor, a resposta é aumentar a frequência (até cerca de 35 irpm, vigiando auto-PEEP) e aceitar **hipercapnia permissiva** com pH até cerca de 7,20 — não é aumentar o volume corrente. Em hipoxemia refratária, escale para PEEP otimizada, bloqueio neuromuscular e **posição prona** por 16 h ou mais, que também reduz mortalidade.',
      ],
      alertas: [
        '**Nunca use o peso real.** O pulmão não cresce com a obesidade: 6 mL/kg sobre o peso real de um paciente de 120 kg entrega volumes que causam lesão induzida pela ventilação.',
        'Um erro de 10 cm na altura muda o volume corrente prescrito em cerca de 50 mL. Meça a altura de verdade, com fita métrica ou estimativa por envergadura no paciente acamado.',
      ],
      interpretacao: [
        'O pulmão não engorda. O volume de gás que ele comporta depende da altura, do sexo e da idade — não da massa gorda. Ventilar pelo peso real é o erro mais consequente da ventilação mecânica: entrega volumes muito acima do que o parênquima suporta em obesos, e volumes insuficientes em caquéticos.',
        'O estudo ARMA (ARDSNet, 2000) comparou 6 e 12 mL/kg de peso predito na SDRA e foi interrompido precocemente por benefício: mortalidade de 31% contra 39,8%. É um dos resultados mais robustos da medicina intensiva, e a fórmula usada aqui é exatamente a do protocolo.',
        'Volume corrente baixo com frequência alta gera acidose respiratória — a **hipercapnia permissiva** é aceita até pH em torno de 7,20 (alguns protocolos toleram 7,15). O pulmão vem antes do pH.',
      ],
    }
  },
  formula: ['Homens: PCP = 50 + 0,91 × (altura em cm − 152,4)', 'Mulheres: PCP = 45,5 + 0,91 × (altura em cm − 152,4)', 'VT = PCP × 6 mL/kg'],
  fundamento:
    'A fórmula do ARDSNet deriva das equações de Devine para peso ideal, convertidas para o sistema métrico. Sua utilidade não está em estimar peso — está em estimar **tamanho de pulmão**. Como a capacidade pulmonar total se correlaciona com a altura e o sexo, e como na SDRA o pulmão aerado disponível é ainda menor (o conceito de "baby lung"), normalizar o volume corrente pela altura é a única forma de entregar a mesma distensão relativa a pacientes de tamanhos diferentes.',
  armadilhas: [
    'Meça a altura, não pergunte. Pacientes superestimam a própria altura, e no acamado a estimativa pela distância joelho-calcanhar ou pela envergadura é mais confiável do que o chute.',
    'Peso predito não serve para dose de medicamento — para isso existem peso ideal e peso ajustado, com fórmulas diferentes.',
  ],
  referencias: [
    { texto: 'The Acute Respiratory Distress Syndrome Network. Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and ARDS. N Engl J Med. 2000;342(18):1301-1308.' },
    { texto: 'Fan E, Del Sorbo L, Goligher EC, et al. An official ATS/ESICM/SCCM clinical practice guideline: mechanical ventilation in adult patients with ARDS. Am J Respir Crit Care Med. 2017;195(9):1253-1263.' },
  ],
}

const mecanicaVentilatoria: Ferramenta = {
  id: 'mecanica-ventilatoria',
  nome: 'Driving pressure, complacências e resistência',
  sinonimos: ['driving pressure', 'complacencia', 'resistencia de vias aereas', 'mecanica respiratoria', 'pressao de distensao'],
  resumo: 'Extrai toda a mecânica respiratória de quatro números do ventilador.',
  categorias: ['pneumologia', 'emergencia'],
  campos: [
    campoNum('vt', 'Volume corrente', { unidade: 'mL', min: 50, max: 1200, passo: 5 }),
    campoNum('ppico', 'Pressão de pico', { unidade: 'cmH₂O', min: 5, max: 90, passo: 1 }),
    campoNum('pplato', 'Pressão de platô', { unidade: 'cmH₂O', min: 3, max: 80, passo: 1, ajuda: 'Medida com pausa inspiratória de 0,5 a 2 s, sem esforço do paciente. Sem pausa, o valor não é platô.' }),
    campoNum('peep', 'PEEP total', { unidade: 'cmH₂O', min: 0, max: 30, passo: 1, ajuda: 'Use a PEEP total, medida com pausa expiratória — não a PEEP programada, se houver auto-PEEP.' }),
    campoNum('fluxo', 'Fluxo inspiratório', { unidade: 'L/min', min: 10, max: 120, passo: 1, padrao: '60', opcional: true, ajuda: 'Necessário para a resistência. Em fluxo quadrado, é o valor programado.' }),
    ...campoSexoAltura.map((c) => ({ ...c, opcional: true })),
  ],
  calcular: (v) => {
    const vt = num(v, 'vt')
    const ppico = num(v, 'ppico')
    const pplato = num(v, 'pplato')
    const peep = num(v, 'peep')
    const fluxo = num(v, 'fluxo')
    const altura = num(v, 'altura')
    if (vt === null || pplato === null || peep === null) return null
    const dp = pplato - peep
    if (dp <= 0) return null
    const cstat = vt / dp
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Complacência estática', valor: `${fmt(cstat, 1)} mL/cmH₂O`, nota: 'Referência 50 a 100 mL/cmH₂O em pulmão sadio ventilado. Abaixo de 30 indica pulmão gravemente restritivo.', nivel: cstat < 25 ? 'critico' : cstat < 40 ? 'alerta' : 'ok' },
      { rotulo: 'Pressão de platô', valor: `${fmtInt(pplato)} cmH₂O`, nota: 'Limite de segurança: ≤ 30 cmH₂O. É a pressão que o alvéolo realmente vê no fim da inspiração.', nivel: pplato > 30 ? 'alerta' : 'ok' },
    ]
    if (ppico !== null) {
      const cdyn = vt / (ppico - peep)
      detalhes.push({ rotulo: 'Complacência dinâmica', valor: `${fmt(cdyn, 1)} mL/cmH₂O`, nota: 'Inclui o componente resistivo. Sempre menor que a estática; a diferença entre as duas é a resistência.' })
      if (fluxo !== null && fluxo > 0) {
        const raw = (ppico - pplato) / (fluxo / 60)
        detalhes.push({
          rotulo: 'Resistência de vias aéreas',
          valor: `${fmt(raw, 1)} cmH₂O/L/s`,
          nota: 'Referência em paciente intubado: 5 a 10 (o tubo sozinho contribui com 3 a 7). Acima de 15 indica broncoespasmo, secreção, tubo obstruído ou dobrado.',
          nivel: raw > 20 ? 'alerta' : raw > 15 ? 'atencao' : 'ok',
        })
      }
      const gradiente = ppico - pplato
      detalhes.push({
        rotulo: 'Gradiente pico − platô',
        valor: `${fmtInt(gradiente)} cmH₂O`,
        nota: gradiente > 15 ? 'Gradiente alargado: o problema é **resistivo** (broncoespasmo, secreção, tubo). A pressão de pico alta com platô normal não lesa o alvéolo.' : 'Gradiente normal: se a pressão de pico está alta, a causa é de **complacência** (SDRA, edema, pneumotórax, derrame, distensão abdominal, dessincronia).',
      })
    }
    if (altura !== null) {
      const pp = pesoPredito(opc(v, 'sexo'), altura)
      detalhes.push({ rotulo: 'Volume corrente por peso predito', valor: `${fmt(vt / pp, 1)} mL/kg`, nota: `Peso predito de ${fmt(pp, 1)} kg. Alvo protetor: 4 a 8 mL/kg.`, nivel: vt / pp > 8 ? 'alerta' : 'ok' })
      const powerBase = fluxo !== null ? 0.098 * (vt / 1000) * (ppico ?? pplato) : null
      if (powerBase !== null) detalhes.push({ rotulo: 'Estimativa simplificada de potência mecânica (por ciclo)', valor: `${fmt(powerBase, 2)} J`, nota: 'Multiplique pela frequência para obter J/min. Acima de 17 J/min associa-se a mais mortalidade em coortes de SDRA.' })
    }
    const nivel: Nivel = dp > 18 ? 'critico' : dp > 15 ? 'alerta' : dp > 13 ? 'atencao' : 'ok'
    return {
      titulo: 'Driving pressure',
      valor: fmtInt(dp),
      unidade: 'cmH₂O',
      nivel,
      rotuloNivel: dp > 15 ? 'Acima do limite de segurança' : dp > 13 ? 'Limítrofe' : 'Dentro do alvo',
      detalhes,
      conduta: [
        'Mantenha a **driving pressure (pressão de platô menos PEEP) ≤ 15 cmH₂O**: entre todas as variáveis ventilatórias, é a que melhor se correlaciona com mortalidade, porque normaliza o volume corrente pelo tamanho do pulmão efetivamente aerado — o \'baby lung\' — e não pelo tamanho do corpo.',
        'Separe **complacência estática (volume ÷ driving pressure)** de **resistência (pressão de pico menos platô, dividida pelo fluxo)**: complacência baixa aponta problema do parênquima ou da caixa torácica (síndrome do desconforto respiratório agudo, edema, atelectasia, pneumotórax, ascite, obesidade); resistência alta aponta via aérea (broncoespasmo, secreção, tubo dobrado ou obstruído).',
        'Diante de **pressão de pico alta com platô normal**, o problema é resistivo: aspire secreção, verifique o tubo, trate broncoespasmo. Com **pico e platô ambos altos**, o problema é de complacência: procure pneumotórax (que é emergência), atelectasia, derrame, sobredistensão por PEEP excessiva, hipertensão abdominal ou assincronia.',
        'Titule a **PEEP pela melhor complacência ou pela melhor driving pressure**, e não apenas pela oxigenação: subir a PEEP até melhorar a saturação pode sobredistender áreas sadias e piorar o desfecho. Reavalie a mecânica a cada mudança de parâmetro e após cada manobra.',
        'Vigie a **pressão transpulmonar** em obesos, gestantes e pacientes com hipertensão intra-abdominal, em que boa parte da pressão de platô é consumida pela parede torácica e não distende o pulmão. Quando a decisão for difícil, o **balão esofágico** permite separar os dois componentes e evita tanto a sobredistensão quanto o colapso por PEEP insuficiente.',
      ],
      interpretacao: [
        'A driving pressure é o volume corrente normalizado pela complacência — ou seja, pelo tamanho do pulmão que ainda está aberto. É por isso que ela prediz mortalidade melhor do que o volume corrente e melhor do que a pressão de platô isoladamente: dois pacientes com 6 mL/kg podem ter driving pressures de 10 e de 22 conforme quanto pulmão lhes resta.',
        'A análise de Amato e colaboradores (2015), reunindo nove ensaios randomizados, mostrou que as intervenções ventilatórias só reduziram mortalidade quando reduziram a driving pressure. Aumentar a PEEP sem que a driving pressure caia não beneficia — pode piorar.',
        '**Alvo prático: manter ≤ 15 cmH₂O**, idealmente abaixo de 13. Quando a driving pressure sobe, as saídas são reduzir o volume corrente, recrutar (se o pulmão for recrutável, o que aumenta a complacência e derruba a driving pressure) ou pronar.',
      ],
      alertas: pplato > 30 ? ['Pressão de platô acima de 30 cmH₂O: reduza o volume corrente. Se já estiver em 6 mL/kg, desça para 5 e depois 4 mL/kg, aceitando hipercapnia permissiva até pH de 7,20.'] : undefined,
    }
  },
  formula: [
    'Driving pressure = P platô − PEEP = VT / Complacência estática',
    'Complacência estática = VT / (P platô − PEEP)',
    'Complacência dinâmica = VT / (P pico − PEEP)',
    'Resistência = (P pico − P platô) / fluxo em L/s',
  ],
  fundamento:
    'A pressão de pico vence duas coisas ao mesmo tempo: a resistência das vias aéreas (componente dinâmico, que desaparece quando o fluxo cessa) e a elastância do sistema respiratório (componente estático, que permanece). A pausa inspiratória zera o fluxo e revela o platô — que é a pressão de distensão real do alvéolo. Separar os dois componentes é o que transforma "a pressão está alta" numa pergunta respondível: alta por resistência ou por complacência? A resposta muda inteiramente a conduta.',
  armadilhas: [
    'Platô só é válido com paciente passivo. Esforço inspiratório durante a pausa produz platô falsamente baixo e driving pressure falsamente tranquilizadora.',
    'Auto-PEEP não medida infla a driving pressure calculada. Meça a PEEP total com pausa expiratória, sobretudo em DPOC e asma.',
    'Em obesidade grave e hipertensão intra-abdominal, boa parte da pressão de platô é gasta expandindo a parede torácica, não o pulmão. Nesses casos a pressão transpulmonar, medida com balão esofágico, é o parâmetro fiel.',
  ],
  referencias: [
    { texto: 'Amato MB, Meade MO, Slutsky AS, et al. Driving pressure and survival in the acute respiratory distress syndrome. N Engl J Med. 2015;372(8):747-755.' },
    { texto: 'Gattinoni L, Tonetti T, Cressoni M, et al. Ventilator-related causes of lung injury: the mechanical power. Intensive Care Med. 2016;42(10):1567-1575.' },
  ],
}

const ventilacaoMinuto: Ferramenta = {
  id: 'ventilacao-minuto',
  nome: 'Ventilação-minuto e ventilação alveolar',
  sinonimos: ['volume minuto', 'ventilacao alveolar', 'espaco morto', 've'],
  resumo: 'Separa o ar que apenas vai e volta do ar que realmente troca gás.',
  categorias: ['pneumologia', 'emergencia'],
  campos: [
    campoNum('vt', 'Volume corrente', { unidade: 'mL', min: 50, max: 1200, passo: 5 }),
    campoNum('fr', 'Frequência respiratória', { unidade: 'irpm', min: 4, max: 60, passo: 1 }),
    campoNum('pesoPredito', 'Peso corporal predito', { unidade: 'kg', min: 20, max: 130, passo: 0.5, opcional: true, ajuda: 'Usado para estimar o espaço morto anatômico em cerca de 2,2 mL/kg.' }),
    campoNum('paco2', 'PaCO₂', { unidade: 'mmHg', min: 10, max: 120, passo: 1, opcional: true }),
    campoNum('petco2', 'EtCO₂ (capnografia)', { unidade: 'mmHg', min: 5, max: 100, passo: 1, opcional: true, ajuda: 'Com PaCO₂ e EtCO₂ juntos, a ferramenta calcula a fração de espaço morto pela equação de Bohr-Enghoff.' }),
  ],
  calcular: (v) => {
    const vt = num(v, 'vt')
    const fr = num(v, 'fr')
    const pp = num(v, 'pesoPredito')
    const paco2 = num(v, 'paco2')
    const petco2 = num(v, 'petco2')
    if (vt === null || fr === null) return null
    const ve = (vt * fr) / 1000
    const vd = pp !== null ? pp * 2.2 : 150
    const va = ((vt - vd) * fr) / 1000
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Espaço morto anatômico estimado', valor: `${fmtInt(vd)} mL`, nota: pp !== null ? '2,2 mL/kg de peso predito' : 'Valor padrão de 150 mL (adulto médio)' },
      { rotulo: 'Ventilação alveolar', valor: `${fmt(va, 2)} L/min`, nota: 'É esta que determina a PaCO₂ — a ventilação-minuto total, não.', nivel: va < 2 ? 'alerta' : 'ok' },
      { rotulo: 'Fração de espaço morto anatômico', valor: fmtPct((vd / vt) * 100, 0), nota: 'Referência aproximada de 30%. Volume corrente pequeno com frequência alta aumenta essa fração e torna a ventilação ineficiente.' },
    ]
    if (paco2 !== null && petco2 !== null && paco2 > 0) {
      const vdvt = (paco2 - petco2) / paco2
      detalhes.push({
        rotulo: 'Fração de espaço morto fisiológico (Bohr-Enghoff)',
        valor: fmtPct(vdvt * 100, 0),
        nota: 'Referência 0,20 a 0,40. Acima de 0,60 na SDRA associa-se independentemente a mortalidade elevada. Aumento súbito sugere embolia pulmonar ou queda do débito cardíaco.',
        nivel: vdvt > 0.6 ? 'critico' : vdvt > 0.45 ? 'alerta' : 'ok',
      })
      detalhes.push({ rotulo: 'Gradiente PaCO₂ − EtCO₂', valor: `${fmtInt(paco2 - petco2)} mmHg`, nota: 'Referência 2 a 5 mmHg. Gradiente alargado significa alvéolo ventilado e mal perfundido.' })
    }
    return {
      titulo: 'Ventilação-minuto',
      valor: fmt(ve, 2),
      unidade: 'L/min',
      nivel: ve > 15 ? 'alerta' : ve < 4 ? 'alerta' : 'ok',
      rotuloNivel: ve > 15 ? 'Elevada — alta demanda ventilatória' : ve < 4 ? 'Reduzida' : 'Dentro da faixa usual (5 a 8 L/min)',
      detalhes,
      conduta: [
        'Lembre que só a **ventilação alveolar** remove gás carbônico: a ventilação-minuto inclui o espaço morto, que não participa da troca. Isso explica por que aumentar a frequência com volume corrente baixo pode elevar o volume-minuto e **piorar** a eliminação de gás carbônico — cada ciclo passa a ter proporcionalmente mais espaço morto.',
        'Para corrigir **hipercapnia**, prefira aumentar a frequência quando o volume corrente já estiver no limite protetor, vigiando **auto-PEEP** (verifique o fluxo expiratório no ventilador e faça pausa expiratória). Se houver aprisionamento aéreo, aumentar a frequência piora tudo: reduza a frequência e prolongue o tempo expiratório.',
        'Investigue **aumento do espaço morto** quando a ventilação-minuto necessária subir sem mudança do quadro clínico: embolia pulmonar, hipovolemia, baixo débito e sobredistensão por PEEP excessiva. A **fração de espaço morto** e a relação entre gás carbônico expirado e arterial são marcadores prognósticos na síndrome do desconforto respiratório agudo.',
        'Reconheça as demandas **metabólicas** que elevam a necessidade ventilatória: febre (cerca de 10% por grau), sepse, agitação, dor, tremor, convulsão, hipertireoidismo, excesso de carboidrato na nutrição e acidose metabólica. Tratar a febre e sedar adequadamente pode resolver uma \'insuficiência ventilatória\' sem tocar no ventilador.',
        'No **desmame**, uma ventilação-minuto acima de 10 L/min para manter gás carbônico normal indica reserva limitada e prediz falha. Combine com o **índice de respiração rápida e superficial (RSBI)** e com a avaliação de força muscular e de sobrecarga cardíaca — o teste de respiração espontânea revela a soma desses fatores melhor que qualquer índice isolado.',
      ],
      alertas: [
        'Só a ventilação **alveolar** remove gás carbônico. Aumentar a frequência com volume corrente baixo eleva o volume-minuto e pode **piorar** a eliminação, porque cada ciclo passa a ter proporcionalmente mais espaço morto.',
        'Se houver aprisionamento aéreo, aumentar a frequência agrava tudo: reduza a frequência e prolongue o tempo expiratório. Verifique auto-PEEP com pausa expiratória antes de decidir.',
      ],
      interpretacao: [
        'A PaCO₂ é inversamente proporcional à ventilação **alveolar**, não à ventilação-minuto. Isso explica um fenômeno cotidiano: o paciente taquipneico com volume corrente pequeno pode ter ventilação-minuto alta e ainda assim reter CO₂, porque quase todo o ar movimentado fica no espaço morto.',
        'Necessidade de ventilação-minuto acima de 15 L/min para manter a PaCO₂ é sinal de espaço morto grande (SDRA grave, embolia pulmonar, DPOC) ou de produção elevada de CO₂ (febre, sepse, tireotoxicose, excesso de carboidrato na dieta) — e é um dos preditores de falha de desmame.',
      ],
    }
  },
  formula: ['VE = VT × FR', 'VA = (VT − VD) × FR', 'VD/VT = (PaCO₂ − EtCO₂) / PaCO₂', 'PaCO₂ ∝ produção de CO₂ / VA'],
  fundamento:
    'Cada respiração move um volume que se divide em duas parcelas: a que fica nas vias aéreas de condução, onde não há alvéolo para trocar (espaço morto anatômico, aproximadamente 2 mL por quilo de peso predito), e a que chega ao alvéolo. Só a segunda participa da troca gasosa. O espaço morto fisiológico soma a esse componente anatômico os alvéolos ventilados mas não perfundidos — e é ele que a equação de Bohr-Enghoff mede.',
  armadilhas: [
    'Aumentar a frequência respiratória sem aumentar o volume corrente eleva a ventilação-minuto muito mais do que a alveolar, porque cada ciclo adicional repaga o custo integral do espaço morto.',
    'EtCO₂ só se aproxima da PaCO₂ com boa relação ventilação-perfusão; em choque, embolia e SDRA a diferença é grande e a capnografia subestima a PaCO₂.',
  ],
  referencias: [
    { texto: 'Nuckton TJ, Alonso JA, Kallet RH, et al. Pulmonary dead-space fraction as a risk factor for death in ARDS. N Engl J Med. 2002;346(17):1281-1286.' },
    { texto: 'West JB. Respiratory Physiology: The Essentials. 10ª ed. Wolters Kluwer; 2016.' },
  ],
}

const indiceOxigenacao: Ferramenta = {
  id: 'indice-oxigenacao',
  nome: 'Índice de oxigenação e índice de saturação',
  sigla: 'IO / OSI',
  sinonimos: ['indice de oxigenacao', 'oxygenation index', 'osi', 'ecmo'],
  resumo: 'Mede a oxigenação levando em conta o custo pressórico para obtê-la.',
  categorias: ['pneumologia', 'emergencia', 'pediatria'],
  campos: [
    campoNum('fio2', 'FiO₂', { unidade: '%', min: 21, max: 100, passo: 1 }),
    campoNum('pmva', 'Pressão média de vias aéreas', { unidade: 'cmH₂O', min: 3, max: 45, passo: 0.5, ajuda: 'Lida diretamente no ventilador. É a área sob a curva de pressão ao longo do ciclo.' }),
    campoNum('pao2', 'PaO₂', { unidade: 'mmHg', min: 20, max: 500, passo: 1, opcional: true }),
    campoNum('spo2', 'SpO₂', { unidade: '%', min: 50, max: 100, passo: 1, opcional: true, ajuda: 'Permite calcular o OSI quando não há gasometria. Só é válido com SpO₂ ≤ 97%.' }),
  ],
  calcular: (v) => {
    const fio2 = num(v, 'fio2')
    const pmva = num(v, 'pmva')
    const pao2 = num(v, 'pao2')
    const spo2 = num(v, 'spo2')
    if (fio2 === null || pmva === null) return null
    const detalhes: Resultado['detalhes'] = []
    let io: number | null = null
    if (pao2 !== null && pao2 > 0) {
      io = (fio2 * pmva) / pao2
      detalhes.push({ rotulo: 'Relação PaO₂/FiO₂', valor: fmtInt(pao2 / (fio2 / 100)) })
    }
    let osi: number | null = null
    if (spo2 !== null && spo2 > 0) {
      osi = (fio2 * pmva) / spo2
      detalhes.push({ rotulo: 'Índice de saturação (OSI)', valor: fmt(osi, 1), nota: 'OSI ≥ 5 equivale aproximadamente a IO ≥ 8; OSI ≥ 7,5 equivale a IO ≥ 16. Só é válido com SpO₂ ≤ 97%, porque acima disso a saturação satura e perde discriminação.' })
    }
    const valor = io ?? osi
    if (valor === null) return null
    const nivel: Nivel = valor >= 40 ? 'critico' : valor >= 16 ? 'alerta' : valor >= 8 ? 'atencao' : 'ok'
    return {
      titulo: io !== null ? 'Índice de oxigenação' : 'Índice de saturação (OSI)',
      valor: fmt(valor, 1),
      nivel,
      rotuloNivel: valor >= 40 ? 'Muito grave' : valor >= 16 ? 'Grave' : valor >= 8 ? 'Moderado' : 'Leve',
      detalhes,
      conduta: [
        'Use o **índice de oxigenação (IO = FiO₂ × pressão média de vias aéreas × 100 ÷ PaO₂)** em vez da relação PaO₂/FiO₂ quando quiser levar em conta o **custo ventilatório** da oxigenação: dois pacientes com a mesma relação podem ter gravidades muito diferentes se um precisa de pressão média o dobro do outro.',
        'Em pediatria e neonatologia, **IO ≥ 16** caracteriza lesão pulmonar moderada e **IO ≥ 25 a 40** indica gravidade extrema, com limiares tradicionais para **óxido nítrico inalado** e para **oxigenação por membrana extracorpórea (ECMO)**. Esses cortes orientam o momento de acionar o centro de referência, e o acionamento tardio é o principal determinante de desfecho ruim.',
        'Empregue o **índice de saturação (ISO), que substitui a PaO₂ pela saturação de pulso**, quando não houver gasometria arterial — ele é validado em pediatria e permite estratificar à beira do leito, especialmente em transporte e em serviços sem acesso arterial.',
        'Antes de escalar terapias de resgate, **otimize o básico**: titule a PEEP, verifique recrutabilidade, faça **posição prona** (16 h ou mais por sessão), considere bloqueio neuromuscular nas primeiras 48 h da forma grave, e trate a causa. Boa parte dos índices altos melhora com essas medidas.',
        'Acompanhe o índice **em série**: a tendência ao longo de 6 a 12 horas discrimina melhor que qualquer valor isolado, e um índice que não melhora após prona e otimização de PEEP é o sinal para contatar o centro de ECMO — idealmente antes de o paciente se tornar intransportável.',
      ],
      alertas: [
        'Os limiares de óxido nítrico e de ECMO existem para serem acionados a tempo: o contato tardio com o centro de referência, já com o paciente intransportável, é o principal determinante de desfecho ruim.',
      ],
      interpretacao: [
        'O índice de oxigenação responde a uma pergunta que a relação PaO₂/FiO₂ ignora: **quanto custou** essa oxigenação. Dois pacientes com a mesma relação P/F de 150 são muito diferentes se um está com pressão média de 12 e o outro com 30 cmH₂O — o segundo já esgotou a reserva de suporte.',
        'É o parâmetro de referência da pediatria e da neonatologia. A definição pediátrica de SDRA (PALICC) usa o índice de oxigenação em vez da relação P/F: leve 4 a 8, moderada 8 a 16, grave acima de 16.',
        'Em adultos, índice de oxigenação persistentemente acima de 30 a 40 apesar de otimização (bloqueio neuromuscular, prona, PEEP ajustada) é um dos gatilhos de discussão de ECMO veno-venosa, ao lado de relação P/F abaixo de 80 por mais de 6 horas e hipercapnia com pH abaixo de 7,25.',
      ],
    }
  },
  formula: ['IO = (FiO₂ × Pressão média de vias aéreas × 100) ÷ PaO₂', 'OSI = (FiO₂ × PMVA × 100) ÷ SpO₂'],
  fundamento:
    'Multiplicar pela pressão média de vias aéreas incorpora o suporte necessário para manter aquela oxigenação, e não apenas o resultado. Quanto maior o índice, pior — ao contrário da relação P/F. A escala pediátrica do índice se estabeleceu porque em crianças a variação de pressão média entre modos e estratégias é proporcionalmente maior do que em adultos. O índice é superior à relação PaO₂/FiO₂ porque incorpora a **pressão média de vias aéreas**, ou seja, o custo ventilatório pago para obter aquela oxigenação. Dois pacientes com a mesma relação têm gravidades muito diferentes se um precisa de pressão média de 10 cmH₂O e o outro de 20: o segundo tem pulmão menos complacente, mais colapsado e mais próximo do limite, e é justamente isso que prediz a necessidade de óxido nítrico e de circulação extracorpórea.',
  armadilhas: [
    'A FiO₂ entra em percentual (por exemplo, 60), não em fração — o fator 100 da fórmula já faz a conversão.',
    'O OSI perde validade com SpO₂ acima de 97%, porque a curva de dissociação da hemoglobina achata e a saturação deixa de refletir a PaO₂.',
  ],
  referencias: [
    { texto: 'Pediatric Acute Lung Injury Consensus Conference Group. Pediatric acute respiratory distress syndrome: consensus recommendations. Pediatr Crit Care Med. 2015;16(5):428-439.' },
    { texto: 'Combes A, Hajage D, Capellier G, et al. Extracorporeal membrane oxygenation for severe acute respiratory distress syndrome (EOLIA). N Engl J Med. 2018;378(21):1965-1975.' },
  ],
}

const curb65: Ferramenta = {
  id: 'curb-65',
  nome: 'CURB-65',
  sinonimos: ['curb', 'curb65', 'pneumonia gravidade'],
  resumo: 'Define local de tratamento na pneumonia adquirida na comunidade em cinco variáveis.',
  categorias: ['pneumologia', 'infectologia', 'emergencia'],
  campos: [
    campoSimNao('c', 'Confusão mental de início recente', 1, 'Desorientação em tempo, espaço ou pessoa, ou escore ≤ 8 no teste mental abreviado.'),
    campoSimNao('u', 'Ureia > 43 mg/dL (ou BUN > 20 mg/dL)', 1, 'Corresponde a ureia > 7 mmol/L no sistema internacional.'),
    campoSimNao('r', 'Frequência respiratória ≥ 30 irpm', 1),
    campoSimNao('b', 'PA sistólica < 90 mmHg ou diastólica ≤ 60 mmHg', 1),
    campoSimNao('idade', 'Idade ≥ 65 anos', 1),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'c', pontos: 1 },
      { id: 'u', pontos: 1 },
      { id: 'r', pontos: 1 },
      { id: 'b', pontos: 1 },
      { id: 'idade', pontos: 1 },
    ])
    const mortalidade = ['0,6%', '2,7%', '6,8%', '14,0%', '27,8%', '27,8%'][total]
    const nivel: Nivel = total >= 3 ? 'critico' : total === 2 ? 'alerta' : 'ok'
    return {
      titulo: 'CURB-65',
      valor: String(total),
      unidade: 'de 5 pontos',
      nivel,
      rotuloNivel: total <= 1 ? 'Baixo risco' : total === 2 ? 'Risco intermediário' : 'Alto risco',
      detalhes: [{ rotulo: 'Mortalidade em 30 dias', valor: mortalidade, nota: 'Coorte de derivação de Lim et al. (2003).' }],
      conduta: [
        '**CURB-65 de 0 a 1 (mortalidade < 3%)**: tratamento ambulatorial com antibiótico por via oral, desde que haja saturação adequada, suporte social e ausência de descompensação de comorbidade. Oriente retorno em 48–72 h ou antes, se houver piora.',
        '**CURB-65 de 2 (mortalidade cerca de 9%)**: considere internação ou observação hospitalar breve. É a faixa em que o julgamento clínico, a comorbidade e as condições sociais pesam mais que o escore.',
        '**CURB-65 de 3 a 5 (mortalidade 15–40%)**: interne, e avalie **unidade de terapia intensiva** — use os critérios da IDSA/ATS (choque com necessidade de vasopressor ou ventilação mecânica como critérios maiores; três ou mais critérios menores) para essa decisão, porque o CURB-65 prediz mortalidade, não necessidade de UTI.',
        'Administre o **antibiótico na primeira hora em sepse** e nas primeiras horas nos demais casos, guiado pela gravidade e pelos fatores de risco para germes resistentes. Colha hemoculturas e escarro nos casos graves, e considere antígenos urinários para pneumococo e *Legionella*. Reavalie em 48–72 h para **descalonar** e definir duração: **5 dias bastam** na maioria dos casos com boa resposta clínica.',
        'Não se prenda ao escore quando o paciente tem **hipoxemia, derrame parapneumônico, descompensação de comorbidade ou impossibilidade de tratamento domiciliar** — todos indicam internação independentemente da pontuação. O CURB-65 também não contempla saturação de oxigênio, que é um dos dados mais decisivos à beira do leito; o **PSI/PORT** é mais completo, porém mais trabalhoso.',
      ],
      alertas: [
        'O CURB-65 prediz mortalidade, **não** necessidade de terapia intensiva — para isso use os critérios da IDSA/ATS.',
        'Ele não contempla saturação de oxigênio, que é um dos dados mais decisivos à beira do leito. Hipoxemia, derrame parapneumônico e descompensação de comorbidade indicam internação independentemente da pontuação.',
      ],
      interpretacao: [
        total <= 1
          ? '**Tratamento ambulatorial** é apropriado na maioria dos casos, desde que haja saturação adequada em ar ambiente, capacidade de ingestão oral, ausência de descompensação de comorbidade e suporte social para retorno.'
          : total === 2
            ? '**Internação em enfermaria** ou observação hospitalar prolongada. Reavaliação frequente nas primeiras 48 horas.'
            : '**Considerar unidade de terapia intensiva.** Escore ≥ 3 identifica mortalidade elevada; ≥ 4 costuma exigir suporte avançado.',
        'O CURB-65 é simples o suficiente para ser feito de cabeça na porta da emergência, e essa é sua vantagem sobre o PSI/PORT. Em contrapartida, ele subestima o risco em jovens com hipoxemia significativa — porque não olha oxigenação nem comorbidade.',
        'Nenhum escore substitui dois achados que indicam gravidade por si sós: hipoxemia com necessidade de oxigênio suplementar e descompensação de doença crônica.',
      ],
      tabela: {
        titulo: 'Conduta por pontuação',
        colunas: ['Pontos', 'Mortalidade em 30 dias', 'Conduta'],
        linhas: [
          ['0', '0,6%', 'Ambulatorial'],
          ['1', '2,7%', 'Ambulatorial'],
          ['2', '6,8%', 'Enfermaria'],
          ['3', '14,0%', 'Enfermaria ou UTI'],
          ['4 – 5', '27,8%', 'UTI'],
        ],
        destaque: total >= 4 ? 4 : total,
      },
    }
  },
  formula: ['C onfusão + U reia > 43 mg/dL + R espiração ≥ 30 + B pressão baixa + 65 anos'],
  fundamento:
    'O CURB-65 foi derivado de coortes britânicas, neozelandesas e holandesas com quase 1.100 pacientes, buscando o menor conjunto de variáveis capaz de estratificar mortalidade em pneumonia comunitária. As cinco escolhidas representam disfunção neurológica, renal, respiratória, hemodinâmica e reserva fisiológica — cada uma de um sistema diferente, o que explica por que tão poucas variáveis capturam tanto.',
  armadilhas: [
    'Atenção à unidade da ureia. O ponto de corte é 7 mmol/L, que equivale a cerca de 43 mg/dL de ureia ou 20 mg/dL de BUN. Confundir ureia com BUN inverte a pontuação.',
    'Confusão mental em idoso pode ser crônica; o critério exige alteração **nova**.',
    'O escore prediz mortalidade, não necessidade de UTI. Os critérios da IDSA/ATS (um maior ou três menores) são mais apropriados para essa decisão.',
  ],
  referencias: [
    { texto: 'Lim WS, van der Eerden MM, Laing R, et al. Defining community acquired pneumonia severity on presentation to hospital: an international derivation and validation study. Thorax. 2003;58(5):377-382.' },
    { texto: 'Metlay JP, Waterer GW, Long AC, et al. Diagnosis and treatment of adults with community-acquired pneumonia. Am J Respir Crit Care Med. 2019;200(7):e45-e67.' },
  ],
}

const crb65: Ferramenta = {
  id: 'crb-65',
  nome: 'CRB-65',
  sinonimos: ['crb', 'crb65', 'pneumonia sem exame'],
  resumo: 'A versão do CURB-65 sem exame laboratorial, para atenção primária.',
  categorias: ['pneumologia', 'infectologia'],
  campos: [
    campoSimNao('c', 'Confusão mental de início recente', 1, 'Desorientação em tempo, espaço ou pessoa — ou escore ≤ 8 no teste mental abreviado. Precisa ser nova: demência estável não pontua.'),
    campoSimNao('r', 'Frequência respiratória ≥ 30 irpm', 1, 'Conte por 60 segundos com o paciente em repouso e sem saber que está sendo contado. É a variável mais subnotificada da medicina de porta.'),
    campoSimNao('b', 'PA sistólica < 90 mmHg ou diastólica ≤ 60 mmHg', 1, 'Basta uma das duas. A diastólica ≤ 60 costuma ser esquecida e é a que mais frequentemente pontua no idoso.'),
    campoSimNao('idade', 'Idade ≥ 65 anos', 1),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'c', pontos: 1 },
      { id: 'r', pontos: 1 },
      { id: 'b', pontos: 1 },
      { id: 'idade', pontos: 1 },
    ])
    const faixa = total === 0 ? 0 : total <= 2 ? 1 : 2
    const nivel: Nivel = total >= 3 ? 'critico' : total >= 1 ? 'alerta' : 'ok'
    return {
      titulo: 'CRB-65',
      valor: String(total),
      unidade: 'de 4 pontos',
      nivel,
      rotuloNivel: total === 0 ? 'Baixo risco' : total <= 2 ? 'Risco intermediário' : 'Alto risco',
      detalhes: [
        { rotulo: 'Mortalidade em 30 dias', valor: ['1,2%', '8,2%', '8,2%', '31,0%', '31,0%'][total], nota: 'Coorte de derivação de Lim et al. (2003). A mortalidade salta sete vezes do escore 0 para o 1 — não há faixa "quase zero".', nivel: faixa === 0 ? 'ok' : faixa === 1 ? 'alerta' : 'critico' },
        { rotulo: 'Local de cuidado sugerido', valor: total === 0 ? 'Ambulatorial' : total <= 2 ? 'Hospitalar' : 'Hospitalar com avaliação de UTI' },
      ],
      interpretacao: [
        total === 0
          ? '**Baixo risco.** Tratamento ambulatorial apropriado, desde que haja saturação adequada em ar ambiente, tolerância à via oral, suporte domiciliar e possibilidade de retorno. O escore descreve risco de morte, não capacidade social de se tratar em casa.'
          : total <= 2
            ? '**Risco intermediário.** Considere internação ou observação hospitalar — a mortalidade já é sete vezes maior do que na faixa zero, e a curva do CRB-65 é degrau, não rampa.'
            : '**Alto risco.** Internação urgente com avaliação para terapia intensiva. Nessa faixa, aproximadamente um em cada três pacientes morre em 30 dias.',
        'O CRB-65 existe para o consultório e para a unidade básica, onde não há ureia disponível em tempo útil. Perde um pouco de discriminação em relação ao CURB-65, mas mantém desempenho suficiente para a decisão que importa nesse cenário: encaminhar ou não.',
        'Fisiopatologicamente, os quatro itens medem a mesma coisa por quatro janelas diferentes — o quanto a pneumonia extravasou o pulmão. **Confusão** é hipoperfusão ou hipoxemia cerebral, e no idoso costuma ser a primeira manifestação de sepse, antes da febre. **Taquipneia ≥ 30** é a resposta compensatória à acidose metabólica do choque somada ao shunt intrapulmonar, e é o sinal vital que se altera mais precocemente. **Hipotensão** marca a vasoplegia já estabelecida. **Idade** é a variável-síntese de reserva fisiológica: menos complacência pulmonar, menos resposta imune adaptativa, mais comorbidade silenciosa.',
      ],
      conduta: total === 0
        ? [
            'Antibiótico ambulatorial conforme diretriz local: amoxicilina em monoterapia costuma bastar no adulto previamente sadio; considere cobertura de atípicos (macrolídeo ou doxiciclina) se o quadro é arrastado, seco e com dissociação clínico-radiológica.',
            'Meça a saturação de oxigênio antes de decidir alta. SpO₂ < 92% em ar ambiente indica internação **independentemente** do CRB-65 — a oxigenação não está no escore.',
            'Reavaliação clínica obrigatória em 48 a 72 horas. Oriente retorno imediato antes disso se surgir dispneia progressiva, confusão, vômito impedindo o antibiótico ou febre que não cede em 72 horas.',
            'Verifique vacinação pneumocócica e para influenza — a consulta de pneumonia é a melhor oportunidade de prevenir a próxima.',
          ]
        : total <= 2
          ? [
              'Encaminhe ao hospital. Colha hemocultura antes do antibiótico quando isso não atrasar a primeira dose, e não atrase a primeira dose por causa da coleta.',
              'Inicie antibiótico de cobertura hospitalar (betalactâmico com inibidor de betalactamase ou cefalosporina de terceira geração, associado a macrolídeo) na primeira hora se houver critério de sepse.',
              'Oxigênio suplementar com alvo de SpO₂ 92 a 96%, ou 88 a 92% se houver retenção crônica de CO₂ conhecida ou suspeita.',
              'Reavalie em 6 a 12 horas: piora da taquipneia ou necessidade crescente de O₂ antecipa a indicação de UTI, e o CRB-65 não reavalia isso sozinho.',
            ]
          : [
              'Internação imediata e acionamento do pacote de sepse se houver disfunção orgânica: lactato, hemoculturas, antibiótico na primeira hora e cristaloide 30 mL/kg na hipotensão ou lactato ≥ 4 mmol/L.',
              'Avaliação formal de UTI. Aplique os critérios ATS/IDSA de pneumonia grave: um critério maior (ventilação mecânica ou vasopressor) já indica UTI; três menores também.',
              'Antibiótico de amplo espectro com cobertura de atípicos, ajustado a fatores de risco para Pseudomonas e para S. aureus resistente.',
              'Discuta objetivos de cuidado precocemente com o paciente e a família: mortalidade de 31% em 30 dias é a hora de saber o que a pessoa quer, não depois da intubação.',
            ],
      alertas: [
        'O CRB-65 não contém oxigenação. Hipoxemia significativa, derrame pleural volumoso, acometimento multilobar ou descompensação de comorbidade indicam internação mesmo com escore 0.',
        total === 0
          ? 'Escore 0 não é alta automática. Ele não avalia tolerância à via oral, adesão, suporte domiciliar nem acesso ao retorno — fatores que decidem tanto quanto o risco biológico.'
          : 'Nenhum escore de pneumonia foi validado para decidir alta em imunossuprimido, neutropênico, pós-transplante ou gestante. Nesses grupos a conduta é individualizada e mais conservadora.',
      ],
      tabela: {
        titulo: 'Estratificação e local de cuidado',
        colunas: ['Pontos', 'Risco', 'Mortalidade em 30 dias', 'Local de cuidado'],
        linhas: [
          ['0', 'Baixo', '1,2%', 'Ambulatorial'],
          ['1 – 2', 'Intermediário', '8,2%', 'Internação ou observação'],
          ['3 – 4', 'Alto', '31,0%', 'Internação com avaliação de UTI'],
        ],
        destaque: faixa,
      },
    }
  },
  formula: ['C onfusão + R espiração ≥ 30 + B pressão baixa + 65 anos'],
  fundamento:
    'A ureia é a única variável do CURB-65 que exige laboratório, e sua remoção reduz pouco a acurácia — o que faz sentido fisiopatologicamente, já que idade e pressão arterial capturam boa parte da mesma informação. A ureia elevada na pneumonia não é doença renal: é a soma de hipoperfusão pré-renal (queda do fluxo plasmático renal por vasoplegia e hipovolemia) e de catabolismo proteico acelerado pela resposta inflamatória, ambos já parcialmente refletidos na hipotensão e na idade. O escore derivou de uma coorte de 1.068 pacientes em três países e foi validado prospectivamente em mais de 12.000 — a escolha de quatro variáveis dicotômicas de peso igual foi deliberada: em atenção primária, um escore que exige cálculo não é usado. Vale notar o que o CRB-65 é bom em fazer: seu valor está no **valor preditivo negativo**. Escore 0 identifica com segurança quem provavelmente não morre; escore alto não é bom em predizer quem precisa de UTI, para o que existem os critérios ATS/IDSA e o SMART-COP.',
  armadilhas: [
    'Um único ponto no CRB-65 já corresponde a mortalidade de 8%; não trate escore 1 como equivalente a escore 1 do CURB-65, que tem cinco itens e portanto granularidade diferente.',
    'A frequência respiratória precisa ser contada, não estimada. É a variável mais frequentemente copiada da triagem anterior ou registrada como "20" por hábito, e é justamente a que mais pesa em detectar deterioração precoce.',
    'Confusão precisa ser de início recente. Em paciente com demência, a comparação é com o basal relatado pelo cuidador, não com a normalidade — e nesse grupo o delirium hipoativo (sonolência, apatia) é mais comum que o agitado, e passa batido.',
    'O escore foi derivado em pneumonia adquirida na comunidade. Não se aplica a pneumonia hospitalar, associada à ventilação nem a pneumonia em imunossuprimido, contextos com microbiologia e prognóstico distintos.',
    'Idade ≥ 65 anos dá ponto isoladamente, o que significa que todo idoso parte de escore 1. Isso é intencional, mas leva ao erro oposto: internar todo idoso com pneumonia. O julgamento clínico e o contexto social decidem a faixa intermediária.',
  ],
  referencias: [
    { texto: 'Lim WS, van der Eerden MM, Laing R, et al. Defining community acquired pneumonia severity on presentation to hospital: an international derivation and validation study. Thorax. 2003;58(5):377-382.' },
    { texto: 'Bauer TT, Ewig S, Marre R, et al. CRB-65 predicts death from community-acquired pneumonia. J Intern Med. 2006;260(1):93-101.' },
    { texto: 'Metlay JP, Waterer GW, Long AC, et al. Diagnosis and Treatment of Adults with Community-acquired Pneumonia. An Official Clinical Practice Guideline of the ATS and IDSA. Am J Respir Crit Care Med. 2019;200(7):e45-e67.' },
  ],
}

const psi: Ferramenta = {
  id: 'psi-port',
  nome: 'PSI / PORT (Pneumonia Severity Index)',
  sinonimos: ['psi', 'port', 'fine', 'pneumonia severity index'],
  resumo: 'Vinte variáveis que classificam a pneumonia em cinco classes de risco.',
  categorias: ['pneumologia', 'infectologia'],
  campos: [
    campoNum('idade', 'Idade', { unidade: 'anos', min: 18, max: 110, passo: 1 }),
    campoSexo(),
    campoSimNao('asilo', 'Residente em instituição de longa permanência', 10, 'Marca colonização por flora diferente, fragilidade e maior risco de aspiração.'),
    campoSimNao('neoplasia', 'Doença neoplásica ativa', 30, 'Neoplasia ativa ou em tratamento nos últimos 12 meses, exceto câncer de pele não melanoma. É a comorbidade de maior peso do escore.'),
    campoSimNao('hepatica', 'Doença hepática', 20, 'Cirrose ou hepatopatia crônica. A cirrose compromete opsonização, complemento e função do sistema retículo-endotelial — é imunossupressão adquirida.'),
    campoSimNao('icc', 'Insuficiência cardíaca congestiva', 10, 'Disfunção sistólica ou diastólica documentada. Reduz a tolerância à sobrecarga hídrica do tratamento e ao aumento da demanda metabólica.'),
    campoSimNao('cerebrovascular', 'Doença cerebrovascular', 10, 'AVC ou AIT prévios. O que pesa aqui é a disfagia orofaríngea residual e o risco de aspiração recorrente.'),
    campoSimNao('renal', 'Doença renal', 10, 'Doença renal crônica prévia ou ureia elevada de base.'),
    campoSimNao('mental', 'Alteração do estado mental', 20, 'Desorientação, letargia, estupor ou coma de início recente. No idoso é frequentemente a primeira manifestação da pneumonia, antes da febre e da tosse.'),
    campoSimNao('fr', 'Frequência respiratória ≥ 30 irpm', 20, 'Conte por 60 segundos com o paciente em repouso. Reflete a resposta compensatória ao shunt intrapulmonar e à acidose metabólica.'),
    campoSimNao('pas', 'PA sistólica < 90 mmHg', 20, 'Corte mais estrito que no CURB-65, e não considera a diastólica.'),
    campoSimNao('temp', 'Temperatura < 35 °C ou ≥ 40 °C', 15, 'Os dois extremos pontuam. Hipotermia no idoso séptico é sinal de pior prognóstico que febre alta — indica falência da resposta termorreguladora.'),
    campoSimNao('fc', 'Frequência cardíaca ≥ 125 bpm', 10, 'Corte alto, bem acima do habitual. Atenção ao paciente betabloqueado, que não atinge esse valor mesmo em choque.'),
    campoSimNao('ph', 'pH arterial < 7,35', 30, 'Exige gasometria — é o item que impede aplicar o PSI na atenção primária. Empata com neoplasia como variável de maior peso, porque acidemia significa que a compensação falhou.'),
    campoSimNao('bun', 'Ureia ≥ 64 mg/dL (BUN ≥ 30 mg/dL)', 20, 'Cuidado com a unidade: no Brasil o laboratório informa ureia (corte 64 mg/dL); a literatura usa BUN, que é a ureia dividida por 2,14 (corte 30 mg/dL).'),
    campoSimNao('na', 'Sódio < 130 mEq/L', 20, 'Hiponatremia na pneumonia sugere SIADH, clássica na infecção por Legionella, e marca gravidade independentemente da causa.'),
    campoSimNao('glicose', 'Glicose ≥ 250 mg/dL', 10, 'Hiperglicemia de estresse ou descompensação de diabetes — ambas pioram a função de neutrófilos.'),
    campoSimNao('ht', 'Hematócrito < 30%', 10, 'Anemia reduz o conteúdo arterial de oxigênio e, portanto, a oferta tecidual, mesmo com saturação normal.'),
    campoSimNao('pao2', 'PaO₂ < 60 mmHg ou SaO₂ < 90%', 10, 'Basta um dos dois. Note o peso baixo (10 pontos) para um achado clinicamente grave — é uma das inconsistências reconhecidas do escore.'),
    campoSimNao('derrame', 'Derrame pleural na radiografia', 10, 'Qualquer derrame associado. Se for volumoso ou houver suspeita de empiema, indique toracocentese e aplique os critérios de Light, independentemente da classe do PSI.'),
  ],
  calcular: (v) => {
    const idade = num(v, 'idade')
    if (idade === null) return null
    const base = opc(v, 'sexo') === 'f' ? idade - 10 : idade
    const total =
      base +
      somaSimNao(v, [
        { id: 'asilo', pontos: 10 },
        { id: 'neoplasia', pontos: 30 },
        { id: 'hepatica', pontos: 20 },
        { id: 'icc', pontos: 10 },
        { id: 'cerebrovascular', pontos: 10 },
        { id: 'renal', pontos: 10 },
        { id: 'mental', pontos: 20 },
        { id: 'fr', pontos: 20 },
        { id: 'pas', pontos: 20 },
        { id: 'temp', pontos: 15 },
        { id: 'fc', pontos: 10 },
        { id: 'ph', pontos: 30 },
        { id: 'bun', pontos: 20 },
        { id: 'na', pontos: 20 },
        { id: 'glicose', pontos: 10 },
        { id: 'ht', pontos: 10 },
        { id: 'pao2', pontos: 10 },
        { id: 'derrame', pontos: 10 },
      ])
    const semComorbidade = !['asilo', 'neoplasia', 'hepatica', 'icc', 'cerebrovascular', 'renal', 'mental', 'fr', 'pas', 'temp', 'fc', 'ph', 'bun', 'na', 'glicose', 'ht', 'pao2', 'derrame'].some((id) => sim(v, id))
    const classe = idade < 50 && semComorbidade ? 1 : total <= 70 ? 2 : total <= 90 ? 3 : total <= 130 ? 4 : 5
    const mortalidade = ['', '0,1%', '0,6%', '2,8%', '8,2%', '29,2%'][classe]
    const nivel: Nivel = classe <= 2 ? 'ok' : classe === 3 ? 'atencao' : classe === 4 ? 'alerta' : 'critico'
    return {
      titulo: `PSI classe ${['', 'I', 'II', 'III', 'IV', 'V'][classe]}`,
      valor: String(total),
      unidade: 'pontos',
      nivel,
      rotuloNivel: `Mortalidade em 30 dias: ${mortalidade}`,
      detalhes: [
        { rotulo: 'Pontos por idade e sexo', valor: String(base), nota: opc(v, 'sexo') === 'f' ? 'Mulheres subtraem 10 pontos da idade.' : 'Homens pontuam a idade integral.' },
        { rotulo: 'Classe de risco', valor: ['', 'I', 'II', 'III', 'IV', 'V'][classe] },
      ],
      interpretacao: [
        classe <= 2
          ? 'Classes I e II: **tratamento ambulatorial**. Mortalidade abaixo de 1%.'
          : classe === 3
            ? 'Classe III: **observação ou internação breve**, com reavaliação em 24 a 48 horas.'
            : classe === 4
              ? 'Classe IV: **internação hospitalar**.'
              : 'Classe V: **internação, com forte consideração de terapia intensiva**.',
        'O PSI discrimina melhor que o CURB-65 no extremo inferior — identifica com mais segurança quem pode ir para casa — ao custo de exigir 20 variáveis, gasometria e radiografia. Por isso a IDSA/ATS o prefere para a decisão de internar, e o CURB-65 permanece como ferramenta de triagem rápida.',
        'O peso enorme da idade é a maior limitação do PSI: um homem de 85 anos sem nenhuma outra alteração já entra na classe IV. Isso o faz superestimar risco em idosos hígidos e subestimar em jovens graves.',
        'Os vinte itens se organizam em três blocos fisiopatológicos, e ler o escore por bloco é mais útil do que somar. O primeiro é **reserva** — idade, sexo, institucionalização e as cinco comorbidades — e responde quanto de agressão o organismo absorve antes de descompensar. O segundo é **repercussão sistêmica aguda** — estado mental, frequência respiratória, pressão, temperatura e frequência cardíaca — e mostra que a infecção deixou de ser local: são os sinais da resposta inflamatória com vasodilatação, aumento da permeabilidade capilar e redistribuição de fluxo. O terceiro é **falência bioquímica** — pH, ureia, sódio, glicemia, hematócrito, oxigenação e derrame — e é o mais grave, porque documenta órgãos já disfuncionantes: o pH baixo significa que a hiperventilação não compensa mais o lactato da hipoperfusão, a ureia alta soma queda do fluxo plasmático renal e catabolismo proteico, e a hiponatremia denuncia secreção inapropriada de vasopressina. Um escore alto concentrado no terceiro bloco é muito mais ameaçador que o mesmo escore construído sobre idade e comorbidade — e é por isso que o número isolado engana.',
      ],
      conduta: classe <= 2
        ? [
            'Tratamento ambulatorial com antibiótico oral. Amoxicilina em dose alta no adulto previamente sadio; associe ou troque por macrolídeo ou doxiciclina se houver suspeita de atípicos. Em paciente com comorbidade ou uso recente de antibiótico, prefira amoxicilina-clavulanato ou cefuroxima associada a macrolídeo, ou uma quinolona respiratória em monoterapia.',
            'Antes da alta, confirme o que o escore não mede: tolerância à via oral, ausência de vômitos, dor controlada com analgesia oral, saturação adequada em ar ambiente, suporte domiciliar e acesso garantido a retorno.',
            'Reavaliação em 48 a 72 horas. A resposta esperada é queda da febre em 48 a 72 horas e melhora dos sinais vitais; ausência de resposta nesse prazo obriga a reconsiderar o diagnóstico, o agente (tuberculose, fungo, atípico resistente) e a existência de complicação — empiema, abscesso, obstrução brônquica.',
            'Duração de 5 dias é suficiente na maioria dos casos não complicados, desde que o paciente esteja afebril por 48 a 72 horas e clinicamente estável. Prescrições de 10 a 14 dias por hábito aumentam efeito adverso sem benefício.',
          ]
        : classe === 3
          ? [
              'Observação em unidade de curta permanência ou internação breve é o uso correto da classe III — a decisão é genuinamente limítrofe e depende tanto do escore quanto do contexto social e da trajetória nas primeiras horas.',
              'Inicie antibiótico parenteral (betalactâmico com inibidor de betalactamase ou cefalosporina de terceira geração, associado a macrolídeo) e reavalie em 24 a 48 horas para decidir alta ou internação plena.',
              'Oxigênio com alvo de SpO₂ 92 a 96%, ou 88 a 92% se houver retenção crônica de CO₂. Hidratação cuidadosa: o paciente com pneumonia frequentemente está desidratado, mas o cardiopata congestiona rápido.',
              'Se houver derrame pleural, indique toracocentese diagnóstica e aplique os critérios de Light: empiema ou derrame complicado muda completamente a conduta e o tempo de tratamento.',
            ]
          : [
              'Internação hospitalar. Aplique em paralelo os **critérios ATS/IDSA de pneumonia grave** para decidir UTI: um critério maior (necessidade de ventilação mecânica ou de vasopressor) indica UTI isoladamente; três ou mais critérios menores também. O PSI estima mortalidade, não necessidade de terapia intensiva.',
              'Antibiótico na primeira hora se houver sepse. Colha hemoculturas e, quando disponível, antígeno urinário para pneumococo e Legionella, além de painel viral respiratório. Avalie fatores de risco para Pseudomonas e para S. aureus resistente para decidir ampliação de espectro.',
              'Acione o pacote de sepse na presença de disfunção orgânica: lactato seriado, cristaloide 30 mL/kg na hipotensão ou lactato ≥ 4 mmol/L, e noradrenalina precoce se a pressão média não responder ao volume.',
              classe === 5
                ? 'Classe V tem mortalidade de aproximadamente 29% em 30 dias. É a faixa em que discutir objetivos de cuidado, preferências sobre intubação e planejamento antecipado faz parte do tratamento — não do seu abandono. Faça essa conversa antes da deterioração, não durante.'
                : 'Reavalie a resposta em 48 a 72 horas. Considere corticoide sistêmico apenas nos casos de pneumonia grave com resposta inflamatória exuberante, conforme a evidência mais recente, e não como rotina.',
            ],
      alertas: [
        'O PSI foi desenhado para responder **quem não precisa internar**, e é aí que seu desempenho é melhor. Não use o escore para decidir UTI: para isso existem os critérios ATS/IDSA de pneumonia grave e o SMART-COP.',
        'O peso da idade distorce os extremos. Idoso hígido cai em classe alta sem gravidade real, e jovem com pneumonia grave pode ficar em classe baixa — nesse caso a impressão clínica de gravidade prevalece sobre o escore, sempre.',
        'Exige gasometria arterial e radiografia, o que o torna inaplicável na atenção primária. Nesse cenário use o CRB-65.',
        'Não foi validado para pneumonia hospitalar, associada à ventilação, em imunossuprimido, neutropênico ou pós-transplante. Nesses grupos a microbiologia e o prognóstico são outros.',
      ],
      tabela: {
        titulo: 'Classes, mortalidade e local de cuidado',
        colunas: ['Pontos', 'Classe', 'Mortalidade em 30 dias', 'Local de cuidado'],
        linhas: [
          ['< 50 anos sem alterações', 'I', '0,1%', 'Ambulatorial'],
          ['≤ 70', 'II', '0,6%', 'Ambulatorial'],
          ['71 – 90', 'III', '2,8%', 'Observação ou internação breve'],
          ['91 – 130', 'IV', '8,2%', 'Internação'],
          ['> 130', 'V', '29,2%', 'Internação, considerar UTI'],
        ],
        destaque: classe - 1,
      },
    }
  },
  formula: ['Classe I: < 50 anos, sem comorbidade e sem alteração ao exame', 'Classe II ≤ 70 | III 71–90 | IV 91–130 | V > 130'],
  fundamento:
    'O PSI foi derivado da coorte PORT com mais de 14 mil pacientes hospitalizados e validado em outros 38 mil. Seu objetivo declarado não era prever mortalidade, mas identificar com segurança quem **não** precisa internar — e é nisso que ele se sustenta melhor do que qualquer alternativa: a mortalidade nas classes I e II é tão baixa que a internação raramente se justifica. A arquitetura em duas etapas é a parte mais elegante e mais esquecida do modelo. A classe I não é um ponto de corte numérico: é uma triagem categórica prévia, que pergunta se o paciente tem menos de 50 anos, nenhuma das cinco comorbidades e nenhuma das alterações de exame ou laboratório. Só quem falha nessa triagem é pontuado. Fine desenhou assim porque percebeu que, no adulto jovem sem comorbidade e sem alteração alguma, o risco é tão baixo que somar pontos apenas acrescenta ruído — e é por isso que existe classe I com zero ponto e classe II com setenta. A contrapartida de usar vinte variáveis é que o PSI discrimina melhor que o CURB-65 no extremo inferior, o que se traduz em menos internações desnecessárias, mas exige gasometria e radiografia e portanto não funciona fora do hospital. Historicamente, o escore fez mais do que estratificar: o ensaio de implementação de Yealy demonstrou que aplicá-lo de forma sistemática reduz internações sem aumentar mortalidade ou reinternação — evidência de que o problema que ele resolve é real, e é o excesso de internação por reflexo.',
  armadilhas: [
    'Classe I exige simultaneamente idade abaixo de 50, nenhuma comorbidade da lista e nenhuma alteração de exame físico ou laboratorial. Basta um item para sair da classe I.',
    'O escore não considera fatores sociais, adesão, capacidade de ingestão oral e acesso a retorno — que frequentemente decidem a internação na prática.',
    'Confusão de unidade entre ureia e BUN é o erro numérico mais comum: ureia ≥ 64 mg/dL equivale a BUN ≥ 30 mg/dL (divida a ureia por 2,14). Usar 30 mg/dL de ureia pontua quase todo mundo indevidamente.',
    'Mulheres subtraem 10 pontos da idade. Esquecer o ajuste desloca a classe de muitas pacientes na faixa limítrofe entre III e IV.',
    'A hipoxemia vale apenas 10 pontos, peso desproporcionalmente baixo para um achado grave. Insuficiência respiratória com necessidade de oxigênio alto indica internação independentemente da classe.',
    'Vinte variáveis cobradas de memória levam a omissão, e toda omissão subestima. Se não houver como conferir a lista inteira, use o CURB-65 ou o CRB-65 em vez de um PSI incompleto.',
  ],
  referencias: [
    { texto: 'Fine MJ, Auble TE, Yealy DM, et al. A prediction rule to identify low-risk patients with community-acquired pneumonia. N Engl J Med. 1997;336(4):243-250.' },
    { texto: 'Yealy DM, Auble TE, Stone RA, et al. Effect of increasing the intensity of implementing pneumonia guidelines: a randomized, controlled trial. Ann Intern Med. 2005;143(12):881-894.' },
    { texto: 'Metlay JP, Waterer GW, Long AC, et al. Diagnosis and Treatment of Adults with Community-acquired Pneumonia. An Official Clinical Practice Guideline of the ATS and IDSA. Am J Respir Crit Care Med. 2019;200(7):e45-e67.' },
  ],
}

const mmrc: Ferramenta = {
  id: 'mmrc',
  nome: 'Escala mMRC de dispneia',
  sinonimos: ['mmrc', 'dispneia', 'mrc modificada'],
  resumo: 'Gradua a dispneia pelo impacto na atividade cotidiana, de 0 a 4.',
  categorias: ['pneumologia'],
  campos: [
    campoOpc('grau', 'Grau de dispneia', [
      { valor: '0', rotulo: 'Grau 0 — só com exercício intenso', pontos: 0, descricao: 'Corrida, subir vários andares, carregar peso. A vida cotidiana não é limitada.' },
      { valor: '1', rotulo: 'Grau 1 — ao andar apressado no plano ou subir ladeira leve', pontos: 1, descricao: 'Anda no plano no próprio ritmo sem parar, mas sente falta de ar quando acelera ou sobe.' },
      { valor: '2', rotulo: 'Grau 2 — anda mais devagar que pessoas da mesma idade, ou precisa parar ao andar no próprio passo', pontos: 2, descricao: 'O divisor de águas da escala: é aqui que a dispneia passa a mudar o comportamento. Pergunte "o senhor consegue acompanhar alguém da sua idade andando?".' },
      { valor: '3', rotulo: 'Grau 3 — para para respirar após andar cerca de 100 m ou alguns minutos no plano', pontos: 3, descricao: 'Ancore em referências concretas do dia a dia da pessoa: uma quadra, do portão ao ponto de ônibus, o corredor do posto.' },
      { valor: '4', rotulo: 'Grau 4 — dispneia impede sair de casa, ou surge ao vestir-se e despir-se', pontos: 4, descricao: 'Dispneia em atividade de autocuidado. Marca doença muito avançada e justifica discutir cuidado paliativo concomitante.' },
    ], { ajuda: 'Pergunte pela atividade que desencadeia, não pela intensidade da falta de ar. A escala mede incapacidade, e a resposta certa vem de exemplos concretos da rotina da pessoa.' }),
  ],
  calcular: (v) => {
    const g = num(v, 'grau')
    if (g === null) return null
    return {
      titulo: 'mMRC',
      valor: `Grau ${g}`,
      nivel: g >= 3 ? 'critico' : g === 2 ? 'alerta' : 'ok',
      rotuloNivel: g >= 2 ? 'Dispneia com impacto funcional relevante' : 'Dispneia leve',
      detalhes: [
        { rotulo: 'Ponto de corte do GOLD', valor: 'mMRC ≥ 2', nota: 'Define o grupo "mais sintomático" (B ou E) na avaliação de DPOC, junto com o CAT ≥ 10.', nivel: g >= 2 ? 'alerta' : 'ok' },
        { rotulo: 'Contribuição ao BODE', valor: `${Math.min(g === 0 || g === 1 ? 0 : g - 1, 3)} ponto(s)`, nota: 'No BODE, os graus 0 e 1 valem 0; grau 2 vale 1; grau 3 vale 2; grau 4 vale 3.' },
      ],
      interpretacao: [
        'A mMRC mede **incapacidade** por dispneia, não intensidade de falta de ar. Isso a torna estável ao longo do tempo e ótima para estratificar, mas pouco sensível a mudança aguda — para acompanhar resposta a tratamento, o CAT e a escala de Borg funcionam melhor.',
        g >= 2
          ? 'A partir do grau 2 há indicação formal de reabilitação pulmonar na DPOC, que é a intervenção com maior efeito sobre dispneia e qualidade de vida em toda a doença — maior que qualquer broncodilatador isolado.'
          : 'Nos graus 0 e 1, o foco é cessação do tabagismo, vacinação e otimização do broncodilatador.',
        'A fisiopatologia por trás do grau explica por que ele prediz mortalidade: a dispneia da DPOC não vem principalmente da obstrução, e sim da **hiperinsuflação dinâmica**. Com o fluxo expiratório limitado, o esforço encurta o tempo de expiração antes que o pulmão volte à capacidade residual funcional; o ar aprisionado empurra o volume corrente para a porção plana da curva de complacência, o diafragma se achata e perde vantagem mecânica, e a carga inspiratória sobe justamente quando o músculo está pior posicionado. É essa dissociação entre o esforço que o cérebro comanda e o volume que o tórax entrega — o *neuromechanical uncoupling* — que a pessoa sente como falta de ar. Daí o grau mMRC refletir desempenho global, e não VEF₁.',
      ],
      conduta: g >= 2
        ? [
            'Encaminhe à **reabilitação pulmonar** — indicação formal a partir de mMRC 2. O programa supervisionado de 6 a 12 semanas melhora dispneia, capacidade de exercício e qualidade de vida com magnitude maior que a de qualquer fármaco isolado, e reduz reinternação após exacerbação.',
            'Reavalie o esquema inalatório: mMRC ≥ 2 coloca o paciente no grupo B ou E do GOLD, onde a broncodilatação dupla (LABA + LAMA) é preferida à monoterapia. Confira a técnica do dispositivo na consulta, não presuma.',
            'Investigue e trate as causas somadas de dispneia que a escala não separa: anemia, insuficiência cardíaca, descondicionamento, obesidade, ansiedade e hipertensão pulmonar. Na DPOC avançada, a dispneia raramente tem causa única.',
            g === 4
              ? 'No grau 4, avalie oxigenoterapia domiciliar prolongada (se PaO₂ ≤ 55 mmHg ou ≤ 59 com cor pulmonale/policitemia), discuta cuidado paliativo concomitante e considere opioide em dose baixa para dispneia refratária, que tem evidência específica nesse cenário.'
              : 'Registre o grau no prontuário como número: é a única forma de saber, na próxima consulta, se houve progressão real ou apenas um dia pior.',
          ]
        : [
            'Cessação do tabagismo é a única intervenção que altera a inclinação da queda do VEF₁. Ofereça terapia farmacológica (vareniclina, bupropiona ou reposição de nicotina) somada a suporte comportamental — conselho isolado tem eficácia baixa.',
            'Vacinação: influenza anual, pneumocócica, coqueluche e COVID-19 conforme o calendário vigente. Exacerbação infecciosa é o principal motor de perda funcional.',
            'Otimize o broncodilatador de longa duração e confirme a técnica inalatória. Estimule atividade física regular mesmo sem indicação formal de reabilitação.',
            'Reaplique a escala a cada consulta. A passagem de 1 para 2 é o gatilho de reabilitação e costuma passar despercebida se o grau não estiver registrado.',
          ],
      alertas: [
        'A mMRC é um dos dois eixos da avaliação sintomática do GOLD, e é a **menos** sensível dos dois. Se o paciente pontua mMRC 0 ou 1 mas tem tosse, expectoração ou despertares noturnos, aplique o CAT: um CAT ≥ 10 já o coloca no grupo mais sintomático, mesmo com mMRC baixa.',
        'Dispneia de início recente ou progressão rápida de grau não é para ser graduada e arquivada: investigue exacerbação, tromboembolismo pulmonar, pneumotórax, insuficiência cardíaca e anemia antes de atribuir à DPOC de base.',
      ],
      tabela: {
        titulo: 'Graus, equivalência no BODE e consequência prática',
        colunas: ['Grau', 'Atividade limitada', 'Pontos no BODE', 'Consequência'],
        linhas: [
          ['0', 'Só exercício intenso', '0', 'Cessação do tabagismo e vacinação'],
          ['1', 'Andar apressado ou subir ladeira', '0', 'Broncodilatador de longa duração'],
          ['2', 'Anda mais devagar que a própria idade', '1', 'Reabilitação pulmonar indicada'],
          ['3', 'Para após ~100 m no plano', '2', 'Broncodilatação dupla e reavaliar O₂'],
          ['4', 'Dispneia ao vestir-se', '3', 'Avaliar O₂ domiciliar e paliativo'],
        ],
        destaque: g,
      },
    }
  },
  formula: ['Escala ordinal de 0 a 4, definida pela atividade que desencadeia a dispneia'],
  fundamento:
    'A escala nasceu do questionário do Medical Research Council britânico dos anos 1950, criado por Fletcher para estudos epidemiológicos em mineradores de carvão — o objetivo era comparar populações, não tratar indivíduos, e isso explica sua construção grosseira de propósito. A versão modificada renumerou de 0 a 4 e é hoje um dos dois eixos da classificação GOLD de DPOC, ao lado do histórico de exacerbações. O que ela mede, conceitualmente, é **incapacidade** e não sensação: a pergunta não é "o quanto falta o ar" mas "o que a falta de ar impede". Essa escolha tem uma consequência importante — a mMRC é robusta entre observadores e estável no tempo, o que a torna excelente para estratificar risco e comparar coortes, mas deliberadamente insensível a mudança aguda. Bestall e colaboradores demonstraram em 1999 que o grau se correlaciona melhor com qualidade de vida, distância caminhada e mortalidade em cinco anos do que o VEF₁ isolado, resultado que parece paradoxal até se entender a hiperinsuflação dinâmica como mecanismo dominante da dispneia.',
  armadilhas: [
    'Existem duas numerações em circulação (1 a 5 na MRC original, 0 a 4 na modificada). Registre sempre "mMRC" para evitar deslocamento de um grau — um erro que muda o grupo GOLD e a indicação de reabilitação.',
    'Limitação por osteoartrose, obesidade, doença vascular periférica ou sequela de AVC eleva a pontuação sem que a dispneia seja pulmonar. A escala mede o que a pessoa não faz, não por que não faz.',
    'É insensível a mudança aguda por construção. Para acompanhar resposta a tratamento use o CAT ou a escala de Borg; para medir exacerbação, use os critérios clínicos, não o deslocamento de grau.',
    'O grau depende de quanto a pessoa ainda tenta fazer. Idoso sedentário e restrito ao domicílio por escolha ou por medo pode reportar grau baixo simplesmente por nunca atingir o esforço que revelaria a limitação — pergunte pelo que ele fazia há um ano.',
  ],
  referencias: [
    { texto: 'Bestall JC, Paul EA, Garrod R, et al. Usefulness of the Medical Research Council (MRC) dyspnoea scale as a measure of disability in patients with COPD. Thorax. 1999;54(7):581-586.' },
    { texto: 'Global Initiative for Chronic Obstructive Lung Disease. GOLD 2024 Report.' },
  ],
}

const bode: Ferramenta = {
  id: 'bode',
  nome: 'Índice BODE para DPOC',
  sinonimos: ['bode', 'dpoc prognostico', 'bode index'],
  resumo: 'Prognóstico multidimensional da DPOC: massa corporal, obstrução, dispneia e exercício.',
  categorias: ['pneumologia'],
  campos: [
    campoNum('imc', 'Índice de massa corporal', { unidade: 'kg/m²', min: 10, max: 60, passo: 0.1, ajuda: 'O único componente com corte invertido: IMC ≤ 21 kg/m² pontua. Magreza na DPOC é marcador de gravidade, não de saúde.' }),
    campoNum('vef1', 'VEF₁ pós-broncodilatador', { unidade: '% do predito', min: 10, max: 130, passo: 1, ajuda: 'Use o valor pós-broncodilatador, medido fora de exacerbação. O pré-broncodilatador superestima a gravidade e infla o escore.' }),
    campoOpc('mmrc', 'Dispneia (mMRC)', [
      { valor: '0', rotulo: 'Grau 0 ou 1', pontos: 0 },
      { valor: '1', rotulo: 'Grau 2', pontos: 1 },
      { valor: '2', rotulo: 'Grau 3', pontos: 2 },
      { valor: '3', rotulo: 'Grau 4', pontos: 3 },
    ], { ajuda: 'Atenção à compressão da escala: os graus 0 e 1 da mMRC valem ambos 0 ponto aqui, então o BODE só começa a contar dispneia a partir do grau 2.' }),
    campoNum('tc6', 'Distância no teste de caminhada de 6 minutos', { unidade: 'm', min: 0, max: 900, passo: 5, ajuda: 'Teste padronizado: corredor plano de 30 m, sem aquecimento, incentivo verbal a cada minuto com frases fixas. Improvisar invalida 3 dos 10 pontos.' }),
  ],
  calcular: (v) => {
    const imc = num(v, 'imc')
    const vef1 = num(v, 'vef1')
    const mmrcP = num(v, 'mmrc')
    const tc6 = num(v, 'tc6')
    if (imc === null || vef1 === null || mmrcP === null || tc6 === null) return null
    const pB = imc > 21 ? 0 : 1
    const pO = vef1 >= 65 ? 0 : vef1 >= 50 ? 1 : vef1 >= 36 ? 2 : 3
    const pD = mmrcP
    const pE = tc6 >= 350 ? 0 : tc6 >= 250 ? 1 : tc6 >= 150 ? 2 : 3
    const total = pB + pO + pD + pE
    const quartil = total <= 2 ? 0 : total <= 4 ? 1 : total <= 6 ? 2 : 3
    const sobrevida = ['80%', '67%', '57%', '18%'][quartil]
    return {
      titulo: 'Índice BODE',
      valor: String(total),
      unidade: 'de 10 pontos',
      nivel: (['ok', 'atencao', 'alerta', 'critico'] as Nivel[])[quartil],
      rotuloNivel: `Quartil ${quartil + 1} — sobrevida em 4 anos de ${sobrevida}`,
      detalhes: [
        { rotulo: 'B — índice de massa corporal', valor: `${pB} ponto(s)`, nota: 'IMC ≤ 21 kg/m² vale 1 ponto. Na DPOC, magreza é marcador de gravidade, não de saúde.' },
        { rotulo: 'O — obstrução (VEF₁)', valor: `${pO} ponto(s)` },
        { rotulo: 'D — dispneia (mMRC)', valor: `${pD} ponto(s)` },
        { rotulo: 'E — exercício (TC6)', valor: `${pE} ponto(s)` },
        { rotulo: 'Sobrevida estimada em 4 anos', valor: sobrevida },
      ],
      interpretacao: [
        'O BODE prediz mortalidade melhor do que o VEF₁ isolado, e essa é a razão de existir: a DPOC é uma doença sistêmica, e o pulmão sozinho não conta a história. Perda de massa magra, limitação funcional e percepção de dispneia carregam informação prognóstica independente da espirometria.',
        'O componente nutricional é contraintuitivo. Na DPOC avançada, IMC baixo reflete disfunção muscular esquelética e estado inflamatório sistêmico, e associa-se independentemente a mortalidade — a chamada "obesity paradox" da DPOC.',
        'Uso prático: BODE ≥ 7 é um dos critérios considerados para avaliação de transplante pulmonar e para discussão de cuidados paliativos concomitantes.',
        'O mecanismo que une os quatro componentes é a **caquexia pulmonar**. A DPOC avançada mantém um estado inflamatório sistêmico de baixo grau (TNF-α, IL-6, proteína C reativa) que ativa a via ubiquitina-proteassoma no músculo esquelético; a isso somam-se o gasto energético aumentado pelo trabalho respiratório contra a hiperinsuflação, a ingestão reduzida pela dispneia durante as refeições e o descondicionamento por inatividade. O resultado é perda de massa magra — não apenas de gordura — que atinge também o diafragma e o quadríceps. Por isso o IMC baixo e a distância caminhada carregam informação prognóstica independente da espirometria: eles medem o dano sistêmico que o VEF₁ não vê.',
      ],
      conduta: [
        quartil >= 2
          ? 'Reabilitação pulmonar com treino de força e aeróbio é prioridade absoluta nesta faixa — é a única intervenção que move simultaneamente três dos quatro componentes (D, E e, pelo ganho de massa magra, o B).'
          : 'Mantenha o paciente ativo e reaplique o índice anualmente: o BODE serve para detectar trajetória, e um único valor diz menos que a variação em 12 meses.',
        pB === 1
          ? 'Avalie e trate a desnutrição: aporte calórico e proteico dirigido (mínimo 1,2 a 1,5 g/kg/dia de proteína), fracionamento das refeições para reduzir dispneia pós-prandial e suplemento oral se a ingestão habitual for insuficiente. Suporte nutricional isolado tem efeito modesto; associado a treino de resistência, produz ganho real de massa magra.'
          : 'IMC preservado não descarta sarcopenia: na DPOC existe obesidade sarcopênica, com massa magra baixa e gordura normal. Se houver dúvida, meça força de preensão palmar ou circunferência muscular do braço.',
        'Otimize o que é reversível antes de concluir que o escore é o prognóstico: técnica inalatória, adesão, broncodilatação dupla, tratamento de comorbidade cardiovascular, oxigenoterapia se indicada e cessação do tabagismo — que segue valendo em qualquer quartil.',
        quartil === 3
          ? 'BODE 7 a 10 é gatilho de duas conversas: encaminhamento para avaliação de transplante pulmonar (se idade e comorbidades permitirem) e introdução de cuidados paliativos concomitantes, com planejamento antecipado de cuidados. Sobrevida de 18% em 4 anos torna essa discussão parte do tratamento, não o seu abandono.'
          : 'Registre o BODE no prontuário com os quatro componentes separados. Saber qual deles piorou orienta a intervenção; o total isolado, não.',
      ],
      alertas: [
        'O BODE é ferramenta de **prognóstico populacional**, não de decisão individual isolada. Sobrevida de 18% em 4 anos no quarto quartil descreve um grupo, e o paciente à sua frente pode estar em qualquer ponto dessa distribuição.',
        'Não aplique durante ou até 4 a 6 semanas após uma exacerbação: VEF₁, mMRC e distância caminhada estão todos deprimidos pelo evento agudo, e o escore superestima a gravidade basal.',
        'O índice não inclui exacerbações nem comorbidade cardiovascular, que são determinantes maiores de mortalidade na DPOC. Variantes como o BODEx (troca o teste de caminhada por exacerbações) e o ADO existem exatamente para cobrir isso.',
      ],
      tabela: {
        titulo: 'Quartis e sobrevida em 4 anos',
        colunas: ['Pontos', 'Quartil', 'Sobrevida em 4 anos'],
        linhas: [['0 – 2', '1', '80%'], ['3 – 4', '2', '67%'], ['5 – 6', '3', '57%'], ['7 – 10', '4', '18%']],
        destaque: quartil,
      },
    }
  },
  formula: ['BODE = B (IMC) + O (VEF₁% predito) + D (mMRC) + E (TC6 min)'],
  fundamento:
    'Celli e colaboradores construíram o índice em 2004 a partir da observação de que pacientes com o mesmo VEF₁ tinham sobrevidas muito diferentes. Testaram várias combinações de variáveis e chegaram às quatro que, juntas, maximizavam a discriminação de mortalidade — cada uma representando uma dimensão distinta: nutrição, função pulmonar, sintoma e desempenho. O BODE prediz mortalidade melhor que o VEF₁ isolado porque a doença pulmonar obstrutiva crônica é sistêmica, e não apenas pulmonar. Ele soma a **obstrução** (VEF₁), a **hiperinsuflação e a desnutrição** (índice de massa corporal, que reflete a caquexia pulmonar por ativação da via ubiquitina-proteassoma sob inflamação sistêmica e por aumento do trabalho respiratório), a **percepção de limitação** (mMRC, que traduz a hiperinsuflação dinâmica) e a **capacidade funcional integrada** (teste de caminhada de 6 minutos, que mede a soma de reserva ventilatória, cardiovascular e muscular periférica).',
  armadilhas: [
    'O teste de caminhada de 6 minutos precisa ser padronizado (corredor plano de 30 m, incentivo verbal padronizado, sem aquecimento). Improvisar o teste invalida o componente E, que pesa 3 dos 10 pontos.',
    'O VEF₁ é o pós-broncodilatador; usar o pré-broncodilatador superestima a gravidade.',
    'Aplicado durante exacerbação, o índice mede o evento agudo e não o prognóstico de base. Espere 4 a 6 semanas de estabilidade clínica.',
    'O componente B é o único com corte invertido (IMC ≤ 21 pontua). É erro comum pontuar o obeso, invertendo a lógica do índice.',
    'O BODE não contempla exacerbações, e exacerbação frequente é preditor independente de mortalidade. Um paciente com BODE baixo e três exacerbações no ano não é de baixo risco — considere o BODEx nessa situação.',
  ],
  referencias: [
    { texto: 'Celli BR, Cote CG, Marin JM, et al. The body-mass index, airflow obstruction, dyspnea, and exercise capacity index in chronic obstructive pulmonary disease. N Engl J Med. 2004;350(10):1005-1012.' },
    { texto: 'Puhan MA, Garcia-Aymerich J, Frey M, et al. Expansion of the prognostic assessment of patients with COPD: the updated BODE index and the ADO index. Lancet. 2009;374(9691):704-711.' },
    { texto: 'Soler-Cataluña JJ, Martínez-García MA, Sánchez L, et al. Severe exacerbations and BODE index: two independent risk factors for death in male COPD patients. Respir Med. 2009;103(5):692-699.' },
  ],
}

const controleAsma: Ferramenta = {
  id: 'controle-asma',
  nome: 'Controle da asma: GINA e teste de controle (ACT)',
  sinonimos: ['asma controle', 'act', 'gina', 'asthma control test'],
  resumo: 'Avalia o controle da asma pelos dois instrumentos mais usados, lado a lado.',
  categorias: ['pneumologia'],
  campos: [
    campoSimNao('gDia', 'Sintomas diurnos mais de 2 vezes por semana (últimas 4 semanas)', 1, 'Sintomas diurnos mais de duas vezes por semana nas últimas 4 semanas — conte episódios, não dias com qualquer sintoma leve.'),
    campoSimNao('gNoite', 'Qualquer despertar noturno por asma', 1, 'Qualquer despertar noturno por asma. Um único episódio já pontua, porque sintoma noturno marca inflamação não controlada.'),
    campoSimNao('gResgate', 'Uso de medicação de resgate mais de 2 vezes por semana', 1, 'Não conta o uso profilático antes do exercício.'),
    campoSimNao('gAtividade', 'Qualquer limitação de atividade por asma', 1, 'Qualquer limitação de atividade habitual por asma, inclusive a que o paciente já naturalizou e não relata espontaneamente.'),
    campoOpc('act1', 'ACT 1 — Nas últimas 4 semanas, quanto a asma impediu você de fazer suas atividades?', [
      { valor: '5', rotulo: 'Nenhuma vez', pontos: 5 },
      { valor: '4', rotulo: 'Poucas vezes', pontos: 4 },
      { valor: '3', rotulo: 'Algumas vezes', pontos: 3 },
      { valor: '2', rotulo: 'A maior parte do tempo', pontos: 2 },
      { valor: '1', rotulo: 'Todo o tempo', pontos: 1 },
    ], { ajuda: 'O ACT pergunta sobre as últimas 4 semanas e é respondido pelo próprio paciente. Pontuação de 25 indica controle total; abaixo de 20, asma não controlada.' }),
    campoOpc('act2', 'ACT 2 — Com que frequência você teve falta de ar?', [
      { valor: '5', rotulo: 'Nenhuma vez', pontos: 5 },
      { valor: '4', rotulo: '1 a 2 vezes por semana', pontos: 4 },
      { valor: '3', rotulo: '3 a 6 vezes por semana', pontos: 3 },
      { valor: '2', rotulo: 'Uma vez ao dia', pontos: 2 },
      { valor: '1', rotulo: 'Mais de uma vez ao dia', pontos: 1 },
    ]),
    campoOpc('act3', 'ACT 3 — Com que frequência os sintomas o despertaram à noite ou mais cedo pela manhã?', [
      { valor: '5', rotulo: 'Nenhuma vez', pontos: 5 },
      { valor: '4', rotulo: '1 a 2 vezes', pontos: 4 },
      { valor: '3', rotulo: 'Uma vez por semana', pontos: 3 },
      { valor: '2', rotulo: '2 a 3 noites por semana', pontos: 2 },
      { valor: '1', rotulo: '4 ou mais noites por semana', pontos: 1 },
    ]),
    campoOpc('act4', 'ACT 4 — Com que frequência usou o medicamento de resgate?', [
      { valor: '5', rotulo: 'Nenhuma vez', pontos: 5 },
      { valor: '4', rotulo: 'Uma vez por semana ou menos', pontos: 4 },
      { valor: '3', rotulo: 'Algumas vezes por semana', pontos: 3 },
      { valor: '2', rotulo: '1 a 2 vezes por dia', pontos: 2 },
      { valor: '1', rotulo: '3 ou mais vezes por dia', pontos: 1 },
    ]),
    campoOpc('act5', 'ACT 5 — Como você classificaria seu controle da asma nas últimas 4 semanas?', [
      { valor: '5', rotulo: 'Completamente controlada', pontos: 5 },
      { valor: '4', rotulo: 'Bem controlada', pontos: 4 },
      { valor: '3', rotulo: 'Um pouco controlada', pontos: 3 },
      { valor: '2', rotulo: 'Mal controlada', pontos: 2 },
      { valor: '1', rotulo: 'Não controlada', pontos: 1 },
    ]),
  ],
  calcular: (v) => {
    const gina = somaSimNao(v, [
      { id: 'gDia', pontos: 1 },
      { id: 'gNoite', pontos: 1 },
      { id: 'gResgate', pontos: 1 },
      { id: 'gAtividade', pontos: 1 },
    ])
    let act = 0
    for (const id of ['act1', 'act2', 'act3', 'act4', 'act5']) {
      const x = num(v, id)
      if (x === null) return null
      act += x
    }
    const ginaTexto = gina === 0 ? 'Controlada' : gina <= 2 ? 'Parcialmente controlada' : 'Não controlada'
    const actTexto = act >= 20 ? 'Bem controlada' : act >= 16 ? 'Não bem controlada' : 'Muito mal controlada'
    const nivel: Nivel = gina >= 3 || act <= 15 ? 'critico' : gina >= 1 || act < 20 ? 'alerta' : 'ok'
    return {
      titulo: 'Controle da asma',
      valor: ginaTexto,
      nivel,
      rotuloNivel: `GINA: ${gina} de 4 critérios | ACT: ${act} de 25 (${actTexto})`,
      detalhes: [
        { rotulo: 'Avaliação GINA', valor: `${gina} critério(s) — ${ginaTexto}`, nota: '0 = controlada; 1 a 2 = parcialmente controlada; 3 a 4 = não controlada.' },
        { rotulo: 'Teste de controle da asma (ACT)', valor: `${act} pontos — ${actTexto}`, nota: '≥ 20 bem controlada; 16 a 19 não bem controlada; ≤ 15 muito mal controlada. Diferença mínima clinicamente importante: 3 pontos.' },
      ],
      interpretacao: [
        nivel === 'ok'
          ? 'Asma controlada. Mantenha o tratamento e reavalie em 3 meses; considere redução de etapa se o controle estiver mantido há pelo menos 3 meses.'
          : 'Asma não controlada. Antes de subir a etapa de tratamento, verifique os quatro pontos que respondem pela maioria dos casos: **técnica inalatória** (peça para demonstrar), **adesão**, **comorbidades** (rinite, refluxo, obesidade, apneia do sono, ansiedade) e **exposições** (tabaco, mofo, ácaro, animal, beta-bloqueador, anti-inflamatório).',
        'Desde 2019 o GINA não recomenda mais tratar asma apenas com beta-agonista de curta duração. Toda asma, inclusive a leve, deve receber corticoide inalatório — como resgate combinado com formoterol ou em uso regular. O uso isolado de salbutamol associa-se a mais exacerbações e mortes.',
        'Controle ≠ gravidade. Controle é o quanto os sintomas se manifestam agora; gravidade é a intensidade de tratamento necessária para obter controle. Um paciente pode ter asma grave bem controlada.',
        'O que os dois instrumentos rastreiam, no fundo, é **inflamação brônquica persistente**. A asma é uma doença inflamatória crônica das vias aéreas, tipicamente do tipo 2, com eosinófilos, mastócitos e linfócitos Th2 produzindo IL-4, IL-5 e IL-13; essa inflamação gera hiper-responsividade brônquica, edema de mucosa e hipersecreção. O beta-agonista de curta duração relaxa o músculo liso e abre o brônquio em minutos, mas não toca na inflamação — o paciente melhora e continua doente. Pior: o uso repetido de beta-agonista isolado provoca dessensibilização de receptores beta-2, aumento da hiper-responsividade e possível inflamação de rebote, o que explica a associação epidemiológica entre consumo alto de salbutamol e mortalidade. Enquanto isso, a inflamação não tratada promove **remodelamento** — hipertrofia de músculo liso, fibrose subepitelial, metaplasia de células caliciformes e angiogênese — que converte obstrução reversível em obstrução fixa. É por isso que a pergunta sobre uso de resgate pesa tanto nos dois instrumentos: ela não mede sintoma, mede inflamação descoberta, e cada semana nesse estado deixa sequela estrutural.',
      ],
      conduta: nivel === 'ok'
        ? [
            'Mantenha o esquema atual e reavalie em 3 a 6 meses. Considere **redução de etapa** somente após 3 meses de controle mantido, reduzindo a dose de corticoide inalatório em 25 a 50% por vez e nunca suspendendo o corticoide inalatório por completo na asma persistente.',
            'Confirme a técnica inalatória na consulta mesmo com o controle bom — a técnica se deteriora com o tempo e é a causa mais frequente de perda de controle futura.',
            'Reforce o plano de ação escrito: o que fazer no aumento de sintomas, quando dobrar ou quadruplicar o corticoide inalatório, quando iniciar corticoide oral e quando procurar emergência.',
            'Revise vacinação (influenza anual, pneumocócica, COVID-19), cessação do tabagismo e controle de comorbidades, sobretudo rinite alérgica e obesidade.',
          ]
        : [
            'Antes de subir a etapa, resolva os quatro pontos que respondem pela maioria das falhas: **técnica inalatória** (peça a demonstração, não pergunte se ele sabe), **adesão** (pergunte de forma não julgadora quantas doses esqueceu na semana), **comorbidades** (rinite, refluxo, obesidade, apneia do sono, ansiedade, disfunção de cordas vocais) e **exposições** (tabaco, mofo, ácaro, animal, betabloqueador, anti-inflamatório não esteroidal). Subir etapa sem checar isso trata o médico, não o paciente.',
            'Garanta que o esquema contenha corticoide inalatório. A abordagem preferida do GINA é corticoide inalatório com formoterol como resgate (estratégia MART), que trata a inflamação no momento exato em que a inflamação se manifesta. Nunca mantenha tratamento apenas com beta-agonista de curta duração.',
            'Se após a revisão o controle persistir inadequado, suba uma etapa e reavalie em 4 a 8 semanas. Corticoide oral de curta duração é para exacerbação, não para controle crônico.',
            nivel === 'critico'
              ? 'Asma não controlada em etapa alta é critério de encaminhamento ao especialista para investigar asma grave: confirme o diagnóstico com espirometria e prova broncodilatadora, dose eosinófilos, IgE total e específicas, e considere fenotipagem para terapia biológica (anti-IgE, anti-IL-5, anti-IL-4Rα). Investigue também diagnósticos alternativos ou concomitantes — DPOC, bronquiectasias, aspergilose broncopulmonar alérgica, disfunção de cordas vocais.'
              : 'Registre o ACT numericamente para comparar na próxima consulta: variação de 3 pontos é a diferença mínima clinicamente importante, e sem o número anterior essa comparação não existe.',
          ],
      alertas: [
        'Controle aparentemente bom não exclui risco de exacerbação grave. Exacerbação com corticoide oral no último ano, internação prévia por asma, VEF₁ baixo, eosinofilia e má adesão são fatores de risco independentes — avalie-os separadamente do controle sintomático.',
        'O uso isolado de beta-agonista de curta duração não é mais tratamento aceitável para nenhuma gravidade de asma, inclusive a leve. Essa recomendação mudou em 2019 e segue sendo a prescrição inadequada mais comum.',
        'Estes instrumentos avaliam asma **estável em ambulatório**. Na crise aguda a avaliação é outra: pico de fluxo, saturação, uso de musculatura acessória, capacidade de falar e nível de consciência — e nenhum questionário de 4 semanas ajuda ali.',
      ],
      tabela: {
        titulo: 'Equivalência entre os dois instrumentos',
        colunas: ['GINA (critérios)', 'ACT (pontos)', 'Classificação', 'Conduta'],
        linhas: [
          ['0', '≥ 20', 'Controlada', 'Manter; considerar redução após 3 meses'],
          ['1 – 2', '16 – 19', 'Parcialmente controlada', 'Revisar técnica, adesão e comorbidades'],
          ['3 – 4', '≤ 15', 'Não controlada', 'Revisar e subir etapa; avaliar asma grave'],
        ],
        destaque: nivel === 'ok' ? 0 : nivel === 'alerta' ? 1 : 2,
      },
    }
  },
  formula: ['GINA: 4 perguntas — 0 controlada, 1–2 parcialmente, 3–4 não controlada', 'ACT: soma de 5 itens (1 a 5 pontos cada), total 5 a 25'],
  fundamento:
    'Os dois instrumentos medem a mesma coisa por caminhos diferentes: o GINA usa quatro perguntas dicotômicas focadas nas últimas quatro semanas e é o padrão das diretrizes; o ACT usa uma escala contínua validada psicometricamente, com melhor sensibilidade para mudança ao longo do tempo. Aplicá-los juntos dá uma classificação e uma medida de acompanhamento. A diferença de construção tem consequência prática. O GINA foi desenhado para **classificar** e portanto é deliberadamente grosseiro: quatro perguntas de sim ou não, sem gradação, porque o que ele precisa produzir é uma decisão de etapa terapêutica. O ACT foi desenvolvido por Nathan e colaboradores a partir de um conjunto grande de itens candidatos, reduzidos por análise psicométrica aos cinco com maior poder discriminante, cada um em escala Likert de 5 pontos — e por isso tem resolução suficiente para detectar mudança dentro do mesmo paciente, com diferença mínima clinicamente importante estabelecida em 3 pontos. Um detalhe conceitual importante: o quinto item do ACT pede a autoavaliação global do paciente, o que introduz deliberadamente a percepção subjetiva de controle. Isso é útil porque a percepção prediz adesão e comportamento de busca de cuidado, mas também é o item que mais frequentemente discorda dos outros quatro — o paciente com asma cronicamente mal controlada recalibra a própria expectativa e passa a chamar de "bem controlada" uma vida que já foi restringida pela doença. Quando o item 5 discorda dos demais, acredite nos demais.',
  armadilhas: [
    'O uso de resgate antes do exercício, quando profilático e planejado, não conta como perda de controle.',
    'ACT não foi validado abaixo de 12 anos — para crianças de 4 a 11 anos existe o childhood ACT, com escala e pontos de corte diferentes.',
    'Paciente com asma de longa data recalibra a própria expectativa e subnotifica sintomas. Pergunte por atividades concretas que ele deixou de fazer, não se "está bem" — e desconfie quando o item 5 for muito melhor que os outros quatro.',
    'Os dois instrumentos medem controle de sintomas e não predizem bem risco de exacerbação. Um paciente com ACT 24 e internação por asma no último ano continua de alto risco, e isso precisa ser avaliado à parte.',
    'Nenhum dos dois serve para a crise aguda: a janela de 4 semanas é longa e dilui o evento atual. Na emergência, avalie pico de fluxo, saturação, fala e musculatura acessória.',
    'Controle ruim atribuído à gravidade da doença quando a causa real é técnica inalatória errada leva a escalada terapêutica desnecessária. Cerca de metade dos pacientes usa o dispositivo de forma incorreta, e a maioria acredita que usa certo.',
  ],
  referencias: [
    { texto: 'Global Initiative for Asthma. Global Strategy for Asthma Management and Prevention. 2024.' },
    { texto: 'Nathan RA, Sorkness CA, Kosinski M, et al. Development of the Asthma Control Test. J Allergy Clin Immunol. 2004;113(1):59-65.' },
  ],
}

const rox: Ferramenta = {
  id: 'indice-rox',
  nome: 'Índice ROX',
  sinonimos: ['rox', 'cateter nasal alto fluxo', 'cnaf', 'high flow'],
  resumo: 'Prediz sucesso ou falha do cateter nasal de alto fluxo na insuficiência respiratória.',
  categorias: ['pneumologia', 'emergencia'],
  campos: [
    campoNum('spo2', 'SpO₂', { unidade: '%', min: 50, max: 100, passo: 1, normalMin: 92, normalMax: 96, ajuda: 'Oximetria de pulso com curva pletismográfica confiável. Acima de 97% a relação SpO₂/FiO₂ satura e o índice perde resolução, pela porção plana da curva de dissociação da hemoglobina.' }),
    campoNum('fio2', 'FiO₂ programada', { unidade: '%', min: 21, max: 100, passo: 1, ajuda: 'A FiO₂ ajustada no blender do alto fluxo. Só é confiável porque o fluxo (≥ 30 L/min) excede o pico inspiratório do paciente — em cateter comum a FiO₂ real é imprevisível e o ROX não se aplica.' }),
    campoNum('fr', 'Frequência respiratória', { unidade: 'irpm', min: 5, max: 60, passo: 1, ajuda: 'Conte por 60 segundos observando o tórax, não confie no valor do monitor por impedância, que superestima com artefato de movimento.' }),
    campoSeg('tempo', 'Tempo de uso do alto fluxo', [
      { valor: '2', rotulo: '2 horas' },
      { valor: '6', rotulo: '6 horas' },
      { valor: '12', rotulo: '12 horas ou mais' },
    ], { ajuda: 'O corte de falha sobe com o tempo: quanto mais horas de alto fluxo, mais se exige do índice para seguir apostando nele.' }),
  ],
  calcular: (v) => {
    const spo2 = num(v, 'spo2')
    const fio2 = num(v, 'fio2')
    const fr = num(v, 'fr')
    if (spo2 === null || fio2 === null || fr === null || fio2 <= 0 || fr <= 0) return null
    const rox = spo2 / fio2 / fr
    const t = opc(v, 'tempo')
    const corteFalha = t === '2' ? 2.85 : t === '6' ? 3.47 : 3.85
    const seguro = rox >= 4.88
    const falha = rox < corteFalha
    const nivel: Nivel = falha ? 'critico' : seguro ? 'ok' : 'alerta'
    return {
      titulo: 'Índice ROX',
      valor: fmt(rox, 2),
      nivel,
      rotuloNivel: falha ? 'Alto risco de falha — considerar intubação' : seguro ? 'Baixo risco de falha' : 'Zona intermediária — reavaliar em 1 a 2 h',
      detalhes: [
        { rotulo: 'Relação SpO₂/FiO₂', valor: fmtInt(spo2 / (fio2 / 100)), nota: 'Abaixo de 315 com SpO₂ ≤ 97% equivale aproximadamente a P/F ≤ 300.' },
        { rotulo: `Corte de falha em ${t} h`, valor: `< ${fmt(corteFalha, 2)}` },
        { rotulo: 'Corte de sucesso', valor: '≥ 4,88', nota: 'Válido nas medidas de 2, 6 e 12 horas.' },
      ],
      interpretacao: [
        'O ROX combina oxigenação e esforço num único número: melhora da saturação **sem** queda da frequência respiratória não é resposta ao tratamento, é maquiagem. Um paciente que sobe a saturação mantendo 38 irpm continua com trabalho respiratório insustentável.',
        falha
          ? 'Abaixo do corte de falha: o retardo da intubação nesta faixa associa-se a mortalidade maior. Reavaliação imediata para via aérea definitiva.'
          : seguro
            ? 'ROX ≥ 4,88 em qualquer dos três momentos identifica pacientes com baixa probabilidade de necessitar intubação.'
            : 'Zona intermediária: mantenha o alto fluxo com reavaliação em 1 a 2 horas e vigilância estreita — a tendência do índice importa mais do que o valor isolado.',
        'A **tendência** vale mais do que o número: ROX que sobe entre 2 e 6 horas é sinal favorável mesmo abaixo de 4,88; ROX que cai é sinal de alerta mesmo acima.',
        'O mecanismo que o índice vigia é a **lesão pulmonar autoinfligida** (P-SILI). Na insuficiência respiratória hipoxêmica, o drive respiratório aumentado gera pressões pleurais muito negativas; como o pulmão está heterogêneo, essa pressão se distribui de forma desigual e produz *pendelluft* — ar que migra de região para região dentro do próprio pulmão — com estresse regional que amplifica o edema e a inflamação. O alto fluxo ajuda porque lava o espaço morto nasofaríngeo, oferece FiO₂ confiável, gera pressão positiva modesta e reduz o trabalho inspiratório. Mas se a taquipneia persiste, o drive não foi controlado e o paciente está piorando o próprio pulmão a cada incursão: é isso que o denominador do ROX captura, e é por isso que saturação boa com frequência alta não é sucesso.',
      ],
      conduta: falha
        ? [
            'Prepare a via aérea definitiva **agora**. Nesta faixa, cada hora de retardo na intubação se associa a mortalidade maior, e a deterioração do paciente em alto fluxo costuma ser abrupta — ele compensa até não compensar mais.',
            'Intubação em sequência rápida com pré-oxigenação mantendo o próprio alto fluxo durante a apneia (oxigenação apneica), que prolonga o tempo seguro sem dessaturação. Tenha vasopressor preparado: o colapso hemodinâmico pós-intubação é comum nesse perfil.',
            'Após intubar, ventilação protetora imediata: volume corrente de 6 mL/kg de peso predito, pressão de platô ≤ 30 cmH₂O e driving pressure ≤ 15 cmH₂O. Reavalie a relação PaO₂/FiO₂ para classificar SDRA pelos critérios de Berlim.',
            'Se houver decisão prévia de não intubar, o alto fluxo é tratamento de conforto legítimo — reoriente as metas para alívio da dispneia (opioide em dose baixa) em vez de perseguir o número.',
          ]
        : seguro
          ? [
              'Mantenha o alto fluxo e comece o desmame quando a FiO₂ estiver ≤ 40% com fluxo ≤ 30 L/min de forma estável: reduza primeiro a FiO₂, depois o fluxo, um parâmetro por vez.',
              'Reavalie o ROX a cada 2 a 4 horas mesmo na faixa segura. Um valor ≥ 4,88 descreve o momento, não garante a próxima hora, e o índice existe para ser seriado.',
              'Posição prona vígil pode ser somada em hipoxemia persistente — melhora a relação ventilação-perfusão pelo recrutamento das regiões dorsais dependentes e é bem tolerada em paciente colaborativo.',
              'Não abandone o tratamento da causa: antibiótico se pneumonia, diurético se congestão, anticoagulação se tromboembolismo. O alto fluxo é suporte, e o ROX mede o suporte, não a doença.',
            ]
          : [
              'Mantenha o alto fluxo e **reavalie em 1 a 2 horas**, registrando o valor para comparar. Nesta zona é a direção da curva que decide, não o ponto.',
              'Otimize antes de decidir: fluxo em 50 a 60 L/min se tolerado (é o fluxo que garante a lavagem do espaço morto e a FiO₂ real), umidificação adequada, interface bem posicionada e boca fechada.',
              'Considere prona vígil e trate agressivamente a causa de base e os fatores que inflam a frequência respiratória — dor, febre, acidose metabólica, ansiedade, distensão abdominal.',
              'Defina explicitamente, em prontuário, o gatilho de intubação e quem reavalia. A falha do alto fluxo mata pelo retardo da decisão, e a zona intermediária é onde esse retardo acontece.',
            ],
      alertas: [
        'O índice não foi validado em DPOC exacerbada nem em insuficiência respiratória hipercápnica — nesses cenários a ventilação não invasiva tem precedência sobre o alto fluxo.',
        'Nenhum valor de ROX contraindica intubação. Rebaixamento do nível de consciência, instabilidade hemodinâmica, respiração paradoxal, exaustão da musculatura acessória ou incapacidade de proteger a via aérea indicam via aérea definitiva com ROX alto.',
        'Foi derivado e validado em hipoxemia por pneumonia. Aplicá-lo a edema agudo cardiogênico, asma grave, obstrução de via aérea alta ou doença neuromuscular é uso fora do escopo original.',
      ],
      tabela: {
        titulo: 'Cortes por tempo de uso',
        colunas: ['Tempo em alto fluxo', 'Falha provável', 'Zona intermediária', 'Sucesso provável'],
        linhas: [
          ['2 horas', 'ROX < 2,85', '2,85 – 4,87', 'ROX ≥ 4,88'],
          ['6 horas', 'ROX < 3,47', '3,47 – 4,87', 'ROX ≥ 4,88'],
          ['12 horas ou mais', 'ROX < 3,85', '3,85 – 4,87', 'ROX ≥ 4,88'],
        ],
        destaque: t === '2' ? 0 : t === '6' ? 1 : 2,
      },
    }
  },
  formula: ['ROX = (SpO₂ / FiO₂) / frequência respiratória', 'SpO₂ em %, FiO₂ em fração decimal ou % — o resultado muda de escala, use sempre a mesma'],
  fundamento:
    'Roca e colaboradores construíram o índice sobre a intuição de que qualquer índice de oxigenação isolado é insuficiente para decidir intubação, porque ignora o custo respiratório. Dividir a relação SpO₂/FiO₂ pela frequência respiratória penaliza justamente o paciente que mantém a saturação à custa de taquipneia — o perfil que evolui para falha. A construção é fisiologicamente elegante: o numerador é um substituto da relação PaO₂/FiO₂ que dispensa gasometria e mede a eficiência da troca, enquanto o denominador é um substituto do drive respiratório e, portanto, do esforço necessário para sustentar essa troca. A razão entre os dois é um índice de **eficiência**: quanto de oxigenação se obtém por unidade de esforço. Dois pacientes com a mesma SpO₂ de 94% em FiO₂ de 50% são clinicamente muito diferentes se um respira a 20 e o outro a 38 irpm — o primeiro tem ROX de 9,4 e o segundo 4,9, e é essa distinção que nenhum índice de oxigenação isolado faz. Os cortes crescentes no tempo (2,85 às 2 h, 3,47 às 6 h, 3,85 às 12 h) refletem que a tolerância diminui com a duração: persistir em alto fluxo por 12 horas exige mais evidência de benefício do que nas primeiras duas.',
  armadilhas: [
    'Sedação, opioide e febre alteram a frequência respiratória por vias independentes da mecânica e distorcem o índice — o opioide baixa a frequência e infla o ROX num paciente que não melhorou.',
    'Não substitui o exame clínico: uso de musculatura acessória, respiração paradoxal, alteração do nível de consciência e instabilidade hemodinâmica indicam intubação independentemente do ROX.',
    'Com SpO₂ acima de 97% o índice perde resolução: na porção plana da curva de dissociação da hemoglobina, grandes variações de PaO₂ produzem variação mínima de saturação, e o numerador deixa de refletir a troca gasosa. Titule o alvo para 92 a 96%.',
    'Exige fluxo alto de verdade (≥ 30 a 60 L/min) para que a FiO₂ programada corresponda à entregue. Em fluxo baixo, cateter comum ou máscara, a FiO₂ real depende do padrão ventilatório do paciente e o denominador da conta é uma ficção.',
    'Um valor isolado é o uso mais fraco possível da ferramenta. Sem duas medidas para comparar, o ROX não informa a tendência, que é justamente o seu maior valor preditivo.',
  ],
  referencias: [
    { texto: 'Roca O, Caralt B, Messika J, et al. An index combining respiratory rate and oxygenation to predict outcome of nasal high-flow therapy. Am J Respir Crit Care Med. 2019;199(11):1368-1376.' },
    { texto: 'Roca O, Messika J, Caralt B, et al. Predicting success of high-flow nasal cannula in pneumonia patients with hypoxemic respiratory failure: the utility of the ROX index. J Crit Care. 2016;35:200-205.' },
    { texto: 'Brochard L, Slutsky A, Pesenti A. Mechanical ventilation to minimize progression of lung injury in acute respiratory failure. Am J Respir Crit Care Med. 2017;195(4):438-442.' },
  ],
}

const rsbi: Ferramenta = {
  id: 'rsbi',
  nome: 'Índice de respiração rápida e superficial',
  sigla: 'RSBI',
  sinonimos: ['rsbi', 'tobin', 'indice de tobin', 'desmame', 'extubacao'],
  resumo: 'O preditor clássico de sucesso de desmame da ventilação mecânica.',
  categorias: ['pneumologia', 'emergencia'],
  campos: [
    campoNum('fr', 'Frequência respiratória durante o teste', { unidade: 'irpm', min: 5, max: 60, passo: 1, ajuda: 'Medida durante teste de respiração espontânea, idealmente no primeiro minuto em tubo T ou pressão de suporte mínima.' }),
    campoNum('vt', 'Volume corrente espontâneo', { ajuda: 'Volume corrente espontâneo médio em litros, medido **sem pressão de suporte e sem PEEP**. Medido com suporte, o índice cai artificialmente e produz extubação prematura.', unidade: 'mL', min: 50, max: 1200, passo: 5 }),
  ],
  calcular: (v) => {
    const fr = num(v, 'fr')
    const vt = num(v, 'vt')
    if (fr === null || vt === null || vt <= 0) return null
    const rsbi = fr / (vt / 1000)
    const ve = (fr * vt) / 1000
    return {
      titulo: 'Índice de Tobin (RSBI)',
      valor: fmtInt(rsbi),
      unidade: 'irpm/L',
      nivel: rsbi > 105 ? 'alerta' : rsbi > 80 ? 'atencao' : 'ok',
      rotuloNivel: rsbi <= 105 ? 'Favorável ao desmame' : 'Desfavorável ao desmame',
      detalhes: [
        { rotulo: 'Ponto de corte clássico', valor: '105 irpm/L' },
        { rotulo: 'Ventilação-minuto espontânea', valor: `${fmt(ve, 2)} L/min`, nota: 'Acima de 15 L/min é preditor independente de falha.' },
        { rotulo: 'Valor preditivo', valor: 'VPP 0,78 | VPN 0,95', nota: 'Na coorte original: RSBI > 105 previu falha com boa acurácia; RSBI ≤ 105 previu sucesso com valor preditivo negativo alto.' },
      ],
      conduta: [
        '**RSBI < 105 (frequência respiratória ÷ volume corrente em litros)** prediz sucesso no desmame com boa sensibilidade e apoia a realização do **teste de respiração espontânea**. Ele é um gatilho para testar, não uma autorização para extubar.',
        '**RSBI > 105** sugere padrão de respiração rápida e superficial, típico de fadiga ou de carga excessiva. Procure a causa antes de simplesmente adiar: sobrecarga hídrica, disfunção cardíaca desmascarada pela retirada da pressão positiva, broncoespasmo, dor, ansiedade, anemia, desnutrição, fraqueza adquirida na UTI, hipotireoidismo e sedação residual.',
        'Meça o RSBI da forma correta: em **respiração espontânea sem pressão de suporte e sem PEEP**, por cerca de 1 minuto. Medido com pressão de suporte, o valor cai artificialmente e produz falsos positivos — é a causa mais comum de extubação prematura guiada pelo índice.',
        'A decisão de extubar depende de **quatro perguntas além do índice**: a causa da insuficiência respiratória foi resolvida? A oxigenação é adequada com parâmetros baixos? O paciente protege a via aérea (nível de consciência, tosse eficaz, secreção manejável)? A via aérea está patente (teste de vazamento do balonete em pacientes de risco para estridor)?',
        'Em pacientes de alto risco de falha (idosos, hipercápnicos, cardiopatas, obesos), aplique **ventilação não invasiva ou cânula de alto fluxo profiláticas imediatamente após a extubação**: essa medida reduz reintubação, e a reintubação é fator independente de mortalidade. Considere também extubação direta para não invasiva no retentor crônico de gás carbônico.',
      ],
      alertas: [
        'Medido com pressão de suporte ou PEEP, o RSBI cai artificialmente e produz falsos positivos — é a causa mais comum de extubação prematura guiada pelo índice. Meça em respiração espontânea sem assistência.',
        'O índice não responde às perguntas que decidem a extubação: a causa foi resolvida, o paciente protege a via aérea, a tosse é eficaz e a via aérea está patente.',
      ],
      interpretacao: [
        'Respiração rápida e superficial é o padrão universal de fadiga da musculatura respiratória: quando o trabalho por respiração fica alto demais, o sistema compensa reduzindo o volume e aumentando a frequência. Dividir uma pela outra transforma esse padrão num número.',
        'O RSBI foi validado como parte de uma avaliação, não como decisor isolado. O teste de respiração espontânea de 30 a 120 minutos permanece o padrão-ouro para indicar extubação, e um paciente pode falhar no RSBI e passar no teste.',
        'Extubação exige responder a duas perguntas independentes: o paciente consegue **ventilar** sem o tubo (é o que o RSBI e o teste espontâneo avaliam) e consegue **proteger a via aérea** (nível de consciência, tosse eficaz, quantidade de secreção, teste de escape do balonete). Falha em qualquer uma contraindica.',
      ],
    }
  },
  formula: ['RSBI = frequência respiratória ÷ volume corrente em litros'],
  fundamento:
    'Yang e Tobin testaram, em 1991, vários preditores de desmame em duas coortes prospectivas e encontraram no RSBI o melhor desempenho isolado, superior à pressão inspiratória máxima, à complacência e à relação P/F. O índice sobreviveu três décadas porque mede exatamente o que importa: a estratégia respiratória que o paciente adota quando o suporte é retirado. A respiração rápida e superficial é a assinatura da **carga excessiva sobre a capacidade muscular respiratória**: diante de complacência reduzida ou resistência aumentada, o diafragma em desvantagem minimiza o trabalho por ciclo reduzindo o volume corrente, e compensa o volume-minuto com frequência. O custo é que a fração de espaço morto por ciclo aumenta, a ventilação alveolar cai apesar do volume-minuto preservado, e o gás carbônico sobe — um ciclo que termina em fadiga diafragmática e falência ventilatória.',
  armadilhas: [
    'Medir com pressão de suporte alta reduz artificialmente o índice — o suporte aumenta o volume corrente e diminui a frequência. Meça em tubo T ou com suporte mínimo (até 5 a 8 cmH₂O).',
    'Tubo endotraqueal de calibre pequeno e secreção elevam o índice sem que o paciente esteja incapaz de ser extubado.',
    'Em mulheres, por terem volumes correntes menores, o corte de 105 gera mais falsos positivos; alguns autores propõem ajuste por sexo ou por peso predito.',
  ],
  referencias: [
    { texto: 'Yang KL, Tobin MJ. A prospective study of indexes predicting the outcome of trials of weaning from mechanical ventilation. N Engl J Med. 1991;324(21):1445-1450.' },
    { texto: 'Boles JM, Bion J, Connors A, et al. Weaning from mechanical ventilation. Eur Respir J. 2007;29(5):1033-1056.' },
  ],
}

const light: Ferramenta = {
  id: 'criterios-light',
  nome: 'Critérios de Light para derrame pleural',
  sinonimos: ['light', 'derrame pleural', 'exsudato', 'transudato', 'toracocentese'],
  resumo: 'Separa exsudato de transudato e aponta as exceções que o critério erra.',
  categorias: ['pneumologia', 'gastroenterologia'],
  campos: [
    campoNum('ptPleural', 'Proteína total no líquido pleural', { ajuda: 'Proteína total do líquido, em g/dL, da amostra da toracocentese.', unidade: 'g/dL', min: 0, max: 10, passo: 0.1 }),
    campoNum('ptSerica', 'Proteína total sérica', { ajuda: 'Proteína total do soro colhido no mesmo dia — a razão exige as duas do mesmo momento.', unidade: 'g/dL', min: 2, max: 12, passo: 0.1 }),
    campoNum('ldhPleural', 'LDH no líquido pleural', { ajuda: 'Desidrogenase láctica do líquido, em U/L. Valores muito elevados em derrame parapneumônico indicam derrame complicado e drenagem.', unidade: 'U/L', min: 5, max: 5000, passo: 1 }),
    campoNum('ldhSerica', 'LDH sérica', { ajuda: 'Desidrogenase láctica do soro do mesmo dia.', unidade: 'U/L', min: 50, max: 3000, passo: 1 }),
    campoNum('ldhLimite', 'Limite superior do normal da LDH sérica do laboratório', { ajuda: 'Limite superior do normal da desidrogenase láctica sérica no seu laboratório — o critério de Light usa dois terços desse valor.', unidade: 'U/L', min: 100, max: 500, passo: 1, padrao: '250' }),
    campoNum('albSerica', 'Albumina sérica', { unidade: 'g/dL', min: 0.5, max: 6, passo: 0.1, opcional: true, ajuda: 'Permite calcular o gradiente de albumina, útil quando há diurético em uso.' }),
    campoNum('albPleural', 'Albumina no líquido pleural', { ajuda: 'Albumina do líquido. Com o gradiente soro-líquido acima de 1,2 g/dL, o derrame é transudato mesmo que os critérios de Light digam exsudato — é a correção da armadilha do diurético.', unidade: 'g/dL', min: 0, max: 6, passo: 0.1, opcional: true }),
  ],
  calcular: (v) => {
    const ptP = num(v, 'ptPleural')
    const ptS = num(v, 'ptSerica')
    const ldhP = num(v, 'ldhPleural')
    const ldhS = num(v, 'ldhSerica')
    const ldhLim = numOu(v, 'ldhLimite', 250)
    const albS = num(v, 'albSerica')
    const albP = num(v, 'albPleural')
    if (ptP === null || ptS === null || ldhP === null || ldhS === null || ptS <= 0 || ldhS <= 0) return null
    const razaoPt = ptP / ptS
    const razaoLdh = ldhP / ldhS
    const c1 = razaoPt > 0.5
    const c2 = razaoLdh > 0.6
    const c3 = ldhP > (2 / 3) * ldhLim
    const exsudato = c1 || c2 || c3
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Proteína pleural / sérica', valor: fmt(razaoPt, 2), nota: 'Critério 1: > 0,50', nivel: c1 ? 'alerta' : 'ok' },
      { rotulo: 'LDH pleural / sérica', valor: fmt(razaoLdh, 2), nota: 'Critério 2: > 0,60', nivel: c2 ? 'alerta' : 'ok' },
      { rotulo: 'LDH pleural', valor: `${fmtInt(ldhP)} U/L`, nota: `Critério 3: > ⅔ do limite superior sérico (${fmtInt((2 / 3) * ldhLim)} U/L)`, nivel: c3 ? 'alerta' : 'ok' },
    ]
    if (albS !== null && albP !== null) {
      const grad = albS - albP
      detalhes.push({
        rotulo: 'Gradiente de albumina (sérica − pleural)',
        valor: `${fmt(grad, 1)} g/dL`,
        nota: grad > 1.2 ? 'Acima de 1,2 g/dL: transudato, mesmo que os critérios de Light apontem exsudato. É o teste de desempate quando há diurético em uso.' : 'Abaixo de 1,2 g/dL: compatível com exsudato.',
        nivel: grad > 1.2 ? 'ok' : 'atencao',
      })
    }
    if (ptS > 0 && ptP >= 0) {
      const gradPt = ptS - ptP
      detalhes.push({ rotulo: 'Gradiente de proteína (sérica − pleural)', valor: `${fmt(gradPt, 1)} g/dL`, nota: 'Acima de 3,1 g/dL também sugere transudato mal classificado.' })
    }
    return {
      titulo: 'Classificação do derrame',
      valor: exsudato ? 'Exsudato' : 'Transudato',
      nivel: exsudato ? 'alerta' : 'ok',
      rotuloNivel: exsudato ? `${[c1, c2, c3].filter(Boolean).length} de 3 critérios positivos` : 'Nenhum critério positivo',
      detalhes,
      conduta: [
        '**Exsudato** (qualquer um dos três critérios de Light preenchido) exige investigação etiológica: complete com citologia diferencial, glicose, pH, desidrogenase láctica, adenosina deaminase (ADA), cultura, pesquisa de bacilo álcool-ácido resistente e citologia oncótica. As causas mais frequentes são infecção, neoplasia, tuberculose e embolia pulmonar.',
        '**Transudato**: a conduta é tratar a doença de base — insuficiência cardíaca, cirrose, síndrome nefrótica, hipoalbuminemia — e não investigar o líquido exaustivamente. Toracocentese de repetição em transudato de insuficiência cardíaca costuma significar que o tratamento da causa está insuficiente.',
        'Corrija a **armadilha do diurético**: os critérios de Light classificam erroneamente como exsudato cerca de 25% dos transudatos em pacientes diureticados, porque a retirada de água concentra proteínas e desidrogenase láctica. Nesse cenário, calcule o **gradiente de albumina soro-líquido**: valor **> 1,2 g/dL** indica transudato, independentemente dos critérios de Light.',
        'Diante de **derrame parapneumônico**, o pH decide: **pH < 7,20, glicose < 40 mg/dL, desidrogenase láctica muito elevada, loculação ou pus** caracterizam derrame complicado ou empiema e indicam **drenagem torácica**, não apenas antibiótico. Colha o pH em seringa de gasometria, em anaerobiose, e processe rapidamente — o atraso falseia o resultado.',
        'Investigue com prioridade os achados que mudam o diagnóstico: **ADA elevada** (acima de 40 U/L) com predomínio linfocítico sugere tuberculose pleural em área endêmica; **amilase alta** aponta pancreatite ou rotura esofágica; **quilotórax** (triglicerídeos > 110 mg/dL) aponta lesão do ducto torácico ou linfoma; e **eosinofilia pleural** sugere pneumotórax prévio, hemotórax, fármacos ou parasitose.',
      ],
      interpretacao: [
        exsudato
          ? '**Exsudato**: a pleura está doente. Investigue infecção (parapneumônico, empiema, tuberculose), neoplasia, embolia pulmonar, doença do tecido conjuntivo, pancreatite, quilotórax e causas medicamentosas. O painel mínimo do líquido inclui citologia total e diferencial, citologia oncótica, glicose, pH, adenosina deaminase, coloração de Gram e cultura.'
          : '**Transudato**: a pleura está normal e o problema é sistêmico — desequilíbrio entre pressão hidrostática e oncótica. As três causas dominam: insuficiência cardíaca, cirrose com hidrotórax hepático e síndrome nefrótica. O tratamento é da doença de base, não da pleura.',
        'Os critérios de Light têm sensibilidade próxima de 100% para exsudato, e é essa a intenção: erram para o lado de classificar transudato como exsudato, nunca o contrário. O preço é uma taxa de falso-exsudato de 15 a 25%, sobretudo em insuficiência cardíaca tratada com diurético — a diurese concentra proteína e LDH no líquido remanescente.',
        'Quando o quadro clínico grita insuficiência cardíaca mas Light aponta exsudato, o gradiente de albumina resolve: acima de 1,2 g/dL, trate como transudato.',
      ],
      alertas: exsudato ? ['Em derrame parapneumônico, pH abaixo de 7,20, glicose abaixo de 60 mg/dL ou LDH acima de 1000 U/L indicam derrame complicado, com necessidade de drenagem — não apenas antibiótico.'] : undefined,
    }
  },
  formula: [
    'Exsudato se QUALQUER um:',
    '  proteína pleural / proteína sérica > 0,5',
    '  LDH pleural / LDH sérica > 0,6',
    '  LDH pleural > ⅔ do limite superior do normal sérico',
  ],
  fundamento:
    'Light propôs os critérios em 1972 partindo de uma pergunta prática: como decidir, com o líquido na mão, se a pleura está doente. Transudato resulta de forças de Starling desequilibradas — líquido pobre em proteína atravessa uma pleura íntegra. Exsudato resulta de aumento da permeabilidade ou de obstrução linfática — proteínas e enzimas intracelulares passam. A LDH funciona como marcador de dano celular, e a proteína como marcador de permeabilidade; usar os dois em conjunto, com o critério "qualquer um positivo", maximiza a sensibilidade.',
  armadilhas: [
    'Diurético antes da toracocentese é a causa mais frequente de falso exsudato. Se possível, colha antes de intensificar a diurese; se não, use o gradiente de albumina.',
    'Derrame hemorrágico (hematócrito pleural > 50% do sérico) é hemotórax e exige drenagem, não classificação.',
    'Não existe transudato que precise de investigação pleural extensa — insistir em biópsia num transudato claro é procedimento sem indicação.',
  ],
  referencias: [
    { texto: 'Light RW, Macgregor MI, Luchsinger PC, Ball WC Jr. Pleural effusions: the diagnostic separation of transudates and exudates. Ann Intern Med. 1972;77(4):507-513.' },
    { texto: 'Porcel JM, Light RW. Pleural effusions. Dis Mon. 2013;59(2):29-57.' },
  ],
}

const pesi: Ferramenta = {
  id: 'pesi',
  nome: 'PESI — índice de gravidade da embolia pulmonar',
  sinonimos: ['pesi', 'embolia pulmonar prognostico'],
  resumo: 'Classifica a embolia pulmonar em cinco classes de mortalidade em 30 dias.',
  categorias: ['pneumologia', 'cardiologia', 'emergencia'],
  campos: [
    campoNum('idade', 'Idade', { unidade: 'anos', min: 18, max: 110, passo: 1 }),
    campoSeg('sexo', 'Sexo', [
      { valor: 'f', rotulo: 'Feminino', pontos: 0 },
      { valor: 'm', rotulo: 'Masculino', pontos: 10 },
    ]),
    campoSimNao('cancer', 'Neoplasia', 30, 'Neoplasia ativa ou em tratamento. Câncer em remissão há anos não pontua — o peso reflete doença ativa, que é protrombótica e limita prognóstico.'),
    campoSimNao('ic', 'Insuficiência cardíaca', 10, 'Diagnóstico prévio estabelecido. A reserva ventricular reduzida limita a tolerância à sobrecarga aguda do ventrículo direito.'),
    campoSimNao('pulmonar', 'Doença pulmonar crônica', 10, 'DPOC, fibrose, doença intersticial. Pulmão com reserva reduzida tolera menos o espaço morto criado pela embolia.'),
    campoSimNao('fc', 'Frequência cardíaca ≥ 110 bpm', 20, 'Taquicardia é a resposta compensatória ao débito reduzido pela falência do ventrículo direito — marcador precoce de repercussão hemodinâmica.'),
    campoSimNao('pas', 'PA sistólica < 100 mmHg', 30, 'Hipotensão sem choque franco. Se houver hipotensão sustentada, choque ou parada, o paciente já é de alto risco por definição e o PESI é irrelevante.'),
    campoSimNao('fr', 'Frequência respiratória ≥ 30 irpm', 20, 'Conte por 60 segundos. Reflete o espaço morto alveolar criado pelas áreas ventiladas e não perfundidas.'),
    campoSimNao('temp', 'Temperatura < 36 °C', 20, 'Hipotermia, não febre. Marca hipoperfusão e má resposta sistêmica — no PESI o frio é que pontua.'),
    campoSimNao('mental', 'Alteração do estado mental', 60, 'Desorientação, letargia, estupor ou coma. É o item de maior peso do escore: indica hipoperfusão cerebral por débito cardíaco criticamente baixo.'),
    campoSimNao('sao2', 'SaO₂ < 90%', 20, 'Em ar ambiente. Se o paciente já está em oxigênio suplementar, considere a saturação que ele tinha antes ou a necessidade de O₂ como equivalente.'),
  ],
  calcular: (v) => {
    const idade = num(v, 'idade')
    if (idade === null) return null
    const total =
      idade +
      (opc(v, 'sexo') === 'm' ? 10 : 0) +
      somaSimNao(v, [
        { id: 'cancer', pontos: 30 },
        { id: 'ic', pontos: 10 },
        { id: 'pulmonar', pontos: 10 },
        { id: 'fc', pontos: 20 },
        { id: 'pas', pontos: 30 },
        { id: 'fr', pontos: 20 },
        { id: 'temp', pontos: 20 },
        { id: 'mental', pontos: 60 },
        { id: 'sao2', pontos: 20 },
      ])
    const classe = total <= 65 ? 1 : total <= 85 ? 2 : total <= 105 ? 3 : total <= 125 ? 4 : 5
    const mortalidade = ['', '0 a 1,6%', '1,7 a 3,5%', '3,2 a 7,1%', '4,0 a 11,4%', '10,0 a 24,5%'][classe]
    const nivel: Nivel = classe <= 2 ? 'ok' : classe === 3 ? 'atencao' : classe === 4 ? 'alerta' : 'critico'
    return {
      titulo: `PESI classe ${['', 'I', 'II', 'III', 'IV', 'V'][classe]}`,
      valor: String(total),
      unidade: 'pontos',
      nivel,
      rotuloNivel: `Mortalidade em 30 dias: ${mortalidade}`,
      detalhes: [
        { rotulo: 'Pontos por idade', valor: String(idade), nota: 'A idade entra com o próprio valor — é a variável de maior peso.' },
        { rotulo: 'Classe de risco', valor: ['', 'I (muito baixo)', 'II (baixo)', 'III (intermediário)', 'IV (alto)', 'V (muito alto)'][classe] },
      ],
      interpretacao: [
        classe <= 2
          ? '**Classes I e II identificam risco baixo.** É o principal uso clínico do PESI: selecionar quem pode ser tratado em domicílio ou receber alta precoce, com anticoagulante oral direto, desde que não haja disfunção de ventrículo direito, marcador cardíaco elevado, contraindicação social ou necessidade de oxigênio.'
          : 'Classes III a V: internação indicada, com monitorização. Avalie disfunção de ventrículo direito por ecocardiograma ou angiotomografia e dose troponina e BNP para refinar a estratificação em risco intermediário-baixo e intermediário-alto.',
        'A classificação de gravidade da diretriz europeia sobrepõe três camadas: instabilidade hemodinâmica define **alto risco** (trombólise indicada) independentemente do PESI; PESI classe I ou II ou sPESI zero define **baixo risco**; o restante é risco intermediário, subdividido pela combinação de disfunção de ventrículo direito com troponina.',
        'Entender por que esses itens predizem morte exige seguir a **espiral do ventrículo direito**. O trombo obstrui mecanicamente o leito arterial pulmonar, e a isso soma-se vasoconstrição mediada por tromboxano e serotonina liberados das plaquetas ativadas — a resistência vascular pulmonar sobe muito além do que a obstrução anatômica explicaria. O ventrículo direito é uma câmara de parede fina, projetada para trabalhar contra resistência baixa, e não consegue gerar pressão média acima de cerca de 40 mmHg de forma aguda: ele dilata. A dilatação empurra o septo interventricular para a esquerda e, como os dois ventrículos compartilham o pericárdio, reduz a pré-carga do ventrículo esquerdo — daí a queda do débito e a hipotensão. Pior: a pressão diastólica aórtica cai enquanto a pressão intramural do ventrículo direito sobe, e a perfusão coronariana da parede direita, que só ocorre na diástole, despenca. Surge isquemia de ventrículo direito, que piora a contratilidade, que piora o débito — a espiral se fecha. Cada item do PESI é uma janela para um ponto dessa cascata: taquicardia e hipotensão para o débito, alteração mental para a perfusão cerebral, hipotermia para a perfusão periférica, taquipneia e dessaturação para o espaço morto alveolar.',
      ],
      conduta: classe <= 2
        ? [
            'Confirme que as **três** condições de baixo risco estão presentes antes de considerar alta precoce ou tratamento domiciliar: PESI classe I ou II, ausência de disfunção de ventrículo direito (ecocardiograma ou relação VD/VE na angiotomografia) e troponina normal. O escore clínico sozinho não basta.',
            'Anticoagulação com anticoagulante oral direto: rivaroxabana 15 mg 12/12 h por 21 dias seguida de 20 mg/dia, ou apixabana 10 mg 12/12 h por 7 dias seguida de 5 mg 12/12 h. Ambas dispensam heparina de ponte, o que é justamente o que viabiliza o tratamento em casa.',
            'Antes da alta, verifique o que o escore não vê: oxigenação adequada em ar ambiente, dor controlada com analgesia oral, ausência de sangramento ativo ou plaquetopenia, função renal compatível com o anticoagulante escolhido, suporte domiciliar, compreensão da prescrição e acesso garantido a retorno em 48 a 72 horas.',
            'Programe a investigação etiológica ambulatorial: rastreio de neoplasia orientado por idade e sintomas, e avaliação de trombofilia apenas nos casos em que o resultado mudaria a duração do tratamento. Defina desde já se a embolia foi provocada ou não provocada, porque é isso que decide anticoagular 3 meses ou indefinidamente.',
          ]
        : [
            'Internação com monitorização contínua. Estratifique o risco intermediário dosando troponina e BNP e avaliando o ventrículo direito — a combinação de disfunção ventricular **com** troponina elevada define risco intermediário-alto, que exige vigilância em ambiente de cuidado semi-intensivo.',
            'Anticoagulação plena imediata: heparina de baixo peso molecular em dose terapêutica é a preferida no risco intermediário, porque permite suspensão rápida caso a trombólise se torne necessária. Heparina não fracionada em infusão fica reservada a instabilidade iminente, disfunção renal grave ou obesidade extrema.',
            'Defina e registre o gatilho de resgate: hipotensão sustentada, necessidade de vasopressor ou parada cardiorrespiratória indicam trombólise sistêmica (alteplase 100 mg em 2 h, ou 0,6 mg/kg em 15 min na parada). Em contraindicação ao trombolítico, considere trombectomia por cateter ou cirúrgica conforme disponibilidade.',
            classe >= 4
              ? 'Nas classes IV e V a mortalidade em 30 dias chega a 25%, e boa parte dela é atribuível à comorbidade — sobretudo neoplasia — e não à embolia em si. Trate a embolia com agressividade e, em paralelo, discuta objetivos de cuidado: nessa faixa a conversa sobre prognóstico global é parte do tratamento.'
              : 'Reavalie diariamente: melhora sustentada dos sinais vitais e da oxigenação permite transição para anticoagulante oral e alta em poucos dias.',
          ],
      alertas: [
        'O PESI **não se aplica** ao paciente hemodinamicamente instável. Hipotensão sustentada, choque obstrutivo ou parada cardiorrespiratória já classificam a embolia como de alto risco, e a conduta é reperfusão imediata, sem escore.',
        'Classe I ou II com disfunção de ventrículo direito ou troponina elevada **não é** baixo risco. Essa é a falha de aplicação mais comum e mais perigosa do escore, porque leva à alta de um paciente que vai deteriorar.',
        'Não foi validado em gestantes, em embolia incidental descoberta em exame de rastreamento oncológico, nem em pacientes com embolia crônica ou hipertensão pulmonar tromboembólica prévia.',
      ],
      tabela: {
        titulo: 'Classes do PESI',
        colunas: ['Pontos', 'Classe', 'Mortalidade em 30 dias'],
        linhas: [
          ['≤ 65', 'I — muito baixo', '0 – 1,6%'],
          ['66 – 85', 'II — baixo', '1,7 – 3,5%'],
          ['86 – 105', 'III — intermediário', '3,2 – 7,1%'],
          ['106 – 125', 'IV — alto', '4,0 – 11,4%'],
          ['> 125', 'V — muito alto', '10,0 – 24,5%'],
        ],
        destaque: classe - 1,
      },
    }
  },
  formula: ['Idade em pontos + 10 se masculino + soma dos 9 critérios clínicos'],
  fundamento:
    'O PESI foi derivado de mais de 15 mil pacientes com embolia pulmonar aguda para prever mortalidade por qualquer causa em 30 dias. Diferente dos escores de probabilidade diagnóstica (Wells, Genebra), que respondem "há embolia?", o PESI responde "esta embolia é grave?" — e sua contribuição prática foi tornar possível o tratamento domiciliar de uma doença que se internava por reflexo. A estrutura do escore revela o que ele realmente mede: a idade entra com o próprio valor numérico, o que significa que um paciente de 80 anos parte de 80 pontos e já está na classe III sem nenhum outro achado. Isso não é defeito de calibração, é a afirmação central do modelo — na embolia pulmonar, reserva fisiológica e comorbidade predizem morte em 30 dias melhor do que a carga trombótica. Um trombo pequeno num octogenário com neoplasia é mais letal do que um trombo grande num jovem, e é por isso que o PESI não contém uma única variável de extensão anatômica da embolia: nem carga de trombo na angiotomografia, nem índice de obstrução de Qanadli, nem lobo acometido. O escore aposta no hospedeiro, não no êmbolo. Complementarmente, a validação mostrou que o ganho prático maior está na ponta baixa: classes I e II têm valor preditivo negativo alto o suficiente para sustentar a decisão de não internar, e foi o ensaio HESTIA e o estudo de Aujesky de 2011 que transformaram isso em prática.',
  armadilhas: [
    'O PESI prediz mortalidade global, não mortalidade por embolia; boa parte dos óbitos nas classes altas decorre de câncer e comorbidade.',
    'Escore baixo com disfunção de ventrículo direito não é baixo risco. A avaliação do ventrículo direito é obrigatória antes de considerar alta.',
    'A idade domina o resultado. Um paciente de 75 anos sem nenhum outro critério já soma 75 pontos e cai na classe III, o que pode levar a internação desnecessária de idoso estável — nesse cenário o sPESI, que dicotomiza a idade em > 80 anos, costuma classificar melhor.',
    'Não há nenhuma variável de extensão anatômica no escore. Não busque coerência entre a classe do PESI e o tamanho do trombo na angiotomografia: são eixos independentes, e a repercussão funcional do ventrículo direito é que importa.',
    'Onze variáveis cobradas de memória na porta da emergência levam a omissão de itens, e omitir é sempre subestimar. Se não houver como conferir todos os campos, o sPESI é a escolha mais segura por ter seis.',
    'Classe baixa não autoriza alta se faltar a infraestrutura: o tratamento domiciliar da embolia depende de retorno garantido, acesso ao anticoagulante e compreensão da prescrição. O escore mede risco biológico, não viabilidade social.',
  ],
  referencias: [
    { texto: 'Aujesky D, Obrosky DS, Stone RA, et al. Derivation and validation of a prognostic model for pulmonary embolism. Am J Respir Crit Care Med. 2005;172(8):1041-1046.' },
    { texto: 'Konstantinides SV, et al. 2019 ESC Guidelines for the diagnosis and management of acute pulmonary embolism. Eur Heart J. 2020;41(4):543-603.' },
  ],
}

const spesi: Ferramenta = {
  id: 'spesi',
  nome: 'sPESI — PESI simplificado',
  sinonimos: ['spesi', 'pesi simplificado'],
  resumo: 'Seis variáveis dicotômicas com o mesmo poder de identificar embolia de baixo risco.',
  categorias: ['pneumologia', 'cardiologia', 'emergencia'],
  campos: [
    campoSimNao('idade', 'Idade > 80 anos', 1, 'Corte estrito: 80 anos exatos não pontua. É a principal diferença prática em relação ao PESI, onde a idade entra com o próprio valor e domina o resultado.'),
    campoSimNao('cancer', 'Neoplasia', 1, 'Neoplasia ativa ou em tratamento. Câncer em remissão prolongada não pontua.'),
    campoSimNao('cardiopulmonar', 'Insuficiência cardíaca ou doença pulmonar crônica', 1, 'As duas comorbidades foram fundidas num único item, porque ambas expressam a mesma coisa: reserva cardiopulmonar reduzida para absorver a sobrecarga aguda do ventrículo direito.'),
    campoSimNao('fc', 'Frequência cardíaca ≥ 110 bpm', 1, 'Taquicardia compensatória ao débito reduzido. Atenção ao paciente betabloqueado, que pode não taquicardizar mesmo em falência ventricular direita.'),
    campoSimNao('pas', 'PA sistólica < 100 mmHg', 1, 'Se houver hipotensão sustentada, choque ou necessidade de vasopressor, o paciente é de alto risco por definição e o escore não se aplica.'),
    campoSimNao('sao2', 'SaO₂ < 90%', 1, 'Em ar ambiente. No PESI completo este item vale 20 pontos; aqui vale 1, como todos os outros.'),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'idade', pontos: 1 },
      { id: 'cancer', pontos: 1 },
      { id: 'cardiopulmonar', pontos: 1 },
      { id: 'fc', pontos: 1 },
      { id: 'pas', pontos: 1 },
      { id: 'sao2', pontos: 1 },
    ])
    return {
      titulo: 'sPESI',
      valor: String(total),
      unidade: 'de 6 pontos',
      nivel: total === 0 ? 'ok' : 'alerta',
      rotuloNivel: total === 0 ? 'Baixo risco' : 'Não é baixo risco',
      detalhes: [{ rotulo: 'Mortalidade em 30 dias', valor: total === 0 ? '1,0%' : '10,9%', nota: 'Coorte de validação de Jiménez et al. (2010).' }],
      interpretacao: [
        total === 0
          ? '**sPESI zero** identifica embolia de baixo risco com valor preditivo negativo alto. Junto com a ausência de disfunção de ventrículo direito e de elevação de troponina, autoriza tratamento ambulatorial ou alta precoce com anticoagulante oral direto — desde que haja suporte social, adesão e acesso a retorno.'
          : 'Pelo menos um critério positivo: não é baixo risco. Internação e estratificação adicional com ecocardiograma e biomarcadores.',
        'O sPESI perde granularidade nas classes altas (não distingue risco alto de muito alto), mas mantém desempenho equivalente ao PESI completo para a decisão que interessa na emergência: pode ir para casa ou não.',
        'Os critérios de Hestia são uma alternativa validada, baseada em elegibilidade prática para tratamento domiciliar em vez de probabilidade estatística — e resultaram em taxas semelhantes de eventos no ensaio HoT-PE.',
        'O escore é deliberadamente cego ao coração, e entender por quê evita o erro de aplicação mais grave. Ele mede **reserva e repercussão sistêmica**, não a função do ventrículo direito. Na embolia submaciça existe uma janela em que o ventrículo direito já está dilatado, com isquemia de parede e troponina liberada por estiramento de miócito, mas o débito cardíaco ainda está preservado à custa de taquicardia e vasoconstrição periférica: nesse momento a pressão arterial é normal, a saturação é normal, a frequência pode estar abaixo de 110, e o sPESI dá zero. O paciente parece estável porque está compensado, e a espiral do ventrículo direito não avisa antes de fechar — quando a pré-carga do ventrículo esquerdo finalmente cai, a deterioração é em minutos. É exatamente por isso que a diretriz europeia exige as três camadas (escore clínico, imagem do ventrículo direito e biomarcador) e não aceita nenhuma delas isolada para autorizar alta.',
      ],
      conduta: total === 0
        ? [
            'Complete as três camadas antes de decidir alta: sPESI zero **mais** ausência de disfunção de ventrículo direito (relação VD/VE < 0,9 na angiotomografia ou ecocardiograma sem sobrecarga) **mais** troponina normal. Faltando qualquer uma, o paciente não é de baixo risco.',
            'Anticoagulante oral direto desde a emergência, sem ponte com heparina: rivaroxabana 15 mg 12/12 h por 21 dias e depois 20 mg/dia, ou apixabana 10 mg 12/12 h por 7 dias e depois 5 mg 12/12 h. Confira função renal e interações antes de prescrever.',
            'Aplique em paralelo os critérios de Hestia, que cobrem o que nenhum escore estatístico cobre: dor que exige opioide parenteral, necessidade de oxigênio, sangramento ativo, plaquetopenia, gravidez, trombose com indicação de trombólise e barreira social ou logística.',
            'Garanta retorno em 48 a 72 horas, entregue a orientação por escrito e oriente procura imediata se houver dispneia progressiva, síncope, dor torácica nova ou qualquer sangramento. Defina na alta se a embolia foi provocada ou não provocada — é o que determina tratar 3 meses ou indefinidamente.',
          ]
        : [
            'Pelo menos um critério positivo significa internação. Estratifique o risco intermediário com troponina, BNP e avaliação do ventrículo direito: disfunção ventricular **somada** a troponina elevada define risco intermediário-alto e justifica leito monitorizado.',
            'Heparina de baixo peso molecular em dose terapêutica é a anticoagulação preferida no risco intermediário, porque pode ser interrompida rapidamente se a trombólise de resgate se tornar necessária.',
            'Registre em prontuário o gatilho de resgate — hipotensão sustentada, vasopressor ou parada — e quem deve ser acionado. A mortalidade do risco intermediário-alto vem da deterioração não antecipada.',
            'Reavalie a cada 12 a 24 horas. Estabilidade mantida por 48 a 72 horas com regressão dos critérios permite transição para anticoagulante oral e alta.',
          ],
      alertas: [
        'sPESI zero **não** autoriza alta isoladamente. Disfunção de ventrículo direito, troponina elevada ou trombo em trânsito tornam o paciente de risco intermediário, e o escore não enxerga nenhum dos três.',
        'Não se aplica ao paciente instável: hipotensão sustentada, choque obstrutivo ou parada cardiorrespiratória definem alto risco e indicam reperfusão imediata.',
        'O corte de idade é > 80 anos, mais permissivo que no PESI. Isso torna o sPESI melhor para o idoso estável, mas exige atenção redobrada à fragilidade e à comorbidade, que o escore não mede.',
      ],
      tabela: {
        titulo: 'sPESI e as três camadas da estratificação (ESC 2019)',
        colunas: ['Camada', 'Baixo risco', 'Intermediário', 'Alto risco'],
        linhas: [
          ['sPESI', '0', '≥ 1', 'Irrelevante — instabilidade define'],
          ['Ventrículo direito', 'Normal', 'Disfunção', 'Disfunção'],
          ['Troponina', 'Normal', 'Normal ou elevada', 'Elevada'],
          ['Conduta', 'Alta precoce ou domiciliar', 'Internação monitorizada', 'Reperfusão imediata'],
        ],
        destaque: total === 0 ? 0 : 1,
      },
    }
  },
  formula: ['1 ponto por critério; sPESI = 0 identifica baixo risco'],
  fundamento:
    'A simplificação partiu do PESI original eliminando variáveis redundantes e atribuindo peso idêntico às restantes. O resultado surpreendeu: a discriminação foi preservada, confirmando que boa parte da complexidade do escore original não acrescentava informação para a decisão dicotômica de alta. A explicação estatística é conhecida — quando as variáveis de um modelo são correlacionadas entre si, os pesos derivados por regressão são instáveis e otimizados para a coorte de derivação, e igualar os pesos frequentemente melhora a generalização. A explicação clínica é mais interessante: os seis itens sobreviventes se distribuem em dois eixos apenas. Três medem **reserva** (idade > 80 anos, neoplasia, doença cardiopulmonar) e três medem **repercussão hemodinâmica aguda** (taquicardia, hipotensão, dessaturação). Temperatura, frequência respiratória e estado mental caíram não por serem irrelevantes, mas por serem redundantes com esses dois eixos na maioria dos pacientes. O que restou é o mínimo suficiente para responder à única pergunta que o escore precisa responder na porta da emergência: este paciente pode ir para casa? Com seis itens dicotômicos contra onze variáveis ponderadas, o sPESI erra menos por omissão de campo — e um escore que se aplica corretamente vale mais que um escore teoricamente superior aplicado pela metade.',
  armadilhas: [
    'sPESI zero em paciente com trombo em trânsito, disfunção de ventrículo direito ou troponina elevada não autoriza alta — o escore não vê o coração.',
    'Paciente betabloqueado pode não atingir 110 bpm mesmo em falência de ventrículo direito, e o item de taquicardia fica falsamente negativo. O mesmo vale para o atleta com frequência basal baixa.',
    'Perde granularidade na ponta alta: não distingue risco intermediário-baixo de intermediário-alto nem de alto risco. Para isso servem a troponina, o BNP e a imagem do ventrículo direito, não mais pontos no escore.',
    'A fusão de insuficiência cardíaca com doença pulmonar crônica num único item significa que quem tem as duas pontua apenas 1. Isso subestima o paciente com dupla comorbidade grave.',
    'Não foi validado em gestantes, em embolia incidental de rastreamento oncológico nem em doença tromboembólica crônica.',
  ],
  referencias: [
    { texto: 'Jiménez D, Aujesky D, Moores L, et al. Simplification of the pulmonary embolism severity index for prognostication in patients with acute symptomatic pulmonary embolism. Arch Intern Med. 2010;170(15):1383-1389.' },
    { texto: 'Konstantinides SV, Meyer G, Becattini C, et al. 2019 ESC Guidelines for the diagnosis and management of acute pulmonary embolism developed in collaboration with the ERS. Eur Heart J. 2020;41(4):543-603.' },
    { texto: 'Barco S, Schmidtmann I, Ageno W, et al. Early discharge and home treatment of patients with low-risk pulmonary embolism with the oral factor Xa inhibitor rivaroxaban (HoT-PE). Eur Heart J. 2020;41(4):509-518.' },
  ],
}

export const ferramentas: Ferramenta[] = [
  pesoPreditoFerramenta,
  mecanicaVentilatoria,
  ventilacaoMinuto,
  indiceOxigenacao,
  curb65,
  crb65,
  psi,
  mmrc,
  bode,
  controleAsma,
  rox,
  rsbi,
  light,
  pesi,
  spesi,
]

export default ferramentas
