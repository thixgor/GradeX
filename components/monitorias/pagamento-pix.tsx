'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, Loader2, QrCode, ShieldCheck, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { api, CaixaErro } from './base'

interface Checkout {
  orderId: string
  status: string
  pix: { qrCode: string; qrCodeBase64: string; ticketUrl?: string } | null
  valorCentavos: number
  taxaCentavos: number
  totalCentavos: number
  taxaRotulo: string
  expiraEm: string
}

function restante(ate: string) {
  const ms = Math.max(0, new Date(ate).getTime() - Date.now())
  const m = Math.floor(ms / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  return { ms, texto: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` }
}

/**
 * Gera o PIX do assento e acompanha a aprovação. O acompanhamento usa a rota
 * de status de pagamentos existente e SÓ roda com a aba visível.
 */
export function PagamentoPix({ reservaId, onAprovado }: { reservaId: string; onAprovado: () => void }) {
  const [dados, setDados] = useState<Checkout | null>(null)
  const [erro, setErro] = useState('')
  const [gerando, setGerando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [relogio, setRelogio] = useState('')

  const gerar = useCallback(async () => {
    setGerando(true)
    setErro('')
    try {
      const r = await api<Checkout>(`/api/monitorias/reservas/${reservaId}/checkout`, { method: 'POST' })
      setDados(r)
      if (r.status === 'approved') onAprovado()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar PIX.')
    } finally {
      setGerando(false)
    }
  }, [reservaId, onAprovado])

  useEffect(() => {
    gerar()
  }, [gerar])

  useIntervaloVisivel(
    () => {
      if (!dados?.orderId) return
      fetch(`/api/payments/orders/${dados.orderId}/status`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => {
          if (s?.status === 'approved') onAprovado()
          else if (s?.status && ['rejected', 'cancelled', 'expired'].includes(s.status)) setErro('O PIX expirou ou foi cancelado. Gere um novo.')
        })
        .catch(() => {})
    },
    dados?.orderId && !erro ? 5000 : null,
  )

  useIntervaloVisivel(() => dados && setRelogio(restante(dados.expiraEm).texto), dados ? 1000 : null)

  async function copiar() {
    if (!dados?.pix) return
    await navigator.clipboard.writeText(dados.pix.qrCode)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  if (gerando && !dados) return <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Gerando seu PIX…</div>

  return (
    <div className="space-y-4">
      {dados && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Monitoria</span><span className="font-medium">{formatarCentavos(dados.valorCentavos)}</span></div>
          {dados.taxaCentavos > 0 && (
            <div className="mt-1 flex justify-between"><span className="text-muted-foreground">{dados.taxaRotulo} (PIX)</span><span>{formatarCentavos(dados.taxaCentavos)}</span></div>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold"><span>Total</span><span>{formatarCentavos(dados.totalCentavos)}</span></div>
        </div>
      )}
      {dados?.pix && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-card p-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold"><QrCode className="h-4 w-4 text-primary" /> Escaneie no app do seu banco</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${dados.pix.qrCodeBase64}`} alt="QR Code PIX" className="h-52 w-52 rounded-lg bg-white p-2" />
          <Button variant="outline" onClick={copiar} className="w-full">
            {copiado ? <><Check className="mr-2 h-4 w-4 text-emerald-600" /> Copiado!</> : <><Copy className="mr-2 h-4 w-4" /> Copiar PIX copia e cola</>}
          </Button>
          <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> Expira em {relogio || '—'}</span>
            <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> aguardando pagamento</span>
          </div>
        </motion.div>
      )}
      {erro && (
        <div className="space-y-2">
          <CaixaErro mensagem={erro} />
          <Button variant="outline" onClick={gerar} disabled={gerando} className="w-full">Tentar de novo</Button>
        </div>
      )}
      <p className="flex items-start gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        Pagamento protegido: o valor fica em garantia e só vai para o monitor 48h depois da aula. Cancelou com 24h ou mais? Reembolso automático.
      </p>
    </div>
  )
}
