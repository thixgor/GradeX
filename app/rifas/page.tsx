'use client'

import { useEffect, useState } from 'react'
import { Ticket, Search, PartyPopper } from 'lucide-react'
import { RaffleCard, type RaffleCardData } from '@/components/rifas/raffle-card'

export default function RifasListingPage() {
  const [raffles, setRaffles] = useState<RaffleCardData[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [category, setCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    const url = category ? `/api/raffles?category=${encodeURIComponent(category)}` : '/api/raffles'
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (!active) return
        setRaffles(data.raffles || [])
        setCategories(data.categories || [])
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [category])

  const filtered = raffles.filter(r =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.prizeName.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #04130b 0%, #0a0f0d 60%, #06140a 100%)' }}>
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
            <PartyPopper size={14} /> Rifas & Sorteios
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Concorra a prêmios incríveis</h1>
          <p className="text-white/60 mt-3 max-w-xl mx-auto text-sm sm:text-base">
            Escolha seus números da sorte, pague com segurança e acompanhe o sorteio ao vivo. Simples, transparente e emocionante.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/60" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar rifa ou prêmio..."
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(52,211,153,0.2)' }}
            />
          </div>
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <CategoryChip label="Todas" active={!category} onClick={() => setCategory('')} />
              {categories.map(c => (
                <CategoryChip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Ticket size={48} className="mx-auto text-emerald-400/40 mb-4" />
            <p className="text-white/60">Nenhuma rifa disponível no momento. Volte em breve!</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(r => (
              <RaffleCard key={r.id} raffle={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition"
      style={{
        background: active ? '#34d399' : 'rgba(255,255,255,0.05)',
        color: active ? '#08130d' : 'rgba(255,255,255,0.7)',
        border: `1px solid ${active ? '#34d399' : 'rgba(52,211,153,0.2)'}`,
      }}
    >
      {label}
    </button>
  )
}
