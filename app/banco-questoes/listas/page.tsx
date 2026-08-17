'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Database,
  ListPlus,
  Loader2,
  Lock,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { CriadorDeLista } from '@/components/banco/criador-de-lista'
import type { BancoListaUsuario, BancoModoResposta } from '@/lib/types/banco-questoes'

/**
 * Minhas listas.
 *
 * A tela anterior mostrava cartões com o nome e "N questões", e mais nada. Isso
 * é justamente o que NÃO ajuda quem volta: com cinco listas na tela, todas
 * parecem iguais e escolher qual retomar vira adivinhação. Aqui cada lista
 * mostra quanto já foi resolvido e o botão diz o que vai acontecer — começar ou
 * continuar.
 *
 * Sumiram também os `alert()` e `confirm()` do navegador: apagar uma lista com
 * 40 questões dentro merece uma confirmação que diga o tamanho do estrago, não
 * uma caixinha cinza do sistema operacional.
 */

interface Lista extends BancoListaUsuario {
  totalQuestoes?: number
  totalResolvidas?: number
}

export default function MinhasListasPage() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [precisaPlus, setPrecisaPlus] = useState(false)
  const [listas, setListas] = useState<Lista[]>([])

  const [edicao, setEdicao] = useState<{ id?: string; nome: string; modo: BancoModoResposta } | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const [paraApagar, setParaApagar] = useState<Lista | null>(null)
  const [apagando, setApagando] = useState(false)

  const [criadorAberto, setCriadorAberto] = useState(false)
  const [hierarquia, setHierarquia] = useState({ modulos: [], topicos: [], subtopicos: [] } as any)
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([])

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/banco/listas', { cache: 'no-store' })
      if (res.status === 403) {
        const d = await res.json().catch(() => ({}))
        if (d.requiresPlus) {
          setPrecisaPlus(true)
          return
        }
      }
      if (res.ok) setListas((await res.json()).listas || [])
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  // A hierarquia é carregada junto porque o criador precisa dela no primeiro
  // clique — pedir só ao abrir deixaria a árvore vazia por meio segundo.
  useEffect(() => {
    let vivo = true
    Promise.all([
      fetch('/api/banco/hierarquia', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/banco/anos').then((r) => (r.ok ? r.json() : null)),
    ]).then(([h, a]) => {
      if (!vivo) return
      if (h) setHierarquia(h)
      if (a) setAnosDisponiveis(a.anos || [])
    })
    return () => {
      vivo = false
    }
  }, [])

  async function salvar() {
    if (!edicao?.nome.trim()) return
    setSalvando(true)
    setErro('')
    try {
      const criando = !edicao.id
      const res = await fetch(criando ? '/api/banco/listas' : `/api/banco/listas/${edicao.id}`, {
        method: criando ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: edicao.nome.trim(), modoResposta: edicao.modo }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(d.error || 'Não foi possível salvar')
        return
      }
      setEdicao(null)
      await carregar()
    } finally {
      setSalvando(false)
    }
  }

  async function apagar() {
    if (!paraApagar) return
    setApagando(true)
    try {
      const res = await fetch(`/api/banco/listas/${paraApagar._id}`, { method: 'DELETE' })
      if (res.ok) {
        setParaApagar(null)
        await carregar()
      }
    } finally {
      setApagando(false)
    }
  }

  // ── Estados de exceção ────────────────────────────────────────────────
  if (carregando) {
    return (
      <AppShell headerTitle="Minhas listas">
        <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
          <div className="h-16 rounded-2xl skeleton-pulse" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 rounded-2xl skeleton-pulse" />
            ))}
          </div>
        </div>
      </AppShell>
    )
  }

  if (precisaPlus) {
    return (
      <AppShell headerTitle="Minhas listas">
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-heading text-xl font-semibold">Listas são do Plus+</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Montar listas próprias — por assunto, por prova, para revisar antes da semana — faz
            parte da assinatura.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/loja"
              className="btn-brand-glow inline-flex h-10 items-center rounded-xl px-5 text-sm font-bold text-white active:scale-[0.98]"
            >
              Assinar o Plus+
            </Link>
            <Link
              href="/banco-questoes"
              className="inline-flex h-10 items-center rounded-xl border border-border px-5 text-sm font-semibold transition hover:bg-muted"
            >
              Voltar ao banco
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  // ── Tela ──────────────────────────────────────────────────────────────
  return (
    <AppShell headerTitle="Minhas listas">
      <div className="vidro-ambiente mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-start justify-between gap-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-primary/10">
              <ListPlus className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">Minhas listas</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {listas.length === 0
                  ? 'Nenhuma lista ainda'
                  : `${listas.length} ${listas.length === 1 ? 'lista' : 'listas'}`}
              </p>
            </div>
          </div>

          <div className="-mx-4 flex w-[calc(100%+2rem)] items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:w-auto sm:overflow-visible sm:px-0 sm:pb-0">
            <Link
              href="/banco-questoes"
              className="inline-flex h-9 flex-none items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold transition hover:bg-muted active:scale-[0.97]"
            >
              <Database className="h-3.5 w-3.5" /> Banco
            </Link>
            <Button
              className="btn-brand-glow h-9 flex-none gap-1.5 rounded-xl text-xs font-bold text-white active:scale-[0.97]"
              onClick={() => setCriadorAberto(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Montar lista
            </Button>
          </div>
        </motion.header>

        {listas.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="vidro vidro-brilho rounded-[22px] px-6 py-14 text-center"
          >
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <h2 className="text-base font-bold">Nenhuma lista ainda</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Listas são o jeito de separar o que você quer refazer: as questões que errou, as de um
              assunto só, um simulado antes da prova.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button
                className="btn-brand-glow h-10 gap-1.5 rounded-xl text-sm font-bold text-white"
                onClick={() => setCriadorAberto(true)}
              >
                <Plus className="h-4 w-4" /> Montar a primeira
              </Button>
              <Button
                variant="outline"
                className="h-10 gap-1.5 rounded-xl text-sm font-semibold"
                onClick={() => setEdicao({ nome: '', modo: 'imediato' })}
              >
                Criar lista vazia
              </Button>
              {/* O caminho mais provável não é criar uma lista vazia e voltar
                  para enchê-la: é escolher as questões primeiro. */}
              <Link
                href="/banco-questoes"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold transition hover:bg-muted"
              >
                <Database className="h-4 w-4" /> Escolher questões no banco
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {listas.map((lista, i) => (
                <CartaoDeLista
                  key={String(lista._id)}
                  lista={lista}
                  indice={i}
                  onAbrir={() => router.push(`/banco-questoes/listas/${lista._id}`)}
                  onEditar={() =>
                    setEdicao({
                      id: String(lista._id),
                      nome: lista.nome,
                      modo: lista.modoResposta || 'imediato',
                    })
                  }
                  onApagar={() => setParaApagar(lista)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <CriadorDeLista
        aberto={criadorAberto}
        hierarquia={hierarquia}
        anosDisponiveis={anosDisponiveis}
        onFechar={() => setCriadorAberto(false)}
        onCriada={(id) => {
          setCriadorAberto(false)
          if (id) router.push(`/banco-questoes/listas/${id}`)
        }}
      />

      {/* ── Criar / renomear ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {edicao ? (
          <Modal aoFechar={() => !salvando && setEdicao(null)} titulo={edicao.id ? 'Editar lista' : 'Nova lista'}>
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <Input
              autoFocus
              value={edicao.nome}
              onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void salvar()
              }}
              placeholder="Ex: Revisar antes da P1"
              className="mt-1 h-10 text-sm"
            />

            <Label className="mt-4 block text-xs text-muted-foreground">Quando mostrar a resposta</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(
                [
                  { valor: 'imediato', titulo: 'A cada questão', desc: 'Corrige na hora' },
                  { valor: 'final', titulo: 'Só no final', desc: 'Como um simulado' },
                ] as const
              ).map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => setEdicao({ ...edicao, modo: opcao.valor })}
                  className={cn(
                    'rounded-xl border p-2.5 text-left transition active:scale-[0.98]',
                    edicao.modo === opcao.valor
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted',
                  )}
                >
                  <span className="block text-[13px] font-semibold">{opcao.titulo}</span>
                  <span className="block text-[11px] text-muted-foreground">{opcao.desc}</span>
                </button>
              ))}
            </div>

            {erro ? <p className="mt-3 text-xs text-destructive">{erro}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={salvando} onClick={() => setEdicao(null)}>
                Cancelar
              </Button>
              <Button size="sm" disabled={!edicao.nome.trim() || salvando} onClick={salvar}>
                {salvando ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </Modal>
        ) : null}
      </AnimatePresence>

      {/* ── Apagar ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {paraApagar ? (
          <Modal aoFechar={() => !apagando && setParaApagar(null)} titulo="Apagar lista">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {/* O aviso diz o tamanho do estrago: apagar uma lista vazia e uma
                  com 40 questões dentro não são a mesma decisão. */}
              <span className="font-semibold text-foreground">{paraApagar.nome}</span> tem{' '}
              {paraApagar.totalQuestoes || 0}{' '}
              {(paraApagar.totalQuestoes || 0) === 1 ? 'questão' : 'questões'}. As questões
              continuam no banco — some só a lista.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={apagando} onClick={() => setParaApagar(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" size="sm" disabled={apagando} onClick={apagar}>
                {apagando ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Apagar
              </Button>
            </div>
          </Modal>
        ) : null}
      </AnimatePresence>
    </AppShell>
  )
}

function CartaoDeLista({
  lista,
  indice,
  onAbrir,
  onEditar,
  onApagar,
}: {
  lista: Lista
  indice: number
  onAbrir: () => void
  onEditar: () => void
  onApagar: () => void
}) {
  const total = lista.totalQuestoes || 0
  const feitas = Math.min(lista.totalResolvidas || 0, total)
  const percentual = total > 0 ? Math.round((feitas / total) * 100) : 0
  const concluida = total > 0 && feitas >= total
  const comecada = feitas > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, delay: Math.min(indice, 6) * 0.04 }}
      className="vidro vidro-brilho hover-lift group relative flex flex-col rounded-[22px] p-4 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onAbrir}
          className="min-w-0 flex-1 text-left after:absolute after:inset-0 after:content-['']"
        >
          <span className="line-clamp-2 text-sm font-bold leading-snug">{lista.nome}</span>
        </button>

        {/* Acima da camada do cartão: botão dentro de área clicável não é
            alcançável por teclado se ficar embaixo. */}
        <div className="relative z-10 flex flex-none items-center opacity-70 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={onEditar}
            aria-label={`Editar ${lista.nome}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onApagar}
            aria-label={`Apagar ${lista.nome}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <BookOpen className="h-3 w-3" />
        <span className="tabular-nums">
          {total} {total === 1 ? 'questão' : 'questões'}
        </span>
        <span className="opacity-40">·</span>
        <span>{lista.modoResposta === 'final' ? 'Resposta no final' : 'Corrige na hora'}</span>
      </div>

      <div className="flex-1" />

      {total > 0 ? (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span className={cn(concluida ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
              {concluida ? (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Concluída
                </span>
              ) : (
                `${feitas} de ${total} resolvidas`
              )}
            </span>
            <span className="tabular-nums text-muted-foreground">{percentual}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentual}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              className={cn('h-full rounded-full', concluida ? 'bg-emerald-500' : 'bg-primary')}
            />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Lista vazia — adicione questões pelo banco.
        </p>
      )}

      <span
        className={cn(
          'relative z-0 mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition',
          total === 0
            ? 'border border-border text-muted-foreground'
            : 'bg-primary/10 text-primary group-hover:bg-primary/15',
        )}
      >
        {total === 0 ? (
          'Abrir'
        ) : concluida ? (
          <>
            <RotateCcw className="h-3.5 w-3.5" /> Refazer
          </>
        ) : comecada ? (
          <>
            <Play className="h-3.5 w-3.5" /> Continuar
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" /> Começar
          </>
        )}
      </span>
    </motion.div>
  )
}

function Modal({
  titulo,
  aoFechar,
  children,
}: {
  titulo: string
  aoFechar: () => void
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[195] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) aoFechar()
      }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="vidro-denso vidro-brilho w-full max-w-sm rounded-t-[28px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-[28px] sm:pb-5"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">{titulo}</h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="-m-1 rounded-lg p-1 text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
