'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Clock, DoorOpen, Laptop, LogIn, MonitorX, ShieldAlert, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ControladorDaSala, EstadoDaSalaNaTela } from '@/lib/monitorias/sala/cliente/controlador'
import { MarcaClara } from './marca'

/** Moldura das telas claras da sala: marca no topo, cartão centralizado e animado. */
function TelaClara({ icone: Icone, children }: { icone: typeof DoorOpen; children: React.ReactNode }) {
  const reduzir = useReducedMotion()
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background bg-[radial-gradient(50rem_26rem_at_50%_-10%,hsl(var(--primary)/0.10),transparent)] text-foreground">
      <header className="mx-auto flex w-full max-w-6xl justify-center px-4 py-5 sm:justify-start">
        <MarcaClara />
      </header>
      <main className="grid flex-1 place-items-center px-4 pb-12">
        <motion.div
          initial={reduzir ? false : { opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-xl shadow-black/5 sm:p-8"
        >
          <motion.span
            initial={reduzir ? false : { scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 14,
              delay: 0.15,
            }}
            className="relative mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            {!reduzir && <span className="absolute inset-0 animate-ping rounded-2xl bg-primary/10 [animation-iteration-count:2]" aria-hidden />}
            <Icone className="relative h-7 w-7" aria-hidden />
          </motion.span>
          {children}
        </motion.div>
      </main>
    </div>
  )
}

const TITULOS: Record<NonNullable<EstadoDaSalaNaTela['saida']>['motivo'], { titulo: string; icone: typeof DoorOpen }> = {
  voce: { titulo: 'Você saiu da aula', icone: DoorOpen },
  encerrada: { titulo: 'A aula foi encerrada', icone: CheckCircle2 },
  fechada: { titulo: 'O horário da aula terminou', icone: Clock },
  substituida: { titulo: 'A aula continua em outra janela', icone: Laptop },
  negado: { titulo: 'Não foi possível entrar', icone: ShieldAlert },
  sessao: { titulo: 'Sua sessão expirou', icone: LogIn },
  conexao: { titulo: 'A conexão caiu', icone: WifiOff },
  removida: {
    titulo: 'Você saiu da sala por decisão do monitor',
    icone: ShieldAlert,
  },
}

/** Depois da saída: o que aconteceu e o próximo passo, sem termos técnicos. A câmera já está desligada. */
export function ForaDaSala({ ctrl, estado, reservaId, ehAluno }: { ctrl: ControladorDaSala; estado: EstadoDaSalaNaTela; reservaId: string; ehAluno: boolean }) {
  const saida = estado.saida || { motivo: 'voce' as const, mensagem: '' }
  const { titulo, icone: Icone } = TITULOS[saida.motivo]
  const podeVoltar = saida.motivo === 'voce' || saida.motivo === 'substituida' || saida.motivo === 'conexao'
  return (
    <TelaClara icone={Icone}>
      <h1 className="mt-4 font-heading text-2xl font-semibold">{titulo}</h1>
      {saida.mensagem && saida.mensagem !== titulo && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{saida.mensagem}</p>}
      <p className="mt-2 text-xs text-muted-foreground">Câmera e microfone foram desligados.</p>
      <div className="mt-6 flex flex-col gap-2">
        {podeVoltar && (
          <Button className="h-11 rounded-xl font-semibold" onClick={() => void ctrl.voltar()}>
            {saida.motivo === 'substituida' ? 'Usar esta janela' : 'Voltar para a aula'}
          </Button>
        )}
        {saida.motivo === 'sessao' ? (
          <Link href={`/auth/login?redirect=${encodeURIComponent(`/monitorias/reservas/${reservaId}/sala`)}`}>
            <Button className="h-11 w-full rounded-xl font-semibold">Entrar na conta</Button>
          </Link>
        ) : (
          <Link href={`/monitorias/reservas/${reservaId}`}>
            <Button variant={podeVoltar ? 'outline' : 'default'} className="h-11 w-full rounded-xl font-semibold">
              {ehAluno && (saida.motivo === 'encerrada' || saida.motivo === 'fechada') ? 'Ir para a reserva (avaliar a aula)' : 'Ir para a reserva'}
            </Button>
          </Link>
        )}
        {podeVoltar && (
          <button type="button" onClick={() => void ctrl.voltarAoSaguao()} className="mt-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Ajustar câmera e microfone antes de voltar
          </button>
        )}
      </div>
    </TelaClara>
  )
}

const SEM_SUPORTE = {
  inseguro: 'A sala só funciona em conexão segura (https). Abra o endereço oficial da DomineAqui.',
  webrtc: 'Este navegador não tem os recursos de vídeo de que a sala precisa. Abra no Chrome, Edge, Firefox ou Safari atualizados.',
  midia: 'Este navegador não deixa sites usarem câmera e microfone. Se você abriu o link pelo Instagram, WhatsApp ou outro app, abra no navegador do aparelho.',
} as const

export function SemSuporte({ motivo, reservaId }: { motivo: keyof typeof SEM_SUPORTE; reservaId: string }) {
  return (
    <TelaClara icone={MonitorX}>
      <h1 className="mt-4 font-heading text-2xl font-semibold">Abra em outro navegador</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{SEM_SUPORTE[motivo]}</p>
      <div className="mt-6 flex flex-col gap-2">
        <Button
          className="h-11 rounded-xl font-semibold"
          onClick={() => {
            const url = window.location.href
            navigator.clipboard?.writeText(url).catch(() => window.prompt('Copie o endereço da sala:', url))
          }}
        >
          Copiar o endereço da sala
        </Button>
        <Link href={`/monitorias/reservas/${reservaId}`}>
          <Button variant="outline" className="h-11 w-full rounded-xl">
            Ir para a reserva
          </Button>
        </Link>
      </div>
    </TelaClara>
  )
}
