import { OFFSET_DA_PLATAFORMA_EM_MINUTOS } from '@/lib/provas/horario-local'

/**
 * O relógio que decide o fim da prova: o de Brasília.
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
 * ## Por que Brasília, e não "o relógio do servidor"
 *
 * A prova é marcada em horário de Brasília: é o fuso em que o admin digita
 * início, término e portões (`lib/provas/horario-local.ts`), e é o fuso em que
 * a turma combina "prova às 14h". O servidor roda em UTC porque datacenter roda
 * em UTC — isso é um detalhe de hospedagem, não o relógio da prova. Aqui a
 * referência é sempre Brasília, e o instante em UTC é só a forma de carregá-la
 * de um lado para o outro.
 *
 * ## De onde vem a hora certa — sem custar uma chamada
 *
 * De um cabeçalho que **toda resposta HTTP já traz**: `Date`, obrigatório desde
 * o HTTP/1.1, gerado por quem responde. Nenhuma rota nova, nenhum campo novo no
 * corpo, nenhuma invocação a mais na conta da Vercel: a tela lê o carimbo das
 * respostas que ela já ia buscar de qualquer jeito (a prova, ao abrir; o
 * rascunho, de 12 em 12 segundos enquanto a prova corre).
 *
 * O que se guarda é a DIFERENÇA entre esse carimbo e o relógio local — assim a
 * contagem continua viva entre uma resposta e outra, andando de segundo em
 * segundo no aparelho, só que a partir da origem certa.
 *
 * ## Os três cuidados da medida
 *
 * **O meio do caminho.** Entre pedir e receber existe a rede. Medir
 * `carimbo - chegada` jogaria a viagem inteira na conta do relógio local —
 * segundos, numa conexão ruim de celular. O carimbo foi escrito, em média, no
 * MEIO da viagem, e é com esse ponto que a conta é feita.
 *
 * **O cache.** Uma resposta guardada carrega o carimbo de quando NASCEU, não de
 * agora — e diria que o aparelho está adiantado justamente quando não está. O
 * cabeçalho `Age` diz quanto tempo ela passou guardada, e entra na soma.
 *
 * **A resolução de um segundo.** O `Date` do HTTP não tem milissegundos. Um
 * desvio abaixo de `DESVIO_MINIMO_MS` é indistinguível de ruído da medida, e
 * corrigir por ruído é trocar um relógio bom por um palpite: abaixo dele, o
 * relógio do aparelho fica como está.
 */

/** Abaixo disto o aparelho está certo — o resto é ruído da medida. */
export const DESVIO_MINIMO_MS = 2000

/**
 * A partir daqui vale avisar a pessoa.
 *
 * Corrigir três segundos é rotina e não interessa a ninguém; um minuto já
 * aparece na tela — o cronômetro anda diferente do relógio do próprio aparelho,
 * e quem vê isso no meio de uma prova merece a explicação antes de achar que o
 * site está com defeito.
 */
export const DESVIO_QUE_MERECE_AVISO = 60_000

