import type { Exam } from '@/lib/types'

/**
 * A ordem em que as provas aparecem — e quem manda nela.
 *
 * ## O que existia, e por que ninguém via
 *
 * O campo `orderInGroup` está no banco desde sempre, duas rotas sabiam
 * escrevê-lo e o admin tinha setinhas para clicar. Só faltava uma coisa: ele
 * nunca chegava à tela. `GET /api/exams?campos=lista` — a chamada que /provas
 * faz — não pedia o campo na projeção, então TODA prova chegava sem ordem, e o
 * `orderInGroup ?? 999` do `components/exam-group.tsx` empatava todas em 999.
 * O admin clicava, o servidor gravava, a tela recarregava e nada mudava de
 * lugar. A funcionalidade existia inteira menos por uma linha, e o sintoma era
 * indistinguível de ela não existir.
 *
 * Pior: a grade de cartões — que é onde as provas de fato são vistas — nunca
 * ordenou por nada além do que o Mongo devolvia (`createdAt` decrescente).
 * Mesmo com o campo em mãos, ela ignoraria a ordem.
 *
 * Este arquivo é a resposta única para "em que ordem estas provas aparecem?",
 * usada pela grade, pela lista dentro dos grupos e pelo servidor. Duas telas
 * com duas regras de ordenação é como o problema acima começou.
 *
 * ## A ordem é por LISTA, não global
 *
 * Uma prova aparece em exatamente um lugar: dentro do seu grupo, ou na
 * prateleira das que não têm grupo. É nessa lista que ela tem vizinhos, e é
 * dela que a posição fala. Por isso o escopo é `groupId ?? null` — o `null`
 * é a prateleira das soltas, uma lista tão real quanto qualquer grupo.
 *
 * O nome do campo (`orderInGroup`) é mais estreito do que o que ele guarda
 * hoje, mas renomeá-lo pediria migrar documentos em produção para não ganhar
 * nada que um comentário não resolva.
 */

/** Uma prova, do ponto de vista da ordenação. Aceita o documento cru do banco. */
export interface ProvaOrdenavel {
  _id?: unknown
  groupId?: string | null
  orderInGroup?: number | null
  createdAt?: Date | string | null
}

/** A lista à qual esta prova pertence: um grupo, ou a prateleira das soltas. */
export function escopoDaProva(prova: Pick<ProvaOrdenavel, 'groupId'>): string | null {
  return prova.groupId ? String(prova.groupId) : null
}

export function mesmoEscopo(prova: Pick<ProvaOrdenavel, 'groupId'>, escopo: string | null): boolean {
  return escopoDaProva(prova) === escopo
}

/**
 * Esta prova participa da ordem do catálogo?
 *
 * Prova pessoal não. Ela é do aluno que a criou — cada um vê só as suas, e
 * dizer que a de alguém vem "antes" da de outra pessoa não significa nada. Mas
 * a razão de a regra estar AQUI, e não solta em cada tela, é outra: o cartão
 * mostra "3 de 12" e desabilita a seta na ponta a partir de uma contagem, e a
 * rota grava as posições a partir de outra. Se as duas contagens discordarem
 * sobre quem entra na lista, a seta desabilita na prova errada e o clique da
 * ponta move uma prova que a tela jurava ser a última.
 */
export function participaDaOrdem(prova: { isPersonalExam?: boolean }): boolean {
  return prova.isPersonalExam !== true
}

function idDe(prova: ProvaOrdenavel): string {
  return prova._id ? String(prova._id) : ''
}

/** Posição explícita, ou `null` para "nunca foi posicionada". */
function posicaoDe(prova: ProvaOrdenavel): number | null {
  const valor = prova.orderInGroup
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null
}

function instanteDe(prova: ProvaOrdenavel): number {
  if (!prova.createdAt) return 0
  const data = prova.createdAt instanceof Date ? prova.createdAt : new Date(prova.createdAt)
  const ms = data.getTime()
  return Number.isFinite(ms) ? ms : 0
}

/**
 * As provas na ordem em que devem aparecer.
 *
 * ## As três regras, nesta ordem
 *
 * 1. **Quem foi posicionada vem primeiro**, na posição que recebeu. Uma ordem
 *    que o admin definiu à mão é a informação mais forte que existe sobre onde
 *    a prova deve estar.
 * 2. **Quem nunca foi posicionada vem depois, da mais nova para a mais
 *    antiga.** É exatamente a ordem que a tela já mostrava antes disto existir
 *    (`createdAt: -1`, do Mongo), então uma lista que ninguém organizou
 *    continua igual ao que era. Uma prova nova também não se enfia no meio de
 *    uma lista arrumada: ela entra no fim, onde dá para vê-la e movê-la.
 * 3. **Empate desempata pelo id.** Nunca deveria acontecer (o servidor grava
 *    posições distintas), mas `sort` sem desempate total devolve a ordem que o
 *    Mongo tiver devolvido naquela consulta — e uma lista que muda de ordem
 *    sozinha entre dois carregamentos é o tipo de bug que ninguém consegue
 *    reproduzir.
 *
 * Não muta o array recebido.
 */
