import type { Ferramenta, Nivel, Resultado } from '../tipos'
import {
  bsaDuBois,
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
  fmtLivre,
  fmtPct,
  num,
  numOu,
  opc,
  sim,
  somaSimNao,
} from '../helpers'

const dosePediatrica: Ferramenta = {
  id: 'dose-pediatrica',
  nome: 'Dose pediátrica por peso e por superfície corporal',
  sinonimos: ['dose crianca', 'mg/kg', 'superficie corporal', 'dose por peso', 'prescricao pediatrica'],
  resumo: 'Calcula dose por quilo e por metro quadrado, com teto de dose de adulto.',
  categorias: ['pediatria', 'farmacologia'],
  campos: [
    campoPeso({ min: 0.4, max: 120 }),
    campoAltura({ min: 30, max: 200, opcional: true, ajuda: 'Necessária apenas para dose por superfície corporal.' }),
    campoNum('mgkg', 'Dose prescrita', { unidade: 'mg/kg/dose', min: 0.001, max: 500, passo: 0.001 }),
    campoNum('tomadas', 'Tomadas por dia', { min: 1, max: 8, passo: 1, padrao: '3' }),
    campoNum('maxDose', 'Dose máxima por tomada (teto de adulto)', { unidade: 'mg', min: 1, max: 10000, passo: 1, opcional: true }),
    campoNum('concentracao', 'Concentração da apresentação', { unidade: 'mg/mL', min: 0.1, max: 1000, passo: 0.1, opcional: true, ajuda: 'Converte a dose em mililitros da solução ou suspensão.' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const altura = num(v, 'altura')
    const mgkg = num(v, 'mgkg')
    const tomadas = numOu(v, 'tomadas', 3)
    const maxDose = num(v, 'maxDose')
    const conc = num(v, 'concentracao')
    if (peso === null || mgkg === null) return null
    const porDose = peso * mgkg
    const limitada = maxDose !== null ? Math.min(porDose, maxDose) : porDose
    const diaria = limitada * tomadas
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Dose por tomada', valor: `${fmtLivre(limitada, 2)} mg`, nota: maxDose !== null && porDose > maxDose ? `⚠ Dose calculada (${fmtLivre(porDose, 2)} mg) excede o teto de adulto — limitada a ${fmtLivre(maxDose, 2)} mg.` : undefined, nivel: maxDose !== null && porDose > maxDose ? 'alerta' : 'neutro' },
      { rotulo: 'Dose diária total', valor: `${fmtLivre(diaria, 2)} mg/dia`, nota: `${fmtLivre(diaria / peso, 2)} mg/kg/dia` },
      { rotulo: 'Intervalo', valor: `${fmtInt(24 / tomadas)}/${fmtInt(24 / tomadas)} h` },
    ]
    if (conc !== null && conc > 0) {
      detalhes.push({ rotulo: 'Volume por tomada', valor: `${fmtLivre(limitada / conc, 2)} mL`, nota: `Apresentação de ${fmtLivre(conc, 2)} mg/mL.` })
      detalhes.push({ rotulo: 'Volume diário', valor: `${fmtLivre(diaria / conc, 2)} mL/dia` })
    }
    if (altura !== null) {
      const scMosteller = bsaMosteller(peso, altura)
      const scDuBois = bsaDuBois(peso, altura)
      detalhes.push({ rotulo: 'Superfície corporal (Mosteller)', valor: `${fmt(scMosteller, 3)} m²`, nota: '√(peso × altura / 3600). A mais simples e praticamente idêntica às demais.' })
      detalhes.push({ rotulo: 'Superfície corporal (Du Bois)', valor: `${fmt(scDuBois, 3)} m²`, nota: 'A clássica em oncologia.' })
      detalhes.push({ rotulo: 'Dose se prescrita por m²', valor: `${fmtLivre(scMosteller * mgkg, 2)} mg`, nota: `Se a prescrição fosse ${fmtLivre(mgkg, 2)} mg/m².` })
      detalhes.push({ rotulo: 'Fração da superfície corporal do adulto', valor: fmtPct((scMosteller / 1.73) * 100, 0), nota: 'Superfície de referência do adulto: 1,73 m².' })
    }
    return {
      titulo: 'Dose por tomada',
      valor: fmtLivre(limitada, 2),
      unidade: 'mg',
      nivel: 'neutro',
      rotuloNivel: `${fmtLivre(mgkg, 3)} mg/kg × ${fmt(peso, 2)} kg`,
      detalhes,
      interpretacao: [
        '**A criança não é um adulto em escala.** A dose por quilo funciona para a maioria dos fármacos porque a depuração acompanha aproximadamente a massa corporal, mas os extremos falham: o neonato tem enzimas hepáticas imaturas e filtração glomerular reduzida (metade da do adulto ao nascer, atingindo valores de adulto por volta dos 2 anos), e o lactente tem proporcionalmente mais água corporal, o que aumenta o volume de distribuição de fármacos hidrofílicos.',
        '**Superfície corporal é preferível a peso** quando o fármaco tem janela terapêutica estreita e a depuração escala melhor com a área — é o caso da quimioterapia, de alguns imunossupressores e de reposições hidroeletrolíticas. Para a maioria dos antimicrobianos e analgésicos, o peso basta.',
        '**Nunca ultrapasse a dose de adulto.** Adolescentes com 80 kg calculados a 50 mg/kg chegariam a 4 g de amoxicilina por tomada — o teto existe justamente para isso.',
        'Registre a dose em mg **e** em mL na prescrição, e a concentração da apresentação. Erro de dose por confusão entre mg e mL é uma das causas mais frequentes de evento adverso grave em pediatria.',
      ],
      alertas: ['Confira sempre se a dose prescrita é por **dose** ou por **dia**. "50 mg/kg/dia divididos em 3" e "50 mg/kg/dose 3 vezes ao dia" diferem por um fator de três.'],
    }
  },
  formula: ['Dose = peso × mg/kg', 'SC (Mosteller) = √(peso × altura / 3600)', 'SC (Du Bois) = 0,007184 × peso^0,425 × altura^0,725'],
  fundamento:
    'A superfície corporal correlaciona-se melhor com a taxa metabólica basal, o débito cardíaco e a filtração glomerular do que o peso isolado — daí seu uso em oncologia. A fórmula de Du Bois, de 1916, foi derivada de nove indivíduos com moldes de gesso; a de Mosteller, de 1987, é uma simplificação algébrica que concorda com ela dentro de poucos por cento e cabe numa calculadora simples.',
  armadilhas: [
    'Em obesidade, dose por peso real pode gerar superdosagem de fármacos hidrofílicos. Considere peso ideal ou ajustado.',
    'Prematuros e neonatos exigem tabelas próprias, com intervalos alargados conforme a idade pós-menstrual.',
  ],
  referencias: [
    { texto: 'Mosteller RD. Simplified calculation of body-surface area. N Engl J Med. 1987;317(17):1098.' },
    { texto: 'Kearns GL, Abdel-Rahman SM, Alander SW, et al. Developmental pharmacology — drug disposition, action, and therapy in infants and children. N Engl J Med. 2003;349(12):1157-1167.' },
  ],
}

const hidratacao: Ferramenta = {
  id: 'hidratacao-pediatrica',
  nome: 'Hidratação pediátrica: manutenção, déficit e perdas',
  sinonimos: ['holliday segal', 'holliday-segar', 'manutencao hidrica', 'soro de manutencao', 'regra 4-2-1'],
  resumo: 'Calcula manutenção por Holliday-Segar, déficit por grau de desidratação e o plano de 24 horas.',
  categorias: ['pediatria', 'emergencia'],
  campos: [
    campoPeso({ min: 1, max: 80 }),
    campoOpc('desidratacao', 'Grau de desidratação', [
      { valor: '0', rotulo: 'Sem desidratação', pontos: 0 },
      { valor: '5', rotulo: 'Leve (3 a 5%)', pontos: 5 },
      { valor: '8', rotulo: 'Moderada (6 a 9%)', pontos: 8 },
      { valor: '12', rotulo: 'Grave (≥ 10%)', pontos: 12 },
    ]),
    campoNum('perdas', 'Perdas continuadas estimadas em 24 h', { unidade: 'mL', min: 0, max: 5000, passo: 10, padrao: '0', opcional: true, ajuda: 'Vômitos, diarreia, drenos, febre (acrescente 10 a 12% da manutenção para cada grau acima de 37,5 °C).' }),
    campoSeg('via', 'Via preferencial', [
      { valor: 'oral', rotulo: 'Oral / sonda' },
      { valor: 'ev', rotulo: 'Endovenosa' },
    ]),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const grau = num(v, 'desidratacao')
    const perdas = numOu(v, 'perdas', 0)
    if (peso === null || grau === null) return null
    let manutencao = 0
    if (peso <= 10) manutencao = peso * 100
    else if (peso <= 20) manutencao = 1000 + (peso - 10) * 50
    else manutencao = 1500 + (peso - 20) * 20
    const manutencaoHora = peso <= 10 ? peso * 4 : peso <= 20 ? 40 + (peso - 10) * 2 : 60 + (peso - 20) * 1
    const deficit = (grau / 100) * peso * 1000
    const total = manutencao + deficit + perdas
    const via = opc(v, 'via')
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Manutenção (Holliday-Segar)', valor: `${fmtInt(manutencao)} mL/24 h`, nota: '100 mL/kg para os primeiros 10 kg, 50 mL/kg para os 10 kg seguintes, 20 mL/kg para cada kg acima de 20.' },
      { rotulo: 'Manutenção por hora (regra 4-2-1)', valor: `${fmtInt(manutencaoHora)} mL/h` },
      { rotulo: 'Déficit estimado', valor: `${fmtInt(deficit)} mL`, nota: `${grau}% do peso corporal. 1% de desidratação ≈ 10 mL/kg.` },
      { rotulo: 'Perdas continuadas', valor: `${fmtInt(perdas)} mL/24 h` },
      { rotulo: 'Volume total em 24 h', valor: `${fmtInt(total)} mL`, nota: `Aproximadamente ${fmtInt(total / 24)} mL/h.`, nivel: 'alerta' },
      { rotulo: 'Necessidades de eletrólitos', valor: 'Na⁺ 2 a 3 mEq/kg/dia · K⁺ 1 a 2 mEq/kg/dia', nota: 'Só reponha potássio com diurese presente.' },
    ]
    if (grau >= 8) {
      detalhes.push({ rotulo: 'Expansão inicial (se choque ou desidratação grave)', valor: `${fmtInt(peso * 20)} mL`, nota: '20 mL/kg de solução isotônica em bolus, repetindo conforme a resposta. Reavalie após cada bolus.', nivel: 'critico' })
    }
    if (via === 'oral') {
      detalhes.push({ rotulo: 'Terapia de reidratação oral — plano B', valor: `${fmtInt(peso * 75)} mL em 4 h`, nota: '75 mL/kg de sais de reidratação oral de osmolaridade reduzida, oferecidos em pequenos volumes frequentes.' })
    }
    return {
      titulo: 'Volume total em 24 horas',
      valor: fmtInt(total),
      unidade: 'mL',
      nivel: grau >= 10 ? 'critico' : grau > 0 ? 'alerta' : 'neutro',
      rotuloNivel: grau === 0 ? 'Apenas manutenção' : `Manutenção + déficit de ${grau}%`,
      detalhes,
      interpretacao: [
        '**A terapia de reidratação oral é a primeira escolha** na desidratação leve e moderada, inclusive com vômitos — é tão eficaz quanto a endovenosa, tem menos complicações e menos internações. Ondansetrona em dose única facilita a via oral em crianças com vômitos.',
        '**Solução isotônica é o padrão para manutenção endovenosa.** As soluções hipotônicas clássicas, derivadas do artigo original de Holliday e Segar, causam hiponatremia iatrogênica em crianças hospitalizadas — cuja secreção de hormônio antidiurético está aumentada por dor, náusea, estresse e doença. As diretrizes atuais recomendam soro isotônico (salina 0,9% ou solução balanceada) com glicose.',
        'Holliday e Segar derivaram as constantes do **gasto energético**, não do peso diretamente: cada 100 kcal metabolizadas exigem cerca de 100 mL de água. A regra escalonada reflete a queda da taxa metabólica por quilo conforme a criança cresce.',
        'A **reavaliação clínica frequente** vale mais que qualquer cálculo. Peso seriado, diurese, perfusão, estado mental e mucosas orientam melhor do que a fórmula.',
      ],
      alertas: [
        'Na desidratação hipernatrêmica (sódio acima de 150 mEq/L), corrija lentamente — não mais que 10 a 12 mEq/L em 24 horas — pelo risco de edema cerebral.',
        'Só acrescente potássio ao soro depois de confirmar diurese.',
      ],
    }
  },
  formula: [
    'Manutenção: 100 mL/kg (primeiros 10 kg) + 50 mL/kg (10 a 20 kg) + 20 mL/kg (acima de 20 kg)',
    'Por hora (4-2-1): 4 mL/kg/h + 2 mL/kg/h + 1 mL/kg/h nas mesmas faixas',
    'Déficit (mL) = % de desidratação × peso (kg) × 10',
  ],
  fundamento:
    'Holliday e Segar publicaram a regra em 1957 relacionando necessidade hídrica ao gasto energético: crianças gastam cerca de 100 kcal/kg/dia nos primeiros 10 kg, 50 nos 10 kg seguintes e 20 acima disso. Como cada caloria metabolizada consome aproximadamente 1 mL de água (perdas insensíveis mais urina), os números coincidem. A regra 4-2-1 é a mesma conta dividida por 24.',
  armadilhas: [
    'A regra pressupõe criança com metabolismo, função renal e estado de hidratação normais. Não se aplica a recém-nascidos, cardiopatas, nefropatas, queimados nem a pacientes em ventilação mecânica.',
    'A estimativa clínica do grau de desidratação é imprecisa. A diferença de peso antes e depois do quadro, quando disponível, é o padrão-ouro.',
  ],
  referencias: [
    { texto: 'Holliday MA, Segar WE. The maintenance need for water in parenteral fluid therapy. Pediatrics. 1957;19(5):823-832.' },
    { texto: 'Feld LG, Neuspiel DR, Foster BA, et al. Clinical practice guideline: maintenance intravenous fluids in children. Pediatrics. 2018;142(6):e20183083.' },
  ],
}

