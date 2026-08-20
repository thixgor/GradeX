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
import { RESPIRO_DA_DOCA } from '@/components/ensino/doca'
import { Cascata, ItemDaCascata } from '@/components/ensino/duo'
import {
  AnelDeProgresso,
  BarraDeProgresso,
  Capa,
  CartaoDeAula,
  CartaoDeTrilha,
  EstadoVazio,
  Esqueleto,
  EsqueletoDeFaixa,
  Trilho,
  TituloDaFaixa,
  formatarMinutos,
  type AulaNaTela,
  type TrilhaNaTela,
} from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * APRENDER — a única casa da Área de Ensino (§3, §4, §5, §11, §29, §30).
 *
 * ══ O QUE ESTA TELA DEIXOU DE SER ════════════════════════════════════
 *
 * A versão anterior abria com quatro fichas de estatística e seis faixas de
 * mesmo peso. Era um painel: bonito, informativo e mudo sobre a única pergunta
 * que o aluno tem ao abrir o app — "o que eu faço agora?". Para uma conta nova
 * a primeira dobra inteira eram quatro zeros.
 *
 * ══ A REGRA DOS DOIS SEGUNDOS ════════════════════════════════════════
 *
 * Agora a tela abre com UMA decisão, grande, no topo: a próxima coisa que faz
 * sentido estudar. Ela é calculada, não perguntada (§11): retomar a aula
 * interrompida, se houver; senão a Trilha em andamento; senão a Trilha que a
 * equipe marcou como ponto de partida; senão a aula mais recente do acervo.
 * O botão é um só, e ele é a resposta.
 *
 * Tudo o mais desce um degrau de hierarquia e vira material de descoberta —
 * Trilhas, acervo, novidades e revisão continuam ali, em faixas, para quem
 * quiser escolher em vez de seguir.
 *
 * ══ TRILHAS E EXPLORAR NÃO SÃO LUGARES (§3, §7) ══════════════════════
 *
 * Eles eram abas na barra de baixo, competindo com Aprender enquanto mostravam
 * a mesma coisa. Aqui voltam ao que sempre foram: uma faixa de conteúdo e uma
 * fileira de atalhos por assunto, com "ver tudo" levando às páginas completas,
 * que continuam existindo e recebendo link direto.
 *
 * ══ AS ESTATÍSTICAS VIRARAM UMA LINHA (§6) ═══════════════════════════
 *
 * "Esta semana: 4 aulas · 1h32" diz mais sobre o momento do que quatro
 * totalizadores históricos, e cabe numa linha. O painel completo mora em
 * "Você", que é onde alguém vai quando quer olhar para o próprio progresso —
 * e não quando quer estudar.
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

interface RamoNaTela {
  _id: string
  nome: string
  nivel: string
  aulasNaArvore: number
  filhos: RamoNaTela[]
}

interface RespostaDaHome {
  logado: boolean
  continuar: ItemDeContinuidade[]
  trilhas: {
    emCurso: TrilhaNaTela[]
    recomendadas: TrilhaNaTela[]
    novas: TrilhaNaTela[]
    total: number
  }
  arvore: RamoNaTela[]
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
 * A próxima ação — o produto desta tela.
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
    <AppShell headerTitle="Ensino" headerSubtitle="Aprender, buscar e revisar" comercio={false}>
      <ConteudoDaHome />
    </AppShell>
  )
}

