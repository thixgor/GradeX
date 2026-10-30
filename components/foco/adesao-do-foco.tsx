'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Lock, Play, Timer, X } from 'lucide-react'
import { useFocusSession, type MetodoDeFoco } from '@/hooks/use-focus-session'
import { minutosPorDia, sequenciaDeFoco } from '@/lib/foco/ritmo-de-foco'
import { metodoPorId } from '@/lib/foco/metodos'
import { tocarSino } from './som-do-foco'
import '@/components/checkout/checkout-vidro.css'
import './adesao-do-foco.css'

/**
 * As estratégias de adesão da sessão de foco — o que faz a pessoa usar de
 * verdade, e não só saber que existe.
 *
 * 1. **Convite no ponto de ação.** Abriu o Banco, um material, uma aula, os
 *    flashcards, o Manual — e não há sessão rodando: um convite com um toque só
 *    ("Começar 25 min"), já com o objetivo preenchido pela área. Pedir no
 *    momento em que a pessoa vai estudar é a "intenção de implementação" feita
 *    pelo app (Gollwitzer & Sheeran, 2006). Com freio: uma vez por área por
 *    dia, no máximo três por dia, "Agora não" cala por 2 h e "Não perguntar
 *    hoje" até amanhã.
 * 2. **Incentivo verificável.** O convite lembra o combo: acerto no banco
 *    durante a sessão vale +5 XP — conferido no servidor pelo horário.
 * 3. **Aversão à perda.** Depois das 18 h, com sequência de dias e nenhum
 *    minuto hoje: "sua chama de N dias apaga à meia-noite".
 * 4. **Modo rígido** (opcional, no Modo Foco): durante a sessão, as áreas que
 *    não são estudo (loja, rifas, fórum, jogos) pedem confirmação, e sair da
 *    aba pausa o cronômetro (no hook).
 */

