'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bookmark, Eye, EyeOff, Route, Search, X } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { RESPIRO_DA_DOCA, RESPIRO_DO_TOPO } from '@/components/ensino/doca'
import {
  AcaoDeCartao,
  CartaoDeTrilha,
  EstadoVazio,
  EsqueletoDeFaixa,
  Grade,
  type TrilhaNaTela,
} from '@/components/ensino/primitivos'
import { gerarSlug } from '@/lib/ensino/taxonomia'
import { cn } from '@/lib/utils'

/**
 * Todas as Trilhas (§1).
 *
 * ══ POR QUE ESTA TELA DEIXOU DE SER UMA GRADE ══════════════════════════
 *
 * Ela era trinta cartões em ordem de publicação com cinco filtros de estado em
 * cima. Os filtros respondem "o que eu comecei?" e "o que dá para fazer do
 * zero?" — perguntas reais, mas nenhuma delas é a que trouxe a pessoa aqui.
 * Quem abre "todas as Trilhas" quase sempre quer UMA, e sabe mais ou menos
 * qual: a de Cardiologia, a de Farmacologia. Sem assunto e sem busca, achá-la
 * significava ler os trinta títulos ("tá difícil de achar todas as trilhas").
 *
 * Agora a tela tem as três coisas que uma vitrine precisa ter:
 *
 *  • **busca por texto**, que é o caminho mais curto para quem já sabe o nome;
 *  • **agrupamento por assunto**, que é o caminho de quem está garimpando —
 *    e ele não exige que ninguém classifique Trilha nenhuma: o assunto é
 *    deduzido das aulas que a Trilha reúne (lib/ensino/agrupamento-trilhas.ts);
 *  • **os filtros de estado**, que continuam, porque "o que eu comecei" segue
 *    sendo uma pergunta legítima — só não é a primeira.
 *
 * ══ FAVORITAR E OCULTAR SÃO DO ALUNO ═══════════════════════════════════
 *
 * Favoritar puxa a Trilha para o topo da vitrine dele; ocultar tira da frente
 * o que ele já decidiu que não vai fazer. Nenhum dos dois toca o catálogo —
 * são marcadores por pessoa (`ensino_trilha_estado`), e a tela sempre oferece
 * rever as ocultas. Ocultar que não dá para desfazer é exclusão com outro
 * nome.
 */

type Filtro = 'todas' | 'favoritas' | 'em-curso' | 'nao-iniciadas' | 'concluidas' | 'iniciante'

const FILTROS: Array<{ id: Filtro; rotulo: string }> = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'favoritas', rotulo: 'Favoritas' },
  { id: 'em-curso', rotulo: 'Em andamento' },
  { id: 'nao-iniciadas', rotulo: 'Não iniciadas' },
  { id: 'concluidas', rotulo: 'Concluídas' },
  { id: 'iniciante', rotulo: 'Do zero' },
]

/** O grupo das Trilhas cujo assunto não dá para deduzir. Sempre por último. */
const SEM_ASSUNTO = '__sem-assunto__'

