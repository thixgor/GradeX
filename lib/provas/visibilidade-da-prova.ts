import type { Exam } from '@/lib/types'
import { pessoaEstaNoPublico } from './publico-da-prova'

/**
 * Esta prova existe para esta pessoa?
 *
 * ## As três regras que moravam separadas
 *
 * Uma prova pode estar fora do alcance de alguém por três motivos diferentes,
 * e cada um era checado num lugar diferente (ou em lugar nenhum):
 *
 *  1. **Pessoal** (`isPersonalExam`) — é de quem a criou.
 *  2. **Oculta** (`isHidden`) — tirada do catálogo pelo admin.
 *  3. **Público** (`audience`) — aplicada a períodos específicos.
 *
 * As três respondem à MESMA pergunta, então estão aqui juntas. Espalhadas,
 * cada porta nova do sistema precisava lembrar de checar as três — e não
 * lembrava.
 *
 * ## As portas que estavam abertas
 *
 * `GET /api/exams/[id]` devolvia 404 para prova oculta, e a tela mostrava
 * "Prova não encontrada". Parecia resolvido. Mas a tela é só a porta da
 * frente: `POST /api/exams/[id]/submit`, `/progress`, `/results` e
 * `/check-submission` não checavam nada. Quem tivesse o id — ele circula em
 * link de grupo, e a prova pode ter sido pública antes de ser ocultada —
 * entregava uma prova oculta por requisição direta, e a submissão entrava no
 * ranking de uma prova que oficialmente não existe.
 *
 * "A prova oculta não pode ser feita" é uma frase sobre o servidor. A tela
 * dizendo que não existe é a consequência, não a regra.
 *
 * ## As exceções da ocultação
 *
 * Ocultar era tudo ou nada: sumia para todo mundo que não fosse admin ou
 * criador. Faltava o caso real — a prova pronta que ainda não é da turma, mas
 * precisa ser vista por alguém: o professor que vai conferir, o monitor que
 * vai testar o cronômetro, os dois alunos que farão a segunda chamada.
 *
 *  - `admins`: se os admins continuam vendo a prova no catálogo do aluno
 *    (`/provas`). Nasce ligada — é o comportamento de sempre. Desligar serve
 *    para o admin ver a plataforma como o aluno a vê; ele continua abrindo e
 *    editando a prova normalmente pelo painel, porque isto é uma regra sobre
 *    o CATÁLOGO, não sobre o poder de administrar.
 *  - `usuarios`: as pessoas para quem a prova oculta continua existindo por
 *    inteiro — elas a veem na lista, abrem e fazem. É uma exceção de acesso de
 *    verdade, e por isso é decidida no servidor.
 */

export interface ExcecoesDeOcultacao {
  /** Admins continuam vendo a prova oculta no catálogo do aluno. */
  admins: boolean
  /** Ids de usuários para quem a prova oculta continua valendo por inteiro. */
  usuarios: string[]
}

export const EXCECOES_PADRAO: ExcecoesDeOcultacao = { admins: true, usuarios: [] }

/** Teto de convidados: uma exceção com centenas de nomes é uma turma, e turma é `audience`. */
export const MAXIMO_DE_CONVIDADOS = 100

/**
 * Normaliza o bloco vindo do formulário ou do banco.
 *
 * Ausente vira `admins: true`, e não `false`: toda prova oculta criada antes
 * disto existir era visível para o admin, e uma migração silenciosa que as
 * escondesse dele seria lida como "as provas sumiram".
 */
export function normalizarExcecoes(valor: unknown): ExcecoesDeOcultacao {
  const bruto = (valor || {}) as Partial<ExcecoesDeOcultacao>
  const usuarios = Array.isArray(bruto.usuarios)
    ? Array.from(
        new Set(
          bruto.usuarios
            .map((id) => String(id || '').trim())
            .filter((id) => id.length > 0),
        ),
      ).slice(0, MAXIMO_DE_CONVIDADOS)
    : []

  return {
    admins: bruto.admins !== false,
    usuarios,
  }
}

export function excecoesDaProva(prova: Partial<Exam> | null | undefined): ExcecoesDeOcultacao {
  return normalizarExcecoes((prova as any)?.hiddenExcept)
}

/** Esta pessoa foi convidada nominalmente para esta prova oculta? */
export function pessoaEhConvidada(
  prova: Partial<Exam> | null | undefined,
  userId: string | null | undefined,
): boolean {
  if (!prova?.isHidden || !userId) return false
  return excecoesDaProva(prova).usuarios.includes(String(userId))
}

export interface ContextoDeVisibilidade {
  userId: string
  isAdmin?: boolean
  /** Período atual de quem está pedindo, já calculado. `null` = sem período. */
  periodo?: number | null
}

/**
 * A prova existe para esta pessoa — a pergunta que toda porta precisa fazer.
 *
 * Responde `false` quando a resposta certa da rota é 404: não "sem permissão",
 * e sim "não existe". Uma prova oculta que responde 403 confirma que ela
 * existe, e confirmar é metade do que ocultar deveria evitar.
 */
export function provaExisteParaPessoa(
  prova: Partial<Exam> | null | undefined,
  contexto: ContextoDeVisibilidade,
): boolean {
  if (!prova) return false

  // Quem criou sempre alcança a própria prova — é assim desde antes disto, e
  // é o que permite montar uma prova oculta sem se trancar fora dela.
  if (prova.createdBy && prova.createdBy === contexto.userId) return true

  const isAdmin = !!contexto.isAdmin

  // Prova pessoal é do dono; o admin alcança para dar suporte.
  if (prova.isPersonalExam) return isAdmin

  if (prova.isHidden) {
    // O admin administra a prova oculta de qualquer jeito: a exceção `admins`
    // decide se ela aparece no CATÁLOGO dele, não se ele pode alcançá-la.
    if (isAdmin) return true
    if (!pessoaEhConvidada(prova, contexto.userId)) return false
    // Convidado passa por cima do público: foi chamado por nome.
    return true
  }

  return pessoaEstaNoPublico(prova, contexto)
}

/**
 * A prova entra no catálogo do aluno (`/provas`) para esta pessoa?
 *
 * Difere de `provaExisteParaPessoa` num ponto só, e é o ponto da opção
 * `admins`: um admin que desligou a exceção continua podendo abrir e editar a
 * prova, mas não quer vê-la na vitrine.
 */
export function provaApareceNoCatalogo(
  prova: Partial<Exam> | null | undefined,
  contexto: ContextoDeVisibilidade,
): boolean {
  if (!provaExisteParaPessoa(prova, contexto)) return false
  if (!prova?.isHidden) return true
  if (prova.createdBy && prova.createdBy === contexto.userId) return true
  if (contexto.isAdmin) return excecoesDaProva(prova).admins
  return true
}

/**
 * O ramo de Mongo que deixa o convidado passar.
 *
 * A listagem filtra visibilidade em dois níveis (oculta, e depois público por
 * período), e o convidado precisa passar nos DOIS: ele foi chamado por nome, e
 * nome não tem período. Por isso este ramo é aplicado duas vezes na rota, em
 * vez de um filtro pronto aqui — a query de lá tem uma forma que não sobrevive
 * a ser montada de fora (ver o comentário sobre `$or` aninhado em
 * `app/api/exams/route.ts`).
 */
export function ramoDeConvidadoParaMongo(userId: string): Record<string, unknown> {
  return { 'hiddenExcept.usuarios': userId }
}
