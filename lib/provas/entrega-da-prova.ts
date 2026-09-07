import type { Exam } from '@/lib/types'
import { podeEntregarNoLimite, type JanelaDaProva } from '@/lib/provas/janela-da-prova'

/**
 * A entrega que chega depois do término.
 *
 * ## O que já estava resolvido
 *
 * `podeEntregarNoLimite` (em `lib/provas/janela-da-prova.ts`) mantém a porta de
 * entrega encostada por um minuto e meio depois do fim. Ela cobre o TRANSPORTE:
 * a entrega automática sai no milissegundo do prazo e chega depois da viagem de
 * rede, sempre — sem essa folga, a prova que o próprio sistema decidiu entregar
 * seria recusada pelo próprio sistema.
 *
 * ## O que faltava
 *
 * A folga de transporte pressupõe alguém na frente da tela quando o sinal toca.
 * Nem todo mundo está: a aba escondida atrás de outras, o celular na mochila, o
 * sinal que caiu no fim da prova, o "Forçar Término" que o aplicador clica com
 * a sala ainda respondendo. Passado um minuto e meio, essas pessoas ficavam com
 * a prova inteira gravada no servidor (`exam_progress`, escrito de 12 em 12
 * segundos DURANTE a prova) e nenhum caminho para transformá-la em nota.
 *
 * Este módulo acrescenta a segunda camada: passada a tolerância, a entrega
 * ainda é aceita — mas valendo as respostas do RASCUNHO, e não as do corpo da
 * requisição.
 *
 * Essa troca é o que impede a camada de virar tempo extra. O rascunho para de
 * aceitar gravação no término (`PUT /api/exams/[id]/progress` recusa com a
 * janela fechada), então o que está lá é exatamente o que a pessoa tinha
 * respondido quando a prova acabou. Segurar o POST não compra nada. Responder
 * depois do fim continua impossível; o que passou a ser possível é ENTREGAR
 * depois do fim o que foi respondido antes dele.
 */

export type OrigemDaEntrega =
  /** Dentro da janela: o caso normal. */
  | 'no-prazo'
  /** Na folga de transporte do término: vale o que o cliente mandou. */
  | 'tolerancia'
  /** Depois dela: valem as respostas gravadas no rascunho. */
  | 'rascunho'

export type VereditoDaEntrega =
  | { aceita: true; origem: OrigemDaEntrega; atrasoMs: number }
  | { aceita: false; motivo: string }

export interface PedidoDeEntrega {
  /** A prova como está no banco — a fonte da janela e da tolerância. */
  prova: Partial<Exam> | null | undefined
  /** A janela já resolvida pelo relógio do SERVIDOR, para não recalcular. */
  janela: JanelaDaProva
  agora: Date
  /** Quantas respostas o rascunho do servidor guardou. */
  respostasGravadas: number
}

/** Quanto tempo passou do término, em ms (0 quando ainda não terminou). */
export function atrasoDaEntrega(janela: JanelaDaProva, agora: Date): number {
  const fim = janela.terminaEm ? new Date(janela.terminaEm).getTime() : null
  if (fim === null || !Number.isFinite(fim)) return 0
  return Math.max(0, agora.getTime() - fim)
}

/**
 * A entrega é aceita? E, se for, valendo as respostas de quem?
 *
 * A ordem das perguntas importa: a prova que ainda NÃO começou é recusada antes
 * de qualquer folga — nenhuma delas fala sobre esse caso, e tratar "antes do
 * início" como "depois do fim" devolveria a mensagem errada para quem chegou
 * cedo, além de virar tempo de prova adiantado.
 */
export function avaliarEntrega(pedido: PedidoDeEntrega): VereditoDaEntrega {
  const { janela, agora } = pedido

  if (janela.podeEnviar) return { aceita: true, origem: 'no-prazo', atrasoMs: 0 }

  if (!janela.encerrada) {
    return { aceita: false, motivo: janela.motivo || 'A prova ainda não começou.' }
  }

  const atrasoMs = atrasoDaEntrega(janela, agora)

  if (podeEntregarNoLimite(pedido.prova, agora)) {
    return { aceita: true, origem: 'tolerancia', atrasoMs }
  }

  if (pedido.respostasGravadas > 0) {
    return { aceita: true, origem: 'rascunho', atrasoMs }
  }

  return {
    aceita: false,
    motivo: janela.motivo || 'A prova já terminou e não há respostas gravadas para entregar.',
  }
}
