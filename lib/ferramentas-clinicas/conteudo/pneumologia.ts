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
    campoNum('pesoReal', 'Peso real (apenas para comparação)', { unidade: 'kg', min: 20, max: 350, passo: 0.5, opcional: true }),
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
      interpretacao: [
        'O índice de oxigenação responde a uma pergunta que a relação PaO₂/FiO₂ ignora: **quanto custou** essa oxigenação. Dois pacientes com a mesma relação P/F de 150 são muito diferentes se um está com pressão média de 12 e o outro com 30 cmH₂O — o segundo já esgotou a reserva de suporte.',
        'É o parâmetro de referência da pediatria e da neonatologia. A definição pediátrica de SDRA (PALICC) usa o índice de oxigenação em vez da relação P/F: leve 4 a 8, moderada 8 a 16, grave acima de 16.',
        'Em adultos, índice de oxigenação persistentemente acima de 30 a 40 apesar de otimização (bloqueio neuromuscular, prona, PEEP ajustada) é um dos gatilhos de discussão de ECMO veno-venosa, ao lado de relação P/F abaixo de 80 por mais de 6 horas e hipercapnia com pH abaixo de 7,25.',
      ],
    }
  },
  formula: ['IO = (FiO₂ × Pressão média de vias aéreas × 100) ÷ PaO₂', 'OSI = (FiO₂ × PMVA × 100) ÷ SpO₂'],
  fundamento:
    'Multiplicar pela pressão média de vias aéreas incorpora o suporte necessário para manter aquela oxigenação, e não apenas o resultado. Quanto maior o índice, pior — ao contrário da relação P/F. A escala pediátrica do índice se estabeleceu porque em crianças a variação de pressão média entre modos e estratégias é proporcionalmente maior do que em adultos.',
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
    campoSimNao('c', 'Confusão mental de início recente', 1),
    campoSimNao('r', 'Frequência respiratória ≥ 30 irpm', 1),
    campoSimNao('b', 'PA sistólica < 90 mmHg ou diastólica ≤ 60 mmHg', 1),
    campoSimNao('idade', 'Idade ≥ 65 anos', 1),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'c', pontos: 1 },
      { id: 'r', pontos: 1 },
      { id: 'b', pontos: 1 },
      { id: 'idade', pontos: 1 },
    ])
    const nivel: Nivel = total >= 3 ? 'critico' : total >= 1 ? 'alerta' : 'ok'
    return {
      titulo: 'CRB-65',
      valor: String(total),
      unidade: 'de 4 pontos',
      nivel,
      rotuloNivel: total === 0 ? 'Baixo risco' : total <= 2 ? 'Risco intermediário' : 'Alto risco',
      detalhes: [{ rotulo: 'Mortalidade em 30 dias', valor: ['1,2%', '8,2%', '8,2%', '31,0%', '31,0%'][total] }],
      interpretacao: [
        total === 0
          ? 'Tratamento ambulatorial apropriado, com reavaliação em 48 a 72 horas.'
          : total <= 2
            ? 'Considere internação ou observação hospitalar — a mortalidade já é sete vezes maior do que na faixa zero.'
            : 'Internação urgente, com avaliação para terapia intensiva.',
        'O CRB-65 existe para o consultório e para a unidade básica, onde não há ureia disponível em tempo útil. Perde um pouco de discriminação em relação ao CURB-65, mas mantém desempenho suficiente para a decisão que importa nesse cenário: encaminhar ou não.',
      ],
    }
  },
  formula: ['C onfusão + R espiração ≥ 30 + B pressão baixa + 65 anos'],
  fundamento:
    'A ureia é a única variável do CURB-65 que exige laboratório, e sua remoção reduz pouco a acurácia — o que faz sentido, já que idade e pressão arterial capturam boa parte da mesma informação prognóstica (reserva fisiológica e perfusão).',
  armadilhas: ['Um único ponto no CRB-65 já corresponde a mortalidade de 8%; não trate escore 1 como equivalente a escore 1 do CURB-65.'],
  referencias: [{ texto: 'Lim WS, van der Eerden MM, Laing R, et al. Thorax. 2003;58(5):377-382.' }],
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
    campoSimNao('asilo', 'Residente em instituição de longa permanência', 10),
    campoSimNao('neoplasia', 'Doença neoplásica ativa', 30),
    campoSimNao('hepatica', 'Doença hepática', 20),
    campoSimNao('icc', 'Insuficiência cardíaca congestiva', 10),
    campoSimNao('cerebrovascular', 'Doença cerebrovascular', 10),
    campoSimNao('renal', 'Doença renal', 10),
    campoSimNao('mental', 'Alteração do estado mental', 20),
    campoSimNao('fr', 'Frequência respiratória ≥ 30 irpm', 20),
    campoSimNao('pas', 'PA sistólica < 90 mmHg', 20),
    campoSimNao('temp', 'Temperatura < 35 °C ou ≥ 40 °C', 15),
    campoSimNao('fc', 'Frequência cardíaca ≥ 125 bpm', 10),
    campoSimNao('ph', 'pH arterial < 7,35', 30),
    campoSimNao('bun', 'Ureia ≥ 64 mg/dL (BUN ≥ 30 mg/dL)', 20),
    campoSimNao('na', 'Sódio < 130 mEq/L', 20),
    campoSimNao('glicose', 'Glicose ≥ 250 mg/dL', 10),
    campoSimNao('ht', 'Hematócrito < 30%', 10),
    campoSimNao('pao2', 'PaO₂ < 60 mmHg ou SaO₂ < 90%', 10),
    campoSimNao('derrame', 'Derrame pleural na radiografia', 10),
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
      ],
    }
  },
  formula: ['Classe I: < 50 anos, sem comorbidade e sem alteração ao exame', 'Classe II ≤ 70 | III 71–90 | IV 91–130 | V > 130'],
  fundamento:
    'O PSI foi derivado da coorte PORT com mais de 14 mil pacientes hospitalizados e validado em outros 38 mil. Seu objetivo declarado não era prever mortalidade, mas identificar com segurança quem **não** precisa internar — e é nisso que ele se sustenta melhor do que qualquer alternativa: a mortalidade nas classes I e II é tão baixa que a internação raramente se justifica.',
  armadilhas: [
    'Classe I exige simultaneamente idade abaixo de 50, nenhuma comorbidade da lista e nenhuma alteração de exame físico ou laboratorial. Basta um item para sair da classe I.',
    'O escore não considera fatores sociais, adesão, capacidade de ingestão oral e acesso a retorno — que frequentemente decidem a internação na prática.',
  ],
  referencias: [
    { texto: 'Fine MJ, Auble TE, Yealy DM, et al. A prediction rule to identify low-risk patients with community-acquired pneumonia. N Engl J Med. 1997;336(4):243-250.' },
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
      { valor: '0', rotulo: 'Grau 0 — só com exercício intenso', pontos: 0 },
      { valor: '1', rotulo: 'Grau 1 — ao andar apressado no plano ou subir ladeira leve', pontos: 1 },
      { valor: '2', rotulo: 'Grau 2 — anda mais devagar que pessoas da mesma idade, ou precisa parar ao andar no próprio passo', pontos: 2 },
      { valor: '3', rotulo: 'Grau 3 — para para respirar após andar cerca de 100 m ou alguns minutos no plano', pontos: 3 },
      { valor: '4', rotulo: 'Grau 4 — dispneia impede sair de casa, ou surge ao vestir-se e despir-se', pontos: 4 },
    ]),
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
          ? 'A partir do grau 2 há indicação formal de reabilitação pulmonar na DPOC, que é a intervenção com maior efeito sobre dispneia e qualidade de vida em toda a doença.'
          : 'Nos graus 0 e 1, o foco é cessação do tabagismo, vacinação e otimização do broncodilatador.',
      ],
    }
  },
  formula: ['Escala ordinal de 0 a 4, definida pela atividade que desencadeia a dispneia'],
  fundamento:
    'A escala nasceu do questionário do Medical Research Council britânico dos anos 1950, criado para estudos epidemiológicos em mineradores. A versão modificada renumerou de 0 a 4 e é hoje um dos dois eixos da classificação GOLD de DPOC, ao lado do histórico de exacerbações.',
  armadilhas: [
    'Existem duas numerações em circulação (1 a 5 na MRC original, 0 a 4 na modificada). Registre sempre "mMRC" para evitar deslocamento de um grau.',
    'Limitação por osteoartrose, obesidade ou doença vascular periférica eleva a pontuação sem que a dispneia seja pulmonar.',
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
    campoNum('imc', 'Índice de massa corporal', { unidade: 'kg/m²', min: 10, max: 60, passo: 0.1 }),
    campoNum('vef1', 'VEF₁ pós-broncodilatador', { unidade: '% do predito', min: 10, max: 130, passo: 1 }),
    campoOpc('mmrc', 'Dispneia (mMRC)', [
      { valor: '0', rotulo: 'Grau 0 ou 1', pontos: 0 },
      { valor: '1', rotulo: 'Grau 2', pontos: 1 },
      { valor: '2', rotulo: 'Grau 3', pontos: 2 },
      { valor: '3', rotulo: 'Grau 4', pontos: 3 },
    ]),
    campoNum('tc6', 'Distância no teste de caminhada de 6 minutos', { unidade: 'm', min: 0, max: 900, passo: 5 }),
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
    'Celli e colaboradores construíram o índice em 2004 a partir da observação de que pacientes com o mesmo VEF₁ tinham sobrevidas muito diferentes. Testaram várias combinações de variáveis e chegaram às quatro que, juntas, maximizavam a discriminação de mortalidade — cada uma representando uma dimensão distinta: nutrição, função pulmonar, sintoma e desempenho.',
  armadilhas: [
    'O teste de caminhada de 6 minutos precisa ser padronizado (corredor plano de 30 m, incentivo verbal padronizado, sem aquecimento). Improvisar o teste invalida o componente E, que pesa 3 dos 10 pontos.',
    'O VEF₁ é o pós-broncodilatador; usar o pré-broncodilatador superestima a gravidade.',
  ],
  referencias: [
    { texto: 'Celli BR, Cote CG, Marin JM, et al. The body-mass index, airflow obstruction, dyspnea, and exercise capacity index in chronic obstructive pulmonary disease. N Engl J Med. 2004;350(10):1005-1012.' },
  ],
}

