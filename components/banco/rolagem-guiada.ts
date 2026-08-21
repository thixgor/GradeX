/**
 * Rolagem guiada — levar a pessoa até o trecho que ela precisa ler.
 *
 * ## O problema
 *
 * Ao conferir uma questão, o veredito ("errou") aparece na barra do rodapé,
 * mas o MOTIVO — a explicação — está a três telas de rolagem dali. Nos testes
 * a pessoa clicava em "Próxima" sem nunca ter lido por que errou: nada na tela
 * dizia que havia algo embaixo.
 *
 * O remédio não é repetir a explicação no rodapé (o texto é longo demais para
 * caber num painel de 40% da tela): é LEVAR até ela, com um movimento que a
 * pessoa consegue acompanhar com os olhos. Um salto instantâneo não ensina
 * onde o conteúdo estava; a rolagem animada ensina.
 *
 * ## Por que não `scrollIntoView({ behavior: 'smooth' })`
 *
 * A curva do navegador é linear-ish e a duração não é controlável: em telas
 * longas o percurso vira uma espera, em telas curtas some antes de ser visto.
 * Aqui a duração é proporcional à distância, com teto, e a curva é um
 * ease-out — começa rápido (a atenção acompanha) e freia no destino (o olho
 * assenta onde deve ler).
 *
 * Qualquer gesto de rolagem cancela a animação na hora: nunca disputamos o
 * scroll com quem está mexendo nele.
 */

const CURVA = (t: number) => 1 - Math.pow(1 - t, 3) // easeOutCubic

/** `true` quando o sistema pede menos movimento. */
function menosMovimento(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function rolarAte(
  alvo: HTMLElement | null,
  opcoes: {
    /** Folga acima do alvo, em px. Deixe espaço para barras fixas no topo. */
    margemTopo?: number
    /** Chamado ao fim (ou no cancelamento) — serve para acender o destaque. */
    aoChegar?: () => void
  } = {},
): void {
  if (typeof window === 'undefined' || !alvo) return

  const { margemTopo = 88, aoChegar } = opcoes

  const limite = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  )
  const destino = Math.min(
    limite,
    Math.max(0, window.scrollY + alvo.getBoundingClientRect().top - margemTopo),
  )
  const inicio = window.scrollY
  const distancia = destino - inicio

  if (Math.abs(distancia) < 4) {
    aoChegar?.()
    return
  }

  if (menosMovimento()) {
    window.scrollTo({ top: destino, behavior: 'auto' })
    aoChegar?.()
    return
  }

  // Perto: 320ms. Longe: até 780ms. Sem isso, uma questão com imagem e cinco
  // alternativas gastaria dois segundos de animação — tempo em que a pessoa já
  // desistiu de olhar.
  const duracao = Math.min(780, Math.max(320, Math.abs(distancia) * 0.6))
  const partida = performance.now()
  let quadro = 0
  let cancelado = false

  const opcoesDeEscuta: AddEventListenerOptions = { passive: true }

  const desmontar = () => {
    cancelAnimationFrame(quadro)
    window.removeEventListener('wheel', cancelar, opcoesDeEscuta)
    window.removeEventListener('touchstart', cancelar, opcoesDeEscuta)
    window.removeEventListener('keydown', cancelar)
  }

  function cancelar() {
    cancelado = true
    desmontar()
    aoChegar?.()
  }

  const passo = (agora: number) => {
    if (cancelado) return
    const t = Math.min(1, (agora - partida) / duracao)
    window.scrollTo(0, inicio + distancia * CURVA(t))
    if (t < 1) {
      quadro = requestAnimationFrame(passo)
      return
    }
    desmontar()
    aoChegar?.()
  }

  window.addEventListener('wheel', cancelar, opcoesDeEscuta)
  window.addEventListener('touchstart', cancelar, opcoesDeEscuta)
  window.addEventListener('keydown', cancelar)
  quadro = requestAnimationFrame(passo)
}
