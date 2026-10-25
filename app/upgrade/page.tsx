'use client'

/*
 * /upgrade — a oferta de upgrade Quest+ → Plus+.
 *
 * Quem chega aqui já paga o Quest+ (pelo e-mail, pelo perfil ou por /buy, que
 * manda o Quest+ para cá). A página tem um trabalho só: fazer o "sim" ser
 * óbvio. Três decisões mandam nela:
 *
 * 1. O PREÇO DE UPGRADE É O HERÓI. Riscado o preço de tabela, ao lado o
 *    desconto, embaixo o número grande e o "por mês". Nada compete com ele
 *    na primeira tela do celular.
 * 2. TODA OBJEÇÃO TEM RESPOSTA ANTES DE SER PENSADA. "Perco o Quest+ que já
 *    paguei?", "vou pagar os dois?", "e se eu não gostar?" — cada uma vira
 *    uma linha de "sem pegadinha", e cada promessa ali é cumprida pelo
 *    servidor (lib/upgrade-quest.ts), não só escrita.
 * 3. A URGÊNCIA NUNCA MENTE SOBRE O PREÇO. O contador fecha uma janela e abre
 *    outra (`prazoDaOferta`); o checkout cobra o preço de upgrade enquanto a
 *    conta for Quest+. Quem clica no último segundo nunca vê outro número.
 */

import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Activity,
  BookOpen,
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  FileDown,
  FileText,
  FlaskConical,
  Layers,
  ListChecks,
  Lock,
  Microscope,
  Pill,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  GraduationCap,
  Undo2,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { FundoIos } from '@/components/materiais/fundo-ios'
import { ContagemRegressiva, useContagemDaOferta } from '@/components/upgrade/contagem'
import '@/components/upgrade/venda.css'
import { ProuniCta } from '@/components/prouni/prouni-cta'
import {
  precoAnunciado,
  useOfertaDeUpgrade,
  type OfertaDeUpgrade,
  type PlanoDaOfertaDeUpgrade,
} from '@/hooks/use-oferta-de-upgrade'
import { apresentarPreco, formatarBRL, rotuloDeCiclo } from '@/lib/buy/pricing'
import type { ChaveDoItem } from '@/lib/plus-oferta'
import { cn } from '@/lib/utils'

const WHATSAPP = '5524992230908'

/** O Quest+ já dá estes dois — eles vão para "continua com você". */
const JA_NO_QUEST: ChaveDoItem[] = ['bancoQuestoes', 'provasPdf']

const ICONES: Record<ChaveDoItem, LucideIcon> = {
  materiais: FileText,
  flashcards: Layers,
  anatomia3d: Activity,
  histologia: Microscope,
  semiologia: Stethoscope,
  radiologia: ScanLine,
  farmacologia: Pill,
  patologias: BookOpen,
  ferramentas: Calculator,
  exames: FlaskConical,
  eletro: Activity,
  bancoQuestoes: ListChecks,
  provasPdf: FileDown,
  provasIa: Sparkles,
}

export default function UpgradePage() {
  return (
    <AppShell vidro headerTitle="Upgrade" headerSubtitle="Quest+ → Plus+">
      {/* `useSearchParams` pede uma fronteira de Suspense para o casco seguir estático. */}
      <Suspense fallback={null}>
        <ConteudoDoUpgrade />
      </Suspense>
    </AppShell>
  )
}

function ConteudoDoUpgrade() {
  const router = useRouter()
  const params = useSearchParams()
  const previa = params?.get('previa') === '1'
  const oferta = useOfertaDeUpgrade({ previa })

  return (
    <FundoIos className="pb-36 xl:pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-3 sm:px-6 sm:pt-5">
        <button type="button" onClick={() => router.back()} className="ios-voltar -ml-2.5 mb-2">
          <ChevronLeft className="h-[22px] w-[22px] shrink-0" strokeWidth={2.5} />
          Voltar
        </button>

        {oferta === undefined ? (
          <Esqueleto />
        ) : oferta?.elegivel && oferta.planos?.length ? (
          <Oferta oferta={oferta} />
        ) : (
          <SemOferta oferta={oferta} />
        )}
      </div>
    </FundoIos>
  )
}

