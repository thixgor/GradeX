'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Award, BookOpen, Brain, ChevronDown, Crown, Eye, EyeOff, Flame, GraduationCap, Heart, Layers, MessagesSquare, Sparkles,
  Star, Target, Trophy,
} from 'lucide-react'
import { avatarPorId } from '@/lib/monitorias/avatares'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import {
  AREAS_DE_XP, FONTES_DE_XP, LIGAS, ROTULO_DA_AREA, TETO_DIARIO, hojeEmSaoPaulo, diaAnterior,
  type AreaDeXp, type FonteDeXp, type Medalha,
} from '@/lib/xp/regras'
import type { LinhaDoRanking } from '@/app/api/xp/ranking/route'
import { useXp } from './xp-provider'
import { AnelDeNivel, NumeroQueCorre, SeloDaLiga, estiloDaLiga, ligaPorId } from './pecas'
import '@/components/checkout/checkout-vidro.css'
import './xp.css'

/**
 * A página do ranking de XP.
 *
 * De cima para baixo: quem eu sou no jogo (nível, liga, quanto falta), o
 * pódio, a lista, e depois o "porquê" — medalhas, de onde vem o meu XP, o
 * calendário de estudo e as regras inteiras. As regras ficam à vista de
 * propósito: ranking com regra escondida parece sorteio; com a regra aberta
 * vira meta.
 */

type Periodo = 'semana' | 'mes' | 'geral'
type Escopo = 'todos' | 'faculdade'

interface RespostaDoRanking {
  periodo: Periodo
  escopo: Escopo
  faculdade: string | null
  topo: LinhaDoRanking[]
  participantes: number
  eu: LinhaDoRanking | null
  euElegivel: boolean
  euId: string
  /** Ainda há quem tenha histórico e não tenha o XP calculado. */
  calculando: { pendentes: number | null; comHistorico: number | null } | null
}

const ROTULO_DO_PERIODO: Record<Periodo, string> = { semana: 'Semana', mes: 'Mês', geral: 'Sempre' }

