'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen, Brain, Check, ChevronDown, CloudRain, Coffee, Droplets, Flame, Maximize2, Music, Pause, Play,
  Smartphone, Sparkles, Square, Target, Volume2, VolumeX, Waves, Wind,
} from 'lucide-react'
import { useFocusSession, type MetodoDeFoco } from '@/hooks/use-focus-session'
import { formatarMinutos, formatarRelogio, minutosPorDia, sequenciaDeFoco, sugestoesDeObjetivo } from '@/lib/foco/ritmo-de-foco'
import { METODOS, PRATICAS, ROTULO_DA_EVIDENCIA, metodoPorId, type Evidencia } from '@/lib/foco/metodos'
import { FALAS_DE_FOCO } from '@/lib/foco/narracao'
import { AnelDeFoco } from './painel-de-foco'
import { Respiracao } from './respiracao'
import { Schulte, Stroop, ZigueZague, type JogoDeAtencao } from './jogos-de-atencao'
import { falarFoco, pararAmbiente, tocarAmbiente, tocarSino, volumeDoAmbiente, type Ambiente } from './som-do-foco'
import '@/components/checkout/checkout-vidro.css'
import './modo-foco.css'

/**
 * O Modo Foco — a sessão de foco virou um lugar.
 *
 * Antes era um cronômetro num painel. Agora a sessão tem começo, meio e fim
 * desenhados pela ciência do estudo (ver `lib/foco/metodos.ts`, cada item com
 * a força da evidência):
 *
 * 1. **Preparar** — escolher o método (Pomodoro, 52/17, ultradiano, livre),
 *    escrever a intenção exata (intenção de implementação), afastar o celular,
 *    e, se quiser, 1 min de suspiro cíclico ou de aquecimento de atenção.
 * 2. **Focar** — anel grande, ciclos em "tomates", som ambiente opcional e
 *    tela cheia. No fim do ciclo a sessão fecha sozinha e a pausa começa.
 * 3. **Pausar** — contagem regressiva, sugestão de pausa de verdade (levantar,
 *    água, olhar longe) ou um jogo curto em vez da rede social; no fim, um
 *    sino chama de volta.
 * 4. **Lembrar** — ao encerrar, recordação ativa: três coisas, de memória.
 *
 * A gamificação mede o que importa: minutos do dia contra a meta diária, a
 * chama de dias seguidos, os ciclos completos e o XP de foco (1 por minuto,
 * +15 por meta batida, até 180/dia). O XP sobe quando a sessão sincroniza — e
 * aí a celebração da marca aparece.
 */

const CHAVE_CICLO = 'gradex:foco:ciclo'
const CHAVE_PREFS = 'gradex:foco:prefs'

interface EstadoDoCiclo {
  metodo: MetodoDeFoco
  objetivo: string
  /** Ciclos completos nesta rodada. */
  feitos: number
  pausaAte?: number
  pausaLonga?: boolean
}

interface Preferencias {
  metodo: MetodoDeFoco
  ambiente: Ambiente
  volume: number
  metaDiaria: number
}

const PREFS_PADRAO: Preferencias = { metodo: 'pomodoro', ambiente: 'silencio', volume: 0.5, metaDiaria: 60 }

