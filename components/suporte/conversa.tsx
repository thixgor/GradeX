'use client'

import { useEffect, useRef } from 'react'
import { ArrowUp, CheckCheck, Loader2 } from 'lucide-react'
import '@/components/checkout/checkout-vidro.css'
import './suporte.css'

/**
 * A conversa de um chamado — a mesma para o balão do app, para a página do
 * visitante e (no futuro) para qualquer outra porta do suporte.
 *
 * Recebe as mensagens já no formato de quem está olhando (`voce`, `suporte`,
 * `sistema`): quem chama converte uma vez, e este componente só desenha.
 */

export interface MensagemDaConversa {
  id: string
  autor: 'voce' | 'suporte' | 'sistema'
  nome?: string
  texto: string
  enviadaEm: string | Date
  lidaEm?: string | Date | null
}

const DIA = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' })
const HORA = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

function rotuloDoDia(data: Date): string {
  const hoje = new Date()
  const ontem = new Date(hoje.getTime() - 86_400_000)
  if (data.toDateString() === hoje.toDateString()) return 'Hoje'
  if (data.toDateString() === ontem.toDateString()) return 'Ontem'
  return DIA.format(data)
}

export function Conversa({
  mensagens,
  assinatura = (nome) => `${nome || 'Suporte'} · DomineAqui`,
}: {
  mensagens: MensagemDaConversa[]
  /** Como assinar o outro lado (o admin vê o nome do aluno, sem "DomineAqui"). */
  assinatura?: (nome?: string) => string
}) {
  const fim = useRef<HTMLDivElement>(null)
  const vistas = useRef<Set<string> | null>(null)

  // Na primeira pintura nada "chega": só as mensagens novas depois disso
  // ganham a animação de entrada.
  if (vistas.current === null) vistas.current = new Set(mensagens.map((m) => m.id))
  const novas = new Set(mensagens.filter((m) => !vistas.current!.has(m.id)).map((m) => m.id))

  useEffect(() => {
    mensagens.forEach((m) => vistas.current!.add(m.id))
    fim.current?.scrollIntoView({ block: 'end', behavior: novas.size > 0 ? 'smooth' : 'auto' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensagens.length])

  let diaAnterior = ''
  return (
    <div className="sp-conversa" role="log" aria-live="polite" aria-label="Mensagens do chamado">
      {mensagens.map((m, i) => {
        const data = new Date(m.enviadaEm)
        const dia = data.toDateString()
        const separador = dia !== diaAnterior ? rotuloDoDia(data) : null
        diaAnterior = dia

        if (m.autor === 'sistema') {
          return (
            <div key={m.id} className="contents">
              {separador && <p className="sp-dia">{separador}</p>}
              <p className="sp-sistema">{m.texto}</p>
            </div>
          )
        }

        const anterior = mensagens[i - 1]
        const proxima = mensagens[i + 1]
        const inicio = !anterior || anterior.autor !== m.autor || !!separador
        const fimDoGrupo =
          !proxima || proxima.autor !== m.autor || new Date(proxima.enviadaEm).toDateString() !== dia

        return (
          <div key={m.id} className="contents">
            {separador && <p className="sp-dia">{separador}</p>}
            <div
              className="sp-linha"
              data-lado={m.autor}
              data-inicio={inicio || undefined}
              data-nova={novas.has(m.id) || undefined}
            >
              {inicio && m.autor === 'suporte' && <span className="sp-autor">{assinatura(m.nome)}</span>}
              <div className="sp-balao">{m.texto}</div>
              {fimDoGrupo && (
                <span className="sp-hora">
                  {HORA.format(data)}
                  {m.autor === 'voce' && (
                    <CheckCheck
                      className="h-3.5 w-3.5"
                      style={{ color: m.lidaEm ? 'var(--ck-verde-claro)' : undefined }}
                      aria-label={m.lidaEm ? 'Lida pelo suporte' : 'Enviada'}
                    />
                  )}
                </span>
              )}
            </div>
          </div>
        )
      })}
      <div ref={fim} />
    </div>
  )
}

/** Caixa de resposta: cresce com o texto, Enter envia, Shift+Enter quebra linha. */
export function Compositor({
  valor,
  onMudar,
  onEnviar,
  enviando,
  max,
  placeholder = 'Escreva sua mensagem',
}: {
  valor: string
  onMudar: (v: string) => void
  onEnviar: () => void
  enviando: boolean
  max: number
  placeholder?: string
}) {
  const vazio = !valor.trim()
  return (
    <form
      className="sp-compositor"
      onSubmit={(e) => {
        e.preventDefault()
        if (!vazio && !enviando) onEnviar()
      }}
    >
      <textarea
        value={valor}
        onChange={(e) => onMudar(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            if (!vazio && !enviando) onEnviar()
          }
        }}
        rows={1}
        maxLength={max}
        placeholder={placeholder}
        aria-label="Mensagem"
        enterKeyHint="send"
      />
      <button type="submit" className="sp-enviar" disabled={vazio || enviando} aria-label="Enviar">
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.6} />}
      </button>
    </form>
  )
}
