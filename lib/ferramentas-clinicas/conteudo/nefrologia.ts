import type { Ferramenta, Nivel, Resultado, Valores } from '../tipos'
import {
  campoAltura,
  campoCreatinina,
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
  num,
  numOu,
  opc,
  pts,
  sim,
  somaSimNao,
} from '../helpers'

/* ══════════════════ Núcleo: filtração glomerular e água corporal ══════════════════ */

/** CKD-EPI 2021, sem termo racial — a equação recomendada desde 2021. */
export function ckdEpi2021(cr: number, idade: number, feminino: boolean): number {
  const k = feminino ? 0.7 : 0.9
  const a = feminino ? -0.241 : -0.302
  return (
    142 *
    Math.pow(Math.min(cr / k, 1), a) *
    Math.pow(Math.max(cr / k, 1), -1.2) *
    Math.pow(0.9938, idade) *
    (feminino ? 1.012 : 1)
  )
}

/** CKD-EPI 2009 (com os coeficientes raciais originais, para comparação histórica). */
export function ckdEpi2009(cr: number, idade: number, feminino: boolean, negro: boolean): number {
  const k = feminino ? 0.7 : 0.9
  const a = feminino ? -0.329 : -0.411
  return (
    141 *
    Math.pow(Math.min(cr / k, 1), a) *
    Math.pow(Math.max(cr / k, 1), -1.209) *
    Math.pow(0.993, idade) *
    (feminino ? 1.018 : 1) *
    (negro ? 1.159 : 1)
  )
}

/** MDRD de 4 variáveis. */
export function mdrd(cr: number, idade: number, feminino: boolean, negro: boolean): number {
  return 175 * Math.pow(cr, -1.154) * Math.pow(idade, -0.203) * (feminino ? 0.742 : 1) * (negro ? 1.212 : 1)
}

/** Água corporal total estimada, em litros. */
export function aguaCorporal(peso: number, feminino: boolean, idoso: boolean): number {
  const fator = feminino ? (idoso ? 0.45 : 0.5) : idoso ? 0.5 : 0.6
  return peso * fator
}

export function estagioDrc(tfg: number): { estagio: string; descricao: string; nivel: Nivel } {
  if (tfg >= 90) return { estagio: 'G1', descricao: 'TFG normal ou aumentada (≥ 90)', nivel: 'ok' }
  if (tfg >= 60) return { estagio: 'G2', descricao: 'Redução leve (60 a 89)', nivel: 'ok' }
  if (tfg >= 45) return { estagio: 'G3a', descricao: 'Redução leve a moderada (45 a 59)', nivel: 'atencao' }
  if (tfg >= 30) return { estagio: 'G3b', descricao: 'Redução moderada a grave (30 a 44)', nivel: 'alerta' }
  if (tfg >= 15) return { estagio: 'G4', descricao: 'Redução grave (15 a 29)', nivel: 'alerta' }
  return { estagio: 'G5', descricao: 'Falência renal (< 15)', nivel: 'critico' }
}

/* ══════════════════════════════ Ferramentas ══════════════════════════════ */

const tfg: Ferramenta = {
  id: 'tfg-ckd-epi',
  nome: 'Taxa de filtração glomerular (CKD-EPI, MDRD e comparação)',
  sigla: 'TFGe',
  sinonimos: ['tfg', 'ckd-epi', 'mdrd', 'filtracao glomerular', 'clearance', 'egfr'],
  resumo: 'Estima a filtração glomerular pelas três equações e classifica o estágio da doença renal.',
  categorias: ['nefrologia'],
  campos: [
    campoCreatinina(),
    campoIdade({ min: 18, ajuda: 'As equações CKD-EPI e MDRD são validadas apenas em adultos. Para crianças, use a fórmula de Schwartz.' }),
    campoSexo(),
    campoNum('cistatina', 'Cistatina C', { unidade: 'mg/L', min: 0.3, max: 8, passo: 0.01, opcional: true, ajuda: 'Opcional. A equação combinada creatinina + cistatina C é a mais acurada e é recomendada quando a estimativa muda conduta.' }),
    campoNum('albuminuria', 'Relação albumina/creatinina urinária', { unidade: 'mg/g', min: 0, max: 5000, passo: 1, opcional: true, ajuda: 'Define a categoria de albuminúria (A1, A2, A3), que é o segundo eixo da classificação KDIGO.' }),
  ],
  calcular: (v) => {
    const cr = num(v, 'creatinina')
    const idade = num(v, 'idade')
    if (cr === null || idade === null || cr <= 0) return null
    const f = opc(v, 'sexo') === 'f'
    const e2021 = ckdEpi2021(cr, idade, f)
    const e2009 = ckdEpi2009(cr, idade, f, false)
    const eMdrd = mdrd(cr, idade, f, false)
    const est = estagioDrc(e2021)
    const alb = num(v, 'albuminuria')
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'CKD-EPI 2021 (recomendada)', valor: `${fmtInt(e2021)} mL/min/1,73 m²`, nota: 'Equação sem termo racial, adotada pela força-tarefa NKF-ASN em 2021.' },
      { rotulo: 'CKD-EPI 2009', valor: `${fmtInt(e2009)} mL/min/1,73 m²`, nota: 'Versão anterior, calculada aqui sem o coeficiente racial.' },
      { rotulo: 'MDRD 4 variáveis', valor: `${fmtInt(eMdrd)} mL/min/1,73 m²`, nota: 'Subestima sistematicamente acima de 60 mL/min — motivo pelo qual muitos laboratórios reportavam apenas "> 60".' },
      { rotulo: 'Estágio KDIGO', valor: `${est.estagio} — ${est.descricao}`, nivel: est.nivel },
    ]
    const cis = num(v, 'cistatina')
    if (cis !== null && cis > 0) {
      const kc = f ? 0.7 : 0.9
      const ac = f ? -0.219 : -0.144
      const combinada =
        135 *
        Math.pow(Math.min(cr / kc, 1), ac) *
        Math.pow(Math.max(cr / kc, 1), -0.544) *
        Math.pow(Math.min(cis / 0.8, 1), -0.323) *
        Math.pow(Math.max(cis / 0.8, 1), -0.778) *
        Math.pow(0.9961, idade) *
        (f ? 0.963 : 1)
      detalhes.unshift({ rotulo: 'CKD-EPI creatinina + cistatina C 2021', valor: `${fmtInt(combinada)} mL/min/1,73 m²`, nota: 'A estimativa mais acurada disponível. Use quando a decisão for sensível ao valor: quimioterapia, transplante, contraste, medicamento de janela estreita.' })
    }
    let categoriaAlb = ''
    if (alb !== null) {
      categoriaAlb = alb < 30 ? 'A1 — normal a levemente aumentada' : alb < 300 ? 'A2 — moderadamente aumentada' : 'A3 — gravemente aumentada'
      detalhes.push({ rotulo: 'Categoria de albuminúria', valor: categoriaAlb, nota: 'A albuminúria é preditor de progressão e de risco cardiovascular independente da TFG — dois pacientes G3a com A1 e A3 têm prognósticos completamente distintos.', nivel: alb >= 300 ? 'alerta' : alb >= 30 ? 'atencao' : 'ok' })
    }
    return {
      titulo: 'TFG estimada (CKD-EPI 2021)',
      valor: fmtInt(e2021),
      unidade: 'mL/min/1,73 m²',
      nivel: est.nivel,
      rotuloNivel: `Estágio ${est.estagio}`,
      detalhes,
      conduta: [
        'Confirme a **cronicidade** antes de rotular doença renal crônica: é preciso taxa de filtração < 60 mL/min/1,73 m² ou marcador de lesão (albuminúria, alteração no sedimento, imagem, histologia) persistindo por **mais de 3 meses**. Uma única creatinina alterada pode ser lesão aguda, e as condutas são opostas.',
        'Classifique sempre pelos **dois eixos, G e A**: o estágio da filtração (G1 a G5) e o da albuminúria (A1 < 30, A2 30–300, A3 > 300 mg/g). A albuminúria prediz progressão e evento cardiovascular de forma independente da filtração — um paciente G2/A3 tem risco maior que um G3a/A1.',
        'Em qualquer paciente com doença renal crônica albuminúrica, o núcleo do tratamento é **IECA ou BRA na dose máxima tolerada mais inibidor de SGLT2** (dapagliflozina ou empagliflozina), com ou sem diabetes. Espere e aceite uma queda de até 30% na filtração nas primeiras semanas: ela é hemodinâmica, reversível e associa-se a melhor desfecho a longo prazo.',
        'Use a filtração estimada para **ajustar fármacos, mas com cuidado na unidade**: a CKD-EPI sai indexada a 1,73 m², enquanto as bulas de anticoagulantes diretos e de quimioterápicos foram escritas em clearance de Cockcroft-Gault não indexado. Desindexe (multiplicando pela superfície corporal do paciente e dividindo por 1,73) antes de decidir dose em extremos de peso.',
        '**Encaminhe ao nefrologista** com filtração < 30 mL/min/1,73 m², albuminúria > 300 mg/g, queda rápida (> 5 mL/min/ano), hematúria glomerular, cilindros celulares, hipercalemia refratária, anemia desproporcional ou doença renal de causa indefinida. O encaminhamento tardio é preditor independente de mortalidade no início da diálise.',
      ],
      interpretacao: [
        'A creatinina depende da massa muscular, e essa é a limitação estrutural de qualquer equação baseada nela. Uma senhora de 80 anos, 45 kg e sarcopênica com creatinina de 1,0 mg/dL não tem função renal normal — tem pouca massa muscular. O mesmo vale, ao contrário, para o fisiculturista com creatinina de 1,4.',
        'O diagnóstico de doença renal crônica exige **três meses** de TFG abaixo de 60 ou de marcador de dano renal (albuminúria, alteração no sedimento, alteração estrutural na imagem, doença tubular, história de transplante). Uma medida isolada não faz diagnóstico.',
        'Desde 2021, as equações não incluem coeficiente racial. A justificativa é que raça é construto social e não variável biológica de filtração — o coeficiente antigo elevava a TFG estimada em pessoas negras em 16%, o que atrasava encaminhamento e listagem para transplante.',
      ],
      alertas: [
        'A TFG estimada é inválida em situações de creatinina em desequilíbrio: lesão renal aguda, gestação, amputação, cirrose com sarcopenia, dieta vegetariana estrita, uso de creatina, rabdomiólise. Nesses casos use clearance medido em urina de 24 horas ou cistatina C.',
        'Para ajuste de dose de medicamentos com janela estreita, muitas bulas foram validadas com Cockcroft-Gault, não com CKD-EPI — e os valores não são intercambiáveis. Confira a referência da bula.',
      ],
    }
  },
  formula: [
    'CKD-EPI 2021 = 142 × min(Cr/κ,1)^α × max(Cr/κ,1)^−1,200 × 0,9938^idade × 1,012 (se ♀)',
    'κ = 0,7 (♀) ou 0,9 (♂)   |   α = −0,241 (♀) ou −0,302 (♂)',
    'MDRD = 175 × Cr^−1,154 × idade^−0,203 × 0,742 (se ♀)',
  ],
  fundamento:
    'A creatinina é produzida em ritmo aproximadamente constante pelo músculo e eliminada quase inteiramente por filtração glomerular, o que a torna um marcador endógeno conveniente. O problema é que a relação entre creatinina e TFG é hiperbólica, não linear: nas fases iniciais, a filtração pode cair 40% com aumento mínimo da creatinina, porque os néfrons remanescentes hiperfiltram. As equações corrigem esse comportamento e ajustam pelos determinantes da produção — idade e sexo como aproximações de massa muscular.',
  armadilhas: [
    'Cimetidina, trimetoprima, dolutegravir, cobicistate e fenofibrato elevam a creatinina por bloquear sua secreção tubular, sem alterar a filtração real. É elevação sem lesão.',
    'A TFG estimada já vem indexada para 1,73 m². Para dose de quimioterápico e em extremos de tamanho corporal, desindexe multiplicando pela superfície corporal do paciente e dividindo por 1,73.',
  ],
  referencias: [
    { texto: 'Inker LA, Eneanya ND, Coresh J, et al. New creatinine- and cystatin C-based equations to estimate GFR without race. N Engl J Med. 2021;385(19):1737-1749.' },
    { texto: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117-S314.' },
  ],
}

const cockcroft: Ferramenta = {
  id: 'cockcroft-gault',
  nome: 'Clearance de creatinina por Cockcroft-Gault',
  sinonimos: ['cockcroft', 'clearance de creatinina', 'ajuste de dose renal'],
  resumo: 'A estimativa usada nas bulas para ajuste de dose, com as três variantes de peso.',
  categorias: ['nefrologia', 'farmacologia'],
  campos: [
    campoCreatinina(),
    campoIdade({ min: 18 }),
    campoSexo(),
    campoPeso(),
    campoAltura({ opcional: true, ajuda: 'Permite calcular peso ideal e peso ajustado — os que devem ser usados em obesidade.' }),
  ],
  calcular: (v) => {
    const cr = num(v, 'creatinina')
    const idade = num(v, 'idade')
    const peso = num(v, 'peso')
    const altura = num(v, 'altura')
    if (cr === null || idade === null || peso === null || cr <= 0) return null
    const f = opc(v, 'sexo') === 'f'
    const calc = (p: number) => (((140 - idade) * p) / (72 * cr)) * (f ? 0.85 : 1)
    const comReal = calc(peso)
    const detalhes: Resultado['detalhes'] = [{ rotulo: 'Com peso real', valor: `${fmtInt(comReal)} mL/min` }]
    let recomendado = comReal
    let notaPeso = 'Sem altura informada, apenas o peso real foi usado.'
    if (altura !== null) {
      const pi = (f ? 45.5 : 50) + 0.91 * (altura - 152.4)
      const pa = pi + 0.4 * (peso - pi)
      const imc = peso / Math.pow(altura / 100, 2)
      detalhes.push({ rotulo: 'Peso ideal', valor: `${fmt(pi, 1)} kg` })
      detalhes.push({ rotulo: 'Com peso ideal', valor: `${fmtInt(calc(pi))} mL/min` })
      detalhes.push({ rotulo: 'Peso ajustado (PI + 0,4 × excesso)', valor: `${fmt(pa, 1)} kg` })
      detalhes.push({ rotulo: 'Com peso ajustado', valor: `${fmtInt(calc(pa))} mL/min` })
      detalhes.push({ rotulo: 'IMC', valor: `${fmt(imc, 1)} kg/m²` })
      if (imc >= 30) {
        recomendado = calc(pa)
        notaPeso = 'IMC ≥ 30: use o **peso ajustado**. Com peso real, a fórmula superestima o clearance e leva a superdosagem.'
      } else if (peso < pi) {
        recomendado = comReal
        notaPeso = 'Peso abaixo do ideal: use o **peso real**.'
      } else {
        recomendado = calc(pi)
        notaPeso = 'Peso próximo do ideal: use o **peso ideal** ou o real — a diferença é pequena.'
      }
    }
    const nivel: Nivel = recomendado < 15 ? 'critico' : recomendado < 30 ? 'alerta' : recomendado < 60 ? 'atencao' : 'ok'
    return {
      titulo: 'Clearance de creatinina',
      valor: fmtInt(recomendado),
      unidade: 'mL/min',
      nivel,
      rotuloNivel: recomendado < 15 ? 'Falência renal' : recomendado < 30 ? 'Comprometimento grave' : recomendado < 60 ? 'Comprometimento moderado' : 'Preservado',
      detalhes,
      conduta: [
        'Use Cockcroft-Gault especificamente para **ajuste de dose de fármacos**: a maior parte das bulas, inclusive as dos anticoagulantes orais diretos, teve seus cortes derivados dessa fórmula. Trocá-la por CKD-EPI na hora de dosar apixabana ou rivaroxabana pode mudar a faixa de dose e a validade da prescrição.',
        'Para **estadiar doença renal crônica**, prefira **CKD-EPI**: Cockcroft-Gault superestima em obesos e é menos precisa nas faixas intermediárias, além de não ser indexada à superfície corporal.',
        'Escolha o peso com critério: **peso ideal** em obesos, **peso ajustado** quando o índice de massa corporal ultrapassa 30, e **peso real** em pacientes magros. Usar o peso real em um paciente com 140 kg infla o clearance calculado e leva a superdosagem — o erro mais perigoso da fórmula.',
        'A fórmula **não vale em lesão renal aguda**: ela pressupõe creatinina em estado de equilíbrio. Com creatinina subindo, a filtração real já é muito menor que a calculada; com creatinina caindo após recuperação, é maior. Nesses cenários, guie-se por diurese, tendência da creatinina e critérios KDIGO.',
        'Corrija a interpretação em quem tem **massa muscular atípica**: amputados, tetraplégicos, cirróticos, idosos sarcopênicos e desnutridos têm creatinina baixa por baixa produção, não por boa filtração. Nesses casos a **cistatina C** é o marcador de escolha, pois não depende de massa muscular.',
      ],
      interpretacao: [
        notaPeso,
        'Cockcroft-Gault sobrevive por um motivo histórico e prático: a maioria dos ensaios de farmacocinética e dos ajustes descritos em bula usou esta fórmula. Trocar por CKD-EPI ao ajustar dose de anticoagulante oral direto, por exemplo, pode reclassificar o paciente e mudar a dose indicada — as diretrizes de fibrilação atrial mantêm explicitamente Cockcroft-Gault para essa decisão.',
        'Diferente da TFG estimada, o resultado **não** é indexado para superfície corporal — vem em mL/min absolutos, que é o que a dose de medicamento precisa.',
      ],
      alertas: ['A fórmula superestima o clearance em obesos quando alimentada com peso real e o subestima em caquéticos. A escolha do peso é a decisão mais importante do cálculo.'],
    }
  },
  formula: ['ClCr = [(140 − idade) × peso em kg] ÷ (72 × creatinina) × 0,85 se ♀', 'Peso ajustado = peso ideal + 0,4 × (peso real − peso ideal)'],
  fundamento:
    'A fórmula foi publicada em 1976 a partir de 249 homens, com o fator 0,85 para mulheres derivado por extrapolação da menor massa muscular média — não por medida direta. Sua imprecisão é reconhecida, mas sua permanência não é inércia: é rastreabilidade. Ajustar uma dose por uma fórmula diferente daquela usada no ensaio que definiu o ajuste introduz um erro sistemático desconhecido. A fórmula estima o clearance a partir do princípio de que a creatinina plasmática, em equilíbrio, é o quociente entre produção e depuração: a **produção** é presumida pela massa muscular (daí peso, idade e sexo no numerador, com o fator 0,85 para mulheres) e a **depuração** é o que se quer descobrir. Ela superestima sistematicamente porque mede clearance de creatinina, e não filtração: uma fração da creatinina urinária vem de **secreção tubular** pelo transportador de cátions orgânicos, que inflaciona o resultado justamente quando a filtração já está reduzida.',
  armadilhas: [
    'Não use em lesão renal aguda: a fórmula pressupõe creatinina em estado de equilíbrio, e numa creatinina que ainda está subindo o clearance real é muito menor do que o calculado.',
    'Em idosos com creatinina abaixo de 0,8 mg/dL, alguns serviços arredondam para 1,0 a fim de evitar superestimativa. A prática é debatida e pode levar a subdose — decida por protocolo institucional, não caso a caso.',
  ],
  referencias: [
    { texto: 'Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41.' },
    { texto: 'Steinberg BA, Shrader P, Thomas L, et al. Off-label dosing of non-vitamin K antagonist oral anticoagulants and adverse outcomes (ORBIT-AF II). J Am Coll Cardiol. 2016;68(24):2597-2604.' },
  ],
}