const desidratacaoEscore: Ferramenta = {
  id: 'escore-desidratacao',
  nome: 'Escore clínico de desidratação',
  sinonimos: ['desidratacao', 'cds', 'gorelick', 'diarreia crianca'],
  resumo: 'Gradua a desidratação por quatro sinais, com melhor reprodutibilidade que a impressão global.',
  categorias: ['pediatria', 'emergencia'],
  campos: [
    campoOpc('aparencia', 'Aparência geral', [
      { valor: '0', rotulo: 'Normal', pontos: 0 },
      { valor: '1', rotulo: 'Sedenta, inquieta ou letárgica, mas irritável ao toque', pontos: 1 },
      { valor: '2', rotulo: 'Sonolenta, flácida, fria ou sudoreica; comatosa ou não', pontos: 2 },
    ]),
    campoOpc('olhos', 'Olhos', [
      { valor: '0', rotulo: 'Normais', pontos: 0 },
      { valor: '1', rotulo: 'Discretamente encovados', pontos: 1 },
      { valor: '2', rotulo: 'Muito encovados', pontos: 2 },
    ]),
    campoOpc('mucosas', 'Mucosas (língua)', [
      { valor: '0', rotulo: 'Úmidas', pontos: 0 },
      { valor: '1', rotulo: 'Pegajosas', pontos: 1 },
      { valor: '2', rotulo: 'Secas', pontos: 2 },
    ]),
    campoOpc('lagrimas', 'Lágrimas', [
      { valor: '0', rotulo: 'Lágrimas presentes', pontos: 0 },
      { valor: '1', rotulo: 'Lágrimas reduzidas', pontos: 1 },
      { valor: '2', rotulo: 'Ausência de lágrimas', pontos: 2 },
    ]),
    campoSimNao('enchimento', 'Tempo de enchimento capilar > 2 segundos', 0, 'Não pontua no escore, mas é um dos preditores individuais mais úteis de desidratação significativa.'),
    campoSimNao('turgor', 'Turgor cutâneo reduzido (prega que desfaz lentamente)', 0),
  ],
  calcular: (v) => {
    const ids = ['aparencia', 'olhos', 'mucosas', 'lagrimas']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const faixa = total === 0 ? 0 : total <= 4 ? 1 : 2
    const rotulos = ['Sem desidratação', 'Desidratação leve a moderada', 'Desidratação moderada a grave']
    const perda = ['< 3%', '3 a 6%', '≥ 6 a 9%'][faixa]
    return {
      titulo: 'Escore clínico de desidratação',
      valor: String(total),
      unidade: 'de 8 pontos',
      nivel: (['ok', 'alerta', 'critico'] as Nivel[])[faixa],
      rotuloNivel: rotulos[faixa],
      detalhes: [
        { rotulo: 'Perda de peso estimada', valor: perda },
        { rotulo: 'Enchimento capilar prolongado', valor: sim(v, 'enchimento') ? 'Sim' : 'Não', nota: 'Isoladamente, é um dos melhores preditores de desidratação de 5% ou mais.', nivel: sim(v, 'enchimento') ? 'alerta' : 'ok' },
        { rotulo: 'Turgor reduzido', valor: sim(v, 'turgor') ? 'Sim' : 'Não' },
      ],
      interpretacao: [
        faixa === 0
          ? 'Sem desidastação clinicamente detectável: mantenha a alimentação habitual, ofereça líquidos e sais de reidratação oral após cada evacuação líquida, e oriente sinais de alarme.'
          : faixa === 1
            ? '**Plano B da terapia de reidratação oral:** 50 a 100 mL/kg de sais de reidratação oral em 4 horas, em pequenos volumes frequentes, com reavaliação. Zinco por 10 a 14 dias em menores de 5 anos reduz duração e gravidade da diarreia.'
            : '**Plano C:** desidratação grave com sinais de choque exige expansão endovenosa imediata com 20 mL/kg de solução isotônica em bolus, repetindo conforme a resposta. Se não houver acesso venoso, a via intraóssea é a alternativa; a hidratação por sonda nasogástrica também é opção validada.',
        'Os três sinais individuais com melhor desempenho para detectar desidratação de 5% ou mais são: **tempo de enchimento capilar prolongado**, **turgor cutâneo reduzido** e **padrão respiratório anormal**. Ressecamento de mucosa e olhos encovados são frequentes, mas menos específicos.',
        'A avaliação clínica isolada tem acurácia limitada. A **variação de peso** documentada é a medida mais confiável — peça o peso mais recente conhecido.',
      ],
      alertas: ['Diarreia com sangue, febre alta, dor abdominal intensa, distensão ou toxemia exige investigação — não é gastroenterite viral simples. Considere disenteria bacteriana, invaginação intestinal e apendicite.'],
    }
  },
  formula: ['Soma de 4 itens (0 a 2 pontos cada); 0 = sem desidratação, 1–4 = leve a moderada, 5–8 = moderada a grave'],
  fundamento:
    'A escala foi desenvolvida e validada em crianças de 1 a 36 meses com gastroenterite, buscando substituir a estimativa subjetiva do percentual de desidratação — que tem concordância ruim entre examinadores — por um instrumento reprodutível. Os quatro sinais escolhidos refletem os dois compartimentos comprometidos: intravascular (aparência, perfusão) e intersticial (olhos, mucosas, lágrimas).',
  armadilhas: [
    'Não foi validada em crianças acima de 3 anos nem em desidratação por causas não digestivas.',
    'A desidratação hipernatrêmica preserva o volume intravascular e engana o exame: a criança pode parecer melhor do que está.',
  ],
  referencias: [
    { texto: 'Goldman RD, Friedman JN, Parkin PC. Validation of the clinical dehydration scale for children with acute gastroenteritis. Pediatrics. 2008;122(3):545-549.' },
    { texto: 'Steiner MJ, DeWalt DA, Byerley JS. Is this child dehydrated? JAMA. 2004;291(22):2746-2754.' },
  ],
}