/* ─────────────────────────── A oferta ─────────────────────────── */

function nomeCurto(plano: PlanoDaOfertaDeUpgrade): string {
  const periodo = plano.periodo.replace(/^plano\s+/i, '').trim()
  return periodo ? `Plus+ ${periodo}` : 'Plus+'
}

function Oferta({ oferta }: { oferta: OfertaDeUpgrade }) {
  const planos = oferta.planos!
  const pct = oferta.descontoPercentual ?? 0
  const [tipo, setTipo] = useState(oferta.planoPadrao || planos[0].tipo)
  const plano = planos.find((p) => p.tipo === tipo) || planos[0]
  const indice = Math.max(0, planos.indexOf(plano))
  const falta = useContagemDaOferta(oferta.restanteMs, oferta.recebidaEm, oferta.janelaHoras)

  // Bolsista PROUNI/FIES com concessão para o plano: o preço anunciado é o do
  // benefício com o extra de upgrade por cima (o mesmo que o checkout cobra).
  const anuncio = precoAnunciado(plano)
  const final = anuncio.preco
  const bolsista = anuncio.bolsista
  const extra = oferta.descontoExtraBolsista ?? null
  // O selo diz o desconto total sobre a tabela — para o bolsista, PROUNI + extra.
  const pctTotal = bolsista ? Math.round(100 - (final / plano.preco) * 100) : pct
  const preco = useMemo(
    () => apresentarPreco({ preco: final, durationMonths: plano.durationMonths }),
    [final, plano.durationMonths],
  )
  const economia = Math.max(0, Math.round((plano.preco - final) * 100) / 100)
  const ganhos = plano.inclusos.filter((i) => !JA_NO_QUEST.includes(i.chave))
  const destino = `/buy/checkout?plan=${encodeURIComponent(plano.tipo)}&origem=upgrade`

  // A barra de baixo só sobe quando o botão do painel sai da tela.
  const refDoBotao = useRef<HTMLAnchorElement>(null)
  const [botaoVisivel, setBotaoVisivel] = useState(true)
  useEffect(() => {
    const alvo = refDoBotao.current
    if (!alvo || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(([e]) => setBotaoVisivel(e.isIntersecting), { threshold: 0 })
    obs.observe(alvo)
    return () => obs.disconnect()
  }, [])

  const registrarClique = () => {
    fetch('/api/analytics/checkout-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'buy_click',
        productId: plano.tipo,
        productTitle: plano.nome,
        productType: 'subscription',
        amount: final,
        source: 'Upgrade Quest+',
        metadata: { descontoPercentual: pctTotal, bolsista, precoBase: plano.preco, durationMonths: plano.durationMonths },
      }),
      keepalive: true,
    }).catch(() => {})
  }

  const quest = oferta.quest
  const expiraEm = quest?.expiraEm ? new Date(quest.expiraEm) : null

  return (
    <>
      {oferta.previa && (
        <p className="ios-lista ios-rotulo-2 mb-4 px-4 py-3 text-[13px] leading-snug">
          <strong className="ios-ambar">Prévia do admin.</strong> É assim que um assinante Quest+ vê a página. O
          desconto só vale no checkout para contas Quest+ de verdade.
        </p>
      )}

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-10">
        {/* ── Manchete ── */}
        <header className="venda-sobe min-w-0 lg:col-start-1 lg:row-start-1 lg:pt-6">
          <span className="venda-capsula">
            <Crown className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {bolsista ? 'Quest+ bolsista PROUNI/FIES · condição especial' : 'Exclusivo para assinantes Quest+'}
            </span>
          </span>
          <h1 className="ios-titulo-grande mt-3">
            {bolsista ? (
              <>
                {oferta.primeiroNome ? `${oferta.primeiroNome}, seu` : 'Seu'} PROUNI/FIES vale{' '}
                <span className="ios-ambar">+{extra}% extra</span> no upgrade.
              </>
            ) : (
              <>
                {oferta.primeiroNome ? `${oferta.primeiroNome}, o` : 'O'} DomineAqui inteiro, com{' '}
                <span className="ios-ambar">{pct}% de desconto</span>.
              </>
            )}
          </h1>
          <p className="ios-rotulo-2 mt-3 max-w-xl text-[17px] leading-relaxed">
            Você já treina no Banco de Questões. O upgrade libera manuais, materiais, flashcards e a IA — e tudo o que
            você já tem continua.
          </p>
        </header>

        {/* ── Painel do preço ── */}
        <aside className="venda-sobe venda-sobe-2 min-w-0 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <section className="venda-painel" aria-labelledby="preco-titulo">
            {falta !== null && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <span className="ios-rotulo-2 text-[13px] font-semibold">Seu preço está reservado por</span>
                <ContagemRegressiva faltaMs={falta} />
              </div>
            )}

            {planos.length > 1 && (
              <div
                role="tablist"
                aria-label="Escolha o plano"
                className="venda-seg mb-5"
                style={{ '--n': planos.length, '--i': indice } as CSSProperties}
              >
                {planos.map((p) => {
                  const ativo = p.tipo === plano.tipo
                  const mensal = p.durationMonths > 0 ? precoAnunciado(p).preco / p.durationMonths : null
                  return (
                    <button
                      key={p.tipo}
                      type="button"
                      role="tab"
                      aria-selected={ativo}
                      onClick={() => setTipo(p.tipo)}
                      className="venda-seg-item"
                    >
                      <span className="max-w-full truncate">{p.periodo.replace(/^plano\s+/i, '') || p.nome}</span>
                      <span className="venda-seg-nota">
                        {mensal !== null ? `R$ ${formatarBRL(mensal)}/mês` : 'vitalício'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <h2 id="preco-titulo" className="text-[17px] font-semibold tracking-[-0.015em]">
                {nomeCurto(plano)}
              </h2>
              {plano.badge && <span className="ios-selo ios-selo-claro">{plano.badge}</span>}
            </div>

            <p className="ios-rotulo-2 mt-3 flex flex-wrap items-center gap-2 text-[15px]">
              <s className="tabular-nums">R$ {formatarBRL(plano.preco)}</s>
              <span className="venda-selo-desconto">−{pctTotal}%</span>
            </p>
            <p className="venda-preco mt-1.5">
              <span className="venda-preco-moeda">R$</span>
              {formatarBRL(final)}
            </p>
            {bolsista && plano.precoComProuni != null && (
              // A conta aberta: o que o PROUNI/FIES já dava, e o extra por cima.
              <p className="ios-tinta mt-2 flex items-start gap-1.5 text-[13px] font-semibold leading-snug">
                <GraduationCap className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  Com o seu PROUNI/FIES sairia R$ {formatarBRL(plano.precoComProuni)}; o upgrade tira mais {extra}%.
                </span>
              </p>
            )}
            <p className="mt-2.5 flex flex-wrap items-center gap-2 text-[14px]">
              {preco.mensal !== null && plano.durationMonths > 1 && (
                <span className="ios-rotulo-2">
                  Dá <strong className="ios-numeros text-[color:var(--ios-rotulo)]">R$ {formatarBRL(preco.mensal)}</strong> por
                  mês
                </span>
              )}
              {economia > 0 && <span className="venda-economia">você economiza R$ {formatarBRL(economia)}</span>}
            </p>

            <Link
              ref={refDoBotao}
              href={destino}
              onClick={registrarClique}
              className="buy-cta buy-cta-halo mt-5 flex w-full flex-col items-center justify-center gap-0.5 rounded-[18px] px-4 py-3.5 text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="flex items-center gap-2 text-[17px] font-extrabold tracking-tight">
                <Zap className="h-[18px] w-[18px]" aria-hidden />
                Fazer meu upgrade agora
                <ChevronRight className="buy-cta-seta h-5 w-5" aria-hidden />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em]">
                R$ {formatarBRL(final)} · pagamento único
              </span>
            </Link>

            <div className="venda-garantias mt-3">
              <span>
                <Zap className="h-4 w-4" aria-hidden />
                Acesso na hora
              </span>
              <span>
                <Undo2 className="h-4 w-4" aria-hidden />
                7 dias de garantia
              </span>
              <span>
                <Lock className="h-4 w-4" aria-hidden />
                Pix, cartão ou boleto
              </span>
            </div>

            {/* Quem ainda não tem o benefício vê o convite para pedir (o
                componente some sozinho se o plano não tem PROUNI/FIES). */}
            {!bolsista && !oferta.previa && <ProuniCta itemType="plus" itemId={plano.tipo} className="mt-3" />}
          </section>
        </aside>

        {/* ── O que muda ── */}
        <div className="venda-sobe venda-sobe-3 min-w-0 space-y-8 lg:col-start-1 lg:row-start-2">
          {ganhos.length > 0 && (
            <section aria-labelledby="ganhos-titulo">
              <h2 id="ganhos-titulo" className="ios-titulo-secao mb-2.5">
                O que passa a ser seu
              </h2>
              <ul className="ios-lista [--ios-recuo:58px]">
                {ganhos.map((item) => {
                  const Icone = ICONES[item.chave] || Check
                  return (
                    <li key={item.chave} className="ios-linha">
                      <span className="venda-icone-linha">
                        <Icone className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 text-[15px] font-medium tracking-[-0.01em]">{item.rotulo}</span>
                      <Check className="ios-tinta h-4 w-4 shrink-0" strokeWidth={3} aria-hidden />
                    </li>
                  )
                })}
              </ul>
              <p className="ios-pe-lista">
                Tudo liberado no momento em que o pagamento é aprovado. Pix costuma cair em segundos.
              </p>
            </section>
          )}

          <section aria-labelledby="continua-titulo">
            <h2 id="continua-titulo" className="ios-titulo-secao mb-2.5">
              O que continua com você
            </h2>
            <ul className="ios-lista [--ios-recuo:58px]">
              <li className="ios-linha">
                <span className="venda-icone-linha venda-icone-linha-ambar">
                  <ListChecks className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-[15px] font-medium">Banco de Questões completo</span>
              </li>
              <li className="ios-linha">
                <span className="venda-icone-linha venda-icone-linha-ambar">
                  <FileDown className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-[15px] font-medium">Provas em PDF, com gabarito e comentário</span>
              </li>
            </ul>
          </section>

          <section aria-labelledby="pegadinha-titulo">
            <h2 id="pegadinha-titulo" className="ios-titulo-secao mb-2.5">
              Sem pegadinha
            </h2>
            <ul className="ios-lista [--ios-recuo:58px]">
              <LinhaDeGarantia icone={RefreshCcw} titulo="Seu Quest+ não se perde">
                {quest?.vitalicio
                  ? 'Seu Quest+ é vitalício: se um dia o Plus+ terminar, ele volta sozinho.'
                  : expiraEm
                    ? `O Plus+ começa hoje. Se ainda sobrar Quest+ quando ele terminar, o Quest+ volta sozinho até ${expiraEm.toLocaleDateString('pt-BR')}.`
                    : 'O Plus+ começa hoje. Se ainda sobrar Quest+ quando ele terminar, o Quest+ volta sozinho até a data que você já pagou.'}
              </LinhaDeGarantia>
              <LinhaDeGarantia icone={ShieldCheck} titulo="Você nunca paga os dois">
                {quest?.recorrente
                  ? 'A renovação automática do Quest+ é encerrada no momento do upgrade. Nada mais é cobrado dele.'
                  : `É pagamento único${plano.durationMonths > 0 ? `, com ${rotuloDeCiclo(plano.durationMonths)} de Plus+` : ''}: nada fica renovando no seu cartão.`}
              </LinhaDeGarantia>
              {bolsista ? (
                <LinhaDeGarantia icone={GraduationCap} titulo="Seu benefício vale mais aqui">
                  {`Em outras compras o PROUNI/FIES não soma com cupom; no upgrade ele soma com +${extra}% extra. O benefício é usado nesta compra.`}
                </LinhaDeGarantia>
              ) : extra != null ? (
                <LinhaDeGarantia icone={GraduationCap} titulo="Bolsista PROUNI/FIES ganha mais">
                  {`Com o benefício aprovado para o Plus+, o upgrade soma +${extra}% extra em cima dele.`}
                </LinhaDeGarantia>
              ) : null}
              <LinhaDeGarantia icone={Undo2} titulo="7 dias para testar">
                Não gostou? Devolvemos 100% do valor e seu Quest+ volta exatamente como estava.
              </LinhaDeGarantia>
            </ul>
          </section>

          <p className="ios-rotulo-2 text-center text-[13px]">
            Ficou alguma dúvida?{' '}
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ios-tinta font-semibold underline-offset-4 hover:underline"
            >
              Chama no WhatsApp
            </a>{' '}
            — responde gente, não robô.
          </p>
        </div>
      </div>

      {/* ── Barra de baixo (celular e tablet) ── */}
      <div
        className="ios-barra-inferior ios-vidro flex items-center gap-3 p-2 pl-4 lg:hidden"
        data-visivel={botaoVisivel ? 'false' : 'true'}
        aria-hidden={botaoVisivel}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold">
            {nomeCurto(plano)} <span className="ios-ambar">−{pctTotal}%</span>
          </span>
          <span className="block whitespace-nowrap text-[15px] font-bold tabular-nums">
            <span className="ios-rotulo-3 mr-1.5 text-[13px] font-medium line-through">R$ {formatarBRL(plano.preco)}</span>
            R$ {formatarBRL(final)}
          </span>
        </span>
        {/* O invólucro esconde: o `display` do próprio contador vem do CSS
            dele e venceria o `hidden` posto direto nele. */}
        {falta !== null && (
          <span className="hidden min-[430px]:inline-flex">
            <ContagemRegressiva faltaMs={falta} tamanho="compacto" />
          </span>
        )}
        <Link
          href={destino}
          onClick={registrarClique}
          tabIndex={botaoVisivel ? -1 : 0}
          className="buy-cta inline-flex h-11 shrink-0 items-center gap-1 rounded-full px-4 text-[15px] font-extrabold text-secondary-foreground"
        >
          Upgrade
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </>
  )
}

function LinhaDeGarantia({
  icone: Icone,
  titulo,
  children,
}: {
  icone: LucideIcon
  titulo: string
  children: React.ReactNode
}) {
  return (
    <li className="ios-linha !items-start !py-3.5">
      <span className="venda-icone-linha mt-0.5">
        <Icone className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold tracking-[-0.01em]">{titulo}</span>
        <span className="ios-rotulo-2 mt-0.5 block text-[14px] leading-snug">{children}</span>
      </span>
    </li>
  )
}

/* ─────────────────────────── Sem oferta ─────────────────────────── */

function SemOferta({ oferta }: { oferta: OfertaDeUpgrade | null }) {
  const perfil = oferta?.perfil
  const jaPlus = perfil === 'plus'
  const quest = perfil === 'quest'

  const titulo = jaPlus
    ? 'Você já tem o Plus+.'
    : quest
      ? 'O upgrade com desconto não está no ar agora.'
      : 'Esta oferta é exclusiva para assinantes Quest+.'
  const texto = jaPlus
    ? 'A plataforma inteira já é sua. Bons estudos!'
    : quest
      ? 'Você ainda pode levar a plataforma inteira: os planos Plus+ estão na página de planos.'
      : 'Mas a plataforma inteira está a um clique: veja os planos Plus+.'

  return (
    <section className="venda-sobe mx-auto max-w-xl pt-8 text-center">
      <span className="venda-icone-linha venda-icone-linha-ambar mx-auto h-12 w-12 rounded-2xl">
        <Crown className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="ios-titulo-produto mt-4">{titulo}</h1>
      <p className="ios-rotulo-2 mt-2 text-[16px] leading-relaxed">{texto}</p>
      <Link href={jaPlus ? '/dashboard' : '/buy'} className="ios-botao ios-botao-g mt-6 px-7">
        {jaPlus ? 'Ir para o painel' : 'Ver os planos Plus+'}
      </Link>
    </section>
  )
}

function Esqueleto() {
  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10" aria-hidden>
      <div className="space-y-3 lg:pt-6">
        <div className="ios-esqueleto h-7 w-56 rounded-full" />
        <div className="ios-esqueleto h-10 w-11/12 rounded-xl" />
        <div className="ios-esqueleto h-10 w-3/4 rounded-xl" />
        <div className="ios-esqueleto h-16 w-full rounded-xl" />
      </div>
      <div className="ios-esqueleto h-[420px] w-full rounded-[28px]" />
    </div>
  )
}
