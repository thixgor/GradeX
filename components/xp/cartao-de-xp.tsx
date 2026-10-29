'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Flame, Trophy } from 'lucide-react'
import { useXp } from './xp-provider'
import { AnelDeNivel, NumeroQueCorre, SeloDaLiga, estiloDaLiga } from './pecas'
import '@/components/checkout/checkout-vidro.css'
import './xp.css'

/**
 * O XP no painel: nível, liga, o quanto falta para o próximo, a semana e a
 * posição — e a porta para o ranking. Com a próxima medalha à vista: mostrar o
 * que está quase é o que faz estudar mais um pouco (gradiente da meta).
 */
export function CartaoDeXp({ className = '' }: { className?: string }) {
  const { dados } = useXp()
  const calmo = useReducedMotion()
  if (!dados) return null
  const { nivel } = dados
  const falta = Math.max(0, nivel.proximo - dados.total)
  const proxima = dados.medalhas
    .filter((m) => !m.conquistada)
    .sort((a, b) => b.progresso - a.progresso)[0]

  return (
    <motion.section
      className={`ck-escopo xr-cartao ${className}`}
      style={estiloDaLiga(nivel.liga)}
      initial={calmo ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Seu XP"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <AnelDeNivel nivel={nivel.nivel} progresso={nivel.progresso} liga={nivel.liga} tamanho={72} espessura={6} />
          <SeloDaLiga liga={nivel.liga} tamanho={26} className="xr-cartao-selo" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="xr-cartao-rotulo">
            Nível {nivel.nivel} · <span style={{ color: 'var(--liga)' }}>Liga {nivel.liga.nome}</span>
          </p>
          <p className="xr-cartao-total">
            <NumeroQueCorre valor={dados.total} /> <small>XP</small>
          </p>
          <div className="xr-cartao-barra" aria-hidden>
            <i style={{ transform: `scaleX(${nivel.progresso})` }} />
          </div>
          <p className="xr-cartao-sub">
            {falta > 0 ? `${falta.toLocaleString('pt-BR')} XP para o nível ${nivel.nivel + 1}` : 'Nível máximo'}
          </p>
        </div>
      </div>

      <div className="xr-cartao-fatos">
        <span>
          <b>+{dados.semana.toLocaleString('pt-BR')}</b>
          <small>XP na semana</small>
        </span>
        <span>
          <b>{dados.posicaoSemana ? `${dados.posicaoSemana}º` : '—'}</b>
          <small>no ranking da semana</small>
        </span>
        <span>
          <b className="inline-flex items-center gap-1">
            <Flame className="h-4 w-4" style={{ color: '#f0782f' }} />
            {dados.sequenciaAtual}
          </b>
          <small>dias seguidos</small>
        </span>
      </div>

      <Link href="/ranking" prefetch={false} className="ck-cta xr-cartao-cta">
        Ver o ranking
        <ArrowRight className="h-4 w-4" />
      </Link>

      {proxima && (
        <p className="xr-cartao-medalha">
          <Trophy className="h-4 w-4 shrink-0" style={{ color: 'var(--liga)' }} />
          <span className="min-w-0 flex-1 truncate">
            Próxima medalha: <strong>{proxima.nome}</strong> — {proxima.texto}
          </span>
          <span className="xr-mini-barra" aria-hidden>
            <i style={{ width: `${Math.round(proxima.progresso * 100)}%` }} />
          </span>
        </p>
      )}
    </motion.section>
  )
}
