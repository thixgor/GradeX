'use client'

import { useId } from 'react'
import { Info } from 'lucide-react'
import type { Campo } from '@/lib/ferramentas-clinicas/tipos'
import { TextoRico } from './texto'

/**
 * Renderizador genérico de campo.
 *
 * Um único componente desenha os quatro tipos porque a alternativa — um
 * componente por tipo — multiplicaria a superfície de bug num formulário que
 * aparece 200 vezes. As decisões de layout são todas orientadas ao uso real:
 * alvos de toque grandes o suficiente para o celular na beira do leito, teclado
 * numérico com ponto decimal em `inputMode`, e a faixa fisiológica desenhada
 * como trilho para que o valor digitado se situe sem exigir leitura de texto.
 */
export function CampoControle({
  campo,
  valor,
  onChange,
  corTexto,
}: {
  campo: Campo
  valor: string
  onChange: (v: string) => void
  corTexto: string
}) {
  const id = useId()
  const foraDaFaixa =
    campo.tipo === 'numero' &&
    valor !== '' &&
    Number.isFinite(Number(valor.replace(',', '.'))) &&
    ((campo.min !== undefined && Number(valor.replace(',', '.')) < campo.min) ||
      (campo.max !== undefined && Number(valor.replace(',', '.')) > campo.max))

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 flex items-start gap-1.5 text-[13px] font-medium leading-snug text-foreground">
        <span className="min-w-0 flex-1">
          <TextoRico>{campo.rotulo}</TextoRico>
          {campo.tipo === 'sim-nao' && campo.pontos !== undefined && campo.pontos !== 0 && (
            <span className={`ml-1.5 whitespace-nowrap rounded px-1 py-px font-mono text-[10px] font-bold ${campo.pontos < 0 ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
              {campo.pontos > 0 ? '+' : ''}
              {campo.pontos}
            </span>
          )}
          {campo.opcional && <span className="ml-1 text-[11px] font-normal text-muted-foreground/70">(opcional)</span>}
        </span>
      </label>

      {campo.tipo === 'numero' && (
        <div className="relative">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={valor}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9.,-]/g, ''))}
            placeholder={campo.padrao ?? '—'}
            aria-describedby={campo.ajuda ? `${id}-ajuda` : undefined}
            className={`h-11 w-full rounded-lg border bg-background px-3 font-mono text-[15px] tabular-nums outline-none transition-colors placeholder:font-sans placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/25 ${
              foraDaFaixa ? 'border-amber-500/60' : 'border-border focus:border-primary/50'
            } ${campo.unidade ? 'pr-[4.5rem]' : ''}`}
          />
          {campo.unidade && (
            <span className="pointer-events-none absolute right-3 top-1/2 max-w-[4rem] -translate-y-1/2 truncate text-right text-[11px] font-medium text-muted-foreground">
              {campo.unidade}
            </span>
          )}
        </div>
      )}

      {campo.tipo === 'segmentado' && (
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={campo.rotulo}>
          {campo.opcoes?.map((o) => {
            const ativo = valor === o.valor
            return (
              <button
                key={o.valor}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => onChange(o.valor)}
                className={`min-h-[2.5rem] flex-1 basis-[7rem] rounded-lg border px-3 py-2 text-[13px] font-medium leading-tight transition-colors ${
                  ativo ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {o.rotulo}
              </button>
            )
          })}
        </div>
      )}

      {campo.tipo === 'opcao' && (
        <div className="space-y-1.5">
          {campo.opcoes?.map((o) => {
            const ativo = valor === o.valor
            return (
              <button
                key={o.valor}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => onChange(o.valor)}
                className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  ativo ? 'border-primary bg-primary/[0.07]' : 'border-border bg-background hover:border-primary/35'
                }`}
              >
                <span className={`mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${ativo ? 'border-primary' : 'border-muted-foreground/35'}`}>
                  {ativo && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium leading-snug">
                    <TextoRico>{o.rotulo}</TextoRico>
                  </span>
                  {o.descricao && <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted-foreground"><TextoRico>{o.descricao}</TextoRico></span>}
                </span>
                {o.pontos !== undefined && (
                  <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${ativo ? `${corTexto} bg-primary/10` : 'bg-muted text-muted-foreground'}`}>
                    {o.pontos > 0 ? '+' : ''}
                    {o.pontos}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {campo.tipo === 'sim-nao' && (
        <div className="flex gap-1.5" role="radiogroup" aria-label={campo.rotulo}>
          {[
            { v: 'nao', r: 'Não' },
            { v: 'sim', r: 'Sim' },
          ].map((o) => {
            const ativo = (valor || 'nao') === o.v
            const marcado = ativo && o.v === 'sim'
            return (
              <button
                key={o.v}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => onChange(o.v)}
                className={`h-10 flex-1 rounded-lg border text-[13px] font-semibold transition-colors ${
                  marcado
                    ? 'border-primary bg-primary/12 text-foreground'
                    : ativo
                      ? 'border-border bg-muted/60 text-muted-foreground'
                      : 'border-border bg-background text-muted-foreground/70 hover:border-primary/35 hover:text-foreground'
                }`}
              >
                {o.r}
              </button>
            )
          })}
        </div>
      )}

      {campo.tipo === 'numero' && campo.normalMin !== undefined && campo.normalMax !== undefined && (
        <FaixaNormal campo={campo} valor={valor} />
      )}

      {campo.ajuda && (
        <p id={`${id}-ajuda`} className="mt-1.5 flex gap-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
          <Info className="mt-[2px] h-3 w-3 shrink-0 opacity-60" />
          <TextoRico>{campo.ajuda}</TextoRico>
        </p>
      )}
      {foraDaFaixa && (
        <p className="mt-1.5 text-[11.5px] font-medium text-amber-600 dark:text-amber-400">
          Fora da faixa esperada ({campo.min ?? '−∞'} a {campo.max ?? '∞'}). O cálculo continua, mas confira o valor.
        </p>
      )}
    </div>
  )
}

/**
 * Trilho de referência fisiológica.
 *
 * A faixa normal ocupa o miolo de uma escala que vai de `min` a `max`, e o
 * valor digitado aparece como marcador sobre ela. É a diferença entre ler
 * "sódio 128" e ver 128 caindo à esquerda da zona verde — a segunda leitura é
 * imediata e não exige lembrar a faixa de referência.
 */
function FaixaNormal({ campo, valor }: { campo: Campo; valor: string }) {
  const n = Number(valor.replace(',', '.'))
  const min = campo.min ?? campo.normalMin! * 0.5
  const max = campo.max ?? campo.normalMax! * 1.5
  const span = max - min
  if (span <= 0) return null
  const pct = (x: number) => Math.max(0, Math.min(100, ((x - min) / span) * 100))
  const inicio = pct(campo.normalMin!)
  const largura = pct(campo.normalMax!) - inicio
  const temValor = valor !== '' && Number.isFinite(n)
  const dentro = temValor && n >= campo.normalMin! && n <= campo.normalMax!
  return (
    <div className="mt-2">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="absolute inset-y-0 rounded-full bg-emerald-500/35" style={{ left: `${inicio}%`, width: `${largura}%` }} />
        {temValor && (
          <div
            className={`absolute top-1/2 h-3 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full ${dentro ? 'bg-emerald-600' : 'bg-amber-500'}`}
            style={{ left: `${pct(n)}%` }}
          />
        )}
      </div>
      <p className="mt-1 text-[10.5px] font-medium text-muted-foreground/70">
        Referência {campo.normalMin} a {campo.normalMax}
        {campo.unidade ? ` ${campo.unidade}` : ''}
      </p>
    </div>
  )
}
