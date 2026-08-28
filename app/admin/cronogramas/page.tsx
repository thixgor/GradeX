'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  Filter,
  List,
  Loader2,
  Plus,
  Search,
  X,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Calendario } from '@/components/cronogramas/calendario'
import {
  EditorAvaliacao,
  LinhaAvaliacao,
  avaliacaoVazia,
  type RascunhoAvaliacao,
} from '@/components/cronogramas/editor-avaliacao'
import { ImportarEmenta, type EmentaImportada } from '@/components/cronogramas/importar-ementa'
import { diasEntre, hojeBrasilia } from '@/lib/cronogramas/brasilia'
import { SECOES, getSecao, type Avaliacao, type SecaoCurso } from '@/lib/cronogramas/tipos'

type Aba = 'avaliacoes' | 'ementas'
type Visao = 'lista' | 'calendario'
type Janela = 'proximas' | 'passadas' | 'todas'

const ABAS: Array<{ id: Aba; rotulo: string; icone: typeof CalendarCheck }> = [
  { id: 'avaliacoes', rotulo: 'Avaliações & lembretes', icone: CalendarCheck },
  { id: 'ementas', rotulo: 'Ementas', icone: BookOpen },
]

const JANELAS: Array<{ id: Janela; rotulo: string }> = [
  { id: 'proximas', rotulo: 'Próximas' },
  { id: 'passadas', rotulo: 'Passadas' },
  { id: 'todas', rotulo: 'Todas' },
]

/**
 * Painel das avaliações e dos lembretes.
 *
 * Tudo acontece nesta tela: filtrar, criar, editar, publicar e configurar o
 * lembrete de cada avaliação. Não há tela de detalhe nem modal — o formulário
 * abre no lugar da linha, e os dois interruptores que o admin mais usa
 * (lembretes ligados, avaliação publicada) agem direto da lista.
 *
 * A visão de calendário e a de lista mostram exatamente o mesmo recorte: os
 * filtros valem para as duas, e clicar num dia do calendário abre o formulário
 * já com aquela data.
 *
 * A segunda aba é a ementa. Ela mora aqui, e não num script do repositório,
 * porque corrigir um assunto do 3º período é trabalho de coordenação — não
 * deveria exigir editar markdown no GitHub, rodar build e esperar deploy.
 */
