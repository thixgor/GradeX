'use client'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { instanteDeBrasilia, formatarDuracao } from '@/lib/monitorias/agenda'
import { interpretarValorEmReais, formatarCentavos } from '@/lib/monitorias/dinheiro'
import { precoPorPessoaCentavos } from '@/lib/monitorias/precos'
import { relogioBrasilia } from '@/lib/fuso-brasilia'
import type { DetalheReserva } from './tipos-cliente'
import { api, CaixaErro, HoraBrasilia } from './base'

const DURACOES = [30, 60, 90, 120, 150, 180, 240]

/** Formulário de proposta/contraproposta: dia + hora (Brasília), duração, alunos, valor e conteúdos. */
export function CompositorProposta({ d, onEnviada }: { d: DetalheReserva; onEnviada: () => void }) {
  const r = d.reserva
  const p = r.proposta
  const ehMonitor = d.papel === 'monitor'
  const amanha = relogioBrasilia(new Date(Date.now() + 86_400_000)).dia
  const base = p ? relogioBrasilia(new Date(p.inicio)) : null
  const [dia, setDia] = useState(base?.dia || amanha)
  const [hora, setHora] = useState(base?.hora || '19:00')
  const [duracao, setDuracao] = useState(p?.duracaoMin || r.precoReferencia?.duracaoPadraoMin || 60)
  const [vagas, setVagas] = useState(p?.vagas || 1)
  const [gratis, setGratis] = useState(r.origem === 'gratis')
  const sugerido = r.precoReferencia && r.grupo ? precoPorPessoaCentavos({ preco: r.precoReferencia, grupo: r.grupo }, duracao, vagas) : 0
  const [valor, setValor] = useState(p && !p.gratis ? (p.valorPorPessoaCentavos / 100).toFixed(2).replace('.', ',') : '')
  const [conteudos, setConteudos] = useState<string[]>(p?.conteudos || [])
  const [obs, setObs] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const maxVagas = r.grupo?.ativo ? r.grupo.maxAlunos : 1

  async function enviar() {
    setErro('')
    const valorCentavos = valor.trim() ? interpretarValorEmReais(valor) : null
    if (valor.trim() && valorCentavos === null) return setErro('Valor inválido. Use, por exemplo, 120,00.')
    setEnviando(true)
    try {
      await api(`/api/monitorias/reservas/${r.id}/acao`, {
        method: 'POST',
        json: {
          acao: 'propor',
          inicio: instanteDeBrasilia(dia, hora).toISOString(),
          duracaoMin: duracao,
          conteudos,
          vagas: gratis ? 1 : vagas,
          ...(valorCentavos !== null && !gratis ? { valorPorPessoaCentavos: valorCentavos } : {}),
          gratis,
          ...(obs.trim() ? { observacao: obs.trim() } : {}),
        },
      })
      onEnviada()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao propor.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium">
          Dia
          <input type="date" value={dia} min={relogioBrasilia().dia} onChange={(e) => setDia(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm" />
        </label>
        <label className="text-xs font-medium">
          Hora <HoraBrasilia className="normal-case" />
          <input type="time" step={1800} value={hora} onChange={(e) => setHora(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm" />
        </label>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium">Duração</p>
        <div className="flex flex-wrap gap-1.5">
          {DURACOES.map((m) => (
            <button key={m} type="button" onClick={() => setDuracao(m)} className={cn('rounded-lg border px-2.5 py-1 text-xs font-semibold', m === duracao ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
              {formatarDuracao(m)}
            </button>
          ))}
        </div>
      </div>
      {maxVagas > 1 && !gratis && (
        <label className="block text-xs font-medium">
          Alunos (até {maxVagas})
          <input type="number" min={1} max={maxVagas} value={vagas} onChange={(e) => setVagas(Math.max(1, Math.min(maxVagas, Number(e.target.value) || 1)))} className="mt-1 h-10 w-24 rounded-lg border border-border bg-background px-2 text-sm" />
        </label>
      )}
      {ehMonitor && r.aulaGratis?.ativa && r.origem !== 'gratis' && (
        <label className="flex items-center gap-2 text-xs font-medium">
          <input type="checkbox" checked={gratis} onChange={(e) => setGratis(e.target.checked)} /> Oferecer como aula grátis
        </label>
      )}
      {!gratis && (
        <label className="block text-xs font-medium">
          Valor por pessoa (R$)
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={sugerido ? `sugerido: ${formatarCentavos(sugerido)}` : 'ex.: 120,00'}
            inputMode="decimal"
            className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm"
          />
          <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">Vazio = preço do anúncio para essa duração{sugerido ? ` (${formatarCentavos(sugerido)})` : ''}.</span>
        </label>
      )}
      {r.conteudosDoAnuncio.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium">Conteúdos</p>
          <div className="flex flex-wrap gap-1.5">
            {r.conteudosDoAnuncio.map((c) => {
              const on = conteudos.includes(c)
              return (
                <button key={c} type="button" onClick={() => setConteudos((x) => (on ? x.filter((y) => y !== c) : [...x, c]))} className={cn('rounded-full border px-2.5 py-0.5 text-xs', on ? 'border-primary bg-primary/10 text-primary' : 'border-border')}>
                  {c}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <input value={obs} onChange={(e) => setObs(e.target.value)} maxLength={500} placeholder="Observação (opcional)" className="h-10 w-full rounded-lg border border-border bg-background px-2 text-sm" />
      {erro && <CaixaErro mensagem={erro} />}
      <Button onClick={enviar} disabled={enviando} className="w-full">
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Enviar proposta</>}
      </Button>
    </div>
  )
}
