import type { Exam } from '@/lib/types'
import { MAX_PERIODO, MIN_PERIODO, computeCurrentPeriodo } from '@/lib/user-periodo'

/**
 * A quem esta prova é aplicada.
 *
 * ## O que faltava
 *
 * Uma prova só tinha dois estados de audiência: visível para a plataforma
 * inteira (`isHidden: false`) ou invisível para todos (`isHidden: true`). Para
 * aplicar uma avaliação ao 3º período — e só a ele, no mesmo horário — o
 * caminho era publicar para todo mundo e torcer para que só a turma certa
 * entrasse. O ranking vinha misturado com quem entrou por curiosidade, e o
 * gabarito circulava antes da hora.
 *
 * `audience` resolve isso no documento da prova, não numa lista de nomes: quem
 * está no período alvo vê a prova, quem não está não a vê nem consegue abri-la
 * pelo endereço direto. O período de cada pessoa já é calculado e avança
 * sozinho a cada semestre (`lib/user-periodo.ts`), então uma prova marcada para
 * o 3º período continua correta no semestre seguinte — ela aponta para o
 * período, não para as pessoas que estavam nele.
 *
 * ## Simultaneidade
 *
 * "Ao mesmo tempo" já é o comportamento de `startTime`/`gatesOpen`: a prova
 * abre no mesmo instante para todos. O que faltava era o "para todos" ser um
 * conjunto definido. É isso que este arquivo entrega.
 *
 * ## Quem nunca é filtrado
 *
 * Admin e o criador da prova sempre passam — eles precisam conferir a prova
 * antes de ela existir para a turma. Prova pessoal e prova de treino não têm
 * público: são de quem as criou.
 */

export type ModoDePublico = 'todos' | 'periodos'

export interface PublicoDaProva {
  modo: ModoDePublico
  /** Períodos alvo (1..12). Só vale quando `modo === 'periodos'`. */
  periodos: number[]
}

export const PUBLICO_PADRAO: PublicoDaProva = { modo: 'todos', periodos: [] }

/** Normaliza o bloco vindo do formulário ou do banco. */
export function normalizarPublico(valor: unknown): PublicoDaProva {
  const bruto = (valor || {}) as Partial<PublicoDaProva>
  const periodos = Array.isArray(bruto.periodos)
    ? Array.from(
        new Set(
          bruto.periodos
            .map((p) => Math.trunc(Number(p)))
            .filter((p) => Number.isFinite(p) && p >= MIN_PERIODO && p <= MAX_PERIODO),
        ),
      ).sort((a, b) => a - b)
    : []

  // "Períodos" sem nenhum período selecionado trancaria a prova para todo mundo
  // sem que ninguém tivesse pedido isso — é mais provável ser um formulário
  // meio preenchido do que a intenção. Cai para "todos".
  if (bruto.modo === 'periodos' && periodos.length > 0) return { modo: 'periodos', periodos }
  return { ...PUBLICO_PADRAO }
}

export function provaERestrita(prova: Partial<Exam> | null | undefined): boolean {
  return normalizarPublico((prova as any)?.audience).modo === 'periodos'
}

export interface ContextoDoPublico {
  userId: string
  isAdmin?: boolean
  /** Período atual de quem está pedindo, já calculado. `null` = sem período. */
  periodo?: number | null
}

/**
 * Esta pessoa está no público desta prova?
 *
 * Quem não tem período definido no cadastro **não** entra numa prova restrita:
 * o contrário faria a restrição valer só para quem preencheu o perfil, que é
 * exatamente o avesso do que ela promete.
 */
export function pessoaEstaNoPublico(
  prova: Partial<Exam> | null | undefined,
  contexto: ContextoDoPublico,
): boolean {
  if (!prova) return false
  if (contexto.isAdmin) return true
  if (prova.createdBy && prova.createdBy === contexto.userId) return true
  if (prova.isPersonalExam || prova.isPracticeExam) return true

  const publico = normalizarPublico((prova as any).audience)
  if (publico.modo === 'todos') return true

  const periodo = contexto.periodo ?? null
  if (periodo === null) return false
  return publico.periodos.includes(periodo)
}

/** O período atual a partir do documento do usuário. Reexportado por conveniência. */
export function periodoDoUsuario(
  usuario: { periodoBase?: number | null; periodoBaseRef?: string | null } | null | undefined,
  agora: Date = new Date(),
): number | null {
  if (!usuario) return null
  return computeCurrentPeriodo(usuario.periodoBase, usuario.periodoBaseRef, agora)
}

/**
 * O filtro de Mongo que devolve as provas visíveis para um período.
 *
 * Provas sem `audience` (todas as criadas antes desta funcionalidade) passam:
 * ausência de público significa "todo mundo", não "ninguém".
 */
export function ramosDePublicoParaMongo(periodo: number | null): Record<string, unknown>[] {
  const semRestricao = [
    { audience: { $exists: false } },
    { 'audience.modo': { $ne: 'periodos' } },
  ]

  if (periodo === null) return semRestricao
  return [...semRestricao, { 'audience.periodos': periodo }]
}

export function filtroDePublicoParaMongo(periodo: number | null): Record<string, unknown> {
  return { $or: ramosDePublicoParaMongo(periodo) }
}

export function rotuloDoPublico(publico: PublicoDaProva): string {
  if (publico.modo === 'todos') return 'Todos os alunos'
  if (publico.periodos.length === 1) return `${publico.periodos[0]}º período`
  const lista = publico.periodos.map((p) => `${p}º`).join(', ')
  return `Períodos ${lista}`
}