function ConteudoAdminCronogramas() {
  const router = useRouter()
  const parametros = useSearchParams()

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [hoje, setHoje] = useState(() => hojeBrasilia())

  const [aba, setAba] = useState<Aba>('avaliacoes')
  const [ementas, setEmentas] = useState<EmentaImportada[]>([])
  const [carregandoEmentas, setCarregandoEmentas] = useState(true)

  const [visao, setVisao] = useState<Visao>('lista')
  const [secoesFiltro, setSecoesFiltro] = useState<Set<SecaoCurso>>(new Set())
  const [periodoFiltro, setPeriodoFiltro] = useState<number | null>(null)
  const [janela, setJanela] = useState<Janela>('proximas')
  const [busca, setBusca] = useState('')
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)

  const [editando, setEditando] = useState<string | null>(null)
  const [rascunhoNovo, setRascunhoNovo] = useState<RascunhoAvaliacao | null>(null)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [aviso, setAviso] = useState<{ tom: 'ok' | 'erro'; texto: string } | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const resposta = await fetch('/api/admin/cronogramas/avaliacoes')
      if (resposta.ok) {
        const dados = await resposta.json()
        setAvaliacoes(dados.avaliacoes ?? [])
        if (dados.hoje) setHoje(dados.hoje)
      }
    } finally {
      setCarregando(false)
    }
  }, [])

  const carregarEmentas = useCallback(async () => {
    setCarregandoEmentas(true)
    try {
      const resposta = await fetch('/api/admin/cronogramas/ementas')
      if (resposta.ok) {
        const dados = await resposta.json()
        setEmentas(dados.ementas ?? [])
      }
    } finally {
      setCarregandoEmentas(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
    void carregarEmentas()
  }, [carregar, carregarEmentas])

  // Atalho vindo do calendário do aluno: /admin/cronogramas?novo=2026-04-10
  useEffect(() => {
    const dia = parametros.get('novo')
    if (dia) setRascunhoNovo(avaliacaoVazia('medicina', 1, dia))
  }, [parametros])

  useEffect(() => {
    if (!aviso) return
    const id = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(id)
  }, [aviso])

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return avaliacoes.filter(avaliacao => {
      if (secoesFiltro.size > 0 && !secoesFiltro.has(avaliacao.secao)) return false
      if (periodoFiltro != null && avaliacao.periodo !== periodoFiltro) return false

      const dias = diasEntre(hoje, avaliacao.data)
      if (janela === 'proximas' && dias < 0) return false
      if (janela === 'passadas' && dias >= 0) return false

      if (termo) {
        const alvo = `${avaliacao.titulo} ${avaliacao.conteudo ?? ''} ${avaliacao.local ?? ''}`.toLowerCase()
        if (!alvo.includes(termo)) return false
      }

      return true
    })
  }, [avaliacoes, secoesFiltro, periodoFiltro, janela, busca, hoje])

  const resumo = useMemo(() => {
    const futuras = avaliacoes.filter(a => diasEntre(hoje, a.data) >= 0)
    return {
      total: avaliacoes.length,
      futuras: futuras.length,
      comLembrete: futuras.filter(a => a.lembrete.ativo && a.publicada).length,
      rascunhos: avaliacoes.filter(a => !a.publicada).length,
    }
  }, [avaliacoes, hoje])

  const periodosDoFiltro = useMemo(() => {
    const alvo = secoesFiltro.size === 1 ? getSecao([...secoesFiltro][0]).periodos : 12
    return Array.from({ length: alvo }, (_, i) => i + 1)
  }, [secoesFiltro])

  function alternarSecao(secao: SecaoCurso) {
    setSecoesFiltro(anterior => {
      const proximo = new Set(anterior)
      if (proximo.has(secao)) proximo.delete(secao)
      else proximo.add(secao)
      return proximo
    })
  }

  async function criar(rascunho: RascunhoAvaliacao) {
    setSalvando('novo')
    try {
      const resposta = await fetch('/api/admin/cronogramas/avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rascunho),
      })
      const dados = await resposta.json().catch(() => ({}))

      if (!resposta.ok) {
        setAviso({ tom: 'erro', texto: dados?.error || 'Não foi possível criar.' })
        return
      }

      setAvaliacoes(anterior =>
        [...anterior, ...(dados.avaliacoes ?? [])].sort((a, b) => a.data.localeCompare(b.data)),
      )
      // O formulário continua aberto com a mesma seção, período e data: marcar
      // o calendário do semestre é preencher várias parecidas em sequência.
      setRascunhoNovo(avaliacaoVazia(rascunho.secao, rascunho.periodo, rascunho.data))
      setAviso({ tom: 'ok', texto: 'Avaliação criada.' })
    } finally {
      setSalvando(null)
    }
  }

  async function alterar(id: string, mudancas: Partial<Avaliacao>) {
    setSalvando(id)
    try {
      const resposta = await fetch(`/api/admin/cronogramas/avaliacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mudancas),
      })
      const dados = await resposta.json().catch(() => ({}))

      if (!resposta.ok) {
        setAviso({ tom: 'erro', texto: dados?.error || 'Não foi possível salvar.' })
        return false
      }

      setAvaliacoes(anterior =>
        anterior
          .map(item => (item._id === id ? dados.avaliacao : item))
          .sort((a, b) => a.data.localeCompare(b.data)),
      )
      return true
    } finally {
      setSalvando(null)
    }
  }

  async function apagar(id: string, titulo: string) {
    if (!confirm(`Apagar "${titulo}"? Os lembretes dela param na hora.`)) return
    setSalvando(id)
    try {
      const resposta = await fetch(`/api/admin/cronogramas/avaliacoes/${id}`, { method: 'DELETE' })
      if (resposta.ok) {
        setAvaliacoes(anterior => anterior.filter(item => item._id !== id))
        setEditando(null)
        setAviso({ tom: 'ok', texto: 'Avaliação apagada.' })
      }
    } finally {
      setSalvando(null)
    }
  }

  async function importarEmentas(
    itens: Array<{ secao: SecaoCurso; periodo: number; markdown: string; nome: string }>,
    adicionar: boolean,
  ) {
    const resposta = await fetch('/api/admin/cronogramas/ementas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens, adicionar }),
    })
    const dados = await resposta.json().catch(() => ({}))

    if (!resposta.ok) {
      setAviso({ tom: 'erro', texto: dados?.error || 'Não foi possível importar.' })
      return false
    }

    await carregarEmentas()
    const quantas = dados.importadas?.length ?? 0
    setAviso({
      tom: 'ok',
      texto: `${quantas} ementa${quantas === 1 ? '' : 's'} no ar. Os alunos já veem o conteúdo novo.`,
    })
    return true
  }

  async function removerEmenta(secao: SecaoCurso, periodo: number) {
    if (!confirm(`Remover a ementa de ${getSecao(secao).nome} ${periodo}º período? Os alunos perdem o conteúdo programático desse período.`)) return

    const resposta = await fetch(
      `/api/admin/cronogramas/ementas?secao=${secao}&periodo=${periodo}`,
      { method: 'DELETE' },
    )

    if (resposta.ok) {
      setEmentas(anterior => anterior.filter(item => !(item.secao === secao && item.periodo === periodo)))
      setAviso({ tom: 'ok', texto: 'Ementa removida.' })
    }
  }

  const filtroAtivo = secoesFiltro.size > 0 || periodoFiltro != null || busca.trim().length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <button
          onClick={() => router.push('/admin')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Painel
        </button>

        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Cronogramas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {aba === 'avaliacoes'
                ? 'Marque as avaliações de cada seção e período e defina quando os alunos são lembrados.'
                : 'Importe o conteúdo programático de cada período. É o que alimenta a ementa e o cronograma dos alunos.'}
            </p>
          </div>

          {aba === 'avaliacoes' && (
            <Button
              onClick={() => {
                const secao = secoesFiltro.size === 1 ? [...secoesFiltro][0] : 'medicina'
                setRascunhoNovo(avaliacaoVazia(secao, periodoFiltro ?? 1, hoje))
                setVisao('lista')
              }}
              className="h-11 rounded-xl bg-gradient-to-r from-[#468152] to-[#5a9a63] px-5 font-semibold text-white shadow-lg shadow-[#468152]/20"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova avaliação
            </Button>
          )}
        </header>

        {/* ── Duas responsabilidades, duas abas ── */}
        <nav className="mb-5 flex gap-1 rounded-xl bg-muted/50 p-1" role="tablist">
          {ABAS.map(item => {
            const Icone = item.icone
            const ativa = aba === item.id
            const contador = item.id === 'ementas' ? ementas.length : resumo.futuras

            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={ativa}
                onClick={() => setAba(item.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  ativa ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icone className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{item.rotulo}</span>
                <span className="sm:hidden">{item.id === 'ementas' ? 'Ementas' : 'Avaliações'}</span>
                {contador > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-bold ${
                      ativa ? 'bg-[#468152]/15 text-[#468152] dark:text-[#7DCEA0]' : 'bg-muted-foreground/15'
                    }`}
                  >
                    {contador}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {aviso && (
          <p
            className={`mb-4 rounded-xl px-3 py-2 text-sm font-medium ${
              aviso.tom === 'ok'
                ? 'bg-[#468152]/12 text-[#468152] dark:text-[#7DCEA0]'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {aviso.texto}
          </p>
        )}

        {aba === 'avaliacoes' ? (
          <>
            {/* ── Números que respondem "está tudo no lugar?" ── */}
            <dl className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Indicador rotulo="Cadastradas" valor={resumo.total} />
              <Indicador rotulo="Próximas" valor={resumo.futuras} />
              <Indicador rotulo="Lembrando" valor={resumo.comLembrete} icone={Bell} destaque />
              <Indicador rotulo="Rascunhos" valor={resumo.rascunhos} />
            </dl>

            {/* ── Filtros ── */}
            <div className="glass-page-card mb-4 rounded-2xl p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[11rem] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <input
                    value={busca}
                    onChange={event => setBusca(event.target.value)}
                    placeholder="Buscar por título, conteúdo ou local…"
                    className="h-10 w-full rounded-xl border border-border/60 bg-background/70 pl-9 pr-3 text-sm outline-none focus:border-[#468152]/50"
                  />
                </div>

                <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
                  {JANELAS.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setJanela(item.id)}
                      aria-pressed={janela === item.id}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        janela === item.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {item.rotulo}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
                  {(['lista', 'calendario'] as const).map(modo => (
                    <button
                      key={modo}
                      onClick={() => setVisao(modo)}
                      aria-pressed={visao === modo}
                      aria-label={modo === 'lista' ? 'Ver em lista' : 'Ver em calendário'}
                      className={`rounded-lg p-1.5 transition-colors ${
                        visao === modo ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {modo === 'lista' ? <List className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setFiltrosAbertos(aberto => !aberto)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                    filtroAtivo
                      ? 'border-[#468152]/40 bg-[#468152]/10 text-[#468152] dark:text-[#7DCEA0]'
                      : 'border-border/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Seção
                  {secoesFiltro.size > 0 && <span className="opacity-70">{secoesFiltro.size}</span>}
                </button>

                {filtroAtivo && (
                  <button
                    onClick={() => {
                      setSecoesFiltro(new Set())
                      setPeriodoFiltro(null)
                      setBusca('')
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    Limpar
                  </button>
                )}
              </div>

              {filtrosAbertos && (
                <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {SECOES.map(secao => {
                      const ativa = secoesFiltro.has(secao.id)
                      return (
                        <button
                          key={secao.id}
                          onClick={() => alternarSecao(secao.id)}
                          aria-pressed={ativa}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                            ativa ? 'border-transparent text-white' : 'border-border/60 text-muted-foreground hover:text-foreground'
                          }`}
                          style={ativa ? { backgroundColor: secao.cor } : undefined}
                        >
                          {secao.emoji} {secao.nome}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Período
                    </span>
                    {periodosDoFiltro.map(numero => (
                      <button
                        key={numero}
                        onClick={() => setPeriodoFiltro(periodoFiltro === numero ? null : numero)}
                        aria-pressed={periodoFiltro === numero}
                        className={`h-7 min-w-[2rem] rounded-lg px-1.5 text-xs font-semibold transition-colors ${
                          periodoFiltro === numero
                            ? 'bg-foreground text-background'
                            : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {numero}º
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {rascunhoNovo && (
              <div className="mb-4">
                <EditorAvaliacao
                  valor={rascunhoNovo}
                  hoje={hoje}
                  salvando={salvando === 'novo'}
                  onSalvar={criar}
                  onCancelar={() => setRascunhoNovo(null)}
                />
              </div>
            )}

            {visao === 'calendario' ? (
              <Calendario
                avaliacoes={visiveis}
                hoje={hoje}
                onNovaAvaliacao={dia => {
                  const secao = secoesFiltro.size === 1 ? [...secoesFiltro][0] : 'medicina'
                  setRascunhoNovo(avaliacaoVazia(secao, periodoFiltro ?? 1, dia))
                  setVisao('lista')
                }}
                onAvaliacaoClick={avaliacao => {
                  setVisao('lista')
                  setEditando(avaliacao._id ?? null)
                }}
              />
            ) : carregando ? (
              <div className="glass-page-card flex items-center justify-center gap-2 rounded-2xl py-16 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Carregando avaliações…
              </div>
            ) : visiveis.length === 0 ? (
              <div className="glass-page-card rounded-2xl px-6 py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <CalendarPlus className="h-6 w-6 text-muted-foreground" aria-hidden />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {filtroAtivo || janela !== 'todas' ? 'Nada neste recorte' : 'Nenhuma avaliação cadastrada'}
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  {filtroAtivo || janela !== 'todas'
                    ? 'Ajuste os filtros acima ou veja todas as avaliações.'
                    : 'Marque a primeira avaliação e os alunos que ativaram lembretes passam a ser avisados.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {visiveis.map(avaliacao => (
                  <li key={avaliacao._id}>
                    {editando === avaliacao._id ? (
                      <EditorAvaliacao
                        valor={avaliacao}
                        hoje={hoje}
                        existente
                        salvando={salvando === avaliacao._id}
                        onSalvar={async atualizada => {
                          const ok = await alterar(avaliacao._id!, atualizada)
                          if (ok) {
                            setEditando(null)
                            setAviso({ tom: 'ok', texto: 'Avaliação salva.' })
                          }
                        }}
                        onCancelar={() => setEditando(null)}
                        onApagar={() => apagar(avaliacao._id!, avaliacao.titulo)}
                      />
                    ) : (
                      <LinhaAvaliacao
                        avaliacao={avaliacao}
                        hoje={hoje}
                        ocupado={salvando === avaliacao._id}
                        onEditar={() => setEditando(avaliacao._id ?? null)}
                        onAlternarPublicada={publicada => alterar(avaliacao._id!, { publicada })}
                        onAlternarLembrete={ativo =>
                          alterar(avaliacao._id!, { lembrete: { ...avaliacao.lembrete, ativo } })
                        }
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <ImportarEmenta
            importadas={ementas}
            carregando={carregandoEmentas}
            onImportar={importarEmentas}
            onRemover={removerEmenta}
          />
        )}
      </div>
    </div>
  )
}

function Indicador({
  rotulo,
  valor,
  icone: Icone,
  destaque,
}: {
  rotulo: string
  valor: number
  icone?: typeof Bell
  destaque?: boolean
}) {
  return (
    <div className="glass-page-card rounded-xl px-3 py-2.5">
      <dt className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {Icone && <Icone className="h-3 w-3" aria-hidden />}
        {rotulo}
      </dt>
      <dd className={`text-xl font-bold tabular-nums ${destaque ? 'text-[#468152] dark:text-[#7DCEA0]' : 'text-foreground'}`}>
        {valor}
      </dd>
    </div>
  )
}

export default function PaginaAdminCronogramas() {
  return (
    <AppShell headerTitle="Cronogramas" headerSubtitle="Avaliações e lembretes">
      {/* `useSearchParams` (o atalho ?novo=AAAA-MM-DD) exige a fronteira de
          Suspense no App Router. */}
      <Suspense fallback={null}>
        <ConteudoAdminCronogramas />
      </Suspense>
    </AppShell>
  )
}