const pesoEstimado: Ferramenta = {
  id: 'peso-estimado-pediatrico',
  nome: 'Peso estimado pela idade e parâmetros de emergência',
  sinonimos: ['peso estimado', 'aplsformula', 'broselow', 'peso crianca'],
  resumo: 'Estima peso, pressão arterial mínima, tamanho de tubo e doses de emergência.',
  categorias: ['pediatria', 'emergencia'],
  campos: [
    campoNum('idade', 'Idade', { unidade: 'anos', min: 0, max: 18, passo: 0.1 }),
    campoNum('meses', 'Idade em meses (para menores de 1 ano)', { unidade: 'meses', min: 0, max: 12, passo: 0.5, opcional: true }),
    campoNum('pesoReal', 'Peso real, se conhecido', { unidade: 'kg', min: 0.5, max: 120, passo: 0.1, opcional: true }),
  ],
  calcular: (v) => {
    const idade = num(v, 'idade')
    const meses = num(v, 'meses')
    const pesoReal = num(v, 'pesoReal')
    if (idade === null && meses === null) return null
    let estimado: number
    let formulaUsada: string
    if (meses !== null && meses <= 12) {
      estimado = 0.5 * meses + 4
      formulaUsada = '(0,5 × meses) + 4 — lactentes até 12 meses'
    } else if (idade !== null && idade <= 5) {
      estimado = 2 * idade + 8
      formulaUsada = '(2 × idade) + 8 — 1 a 5 anos'
    } else if (idade !== null && idade <= 12) {
      estimado = 3 * idade + 7
      formulaUsada = '(3 × idade) + 7 — 6 a 12 anos'
    } else {
      estimado = 50
      formulaUsada = 'Acima de 12 anos, use o peso real ou considerações de adulto'
    }
    const peso = pesoReal ?? estimado
    const idadeAnos = idade ?? (meses ?? 0) / 12
    const pasMinima = idadeAnos < 1 ? 70 : idadeAnos <= 10 ? 70 + 2 * idadeAnos : 90
    const pas50 = 90 + 2 * idadeAnos
    const tuboSemBalao = idadeAnos / 4 + 4
    const tuboComBalao = idadeAnos / 4 + 3.5
    const profundidade = tuboSemBalao * 3
    return {
      titulo: pesoReal !== null ? 'Peso real informado' : 'Peso estimado',
      valor: fmt(peso, 1),
      unidade: 'kg',
      nivel: 'neutro',
      rotuloNivel: pesoReal !== null ? `Estimativa pela fórmula seria ${fmt(estimado, 1)} kg` : formulaUsada,
      detalhes: [
        { rotulo: 'Pressão sistólica mínima aceitável (percentil 5)', valor: `${fmtInt(pasMinima)} mmHg`, nota: '70 + (2 × idade) entre 1 e 10 anos; 70 mmHg abaixo de 1 ano; 90 mmHg acima de 10 anos. **Abaixo disso é hipotensão — sinal tardio de choque na criança.**', nivel: 'alerta' },
        { rotulo: 'Pressão sistólica no percentil 50', valor: `${fmtInt(pas50)} mmHg`, nota: '90 + (2 × idade).' },
        { rotulo: 'Tubo endotraqueal sem balonete', valor: `${fmt(tuboSemBalao, 1)} mm`, nota: '(idade / 4) + 4' },
        { rotulo: 'Tubo endotraqueal com balonete', valor: `${fmt(tuboComBalao, 1)} mm`, nota: '(idade / 4) + 3,5. Tubos com balonete são hoje aceitos em todas as idades, exceto neonatos, desde que a pressão do balonete seja monitorizada.' },
        { rotulo: 'Profundidade de fixação do tubo', valor: `${fmt(profundidade, 1)} cm`, nota: 'Diâmetro interno × 3, medido na rima labial.' },
        { rotulo: 'Adrenalina na parada (1:10.000)', valor: `${fmtLivre(peso * 0.01, 2)} mg = ${fmtLivre(peso * 0.1, 1)} mL`, nota: '0,01 mg/kg endovenoso ou intraósseo, a cada 3 a 5 minutos. Máximo de 1 mg.' },
        { rotulo: 'Desfibrilação', valor: `${fmtInt(peso * 2)} J (primeiro choque) e ${fmtInt(peso * 4)} J (seguintes)`, nota: '2 J/kg no primeiro choque, 4 J/kg nos subsequentes, podendo chegar a 10 J/kg ou à dose de adulto.' },
        { rotulo: 'Cardioversão sincronizada', valor: `${fmtLivre(peso * 0.5, 1)} a ${fmtInt(peso * 1)} J`, nota: '0,5 a 1 J/kg no primeiro choque; 2 J/kg se necessário.' },
        { rotulo: 'Expansão volêmica', valor: `${fmtInt(peso * 20)} mL`, nota: '20 mL/kg de cristaloide isotônico em bolus (10 mL/kg em cardiopatas e neonatos).' },
        { rotulo: 'Glicose na hipoglicemia', valor: `${fmtInt(peso * 2)} mL de glicose a 25%`, nota: '0,5 a 1 g/kg. Em lactentes, prefira glicose a 10% (5 mL/kg) pela osmolaridade.' },
      ],
      interpretacao: [
        'As fórmulas de peso estimado são para **emergência**, quando não há balança. Elas têm erro médio de 10 a 20% e tendem a subestimar em populações com sobrepeso — use o peso real sempre que possível.',
        'A **fita de Broselow**, baseada no comprimento, é mais acurada que as fórmulas de idade e traz doses pré-calculadas por faixa colorida.',
        '**Hipotensão é sinal tardio de choque na criança.** O débito cardíaco pediátrico depende sobretudo da frequência, e a vasoconstrição compensatória mantém a pressão até que a perda volêmica ultrapasse 30 a 40%. Reconheça o choque compensado: taquicardia, enchimento capilar lento, extremidades frias, pulsos periféricos finos, taquipneia e alteração do nível de consciência.',
        'A **bradicardia na criança quase sempre é hipóxia** até prova em contrário. A sequência é oxigenar e ventilar primeiro; se a frequência permanecer abaixo de 60 bpm com má perfusão apesar de ventilação adequada, inicie compressões.',
      ],
    }
  },
  formula: [
    'Lactente (≤ 12 meses): peso = (0,5 × meses) + 4',
    '1 a 5 anos: peso = (2 × idade) + 8',
    '6 a 12 anos: peso = (3 × idade) + 7',
    'PA sistólica mínima = 70 + (2 × idade) entre 1 e 10 anos',
    'Tubo sem balonete = (idade / 4) + 4',
  ],
  fundamento:
    'As fórmulas do Advanced Paediatric Life Support foram derivadas de curvas de crescimento populacionais e reajustadas ao longo dos anos para acompanhar a mudança de peso das populações pediátricas. A fórmula do tubo endotraqueal, de Cole, aproxima o diâmetro da cartilagem cricoide — a porção mais estreita da via aérea pediátrica até cerca de 8 anos.',
  armadilhas: [
    'Subestimam o peso em crianças com sobrepeso e superestimam em desnutridas.',
    'Não use para calcular dose de quimioterápico ou de fármaco com janela estreita — nesses casos, pese.',
  ],
  referencias: [
    { texto: 'Samuels M, Wieteska S (eds). Advanced Paediatric Life Support: A Practical Approach to Emergencies. 6ª ed. Wiley-Blackwell; 2016.' },
    { texto: 'Topjian AA, Raymond TT, Atkins D, et al. Part 4: Pediatric Basic and Advanced Life Support — 2020 AHA Guidelines for CPR and ECC. Circulation. 2020;142(16_suppl_2):S469-S523.' },
  ],
}

const apgar: Ferramenta = {
  id: 'apgar',
  nome: 'Escore de Apgar',
  sinonimos: ['apgar', 'boletim de apgar', 'vitalidade do recem-nascido'],
  resumo: 'Avalia a vitalidade do recém-nascido no primeiro e no quinto minuto.',
  categorias: ['pediatria', 'ginecologia'],
  campos: [
    campoOpc('fc', 'Frequência cardíaca', [
      { valor: '2', rotulo: '2 — acima de 100 bpm', pontos: 2 },
      { valor: '1', rotulo: '1 — abaixo de 100 bpm', pontos: 1 },
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
    ]),
    campoOpc('respiracao', 'Esforço respiratório', [
      { valor: '2', rotulo: '2 — choro forte, respiração regular', pontos: 2 },
      { valor: '1', rotulo: '1 — irregular, lenta, choro fraco', pontos: 1 },
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
    ]),
    campoOpc('tonus', 'Tônus muscular', [
      { valor: '2', rotulo: '2 — movimentos ativos, boa flexão', pontos: 2 },
      { valor: '1', rotulo: '1 — alguma flexão de extremidades', pontos: 1 },
      { valor: '0', rotulo: '0 — flácido', pontos: 0 },
    ]),
    campoOpc('irritabilidade', 'Irritabilidade reflexa', [
      { valor: '2', rotulo: '2 — choro, tosse, espirro', pontos: 2 },
      { valor: '1', rotulo: '1 — careta', pontos: 1 },
      { valor: '0', rotulo: '0 — sem resposta', pontos: 0 },
    ]),
    campoOpc('cor', 'Coloração', [
      { valor: '2', rotulo: '2 — completamente rosado', pontos: 2 },
      { valor: '1', rotulo: '1 — corpo rosado com extremidades cianóticas', pontos: 1 },
      { valor: '0', rotulo: '0 — pálido ou cianótico', pontos: 0 },
    ]),
    campoSeg('momento', 'Momento da avaliação', [
      { valor: '1', rotulo: '1º minuto' },
      { valor: '5', rotulo: '5º minuto' },
      { valor: '10', rotulo: '10º minuto ou depois' },
    ]),
  ],
  calcular: (v) => {
    const ids = ['fc', 'respiracao', 'tonus', 'irritabilidade', 'cor']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const momento = opc(v, 'momento')
    const faixa = total >= 8 ? 0 : total >= 4 ? 1 : 2
    const nivel: Nivel = (['ok', 'alerta', 'critico'] as Nivel[])[faixa]
    return {
      titulo: `Apgar no ${momento === '1' ? '1º' : momento === '5' ? '5º' : '10º'} minuto`,
      valor: String(total),
      unidade: 'de 10',
      nivel,
      rotuloNivel: ['Boa vitalidade (8 a 10)', 'Vitalidade intermediária (4 a 7)', 'Vitalidade gravemente comprometida (0 a 3)'][faixa],
      detalhes: [
        { rotulo: 'Mnemônica', valor: 'A parência, P ulso, G esticulação (irritabilidade reflexa), A tividade (tônus), R espiração' },
        { rotulo: 'Momento', valor: momento === '1' ? '1º minuto — reflete a condição intraparto' : momento === '5' ? '5º minuto — tem maior valor prognóstico' : '10º minuto ou além — avaliado a cada 5 min enquanto o escore for menor que 7' },
      ],
      interpretacao: [
        '**O Apgar não determina a necessidade de reanimação e nunca deve atrasá-la.** A decisão de reanimar se baseia em três perguntas feitas nos primeiros segundos — gestação a termo? respira ou chora? tônus bom? — e, na sequência, em frequência cardíaca e respiração. O Apgar é uma **descrição** do estado, aplicada com o cronômetro correndo em paralelo.',
        momento === '5' && total < 7
          ? 'Apgar abaixo de 7 no 5º minuto exige avaliação a cada 5 minutos até 20 minutos de vida, com registro de todos os valores.'
          : 'Registre os componentes separadamente, e não apenas o total.',
        '**Apgar baixo não é sinônimo de asfixia perinatal.** Prematuridade, medicações maternas (opioides, sulfato de magnésio, anestésicos), malformações, doença neuromuscular e infecção reduzem o escore sem hipóxia. O diagnóstico de asfixia exige acidemia metabólica grave em sangue de cordão (pH < 7,0 ou déficit de base ≥ 12 mmol/L), encefalopatia moderada a grave e disfunção de múltiplos órgãos.',
        'O valor prognóstico do Apgar isolado para desfecho neurológico é fraco. Apgar de 0 a 3 aos 10, 15 e 20 minutos, contudo, associa-se progressivamente a maior risco de paralisia cerebral e morte.',
      ],
      alertas: ['A cor é o componente menos confiável: praticamente todos os recém-nascidos têm acrocianose no primeiro minuto, e a avaliação visual da coloração tem concordância ruim. A oximetria de pulso pré-ductal (mão direita) é o parâmetro objetivo.'],
    }
  },
  formula: ['Soma de 5 itens, 0 a 2 pontos cada'],
  fundamento:
    'Virginia Apgar propôs o escore em 1953 — ela era anestesiologista e queria um método padronizado para avaliar o efeito da anestesia obstétrica sobre o recém-nascido. Sua genialidade foi escolher cinco sinais observáveis em segundos, sem equipamento, e com gradação de três níveis cada. O acrônimo em inglês com o próprio sobrenome veio depois, proposto por outro autor.',
  armadilhas: [
    'Em prematuros, o tônus e a resposta reflexa são fisiologicamente reduzidos, e o escore subestima a vitalidade.',
    'Não existe "Apgar de 10 no primeiro minuto" na prática — a acrocianose é quase universal.',
  ],
  referencias: [
    { texto: 'Apgar V. A proposal for a new method of evaluation of the newborn infant. Curr Res Anesth Analg. 1953;32(4):260-267.' },
    { texto: 'American Academy of Pediatrics, American College of Obstetricians and Gynecologists. The Apgar score. Pediatrics. 2015;136(4):819-822.' },
  ],
}

