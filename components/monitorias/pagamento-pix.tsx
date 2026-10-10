'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Check, Copy, Loader2, QrCode, ShieldCheck, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import { pollingDelayMs } from '@/lib/payments/polling'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { api, CaixaErro } from './base'

interface Oferta {
  material: { id: string; titulo: string; capa: string | null; precoCentavos: number } | null
  jaTem: boolean
  valorAulaCentavos: number
  pixAberto: { comMaterial: boolean } | null
}

interface Checkout {
  orderId: string
  status: string
  pix: { qrCode: string; qrCodeBase64: string; ticketUrl?: string } | null
  valorCentavos: number
  material: { titulo: string; precoCentavos: number } | null
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
  const [inicioDoPolling, setInicioDoPolling] = useState(0)
  const [oferta, setOferta] = useState<Oferta | null>(null)
  const [comMaterial, setComMaterial] = useState(false)

  const gerar = useCallback(
    async (incluirMaterial: boolean) => {
      setGerando(true)
      setErro('')
      try {
        // Só a escolha vai para o servidor: preço da aula e do material saem do banco.
        const r = await api<Checkout>(`/api/monitorias/reservas/${reservaId}/checkout`, { method: 'POST', json: { incluirMaterial } })
        setDados(r)
        setComMaterial(!!r.material)
        setInicioDoPolling(Date.now())
        if (r.status === 'approved') onAprovado()
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao gerar PIX.')
      } finally {
        setGerando(false)
      }
    },
    [reservaId, onAprovado],
  )

  // Primeiro pergunta o que há para oferecer. PIX já aberto → reabre o MESMO.
  // Sem material para oferecer → gera direto, como sempre.
  useEffect(() => {
    let vivo = true
    api<Oferta>(`/api/monitorias/reservas/${reservaId}/checkout`)
      .then((o) => {
        if (!vivo) return
        setOferta(o)
        if (o.pixAberto) gerar(o.pixAberto.comMaterial)
        else if (!o.material || o.jaTem) gerar(false)
      })
      .catch(() => {
        if (vivo) gerar(false)
      })
    return () => {
      vivo = false
    }
  }, [reservaId, gerar])

  const ofereceMaterial = !!oferta?.material && !oferta.jaTem

  useIntervaloVisivel(
    () => {
      if (!dados?.orderId) return
      fetch(`/api/payments/orders/${dados.orderId}/status`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => {
          // PIX que estava "confirmando com o banco" (criação demorou): o QR
          // chega pelo acompanhamento — mostra o MESMO, sem gerar outro.
          if (s?.pix && !dados.pix) setDados({ ...dados, pix: s.pix })
          if (s?.status === 'approved') onAprovado()
          else if (s?.status && ['rejected', 'cancelled', 'expired'].includes(s.status)) setErro('O PIX expirou ou foi cancelado. Gere um novo.')
        })
        .catch(() => {})
    },
    // Ritmo do checkout padrão: 3 s nos 2 primeiros minutos (quando quase todo
    // PIX é pago), depois 6 s e 15 s; e PARA quando o QR vence.
    dados?.orderId && !erro && restante(dados.expiraEm).ms > 0 ? pollingDelayMs(Date.now() - inicioDoPolling) : null,
  )

  useIntervaloVisivel(() => dados && setRelogio(restante(dados.expiraEm).texto), dados ? 1000 : null)