const schwartz: Ferramenta = {
  id: 'tfg-pediatrica',
  nome: 'Função renal pediátrica (Schwartz)',
  sinonimos: ['schwartz', 'tfg crianca', 'clearance pediatrico'],
  resumo: 'Estima a filtração glomerular em crianças a partir da altura e da creatinina.',
  categorias: ['nefrologia', 'pediatria'],
  campos: [
    campoAltura({ min: 40, max: 200, ajuda: 'Comprimento em lactentes, estatura em pé a partir dos 2 anos.' }),
    campoCreatinina({ ajuda: 'A fórmula atual (2009) pressupõe creatinina dosada por método enzimático rastreável a espectrometria de massa por diluição isotópica.' }),
    campoNum('idade', 'Idade', { unidade: 'anos', min: 0, max: 21, passo: 0.1, opcional: true }),
  ],
  calcular: (v) => {
    const altura = num(v, 'altura')
    const cr = num(v, 'creatinina')
    const idade = num(v, 'idade')
    if (altura === null || cr === null || cr <= 0) return null
    const bedside = (0.413 * altura) / cr
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Fórmula à beira do leito (2009)', valor: `${fmtInt(bedside)} mL/min/1,73 m²`, nota: 'k = 0,413 para todas as idades entre 1 e 16 anos, com creatinina enzimática.' },
    ]
    if (idade !== null) {
      const kAntigo = idade < 1 ? 0.45 : idade < 13 ? 0.55 : opc(v, 'sexo') === 'f' ? 0.55 : 0.7
      detalhes.push({ rotulo: 'Fórmula clássica (k variável)', valor: `${fmtInt((kAntigo * altura) / cr)} mL/min/1,73 m²`, nota: `k = ${kAntigo} para esta faixa etária. Válida para creatinina por método de Jaffe, hoje pouco usado.` })
      if (idade < 1) detalhes.push({ rotulo: 'Atenção', valor: 'Lactente', nota: 'Abaixo de 1 ano a filtração ainda está amadurecendo: valores fisiológicos são muito menores e a interpretação exige curva de referência por idade.', nivel: 'atencao' })
    }
    const referencia = idade !== null && idade < 2 ? 'Em lactentes, a TFG normal é fisiologicamente baixa: cerca de 20 a 40 mL/min/1,73 m² ao nascer, chegando a valores de adulto por volta dos 2 anos.' : 'Referência a partir dos 2 anos: ≥ 90 mL/min/1,73 m².'
    const nivel: Nivel = bedside >= 90 ? 'ok' : bedside >= 60 ? 'atencao' : bedside >= 30 ? 'alerta' : 'critico'
    return {
      titulo: 'TFG estimada (Schwartz)',
      valor: fmtInt(bedside),
      unidade: 'mL/min/1,73 m²',
      nivel,
      detalhes,
      conduta: [
        'Use a **fórmula de Schwartz atualizada (0,413 × altura em cm ÷ creatinina)** para crianças e adolescentes: a fórmula original, com constantes variando por idade e sexo, foi calibrada para métodos de creatinina antigos e superestima a filtração em cerca de 20% nos laboratórios atuais, que usam método rastreável por espectrometria de massa.',
        'Lembre que os **valores normais são diferentes por idade**: o recém-nascido a termo filtra cerca de 20–40 mL/min/1,73 m², atinge cerca de 60 no primeiro mês e só alcança o valor adulto (aproximadamente 120) entre 1 e 2 anos. Aplicar o corte adulto de 90 a um lactente rotula como doente uma criança normal.',
        'A **altura é a variável de maior peso** da fórmula e a mais mal medida na prática. Meça em régua horizontal até os 2 anos e em estadiômetro depois disso — estimar a altura transporta o erro diretamente para a filtração e para a dose dos fármacos.',
        'Ajuste antimicrobianos, antivirais e quimioterápicos pela filtração calculada, e reveja o cálculo a cada mudança significativa de altura ou de creatinina. Em crianças em crescimento, uma filtração \'estável\' em mL/min/1,73 m² com altura subindo pode esconder perda funcional.',
        '**Encaminhe ao nefrologista pediátrico** diante de filtração persistentemente baixa para a idade, proteinúria, hematúria glomerular, hipertensão, alteração ultrassonográfica do trato urinário ou história familiar de doença renal — as causas em pediatria são majoritariamente congênitas (displasia, uropatia obstrutiva, refluxo) e o diagnóstico precoce preserva função.',
      ],
      interpretacao: [
        'A fórmula é elegante porque a altura funciona como aproximação da massa muscular na criança — a mesma variável que a creatinina reflete. A constante k incorpora essa relação e foi recalibrada em 2009, quando a dosagem de creatinina migrou do método de Jaffe para o enzimático.',
        referencia,
        'Os valores normais variam com a idade: o recém-nascido a termo filtra cerca de 20 a 40 mL/min/1,73 m², chega a cerca de 60 no primeiro mês e só alcança o valor adulto entre 1 e 2 anos. Aplicar o corte adulto de 90 a um lactente rotula como doente uma criança normal.',
      ],
      alertas: ['Confirme o método de dosagem da creatinina no laboratório. Usar k = 0,413 com creatinina por Jaffe superestima a filtração.'],
    }
  },
  formula: ['TFG = 0,413 × altura em cm ÷ creatinina em mg/dL'],
  fundamento:
    'George Schwartz demonstrou nos anos 1970 que a razão entre altura e creatinina se correlaciona linearmente com o clearance de inulina em crianças, com uma constante de proporcionalidade que varia com a idade e o sexo apenas porque a relação entre altura e massa muscular varia. A versão de 2009, derivada da coorte CKiD, unificou a constante em 0,413 para creatinina padronizada. A constante 0,413 da fórmula de Schwartz atualizada substituiu as constantes variáveis por idade e sexo da versão original porque o método de dosagem da creatinina mudou: os ensaios antigos, de Jaffé não compensado, superestimavam a creatinina por interferência de cromógenos não creatinínicos, e a recalibração para métodos rastreáveis por espectrometria de massa exigiu reestimar o coeficiente. A altura entra na fórmula como substituto da massa muscular, que é a fonte da creatinina e que cresce proporcionalmente à estatura na infância.',
  armadilhas: [
    'Não se aplica a recém-nascidos nem a prematuros, cuja função renal ainda está em maturação e cuja creatinina inicial reflete a materna.',
    'Perde acurácia em crianças com massa muscular atípica: paralisia cerebral, distrofias, obesidade grave, desnutrição.',
  ],
  referencias: [
    { texto: 'Schwartz GJ, Muñoz A, Schneider MF, et al. New equations to estimate GFR in children with CKD. J Am Soc Nephrol. 2009;20(3):629-637.' },
    { texto: 'Pierce CB, Muñoz A, Ng DK, et al. Age- and sex-dependent clinical equations to estimate glomerular filtration rates in children and young adults with chronic kidney disease. Kidney Int. 2021;99(4):948-956.' },
  ],
}

const sodioCorrigido: Ferramenta = {
  id: 'sodio-corrigido',
  nome: 'Sódio corrigido pela glicemia',
  sinonimos: ['sodio corrigido', 'pseudo-hiponatremia', 'hiponatremia diabetes', 'natremia'],
  resumo: 'Revela o sódio verdadeiro por trás da hiponatremia dilucional da hiperglicemia.',
  categorias: ['nefrologia', 'endocrinologia'],
  campos: [
    campoNum('na', 'Sódio medido', { unidade: 'mEq/L', min: 90, max: 190, passo: 1, normalMin: 135, normalMax: 145, ajuda: 'O sódio do laboratório, sem nenhuma correção prévia. Se houver hipertrigliceridemia grave ou hiperproteinemia, o valor pode estar artificialmente baixo pelo método de potenciometria indireta — nesse caso peça potenciometria direta (gasometria), porque o erro é analítico e não se corrige por fórmula.' }),
    campoNum('glicose', 'Glicemia', { unidade: 'mg/dL', min: 40, max: 2000, passo: 1, normalMin: 70, normalMax: 99, ajuda: 'Do mesmo momento da coleta do sódio. Acima de 400 mg/dL a relação deixa de ser linear e o fator de Katz subestima — prefira a leitura de Hillier nessa faixa.' }),
  ],
  calcular: (v) => {
    const na = num(v, 'na')
    const g = num(v, 'glicose')
    if (na === null || g === null) return null
    const excesso = (g - 100) / 100
    const katz = na + 1.6 * excesso
    const hillier = na + 2.4 * excesso
    const nivel: Nivel = katz < 120 || katz > 155 ? 'critico' : katz < 130 || katz > 148 ? 'alerta' : katz < 135 ? 'atencao' : 'ok'
    return {
      titulo: 'Sódio corrigido (Katz)',
      valor: fmt(katz, 1),
      unidade: 'mEq/L',
      nivel,
      rotuloNivel: katz < 135 ? 'Hiponatremia verdadeira' : katz > 145 ? 'Hipernatremia verdadeira' : 'Sódio verdadeiro normal',
      detalhes: [
        { rotulo: 'Correção de Katz (1,6 por 100 mg/dL)', valor: `${fmt(katz, 1)} mEq/L`, nota: 'A mais usada e a citada na maioria das diretrizes.' },
        { rotulo: 'Correção de Hillier (2,4 por 100 mg/dL)', valor: `${fmt(hillier, 1)} mEq/L`, nota: 'Derivada experimentalmente e mais acurada com glicemia acima de 400 mg/dL.' },
        { rotulo: 'Sódio medido', valor: `${fmt(na, 1)} mEq/L` },
        { rotulo: 'Diferença aplicada', valor: `+${fmt(1.6 * excesso, 1)} mEq/L (Katz)` },
      ],
      interpretacao: [
        'A glicose não entra livremente na célula sem insulina, então na hiperglicemia ela fica no extracelular e puxa água de dentro das células. Esse deslocamento dilui o sódio: a hiponatremia é **verdadeira** enquanto durar a hiperglicemia, mas é **dilucional** — não indica excesso de água corporal total nem exige restrição hídrica.',
        katz >= 135
          ? 'O sódio corrigido está na faixa normal: toda a hiponatremia observada se explica pela hiperglicemia. Ao tratar a glicemia, o sódio medido subirá sozinho.'
          : 'Mesmo após a correção o sódio permanece baixo: há hiponatremia verdadeira somada à dilucional, e ela precisa ser investigada e tratada por conta própria.',
        'Na cetoacidose diabética e no estado hiperglicêmico hiperosmolar, acompanhar o **sódio corrigido** é o que revela se o tratamento está indo bem: ele deve subir lentamente conforme a glicemia cai. Sódio corrigido que cai durante o tratamento é sinal de reposição hídrica excessiva e alerta para edema cerebral, sobretudo em crianças.',
        'Vale distinguir com precisão os três conceitos que essa conta articula, porque confundi-los leva a condutas opostas. A **osmolalidade** é a concentração total de solutos; a **tonicidade** (ou osmolalidade efetiva) considera apenas os solutos que não atravessam livremente a membrana e portanto geram movimento de água. A glicose sem insulina é um osmol **efetivo**: ela permanece no extracelular, cria gradiente osmótico e puxa água de dentro das células — daí a hiponatremia dilucional com osmolalidade alta e desidratação intracelular. A ureia, ao contrário, atravessa livremente as membranas e é osmol **inefetivo**: eleva a osmolalidade medida sem gerar movimento de água, razão pela qual o urêmico não fica com célula murcha. Isso explica por que a fórmula da osmolalidade efetiva usa apenas sódio e glicose, e por que o paciente da cetoacidose está simultaneamente com hiponatremia medida, hiperosmolalidade e desidratação celular — três achados que parecem contraditórios e não são.',
        'O risco de **edema cerebral** no tratamento tem base fisiológica que justifica o monitoramento do sódio corrigido. Durante horas ou dias de hiperglicemia, o neurônio se adapta à hipertonicidade extracelular gerando **osmóis idiogênicos** — mio-inositol, taurina, glutamina, glutamato — que restauram seu volume. Essas moléculas levam tempo para serem eliminadas quando a tonicidade externa cai. Se a glicemia despenca rapidamente e a reposição hídrica é excessiva, o extracelular fica hipotônico em relação a um neurônio ainda carregado de osmóis, e a água entra na célula. No adulto o crânio ainda acomoda algum edema; na criança, com menos espaço liquórico proporcional, o desfecho pode ser herniação. É por isso que a regra é queda de glicemia controlada (50 a 75 mg/dL por hora) e sódio corrigido que **sobe** durante o tratamento.',
      ],
      conduta: katz >= 135
        ? [
            'O sódio corrigido está na faixa normal: **toda** a hiponatremia observada se explica pela hiperglicemia. Não restrinja água, não administre salina hipertônica e não investigue SIADH — ao tratar a glicemia, o sódio medido subirá sozinho.',
            'Trate a hiperglicemia pela causa: se houver cetoacidose ou estado hiperglicêmico hiperosmolar, siga o protocolo com volume, insulina intravenosa contínua e reposição de potássio — lembrando que a insulina só entra depois de o potássio estar acima de 3,3 mEq/L.',
            'Monitore o sódio **corrigido** a cada 2 a 4 horas durante o tratamento. Ele deve **subir** lentamente conforme a glicemia cai. Sódio corrigido que cai é sinal de reposição hídrica excessiva e alerta precoce de edema cerebral, sobretudo em crianças e adolescentes.',
            'Controle a velocidade de queda da glicemia em 50 a 75 mg/dL por hora e acrescente glicose ao soro quando ela atingir 200 a 250 mg/dL, mantendo a insulina — o objetivo é fechar a cetogênese, não normalizar a glicemia rapidamente.',
          ]
        : [
            'Mesmo após a correção o sódio permanece baixo: há **hiponatremia verdadeira somada à dilucional**, e ela precisa de investigação própria. A hiperglicemia explicava parte do quadro, não tudo.',
            'Investigue a hiponatremia verdadeira pelo algoritmo padrão: avalie **volemia** clinicamente, e dose **osmolalidade sérica, osmolalidade urinária e sódio urinário**. Osmolalidade urinária abaixo de 100 mOsm/kg aponta polidipsia primária ou baixa ingestão de soluto; acima disso, o sódio urinário separa perda renal (acima de 30 mEq/L: diurético, insuficiência adrenal, nefropatia perdedora de sal, SIADH) de perda extrarrenal ou estado edematoso (abaixo de 30 mEq/L: vômitos, diarreia, terceiro espaço, insuficiência cardíaca, cirrose).',
            katz < 120
              ? '**Sódio corrigido abaixo de 120 mEq/L é emergência.** Se houver sintomas neurológicos graves (crise convulsiva, rebaixamento, vômitos incoercíveis), administre salina hipertônica a 3% em bolus de 100 a 150 mL, repetível até duas vezes, com alvo de elevação de 4 a 6 mEq/L nas primeiras horas — o suficiente para reverter o edema cerebral.'
              : 'Trate conforme a causa e a velocidade de instalação: hiponatremia crônica (mais de 48 horas) corrige devagar; aguda e sintomática admite correção inicial mais rápida.',
            'Respeite os **limites de velocidade de correção**: no máximo 8 mEq/L em 24 horas (6 mEq/L em pacientes de alto risco — desnutridos, alcoolistas, hipocalêmicos, hepatopatas, com sódio abaixo de 105). Ultrapassar esse limite causa **síndrome de desmielinização osmótica**, cujo quadro (tetraparesia, disartria, disfagia, síndrome do encarceramento) surge dias depois e é frequentemente irreversível.',
            'Atenção à **autocorreção**: ao tratar a causa (repor volume na hipovolemia, suspender diurético, corrigir insuficiência adrenal), a vasopressina se desliga e o rim excreta água livre rapidamente, elevando o sódio muito além do planejado. Monitore o sódio a cada 2 a 4 horas e esteja preparado para reverter com água livre ou desmopressina se a correção acelerar demais.',
            'Reponha potássio e magnésio em paralelo — e lembre que o potássio administrado também eleva o sódio sérico, entrando no cálculo da velocidade de correção.',
          ],
      alertas: [
        'O sódio corrigido é um número para **interpretar**, não uma meta a atingir com salina. Tratar o valor corrigido com hipertônica em paciente cuja hiponatremia é puramente dilucional causa hipernatremia iatrogênica quando a glicemia normalizar.',
        'Sódio corrigido que **cai** durante o tratamento da cetoacidose indica reposição hídrica excessiva e é sinal de alerta para edema cerebral — sobretudo em criança e adolescente, em que o desfecho pode ser herniação.',
        'A velocidade de correção da hiponatremia verdadeira tem teto rígido: 8 mEq/L em 24 horas, ou 6 mEq/L em alto risco. A síndrome de desmielinização osmótica aparece dias depois e costuma ser irreversível.',
        'Não confunda com **pseudo-hiponatremia** verdadeira, que ocorre em hipertrigliceridemia grave e hiperproteinemia com método de potenciometria indireta: nela a osmolalidade é **normal** e não há correção matemática a fazer — o erro é analítico e se resolve pedindo potenciometria direta (gasometria).',
        'Em glicemias acima de 400 mg/dL a relação deixa de ser linear e o fator de Katz subestima. Use Hillier (2,4) nessa faixa.',
      ],
      tabela: {
        titulo: 'Como distinguir os três padrões de hiponatremia com glicemia alta',
        colunas: ['Padrão', 'Osmolalidade', 'Sódio corrigido', 'Conduta'],
        linhas: [
          ['Dilucional pela hiperglicemia', 'Alta', 'Normal', 'Tratar a glicemia; o sódio sobe sozinho'],
          ['Verdadeira + dilucional', 'Variável', 'Ainda baixo', 'Investigar e tratar as duas, respeitando limites'],
          ['Pseudo-hiponatremia analítica', 'Normal', 'Não se aplica', 'Repetir por potenciometria direta'],
        ],
        destaque: katz >= 135 ? 0 : 1,
      },
    }
  },
  formula: ['Katz: Na corrigido = Na medido + 1,6 × (glicemia − 100)/100', 'Hillier: Na corrigido = Na medido + 2,4 × (glicemia − 100)/100'],
  fundamento:
    'Katz derivou o fator 1,6 teoricamente, em 1973, a partir da distribuição de água entre compartimentos. Hillier e colaboradores mediram experimentalmente em 1999, infundindo glicose em voluntários, e encontraram 2,4 — com relação não linear, mais próxima de 1,6 abaixo de 400 mg/dL e maior acima disso. Na prática, use Katz como padrão e Hillier quando a glicemia for muito alta. O fenômeno que a fórmula descreve depende de a glicose ser um osmol **efetivo**: sem insulina ela não entra na célula, permanece no extracelular, cria gradiente osmótico e puxa água de dentro das células para fora. Esse influxo de água dilui o sódio extracelular — e a hiponatremia resultante é real na medição, mas dilucional na natureza: não há excesso de água corporal total nem indicação de restrição hídrica. Pelo contrário, o paciente da cetoacidose está desidratado, com déficit de água e de sódio corporais. A distinção entre osmol efetivo e inefetivo é o conceito central: a ureia atravessa livremente as membranas e eleva a osmolalidade medida sem gerar movimento de água (osmol inefetivo), razão pela qual o urêmico não tem desidratação celular, enquanto glicose e manitol geram movimento e são efetivos. Por isso a osmolalidade efetiva, ou tonicidade, usa apenas sódio e glicose. Clinicamente, o maior valor da correção não é diagnóstico, e sim de **monitoramento**: durante o tratamento da cetoacidose, o sódio corrigido deve subir lentamente conforme a glicemia cai. Se ele cai, a reposição hídrica está excessiva — e como o neurônio passou horas gerando osmóis idiogênicos (mio-inositol, taurina, glutamina) para se adaptar à hipertonicidade, uma queda rápida de tonicidade extracelular faz água entrar na célula e pode causar edema cerebral, complicação rara mas devastadora em crianças e adolescentes.',
  armadilhas: [
    'A "pseudo-hiponatremia" verdadeira é outra coisa: ocorre em hipertrigliceridemia grave e hiperproteinemia, com o método indireto de potenciometria, e nela a osmolalidade é normal. Na hiperglicemia a osmolalidade está alta.',
    'Não confunda correção matemática com correção terapêutica: o sódio corrigido é um número para interpretar, não uma meta a atingir com salina.',
    'Em glicemias acima de 400 mg/dL a relação deixa de ser linear e o fator 1,6 de Katz subestima a correção. Nessa faixa, prefira Hillier (2,4).',
    'Sódio corrigido que cai durante o tratamento da cetoacidose é reposição hídrica excessiva, não melhora. É o sinal de alerta mais precoce de edema cerebral em criança e adolescente.',
    'A hiponatremia dilucional da hiperglicemia não exige restrição hídrica — o paciente da cetoacidose está desidratado, e restringir água piora a perfusão.',
    'Na hiponatremia verdadeira somada, cuidado com a autocorreção: ao tratar a causa, a vasopressina se desliga e o rim excreta água livre depressa, podendo ultrapassar o limite de 8 mEq/L em 24 horas sem nenhuma salina.',
    'A glicose é osmol efetivo (gera movimento de água) e a ureia é osmol inefetivo (não gera). Por isso a osmolalidade efetiva usa apenas sódio e glicose, e o urêmico não tem desidratação celular.',
  ],
  referencias: [
    { texto: 'Katz MA. Hyperglycemia-induced hyponatremia — calculation of expected serum sodium depression. N Engl J Med. 1973;289(16):843-844.' },
    { texto: 'Hillier TA, Abbott RD, Barrett EJ. Hyponatremia: evaluating the correction factor for hyperglycemia. Am J Med. 1999;106(4):399-403.' },
  ],
}

