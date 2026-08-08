'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  BookMarked,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FlaskConical,
  ListChecks,
  Pencil,
  Star,
  Target,
} from 'lucide-react'

import { descricaoDaLamina, type DescricaoDeLamina } from '@/lib/histologia/laminas'
import type { Overlay, Pagina } from '@/lib/histologia/esquemas'
import { COLORACOES } from '@/lib/histologia/glossario'
import { useProgresso } from '@/lib/histologia/progresso'
import { BASE, rotaDaPagina } from '@/lib/histologia/rotas'
import { registrarEvento } from '@/lib/histologia/analitica'
import { Creditos, EstadoEditorial, TermoNoOriginal } from './marca'
import { setorDe, tema } from './tema'

/**
 * O microscópio só é carregado quando a lâmina aparece.
 *
 * São ~14 KB de lógica de gestos, zoom e camadas que não servem para nada nas
 * páginas de seção nem enquanto o aluno lê o resumo. `ssr: false` porque o
 * componente depende de `ResizeObserver` e das dimensões naturais da imagem —
 * coisas que só existem no navegador; renderizá-lo no servidor produziria um
 * palco de tamanho zero e um salto de layout ao hidratar.
 */
const Microscopio = dynamic(() => import('./microscopio'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[4/3] w-full animate-pulse rounded-xl border border-border bg-muted/40" />
  ),
})

export interface LaminaProps {
  pagina: Pagina
  vizinhas: { anterior?: { titulo: string; caminho: string[] }; proxima?: { titulo: string; caminho: string[] } }
  bandeja: Array<{ rota: string; titulo: string; miniatura: Pagina['base'] }>
  quizzes: Array<{ slug: string; titulo: string; questoes: number }>
  /** Camada a destacar na abertura, vinda de `?estrutura=` na busca. */
  estruturaInicial?: string
}

