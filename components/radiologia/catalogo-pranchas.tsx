import Link from 'next/link'
import { ArrowLeft, ArrowRight, Layers, Lightbulb, Ruler, Target } from 'lucide-react'
import { LogoRadiologia } from '@/components/radiologia/logo'
import { CantosFilme, FilmeImagem } from '@/components/radiologia/filme'
import type { BlocoTexto, PranchaResumo } from '@/lib/radiologia/pranchas'

/**
 * Índice das pranchas de anatomia pulmonar.
 *
 * Componente de servidor de propósito: a tela não tem estado nenhum — nem busca,
 * nem filtro — e o que ela desenha vem de `lib/radiologia/pranchas`, que carrega
 * o dossiê dos 40 territórios. Deixá-la como componente de cliente mandaria esse
 * dossiê inteiro para o navegador só para pintar quatro cards.
 *
 * A ordem da página é a ordem do estudo: as pranchas primeiro (é o que a pessoa
 * veio ver), e os fundamentos que valem para todas elas logo abaixo — repetir
 * essas regras dentro de cada figura faria o aluno pular o texto na terceira vez.
 */

export interface CatalogoPranchasProps {
  pranchas: PranchaResumo[]
  guia: BlocoTexto[]
  totalTerritorios: number
}

export function CatalogoPranchas({ pranchas, guia, totalTerritorios }: CatalogoPranchasProps) {
  const lobos = pranchas.filter((prancha) => prancha.tema === 'lobos')
  const segmentos = pranchas.filter((prancha) => prancha.tema === 'segmentos')

  return (
    <div className="rx surface-page min-h-screen">
      <header className="rx-painel rx-grade rx-varredura relative overflow-hidden border-b border-sky-400/15">
        <div className="rx-abaixo-flutuantes container relative mx-auto max-w-6xl px-4 pb-8 pt-6">
          <Link
            href="/manual-clinico/radiologia"
            className="-m-2 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-sky-100/60 transition hover:text-sky-100"
          >
            <ArrowLeft className="h-4 w-4" /> Manual de Radiologia
          </Link>

          <div className="mt-5 max-w-3xl">
            <div className="[filter:invert(1)_hue-rotate(180deg)_brightness(1.2)]">
              <LogoRadiologia className="max-w-[290px]" />
            </div>
            <p className="editorial-mark mt-1 !text-sky-300/80 [&::before]:bg-sky-300/60">
              Pranchas · anatomia pulmonar aplicada
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-[2rem] sm:leading-tight">
              Lobos e segmentos, nas duas incidências
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sky-100/65 sm:text-base">
              Quatro pranchas coloridas sobre radiografias reais de tórax, com a mesma imagem
              disponível limpa para você delimitar antes de conferir. Cada território tem dossiê
              próprio — onde achar, o que ele ensina e o erro que costuma provocar — e cada figura
              declara o que a incidência não é capaz de mostrar.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold text-sky-100/70">
              <Selo icone={Layers} texto={`${pranchas.length} pranchas`} />
              <Selo icone={Target} texto={`${totalTerritorios} territórios comentados`} />
              <Selo icone={Ruler} texto="PA e perfil, filme limpo e marcado" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 pb-16 pt-8 sm:pt-10">
        <BlocoPranchas
          etiqueta="Primeiro nível"
          titulo="Lobos pulmonares"
          descricao="A escala que a radiografia realmente enxerga: os lobos são separados por pleura, e a cissura pode virar linha no filme."
          pranchas={lobos}
        />

        <BlocoPranchas
          etiqueta="Segundo nível"
          titulo="Segmentos broncopulmonares"
          descricao="A escala cirúrgica: brônquio, artéria e drenagem próprios. Nenhuma fronteira intersegmentar aparece no filme — o que aparece é a distribuição da doença dentro do território."
          pranchas={segmentos}
          className="mt-11"
        />

        {/* ══════════ FUNDAMENTOS ══════════ */}
        <section className="mt-12">
          <p className="editorial-mark mb-2 inline-flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" />
            Fundamentos
          </p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            As regras que valem para as quatro figuras
          </h2>
          <div className="mt-5 grid gap-3.5 lg:grid-cols-2">
            {guia.map((bloco) => (
              <article key={bloco.titulo} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                <h3 className="font-heading text-[15px] font-semibold">{bloco.titulo}</h3>
                {bloco.paragrafos.map((paragrafo) => (
                  <p
                    key={paragrafo.slice(0, 40)}
                    className="mt-2 text-[13px] leading-relaxed text-muted-foreground"
                  >
                    {paragrafo}
                  </p>
                ))}
              </article>
            ))}
          </div>
        </section>

        <p className="mt-11 rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4 text-xs leading-relaxed text-muted-foreground">
          <strong className="font-bold text-foreground">Escopo educacional.</strong> Demarcação
          esquemática sobre radiografias reais. Os limites lobares tracejados e todos os limites
          segmentares são projeções didáticas, não achados de imagem. Não substitui laudo médico,
          avaliação clínica nem a escolha do método apropriado. Nomenclatura segmentar de
          Jackson–Huber/Boyden.
        </p>
      </main>
    </div>
  )
}

