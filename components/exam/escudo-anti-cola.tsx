'use client'

import { useEffect } from 'react'
import {
  algumaTravaLigada,
  ehCampoDeEscrita,
  motivoDaTrava,
  type TravasAntiCola,
} from '@/lib/provas/anti-cola'

/**
 * As travas de cópia, aplicadas à tela da prova.
 *
 * ## O que ele faz
 *
 * Instala o mínimo que o navegador permite: sem seleção de texto, sem
 * `Ctrl+C`, sem arrastar o enunciado para outra janela, sem `Ctrl+P` e sem
 * folha de impressão, sem menu do botão direito. Cada trava é independente e
 * decidida na prova (ver `lib/provas/anti-cola.ts`).
 *
 * ## O que ele não faz, e é importante dizer
 *
 * Não impede foto de celular nem `PrintScreen` — o sistema operacional não
 * pergunta nada ao site antes de capturar a tela, e um `keydown` de
 * PrintScreen não chega para todos os teclados nem cancela nada. Prometer
 * isso na interface do admin seria mentir; quem precisa desse nível tem a
 * marca d'água com o nome de quem baixou e o monitoramento por câmera.
 *
 * ## Os dois cuidados
 *
 * **Campo de escrita passa.** Discursiva e redação precisam de seleção — é o
 * texto do próprio aluno. `ehCampoDeEscrita` é o que separa a trava do
 * defeito.
 *
 * **A tecla morta é explicada.** Um `Ctrl+P` que simplesmente não faz nada
 * parece defeito, e defeito no meio da prova vira "o site travou" contado ao
 * professor depois. Cada bloqueio chama `aoBloquear`, e a tela diz o que
 * aconteceu.
 */

/** O id do `<style>` da folha de impressão, para não empilhar cópias dele. */
const ID_DO_ESTILO = 'exam-anti-cola-impressao'

export function EscudoAntiCola({
  travas,
  ativo = true,
  aoBloquear,
}: {
  travas: TravasAntiCola
  /** Desligado fora da prova em si (a sala de espera, a tela de resultado). */
  ativo?: boolean
  aoBloquear?: (mensagem: string) => void
}) {
  const { copia, impressao, menu } = travas
  const ligado = ativo && algumaTravaLigada(travas)

  useEffect(() => {
    if (!ligado) return

    const avisar = (qual: Parameters<typeof motivoDaTrava>[0]) => {
      aoBloquear?.(motivoDaTrava(qual))
    }

    const barrarCopia = (evento: Event) => {
      if (ehCampoDeEscrita(evento.target)) return
      evento.preventDefault()
      avisar('copia')
    }

    /*
     * Arrastar sai; SELECIONAR fica.
     *
     * A primeira versão barrava `selectstart` e punha `user-select: none` no
     * corpo — e isso desligava o grifo, que é a ferramenta de estudo da prova
     * (`components/highlightable-text.tsx` marca o texto a partir de
     * `window.getSelection()`). O aluno pode perder o copiar; não pode perder
     * o grifar.
     *
     * Selecionar não tira nada da tela por si só: o que tira é o `copy`, o
     * `cut`, o arrastar para outra janela e o menu do botão direito — e esses
     * quatro continuam barrados. A seleção fica de pé para quem está
     * estudando em cima do enunciado.
     */
    const barrarArrastar = (evento: Event) => {
      if (ehCampoDeEscrita(evento.target)) return
      evento.preventDefault()
    }

    const barrarMenu = (evento: Event) => {
      if (ehCampoDeEscrita(evento.target)) return
      evento.preventDefault()
      avisar('menu')
    }

    const barrarTeclas = (evento: KeyboardEvent) => {
      const comando = evento.ctrlKey || evento.metaKey
      if (!comando) return
      const tecla = evento.key.toLowerCase()

      if (impressao && tecla === 'p') {
        evento.preventDefault()
        avisar('impressao')
        return
      }
      if (!copia) return
      /*
       * Só `c` (copiar) e `x` (recortar).
       *
       * `a` (selecionar tudo) ficou de fora junto com a trava de seleção: ele
       * é o começo de grifar um parágrafo inteiro, e sozinho não tira nada da
       * tela — quem copiar depois esbarra no `c`. E `v` (colar) nunca entrou:
       * colar não tira nada da prova.
       */
      if (['c', 'x'].includes(tecla) && !ehCampoDeEscrita(evento.target)) {
        evento.preventDefault()
        avisar('copia')
      }
    }

    /*
     * A impressão não depende só do atalho: o menu do navegador tem "Imprimir",
     * e `beforeprint` não é cancelável. A folha de impressão é o que resolve —
     * o papel sai com o aviso e nada do conteúdo.
     */
    if (impressao) {
      const anterior = document.getElementById(ID_DO_ESTILO)
      if (!anterior) {
        const estilo = document.createElement('style')
        estilo.id = ID_DO_ESTILO
        estilo.textContent = `
          @media print {
            body > * { display: none !important; }
            body::after {
              content: "Esta prova não permite impressão.";
              display: block;
              padding: 4rem 2rem;
              font: 600 14pt system-ui, sans-serif;
              text-align: center;
            }
          }
        `
        document.head.appendChild(estilo)
      }
    }

    if (copia) {
      document.addEventListener('copy', barrarCopia)
      document.addEventListener('cut', barrarCopia)
      document.addEventListener('dragstart', barrarArrastar)
      document.body.classList.add('exam-sem-copia')
    }
    if (menu) document.addEventListener('contextmenu', barrarMenu)
    document.addEventListener('keydown', barrarTeclas)

    return () => {
      document.removeEventListener('copy', barrarCopia)
      document.removeEventListener('cut', barrarCopia)
      document.removeEventListener('dragstart', barrarArrastar)
      document.removeEventListener('contextmenu', barrarMenu)
      document.removeEventListener('keydown', barrarTeclas)
      document.body.classList.remove('exam-sem-copia')
      // A folha de impressão sai junto: deixá-la para trás faria a próxima
      // tela do site sair em branco no papel, sem ninguém entender por quê.
      document.getElementById(ID_DO_ESTILO)?.remove()
    }
  }, [ligado, copia, impressao, menu, aoBloquear])

  return null
}
