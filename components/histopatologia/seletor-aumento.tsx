'use client'

import { AUMENTOS, type IdDeAumento } from './tema'

/**
 * Seletor de aumento.
 *
 * A ordem dos botões é a ordem real do microscópio, e ela não é negociável: a
 * panorâmica vem primeiro porque estabelecer arquitetura antes de olhar célula é
 * o hábito que a página inteira tenta ensinar. O componente não impede pular ao
 * grande aumento — impedir seria condescendente —, mas nunca o oferece primeiro.
 *
 * O estado ativo é marcado por três coisas ao mesmo tempo: `aria-pressed`, um
 * símbolo textual e a cor. Cor sozinha excluiria parte dos leitores, e
 * `aria-pressed` sozinho não ajuda quem enxerga sem distinguir matizes.
 */
export function SeletorDeAumento({
  valor,
  aoTrocar,
  idDoPainel,
}: {
  valor: IdDeAumento
  aoTrocar: (id: IdDeAumento) => void
  idDoPainel: string
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Nível de aumento">
      {AUMENTOS.map((aumento) => {
        const ativo = aumento.id === valor
        return (
          <button
            key={aumento.id}
            type="button"
            aria-pressed={ativo}
            aria-controls={idDoPainel}
            onClick={() => aoTrocar(aumento.id)}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-md border px-3 text-xs font-bold transition-colors ${
              ativo
                ? 'border-teal-600/60 bg-teal-500/10 text-teal-800 dark:text-teal-300'
                : 'border-border bg-card text-muted-foreground hover:border-teal-600/40'
            }`}
          >
            <span aria-hidden>{ativo ? '●' : '○'}</span>
            <span>
              {aumento.rotulo}
              <span className="ml-1 font-normal opacity-70">{aumento.objetivo}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
