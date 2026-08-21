'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ChevronDown, MoreHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A barra de topo de quem está resolvendo uma questão.
 *
 * ## Por que ela existe
 *
 * A tela de resolução abria com quatro faixas empilhadas antes do enunciado:
 * o cabeçalho do app (menu, carrinho, sino, tema, modo lite), a linha "Sair +
 * baixar PDF + PDF com gabarito", a barra de progresso com legenda e, dentro
 * do cartão, cinco etiquetas de classificação e o "Relatar erro". Nada disso é
 * usado ENQUANTO se responde — e tudo isso disputava a atenção com a única
 * coisa que importa ali, que é o enunciado.
 *
 * Aqui sobra o que serve durante a resolução: sair, onde estou, quanto falta.
 * O resto continua a um toque, no painel de detalhes — presente, mas fechado
 * (é o que a pessoa que testou pediu: "não necessariamente precisa estar
 * aberta no momento do quiz").
 *
 * ## O progresso é uma barra, não um texto
 *
 * "Questão 3 de 12" obriga a ler e comparar dois números; a barra é lida com o
 * canto do olho. O número fica ao lado para quem quer a precisão — pequeno,
 * tabular, sem legenda.
 */
export function CabecalhoQuiz({
  aoSair,
  rotuloSair = 'Sair',
  iconeSair = 'x',
  progresso,
  detalhes,
  rotuloDetalhes = 'Detalhes da questão',
  className,
}: {
  aoSair: () => void
  rotuloSair?: string
  iconeSair?: 'x' | 'seta'
  progresso?: { atual: number; total: number }
  /** Conteúdo do painel que abre no "⋯" — etiquetas, PDF, relatar erro. */
  detalhes?: React.ReactNode
  rotuloDetalhes?: string
  className?: string
}) {
  const [aberto, setAberto] = useState(false)
  const IconeSair = iconeSair === 'seta' ? ArrowLeft : X

  const percentual = progresso
    ? Math.min(100, Math.max(0, ((progresso.atual + 1) / Math.max(1, progresso.total)) * 100))
    : 0

  return (
    <div
      className={cn(
        // z-40 fica acima do conteúdo e abaixo da barra do rodapé (z-45) e da
        // gaveta do menu (z-50).
        'pwa-safe-top sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl',
        className,
      )}
    >
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={aoSair}
          aria-label={rotuloSair}
          className="-ml-1 flex h-10 w-10 flex-none items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-90"
        >
          <IconeSair className="h-5 w-5" />
        </button>

        {progresso ? (
          <>
            <div
              className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progresso.total}
              aria-valuenow={progresso.atual + 1}
              aria-label={`Questão ${progresso.atual + 1} de ${progresso.total}`}
            >
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${percentual}%` }}
                transition={{ type: 'spring', stiffness: 220, damping: 30 }}
              />
            </div>
            <span className="flex-none text-xs font-bold tabular-nums text-muted-foreground">
              {progresso.atual + 1}/{progresso.total}
            </span>
          </>
        ) : (
          <div className="min-w-0 flex-1" />
        )}

        {detalhes ? (
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-label={rotuloDetalhes}
            className={cn(
              '-mr-1 flex h-10 w-10 flex-none items-center justify-center rounded-full transition active:scale-90',
              aberto
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {aberto ? <ChevronDown className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {aberto && detalhes ? (
          <motion.div
            key="detalhes"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34, opacity: { duration: 0.15 } }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="mx-auto max-w-4xl space-y-3 px-3 py-3 sm:px-4">{detalhes}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
