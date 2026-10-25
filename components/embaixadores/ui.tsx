'use client'

import { useCallback, useId, useMemo, useState, type ReactNode } from 'react'
import { Check, Copy, Flame, Snowflake, Sparkles, TrendingUp, X } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { useCountUp } from '@/hooks/use-count-up'
import { useChartWidth } from '@/components/charts/chart-kit'
import { cn } from '@/lib/utils'
import { copiarTexto } from './copiar'
import {
  ROTULO_DO_STATUS,
  ROTULO_DO_TIPO,
  type SaudeDoCupom,
  type StatusDoEmbaixador,
  type TipoDeEmbaixador,
} from '@/lib/embaixadores/regras'
import './embaixadores.css'

/* Peças comuns ao painel do embaixador, ao convite e ao admin. */

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const inteiros = new Intl.NumberFormat('pt-BR')

export function formatarReais(valor: number) {
  return reais.format(Number(valor) || 0)
}

export function formatarInteiro(valor: number) {
  return inteiros.format(Math.round(Number(valor) || 0))
}

export function formatarData(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' })
}

export function formatarDataCurta(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
}

/** "há 3 dias", "hoje" — para a última venda. */
export function haQuanto(iso?: string | null) {
  if (!iso) return 'nunca'
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  if (dias < 30) return `há ${dias} dias`
  const meses = Math.floor(dias / 30)
  return meses === 1 ? 'há 1 mês' : `há ${meses} meses`
}

/** O aviso "Copiado!" que sobe do rodapé. Um por vez. */
export function useAviso() {
  const [aviso, setAviso] = useState<{ texto: string; chave: number } | null>(null)
  const avisar = useCallback((texto: string) => {
    const chave = Date.now()
    setAviso({ texto, chave })
    window.setTimeout(() => setAviso((atual) => (atual?.chave === chave ? null : atual)), 2300)
  }, [])
  const elemento = aviso ? (
    <div key={aviso.chave} role="status" aria-live="polite" className="emb-aviso">
      {aviso.texto}
    </div>
  ) : null
  return { avisar, elemento }
}

export function BotaoCopiar({
  texto,
  rotulo = 'Copiar',
  aviso = 'Copiado!',
  avisar,
  className,
  principal = false,
}: {
  texto: string
  rotulo?: string
  aviso?: string
  avisar?: (t: string) => void
  className?: string
  principal?: boolean
}) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    const ok = await copiarTexto(texto)
    if (!ok) {
      avisar?.('Não deu para copiar. Segure o texto para copiar.')
      return
    }
    setCopiado(true)
    avisar?.(aviso)
    window.setTimeout(() => setCopiado(false), 1800)
  }
  return (
    <button
      type="button"
      onClick={copiar}
      className={cn('emb-botao emb-foco', principal ? 'vidro-botao' : 'emb-botao-vidro', className)}
      aria-label={`${rotulo}: ${texto}`}
    >
      {copiado ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {copiado ? 'Copiado' : rotulo}
    </button>
  )
}

