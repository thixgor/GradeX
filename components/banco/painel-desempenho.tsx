'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  CalendarRange,
  ChevronDown,
  Flame,
  Gauge,
  Layers,
  Target,
} from 'lucide-react'
import {
  AccuracyBars,
  AccuracyMeter,
  ChartCard,
  ConsistencyHeatmap,
  Legend,
  ScaleLegend,
  StackedDayColumns,
  WeekdayColumns,
  fullDate,
} from '@/components/charts/chart-kit'
import { cn } from '@/lib/utils'

/**
 * O painel de desempenho do Banco de Questões — colapsável e multimodal.
 *
 * ## Por que colapsável
 *
 * A página do banco existe para uma coisa: achar questão e responder. Um painel
 * de cinco gráficos aberto por padrão empurraria a primeira questão para baixo
 * da dobra em qualquer celular — a tela passaria a ser sobre o passado em vez do
 * próximo exercício. Fechado, ele custa uma faixa de 64px e mostra o essencial
 * (acerto, sequência, resolvidas) ali mesmo, na própria aba fechada. Quem quer
 * o detalhe abre; a preferência fica salva no navegador, então quem gosta de
 * acompanhar não precisa reabrir todo dia.
 *
 * E ele só busca dados DEPOIS do primeiro toque, uma vez. Carregar sete
 * agregações para um painel que a maioria mantém fechado seria pagar por
 * ninguém.
 *
 * ## Por que multimodal
 *
 * "Como estou indo" não tem uma resposta, tem cinco, e são recortes diferentes
 * do mesmo histórico. Empilhar todos de uma vez vira um paredão que ninguém lê;
 * as abas deixam a pessoa perguntar uma coisa de cada vez:
 *
 * - **Ritmo** — quanto respondi por dia, acertos e erros na mesma coluna;
 * - **Assuntos** — onde eu erro (o recorte que muda o que estudar amanhã);
 * - **Nível** — dificuldade e tipo lado a lado;
 * - **Períodos** — desempenho por prova/semestre (2026.2, 2023.1…);
 * - **Constância** — o mapa de dias, que responde "estou aparecendo?".
 *
 * Cada figura carrega a tabela equivalente (o "Ver tabela" do `ChartCard`), de
 * modo que nenhum valor exista só na cor ou só no hover.
 */

const CHAVE_ABERTO = 'gradex:banco:desempenho-aberto'

type Aba = 'ritmo' | 'assuntos' | 'nivel' | 'periodos' | 'constancia'

interface Categoria {
  nome: string
  total: number
  acertos: number
  accuracy: number
}

export interface DesempenhoDoBanco {
  resumo: {
    total: number
    acertos: number
    erros: number
    accuracy: number
    streakAtual: number
    streakRecorde: number
    estudouHoje: boolean
    diasAtivos: number
    diasDaJanela: number
  }
  diario: Array<{ date: string; acertos: number; erros: number }>
  mapa: Array<{ date: string; total: number }>
  porDiaDaSemana: Array<{ weekday: number; total: number }>
  porModulo: Categoria[]
  porTopico: Categoria[]
  porDificuldade: Array<Categoria & { nivel: string }>
  porTipo: Categoria[]
  porPeriodo: Categoria[]
}

const ABAS: Array<{ id: Aba; rotulo: string; icone: React.ReactNode }> = [
  { id: 'ritmo', rotulo: 'Ritmo', icone: <Activity className="h-3.5 w-3.5" /> },
  { id: 'assuntos', rotulo: 'Assuntos', icone: <Layers className="h-3.5 w-3.5" /> },
  { id: 'nivel', rotulo: 'Nível', icone: <Gauge className="h-3.5 w-3.5" /> },
  { id: 'periodos', rotulo: 'Períodos', icone: <CalendarRange className="h-3.5 w-3.5" /> },
  { id: 'constancia', rotulo: 'Constância', icone: <Flame className="h-3.5 w-3.5" /> },
]

