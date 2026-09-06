'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  ChevronRight,
  Compass,
  GraduationCap,
  Play,
  Route,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { RESPIRO_DA_DOCA, RESPIRO_DO_TOPO } from '@/components/ensino/doca'
import { CaminhoDeNos, Cascata, ItemDaCascata, type NoDoCaminho } from '@/components/ensino/duo'
import {
  AnelDeProgresso,
  BarraDeProgresso,
  Capa,
  CartaoDeAula,
  CartaoDeNo,
  CartaoDeTrilha,
  EstadoVazio,
  Esqueleto,
  EsqueletoDeFaixa,
  Trilho,
  TituloDaFaixa,
  formatarMinutos,
  type AulaNaTela,
  type NoNaTela,
  type TrilhaNaTela,
} from '@/components/ensino/primitivos'
import { readPageCache, writePageCache } from '@/lib/page-cache'
import { cn } from '@/lib/utils'

/**
 * APRENDER — a home da Área de Ensino, como uma jornada contínua.
 *
 * ══ A TELA QUE ESTA DEIXOU DE SER ════════════════════════════════════
 *
 * A versão anterior já tinha acertado a primeira dobra: um cartão grande com a
 * próxima ação calculada, e não um painel de estatísticas. O que ela ainda não
 * tinha era CONTINUIDADE. Abaixo do cartão vinham seis faixas horizontais de
 * mesmo peso — Trilhas, Trilhas de novo, chips de assunto, novidades, revisão —
 * e o aluno saía de "sei exatamente o que fazer" para "escolha uma entre trinta
 * coisas" numa rolagem só. O progresso aparecia como número e como barra;
 * nenhum dos dois responde "quanto falta para o próximo marco".
 *
 * ══ A ORDEM DA PÁGINA É A ORDEM DA CABEÇA ════════════════════════════
 *
 * Agora a rolagem conta uma história, e cada dobra responde a UMA pergunta:
 *
 *   1. "onde eu parei?"          → o cartão de retomada, único com capa grande
 *   2. "quanto falta?"           → o caminho: o passo de hoje entre o que já
 *                                  foi e o que vem, desenhado como percurso
 *   3. "o que mais está aberto?" → as outras retomadas, em lista fina
 *   4. "o que preciso rever?"    → a revisão, num cartão âmbar
 *   5. "o que mais existe?"      → os assuntos, com capa
 *   6. "o que vocês sugerem?"    → Trilhas e aulas novas
 *
 * Nada aqui pede uma decisão antes da hora. Quem quiser só continuar toca no
 * primeiro botão e nunca vê o resto; quem quiser garimpar desce e encontra o
 * acervo ilustrado, sem passar por Ciclo → Módulo → Tópico → Subtópico.
 *
 * A faixa de Trilhas daqui não conflita com Trilhas ter voltado à barra de
 * baixo (ver `doca.tsx`): são perguntas diferentes. A faixa responde "o que eu
 * estudo agora?" com uma escolha curta e curada; a barra é a porta para a
 * vitrine inteira, para quem já sabe que quer garimpar.
 *
 * ══ POR QUE O CAMINHO E NÃO MAIS UMA BARRA ═══════════════════════════
 *
 * A barra diz "37%". O caminho diz "faltam duas aulas para fechar a etapa, e a
 * próxima é esta". São a mesma informação com duas eficácias diferentes: uma é
 * um relatório, a outra é um convite. A janela é curta (seis nós) porque a home
 * mostra o PASSO, não o índice — a Trilha inteira continua a um toque.
 */

interface ItemDeContinuidade {
  aulaId: string
  titulo: string
  capa?: any
  href: string
  percentual: number
  retomarLabel: string
  localizacao?: string
  trilha?: {
    slug: string
    titulo: string
    etapa: string
    percentual: number
    concluidos: number
    total: number
  } | null
}

interface CaminhoDaHome {
  trilha: {
    slug: string
    titulo: string
    percentual: number
    concluidos: number
    total: number
    iniciada: boolean
  }
  restantes: number
  nos: Array<{
    id: string
    titulo: string
    href: string
    estado: 'concluido' | 'atual' | 'disponivel' | 'bloqueado'
    percentual: number
    duracaoLabel?: string
    fimDeEtapa?: boolean
    etiqueta?: string
  }>
}

