'use client'

/**
 * Vitrine dos modelos 3D — o produto em si.
 *
 * Fica fora da página porque carrega o catálogo inteiro dos modelos e as
 * prévias; só é montado depois que o servidor confirma a assinatura.
 *
 * ## O que mudou no caminho até a peça
 *
 * A busca morava dentro do herói. Bastava rolar meia tela para ela sumir, e
 * quem já sabia o nome do modelo tinha que voltar ao topo para digitá-lo —
 * exatamente a pessoa com mais pressa. Agora ela vive na barra fixa, junto dos
 * filtros, e continua ao alcance em qualquer ponto da lista.
 *
 * As pastilhas de categoria também mudaram de função. Antes elas rolavam a
 * página até a seção correspondente, o que só encurtava o gesto de rolar; agora
 * elas **filtram**: escolher "Crânio" deixa na tela os modelos de crânio e nada
 * mais. "Todos" devolve a vitrine inteira, com destaques e seções — que é o
 * modo de quem está passeando, não procurando.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PreviaModelo, useMiniaturas } from '@/components/anatomia/previa-modelo'
import {
  ArrowLeft,
  ArrowRight,
  Box,
  GraduationCap,
  LayoutGrid,
  Rows3,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import {
  CATEGORIAS,
  MODELOS,
  FONTE,
  TOTAL_MODELOS,
  getDestaques,
  getModelosPorCategoria,
  type CategoriaId,
  type Modelo3D,
} from '@/lib/anatomia-3d/modelos'
import { TEMA, ICONS, FALLBACK_ICON, corDaCategoria } from '@/components/anatomia-3d/tema'

const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/* ══════════════════════════ Cards ══════════════════════════ */

