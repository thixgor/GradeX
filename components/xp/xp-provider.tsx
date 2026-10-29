'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { LogoAnimada } from '@/components/marca/logo-animada'
import { CHAVE_XP_SUJO, EVENTO_DE_XP } from '@/lib/xp/cliente'
import type { AreaDeXp, InfoDeNivel, Medalha } from '@/lib/xp/regras'
import { AnelDeNivel, NumeroQueCorre, SeloDaLiga, estiloDaLiga } from './pecas'
import { tocarSomDeXp } from './som'
import '@/components/checkout/checkout-vidro.css'
import '@/components/marca/logo-animada.css'
import './xp.css'

/**
 * O XP no site inteiro.
 *
 * Fica no AppShell de quem está logado e faz três coisas:
 *
 * 1. **Lê o XP** (`/api/xp/eu`) e o deixa no contexto — o menu, o painel e o
 *    ranking leem daqui. O AppShell remonta a cada página, então a última
 *    leitura fica no `sessionStorage` por 60 s: navegar não refaz pedido.
 * 2. **Percebe o ganho.** Guarda o último total que a pessoa *viu*; quando o
 *    novo é maior, o "+XP" salta no topo com moedinhas. Funciona para qualquer
 *    seção, sem cada uma precisar contar ponto: quem resolve uma questão só
 *    dispara `avisarXp()` (ou nem isso — a próxima página já mostra).
 * 3. **Comemora a subida de nível** — tela cheia, logo girando, confete e um
 *    acorde. E, na primeira vez, revela o XP retroativo: "calculamos tudo o
 *    que você já estudou".
 *
 * Nada de `setInterval`: relê ao montar (se a cópia passou de 60 s), quando a
 * aba volta a ficar visível e depois de um `avisarXp()`.
 */

export interface DadosDeXp {
  total: number
  nivel: InfoDeNivel
  semana: number
  mes: number
  hoje: number
  porArea: Record<AreaDeXp, number>
  porDia: Record<string, number>
  medalhas: Medalha[]
  sequenciaAtual: number
  maiorSequencia: number
  diasAtivos: number
  posicaoSemana: number | null
  posicaoGeral: number | null
  oculto: boolean
  elegivel: boolean
  faculdade: string | null
}

interface ContextoDeXp {
  dados: DadosDeXp | null
  recarregar: (fresco?: boolean) => void
}

const Contexto = createContext<ContextoDeXp>({ dados: null, recarregar: () => {} })

export function useXp() {
  return useContext(Contexto)
}

const VALIDADE_MS = 60_000

function ler<T>(chave: string, area: 'session' | 'local' = 'session'): T | null {
  try {
    const bruto = (area === 'session' ? window.sessionStorage : window.localStorage).getItem(chave)
    return bruto ? (JSON.parse(bruto) as T) : null
  } catch {
    return null
  }
}
function gravar(chave: string, valor: unknown, area: 'session' | 'local' = 'session') {
  try {
    ;(area === 'session' ? window.sessionStorage : window.localStorage).setItem(chave, JSON.stringify(valor))
  } catch {}
}

type Ganho = { chave: number; xp: number; total: number; nivel: InfoDeNivel }
type Subida = { de: number; para: InfoDeNivel; novaLiga: boolean; apresentacao?: boolean; total: number }

