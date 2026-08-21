'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import {
  CircleUser,
  Compass,
  GraduationCap,
  RotateCcw,
  Route,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * A doca da Área de Ensino — a barra de um app nativo, feita de vidro.
 *
 * ══ OS DESTINOS ══════════════════════════════════════════════════════
 *
 *     APRENDER · TRILHAS · EXPLORAR · REVISAR · VOCÊ
 *
 * Aprender é continuar de onde parou. Explorar é o acervo inteiro por assunto,
 * com a BUSCA dentro dele (ver `explorar/page.tsx`): procurar e navegar são a
 * mesma intenção com dois gestos diferentes, e separá-las em dois destinos
 * obrigava a escolher o gesto antes de saber o que se quer. Revisar é a fila do
 * que está esfriando. "Você" fecha a barra porque caderno, progresso e o modo
 * de gestão precisam morar em algum lugar — mas ele não é um verbo de estudo, e
 * por isso vem por último e sem peso.
 *
 * TRILHAS voltou a ser um segmento. Ela tinha sido dobrada dentro do Aprender,
 * com o argumento de que Trilha é conteúdo e não lugar. O argumento é bom e a
 * consequência foi ruim: Trilha é o OBJETO PRINCIPAL da área (§1), e chegar a
 * "todas as Trilhas" passou a exigir abrir o Aprender, rolar até a faixa certa
 * e achar o "ver tudo" — três gestos para o conteúdo que a área inteira existe
 * para organizar. O critério que decide o que entra aqui é "para onde se VAI",
 * e Trilhas é um acervo com endereço e página próprios, não um recorte de outra
 * tela.
 *
 * ══ ELA SE COMPORTA COMO BARRA DE APP, NÃO COMO RODAPÉ DE SITE ═══════
 *
 *  • **Some ao descer, volta ao subir.** Enquanto a pessoa lê, a tela é toda
 *    dela; no primeiro gesto para cima a navegação reaparece. É o comportamento
 *    que todo app de leitura tem e nenhum site costuma ter — e é o que mais
 *    aproxima esta área de um aplicativo instalado.
 *  • **A pílula é um objeto, não uma cor.** Ela escorrega entre os destinos com
 *    uma mola (`layoutId`), como o indicador do iOS. Trocar `bg-primary` de
 *    lugar daria o mesmo estado sem dar nenhuma continuidade.
 *  • **O alvo tem 56px de altura.** Barra inferior é tocada com o polegar em
 *    movimento, quase sempre com uma mão só.
 *
 * ══ O ARRASTO, DE VOLTA ══════════════════════════════════════════════
 *
 * Ele já tinha sido tirado uma vez, com três argumentos: obrigava todos os
 * segmentos à mesma largura, competia com a rolagem no mesmo eixo do polegar, e
 * "ninguém navega arrastando". Voltou a pedido de quem usa a área — e é um
 * pedido que os três argumentos não derrubam:
 *
 *  • a largura igual não custa nada aqui: a barra JÁ distribuía os segmentos
 *    igualmente (`flex-1` no celular, `w-[5.5rem]` no desktop);
 *  • a competição com a rolagem fica contida no `touch-none` da PÍLULA, que
 *    cobre só o segmento ativo — o resto da barra continua deixando a página
 *    rolar por baixo do dedo;
 *  • e o arrasto nunca foi a única forma de navegar: o toque continua sendo o
 *    caminho normal, com o mesmo alvo de 56px. O gesto é um extra para quem o
 *    descobre, não um pedágio para quem não o quer.
 *
 * A pílula deixou de ser um `layoutId` por segmento e voltou a ser UM elemento
 * posicionado por `x`: é a mesma peça que a mola move na troca de rota e que o
 * dedo pega no arrasto. Duas pílulas — uma para animar, outra para arrastar —
 * seriam duas fontes de verdade para a mesma posição.
 *
 * ══ ELA AVISA A TELA DE QUE OCUPA ESPAÇO ═════════════════════════════
 *
 * O app já tem dois flutuantes no rodapé: o "voltar" do iOS e o "+" de
 * música/suporte. Ambos sobem quando alguém publica `--gx-barra-inferior-h` —
 * a convenção de `components/ui/barra-inferior.tsx`. A doca mede a própria
 * altura e publica. O valor NÃO muda quando ela se esconde na rolagem: os
 * outros flutuantes descendo e subindo junto com ela seria três peças dançando
 * a cada gesto.
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
    icone: GraduationCap,
    exato: true,
    // Assistir e percorrer uma Trilha são "aprender": são as telas para onde o
    // Aprender manda. Acender outro segmento (ou nenhum) enquanto a pessoa
    // assiste faria a barra mentir sobre onde ela está.
    tambem: ['/aulas/curso'],
  },
  { href: '/aulas/trilhas', rotulo: 'Trilhas', icone: Route },
  {
    href: '/aulas/explorar',
    rotulo: 'Explorar',
    icone: Compass,
    // A busca vive DENTRO do Explorar. `/aulas/buscar` continua existindo para
    // links diretos e para quem tem a rota salva, e acende este segmento.
    tambem: ['/aulas/buscar'],
  },
  { href: '/aulas/revisar', rotulo: 'Revisar', icone: RotateCcw },
  { href: '/aulas/voce', rotulo: 'Você', icone: CircleUser, tambem: ['/aulas/anotacoes'] },
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
 * Nenhuma das telas de `/aulas` passava um `pt-*` para o próprio conteúdo, e o
 * título de cada página nascia colado na régua de baixo do cabeçalho fixo. Mais
 * visível ainda agora que o cabeçalho é vidro e o texto por trás dele se
 * mistura com o título da página. A mesma lógica do respiro de baixo — uma
 * constante, não um número copiado em oito arquivos.
 */