export function Ranking() {
  const { dados, recarregar } = useXp()
  const [periodo, setPeriodo] = useState<Periodo>('semana')
  const [escopo, setEscopo] = useState<Escopo>('todos')
  const [ranking, setRanking] = useState<RespostaDoRanking | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const pedido = useRef(0)

  const carregar = useCallback((silencioso = false) => {
    const id = ++pedido.current
    if (!silencioso) setCarregando(true)
    setErro('')
    fetch(`/api/xp/ranking?periodo=${periodo}&escopo=${escopo}`, { cache: 'no-store' })
      .then(async (r) => {
        const corpo = await r.json().catch(() => ({}))
        if (id !== pedido.current) return
        if (!r.ok) {
          setErro(corpo.error || 'Não conseguimos carregar o ranking.')
          setRanking(null)
          return
        }
        setRanking(corpo as RespostaDoRanking)
      })
      .catch(() => { if (id === pedido.current) setErro('Sem conexão. Tente de novo.') })
      .finally(() => { if (id === pedido.current) setCarregando(false) })
  }, [periodo, escopo])

  useEffect(() => { carregar() }, [carregar])
  // Enquanto o XP retroativo é calculado, o ranking se enche sozinho.
  useIntervaloVisivel(() => carregar(true), ranking?.calculando ? 5_000 : null)
  // Na página do ranking o XP precisa estar em dia.
  useEffect(() => { recarregar(true) }, [recarregar])

  return (
    <div className="ck-escopo xr-pagina">
      <Placar />

      <section className="mt-8" aria-labelledby="xr-titulo">
        <div className="xr-cabeca">
          <h2 id="xr-titulo" className="xr-h2">
            <Trophy className="h-5 w-5" style={{ color: '#d39b16' }} /> Ranking
          </h2>
          <div className="xr-controles">
            <div className="ck-seg" role="tablist" aria-label="Período">
              {(Object.keys(ROTULO_DO_PERIODO) as Periodo[]).map((p) => (
                <button
                  key={p}
                  role="tab"
                  aria-selected={periodo === p}
                  className="ck-seg-opcao"
                  data-ativo={periodo === p ? '' : undefined}
                  onClick={() => setPeriodo(p)}
                >
                  {ROTULO_DO_PERIODO[p]}
                </button>
              ))}
            </div>
            <div className="ck-seg" role="tablist" aria-label="Quem entra">
              <button role="tab" aria-selected={escopo === 'todos'} className="ck-seg-opcao" data-ativo={escopo === 'todos' ? '' : undefined} onClick={() => setEscopo('todos')}>
                Todos
              </button>
              <button
                role="tab"
                aria-selected={escopo === 'faculdade'}
                className="ck-seg-opcao"
                data-ativo={escopo === 'faculdade' ? '' : undefined}
                onClick={() => setEscopo('faculdade')}
                title={dados?.faculdade || 'Disponível para estudantes com faculdade no perfil'}
              >
                Minha faculdade
              </button>
            </div>
          </div>
        </div>
        <p className="xr-apoio">
          {periodo === 'semana'
            ? 'A semana vai de segunda a domingo — todo mundo recomeça do zero na segunda.'
            : periodo === 'mes'
              ? 'O XP do mês corrente. Vira no dia 1º.'
              : 'Todo o XP desde o primeiro dia de estudo no DomineAqui.'}
          {ranking?.faculdade ? ` · ${ranking.faculdade}` : ''}
          {ranking ? ` · ${ranking.participantes.toLocaleString('pt-BR')} no ranking` : ''}
        </p>

        {ranking?.calculando && <Calculando estado={ranking.calculando} />}

        {erro ? (
          <p className="ck-aviso mt-5">{erro}</p>
        ) : !ranking || carregando ? (
          <EsqueletoDoRanking />
        ) : ranking.topo.length === 0 && ranking.calculando ? null : ranking.topo.length === 0 ? (
          <p className="ck-nota mt-5">Ninguém pontuou neste período ainda. Resolva uma questão e seja o primeiro.</p>
        ) : (
          <>
            <Podio linhas={ranking.topo.slice(0, 3)} euId={ranking.euId} chave={`${periodo}-${escopo}`} />
            <Lista linhas={ranking.topo.slice(3)} euId={ranking.euId} chave={`${periodo}-${escopo}`} />
            {ranking.eu && !ranking.topo.some((l) => l.userId === ranking.euId) && (
              <motion.div className="xr-eu-fixo" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                <Linha linha={ranking.eu} eu />
              </motion.div>
            )}
            {!ranking.eu && ranking.euElegivel === false && dados && dados.total > 0 && (
              <p className="ck-nota mt-4">Contas de administração não entram no ranking.</p>
            )}
          </>
        )}
      </section>

      {dados && (
        <>
          <Medalhas medalhas={dados.medalhas} />
          <DeOndeVem porArea={dados.porArea} total={dados.total} />
          <Calendario porDia={dados.porDia} sequencia={dados.sequenciaAtual} />
        </>
      )}
      <ComoGanhar />
      {dados && <Privacidade oculto={dados.oculto} aoMudar={() => { recarregar(true); carregar() }} />}
    </div>
  )
}

/* ══════════════════════════ Placar (eu) ══════════════════════════ */

