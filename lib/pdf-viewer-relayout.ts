/**
 * Rotação de tela e mudança de tamanho da viewport no leitor de PDF.
 *
 * Só a CONTA — nada de DOM, nada de React. O leitor
 * (`components/materiais/secure-pdf-viewer.tsx`) traz os números medidos e
 * pergunta aqui duas coisas: "esta medida ainda vale?" e "isto foi uma
 * rotação?".
 *
 * Este arquivo existe por causa de um defeito específico do iPad/tablet: girar
 * a tela fazia o leitor piscar e trocar de página dezenas de vezes seguidas.
 *
 * A causa é sempre a mesma conta. O leitor descobre em que página está
 * dividindo o DESLOCAMENTO da rolagem pela "casa" que cada página ocupa:
 *
 *     índice = deslocamento / casa
 *
 * Ao girar, a casa muda de tamanho — na fileira horizontal ela é exatamente a
 * largura visível, e na pilha vertical o ajuste automático de zoom mexe na
 * altura. Só que o navegador PRESERVA o deslocamento antigo, em pixels. Por
 * alguns quadros a conta roda com deslocamento velho e casa nova, e o
 * resultado é uma página qualquer, longe da que o leitor está lendo. Como a
 * animação de rotação passa por várias larguras intermediárias, o erro se
 * repete a cada quadro: a página atual pula, a janela de virtualização
 * persegue a página atual montando e desmontando páginas, e cada montagem
 * gera novos eventos de rolagem que alimentam a conta errada de novo.
 *
 * A regra que fecha essa porta: uma medida de deslocamento só vale quando a
 * casa NÃO mudou de tamanho desde que aquele deslocamento foi produzido.
 * Quando mudou, não há chute que salve — a medida é descartada e quem diz onde
 * a leitura está é a página que o leitor já estava lendo.
 */

/** Espera depois do ÚLTIMO evento de mudança de tamanho antes de reposicionar. */
export const RELAYOUT_SETTLE_MS = 260

export interface PageIndexInput {
  /** Deslocamento da leitura, em px, dentro da pilha (vertical) ou fileira (horizontal). */
  offset: number
  /** Tamanho da casa de cada página AGORA. */
  slot: number
  /** Tamanho da casa quando o navegador produziu `offset`. */
  slotWhenScrolled: number
  /** Quantas páginas existem. */
  count: number
}

/**
 * Índice da página no deslocamento dado — ou `null` quando a medida não é
 * confiável (é o caso durante uma rotação, ver o cabeçalho do arquivo).
 *
 * Devolver `null` em vez de um número aproximado é o ponto: um índice errado
 * não fica parado, ele arrasta a página atual e a janela de virtualização
 * atrás dele. Melhor não responder e deixar a página atual como está.
 */
export function measurePageIndex({ offset, slot, slotWhenScrolled, count }: PageIndexInput): number | null {
  if (!Number.isFinite(offset) || !(count > 0)) return null
  if (!(slot > 0) || !(slotWhenScrolled > 0)) return null
  // Meio pixel de folga: arredondamentos de layout não são mudança de casa.
  if (Math.abs(slot - slotWhenScrolled) > 0.5) return null
  return Math.min(count - 1, Math.max(0, Math.round(offset / slot)))
}

/**
 * A viewport mudou de tamanho de um jeito que refaz o layout das páginas?
 *
 * Compara só a LARGURA de propósito. No Safari do iOS a ALTURA da viewport
 * muda o tempo todo sem que nada de layout aconteça: a barra de endereço
 * encolhe ao rolar, o teclado sobe, a barra de ferramentas volta. Tratar essas
 * mudanças como rotação faria o leitor congelar e reposicionar a leitura no
 * meio de uma rolagem comum — trocaria um defeito por outro.
 */
export function isViewportRelayout(previousWidth: number, nextWidth: number) {
  if (!Number.isFinite(previousWidth) || !Number.isFinite(nextWidth)) return false
  return Math.abs(nextWidth - previousWidth) >= 1
}
