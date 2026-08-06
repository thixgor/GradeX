'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Link2,
  RotateCcw,
  Sigma,
} from 'lucide-react'
import type { Campo, Ferramenta, Valores } from '@/lib/ferramentas-clinicas/tipos'
import { estiloNivel, tema } from './tema'
import { CampoControle } from './campo'
import { TextoRico } from './texto'

/** Valores iniciais a partir dos padrões declarados em cada campo. */
function valoresIniciais(campos: Campo[]): Valores {
  const v: Valores = {}
  for (const c of campos) if (c.padrao !== undefined) v[c.id] = c.padrao
  return v
}

/**
 * Painel de uma ferramenta.
 *
 * O cálculo é síncrono e roda a cada tecla — não há botão "calcular", de
 * propósito: o retorno imediato transforma a calculadora em instrumento de
 * exploração ("e se o bicarbonato fosse 12?"), que é a diferença entre uma
 * ferramenta de conferir conta e uma de aprender fisiologia.
 */
export function PainelFerramenta({
  ferramenta,
  cor,
  aberto,
  onToggle,
  ancora,
}: {
  ferramenta: Ferramenta
  cor: string
  aberto: boolean
  onToggle: () => void
  ancora?: boolean
}) {
  const t = tema(cor)
  const [valores, setValores] = useState<Valores>(() => valoresIniciais(ferramenta.campos))
  const [copiado, setCopiado] = useState<'link' | 'resultado' | null>(null)

  const camposVisiveis = useMemo(
    () => ferramenta.campos.filter((c) => !c.mostrarSe || c.mostrarSe(valores)),
    [ferramenta.campos, valores],
  )

  const resultado = useMemo(() => {
    try {
      return ferramenta.calcular(valores)
    } catch {
      return null
    }
  }, [ferramenta, valores])

  const faltando = useMemo(
    () => camposVisiveis.filter((c) => !c.opcional && (valores[c.id] === undefined || valores[c.id] === '')),
    [camposVisiveis, valores],
  )

  const setValor = useCallback((id: string, v: string) => setValores((atual) => ({ ...atual, [id]: v })), [])
  const limpar = useCallback(() => setValores(valoresIniciais(ferramenta.campos)), [ferramenta.campos])

  const copiar = useCallback(
    async (tipo: 'link' | 'resultado') => {
      const texto =
        tipo === 'link'
          ? `${window.location.origin}${window.location.pathname}?f=${ferramenta.id}`
          : montarResumo(ferramenta, resultado)
      try {
        await navigator.clipboard.writeText(texto)
        setCopiado(tipo)
        setTimeout(() => setCopiado(null), 1800)
      } catch {
        /* área de transferência indisponível — silencioso por design */
      }
    },
    [ferramenta, resultado],
  )

  const est = estiloNivel(resultado?.nivel)

  return (
    <section
      id={`f-${ferramenta.id}`}
      className={`scroll-mt-24 overflow-hidden rounded-xl border bg-card transition-colors ${
        aberto ? `${t.border} shadow-sm` : `border-border ${t.hoverBorder}`
      } ${ancora ? 'ring-2 ring-primary/30' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberto}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/40 sm:p-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className="font-heading text-[15px] font-semibold leading-snug tracking-tight sm:text-base">{ferramenta.nome}</h3>
            {ferramenta.sigla && (
              <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${t.bg} ${t.text}`}>
                {ferramenta.sigla}
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{ferramenta.resumo}</p>
        </div>
        <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="border-t border-border">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            {/* ─────────── Entrada ─────────── */}
            <div className="border-b border-border p-4 sm:p-5 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="editorial-mark">Dados</p>
                <button
                  type="button"
                  onClick={limpar}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" /> Limpar
                </button>
              </div>
              <div className="space-y-4">
                {camposVisiveis.map((c) => (
                  <CampoControle key={c.id} campo={c} valor={valores[c.id] ?? ''} onChange={(v) => setValor(c.id, v)} corTexto={t.text} />
                ))}
              </div>
            </div>

            {/* ─────────── Resultado ─────────── */}
            <div className="bg-muted/20 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="editorial-mark">Resultado</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => copiar('resultado')}
                    disabled={!resultado}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                  >
                    {copiado === 'resultado' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiado === 'resultado' ? 'Copiado' : 'Copiar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copiar('link')}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Copiar link direto para esta ferramenta"
                  >
                    {copiado === 'link' ? <Check className="h-3 w-3 text-emerald-600" /> : <Link2 className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {!resultado ? (
                <div className="rounded-lg border border-dashed border-border bg-background/60 p-5 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Preencha os campos para calcular</p>
                  {faltando.length > 0 && (
                    <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground/75">
                      Faltam: {faltando.map((c) => c.rotulo.replace(/\*\*/g, '')).join(' · ')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`rounded-xl border p-4 ${est.cartao}`}>
                    {resultado.titulo && <p className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">{resultado.titulo}</p>}
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                      <span className={`font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl ${est.valor}`}>{resultado.valor}</span>
                      {resultado.unidade && <span className="text-sm font-medium text-muted-foreground">{resultado.unidade}</span>}
                    </div>
                    {resultado.rotuloNivel && (
                      <span className={`mt-2.5 inline-block rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${est.chip}`}>
                        {resultado.rotuloNivel}
                      </span>
                    )}
                  </div>

                  {resultado.detalhes && resultado.detalhes.length > 0 && (
                    <dl className="space-y-2">
                      {resultado.detalhes.map((d, i) => {
                        const e = estiloNivel(d.nivel)
                        return (
                          <div key={i} className="flex gap-2.5 rounded-lg border border-border bg-background p-2.5">
                            <span className={`mt-0.5 w-[3px] shrink-0 rounded-full ${e.barra}`} aria-hidden />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                <dt className="text-[12.5px] font-medium text-muted-foreground">
                                  <TextoRico>{d.rotulo}</TextoRico>
                                </dt>
                                <dd className={`font-mono text-[13px] font-semibold tabular-nums ${d.nivel && d.nivel !== 'neutro' ? e.valor : 'text-foreground'}`}>
                                  <TextoRico>{d.valor}</TextoRico>
                                </dd>
                              </div>
                              {d.nota && (
                                <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground/85">
                                  <TextoRico>{d.nota}</TextoRico>
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </dl>
                  )}

                  {resultado.tabela && (
                    <div className="overflow-hidden rounded-lg border border-border bg-background">
                      {resultado.tabela.titulo && (
                        <p className="border-b border-border bg-muted/40 px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {resultado.tabela.titulo}
                        </p>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12.5px]">
                          <thead>
                            <tr className="border-b border-border">
                              {resultado.tabela.colunas.map((c, i) => (
                                <th key={i} className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">
                                  {c}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {resultado.tabela.linhas.map((linha, i) => (
                              <tr
                                key={i}
                                className={`border-b border-border/60 last:border-0 ${resultado.tabela!.destaque === i ? `${t.bg} font-semibold` : ''}`}
                              >
                                {linha.map((celula, j) => (
                                  <td key={j} className="px-3 py-2 align-top leading-relaxed">
                                    <TextoRico>{celula}</TextoRico>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {resultado.interpretacao && resultado.interpretacao.length > 0 && (
                    <div className="space-y-2.5 rounded-lg border border-border bg-background p-3.5">
                      <p className="editorial-mark">Interpretação</p>
                      {resultado.interpretacao.map((p, i) => (
                        <p key={i} className="text-[13px] leading-relaxed text-muted-foreground">
                          <TextoRico>{p}</TextoRico>
                        </p>
                      ))}
                    </div>
                  )}

                  {resultado.conduta && resultado.conduta.length > 0 && (
                    <ul className="space-y-1.5 rounded-lg border border-border bg-background p-3.5">
                      {resultado.conduta.map((c, i) => (
                        <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground">
                          <span className={`mt-[7px] h-1 w-1 shrink-0 rounded-full ${t.text.replace('text-', 'bg-')}`} />
                          <TextoRico>{c}</TextoRico>
                        </li>
                      ))}
                    </ul>
                  )}

                  {resultado.alertas && resultado.alertas.length > 0 && (
                    <div className="space-y-2 rounded-lg border border-rose-500/30 bg-rose-500/[0.06] p-3.5">
                      {resultado.alertas.map((a, i) => (
                        <p key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-rose-800 dark:text-rose-200">
                          <AlertTriangle className="mt-[3px] h-3.5 w-3.5 shrink-0" />
                          <TextoRico>{a}</TextoRico>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ─────────── Fundamento, fórmula, armadilhas e referências ─────────── */}
          <div className="border-t border-border bg-background p-4 sm:p-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                {ferramenta.formula && ferramenta.formula.length > 0 && (
                  <div>
                    <p className="editorial-mark mb-2 flex items-center gap-1.5">
                      <Sigma className="h-3 w-3" /> Fórmula
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3">
                      <pre className="whitespace-pre font-mono text-[12px] leading-relaxed text-foreground">{ferramenta.formula.join('\n')}</pre>
                    </div>
                  </div>
                )}
                <div>
                  <p className="editorial-mark mb-2">Fundamento</p>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    <TextoRico>{ferramenta.fundamento}</TextoRico>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {ferramenta.armadilhas && ferramenta.armadilhas.length > 0 && (
                  <div>
                    <p className="editorial-mark mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" /> Armadilhas
                    </p>
                    <ul className="space-y-2">
                      {ferramenta.armadilhas.map((a, i) => (
                        <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
                          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                          <TextoRico>{a}</TextoRico>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="editorial-mark mb-2 flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3" /> Referências
                  </p>
                  <ol className="space-y-1.5">
                    {ferramenta.referencias.map((r, i) => (
                      <li key={i} className="text-[11.5px] leading-relaxed text-muted-foreground/85">
                        {r.link ? (
                          <a href={r.link} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground">
                            {r.texto}
                          </a>
                        ) : (
                          r.texto
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/** Texto colável no prontuário: valor, classificação e números intermediários. */
function montarResumo(f: Ferramenta, r: ReturnType<Ferramenta['calcular']>): string {
  if (!r) return ''
  const linhas = [`${f.nome}${f.sigla ? ` (${f.sigla})` : ''}`, `${r.titulo ? `${r.titulo}: ` : ''}${r.valor}${r.unidade ? ` ${r.unidade}` : ''}`]
  if (r.rotuloNivel) linhas.push(r.rotuloNivel)
  if (r.detalhes?.length) {
    linhas.push('')
    for (const d of r.detalhes) linhas.push(`${d.rotulo.replace(/\*\*/g, '')}: ${d.valor.replace(/\*\*/g, '')}`)
  }
  linhas.push('', 'Calculado nas Ferramentas Clínicas do Manual Clínico. Material educacional — não substitui julgamento clínico.')
  return linhas.join('\n')
}
