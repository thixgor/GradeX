'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { RotateCcw, Route, Search, Sparkles, User, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * A doca da Área de Ensino — um seletor deslizante de vidro.
 *
 * ══ OS DESTINOS, E POR QUE TRILHAS VOLTOU ════════════════════════════
 *
 * A barra já teve cinco destinos, foi cortada para quatro (Aprender, Buscar,
 * Revisar, Você) e agora tem cinco de novo — mas não os mesmos. O corte tinha
 * uma razão certa e uma consequência errada.
 *
 * A razão certa: "Explorar" não é um lugar, é uma AÇÃO, e ela já vive dentro
 * do Aprender como a fileira de atalhos por assunto. "Notas" é o caderno que
 * se lê depois, não uma decisão de estudo — foi para dentro de "Você". Esses
 * dois continuam fora, e continuam alcançáveis por link direto.
 *
 * A consequência errada: Trilha é o OBJETO PRINCIPAL da área (§1), e ficou
 * sem porta. Chegar a "todas as Trilhas" passou a exigir abrir o Aprender,
 * rolar até a faixa certa e achar o "ver tudo" — três gestos para o conteúdo
 * que a área inteira existe para organizar, e a queixa que trouxe Trilhas de
 * volta foi exatamente essa ("tá difícil de achar todas as trilhas").
 *
 * O critério: um segmento aqui é para onde se VAI, não o que se FAZ. Trilhas é
 * um acervo com endereço próprio e página completa; Explorar é um recorte do
 * Aprender.
 *
 * ══ ELA É UM SLIDER DE VERDADE ═══════════════════════════════════════
 *
 * A pílula não apenas escorrega quando a rota muda: ela é ARRASTÁVEL. O dedo
 * pega o vidro e o leva pelos destinos; enquanto atravessa, o ícone sob ela vai
 * acendendo, e ao soltar ela encaixa no segmento mais próximo e navega.
 *
 * Para o arrasto existir, todos os segmentos têm a MESMA largura — sem passo
 * constante o encaixe ficaria imprevisível no meio do gesto. Foi por isso que a
 * lupa avulsa saiu: um sexto elemento de outro tamanho ao lado do seletor
 * quebrava a régua e, pior, competia visualmente com a barra (a queixa que
 * originou esta reescrita). Buscar virou um dos segmentos.
 *
 * ══ ELA NÃO PISCA MAIS ENTRE PÁGINAS ═════════════════════════════════
 *
 * Antes cada página montava a sua própria doca. Trocar de destino desmontava
 * uma e montava outra, e a animação de entrada rodava de novo — a barra sumia e
 * voltava a cada navegação, exatamente o oposto de "fluxo deslizante". Agora
 * ela é montada UMA vez, pelo layout de `/aulas` (ver `quadro.tsx`), e sobrevive
 * às trocas de rota: o que muda é a posição da pílula, com a mesma mola de
 * sempre.
 *
 * ══ ELA AVISA A TELA DE QUE OCUPA ESPAÇO ═════════════════════════════
 *
 * O app já tem dois flutuantes no rodapé: o "voltar" do iOS (canto esquerdo) e
 * o "+" de música/suporte (canto direito). Os dois sobem quando alguém publica
 * `--gx-barra-inferior-h` — é a convenção de `components/ui/barra-inferior.tsx`.
 * A doca nunca publicava, então os três dividiam a mesma faixa e se
 * atropelavam. Agora ela mede a própria altura e publica: os outros dois sobem
 * sozinhos, sem precisar saber que a Área de Ensino existe.
 *
 * ══ O VIDRO NÃO É ENFEITE ════════════════════════════════════════════
 *
 * Como ela fica sobre o conteúdo o tempo todo, uma barra opaca esconderia
 * permanentemente uma faixa da tela. O material está em `globals.css`
 * (`.doca-vidro`), com fundo sólido de reserva para quem não tem
 * `backdrop-filter` — vidro que degrada para "texto sobre texto" é pior que
 * barra opaca.
 */

interface Destino {
  href: string
  rotulo: string
  icone: LucideIcon
  /** Casa apenas a rota exata — usado pela home, prefixo de todas as outras. */
  exato?: boolean
  /** Rotas que acendem este segmento sem serem ele (ver `indiceDaRota`). */
  tambem?: string[]
}