function ConteudoDaHome() {
  const [dados, setDados] = useState<RespostaDaHome | null>(null)
  const [carregando, setCarregando] = useState(true)
  const semMovimento = useReducedMotion()

  useEffect(() => {
    let cancelado = false
    fetch('/api/ensino/home', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelado && d && !d.error) setDados(d)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  /** Os Módulos (Ciclo Básico, Ciclo Clínico…) achatados para a fileira de atalhos. */
  const modulos = useMemo(() => {
    const saida: Array<{ _id: string; nome: string; aulas: number }> = []
    for (const area of dados?.arvore || []) {
      for (const modulo of area.filhos || []) {
        saida.push({ _id: modulo._id, nome: modulo.nome, aulas: modulo.aulasNaArvore })
      }
    }
    return saida
  }, [dados])

  /** A decisão, na ordem em que ela vale a pena ser tomada (§11, §28). */
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
        contexto: aula.localizacao || 'Novo no acervo',
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
    <div className={`container mx-auto max-w-6xl px-4 ${RESPIRO_DA_DOCA}`}>
      {/* ══ Título e busca ═══════════════════════════════════════════
          Duas linhas, e a segunda é a busca — que a tela anterior não
          tinha em lugar nenhum, obrigando quem chegava atrás de um
          assunto específico a passar pela barra de baixo (§8). */}
      <motion.header
        initial={semMovimento ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="mb-4"
      >
        <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
          {dados?.continuar?.length ? 'Bom te ver de volta' : 'O que você quer aprender?'}
        </h1>

        <Link
          href="/aulas/buscar"
          prefetch
          className={cn(
            'mt-3 flex h-12 items-center gap-3 rounded-2xl bg-card px-4 ring-1 ring-border/70',
            'text-sm text-muted-foreground transition hover:ring-primary/40',
          )}
        >
          <Search className="h-[1.15rem] w-[1.15rem] flex-none" />
          <span className="truncate">Buscar aula, Trilha ou assunto</span>
        </Link>
      </motion.header>

      {carregando ? (
        <div className="space-y-8">
          <Esqueleto className="h-40 w-full rounded-3xl" />
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
        <Cascata className="space-y-8">
          {/* ══ A próxima ação ═══════════════════════════════════════ */}
          {proxima ? (
            <ItemDaCascata>
              <CartaoDaProximaAcao acao={proxima} />
            </ItemDaCascata>
          ) : null}

          {/* ══ A semana, numa linha (§6) ════════════════════════════ */}
          {dados?.logado && semana && (semana.aulas > 0 || dados.estatisticas.aulasConcluidas > 0) ? (
            <ItemDaCascata>
              <Link
                href="/aulas/voce"
                className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
              >
                <span className="font-semibold text-foreground">Esta semana</span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">
                  {semana.aulas} {semana.aulas === 1 ? 'aula' : 'aulas'}
                </span>
                {semana.minutos > 0 ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">{formatarMinutos(semana.minutos)}</span>
                  </>
                ) : null}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </ItemDaCascata>
          ) : null}

          {/* ══ As outras retomadas, em lista compacta ═══════════════
              Elas são a segunda, a terceira e a quarta escolhas — e uma
              lista fina é exatamente o peso que isso merece ao lado do
              cartão do topo (§26). */}
          {outrasRetomadas.length > 0 ? (
            <ItemDaCascata>
              <TituloDaFaixa titulo="Também em andamento" icone={Play} />
              <div className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card ring-1 ring-border/70">
                {outrasRetomadas.map((item) => (
                  <Link
                    key={item.aulaId}
                    href={item.href}
                    className="group flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold transition group-hover:text-primary">
                        {item.titulo}
                      </span>
                      <span className="mt-1 flex items-center gap-2">
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

          {/* ══ Trilhas em andamento ═════════════════════════════════ */}
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

          {/* ══ Trilhas para começar ═════════════════════════════════ */}
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

          {/* ══ O acervo, como fileira de atalhos (§7, §26) ══════════
              "Explorar" era uma aba; virou o que sempre foi — um jeito
              de chegar num assunto. Chips ocupam uma linha, e não a
              tela inteira, porque navegar por pasta é a exceção: a
              regra é continuar ou buscar. */}
          {modulos.length > 0 ? (
            <ItemDaCascata>
              <TituloDaFaixa
                titulo="Por etapa da Medicina"
                icone={Compass}
                href="/aulas/explorar"
                hrefLabel="Ver o acervo"
              />
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {modulos.map((modulo) => (
                  <Link
                    key={modulo._id}
                    href={`/aulas/explorar?no=${modulo._id}`}
                    className={cn(
                      'group inline-flex h-11 flex-none items-center gap-2 rounded-full bg-card px-4',
                      'text-sm font-semibold ring-1 ring-border/70 transition hover:ring-primary/40',
                    )}
                  >
                    <span className="transition group-hover:text-primary">{modulo.nome}</span>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {modulo.aulas}
                    </span>
                  </Link>
                ))}
              </div>
            </ItemDaCascata>
          ) : null}

          {/* ══ Novidades ════════════════════════════════════════════ */}
          {dados && dados.aulasRecentes.length > 0 ? (
            <ItemDaCascata>
              <TituloDaFaixa titulo="Novas aulas" href="/aulas/explorar" hrefLabel="Ver o acervo" />
              <Trilho>
                {dados.aulasRecentes.map((aula) => (
                  <CartaoDeAula key={aula._id} aula={aula} />
                ))}
              </Trilho>
            </ItemDaCascata>
          ) : null}

          {/* ══ Revisão — uma linha, não um cartão gigante (§26) ═════ */}
          {dados && dados.revisar.concluidas > 0 ? (
            <ItemDaCascata>
              <Link
                href="/aulas/revisar"
                className="group flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-border/70 transition hover:ring-primary/40"
              >
                <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <RotateCcw className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">Revisar o que você já estudou</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {dados.revisar.concluidas}{' '}
                    {dados.revisar.concluidas === 1 ? 'aula concluída' : 'aulas concluídas'}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 flex-none text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
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
 * É o único elemento da página com capa grande, botão sólido e sombra de
 * espessura. Essa desproporção é intencional: se tudo tivesse o mesmo peso, a
 * tela voltaria a ser um menu — e a decisão, de novo, seria do aluno.
 */
function CartaoDaProximaAcao({ acao }: { acao: ProximaAcao }) {
  return (
    <Link
      href={acao.href}
      prefetch
      className={cn(
        'group relative flex overflow-hidden rounded-3xl bg-card ring-1 ring-border/70',
        'shadow-[0_5px_0_rgb(0_0_0/0.14)] transition-[transform,box-shadow] duration-150',
        'hover:-translate-y-0.5 hover:shadow-[0_7px_0_rgb(0_0_0/0.16)] hover:ring-primary/40',
        'active:translate-y-[4px] active:shadow-none',
      )}
    >
      {/* `absolute inset-0` na capa: a altura do cartão é ditada pelo texto,
          e a imagem preenche a coluna inteira em vez de deixar uma faixa
          cinza embaixo quando o título ocupa duas linhas. */}
      <div className="relative w-32 flex-none self-stretch sm:w-52">
        <Capa
          capa={acao.capa}
          titulo={acao.titulo}
          className="absolute inset-0 h-full w-full rounded-none"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/95 text-primary-foreground shadow-[0_3px_0_rgb(0_0_0/0.3)] transition group-hover:scale-110">
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

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4 sm:p-5">
        <p className="truncate text-[11px] font-extrabold uppercase tracking-wide text-primary">
          {acao.contexto}
        </p>
        <h2 className="line-clamp-2 font-heading text-lg font-extrabold leading-tight tracking-tight sm:text-2xl">
          {acao.titulo}
        </h2>
        {acao.detalhe ? (
          <p className="truncate text-xs text-muted-foreground sm:text-sm">{acao.detalhe}</p>
        ) : null}

        <div className="mt-2 flex items-center gap-3">
          {/* Um `<span>` com a cara do botão, e não um `BotaoDuo`: o cartão
              inteiro já é o link, e um botão de verdade aqui dentro seria um
              alvo clicável dentro de outro — HTML inválido e um segundo
              destino de foco para o teclado, sem nenhum ganho. */}
          <span
            className={cn(
              'inline-flex h-9 select-none items-center gap-2 rounded-2xl bg-primary px-3.5',
              'text-[11px] font-extrabold uppercase tracking-wide text-primary-foreground',
              'shadow-[0_3px_0_rgb(0_0_0/0.28)] transition-[transform,box-shadow] duration-100',
              'group-active:translate-y-[3px] group-active:shadow-none',
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