function ler<T>(chave: string): T | null {
  try {
    const v = window.localStorage.getItem(chave)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}
function gravar(chave: string, valor: unknown) {
  try {
    if (valor === null) window.localStorage.removeItem(chave)
    else window.localStorage.setItem(chave, JSON.stringify(valor))
  } catch {}
}

const ROTULO_AMBIENTE: Record<Ambiente, { nome: string; Icone: typeof Wind }> = {
  silencio: { nome: 'Silêncio', Icone: VolumeX },
  marrom: { nome: 'Ruído marrom', Icone: Wind },
  chuva: { nome: 'Chuva', Icone: CloudRain },
  lofi: { nome: 'Lo-fi', Icone: Music },
}

export function ModoFoco() {
  const calmo = useReducedMotion()
  const {
    currentSession, elapsedMs, startSession, pauseSession, resumeSession, finishSession,
    history, lastFinished, dismissLastFinished, saveRecall, isAuthenticated,
  } = useFocusSession()

  const [prefs, setPrefs] = useState<Preferencias>(PREFS_PADRAO)
  const [ciclo, setCiclo] = useState<EstadoDoCiclo | null>(null)
  const [objetivo, setObjetivo] = useState('')
  const [checklist, setChecklist] = useState({ celular: false, agua: false, aba: false })
  const [agora, setAgora] = useState(() => Date.now())
  const [aba, setAba] = useState<'respirar' | JogoDeAtencao>('zigue-zague')
  const [legenda, setLegenda] = useState<string | null>(null)
  const metadeAvisada = useRef<string | null>(null)

  useEffect(() => {
    setPrefs({ ...PREFS_PADRAO, ...(ler<Preferencias>(CHAVE_PREFS) || {}) })
    setCiclo(ler<EstadoDoCiclo>(CHAVE_CICLO))
  }, [])

  const mudarPrefs = (patch: Partial<Preferencias>) => {
    setPrefs((p) => {
      const n = { ...p, ...patch }
      gravar(CHAVE_PREFS, n)
      return n
    })
  }
  const mudarCiclo = useCallback((n: EstadoDoCiclo | null) => {
    setCiclo(n)
    gravar(CHAVE_CICLO, n)
  }, [])

  const dizer = useCallback((id: keyof typeof FALAS_DE_FOCO) => {
    falarFoco(id)
    setLegenda(FALAS_DE_FOCO[id].legenda)
  }, [])
  useEffect(() => {
    if (!legenda) return
    const t = window.setTimeout(() => setLegenda(null), 6000)
    return () => window.clearTimeout(t)
  }, [legenda])

  const emSessao = !!currentSession && currentSession.status !== 'finished'
  const naPausa = !emSessao && !!ciclo?.pausaAte && agora < ciclo.pausaAte
  const pausaAcabou = !emSessao && !!ciclo?.pausaAte && agora >= ciclo.pausaAte
  const fase: 'preparar' | 'focando' | 'pausa' | 'volta' | 'resumo' = emSessao
    ? 'focando'
    : naPausa
      ? 'pausa'
      : pausaAcabou
        ? 'volta'
        : lastFinished
          ? 'resumo'
          : 'preparar'
  // Em sessão vale o método dela; na pausa, o da rodada; fora disso, a escolha.
  const metodo = metodoPorId(
    emSessao ? currentSession?.method : fase === 'pausa' || fase === 'volta' ? ciclo?.metodo : prefs.metodo,
  )

  // Relógio da pausa (só enquanto ela corre).
  useEffect(() => {
    if (!ciclo?.pausaAte || emSessao) return
    let quadro = 0
    let ultimo = 0
    const passo = (t: number) => {
      if (t - ultimo > 250) {
        ultimo = t
        setAgora(Date.now())
      }
      if (Date.now() < (ciclo.pausaAte || 0)) quadro = requestAnimationFrame(passo)
      else setAgora(Date.now())
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [ciclo?.pausaAte, emSessao])

  // Fim da pausa: o sino chama de volta.
  const avisouVolta = useRef<number | null>(null)
  useEffect(() => {
    if (fase !== 'volta' || !ciclo?.pausaAte || avisouVolta.current === ciclo.pausaAte) return
    avisouVolta.current = ciclo.pausaAte
    tocarSino('volta')
    dizer('volta')
    try { navigator.vibrate?.([20, 80, 20]) } catch {}
  }, [fase, ciclo?.pausaAte, dizer])

  // O ciclo fecha sozinho na meta: vem a pausa (longa a cada N ciclos).
  const alvoMs = (currentSession?.targetMinutes || 0) * 60_000
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'active' || !alvoMs) return
    if (alvoMs >= 50 * 60_000 && elapsedMs >= alvoMs / 2 && metadeAvisada.current !== currentSession.id) {
      metadeAvisada.current = currentSession.id
      dizer('metade')
    }
    if (elapsedMs < alvoMs || metodo.id === 'livre') return
    finishSession()
    const feitos = (ciclo?.feitos || 0) + 1
    const longa = metodo.ciclosAteLonga > 0 && feitos % metodo.ciclosAteLonga === 0
    const minutos = longa ? metodo.pausaLonga : metodo.pausa
    mudarCiclo({ metodo: metodo.id, objetivo: currentSession.objective, feitos, pausaAte: Date.now() + minutos * 60_000, pausaLonga: longa })
    setAgora(Date.now())
    pararAmbiente()
    tocarSino('pausa')
    dizer(longa ? 'pausa-longa' : 'pausa')
  }, [elapsedMs, alvoMs, currentSession, metodo, ciclo?.feitos, finishSession, mudarCiclo, dizer])

  function comecar(texto = objetivo || ciclo?.objetivo || '') {
    const m = metodoPorId(ciclo && fase !== 'preparar' && fase !== 'resumo' ? ciclo.metodo : prefs.metodo)
    dismissLastFinished()
    startSession(texto, m.foco || undefined, m.id)
    mudarCiclo({ metodo: m.id, objetivo: texto.trim() || 'Sessão de foco', feitos: fase === 'volta' || fase === 'pausa' ? ciclo?.feitos || 0 : 0 })
    tocarSino('inicio')
    dizer('inicio')
    tocarAmbiente(prefs.ambiente, prefs.volume)
    setObjetivo('')
  }

  function encerrar() {
    if (emSessao) finishSession()
    mudarCiclo(null)
    pararAmbiente()
    tocarSino('fim')
    dizer('fim')
  }

  // Fora da sessão, nada de som ambiente.
  useEffect(() => {
    if (!emSessao) pararAmbiente()
  }, [emSessao])
  useEffect(() => () => pararAmbiente(), [])

  // ── Números do dia ──────────────────────────────────────────────────────
  const semana = useMemo(() => minutosPorDia(history), [history])
  const minutosHoje = semana[semana.length - 1]?.minutos || 0
  const minutosAoVivo = minutosHoje + (emSessao ? Math.floor(elapsedMs / 60_000) : 0)
  const sequencia = useMemo(() => sequenciaDeFoco(history), [history])
  const sugestoes = useMemo(() => sugestoesDeObjetivo(history), [history])
  const hojeChave = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const ciclosHoje = history.filter(
    (s) =>
      new Date(s.startedAt).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) === hojeChave &&
      !!s.targetMinutes &&
      s.totalTimeMs >= s.targetMinutes * 60_000,
  ).length
  const xpFocoHoje = Math.min(180, minutosAoVivo + ciclosHoje * 15)
  const fracaoMeta = Math.min(1, minutosAoVivo / Math.max(1, prefs.metaDiaria))

  return (
    <div className="ck-escopo mf-pagina">
      {/* ══════════ O dia ══════════ */}
      <section className="mf-dia" aria-label="Seu foco hoje">
        <AnelDeFoco fracao={fracaoMeta} tamanho={86} espessura={8} estado={fracaoMeta >= 1 ? 'meta' : 'ativo'}>
          <span className="mf-dia-min">{minutosAoVivo}</span>
          <span className="mf-dia-de">de {prefs.metaDiaria} min</span>
        </AnelDeFoco>
        <div className="mf-dia-fatos">
          <span><Flame className="h-4 w-4" style={{ color: '#f0782f' }} /><b>{sequencia}</b><small>{sequencia === 1 ? 'dia seguido' : 'dias seguidos'}</small></span>
          <span><Target className="h-4 w-4" style={{ color: '#e5484d' }} /><b>{ciclosHoje}</b><small>ciclos completos hoje</small></span>
          <span><Sparkles className="h-4 w-4" style={{ color: '#d39b16' }} /><b>{xpFocoHoje}</b><small>XP de foco hoje (até 180)</small></span>
        </div>
        <label className="mf-dia-meta">
          <small>Meta do dia</small>
          <select value={prefs.metaDiaria} onChange={(e) => mudarPrefs({ metaDiaria: Number(e.target.value) })} className="ck-campo !h-9 !w-auto !py-0 !text-[13px]">
            {[30, 60, 90, 120, 180, 240].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </label>
      </section>

      <AnimatePresence>
        {legenda && (
          <motion.p className="mf-legenda" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {legenda}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ══════════ O palco ══════════ */}
      <AnimatePresence mode="wait" initial={false}>
        {fase === 'focando' && currentSession && (
          <motion.section key="focando" className="mf-palco" data-fase="foco" {...entrada(calmo)}>
            <Zigue aria-hidden />
            <AnelDeFoco
              fracao={alvoMs ? elapsedMs / alvoMs : null}
              tamanho={232}
              espessura={14}
              estado={currentSession.status === 'paused' ? 'pausado' : 'ativo'}
            >
              <span className="mf-relogio">{alvoMs ? formatarRelogio(Math.max(0, alvoMs - elapsedMs)) : formatarRelogio(elapsedMs)}</span>
              <span className="mf-relogio-sub">
                {currentSession.status === 'paused' ? 'Pausada' : alvoMs ? 'restantes' : 'cronômetro livre'}
              </span>
            </AnelDeFoco>
            <p className="mf-objetivo">{currentSession.objective}</p>
            <Tomates metodo={metodo.id} feitos={ciclo?.feitos || 0} />
            <div className="mf-controles">
              {currentSession.status === 'active' ? (
                <button type="button" className="ck-botao min-h-[48px]" onClick={pauseSession}><Pause className="h-4 w-4" /> Pausar</button>
              ) : (
                <button type="button" className="ck-cta min-h-[48px]" onClick={resumeSession}><Play className="h-4 w-4" /> Retomar</button>
              )}
              <button type="button" className="ck-botao min-h-[48px]" onClick={encerrar}><Square className="h-4 w-4" /> Encerrar</button>
              <button
                type="button"
                className="ck-botao min-h-[48px]"
                onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
                aria-label="Tela cheia"
                title="Tela cheia"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
            <SomAmbiente prefs={prefs} mudar={mudarPrefs} tocando />
          </motion.section>
        )}

        {(fase === 'pausa' || fase === 'volta') && ciclo && (
          <motion.section key="pausa" className="mf-palco" data-fase="pausa" {...entrada(calmo)}>
            {fase === 'pausa' ? (
              <>
                <p className="mf-pausa-rotulo">{ciclo.pausaLonga ? 'Pausa longa' : 'Pausa'} · ciclo {ciclo.feitos} feito</p>
                <span className="mf-relogio mf-relogio-pausa">{formatarRelogio(Math.max(0, (ciclo.pausaAte || 0) - agora))}</span>
                <ul className="mf-pausa-dicas">
                  <li><Coffee className="h-4 w-4" /> Levanta e bebe água</li>
                  <li><Waves className="h-4 w-4" /> Olha para longe 20 s (regra 20-20-20)</li>
                  <li><Smartphone className="h-4 w-4" /> Rede social fica para depois — jogue um jogo de atenção abaixo</li>
                </ul>
                <button type="button" className="ck-link-discreto" onClick={() => mudarCiclo({ ...ciclo, pausaAte: Date.now() })}>Pular a pausa</button>
              </>
            ) : (
              <>
                <motion.p className="mf-volta" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>Hora de voltar</motion.p>
                <Tomates metodo={ciclo.metodo} feitos={ciclo.feitos} />
                <div className="mf-controles">
                  <button type="button" className="ck-cta mf-pulsa min-h-[52px]" onClick={() => comecar(ciclo.objetivo)}>
                    <Play className="h-4 w-4" /> Ciclo {ciclo.feitos + 1}: {ciclo.objetivo}
                  </button>
                  <button type="button" className="ck-botao min-h-[48px]" onClick={encerrar}>Encerrar por hoje</button>
                </div>
              </>
            )}
          </motion.section>
        )}

        {fase === 'resumo' && lastFinished && (
          <motion.section key="resumo" className="mf-palco" data-fase="resumo" {...entrada(calmo)}>
            <Resumo
              sessao={lastFinished}
              isAuthenticated={isAuthenticated}
              salvar={(t) => saveRecall(lastFinished.id, t)}
              maisUm={() => comecar(lastFinished.objective)}
              fechar={dismissLastFinished}
            />
          </motion.section>
        )}

        {fase === 'preparar' && (
          <motion.section key="preparar" className="mf-preparar" {...entrada(calmo)}>
            <h2 className="mf-h2">1. Escolha o método</h2>
            <div className="mf-metodos" role="radiogroup" aria-label="Método">
              {METODOS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={prefs.metodo === m.id}
                  className="mf-metodo"
                  onClick={() => mudarPrefs({ metodo: m.id })}
                >
                  <span className="mf-metodo-nome">{m.nome}</span>
                  <span className="mf-metodo-tempo">{m.foco ? `${m.foco}/${m.pausa}` : '∞'}</span>
                  <span className="mf-metodo-resumo">{m.resumo}</span>
                  <SeloDeEvidencia nivel={m.evidencia} />
                </button>
              ))}
            </div>
            <p className="mf-porque">{metodo.porque}</p>

            <h2 className="mf-h2 mt-7">2. O que exatamente você vai fazer?</h2>
            <input
              className="ck-campo mf-intencao"
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && comecar()}
              maxLength={100}
              placeholder="Ex.: resolver 20 questões de cardiologia"
              aria-label="Intenção da sessão"
            />
            <div className="mf-sugestoes">
              {sugestoes.map((s) => (
                <button key={s} type="button" className="mf-filtro-chip" aria-pressed={objetivo === s} onClick={() => setObjetivo(objetivo === s ? '' : s)}>{s}</button>
              ))}
            </div>
            <p className="mf-nota-ciencia">{PRATICAS.intencao.texto}</p>

            <h2 className="mf-h2 mt-7">3. Ambiente</h2>
            <div className="mf-checklist">
              <Marca feito={checklist.celular} aoMudar={() => setChecklist((c) => ({ ...c, celular: !c.celular }))} Icone={Smartphone} texto="Celular em outro cômodo" />
              <Marca feito={checklist.agua} aoMudar={() => setChecklist((c) => ({ ...c, agua: !c.agua }))} Icone={Droplets} texto="Água por perto" />
              <Marca feito={checklist.aba} aoMudar={() => setChecklist((c) => ({ ...c, aba: !c.aba }))} Icone={BookOpen} texto="Só a aba do estudo aberta" />
            </div>
            <SomAmbiente prefs={prefs} mudar={mudarPrefs} />

            <button type="button" className="ck-cta mf-comecar min-h-[56px]" onClick={() => comecar()}>
              <Play className="h-5 w-5" fill="currentColor" />
              {metodo.foco ? `Começar ${metodo.foco} min de foco` : 'Começar cronômetro'}
            </button>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ══════════ Ritual e pausa ativa ══════════ */}
      {fase !== 'focando' && (
        <section className="mf-treino" aria-labelledby="mf-treino-titulo">
          <h2 id="mf-treino-titulo" className="mf-h2">
            {fase === 'pausa' ? 'Pausa ativa' : 'Antes de começar'}
          </h2>
          <p className="mf-nota-ciencia">
            {fase === 'pausa' ? PRATICAS.micropausa.texto : 'Um minuto de respiração ou de aquecimento de atenção ajuda a entrar no ritmo.'}
          </p>
          <div className="ck-seg mf-seg-pequeno mt-3" role="tablist">
            {([
              ['zigue-zague', 'Zigue-zague'],
              ['schulte', 'Schulte'],
              ['stroop', 'Stroop'],
              ['respirar', 'Respirar'],
            ] as const).map(([id, nome]) => (
              <button key={id} role="tab" aria-selected={aba === id} className="ck-seg-opcao" data-ativo={aba === id ? '' : undefined} onClick={() => setAba(id)}>
                {nome}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {aba === 'zigue-zague' && <ZigueZague />}
            {aba === 'schulte' && <Schulte />}
            {aba === 'stroop' && <Stroop />}
            {aba === 'respirar' && <Respiracao />}
          </div>
        </section>
      )}

      <Ciencia />
    </div>
  )
}

function entrada(calmo: boolean | null) {
  return calmo
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 18, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -12, scale: 0.98 },
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
      }
}

