'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Check,
  Compass,
  FileText,
  Layers,
  Lock,
  Play,
  Route,
  Search,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { RESPIRO_DA_DOCA, RESPIRO_DO_TOPO } from '@/components/ensino/doca'
import { Cascata, ItemDaCascata } from '@/components/ensino/duo'
import {
  CartaoDeAula,
  CartaoDeNo,
  EstadoVazio,
  Esqueleto,
  Grade,
  Migalha,
  Trilho,
  TituloDaFaixa,
  type AulaNaTela,
  type NoNaTela,
} from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * EXPLORAR — o acervo inteiro, e agora também a busca.
 *
 * ══ DOIS DESTINOS QUE ERAM A MESMA INTENÇÃO ══════════════════════════
 *
 * A área tinha "Buscar" e "Explorar" como lugares separados: um com um campo de
 * texto, o outro com uma árvore de pastas. Mas a pessoa que abre qualquer um
 * dos dois quer a mesma coisa — chegar num assunto — e a única diferença é se
 * ela sabe o nome dele. Obrigá-la a escolher o GESTO antes de saber o que
 * procura é uma decisão a mais, e uma decisão que ela erra metade das vezes.
 *
 * Aqui é um destino só. O campo fica no alto, sempre; enquanto está vazio, a
 * tela é o acervo ilustrado. Digitou duas letras, vira resultado. Apagou,
 * volta o acervo. `/aulas/buscar` continua existindo como rota — links salvos
 * e resultados compartilhados não podem quebrar —, mas ninguém precisa mais
 * saber que ela existe.
 *
 * ══ O FIM DA CASCATA DE CINCO CLIQUES ════════════════════════════════
 *
 * A navegação antiga era Ciclo → Módulo → Tópico → Subtópico → lista → aula, e
 * cada tela mostrava só nomes de pasta: para saber se valia entrar em "Sistema
 * Cardiovascular" era preciso entrar.
 *
 * A raiz agora ABRE a hierarquia em vez de escondê-la. Cada Módulo vira uma
 * faixa com os Tópicos de dentro dele já visíveis, com capa e contagem. Ou
 * seja: da raiz até a lista de aulas de um Tópico é UM toque, e até a aula são
 * dois. A hierarquia continua inteira no dado e na migalha — ela só deixou de
 * cobrar pedágio.
 *
 * Dentro de um nível, a tela mostra as três coisas ao mesmo tempo: onde você
 * está (migalha), o que existe abaixo (com capa) e as aulas daqui. Uma seção
 * com quatro aulas não exige mais dois cliques para revelar que tinha quatro
 * aulas.
 */

const ICONE_DO_TIPO: Record<string, LucideIcon> = {
  trilha: Route,
  aula: Play,
  resumo: Sparkles,
  pdf: FileText,
  flashcards: Layers,
  topico: Compass,
}

interface Resultado {
  id: string
  tipo: string
  titulo: string
  detalhe?: string
  href: string
  extra?: Record<string, any>
}

interface Grupo {
  tipo: string
  rotulo: string
  itens: Resultado[]
}

/**
 * O que o aluno pode ver na navegação.
 *
 * A rota da taxonomia é pública e devolve a árvore INTEIRA — inclusive nós
 * marcados como ocultos e nós ainda sem nenhuma aula, porque o painel de
 * gestão precisa dos dois. Agora que cada nível tem capa, mostrar um deles
 * aqui custa um cartão grande e ilustrado que leva a uma lista vazia. É a
 * mesma poda que a home já fazia no servidor (`podarVazios`).
 */
function visivelParaAluno(no: NoNaTela) {
  return !no.oculto && (no.aulasNaArvore ?? 0) > 0
}

export default function ExplorarPage() {
  return (
    <AppShell
      headerTitle="Explorar"
      headerSubtitle="Todo o conteúdo, por assunto"
      comercio={false}
      vidro
    >
      <Suspense
        fallback={
          <div className="container mx-auto max-w-6xl px-4 py-8">
            <Esqueleto className="h-40 w-full rounded-3xl" />
          </div>
        }
      >
        <Conteudo />
      </Suspense>
    </AppShell>
  )
}

