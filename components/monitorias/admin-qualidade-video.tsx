'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Gauge } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { gbPorHoraNoTeto, LIMITES_DE_VIDEO, PERFIS_DE_VIDEO } from '@/lib/monitorias/sala/regras'
import type { ConfigVideo, PerfilDeVideo } from '@/lib/monitorias/tipos'
import { cn } from '@/lib/utils'

const PERFIS: Array<{ id: Exclude<PerfilDeVideo, 'personalizado'>; rotulo: string; emoji: string; texto: string }> = [
  { id: 'fluido', rotulo: 'Fluido', emoji: '🏃', texto: '30 fps: movimento natural (recomendado)' },
  { id: 'equilibrado', rotulo: 'Equilibrado', emoji: '⚖️', texto: '24 fps, um pouco menos de dados' },
  { id: 'nitido', rotulo: 'Nítido', emoji: '🔎', texto: '480p: mais detalhe, mais dados' },
  { id: 'economico', rotulo: 'Econômico', emoji: '🪙', texto: '15 fps: para internet fraca e relé barato' },
]

function Numero({ rotulo, valor, limites, sufixo, aoMudar }: { rotulo: string; valor: number; limites: readonly [number, number]; sufixo: string; aoMudar: (v: number) => void }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 flex items-baseline justify-between text-xs font-medium text-muted-foreground">
        {rotulo}
        <span className="tabular-nums text-foreground">
          {valor} {sufixo}
        </span>
      </span>
      <input type="range" min={limites[0]} max={limites[1]} value={valor} onChange={(e) => aoMudar(Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" aria-label={rotulo} />
    </label>
  )
}

/**
 * Admin → Sala de vídeo → Qualidade do vídeo. As predefinições preenchem os
 * números; mexer num número vira "Personalizado". Os degraus para rede ruim
 * saem sozinhos do teto (`niveisDaConfig`).
 */
export function QualidadeDoVideo({ valor, aoMudar }: { valor: ConfigVideo; aoMudar: (v: ConfigVideo) => void }) {
  const [avancado, setAvancado] = useState(valor.perfil === 'personalizado')
  // Fps, resolução e tetos da câmera fazem parte das predefinições: mexer neles vira "Personalizado".
  const mudar = (parcial: Partial<ConfigVideo>) => aoMudar({ ...valor, ...parcial, perfil: 'personalizado' })
  const mudarSolto = (parcial: Partial<ConfigVideo>) => aoMudar({ ...valor, ...parcial })
  const gb1a1 = 2 * gbPorHoraNoTeto(valor.bitrateIndividualKbps)
  const gbGrupo = 4 * 3 * gbPorHoraNoTeto(valor.bitrateGrupoKbps)

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Gauge className="h-4 w-4 text-primary" aria-hidden /> Qualidade do vídeo
      </p>
      <p className="mt-0.5 max-w-[62ch] text-xs leading-relaxed text-muted-foreground">
        Vale para as próximas entradas na sala (em até 1 minuto). Com a rede ruim, a sala desce a qualidade sozinha a partir deste teto e sobe de novo quando melhora.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {PERFIS.map((p) => {
          const ativo = valor.perfil === p.id
          return (
            <motion.button
              key={p.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              aria-pressed={ativo}
              onClick={() => aoMudar({ ...valor, ...PERFIS_DE_VIDEO[p.id], perfil: p.id })}
              className={cn('rounded-xl border p-3 text-left transition-colors', ativo ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:bg-muted')}
            >
              <span className="text-lg" aria-hidden>
                {p.emoji}
              </span>
              <span className="mt-1 block text-sm font-semibold">{p.rotulo}</span>
              <span className="block text-[11px] leading-snug text-muted-foreground">{p.texto}</span>
            </motion.button>
          )
        })}
      </div>
      {valor.perfil === 'personalizado' && <p className="mt-2 text-xs font-medium text-primary">Personalizado</p>}

      <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        Pelo relé (só quem não conecta direto): ~{gb1a1.toFixed(2)} GB por hora numa aula 1:1 e até ~{gbGrupo.toFixed(2)} GB numa aula de 4 pessoas. Conexão direta não custa nada.
      </p>

      <button type="button" onClick={() => setAvancado((a) => !a)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary" aria-expanded={avancado}>
        <ChevronDown className={cn('h-4 w-4 transition-transform', avancado && 'rotate-180')} aria-hidden /> Ajuste fino
      </button>
      {avancado && (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Numero rotulo="Quadros por segundo (máximo)" valor={valor.fpsMax} limites={LIMITES_DE_VIDEO.fpsMax} sufixo="fps" aoMudar={(v) => mudar({ fpsMax: v })} />
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Resolução da câmera</span>
            <select value={valor.resolucao} onChange={(e) => mudar({ resolucao: Number(e.target.value) === 480 ? 480 : 360 })} className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm">
              <option value={360}>360p (leve)</option>
              <option value={480}>480p (mais nítido)</option>
            </select>
          </label>
          <Numero rotulo="Teto da câmera, aula 1:1" valor={valor.bitrateIndividualKbps} limites={LIMITES_DE_VIDEO.bitrateIndividualKbps} sufixo="kbps" aoMudar={(v) => mudar({ bitrateIndividualKbps: v })} />
          <Numero rotulo="Teto por pessoa, aula em grupo" valor={valor.bitrateGrupoKbps} limites={LIMITES_DE_VIDEO.bitrateGrupoKbps} sufixo="kbps" aoMudar={(v) => mudar({ bitrateGrupoKbps: v })} />
          <Numero rotulo="Tela compartilhada: quadros por segundo" valor={valor.telaFps} limites={LIMITES_DE_VIDEO.telaFps} sufixo="fps" aoMudar={(v) => mudarSolto({ telaFps: v })} />
          <Numero rotulo="Tela compartilhada: teto" valor={valor.telaBitrateKbps} limites={LIMITES_DE_VIDEO.telaBitrateKbps} sufixo="kbps" aoMudar={(v) => mudarSolto({ telaBitrateKbps: v })} />
          <div className="flex items-start justify-between gap-4 sm:col-span-2">
            <div>
              <p className="text-sm font-semibold">Ajuste automático pela rede</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Desligado, o vídeo fica sempre no teto, mesmo travando em internet fraca. Recomendado: ligado.</p>
            </div>
            <Switch checked={valor.adaptativo} onCheckedChange={(v) => mudarSolto({ adaptativo: v })} aria-label="Ajuste automático pela rede" />
          </div>
        </div>
      )}
    </section>
  )
}
