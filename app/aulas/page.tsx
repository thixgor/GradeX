'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Layers,
  Search,
  Settings2,
  X,
} from 'lucide-react'
import { AppShell, useAppShell } from '@/components/app-shell'
import {
  BarraDeProgresso,
  CardDeAula,
  ContinueEstudando,
  EsqueletoDeCards,
  EstadoVazio,
  ResumoDoCurso,
  type AulaNaBiblioteca,
  type ItemDeRetomada,
} from '@/components/aulas/biblioteca'
import { cn } from '@/lib/utils'

/**
 * Biblioteca de aulas (§1, §7, §23, §24, §25, §35, §43).
 *
 * A versão anterior era uma navegação em cascata de cinco níveis: setor →
 * tópico → subtópico → módulo → submódulo → aula. Para chegar a um vídeo o
 * aluno precisava acertar cinco cliques, e nada na tela dizia onde ele tinha
 * parado, o que já tinha visto ou o que estava bloqueado. Era um explorador de
 * pastas, não um lugar de estudar.
 *
 * Aqui a tela responde, em ordem, as três perguntas de quem abre a plataforma:
 *
 *   1. "onde eu parei?" — a faixa de retomada vem primeiro, antes de tudo;
 *   2. "o que eu tenho?" — cursos com progresso real, não só nomes;
 *   3. "onde está aquela aula?" — busca e filtros que atravessam a hierarquia
 *      inteira, sem obrigar a descer nível por nível.
 *
 * A hierarquia não sumiu: ela continua organizando o conteúdo dentro do curso.
 * O que mudou é que ela deixou de ser o único caminho.
 */

type Filtro = 'todas' | 'andamento' | 'nao-iniciadas' | 'concluidas' | 'disponiveis' | 'bloqueadas'

const FILTROS: Array<{ id: Filtro; label: string }> = [
  { id: 'todas', label: 'Todas' },
  { id: 'andamento', label: 'Em andamento' },
  { id: 'nao-iniciadas', label: 'Não iniciadas' },
  { id: 'concluidas', label: 'Concluídas' },
  { id: 'disponiveis', label: 'Disponíveis para mim' },
  { id: 'bloqueadas', label: 'Bloqueadas' },
]

interface Setor {
  _id: string
  nome: string
  descricao?: string
  imagem?: string
  ordem: number
}

interface Modulo {
  _id: string
  setorId: string
  nome: string
  ordem: number
}

interface Aula extends AulaNaBiblioteca {
  setorId?: string
  moduloId?: string
  ordem?: number
}

