import type { Campo, Nivel, OpcaoCampo, Valores } from './tipos'

/**
 * Leitura tipada dos valores do formulário e atalhos de construção de campos.
 *
 * O contrato é único e vale para as 300+ ferramentas: `num` devolve `null`
 * quando o campo está vazio ou ilegível, nunca `0`. Quem calcula decide o que
 * fazer com o `null` — quase sempre `return null`, que a interface traduz em
 * "preencha os campos". Zero silencioso é a forma mais fácil de uma calculadora
 * clínica dar um resultado plausível e errado.
 */

/** Número do campo, ou `null` se vazio/inválido. Aceita vírgula decimal. */
export function num(v: Valores, id: string): number | null {
  const bruto = v[id]
  if (bruto === undefined || bruto === null) return null
  const t = String(bruto).trim().replace(',', '.')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** Número do campo com valor de reserva quando vazio. */
export function numOu(v: Valores, id: string, padrao: number): number {
  const n = num(v, id)
  return n === null ? padrao : n
}

/** Valor escolhido num campo de opção/segmentado. */
export function opc(v: Valores, id: string): string {
  return (v[id] ?? '').trim()
}

/** `true` quando o item de escore está marcado como presente. */
export function sim(v: Valores, id: string): boolean {
  return opc(v, id) === 'sim'
}

/** Pontos de um item `sim-nao`: `pontos` se marcado, 0 caso contrário. */
export function pts(v: Valores, id: string, pontos: number): number {
  return sim(v, id) ? pontos : 0
}

/**
 * Pontos de um campo de opção: lê a alternativa escolhida e devolve `pontos`.
 * Devolve `null` se nada foi escolhido — permite exigir resposta em escores.
 */
export function ptsOpc(campos: Campo[], v: Valores, id: string): number | null {
  const campo = campos.find((c) => c.id === id)
  const escolhido = opc(v, id)
  if (!campo || !campo.opcoes || escolhido === '') return null
  const o = campo.opcoes.find((x) => x.valor === escolhido)
  if (!o || o.pontos === undefined) return null
  return o.pontos
}

/** Soma os pontos de vários itens `sim-nao` de uma vez. */
export function somaSimNao(v: Valores, itens: { id: string; pontos: number }[]): number {
  return itens.reduce((t, i) => t + pts(v, i.id, i.pontos), 0)
}

/** Soma os pontos de vários campos de opção. `null` se algum estiver em branco. */
export function somaOpcoes(campos: Campo[], v: Valores, ids: string[]): number | null {
  let total = 0
  for (const id of ids) {
    const p = ptsOpc(campos, v, id)
    if (p === null) return null
    total += p
  }
  return total
}

/* ─────────────────────────── Formatação ─────────────────────────── */

/** Arredonda para `casas` decimais e formata no padrão pt-BR (vírgula). */
export function fmt(n: number | null | undefined, casas = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  const arredondado = Number(n.toFixed(casas))
  return arredondado.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })
}

/** Formatação sem casas fixas — corta zeros à direita. Bom para doses. */
export function fmtLivre(n: number | null | undefined, casas = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return Number(n.toFixed(casas)).toLocaleString('pt-BR', { maximumFractionDigits: casas })
}

/** Inteiro formatado. */
export function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return Math.round(n).toLocaleString('pt-BR')
}

/** Faixa "a — b" com as duas pontas formatadas. */
export function fmtFaixa(a: number, b: number, casas = 1): string {
  return `${fmt(a, casas)} – ${fmt(b, casas)}`
}

/** Percentual já em escala 0–100. */
export function fmtPct(n: number | null | undefined, casas = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return `${fmt(n, casas)}%`
}

/** Escolhe o nível pelo primeiro limite ultrapassado (limites crescentes). */
export function nivelPorFaixa(
  valor: number,
  faixas: { ate: number; nivel: Nivel }[],
  acima: Nivel,
): Nivel {
  for (const f of faixas) if (valor <= f.ate) return f.nivel
  return acima
}

/* ─────────────────────── Construtores de campo ─────────────────────── */

interface OpcoesNumero {
  unidade?: string
  ajuda?: string
  padrao?: string
  min?: number
  max?: number
  passo?: number
  normalMin?: number
  normalMax?: number
  opcional?: boolean
  mostrarSe?: (v: Valores) => boolean
}