const capurro: Ferramenta = {
  id: 'capurro',
  nome: 'Método de Capurro',
  sinonimos: ['capurro', 'idade gestacional recem nascido', 'somatico'],
  resumo: 'Estima a idade gestacional pelo exame de sinais somáticos do recém-nascido.',
  categorias: ['pediatria', 'ginecologia'],
  campos: [
    campoOpc('orelha', 'Forma da orelha', [
      { valor: '0', rotulo: '0 — chata, disforme, pavilhão não encurvado', pontos: 0 },
      { valor: '8', rotulo: '8 — pavilhão parcialmente encurvado na borda superior', pontos: 8 },
      { valor: '16', rotulo: '16 — pavilhão parcialmente encurvado em toda a borda superior', pontos: 16 },
      { valor: '24', rotulo: '24 — pavilhão totalmente encurvado', pontos: 24 },
    ]),
    campoOpc('mamaria', 'Tamanho da glândula mamária', [
      { valor: '0', rotulo: '0 — não palpável', pontos: 0 },
      { valor: '5', rotulo: '5 — palpável, menor que 5 mm', pontos: 5 },
      { valor: '10', rotulo: '10 — entre 5 e 10 mm', pontos: 10 },
      { valor: '15', rotulo: '15 — maior que 10 mm', pontos: 15 },
    ]),
    campoOpc('mamilo', 'Formação do mamilo', [
      { valor: '0', rotulo: '0 — apenas visível', pontos: 0 },
      { valor: '5', rotulo: '5 — aréola pigmentada, diâmetro < 7,5 mm, borda não elevada', pontos: 5 },
      { valor: '10', rotulo: '10 — aréola pigmentada, diâmetro > 7,5 mm, borda não elevada', pontos: 10 },
      { valor: '15', rotulo: '15 — borda elevada, diâmetro > 7,5 mm', pontos: 15 },
    ]),
    campoOpc('pele', 'Textura da pele', [
      { valor: '0', rotulo: '0 — muito fina, gelatinosa', pontos: 0 },
      { valor: '5', rotulo: '5 — fina e lisa', pontos: 5 },
      { valor: '10', rotulo: '10 — algo mais grossa, discreta descamação superficial', pontos: 10 },
      { valor: '15', rotulo: '15 — grossa, sulcos superficiais, descamação de mãos e pés', pontos: 15 },
      { valor: '20', rotulo: '20 — grossa, apergaminhada, sulcos profundos', pontos: 20 },
    ]),
    campoOpc('plantares', 'Pregas plantares', [
      { valor: '0', rotulo: '0 — ausentes', pontos: 0 },
      { valor: '5', rotulo: '5 — marcas mal definidas na metade anterior', pontos: 5 },
      { valor: '10', rotulo: '10 — marcas bem definidas na metade anterior, sulcos no terço anterior', pontos: 10 },
      { valor: '15', rotulo: '15 — sulcos na metade anterior', pontos: 15 },
      { valor: '20', rotulo: '20 — sulcos em mais da metade anterior', pontos: 20 },
    ]),
  ],
  calcular: (v) => {
    const ids = ['orelha', 'mamaria', 'mamilo', 'pele', 'plantares']
    let soma = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      soma += x
    }
    const dias = 204 + soma
    const semanas = dias / 7
    const semanasInt = Math.floor(semanas)
    const diasRestantes = Math.round((semanas - semanasInt) * 7)
    const classe = semanas < 37 ? 'Pré-termo' : semanas < 42 ? 'Termo' : 'Pós-termo'
    const nivel: Nivel = semanas < 34 ? 'critico' : semanas < 37 ? 'alerta' : semanas >= 42 ? 'alerta' : 'ok'
    return {
      titulo: 'Idade gestacional (Capurro somático)',
      valor: `${semanasInt}s ${diasRestantes}d`,
      nivel,
      rotuloNivel: classe,
      detalhes: [
        { rotulo: 'Soma dos pontos', valor: String(soma) },
        { rotulo: 'Idade gestacional em dias', valor: `${fmtInt(dias)} dias` },
        { rotulo: 'Idade gestacional em semanas', valor: fmt(semanas, 1) },
        { rotulo: 'Classificação', valor: semanas < 28 ? 'Prematuro extremo (< 28 semanas)' : semanas < 32 ? 'Muito prematuro (28 a 31 semanas)' : semanas < 34 ? 'Prematuro moderado (32 a 33 semanas)' : semanas < 37 ? 'Prematuro tardio (34 a 36 semanas)' : semanas < 39 ? 'Termo precoce (37 a 38 semanas)' : semanas < 41 ? 'Termo pleno (39 a 40 semanas)' : semanas < 42 ? 'Termo tardio (41 semanas)' : 'Pós-termo (≥ 42 semanas)' },
      ],
      interpretacao: [
        'O método de Capurro é o mais usado no Brasil pela rapidez: cinco sinais somáticos, sem necessidade de exame neurológico, o que permite aplicá-lo mesmo no recém-nascido gravemente doente ou sedado.',
        'A versão **somatoneurológica** (Capurro A) substitui um dos sinais somáticos por dois sinais neurológicos (sinal do xale e posição da cabeça ao levantar o corpo) e usa a constante 200 em vez de 204. Ela é ligeiramente mais acurada, mas exige recém-nascido em boas condições.',
        'A **melhor estimativa de idade gestacional continua sendo obstétrica**: ultrassonografia do primeiro trimestre, seguida da data da última menstruação confiável. Os métodos pós-natais são estimativas de reserva, com erro de ± 1 a 2 semanas.',
        semanas < 37 ? 'Prematuridade identificada: rastreie hipoglicemia, hipotermia, dificuldade alimentar, icterícia, apneia e desconforto respiratório, e reavalie o risco de retinopatia da prematuridade conforme o protocolo.' : semanas >= 42 ? 'Pós-termo: atenção a síndrome de aspiração meconial, hipoglicemia, policitemia e insuficiência placentária.' : 'Recém-nascido a termo.',
      ],
      alertas: ['A avaliação deve ser feita nas primeiras 24 horas de vida. Depois disso, a pele se descama e as características somáticas mudam, comprometendo a estimativa.'],
    }
  },
  formula: ['Idade gestacional (dias) = 204 + soma dos pontos', 'Semanas = dias / 7'],
  fundamento:
    'Capurro e colaboradores derivaram o método em 1978, correlacionando sinais de maturação somática com a idade gestacional conhecida. A lógica é que a maturação da pele, da cartilagem auricular, do tecido mamário e das pregas plantares segue uma cronologia previsível no terceiro trimestre — cada estrutura "marca" um momento da gestação.',
  armadilhas: [
    'Perde acurácia abaixo de 29 semanas, faixa em que o New Ballard é superior.',
    'Restrição de crescimento intrauterino, hidropisia e infecção congênita alteram as características somáticas.',
  ],
  referencias: [
    { texto: 'Capurro H, Konichezky S, Fonseca D, Caldeyro-Barcia R. A simplified method for diagnosis of gestational age in the newborn infant. J Pediatr. 1978;93(1):120-122.' },
  ],
}

const ballard: Ferramenta = {
  id: 'ballard',
  nome: 'New Ballard Score',
  sinonimos: ['ballard', 'new ballard', 'maturidade neonatal', 'idade gestacional prematuro'],
  resumo: 'Estima idade gestacional de 20 a 44 semanas, incluindo prematuros extremos.',
  categorias: ['pediatria'],
  campos: [
    campoNum('neuromuscular', 'Soma dos 6 itens de maturidade neuromuscular', { min: -6, max: 30, passo: 1, ajuda: 'Postura, ângulo de flexão do punho, retração do braço, ângulo poplíteo, sinal do xale e calcanhar-orelha. Cada item vale de −1 a 5.' }),
    campoNum('fisica', 'Soma dos 6 itens de maturidade física', { min: -6, max: 30, passo: 1, ajuda: 'Pele, lanugo, superfície plantar, mama, olhos e orelha, genitália. Cada item vale de −1 a 5.' }),
  ],
  calcular: (v) => {
    const nm = num(v, 'neuromuscular')
    const fis = num(v, 'fisica')
    if (nm === null || fis === null) return null
    const total = nm + fis
    const semanas = 24 + 0.4 * total
    const semanasInt = Math.floor(semanas)
    const dias = Math.round((semanas - semanasInt) * 7)
    const nivel: Nivel = semanas < 32 ? 'critico' : semanas < 37 ? 'alerta' : semanas >= 42 ? 'alerta' : 'ok'
    return {
      titulo: 'Idade gestacional (New Ballard)',
      valor: `${semanasInt}s ${dias}d`,
      nivel,
      rotuloNivel: semanas < 37 ? 'Pré-termo' : semanas < 42 ? 'Termo' : 'Pós-termo',
      detalhes: [
        { rotulo: 'Escore neuromuscular', valor: String(nm) },
        { rotulo: 'Escore físico', valor: String(fis) },
        { rotulo: 'Escore total', valor: String(total), nota: 'Faixa de −10 a 50 pontos.' },
        { rotulo: 'Correspondência', valor: '−10 = 20 semanas · 0 = 24 · 20 = 32 · 35 = 38 · 50 = 44', nota: 'Cada 5 pontos correspondem a 2 semanas.' },
      ],
      interpretacao: [
        'O New Ballard, publicado em 1991, estendeu o escore original de 1979 para baixo, permitindo avaliar prematuros extremos a partir de 20 semanas — faixa em que o Capurro e o Dubowitz não funcionam.',
        'Aplique **entre 12 e 20 horas de vida** para melhor acurácia em prematuros extremos; no recém-nascido a termo, a avaliação é confiável nas primeiras 96 horas. A margem de erro é de aproximadamente ± 2 semanas.',
        'O componente neuromuscular reflete a maturação do tônus flexor, que progride no sentido caudocranial: o prematuro extremo é hipotônico e extendido, o termo mantém flexão dos quatro membros em repouso.',
        'O componente físico reflete a maturação tecidual: pele gelatinosa e transparente no extremo prematuro, apergaminhada e descamativa no pós-termo; lanugo que aparece por volta de 24 semanas e desaparece próximo ao termo; pregas plantares que progridem do calcanhar em direção aos dedos.',
      ],
      alertas: ['Sedação, doença grave, uso materno de sulfato de magnésio e lesão neurológica prejudicam o componente neuromuscular. Nesses casos, o componente físico é mais confiável.'],
    }
  },
  formula: ['Idade gestacional (semanas) = 24 + 0,4 × escore total', 'Escore total = neuromuscular (−6 a 30) + físico (−6 a 30)'],
  fundamento:
    'O escore mede duas dimensões independentes da maturação fetal. A neuromuscular acompanha a mielinização e o desenvolvimento do tônus flexor, que é o último a se estabelecer. A física acompanha a maturação da pele, do tecido subcutâneo, da cartilagem e das estruturas anexas. Combinar as duas reduz o erro que cada uma teria isoladamente.',
  armadilhas: [
    'Avaliar tarde demais em prematuro extremo superestima a idade, porque as características amadurecem rapidamente ex utero.',
    'Não é confiável em recém-nascido com edema importante, hidropisia ou malformação.',
  ],
  referencias: [
    { texto: 'Ballard JL, Khoury JC, Wedig K, et al. New Ballard Score, expanded to include extremely premature infants. J Pediatr. 1991;119(3):417-423.' },
  ],
}