const controleAsma: Ferramenta = {
  id: 'controle-asma',
  nome: 'Controle da asma: GINA e teste de controle (ACT)',
  sinonimos: ['asma controle', 'act', 'gina', 'asthma control test'],
  resumo: 'Avalia o controle da asma pelos dois instrumentos mais usados, lado a lado.',
  categorias: ['pneumologia'],
  campos: [
    campoSimNao('gDia', 'Sintomas diurnos mais de 2 vezes por semana (últimas 4 semanas)', 1),
    campoSimNao('gNoite', 'Qualquer despertar noturno por asma', 1),
    campoSimNao('gResgate', 'Uso de medicação de resgate mais de 2 vezes por semana', 1, 'Não conta o uso profilático antes do exercício.'),
    campoSimNao('gAtividade', 'Qualquer limitação de atividade por asma', 1),
    campoOpc('act1', 'ACT 1 — Nas últimas 4 semanas, quanto a asma impediu você de fazer suas atividades?', [
      { valor: '5', rotulo: 'Nenhuma vez', pontos: 5 },
      { valor: '4', rotulo: 'Poucas vezes', pontos: 4 },
      { valor: '3', rotulo: 'Algumas vezes', pontos: 3 },
      { valor: '2', rotulo: 'A maior parte do tempo', pontos: 2 },
      { valor: '1', rotulo: 'Todo o tempo', pontos: 1 },
    ]),
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
      ],
    }
  },
  formula: ['GINA: 4 perguntas — 0 controlada, 1–2 parcialmente, 3–4 não controlada', 'ACT: soma de 5 itens (1 a 5 pontos cada), total 5 a 25'],
  fundamento:
    'Os dois instrumentos medem a mesma coisa por caminhos diferentes: o GINA usa quatro perguntas dicotômicas focadas nas últimas quatro semanas e é o padrão das diretrizes; o ACT usa uma escala contínua validada psicometricamente, com melhor sensibilidade para mudança ao longo do tempo. Aplicá-los juntos dá uma classificação e uma medida de acompanhamento.',
  armadilhas: [
    'O uso de resgate antes do exercício, quando profilático e planejado, não conta como perda de controle.',
    'ACT não foi validado abaixo de 12 anos — para crianças de 4 a 11 anos existe o childhood ACT, com escala e pontos de corte diferentes.',
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
    campoNum('spo2', 'SpO₂', { unidade: '%', min: 50, max: 100, passo: 1 }),
    campoNum('fio2', 'FiO₂ programada', { unidade: '%', min: 21, max: 100, passo: 1 }),
    campoNum('fr', 'Frequência respiratória', { unidade: 'irpm', min: 5, max: 60, passo: 1 }),
    campoSeg('tempo', 'Tempo de uso do alto fluxo', [
      { valor: '2', rotulo: '2 horas' },
      { valor: '6', rotulo: '6 horas' },
      { valor: '12', rotulo: '12 horas ou mais' },
    ]),
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
      ],
      alertas: ['O índice não foi validado em DPOC exacerbada nem em insuficiência respiratória hipercápnica — nesses cenários a ventilação não invasiva tem precedência sobre o alto fluxo.'],
    }
  },
  formula: ['ROX = (SpO₂ / FiO₂) / frequência respiratória'],
  fundamento:
    'Roca e colaboradores construíram o índice sobre a intuição de que qualquer índice de oxigenação isolado é insuficiente para decidir intubação, porque ignora o custo respiratório. Dividir a relação SpO₂/FiO₂ pela frequência respiratória penaliza justamente o paciente que mantém a saturação à custa de taquipneia — o perfil que evolui para falha.',
  armadilhas: [
    'Sedação, opioide e febre alteram a frequência respiratória por vias independentes da mecânica e distorcem o índice.',
    'Não substitui o exame clínico: uso de musculatura acessória, respiração paradoxal, alteração do nível de consciência e instabilidade hemodinâmica indicam intubação independentemente do ROX.',
  ],
  referencias: [
    { texto: 'Roca O, Caralt B, Messika J, et al. An index combining respiratory rate and oxygenation to predict outcome of nasal high-flow therapy. Am J Respir Crit Care Med. 2019;199(11):1368-1376.' },
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
    campoNum('vt', 'Volume corrente espontâneo', { unidade: 'mL', min: 50, max: 1200, passo: 5 }),
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
      interpretacao: [
        'Respiração rápida e superficial é o padrão universal de fadiga da musculatura respiratória: quando o trabalho por respiração fica alto demais, o sistema compensa reduzindo o volume e aumentando a frequência. Dividir uma pela outra transforma esse padrão num número.',
        'O RSBI foi validado como parte de uma avaliação, não como decisor isolado. O teste de respiração espontânea de 30 a 120 minutos permanece o padrão-ouro para indicar extubação, e um paciente pode falhar no RSBI e passar no teste.',
        'Extubação exige responder a duas perguntas independentes: o paciente consegue **ventilar** sem o tubo (é o que o RSBI e o teste espontâneo avaliam) e consegue **proteger a via aérea** (nível de consciência, tosse eficaz, quantidade de secreção, teste de escape do balonete). Falha em qualquer uma contraindica.',
      ],
    }
  },
  formula: ['RSBI = frequência respiratória ÷ volume corrente em litros'],
  fundamento:
    'Yang e Tobin testaram, em 1991, vários preditores de desmame em duas coortes prospectivas e encontraram no RSBI o melhor desempenho isolado, superior à pressão inspiratória máxima, à complacência e à relação P/F. O índice sobreviveu três décadas porque mede exatamente o que importa: a estratégia respiratória que o paciente adota quando o suporte é retirado.',
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
    campoNum('ptPleural', 'Proteína total no líquido pleural', { unidade: 'g/dL', min: 0, max: 10, passo: 0.1 }),
    campoNum('ptSerica', 'Proteína total sérica', { unidade: 'g/dL', min: 2, max: 12, passo: 0.1 }),
    campoNum('ldhPleural', 'LDH no líquido pleural', { unidade: 'U/L', min: 5, max: 5000, passo: 1 }),
    campoNum('ldhSerica', 'LDH sérica', { unidade: 'U/L', min: 50, max: 3000, passo: 1 }),
    campoNum('ldhLimite', 'Limite superior do normal da LDH sérica do laboratório', { unidade: 'U/L', min: 100, max: 500, passo: 1, padrao: '250' }),
    campoNum('albSerica', 'Albumina sérica', { unidade: 'g/dL', min: 0.5, max: 6, passo: 0.1, opcional: true, ajuda: 'Permite calcular o gradiente de albumina, útil quando há diurético em uso.' }),
    campoNum('albPleural', 'Albumina no líquido pleural', { unidade: 'g/dL', min: 0, max: 6, passo: 0.1, opcional: true }),
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
    campoSimNao('cancer', 'Neoplasia', 30),
    campoSimNao('ic', 'Insuficiência cardíaca', 10),
    campoSimNao('pulmonar', 'Doença pulmonar crônica', 10),
    campoSimNao('fc', 'Frequência cardíaca ≥ 110 bpm', 20),
    campoSimNao('pas', 'PA sistólica < 100 mmHg', 30),
    campoSimNao('fr', 'Frequência respiratória ≥ 30 irpm', 20),
    campoSimNao('temp', 'Temperatura < 36 °C', 20),
    campoSimNao('mental', 'Alteração do estado mental', 60),
    campoSimNao('sao2', 'SaO₂ < 90%', 20),
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
    'O PESI foi derivado de mais de 15 mil pacientes com embolia pulmonar aguda para prever mortalidade por qualquer causa em 30 dias. Diferente dos escores de probabilidade diagnóstica (Wells, Genebra), que respondem "há embolia?", o PESI responde "esta embolia é grave?" — e sua contribuição prática foi tornar possível o tratamento domiciliar de uma doença que se internava por reflexo.',
  armadilhas: [
    'O PESI prediz mortalidade global, não mortalidade por embolia; boa parte dos óbitos nas classes altas decorre de câncer e comorbidade.',
    'Escore baixo com disfunção de ventrículo direito não é baixo risco. A avaliação do ventrículo direito é obrigatória antes de considerar alta.',
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
    campoSimNao('idade', 'Idade > 80 anos', 1),
    campoSimNao('cancer', 'Neoplasia', 1),
    campoSimNao('cardiopulmonar', 'Insuficiência cardíaca ou doença pulmonar crônica', 1),
    campoSimNao('fc', 'Frequência cardíaca ≥ 110 bpm', 1),
    campoSimNao('pas', 'PA sistólica < 100 mmHg', 1),
    campoSimNao('sao2', 'SaO₂ < 90%', 1),
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
      ],
    }
  },
  formula: ['1 ponto por critério; sPESI = 0 identifica baixo risco'],
  fundamento:
    'A simplificação partiu do PESI original eliminando variáveis redundantes e atribuindo peso idêntico às restantes. O resultado surpreendeu: a discriminação foi preservada, confirmando que boa parte da complexidade do escore original não acrescentava informação para a decisão dicotômica de alta.',
  armadilhas: ['sPESI zero em paciente com trombo em trânsito, disfunção de ventrículo direito ou troponina elevada não autoriza alta — o escore não vê o coração.'],
  referencias: [
    { texto: 'Jiménez D, Aujesky D, Moores L, et al. Simplification of the pulmonary embolism severity index for prognostication in patients with acute symptomatic pulmonary embolism. Arch Intern Med. 2010;170(15):1383-1389.' },
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
