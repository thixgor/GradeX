'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Crown,
  Eye,
  GitCompareArrows,
  Lock,
  Microscope,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Waves,
} from 'lucide-react'
import {
  AvisoJaTenho,
  BarraDoPacote,
  FaixaDoPacote,
  FechamentoDoPacote,
  GradeDoPacote,
  ListaDoPacote,
  OfertaDoPacote,
  PerguntasDoPacote,
  SeloDoPacote,
} from '@/components/manual-clinico/pacote'
import { PricingEventCountdown } from '@/components/pricing-events/PricingEventCountdown'
import { usePricingEventState } from '@/components/pricing-events/usePricingEventState'
import { TOTAL_DE_MODULOS } from '@/lib/manual-clinico/pacote'
import { PreviaSemiologia } from './previa'
import type { PlanoResumo, ResumoSemiologia } from './use-acesso'

/**
 * A landing de vendas do Manual de Semiologia.
 *
 * Vale para a seção inteira: quem abre qualquer endereço sob
 * `/manual-clinico/semiologia` sem acesso — e inclusive sem conta, desde que o
 * middleware deixou a rota passar — vê esta mesma página. Antes existia aqui
 * um cartão de três números e um botão; o link de um sinal mandado no grupo de
 * estudo abria no formulário de login e a pessoa nunca descobria o que havia
 * do outro lado.
 *
 * ## As três decisões de conteúdo
 *
 * **A prévia vem antes de qualquer bullet.** O módulo não se vende pela lista
 * de recursos e sim pelo gesto: arrastar a bilirrubina e ver o amarelo nascer
 * em 2,5 mg/dL explica o produto inteiro em três segundos. A prévia é mínima de
 * propósito — três figuras paramétricas, que são material próprio, e nenhuma
 * fotografia do acervo licenciado, que é justamente o que está sendo vendido.
 *
 * **O acervo aparece por nome, com cadeado.** Listar os títulos dos sinais, das
 * janelas e dos comparadores prova o tamanho de um jeito que adjetivo nenhum
 * prova, e não entrega uma linha do conteúdo. Os números vêm da API, que os
 * conta do próprio acervo — nunca escritos à mão, para o anúncio não
 * desencontrar do que o módulo entrega.
 *
 * **O preço vem depois do valor, e depois do pacote.** A objeção real de quem
 * chega aqui não é preço, é "será que eu já tenho isto?" e "isto é só um atlas
 * de figuras?". As duas são respondidas na primeira dobra; o preço espera.
 */
