'use client'

import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { classesDaAlternativa } from '@/lib/banco/aparencia-da-questao'

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
 * As classes de cada estado moram em `lib/banco/aparencia-da-questao.ts`, e
 * não aqui: a demonstração da landing desenha a mesma alternativa sem poder
 * importar este arquivo (ele traz `framer-motion` junto, e a landing é a
 * página onde JavaScript a mais custa a primeira pintura). Com a aparência
 * fora, as duas nunca divergem — o que sobra aqui é o COMPORTAMENTO: marcar,
 * riscar, teclado, e a tremida curta do erro, que o corpo entende antes da
 * leitura.
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
  const classes = classesDaAlternativa({ marcada, riscada, conferida, correta })

  return (
    <motion.div
      animate={errouEsta ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: errouEsta ? 0.42 : 0.2, ease: 'easeOut' }}
      className={classes.cartao}
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
      <span className={classes.selo}>
        {acertouEsta ? (
          <Check className="h-5 w-5" strokeWidth={3} />
        ) : errouEsta ? (
          <X className="h-5 w-5" strokeWidth={3} />
        ) : (
          letra
        )}
      </span>

      <span className={classes.texto}>{texto}</span>

      {!conferida ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            aoRiscar()
          }}
          aria-label={riscada ? `Desriscar alternativa ${letra}` : `Riscar alternativa ${letra}`}
          aria-pressed={riscada}
          className={classes.botaoRiscar}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </motion.div>
  )
}
