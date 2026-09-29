'use client'

import { useRef, useState } from 'react'
import { Check, ChevronDown, Crosshair, HelpCircle, Minus } from 'lucide-react'

import { LaminaInterativa } from '@/components/histologia-zoom/lamina-interativa'
import { SinalDePatologia } from '@/components/histologia-zoom/sinal-de-patologia'
import type { LaminaDoVisualizador, Vizinha } from '@/components/histologia-zoom/visualizador'
import type {
  AchadoPatologico,
  MarcacaoExibida,
  SituacaoDoAchado,
  TipoDeAchadoDaDoenca,
} from '@/lib/histopatologia-zoom/tipos'

export interface LinhaDeAchado {
  achado: AchadoPatologico
  /** `extra`: achado presente na lâmina que não faz parte da ficha da doença. */
  tipo: TipoDeAchadoDaDoenca | 'extra'
  peso: 'criterio' | 'frequente' | 'ocasional' | null
  comoAparece: string | null
  status: SituacaoDoAchado
  nota: string | null
  marcacoes: Array<{ id: string; rotulo: string }>
}

const SITUACAO: Record<SituacaoDoAchado, { rotulo: string; classe: string; icone: React.ReactNode }> = {
  presente: {
    rotulo: 'Presente nesta lâmina',
    classe: 'bg-rose-500/15 text-rose-800 dark:text-rose-200',
    icone: <Check className="h-3.5 w-3.5" aria-hidden />,
  },
  ausente: {
    rotulo: 'Ausente nesta lâmina',
    classe: 'bg-muted text-muted-foreground',
    icone: <Minus className="h-3.5 w-3.5" aria-hidden />,
  },
  'nao-avaliavel': {
    rotulo: 'Não avaliável nesta lâmina',
    classe: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
    icone: <HelpCircle className="h-3.5 w-3.5" aria-hidden />,
  },
}

const PESO: Record<'criterio' | 'frequente' | 'ocasional', string> = {
  criterio: 'Critério diagnóstico',
  frequente: 'Frequente',
  ocasional: 'Ocasional',
}

/**
 * Lâmina de histopatologia: visualizador + marcações ao lado + a lista de
 * achados da doença com o veredito desta lâmina. A seleção é compartilhada —
 * "Ver na lâmina" num achado enquadra e desenha a mesma marcação do catálogo.
 */