const calcioCorrigido: Ferramenta = {
  id: 'calcio-corrigido',
  nome: 'Cálcio corrigido pela albumina',
  sinonimos: ['calcio corrigido', 'hipocalcemia', 'calcio ionizado'],
  resumo: 'Ajusta o cálcio total pela albumina, e explica quando isso não basta.',
  categorias: ['nefrologia', 'endocrinologia'],
  campos: [
    campoNum('calcio', 'Cálcio total', { unidade: 'mg/dL', min: 3, max: 20, passo: 0.1, normalMin: 8.5, normalMax: 10.5 }),
    campoNum('albumina', 'Albumina', { unidade: 'g/dL', min: 0.5, max: 6, passo: 0.1, normalMin: 3.5, normalMax: 5 }),
    campoNum('ph', 'pH arterial', { min: 6.8, max: 7.8, passo: 0.01, opcional: true, ajuda: 'Opcional. Alcalose aumenta a ligação do cálcio à albumina e reduz o cálcio ionizado sem mudar o total.' }),
  ],
  calcular: (v) => {
    const ca = num(v, 'calcio')
    const alb = num(v, 'albumina')
    const ph = num(v, 'ph')
    if (ca === null || alb === null) return null
    const corr = ca + 0.8 * (4 - alb)
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Cálcio total medido', valor: `${fmt(ca, 2)} mg/dL` },
      { rotulo: 'Correção aplicada', valor: `${0.8 * (4 - alb) >= 0 ? '+' : ''}${fmt(0.8 * (4 - alb), 2)} mg/dL`, nota: '0,8 mg/dL por g/dL de albumina abaixo de 4,0' },
      { rotulo: 'Faixa de referência', valor: '8,5 a 10,5 mg/dL' },
    ]
    if (ph !== null) {
      const delta = (7.4 - ph) * 0.36
      detalhes.push({
        rotulo: 'Efeito estimado do pH sobre o cálcio ionizado',
        valor: `${delta >= 0 ? '+' : ''}${fmt(delta, 2)} mg/dL`,
        nota: ph > 7.45 ? 'Alcalose: mais cálcio se liga à albumina e o ionizado cai — é o mecanismo da tetania da hiperventilação, com cálcio total normal.' : ph < 7.35 ? 'Acidose: menos cálcio ligado, ionizado mais alto — a correção da acidose pode desmascarar hipocalcemia.' : 'pH neutro, sem efeito relevante.',
      })
    }
    const nivel: Nivel = corr < 7 || corr > 13 ? 'critico' : corr < 8.5 || corr > 10.5 ? 'alerta' : 'ok'
    return {
      titulo: 'Cálcio corrigido',
      valor: fmt(corr, 2),
      unidade: 'mg/dL',
      nivel,
      rotuloNivel: corr < 8.5 ? 'Hipocalcemia' : corr > 10.5 ? 'Hipercalcemia' : 'Normal',
      detalhes,
      conduta: [
        'Corrija sempre que a **albumina estiver abaixo de 4 g/dL**: cerca de 40% do cálcio circula ligado à albumina, e o laboratório dosa o cálcio total. Sem a correção, a hipoalbuminemia da UTI, da cirrose e da síndrome nefrótica faz parecer hipocalcemia onde o cálcio ionizado está normal — e leva a reposições desnecessárias.',
        'Quando a decisão for crítica, **meça o cálcio ionizado** em vez de corrigir. A fórmula de correção é uma aproximação de desempenho limitado em doente crítico, e o ionizado é a fração biologicamente ativa. Colha em anaerobiose, pois a alcalose da amostra reduz o ionizado ao aumentar a ligação à albumina.',
        'Em **hipocalcemia sintomática** (parestesias periorais, espasmo carpopedal, sinais de Chvostek e Trousseau, laringoespasmo, convulsão, prolongamento do QT), reponha **gluconato de cálcio 1–2 g IV diluído, em 10–20 minutos**, seguido de infusão contínua. Não use cloreto de cálcio por veia periférica — ele é esclerosante e causa necrose na extravasação.',
        'Antes de repor, **dose o magnésio**: a hipomagnesemia causa hipocalcemia refratária por bloquear a secreção e a ação periférica do paratormônio. Repor cálcio sem corrigir o magnésio simplesmente não funciona, e essa é a causa mais comum de falha terapêutica.',
        'Na **hipercalcemia > 14 mg/dL ou sintomática**, comece por hidratação com solução salina isotônica (200–300 mL/h), acrescente calcitonina para efeito rápido (que se esgota por taquifilaxia em 48 h) e **bisfosfonato ou denosumabe** para efeito sustentado. Furosemida só depois da reposição volêmica, e diálise em casos graves com insuficiência renal ou cardíaca. Investigue paratormônio: alto ou inapropriadamente normal aponta hiperparatireoidismo; suprimido aponta malignidade, intoxicação por vitamina D ou doença granulomatosa.',
      ],
      alertas: [
        'A fórmula de correção tem desempenho limitado no doente crítico. Quando a decisão for crítica, meça o **cálcio ionizado**, colhido em anaerobiose.',
        'Hipocalcemia refratária à reposição quase sempre é hipomagnesemia não corrigida: sem magnésio, o paratormônio não é secretado nem age.',
      ],
      interpretacao: [
        'Cerca de 40% do cálcio circulante está ligado à albumina, 10% a ânions e apenas 50% está livre — e só a fração livre é biologicamente ativa. Quando a albumina cai, o cálcio total cai junto sem que o ionizado mude, e é isso que a correção tenta desfazer.',
        '**A correção é uma aproximação frágil.** Estudos em pacientes críticos mostram concordância ruim entre o cálcio corrigido e o ionizado medido. Sempre que a decisão depender do valor — hipocalcemia sintomática, transfusão maciça, pós-tireoidectomia, doença renal crônica avançada, pancreatite —, **meça o cálcio ionizado**, que a gasometria já fornece.',
        corr < 8.5
          ? 'Hipocalcemia: procure hipoparatireoidismo (pós-cirúrgico é a causa mais comum), deficiência de vitamina D, hipomagnesemia (que causa resistência e deficiência funcional de PTH e precisa ser corrigida antes), pancreatite, rabdomiólise, síndrome de lise tumoral e quelação por citrato em transfusão maciça.'
          : corr > 10.5
            ? 'Hipercalcemia: hiperparatireoidismo primário e malignidade respondem por mais de 90% dos casos. Ambulatorialmente predomina o primeiro; em internados, o segundo. Dose PTH — se estiver alto ou inapropriadamente normal, é paratireoide.'
            : 'Cálcio corrigido dentro da faixa de referência.',
      ],
    }
  },
  formula: ['Ca corrigido = Ca total + 0,8 × (4,0 − albumina em g/dL)'],
  fundamento:
    'A fórmula pressupõe uma relação linear e constante entre albumina e cálcio ligado, com afinidade fixa. Nenhuma dessas premissas se sustenta bem em paciente crítico, em quem o pH oscila, a albumina é alterada em qualidade além de quantidade e há competição por citrato e outros ânions. Ela permanece útil como triagem ambulatorial e como sinalizador — nunca como substituto do ionizado quando há decisão em jogo.',
  armadilhas: [
    'Garroteamento prolongado durante a coleta eleva falsamente o cálcio total por hemoconcentração.',
    'Em hipoalbuminemia grave (< 2 g/dL) a fórmula perde acurácia justamente onde é mais invocada.',
  ],
  referencias: [
    { texto: 'Payne RB, Little AJ, Williams RB, Milner JR. Interpretation of serum calcium in patients with abnormal serum proteins. Br Med J. 1973;4(5893):643-646.' },
    { texto: 'Steele T, Kolamunnage-Dona R, Downey C, Toh CH, Welters I. Assessment and clinical course of hypocalcemia in critical illness. Crit Care. 2013;17(3):R106.' },
  ],
}

const osmolaridade: Ferramenta = {
  id: 'osmolaridade-plasmatica',
  nome: 'Osmolaridade plasmática calculada e osmolalidade efetiva',
  sinonimos: ['osmolaridade', 'osmolalidade', 'tonicidade', 'osmolaridade efetiva'],
  resumo: 'Calcula a osmolaridade total e a efetiva (tonicidade), que são coisas diferentes.',
  categorias: ['nefrologia', 'endocrinologia', 'emergencia'],
  campos: [
    campoNum('na', 'Sódio', { unidade: 'mEq/L', min: 90, max: 190, passo: 1 }),
    campoNum('glicose', 'Glicose', { unidade: 'mg/dL', min: 20, max: 2000, passo: 1 }),
    campoNum('ureia', 'Ureia', { unidade: 'mg/dL', min: 5, max: 400, passo: 1, ajuda: 'Se o laboratório reporta BUN, multiplique por 2,14 para obter ureia.' }),
    campoNum('etanol', 'Etanol', { unidade: 'mg/dL', min: 0, max: 600, passo: 1, padrao: '0', opcional: true }),
  ],
  calcular: (v) => {
    const na = num(v, 'na')
    const g = num(v, 'glicose')
    const u = num(v, 'ureia')
    const etanol = numOu(v, 'etanol', 0)
    if (na === null || g === null || u === null) return null
    const total = 2 * na + g / 18 + u / 6 + etanol / 4.6
    const efetiva = 2 * na + g / 18
    const nivel: Nivel = efetiva > 320 ? 'critico' : efetiva > 300 || efetiva < 275 ? 'alerta' : 'ok'
    return {
      titulo: 'Osmolaridade calculada',
      valor: fmt(total, 1),
      unidade: 'mOsm/kg',
      nivel,
      rotuloNivel: `Osmolalidade efetiva de ${fmt(efetiva, 1)} mOsm/kg`,
      detalhes: [
        { rotulo: 'Osmolaridade total', valor: `${fmt(total, 1)} mOsm/kg`, nota: 'Referência 275 a 295. Inclui a ureia, que é osmoticamente **inefetiva**.' },
        { rotulo: 'Osmolalidade efetiva (tonicidade)', valor: `${fmt(efetiva, 1)} mOsm/kg`, nota: 'É a que move água entre compartimentos e a que importa no cérebro.' },
        { rotulo: 'Contribuição do sódio', valor: `${fmt(2 * na, 1)} mOsm/kg`, nota: `${fmtPct(((2 * na) / total) * 100, 0)} do total` },
        { rotulo: 'Contribuição da glicose', valor: `${fmt(g / 18, 1)} mOsm/kg` },
        { rotulo: 'Contribuição da ureia', valor: `${fmt(u / 6, 1)} mOsm/kg`, nota: 'A ureia atravessa livremente a membrana celular e equilibra dos dois lados, por isso não gera gradiente osmótico.' },
      ],
      conduta: [
        'Compare sempre a osmolaridade **calculada** com a **medida** no laboratório: a diferença é o **gap osmolar**. Um gap acima de 10 mOsm/kg indica um soluto osmoticamente ativo que a fórmula não contempla — e essa é a única forma rápida de suspeitar de intoxicação por metanol ou etilenoglicol antes que a dosagem específica fique pronta.',
        'Separe **osmolaridade total** de **osmolalidade efetiva (tonicidade)**: a ureia atravessa livremente as membranas e não gera gradiente osmótico, de modo que o urêmico tem osmolaridade alta sem desidratação celular. É a tonicidade — sódio e glicose — que determina o movimento de água e os sintomas neurológicos.',
        'Na **hiperglicemia**, corrija o sódio antes de interpretar: some **1,6 mEq/L ao sódio medido para cada 100 mg/dL de glicose acima de 100** (fator de 2,4 acima de 400 mg/dL). A hiponatremia da cetoacidose costuma ser dilucional e desaparece com o tratamento — tratá-la como hiponatremia verdadeira é erro grave.',
        '**Osmolalidade efetiva > 320 mOsm/kg** com glicemia muito alta e sem cetose significativa caracteriza o **estado hiperglicêmico hiperosmolar**. A conduta é reposição volêmica agressiva primeiro, insulina depois e reposição de potássio antecipada — o déficit de água costuma passar de 8 a 10 litros.',
        'Use a osmolaridade para avaliar a resposta ao **manitol** e à salina hipertônica em hipertensão intracraniana: a meta habitual é 300–320 mOsm/kg. Acima disso, o risco de lesão renal aguda pelo manitol cresce, e o gap osmolar serve para detectar seu acúmulo em pacientes com filtração reduzida.',
      ],
      alertas: [
        'Osmolaridade alta não significa desidratação celular: a ureia atravessa livremente as membranas e não gera gradiente osmótico. É a **tonicidade** — sódio e glicose — que move água e produz sintoma neurológico.',
        'Na hiperglicemia, corrija o sódio antes de interpretar. A hiponatremia da cetoacidose costuma ser dilucional e desaparece com o tratamento; tratá-la como hiponatremia verdadeira é erro grave.',
      ],
      interpretacao: [
        'A distinção entre osmolaridade **total** e **efetiva** é a que mais gera confusão e a que mais muda conduta. A ureia sobe muito na uremia e eleva a osmolaridade total sem desidratar célula nenhuma, porque atravessa a membrana. Já sódio e glicose ficam do lado de fora e puxam água.',
        efetiva > 320
          ? 'Osmolalidade efetiva acima de 320 mOsm/kg é um dos critérios diagnósticos do **estado hiperglicêmico hiperosmolar**, junto com glicemia acima de 600 mg/dL e ausência de cetoacidose significativa.'
          : efetiva < 275
            ? 'Osmolalidade efetiva baixa confirma hiponatremia hipotônica — a forma que exige investigação de volemia, osmolalidade urinária e sódio urinário.'
            : 'Osmolalidade efetiva dentro da faixa de referência.',
        'Compare sempre com a osmolalidade **medida** quando houver suspeita de intoxicação: a diferença entre as duas é o gap osmolar, e um gap elevado aponta álcool tóxico.',
      ],
    }
  },
  formula: [
    'Osm total = 2 × Na⁺ + glicose/18 + ureia/6 (+ etanol/4,6)',
    'Osm efetiva = 2 × Na⁺ + glicose/18',
    'Se o laboratório reporta BUN: substitua ureia/6 por BUN/2,8',
  ],
  fundamento:
    'O fator 2 do sódio contabiliza os ânions que o acompanham para manter a neutralidade elétrica — sobretudo cloro e bicarbonato. Os divisores 18 e 6 convertem miligramas por decilitro em milimoles por litro dividindo pelo décimo do peso molecular: glicose tem 180 daltons, ureia tem 60. Só solutos que **não** atravessam livremente a membrana geram tonicidade, e é por isso que a ureia entra na osmolaridade e sai da efetiva.',
  armadilhas: [
    'A confusão entre ureia e BUN é a causa mais frequente de erro. No Brasil, os laboratórios reportam ureia; nos Estados Unidos, BUN. Ureia = BUN × 2,14.',
    'Osmolaridade (por litro de solução) e osmolalidade (por quilo de solvente) são grandezas diferentes; no plasma a diferença é pequena e os termos são usados de forma intercambiável na prática.',
  ],
  referencias: [
    { texto: 'Rasouli M. Basic concepts and practical equations on osmolality: biochemical approach. Clin Biochem. 2016;49(12):936-941.' },
    { texto: 'Sterns RH. Disorders of plasma sodium — causes, consequences, and correction. N Engl J Med. 2015;372(1):55-65.' },
  ],
}

