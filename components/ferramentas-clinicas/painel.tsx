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
  Star,
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
  favorito,
  onFavoritar,
  fixo = false,
}: {
  ferramenta: Ferramenta
  cor: string
  aberto: boolean
  onToggle: () => void
  ancora?: boolean
  favorito?: boolean
  onFavoritar?: () => void
  /**
   * Página dedicada a esta ferramenta: o painel nasce aberto e o cabeçalho
   * deixa de ser botão.
   *
   * Numa tela em que a ferramenta é o único assunto, um cabeçalho que recolhe
   * o conteúdo só oferece a possibilidade de esvaziar a página — e um toque
   * errado no título apagaria justamente aquilo que a pessoa veio ver.
   */
  fixo?: boolean
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
      // O link copiado é o endereço próprio da ferramenta. Antes ele apontava
      // para a lista da área com `?f=`, e quem recebia caía numa página com
      // dezenas de calculadoras para achar aquela de que se falava.
      const texto =
        tipo === 'link'
          ? `${window.location.origin}/manual-clinico/ferramentas/${ferramenta.categorias[0]}/${ferramenta.id}`
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
    /* Sem `overflow-hidden`: ele criaria um contexto de rolagem e a barra fixa
       de resultado do celular deixaria de grudar. O arredondamento passa a ser
       declarado nos filhos das pontas. */
    <section
      id={`f-${ferramenta.id}`}
      className={`scroll-mt-20 rounded-xl border bg-card transition-colors ${
        aberto ? `${t.border} shadow-sm` : `border-border ${t.hoverBorder}`
      } ${ancora ? 'ring-2 ring-primary/30' : ''}`}
    >
      <div className="flex items-stretch">
        {(() => {
          const miolo = (
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 className={`font-heading font-semibold leading-snug tracking-tight ${fixo ? 'text-lg sm:text-xl' : 'text-[15px] sm:text-base'}`}>
                  {ferramenta.nome}
                </h3>
                {ferramenta.sigla && (
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${t.bg} ${t.text}`}>
                    {ferramenta.sigla}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{ferramenta.resumo}</p>
            </div>
          )

          return fixo ? (
            <div className="flex min-w-0 flex-1 items-start gap-3 py-4 pl-4 pr-2 sm:py-5 sm:pl-5">{miolo}</div>
          ) : (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={aberto}
              className={`flex min-w-0 flex-1 items-start gap-3 py-4 pl-4 pr-2 text-left transition-colors hover:bg-muted/40 sm:py-5 sm:pl-5 ${
                aberto ? 'rounded-tl-xl' : 'rounded-l-xl'
              }`}
            >
              {miolo}
              <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`} />
            </button>
          )
        })()}

        {/* Botão irmão, não aninhado: um <button> dentro de outro é HTML
            inválido e quebra o teclado e o leitor de tela. */}
        {onFavoritar && (
          <button
            type="button"
            onClick={onFavoritar}
            aria-pressed={!!favorito}
            aria-label={favorito ? `Remover ${ferramenta.nome} dos favoritos` : `Salvar ${ferramenta.nome} nos favoritos`}
            title={favorito ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            className={`flex shrink-0 items-start justify-center py-4 pl-1.5 pr-3.5 transition-colors sm:py-5 sm:pr-4 ${
              aberto ? 'rounded-tr-xl' : 'rounded-r-xl'
            } ${favorito ? 'text-amber-500' : 'text-muted-foreground/30 hover:text-amber-500'}`}
          >
            <Star className={`mt-0.5 h-5 w-5 transition-transform ${favorito ? 'scale-110 fill-current' : ''}`} />
          </button>
        )}
      </div>

      {aberto && (
        <div className="border-t border-border">
          {/* No celular as colunas viram pilha e o resultado cai abaixo dos
              campos — longe de quem está digitando. Esta faixa mantém o número
              à vista enquanto se percorre o formulário. O `top-14` livra os
              botões flutuantes do AppShell, que ocupam os 52px do topo. */}
          {resultado && (
            <div className="sticky top-14 z-20 flex items-center gap-2.5 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur lg:hidden">
              <span className={`h-2 w-2 shrink-0 rounded-full ${est.barra}`} aria-hidden />
              <p className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                {resultado.titulo || 'Resultado'}
              </p>
              <span className={`max-w-[58%] shrink-0 truncate font-heading text-base font-bold leading-tight tracking-tight ${est.valor}`}>
                {resultado.valor}
                {resultado.unidade && <span className="ml-1 text-[11px] font-medium text-muted-foreground">{resultado.unidade}</span>}
              </span>
            </div>
          )}

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            {/* ─────────── Entrada ─────────── */}
            <div className="min-w-0 border-b border-border p-4 sm:p-5 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="editorial-mark">Dados</p>
                <button
                  type="button"
                  onClick={limpar}
                  className="-mr-1.5 inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:-mr-1 sm:h-8 sm:px-2"
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
            <div className="min-w-0 bg-muted/20 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="editorial-mark">Resultado</p>
                <div className="-mr-1.5 flex items-center gap-0.5 sm:-mr-1">
                  <button
                    type="button"
                    onClick={() => copiar('resultado')}
                    disabled={!resultado}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 sm:h-8 sm:px-2"
                  >
                    {copiado === 'resultado' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiado === 'resultado' ? 'Copiado' : 'Copiar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copiar('link')}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-8 sm:w-8"
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
                      <span className={`min-w-0 break-words font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl ${est.valor}`}>{resultado.valor}</span>
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
                                <th key={i} className="whitespace-nowrap px-2.5 py-2 font-semibold text-muted-foreground sm:px-3">
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
                                  <td key={j} className="px-2.5 py-2 align-top leading-relaxed sm:px-3">
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
          <div className="rounded-b-xl border-t border-border bg-background p-4 sm:p-5">
            {/* `min-w-0` nos filhos: item de grid tem largura mínima
                automática igual ao conteúdo, então a fórmula em fonte mono
                esticava a coluna, a coluna esticava a grade e a PÁGINA INTEIRA
                passava a rolar de lado no celular — o `overflow-x-auto` da
                caixa da fórmula nunca chegava a agir. */}
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="min-w-0 space-y-4">
                {ferramenta.formula && ferramenta.formula.length > 0 && (
                  <div>
                    <p className="editorial-mark mb-2 flex items-center gap-1.5">
                      <Sigma className="h-3 w-3" /> Fórmula
                    </p>
                    {/* `pre-wrap` em vez de `pre`: muitas fórmulas são frases
                        ("1 ponto para cada: exsudato | adenopatia | febre…") e
                        rolagem lateral para ler uma frase é péssimo no celular.
                        O `pre-wrap` preserva o alinhamento das que dependem
                        dele e quebra as que não cabem. */}
                    <div className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3">
                      <pre className="whitespace-pre-wrap break-words font-mono text-[11.5px] leading-relaxed text-foreground sm:text-[12px]">{ferramenta.formula.join('\n')}</pre>
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

              <div className="min-w-0 space-y-4">
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
