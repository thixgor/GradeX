'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Compass, Route, RotateCcw, Search, Sparkles, StickyNote, X } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * A doca da Área de Ensino.
 *
 * POR QUE ELA FLUTUA EMBAIXO
 *
 * A navegação anterior era uma barra presa ao topo. Funcionava no desktop e
 * falhava exatamente onde a plataforma mais é usada: no celular, em pé, com uma
 * mão. Trocar de "assistindo" para "revisar" exigia rolar até o topo — e quem
 * está entre um plantão e outro simplesmente não rola.
 *
 * A doca fica fixa na base, ao alcance do polegar, e acompanha a página inteira.
 * É a mesma decisão que a barra de abas do iOS toma há quinze anos, e o motivo
 * é o mesmo.
 *
 * O VIDRO NÃO É ENFEITE
 *
 * Porque ela fica SOBRE o conteúdo o tempo todo, uma barra opaca esconderia
 * permanentemente uma faixa da tela. O vidro devolve essa faixa: o aluno vê o
 * caminho da Trilha passando por baixo enquanto rola. O material está em
 * `globals.css` (`.doca-vidro`), com fundo sólido de reserva para quem não tem
 * `backdrop-filter` — vidro que degrada para "texto sobre texto" é pior que
 * barra opaca.
 *
 * O INDICADOR DESLIZA, E ISSO CARREGA SIGNIFICADO
 *
 * A pílula ativa não pisca de um item para outro: ela percorre o caminho, com
 * `layoutId`. O movimento diz que os destinos são vizinhos numa mesma área, e
 * não telas soltas — que é precisamente a relação entre Aprender, Trilhas,
 * Explorar e Revisar.
 *
 * O RÓTULO SÓ APARECE NO ATIVO
 *
 * Cinco rótulos permanentes não cabem em 390px sem virar tipografia de bula. O
 * rótulo entra junto com a pílula, animando a largura: o item ativo se anuncia,
 * os outros ficam com o ícone — que é o que o dedo procura de qualquer forma.
 */

const DESTINOS = [
  { href: '/aulas', rotulo: 'Aprender', icone: Sparkles, exato: true },
  { href: '/aulas/trilhas', rotulo: 'Trilhas', icone: Route },
  { href: '/aulas/explorar', rotulo: 'Explorar', icone: Compass },
  { href: '/aulas/revisar', rotulo: 'Revisar', icone: RotateCcw },
  { href: '/aulas/anotacoes', rotulo: 'Anotações', icone: StickyNote },
]

export function DocaDeEnsino({ className }: { className?: string }) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const semMovimento = useReducedMotion()

  const [buscando, setBuscando] = useState(false)
  const [termo, setTermo] = useState('')
  const campo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (buscando) campo.current?.focus()
  }, [buscando])

  /**
   * `Esc` fecha a busca.
   *
   * A doca cobre a base da tela; sem uma saída de teclado, quem abriu a busca
   * sem querer no desktop fica preso a caçar o × com o mouse.
   */
  useEffect(() => {
    if (!buscando) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBuscando(false)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [buscando])

  const ativo = (destino: (typeof DESTINOS)[number]) =>
    destino.exato ? pathname === destino.href : pathname.startsWith(destino.href)

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
        initial={semMovimento ? false : { y: 70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.15 }}
        className="pointer-events-auto flex max-w-full items-center gap-1.5"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {buscando ? (
            /* ── Busca ────────────────────────────────────────────────
               Ela ocupa a doca inteira em vez de abrir um campo espremido
               ao lado dos ícones: digitar num campo de 90px é o tipo de
               coisa que faz alguém desistir da busca. */
            <motion.form
              key="busca"
              onSubmit={enviar}
              initial={semMovimento ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={semMovimento ? {} : { opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="doca-vidro flex h-14 w-[min(28rem,calc(100vw-1.5rem))] items-center gap-2 rounded-[1.75rem] px-2 pl-4"
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
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/5 active:scale-90"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="destinos"
              initial={semMovimento ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={semMovimento ? {} : { opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="doca-vidro flex h-14 items-center gap-0.5 rounded-[1.75rem] p-1.5"
            >
              {DESTINOS.map((destino) => {
                const Icone = destino.icone
                const selecionado = ativo(destino)

                return (
                  <Link
                    key={destino.href}
                    href={destino.href}
                    aria-current={selecionado ? 'page' : undefined}
                    title={destino.rotulo}
                    className={cn(
                      'relative flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2.5',
                      'transition-colors duration-200 active:scale-95',
                      selecionado
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {/* A pílula compartilhada: um elemento só, que o
                        framer-motion move entre os itens. Duas pílulas com
                        opacidade cruzada dariam um "fade", não um percurso. */}
                    {selecionado ? (
                      <motion.span
                        layoutId="doca-indicador"
                        transition={
                          semMovimento
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 460, damping: 38 }
                        }
                        className="doca-pilula absolute inset-0 rounded-full"
                      />
                    ) : null}

                    <Icone
                      className="relative h-[1.35rem] w-[1.35rem] flex-none"
                      strokeWidth={selecionado ? 2.6 : 2}
                    />

                    <AnimatePresence initial={false}>
                      {selecionado ? (
                        <motion.span
                          initial={semMovimento ? false : { width: 0, opacity: 0 }}
                          animate={{ width: 'auto', opacity: 1 }}
                          exit={semMovimento ? {} : { width: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                          className="relative overflow-hidden whitespace-nowrap text-[13px] font-bold"
                        >
                          <span className="pr-0.5">{destino.rotulo}</span>
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </Link>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* A busca fica FORA da barra, como uma peça própria — é a mesma
            gramática das ilhas flutuantes do iOS, e evita que o sexto item
            espreme os cinco destinos no celular. */}
        {!buscando ? (
          <motion.button
            key="lupa"
            type="button"
            onClick={() => setBuscando(true)}
            aria-label="Buscar"
            initial={semMovimento ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="doca-vidro flex h-14 w-14 flex-none items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground active:scale-95"
          >
            <Search className="h-[1.35rem] w-[1.35rem]" strokeWidth={2.2} />
          </motion.button>
        ) : null}
      </motion.nav>
    </div>
  )
}

/**
 * O respiro que impede a doca de cobrir o fim do conteúdo.
 *
 * É uma constante e não um `pb-28` digitado em cada página porque a altura da
 * doca é uma só: quando ela mudar, o respiro muda junto. Seis paddings soltos
 * divergiriam no primeiro ajuste, e o sintoma seria o último item de uma lista
 * escondido atrás do vidro — o defeito que ninguém reporta e todo mundo sente.
 */
export const RESPIRO_DA_DOCA = 'pb-28 sm:pb-32'
