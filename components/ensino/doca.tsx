'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion'
import { Compass, Route, RotateCcw, Search, Sparkles, StickyNote, X } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * A doca da Área de Ensino — um seletor deslizante de vidro.
 *
 * POR QUE ELA FLUTUA EMBAIXO
 *
 * A navegação anterior era uma barra presa ao topo. Funcionava no desktop e
 * falhava exatamente onde a plataforma mais é usada: no celular, em pé, com uma
 * mão. Trocar de "assistindo" para "revisar" exigia rolar até o topo — e quem
 * está entre um plantão e outro simplesmente não rola.
 *
 * ELA É UM SLIDER DE VERDADE, NÃO UM INDICADOR QUE ANIMA
 *
 * A pílula não apenas escorrega quando a rota muda: ela é ARRASTÁVEL. O dedo
 * pega o vidro e o leva pelos destinos; enquanto atravessa, o ícone sob ela vai
 * acendendo, e ao soltar ela encaixa no segmento mais próximo e navega.
 *
 * Essa diferença importa porque muda a natureza do controle. Uma barra de abas
 * é uma lista de botões; um seletor deslizante é um EIXO — ele diz que os
 * destinos são posições contínuas de uma mesma área, e deixa percorrer os cinco
 * com um gesto só, sem cinco toques. Tocar continua funcionando, claro: o
 * gesto é um atalho, nunca o único caminho.
 *
 * Para o arrasto existir, todos os segmentos têm a MESMA largura. Um seletor
 * com segmentos de tamanhos diferentes não tem um passo constante, e o encaixe
 * ficaria imprevisível justamente no meio do gesto.
 *
 * O VIDRO NÃO É ENFEITE
 *
 * Como ela fica sobre o conteúdo o tempo todo, uma barra opaca esconderia
 * permanentemente uma faixa da tela. O material está em `globals.css`
 * (`.doca-vidro`), com fundo sólido de reserva para quem não tem
 * `backdrop-filter` — vidro que degrada para "texto sobre texto" é pior que
 * barra opaca.
 */

const DESTINOS = [
  { href: '/aulas', rotulo: 'Aprender', icone: Sparkles, exato: true },
  { href: '/aulas/trilhas', rotulo: 'Trilhas', icone: Route },
  { href: '/aulas/explorar', rotulo: 'Explorar', icone: Compass },
  { href: '/aulas/revisar', rotulo: 'Revisar', icone: RotateCcw },
  { href: '/aulas/anotacoes', rotulo: 'Notas', icone: StickyNote },
]

/**
 * O respiro que impede a doca de cobrir o fim do conteúdo.
 *
 * É uma constante e não um `pb-32` digitado em cada página porque a altura da
 * doca é uma só: quando ela mudar, o respiro muda junto. Sete paddings soltos
 * divergiriam no primeiro ajuste, e o sintoma seria o último item de uma lista
 * escondido atrás do vidro — o defeito que ninguém reporta e todo mundo sente.
 */
export const RESPIRO_DA_DOCA = 'pb-32 sm:pb-36'

const limitar = (valor: number, minimo: number, maximo: number) =>
  Math.min(maximo, Math.max(minimo, valor))

