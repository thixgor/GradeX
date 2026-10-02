'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  Loader2,
  StickyNote,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { BackLink, PageScaffold } from '@/components/page-scaffold'
import { ProgressRing } from '@/components/progress-ring'
import {
  ROTA_ESTUDO_INTEGRADO,
  alterarEstudo,
  buscarConexoes,
  excluirEstudo,
  lerEstudo,
} from '@/components/manual-clinico/integracao/api'
import { SeloDoModulo } from '@/components/manual-clinico/integracao/trilha'
import { ETAPAS, ORDEM_DAS_ETAPAS } from '@/lib/manual-clinico/integracao/modulos'
import type { Conexao, EstudoCompleto, EtapaDoEstudo, ItemDoEstudo } from '@/lib/manual-clinico/integracao/tipos'
import { cn } from '@/lib/utils'

/**
 * Um Estudo Integrado do aluno: os itens que ele juntou de vários manuais,
 * arrumados na ordem do estudo, com o que já foi visto marcado, uma nota por
 * item e — o que faz o estudo crescer sozinho — o que os manuais ainda têm
 * perto do que já está nele.
 */

type Alteracao = Record<string, unknown>

function Estudo({ id }: { id: string }) {
  const router = useRouter()
  const [estudo, setEstudo] = useState<EstudoCompleto | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [editandoTitulo, setEditandoTitulo] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [notaAberta, setNotaAberta] = useState<string | null>(null)
  const [sugestoes, setSugestoes] = useState<Conexao[] | null>(null)

  const carregar = useCallback(() => {
    lerEstudo(id)
      .then((e) => {
        setEstudo(e)
        setTitulo(e.titulo)
      })
      .catch((e) => setErro(e.status === 404 ? 'Estudo não encontrado.' : e.message))
  }, [id])

  useEffect(carregar, [carregar])

  // As sugestões dependem só do conjunto de refs: pedidas de novo quando um
  // item entra ou sai, não quando se marca "estudado" ou se escreve uma nota.
  const chaveDasRefs = estudo ? estudo.itens.map((i) => i.ref).sort().join(',') : ''
  useEffect(() => {
    if (!chaveDasRefs) {
      setSugestoes(estudo ? [] : null)
      return
    }
    let cancelado = false
    buscarConexoes({ refs: chaveDasRefs.split(',') })
      .then((r) => !cancelado && setSugestoes(r.grupos.flatMap((g) => g.itens).slice(0, 12)))
      .catch(() => !cancelado && setSugestoes([]))
    return () => {
      cancelado = true
    }
    // `estudo` entra só pela chave das refs, de propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveDasRefs])

  const alterar = async (alteracao: Alteracao) => {
    setOcupado(true)
    setErro(null)
    try {
      const r = await alterarEstudo(id, alteracao)
      setEstudo(r.estudo)
      setTitulo(r.estudo.titulo)
      if (r.recusados) setErro(`${r.recusados} item(ns) ficaram de fora: o estudo chegou ao limite.`)
    } catch (e) {
      const err = e as Error & { status?: number }
      setErro(err.message)
      if (err.status === 409) carregar()
    } finally {
      setOcupado(false)
    }
  }

  const excluir = async () => {
    if (!estudo || !window.confirm(`Excluir o estudo “${estudo.titulo}”? Isso não apaga nada dos manuais.`)) return
    setOcupado(true)
    try {
      await excluirEstudo(id)
      router.push(ROTA_ESTUDO_INTEGRADO)
    } catch (e) {
      setErro((e as Error).message)
      setOcupado(false)
    }
  }

  if (erro && !estudo) {
    return (
      <PageScaffold>
        <BackLink href={ROTA_ESTUDO_INTEGRADO} className="mb-4">Estudo Integrado</BackLink>
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{erro}</p>
      </PageScaffold>
    )
  }
  if (!estudo) {
    return (
      <PageScaffold>
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Carregando o estudo…
        </p>
      </PageScaffold>
    )
  }

  const pct = estudo.total ? Math.round((estudo.feitos / estudo.total) * 100) : 0
  const porEtapa = new Map<EtapaDoEstudo | 'fora', ItemDoEstudo[]>()
  for (const item of estudo.itens) {
    const chave = item.etapa ?? 'fora'
    porEtapa.set(chave, [...(porEtapa.get(chave) ?? []), item])
  }
  const etapas: Array<EtapaDoEstudo | 'fora'> = [...ORDEM_DAS_ETAPAS.filter((e) => porEtapa.has(e)), ...(porEtapa.has('fora') ? ['fora' as const] : [])]

  return (
    <PageScaffold>
      <BackLink href={ROTA_ESTUDO_INTEGRADO} className="mb-4">Estudo Integrado</BackLink>

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="editorial-mark mb-1">Meu estudo</p>
          {editandoTitulo ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                setEditandoTitulo(false)
                if (titulo.trim() && titulo.trim() !== estudo.titulo) alterar({ acao: 'renomear', titulo })
              }}
            >
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={120}
                autoFocus
                aria-label="Nome do estudo"
                className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-border bg-background px-3 font-heading text-xl font-semibold"
              />
              <button type="submit" className="min-h-[44px] rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground">Salvar</button>
            </form>
          ) : (
            <h1 className="flex items-start gap-2 font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              <span className="min-w-0 break-words">{estudo.titulo}</span>
              <button
                type="button"
                onClick={() => setEditandoTitulo(true)}
                className="mt-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Renomear estudo"
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </button>
            </h1>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {estudo.feitos} de {estudo.total} itens estudados, de {new Set(estudo.itens.map((i) => i.modulo).filter(Boolean)).size} manuais.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ProgressRing percentage={pct} size={72} label={`${pct}%`} />
          <button
            type="button"
            onClick={excluir}
            disabled={ocupado}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-semibold text-muted-foreground hover:border-destructive/40 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden /> Excluir
          </button>
        </div>
      </header>

      {erro ? <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{erro}</p> : null}

      {estudo.itens.length === 0 ? (
        <p className="mb-8 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Este estudo está vazio. Acrescente itens pelas sugestões abaixo ou pelo painel “Estude este tema em todos os manuais” de qualquer ficha.
        </p>
      ) : (
        <ol className="mb-10 space-y-6">
          {etapas.map((etapa) => {
            const itens = porEtapa.get(etapa) ?? []
            const info = etapa === 'fora' ? null : ETAPAS[etapa]
            return (
              <li key={etapa}>
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {info ? info.numero : '–'}
                  </span>
                  <div>
                    <h2 className="font-heading text-base font-semibold tracking-tight">{info ? info.titulo : 'Fora do acervo'}</h2>
                    <p className="text-xs text-muted-foreground">{info ? info.pergunta : 'Itens que saíram dos manuais desde que foram guardados.'}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {itens.map((item, i) => (
                    <li
                      key={item.ref}
                      className={cn('rounded-lg border bg-card p-3', item.feito ? 'border-emerald-500/30' : 'border-border')}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => alterar({ acao: 'marcar', ref: item.ref, feito: !item.feito })}
                          aria-pressed={item.feito}
                          aria-label={item.feito ? 'Marcar como não estudado' : 'Marcar como estudado'}
                          className={cn(
                            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors',
                            item.feito ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-border hover:border-primary',
                          )}
                        >
                          {item.feito ? <Check className="h-4 w-4" aria-hidden /> : null}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            {item.modulo ? <SeloDoModulo modulo={item.modulo} /> : null}
                            {item.tipo ? <span className="text-[11px] text-muted-foreground">{item.tipo}</span> : null}
                          </div>
                          {item.href ? (
                            <Link href={item.href} className={cn('group inline-flex items-start gap-1 text-sm font-semibold hover:text-primary', item.feito && 'text-muted-foreground line-through decoration-1')}>
                              {item.titulo}
                              <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100" aria-hidden />
                            </Link>
                          ) : (
                            <p className="text-sm text-muted-foreground">Este item não está mais no acervo ({item.ref}).</p>
                          )}
                          {item.nota && notaAberta !== item.ref ? (
                            <p className="mt-1.5 whitespace-pre-wrap rounded-md bg-muted/50 p-2 text-xs leading-relaxed">{item.nota}</p>
                          ) : null}
                          {notaAberta === item.ref ? (
                            <NotaDoItem
                              inicial={item.nota ?? ''}
                              onCancelar={() => setNotaAberta(null)}
                              onSalvar={(nota) => {
                                setNotaAberta(null)
                                alterar({ acao: 'anotar', ref: item.ref, nota })
                              }}
                            />
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                          <BotaoIcone rotulo="Anotar" onClick={() => setNotaAberta(notaAberta === item.ref ? null : item.ref)} disabled={ocupado}>
                            <StickyNote className="h-4 w-4" aria-hidden />
                          </BotaoIcone>
                          <BotaoIcone rotulo="Subir" disabled={ocupado || i === 0} onClick={() => alterar({ acao: 'trocar', ref: item.ref, com: itens[i - 1]?.ref })}>
                            <ArrowUp className="h-4 w-4" aria-hidden />
                          </BotaoIcone>
                          <BotaoIcone rotulo="Descer" disabled={ocupado || i === itens.length - 1} onClick={() => alterar({ acao: 'trocar', ref: item.ref, com: itens[i + 1]?.ref })}>
                            <ArrowDown className="h-4 w-4" aria-hidden />
                          </BotaoIcone>
                          <BotaoIcone rotulo="Remover do estudo" disabled={ocupado} onClick={() => alterar({ acao: 'remover', ref: item.ref })}>
                            <X className="h-4 w-4" aria-hidden />
                          </BotaoIcone>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ol>
      )}

      <section aria-labelledby="completar" className="rounded-xl border border-primary/20 bg-card p-4 sm:p-5">
        <h2 id="completar" className="mb-1 inline-flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden /> Para completar seu estudo
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">O que os manuais ainda têm perto do que você já juntou.</p>
        {sugestoes === null ? (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Procurando…
          </p>
        ) : sugestoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada novo por perto — seu estudo já cobre o que os manuais têm sobre o tema.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {sugestoes.map((s) => (
              <li key={s.ref} className="flex items-start gap-2 rounded-lg border border-border bg-background p-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <SeloDoModulo modulo={s.modulo} />
                    <span className="text-[11px] text-muted-foreground">{ETAPAS[s.etapa].titulo}</span>
                  </div>
                  <Link href={s.href} className="text-sm font-semibold hover:text-primary">{s.titulo}</Link>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{s.rotuloDoMotivo}</p>
                </div>
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => alterar({ acao: 'acrescentar', refs: [s.ref] })}
                  className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden /> Acrescentar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageScaffold>
  )
}

function BotaoIcone({
  rotulo,
  onClick,
  disabled,
  children,
}: {
  rotulo: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={rotulo}
      title={rotulo}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function NotaDoItem({
  inicial,
  onSalvar,
  onCancelar,
}: {
  inicial: string
  onSalvar: (nota: string) => void
  onCancelar: () => void
}) {
  const [texto, setTexto] = useState(inicial)
  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={2000}
        rows={3}
        autoFocus
        aria-label="Nota do item"
        placeholder="O que você quer lembrar deste item?"
        className="w-full rounded-md border border-border bg-background p-2 text-sm"
      />
      <div className="flex gap-2">
        <button type="button" onClick={() => onSalvar(texto)} className="min-h-[36px] rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">
          Salvar nota
        </button>
        <button type="button" onClick={onCancelar} className="min-h-[36px] rounded-md border border-border px-3 text-xs font-semibold">
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default function MeuEstudoPage() {
  const params = useParams<{ id: string }>()
  return (
    <AppShell>
      <Estudo id={params.id} />
    </AppShell>
  )
}
