'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { RotateCcw, Trophy } from 'lucide-react'
import { registrarXp } from '@/lib/xp/cliente'
import { tocarSino, falarFoco } from './som-do-foco'

/**
 * Os jogos de atenção do Modo Foco — aquecimento antes do estudo e pausa ativa
 * sem rede social. Três paradigmas clássicos da psicologia, implementados
 * aqui do zero:
 *
 * - **Zigue-zague** — o ponto corre em zigue-zague e acende: dourado é para
 *   tocar, vermelho é para segurar. É a lógica dos testes de atenção
 *   sustentada (CPT, Rosvold 1956; SART, Robertson et al. 1997) somada ao
 *   rastreio visual do movimento. A velocidade sobe com o tempo.
 * - **Tabela de Schulte** — de 1 a 25, na ordem, o mais rápido possível: busca
 *   visual e atenção dividida. Erro custa 2 s.
 * - **Stroop** (Stroop, 1935) — a palavra diz uma cor, a tinta é outra:
 *   responder a tinta treina o controle inibitório. Mostra o "custo de
 *   interferência" em milissegundos.
 *
 * Cada jogo terminado registra XP de jogo (com o teto diário da área), e o
 * recorde fica no aparelho.
 */

export type JogoDeAtencao = 'zigue-zague' | 'schulte' | 'stroop'

function lerRecorde(chave: string): number | null {
  try {
    const v = window.localStorage.getItem(chave)
    return v === null ? null : Number(v)
  } catch {
    return null
  }
}
function gravarRecorde(chave: string, valor: number, melhorMaior: boolean): boolean {
  const atual = lerRecorde(chave)
  const melhor = atual === null || (melhorMaior ? valor > atual : valor < atual)
  if (melhor) {
    try { window.localStorage.setItem(chave, String(valor)) } catch {}
  }
  return melhor
}
const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

function Resultado({
  titulo,
  numeros,
  recorde,
  aoRepetir,
}: {
  titulo: string
  numeros: Array<{ v: string; r: string }>
  recorde: boolean
  aoRepetir: () => void
}) {
  return (
    <motion.div className="mf-resultado" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      {recorde && (
        <motion.p className="mf-recorde" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <Trophy className="h-4 w-4" /> Novo recorde!
        </motion.p>
      )}
      <h3 className="mf-resultado-titulo">{titulo}</h3>
      <div className="mf-resultado-numeros">
        {numeros.map((n) => (
          <span key={n.r}>
            <b>{n.v}</b>
            <small>{n.r}</small>
          </span>
        ))}
      </div>
      <button type="button" className="ck-botao min-h-[44px]" onClick={aoRepetir}>
        <RotateCcw className="h-4 w-4" /> Jogar de novo
      </button>
    </motion.div>
  )
}

/* ═══════════════════════════════ Zigue-zague ═══════════════════════════════ */

const DURACAO_ZZ = 60
const tri = (u: number) => 1 - Math.abs((((u % 2) + 2) % 2) - 1)