export const RESPIRO_DO_TOPO = 'pt-5 sm:pt-8'

/** A variável que o "voltar" e o "+" já leem para subir. */
const VARIAVEL_DE_ALTURA = '--gx-barra-inferior-h'

/**
 * As rotas de `/aulas` que NÃO são a experiência do aluno.
 *
 * O painel de gestão é outro modo de uso, com outra navegação e outro público:
 * deixar a doca do aluno flutuando sobre a tela de importar planilha seria
 * dizer que gerenciar é uma das quatro coisas que se faz na Área de Ensino.
 *
 * A verificação de certificado é a outra: ela é o próprio documento, feita para
 * ser aberta por um terceiro e impressa. Uma barra de navegação por cima
 * apareceria no papel.
 */
function semDoca(pathname: string) {
  return pathname.startsWith('/aulas/gerenciar') || pathname.startsWith('/aulas/certificado')
}

/** `useLayoutEffect` no cliente, `useEffect` no servidor — evita o aviso do SSR. */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * O halo de fundo da área.
 *
 * Vidro precisa de algo atrás para refratar. Sobre o creme chapado do tema o
 * desfoque não tem o que borrar, a translucidez vira uma diferença de 4% de
 * cinza e sobra só o custo do efeito. Dois halos muito abertos — verde no alto,
 * âmbar embaixo — dão ao desfoque um gradiente para trabalhar sem virar papel
 * de parede. O material está em `globals.css` (`.ambiente-de-ensino`).
 */
export function AmbienteDeEnsino() {
  return <div aria-hidden className="ambiente-de-ensino" />
}

