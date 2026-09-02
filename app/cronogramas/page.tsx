'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  ListChecks,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { AppShell, useAppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { LimitWarning } from '@/components/limit-warning'
import { Calendario } from '@/components/cronogramas/calendario'
import { EmentaNavegador } from '@/components/cronogramas/ementa-navegador'
import { SeletorSecao } from '@/components/cronogramas/seletor-secao'
import { useCronogramaSecao } from '@/hooks/use-cronograma-secao'
import { getCronogramasLimit } from '@/lib/tier-limits'
import { abrirCronogramaImpresso, abrirEmentaImpressa } from '@/lib/cronogramas/pdf'
import {
  diasEntre,
  faixaProximidade,
  formatarDiaCurto,
  hojeBrasilia,
  textoProximidade,
} from '@/lib/cronogramas/brasilia'
import {
  ESTILO_FAIXA,
  getSecao,
  getTipoAvaliacao,
  type Avaliacao,
} from '@/lib/cronogramas/tipos'
import {
  agregarCarga,
  resumirPlano,
  resumirTudo,
  type PlanoBruto,
} from '@/lib/cronogramas/progresso'
import type { AccountType } from '@/lib/types'

type Aba = 'calendario' | 'planos' | 'ementa'

const ABAS: Array<{ id: Aba; rotulo: string; curto: string; icone: typeof CalendarDays }> = [
  { id: 'calendario', rotulo: 'Calendário', curto: 'Agenda', icone: CalendarDays },
  { id: 'planos', rotulo: 'Meus planos', curto: 'Planos', icone: ListChecks },
  { id: 'ementa', rotulo: 'Ementa', curto: 'Ementa', icone: BookOpen },
]

const ABAS_IDS = ABAS.map(item => item.id)

/**
 * A aba vive na URL (`?vista=planos`).
 *
 * Sem isso, recarregar a página, voltar de um plano aberto ou mandar o link
 * para um colega jogava todo mundo de volta no calendário — e a aba escolhida
 * é justamente a pergunta que o aluno acabou de responder. Fica em
 * `history.replaceState` em vez de `useSearchParams` de propósito: trocar de
 * aba não é navegação, não deveria empilhar entrada no histórico nem obrigar a
 * rota inteira a esperar um limite de Suspense.
 */
function lerAbaDaUrl(): Aba {
  if (typeof window === 'undefined') return 'calendario'
  const valor = new URLSearchParams(window.location.search).get('vista')
  return (ABAS_IDS as string[]).includes(valor ?? '') ? (valor as Aba) : 'calendario'
}

function gravarAbaNaUrl(aba: Aba) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (aba === 'calendario') url.searchParams.delete('vista')
  else url.searchParams.set('vista', aba)
  window.history.replaceState(null, '', url)
}

/**
 * Área de cronogramas do aluno.
 *
 * A página abria numa grade de mês — bonita, e a resposta errada para a
 * primeira pergunta de quem entra aqui, que nunca é "que dia é hoje" e sim
 * *"o que eu tenho que fazer agora, e estou atrasado?"*. Descobrir isso
 * custava três cliques: aba de planos, abrir o plano, rolar até achar o dia.
 *
 * Agora o topo responde as três perguntas de uma vez — a próxima avaliação, o
 * que está marcado para hoje e o que venceu sem ser feito — e só depois vêm os
 * três destinos (agenda, planos, ementa), cada um a um clique e agora
 * gravados na URL. O seletor de seção e período, que ocupava um cartão inteiro
 * e é mexido uma vez por semestre, virou uma pílula que abre quando precisa.
 */
