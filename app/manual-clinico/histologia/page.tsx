import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Columns2,
  FlaskConical,
  Layers,
  Library,
  ListChecks,
  Microscope,
  Search,
  Stethoscope,
  Target,
  Timer,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { BuscaDaHistologia } from '@/components/histologia/busca'
import { ContinuarEstudando } from '@/components/histologia/continuar'
import { LogoDaHistologia } from '@/components/histologia/marca'
import { MapaCurricular } from '@/components/histologia/mapa-curricular'
import { setorDe, tema } from '@/components/histologia/tema'
import { VitrineDaHistologia } from '@/components/histologia/vitrine'
import { verificarAcessoAHistologia } from '@/lib/histologia/acesso'
import type { NoCurriculo } from '@/lib/histologia/esquemas'
import { MODULOS_DE_LABORATORIO } from '@/lib/histologia/laboratorio'
import { AVISO_EDUCACIONAL, CREDITO_BASE } from '@/lib/histologia/licenca'
import { LARGURA_LAMINA, LARGURA_PREVIA, urlDaMidia, urlOtimizada } from '@/lib/histologia/midia'
import {
  CURRICULO,
  RESUMO_DE_QUIZZES,
  RESUMO_DE_QUIZZES_PROPRIOS,
  TOTAIS,
  obterFragmento,
  obterPagina,
} from '@/lib/histologia/repositorio'
import { BASE, rotaDaPagina } from '@/lib/histologia/seo'
import { montarVitrine } from '@/lib/histologia/vitrine'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { rotaDoAtlas, rotaDosMecanismos } from '@/lib/histopatologia/rotas'
import { TOTAIS as TOTAIS_DA_PATOLOGIA } from '@/lib/histopatologia/repositorio'

/**
 * Home do Manual da Histologia.
 *
 * ## A regra que orienta o desenho desta página
 *
 * A home não é o lugar de explicar o módulo — é o lugar de **entrar nele**.
 * Quem chega aqui quer uma de seis coisas: continuar de onde parou, achar uma
 * estrutura específica, escolher um assunto, treinar, entender por que a lâmina
 * tem aquela cara, ou ver o que dá errado naquele tecido. A página é
 * literalmente essa lista, nessa ordem, e cada item é uma superfície visual —
 * capa de lâmina, número, ícone — em vez de um parágrafo que precisa ser lido
 * para revelar para onde leva.
 *
 * ## As duas metades do Manual
 *
 * A Histopatologia é a sexta, e por muito tempo foi a única sem lugar próprio:
 * vivia como duas fichas no rodapé de "Escolher o assunto", abaixo da gaveta
 * fechada do currículo — três telas de rolagem depois do topo. O relato foi
 * direto: "está muito escondido".
 *
 * Ela agora aparece em quatro alturas desta página, cada uma para um momento
 * distinto de decisão: um botão no hero (quem já sabe o que quer), o
 * passo 4 do fluxo (quem está entendendo o percurso), a seção própria logo
 * depois dos assuntos (quem está escolhendo o que estudar) e a ponte na busca
 * (quem procurou uma doença num índice que só tem tecido normal). Fora daqui, a
 * barra de seções do módulo a mantém a um clique de qualquer lâmina.
 *
 * Todas as quatro somem juntas quando `histopatologiaHabilitada()` é falso:
 * anunciar uma área que responde 404 é pior do que não anunciá-la.
 *
 * O texto longo não sumiu: desceu para onde ele é útil. O panorama de cada
 * setor vive na landing do setor, o resumo de cada quiz na página do quiz, o
 * currículo inteiro numa gaveta que abre num clique. Nada foi retirado do
 * módulo — só tirado do caminho de quem ainda está decidindo.
 *
 * Componente de servidor: tudo aqui é composição sobre dados estáticos. Só duas
 * ilhas são de cliente — busca e "continuar estudando" — porque só elas têm
 * estado. Os indicadores vêm de `TOTAIS`, calculado do currículo real: números
 * decorativos numa home de estudo são a primeira coisa que o aluno descobre
 * serem falsos.
 */