/** Um número do painel, contando até o valor quando aparece. */
export function Kpi({
  rotulo,
  valor,
  formato = 'inteiro',
  detalhe,
  icone,
  destaque = false,
  className,
  indice = 0,
}: {
  rotulo: string
  valor: number
  formato?: 'inteiro' | 'reais' | 'porcento'
  detalhe?: ReactNode
  icone?: ReactNode
  destaque?: boolean
  className?: string
  indice?: number
}) {
  // A contagem anima em inteiros; reais contam em centavos e porcentagem em
  // décimos, senão R$ 117,50 terminaria em R$ 118,00.
  const escala = formato === 'reais' ? 100 : formato === 'porcento' ? 10 : 1
  const animado = useCountUp(Math.round((Number(valor) || 0) * escala), 900) / escala
  const texto =
    formato === 'reais' ? formatarReais(animado) : formato === 'porcento' ? `${animado.toFixed(1).replace('.', ',')}%` : formatarInteiro(animado)
  return (
    <div
      className={cn('emb-lista emb-ergue vidro-sobe flex min-w-0 flex-col rounded-[22px] p-4 md:p-5', className)}
      style={{ ['--i' as string]: indice }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="emb-suave truncate text-[13px] font-semibold">{rotulo}</p>
        {icone && <span className="emb-fraca shrink-0">{icone}</span>}
      </div>
      <p
        className={cn(
          'emb-numero mt-3 truncate',
          formato === 'reais' ? 'text-[22px] md:text-[26px]' : 'text-[26px] md:text-[30px]',
          destaque && 'emb-dinheiro',
        )}
        aria-label={`${rotulo}: ${formato === 'reais' ? formatarReais(valor) : formato === 'porcento' ? `${valor}%` : formatarInteiro(valor)}`}
      >
        {texto}
      </p>
      {detalhe && <div className="emb-fraca mt-1.5 text-[12.5px] leading-snug">{detalhe}</div>}
    </div>
  )
}

export function SeloStatus({ status }: { status: StatusDoEmbaixador }) {
  const tom = status === 'ativo' ? 'verde' : status === 'pausado' ? 'ambar' : 'vermelho'
  return (
    <span className="emb-selo" data-tom={tom}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {ROTULO_DO_STATUS[status]}
    </span>
  )
}

export function SeloTipo({ tipo, comissao }: { tipo: TipoDeEmbaixador; comissao?: number }) {
  return (
    <span className="emb-selo" data-tom={tipo === 'remunerado' ? 'ambar' : undefined}>
      {ROTULO_DO_TIPO[tipo]}
      {tipo === 'remunerado' && comissao !== undefined && <strong className="font-extrabold">· {String(comissao).replace('.', ',')}%</strong>}
    </span>
  )
}

const SAUDE: Record<SaudeDoCupom, { rotulo: string; tom?: string; Icone: typeof Flame }> = {
  girando: { rotulo: 'Cupom girando', tom: 'verde', Icone: Flame },
  estreando: { rotulo: 'Estreando', tom: undefined, Icone: Sparkles },
  esfriando: { rotulo: 'Esfriando', tom: 'ambar', Icone: TrendingUp },
  parado: { rotulo: 'Cupom parado', tom: 'vermelho', Icone: Snowflake },
}

export function SeloSaude({ saude }: { saude: SaudeDoCupom }) {
  const s = SAUDE[saude]
  return (
    <span className="emb-selo" data-tom={s.tom}>
      <s.Icone className="h-3.5 w-3.5" aria-hidden />
      {s.rotulo}
    </span>
  )
}

export function Abas<T extends string>({
  abas,
  atual,
  aoTrocar,
  rotulo,
}: {
  abas: Array<{ id: T; rotulo: string; contagem?: number }>
  atual: T
  aoTrocar: (id: T) => void
  rotulo: string
}) {
  return (
    <div role="tablist" aria-label={rotulo} className="emb-abas">
      {abas.map((aba) => (
        <button
          key={aba.id}
          type="button"
          role="tab"
          aria-selected={aba.id === atual}
          onClick={() => aoTrocar(aba.id)}
          className="emb-aba emb-foco"
        >
          {aba.rotulo}
          {aba.contagem !== undefined && (
            <span className="emb-fraca text-[12px] font-bold">{formatarInteiro(aba.contagem)}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/** Modal de vidro: folha que sobe no celular, caixa centralizada no desktop. */
export function Modal({
  aberto,
  aoFechar,
  titulo,
  descricao,
  children,
  largura = 'max-w-xl',
}: {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  descricao?: string
  children: ReactNode
  largura?: string
}) {
  const id = useId()
  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()} variant="sheet">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        className={cn('emb-modal w-full rounded-t-[28px] p-5 sm:mx-4 sm:w-[min(92vw,100%)] sm:rounded-[28px] md:p-7', largura)}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={`${id}-t`} className="text-[20px] font-extrabold tracking-tight">
              {titulo}
            </h2>
            {descricao && <p className="emb-suave mt-1 text-[14px]">{descricao}</p>}
          </div>
          <button type="button" onClick={aoFechar} className="emb-botao emb-botao-vidro emb-foco !h-10 !min-h-0 !w-10 !p-0" aria-label="Fechar">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </Dialog>
  )
}

export function Vazio({ icone, titulo, texto, children }: { icone: ReactNode; titulo: string; texto: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="emb-lista grid h-14 w-14 place-items-center rounded-2xl">{icone}</div>
      <p className="mt-4 text-[17px] font-bold">{titulo}</p>
      <p className="emb-suave mt-1.5 max-w-[42ch] text-[14.5px]">{texto}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}

/**
 * Funil do link: visitantes → cadastros → indicados que compraram. Cada
 * etapa mostra o número e a passagem da anterior.
 */
export function Funil({ etapas }: { etapas: Array<{ rotulo: string; valor: number }> }) {
  const topo = Math.max(1, ...etapas.map((e) => e.valor))
  return (
    <ol className="space-y-4">
      {etapas.map((etapa, i) => {
        const anterior = i > 0 ? etapas[i - 1].valor : null
        const passagem = anterior ? Math.round((etapa.valor / anterior) * 1000) / 10 : null
        return (
          <li key={etapa.rotulo}>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="font-semibold">{etapa.rotulo}</span>
              <span className="flex items-baseline gap-2">
                {passagem !== null && (
                  <span className="emb-fraca text-[12px]">{String(passagem).replace('.', ',')}% da etapa anterior</span>
                )}
                <strong className="text-[16px]">{formatarInteiro(etapa.valor)}</strong>
              </span>
            </div>
            <div className="emb-trilho mt-2" aria-hidden>
              <span style={{ width: `${Math.max(etapa.valor > 0 ? 3 : 0, (etapa.valor / topo) * 100)}%`, animationDelay: `${i * 120}ms` }} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export interface PontoSemanal {
  semana: string
  cadastros: number
  compras: number
}

/**
 * Cadastros e compras por semana, em colunas lado a lado (mesma escala: os
 * dois são contagens). Passar o mouse ou o foco numa semana mostra os números;
 * a tabela equivalente fica para leitores de tela.
 */
export function GraficoSemanal({ dados }: { dados: PontoSemanal[] }) {
  const { ref, width } = useChartWidth<HTMLDivElement>()
  const [foco, setFoco] = useState<number | null>(null)
  const idTitulo = useId()
  const altura = 200
  const margem = { topo: 14, base: 26, esquerda: 28, direita: 4 }
  const maximo = Math.max(1, ...dados.map((d) => Math.max(d.cadastros, d.compras)))
  const passo = Math.max(1, Math.ceil(maximo / 4))
  const teto = passo * 4
  const areaW = Math.max(0, width - margem.esquerda - margem.direita)
  const areaH = altura - margem.topo - margem.base
  const grupo = dados.length ? areaW / dados.length : 0
  const barra = Math.max(3, Math.min(16, (grupo - 10) / 2))
  const y = (v: number) => margem.topo + areaH - (v / teto) * areaH

  const rotuloSemana = useCallback((s: string) => {
    const [, m, d] = s.split('-')
    return `${d}/${m}`
  }, [])

  const coluna = (x: number, valor: number, cor: string) => {
    if (valor <= 0) return null
    const topo = y(valor)
    const h = margem.topo + areaH - topo
    const r = Math.min(4, barra / 2, h)
    return (
      <path
        d={`M${x},${topo + h} L${x},${topo + r} Q${x},${topo} ${x + r},${topo} L${x + barra - r},${topo} Q${x + barra},${topo} ${x + barra},${topo + r} L${x + barra},${topo + h} Z`}
        fill={cor}
      />
    )
  }

  const total = useMemo(
    () => dados.reduce((acc, d) => ({ cadastros: acc.cadastros + d.cadastros, compras: acc.compras + d.compras }), { cadastros: 0, compras: 0 }),
    [dados],
  )

  return (
    <figure className="viz" aria-labelledby={idTitulo}>
      <figcaption id={idTitulo} className="sr-only">
        Cadastros e compras por semana nas últimas {dados.length} semanas
      </figcaption>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-[13px]">
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: 'var(--viz-series-1)' }} />
          Cadastros <strong>{formatarInteiro(total.cadastros)}</strong>
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: 'var(--viz-series-2)' }} />
          Compras <strong>{formatarInteiro(total.compras)}</strong>
        </span>
      </div>
      <div ref={ref} className="relative w-full min-w-0" onMouseLeave={() => setFoco(null)}>
        {width > 0 && (
          <svg width={width} height={altura} role="img" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <line
                  x1={margem.esquerda}
                  x2={width - margem.direita}
                  y1={y(i * passo)}
                  y2={y(i * passo)}
                  stroke={i === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'}
                  strokeWidth={1}
                  opacity={i === 0 ? 1 : 0.6}
                />
                <text x={margem.esquerda - 8} y={y(i * passo) + 4} textAnchor="end" fontSize={11} fill="currentColor" opacity={0.55}>
                  {i * passo}
                </text>
              </g>
            ))}
            {dados.map((d, i) => {
              const x0 = margem.esquerda + i * grupo + (grupo - barra * 2 - 2) / 2
              const ativo = foco === i
              return (
                <g key={d.semana} opacity={foco === null || ativo ? 1 : 0.45}>
                  {ativo && (
                    <rect x={margem.esquerda + i * grupo + 2} y={margem.topo} width={grupo - 4} height={areaH} rx={8} fill="currentColor" opacity={0.06} />
                  )}
                  {coluna(x0, d.cadastros, 'var(--viz-series-1)')}
                  {coluna(x0 + barra + 2, d.compras, 'var(--viz-series-2)')}
                  {(i % (dados.length > 8 && width < 520 ? 2 : 1) === 0 || i === dados.length - 1) && (
                    <text x={margem.esquerda + i * grupo + grupo / 2} y={altura - 8} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.55}>
                      {rotuloSemana(d.semana)}
                    </text>
                  )}
                  <rect
                    x={margem.esquerda + i * grupo}
                    y={0}
                    width={grupo}
                    height={altura}
                    fill="transparent"
                    onMouseEnter={() => setFoco(i)}
                    onTouchStart={() => setFoco(i)}
                  />
                </g>
              )
            })}
          </svg>
        )}
        {foco !== null && dados[foco] && width > 0 && (
          <div
            className="emb-vidro pointer-events-none absolute top-0 z-10 rounded-xl px-3 py-2 text-[12.5px]"
            style={{
              left: Math.min(Math.max(0, margem.esquerda + foco * grupo + grupo / 2 - 70), Math.max(0, width - 140)),
              width: 140,
            }}
          >
            <p className="font-bold">Semana de {rotuloSemana(dados[foco].semana)}</p>
            <p className="emb-suave mt-0.5">{formatarInteiro(dados[foco].cadastros)} cadastros</p>
            <p className="emb-suave">{formatarInteiro(dados[foco].compras)} compras</p>
          </div>
        )}
      </div>
      <table className="sr-only">
        <thead>
          <tr>
            <th>Semana</th>
            <th>Cadastros</th>
            <th>Compras</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d) => (
            <tr key={d.semana}>
              <td>{rotuloSemana(d.semana)}</td>
              <td>{d.cadastros}</td>
              <td>{d.compras}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

/**
 * A leitura do gráfico em quatro números: melhor semana, ritmo médio, o que
 * entrou no período e a tendência (últimas 4 semanas contra as 4 anteriores).
 */
export function ResumoDasSemanas({ dados }: { dados: Array<PontoSemanal & { receita: number }> }) {
  if (dados.length === 0) return null
  const melhor = dados.reduce((a, b) => (b.compras > a.compras || (b.compras === a.compras && b.cadastros > a.cadastros) ? b : a))
  const compras = dados.reduce((s, d) => s + d.compras, 0)
  const receita = dados.reduce((s, d) => s + d.receita, 0)
  const recentes = dados.slice(-4).reduce((s, d) => s + d.compras, 0)
  const anteriores = dados.slice(-8, -4).reduce((s, d) => s + d.compras, 0)
  const tendencia = anteriores > 0 ? Math.round(((recentes - anteriores) / anteriores) * 100) : recentes > 0 ? 100 : 0
  const [, m, d] = melhor.semana.split('-')
  const itens = [
    { rotulo: 'Melhor semana', valor: melhor.compras > 0 || melhor.cadastros > 0 ? `${d}/${m}` : '—', detalhe: `${melhor.compras} compras · ${melhor.cadastros} cadastros` },
    { rotulo: 'Compras por semana', valor: (compras / dados.length).toFixed(1).replace('.', ','), detalhe: 'média do período' },
    { rotulo: 'Vendido no período', valor: formatarReais(receita), detalhe: `${dados.length} semanas` },
    {
      rotulo: 'Tendência',
      valor: `${tendencia > 0 ? '+' : ''}${tendencia}%`,
      detalhe: '4 últimas × 4 antes',
      tom: tendencia > 0 ? 'emb-verde' : tendencia < 0 ? 'emb-ambar' : '',
    },
  ]
  return (
    <dl className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      {itens.map((item) => (
        <div key={item.rotulo} className="emb-lista min-w-0 rounded-2xl p-3.5">
          <dt className="emb-fraca truncate text-[12px] font-semibold">{item.rotulo}</dt>
          <dd className={cn('mt-1 truncate text-[18px] font-extrabold', item.tom)}>{item.valor}</dd>
          <dd className="emb-fraca truncate text-[11.5px]">{item.detalhe}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Barras horizontais dos produtos que mais saíram. */
export function ProdutosQueSairam({ produtos }: { produtos: Array<{ produto: string; compras: number; receita: number }> }) {
  const topo = Math.max(1, ...produtos.map((p) => p.receita))
  return (
    <ul className="space-y-3.5">
      {produtos.map((p, i) => (
        <li key={p.produto}>
          <div className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="min-w-0 truncate font-semibold" title={p.produto}>
              {p.produto}
            </span>
            <span className="shrink-0">
              <span className="emb-fraca mr-2 text-[12px]">{formatarInteiro(p.compras)}×</span>
              <strong>{formatarReais(p.receita)}</strong>
            </span>
          </div>
          <div className="emb-trilho mt-1.5 !h-2" aria-hidden>
            <span style={{ width: `${Math.max(3, (p.receita / topo) * 100)}%`, animationDelay: `${i * 90}ms` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
