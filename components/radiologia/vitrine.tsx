'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Crosshair,
  Crown,
  Flame,
  GraduationCap,
  ImageIcon,
  Layers3,
  Lock,
  MousePointerClick,
  StickyNote,
  Ruler,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
} from 'lucide-react'
import {
  AvisoJaTenho,
  BarraDoPacote,
  FaixaDoPacote,
  FechamentoDoPacote,
  GradeDoPacote,
  ListaDoPacote,
  OfertaDoPacote,
  SeloDoPacote,
} from '@/components/manual-clinico/pacote'
import { TOTAL_DE_MODULOS } from '@/lib/manual-clinico/pacote'
import { usePricingEventState } from '@/components/pricing-events/usePricingEventState'
import { PricingEventCountdown } from '@/components/pricing-events/PricingEventCountdown'
import { PLUS_LABEL } from '@/lib/account-tier'
import { NUMEROS_RAIO_X } from '@/lib/radiologia/numeros'
import { LogoRadiologia } from '@/components/radiologia/logo'
import { PreviaCine } from '@/components/tomografia/previa'
import { PreviaRaioX } from '@/components/radiologia/previa-raio-x'
import { tema } from '@/components/tomografia/tema'

export interface PlanoResumo {
  key: string
  label?: string
  price: number
  enabled: boolean
  durationMonths?: number | null
  pricingEventId?: string | null
}

export interface ResumoRegiaoRaioX {
  id: string
  titulo: string
  estudos: number
  estruturas: number
  incidencias: string[]
}

export interface ResumoAtlas {
  cortes: number
  estruturas: number
  series: number
  questoes: number
  secoes: {
    id: string
    titulo: string
    series: number
    estruturas: number
    cortes: number
    titulosSeries: string[]
  }[]
  raioX?: {
    estudos: number
    estruturas: number
    regioes: ResumoRegiaoRaioX[]
  }
}

interface VitrineProps {
  onCheckout: () => void
  isAuthenticated: boolean
  planos: PlanoResumo[]
  precoAvulso: number
  produtoAtivo: boolean
  resumo?: ResumoAtlas
  /**
   * O que a pessoa tentou abrir quando veio de um link direto (uma série de TC,
   * uma incidência do atlas). É o momento em que a intenção está mais clara e o
   * argumento pode ser mais preciso.
   */
  alvo?: string | null
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}

/** Cinco cortes bastam para demonstrar o gesto de rolar a pilha. Séries maiores
 *  começariam a entregar o próprio produto: as fatias vêm rotuladas. */
const CORTES_AMOSTRA = 5

const AMOSTRAS: { id: string; regiao: string; pasta: string; ext: string; de: number }[] = [
  { id: 'torax', regiao: 'TC de tórax', pasta: '/TC_TORAX/TC_TORAX_CORAÇÃO', ext: 'png', de: 6 },
  {
    id: 'abdome',
    regiao: 'TC de abdome',
    pasta: '/TC_ABDOME/TC_ABDOME_VISCERAS_PARENQUIMATOSAS',
    ext: 'JPG',
    de: 22,
  },
  {
    id: 'cranio',
    regiao: 'TC de crânio',
    pasta: '/TC_CRANIO/TC_CRANIO_PARENQUIMA_ENCEFALICO',
    ext: 'PNG',
    de: 9,
  },
]

/** Contagens de reserva, para o caso de a API de acesso falhar. */
const RX_PADRAO = NUMEROS_RAIO_X

const RECURSOS_TC = [
  {
    icon: MousePointerClick,
    t: 'A pilha inteira no scroll',
    d: 'Roda do mouse, arraste, setas, PgUp/PgDn e cine com velocidade ajustável — o gesto da estação de trabalho. No celular, o dedo sobre a imagem.',
  },
  {
    icon: ScanLine,
    t: 'Sete janelas para comparar',
    d: 'Mediastinal, pulmonar, óssea, cerebral, angio e hepática, mais brilho, contraste e inversão. A janela deixa de ser ajuste estético e vira decisão diagnóstica.',
  },
  {
    icon: Crosshair,
    t: 'Salto direto para a estrutura',
    d: 'Clique no nome e o visualizador vai ao corte em que ela aparece rotulada, marcando na régua todos os cortes em que ela é visível.',
  },
  {
    icon: Target,
    t: 'Modo treino: encontre o corte',
    d: 'Você recebe o nome da estrutura e percorre a pilha até achá-la. Mais o quiz de raciocínio ao fim de cada série.',
  },
]

