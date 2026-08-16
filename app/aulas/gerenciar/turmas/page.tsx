'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import { LogoLoading } from '@/components/logo-loading'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { separarEmails } from '@/lib/aulas/grupos'
import { cn } from '@/lib/utils'

/**
 * Turmas (§16).
 *
 * A coleção `aulas_grupos` era consultada em toda abertura de aula e nunca
 * escrita por ninguém — não havia rota nem tela. Na prática, a condição de
 * acesso "esta aula é da Turma A" existia no motor e era impossível de usar.
 *
 * A tela é organizada em torno de como a turma nasce no mundo real: alguém tem
 * uma lista de e-mails numa planilha e quer colar tudo de uma vez. Por isso o
 * campo de inclusão é um textarea que aceita qualquer separador, e por isso a
 * resposta destaca **quem ficou de fora** — numa lista de duzentos sempre há
 * erro de digitação e gente sem conta, e uma turma que engole isso em silêncio
 * deixa alunos sem acesso até a aula abrir.
 */

interface TurmaResumo {
  _id: string
  nome: string
  descricao: string
  totalMembros: number
}

interface Membro {
  id: string
  nome: string
  email: string
  existe: boolean
}

export default function TurmasPage() {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [turmas, setTurmas] = useState<TurmaResumo[]>([])
  const [aberta, setAberta] = useState<string | null>(null)

  const [dialogo, setDialogo] = useState<'criar' | { excluir: TurmaResumo } | null>(null)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')

  const [toast, setToast] = useState<{ aberto: boolean; texto: string; tipo: 'success' | 'error' | 'info' }>({
    aberto: false,
    texto: '',
    tipo: 'success',
  })
  const avisar = useCallback((texto: string, tipo: 'success' | 'error' | 'info' = 'success') => {
    setToast({ aberto: true, texto, tipo })
  }, [])

  const carregar = useCallback(async () => {
    const res = await fetch('/api/aulas/grupos', { cache: 'no-store' })
    if (!res.ok) return
    const d = await res.json()
    setTurmas(d.grupos || [])
  }, [])

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return router.push('/auth/login')
        const { user } = await res.json()
        if (user?.role !== 'admin' && user?.secondaryRole !== 'monitor') return router.push('/aulas')
        if (cancelado) return
        setAutorizado(true)
        await carregar()
      } catch {
        router.push('/auth/login')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [router, carregar])

  async function criar() {
    const limpo = nome.trim()
    if (!limpo) return
    setSalvando(true)
    try {
      const res = await fetch('/api/aulas/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: limpo, descricao: descricao.trim() }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Não foi possível criar')
      setNome('')
      setDescricao('')
      setDialogo(null)
      await carregar()
      // Abre a turma recém-criada: quem acabou de criar quer pôr gente dentro.
      if (d.grupo?._id) setAberta(String(d.grupo._id))
      avisar('Turma criada.')
    } catch (e: any) {
      avisar(e?.message || 'Não foi possível criar', 'error')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(turma: TurmaResumo) {
    setSalvando(true)
    try {
      const res = await fetch(`/api/aulas/grupos/${turma._id}`, { method: 'DELETE' })
      const d = await res.json().catch(() => ({}))
      // 409 = ainda há aula usando a turma. A mensagem do servidor já explica.
      if (!res.ok) throw new Error(d.error || 'Não foi possível excluir')
      setDialogo(null)
      if (aberta === turma._id) setAberta(null)
      await carregar()
      avisar('Turma excluída.')
    } catch (e: any) {
      avisar(e?.message || 'Não foi possível excluir', 'error')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <LogoLoading message="Carregando turmas..." size="lg" fullscreen />
  if (!autorizado) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-40 border-b">
        <div className="container mx-auto max-w-4xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/aulas/gerenciar"
                aria-label="Voltar"
                className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">Turmas</h1>
                <p className="truncate text-xs text-muted-foreground">
                  {turmas.length} turma(s){salvando ? ' · salvando…' : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-none items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setNome('')
                  setDescricao('')
                  setDialogo('criar')
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground transition hover:brightness-110"
              >
                <Plus className="h-3.5 w-3.5" />
                Nova turma
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-5">
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Uma turma é uma lista de alunos que pode destravar aulas. Depois de criar, escolha
          &ldquo;Quem está numa turma&rdquo; na permissão da aula — ou use a turma para{' '}
          <strong>restringir</strong> uma aula que já é do Plus+.
        </p>

        {turmas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
              <Users className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-semibold">Nenhuma turma ainda</p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Crie uma turma para liberar aulas a um grupo específico — uma turma de cursinho, os
              alunos de uma instituição, um piloto fechado.
            </p>
            <button
              type="button"
              onClick={() => {
                setNome('')
                setDescricao('')
                setDialogo('criar')
              }}
              className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Criar primeira turma
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {turmas.map((turma) => (
              <CartaoDeTurma
                key={turma._id}
                turma={turma}
                aberta={aberta === turma._id}
                onAlternar={() => setAberta(aberta === turma._id ? null : turma._id)}
                onExcluir={() => setDialogo({ excluir: turma })}
                onMudou={carregar}
                avisar={avisar}
              />
            ))}
          </div>
        )}
      </main>

      <Dialog open={dialogo === 'criar'} onOpenChange={(a) => !a && setDialogo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova turma</DialogTitle>
            <DialogDescription>
              Você adiciona os alunos depois de criar, colando a lista de e-mails.
            </DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && criar()}
            placeholder="Nome da turma"
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
          />
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogo(null)}
              className="h-9 rounded-lg border border-border px-4 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={criar}
              disabled={salvando || !nome.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Criar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={typeof dialogo === 'object' && dialogo !== null}
        onOpenChange={(a) => !a && setDialogo(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir turma</DialogTitle>
            <DialogDescription>
              {typeof dialogo === 'object' && dialogo
                ? `“${dialogo.excluir.nome}” será apagada com seus ${dialogo.excluir.totalMembros} membro(s). Se alguma aula ainda usar esta turma na regra de acesso, a exclusão é recusada — senão a aula ficaria trancada para todo mundo.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogo(null)}
              className="h-9 rounded-lg border border-border px-4 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => typeof dialogo === 'object' && dialogo && excluir(dialogo.excluir)}
              disabled={salvando}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive px-4 text-sm font-bold text-destructive-foreground disabled:opacity-50"
            >
              {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Excluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastAlert
        open={toast.aberto}
        onOpenChange={(a) => setToast((t) => ({ ...t, aberto: a }))}
        message={toast.texto}
        type={toast.tipo}
      />
    </div>
  )
}

/* ─────────────────────────── Cartão de turma ─────────────────────────── */

function CartaoDeTurma({
  turma,
  aberta,
  onAlternar,
  onExcluir,
  onMudou,
  avisar,
}: {
  turma: TurmaResumo
  aberta: boolean
  onAlternar: () => void
  onExcluir: () => void
  onMudou: () => Promise<void>
  avisar: (texto: string, tipo?: 'success' | 'error' | 'info') => void
}) {
  const [membros, setMembros] = useState<Membro[] | null>(null)
  const [truncado, setTruncado] = useState(false)
  const [colagem, setColagem] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [semConta, setSemConta] = useState<string[]>([])

  const carregarMembros = useCallback(async () => {
    const res = await fetch(`/api/aulas/grupos/${turma._id}`, { cache: 'no-store' })
    if (!res.ok) return
    const d = await res.json()
    setMembros(d.grupo?.membros || [])
    setTruncado(d.grupo?.truncado === true)
  }, [turma._id])

  useEffect(() => {
    if (aberta && membros === null) void carregarMembros()
  }, [aberta, membros, carregarMembros])

  const quantosNaColagem = separarEmails(colagem).length

  async function adicionar() {
    if (quantosNaColagem === 0) return
    setOcupado(true)
    setSemConta([])
    try {
      const res = await fetch(`/api/aulas/grupos/${turma._id}/membros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: colagem }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Não foi possível adicionar')

      setColagem('')
      setSemConta(d.semConta || [])
      await carregarMembros()
      await onMudou()

      const partes = [`${d.adicionados} adicionado(s)`]
      if (d.jaEstavam) partes.push(`${d.jaEstavam} já estava(m)`)
      if (d.semConta?.length) partes.push(`${d.semConta.length} sem conta`)
      if (d.excedentes) partes.push(`${d.excedentes} não coube(ram)`)
      avisar(partes.join(' · '), d.semConta?.length ? 'info' : 'success')
    } catch (e: any) {
      avisar(e?.message || 'Não foi possível adicionar', 'error')
    } finally {
      setOcupado(false)
    }
  }

  async function remover(id: string) {
    setOcupado(true)
    try {
      const res = await fetch(`/api/aulas/grupos/${turma._id}/membros`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
      if (!res.ok) throw new Error()
      setMembros((atual) => (atual || []).filter((m) => m.id !== id))
      await onMudou()
    } catch {
      avisar('Não foi possível remover', 'error')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <section className={cn('rounded-xl border bg-card transition', aberta ? 'border-primary/40' : 'border-border')}>
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onAlternar}
          aria-expanded={aberta}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left transition hover:bg-muted/40"
        >
          <Users className="h-4 w-4 flex-none text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{turma.nome}</p>
            <p className="truncate text-xs text-muted-foreground">
              {turma.totalMembros} membro{turma.totalMembros !== 1 ? 's' : ''}
              {turma.descricao ? ` · ${turma.descricao}` : ''}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={onExcluir}
          aria-label={`Excluir ${turma.nome}`}
          className="flex flex-none items-center px-3.5 text-muted-foreground/40 transition hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {aberta && (
        <div className="border-t border-border p-4">
          {/* ── Colar lista ───────────────────────────────────────────── */}
          <label className="mb-1.5 block text-xs font-bold">Adicionar alunos</label>
          <p className="mb-2 text-[11.5px] leading-relaxed text-muted-foreground">
            Cole os e-mails separados por vírgula, ponto e vírgula, espaço ou quebra de linha — do
            jeito que estiverem na sua planilha.
          </p>
          <textarea
            value={colagem}
            onChange={(e) => setColagem(e.target.value)}
            rows={3}
            placeholder="fulano@email.com, ciclano@email.com"
            className="w-full resize-none rounded-lg border border-border bg-background p-2.5 text-sm outline-none transition focus:border-primary/50"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11.5px] text-muted-foreground">
              {quantosNaColagem > 0 ? `${quantosNaColagem} e-mail(s) reconhecido(s)` : ' '}
            </span>
            <button
              type="button"
              onClick={adicionar}
              disabled={ocupado || quantosNaColagem === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground transition disabled:opacity-50"
            >
              {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              Adicionar
            </button>
          </div>

          {/* Quem ficou de fora é a informação mais importante da operação. */}
          {semConta.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                {semConta.length} e-mail(s) sem conta na plataforma
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                Eles não entraram na turma. Peça para criarem conta com este mesmo e-mail e cole a
                lista de novo.
              </p>
              <p className="mt-1.5 break-words font-mono text-[11px] text-muted-foreground/80">
                {semConta.join(', ')}
              </p>
            </div>
          )}

          {/* ── Lista de membros ──────────────────────────────────────── */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold">Na turma</p>
            {membros === null ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : membros.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">
                Ninguém ainda. A turma só destrava aulas depois que tiver alunos.
              </p>
            ) : (
              <>
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {membros.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate text-[13px] font-medium', !m.existe && 'text-muted-foreground')}>
                          {m.nome}
                        </p>
                        {m.email && <p className="truncate text-[11px] text-muted-foreground">{m.email}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => remover(m.id)}
                        aria-label={`Remover ${m.nome}`}
                        className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-muted-foreground/50 transition hover:bg-destructive/10 hover:text-destructive"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
                {truncado && (
                  <p className="mt-2 text-[11.5px] text-muted-foreground">
                    Mostrando os primeiros {membros.length} de {turma.totalMembros}.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
