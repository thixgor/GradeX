/**
 * O relógio que decide o fim da prova.
 *
 * ## O que estava quebrado
 *
 * O cronômetro da prova (`components/exam-timer.tsx`) comparava o prazo com
 * `Date.now()` — o relógio do aparelho de quem está respondendo. E o aparelho
 * de quem está respondendo é a única peça desta prova que ninguém conferiu:
 * celular com a hora automática desligada, notebook que voltou do sono com o
 * relógio parado, tablet emprestado, aparelho que ressincroniza com a rede no
 * meio da tarde e **pula** para a frente.
 *
 * Enquanto isso é só um número na tela, o erro é cosmético. Aqui não era: o
 * cronômetro chamava `onTimeUp`, e `onTimeUp` encerrava a prova. Um relógio
 * dez minutos adiantado tirava dez minutos de prova de uma pessoa — e um
 * relógio que pulou meia hora encerrava a prova *dela sozinha*, no meio de uma
 * questão, sem nada ter acontecido na sala.
 *
 * É o mesmo problema que o painel do admin já resolvia
 * (`hooks/use-acompanhamento-ao-vivo.ts`: "se 'agora' fosse o relógio do
 * computador do admin — adiantado dois minutos, como tantos são"). Lá o preço
 * era um rótulo errado; aqui é a prova.
 *
 * ## Como está agora
 *
 * O servidor diz que horas são — ele já responde a prova, o rascunho e a
 * janela —, e o cliente guarda a DIFERENÇA entre esse instante e o dele. A
 * partir daí todo prazo é medido por `Date.now() + desvio`, que é o relógio do
 * servidor visto de dentro do navegador.
 *
 * Guardar a diferença (e não a hora) é o que mantém a contagem viva entre uma
 * resposta e outra: o relógio local continua andando sozinho, de segundo em
 * segundo, e só a origem dele passa a ser a certa.
 *
 * ## Por que o meio do caminho, e não a hora da chegada
 *
 * Entre pedir e receber existe a rede. Se o desvio fosse `servidor - chegada`,
 * toda a viagem de ida e volta apareceria como atraso do relógio local — numa
 * conexão ruim de celular, segundos inteiros. O instante em que o servidor
 * respondeu está, em média, no MEIO da viagem, e é com esse ponto que a conta
 * é feita. Sobra um erro da ordem de metade da variação da rede, o que é ruído
 * perto do que se está corrigindo (minutos, às vezes horas).
 */

export interface MedidaDoRelogio {
  /** `Date.now()` no instante em que a requisição saiu. */
  pedidoEm: number
  /** `Date.now()` no instante em que a resposta chegou. */
  respondidoEm: number
  /** O "agora" que o servidor devolveu (ISO, `Date` ou milissegundos). */
  servidorEm: unknown
}

function paraMilissegundos(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null
  if (valor instanceof Date) return Number.isFinite(valor.getTime()) ? valor.getTime() : null
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null
  if (typeof valor !== 'string') return null
  const data = new Date(valor)
  return Number.isFinite(data.getTime()) ? data.getTime() : null
}

/**
 * Quanto o relógio deste aparelho está atrasado em relação ao do servidor.
 *
 * Positivo: o aparelho está ATRASADO (o servidor já está mais adiante).
 * Negativo: o aparelho está ADIANTADO — o caso que encerrava a prova antes da
 * hora.
 *
 * Devolve `null` quando não dá para medir (resposta sem instante, data
 * inválida, medida incoerente). `null` é significativo: quem chama mantém o
 * desvio anterior em vez de trocá-lo por um palpite.
 */
export function medirDesvio(medida: MedidaDoRelogio): number | null {
  const servidor = paraMilissegundos(medida.servidorEm)
  if (servidor === null) return null

  const { pedidoEm, respondidoEm } = medida
  if (!Number.isFinite(pedidoEm) || !Number.isFinite(respondidoEm)) return null
  // Uma resposta não pode chegar antes de o pedido sair: isso é medida
  // estragada (o relógio local mudou no meio da viagem), e medida estragada
  // não vira correção.
  if (respondidoEm < pedidoEm) return null

  const meioDaViagem = pedidoEm + (respondidoEm - pedidoEm) / 2
  return servidor - meioDaViagem
}

/**
 * O relógio do servidor, visto de dentro do navegador.
 *
 * Sem desvio medido devolve o relógio local — que é o comportamento antigo, e
 * o único possível quando nenhuma resposta do servidor chegou ainda.
 */
export function agoraDoServidor(desvio: number | null | undefined, agoraLocal: number = Date.now()): number {
  return agoraLocal + (Number.isFinite(desvio as number) ? (desvio as number) : 0)
}

/**
 * Quanto falta para o prazo, em milissegundos — nunca negativo.
 *
 * `null` quando não há prazo: prova de treino, prova pessoal, prova sem data.
 * Não confundir com `0`, que é "acabou".
 */
export function tempoRestante(
  prazo: Date | string | number | null | undefined,
  agora: number,
): number | null {
  const fim = paraMilissegundos(prazo)
  if (fim === null) return null
  return Math.max(0, fim - agora)
}

/**
 * O prazo acabou?
 *
 * Prova sem prazo nunca vence — é o que separa a prova de treino ("Sem
 * limite") da prova agendada.
 */
export function prazoVencido(
  prazo: Date | string | number | null | undefined,
  agora: number,
): boolean {
  const restante = tempoRestante(prazo, agora)
  return restante !== null && restante <= 0
}

/**
 * As partes de uma contagem regressiva, prontas para a tela.
 *
 * Fica aqui, e não no componente, porque é a mesma conta que os testes
 * precisam alcançar sem montar React.
 */
export function partesDaContagem(restanteMs: number): {
  horas: number
  minutos: number
  segundos: number
  total: number
} {
  const total = Math.max(0, restanteMs)
  return {
    horas: Math.floor(total / 3_600_000),
    minutos: Math.floor((total / 60_000) % 60),
    segundos: Math.floor((total / 1000) % 60),
    total,
  }
}