export default function TrilhasPage() {
  return (
    <AppShell headerTitle="Trilhas de Ensino" headerSubtitle="Caminhos organizados de estudo" comercio={false} vidro>
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const [trilhas, setTrilhas] = useState<TrilhaNaTela[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [termo, setTermo] = useState('')
  const [mostrarOcultas, setMostrarOcultas] = useState(false)

  useEffect(() => {
    let cancelado = false
    fetch('/api/ensino/trilhas', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelado && d?.trilhas) setTrilhas(d.trilhas)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  /**
   * Favoritar/ocultar com troca otimista.
   *
   * São gestos de baixo custo e alta frequência: esperar a rede para pintar o
   * marcador faria a tela parecer travada num toque que deveria ser
   * instantâneo. Se o servidor recusar, o estado volta.
   */
  const marcar = useCallback(
    async (trilha: TrilhaNaTela, acao: 'favoritar' | 'ocultar', valor: boolean) => {
      const campo = acao === 'favoritar' ? 'favorita' : 'oculta'
      const aplicar = (v: boolean) =>
        setTrilhas((atual) => atual.map((t) => (t._id === trilha._id ? { ...t, [campo]: v } : t)))

      aplicar(valor)
      try {
        const resposta = await fetch(`/api/ensino/trilhas/${encodeURIComponent(trilha.slug)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acao, valor }),
        })
        if (!resposta.ok) throw new Error()
      } catch {
        aplicar(!valor)
      }
    },
    [],
  )

  const ocultas = useMemo(() => trilhas.filter((t) => t.oculta), [trilhas])

  /** Estado + texto. O agrupamento vem depois, sobre o que sobrou. */
  const visiveis = useMemo(() => {
    const busca = gerarSlug(termo)

    return trilhas.filter((trilha) => {
      // Ocultas só aparecem quando a pessoa pede para revê-las — e aí aparecem
      // SÓ elas, para a lista deixar claro do que se trata.
      if (mostrarOcultas !== Boolean(trilha.oculta)) return false

      if (busca) {
        const alvo = gerarSlug(
          [trilha.titulo, trilha.subtitulo, trilha.assunto?.nome].filter(Boolean).join(' '),
        )
        if (!alvo.includes(busca)) return false
      }

      const p = trilha.progresso
      switch (filtro) {
        case 'favoritas':
          return trilha.favorita === true
        case 'em-curso':
          return Boolean(p?.iniciada) && !p?.concluida
        case 'nao-iniciadas':
          return !p?.iniciada
        case 'concluidas':
          return p?.concluida === true
        case 'iniciante':
          return trilha.nivel === 'iniciante'
        default:
          return true
      }
    })
  }, [trilhas, filtro, termo, mostrarOcultas])

  /**
   * As Trilhas em grupos de assunto.
   *
   * Favoritas saem para um grupo próprio no topo: elas são a estante pessoal, e
   * espalhá-las pelos assuntos faria o gesto de favoritar não mudar nada na
   * tela onde ele foi feito.
   */
  const grupos = useMemo(() => {
    const favoritas = visiveis.filter((t) => t.favorita)
    const resto = visiveis.filter((t) => !t.favorita)

    const porAssunto = new Map<string, { nome: string; trilhas: TrilhaNaTela[] }>()
    for (const trilha of resto) {
      const chave = trilha.assunto?.id || SEM_ASSUNTO
      const nome = trilha.assunto?.nome || 'Outras Trilhas'
      const grupo = porAssunto.get(chave) || { nome, trilhas: [] }
      grupo.trilhas.push(trilha)
      porAssunto.set(chave, grupo)
    }

    const ordenados = Array.from(porAssunto.entries())
      .map(([id, grupo]) => ({ id, ...grupo }))
      .sort((a, b) => {
        // "Outras" por último sempre: é o balde do que não deu para classificar,
        // e ele não deve abrir a página nem quando é o maior grupo.
        if (a.id === SEM_ASSUNTO) return 1
        if (b.id === SEM_ASSUNTO) return -1
        // Depois, o assunto com mais Trilhas primeiro — é onde há mais o que
        // escolher. Empate resolvido pelo nome, para a ordem não dançar entre
        // duas visitas.
        if (b.trilhas.length !== a.trilhas.length) return b.trilhas.length - a.trilhas.length
        return a.nome.localeCompare(b.nome, 'pt-BR')
      })

    return favoritas.length > 0
      ? [{ id: '__favoritas__', nome: 'Suas favoritas', trilhas: favoritas }, ...ordenados]
      : ordenados
  }, [visiveis])

  const limpar = () => {
    setTermo('')
    setFiltro('todas')
  }

  return (
    <div className={`container mx-auto max-w-7xl px-4 ${RESPIRO_DO_TOPO} ${RESPIRO_DA_DOCA}`}>
      <header className="mb-4">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
          Trilhas de Ensino
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Cada Trilha reúne aulas de vários assuntos numa sequência que leva do que você precisa
          saber primeiro até dominar o tema.
        </p>
      </header>

      {/* ══ Busca ═══════════════════════════════════════════════════════
          Primeiro controle da tela, antes dos filtros: quem sabe o nome da
          Trilha não deveria precisar passar por filtro nenhum. */}
      <div className="campo-vidro mb-3 flex h-12 items-center gap-3 rounded-2xl px-4">
        <Search className="h-[1.15rem] w-[1.15rem] flex-none text-muted-foreground" />
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar Trilha por nome ou assunto"
          aria-label="Buscar Trilha"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {termo ? (
          <button
            type="button"
            onClick={() => setTermo('')}
            aria-label="Limpar busca"
            className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            aria-pressed={filtro === f.id}
            className={cn(
              'inline-flex h-10 flex-none items-center rounded-full px-4 text-sm font-semibold transition',
              filtro === f.id
                ? 'bg-primary text-primary-foreground shadow-[0_6px_18px_-8px_hsl(var(--primary))]'
                : 'vidro-sutil vidro-toque text-muted-foreground hover:text-foreground',
            )}
          >
            {f.rotulo}
          </button>
        ))}
      </div>

      {mostrarOcultas ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
          <EyeOff className="h-5 w-5 flex-none text-muted-foreground" />
          <p className="min-w-0 flex-1 text-sm">
            Você está vendo as Trilhas que escolheu ocultar. Elas não aparecem na vitrine nem na
            tela inicial.
          </p>
          <button
            type="button"
            onClick={() => setMostrarOcultas(false)}
            className="inline-flex h-9 flex-none items-center rounded-full bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Voltar à vitrine
          </button>
        </div>
      ) : null}

      {carregando ? (
        <EsqueletoDeFaixa quantidade={6} />
      ) : visiveis.length === 0 ? (
        <EstadoVazio
          icone={mostrarOcultas ? EyeOff : Route}
          titulo={
            mostrarOcultas
              ? 'Nenhuma Trilha oculta'
              : trilhas.length === 0
                ? 'Ainda não há Trilhas publicadas'
                : termo
                  ? `Nada encontrado para "${termo}"`
                  : 'Nada com esse filtro'
          }
          descricao={
            mostrarOcultas
              ? 'Você não escondeu nenhuma Trilha até agora.'
              : trilhas.length === 0
                ? 'As Trilhas aparecem aqui assim que forem publicadas — cada uma com o seu progresso.'
                : 'Tente outro termo ou volte para todas as Trilhas.'
          }
          acaoLabel={mostrarOcultas ? 'Voltar à vitrine' : trilhas.length === 0 ? undefined : 'Ver todas'}
          onAcao={mostrarOcultas ? () => setMostrarOcultas(false) : limpar}
        />
      ) : (
        <div className="space-y-9">
          {grupos.map((grupo) => (
            <section key={grupo.id}>
              <div className="mb-3 flex items-baseline gap-2">
                <h2 className="min-w-0 truncate font-heading text-lg font-extrabold tracking-tight sm:text-xl">
                  {grupo.nome}
                </h2>
                <span className="flex-none text-sm font-semibold tabular-nums text-muted-foreground">
                  {grupo.trilhas.length}
                </span>
              </div>

              <Grade className="lg:grid-cols-3 xl:grid-cols-4">
                {grupo.trilhas.map((trilha) => (
                  <CartaoDeTrilha
                    key={trilha._id}
                    trilha={trilha}
                    formato="largo"
                    acoes={
                      <>
                        <AcaoDeCartao
                          titulo={trilha.favorita ? 'Remover dos favoritos' : 'Favoritar Trilha'}
                          ativo={trilha.favorita}
                          aoClicar={() => marcar(trilha, 'favoritar', !trilha.favorita)}
                        >
                          <Bookmark
                            className="h-4 w-4"
                            fill={trilha.favorita ? 'currentColor' : 'none'}
                          />
                        </AcaoDeCartao>
                        <AcaoDeCartao
                          titulo={trilha.oculta ? 'Voltar a mostrar' : 'Ocultar esta Trilha'}
                          aoClicar={() => marcar(trilha, 'ocultar', !trilha.oculta)}
                        >
                          {trilha.oculta ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </AcaoDeCartao>
                      </>
                    }
                  />
                ))}
              </Grade>
            </section>
          ))}
        </div>
      )}

      {/* A porta de volta das ocultas. Discreta e sempre presente quando há o
          que rever — sem ela, ocultar seria irreversível na prática. */}
      {!mostrarOcultas && ocultas.length > 0 ? (
        <button
          type="button"
          onClick={() => setMostrarOcultas(true)}
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <EyeOff className="h-4 w-4" />
          Ver {ocultas.length} {ocultas.length === 1 ? 'Trilha oculta' : 'Trilhas ocultas'}
        </button>
      ) : null}
    </div>
  )
}