const DESTINOS: Destino[] = [
  {
    href: '/aulas',
    rotulo: 'Aprender',
    icone: Sparkles,
    exato: true,
    // Navegar o conteúdo por assunto e assistir são tudo "aprender": são as
    // telas para onde o Aprender manda. Acender outro segmento (ou nenhum)
    // enquanto a pessoa assiste faria a barra mentir sobre onde ela está.
    tambem: ['/aulas/explorar', '/aulas/curso'],
  },
  { href: '/aulas/trilhas', rotulo: 'Trilhas', icone: Route },
  { href: '/aulas/buscar', rotulo: 'Buscar', icone: Search },
  { href: '/aulas/revisar', rotulo: 'Revisar', icone: RotateCcw },
  { href: '/aulas/voce', rotulo: 'Você', icone: User, tambem: ['/aulas/anotacoes'] },
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

/**
 * O respiro simétrico, no alto.
 *
 * Nenhuma das telas de `/aulas` passava um `pt-*` para o próprio conteúdo —
 * só a de assistir tinha um `pt-4` escrito à mão. O resultado era o título de
 * cada página colado direto na régua de baixo do cabeçalho fixo, sem nenhum
 * ar entre os dois: mais visível ainda agora que o cabeçalho virou vidro
 * (`vidro` do AppShell) e o texto por trás dele passou a se misturar com o
 * título da própria página. A mesma lógica do respiro de baixo — uma
 * constante, não um número copiado em oito arquivos.
 */
export const RESPIRO_DO_TOPO = 'pt-6 sm:pt-8'

/** A variável que o "voltar" e o "+" já leem para subir. */
const VARIAVEL_DE_ALTURA = '--gx-barra-inferior-h'

/**
 * As rotas de `/aulas` que NÃO são a experiência do aluno.
 *
 * O painel de gestão (§19) é outro modo de uso, com outra navegação e outro
 * público: deixar a doca do aluno flutuando sobre a tela de importar planilha
 * seria dizer que gerenciar é uma das quatro coisas que se faz na Área de
 * Ensino.
 *
 * A verificação de certificado é a outra: ela é o próprio documento, feita
 * para ser aberta por um terceiro e impressa. Uma barra de navegação por cima
 * apareceria no papel.
 */
function semDoca(pathname: string) {
  return pathname.startsWith('/aulas/gerenciar') || pathname.startsWith('/aulas/certificado')
}

const limitar = (valor: number, minimo: number, maximo: number) =>
  Math.min(maximo, Math.max(minimo, valor))

/** `useLayoutEffect` no cliente, `useEffect` no servidor — evita o aviso do SSR. */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function DocaDeEnsino({ className }: { className?: string }) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const semMovimento = useReducedMotion()

  const oculta = semDoca(pathname)

  /* ── A pista e o passo ────────────────────────────────────────────── */

  const moldura = useRef<HTMLDivElement>(null)
  const pista = useRef<HTMLDivElement>(null)
  const [passo, setPasso] = useState(0)
  const x = useMotionValue(0)
  const [arrastando, setArrastando] = useState(false)

  const indiceDaRota = (() => {
    const achado = DESTINOS.findIndex((d) => {
      if (d.exato ? pathname === d.href : pathname.startsWith(d.href)) return true
      return (d.tambem || []).some((prefixo) => pathname.startsWith(prefixo))
    })
    // A tela de assistir (`/aulas/<id>`) não casa com nenhum prefixo listado:
    // ela cai aqui e acende "Aprender", que é de onde se chega nela.
    return achado >= 0 ? achado : 0
  })()

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
    if (!elemento || oculta) return

    const medir = () => setPasso(elemento.clientWidth / DESTINOS.length)
    medir()

    const observador = new ResizeObserver(medir)
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [oculta])

  /**
   * Publica a altura ocupada para o "voltar" e o "+" subirem.
   *
   * Mede a moldura inteira (barra + respiro da safe-area), porque é essa a
   * faixa que os outros flutuantes precisam evitar — não só o vidro.
   */
  useIsomorphicLayoutEffect(() => {
    const raiz = document.documentElement
    if (oculta) {
      raiz.style.removeProperty(VARIAVEL_DE_ALTURA)
      return
    }

    const elemento = moldura.current
    if (!elemento) return

    const publicar = () => {
      raiz.style.setProperty(VARIAVEL_DE_ALTURA, `${elemento.offsetHeight}px`)
    }
    publicar()

    const observador =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publicar) : null
    observador?.observe(elemento)
    window.addEventListener('resize', publicar)

    return () => {
      observador?.disconnect()
      window.removeEventListener('resize', publicar)
      raiz.style.removeProperty(VARIAVEL_DE_ALTURA)
    }
  }, [oculta])

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

  /**
   * Adianta o JavaScript e os dados do destino sob o dedo (§16).
   *
   * O gesto dura uns 300ms; é tempo suficiente para o Next buscar a rota que
   * está sendo apontada. Quando o dedo solta, a tela já está pronta — que é a
   * diferença entre "deslizar" e "esperar carregar".
   */
  useEffect(() => {
    if (!arrastando) return
    router.prefetch(DESTINOS[indiceVisual].href)
  }, [arrastando, indiceVisual, router])

  if (oculta) return null

  return (
    <div
      ref={moldura}
      className={cn(
        // `pointer-events-none` na moldura para a faixa vazia dos lados não
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
        className="doca-vidro pointer-events-auto h-[4.25rem] max-w-full rounded-[2rem] p-1.5"
      >
        <div
          ref={pista}
          // Cinco segmentos e não quatro: a pista ganhou largura no desktop
          // para o passo continuar confortável. No celular ela é limitada pela
          // viewport de qualquer forma, e o rótulo mais longo ("Aprender")
          // ainda cabe no menor passo que isso produz.
          className="relative flex h-full w-[min(25rem,calc(100vw-1.5rem))] items-stretch sm:w-[30rem]"
        >
          {/* ── A pílula arrastável ──────────────────────────────────
              Ela fica ACIMA dos segmentos para receber o gesto. Como cobre
              exatamente o item ativo, o único clique que ela intercepta é o do
              destino em que já se está — e esse clique não teria efeito de
              qualquer forma. */}
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
                prefetch
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
                    'h-[1.35rem] w-[1.35rem] transition-transform duration-200',
                    aceso && 'scale-110',
                  )}
                  strokeWidth={aceso ? 2.6 : 2}
                />
                <span
                  className={cn(
                    'text-[10.5px] leading-none tracking-tight transition-all duration-200 sm:text-[11px]',
                    aceso ? 'font-extrabold' : 'font-semibold',
                  )}
                >
                  {destino.rotulo}
                </span>
              </Link>
            )
          })}
        </div>
      </motion.nav>
    </div>
  )
}