export function VitrineSemiologia({
  onCheckout,
  isAuthenticated,
  planos,
  precoAvulso,
  produtoAtivo,
  resumo,
  alvo,
}: {
  onCheckout: () => void
  isAuthenticated: boolean
  planos: PlanoResumo[]
  precoAvulso: number
  produtoAtivo: boolean
  resumo?: ResumoSemiologia
  /**
   * O que a pessoa tentou abrir quando veio de um link direto — um sinal, uma
   * janela, um comparador. É o momento em que a intenção está mais clara e o
   * argumento pode ser mais preciso.
   */
  alvo?: string | null
}) {
  const habilitados = planos.filter((p) => p.enabled && p.price > 0)
  const maisBarato = habilitados.reduce<PlanoResumo | null>(
    (min, p) => (min == null || p.price < min.price ? p : min),
    null,
  )
  const precoBase = maisBarato?.price ?? precoAvulso ?? 0
  const { state: evento } = usePricingEventState(maisBarato?.pricingEventId ?? null)

  const pctLote = evento?.activeTier?.discountPercent || 0
  const temLote = !!evento?.activeTier && evento?.isActive !== false && pctLote > 0 && precoBase > 0
  const precoFinal = temLote ? Math.max(0, Math.round(precoBase * (1 - pctLote / 100) * 100) / 100) : precoBase
  const mostrarPreco = produtoAtivo && precoBase > 0

  const sinais = resumo?.sinais ?? 0
  const cenas = (resumo?.cenas ?? 0) + (resumo?.cenasUltrassom ?? 0)
  const janelas = (resumo?.vistas ?? 0) + (resumo?.janelas ?? 0)
  const comparadores = resumo?.comparadores ?? 0

  const numeros = [
    { v: sinais || '—', r: 'sinais do exame físico' },
    { v: cenas || '—', r: 'cenas normais e alteradas' },
    { v: janelas || '—', r: 'janelas de exame e POCUS' },
    { v: comparadores || '—', r: 'comparadores de causa' },
  ]

  return (
    <>
      {/* O padding de baixo reserva o espaço da barra fixa do celular. */}
      <div className="pb-28 lg:pb-0">
        {/* ══════════════════ ABERTURA ══════════════════ */}
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-start xl:gap-10">
          <div className="min-w-0">
            <SeloDoPacote />

            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Manual Clínico · Semiologia
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl">
              O exame físico que se aprende arrastando o parâmetro,
              <span className="text-sky-600 dark:text-sky-400"> não decorando o número</span>.
            </h1>

            {alvo ? (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                <strong className="font-semibold text-foreground">{alvo}</strong> faz parte do Manual de Semiologia —
                o atlas do exame físico, da imagem à beira do leito e do POCUS. Ele é privativo de assinantes: não
                entra no teste grátis e não é vendido à parte.
              </p>
            ) : (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                O que você faz com a própria mão, antes de qualquer máquina — e o que se vê pelo otoscópio, pelo
                oftalmoscópio e pela sonda. Cada achado com o mecanismo escrito, o que muda na conduta e onde ele
                engana.
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {numeros.map((n) => (
                <div key={n.r} className="rounded-xl border border-border bg-card px-3 py-2.5">
                  <p className="font-heading text-xl font-semibold tabular-nums tracking-tight text-primary">{n.v}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{n.r}</p>
                </div>
              ))}
            </div>

            <FaixaDoPacote atual="semiologia" className="mt-6" />
            <AvisoJaTenho className="mt-3" />

            {/* As três alas, com o peso que cada uma tem de verdade. */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <AlaCartao
                icone={Stethoscope}
                etiqueta="Sinais"
                titulo={sinais ? `${sinais} fichas aprofundadas` : 'Sinais do exame físico'}
                texto="Da icterícia ao Babinski: o que conta como presente, a manobra com o detalhe que a faz funcionar, o mecanismo e onde o sinal engana."
                tom="sky"
              />
              <AlaCartao
                icone={Eye}
                etiqueta="Beira-leito"
                titulo={resumo?.vistas ? `${resumo.vistas} janelas de instrumento` : 'Imagem à beira do leito'}
                texto="Otoscopia, fundo de olho, orofaringe e rinoscopia — a cena normal com cada estrutura marcada e a alteração ao lado dela."
                tom="emerald"
              />
              <AlaCartao
                icone={Waves}
                etiqueta="Ultrassom"
                titulo={resumo?.janelas ? `${resumo.janelas} janelas de POCUS` : 'Ultrassom à beira do leito'}
                texto="Cada janela com a pergunta binária que ela responde — do ponto pulmonar ao McConnell, da vesícula ao olho."
                tom="violet"
              />
            </div>
          </div>

          {/* ── Prévia + o tamanho do pacote ── */}
          <div className="min-w-0 space-y-5 xl:sticky xl:top-6">
            <PreviaSemiologia />

            {/* O cartão lateral mostra o tamanho do pacote, não o preço: quem
                chega aqui ainda não sabe que a compra abre os outros manuais, e
                um número antes disso vira comparação com o preço de um atlas
                avulso. O preço vem inteiro mais abaixo, depois do acervo. */}
            <div className="glass-panel overflow-hidden rounded-2xl p-5 sm:p-6">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <Sparkles className="h-3.5 w-3.5" /> O que a compra abre
              </p>
              <h2 className="mt-2 font-heading text-lg font-semibold leading-snug tracking-tight">
                A Semiologia é um dos {TOTAL_DE_MODULOS} manuais — e todos vêm juntos
              </h2>
              <ListaDoPacote atual="semiologia" className="mt-3.5" />
              <button
                onClick={onCheckout}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
              >
                <Crown className="h-4 w-4" />
                Quero os {TOTAL_DE_MODULOS} manuais
                <ArrowRight className="h-4 w-4" />
              </button>
              {!isAuthenticated && (
                <p className="mt-3 text-center text-[11.5px] text-muted-foreground">
                  Já tem conta?{' '}
                  <Link href="/auth/login" className="font-semibold text-foreground underline underline-offset-2">
                    Entre e veja se já é seu
                  </Link>
                </p>
              )}
              <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Pix, cartão ou boleto · pagamento processado com
                segurança.
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════════ O ARGUMENTO ══════════════════ */}
        <section className="mt-14">
          <p className="editorial-mark mb-2">Por que não é mais um atlas de fotos</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Uma foto mostra <em className="not-italic text-muted-foreground">uma</em> icterícia. O que você precisa é
            da transição.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            A pergunta à beira do leito nunca é “como é a icterícia”. É <strong className="text-foreground">“isto
            já é amarelo o bastante?”</strong> — e essa só se responde vendo o achado nascer. Aqui as figuras são
            funções contínuas do parâmetro clínico, com o limiar de detecção embutido na curva, do mesmo jeito que
            os traçados do Manual do Eletrocardiograma são gerados por eletrofisiologia e não desenhados à mão.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {DIFERENCIAIS.map((d) => (
              <div key={d.t} className="rounded-xl border border-border bg-card p-4">
                <d.icon className="mb-2 h-5 w-5 text-sky-600 dark:text-sky-400" />
                <p className="text-sm font-bold">{d.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════ A PROFUNDIDADE DA FICHA ══════════════════ */}
        <section className="mt-14">
          <p className="editorial-mark mb-2">A profundidade</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Cada sinal é um dossiê, na ordem em que a dúvida aparece
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            E as armadilhas ficam por último de propósito: lidas antes do mecanismo viram lista de exceções para
            decorar; lidas depois, são consequência do que você acabou de entender.
            {resumo?.sinaisComDesempenho ? (
              <>
                {' '}
                <strong className="text-foreground">
                  {resumo.sinaisComDesempenho} dos {sinais} sinais
                </strong>{' '}
                trazem sensibilidade, especificidade e razão de verossimilhança publicadas, com a leitura escrita ao
                lado do número — porque “LR+ 2,0” não significa nada sozinho.
              </>
            ) : null}
          </p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {CAMPOS_DA_FICHA.map((c, i) => (
              <li key={c.t} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-[11px] font-bold tabular-nums text-sky-700 dark:text-sky-300">
                    {i + 1}
                  </span>
                  <p className="text-sm font-bold">{c.t}</p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ══════════════════ O ACERVO, POR NOME ══════════════════ */}
        <section className="mt-14">
          <p className="editorial-mark mb-2">O acervo</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            O que está do outro lado, nome por nome
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Os títulos estão todos aqui; o corpo de cada ficha é que é privativo. Nenhum número desta página foi
            escrito à mão — todos são contados do próprio acervo.
          </p>

          {resumo?.sistemas && resumo.sistemas.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {resumo.sistemas.map((s) => (
                <li
                  key={s.titulo}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11.5px] font-semibold"
                >
                  {s.titulo}
                  <span className="tabular-nums font-normal text-muted-foreground">{s.total}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <ListaTrancada
              icone={Stethoscope}
              titulo="Sinais do exame físico"
              rodape={sinais ? `${sinais} fichas` : undefined}
              itens={resumo?.titulosSinais}
              tom="sky"
            />
            <ListaTrancada
              icone={Eye}
              titulo="Imagem à beira do leito"
              rodape={resumo?.cenas ? `${resumo.cenas} cenas · ${resumo.estruturas} estruturas marcadas` : undefined}
              itens={resumo?.titulosVistas}
              tom="emerald"
            />
            <ListaTrancada
              icone={Waves}
              titulo="Ultrassom à beira do leito"
              rodape={resumo?.cenasUltrassom ? `${resumo.cenasUltrassom} cenas` : undefined}
              itens={resumo?.titulosJanelas}
              tom="violet"
            />
          </div>
        </section>

        {/* ══════════════════ COMPARADORES ══════════════════ */}
        {resumo?.titulosComparadores && resumo.titulosComparadores.length > 0 && (
          <section className="mt-14 overflow-hidden rounded-2xl border border-sky-500/25 bg-sky-500/[0.04] p-5 sm:p-7">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-400">
              <GitCompareArrows className="h-3.5 w-3.5" /> Incluso · comparadores
            </p>
            <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              O livro é organizado por doença. A pessoa chega com o achado.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              O corte aqui é transversal: não “o que é edema”, mas{' '}
              <strong className="text-foreground">qual edema é qual</strong> — renal, hepático, cardíaco, venoso e
              linfático lado a lado, eixo por eixo, com a célula que decide destacada e o achado-chave de cada causa
              repetido em uma linha. Ninguém memoriza trinta e cinco células; cinco chaves cabem na cabeça.
            </p>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {resumo.titulosComparadores.map((titulo, i) => (
                <li key={titulo} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold">{titulo}</p>
                  {resumo.perguntasDosComparadores?.[i] && (
                    <p className="mt-1.5 text-xs italic leading-relaxed text-muted-foreground">
                      “{resumo.perguntasDosComparadores[i]}”
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ══════════════════ A BUSCA ══════════════════ */}
        <section className="mt-14 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
            <div className="p-5 sm:p-7">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-primary">
                <Search className="h-3.5 w-3.5" /> Incluso · busca do módulo
              </p>
              <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                Você procura “flapping”. O acervo guarda “asterixe”.
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                A busca entende sinônimo, termo em inglês, gíria de enfermaria, nome de doença e erro de digitação —
                e cai direto na ficha, na cena ou na janela certa. Indexar só o título oficial devolveria vazio
                justamente para quem está começando, que é quem mais precisa achar.
              </p>
            </div>
            <div className="flex flex-wrap content-center gap-2 border-t border-border bg-muted/30 p-5 sm:p-7 md:border-l md:border-t-0">
              {['flapping', 'linhas B', 'joanete', 'sinal do D', 'Graves', 'spider naevi'].map((termo) => (
                <span
                  key={termo}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium"
                >
                  <Search className="h-3 w-3 text-muted-foreground" aria-hidden />
                  {termo}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════ O PACOTE — o valor inteiro, antes do preço ══════════════════ */}
        <GradeDoPacote atual="semiologia" className="mt-14" />

        {/* ══════════════════ A OFERTA ══════════════════ */}
        <OfertaDoPacote
          className="mt-10"
          onCheckout={onCheckout}
          isAuthenticated={isAuthenticated}
          precoBase={precoBase}
          precoFinal={precoFinal}
          temLote={temLote}
          pctLote={pctLote}
          rotuloLote={evento?.activeTier?.label ?? null}
          rotuloPlano={maisBarato?.label ?? null}
          mesesDoPlano={maisBarato?.durationMonths ?? null}
          mostrarPreco={mostrarPreco}
        >
          {temLote && evento && (
            <div className="mt-3">
              <PricingEventCountdown state={evento} compact />
            </div>
          )}
        </OfertaDoPacote>

        <PerguntasDoPacote className="mt-14" />

        {/* ══════════════════ FECHAMENTO ══════════════════ */}
        <FechamentoDoPacote
          className="mt-10"
          onCheckout={onCheckout}
          precoFinal={precoFinal}
          mostrarPreco={mostrarPreco}
        />

        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          Material educacional. As figuras esquemáticas são material próprio da DomineAqui e as fotografias clínicas
          vêm de acervos licenciados, creditados dentro do módulo. Nada aqui substitui avaliação clínica, protocolo
          institucional ou o julgamento de quem está à beira do leito.
        </p>
      </div>

      {/* ══════════════════ BARRA FIXA DO CELULAR ══════════════════ */}
      <BarraDoPacote
        onCheckout={onCheckout}
        precoBase={precoBase}
        precoFinal={precoFinal}
        temLote={temLote}
        pctLote={pctLote}
        mesesDoPlano={maisBarato?.durationMonths ?? null}
        mostrarPreco={mostrarPreco}
      />
    </>
  )
}

/* ─────────────────────────────── Conteúdo ─────────────────────────────── */

const DIFERENCIAIS = [
  {
    icon: Target,
    t: 'O limiar é observado, não decorado',
    d: 'Abaixo de 2,5 mg/dL a esclera do desenho não muda de cor — como não muda no paciente. Você arrasta e vê onde o sinal nasce.',
  },
  {
    icon: Eye,
    t: 'O normal nunca sai de cena',
    d: 'Um clique põe a cena normal ao lado da alterada, e a diferença entre as duas vem escrita por extenso. Ver a diferença e saber nomeá-la são competências distintas.',
  },
  {
    icon: Sparkles,
    t: 'As estruturas acendem sobre a figura',
    d: 'Na cena normal, cada estrutura tem um marcador com a ficha atrás. Apague as marcações e teste se você as nomeia sozinho.',
  },
  {
    icon: Microscope,
    t: 'A fotografia real ao lado do esquema',
    d: 'Onde a curadoria alcançou, o caso real de acervo licenciado divide a tela com o desenho — a vida com ruído ao lado do padrão limpo.',
  },
  {
    icon: BarChart3,
    t: 'Quanto o sinal realmente vale',
    d: 'Sensibilidade, especificidade e LR publicadas, com a leitura ao lado: “isto não sustenta a decisão sozinho” é o que você precisa levar.',
  },
  {
    icon: AlertTriangle,
    t: 'Onde o achado engana',
    d: 'Luz amarela, pele negra, unha pintada, paciente hipotérmico. As armadilhas que transformam um sinal correto num diagnóstico errado.',
  },
]

const CAMPOS_DA_FICHA = [
  { t: 'O que conta como presente', d: 'A definição operacional — não a acadêmica. O corte que separa “tem” de “não tem” à beira do leito.' },
  { t: 'Como se procura', d: 'A manobra passo a passo, com o detalhe que a faz funcionar e que o livro costuma omitir.' },
  { t: 'Por que aparece', d: 'O mecanismo inteiro, da fisiopatologia ao que o olho enxerga. É o que faz o achado ficar.' },
  { t: 'O que muda na conduta', d: 'O que você faz diferente amanhã por causa deste achado — escrito para quem vai atender, não só para quem vai provar.' },
  { t: 'Causas, por mecanismo', d: 'Agrupadas pelo que as une fisiologicamente, e não em lista alfabética que ninguém memoriza.' },
  { t: 'Onde engana', d: 'Por último, de propósito: depois do mecanismo, cada armadilha vira consequência em vez de exceção solta.' },
]

/* ─────────────────────────────── Peças ─────────────────────────────── */

const TONS = {
  // Classes literais: o Tailwind varre o código-fonte, então uma variante
  // montada por interpolação nunca chega a existir no CSS.
  sky: { borda: 'border-sky-500/25', fundo: 'bg-sky-500/[0.05]', texto: 'text-sky-600 dark:text-sky-400' },
  emerald: {
    borda: 'border-emerald-500/25',
    fundo: 'bg-emerald-500/[0.05]',
    texto: 'text-emerald-600 dark:text-emerald-400',
  },
  violet: {
    borda: 'border-violet-500/25',
    fundo: 'bg-violet-500/[0.05]',
    texto: 'text-violet-600 dark:text-violet-400',
  },
} as const

function AlaCartao({
  icone: Icone,
  etiqueta,
  titulo,
  texto,
  tom,
}: {
  icone: typeof Eye
  etiqueta: string
  titulo: string
  texto: string
  tom: keyof typeof TONS
}) {
  const t = TONS[tom]
  return (
    <div className={`rounded-xl border ${t.borda} ${t.fundo} p-4`}>
      <p className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${t.texto}`}>
        <Icone className="h-3.5 w-3.5" /> {etiqueta}
      </p>
      <p className="mt-1.5 font-heading text-[15px] font-semibold leading-tight">{titulo}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{texto}</p>
    </div>
  )
}

/**
 * Uma ala do acervo listada por título, com o cadeado ao lado de cada linha.
 *
 * A lista é cortada em `LIMITE` e o resto vira contagem. São 343 sinais:
 * imprimi-los todos não provaria mais nada — provaria menos, porque uma parede
 * de trezentas linhas não se lê, e o que sobra na memória de quem rolou por
 * ela é "tem muita coisa", que é exatamente o que o número já diz sozinho.
 */
const LIMITE_DA_LISTA = 12

function ListaTrancada({
  icone: Icone,
  titulo,
  rodape,
  itens,
  tom,
}: {
  icone: typeof Eye
  titulo: string
  rodape?: string
  itens?: string[]
  tom: keyof typeof TONS
}) {
  const t = TONS[tom]
  const lista = itens ?? []
  const visiveis = lista.slice(0, LIMITE_DA_LISTA)
  const restantes = lista.length - visiveis.length

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className={`border-b border-border ${t.fundo} px-4 py-3`}>
        <p className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${t.texto}`}>
          <Icone className="h-3.5 w-3.5" /> {titulo}
        </p>
        {rodape && <p className="mt-0.5 text-[11px] text-muted-foreground">{rodape}</p>}
      </div>
      {visiveis.length > 0 ? (
        <>
          <ul className="divide-y divide-border">
            {visiveis.map((item) => (
              <li key={item} className="flex items-center gap-2 px-4 py-2">
                <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40" aria-hidden />
                <span className="min-w-0 text-[13px] text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
          {restantes > 0 && (
            <p className="mt-auto border-t border-border px-4 py-2.5 text-[12px] font-semibold text-muted-foreground">
              + {restantes} {restantes === 1 ? 'outro' : 'outros'}
            </p>
          )}
        </>
      ) : (
        <p className="px-4 py-3 text-[13px] text-muted-foreground">Carregando o índice…</p>
      )}
    </div>
  )
}
