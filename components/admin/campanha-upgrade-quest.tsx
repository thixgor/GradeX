'use client'

import { useCallback, useEffect, useState } from 'react'
import { Crown, Eye, Loader2, Send, TestTube2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * O botão "oferecer upgrade aos Quest+" de /admin/emails.
 *
 * Uma campanha pronta: o e-mail é montado no servidor com o desconto, o plano e
 * o que ele libera (os mesmos números da /upgrade), e sai pela outbox de
 * campanhas — retry, backoff e status por pessoa, como o envio manual. O
 * destinatário é calculado na hora: todo Quest+ vigente.
 *
 * Duas travas contra o erro caro: o disparo para a base pede confirmação com o
 * número de pessoas, e o servidor recusa um segundo disparo em 15 minutos.
 */

interface Resumo {
  destinatarios: number
  assunto: string
  previa: string
  html: string
  descontoPercentual: number
  ultimaCampanha: { campaignId: string; total: number; createdAt: string } | null
}

interface Resultado {
  teste: boolean
  stats: { total: number; sent: number; pending: number; dead: number }
}

export function CampanhaUpgradeQuest() {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState<'teste' | 'base' | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [verPrevia, setVerPrevia] = useState(false)
  const [confirmar, setConfirmar] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/emails/upgrade-quest', { cache: 'no-store' })
      const d = await res.json()
      if (!res.ok) {
        setErro(d.error || 'Campanha indisponível.')
        setResumo(null)
        return
      }
      setErro('')
      setResumo(d)
    } catch {
      setErro('Não foi possível montar a campanha de upgrade.')
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function enviar(teste: boolean) {
    setEnviando(teste ? 'teste' : 'base')
    setErro('')
    setResultado(null)
    try {
      const res = await fetch('/api/admin/emails/upgrade-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teste }),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok || !d) throw new Error(d?.error || 'Falha ao enviar')
      setResultado({ teste, stats: d.stats })
      setConfirmar(false)
      if (!teste) carregar()
    } catch (e: any) {
      setErro(e.message || 'Falha ao enviar')
    } finally {
      setEnviando(null)
    }
  }

  const n = resumo?.destinatarios ?? 0

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.12] via-card to-primary/[0.06] p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-950">
            <Crown className="h-3 w-3" /> Campanha pronta
          </p>
          <h2 className="mt-2 text-lg font-bold leading-snug text-slate-950 dark:text-white">
            Oferecer upgrade com {resumo?.descontoPercentual ?? '—'}% OFF aos assinantes Quest+
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {erro && !resumo
              ? erro
              : `${n} ${n === 1 ? 'assinante Quest+ vigente recebe' : 'assinantes Quest+ vigentes recebem'} o e-mail com a oferta, o preço e tudo o que o Plus+ libera.`}
            {resumo?.ultimaCampanha &&
              ` Último disparo: ${new Date(resumo.ultimaCampanha.createdAt).toLocaleString('pt-BR')} (${resumo.ultimaCampanha.total}).`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:shrink-0">
          <Button variant="outline" size="sm" disabled={!resumo} onClick={() => setVerPrevia(true)} className="gap-1.5">
            <Eye className="h-4 w-4" /> Prévia
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!resumo || enviando !== null}
            onClick={() => enviar(true)}
            className="gap-1.5"
          >
            {enviando === 'teste' ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
            Enviar teste para mim
          </Button>
          <Button
            size="sm"
            disabled={!resumo || n === 0 || enviando !== null}
            onClick={() => setConfirmar(true)}
            className="gap-1.5 bg-amber-500 text-amber-950 hover:bg-amber-400"
          >
            <Send className="h-4 w-4" /> Enviar para {n} Quest+
          </Button>
        </div>
      </div>

      {resultado && (
        <p role="status" className="mt-3 rounded-lg bg-background/70 px-3 py-2 text-sm">
          {resultado.teste ? 'Teste enviado para o seu e-mail. ' : 'Campanha disparada. '}
          {resultado.stats.sent} de {resultado.stats.total} enviado{resultado.stats.sent === 1 ? '' : 's'}
          {resultado.stats.pending > 0 && ` · ${resultado.stats.pending} na fila (continua em segundo plano)`}
          {resultado.stats.dead > 0 && ` · ${resultado.stats.dead} com falha`}. O andamento fica no histórico de campanhas.
        </p>
      )}
      {erro && resumo && <p className="mt-3 text-sm text-destructive">{erro}</p>}

      <Dialog open={verPrevia} onOpenChange={setVerPrevia}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{resumo?.assunto.replace('%nome%', 'Fulano')}</DialogTitle>
            <DialogDescription>{resumo?.previa}</DialogDescription>
          </DialogHeader>
          {resumo && (
            <iframe
              title="Prévia do e-mail de upgrade"
              srcDoc={resumo.html}
              sandbox=""
              className="h-[65vh] w-full rounded-lg border bg-white"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmar} onOpenChange={(v) => enviando === null && setConfirmar(v)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar a oferta para {n} assinantes Quest+?</DialogTitle>
            <DialogDescription>
              Cada pessoa recebe um e-mail com o upgrade de {resumo?.descontoPercentual}% OFF. O envio segue em segundo
              plano pela fila de campanhas e não pode ser desfeito.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmar(false)} disabled={enviando !== null}>
              Cancelar
            </Button>
            <Button
              onClick={() => enviar(false)}
              disabled={enviando !== null}
              className="gap-1.5 bg-amber-500 text-amber-950 hover:bg-amber-400"
            >
              {enviando === 'base' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Sim, enviar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
