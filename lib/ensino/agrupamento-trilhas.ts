import { caminhoAte, profundidadeDoNivel, type NoDeEnsino } from '@/lib/ensino/taxonomia'

/**
 * De que assunto é cada Trilha.
 *
 * ══ O PROBLEMA ═════════════════════════════════════════════════════════
 *
 * A vitrine de Trilhas era uma grade solta: trinta cartões em ordem de
 * publicação, sem nenhuma divisão por assunto. Achar "as Trilhas de
 * Cardiologia" significava ler os trinta títulos. O documento da Trilha até
 * tem onde guardar isso (`areaId`/`moduloId`/`topicoId` — ver `trilha.ts`),
 * mas nem o construtor visual nem a importação preenchem esses campos: na
 * prática, todas as Trilhas do banco têm os três em `null`. Agrupar por eles
 * produziria um único grupo chamado "Sem assunto", que é a mesma grade solta
 * com um título em cima.
 *
 * ══ A SAÍDA: DERIVAR DO CONTEÚDO ═══════════════════════════════════════
 *
 * A informação existe — só não está na Trilha. Cada AULA já declara onde mora
 * na taxonomia (`ensino.areaId/moduloId/topicoId/subtopicoId`), e uma Trilha é
 * uma lista de aulas. O assunto de "Insuficiência Cardíaca do Zero" é o
 * assunto das aulas que ela reúne, e isso dá para calcular sem pedir nada a
 * ninguém e sem migrar nada.
 *
 * ══ POR QUE O NÓ MAIS PROFUNDO QUE AINDA COBRE A MAIORIA ═══════════════
 *
 * Uma Trilha raramente vive num Tópico só: "Insuficiência Cardíaca do Zero"
 * pega aulas de "Fisiologia Cardiovascular", "Semiologia" e "Farmacologia".
 * Agrupar pelo Tópico mais frequente jogaria essa Trilha em "Fisiologia" e
 * separaria irmãs que deveriam estar juntas; agrupar sempre pela Área
 * produziria um grupo só, chamado "Medicina".
 *
 * Então a conta sobe a árvore: para cada aula, todos os ancestrais dela contam
 * como cobertura, e vence o nó MAIS ESPECÍFICO que ainda cobre a maioria das
 * aulas da Trilha. Uma Trilha inteira de Cardiologia cai em "Cardiologia";
 * uma que atravessa três especialidades sobe sozinha até "Ciclo Clínico", que
 * é de fato o que ela tem de comum. O agrupamento fica tão fino quanto o
 * conteúdo permite, e nunca mais fino que isso.
 *
 * Curadoria explícita continua ganhando: se alguém um dia preencher o
 * `topicoId` da Trilha, é ele que vale. Um cálculo não deve sobrepor uma
 * decisão que alguém tomou de propósito.
 */

/**
 * O nível mais fino que pode virar um grupo na vitrine.
 *
 * Subtópico é preciso demais para prateleira: uma Trilha inteira sobre
 * insuficiência cardíaca acabaria sob o título "Fisiologia Cardiovascular",
 * que descreve as aulas mas não a Trilha — e duas Trilhas irmãs de Cardiologia
 * apareceriam sob dois títulos diferentes só porque partem de subtópicos
 * diferentes. A prateleira é a especialidade; o subtópico é onde a AULA mora.
 *
 * A cobertura continua sendo contada com a cadeia inteira: uma aula de
 * subtópico conta para o tópico que a contém. O que este teto muda é só qual
 * nó pode ser ESCOLHIDO como rótulo, não como o peso é somado.
 */
const NIVEL_MAXIMO = profundidadeDoNivel('topico')

export interface AssuntoDaTrilha {
  id: string
  nome: string
  nivel: string
  /** `true` quando veio de campo preenchido, `false` quando foi deduzido. */
  explicito: boolean
}

/** O nó em que a aula está pendurada — o mais específico que ela declara. */
export function noDaAula(ensino: {
  areaId?: string | null
  moduloId?: string | null
  topicoId?: string | null
  subtopicoId?: string | null
} | null | undefined): string | null {
  if (!ensino) return null
  const alvo = ensino.subtopicoId || ensino.topicoId || ensino.moduloId || ensino.areaId
  return alvo ? String(alvo) : null
}

