'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Radio, ScissorsLineDashed, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { api, CaixaAviso, CaixaErro, Esqueleto, Selo } from '@/components/monitorias/base'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import type { ConfigSala } from '@/lib/monitorias/tipos'
import { cn } from '@/lib/utils'
import { AdminSalaDeTeste } from './admin-sala-de-teste'

interface DadosDaSala {
  config: ConfigSala
  turn: { configurado: boolean; situacao: 'ativo' | 'desligado' | 'sem_credenciais' | 'orcamento' }
  uso: { mes: string; gbRelay: number; horasRelay: number; horasDireta: number; atualizadoEm: string | null }
  agora: { salas: number; pessoas: number }
}

const SITUACAO_TURN: Record<DadosDaSala['turn']['situacao'], { rotulo: string; tom: 'sucesso' | 'neutro' | 'alerta' | 'erro' }> = {
  ativo: { rotulo: 'Entregando TURN', tom: 'sucesso' },
  desligado: { rotulo: 'Desligado (só conexão direta)', tom: 'neutro' },
  sem_credenciais: { rotulo: 'Sem credenciais da Cloudflare', tom: 'alerta' },
  orcamento: { rotulo: 'Teto do mês atingido: só conexão direta', tom: 'alerta' },
}

function Chave({ titulo, texto, ligado, onMudar }: { titulo: string; texto: string; ligado: boolean; onMudar: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold">{titulo}</p>
        <p className="mt-0.5 max-w-[60ch] text-xs leading-relaxed text-muted-foreground">{texto}</p>
      </div>
      <Switch checked={ligado} onCheckedChange={onMudar} aria-label={titulo} />
    </div>
  )
}