const silverman: Ferramenta = {
  id: 'silverman-andersen',
  nome: 'Boletim de Silverman-Andersen',
  sinonimos: ['silverman', 'desconforto respiratorio neonatal', 'boletim de silverman'],
  resumo: 'Gradua o desconforto respiratório do recém-nascido em cinco sinais.',
  categorias: ['pediatria'],
  campos: [
    campoOpc('toracoAbdominal', 'Movimento toracoabdominal', [
      { valor: '0', rotulo: '0 — sincrônico', pontos: 0 },
      { valor: '1', rotulo: '1 — tórax imóvel e abdome em movimento', pontos: 1 },
      { valor: '2', rotulo: '2 — dissociação (balancim)', pontos: 2 },
    ]),
    campoOpc('intercostal', 'Retração intercostal', [
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
      { valor: '1', rotulo: '1 — discreta', pontos: 1 },
      { valor: '2', rotulo: '2 — acentuada', pontos: 2 },
    ]),
    campoOpc('xifoide', 'Retração xifoide', [
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
      { valor: '1', rotulo: '1 — discreta', pontos: 1 },
      { valor: '2', rotulo: '2 — acentuada', pontos: 2 },
    ]),
    campoOpc('nasal', 'Batimento de aletas nasais', [
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
      { valor: '1', rotulo: '1 — discreto', pontos: 1 },
      { valor: '2', rotulo: '2 — acentuado', pontos: 2 },
    ]),
    campoOpc('gemido', 'Gemido expiratório', [
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
      { valor: '1', rotulo: '1 — audível à ausculta', pontos: 1 },
      { valor: '2', rotulo: '2 — audível sem estetoscópio', pontos: 2 },
    ]),
  ],
  calcular: (v) => {
    const ids = ['toracoAbdominal', 'intercostal', 'xifoide', 'nasal', 'gemido']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const faixa = total === 0 ? 0 : total <= 3 ? 1 : total <= 6 ? 2 : 3
    return {
      titulo: 'Boletim de Silverman-Andersen',
      valor: String(total),
      unidade: 'de 10',
      nivel: (['ok', 'atencao', 'alerta', 'critico'] as Nivel[])[faixa],
      rotuloNivel: ['Sem desconforto', 'Desconforto leve', 'Desconforto moderado', 'Desconforto grave — insuficiência respiratória iminente'][faixa],
      detalhes: [{ rotulo: 'Interpretação inversa', valor: 'Neste boletim, **quanto maior a pontuação, pior** — ao contrário do Apgar.' }],
      interpretacao: [
        faixa === 0
          ? 'Sem sinais de desconforto respiratório.'
          : faixa === 1
            ? 'Desconforto leve: observe de perto, monitorize saturação e reavalie com frequência.'
            : faixa === 2
              ? 'Desconforto moderado: considere suporte com pressão positiva contínua nasal (CPAP), oximetria contínua e gasometria.'
              : '**Desconforto grave**: suporte ventilatório imediato. Considere surfactante se houver síndrome do desconforto respiratório do prematuro.',
        'O **gemido expiratório** é o sinal mais específico: o recém-nascido fecha parcialmente a glote na expiração para gerar pressão positiva no fim da expiração e evitar o colapso alveolar. É um CPAP fisiológico — e explica por que o CPAP nasal funciona tão bem nesse cenário.',
        'A **respiração em balancim** (tórax deprime enquanto o abdome expande) reflete a complacência muito baixa do pulmão somada à caixa torácica extremamente complacente do prematuro.',
        'Principais causas de desconforto respiratório neonatal: síndrome do desconforto respiratório por deficiência de surfactante (prematuros), taquipneia transitória (retenção de líquido pulmonar, mais comum em cesariana eletiva), síndrome de aspiração meconial, pneumonia e sepse precoce, pneumotórax, cardiopatia congênita e hérnia diafragmática.',
      ],
    }
  },
  formula: ['Soma de 5 sinais, 0 a 2 pontos cada; quanto maior, pior'],
  fundamento:
    'Silverman e Andersen publicaram o boletim em 1956, correlacionando sinais clínicos de esforço respiratório com a gravidade da doença de membrana hialina. Os cinco sinais medem o mesmo fenômeno de ângulos diferentes: quando a complacência pulmonar cai, o recém-nascido gera pressões intratorácicas muito negativas, e a caixa torácica cartilaginosa cede — daí retrações e movimento paradoxal.',
  armadilhas: [
    'O escore avalia esforço, não oxigenação. Um prematuro exausto pode ter escore baixo por não conseguir mais gerar esforço — isso é sinal de gravidade extrema, não de melhora.',
    'Sempre correlacione com saturação, frequência respiratória, gasometria e radiografia.',
  ],
  referencias: [
    { texto: 'Silverman WA, Andersen DH. A controlled clinical trial of effects of water mist on obstructive respiratory signs, death rate and necropsy findings among premature infants. Pediatrics. 1956;17(1):1-10.' },
    { texto: 'Hedstrom AB, Gove NE, Mayock DE, Batra M. Performance of the Silverman Andersen Respiratory Severity Score. J Perinatol. 2018;38(5):505-511.' },
  ],
}

const fototerapia: Ferramenta = {
  id: 'bilirrubina-fototerapia',
  nome: 'Bilirrubina neonatal e indicação de fototerapia',
  sinonimos: ['ictericia neonatal', 'fototerapia', 'bilirrubina', 'exsanguineotransfusao', 'bhutani'],
  resumo: 'Compara a bilirrubina com o limiar de fototerapia por idade, idade gestacional e risco.',
  categorias: ['pediatria'],
  campos: [
    campoNum('bilirrubina', 'Bilirrubina total sérica', { unidade: 'mg/dL', min: 0.5, max: 40, passo: 0.1 }),
    campoNum('horas', 'Idade pós-natal', { unidade: 'horas', min: 12, max: 336, passo: 1 }),
    campoNum('ig', 'Idade gestacional ao nascer', { unidade: 'semanas', min: 32, max: 42, passo: 1 }),
    campoSimNao('risco', 'Fator de risco de neurotoxicidade presente', 1, 'Doença hemolítica isoimune, deficiência de glicose-6-fosfato desidrogenase, asfixia, letargia significativa, instabilidade térmica, sepse, acidose, ou albumina < 3,0 g/dL.'),
  ],
  calcular: (v) => {
    const bili = num(v, 'bilirrubina')
    const horas = num(v, 'horas')
    const ig = num(v, 'ig')
    if (bili === null || horas === null || ig === null) return null
    const comRisco = sim(v, 'risco')
    // Aproximação linear das curvas da AAP 2022: o limiar sobe com as horas até um platô,
    // e desce com a prematuridade e com a presença de fator de risco de neurotoxicidade.
    const igEfetiva = Math.min(Math.max(ig, 35), 38)
    const baseIg = 21 - (38 - igEfetiva) * 1.5
    const fatorHoras = Math.min(horas, 96) / 96
    let limiar = baseIg * (0.5 + 0.5 * fatorHoras)
    if (comRisco) limiar -= 2
    const limiarExsanguineo = limiar + 5
    const indicada = bili >= limiar
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Limiar aproximado de fototerapia', valor: `${fmt(limiar, 1)} mg/dL`, nota: 'Estimativa didática a partir das curvas da Academia Americana de Pediatria de 2022.' },
      { rotulo: 'Diferença para o limiar', valor: `${bili - limiar >= 0 ? '+' : ''}${fmt(bili - limiar, 1)} mg/dL`, nivel: indicada ? 'alerta' : 'ok' },
      { rotulo: 'Limiar aproximado de exsanguineotransfusão', valor: `${fmt(limiarExsanguineo, 1)} mg/dL`, nota: 'Também aproximado. Nível a 2 mg/dL do limiar de exsanguineotransfusão é indicação de fototerapia intensiva e escalada imediata.', nivel: bili >= limiarExsanguineo ? 'critico' : 'neutro' },
      { rotulo: 'Idade gestacional considerada', valor: `${fmtInt(ig)} semanas`, nota: ig < 35 ? '⚠ Abaixo de 35 semanas, os limiares seguem protocolos específicos para prematuros, bem mais baixos do que os aqui estimados.' : undefined, nivel: ig < 35 ? 'alerta' : 'neutro' },
    ]
    const nivel: Nivel = bili >= limiarExsanguineo ? 'critico' : indicada ? 'alerta' : 'ok'
    return {
      titulo: indicada ? 'Fototerapia indicada' : 'Abaixo do limiar de fototerapia',
      valor: `${fmt(bili, 1)} mg/dL`,
      nivel,
      rotuloNivel: `${fmtInt(horas)} h de vida · ${fmtInt(ig)} semanas${comRisco ? ' · com fator de risco' : ''}`,
      detalhes,
      interpretacao: [
        '⚠ **Esta ferramenta é uma aproximação didática das curvas oficiais.** A decisão real deve ser tomada sobre o nomograma da Academia Americana de Pediatria de 2022 ou o protocolo institucional, que são curvas contínuas por idade gestacional e hora de vida. Use este resultado para raciocinar, não para prescrever.',
        '**Sempre investigue a causa** quando a icterícia surge nas primeiras 24 horas de vida, quando a bilirrubina sobe mais de 0,2 mg/dL por hora, quando persiste além de 2 semanas, ou quando há colestase (bilirrubina direta acima de 1 mg/dL ou acima de 20% do total). Icterícia nas primeiras 24 horas é **sempre patológica**.',
        'Investigação mínima: tipagem sanguínea materna e do recém-nascido, Coombs direto, hemograma com reticulócitos, esfregaço, bilirrubinas frações e, conforme a suspeita, dosagem de glicose-6-fosfato desidrogenase.',
        'A **bilirrubinometria transcutânea** é excelente para rastreio e reduz punções, mas perde acurácia acima de 15 mg/dL e após o início da fototerapia — nesses casos, confirme com dosagem sérica.',
        'O **kernicterus** é raro e integralmente prevenível. Os sinais de encefalopatia bilirrubínica aguda — letargia, hipotonia, sucção fraca, evoluindo para hipertonia, retrocolo, opistótono, febre e choro agudo — exigem exsanguineotransfusão de urgência, independentemente do valor.',
      ],
      alertas: ['Fototerapia intensiva (irradiância ≥ 30 µW/cm²/nm, com máxima superfície corporal exposta) é diferente de fototerapia convencional. Se o nível estiver próximo do limiar de exsanguineotransfusão, use a intensiva e reavalie em 2 a 4 horas.'],
    }
  },
  formula: ['Limiares por idade pós-natal, idade gestacional e fatores de risco de neurotoxicidade (aproximação das curvas AAP 2022)'],
  fundamento:
    'A bilirrubina não conjugada é lipossolúvel e, quando excede a capacidade de ligação da albumina, atravessa a barreira hematoencefálica e se deposita preferencialmente nos gânglios da base — o que dá nome ao kernicterus. A fototerapia atua por fotoisomerização: a luz azul (comprimento de onda de 460 a 490 nm) converte a bilirrubina em lumirrubina, um isômero hidrossolúvel excretado sem conjugação hepática.',
  armadilhas: [
    'Não se guie pela avaliação visual da icterícia — ela subestima sistematicamente, sobretudo em pele mais pigmentada e sob luz artificial.',
    'A icterícia do leite materno (tardia, com bom ganho de peso) difere da icterícia por baixa oferta de leite (precoce, com perda de peso e desidratação). A segunda se trata otimizando a amamentação, não suspendendo-a.',
  ],
  referencias: [
    { texto: 'Kemper AR, Newman TB, Slaughter JL, et al. Clinical practice guideline revision: management of hyperbilirubinemia in the newborn infant 35 or more weeks of gestation. Pediatrics. 2022;150(3):e2022058859.' },
    { texto: 'Bhutani VK, Johnson L, Sivieri EM. Predictive ability of a predischarge hour-specific serum bilirubin for subsequent significant hyperbilirubinemia. Pediatrics. 1999;103(1):6-14.' },
  ],
}

