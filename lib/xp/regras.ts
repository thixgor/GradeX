/**
 * As regras do XP — a parte pura, sem banco: o que vale ponto, quanto vale,
 * o teto por dia, os níveis, as ligas e as medalhas. Roda igual no servidor
 * (que calcula), no cliente (que mostra "como ganhar XP") e nos testes.
 *
 * ## O XP nasce do histórico, não de hoje
 *
 * Nada aqui é um contador que começa no deploy. O XP de alguém é calculado a
 * partir do que a pessoa já fez e está gravado — cada questão do banco, cada
 * prova entregue, cada carta revisada, cada aula concluída, desde o primeiro
 * dia. Quem estudou em março chega ao ranking com o XP de março. E como a conta
 * é sempre refeita a partir da fonte, mudar uma regra reajusta todo mundo, para
 * trás, do mesmo jeito.
 *
 * ## Desempenho vale mais que presença
 *
 * Acertar vale mais que errar, e errar ainda vale (tentar é estudar). A prova
 * dá bônus por acerto alto. Abrir uma página vale pouco e tem teto baixo; o que
 * mede aprendizado (acertar, revisar, concluir) vale muito e tem teto alto.
 *
 * ## Por que existe teto por dia
 *
 * Ranking convida a "farmar": abrir a mesma patologia cem vezes, refazer a mesma
 * questão até acertar. Por isso cada fonte conta uma vez por recurso por dia
 * (a mesma questão no mesmo dia vale uma vez) e cada área tem um teto diário de
 * XP. Os tetos ficam bem acima de um dia de estudo pesado de verdade — só cortam
 * o que não é estudo.
 */

export const AREAS_DE_XP = [
  'banco',
  'provas',
  'flashcards',
  'aulas',
  'manual',
  'materiais',
  'anatomia',
  'quizzes',
  'ferramentas',
  'jogos',
  'foco',
  'comunidade',
  'constancia',
] as const
export type AreaDeXp = (typeof AREAS_DE_XP)[number]

export const ROTULO_DA_AREA: Record<AreaDeXp, string> = {
  banco: 'Banco de Questões',
  provas: 'Provas',
  flashcards: 'Flashcards',
  aulas: 'Aulas',
  manual: 'Manual Clínico',
  materiais: 'Materiais',
  anatomia: 'Anatomia',
  quizzes: 'Quizzes e lições',
  ferramentas: 'Ferramentas Clínicas',
  jogos: 'Jogos',
  foco: 'Sessões de foco',
  comunidade: 'Comunidade',
  constancia: 'Constância',
}

/** Teto diário de XP por área. `null` = sem teto (constância já é limitada pela própria regra). */
export const TETO_DIARIO: Record<AreaDeXp, number | null> = {
  banco: 900,
  provas: 1500,
  flashcards: 450,
  aulas: 300,
  manual: 100,
  materiais: 80,
  anatomia: 200,
  quizzes: 250,
  ferramentas: 30,
  jogos: 90,
  foco: 180,
  comunidade: 120,
  constancia: null,
}

