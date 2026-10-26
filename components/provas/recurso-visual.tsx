'use client'

import { escalaDoEixo, formatarValor, recursoEmTexto, type RecursoVisual } from '@/lib/ia/estudo/recursos-visuais'
import { cn } from '@/lib/utils'

/**
 * O material de apoio da questão (tabela, gráfico, esquema, citação) na tela
 * da prova. Desenhado em HTML/SVG com os tokens do tema, então acompanha claro
 * e escuro e não custa um byte de imagem. O PDF tem o par dele em
 * `lib/pdf/recurso-visual-pdf.ts`.
 *
 * Três séries no máximo, cada uma com cor e padrão de marcador próprios —
 * a cor nunca é o único jeito de distinguir (legenda sempre visível).
 */

const CORES = ['hsl(var(--primary))', '#d98a12', '#2e8fa8']

function Tabela({ r }: { r: Extract<RecursoVisual, { tipo: 'tabela' }> }) {
  return (
    <figure className="not-prose">
      {r.titulo ? <figcaption className="mb-2 text-sm font-semibold text-foreground">{r.titulo}</figcaption> : null}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60">
              {r.cabecalho.map((c, i) => (
                <th key={i} scope="col" className="px-3 py-2 text-left font-semibold text-foreground">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.linhas.map((linha, i) => (
              <tr key={i} className="border-t border-border/70 even:bg-muted/25">
                {linha.map((c, j) => (
                  <td key={j} className={cn('px-3 py-2 align-top text-foreground/90', j === 0 && 'font-medium')}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {r.fonte ? <p className="mt-2 text-xs italic text-muted-foreground">Fonte: {r.fonte}</p> : null}
    </figure>
  )
}

function Grafico({ r }: { r: Extract<RecursoVisual, { tipo: 'grafico' }> }) {
  const largura = 460
  const altura = 250
  const m = { topo: 14, dir: 10, base: 40, esq: 50 }
  const valores = r.series.flatMap((s) => s.valores)
  const escala = escalaDoEixo(Math.max(...valores), Math.min(...valores), r.forma === 'barras')
  const w = largura - m.esq - m.dir
  const h = altura - m.topo - m.base
  const y = (v: number) => m.topo + h - ((v - escala.min) / (escala.max - escala.min || 1)) * h
  const n = r.rotulos.length
  const passoX = w / n
  const marcas: number[] = []
  for (let v = escala.min; v <= escala.max + 1e-9; v += escala.passo) marcas.push(Math.round(v * 1000) / 1000)
  const barra = (passoX * 0.7) / r.series.length

  return (
    <figure className="not-prose">
      {r.titulo ? <figcaption className="mb-2 text-sm font-semibold text-foreground">{r.titulo}</figcaption> : null}
      <div className="rounded-xl border border-border bg-card p-3">
        <svg viewBox={`0 0 ${largura} ${altura}`} className="h-auto w-full" role="img" aria-label={recursoEmTexto(r)}>
          {marcas.map((v) => (
            <g key={v}>
              <line x1={m.esq} x2={largura - m.dir} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
              <text x={m.esq - 8} y={y(v) + 4} textAnchor="end" className="fill-muted-foreground" fontSize={13}>
                {formatarValor(v)}
              </text>
            </g>
          ))}
          {r.rotulos.map((rot, i) => (
            <text key={i} x={m.esq + passoX * i + passoX / 2} y={altura - m.base + 18} textAnchor="middle" className="fill-muted-foreground" fontSize={13}>
              {rot.length > 12 ? `${rot.slice(0, 11)}…` : rot}
            </text>
          ))}
          {r.eixoY ? (
            <text x={12} y={m.topo + h / 2} transform={`rotate(-90 12 ${m.topo + h / 2})`} textAnchor="middle" className="fill-muted-foreground" fontSize={13}>
              {r.eixoY}
            </text>
          ) : null}
          {r.forma === 'barras'
            ? r.series.map((s, k) =>
                s.valores.map((v, i) => {
                  const x = m.esq + passoX * i + passoX * 0.15 + barra * k
                  const topo = y(Math.max(v, 0))
                  const base = y(Math.max(escala.min, 0))
                  return <rect key={`${k}-${i}`} x={x} y={topo} width={Math.max(2, barra - 2)} height={Math.max(0, base - topo)} rx={3} fill={CORES[k]} />
                }),
              )
            : r.series.map((s, k) => (
                <g key={k}>
                  <polyline
                    fill="none"
                    stroke={CORES[k]}
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeDasharray={k === 1 ? '6 4' : k === 2 ? '2 4' : undefined}
                    points={s.valores.map((v, i) => `${m.esq + passoX * i + passoX / 2},${y(v)}`).join(' ')}
                  />
                  {s.valores.map((v, i) => (
                    <circle key={i} cx={m.esq + passoX * i + passoX / 2} cy={y(v)} r={4} fill={CORES[k]} className="stroke-card" strokeWidth={2} />
                  ))}
                </g>
              ))}
        </svg>
        {r.series.length > 1 || r.series[0]?.nome ? (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
            {r.series.map((s, k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: CORES[k] }} />
                {s.nome}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {r.fonte ? <p className="mt-2 text-xs italic text-muted-foreground">Fonte: {r.fonte}</p> : null}
    </figure>
  )
}

function Esquema({ r }: { r: Extract<RecursoVisual, { tipo: 'esquema' }> }) {
  return (
    <figure className="not-prose">
      {r.titulo ? <figcaption className="mb-2 text-sm font-semibold text-foreground">{r.titulo}</figcaption> : null}
      <ol className="flex flex-col items-stretch gap-0 rounded-xl border border-border bg-card p-4 sm:mx-auto sm:max-w-md">
        {r.etapas.map((etapa, i) => (
          <li key={i} className="flex flex-col items-center">
            <div className="w-full rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center text-sm font-medium text-foreground">{etapa}</div>
            {i < r.etapas.length - 1 || r.forma === 'ciclo' ? (
              <svg width="14" height="22" viewBox="0 0 14 22" aria-hidden className="my-0.5 text-primary">
                <path d="M7 1v17M2 13l5 6 5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </li>
        ))}
        {r.forma === 'ciclo' ? <li className="text-center text-xs text-muted-foreground">↺ volta à primeira etapa</li> : null}
      </ol>
      {r.fonte ? <p className="mt-2 text-xs italic text-muted-foreground">Fonte: {r.fonte}</p> : null}
    </figure>
  )
}

function Citacao({ r }: { r: Extract<RecursoVisual, { tipo: 'citacao' }> }) {
  return (
    <figure className="not-prose rounded-xl border border-border bg-muted/30 px-5 py-4">
      <blockquote className="font-serif text-[15px] italic leading-relaxed text-foreground">“{r.texto}”</blockquote>
      {r.autor || r.fonte ? (
        <figcaption className="mt-2 text-xs text-muted-foreground">
          — {[r.autor, r.fonte].filter(Boolean).join(', ')}
        </figcaption>
      ) : null}
    </figure>
  )
}

export function RecursoVisualDaQuestao({ recurso, className }: { recurso?: RecursoVisual | null; className?: string }) {
  if (!recurso) return null
  return (
    <div className={cn('my-1', className)}>
      {recurso.tipo === 'tabela' ? (
        <Tabela r={recurso} />
      ) : recurso.tipo === 'grafico' ? (
        <Grafico r={recurso} />
      ) : recurso.tipo === 'esquema' ? (
        <Esquema r={recurso} />
      ) : (
        <Citacao r={recurso} />
      )}
    </div>
  )
}

