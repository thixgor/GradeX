import type { Ferramenta, Nivel, Resultado, Valores } from '../tipos'
import {
  PATM,
  PH2O,
  campoNum,
  campoSeg,
  fmt,
  fmtInt,
  fmtLivre,
  num,
  numOu,
  opc,
  pAO2,
} from '../helpers'

/* ═══════════════════════════════════════════════════════════════════════════
   Núcleo ácido-base compartilhado.

   Todas as ferramentas desta categoria falam a mesma língua, e essa língua é
   definida aqui uma única vez: como se calcula o bicarbonato a partir do pH e
   da PaCO₂, quais são as quatro compensações esperadas e o que significa uma
   compensação fora da faixa. Reimplementar Winter em três lugares diferentes é
   como o mesmo paciente recebe três interpretações distintas.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Henderson-Hasselbalch resolvida para HCO₃⁻ (mEq/L). pK 6,1; α 0,0301. */
export function hco3DeHH(ph: number, paco2: number): number {
  return 0.0301 * paco2 * Math.pow(10, ph - 6.1)
}

/** Henderson-Hasselbalch resolvida para pH. */
export function phDeHH(hco3: number, paco2: number): number {
  return 6.1 + Math.log10(hco3 / (0.0301 * paco2))
}

/**
 * Excesso de base padrão (SBE) pela equação de Van Slyke na forma simplificada
 * de Siggaard-Andersen para o líquido extracelular (hemoglobina 5 g/dL, que é
 * a diluição da hemoglobina do sangue no compartimento extracelular inteiro).
 */
export function sbe(hco3: number, ph: number): number {
  return 0.9287 * (hco3 - 24.4 + 14.83 * (ph - 7.4))
}

/**
 * Bicarbonato padrão: o HCO₃⁻ que a amostra teria se equilibrada a PaCO₂ de
 * 40 mmHg, 37 °C e hemoglobina saturada. Como o SBE é, por construção,
 * independente da PaCO₂, o valor sai resolvendo simultaneamente Henderson-
 * Hasselbalch a 40 mmHg e a equação de Van Slyke com o SBE da amostra. Não há
 * forma fechada — a bisseção converge em ~40 passos para 1e-6 de pH.
 */
export function bicarbonatoPadrao(ph: number, paco2: number): number {
  const alvo = sbe(hco3DeHH(ph, paco2), ph)
  let lo = 6.4
  let hi = 8.2
  for (let i = 0; i < 60; i++) {
    const meio = (lo + hi) / 2
    const hco3 = 0.0301 * 40 * Math.pow(10, meio - 6.1)
    const valor = 0.9287 * (hco3 - 24.4 + 14.83 * (meio - 7.4))
    if (valor < alvo) lo = meio
    else hi = meio
  }
  const phFinal = (lo + hi) / 2
  return 0.0301 * 40 * Math.pow(10, phFinal - 6.1)
}

export type DisturbioPrimario =
  | 'normal'
  | 'acidose-metabolica'
  | 'alcalose-metabolica'
  | 'acidose-respiratoria'
  | 'alcalose-respiratoria'
  | 'misto'

export const NOME_DISTURBIO: Record<DisturbioPrimario, string> = {
  normal: 'Sem distúrbio primário identificável',
  'acidose-metabolica': 'Acidose metabólica',
  'alcalose-metabolica': 'Alcalose metabólica',
  'acidose-respiratoria': 'Acidose respiratória',
  'alcalose-respiratoria': 'Alcalose respiratória',
  misto: 'Distúrbio misto',
}

/**
 * Identifica o distúrbio primário pela regra clássica de três passos.
 *
 * O sinal do pH manda: quem move o pH para longe de 7,40 é o primário, quem
 * move de volta é a compensação. Quando pH, PaCO₂ e HCO₃⁻ apontam para o mesmo
 * lado, não há compensação possível — é misto por definição, e isso é uma
 * conclusão, não uma dúvida.
 */
export function classificarPrimario(
  ph: number,
  paco2: number,
  hco3: number,
): { disturbio: DisturbioPrimario; acidemia: boolean; alcalemia: boolean; nota: string } {
  const acidemia = ph < 7.35
  const alcalemia = ph > 7.45
  const co2Alto = paco2 > 45
  const co2Baixo = paco2 < 35
  const hco3Alto = hco3 > 26
  const hco3Baixo = hco3 < 22

  if (acidemia) {
    if (hco3Baixo && co2Alto)
      return {
        disturbio: 'misto',
        acidemia,
        alcalemia,
        nota: 'HCO₃⁻ baixo e PaCO₂ alta ao mesmo tempo: acidose metabólica e respiratória somadas. Nenhuma delas é compensação da outra — compensação move o pH de volta, e aqui as duas o empurram para baixo.',
      }
    if (hco3Baixo)
      return { disturbio: 'acidose-metabolica', acidemia, alcalemia, nota: 'HCO₃⁻ reduzido é o motor da acidemia; espera-se hiperventilação compensatória.' }
    if (co2Alto)
      return { disturbio: 'acidose-respiratoria', acidemia, alcalemia, nota: 'PaCO₂ elevada é o motor da acidemia; espera-se retenção renal de bicarbonato.' }
    return {
      disturbio: 'misto',
      acidemia,
      alcalemia,
      nota: 'Acidemia sem HCO₃⁻ baixo nem PaCO₂ alta francos — reveja a coleta (amostra venosa? bolha de ar? heparina em excesso?) antes de aceitar o resultado.',
    }
  }

  if (alcalemia) {
    if (hco3Alto && co2Baixo)
      return {
        disturbio: 'misto',
        acidemia,
        alcalemia,
        nota: 'HCO₃⁻ alto e PaCO₂ baixa ao mesmo tempo: alcalose metabólica e respiratória somadas — combinação clássica de cirrose com vômitos, ou de gestante com diurético.',
      }
    if (hco3Alto)
      return { disturbio: 'alcalose-metabolica', acidemia, alcalemia, nota: 'HCO₃⁻ elevado é o motor da alcalemia; espera-se hipoventilação compensatória, sempre modesta.' }
    if (co2Baixo)
      return { disturbio: 'alcalose-respiratoria', acidemia, alcalemia, nota: 'PaCO₂ reduzida é o motor da alcalemia; espera-se queda renal do bicarbonato, lenta.' }
    return { disturbio: 'misto', acidemia, alcalemia, nota: 'Alcalemia sem causa aparente nos dois eixos — reveja a amostra.' }
  }

  // pH normal não é sinônimo de gasometria normal.
  if (hco3Baixo && co2Baixo)
    return {
      disturbio: 'acidose-metabolica',
      acidemia,
      alcalemia,
      nota: 'pH dentro da faixa, mas HCO₃⁻ e PaCO₂ baixos: acidose metabólica bem compensada — ou acidose metabólica somada a alcalose respiratória. O ânion gap e o delta-delta decidem.',
    }
  if (hco3Alto && co2Alto)
    return {
      disturbio: 'alcalose-metabolica',
      acidemia,
      alcalemia,
      nota: 'pH na faixa com HCO₃⁻ e PaCO₂ altos: alcalose metabólica compensada — ou acidose respiratória crônica. A clínica e o tempo de instalação separam as duas.',
    }
  if (hco3Baixo || hco3Alto || co2Alto || co2Baixo)
    return {
      disturbio: 'misto',
      acidemia,
      alcalemia,
      nota: 'pH normal com um dos eixos deslocado: há distúrbio, e provavelmente mais de um se anulando. Ânion gap obrigatório.',
    }
  return { disturbio: 'normal', acidemia, alcalemia, nota: 'pH, PaCO₂ e HCO₃⁻ dentro das faixas de referência.' }
}

export interface Compensacao {
  esperado: number
  faixaMin: number
  faixaMax: number
  rotulo: string
  formula: string
  observado: number
  adequada: boolean
  leitura: string
}

/** Compensação esperada para cada distúrbio primário. */
export function compensacaoEsperada(
  disturbio: DisturbioPrimario,
  hco3: number,
  paco2: number,
  cronico: boolean,
): Compensacao | null {
  if (disturbio === 'acidose-metabolica') {
    const esp = 1.5 * hco3 + 8
    const adequada = paco2 >= esp - 2 && paco2 <= esp + 2
    return {
      esperado: esp,
      faixaMin: esp - 2,
      faixaMax: esp + 2,
      rotulo: 'PaCO₂ esperada',
      formula: 'Winter: PaCO₂ = 1,5 × HCO₃⁻ + 8 ± 2',
      observado: paco2,
      adequada,
      leitura: adequada
        ? 'Compensação respiratória adequada — não há segundo distúrbio respiratório.'
        : paco2 > esp + 2
          ? 'PaCO₂ acima do esperado: há acidose respiratória associada. Em acidose metabólica grave isso costuma significar fadiga da musculatura respiratória — é indicação de via aérea, não de mais bicarbonato.'
          : 'PaCO₂ abaixo do esperado: há alcalose respiratória associada (dor, sepse, salicilato, hepatopatia, gestação).',
    }
  }
  if (disturbio === 'alcalose-metabolica') {
    const esp = 40 + 0.7 * (hco3 - 24)
    const adequada = paco2 >= esp - 5 && paco2 <= esp + 5
    return {
      esperado: esp,
      faixaMin: esp - 5,
      faixaMax: esp + 5,
      rotulo: 'PaCO₂ esperada',
      formula: 'PaCO₂ = 40 + 0,7 × (HCO₃⁻ − 24) ± 5',
      observado: paco2,
      adequada,
      leitura: adequada
        ? 'Hipoventilação compensatória dentro do previsto.'
        : paco2 > esp + 5
          ? 'PaCO₂ acima do previsto: acidose respiratória associada.'
          : 'PaCO₂ abaixo do previsto: alcalose respiratória associada.',
    }
  }
  if (disturbio === 'acidose-respiratoria') {
    const delta = (paco2 - 40) / 10
    const esp = cronico ? 24 + 3.5 * delta : 24 + 1 * delta
    const margem = cronico ? 4 : 2
    const adequada = hco3 >= esp - margem && hco3 <= esp + margem
    return {
      esperado: esp,
      faixaMin: esp - margem,
      faixaMax: esp + margem,
      rotulo: 'HCO₃⁻ esperado',
      formula: cronico
        ? 'Crônica: HCO₃⁻ sobe 3,5 mEq/L a cada 10 mmHg de PaCO₂ acima de 40'
        : 'Aguda: HCO₃⁻ sobe 1 mEq/L a cada 10 mmHg de PaCO₂ acima de 40',
      observado: hco3,
      adequada,
      leitura: adequada
        ? `Resposta ${cronico ? 'renal' : 'de tamponamento'} compatível com o quadro ${cronico ? 'crônico' : 'agudo'}.`
        : hco3 > esp + margem
          ? 'HCO₃⁻ acima do esperado: alcalose metabólica associada — pense em diurético de alça, corticoide ou aspiração gástrica no retentor crônico.'
          : 'HCO₃⁻ abaixo do esperado: acidose metabólica associada.',
    }
  }
  if (disturbio === 'alcalose-respiratoria') {
    const delta = (40 - paco2) / 10
    const esp = cronico ? 24 - 4 * delta : 24 - 2 * delta
    const margem = cronico ? 4 : 2
    const adequada = hco3 >= esp - margem && hco3 <= esp + margem
    return {
      esperado: Math.max(esp, 8),
      faixaMin: Math.max(esp - margem, 6),
      faixaMax: esp + margem,
      rotulo: 'HCO₃⁻ esperado',
      formula: cronico
        ? 'Crônica: HCO₃⁻ cai 4 a 5 mEq/L a cada 10 mmHg de PaCO₂ abaixo de 40'
        : 'Aguda: HCO₃⁻ cai 2 mEq/L a cada 10 mmHg de PaCO₂ abaixo de 40',
      observado: hco3,
      adequada,
      leitura: adequada
        ? `Resposta compatível com alcalose respiratória ${cronico ? 'crônica' : 'aguda'}.`
        : hco3 > esp + margem
          ? 'HCO₃⁻ acima do esperado: alcalose metabólica associada.'
          : 'HCO₃⁻ abaixo do esperado: acidose metabólica associada — a combinação clássica é a intoxicação por salicilato.',
    }
  }
  return null
}

const CAMPO_PH = campoNum('ph', 'pH arterial', {
  min: 6.5,
  max: 8,
  passo: 0.01,
  normalMin: 7.35,
  normalMax: 7.45,
  ajuda: 'Referência arterial: 7,35 a 7,45. Sangue venoso costuma vir 0,03 a 0,05 mais baixo.',
})
const CAMPO_PACO2 = campoNum('paco2', 'PaCO₂', {
  unidade: 'mmHg',
  min: 5,
  max: 150,
  passo: 0.5,
  normalMin: 35,
  normalMax: 45,
  ajuda: 'Referência 35 a 45 mmHg. É a variável que o pulmão controla em minutos.',
})
const CAMPO_HCO3 = campoNum('hco3', 'HCO₃⁻', {
  unidade: 'mEq/L',
  min: 1,
  max: 60,
  passo: 0.1,
  normalMin: 22,
  normalMax: 26,
  ajuda: 'Referência 22 a 26. Na gasometria o bicarbonato é calculado pelo aparelho, não medido.',
})

/* ═══════════════════════ 1. Interpretador completo ═══════════════════════ */

const interpretadorCampos = [
  CAMPO_PH,
  CAMPO_PACO2,
  CAMPO_HCO3,
  campoNum('pao2', 'PaO₂', { unidade: 'mmHg', min: 20, max: 700, passo: 1, normalMin: 80, normalMax: 100, opcional: true }),
  campoNum('fio2', 'FiO₂', { unidade: '%', min: 21, max: 100, passo: 1, padrao: '21', opcional: true, ajuda: 'Ar ambiente = 21%.' }),
  campoNum('na', 'Sódio', { unidade: 'mEq/L', min: 90, max: 200, passo: 1, normalMin: 135, normalMax: 145 }),
  campoNum('cl', 'Cloro', { unidade: 'mEq/L', min: 60, max: 160, passo: 1, normalMin: 98, normalMax: 107 }),
  campoNum('k', 'Potássio', { unidade: 'mEq/L', min: 1, max: 10, passo: 0.1, normalMin: 3.5, normalMax: 5.2, opcional: true }),
  campoNum('albumina', 'Albumina', { unidade: 'g/dL', min: 0.5, max: 6, passo: 0.1, padrao: '4', normalMin: 3.5, normalMax: 5, ajuda: 'A albumina é o principal ânion não medido; hipoalbuminemia mascara ânion gap alto.' }),
  campoNum('lactato', 'Lactato', { unidade: 'mmol/L', min: 0, max: 30, passo: 0.1, normalMin: 0.5, normalMax: 2, opcional: true }),
  campoSeg('tempo', 'Tempo de instalação do componente respiratório', [
    { valor: 'agudo', rotulo: 'Agudo (< 24 h)' },
    { valor: 'cronico', rotulo: 'Crônico (> 3 dias)' },
  ], { ajuda: 'Muda a compensação renal esperada. Retentor de CO₂ conhecido, DPOC avançado e obeso hipoventilador contam como crônico.' }),
]

