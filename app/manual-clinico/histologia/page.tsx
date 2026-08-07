import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  Layers,
  ListChecks,
  Microscope,
  Search,
  Target,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { BuscaDaHistologia } from '@/components/histologia/busca'
import { ContinuarEstudando } from '@/components/histologia/continuar'
import { LogoDaHistologia } from '@/components/histologia/marca'
import { MapaCurricular } from '@/components/histologia/mapa-curricular'
import { setorDe, tema } from '@/components/histologia/tema'
import { MODULOS_DE_LABORATORIO } from '@/lib/histologia/laboratorio'
import { AVISO_EDUCACIONAL, CREDITO_BASE } from '@/lib/histologia/licenca'
import { urlDaMidia } from '@/lib/histologia/midia'
import { CURRICULO, RESUMO_DE_QUIZZES, TOTAIS, obterPagina } from '@/lib/histologia/repositorio'
import { BASE, rotaDaPagina } from '@/lib/histologia/seo'

/**
 * Home do Manual da Histologia.
 *
 * Componente de servidor: tudo aqui é composição sobre dados estáticos. Só três
 * ilhas são de cliente — busca, "continuar estudando" e o mapa expansível —
 * porque só elas têm estado. Os indicadores vêm de `TOTAIS`, calculado do
 * currículo real: números decorativos numa home de estudo são a primeira coisa
 * que o aluno descobre serem falsos.
 */

export const revalidate = 86400

/** Lâmina de abertura: a primeira do currículo que tem imagem e crédito. */
const ROTA_HERO = ['histologia-basica', 'preparacao-do-tecido', 'tissue-preparation-1']

