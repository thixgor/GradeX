'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'

import { BASE } from '@/lib/histologia/rotas'
import { registrarVisto, type Visto } from '@/lib/histologia/vistos'

/**
 * Barra do Manual da Histologia — presente em toda página do módulo.
 *
 * ## A arquitetura que ela declara
 *
 * A barra antiga tinha oito abas irmãs: Assuntos, Atlas, Zoom, Laboratório,
 * Quizzes, Caderno, Histopatologia e "Patologia com Zoom". O aluno tinha de
 * escolher entre "Histopatologia", "Zoom" e "Patologia com Zoom" sem saber o
 * que separava uma da outra — porque o que as separava não era o conteúdo, era
 * a forma de ver a lâmina.
 *
 * Agora ela diz uma coisa só, sempre igual:
 *
 * - **Início** — o catálogo;
 * - **Histologia** e **Histopatologia** — as duas áreas de conteúdo, o tecido
 *   normal e a doença. Lâminas com zoom vivem *dentro* de cada área, marcadas
 *   com um selo, e não numa aba concorrente;
 * - **Sistemas** — o mesmo órgão nas duas áreas, lado a lado;
 * - **Praticar** — quizzes e laboratório;
 * - **Meu caderno** — favoritas, notas e revisões;
 * - **Buscar** — à direita, como em qualquer catálogo.
 *
 * ## Por que ela é montada pelas páginas, e não pelo layout
 *
 * O layout do módulo envolve o `AppShell` de cada página, que tem barra lateral
 * `fixed` e controles flutuantes nos cantos superiores. Uma barra montada no
 * layout nasceria por baixo deles; montada pela página, cai dentro da área de
 * conteúdo. Pelo mesmo motivo ela não é `sticky`, e o recuo superior no
 * celular (`pt-14`) é a altura do botão de menu flutuante.
 *
 * Na raiz do módulo a mesma URL pode estar servindo a vitrine de vendas (ADR
 * 0003): ali a barra só aparece quando a home a monta explicitamente, já
 * dentro do ramo de quem tem acesso (`naHome`).
 */

type Secao = 'inicio' | 'histologia' | 'histopatologia' | 'sistemas' | 'praticar' | 'caderno' | 'buscar'

interface Destino {
  secao: Secao
  href: string
  rotulo: string
}

const INICIO: Destino = { secao: 'inicio', href: BASE, rotulo: 'Início' }
const HISTOLOGIA: Destino = { secao: 'histologia', href: `${BASE}/normal`, rotulo: 'Histologia' }
const HISTOPATOLOGIA: Destino = { secao: 'histopatologia', href: `${BASE}/histopatologia`, rotulo: 'Histopatologia' }
const DEMAIS: Destino[] = [
  { secao: 'sistemas', href: `${BASE}/sistemas`, rotulo: 'Sistemas' },
  { secao: 'praticar', href: `${BASE}/praticar`, rotulo: 'Praticar' },
  { secao: 'caderno', href: `${BASE}/caderno`, rotulo: 'Meu caderno' },
]

/** Em que seção o aluno está. Tudo que não é de outra seção é Histologia normal. */
export function secaoDoCaminho(caminho: string): Secao {
  const em = (prefixo: string) => caminho === prefixo || caminho.startsWith(`${prefixo}/`)
  if (caminho === BASE || caminho === `${BASE}/`) return 'inicio'
  if (em(`${BASE}/histopatologia`)) return 'histopatologia'
  if (em(`${BASE}/sistemas`)) return 'sistemas'
  if (em(`${BASE}/praticar`) || em(`${BASE}/quizzes`) || em(`${BASE}/laboratorio`) || em(`${BASE}/zoom/quiz`))
    return 'praticar'
  if (em(`${BASE}/caderno`)) return 'caderno'
  if (em(`${BASE}/atlas`)) return 'buscar'
  return 'histologia'
}

export function NavegacaoDoModulo({
  histopatologiaHabilitada,
  naHome = false,
  visto,
}: {
  /**
   * Vem do servidor: a área pode estar fechada por ambiente, e uma aba que leva
   * a 404 é pior do que aba nenhuma. Ver `lib/histopatologia/direitos.ts`.
   */
  histopatologiaHabilitada: boolean
  /** Só a home passa `true`, e só no ramo de quem tem acesso. */
  naHome?: boolean
  /** Lâmina ou doença aberta nesta página — entra no "Continue estudando". */
  visto?: Omit<Visto, 'em'>
}) {
  const caminho = usePathname()

  useEffect(() => {
    if (visto) registrarVisto(visto)
    // A chave é a URL: o mesmo item não precisa ser regravado a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visto?.href])

  // A raiz do módulo pode ser a vitrine de vendas. Ver o cabeçalho do arquivo.
  if (!caminho || ((caminho === BASE || caminho === `${BASE}/`) && !naHome)) return null

  const destinos = [INICIO, HISTOLOGIA, ...(histopatologiaHabilitada ? [HISTOPATOLOGIA] : []), ...DEMAIS]
  const atual = secaoDoCaminho(caminho)

  return (
    <nav aria-label="Manual da Histologia" className="border-b border-border/70 pt-14 lg:pt-0">
      <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 md:px-10 lg:pr-36">
        <Link
          href={BASE}
          className="inline-flex min-h-[48px] shrink-0 items-center gap-2 pr-2 font-heading text-[15px] font-bold tracking-tight text-foreground"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#E8763A] shadow-[0_0_12px_#E8763A]" aria-hidden />
          <span className="hidden sm:inline">Manual da Histologia</span>
          <span className="sm:hidden">Histologia</span>
        </Link>

        <ul className="catalogo-fileira flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {destinos.map((destino) => {
            const ativo = destino.secao === atual
            return (
              <li key={destino.secao} className="shrink-0">
                <Link
                  href={destino.href}
                  aria-current={ativo ? 'page' : undefined}
                  className={`relative inline-flex min-h-[48px] items-center whitespace-nowrap px-2.5 text-[13px] transition-colors sm:px-3 ${
                    ativo ? 'font-bold text-foreground' : 'font-medium text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {destino.rotulo}
                  {/* Estado nunca só por cor: a aba atual ganha o traço e o texto. */}
                  {ativo && (
                    <>
                      <span className="absolute inset-x-2.5 bottom-0 h-[3px] rounded-t bg-[#E8763A]" aria-hidden />
                      <span className="sr-only">(seção atual)</span>
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <Link
          href={`${BASE}/atlas`}
          aria-current={atual === 'buscar' ? 'page' : undefined}
          className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors ${
            atual === 'buscar'
              ? 'border-[#E8763A] text-foreground'
              : 'border-border text-muted-foreground hover:border-[#E8763A]/60 hover:text-foreground'
          }`}
        >
          <Search className="h-4 w-4" aria-hidden />
          <span className="hidden md:inline">Buscar</span>
          <span className="sr-only md:hidden">Buscar no Manual</span>
        </Link>
      </div>
    </nav>
  )
}