export function ZigueZague() {
  const calmo = useReducedMotion()
  const [fase, setFase] = useState<'pronto' | 'contagem' | 'jogando' | 'fim'>('pronto')
  const [contagem, setContagem] = useState(3)
  const [placar, setPlacar] = useState({ pontos: 0, combo: 0, acertos: 0, alvos: 0, falsos: 0, rts: [] as number[] })
  const [restante, setRestante] = useState(DURACAO_ZZ)
  const [flutuantes, setFlutuantes] = useState<Array<{ id: number; x: number; y: number; texto: string; ruim?: boolean }>>([])
  const [tremer, setTremer] = useState(false)
  const [recorde, setRecorde] = useState(false)

  const arenaRef = useRef<HTMLDivElement>(null)
  const pontoRef = useRef<HTMLSpanElement>(null)
  const rastroRef = useRef<Array<HTMLSpanElement | null>>([])
  const estado = useRef({
    inicio: 0,
    estimulo: null as null | { tipo: 'alvo' | 'distrator'; desde: number; ate: number; respondido: boolean },
    proximo: 0,
    pos: { x: 0, y: 0 },
    historico: [] as Array<{ x: number; y: number }>,
  })
  const placarRef = useRef(placar)
  placarRef.current = placar

  const flutuar = useCallback((texto: string, ruim = false) => {
    const { x, y } = estado.current.pos
    const id = Date.now() + Math.random()
    setFlutuantes((f) => [...f.slice(-6), { id, x, y, texto, ruim }])
    window.setTimeout(() => setFlutuantes((f) => f.filter((i) => i.id !== id)), 800)
  }, [])

  const comecar = () => {
    setPlacar({ pontos: 0, combo: 0, acertos: 0, alvos: 0, falsos: 0, rts: [] })
    setRestante(DURACAO_ZZ)
    setRecorde(false)
    setContagem(3)
    setFase('contagem')
    falarFoco('aquecimento')
  }

  useEffect(() => {
    if (fase !== 'contagem') return
    if (contagem === 0) {
      estado.current.inicio = performance.now()
      estado.current.proximo = performance.now() + 900
      estado.current.estimulo = null
      setFase('jogando')
      tocarSino('inicio')
      return
    }
    tocarSino('toque')
    const t = window.setTimeout(() => setContagem((c) => c - 1), 700)
    return () => window.clearTimeout(t)
  }, [fase, contagem])

  // O laço do jogo: posição em zigue-zague, estímulos e o relógio.
  useEffect(() => {
    if (fase !== 'jogando') return
    let quadro = 0
    let ultimoSegundo = DURACAO_ZZ
    const passo = (agora: number) => {
      const e = estado.current
      const t = (agora - e.inicio) / 1000
      const arena = arenaRef.current
      if (!arena) return
      const L = arena.clientWidth - 36
      const A = arena.clientHeight - 36
      // Horizontal devagar, vertical rápido: o zigue-zague. Tudo acelera com o tempo.
      const acel = 1 + t / 40
      const x = tri(t * 0.32 * acel) * L
      const y = tri(t * 1.05 * acel) * A
      e.pos = { x, y }
      e.historico.unshift({ x, y })
      e.historico.length = Math.min(e.historico.length, 18)
      if (pontoRef.current) pontoRef.current.style.transform = `translate(${x}px, ${y}px)`
      rastroRef.current.forEach((el, i) => {
        const p = e.historico[(i + 1) * 3]
        if (el && p) el.style.transform = `translate(${p.x}px, ${p.y}px) scale(${1 - i * 0.15})`
      })

      // Estímulo: acende dourado (alvo, 70%) ou vermelho (distrator, 30%).
      const janela = Math.max(420, 700 - t * 4)
      if (e.estimulo && agora > e.estimulo.ate) {
        if (e.estimulo.tipo === 'alvo' && !e.estimulo.respondido) {
          setPlacar((p) => ({ ...p, combo: 0 }))
        }
        e.estimulo = null
        if (pontoRef.current) pontoRef.current.dataset.estado = ''
        e.proximo = agora + 700 + Math.random() * 700
      }
      if (!e.estimulo && agora > e.proximo) {
        const tipo = Math.random() < 0.7 ? 'alvo' : 'distrator'
        e.estimulo = { tipo, desde: agora, ate: agora + janela, respondido: false }
        if (pontoRef.current) pontoRef.current.dataset.estado = tipo
        if (tipo === 'alvo') setPlacar((p) => ({ ...p, alvos: p.alvos + 1 }))
      }

      const seg = Math.max(0, DURACAO_ZZ - Math.floor(t))
      if (seg !== ultimoSegundo) {
        ultimoSegundo = seg
        setRestante(seg)
      }
      if (t >= DURACAO_ZZ) {
        setFase('fim')
        return
      }
      quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [fase])

  const responder = useCallback(() => {
    if (fase !== 'jogando') return
    const e = estado.current
    const agora = performance.now()
    if (e.estimulo?.tipo === 'alvo' && !e.estimulo.respondido) {
      e.estimulo.respondido = true
      const rt = Math.round(agora - e.estimulo.desde)
      const combo = placarRef.current.combo + 1
      const ganho = 10 + Math.min(combo, 10) * 2
      setPlacar((p) => ({ ...p, pontos: p.pontos + ganho, combo, acertos: p.acertos + 1, rts: [...p.rts, rt] }))
      flutuar(`+${ganho}${combo >= 3 ? ` ×${combo}` : ''}`)
      tocarSino('toque')
      if (pontoRef.current) pontoRef.current.dataset.estado = 'acerto'
    } else {
      setPlacar((p) => ({ ...p, pontos: Math.max(0, p.pontos - 5), combo: 0, falsos: p.falsos + 1 }))
      flutuar('−5', true)
      tocarSino('erro')
      setTremer(true)
      window.setTimeout(() => setTremer(false), 300)
    }
  }, [fase, flutuar])

  useEffect(() => {
    if (fase !== 'jogando') return
    const aoTeclar = (ev: KeyboardEvent) => {
      if (ev.code === 'Space') {
        ev.preventDefault()
        responder()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [fase, responder])

  // Fim: recorde e XP.
  useEffect(() => {
    if (fase !== 'fim') return
    const p = placarRef.current
    setRecorde(gravarRecorde('da_foco_recorde_zz', p.pontos, true))
    tocarSino('fim')
    registrarXp({ tipo: 'jogo', area: 'foco-zigue-zague', recursoId: hoje(), acertos: p.acertos, total: Math.max(p.alvos, 1) })
  }, [fase])

  const rtMedio = placar.rts.length ? Math.round(placar.rts.reduce((a, b) => a + b, 0) / placar.rts.length) : 0

  return (
    <div className="mf-jogo">
      <div className="mf-jogo-topo">
        <span><b>{placar.pontos}</b> pontos</span>
        {placar.combo >= 2 && <span className="mf-combo">combo ×{placar.combo}</span>}
        <span className="tabular-nums">{restante}s</span>
      </div>
      <div
        ref={arenaRef}
        className={`mf-arena ${tremer ? 'mf-treme' : ''}`}
        onPointerDown={responder}
        role="button"
        aria-label="Toque quando o ponto ficar dourado"
        tabIndex={0}
      >
        {fase === 'jogando' && (
          <>
            {!calmo && Array.from({ length: 5 }, (_, i) => (
              <span key={i} ref={(el) => { rastroRef.current[i] = el }} className="mf-rastro" style={{ opacity: 0.3 - i * 0.05 }} />
            ))}
            <span ref={pontoRef} className="mf-ponto" />
            <AnimatePresence>
              {flutuantes.map((f) => (
                <motion.span
                  key={f.id}
                  className="mf-flutuante"
                  data-ruim={f.ruim ? '' : undefined}
                  style={{ left: f.x + 18, top: f.y }}
                  initial={{ opacity: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: 1, y: -34, scale: 1 }}
                  exit={{ opacity: 0, y: -50 }}
                >
                  {f.texto}
                </motion.span>
              ))}
            </AnimatePresence>
          </>
        )}
        {fase === 'pronto' && (
          <div className="mf-arena-centro">
            <p>Siga o ponto com os olhos. <b style={{ color: '#f0b23e' }}>Dourado</b>: toque. <b style={{ color: '#e5484d' }}>Vermelho</b>: segure.</p>
            <button type="button" className="ck-cta min-h-[48px]" onClick={(e) => { e.stopPropagation(); comecar() }}>Começar · 60 s</button>
            <small>No computador, a barra de espaço também vale.</small>
          </div>
        )}
        {fase === 'contagem' && (
          <motion.p key={contagem} className="mf-contagem" initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {contagem || 'Já!'}
          </motion.p>
        )}
        {fase === 'fim' && (
          <div className="mf-arena-centro" onPointerDown={(e) => e.stopPropagation()}>
            <Resultado
              titulo="Atenção aquecida"
              recorde={recorde}
              aoRepetir={comecar}
              numeros={[
                { v: String(placar.pontos), r: 'pontos' },
                { v: `${placar.acertos}/${placar.alvos}`, r: 'dourados pegos' },
                { v: String(placar.falsos), r: 'toques errados' },
                { v: rtMedio ? `${rtMedio} ms` : '—', r: 'reação média' },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════ Schulte ═══════════════════════════════ */

function embaralhar<T>(lista: T[]): T[] {
  const a = [...lista]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function Schulte() {
  const [numeros, setNumeros] = useState<number[]>(() => embaralhar(Array.from({ length: 25 }, (_, i) => i + 1)))
  const [proximo, setProximo] = useState(1)
  const [inicio, setInicio] = useState<number | null>(null)
  const [penalidade, setPenalidade] = useState(0)
  const [agora, setAgora] = useState(0)
  const [errado, setErrado] = useState<number | null>(null)
  const [fim, setFim] = useState<number | null>(null)
  const [recorde, setRecorde] = useState(false)

  useEffect(() => {
    if (inicio === null || fim !== null) return
    let quadro = 0
    const passo = () => {
      setAgora(performance.now())
      quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [inicio, fim])

  const tempo = fim ?? (inicio === null ? 0 : (agora - inicio) / 1000 + penalidade)

  function tocar(n: number) {
    if (fim !== null) return
    const t0 = inicio ?? performance.now()
    if (inicio === null) setInicio(t0)
    if (n === proximo) {
      tocarSino('toque')
      if (n === 25) {
        const total = (performance.now() - t0) / 1000 + penalidade
        setFim(total)
        setRecorde(gravarRecorde('da_foco_recorde_schulte', Math.round(total * 10) / 10, false))
        tocarSino('fim')
        registrarXp({ tipo: 'jogo', area: 'foco-schulte', recursoId: hoje() })
      }
      setProximo(n + 1)
    } else {
      tocarSino('erro')
      setPenalidade((p) => p + 2)
      setErrado(n)
      window.setTimeout(() => setErrado(null), 350)
    }
  }

  function reiniciar() {
    setNumeros(embaralhar(Array.from({ length: 25 }, (_, i) => i + 1)))
    setProximo(1)
    setInicio(null)
    setPenalidade(0)
    setFim(null)
    setRecorde(false)
  }

  return (
    <div className="mf-jogo">
      <div className="mf-jogo-topo">
        <span>Próximo: <b>{Math.min(proximo, 25)}</b></span>
        {penalidade > 0 && <span className="mf-combo" data-ruim="">+{penalidade}s de erro</span>}
        <span className="tabular-nums">{tempo.toFixed(1)}s</span>
      </div>
      {fim === null ? (
        <div className="mf-schulte">
          {numeros.map((n) => (
            <button
              key={n}
              type="button"
              className="mf-celula min-h-[44px]"
              data-feito={n < proximo ? '' : undefined}
              data-errado={errado === n ? '' : undefined}
              onClick={() => tocar(n)}
            >
              {n}
            </button>
          ))}
        </div>
      ) : (
        <Resultado
          titulo="Tabela completa"
          recorde={recorde}
          aoRepetir={reiniciar}
          numeros={[
            { v: `${fim.toFixed(1)}s`, r: 'tempo total' },
            { v: String(penalidade / 2), r: 'erros' },
            { v: lerRecorde('da_foco_recorde_schulte') ? `${lerRecorde('da_foco_recorde_schulte')}s` : '—', r: 'seu recorde' },
          ]}
        />
      )}
      <p className="mf-dica">Olhe para o centro da tabela e tente achar os números com a visão periférica.</p>
    </div>
  )
}

/* ═══════════════════════════════ Stroop ═══════════════════════════════ */

const CORES = [
  { nome: 'VERMELHO', cor: '#e5484d' },
  { nome: 'AZUL', cor: '#3b82f6' },
  { nome: 'VERDE', cor: '#22a06b' },
  { nome: 'AMARELO', cor: '#e0a400' },
] as const
const RODADAS_STROOP = 24

export function Stroop() {
  const sorteio = useMemo(
    () => () =>
      Array.from({ length: RODADAS_STROOP }, () => {
        const palavra = Math.floor(Math.random() * 4)
        const congruente = Math.random() < 0.5
        const tinta = congruente ? palavra : (palavra + 1 + Math.floor(Math.random() * 3)) % 4
        return { palavra, tinta, congruente }
      }),
    [],
  )
  const [rodadas, setRodadas] = useState(sorteio)
  const [i, setI] = useState(0)
  const [respostas, setRespostas] = useState<Array<{ certo: boolean; rt: number; congruente: boolean }>>([])
  const [desde, setDesde] = useState(0)
  const [flash, setFlash] = useState<'certo' | 'errado' | null>(null)
  const [comecou, setComecou] = useState(false)
  const [recorde, setRecorde] = useState(false)
  const acabou = respostas.length >= RODADAS_STROOP

  useEffect(() => { if (comecou) setDesde(performance.now()) }, [i, comecou])

  const responder = useCallback(
    (cor: number) => {
      if (!comecou || acabou) return
      const r = rodadas[i]
      const certo = cor === r.tinta
      const rt = Math.round(performance.now() - desde)
      setRespostas((lista) => [...lista, { certo, rt, congruente: r.congruente }])
      setFlash(certo ? 'certo' : 'errado')
      tocarSino(certo ? 'toque' : 'erro')
      window.setTimeout(() => setFlash(null), 180)
      setI((n) => Math.min(n + 1, RODADAS_STROOP - 1))
    },
    [comecou, acabou, rodadas, i, desde],
  )

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= 4) responder(n - 1)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [responder])

  const media = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0)
  const certas = respostas.filter((r) => r.certo)
  const custo = media(certas.filter((r) => !r.congruente).map((r) => r.rt)) - media(certas.filter((r) => r.congruente).map((r) => r.rt))

  useEffect(() => {
    if (!acabou) return
    tocarSino('fim')
    const pct = Math.round((certas.length / RODADAS_STROOP) * 100)
    setRecorde(pct >= 90 && gravarRecorde('da_foco_recorde_stroop', Math.max(0, custo), false))
    registrarXp({ tipo: 'jogo', area: 'foco-stroop', recursoId: hoje(), acertos: certas.length, total: RODADAS_STROOP })
    // Uma vez, ao acabar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acabou])

  function reiniciar() {
    setRodadas(sorteio())
    setI(0)
    setRespostas([])
    setRecorde(false)
    setComecou(true)
  }

  const r = rodadas[i]
  return (
    <div className="mf-jogo">
      <div className="mf-jogo-topo">
        <span><b>{Math.min(respostas.length + (acabou ? 0 : 1), RODADAS_STROOP)}</b>/{RODADAS_STROOP}</span>
        <span>{certas.length} certas</span>
      </div>
      {acabou ? (
        <Resultado
          titulo="Controle inibitório"
          recorde={recorde}
          aoRepetir={reiniciar}
          numeros={[
            { v: `${Math.round((certas.length / RODADAS_STROOP) * 100)}%`, r: 'acerto' },
            { v: `${media(certas.map((x) => x.rt))} ms`, r: 'tempo médio' },
            { v: `${Math.max(0, custo)} ms`, r: 'custo de interferência' },
          ]}
        />
      ) : !comecou ? (
        <div className="mf-arena-centro mf-stroop-intro">
          <p>Responda a <b>cor da tinta</b>, não a palavra. Teclas 1 a 4 também valem.</p>
          <button type="button" className="ck-cta min-h-[48px]" onClick={() => setComecou(true)}>Começar · 24 rodadas</button>
        </div>
      ) : (
        <>
          <div className="mf-stroop-palavra" data-flash={flash || undefined}>
            <motion.span key={i} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ color: CORES[r.tinta].cor }}>
              {CORES[r.palavra].nome}
            </motion.span>
          </div>
          <div className="mf-stroop-botoes">
            {CORES.map((c, n) => (
              <button key={c.nome} type="button" className="mf-stroop-botao min-h-[48px]" onClick={() => responder(n)}>
                <span style={{ background: c.cor }} aria-hidden />
                {c.nome.charAt(0) + c.nome.slice(1).toLowerCase()}
                <small>{n + 1}</small>
              </button>
            ))}
          </div>
        </>
      )}
      <p className="mf-dica">O &ldquo;custo de interferência&rdquo; é quanto a palavra errada te atrasa. Ele cai com treino.</p>
    </div>
  )
}
