import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import {
  ALTERACOES_EDITORIAIS,
  AVISO_EDUCACIONAL,
  CREDITO_BASE,
  LISTA_DE_FONTES,
} from '@/lib/histopatologia/direitos'
import { BASE, rotaDosCreditos } from '@/lib/histopatologia/rotas'
import { metadadosDoModulo } from '@/lib/histopatologia/seo'

export const revalidate = 86400

export const metadata = metadadosDoModulo({
  titulo: 'Créditos, proveniência e direitos',
  descricao:
    'Créditos das fontes catalogadas e declaração das alterações editoriais feitas pelo Domine Aqui.',
  caminho: rotaDosCreditos(),
})

/** Créditos e atribuições das fontes usadas no módulo. */
export default function PaginaDeCreditos() {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-3xl px-4 py-6">
          <Link
            href={BASE}
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Histopatologia
          </Link>

          <header className="mb-6">
            <p className="editorial-mark mb-2">Transparência</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Créditos, proveniência e direitos
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{CREDITO_BASE}</p>
          </header>

          <section aria-labelledby="fontes-creditos" className="mb-8">
            <h2 id="fontes-creditos" className="mb-3 font-heading text-lg font-semibold">
              Fontes catalogadas
            </h2>
            <ul className="space-y-3">
              {LISTA_DE_FONTES.map((fonte) => (
                <li key={fonte.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold">{fonte.creditoCurto}</p>
                    <span className="rounded-full border border-emerald-600/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      Direitos aprovados
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {fonte.atribuicaoCatalogada}
                  </p>
                  <dl className="mt-2 space-y-1 text-[11px] leading-relaxed">
                    <div>
                      <dt className="inline font-bold">Crédito curto: </dt>
                      <dd className="inline text-muted-foreground">{fonte.creditoCurto}</dd>
                    </div>
                    <div>
                      <dt className="inline font-bold">Site: </dt>
                      <dd className="inline">
                        <a
                          href={fonte.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {fonte.url}
                        </a>
                      </dd>
                    </div>
                    {fonte.doi && (
                      <div>
                        <dt className="inline font-bold">DOI: </dt>
                        <dd className="inline">
                          <a
                            href={`https://doi.org/${fonte.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {fonte.doi}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="alteracoes" className="mb-8">
            <h2 id="alteracoes" className="mb-2 font-heading text-lg font-semibold">
              O que é trabalho editorial do Domine Aqui
            </h2>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Estas alterações são de autoria do Domine Aqui e{' '}
              <strong>não devem ser atribuídas às instituições-fonte</strong>. Em particular, todo o
              texto didático — definição, mecanismo, roteiro por aumento, diferenciais e
              autoavaliação — é nosso, e é ele que aguarda revisão médica.
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
              {ALTERACOES_EDITORIAIS.map((alteracao) => (
                <li key={alteracao}>{alteracao}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="aviso-medico">
            <h2 id="aviso-medico" className="mb-2 font-heading text-lg font-semibold">
              Aviso médico
            </h2>
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-relaxed">
              {AVISO_EDUCACIONAL}
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