/** Admin → Monitorias → Sala de vídeo: chaves da sala nativa, do link externo e do TURN. */
export function AdminSalaDeVideo() {
  const [dados, setDados] = useState<DadosDaSala | null>(null)
  const [rascunho, setRascunho] = useState<ConfigSala | null>(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [cortando, setCortando] = useState(false)

  const carregar = useCallback(() => {
    api<DadosDaSala>('/api/admin/monitorias/sala')
      .then((d) => {
        setDados(d)
        setRascunho(d.config)
      })
      .catch((e) => setErro(e.message))
  }, [])
  useEffect(() => carregar(), [carregar])

  if (erro && !dados) return <CaixaErro mensagem={erro} />
  if (!dados || !rascunho) return <Esqueleto className="h-96" />

  const mudou = JSON.stringify(rascunho) !== JSON.stringify(dados.config)
  const mudar = (parcial: Partial<ConfigSala>) => setRascunho({ ...rascunho, ...parcial })
  const teto = rascunho.turnOrcamentoGbMes
  const pct = teto ? Math.min(100, (dados.uso.gbRelay / teto) * 100) : 0
  const situacao = SITUACAO_TURN[dados.turn.situacao]

  async function salvar() {
    setSalvando(true)
    setErro('')
    setAviso('')
    try {
      await api('/api/admin/monitorias/sala', { method: 'PUT', json: rascunho })
      setAviso('Salvo. Vale em até 1 minuto para todos.')
      carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function cortarTurn() {
    if (!confirm('Desligar o TURN agora e revogar as credenciais já entregues? Quem depende do relé perde a conexão (o restante continua).')) return
    setCortando(true)
    setErro('')
    try {
      const r = await api<{ revogadas: number; total: number }>('/api/admin/monitorias/sala', { method: 'POST', json: { acao: 'cortar_turn' } })
      setAviso(`TURN desligado. ${r.revogadas} de ${r.total} credencial(is) revogada(s).`)
      carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível cortar o TURN.')
    } finally {
      setCortando(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Radio className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Agora: {dados.agora.salas} aula(s) na sala, {dados.agora.pessoas} pessoa(s)</p>
          <p className="text-xs text-muted-foreground">Áudio e vídeo vão direto entre os participantes (ou pelo TURN da Cloudflare). Nada disso passa pela Vercel.</p>
        </div>
      </div>

      <AdminSalaDeTeste />

      {aviso && <CaixaAviso tom="sucesso">{aviso}</CaixaAviso>}
      {erro && <CaixaErro mensagem={erro} />}

      <section className="rounded-2xl border border-border bg-card px-4 py-1 divide-y divide-border">
        <Chave
          titulo="Sala de aula da plataforma"
          texto="Desligada, o botão “Entrar na sala” some e ninguém entra (as aulas seguem pelo link externo, se houver)."
          ligado={rascunho.salaNativaAtiva}
          onMudar={(v) => mudar({ salaNativaAtiva: v })}
        />
        <Chave
          titulo="Link externo (Meet, Zoom…) como plano B"
          texto="Desligado, o monitor não coloca link novo (os já colocados continuam visíveis) e novas aulas em grupo ficam limitadas ao tamanho da sala."
          ligado={rascunho.linkExternoPermitido}
          onMudar={(v) => mudar({ linkExternoPermitido: v })}
        />
        <Chave titulo="Compartilhar a tela" texto="No computador. Limitado a 5 quadros por segundo para não pesar na rede." ligado={rascunho.compartilharTela} onMudar={(v) => mudar({ compartilharTela: v })} />
        <Chave titulo="Chat na sala" texto="As mensagens vão para o chat da reserva (ficam registradas) e chegam ao vivo pela conexão direta." ligado={rascunho.chatNaSala} onMudar={(v) => mudar({ chatNaSala: v })} />
        <div className="flex items-start justify-between gap-4 py-3">
          <div>
            <p className="text-sm font-semibold">Pessoas ao mesmo tempo na sala</p>
            <p className="mt-0.5 max-w-[60ch] text-xs leading-relaxed text-muted-foreground">Conexão direta entre todos (sem custo de mídia). Cada pessoa envia um vídeo para cada outra: acima de 4 a rede de celular não aguenta.</p>
          </div>
          <select
            value={rascunho.limiteMalha}
            onChange={(e) => mudar({ limiteMalha: Number(e.target.value) })}
            className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
            aria-label="Pessoas ao mesmo tempo na sala"
          >
            {[2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} {n === 2 ? '(só 1:1)' : `(monitor + ${n - 1})`}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Video className="h-4 w-4 text-primary" aria-hidden /> TURN (Cloudflare)
            </p>
            <p className="mt-0.5 max-w-[62ch] text-xs leading-relaxed text-muted-foreground">
              Relé para quem não conecta direto (rede corporativa, alguns 4G). Cobrado por GB de saída: US$ 0,05/GB depois dos 1.000 GB grátis do mês. Desligado, essas pessoas não conectam.
            </p>
          </div>
          <Switch checked={rascunho.turnAtivo} onCheckedChange={(v) => mudar({ turnAtivo: v })} aria-label="TURN ligado" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Selo tom={situacao.tom}>{situacao.rotulo}</Selo>
          {!dados.turn.configurado && <span className="text-xs text-muted-foreground">Configure CLOUDFLARE_TURN_KEY_ID e CLOUDFLARE_TURN_API_TOKEN na Vercel.</span>}
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Relé estimado em {dados.uso.mes}</span>
            <span className="tabular-nums text-muted-foreground">
              {dados.uso.gbRelay.toFixed(2)} GB{teto ? ` de ${teto} GB` : ''}
            </span>
          </div>
          {teto ? (
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div className={cn('h-full rounded-full', pct >= rascunho.turnCorteAutomaticoPct ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-primary')} style={{ width: `${pct}%` }} />
            </div>
          ) : null}
          <p className="mt-1.5 text-xs text-muted-foreground">
            {dados.uso.horasDireta.toFixed(1)} h em conexão direta, {dados.uso.horasRelay.toFixed(1)} h pelo relé.
            {dados.uso.atualizadoEm ? ` Atualizado ${formatarEmBrasilia(dados.uso.atualizadoEm)}.` : ''} O número oficial fica no painel da Cloudflare.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Teto do mês (GB, vazio = sem teto)</span>
            <input
              type="number"
              min={0}
              value={teto ?? ''}
              onChange={(e) => mudar({ turnOrcamentoGbMes: e.target.value === '' ? null : Math.max(0, Math.round(Number(e.target.value))) })}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Desligar sozinho ao chegar em (% do teto)</span>
            <input
              type="number"
              min={10}
              max={100}
              value={rascunho.turnCorteAutomaticoPct}
              onChange={(e) => mudar({ turnCorteAutomaticoPct: Math.min(100, Math.max(10, Math.round(Number(e.target.value) || 0))) })}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </label>
        </div>

        <Button variant="outline" className="mt-4 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700" disabled={cortando || !dados.config.turnAtivo} onClick={cortarTurn}>
          {cortando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScissorsLineDashed className="mr-2 h-4 w-4" />} Cortar TURN agora
        </Button>
      </section>

      <div className="sticky bottom-3 flex justify-end">
        <Button disabled={!mudou || salvando} onClick={salvar} className="rounded-xl shadow-lg">
          {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Salvar alterações
        </Button>
      </div>
    </div>
  )
}