  async function copiar() {
    if (!dados?.pix) return
    await navigator.clipboard.writeText(dados.pix.qrCode)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  if ((gerando || !oferta) && !dados) return <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Preparando seu pagamento…</div>

  // Escolha antes do PIX: o material é opcional (nada vem marcado).
  if (!dados && ofereceMaterial && oferta?.material) {
    const m = oferta.material
    return (
      <div className="space-y-4">
        <OpcaoMaterial material={m} marcado={comMaterial} onToggle={() => setComMaterial((x) => !x)} />
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Monitoria</span><span className="font-medium">{formatarCentavos(oferta.valorAulaCentavos)}</span></div>
          {comMaterial && <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Material: {m.titulo}</span><span>{formatarCentavos(m.precoCentavos)}</span></div>}
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold"><span>Subtotal</span><span>{formatarCentavos(oferta.valorAulaCentavos + (comMaterial ? m.precoCentavos : 0))}</span></div>
          <p className="mt-1 text-xs text-muted-foreground">A taxa do PIX aparece no próximo passo, antes de você pagar.</p>
        </div>
        {erro && <CaixaErro mensagem={erro} />}
        <Button className="h-12 w-full rounded-xl text-base font-semibold" onClick={() => gerar(comMaterial)} disabled={gerando}>
          {gerando ? <Loader2 className="h-5 w-5 animate-spin" /> : <><QrCode className="mr-2 h-5 w-5" /> Gerar PIX {comMaterial ? 'com o material' : ''}</>}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {oferta?.jaTem && oferta.material && !dados?.material && (
        <p className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0" /> O monitor indica o material &quot;{oferta.material.titulo}&quot;, e você já tem acesso a ele. Nada a pagar por ele.
        </p>
      )}
      {dados && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Monitoria</span><span className="font-medium">{formatarCentavos(dados.valorCentavos)}</span></div>
          {dados.material && (
            <div className="mt-1 flex justify-between gap-3"><span className="min-w-0 truncate text-muted-foreground">Material: {dados.material.titulo}</span><span>{formatarCentavos(dados.material.precoCentavos)}</span></div>
          )}
          {dados.taxaCentavos > 0 && (
            <div className="mt-1 flex justify-between"><span className="text-muted-foreground">{dados.taxaRotulo} (PIX)</span><span>{formatarCentavos(dados.taxaCentavos)}</span></div>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold"><span>Total</span><span>{formatarCentavos(dados.totalCentavos)}</span></div>
          {ofereceMaterial && dados.status !== 'approved' && (
            <button type="button" disabled={gerando} onClick={() => gerar(!dados.material)} className="mt-2 text-xs font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-50">
              {dados.material ? 'Tirar o material e gerar outro PIX' : 'Incluir o material e gerar outro PIX'}
            </button>
          )}
        </div>
      )}
      {dados && !dados.pix && !erro && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Confirmando seu PIX com o banco… Não precisa gerar outro.
        </div>
      )}
      {dados?.pix && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-card p-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold"><QrCode className="h-4 w-4 text-primary" /> Escaneie no app do seu banco</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${dados.pix.qrCodeBase64}`} alt="QR Code PIX" className="h-52 w-52 rounded-lg bg-white p-2" />
          <Button variant="outline" onClick={copiar} className="w-full">
            {copiado ? <><Check className="mr-2 h-4 w-4 text-primary" /> Copiado</> : <><Copy className="mr-2 h-4 w-4" /> Copiar PIX copia e cola</>}
          </Button>
          <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> Expira em {relogio || '--:--'}</span>
            <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> aguardando pagamento</span>
          </div>
        </motion.div>
      )}
      {erro && (
        <div className="space-y-2">
          <CaixaErro mensagem={erro} />
          <Button variant="outline" onClick={() => gerar(comMaterial)} disabled={gerando} className="w-full">Tentar de novo</Button>
        </div>
      )}
      <p className="flex items-start gap-2 rounded-xl bg-primary/[0.06] p-3.5 text-xs leading-relaxed text-foreground/80">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        Pagamento protegido: o valor fica em garantia e só vai para o monitor 48h depois da aula. Desistiu em até 7 dias (antes da aula) ou cancelou com 24h de antecedência? Reembolso de 100%, automático.
      </p>
    </div>
  )
}

/** Cartão do material oficial: um toque marca/desmarca. Começa desmarcado (opcional de verdade). */
function OpcaoMaterial({
  material,
  marcado,
  onToggle,
}: {
  material: { titulo: string; capa: string | null; precoCentavos: number }
  marcado: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcado}
      onClick={onToggle}
      className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${marcado ? 'border-primary bg-primary/[0.06]' : 'border-border hover:border-primary/50'}`}
    >
      {material.capa ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={material.capa} alt="" className="h-12 w-12 rounded-xl object-cover" />
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-6 w-6" /></span>
      )}
      <span className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Indicado pelo monitor</span>
        <span className="mt-0.5 block font-semibold leading-snug">{material.titulo}</span>
      </span>
      <span className="flex items-center gap-3">
        <span className="font-heading font-bold tabular-nums">+ {formatarCentavos(material.precoCentavos)}</span>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${marcado ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
          {marcado && <Check className="h-4 w-4" />}
        </span>
      </span>
      <span className="col-span-3 text-sm text-muted-foreground">Material oficial DomineAqui, liberado na sua conta assim que o PIX for aprovado. Opcional: a aula é a mesma com ou sem ele.</span>
    </button>
  )
}