function CardModelo({
  modelo,
  indice,
  miniatura,
}: {
  modelo: Modelo3D
  indice: number
  miniatura?: string
}) {
  const tema = TEMA[corDaCategoria(modelo.categoriaId)]
  const categoria = CATEGORIAS.find(item => item.id === modelo.categoriaId)
  const Icone = categoria ? ICONS[categoria.icon] : FALLBACK_ICON

  return (
    <Link
      href={`/anatomia/anatomia-3d/${modelo.slug}`}
      prefetch={false}
      style={{ animationDelay: `${Math.min(indice, 12) * 40}ms` }}
      className={`vidro-leve vidro-brilho relevo relevo-toca group relative flex animate-fade-in-up flex-col overflow-hidden rounded-[22px] opacity-0 ${tema.hoverBorder}`}
    >
      <PreviaModelo
        titulo={modelo.titulo}
        sketchfabId={modelo.sketchfabId}
        miniatura={miniatura}
        gradiente={tema.grad}
        corIcone={tema.text}
        fundoIcone={tema.bg}
        icone={Icone}
        prioridade={indice < 3}
      />

      {modelo.destaque && (
        <span className="anatomia-vidro-escuro absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-100">
          <Sparkles className="h-3 w-3" /> Destaque
        </span>
      )}

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug tracking-tight">{modelo.titulo}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">{modelo.legenda}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60">
            <GraduationCap className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{FONTE}</span>
          </span>
          <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-bold ${tema.text}`}>
            Ver anatomia <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function LinhaModelo({ modelo, miniatura }: { modelo: Modelo3D; miniatura?: string }) {
  const tema = TEMA[corDaCategoria(modelo.categoriaId)]
  const categoria = CATEGORIAS.find(item => item.id === modelo.categoriaId)
  const Icone = categoria ? ICONS[categoria.icon] : FALLBACK_ICON

  return (
    <Link
      href={`/anatomia/anatomia-3d/${modelo.slug}`}
      prefetch={false}
      className={`vidro-leve relevo relevo-toca group flex items-stretch gap-3 overflow-hidden rounded-[20px] ${tema.hoverBorder}`}
    >
      <div className="w-28 shrink-0 sm:w-36">
        <PreviaModelo
          titulo={modelo.titulo}
          sketchfabId={modelo.sketchfabId}
          miniatura={miniatura}
          gradiente={tema.grad}
          corIcone={tema.text}
          fundoIcone={tema.bg}
          icone={Icone}
          giroAoPassar={false}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pr-3">
        <h3 className="truncate font-semibold leading-snug">{modelo.titulo}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{modelo.legenda}</p>
        <span className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold ${tema.text}`}>
          {categoria?.titulo}
        </span>
      </div>
      <ArrowRight className="my-auto mr-3 h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

/* ══════════════════════════ Página ══════════════════════════ */

export default function VitrineModelos() {
  const [busca, setBusca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaId | null>(null)
  const [visao, setVisao] = useState<'grade' | 'lista'>('grade')

  const destaques = useMemo(() => getDestaques(), [])
  const miniaturas = useMiniaturas(useMemo(() => MODELOS.map(modelo => modelo.sketchfabId), []))

  const termo = normalizar(busca.trim())
  const resultados = useMemo(() => {
    if (!termo) return []
    return MODELOS.filter(modelo =>
      [modelo.titulo, modelo.legenda, modelo.resumo].some(campo => normalizar(campo).includes(termo)),
    )
  }, [termo])

  const daCategoria = useMemo(
    () => (categoriaAtiva ? getModelosPorCategoria(categoriaAtiva) : []),
    [categoriaAtiva],
  )

  function renderizar(modelos: Modelo3D[]) {
    if (visao === 'lista') {
      return (
        <div className="grid gap-2 lg:grid-cols-2">
          {modelos.map(modelo => (
            <LinhaModelo
              key={modelo.slug}
              modelo={modelo}
              miniatura={modelo.sketchfabId ? miniaturas[modelo.sketchfabId] : undefined}
            />
          ))}
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {modelos.map((modelo, indice) => (
          <CardModelo
            key={modelo.slug}
            modelo={modelo}
            indice={indice}
            miniatura={modelo.sketchfabId ? miniaturas[modelo.sketchfabId] : undefined}
          />
        ))}
      </div>
    )
  }

  const vazio = (
    <div className="py-16 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground/[0.05]">
        <Box className="h-8 w-8 text-muted-foreground/30" />
      </div>
      <p className="text-sm text-muted-foreground">Tente outro termo, como um sistema ou o nome de um osso.</p>
    </div>
  )

  return (
    <div className="surface-page anatomia-ambiente min-h-screen">
      {/* ── Hero ── */}
      <header className="relative overflow-hidden border-b border-border bg-slate-950">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_10%,rgba(34,211,238,0.22),transparent_60%),radial-gradient(ellipse_50%_50%_at_85%_25%,rgba(99,102,241,0.22),transparent_60%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-6 sm:pb-10 sm:pt-8">
          <Link
            href="/anatomia"
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Domine Anatomia
          </Link>

          <p className="editorial-mark !text-cyan-300">Domine Anatomia · modelos interativos</p>
          <h1 className="mt-2.5 font-heading text-[2.25rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
            Anatomia 3D
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/65">
            {TOTAL_MODELOS} peças rotacionáveis em 360°, organizadas por sistema e acompanhadas de uma explicação
            aprofundada. Passe o cursor sobre um card para ver o modelo girar antes mesmo de abri-lo.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="anatomia-vidro-escuro inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-cyan-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              {TOTAL_MODELOS} modelos
            </span>
            <span className="anatomia-vidro-escuro rounded-full px-3 py-1.5 text-white/70">
              {CATEGORIAS.length} categorias
            </span>
            <span className="anatomia-vidro-escuro inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-white/70">
              <GraduationCap className="h-3.5 w-3.5" /> {FONTE}
            </span>
          </div>
        </div>
      </header>

      {/* ── Barra de comando: busca, filtro e forma de ver ── */}
      <div className="anatomia-barra sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="anatomia-campo flex h-10 min-w-0 flex-1 items-center rounded-2xl">
              <Search className="pointer-events-none ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={busca}
                onChange={evento => setBusca(evento.target.value)}
                placeholder="Buscar modelo (coração, vértebra T5, laringe…)"
                aria-label="Buscar modelo 3D"
                className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="anatomia-segmento hidden h-10 shrink-0 sm:flex">
              <BotaoVisao ativo={visao === 'grade'} onClick={() => setVisao('grade')} rotulo="Ver em grade">
                <LayoutGrid className="h-4 w-4" />
              </BotaoVisao>
              <BotaoVisao ativo={visao === 'lista'} onClick={() => setVisao('lista')} rotulo="Ver em lista">
                <Rows3 className="h-4 w-4" />
              </BotaoVisao>
            </div>
          </div>

          {/* As pastilhas somem durante a busca: o resultado já é um recorte, e
              dois filtros disputando o mesmo conjunto confundem mais que ajudam. */}
          {!termo && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setCategoriaAtiva(null)}
                data-marcado={categoriaAtiva === null ? 'true' : 'false'}
                className="tecla inline-flex h-8 shrink-0 items-center gap-1.5 px-3 text-xs font-semibold"
              >
                Todos
                <span className="rounded-full bg-foreground/[0.08] px-1.5 text-[10px] tabular-nums">
                  {TOTAL_MODELOS}
                </span>
              </button>
              {CATEGORIAS.map(categoria => {
                const quantidade = getModelosPorCategoria(categoria.id).length
                if (quantidade === 0) return null
                const ativa = categoriaAtiva === categoria.id
                return (
                  <button
                    key={categoria.id}
                    type="button"
                    onClick={() => setCategoriaAtiva(ativa ? null : categoria.id)}
                    data-marcado={ativa ? 'true' : 'false'}
                    className="tecla inline-flex h-8 shrink-0 items-center gap-1.5 px-3 text-xs font-semibold"
                  >
                    {categoria.titulo}
                    <span className="rounded-full bg-foreground/[0.08] px-1.5 text-[10px] tabular-nums">
                      {quantidade}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div className="mx-auto max-w-6xl px-4 py-7">
        {termo ? (
          <div>
            <p className="mb-5 text-sm text-muted-foreground">
              {resultados.length > 0
                ? `${resultados.length} modelo${resultados.length !== 1 ? 's' : ''} para “${busca}”`
                : `Nenhum modelo encontrado para “${busca}”`}
            </p>
            {resultados.length > 0 ? renderizar(resultados) : vazio}
          </div>
        ) : categoriaAtiva ? (
          <CategoriaEmFoco categoriaAtiva={categoriaAtiva} modelos={daCategoria} renderizar={renderizar} />
        ) : (
          <>
            {destaques.length > 0 && (
              <section className="mb-12">
                <div className="mb-5 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <h2 className="font-heading text-xl font-semibold tracking-tight">Em destaque</h2>
                </div>
                {renderizar(destaques)}
              </section>
            )}

            <div className="space-y-14">
              {CATEGORIAS.map(categoria => {
                const modelos = getModelosPorCategoria(categoria.id)
                if (modelos.length === 0) return null
                const tema = TEMA[categoria.cor]
                const Icone = ICONS[categoria.icon]
                return (
                  <section key={categoria.id} id={`cat-${categoria.id}`} className="scroll-mt-32">
                    <div className="mb-5 flex items-center gap-4">
                      <div className={`rounded-2xl border ${tema.border} ${tema.bg} p-3`}>
                        <Icone className={`h-6 w-6 ${tema.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-heading text-xl font-semibold leading-tight tracking-tight">
                          {categoria.titulo}
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {categoria.subtitulo} · {modelos.length} modelo{modelos.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCategoriaAtiva(categoria.id)}
                        className="tecla hidden h-9 shrink-0 items-center gap-1.5 px-3 text-xs font-semibold text-muted-foreground sm:inline-flex"
                      >
                        Só esta <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {renderizar(modelos)}
                  </section>
                )
              })}
            </div>
          </>
        )}

        <div className="mt-16 border-t border-border pt-6 text-center">
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <GraduationCap className="h-4 w-4 text-primary" />
            Todos os modelos anatômicos têm como fonte a <strong className="font-semibold">{FONTE}</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}

/** A vitrine reduzida a uma categoria, com o caminho de volta sempre visível. */
function CategoriaEmFoco({
  categoriaAtiva,
  modelos,
  renderizar,
}: {
  categoriaAtiva: CategoriaId
  modelos: Modelo3D[]
  renderizar: (modelos: Modelo3D[]) => React.ReactNode
}) {
  const categoria = CATEGORIAS.find(item => item.id === categoriaAtiva)
  if (!categoria) return null
  const tema = TEMA[categoria.cor]
  const Icone = ICONS[categoria.icon]

  return (
    <section>
      <div className="mb-5 flex items-center gap-4">
        <div className={`rounded-2xl border ${tema.border} ${tema.bg} p-3`}>
          <Icone className={`h-6 w-6 ${tema.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-xl font-semibold leading-tight tracking-tight">{categoria.titulo}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {categoria.subtitulo} · {modelos.length} modelo{modelos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      {renderizar(modelos)}
    </section>
  )
}

function BotaoVisao({
  ativo,
  onClick,
  rotulo,
  children,
}: {
  ativo: boolean
  onClick: () => void
  rotulo: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      data-ativo={ativo}
      title={rotulo}
      aria-label={rotulo}
      className="anatomia-segmento-item h-full w-9"
    >
      {children}
    </button>
  )
}