export default async function HomeDaHistologia() {
  const hero = await obterPagina(ROTA_HERO)
  const urlHero = hero?.base ? urlDaMidia(hero.base) : null

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        {/* ══════════ HERO ══════════ */}
        <header className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-muted/25" aria-hidden />
          {/* Retícula do micrômetro ocular, esmaecida para as bordas */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.3] dark:opacity-[0.14]"
            aria-hidden
            style={{
              backgroundImage:
                'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              color: 'rgb(0 113 131 / 0.22)',
              maskImage: 'radial-gradient(ellipse 75% 62% at 50% 0%, black, transparent)',
              WebkitMaskImage: 'radial-gradient(ellipse 75% 62% at 50% 0%, black, transparent)',
            }}
          />

          <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-6">
            <Link
              href="/manual-clinico"
              className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar ao Manual Clínico
            </Link>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
              <div>
                <p className="editorial-mark mb-3">Manual Clínico · Atlas de histologia</p>
                <h1 className="sr-only">Manual da Histologia</h1>
                <LogoDaHistologia className="mt-1 h-auto w-full max-w-[190px] sm:max-w-[220px]" />

                <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Reconhecer tecido na lâmina não se aprende lendo — se aprende olhando, com alguém
                  apontando. É isso que este atlas faz: {TOTAIS.laminas.toLocaleString('pt-BR')}{' '}
                  lâminas reais num microscópio virtual, com{' '}
                  {TOTAIS.estruturas.toLocaleString('pt-BR')} estruturas que você acende e apaga
                  sobre a imagem, até saber achá-las sozinho.
                </p>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <Link
                    href={rotaDaPagina(ROTA_HERO)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-teal-700 px-5 text-sm font-bold text-white transition-colors hover:bg-teal-800"
                  >
                    <Microscope className="h-4 w-4" aria-hidden />
                    Abrir microscópio
                  </Link>
                  <Link
                    href={`${BASE}/atlas`}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-card px-5 text-sm font-bold transition-colors hover:border-teal-600/50"
                  >
                    <Search className="h-4 w-4" aria-hidden />
                    Explorar atlas
                  </Link>
                </div>

                <ul className="mt-6 flex flex-wrap items-center gap-2.5 text-xs">
                  <Indicador icone={<Layers className="h-3.5 w-3.5" aria-hidden />}>
                    {TOTAIS.laminas.toLocaleString('pt-BR')} lâminas
                  </Indicador>
                  <Indicador icone={<Target className="h-3.5 w-3.5" aria-hidden />}>
                    {TOTAIS.estruturas.toLocaleString('pt-BR')} estruturas marcadas
                  </Indicador>
                  <Indicador icone={<ListChecks className="h-3.5 w-3.5" aria-hidden />}>
                    {TOTAIS.quizzes} quizzes · {TOTAIS.questoes} questões
                  </Indicador>
                  <Indicador icone={<FlaskConical className="h-3.5 w-3.5" aria-hidden />}>
                    {MODULOS_DE_LABORATORIO.length} laboratórios
                  </Indicador>
                  <li className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                    Gratuito, sem login
                  </li>
                </ul>
              </div>

              {/* Lâmina de abertura, com crédito visível */}
              {urlHero && hero && (
                <figure className="overflow-hidden rounded-xl border border-border bg-[#0d1210] shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urlHero}
                    alt={hero.base!.alt}
                    sizes="(max-width: 1024px) 100vw, 380px"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <figcaption className="bg-card p-3">
                    <p className="text-xs font-semibold">{hero.titulo}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                      Digital Histology (Virginia Commonwealth University), CC BY-NC-SA 4.0.
                    </p>
                  </figcaption>
                </figure>
              )}
            </div>

            {/* Busca instantânea */}
            <div className="mt-8 max-w-2xl">
              <BuscaDaHistologia />
            </div>
          </div>
        </header>

        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* ══════════ Continuar estudando ══════════ */}
          <ContinuarEstudando />

          {/* ══════════ Mapa curricular ══════════ */}
          <section aria-labelledby="mapa" className="mt-10">
            <div className="mb-4">
              <p className="editorial-mark mb-2">Currículo completo</p>
              <h2 id="mapa" className="font-heading text-xl font-semibold tracking-tight">
                Da preparação da lâmina ao órgão inteiro
              </h2>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Quatro setores, {TOTAIS.subsetores} assuntos e{' '}
                {TOTAIS.laminas.toLocaleString('pt-BR')} lâminas, na ordem do catálogo. A hierarquia
                é preservada inteira — nada foi achatado para caber numa grade.
              </p>
            </div>
            <MapaCurricular setores={CURRICULO} />
          </section>

          {/* ══════════ Laboratórios ══════════ */}
          <section aria-labelledby="laboratorios" className="mt-12">
            <div className="mb-4">
              <p className="editorial-mark mb-2">Laboratório virtual</p>
              <h2 id="laboratorios" className="font-heading text-xl font-semibold tracking-tight">
                Por que a lâmina tem essa cara
              </h2>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Quase todo erro de identificação é, na verdade, um erro de leitura do processamento.
                Estes módulos percorrem o caminho da peça até a lâmina e ensinam a reconhecer o que
                é tecido e o que é artefato.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MODULOS_DE_LABORATORIO.map((modulo) => (
                <li key={modulo.id}>
                  <Link
                    href={`${BASE}/laboratorio/${modulo.id}`}
                    className="group flex h-full min-h-[44px] flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-rose-500/45"
                  >
                    <FlaskConical className="mb-2 h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden />
                    <p className="text-sm font-bold leading-snug">{modulo.titulo}</p>
                    <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                      {modulo.resumo}
                    </p>
                    <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400">
                      Abrir módulo
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* ══════════ Quizzes ══════════ */}
          <section aria-labelledby="quizzes" className="mt-12">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="editorial-mark mb-2">Avaliação</p>
                <h2 id="quizzes" className="font-heading text-xl font-semibold tracking-tight">
                  {TOTAIS.quizzes} quizzes de identificação
                </h2>
                <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {TOTAIS.questoes} questões sobre fotomicrografias reais, em modo prática (com
                  devolutiva imediata) ou prova (sem rótulos, com relatório de erros por assunto).
                </p>
              </div>
              <Link
                href={`${BASE}/quizzes`}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border bg-card px-3.5 text-xs font-bold transition-colors hover:border-rose-500/50"
              >
                Ver todos <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {RESUMO_DE_QUIZZES.slice(0, 6).map((quiz) => (
                <li key={quiz.slug}>
                  <Link
                    href={`${BASE}/quizzes/${quiz.slug}`}
                    className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:border-rose-500/45"
                  >
                    <span className="text-sm font-semibold">{quiz.titulo}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {quiz.questoes} questões
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* ══════════ Trilhas sugeridas ══════════ */}
          <section aria-labelledby="trilhas" className="mt-12">
            <div className="mb-4">
              <p className="editorial-mark mb-2">Por onde começar</p>
              <h2 id="trilhas" className="font-heading text-xl font-semibold tracking-tight">
                Trilhas sugeridas
              </h2>
            </div>
            <ol className="grid gap-3 sm:grid-cols-3">
              {TRILHAS.map((trilha, i) => {
                const cor = tema(setorDe(trilha.destino).cor)
                return (
                  <li key={trilha.titulo}>
                    <Link
                      href={rotaDaPagina(trilha.destino)}
                      className={`group flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors ${cor.hover}`}
                    >
                      <span className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${cor.fundo} ${cor.texto}`}>
                        {i + 1}
                      </span>
                      <p className="text-sm font-bold leading-snug">{trilha.titulo}</p>
                      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                        {trilha.porque}
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </section>

          {/* ══════════ Créditos ══════════ */}
          <footer className="mt-14 border-t border-border pt-6">
            <p className="text-xs leading-relaxed text-muted-foreground">{CREDITO_BASE}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {AVISO_EDUCACIONAL} Créditos específicos, proveniência e hash de cada imagem ficam a
              um clique, no rodapé de cada lâmina.
            </p>
          </footer>
        </div>
      </div>
    </AppShell>
  )
}

function Indicador({ icone, children }: { icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-bold text-muted-foreground">
      <span className="text-teal-700 dark:text-teal-400">{icone}</span>
      {children}
    </li>
  )
}

/**
 * Trilhas de entrada. Apontam para nós que existem no currículo — verificado
 * pelo teste de rotas, que falha se algum destino sumir numa reingestão.
 */
const TRILHAS: Array<{ titulo: string; porque: string; destino: string[] }> = [
  {
    titulo: 'Comece pela preparação',
    porque:
      'Antes de reconhecer tecido, entenda por que a imagem tem essa aparência: fixação, inclusão, corte e coloração explicam metade do que você vai ver.',
    destino: ['histologia-basica', 'preparacao-do-tecido'],
  },
  {
    titulo: 'Domine os quatro tecidos',
    porque:
      'Epitelial, conjuntivo, muscular e nervoso. Todo órgão é uma combinação deles — quem separa os quatro com segurança lê qualquer lâmina.',
    destino: ['tecidos'],
  },
  {
    titulo: 'Monte um órgão inteiro',
    porque:
      'Com os tecidos na mão, veja como eles se organizam em camadas e padrões reconhecíveis, sistema por sistema.',
    destino: ['orgaos-e-sistemas'],
  },
]
