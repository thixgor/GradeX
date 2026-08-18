'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
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
  // Contagem vinda da mesma fonte da importação (ver GET da rota): usar
  // /api/exams aqui mostrava zero em todo grupo, porque aquela rota esconde as
  // provas ocultas — que são boa parte das provas antigas da faculdade.
  const [provas, setProvas] = useState<{ _id: string; groupId?: string | null }[]>([])
  const [contagem, setContagem] = useState<Record<string, { provas: number; questoes: number }>>({})
  const [carregando, setCarregando] = useState(true)
  const [escolhidos, setEscolhidos] = useState<string[]>([])
  const [busca, setBusca] = useState('')
  const [abertos, setAbertos] = useState<string[]>([])

  const [previa, setPrevia] = useState<any>(null)
  const [calculando, setCalculando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [progresso, setProgresso] = useState<{ feitas: number; total: number } | null>(null)
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let vivo = true
    Promise.all([
      fetch('/api/groups').then((r) => (r.ok ? r.json() : { groups: [] })),
      fetch('/api/admin/banco/importar-provas').then((r) => (r.ok ? r.json() : { porGrupo: [] })),
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
        const mapa: Record<string, { provas: number; questoes: number }> = {}
        // A árvore soma o ramo inteiro com `contarProvas`, que espera uma lista
        // de provas; a contagem agregada é expandida para isso.
        const expandidas: { _id: string; groupId: string | null }[] = []
        for (const linha of e.porGrupo || []) {
          mapa[linha.grupoId] = { provas: linha.provas, questoes: linha.questoes }
          for (let i = 0; i < linha.provas; i++) {
            expandidas.push({ _id: `${linha.grupoId}-${i}`, groupId: linha.grupoId })
          }
        }
        setContagem(mapa)
        setProvas(expandidas)
      })
      .finally(() => vivo && setCarregando(false))
    return () => {
      vivo = false
    }
  }, [])

  /** Questões do ramo inteiro — mesma soma que `contarProvas` faz para provas. */
  const questoesDoRamo = useMemo(() => {
    const somar = (id: string, vistos = new Set<string>()): number => {
      if (vistos.has(id)) return 0
      vistos.add(id)
      const direto = contagem[id]?.questoes || 0
      return filhosDe(grupos, id).reduce((s, f) => s + somar(f._id, vistos), direto)
    }
    return somar
  }, [grupos, contagem])

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

  async function calcularPrevia() {
    setErro('')
    setCalculando(true)
    try {
      const res = await fetch('/api/admin/banco/importar-provas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupoIds: escolhidos, previa: true }),
      })
      const dados = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(dados.error || 'Não foi possível calcular')
        return
      }
      setPrevia(dados)
    } finally {
      setCalculando(false)
    }
  }

  /**
   * Importa em ondas, de algumas provas por vez.
   *
   * Um curso inteiro são centenas de provas com dezenas de questões cada. Numa
   * requisição só, isso estoura o tempo limite da função e falha DEPOIS de ter
   * trabalhado, sem dizer o que entrou. Aqui cada volta grava um pedaço e a
   * barra anda; se uma volta falhar, o que já entrou continua no banco e
   * recomeçar apenas atualiza o que foi gravado duas vezes.
   */
  async function importar() {
    setErro('')
    setImportando(true)
    setResultado(null)

    const acumulado = { criadas: 0, atualizadas: 0, ignoradas: 0, exemplosIgnorados: [] as any[] }
    let offset = 0

    try {
      for (let volta = 0; volta < 2000; volta++) {
        const res = await fetch('/api/admin/banco/importar-provas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grupoIds: escolhidos, offset }),
        })
        const dados = await res.json().catch(() => ({}))

        if (!res.ok) {
          // O parcial é reportado junto do erro: dizer só "falhou" depois de
          // 600 questões terem entrado faria o admin reimportar às cegas.
          setErro(
            `${dados.error || 'A importação parou'} — ${acumulado.criadas} questões já entraram. Pode rodar de novo: o que entrou será atualizado, não duplicado.`,
          )
          setResultado({ ...acumulado, parcial: true })
          return
        }

        acumulado.criadas += dados.criadas || 0
        acumulado.atualizadas += dados.atualizadas || 0
        acumulado.ignoradas += dados.ignoradas || 0
        if (acumulado.exemplosIgnorados.length < 10 && dados.exemplosIgnorados?.length) {
          acumulado.exemplosIgnorados.push(...dados.exemplosIgnorados)
        }

        offset = dados.proximoOffset ?? offset + (dados.processadas || 0)
        setProgresso({ feitas: Math.min(offset, dados.totalProvas || offset), total: dados.totalProvas || offset })

        if (dados.fim) break
      }
      setResultado({ ...acumulado, parcial: false })
    } finally {
      setImportando(false)
      setProgresso(null)
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
        <section className="surface-inset rounded-2xl p-4">
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
            <div className="flex gap-2">
              <dt className="w-20 flex-none font-semibold text-foreground">Período</dt>
              <dd>
                o “2026.2” do nome da prova — “N1 SOI I - 2026.2” entra como 2026, semestre 2. Sem
                isso no nome, vale o ano da data da prova.
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Reimportar o mesmo grupo <strong>atualiza</strong> as questões já trazidas em vez de
            duplicá-las — corrigiu um gabarito na prova, reimporte e o banco acompanha.
          </p>
        </section>

        {/* ── Escolha dos grupos ───────────────────────────────────────── */}
        <section className="glass-page-card rounded-2xl p-4">
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
              className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-[13px] outline-none focus:border-primary/50"
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
                    questoes={questoesDoRamo(g._id)}
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
              questoesDoRamo={questoesDoRamo}
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
            onClick={calcularPrevia}
            className="gap-1.5 rounded-xl"
          >
            {calculando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Ver o que será importado
          </Button>
          <Button
            disabled={!previa || previa.questoes === 0 || importando}
            onClick={importar}
            className="btn-brand-glow gap-1.5 rounded-xl text-white"
          >
            {importando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {importando
              ? `Importando… ${progresso ? `${progresso.feitas}/${progresso.total} provas` : ''}`
              : `Importar${previa ? ` ${previa.questoes} questões` : ''}`}
          </Button>
        </div>

        {progresso && progresso.total > 0 ? (
          <div className="glass-page-card rounded-2xl p-4">
            <p className="text-xs font-semibold tabular-nums">
              {progresso.feitas} de {progresso.total} provas processadas
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${(progresso.feitas / progresso.total) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Não feche a página. A importação vai em ondas para não estourar o tempo do servidor.
            </p>
          </div>
        ) : null}

        {/* ── Prévia ────────────────────────────────────────────────────── */}
        {previa ? (
          <section className="glass-page-card rounded-2xl p-4">
            <h2 className="text-sm font-bold">Prévia</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Numero rotulo="Provas" valor={previa.provas} />
              <Numero rotulo="Questões" valor={previa.questoes} destaque />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Não há limite de quantidade: a importação anda em ondas até terminar, seja qual for o
              tamanho. Algumas questões podem não entrar — redação, questão sem enunciado e objetiva
              sem gabarito —, e isso só se sabe olhando uma a uma. O número exato aparece no fim.
            </p>

            {previa.porGrupo?.length > 0 ? (
              <ul className="mt-3 space-y-1 border-t border-border pt-3">
                {previa.porGrupo.map((g: any) => (
                  <li key={g.grupoId} className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate">{g.grupoNome}</span>
                    <span className="flex-none tabular-nums text-muted-foreground">
                      {g.provas} provas · {g.questoes} questões
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

          </section>
        ) : null}

        {/* ── Resultado ─────────────────────────────────────────────────── */}
        {resultado ? (
          <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {resultado.criadas} questões criadas, {resultado.atualizadas} atualizadas
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {resultado.ignoradas > 0
                ? `${resultado.ignoradas} ficaram de fora (redação, sem enunciado ou sem gabarito). `
                : ''}
              Elas já aparecem no banco, filtráveis pelo caminho dos grupos.
            </p>
            {resultado.exemplosIgnorados?.length > 0 ? (
              <ul className="mt-2 space-y-0.5">
                {resultado.exemplosIgnorados.slice(0, 6).map((i: any, idx: number) => (
                  <li key={idx} className="text-[11px] text-muted-foreground">
                    {i.provaTitulo}
                    {i.questaoNumero ? ` · questão ${i.questaoNumero}` : ''} — {i.motivo}
                  </li>
                ))}
              </ul>
            ) : null}
            <Link
              href="/banco-questoes"
              className="btn-brand-glow mt-3 inline-flex h-10 items-center rounded-xl px-4 text-xs font-bold text-white"
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
  questoesDoRamo,
  abertos,
  onAlternarAberto,
  escolhidos,
  onEscolher,
}: {
  grupos: GrupoNaArvore[]
  provas: { _id: string; groupId?: string | null }[]
  paiId: string | null
  nivel: number
  questoesDoRamo: (id: string) => number
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
                questoes={questoesDoRamo(g._id)}
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
                questoesDoRamo={questoesDoRamo}
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
  questoes,
  escolhido,
  onEscolher,
}: {
  grupo: GrupoNaArvore
  caminho?: string
  provas: number
  questoes?: number
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
        {questoes ? ` · ${questoes} questões` : ''}
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