const RECURSOS_RX = [
  {
    icon: Target,
    t: 'Acenda a estrutura sobre o filme',
    d: 'Cada demarcação é uma sobreposição alinhada à radiografia. Clique no nome e ela acende; desligue tudo e teste se você a reconhece sozinho.',
  },
  {
    icon: BookOpen,
    t: 'Dossiê por estrutura',
    d: 'O que é, como identificar no filme, o que avaliar e por quê, e a armadilha que aquela estrutura costuma provocar.',
  },
  {
    icon: GraduationCap,
    t: 'Leitura sistemática por região',
    d: 'Técnica e posicionamento, critérios de qualidade, roteiro na ordem clínica, armadilhas, pérolas, medidas de referência e quando a radiografia não basta.',
  },
  {
    icon: ScanLine,
    t: 'Negativo, revisão automática e busca',
    d: 'Inverta o filme, rode a revisão sozinha e busque em português ou pelo termo anatômico original — a busca cai direto na demarcação certa.',
  },
]

/** Campos reais de uma ficha, para mostrar a profundidade sem entregar o texto. */
const CAMPOS_FICHA = [
  { icon: Compass, t: 'Como encontrar na imagem', d: 'O caminho até a estrutura rolando os cortes, com os reparos anatômicos que confirmam a identificação.' },
  { icon: ScanLine, t: 'Densidade e janela', d: 'Valores em UH, comportamento com contraste em cada fase e a janela em que a estrutura é melhor avaliada.' },
  { icon: Layers3, t: 'Morfologia e função', d: 'Forma, dimensões, trajeto, relações — e o que o corpo perde quando aquela estrutura falha.' },
  { icon: Stethoscope, t: 'Importância clínica', d: 'O que muda na conduta quando algo acontece ali, escrito para quem vai atender e não só para quem vai provar.' },
  { icon: AlertTriangle, t: 'Alterações na imagem', d: 'Cada doença relevante com a tradução visual exata: densidade, forma, realce, o sinal clássico.' },
  { icon: Ruler, t: 'Medidas e armadilhas', d: 'Os números que você precisa decorar e as pseudolesões que fazem o iniciante errar.' },
]

/**
 * Landing de vendas do Manual de Radiologia.
 *
 * Vale para a seção inteira: quem cai em qualquer endereço sob
 * `/manual-clinico/radiologia` sem acesso vê esta mesma página — a home, o
 * atlas de Raio-X, uma incidência específica, o índice da tomografia ou uma
 * série. Antes existia só a vitrine da tomografia, que vendia metade do
 * produto e não mencionava as 28 incidências.
 *
 * Duas decisões de conteúdo guiam o layout. A primeira: o produto se vende pelo
 * gesto, não pela lista de recursos — por isso as duas prévias interativas vêm
 * antes de qualquer bullet, e o visitante escolhe qual modalidade quer ver
 * funcionando. A segunda: a objeção real de quem já assina o Manual Clínico não
 * é preço, é "será que já tenho?" — por isso a faixa de inclusão aparece no
 * topo, antes do preço.
 */
