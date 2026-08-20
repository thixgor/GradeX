'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Clock,
  Compass,
  Flame,
  GraduationCap,
  Play,
  Route,
  RotateCcw,
  Settings2,
  Sparkles,
  Trophy,
} from 'lucide-react'

import { AppShell, useAppShell } from '@/components/app-shell'
import { DocaDeEnsino, RESPIRO_DA_DOCA } from '@/components/ensino/doca'
import {
  BotaoDuo,
  Cascata,
  FichaDeEstatistica,
  ItemDaCascata,
} from '@/components/ensino/duo'
import {
  AnelDeProgresso,
  BarraDeProgresso,
  CartaoDeAula,
  CartaoDeTrilha,
  EstadoVazio,
  EsqueletoDeFaixa,
  Trilho,
  TituloDaFaixa,
  type AulaNaTela,
  type TrilhaNaTela,
} from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * A home da Área de Ensino (§13).
 *
 * O QUE MUDOU EM RELAÇÃO À TELA ANTERIOR
 *
 * A anterior abria com "seus cursos" e uma busca. Era um índice: a pessoa
 * chegava e precisava decidir sozinha o que fazer. Esta abre com a única coisa
 * que ela quase sempre quer — voltar para onde parou — e só depois oferece
 * escolhas, na ordem em que uma decisão de estudo acontece:
 *
 *   1. continuar o que já comecei;
 *   2. as Trilhas que estou percorrendo;
 *   3. o que vale começar agora;
 *   4. onde fica cada assunto;
 *   5. o que já vi e preciso revisar.
 *
 * Nenhuma dessas faixas é "todas as aulas". Aula avulsa continua existindo e
 * continua encontrável (§4) — pela busca, pela navegação e pela faixa de
 * novidades —, ela só deixou de ser a primeira coisa que a área mostra.
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
  }
}

export default function AulasPage() {
  return (
    <AppShell headerTitle="Ensino" headerSubtitle="Trilhas, aulas e revisão">
      <ConteudoDaHome />
      <DocaDeEnsino />
    </AppShell>
  )
}

