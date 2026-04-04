'use client'

import { useEffect, useState } from 'react'
import { Heart, Stethoscope, Activity, Clock, Trophy, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface DoacaoPublic {
  _id: string
  apelido: string
  valor: number
  mensagem?: string | null
  dataDoacao: string
}

interface DoacaoRankingProps {
  compact?: boolean    // mostra apenas top 3, sem tabs
  defaultTab?: 'top' | 'recent'
}

const BADGE_CONFIG = [
  { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/15', label: '1º', glow: 'shadow-yellow-500/20' },
  { icon: Stethoscope, color: 'text-slate-400', bg: 'bg-slate-400/15', label: '2º', glow: 'shadow-slate-400/20' },
  { icon: Activity, color: 'text-amber-600', bg: 'bg-amber-600/15', label: '3º', glow: 'shadow-amber-600/20' },
]

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  if (d > 30) return new Date(dateStr).toLocaleDateString('pt-BR')
  if (d > 0) return `há ${d} dia${d > 1 ? 's' : ''}`
  if (h > 0) return `há ${h}h`
  return 'agora mesmo'
}

export function DoacaoRanking({ compact = false, defaultTab = 'top' }: DoacaoRankingProps) {
  const [tab, setTab] = useState<'top' | 'recent'>(defaultTab)
  const [topData, setTopData] = useState<DoacaoPublic[]>([])
  const [recentData, setRecentData] = useState<DoacaoPublic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [topRes, recentRes] = await Promise.all([
          fetch('/api/doacoes?sort=top'),
          fetch('/api/doacoes?sort=recent'),
        ])
        const [top, recent] = await Promise.all([topRes.json(), recentRes.json()])
        setTopData(Array.isArray(top) ? top : [])
        setRecentData(Array.isArray(recent) ? recent : [])
      } catch {
        setTopData([])
        setRecentData([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const data = compact ? topData.slice(0, 3) : (tab === 'top' ? topData : recentData)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Carregando ranking...</span>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="h-10 w-10 text-rose-300 mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground text-sm">Seja o primeiro doador!</p>
        <p className="text-muted-foreground text-xs mt-1">Sua contribuição aparecerá aqui após aprovação.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Tabs (apenas no modo completo) */}
      {!compact && (
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-4 w-fit">
          {(['top', 'recent'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                tab === t
                  ? 'bg-white dark:bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'top' ? <><Trophy className="h-3 w-3" /> Top Doadores</> : <><Clock className="h-3 w-3" /> Recentes</>}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {data.map((donor, idx) => {
          const badge = tab === 'top' || compact ? BADGE_CONFIG[idx] : null
          const BadgeIcon = badge?.icon

          return (
            <motion.div
              key={donor._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all ${
                idx === 0 && (tab === 'top' || compact)
                  ? 'bg-yellow-500/5 border-yellow-500/20 shadow-sm shadow-yellow-500/10'
                  : 'bg-muted/30 border-border/50 hover:bg-muted/50'
              }`}
            >
              {/* Badge / posição */}
              <div className="flex-shrink-0 w-8 text-center">
                {BadgeIcon && idx < 3 ? (
                  <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${badge!.bg} shadow-sm ${badge!.glow}`}>
                    <BadgeIcon className={`h-3.5 w-3.5 ${badge!.color}`} />
                  </div>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground tabular-nums">
                    {tab === 'top' ? `${idx + 1}º` : ''}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{donor.apelido}</span>
                  {(tab === 'top' || compact) && idx === 0 && (
                    <span className="text-[9px] bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap">
                      Top Doador
                    </span>
                  )}
                </div>
                {donor.mensagem && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5 italic">"{donor.mensagem}"</p>
                )}
                {!compact && (
                  <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {timeAgo(donor.dataDoacao)}
                  </p>
                )}
              </div>

              {/* Valor */}
              <div className="flex-shrink-0 text-right">
                <span className={`font-bold tabular-nums text-sm ${
                  idx === 0 && (tab === 'top' || compact)
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {formatBRL(donor.valor)}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