function Placar() {
  const { dados } = useXp()
  const calmo = useReducedMotion()
  if (!dados) {
    return <div className="xr-placar xr-esqueleto" style={{ height: 220 }} aria-hidden />
  }
  const { nivel } = dados
  const falta = Math.max(0, nivel.proximo - dados.total)
  const proximaLiga = LIGAS.find((l) => l.desde > nivel.nivel)

  return (
    <section className="xr-placar" style={estiloDaLiga(nivel.liga)} aria-label="Seu nível">
      <span className="xr-placar-raios" aria-hidden />
      <motion.div
        className="xr-placar-anel"
        initial={calmo ? false : { scale: 0.7, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 16 }}
      >
        <AnelDeNivel nivel={nivel.nivel} progresso={nivel.progresso} liga={nivel.liga} tamanho={132} espessura={10} />
        <SeloDaLiga liga={nivel.liga} tamanho={44} className="xr-placar-selo" />
      </motion.div>
      <div className="xr-placar-texto">
        <p className="xr-placar-liga">Liga {nivel.liga.nome}</p>
        <h1 className="xr-placar-total">
          <NumeroQueCorre valor={dados.total} /> <small>XP</small>
        </h1>
        <div className="xr-placar-barra" aria-hidden>
          <motion.i initial={{ scaleX: 0 }} animate={{ scaleX: nivel.progresso }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} />
        </div>
        <p className="xr-placar-sub">
          {falta > 0 ? (
            <>
              <strong>{falta.toLocaleString('pt-BR')} XP</strong> para o nível {nivel.nivel + 1}
              {proximaLiga ? ` · liga ${proximaLiga.nome} no nível ${proximaLiga.desde}` : ''}
            </>
          ) : (
            'Nível máximo. Lenda.'
          )}
        </p>
        <div className="xr-fatos">
          <Fato icone={<Sparkles className="h-4 w-4" />} valor={`+${dados.hoje.toLocaleString('pt-BR')}`} rotulo="hoje" />
          <Fato icone={<Trophy className="h-4 w-4" />} valor={dados.posicaoSemana ? `${dados.posicaoSemana}º` : '—'} rotulo={`na semana (+${dados.semana.toLocaleString('pt-BR')})`} />
          <Fato icone={<Flame className="h-4 w-4" />} valor={String(dados.sequenciaAtual)} rotulo={`dias seguidos · recorde ${dados.maiorSequencia}`} />
          <Fato icone={<Target className="h-4 w-4" />} valor={dados.diasAtivos.toLocaleString('pt-BR')} rotulo="dias de estudo" />
        </div>
      </div>
    </section>
  )
}

function Fato({ icone, valor, rotulo }: { icone: React.ReactNode; valor: string; rotulo: string }) {
  return (
    <span className="xr-fato">
      <span className="xr-fato-icone" aria-hidden>{icone}</span>
      <span>
        <b>{valor}</b>
        <small>{rotulo}</small>
      </span>
    </span>
  )
}

/* ══════════════════════════════ Pódio ══════════════════════════════ */

function Retrato({ nome, avatar, liga, tamanho }: { nome: string; avatar: string | null; liga: string; tamanho: number }) {
  const [falhou, setFalhou] = useState(false)
  const url = falhou ? null : avatarPorId(avatar)?.url
  const l = ligaPorId(liga)
  const iniciais = nome.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
  return (
    <span className="xr-retrato" style={{ width: tamanho, height: tamanho, ...estiloDaLiga(l) }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" width={tamanho} height={tamanho} loading="lazy" decoding="async" onError={() => setFalhou(true)} />
      ) : (
        <span style={{ fontSize: Math.round(tamanho * 0.36) }}>{iniciais || '?'}</span>
      )}
    </span>
  )
}

const ORDEM_DO_PODIO = [1, 0, 2] // segundo, primeiro, terceiro
const ALTURA_DO_DEGRAU = [148, 112, 86]

