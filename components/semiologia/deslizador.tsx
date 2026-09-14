'use client'

import type { ControleDeIlustracao } from './ilustracoes/controles'

/**
 * O deslizador que varre um parâmetro da figura.
 *
 * Um componente só para a ficha de sinal e para o visor de cenas, porque a
 * interação é a mesma nos dois: o aluno arrasta, o valor aparece formatado do
 * jeito que o laudo escreve, e os marcos anotados na régua são os limiares que
 * a decisão clínica usa — clicar num marco leva a figura exatamente ao ponto
 * em que a conduta muda.
 */
export function Deslizador({
  id,
  controle,
  valor,
  onMudar,
  nota = 'Arraste e veja onde o sinal nasce. Figura esquemática — não é fotografia clínica.',
}: {
  id: string
  controle: ControleDeIlustracao
  valor: number
  onMudar: (valor: number) => void
  nota?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {controle.rotulo}
        </label>
        <span className="text-sm font-semibold tabular-nums">{controle.formatar(valor)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={controle.min}
        max={controle.max}
        step={controle.passo}
        value={valor}
        onChange={(e) => onMudar(Number(e.target.value))}
        className="mt-3 w-full accent-sky-500"
      />
      {controle.marcos && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {controle.marcos.map((marco) => (
            <button
              key={marco.rotulo}
              onClick={() => onMudar(marco.valor)}
              className="text-[11px] text-muted-foreground underline-offset-2 hover:text-sky-700 hover:underline dark:hover:text-sky-400"
            >
              {controle.formatar(marco.valor)} · {marco.rotulo}
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{nota}</p>
    </div>
  )
}
