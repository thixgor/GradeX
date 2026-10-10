'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Minus, Plus, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { api, CaixaAviso, CaixaErro, ErroApi } from './base'
import { irParaLogin } from './agendador'

/**
 * Pedido por chat (negociação ou "a combinar"): a pessoa conta o que precisa,
 * quantos alunos e quais conteúdos. Data, duração e valor vêm em propostas.
 */
export function DialogoPedido({
  anuncioId,
  modo,
  conteudos,
  maxVagas,
  gratis,
}: {
  anuncioId: string
  modo: 'negociacao' | 'a_combinar'
  conteudos: string[]
  maxVagas: number
  gratis: boolean
}) {
  const router = useRouter()
  const [mensagem, setMensagem] = useState('')
  const [vagas, setVagas] = useState(1)
  const [escolhidos, setEscolhidos] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [pendentes, setPendentes] = useState<Array<{ rotulo: string; acao?: { texto: string; href: string } }>>([])

  async function enviar() {
    setEnviando(true)
    setErro('')
    setPendentes([])
    try {
      const r = await api<{ reservaId: string }>(`/api/monitorias/anuncios/${anuncioId}/solicitar`, {
        method: 'POST',
        json: { modo, mensagem, vagas: gratis ? 1 : vagas, conteudos: escolhidos, gratis },
      })
      router.push(`/monitorias/reservas/${r.reservaId}`)
    } catch (e) {
      if (e instanceof ErroApi && e.status === 401) return irParaLogin()
      if (e instanceof ErroApi && e.dados?.pendentes) setPendentes(e.dados.pendentes)
      setErro(e instanceof Error ? e.message : 'Erro ao enviar.')
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-4">
      {gratis && <CaixaAviso tom="sucesso">Pedido de aula experimental grátis (uma por monitor).</CaixaAviso>}
      <div>
        <label className="mb-1.5 block text-sm font-semibold" htmlFor="msg-pedido">
          Conte para o monitor o que você precisa
        </label>
        <Textarea
          id="msg-pedido"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Ex.: Tenho prova de Fisiologia na semana que vem e travei em ciclo cardíaco. Prefiro à noite, 2 horas."
        />
        <p className="mt-1 text-right text-[11px] text-muted-foreground">{mensagem.length}/2000</p>
      </div>
      {conteudos.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-semibold">Quais conteúdos?</p>
          <div className="flex flex-wrap gap-1.5">
            {conteudos.map((c) => {
              const on = escolhidos.includes(c)
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setEscolhidos((x) => (on ? x.filter((y) => y !== c) : [...x, c]))}
                  className={cn('rounded-full border px-3 py-1 text-xs font-medium transition', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40')}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {maxVagas > 1 && !gratis && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3 py-2">
          <span className="text-sm font-medium">Quantos alunos?</span>
          <div className="flex items-center gap-2">
            <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => setVagas((v) => Math.max(1, v - 1))} aria-label="Menos">
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-6 text-center font-bold">{vagas}</span>
            <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => setVagas((v) => Math.min(maxVagas, v + 1))} aria-label="Mais">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
      {erro && <CaixaErro mensagem={erro} />}
      {pendentes.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-border bg-muted/40 p-3 text-sm">
          {pendentes.map((p) => (
            <li key={p.rotulo} className="flex items-center justify-between gap-2">
              <span>• {p.rotulo}</span>
              {p.acao && (
                <a href={p.acao.href} className="text-xs font-semibold text-primary hover:underline">
                  {p.acao.texto}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      <Button onClick={enviar} disabled={enviando || mensagem.trim().length < 10} className="h-11 w-full rounded-xl font-semibold">
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Enviar pedido</>}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">
        Combine tudo pelo chat da plataforma: contatos pessoais ficam ocultos até o pagamento. É o que garante seu contrato e seu reembolso.
      </p>
    </div>
  )
}