/**
 * A home lê a sessão — é ela que decide entre o módulo e a vitrine — então não
 * há o que pré-renderizar. As demais páginas da árvore mantêm seu ISR: elas
 * redirecionam para cá quando o acesso falta, sem depender de cache.
 */
export const dynamic = 'force-dynamic'

/** Lâmina de abertura: a primeira do currículo que tem imagem e crédito. */
const ROTA_HERO = ['histologia-basica', 'preparacao-do-tecido', 'tissue-preparation-1']

export default async function HomeDaHistologia() {
  // Primeira linha, antes de tocar no repositório: sem acesso, o que esta rota
  // serve é a landing de vendas — na mesma URL, para o link continuar valendo e
  // o buscador ter o que indexar.
  const acesso = await verificarAcessoAHistologia()
  if (!acesso.liberado) {
    const dados = await montarVitrine()
    return (
      // `guestNotice` desligado: o aviso flutuante do shell fala de catálogo e
      // download, fora de contexto aqui, e cobre a barra de compra no celular.
      // A landing já explica, no lugar certo, o que está trancado e como abrir.
      <AppShell allowGuest showHeader={false} guestNotice={false}>
        <VitrineDaHistologia
          acesso={{
            autenticado: acesso.autenticado,
            motivo:
              acesso.motivo === 'indisponivel'
                ? 'indisponivel'
                : acesso.autenticado
                  ? 'locked'
                  : 'guest',
            produto: acesso.produto
              ? {
                  label: acesso.produto.label,
                  ctaText: acesso.produto.ctaText,
                  isActive: acesso.produto.isActive,
                  currentPrice: acesso.produto.currentPrice,
                  price: acesso.produto.price,
                  hasActivePromotion: acesso.produto.hasActivePromotion,
                  pricingEventId: acesso.produto.pricingEventId ?? null,
                  plans: acesso.produto.plans.map((plano) => ({
                    key: plano.key,
                    label: plano.label,
                    durationMonths: plano.durationMonths,
                    price: plano.price,
                    enabled: plano.enabled,
                    pricingEventId: plano.pricingEventId,
                  })),
                }
              : null,
          }}
          dados={dados}
        />
      </AppShell>
    )
  }

  const hero = await obterPagina(ROTA_HERO)
  // O hero é a primeira imagem que o aluno vê no módulo; é ela que define a
  // impressão de velocidade da home inteira.
  const urlHero = urlOtimizada(hero?.base ? urlDaMidia(hero.base) : null, LARGURA_LAMINA)
  const capas = await capasDosSetores(CURRICULO, hero?.base?.sha256)
  /*
   * A área de patologia pode estar fechada no ambiente (ver
   * `lib/histopatologia/direitos.ts`). Quando está, a home não anuncia nada dela
   * — botão do hero, quarto passo e seção somem juntos, em vez de levarem a um
   * 404 que o aluno interpretaria como defeito.
   */
  const comPatologia = histopatologiaHabilitada()

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

          <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-8 pt-6">
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

                {/* Uma frase. O que este módulo é, sem preâmbulo — os números
                    ficam nas fichas abaixo, onde são varridos em vez de lidos. */}
                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Lâminas reais num microscópio virtual. Você acende as estruturas sobre a imagem,
                  uma a uma, até saber achá-las sozinho — e, quando o normal estiver firme, vê o
                  mesmo tecido doente na Histopatologia.
                </p>

                {/* As portas de entrada do módulo, lado a lado. A
                    Histopatologia é uma delas de propósito: ela é metade do
                    Manual, e ficava a três telas de rolagem de distância. */}
                <div className="mt-6 flex flex-wrap gap-2.5">
                  <Link
                    href={rotaDaPagina(ROTA_HERO)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-teal-700 px-5 text-sm font-bold text-white transition-colors hover:bg-teal-800"
                  >
                    <Microscope className="h-4 w-4" aria-hidden />
                    Ver uma lâmina agora
                  </Link>
                  <Link
                    href={`${BASE}/atlas`}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-card px-5 text-sm font-bold transition-colors hover:border-teal-600/50"
                  >
                    <Search className="h-4 w-4" aria-hidden />
                    Buscar estrutura
                  </Link>
                  {comPatologia && (
                    <Link
                      href={`${BASE}/histopatologia`}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-rose-500/45 bg-card px-5 text-sm font-bold text-rose-700 transition-colors hover:border-rose-500 hover:bg-rose-500/10 dark:text-rose-300"
                    >
                      <Stethoscope className="h-4 w-4" aria-hidden />
                      Ir para Histopatologia
                    </Link>
                  )}
                </div>

                {/* Busca instantânea: o atalho de quem já sabe o nome do que
                    procura, no alcance do polegar e não no fim da rolagem. */}
                <div className="mt-5 max-w-xl">
                  <BuscaDaHistologia pontePatologica={comPatologia} />
                </div>
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
                    {/* Crédito mínimo na imagem; o completo vive na gaveta de
                        créditos de cada lâmina, a um clique. Repetir a
                        atribuição inteira em toda superfície não cumpre melhor
                        a licença — só rouba espaço do conteúdo. */}
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                      Acervo VCU · CC BY-NC-SA 4.0
                    </p>
                  </figcaption>
                </figure>
              )}
            </div>

            <ul className="mt-7 flex flex-wrap items-center gap-2.5 text-xs">
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
              {/* Quem chega aqui já passou pelo portão do layout — este selo
                  confirma o acesso em vez de anunciar um preço. */}
              <li className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 font-bold text-amber-800 dark:text-amber-300">
                Seu acesso está liberado
              </li>
            </ul>
          </div>
        </header>

        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* ══════════ Continuar estudando ══════════
              Primeiro de tudo, e só para quem já tem o que continuar. Quem
              volta não deveria ter que reencontrar a página onde parou. */}
          <ContinuarEstudando />

          {/* ══════════ O fluxo, do normal à doença ══════════ */}
          <ComoEstudar comPatologia={comPatologia} />

          {/* ══════════ Escolher o assunto ══════════ */}
          <EscolherAssunto capas={capas} />

          {/* ══════════ A outra metade: Histopatologia ══════════
              Seção própria, logo depois dos assuntos — e não duas fichas no
              rodapé da seção anterior, onde ninguém achava. */}
          {comPatologia && <Histopatologia />}

          {/* ══════════ Treinar e entender a lâmina ══════════ */}
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* ── Quizzes ── */}
            <section aria-labelledby="quizzes">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="editorial-mark mb-2">Treinar</p>
                  <h2 id="quizzes" className="font-heading text-xl font-semibold tracking-tight">
                    {TOTAIS.quizzes} quizzes de identificação
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {TOTAIS.questoes} questões sobre fotomicrografias reais, em modo prática ou
                    prova.
                  </p>
                </div>
                <Link
                  href={`${BASE}/quizzes`}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border bg-card px-3.5 text-xs font-bold transition-colors hover:border-rose-500/50"
                >
                  Ver todos <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {/* Uma amostra das duas pilhas: quem chega aqui precisa ver que
                    existem os dois recortes, o amplo e o do tema. */}
                {[...RESUMO_DE_QUIZZES.slice(0, 2), ...RESUMO_DE_QUIZZES_PROPRIOS.slice(0, 2)].map(
                  (quiz) => (
                    <li key={quiz.slug}>
                      <Link
                        href={`${BASE}/quizzes/${quiz.slug}`}
                        className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:border-rose-500/45"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{quiz.titulo}</span>
                          <span className="block truncate text-[10px] text-muted-foreground">
                            {quiz.autoria === 'proprio' ? quiz.trilha : 'Quiz do acervo'}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {quiz.questoes} q.
                        </span>
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </section>

            {/* ── Laboratório ── */}
            <section aria-labelledby="laboratorios">
              <div className="mb-4">
                <p className="editorial-mark mb-2">Entender a lâmina</p>
                <h2 id="laboratorios" className="font-heading text-xl font-semibold tracking-tight">
                  Laboratório virtual
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Quase todo erro de identificação é, na verdade, erro de leitura do processamento.
                </p>
              </div>
              <ul className="grid gap-2">
                {MODULOS_DE_LABORATORIO.map((modulo) => (
                  <li key={modulo.id}>
                    <Link
                      href={`${BASE}/laboratorio/${modulo.id}`}
                      className="group flex min-h-[44px] items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-rose-500/45"
                    >
                      <FlaskConical
                        className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">
                        {modulo.titulo}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                        <Timer className="h-3 w-3" aria-hidden />
                        {modulo.minutos} min
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

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

/**
 * O fluxo do módulo, em quatro passos.
 *
 * O aluno que abre o Manual pela primeira vez não sabe o que é "atlas",
 * "laboratório" e "quiz" *neste* contexto, e a home antiga o obrigava a inferir
 * isso de seis blocos de prosa. Esta faixa diz a sequência inteira em quatro
 * frases curtas, com o passo numerado e a seta explícita — e cada passo é um
 * link, para quem já sabe entrar direto no que quer.
 *
 * O quarto passo é a Histopatologia, e ele está aqui por um motivo específico:
 * enquanto ela era um par de cartões no rodapé da seção de assuntos, o aluno
 * não tinha como saber que a doença fazia parte do percurso deste módulo. Um
 * passo numerado diz o que dois cartões escondidos não diziam — que estudar o
 * normal é meio caminho, e o outro meio tem endereço.
 *
 * As cores não são decoração: repetem a convenção do módulo (petróleo para o
 * instrumento, hematoxilina para estrutura, eosina para avaliação e para a
 * patologia), então os passos 3 e 4 são rosa aqui — e o quiz e a Histopatologia
 * continuam rosa em toda parte.
 */
function ComoEstudar({ comPatologia }: { comPatologia: boolean }) {
  return (
    <section aria-labelledby="como-estudar" className="mt-8">
      <p className="editorial-mark mb-2">Como funciona</p>
      <h2 id="como-estudar" className="mb-4 font-heading text-xl font-semibold tracking-tight">
        {comPatologia ? 'Do tecido normal à doença, em quatro passos' : 'Três passos, do assunto ao acerto'}
      </h2>

      {/*
        Quatro passos não cabem numa fileira única em tablet sem espremer o
        texto de cada um a duas palavras. Abaixo de `lg` a faixa vira grade de
        dois, e as setas — que só fazem sentido numa sequência horizontal —
        somem junto.
      */}
      <ol
        className={`grid items-stretch gap-2.5 sm:grid-cols-2 ${
          comPatologia
            ? 'lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]'
            : 'lg:grid-cols-[1fr_auto_1fr_auto_1fr]'
        }`}
      >
        <Passo
          n={1}
          cor="petroleo"
          icone={<Layers className="h-5 w-5" aria-hidden />}
          titulo="Escolha o assunto"
          texto="Quatro setores, do preparo da lâmina ao órgão inteiro."
          destino="#assunto"
          acao="Ver os setores"
        />
        <Seta />
        <Passo
          n={2}
          cor="hematoxilina"
          icone={<Microscope className="h-5 w-5" aria-hidden />}
          titulo="Estude no microscópio"
          texto="Aproxime, ande pela lâmina e acenda cada estrutura marcada."
          destino={rotaDaPagina(ROTA_HERO)}
          acao="Abrir uma lâmina"
        />
        <Seta />
        <Passo
          n={3}
          cor="eosina"
          icone={<ListChecks className="h-5 w-5" aria-hidden />}
          titulo="Teste o que fixou"
          texto="Modo prática com devolutiva na hora, ou prova com relatório de erros."
          destino={`${BASE}/quizzes`}
          acao="Fazer um quiz"
        />
        {comPatologia && (
          <>
            <Seta />
            <Passo
              n={4}
              cor="eosina"
              icone={<Stethoscope className="h-5 w-5" aria-hidden />}
              titulo="Veja o que dá errado"
              texto="O mesmo tecido depois da agressão: mecanismo, achado na lâmina e sintoma."
              destino={`${BASE}/histopatologia`}
              acao="Abrir a Histopatologia"
            />
          </>
        )}
      </ol>
    </section>
  )
}

function Passo({
  n,
  cor,
  icone,
  titulo,
  texto,
  destino,
  acao,
}: {
  n: number
  cor: Parameters<typeof tema>[0]
  icone: React.ReactNode
  titulo: string
  texto: string
  destino: string
  acao: string
}) {
  const t = tema(cor)
  return (
    <li>
      <Link
        href={destino}
        className={`group flex h-full flex-col histologia-cartao p-4 transition-colors ${t.hover}`}
      >
        <span className="mb-2.5 flex items-center gap-2.5">
          <span
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-heading text-sm font-black ${t.fundo} ${t.texto}`}
          >
            {n}
          </span>
          <span className={t.texto}>{icone}</span>
        </span>
        <span className="block text-sm font-bold leading-snug">{titulo}</span>
        <span className="mt-1 block flex-1 text-xs leading-relaxed text-muted-foreground">
          {texto}
        </span>
        <span className={`mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold ${t.texto}`}>
          {acao}
          <ArrowRight
            className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </Link>
    </li>
  )
}

/** Conector entre os passos. Some fora da fileira única, onde a grade já é a sequência. */
function Seta() {
  return (
    <li aria-hidden className="hidden items-center justify-center lg:flex">
      <ArrowRight className="h-4 w-4 text-muted-foreground/40" aria-hidden />
    </li>
  )
}

/**
 * Escolha do assunto.
 *
 * Os quatro setores viram capas — a lâmina de abertura de cada um, o número da
 * ordem sugerida e a contagem real. Uma imagem de tecido conjuntivo diz em
 * meio segundo o que três linhas de texto levariam dez para dizer, e a ordem
 * numerada resolve a pergunta "por onde eu começo" sem uma seção separada de
 * trilhas repetindo os mesmos destinos.
 *
 * O mapa curricular inteiro continua aqui, na gaveta abaixo: 1.524 nós abertos
 * de saída eram justamente o "tem que procurar muito". Fechada, ela custa uma
 * linha; aberta, entrega a hierarquia completa, sem nada achatado.
 */
function EscolherAssunto({ capas }: { capas: Record<string, string> }) {
  return (
    <section aria-labelledby="titulo-assunto" id="assunto" className="mt-12 scroll-mt-4">
      <p className="editorial-mark mb-2">Histologia normal</p>
      <h2 id="titulo-assunto" className="font-heading text-xl font-semibold tracking-tight">
        Escolha o assunto
      </h2>
      <p className="mb-4 mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Na ordem sugerida — cada setor abre com suas lâminas e o panorama do assunto.
      </p>

      {/* Duas colunas já no celular: quatro capas empilhadas em largura cheia
          transformavam a decisão mais importante da home em rolagem. */}
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CURRICULO.map((setor, i) => {
          const t = tema(setorDe(setor.caminho).cor)
          const capa = capas[setor.slug]
          const chamada =
            PERCURSO.find((p) => p.destino[0] === setor.slug)?.chamada ??
            setorDe(setor.caminho).resumo
          return (
            <li key={setor.slug}>
              <Link
                href={rotaDaPagina(setor.caminho)}
                className={`group flex h-full flex-col overflow-hidden histologia-cartao transition-colors ${t.hover}`}
              >
                <span className="relative block aspect-[16/10] overflow-hidden bg-[#0d1210]">
                  {capa ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={capa}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 24vw"
                      className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center">
                      <Microscope className="h-6 w-6 text-white/20" aria-hidden />
                    </span>
                  )}
                  {/* Fundo opaco, não translúcido: sobre uma fotomicrografia
                      escura, `bg-…/10` deixava o número da ordem ilegível. */}
                  <span
                    className={`absolute left-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-card font-heading text-xs font-black shadow-sm ${t.borda} ${t.texto}`}
                  >
                    {i + 1}
                  </span>
                </span>
                <span className="flex flex-1 flex-col p-3.5">
                  <span className="block font-heading text-base font-semibold leading-snug">
                    {setor.titulo}
                  </span>
                  <span className="mt-1 block flex-1 text-xs leading-relaxed text-muted-foreground">
                    {chamada}
                  </span>
                  <span className="mt-2.5 flex items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
                    <span>
                      {setor.laminas} lâminas · {setor.estruturas} estruturas
                    </span>
                    <ArrowRight
                      className={`h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 ${t.texto}`}
                      aria-hidden
                    />
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Currículo completo, fechado por padrão */}
      <details className="group mt-3 histologia-cartao">
        <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 p-4 marker:hidden">
          <span className="min-w-0">
            <span className="block text-sm font-bold">Ver o currículo completo</span>
            <span className="block text-xs leading-relaxed text-muted-foreground">
              A árvore inteira: {TOTAIS.subsetores} assuntos e todas as subseções, na ordem do
              catálogo.
            </span>
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="border-t border-border p-3">
          <MapaCurricular setores={CURRICULO} />
        </div>
      </details>
    </section>
  )
}

/**
 * A outra metade do Manual: a Histopatologia.
 *
 * ## Por que ela virou seção própria
 *
 * Ela existia — como duas fichas pequenas no rodapé de "Escolher o assunto",
 * **abaixo** da gaveta fechada do currículo. Quem não abrisse a gaveta nem
 * rolasse até o fim da seção mais longa da home simplesmente não descobria que
 * o módulo tem uma área de anatomia patológica. O sintoma relatado foi
 * literalmente esse: "está muito escondido".
 *
 * A correção não é um cartão maior no mesmo lugar; é tirar a área do rodapé de
 * outra seção e dar a ela o mesmo tratamento que a Histologia normal recebe —
 * marca editorial, título, números reais e as quatro portas de entrada que a
 * home da própria Histopatologia oferece. Somada ao botão do hero, ao passo 4
 * do fluxo, à ponte da busca e à barra de seções, a área deixa de depender de
 * um único acesso — e ele escondido.
 *
 * Os números vêm de `TOTAIS` da Histopatologia, o mesmo relatório do pipeline
 * que a home dela usa — e não de constantes escritas aqui, que envelheceriam na
 * primeira reingestão e contradiriam a página de destino.
 */
function Histopatologia() {
  return (
    <section aria-labelledby="titulo-patologia" id="patologia" className="mt-12 scroll-mt-4">
      <p className="editorial-mark mb-2">A outra metade do Manual</p>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="titulo-patologia"
            className="inline-flex items-center gap-2 font-heading text-xl font-semibold tracking-tight"
          >
            <Stethoscope className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden />
            Histopatologia
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Reconhecer doença na lâmina não é decorar adjetivos: é saber qual agressão produziu
            aquela forma. {TOTAIS_DA_PATOLOGIA.doencas} capítulos aprofundados,{' '}
            {TOTAIS_DA_PATOLOGIA.mecanismos} mecanismos gerais e{' '}
            {TOTAIS_DA_PATOLOGIA.sistemas} sistemas — cada um ancorado na lâmina normal
            correspondente.
          </p>
        </div>
        <Link
          href={`${BASE}/histopatologia`}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-rose-500/45 bg-card px-3.5 text-xs font-bold text-rose-700 transition-colors hover:border-rose-500 hover:bg-rose-500/10 dark:text-rose-300"
        >
          Abrir a área <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PortaDaPatologia
          href={`${BASE}/histopatologia`}
          icone={<Stethoscope className="h-5 w-5" aria-hidden />}
          titulo="Começar pela doença"
          texto="Da agressão ao achado na lâmina, e do achado ao sintoma."
          acao="Ver as doenças"
        />
        <PortaDaPatologia
          href={rotaDosMecanismos()}
          icone={<Microscope className="h-5 w-5" aria-hidden />}
          titulo="Por mecanismo"
          texto="Granuloma, trombose, displasia: o mesmo processo em órgãos diferentes."
          acao="Ver os mecanismos"
        />
        <PortaDaPatologia
          href={rotaDoAtlas()}
          icone={<Library className="h-5 w-5" aria-hidden />}
          titulo="Atlas de lâminas"
          texto="Capítulos visuais por sistema, com crédito e proveniência por item."
          acao="Abrir o atlas"
        />
        <PortaDaPatologia
          href={`${BASE}/histopatologia#capitulos`}
          icone={<Columns2 className="h-5 w-5" aria-hidden />}
          titulo="Comparar normal × patológico"
          texto="Cada capítulo abre lado a lado com a lâmina normal e diz o que mudou."
          acao="Ver os capítulos"
        />
      </ul>
    </section>
  )
}

/** Ficha de entrada da Histopatologia. Rosa em toda parte, como o resto da área. */
function PortaDaPatologia({
  href,
  icone,
  titulo,
  texto,
  acao,
}: {
  href: string
  icone: React.ReactNode
  titulo: string
  texto: string
  acao: string
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex h-full min-h-[44px] flex-col histologia-cartao p-4 transition-colors hover:border-rose-500/50"
      >
        <span className="mb-2 block text-rose-600 dark:text-rose-400">{icone}</span>
        <span className="block text-sm font-bold leading-snug">{titulo}</span>
        <span className="mt-1 block flex-1 text-xs leading-relaxed text-muted-foreground">
          {texto}
        </span>
        <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400">
          {acao}
          <ArrowRight
            className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </Link>
    </li>
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
 * Capa de cada setor: a primeira lâmina com imagem do primeiro ramo que tem
 * lâminas.
 *
 * Deriva do catálogo em vez de fixar quatro rotas à mão — quatro caminhos
 * literais a mais seriam quatro 404 silenciosos esperando a próxima reingestão.
 * O ramo escolhido é sempre o primeiro do setor, que é também o fragmento mais
 * leve de cada um: a home carrega quatro fragmentos por revalidação (uma vez
 * por dia), não os vinte e dois.
 *
 * `evitar` recebe o hash da lâmina de abertura. Sem isso, a capa do primeiro
 * setor seria exatamente a imagem que já está no alto da página — a mesma foto
 * duas vezes na mesma tela sugere que as duas levam ao mesmo lugar.
 */
async function capasDosSetores(
  setores: NoCurriculo[],
  evitar?: string,
): Promise<Record<string, string>> {
  const capas: Record<string, string> = {}
  await Promise.all(
    setores.map(async (setor) => {
      const ramo = setor.filhos.find((filho) => filho.laminas > 0)
      if (!ramo) return
      const paginas = await obterFragmento(ramo.caminho)
      const comImagem =
        paginas.find((pagina) => pagina.base && pagina.base.sha256 !== evitar) ??
        paginas.find((pagina) => pagina.base)
      if (!comImagem?.base) return
      // Capa exibida a poucas centenas de pixels: servir a lâmina original de
      // 1 MB em cada uma tornaria a home a página mais pesada do módulo.
      const url = urlOtimizada(urlDaMidia(comImagem.base), LARGURA_PREVIA, 60)
      if (url) capas[setor.slug] = url
    }),
  )
  return capas
}

/**
 * Ordem sugerida e chamada de cada setor.
 *
 * Substitui a antiga seção "Trilhas sugeridas", que apontava para os mesmos
 * três destinos que os cartões de setor já ofereciam — duas listas dizendo a
 * mesma coisa em lugares diferentes é exatamente o que fazia o aluno procurar
 * duas vezes. Aqui a recomendação vira o número no canto da capa.
 *
 * Os destinos são caminhos literais e o teste de rotas falha se algum deles
 * sumir numa reingestão. Setor sem entrada aqui não desaparece da home: cai no
 * resumo do próprio setor.
 */
const PERCURSO: Array<{ destino: string[]; chamada: string }> = [
  {
    destino: ['histologia-basica'],
    chamada: 'Como a peça vira lâmina — e por que metade do que você vê vem daí.',
  },
  {
    destino: ['celulas'],
    chamada: 'A célula ao óptico e ao eletrônico: organelas, superfície e divisão.',
  },
  {
    destino: ['tecidos'],
    chamada: 'Os quatro tecidos fundamentais e os critérios que separam um do outro.',
  },
  {
    destino: ['orgaos-e-sistemas'],
    chamada: 'Como os tecidos se combinam em camadas e padrões, sistema por sistema.',
  },
]