const idadeCorrigida: Ferramenta = {
  id: 'idade-corrigida',
  nome: 'Idade corrigida do prematuro',
  sinonimos: ['idade corrigida', 'prematuro', 'idade gestacional corrigida'],
  resumo: 'Corrige a idade cronológica pela prematuridade, para avaliar crescimento e desenvolvimento.',
  categorias: ['pediatria'],
  campos: [
    campoNum('igNascimento', 'Idade gestacional ao nascer', { unidade: 'semanas', min: 22, max: 42, passo: 1 }),
    campoNum('igDias', 'Dias adicionais na idade gestacional', { unidade: 'dias', min: 0, max: 6, passo: 1, padrao: '0' }),
    campoNum('idadeCronologica', 'Idade cronológica atual', { unidade: 'meses', min: 0, max: 48, passo: 0.5 }),
  ],
  calcular: (v) => {
    const ig = num(v, 'igNascimento')
    const igDias = numOu(v, 'igDias', 0)
    const cronologica = num(v, 'idadeCronologica')
    if (ig === null || cronologica === null) return null
    const semanasPrematuro = 40 - (ig + igDias / 7)
    const mesesDesconto = semanasPrematuro / 4.345
    const corrigida = cronologica - mesesDesconto
    const idadePosMenstrual = ig + igDias / 7 + cronologica * 4.345
    return {
      titulo: 'Idade corrigida',
      valor: corrigida >= 0 ? `${fmt(corrigida, 1)} meses` : `${fmt(corrigida * 4.345, 1)} semanas antes do termo`,
      nivel: 'neutro',
      rotuloNivel: `Nasceu com ${fmt(semanasPrematuro, 1)} semanas de antecipação`,
      detalhes: [
        { rotulo: 'Idade cronológica', valor: `${fmt(cronologica, 1)} meses`, nota: 'Contada a partir do nascimento. É a que vale para o calendário vacinal.' },
        { rotulo: 'Desconto pela prematuridade', valor: `${fmt(mesesDesconto, 1)} meses` },
        { rotulo: 'Idade corrigida', valor: `${fmt(corrigida, 1)} meses`, nota: 'É a que vale para avaliar crescimento, marcos do desenvolvimento e introdução alimentar.' },
        { rotulo: 'Idade pós-menstrual', valor: `${fmt(idadePosMenstrual, 1)} semanas`, nota: 'Idade gestacional ao nascer + idade cronológica. É a usada nos protocolos de terapia intensiva neonatal e no rastreio de retinopatia da prematuridade.' },
        { rotulo: 'Até quando corrigir', valor: 'Até 2 anos (24 meses)', nota: 'Alguns serviços corrigem até 3 anos em prematuros extremos, sobretudo para perímetro cefálico e desenvolvimento neurológico.' },
      ],
      interpretacao: [
        '**A idade corrigida vale para crescimento e desenvolvimento. A idade cronológica vale para vacinas.** Essa é a distinção que mais gera erro na prática: o prematuro é vacinado pela idade cronológica, com as doses e o esquema habituais, independentemente do peso ou da idade corrigida (com exceções pontuais na hepatite B e no BCG conforme o peso).',
        'Sem a correção, todo prematuro parece ter atraso de crescimento e de desenvolvimento nos primeiros dois anos. Plotar um bebê de 6 meses nascido com 28 semanas na curva de 6 meses produz um diagnóstico falso de desnutrição e de atraso motor.',
        'Para prematuros, use as curvas de **Fenton** ou **Intergrowth-21st** até 50 semanas de idade pós-menstrual, e só então migre para as curvas da OMS com idade corrigida.',
        'Prematuros exigem seguimento estruturado: rastreio de retinopatia (a partir de 4 a 6 semanas de vida ou 31 semanas de idade pós-menstrual), triagem auditiva, avaliação do neurodesenvolvimento, suplementação de ferro e vitamina D, e vigilância nutricional.',
      ],
    }
  },
  formula: [
    'Semanas de prematuridade = 40 − idade gestacional ao nascer',
    'Idade corrigida = idade cronológica − semanas de prematuridade',
    'Idade pós-menstrual = idade gestacional ao nascer + idade cronológica',
  ],
  fundamento:
    'A correção existe porque o desenvolvimento neurológico e o crescimento seguem o relógio biológico contado desde a concepção, não desde o nascimento. Um bebê nascido com 28 semanas passou 12 semanas fora do útero fazendo o que faria dentro dele — e comparar seu desenvolvimento com o de um nascido a termo da mesma idade cronológica é comparar organismos com idades biológicas distintas.',
  armadilhas: [
    'Não corrija a idade para o calendário vacinal. Adiar vacinas em prematuros é erro comum e os deixa desprotegidos justamente quando estão mais vulneráveis.',
    'A correção é habitualmente feita para nascidos com menos de 37 semanas; o benefício é maior quanto mais prematuro.',
  ],
  referencias: [
    { texto: 'Engle WA; American Academy of Pediatrics Committee on Fetus and Newborn. Age terminology during the perinatal period. Pediatrics. 2004;114(5):1362-1364.' },
    { texto: 'Fenton TR, Kim JH. A systematic review and meta-analysis to revise the Fenton growth chart for preterm infants. BMC Pediatr. 2013;13:59.' },
  ],
}

const percentis: Ferramenta = {
  id: 'percentis-crescimento',
  nome: 'Percentis e escore-z de crescimento',
  sinonimos: ['percentil', 'z-score', 'curva de crescimento', 'perimetro cefalico', 'imc por idade'],
  resumo: 'Converte medida em escore-z e percentil, com os marcos de crescimento de referência.',
  categorias: ['pediatria', 'nutricao'],
  campos: [
    campoSeg('parametro', 'Parâmetro', [
      { valor: 'peso', rotulo: 'Peso para a idade' },
      { valor: 'estatura', rotulo: 'Estatura para a idade' },
      { valor: 'pc', rotulo: 'Perímetro cefálico' },
      { valor: 'imc', rotulo: 'IMC para a idade' },
    ]),
    campoNum('medida', 'Medida da criança', { min: 0.5, max: 200, passo: 0.1, ajuda: 'kg para peso, cm para estatura e perímetro cefálico, kg/m² para IMC.' }),
    campoNum('mediana', 'Mediana da curva de referência para a idade e o sexo', { min: 0.5, max: 200, passo: 0.1, ajuda: 'Leia o valor do percentil 50 na curva da OMS correspondente.' }),
    campoNum('dp', 'Desvio-padrão da curva', { min: 0.05, max: 30, passo: 0.01, ajuda: 'Diferença entre o percentil 50 e o escore-z de +1 (ou entre −1 e a mediana).' }),
  ],
  calcular: (v) => {
    const medida = num(v, 'medida')
    const mediana = num(v, 'mediana')
    const dp = num(v, 'dp')
    const par = opc(v, 'parametro')
    if (medida === null || mediana === null || dp === null || dp <= 0) return null
    const z = (medida - mediana) / dp
    // Aproximação de Zelen & Severo para a função de distribuição normal padrão.
    const t = 1 / (1 + 0.2316419 * Math.abs(z))
    const d = 0.3989423 * Math.exp((-z * z) / 2)
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    p = z > 0 ? 1 - p : p
    const percentil = p * 100
    const rotulos: Record<string, [string, string, string]> = {
      peso: ['Peso muito baixo para a idade (z < −3)', 'Peso baixo para a idade (z entre −3 e −2)', 'Peso adequado'],
      estatura: ['Estatura muito baixa (z < −3)', 'Estatura baixa (z entre −3 e −2)', 'Estatura adequada'],
      pc: ['Microcefalia (z < −3)', 'Perímetro cefálico abaixo do esperado', 'Perímetro cefálico adequado'],
      imc: ['Magreza acentuada (z < −3)', 'Magreza (z entre −3 e −2)', 'Eutrofia'],
    }
    const r = rotulos[par]
    let classificacao = r[2]
    let nivel: Nivel = 'ok'
    if (z < -3) { classificacao = r[0]; nivel = 'critico' }
    else if (z < -2) { classificacao = r[1]; nivel = 'alerta' }
    else if (par === 'imc' && z > 3) { classificacao = 'Obesidade (z > +3)'; nivel = 'alerta' }
    else if (par === 'imc' && z > 2) { classificacao = 'Sobrepeso (z entre +2 e +3)'; nivel = 'atencao' }
    else if (par === 'pc' && z > 2) { classificacao = 'Macrocefalia (z > +2)'; nivel = 'alerta' }
    return {
      titulo: 'Escore-z',
      valor: `${z >= 0 ? '+' : ''}${fmt(z, 2)}`,
      nivel,
      rotuloNivel: classificacao,
      detalhes: [
        { rotulo: 'Percentil', valor: percentil < 0.1 ? '< 0,1' : percentil > 99.9 ? '> 99,9' : fmt(percentil, 1) },
        { rotulo: 'Diferença para a mediana', valor: `${medida - mediana >= 0 ? '+' : ''}${fmt(medida - mediana, 2)}` },
        { rotulo: 'Correspondências úteis', valor: 'z = −2 → percentil 2,3 · z = −1 → 15,9 · z = 0 → 50 · z = +1 → 84,1 · z = +2 → 97,7' },
      ],
      interpretacao: [
        '**A tendência vale mais que o ponto.** Uma criança consistentemente no percentil 10 desde o nascimento provavelmente é apenas pequena; uma que cai do percentil 50 para o 10 em seis meses tem um problema, mesmo permanecendo dentro da faixa "normal". Sempre plote a curva inteira.',
        '**Marcos de referência úteis:** o peso de nascimento dobra por volta de 4 a 5 meses e triplica com 1 ano; o comprimento aumenta cerca de 25 cm no primeiro ano (de 50 para 75 cm), 12 cm no segundo e 6 a 8 cm por ano até a puberdade; o perímetro cefálico cresce cerca de 2 cm por mês nos primeiros 3 meses, 1 cm por mês de 4 a 6 meses e 0,5 cm por mês de 7 a 12 meses (de 35 cm para 47 cm no primeiro ano).',
        'A **perda de peso fisiológica** do recém-nascido chega a 7 a 10% nos primeiros dias, com recuperação até o 10º ao 14º dia. Perda maior que 10% ou não recuperação até o 14º dia exige avaliação da amamentação.',
        'Use as curvas da **OMS** (2006 e 2007), que são prescritivas — descrevem como crianças em condições ideais **devem** crescer, e não como uma população específica cresce.',
      ],
      alertas: ['Meça corretamente: comprimento deitado até 24 meses (com régua antropométrica e duas pessoas), estatura em pé a partir dos 2 anos. A diferença entre os dois métodos é de cerca de 0,7 cm.'],
    }
  },
  formula: ['Escore-z = (medida − mediana) / desvio-padrão', 'Percentil = função de distribuição normal acumulada do escore-z'],
  fundamento:
    'O escore-z expressa quantos desvios-padrão a medida está da mediana da população de referência. Ele é superior ao percentil nos extremos: entre os percentis 1 e 0,1 há uma diferença clínica enorme que a escala de percentis comprime, enquanto o escore-z continua discriminando (z de −2,3 contra −3,1). Por isso a OMS adota escores-z para classificação nutricional.',
  armadilhas: [
    'A distribuição de peso e IMC é assimétrica, e as curvas oficiais usam o método LMS (com parâmetro de assimetria). A conversão simples aqui é uma aproximação — boa perto da mediana, menos precisa nos extremos.',
    'Prematuros devem ser avaliados por idade corrigida ou por curvas específicas (Fenton, Intergrowth-21st).',
  ],
  referencias: [
    { texto: 'WHO Multicentre Growth Reference Study Group. WHO Child Growth Standards. Acta Paediatr Suppl. 2006;450:1-101.' },
    { texto: 'de Onis M, Onyango AW, Borghi E, et al. Development of a WHO growth reference for school-aged children and adolescents. Bull World Health Organ. 2007;85(9):660-667.' },
  ],
}

