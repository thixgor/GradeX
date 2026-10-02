'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Loader2, Route, Search } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { BackLink, PageHeader, PageScaffold } from '@/components/page-scaffold'
import { AdicionarAoEstudo } from '@/components/manual-clinico/integracao/adicionar-ao-estudo'
import { ROTA_ESTUDO_INTEGRADO, buscarConexoes, rotaDoTema } from '@/components/manual-clinico/integracao/api'
import { SeloDoModulo, TrilhaDeConexoes } from '@/components/manual-clinico/integracao/trilha'
import type { RespostaConexoes } from '@/lib/manual-clinico/integracao/tipos'
import { nomeDoOrgao, pluralDaNatureza } from '@/lib/manual-clinico/integracao/vocabulario'

/**
 * A trilha completa de um tema — a partir de uma ficha (`?ref=`) ou de um
 * assunto digitado (`?q=`). Mostra tudo o que os manuais têm, na ordem do
 * estudo, e deixa guardar o conjunto como um estudo seu.
 */
function Trilha() {
  const params = useSearchParams()
  const router = useRouter()
  const ref = params.get('ref') ?? undefined
  const q = params.get('q') ?? undefined

  const [dados, setDados] = useState<RespostaConexoes | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [novoTema, setNovoTema] = useState(q ?? '')

  useEffect(() => {
    if (!ref && !q) return
    let cancelado = false
    setDados(null)
    setErro(null)
    buscarConexoes({ ref, q, completo: true })
      .then((r) => !cancelado && setDados(r))
      .catch((e) => {
        if (cancelado) return
        setErro(e.status === 403 ? 'O Estudo Integrado faz parte do Manual Clínico.' : e.message)
      })
    return () => {
      cancelado = true
    }
  }, [ref, q])

  const titulo = dados?.origem?.titulo ?? q ?? 'Estudo Integrado'
  const todas = dados ? dados.grupos.flatMap((g) => g.itens.map((i) => i.ref)) : []
  const leitura = dados?.origem
    ? [
        ...dados.origem.orgaos.slice(0, 2).map(nomeDoOrgao),
        ...dados.origem.naturezas.slice(0, 2).map(pluralDaNatureza),
      ]
    : []

  return (
    <PageScaffold>
      <BackLink href={ROTA_ESTUDO_INTEGRADO} className="mb-4">Estudo Integrado</BackLink>
      <PageHeader
        eyebrow="Trilha integrada"
        title={titulo}
        description={
          leitura.length > 0
            ? `Lido como: ${leitura.join(' · ')}. Do tecido normal à conduta, com o que cada manual tem sobre o tema.`
            : 'Do tecido normal à conduta, com o que cada manual tem sobre o tema.'
        }
        actions={
          dados && todas.length > 0 ? (
            <AdicionarAoEstudo
              refs={ref ? [ref, ...todas] : todas}
              tituloSugerido={titulo}
              rotulo="Salvar como meu estudo"
              variante="botao"
            />
          ) : null
        }
      />

      <form
        className="mb-6 flex max-w-xl gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (novoTema.trim().length >= 2) router.push(rotaDoTema({ q: novoTema.trim() }))
        }}
      >
        <label htmlFor="outro-tema" className="sr-only">Outro tema</label>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="outro-tema"
            value={novoTema}
            onChange={(e) => setNovoTema(e.target.value)}
            maxLength={120}
            placeholder="Integrar outro tema…"
            className="min-h-[44px] w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm"
          />
        </div>
        <button type="submit" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-semibold">
          <Route className="h-4 w-4" aria-hidden /> Integrar
        </button>
      </form>

      {dados?.origem?.href && dados.origem.modulo ? (
        <p className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          Ponto de partida:
          <SeloDoModulo modulo={dados.origem.modulo} />
          <Link href={dados.origem.href} className="font-semibold text-foreground underline-offset-2 hover:underline">
            {dados.origem.titulo}
          </Link>
        </p>
      ) : null}

      {!ref && !q ? (
        <p className="text-sm text-muted-foreground">Escolha um tema para montar a trilha.</p>
      ) : erro ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{erro}</p>
      ) : !dados ? (
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Montando a trilha…
        </p>
      ) : dados.total === 0 ? (
        <p className="max-w-xl rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Nada encontrado para “{titulo}”. Tente o nome da doença ou do órgão (“carcinoma renal”, “fígado”).
        </p>
      ) : (
        <TrilhaDeConexoes grupos={dados.grupos} />
      )}
    </PageScaffold>
  )
}

export default function TemaIntegradoPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <Trilha />
      </Suspense>
    </AppShell>
  )
}
