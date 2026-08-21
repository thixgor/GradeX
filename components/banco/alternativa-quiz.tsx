'use client'

import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Uma alternativa de questão objetiva.
 *
 * Existe como componente único porque as duas telas de resolução — a questão
 * avulsa e a lista em sequência — desenhavam a mesma alternativa com regras
 * diferentes: alvo de toque de 44px numa e de 56px na outra, verde-500 numa e
 * verde-100 na outra, o "riscar" com raio diferente. Quem responde não sabe
 * que são duas telas; percebe só que a segunda parece outro produto.
 *
 * ## Estados
 *
 * - **livre**: cartão neutro, pronto para o toque.
 * - **marcada** (antes de conferir): borda e fundo da cor primária. É a única
 *   coisa colorida da tela nesse momento — a resposta escolhida não pode
 *   depender de olhar com atenção.
 * - **riscada**: texto cortado e esmaecido, sem sumir. É raciocínio de prova:
 *   eliminar é uma decisão, e ela precisa continuar visível.
 * - **conferida**: verde na correta, vermelho na marcada errada. A errada
 *   ainda dá um tranco lateral curto — o corpo entende antes da leitura.
 *
 * O alvo de toque nunca é menor que 56px de altura, e o "riscar" ganhou 36px
 * próprios com o toque afastado da borda do texto, para não riscar sem querer
 * ao tentar marcar.
 */
export function AlternativaQuiz({
  letra,
  texto,
  marcada,
  riscada,
  conferida,
  correta,
  aoMarcar,
  aoRiscar,
}: {
  letra: string
  texto: string
  marcada: boolean
  riscada: boolean
  /** `true` depois de "Ver resposta": o gabarito já está na tela. */
  conferida: boolean
  correta: boolean
  aoMarcar: () => void
  aoRiscar: () => void
}) {
  const acertouEsta = conferida && correta
  const errouEsta = conferida && marcada && !correta

  return (
    <motion.div
      animate={errouEsta ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: errouEsta ? 0.42 : 0.2, ease: 'easeOut' }}
      className={cn(
        'relative flex min-h-[3.5rem] w-full items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-colors',
        !conferida && !riscada && 'cursor-pointer border-border bg-card hover:border-primary/50',
        !conferida && marcada && 'border-primary bg-primary/10',
        !conferida && riscada && 'border-dashed border-border/70 bg-muted/40',
        conferida && !acertouEsta && !errouEsta && 'border-border bg-card opacity-70',
        acertouEsta && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
        errouEsta && 'border-red-500 bg-red-50 dark:bg-red-950/40',
      )}
      onClick={() => {
        if (conferida || riscada) return
        aoMarcar()
      }}
      // O cartão inteiro é o alvo, então ele precisa existir para o teclado
      // também — antes só o mouse conseguia marcar uma alternativa.
      onKeyDown={(e) => {
        if (conferida || riscada) return
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        aoMarcar()
      }}
      tabIndex={conferida || riscada ? undefined : 0}
      role={conferida ? undefined : 'button'}
      aria-pressed={conferida ? undefined : marcada}
      aria-label={`Alternativa ${letra}`}
    >
      <span
        className={cn(
          'flex h-9 w-9 flex-none items-center justify-center rounded-xl text-sm font-bold transition-colors',
          !conferida && marcada && 'bg-primary text-primary-foreground',
          !conferida && !marcada && 'bg-muted text-muted-foreground',
          conferida && !acertouEsta && !errouEsta && 'bg-muted text-muted-foreground',
          acertouEsta && 'bg-emerald-500 text-white',
          errouEsta && 'bg-red-500 text-white',
        )}
      >
        {acertouEsta ? (
          <Check className="h-5 w-5" strokeWidth={3} />
        ) : errouEsta ? (
          <X className="h-5 w-5" strokeWidth={3} />
        ) : (
          letra
        )}
      </span>

      <span
        className={cn(
          'min-w-0 flex-1 whitespace-pre-line text-[15px] leading-snug',
          riscada && !conferida && 'text-muted-foreground line-through',
        )}
      >
        {texto}
      </span>

      {!conferida ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            aoRiscar()
          }}
          aria-label={riscada ? `Desriscar alternativa ${letra}` : `Riscar alternativa ${letra}`}
          aria-pressed={riscada}
          className={cn(
            'flex h-9 w-9 flex-none items-center justify-center rounded-xl transition active:scale-90',
            riscada
              ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300'
              : 'text-muted-foreground/50 hover:bg-muted hover:text-foreground',
          )}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </motion.div>
  )
}