/** Campo numérico. */
export function campoNum(id: string, rotulo: string, o: OpcoesNumero = {}): Campo {
  return { id, rotulo, tipo: 'numero', ...o }
}

/** Item de escore: ausente (0) ou presente (`pontos`). */
export function campoSimNao(
  id: string,
  rotulo: string,
  pontos: number,
  ajuda?: string,
): Campo {
  return { id, rotulo, tipo: 'sim-nao', pontos, ajuda, padrao: 'nao' }
}

/** Campo de opções em botões lado a lado (2 a 4 alternativas curtas). */
export function campoSeg(
  id: string,
  rotulo: string,
  opcoes: OpcaoCampo[],
  o: { ajuda?: string; padrao?: string; mostrarSe?: (v: Valores) => boolean } = {},
): Campo {
  return { id, rotulo, tipo: 'segmentado', opcoes, padrao: o.padrao ?? opcoes[0]?.valor, ajuda: o.ajuda, mostrarSe: o.mostrarSe }
}

/** Campo de opções em lista (5+ alternativas ou textos longos). */
export function campoOpc(
  id: string,
  rotulo: string,
  opcoes: OpcaoCampo[],
  o: { ajuda?: string; padrao?: string; mostrarSe?: (v: Valores) => boolean } = {},
): Campo {
  return { id, rotulo, tipo: 'opcao', opcoes, padrao: o.padrao ?? opcoes[0]?.valor, ajuda: o.ajuda, mostrarSe: o.mostrarSe }
}

/** Campo de sexo biológico — recorre em dezenas de fórmulas. */
export function campoSexo(id = 'sexo', rotulo = 'Sexo biológico'): Campo {
  return campoSeg(id, rotulo, [
    { valor: 'm', rotulo: 'Masculino' },
    { valor: 'f', rotulo: 'Feminino' },
  ], { ajuda: 'As fórmulas foram derivadas sobre sexo biológico ao nascimento; use o que corresponde à massa muscular e à hematimetria da pessoa.' })
}

export const campoIdade = (o: OpcoesNumero = {}) =>
  campoNum('idade', 'Idade', { unidade: 'anos', min: 0, max: 120, passo: 1, ...o })

export const campoPeso = (o: OpcoesNumero = {}) =>
  campoNum('peso', 'Peso', { unidade: 'kg', min: 0.3, max: 400, passo: 0.1, ...o })

export const campoAltura = (o: OpcoesNumero = {}) =>
  campoNum('altura', 'Altura', { unidade: 'cm', min: 30, max: 250, passo: 0.5, ...o })

export const campoCreatinina = (o: OpcoesNumero = {}) =>
  campoNum('creatinina', 'Creatinina sérica', {
    unidade: 'mg/dL',
    min: 0.1,
    max: 25,
    passo: 0.01,
    normalMin: 0.6,
    normalMax: 1.3,
    ...o,
  })

/* ───────────────────────── Cálculos reaproveitados ───────────────────────── */

/** Superfície corporal por Du Bois (a mais usada em dose oncológica). */
export function bsaDuBois(pesoKg: number, alturaCm: number): number {
  return 0.007184 * Math.pow(pesoKg, 0.425) * Math.pow(alturaCm, 0.725)
}

/** Superfície corporal por Mosteller — mais simples e praticamente idêntica. */
export function bsaMosteller(pesoKg: number, alturaCm: number): number {
  return Math.sqrt((pesoKg * alturaCm) / 3600)
}

/** Peso corporal predito (ARDSNet) — a base do volume corrente protetor. */
export function pesoPredito(sexo: string, alturaCm: number): number {
  const base = sexo === 'f' ? 45.5 : 50
  return base + 0.91 * (alturaCm - 152.4)
}

/** IMC em kg/m². */
export function imc(pesoKg: number, alturaCm: number): number {
  const m = alturaCm / 100
  return pesoKg / (m * m)
}

/** Pressão de vapor d'água a 37 °C, ao nível do mar (mmHg). */
export const PH2O = 47

/** Pressão barométrica padrão ao nível do mar (mmHg). */
export const PATM = 760

/**
 * Pressão alveolar de O₂ pela equação do gás alveolar.
 * `patm` permite altitude; `r` é o quociente respiratório (0,8 em dieta mista).
 */
export function pAO2(fio2: number, paco2: number, patm = PATM, r = 0.8): number {
  return fio2 * (patm - PH2O) - paco2 / r
}
