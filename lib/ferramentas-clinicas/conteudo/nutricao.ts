import type { Ferramenta, Nivel, Resultado, Valores } from '../tipos'
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
  fmtLivre,
  fmtPct,
  imc as calcImc,
  num,
  numOu,
  opc,
  sim,
  somaSimNao,
} from '../helpers'

const gastoEnergetico: Ferramenta = {
  id: 'gasto-energetico',
  nome: 'Gasto energético: Harris-Benedict, Mifflin-St Jeor e Penn State',
  sinonimos: ['gasto energetico', 'harris benedict', 'mifflin', 'penn state', 'necessidade calorica', 'taxa metabolica basal', 'get'],
  resumo: 'Calcula a taxa metabólica basal pelas equações consagradas e o gasto total pelo fator de atividade.',
  categorias: ['nutricao', 'endocrinologia'],
  campos: [
    campoPeso(),
    campoAltura(),
    campoIdade({ min: 15 }),
    campoSexo(),
    campoOpc('atividade', 'Fator de atividade', [
      { valor: '1.2', rotulo: 'Sedentário — pouco ou nenhum exercício', pontos: 0 },
      { valor: '1.375', rotulo: 'Levemente ativo — exercício leve 1 a 3 dias por semana', pontos: 0 },
      { valor: '1.55', rotulo: 'Moderadamente ativo — exercício moderado 3 a 5 dias', pontos: 0 },
      { valor: '1.725', rotulo: 'Muito ativo — exercício intenso 6 a 7 dias', pontos: 0 },
      { valor: '1.9', rotulo: 'Extremamente ativo — trabalho físico pesado ou atleta', pontos: 0 },
    ]),
    campoSeg('contexto', 'Contexto', [
      { valor: 'ambulatorial', rotulo: 'Ambulatorial / saudável' },
      { valor: 'hospitalizado', rotulo: 'Hospitalizado' },
      { valor: 'ventilado', rotulo: 'Crítico em ventilação mecânica' },
    ]),
    campoNum('temperaturaMax', 'Temperatura máxima nas últimas 24 h', { unidade: '°C', min: 34, max: 43, passo: 0.1, padrao: '37', mostrarSe: (v) => opc(v, 'contexto') === 'ventilado' }),
    campoNum('volumeMinuto', 'Volume-minuto do ventilador', { unidade: 'L/min', min: 2, max: 30, passo: 0.1, padrao: '8', mostrarSe: (v) => opc(v, 'contexto') === 'ventilado' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const altura = num(v, 'altura')
    const idade = num(v, 'idade')
    const fator = Number(opc(v, 'atividade') || '1.2')
    if (peso === null || altura === null || idade === null) return null
    const f = opc(v, 'sexo') === 'f'
    const bmi = calcImc(peso, altura)
    const harrisRevisada = f ? 447.593 + 9.247 * peso + 3.098 * altura - 4.33 * idade : 88.362 + 13.397 * peso + 4.799 * altura - 5.677 * idade
    const harrisOriginal = f ? 655.1 + 9.563 * peso + 1.85 * altura - 4.676 * idade : 66.5 + 13.75 * peso + 5.003 * altura - 6.775 * idade
    const mifflin = 10 * peso + 6.25 * altura - 5 * idade + (f ? -161 : 5)
    const contexto = opc(v, 'contexto')
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Mifflin-St Jeor (recomendada)', valor: `${fmtInt(mifflin)} kcal/dia`, nota: 'É a equação com melhor acurácia em adultos saudáveis e com sobrepeso, e a recomendada pela Academy of Nutrition and Dietetics.' },
      { rotulo: 'Harris-Benedict revisada (1984)', valor: `${fmtInt(harrisRevisada)} kcal/dia`, nota: 'Versão de Roza e Shizgal, mais acurada que a original.' },
      { rotulo: 'Harris-Benedict original (1919)', valor: `${fmtInt(harrisOriginal)} kcal/dia`, nota: 'Superestima em cerca de 5 a 15% nas populações contemporâneas.' },
      { rotulo: 'Regra de bolso', valor: `${fmtInt(peso * 25)} a ${fmtInt(peso * 30)} kcal/dia`, nota: '25 a 30 kcal/kg/dia. Simples, e nas populações estudadas não é pior do que as equações.' },
    ]
    let principal = mifflin * fator
    let rotuloPrincipal = 'Gasto energético total'
    if (contexto === 'ventilado') {
      const tmax = numOu(v, 'temperaturaMax', 37)
      const ve = numOu(v, 'volumeMinuto', 8)
      const pennState = mifflin * 0.96 + tmax * 167 + ve * 31 - 6212
      const pennModificada = mifflin * 0.71 + tmax * 85 + ve * 64 - 3085
      const usarModificada = bmi >= 30 && idade >= 60
      principal = usarModificada ? pennModificada : pennState
      rotuloPrincipal = 'Gasto energético em repouso (Penn State)'
      detalhes.push({ rotulo: 'Penn State 2003b', valor: `${fmtInt(pennState)} kcal/dia`, nota: 'Mifflin × 0,96 + temperatura máxima × 167 + volume-minuto × 31 − 6212. Validada em pacientes ventilados.' })
      detalhes.push({ rotulo: 'Penn State modificada', valor: `${fmtInt(pennModificada)} kcal/dia`, nota: 'Para obesos com 60 anos ou mais. Usada aqui: ' + (usarModificada ? 'sim' : 'não') })
      detalhes.push({ rotulo: 'Meta na fase aguda', valor: `${fmtInt(principal * 0.7)} kcal/dia`, nota: 'As diretrizes recomendam **não** atingir a meta plena nos primeiros 3 a 7 dias: nutrição hipocalórica progressiva (70% da meta ou menos) evita a síndrome de superalimentação num período em que há produção endógena substancial de energia.', nivel: 'alerta' })
    } else if (contexto === 'hospitalizado') {
      principal = mifflin * 1.2
      rotuloPrincipal = 'Necessidade estimada (fator de estresse 1,2)'
      detalhes.push({ rotulo: 'Fatores de estresse típicos', valor: 'Cirurgia eletiva 1,0 a 1,1 · infecção 1,2 a 1,4 · trauma 1,2 a 1,4 · sepse 1,2 a 1,5 · queimadura extensa 1,5 a 2,0', nota: 'Os fatores clássicos de Long superestimam sistematicamente com o cuidado moderno (sedação, ventilação, controle da dor e da febre).' })
    }
    detalhes.unshift({ rotulo: 'IMC', valor: `${fmt(bmi, 1)} kg/m²` })
    return {
      titulo: rotuloPrincipal,
      valor: fmtInt(principal),
      unidade: 'kcal/dia',
      nivel: 'neutro',
      rotuloNivel: `${fmtInt(principal / peso)} kcal/kg/dia`,
      detalhes,
      interpretacao: [
        '**A calorimetria indireta é o padrão-ouro** e é o método recomendado pelas diretrizes de nutrição em terapia intensiva quando disponível. Todas as equações preditivas têm erro considerável no paciente individual: acertam dentro de 10% do valor medido em apenas metade a dois terços dos casos.',
        'Em obesidade, calcular sobre o **peso real** superestima e sobre o **peso ideal** subestima. As alternativas são usar peso ajustado ou adotar a estratégia de **nutrição hipocalórica hiperproteica**: 11 a 14 kcal/kg de peso real (ou 22 a 25 kcal/kg de peso ideal) com 2,0 a 2,5 g/kg de peso ideal de proteína.',
        '**Superalimentação é tão prejudicial quanto subnutrição:** hiperglicemia, esteatose hepática, retenção de CO₂ com dificuldade de desmame, azotemia e sobrecarga hídrica. No paciente crítico, o consenso migrou para metas mais conservadoras na primeira semana.',
        'O gasto energético total é a soma de três componentes: **taxa metabólica basal** (60 a 70%), **efeito térmico dos alimentos** (cerca de 10%) e **atividade física** (20 a 30%, o componente mais variável).',
      ],
      alertas: ['Reavalie a meta periodicamente. O gasto energético muda com a evolução clínica — sobe na fase de recuperação e cai com a sedação profunda e o bloqueio neuromuscular.'],
    }
  },
  formula: [
    'Mifflin-St Jeor: TMB = 10×peso + 6,25×altura − 5×idade + 5 (♂) ou − 161 (♀)',
    'Harris-Benedict revisada ♂: 88,362 + 13,397×P + 4,799×A − 5,677×I',
    'Harris-Benedict revisada ♀: 447,593 + 9,247×P + 3,098×A − 4,330×I',
    'Penn State 2003b: Mifflin×0,96 + Tmáx×167 + VE×31 − 6212',
  ],
  fundamento:
    'A taxa metabólica basal correlaciona-se sobretudo com a **massa magra**, que consome muito mais energia por quilo do que o tecido adiposo. Como as equações usam peso total, elas superestimam em obesos e subestimam em pessoas muito musculosas. A equação de Penn State acrescenta duas variáveis que captam o hipermetabolismo do paciente crítico: a temperatura (cada grau eleva o metabolismo em cerca de 10%) e o volume-minuto, que funciona como marcador indireto da produção de CO₂ e, portanto, da taxa metabólica.',
  armadilhas: [
    'Não use as equações em amputados, gestantes, pessoas com ascite ou edema importante, nem em crianças.',
    'Os fatores de estresse tradicionais foram derivados nos anos 1970 e 1980, antes da sedação e do controle metabólico modernos. Aplicá-los integralmente hoje resulta em superalimentação sistemática.',
  ],
  referencias: [
    { texto: 'Mifflin MD, St Jeor ST, Hill LA, et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241-247.' },
    { texto: 'Frankenfield DC, Coleman A, Alam S, Cooney RN. Analysis of estimation methods for resting metabolic rate in critically ill adults. JPEN J Parenter Enteral Nutr. 2009;33(1):27-36.' },
    { texto: 'Singer P, Blaser AR, Berger MM, et al. ESPEN guideline on clinical nutrition in the intensive care unit. Clin Nutr. 2019;38(1):48-79.' },
  ],
}

const proteina: Ferramenta = {
  id: 'proteina-diaria',
  nome: 'Necessidade proteica e distribuição de macronutrientes',
  sinonimos: ['proteina', 'macronutrientes', 'g/kg proteina', 'distribuicao de macros', 'carboidrato lipideo'],
  resumo: 'Define a meta proteica por condição clínica e distribui as calorias entre os macronutrientes.',
  categorias: ['nutricao'],
  campos: [
    campoPeso(),
    campoAltura({ opcional: true, ajuda: 'Permite calcular peso ideal e ajustado, usados em obesidade.' }),
    campoSexo(),
    campoOpc('condicao', 'Condição clínica', [
      { valor: 'saudavel', rotulo: 'Adulto saudável', pontos: 0 },
      { valor: 'idoso', rotulo: 'Idoso saudável ou com sarcopenia', pontos: 0 },
      { valor: 'hospitalizado', rotulo: 'Hospitalizado não crítico', pontos: 0 },
      { valor: 'critico', rotulo: 'Paciente crítico', pontos: 0 },
      { valor: 'queimado', rotulo: 'Queimadura extensa ou politrauma', pontos: 0 },
      { valor: 'drcConservador', rotulo: 'Doença renal crônica em tratamento conservador', pontos: 0 },
      { valor: 'dialise', rotulo: 'Diálise', pontos: 0 },
      { valor: 'hepatopatia', rotulo: 'Cirrose', pontos: 0 },
      { valor: 'obesidadeCritico', rotulo: 'Obesidade em paciente crítico', pontos: 0 },
    ]),
    campoNum('calorias', 'Meta calórica diária', { unidade: 'kcal', min: 500, max: 5000, passo: 50, padrao: '2000' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const altura = num(v, 'altura')
    const calorias = numOu(v, 'calorias', 2000)
    const cond = opc(v, 'condicao')
    if (peso === null) return null
    const f = opc(v, 'sexo') === 'f'
    const pesoIdeal = altura !== null ? (f ? 45.5 : 50) + 0.91 * (altura - 152.4) : null
    const metas: Record<string, { min: number; max: number; base: 'real' | 'ideal'; nota: string }> = {
      saudavel: { min: 0.8, max: 1.2, base: 'real', nota: 'A recomendação clássica de 0,8 g/kg/dia é o mínimo para evitar balanço negativo, não o ideal. Faixas de 1,0 a 1,2 são associadas a melhor preservação de massa magra.' },
      idoso: { min: 1.0, max: 1.5, base: 'real', nota: 'O idoso tem **resistência anabólica**: precisa de mais proteína por refeição (25 a 30 g, com 2,5 a 3 g de leucina) para estimular a síntese proteica muscular. Distribua ao longo do dia, não concentre no jantar.' },
      hospitalizado: { min: 1.2, max: 1.5, base: 'real', nota: 'A doença aguda aumenta o catabolismo proteico mesmo com aporte calórico adequado.' },
      critico: { min: 1.2, max: 2.0, base: 'real', nota: 'Faixa recomendada pelas diretrizes. **A evidência de benefício de metas altas é conflitante**: o ensaio EFFORT Protein não mostrou benefício de 2,2 g/kg contra 1,2 g/kg, e sugeriu dano no subgrupo com lesão renal aguda e disfunção orgânica grave.' },
      queimado: { min: 1.5, max: 2.0, base: 'real', nota: 'Perda proteica pela ferida e catabolismo extremo. Em queimaduras muito extensas, algumas diretrizes chegam a 2,5 g/kg/dia.' },
      drcConservador: { min: 0.6, max: 0.8, base: 'ideal', nota: '**Restrição proteica** retarda a progressão e reduz sintomas urêmicos. Exige acompanhamento nutricional para evitar desnutrição — a combinação de restrição sem supervisão é perigosa.' },
      dialise: { min: 1.0, max: 1.4, base: 'ideal', nota: 'A diálise **aumenta** a necessidade proteica pela perda de aminoácidos no dialisato — 6 a 12 g por sessão de hemodiálise.' },
      hepatopatia: { min: 1.2, max: 1.5, base: 'real', nota: '**A restrição proteica na encefalopatia hepática foi abandonada.** Ela piora o catabolismo muscular, e o músculo é o principal sítio extra-hepático de metabolização de amônia. Mantenha o aporte pleno e trate a encefalopatia com lactulose e rifaximina.' },
      obesidadeCritico: { min: 2.0, max: 2.5, base: 'ideal', nota: 'Estratégia hipocalórica hiperproteica: 11 a 14 kcal/kg de peso real com 2,0 a 2,5 g/kg de **peso ideal** de proteína.' },
    }
    const meta = metas[cond]
    const pesoBase = meta.base === 'ideal' && pesoIdeal !== null ? pesoIdeal : peso
    const proteinaMin = pesoBase * meta.min
    const proteinaMax = pesoBase * meta.max
    const proteinaMedia = (proteinaMin + proteinaMax) / 2
    const kcalProteina = proteinaMedia * 4
    const pctProteina = (kcalProteina / calorias) * 100
    const kcalRestante = calorias - kcalProteina
    const kcalCarbo = kcalRestante * 0.6
    const kcalLipideo = kcalRestante * 0.4
    return {
      titulo: 'Meta proteica diária',
      valor: `${fmtInt(proteinaMin)} a ${fmtInt(proteinaMax)}`,
      unidade: 'g/dia',
      nivel: 'neutro',
      rotuloNivel: `${fmt(meta.min, 1)} a ${fmt(meta.max, 1)} g/kg de peso ${meta.base === 'ideal' ? 'ideal' : 'real'}`,
      detalhes: [
        { rotulo: 'Peso usado no cálculo', valor: `${fmt(pesoBase, 1)} kg`, nota: meta.base === 'ideal' ? (pesoIdeal !== null ? 'Peso ideal (fórmula de Devine).' : '⚠ Altura não informada — usado o peso real, o que pode superestimar.') : 'Peso real.' },
        { rotulo: 'Proteína em gramas', valor: `${fmtInt(proteinaMin)} a ${fmtInt(proteinaMax)} g/dia` },
        { rotulo: 'Calorias proteicas', valor: `${fmtInt(kcalProteina)} kcal (${fmt(pctProteina, 0)}% do total)`, nota: '1 g de proteína = 4 kcal.' },
        { rotulo: 'Carboidrato (60% do restante)', valor: `${fmtInt(kcalCarbo / 4)} g = ${fmtInt(kcalCarbo)} kcal`, nota: '1 g = 4 kcal. Limite a oferta a 4 a 5 mg/kg/min no paciente crítico — acima disso predomina a lipogênese, com esteatose e produção excessiva de CO₂.' },
        { rotulo: 'Lipídio (40% do restante)', valor: `${fmtInt(kcalLipideo / 9)} g = ${fmtInt(kcalLipideo)} kcal`, nota: '1 g = 9 kcal. Limite de 1 a 1,5 g/kg/dia em nutrição parenteral.' },
        { rotulo: 'Relação caloria não proteica / nitrogênio', valor: `${fmtInt((kcalCarbo + kcalLipideo) / (proteinaMedia / 6.25))}:1`, nota: 'Referência 100:1 a 150:1 no paciente crítico; 150:1 a 200:1 em estresse leve. Relação baixa demais significa proteína usada como fonte de energia, e não para síntese.' },
      ],
      interpretacao: [
        meta.nota,
        '**A proteína só vira músculo se houver energia suficiente.** Aporte proteico alto com déficit calórico faz o organismo oxidar os aminoácidos para produzir energia — daí a importância da relação entre calorias não proteicas e nitrogênio.',
        '1 g de nitrogênio corresponde a **6,25 g de proteína**, porque as proteínas contêm em média 16% de nitrogênio.',
        '**A distribuição de macronutrientes ao longo do dia importa**, sobretudo no idoso: 25 a 30 g de proteína por refeição são necessários para ultrapassar o limiar anabólico. Uma dieta com 90 g/dia concentrados no jantar estimula menos síntese muscular do que os mesmos 90 g divididos em três refeições.',
        '**Álcool fornece 7 kcal/g** e deve ser contabilizado em pacientes com consumo relevante — é energia sem valor nutricional.',
      ],
    }
  },
  formula: [
    'Proteína (g/dia) = peso (kg) × meta (g/kg/dia)',
    'Nitrogênio (g) = proteína (g) ÷ 6,25',
    'Carboidrato e proteína: 4 kcal/g · Lipídio: 9 kcal/g · Álcool: 7 kcal/g',
  ],
  fundamento:
    'A necessidade proteica reflete o equilíbrio entre síntese e degradação. Na doença aguda, a degradação muscular aumenta muito por ação de citocinas, cortisol e catecolaminas, e a síntese fica relativamente resistente ao estímulo dos aminoácidos — a "resistência anabólica". É por isso que a oferta proteica precisa ser maior no doente do que no saudável, e por isso que ela não impede completamente a perda de massa magra na fase aguda.',
  armadilhas: [
    'Restrição proteica na cirrose e na encefalopatia hepática é prática antiga, refutada e prejudicial.',
    'Em lesão renal aguda **com** terapia renal substitutiva, não restrinja proteína: a diálise remove aminoácidos e a necessidade é maior, não menor.',
  ],
  referencias: [
    { texto: 'Singer P, Blaser AR, Berger MM, et al. ESPEN guideline on clinical nutrition in the intensive care unit. Clin Nutr. 2019;38(1):48-79.' },
    { texto: 'Heyland DK, Patel J, Compher C, et al. The effect of higher protein dosing in critically ill patients (EFFORT Protein). Lancet. 2023;401(10376):568-576.' },
    { texto: 'Bauer J, Biolo G, Cederholm T, et al. Evidence-based recommendations for optimal dietary protein intake in older people (PROT-AGE). J Am Med Dir Assoc. 2013;14(8):542-559.' },
  ],
}

const hidrica: Ferramenta = {
  id: 'necessidade-hidrica',
  nome: 'Necessidade hídrica diária',
  sinonimos: ['necessidade hidrica', 'agua por dia', 'hidratacao adulto'],
  resumo: 'Estima a necessidade de água por três métodos e ajusta pelas perdas.',
  categorias: ['nutricao'],
  campos: [
    campoPeso(),
    campoIdade({ min: 1 }),
    campoNum('calorias', 'Aporte calórico diário', { unidade: 'kcal', min: 400, max: 5000, passo: 50, padrao: '2000' }),
    campoNum('temperatura', 'Temperatura corporal', { unidade: '°C', min: 34, max: 43, passo: 0.1, padrao: '37' }),
    campoNum('perdasExtras', 'Perdas adicionais estimadas', { unidade: 'mL/dia', min: 0, max: 5000, passo: 50, padrao: '0', ajuda: 'Drenos, fístulas, diarreia, vômitos, sudorese profusa, feridas extensas, poliúria.' }),
    campoSeg('restricao', 'Há restrição hídrica', [
      { valor: 'nao', rotulo: 'Não' },
      { valor: 'sim', rotulo: 'Sim (insuficiência cardíaca, hiponatremia, doença renal)' },
    ]),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const idade = num(v, 'idade')
    const calorias = numOu(v, 'calorias', 2000)
    const temp = numOu(v, 'temperatura', 37)
    const extras = numOu(v, 'perdasExtras', 0)
    if (peso === null || idade === null) return null
    const porKg = idade >= 65 ? 25 : idade >= 55 ? 30 : 35
    const metodoPeso = peso * porKg
    const metodoCaloria = calorias * 1
    let holliday = 0
    if (peso <= 10) holliday = peso * 100
    else if (peso <= 20) holliday = 1000 + (peso - 10) * 50
    else holliday = 1500 + (peso - 20) * 20
    const febre = temp > 37.5 ? (temp - 37) * 0.12 * metodoPeso : 0
    const total = metodoPeso + febre + extras
    const restricao = sim(v, 'restricao')
    return {
      titulo: 'Necessidade hídrica estimada',
      valor: fmtInt(total),
      unidade: 'mL/dia',
      nivel: restricao ? 'alerta' : 'neutro',
      rotuloNivel: restricao ? 'Restrição hídrica indicada — reavalie o alvo' : `${fmtInt(total / peso)} mL/kg/dia`,
      detalhes: [
        { rotulo: 'Método por peso', valor: `${fmtInt(metodoPeso)} mL/dia`, nota: `${porKg} mL/kg/dia — ${idade >= 65 ? '25 mL/kg em idosos acima de 65 anos' : idade >= 55 ? '30 mL/kg entre 55 e 65 anos' : '35 mL/kg em adultos jovens'}.` },
        { rotulo: 'Método por caloria', valor: `${fmtInt(metodoCaloria)} mL/dia`, nota: '1 mL por quilocaloria ingerida. Reflete a relação fisiológica entre metabolismo e necessidade de água.' },
        { rotulo: 'Método de Holliday-Segar', valor: `${fmtInt(holliday)} mL/dia`, nota: 'Aplicável em pediatria e em adultos de baixo peso.' },
        { rotulo: 'Acréscimo por febre', valor: `${fmtInt(febre)} mL/dia`, nota: 'Aproximadamente 10 a 12% de acréscimo para cada grau acima de 37 °C.' },
        { rotulo: 'Perdas adicionais informadas', valor: `${fmtInt(extras)} mL/dia` },
        { rotulo: 'Perdas insensíveis basais', valor: '500 a 1000 mL/dia', nota: 'Pele (cerca de 400 a 600 mL) e respiração (300 a 400 mL). Aumentam com febre, taquipneia, ventilação com gases secos e ambiente quente.' },
        { rotulo: 'Água de oxidação (endógena)', valor: '250 a 350 mL/dia', nota: 'Produzida pelo metabolismo de carboidratos, lipídios e proteínas. Já está descontada nas fórmulas usuais.' },
      ],
      interpretacao: [
        restricao
          ? '**Restrição hídrica indicada.** Na insuficiência cardíaca sintomática, restrições de 1,5 a 2 L/dia são usuais; na hiponatremia por SIADH, a restrição deve ser inferior ao volume urinário e costuma ficar entre 800 e 1200 mL/dia. A restrição rigorosa é difícil de sustentar e exige orientação detalhada.'
          : 'Sem restrição. Ajuste conforme diurese, balanço hídrico, peso diário e sinais de hidratação.',
        '**Nutrição enteral contém água.** Fórmulas padrão de 1,0 kcal/mL têm cerca de 80 a 85% de água; as concentradas (1,5 a 2,0 kcal/mL) têm 70 a 78%. Ao calcular o balanço, conte a água da dieta — esquecê-la é causa frequente de desidratação em pacientes com dieta concentrada.',
        'A sede é um marcador tardio no idoso: a sensibilidade dos osmorreceptores diminui com a idade, e a desidratação se instala antes de o paciente sentir sede. Ofereça líquidos ativamente.',
        '**Sinais de balanço adequado:** diurese de 0,5 a 1 mL/kg/h, peso estável, mucosas úmidas, turgor preservado, sódio e osmolalidade normais, e ureia sem elevação desproporcional à creatinina.',
      ],
    }
  },
  formula: [
    '35 mL/kg/dia (adultos jovens) · 30 mL/kg (55 a 65 anos) · 25 mL/kg (acima de 65 anos)',
    'Ou 1 mL por quilocaloria ingerida',
    'Acréscimo de 10 a 12% por grau de temperatura acima de 37 °C',
  ],
  fundamento:
    'A necessidade de água acompanha o gasto energético porque a maior parte da perda é obrigatória: água necessária para excretar a carga de solutos pelo rim (aproximadamente 500 a 800 mL/dia no mínimo), perdas insensíveis pela pele e pela respiração, e perdas fecais. Daí a equivalência aproximada entre 1 mL de água por quilocaloria metabolizada — uma relação notavelmente estável entre espécies.',
  armadilhas: [
    'Idosos precisam de menos água por quilo, mas têm maior risco de desidratação por menor reserva e menor sensação de sede.',
    'Sobrecarga hídrica é tão prejudicial quanto a desidratação em cardiopatas, nefropatas e hepatopatas.',
  ],
  referencias: [
    { texto: 'Volkert D, Beck AM, Cederholm T, et al. ESPEN guideline on clinical nutrition and hydration in geriatrics. Clin Nutr. 2019;38(1):10-47.' },
  ],
}

const enteral: Ferramenta = {
  id: 'nutricao-enteral',
  nome: 'Nutrição enteral: volume, velocidade e progressão',
  sinonimos: ['dieta enteral', 'sonda', 'nutricao enteral', 'ml/h dieta', 'gastrostomia'],
  resumo: 'Converte a meta calórica em volume e velocidade e monta o esquema de progressão.',
  categorias: ['nutricao'],
  campos: [
    campoNum('meta', 'Meta calórica diária', { unidade: 'kcal/dia', min: 300, max: 4000, passo: 50 }),
    campoNum('densidade', 'Densidade calórica da fórmula', { unidade: 'kcal/mL', min: 0.5, max: 2.5, passo: 0.1, padrao: '1.0' }),
    campoNum('proteinaFormula', 'Proteína da fórmula', { unidade: 'g/L', min: 20, max: 100, passo: 1, padrao: '40' }),
    campoNum('horasInfusao', 'Horas de infusão por dia', { unidade: 'h', min: 8, max: 24, passo: 1, padrao: '20', ajuda: 'Pausas facilitam a mobilização, a higiene e reduzem o risco de aspiração. Infusão contínua de 24 h é reservada a intolerância.' }),
    campoSeg('modo', 'Modo de administração', [
      { valor: 'continua', rotulo: 'Infusão contínua' },
      { valor: 'intermitente', rotulo: 'Intermitente (bolus ou gravitacional)' },
    ]),
    campoNum('tomadas', 'Número de tomadas por dia', { min: 3, max: 8, passo: 1, padrao: '6', mostrarSe: (v) => opc(v, 'modo') === 'intermitente' }),
  ],
  calcular: (v) => {
    const meta = num(v, 'meta')
    const densidade = numOu(v, 'densidade', 1)
    const proteinaL = numOu(v, 'proteinaFormula', 40)
    const horas = numOu(v, 'horasInfusao', 20)
    const tomadas = numOu(v, 'tomadas', 6)
    if (meta === null || densidade <= 0) return null
    const volume = meta / densidade
    const velocidade = volume / horas
    const porTomada = volume / tomadas
    const proteina = (volume / 1000) * proteinaL
    const aguaDieta = volume * (densidade <= 1.2 ? 0.83 : densidade <= 1.5 ? 0.78 : 0.72)
    const intermitente = opc(v, 'modo') === 'intermitente'
    return {
      titulo: 'Volume diário de dieta',
      valor: fmtInt(volume),
      unidade: 'mL/dia',
      nivel: 'neutro',
      rotuloNivel: intermitente ? `${fmtInt(porTomada)} mL por tomada, ${fmtInt(tomadas)} vezes ao dia` : `${fmtInt(velocidade)} mL/h em ${fmtInt(horas)} h`,
      detalhes: [
        { rotulo: 'Velocidade de infusão contínua', valor: `${fmtInt(velocidade)} mL/h`, nota: `Para entregar ${fmtInt(volume)} mL em ${fmtInt(horas)} h.` },
        { rotulo: 'Volume por tomada (intermitente)', valor: `${fmtInt(porTomada)} mL`, nota: 'Administre em 20 a 30 minutos, com o paciente sentado ou com a cabeceira a 30 a 45°. Volumes acima de 400 a 500 mL por tomada aumentam o risco de intolerância.' },
        { rotulo: 'Proteína fornecida', valor: `${fmtInt(proteina)} g/dia`, nota: `Fórmula com ${fmtInt(proteinaL)} g/L. Se a meta proteica não for alcançada com o volume calórico, use módulo de proteína em vez de aumentar o volume.` },
        { rotulo: 'Água contida na dieta', valor: `${fmtInt(aguaDieta)} mL/dia`, nota: 'Conte no balanço hídrico. Fórmulas concentradas têm proporcionalmente menos água.' },
        { rotulo: 'Progressão sugerida', valor: '20 a 25 mL/h inicial, aumentando 20 a 25 mL/h a cada 8 a 12 h até a meta', nota: 'Atingir a meta em 48 a 72 h é adequado na maioria dos casos. Em risco de síndrome de realimentação, progrida em 5 a 7 dias.' },
        { rotulo: 'Lavagem da sonda', valor: '20 a 30 mL de água antes e após cada medicação e a cada 4 a 6 h em infusão contínua', nota: 'Previne obstrução, que é a complicação mecânica mais comum.' },
      ],
      interpretacao: [
        '**A nutrição enteral é preferível à parenteral** sempre que o trato gastrointestinal estiver funcionante — mantém o trofismo da mucosa, preserva a barreira intestinal, tem menos complicações infecciosas e custa muito menos.',
        '**Início precoce (24 a 48 h)** é recomendado no paciente crítico hemodinamicamente estável. Em choque com vasopressor em dose alta e crescente, adie até a estabilização — o risco de isquemia mesentérica não é desprezível.',
        '**Volume residual gástrico não deve ser monitorizado de rotina.** Os ensaios mostraram que suspender a dieta por resíduo elevado reduz o aporte sem reduzir pneumonia. Quando medido, valores de até 500 mL sem outros sinais de intolerância não exigem interrupção.',
        '**Prevenção de aspiração:** cabeceira elevada a 30 a 45° de forma contínua, avaliação de tolerância, procinético se houver gastroparesia, e sonda pós-pilórica em caso de intolerância gástrica persistente ou pancreatite grave.',
        '**Medicamentos pela sonda:** triture bem e dilua; nunca triture comprimidos de liberação prolongada ou com revestimento entérico; lave antes e depois; e **suspenda a dieta 1 a 2 h antes e depois da fenitoína, do levotiroxina e da ciprofloxacino**, cuja absorção é drasticamente reduzida pela dieta.',
      ],
      alertas: ['Diarreia em paciente com nutrição enteral raramente é causada pela dieta. Investigue antes medicamentos (sorbitol em soluções orais, antibióticos, procinéticos, magnésio), Clostridioides difficile e impactação fecal com escape.'],
    }
  },
  formula: [
    'Volume (mL/dia) = meta calórica ÷ densidade da fórmula (kcal/mL)',
    'Velocidade (mL/h) = volume ÷ horas de infusão',
    'Proteína (g) = volume (L) × proteína da fórmula (g/L)',
  ],
  fundamento:
    'As fórmulas enterais padrão têm densidade de 1,0 a 1,2 kcal/mL e osmolaridade próxima da isotonicidade, o que as torna bem toleradas. As concentradas (1,5 a 2,0 kcal/mL) permitem entregar a mesma energia em menos volume — úteis na restrição hídrica — ao custo de menos água livre e maior osmolaridade, que pode causar diarreia osmótica se infundida rapidamente.',
  armadilhas: [
    'Interromper a dieta para procedimentos, exames e higiene é a principal causa de déficit calórico acumulado no hospital. Some as horas perdidas e compense.',
    'Fórmulas com fibra podem obstruir sondas finas e devem ser evitadas em suspeita de isquemia intestinal ou obstrução.',
  ],
  referencias: [
    { texto: 'McClave SA, Taylor BE, Martindale RG, et al. Guidelines for the provision and assessment of nutrition support therapy in the adult critically ill patient (ASPEN/SCCM). JPEN. 2016;40(2):159-211.' },
    { texto: 'Reignier J, Mercier E, Le Gouge A, et al. Effect of not monitoring residual gastric volume on risk of ventilator-associated pneumonia. JAMA. 2013;309(3):249-256.' },
  ],
}

const nrs: Ferramenta = {
  id: 'nrs-2002',
  nome: 'NRS-2002 — rastreio de risco nutricional',
  sinonimos: ['nrs', 'nrs 2002', 'risco nutricional', 'triagem nutricional'],
  resumo: 'Rastreia risco nutricional em pacientes hospitalizados, combinando estado e gravidade da doença.',
  categorias: ['nutricao'],
  campos: [
    campoOpc('estado', 'Estado nutricional', [
      { valor: '0', rotulo: 'Normal', pontos: 0 },
      { valor: '1', rotulo: 'Leve: perda > 5% em 3 meses, ou ingestão de 50 a 75% da habitual na última semana', pontos: 1 },
      { valor: '2', rotulo: 'Moderado: perda > 5% em 2 meses, IMC de 18,5 a 20,5 com estado geral comprometido, ou ingestão de 25 a 50%', pontos: 2 },
      { valor: '3', rotulo: 'Grave: perda > 5% em 1 mês (ou > 15% em 3 meses), IMC < 18,5 com estado geral comprometido, ou ingestão de 0 a 25%', pontos: 3 },
    ]),
    campoOpc('gravidade', 'Gravidade da doença (aumento da necessidade)', [
      { valor: '0', rotulo: 'Ausente', pontos: 0 },
      { valor: '1', rotulo: 'Leve: fratura de quadril, doença crônica com complicação aguda, cirrose, DPOC, diálise crônica, diabetes, câncer', pontos: 1 },
      { valor: '2', rotulo: 'Moderada: cirurgia abdominal de grande porte, AVC, pneumonia grave, neoplasia hematológica', pontos: 2 },
      { valor: '3', rotulo: 'Grave: traumatismo cranioencefálico, transplante de medula, paciente crítico com APACHE > 10', pontos: 3 },
    ]),
    campoSimNao('idade', 'Idade ≥ 70 anos', 1),
  ],
  calcular: (v) => {
    const estado = num(v, 'estado')
    const gravidade = num(v, 'gravidade')
    if (estado === null || gravidade === null) return null
    const total = estado + gravidade + (sim(v, 'idade') ? 1 : 0)
    const emRisco = total >= 3
    return {
      titulo: 'NRS-2002',
      valor: String(total),
      unidade: 'de 7 pontos',
      nivel: emRisco ? 'alerta' : 'ok',
      rotuloNivel: emRisco ? 'Em risco nutricional' : 'Sem risco nutricional no momento',
      detalhes: [
        { rotulo: 'Estado nutricional', valor: `${estado} ponto(s)` },
        { rotulo: 'Gravidade da doença', valor: `${gravidade} ponto(s)` },
        { rotulo: 'Ajuste por idade', valor: sim(v, 'idade') ? '+1 ponto' : '0' },
        { rotulo: 'Ponto de corte', valor: '≥ 3 pontos' },
      ],
      interpretacao: [
        emRisco
          ? '**Em risco nutricional.** Elabore plano de cuidado nutricional: avaliação completa por nutricionista, estimativa de necessidades, definição de via (oral com suplementação, enteral ou parenteral) e monitorização.'
          : 'Sem risco nutricional pelos critérios atuais. **Reavalie semanalmente** durante a internação — o risco muda com a evolução clínica e com o tempo de baixa ingestão.',
        'O NRS-2002 é a ferramenta de rastreio recomendada pela ESPEN para pacientes hospitalizados. Sua característica distintiva é somar duas dimensões: o **estado nutricional atual** e a **gravidade da doença**, que aumenta a necessidade e acelera o catabolismo.',
        '**Rastreio não é diagnóstico.** O diagnóstico de desnutrição é feito pelos critérios GLIM, que exigem pelo menos um critério fenotípico (perda de peso não intencional, IMC baixo, redução de massa muscular) **e** um etiológico (redução de ingestão ou absorção, ou inflamação por doença aguda ou crônica).',
        'A **perda de peso não intencional** é o marcador isolado mais robusto: mais de 5% em um mês, 7,5% em três meses ou 10% em seis meses é clinicamente significativa.',
      ],
    }
  },
  formula: ['NRS-2002 = estado nutricional (0 a 3) + gravidade da doença (0 a 3) + 1 se idade ≥ 70 anos'],
  fundamento:
    'O NRS-2002 foi construído a partir de uma revisão de 128 ensaios randomizados de suporte nutricional, buscando identificar as características dos pacientes que efetivamente se beneficiaram da intervenção. É, portanto, um instrumento derivado de resposta terapêutica, e não apenas de correlação com desfecho — o que o distingue da maioria das ferramentas de rastreio.',
  armadilhas: [
    'O rastreio deve ser feito nas primeiras 24 a 48 horas de internação e repetido semanalmente. Fazer uma vez e arquivar anula a utilidade.',
    'Peso em paciente com ascite, edema ou desidratação não reflete o estado nutricional.',
  ],
  referencias: [
    { texto: 'Kondrup J, Rasmussen HH, Hamberg O, Stanga Z. Nutritional risk screening (NRS 2002). Clin Nutr. 2003;22(3):321-336.' },
    { texto: 'Cederholm T, Jensen GL, Correia MITD, et al. GLIM criteria for the diagnosis of malnutrition. Clin Nutr. 2019;38(1):1-9.' },
  ],
}

const must: Ferramenta = {
  id: 'must',
  nome: 'MUST e MNA — rastreio nutricional na comunidade e no idoso',
  sinonimos: ['must', 'mna', 'mini nutritional assessment', 'rastreio idoso', 'desnutricao'],
  resumo: 'Os dois rastreios mais usados fora do hospital, lado a lado.',
  categorias: ['nutricao'],
  campos: [
    campoSeg('instrumento', 'Instrumento', [
      { valor: 'must', rotulo: 'MUST (adultos, comunidade e hospital)' },
      { valor: 'mna', rotulo: 'MNA-SF (idosos)' },
    ]),
    campoOpc('imc', 'Índice de massa corporal', [
      { valor: '0', rotulo: 'Acima de 20 kg/m²', pontos: 0 },
      { valor: '1', rotulo: '18,5 a 20 kg/m²', pontos: 1 },
      { valor: '2', rotulo: 'Abaixo de 18,5 kg/m²', pontos: 2 },
    ], { mostrarSe: (v) => opc(v, 'instrumento') === 'must' }),
    campoOpc('perda', 'Perda de peso não intencional nos últimos 3 a 6 meses', [
      { valor: '0', rotulo: 'Menos de 5%', pontos: 0 },
      { valor: '1', rotulo: '5 a 10%', pontos: 1 },
      { valor: '2', rotulo: 'Mais de 10%', pontos: 2 },
    ], { mostrarSe: (v) => opc(v, 'instrumento') === 'must' }),
    { ...campoSimNao('doencaAguda', 'Doença aguda com ausência de ingestão prevista por mais de 5 dias', 2), mostrarSe: (v: Valores) => opc(v, 'instrumento') === 'must' },
    campoOpc('ingestaoMna', 'Redução da ingestão nos últimos 3 meses', [
      { valor: '2', rotulo: 'Sem redução', pontos: 2 },
      { valor: '1', rotulo: 'Redução moderada', pontos: 1 },
      { valor: '0', rotulo: 'Redução grave', pontos: 0 },
    ], { mostrarSe: (v) => opc(v, 'instrumento') === 'mna' }),
    campoOpc('perdaMna', 'Perda de peso nos últimos 3 meses', [
      { valor: '3', rotulo: 'Sem perda', pontos: 3 },
      { valor: '2', rotulo: 'Não sabe', pontos: 2 },
      { valor: '1', rotulo: 'Entre 1 e 3 kg', pontos: 1 },
      { valor: '0', rotulo: 'Mais de 3 kg', pontos: 0 },
    ], { mostrarSe: (v) => opc(v, 'instrumento') === 'mna' }),
    campoOpc('mobilidade', 'Mobilidade', [
      { valor: '2', rotulo: 'Sai de casa', pontos: 2 },
      { valor: '1', rotulo: 'Sai da cama, mas não de casa', pontos: 1 },
      { valor: '0', rotulo: 'Restrito ao leito ou à cadeira', pontos: 0 },
    ], { mostrarSe: (v) => opc(v, 'instrumento') === 'mna' }),
    campoOpc('estresse', 'Estresse psicológico ou doença aguda nos últimos 3 meses', [
      { valor: '2', rotulo: 'Não', pontos: 2 },
      { valor: '0', rotulo: 'Sim', pontos: 0 },
    ], { mostrarSe: (v) => opc(v, 'instrumento') === 'mna' }),
    campoOpc('neuro', 'Problemas neuropsicológicos', [
      { valor: '2', rotulo: 'Nenhum', pontos: 2 },
      { valor: '1', rotulo: 'Demência leve', pontos: 1 },
      { valor: '0', rotulo: 'Demência grave ou depressão', pontos: 0 },
    ], { mostrarSe: (v) => opc(v, 'instrumento') === 'mna' }),
    campoOpc('imcMna', 'Índice de massa corporal', [
      { valor: '3', rotulo: '23 kg/m² ou mais', pontos: 3 },
      { valor: '2', rotulo: '21 a 22,9 kg/m²', pontos: 2 },
      { valor: '1', rotulo: '19 a 20,9 kg/m²', pontos: 1 },
      { valor: '0', rotulo: 'Menos de 19 kg/m²', pontos: 0 },
    ], { mostrarSe: (v) => opc(v, 'instrumento') === 'mna' }),
  ],
  calcular: (v) => {
    const instrumento = opc(v, 'instrumento')
    if (instrumento === 'must') {
      const imcP = num(v, 'imc')
      const perdaP = num(v, 'perda')
      if (imcP === null || perdaP === null) return null
      const total = imcP + perdaP + (sim(v, 'doencaAguda') ? 2 : 0)
      const faixa = total === 0 ? 0 : total === 1 ? 1 : 2
      return {
        titulo: 'MUST',
        valor: String(total),
        unidade: 'pontos',
        nivel: (['ok', 'atencao', 'alerta'] as Nivel[])[faixa],
        rotuloNivel: ['Risco baixo', 'Risco médio', 'Risco alto'][faixa],
        detalhes: [
          { rotulo: 'Conduta', valor: ['Rastreio de rotina: semanal no hospital, mensal em instituição, anual na comunidade em grupos de risco', 'Observar: registrar ingestão por 3 dias e repetir o rastreio', 'Tratar: encaminhar ao nutricionista, monitorizar e definir plano de cuidado'][faixa] },
        ],
        interpretacao: [
          'O MUST é o rastreio mais usado no Reino Unido e é aplicável em qualquer cenário — comunidade, instituição de longa permanência e hospital. Sua simplicidade é o principal atributo: três perguntas, sem exame laboratorial.',
          'Quando não for possível pesar ou medir, o MUST prevê alternativas: comprimento do antebraço para estimar altura, circunferência do braço para estimar o IMC, e o relato subjetivo de perda de peso (roupas mais folgadas, anéis frouxos).',
        ],
      }
    }
    const ids = ['ingestaoMna', 'perdaMna', 'mobilidade', 'estresse', 'neuro', 'imcMna']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const faixa = total >= 12 ? 0 : total >= 8 ? 1 : 2
    return {
      titulo: 'MNA-SF',
      valor: String(total),
      unidade: 'de 14 pontos',
      nivel: (['ok', 'alerta', 'critico'] as Nivel[])[faixa],
      rotuloNivel: ['Estado nutricional normal', 'Risco de desnutrição', 'Desnutrido'][faixa],
      detalhes: [
        { rotulo: 'Interpretação', valor: ['12 a 14: normal', '8 a 11: em risco', '0 a 7: desnutrido'][faixa] },
        { rotulo: 'Conduta', valor: ['Reavaliar anualmente ou conforme mudança clínica', 'Intervenção nutricional e monitorização', 'Avaliação nutricional completa e intervenção imediata'][faixa] },
      ],
      interpretacao: [
        'O MNA foi desenvolvido especificamente para idosos e é o instrumento com maior validação nessa população. A versão curta (MNA-SF) tem seis itens e desempenho equivalente à completa como rastreio.',
        '**A desnutrição no idoso raramente tem causa única.** Investigue os "nove D": dentição, disgeusia, disfagia, diarreia, doença, depressão, demência, drogas (polifarmácia) e disfunção (dependência funcional) — a que se somam isolamento social e insegurança alimentar.',
        'Quando não for possível medir o IMC, o MNA-SF permite substituí-lo pela **circunferência da panturrilha**: menos de 31 cm pontua 0, e 31 cm ou mais pontua 3.',
        '**Sarcopenia e desnutrição se sobrepõem mas não são a mesma coisa.** A sarcopenia é definida por perda de força e de massa muscular, e exige avaliação de força de preensão e de desempenho físico. O tratamento combina proteína adequada e treino de resistência.',
      ],
    }
  },
  formula: ['MUST = IMC + perda de peso + efeito de doença aguda (0 a 6)', 'MNA-SF = soma de 6 itens (0 a 14)'],
  fundamento:
    'Os dois instrumentos exploram os mesmos três eixos que definem risco nutricional — estado atual (IMC), trajetória (perda de peso) e fator agravante (doença, ingestão reduzida) —, mas com pesos e detalhamentos adaptados às populações em que foram derivados. O MNA acrescenta mobilidade e estado neuropsicológico, determinantes centrais da ingestão no idoso.',
  armadilhas: [
    'Rastreio positivo exige encaminhamento e plano, não apenas registro no prontuário.',
    'Albumina e pré-albumina **não** são marcadores nutricionais: são proteínas de fase aguda negativas, que caem com a inflamação independentemente do aporte. Não use para diagnosticar nem para monitorizar desnutrição.',
  ],
  referencias: [
    { texto: 'Elia M (ed). The MUST report. Malnutrition Advisory Group, BAPEN; 2003.' },
    { texto: 'Kaiser MJ, Bauer JM, Ramsch C, et al. Validation of the Mini Nutritional Assessment Short-Form. J Nutr Health Aging. 2009;13(9):782-788.' },
  ],
}

const realimentacao: Ferramenta = {
  id: 'sindrome-realimentacao',
  nome: 'Risco de síndrome de realimentação',
  sinonimos: ['realimentacao', 'refeeding', 'hipofosfatemia', 'tiamina'],
  resumo: 'Estratifica o risco pelos critérios do NICE e define o esquema de reintrodução segura.',
  categorias: ['nutricao'],
  campos: [
    campoNum('imc', 'Índice de massa corporal', { unidade: 'kg/m²', min: 8, max: 50, passo: 0.1 }),
    campoNum('perdaPeso', 'Perda de peso não intencional nos últimos 3 a 6 meses', { unidade: '%', min: 0, max: 60, passo: 0.5, padrao: '0' }),
    campoNum('diasJejum', 'Dias com ingestão nula ou mínima', { unidade: 'dias', min: 0, max: 60, passo: 1, padrao: '0' }),
    campoSimNao('eletrolitosBaixos', 'Potássio, fósforo ou magnésio baixos antes de iniciar a dieta', 1),
    campoSimNao('alcool', 'Etilismo crônico, ou uso de insulina, quimioterápicos, diuréticos ou antiácidos', 1),
  ],
  calcular: (v) => {
    const imc = num(v, 'imc')
    const perda = numOu(v, 'perdaPeso', 0)
    const dias = numOu(v, 'diasJejum', 0)
    if (imc === null) return null
    const altoRisco = imc < 16 || perda > 15 || dias > 10 || sim(v, 'eletrolitosBaixos')
    const criteriosMenores = [imc < 18.5, perda > 10, dias > 5, sim(v, 'alcool')].filter(Boolean).length
    const riscoModerado = criteriosMenores >= 2
    const muitoAlto = (imc < 14 || dias >= 15) && imc < 16
    const risco = muitoAlto ? 'muito alto' : altoRisco ? 'alto' : riscoModerado ? 'moderado' : 'baixo'
    const kcalInicial = muitoAlto ? 5 : altoRisco || riscoModerado ? 10 : 20
    const nivel: Nivel = muitoAlto ? 'critico' : altoRisco ? 'alerta' : riscoModerado ? 'atencao' : 'ok'
    return {
      titulo: `Risco ${risco}`,
      valor: risco.charAt(0).toUpperCase() + risco.slice(1),
      nivel,
      rotuloNivel: `IMC ${fmt(imc, 1)} · perda de ${fmt(perda, 1)}% · ${fmtInt(dias)} dias de jejum`,
      detalhes: [
        { rotulo: 'Critérios maiores (1 basta para alto risco)', valor: 'IMC < 16 · perda > 15% · jejum > 10 dias · eletrólitos baixos antes de alimentar' },
        { rotulo: 'Critérios menores (2 ou mais)', valor: `${criteriosMenores} presente(s)`, nota: 'IMC < 18,5 · perda > 10% · jejum > 5 dias · etilismo ou uso de insulina, quimioterápico, diurético ou antiácido' },
        { rotulo: 'Aporte calórico inicial', valor: `${kcalInicial} kcal/kg/dia`, nota: muitoAlto ? 'Risco extremo: comece com 5 kcal/kg/dia e monitorize com eletrocardiograma.' : 'Progrida lentamente até a meta em 4 a 7 dias.', nivel: 'alerta' },
        { rotulo: 'Tiamina', valor: '200 a 300 mg/dia por via oral, ou 100 a 300 mg endovenosos', nota: '**Antes** de iniciar a nutrição e por pelo menos 10 dias. A tiamina é cofator da piruvato desidrogenase, e a demanda dispara quando o carboidrato volta.', nivel: 'critico' },
        { rotulo: 'Monitorização de eletrólitos', valor: 'Fósforo, potássio e magnésio a cada 12 h nos primeiros 3 dias', nota: 'Reponha antes e durante — não espere o valor cair para agir.' },
        { rotulo: 'Balanço hídrico e peso', valor: 'Diários', nota: 'Ganho superior a 1 kg/dia sugere retenção hídrica, não recuperação nutricional.' },
      ],
      interpretacao: [
        '**A fisiopatologia explica tudo.** No jejum prolongado, o organismo migra para o catabolismo de gordura e proteína, com queda da insulina e depleção intracelular de fósforo, potássio e magnésio — que não aparece no exame porque o sérico é mantido às custas do estoque celular. Quando o carboidrato retorna, a insulina dispara, empurra glicose, fósforo, potássio e magnésio para dentro das células, e os níveis séricos despencam em horas.',
        '**A hipofosfatemia é a marca da síndrome** e explica a maioria das manifestações: sem fósforo não há ATP nem 2,3-difosfoglicerato, o que compromete contratilidade miocárdica, função diafragmática, transporte de oxigênio e função neuronal. As consequências vão de fraqueza e rabdomiólise a insuficiência cardíaca, arritmia, convulsão, coma e morte.',
        '**Nunca atrase a nutrição por medo da síndrome.** O manejo correto não é postergar a alimentação, e sim iniciá-la devagar com reposição agressiva de eletrólitos e tiamina.',
        'Populações de maior risco: anorexia nervosa, etilismo crônico, câncer avançado, pós-operatório de cirurgia bariátrica, hiperêmese gravídica, greve de fome, idosos institucionalizados e pacientes com jejum hospitalar prolongado por procedimentos sucessivos.',
      ],
      alertas: ['Reponha tiamina **antes** da primeira caloria. Administrar glicose a um paciente depletado precipita encefalopatia de Wernicke, que é irreversível se não tratada a tempo.'],
    }
  },
  formula: ['Critérios do NICE: 1 critério maior OU 2 menores definem risco', 'Iniciar com 5 a 10 kcal/kg/dia e progredir até a meta em 4 a 7 dias'],
  fundamento:
    'A síndrome foi descrita em prisioneiros de guerra libertados ao fim da Segunda Guerra, que morriam ao serem realimentados. O mecanismo central é o desvio metabólico da lipólise de volta para o metabolismo de carboidratos, mediado pela insulina — um deslocamento maciço e súbito de eletrólitos e de água para o compartimento intracelular, num organismo cujos estoques já estão esgotados.',
  armadilhas: [
    'Eletrólitos séricos normais **não** excluem depleção intracelular. O risco se define pela história, não pelo laboratório inicial.',
    'A síndrome ocorre com qualquer via de realimentação — oral, enteral ou parenteral. A parenteral é a de maior risco pela rapidez do aporte.',
  ],
  referencias: [
    { texto: 'National Institute for Health and Care Excellence. Nutrition support for adults. Clinical guideline CG32. 2006, atualizada em 2017.' },
    { texto: 'da Silva JSV, Seres DS, Sabino K, et al. ASPEN consensus recommendations for refeeding syndrome. Nutr Clin Pract. 2020;35(2):178-195.' },
  ],
}

const balancoNitrogenado: Ferramenta = {
  id: 'balanco-nitrogenado',
  nome: 'Balanço nitrogenado',
  sinonimos: ['balanco nitrogenado', 'nitrogenio ureico urinario', 'catabolismo proteico'],
  resumo: 'Compara o nitrogênio ingerido com o excretado para avaliar se o aporte proteico é suficiente.',
  categorias: ['nutricao'],
  campos: [
    campoNum('proteinaIngerida', 'Proteína ofertada em 24 h', { unidade: 'g', min: 0, max: 400, passo: 1 }),
    campoNum('ureiaUrinaria', 'Ureia urinária de 24 h', { unidade: 'g/24 h', min: 0, max: 80, passo: 0.1, ajuda: 'Se o laboratório informa em mg/dL, multiplique pelo volume urinário em litros e divida por 100 para obter gramas.' }),
    campoNum('perdasExtras', 'Perdas nitrogenadas adicionais', { unidade: 'g/dia', min: 0, max: 20, passo: 0.5, padrao: '0', ajuda: 'Fístulas, drenos, feridas extensas, queimaduras, diarreia volumosa.' }),
  ],
  calcular: (v) => {
    const proteina = num(v, 'proteinaIngerida')
    const ureia = num(v, 'ureiaUrinaria')
    const extras = numOu(v, 'perdasExtras', 0)
    if (proteina === null || ureia === null) return null
    const nitrogenioIngerido = proteina / 6.25
    const nitrogenioUreico = ureia * 0.466
    const perdasObrigatorias = 4
    const nitrogenioExcretado = nitrogenioUreico + perdasObrigatorias + extras
    const balanco = nitrogenioIngerido - nitrogenioExcretado
    const proteinaEquivalente = Math.abs(balanco) * 6.25
    const nivel: Nivel = balanco < -5 ? 'critico' : balanco < 0 ? 'alerta' : balanco > 6 ? 'atencao' : 'ok'
    return {
      titulo: 'Balanço nitrogenado',
      valor: `${balanco >= 0 ? '+' : ''}${fmt(balanco, 1)}`,
      unidade: 'g N/dia',
      nivel,
      rotuloNivel: balanco > 0 ? 'Balanço positivo — anabolismo' : balanco < 0 ? 'Balanço negativo — catabolismo' : 'Balanço neutro',
      detalhes: [
        { rotulo: 'Nitrogênio ingerido', valor: `${fmt(nitrogenioIngerido, 2)} g/dia`, nota: `${fmtInt(proteina)} g de proteína ÷ 6,25.` },
        { rotulo: 'Nitrogênio ureico urinário', valor: `${fmt(nitrogenioUreico, 2)} g/dia`, nota: 'Ureia × 0,466 (a ureia contém 46,6% de nitrogênio em massa).' },
        { rotulo: 'Perdas obrigatórias', valor: `${perdasObrigatorias} g/dia`, nota: 'Nitrogênio não ureico urinário (creatinina, ácido úrico, amônia), perdas fecais e cutâneas.' },
        { rotulo: 'Perdas adicionais', valor: `${fmt(extras, 1)} g/dia` },
        { rotulo: 'Equivalente proteico do balanço', valor: `${balanco >= 0 ? '+' : '−'}${fmtInt(proteinaEquivalente)} g de proteína/dia`, nota: balanco < 0 ? 'Massa proteica corporal sendo perdida por dia. Cada grama de nitrogênio corresponde a cerca de 30 g de tecido magro.' : 'Massa proteica sendo incorporada.' },
        { rotulo: 'Massa magra equivalente', valor: `${fmtInt(Math.abs(balanco) * 30)} g/dia`, nota: '1 g de nitrogênio ≈ 6,25 g de proteína ≈ 30 g de tecido magro hidratado.' },
      ],
      interpretacao: [
        balanco > 0
          ? 'Balanço positivo indica anabolismo — o organismo está incorporando proteína. É o alvo na fase de recuperação e em situações anabólicas (gestação, crescimento, convalescença).'
          : balanco < 0
            ? '**Balanço negativo indica catabolismo.** Na fase aguda da doença crítica, um balanço negativo é esperado e frequentemente **inevitável** — a resposta inflamatória degrada músculo independentemente do aporte. Tentar zerá-lo à força na primeira semana com proteína em excesso não funciona e pode agravar a azotemia.'
            : 'Balanço em equilíbrio.',
        'A meta clínica varia com a fase: **balanço levemente positivo (+2 a +4 g/dia)** é o alvo na recuperação; na fase aguda, minimizar o balanço negativo é o realista.',
        'O balanço nitrogenado é o método mais direto de avaliar a adequação do aporte proteico, mas depende de coleta urinária de 24 horas completa — e coleta incompleta é a principal fonte de erro, sempre no sentido de superestimar o balanço.',
        'A ureia urinária representa cerca de 80 a 90% do nitrogênio urinário total. O acréscimo fixo de 4 g cobre o nitrogênio não ureico e as perdas fecais e cutâneas.',
      ],
      alertas: ['Não é interpretável na lesão renal aguda com retenção de ureia, nem em terapia renal substitutiva — o nitrogênio fica retido ou é removido pelo dialisato, e a excreção urinária deixa de refletir o catabolismo.'],
    }
  },
  formula: [
    'Balanço N = (proteína ingerida ÷ 6,25) − (nitrogênio ureico urinário + 4)',
    'Nitrogênio ureico urinário (g) = ureia urinária (g/24 h) × 0,466',
    '1 g de nitrogênio ≈ 6,25 g de proteína ≈ 30 g de tecido magro',
  ],
  fundamento:
    'O nitrogênio é praticamente exclusivo das proteínas entre os macronutrientes, e sua excreção reflete a degradação proteica. Como as proteínas contêm em média 16% de nitrogênio em massa, o fator 6,25 (que é 100/16) converte um no outro. O balanço compara entrada e saída: positivo significa que a síntese supera a degradação; negativo, o contrário.',
  armadilhas: [
    'Coleta urinária incompleta é a armadilha principal. Confira o volume total e a creatinina urinária de 24 horas (esperada de 20 a 25 mg/kg em homens e 15 a 20 em mulheres) como controle de qualidade da coleta.',
    'Sangramento digestivo alto aumenta a ureia por absorção de proteína do sangue, falseando o balanço.',
  ],
  referencias: [
    { texto: 'Dickerson RN. Nitrogen balance and protein requirements for critically ill older patients. Nutrients. 2016;8(4):226.' },
  ],
}

const carboidratoRefeicao: Ferramenta = {
  id: 'carboidrato-refeicao',
  nome: 'Contagem de carboidratos e conversores de dieta',
  sinonimos: ['contagem de carboidratos', 'carboidrato por refeicao', 'lista de substituicao', 'indice glicemico'],
  resumo: 'Distribui o carboidrato entre as refeições e converte entre gramas, porções e substitutos.',
  categorias: ['nutricao', 'endocrinologia'],
  campos: [
    campoNum('calorias', 'Meta calórica diária', { unidade: 'kcal', min: 800, max: 5000, passo: 50, padrao: '2000' }),
    campoNum('pctCarbo', 'Percentual de carboidrato', { unidade: '%', min: 20, max: 65, passo: 1, padrao: '50', ajuda: 'Faixa aceitável: 45 a 60% na dieta habitual. Dietas de baixo carboidrato ficam entre 20 e 40%.' }),
    campoNum('refeicoes', 'Refeições principais por dia', { min: 3, max: 6, passo: 1, padrao: '3' }),
    campoNum('lanches', 'Lanches por dia', { min: 0, max: 4, passo: 1, padrao: '2' }),
    campoNum('relacaoInsulina', 'Relação insulina-carboidrato', { unidade: 'g por unidade', min: 3, max: 40, passo: 0.5, opcional: true, ajuda: 'Se houver uso de insulina, informe para calcular o bolus de cada refeição.' }),
  ],
  calcular: (v) => {
    const calorias = numOu(v, 'calorias', 2000)
    const pct = numOu(v, 'pctCarbo', 50)
    const refeicoes = numOu(v, 'refeicoes', 3)
    const lanches = numOu(v, 'lanches', 2)
    const relacao = num(v, 'relacaoInsulina')
    const carboTotal = (calorias * (pct / 100)) / 4
    const pesoRefeicao = 1
    const pesoLanche = 0.4
    const unidades = refeicoes * pesoRefeicao + lanches * pesoLanche
    const porRefeicao = unidades > 0 ? carboTotal / unidades : 0
    const porLanche = porRefeicao * pesoLanche
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Carboidrato total diário', valor: `${fmtInt(carboTotal)} g/dia`, nota: `${fmtInt(pct)}% de ${fmtInt(calorias)} kcal, a 4 kcal/g.` },
      { rotulo: 'Por refeição principal', valor: `${fmtInt(porRefeicao)} g`, nota: `Equivale a cerca de ${fmt(porRefeicao / 15, 1)} substituições (1 substituição = 15 g de carboidrato).` },
      { rotulo: 'Por lanche', valor: `${fmtInt(porLanche)} g`, nota: `Cerca de ${fmt(porLanche / 15, 1)} substituições.` },
      { rotulo: 'Uma substituição (15 g de carboidrato)', valor: '1 fatia de pão · 4 colheres de sopa de arroz cozido · 1 batata média · 1 fruta média · 200 mL de leite · 3 colheres de sopa de feijão com caldo' },
    ]
    if (relacao !== null && relacao > 0) {
      detalhes.push({ rotulo: 'Bolus de insulina por refeição principal', valor: `${fmtLivre(porRefeicao / relacao, 1)} U`, nota: `${fmtInt(porRefeicao)} g ÷ ${fmt(relacao, 1)} g/U.`, nivel: 'alerta' })
      detalhes.push({ rotulo: 'Bolus por lanche', valor: `${fmtLivre(porLanche / relacao, 1)} U` })
      detalhes.push({ rotulo: 'Bolus diário total de refeição', valor: `${fmtLivre(carboTotal / relacao, 1)} U/dia` })
    }
    return {
      titulo: 'Carboidrato por refeição',
      valor: fmtInt(porRefeicao),
      unidade: 'g',
      nivel: 'neutro',
      rotuloNivel: `${fmtInt(carboTotal)} g/dia distribuídos em ${fmtInt(refeicoes)} refeições e ${fmtInt(lanches)} lanches`,
      detalhes,
      interpretacao: [
        '**A contagem de carboidratos é a estratégia com melhor evidência para controle glicêmico no diabetes tipo 1** e é a base da terapia insulínica flexível. Ela permite ajustar a insulina à refeição, em vez de o contrário.',
        'O sistema de **substituições** (ou equivalentes) simplifica a contagem: cada substituição corresponde a 15 g de carboidrato, e alimentos do mesmo grupo podem ser trocados livremente entre si. É mais fácil de ensinar do que a pesagem e tem eficácia comparável.',
        '**Proteína e gordura também afetam a glicemia**, mas tardiamente: refeições muito gordurosas ou proteicas elevam a glicemia 3 a 5 horas depois, o que motiva o bolus estendido ou dividido em usuários de bomba de infusão.',
        'O **índice glicêmico** e a carga glicêmica modulam a velocidade de absorção, mas a **quantidade total** de carboidrato continua sendo o principal determinante da resposta glicêmica pós-prandial.',
        'Não existe percentual ideal universal de carboidrato. As diretrizes reconhecem que padrões alimentares variados — mediterrâneo, baixo carboidrato, vegetariano — podem funcionar, e que a adesão sustentável importa mais do que a distribuição exata dos macronutrientes.',
      ],
    }
  },
  formula: [
    'Carboidrato (g/dia) = calorias × percentual ÷ 4',
    '1 substituição = 15 g de carboidrato',
    'Bolus de insulina = gramas de carboidrato ÷ relação insulina-carboidrato',
  ],
  fundamento:
    'A relação entre carboidrato ingerido e resposta glicêmica é aproximadamente linear na faixa habitual de consumo, o que torna a contagem uma ferramenta previsível. A regra dos 500 — relação insulina-carboidrato igual a 500 dividido pela dose diária total de insulina — é o ponto de partida empírico, derivado da observação de quanto carboidrato uma unidade cobre em pacientes com sensibilidade média.',
  armadilhas: [
    'Fibra não é absorvida como carboidrato disponível. Em alimentos com mais de 5 g de fibra por porção, subtraia a fibra do total para calcular o bolus.',
    'Álcool inibe a gliconeogênese hepática e pode causar hipoglicemia tardia, horas depois — cuidado ao calcular bolus em refeições com bebida alcoólica.',
  ],
  referencias: [
    { texto: 'American Diabetes Association. Standards of Care in Diabetes — 2024: facilitating positive health behaviors. Diabetes Care. 2024;47(Suppl 1):S77-S110.' },
    { texto: 'Sociedade Brasileira de Diabetes. Diretriz da Sociedade Brasileira de Diabetes, edição vigente.' },
  ],
}

export const ferramentas: Ferramenta[] = [
  gastoEnergetico,
  proteina,
  hidrica,
  enteral,
  nrs,
  must,
  realimentacao,
  balancoNitrogenado,
  carboidratoRefeicao,
]

export default ferramentas