export interface MedidaDoRelogio {
  /** `Date.now()` no instante em que a requisição saiu. */
  pedidoEm: number
  /** `Date.now()` no instante em que a resposta chegou. */
  respondidoEm: number
  /** O carimbo de hora da resposta (ISO, `Date` ou milissegundos). */
  referenciaEm: unknown
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
 * O instante que uma resposta HTTP carimbou — `Date`, corrigido por `Age`.
 *
 * Aceita qualquer coisa com `get(nome)`: o `Headers` do `fetch` serve, e um
 * objeto simples também (é assim que os testes descrevem uma resposta).
 * Devolve `null` quando não há carimbo legível, e aí nada é corrigido.
 */
export function lerHorarioDaResposta(
  cabecalhos: { get(nome: string): string | null } | null | undefined,
): number | null {
  if (!cabecalhos || typeof cabecalhos.get !== 'function') return null

  const carimbo = paraMilissegundos(cabecalhos.get('date'))
  if (carimbo === null) return null

  // `Age` é a idade da resposta em segundos, posta por quem a guardou. Sem ela,
  // uma resposta de cache faria o aparelho parecer adiantado pelo tempo que ela
  // passou na prateleira.
  const idade = Number(cabecalhos.get('age'))
  const segundosGuardada = Number.isFinite(idade) && idade > 0 ? idade : 0

  return carimbo + segundosGuardada * 1000
}

/**
 * Quanto o relógio deste aparelho está atrasado em relação ao de Brasília.
 *
 * Positivo: o aparelho está ATRASADO (Brasília já está mais adiante).
 * Negativo: o aparelho está ADIANTADO — o caso que encerrava a prova antes da
 * hora.
 *
 * Devolve `null` quando não dá para medir (resposta sem carimbo, data
 * inválida, medida incoerente) e também quando o desvio é pequeno demais para
 * ser real. `null` é significativo: quem chama mantém o que já tinha em vez de
 * trocá-lo por um palpite.
 */
export function medirDesvio(medida: MedidaDoRelogio): number | null {
  const referencia = paraMilissegundos(medida.referenciaEm)
  if (referencia === null) return null

  const { pedidoEm, respondidoEm } = medida
  if (!Number.isFinite(pedidoEm) || !Number.isFinite(respondidoEm)) return null
  // Uma resposta não pode chegar antes de o pedido sair: isso é medida
  // estragada (o relógio local mudou no meio da viagem), e medida estragada
  // não vira correção.
  if (respondidoEm < pedidoEm) return null

  const meioDaViagem = pedidoEm + (respondidoEm - pedidoEm) / 2
  const desvio = referencia - meioDaViagem
  return Math.abs(desvio) < DESVIO_MINIMO_MS ? null : desvio
}

/**
 * O instante de agora pelo relógio de Brasília, visto de dentro do navegador.
 *
 * Sem desvio medido devolve o relógio local — que é o comportamento antigo, e o
 * único possível enquanto nenhuma resposta tiver chegado.
 */
export function agoraEmBrasilia(desvio: number | null | undefined, agoraLocal: number = Date.now()): number {
  return agoraLocal + (Number.isFinite(desvio as number) ? (desvio as number) : 0)
}

/**
 * A hora de parede em Brasília, para a tela: `14:35`.
 *
 * `toLocaleTimeString` diria a hora do FUSO DO APARELHO, que é justamente o que
 * não vale aqui: um celular configurado em Lisboa mostraria 18:35 para o mesmo
 * instante e a pessoa conferiria o horário da prova contra um número que não é
 * o dela. O deslocamento fixo (`lib/provas/horario-local.ts`) é o mesmo que o
 * formulário do admin usa para gravar a prova.
 */
export function horaDeBrasilia(instante: number | Date | string): string {
  const ms = paraMilissegundos(instante)
  if (ms === null) return '—'
  const emBrasilia = new Date(ms + OFFSET_DA_PLATAFORMA_EM_MINUTOS * 60_000)
  const dois = (valor: number) => String(valor).padStart(2, '0')
  return `${dois(emBrasilia.getUTCHours())}:${dois(emBrasilia.getUTCMinutes())}`
}

/**
 * O desvio dito em voz alta, para quem precisa entender o que houve.
 *
 * Um cronômetro que anda diferente do relógio da própria tela parece defeito, e
 * defeito no meio de uma prova vira "o site travou" contado ao professor
 * depois. Dizer "seu aparelho está 12 min adiantado; a contagem segue o horário
 * de Brasília" encerra o assunto na hora — e é a mesma frase que o suporte vai
 * precisar quando alguém reclamar.
 */
export function descreverDesvio(
  desvio: number | null | undefined,
  limite: number = DESVIO_MINIMO_MS,
): string | null {
  if (desvio === null || desvio === undefined || !Number.isFinite(desvio)) return null
  if (Math.abs(desvio) < limite) return null

  const segundos = Math.round(Math.abs(desvio) / 1000)
  const sentido = desvio < 0 ? 'adiantado' : 'atrasado'
  const quanto =
    segundos < 60
      ? `${segundos} s`
      : segundos < 3600
        ? `${Math.round(segundos / 60)} min`
        : `${Math.round((segundos / 3600) * 10) / 10} h`

  return `O relógio deste aparelho está ${quanto} ${sentido}. A contagem segue o horário de Brasília.`
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