/** O trilho em zigue-zague que corre atrás do anel — uma âncora para o olhar. */
function Zigue(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className="mf-zigue" viewBox="0 0 600 120" preserveAspectRatio="none" {...props}>
      <path d="M0 60 L50 20 L100 100 L150 20 L200 100 L250 20 L300 100 L350 20 L400 100 L450 20 L500 100 L550 20 L600 60" />
    </svg>
  )
}

/** Os ciclos da rodada como tomates: cheios os feitos, o atual pulsando. */
function Tomates({ metodo, feitos }: { metodo: MetodoDeFoco; feitos: number }) {
  const m = metodoPorId(metodo)
  if (!m.ciclosAteLonga) return feitos > 0 ? <p className="mf-tomates-texto">{feitos} ciclo{feitos === 1 ? '' : 's'} nesta rodada</p> : null
  const naRodada = feitos % m.ciclosAteLonga
  return (
    <div className="mf-tomates" aria-label={`${naRodada} de ${m.ciclosAteLonga} ciclos até a pausa longa`}>
      {Array.from({ length: m.ciclosAteLonga }, (_, i) => (
        <span key={i} data-feito={i < naRodada ? '' : undefined} data-atual={i === naRodada ? '' : undefined} />
      ))}
    </div>
  )
}

function Marca({ feito, aoMudar, Icone, texto }: { feito: boolean; aoMudar: () => void; Icone: typeof Wind; texto: string }) {
  return (
    <button type="button" className="mf-marca min-h-[44px]" aria-pressed={feito} onClick={() => { aoMudar(); if (!feito) tocarSino('toque') }}>
      <span className="mf-marca-caixa">{feito && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</span>
      <Icone className="h-4 w-4" />
      {texto}
    </button>
  )
}

function SomAmbiente({ prefs, mudar, tocando }: { prefs: Preferencias; mudar: (p: Partial<Preferencias>) => void; tocando?: boolean }) {
  return (
    <div className="mf-som">
      <div className="mf-som-opcoes" role="radiogroup" aria-label="Som ambiente">
        {(Object.keys(ROTULO_AMBIENTE) as Ambiente[]).map((a) => {
          const { nome, Icone } = ROTULO_AMBIENTE[a]
          return (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={prefs.ambiente === a}
              className="mf-filtro-chip"
              onClick={() => {
                mudar({ ambiente: a })
                if (tocando) tocarAmbiente(a, prefs.volume)
              }}
            >
              <Icone className="h-3.5 w-3.5" /> {nome}
            </button>
          )
        })}
      </div>
      {prefs.ambiente !== 'silencio' && (
        <label className="mf-som-volume">
          <Volume2 className="h-4 w-4" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={prefs.volume}
            onChange={(e) => {
              const v = Number(e.target.value)
              mudar({ volume: v })
              volumeDoAmbiente(v, prefs.ambiente)
            }}
            aria-label="Volume do som ambiente"
          />
        </label>
      )}
    </div>
  )
}

function SeloDeEvidencia({ nivel }: { nivel: Evidencia }) {
  return <span className="mf-evidencia" data-nivel={nivel}>{ROTULO_DA_EVIDENCIA[nivel]}</span>
}

function Resumo({
  sessao,
  isAuthenticated,
  salvar,
  maisUm,
  fechar,
}: {
  sessao: { totalTimeMs: number; objective: string; targetMinutes?: number; recall?: string; syncedToServer: boolean }
  isAuthenticated: boolean
  salvar: (texto: string) => void
  maisUm: () => void
  fechar: () => void
}) {
  const minutos = Math.round(sessao.totalTimeMs / 60_000)
  const bateu = !!sessao.targetMinutes && minutos >= sessao.targetMinutes
  const [itens, setItens] = useState<string[]>(() => (sessao.recall ? sessao.recall.split('\n') : ['', '', '']).concat(['', '', '']).slice(0, 3))
  const [salvo, setSalvo] = useState(!!sessao.recall)
  return (
    <div className="mf-resumo">
      <motion.span className="mf-resumo-selo" initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
        <Check className="h-7 w-7" strokeWidth={3} />
      </motion.span>
      <p className="mf-resumo-rotulo">{bateu ? 'Meta batida' : 'Sessão concluída'}</p>
      <p className="mf-relogio">{minutos < 1 ? '< 1 min' : formatarMinutos(minutos)}</p>
      <p className="mf-objetivo">{sessao.objective}</p>
      <p className="mf-nota-ciencia">
        {minutos < 1
          ? 'Sessões de menos de 1 minuto não entram no desempenho.'
          : isAuthenticated
            ? `+${Math.min(180, minutos) + (bateu ? 15 : 0)} XP de foco entram assim que a sessão sincronizar.`
            : 'Entre na sua conta para o tempo virar XP.'}
      </p>

      <div className="mf-recordacao">
        <p className="mf-h3"><Brain className="h-4 w-4" /> Recordação ativa: três coisas, de memória</p>
        {itens.map((v, i) => (
          <input
            key={i}
            className="ck-campo"
            value={v}
            onChange={(e) => {
              setSalvo(false)
              setItens((l) => l.map((x, j) => (j === i ? e.target.value : x)))
            }}
            placeholder={['O que você aprendeu primeiro?', 'Um detalhe que pode cair em prova', 'Uma dúvida que ficou'][i]}
            maxLength={180}
          />
        ))}
        <button
          type="button"
          className="ck-botao min-h-[44px]"
          disabled={!itens.some((x) => x.trim())}
          onClick={() => { salvar(itens.map((x) => x.trim()).join('\n')); setSalvo(true); tocarSino('toque') }}
        >
          {salvo ? <><Check className="h-4 w-4" /> Guardado no aparelho</> : 'Guardar'}
        </button>
        <p className="mf-nota-ciencia">{PRATICAS.recordacao.texto}</p>
      </div>

      <div className="mf-controles">
        <button type="button" className="ck-cta min-h-[48px]" onClick={maisUm}><Play className="h-4 w-4" /> Mais um ciclo</button>
        {isAuthenticated && <Link href="/profile?tab=desempenho" className="ck-botao min-h-[48px]">Ver desempenho</Link>}
        <button type="button" className="ck-link-discreto" onClick={fechar}>Fechar</button>
      </div>
    </div>
  )
}

function Ciencia() {
  const [aberto, setAberto] = useState(false)
  const lista = [
    ...METODOS.filter((m) => m.referencias.length).map((m) => ({ nome: m.nome, texto: m.porque, evidencia: m.evidencia, refs: m.referencias })),
    ...Object.values(PRATICAS).map((p) => ({ nome: p.nome, texto: p.texto, evidencia: p.evidencia, refs: [p.referencia] })),
  ]
  return (
    <section className="mf-ciencia">
      <button type="button" className="mf-ciencia-botao" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}>
        <span>
          <span className="mf-h2 block">A ciência por trás</span>
          <span className="mf-nota-ciencia block">Cada técnica com a força da evidência e a referência.</span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 transition-transform" style={{ transform: aberto ? 'rotate(180deg)' : undefined }} />
      </button>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.ul className="mf-ciencia-lista" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {lista.map((item) => (
              <li key={item.nome}>
                <p className="mf-ciencia-nome">{item.nome} <SeloDeEvidencia nivel={item.evidencia} /></p>
                <p>{item.texto}</p>
                {item.refs.map((r) => (
                  <p key={r.titulo} className="mf-ref">{r.autores} ({r.ano}). {r.titulo}. <i>{r.revista}</i>.</p>
                ))}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  )
}
