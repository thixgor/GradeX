'use client'

import { useEffect, useRef, useState } from 'react'
import { Flame } from 'lucide-react'
import { EVENTO_DO_DOM, type Reacao } from '@/lib/dom/reacoes'
import { DomMascote, type EstadoDoDom } from './dom-mascote'
import { falaDe, textoDaFala } from './falas'
import { bipe, falar } from './voz'
import { useMudo } from './use-mudo'

/**
 * A aparição do Dom: quando a plataforma avisa uma conquista (`reagirDom`),
 * ele desliza da lateral, comemora com a voz gravada e um efeito (fogo,
 * confete, estrelas, coração), e sai sozinho. Um toque o dispensa.
 *
 * Educado de propósito: no máximo uma aparição a cada 25 s (a não ser que a
 * nova seja mais importante), nunca com o painel do Dom aberto, e nada em
 * prova em andamento — o lançador nem existe nessas telas.
 */

const INTERVALO_MINIMO_MS = 25_000
const NA_TELA_MS = 5200

const ESTADO_DO_EFEITO: Record<Reacao['efeito'], EstadoDoDom> = {
  fogo: 'animado',
  confete: 'orgulhoso',
  estrelas: 'feliz',
  coracao: 'preocupado',
  nenhum: 'feliz',
}

export function DomReacoes({ painelAberto, aoMudar }: { painelAberto: boolean; aoMudar?: (naTela: boolean) => void }) {
  const [atual, setAtual] = useState<(Reacao & { chave: number; texto: string; sequencia: number }) | null>(null)
  const [saindo, setSaindo] = useState(false)
  const [falando, setFalando] = useState(false)
  const [boca, setBoca] = useState(false)
  const mudo = useMudo()
  const ultimaRef = useRef<{ em: number; peso: number }>({ em: 0, peso: 0 })
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    aoMudar?.(!!atual)
  }, [atual, aoMudar])

  useEffect(() => {
    const limpar = () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
    const aoReagir = (e: Event) => {
      const r = (e as CustomEvent<Reacao & { sequencia: number }>).detail
      if (!r || painelAberto) return
      const agora = Date.now()
      const recente = agora - ultimaRef.current.em < INTERVALO_MINIMO_MS
      if (recente && r.peso <= ultimaRef.current.peso) return
      ultimaRef.current = { em: agora, peso: r.peso }
      const fala = falaDe(r.momento)
      limpar()
      setSaindo(false)
      setAtual({ ...r, chave: agora, texto: textoDaFala(fala), sequencia: r.sequencia })
      bipe('surgir')
      timers.current.push(
        setTimeout(() => falar(fala, { aoComecar: () => setFalando(true), aoTerminar: () => setFalando(false), aoBoca: setBoca }), 380),
        setTimeout(() => setSaindo(true), NA_TELA_MS),
        setTimeout(() => setAtual(null), NA_TELA_MS + 420),
      )
    }
    window.addEventListener(EVENTO_DO_DOM, aoReagir)
    return () => {
      window.removeEventListener(EVENTO_DO_DOM, aoReagir)
      limpar()
    }
  }, [painelAberto])

  if (!atual) return null
  const dispensar = () => {
    setSaindo(true)
    timers.current.push(setTimeout(() => setAtual(null), 400))
  }

  return (
    <div className="dom-aparicao" data-saindo={saindo || undefined} data-efeito={atual.efeito} key={atual.chave} role="status" aria-live="polite">
      <button type="button" className="dom-aparicao__balao" onClick={dispensar}>
        {atual.efeito === 'fogo' && atual.sequencia >= 3 && <span className="dom-aparicao__selo">
            <Flame className="h-3.5 w-3.5" aria-hidden /> {atual.sequencia} seguidas
          </span>}
        {atual.texto}
      </button>
      <button type="button" className="dom-aparicao__mascote" onClick={dispensar} aria-label="Dispensar o Dom">
        <DomMascote estado={ESTADO_DO_EFEITO[atual.efeito]} falando={falando} boca={boca} calado={mudo && !falando} />
        {atual.efeito !== 'nenhum' && <Efeito tipo={atual.efeito} />}
      </button>
    </div>
  )
}

function Efeito({ tipo }: { tipo: Exclude<Reacao['efeito'], 'nenhum'> }) {
  const n = tipo === 'confete' ? 26 : 14
  const cores =
    tipo === 'fogo' ? ['#ff6a00', '#ffb000', '#ff3d00', '#ffd36b'] : tipo === 'coracao' ? ['#ff6b8b', '#ff9fb2'] : ['#ef8a3c', '#e8b44a', '#2f7a5b', '#9fd8bf', '#6aa6ff']
  return (
    <span className={`dom-efeito dom-efeito--${tipo}`} aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${8 + ((i * 41) % 84)}%`,
            background: cores[i % cores.length],
            animationDelay: `${(i % 7) * 70}ms`,
            ['--dx' as string]: `${((i * 53) % 90) - 45}px`,
            ['--rot' as string]: `${(i * 97) % 540}deg`,
          }}
        />
      ))}
    </span>
  )
}
