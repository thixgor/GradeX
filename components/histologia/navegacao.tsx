'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookMarked, FlaskConical, Layers, ListChecks, Search, Stethoscope } from 'lucide-react'

import { BASE } from '@/lib/histologia/rotas'

/**
 * Barra de seções do Manual da Histologia — presente em toda página interna.
 *
 * ## O problema que ela resolve
 *
 * O módulo não tem cabeçalho do aplicativo (`showHeader={false}` em todas as
 * páginas), e cada tela oferecia apenas um link de "voltar" para o nível
 * imediatamente acima. Quem estava numa lâmina só chegava à Histopatologia
 * subindo até a home e rolando até o fim da seção de assuntos — a área inteira
 * ficava a três telas de distância de onde o aluno realmente estuda.
 *
 * A barra declara as seis superfícies do módulo o tempo todo. **Histopatologia
 * é uma delas**, no mesmo nível de Atlas e Quizzes, e não um apêndice do rodapé
 * de outra seção: o Manual tem duas metades — o tecido normal e o que dá errado
 * nele — e a navegação passa a dizer isso em toda página.
 *
 * ## Por que ela é montada pelas páginas, e não pelo layout
 *
 * O layout do módulo seria o lugar óbvio — um só ponto para a árvore inteira.
 * Mas ele envolve o `AppShell` de cada página, e o `AppShell` mantém uma barra
 * lateral `fixed` de 280 px à esquerda e controles flutuantes (menu, tema, modo
 * leve) nos cantos superiores da janela. Uma barra montada no layout nasceria
 * por baixo de todos eles. Montada pela página, ela cai **dentro** da área de
 * conteúdo, que já é recuada da lateral.
 *
 * Cada página que a monta chama `exigirAcessoAHistologia()` na primeira linha,
 * então onde a barra aparece o acesso já foi verificado. A home do módulo é a
 * única que **não** a monta, e por um motivo: ali a mesma URL serve a vitrine de
 * vendas para quem não assina (ADR 0003), e a home já oferece destinos maiores e
 * ilustrados. A guarda no início do componente sustenta essa regra em código.
 *
 * ## Por que ela não é `sticky`
 *
 * Os controles flutuantes do `AppShell` ficam presos ao topo da janela. Uma
 * barra grudada no topo passaria por baixo deles em toda rolagem; em fluxo
 * normal, ela some junto com o resto do cabeçalho e o conflito desaparece. O
 * recuo superior no celular (`pt-14`) é exatamente a altura que o botão de menu
 * flutuante ocupa.
 *
 * Componente de cliente porque depende de `usePathname` para marcar onde o aluno
 * está. Não importa nada do servidor: `lib/histologia/rotas` existe justamente
 * para que montar uma URL não arraste o driver do MongoDB para o navegador.
 */

interface Destino {
  href: string
  rotulo: string
  icone: React.ReactNode
  /**
   * Prefixo de rota que marca esta aba como a atual. `null` na aba de assuntos:
   * as 1.524 páginas do currículo ficam em `…/histologia/<setor>/…`, sem
   * prefixo próprio, então ela é a aba de reserva — atual quando nenhuma outra
   * reivindica o caminho.
   */
  prefixo: string | null
  /** Realce próprio: a metade patológica do módulo não é mais uma aba igual. */
  patologica?: boolean
}

const DESTINOS: Destino[] = [
  {
    href: `${BASE}#assunto`,
    rotulo: 'Assuntos',
    icone: <Layers className="h-3.5 w-3.5" aria-hidden />,
    prefixo: null,
  },
  {
    href: `${BASE}/atlas`,
    rotulo: 'Atlas',
    icone: <Search className="h-3.5 w-3.5" aria-hidden />,
    prefixo: `${BASE}/atlas`,
  },
  {
    href: `${BASE}/laboratorio`,
    rotulo: 'Laboratório',
    icone: <FlaskConical className="h-3.5 w-3.5" aria-hidden />,
    prefixo: `${BASE}/laboratorio`,
  },
  {
    href: `${BASE}/quizzes`,
    rotulo: 'Quizzes',
    icone: <ListChecks className="h-3.5 w-3.5" aria-hidden />,
    prefixo: `${BASE}/quizzes`,
  },
  {
    href: `${BASE}/caderno`,
    rotulo: 'Caderno',
    icone: <BookMarked className="h-3.5 w-3.5" aria-hidden />,
    prefixo: `${BASE}/caderno`,
  },
]

const HISTOPATOLOGIA: Destino = {
  href: `${BASE}/histopatologia`,
  rotulo: 'Histopatologia',
  icone: <Stethoscope className="h-3.5 w-3.5" aria-hidden />,
  prefixo: `${BASE}/histopatologia`,
  patologica: true,
}

export function NavegacaoDoModulo({
  histopatologiaHabilitada,
}: {
  /**
   * Vem do servidor: a área pode estar fechada por ambiente, e uma aba que leva
   * a 404 é pior do que aba nenhuma. Ver `lib/histopatologia/direitos.ts`.
   */
  histopatologiaHabilitada: boolean
}) {
  const caminho = usePathname()

  // A raiz do módulo pode ser a vitrine de vendas. Ver o cabeçalho do arquivo.
  if (!caminho || caminho === BASE || caminho === `${BASE}/`) return null

  const destinos = histopatologiaHabilitada ? [...DESTINOS, HISTOPATOLOGIA] : DESTINOS
  const naPatologia = caminho.startsWith(`${HISTOPATOLOGIA.prefixo}`)
  // Nenhuma aba com prefixo reivindicou o caminho: é uma página do currículo.
  const noCurriculo =
    !naPatologia && !DESTINOS.some((d) => d.prefixo && caminho.startsWith(d.prefixo))

  return (
    <nav
      aria-label="Seções do Manual da Histologia"
      className="border-b border-border pt-14 lg:pt-0"
    >
      <div className="container mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 py-1.5">
        <Link
          href={BASE}
          className="inline-flex min-h-[36px] shrink-0 items-center rounded-md px-2.5 font-heading text-xs font-bold tracking-tight text-teal-800 transition-colors hover:bg-teal-500/10 dark:text-teal-300"
        >
          Histologia
        </Link>
        <span className="h-4 w-px shrink-0 bg-border" aria-hidden />

        <ul className="flex items-center gap-1">
          {destinos.map((destino) => {
            // A Histopatologia vive **dentro** da árvore da Histologia, então
            // toda rota dela também casa com os prefixos das outras abas. Sem
            // esta linha, "Assuntos" apareceria como atual dentro da patologia.
            const atual = destino.patologica
              ? naPatologia
              : destino.prefixo === null
                ? noCurriculo
                : !naPatologia && caminho.startsWith(destino.prefixo)

            return (
              <li key={destino.href}>
                <Link
                  href={destino.href}
                  aria-current={atual ? 'page' : undefined}
                  className={`inline-flex min-h-[36px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-xs font-semibold transition-colors ${
                    atual
                      ? destino.patologica
                        ? 'border-rose-500/50 bg-rose-500/10 text-rose-800 dark:text-rose-300'
                        : 'border-teal-500/50 bg-teal-500/10 text-teal-800 dark:text-teal-300'
                      : destino.patologica
                        ? 'border-rose-500/30 text-rose-700 hover:bg-rose-500/10 dark:text-rose-400'
                        : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {destino.icone}
                  {destino.rotulo}
                  {/* Estado nunca só por cor: a aba atual também é marcada em texto. */}
                  {atual && <span className="sr-only">(seção atual)</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
