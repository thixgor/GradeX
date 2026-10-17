'use client'

import { Activity } from 'lucide-react'
import type { EstadoDaSalaNaTela } from '@/lib/monitorias/sala/cliente/controlador'
import type { EstatisticasDoPar } from '@/lib/monitorias/sala/cliente/par'
import { cn } from '@/lib/utils'

const NIVEL = ['Máxima', 'Boa', 'Econômica', 'Só áudio']
const LIMITE: Record<string, string> = { bandwidth: 'rede', cpu: 'processador do aparelho', other: 'navegador' }

function video(v: EstatisticasDoPar['envio']): string {
  if (!v || (!v.fps && !v.largura)) return '—'
  const partes = [v.fps !== null ? `${Math.round(v.fps)} fps` : null, v.largura && v.altura ? `${v.largura}×${v.altura}` : null, v.kbps !== null ? `${v.kbps} kbps` : null]
  return partes.filter(Boolean).join(' · ')
}

/**
 * Os números do `getStats` de cada conexão, lidos no próprio aparelho a cada
 * 2 s (nenhuma requisição). Servem para a próxima reclamação de "travando" vir
 * com dados: quantos quadros saem, quantos chegam e o que está segurando.
 */
export function EstatisticasDaConexao({ estado }: { estado: EstadoDaSalaNaTela }) {
  const conectados = estado.participantes.filter((p) => p.fase === 'conectado')
  return (
    <div className="rounded-2xl bg-white/5 p-3.5">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white">
        <Activity className="h-4 w-4 text-primary" aria-hidden /> Estatísticas da conexão
      </p>
      {!conectados.length ? (
        <p className="text-xs text-white/55">Aparecem quando alguém estiver conectado com você.</p>
      ) : (
        <div className="space-y-3">
          {conectados.map((p) => {
            const e = p.estatisticas
            const enviando = e?.envio?.fps ?? null
            const recebendo = e?.recebimento?.fps ?? null
            return (
              <div key={p.pid} className="text-xs">
                <p className="mb-1 font-medium text-white/85">{p.nome}</p>
                {!e ? (
                  <p className="text-white/55">Medindo…</p>
                ) : (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-white/70">
                    <dt>Você envia</dt>
                    <dd className={cn('tabular-nums', enviando !== null && enviando < 15 && 'text-amber-300')}>{video(e.envio)}</dd>
                    <dt>Você recebe</dt>
                    <dd className={cn('tabular-nums', recebendo !== null && recebendo < 15 && 'text-amber-300')}>{video(e.recebimento)}</dd>
                    <dt>Atraso</dt>
                    <dd className="tabular-nums">
                      {e.rttMs !== null ? `${e.rttMs} ms` : '—'}
                      {e.perdaPct !== null ? ` · perda ${e.perdaPct}%` : ''}
                    </dd>
                    <dt>Caminho</dt>
                    <dd>{e.tipo === 'retransmitida' ? 'Pelo servidor de apoio' : e.tipo === 'direta' ? 'Direto entre vocês' : '—'}</dd>
                    <dt>Qualidade</dt>
                    <dd>
                      {NIVEL[e.nivel] ?? '—'}
                      {e.motivoDoLimite && LIMITE[e.motivoDoLimite] ? ` · limitada pelo ${LIMITE[e.motivoDoLimite]}` : ''}
                    </dd>
                  </dl>
                )}
              </div>
            )
          })}
          <p className="text-[11px] leading-relaxed text-white/45">Se &quot;Você envia&quot; fica abaixo de 15 fps com a rede boa, a câmera pode estar com pouca luz ou o aparelho sobrecarregado.</p>
        </div>
      )}
    </div>
  )
}