export function PainelDeDesempenho() {
  const [aberto, setAberto] = useState(false)
  const [aba, setAba] = useState<Aba>('ritmo')
  const [dados, setDados] = useState<DesempenhoDoBanco | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [falhou, setFalhou] = useState(false)
  const jaBuscou = useRef(false)

  // A preferência é lida no efeito, não no `useState` inicial: ler
  // `localStorage` durante a renderização faria o servidor e o cliente
  // desenharem coisas diferentes e o React reclamaria de hidratação.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(CHAVE_ABERTO) === '1') setAberto(true)
    } catch {
      /* navegador com armazenamento bloqueado — segue fechado */
    }
  }, [])

  useEffect(() => {
    if (!aberto || jaBuscou.current) return
    jaBuscou.current = true
    let vivo = true
    setCarregando(true)
    ;(async () => {
      try {
        const res = await fetch('/api/banco/desempenho', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const json = await res.json()
        if (vivo) setDados(json)
      } catch {
        if (vivo) setFalhou(true)
        // Deixa tentar de novo no próximo abrir em vez de travar para sempre.
        jaBuscou.current = false
      } finally {
        if (vivo) setCarregando(false)
      }
    })()
    return () => {
      vivo = false
    }
  }, [aberto])

  function alternar() {
    const proximo = !aberto
    setAberto(proximo)
    try {
      window.localStorage.setItem(CHAVE_ABERTO, proximo ? '1' : '0')
    } catch {
      /* sem persistência, o painel só não lembra */
    }
  }

  const resumo = dados?.resumo
  const vazio = !!dados && dados.resumo.total === 0

  return (
    <section className="vidro vidro-brilho relevo relevo-toca overflow-hidden rounded-[22px]">
      {/* ── Aba fechada: já é o resumo ───────────────────────────────────── */}
      <button
        type="button"
        onClick={alternar}
        aria-expanded={aberto}
        aria-controls="painel-desempenho-conteudo"
        className="flex w-full items-center gap-3 p-3.5 text-left sm:p-4"
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-11 sm:w-11">
          <BarChart3 className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">Meu desempenho</span>
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground sm:text-xs">
            {resumo && resumo.total > 0
              ? `${resumo.accuracy}% de acerto · ${resumo.total} resolvidas · ${resumo.streakAtual} ${
                  resumo.streakAtual === 1 ? 'dia seguido' : 'dias seguidos'
                }`
              : aberto
                ? 'Ritmo, assuntos, nível, períodos e constância'
                : 'Toque para ver ritmo, acertos por assunto e constância'}
          </span>
        </span>

        <ChevronDown
          className={cn(
            'h-4 w-4 flex-none text-muted-foreground transition-transform duration-300',
            aberto && 'rotate-180',
          )}
        />
      </button>

      {/* ── Aberto ───────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {aberto ? (
          <motion.div
            id="painel-desempenho-conteudo"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/70 p-3 sm:p-4">
              {carregando ? (
                <div className="space-y-3">
                  <div className="h-16 rounded-2xl skeleton-pulse" />
                  <div className="h-52 rounded-2xl skeleton-pulse" />
                </div>
              ) : falhou ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Não deu para carregar seu desempenho agora. Feche e abra de novo.
                </p>
              ) : vazio ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Responda algumas questões e este painel passa a mostrar onde você acerta, onde
                  erra e com que constância você aparece.
                </p>
              ) : dados ? (
                <Conteudo dados={dados} aba={aba} onAba={setAba} />
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}

function Conteudo({
  dados,
  aba,
  onAba,
}: {
  dados: DesempenhoDoBanco
  aba: Aba
  onAba: (aba: Aba) => void
}) {
  const { resumo } = dados

  // Só oferece a aba que tem dados: uma aba vazia é um clique que não responde
  // nada, e quatro delas fariam o painel parecer quebrado.
  const abasVisiveis = useMemo(
    () =>
      ABAS.filter((a) => {
        if (a.id === 'assuntos') return dados.porModulo.length > 0 || dados.porTopico.length > 0
        if (a.id === 'periodos') return dados.porPeriodo.length > 0
        if (a.id === 'nivel') return dados.porDificuldade.length > 0 || dados.porTipo.length > 0
        return true
      }),
    [dados],
  )

  const abaAtual = abasVisiveis.some((a) => a.id === aba) ? aba : abasVisiveis[0]?.id || 'ritmo'

  return (
    <div className="space-y-3">
      {/* ── Indicadores ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <Indicador
          icone={<Target className="h-3.5 w-3.5" />}
          rotulo="Resolvidas"
          valor={resumo.total.toLocaleString('pt-BR')}
          nota={`${resumo.acertos} certas`}
        />
        <Indicador
          icone={<BarChart3 className="h-3.5 w-3.5" />}
          rotulo="Acerto"
          valor={`${resumo.accuracy}%`}
          nota={`${resumo.erros} para revisar`}
        />
        <Indicador
          icone={<Flame className="h-3.5 w-3.5" />}
          rotulo="Sequência"
          valor={String(resumo.streakAtual)}
          nota={resumo.estudouHoje ? 'hoje já conta' : `recorde de ${resumo.streakRecorde}`}
        />
        <Indicador
          icone={<CalendarRange className="h-3.5 w-3.5" />}
          rotulo="Dias ativos"
          valor={String(resumo.diasAtivos)}
          nota={`de ${resumo.diasDaJanela}`}
        />
      </div>

      {/* ── Abas ───────────────────────────────────────────────────────── */}
      {/* Rolagem horizontal no celular: empilhar cinco abas comeria a tela
          inteira antes do primeiro gráfico. */}
      <div
        role="tablist"
        aria-label="Recortes do desempenho"
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
      >
        {abasVisiveis.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={abaAtual === a.id}
            data-marcado={abaAtual === a.id}
            onClick={() => onAba(a.id)}
            className="tecla inline-flex h-9 flex-none items-center gap-1.5 px-3 text-xs font-semibold"
          >
            {a.icone}
            {a.rotulo}
          </button>
        ))}
      </div>

      {/* ── Figuras ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={abaAtual}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="grid gap-3 lg:grid-cols-2"
        >
          {abaAtual === 'ritmo' ? <AbaRitmo dados={dados} /> : null}
          {abaAtual === 'assuntos' ? <AbaAssuntos dados={dados} /> : null}
          {abaAtual === 'nivel' ? <AbaNivel dados={dados} /> : null}
          {abaAtual === 'periodos' ? <AbaPeriodos dados={dados} /> : null}
          {abaAtual === 'constancia' ? <AbaConstancia dados={dados} /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Abas
// ─────────────────────────────────────────────────────────────────────────────

function AbaRitmo({ dados }: { dados: DesempenhoDoBanco }) {
  const temMovimento = dados.diario.some((d) => d.acertos + d.erros > 0)

  return (
    <>
      <ChartCard
        title="Questões por dia"
        caption="Últimos 30 dias. A coluna é o total do dia; a cor separa acerto de erro."
        className="grafico-do-banco lg:col-span-2"
        legend={
          <Legend
            items={[
              { label: 'acertos', color: 'var(--viz-series-1)' },
              { label: 'erros', color: 'var(--viz-bad)' },
            ]}
          />
        }
        table={{
          head: ['Dia', 'Acertos', 'Erros'],
          rows: dados.diario
            .filter((d) => d.acertos + d.erros > 0)
            .map((d) => [fullDate(d.date), d.acertos, d.erros]),
        }}
        empty={temMovimento ? undefined : 'Sem resoluções nos últimos 30 dias.'}
      >
        <StackedDayColumns
          data={dados.diario.map((d) => ({ date: d.date, base: d.acertos, topo: d.erros }))}
          base={{ label: 'acertos', color: 'var(--viz-series-1)' }}
          topo={{ label: 'erros', color: 'var(--viz-bad)' }}
          ariaLabel="Questões do banco respondidas por dia nos últimos 30 dias"
        />
      </ChartCard>

      <ChartCard
        title="Aproveitamento geral"
        caption="Todas as questões que você já respondeu no banco."
        className="grafico-do-banco"
      >
        <div className="flex justify-center py-2">
          <AccuracyMeter
            percent={dados.resumo.accuracy}
            label="de acerto"
            sublabel={`${dados.resumo.acertos} de ${dados.resumo.total} questões`}
          />
        </div>
      </ChartCard>

      <ChartCard
        title="Dia da semana"
        caption="Quando você costuma estudar. O dia mais forte fica em cor cheia."
        className="grafico-do-banco"
        table={{
          head: ['Dia', 'Questões'],
          rows: dados.porDiaDaSemana.map((d) => [
            ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][d.weekday],
            d.total,
          ]),
        }}
      >
        <WeekdayColumns data={dados.porDiaDaSemana} />
      </ChartCard>
    </>
  )
}

function AbaAssuntos({ dados }: { dados: DesempenhoDoBanco }) {
  return (
    <>
      <BarrasDeAcerto
        titulo="Acerto por módulo"
        legenda="Os módulos em que você mais respondeu. Barra curta é assunto para revisar."
        dados={dados.porModulo}
      />
      <BarrasDeAcerto
        titulo="Acerto por tópico"
        legenda="O recorte fino: dentro do módulo, onde exatamente o erro se concentra."
        dados={dados.porTopico}
      />
    </>
  )
}

function AbaNivel({ dados }: { dados: DesempenhoDoBanco }) {
  // Dificuldade é ordinal (fácil → difícil): a rampa de uma cor só carrega a
  // ordem, coisa que cores avulsas não fariam.
  const RAMPA: Record<string, string> = {
    facil: 'var(--viz-ord-1)',
    medio: 'var(--viz-ord-2)',
    dificil: 'var(--viz-ord-3)',
  }

  return (
    <>
      <BarrasDeAcerto
        titulo="Acerto por dificuldade"
        legenda="Do fácil ao difícil. Uma queda brusca no difícil é normal; no fácil, não."
        dados={dados.porDificuldade.map((d) => ({ ...d, cor: RAMPA[d.nivel] }))}
      />
      <BarrasDeAcerto
        titulo="Objetiva x discursiva"
        legenda="A discursiva é corrigida por comparação com a resposta modelo."
        dados={dados.porTipo}
      />
    </>
  )
}

function AbaPeriodos({ dados }: { dados: DesempenhoDoBanco }) {
  return (
    <BarrasDeAcerto
      titulo="Acerto por período letivo"
      legenda="Cada barra é um semestre de prova — 2026.2, 2026.1, 2023.2… Serve para ver se a prova daquele período já foi dominada."
      dados={dados.porPeriodo}
      className="lg:col-span-2"
    />
  )
}

function AbaConstancia({ dados }: { dados: DesempenhoDoBanco }) {
  return (
    <ChartCard
      title="Mapa de constância"
      caption="Cada quadradinho é um dia. Quanto mais escuro, mais questões."
      className="grafico-do-banco lg:col-span-2"
      legend={
        <ScaleLegend
          from="nenhuma"
          to="muitas"
          steps={[
            'var(--viz-seq-0)',
            'var(--viz-seq-1)',
            'var(--viz-seq-2)',
            'var(--viz-seq-3)',
            'var(--viz-seq-4)',
            'var(--viz-seq-5)',
          ]}
        />
      }
      table={{
        head: ['Dia', 'Questões'],
        rows: dados.mapa.filter((d) => d.total > 0).map((d) => [fullDate(d.date), d.total]),
      }}
    >
      <div className="-mx-1 overflow-x-auto px-1">
        <ConsistencyHeatmap data={dados.mapa} />
      </div>
    </ChartCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Peças
// ─────────────────────────────────────────────────────────────────────────────

function BarrasDeAcerto({
  titulo,
  legenda,
  dados,
  className,
}: {
  titulo: string
  legenda: string
  dados: Array<{ nome: string; total: number; acertos: number; accuracy: number; cor?: string }>
  className?: string
}) {
  return (
    <ChartCard
      title={titulo}
      caption={legenda}
      className={cn('grafico-do-banco', className)}
      table={{
        head: ['Item', 'Acerto', 'Respondidas'],
        rows: dados.map((d) => [d.nome, `${d.accuracy}%`, d.total]),
      }}
      empty={dados.length === 0 ? 'Ainda não há resoluções neste recorte.' : undefined}
    >
      <AccuracyBars
        data={dados.map((d) => ({
          label: d.nome,
          value: d.accuracy,
          total: d.total,
          acertos: d.acertos,
          color: d.cor,
        }))}
      />
    </ChartCard>
  )
}

function Indicador({
  icone,
  rotulo,
  valor,
  nota,
}: {
  icone: React.ReactNode
  rotulo: string
  valor: string
  nota?: string
}) {
  return (
    <div className="relevo rounded-2xl border border-border/60 bg-card/70 p-3">
      <p className="flex items-center gap-1.5 text-[10.5px] font-medium text-muted-foreground">
        {icone} {rotulo}
      </p>
      <p className="numero-relevo mt-1 font-heading text-xl font-bold tabular-nums sm:text-2xl">
        {valor}
      </p>
      {nota ? <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{nota}</p> : null}
    </div>
  )
}