export function VitrineRadiologia({
  onCheckout,
  isAuthenticated,
  planos,
  precoAvulso,
  produtoAtivo,
  resumo,
  alvo,
}: VitrineProps) {
  const [modalidade, setModalidade] = useState<'raio-x' | 'tc'>('raio-x')
  const [amostra, setAmostra] = useState(AMOSTRAS[0])

  const habilitados = planos.filter((p) => p.enabled && p.price > 0)
  const maisBarato = habilitados.reduce<PlanoResumo | null>(
    (min, p) => (min == null || p.price < min.price ? p : min),
    null,
  )
  const precoBase = maisBarato?.price ?? precoAvulso ?? 0
  const eventoId = maisBarato?.pricingEventId ?? null
  const { state: evento } = usePricingEventState(eventoId)

  const pctLote = evento?.activeTier?.discountPercent || 0
  const temLote = !!evento?.activeTier && evento?.isActive !== false && pctLote > 0 && precoBase > 0
  const precoFinal = temLote ? Math.max(0, Math.round(precoBase * (1 - pctLote / 100) * 100) / 100) : precoBase
  const mostrarPreco = produtoAtivo && precoBase > 0

  const urls = useMemo(
    () =>
      Array.from({ length: CORTES_AMOSTRA }, (_, i) =>
        encodeURI(`${amostra.pasta}/${amostra.de + i}.${amostra.ext}`),
      ),
    [amostra],
  )

  const rx = resumo?.raioX
  const rxEstudos = rx?.estudos ?? RX_PADRAO.estudos
  const rxEstruturas = rx?.estruturas ?? RX_PADRAO.estruturas
  const rxRegioes = rx?.regioes?.length ?? RX_PADRAO.regioes
  const tcEstruturas = resumo?.estruturas ?? 272

  const numeros = [
    { v: resumo?.cortes ?? 640, r: 'cortes de TC' },
    { v: rxEstudos, r: 'incidências de Raio-X' },
    { v: tcEstruturas + rxEstruturas, r: 'estruturas comentadas' },
    { v: resumo?.questoes ?? 107, r: 'questões' },
  ]

  return (
    <>
      {/* pb reserva o espaço da barra fixa do celular */}
      <div className="pb-28 lg:pb-0">
        {/* ══════════ ABERTURA ══════════ */}
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-10">
          <div>
            <SeloDoPacote />

            <h1 className="sr-only">Manual de Radiologia</h1>
            <LogoRadiologia className="mt-4" />

            {alvo ? (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                <strong className="font-semibold text-foreground">{alvo}</strong> faz parte do Manual de
                Radiologia — o atlas de imagem do Manual Clínico. Ele é privativo de assinantes: não entra no
                teste grátis e não é vendido à parte.
              </p>
            ) : (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Duas modalidades num atlas só. Percorra pilhas reais de tomografia corte a corte como numa
                estação de trabalho e acenda cada estrutura sobre {rxEstudos} incidências radiográficas
                organizadas por região — com dossiê, roteiro de leitura e armadilhas em cada uma.
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {numeros.map((n) => (
                <div key={n.r} className="rounded-xl border border-border bg-card px-3 py-2.5">
                  <p className="font-heading text-xl font-semibold tracking-tight text-primary">{n.v}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{n.r}</p>
                </div>
              ))}
            </div>

            <FaixaDoPacote atual="radiologia" className="mt-6" />

            <AvisoJaTenho className="mt-3" />

            {/* ── As duas modalidades ── */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ModalidadeCartao
                icone={ImageIcon}
                etiqueta="Atlas de Raio-X"
                titulo={`${rxEstudos} incidências em ${rxRegioes} regiões`}
                texto={`${rxEstruturas} demarcações interativas sobre o filme, com nome em português e o termo anatômico original. Cada região traz técnica, critérios de qualidade, roteiro, armadilhas e medidas de referência.`}
                tom="sky"
              />
              <ModalidadeCartao
                icone={Layers3}
                etiqueta="Atlas de Tomografia"
                titulo={`${resumo?.series ?? 20} séries, ${resumo?.cortes ?? 640} cortes`}
                texto={`Tórax, abdome e crânio em exames inteiros, na ordem em que o aparelho reconstruiu. ${tcEstruturas} estruturas com densidade em UH, janela ideal, clínica e alterações.`}
                tom="violet"
              />
            </div>
          </div>

          {/* ── Prévias + preço ── */}
          <div className="space-y-5 lg:sticky lg:top-6">
            <div className="glass-panel-dark overflow-hidden rounded-2xl p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap gap-1.5">
                <BotaoPrevia ativo={modalidade === 'raio-x'} onClick={() => setModalidade('raio-x')}>
                  Raio-X
                </BotaoPrevia>
                <BotaoPrevia ativo={modalidade === 'tc'} onClick={() => setModalidade('tc')}>
                  Tomografia
                </BotaoPrevia>
              </div>

              {modalidade === 'raio-x' ? (
                <PreviaRaioX />
              ) : (
                <>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {AMOSTRAS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAmostra(a)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                          amostra.id === a.id
                            ? 'bg-emerald-400 text-neutral-900'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {a.regiao}
                      </button>
                    ))}
                  </div>
                  <PreviaCine regiao={amostra.regiao} urls={urls} />
                </>
              )}
            </div>

            {/* O cartão lateral mostra o tamanho do pacote, não o preço: quem chega
                aqui ainda não sabe que a compra abre outros seis manuais, e um
                número antes disso vira comparação com o preço de um atlas avulso.
                O preço vem inteiro mais abaixo, depois do acervo. */}
            <div className="glass-panel overflow-hidden rounded-2xl p-5 sm:p-6">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <Sparkles className="h-3.5 w-3.5" /> O que a compra abre
              </p>
              <h2 className="mt-2 font-heading text-lg font-semibold leading-snug tracking-tight">
                A Radiologia é um dos {TOTAL_DE_MODULOS} manuais — e todos vêm juntos
              </h2>
              <ListaDoPacote atual="radiologia" className="mt-3.5" />
              <button
                onClick={onCheckout}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
              >
                <Crown className="h-4 w-4" />
                Quero os {TOTAL_DE_MODULOS} manuais
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Pix, cartão ou boleto · pagamento processado com
                segurança.
              </p>
            </div>
          </div>
        </div>

        {/* ══════════ O QUE VOCÊ RECEBE ══════════ */}
        <section className="mt-14">
          <p className="editorial-mark mb-2">O que está do outro lado</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Não é uma galeria de imagens. É uma estação de trabalho com um professor ao lado.
          </h2>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <BlocoModalidade
              etiqueta="No atlas de Raio-X"
              icone={ImageIcon}
              tom="sky"
              recursos={RECURSOS_RX}
            />
            <BlocoModalidade
              etiqueta="No atlas de Tomografia"
              icone={Layers3}
              tom="violet"
              recursos={RECURSOS_TC}
            />
          </div>
        </section>

        {/* ══════════ CADERNO ══════════ */}
        <section className="mt-14 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
            <div className="p-5 sm:p-7">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-primary">
                <StickyNote className="h-3.5 w-3.5" /> Incluso · caderno radiográfico
              </p>
              <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                As suas anotações ficam dentro do exame
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                Cada série de tomografia e cada incidência de Raio-X tem um caderno próprio — pautado, com
                espiral e margem, do jeito que se anota no plantão. A ficha nasce ancorada na estrutura que
                você estava olhando, aceita cor de marca-texto e volta exatamente ali quando você reabrir o
                exame. Fica na sua conta, então acompanha você entre celular, notebook e computador.
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  'Uma folha por seção do exame',
                  'Ancorada na estrutura selecionada',
                  'Cores de marcação e busca',
                  'Sincroniza entre dispositivos',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative min-h-[190px] overflow-hidden border-t border-border bg-muted/30 p-5 md:border-l md:border-t-0">
              <div className="cad-papel cad-espiral h-full rounded-xl border border-black/10 p-4 pl-9 shadow-inner">
                <p className="cad-manuscrito text-[15px] leading-[26px] text-neutral-800">
                  hilo esquerdo sempre + alto que o direito
                </p>
                <p className="cad-manuscrito text-[15px] leading-[26px] text-neutral-800">
                  índice cardiotorácico só vale em PA!
                </p>
                <p className="cad-manuscrito text-[15px] leading-[26px] text-neutral-800">
                  seio costofrênico velado = 200 mL
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ O ACERVO ══════════ */}
        <section className="mt-14">
          <p className="editorial-mark mb-2">O acervo</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            {rxEstudos} incidências e {resumo?.series ?? 20} séries, região por região
          </h2>

          {rx && rx.regioes.length > 0 && (
            <>
              <p className="mt-5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                <ImageIcon className="h-3.5 w-3.5" /> Raio-X
              </p>
              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {rx.regioes.map((regiao) => (
                  <div
                    key={regiao.id}
                    className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-heading text-sm font-semibold">{regiao.titulo}</p>
                      <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                    </div>
                    <p className="mt-0.5 font-clinical text-[10px] uppercase tracking-wider text-muted-foreground">
                      {regiao.estudos} inc · {regiao.estruturas} estr
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      {regiao.incidencias.join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {resumo && resumo.secoes.length > 0 && (
            <>
              <p className="mt-8 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">
                <Layers3 className="h-3.5 w-3.5" /> Tomografia
              </p>
              <div className="mt-2.5 grid gap-4 lg:grid-cols-3">
                {resumo.secoes.map((s, i) => {
                  const t = tema(['vermelho', 'violeta', 'azul'][i] || 'ardosia')
                  return (
                    <div key={s.id} className="overflow-hidden rounded-xl border border-border bg-card">
                      <div className={`bg-gradient-to-b ${t.grad} px-4 py-3`}>
                        <p className="font-heading text-base font-semibold tracking-tight">{s.titulo}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                          {s.series} séries · {s.estruturas} estruturas · {s.cortes} cortes
                        </p>
                      </div>
                      <ul className="divide-y divide-border">
                        {s.titulosSeries.map((titulo) => (
                          <li key={titulo} className="flex items-center gap-2 px-4 py-2 text-sm">
                            <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                            <span className="text-muted-foreground">{titulo}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </section>

        {/* ══════════ PROFUNDIDADE DA FICHA ══════════ */}
        <section className="mt-14">
          <p className="editorial-mark mb-2">A profundidade</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Cada uma das {tcEstruturas + rxEstruturas} estruturas tem ficha própria
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Não é uma legenda com o nome da estrutura. É o dossiê completo — o que você leria num tratado, mas
            organizado na ordem em que a dúvida aparece enquanto você olha a imagem.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPOS_FICHA.map((c) => (
              <div key={c.t} className="rounded-xl border border-border bg-muted/30 p-4">
                <c.icon className="mb-2 h-4 w-4 text-primary" />
                <p className="text-sm font-bold">{c.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════ O PACOTE — o valor inteiro, antes do preço ══════════ */}
        <GradeDoPacote atual="radiologia" className="mt-14" />

        {/* ══════════ A OFERTA ══════════ */}
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

        {/* ══════════ FECHAMENTO ══════════ */}
        <FechamentoDoPacote
          className="mt-4"
          onCheckout={onCheckout}
          precoFinal={precoFinal}
          mostrarPreco={mostrarPreco}
        />

        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          Material educacional. As imagens são usadas para ensino de anatomia radiológica e não substituem
          laudo, avaliação clínica, escolha do método de imagem ou protocolo institucional.
        </p>
      </div>

      {/* ══════════ BARRA FIXA DO CELULAR ══════════ */}
      <BarraDoPacote
        onCheckout={onCheckout}
        precoBase={precoBase}
        precoFinal={precoFinal}
        temLote={temLote}
        pctLote={pctLote}
        mostrarPreco={mostrarPreco}
      />

    </>
  )
}

/* ─────────────────────────────── Peças ─────────────────────────────── */

function BotaoPrevia({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition ${
        ativo ? 'bg-sky-400 text-neutral-900' : 'bg-white/10 text-white/70 hover:bg-white/20'
      }`}
    >
      {children}
    </button>
  )
}

const TONS = {
  sky: {
    borda: 'border-sky-500/25',
    // Classe literal: o Tailwind varre o código-fonte, então uma variante
    // montada por interpolação nunca chega a existir no CSS.
    hover: 'hover:border-sky-500/45',
    fundo: 'bg-sky-500/[0.05]',
    texto: 'text-sky-600 dark:text-sky-400',
  },
  violet: {
    borda: 'border-violet-500/25',
    hover: 'hover:border-violet-500/45',
    fundo: 'bg-violet-500/[0.05]',
    texto: 'text-violet-600 dark:text-violet-400',
  },
} as const

function ModalidadeCartao({
  icone: Icone,
  etiqueta,
  titulo,
  texto,
  tom,
}: {
  icone: typeof ImageIcon
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
      <p className="mt-1.5 font-heading text-base font-semibold leading-tight">{titulo}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{texto}</p>
    </div>
  )
}

function BlocoModalidade({
  etiqueta,
  icone: Icone,
  tom,
  recursos,
}: {
  etiqueta: string
  icone: typeof ImageIcon
  tom: keyof typeof TONS
  recursos: { icon: typeof ImageIcon; t: string; d: string }[]
}) {
  const t = TONS[tom]
  return (
    <div>
      <p className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider ${t.texto}`}>
        <Icone className="h-3.5 w-3.5" /> {etiqueta}
      </p>
      <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
        {recursos.map((r) => (
          <div
            key={r.t}
            className={`rounded-xl border border-border bg-card p-4 transition-colors ${t.hover}`}
          >
            <r.icon className={`mb-2 h-5 w-5 ${t.texto}`} />
            <p className="text-sm font-bold">{r.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.d}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