export function LaminaPatologicaInterativa({
  lamina,
  caracteristicas,
  urlDaLamina,
  anterior,
  proxima,
  estruturas,
  achados,
  nomeDaDoenca,
}: {
  lamina: LaminaDoVisualizador
  caracteristicas: React.ReactNode
  urlDaLamina: string
  anterior: Vizinha | null
  proxima: Vizinha | null
  estruturas: MarcacaoExibida[]
  achados: LinhaDeAchado[]
  nomeDaDoenca: string
}) {
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const visualizadorRef = useRef<HTMLDivElement | null>(null)

  const selecionar = (id: string | null, rolar = false) => {
    setSelecionada(id)
    if (id && visualizadorRef.current && (rolar || window.matchMedia('(max-width: 1023px)').matches)) {
      visualizadorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const daFicha = achados.filter((a) => a.tipo !== 'extra')
  const presentes = daFicha.filter((a) => a.status === 'presente').length
  const grupos: Array<{ titulo: string; descricao: string; itens: LinhaDeAchado[] }> = [
    {
      titulo: 'Achados específicos',
      descricao: `Caracterizam ${nomeDaDoenca.toLowerCase()} — são eles que sustentam o diagnóstico.`,
      itens: achados.filter((a) => a.tipo === 'especifico'),
    },
    {
      titulo: 'Achados gerais',
      descricao: 'Processos patológicos comuns a várias doenças, que aqui compõem o quadro.',
      itens: achados.filter((a) => a.tipo === 'geral'),
    },
    {
      titulo: 'Outros achados nesta lâmina',
      descricao: 'Presentes neste caso, fora do quadro típico da doença.',
      itens: achados.filter((a) => a.tipo === 'extra'),
    },
  ]

  return (
    <>
      <LaminaInterativa
        lamina={lamina}
        caracteristicas={caracteristicas}
        urlDaLamina={urlDaLamina}
        anterior={anterior}
        proxima={proxima}
        estruturas={estruturas}
        selecionada={selecionada}
        onSelecionar={(id) => selecionar(id)}
        visualizadorRef={visualizadorRef}
      />

      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <SinalDePatologia className="h-4 w-4" /> Achado histopatológico (seta rosa, contorno tracejado)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-sm bg-yellow-400 ring-1 ring-black/60" aria-hidden /> Estrutura
          histológica normal (seta amarela, contorno ciano)
        </span>
      </p>

      <section aria-labelledby="achados-da-lamina" className="mt-8">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="achados-da-lamina" className="flex items-center gap-2 font-heading text-xl font-semibold tracking-tight">
              <SinalDePatologia className="h-5 w-5" /> Achados histopatológicos
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Os achados de {nomeDaDoenca.toLowerCase()} e o que <strong className="text-foreground">esta lâmina</strong>{' '}
              mostra de cada um.
            </p>
          </div>
          <p className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-800 dark:text-rose-200">
            {presentes} de {daFicha.length} presentes nesta lâmina
          </p>
        </header>

        <div className="space-y-6">
          {grupos.map((g) =>
            g.itens.length === 0 ? null : (
              <div key={g.titulo}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{g.titulo}</h3>
                <p className="mb-2 mt-0.5 text-xs text-muted-foreground">{g.descricao}</p>
                <ul className="space-y-2">
                  {g.itens.map((a) => (
                    <ItemDeAchado
                      key={a.achado.id}
                      linha={a}
                      selecionada={selecionada}
                      onVer={(id) => selecionar(id, true)}
                    />
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      </section>
    </>
  )
}

function ItemDeAchado({
  linha,
  selecionada,
  onVer,
}: {
  linha: LinhaDeAchado
  selecionada: string | null
  onVer: (id: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const s = SITUACAO[linha.status]
  const ativo = linha.marcacoes.some((m) => m.id === selecionada)
  return (
    <li
      className={`rounded-xl border p-3 transition-colors ${
        ativo ? 'border-rose-500/60 bg-rose-500/[0.05]' : 'border-border bg-card'
      } ${linha.status === 'ausente' ? 'opacity-80' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold leading-snug">{linha.achado.nome}</span>
            {linha.peso && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  linha.peso === 'criterio' ? 'bg-rose-600 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {PESO[linha.peso]}
              </span>
            )}
          </p>
          {linha.comoAparece && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{linha.comoAparece}</p>}
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${s.classe}`}>
          {s.icone}
          {s.rotulo}
        </span>
      </div>

      {linha.nota && (
        <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm leading-relaxed">
          <span className="font-semibold">Nesta lâmina: </span>
          {linha.nota}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {linha.marcacoes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onVer(m.id)}
            aria-pressed={selecionada === m.id}
            className={`inline-flex min-h-[34px] max-w-full items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
              selecionada === m.id
                ? 'border-rose-600 bg-rose-600 text-white'
                : 'border-rose-500/40 text-rose-800 hover:bg-rose-500/10 dark:text-rose-200'
            }`}
          >
            <Crosshair className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">Ver na lâmina{linha.marcacoes.length > 1 ? `: ${m.rotulo}` : ''}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="inline-flex min-h-[34px] items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {aberto ? 'Menos sobre o achado' : 'Sobre o achado'}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${aberto ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      </div>

      {aberto && (
        <div className="mt-2 grid gap-3 border-t border-border/70 pt-3 text-sm sm:grid-cols-2">
          <Bloco titulo="Como reconhecer" itens={linha.achado.comoReconhecer} />
          <Bloco titulo="Por que se forma" itens={linha.achado.mecanismo} />
          <Bloco titulo="O que significa" itens={linha.achado.significado} />
          <Bloco titulo="Armadilhas" itens={linha.achado.armadilhas} />
        </div>
      )}
    </li>
  )
}

function Bloco({ titulo, itens }: { titulo: string; itens: string[] }) {
  if (!itens.length) return null
  return (
    <div>
      <h4 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{titulo}</h4>
      <ul className="space-y-1">
        {itens.map((t) => (
          <li key={t} className="flex gap-2 leading-relaxed">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" aria-hidden />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
