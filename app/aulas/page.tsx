'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Layers,
  Search,
  Settings2,
  X,
} from 'lucide-react'
import { AppShell, useAppShell } from '@/components/app-shell'
import {
  CardDeAula,
  ContinueEstudando,
  EsqueletoDeCards,
  CardDeCurso,
  EstadoVazio,
  ResumoDoCurso,
  Trilho,
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

interface Topico {
  _id: string
  setorId: string
  nome: string
  ordem: number
}

interface Subtopico {
  _id: string
  setorId: string
  topicoId: string
  nome: string
  ordem: number
}

interface Modulo {
  _id: string
  setorId: string
  topicoId?: string
  subtopicoId?: string
  nome: string
  ordem: number
}

interface Submodulo {
  _id: string
  moduloId: string
  nome: string
  ordem: number
}

/**
 * Um nível da árvore do curso, com as aulas que penduram nele.
 *
 * A primeira versão desta tela agrupava só por módulo e jogava tópico,
 * subtópico e submódulo no mesmo balaio — ou seja, descartava a organização que
 * o admin tinha montado. Aqui a árvore é preservada inteira, e os níveis vazios
 * simplesmente não são desenhados.
 */
interface Ramo {
  id: string
  nome: string
  nivel: number
  aulas: Aula[]
  filhos: Ramo[]
}

interface Aula extends AulaNaBiblioteca {
  setorId?: string
  topicoId?: string
  subtopicoId?: string
  moduloId?: string
  submoduloId?: string
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
  const [topicos, setTopicos] = useState<Topico[]>([])
  const [subtopicos, setSubtopicos] = useState<Subtopico[]>([])
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [submodulos, setSubmodulos] = useState<Submodulo[]>([])
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
          const id = (x: any) => ({ ...x, _id: String(x._id) })
          setSetores((arvore.setores || []).map(id))
          setTopicos((arvore.topicos || []).map(id))
          setSubtopicos((arvore.subtopicos || []).map(id))
          setModulos((arvore.modulos || []).map(id))
          setSubmodulos((arvore.submodulos || []).map(id))
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

  /**
   * Monta a árvore do curso preservando os níveis que existem.
   *
   * Tópico → Subtópico → Módulo → Submódulo. Cada aula pendura no nível mais
   * fundo que ela declara, e níveis sem conteúdo são podados na renderização —
   * é o que permite um curso simples (só módulos) e um complexo (com seções e
   * subtópicos) usarem a mesma tela sem parecer a mesma bagunça.
   */
  const ramosDoCurso = useMemo<Ramo[]>(() => {
    if (!cursoAberto) return []

    const porOrdem = <T extends { ordem: number }>(a: T, b: T) => (a.ordem || 0) - (b.ordem || 0)
    const aulasDe = (chave: keyof Aula, valor: string, exigirVazios: Array<keyof Aula> = []) =>
      aulasFiltradas
        .filter((a) => String(a[chave] || '') === valor && exigirVazios.every((c) => !a[c]))
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))

    const ramoDoSubmodulo = (sm: Submodulo): Ramo => ({
      id: sm._id, nome: sm.nome, nivel: 4,
      aulas: aulasDe('submoduloId', sm._id),
      filhos: [],
    })

    const ramoDoModulo = (m: Modulo): Ramo => ({
      id: m._id, nome: m.nome, nivel: 3,
      aulas: aulasDe('moduloId', m._id, ['submoduloId']),
      filhos: submodulos.filter((sm) => sm.moduloId === m._id).sort(porOrdem).map(ramoDoSubmodulo),
    })

    const ramoDoSubtopico = (st: Subtopico): Ramo => ({
      id: st._id, nome: st.nome, nivel: 2,
      aulas: aulasDe('subtopicoId', st._id, ['moduloId']),
      filhos: modulos.filter((m) => m.subtopicoId === st._id).sort(porOrdem).map(ramoDoModulo),
    })

    const ramoDoTopico = (t: Topico): Ramo => ({
      id: t._id, nome: t.nome, nivel: 1,
      aulas: aulasDe('topicoId', t._id, ['subtopicoId', 'moduloId']),
      filhos: [
        ...subtopicos.filter((st) => st.topicoId === t._id).sort(porOrdem).map(ramoDoSubtopico),
        ...modulos
          .filter((m) => m.topicoId === t._id && !m.subtopicoId)
          .sort(porOrdem)
          .map(ramoDoModulo),
      ],
    })

    return [
      ...topicos.filter((t) => t.setorId === cursoAberto).sort(porOrdem).map(ramoDoTopico),
      // Módulos pendurados direto no curso, sem tópico — o caso simples.
      ...modulos
        .filter((m) => m.setorId === cursoAberto && !m.topicoId && !m.subtopicoId)
        .sort(porOrdem)
        .map(ramoDoModulo),
      // Aulas soltas no curso, sem nível nenhum.
      ...(() => {
        const soltas = aulasFiltradas.filter(
          (a) => !a.topicoId && !a.subtopicoId && !a.moduloId && !a.submoduloId,
        )
        return soltas.length > 0
          ? [{ id: '__soltas__', nome: 'Aulas do curso', nivel: 1, aulas: soltas, filhos: [] }]
          : []
      })(),
    ]
  }, [aulasFiltradas, cursoAberto, modulos, submodulos, subtopicos, topicos])

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
        <CursoAberto ramos={ramosDoCurso} progresso={progressoPorCurso.get(curso._id)} />
      ) : setores.length > 0 ? (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold tracking-tight">
            <GraduationCap className="h-5 w-5 text-primary" />
            Seus cursos
          </h2>
          <Trilho>
            {setores.map((setor) => (
              <CardDeCurso
                key={setor._id}
                curso={setor}
                progresso={progressoPorCurso.get(setor._id)}
                onAbrir={() => abrirCurso(setor._id)}
              />
            ))}
          </Trilho>
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

/** Um ramo só vale desenhar se ele (ou algum filho) tem aula. */
function temConteudo(ramo: Ramo): boolean {
  return ramo.aulas.length > 0 || ramo.filhos.some(temConteudo)
}

function contarAulas(ramo: Ramo): { total: number; concluidas: number } {
  const soma = {
    total: ramo.aulas.length,
    concluidas: ramo.aulas.filter((a) => a.progresso?.concluida).length,
  }
  for (const filho of ramo.filhos) {
    const f = contarAulas(filho)
    soma.total += f.total
    soma.concluidas += f.concluidas
  }
  return soma
}

/**
 * Um curso aberto.
 *
 * A primeira versão empilhava TODOS os níveis verticalmente: tópico, subtópico,
 * módulo e submódulo viravam uma sequência de títulos e trilhos que descia sem
 * fim. A hierarquia existia no código e no tamanho da fonte, mas na tela era
 * uma coluna só — impossível saber onde um assunto acaba e o outro começa, e
 * pior no celular, onde cada nível empurra o resto para fora da tela.
 *
 * Duas mudanças resolvem isso:
 *
 *  1. **Tópicos viram abas.** Só um assunto por vez, então a página tem fim.
 *     As abas deslizam, e o aluno troca de assunto sem rolar.
 *  2. **Os níveis abaixo ganham contenção visual.** Subtópico vira um bloco
 *     com borda e fundo próprios; os módulos moram dentro dele. Dá para VER o
 *     agrupamento, em vez de deduzi-lo pelo tamanho do título.
 */
function CursoAberto({
  ramos,
  progresso,
}: {
  ramos: Ramo[]
  progresso?: { total: number; concluidas: number }
}) {
  const comConteudo = useMemo(() => ramos.filter(temConteudo), [ramos])
  const [abaAtiva, setAbaAtiva] = useState<string | null>(null)

  // A aba escolhida some quando a busca muda os ramos; voltar para a primeira
  // é melhor do que mostrar uma tela vazia sem explicação.
  const aba = comConteudo.find((r) => r.id === abaAtiva) || comConteudo[0]

  if (comConteudo.length === 0) {
    return (
      <EstadoVazio
        icone={Layers}
        titulo="Nenhuma aula por aqui ainda"
        descricao="Assim que as aulas deste curso forem liberadas, elas aparecem organizadas por módulo."
        acaoLabel="Ver outros cursos"
        acaoHref="/aulas"
      />
    )
  }

  return (
    <div className="space-y-5">
      {progresso && progresso.total > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <ResumoDoCurso concluidas={progresso.concluidas} total={progresso.total} />
        </div>
      ) : null}

      {/* Abas dos tópicos — só aparecem quando há mais de um assunto. */}
      {comConteudo.length > 1 ? (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          {comConteudo.map((r) => {
            const { total, concluidas } = contarAulas(r)
            const ativa = r.id === aba?.id
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setAbaAtiva(r.id)}
                aria-pressed={ativa}
                className={cn(
                  'inline-flex flex-none items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                  ativa
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {r.nome}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                    ativa ? 'bg-primary-foreground/20' : 'bg-muted',
                  )}
                >
                  {concluidas}/{total}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      {aba ? <ConteudoDoRamo ramo={aba} /> : null}
    </div>
  )
}

/**
 * O conteúdo de um tópico: aulas soltas primeiro, depois os blocos filhos.
 *
 * Cada filho com netos (subtópico contendo módulos) vira um bloco cercado; um
 * filho folha (módulo com aulas) vira só um trilho rotulado. Assim a moldura
 * aparece onde ela informa algo — agrupar — e não em volta de cada linha.
 */
function ConteudoDoRamo({ ramo }: { ramo: Ramo }) {
  const filhos = ramo.filhos.filter(temConteudo)

  return (
    <div className="space-y-5">
      {ramo.aulas.length > 0 ? (
        <Trilho>
          {ramo.aulas.map((aula) => (
            <CardDeAula key={aula._id} aula={aula} noTrilho />
          ))}
        </Trilho>
      ) : null}

      {filhos.map((filho) =>
        filho.filhos.some(temConteudo) ? (
          <BlocoAgrupador key={filho.id} ramo={filho} />
        ) : (
          <TrilhoRotulado key={filho.id} ramo={filho} />
        ),
      )}
    </div>
  )
}

/** Subtópico (ou módulo com submódulos): bloco cercado que agrupa os filhos. */
function BlocoAgrupador({ ramo }: { ramo: Ramo }) {
  const [aberto, setAberto] = useState(true)
  const { total, concluidas } = contarAulas(ramo)
  const filhos = ramo.filhos.filter(temConteudo)

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-muted/20">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ChevronRight
            className={cn('h-4 w-4 flex-none text-muted-foreground transition-transform', aberto && 'rotate-90')}
          />
          <span className="truncate font-bold">{ramo.nome}</span>
        </span>
        <span className="flex-none text-xs text-muted-foreground">
          {concluidas}/{total}
        </span>
      </button>

      {aberto ? (
        <div className="space-y-4 border-t border-border px-4 py-4">
          {ramo.aulas.length > 0 ? (
            <Trilho>
              {ramo.aulas.map((aula) => (
                <CardDeAula key={aula._id} aula={aula} noTrilho />
              ))}
            </Trilho>
          ) : null}

          {filhos.map((filho) =>
            filho.filhos.some(temConteudo) ? (
              <BlocoAgrupador key={filho.id} ramo={filho} />
            ) : (
              <TrilhoRotulado key={filho.id} ramo={filho} />
            ),
          )}
        </div>
      ) : null}
    </section>
  )
}

/** Módulo folha: rótulo, progresso e o trilho de aulas. */
function TrilhoRotulado({ ramo }: { ramo: Ramo }) {
  const { total, concluidas } = contarAulas(ramo)

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="flex items-center gap-1.5 text-sm font-bold">
          <Layers className="h-3.5 w-3.5 text-primary" />
          {ramo.nome}
        </h3>
        <span className="text-xs text-muted-foreground">
          {concluidas}/{total}
        </span>
      </div>
      <Trilho>
        {ramo.aulas.map((aula) => (
          <CardDeAula key={aula._id} aula={aula} noTrilho />
        ))}
      </Trilho>
    </section>
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