export function DocaDeEnsino({ className }: { className?: string }) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const semMovimento = useReducedMotion()

  const [buscando, setBuscando] = useState(false)
  const [termo, setTermo] = useState('')
  const campo = useRef<HTMLInputElement>(null)

  /* ── A pista e o passo ────────────────────────────────────────────── */

  const pista = useRef<HTMLDivElement>(null)
  const [passo, setPasso] = useState(0)
  const x = useMotionValue(0)
  const [arrastando, setArrastando] = useState(false)

  const indiceDaRota = Math.max(
    0,
    DESTINOS.findIndex((d) => (d.exato ? pathname === d.href : pathname.startsWith(d.href))),
  )

  /**
   * O índice que a pílula está cobrindo AGORA.
   *
   * Durante o arrasto ele descola da rota: é o que faz o ícone acender antes
   * de a navegação acontecer. Sem essa separação, o gesto não daria retorno
   * nenhum até o dedo sair da tela.
   */
  const [indiceVisual, setIndiceVisual] = useState(indiceDaRota)

  /** Mede o passo do seletor — a pista dividida pelo número de destinos. */
  useEffect(() => {
    const elemento = pista.current
    if (!elemento) return

    const medir = () => setPasso(elemento.clientWidth / DESTINOS.length)
    medir()

    const observador = new ResizeObserver(medir)
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [buscando])

  /** Recoloca a pílula quando a rota muda — mas nunca no meio de um gesto. */
  useEffect(() => {
    if (arrastando || passo === 0) return
    setIndiceVisual(indiceDaRota)
    const destino = indiceDaRota * passo
    if (semMovimento) {
      x.set(destino)
      return
    }
    const controle = animate(x, destino, { type: 'spring', stiffness: 420, damping: 38 })
    return () => controle.stop()
  }, [indiceDaRota, passo, arrastando, semMovimento, x])

  /** O segmento sob a pílula, a partir da posição dela. */
  const indiceEm = useCallback(
    (posicao: number) =>
      passo > 0 ? limitar(Math.round(posicao / passo), 0, DESTINOS.length - 1) : 0,
    [passo],
  )

  /* ── Busca ────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (buscando) campo.current?.focus()
  }, [buscando])

  useEffect(() => {
    if (!buscando) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBuscando(false)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [buscando])

  function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    const limpo = termo.trim()
    if (limpo.length < 2) return
    setBuscando(false)
    router.push(`/aulas/buscar?q=${encodeURIComponent(limpo)}`)
  }

  return (
    <div
      className={cn(
        // `pointer-events-none` no invólucro para a faixa vazia dos lados não
        // roubar cliques do conteúdo que passa por baixo.
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center',
        'px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      <motion.nav
        aria-label="Navegação da Área de Ensino"
        initial={semMovimento ? false : { y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.15 }}
        className="pointer-events-auto flex max-w-full items-end gap-2"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {buscando ? (
            /* A busca ocupa a doca inteira em vez de abrir um campo espremido
               ao lado dos ícones: digitar num campo de 90px é o tipo de coisa
               que faz alguém desistir da busca. */
            <motion.form
              key="busca"
              onSubmit={enviar}
              initial={semMovimento ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={semMovimento ? {} : { opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="doca-vidro flex h-[4.25rem] w-[min(30rem,calc(100vw-1.5rem))] items-center gap-2 rounded-[2rem] px-2 pl-5"
            >
              <Search className="h-5 w-5 flex-none text-muted-foreground" />
              <input
                ref={campo}
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Buscar aula, trilha, resumo…"
                aria-label="Buscar na Área de Ensino"
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => {
                  setTermo('')
                  setBuscando(false)
                }}
                aria-label="Fechar busca"
                className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/5 active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="seletor"
              initial={semMovimento ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={semMovimento ? {} : { opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="doca-vidro h-[4.25rem] rounded-[2rem] p-1.5"
            >
              <div
                ref={pista}
                className="relative flex h-full w-[min(23rem,calc(100vw-6rem))] items-stretch sm:w-[26rem]"
              >
                {/* ── A pílula arrastável ──────────────────────────────
                    Ela fica ACIMA dos segmentos para receber o gesto. Como
                    cobre exatamente o item ativo, o único clique que ela
                    intercepta é o do destino em que já se está — e esse
                    clique não teria efeito de qualquer forma. */}
                {passo > 0 ? (
                  <motion.div
                    drag={semMovimento ? false : 'x'}
                    dragConstraints={{ left: 0, right: passo * (DESTINOS.length - 1) }}
                    dragElastic={0.04}
                    dragMomentum={false}
                    onDragStart={() => setArrastando(true)}
                    onDrag={() => setIndiceVisual(indiceEm(x.get()))}
                    onDragEnd={() => {
                      const alvo = indiceEm(x.get())
                      setArrastando(false)
                      setIndiceVisual(alvo)
                      animate(x, alvo * passo, { type: 'spring', stiffness: 500, damping: 40 })
                      if (alvo !== indiceDaRota) router.push(DESTINOS[alvo].href)
                    }}
                    whileDrag={{ scale: 1.06 }}
                    style={{ x, width: passo }}
                    className="doca-pilula absolute inset-y-0 left-0 z-10 cursor-grab touch-none rounded-[1.6rem] active:cursor-grabbing"
                    aria-hidden
                  />
                ) : null}

                {DESTINOS.map((destino, indice) => {
                  const Icone = destino.icone
                  const aceso = indice === indiceVisual

                  return (
                    <Link
                      key={destino.href}
                      href={destino.href}
                      aria-current={aceso ? 'page' : undefined}
                      onClick={() => setIndiceVisual(indice)}
                      className={cn(
                        'relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[1.6rem]',
                        'transition-colors duration-200',
                        aceso ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Icone
                        className={cn(
                          'h-[1.3rem] w-[1.3rem] transition-transform duration-200',
                          aceso && 'scale-110',
                        )}
                        strokeWidth={aceso ? 2.6 : 2}
                      />
                      <span
                        className={cn(
                          'text-[10px] leading-none tracking-tight transition-all duration-200 sm:text-[11px]',
                          aceso ? 'font-extrabold' : 'font-semibold',
                        )}
                      >
                        {destino.rotulo}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* A busca fica FORA do seletor, como peça própria: como sexto
            segmento ela quebraria o passo constante de que o arrasto
            depende. */}
        {!buscando ? (
          <motion.button
            key="lupa"
            type="button"
            onClick={() => setBuscando(true)}
            aria-label="Buscar"
            initial={semMovimento ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="doca-vidro flex h-[4.25rem] w-[4.25rem] flex-none items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground active:scale-95"
          >
            <Search className="h-[1.35rem] w-[1.35rem]" strokeWidth={2.2} />
          </motion.button>
        ) : null}
      </motion.nav>
    </div>
  )
}
