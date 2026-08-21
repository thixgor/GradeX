'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Compass, GraduationCap, RotateCcw, CircleUser, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * A doca da Área de Ensino — a barra de um app nativo, feita de vidro.
 *
 * ══ TRÊS VERBOS, E O CANTO PESSOAL ═══════════════════════════════════
 *
 * A barra anterior era Aprender · Buscar · Revisar · Você, e "Explorar" não
 * estava nela: para chegar ao acervo por assunto era preciso descer a home até
 * uma fileira de chips e tocar em "ver tudo". Quem entrava querendo garimpar um
 * tema não achava o lugar de garimpar — a queixa que originou esta reescrita.
 *
 * Agora a barra diz o que a área faz, em três verbos:
 *
 *     APRENDER · EXPLORAR · REVISAR
 *
 * Aprender é continuar de onde parou. Explorar é o acervo inteiro — por
 * assunto, com capa, e com a BUSCA dentro dele (ver `explorar/page.tsx`):
 * procurar e navegar são a mesma intenção com dois gestos diferentes, e separá-
 * las em dois destinos obrigava a escolher o gesto antes de saber o que se quer.
 * Revisar é a fila do que está esfriando. "Você" fecha a barra porque caderno,
 * progresso e o modo de gestão precisam morar em algum lugar — mas ele não é um
 * verbo de estudo, e por isso vem por último e sem peso.
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
 * ══ O QUE SAIU: O ARRASTO ════════════════════════════════════════════
 *
 * A versão anterior deixava arrastar a pílula pelos destinos. Era bonito de
 * demonstrar e caro de usar: para o arrasto encaixar, todos os segmentos
 * precisavam da MESMA largura, o gesto competia com a rolagem da página no
 * mesmo eixo do polegar, e ninguém navega arrastando — navega tocando. Sem ele
 * a barra ganhou rótulos de larguras livres e um alvo de toque maior.
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
    tambem: ['/aulas/trilhas', '/aulas/curso'],
  },
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
  const [recolhida, setRecolhida] = useState(false)

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
        <div className="flex w-[min(23rem,calc(100vw-1.75rem))] items-stretch gap-0.5 sm:w-auto sm:gap-1">
          {DESTINOS.map((destino, indice) => {
            const Icone = destino.icone
            const aceso = indice === indiceDaRota

            return (
              <Link
                key={destino.href}
                href={destino.href}
                prefetch
                aria-current={aceso ? 'page' : undefined}
                onPointerEnter={() => router.prefetch(destino.href)}
                className={cn(
                  'relative flex h-14 flex-1 flex-col items-center justify-center gap-1 rounded-[1.35rem]',
                  'px-2 transition-colors duration-200 sm:w-[5.5rem] sm:flex-none',
                  aceso ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {/* A pílula é UM elemento que se move entre os destinos. Um
                    fundo aceso por segmento daria o mesmo estado sem dar
                    nenhuma continuidade: o indicador apareceria no destino
                    novo em vez de ir até ele. */}
                {aceso ? (
                  <motion.span
                    layoutId={semMovimento ? undefined : 'doca-pilula'}
                    transition={{ type: 'spring', stiffness: 480, damping: 40 }}
                    className="doca-pilula absolute inset-0 rounded-[1.35rem]"
                    aria-hidden
                  />
                ) : null}

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