function ConteudoCronogramas() {
  const router = useRouter()
  const { isAdmin, accountType: tipoDeConta } = useAppShell()

  const contexto = useCronogramaSecao()
  const [aba, definirAba] = useState<Aba>('calendario')
  const [foco, setFoco] = useState<{ dia: string; token: number } | null>(null)

  const [cronogramas, setCronogramas] = useState<PlanoBruto[]>([])
  const [carregandoPlanos, setCarregandoPlanos] = useState(true)
  const [apagando, setApagando] = useState<string | null>(null)

  // A URL é a fonte da verdade na primeira pintura, mas ela só existe no
  // cliente: ler no `useState` inicial faria o HTML do servidor e o do
  // navegador discordarem (hydration mismatch).
  useEffect(() => {
    definirAba(lerAbaDaUrl())
  }, [])

  const setAba = useCallback((nova: Aba) => {
    definirAba(nova)
    gravarAbaNaUrl(nova)
  }, [])

  useEffect(() => {
    let ativo = true
    fetch('/api/cronogramas')
      .then(resposta => (resposta.ok ? resposta.json() : null))
      .then(dados => {
        if (!ativo) return
        setCronogramas(
          (dados?.cronogramas ?? []).map((item: any) => ({ ...item, _id: String(item._id) })),
        )
      })
      .catch(() => {})
      .finally(() => {
        if (ativo) setCarregandoPlanos(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  const accountType = tipoDeConta as AccountType
  const limite = getCronogramasLimit(accountType)
  const noLimite = !isAdmin && accountType === 'gratuito' && cronogramas.length >= limite

  const hoje = contexto.hoje || hojeBrasilia()
  const cargaPorDia = useMemo(() => agregarCarga(cronogramas), [cronogramas])
  const geral = useMemo(() => resumirTudo(cronogramas, hoje), [cronogramas, hoje])

  const proximaAvaliacao = useMemo(
    () =>
      contexto.avaliacoes
        .filter(item => item.data >= hoje)
        .sort((a, b) => a.data.localeCompare(b.data))[0],
    [contexto.avaliacoes, hoje],
  )

  const secao = getSecao(contexto.secao)
  const rotuloContexto = `${secao.nome} · ${contexto.periodo}º período`

  /** Manda o calendário abrir num dia específico — o clique vem da barra de foco. */
  const focarDia = useCallback(
    (dia: string) => {
      setFoco({ dia, token: Date.now() })
      setAba('calendario')
    },
    [setAba],
  )

  async function apagar(id: string) {
    setApagando(id)
    try {
      const resposta = await fetch(`/api/cronogramas/${id}`, { method: 'DELETE' })
      if (resposta.ok) setCronogramas(anterior => anterior.filter(item => item._id !== id))
    } finally {
      setApagando(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:py-7">
        <BarraDeContexto
          contexto={contexto}
          podeCriar={!noLimite}
          onCriar={() => router.push('/cronogramas/criar')}
        />

        <PainelDeFoco
          carregando={carregandoPlanos || (contexto.carregandoAvaliacoes && !contexto.pronto)}
          hoje={hoje}
          proxima={proximaAvaliacao}
          geral={geral}
          temPlanos={cronogramas.length > 0}
          onVerAvaliacao={focarDia}
          onAbrirPlano={id => router.push(`/cronogramas/${id}`)}
          onCriar={() => router.push('/cronogramas/criar')}
          podeCriar={!noLimite}
        />

        {noLimite && (
          <div className="mb-5">
            <LimitWarning current={cronogramas.length} max={limite} itemName="Cronogramas" />
          </div>
        )}

        <Abas
          ativa={aba}
          onChange={setAba}
          contadores={{
            calendario: contexto.avaliacoes.filter(item => item.data >= hoje).length,
            planos: cronogramas.length,
            ementa: 0,
          }}
        />

        <div
          id="painel-calendario"
          role="tabpanel"
          aria-labelledby="aba-calendario"
          hidden={aba !== 'calendario'}
        >
          {aba === 'calendario' &&
            (contexto.carregandoAvaliacoes && contexto.avaliacoes.length === 0 ? (
              <EsqueletoCalendario />
            ) : (
              <Calendario
                avaliacoes={contexto.avaliacoes}
                cargaPorDia={cargaPorDia}
                hoje={hoje}
                foco={foco}
                lembretes={{
                  ativos: contexto.lembretesAtivos,
                  onChange: contexto.setLembretes,
                  salvando: contexto.salvandoLembretes,
                }}
                onNovaAvaliacao={
                  isAdmin ? dia => router.push(`/admin/cronogramas?novo=${dia}`) : undefined
                }
              />
            ))}
        </div>

        <div id="painel-planos" role="tabpanel" aria-labelledby="aba-planos" hidden={aba !== 'planos'}>
          {aba === 'planos' && (
            <ListaDePlanos
              cronogramas={cronogramas}
              hoje={hoje}
              carregando={carregandoPlanos}
              apagando={apagando}
              onAbrir={id => router.push(`/cronogramas/${id}`)}
              onBaixar={abrirCronogramaImpresso}
              onApagar={apagar}
              onCriar={() => router.push('/cronogramas/criar')}
              podeCriar={!noLimite}
            />
          )}
        </div>

        <div id="painel-ementa" role="tabpanel" aria-labelledby="aba-ementa" hidden={aba !== 'ementa'}>
          {aba === 'ementa' && (
            <EmentaNavegador
              topicos={contexto.topicos}
              carregando={contexto.carregandoEmenta}
              contexto={rotuloContexto}
              acoes={
                contexto.topicos.length > 0 ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => abrirEmentaImpressa(contexto.topicos, rotuloContexto, false)}
                      className="h-9 rounded-lg text-xs"
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      Visualizar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => abrirEmentaImpressa(contexto.topicos, rotuloContexto, true)}
                      className="h-9 rounded-lg bg-[#468152] text-xs text-white hover:bg-[#468152]/90"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      Baixar PDF
                    </Button>
                  </>
                ) : null
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Contexto: seção e período ───────────────────────────────────────────────

/**
 * Seção e período viviam num cartão de 120px no topo de todas as visitas, para
 * uma escolha que o aluno faz uma vez por semestre. Aqui viram uma pílula que
 * mostra a resposta e só abre o seletor quando alguém quer trocar — a não ser
 * na primeira visita, quando ninguém escolheu nada ainda e a pergunta É a tela.
 */
function BarraDeContexto({
  contexto,
  podeCriar,
  onCriar,
}: {
  contexto: ReturnType<typeof useCronogramaSecao>
  podeCriar: boolean
  onCriar: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const jaAbriuSozinho = useRef(false)

  // Primeira visita: o aluno nunca escolheu seção, então o seletor abre.
  useEffect(() => {
    if (!contexto.pronto || jaAbriuSozinho.current) return
    jaAbriuSozinho.current = true
    if (contexto.secaoAcompanhada === null) setAberto(true)
  }, [contexto.pronto, contexto.secaoAcompanhada])

  const secao = getSecao(contexto.secao)

  return (
    <section className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAberto(valor => !valor)}
          aria-expanded={aberto}
          aria-controls="seletor-de-contexto"
          className="group inline-flex min-w-0 items-center gap-2 rounded-full border border-border/70 bg-card py-2 pl-2.5 pr-3 text-sm transition-colors hover:border-foreground/25 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span
            aria-hidden
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm"
            style={{ backgroundColor: `${secao.cor}22` }}
          >
            {secao.emoji}
          </span>
          <span className="min-w-0 truncate font-semibold text-foreground">{secao.nome}</span>
          <span className="shrink-0 text-muted-foreground">· {contexto.periodo}º período</span>
          <ChevronDown
            aria-hidden
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              aberto ? 'rotate-180' : ''
            }`}
          />
        </button>

        {contexto.secaoAcompanhada && contexto.secaoAcompanhada !== contexto.secao && (
          <span className="rounded-full bg-[#E2A43E]/12 px-2.5 py-1 text-[11px] font-semibold text-[#9A6D12] dark:text-[#E2A43E]">
            só espiando — sua seção é {getSecao(contexto.secaoAcompanhada).nome}
          </span>
        )}

        <Button
          onClick={onCriar}
          disabled={!podeCriar}
          className="ml-auto h-10 rounded-xl bg-[#468152] px-4 font-semibold text-white shadow-sm transition-shadow hover:bg-[#3d7148] hover:shadow-md focus-visible:ring-[#468152]/50"
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          Criar cronograma
        </Button>
      </div>

      <div
        id="seletor-de-contexto"
        hidden={!aberto}
        className="glass-page-card mt-2 rounded-2xl p-3 sm:p-4"
      >
        <SeletorSecao
          secao={contexto.secao}
          periodo={contexto.periodo}
          periodosDisponiveis={contexto.periodosDisponiveis}
          periodosComEmenta={contexto.periodosComEmenta}
          onSecaoChange={contexto.setSecao}
          onPeriodoChange={contexto.setPeriodo}
          secaoPadrao={contexto.secaoAcompanhada}
        />
      </div>
    </section>
  )
}

// ── Barra de foco ───────────────────────────────────────────────────────────

function PainelDeFoco({
  carregando,
  hoje,
  proxima,
  geral,
  temPlanos,
  onVerAvaliacao,
  onAbrirPlano,
  onCriar,
  podeCriar,
}: {
  carregando: boolean
  hoje: string
  proxima?: Avaliacao
  geral: ReturnType<typeof resumirTudo>
  temPlanos: boolean
  onVerAvaliacao: (dia: string) => void
  onAbrirPlano: (id: string) => void
  onCriar: () => void
  podeCriar: boolean
}) {
  if (carregando) {
    return (
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="glass-page-card h-[7.5rem] rounded-2xl">
            <div className="skeleton-pulse h-full w-full rounded-2xl opacity-40" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <TileProximaAvaliacao proxima={proxima} hoje={hoje} onVer={onVerAvaliacao} />

      {temPlanos ? (
        <>
          <TileHoje geral={geral} onAbrirPlano={onAbrirPlano} />
          <TileRitmo geral={geral} onAbrirPlano={onAbrirPlano} />
        </>
      ) : (
        <ConvitePrimeiroPlano onCriar={onCriar} podeCriar={podeCriar} />
      )}
    </div>
  )
}

function MolduraTile({
  rotulo,
  children,
  className = '',
}: {
  rotulo: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`glass-page-card flex min-w-0 flex-col rounded-2xl p-4 ${className}`}>
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {rotulo}
      </h2>
      {children}
    </section>
  )
}

function TileProximaAvaliacao({
  proxima,
  hoje,
  onVer,
}: {
  proxima?: Avaliacao
  hoje: string
  onVer: (dia: string) => void
}) {
  if (!proxima) {
    return (
      <MolduraTile rotulo="Próxima avaliação">
        <p className="text-sm font-semibold text-foreground">Nada marcado</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Quando a coordenação publicar as datas desta seção e período, a próxima aparece aqui.
        </p>
      </MolduraTile>
    )
  }

  const dias = diasEntre(hoje, proxima.data)
  const estilo = ESTILO_FAIXA[faixaProximidade(dias)]
  const tipo = getTipoAvaliacao(proxima.tipo)

  return (
    <MolduraTile rotulo="Próxima avaliação">
      <button
        type="button"
        onClick={() => onVer(proxima.data)}
        className="-m-1 flex min-w-0 flex-1 flex-col rounded-xl p-1 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50"
      >
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-bold leading-tight ${estilo.texto}`}>
            {textoProximidade(dias)}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{proxima.titulo}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs text-muted-foreground">
          <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tipo.classe}`}>
            {tipo.rotulo}
          </span>
          <span>{formatarDiaCurto(proxima.data)}</span>
          {proxima.hora && <span>· {proxima.hora}</span>}
        </div>
      </button>
    </MolduraTile>
  )
}

/** Anel de progresso do dia. SVG na mão: são 40px, não vale uma biblioteca. */
function AnelDoDia({ percentual }: { percentual: number }) {
  const raio = 17
  const volta = 2 * Math.PI * raio
  return (
    <svg viewBox="0 0 40 40" className="h-11 w-11 shrink-0 -rotate-90" aria-hidden>
      <circle cx="20" cy="20" r={raio} fill="none" strokeWidth="5" className="stroke-muted" />
      <circle
        cx="20"
        cy="20"
        r={raio}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        stroke="#468152"
        strokeDasharray={volta}
        strokeDashoffset={volta - (volta * Math.min(100, Math.max(0, percentual))) / 100}
        className="cronograma-anima-tracado"
      />
    </svg>
  )
}

function TileHoje({
  geral,
  onAbrirPlano,
}: {
  geral: ReturnType<typeof resumirTudo>
  onAbrirPlano: (id: string) => void
}) {
  const restam = geral.hojeTotal - geral.hojeFeitas
  const percentual = geral.hojeTotal === 0 ? 0 : Math.round((geral.hojeFeitas / geral.hojeTotal) * 100)

  return (
    <MolduraTile rotulo="Hoje">
      {geral.hojeTotal === 0 ? (
        <>
          <p className="text-sm font-semibold text-foreground">Dia livre no plano</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Nenhuma atividade agendada para hoje nos seus cronogramas.
          </p>
        </>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <AnelDoDia percentual={percentual} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {restam === 0
                ? 'Tudo feito hoje'
                : `${restam === 1 ? 'Falta' : 'Faltam'} ${restam} de ${geral.hojeTotal}`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {geral.hojeHoras}h planejadas · {geral.hojeFeitas} concluída
              {geral.hojeFeitas === 1 ? '' : 's'}
            </p>
            {restam > 0 && geral.planoEmFoco && (
              <button
                type="button"
                onClick={() => onAbrirPlano(geral.planoEmFoco!.id)}
                className="mt-1.5 flex w-full min-w-0 items-baseline gap-1 text-left text-xs font-semibold text-[#468152] underline-offset-4 transition-colors hover:underline dark:text-[#7DCEA0]"
              >
                <span className="shrink-0">Abrir</span>
                <span className="min-w-0 truncate">{geral.planoEmFoco.titulo}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </MolduraTile>
  )
}

function TileRitmo({
  geral,
  onAbrirPlano,
}: {
  geral: ReturnType<typeof resumirTudo>
  onAbrirPlano: (id: string) => void
}) {
  const atrasado = geral.atrasadas > 0

  return (
    <MolduraTile
      rotulo="Ritmo"
      className={atrasado ? 'border-[#CE5929]/30 bg-[#CE5929]/[0.04]' : ''}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            atrasado
              ? 'bg-[#CE5929]/15 text-[#CE5929] dark:text-[#F3A588]'
              : 'bg-[#468152]/12 text-[#468152] dark:text-[#7DCEA0]'
          }`}
        >
          {atrasado ? (
            <AlertTriangle className="h-4 w-4" aria-hidden />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {atrasado
              ? `${geral.atrasadas} atividade${geral.atrasadas === 1 ? '' : 's'} atrasada${
                  geral.atrasadas === 1 ? '' : 's'
                }`
              : 'Você está em dia'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {geral.feitas}/{geral.total} concluídas no total · {geral.ativos} plano
            {geral.ativos === 1 ? '' : 's'} em andamento
          </p>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="cronograma-anima-medida h-full rounded-full bg-gradient-to-r from-[#468152] to-[#E2A43E]"
              style={{ width: `${geral.percentual}%` }}
            />
          </div>

          {atrasado && geral.planoEmFoco && (
            <button
              type="button"
              onClick={() => onAbrirPlano(geral.planoEmFoco!.id)}
              className="mt-2 flex w-full min-w-0 items-baseline gap-1 text-left text-xs font-semibold text-[#CE5929] underline-offset-4 transition-colors hover:underline dark:text-[#F3A588]"
            >
              <span className="shrink-0">Recuperar em</span>
              <span className="min-w-0 truncate">{geral.planoEmFoco.titulo}</span>
            </button>
          )}
        </div>
      </div>
    </MolduraTile>
  )
}

function ConvitePrimeiroPlano({
  onCriar,
  podeCriar,
}: {
  onCriar: () => void
  podeCriar: boolean
}) {
  return (
    <section className="glass-page-card flex min-w-0 flex-col justify-between gap-3 rounded-2xl border-[#468152]/25 bg-[#468152]/[0.04] p-4 sm:flex-row sm:items-center lg:col-span-2">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#468152]/12 text-[#468152] dark:text-[#7DCEA0]">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Você ainda não tem um plano</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            O cronograma ordena os assuntos pela prioridade da ementa e já agenda as revisões nos
            dias certos. Leva menos de um minuto.
          </p>
        </div>
      </div>
      <Button
        onClick={onCriar}
        disabled={!podeCriar}
        className="h-10 shrink-0 rounded-xl bg-[#468152] px-4 font-semibold text-white hover:bg-[#3d7148]"
      >
        <Plus className="mr-1.5 h-4 w-4" aria-hidden />
        Criar o primeiro
      </Button>
    </section>
  )
}

// ── Abas ────────────────────────────────────────────────────────────────────

/**
 * Três destinos. A faixa é um `tablist` de verdade: seta ↔ troca de aba,
 * Home/End vão às pontas e só a aba ativa fica no fluxo do Tab — que é o que
 * o leitor de tela espera de um conjunto de abas, e o que a versão anterior
 * (três botões soltos com `role="tab"`) não entregava.
 */
function Abas({
  ativa,
  onChange,
  contadores,
}: {
  ativa: Aba
  onChange: (aba: Aba) => void
  contadores: Record<Aba, number>
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const indiceAtivo = ABAS.findIndex(item => item.id === ativa)

  function aoTeclar(evento: React.KeyboardEvent) {
    const passo =
      evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : evento.key === 'Home' ? -99 : evento.key === 'End' ? 99 : 0
    if (passo === 0) return
    evento.preventDefault()
    const alvo =
      passo === -99 ? 0 : passo === 99 ? ABAS.length - 1 : (indiceAtivo + passo + ABAS.length) % ABAS.length
    onChange(ABAS[alvo].id)
    refs.current[alvo]?.focus()
  }

  return (
    <nav
      role="tablist"
      aria-label="Seções dos cronogramas"
      onKeyDown={aoTeclar}
      className="relative mb-4 grid grid-cols-3 gap-1 rounded-2xl border border-border/60 bg-muted/40 p-1"
    >
      {/* O indicador desliza; os rótulos ficam parados. */}
      <span
        aria-hidden
        className="cronograma-anima-deslize pointer-events-none absolute inset-y-1 left-1 rounded-xl bg-card shadow-sm ring-1 ring-border/60"
        style={{
          width: `calc((100% - 0.5rem - ${(ABAS.length - 1) * 0.25}rem) / ${ABAS.length})`,
          transform: `translateX(calc(${indiceAtivo} * (100% + 0.25rem)))`,
        }}
      />

      {ABAS.map((item, indice) => {
        const Icone = item.icone
        const selecionada = item.id === ativa
        const contador = contadores[item.id]

        return (
          <button
            key={item.id}
            id={`aba-${item.id}`}
            ref={elemento => {
              refs.current[indice] = elemento
            }}
            role="tab"
            type="button"
            aria-selected={selecionada}
            aria-controls={`painel-${item.id}`}
            tabIndex={selecionada ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={`relative z-10 flex min-w-0 items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-[13px] font-semibold transition-colors duration-200 sm:gap-1.5 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50 ${
              selecionada ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icone className="hidden h-4 w-4 shrink-0 min-[380px]:block" aria-hidden />
            <span className="min-w-0 truncate">
              <span className="hidden sm:inline">{item.rotulo}</span>
              <span className="sm:hidden">{item.curto}</span>
            </span>
            {contador > 0 && (
              <span
                className={`shrink-0 rounded-full px-1.5 text-[10px] font-bold tabular-nums transition-colors ${
                  selecionada
                    ? 'bg-[#468152]/15 text-[#468152] dark:text-[#7DCEA0]'
                    : 'bg-muted-foreground/15 text-muted-foreground'
                }`}
              >
                {contador}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

// ── Lista de planos ─────────────────────────────────────────────────────────

function EsqueletoCalendario() {
  return (
    <div className="glass-page-card overflow-hidden rounded-2xl p-4 sm:p-5">
      <div className="skeleton-pulse mb-4 h-6 w-48 rounded-lg" />
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 35 }, (_, i) => (
          <div key={i} className="skeleton-pulse h-14 rounded-lg opacity-60 sm:h-20" />
        ))}
      </div>
    </div>
  )
}

function EsqueletoPlanos() {
  return (
    <ul className="space-y-3">
      {[0, 1].map(i => (
        <li key={i} className="glass-page-card overflow-hidden rounded-2xl p-4 sm:p-5">
          <div className="skeleton-pulse mb-3 h-5 w-1/2 rounded" />
          <div className="skeleton-pulse mb-4 h-3 w-1/3 rounded opacity-70" />
          <div className="skeleton-pulse h-9 w-40 rounded-lg opacity-70" />
        </li>
      ))}
    </ul>
  )
}

function ListaDePlanos({
  cronogramas,
  hoje,
  carregando,
  apagando,
  onAbrir,
  onBaixar,
  onApagar,
  onCriar,
  podeCriar,
}: {
  cronogramas: PlanoBruto[]
  hoje: string
  carregando: boolean
  apagando: string | null
  onAbrir: (id: string) => void
  onBaixar: (cronograma: any) => void
  onApagar: (id: string) => void
  onCriar: () => void
  podeCriar: boolean
}) {
  const [confirmando, setConfirmando] = useState<string | null>(null)

  if (carregando) return <EsqueletoPlanos />

  if (cronogramas.length === 0) {
    return (
      <div className="glass-page-card rounded-2xl px-6 py-14 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#468152]/10">
          <Sparkles className="h-7 w-7 text-[#468152] dark:text-[#7DCEA0]" aria-hidden />
        </div>
        <h3 className="font-heading text-lg font-bold text-foreground">Nenhum plano ainda</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          Um cronograma monta a ordem dos assuntos pela prioridade da ementa e já agenda as revisões
          — leva menos de um minuto para criar o primeiro.
        </p>
        <Button
          onClick={onCriar}
          disabled={!podeCriar}
          className="mt-6 h-11 rounded-xl bg-[#468152] px-6 font-semibold text-white hover:bg-[#3d7148]"
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          Criar meu primeiro cronograma
        </Button>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {cronogramas.map(cronograma => (
        <CartaoPlano
          key={cronograma._id}
          cronograma={cronograma}
          hoje={hoje}
          apagando={apagando === cronograma._id}
          confirmando={confirmando === cronograma._id}
          onConfirmar={() => setConfirmando(cronograma._id ?? null)}
          onCancelar={() => setConfirmando(null)}
          onAbrir={() => onAbrir(String(cronograma._id))}
          onBaixar={() => onBaixar(cronograma)}
          onApagar={() => {
            setConfirmando(null)
            onApagar(String(cronograma._id))
          }}
        />
      ))}
    </ul>
  )
}

/**
 * Um plano na lista.
 *
 * O cartão antigo mostrava só o percentual, e percentual sozinho não diz se o
 * aluno está bem: 30% na primeira semana é ótimo, 30% na última é desastre.
 * Aqui o estado do plano — atrasado, tem tarefa hoje, em dia, terminado — vira
 * o selo que se lê primeiro, e o percentual desce para nota de rodapé.
 *
 * Apagar deixou de ser `window.confirm()`: o diálogo do navegador rouba o foco,
 * ignora o tema e é o único lugar do app que fala com a voz do Chrome. A
 * confirmação agora acontece dentro do próprio cartão, e cancelar é o botão
 * grande.
 */
function CartaoPlano({
  cronograma,
  hoje,
  apagando,
  confirmando,
  onConfirmar,
  onCancelar,
  onAbrir,
  onBaixar,
  onApagar,
}: {
  cronograma: PlanoBruto
  hoje: string
  apagando: boolean
  confirmando: boolean
  onConfirmar: () => void
  onCancelar: () => void
  onAbrir: () => void
  onBaixar: () => void
  onApagar: () => void
}) {
  const resumo = resumirPlano(cronograma, hoje)
  const restamHoje = resumo.hojeTotal - resumo.hojeFeitas

  const selo = resumo.terminado
    ? { texto: 'Concluído', classe: 'bg-[#468152]/12 text-[#468152] dark:text-[#7DCEA0] border-[#468152]/25' }
    : resumo.atrasadas > 0
      ? {
          texto: `${resumo.atrasadas} atrasada${resumo.atrasadas === 1 ? '' : 's'}`,
          classe: 'bg-[#CE5929]/12 text-[#CE5929] dark:text-[#F3A588] border-[#CE5929]/25',
        }
      : restamHoje > 0
        ? {
            texto: `${restamHoje} para hoje`,
            classe: 'bg-[#E2A43E]/14 text-[#9A6D12] dark:text-[#E2A43E] border-[#E2A43E]/30',
          }
        : resumo.naoComecou
          ? { texto: 'Começa em breve', classe: 'bg-muted text-muted-foreground border-border' }
          : { texto: 'Em dia', classe: 'bg-[#468152]/12 text-[#468152] dark:text-[#7DCEA0] border-[#468152]/25' }

  return (
    <li className="glass-page-card overflow-hidden rounded-2xl transition-shadow hover:shadow-md">
      <div className="h-1 bg-muted/50">
        <div
          className="cronograma-anima-medida h-full rounded-r-full bg-gradient-to-r from-[#468152] to-[#E2A43E]"
          style={{ width: `${resumo.percentual}%` }}
        />
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 break-words font-heading text-base font-bold text-foreground">
                {cronograma.titulo}
              </h3>
              <span
                className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${selo.classe}`}
              >
                {selo.texto}
              </span>
            </div>

            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>
                {resumo.inicio && resumo.fim
                  ? `${formatarDiaCurto(resumo.inicio)} → ${formatarDiaCurto(resumo.fim)}`
                  : 'Sem período definido'}
              </span>
              <span aria-hidden>·</span>
              <span>{cronograma.totalHoras || 0}h</span>
              {resumo.revisoes > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1 text-[#2E8FA8] dark:text-[#7FCBDE]">
                    <RefreshCw className="h-3 w-3" aria-hidden />
                    {resumo.revisoes} revisões
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="font-heading text-2xl font-bold tabular-nums leading-none text-foreground">
              {resumo.percentual}%
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {resumo.feitas}/{resumo.total} atividades
            </p>
          </div>
        </div>

        {confirmando ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#CE5929]/30 bg-[#CE5929]/[0.06] p-2.5">
            <p className="mr-auto min-w-0 text-xs font-medium text-foreground">
              Apagar <strong className="break-words">{cronograma.titulo}</strong>? Não dá para
              desfazer.
            </p>
            <Button size="sm" variant="outline" onClick={onCancelar} className="h-9 rounded-lg">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={onApagar}
              disabled={apagando}
              className="h-9 rounded-lg bg-[#CE5929] text-white hover:bg-[#b34c23]"
            >
              {apagando ? 'Apagando…' : 'Apagar'}
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={onAbrir}
              className="h-9 rounded-lg bg-[#468152] text-white hover:bg-[#3d7148]"
            >
              Abrir plano
            </Button>
            <Button size="sm" variant="outline" onClick={onBaixar} className="h-9 rounded-lg">
              <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              PDF
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onConfirmar}
              className="ml-auto h-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Apagar ${cronograma.titulo}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              <span className="ml-1.5 hidden sm:inline">Apagar</span>
            </Button>
          </div>
        )}
      </div>
    </li>
  )
}

export default function PaginaCronogramas() {
  return (
    <AppShell headerTitle="Cronogramas" headerSubtitle="Organize seus estudos">
      <ConteudoCronogramas />
    </AppShell>
  )
}