export const FONTES_DE_XP = {
  banco_acerto: { area: 'banco', xp: 10, rotulo: 'Questão do banco acertada' },
  banco_erro: { area: 'banco', xp: 3, rotulo: 'Questão do banco tentada' },
  banco_discursiva: { area: 'banco', xp: 6, rotulo: 'Discursiva respondida' },
  prova_questao: { area: 'provas', xp: 2, rotulo: 'Questão de prova respondida' },
  prova_acerto: { area: 'provas', xp: 8, rotulo: 'Acerto em prova (além do ponto da resposta)' },
  prova_entrega: { area: 'provas', xp: 25, rotulo: 'Prova entregue' },
  prova_bonus_70: { area: 'provas', xp: 40, rotulo: 'Prova com 70% ou mais de acerto' },
  prova_bonus_85: { area: 'provas', xp: 60, rotulo: 'Prova com 85% ou mais (soma ao de 70%)' },
  flash_revisao: { area: 'flashcards', xp: 2, rotulo: 'Carta revisada' },
  flash_lembrei: { area: 'flashcards', xp: 1, rotulo: 'Carta lembrada (além da revisão)' },
  flash_dominada: { area: 'flashcards', xp: 5, rotulo: 'Carta dominada (intervalo de 21+ dias)' },
  aula_concluida: { area: 'aulas', xp: 30, rotulo: 'Aula concluída' },
  manual_patologia: { area: 'manual', xp: 5, rotulo: 'Patologia estudada (uma vez por dia)' },
  manual_secao: { area: 'manual', xp: 2, rotulo: 'Módulo do Manual aberto (uma vez por dia)' },
  material_dia: { area: 'materiais', xp: 8, rotulo: 'Material estudado (uma vez por dia)' },
  anatomia_prancha: { area: 'anatomia', xp: 4, rotulo: 'Prancha estudada (uma vez por dia)' },
  anatomia_acerto: { area: 'anatomia', xp: 5, rotulo: 'Acerto no quiz de anatomia' },
  anatomia_erro: { area: 'anatomia', xp: 1, rotulo: 'Questão do quiz de anatomia' },
  quiz_acerto: { area: 'quizzes', xp: 5, rotulo: 'Acerto em quiz (Histologia, Radiologia, Semiologia…)' },
  quiz_erro: { area: 'quizzes', xp: 1, rotulo: 'Questão de quiz respondida' },
  licao_concluida: { area: 'quizzes', xp: 20, rotulo: 'Lição concluída (trilha do ECG)' },
  ferramenta_dia: { area: 'ferramentas', xp: 3, rotulo: 'Ferramenta clínica usada (uma vez por dia)' },
  jogo_vencido: { area: 'jogos', xp: 15, rotulo: 'Jogo concluído' },
  foco_minuto: { area: 'foco', xp: 1, rotulo: 'Minuto de sessão de foco' },
  forum_post: { area: 'comunidade', xp: 15, rotulo: 'Tópico no fórum' },
  forum_comentario: { area: 'comunidade', xp: 5, rotulo: 'Resposta no fórum' },
  mapa_criado: { area: 'comunidade', xp: 25, rotulo: 'Mapa mental criado' },
  mapa_curtido: { area: 'comunidade', xp: 3, rotulo: 'Curtida recebida num mapa mental' },
  dia_ativo: { area: 'constancia', xp: 10, rotulo: 'Dia com estudo' },
  sequencia_7: { area: 'constancia', xp: 50, rotulo: 'Cada 7 dias seguidos de estudo' },
} as const satisfies Record<string, { area: AreaDeXp; xp: number; rotulo: string }>

export type FonteDeXp = keyof typeof FONTES_DE_XP

/**
 * Um fato do histórico: "em tal dia, tantas unidades desta fonte". `dia` é a
 * chave YYYY-MM-DD no fuso de São Paulo; `null` quando a fonte não tem data
 * (aulas concluídas no modelo antigo) — conta no total, não na semana nem no mês.
 */
export interface Registro {
  dia: string | null
  fonte: FonteDeXp
  quantidade: number
}

export interface ExtratoDeXp {
  total: number
  porArea: Record<AreaDeXp, number>
  /** XP por dia (YYYY-MM-DD), já com tetos e constância. */
  porDia: Record<string, number>
  /** Quantas unidades de cada fonte, no histórico todo (para medalhas). */
  quantidades: Record<FonteDeXp, number>
  diasAtivos: number
  maiorSequencia: number
  sequenciaAtual: number
}

function zerado<K extends string>(chaves: readonly K[]): Record<K, number> {
  return Object.fromEntries(chaves.map((c) => [c, 0])) as Record<K, number>
}

