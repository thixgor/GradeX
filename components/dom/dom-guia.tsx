'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Pause, Play, X } from 'lucide-react'
import { DomMascote, type EstadoDoDom } from './dom-mascote'
import { falaDe, textoDaFala, type Fala, type MomentoDaFala } from './falas'
import { bipe, falar, pararDeFalar } from './voz'
import './dom.css'

/**
 * O Dom como guia: ele chama ("Psiu! Toca em mim"), e no toque passeia pela
 * página com a pessoa — rola até cada parte, acende um contorno nela, troca
 * de lado da tela (com pulinho e a cauda abanando) e explica com a voz
 * gravada. Cada passo avança sozinho quando a fala termina; dá para pausar,
 * pular e encerrar.
 *
 * Serve à landing (`passos` da landing) e ao tour de boas-vindas do site
 * (`components/tour-do-topo.tsx`). Quem usa só descreve os passos.
 */

export interface PassoDoGuia {
  momento: MomentoDaFala
  /** Seletor do que destacar e mostrar. Sem alvo: o Dom fala onde está. */
  alvo?: string
  /** Lado da tela onde o Dom fica neste passo. */
  lado?: 'esquerda' | 'direita'
  /** Executado ao entrar no passo (ex.: abrir o cartão de um produto). */
  aoEntrar?: () => void
  /** Botão de ação do último passo. */
  acao?: { rotulo: string; aoTocar: () => void }
}

interface Props {
  passos: PassoDoGuia[]
  /** Fala do convite antes do toque. `null` = começa direto (o tour do site). */
  convite?: MomentoDaFala | null
  /** Chamado ao terminar ou encerrar. */
  aoFim?: (concluiu: boolean) => void
  /** Começa sem esperar o toque no convite. */
  comecarJa?: boolean
}

const PAUSA_ENTRE_PASSOS_MS = 900

export function DomGuia({ passos, convite = 'landingConvite', aoFim, comecarJa = false }: Props) {
  const [fase, setFase] = useState<'convite' | 'passeio' | 'fim'>(comecarJa ? 'passeio' : 'convite')
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)
  const [fala, setFala] = useState<Fala | null>(null)
  const [falando, setFalando] = useState(false)
  const [boca, setBoca] = useState(false)
  const [andando, setAndando] = useState(false)
  const [visivel, setVisivel] = useState(false)
  const destacado = useRef<Element | null>(null)
  const avancar = useRef<ReturnType<typeof setTimeout> | null>(null)
  const passo = passos[indice]
  const lado = passo?.lado || (indice % 2 === 0 ? 'direita' : 'esquerda')

  // Convite: aparece depois que a página assentou.
  useEffect(() => {
    const t = setTimeout(() => {
      setVisivel(true)
      if (fase === 'convite' && convite) setFala(falaDe(convite))
    }, comecarJa ? 200 : 2500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const limparDestaque = () => {
    destacado.current?.classList.remove('dom-destaque')
    destacado.current = null
  }

  const encerrar = useCallback(
    (concluiu: boolean) => {
      if (avancar.current) clearTimeout(avancar.current)
      pararDeFalar()
      limparDestaque()
      setFase('fim')
      setFalando(false)
      aoFim?.(concluiu)
    },
    [aoFim],
  )

  // Cada passo: anda até o lado, rola até o alvo, destaca, fala e agenda o próximo.
  useEffect(() => {
    if (fase !== 'passeio' || !passo || pausado) return
    let vivo = true
    setAndando(true)
    limparDestaque()
    passo.aoEntrar?.()
    const alvo = passo.alvo ? document.querySelector(passo.alvo) : null
    if (alvo) {
      alvo.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
      alvo.classList.add('dom-destaque')
      destacado.current = alvo
    }
    const f = falaDe(passo.momento)
    setFala(f)
    const comeca = setTimeout(() => {
      if (!vivo) return
      setAndando(false)
      falar(f, {
        aoComecar: () => setFalando(true),
        aoBoca: setBoca,
        aoTerminar: () => {
          setFalando(false)
          if (!vivo || passo.acao) return
          avancar.current = setTimeout(() => {
            if (indice < passos.length - 1) setIndice((i) => i + 1)
          }, PAUSA_ENTRE_PASSOS_MS)
        },
      })
    }, 650)
    return () => {
      vivo = false
      clearTimeout(comeca)
      if (avancar.current) clearTimeout(avancar.current)
    }
  }, [fase, indice, pausado, passo, passos.length])

  useEffect(() => () => limparDestaque(), [])

  if (fase === 'fim' || !visivel) return null

  const comecar = () => {
    bipe('surgir')
    setFase('passeio')
    setIndice(0)
  }
  const proximo = () => {
    pararDeFalar()
    if (indice < passos.length - 1) setIndice((i) => i + 1)
    else encerrar(true)
  }
  const estado: EstadoDoDom = andando ? 'animado' : falando ? 'explicando' : fase === 'convite' ? 'acenando' : 'feliz'

  return (
    <div className="dom-escopo">
      <div className="dom-guia" data-lado={fase === 'convite' ? 'direita' : lado} data-andando={andando || undefined} data-fase={fase}>
        {fala && (
          <div className="dom-guia__balao" key={fala.id} role="status" aria-live="polite">
            {fase === 'passeio' && (
              <span className="dom-guia__passo">
                {indice + 1} de {passos.length}
              </span>
            )}
            <p>{textoDaFala(fala)}</p>
            {fase === 'convite' ? (
              <div className="dom-guia__acoes">
                <button type="button" className="dom-botao dom-botao--principal px-3 py-2 text-[0.8rem]" onClick={comecar}>
                  <Play className="h-3.5 w-3.5" aria-hidden /> Me mostra
                </button>
                <button type="button" className="dom-msg__mini" onClick={() => encerrar(false)}>
                  Agora não
                </button>
              </div>
            ) : (
              <div className="dom-guia__acoes">
                {passo?.acao ? (
                  <button
                    type="button"
                    className="dom-botao dom-botao--principal px-3 py-2 text-[0.8rem]"
                    onClick={() => {
                      passo.acao!.aoTocar()
                      encerrar(true)
                    }}
                  >
                    {passo.acao.rotulo} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : (
                  <button type="button" className="dom-botao dom-botao--suave px-3 py-2 text-[0.78rem]" onClick={proximo}>
                    Próximo <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  className="dom-icone-botao"
                  onClick={() => {
                    if (!pausado) pararDeFalar()
                    setPausado((p) => !p)
                  }}
                  aria-label={pausado ? 'Continuar' : 'Pausar'}
                >
                  {pausado ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
                <button type="button" className="dom-icone-botao" onClick={() => encerrar(false)} aria-label="Encerrar o passeio">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
        <button type="button" className="dom-guia__mascote" onClick={fase === 'convite' ? comecar : proximo} aria-label={fase === 'convite' ? 'Começar o passeio com o Dom' : 'Próximo passo'}>
          <DomMascote estado={estado} falando={falando} boca={boca} />
        </button>
      </div>
    </div>
  )
}