export function DocaDeEnsino({ className }: { className?: string }) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const semMovimento = useReducedMotion()

  const oculta = semDoca(pathname)

  const moldura = useRef<HTMLDivElement>(null)
  const pista = useRef<HTMLDivElement>(null)
  const [recolhida, setRecolhida] = useState(false)

  /* ── A pista e o passo do slider ─────────────────────────────────── */
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
   * Durante o arrasto ele descola da rota: é o que faz o ícone acender antes de
   * a navegação acontecer. Sem essa separação o gesto não daria retorno nenhum
   * até o dedo sair da tela.
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
      passo > 0
        ? Math.min(DESTINOS.length - 1, Math.max(0, Math.round(posicao / passo)))
        : 0,
    [passo],
  )

  /**
   * Adianta o JavaScript e os dados do destino sob o dedo.
   *
   * O gesto dura uns 300ms; é tempo suficiente para o Next buscar a rota que
   * está sendo apontada. Quando o dedo solta, a tela já está pronta — que é a
   * diferença entre "deslizar" e "esperar carregar".
   */
  useEffect(() => {
    if (!arrastando) return
    router.prefetch(DESTINOS[indiceVisual].href)
  }, [arrastando, indiceVisual, router])

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

  /**
   * Some ao descer, volta ao subir.
   *
   * A folga de 8px existe porque o dedo nunca rola em linha reta: sem ela, o
   * tremor de um gesto lento faria a barra piscar dezenas de vezes. E ela só
   * começa a valer depois de 140px de rolagem — no topo da página a navegação
   * fica sempre visível, que é onde quem acabou de chegar procura por ela.
   */
  useEffect(() => {
    if (oculta) return
    let anterior = window.scrollY
    let quadro = 0

    const avaliar = () => {
      quadro = 0
      const atual = window.scrollY
      const delta = atual - anterior

      if (Math.abs(delta) > 8) {
        const fim = document.documentElement.scrollHeight - window.innerHeight - atual < 96
        setRecolhida(delta > 0 && atual > 140 && !fim)
        anterior = atual
      }
    }

    const aoRolar = () => {
      if (quadro) return
      quadro = requestAnimationFrame(avaliar)
    }

    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => {
      window.removeEventListener('scroll', aoRolar)
      if (quadro) cancelAnimationFrame(quadro)
    }
  }, [oculta])

  /** Trocar de rota devolve a barra: a tela nova começa com a navegação à mão. */
  useEffect(() => {
    setRecolhida(false)
  }, [pathname])

  if (oculta) return null

  return (
    <div
      ref={moldura}
      className={cn(
        // `pointer-events-none` na moldura para a faixa vazia dos lados não
        // roubar cliques do conteúdo que passa por baixo.
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center',
        'px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      <motion.nav
        aria-label="Navegação da Área de Ensino"
        initial={semMovimento ? false : { y: 90, opacity: 0 }}
        animate={
          semMovimento
            ? {}
            : { y: recolhida ? 130 : 0, opacity: recolhida ? 0 : 1 }
        }
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className={cn(
          'doca-vidro vidro-reflexo pointer-events-auto max-w-full overflow-hidden rounded-[1.75rem] p-1.5',
          recolhida && 'pointer-events-none',
        )}
      >
        <div
          ref={pista}
          // Segmentos de largura IGUAL, no celular e no desktop: é o que o
          // encaixe do arrasto precisa para ser previsível no meio do gesto.
          className="relative flex w-[min(24rem,calc(100vw-1.75rem))] items-stretch sm:w-[30rem]"
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
              className="doca-pilula absolute inset-y-0 left-0 z-10 cursor-grab touch-none rounded-[1.35rem] active:cursor-grabbing"
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
                onPointerEnter={() => router.prefetch(destino.href)}
                onClick={() => setIndiceVisual(indice)}
                className={cn(
                  'relative flex h-14 flex-1 flex-col items-center justify-center gap-1 rounded-[1.35rem]',
                  'px-1 transition-colors duration-200',
                  aceso ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icone
                  className={cn(
                    'relative h-[1.3rem] w-[1.3rem] transition-transform duration-200',
                    aceso && 'scale-110',
                  )}
                  strokeWidth={aceso ? 2.5 : 2}
                />
                <span
                  className={cn(
                    'relative text-[10.5px] leading-none tracking-tight transition-all duration-200 sm:text-[11px]',
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