/**
 * O assunto de uma Trilha.
 *
 * `nosDasAulas` é o nó de cada aula da Trilha, COM repetição — é a repetição
 * que dá o peso de cada ramo. Aula sem nó declarado entra como `null` e conta
 * no total: uma Trilha em que metade das aulas não está classificada não
 * deveria receber o rótulo confiante da outra metade.
 */
export function assuntoDaTrilha(
  explicito: { areaId?: string | null; moduloId?: string | null; topicoId?: string | null },
  nosDasAulas: Array<string | null>,
  nos: NoDeEnsino[],
): AssuntoDaTrilha | null {
  const porId = new Map(nos.map((n) => [String(n._id), n]))

  // 1. Curadoria explícita, do mais específico para o mais geral.
  for (const campo of [explicito?.topicoId, explicito?.moduloId, explicito?.areaId]) {
    const no = campo ? porId.get(String(campo)) : null
    if (no) return { id: String(no._id), nome: no.nome, nivel: no.nivel, explicito: true }
  }

  // 2. Cobertura acumulada subindo a árvore.
  const total = nosDasAulas.length
  if (total === 0) return null

  // A cadeia de ancestrais de cada nó é calculada UMA vez e reaproveitada:
  // uma Trilha grande repete o mesmo Tópico em dezenas de aulas, e refazer a
  // subida para cada uma delas custaria o mesmo trabalho dezenas de vezes.
  const ancestraisDe = new Map<string, string[]>()
  const subir = (noId: string) => {
    const guardado = ancestraisDe.get(noId)
    if (guardado) return guardado
    const cadeia = caminhoAte(nos, noId).map((n) => String(n._id))
    ancestraisDe.set(noId, cadeia)
    return cadeia
  }

  const cobertura = new Map<string, number>()
  for (const noId of nosDasAulas) {
    if (!noId) continue
    // Todo ancestral "contém" esta aula — é isso que deixa o assunto subir a
    // árvore quando a Trilha atravessa vários Tópicos.
    for (const chave of subir(noId)) {
      cobertura.set(chave, (cobertura.get(chave) || 0) + 1)
    }
  }

  /*
   * Maioria ESTRITA (mais da metade), e não "metade ou mais".
   *
   * A diferença aparece no empate: uma Trilha com duas aulas de Fisiologia e
   * duas de Semiologia não é uma Trilha de Fisiologia — é uma Trilha de
   * Cardiologia, que é o que as quatro têm em comum. Com "metade ou mais", os
   * dois subtópicos passariam no corte e o desempate escolheria um dos dois
   * por acaso, rotulando a Trilha com metade do próprio conteúdo.
   *
   * Como irmãos são conjuntos disjuntos, no máximo UM nó de cada nível pode
   * ter maioria estrita — o que torna o resultado uma escolha, não um sorteio.
   * As aulas não classificadas entram no denominador (ver a nota sobre `null`
   * acima), então elas empurram o rótulo para cima ou o suprimem.
   */
  const minimo = Math.floor(total / 2) + 1

  let escolhido: NoDeEnsino | null = null
  let melhorProfundidade = -1
  let melhorCobertura = 0

  for (const [noId, quantas] of cobertura) {
    if (quantas < minimo) continue
    const no = porId.get(noId)
    if (!no) continue

    const profundidade = profundidadeDoNivel(no.nivel)
    if (profundidade > NIVEL_MAXIMO) continue

    // Mais fundo ganha. O desempate por cobertura é uma garantia de
    // determinismo, não uma regra de negócio: pela maioria estrita, dois nós
    // de mesma profundidade nunca passam juntos no corte.
    if (
      profundidade > melhorProfundidade ||
      (profundidade === melhorProfundidade && quantas > melhorCobertura)
    ) {
      escolhido = no
      melhorProfundidade = profundidade
      melhorCobertura = quantas
    }
  }

  if (!escolhido) return null
  return { id: String(escolhido._id), nome: escolhido.nome, nivel: escolhido.nivel, explicito: false }
}