const glasgowPed: Ferramenta = {
  id: 'glasgow-pediatrico',
  nome: 'Escala de Coma de Glasgow pediátrica',
  sinonimos: ['glasgow pediatrico', 'coma crianca', 'gcs pediatrico'],
  resumo: 'Adapta os componentes verbal e motor para lactentes e pré-verbais.',
  categorias: ['pediatria', 'neurologia', 'emergencia'],
  campos: [
    campoOpc('ocular', 'Abertura ocular', [
      { valor: '4', rotulo: '4 — espontânea', pontos: 4 },
      { valor: '3', rotulo: '3 — ao som ou à fala', pontos: 3 },
      { valor: '2', rotulo: '2 — à dor', pontos: 2 },
      { valor: '1', rotulo: '1 — ausente', pontos: 1 },
    ]),
    campoOpc('verbal', 'Resposta verbal (adaptada para lactentes)', [
      { valor: '5', rotulo: '5 — balbucia, palavras adequadas, sorri, segue objetos', pontos: 5 },
      { valor: '4', rotulo: '4 — choro consolável, interação reduzida', pontos: 4 },
      { valor: '3', rotulo: '3 — choro inconsolável, gemido à dor', pontos: 3 },
      { valor: '2', rotulo: '2 — agitação, irritabilidade, inquietação', pontos: 2 },
      { valor: '1', rotulo: '1 — ausente', pontos: 1 },
    ]),
    campoOpc('motora', 'Melhor resposta motora', [
      { valor: '6', rotulo: '6 — movimentos espontâneos e propositais', pontos: 6 },
      { valor: '5', rotulo: '5 — retira ao toque / localiza a dor', pontos: 5 },
      { valor: '4', rotulo: '4 — retira à dor', pontos: 4 },
      { valor: '3', rotulo: '3 — flexão anormal (decorticação)', pontos: 3 },
      { valor: '2', rotulo: '2 — extensão anormal (descerebração)', pontos: 2 },
      { valor: '1', rotulo: '1 — ausente', pontos: 1 },
    ]),
  ],
  calcular: (v) => {
    const o = num(v, 'ocular')
    const ve = num(v, 'verbal')
    const m = num(v, 'motora')
    if (o === null || ve === null || m === null) return null
    const total = o + ve + m
    const nivel: Nivel = total <= 8 ? 'critico' : total <= 12 ? 'alerta' : total < 15 ? 'atencao' : 'ok'
    return {
      titulo: 'Glasgow pediátrico',
      valor: String(total),
      unidade: 'de 15',
      nivel,
      rotuloNivel: total <= 8 ? 'Grave' : total <= 12 ? 'Moderado' : 'Leve',
      detalhes: [
        { rotulo: 'Componentes', valor: `O${o} V${ve} M${m}` },
        { rotulo: 'Limiar de via aérea definitiva', valor: '≤ 8', nota: 'Mesmo limiar do adulto, com a ressalva de que a criança dessatura muito mais rápido — pré-oxigene bem.' },
      ],
      interpretacao: [
        'A adaptação pediátrica altera apenas os componentes **verbal** e **motor**, porque o lactente não fala nem obedece a comandos. A abertura ocular é idêntica à do adulto.',
        'Em crianças abaixo de 2 anos, o item verbal se baseia na qualidade do choro e na interação. Choro consolável e interação preservada indicam função cortical mantida.',
        'Como no adulto, registre os três componentes separadamente. E lembre que hipoglicemia, hipóxia, intoxicação e crise convulsiva não convulsiva são causas reversíveis de rebaixamento que devem ser excluídas antes de qualquer conclusão.',
      ],
      alertas: ['A causa mais comum de rebaixamento em criança pequena é infecciosa ou metabólica, não traumática. Glicemia capilar imediata é obrigatória.'],
    }
  },
  formula: ['GCS pediátrico = ocular (1–4) + verbal adaptada (1–5) + motora adaptada (1–6)'],
  fundamento:
    'A escala original de Glasgow pressupõe linguagem e obediência a comandos, o que a torna inaplicável abaixo de 2 anos. A adaptação pediátrica substitui esses marcadores por equivalentes desenvolvimentais: interação social e qualidade do choro no lugar da orientação verbal; movimento espontâneo proposital no lugar da obediência.',
  armadilhas: ['Criança que dorme normalmente pode parecer rebaixada. Avalie com a criança desperta e, se possível, com o cuidador presente para julgar o comportamento habitual.'],
  referencias: [
    { texto: 'Holmes JF, Palchak MJ, MacFarlane T, Kuppermann N. Performance of the pediatric Glasgow Coma Scale in children with blunt head trauma. Acad Emerg Med. 2005;12(9):814-819.' },
  ],
}

const bronquiolite: Ferramenta = {
  id: 'gravidade-bronquiolite',
  nome: 'Escore de gravidade da bronquiolite',
  sinonimos: ['bronquiolite', 'vsr', 'sibilancia lactente', 'wang'],
  resumo: 'Gradua a bronquiolite aguda e orienta a decisão de internar.',
  categorias: ['pediatria'],
  campos: [
    campoOpc('fr', 'Frequência respiratória', [
      { valor: '0', rotulo: '0 — abaixo de 30 irpm', pontos: 0 },
      { valor: '1', rotulo: '1 — 31 a 45 irpm', pontos: 1 },
      { valor: '2', rotulo: '2 — 46 a 60 irpm', pontos: 2 },
      { valor: '3', rotulo: '3 — acima de 60 irpm', pontos: 3 },
    ]),
    campoOpc('sibilos', 'Sibilância', [
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
      { valor: '1', rotulo: '1 — apenas no fim da expiração ou com estetoscópio', pontos: 1 },
      { valor: '2', rotulo: '2 — em toda a expiração ou audível na expiração sem estetoscópio', pontos: 2 },
      { valor: '3', rotulo: '3 — inspiratória e expiratória, audível sem estetoscópio', pontos: 3 },
    ]),
    campoOpc('retracao', 'Retração', [
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
      { valor: '1', rotulo: '1 — intercostal apenas', pontos: 1 },
      { valor: '2', rotulo: '2 — intercostal e supraclavicular', pontos: 2 },
      { valor: '3', rotulo: '3 — intercostal, supraclavicular e batimento de aletas nasais', pontos: 3 },
    ]),
    campoOpc('estado', 'Estado geral', [
      { valor: '0', rotulo: '0 — normal', pontos: 0 },
      { valor: '3', rotulo: '3 — irritado, letárgico ou com dificuldade alimentar', pontos: 3 },
    ]),
    campoNum('spo2', 'SpO₂ em ar ambiente', { unidade: '%', min: 60, max: 100, passo: 1 }),
    campoNum('idadeMeses', 'Idade', { unidade: 'meses', min: 0, max: 24, passo: 0.5 }),
    campoSimNao('apneia', 'Episódios de apneia', 1),
    campoSimNao('comorbidade', 'Prematuridade, cardiopatia, pneumopatia crônica ou imunodeficiência', 1),
  ],
  calcular: (v) => {
    const ids = ['fr', 'sibilos', 'retracao', 'estado']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const spo2 = num(v, 'spo2')
    const idade = num(v, 'idadeMeses')
    if (spo2 === null || idade === null) return null
    const faixa = total <= 3 ? 0 : total <= 7 ? 1 : 2
    const internar = spo2 < 90 || total >= 8 || sim(v, 'apneia') || (idade < 3 && total >= 5) || (sim(v, 'comorbidade') && total >= 5)
    return {
      titulo: 'Gravidade da bronquiolite',
      valor: String(total),
      unidade: 'de 12 pontos',
      nivel: internar ? 'critico' : (['ok', 'alerta', 'critico'] as Nivel[])[faixa],
      rotuloNivel: ['Leve', 'Moderada', 'Grave'][faixa],
      detalhes: [
        { rotulo: 'SpO₂', valor: fmtPct(spo2, 0), nota: 'Abaixo de 90 a 92% em ar ambiente é indicação de oxigenoterapia e de internação na maioria dos protocolos.', nivel: spo2 < 90 ? 'critico' : spo2 < 92 ? 'alerta' : 'ok' },
        { rotulo: 'Apneia', valor: sim(v, 'apneia') ? 'Presente' : 'Ausente', nota: 'Apneia é indicação de internação independentemente do escore, sobretudo abaixo de 2 meses.', nivel: sim(v, 'apneia') ? 'critico' : 'ok' },
        { rotulo: 'Decisão sugerida', valor: internar ? 'Internação' : 'Observação e possível alta', nivel: internar ? 'critico' : 'ok' },
      ],
      interpretacao: [
        '**O tratamento da bronquiolite é de suporte, e a lista do que NÃO fazer é mais longa que a do que fazer.** Não há benefício demonstrado para broncodilatador (nem beta-agonista, nem adrenalina inalatória em uso rotineiro), corticoide sistêmico ou inalatório, antibiótico sem infecção bacteriana documentada, fisioterapia respiratória, ou antileucotrieno.',
        '**O que funciona:** oxigênio se saturação abaixo de 90 a 92%, hidratação (oral, por sonda ou endovenosa), aspiração nasal superficial de secreções, e suporte respiratório escalonado (cateter nasal de alto fluxo ou CPAP) nos casos graves.',
        'A **solução salina hipertônica a 3%** inalatória tem evidência conflitante; pode reduzir marginalmente o tempo de internação em pacientes já hospitalizados, mas não é recomendada de rotina na emergência.',
        '**Critérios de internação:** saturação persistentemente abaixo de 90 a 92%, apneia, desconforto respiratório significativo, incapacidade de manter hidratação por via oral, idade abaixo de 2 a 3 meses, comorbidade relevante e condições sociais que impeçam o retorno.',
        'Prevenção: **palivizumabe** para grupos de alto risco conforme protocolo, e o anticorpo monoclonal de meia-vida estendida **nirsevimabe**, que ampliou a proteção para lactentes saudáveis em vários países.',
      ],
      alertas: ['Bronquiolite em lactente abaixo de 2 meses tem risco aumentado de apneia, que pode ser a primeira manifestação. Considere monitorização mesmo em quadros aparentemente leves.'],
    }
  },
  formula: ['Soma de 4 domínios clínicos (0 a 12 pontos), integrada à saturação, idade e comorbidades'],
  fundamento:
    'A bronquiolite é uma inflamação e obstrução das pequenas vias aéreas, sobretudo pelo vírus sincicial respiratório. A obstrução é por edema, muco e debris celulares — não por broncoespasmo —, e é essa diferença fisiopatológica em relação à asma que explica a falha consistente dos broncodilatadores nos ensaios clínicos.',
  armadilhas: [
    'A saturação oscila muito, sobretudo durante o sono e a alimentação. Uma leitura isolada baixa não obriga internação se a criança está bem e a leitura se recupera.',
    'Radiografia de tórax de rotina não é recomendada: aumenta prescrição de antibiótico sem melhorar desfecho.',
  ],
  referencias: [
    { texto: 'Ralston SL, Lieberthal AS, Meissner HC, et al. Clinical practice guideline: the diagnosis, management, and prevention of bronchiolitis. Pediatrics. 2014;134(5):e1474-e1502.' },
    { texto: 'Wang EE, Milner RA, Navas L, Maj H. Observer agreement for respiratory signs and oximetry in infants hospitalized with lower respiratory infections. Am Rev Respir Dis. 1992;145(1):106-109.' },
  ],
}