interface RespostaDaHome {
  logado: boolean
  continuar: ItemDeContinuidade[]
  caminho: CaminhoDaHome | null
  trilhas: {
    emCurso: TrilhaNaTela[]
    recomendadas: TrilhaNaTela[]
    novas: TrilhaNaTela[]
    total: number
  }
  arvore: NoNaTela[]
  aulasRecentes: AulaNaTela[]
  revisar: { concluidas: number }
  estatisticas: {
    aulasConcluidas: number
    minutosEstudados: number
    trilhasConcluidas: number
    trilhasEmCurso: number
    semana: { aulas: number; minutos: number }
  }
}

/**
 * A próxima ação — o produto da primeira dobra.
 *
 * Um único formato para quatro origens diferentes, porque para quem olha não
 * importa se o destino é uma aula solta ou a terceira etapa de uma Trilha:
 * importa que existe uma coisa certa a fazer e um botão para fazê-la.
 */
interface ProximaAcao {
  contexto: string
  titulo: string
  detalhe?: string
  href: string
  rotulo: string
  capa?: any
  percentual?: number
  anel?: number
}

export default function AulasPage() {
  return (
    <AppShell headerTitle="Ensino" headerSubtitle="Aprender, explorar e revisar" comercio={false} vidro>
      <ConteudoDaHome />
    </AppShell>
  )
}

/**
 * A home do Ensino guardada entre navegações.
 *
 * O `AppShell` é montado dentro de cada `page.tsx`, então entrar numa aula e
 * voltar desmonta esta tela por inteiro e refaz a requisição — que é a mais
 * pesada da área, porque monta continuar, caminho, Trilhas, árvore e recentes
 * de uma vez. Com o cache, a volta pinta a tela da última visita no primeiro
 * frame e revalida por baixo; sem ele, a mesma navegação custava um esqueleto
 * inteiro.
 *
 * O que está guardado é catálogo e progresso — nada de saldo, crédito ou
 * assinatura (ver o aviso em lib/page-cache.ts).
 */
const CACHE_DA_HOME = 'ensino:home'

