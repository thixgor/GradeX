'use client'

import { forwardRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { VISUAL_DO_VEREDITO, type VereditoDaQuestao } from '@/lib/banco/aparencia-da-questao'
import { cn } from '@/lib/utils'

// Reexportado para as telas que já importavam o tipo daqui não precisarem
// mudar de endereço só porque a aparência mudou de arquivo.
export type { VereditoDaQuestao }

/**
 * O veredito e o caminho até o motivo dele.
 *
 * ## O problema que isto resolve
 *
 * Ao conferir a resposta, a única coisa que mudava perto do polegar era o
 * botão virar "Próxima". O veredito e a explicação nasciam DEPOIS das
 * alternativas — no celular, fora da tela. O relato de quem testou foi
 * literal: "não tem algo me falando o que eu errei sem eu mexer para baixo, o
 * usuário pode clicar em seguir sem saber o motivo".
 *
 * Duas coisas consertam isso, e elas são diferentes:
 *
 * 1. **Saber o resultado** é imediato e cabe em uma linha — vem aqui, colado
 *    no botão que a pessoa já ia tocar. Ninguém mais avança sem saber que
 *    errou.
 * 2. **Entender o motivo** é leitura longa e não cabe num painel de rodapé —
 *    fica onde sempre esteve, no corpo da página, mas agora anunciado por um
 *    convite explícito ("Ver por que") que ROLA até lá com animação, em vez de
 *    esperar que a pessoa adivinhe que há conteúdo abaixo.
 *
 * A faixa inteira é o alvo de toque, não só o texto do link: 100% da largura
 * na faixa mais confortável da tela.
 */
export function FolhaDeFeedback({
  veredito,
  letraCorreta,
  temExplicacao,
  aoVerExplicacao,
  children,
}: {
  /** `null` enquanto a resposta ainda não foi conferida. */
  veredito: VereditoDaQuestao | null
  letraCorreta?: string | null
  temExplicacao: boolean
  aoVerExplicacao: () => void
  /** Os botões de ação (voltar, mapa, próxima). */
  children: React.ReactNode
}) {
  return (
    <div className="w-full">
      <AnimatePresence initial={false}>
        {veredito ? (
          <motion.div
            key={veredito}
            initial={{ opacity: 0, y: 18, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 12, height: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="overflow-hidden"
          >
            <FaixaDeVeredito
              veredito={veredito}
              letraCorreta={letraCorreta}
              temExplicacao={temExplicacao}
              aoVerExplicacao={aoVerExplicacao}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center gap-2 pt-2">{children}</div>
    </div>
  )
}

function FaixaDeVeredito({
  veredito,
  letraCorreta,
  temExplicacao,
  aoVerExplicacao,
}: {
  veredito: VereditoDaQuestao
  letraCorreta?: string | null
  temExplicacao: boolean
  aoVerExplicacao: () => void
}) {
  const visual = VISUAL_DO_VEREDITO[veredito]
  const Icone = visual.icone

  const corpo = (
    <div className="flex w-full items-center gap-3">
      <motion.span
        initial={{ scale: 0.5, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 480, damping: 18, delay: 0.05 }}
        className={cn('flex h-9 w-9 flex-none items-center justify-center rounded-full', visual.bolha)}
      >
        <Icone className="h-5 w-5 text-white" strokeWidth={2.5} />
      </motion.span>

      <span className="min-w-0 flex-1 text-left">
        <span className={cn('block text-sm font-bold leading-tight', visual.titulo)}>
          {visual.rotulo}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {/* Saber QUAL era a certa é a informação mais urgente de um erro —
              ela vem antes de qualquer convite a ler. */}
          {veredito === 'errou' && letraCorreta
            ? `A certa era a ${letraCorreta}`
            : temExplicacao
              ? visual.convite
              : visual.apoio}
        </span>
      </span>

      {temExplicacao ? (
        <span
          className={cn(
            'flex flex-none items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold',
            visual.acao,
          )}
        >
          {visual.rotuloAcao}
          <motion.span
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </motion.span>
        </span>
      ) : null}
    </div>
  )

  const classes = cn('flex w-full items-center rounded-2xl border px-3 py-2.5', visual.faixa)

  if (!temExplicacao) return <div className={classes}>{corpo}</div>

  return (
    <button
      type="button"
      onClick={aoVerExplicacao}
      className={cn(classes, 'transition active:scale-[0.99]')}
    >
      {corpo}
    </button>
  )
}

/**
 * O bloco de correção no corpo da página — destino da rolagem guiada.
 *
 * Ele acende por um instante ao ser alcançado. Sem isso, a rolagem termina e a
 * pessoa precisa procurar o que mudou: o anel diz "é aqui" sem escrever
 * nenhuma palavra a mais, e apaga sozinho para não virar decoração fixa.
 */
export const PainelDaExplicacao = forwardRef<
  HTMLDivElement,
  {
    veredito: VereditoDaQuestao | null
    letraCorreta?: string | null
    destacado?: boolean
    children: React.ReactNode
  }
>(function PainelDaExplicacao({ veredito, letraCorreta, destacado = false, children }, ref) {
  const visual = veredito ? VISUAL_DO_VEREDITO[veredito] : null
  const Icone = visual?.icone

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className={cn(
        'scroll-mt-24 rounded-2xl border bg-card p-4 transition-shadow duration-500 sm:p-5',
        destacado ? 'border-primary/60 shadow-[0_0_0_4px_hsl(var(--primary)/0.16)]' : 'border-border',
      )}
    >
      {visual && Icone ? (
        <div className="flex items-center gap-2.5 pb-3">
          <span className={cn('flex h-8 w-8 flex-none items-center justify-center rounded-full', visual.bolha)}>
            <Icone className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <p className={cn('text-sm font-bold leading-tight', visual.titulo)}>{visual.rotulo}</p>
            {veredito === 'errou' && letraCorreta ? (
              <p className="text-xs text-muted-foreground">A resposta correta era a {letraCorreta}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-4">{children}</div>
    </motion.div>
  )
})

/**
 * Um trecho da correção (explicação, resposta modelo, fonte).
 *
 * As três apareciam em caixas de cores diferentes — âmbar, azul, cinza — sem
 * que a cor significasse nada: eram só três textos para ler em sequência. Aqui
 * o que separa é o título, e a leitura corre sem semáforo.
 */
export function TrechoDaCorrecao({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h4 className="pb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </h4>
      <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{children}</div>
    </section>
  )
}