function interpretarGasometria(v: Valores): Resultado | null {
  const ph = num(v, 'ph')
  const paco2 = num(v, 'paco2')
  const hco3Informado = num(v, 'hco3')
  const na = num(v, 'na')
  const cl = num(v, 'cl')
  if (ph === null || paco2 === null) return null

  const hco3 = hco3Informado ?? hco3DeHH(ph, paco2)
  const hco3Calc = hco3DeHH(ph, paco2)
  const cronico = opc(v, 'tempo') === 'cronico'
  const alb = numOu(v, 'albumina', 4)
  const k = num(v, 'k')
  const lactato = num(v, 'lactato')
  const pao2 = num(v, 'pao2')
  const fio2 = numOu(v, 'fio2', 21) / 100

  const cls = classificarPrimario(ph, paco2, hco3)
  const comp = compensacaoEsperada(cls.disturbio, hco3, paco2, cronico)

  const detalhes: Resultado['detalhes'] = []
  const interpretacao: string[] = []
  const alertas: string[] = []
  const conduta: string[] = []

  interpretacao.push(
    `**Passo 1 — pH.** ${ph.toFixed(2).replace('.', ',')} caracteriza ${
      cls.acidemia ? 'acidemia' : cls.alcalemia ? 'alcalemia' : 'pH dentro da faixa de referência'
    }. ${cls.acidemia || cls.alcalemia ? 'O distúrbio que empurra o pH para esse lado é o primário; o outro eixo, se deslocado no sentido oposto, é compensação.' : 'pH normal não exclui distúrbio: dois distúrbios opostos podem se cancelar, e é isso que os passos seguintes procuram.'}`,
  )
  interpretacao.push(`**Passo 2 — distúrbio primário.** ${NOME_DISTURBIO[cls.disturbio]}. ${cls.nota}`)

  detalhes.push({
    rotulo: 'HCO₃⁻ recalculado por Henderson-Hasselbalch',
    valor: `${fmt(hco3Calc, 1)} mEq/L`,
    nota:
      hco3Informado !== null && Math.abs(hco3Calc - hco3Informado) > 3
        ? 'Diverge mais de 3 mEq/L do valor informado — pH, PaCO₂ e HCO₃⁻ não podem ser todos verdadeiros ao mesmo tempo. Suspeite de amostra antiga, bolha de ar, coágulo ou digitação trocada.'
        : 'Coerente com o valor informado — a tríade é internamente consistente.',
    nivel: hco3Informado !== null && Math.abs(hco3Calc - hco3Informado) > 3 ? 'alerta' : 'ok',
  })

  const bp = bicarbonatoPadrao(ph, paco2)
  const be = sbe(hco3, ph)
  detalhes.push({
    rotulo: 'Bicarbonato padrão (a PaCO₂ 40)',
    valor: `${fmt(bp, 1)} mEq/L`,
    nota: 'Remove o efeito respiratório: mostra o componente metabólico puro.',
  })
  detalhes.push({
    rotulo: 'Excesso de base padrão (SBE)',
    valor: `${be >= 0 ? '+' : ''}${fmt(be, 1)} mEq/L`,
    nota: be < -2 ? 'Déficit de base — componente metabólico ácido.' : be > 2 ? 'Excesso de base — componente metabólico alcalino.' : 'Componente metabólico neutro.',
    nivel: be < -10 ? 'critico' : be < -2 || be > 6 ? 'atencao' : 'ok',
  })

  if (comp) {
    detalhes.push({
      rotulo: comp.rotulo,
      valor: `${fmt(comp.faixaMin, 1)} a ${fmt(comp.faixaMax, 1)}`,
      nota: `${comp.formula}. Observado: ${fmt(comp.observado, 1)}.`,
      nivel: comp.adequada ? 'ok' : 'alerta',
    })
    interpretacao.push(`**Passo 3 — compensação.** ${comp.leitura}`)
  } else {
    interpretacao.push('**Passo 3 — compensação.** Sem distúrbio primário isolado a compensar; avalie cada componente separadamente.')
  }

  if (na !== null && cl !== null) {
    const ag = na - (cl + hco3)
    const agCorr = ag + 2.5 * (4 - alb)
    const agK = k !== null ? na + k - (cl + hco3) : null
    detalhes.push({
      rotulo: 'Ânion gap',
      valor: `${fmt(ag, 1)} mEq/L`,
      nota: 'Referência 8 a 12 mEq/L (sem potássio). Analisadores modernos, com cloro por eletrodo íon-seletivo, tendem a dar 3 a 11.',
      nivel: ag > 16 ? 'alerta' : ag > 12 ? 'atencao' : 'ok',
    })
    detalhes.push({
      rotulo: 'Ânion gap corrigido pela albumina',
      valor: `${fmt(agCorr, 1)} mEq/L`,
      nota: `Correção de ${fmt(2.5 * (4 - alb), 1)} mEq/L para albumina de ${fmt(alb, 1)} g/dL.`,
      nivel: agCorr > 16 ? 'alerta' : agCorr > 12 ? 'atencao' : 'ok',
    })
    if (agK !== null)
      detalhes.push({ rotulo: 'Ânion gap com potássio', valor: `${fmt(agK, 1)} mEq/L`, nota: 'Referência 12 a 16 mEq/L.' })

    if (agCorr > 12 && alb < 3.5)
      alertas.push(
        `Com albumina de ${fmt(alb, 1)} g/dL, o ânion gap bruto de ${fmt(ag, 1)} esconde um gap real de ${fmt(agCorr, 1)}. Em UTI, corrigir pela albumina reclassifica cerca de um terço dos casos considerados "gap normal".`,
      )

    if (agCorr > 12) {
      const deltaAG = agCorr - 12
      const deltaHCO3 = 24 - hco3
      const razao = deltaHCO3 !== 0 ? deltaAG / deltaHCO3 : null
      detalhes.push({
        rotulo: 'Delta gap (ΔAG − ΔHCO₃⁻)',
        valor: `${fmt(deltaAG - deltaHCO3, 1)} mEq/L`,
        nota: 'Positivo sugere alcalose metabólica associada; negativo, acidose de ânion gap normal associada.',
      })
      if (razao !== null)
        detalhes.push({
          rotulo: 'Relação delta (ΔAG / ΔHCO₃⁻)',
          valor: fmt(razao, 2),
          nota: leituraRelacaoDelta(razao),
        })
      interpretacao.push(
        `**Passo 4 — ânion gap e delta-delta.** Ânion gap corrigido de ${fmt(agCorr, 1)} indica acidose metabólica com ânion gap aumentado. As causas se resumem na mnemônica GOLD MARK: **G**licóis (etilenoglicol, propilenoglicol), **O**xoprolina (piroglutâmico, do paracetamol crônico), **L**-lactato, **D**-lactato, **M**etanol, **A**spirina, **R**enal (uremia), **K**etoácidos (cetoacidose diabética, alcoólica, do jejum). ${razao !== null ? leituraRelacaoDelta(razao) : ''}`,
      )
    } else if (cls.disturbio === 'acidose-metabolica') {
      interpretacao.push(
        '**Passo 4 — ânion gap.** Ânion gap normal: a acidose é hiperclorêmica. As causas se organizam entre perda digestiva de bicarbonato (diarreia, fístula, ureterossigmoidostomia), acidoses tubulares renais, expansão com salina 0,9% e inibidores da anidrase carbônica. O ânion gap urinário separa as duas primeiras famílias: negativo aponta perda digestiva com resposta renal preservada; positivo aponta acidose tubular.',
      )
    }
  } else {
    alertas.push('Sem sódio e cloro não há ânion gap — e sem ânion gap uma acidose metabólica fica pela metade. Peça o eletrólito.')
  }

  if (lactato !== null) {
    detalhes.push({
      rotulo: 'Lactato',
      valor: `${fmt(lactato, 1)} mmol/L`,
      nota: lactato >= 4 ? 'Acima de 4 mmol/L: critério de choque séptico quando há vasopressor, e marcador independente de mortalidade.' : lactato > 2 ? 'Hiperlactatemia — investigue hipoperfusão antes de atribuir a outras causas.' : 'Normal.',
      nivel: lactato >= 4 ? 'critico' : lactato > 2 ? 'alerta' : 'ok',
    })
  }

  if (pao2 !== null) {
    const relacao = pao2 / fio2
    const pAlv = pAO2(fio2, paco2)
    const gradiente = pAlv - pao2
    detalhes.push({
      rotulo: 'Relação PaO₂/FiO₂',
      valor: fmtInt(relacao),
      nota: relacao <= 100 ? 'SDRA grave (Berlim), se houver PEEP ≥ 5.' : relacao <= 200 ? 'SDRA moderada, se houver PEEP ≥ 5.' : relacao <= 300 ? 'SDRA leve, se houver PEEP ≥ 5.' : 'Fora da faixa de SDRA.',
      nivel: relacao <= 100 ? 'critico' : relacao <= 200 ? 'alerta' : relacao <= 300 ? 'atencao' : 'ok',
    })
    detalhes.push({
      rotulo: 'Gradiente alvéolo-arterial',
      valor: `${fmt(gradiente, 1)} mmHg`,
      nota: `PAO₂ calculada de ${fmt(pAlv, 1)} mmHg. Gradiente alargado aponta doença do parênquima, shunt ou distúrbio V/Q — gradiente normal com hipoxemia aponta hipoventilação ou altitude.`,
    })
  }

  if (ph < 7.1) alertas.push('pH abaixo de 7,10: faixa em que caem a contratilidade miocárdica e a resposta às catecolaminas. Trate a causa; bicarbonato só se discute em cenários específicos e ainda assim sem benefício demonstrado em mortalidade.')
  if (paco2 > 80) alertas.push('PaCO₂ acima de 80 mmHg: narcose por CO₂ é esperada. Avalie via aérea e ventilação não invasiva imediatamente.')

  /* ── Conduta: o que fazer com o diagnóstico ácido-base ── */

  conduta.push(
    '**Trate a causa, não o número.** O distúrbio ácido-base é consequência, e a gasometria serve para revelar o processo que o produziu. Corrigir o pH sem corrigir a causa troca um marcador ruim por um marcador bom e deixa a doença intacta.',
  )

  if (cls.disturbio === 'acidose-metabolica') {
    conduta.push(
      'Identifique o mecanismo pelo ânion gap, que divide a acidose metabólica em dois grupos com condutas distintas. **Gap alto** significa acréscimo de ácido: cetoacidose (diabética, alcoólica, de jejum), acidose lática (tipos A por hipoperfusão e B por metformina, linezolida, propofol, deficiência de tiamina), uremia e intoxicações (metanol, etilenoglicol, salicilato, propilenoglicol) — calcule também o gap osmolar se houver suspeita de intoxicação. **Gap normal** (hiperclorêmica) significa perda de bicarbonato ou ganho de cloro: diarreia, acidose tubular renal, salina em excesso, inibidor da anidrase carbônica, fístula pancreática ou ureteral.',
      'Reponha volume com cristaloide balanceado em vez de salina 0,9% quando houver necessidade de expansão: a salina, com 154 mEq/L de cloro, agrava a acidose hiperclorêmica por reduzir a diferença de íons fortes. Trate a cetoacidose com insulina, volume e potássio, e a acidose lática restaurando a perfusão — a hiperlactatemia é sinal de oferta tecidual de oxigênio insuficiente, não uma variável a normalizar isoladamente.',
      lactato !== null && lactato > 4
        ? `Lactato de ${fmt(lactato, 1)} mmol/L indica hipoperfusão significativa: ressuscite volemicamente, procure foco infeccioso ou causa de choque e repita o lactato em 2 a 4 horas — o clareamento, e não o valor isolado, é o marcador de resposta.`
        : 'Dose lactato se ainda não houver: acidose de ânion gap alto sem lactato medido deixa o diagnóstico incompleto.',
      'Bicarbonato de sódio não é tratamento de rotina. Considere-o em acidose com pH abaixo de 7,10 refratária, em acidose hiperclorêmica com perda documentada de bicarbonato, na acidose tubular renal, na hipercalemia com acidose e na intoxicação por salicilato ou antidepressivo tricíclico (aqui por alcalinização, não por corrigir o pH). Na cetoacidose e na acidose lática, não melhora desfecho e pode piorar a acidose intracelular.',
    )
  } else if (cls.disturbio === 'alcalose-metabolica') {
    conduta.push(
      'Separe as causas pelo **cloro urinário**, que é o exame decisivo. Cloro urinário abaixo de 20 mEq/L indica alcalose responsiva a cloro — vômito, aspiração nasogástrica, diurético já suspenso, pós-hipercapnia — e o tratamento é repor cloro e volume com salina e potássio. Cloro urinário acima de 20 mEq/L indica alcalose resistente a cloro: hiperaldosteronismo, síndrome de Cushing, estenose de artéria renal, síndrome de Bartter ou Gitelman, diurético em uso, hipopotassemia grave.',
      'Corrija o **potássio** e o **magnésio** antes de esperar melhora. A alcalose se automantém pela hipopotassemia: a perda de potássio aumenta a reabsorção de bicarbonato no túbulo proximal e a secreção de hidrogênio no distal, e a hipomagnesemia impede corrigir o potássio.',
      'Suspenda o que alimenta o distúrbio: diurético de alça ou tiazídico, aspiração nasogástrica de alto débito (considere inibidor de bomba de prótons para reduzir a perda de ácido), reposição excessiva de bicarbonato ou de citrato. Em alcalose grave e refratária com sobrecarga de volume, a acetazolamida é útil; a cloridrato de arginina e o ácido clorídrico intravenoso são reservados a casos extremos.',
      'Lembre que a alcalose desloca a curva de dissociação da hemoglobina para a esquerda, reduzindo a entrega tecidual de oxigênio, e reduz o cálcio ionizado por aumento da ligação à albumina — daí a parestesia, a tetania e o risco de arritmia.',
    )
  } else if (cls.disturbio === 'acidose-respiratoria') {
    conduta.push(
      cronico
        ? 'Padrão crônico: o objetivo **não** é normalizar a PaCO₂, e sim tratar a descompensação e devolver o paciente ao seu basal. Reduzir rapidamente a PaCO₂ de um retentor crônico provoca alcalose metabólica pós-hipercápnica, porque o bicarbonato renal elevado permanece por dias.'
        : 'Padrão agudo: a hipercapnia aguda é falência ventilatória e exige ação imediata sobre a ventilação, não sobre o pH.',
      'Avalie a via aérea e o drive respiratório na beira do leito: nível de consciência, uso de musculatura acessória, respiração paradoxal, capacidade de completar frases. **Ventilação não invasiva** é o tratamento de primeira linha na exacerbação de DPOC com acidose respiratória e na hipercapnia do edema agudo e da obesidade-hipoventilação. Intubação está indicada em rebaixamento importante, incapacidade de proteger a via aérea, instabilidade ou falha da ventilação não invasiva.',
      'Procure e trate a causa da hipoventilação: exacerbação de DPOC ou asma, pneumonia, opioide ou benzodiazepínico, doença neuromuscular, obesidade-hipoventilação, cifoescoliose, pneumotórax, derrame volumoso, hipotireoidismo grave. Antagonize opioide com naloxona se for a causa.',
      'Em ventilação mecânica, aumente a ventilação-minuto com cautela: eleve preferencialmente a frequência respiratória, mantendo volume corrente protetor de 6 mL/kg de peso predito, pressão de platô até 30 cmH₂O e driving pressure até 15 cmH₂O. Em SDRA grave, a **hipercapnia permissiva** é aceitável e preferível a violar os limites de pressão.',
      'Alvo de oxigenação no retentor crônico: SpO₂ de 88 a 92%. Oxigênio em excesso agrava a hipercapnia por três mecanismos — redução do drive hipóxico, efeito Haldane e piora do espaço morto por reversão da vasoconstrição pulmonar hipóxica.',
    )
  } else if (cls.disturbio === 'alcalose-respiratoria') {
    conduta.push(
      'Alcalose respiratória quase nunca é o problema: é sinal de que algo estimula a ventilação. **Procure a causa antes de tranquilizar**, porque a lista inclui diagnósticos graves — hipoxemia de qualquer origem, embolia pulmonar, sepse precoce, dor, febre, anemia, insuficiência hepática, intoxicação por salicilato, lesão do sistema nervoso central, gestação e ventilação mecânica excessiva.',
      'Dose lactato e avalie oxigenação: taquipneia com alcalose respiratória e gradiente alvéolo-arterial alargado aponta doença pulmonar ou embolia; com gradiente normal, aponta estímulo central, metabólico ou psicogênico.',
      'Trate a causa, não a hiperventilação. Reinalação em saco de papel é prática desaconselhada: mascara hipoxemia e já provocou dano em pacientes cuja taquipneia era compensatória. Síndrome de hiperventilação é diagnóstico de exclusão, e só depois de descartadas as causas orgânicas.',
      'Em ventilação mecânica, reduza a ventilação-minuto ajustando frequência e volume corrente. Lembre que a hipocapnia reduz o fluxo sanguíneo cerebral por vasoconstrição — daí a contraindicação à hiperventilação profilática no traumatismo cranioencefálico, exceto como ponte transitória na herniação iminente.',
    )
  } else if (cls.disturbio === 'normal') {
    conduta.push(
      'pH e eixos dentro da faixa **não encerram a avaliação**. Confira o ânion gap corrigido pela albumina, a relação delta e a diferença entre o bicarbonato medido e o calculado: distúrbios triplos com pH normal existem e só aparecem nesses três cálculos.',
      'Se a suspeita clínica for forte (paciente crítico, intoxicação, sepse, cetoacidose em tratamento), repita a gasometria com eletrólitos completos, albumina e lactato antes de concluir que não há distúrbio.',
    )
  } else {
    conduta.push(
      'Distúrbio misto: trate cada componente segundo a própria causa e não persiga um pH único. Em distúrbio misto, o pH resultante pode ser normal enquanto os dois processos subjacentes avançam — a conduta se orienta pelos mecanismos identificados nos passos 2 a 4, não pelo valor final.',
      'Priorize pela ameaça à vida, não pela magnitude do desvio: hipoxemia e falência ventilatória vêm antes da correção metabólica, e hipoperfusão vem antes da correção do bicarbonato.',
    )
  }

  if (k !== null && (k < 3.5 || k > 5.5)) {
    conduta.push(
      k < 3.5
        ? `Potássio de ${fmt(k, 1)} mEq/L com este distúrbio exige atenção: a alcalose desloca potássio para dentro da célula e mascara o déficit corporal total, de modo que a hipopotassemia real é maior que a medida. Reponha potássio e cheque o magnésio, sem o qual a correção não se sustenta.`
        : `Potássio de ${fmt(k, 1)} mEq/L: a acidose desloca potássio para fora da célula, e a correção do pH o fará retornar — antecipe a queda e monitorize. Faça eletrocardiograma, e trate a hipercalemia com risco eletrocardiográfico de imediato (cálcio para estabilizar a membrana, insulina com glicose e beta-agonista para deslocar, diurético, resina ou diálise para remover).`,
    )
  }

  const nivel: Nivel = ph < 7.2 || ph > 7.6 ? 'critico' : cls.acidemia || cls.alcalemia ? 'alerta' : cls.disturbio === 'normal' ? 'ok' : 'atencao'

  return {
    titulo: 'Diagnóstico ácido-base',
    valor: NOME_DISTURBIO[cls.disturbio],
    rotuloNivel: cls.acidemia ? 'Acidemia' : cls.alcalemia ? 'Alcalemia' : 'pH na faixa',
    nivel,
    detalhes,
    interpretacao,
    conduta,
    alertas: alertas.length ? alertas : undefined,
  }
}

function leituraRelacaoDelta(r: number): string {
  if (r < 0.4) return 'Abaixo de 0,4: a queda do bicarbonato é maior do que o gap explica — acidose de ânion gap normal (hiperclorêmica) predominante.'
  if (r < 0.8) return 'Entre 0,4 e 0,8: acidose mista, com componente de ânion gap alto e componente hiperclorêmico. Vista com frequência na cetoacidose já em tratamento com salina.'
  if (r <= 2) return 'Entre 0,8 e 2,0: acidose de ânion gap alto pura — cada mEq de ânion acrescentado consumiu um mEq de bicarbonato.'
  return 'Acima de 2,0: o bicarbonato caiu menos do que o gap acrescentado — há alcalose metabólica concomitante ou acidose respiratória crônica prévia, que já havia elevado o bicarbonato basal.'
}

/* ═══════════════════════════════ Catálogo ═══════════════════════════════ */

