'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, Loader2, Megaphone, Pin, Plus, X, XCircle } from 'lucide-react'
import { ordenarAvisos, TIPOS_DE_AVISO, type TipoDeAviso } from '@/lib/aulas/avisos'
import { cn } from '@/lib/utils'

/**
 * Mural de avisos do curso (§36).
 *
 * O curso precisa de um lugar para falar com quem está matriculado — "a aula de
 * quinta mudou de horário", "o módulo 4 foi regravado". Sem isso o recado vai
 * para o WhatsApp e some, e quem entra depois nunca fica sabendo.
 *
 * Fica no topo da página do curso, acima do conteúdo, porque um aviso que
 * aparece depois da lista de aulas chega tarde: a pessoa já clicou na aula.
 *
 * Para quem administra, o editor mora aqui mesmo em vez de numa tela separada.
 * Escrever um recado é uma ação de segundos feita no contexto do curso; mandar o
 * admin sair, achar outra tela e escolher o curso de novo é o tipo de atrito que
 * faz o aviso não ser escrito.
 */

interface Aviso {
  _id: string
  titulo: string
  mensagem: string
  tipo: TipoDeAviso
  fixado?: boolean
  criadoEm: string
  criadoPorNome?: string
}

const ICONE: Record<TipoDeAviso, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
}

const TOM: Record<TipoDeAviso, string> = {
  info: 'border-primary/30 bg-primary/5 text-primary',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
}

const ROTULO_DO_TIPO: Record<TipoDeAviso, string> = {
  info: 'Informação',
  warning: 'Atenção',
  success: 'Boa notícia',
  error: 'Urgente',
}

export function MuralDeAvisos({
  cursoId,
  podeGerenciar = false,
}: {
  cursoId: string
  podeGerenciar?: boolean
}) {
  const [avisos, setAvisos] = useState<Aviso[] | null>(null)
  const [compondo, setCompondo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [tipo, setTipo] = useState<TipoDeAviso>('info')
  const [fixado, setFixado] = useState(false)

  const carregar = useCallback(async () => {
    const res = await fetch(`/api/aulas/avisos?curso=${encodeURIComponent(cursoId)}`, {
      cache: 'no-store',
    })
    if (!res.ok) return setAvisos([])
    const d = await res.json()
    setAvisos(ordenarAvisos(d.avisos || []))
  }, [cursoId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function publicar() {
    if (!titulo.trim() || !mensagem.trim()) return
    setSalvando(true)
    setErro('')
    try {
      const res = await fetch('/api/aulas/avisos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setorId: cursoId, titulo, mensagem, tipo, fixado }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Não foi possível publicar')
      setTitulo('')
      setMensagem('')
      setTipo('info')
      setFixado(false)
      setCompondo(false)
      await carregar()
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível publicar')
    } finally {
      setSalvando(false)
    }
  }

  async function remover(id: string) {
    // Otimista: o mural responde na hora. O servidor apenas desativa, então
    // nada é perdido se a chamada falhar.
    const antes = avisos
    setAvisos((atual) => (atual || []).filter((a) => a._id !== id))
    const res = await fetch(`/api/aulas/avisos?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!res.ok) setAvisos(antes)
  }

  // Enquanto carrega, nada: um esqueleto no topo da página empurraria o curso
  // para baixo a cada abertura, por uma seção que quase sempre está vazia.
  if (avisos === null) return null
  if (avisos.length === 0 && !podeGerenciar) return null

  return (
    <section className="mb-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Megaphone className="h-4 w-4 text-primary" />
          Avisos do curso
        </h2>
        {podeGerenciar && !compondo ? (
          <button
            type="button"
            onClick={() => setCompondo(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold transition hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo aviso
          </button>
        ) : null}
      </div>

      {/* ── Editor ────────────────────────────────────────────────────── */}
      {compondo ? (
        <div className="mb-3 rounded-xl border border-border bg-card p-3.5">
          <input
            autoFocus
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título do aviso"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary/50"
          />
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={3}
            placeholder="O que os alunos precisam saber?"
            className="mt-2 w-full resize-none rounded-lg border border-border bg-background p-2.5 text-sm outline-none focus:border-primary/50"
          />

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {TIPOS_DE_AVISO.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                aria-pressed={tipo === t}
                className={cn(
                  'inline-flex h-8 items-center rounded-lg border px-2.5 text-[11.5px] font-semibold transition',
                  tipo === t ? TOM[t] : 'border-border bg-card text-muted-foreground hover:bg-muted',
                )}
              >
                {ROTULO_DO_TIPO[t]}
              </button>
            ))}

            <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
              <input type="checkbox" checked={fixado} onChange={(e) => setFixado(e.target.checked)} />
              <Pin className="h-3.5 w-3.5" />
              Fixar no topo
            </label>
          </div>

          {erro ? <p className="mt-2 text-xs text-destructive">{erro}</p> : null}

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCompondo(false)
                setErro('')
              }}
              className="h-9 rounded-lg border border-border px-3 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={publicar}
              disabled={salvando || !titulo.trim() || !mensagem.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Publicar
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Lista ─────────────────────────────────────────────────────── */}
      {avisos.length === 0 ? (
        podeGerenciar && !compondo ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-xs text-muted-foreground">
            Nenhum aviso publicado. Use este espaço para mudanças de horário, regravações e recados
            que hoje se perdem no WhatsApp.
          </p>
        ) : null
      ) : (
        <div className="space-y-2">
          {avisos.map((aviso) => {
            const Icone = ICONE[aviso.tipo] || Info
            return (
              <article
                key={aviso._id}
                className={cn('relative rounded-xl border p-3.5', TOM[aviso.tipo] || TOM.info)}
              >
                <div className="flex items-start gap-2.5">
                  <Icone className="mt-0.5 h-4 w-4 flex-none" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-[13.5px] font-bold leading-snug">{aviso.titulo}</h3>
                      {aviso.fixado ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-current/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                          <Pin className="h-2.5 w-2.5" /> Fixado
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed opacity-90">
                      {aviso.mensagem}
                    </p>
                    <p className="mt-1.5 text-[11px] opacity-70">
                      {new Date(aviso.criadoEm).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                      })}
                      {aviso.criadoPorNome ? ` · ${aviso.criadoPorNome}` : ''}
                    </p>
                  </div>

                  {podeGerenciar ? (
                    <button
                      type="button"
                      onClick={() => remover(aviso._id)}
                      aria-label={`Remover aviso ${aviso.titulo}`}
                      className="flex h-7 w-7 flex-none items-center justify-center rounded-md opacity-60 transition hover:bg-current/10 hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
