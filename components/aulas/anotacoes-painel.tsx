'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, StickyNote, Search, Star, Trash2 } from 'lucide-react'
import { formatarTempo } from '@/lib/aulas/progresso'
import { filtrarAnotacoes, ordenarAnotacoes } from '@/lib/aulas/anotacoes'
import type { ControleDoPlayer } from '@/components/aulas/player'
import { cn } from '@/lib/utils'

/**
 * Caderno da aula (§9).
 *
 * O que faz esta funcionalidade valer a pena não é guardar texto — é o
 * timestamp. Uma anotação carimbada em 12:48 vira um índice clicável da própria
 * aula: em vez de reassistir 40 minutos procurando "onde ele falou dos
 * critérios", o aluno clica na própria anotação e cai no ponto exato.
 *
 * Por isso o carimbo é o padrão quando o player permite (vídeo nativo), e a
 * anotação livre é a exceção consciente. Com iframe não há tempo para carimbar,
 * e o painel diz isso em vez de gravar 0:00 em tudo — timestamp errado é pior
 * que timestamp nenhum, porque manda o aluno para o lugar errado.
 */

interface Anotacao {
  _id: string
  conteudo: string
  segundo: number | null
  destacada?: boolean
  criadoEm: string
}

export function PainelDeAnotacoes({
  aulaId,
  controle,
  className,
}: {
  aulaId: string
  controle: ControleDoPlayer | null
  className?: string
}) {
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [texto, setTexto] = useState('')
  const [carimbar, setCarimbar] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  const podeCarimbar = controle?.navegavel === true

  useEffect(() => {
    let cancelado = false
    fetch(`/api/aulas/${aulaId}/anotacoes`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { anotacoes: [] }))
      .then((d) => {
        if (!cancelado) setAnotacoes(d.anotacoes || [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [aulaId])

  const visiveis = useMemo(
    () => ordenarAnotacoes(filtrarAnotacoes(anotacoes, busca)),
    [anotacoes, busca],
  )

  async function criar() {
    const conteudo = texto.trim()
    if (!conteudo) return
    setSalvando(true)
    setErro('')
    try {
      const segundo = podeCarimbar && carimbar ? Math.floor(controle?.tempoAtual() || 0) : null
      const res = await fetch(`/api/aulas/${aulaId}/anotacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo, segundo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Não foi possível salvar')
      setAnotacoes((atual) => [...atual, data.anotacao])
      setTexto('')
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    // Otimista: o caderno responde na hora. Se o servidor recusar, a anotação
    // volta — esperar a rede para apagar uma linha é atrito à toa.
    const antes = anotacoes
    setAnotacoes((atual) => atual.filter((a) => a._id !== id))
    const res = await fetch(`/api/aulas/${aulaId}/anotacoes/${id}`, { method: 'DELETE' })
    if (!res.ok) setAnotacoes(antes)
  }

  async function alternarDestaque(anotacao: Anotacao) {
    const nova = { ...anotacao, destacada: !anotacao.destacada }
    setAnotacoes((atual) => atual.map((a) => (a._id === anotacao._id ? nova : a)))
    await fetch(`/api/aulas/${aulaId}/anotacoes/${anotacao._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conteudo: anotacao.conteudo,
        segundo: anotacao.segundo,
        destacada: nova.destacada,
      }),
    }).catch(() => {})
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-2 text-sm font-bold">
        <StickyNote className="h-4 w-4 text-primary" />
        Minhas anotações
        {anotacoes.length > 0 ? (
          <span className="text-xs font-normal text-muted-foreground">({anotacoes.length})</span>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            // Ctrl/Cmd+Enter salva sem tirar a mão do teclado — quem anota
            // durante a aula está com o vídeo rodando.
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') criar()
          }}
          rows={3}
          placeholder={
            podeCarimbar
              ? 'Escreva sua anotação. Ela guarda o momento do vídeo.'
              : 'Escreva sua anotação.'
          }
          className="w-full resize-none rounded-lg border border-border bg-background p-2.5 text-sm outline-none transition focus:border-primary/50"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          {podeCarimbar ? (
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={carimbar}
                onChange={(e) => setCarimbar(e.target.checked)}
              />
              Marcar o momento do vídeo
            </label>
          ) : (
            <span className="text-xs text-muted-foreground">
              Vídeo incorporado: não dá para marcar o momento.
            </span>
          )}

          <button
            type="button"
            onClick={criar}
            disabled={salvando || !texto.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground transition disabled:opacity-50"
          >
            {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Salvar
          </button>
        </div>

        {erro ? <p className="mt-2 text-xs text-destructive">{erro}</p> : null}
      </div>

      {anotacoes.length > 3 ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nas anotações..."
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-xs outline-none focus:border-primary/50"
          />
        </div>
      ) : null}

      {carregando ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : visiveis.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
          {busca
            ? 'Nenhuma anotação com esse termo.'
            : 'Suas anotações desta aula aparecem aqui. Marque o momento e volte a ele com um clique.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {visiveis.map((anotacao) => (
            <li
              key={anotacao._id}
              className={cn(
                'group rounded-lg border p-2.5 transition',
                anotacao.destacada
                  ? 'border-amber-500/40 bg-amber-500/10'
                  : 'border-border bg-card',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {anotacao.segundo !== null ? (
                    <button
                      type="button"
                      onClick={() => controle?.irPara(anotacao.segundo as number)}
                      disabled={!controle?.navegavel}
                      className="mb-1 inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary transition hover:bg-primary/20 disabled:opacity-60"
                    >
                      {formatarTempo(anotacao.segundo)}
                    </button>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                    {anotacao.conteudo}
                  </p>
                </div>

                <div className="flex flex-none items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => alternarDestaque(anotacao)}
                    aria-label={anotacao.destacada ? 'Remover destaque' : 'Destacar'}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted"
                  >
                    <Star className={cn('h-3.5 w-3.5', anotacao.destacada && 'fill-amber-500 text-amber-500')} />
                  </button>
                  <button
                    type="button"
                    onClick={() => excluir(anotacao._id)}
                    aria-label="Excluir anotação"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