const ROTAS_DE_ESTUDO: Array<[RegExp, string]> = [
  [/^\/banco-questoes(\/|$)/, 'Banco de Questões'],
  [/^\/materiais\/(?!checkout)[^/]+/, 'Ler um material'],
  [/^\/aulas(\/|$)/, 'Assistir aulas'],
  [/^\/flashcards\/d\//, 'Revisar flashcards'],
  [/^\/manual-clinico(\/|$)(?!checkout)/, 'Manual Clínico'],
  [/^\/anatomia(\/|$)/, 'Anatomia'],
  [/^\/mapa-mental\/[^/]+/, 'Mapa mental'],
]

/** Fora do estudo: no modo rígido, pedem confirmação durante a sessão. */
const ROTAS_FORA_DO_ESTUDO = [/^\/loja/, /^\/rifas/, /^\/comprar/, /^\/oferta/, /^\/pacotes/, /^\/buy/, /^\/upgrade/, /^\/forum/, /^\/games/, /^\/embaixadores/]

/** Nunca interromper: checkout, compra, a própria prova em andamento. */
const ROTAS_SILENCIOSAS = [/checkout/, /^\/compra/, /^\/exam\//, /^\/profile/]

const CHAVE = 'gradex:foco:convites'

interface Registro {
  dia: string
  areas: string[]
  total: number
  caladoAte?: number
  chamaAvisada?: boolean
}

const hojeSP = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
const horaSP = () => Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' }))

function lerRegistro(): Registro {
  try {
    const r = JSON.parse(window.localStorage.getItem(CHAVE) || 'null') as Registro | null
    if (r && r.dia === hojeSP()) return r
    return { dia: hojeSP(), areas: [], total: 0, caladoAte: r?.caladoAte }
  } catch {
    return { dia: hojeSP(), areas: [], total: 0 }
  }
}
function gravarRegistro(r: Registro) {
  try { window.localStorage.setItem(CHAVE, JSON.stringify(r)) } catch {}
}

function metodoPreferido(): MetodoDeFoco {
  try {
    const p = JSON.parse(window.localStorage.getItem('gradex:foco:prefs') || 'null') as { metodo?: MetodoDeFoco } | null
    return p?.metodo && p.metodo !== 'livre' ? p.metodo : 'pomodoro'
  } catch {
    return 'pomodoro'
  }
}

type Convite = { tipo: 'estudo' | 'chama'; area: string; sequencia: number }

export function AdesaoDoFoco() {
  const pathname = usePathname() || ''
  const router = useRouter()
  const { currentSession, history, startSession, finishSession, rigido } = useFocusSession()
  const [convite, setConvite] = useState<Convite | null>(null)

  const emSessao = !!currentSession && currentSession.status !== 'finished'
  const area = useMemo(() => ROTAS_DE_ESTUDO.find(([re]) => re.test(pathname))?.[1] || null, [pathname])
  const silenciosa = ROTAS_SILENCIOSAS.some((re) => re.test(pathname))
  const sequencia = useMemo(() => sequenciaDeFoco(history), [history])
  const minutosHoje = useMemo(() => {
    const semana = minutosPorDia(history)
    return semana[semana.length - 1]?.minutos || 0
  }, [history])

  // Decide se convida — 5 s depois de chegar à página, para não pular na cara.
  useEffect(() => {
    setConvite(null)
    if (emSessao || silenciosa) return
    const t = window.setTimeout(() => {
      // Outra camada aberta (jornada, celebração, subida de nível): fica para depois.
      if (document.querySelector('.jd-palco, .xp-nivel-palco, .xc-palco, [role="dialog"][aria-modal="true"]')) return
      const r = lerRegistro()
      if (r.caladoAte && Date.now() < r.caladoAte) return
      if (sequencia > 0 && minutosHoje === 0 && horaSP() >= 18 && !r.chamaAvisada) {
        setConvite({ tipo: 'chama', area: area || 'Estudo', sequencia })
        gravarRegistro({ ...r, chamaAvisada: true })
        return
      }
      if (!area || r.areas.includes(area) || r.total >= 3) return
      setConvite({ tipo: 'estudo', area, sequencia })
      gravarRegistro({ ...r, areas: [...r.areas, area], total: r.total + 1 })
    }, 5000)
    return () => window.clearTimeout(t)
  }, [pathname, emSessao, silenciosa, area, sequencia, minutosHoje])

  // Começou a sessão por qualquer caminho: o convite some.
  useEffect(() => { if (emSessao) setConvite(null) }, [emSessao])

  function comecar() {
    const m = metodoPorId(metodoPreferido())
    startSession(convite?.area || area || 'Sessão de foco', m.foco || 25, m.id)
    tocarSino('inicio')
    setConvite(null)
  }
  function calar(horas: number | 'hoje') {
    const r = lerRegistro()
    const ate = horas === 'hoje'
      ? new Date(`${hojeSP()}T23:59:59-03:00`).getTime()
      : Date.now() + horas * 3_600_000
    gravarRegistro({ ...r, caladoAte: ate })
    setConvite(null)
  }

  const bloqueado = rigido && emSessao && currentSession?.status === 'active' && ROTAS_FORA_DO_ESTUDO.some((re) => re.test(pathname))
  const minutosMetodo = metodoPorId(typeof window !== 'undefined' ? metodoPreferido() : 'pomodoro').foco || 25

  return (
    <>
      <AnimatePresence>
        {convite && (
          <motion.aside
            className="ck-escopo af-convite"
            data-tipo={convite.tipo}
            role="status"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <button type="button" className="af-fechar" onClick={() => calar(2)} aria-label="Agora não">
              <X className="h-4 w-4" />
            </button>
            <span className="af-icone" aria-hidden>
              {convite.tipo === 'chama' ? <Flame className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              {convite.tipo === 'chama' ? (
                <>
                  <p className="af-titulo">Sua chama de {convite.sequencia} {convite.sequencia === 1 ? 'dia' : 'dias'} apaga à meia-noite</p>
                  <p className="af-texto">Uma sessão de {minutosMetodo} min agora mantém a sequência — e vale XP.</p>
                </>
              ) : (
                <>
                  <p className="af-titulo">Estudar com o cronômetro?</p>
                  <p className="af-texto">
                    Questões acertadas durante o foco valem <b>+5 XP extras</b>. {minutosMetodo} min de {convite.area.toLowerCase()} agora?
                  </p>
                </>
              )}
              <div className="af-acoes">
                <button type="button" className="ck-cta af-cta min-h-[40px]" onClick={comecar}>
                  <Play className="h-3.5 w-3.5" fill="currentColor" /> Começar {minutosMetodo} min
                </button>
                <button type="button" className="ck-link-discreto" onClick={() => calar('hoje')}>Não perguntar hoje</button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bloqueado && (
          <motion.div className="ck-escopo af-bloqueio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="af-bloqueio-titulo">
            <motion.div className="af-bloqueio-cartao" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}>
              <span className="af-icone af-icone-g" aria-hidden><Lock className="h-6 w-6" /></span>
              <h2 id="af-bloqueio-titulo" className="af-titulo-g">Você está em foco</h2>
              <p className="af-texto">
                O modo rígido está ligado: esta área fica para depois da sessão de <b>{currentSession?.objective}</b>.
              </p>
              <div className="af-acoes af-acoes-centro">
                <button type="button" className="ck-cta min-h-[48px]" onClick={() => router.back()}>Voltar ao estudo</button>
                <button type="button" className="ck-botao min-h-[48px]" onClick={() => finishSession()}>Encerrar a sessão e seguir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