export function ordenarProvas<T extends ProvaOrdenavel>(provas: readonly T[]): T[] {
  return [...provas].sort((a, b) => {
    const pa = posicaoDe(a)
    const pb = posicaoDe(b)

    if (pa !== null && pb !== null && pa !== pb) return pa - pb
    // Posicionada ganha de não posicionada, sempre.
    if (pa !== null && pb === null) return -1
    if (pa === null && pb !== null) return 1

    if (pa === null && pb === null) {
      const ta = instanteDe(a)
      const tb = instanteDe(b)
      if (ta !== tb) return tb - ta
    }

    return idDe(a).localeCompare(idDe(b))
  })
}

/**
 * A lista de ids depois de mover uma prova uma casa para frente ou para trás.
 *
 * Devolve a sequência inteira, e não o par que trocou, porque é a sequência
 * inteira que o servidor vai gravar: mandar "troque estes dois" obriga os dois
 * lados a concordarem sobre quais são os vizinhos, e eles discordam com
 * facilidade — basta a tela ter um filtro ligado, ou uma prova ter sido criada
 * entre o desenho e o clique. A sequência completa é a mesma coisa dita de um
 * jeito que não depende de o outro lado adivinhar nada.
 *
 * Devolve a lista inalterada quando o movimento não existe (prova fora da
 * lista, ou já na ponta): "já está no começo" não é erro, é um clique sem
 * efeito.
 */
export function moverNaLista(
  ids: readonly string[],
  id: string,
  direcao: 'antes' | 'depois',
): string[] {
  const atual = ids.indexOf(id)
  if (atual === -1) return [...ids]

  const destino = direcao === 'antes' ? atual - 1 : atual + 1
  if (destino < 0 || destino >= ids.length) return [...ids]

  const novo = [...ids]
  novo[atual] = ids[destino]
  novo[destino] = id
  return novo
}

/**
 * Aplica uma sequência de ids às provas, devolvendo-as já reordenadas.
 *
 * É o que a tela usa para mostrar o resultado do clique ANTES de o servidor
 * responder: a posição nova é calculada aqui e escrita no próprio objeto, de
 * modo que a próxima `ordenarProvas` — inclusive a que roda depois de a lista
 * ser recarregada — chegue ao mesmo resultado. Sem isso o cartão voltaria para
 * o lugar antigo no primeiro redesenho.
 */
export function aplicarOrdem<T extends ProvaOrdenavel>(provas: readonly T[], ids: readonly string[]): T[] {
  const posicoes = new Map(ids.map((id, indice) => [id, indice]))
  return provas.map((prova) => {
    const posicao = posicoes.get(idDe(prova))
    return posicao === undefined ? prova : { ...prova, orderInGroup: posicao }
  })
}

/** As provas ordenáveis de uma lista só, já na ordem. */
export function provasDoEscopo<T extends ProvaOrdenavel & { isPersonalExam?: boolean }>(
  provas: readonly T[],
  escopo: string | null,
): T[] {
  return ordenarProvas(provas.filter((prova) => mesmoEscopo(prova, escopo) && participaDaOrdem(prova)))
}

/** Só para o servidor: o tipo do documento no banco. */
export type ProvaNoBanco = Partial<Exam> & ProvaOrdenavel

/**
 * O filtro do Mongo para "as provas desta lista".
 *
 * A prateleira das soltas não é `{ groupId: null }` e pronto: prova antiga
 * nunca teve o campo, `move-group` grava `null` ao tirar de um grupo, e um
 * documento com string vazia também já apareceu. Os três casos são a mesma
 * coisa para quem olha a tela, e um filtro que enxerga só um deles ordena
 * meia lista — deixando a outra metade sem posição, no fim, como se tivesse
 * acabado de ser criada.
 */
export function filtroDoEscopo(escopo: string | null): Record<string, unknown> {
  // `isPersonalExam` fora, pela mesma razão de `participaDaOrdem`: o escopo do
  // servidor tem de ser exatamente o que a tela contou.
  const semPessoais = { isPersonalExam: { $ne: true } }
  if (escopo) return { ...semPessoais, groupId: escopo }
  return {
    ...semPessoais,
    $or: [{ groupId: null }, { groupId: { $exists: false } }, { groupId: '' }],
  }
}

/**
 * A sequência definitiva de uma lista: o que o cliente pediu, e depois o que
 * ele não mencionou.
 *
 * Ids repetidos ou fora do escopo são descartados aqui — a rota já recusa os
 * de outra lista, e esta função é a última linha para que o resultado seja
 * sempre uma permutação exata do escopo, sem prova sumida nem posição
 * duplicada.
 */
export function sequenciaFinal<T extends ProvaOrdenavel>(
  doEscopo: readonly T[],
  pedida: readonly string[],
): string[] {
  const existentes = new Map(doEscopo.map((prova) => [idDe(prova), prova]))

  const cabeca: string[] = []
  const jaUsados = new Set<string>()
  for (const id of pedida) {
    if (!existentes.has(id) || jaUsados.has(id)) continue
    cabeca.push(id)
    jaUsados.add(id)
  }

  const cauda = ordenarProvas(doEscopo.filter((prova) => !jaUsados.has(idDe(prova)))).map(idDe)

  return [...cabeca, ...cauda]
}
