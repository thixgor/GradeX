'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Download,
  Loader2,
  Search,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  caminhoAte,
  contarProvas,
  filhosDe,
  paraBusca,
  type GrupoNaArvore,
} from '@/lib/provas/arvore-grupos'

/**
 * Importar as questões das Provas da Faculdade para o Banco de Questões.
 *
 * As provas já existem em /provas com gabarito e, nas que foram criadas com
 * feedback comentado, uma explicação por alternativa. Redigitá-las no formato
 * de texto seria manter duas cópias da mesma questão, que divergem no primeiro
 * conserto de gabarito.
 *
 * A tela é deliberadamente de dois passos: escolher os grupos e VER a conta
 * antes de gravar. Uma importação que já começa gravando é uma importação que o
 * admin descobre errada depois de 800 questões terem entrado no banco.
 */
export default function ImportarProvasPage() {
  const [grupos, setGrupos] = useState<GrupoNaArvore[]>([])
  const [provas, setProvas] = useState<{ _id: string; groupId?: string | null }[]>([])
  const [carregando, setCarregando] = useState(true)
  const [escolhidos, setEscolhidos] = useState<string[]>([])
  const [busca, setBusca] = useState('')
  const [abertos, setAbertos] = useState<string[]>([])

  const [previa, setPrevia] = useState<any>(null)
  const [calculando, setCalculando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let vivo = true
    Promise.all([
      fetch('/api/groups').then((r) => (r.ok ? r.json() : { groups: [] })),
      fetch('/api/exams?resumo=1').then((r) => (r.ok ? r.json() : { exams: [] })),
    ])
      .then(([g, e]) => {
        if (!vivo) return
        setGrupos(
          (g.groups || []).map((x: any) => ({
            _id: String(x._id),
            name: x.name,
            parentGroupId: x.parentGroupId ? String(x.parentGroupId) : null,
            type: x.type,
            category: x.category,
          })),
        )
        setProvas((e.exams || []).map((x: any) => ({ _id: String(x._id), groupId: x.groupId || null })))
      })
      .finally(() => vivo && setCarregando(false))
    return () => {
      vivo = false
    }
  }, [])

  // Só grupos gerais entram: grupo pessoal é material de uma pessoa só e não
  // pode virar conteúdo do banco, que é de todo mundo.
  const gerais = useMemo(() => grupos.filter((g) => g.type === 'general'), [grupos])

  const resultadosBusca = useMemo(() => {
    const alvo = paraBusca(busca)
    if (alvo.length < 2) return null
    return gerais.filter((g) => paraBusca(g.name).includes(alvo)).slice(0, 30)
  }, [busca, gerais])

  function alternar(id: string) {
    setPrevia(null)
    setResultado(null)
    setEscolhidos((atual) => (atual.includes(id) ? atual.filter((i) => i !== id) : [...atual, id]))
  }

  async function pedir(previaApenas: boolean) {
    setErro('')
    if (previaApenas) setCalculando(true)
    else setImportando(true)
    try {
      const res = await fetch('/api/admin/banco/importar-provas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupoIds: escolhidos, previa: previaApenas }),
      })
      const dados = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(dados.error || 'Não foi possível processar')
        return
      }
      if (previaApenas) setPrevia(dados)
      else setResultado(dados)
    } finally {
      setCalculando(false)
      setImportando(false)
    }
  }

  return (
    <AppShell headerTitle="Importar provas">
      <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
        <div>
          <Link
            href="/admin/banco-questoes"
            className="-m-2 mb-2 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Banco de Questões
          </Link>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Importar das Provas da Faculdade
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Escolha os grupos de /provas. As questões entram no banco com gabarito e com o
            comentário por alternativa que a prova já tiver, indexadas pelo caminho do grupo — é por
            ele que o aluno vai filtrar depois.
          </p>
        </div>

        {/* ── Mapeamento ────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-muted/30 p-4">
          <h2 className="text-sm font-bold">Para onde cada coisa vai</h2>
          <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div className="flex gap-2">
              <dt className="w-20 flex-none font-semibold text-foreground">Módulo</dt>
              <dd>o grupo que você escolher aqui</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 flex-none font-semibold text-foreground">Tópico</dt>
              <dd>o caminho dos subgrupos até a prova (ex.: “Período 1 › Módulo I”)</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 flex-none font-semibold text-foreground">Subtópico</dt>
              <dd>o título da prova</dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Reimportar o mesmo grupo <strong>atualiza</strong> as questões já trazidas em vez de
            duplicá-las — corrigiu um gabarito na prova, reimporte e o banco acompanha.
          </p>
        </section>

        {/* ── Escolha dos grupos ───────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold">Grupos</h2>
            {escolhidos.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setEscolhidos([])
                  setPrevia(null)
                  setResultado(null)
                }}
                className="rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
              >
                {escolhidos.length} escolhido{escolhidos.length === 1 ? '' : 's'} · limpar
              </button>
            ) : null}
          </div>

          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar grupo…"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[13px] outline-none focus:border-primary/50"
            />
          </div>

          {carregando ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-9 rounded-lg skeleton-pulse" />
              ))}
            </div>
          ) : resultadosBusca ? (
            <div className="space-y-1">
              {resultadosBusca.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Nenhum grupo com esse nome.
                </p>
              ) : (
                resultadosBusca.map((g) => (
                  <Linha
                    key={g._id}
                    grupo={g}
                    caminho={caminhoAte(gerais, g._id).slice(0, -1).map((x) => x.name).join(' › ')}
                    provas={contarProvas(gerais, provas as any, g._id)}
                    escolhido={escolhidos.includes(g._id)}
                    onEscolher={() => alternar(g._id)}
                  />
                ))
              )}
            </div>
          ) : (
            <Nivel
              grupos={gerais}
              provas={provas}
              paiId={null}
              nivel={0}
              abertos={abertos}
              onAlternarAberto={(id) =>
                setAbertos((a) => (a.includes(id) ? a.filter((i) => i !== id) : [...a, id]))
              }
              escolhidos={escolhidos}
              onEscolher={alternar}
            />
          )}
        </section>

        {/* ── Ações ─────────────────────────────────────────────────────── */}
        {erro ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {erro}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={escolhidos.length === 0 || calculando}
            onClick={() => pedir(true)}
            className="gap-1.5"
          >
            {calculando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Ver o que será importado
          </Button>
          <Button
            disabled={!previa || previa.total === 0 || importando}
            onClick={() => pedir(false)}
            className="gap-1.5"
          >
            {importando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Importar {previa ? `${previa.total} questões` : ''}
          </Button>
        </div>

        {/* ── Prévia ────────────────────────────────────────────────────── */}
        {previa ? (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-bold">Prévia</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Numero rotulo="Questões" valor={previa.total} destaque />
              <Numero rotulo="Novas" valor={previa.novas} />
              <Numero rotulo="Atualizadas" valor={previa.atualizadas} />
              <Numero rotulo="Fora" valor={previa.ignoradas} />
            </div>

            {previa.porGrupo?.length > 0 ? (
              <ul className="mt-3 space-y-1 border-t border-border pt-3">
                {previa.porGrupo.map((g: any) => (
                  <li key={g.grupoId} className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate">{g.grupoNome}</span>
                    <span className="flex-none tabular-nums text-muted-foreground">
                      {g.questoes} questões
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {previa.exemplosIgnorados?.length > 0 ? (
              <div className="mt-3 border-t border-border pt-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  O que fica de fora
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {previa.exemplosIgnorados.map((i: any, idx: number) => (
                    <li key={idx} className="text-[11px] text-muted-foreground">
                      {i.provaTitulo}
                      {i.questaoNumero ? ` · questão ${i.questaoNumero}` : ''} — {i.motivo}
                    </li>
                  ))}
                </ul>
                {previa.ignoradas > previa.exemplosIgnorados.length ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    …e mais {previa.ignoradas - previa.exemplosIgnorados.length}.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* ── Resultado ─────────────────────────────────────────────────── */}
        {resultado ? (
          <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {resultado.criadas} questões criadas, {resultado.atualizadas} atualizadas
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Elas já aparecem no banco, filtráveis pelo caminho dos grupos.
            </p>
            <Link
              href="/banco-questoes"
              className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground"
            >
              Ver no banco
            </Link>
          </section>
        ) : null}
      </div>
    </AppShell>
  )
}

function Nivel({
  grupos,
  provas,
  paiId,
  nivel,
  abertos,
  onAlternarAberto,
  escolhidos,
  onEscolher,
}: {
  grupos: GrupoNaArvore[]
  provas: { _id: string; groupId?: string | null }[]
  paiId: string | null
  nivel: number
  abertos: string[]
  onAlternarAberto: (id: string) => void
  escolhidos: string[]
  onEscolher: (id: string) => void
}) {
  const filhos = filhosDe(grupos, paiId)
  if (filhos.length === 0) return null

  return (
    <div className={cn(nivel > 0 && 'ml-3 border-l border-border pl-1')}>
      {filhos.map((g) => {
        const temFilhos = filhosDe(grupos, g._id).length > 0
        const aberto = abertos.includes(g._id)
        return (
          <div key={g._id}>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onAlternarAberto(g._id)}
                disabled={!temFilhos}
                aria-label={aberto ? `Recolher ${g.name}` : `Expandir ${g.name}`}
                aria-expanded={aberto}
                className="flex h-8 w-6 flex-none items-center justify-center rounded text-muted-foreground transition hover:bg-muted disabled:opacity-25"
              >
                <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', aberto && 'rotate-90')} />
              </button>
              <Linha
                grupo={g}
                provas={contarProvas(grupos, provas as any, g._id)}
                escolhido={escolhidos.includes(g._id)}
                onEscolher={() => onEscolher(g._id)}
              />
            </div>
            {aberto ? (
              <Nivel
                grupos={grupos}
                provas={provas}
                paiId={g._id}
                nivel={nivel + 1}
                abertos={abertos}
                onAlternarAberto={onAlternarAberto}
                escolhidos={escolhidos}
                onEscolher={onEscolher}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function Linha({
  grupo,
  caminho,
  provas,
  escolhido,
  onEscolher,
}: {
  grupo: GrupoNaArvore
  caminho?: string
  provas: number
  escolhido: boolean
  onEscolher: () => void
}) {
  return (
    <button
      type="button"
      onClick={onEscolher}
      className={cn(
        'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition',
        escolhido ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
      )}
    >
      <span
        className={cn(
          'flex h-4 w-4 flex-none items-center justify-center rounded border text-[10px]',
          escolhido ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
        )}
        aria-hidden
      >
        {escolhido ? '✓' : ''}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px]">
        {caminho ? <span className="text-muted-foreground">{caminho} › </span> : null}
        {grupo.name}
      </span>
      <span className="flex-none text-[11px] tabular-nums text-muted-foreground">
        {provas} {provas === 1 ? 'prova' : 'provas'}
      </span>
    </button>
  )
}

function Numero({ rotulo, valor, destaque }: { rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <div className={cn('rounded-lg border p-2.5', destaque ? 'border-primary/30 bg-primary/5' : 'border-border')}>
      <p className="text-[11px] text-muted-foreground">{rotulo}</p>
      <p className={cn('mt-0.5 text-xl font-bold tabular-nums', destaque && 'text-primary')}>{valor}</p>
    </div>
  )
}
