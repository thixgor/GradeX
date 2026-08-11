'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, CheckCircle2, Eye, Info, Lightbulb, ListChecks, RotateCcw, ShieldAlert, Target } from 'lucide-react'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { descricaoEstrutura, GUIAS_RAIO_X, type EstudoRaioX } from '@/lib/radiologia/raio-x'

export function EstudoRaioXView({ estudo }: { estudo: EstudoRaioX }) {
  const [indice, setIndice] = useState<number | null>(0)
  const estrutura = indice == null ? null : estudo.estruturas[indice]
  const guia = GUIAS_RAIO_X[estudo.regiao]

  return (
    <AreaRadiologia>
      <div className="surface-page min-h-screen">
        <header className="border-b border-border bg-muted/30">
          <div className="container mx-auto max-w-7xl px-4 py-6">
            <Link href="/manual-clinico/radiologia/raio-x" className="-m-2 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Atlas de Raio-X</Link>
            <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="editorial-mark">{estudo.regiaoTitulo} · incidência {estudo.incidencia}</p>
                <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{estudo.titulo}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{estudo.foco}</p>
              </div>
              <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">{estudo.estruturas.length} estruturas demarcadas</span>
            </div>
          </div>
        </header>

        <main className="container mx-auto max-w-7xl px-4 py-8">
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
            <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-sm">
              <div className="flex items-center justify-between border-b border-white/10 bg-neutral-950 px-4 py-3 text-white">
                <span className="inline-flex items-center gap-2 text-xs font-bold"><Eye className="h-4 w-4 text-sky-400" /> Anatomia guiada</span>
                <button onClick={() => setIndice(null)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-white/60 transition hover:bg-white/10 hover:text-white"><RotateCcw className="h-3 w-3" /> Ver sem marcação</button>
              </div>
              <div className="relative mx-auto w-full max-w-4xl">
                <img src={estudo.imagem} alt={`Radiografia de ${estudo.titulo} em ${estudo.incidencia}`} referrerPolicy="no-referrer" className="block h-auto w-full" />
                {estrutura && <img key={estrutura.sobreposicao} src={estrutura.sobreposicao} alt={`Demarcação: ${estrutura.nome}`} referrerPolicy="no-referrer" className="pointer-events-none absolute inset-0 h-full w-full object-contain animate-in fade-in duration-200" />}
              </div>
              <div className="border-t border-white/10 bg-neutral-950 px-4 py-3 text-xs leading-relaxed text-white/70">
                {estrutura ? <><span className="font-bold text-sky-300">{estrutura.nome}:</span> {descricaoEstrutura(estudo, estrutura)}</> : 'Imagem sem demarcação. Selecione uma estrutura na lista para acendê-la.'}
              </div>
            </div>

            <aside className="rounded-2xl border border-border bg-card p-4 shadow-sm xl:max-h-[820px] xl:overflow-y-auto">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><Target className="h-5 w-5 text-sky-500" /> Estruturas visíveis</h2>
                <span className="text-[10px] font-bold text-muted-foreground">clique para demarcar</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {estudo.estruturas.map((item, itemIndice) => (
                  <button key={`${item.nome}-${item.sobreposicao}`} onClick={() => setIndice(itemIndice)} aria-pressed={indice === itemIndice} className={`rounded-lg border p-3 text-left transition ${indice === itemIndice ? 'border-sky-500 bg-sky-500/10' : 'border-border bg-muted/20 hover:border-sky-500/35 hover:bg-muted/40'}`}>
                    <span className={`block text-sm font-bold ${indice === itemIndice ? 'text-sky-700 dark:text-sky-300' : ''}`}>{item.nome}</span>
                    <span className="mt-0.5 block text-[10px] italic text-muted-foreground">{item.original}</span>
                  </button>
                ))}
              </div>
            </aside>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <Bloco icon={Info} titulo="Contexto anatômico"><p>{guia.contexto}</p></Bloco>
            <Bloco icon={BookOpen} titulo="Técnica e posicionamento"><p>{guia.tecnica}</p></Bloco>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Bloco icon={ListChecks} titulo="Roteiro de leitura sistemática">
              <ol className="mt-1 space-y-3">
                {guia.roteiro.map((item, itemIndice) => <li key={item.passo} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-[11px] font-black text-white">{itemIndice + 1}</span><span><strong className="text-foreground">{item.passo}.</strong> {item.detalhe}</span></li>)}
              </ol>
            </Bloco>
            <Bloco icon={CheckCircle2} titulo="Critérios de qualidade">
              <Lista itens={guia.qualidade} />
            </Bloco>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <Bloco icon={ShieldAlert} titulo="Armadilhas de interpretação"><Lista itens={guia.armadilhas} /></Bloco>
            <Bloco icon={Lightbulb} titulo="Pérolas de alto rendimento"><Lista itens={guia.perolas} /></Bloco>
          </section>

          <section className="mt-8 rounded-xl border border-sky-500/20 bg-sky-500/[0.05] p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-bold text-foreground">Escopo educacional</p>
            <p className="mt-1">Material educacional de anatomia radiográfica. Não substitui laudo médico, avaliação clínica, protocolos institucionais nem a escolha do método de imagem apropriado.</p>
          </section>
        </main>
      </div>
    </AreaRadiologia>
  )
}

function Bloco({ icon: Icon, titulo, children }: { icon: typeof Info; titulo: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><Icon className="h-5 w-5 text-sky-500" />{titulo}</h2><div className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div></div>
}

function Lista({ itens }: { itens: string[] }) {
  return <ul className="space-y-2">{itens.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" /><span>{item}</span></li>)}</ul>
}
