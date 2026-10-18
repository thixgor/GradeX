'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Brain, Check, ChevronDown, Copy, Loader2, QrCode, ShieldCheck, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import { pollingDelayMs } from '@/lib/payments/polling'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { api, CaixaErro } from './base'

interface OfertaDoResumo {
  precoCentavos: number
  individual: boolean
  duracaoMin: number
  /** Aditivo exato que o aluno aceita (versão + hash vão no pedido). */
  texto: string
  versao: string
  hash: string
}

interface Oferta {
  material: { id: string; titulo: string; capa: string | null; precoCentavos: number } | null
  jaTem: boolean
  valorAulaCentavos: number
  resumo: OfertaDoResumo | null
  pixAberto: { comMaterial: boolean; comResumo?: boolean } | null
}

interface Checkout {
  orderId: string
  status: string
  pix: { qrCode: string; qrCodeBase64: string; ticketUrl?: string } | null
  valorCentavos: number
  material: { titulo: string; precoCentavos: number } | null
  resumo: { precoCentavos: number } | null
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
  const [comResumo, setComResumo] = useState(false)
  const [aceitouResumo, setAceitouResumo] = useState(false)

  const gerar = useCallback(
    async (incluirMaterial: boolean, incluirResumo: boolean, resumo: OfertaDoResumo | null) => {
      setGerando(true)
      setErro('')
      try {
        // Só a escolha vai para o servidor: preço da aula, do material e do resumo saem do banco.
        const r = await api<Checkout>(`/api/monitorias/reservas/${reservaId}/checkout`, {
          method: 'POST',
          json: { incluirMaterial, ...(incluirResumo && resumo ? { incluirResumo: true, aceiteResumo: { versao: resumo.versao, hash: resumo.hash } } : {}) },
        })
        setDados(r)
        setComMaterial(!!r.material)
        setComResumo(!!r.resumo)
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
  // Nada a oferecer (sem material e sem resumo) → gera direto, como sempre.
  useEffect(() => {
    let vivo = true
    api<Oferta>(`/api/monitorias/reservas/${reservaId}/checkout`)
      .then((o) => {
        if (!vivo) return
        setOferta(o)
        if (o.pixAberto) gerar(o.pixAberto.comMaterial, !!o.pixAberto.comResumo && !!o.resumo, o.resumo)
        else if ((!o.material || o.jaTem) && !o.resumo) gerar(false, false, null)
      })
      .catch(() => {
        if (vivo) gerar(false, false, null)
      })
    return () => {
      vivo = false
    }
  }, [reservaId, gerar])

  const ofereceMaterial = !!oferta?.material && !oferta.jaTem
  const ofertaResumo = oferta?.resumo || null
  const faltaAceite = comResumo && !aceitouResumo

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

  // Escolha antes do PIX: material e Resumo por IA são opcionais (nada vem marcado).
  if (!dados && oferta && (ofereceMaterial || ofertaResumo)) {
    const m = ofereceMaterial ? oferta.material : null
    const subtotal = oferta.valorAulaCentavos + (comMaterial && m ? m.precoCentavos : 0) + (comResumo && ofertaResumo ? ofertaResumo.precoCentavos : 0)
    const extras = [comMaterial && m ? 'o material' : '', comResumo && ofertaResumo ? 'o resumo' : ''].filter(Boolean).join(' e ')
    return (
      <div className="space-y-4">
        {m && <OpcaoMaterial material={m} marcado={comMaterial} onToggle={() => setComMaterial((x) => !x)} />}
        {ofertaResumo && (
          <OpcaoResumo
            oferta={ofertaResumo}
            marcado={comResumo}
            aceito={aceitouResumo}
            onToggle={() => setComResumo((x) => !x)}
            onAceitar={setAceitouResumo}
          />
        )}
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Monitoria</span><span className="font-medium">{formatarCentavos(oferta.valorAulaCentavos)}</span></div>
          {comMaterial && m && <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Material: {m.titulo}</span><span>{formatarCentavos(m.precoCentavos)}</span></div>}
          {comResumo && ofertaResumo && <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Resumo por IA</span><span>{formatarCentavos(ofertaResumo.precoCentavos)}</span></div>}
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold"><span>Subtotal</span><span>{formatarCentavos(subtotal)}</span></div>
          <p className="mt-1 text-xs text-muted-foreground">A taxa do PIX aparece no próximo passo, antes de você pagar. Nada é cobrado depois.</p>
        </div>
        {erro && <CaixaErro mensagem={erro} />}
        <Button className="h-12 w-full rounded-xl text-base font-semibold" onClick={() => gerar(comMaterial, comResumo, ofertaResumo)} disabled={gerando || faltaAceite}>
          {gerando ? <Loader2 className="h-5 w-5 animate-spin" /> : <><QrCode className="mr-2 h-5 w-5" /> Gerar PIX {extras ? `com ${extras}` : ''}</>}
        </Button>
        {faltaAceite && <p className="-mt-2 text-center text-xs text-muted-foreground">Para levar o Resumo por IA, aceite os termos dele acima.</p>}
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
          {dados.resumo && (
            <div className="mt-1 flex justify-between gap-3"><span className="min-w-0 truncate text-muted-foreground">Resumo por IA</span><span>{formatarCentavos(dados.resumo.precoCentavos)}</span></div>
          )}
          {dados.taxaCentavos > 0 && (
            <div className="mt-1 flex justify-between"><span className="text-muted-foreground">{dados.taxaRotulo} (PIX)</span><span>{formatarCentavos(dados.taxaCentavos)}</span></div>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold"><span>Total</span><span>{formatarCentavos(dados.totalCentavos)}</span></div>
          {(ofereceMaterial || ofertaResumo) && dados.status !== 'approved' && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {ofereceMaterial && (
                <button type="button" disabled={gerando} onClick={() => gerar(!dados.material, !!dados.resumo, ofertaResumo)} className="text-xs font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-50">
                  {dados.material ? 'Tirar o material e gerar outro PIX' : 'Incluir o material e gerar outro PIX'}
                </button>
              )}
              {ofertaResumo && dados.resumo && (
                <button type="button" disabled={gerando} onClick={() => gerar(!!dados.material, false, null)} className="text-xs font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-50">
                  Tirar o Resumo por IA e gerar outro PIX
                </button>
              )}
              {ofertaResumo && !dados.resumo && (
                <button
                  type="button"
                  disabled={gerando}
                  onClick={() => {
                    // Incluir pede o aceite: volta para a escolha com o resumo marcado.
                    setComResumo(true)
                    setDados(null)
                  }}
                  className="text-xs font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-50"
                >
                  Incluir o Resumo por IA
                </button>
              )}
            </div>
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
          <Button variant="outline" onClick={() => gerar(comMaterial, comResumo && aceitouResumo, ofertaResumo)} disabled={gerando} className="w-full">Tentar de novo</Button>
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

/**
 * Cartão do Resumo por IA: benefício, preço fechado e o que acontece com o
 * áudio (o aditivo inteiro, com aceite obrigatório para levar). Começa
 * desmarcado (opcional de verdade).
 */
function OpcaoResumo({
  oferta,
  marcado,
  aceito,
  onToggle,
  onAceitar,
}: {
  oferta: OfertaDoResumo
  marcado: boolean
  aceito: boolean
  onToggle: () => void
  onAceitar: (v: boolean) => void
}) {
  const [verTermos, setVerTermos] = useState(false)
  return (
    <div className={`rounded-2xl border p-4 transition ${marcado ? 'border-primary bg-primary/[0.06]' : 'border-border'}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={marcado}
        onClick={onToggle}
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
          <Brain className="h-6 w-6" />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Adicional opcional</span>
          <span className="mt-0.5 block font-semibold leading-snug">Resumo Inteligente por IA</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="font-heading font-bold tabular-nums">+ {formatarCentavos(oferta.precoCentavos)}</span>
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${marcado ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
            {marcado && <Check className="h-4 w-4" />}
          </span>
        </span>
      </button>
      <ul className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
        {['Síntese, tópicos e conceitos da aula', 'Raciocínio do monitor e dúvidas respondidas', 'Revisão rápida e pontos de atenção', 'Questões originais com gabarito comentado'].map((b) => (
          <li key={b} className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {b}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Fica pronto na página da reserva depois da aula. {oferta.individual ? 'A sua voz e a do monitor são transcritas.' : 'Em aula em grupo, só a voz do monitor é transcrita.'} O vídeo nunca é gravado. Preço fechado: nada é cobrado depois.
      </p>
      <button type="button" onClick={() => setVerTermos((x) => !x)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline" aria-expanded={verTermos}>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${verTermos ? 'rotate-180' : ''}`} /> O que acontece com o áudio, reembolso e privacidade
      </button>
      {verTermos && (
        <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto rounded-xl bg-muted/50 p-3 text-xs leading-relaxed text-foreground/80">
          {oferta.texto.split('\n').map((linha, i) => (
            <p key={i}>{linha}</p>
          ))}
        </div>
      )}
      {marcado && (
        <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-card p-3 text-xs leading-relaxed">
          <input type="checkbox" className="mt-0.5" checked={aceito} onChange={(e) => onAceitar(e.target.checked)} />
          <span>Li e aceito os termos do Resumo por IA, incluindo a transcrição da voz pelo Google (Gemini) e as regras de reembolso do adicional.</span>
        </label>
      )}
    </div>
  )
}