const anestesicoLocal: Ferramenta = {
  id: 'dose-maxima-anestesico-local',
  nome: 'Dose máxima de anestésico local',
  sinonimos: ['lidocaina', 'bupivacaina', 'anestesico local', 'intoxicacao por anestesico', 'lipid rescue'],
  resumo: 'Calcula a dose máxima segura em mg e em mL, e resume o tratamento da intoxicação.',
  categorias: ['pediatria', 'emergencia', 'cirurgia', 'farmacologia'],
  campos: [
    campoPeso({ min: 1, max: 200 }),
    campoOpc('farmaco', 'Anestésico', [
      { valor: 'lidocaina', rotulo: 'Lidocaína' },
      { valor: 'bupivacaina', rotulo: 'Bupivacaína' },
      { valor: 'ropivacaina', rotulo: 'Ropivacaína' },
      { valor: 'mepivacaina', rotulo: 'Mepivacaína' },
      { valor: 'prilocaina', rotulo: 'Prilocaína' },
    ]),
    campoSeg('vaso', 'Com vasoconstritor (adrenalina)', [
      { valor: 'nao', rotulo: 'Não' },
      { valor: 'sim', rotulo: 'Sim' },
    ]),
    campoNum('concentracao', 'Concentração da solução', { unidade: '%', min: 0.125, max: 5, passo: 0.125, padrao: '1', ajuda: 'Uma solução a 1% contém 10 mg/mL; a 2%, 20 mg/mL; a 0,5%, 5 mg/mL.' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const conc = num(v, 'concentracao')
    const farmaco = opc(v, 'farmaco')
    const comVaso = sim(v, 'vaso')
    if (peso === null || conc === null || conc <= 0) return null
    const doses: Record<string, { sem: number; com: number; nome: string; obs: string }> = {
      lidocaina: { sem: 4.5, com: 7, nome: 'Lidocaína', obs: 'Início rápido (2 a 5 min), duração de 1 a 2 h (até 3 a 4 h com vasoconstritor). É o anestésico local mais usado e o de menor toxicidade cardíaca entre os de duração intermediária.' },
      bupivacaina: { sem: 2, com: 3, nome: 'Bupivacaína', obs: '**A mais cardiotóxica.** Alta afinidade pelos canais de sódio do miocárdio, com dissociação lenta — a parada cardíaca por bupivacaína é notoriamente refratária. Duração longa (4 a 8 h).' },
      ropivacaina: { sem: 3, com: 3.5, nome: 'Ropivacaína', obs: 'Isômero levógiro puro, com menor cardiotoxicidade que a bupivacaína e maior bloqueio sensitivo relativo ao motor. Duração longa.' },
      mepivacaina: { sem: 5, com: 7, nome: 'Mepivacaína', obs: 'Perfil semelhante ao da lidocaína, com duração discretamente maior.' },
      prilocaina: { sem: 6, com: 8, nome: 'Prilocaína', obs: 'Risco de metemoglobinemia acima de 600 mg no adulto — evitar em lactentes abaixo de 6 meses e em portadores de deficiência de glicose-6-fosfato desidrogenase. O tratamento é azul de metileno.' },
    }
    const d = doses[farmaco]
    const mgkg = comVaso ? d.com : d.sem
    const doseMax = peso * mgkg
    const mgPorMl = conc * 10
    const volumeMax = doseMax / mgPorMl
    return {
      titulo: `Dose máxima de ${d.nome.toLowerCase()}`,
      valor: fmtLivre(doseMax, 1),
      unidade: 'mg',
      nivel: 'alerta',
      rotuloNivel: `${fmt(mgkg, 1)} mg/kg ${comVaso ? 'com' : 'sem'} vasoconstritor`,
      detalhes: [
        { rotulo: 'Concentração da solução', valor: `${fmt(conc, 3)}% = ${fmt(mgPorMl, 1)} mg/mL` },
        { rotulo: 'Volume máximo', valor: `${fmtLivre(volumeMax, 1)} mL`, nivel: 'alerta' },
        { rotulo: 'Dose máxima sem vasoconstritor', valor: `${fmtLivre(peso * d.sem, 1)} mg (${fmtLivre((peso * d.sem) / mgPorMl, 1)} mL)` },
        { rotulo: 'Dose máxima com vasoconstritor', valor: `${fmtLivre(peso * d.com, 1)} mg (${fmtLivre((peso * d.com) / mgPorMl, 1)} mL)` },
        { rotulo: 'Características', valor: d.obs },
      ],
      interpretacao: [
        'O vasoconstritor eleva a dose máxima porque reduz a absorção sistêmica, prolonga o efeito e melhora a hemostasia local. **A antiga proibição de adrenalina em extremidades ("dedos, nariz, orelhas, pênis") foi refutada** — não há caso documentado de necrose digital com soluções comerciais diluídas, e revisões sistemáticas apoiam o uso.',
        '**A velocidade de absorção depende do sítio**, e isso muda o risco com a mesma dose. Em ordem decrescente: intravenoso > traqueal > intercostal > caudal > paracervical > epidural > plexo braquial > ciático > subcutâneo.',
        '**Sinais de intoxicação sistêmica**, em ordem de aparecimento: gosto metálico, dormência perioral, zumbido, tontura, alterações visuais, disartria, fasciculações, convulsão; depois depressão do sistema nervoso central, e por fim toxicidade cardíaca — bradicardia, bloqueios, alargamento do QRS, arritmias ventriculares e assistolia.',
        '**Tratamento da intoxicação sistêmica:** parar a injeção imediatamente; via aérea e oxigênio a 100%; benzodiazepínico para convulsão (evitar propofol em dose alta se houver instabilidade); e **emulsão lipídica a 20%** — bolus de 1,5 mL/kg em 1 minuto, seguido de infusão de 0,25 mL/kg/min, repetindo o bolus até duas vezes se persistir instabilidade, com dose total máxima em torno de 12 mL/kg. Na parada cardíaca, use adrenalina em doses reduzidas (≤ 1 µg/kg) e **evite** vasopressina, bloqueadores de canal de cálcio, betabloqueadores e anestésicos locais.',
      ],
      alertas: [
        'Aspire antes de cada injeção e injete de forma fracionada e lenta, com contato verbal contínuo com o paciente.',
        'Tenha emulsão lipídica a 20% disponível em qualquer local onde se façam bloqueios com anestésico local em volume significativo.',
      ],
    }
  },
  formula: [
    'Dose máxima (mg) = peso (kg) × dose máxima (mg/kg)',
    'Concentração: solução a X% = X × 10 mg/mL',
    'Volume máximo (mL) = dose máxima (mg) ÷ concentração (mg/mL)',
  ],
  fundamento:
    'Os anestésicos locais bloqueiam canais de sódio voltagem-dependentes, impedindo a propagação do potencial de ação. A toxicidade sistêmica ocorre quando a concentração plasmática atinge os mesmos canais no sistema nervoso central e no miocárdio. A bupivacaína é a mais perigosa porque se liga aos canais cardíacos com alta afinidade e se dissocia lentamente — permanece bloqueando durante a diástole, quando os demais já se desligaram.',
  armadilhas: [
    'As doses máximas são orientativas e derivadas de infiltração subcutânea. Em sítios de absorção rápida, o risco é maior com a mesma dose.',
    'A conversão percentual é a fonte mais comum de erro grave: 2% são 20 mg/mL, não 2 mg/mL. Um erro de dez vezes nessa conta é potencialmente fatal.',
  ],
  referencias: [
    { texto: 'Neal JM, Neal EJ, Weinberg GL. American Society of Regional Anesthesia and Pain Medicine local anesthetic systemic toxicity checklist: 2020 version. Reg Anesth Pain Med. 2021;46(1):81-82.' },
    { texto: 'Ilfeld BM, Häuser N, Gadsden J. Local anesthetic systemic toxicity. Anesthesiology Clin. 2020;38(1):17-31.' },
  ],
}

export const ferramentas: Ferramenta[] = [
  dosePediatrica,
  hidratacao,
  desidratacaoEscore,
  pesoEstimado,
  apgar,
  capurro,
  ballard,
  silverman,
  fototerapia,
  idadeCorrigida,
  percentis,
  glasgowPed,
  bronquiolite,
  anestesicoLocal,
]

export default ferramentas
