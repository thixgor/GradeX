import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Eye, Keyboard, ListChecks, ScanSearch } from 'lucide-react'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CasoRaioXImagem } from '@/components/radiologia/caso-raio-x-imagem'
import { CASOS_POR_SLUG, CASOS_RAIO_X, GUIAS_CASOS_RAIO_X, casoVizinho } from '@/lib/radiologia/casos-raio-x'

export const dynamicParams = false

export function generateStaticParams() {
  return CASOS_RAIO_X.map((caso) => ({ slug: caso.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const caso = CASOS_POR_SLUG.get(params.slug)
  if (!caso) return {}
  return {
    title: `${caso.titulo} no Raio-X | Casos de Radiologia`,
    description: caso.resumo,
  }
}

export default function CasoRaioXPage({ params }: { params: { slug: string } }) {
  const caso = CASOS_POR_SLUG.get(params.slug)
  if (!caso) notFound()
  const guia = GUIAS_CASOS_RAIO_X[caso.categoria]
  const anterior = casoVizinho(caso.slug, -1)
  const proximo = casoVizinho(caso.slug, 1)

  return (
    <AreaRadiologia alvo={caso.titulo}>
      <div className="rx surface-page min-h-screen">
        <header className="rx-painel rx-grade relative overflow-hidden border-b border-sky-400/15 text-white">
          <div className="container mx-auto max-w-7xl px-4 pb-6 pt-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-sky-100/55">
              <Link href="/manual-clinico/radiologia/raio-x/casos" className="-m-1 inline-flex items-center gap-1.5 rounded p-1 hover:text-white"><ArrowLeft className="h-4 w-4" /> Casos e alterações</Link>
              <span aria-hidden>›</span>
              <span>{caso.categoriaTitulo}</span>
            </div>
            <p className="editorial-mark mt-5 !text-sky-300/80 [&::before]:bg-sky-300/60">Raio-X de tórax · {caso.imagens.length} exemplo{caso.imagens.length === 1 ? '' : 's'}</p>
            <h1 className="mt-2 max-w-4xl font-heading text-2xl font-semibold tracking-tight sm:text-4xl">{caso.titulo}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-sky-100/65 sm:text-base">{caso.resumo}</p>
          </div>
        </header>

        <main className="container mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <p className="editorial-mark">Entenda o padrão</p>
              <h2 className="mt-2 font-heading text-xl font-semibold">O que a radiografia está mostrando</h2>
              <p className="mt-3 text-sm leading-7 text-foreground/80">{caso.explicacao}</p>
            </article>
            <article className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.04] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400"><ScanSearch className="h-4 w-4" /><p className="text-[10px] font-black uppercase tracking-widest">Pergunta de abertura</p></div>
              <h2 className="mt-2 font-heading text-lg font-semibold leading-snug">{guia.pergunta}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Use o roteiro do capítulo antes de revelar qualquer marcação.</p>
            </article>
          </section>

          <section className="mt-8 space-y-10" aria-label="Imagens do caso">
            {caso.imagens.map((imagem, indice) => (
              <article key={imagem.id} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
                <CasoRaioXImagem imagem={imagem} prioridade={indice === 0} />
                <div className="rounded-2xl border border-border bg-card p-5 xl:sticky xl:top-4">
                  <p className="font-clinical text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">Exemplo {indice + 1} de {caso.imagens.length}</p>
                  <h2 className="mt-1.5 font-heading text-lg font-semibold">{imagem.titulo}</h2>
                  <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-3.5">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300"><Eye className="h-3.5 w-3.5" /> Método ativo</p>
                    <ol className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
                      <li><strong className="text-foreground">1.</strong> Descreva a imagem limpa sem olhar o título.</li>
                      <li><strong className="text-foreground">2.</strong> Ative “Comparar” e arraste o divisor.</li>
                      <li><strong className="text-foreground">3.</strong> Revele a marcação e confira os sinais abaixo.</li>
                    </ol>
                  </div>
                  {caso.sinais.length > 0 && <Lista titulo="Sinais que você precisa encontrar" itens={caso.sinais} icone={CheckCircle2} />}
                  {caso.armadilhas.length > 0 && <Lista titulo="Armadilhas" itens={caso.armadilhas} icone={AlertTriangle} alerta />}
                </div>
              </article>
            ))}
          </section>

          <section className="mt-10 grid gap-4 lg:grid-cols-[1fr_1.25fr]">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><ListChecks className="h-4 w-4 text-sky-500" /> Roteiro de {guia.titulo.toLowerCase()}</h2>
              <ol className="mt-4 space-y-3">
                {guia.roteiro.map((passo, i) => <li key={passo} className="flex gap-3 text-sm leading-relaxed text-muted-foreground"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500 font-clinical text-[10px] font-black text-white">{i + 1}</span>{passo}</li>)}
              </ol>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><Keyboard className="h-4 w-4 text-sky-500" /> Controles do visualizador</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[['M', 'Alterna entre filme limpo e marcado'], ['+ / −', 'Aumenta ou reduz o zoom'], ['0', 'Restaura zoom e comparação'], ['Esc', 'Sai da tela ampliada']].map(([tecla, acao]) => <div key={tecla} className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"><kbd className="min-w-12 rounded border border-border bg-background px-2 py-1 text-center font-clinical text-xs font-black">{tecla}</kbd><span className="text-xs text-muted-foreground">{acao}</span></div>)}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">No celular e tablet, todos os comandos ficam visíveis e têm área de toque; nenhuma função depende de passar o mouse.</p>
            </div>
          </section>

          <nav aria-label="Navegação entre casos" className="mt-10 grid gap-3 sm:grid-cols-2">
            {anterior ? <Link href={`/manual-clinico/radiologia/raio-x/casos/${anterior.slug}`} className="group rounded-2xl border border-border bg-card p-4 transition hover:border-sky-500/50"><span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground"><ArrowLeft className="h-3 w-3" /> Caso anterior</span><strong className="mt-1 block font-heading group-hover:text-sky-600 dark:group-hover:text-sky-400">{anterior.titulo}</strong></Link> : <span />}
            {proximo && <Link href={`/manual-clinico/radiologia/raio-x/casos/${proximo.slug}`} className="group rounded-2xl border border-border bg-card p-4 text-right transition hover:border-sky-500/50"><span className="flex items-center justify-end gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Próximo caso <ArrowRight className="h-3 w-3" /></span><strong className="mt-1 block font-heading group-hover:text-sky-600 dark:group-hover:text-sky-400">{proximo.titulo}</strong></Link>}
          </nav>

          <p className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Escopo educacional.</strong> O conteúdo ensina interpretação radiográfica e não substitui avaliação clínica, laudo médico, protocolos locais ou conduta de emergência.</p>
        </main>
      </div>
    </AreaRadiologia>
  )
}

function Lista({ titulo, itens, icone: Icone, alerta = false }: { titulo: string; itens: string[]; icone: typeof CheckCircle2; alerta?: boolean }) {
  return <div className="mt-5"><h3 className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${alerta ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}><Icone className="h-3.5 w-3.5" />{titulo}</h3><ul className="mt-2 space-y-2">{itens.map((item) => <li key={item} className="flex gap-2 text-xs leading-relaxed text-muted-foreground"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${alerta ? 'bg-amber-500' : 'bg-sky-500'}`} />{item}</li>)}</ul></div>
}