function ConteudoDaHome() {
  const { user, isAdmin } = useAppShell()
  const podeGerenciar = isAdmin || user?.secondaryRole === 'monitor'

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

  /** Os Módulos (Ciclo Básico, Ciclo Clínico…) com seus tópicos por baixo. */
  const modulos = useMemo(() => {
    const saida: Array<{ _id: string; nome: string; aulas: number; topicos: RamoNaTela[] }> = []
    for (const area of dados?.arvore || []) {
      for (const modulo of area.filhos || []) {
        saida.push({
          _id: modulo._id,
          nome: modulo.nome,
          aulas: modulo.aulasNaArvore,
          topicos: modulo.filhos || [],
        })
      }
    }
    return saida
  }, [dados])

  const vazio =
    !carregando &&
    dados &&
    dados.trilhas.total === 0 &&
    dados.aulasRecentes.length === 0 &&
    modulos.length === 0

  return (
    <div className={`container mx-auto max-w-7xl px-4 ${RESPIRO_DA_DOCA}`}>

      <motion.header
        initial={semMovimento ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="mb-5 flex flex-wrap items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-4xl">
            {dados?.continuar?.length ? 'Bom te ver de volta 👋' : 'O que você quer aprender?'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha uma Trilha e siga um caminho — ou vá direto à aula que você precisa.
          </p>
        </div>

        {podeGerenciar ? (
          <BotaoDuo href="/aulas/gerenciar" tom="claro" tamanho="pequeno" className="flex-none">
            <Settings2 className="h-4 w-4" /> Gerenciar
          </BotaoDuo>
        ) : null}
      </motion.header>

      {/* ── As fichas do topo (§27) ─────────────────────────────────
          Números reais do progresso da pessoa. Nada de moeda inventada:
          o que aparece aqui é aula concluída, tempo estudado e Trilha
          fechada — as três coisas que o sistema sabe de verdade. */}
      {dados?.estatisticas && dados.logado ? (
        <motion.div
          initial={semMovimento ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 320, damping: 30 }}
          className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          <FichaDeEstatistica
            valor={dados.estatisticas.aulasConcluidas}
            rotulo="aulas concluídas"
            icone={Flame}
            tom="fogo"
          />
          <FichaDeEstatistica
            valor={
              dados.estatisticas.minutosEstudados >= 60
                ? Math.round(dados.estatisticas.minutosEstudados / 60)
                : dados.estatisticas.minutosEstudados
            }
            sufixo={dados.estatisticas.minutosEstudados >= 60 ? 'h' : 'min'}
            rotulo="estudadas"
            icone={Clock}
            tom="primario"
          />
          <FichaDeEstatistica
            valor={dados.estatisticas.trilhasEmCurso}
            rotulo="trilhas em curso"
            icone={Route}
            tom="primario"
          />
          <FichaDeEstatistica
            valor={dados.estatisticas.trilhasConcluidas}
            rotulo="trilhas dominadas"
            icone={Trophy}
            tom="ouro"
          />
        </motion.div>
      ) : null}

      {carregando ? (
        <div className="space-y-10">
          <EsqueletoDeFaixa />
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
          {/* ── Continue estudando (§12) ────────────────────────────── */}
          {dados?.continuar?.length ? (
            <ItemDaCascata>
              <TituloDaFaixa titulo="Continue estudando" icone={Play} />
              <div className="grid gap-3 lg:grid-cols-2">
                {dados.continuar.slice(0, 4).map((item) => (
                  <CartaoDeRetomada key={item.aulaId} item={item} />
                ))}
              </div>
            </ItemDaCascata>
          ) : null}

          {/* ── Trilhas em curso ────────────────────────────────────── */}
          {dados?.trilhas.emCurso.length ? (
            <section>
              <TituloDaFaixa
                titulo="Suas Trilhas"
                descricao="Caminhos que você já começou"
                icone={Route}
                href="/aulas/trilhas"
              />
              <Trilho>
                {dados.trilhas.emCurso.map((trilha) => (
                  <CartaoDeTrilha key={trilha._id} trilha={trilha} />
                ))}
              </Trilho>
            </section>
          ) : null}

          {/* ── Recomendadas ────────────────────────────────────────── */}
          {dados?.trilhas.recomendadas.length ? (
            <section>
              <TituloDaFaixa
                titulo={dados.trilhas.emCurso.length ? 'Para começar agora' : 'Trilhas de Ensino'}
                descricao="Do que você precisa saber primeiro até dominar o assunto"
                icone={Sparkles}
                href="/aulas/trilhas"
              />
              <Trilho>
                {dados.trilhas.recomendadas.map((trilha) => (
                  <CartaoDeTrilha key={trilha._id} trilha={trilha} />
                ))}
              </Trilho>
            </section>
          ) : null}

          {/* ── Explorar por etapa da Medicina (§13, §14) ───────────── */}
          {modulos.length > 0 ? (
            <section>
              <TituloDaFaixa
                titulo="Explore por etapa"
                descricao="Ciclo Básico, Ciclo Clínico e o que vier depois"
                icone={Compass}
                href="/aulas/explorar"
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {modulos.map((modulo) => (
                  <Link
                    key={modulo._id}
                    href={`/aulas/explorar?no=${modulo._id}`}
                    className={cn(
                      'group rounded-3xl bg-card p-4 ring-1 ring-border/70',
                      'shadow-[0_4px_0_rgb(0_0_0/0.12)] transition-[transform,box-shadow] duration-150',
                      'hover:-translate-y-0.5 hover:ring-primary/40 active:translate-y-[3px] active:shadow-none',
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-heading text-base font-extrabold tracking-tight transition group-hover:text-primary">
                        {modulo.nome}
                      </h3>
                      <span className="flex-none text-xs font-medium tabular-nums text-muted-foreground">
                        {modulo.aulas} {modulo.aulas === 1 ? 'aula' : 'aulas'}
                      </span>
                    </div>
                    {modulo.topicos.length > 0 ? (
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                        {modulo.topicos.map((t) => t.nome).join(' · ')}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* ── Novas Trilhas ───────────────────────────────────────── */}
          {dados && dados.trilhas.novas.length > 0 && dados.trilhas.total > 3 ? (
            <section>
              <TituloDaFaixa titulo="Novas Trilhas" href="/aulas/trilhas" />
              <Trilho>
                {dados.trilhas.novas.map((trilha) => (
                  <CartaoDeTrilha key={`nova-${trilha._id}`} trilha={trilha} />
                ))}
              </Trilho>
            </section>
          ) : null}

          {/* ── Aulas recentes (avulsas continuam existindo — §4) ───── */}
          {dados?.aulasRecentes.length ? (
            <section>
              <TituloDaFaixa
                titulo="Aulas recentes"
                descricao="O que entrou no acervo por último"
                href="/aulas/explorar"
                hrefLabel="Ver o acervo"
              />
              <Trilho>
                {dados.aulasRecentes.map((aula) => (
                  <CartaoDeAula key={aula._id} aula={aula} />
                ))}
              </Trilho>
            </section>
          ) : null}

          {/* ── Revisão (§16) ───────────────────────────────────────── */}
          {dados?.revisar.concluidas ? (
            <section>
              <Link
                href="/aulas/revisar"
                className={cn(
                  'group flex items-center gap-4 rounded-3xl bg-card p-5 ring-1 ring-border/70',
                  'shadow-[0_4px_0_rgb(0_0_0/0.12)] transition-[transform,box-shadow] duration-150',
                  'hover:-translate-y-0.5 hover:ring-primary/40 active:translate-y-[3px] active:shadow-none',
                )}
              >
                <span className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <RotateCcw className="h-6 w-6" strokeWidth={2.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-lg font-extrabold tracking-tight">
                    Revisar o que você estudou
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {dados.revisar.concluidas}{' '}
                    {dados.revisar.concluidas === 1 ? 'aula concluída' : 'aulas concluídas'} — com
                    resumo, PDF e flashcards
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 flex-none text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </section>
          ) : null}
        </Cascata>
      )}
    </div>
  )
}

/**
 * A retomada, com o contexto da Trilha (§12).
 *
 * O cartão antigo dizia só o nome da aula. Este diz a Trilha, a etapa e o
 * quanto falta — que é o que faz alguém voltar. "Continuar de 08:24" sozinho
 * não lembra a pessoa do que ela estava construindo.
 */
function CartaoDeRetomada({ item }: { item: ItemDeContinuidade }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex gap-3 overflow-hidden rounded-3xl bg-card p-3 ring-1 ring-border/70',
        'shadow-[0_4px_0_rgb(0_0_0/0.12)] transition-[transform,box-shadow] duration-150',
        'hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgb(0_0_0/0.14)] hover:ring-primary/40',
        'active:translate-y-[3px] active:shadow-none',
      )}
    >
      <div className="relative aspect-video w-32 flex-none overflow-hidden rounded-2xl bg-muted sm:w-40">
        {item.capa?.imagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.capa.imagem} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-transparent"
            style={item.capa?.cor ? { backgroundColor: item.capa.cor } : undefined}
          >
            <Play className="h-5 w-5 text-primary" />
          </div>
        )}
        {/* O play sobre a capa: o gesto de "voltar ao vídeo" precisa de um
            alvo óbvio, não de um cartão inteiro que talvez seja clicável. */}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/95 text-primary-foreground shadow-[0_3px_0_rgb(0_0_0/0.3)] transition group-hover:scale-110">
            <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
          </span>
        </span>
        <BarraDeProgresso
          percentual={item.percentual}
          className="absolute inset-x-0 bottom-0 rounded-none bg-black/40"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {item.trilha ? (
          <p className="truncate text-[11px] font-extrabold uppercase tracking-wide text-primary">
            {item.trilha.titulo}
          </p>
        ) : item.localizacao ? (
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {item.localizacao}
          </p>
        ) : null}

        <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug transition group-hover:text-primary">
          {item.titulo}
        </h3>

        <p className="mt-1 truncate text-xs text-muted-foreground">
          {item.trilha
            ? `${item.trilha.etapa} · ${item.trilha.concluidos} de ${item.trilha.total} aulas`
            : item.retomarLabel}
        </p>
      </div>

      {item.trilha ? (
        <AnelDeProgresso
          percentual={item.trilha.percentual}
          tamanho={40}
          className={cn('self-center', 'hidden sm:block')}
        />
      ) : null}
    </Link>
  )
}