export function XpProvider({ userId, children }: { userId: string | null | undefined; children: React.ReactNode }) {
  const [dados, setDados] = useState<DadosDeXp | null>(null)
  const [ganho, setGanho] = useState<Ganho | null>(null)
  const [subida, setSubida] = useState<Subida | null>(null)
  const pedindo = useRef(false)
  const espera = useRef<number | null>(null)

  const chaveCache = `da_xp:${userId}`
  const chaveVisto = `da_xp_visto:${userId}`
  const chaveApresentado = `da_xp_apresentado:${userId}`

  const receber = useCallback(
    (novo: DadosDeXp) => {
      setDados(novo)
      gravar(chaveCache, { em: Date.now(), dados: novo })
      const visto = ler<{ total: number; nivel: number; liga: string }>(chaveVisto, 'local')
      gravar(chaveVisto, { total: novo.total, nivel: novo.nivel.nivel, liga: novo.nivel.liga.id }, 'local')

      // Primeira vez: a revelação do XP retroativo.
      if (!visto) {
        if (novo.total > 0 && !ler(chaveApresentado, 'local')) {
          gravar(chaveApresentado, 1, 'local')
          setSubida({ de: 1, para: novo.nivel, novaLiga: false, apresentacao: true, total: novo.total })
        }
        return
      }
      if (novo.total > visto.total) {
        setGanho({ chave: Date.now(), xp: novo.total - visto.total, total: novo.total, nivel: novo.nivel })
        if (novo.nivel.nivel > visto.nivel) {
          setSubida({ de: visto.nivel, para: novo.nivel, novaLiga: novo.nivel.liga.id !== visto.liga, total: novo.total })
        } else {
          tocarSomDeXp('ponto')
        }
      }
    },
    [chaveCache, chaveVisto, chaveApresentado],
  )

  const recarregar = useCallback(
    (fresco = false) => {
      if (!userId || pedindo.current) return
      pedindo.current = true
      fetch(`/api/xp/eu${fresco ? '?fresco=1' : ''}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: DadosDeXp | null) => { if (d && typeof d.total === 'number') receber(d) })
        .catch(() => {})
        .finally(() => { pedindo.current = false })
    },
    [userId, receber],
  )

  // Ao montar: a cópia da sessão na hora; o servidor só se ela passou de 60 s.
  useEffect(() => {
    if (!userId) return
    const cache = ler<{ em: number; dados: DadosDeXp }>(chaveCache)
    if (cache?.dados) setDados(cache.dados)
    const sujo = Number(ler<number>(CHAVE_XP_SUJO) || 0)
    if (cache && sujo > cache.em) recarregar(true)
    else if (!cache || Date.now() - cache.em > VALIDADE_MS) recarregar()
  }, [userId, chaveCache, recarregar])

  // Depois de uma ação que dá XP; e quando a aba volta a ficar visível.
  useEffect(() => {
    if (!userId) return
    const aoGanhar = () => {
      if (espera.current) window.clearTimeout(espera.current)
      // Um respiro: o servidor termina de gravar e várias ações seguidas viram um pedido.
      espera.current = window.setTimeout(() => recarregar(true), 1200)
    }
    const aoVoltar = () => {
      if (document.visibilityState !== 'visible') return
      const cache = ler<{ em: number }>(chaveCache)
      if (!cache || Date.now() - cache.em > VALIDADE_MS) recarregar()
    }
    window.addEventListener(EVENTO_DE_XP, aoGanhar)
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      window.removeEventListener(EVENTO_DE_XP, aoGanhar)
      document.removeEventListener('visibilitychange', aoVoltar)
      if (espera.current) window.clearTimeout(espera.current)
    }
  }, [userId, chaveCache, recarregar])

  // O "+XP" some sozinho.
  useEffect(() => {
    if (!ganho) return
    const t = window.setTimeout(() => setGanho(null), 2800)
    return () => window.clearTimeout(t)
  }, [ganho])

  const valor = useMemo(() => ({ dados, recarregar }), [dados, recarregar])

  return (
    <Contexto.Provider value={valor}>
      {children}
      <ToastDeXp ganho={subida ? null : ganho} />
      <SubidaDeNivel subida={subida} fechar={() => setSubida(null)} />
    </Contexto.Provider>
  )
}

/* ══════════════════════════════ "+XP" ══════════════════════════════ */

function ToastDeXp({ ganho }: { ganho: Ganho | null }) {
  const [montado, setMontado] = useState(false)
  const calmo = useReducedMotion()
  useEffect(() => setMontado(true), [])
  if (!montado) return null
  return createPortal(
    <AnimatePresence>
      {ganho && (
        <motion.div
          key={ganho.chave}
          className="xp-toast"
          role="status"
          aria-live="polite"
          style={estiloDaLiga(ganho.nivel.liga)}
          initial={calmo ? { opacity: 0, x: '-50%' } : { opacity: 0, y: -24, x: '-50%', scale: 0.8 }}
          animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
          exit={{ opacity: 0, y: -16, x: '-50%', scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
        >
          <AnelDeNivel nivel={ganho.nivel.nivel} progresso={ganho.nivel.progresso} liga={ganho.nivel.liga} tamanho={40} />
          {!calmo && (
            <span className="xp-moedas" aria-hidden>
              {Array.from({ length: 8 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    '--x': `${Math.round(Math.cos((i / 8) * Math.PI * 2) * 34)}px`,
                    '--y': `${Math.round(Math.sin((i / 8) * Math.PI * 2) * 26 - 10)}px`,
                    '--atraso': `${i * 30}ms`,
                  } as React.CSSProperties}
                />
              ))}
            </span>
          )}
          <span>
            <b>+<NumeroQueCorre valor={ganho.xp} /> XP</b>
            <small>{Math.max(0, ganho.nivel.proximo - ganho.total).toLocaleString('pt-BR')} para o nível {ganho.nivel.nivel + 1}</small>
            <span className="xp-toast-barra" aria-hidden>
              <i style={{ width: `${Math.round(ganho.nivel.progresso * 100)}%` }} />
            </span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ═══════════════════════════ Subiu de nível ═══════════════════════════ */

const CORES_DO_CONFETE = ['#f0b23e', '#e8763a', '#4f9d63', '#5b6cf0', '#e05a8a', '#ffd978', '#9ff0e6']

function SubidaDeNivel({ subida, fechar }: { subida: Subida | null; fechar: () => void }) {
  const [montado, setMontado] = useState(false)
  const calmo = useReducedMotion()
  const router = useRouter()
  useEffect(() => setMontado(true), [])

  useEffect(() => {
    if (!subida) return
    tocarSomDeXp('nivel')
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [subida, fechar])

  const papeis = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        cor: CORES_DO_CONFETE[i % CORES_DO_CONFETE.length],
        x: `${Math.round((Math.random() - 0.5) * 900)}px`,
        sobe: `${-Math.round(120 + Math.random() * 220)}px`,
        g: `${Math.round((Math.random() - 0.5) * 1440)}deg`,
        atraso: `${(Math.random() * 0.5).toFixed(2)}s`,
      })),
    // Um sorteio por subida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subida?.para.nivel, subida?.apresentacao],
  )

  if (!montado) return null
  return createPortal(
    <AnimatePresence>
      {subida && (
        <motion.div
          className="xp-nivel-palco ck-escopo"
          style={estiloDaLiga(subida.para.liga)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={fechar}
          role="dialog"
          aria-modal="true"
          aria-labelledby="xp-nivel-titulo"
        >
          {!calmo && (
            <div className="xp-confete" aria-hidden>
              {papeis.map((p, i) => (
                <i
                  key={i}
                  style={{ background: p.cor, '--x': p.x, '--sobe': p.sobe, '--g': p.g, '--atraso': p.atraso } as React.CSSProperties}
                />
              ))}
            </div>
          )}
          <motion.div
            className="xp-nivel"
            onClick={(e) => e.stopPropagation()}
            initial={calmo ? { opacity: 0 } : { scale: 0.6, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          >
            <span className="xp-nivel-raios" aria-hidden />
            <LogoAnimada tamanho="compacto" nome={false} inclinacao="nenhuma" modo="gerando" />
            <p className="xp-nivel-rotulo">{subida.apresentacao ? 'Seu XP chegou' : 'Subiu de nível'}</p>
            <h2 id="xp-nivel-titulo" className="xp-nivel-numero">
              {calmo ? subida.para.nivel : <NumeroQueCorre valor={subida.para.nivel} formato={(v) => String(Math.round(v))} />}
            </h2>
            <SeloDaLiga liga={subida.para.liga} tamanho={56} />
            <p className="xp-nivel-texto">
              {subida.apresentacao ? (
                <>
                  Calculamos tudo o que você já estudou aqui, desde o primeiro dia:{' '}
                  <strong>{subida.total.toLocaleString('pt-BR')} XP</strong> — nível {subida.para.nivel}, liga{' '}
                  {subida.para.liga.nome}.
                </>
              ) : subida.novaLiga ? (
                <>Você entrou na liga <strong>{subida.para.liga.nome}</strong>. Poucos chegam aqui.</>
              ) : (
                <>Nível {subida.para.nivel} — mais {Math.max(0, subida.para.proximo - subida.total).toLocaleString('pt-BR')} XP para o próximo.</>
              )}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" className="ck-cta min-h-[48px]" onClick={fechar} autoFocus>
                Continuar
              </button>
              <button
                type="button"
                className="ck-botao min-h-[48px] !text-white"
                style={{ background: 'rgba(255,255,255,0.12)' }}
                onClick={() => { fechar(); router.push('/ranking') }}
              >
                Ver o ranking
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
