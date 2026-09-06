'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle, ArrowDown, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Portal } from '@/components/ui/portal'
import type { PendenciaParaIniciar } from '@/lib/provas/aviso-de-inicio'

/**
 * "A prova começou" — no meio da tela, não no canto dela.
 *
 * Quem está na sala de espera está olhando a contagem regressiva, não o canto
 * superior direito onde o toast antigo aparecia por cinco segundos. E o botão
 * que ela precisa apertar mora no fim de uma tela alta: num tablet em retrato,
 * abaixo do painel de portões e do campo de assinatura, ele está fora da dobra.
 * O anúncio do início não pode ser mais discreto que o layout que o esconde.
 *
 * Por isso este aviso é modal: ele para a tela, diz que a prova está liberada e
 * traz o botão para dentro dele — a pessoa começa daqui, sem rolar atrás de
 * nada. Quem prefere conferir a tela antes fecha o aviso, e o fechamento leva
 * a página até o botão (`onFechar`), que é o gesto que ela teria de descobrir
 * sozinha.
 *
 * Quando ainda falta alguma coisa (assinatura, nome, frase-tema), o botão não
 * mente: ele vira "Ir para a assinatura" e leva até o campo. Ver
 * `lib/provas/aviso-de-inicio.ts`, onde essa decisão mora.
 */
export function AvisoProvaLiberada({
  aberto,
  tituloDaProva,
  pendencia,
  onIniciar,
  onResolverPendencia,
  onFechar,
}: {
  aberto: boolean
  tituloDaProva: string
  pendencia: PendenciaParaIniciar | null
  onIniciar: () => void
  onResolverPendencia: (alvo: string | null) => void
  onFechar: () => void
}) {
  const botaoRef = useRef<HTMLButtonElement>(null)

  /*
   * O foco vai para a ação assim que o aviso abre — é o que faz o modal
   * funcionar no teclado e no leitor de tela, e é também o que garante que o
   * Enter de quem está com a mão no teclado comece a prova em vez de cair no
   * botão que estava focado atrás do véu.
   */
  useEffect(() => {
    if (!aberto) return
    const foco = window.setTimeout(() => botaoRef.current?.focus(), 60)

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoTeclar)

    return () => {
      window.clearTimeout(foco)
      window.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="aviso-prova-liberada-titulo"
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      >
        {/*
          O véu é clicável para fechar, como qualquer modal — mas fechar aqui
          não é "cancelar": é "vou conferir a tela primeiro", e por isso leva
          junto até o botão de iniciar.
        */}
        <div
          aria-hidden
          onClick={onFechar}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm exam-aviso-veu"
        />

        <div className="exam-aviso-cartao relative w-full max-w-md overflow-hidden rounded-3xl border border-emerald-500/30 bg-background shadow-2xl">
          <div className="h-1.5 bg-gradient-to-r from-[#468152] via-emerald-400 to-[#E2A43E]" />

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar aviso"
            className="absolute right-3 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-5 p-6 sm:p-7">
            <div className="space-y-2.5 text-center">
              <div className="relative mx-auto inline-flex h-16 w-16 items-center justify-center">
                <span
                  aria-hidden
                  className="exam-aviso-halo absolute inset-0 rounded-full bg-emerald-500/20"
                />
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#468152] to-[#3a6d44] shadow-lg shadow-emerald-500/30">
                  <Play className="h-6 w-6 fill-current text-white" />
                </span>
              </div>

              <h2 id="aviso-prova-liberada-titulo" className="text-xl font-bold tracking-tight sm:text-2xl">
                A prova começou!
              </h2>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{tituloDaProva}</span> já está liberada —
                você pode começar agora.
              </p>
            </div>

            {pendencia && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/35 bg-amber-50/60 p-3.5 text-left dark:bg-amber-950/20">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-800 dark:text-amber-200">{pendencia.descricao}</p>
              </div>
            )}

            <div className="space-y-2.5">
              <Button
                ref={botaoRef}
                size="lg"
                className={`relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#468152] to-[#3a6d44] font-semibold text-white shadow-md shadow-emerald-500/20 hover:from-[#3a6d44] hover:to-[#2f5a38] ${
                  pendencia ? '' : 'exam-botao-chama'
                }`}
                onClick={() => (pendencia ? onResolverPendencia(pendencia.alvo) : onIniciar())}
              >
                {pendencia ? (
                  pendencia.rotuloDoBotao
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    Iniciar Prova Agora
                  </>
                )}
              </Button>

              {/*
                A segunda saída existe para quem quer ler a tela antes de
                começar — e ela diz para onde leva, porque o botão de iniciar
                está lá embaixo justamente na tela em que isto é um problema.
              */}
              <Button variant="ghost" className="h-10 w-full rounded-xl text-sm" onClick={onFechar}>
                <ArrowDown className="mr-1.5 h-3.5 w-3.5" />
                Ver a tela antes de começar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