function ConteudoDaHome() {
  /*
   * O cache entra no efeito, não no estado inicial.
   *
   * `readPageCache` lê o `sessionStorage`: no servidor devolve `null`, no
   * navegador devolve a visita anterior. Usado para inicializar o estado, isso
   * faz o HTML do servidor (skeleton) discordar do primeiro render do cliente
   * (conteúdo) — a hidratação falha, o React descarta a página e redesenha
   * tudo (erro #422). O efeito abaixo aplica o cache antes de qualquer
   * pintura com dados, então o "instantâneo" continua igual.
   */
  const [dados, setDados] = useState<RespostaDaHome | null>(null)
  const [carregando, setCarregando] = useState(true)
  const semMovimento = useReducedMotion()

  useEffect(() => {
    let cancelado = false
    const emCache = readPageCache<RespostaDaHome>(CACHE_DA_HOME)
    if (emCache) {
      setDados(emCache)
      setCarregando(false)
    }
    fetch('/api/ensino/home', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelado || !d || d.error) return
        setDados(d)
        writePageCache(CACHE_DA_HOME, d)
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
   * Os assuntos do carrossel de descoberta.
   *
   * São os Módulos (Ciclo Básico, Ciclo Clínico…) e, quando a Área tem um só
   * Módulo, os Tópicos de dentro dele: uma fileira com um item é uma fileira
   * inútil, e o nível útil é sempre o primeiro que oferece escolha real.
   */
  const assuntos = useMemo<NoNaTela[]>(() => {
    const modulos: NoNaTela[] = []
    for (const area of dados?.arvore || []) {
      for (const modulo of area.filhos || []) modulos.push(modulo)
    }
    if (modulos.length > 1) return modulos
    if (modulos.length === 1) return modulos[0].filhos || modulos
    return dados?.arvore || []
  }, [dados])

  /** A decisão, na ordem em que ela vale a pena ser tomada. */
  const proxima = useMemo<ProximaAcao | null>(() => {
    if (!dados) return null

    const retomada = dados.continuar[0]
    if (retomada) {
      return {
        contexto: retomada.trilha ? retomada.trilha.titulo : retomada.localizacao || 'Continue',
        titulo: retomada.titulo,
        detalhe: retomada.trilha
          ? `${retomada.trilha.etapa} · ${retomada.trilha.concluidos} de ${retomada.trilha.total} aulas`
          : retomada.retomarLabel,
        href: retomada.href,
        rotulo: 'Continuar',
        capa: retomada.capa,
        percentual: retomada.percentual,
        anel: retomada.trilha?.percentual,
      }
    }

    const emCurso = dados.trilhas.emCurso[0]
    if (emCurso) {
      return {
        contexto: 'Sua Trilha',
        titulo: emCurso.titulo,
        detalhe: emCurso.progresso
          ? `${emCurso.progresso.concluidos} de ${emCurso.progresso.total} aulas`
          : emCurso.subtitulo,
        href: `/aulas/trilhas/${emCurso.slug}`,
        rotulo: 'Continuar',
        capa: emCurso.capa,
        anel: emCurso.progresso?.percentual,
      }
    }

    const sugerida = dados.trilhas.recomendadas[0]
    if (sugerida) {
      return {
        contexto: 'Comece por aqui',
        titulo: sugerida.titulo,
        detalhe:
          sugerida.subtitulo ||
          [
            `${sugerida.aulas} ${sugerida.aulas === 1 ? 'aula' : 'aulas'}`,
            sugerida.minutos > 0 ? formatarMinutos(sugerida.minutos) : '',
          ]
            .filter(Boolean)
            .join(' · '),
        href: `/aulas/trilhas/${sugerida.slug}`,
        rotulo: 'Começar',
        capa: sugerida.capa,
      }
    }

    const aula = dados.aulasRecentes[0]
    if (aula) {
      return {
        contexto: aula.localizacao || 'Novidade',
        titulo: aula.titulo,
        detalhe: aula.duracaoLabel,
        href: aula.href,
        rotulo: 'Assistir',
        capa: aula.capa,
      }
    }

    return null
  }, [dados])

  /** As Trilhas sugeridas menos a que já virou o cartão do topo. */
  const recomendadas = useMemo(() => {
    if (!dados) return [] as TrilhaNaTela[]
    const jaNoTopo = proxima?.href.startsWith('/aulas/trilhas/') ? proxima.href : null
    return dados.trilhas.recomendadas.filter((t) => `/aulas/trilhas/${t.slug}` !== jaNoTopo)
  }, [dados, proxima])

  const outrasRetomadas = dados?.continuar.slice(1, 4) || []
  const semana = dados?.estatisticas?.semana
  const vazio = !carregando && dados && !proxima

  return (
    <div className={`container mx-auto max-w-5xl px-4 ${RESPIRO_DO_TOPO} ${RESPIRO_DA_DOCA}`}>
      {/* ══ O topo: uma saudação, uma busca ══════════════════════════
          Duas linhas e nada mais. Buscar é o único atalho que precisa
          estar acima de tudo, porque quem chega com um assunto na cabeça
          não deveria ter de descobrir onde o assunto mora. */}
      <motion.header
        initial={semMovimento ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="mb-5"
      >
        <h1 className="font-heading text-[1.7rem] font-extrabold leading-tight tracking-tight sm:text-4xl">
          {dados?.continuar?.length ? 'Bom te ver de volta' : 'O que você quer aprender?'}
        </h1>

        <div className="mt-3 flex items-center gap-2">
          <Link
            href="/aulas/explorar"
            prefetch
            className={cn(
              'vidro-sutil vidro-toque flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl px-4',
              'text-sm text-muted-foreground',
            )}
          >
            <Search className="h-[1.15rem] w-[1.15rem] flex-none" />
            <span className="truncate">Buscar aula, Trilha ou assunto</span>
          </Link>

          {/* A linha da semana virou um selo ao lado da busca: ela é
              contexto, não manchete. O painel completo mora em "Você",
              que é onde alguém vai quando quer olhar para o próprio
              progresso — e não quando quer estudar. */}
          {dados?.logado && semana && semana.aulas > 0 ? (
            <Link
              href="/aulas/voce"
              className="vidro-ambar vidro-toque hidden h-12 flex-none items-center gap-2 rounded-2xl px-4 text-sm font-bold sm:flex"
              title="Seu progresso desta semana"
            >
              <Sparkles className="h-4 w-4 text-accent-foreground" />
              <span className="tabular-nums">
                {semana.aulas} {semana.aulas === 1 ? 'aula' : 'aulas'}
              </span>
              <span className="text-xs font-medium text-muted-foreground">esta semana</span>
            </Link>
          ) : null}
        </div>
      </motion.header>

      {carregando ? (
        <div className="space-y-8">
          <Esqueleto className="h-44 w-full rounded-[1.75rem]" />
          <Esqueleto className="h-72 w-full rounded-[1.75rem]" />
          <EsqueletoDeFaixa quantidade={3} />
        </div>
      ) : vazio ? (
        <EstadoVazio
          icone={GraduationCap}
          titulo="O conteúdo está a caminho"
          descricao="Assim que houver Trilhas e aulas liberadas para a sua conta, elas aparecem aqui com o seu progresso."
          acaoLabel="Conhecer os planos"
          acaoHref="/buy"
        />
      ) : (
        <Cascata className="space-y-10">
          {/* ══ 1. Onde você parou ═══════════════════════════════════ */}
          {proxima ? (
            <ItemDaCascata>
              <CartaoDaProximaAcao acao={proxima} />
            </ItemDaCascata>
          ) : null}

          {/* ══ 2. O caminho ═════════════════════════════════════════ */}
          {dados?.caminho ? (
            <ItemDaCascata>
              <CaminhoDaJornada caminho={dados.caminho} />
            </ItemDaCascata>
          ) : null}

          {/* ══ 3. Também em andamento ═══════════════════════════════
              A segunda, a terceira e a quarta escolhas — e uma lista
              fina é exatamente o peso que isso merece ao lado do
              cartão do topo. */}
          {outrasRetomadas.length > 0 ? (
            <ItemDaCascata>
              <TituloDaFaixa titulo="Também em andamento" icone={Play} />
              <div className="vidro-cartao vidro-reflexo divide-y divide-border/40 overflow-hidden rounded-3xl">
                {outrasRetomadas.map((item) => (
                  <Link
                    key={item.aulaId}
                    href={item.href}
                    className="group flex items-center gap-3 px-4 py-3.5 transition hover:bg-primary/5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold transition group-hover:text-primary">
                        {item.titulo}
                      </span>
                      <span className="mt-1.5 flex items-center gap-2">
                        <BarraDeProgresso percentual={item.percentual} className="w-16" />
                        <span className="truncate text-xs text-muted-foreground">
                          {item.trilha ? item.trilha.titulo : item.retomarLabel}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 flex-none text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            </ItemDaCascata>
          ) : null}

          {/* ══ 4. A revisão ═════════════════════════════════════════
              Âmbar, e é a única peça âmbar da tela: revisar é a coisa
              que o aluno mais adia, e ela precisa de um tom que puxe o
              olho sem gritar. */}
          {dados && dados.revisar.concluidas > 0 ? (
            <ItemDaCascata>
              <Link
                href="/aulas/revisar"
                prefetch
                className="vidro-ambar vidro-toque vidro-reflexo group flex items-center gap-3.5 rounded-3xl px-4 py-4"
              >
                <span className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-accent/25 text-accent-foreground">
                  <RotateCcw className="h-[1.35rem] w-[1.35rem]" strokeWidth={2.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-base font-extrabold tracking-tight">
                    Hora de revisar
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {dados.revisar.concluidas}{' '}
                    {dados.revisar.concluidas === 1
                      ? 'aula concluída esperando uma passada'
                      : 'aulas concluídas esperando uma passada'}
                  </span>
                </span>
                <ArrowRight className="h-[1.15rem] w-[1.15rem] flex-none text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            </ItemDaCascata>
          ) : null}

          {/* ══ 5. Os assuntos, com capa ═════════════════════════════
              A fileira que substituiu os chips de texto. Cada cartão
              leva DIRETO ao assunto — uma interação da home até a lista
              de aulas daquele tema, sem descer a hierarquia. */}
          {assuntos.length > 0 ? (
            <ItemDaCascata>
              <TituloDaFaixa
                titulo="Explorar por assunto"
                descricao="Todo o acervo, organizado como a Medicina é ensinada"
                icone={Compass}
                href="/aulas/explorar"
                hrefLabel="Ver tudo"
              />
              <Trilho>
                {assuntos.map((assunto) => (
                  <CartaoDeNo
                    key={assunto._id}
                    no={assunto}
                    href={`/aulas/explorar?no=${assunto._id}`}
                    formato="alto"
                  />
                ))}
              </Trilho>
            </ItemDaCascata>
          ) : null}

          {/* ══ 6. Trilhas em andamento ══════════════════════════════ */}
          {dados && dados.trilhas.emCurso.length > 0 ? (
            <ItemDaCascata>
              <TituloDaFaixa titulo="Suas Trilhas" icone={Route} href="/aulas/trilhas" />
              <Trilho>
                {dados.trilhas.emCurso.map((trilha) => (
                  <CartaoDeTrilha key={trilha._id} trilha={trilha} />
                ))}
              </Trilho>
            </ItemDaCascata>
          ) : null}

          {/* ══ 7. Recomendados ══════════════════════════════════════ */}
          {recomendadas.length > 0 ? (
            <ItemDaCascata>
              <TituloDaFaixa
                titulo={dados?.trilhas.emCurso.length ? 'Para começar agora' : 'Trilhas de Ensino'}
                icone={Sparkles}
                href="/aulas/trilhas"
              />
              <Trilho>
                {recomendadas.map((trilha) => (
                  <CartaoDeTrilha key={trilha._id} trilha={trilha} />
                ))}
              </Trilho>
            </ItemDaCascata>
          ) : null}

          {/* ══ 8. Novidades ═════════════════════════════════════════ */}
          {dados && dados.aulasRecentes.length > 0 ? (
            <ItemDaCascata>
              <TituloDaFaixa titulo="Novas aulas" href="/aulas/explorar" hrefLabel="Ver tudo" />
              <Trilho>
                {dados.aulasRecentes.map((aula) => (
                  <CartaoDeAula key={aula._id} aula={aula} />
                ))}
              </Trilho>
            </ItemDaCascata>
          ) : null}
        </Cascata>
      )}
    </div>
  )
}

/**
 * O cartão do topo.
 *
 * É o único elemento da página com capa grande, vidro elevado e botão sólido.
 * Essa desproporção é intencional: se tudo tivesse o mesmo peso, a tela
 * voltaria a ser um menu — e a decisão, de novo, seria do aluno.
 */
function CartaoDaProximaAcao({ acao }: { acao: ProximaAcao }) {
  return (
    <Link
      href={acao.href}
      prefetch
      className="vidro-elevado vidro-toque vidro-reflexo group relative flex overflow-hidden rounded-[1.75rem]"
    >
      {/* `absolute inset-0` na capa: a altura do cartão é ditada pelo texto,
          e a imagem preenche a coluna inteira em vez de deixar uma faixa
          cinza embaixo quando o título ocupa duas linhas. */}
      <div className="relative w-[7.5rem] flex-none self-stretch sm:w-56">
        <Capa
          capa={acao.capa}
          titulo={acao.titulo}
          aspecto="livre"
          className="absolute inset-0 h-full w-full rounded-none"
          // A coluna tem 7,5rem no celular e 14rem a partir de `sm`.
          sizes="(max-width: 640px) 120px, 224px"
          // É a primeira dobra e quase sempre o maior elemento da tela — quem
          // decide o LCP da home do Ensino. Esperar o observer aqui atrasaria
          // justamente a imagem que mede a página.
          prioridade
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/95 text-primary-foreground shadow-[0_4px_16px_-2px_rgb(0_0_0/0.45)] ring-1 ring-white/40 backdrop-blur-sm transition group-hover:scale-110">
            <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
          </span>
        </span>
        {acao.percentual ? (
          <BarraDeProgresso
            percentual={acao.percentual}
            className="absolute inset-x-0 bottom-0 rounded-none bg-black/40"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4 sm:p-6">
        <p className="truncate text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary">
          {acao.contexto}
        </p>
        <h2 className="line-clamp-2 break-words font-heading text-lg font-extrabold leading-tight tracking-tight sm:text-2xl">
          {acao.titulo}
        </h2>
        {acao.detalhe ? (
          <p className="truncate text-xs text-muted-foreground sm:text-sm">{acao.detalhe}</p>
        ) : null}

        <div className="mt-3 flex items-center gap-3">
          {/* Um `<span>` com a cara do botão, e não um botão de verdade: o
              cartão inteiro já é o link, e um botão aqui dentro seria um alvo
              clicável dentro de outro — HTML inválido e um segundo destino de
              foco para o teclado, sem nenhum ganho. */}
          <span
            className={cn(
              'inline-flex h-10 select-none items-center gap-2 rounded-2xl bg-primary px-4',
              'text-[11px] font-extrabold uppercase tracking-[0.1em] text-primary-foreground',
              'shadow-[0_6px_18px_-6px_hsl(var(--primary))] transition-transform duration-150',
              'group-active:translate-y-[2px]',
            )}
          >
            {acao.rotulo}
            <ArrowRight className="h-4 w-4" />
          </span>
          {typeof acao.anel === 'number' ? (
            <AnelDeProgresso percentual={acao.anel} tamanho={38} />
          ) : null}
        </div>
      </div>
    </Link>
  )
}

/**
 * O caminho da Trilha em foco, dentro de um painel de vidro.
 *
 * ══ O QUE ELE ACRESCENTA À HOME ══════════════════════════════════════
 *
 * O cartão de cima responde "o que eu faço agora". Este responde as duas
 * perguntas seguintes, que nenhuma barra de progresso responde: "o que vem
 * depois disso" e "quanto falta para fechar a etapa". São elas que fazem
 * alguém assistir a segunda aula da noite.
 *
 * ══ POR QUE ELE NÃO É INFANTIL ═══════════════════════════════════════
 *
 * O percurso serpenteante vem do Duolingo, e é a parte que funciona: o olho
 * segue a curva e entende que existe um antes e um depois. O que NÃO veio é a
 * embalagem — não há mascote, moeda, vida nem confete a cada toque. Os nós
 * moram sobre vidro, com a tipografia da marca, e o que se celebra é o que
 * realmente aconteceu: aula concluída e etapa fechada.
 */
function CaminhoDaJornada({ caminho }: { caminho: CaminhoDaHome }) {
  const { trilha, nos, restantes } = caminho

  const nosDoCaminho: NoDoCaminho[] = nos.map((no) => ({
    id: no.id,
    titulo: no.titulo,
    href: no.href,
    estado: no.estado,
    percentual: no.percentual,
    fimDeEtapa: no.fimDeEtapa,
    duracaoLabel: no.duracaoLabel,
  }))

  return (
    <section className="vidro-cartao vidro-reflexo overflow-hidden rounded-[1.75rem]">
      {/* O cabeçalho diz de QUAL Trilha é o caminho. Sem ele, os nós ficariam
          soltos no meio da home e o aluno não saberia o que está percorrendo —
          nem que existe uma página com o percurso inteiro. */}
      <header className="flex items-center gap-3 border-b border-border/40 px-4 py-3.5 sm:px-5">
        <AnelDeProgresso percentual={trilha.percentual} tamanho={44} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">
            {trilha.iniciada ? 'Sua trilha' : 'Comece por aqui'}
          </p>
          <h2 className="truncate font-heading text-base font-extrabold tracking-tight sm:text-lg">
            {trilha.titulo}
          </h2>
          <p className="text-xs text-muted-foreground">
            {trilha.total > 0
              ? `${trilha.concluidos} de ${trilha.total} aulas concluídas`
              : 'Percurso completo'}
          </p>
        </div>
        <Link
          href={`/aulas/trilhas/${trilha.slug}`}
          prefetch
          className="group inline-flex flex-none items-center gap-1 text-sm font-semibold text-muted-foreground transition hover:text-primary"
        >
          <span className="hidden sm:inline">Ver tudo</span>
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </header>

      {/* O `pt-10` paga o balão "você está aqui", que fica 44px acima do nó:
          com o respiro padrão ele seria cortado pelo `overflow-hidden` do
          painel logo no primeiro nó — que é justamente o nó que mais importa. */}
      <div className="px-4 pb-2 pt-10">
        <CaminhoDeNos nos={nosDoCaminho} />
      </div>

      {/* O rodapé só aparece quando existe mais caminho do que a home mostra.
          "Faltam 14 aulas" sem link seria um lembrete de dívida; com link, é a
          porta para o percurso inteiro. */}
      {restantes > 0 ? (
        <Link
          href={`/aulas/trilhas/${trilha.slug}`}
          prefetch
          className="flex items-center justify-center gap-1.5 border-t border-border/40 px-4 py-3.5 text-sm font-semibold text-muted-foreground transition hover:bg-primary/5 hover:text-primary"
        >
          Mais {restantes} {restantes === 1 ? 'aula' : 'aulas'} nesta Trilha
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </section>
  )
}
