'use client'

/**
 * "Próximo passo": o que cada pessoa precisa fazer AGORA nesta monitoria, no
 * topo da página e sempre visível. Antes, a proposta ficava no pé do chat, o
 * contrato no fim da coluna lateral e o pagamento num cartão no meio — quem
 * chegava não achava. Aqui uma ação por vez, grande, com o resto como contexto.
 */

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CalendarCheck, CheckCircle2, Clock, CreditCard, FileSignature, HeartHandshake, Hourglass, Loader2, PartyPopper, Send, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Confete } from '@/components/monitorias/base'
import { AssinaturaContrato } from '@/components/monitorias/assinatura-contrato'
import { CartaoSalaDeAula } from '@/components/monitorias/sala/cartao-sala-de-aula'
import type { DetalheReserva, PresencaNaSala } from '@/components/monitorias/tipos-cliente'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { formatarDuracao } from '@/lib/monitorias/agenda'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { cn } from '@/lib/utils'

function Chip({ icone: Icone, children }: { icone: typeof Clock; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl bg-background/80 px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-border">
      <Icone className="h-4 w-4 text-primary" aria-hidden /> {children}
    </span>
  )
}

function Pontinhos() {
  const reduzir = useReducedMotion()
  return (
    <span className="ml-1 inline-flex gap-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-current"
          animate={reduzir ? undefined : { opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  )
}

function Casca({ tom = 'primario', icone: Icone, titulo, texto, children, celebrar }: { tom?: 'primario' | 'alerta' | 'calmo'; icone: typeof Clock; titulo: React.ReactNode; texto?: React.ReactNode; children?: React.ReactNode; celebrar?: boolean }) {
  const reduzir = useReducedMotion()
  return (
    <motion.section
      id="proximo-passo"
      layout
      initial={reduzir ? false : { opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className={cn(
        'relative mb-6 overflow-hidden rounded-3xl border p-5 sm:p-6',
        tom === 'alerta'
          ? 'border-amber-300/70 bg-gradient-to-br from-amber-50 to-card dark:border-amber-400/30 dark:from-amber-500/10'
          : tom === 'calmo'
            ? 'border-border bg-card'
            : 'border-primary/40 bg-gradient-to-br from-primary/[0.10] via-card to-card shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.6)]',
      )}
      aria-live="polite"
    >
      {celebrar && <Confete />}
      <div className="flex items-start gap-3">
        <motion.span
          initial={reduzir ? false : { scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
          className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', tom === 'alerta' ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300' : 'bg-primary/15 text-primary')}
        >
          <Icone className="h-5 w-5" aria-hidden />
        </motion.span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Próximo passo</p>
          <h2 className="font-heading text-lg font-semibold leading-snug sm:text-xl">{titulo}</h2>
          {texto && <p className="mt-0.5 text-sm text-muted-foreground">{texto}</p>}
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </motion.section>
  )
}

export function ProximoPasso({
  d,
  presenca,
  onAceitar,
  onPropor,
  onAtualizar,
}: {
  d: DetalheReserva
  presenca: PresencaNaSala | null
  onAceitar: (propostaId: string) => Promise<unknown>
  onPropor: () => void
  onAtualizar: () => void
}) {
  const [aceitando, setAceitando] = useState(false)
  const [erro, setErro] = useState('')
  const [celebrar, setCelebrar] = useState<string | null>(null)
  const r = d.reserva
  const p = r.proposta
  const ehMonitor = d.papel === 'monitor'
  const outro = ehMonitor ? 'o aluno' : 'o monitor'
  const assento = d.meuAssento
  if (d.somenteLeitura) return null

  function festa(motivo: string) {
    setCelebrar(motivo)
    setTimeout(() => setCelebrar(null), 2600)
  }

  const detalhes = p && (
    <div className="flex flex-wrap gap-2">
      <Chip icone={CalendarCheck}>{formatarEmBrasilia(p.inicio, { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Chip>
      <Chip icone={Clock}>{formatarDuracao(p.duracaoMin)}</Chip>
      <Chip icone={CreditCard}>{p.gratis ? 'Grátis' : `${formatarCentavos(p.valorPorPessoaCentavos)}${p.vagas > 1 ? '/pessoa' : ''}`}</Chip>
      {p.vagas > 1 && <Chip icone={Users}>{p.vagas} alunos</Chip>}
    </div>
  )

  // 1. Proposta esperando a MINHA resposta.
  const propostaParaMim = r.status === 'em_negociacao' && p && (ehMonitor ? !r.aceites.tutor : !r.aceites.aluno) && d.papel !== 'membro'
  if (propostaParaMim && p) {
    return (
      <Casca icone={HeartHandshake} tom="alerta" titulo={`${ehMonitor ? 'O aluno' : 'O monitor'} enviou uma proposta`} texto="Confira e responda: aceitando, vocês seguem para o contrato e o pagamento." celebrar={!!celebrar}>
        {detalhes}
        {p.observacao && <p className="mt-3 rounded-xl bg-background/70 p-3 text-sm italic">“{p.observacao}”</p>}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <motion.div whileTap={{ scale: 0.97 }} className="sm:flex-1">
            <Button
              size="lg"
              className="h-12 w-full rounded-xl text-base font-semibold shadow-[0_12px_28px_-14px_hsl(var(--primary)/0.9)]"
              disabled={aceitando}
              onClick={async () => {
                setAceitando(true)
                setErro('')
                try {
                  await onAceitar(p.id)
                  festa('aceita')
                } catch (e) {
                  setErro(e instanceof Error ? e.message : 'Não deu para aceitar agora.')
                } finally {
                  setAceitando(false)
                }
              }}
            >
              {aceitando ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />} Aceitar proposta
            </Button>
          </motion.div>
          <Button variant="outline" size="lg" className="h-12 rounded-xl" onClick={onPropor}>
            <Send className="mr-2 h-4 w-4" /> Fazer contraproposta
          </Button>
        </div>
        {erro && <p className="mt-2 text-sm text-rose-600">{erro}</p>}
      </Casca>
    )
  }

  // 2. Eu já aceitei; falta o outro lado.
  if (r.status === 'em_negociacao' && p) {
    return (
      <Casca celebrar={!!celebrar} icone={Hourglass} tom="calmo" titulo={<>Aguardando {outro} aceitar<Pontinhos /></>} texto="Você recebe um aviso assim que houver resposta. Se quiser mudar algo, faça uma nova proposta.">
        {detalhes}
      </Casca>
    )
  }

  // 3. Sem proposta ainda.
  if ((r.status === 'solicitada' || r.status === 'em_negociacao') && !p) {
    if (ehMonitor || r.negociavel) {
      return (
        <Casca celebrar={!!celebrar} icone={Send} titulo={ehMonitor ? 'Responda com uma proposta' : 'Combine com o monitor'} texto={ehMonitor ? 'Escolha dia, horário, duração e valor. O aluno aceita com um toque.' : 'Converse no chat ou envie uma proposta de dia, horário e valor.'}>
          <Button size="lg" className="h-12 rounded-xl font-semibold" onClick={onPropor}>
            <HeartHandshake className="mr-2 h-5 w-5" /> {ehMonitor ? 'Fazer proposta' : 'Enviar proposta'}
          </Button>
        </Casca>
      )
    }
    return <Casca celebrar={!!celebrar} icone={Hourglass} tom="calmo" titulo={<>Pedido enviado. Aguardando o monitor<Pontinhos /></>} texto="Você recebe um aviso quando ele responder." />
  }

  // 4. Contrato e pagamento.
  if (!ehMonitor && assento && ['aguardando_assinatura', 'aguardando_pagamento'].includes(assento.status) && ['aguardando_assinaturas', 'aguardando_pagamento'].includes(r.status)) {
    const assinar = assento.status === 'aguardando_assinatura'
    return (
      <Casca celebrar={!!celebrar} icone={assinar ? FileSignature : CreditCard} titulo={assinar ? 'Assine o contrato para garantir a aula' : 'Falta só o pagamento'} texto={assinar ? 'Leva 1 minuto: leia até o fim, marque que concorda e confirme com o código do seu e-mail.' : 'PIX com confirmação na hora. Seu comprovante fica aqui.'}>
        {detalhes}
        <Link href={`/monitorias/checkout/${r.id}`} className="mt-4 block">
          <motion.span whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="block">
            <Button size="lg" className="h-12 w-full rounded-xl text-base font-semibold sm:w-auto sm:px-8">
              {assinar ? <FileSignature className="mr-2 h-5 w-5" /> : <CreditCard className="mr-2 h-5 w-5" />}
              {assinar ? 'Assinar o contrato agora' : 'Pagar agora'}
            </Button>
          </motion.span>
        </Link>
        {r.prazoPagamento && <p className="mt-2 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300"><Clock className="h-3.5 w-3.5" /> Prazo: {formatarEmBrasilia(r.prazoPagamento, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>}
      </Casca>
    )
  }
  if (ehMonitor && d.contratosParaAssinar.length > 0) {
    return (
      <Casca icone={FileSignature} titulo="Assine o contrato para liberar o pagamento do aluno" texto="O aluno só consegue pagar depois da sua assinatura. Leia até o fim, marque que concorda e confirme com o código do seu e-mail." celebrar={!!celebrar}>
        <div className="rounded-2xl border border-border bg-card p-4">
          {d.contratosParaAssinar.map((k) => (
            <AssinaturaContrato
              key={k.id}
              contratoId={k.id}
              onAssinado={() => {
                festa('contrato')
                setTimeout(onAtualizar, 1200)
              }}
            />
          ))}
        </div>
      </Casca>
    )
  }
  if (r.status === 'aguardando_assinaturas' || r.status === 'aguardando_pagamento') {
    return (
      <Casca
        celebrar={!!celebrar}
        icone={Hourglass}
        tom="calmo"
        titulo={<>{ehMonitor ? (r.status === 'aguardando_assinaturas' ? 'Aguardando o aluno assinar' : 'Aguardando o pagamento do aluno') : 'Aguardando o monitor assinar'}<Pontinhos /></>}
        texto="Você recebe um aviso assim que andar."
      >
        {detalhes}
      </Casca>
    )
  }

  // 5. Aula confirmada: a sala (quando abre) ou a data.
  if (r.status === 'confirmada' || r.status === 'realizada') {
    const salaAberta = r.sala?.podeEntrar && r.sala.janela && Date.now() >= new Date(r.sala.janela.abreEm).getTime() && Date.now() <= new Date(r.sala.janela.fechaEm).getTime()
    if (salaAberta) {
      return (
        <Casca celebrar={!!celebrar} icone={PartyPopper} titulo="A sala de aula está aberta!" texto="Entre pela plataforma: sem instalar nada.">
          <CartaoSalaDeAula d={d} presenca={presenca} />
        </Casca>
      )
    }
    if (r.status === 'confirmada' && r.inicio) {
      return (
        <Casca celebrar={!!celebrar} icone={PartyPopper} titulo="Aula confirmada!" texto="A sala de aula abre aqui mesmo, um pouco antes do horário. Você recebe um lembrete.">
          {detalhes}
          <AnimatePresence>{r.sala?.podeEntrar && <div className="mt-3"><CartaoSalaDeAula d={d} presenca={presenca} /></div>}</AnimatePresence>
        </Casca>
      )
    }
  }
  return null
}