export const ferramentas: Ferramenta[] = [
  {
    id: 'gasometria-arterial',
    nome: 'Interpretador completo de gasometria arterial',
    sinonimos: ['gaso', 'gasometria', 'acido-base', 'ácido-base', 'analise gasometrica'],
    resumo: 'Percorre os quatro passos da leitura ácido-base e devolve o diagnóstico com a conta aberta.',
    categorias: ['gasometria'],
    campos: interpretadorCampos,
    calcular: interpretarGasometria,
    formula: [
      'HCO₃⁻ = 0,0301 × PaCO₂ × 10^(pH − 6,1)',
      'AG = Na⁺ − (Cl⁻ + HCO₃⁻)',
      'AG corrigido = AG + 2,5 × (4 − albumina)',
      'Relação delta = (AG − 12) / (24 − HCO₃⁻)',
    ],
    fundamento:
      'A leitura ácido-base é uma sequência fixa, e é a ordem que impede o erro: o pH diz para que lado o sangue está, o eixo que empurra nessa direção é o primário, a compensação esperada revela se existe um segundo distúrbio, e o ânion gap revela o terceiro — aquele que não aparece nem no pH nem no bicarbonato porque foi neutralizado por outro. Um paciente pode ter três distúrbios simultâneos com pH rigorosamente normal, e a única maneira de encontrá-los é fazer os quatro passos sempre, mesmo quando o pH parece tranquilizador. A abordagem por bicarbonato e ânion gap aqui usada é a fisiológica clássica (Boston); a abordagem físico-química de Stewart, com SID e ácidos fracos totais, chega às mesmas conclusões na quase totalidade dos casos e acrescenta poder sobretudo em hipoalbuminemia grave — que esta ferramenta cobre pela correção da albumina.',
    armadilhas: [
      'O bicarbonato da gasometria é calculado, não medido: o aparelho mede pH e PaCO₂ e resolve Henderson-Hasselbalch. O bicarbonato do eletrólito venoso é o CO₂ total, medido — divergências de 1 a 3 mEq/L entre os dois são normais, acima disso investigue a amostra.',
      'Amostra com bolha de ar eleva a PaO₂ e reduz a PaCO₂; amostra guardada em temperatura ambiente por mais de 15 minutos continua metabolizando e reduz pH e PaO₂. Heparina líquida em excesso dilui e reduz a PaCO₂.',
      'Compensação nunca corrige o pH até a normalidade — quando o pH está exatamente em 7,40 com os dois eixos deslocados, há dois distúrbios primários, não compensação perfeita.',
      'Sem albumina, o ânion gap subestima: cada 1 g/dL abaixo de 4 esconde cerca de 2,5 mEq/L de gap. Em paciente crítico, com albumina de 2 g/dL, um gap "normal" de 11 é na verdade 16.',
    ],
    referencias: [
      { texto: 'Berend K, de Vries APJ, Gans ROB. Physiological approach to assessment of acid-base disturbances. N Engl J Med. 2014;371(15):1434-1445.', link: 'https://doi.org/10.1056/NEJMra1003327' },
      { texto: 'Seifter JL. Integration of acid-base and electrolyte disorders. N Engl J Med. 2014;371(19):1821-1831.', link: 'https://doi.org/10.1056/NEJMra1215672' },
      { texto: 'Figge J, Jabor A, Kazda A, Fencl V. Anion gap and hypoalbuminemia. Crit Care Med. 1998;26(11):1807-1810.' },
    ],
  },

  {
    id: 'disturbio-primario',
    nome: 'Identificação do distúrbio ácido-base primário',
    sinonimos: ['disturbio primario', 'acidose ou alcalose', 'primario'],
    resumo: 'Com pH, PaCO₂ e HCO₃⁻ diz qual é o distúrbio primário e se há distúrbio misto.',
    categorias: ['gasometria'],
    campos: [CAMPO_PH, CAMPO_PACO2, CAMPO_HCO3],
    calcular: (v) => {
      const ph = num(v, 'ph')
      const paco2 = num(v, 'paco2')
      const hco3 = num(v, 'hco3')
      if (ph === null || paco2 === null || hco3 === null) return null
      const c = classificarPrimario(ph, paco2, hco3)
      const coerencia = hco3DeHH(ph, paco2)
      return {
        titulo: 'Distúrbio primário',
        valor: NOME_DISTURBIO[c.disturbio],
        rotuloNivel: c.acidemia ? 'Acidemia (pH < 7,35)' : c.alcalemia ? 'Alcalemia (pH > 7,45)' : 'pH entre 7,35 e 7,45',
        nivel: c.disturbio === 'normal' ? 'ok' : c.disturbio === 'misto' ? 'alerta' : 'atencao',
        interpretacao: [
          c.nota,
          '**A lógica em uma frase:** o distúrbio primário é aquele cujo desvio explica o sentido do pH. Se bicarbonato e pH andam juntos (ambos baixos ou ambos altos), o distúrbio é metabólico. Se PaCO₂ e pH andam em direções opostas, é respiratório. Se os dois eixos empurram o pH para o mesmo lado, é distúrbio misto por definição — nenhum sistema fisiológico compensa piorando.',
          'A razão fisiológica de o bicarbonato acompanhar o pH nos distúrbios metabólicos e a PaCO₂ se opor a ele nos respiratórios está na equação de Henderson-Hasselbalch: o pH depende da **razão** entre bicarbonato e PaCO₂, não dos valores absolutos. O bicarbonato é o numerador — é base, e reduzi-lo acidifica. A PaCO₂ é o denominador, porque o CO₂ se hidrata a ácido carbônico pela anidrase carbônica; elevá-la acidifica. Assim, num distúrbio primariamente metabólico o numerador se move e arrasta o pH consigo, enquanto num primariamente respiratório o denominador se move e empurra o pH no sentido oposto ao seu. Compensação é a tentativa de restaurar a razão movendo o outro termo na mesma direção — e é por isso que compensação nunca inverte o sentido do desvio, apenas o atenua.',
          'Os dois sistemas compensatórios têm velocidades muito diferentes, e isso é o que torna a pergunta "agudo ou crônico?" indispensável nos distúrbios respiratórios. A **compensação respiratória** de um distúrbio metabólico é quase imediata: os quimiorreceptores dos corpos carotídeos e do bulbo detectam a queda de pH e ajustam a ventilação em minutos, atingindo o novo estado de equilíbrio em 12 a 24 horas. A **compensação renal** de um distúrbio respiratório é lenta porque exige mudança de expressão proteica: o túbulo proximal aumenta a atividade do trocador sódio-hidrogênio NHE3 e da anidrase carbônica, e o túbulo distal aumenta as bombas H⁺-ATPase das células intercaladas alfa e a excreção de amônio — processos que levam 12 a 24 horas para começar e 3 a 5 dias para se completar.',
        ],
        conduta: [
          'Este é o **passo 2** de quatro. Identificar o primário não encerra a leitura: prossiga obrigatoriamente para a compensação esperada (passo 3) e para o ânion gap com relação delta (passo 4). Um paciente pode ter três distúrbios simultâneos com pH rigorosamente normal, e nenhum deles aparece neste passo.',
          c.disturbio === 'misto'
            ? '**Distúrbio misto identificado.** Trate cada componente pela própria causa e não persiga um pH único. Priorize pela ameaça imediata à vida, não pela magnitude do desvio: hipoxemia e falência ventilatória vêm antes da correção metabólica, e hipoperfusão vem antes de qualquer discussão sobre bicarbonato. Distúrbio misto quase sempre significa duas doenças ativas — procure as duas.'
            : c.disturbio === 'normal'
              ? 'pH e eixos na faixa **não encerram a avaliação**. Calcule o ânion gap corrigido pela albumina e a relação delta: acidose metabólica com alcalose respiratória, típica da sepse e da intoxicação por salicilato, produz pH de 7,40 com bicarbonato de 14 e PaCO₂ de 24. Se a suspeita clínica for forte, use o interpretador completo com eletrólitos, albumina e lactato.'
              : 'Com o primário definido, calcule a **compensação esperada** para a fórmula correspondente — Winter na acidose metabólica, as regras de 1 e 4 (agudo) ou 3,5 e 5 (crônico) nos respiratórios. Compensação fora do esperado revela um segundo distúrbio, e é esse achado que muda a conduta.',
          'Antes de agir sobre o resultado, confira a **coerência interna** dos três valores. Se o bicarbonato recalculado por Henderson-Hasselbalch divergir do informado em mais de 3 mEq/L, o problema é de amostra ou de digitação, e agir sobre um valor incoerente é pior que não ter gasometria.',
          'Sempre datar e contextualizar: o distúrbio primário é um retrato de um instante. Em paciente instável, em ressuscitação volêmica ou sob ventilação em ajuste, repita a gasometria em 30 a 60 minutos — a trajetória informa mais que o valor.',
        ],
        alertas: [
          'pH dentro da faixa de referência **não** significa ausência de distúrbio. Dois distúrbios opostos se cancelam no pH e só aparecem no bicarbonato, na PaCO₂ e no ânion gap.',
          'Este passo não avalia oxigenação. PaO₂, relação PaO₂/FiO₂ e gradiente alvéolo-arterial são eixos independentes, e um paciente pode ter ácido-base impecável com hipoxemia grave.',
          Math.abs(coerencia - hco3) > 3
            ? 'O bicarbonato informado diverge em mais de 3 mEq/L do recalculado a partir do pH e da PaCO₂. Reveja a amostra (bolha de ar, heparina em excesso, demora no transporte) ou a digitação antes de usar este resultado.'
            : 'O bicarbonato da gasometria é calculado, não medido — o aparelho mede pH e PaCO₂ e resolve Henderson-Hasselbalch. Divergências de 1 a 3 mEq/L em relação ao CO₂ total do eletrólito venoso são esperadas.',
        ],
        detalhes: [
          { rotulo: 'pH', valor: fmt(ph, 2), nota: 'Referência 7,35 – 7,45' },
          { rotulo: 'PaCO₂', valor: `${fmt(paco2, 1)} mmHg`, nota: 'Referência 35 – 45' },
          { rotulo: 'HCO₃⁻ informado', valor: `${fmt(hco3, 1)} mEq/L`, nota: 'Referência 22 – 26' },
          {
            rotulo: 'Conferência interna',
            valor: `${fmt(coerencia, 1)} mEq/L`,
            nota: Math.abs(coerencia - hco3) > 3 ? 'Bicarbonato recalculado diverge do informado — reveja a amostra ou a digitação.' : 'Os três valores são internamente coerentes.',
            nivel: Math.abs(coerencia - hco3) > 3 ? 'alerta' : 'ok',
          },
        ],
      }
    },
    formula: [
      'pH < 7,35 → acidemia | pH > 7,45 → alcalemia',
      'HCO₃⁻ acompanha o pH → distúrbio metabólico',
      'PaCO₂ inversa ao pH → distúrbio respiratório',
    ],
    fundamento:
      'A regra que resolve praticamente todos os casos cabe numa frase: o distúrbio primário é aquele cujo desvio explica o sentido do pH. Bicarbonato e pH andando juntos (ambos baixos ou ambos altos) significam distúrbio metabólico; PaCO₂ e pH andando em direções opostas significam distúrbio respiratório. Quando os dois eixos empurram o pH para o mesmo lado, não há compensação possível — é distúrbio misto por definição, porque nenhum sistema fisiológico compensa piorando.',
    armadilhas: [
      'pH normal não é gasometria normal. Acidose metabólica com alcalose respiratória, comum na sepse e na intoxicação por salicilato, produz pH de 7,40 com HCO₃⁻ de 14 e PaCO₂ de 24.',
      'Compensação respiratória é rápida (minutos a horas), compensação renal é lenta (12 a 24 horas para começar, 3 a 5 dias para completar). Isso é o que torna a pergunta "agudo ou crônico?" indispensável nos distúrbios respiratórios.',
    ],
    referencias: [
      { texto: 'Berend K, de Vries APJ, Gans ROB. Physiological approach to assessment of acid-base disturbances. N Engl J Med. 2014;371(15):1434-1445.' },
      { texto: 'Adrogué HJ, Madias NE. Management of life-threatening acid-base disorders. N Engl J Med. 1998;338(1):26-34.' },
    ],
  },

  {
    id: 'formula-winter',
    nome: 'Fórmula de Winter',
    sinonimos: ['winter', 'compensacao acidose metabolica', 'paco2 esperada'],
    resumo: 'PaCO₂ esperada na acidose metabólica — e o que significa estar fora da faixa.',
    categorias: ['gasometria'],
    campos: [
      CAMPO_HCO3,
      campoNum('paco2', 'PaCO₂ medida', { unidade: 'mmHg', min: 5, max: 150, passo: 0.5, normalMin: 35, normalMax: 45, ajuda: 'A PaCO₂ da mesma gasometria que forneceu o bicarbonato. Opcional: sem ela a ferramenta devolve apenas a faixa esperada; com ela, diz se há um segundo distúrbio. Em acidose de instalação súbita (menos de 12 a 24 horas), espere PaCO₂ acima do previsto — é tempo, não distúrbio.' }),
    ],
    calcular: (v) => {
      const hco3 = num(v, 'hco3')
      const paco2 = num(v, 'paco2')
      if (hco3 === null) return null
      const esp = 1.5 * hco3 + 8
      const min = esp - 2
      const max = esp + 2
      const detalhes: Resultado['detalhes'] = [
        { rotulo: 'Faixa esperada', valor: `${fmt(min, 1)} a ${fmt(max, 1)} mmHg` },
      ]
      let interp = ['Enquanto a PaCO₂ medida cair dentro da faixa, a compensação respiratória é a esperada e não há distúrbio respiratório associado.']
      let nivel: Nivel = 'neutro'
      if (paco2 !== null) {
        detalhes.push({ rotulo: 'PaCO₂ medida', valor: `${fmt(paco2, 1)} mmHg` })
        detalhes.push({ rotulo: 'Diferença', valor: `${paco2 - esp >= 0 ? '+' : ''}${fmt(paco2 - esp, 1)} mmHg` })
        if (paco2 > max) {
          nivel = 'alerta'
          interp = [
            'PaCO₂ acima do esperado: **acidose respiratória associada**. Num paciente com acidose metabólica grave, uma PaCO₂ "normal" de 40 é sinal de exaustão — a ventilação já não acompanha a demanda. É achado de via aérea, não de observação.',
          ]
        } else if (paco2 < min) {
          nivel = 'alerta'
          interp = [
            'PaCO₂ abaixo do esperado: **alcalose respiratória associada**. Procure sepse, dor, ansiedade, embolia pulmonar, hepatopatia, gestação ou intoxicação por salicilato — nesta última, a alcalose respiratória é o achado inicial e antecede a acidose metabólica.',
          ]
        } else {
          nivel = 'ok'
        }
      }
      return {
        titulo: 'PaCO₂ esperada (Winter)',
        valor: `${fmt(min, 1)} – ${fmt(max, 1)}`,
        unidade: 'mmHg',
        nivel,
        rotuloNivel: nivel === 'ok' ? 'Compensação adequada' : nivel === 'alerta' ? 'Distúrbio respiratório associado' : undefined,
        detalhes,
        interpretacao: [
          ...interp,
          'A compensação que a fórmula descreve é **hiperventilação por estímulo quimiorreceptor**, e vale entender a sequência porque ela explica o atraso de 12 a 24 horas. A queda do bicarbonato plasmático acidifica o sangue, e os quimiorreceptores periféricos dos corpos carotídeos e aórticos — sensíveis a pH e a PaO₂ — respondem em segundos, aumentando a ventilação. Os quimiorreceptores centrais, no bulbo ventrolateral, são os mais potentes, mas respondem ao pH do **líquido cefalorraquidiano**, e o íon bicarbonato atravessa a barreira hematoencefálica muito mais lentamente que o CO₂, que é lipossolúvel. Por isso a acidose metabólica aguda estimula sobretudo pela via periférica, com resposta parcial, e só quando o bicarbonato liquórico se equilibra com o plasmático a resposta central se soma e a compensação atinge o previsto por Winter. É a mesma razão pela qual a compensação, uma vez estabelecida, demora a se desfazer.',
          'Existe um **piso** fisiológico que a fórmula ignora: por mais baixo que esteja o bicarbonato, a PaCO₂ raramente desce abaixo de 10 a 12 mmHg. Manter ventilação-minuto nessa faixa exige trabalho respiratório enorme, e o diafragma fatiga — a musculatura respiratória consome oxigênio e produz lactato, de modo que a partir de certo ponto a própria compensação passa a alimentar a acidose. É esse fenômeno que transforma uma PaCO₂ "normal" de 40 mmHg, num paciente com bicarbonato de 8, no achado mais ameaçador da gasometria: não é compensação inadequada, é exaustão iminente.',
        ],
        conduta: [
          paco2 === null
            ? 'Informe a PaCO₂ medida para completar o passo 3 da leitura ácido-base. Sem ela, a ferramenta devolve apenas o alvo fisiológico e não identifica o segundo distúrbio, que é justamente o que muda a conduta.'
            : paco2 > max
              ? '**PaCO₂ acima do esperado: acidose respiratória associada.** Isso é achado de via aérea, não de observação. Avalie imediatamente nível de consciência, uso de musculatura acessória, respiração paradoxal e capacidade de completar frases. Prepare suporte ventilatório — ventilação não invasiva se houver drive e proteção de via aérea preservados, intubação se houver rebaixamento, exaustão ou falha da não invasiva. Procure a causa da hipoventilação sobreposta: opioide, benzodiazepínico, doença neuromuscular, exaustão diafragmática, pneumonia, DPOC.'
              : paco2 < min
                ? '**PaCO₂ abaixo do esperado: alcalose respiratória associada.** Procure ativamente a causa do estímulo ventilatório extra, porque a lista inclui diagnósticos graves: sepse precoce, embolia pulmonar, dor, febre, hepatopatia com encefalopatia, gestação, lesão do sistema nervoso central e **intoxicação por salicilato** — nesta última a alcalose respiratória por estímulo central direto antecede a acidose metabólica, e reconhecer o padrão duplo é o que faz o diagnóstico. Dose salicilato se houver qualquer suspeita.'
                : '**Compensação adequada.** Não há distúrbio respiratório associado. Siga para o passo 4: calcule o ânion gap corrigido pela albumina e a relação delta, que é onde se revela um segundo distúrbio metabólico oculto.',
          'Trate a **acidose metabólica pela causa**, não pela PaCO₂. O valor de Winter é diagnóstico e não alvo terapêutico: em paciente ventilado, forçar a PaCO₂ até o número previsto exige volume-minuto altíssimo, com custo em pressão de platô, driving pressure e lesão induzida pelo ventilador.',
          'Em paciente ventilado com acidose metabólica, ajuste a ventilação-minuto preferencialmente pela **frequência respiratória**, mantendo volume corrente protetor de 6 mL/kg de peso predito, platô até 30 cmH₂O e driving pressure até 15 cmH₂O. Se os limites de pressão forem alcançados antes do alvo, aceite a acidose — hipercapnia permissiva é preferível a barotrauma.',
          'Cuidado com o momento da intubação: ao sedar e assumir a ventilação de um paciente que compensava com PaCO₂ de 15 mmHg, a abolição do drive espontâneo pode elevar a PaCO₂ rapidamente e despencar o pH. Programe ventilação-minuto alta desde o primeiro minuto e colha gasometria de controle em 15 a 30 minutos.',
        ],
        alertas: [
          'A fórmula diagnostica um segundo distúrbio; não é alvo de ventilação. Perseguir o valor de Winter no ventilador troca acidose por lesão pulmonar induzida pela ventilação.',
          'A compensação leva 12 a 24 horas para se completar. Em acidose de instalação súbita, PaCO₂ acima do previsto é tempo e não distúrbio — repita a gasometria antes de concluir.',
          paco2 !== null && paco2 > max
            ? 'PaCO₂ "normal" em acidose metabólica grave é sinal de exaustão respiratória e antecede a parada. Não aguarde a próxima gasometria: avalie a via aérea agora.'
            : 'A compensação tem piso em torno de 10 a 12 mmHg de PaCO₂. Em acidose extrema, Winter prevê valores fisiologicamente inalcançáveis, e a PaCO₂ que não desce mais não é um segundo distúrbio.',
        ],
      }
    },
    formula: ['PaCO₂ esperada = 1,5 × HCO₃⁻ + 8 ± 2', 'Atalho de beira de leito: PaCO₂ ≈ os dois últimos dígitos do pH'],
    fundamento:
      'A fórmula saiu de um trabalho de 1967 em que Albert, Dell e Winters mediram a resposta respiratória em pacientes com acidose metabólica de causas variadas e ajustaram a reta. Ela não descreve um alvo terapêutico: descreve o que o pulmão de fato faz quando o bicarbonato cai. Por isso o valor de Winter serve para diagnosticar um segundo distúrbio, e não para orientar o ajuste do ventilador — em paciente ventilado, forçar a PaCO₂ até o valor de Winter significa volume-minuto altíssimo, com custo em pressão e em lesão induzida pelo ventilador.',
    armadilhas: [
      'A compensação respiratória tem piso: dificilmente a PaCO₂ desce abaixo de 10 a 12 mmHg, por mais baixo que esteja o bicarbonato. Em acidose extrema, Winter prevê valores fisiologicamente inalcançáveis.',
      'A resposta leva 12 a 24 horas para se completar. Na acidose metabólica de instalação súbita, a PaCO₂ ainda estará acima do previsto — e isso não é um segundo distúrbio, é tempo.',
      'O nome consagrado é "fórmula de Winter", no singular, mas o autor é Winters, com S.',
    ],
    referencias: [
      { texto: 'Albert MS, Dell RB, Winters RW. Quantitative displacement of acid-base equilibrium in metabolic acidosis. Ann Intern Med. 1967;66(2):312-322.' },
      { texto: 'Berend K. Diagnostic use of base excess in acid-base disorders. N Engl J Med. 2018;378(15):1419-1428.' },
    ],
  },

  {
    id: 'compensacao-acidose-respiratoria',
    nome: 'Compensação esperada na acidose respiratória',
    sinonimos: ['retencao de co2', 'hipercapnia compensacao', 'dpoc gasometria'],
    resumo: 'Quanto o bicarbonato deveria subir para a PaCO₂ observada, aguda ou cronicamente.',
    categorias: ['gasometria'],
    campos: [
      campoNum('paco2', 'PaCO₂ medida', { unidade: 'mmHg', min: 40, max: 150, passo: 0.5, ajuda: 'Só faz sentido acima de 45 mmHg.' }),
      CAMPO_HCO3,
      campoSeg('tempo', 'Tempo de instalação', [
        { valor: 'agudo', rotulo: 'Agudo (< 24 h)' },
        { valor: 'cronico', rotulo: 'Crônico (> 3 dias)' },
      ], { ajuda: 'Aguda (bicarbonato sobe 1 mEq/L por 10 mmHg) ou crônica (sobe 3,5 a 4). No retentor crônico, a meta não é normalizar o gás carbônico, e sim devolvê-lo ao basal do paciente.' }),
    ],
    calcular: (v) => {
      const paco2 = num(v, 'paco2')
      const hco3 = num(v, 'hco3')
      if (paco2 === null) return null
      const cronico = opc(v, 'tempo') === 'cronico'
      const c = compensacaoEsperada('acidose-respiratoria', hco3 ?? 24, paco2, cronico)!
      const phAgudo = 7.4 - 0.008 * (paco2 - 40)
      const phCronico = 7.4 - 0.003 * (paco2 - 40)
      const detalhes: Resultado['detalhes'] = [
        { rotulo: 'HCO₃⁻ esperado', valor: `${fmt(c.faixaMin, 1)} a ${fmt(c.faixaMax, 1)} mEq/L`, nota: c.formula },
        { rotulo: 'pH previsto se puramente agudo', valor: fmt(phAgudo, 2), nota: 'Queda de 0,08 por 10 mmHg de PaCO₂' },
        { rotulo: 'pH previsto se puramente crônico', valor: fmt(phCronico, 2), nota: 'Queda de 0,03 por 10 mmHg de PaCO₂' },
      ]
      if (hco3 !== null) detalhes.splice(1, 0, { rotulo: 'HCO₃⁻ medido', valor: `${fmt(hco3, 1)} mEq/L`, nivel: c.adequada ? 'ok' : 'alerta' })
      return {
        titulo: `HCO₃⁻ esperado (${cronico ? 'crônica' : 'aguda'})`,
        valor: `${fmt(c.faixaMin, 1)} – ${fmt(c.faixaMax, 1)}`,
        unidade: 'mEq/L',
        nivel: hco3 === null ? 'neutro' : c.adequada ? 'ok' : 'alerta',
        detalhes,
        conduta: [
          'Se o bicarbonato medido **bate com o esperado**, o distúrbio é puro e a conduta é tratar a causa da hipoventilação: broncoespasmo, depressão do centro respiratório por opioide ou benzodiazepínico, fadiga muscular, doença neuromuscular, obstrução de via aérea ou pneumotórax.',
          'Bicarbonato **acima do esperado** revela alcalose metabólica associada — quase sempre por diurético, vômito, aspiração nasogástrica ou corticoide. Corrigir essa alcalose é parte do tratamento: ela reduz o estímulo ventilatório e perpetua a retenção de gás carbônico.',
          'Bicarbonato **abaixo do esperado** revela acidose metabólica associada, e esse é o cenário mais grave: significa que o paciente tem dois motivos para acidemia. Procure sepse, choque, hipoperfusão e intoxicação, e trate com urgência — o pH cai rápido quando a compensação metabólica falha.',
          'Diferencie **aguda (bicarbonato sobe 1 mEq/L para cada 10 mmHg de gás carbônico)** de **crônica (sobe 3,5–4 mEq/L)**: na retenção crônica compensada do doente com doença pulmonar obstrutiva, o objetivo **não** é normalizar o gás carbônico, e sim devolvê-lo ao valor basal do paciente. Normalizar à força gera alcalose pós-hipercápnica e desmame impossível.',
          'Indique **ventilação não invasiva** com pH < 7,35 e gás carbônico elevado na exacerbação de doença pulmonar obstrutiva ou no edema agudo — é a intervenção que mais reduz intubação e mortalidade nesse cenário. Passe à intubação se houver rebaixamento, instabilidade, incapacidade de proteger a via aérea ou falha da não invasiva após 1–2 horas.',
        ],
        alertas: [
          'Na retenção crônica compensada, o objetivo **não** é normalizar o gás carbônico, e sim devolvê-lo ao valor basal do paciente. Normalizar à força gera alcalose pós-hipercápnica e desmame impossível.',
        ],
        interpretacao: [
          hco3 === null ? 'Informe o bicarbonato medido para comparar.' : c.leitura,
          'A comparação entre o pH medido e os dois pHs previstos costuma ser o modo mais rápido de datar a hipercapnia: pH próximo do previsto para agudo indica retenção recente; próximo do crônico indica adaptação renal já estabelecida; entre os dois, agudização sobre crônico — o cenário típico da exacerbação de DPOC.',
        ],
      }
    },
    formula: [
      'Aguda:   HCO₃⁻ = 24 + 1,0 × (PaCO₂ − 40)/10   (± 2)',
      'Crônica: HCO₃⁻ = 24 + 3,5 × (PaCO₂ − 40)/10   (± 4)',
      'pH agudo   ≈ 7,40 − 0,008 × (PaCO₂ − 40)',
      'pH crônico ≈ 7,40 − 0,003 × (PaCO₂ − 40)',
    ],
    fundamento:
      'A resposta à hipercapnia acontece em dois tempos com mecanismos diferentes. Nos primeiros minutos, o tamponamento intracelular — sobretudo pela hemoglobina e pelas proteínas — gera aproximadamente 1 mEq/L de bicarbonato para cada 10 mmHg de CO₂ retido; é um efeito químico, imediato e pequeno. Depois de 12 a 24 horas o rim entra: aumenta a secreção de H⁺ pelo túbulo proximal, gera amônio e reabsorve bicarbonato de novo, e em 3 a 5 dias eleva o bicarbonato em cerca de 3,5 mEq/L por 10 mmHg. Essa diferença de magnitude entre os dois mecanismos é o que permite datar a hipercapnia por uma única gasometria.',
    armadilhas: [
      'Nunca use a compensação crônica para justificar um bicarbonato alto em paciente sem hipercapnia crônica documentada — é assim que uma alcalose metabólica por diurético passa despercebida em portador de DPOC.',
      'Oxigênio em excesso no retentor crônico eleva a PaCO₂ por três mecanismos (perda da vasoconstrição hipóxica com piora V/Q, efeito Haldane e, em menor grau, redução do drive). Alvo de saturação de 88 a 92% é a conduta, não 100%.',
      'O bicarbonato não sobe indefinidamente: o platô fica em torno de 45 mEq/L, mesmo com PaCO₂ muito alta.',
    ],
    referencias: [
      { texto: 'Brackett NC Jr, Cohen JJ, Schwartz WB. Carbon dioxide titration curve of normal man. N Engl J Med. 1965;272:6-12.' },
      { texto: 'Adrogué HJ, Madias NE. Management of life-threatening acid-base disorders. N Engl J Med. 1998;338(2):107-111.' },
    ],
  },

  {
    id: 'compensacao-alcalose-respiratoria',
    nome: 'Compensação esperada na alcalose respiratória',
    sinonimos: ['hiperventilacao', 'hipocapnia compensacao'],
    resumo: 'Quanto o bicarbonato deveria cair para a hipocapnia observada, aguda ou cronicamente.',
    categorias: ['gasometria'],
    campos: [
      campoNum('paco2', 'PaCO₂ medida', { unidade: 'mmHg', min: 5, max: 40, passo: 0.5, ajuda: 'Só faz sentido abaixo de 35 mmHg.' }),
      CAMPO_HCO3,
      campoSeg('tempo', 'Tempo de instalação', [
        { valor: 'agudo', rotulo: 'Agudo (< 24 h)' },
        { valor: 'cronico', rotulo: 'Crônico (> 3 dias)' },
      ], { ajuda: 'Aguda (bicarbonato cai 2 mEq/L por 10 mmHg de queda) ou crônica (cai 4 a 5). Gestação e altitude produzem a forma crônica, plenamente compensada e fisiológica.' }),
    ],
    calcular: (v) => {
      const paco2 = num(v, 'paco2')
      const hco3 = num(v, 'hco3')
      if (paco2 === null) return null
      const cronico = opc(v, 'tempo') === 'cronico'
      const c = compensacaoEsperada('alcalose-respiratoria', hco3 ?? 24, paco2, cronico)!
      const phAgudo = 7.4 + 0.008 * (40 - paco2)
      const phCronico = 7.4 + 0.003 * (40 - paco2)
      const detalhes: Resultado['detalhes'] = [
        { rotulo: 'HCO₃⁻ esperado', valor: `${fmt(c.faixaMin, 1)} a ${fmt(c.faixaMax, 1)} mEq/L`, nota: c.formula },
        { rotulo: 'pH previsto se puramente agudo', valor: fmt(phAgudo, 2) },
        { rotulo: 'pH previsto se puramente crônico', valor: fmt(phCronico, 2) },
      ]
      if (hco3 !== null) detalhes.splice(1, 0, { rotulo: 'HCO₃⁻ medido', valor: `${fmt(hco3, 1)} mEq/L`, nivel: c.adequada ? 'ok' : 'alerta' })
      return {
        titulo: `HCO₃⁻ esperado (${cronico ? 'crônica' : 'aguda'})`,
        valor: `${fmt(c.faixaMin, 1)} – ${fmt(c.faixaMax, 1)}`,
        unidade: 'mEq/L',
        nivel: hco3 === null ? 'neutro' : c.adequada ? 'ok' : 'alerta',
        detalhes,
        conduta: [
          'Encontrada a alcalose respiratória, **procure a causa antes de chamá-la de ansiedade**. Hiperventilação é sinal precoce de sepse, embolia pulmonar, dor, hipoxemia, intoxicação por salicilato, hepatopatia, gestação e lesão do sistema nervoso central. Rotular como crise de pânico sem afastar essas causas é um erro clássico e por vezes fatal.',
          'Bicarbonato **abaixo do esperado** indica acidose metabólica concomitante. A combinação de alcalose respiratória com acidose metabólica de ânion gap alto é a assinatura clássica da **intoxicação por salicilato** e da **sepse grave** — dose salicilemia e lactato.',
          'Bicarbonato **acima do esperado** aponta alcalose metabólica associada, tipicamente por vômito ou diurético, e produz alcalemia grave, com risco de arritmia, vasoconstrição cerebral e redução do cálcio ionizado.',
          'Diferencie **aguda (bicarbonato cai 2 mEq/L por 10 mmHg de queda do gás carbônico)** de **crônica (cai 4–5 mEq/L)**: gestação e altitude produzem alcalose respiratória crônica plenamente compensada, que é fisiológica e não requer intervenção alguma.',
          'Na alcalose respiratória **iatrogênica do paciente ventilado**, corrija os parâmetros — reduza a frequência ou o volume corrente — em vez de aumentar a sedação. Hipocapnia mantida reduz o fluxo sanguíneo cerebral em cerca de 2–4% por mmHg e piora a isquemia em lesão cerebral aguda, onde a hiperventilação só se justifica como medida de resgate por minutos, diante de herniação iminente.',
        ],
        alertas: [
          'Hiperventilação não é diagnóstico de ansiedade até que sepse, embolia pulmonar, hipoxemia, intoxicação por salicilato e lesão do sistema nervoso central tenham sido afastadas.',
          'Hipocapnia mantida reduz o fluxo sanguíneo cerebral em cerca de 2 a 4% por mmHg. Em lesão cerebral aguda, a hiperventilação só se justifica por minutos, como resgate diante de herniação iminente.',
        ],
        interpretacao: [
          hco3 === null ? 'Informe o bicarbonato medido para comparar.' : c.leitura,
          'A alcalose respiratória é o distúrbio ácido-base mais comum em pacientes hospitalizados e quase nunca é o problema em si — é o sinal de outro. Dor, ansiedade, febre, sepse, embolia pulmonar, hepatopatia, gestação, altitude, ventilação mecânica mal ajustada e intoxicação por salicilato cobrem a maioria dos casos. A alcalose respiratória crônica é o único distúrbio em que a compensação pode normalizar completamente o pH.',
        ],
      }
    },
    formula: [
      'Aguda:   HCO₃⁻ = 24 − 2 × (40 − PaCO₂)/10   (± 2)',
      'Crônica: HCO₃⁻ = 24 − 4 a 5 × (40 − PaCO₂)/10   (± 4)',
    ],
    fundamento:
      'A hipocapnia aguda consome bicarbonato por deslocamento do equilíbrio e por liberação de H⁺ dos tampões intracelulares — cerca de 2 mEq/L por 10 mmHg. Cronicamente, o rim reduz a reabsorção proximal de bicarbonato e a excreção de amônio, e a queda chega a 4 ou 5 mEq/L por 10 mmHg. Essa é a razão de a alcalose respiratória crônica ser o único distúrbio capaz de devolver o pH exatamente à faixa normal: a resposta renal é proporcionalmente maior do que nos demais.',
    armadilhas: [
      'Bicarbonato baixo com hipocapnia pode ser compensação de alcalose respiratória ou acidose metabólica primária. O ânion gap e o pH separam: pH acima de 7,45 aponta o componente respiratório como primário.',
      'A tríade alcalose respiratória + acidose metabólica de ânion gap alto + zumbido é intoxicação por salicilato até prova em contrário, e o quadro exige alcalinização urinária, não observação.',
    ],
    referencias: [
      { texto: 'Krapf R, Beeler I, Hertner D, Hulter HN. Chronic respiratory alkalosis: the effect of sustained hyperventilation on renal regulation of acid-base equilibrium. N Engl J Med. 1991;324(20):1394-1401.' },
      { texto: 'Foster GT, Vaziri ND, Sassoon CS. Respiratory alkalosis. Respir Care. 2001;46(4):384-391.' },
    ],
  },

  {
    id: 'compensacao-alcalose-metabolica',
    nome: 'Compensação esperada na alcalose metabólica',
    sinonimos: ['alcalose metabolica compensacao', 'hipoventilacao compensatoria'],
    resumo: 'PaCO₂ esperada quando o bicarbonato sobe — e por que a compensação é sempre modesta.',
    categorias: ['gasometria'],
    campos: [
      campoNum('hco3', 'HCO₃⁻', { unidade: 'mEq/L', min: 20, max: 60, passo: 0.1, ajuda: 'Só faz sentido acima de 26 mEq/L.' }),
      campoNum('paco2', 'PaCO₂ medida', { ajuda: 'Gás carbônico arterial medido, para comparar com a compensação prevista. O teto prático da hipoventilação compensatória fica em torno de 55 mmHg.', unidade: 'mmHg', min: 20, max: 100, passo: 0.5, opcional: true }),
    ],
    calcular: (v) => {
      const hco3 = num(v, 'hco3')
      const paco2 = num(v, 'paco2')
      if (hco3 === null) return null
      const c = compensacaoEsperada('alcalose-metabolica', hco3, paco2 ?? 40, false)!
      const detalhes: Resultado['detalhes'] = [
        { rotulo: 'PaCO₂ esperada', valor: `${fmt(c.faixaMin, 1)} a ${fmt(c.faixaMax, 1)} mmHg`, nota: c.formula },
      ]
      if (paco2 !== null) detalhes.push({ rotulo: 'PaCO₂ medida', valor: `${fmt(paco2, 1)} mmHg`, nivel: c.adequada ? 'ok' : 'alerta' })
      return {
        titulo: 'PaCO₂ esperada',
        valor: `${fmt(c.faixaMin, 1)} – ${fmt(c.faixaMax, 1)}`,
        unidade: 'mmHg',
        nivel: paco2 === null ? 'neutro' : c.adequada ? 'ok' : 'alerta',
        detalhes,
        conduta: [
          'Classifique pelo **cloro urinário**, que é o que decide o tratamento: **< 20 mEq/L (responsiva a cloro)** aponta vômito, aspiração nasogástrica, uso prévio de diurético ou pós-hipercapnia — e responde a **salina isotônica** com reposição de potássio. **> 20 mEq/L (resistente a cloro)** aponta hiperaldosteronismo, síndrome de Cushing, estenose de artéria renal, uso atual de diurético ou síndromes de Bartter e Gitelman — e **não** responde a volume.',
          'Na forma **resistente a cloro**, o tratamento é dirigido ao excesso mineralocorticoide: espironolactona ou amilorida, correção de potássio e magnésio, e investigação endócrina com relação aldosterona/renina. Dar salina aqui só gera sobrecarga volêmica.',
          'Reponha **potássio e magnésio** sempre: a hipocalemia mantém a alcalose ao estimular a reabsorção de bicarbonato e a secreção de hidrogênio no túbulo coletor. Sem corrigi-los, a alcalose se torna autoperpetuante independentemente da causa inicial.',
          'Em alcalose grave (**pH > 7,55 ou bicarbonato > 45 mEq/L**) com repercussão — arritmia, tetania por queda do cálcio ionizado, convulsão, depressão respiratória —, considere **acetazolamida 250–500 mg** (que aumenta a bicarbonatúria, ao custo de perda de potássio), inibidor de bomba de prótons quando a origem for perda gástrica, ou hemodiálise com banho de baixo bicarbonato nos casos refratários com insuficiência renal.',
          'Verifique se a **compensação respiratória é adequada** (gás carbônico sobe 0,7 mmHg por mEq/L de bicarbonato, com teto prático em torno de 55 mmHg): compensação insuficiente indica que algo limita a hipoventilação — estímulo hipoxêmico, dor, ventilação mecânica com parâmetros fixos — e a alcalemia resultante será mais grave.',
        ],
        alertas: [
          'Sem corrigir potássio e magnésio, a alcalose se torna autoperpetuante: a hipocalemia mantém a reabsorção de bicarbonato e a secreção de hidrogênio no túbulo coletor, independentemente da causa inicial.',
        ],
        interpretacao: [
          paco2 === null ? 'Informe a PaCO₂ medida para verificar a compensação.' : c.leitura,
          'A hipoventilação compensatória tem freio: a hipoxemia que ela mesma provoca reativa o drive respiratório, e a PaCO₂ raramente ultrapassa 55 a 60 mmHg por compensação pura. PaCO₂ acima disso em alcalose metabólica praticamente sempre significa acidose respiratória associada.',
          'Do ponto de vista prático, a alcalose metabólica se divide pelo cloro urinário: **cloro-responsiva** (Cl⁻ urinário < 20 mEq/L — vômitos, sonda nasogástrica, diurético já suspenso, pós-hipercapnia), que responde a salina; e **cloro-resistente** (Cl⁻ urinário > 20 mEq/L — hiperaldosteronismo, síndrome de Cushing, Bartter, Gitelman, diurético em uso), que não responde a volume e exige tratar a causa.',
        ],
      }
    },
    formula: ['PaCO₂ esperada = 40 + 0,7 × (HCO₃⁻ − 24) ± 5'],
    fundamento:
      'A alcalose metabólica é o distúrbio com a compensação mais fraca porque a hipoventilação é limitada pela própria hipoxemia que produz — reter CO₂ significa deslocar O₂ do alvéolo. Por isso o coeficiente é 0,7, e não 1, e por isso o pH raramente volta à faixa normal. Manter a alcalose exige um segundo fator além da causa inicial: quase sempre depleção de volume e de cloro, que obriga o túbulo a reabsorver bicarbonato junto com o sódio, ou excesso de mineralocorticoide, que perpetua a secreção de H⁺.',
    armadilhas: [
      'Alcalose metabólica grave (pH > 7,55) reduz o cálcio ionizado, desloca a curva de dissociação da hemoglobina para a esquerda, provoca arritmias e reduz o limiar convulsivo — não é um distúrbio benigno só porque "é o oposto da acidose".',
      'A hipocalemia é causa e consequência: ela desloca H⁺ para dentro da célula e aumenta a reabsorção tubular de bicarbonato. Corrigir a alcalose sem corrigir o potássio quase nunca funciona.',
    ],
    referencias: [
      { texto: 'Galla JH. Metabolic alkalosis. J Am Soc Nephrol. 2000;11(2):369-375.' },
      { texto: 'Emmett M. Metabolic alkalosis: a brief pathophysiologic review. Clin J Am Soc Nephrol. 2020;15(12):1848-1856.' },
    ],
  },

  {
    id: 'anion-gap',
    nome: 'Cálculo do ânion gap',
    sinonimos: ['AG', 'anion gap', 'ânion gap', 'hiato aniônico'],
    resumo: 'Separa a acidose metabólica por ânions não medidos da acidose hiperclorêmica.',
    categorias: ['gasometria', 'nefrologia'],
    campos: [
      campoNum('na', 'Sódio', { ajuda: 'Sódio do mesmo painel dos outros dois eletrólitos. Amostras de momentos diferentes invalidam o cálculo.', unidade: 'mEq/L', min: 90, max: 200, passo: 1, normalMin: 135, normalMax: 145 }),
      campoNum('cl', 'Cloro', { ajuda: 'Cloro do mesmo painel. Métodos de eletrodo íon-seletivo atuais deslocam a faixa normal do gap para cerca de 6 ± 3.', unidade: 'mEq/L', min: 60, max: 160, passo: 1, normalMin: 98, normalMax: 107 }),
      campoNum('hco3', 'HCO₃⁻', { ajuda: 'Use o bicarbonato da gasometria arterial quando houver; na sua falta, o dióxido de carbono total do painel venoso serve.', unidade: 'mEq/L', min: 1, max: 60, passo: 0.1, normalMin: 22, normalMax: 26 }),
      campoNum('k', 'Potássio', { unidade: 'mEq/L', min: 1, max: 10, passo: 0.1, opcional: true, ajuda: 'Opcional. Incluir o potássio eleva a faixa de referência para 12 a 16.' }),
    ],
    calcular: (v) => {
      const na = num(v, 'na')
      const cl = num(v, 'cl')
      const hco3 = num(v, 'hco3')
      const k = num(v, 'k')
      if (na === null || cl === null || hco3 === null) return null
      const ag = na - (cl + hco3)
      const agK = k !== null ? na + k - (cl + hco3) : null
      const nivel: Nivel = ag > 20 ? 'critico' : ag > 16 ? 'alerta' : ag > 12 ? 'atencao' : ag < 4 ? 'atencao' : 'ok'
      const detalhes: Resultado['detalhes'] = [
        { rotulo: 'Faixa de referência', valor: '8 a 12 mEq/L', nota: 'Com analisadores de eletrodo íon-seletivo, muitos laboratórios trabalham com 3 a 11. Confira a faixa do seu serviço antes de chamar de alto.' },
      ]
      if (agK !== null) detalhes.push({ rotulo: 'Ânion gap com potássio', valor: `${fmt(agK, 1)} mEq/L`, nota: 'Referência 12 a 16 mEq/L.' })
      const interp: string[] = []
      if (ag > 12) {
        interp.push(
          '**Ânion gap aumentado.** Ácidos foram acrescentados ao plasma e consumiram bicarbonato, deixando seus ânions no lugar. Mnemônica GOLD MARK: **G**licóis (etilenoglicol, propilenoglicol de infusões), **O**xoprolina (ácido piroglutâmico, do uso crônico de paracetamol em desnutridos), **L**-lactato, **D**-lactato (síndrome do intestino curto), **M**etanol, **A**spirina, **R**enal (uremia), **K**etoácidos.',
        )
      } else if (ag < 4) {
        interp.push(
          '**Ânion gap baixo.** Quase sempre é hipoalbuminemia (a albumina é o maior ânion não medido) — corrija pela albumina antes de qualquer conclusão. Outras causas: mieloma múltiplo com paraproteína catiônica, intoxicação por lítio, brometo ou iodeto, e hipercalcemia ou hipermagnesemia graves.',
        )
      } else {
        interp.push(
          '**Ânion gap normal.** Se há acidose metabólica, ela é hiperclorêmica: perda digestiva de bicarbonato, acidose tubular renal, expansão com salina 0,9%, inibidor de anidrase carbônica ou derivação ureteral. O ânion gap urinário (Na⁺ + K⁺ − Cl⁻ na urina) separa: negativo indica amônio urinário alto, isto é, resposta renal preservada diante de perda digestiva; positivo indica falha de acidificação renal.',
        )
      }
      return {
        titulo: 'Ânion gap',
        valor: fmt(ag, 1),
        unidade: 'mEq/L',
        nivel,
        rotuloNivel: ag > 12 ? 'Aumentado' : ag < 4 ? 'Reduzido' : 'Normal',
        detalhes,
        interpretacao: interp,
        alertas: ['O ânion gap sem correção pela albumina subestima em qualquer paciente hipoalbuminêmico — o que inclui praticamente toda a UTI. Use a calculadora de ânion gap corrigido antes de descartar acidose por ânions não medidos.'],
        conduta: [
          'Com gap **alto**, percorra a mnemônica **GOLD MARK** e dose o que ela indica: **G**licóis (etilenoglicol, propilenoglicol), **O**xoprolina (uso crônico de paracetamol), **L**-lactato, **D**-lactato (síndrome do intestino curto), **M**etanol, **A**spirina, **R**enal (uremia) e **K**etoacidose. Peça lactato, cetonemia ou cetonúria, ureia e creatinina de imediato.',
          'Se houver suspeita de intoxicação, calcule o **gap osmolar** na mesma amostra: gap osmolar alto com gap aniônico alto aponta metanol ou etilenoglicol, e ambos têm antídoto (fomepizol ou etanol) com janela terapêutica — não aguarde a dosagem específica para acionar o centro de intoxicações.',
          'Prossiga obrigatoriamente para a **relação delta**: ela revela um segundo distúrbio metabólico que o gap sozinho esconde — acidose hiperclorêmica associada (razão < 0,8) ou alcalose metabólica concomitante (razão > 2).',
          'Com gap **normal** (hiperclorêmica), separe perda gastrointestinal de renal pelo **ânion gap urinário**: negativo aponta perda intestinal (diarreia, fístula, derivação ureteral), positivo aponta acidose tubular renal. O tratamento difere completamente.',
          'Trate a causa, não o número. Bicarbonato não está indicado de rotina na cetoacidose nem na acidose lática — reponha volume, corrija a perfusão, dê insulina e potássio conforme o caso.',
        ],
      }
    },
    formula: ['AG = Na⁺ − (Cl⁻ + HCO₃⁻)', 'AG com potássio = (Na⁺ + K⁺) − (Cl⁻ + HCO₃⁻)'],
    fundamento:
      'O plasma é eletricamente neutro: a soma de todos os cátions iguala a de todos os ânions. Como só medimos rotineiramente um cátion grande (sódio) e dois ânions grandes (cloro e bicarbonato), a diferença entre eles corresponde aos ânions que existem mas não medimos — albumina em primeiro lugar, além de fosfato, sulfato e ânions orgânicos. Quando um ácido novo entra na circulação, seu H⁺ consome bicarbonato e seu ânion fica no plasma sem ser medido: o gap sobe. Quando a acidose vem de perda direta de bicarbonato, o rim retém cloro para manter a neutralidade e o gap não muda — daí "hiperclorêmica de ânion gap normal".',
    armadilhas: [
      'A faixa de referência mudou com a tecnologia: os métodos antigos de cloro davam gap normal de 12 ± 4; os eletrodos íon-seletivos atuais dão 6 ± 3. Usar 12 como normal num laboratório moderno faz perder acidoses reais.',
      'Hiperlipidemia grave e hiperproteinemia geram pseudo-hiponatremia pelo método indireto e distorcem o gap.',
      'Ânion gap alto sem acidemia existe: alcalose metabólica grave eleva o gap por aumento da carga negativa da albumina.',
    ],
    referencias: [
      { texto: 'Kraut JA, Madias NE. Serum anion gap: its uses and limitations in clinical medicine. Clin J Am Soc Nephrol. 2007;2(1):162-174.' },
      { texto: 'Mehta AN, Emmett JB, Emmett M. GOLD MARK: an anion gap mnemonic for the 21st century. Lancet. 2008;372(9642):892.' },
    ],
  },

  {
    id: 'anion-gap-corrigido',
    nome: 'Ânion gap corrigido pela albumina',
    sinonimos: ['gap corrigido', 'figge', 'albumina anion gap'],
    resumo: 'Recupera o ânion gap que a hipoalbuminemia esconde — reclassifica boa parte da UTI.',
    categorias: ['gasometria', 'nefrologia'],
    campos: [
      campoNum('na', 'Sódio', { ajuda: 'Sódio do mesmo painel dos demais eletrólitos.', unidade: 'mEq/L', min: 90, max: 200, passo: 1 }),
      campoNum('cl', 'Cloro', { ajuda: 'Cloro do mesmo painel — os três valores precisam vir da mesma amostra.', unidade: 'mEq/L', min: 60, max: 160, passo: 1 }),
      campoNum('hco3', 'HCO₃⁻', { ajuda: 'Bicarbonato da gasometria, ou dióxido de carbono total do painel venoso na sua falta.', unidade: 'mEq/L', min: 1, max: 60, passo: 0.1 }),
      campoNum('albumina', 'Albumina', { ajuda: 'Albumina em g/dL. Cada 1 g/dL abaixo de 4 esconde cerca de 2,5 mEq/L de ânion gap, e é por isso que quase toda a UTI precisa da correção.', unidade: 'g/dL', min: 0.5, max: 6, passo: 0.1, normalMin: 3.5, normalMax: 5 }),
      campoNum('fosfato', 'Fosfato', { unidade: 'mg/dL', min: 0.5, max: 20, passo: 0.1, opcional: true, ajuda: 'Opcional. Em uremia grave o fosfato contribui de forma relevante para o gap.' }),
    ],
    calcular: (v) => {
      const na = num(v, 'na')
      const cl = num(v, 'cl')
      const hco3 = num(v, 'hco3')
      const alb = num(v, 'albumina')
      const fosfato = num(v, 'fosfato')
      if (na === null || cl === null || hco3 === null || alb === null) return null
      const ag = na - (cl + hco3)
      const correcaoAlb = 2.5 * (4 - alb)
      const correcaoFosf = fosfato !== null ? 0.5 * (4.5 - fosfato) : 0
      const agCorr = ag + correcaoAlb + correcaoFosf
      const detalhes: Resultado['detalhes'] = [
        { rotulo: 'Ânion gap bruto', valor: `${fmt(ag, 1)} mEq/L` },
        { rotulo: 'Correção pela albumina', valor: `${correcaoAlb >= 0 ? '+' : ''}${fmt(correcaoAlb, 1)} mEq/L`, nota: '2,5 mEq/L por g/dL de albumina abaixo de 4,0' },
      ]
      if (fosfato !== null)
        detalhes.push({ rotulo: 'Correção pelo fosfato', valor: `${correcaoFosf >= 0 ? '+' : ''}${fmt(correcaoFosf, 1)} mEq/L`, nota: '0,5 mEq/L por mg/dL de fosfato abaixo de 4,5' })
      const reclassifica = ag <= 12 && agCorr > 12
      return {
        titulo: 'Ânion gap corrigido',
        valor: fmt(agCorr, 1),
        unidade: 'mEq/L',
        nivel: agCorr > 20 ? 'critico' : agCorr > 16 ? 'alerta' : agCorr > 12 ? 'atencao' : 'ok',
        rotuloNivel: agCorr > 12 ? 'Aumentado' : 'Normal',
        detalhes,
        alertas: [
          'Use o gap corrigido como numerador ao calcular a relação delta. Usar o gap bruto distorce a razão e pode inventar ou apagar um segundo distúrbio.',
        ],
        interpretacao: [
          reclassifica
            ? `**A correção muda o diagnóstico.** O gap bruto de ${fmt(ag, 1)} pareceria normal, mas com albumina de ${fmt(alb, 1)} g/dL o gap verdadeiro é ${fmt(agCorr, 1)} — há acidose por ânions não medidos que passaria despercebida.`
            : agCorr > 12
              ? 'Ânion gap aumentado mesmo após a correção: procure lactato, cetoácidos, uremia e as intoxicações da mnemônica GOLD MARK.'
              : 'Ânion gap normal após a correção. Se há acidose metabólica, ela é hiperclorêmica.',
          'A regra prática vale a pena decorar: **para cada 1 g/dL de albumina abaixo de 4, some 2,5 ao ânion gap**. Num paciente de UTI com albumina de 2,0, o gap "normal" de 10 é na verdade 15.',
        ],
        conduta: [
          'Use **sempre** o gap corrigido em paciente crítico, cirrótico, nefrótico ou desnutrido. Cada 1 g/dL de albumina abaixo de 4 esconde cerca de 2,5 mEq/L de gap — um gap "normal" de 11 com albumina de 2 g/dL é, na verdade, 16.',
          'Se a correção **reclassificou** o caso, trate como acidose de ânion gap alto: dose lactato, cetonas, ureia e creatinina, e considere intoxicação com gap osmolar. A acidose estava lá o tempo todo, mascarada pela hipoalbuminemia.',
          'Calcule a **relação delta** a partir do gap corrigido, nunca do bruto — usar o gap não corrigido no numerador distorce a razão e pode inventar ou apagar um segundo distúrbio.',
          'Considere a abordagem de **Stewart** (diferença de íons fortes e ácidos fracos totais) quando a hipoalbuminemia for grave ou o quadro não fechar: ela incorpora o efeito da albumina de forma nativa, sem precisar de fator de correção.',
          'Repita o gap corrigido ao longo do tratamento. O fechamento do gap é o marcador de resolução da cetoacidose, mais confiável que a glicemia ou que a cetonúria, que persiste positiva por acúmulo de acetoacetato.',
        ],
      }
    },
    formula: [
      'AG corrigido = AG + 2,5 × (4,0 − albumina em g/dL)',
      'Com fosfato: + 0,5 × (4,5 − fosfato em mg/dL)',
    ],
    fundamento:
      'A albumina responde por cerca de 75% dos ânions não medidos do plasma. Ela é uma proteína polianiônica no pH fisiológico, com aproximadamente 2,5 mEq de carga negativa por grama por decilitro. Quando a albumina cai — o que acontece em praticamente todo paciente crítico, cirrótico, séptico ou desnutrido — o ânion gap basal cai junto, e uma acidose lática ou cetoacidose real pode aparecer com gap dentro da faixa de referência. Figge e colaboradores demonstraram isso quantitativamente em 1998, e a correção passou a ser padrão em medicina intensiva.',
    armadilhas: [
      'A correção é linear e aproximada; em albuminas muito baixas (< 1,5 g/dL) a abordagem de Stewart, com SID e ATOT, é mais fiel.',
      'Corrigir pela albumina não substitui dosar lactato: gap corrigido normal com lactato de 6 acontece e continua sendo hipoperfusão.',
    ],
    referencias: [
      { texto: 'Figge J, Jabor A, Kazda A, Fencl V. Anion gap and hypoalbuminemia. Crit Care Med. 1998;26(11):1807-1810.' },
      { texto: 'Hatherill M, Waggie Z, Purves L, Reynolds L, Argent A. Correction of the anion gap for albumin in order to detect occult tissue anions in shock. Arch Dis Child. 2002;87(6):526-529.' },
    ],
  },

  {
    id: 'delta-gap',
    nome: 'Delta gap e relação delta',
    sinonimos: ['delta delta', 'delta ratio', 'delta-delta'],
    resumo: 'Revela o distúrbio metabólico escondido por trás de uma acidose de ânion gap alto.',
    categorias: ['gasometria'],
    campos: [
      campoNum('ag', 'Ânion gap (preferir o corrigido pela albumina)', { unidade: 'mEq/L', min: 0, max: 60, passo: 0.1 }),
      campoNum('hco3', 'HCO₃⁻', { ajuda: 'Bicarbonato atual. A relação delta compara a queda do bicarbonato com a subida do ânion gap para revelar um segundo distúrbio.', unidade: 'mEq/L', min: 1, max: 60, passo: 0.1 }),
      campoNum('agBasal', 'Ânion gap normal de referência', { unidade: 'mEq/L', min: 4, max: 14, passo: 0.5, padrao: '12', ajuda: 'Use o normal do seu laboratório. Serviços com eletrodo íon-seletivo costumam usar 8 a 10.' }),
      campoNum('hco3Basal', 'HCO₃⁻ normal de referência', { unidade: 'mEq/L', min: 20, max: 28, passo: 0.5, padrao: '24' }),
    ],
    calcular: (v) => {
      const ag = num(v, 'ag')
      const hco3 = num(v, 'hco3')
      const agBasal = numOu(v, 'agBasal', 12)
      const hco3Basal = numOu(v, 'hco3Basal', 24)
      if (ag === null || hco3 === null) return null
      const dAG = ag - agBasal
      const dHCO3 = hco3Basal - hco3
      const deltaGap = dAG - dHCO3
      const razao = dHCO3 !== 0 ? dAG / dHCO3 : null
      const detalhes: Resultado['detalhes'] = [
        { rotulo: 'ΔAG (gap acima do basal)', valor: `${fmt(dAG, 1)} mEq/L` },
        { rotulo: 'ΔHCO₃⁻ (bicarbonato consumido)', valor: `${fmt(dHCO3, 1)} mEq/L` },
        { rotulo: 'Delta gap (ΔAG − ΔHCO₃⁻)', valor: `${deltaGap >= 0 ? '+' : ''}${fmt(deltaGap, 1)} mEq/L`, nota: 'Acima de +6 sugere alcalose metabólica associada; abaixo de −6, acidose hiperclorêmica associada.' },
        { rotulo: 'HCO₃⁻ "corrigido" (se não houvesse o ácido orgânico)', valor: `${fmt(hco3 + dAG, 1)} mEq/L`, nota: 'Some o ΔAG ao bicarbonato medido: se o resultado ficar acima de 26, há alcalose metabólica; abaixo de 22, há acidose hiperclorêmica somada.' },
      ]
      const nivel: Nivel = razao === null ? 'neutro' : razao < 0.4 || razao > 2 ? 'alerta' : razao < 0.8 ? 'atencao' : 'ok'
      return {
        titulo: 'Relação delta (ΔAG / ΔHCO₃⁻)',
        valor: razao === null ? '—' : fmt(razao, 2),
        nivel,
        rotuloNivel:
          razao === null
            ? 'Bicarbonato no valor de referência'
            : razao < 0.4
              ? 'Acidose hiperclorêmica predominante'
              : razao < 0.8
                ? 'Acidose mista'
                : razao <= 2
                  ? 'Acidose de ânion gap alto pura'
                  : 'Alcalose metabólica ou acidose respiratória crônica associada',
        detalhes,
        alertas: [
          'A relação delta pressupõe que o distúrbio esteja em equilíbrio e perde validade nas primeiras horas de uma acidose em instalação rápida, quando o bicarbonato ainda está caindo.',
          'Em hipoalbuminemia, corrija o ânion gap antes de calcular a razão — caso contrário o numerador está subestimado e a interpretação, invertida.',
        ],
        interpretacao: [
          razao === null ? 'Com o bicarbonato exatamente no valor de referência, a relação delta é indefinida — use o delta gap absoluto.' : leituraRelacaoDelta(razao),
          'A lógica é de conservação: se todo o ácido acrescentado foi tamponado por bicarbonato, cada mEq de ânion novo deveria ter consumido 1 mEq de bicarbonato, e a razão seria 1. Desvios revelam que algo mais mexeu no bicarbonato — para cima (alcalose associada) ou para baixo (perda adicional).',
          'Na cetoacidose diabética a razão costuma ficar próxima de 1 na chegada e cair progressivamente durante o tratamento, à medida que a salina 0,9% acrescenta cloro e os cetoânions são excretados na urina: a acidose vira hiperclorêmica com gap já normal, e isso é evolução esperada, não piora.',
        ],
        conduta: [
          'Com razão **entre 0,8 e 2,0**, a acidose de ânion gap alto é pura: trate a causa identificada pelo GOLD MARK e acompanhe o fechamento do gap.',
          'Com razão **abaixo de 0,8**, há acidose hiperclorêmica associada. Reveja a reposição volêmica — salina 0,9%, com 154 mEq/L de cloro, é causa iatrogênica frequente. Troque para cristaloide balanceado e procure perda gastrointestinal ou acidose tubular renal com o ânion gap urinário.',
          'Com razão **acima de 2,0**, há alcalose metabólica concomitante ou acidose respiratória crônica prévia com bicarbonato basal elevado. Procure vômitos, aspiração nasogástrica, diurético e DPOC retentor — e confirme com a história e com gasometrias anteriores.',
          'Na cetoacidose em tratamento, a queda progressiva da razão é **esperada** e não indica piora: os cetoânions são excretados na urina enquanto a salina acrescenta cloro, e a acidose de gap alto se converte em hiperclorêmica com gap já normalizado. Acompanhe pelo gap corrigido e pelo pH, não pela razão.',
          'Registre os três números juntos (gap corrigido, bicarbonato e razão delta). É a combinação, e não qualquer um deles isolado, que revela distúrbio triplo com pH normal.',
        ],
        tabela: {
          titulo: 'Leitura da relação delta',
          colunas: ['Relação', 'Leitura'],
          linhas: [
            ['< 0,4', 'Acidose de ânion gap normal (hiperclorêmica)'],
            ['0,4 – 0,8', 'Acidose mista: gap alto + hiperclorêmica'],
            ['0,8 – 2,0', 'Acidose de ânion gap alto pura'],
            ['> 2,0', 'Gap alto + alcalose metabólica ou acidose respiratória crônica prévia'],
          ],
          destaque: razao === null ? undefined : razao < 0.4 ? 0 : razao < 0.8 ? 1 : razao <= 2 ? 2 : 3,
        },
      }
    },
    formula: [
      'ΔAG = AG medido − AG basal (12)',
      'ΔHCO₃⁻ = HCO₃⁻ basal (24) − HCO₃⁻ medido',
      'Delta gap = ΔAG − ΔHCO₃⁻',
      'Relação delta = ΔAG / ΔHCO₃⁻',
    ],
    fundamento:
      'A relação delta responde a uma pergunta que nenhum outro parâmetro responde: além da acidose de ânion gap alto que estou vendo, existe um segundo distúrbio metabólico? Se o ácido acrescentado foi integralmente tamponado por bicarbonato, o aumento do gap e a queda do bicarbonato têm de ser numericamente iguais. Quando o bicarbonato caiu mais do que o gap subiu, houve perda adicional de bicarbonato — acidose hiperclorêmica somada. Quando caiu menos, algo estava segurando o bicarbonato para cima: alcalose metabólica concomitante (vômitos numa cetoacidose, por exemplo) ou uma acidose respiratória crônica que já havia elevado o bicarbonato basal.',
    armadilhas: [
      'Só se aplica quando o ânion gap está aumentado. Calcular a relação delta com gap normal não significa nada.',
      'Na acidose lática a razão tende a ser maior que 1 (o lactato é metabolizado e parte do bicarbonato é regenerada), e na cetoacidose tende a ser menor que 1 (os cetoânions são perdidos na urina). Interpretar sem saber a causa gera falsos "distúrbios mistos".',
      'A escolha do gap basal muda a razão substancialmente. Usar 12 num laboratório cujo normal é 8 infla o ΔAG em 4 mEq/L.',
    ],
    referencias: [
      { texto: 'Rastegar A. Use of the ΔAG/ΔHCO₃⁻ ratio in the diagnosis of mixed acid-base disorders. J Am Soc Nephrol. 2007;18(9):2429-2431.' },
      { texto: 'Wrenn K. The delta gap: an approach to mixed acid-base disorders. Ann Emerg Med. 1990;19(11):1310-1313.' },
    ],
  },

  {
    id: 'bicarbonato-padrao',
    nome: 'Bicarbonato padrão e excesso de base',
    sinonimos: ['standard bicarbonate', 'base excess', 'BE', 'SBE', 'deficit de base'],
    resumo: 'Isola o componente metabólico puro, removendo aritmeticamente o efeito da PaCO₂.',
    categorias: ['gasometria'],
    campos: [
      campoNum('ph', 'pH arterial', { ajuda: 'pH arterial medido. O bicarbonato padrão é recalculado para PaCO₂ de 40 mmHg, o que remove o componente respiratório e isola o metabólico.', min: 6.5, max: 8, passo: 0.01, normalMin: 7.35, normalMax: 7.45 }),
      campoNum('paco2', 'PaCO₂', { ajuda: 'PaCO₂ arterial medida, necessária para a correção. Em hipoalbuminemia, o excesso de base subestima a acidose por ânions não medidos — use a versão corrigida pela albumina.', unidade: 'mmHg', min: 5, max: 150, passo: 0.5, normalMin: 35, normalMax: 45 }),
    ],
    calcular: (v) => {
      const ph = num(v, 'ph')
      const paco2 = num(v, 'paco2')
      if (ph === null || paco2 === null) return null
      const hco3 = hco3DeHH(ph, paco2)
      const bp = bicarbonatoPadrao(ph, paco2)
      const be = sbe(hco3, ph)
      const nivel: Nivel = be < -10 ? 'critico' : be < -5 ? 'alerta' : be < -2 || be > 5 ? 'atencao' : 'ok'
      return {
        titulo: 'Bicarbonato padrão',
        valor: fmt(bp, 1),
        unidade: 'mEq/L',
        nivel,
        rotuloNivel: bp < 22 ? 'Componente metabólico ácido' : bp > 26 ? 'Componente metabólico alcalino' : 'Componente metabólico normal',
        detalhes: [
          { rotulo: 'HCO₃⁻ atual (medido nas condições do paciente)', valor: `${fmt(hco3, 1)} mEq/L` },
          { rotulo: 'Bicarbonato padrão (a PaCO₂ 40 mmHg, 37 °C)', valor: `${fmt(bp, 1)} mEq/L` },
          { rotulo: 'Diferença atual − padrão', valor: `${hco3 - bp >= 0 ? '+' : ''}${fmt(hco3 - bp, 1)} mEq/L`, nota: 'É a parcela do bicarbonato que existe apenas por causa da PaCO₂ atual.' },
          { rotulo: 'Excesso de base padrão (SBE)', valor: `${be >= 0 ? '+' : ''}${fmt(be, 1)} mEq/L`, nota: 'Referência −2 a +2. Negativo = déficit de base.' },
        ],
        conduta: [
          'Use o **bicarbonato padrão e o excesso de base** para isolar o componente **metabólico** puro: ambos são calculados a gás carbônico de 40 mmHg e temperatura de 37 °C, de modo que não sofrem influência da ventilação. Isso responde à pergunta prática de quanto do distúrbio é metabólico quando há dois processos simultâneos.',
          '**Excesso de base mais negativo que −2 mEq/L** indica acidose metabólica; **mais positivo que +2**, alcalose metabólica. Na avaliação inicial do trauma, um déficit de base mais negativo que −6 mEq/L é marcador independente de gravidade e de necessidade de transfusão maciça, mesmo com pressão arterial ainda normal.',
          'Acompanhe a **tendência**, não o valor isolado: no choque, a normalização do déficit de base nas primeiras 24 h é preditor de sobrevida, e um déficit que não melhora apesar da reposição volêmica indica hemorragia em curso ou foco isquêmico não controlado — é indicação de reexplorar, não de repetir o exame.',
          'Lembre que o excesso de base **não diz a causa**: ele quantifica, mas não distingue lactato de cetoácido, de ânion não medido ou de perda de bicarbonato. Combine sempre com **ânion gap, lactato e cloro** para chegar ao mecanismo.',
          'Em hipoalbuminemia — praticamente toda a UTI —, o excesso de base **subestima** a acidose por ânions não medidos, pelo mesmo motivo que o ânion gap: a albumina é o principal ácido fraco do plasma. Use o **excesso de base corrigido pela albumina** ou a abordagem de Stewart nesses pacientes.',
        ],
        alertas: [
          'O excesso de base quantifica, mas não diz a causa: não distingue lactato de cetoácido, de ânion não medido ou de perda de bicarbonato. Combine com ânion gap, lactato e cloro.',
          'Em hipoalbuminemia — praticamente toda a UTI — ele subestima a acidose por ânions não medidos. Use o excesso de base corrigido pela albumina nesses pacientes.',
        ],
        interpretacao: [
          'O bicarbonato atual mistura duas coisas: o que o metabolismo fez e o que a PaCO₂ fez. O bicarbonato padrão remove a segunda, respondendo "qual seria o bicarbonato deste sangue se a ventilação estivesse normal". Diferença grande entre atual e padrão significa que boa parte do bicarbonato observado é efeito respiratório, não metabólico.',
          be < -2
            ? `Déficit de base de ${fmt(Math.abs(be), 1)} mEq/L. No trauma, o déficit de base na admissão prediz necessidade de transfusão e mortalidade melhor do que a pressão arterial: acima de 6 já classifica choque de moderado a grave, acima de 10 é marcador de hemorragia maciça.`
            : be > 2
              ? 'Excesso de base positivo — componente metabólico alcalino.'
              : 'Componente metabólico neutro: qualquer desvio do pH é de origem respiratória.',
        ],
      }
    },
    formula: [
      'HCO₃⁻ = 0,0301 × PaCO₂ × 10^(pH − 6,1)',
      'SBE = 0,9287 × (HCO₃⁻ − 24,4 + 14,83 × (pH − 7,4))',
      'HCO₃⁻ padrão: resolvido a PaCO₂ = 40 mantendo o mesmo SBE',
    ],
    fundamento:
      'Bicarbonato padrão e excesso de base nasceram no laboratório de Copenhague de Siggaard-Andersen na década de 1960, com o mesmo propósito: descrever o componente metabólico de um distúrbio ácido-base sem contaminação respiratória. O bicarbonato padrão faz isso perguntando qual seria o bicarbonato a PaCO₂ de 40; o excesso de base faz perguntando quantos mEq de ácido ou base forte seriam necessários para trazer o pH a 7,40 com PaCO₂ em 40. A versão "padrão" do excesso de base (SBE) usa hemoglobina de 5 g/dL, que é a concentração da hemoglobina diluída em todo o líquido extracelular — sem isso o BE varia com a anemia, o que é indesejável.',
    armadilhas: [
      'O excesso de base é excelente para quantificar e péssimo para diagnosticar causa: um SBE de −10 pode ser lactato, cetoácido, cloro ou uremia, e só o ânion gap separa.',
      'Em distúrbios mistos, um SBE normal pode esconder acidose e alcalose metabólicas que se cancelam — motivo pelo qual a escola americana prefere bicarbonato e ânion gap ao BE.',
      'Aparelhos diferentes usam equações diferentes de BE (Van Slyke, Siggaard-Andersen, ecf). Comparar BE entre serviços exige saber qual foi usada.',
    ],
    referencias: [
      { texto: 'Siggaard-Andersen O. The van Slyke equation. Scand J Clin Lab Invest Suppl. 1977;146:15-20.' },
      { texto: 'Berend K. Diagnostic use of base excess in acid-base disorders. N Engl J Med. 2018;378(15):1419-1428.' },
      { texto: 'Davis JW, Parks SN, Kaups KL, Gladen HE, O’Donnell-Nicol S. Admission base deficit predicts transfusion requirements and risk of complications. J Trauma. 1996;41(5):769-774.' },
    ],
  },

  {
    id: 'pao2-fio2',
    nome: 'Relação PaO₂/FiO₂',
    sigla: 'P/F',
    sinonimos: ['pafi', 'p/f', 'relacao pao2 fio2', 'berlim', 'sdra'],
    resumo: 'Quantifica a oxigenação e classifica a SDRA pela definição de Berlim.',
    categorias: ['gasometria', 'pneumologia', 'emergencia'],
    campos: [
      campoNum('pao2', 'PaO₂', { unidade: 'mmHg', min: 20, max: 700, passo: 1, normalMin: 80, normalMax: 100 }),
      campoNum('fio2', 'FiO₂', { unidade: '%', min: 21, max: 100, passo: 1, padrao: '21' }),
      campoNum('peep', 'PEEP', { unidade: 'cmH₂O', min: 0, max: 30, passo: 1, opcional: true, ajuda: 'A definição de Berlim exige PEEP ou CPAP ≥ 5 cmH₂O para classificar SDRA.' }),
      campoNum('patm', 'Pressão barométrica local', { unidade: 'mmHg', min: 400, max: 800, passo: 1, padrao: '760', ajuda: 'Nível do mar = 760. Brasília ≈ 690; Campos do Jordão ≈ 640. Corrige a superestimativa em altitude.' }),
    ],
    calcular: (v) => {
      const pao2 = num(v, 'pao2')
      const fio2Pct = num(v, 'fio2')
      const peep = num(v, 'peep')
      const patm = numOu(v, 'patm', 760)
      if (pao2 === null || fio2Pct === null || fio2Pct <= 0) return null
      const fio2 = fio2Pct / 100
      const pf = pao2 / fio2
      const pfAltitude = pf * (patm / 760)
      const classificacao = pf > 300 ? 'Fora da faixa de SDRA' : pf > 200 ? 'SDRA leve' : pf > 100 ? 'SDRA moderada' : 'SDRA grave'
      const nivel: Nivel = pf > 300 ? 'ok' : pf > 200 ? 'atencao' : pf > 100 ? 'alerta' : 'critico'
      const alertas: string[] = []
      if (pf <= 300 && (peep === null || peep < 5))
        alertas.push('A definição de Berlim só classifica SDRA com PEEP ou CPAP ≥ 5 cmH₂O. Sem esse suporte, a relação é apenas um índice de oxigenação, não um critério diagnóstico.')
      if (pf <= 150) alertas.push('Relação ≤ 150 com FiO₂ ≥ 0,6 é o gatilho clássico para posição prona precoce e prolongada (≥ 16 h/dia), que reduziu mortalidade no estudo PROSEVA.')
      if (patm < 740) alertas.push(`Em altitude, a relação bruta superestima a gravidade. Corrigida para ${fmtInt(patm)} mmHg, ela vale ${fmtInt(pfAltitude)}.`)
      return {
        titulo: 'Relação PaO₂/FiO₂',
        valor: fmtInt(pf),
        nivel,
        rotuloNivel: classificacao,
        detalhes: [
          { rotulo: 'FiO₂ usada', valor: fmt(fio2, 2), nota: `${fmtInt(fio2Pct)}%` },
          { rotulo: 'Relação corrigida pela altitude', valor: fmtInt(pfAltitude), nota: `P/F × (Pbar/760), com Pbar = ${fmtInt(patm)} mmHg` },
          { rotulo: 'PEEP', valor: peep === null ? 'não informada' : `${fmtInt(peep)} cmH₂O` },
        ],
        interpretacao: [
          'A definição de Berlim (2012) exige quatro elementos simultâneos: início em até uma semana de um insulto conhecido ou piora respiratória; opacidades bilaterais na imagem não explicadas por derrame, colapso ou nódulos; insuficiência respiratória não explicada integralmente por insuficiência cardíaca ou sobrecarga de volume; e hipoxemia com P/F ≤ 300 sob PEEP ≥ 5.',
          'A nova definição global de SDRA (2023) ampliou o conceito para incluir pacientes em cateter nasal de alto fluxo (≥ 30 L/min) e permitir o uso da relação SpO₂/FiO₂ ≤ 315 quando a SpO₂ é ≤ 97% — mudança pensada para cenários sem gasometria disponível.',
        ],
        conduta: [
          'Confirme os **quatro critérios de Berlim** antes de rotular SDRA: início em até uma semana de insulto conhecido ou piora respiratória, opacidades bilaterais não explicadas por derrame, colapso ou nódulos, insuficiência respiratória não explicada por falência cardíaca ou sobrecarga hídrica, e relação PaO₂/FiO₂ medida com **PEEP ≥ 5 cmH₂O**. Sem a PEEP, a relação não classifica.',
          'Institua **ventilação protetora** imediatamente: volume corrente de 6 mL/kg de peso predito (calcule pela altura, não pelo peso real), pressão de platô ≤ 30 cmH₂O e driving pressure ≤ 15 cmH₂O — esta última é a variável que melhor se associa a mortalidade.',
          'Titule a PEEP por tabela PEEP-FiO₂ ou por driving pressure, e aceite **hipercapnia permissiva** em vez de violar os limites de pressão. Alvo de SpO₂ de 88 a 95%.',
          'Com relação **abaixo de 150**, considere **posição prona por 16 horas ou mais** (reduz mortalidade de forma robusta) e bloqueio neuromuscular nas primeiras 48 horas em casos selecionados. Abaixo de 80 com falha da otimização, avalie ECMO em centro de referência e calcule o escore RESP.',
          'Trate a causa da SDRA — pneumonia, aspiração, sepse, pancreatite, transfusão, trauma — e adote estratégia hídrica conservadora após a fase de ressuscitação: balanço positivo cumulativo piora oxigenação e prolonga a ventilação.',
          'Repita a relação após otimizar a PEEP: a classificação de gravidade deve ser feita com o paciente já em ventilação ajustada, não com os parâmetros iniciais.',
        ],
        alertas: alertas.length ? alertas : undefined,
        tabela: {
          titulo: 'Classificação de Berlim (com PEEP ≥ 5 cmH₂O)',
          colunas: ['PaO₂/FiO₂', 'Categoria', 'Mortalidade hospitalar aproximada'],
          linhas: [
            ['201 – 300', 'Leve', '27%'],
            ['101 – 200', 'Moderada', '32%'],
            ['≤ 100', 'Grave', '45%'],
          ],
          destaque: pf > 300 ? undefined : pf > 200 ? 0 : pf > 100 ? 1 : 2,
        },
      }
    },
    formula: ['P/F = PaO₂ (mmHg) ÷ FiO₂ (fração de 0 a 1)', 'Correção de altitude: P/F × (Pbar / 760)'],
    fundamento:
      'A relação é a maneira mais simples de perguntar "quanto oxigênio este pulmão entrega em relação ao que recebe". Um pulmão normal em ar ambiente entrega PaO₂ de 95 com FiO₂ de 0,21 — relação de aproximadamente 450. Quanto pior o shunt e o distúrbio de ventilação-perfusão, mais a PaO₂ despenca para a mesma FiO₂. O grande mérito da relação é a simplicidade; o grande defeito é depender de variáveis que não são do parênquima: PEEP, pressão de vias aéreas, débito cardíaco e pressão barométrica alteram a relação sem que a doença pulmonar tenha mudado.',
    armadilhas: [
      'A relação não é linear em FiO₂: o mesmo pulmão com shunt fixo dá relações diferentes em FiO₂ 0,4 e 1,0. Comparações seriadas só valem com FiO₂ e PEEP semelhantes.',
      'Em altitude, a PaO₂ é fisiologicamente menor. Sem a correção barométrica, La Paz classificaria como SDRA leve boa parte da população saudável.',
      'A FiO₂ de dispositivos de baixo fluxo (cateter nasal, máscara simples) é uma estimativa grosseira, que varia com o volume-minuto do paciente. Relação P/F calculada sobre FiO₂ estimada é orientativa, não diagnóstica.',
    ],
    referencias: [
      { texto: 'ARDS Definition Task Force. Acute respiratory distress syndrome: the Berlin Definition. JAMA. 2012;307(23):2526-2533.' },
      { texto: 'Matthay MA, Arabi Y, Arroliga AC, et al. A new global definition of acute respiratory distress syndrome. Am J Respir Crit Care Med. 2024;209(1):37-47.' },
      { texto: 'Guérin C, Reignier J, Richard JC, et al. Prone positioning in severe acute respiratory distress syndrome (PROSEVA). N Engl J Med. 2013;368(23):2159-2168.' },
    ],
  },

  {
    id: 'gradiente-alveolo-arterial',
    nome: 'Gradiente alvéolo-arterial de oxigênio',
    sigla: 'D(A-a)O₂',
    sinonimos: ['gradiente a-a', 'A-a', 'gradiente alveolo arterial'],
    resumo: 'Separa hipoxemia por doença do pulmão de hipoxemia por hipoventilação ou altitude.',
    categorias: ['gasometria', 'pneumologia'],
    campos: [
      campoNum('pao2', 'PaO₂ arterial', { ajuda: 'Pressão parcial arterial de oxigênio por gasometria — a oximetria de pulso não serve para este cálculo.', unidade: 'mmHg', min: 20, max: 700, passo: 1 }),
      campoNum('paco2', 'PaCO₂', { ajuda: 'Gás carbônico arterial da mesma amostra, usado na equação do gás alveolar com o quociente respiratório de 0,8.', unidade: 'mmHg', min: 5, max: 150, passo: 0.5 }),
      campoNum('fio2', 'FiO₂', { unidade: '%', min: 21, max: 100, passo: 1, padrao: '21' }),
      campoNum('idade', 'Idade', { unidade: 'anos', min: 0, max: 120, passo: 1 }),
      campoNum('patm', 'Pressão barométrica local', { ajuda: 'Pressão barométrica local: 760 mmHg ao nível do mar, cerca de 700 em São Paulo e 560 em La Paz. Ignorar a altitude infla o gradiente.', unidade: 'mmHg', min: 400, max: 800, passo: 1, padrao: '760' }),
      campoNum('r', 'Quociente respiratório (R)', { min: 0.6, max: 1, passo: 0.05, padrao: '0.8', ajuda: 'Dieta mista = 0,8. Dieta rica em carboidrato aproxima de 1,0.' }),
    ],
    calcular: (v) => {
      const pao2 = num(v, 'pao2')
      const paco2 = num(v, 'paco2')
      const fio2Pct = numOu(v, 'fio2', 21)
      const idade = num(v, 'idade')
      const patm = numOu(v, 'patm', PATM)
      const r = numOu(v, 'r', 0.8)
      if (pao2 === null || paco2 === null) return null
      const fio2 = fio2Pct / 100
      const pAlv = pAO2(fio2, paco2, patm, r)
      const grad = pAlv - pao2
      const esperado = idade !== null ? idade / 4 + 4 : null
      const alargado = esperado !== null ? grad > esperado : grad > 15
      const detalhes: Resultado['detalhes'] = [
        { rotulo: 'PAO₂ (pressão alveolar de O₂)', valor: `${fmt(pAlv, 1)} mmHg`, nota: `FiO₂ × (${fmtInt(patm)} − 47) − PaCO₂/${fmt(r, 2)}` },
        { rotulo: 'PaO₂ (arterial)', valor: `${fmt(pao2, 1)} mmHg` },
      ]
      if (esperado !== null)
        detalhes.push({ rotulo: 'Gradiente esperado para a idade', valor: `${fmt(esperado, 1)} mmHg`, nota: '(idade ÷ 4) + 4 — válido em ar ambiente' })
      detalhes.push({
        rotulo: 'Relação a/A',
        valor: fmt(pao2 / pAlv, 2),
        nota: 'Abaixo de 0,75 indica troca comprometida; é menos sensível à FiO₂ do que o gradiente absoluto.',
      })
      return {
        titulo: 'Gradiente A-a',
        valor: fmt(grad, 1),
        unidade: 'mmHg',
        nivel: alargado ? (grad > 50 ? 'critico' : 'alerta') : 'ok',
        rotuloNivel: alargado ? 'Alargado' : 'Normal para a idade',
        detalhes,
        interpretacao: [
          alargado
            ? '**Gradiente alargado.** A hipoxemia vem do pulmão. Quatro mecanismos, em ordem de frequência: distúrbio de ventilação-perfusão (asma, DPOC, pneumonia, TEP), shunt verdadeiro (SDRA, atelectasia, fístula arteriovenosa, forame oval), distúrbio de difusão (fibrose, enfisema) e — raramente — baixa PvO₂ por débito cardíaco muito baixo. A resposta ao O₂ separa: shunt verdadeiro melhora pouco com FiO₂ alta, distúrbio V/Q melhora bem.'
            : '**Gradiente normal.** A troca alvéolo-capilar está preservada, então a hipoxemia, se existe, vem de fora do parênquima: hipoventilação (opioide, sedativo, doença neuromuscular, obesidade-hipoventilação) ou baixa PiO₂ (altitude, mistura gasosa pobre). Nesses casos a PaCO₂ está tipicamente elevada e a correção é ventilatória, não de oxigênio.',
          'A subida do gradiente com a idade é fisiológica: a heterogeneidade V/Q aumenta com o envelhecimento pulmonar. Por isso um gradiente de 22 é normal aos 72 anos e claramente anormal aos 20.',
        ],
        conduta: [
          'Com gradiente **normal** e hipoxemia, o pulmão está preservado: procure **hipoventilação** (opioide, benzodiazepínico, doença neuromuscular, obesidade-hipoventilação, lesão de tronco) — confirme com a PaCO₂ elevada — ou **baixa PiO₂** por altitude ou mistura gasosa inadequada. A conduta é reverter a causa da hipoventilação e dar suporte ventilatório, não apenas oxigênio.',
          'Com gradiente **alargado**, use o **teste do oxigênio a 100%** para separar os mecanismos: correção da hipoxemia aponta distúrbio de ventilação-perfusão; hipoxemia que persiste apesar de FiO₂ alta aponta **shunt verdadeiro**, que não responde a oxigênio e exige recrutamento, PEEP ou tratamento da causa anatômica.',
          'Ordene a investigação por frequência e gravidade: distúrbio V/Q (asma, DPOC, pneumonia), embolia pulmonar (aplique Wells ou Genebra — gradiente alargado com radiografia normal é achado clássico), shunt (SDRA, atelectasia, fístula arteriovenosa, forame oval patente) e distúrbio de difusão (fibrose, enfisema).',
          'Compare com o esperado **para a idade**: o gradiente sobe fisiologicamente com o envelhecimento pulmonar, e 22 mmHg é normal aos 72 anos e claramente anormal aos 20. Usar um corte fixo de 10 ou 15 mmHg superdiagnostica idosos.',
          'Confira a FiO₂ realmente entregue antes de concluir. Em cateter nasal e máscara simples, a FiO₂ é estimada e varia com o padrão ventilatório — o gradiente calculado sobre uma FiO₂ inventada não significa nada.',
        ],
        alertas:
          fio2 > 0.5
            ? ['Com FiO₂ elevada, o gradiente A-a sobe fisiologicamente (até 100 a 150 mmHg em FiO₂ de 1,0), porque o oxigênio alto abole a vasoconstrição hipóxica e desmascara áreas de shunt. Nessa faixa, prefira a relação PaO₂/FiO₂ ou a relação a/A.']
            : undefined,
      }
    },
    formula: [
      'PAO₂ = FiO₂ × (Pbar − 47) − PaCO₂ / R',
      'D(A-a)O₂ = PAO₂ − PaO₂',
      'Esperado em ar ambiente = (idade ÷ 4) + 4',
    ],
    fundamento:
      'A equação do gás alveolar calcula quanto oxigênio deveria haver no alvéolo depois de descontadas duas coisas: o vapor d’água que satura o ar inspirado a 37 °C (47 mmHg) e o CO₂ que o sangue devolve ao alvéolo, ajustado pelo quociente respiratório. Comparar esse valor teórico com a PaO₂ real mede a eficiência da transferência. Um gradiente normal com hipoxemia significa que o alvéolo também tem pouco O₂ — o problema está antes do pulmão. Um gradiente alargado significa que o alvéolo tinha oxigênio e ele não chegou ao sangue.',
    armadilhas: [
      'Usar 0,21 como FiO₂ em paciente com cateter nasal invalida o cálculo: qualquer suplementação eleva a PAO₂ e o gradiente calculado.',
      'O gradiente normal para a idade só vale em ar ambiente e em decúbito dorsal — em pé, o valor é discretamente menor.',
      'Em altitude, use a pressão barométrica local. Aplicar 760 mmHg em Bogotá produz um gradiente falsamente alargado em pessoa saudável.',
    ],
    referencias: [
      { texto: 'Riley RL, Cournand A. Ideal alveolar air and the analysis of ventilation-perfusion relationships in the lungs. J Appl Physiol. 1949;1(12):825-847.' },
      { texto: 'Mellemgaard K. The alveolar-arterial oxygen difference: its size and components in normal man. Acta Physiol Scand. 1966;67(1):10-20.' },
    ],
  },

  {
    id: 'conteudo-arterial-oxigenio',
    nome: 'Conteúdo arterial de oxigênio',
    sigla: 'CaO₂',
    sinonimos: ['cao2', 'conteudo de oxigenio', 'transporte de oxigenio'],
    resumo: 'Mostra por que a hemoglobina, e não a PaO₂, é quem carrega o oxigênio.',
    categorias: ['gasometria', 'emergencia'],
    campos: [
      campoNum('hb', 'Hemoglobina', { ajuda: 'Hemoglobina em g/dL. Ela responde por cerca de 98% do conteúdo — é a variável que mais muda o resultado.', unidade: 'g/dL', min: 1, max: 25, passo: 0.1, normalMin: 12, normalMax: 17 }),
      campoNum('sao2', 'SaO₂', { ajuda: 'Saturação arterial. Em intoxicação por monóxido de carbono ou metemoglobinemia, use co-oximetria: a oximetria de pulso mente.', unidade: '%', min: 30, max: 100, passo: 0.1, padrao: '97', normalMin: 95, normalMax: 100 }),
      campoNum('pao2', 'PaO₂', { unidade: 'mmHg', min: 20, max: 700, passo: 1, padrao: '95' }),
      campoNum('svo2', 'SvO₂ (venosa mista ou central)', { unidade: '%', min: 20, max: 100, passo: 0.1, opcional: true, ajuda: 'Opcional — habilita o cálculo da diferença arteriovenosa e da taxa de extração.' }),
      campoNum('pvo2', 'PvO₂', { unidade: 'mmHg', min: 10, max: 100, passo: 1, padrao: '40', opcional: true }),
    ],
    calcular: (v) => {
      const hb = num(v, 'hb')
      const sao2 = num(v, 'sao2')
      const pao2 = num(v, 'pao2')
      const svo2 = num(v, 'svo2')
      const pvo2 = numOu(v, 'pvo2', 40)
      if (hb === null || sao2 === null || pao2 === null) return null
      const ligado = 1.34 * hb * (sao2 / 100)
      const dissolvido = 0.0031 * pao2
      const cao2 = ligado + dissolvido
      const detalhes: Resultado['detalhes'] = [
        { rotulo: 'O₂ ligado à hemoglobina', valor: `${fmt(ligado, 2)} mL/dL`, nota: `${fmt((ligado / cao2) * 100, 1)}% do total` },
        { rotulo: 'O₂ dissolvido no plasma', valor: `${fmt(dissolvido, 3)} mL/dL`, nota: `${fmt((dissolvido / cao2) * 100, 1)}% do total — a PaO₂ contribui quase nada para o transporte` },
      ]
      const interp: string[] = [
        'Cada grama de hemoglobina totalmente saturada carrega 1,34 mL de O₂ (a constante de Hüfner). O oxigênio dissolvido no plasma segue a lei de Henry e responde por menos de 2% do conteúdo em condições normais — é por isso que anemia grave compromete o transporte de oxigênio muito mais do que hipoxemia moderada.',
      ]
      if (svo2 !== null) {
        const cvo2 = 1.34 * hb * (svo2 / 100) + 0.0031 * pvo2
        const dav = cao2 - cvo2
        const to2 = (dav / cao2) * 100
        detalhes.push({ rotulo: 'CvO₂ (conteúdo venoso)', valor: `${fmt(cvo2, 2)} mL/dL` })
        detalhes.push({ rotulo: 'Diferença arteriovenosa C(a-v)O₂', valor: `${fmt(dav, 2)} mL/dL`, nota: 'Referência 3,5 a 5,5 mL/dL. Acima de 5,5 sugere débito cardíaco insuficiente para a demanda.' })
        detalhes.push({
          rotulo: 'Taxa de extração de O₂',
          valor: `${fmt(to2, 1)}%`,
          nota: 'Referência 22 a 30%. Acima de 30% indica que o tecido está compensando entrega baixa aumentando a extração — reserva prestes a acabar.',
          nivel: to2 > 35 ? 'alerta' : to2 > 30 ? 'atencao' : 'ok',
        })
        interp.push(
          to2 > 30
            ? 'Extração de oxigênio elevada: a entrega já não acompanha o consumo e o organismo está sacando da reserva venosa. É o estágio que precede o metabolismo anaeróbio e a hiperlactatemia.'
            : 'Extração de oxigênio dentro da faixa — a relação entre entrega e consumo está preservada.',
        )
      }
      const nivel: Nivel = cao2 < 12 ? 'critico' : cao2 < 16 ? 'alerta' : 'ok'
      interp.push('O cálculo deixa evidente que **a hemoglobina carrega quase todo o oxigênio**: cerca de 98% do conteúdo vem da fração ligada e apenas 2% da dissolvida. Por isso corrigir anemia grave aumenta muito mais a oferta do que elevar a pressão parcial de oxigênio de 80 para 120 mmHg.')
      interp.push('Em intoxicação por **monóxido de carbono** e em **metemoglobinemia**, a oximetria de pulso mente e o conteúdo real fica muito abaixo do calculado pela saturação convencional. Só a co-oximetria informa o conteúdo verdadeiro.')
      return {
        titulo: 'Conteúdo arterial de O₂',
        valor: fmt(cao2, 2),
        unidade: 'mL O₂/dL',
        nivel,
        rotuloNivel: cao2 < 12 ? 'Muito reduzido' : cao2 < 16 ? 'Reduzido' : 'Adequado (referência 18 a 20)',
        detalhes,
        conduta: [
          'O cálculo mostra na prática que **a hemoglobina carrega quase todo o oxigênio**: cerca de 98% do conteúdo vem do oxigênio ligado (1,34 × hemoglobina × saturação) e apenas 2% da fração dissolvida (0,003 × pressão parcial). Por isso corrigir anemia grave aumenta muito mais a oferta do que subir a pressão parcial de oxigênio de 80 para 120 mmHg.',
          'Diante de hipóxia tecidual com saturação normal, olhe para a **hemoglobina**: um paciente com hemoglobina de 6 g/dL e saturação de 100% tem conteúdo arterial menor que um com hemoglobina de 12 g/dL e saturação de 90%. Essa é a justificativa fisiológica da transfusão, que deve ser decidida por sinais de má perfusão e não apenas por um limiar numérico — o gatilho restritivo de 7 g/dL (8 g/dL em síndrome coronariana e cirurgia cardíaca) tem melhor desfecho na maioria dos cenários.',
          'Em **intoxicação por monóxido de carbono**, a saturação do oximetria de pulso é falsamente normal porque o aparelho não distingue carboxi-hemoglobina de oxi-hemoglobina. Meça **co-oximetria** e trate com oxigênio a 100% em máscara não reinalante (ou câmara hiperbárica em casos graves) — o conteúdo real está muito abaixo do calculado pela saturação convencional.',
          'Em **metemoglobinemia**, o mesmo problema ocorre com saturação travada em torno de 85% e sangue achocolatado que não clareia com oxigênio. O antídoto é **azul de metileno 1–2 mg/kg IV**, contraindicado em deficiência de glicose-6-fosfato desidrogenase, em que se usa vitamina C ou exsanguíneotransfusão.',
          'Combine com **débito cardíaco** para calcular a oferta sistêmica de oxigênio e com a **saturação venosa central** para saber se a oferta está sendo suficiente para o consumo. Conteúdo arterial adequado com saturação venosa baixa significa débito insuficiente ou consumo excessivo — e a intervenção é hemodinâmica, não ventilatória.',
        ],
        interpretacao: interp,
        alertas: [
          'Na intoxicação por monóxido de carbono, a SaO₂ do oxímetro de pulso e a PaO₂ ficam normais enquanto o conteúdo real despenca — a carboxi-hemoglobina ocupa o sítio e não é distinguida pelo oxímetro convencional. Só a co-oximetria revela.',
        ],
      }
    },
    formula: ['CaO₂ = (1,34 × Hb × SaO₂) + (0,0031 × PaO₂)', 'C(a-v)O₂ = CaO₂ − CvO₂', 'TEO₂ = C(a-v)O₂ / CaO₂'],
    fundamento:
      'A confusão mais comum da oxigenação é tratar PaO₂ como sinônimo de oxigênio disponível. PaO₂ é pressão parcial — mede a tendência do gás a se dissolver, não a quantidade transportada. Quem transporta é a hemoglobina, e a conta mostra a desproporção: com hemoglobina de 15 e saturação de 100%, o sangue carrega 20 mL de O₂ por decilitro; a mesma amostra com PaO₂ de 500 mmHg acrescenta apenas 1,5 mL dissolvido. Cair a hemoglobina de 15 para 7,5 corta o transporte pela metade, algo que nenhuma PaO₂ compensa.',
    armadilhas: [
      'A constante de Hüfner aparece como 1,34, 1,36 ou 1,39 mL/g conforme a fonte; a diferença é de 4% e não muda decisão clínica, mas explica pequenas divergências entre calculadoras.',
      'A oxigenoterapia hiperbárica funciona justamente explorando a parcela dissolvida: a 3 atmosferas, o O₂ dissolvido chega a cerca de 6 mL/dL, suficiente para sustentar o metabolismo basal sem hemoglobina funcionante.',
    ],
    referencias: [
      { texto: 'Vincent JL, De Backer D. Circulatory shock. N Engl J Med. 2013;369(18):1726-1734.' },
      { texto: 'Leach RM, Treacher DF. The pulmonary physician in critical care 2: oxygen delivery and consumption in the critically ill. Thorax. 2002;57(2):170-177.' },
    ],
  },

  {
    id: 'oferta-oxigenio',
    nome: 'Oferta sistêmica de oxigênio',
    sigla: 'DO₂',
    sinonimos: ['do2', 'oferta de oxigenio', 'delivery', 'vo2'],
    resumo: 'Une débito cardíaco e conteúdo arterial — a variável final da perfusão.',
    categorias: ['gasometria', 'emergencia'],
    campos: [
      campoNum('dc', 'Débito cardíaco', { unidade: 'L/min', min: 0.5, max: 20, passo: 0.1, normalMin: 4, normalMax: 8 }),
      campoNum('hb', 'Hemoglobina', { ajuda: 'Hemoglobina em g/dL — uma das três alavancas independentes da oferta, junto com débito e saturação.', unidade: 'g/dL', min: 1, max: 25, passo: 0.1 }),
      campoNum('sao2', 'SaO₂', { unidade: '%', min: 30, max: 100, passo: 0.1, padrao: '97' }),
      campoNum('pao2', 'PaO₂', { unidade: 'mmHg', min: 20, max: 700, passo: 1, padrao: '95' }),
      campoNum('sc', 'Superfície corporal', { unidade: 'm²', min: 0.2, max: 3.5, passo: 0.01, opcional: true, ajuda: 'Opcional — permite indexar a oferta.' }),
      campoNum('svo2', 'SvO₂', { unidade: '%', min: 20, max: 100, passo: 0.1, opcional: true, ajuda: 'Opcional — permite estimar o consumo (VO₂) pelo princípio de Fick.' }),
    ],
    calcular: (v) => {
      const dc = num(v, 'dc')
      const hb = num(v, 'hb')
      const sao2 = num(v, 'sao2')
      const pao2 = numOu(v, 'pao2', 95)
      const sc = num(v, 'sc')
      const svo2 = num(v, 'svo2')
      if (dc === null || hb === null || sao2 === null) return null
      const cao2 = 1.34 * hb * (sao2 / 100) + 0.0031 * pao2
      const do2 = dc * cao2 * 10
      const detalhes: Resultado['detalhes'] = [
        { rotulo: 'CaO₂', valor: `${fmt(cao2, 2)} mL/dL` },
        { rotulo: 'Referência de DO₂', valor: '950 a 1150 mL/min' },
      ]
      if (sc !== null && sc > 0) {
        detalhes.push({ rotulo: 'Índice de oferta (DO₂I)', valor: `${fmtInt(do2 / sc)} mL/min/m²`, nota: 'Referência 500 a 600 mL/min/m²' })
        detalhes.push({ rotulo: 'Índice cardíaco', valor: `${fmt(dc / sc, 2)} L/min/m²`, nota: 'Referência 2,5 a 4,0' })
      }
      const interp: string[] = [
        'A oferta de oxigênio é o produto de três coisas que podem falhar independentemente: bomba (débito cardíaco), carregador (hemoglobina) e carga (saturação). Choque é, no fundo, oferta insuficiente para a demanda — e por isso existem quatro tipos, cada um atacando um elo diferente: cardiogênico e obstrutivo derrubam o débito, hipovolêmico derruba débito e conteúdo, distributivo mantém a oferta global mas impede a extração tecidual.',
      ]
      if (svo2 !== null) {
        const cvo2 = 1.34 * hb * (svo2 / 100) + 0.0031 * 40
        const vo2 = dc * (cao2 - cvo2) * 10
        detalhes.push({ rotulo: 'VO₂ (consumo, por Fick)', valor: `${fmtInt(vo2)} mL/min`, nota: 'Referência 200 a 300 mL/min em repouso' })
        detalhes.push({
          rotulo: 'Relação VO₂/DO₂ (extração global)',
          valor: `${fmt((vo2 / do2) * 100, 1)}%`,
          nota: 'Referência 20 a 30%. Acima de 30% indica dependência da oferta — o consumo já está limitado pela entrega.',
          nivel: vo2 / do2 > 0.35 ? 'alerta' : 'ok',
        })
        interp.push(
          'Em condições normais o consumo é independente da oferta: se a oferta cai, a extração sobe e o VO₂ se mantém. Abaixo de um limiar crítico de DO₂ (aproximadamente 300 a 330 mL/min/m²) a extração satura, o consumo passa a cair junto com a oferta e o metabolismo anaeróbio começa — é exatamente aí que o lactato sobe.',
        )
      }
      interp.push('Compare a oferta com o **consumo**: a taxa de extração fisiológica é de 20 a 30%. Extração acima de 50 a 60% significa que a oferta está no limite, e qualquer aumento de demanda precipitará metabolismo anaeróbio.')
      interp.push('Saturação venosa central **acima de 80%** com lactato alto não é boa notícia: aponta falha de extração (sepse, intoxicação por cianeto) ou shunt microcirculatório, em que aumentar a oferta não resolve o problema.')
      return {
        titulo: 'Oferta sistêmica de O₂',
        valor: fmtInt(do2),
        unidade: 'mL/min',
        nivel: do2 < 600 ? 'critico' : do2 < 850 ? 'alerta' : 'ok',
        rotuloNivel: do2 < 600 ? 'Criticamente baixa' : do2 < 850 ? 'Reduzida' : 'Adequada',
        detalhes,
        conduta: [
          'A oferta sistêmica (**DO₂ = débito cardíaco × conteúdo arterial × 10**) tem valor normal de 900–1.100 mL/min (500–600 mL/min/m² indexada). Ela pode ser corrigida por três alavancas independentes: **débito cardíaco, hemoglobina e saturação arterial**. Identifique qual está deficitária antes de intervir — cada uma tem tratamento distinto e a errada não funciona.',
          'Compare a oferta com o **consumo (VO₂)**, normalmente 200–250 mL/min: a taxa de extração fisiológica é de 20–30%. Extração acima de 50–60% significa que a oferta está no limite e qualquer aumento de demanda precipitará metabolismo anaeróbio — é o sinal de que se está próximo do ponto crítico de dependência.',
          'A **saturação venosa central (ScvO₂) é o substituto prático à beira do leito**: abaixo de 65–70% indica oferta insuficiente para a demanda. Acima de 80% em paciente com lactato alto aponta falha de extração (sepse, intoxicação por cianeto) ou shunt microcirculatório, em que aumentar a oferta não resolve.',
          'Não persiga **oferta supranormal**. Os ensaios que tentaram elevar a DO₂ acima de valores fisiológicos com inotrópicos em pacientes já estabelecidos em choque aumentaram mortalidade — a otimização precoce é útil, a hiperoferta tardia é danosa.',
          'Reduza a **demanda** quando não for possível aumentar a oferta: trate febre, dor, agitação e desconforto respiratório. Sedação, analgesia, controle térmico e, em casos extremos, bloqueio neuromuscular e ventilação mecânica reduzem substancialmente o consumo — o trabalho respiratório sozinho pode consumir de 20 a 30% do oxigênio total em insuficiência respiratória grave.',
        ],
        interpretacao: interp,
        alertas: [
          'Elevar a oferta de oxigênio a valores supranormais como meta terapêutica foi testado e não reduz mortalidade — em alguns cenários piora. A oferta serve para entender o mecanismo do choque, não como alvo a ser perseguido isoladamente.',
        ],
      }
    },
    formula: ['DO₂ = DC × CaO₂ × 10', 'DO₂I = DO₂ ÷ superfície corporal', 'VO₂ = DC × C(a-v)O₂ × 10'],
    fundamento:
      'O fator 10 converte mL de O₂ por decilitro em mL por litro, para casar com o débito cardíaco em litros por minuto. A equação organiza o raciocínio de choque melhor do que qualquer classificação: diante de hiperlactatemia, pergunte qual dos três fatores está comprometido — e se nenhum estiver, o problema é de extração tecidual, isto é, distributivo, e o tratamento é a causa da vasoplegia, não mais volume.',
    armadilhas: [
      'Oferta global normal não garante perfusão regional adequada. Na sepse, o shunt microcirculatório mantém a SvO₂ alta enquanto o tecido sofre — SvO₂ elevada com lactato alto é sinal de doença grave, não de tranquilidade.',
      'O débito cardíaco medido por termodiluição sofre com regurgitação tricúspide e com shunt intracardíaco.',
    ],
    referencias: [
      { texto: 'Vincent JL, De Backer D. Circulatory shock. N Engl J Med. 2013;369(18):1726-1734.' },
      { texto: 'Ronco JJ, Fenwick JC, Tweeddale MG, et al. Identification of the critical oxygen delivery for anaerobic metabolism in critically ill septic and nonseptic humans. JAMA. 1993;270(14):1724-1730.' },
    ],
  },

  {
    id: 'conversor-fio2',
    nome: 'Conversor de fluxo de O₂ para FiO₂ estimada',
    sinonimos: ['fio2 cateter nasal', 'venturi', 'mascara de oxigenio', 'fluxo para fio2'],
    resumo: 'Traduz cada dispositivo de oxigenoterapia na fração inspirada que ele realmente entrega.',
    categorias: ['gasometria', 'pneumologia', 'emergencia'],
    campos: [
      campoSeg('dispositivo', 'Dispositivo', [
        { valor: 'cateter', rotulo: 'Cateter nasal' },
        { valor: 'mascara', rotulo: 'Máscara simples' },
        { valor: 'reservatorio', rotulo: 'Máscara com reservatório' },
        { valor: 'venturi', rotulo: 'Venturi' },
      ], { ajuda: 'Cateter nasal e máscara simples entregam FiO₂ variável, dependente do padrão ventilatório; Venturi e alto fluxo entregam FiO₂ conhecida e estável.' }),
      campoNum('fluxo', 'Fluxo de O₂', {
        unidade: 'L/min',
        min: 0.5,
        max: 60,
        passo: 0.5,
        padrao: '2',
        mostrarSe: (v) => opc(v, 'dispositivo') !== 'venturi',
      }),
      campoSeg('venturi', 'Cor do Venturi', [
        { valor: '24', rotulo: 'Azul 24%' },
        { valor: '28', rotulo: 'Amarelo 28%' },
        { valor: '35', rotulo: 'Verde 35%' },
        { valor: '50', rotulo: 'Laranja 50%' },
      ], { ajuda: 'A cor da peça define a FiO₂ fixa e o fluxo mínimo exigido. Use Venturi quando a precisão importar — sobretudo no retentor crônico, com alvo de 88 a 92%.', mostrarSe: (v) => opc(v, 'dispositivo') === 'venturi' }),
      campoNum('vm', 'Volume-minuto do paciente', {
        unidade: 'L/min',
        min: 3,
        max: 40,
        passo: 0.5,
        padrao: '8',
        opcional: true,
        ajuda: 'Só afeta dispositivos de baixo fluxo. Volume-minuto alto dilui mais o O₂ com ar ambiente e reduz a FiO₂ real.',
      }),
    ],
    calcular: (v) => {
      const disp = opc(v, 'dispositivo')
      const fluxo = num(v, 'fluxo')
      const vm = numOu(v, 'vm', 8)
      let fio2 = 21
      let faixa = ''
      let nota = ''
      let baixoFluxo = true

      if (disp === 'venturi') {
        fio2 = Number(opc(v, 'venturi') || '24')
        faixa = `${fio2}% fixos`
        baixoFluxo = false
        nota = 'O Venturi é de alto fluxo: o jato de O₂ arrasta um volume fixo de ar ambiente pelo efeito Bernoulli, e a FiO₂ resultante independe do padrão respiratório. É o dispositivo de escolha no retentor crônico de CO₂ justamente por essa previsibilidade.'
      } else if (disp === 'cateter') {
        if (fluxo === null) return null
        const f = Math.min(fluxo, 6)
        fio2 = 21 + 4 * f
        faixa = `${fmtInt(Math.max(21, fio2 - 6))}% a ${fmtInt(Math.min(50, fio2 + 6))}%`
        nota = 'Regra clássica: cada litro por minuto acrescenta cerca de 4 pontos percentuais, até 6 L/min. Acima disso a mucosa resseca e a FiO₂ pouco sobe — se precisar de mais, troque o dispositivo.'
      } else if (disp === 'mascara') {
        if (fluxo === null) return null
        if (fluxo < 5) nota = '⚠ Máscara simples exige no mínimo 5 L/min para lavar o CO₂ exalado do interior da máscara. Abaixo disso há reinalação.'
        fio2 = Math.min(60, 35 + (fluxo - 5) * 5)
        faixa = '35% a 60%'
        nota += ' A faixa real de uma máscara simples é 35 a 60%, com variação grande conforme o vedamento e o volume-minuto.'
      } else {
        if (fluxo === null) return null
        fio2 = Math.min(95, 60 + (fluxo - 10) * 3.5)
        if (fluxo >= 15) fio2 = 90
        faixa = '60% a 95%'
        nota = 'A máscara com reservatório (não reinalante) só atinge FiO₂ alta se o reservatório permanecer cheio durante toda a inspiração — na prática exige 10 a 15 L/min e vedamento bom. Reservatório colapsando na inspiração significa fluxo insuficiente.'
      }

      const detalhes: Resultado['detalhes'] = [
        { rotulo: 'Faixa típica do dispositivo', valor: faixa },
        { rotulo: 'FiO₂ como fração', valor: fmt(fio2 / 100, 2) },
      ]
      if (baixoFluxo && fluxo !== null) {
        const fio2Vm = Math.min(100, ((fluxo * 1 + (vm - fluxo) * 0.21) / vm) * 100)
        detalhes.push({
          rotulo: `FiO₂ estimada para volume-minuto de ${fmt(vm, 1)} L/min`,
          valor: `${fmtInt(Math.max(21, fio2Vm))}%`,
          nota: 'Balanço de massa entre o O₂ ofertado e o ar ambiente arrastado. Mostra por que o mesmo cateter a 3 L/min entrega muito menos O₂ ao paciente taquipneico.',
        })
      }
      return {
        titulo: 'FiO₂ estimada',
        valor: fmtInt(fio2),
        unidade: '%',
        nivel: 'neutro',
        rotuloNivel: baixoFluxo ? 'Dispositivo de baixo fluxo — estimativa' : 'Dispositivo de alto fluxo — FiO₂ previsível',
        detalhes,
        conduta: [
          'Trate a FiO₂ estimada como **aproximação, não medida**. A regra prática (cerca de 4% por litro de cateter nasal acima dos 21% do ar ambiente) pressupõe padrão ventilatório e volume-minuto estáveis: o paciente taquipneico arrasta mais ar ambiente e diluti mais, recebendo FiO₂ bem menor que a calculada.',
          'Escolha o dispositivo pela FiO₂ que precisa entregar: **cateter nasal** até cerca de 6 L/min (40–45%), **máscara simples** 5–10 L/min (40–60%), **máscara com reservatório não reinalante** 10–15 L/min (60–90%), **máscara de Venturi** para FiO₂ fixa e conhecida (24–50%), e **cânula nasal de alto fluxo** para FiO₂ confiável até 100% com fluxo de 30–60 L/min.',
          'Use **Venturi** quando a precisão importar — especialmente em retentor crônico de gás carbônico, em que se busca saturação de 88–92% e a entrega imprevisível do cateter pode gerar hiperóxia e piora da hipercapnia por efeito Haldane e perda do estímulo hipóxico.',
          'Prefira a **cânula de alto fluxo** na insuficiência respiratória hipoxêmica não hipercápnica: ela oferece FiO₂ estável, lavagem do espaço morto nasofaríngeo, discreta pressão positiva e gás aquecido e umidificado, e reduziu intubação em comparação ao oxigênio convencional. Monitore com o **índice ROX** para detectar falência antes que ela vire intubação de emergência.',
          'Titule pela **meta de saturação**, não pelo fluxo máximo: 94–98% na maioria dos pacientes e 88–92% no retentor de gás carbônico. A hiperóxia liberal aumenta mortalidade em pacientes críticos, em parada cardíaca recuperada e em acidente vascular cerebral — dar oxigênio \'por segurança\' a quem está saturando bem é intervenção com dano demonstrado.',
        ],
        interpretacao: [
          nota,
          baixoFluxo
            ? 'Dispositivos de baixo fluxo entregam menos gás do que o paciente inspira; o restante é ar ambiente arrastado. Como o volume inspiratório varia a cada respiração, a FiO₂ real varia junto — a estimativa serve para ajustar o tratamento, não para calcular relação P/F com precisão diagnóstica.'
            : 'Dispositivos de alto fluxo entregam gás em fluxo superior ao pico inspiratório do paciente, então a FiO₂ programada é a FiO₂ recebida.',
        ],
        alertas: [
          'No retentor crônico de CO₂, o alvo de saturação é 88 a 92%. O excesso de oxigênio eleva a PaCO₂ por perda da vasoconstrição pulmonar hipóxica, efeito Haldane e redução do drive — e a mortalidade sobe.',
          'Cateter nasal de alto fluxo (CNAF) não entra nesta tabela: nele a FiO₂ é programada diretamente no blender, entre 21 e 100%, com fluxo de 30 a 60 L/min.',
        ],
      }
    },
    formula: [
      'Cateter nasal: FiO₂ ≈ 21 + (4 × fluxo em L/min), até 6 L/min',
      'Balanço de massa: FiO₂ = [fluxo×1,0 + (VM − fluxo)×0,21] / VM',
    ],
    fundamento:
      'A regra dos 4% por litro é uma média populacional derivada de estudos com volume-minuto em torno de 8 a 10 L/min e padrão respiratório calmo. A física por trás é simples: o paciente inspira um volume fixo por respiração e o dispositivo entrega um fluxo constante; o que falta é preenchido por ar ambiente. Se o paciente respira mais rápido ou mais fundo, o mesmo fluxo de O₂ é diluído num volume maior e a fração cai — o que explica a observação de plantão de que "o cateter parou de funcionar" justamente quando o paciente piorou.',
    armadilhas: [
      'Respiração pela boca reduz a FiO₂ do cateter nasal, mas menos do que se supõe: a nasofaringe continua sendo reservatório funcional.',
      'Calcular relação PaO₂/FiO₂ com FiO₂ estimada de cateter nasal produz números que não devem ser usados para classificar SDRA.',
      'Máscara simples com fluxo abaixo de 5 L/min causa reinalação de CO₂ — o dispositivo tem um piso, não só um teto.',
    ],
    referencias: [
      { texto: 'O’Driscoll BR, Howard LS, Earis J, Mak V. BTS guideline for oxygen use in adults in healthcare and emergency settings. Thorax. 2017;72(Suppl 1):ii1-ii90.' },
      { texto: 'Wettstein RB, Shelledy DC, Peters JI. Delivered oxygen concentrations using low-flow and high-flow nasal cannulas. Respir Care. 2005;50(5):604-609.' },
    ],
  },

  {
    id: 'correcao-temperatura-gasometria',
    nome: 'Correção da gasometria pela temperatura',
    sinonimos: ['alfa-stat', 'ph-stat', 'gasometria hipotermia', 'temperatura'],
    resumo: 'Converte os valores medidos a 37 °C para a temperatura real do paciente.',
    categorias: ['gasometria'],
    campos: [
      campoNum('temp', 'Temperatura do paciente', { ajuda: 'Temperatura central do paciente em °C — esofágica, vesical ou timpânica; a axilar subestima e invalida a correção.', unidade: '°C', min: 15, max: 43, passo: 0.1, padrao: '37', normalMin: 36, normalMax: 37.5 }),
      campoNum('ph', 'pH medido (a 37 °C)', { ajuda: 'pH informado pelo aparelho, que sempre mede a 37 °C independentemente da temperatura real do paciente.', min: 6.5, max: 8, passo: 0.01, padrao: '7.40' }),
      campoNum('paco2', 'PaCO₂ medida (a 37 °C)', { ajuda: 'Gás carbônico informado a 37 °C. Na hipotermia, o valor real é **menor** que o relatado.', unidade: 'mmHg', min: 5, max: 150, passo: 0.5, padrao: '40' }),
      campoNum('pao2', 'PaO₂ medida (a 37 °C)', { ajuda: 'Oxigênio informado a 37 °C. Na hipotermia, o valor real também é menor — e superestimá-lo leva a desmame de oxigênio precoce.', unidade: 'mmHg', min: 20, max: 700, passo: 1, padrao: '95' }),
    ],
    calcular: (v) => {
      const t = num(v, 'temp')
      const ph = num(v, 'ph')
      const paco2 = num(v, 'paco2')
      const pao2 = num(v, 'pao2')
      if (t === null || ph === null || paco2 === null || pao2 === null) return null
      const dt = t - 37
      const phC = ph - 0.0147 * dt
      const paco2C = paco2 * Math.pow(10, 0.019 * dt)
      const pao2C = pao2 * Math.pow(10, 0.0244 * dt)
      return {
        titulo: `Valores corrigidos para ${fmt(t, 1)} °C`,
        valor: fmt(phC, 2),
        unidade: 'pH',
        nivel: Math.abs(dt) >= 3 ? 'atencao' : 'neutro',
        rotuloNivel: dt < -0.5 ? 'Hipotermia' : dt > 0.5 ? 'Hipertermia' : 'Normotermia — correção desprezível',
        detalhes: [
          { rotulo: 'pH corrigido', valor: fmt(phC, 2), nota: `Variação de ${fmt(phC - ph, 3)} em relação ao medido` },
          { rotulo: 'PaCO₂ corrigida', valor: `${fmt(paco2C, 1)} mmHg`, nota: `Variação de ${fmt(paco2C - paco2, 1)} mmHg` },
          { rotulo: 'PaO₂ corrigida', valor: `${fmt(pao2C, 1)} mmHg`, nota: `Variação de ${fmt(pao2C - pao2, 1)} mmHg` },
          { rotulo: 'HCO₃⁻ (não depende da temperatura)', valor: `${fmt(hco3DeHH(ph, paco2), 1)} mEq/L`, nota: 'A concentração de bicarbonato é uma quantidade, não uma pressão — o aquecimento da amostra não a altera.' },
        ],
        conduta: [
          'Saiba qual estratégia o seu serviço adota: o **alfa-stat** interpreta os valores a 37 °C, sem corrigir pela temperatura real do paciente, e o **pH-stat** corrige. As duas produzem condutas ventilatórias opostas no paciente hipotérmico, e misturar os dois raciocínios é a fonte principal de erro.',
          'Use **alfa-stat na maioria dos adultos**, inclusive em circulação extracorpórea e hipotermia terapêutica: manter a carga elétrica constante das histidinas preserva a função enzimática, e essa estratégia associou-se a melhores desfechos neurológicos em adultos.',
          'Use **pH-stat em crianças submetidas a parada circulatória hipotérmica profunda**: a hipercapnia relativa que ele produz promove vasodilatação cerebral, melhora o resfriamento homogêneo do cérebro e mostrou melhor desfecho neurológico nessa população específica.',
          'Lembre-se do sentido das correções na hipotermia: o **pH real é mais alto** e as **pressões parciais de oxigênio e gás carbônico são mais baixas** que os valores informados a 37 °C. Ajustar a ventilação para \'normalizar\' um gás carbônico não corrigido leva a hiperventilação real e alcalose, com vasoconstrição cerebral.',
          'Na **hipertermia** o erro é inverso e igualmente perigoso: no paciente febril, o gás carbônico real é maior e o pH real menor do que o relatado. Em hipertermia maligna e em golpe de calor, esse desvio agrava a subestimação da acidose, justamente quando a hiperventilação compensatória é parte central do suporte.',
        ],
        interpretacao: [
          'O gasômetro sempre aquece a amostra a 37 °C antes de medir. Se o paciente estiver a 30 °C, os valores impressos não são os que existem no corpo dele: a solubilidade dos gases aumenta com o frio, então a PaCO₂ e a PaO₂ reais são **menores** do que as medidas, e o pH real é **maior**.',
          '**Alfa-stat versus pH-stat.** A estratégia alfa-stat interpreta a gasometria sem corrigir pela temperatura, aceitando que o pH "real" do hipotérmico seja alcalino — a lógica é preservar constante o estado de ionização do imidazol da histidina, e com ele a função enzimática. A estratégia pH-stat corrige e adiciona CO₂ para manter pH de 7,40 na temperatura real, aumentando o fluxo sanguíneo cerebral. Em circulação extracorpórea de adultos, alfa-stat é a prática predominante; em cirurgia cardíaca pediátrica com parada circulatória hipotérmica profunda, pH-stat mostrou melhores desfechos neurológicos.',
          'Na parada cardíaca com hipotermia acidental, a orientação prática é interpretar os valores não corrigidos (alfa-stat) e não postergar a ressuscitação por causa de números "ruins" — hipotermia grave é a situação em que a reanimação prolongada tem os melhores resultados neurológicos documentados.',
        ],
        alertas: Math.abs(dt) >= 5 ? ['Diferença de temperatura maior que 5 °C: a correção deixa de ser detalhe acadêmico e muda a leitura do distúrbio. Registre no prontuário qual estratégia foi adotada.'] : undefined,
      }
    },
    formula: [
      'pH(T) = pH(37) − 0,0147 × (T − 37)',
      'PaCO₂(T) = PaCO₂(37) × 10^[0,019 × (T − 37)]',
      'PaO₂(T) = PaO₂(37) × 10^[0,0244 × (T − 37)]',
    ],
    fundamento:
      'A solubilidade de um gás num líquido aumenta quando a temperatura cai. Resfriar o sangue faz mais CO₂ e mais O₂ passarem da fase gasosa para a dissolvida, reduzindo as pressões parciais sem mudar a quantidade total de gás. Como a dissociação da água também é dependente da temperatura, o pH neutro se desloca: a 37 °C a neutralidade está em 6,8, a 20 °C está perto de 7,1. Os coeficientes de correção foram determinados experimentalmente por Severinghaus e refinados depois; o do oxigênio é o menos confiável, porque varia com a saturação da hemoglobina.',
    armadilhas: [
      'Bicarbonato e excesso de base não se corrigem pela temperatura — são concentrações, não pressões parciais.',
      'Corrigir a gasometria e continuar usando as faixas de referência de 37 °C é o pior dos dois mundos: ou se usa alfa-stat com valores não corrigidos, ou se usa pH-stat com alvo de 7,40 na temperatura real.',
      'Em febre alta o efeito é inverso e costuma ser esquecido: a 40 °C, uma PaCO₂ medida de 40 corresponde a cerca de 43 mmHg reais.',
    ],
    referencias: [
      { texto: 'Severinghaus JW. Blood gas calculator. J Appl Physiol. 1966;21(3):1108-1116.' },
      { texto: 'Ashwood ER, Kost G, Kenny M. Temperature correction of blood-gas and pH measurements. Clin Chem. 1983;29(11):1877-1885.' },
      { texto: 'Lampe JW, Becker LB. State of the art in therapeutic hypothermia. Annu Rev Med. 2011;62:79-93.' },
    ],
  },

  {
    id: 'gasometria-venosa',
    nome: 'Conversor de gasometria venosa para arterial',
    sinonimos: ['gasometria venosa', 'venosa vs arterial', 'gaso venosa'],
    resumo: 'Estima os valores arteriais a partir de uma gasometria venosa periférica ou central.',
    categorias: ['gasometria', 'emergencia'],
    campos: [
      campoSeg('sitio', 'Sítio da coleta', [
        { valor: 'periferica', rotulo: 'Venosa periférica' },
        { valor: 'central', rotulo: 'Venosa central' },
      ]),
      campoNum('phv', 'pH venoso', { ajuda: 'pH da amostra venosa. Corresponde ao arterial com desvio de cerca de 0,03 a 0,05 para baixo.', min: 6.5, max: 8, passo: 0.01, padrao: '7.36' }),
      campoNum('paco2v', 'PCO₂ venosa', { ajuda: 'Gás carbônico venoso. Abaixo de 45 mmHg praticamente exclui hipercapnia arterial; acima disso, colha gasometria arterial antes de decidir ventilar.', unidade: 'mmHg', min: 5, max: 150, passo: 0.5, padrao: '45' }),
      campoNum('hco3v', 'HCO₃⁻ venoso', { ajuda: 'Bicarbonato venoso, que corresponde bem ao arterial (cerca de 1 a 2 mEq/L maior) e serve para conduzir cetoacidose sem punção arterial.', unidade: 'mEq/L', min: 1, max: 60, passo: 0.1, padrao: '24' }),
    ],
    calcular: (v) => {
      const sitio = opc(v, 'sitio')
      const ph = num(v, 'phv')
      const pco2 = num(v, 'paco2v')
      const hco3 = num(v, 'hco3v')
      if (ph === null || pco2 === null) return null
      const dPh = sitio === 'central' ? 0.03 : 0.035
      const dPco2 = sitio === 'central' ? 5 : 4.4
      const phA = ph + dPh
      const pco2A = pco2 - dPco2
      return {
        titulo: 'Estimativa arterial',
        valor: fmt(phA, 2),
        unidade: 'pH estimado',
        nivel: 'neutro',
        rotuloNivel: `A partir de gasometria venosa ${sitio === 'central' ? 'central' : 'periférica'}`,
        detalhes: [
          { rotulo: 'pH arterial estimado', valor: fmt(phA, 2), nota: `Venoso + ${fmt(dPh, 3)}` },
          { rotulo: 'PaCO₂ arterial estimada', valor: `${fmt(pco2A, 1)} mmHg`, nota: `Venosa − ${fmt(dPco2, 1)} mmHg (limite de concordância amplo: até ±10)` },
          { rotulo: 'HCO₃⁻', valor: hco3 === null ? '—' : `${fmt(hco3, 1)} mEq/L`, nota: 'O bicarbonato venoso e o arterial diferem cerca de 1 a 2 mEq/L — para fins clínicos, é o parâmetro mais intercambiável dos três.' },
        ],
        conduta: [
          'Use a gasometria **venosa** para o que ela é boa: **pH, bicarbonato, potássio, lactato e ânion gap** correlacionam-se bem com os valores arteriais. O pH venoso fica cerca de 0,03–0,05 unidade mais baixo e o bicarbonato 1–2 mEq/L mais alto — margens irrelevantes para a maioria das decisões clínicas.',
          '**Não use a venosa para avaliar oxigenação.** A pressão parcial de oxigênio venosa não tem relação útil com a arterial e não permite calcular relação PaO₂/FiO₂ nem gradiente alvéolo-arterial. Para oxigenação, use oximetria de pulso e, quando necessário, gasometria arterial.',
          'Em **cetoacidose diabética**, a venosa substitui a arterial com segurança em todo o seguimento: pH, bicarbonato, ânion gap e potássio são suficientes para conduzir o tratamento, e isso evita punções arteriais repetidas e dolorosas ao longo de horas.',
          'Interprete o **gás carbônico venoso como triagem**: abaixo de 45 mmHg praticamente exclui hipercapnia arterial significativa (valor preditivo negativo alto). Acima disso, ou em qualquer suspeita de insuficiência respiratória hipercápnica com decisão de ventilar em jogo, colha a **arterial** — a correlação individual do gás carbônico é ruim demais para titular ventilação.',
          'Colha a amostra **sem garrote prolongado e sem bombear a mão**: estase e contração muscular elevam potássio e lactato e reduzem o pH localmente, gerando acidose e hipercalemia falsas. A amostra deve seguir ao laboratório em gelo se houver atraso previsto acima de 15 minutos, pois o metabolismo celular continua no tubo e consome glicose enquanto produz lactato.',
        ],
        interpretacao: [
          'A gasometria venosa é adequada para responder três perguntas: há acidemia significativa, qual é o bicarbonato e qual é o ânion gap. Ela é inadequada para uma quarta: qual é a oxigenação — para isso, oximetria de pulso ou gasometria arterial.',
          'Para a PaCO₂, a concordância é boa em pacientes estáveis e ruim em choque e parada cardíaca: com fluxo baixo, o CO₂ se acumula no leito venoso e a diferença venoarterial se alarga muito (o gap venoarterial de CO₂ acima de 6 mmHg é, aliás, marcador de débito cardíaco insuficiente). Nesses cenários, a venosa subestima a gravidade arterial.',
          'Na cetoacidose diabética, a gasometria venosa substitui a arterial com segurança — foi um dos primeiros contextos em que o abandono da punção arterial de rotina foi validado.',
        ],
        alertas: ['Uma PCO₂ venosa normal praticamente exclui hipercapnia arterial (valor preditivo negativo alto); uma PCO₂ venosa elevada exige confirmação arterial antes de mudar conduta.'],
      }
    },
    formula: ['pH arterial ≈ pH venoso + 0,03 a 0,04', 'PaCO₂ ≈ PCO₂ venosa − 4 a 5 mmHg', 'HCO₃⁻ arterial ≈ HCO₃⁻ venoso − 1 a 2 mEq/L'],
    fundamento:
      'As diferenças entre sangue arterial e venoso existem porque o tecido consome O₂ e devolve CO₂. Em repouso, com perfusão normal, esse acréscimo de CO₂ é pequeno e previsível — daí a boa concordância. O que quebra a previsibilidade é o tempo de trânsito: quanto mais lento o fluxo capilar, mais CO₂ se acumula por unidade de sangue, e maior a diferença. Por isso a substituição é segura no paciente estável e enganosa no paciente em choque, que é justamente quem mais motiva a punção.',
    armadilhas: [
      'Garroteamento prolongado e bombeamento da mão antes da coleta alteram pH e lactato locais.',
      'Não use gasometria venosa para calcular relação PaO₂/FiO₂, gradiente A-a ou qualquer índice de oxigenação.',
    ],
    referencias: [
      { texto: 'Bloom BM, Grundlingh J, Bestwick JP, Harris T. The role of venous blood gas in the emergency department: a systematic review and meta-analysis. Eur J Emerg Med. 2014;21(2):81-88.' },
      { texto: 'Kelly AM. Review article: Can venous blood gas analysis replace arterial in emergency medical care? Emerg Med Australas. 2010;22(6):493-498.' },
    ],
  },

  {
    id: 'gap-osmolar-toxico',
    nome: 'Gap osmolar na suspeita de intoxicação',
    sinonimos: ['gap osmolar', 'metanol', 'etilenoglicol', 'osmol gap'],
    resumo: 'Rastreia álcoois tóxicos quando há acidose de ânion gap alto sem causa evidente.',
    categorias: ['gasometria', 'nefrologia', 'emergencia'],
    campos: [
      campoNum('osmMedida', 'Osmolalidade medida (osmômetro por ponto de congelamento)', { ajuda: 'Osmolalidade medida por **crioscopia** (ponto de congelamento). O método por pressão de vapor não detecta álcoois voláteis e anula o gap.', unidade: 'mOsm/kg', min: 200, max: 450, passo: 1 }),
      campoNum('na', 'Sódio', { unidade: 'mEq/L', min: 90, max: 200, passo: 1 }),
      campoNum('glicose', 'Glicose', { unidade: 'mg/dL', min: 20, max: 1500, passo: 1 }),
      campoNum('ureia', 'Ureia', { unidade: 'mg/dL', min: 5, max: 400, passo: 1, ajuda: 'Se o laboratório reporta BUN, multiplique por 2,14 para obter ureia.' }),
      campoNum('etanol', 'Etanol', { ajuda: 'Alcoolemia em mg/dL. O etanol é a causa mais comum de gap osmolar alto e precisa ser descontado antes de suspeitar de metanol ou etilenoglicol.', unidade: 'mg/dL', min: 0, max: 600, passo: 1, padrao: '0', opcional: true }),
    ],
    calcular: (v) => {
      const osm = num(v, 'osmMedida')
      const na = num(v, 'na')
      const glic = num(v, 'glicose')
      const ureia = num(v, 'ureia')
      const etanol = numOu(v, 'etanol', 0)
      if (osm === null || na === null || glic === null || ureia === null) return null
      const calc = 2 * na + glic / 18 + ureia / 6 + etanol / 4.6
      const gap = osm - calc
      const nivel: Nivel = gap > 25 ? 'critico' : gap > 10 ? 'alerta' : 'ok'
      return {
        titulo: 'Gap osmolar',
        valor: fmt(gap, 1),
        unidade: 'mOsm/kg',
        nivel,
        rotuloNivel: gap > 25 ? 'Muito elevado' : gap > 10 ? 'Elevado' : 'Normal (< 10)',
        detalhes: [
          { rotulo: 'Osmolalidade calculada', valor: `${fmt(calc, 1)} mOsm/kg`, nota: '2×Na + glicose/18 + ureia/6 + etanol/4,6' },
          { rotulo: 'Contribuição do etanol', valor: `${fmt(etanol / 4.6, 1)} mOsm/kg` },
          { rotulo: 'Gap osmolar', valor: `${fmt(gap, 1)} mOsm/kg`, nota: 'Referência < 10. Alguns autores aceitam até 14, mas o normal populacional é próximo de −2 a +10.' },
        ],
        conduta: [
          '**Gap osmolar > 10 mOsm/kg** em paciente com acidose metabólica de ânion gap alto é indicação de acionar o centro de intoxicações e considerar tratamento empírico — não espere a dosagem específica de metanol ou etilenoglicol, que costuma levar horas ou dias e frequentemente não está disponível.',
          'Administre **fomepizol (15 mg/kg de ataque, depois 10 mg/kg a cada 12 h)** ou, na falta dele, **etanol** com alvo de alcoolemia de 100–150 mg/dL. Ambos bloqueiam a álcool-desidrogenase e impedem a conversão do álcool-pai nos metabólitos tóxicos — ácido fórmico no metanol, ácidos glicólico e oxálico no etilenoglicol. O antídoto não trata o dano já instalado; ele impede o dano seguinte, e por isso o tempo é a variável decisiva.',
          'Indique **hemodiálise** em acidose grave refratária, lesão renal aguda, alterações visuais no metanol, ou concentração do tóxico acima de 50 mg/dL. Ela remove tanto o álcool-pai quanto o metabólito ácido, e é o tratamento definitivo nos casos avançados.',
          'Associe **cofatores** que desviam o metabolismo para vias atóxicas: **ácido folínico ou fólico** no metanol (acelera a oxidação do formato a gás carbônico e água), e **tiamina e piridoxina** no etilenoglicol (desviam o glioxilato para alfa-hidroxi-beta-cetoadipato e glicina, reduzindo a formação de oxalato e a nefropatia).',
          'Atenção à **armadilha temporal**: no início da intoxicação, o gap osmolar é alto e o ânion gap é normal, porque o álcool-pai ainda não foi metabolizado. Ao final, o gap osmolar já normalizou e o ânion gap está muito alto. Um gap osmolar normal, portanto, **não exclui** intoxicação tardia — e a apresentação tardia é justamente a de pior prognóstico. Lembre também que etanol, isopropanol, propilenoglicol (veículo de lorazepam e fenitoína intravenosos), manitol e glicina de irrigação elevam o gap osmolar sem produzir metabólito ácido letal.',
        ],
        interpretacao: [
          gap > 10
            ? '**Gap osmolar elevado.** Há soluto osmoticamente ativo no plasma que não foi contabilizado. Metanol, etilenoglicol, isopropanol, propilenoglicol (veículo de lorazepam e fenitoína endovenosos), manitol e glicina de irrigação urológica são as causas relevantes. Cetoacidose grave e acidose lática também elevam modestamente o gap.'
            : 'Gap osmolar normal. **Atenção:** gap normal não exclui intoxicação por álcool tóxico. À medida que o metanol é metabolizado em ácido fórmico e o etilenoglicol em ácido glicólico e oxálico, o gap osmolar **cai** e o ânion gap **sobe** — apresentações tardias têm gap osmolar normal com acidose grave.',
          'A curva temporal é o ponto central: nas primeiras horas predomina o gap osmolar com pH ainda normal; depois de 12 a 24 horas predomina a acidose de ânion gap alto com gap osmolar já consumido. Um gap osmolar normal em paciente que ingeriu há um dia não tranquiliza.',
          'Pistas específicas: cristais de oxalato de cálcio na urina e hipocalcemia apontam etilenoglicol; alteração visual, borramento e papiledema apontam metanol; cetose sem acidose aponta isopropanol.',
        ],
        alertas: [
          'O tratamento — fomepizol ou etanol, mais hemodiálise — não deve esperar a dosagem específica do álcool, que raramente está disponível em tempo hábil. Suspeita clínica forte com acidose de ânion gap alto inexplicada já é indicação.',
          'Só vale com osmolalidade medida por ponto de congelamento. Osmômetros por pressão de vapor não detectam álcoois voláteis e produzem gap falsamente normal.',
        ],
      }
    },
    formula: [
      'Osm calculada = 2 × Na⁺ + glicose/18 + ureia/6 (+ etanol/4,6)',
      'Gap osmolar = Osm medida − Osm calculada',
      'Estimativa de concentração: metanol (mg/dL) ≈ gap × 3,2 | etilenoglicol ≈ gap × 6,2',
    ],
    fundamento:
      'A osmolalidade calculada considera apenas os solutos que dominam o plasma normal: sódio com seus ânions, glicose e ureia. Qualquer molécula pequena e osmoticamente ativa que não esteja nessa lista aparece como diferença entre o valor medido e o calculado. Os álcoois tóxicos são exatamente isso: moléculas pequenas, com peso molecular baixo, que elevam muito a osmolalidade por miligrama. O divisor de cada substância na fórmula é o seu peso molecular dividido por 10 — 18 para glicose, 6 para ureia (ou 2,8 para BUN), 4,6 para etanol, 3,2 para metanol, 6,2 para etilenoglicol.',
    armadilhas: [
      'Usar BUN no lugar da ureia sem converter subestima a osmolalidade calculada e infla o gap. No Brasil os laboratórios costumam reportar ureia; divida por 6. Se o valor for BUN, divida por 2,8.',
      'O gap osmolar tem faixa de referência ampla na população; um gap de 12 num paciente cujo basal era −5 já é significativo, e isso é invisível sem valor prévio.',
      'Hiperlipidemia e hiperproteinemia produzem pseudo-hiponatremia pelo método indireto, reduzindo o sódio medido e inflando o gap.',
    ],
    referencias: [
      { texto: 'Kraut JA, Kurtz I. Toxic alcohol ingestions: clinical features, diagnosis, and management. Clin J Am Soc Nephrol. 2008;3(1):208-225.' },
      { texto: 'Hovda KE, Hunderi OH, Rudberg N, Froyshov S, Jacobsen D. Anion and osmolal gaps in the diagnosis of methanol poisoning. Intensive Care Med. 2004;30(9):1842-1846.' },
    ],
  },
]

export default ferramentas
