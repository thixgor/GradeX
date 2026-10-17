'use client'

import { motion } from 'framer-motion'
import { Clock, Mic, Video } from 'lucide-react'
import { horaEmBrasilia } from '@/lib/fuso-brasilia'
import type { DetalheReserva, PresencaNaSala } from '@/components/monitorias/tipos-cliente'

/**
 * A entrada da aula na página da reserva. Antes da janela, mostra quando abre e
 * deixa testar câmera e microfone; durante, um botão grande e quem já está lá.
 * Calculado no navegador: a presença chega de carona no polling da página.
 */
export function CartaoSalaDeAula({ d, presenca }: { d: DetalheReserva; presenca: PresencaNaSala | null }) {
  const sala = d.reserva.sala
  if (!sala?.podeEntrar || !sala.janela) return null
  if (!['confirmada', 'realizada', 'em_disputa'].includes(d.reserva.status)) return null
  const agora = Date.now()
  const abre = new Date(sala.janela.abreEm).getTime()
  const fecha = new Date(sala.janela.fechaEm).getTime()
  if (agora > fecha) return null
  const ehMonitor = d.papel === 'monitor'
  const href = `/monitorias/reservas/${d.reserva.id}/sala`

  if (agora < abre) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Video className="h-4 w-4 text-primary" aria-hidden /> Sala de aula
        </h2>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden /> Abre às {horaEmBrasilia(sala.janela.abreEm)} ({ehMonitor ? '30' : '15'} min antes), direto aqui na DomineAqui.
        </p>
        <a href={href} className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted">
          <Mic className="h-4 w-4 text-primary" aria-hidden /> Testar câmera e microfone
        </a>
      </div>
    )
  }

  const outro = ehMonitor ? (presenca?.presentes ? (presenca.presentes > 1 ? `${presenca.presentes} alunos estão na sala` : 'O aluno já está na sala') : 'Nenhum aluno na sala ainda') : presenca?.monitorPresente ? 'O monitor já está na sala' : 'O monitor ainda não entrou'
  const alguem = ehMonitor ? !!presenca?.presentes : !!presenca?.monitorPresente
  return (
    <a href={href}>
      <motion.div whileHover={{ y: -2 }} className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-[0_12px_30px_-14px_hsl(var(--primary)/0.7)]">
        <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
          <Video className="h-5 w-5" aria-hidden />
          {alguem && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-primary-foreground ring-2 ring-primary" aria-hidden />}
        </span>
        <div className="min-w-0">
          <p className="font-semibold">Entrar na sala de aula</p>
          <p className="text-xs text-primary-foreground/85">{outro}. Sem instalar nada.</p>
        </div>
      </motion.div>
    </a>
  )
}
