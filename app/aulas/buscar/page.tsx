'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Check,
  Compass,
  FileText,
  Layers,
  Lock,
  Play,
  Route,
  Search,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { RESPIRO_DA_DOCA } from '@/components/ensino/doca'
import { EstadoVazio, Esqueleto } from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * A busca (§15).
 *
 * O RESULTADO VEM SEPARADO POR TIPO, E ISSO É O PRODUTO
 *
 * Buscar "insuficiência cardíaca" numa plataforma de estudo tem pelo menos
 * quatro intenções possíveis: aprender do zero (Trilha), rever um ponto
 * específico (aula), revisar antes da prova (resumo, PDF) ou treinar
 * (flashcards). Uma lista única obrigaria o aluno a ler tudo para descobrir
 * qual linha serve. Aqui cada intenção tem a sua seção, na ordem em que ela
 * costuma aparecer.
 *
 * A tela é intencionalmente sem miniatura: numa busca, a leitura é por título,
 * e capas de vídeo tornariam a varredura mais lenta, não mais rápida.
 */

interface Resultado {
  id: string
  tipo: string
  titulo: string
  detalhe?: string
  href: string
  extra?: Record<string, any>
}

interface Grupo {
  tipo: string
  rotulo: string
  itens: Resultado[]
}

const ICONE_DO_TIPO: Record<string, LucideIcon> = {
  trilha: Route,
  aula: Play,
  resumo: Sparkles,
  pdf: FileText,
  flashcards: Layers,
  topico: Compass,
}

export default function BuscarPage() {
  return (
    <AppShell headerTitle="Buscar" headerSubtitle="Aulas, Trilhas e materiais" comercio={false}>
      <Suspense
        fallback={
          <div className="container mx-auto max-w-4xl px-4 py-8">
            <Esqueleto className="h-40 w-full" />
          </div>
        }
      >
        <Conteudo />
      </Suspense>
    </AppShell>
  )
}

function Conteudo() {
  const parametros = useSearchParams()
  const router = useRouter()
  const termoDaUrl = parametros.get('q') || ''

  const [termo, setTermo] = useState(termoDaUrl)
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    setTermo(termoDaUrl)
    if (termoDaUrl.trim().length < 2) {
      setGrupos([])
      setTotal(0)
      return
    }

    let cancelado = false
    setCarregando(true)
    fetch(`/api/ensino/busca?q=${encodeURIComponent(termoDaUrl)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelado || !d) return
        setGrupos(d.grupos || [])
        setTotal(d.total || 0)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [termoDaUrl])

  function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    const limpo = termo.trim()
    if (limpo.length < 2) return
    router.push(`/aulas/buscar?q=${encodeURIComponent(limpo)}`)
  }

  return (
    <div className={`container mx-auto max-w-4xl px-4 ${RESPIRO_DA_DOCA}`}>

      {/* O campo gruda no topo (§8).
          Refinar a busca é o gesto mais comum desta tela — a primeira lista
          quase nunca é a última. Com o campo rolando junto com os resultados,
          cada tentativa exigia voltar ao topo; grudado, digitar de novo custa
          um toque de onde a pessoa estiver. */}
      <form
        onSubmit={enviar}
        className="sticky top-14 z-20 -mx-4 mb-5 bg-background/90 px-4 py-3 backdrop-blur-md sm:top-16"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            autoFocus
            enterKeyHint="search"
            placeholder="hipercalemia, insuficiência cardíaca, ECG…"
            aria-label="Buscar"
            className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-12 text-base outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
          {termo ? (
            <button
              type="button"
              onClick={() => {
                setTermo('')
                router.push('/aulas/buscar')
              }}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted"
            >
              <X className="h-[1.15rem] w-[1.15rem]" />
            </button>
          ) : null}
        </div>
      </form>

      {termoDaUrl.trim().length < 2 ? (
        <EstadoVazio
          icone={Search}
          titulo="O que você quer estudar?"
          descricao="Um assunto, o nome de uma aula ou de uma Trilha."
          acaoLabel="Navegar por assunto"
          acaoHref="/aulas/explorar"
        />
      ) : carregando ? (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Esqueleto className="h-4 w-32" />
              <Esqueleto className="h-14 w-full" />
              <Esqueleto className="h-14 w-full" />
            </div>
          ))}
        </div>
      ) : grupos.length === 0 ? (
        <EstadoVazio
          icone={Search}
          titulo={`Nada encontrado para "${termoDaUrl}"`}
          descricao="Tente outra palavra, ou navegue pelo conteúdo por assunto."
          acaoLabel="Navegar por assunto"
          acaoHref="/aulas/explorar"
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {total} {total === 1 ? 'resultado' : 'resultados'} para{' '}
            <span className="font-semibold text-foreground">{termoDaUrl}</span>
          </p>

          <div className="space-y-7">
            {grupos.map((grupo) => {
              const Icone = ICONE_DO_TIPO[grupo.tipo] || Play
              return (
                <section key={grupo.tipo}>
                  <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <Icone className="h-3.5 w-3.5" />
                    {grupo.rotulo}
                  </h2>
                  <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-card">
                    {grupo.itens.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="group flex min-h-[3.5rem] items-center gap-3 px-4 py-3 transition hover:bg-muted/60"
                      >
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              'block truncate text-sm font-semibold transition group-hover:text-primary',
                              item.extra?.concluida && 'text-muted-foreground',
                            )}
                          >
                            {item.titulo}
                          </span>
                          {item.detalhe ? (
                            <span className="block truncate text-xs text-muted-foreground">
                              {item.detalhe}
                            </span>
                          ) : null}
                        </span>

                        <span className="flex flex-none items-center gap-2 text-xs tabular-nums text-muted-foreground">
                          {item.extra?.concluida ? (
                            <Check className="h-4 w-4 text-primary" strokeWidth={3} />
                          ) : null}
                          {item.extra?.liberado === false ? <Lock className="h-3.5 w-3.5" /> : null}
                          {item.extra?.duracao || null}
                          {grupo.tipo === 'trilha' && item.extra?.aulas
                            ? `${item.extra.aulas} aulas`
                            : null}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