const fena: Ferramenta = {
  id: 'fracao-excrecao-sodio',
  nome: 'Fração de excreção de sódio e de ureia',
  sigla: 'FENa / FEUr',
  sinonimos: ['fena', 'feureia', 'fracao de excrecao', 'pre-renal', 'ntа'],
  resumo: 'Separa a azotemia pré-renal da necrose tubular aguda — inclusive sob diurético.',
  categorias: ['nefrologia'],
  campos: [
    campoNum('naU', 'Sódio urinário', { unidade: 'mEq/L', min: 1, max: 300, passo: 1 }),
    campoNum('naP', 'Sódio plasmático', { unidade: 'mEq/L', min: 90, max: 190, passo: 1 }),
    campoNum('crU', 'Creatinina urinária', { unidade: 'mg/dL', min: 1, max: 500, passo: 1 }),
    campoNum('crP', 'Creatinina plasmática', { unidade: 'mg/dL', min: 0.1, max: 25, passo: 0.01 }),
    campoNum('ureiaU', 'Ureia urinária', { unidade: 'mg/dL', min: 10, max: 5000, passo: 1, opcional: true, ajuda: 'Permite calcular a fração de excreção de ureia, que continua válida sob diurético.' }),
    campoNum('ureiaP', 'Ureia plasmática', { unidade: 'mg/dL', min: 5, max: 400, passo: 1, opcional: true }),
    campoSimNao('diuretico', 'Em uso de diurético', 1, 'Diurético invalida a fração de excreção de sódio; use a de ureia.'),
  ],
  calcular: (v) => {
    const naU = num(v, 'naU')
    const naP = num(v, 'naP')
    const crU = num(v, 'crU')
    const crP = num(v, 'crP')
    if (naU === null || naP === null || crU === null || crP === null || naP <= 0 || crU <= 0) return null
    const fena = ((naU * crP) / (naP * crU)) * 100
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Fração de excreção de sódio', valor: fmtPct(fena, 2), nota: '< 1% sugere pré-renal; > 2% sugere necrose tubular aguda; entre 1 e 2%, zona indeterminada.', nivel: fena < 1 ? 'atencao' : fena > 2 ? 'alerta' : 'neutro' },
    ]
    const ureiaU = num(v, 'ureiaU')
    const ureiaP = num(v, 'ureiaP')
    let feur: number | null = null
    if (ureiaU !== null && ureiaP !== null && ureiaP > 0) {
      feur = ((ureiaU * crP) / (ureiaP * crU)) * 100
      detalhes.push({ rotulo: 'Fração de excreção de ureia', valor: fmtPct(feur, 1), nota: '< 35% sugere pré-renal; > 50 a 65% sugere necrose tubular. Mantém validade sob diurético de alça e tiazídico.', nivel: feur < 35 ? 'atencao' : feur > 50 ? 'alerta' : 'neutro' })
    }
    const usaDiuretico = sim(v, 'diuretico')
    const referencia = usaDiuretico && feur !== null ? feur : fena
    const preRenal = usaDiuretico && feur !== null ? feur < 35 : fena < 1
    const tubular = usaDiuretico && feur !== null ? feur > 50 : fena > 2
    return {
      titulo: usaDiuretico && feur !== null ? 'Fração de excreção de ureia' : 'Fração de excreção de sódio',
      valor: fmtPct(referencia, usaDiuretico && feur !== null ? 1 : 2),
      nivel: preRenal ? 'atencao' : tubular ? 'alerta' : 'neutro',
      rotuloNivel: preRenal ? 'Padrão pré-renal' : tubular ? 'Padrão de necrose tubular aguda' : 'Zona indeterminada',
      detalhes,
      conduta: [
        '**FENa < 1%** aponta causa pré-renal: o rim está íntegro e retendo sódio avidamente em resposta à hipoperfusão. A conduta é restaurar a perfusão — reposição volêmica na hipovolemia, otimização do débito na insuficiência cardíaca, albumina e vasoconstritor esplâncnico na síndrome hepatorrenal.',
        '**FENa > 2%** aponta necrose tubular aguda: o túbulo lesado perdeu a capacidade de reabsorver sódio. Aqui a conduta é de suporte — evitar novos insultos, suspender nefrotóxicos, ajustar doses, manter euvolemia e vigiar indicações de diálise. Volume adicional nesse contexto só gera congestão.',
        '**Use a FEUreia (< 35% para pré-renal) sempre que o paciente estiver em uso de diurético**: o diurético força natriurese e eleva a FENa artificialmente, transformando um quadro pré-renal em aparente necrose tubular. A ureia é reabsorvida no túbulo proximal, fora do sítio de ação dos diuréticos de alça, e mantém a validade do raciocínio.',
        'A FENa também é **baixa em situações que não são pré-renais**: glomerulonefrite aguda, nefropatia por contraste em fase precoce, rabdomiólise inicial, síndrome hepatorrenal e obstrução urinária precoce. E é **alta** em doença renal crônica de base, porque o néfron remanescente já excreta mais sódio por unidade. O índice complementa o quadro clínico, não o substitui.',
        'Complete a avaliação com **sedimento urinário**, que muitas vezes decide sozinho: cilindros granulosos pigmentados apontam necrose tubular, cilindros hemáticos e dismorfismo apontam glomerulonefrite, eosinofilúria sugere nefrite intersticial, e sedimento limpo favorece causa pré-renal ou obstrutiva.',
      ],
      interpretacao: [
        usaDiuretico
          ? '**Diurético em uso.** A fração de excreção de sódio perde validade: o diurético força natriurese mesmo com hipoperfusão, e produz valores acima de 1% em pacientes francamente pré-renais. Use a fração de excreção de ureia, que reflete a reabsorção proximal — território onde os diuréticos de alça e tiazídicos não atuam.'
          : 'Sem diurético, a fração de excreção de sódio é o parâmetro de escolha.',
        preRenal
          ? 'Padrão **pré-renal**: o túbulo está íntegro e retendo sódio avidamente em resposta à hipoperfusão. Considere hipovolemia real, insuficiência cardíaca, cirrose, síndrome hepatorrenal e estenose de artéria renal com inibidor do sistema renina-angiotensina.'
          : tubular
            ? 'Padrão de **necrose tubular aguda**: o túbulo lesado perdeu a capacidade de reabsorver sódio. Isquemia prolongada, sepse, nefrotoxicidade (aminoglicosídeo, anfotericina, contraste, cisplatina), rabdomiólise e hemólise são as causas.'
            : 'Zona indeterminada. A fração de excreção não fecha o diagnóstico sozinha — integre com história, exame do sedimento urinário (cilindros granulosos pigmentados apontam necrose tubular; sedimento inocente aponta pré-renal), resposta à expansão e ultrassom.',
        'Fração de excreção de sódio abaixo de 1% também aparece em causas não pré-renais que preservam o túbulo: glomerulonefrite aguda, nefropatia por contraste em fase inicial, rabdomiólise precoce e obstrução urinária recente. Não é sinônimo de "precisa de volume".',
      ],
      alertas: ['Nunca peça expansão volêmica só porque a fração de excreção está baixa. Em insuficiência cardíaca e cirrose ela está baixa por hipoperfusão renal com volume total aumentado — e volume adicional piora.'],
    }
  },
  formula: [
    'FENa = (Na urinário × Cr plasmática) / (Na plasmática × Cr urinária) × 100',
    'FEUr = (Ureia urinária × Cr plasmática) / (Ureia plasmática × Cr urinária) × 100',
  ],
  fundamento:
    'A fração de excreção pergunta: de todo o sódio que foi filtrado, quanto o rim deixou escapar na urina? Um rim bem perfundido mas hipovolêmico reabsorve quase tudo — abaixo de 1%. Um rim com túbulos lesados não consegue reabsorver e deixa passar mais de 2%. A creatinina entra na fórmula como marcador do volume filtrado, o que dispensa coleta de urina de 24 horas: basta uma amostra isolada pareada com o plasma.',
  armadilhas: [
    'Colha as amostras de sangue e urina simultaneamente. Diferença de horas entre elas invalida o pareamento.',
    'Doença renal crônica avançada altera as faixas de referência — o rim já não responde como o de quem tem função basal normal.',
    'A fração de excreção de ureia tem zona cinzenta ampla (35 a 50%) e não é infalível: uso de corticoide, hemorragia digestiva e catabolismo elevam a ureia por vias independentes.',
  ],
  referencias: [
    { texto: 'Espinel CH. The FENa test: use in the differential diagnosis of acute renal failure. JAMA. 1976;236(6):579-581.' },
    { texto: 'Carvounis CP, Nisar S, Guro-Razuman S. Significance of the fractional excretion of urea in the differential diagnosis of acute renal failure. Kidney Int. 2002;62(6):2223-2229.' },
  ],
}

