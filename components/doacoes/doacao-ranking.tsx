'use client'

import { useEffect, useState } from 'react'
import { Heart, Stethoscope, Activity, Clock, Trophy, Loader2, ChevronDown } from 'lucide-react'

interface DoacaoPublic {
  _id: string
  apelido: string
  valor: number
  mensagem?: string | null
  dataDoacao: string
}

interface DoacaoRankingProps {
  compact?: boolean
  defaultTab?: 'top' | 'recent'
  glass?: boolean   // força estilo dark/glass (dentro de modais escuros)
}

const BADGE_CONFIG = [
  { icon: Trophy,      color: '#facc15', border: 'rgba(250,204,21,0.35)',  bg: 'rgba(250,204,21,0.12)',  label: '1º' },
  { icon: Stethoscope, color: '#94a3b8', border: 'rgba(148,163,184,0.30)', bg: 'rgba(148,163,184,0.10)', label: '2º' },
  { icon: Activity,    color: '#d97706', border: 'rgba(217,119,6,0.30)',   bg: 'rgba(217,119,6,0.10)',   label: '3º' },
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

export function DoacaoRanking({ compact = false, defaultTab = 'top', glass = false }: DoacaoRankingProps) {
  const [tab, setTab] = useState<'top' | 'recent'>(defaultTab)
  const [topData, setTopData] = useState<DoacaoPublic[]>([])
  const [recentData, setRecentData] = useState<DoacaoPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null)

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
  const isTop = tab === 'top' || compact

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2" style={{ color: glass ? 'rgba(255,255,255,0.4)' : undefined }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Carregando ranking...</span>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="h-10 w-10 mx-auto mb-3 opacity-40" style={{ color: glass ? '#f9a8d4' : undefined }} />
        <p className="text-sm" style={{ color: glass ? 'rgba(255,255,255,0.4)' : undefined }}>Seja o primeiro doador!</p>
        <p className="text-xs mt-1" style={{ color: glass ? 'rgba(255,255,255,0.25)' : undefined }}>
          Sua contribuição aparecerá aqui após aprovação.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Tabs */}
      {!compact && (
        <div
          className="flex gap-1 p-1 rounded-xl mb-4 w-fit"
          style={glass
            ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }
            : { background: 'var(--muted)', opacity: 0.5 }
          }
        >
          {(['top', 'recent'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={glass ? {
                background: tab === t ? 'rgba(255,255,255,0.10)' : 'transparent',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
                border: tab === t ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
              } : {}}
            >
              {t === 'top'
                ? <><Trophy className="h-3 w-3" /> Top Doadores</>
                : <><Clock className="h-3 w-3" /> Recentes</>
              }
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      <div className="space-y-1.5">
        {data.map((donor, idx) => {
          const badge = isTop ? BADGE_CONFIG[idx] : null
          const BadgeIcon = badge?.icon
          const isFirst = idx === 0 && isTop

          return (
            <div
              key={donor._id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
              style={{
                animation: `fadeInUp 0.25s ease-out ${idx * 50}ms both`,
                ...(glass ? {
                  background: isFirst ? 'rgba(250,204,21,0.06)' : 'rgba(255,255,255,0.04)',
                  border: isFirst ? '1px solid rgba(250,204,21,0.20)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: isFirst ? '0 0 16px rgba(250,204,21,0.06)' : 'none',
                } : {
                  background: isFirst ? 'hsl(var(--muted))' : 'hsl(var(--muted) / 0.3)',
                  border: '1px solid hsl(var(--border) / 0.5)',
                }),
              }}
            >
              {/* Badge / posição */}
              <div className="flex-shrink-0 w-7 text-center">
                {BadgeIcon && idx < 3 ? (
                  <div
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full"
                    style={{ background: badge!.bg, border: `1px solid ${badge!.border}` }}
                  >
                    <BadgeIcon className="h-3.5 w-3.5" style={{ color: badge!.color }} />
                  </div>
                ) : (
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: glass ? 'rgba(255,255,255,0.3)' : undefined }}
                  >
                    {isTop ? `${idx + 1}º` : ''}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold text-sm truncate"
                    style={{ color: glass ? (isFirst ? '#fde68a' : 'rgba(255,255,255,0.88)') : undefined }}
                  >
                    {donor.apelido}
                  </span>
                  {isTop && idx === 0 && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap"
                      style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15' }}
                    >
                      Top Doador
                    </span>
                  )}
                </div>
                {donor.mensagem && (() => {
                  const isLong = donor.mensagem.length > 60
                  const isOpen = expandedMsg === donor._id
                  return (
                    <div className="mt-0.5">
                      <p
                        className={`text-xs italic leading-relaxed ${!isOpen && isLong ? 'line-clamp-1' : ''}`}
                        style={{ color: glass ? 'rgba(255,255,255,0.40)' : undefined }}
                      >
                        "{donor.mensagem}"
                      </p>
                      {isLong && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedMsg(isOpen ? null : donor._id) }}
                          className="flex items-center gap-0.5 mt-0.5 text-[10px] font-medium transition-colors"
                          style={{ color: glass ? 'rgba(134,239,172,0.55)' : 'hsl(var(--muted-foreground))' }}
                        >
                          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                          {isOpen ? 'Ver menos' : 'Ver mais'}
                        </button>
                      )}
                    </div>
                  )
                })()}
                {!compact && (
                  <p
                    className="text-[10px] flex items-center gap-1 mt-0.5"
                    style={{ color: glass ? 'rgba(255,255,255,0.25)' : undefined }}
                  >
                    <Clock className="h-2.5 w-2.5" />
                    {timeAgo(donor.dataDoacao)}
                  </p>
                )}
              </div>

              {/* Valor */}
              <div className="flex-shrink-0 text-right">
                <span
                  className="font-bold tabular-nums text-sm"
                  style={{ color: glass
                    ? (isFirst ? '#facc15' : 'rgba(134,239,172,0.9)')
                    : undefined
                  }}
                >
                  {formatBRL(donor.valor)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