function Conteudo() {
  const busca = useSearchParams()
  const router = useRouter()
  const noAtual = busca.get('no') || ''
  const termoDaUrl = busca.get('q') || ''

  const [arvore, setArvore] = useState<NoNaTela[]>([])
  const [aulas, setAulas] = useState<AulaNaTela[]>([])
  const [carregando, setCarregando] = useState(true)
  const [carregandoAulas, setCarregandoAulas] = useState(false)

  const [termo, setTermo] = useState(termoDaUrl)
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [totalDaBusca, setTotalDaBusca] = useState(0)
  const [buscando, setBuscando] = useState(false)

  const procurando = termo.trim().length >= 2

  useEffect(() => {
    let cancelado = false
    fetch('/api/ensino/taxonomia', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelado && d?.arvore) setArvore(d.arvore)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  useEffect(() => {
    if (!noAtual) {
      setAulas([])
      return
    }
    let cancelado = false
    setCarregandoAulas(true)
    fetch(`/api/ensino/catalogo?no=${encodeURIComponent(noAtual)}&limite=120`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelado && d?.aulas) setAulas(d.aulas)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregandoAulas(false)
      })
    return () => {
      cancelado = true
    }
  }, [noAtual])

  /*
   * A busca dispara sozinha, 280ms depois da última tecla.
   *
   * Obrigar a apertar Enter faz a tela parecer um formulário; disparar a cada
   * tecla faria uma requisição por letra de "insuficiência cardíaca". O atraso
   * é o que transforma as duas coisas numa só: quem digita rápido paga uma
   * requisição, quem para para pensar vê o resultado sem tocar em mais nada.
   */
  useEffect(() => {
    const limpo = termo.trim()
    if (limpo.length < 2) {
      setGrupos([])
      setTotalDaBusca(0)
      setBuscando(false)
      return
    }

    let cancelado = false
    setBuscando(true)

    const relogio = setTimeout(() => {
      fetch(`/api/ensino/busca?q=${encodeURIComponent(limpo)}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (cancelado || !d) return
          setGrupos(d.grupos || [])
          setTotalDaBusca(d.total || 0)
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelado) setBuscando(false)
        })
    }, 280)

    return () => {
      cancelado = true
      clearTimeout(relogio)
    }
  }, [termo])

  /** Acha o ramo aberto e o caminho até ele, dentro da árvore já carregada. */
  const { atual, caminho } = useMemo(() => {
    if (!noAtual) return { atual: null as NoNaTela | null, caminho: [] as NoNaTela[] }

    const procurar = (ramos: NoNaTela[], acumulado: NoNaTela[]): NoNaTela[] | null => {
      for (const ramo of ramos) {
        const caminhoAqui = [...acumulado, ramo]
        if (ramo._id === noAtual) return caminhoAqui
        const achado = procurar(ramo.filhos || [], caminhoAqui)
        if (achado) return achado
      }
      return null
    }

    const achado = procurar(arvore, [])
    return { atual: achado ? achado[achado.length - 1] : null, caminho: achado || [] }
  }, [arvore, noAtual])

  /**
   * Os Módulos da raiz, já com os Tópicos de dentro.
   *
   * É esta lista que faz a raiz do Explorar mostrar DOIS níveis de uma vez, e
   * é o que elimina o clique que só servia para revelar o clique seguinte.
   */
  const modulos = useMemo(() => {
    const saida: NoNaTela[] = []
    for (const area of arvore.filter(visivelParaAluno)) {
      const filhos = (area.filhos || []).filter(visivelParaAluno)
      // Uma Área com um Módulo só não merece um nível de navegação: sobe-se
      // direto para os Tópicos, senão a raiz teria um cartão único.
      if (filhos.length === 0) saida.push(area)
      else saida.push(...filhos)
    }
    return saida
  }, [arvore])

  const ramosVisiveis = atual ? (atual.filhos || []).filter(visivelParaAluno) : []

  return (
    <div className={`container mx-auto max-w-6xl px-4 ${RESPIRO_DO_TOPO} ${RESPIRO_DA_DOCA}`}>
      <CampoDeBusca
        termo={termo}
        aoMudar={setTermo}
        aoLimpar={() => {
          setTermo('')
          if (termoDaUrl) router.replace('/aulas/explorar')
        }}
      />

      {procurando ? (
        <ResultadosDaBusca
          termo={termo.trim()}
          grupos={grupos}
          total={totalDaBusca}
          carregando={buscando}
        />
      ) : carregando ? (
        <Grade>
          {Array.from({ length: 6 }).map((_, i) => (
            <Esqueleto key={i} className="h-56 rounded-3xl" />
          ))}
        </Grade>
      ) : arvore.length === 0 ? (
        <EstadoVazio
          icone={Compass}
          titulo="A organização do conteúdo ainda está sendo montada"
          descricao="Assim que houver áreas, módulos e tópicos publicados, eles aparecem aqui."
        />
      ) : atual ? (
        <DentroDeUmAssunto
          atual={atual}
          caminho={caminho}
          ramos={ramosVisiveis}
          aulas={aulas}
          carregandoAulas={carregandoAulas}
        />
      ) : (
        <RaizDoAcervo modulos={modulos} />
      )}
    </div>
  )
}

/**
 * O campo de busca, grudado no topo.
 *
 * Refinar é o gesto mais comum desta tela — a primeira lista quase nunca é a
 * última. Com o campo rolando junto com os resultados, cada tentativa exigia
 * voltar ao topo; grudado, digitar de novo custa um toque de onde a pessoa
 * estiver.
 */
function CampoDeBusca({
  termo,
  aoMudar,
  aoLimpar,
}: {
  termo: string
  aoMudar: (valor: string) => void
  aoLimpar: () => void
}) {
  const campo = useRef<HTMLInputElement>(null)

  return (
    // `cabecalho-vidro` na moldura, e não só no campo: sem uma superfície
    // atrás, os cartões passariam por baixo do input e apareceriam nos cantos
    // arredondados dele enquanto a página rola.
    <div className="cabecalho-vidro sticky top-14 z-20 -mx-4 mb-6 px-4 pb-3 pt-3 sm:top-16">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={campo}
          value={termo}
          onChange={(e) => aoMudar(e.target.value)}
          enterKeyHint="search"
          placeholder="Buscar assunto, aula, resumo…"
          aria-label="Buscar no acervo"
          className={cn(
            'vidro-elevado h-14 w-full rounded-2xl pl-12 pr-12 text-base outline-none',
            'transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15',
          )}
        />
        {termo ? (
          <button
            type="button"
            onClick={() => {
              aoLimpar()
              campo.current?.focus()
            }}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-[1.15rem] w-[1.15rem]" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

/**
 * A raiz: cada Módulo com os Tópicos de dentro já à vista.
 *
 * O Módulo é o cartão grande da faixa — ele é a etapa curricular, e é por ele
 * que a maioria orienta o próprio curso ("estou no Ciclo Clínico"). Os Tópicos
 * vêm ao lado, no mesmo trilho, porque é neles que a aula realmente mora.
 */
function RaizDoAcervo({ modulos }: { modulos: NoNaTela[] }) {
  return (
    <Cascata className="space-y-9">
      {modulos.map((modulo) => {
        const topicos = modulo.filhos || []

        return (
          <ItemDaCascata key={modulo._id}>
            <TituloDaFaixa
              titulo={modulo.nome}
              descricao={
                modulo.descricao ||
                `${modulo.aulasNaArvore} ${modulo.aulasNaArvore === 1 ? 'aula' : 'aulas'}`
              }
              href={`/aulas/explorar?no=${modulo._id}`}
              hrefLabel="Ver tudo"
            />

            {topicos.length > 0 ? (
              <Trilho>
                {topicos.map((topico) => (
                  <CartaoDeNo
                    key={topico._id}
                    no={topico}
                    href={`/aulas/explorar?no=${topico._id}`}
                    formato="alto"
                  />
                ))}
              </Trilho>
            ) : (
              // Módulo sem Tópicos ainda é navegável: ele mesmo vira o cartão,
              // e o toque leva direto às aulas presas nele.
              <Grade>
                <CartaoDeNo no={modulo} href={`/aulas/explorar?no=${modulo._id}`} />
              </Grade>
            )}
          </ItemDaCascata>
        )
      })}
    </Cascata>
  )
}

/** Um nível aberto: onde estou, o que existe abaixo e as aulas daqui. */
function DentroDeUmAssunto({
  atual,
  caminho,
  ramos,
  aulas,
  carregandoAulas,
}: {
  atual: NoNaTela
  caminho: NoNaTela[]
  ramos: NoNaTela[]
  aulas: AulaNaTela[]
  carregandoAulas: boolean
}) {
  return (
    <div className="space-y-9">
      <header>
        <Migalha
          className="mb-2"
          itens={[
            { nome: 'Explorar', href: '/aulas/explorar' },
            ...caminho.map((r) => ({
              _id: r._id,
              nome: r.nome,
              href: `/aulas/explorar?no=${r._id}`,
            })),
          ]}
        />
        <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
          {atual.nome}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {atual.descricao ||
            `${atual.aulasNaArvore} ${atual.aulasNaArvore === 1 ? 'aula' : 'aulas'} nesta seção`}
        </p>
      </header>

      {ramos.length > 0 ? (
        <section>
          <TituloDaFaixa titulo="Dentro deste assunto" />
          <Grade>
            {ramos.map((ramo) => (
              <CartaoDeNo key={ramo._id} no={ramo} href={`/aulas/explorar?no=${ramo._id}`} />
            ))}
          </Grade>
        </section>
      ) : null}

      <section>
        <TituloDaFaixa titulo={ramos.length > 0 ? 'Aulas desta seção' : 'Aulas'} />

        {carregandoAulas ? (
          <Grade>
            {Array.from({ length: 4 }).map((_, i) => (
              <Esqueleto key={i} className="h-64 rounded-3xl" />
            ))}
          </Grade>
        ) : aulas.length === 0 ? (
          <EstadoVazio
            icone={Layers}
            titulo="Nenhuma aula aqui ainda"
            descricao={
              ramos.length > 0
                ? 'Escolha uma das seções acima para ver o conteúdo.'
                : 'Esta seção ainda não recebeu aulas.'
            }
          />
        ) : (
          <Grade>
            {aulas.map((aula) => (
              <CartaoDeAula key={aula._id} aula={aula} formato="largo" />
            ))}
          </Grade>
        )}
      </section>
    </div>
  )
}

/**
 * O resultado, separado por tipo.
 *
 * Buscar "insuficiência cardíaca" numa plataforma de estudo tem pelo menos
 * quatro intenções possíveis: aprender do zero (Trilha), rever um ponto
 * específico (aula), revisar antes da prova (resumo, PDF) ou treinar
 * (flashcards). Uma lista única obrigaria o aluno a ler tudo para descobrir
 * qual linha serve. Cada intenção tem a sua seção, na ordem em que costuma
 * aparecer — e sem miniatura, porque numa busca a leitura é por título e capas
 * tornariam a varredura mais lenta, não mais rápida.
 */
function ResultadosDaBusca({
  termo,
  grupos,
  total,
  carregando,
}: {
  termo: string
  grupos: Grupo[]
  total: number
  carregando: boolean
}) {
  if (carregando && grupos.length === 0) {
    return (
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Esqueleto className="h-4 w-32" />
            <Esqueleto className="h-14 w-full rounded-2xl" />
            <Esqueleto className="h-14 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    )
  }

  if (grupos.length === 0) {
    return (
      <EstadoVazio
        icone={Search}
        titulo={`Nada encontrado para "${termo}"`}
        descricao="Tente outra palavra, ou apague a busca para navegar pelo acervo por assunto."
      />
    )
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        {total} {total === 1 ? 'resultado' : 'resultados'} para{' '}
        <span className="font-semibold text-foreground">{termo}</span>
      </p>

      <div className="space-y-7">
        {grupos.map((grupo) => {
          const Icone = ICONE_DO_TIPO[grupo.tipo] || Play
          return (
            <section key={grupo.tipo}>
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <Icone className="h-3.5 w-3.5" />
                {grupo.rotulo}
              </h2>
              <div className="vidro-cartao vidro-reflexo divide-y divide-border/40 overflow-hidden rounded-3xl">
                {grupo.itens.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group flex min-h-[3.5rem] items-center gap-3 px-4 py-3 transition hover:bg-primary/5"
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-sm font-semibold transition group-hover:text-primary',
                          item.extra?.concluida && 'text-muted-foreground',
                        )}
                      >
                        {item.titulo}
                      </span>
                      {item.detalhe ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.detalhe}
                        </span>
                      ) : null}
                    </span>

                    <span className="flex flex-none items-center gap-2 text-xs tabular-nums text-muted-foreground">
                      {item.extra?.concluida ? (
                        <Check className="h-4 w-4 text-primary" strokeWidth={3} />
                      ) : null}
                      {item.extra?.liberado === false ? <Lock className="h-3.5 w-3.5" /> : null}
                      {item.extra?.duracao || null}
                      {grupo.tipo === 'trilha' && item.extra?.aulas
                        ? `${item.extra.aulas} aulas`
                        : null}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}
