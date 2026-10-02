'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, Loader2, Route, Search } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { BackLink, PageHeader, PageScaffold } from '@/components/page-scaffold'
import { rotaDoMeuEstudo, rotaDoTema, listarEstudos } from '@/components/manual-clinico/integracao/api'
import { IconeDoModulo } from '@/components/manual-clinico/integracao/icone-do-modulo'
import { ETAPAS, MODULOS, ORDEM_DAS_ETAPAS } from '@/lib/manual-clinico/integracao/modulos'
import type { EstudoResumo, ModuloIntegrado } from '@/lib/manual-clinico/integracao/tipos'

/**
 * A porta do Estudo Integrado: digitar um tema e ver tudo o que os manuais têm
 * sobre ele, e voltar aos estudos já montados.
 */

const EXEMPLOS = ['Neoplasia renal', 'Pneumonia', 'Cirrose', 'Apendicite', 'Infarto do miocárdio', 'Pielonefrite']

const MODULOS_EM_ORDEM: ModuloIntegrado[] = [
  'histologia',
  'semiologia',
  'exames',
  'radiologia',
  'histopatologia',
  'manual',
  'eletrocardiograma',
  'farmacologia',
  'ferramentas',
]

function Conteudo() {
  const router = useRouter()
  const [tema, setTema] = useState('')
  const [estudos, setEstudos] = useState<EstudoResumo[] | null>(null)
  const [semAcesso, setSemAcesso] = useState(false)

  useEffect(() => {
    listarEstudos()
      .then(setEstudos)
      .catch((e) => {
        setEstudos([])
        if (e.status === 403) setSemAcesso(true)
      })
  }, [])

  const abrirTema = (texto: string) => {
    const q = texto.trim()
    if (q.length >= 2) router.push(rotaDoTema({ q }))
  }

  return (
    <PageScaffold>
      <BackLink href="/manual-clinico" className="mb-4">Manual Clínico</BackLink>
      <PageHeader
        eyebrow="Estudo Integrado"
        title="Um tema, todos os manuais"
        description="Digite um assunto e veja, na ordem em que se estuda, o que a Histologia, a Semiologia, os Exames, a Radiologia, a Histopatologia, o Manual Clínico e a Farmacologia têm sobre ele. Depois guarde num estudo seu e marque o que já estudou."
      />

      {semAcesso ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          O Estudo Integrado faz parte do Manual Clínico.{' '}
          <Link href="/manual-clinico" className="font-semibold text-primary underline">
            Conheça o pacote
          </Link>
          .
        </div>
      ) : null}

      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          abrirTema(tema)
        }}
      >
        <label htmlFor="tema" className="sr-only">Tema para integrar</label>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="tema"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            maxLength={120}
            placeholder="Que tema você quer integrar? Ex.: neoplasia renal"
            className="min-h-[48px] w-full rounded-xl border border-border bg-card pl-9 pr-3 text-base"
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          <Route className="h-4 w-4" aria-hidden /> Integrar
        </button>
      </form>
      <div className="mb-8 flex flex-wrap gap-2">
        {EXEMPLOS.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => abrirTema(ex)}
            className="min-h-[36px] rounded-full border border-border bg-background px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {ex}
          </button>
        ))}
      </div>

      <section aria-labelledby="meus-estudos" className="mb-10">
        <h2 id="meus-estudos" className="mb-3 font-heading text-lg font-semibold tracking-tight">Meus estudos</h2>
        {estudos === null ? (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Carregando…
          </p>
        ) : estudos.length === 0 ? (
          <p className="max-w-2xl rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Você ainda não montou nenhum estudo. Abra um tema acima — ou, em qualquer ficha dos manuais, use{' '}
            <strong>Guardar</strong> no painel “Estude este tema em todos os manuais”.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {estudos.map((e) => {
              const pct = e.total ? Math.round((e.feitos / e.total) * 100) : 0
              return (
                <li key={e.id}>
                  <Link
                    href={rotaDoMeuEstudo(e.id)}
                    className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="font-semibold leading-snug">{e.titulo}</span>
                    <span className="text-xs text-muted-foreground">
                      {e.feitos} de {e.total} estudados
                    </span>
                    <span className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      Continuar <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="como-funciona" className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 id="como-funciona" className="mb-1 font-heading text-lg font-semibold tracking-tight">Como a trilha é montada</h2>
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          As ligações são automáticas: o Estudo Integrado reconhece o órgão e a natureza de cada assunto (um tumor do rim,
          uma infecção do pulmão) e junta a mesma doença e as suas “irmãs” em todos os manuais. Tudo aparece nesta ordem:
        </p>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ORDEM_DAS_ETAPAS.map((etapa) => (
            <li key={etapa} className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-bold text-primary">{ETAPAS[etapa].numero}. {ETAPAS[etapa].titulo}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{ETAPAS[etapa].pergunta}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {MODULOS_EM_ORDEM.map((m) => (
            <span key={m} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${MODULOS[m].cor}`}>
              <IconeDoModulo modulo={m} className="h-3 w-3" /> {MODULOS[m].nome}
            </span>
          ))}
        </div>
      </section>
    </PageScaffold>
  )
}

export default function EstudoIntegradoPage() {
  return (
    <AppShell>
      <Conteudo />
    </AppShell>
  )
}