const deficitAgua: Ferramenta = {
  id: 'deficit-agua-livre',
  nome: 'Déficit de água livre na hipernatremia',
  sinonimos: ['deficit de agua', 'hipernatremia', 'agua livre'],
  resumo: 'Quantifica a água a repor e a velocidade máxima segura de correção.',
  categorias: ['nefrologia', 'emergencia'],
  campos: [
    campoPeso(),
    campoSexo(),
    campoSeg('idoso', 'Faixa etária', [
      { valor: 'nao', rotulo: 'Adulto (< 65 anos)' },
      { valor: 'sim', rotulo: 'Idoso (≥ 65 anos)' },
    ], { ajuda: 'A água corporal total cai com a idade: 60% do peso em homens jovens, 50% em idosos e mulheres jovens, 45% em idosas.' }),
    campoNum('naAtual', 'Sódio atual', { unidade: 'mEq/L', min: 140, max: 200, passo: 1 }),
    campoNum('naAlvo', 'Sódio alvo', { unidade: 'mEq/L', min: 130, max: 160, passo: 1, padrao: '140' }),
    campoSeg('cronico', 'Tempo de instalação', [
      { valor: 'sim', rotulo: 'Crônica ou desconhecida (> 48 h)' },
      { valor: 'nao', rotulo: 'Aguda documentada (< 48 h)' },
    ]),
    campoNum('perdas', 'Perdas insensíveis e urinárias estimadas em 24 h', { unidade: 'mL', min: 0, max: 6000, passo: 100, padrao: '1500', opcional: true }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const naAtual = num(v, 'naAtual')
    const naAlvo = numOu(v, 'naAlvo', 140)
    if (peso === null || naAtual === null || naAlvo <= 0) return null
    const f = opc(v, 'sexo') === 'f'
    const idoso = sim(v, 'idoso')
    const act = aguaCorporal(peso, f, idoso)
    const deficit = act * (naAtual / naAlvo - 1)
    const cronica = sim(v, 'cronico')
    const limite = cronica ? 8 : 12
    const perdas = numOu(v, 'perdas', 1500)
    const quedaPrevista = naAtual - naAlvo
    const horasMinimas = quedaPrevista > 0 ? (quedaPrevista / limite) * 24 : 0
    return {
      titulo: 'Déficit de água livre',
      valor: fmt(deficit, 2),
      unidade: 'L',
      nivel: naAtual >= 160 ? 'critico' : naAtual >= 150 ? 'alerta' : 'atencao',
      rotuloNivel: `Hipernatremia ${cronica ? 'crônica' : 'aguda'} de ${fmtInt(naAtual)} mEq/L`,
      detalhes: [
        { rotulo: 'Água corporal total estimada', valor: `${fmt(act, 1)} L`, nota: `${fmtInt((act / peso) * 100)}% do peso corporal` },
        { rotulo: 'Déficit de água livre', valor: `${fmtInt(deficit * 1000)} mL` },
        { rotulo: 'Perdas contínuas a repor em 24 h', valor: `${fmtInt(perdas)} mL`, nota: 'Insensíveis (cerca de 800 a 1000 mL/dia) mais perdas urinárias, digestivas e por drenos.' },
        { rotulo: 'Volume total em 24 h', valor: `${fmtInt(deficit * 1000 + perdas)} mL`, nota: `Aproximadamente ${fmtInt((deficit * 1000 + perdas) / 24)} mL/h` },
        { rotulo: 'Velocidade máxima de queda do sódio', valor: `${limite} mEq/L em 24 h`, nota: cronica ? 'Hipernatremia crônica: nunca ultrapasse 8 a 10 mEq/L em 24 h. O cérebro já produziu osmólitos idiogênicos; baixar rápido causa edema cerebral.' : 'Hipernatremia aguda documentada (< 48 h): a correção pode ser mais rápida, até 1 a 2 mEq/L por hora nas primeiras horas.', nivel: 'alerta' },
        { rotulo: 'Tempo mínimo de correção', valor: `${fmtInt(horasMinimas)} h`, nota: 'Para não ultrapassar o limite de velocidade.' },
      ],
      conduta: [
        'Corrija a hipernatremia **devagar**: no máximo **10 mEq/L em 24 horas** (0,5 mEq/L por hora) quando ela é crônica ou de duração desconhecida. O cérebro gerou osmólitos idiogênicos para se proteger da desidratação, e baixar o sódio rápido demais leva água para dentro da célula e causa **edema cerebral e convulsões**.',
        'Em hipernatremia **aguda comprovada (< 48 h)** — tipicamente iatrogênica, por salina hipertônica ou erro de preparo —, a correção pode ser mais rápida, de até 1 mEq/L por hora, porque os osmólitos ainda não se acumularam.',
        'Some ao déficit calculado as **perdas contínuas**: diurese osmótica, perdas insensíveis (aproximadamente 10 mL/kg/dia, mais se houver febre ou taquipneia), drenagens e diarreia. Repor apenas o déficit estimado e ignorar as perdas em curso é a razão mais comum de o sódio não cair como previsto.',
        'Escolha a via e a solução pelo contexto: **água por via oral ou sonda** é a rota preferida quando possível, por ser fisiológica e segura. Por via intravenosa, use **glicose a 5%** para água livre pura, ou **salina a 0,45%** quando houver também déficit de volume. Em choque, corrija primeiro a perfusão com salina isotônica e só depois cuide da tonicidade.',
        'Dose **sódio a cada 4–6 horas** durante a correção e recalcule: a fórmula é uma estimativa a partir da água corporal total, que ela própria é presumida (50–60% do peso, menos em idosos e mulheres). Investigue a causa em paralelo — sem acesso à água (o mecanismo mais comum em idosos e acamados), diabetes insípido central ou nefrogênico, diurese osmótica ou perdas gastrointestinais.',
      ],
      interpretacao: [
        'O déficit calculado é de **água pura**. Na prática ele é reposto com solução glicosada a 5% ou salina a 0,45%, e é preciso lembrar que a glicosada aporta água livre integralmente apenas se a glicose for metabolizada — em hiperglicemia descontrolada, ela agrava a hiperosmolaridade.',
        'A fórmula considera apenas o déficit de água; se houver também depleção de volume com instabilidade hemodinâmica, **corrija primeiro a perfusão com cristaloide isotônico** e só depois trate a água livre. Perfusão vem antes de natremia.',
        'Reavalie o sódio a cada 4 a 6 horas durante a correção ativa. Fórmula nenhuma prevê perdas urinárias variáveis, sobretudo no diabetes insípido, em que a poliúria pode superar a reposição.',
      ],
      alertas: [
        'Hipernatremia é quase sempre um problema de **acesso à água**, não de excesso de sódio: idoso acamado, paciente sedado, criança pequena, alteração do sensório. Investigue por que a pessoa não bebeu.',
        'Diabetes insípido central ou nefrogênico exige tratamento específico (desmopressina, retirada do agente causal) — só repor água não resolve enquanto a perda continuar.',
      ],
    }
  },
  formula: [
    'ACT = peso × 0,6 (♂ jovem) | 0,5 (♀ jovem ou ♂ idoso) | 0,45 (♀ idosa)',
    'Déficit de água = ACT × (Na atual / Na alvo − 1)',
    'Velocidade máxima: 8 a 10 mEq/L por 24 h na hipernatremia crônica',
  ],
  fundamento:
    'A quantidade total de sódio corporal permanece aproximadamente constante numa hipernatremia por perda de água; o que mudou foi o denominador. Se o produto sódio × água é conservado, então ACT_atual × Na_atual = ACT_alvo × Na_alvo, e o déficit é a diferença entre os dois volumes. O cérebro se adapta à hipernatremia crônica gerando osmólitos intracelulares em 24 a 48 horas; corrigir mais rápido do que esses osmólitos se dissipam produz influxo de água e edema cerebral — o espelho exato do que acontece na correção rápida da hiponatremia.',
  armadilhas: [
    'Os fatores de água corporal são estimativas populacionais. Em obesidade a água representa fração menor do peso (o tecido adiposo é pobre em água) e o déficit é superestimado.',
    'Não confunda déficit de água livre com necessidade hídrica diária — o volume total prescrito é a soma dos dois.',
  ],
  referencias: [
    { texto: 'Adrogué HJ, Madias NE. Hypernatremia. N Engl J Med. 2000;342(20):1493-1499.' },
    { texto: 'Sterns RH. Disorders of plasma sodium. N Engl J Med. 2015;372(1):55-65.' },
  ],
}

const correcaoHipo: Ferramenta = {
  id: 'correcao-hiponatremia',
  nome: 'Correção da hiponatremia (Adrogué-Madias) e limites de velocidade',
  sinonimos: ['hiponatremia', 'adrogue', 'madias', 'salina hipertonica', 'deficit de sodio', 'velocidade de correcao'],
  resumo: 'Prevê a variação do sódio por litro infundido e impõe o teto de velocidade seguro.',
  categorias: ['nefrologia', 'emergencia'],
  campos: [
    campoPeso(),
    campoSexo(),
    campoSeg('idoso', 'Faixa etária', [
      { valor: 'nao', rotulo: 'Adulto (< 65 anos)' },
      { valor: 'sim', rotulo: 'Idoso (≥ 65 anos)' },
    ]),
    campoNum('naAtual', 'Sódio atual', { unidade: 'mEq/L', min: 90, max: 135, passo: 1 }),
    campoOpc('solucao', 'Solução a infundir', [
      { valor: '513', rotulo: 'Salina hipertônica 3% (513 mEq/L)' },
      { valor: '154', rotulo: 'Salina 0,9% (154 mEq/L)' },
      { valor: '77', rotulo: 'Salina 0,45% (77 mEq/L)' },
      { valor: '130', rotulo: 'Ringer lactato (130 mEq/L)' },
      { valor: '855', rotulo: 'Salina hipertônica 5% (855 mEq/L)' },
    ]),
    campoNum('k', 'Potássio na solução', { unidade: 'mEq/L', min: 0, max: 60, passo: 1, padrao: '0', opcional: true, ajuda: 'O potássio conta tanto quanto o sódio para elevar a natremia — repor potássio em hiponatremia sobe o sódio.' }),
    campoSeg('risco', 'Risco de síndrome de desmielinização osmótica', [
      { valor: 'alto', rotulo: 'Alto risco' },
      { valor: 'padrao', rotulo: 'Risco habitual' },
    ], { ajuda: 'Alto risco: sódio ≤ 105, hipocalemia, alcoolismo, desnutrição, doença hepática avançada. Nesses casos o teto é 8 mEq/L em 24 h — alguns autores recomendam 4 a 6.' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const naAtual = num(v, 'naAtual')
    const solucao = num(v, 'solucao')
    const kSol = numOu(v, 'k', 0)
    if (peso === null || naAtual === null || solucao === null) return null
    const f = opc(v, 'sexo') === 'f'
    const idoso = sim(v, 'idoso')
    const act = aguaCorporal(peso, f, idoso)
    const deltaPorLitro = (solucao + kSol - naAtual) / (act + 1)
    const altoRisco = opc(v, 'risco') === 'alto'
    const teto24 = altoRisco ? 8 : 10
    const tetoAbsoluto = altoRisco ? 8 : 12
    const litrosPara24h = deltaPorLitro > 0 ? teto24 / deltaPorLitro : null
    const deficitTotal = act * (130 - naAtual)
    const bolus100 = (0.1 * (solucao - naAtual)) / (act + 1)
    return {
      titulo: 'Variação do sódio por litro infundido',
      valor: `${deltaPorLitro >= 0 ? '+' : ''}${fmt(deltaPorLitro, 2)}`,
      unidade: 'mEq/L por litro',
      nivel: naAtual < 120 ? 'critico' : naAtual < 130 ? 'alerta' : 'atencao',
      rotuloNivel: naAtual < 120 ? 'Hiponatremia grave' : naAtual < 130 ? 'Hiponatremia moderada' : 'Hiponatremia leve',
      detalhes: [
        { rotulo: 'Água corporal total', valor: `${fmt(act, 1)} L` },
        { rotulo: 'Teto de correção em 24 h', valor: `${teto24} mEq/L`, nota: altoRisco ? 'Paciente de alto risco: limite estrito de 8 mEq/L em 24 h e 16 mEq/L em 48 h.' : 'Limite habitual: 10 mEq/L em 24 h e 18 mEq/L em 48 h.', nivel: 'alerta' },
        { rotulo: 'Volume máximo em 24 h para respeitar o teto', valor: litrosPara24h === null ? 'a solução não eleva o sódio' : `${fmt(litrosPara24h, 2)} L`, nota: litrosPara24h === null ? 'Solução com sódio abaixo do plasmático **reduz** a natremia — não serve para corrigir hiponatremia.' : `Aproximadamente ${fmtInt((litrosPara24h * 1000) / 24)} mL/h` },
        { rotulo: 'Bolus de 100 mL de hipertônica 3%', valor: `+${fmt((0.1 * (513 - naAtual)) / (act + 1), 2)} mEq/L`, nota: 'É a estratégia de resgate na hiponatremia sintomática grave: 100 a 150 mL de salina 3% em 10 a 20 minutos, repetindo até melhora dos sintomas — tipicamente 2 a 3 bolus, elevando o sódio em 4 a 6 mEq/L.' },
        { rotulo: 'Efeito do bolus com a solução escolhida', valor: `+${fmt(bolus100, 2)} mEq/L por 100 mL` },
        { rotulo: 'Déficit total de sódio até 130 mEq/L', valor: `${fmtInt(deficitTotal)} mEq`, nota: 'Cálculo de referência (ACT × ΔNa). Serve para dimensionar, nunca para infundir de uma vez.' },
      ],
      conduta: [
        'Os limites de segurança valem para qualquer método: **máximo de 8 mEq/L em 24 h** (6 mEq/L em pacientes de alto risco — alcoolismo, desnutrição, hipocalemia, hepatopatia, sódio < 105 mEq/L) e 18 mEq/L em 48 h. Ultrapassar esses limites causa **síndrome de desmielinização osmótica**, que se manifesta dias depois, é irreversível e pode levar à síndrome do encarceramento.',
        'Na hiponatremia **sintomática grave** (convulsão, rebaixamento, vômitos, parada respiratória), não espere pelo cálculo: administre **salina a 3%, 100–150 mL em bolus de 10 minutos**, repetindo até 3 vezes até obter elevação de 4–6 mEq/L ou cessação dos sintomas. Essa elevação inicial rápida é segura e salva vida — o limite de 8 mEq/L se aplica ao total das 24 horas.',
        'Trate a **causa**, que é o que define a terapia de fundo: restrição hídrica na SIADH, salina isotônica na hipovolemia, restrição de água e sal com diurético na insuficiência cardíaca e na cirrose, reposição hormonal na insuficiência adrenal e no hipotireoidismo, e suspensão do fármaco causal (tiazídicos, inibidores seletivos da recaptação de serotonina, carbamazepina, desmopressina).',
        'Antecipe a **autocorreção abrupta**: quando a causa da hiponatremia é removida (reposição volêmica na hipovolemia, suspensão da desmopressina, correção da insuficiência adrenal), o estímulo ao hormônio antidiurético desaparece e o paciente urina volume enorme de urina diluída, elevando o sódio muito além da meta. Vigie a diurese horária e reintroduza desmopressina ou glicose a 5% se a correção disparar.',
        'Dose **sódio a cada 2 horas** durante a correção ativa, e não confie apenas na fórmula de Adrogué-Madias: ela considera um sistema fechado e ignora as perdas urinárias em curso, que costumam ser a maior fonte de erro. A medida seriada é o que governa o ajuste.',
      ],
      interpretacao: [
        '**A fórmula de Adrogué-Madias prevê, ela não prescreve.** Ela assume sistema fechado, sem perdas urinárias — premissa que se rompe justamente no cenário mais comum: quando a causa da hiponatremia (hipovolemia, SIADH transitório, tiazídico, insuficiência adrenal) é corrigida, o rim despeja água livre e a natremia sobe sozinha, muito além do previsto. Este é o mecanismo clássico de correção excessiva acidental.',
        '**Dose o sódio a cada 2 a 4 horas durante a correção ativa.** É a única salvaguarda real contra a síndrome de desmielinização osmótica, que é irreversível e frequentemente devastadora — mielinólise pontina e extrapontina, com quadriparesia, disartria, disfagia e síndrome do encarceramento.',
        'Se a correção ultrapassar o teto, ela pode e deve ser **revertida**: soro glicosado a 5% e desmopressina reduzem a natremia de volta ao alvo. Essa manobra de resgate está formalmente recomendada e reduz o risco de desmielinização.',
        'Hiponatremia com sintomas neurológicos graves (convulsão, rebaixamento, parada respiratória) é emergência: administre salina hipertônica em bolus **imediatamente**, sem esperar investigação etiológica. Nas primeiras horas, elevar 4 a 6 mEq/L basta para reverter o edema cerebral.',
      ],
      alertas: [
        'Salina 0,9% em SIADH pode **piorar** a hiponatremia: se a osmolalidade urinária for maior que a da solução infundida, o rim retém a água e excreta o sal — a chamada dessalinização. Verifique a osmolalidade urinária antes.',
        'Repor potássio eleva a natremia. Um paciente hipocalêmico e hiponatrêmico que recebe cloreto de potássio sobe o sódio mesmo sem receber sódio — conte esse aporte no cálculo.',
      ],
    }
  },
  formula: [
    'ΔNa por litro infundido = (Na da solução + K da solução − Na sérico) / (ACT + 1)',
    'Déficit de sódio = ACT × (Na alvo − Na atual)',
    'Teto: 10 mEq/L em 24 h (8 se alto risco) e 18 mEq/L em 48 h',
  ],
  fundamento:
    'A equação de Adrogué-Madias trata o corpo como um compartimento único de água em que se adiciona um litro de solução. O denominador ACT + 1 representa a água corporal depois da infusão. É uma simplificação deliberada, publicada em 2000 justamente para dar ao clínico uma referência quantitativa onde antes havia só tentativa e erro — mas o próprio artigo original alerta que a previsão exige verificação laboratorial frequente.',
  armadilhas: [
    'A fórmula ignora perdas urinárias, que podem ser enormes. É o erro estrutural, não um detalhe.',
    'Corrigir a causa (repor volume, suspender tiazídico, tratar insuficiência adrenal) tende a acelerar a correção muito além do calculado. Antecipe-se: nesses cenários, considere desmopressina profilática associada à hipertônica, estratégia que reduz correções excessivas.',
    'Hiponatremia crônica assintomática **não** é emergência. A pressa é o principal fator de risco de desmielinização.',
  ],
  referencias: [
    { texto: 'Adrogué HJ, Madias NE. Hyponatremia. N Engl J Med. 2000;342(21):1581-1589.' },
    { texto: 'Spasovski G, Vanholder R, Allolio B, et al. Clinical practice guideline on diagnosis and treatment of hyponatraemia. Eur J Endocrinol. 2014;170(3):G1-G47.' },
    { texto: 'Sterns RH, Hix JK, Silver SM. Management of hyponatremic encephalopathy with rapid correction reversal. Clin J Am Soc Nephrol. 2018;13(9):1332-1334.' },
  ],
}

const potassio: Ferramenta = {
  id: 'reposicao-potassio',
  nome: 'Reposição de potássio',
  sinonimos: ['potassio', 'hipocalemia', 'kcl', 'reposicao de k'],
  resumo: 'Estima o déficit corporal, a dose e a velocidade máxima segura de infusão.',
  categorias: ['nefrologia', 'emergencia'],
  campos: [
    campoNum('k', 'Potássio sérico', { unidade: 'mEq/L', min: 1, max: 7, passo: 0.1, normalMin: 3.5, normalMax: 5.2 }),
    campoPeso(),
    campoNum('mg', 'Magnésio sérico', { unidade: 'mg/dL', min: 0.5, max: 5, passo: 0.1, opcional: true, normalMin: 1.7, normalMax: 2.4, ajuda: 'Hipomagnesemia perpetua a hipocalemia por aumentar a secreção renal de potássio — sem corrigir o magnésio, a reposição de potássio falha.' }),
    campoSeg('via', 'Via de reposição', [
      { valor: 'oral', rotulo: 'Oral' },
      { valor: 'periferica', rotulo: 'Venosa periférica' },
      { valor: 'central', rotulo: 'Venosa central' },
    ]),
  ],
  calcular: (v) => {
    const k = num(v, 'k')
    const peso = num(v, 'peso')
    const mg = num(v, 'mg')
    const via = opc(v, 'via')
    if (k === null || peso === null) return null
    // Regra clássica: cada 0,3 mEq/L abaixo de 4,0 corresponde a cerca de 100 mEq de déficit corporal.
    const deficit = k < 4 ? ((4 - k) / 0.3) * 100 : 0
    const velocidadeMax = via === 'central' ? 20 : via === 'periferica' ? 10 : 0
    const concentracaoMax = via === 'central' ? 60 : via === 'periferica' ? 40 : 0
    const nivel: Nivel = k < 2.5 ? 'critico' : k < 3 ? 'alerta' : k < 3.5 ? 'atencao' : k > 5.5 ? 'alerta' : 'ok'
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Déficit corporal estimado', valor: `${fmtInt(deficit)} mEq`, nota: 'Regra empírica: queda de 0,3 mEq/L no sérico ≈ 100 mEq de déficit corporal total. A relação não é linear e subestima muito abaixo de 2,5 mEq/L.' },
      { rotulo: 'Efeito esperado de 10 mEq', valor: '≈ +0,1 mEq/L', nota: 'Apenas 2% do potássio corporal é extracelular — o sérico responde pouco e devagar.' },
    ]
    if (via === 'oral') {
      detalhes.push({ rotulo: 'Dose oral usual', valor: '40 a 100 mEq/dia, fracionados', nota: 'Doses únicas acima de 40 mEq causam desconforto gástrico. Xarope de cloreto de potássio a 6% tem cerca de 0,8 mEq/mL.' })
    } else {
      detalhes.push({ rotulo: 'Velocidade máxima', valor: `${velocidadeMax} mEq/h`, nota: via === 'central' ? 'Em acesso central, com monitorização eletrocardiográfica contínua. Até 20 mEq/h em hipocalemia grave sintomática.' : 'Em veia periférica, o limite é 10 mEq/h — acima disso a flebite é praticamente certa.', nivel: 'alerta' })
      detalhes.push({ rotulo: 'Concentração máxima', valor: `${concentracaoMax} mEq/L`, nota: via === 'central' ? 'Concentrações acima de 60 mEq/L exigem acesso central obrigatoriamente.' : 'Em periférica, não ultrapasse 40 mEq/L.' })
      detalhes.push({ rotulo: 'Tempo mínimo para repor o déficit', valor: deficit > 0 && velocidadeMax > 0 ? `${fmt(deficit / velocidadeMax, 1)} h` : '—', nota: 'Na velocidade máxima. Na prática, reponha em ritmo menor e reavalie.' })
    }
    if (mg !== null) {
      detalhes.push({
        rotulo: 'Magnésio',
        valor: `${fmt(mg, 1)} mg/dL`,
        nota: mg < 1.7 ? '**Hipomagnesemia: corrija primeiro.** Sem magnésio, o canal ROMK fica desinibido e o rim continua espoliando potássio, tornando a reposição ineficaz. Sulfato de magnésio 1 a 2 g EV.' : 'Magnésio adequado.',
        nivel: mg < 1.7 ? 'alerta' : 'ok',
      })
    }
    return {
      titulo: 'Reposição de potássio',
      valor: fmt(k, 1),
      unidade: 'mEq/L',
      nivel,
      rotuloNivel: k < 2.5 ? 'Hipocalemia grave' : k < 3 ? 'Hipocalemia moderada' : k < 3.5 ? 'Hipocalemia leve' : k > 5.2 ? 'Hipercalemia' : 'Normal',
      detalhes,
      conduta: [
        'Estime a magnitude do déficit: cada **1 mEq/L abaixo de 4,0** corresponde a aproximadamente **200–400 mEq de potássio corporal total**. Esse cálculo mostra por que uma ampola isolada praticamente não move a caliemia e por que a reposição precisa ser continuada e monitorada.',
        'Prefira a **via oral** (cloreto de potássio 40–100 mEq/dia divididos) sempre que o paciente tolerar: é mais segura, mais previsível e não depende de acesso venoso. Reserve a via intravenosa para hipocalemia grave, arritmia, intolerância digestiva ou jejum.',
        'Respeite os limites da via intravenosa: **até 10 mEq/h e concentração de até 40 mEq/L em veia periférica**; acima disso exige **veia central e monitorização contínua**, com no máximo 20 mEq/h. Infundir potássio rápido em periférica causa dor intensa, flebite e risco de arritmia.',
        '**Sempre reponha magnésio junto.** A hipomagnesemia aumenta a secreção de potássio pelos canais ROMK do túbulo coletor, tornando a hipocalemia refratária a qualquer dose. Sem corrigir o magnésio, a reposição de potássio simplesmente escorre pela urina.',
        'Vigie a **hipercalemia de rebote** em quem tem função renal reduzida, usa IECA, BRA, espironolactona ou trimetoprima, e em cetoacidose diabética durante a insulinoterapia — nesta última o potássio entra na célula rapidamente e a caliemia despenca. Redose o potássio a cada 2–4 h nesses contextos, e não inicie insulina com potássio abaixo de 3,3 mEq/L.',
      ],
      interpretacao: [
        'A via oral é preferível sempre que possível: é mais segura, mais eficaz e não causa flebite. A via venosa se reserva a hipocalemia grave, sintomática, com arritmia, ou quando não há trânsito digestivo.',
        'O potássio sérico reflete mal o estoque corporal. Alcalose, insulina, beta-agonista e catecolaminas deslocam potássio para dentro da célula sem alterar o total — nesses casos o sérico está baixo mas o déficit é pequeno, e a reposição gera hipercalemia de rebote.',
        k < 3
          ? 'Hipocalemia abaixo de 3,0 mEq/L: risco de arritmia ventricular, sobretudo em cardiopata, em uso de digital ou com QT longo. Monitorize o eletrocardiograma — achatamento da T, aparecimento de onda U, infra de ST e prolongamento do QU são os achados.'
          : 'Investigue a causa: perdas digestivas (diarreia, vômito, fístula), perdas renais (diurético, hiperaldosteronismo, Bartter, Gitelman, anfotericina), deslocamento intracelular (insulina, beta-agonista, alcalose, paralisia periódica) ou aporte insuficiente.',
      ],
      alertas: [
        'Nunca administre potássio em bolus ou em push. Parada cardíaca em assistolia é a consequência, e há relatos recorrentes desse erro.',
        'Em paciente com lesão renal aguda ou doença renal crônica avançada, reponha com muito mais cautela e reavalie a cada dose.',
      ],
    }
  },
  formula: ['Déficit ≈ [(4,0 − K sérico) ÷ 0,3] × 100 mEq', '10 mEq de K⁺ elevam o sérico em cerca de 0,1 mEq/L'],
  fundamento:
    'Apenas 2% do potássio corporal total (cerca de 3500 mEq num adulto) circula no extracelular. Essa distribuição é o que torna o potássio sérico um marcador ruim de estoque e o que explica por que a curva entre sérico e déficit é exponencial: as primeiras quedas do sérico correspondem a perdas modestas, mas abaixo de 3 mEq/L cada décimo representa um déficit muito maior. O déficit corporal é enorme em relação à variação plasmática porque **98% do potássio é intracelular**, e a caliemia reflete apenas os 2% extracelulares. Insulina, catecolaminas beta-2 e alcalose empurram potássio para dentro da célula sem mudar o conteúdo total, mascarando o déficit; acidose e falta de insulina fazem o inverso. Daí a regra de que cada 1 mEq/L abaixo de 4,0 corresponde a 200 a 400 mEq de déficit total — e daí a queda abrupta da caliemia quando se inicia insulina na cetoacidose.',
  armadilhas: [
    'Hemólise da amostra eleva falsamente o potássio. Pseudo-hipercalemia também ocorre em trombocitose e leucocitose extremas, e nesses casos o plasma heparinizado é mais confiável que o soro.',
    'Corrigir a acidose antes de repor o potássio derruba ainda mais o sérico, porque o H⁺ sai da célula e o K⁺ entra. Na cetoacidose diabética, potássio abaixo de 3,3 mEq/L contraindica iniciar insulina até que a reposição comece.',
  ],
  referencias: [
    { texto: 'Gennari FJ. Hypokalemia. N Engl J Med. 1998;339(7):451-458.' },
    { texto: 'Kardalas E, Paschou SA, Anagnostis P, et al. Hypokalemia: a clinical update. Endocr Connect. 2018;7(4):R135-R146.' },
  ],
}

const ureiaCreatinina: Ferramenta = {
  id: 'relacao-ureia-creatinina',
  nome: 'Relação ureia/creatinina',
  sinonimos: ['ureia creatinina', 'bun creatinina', 'relacao u/c'],
  resumo: 'Aponta azotemia pré-renal, hemorragia digestiva e catabolismo aumentado.',
  categorias: ['nefrologia', 'gastroenterologia'],
  campos: [
    campoNum('ureia', 'Ureia', { unidade: 'mg/dL', min: 5, max: 400, passo: 1, normalMin: 15, normalMax: 45, ajuda: 'Informe a UREIA do laudo brasileiro, não o BUN. Se o exame vier em BUN (padrão americano), multiplique por 2,14 antes de digitar — confundir os dois é o erro mais comum desta ferramenta.' }),
    campoCreatinina(),
  ],
  calcular: (v) => {
    const u = num(v, 'ureia')
    const cr = num(v, 'creatinina')
    if (u === null || cr === null || cr <= 0) return null
    const razaoUreia = u / cr
    const bun = u / 2.14
    const razaoBun = bun / cr
    const alta = razaoUreia > 40
    const baixa = razaoUreia < 20
    return {
      titulo: 'Relação ureia/creatinina',
      valor: fmt(razaoUreia, 1),
      nivel: alta ? 'alerta' : 'neutro',
      rotuloNivel: alta ? 'Elevada' : baixa ? 'Reduzida' : 'Normal',
      detalhes: [
        { rotulo: 'Relação ureia/creatinina', valor: fmt(razaoUreia, 1), nota: 'Referência 20 a 40 (unidades brasileiras).' },
        { rotulo: 'BUN estimado', valor: `${fmt(bun, 1)} mg/dL`, nota: 'Ureia ÷ 2,14' },
        { rotulo: 'Relação BUN/creatinina', valor: fmt(razaoBun, 1), nota: 'Referência 10 a 20 (unidades americanas). Acima de 20 é o critério clássico de pré-renal.' },
      ],
      interpretacao: [
        alta
          ? '**Relação elevada.** Três famílias de causa: (1) **pré-renal** — a reabsorção de ureia acompanha a de sódio e água no túbulo proximal, então a hipoperfusão eleva a ureia desproporcionalmente; (2) **hemorragia digestiva alta** — o sangue é uma carga proteica digerida e absorvida, e a relação sobe sem doença renal; (3) **catabolismo aumentado** — corticoide, tetraciclina, nutrição parenteral hiperproteica, febre, sepse, trauma extenso, uso de sangue.'
          : baixa
            ? '**Relação reduzida.** Considere baixa ingestão proteica, hepatopatia avançada (a ureia é sintetizada no fígado), gestação, desnutrição, rabdomiólise (a creatinina sobe desproporcionalmente pela liberação muscular) e hemodiálise recente, que remove ureia mais eficientemente que creatinina.'
            : 'Relação dentro da faixa habitual. Não afasta pré-renal nem necrose tubular — combine com fração de excreção de sódio, sedimento urinário e história.',
        'Numa hemorragia digestiva alta, a relação BUN/creatinina acima de 30 tem razoável valor preditivo positivo para sangramento de origem alta quando o paciente não tem doença renal — e é usada como um dos itens do escore de Glasgow-Blatchford.',
        'O mecanismo da reabsorção de ureia merece detalhe, porque é o que sustenta toda a interpretação. A ureia é filtrada livremente no glomérulo e reabsorvida de forma **passiva**, arrastada pelo gradiente osmótico criado pela reabsorção de sódio e água no túbulo proximal — cerca de 40 a 50% em condições normais. Na hipoperfusão, dois efeitos se somam. Primeiro, a angiotensina II e a queda de pressão hidrostática peritubular aumentam a reabsorção proximal de sódio e água, e a ureia acompanha por arraste. Segundo, e mais específico, a **vasopressina** (hormônio antidiurético) liberada pela hipovolemia ativa os transportadores de ureia UT-A1 e UT-A3 no ducto coletor medular interno, aumentando ativamente a reabsorção — mecanismo que existe para reciclar ureia e sustentar o gradiente osmótico medular que permite concentrar a urina. Já a creatinina é filtrada e praticamente não reabsorvida (tem até pequena secreção tubular pelo transportador OCT2). O resultado é que a hipoperfusão eleva a ureia desproporcionalmente, e a relação sobe. Entender isso explica também por que a relação **cai** na hepatopatia avançada: a ureia é sintetizada exclusivamente no fígado pelo ciclo da ornitina, e o fígado cirrótico produz menos — daí a ureia baixa com amônia alta, que é a combinação característica.',
      ],
      conduta: alta
        ? [
            'Separe as três famílias de causa antes de agir, porque as condutas são opostas. **Pré-renal**: avalie volemia clinicamente (pressão, frequência, turgor, mucosas, pressão venosa jugular, variação respiratória da veia cava ao ultrassom) e reponha volume se houver hipovolemia. **Hemorragia digestiva**: procure melena, hematêmese, queda de hemoglobina — o sangue no intestino é carga proteica digerida e absorvida, e eleva a ureia sem doença renal. **Catabolismo**: revise corticoide, tetraciclina, nutrição parenteral hiperproteica, febre, sepse, trauma extenso e transfusões.',
            'Confirme o padrão pré-renal com os exames que discriminam de verdade: **fração de excreção de sódio** abaixo de 1% (ou fração de excreção de ureia abaixo de 35% se houver diurético em uso), sódio urinário baixo, osmolaridade urinária alta e sedimento urinário sem cilindros granulosos. A relação sozinha é apenas sugestiva.',
            'Se houver hipovolemia, reponha com cristaloide balanceado e reavalie a resposta em 6 a 12 horas — a azotemia pré-renal é, por definição, reversível com a restauração da perfusão. Ausência de resposta desloca a hipótese para necrose tubular aguda já instalada.',
            'Suspenda ou ajuste o que agrava: anti-inflamatório não esteroidal (que bloqueia a vasodilatação da arteríola aferente), inibidor da ECA ou bloqueador de receptor de angiotensina em hipovolemia (que impede a vasoconstrição eferente compensatória), diurético e contraste iodado. A tríade anti-inflamatório + inibidor da ECA + diurético é a combinação clássica de lesão renal aguda ambulatorial.',
            'Se a suspeita for hemorragia digestiva, aplique o **escore de Glasgow-Blatchford** (que já inclui a ureia como item) e proceda à investigação endoscópica conforme o risco.',
          ]
        : baixa
          ? [
              'Procure a causa da ureia desproporcionalmente baixa. **Hepatopatia avançada** é a mais relevante: a ureia é sintetizada exclusivamente no fígado pelo ciclo da ornitina, e o cirrótico produz menos — nesse caso, ureia baixa com amônia elevada é o padrão, e a creatinina também subestima a função renal pela massa muscular reduzida.',
              'Considere as demais: baixa ingestão proteica e desnutrição, gestação (com hemodiluição e aumento da filtração glomerular), hemodiálise recente (a ureia é removida mais eficientemente que a creatinina) e **rabdomiólise**, em que a creatinina sobe desproporcionalmente pela liberação muscular direta.',
              'Se houver suspeita de rabdomiólise, dose **creatinoquinase**, mioglobina urinária, potássio, fósforo e cálcio, e inicie hidratação vigorosa precoce — é a intervenção que previne a necrose tubular por mioglobina.',
              'No cirrótico, lembre que a creatinina **superestima** a função renal: considere cistatina C ou coleta de urina de 24 horas, e esteja atento ao diagnóstico de síndrome hepatorrenal, que exige critérios próprios e conduta específica (albumina com terlipressina).',
            ]
          : [
              'Relação dentro da faixa habitual. Isso **não afasta** azotemia pré-renal nem necrose tubular aguda — a relação é sugestiva, não discriminativa, e diuréticos, dieta e hepatopatia a distorcem em direções opostas que podem se cancelar.',
              'Se houver elevação de creatinina, prossiga com a investigação que realmente discrimina: fração de excreção de sódio e de ureia, sódio e osmolaridade urinários, **sedimento urinário** (cilindros granulosos pigmentados apontam necrose tubular; hemácias dismórficas e cilindros hemáticos apontam glomerular; leucocitúria estéril com eosinofilúria aponta nefrite intersticial) e ultrassonografia renal para excluir obstrução.',
              'Classifique a lesão renal pelos **critérios KDIGO** (variação de creatinina e débito urinário) e revise a prescrição em busca de nefrotóxicos.',
            ],
      alertas: [
        'A confusão entre **ureia e BUN** é o erro mais comum e muda a interpretação por completo: a faixa de referência da relação ureia/creatinina é 20 a 40, e a de BUN/creatinina é 10 a 20. O fator de conversão é 2,14.',
        'A relação nunca faz diagnóstico sozinha. Diurético eleva, hepatopatia reduz, dieta hiperproteica eleva, desnutrição reduz — e essas influências podem se cancelar num mesmo paciente, produzindo relação normal em pré-renal franca.',
        'Em paciente com doença renal crônica, a relação perde valor discriminativo: a creatinina basal já está elevada e o denominador deixa de refletir mudanças agudas de perfusão.',
        'Relação elevada com creatinina normal em paciente sem hipovolemia aparente deve levantar hemorragia digestiva alta antes de ser atribuída a dieta — sobretudo em usuário de anti-inflamatório ou antiagregante.',
      ],
      tabela: {
        titulo: 'Faixas e causas, nas duas convenções de unidade',
        colunas: ['Ureia/creatinina', 'BUN/creatinina', 'Leitura', 'Causas principais'],
        linhas: [
          ['> 40', '> 20', 'Elevada', 'Pré-renal, hemorragia digestiva alta, catabolismo'],
          ['20 – 40', '10 – 20', 'Normal', 'Inespecífica — não afasta pré-renal nem NTA'],
          ['< 20', '< 10', 'Reduzida', 'Hepatopatia, desnutrição, gestação, diálise, rabdomiólise'],
        ],
        destaque: alta ? 0 : baixa ? 2 : 1,
      },
    }
  },
  formula: ['Relação = ureia ÷ creatinina (referência 20 a 40)', 'BUN = ureia ÷ 2,14'],
  fundamento:
    'A ureia é filtrada e depois parcialmente reabsorvida no túbulo proximal, de forma acoplada à reabsorção de sódio e água; a creatinina é filtrada e praticamente não reabsorvida. Quando o rim está avidamente reabsorvendo sódio — na hipoperfusão —, a ureia acompanha e sobe mais que a creatinina. É esse desacoplamento que a relação captura. A relação funciona porque ureia e creatinina são manejadas de forma diferente pelo néfron: a **creatinina é filtrada e praticamente não reabsorvida**, enquanto a **ureia é reabsorvida no túbulo proximal por arraste de solvente e no ducto coletor por transportadores UT-A sob ação do hormônio antidiurético**. Na hipoperfusão, a reabsorção de sódio e água aumenta e leva ureia junto, elevando a razão; na lesão tubular estabelecida, esse mecanismo se perde e a razão volta ao normal.',
  armadilhas: [
    'A confusão entre ureia e BUN é o erro mais comum: as faixas de referência das duas relações diferem por um fator de 2,14.',
    'A relação é apenas sugestiva. Ela nunca faz diagnóstico sozinha, e diuréticos, dieta e hepatopatia a distorcem em direções opostas.',
    'Em doença renal crônica a relação perde poder discriminativo, porque a creatinina basal elevada amortece o denominador e mascara mudanças agudas de perfusão.',
    'Influências opostas podem se cancelar: cirrótico desnutrido em uso de diurético pode ter relação normal em plena azotemia pré-renal.',
    'Relação elevada com creatinina normal, sem hipovolemia aparente, deve levantar hemorragia digestiva alta — sobretudo em usuário de anti-inflamatório ou antiagregante.',
    'Na rabdomiólise a relação cai porque a creatinina sobe desproporcionalmente pela liberação muscular. Interpretar isso como "boa função renal" atrasa a hidratação, que é a intervenção que previne a necrose tubular.',
  ],
  referencias: [
    { texto: 'Uchino S, Bellomo R, Goldsmith D. The meaning of the blood urea nitrogen/creatinine ratio in acute kidney injury. Clin Kidney J. 2012;5(2):187-191.' },
    { texto: 'Fenske W, Störk S, Koschker AC, et al. Value of fractional uric acid excretion in differential diagnosis of hyponatremic patients. J Clin Endocrinol Metab. 2008;93(8):2991-2997.' },
    { texto: 'Kidney Disease: Improving Global Outcomes (KDIGO) Acute Kidney Injury Work Group. KDIGO Clinical Practice Guideline for Acute Kidney Injury. Kidney Int Suppl. 2012;2(1):1-138.' },
  ],
}

const kdigo: Ferramenta = {
  id: 'kdigo-lra',
  nome: 'Critérios KDIGO de lesão renal aguda',
  sinonimos: ['kdigo', 'lra', 'ira', 'injuria renal aguda', 'rifle', 'akin'],
  resumo: 'Estadia a lesão renal aguda por creatinina e por diurese, e diz quando dialisar.',
  categorias: ['nefrologia', 'emergencia'],
  campos: [
    campoNum('crAtual', 'Creatinina atual', { unidade: 'mg/dL', min: 0.1, max: 25, passo: 0.01 }),
    campoNum('crBasal', 'Creatinina basal', { unidade: 'mg/dL', min: 0.1, max: 15, passo: 0.01, ajuda: 'Valor prévio conhecido dos últimos 3 a 12 meses. Sem valor prévio, use o menor da internação ou estime a partir de uma TFG de 75 mL/min.' }),
    campoOpc('diurese', 'Débito urinário', [
      { valor: '0', rotulo: 'Acima de 0,5 mL/kg/h', pontos: 0 },
      { valor: '1', rotulo: 'Abaixo de 0,5 mL/kg/h por 6 a 12 h', pontos: 1 },
      { valor: '2', rotulo: 'Abaixo de 0,5 mL/kg/h por 12 h ou mais', pontos: 2 },
      { valor: '3', rotulo: 'Abaixo de 0,3 mL/kg/h por 24 h ou mais, ou anúria por 12 h', pontos: 3 },
    ]),
    campoSimNao('dialise', 'Já em terapia renal substitutiva', 1),
  ],
  calcular: (v) => {
    const cra = num(v, 'crAtual')
    const crb = num(v, 'crBasal')
    const diurese = num(v, 'diurese')
    if (cra === null || crb === null || diurese === null || crb <= 0) return null
    const razao = cra / crb
    const delta = cra - crb
    let estagioCr = 0
    if (razao >= 3 || cra >= 4 || sim(v, 'dialise')) estagioCr = 3
    else if (razao >= 2) estagioCr = 2
    else if (razao >= 1.5 || delta >= 0.3) estagioCr = 1
    const estagio = Math.max(estagioCr, diurese)
    const nivel: Nivel = estagio === 0 ? 'ok' : estagio === 1 ? 'atencao' : estagio === 2 ? 'alerta' : 'critico'
    return {
      titulo: estagio === 0 ? 'Sem critérios de lesão renal aguda' : `Lesão renal aguda estágio ${estagio}`,
      valor: estagio === 0 ? 'Ausente' : `Estágio ${estagio}`,
      nivel,
      rotuloNivel: `Creatinina ${fmt(razao, 2)}× o basal (Δ de ${delta >= 0 ? '+' : ''}${fmt(delta, 2)} mg/dL)`,
      detalhes: [
        { rotulo: 'Estágio pelo critério de creatinina', valor: String(estagioCr) },
        { rotulo: 'Estágio pelo critério de diurese', valor: String(diurese), nota: 'O estágio final é o **pior** dos dois critérios.' },
        { rotulo: 'Razão creatinina atual / basal', valor: fmt(razao, 2) },
      ],
      conduta: [
        'Confirmado o diagnóstico, faça o que muda desfecho em toda lesão renal aguda: **suspenda nefrotóxicos** (anti-inflamatórios, aminoglicosídeos, vancomicina, contraste, IECA e BRA na fase aguda), **otimize a perfusão** e **ajuste a dose de todos os fármacos** à função renal atual, não à basal.',
        'Classifique a causa em **pré-renal, renal ou pós-renal** desde a primeira hora. Solicite **ultrassonografia de vias urinárias** precocemente: a obstrução é a causa mais facilmente reversível e a mais fácil de deixar passar — uma sonda vesical ou nefrostomia recupera a função em horas.',
        'Suba o estágio pelo pior critério, de creatinina **ou** de diurese: o critério de débito urinário costuma detectar a lesão mais cedo, porque a creatinina só sobe depois que 50% da função já se perdeu. Isso torna a medida horária da diurese em paciente de risco uma ferramenta diagnóstica, não apenas de enfermagem.',
        'Indique **diálise** pelos critérios clássicos, memorizados como AEIOU: **A**cidose refratária, distúrbio **E**letrolítico grave (hipercalemia refratária), **I**ntoxicação dialisável (lítio, metanol, etilenoglicol, salicilatos, metformina), s**O**brecarga volêmica refratária e **U**remia sintomática (pericardite, encefalopatia, sangramento). Iniciar diálise apenas por estágio KDIGO 3, sem essas indicações, não melhorou desfecho nos ensaios de início precoce.',
        'Programe o **seguimento após a alta**: quem teve lesão renal aguda tem risco muito aumentado de doença renal crônica, de novos episódios e de evento cardiovascular. Reavalie creatinina e albuminúria em 3 meses, reintroduza IECA ou BRA de forma programada quando indicados, e registre o episódio no prontuário — ele é um marcador de risco vitalício e costuma se perder na transição de cuidado.',
      ],
      alertas: [
        'Suba o estágio pelo pior critério, de creatinina **ou** de diurese: a creatinina só sobe depois que cerca de 50% da função já se perdeu, e o débito urinário detecta a lesão mais cedo.',
        'Peça ultrassonografia de vias urinárias cedo. A obstrução é a causa mais facilmente reversível e a mais fácil de deixar passar — uma sonda ou nefrostomia recupera a função em horas.',
      ],
      interpretacao: [
        'A definição KDIGO unificou os critérios anteriores (RIFLE e AKIN) e fixou três gatilhos: aumento de creatinina ≥ 0,3 mg/dL em 48 horas, aumento ≥ 1,5 vez o basal em 7 dias, ou débito urinário abaixo de 0,5 mL/kg/h por 6 horas. **Um único deles basta.**',
        'O critério de diurese é o mais precoce e o mais ignorado. Em muitos pacientes a oligúria antecede a elevação da creatinina em horas ou dias, e depender só da creatinina atrasa o diagnóstico.',
        estagio >= 2
          ? 'Estágio 2 ou 3: revise medicamentos nefrotóxicos, ajuste doses, evite contraste, otimize perfusão e pressão, considere avaliação nefrológica e monitorize eletrólitos e ácido-base com frequência.'
          : estagio === 1
            ? 'Estágio 1: identifique e corrija a causa — hipovolemia, hipotensão, nefrotóxicos, obstrução. Suspenda anti-inflamatórios, reavalie inibidor do sistema renina-angiotensina e diurético.'
            : 'Sem critérios atuais. Se houver fator de risco, mantenha vigilância de creatinina e diurese.',
        '**Indicações de terapia renal substitutiva de urgência** (mnemônica AEIOU): **A**cidose refratária, **E**letrólitos (hipercalemia refratária), **I**ntoxicação dialisável (lítio, salicilato, metanol, etilenoglicol, metformina), s**O**brecarga volêmica refratária, **U**remia sintomática (pericardite, encefalopatia, sangramento). Os ensaios AKIKI, ELAIN e STARRT-AKI mostraram que, **na ausência dessas indicações**, iniciar diálise mais cedo não reduz mortalidade.',
      ],
      tabela: {
        titulo: 'Estágios KDIGO',
        colunas: ['Estágio', 'Creatinina', 'Diurese'],
        linhas: [
          ['1', '1,5–1,9× basal ou aumento ≥ 0,3 mg/dL', '< 0,5 mL/kg/h por 6–12 h'],
          ['2', '2,0–2,9× basal', '< 0,5 mL/kg/h por ≥ 12 h'],
          ['3', '≥ 3× basal, ou Cr ≥ 4,0 mg/dL, ou início de diálise', '< 0,3 mL/kg/h por ≥ 24 h ou anúria ≥ 12 h'],
        ],
        destaque: estagio > 0 ? estagio - 1 : undefined,
      },
    }
  },
  formula: ['Estágio = o pior entre o critério de creatinina e o de diurese'],
  fundamento:
    'A padronização importou porque, antes dela, cada estudo definia insuficiência renal aguda de um jeito, e comparar incidências ou desfechos era impossível. Os pontos de corte foram escolhidos por associação com mortalidade: mesmo um aumento de 0,3 mg/dL na creatinina — que parece trivial — associa-se independentemente a mortalidade maior, e essa constatação é a razão de o estágio 1 existir. Os dois critérios existem porque medem coisas diferentes no tempo. A **creatinina** é um marcador tardio: por ser produto de equilíbrio, só sobe depois que cerca de metade da filtração se perdeu, e leva 24 a 48 horas para refletir o novo estado. O **débito urinário** cai imediatamente, porque a resposta renal à hipoperfusão — vasoconstrição da arteríola aferente, retenção de sódio e água mediada por angiotensina II, aldosterona e hormônio antidiurético — antecede qualquer alteração bioquímica.',
  armadilhas: [
    'A creatinina basal desconhecida é o problema prático mais frequente. Estimá-la retroativamente a partir de uma TFG presumida de 75 mL/min superdiagnostica lesão renal em quem já tinha doença renal crônica.',
    'A creatinina se dilui na expansão volêmica agressiva, mascarando a lesão — fenômeno documentado em ressuscitação de sepse.',
    'Estadiar não é diagnosticar causa. Pré-renal, renal e pós-renal produzem os mesmos estágios; a ultrassonografia para excluir obstrução deve ser precoce.',
  ],
  referencias: [
    { texto: 'KDIGO Clinical Practice Guideline for Acute Kidney Injury. Kidney Int Suppl. 2012;2(1):1-138.' },
    { texto: 'STARRT-AKI Investigators. Timing of initiation of renal-replacement therapy in acute kidney injury. N Engl J Med. 2020;383(3):240-251.' },
  ],
}

const drc: Ferramenta = {
  id: 'classificacao-drc',
  nome: 'Classificação KDIGO da doença renal crônica',
  sinonimos: ['drc', 'doenca renal cronica', 'estagio renal', 'mapa de calor kdigo'],
  resumo: 'Cruza TFG e albuminúria no mapa de risco e devolve a conduta de cada faixa.',
  categorias: ['nefrologia'],
  campos: [
    campoNum('tfg', 'TFG estimada', { unidade: 'mL/min/1,73 m²', min: 1, max: 150, passo: 1, ajuda: 'Pela CKD-EPI 2021, sem ajuste racial. Exige estabilidade por mais de 3 meses — uma TFG baixa isolada pode ser lesão renal AGUDA, e classificar como doença crônica nesse momento é erro com consequências no seguimento.' }),
    campoNum('rac', 'Relação albumina/creatinina urinária', { unidade: 'mg/g', min: 0, max: 5000, passo: 1, ajuda: 'Amostra isolada, preferencialmente a primeira urina da manhã. Confirme em pelo menos duas de três amostras: exercício, febre, infecção urinária, insuficiência cardíaca descompensada e hiperglicemia elevam transitoriamente. Não confunda com proteína/creatinina, que mede outra coisa e tem outros cortes.' }),
  ],
  calcular: (v) => {
    const tfg = num(v, 'tfg')
    const rac = num(v, 'rac')
    if (tfg === null || rac === null) return null
    const g = estagioDrc(tfg)
    const a = rac < 30 ? 1 : rac < 300 ? 2 : 3
    const gIdx = tfg >= 90 ? 0 : tfg >= 60 ? 1 : tfg >= 45 ? 2 : tfg >= 30 ? 3 : tfg >= 15 ? 4 : 5
    // Mapa de calor KDIGO: 1 baixo, 2 moderado, 3 alto, 4 muito alto.
    const mapa = [
      [1, 2, 3],
      [1, 2, 3],
      [2, 3, 3],
      [3, 3, 4],
      [4, 4, 4],
      [4, 4, 4],
    ]
    const risco = mapa[gIdx][a - 1]
    const rotulos = ['', 'Risco baixo', 'Risco moderadamente aumentado', 'Risco alto', 'Risco muito alto']
    const nivel: Nivel = (['ok', 'ok', 'atencao', 'alerta', 'critico'] as Nivel[])[risco]
    const frequencia = ['', '1 vez ao ano', '1 vez ao ano', '2 vezes ao ano', '3 a 4 vezes ao ano'][risco]
    return {
      titulo: `${g.estagio} A${a}`,
      valor: rotulos[risco],
      nivel,
      rotuloNivel: `${g.descricao} · albuminúria A${a}`,
      detalhes: [
        { rotulo: 'Categoria de TFG', valor: `${g.estagio} — ${g.descricao}` },
        { rotulo: 'Categoria de albuminúria', valor: `A${a} — ${['normal a levemente aumentada (< 30)', 'moderadamente aumentada (30 a 299)', 'gravemente aumentada (≥ 300)'][a - 1]}` },
        { rotulo: 'Frequência mínima de monitorização', valor: frequencia, nota: 'TFG e albuminúria, conforme o mapa de calor KDIGO.' },
        { rotulo: 'Encaminhamento ao nefrologista', valor: tfg < 30 || rac >= 300 ? 'Indicado' : 'Conforme o contexto', nota: 'Indicações: TFG < 30, albuminúria ≥ 300 mg/g, progressão rápida (queda > 5 mL/min/ano), hematúria glomerular persistente, hipertensão refratária, distúrbio eletrolítico persistente, nefrolitíase de repetição, doença renal hereditária.', nivel: tfg < 30 || rac >= 300 ? 'alerta' : 'neutro' },
      ],
      interpretacao: [
        'O mapa de calor KDIGO cruza dois eixos porque eles carregam informação prognóstica independente: um paciente G3a A1 tem risco muito menor do que um G3a A3, apesar de ambos terem "estágio 3". A albuminúria é, isoladamente, um dos preditores mais fortes de progressão e de evento cardiovascular.',
        '**Pilares do tratamento conservador:** inibidor da ECA ou bloqueador do receptor de angiotensina em dose máxima tolerada quando há albuminúria; **inibidor de SGLT2** para todos com TFG ≥ 20 e albuminúria, com ou sem diabetes (ensaios DAPA-CKD e EMPA-KIDNEY); finerenona em doença renal do diabetes; controle pressórico com alvo de sistólica abaixo de 120 mmHg quando tolerado; estatina; restrição de sódio; e evitar anti-inflamatórios.',
        tfg < 20 ? 'TFG abaixo de 20: momento de discutir modalidade de terapia renal substitutiva, preparar acesso vascular e avaliar transplante preemptivo — que tem os melhores desfechos quando feito antes da diálise.' : 'Mantenha o rastreio anual de anemia, distúrbio mineral e ósseo, acidose metabólica e hipercalemia conforme o estágio.',
        'A albuminúria não é apenas um marcador — ela **participa** da progressão, e entender isso muda a leitura do eixo horizontal do mapa. A barreira de filtração tem três camadas (endotélio fenestrado com glicocálice, membrana basal rica em heparan sulfato que confere seletividade de carga, e os pedicelos podocitários unidos pelo diafragma de fenda com nefrina e podocina), e a albumina é retida por tamanho e por carga simultaneamente. Quando ela escapa, o túbulo proximal a reabsorve via megalina e cubilina; a sobrecarga desse mecanismo ativa NF-κB no epitélio tubular, que passa a produzir citocinas e quimiocinas, recrutar células inflamatórias e estimular fibrose tubulointersticial. E é a fibrose tubulointersticial, não a lesão glomerular, o melhor preditor histológico de progressão para falência renal. Esse é o motivo de reduzir albuminúria ser desfecho intermediário legítimo: as classes que a reduzem — bloqueio do sistema renina-angiotensina-aldosterona, inibidores de SGLT2, finerenona, agonistas de GLP-1 — são exatamente as que retardam a diálise.',
        'Os inibidores de SGLT2 funcionam aqui por um mecanismo hemodinâmico elegante e contraintuitivo. Na doença renal crônica, os néfrons remanescentes hiperfiltram para compensar a perda dos demais, e essa hiperfiltração — mediada por vasodilatação da arteríola aferente — eleva a pressão intraglomerular e acelera a esclerose dos néfrons que sobraram. O inibidor de SGLT2 bloqueia a reabsorção de sódio e glicose no túbulo proximal, aumentando a oferta de sódio à mácula densa; o feedback tubuloglomerular interpreta isso como fluxo excessivo e promove **vasoconstrição da arteríola aferente**, reduzindo a pressão intraglomerular. Daí a queda inicial de TFG de 3 a 5 mL/min nas primeiras semanas, que é **esperada, benéfica e não indica suspender o fármaco** — ela é a assinatura do efeito protetor, e a curva de TFG a longo prazo cruza para cima da do placebo. O bloqueio do sistema renina-angiotensina faz o mesmo por outra via, dilatando a eferente, e por isso também causa queda inicial aceitável de até 30% na creatinina.',
      ],
      conduta: [
        risco >= 3
          ? `**${rotulos[risco]}.** Encaminhe ao nefrologista e monitorize TFG e albuminúria ${frequencia.toLowerCase()}. As indicações formais de encaminhamento são TFG abaixo de 30, albuminúria ≥ 300 mg/g, progressão rápida (queda maior que 5 mL/min por ano), hematúria glomerular persistente, hipertensão refratária, distúrbio eletrolítico persistente, nefrolitíase de repetição e doença renal hereditária.`
          : `**${rotulos[risco]}.** Monitorize TFG e albuminúria ${frequencia.toLowerCase()} e concentre o esforço na prevenção de progressão, que é mais eficaz nesta fase do que em qualquer outra.`,
        'Instale os **quatro pilares** do tratamento conservador, que são aditivos: (1) inibidor da ECA ou bloqueador do receptor de angiotensina em dose máxima tolerada quando há albuminúria; (2) **inibidor de SGLT2** para todos com TFG ≥ 20 e albuminúria, com ou sem diabetes; (3) **finerenona** na doença renal do diabetes com albuminúria persistente apesar do bloqueio do sistema renina-angiotensina; (4) agonista de GLP-1 no diabetes com obesidade ou alto risco cardiovascular.',
        'Não suspenda o inibidor de SGLT2 nem o bloqueador do sistema renina-angiotensina pela **queda inicial de TFG**: uma redução de 3 a 5 mL/min (ou até 30% de elevação de creatinina no caso do bloqueio do sistema renina-angiotensina) nas primeiras semanas é esperada, decorre da redução da pressão intraglomerular e é justamente o mecanismo protetor. Recheque em 2 a 4 semanas e só reavalie se a queda for maior ou progressiva.',
        'Controle pressórico com alvo de sistólica **abaixo de 120 mmHg** quando tolerado e bem aferido, restrição de sódio a menos de 2 g por dia, estatina conforme risco cardiovascular, cessação do tabagismo, controle glicêmico individualizado e atividade física regular.',
        'Evite nefrotóxicos de forma ativa: anti-inflamatórios não esteroidais (inclusive os de venda livre), aminoglicosídeos, contraste iodado desnecessário, e revise doses de todos os fármacos de excreção renal. Oriente **regras de dia de doença** — suspender temporariamente inibidor de SGLT2, bloqueador do sistema renina-angiotensina, diurético, metformina e anti-inflamatório durante vômitos, diarreia ou febre com desidratação.',
        tfg < 60
          ? 'Rastreie e trate as complicações do estágio: **anemia** (ferro e eritropoetina conforme alvos), **distúrbio mineral e ósseo** (cálcio, fósforo, PTH, vitamina D), **acidose metabólica** (bicarbonato oral se abaixo de 22 mEq/L, que reduz a progressão), **hipercalemia** (dieta, diurético, quelante moderno para permitir manter o bloqueio do sistema renina-angiotensina) e desnutrição.'
          : 'Neste estágio, a prioridade é etiológica e preventiva: defina a causa da doença renal, trate-a especificamente quando possível, e mantenha a vigilância de albuminúria — é o marcador que muda primeiro.',
        tfg < 20
          ? 'TFG abaixo de 20 é o momento de **preparar o futuro, não de esperar**: discuta as modalidades (hemodiálise, diálise peritoneal, transplante, tratamento conservador não dialítico), confeccione acesso vascular com antecedência (a fístula precisa de meses para maturar) e avalie **transplante preemptivo**, que tem os melhores desfechos quando feito antes de iniciar diálise.'
          : 'Calcule o risco de falência renal em 2 e 5 anos com a equação KFRE (Tangri) para orientar a conversa com o paciente e o momento do encaminhamento — ela discrimina melhor que o estágio isolado.',
      ],
      alertas: [
        'O diagnóstico exige alterações **persistentes por mais de 3 meses**. Classificar uma TFG baixa isolada como doença renal crônica pode rotular indevidamente uma lesão renal aguda reversível.',
        'TFG normal com albuminúria já é doença renal crônica (G1A2, G1A3) e já exige tratamento. Esperar a TFG cair perde a fase de maior eficácia da intervenção.',
        'A queda inicial de TFG após iniciar inibidor de SGLT2 ou bloqueio do sistema renina-angiotensina é **esperada e protetora**. Suspender o fármaco por causa dela é erro comum que retira do paciente a terapia que mais adia a diálise.',
        'Queda abrupta de TFG em paciente com doença renal crônica é lesão aguda sobreposta, não progressão. Investigue desidratação, nefrotóxico, obstrução e hipoperfusão antes de reclassificar.',
        'A creatinina superestima a função em sarcopenia, amputação, cirrose e desnutrição, e a subestima em pessoas muito musculosas. Nessas situações, use cistatina C.',
        'O mapa estratifica risco, mas não dispensa **diagnóstico etiológico**. Doença glomerular, obstrutiva, policística e intersticial têm condutas específicas que o estágio não revela.',
      ],
      tabela: {
        titulo: 'Mapa de risco KDIGO (linhas = TFG, colunas = albuminúria)',
        colunas: ['TFG', 'A1 (< 30)', 'A2 (30–299)', 'A3 (≥ 300)'],
        linhas: [
          ['G1 ≥ 90', 'Baixo', 'Moderado', 'Alto'],
          ['G2 60–89', 'Baixo', 'Moderado', 'Alto'],
          ['G3a 45–59', 'Moderado', 'Alto', 'Alto'],
          ['G3b 30–44', 'Alto', 'Alto', 'Muito alto'],
          ['G4 15–29', 'Muito alto', 'Muito alto', 'Muito alto'],
          ['G5 < 15', 'Muito alto', 'Muito alto', 'Muito alto'],
        ],
        destaque: gIdx,
      },
    }
  },
  formula: ['Estágio = categoria G (TFG) × categoria A (albuminúria)'],
  fundamento:
    'A classificação por TFG isolada, usada até 2012, tratava como iguais pacientes com prognósticos radicalmente diferentes. O consórcio CKD-PC analisou mais de um milhão de indivíduos e demonstrou que TFG e albuminúria predizem mortalidade, evento cardiovascular e falência renal de forma **independente e multiplicativa** — daí o mapa bidimensional. A razão fisiopatológica de os dois eixos serem independentes é que eles medem coisas diferentes. A **TFG** mede quanta massa de néfrons funcionantes restou, sendo portanto um marcador de perda já consumada. A **albuminúria** mede a integridade da barreira de filtração glomerular e a atividade do processo lesivo, sendo marcador de dano em curso. Essa barreira tem três camadas — endotélio fenestrado com glicocálice, membrana basal glomerular rica em proteoglicanos de heparan sulfato (que confere seletividade de carga) e os pedicelos dos podócitos unidos pelo diafragma de fenda com nefrina e podocina. A albumina, ânion de cerca de 66 kDa, é retida por barreira de tamanho e de carga simultaneamente; sua passagem denuncia lesão dessas camadas, tipicamente por perda de carga aniônica e por lesão podocitária. Mais que um marcador, a albuminúria é **causal** na progressão: a albumina filtrada é reabsorvida pelo túbulo proximal via megalina e cubilina, e a sobrecarga desse mecanismo ativa NF-κB, induz produção de citocinas e quimiocinas pelo próprio túbulo, recruta células inflamatórias e promove fibrose tubulointersticial — que é o melhor preditor histológico de progressão, melhor que a lesão glomerular. Por isso reduzir albuminúria é desfecho intermediário legítimo, e não apenas cosmético: as classes que a reduzem (inibidores do sistema renina-angiotensina-aldosterona, inibidores de SGLT2, antagonistas não esteroidais do receptor mineralocorticoide, agonistas de GLP-1) são justamente as que retardam a falência renal.',
  armadilhas: [
    'O diagnóstico exige persistência por mais de 3 meses. Uma TFG baixa isolada pode ser lesão aguda.',
    'A relação albumina/creatinina em amostra isolada deve ser confirmada em pelo menos duas de três amostras, preferencialmente da primeira urina da manhã — exercício, febre, infecção urinária e insuficiência cardíaca elevam transitoriamente.',
    'Albuminúria e proteinúria não são a mesma medida. A relação proteína/creatinina detecta também cadeias leves e proteínas tubulares, tem cortes diferentes e é a escolhida quando se suspeita de mieloma ou de doença tubular.',
    'TFG normal com albuminúria (estágio G1A2 ou G1A3) **já é** doença renal crônica e já exige tratamento. Aguardar a TFG cair para agir perde a fase em que a intervenção é mais eficaz.',
    'A creatinina superestima a função renal em sarcopenia, amputação, cirrose e desnutrição, e a subestima em pessoas muito musculosas. Nessas situações, considere cistatina C.',
    'O mapa de calor estratifica risco, não substitui o diagnóstico etiológico. Procure a causa — diabética, hipertensiva, glomerular, obstrutiva, policística, intersticial — porque algumas têm tratamento específico.',
    'Queda abrupta de TFG num paciente com doença renal crônica é lesão aguda sobreposta, e não progressão. Investigue desidratação, nefrotóxico, obstrução e hipoperfusão antes de reclassificar o estágio.',
  ],
  referencias: [
    { texto: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117-S314.' },
    { texto: 'Heerspink HJL, Stefánsson BV, Correa-Rotter R, et al. Dapagliflozin in patients with chronic kidney disease (DAPA-CKD). N Engl J Med. 2020;383(15):1436-1446.' },
  ],
}

const mehran: Ferramenta = {
  id: 'risco-nefropatia-contraste',
  nome: 'Risco de nefropatia por contraste (escore de Mehran)',
  sinonimos: ['mehran', 'nefropatia por contraste', 'nic', 'contraste iodado'],
  resumo: 'Estima a probabilidade de lesão renal e de diálise após intervenção coronariana.',
  categorias: ['nefrologia', 'cardiologia'],
  campos: [
    campoSimNao('hipotensao', 'Hipotensão (PAS < 80 mmHg por ≥ 1 h com suporte inotrópico)', 5, 'Item de maior peso, junto com balão e insuficiência cardíaca. Reflete o eixo PERFUSÃO: a medula externa já opera com pO₂ de 10 a 20 mmHg, e qualquer queda adicional de fluxo precipita hipóxia medular.'),
    campoSimNao('balao', 'Balão intra-aórtico', 5, 'Marca instabilidade hemodinâmica grave e acrescenta risco de ateroembolismo renal por manipulação aórtica.'),
    campoSimNao('icc', 'Insuficiência cardíaca classe III/IV ou edema agudo prévio', 5, 'Duplo problema: reduz a perfusão renal e limita a hidratação profilática, que é a única medida eficaz. Nesses pacientes, ajuste a taxa e monitore congestão.'),
    campoSimNao('idade', 'Idade > 75 anos', 4),
    campoSimNao('anemia', 'Anemia (hematócrito < 39% em homens, < 36% em mulheres)', 3, 'Agrava a hipóxia medular ao reduzir o conteúdo arterial de oxigênio. Em procedimento eletivo, é fator corrigível antes do exame.'),
    campoSimNao('diabetes', 'Diabetes mellitus', 3, 'Disfunção endotelial com reserva vasodilatadora reduzida — o rim diabético tolera pior a vasoconstrição induzida pelo contraste.'),
    campoNum('contraste', 'Volume de contraste', { unidade: 'mL', min: 0, max: 800, passo: 10, ajuda: '1 ponto a cada 100 mL. É a ÚNICA variável modificável do escore — planeje o menor volume compatível com o objetivo diagnóstico e prefira contraste iso-osmolar ou de baixa osmolalidade.' }),
    campoSeg('funcaoRenal', 'Função renal basal', [
      { valor: 'cr', rotulo: 'Por creatinina' },
      { valor: 'tfg', rotulo: 'Por TFG' },
    ]),
    { ...campoSimNao('crAlta', 'Creatinina > 1,5 mg/dL', 4), mostrarSe: (v: Valores) => opc(v, 'funcaoRenal') === 'cr' },
    campoOpc('tfgCat', 'TFG estimada', [
      { valor: '0', rotulo: '≥ 60 mL/min/1,73 m²', pontos: 0 },
      { valor: '2', rotulo: '40 a 59', pontos: 2 },
      { valor: '4', rotulo: '20 a 39', pontos: 4 },
      { valor: '6', rotulo: '< 20', pontos: 6 },
    ], { mostrarSe: (v) => opc(v, 'funcaoRenal') === 'tfg' }),
  ],
  calcular: (v) => {
    const contraste = num(v, 'contraste')
    if (contraste === null) return null
    const usaTfg = opc(v, 'funcaoRenal') === 'tfg'
    const pontosRenal = usaTfg ? (num(v, 'tfgCat') ?? 0) : pts(v, 'crAlta', 4)
    const total =
      somaSimNao(v, [
        { id: 'hipotensao', pontos: 5 },
        { id: 'balao', pontos: 5 },
        { id: 'icc', pontos: 5 },
        { id: 'idade', pontos: 4 },
        { id: 'anemia', pontos: 3 },
        { id: 'diabetes', pontos: 3 },
      ]) +
      Math.floor(contraste / 100) +
      pontosRenal
    const faixa = total <= 5 ? 0 : total <= 10 ? 1 : total <= 15 ? 2 : 3
    const risco = ['7,5%', '14,0%', '26,1%', '57,3%'][faixa]
    const dialise = ['0,04%', '0,12%', '1,09%', '12,6%'][faixa]
    return {
      titulo: 'Escore de Mehran',
      valor: String(total),
      unidade: 'pontos',
      nivel: (['ok', 'atencao', 'alerta', 'critico'] as Nivel[])[faixa],
      rotuloNivel: ['Risco baixo', 'Risco moderado', 'Risco alto', 'Risco muito alto'][faixa],
      detalhes: [
        { rotulo: 'Risco de nefropatia por contraste', valor: risco },
        { rotulo: 'Risco de necessidade de diálise', valor: dialise },
        { rotulo: 'Pontos pelo volume de contraste', valor: String(Math.floor(contraste / 100)), nota: `${fmtInt(contraste)} mL — 1 ponto a cada 100 mL. O volume é a única variável modificável do escore.` },
      ],
      interpretacao: [
        '**A única medida com benefício consistentemente demonstrado é a hidratação com cristaloide isotônico**: salina 0,9% a 1 a 1,5 mL/kg/h por 3 a 12 horas antes e 6 a 24 horas depois do procedimento, ajustada em quem tem insuficiência cardíaca.',
        'N-acetilcisteína e bicarbonato de sódio foram testados no ensaio PRESERVE, com mais de 5 mil pacientes de alto risco, e **não** reduziram desfechos clinicamente relevantes em comparação com salina e placebo. Não são recomendados.',
        'Minimize o volume de contraste, use contraste iso-osmolar ou de baixa osmolalidade, evite exames contrastados repetidos em intervalo curto e suspenda anti-inflamatórios e outros nefrotóxicos no período.',
        'A magnitude do problema vem sendo revista: estudos com grupo-controle pareado mostram que boa parte da elevação de creatinina atribuída ao contraste ocorreria de qualquer forma pela doença de base. Isso não autoriza descuido, mas desaconselha adiar exame indispensável por medo do contraste.',
        'O contraste iodado lesa o rim por **dois mecanismos somados**, e conhecê-los explica por que a hidratação é a única medida que funciona. O primeiro é **hemodinâmico**: o contraste desencadeia vasoconstrição renal prolongada, mediada por adenosina e endotelina com redução de óxido nítrico, que reduz o fluxo sanguíneo sobretudo na medula externa. Essa região já trabalha no limite — a bomba Na⁺/K⁺-ATPase do ramo ascendente espesso da alça de Henle consome enormes quantidades de oxigênio para gerar o gradiente medular, enquanto a perfusão medular é normalmente baixa por desenho, o que mantém a pO₂ local em torno de 10 a 20 mmHg mesmo em condições normais. Qualquer redução adicional de fluxo precipita hipóxia medular. O segundo mecanismo é **tóxico direto**: o contraste, sobretudo o de alta osmolalidade, causa vacuolização e apoptose do epitélio tubular, gera espécies reativas de oxigênio e aumenta a viscosidade do fluido tubular, o que eleva a pressão intratubular e reduz ainda mais a filtração. Como o dano final é hipóxia medular somada a toxicidade tubular, a hidratação atua exatamente onde importa: expande o volume intravascular, suprime a vasopressina e a angiotensina II (reduzindo a vasoconstrição), aumenta o fluxo tubular diluindo o contraste e encurtando seu tempo de contato com o epitélio, e reduz a reabsorção de sódio no ramo ascendente — o que diminui o consumo de oxigênio medular. Nenhum antioxidante conseguiu reproduzir essa combinação, e é por isso que a N-acetilcisteína falhou.',
      ],
      conduta: [
        '**Hidratação com cristaloide isotônico é a única medida com benefício consistentemente demonstrado.** Salina 0,9% a 1 a 1,5 mL/kg/h por 3 a 12 horas antes e 6 a 24 horas depois do procedimento. Em insuficiência cardíaca, reduza a taxa e considere protocolo guiado por pressão venosa central ou por pressão de oclusão — hidratar demais um cardiopata troca um problema por outro.',
        '**Não use N-acetilcisteína nem bicarbonato de sódio.** O ensaio PRESERVE, com mais de 5 mil pacientes de alto risco, não mostrou benefício em desfechos clinicamente relevantes contra salina e placebo. Prescrevê-los dá falsa sensação de proteção e desvia a atenção da hidratação, que é o que funciona.',
        'Minimize a **dose de contraste** — é a única variável modificável do escore. Use o menor volume compatível com o objetivo diagnóstico, prefira contraste iso-osmolar ou de baixa osmolalidade, e evite exames contrastados repetidos em intervalo menor que 48 a 72 horas.',
        'Suspenda nefrotóxicos no período: anti-inflamatórios não esteroidais, aminoglicosídeos e diuréticos em excesso. A **metformina** não causa nefropatia por contraste — a preocupação é acidose lática se houver lesão renal —, e a orientação atual é suspendê-la no dia do exame apenas quando a TFG for inferior a 30, ou em exame arterial com TFG entre 30 e 60, reintroduzindo após 48 horas com função renal confirmada.',
        'Quanto ao **bloqueio do sistema renina-angiotensina** e ao inibidor de SGLT2: não há consenso firme para suspensão de rotina, mas é razoável suspendê-los em pacientes de alto risco com hipovolemia ou instabilidade, retomando depois. Mantenha as estatinas, que possivelmente conferem proteção discreta.',
        faixa >= 2
          ? `**Risco ${faixa === 2 ? 'alto' : 'muito alto'}** (${risco} de nefropatia e ${dialise} de necessidade de diálise). Reavalie se o exame contrastado é realmente indispensável ou se há alternativa sem contraste iodado — ultrassonografia, ressonância sem gadolínio, tomografia sem contraste, cintilografia. Se for indispensável, discuta com a nefrologia, hidrate com protocolo rigoroso, use a menor dose possível e programe controle de creatinina em 48 a 72 horas.`
          : `Risco ${faixa === 0 ? 'baixo' : 'moderado'} (${risco} de nefropatia). Hidratação padrão, dose mínima de contraste e controle de creatinina em 48 a 72 horas nos pacientes com função renal previamente alterada.`,
        'Dose a creatinina em **48 a 72 horas** após o exame nos pacientes de risco — o pico da elevação ocorre nessa janela, e a alta antes dela pode mascarar o evento. Classifique pelos critérios KDIGO, não pela definição antiga do escore.',
        'Não adie exame indispensável por medo do contraste. A magnitude do risco vem sendo revista para baixo em estudos com controle pareado, e postergar o diagnóstico de uma dissecção, de uma embolia pulmonar ou de uma isquemia mesentérica causa mais dano do que o contraste.',
      ],
      alertas: [
        'O escore foi derivado em **cardiologia intervencionista, com contraste intra-arterial**. Tomografia com contraste intravenoso tem risco substancialmente menor, e aplicar o escore diretamente nesse cenário superestima de forma importante.',
        'A definição usada na derivação (aumento de creatinina ≥ 25% ou ≥ 0,5 mg/dL em 48 horas) é mais frouxa que os critérios KDIGO atuais, o que infla as taxas relatadas.',
        'N-acetilcisteína e bicarbonato **não** funcionam. Prescrevê-los não é neutro: cria falsa segurança e substitui a hidratação, que é a medida efetiva.',
        'Hidratação agressiva em paciente com insuficiência cardíaca ou disfunção ventricular pode precipitar congestão pulmonar. Ajuste a taxa e monitore.',
        'O risco de **nefrogênica sistêmica fibrosante** é do gadolínio, não do iodo, e diz respeito aos agentes lineares em TFG muito baixa. Não confunda as duas profilaxias.',
        'Anemia e hipotensão são fatores de risco no escore e também são corrigíveis antes de um procedimento eletivo — otimizá-los é parte da preparação, não detalhe.',
      ],
      tabela: {
        titulo: 'Estratificação de Mehran',
        colunas: ['Pontos', 'Nefropatia', 'Diálise'],
        linhas: [['≤ 5', '7,5%', '0,04%'], ['6 – 10', '14,0%', '0,12%'], ['11 – 15', '26,1%', '1,09%'], ['≥ 16', '57,3%', '12,6%']],
        destaque: faixa,
      },
    }
  },
  formula: ['Soma de 8 variáveis; 1 ponto a cada 100 mL de contraste'],
  fundamento:
    'O escore foi derivado de mais de 8 mil intervenções coronarianas percutâneas e valida a intuição clínica: o risco resulta da interação entre função renal prévia, perfusão renal no momento do exame (hipotensão, insuficiência cardíaca, balão intra-aórtico), suscetibilidade (idade, diabetes, anemia) e dose do agressor (volume de contraste). Essa estrutura espelha a fisiopatologia, que combina dois mecanismos. O primeiro é **hemodinâmico**: o contraste provoca vasoconstrição renal prolongada por adenosina e endotelina, com queda de óxido nítrico, reduzindo o fluxo na medula externa. Essa região é singularmente vulnerável porque opera com pO₂ de 10 a 20 mmHg mesmo em condições normais — a bomba Na⁺/K⁺-ATPase do ramo ascendente espesso consome muito oxigênio para gerar o gradiente medular, enquanto a perfusão medular é baixa por desenho anatômico. Qualquer redução adicional precipita hipóxia. O segundo é **tóxico direto**: vacuolização e apoptose do epitélio tubular, produção de espécies reativas de oxigênio e aumento da viscosidade do fluido tubular, que eleva a pressão intratubular e reduz ainda mais a filtração. Ler o escore por essa lente organiza os itens: hipotensão, insuficiência cardíaca e balão intra-aórtico são o eixo **perfusão**; idade, diabetes e anemia são o eixo **suscetibilidade** (o diabético tem disfunção endotelial e reserva vasodilatadora reduzida; a anemia agrava a hipóxia medular ao reduzir o conteúdo arterial de oxigênio); função renal prévia é o eixo **reserva**; e o volume de contraste é a **dose do agressor** — a única variável modificável. Isso também explica por que a hidratação é a única profilaxia eficaz: ela age em vários pontos de uma vez (expande volume, suprime vasopressina e angiotensina II, dilui o contraste no túbulo, encurta seu tempo de contato e reduz a reabsorção de sódio no ramo ascendente, diminuindo o consumo de oxigênio medular), enquanto antioxidantes atacam apenas um componente — e o PRESERVE mostrou que isso não basta. Vale uma ressalva de calibração: estudos posteriores com grupo-controle pareado sugerem que parte substancial da elevação de creatinina atribuída ao contraste ocorreria pela doença de base, de modo que as taxas do escore original provavelmente superestimam o risco atribuível.',
  armadilhas: [
    'O escore foi derivado em cardiologia intervencionista, com contraste intra-arterial. Tomografia com contraste intravenoso tem risco substancialmente menor, e aplicar o escore diretamente superestima.',
    'A definição usada na derivação foi aumento de creatinina ≥ 25% ou ≥ 0,5 mg/dL em 48 horas — mais frouxa que os critérios KDIGO atuais.',
    'N-acetilcisteína e bicarbonato não funcionam (PRESERVE). Prescrevê-los cria falsa segurança e frequentemente substitui a hidratação, que é a medida efetiva.',
    'O volume de contraste é a única variável modificável do escore, e é justamente a que mais se negligencia no planejamento do procedimento.',
    'Metformina não causa nefropatia por contraste. A preocupação é acidose lática se houver lesão renal, e a suspensão de rotina em todos os pacientes é conduta desatualizada.',
    'Risco de nefropatia não é motivo para adiar exame indispensável. O dano de postergar o diagnóstico de dissecção, embolia pulmonar ou isquemia mesentérica supera em muito o risco do contraste.',
    'Nefrogênica sistêmica fibrosante é complicação do gadolínio, não do contraste iodado. Confundir as duas leva a profilaxia errada.',
  ],
  referencias: [
    { texto: 'Mehran R, Aymong ED, Nikolsky E, et al. A simple risk score for prediction of contrast-induced nephropathy after percutaneous coronary intervention. J Am Coll Cardiol. 2004;44(7):1393-1399.' },
    { texto: 'Weisbord SD, Gallagher M, Jneid H, et al. Outcomes after angiography with sodium bicarbonate and acetylcysteine (PRESERVE). N Engl J Med. 2018;378(7):603-614.' },
  ],
}

const doseRenal: Ferramenta = {
  id: 'dose-renal-medicamentos',
  nome: 'Ajuste de dose pela função renal',
  sinonimos: ['dose renal', 'ajuste renal', 'medicamento insuficiencia renal'],
  resumo: 'Calcula o clearance e mostra os ajustes de referência das classes mais prescritas.',
  categorias: ['nefrologia', 'farmacologia', 'infectologia'],
  campos: [
    campoCreatinina(),
    campoIdade({ min: 18 }),
    campoSexo(),
    campoPeso(),
    campoOpc('classe', 'Classe do medicamento', [
      { valor: 'betalactamico', rotulo: 'Beta-lactâmicos' },
      { valor: 'quinolona', rotulo: 'Quinolonas' },
      { valor: 'aminoglicosideo', rotulo: 'Aminoglicosídeos' },
      { valor: 'glicopeptideo', rotulo: 'Vancomicina' },
      { valor: 'anticoagulante', rotulo: 'Anticoagulantes orais diretos' },
      { valor: 'antidiabetico', rotulo: 'Antidiabéticos' },
      { valor: 'analgesico', rotulo: 'Analgésicos e anti-inflamatórios' },
      { valor: 'antiviral', rotulo: 'Antivirais' },
    ]),
  ],
  calcular: (v) => {
    const cr = num(v, 'creatinina')
    const idade = num(v, 'idade')
    const peso = num(v, 'peso')
    if (cr === null || idade === null || peso === null || cr <= 0) return null
    const f = opc(v, 'sexo') === 'f'
    const clcr = (((140 - idade) * peso) / (72 * cr)) * (f ? 0.85 : 1)
    const classe = opc(v, 'classe')
    const guias: Record<string, { titulo: string; linhas: string[][] }> = {
      betalactamico: {
        titulo: 'Beta-lactâmicos',
        linhas: [
          ['Piperacilina-tazobactam', '> 40: 4,5 g 6/6 h | 20–40: 4,5 g 8/8 h (ou 3,375 g 6/6 h) | < 20: 4,5 g 12/12 h'],
          ['Meropeném', '> 50: 1 g 8/8 h | 26–50: 1 g 12/12 h | 10–25: 500 mg 12/12 h | < 10: 500 mg 24/24 h'],
          ['Cefepima', '> 60: 2 g 8/8–12/12 h | 30–60: 2 g 24/24 h | 11–29: 1 g 24/24 h | < 11: 500 mg 24/24 h'],
          ['Ceftriaxona', 'Sem ajuste até diálise — eliminação predominantemente biliar'],
          ['Ampicilina', '> 50: 6/6 h | 10–50: 8/8 h | < 10: 12/12 h'],
        ],
      },
      quinolona: {
        titulo: 'Quinolonas',
        linhas: [
          ['Ciprofloxacino', '> 30: 400 mg EV 12/12 h | < 30: 400 mg 24/24 h'],
          ['Levofloxacino', '> 50: 750 mg 24/24 h | 20–49: 750 mg 48/48 h | < 20: 750 mg de ataque e 500 mg 48/48 h'],
          ['Moxifloxacino', 'Sem ajuste — eliminação hepática'],
        ],
      },
      aminoglicosideo: {
        titulo: 'Aminoglicosídeos',
        linhas: [
          ['Gentamicina / tobramicina', 'Dose única diária de 5–7 mg/kg; o ajuste é feito **alargando o intervalo**, não reduzindo a dose'],
          ['Amicacina', '15–20 mg/kg em dose única diária, com intervalo guiado por nível'],
          ['Monitorização', 'Vale (pré-dose) indetectável ou < 1 µg/mL para gentamicina; dosagem obrigatória a partir de 48–72 h de uso'],
        ],
      },
      glicopeptideo: {
        titulo: 'Vancomicina',
        linhas: [
          ['Ataque', '25–30 mg/kg de peso real, independentemente da função renal'],
          ['Manutenção', '15–20 mg/kg conforme clearance; a partir de ClCr < 50 o intervalo se alarga progressivamente'],
          ['Alvo', 'AUC/CIM de 400 a 600 mg·h/L é o alvo atual — o vale de 15 a 20 mg/L foi abandonado por nefrotoxicidade'],
        ],
      },
      anticoagulante: {
        titulo: 'Anticoagulantes orais diretos (fibrilação atrial não valvar)',
        linhas: [
          ['Rivaroxabana', 'ClCr ≥ 50: 20 mg/dia | 15–49: 15 mg/dia | < 15: contraindicada'],
          ['Apixabana', '5 mg 12/12 h; reduzir a 2,5 mg 12/12 h se 2 de 3: idade ≥ 80, peso ≤ 60 kg, creatinina ≥ 1,5 mg/dL'],
          ['Edoxabana', 'ClCr 15–50: 30 mg/dia | > 95: eficácia reduzida, evitar'],
          ['Dabigatrana', 'ClCr ≥ 30: 150 mg 12/12 h | < 30: contraindicada. É o mais dependente do rim (80% de eliminação renal)'],
        ],
      },
      antidiabetico: {
        titulo: 'Antidiabéticos',
        linhas: [
          ['Metformina', 'TFG ≥ 45: dose plena | 30–44: máximo 1000 mg/dia, não iniciar | < 30: contraindicada'],
          ['Inibidores de SGLT2', 'Iniciar com TFG ≥ 20; manter até diálise pelo benefício renal e cardiovascular, mesmo com efeito glicêmico reduzido'],
          ['Sulfonilureias', 'Glibenclamida contraindicada abaixo de 60 — risco de hipoglicemia prolongada. Gliclazida é a preferida'],
          ['Inibidores de DPP-4', 'Linagliptina não exige ajuste; as demais exigem'],
        ],
      },
      analgesico: {
        titulo: 'Analgésicos e anti-inflamatórios',
        linhas: [
          ['Anti-inflamatórios não esteroidais', 'Evitar com TFG < 60; contraindicados com TFG < 30'],
          ['Morfina', 'Metabólitos ativos (M6G) acumulam — evitar ou reduzir muito na doença renal avançada'],
          ['Codeína e tramadol', 'Acúmulo de metabólitos; reduzir dose e alargar intervalo'],
          ['Fentanil e metadona', 'As opções mais seguras na insuficiência renal — sem metabólito ativo relevante'],
          ['Paracetamol', 'Seguro; alargar o intervalo para 8/8 h com ClCr < 10'],
        ],
      },
      antiviral: {
        titulo: 'Antivirais',
        linhas: [
          ['Aciclovir EV', 'Exige ajuste agressivo. Cristalúria e neurotoxicidade são as complicações; hidratação é obrigatória'],
          ['Oseltamivir', 'ClCr 30–60: 30 mg 12/12 h | 10–30: 30 mg/dia'],
          ['Tenofovir', 'Nefrotóxico. Preferir alafenamida à disoproxila em doença renal'],
          ['Valganciclovir', 'Ajuste rigoroso — mielotoxicidade dose-dependente'],
        ],
      },
    }
    const guia = guias[classe] ?? guias.betalactamico
    const nivel: Nivel = clcr < 15 ? 'critico' : clcr < 30 ? 'alerta' : clcr < 60 ? 'atencao' : 'ok'
    return {
      titulo: 'Clearance de creatinina (Cockcroft-Gault)',
      valor: fmtInt(clcr),
      unidade: 'mL/min',
      nivel,
      rotuloNivel: clcr >= 60 ? 'Sem necessidade de ajuste na maioria dos fármacos' : clcr >= 30 ? 'Ajuste necessário em vários fármacos' : clcr >= 15 ? 'Ajuste obrigatório' : 'Faixa de diálise — reveja cada prescrição',
      detalhes: [{ rotulo: 'Fórmula usada', valor: 'Cockcroft-Gault', nota: 'É a fórmula à qual as bulas se referem. Não substitua por CKD-EPI para ajuste de dose sem verificar a referência.' }],
      conduta: [
        'Antes de ajustar, decida **qual estimativa usar**: para a maior parte das bulas, sobretudo anticoagulantes orais diretos, o corte foi derivado do **Cockcroft-Gault não indexado**. Usar a CKD-EPI indexada a 1,73 m² em paciente muito magro ou muito obeso desloca a faixa de dose e pode gerar subdose ou superdose.',
        '**Não ajuste pela creatinina em lesão renal aguda com função instável.** A creatinina em ascensão subestima grosseiramente a perda funcional; nesse cenário, doses devem ser conservadoras, com dosagem sérica do fármaco quando disponível (vancomicina, aminoglicosídeos, digoxina, lítio, fenitoína).',
        'Escolha entre **reduzir a dose** e **espaçar o intervalo** conforme o mecanismo: antimicrobianos tempo-dependentes (betalactâmicos) mantêm eficácia melhor com dose reduzida em intervalo preservado, enquanto os concentração-dependentes (aminoglicosídeos) exigem dose plena com intervalo alargado, para preservar o pico bactericida e permitir o vale baixo que protege o rim.',
        'Mantenha uma lista de **fármacos a evitar** em filtração reduzida: metformina abaixo de 30 mL/min/1,73 m², anti-inflamatórios em qualquer estágio avançado, nitrofurantoína abaixo de 30, gadolínio linear pelo risco de fibrose sistêmica nefrogênica, e enoxaparina em dose terapêutica abaixo de 30 sem monitorização de anti-Xa.',
        'Reveja a prescrição inteira **a cada mudança de estágio**, inclusive na recuperação: o paciente que sai da diálise ou recupera função passa a subdosar se as doses reduzidas forem mantidas — falha terapêutica silenciosa que acontece com antimicrobianos e antiepilépticos com frequência.',
      ],
      interpretacao: [
        'Duas estratégias de ajuste, e a escolha depende da farmacodinâmica: fármacos **tempo-dependentes** (beta-lactâmicos) preservam a dose e alargam o intervalo ou usam infusão estendida; fármacos **concentração-dependentes** (aminoglicosídeos, quinolonas) preservam o pico e alargam o intervalo. Reduzir a dose de um aminoglicosídeo em vez de espaçá-lo compromete a eficácia sem reduzir a toxicidade.',
        '**A dose de ataque nunca se ajusta pela função renal.** Ela depende do volume de distribuição, não do clearance. Reduzir o ataque é o erro que mais atrasa o alcance da concentração terapêutica em sepse.',
        'Na lesão renal aguda, a fórmula superestima o clearance: a creatinina ainda não subiu ao que corresponderia à função atual. Nessa fase, seja mais conservador do que o número sugere.',
      ],
      alertas: ['Esta é uma tabela de referência rápida. Confira sempre a bula, o protocolo institucional e, quando disponível, a monitorização de nível sérico — sobretudo para vancomicina, aminoglicosídeos e anticonvulsivantes.'],
      tabela: { titulo: guia.titulo, colunas: ['Fármaco', 'Ajuste (ClCr em mL/min)'], linhas: guia.linhas },
    }
  },
  formula: ['ClCr = [(140 − idade) × peso] ÷ (72 × creatinina) × 0,85 se ♀'],
  fundamento:
    'A eliminação renal de um fármaco é proporcional à fração eliminada inalterada pelo rim. Fármacos com eliminação predominantemente hepática (moxifloxacino, ceftriaxona, linagliptina, fentanil) dispensam ajuste; fármacos com eliminação renal alta (dabigatrana, aminoglicosídeos, vancomicina, aciclovir) exigem ajuste rigoroso. Saber qual é qual é mais útil do que decorar tabelas. O ajuste é necessário quando uma fração relevante do fármaco ou de seu metabólito ativo é eliminada por via renal, e a lógica de como ajustar segue a farmacodinâmica: fármacos **tempo-dependentes**, cuja eficácia depende do tempo acima da concentração inibitória mínima, preservam o intervalo e reduzem a dose; fármacos **concentração-dependentes**, cuja eficácia depende do pico, preservam a dose e alargam o intervalo — o que nos aminoglicosídeos tem a vantagem adicional de permitir um vale baixo, que é o que reduz a nefrotoxicidade e a ototoxicidade por acúmulo no córtex renal e na endolinfa.',
  armadilhas: [
    'Terapia renal substitutiva contínua tem clearance próprio, muitas vezes maior do que o esperado para a "insuficiência renal" — a subdose de antimicrobiano nesse cenário é frequente e subestimada.',
    'Obesidade exige peso ajustado no cálculo do clearance, sob pena de superestimar e superdosar.',
  ],
  referencias: [
    { texto: 'Matzke GR, Aronoff GR, Atkinson AJ, et al. Drug dosing consideration in patients with acute and chronic kidney disease. Kidney Int. 2011;80(11):1122-1137.' },
    { texto: 'Rybak MJ, Le J, Lodise TP, et al. Therapeutic monitoring of vancomycin for serious MRSA infections: a revised consensus guideline. Am J Health Syst Pharm. 2020;77(11):835-864.' },
  ],
}

export const ferramentas: Ferramenta[] = [
  tfg,
  cockcroft,
  schwartz,
  sodioCorrigido,
  calcioCorrigido,
  osmolaridade,
  fena,
  deficitAgua,
  correcaoHipo,
  potassio,
  ureiaCreatinina,
  kdigo,
  drc,
  mehran,
  doseRenal,
]

export default ferramentas
