'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, Crown, ImageIcon, Layers3, ScanLine, Target } from 'lucide-react'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { LogoRadiologia } from '@/components/radiologia/logo'
import { SECOES, TOTAL_CORTES, TOTAL_ESTRUTURAS, TOTAL_SUBSECOES, caminhoDoCorte } from '@/lib/tomografia'
import { ESTUDOS_RAIO_X, TOTAL_ESTRUTURAS_RAIO_X } from '@/lib/radiologia/raio-x'

export default function RadiologiaPage() {
  const primeiraSerie = SECOES[0]?.subsecoes[0]
  const capaTc = primeiraSerie ? caminhoDoCorte(primeiraSerie, Math.max(1, Math.round(primeiraSerie.totalCortes / 2))) : ''

  return (
    <AreaRadiologia>
      <div className="surface-page min-h-screen">
        <header className="relative overflow-hidden border-b border-border bg-muted/30">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_48%)]" />
          <div className="container relative mx-auto max-w-6xl px-4 pb-10 pt-7 sm:pb-14">
            <Link href="/manual-clinico" className="-m-2 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground transition hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Voltar ao Manual Clínico
            </Link>
            <div className="mt-6 max-w-3xl">
              <p className="editorial-mark mb-3">Manual Clínico · Diagnóstico por imagem</p>
              <LogoRadiologia />
              <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Um único manual para aprender a anatomia que aparece na imagem. Percorra pilhas reais de tomografia
                como em uma estação de trabalho e, na nova seção de Raio-X, acenda cada estrutura diretamente sobre
                28 incidências, com técnica, roteiro sistemático, armadilhas e correlação anatômica.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300"><Crown className="h-3.5 w-3.5" /> Acesso do Manual Clínico</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground"><ScanLine className="h-3.5 w-3.5 text-sky-500" /> 2 modalidades</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground"><Target className="h-3.5 w-3.5 text-sky-500" /> {TOTAL_ESTRUTURAS + TOTAL_ESTRUTURAS_RAIO_X} estruturas catalogadas</span>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto max-w-6xl px-4 py-10">
          <div className="mb-6">
            <p className="editorial-mark mb-2">Escolha a modalidade</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Do volume ao filme, sem perder a anatomia</h1>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Link href="/manual-clinico/tomografia" className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-md">
              <div className="relative aspect-[16/9] overflow-hidden bg-black">
                {capaTc && <img src={capaTc} alt="Corte de tomografia computadorizada" className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]" />}
                <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">Tomografia computadorizada</div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-xl font-semibold">Atlas de TC por cortes</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Tórax, abdome e crânio em {TOTAL_SUBSECOES} séries e {TOTAL_CORTES} cortes. Troque janelas, salte para estruturas, leia o dossiê e teste-se.</p>
                  </div>
                  <Layers3 className="h-6 w-6 shrink-0 text-violet-500" />
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-violet-600 dark:text-violet-400">Abrir tomografias <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
              </div>
            </Link>

            <Link href="/manual-clinico/radiologia/raio-x" className="group overflow-hidden rounded-2xl border border-sky-500/25 bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-sky-500/55 hover:shadow-md">
              <div className="relative aspect-[16/9] overflow-hidden bg-black">
                <img src="https://www.clinicalanatomy.ca/radiology/thorax/thoraxPA.png" alt="Radiografia de tórax em incidência PA" className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]" referrerPolicy="no-referrer" />
                <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-sky-500/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow backdrop-blur">Novo · Raio-X</div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-xl font-semibold">Atlas radiográfico guiado</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ESTUDOS_RAIO_X.length} incidências por região, {TOTAL_ESTRUTURAS_RAIO_X} demarcações interativas, tradução pt-BR e explicação aprofundada de técnica e leitura.</p>
                  </div>
                  <ImageIcon className="h-6 w-6 shrink-0 text-sky-500" />
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-sky-600 dark:text-sky-400">Abrir seção de Raio-X <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
              </div>
            </Link>
          </div>

          <section className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              [BookOpen, 'Conteúdo aprofundado', 'Cada exame traz técnica, critérios de qualidade e roteiro de leitura na ordem clínica.'],
              [Target, 'Anatomia demarcada', 'Clique na estrutura para acender a sobreposição fornecida pelo atlas autorizado.'],
              [ScanLine, 'Leitura sistemática', 'Técnica, critérios de qualidade e sequência de análise para estudar cada incidência com método.'],
            ].map(([Icon, titulo, texto]) => {
              const C = Icon as typeof BookOpen
              return <div key={String(titulo)} className="rounded-xl border border-border bg-card p-4"><C className="mb-2 h-5 w-5 text-sky-500" /><h3 className="text-sm font-bold">{String(titulo)}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{String(texto)}</p></div>
            })}
          </section>
        </main>
      </div>
    </AreaRadiologia>
  )
}
