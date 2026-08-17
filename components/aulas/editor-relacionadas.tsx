'use client'

import { useEffect, useMemo, useState } from 'react'
import { GripVertical, Link2, Loader2, Search, X } from 'lucide-react'

/**
 * Conteúdo relacionado (§31).
 *
 * Escolhido à mão, e não deduzido. Automático por "mesmo módulo" seria
 * redundante: o índice do curso, a lateral e a próxima aula já cobrem a
 * vizinhança imediata. O que só a curadoria resolve é o **salto** — "antes
 * desta, veja gasometria básica", que atravessa módulo e curso e é justamente o
 * que o aluno não descobre sozinho.
 *
 * A ordem importa e é a que o admin arrasta: "veja também" é uma recomendação
 * com prioridade, não um conjunto. Por isso a lista tem setas em vez de só
 * marcar e desmarcar numa grade.
 */

interface AulaResumida {
  _id: string
  titulo: string
  setorId?: string
}

export function EditorDeRelacionadas({
  aulaAtualId,
  valor,
  onChange,
  escuro = false,
}: {
  aulaAtualId: string
  valor: string[]
  onChange: (ids: string[]) => void
  escuro?: boolean
}) {
  const [todas, setTodas] = useState<AulaResumida[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    let vivo = true
    fetch('/api/aulas', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { aulas: [] }))
      .then((d) => {
        if (!vivo) return
        setTodas(
          (d.aulas || []).map((a: any) => ({
            _id: String(a._id),
            titulo: a.titulo,
            setorId: a.setorId ? String(a.setorId) : undefined,
          })),
        )
      })
      .catch(() => {})
      .finally(() => vivo && setCarregando(false))
    return () => {
      vivo = false
    }
  }, [])

  const porId = useMemo(() => new Map(todas.map((a) => [a._id, a])), [todas])

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (termo.length < 2) return []
    return todas
      .filter(
        (a) =>
          // A própria aula fora da busca: um cartão que leva para onde já se
          // está é ruído, e é o erro mais fácil de cometer aqui.
          a._id !== aulaAtualId &&
          !valor.includes(a._id) &&
          a.titulo.toLowerCase().includes(termo),
      )
      .slice(0, 8)
  }, [busca, todas, valor, aulaAtualId])

  const c = cores(escuro)

  function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao
    if (destino < 0 || destino >= valor.length) return
    const lista = [...valor]
    ;[lista[indice], lista[destino]] = [lista[destino], lista[indice]]
    onChange(lista)
  }

  return (
    <div className={`rounded-xl border p-4 ${c.caixa}`}>
      <div className="mb-1 flex items-center gap-2">
        <Link2 className={`h-4 w-4 ${c.destaque}`} />
        <p className={`text-sm font-bold ${c.titulo}`}>Veja também</p>
      </div>
      <p className={`mb-3 text-xs leading-relaxed ${c.apagado}`}>
        Aulas sugeridas ao final desta. Use para o salto que o índice do curso não faz — um
        pré-requisito de outro curso, um aprofundamento de outro módulo.
      </p>

      {/* ── Escolhidas ────────────────────────────────────────────────── */}
      {valor.length > 0 ? (
        <ul className="mb-3 space-y-1.5">
          {valor.map((id, i) => {
            const aula = porId.get(id)
            return (
              <li key={id} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${c.item}`}>
                <GripVertical className={`h-3.5 w-3.5 flex-none ${c.apagado}`} aria-hidden />
                <span className={`min-w-0 flex-1 truncate text-[13px] ${c.titulo}`}>
                  {/* Aula apagada continua na lista, identificada: some daqui
                      seria esconder um vínculo quebrado que o admin precisa ver. */}
                  {aula?.titulo || <span className={c.aviso}>Aula removida ({id.slice(-6)})</span>}
                </span>
                <div className="flex flex-none items-center">
                  <button
                    type="button"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    aria-label="Subir"
                    className={`flex h-6 w-6 items-center justify-center rounded text-xs disabled:opacity-25 ${c.botao}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={i === valor.length - 1}
                    aria-label="Descer"
                    className={`flex h-6 w-6 items-center justify-center rounded text-xs disabled:opacity-25 ${c.botao}`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(valor.filter((v) => v !== id))}
                    aria-label="Remover"
                    className={`ml-0.5 flex h-6 w-6 items-center justify-center rounded ${c.botao}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}

      {/* ── Busca ─────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className={`pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${c.apagado}`} />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar aula para relacionar..."
          className={`h-9 w-full rounded-lg pl-9 pr-3 text-[12.5px] outline-none ${c.campo}`}
        />
        {carregando ? (
          <Loader2 className={`absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin ${c.apagado}`} />
        ) : null}
      </div>

      {resultados.length > 0 ? (
        <div className="mt-1.5 space-y-1">
          {resultados.map((a) => (
            <button
              key={a._id}
              type="button"
              onClick={() => {
                onChange([...valor, a._id])
                setBusca('')
              }}
              className={`block w-full truncate rounded-md px-2.5 py-2 text-left text-[12.5px] ${c.opcao}`}
            >
              {a.titulo}
            </button>
          ))}
        </div>
      ) : busca.trim().length >= 2 && !carregando ? (
        <p className={`mt-1.5 text-[11.5px] ${c.apagado}`}>Nenhuma aula com esse termo.</p>
      ) : null}
    </div>
  )
}

function cores(escuro: boolean) {
  return escuro
    ? {
        caixa: 'border-white/10 bg-white/[0.03]',
        item: 'border border-white/10 bg-white/[0.04]',
        titulo: 'text-white',
        apagado: 'text-white/55',
        destaque: 'text-emerald-400',
        aviso: 'text-amber-300',
        botao: 'text-white/50 hover:bg-white/10 hover:text-white',
        campo:
          'border border-white/15 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-400/50',
        opcao: 'text-white/80 hover:bg-white/10',
      }
    : {
        caixa: 'border-border bg-card',
        item: 'border border-border bg-background',
        titulo: 'text-foreground',
        apagado: 'text-muted-foreground',
        destaque: 'text-primary',
        aviso: 'text-amber-600 dark:text-amber-400',
        botao: 'text-muted-foreground hover:bg-muted hover:text-foreground',
        campo: 'border border-border bg-background text-foreground focus:border-primary/50',
        opcao: 'text-foreground hover:bg-muted',
      }
}