export function Lamina({ pagina, vizinhas, bandeja, quizzes, estruturaInicial }: LaminaProps) {
  const rota = pagina.caminho.join('/')
  const cor = tema(setorDe(pagina.caminho).cor)

  const {
    progresso,
    carregado,
    marcarVisita,
    alternarConcluida,
    alternarFavorito,
    alternarARevisar,
    salvarNota,
  } = useProgresso()

  const [overlaySelecionado, setOverlaySelecionado] = useState<string | null>(
    estruturaInicial ?? null,
  )
  const [filtroDeEstrutura, setFiltroDeEstrutura] = useState('')
  const [nota, setNota] = useState('')
  const [notaCarregada, setNotaCarregada] = useState(false)

  const estruturas = useMemo(
    () => pagina.overlays.filter((o) => o.classe === 'estrutura'),
    [pagina.overlays],
  )

  const estruturasFiltradas = useMemo(() => {
    const termo = filtroDeEstrutura.trim().toLowerCase()
    if (!termo) return estruturas
    const semAcento = (v: string) =>
      v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    const alvo = semAcento(termo)
    return estruturas.filter(
      (o) => semAcento(o.rotulo).includes(alvo) || semAcento(o.rotuloOriginal).includes(alvo),
    )
  }, [estruturas, filtroDeEstrutura])

  const selecionada = estruturas.find((o) => o.id === overlaySelecionado) ?? null

  useEffect(() => {
    marcarVisita(rota, pagina.titulo)
    registrarEvento({ nome: 'lamina_aberta', setor: pagina.caminho[0] })
  }, [rota, pagina.titulo, pagina.caminho, marcarVisita])

  useEffect(() => {
    if (!carregado || notaCarregada) return
    setNota(progresso.caderno[rota]?.texto ?? '')
    setNotaCarregada(true)
  }, [carregado, notaCarregada, progresso.caderno, rota])

  const concluida = !!progresso.concluidas[rota]
  const favorita = !!progresso.favoritos[rota]

  const coloracoes = COLORACOES.filter((c) => pagina.coloracoes.includes(c.id))
  const hashes = [
    ...(pagina.base ? [pagina.base.sha256] : []),
    ...pagina.overlays.map((o) => o.midia.sha256),
  ]

  return (
    <article className="container mx-auto max-w-6xl px-4 py-6">
      {/* ── 1. Trilha e posição no currículo ── */}
      <nav aria-label="Trilha de navegação" className="mb-3">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
          <li>
            <Link href={BASE} className="rounded hover:text-foreground hover:underline">
              Manual da Histologia
            </Link>
          </li>
          {pagina.trilha.map((passo, i) => (
            <li key={passo.slug} className="flex items-center gap-1.5">
              <span aria-hidden>›</span>
              {i === pagina.trilha.length - 1 ? (
                <span aria-current="page" className="font-medium text-foreground">
                  {passo.titulo}
                </span>
              ) : (
                <Link
                  href={rotaDaPagina(passo.slug)}
                  className="rounded hover:text-foreground hover:underline"
                >
                  {passo.titulo}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* ── 2. Título, objetivos e tempo ── */}
      <header className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              {pagina.titulo}
            </h1>
            {pagina.tituloOriginal !== pagina.titulo && (
              <p className="mt-1 text-xs text-muted-foreground">
                No acervo original: <span className="italic">{pagina.tituloOriginal}</span>
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => alternarFavorito(rota)}
              aria-pressed={favorita}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors ${
                favorita ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200' : 'border-border hover:border-amber-500/50'
              }`}
            >
              <Star className={`h-4 w-4 ${favorita ? 'fill-current' : ''}`} aria-hidden />
              {favorita ? 'Favoritada' : 'Favoritar'}
            </button>
            <button
              type="button"
              onClick={() => alternarConcluida(rota)}
              aria-pressed={concluida}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors ${
                concluida
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-border hover:border-emerald-500/50'
              }`}
            >
              <Check className="h-4 w-4" aria-hidden />
              {concluida ? 'Concluída' : 'Marcar concluída'}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${cor.borda} ${cor.fundo} ${cor.texto}`}>
            <Target className="h-3.5 w-3.5" aria-hidden />
            {estruturas.length} estrutura{estruturas.length === 1 ? '' : 's'} marcada
            {estruturas.length === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {estimarMinutos(pagina)} min de estudo
          </span>
          {coloracoes.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 font-medium text-rose-800 dark:text-rose-300"
            >
              <FlaskConical className="h-3.5 w-3.5" aria-hidden />
              {c.nome}
            </span>
          ))}
        </div>

        <div className="mt-3">
          <EstadoEditorial revisao={pagina.revisao} />
        </div>
      </header>

      {/* ── 3. Resumo orientador ── */}
      <OQueEstaLaminaMostra pagina={pagina} />

      {/* ── 4. Microscópio virtual ── */}
      <section className="mb-6" aria-labelledby="secao-microscopio">
        <h2 id="secao-microscopio" className="sr-only">
          Microscópio virtual
        </h2>
        <Microscopio
          lamina={{
            rota,
            titulo: pagina.titulo,
            base: pagina.base,
            overlays: pagina.overlays,
          }}
          bandeja={bandeja}
          overlayInicial={estruturaInicial}
          onSelecionarOverlay={(id) => {
            setOverlaySelecionado(id)
            if (id) registrarEvento({ nome: 'overlay_usado', setor: pagina.caminho[0] })
          }}
          onSelecionarLamina={(destino) => {
            window.location.href = rotaDaPagina(destino)
          }}
        />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* ── 6. Dossiê da estrutura selecionada ── */}
          {selecionada ? (
            <DossieDaEstrutura
              overlay={selecionada}
              aRevisar={!!progresso.aRevisar[`${rota}#${selecionada.id}`]}
              onAlternarRevisar={() => alternarARevisar(rota, selecionada.id)}
            />
          ) : (
            estruturas.length > 0 && (
              <p className="rounded-lg border border-dashed border-border bg-muted/15 p-4 text-sm text-muted-foreground">
                Escolha uma estrutura na lista ao lado — ou toque numa camada no microscópio — para
                abrir o dossiê com a explicação do acervo.
              </p>
            )
          )}

          {/* ── 10. Coloração e aparência ── */}
          {coloracoes.length > 0 && (
            <section aria-labelledby="secao-coloracao">
              <h2 id="secao-coloracao" className="mb-2 font-heading text-lg font-semibold">
                Coloração e aparência
              </h2>
              <div className="space-y-3">
                {coloracoes.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm font-bold">{c.nome}</p>
                    <dl className="mt-2 space-y-1.5 text-xs leading-relaxed">
                      <div>
                        <dt className="inline font-semibold">Para que serve: </dt>
                        <dd className="inline text-muted-foreground">{c.finalidade}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">Por que funciona: </dt>
                        <dd className="inline text-muted-foreground">{c.afinidade}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold">O que você vê: </dt>
                        <dd className="inline text-muted-foreground">{c.resultado}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Lacunas editoriais, declaradas ── */}
          <SecoesPendentes />

          {/* ── 16. Créditos ── */}
          <Creditos
            creditos={pagina.creditos}
            proveniencia={pagina.proveniencia}
            hashes={hashes.slice(0, 12)}
          />

          {/* ── Navegação sequencial ── */}
          <nav aria-label="Navegação entre lâminas" className="flex flex-wrap gap-2">
            {vizinhas.anterior && (
              <Link
                href={rotaDaPagina(vizinhas.anterior.caminho)}
                className="inline-flex min-h-[44px] flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs transition-colors hover:border-teal-500/50"
              >
                <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                    Anterior
                  </span>
                  <span className="block truncate font-semibold">{vizinhas.anterior.titulo}</span>
                </span>
              </Link>
            )}
            {vizinhas.proxima && (
              <Link
                href={rotaDaPagina(vizinhas.proxima.caminho)}
                className="inline-flex min-h-[44px] flex-1 items-center justify-end gap-2 rounded-lg border border-border bg-card px-3 py-2 text-right text-xs transition-colors hover:border-teal-500/50"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                    Próxima
                  </span>
                  <span className="block truncate font-semibold">{vizinhas.proxima.titulo}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            )}
          </nav>
        </div>

        {/* ── 5. Lista pesquisável de estruturas + caderno ── */}
        {/*
          A coluna lateral acompanha a rolagem no desktop: a lista de estruturas
          e o caderno precisam ficar ao alcance enquanto se percorre a lâmina.
          `top-4` respeita o cabeçalho e `max-h`+`overflow` impedem que uma
          lista longa passe da tela e fique com o fim inalcançável.
        */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pb-4">
          {estruturas.length > 0 && (
            <section
              aria-labelledby="secao-estruturas"
              className="rounded-lg border border-border bg-card"
            >
              <div className="border-b border-border p-3">
                <h2 id="secao-estruturas" className="mb-2 text-xs font-bold">
                  Estruturas desta lâmina
                </h2>
                <label htmlFor="filtro-estrutura" className="sr-only">
                  Filtrar estruturas
                </label>
                <input
                  id="filtro-estrutura"
                  type="search"
                  value={filtroDeEstrutura}
                  onChange={(e) => setFiltroDeEstrutura(e.target.value)}
                  placeholder="Filtrar (sem acento também funciona)"
                  className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                />
              </div>
              <ul className="max-h-[420px] overflow-y-auto p-1.5">
                {estruturasFiltradas.map((overlay) => {
                  const ativo = overlay.id === overlaySelecionado
                  return (
                    <li key={overlay.id}>
                      <button
                        type="button"
                        onClick={() => setOverlaySelecionado(ativo ? null : overlay.id)}
                        aria-pressed={ativo}
                        className={`flex w-full min-h-[40px] items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                          ativo ? 'bg-violet-600 text-white' : 'hover:bg-muted'
                        }`}
                      >
                        <span aria-hidden className="font-mono text-[10px] opacity-60">
                          {String(overlay.ordem).padStart(2, '0')}
                        </span>
                        <span className="min-w-0 flex-1">
                          {overlay.rotulo}
                          {!overlay.traduzido && !ativo && <TermoNoOriginal />}
                        </span>
                      </button>
                    </li>
                  )
                })}
                {estruturasFiltradas.length === 0 && (
                  <li className="px-2.5 py-3 text-xs text-muted-foreground">
                    Nenhuma estrutura corresponde a “{filtroDeEstrutura}”.
                  </li>
                )}
              </ul>
            </section>
          )}

          {/* Caderno de lâminas */}
          <section aria-labelledby="secao-caderno" className="rounded-lg border border-border bg-card p-3">
            <h2 id="secao-caderno" className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold">
              <Pencil className="h-4 w-4 text-muted-foreground" aria-hidden />
              Caderno desta lâmina
            </h2>
            <label htmlFor="nota-lamina" className="sr-only">
              Nota privada sobre esta lâmina
            </label>
            <textarea
              id="nota-lamina"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              onBlur={() => salvarNota(rota, nota)}
              rows={4}
              placeholder="O que você quer lembrar ao rever esta lâmina?"
              className="w-full resize-y rounded-md border border-border bg-background p-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
              Fica só neste dispositivo. Não é enviada para nenhum servidor nem entra em
              estatísticas de uso.
            </p>
          </section>

          {/* 15. Checkpoint — quizzes do assunto */}
          {quizzes.length > 0 && (
            <section aria-labelledby="secao-quiz" className="rounded-lg border border-border bg-card p-3">
              <h2 id="secao-quiz" className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold">
                <ListChecks className="h-4 w-4 text-muted-foreground" aria-hidden />
                Teste o que reconheceu
              </h2>
              <ul className="space-y-1.5">
                {quizzes.map((quiz) => (
                  <li key={quiz.slug}>
                    <Link
                      href={`${BASE}/quizzes/${quiz.slug}`}
                      className="flex min-h-[40px] items-center justify-between gap-2 rounded-md border border-border px-2.5 py-2 text-xs transition-colors hover:border-rose-500/50"
                    >
                      <span className="font-semibold">{quiz.titulo}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {quiz.questoes} questões
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </article>
  )
}

/* ────────────────────────── dossiê ────────────────────────── */

function DossieDaEstrutura({
  overlay,
  aRevisar,
  onAlternarRevisar,
}: {
  overlay: Overlay
  aRevisar: boolean
  onAlternarRevisar: () => void
}) {
  return (
    <section
      aria-labelledby="dossie-titulo"
      className="rounded-lg border border-violet-500/25 bg-violet-500/[0.05] p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 id="dossie-titulo" className="font-heading text-lg font-semibold leading-tight">
          {overlay.rotulo}
          {!overlay.traduzido && <TermoNoOriginal />}
        </h2>
        <button
          type="button"
          onClick={onAlternarRevisar}
          aria-pressed={aRevisar}
          className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition-colors ${
            aRevisar
              ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200'
              : 'border-border hover:border-amber-500/50'
          }`}
        >
          <BookMarked className="h-3.5 w-3.5" aria-hidden />
          {aRevisar ? 'Marcada a revisar' : 'Marcar a revisar'}
        </button>
      </div>

      {overlay.rotuloOriginal !== overlay.rotulo && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          Original: <span className="italic">{overlay.rotuloOriginal}</span>
        </p>
      )}

      {overlay.explicacaoOriginal ? (
        <>
          <p className="mt-3 text-sm leading-relaxed">{overlay.explicacaoOriginal}</p>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Explicação do acervo original, em inglês, ainda sem tradução revisada.
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          O acervo não traz explicação para esta camada — ela apenas aponta a estrutura na imagem.
        </p>
      )}
    </section>
  )
}

/**
 * Lacunas editoriais, declaradas em vez de preenchidas.
 *
 * A página didática prevê histogênese, ultraestrutura, diferenciais,
 * correlações clínicas e resumo de alta retenção. O acervo não fornece nada
 * disso em português, e escrever conteúdo biomédico sem fonte é exatamente o
 * que este módulo não pode fazer. Então a página **diz o que falta** — o aluno
 * sabe onde termina o que está verificado, e a equipe editorial sabe o que
 * ainda tem pela frente.
 */
function SecoesPendentes() {
  const pendentes = [
    'Histogênese e origem embrionária',
    'Ultraestrutura',
    'Vascularização, inervação e renovação',
    'Diagnósticos diferenciais e armadilhas de identificação',
    'Correlações clínicas',
    'Resumo de alta retenção',
  ]

  return (
    <section
      aria-labelledby="secao-pendentes"
      className="rounded-lg border border-dashed border-border bg-muted/15 p-4"
    >
      <h2 id="secao-pendentes" className="text-sm font-bold">
        Aprofundamento ainda não escrito
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Estas seções fazem parte do modelo editorial desta página e ainda não existem para esta
        lâmina. Elas só serão publicadas com fonte acadêmica citada e revisão biomédica — não
        preenchemos campo com texto plausível.
      </p>
      <ul className="mt-2.5 grid gap-1 sm:grid-cols-2">
        {pendentes.map((item) => (
          <li key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Estimativa de tempo a partir do que existe de fato na página — número de
 * estruturas e comprimento do texto. Um "10 min" fixo em toda lâmina seria
 * decorativo e o aluno perceberia na terceira página.
 */
function estimarMinutos(pagina: Pagina): number {
  const palavras =
    pagina.descricaoOriginal.split(/\s+/).length +
    pagina.overlays.reduce((n, o) => n + (o.explicacaoOriginal?.split(/\s+/).length ?? 0), 0)
  const leitura = palavras / 180
  const observacao = pagina.overlays.filter((o) => o.classe === 'estrutura').length * 0.4
  return Math.max(3, Math.round(leitura + observacao))
}

/**
 * "O que esta lâmina mostra".
 *
 * Prefere o texto próprio, escrito em português para orientar a observação
 * (`lib/histologia/laminas.ts`), e cai para a descrição do acervo quando ainda
 * não há um — com aviso explícito de que está no original. A descrição do
 * acervo continua acessível mesmo quando há texto próprio: ela é a prova de
 * origem, e quem quiser conferir tem de conseguir.
 */
function OQueEstaLaminaMostra({ pagina }: { pagina: Pagina }) {
  const propria = descricaoDaLamina(pagina.tituloOriginal, pagina.caminho)

  if (!propria && !pagina.descricaoOriginal) return null

  return (
    <section className="histologia-cartao mb-6 overflow-hidden">
      <div className="border-b border-border bg-muted/25 px-4 py-2">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          O que esta lâmina mostra
        </h2>
      </div>

      <div className="space-y-3 p-4">
        {propria ? (
          <>
            <p className="histologia-prosa text-sm leading-relaxed">
              {comDestaques(propria.panorama)}
            </p>

            {propria.roteiro && propria.roteiro.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Roteiro de observação
                </p>
                <ol className="space-y-1">
                  {propria.roteiro.map((passo: string, i: number) => (
                    <li key={passo} className="flex gap-2 text-xs leading-relaxed">
                      <span
                        aria-hidden
                        className="mt-px font-mono text-[10px] font-bold text-muted-foreground"
                      >
                        {i + 1}.
                      </span>
                      {passo}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {propria.atencao && (
              <p className="rounded border border-amber-500/30 bg-amber-500/[0.07] px-2.5 py-2 text-xs leading-relaxed">
                <span className="font-semibold">Atenção: </span>
                {propria.atencao}
              </p>
            )}

            {pagina.descricaoOriginal && (
              <details>
                <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Descrição do acervo (original)
                </summary>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {pagina.descricaoOriginal}
                </p>
              </details>
            )}
          </>
        ) : (
          <>
            <p className="histologia-prosa text-sm leading-relaxed">{pagina.descricaoOriginal}</p>
            <p className="text-[10px] text-muted-foreground">
              Texto do acervo original, em inglês. O aprofundamento em português ainda não foi
              escrito para esta lâmina.
            </p>
          </>
        )}
      </div>
    </section>
  )
}

/** Converte `**termo**` em `<strong>` por fatiamento, sem injetar HTML. */
function comDestaques(texto: string): React.ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') ? (
      <strong key={i} className="font-semibold">
        {parte.slice(2, -2)}
      </strong>
    ) : (
      parte
    ),
  )
}