/** Dia anterior de uma chave YYYY-MM-DD (aritmética de calendário, sem fuso). */
export function diaAnterior(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** Segunda-feira da semana do dia (a chave da semana do ranking). */
export function semanaDe(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`)
  const dow = (d.getUTCDay() + 6) % 7 // 0 = segunda
  d.setUTCDate(d.getUTCDate() - dow)
  return d.toISOString().slice(0, 10)
}

export function mesDe(dia: string): string {
  return dia.slice(0, 7)
}

/** Hoje (YYYY-MM-DD) no fuso de São Paulo. */
export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  return agora.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

/**
 * Soma o histórico em XP: aplica o valor de cada fonte, o teto diário de cada
 * área e a constância (dia ativo + bônus a cada 7 dias seguidos).
 */
export function calcularXp(registros: Registro[], agora: Date = new Date()): ExtratoDeXp {
  const quantidades = zerado(Object.keys(FONTES_DE_XP) as FonteDeXp[])
  // dia → área → XP bruto (antes do teto)
  const bruto = new Map<string, Map<AreaDeXp, number>>()
  const semData = zerado(AREAS_DE_XP)

  for (const r of registros) {
    const regra = FONTES_DE_XP[r.fonte]
    const qtd = Math.max(0, Math.floor(Number(r.quantidade) || 0))
    if (!regra || qtd === 0) continue
    quantidades[r.fonte] += qtd
    const xp = qtd * regra.xp
    if (r.dia === null) {
      semData[regra.area] += xp
      continue
    }
    let doDia = bruto.get(r.dia)
    if (!doDia) bruto.set(r.dia, (doDia = new Map()))
    doDia.set(regra.area, (doDia.get(regra.area) || 0) + xp)
  }

  const porArea = zerado(AREAS_DE_XP)
  const porDia: Record<string, number> = {}

  for (const [dia, areas] of bruto) {
    let doDia = 0
    for (const [area, xp] of areas) {
      const teto = TETO_DIARIO[area]
      const valendo = teto === null ? xp : Math.min(xp, teto)
      porArea[area] += valendo
      doDia += valendo
    }
    if (doDia > 0) porDia[dia] = doDia
  }

  // Constância: +10 por dia com estudo e +50 a cada 7 dias seguidos.
  const dias = Object.keys(porDia).sort()
  let maiorSequencia = 0
  let corrida = 0
  let anterior: string | null = null
  for (const dia of dias) {
    corrida = anterior !== null && diaAnterior(dia) === anterior ? corrida + 1 : 1
    anterior = dia
    maiorSequencia = Math.max(maiorSequencia, corrida)
    let bonus = FONTES_DE_XP.dia_ativo.xp
    quantidades.dia_ativo += 1
    if (corrida % 7 === 0) {
      bonus += FONTES_DE_XP.sequencia_7.xp
      quantidades.sequencia_7 += 1
    }
    porArea.constancia += bonus
    porDia[dia] += bonus
  }

  // Sequência atual: termina hoje ou ontem (ainda dá para manter hoje).
  const hoje = hojeEmSaoPaulo(agora)
  const ontem = diaAnterior(hoje)
  let sequenciaAtual = 0
  const ultimo = dias[dias.length - 1]
  if (ultimo === hoje || ultimo === ontem) {
    let cursor = ultimo
    const conjunto = new Set(dias)
    while (conjunto.has(cursor)) {
      sequenciaAtual += 1
      cursor = diaAnterior(cursor)
    }
  }

  for (const area of AREAS_DE_XP) porArea[area] += semData[area]
  const total = AREAS_DE_XP.reduce((s, a) => s + porArea[a], 0)

  return { total, porArea, porDia, quantidades, diasAtivos: dias.length, maiorSequencia, sequenciaAtual }
}

/** XP da semana e do mês correntes, a partir do XP por dia. */
export function xpDoPeriodo(porDia: Record<string, number>, agora: Date = new Date()) {
  const hoje = hojeEmSaoPaulo(agora)
  const semana = semanaDe(hoje)
  const mes = mesDe(hoje)
  let xpSemana = 0
  let xpMes = 0
  let xpHoje = 0
  for (const [dia, xp] of Object.entries(porDia)) {
    if (semanaDe(dia) === semana) xpSemana += xp
    if (mesDe(dia) === mes) xpMes += xp
    if (dia === hoje) xpHoje += xp
  }
  return { semana: { chave: semana, xp: xpSemana }, mes: { chave: mes, xp: xpMes }, hoje: xpHoje }
}

// ── Níveis e ligas ────────────────────────────────────────────────────────

export const NIVEL_MAXIMO = 99

/** XP acumulado para chegar ao nível `n` (nível 1 = 0 XP). Curva que alonga. */
export function xpParaNivel(n: number): number {
  if (n <= 1) return 0
  return Math.round(100 * Math.pow(n - 1, 1.8))
}

export const LIGAS = [
  { id: 'bronze', nome: 'Bronze', desde: 1, cor: '#c0793f', brilho: '#f0b27a' },
  { id: 'prata', nome: 'Prata', desde: 10, cor: '#8b98a8', brilho: '#e3e9f1' },
  { id: 'ouro', nome: 'Ouro', desde: 20, cor: '#d39b16', brilho: '#ffe08a' },
  { id: 'platina', nome: 'Platina', desde: 30, cor: '#2aa198', brilho: '#9ff0e6' },
  { id: 'esmeralda', nome: 'Esmeralda', desde: 45, cor: '#1f9d55', brilho: '#9ef0bd' },
  { id: 'diamante', nome: 'Diamante', desde: 60, cor: '#4f7cff', brilho: '#c3d4ff' },
  { id: 'lenda', nome: 'Lenda', desde: 80, cor: '#b0399d', brilho: '#ffb3ef' },
] as const

export type Liga = (typeof LIGAS)[number]

export interface InfoDeNivel {
  nivel: number
  /** XP acumulado no início deste nível. */
  base: number
  /** XP acumulado para o próximo nível (igual a `base` no nível máximo). */
  proximo: number
  /** 0–1 dentro do nível. */
  progresso: number
  liga: Liga
}

export function nivelDe(xp: number): InfoDeNivel {
  const total = Math.max(0, Math.floor(xp))
  let nivel = 1
  while (nivel < NIVEL_MAXIMO && xpParaNivel(nivel + 1) <= total) nivel++
  const base = xpParaNivel(nivel)
  const proximo = nivel >= NIVEL_MAXIMO ? base : xpParaNivel(nivel + 1)
  const progresso = proximo > base ? (total - base) / (proximo - base) : 1
  let liga: Liga = LIGAS[0]
  for (const l of LIGAS) if (nivel >= l.desde) liga = l
  return { nivel, base, proximo, progresso, liga }
}

// ── Medalhas ──────────────────────────────────────────────────────────────

export interface Medalha {
  id: string
  nome: string
  texto: string
  icone: 'questao' | 'prova' | 'carta' | 'aula' | 'chama' | 'livro' | 'estrela' | 'comunidade'
  conquistada: boolean
  /** 0–1 até conquistar. */
  progresso: number
}

const DEGRAUS: Array<{
  id: string
  nome: string
  texto: (alvo: number) => string
  icone: Medalha['icone']
  valor: (e: ExtratoDeXp) => number
  alvos: number[]
}> = [
  {
    id: 'questoes',
    nome: 'Resolvedor(a)',
    texto: (a) => `${a.toLocaleString('pt-BR')} questões respondidas`,
    icone: 'questao',
    valor: (e) => e.quantidades.banco_acerto + e.quantidades.banco_erro + e.quantidades.banco_discursiva + e.quantidades.prova_questao,
    alvos: [10, 100, 1000, 5000],
  },
  {
    id: 'acertos',
    nome: 'Mira certa',
    texto: (a) => `${a.toLocaleString('pt-BR')} acertos`,
    icone: 'estrela',
    valor: (e) => e.quantidades.banco_acerto + e.quantidades.prova_acerto + e.quantidades.anatomia_acerto + e.quantidades.quiz_acerto,
    alvos: [50, 500, 2500],
  },
  {
    id: 'provas',
    nome: 'Prova de fogo',
    texto: (a) => (a === 1 ? 'Primeira prova entregue' : `${a} provas entregues`),
    icone: 'prova',
    valor: (e) => e.quantidades.prova_entrega,
    alvos: [1, 10, 50],
  },
  {
    id: 'cartas',
    nome: 'Memória de elefante',
    texto: (a) => `${a.toLocaleString('pt-BR')} cartas revisadas`,
    icone: 'carta',
    valor: (e) => e.quantidades.flash_revisao,
    alvos: [100, 1000, 10000],
  },
  {
    id: 'aulas',
    nome: 'Assíduo(a)',
    texto: (a) => `${a} aulas concluídas`,
    icone: 'aula',
    valor: (e) => e.quantidades.aula_concluida,
    alvos: [5, 25, 100],
  },
  {
    id: 'sequencia',
    nome: 'Chama acesa',
    texto: (a) => `${a} dias seguidos de estudo`,
    icone: 'chama',
    valor: (e) => e.maiorSequencia,
    alvos: [3, 7, 30, 100],
  },
  {
    id: 'manual',
    nome: 'Clínico(a)',
    texto: (a) => `${a} patologias estudadas`,
    icone: 'livro',
    valor: (e) => e.quantidades.manual_patologia,
    alvos: [10, 100, 300],
  },
  {
    id: 'comunidade',
    nome: 'Turma unida',
    texto: (a) => `${a} contribuições na comunidade`,
    icone: 'comunidade',
    valor: (e) => e.quantidades.forum_post + e.quantidades.forum_comentario + e.quantidades.mapa_criado,
    alvos: [1, 10, 50],
  },
]

/**
 * Uma medalha por trilha: a do maior degrau já alcançado, ou a próxima a
 * alcançar (com o progresso até ela). Mostrar a próxima é o que puxa.
 */
export function medalhasDe(extrato: ExtratoDeXp): Medalha[] {
  return DEGRAUS.map((d) => {
    const valor = d.valor(extrato)
    const alcancados = d.alvos.filter((a) => valor >= a)
    const proximo = d.alvos.find((a) => valor < a)
    if (proximo === undefined) {
      const alvo = d.alvos[d.alvos.length - 1]
      return { id: `${d.id}-${alvo}`, nome: d.nome, texto: d.texto(alvo), icone: d.icone, conquistada: true, progresso: 1 }
    }
    const alvo = alcancados.length ? alcancados[alcancados.length - 1] : proximo
    const conquistada = alcancados.length > 0
    return {
      id: `${d.id}-${alvo}`,
      nome: d.nome,
      texto: conquistada ? d.texto(alvo) : d.texto(proximo),
      icone: d.icone,
      conquistada,
      progresso: conquistada ? 1 : Math.min(1, valor / proximo),
    }
  })
}

/** "Thiago Rodrigues" → "Thiago R." — o ranking não expõe sobrenome inteiro. */
export function nomeDoRanking(nome: string | null | undefined): string {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return 'Estudante'
  const primeiro = partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase()
  if (partes.length === 1) return primeiro
  const ultimo = partes[partes.length - 1]
  return `${primeiro} ${ultimo.charAt(0).toUpperCase()}.`
}

/** Versão das regras gravada no retrato de cada pessoa: mudou a regra, refaz. */
export const VERSAO_DAS_REGRAS = 1
