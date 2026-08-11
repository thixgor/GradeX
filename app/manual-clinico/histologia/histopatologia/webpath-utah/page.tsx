import Link from 'next/link'
import { ArrowLeft, ArrowRight, ExternalLink, Microscope } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { BASE, rotaDoCapituloWebPathUtah, rotaDoWebPathUtah } from '@/lib/histopatologia/rotas'
import { metadadosDoModulo } from '@/lib/histopatologia/seo'
import {
  CAPITULOS_WEBPATH_UTAH,
  TOTAL_ENTRADAS_WEBPATH_UTAH,
} from '@/lib/histopatologia/webpath-utah/catalogo'

export const revalidate = 86400

export const metadata = metadadosDoModulo({
  titulo: 'Atlas WebPath/Utah traduzido',
  descricao: `${TOTAL_ENTRADAS_WEBPATH_UTAH} referências anatomopatológicas do WebPath/Utah organizadas em português, com leitura macroscópica e microscópica guiada.`,
  caminho: rotaDoWebPathUtah(),
})

export default function PaginaDoWebPathUtah() {
  const gerais = CAPITULOS_WEBPATH_UTAH.filter((capitulo) => capitulo.grupo === 'geral')
  const sistemicos = CAPITULOS_WEBPATH_UTAH.filter((capitulo) => capitulo.grupo === 'sistemica')

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <Link
            href={BASE}
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Histopatologia
          </Link>

          <header className="mb-8 max-w-4xl">
            <p className="editorial-mark mb-2">Atlas complementar · WebPath/Utah</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {TOTAL_ENTRADAS_WEBPATH_UTAH.toLocaleString('pt-BR')} referências anatomopatológicas
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Macroscopia e microscopia patológica selecionadas dos índices de patologia geral e
              sistêmica. Cada entrada recebe título em português, modalidade, contexto didático e
              um roteiro de observação no Domine Aqui; a página visual abre no acervo responsável.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
              <span className="rounded-full border border-border bg-card px-3 py-1.5">
                19 capítulos
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5">
                somente anatomopatologia
              </span>
              <a
                href="https://webpath.med.utah.edu/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-border bg-card px-3 transition-colors hover:border-teal-600/50"
              >
                WebPath — University of Utah
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          </header>

          <GrupoDeCapitulos
            id="patologia-geral"
            titulo="Patologia geral"
            descricao="Mecanismos fundamentais de doença, da lesão celular à neoplasia."
            capitulos={gerais}
          />
          <GrupoDeCapitulos
            id="patologia-sistemica"
            titulo="Patologia sistêmica"
            descricao="Doença organizada por órgão e sistema, da peça ao detalhe celular."
            capitulos={sistemicos}
            className="mt-12"
          />
        </div>
      </div>
    </AppShell>
  )
}

function GrupoDeCapitulos({
  id,
  titulo,
  descricao,
  capitulos,
  className = '',
}: {
  id: string
  titulo: string
  descricao: string
  capitulos: typeof CAPITULOS_WEBPATH_UTAH
  className?: string
}) {
  return (
    <section aria-labelledby={id} className={className}>
      <div className="mb-4">
        <h2 id={id} className="font-heading text-xl font-semibold tracking-tight">
          {titulo}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {capitulos.map((capitulo) => (
          <li key={capitulo.id}>
            <Link
              href={rotaDoCapituloWebPathUtah(capitulo.id)}
              className="group flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-teal-600/50"
            >
              <div className="flex items-start justify-between gap-3">
                <Microscope className="h-5 w-5 shrink-0 text-teal-700 dark:text-teal-400" aria-hidden />
                <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">
                  {capitulo.total} referências
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold leading-snug">{capitulo.nome}</h3>
              <p className="mt-1 text-[11px] text-muted-foreground" lang="en">
                {capitulo.nomeOriginal}
              </p>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                {capitulo.descricao}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-400">
                Abrir no Domine Aqui
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