function Podio({ linhas, euId, chave }: { linhas: LinhaDoRanking[]; euId: string; chave: string }) {
  const calmo = useReducedMotion()
  return (
    <div className="xr-podio" key={chave}>
      {ORDEM_DO_PODIO.map((i, coluna) => {
        const l = linhas[i]
        if (!l) return <span key={coluna} />
        const eu = l.userId === euId
        return (
          <motion.div
            key={l.userId}
            className="xr-degrau-coluna"
            data-posicao={l.posicao}
            initial={calmo ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + (2 - i) * 0.12, type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div className="xr-podio-pessoa">
              {l.posicao === 1 && (
                <motion.span
                  className="xr-coroa"
                  initial={calmo ? false : { y: -30, opacity: 0, rotate: -25 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.75, type: 'spring', stiffness: 260, damping: 12 }}
                  aria-hidden
                >
                  <Crown className="h-7 w-7" />
                </motion.span>
              )}
              <Retrato nome={l.nome} avatar={l.avatar} liga={l.liga} tamanho={l.posicao === 1 ? 76 : 62} />
              <p className="xr-podio-nome">{l.nome}{eu ? ' (você)' : ''}</p>
              <p className="xr-podio-xp"><NumeroQueCorre valor={l.xp} /> XP</p>
              <p className="xr-podio-nivel">Nv {l.nivel} · {ligaPorId(l.liga).nome}</p>
            </div>
            <motion.div
              className="xr-degrau"
              data-eu={eu ? '' : undefined}
              initial={calmo ? false : { height: 0 }}
              animate={{ height: ALTURA_DO_DEGRAU[i] }}
              transition={{ delay: 0.1 + (2 - i) * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <span>{l.posicao}</span>
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════ Lista ══════════════════════════════ */

function Linha({ linha, eu }: { linha: LinhaDoRanking; eu?: boolean }) {
  const l = ligaPorId(linha.liga)
  return (
    <div className="xr-linha" data-eu={eu ? '' : undefined}>
      <span className="xr-linha-pos">{linha.posicao}º</span>
      <Retrato nome={linha.nome} avatar={linha.avatar} liga={linha.liga} tamanho={38} />
      <span className="min-w-0 flex-1">
        <span className="xr-linha-nome">{linha.nome}{eu ? ' (você)' : ''}</span>
        <span className="xr-linha-sub">
          Nv {linha.nivel} · {l.nome}
          {linha.sequencia >= 3 ? ` · 🔥 ${linha.sequencia}` : ''}
          {linha.periodo ? ` · ${linha.periodo}º período` : ''}
        </span>
      </span>
      <SeloDaLiga liga={l} tamanho={24} />
      <span className="xr-linha-xp">{linha.xp.toLocaleString('pt-BR')} <small>XP</small></span>
    </div>
  )
}

function Lista({ linhas, euId, chave }: { linhas: LinhaDoRanking[]; euId: string; chave: string }) {
  const calmo = useReducedMotion()
  if (linhas.length === 0) return null
  return (
    <ol className="xr-lista" key={chave}>
      {linhas.map((l, i) => (
        <motion.li
          key={l.userId}
          initial={calmo ? false : { opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + Math.min(i, 20) * 0.035, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <Linha linha={l} eu={l.userId === euId} />
        </motion.li>
      ))}
    </ol>
  )
}

/**
 * O XP retroativo sendo calculado: quantos com histórico já entraram. Mostrar
 * a conta andando é melhor que uma lista vazia — e diz que o histórico conta.
 */
function Calculando({ estado }: { estado: NonNullable<RespostaDoRanking['calculando']> }) {
  const total = estado.comHistorico ?? 0
  const feitos = estado.pendentes === null || total === 0 ? 0 : Math.max(0, total - estado.pendentes)
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0
  return (
    <motion.div className="xr-calculando" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status">
      <span className="xr-calculando-anel" aria-hidden />
      <span className="min-w-0 flex-1">
        <b>Calculando o XP de todo o histórico de estudo…</b>
        <small>
          {total > 0
            ? `${feitos.toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')} estudantes com histórico já estão no ranking. A lista se completa sozinha.`
            : 'Lendo provas, questões, flashcards e aulas desde o primeiro dia. A lista se completa sozinha.'}
        </small>
        <span className="xr-calculando-barra" aria-hidden>
          <i style={{ width: `${Math.max(4, pct)}%` }} />
        </span>
      </span>
    </motion.div>
  )
}

function EsqueletoDoRanking() {
  return (
    <div className="mt-6 space-y-2" aria-busy="true">
      <div className="xr-esqueleto" style={{ height: 230 }} />
      {Array.from({ length: 5 }, (_, i) => <div key={i} className="xr-esqueleto" style={{ height: 58 }} />)}
    </div>
  )
}

/* ═════════════════════════════ Medalhas ═════════════════════════════ */

const ICONE_DA_MEDALHA: Record<Medalha['icone'], typeof Trophy> = {
  questao: Target,
  prova: Award,
  carta: Layers,
  aula: GraduationCap,
  chama: Flame,
  livro: BookOpen,
  estrela: Star,
  comunidade: MessagesSquare,
  coracao: Heart,
  foco: Brain,
}

function Medalhas({ medalhas }: { medalhas: Medalha[] }) {
  const calmo = useReducedMotion()
  return (
    <section className="mt-12" aria-labelledby="xr-medalhas">
      <h2 id="xr-medalhas" className="xr-h2"><Award className="h-5 w-5" style={{ color: '#d39b16' }} /> Medalhas</h2>
      <p className="xr-apoio">Cada trilha mostra a medalha que você já tem — ou a próxima, com o quanto falta.</p>
      <div className="xr-medalhas">
        {medalhas.map((m, i) => {
          const Icone = ICONE_DA_MEDALHA[m.icone]
          return (
            <motion.div
              key={m.id}
              className="xr-medalha"
              data-conquistada={m.conquistada ? '' : undefined}
              initial={calmo ? false : { opacity: 0, scale: 0.8, rotateY: 90 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 220, damping: 18 }}
            >
              <span className="xr-medalha-moeda" style={{ '--p': m.progresso } as React.CSSProperties}>
                <Icone className="h-6 w-6" />
              </span>
              <b>{m.nome}</b>
              <small>{m.texto}</small>
              {!m.conquistada && (
                <span className="xr-mini-barra" aria-label={`${Math.round(m.progresso * 100)}%`}>
                  <i style={{ width: `${Math.round(m.progresso * 100)}%` }} />
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

/* ═══════════════════════════ De onde vem ═══════════════════════════ */

const COR_DA_AREA: Record<AreaDeXp, string> = {
  banco: '#2563eb', provas: '#d0521c', flashcards: '#7646d8', aulas: '#cf3434', manual: '#bf2944',
  materiais: '#0f8f7c', anatomia: '#c94a35', quizzes: '#9343c9', ferramentas: '#2b7891', jogos: '#d22a7a',
  foco: '#c27508', comunidade: '#1b88bd', avaliacoes: '#e0457b', compras: '#d39b16', constancia: '#2f6b40',
}

function DeOndeVem({ porArea, total }: { porArea: Record<AreaDeXp, number>; total: number }) {
  const linhas = AREAS_DE_XP.map((a) => ({ area: a, xp: porArea[a] || 0 })).filter((l) => l.xp > 0).sort((a, b) => b.xp - a.xp)
  if (linhas.length === 0) return null
  const maior = linhas[0].xp
  return (
    <section className="mt-12" aria-labelledby="xr-areas">
      <h2 id="xr-areas" className="xr-h2"><Sparkles className="h-5 w-5" style={{ color: '#d39b16' }} /> De onde vem o seu XP</h2>
      <p className="xr-apoio">Todas as seções contam — e todo o seu histórico, desde o primeiro dia.</p>
      <ul className="xr-areas">
        {linhas.map((l, i) => (
          <li key={l.area}>
            <span className="xr-area-nome">{ROTULO_DA_AREA[l.area]}</span>
            <span className="xr-area-trilho">
              <motion.i
                style={{ background: COR_DA_AREA[l.area] }}
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.max(3, (l.xp / maior) * 100)}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
            <span className="xr-area-xp">
              {l.xp.toLocaleString('pt-BR')} <small>{total > 0 ? `${Math.round((l.xp / total) * 100)}%` : ''}</small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ════════════════════════════ Calendário ════════════════════════════ */

function Calendario({ porDia, sequencia }: { porDia: Record<string, number>; sequencia: number }) {
  const SEMANAS = 18
  const dias = useMemo(() => {
    const hoje = hojeEmSaoPaulo()
    // Termina no domingo desta semana; começa na segunda de 18 semanas atrás.
    const d = new Date(`${hoje}T12:00:00Z`)
    const dow = (d.getUTCDay() + 6) % 7
    d.setUTCDate(d.getUTCDate() + (6 - dow))
    const lista: string[] = []
    let cursor = d.toISOString().slice(0, 10)
    for (let i = 0; i < SEMANAS * 7; i++) {
      lista.unshift(cursor)
      cursor = diaAnterior(cursor)
    }
    return { lista, hoje }
  }, [])
  const maximo = Math.max(1, ...dias.lista.map((d) => porDia[d] || 0))
  const nivelDoDia = (xp: number) => (xp <= 0 ? 0 : xp < maximo * 0.25 ? 1 : xp < maximo * 0.5 ? 2 : xp < maximo * 0.8 ? 3 : 4)

  return (
    <section className="mt-12" aria-labelledby="xr-calendario">
      <h2 id="xr-calendario" className="xr-h2"><Flame className="h-5 w-5" style={{ color: '#f0782f' }} /> Constância</h2>
      <p className="xr-apoio">
        {sequencia > 0 ? `${sequencia} dia${sequencia > 1 ? 's' : ''} seguido${sequencia > 1 ? 's' : ''}. ` : ''}
        Cada dia com estudo vale +10 XP, e cada 7 seguidos, +50.
      </p>
      <div className="xr-calendario" role="img" aria-label="Calendário de estudo das últimas 18 semanas">
        {dias.lista.map((d, i) => {
          const xp = porDia[d] || 0
          return (
            <motion.span
              key={d}
              className="xr-dia"
              data-n={nivelDoDia(xp)}
              data-futuro={d > dias.hoje ? '' : undefined}
              title={`${d.split('-').reverse().join('/')}: ${xp.toLocaleString('pt-BR')} XP`}
              initial={{ opacity: 0, scale: 0.4 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: Math.floor(i / 7) * 0.025 }}
            />
          )
        })}
      </div>
    </section>
  )
}

/* ═══════════════════════════ Como ganhar ═══════════════════════════ */

function ComoGanhar() {
  const [aberto, setAberto] = useState(false)
  const porArea = AREAS_DE_XP.map((area) => ({
    area,
    fontes: (Object.entries(FONTES_DE_XP) as Array<[FonteDeXp, (typeof FONTES_DE_XP)[FonteDeXp]]>).filter(([, f]) => f.area === area),
  }))
  return (
    <section className="mt-12" aria-labelledby="xr-regras">
      <button type="button" className="xr-regras-botao" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}>
        <span>
          <h2 id="xr-regras" className="xr-h2">Como ganhar XP</h2>
          <span className="xr-apoio block">Acertar vale mais que tentar. Cada área tem um teto por dia — estudo de verdade, não clique repetido.</span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 transition-transform" style={{ transform: aberto ? 'rotate(180deg)' : undefined }} />
      </button>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="xr-regras">
              {porArea.map(({ area, fontes }) => (
                <div key={area} className="xr-regra-area">
                  <p className="xr-regra-titulo">
                    <span style={{ background: COR_DA_AREA[area] }} aria-hidden />
                    {ROTULO_DA_AREA[area]}
                    {TETO_DIARIO[area] !== null && <small>até {TETO_DIARIO[area]} XP/dia</small>}
                  </p>
                  <ul>
                    {fontes.map(([id, f]) => (
                      <li key={id}>
                        <span>{f.rotulo}</span>
                        <b>+{f.xp}</b>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="xr-apoio mt-3">
              O XP é calculado a partir de todo o seu histórico. A mesma questão conta uma vez por dia; no
              quiz vale a melhor tentativa do dia; o acerto da prova entra quando a nota é liberada.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ════════════════════════════ Privacidade ════════════════════════════ */

function Privacidade({ oculto, aoMudar }: { oculto: boolean; aoMudar: () => void }) {
  const [valor, setValor] = useState(oculto)
  const [salvando, setSalvando] = useState(false)
  useEffect(() => setValor(oculto), [oculto])

  async function alternar() {
    const novo = !valor
    setValor(novo)
    setSalvando(true)
    try {
      const r = await fetch('/api/xp/eu', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oculto: novo }) })
      if (!r.ok) setValor(!novo)
      else aoMudar()
    } catch {
      setValor(!novo)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="mt-10 mb-6">
      <button type="button" className="ck-opcao ck-opcao-linha w-full min-h-[48px]" onClick={alternar} disabled={salvando} aria-pressed={valor}>
        {valor ? <EyeOff className="h-5 w-5 shrink-0" /> : <Eye className="h-5 w-5 shrink-0" />}
        <span className="min-w-0 flex-1 text-left">
          <b className="block text-sm">{valor ? 'Você aparece como "Estudante anônimo"' : 'Você aparece no ranking com primeiro nome e inicial'}</b>
          <small className="block text-[12.5px]" style={{ color: 'var(--ck-texto-3)' }}>
            {valor ? 'Toque para voltar a aparecer pelo nome.' : 'Toque para aparecer anônimo. Sua posição e seu XP continuam contando.'}
          </small>
        </span>
      </button>
    </section>
  )
}
