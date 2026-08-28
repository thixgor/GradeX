'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  CalendarDays,
  Download,
  Eye,
  ListChecks,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { AppShell, useAppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { LimitWarning } from '@/components/limit-warning'
import { Calendario, type CargaDoDia } from '@/components/cronogramas/calendario'
import { EmentaNavegador } from '@/components/cronogramas/ementa-navegador'
import { SeletorSecao } from '@/components/cronogramas/seletor-secao'
import { useCronogramaSecao } from '@/hooks/use-cronograma-secao'
import { getCronogramasLimit } from '@/lib/tier-limits'
import { abrirCronogramaImpresso, abrirEmentaImpressa } from '@/lib/cronogramas/pdf'
import { formatarDiaCurto, hojeBrasilia } from '@/lib/cronogramas/brasilia'
import { getSecao } from '@/lib/cronogramas/tipos'
import type { AccountType } from '@/lib/types'

type Aba = 'calendario' | 'cronogramas' | 'ementa'

const ABAS: Array<{ id: Aba; rotulo: string; icone: typeof CalendarDays }> = [
  { id: 'calendario', rotulo: 'Calendário', icone: CalendarDays },
  { id: 'cronogramas', rotulo: 'Meus planos', icone: ListChecks },
  { id: 'ementa', rotulo: 'Ementa', icone: BookOpen },
]

/**
 * Área de cronogramas do aluno.
 *
 * A versão anterior era uma coluna só, com o herói, o botão de criar, a ementa
 * inteira sanfonada e a lista de planos — tudo empilhado, e no celular a lista
 * de planos ficava a três telas de rolagem do topo.
 *
 * Aqui a página tem uma decisão no topo (qual seção e período) e três destinos
 * que respondem a três perguntas diferentes: *quando é minha prova*, *o que eu
 * tenho para estudar* e *o que cai no período*. Cada um é um clique, nenhum
 * exige rolar para ser encontrado.
 */
function ConteudoCronogramas() {
  const router = useRouter()
  const { isAdmin, accountType: tipoDeConta } = useAppShell()

  const contexto = useCronogramaSecao()
  const [aba, setAba] = useState<Aba>('calendario')

  const [cronogramas, setCronogramas] = useState<any[]>([])
  const [carregandoPlanos, setCarregandoPlanos] = useState(true)
  const [apagando, setApagando] = useState<string | null>(null)

  const accountType = tipoDeConta as AccountType
  const limite = getCronogramasLimit(accountType)
  const noLimite = !isAdmin && accountType === 'gratuito' && cronogramas.length >= limite

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

  /**
   * Carga de estudo por dia, somada de todos os planos ativos. É o que faz o
   * calendário mostrar avaliação e estudo na mesma grade — que é como o aluno
   * de fato enxerga a semana dele.
   */
  const cargaPorDia = useMemo(() => {
    const mapa: Record<string, CargaDoDia> = {}
    for (const plano of cronogramas) {
      for (const dia of plano.cronograma ?? []) {
        const atual = mapa[dia.data] ?? { horas: 0, itens: 0, concluidos: 0 }
        for (const atividade of dia.atividades ?? []) {
          atual.horas += Number(atividade.horas) || 0
          atual.itens += 1
          if (atividade.concluido) atual.concluidos += 1
        }
        mapa[dia.data] = atual
      }
    }
    for (const dia of Object.values(mapa)) dia.horas = Math.round(dia.horas * 2) / 2
    return mapa
  }, [cronogramas])

  const secao = getSecao(contexto.secao)
  const rotuloContexto = `${secao.nome} · ${contexto.periodo}º período`

  async function apagar(id: string, titulo: string) {
    if (!confirm(`Apagar "${titulo}"? Isso não pode ser desfeito.`)) return
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
      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
        {/* ── Cabeçalho: contexto + a única ação primária ── */}
        <header className="mb-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                Cronogramas
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Suas avaliações, seus planos de estudo e a ementa do período — num lugar só.
              </p>
            </div>

            <Button
              onClick={() => router.push('/cronogramas/criar')}
              disabled={noLimite}
              className="h-11 rounded-xl bg-gradient-to-r from-[#468152] to-[#5a9a63] px-5 font-semibold text-white shadow-lg shadow-[#468152]/20 hover:from-[#468152]/90 hover:to-[#5a9a63]/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar cronograma
            </Button>
          </div>

          <div className="glass-page-card rounded-2xl p-4">
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
        </header>

        {noLimite && (
          <div className="mb-5">
            <LimitWarning current={cronogramas.length} max={limite} itemName="Cronogramas" />
          </div>
        )}

        {/* ── Três destinos, um clique cada ── */}
        <nav className="mb-5 flex gap-1 rounded-xl bg-muted/50 p-1" role="tablist">
          {ABAS.map(item => {
            const Icone = item.icone
            const ativa = aba === item.id
            const contador =
              item.id === 'cronogramas'
                ? cronogramas.length
                : item.id === 'calendario'
                  ? contexto.avaliacoes.filter(a => a.data >= contexto.hoje).length
                  : null

            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={ativa}
                onClick={() => setAba(item.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  ativa ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icone className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{item.rotulo}</span>
                <span className="sm:hidden">{item.rotulo.split(' ')[0]}</span>
                {contador != null && contador > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-bold ${
                      ativa ? 'bg-[#468152]/15 text-[#468152] dark:text-[#7DCEA0]' : 'bg-muted-foreground/15'
                    }`}
                  >
                    {contador}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {aba === 'calendario' && (
          contexto.carregandoAvaliacoes && contexto.avaliacoes.length === 0 ? (
            <PainelCarregando mensagem="Carregando o calendário…" />
          ) : (
            <Calendario
              avaliacoes={contexto.avaliacoes}
              cargaPorDia={cargaPorDia}
              hoje={contexto.hoje || hojeBrasilia()}
              lembretes={{
                ativos: contexto.lembretesAtivos,
                onChange: contexto.setLembretes,
                salvando: contexto.salvandoLembretes,
              }}
              onNovaAvaliacao={isAdmin ? dia => router.push(`/admin/cronogramas?novo=${dia}`) : undefined}
            />
          )
        )}

        {aba === 'cronogramas' && (
          <ListaDePlanos
            cronogramas={cronogramas}
            carregando={carregandoPlanos}
            apagando={apagando}
            onAbrir={id => router.push(`/cronogramas/${id}`)}
            onBaixar={abrirCronogramaImpresso}
            onApagar={apagar}
            onCriar={() => router.push('/cronogramas/criar')}
            podeCriar={!noLimite}
          />
        )}

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
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Visualizar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => abrirEmentaImpressa(contexto.topicos, rotuloContexto, true)}
                    className="h-9 rounded-lg bg-[#468152] text-xs text-white hover:bg-[#468152]/90"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Baixar PDF
                  </Button>
                </>
              ) : null
            }
          />
        )}
      </div>
    </div>
  )
}

function PainelCarregando({ mensagem }: { mensagem: string }) {
  return (
    <div className="glass-page-card flex items-center justify-center gap-2 rounded-2xl py-16 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {mensagem}
    </div>
  )
}

function progresso(cronograma: any): { percentual: number; total: number; feitas: number } {
  let total = 0
  let feitas = 0
  for (const dia of cronograma?.cronograma ?? []) {
    for (const atividade of dia.atividades ?? []) {
      total += 1
      if (atividade.concluido) feitas += 1
    }
  }
  return { percentual: total === 0 ? 0 : Math.round((feitas / total) * 100), total, feitas }
}

function ListaDePlanos({
  cronogramas,
  carregando,
  apagando,
  onAbrir,
  onBaixar,
  onApagar,
  onCriar,
  podeCriar,
}: {
  cronogramas: any[]
  carregando: boolean
  apagando: string | null
  onAbrir: (id: string) => void
  onBaixar: (cronograma: any) => void
  onApagar: (id: string, titulo: string) => void
  onCriar: () => void
  podeCriar: boolean
}) {
  if (carregando) return <PainelCarregando mensagem="Carregando seus planos…" />

  if (cronogramas.length === 0) {
    return (
      <div className="glass-page-card rounded-2xl px-6 py-14 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#468152]/10">
          <Sparkles className="h-7 w-7 text-[#468152]" aria-hidden />
        </div>
        <h3 className="text-lg font-bold text-foreground">Nenhum plano ainda</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
          Um cronograma monta a ordem dos assuntos pela prioridade da ementa e já agenda as revisões —
          leva menos de um minuto para criar o primeiro.
        </p>
        <Button
          onClick={onCriar}
          disabled={!podeCriar}
          className="mt-6 h-11 rounded-xl bg-gradient-to-r from-[#468152] to-[#5a9a63] px-6 font-semibold text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Criar meu primeiro cronograma
        </Button>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {cronogramas.map(cronograma => {
        const { percentual, total, feitas } = progresso(cronograma)
        const dias: any[] = cronograma.cronograma ?? []
        const inicio = dias[0]?.data
        const fim = dias[dias.length - 1]?.data
        const revisoes = dias.reduce(
          (soma, dia) => soma + (dia.atividades ?? []).filter((a: any) => a.tipo === 'revisao').length,
          0,
        )

        return (
          <li key={cronograma._id} className="glass-page-card overflow-hidden rounded-2xl">
            <div className="h-1 bg-muted/40">
              <div
                className="h-full rounded-r-full bg-gradient-to-r from-[#468152] to-[#E2A43E] transition-all duration-700"
                style={{ width: `${percentual}%` }}
              />
            </div>

            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-foreground">{cronograma.titulo}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {inicio && fim ? `${formatarDiaCurto(inicio)} → ${formatarDiaCurto(fim)}` : 'Sem período definido'}
                    {' · '}
                    {cronograma.totalHoras || 0}h
                    {revisoes > 0 && (
                      <>
                        {' · '}
                        <span className="inline-flex items-center gap-1 text-[#2E8FA8]">
                          <RefreshCw className="h-3 w-3" aria-hidden />
                          {revisoes} revisões
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold tabular-nums text-foreground">{percentual}%</p>
                  <p className="text-[11px] text-muted-foreground">
                    {feitas}/{total} atividades
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => onAbrir(cronograma._id)} className="h-9 rounded-lg">
                  Abrir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onBaixar(cronograma)}
                  className="h-9 rounded-lg"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={apagando === cronograma._id}
                  onClick={() => onApagar(cronograma._id, cronograma.titulo)}
                  className="ml-auto h-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {apagando === cronograma._id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span className="ml-1.5 hidden sm:inline">Apagar</span>
                </Button>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default function PaginaCronogramas() {
  return (
    <AppShell headerTitle="Cronogramas" headerSubtitle="Organize seus estudos">
      <ConteudoCronogramas />
    </AppShell>
  )
}