/* ─────────────────────────────── Peças ─────────────────────────────── */

function Selo({ icone: Icone, texto }: { icone: typeof Target; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/[0.07] px-3 py-1.5 backdrop-blur">
      <Icone className="h-3.5 w-3.5 text-sky-300" />
      {texto}
    </span>
  )
}

function BlocoPranchas({
  etiqueta,
  titulo,
  descricao,
  pranchas,
  className = '',
}: {
  etiqueta: string
  titulo: string
  descricao: string
  pranchas: PranchaResumo[]
  className?: string
}) {
  return (
    <section className={className}>
      <p className="editorial-mark mb-2">{etiqueta}</p>
      <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">{titulo}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{descricao}</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {pranchas.map((prancha) => (
          <CartaoPrancha key={prancha.slug} prancha={prancha} />
        ))}
      </div>
    </section>
  )
}

function CartaoPrancha({ prancha }: { prancha: PranchaResumo }) {
  return (
    <Link
      href={`/manual-clinico/radiologia/pranchas/${prancha.slug}`}
      prefetch={false}
      className="group flex flex-col overflow-hidden rounded-2xl border border-sky-500/25 bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-500/55 hover:shadow-lg hover:shadow-sky-500/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        <FilmeImagem
          src={prancha.imagem}
          alt={prancha.altImagem}
          larguraMobile={640}
          larguraDesktop={640}
          qualidade={62}
          comEsqueleto
          className="absolute inset-0 h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.03]"
        />
        <CantosFilme />
        <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-sky-500/90 px-3 py-1 font-clinical text-[10px] font-black uppercase tracking-widest text-white shadow backdrop-blur">
          Figura {prancha.figura} · {prancha.incidencia}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-semibold">{prancha.titulo}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{prancha.resumo}</p>

        {/* Fita de cores: a chave da figura reduzida a uma linha. Serve de
            impressão digital — é por ela que se reconhece a prancha certa
            sem ler o título. */}
        <ul aria-hidden className="mt-4 flex flex-wrap gap-1">
          {prancha.amostras.map((amostra, indice) => (
            <li
              key={`${amostra.sigla}-${indice}`}
              className="h-4 w-4 rounded-[3px] ring-1 ring-inset ring-black/20"
              style={{ backgroundColor: amostra.cor }}
            />
          ))}
        </ul>
        <p className="mt-2 font-clinical text-[10px] uppercase tracking-wider text-muted-foreground">
          {prancha.totalTerritorios} territórios · {prancha.subtitulo}
        </p>

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-sky-600 dark:text-sky-400">
          Abrir a prancha
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
