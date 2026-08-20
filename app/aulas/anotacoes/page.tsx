'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { StickyNote, Search, Star } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { RESPIRO_DA_DOCA, RESPIRO_DO_TOPO } from '@/components/ensino/doca'
import { EstadoVazio, Esqueleto } from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * "Minhas Anotações" (§11).
 *
 * O caderno inteiro do aluno, atravessando todas as aulas. Antes, uma anotação
 * só existia dentro da aula em que foi escrita — o que a tornava inútil para a
 * única coisa que um caderno serve: reler antes da prova, sem lembrar em que
 * vídeo cada frase foi escrita.
 *
 * O agrupamento é por AULA porque a unidade de leitura de um caderno é o
 * assunto. E cada anotação com carimbo leva ao segundo exato do vídeo: é o que
 * transforma a lista num índice do próprio conteúdo, em vez de num arquivo de
 * texto solto.
 */

interface Anotacao {
  _id: string
  conteudo: string
  segundo: number | null
  destacada: boolean
  tempoLabel: string | null
  href: string
}

interface GrupoDeAnotacoes {
  aulaId: string
  titulo: string
  localizacao?: string
  href: string
  anotacoes: Anotacao[]
}

function paraBusca(texto: string) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export default function MinhasAnotacoesPage() {
  return (
    <AppShell headerTitle="Minhas Anotações" headerSubtitle="Seu caderno de estudo" comercio={false} vidro>
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const [grupos, setGrupos] = useState<GrupoDeAnotacoes[]>([])
  const [total, setTotal] = useState(0)
  const [logado, setLogado] = useState(true)
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [soDestacadas, setSoDestacadas] = useState(false)

  useEffect(() => {
    let cancelado = false
    setCarregando(true)
    fetch(`/api/ensino/anotacoes${soDestacadas ? '?destacadas=1' : ''}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelado || !d) return
        setGrupos(d.grupos || [])
        setTotal(d.total || 0)
        setLogado(d.logado !== false)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [soDestacadas])

  const visiveis = useMemo(() => {
    const termo = paraBusca(busca).trim()
    if (!termo) return grupos
    return grupos
      .map((grupo) => ({
        ...grupo,
        anotacoes: grupo.anotacoes.filter(
          (a) => paraBusca(a.conteudo).includes(termo) || paraBusca(grupo.titulo).includes(termo),
        ),
      }))
      .filter((grupo) => grupo.anotacoes.length > 0)
  }, [grupos, busca])

  return (
    <div className={`container mx-auto max-w-4xl px-4 ${RESPIRO_DO_TOPO} ${RESPIRO_DA_DOCA}`}>

      <header className="mb-5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Minhas Anotações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total > 0
            ? `${total} ${total === 1 ? 'anotação' : 'anotações'} em ${grupos.length} ${grupos.length === 1 ? 'aula' : 'aulas'}. Clique no horário para voltar ao ponto exato do vídeo.`
            : 'Tudo que você escreveu enquanto estudava, num lugar só.'}
        </p>
      </header>

      {logado && (total > 0 || busca) ? (
        <div className="mb-5 flex flex-wrap gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar nas suas anotações…"
              aria-label="Buscar nas anotações"
              className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <button
            type="button"
            onClick={() => setSoDestacadas((v) => !v)}
            aria-pressed={soDestacadas}
            className={cn(
              'inline-flex h-10 flex-none items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold transition',
              soDestacadas
                ? 'bg-primary text-primary-foreground'
                : 'border border-border hover:bg-muted',
            )}
          >
            <Star className={cn('h-4 w-4', soDestacadas && 'fill-current')} />
            Destacadas
          </button>
        </div>
      ) : null}

      {carregando ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Esqueleto key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : !logado ? (
        <EstadoVazio
          icone={StickyNote}
          titulo="Entre para ver seu caderno"
          descricao="As anotações ficam guardadas na sua conta e acompanham você entre aparelhos."
          acaoLabel="Entrar"
          acaoHref="/auth/login"
        />
      ) : visiveis.length === 0 ? (
        <EstadoVazio
          icone={StickyNote}
          titulo={total === 0 ? 'Seu caderno está vazio' : 'Nada encontrado'}
          descricao={
            total === 0
              ? 'Enquanto assiste a uma aula, abra a aba Anotações e escreva. O horário do vídeo fica carimbado junto.'
              : 'Tente outra palavra ou desligue o filtro de destacadas.'
          }
          acaoLabel={total === 0 ? 'Ir para as Trilhas' : undefined}
          acaoHref={total === 0 ? '/aulas/trilhas' : undefined}
        />
      ) : (
        <div className="space-y-4">
          {visiveis.map((grupo) => (
            <section
              key={grupo.aulaId}
              className="overflow-hidden rounded-2xl border border-border/70 bg-card"
            >
              <div className="border-b border-border/60 px-4 py-3">
                {grupo.localizacao ? (
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {grupo.localizacao}
                  </p>
                ) : null}
                <h2 className="font-heading text-base font-semibold tracking-tight">
                  <Link href={grupo.href} className="transition hover:text-primary">
                    {grupo.titulo}
                  </Link>
                </h2>
              </div>

              <ul className="divide-y divide-border/50">
                {grupo.anotacoes.map((anotacao) => (
                  <li key={anotacao._id} className="flex gap-3 px-4 py-3">
                    {anotacao.tempoLabel ? (
                      <Link
                        href={anotacao.href}
                        className="mt-0.5 inline-flex h-6 flex-none items-center rounded-md bg-primary/12 px-2 text-xs font-bold tabular-nums text-primary transition hover:bg-primary hover:text-primary-foreground"
                      >
                        {anotacao.tempoLabel}
                      </Link>
                    ) : (
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-muted-foreground/40" />
                    )}
                    <p className="min-w-0 flex-1 whitespace-pre-line text-sm leading-relaxed">
                      {anotacao.conteudo}
                    </p>
                    {anotacao.destacada ? (
                      <Star className="mt-0.5 h-4 w-4 flex-none fill-accent text-accent" />
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
