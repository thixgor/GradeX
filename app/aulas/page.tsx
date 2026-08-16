'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  GraduationCap,
  History,
  Layers,
  Star,
  Search,
  Settings2,
  X,
} from 'lucide-react'
import { AppShell, useAppShell } from '@/components/app-shell'
import {
  CardDeAula,
  ContinueEstudando,
  ProvedorDeModo,
  ProvedorDeFavoritos,
  EsqueletoDeCards,
  CardDeCurso,
  EstadoVazio,
  ResumoDoCurso,
  Trilho,
  type AulaNaBiblioteca,
  type ItemDeRetomada,
} from '@/components/aulas/biblioteca'
import { EstanteDeAulas } from '@/components/aulas/estante'
import { useFavoritosDeAula } from '@/components/aulas/use-favoritos-aula'
import { FaixaModoAluno } from '@/components/aulas/faixa-modo-aluno'
import { comModo, lerModo, PARAMETRO_MODO } from '@/lib/aulas/modo-visualizacao'
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
  const favoritos = useFavoritosDeAula()
  const cursoAberto = searchParams.get('curso')
  const modo = lerModo(searchParams.get(PARAMETRO_MODO))

  useEffect(() => {
    let cancelado = false

    // As duas chamadas partem juntas: a retomada é o topo da tela e não pode
    // esperar a árvore inteira chegar para aparecer.
    Promise.all([
      fetch(comModo('/api/aulas', modo), { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
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
    // Trocar de modo recarrega a árvore: é a resposta do servidor que muda, não
    // a filtragem na tela — o cadeado do aluno é decidido lá.
  }, [modo])

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


  /**
   * Abrir um curso passou a ser navegar até a página dele (§18).
   *
   * Antes o curso abria embutido aqui, atrás de `?curso=`. Não dava para
   * mandar o link para alguém, e o botão voltar do navegador saía da biblioteca
   * inteira em vez de subir um nível.
   */
  function abrirCurso(id: string | null) {
    if (!id) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('curso')
      router.push(`/aulas${params.toString() ? `?${params}` : ''}`, { scroll: true })
      return
    }
    router.push(comModo(`/aulas/curso/${id}`, modo))
  }

  /*
   * Endereço antigo com `?curso=` continua funcionando.
   *
   * Ele está em favorito de navegador e em link colado em conversa; quebrá-lo
   * transformaria a melhoria numa perda para quem mais usava a biblioteca (§45).
   */
  useEffect(() => {
    if (cursoAberto) router.replace(comModo(`/aulas/curso/${cursoAberto}`, modo))
  }, [cursoAberto, modo, router])

  function limparFiltros() {
    setBusca('')
    setFiltro('todas')
  }

  return (
    <ProvedorDeModo modo={modo}>
      <ProvedorDeFavoritos controle={favoritos}>
      <FaixaModoAluno modo={modo} caminho="/aulas" />
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Aulas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua central de aprendizado — cursos, progresso e onde você parou.
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
      {!carregando && !buscando && !filtrando ? (
        <ContinueEstudando itens={retomada} />
      ) : null}

      {/* ── Busca e filtros ───────────────────────────────────────────── */}
      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar aula, curso ou assunto..." 
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

      {/* As duas estantes ficam DEPOIS dos cursos de propósito: quem abre a
          biblioteca quer estudar, não revisar o que já viu. Elas respondem
          "onde estava aquela aula?", que é a terceira pergunta, não a
          primeira (§21, §22). */}
      {!carregando && !buscando && !filtrando ? (
        <>
          <EstanteDeAulas
            titulo="Salvas para depois"
            vazio="Toque na estrela de qualquer aula para guardá-la aqui."
            rota="/api/aulas/historico?favoritos=1"
            icone={Star}
            recarregar={favoritos.ids.size}
          />
          <EstanteDeAulas
            titulo="Vistas recentemente"
            vazio="As aulas que você abrir aparecem aqui, na ordem em que foram vistas."
            rota="/api/aulas/historico"
            icone={History}
          />
        </>
      ) : null}
      </div>
      </ProvedorDeFavoritos>
    </ProvedorDeModo>
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