/** Normaliza para busca: sem acento e sem caixa. */
function paraBusca(texto: string): string {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function AulasPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAdmin } = useAppShell()
  const podeGerenciar = isAdmin || user?.secondaryRole === 'monitor'

  const [carregando, setCarregando] = useState(true)
  const [setores, setSetores] = useState<Setor[]>([])
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [retomada, setRetomada] = useState<ItemDeRetomada[]>([])

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const cursoAberto = searchParams.get('curso')

  useEffect(() => {
    let cancelado = false

    // As duas chamadas partem juntas: a retomada é o topo da tela e não pode
    // esperar a árvore inteira chegar para aparecer.
    Promise.all([
      fetch('/api/aulas', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/aulas/continuar', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { itens: [] })),
    ])
      .then(([arvore, continuar]) => {
        if (cancelado) return
        if (arvore) {
          setSetores((arvore.setores || []).map((s: any) => ({ ...s, _id: String(s._id) })))
          setModulos((arvore.modulos || []).map((m: any) => ({ ...m, _id: String(m._id) })))
          setAulas((arvore.aulas || []).map((a: any) => ({ ...a, _id: String(a._id) })))
        }
        setRetomada(continuar?.itens || [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [])

  /** Progresso agregado por curso — alimenta o card e a barra do cabeçalho. */
  const progressoPorCurso = useMemo(() => {
    const mapa = new Map<string, { total: number; concluidas: number }>()
    for (const aula of aulas) {
      if (!aula.setorId) continue
      const atual = mapa.get(aula.setorId) || { total: 0, concluidas: 0 }
      atual.total += 1
      if (aula.progresso?.concluida) atual.concluidas += 1
      mapa.set(aula.setorId, atual)
    }
    return mapa
  }, [aulas])

  const buscando = busca.trim().length >= 2
  const filtrando = filtro !== 'todas'

  const aulasFiltradas = useMemo(() => {
    const termo = paraBusca(busca.trim())
    const nomeDoCurso = new Map(setores.map((s) => [s._id, paraBusca(s.nome)]))
    const nomeDoModulo = new Map(modulos.map((m) => [m._id, paraBusca(m.nome)]))

    return aulas.filter((aula) => {
      if (cursoAberto && aula.setorId !== cursoAberto) return false

      if (termo.length >= 2) {
        // A busca atravessa a hierarquia: o aluno lembra "aquela aula de
        // arritmia", não em que subtópico ela foi arquivada.
        const alvo = [
          paraBusca(aula.titulo),
          paraBusca(aula.descricao || ''),
          aula.setorId ? nomeDoCurso.get(aula.setorId) || '' : '',
          aula.moduloId ? nomeDoModulo.get(aula.moduloId) || '' : '',
        ].join(' ')
        if (!alvo.includes(termo)) return false
      }

      const p = aula.progresso
      const liberada = aula.acesso ? aula.acesso.liberado : true
      switch (filtro) {
        case 'andamento':
          return !!p && p.percentual > 0 && !p.concluida
        case 'nao-iniciadas':
          return !p || p.percentual === 0
        case 'concluidas':
          return !!p?.concluida
        case 'disponiveis':
          return liberada
        case 'bloqueadas':
          return !liberada
        default:
          return true
      }
    })
  }, [aulas, busca, cursoAberto, filtro, modulos, setores])

  /** Dentro de um curso, as aulas continuam agrupadas por módulo. */
  const aulasPorModulo = useMemo(() => {
    const grupos = new Map<string, Aula[]>()
    for (const aula of aulasFiltradas) {
      const chave = aula.moduloId || '__sem_modulo__'
      const atual = grupos.get(chave) || []
      atual.push(aula)
      grupos.set(chave, atual)
    }
    for (const lista of grupos.values()) {
      lista.sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
    }
    return grupos
  }, [aulasFiltradas])

  const curso = cursoAberto ? setores.find((s) => s._id === cursoAberto) : null
  const modulosDoCurso = cursoAberto
    ? modulos.filter((m) => m.setorId === cursoAberto).sort((a, b) => a.ordem - b.ordem)
    : []

  function abrirCurso(id: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (id) params.set('curso', id)
    else params.delete('curso')
    router.push(`/aulas${params.toString() ? `?${params}` : ''}`, { scroll: true })
  }

  function limparFiltros() {
    setBusca('')
    setFiltro('todas')
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {curso ? (
            <button
              type="button"
              onClick={() => abrirCurso(null)}
              className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Todos os cursos
            </button>
          ) : null}
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {curso ? curso.nome : 'Aulas'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {curso
              ? curso.descricao || 'Continue de onde parou ou escolha um módulo abaixo.'
              : 'Sua central de aprendizado — cursos, progresso e onde você parou.'}
          </p>
        </div>

        {podeGerenciar ? (
          <Link
            href="/aulas/gerenciar"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold transition hover:bg-muted"
          >
            <Settings2 className="h-4 w-4" /> Gerenciar
          </Link>
        ) : null}
      </header>

      {/* ── Continue estudando ────────────────────────────────────────── */}
      {!carregando && !buscando && !filtrando && !curso ? (
        <ContinueEstudando itens={retomada} />
      ) : null}

      {/* ── Busca e filtros ───────────────────────────────────────────── */}
      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={curso ? 'Pesquisar neste curso...' : 'Pesquisar aula, curso ou assunto...'}
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
          {busca ? (
            <button
              type="button"
              onClick={() => setBusca('')}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              aria-pressed={filtro === f.id}
              className={cn(
                'inline-flex h-8 flex-shrink-0 items-center rounded-full border px-3 text-xs font-semibold transition',
                filtro === f.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Conteúdo ──────────────────────────────────────────────────── */}
      {carregando ? (
        <EsqueletoDeCards />
      ) : buscando || filtrando ? (
        aulasFiltradas.length > 0 ? (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {aulasFiltradas.length} {aulasFiltradas.length === 1 ? 'aula encontrada' : 'aulas encontradas'}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {aulasFiltradas.map((aula) => (
                <CardDeAula key={aula._id} aula={aula} />
              ))}
            </div>
          </section>
        ) : (
          <EstadoVazio
            icone={Search}
            titulo="Nada encontrado com esses critérios"
            descricao="Tente outra palavra ou remova os filtros para ver tudo que está disponível para você."
            acaoLabel="Limpar filtros"
            onAcao={limparFiltros}
          />
        )
      ) : curso ? (
        <CursoAberto
          modulos={modulosDoCurso}
          aulasPorModulo={aulasPorModulo}
          progresso={progressoPorCurso.get(curso._id)}
        />
      ) : setores.length > 0 ? (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold tracking-tight">
            <GraduationCap className="h-5 w-5 text-primary" />
            Seus cursos
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {setores.map((setor) => {
              const p = progressoPorCurso.get(setor._id)
              return (
                <button
                  key={setor._id}
                  type="button"
                  onClick={() => abrirCurso(setor._id)}
                  className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-semibold leading-snug">{setor.nome}</p>
                      {setor.descricao ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {setor.descricao}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {p && p.total > 0 ? (
                    <ResumoDoCurso concluidas={p.concluidas} total={p.total} />
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhuma aula publicada ainda.</p>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      ) : (
        <EstadoVazio
          icone={GraduationCap}
          titulo="Sua biblioteca ainda está vazia"
          descricao="Assim que houver cursos liberados para a sua conta, eles aparecem aqui com o seu progresso."
          acaoLabel="Conhecer os planos"
          acaoHref="/buy"
        />
      )}
    </div>
  )
}

/** Um curso aberto: módulos na ordem, com o progresso de cada um. */
function CursoAberto({
  modulos,
  aulasPorModulo,
  progresso,
}: {
  modulos: Modulo[]
  aulasPorModulo: Map<string, Aula[]>
  progresso?: { total: number; concluidas: number }
}) {
  const semModulo = aulasPorModulo.get('__sem_modulo__') || []
  const temAlgo = modulos.some((m) => (aulasPorModulo.get(m._id) || []).length > 0) || semModulo.length > 0

  if (!temAlgo) {
    return (
      <EstadoVazio
        icone={Layers}
        titulo="Este curso ainda não tem aulas publicadas"
        descricao="Assim que as primeiras aulas forem liberadas, elas aparecem aqui na ordem do curso."
        acaoLabel="Ver outros cursos"
        acaoHref="/aulas"
      />
    )
  }

  return (
    <div className="space-y-8">
      {progresso && progresso.total > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <ResumoDoCurso concluidas={progresso.concluidas} total={progresso.total} />
        </div>
      ) : null}

      {modulos.map((modulo) => {
        const lista = aulasPorModulo.get(modulo._id) || []
        if (lista.length === 0) return null
        const concluidas = lista.filter((a) => a.progresso?.concluida).length
        return (
          <section key={modulo._id}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold tracking-tight">
                <Layers className="h-4 w-4 text-primary" />
                {modulo.nome}
              </h2>
              <span className="text-xs text-muted-foreground">
                {concluidas}/{lista.length} concluídas
              </span>
            </div>
            <BarraDeProgresso
              percentual={lista.length ? (concluidas / lista.length) * 100 : 0}
              concluida={concluidas === lista.length}
              className="mb-3"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lista.map((aula) => (
                <CardDeAula key={aula._id} aula={aula} />
              ))}
            </div>
          </section>
        )
      })}

      {semModulo.length > 0 ? (
        <section>
          <h2 className="mb-3 text-base font-bold tracking-tight">Outras aulas</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {semModulo.map((aula) => (
              <CardDeAula key={aula._id} aula={aula} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

export default function AulasPage() {
  return (
    <AppShell headerTitle="Aulas" headerSubtitle="Sua central de aprendizado">
      <Suspense
        fallback={
          <div className="container mx-auto max-w-7xl px-4 py-8">
            <EsqueletoDeCards />
          </div>
        }
      >
        <AulasPageContent />
      </Suspense>
    </AppShell>
  )
}
