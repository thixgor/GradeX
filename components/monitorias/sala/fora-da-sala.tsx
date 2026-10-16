'use client'

import Link from 'next/link'
import { CheckCircle2, Clock, DoorOpen, Laptop, LogIn, MonitorX, ShieldAlert, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ControladorDaSala, EstadoDaSalaNaTela } from '@/lib/monitorias/sala/cliente/controlador'

const TITULOS: Record<NonNullable<EstadoDaSalaNaTela['saida']>['motivo'], { titulo: string; icone: typeof DoorOpen }> = {
  voce: { titulo: 'Você saiu da aula', icone: DoorOpen },
  encerrada: { titulo: 'A aula foi encerrada', icone: CheckCircle2 },
  fechada: { titulo: 'O horário da aula terminou', icone: Clock },
  substituida: { titulo: 'A aula continua em outra janela', icone: Laptop },
  negado: { titulo: 'Não foi possível entrar', icone: ShieldAlert },
  sessao: { titulo: 'Sua sessão expirou', icone: LogIn },
  conexao: { titulo: 'A conexão caiu', icone: WifiOff },
}

/** Depois da saída: o que aconteceu e o próximo passo, sem termos técnicos. A câmera já está desligada. */
export function ForaDaSala({ ctrl, estado, reservaId, ehAluno }: { ctrl: ControladorDaSala; estado: EstadoDaSalaNaTela; reservaId: string; ehAluno: boolean }) {
  const saida = estado.saida || { motivo: 'voce' as const, mensagem: '' }
  const { titulo, icone: Icone } = TITULOS[saida.motivo]
  const podeVoltar = saida.motivo === 'voce' || saida.motivo === 'substituida' || saida.motivo === 'conexao'
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icone className="h-6 w-6" aria-hidden />
        </span>
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
      </div>
    </div>
  )
}

const SEM_SUPORTE = {
  inseguro: 'A sala só funciona em conexão segura (https). Abra o endereço oficial da DomineAqui.',
  webrtc: 'Este navegador não tem os recursos de vídeo de que a sala precisa. Abra no Chrome, Edge, Firefox ou Safari atualizados.',
  midia: 'Este navegador não deixa sites usarem câmera e microfone. Se você abriu o link pelo Instagram, WhatsApp ou outro app, abra no navegador do aparelho.',
} as const

export function SemSuporte({ motivo, reservaId }: { motivo: keyof typeof SEM_SUPORTE; reservaId: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MonitorX className="h-6 w-6" aria-hidden />
        </span>
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
      </div>
    </div>
  )
}
