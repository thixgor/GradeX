'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CalendarRange,
  ChevronLeft,
  Download,
  Lightbulb,
  Loader2,
  MoreHorizontal,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { FundoIos } from '@/components/materiais/fundo-ios'
import { AnelProgresso, Confete } from '@/components/flashcards/pecas-ios'
import { MarcaDaguaFlashcard } from '@/components/flashcards/marca-dagua-flashcard'
import { Campo, FolhaModal, NoCorpo, Rascunho, Segmentado, Stepper, VitrineIa, useFraseRotativa } from '@/components/estudo-ia/pecas'
import { SeletorDeTemas } from '@/components/estudo-ia/seletor-de-temas'
import { ToastAlert } from '@/components/ui/toast-alert'
import { Dialog } from '@/components/ui/dialog'
import { iaDeEstudoLiberada } from '@/lib/ia/estudo/acesso'
import type { FlashcardCard, FlashcardDeck, FlashcardDifficultyFeedback } from '@/lib/types'

type DeckComId = FlashcardDeck & { _id: string }

interface Modelo {
  _id: string
  title: string
  description?: string
  defaultDifficulty?: number
  suggestedCardCount?: number
  contextHint?: string
}

type Nivel = 'facil' | 'medio' | 'dificil' | 'misto'
type Foco = 'misto' | 'conceitos' | 'mecanismos' | 'clinica'

const NIVEL_EM_NUMERO: Record<Exclude<Nivel, 'misto'>, number> = { facil: 0.3, medio: 0.6, dificil: 0.85 }

const FOCOS: { id: Foco; rotulo: string }[] = [
  { id: 'misto', rotulo: 'Equilibrado' },
  { id: 'conceitos', rotulo: 'Conceitos' },
  { id: 'mecanismos', rotulo: 'Mecanismos' },
  { id: 'clinica', rotulo: 'Aplicação' },
]

const NOTAS: { valor: FlashcardDifficultyFeedback; rotulo: string; dica: string; css: string }[] = [
  { valor: 'porrada', rotulo: 'Errei', dica: 'volta logo', css: 'DIFICIL' },
  { valor: 'equilibrado', rotulo: 'Com esforço', dica: 'quase', css: 'MEDIO' },
  { valor: 'facil', rotulo: 'Lembrei', dica: 'fácil', css: 'FACIL' },
]

const FRASES_GERANDO = [
  'Lendo o tema e o que cai em prova…',
  'Escolhendo os pontos que mais confundem…',
  'Escrevendo as perguntas…',
  'Explicando cada resposta do zero…',
  'Tirando cartões repetidos…',
]

const BENEFICIOS = [
  'Decks de até 40 cartões a partir de um tema ou do seu cronograma',
  'Verso com a resposta e o porquê, explicado do zero',
  'Dica que puxa o raciocínio sem entregar a resposta',
  'Relatório do que você errou, com um deck focado nos pontos fracos',
]

function escaparHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function dataCurta(d: Date | string) {
  try {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  } catch {
    return ''
  }
}

export default function FlashcardsIaPage() {
  // ── Conta ──
  const [conta, setConta] = useState<{ carregada: boolean; liberada: boolean }>({ carregada: false, liberada: false })

  // ── Decks ──
  const [decks, setDecks] = useState<DeckComId[]>([])
  const [carregandoDecks, setCarregandoDecks] = useState(true)
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [recemCriado, setRecemCriado] = useState<string | null>(null)

  // ── Composição ──
  const [tema, setTema] = useState('')
  const [titulo, setTitulo] = useState('')
  const [notas, setNotas] = useState('')
  const [quantidade, setQuantidade] = useState(15)
  const [nivel, setNivel] = useState<Nivel>('medio')
  const [foco, setFoco] = useState<Foco>('misto')
  const [modeloId, setModeloId] = useState<string | null>(null)
  const [cronogramaAberto, setCronogramaAberto] = useState(false)
  const [gerando, setGerando] = useState(false)
  const frase = useFraseRotativa(FRASES_GERANDO, gerando)
  const temaRef = useRef<HTMLInputElement>(null)

  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ open: false, message: '' })
  const avisar = (message: string, type: 'error' | 'success' | 'info' = 'info') => setToast({ open: true, message, type })

  // ── Estudo ──
  const [deckAberto, setDeckAberto] = useState<DeckComId | null>(null)
  const [cartoes, setCartoes] = useState<FlashcardCard[]>([])
  const [indice, setIndice] = useState(0)
  const [virado, setVirado] = useState(false)
  const [dicaVisivel, setDicaVisivel] = useState(false)
  const [notasDadas, setNotasDadas] = useState<Record<string, { nota: FlashcardDifficultyFeedback; objetivos: string[] }>>({})
  const [salvando, setSalvando] = useState(false)
  const [relatorio, setRelatorio] = useState<{ objetivos: string[]; acertos: number; total: number } | null>(null)
  const [paraApagar, setParaApagar] = useState<DeckComId | null>(null)
  const [apagando, setApagando] = useState(false)
  const [menuDeck, setMenuDeck] = useState<string | null>(null)

  const carregarDecks = useCallback(async () => {
    try {
      const r = await fetch('/api/flashcards', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      const d = await r.json()
      setDecks((d.decks || []).map((x: DeckComId) => ({ ...x, _id: String(x._id) })))
    } catch {
      avisar('Não foi possível carregar seus decks.', 'error')
    } finally {
      setCarregandoDecks(false)
    }
  }, [])

  useEffect(() => {
    void carregarDecks()
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setConta({ carregada: true, liberada: iaDeEstudoLiberada(d?.user?.accountType, d?.user?.role === 'admin') }))
      .catch(() => setConta({ carregada: true, liberada: false }))
    fetch('/api/flashcards/themes')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setModelos((d?.themes || []).map((t: Modelo) => ({ ...t, _id: String(t._id) }))))
      .catch(() => {})
  }, [carregarDecks])

  function aplicarModelo(m: Modelo) {
    setModeloId(m._id)
    setTema(m.title)
    if (m.contextHint) setNotas(m.contextHint)
    if (m.suggestedCardCount) setQuantidade(Math.max(5, Math.min(40, Math.round(m.suggestedCardCount / 5) * 5)))
    if (m.defaultDifficulty) setNivel(m.defaultDifficulty < 0.4 ? 'facil' : m.defaultDifficulty < 0.7 ? 'medio' : 'dificil')
    temaRef.current?.focus()
  }

  async function gerar() {
    const t = tema.trim()
    if (!t) {
      avisar('Escreva o tema ou escolha do cronograma.', 'error')
      temaRef.current?.focus()
      return
    }
    setGerando(true)
    try {
      const r = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: (titulo.trim() || t).slice(0, 100),
          theme: t,
          notes: notas.trim(),
          difficulty: nivel === 'misto' ? 0.6 : NIVEL_EM_NUMERO[nivel],
          randomDifficulty: nivel === 'misto',
          cardsRequested: quantidade,
          foco,
          templateId: modeloId,
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (d?.requiresUpgrade) setConta((c) => ({ ...c, liberada: false }))
        throw new Error(d?.error || 'Não foi possível gerar o deck.')
      }
      setRecemCriado(d.deckId)
      setTema('')
      setTitulo('')
      setNotas('')
      setModeloId(null)
      await carregarDecks()
      avisar('Deck pronto. Bora revisar?', 'success')
    } catch (e) {
      avisar((e as Error).message, 'error')
    } finally {
      setGerando(false)
    }
  }

  // ── Estudo ──
  async function abrirDeck(deck: DeckComId) {
    setDeckAberto(deck)
    setCartoes([])
    setIndice(0)
    setVirado(false)
    setDicaVisivel(false)
    setNotasDadas({})
    try {
      const r = await fetch(`/api/flashcards/${deck._id}/cards`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setCartoes(d.cards || [])
    } catch {
      avisar('Não foi possível abrir os cartões.', 'error')
      setDeckAberto(null)
    }
  }

  const cartao = cartoes[indice]

  async function concluir(todas: typeof notasDadas) {
    if (!deckAberto) return
    setSalvando(true)
    const entries = cartoes
      .filter((c) => todas[c.id])
      .map((c) => ({ cardId: c.id, difficulty: todas[c.id].nota, objectivesStruggled: todas[c.id].objetivos, completedAt: new Date() }))
    const acertos = entries.filter((e) => e.difficulty === 'facil').length
    try {
      const r = await fetch(`/api/flashcards/${deckAberto._id}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })
      const d = await r.json().catch(() => ({}))
      setRelatorio({ objetivos: r.ok ? d.dominantObjectives || [] : [], acertos, total: entries.length })
    } catch {
      setRelatorio({ objetivos: [], acertos, total: entries.length })
    } finally {
      setSalvando(false)
    }
  }

  function darNota(nota: FlashcardDifficultyFeedback) {
    if (!cartao) return
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(8)
    // Errou ou suou: os objetivos do cartão entram como pontos fracos.
    const objetivos = nota === 'facil' ? [] : cartao.objectives.map((o) => o.id)
    const todas = { ...notasDadas, [cartao.id]: { nota, objetivos } }
    setNotasDadas(todas)
    if (indice >= cartoes.length - 1) {
      void concluir(todas)
      return
    }
    setVirado(false)
    setDicaVisivel(false)
    window.setTimeout(() => setIndice((i) => i + 1), 140)
  }

  function fecharEstudo() {
    setDeckAberto(null)
    setRelatorio(null)
    void carregarDecks()
  }

  function deckDosPontosFracos() {
    if (!relatorio || !deckAberto) return
    setTema(deckAberto.theme)
    setTitulo(`${deckAberto.title} · reforço`)
    setNotas(`Foque nos pontos em que errei: ${relatorio.objetivos.join(', ')}`.slice(0, 400))
    fecharEstudo()
    window.setTimeout(() => temaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200)
  }

  async function apagar() {
    if (!paraApagar) return
    setApagando(true)
    try {
      const r = await fetch(`/api/flashcards/${paraApagar._id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      setDecks((ds) => ds.filter((d) => d._id !== paraApagar._id))
      avisar('Deck apagado.', 'success')
      setParaApagar(null)
    } catch {
      avisar('Não foi possível apagar o deck.', 'error')
    } finally {
      setApagando(false)
    }
  }

  function baixarPdf() {
    if (!deckAberto || cartoes.length === 0) return
    const janela = window.open('', '', 'width=1000,height=800')
    if (!janela) {
      avisar('Libere as janelas pop-up para baixar o PDF.', 'error')
      return
    }
    const e = escaparHtml
    janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${e(deckAberto.title)}</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:32px;font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#101814;background:#fff}
h1{font-size:26px;letter-spacing:-.02em;margin:0 0 4px}p.sub{color:#5b655f;margin:0 0 24px}
.c{border:1px solid #e3e6e2;border-radius:14px;padding:16px 18px;margin:0 0 12px;page-break-inside:avoid}
.n{font-size:11px;font-weight:700;color:#2f7d48;letter-spacing:.06em;text-transform:uppercase}
.f{font-size:16px;font-weight:700;margin:6px 0 10px}.b{background:#f2f7f3;border-radius:10px;padding:10px 12px}
.h{color:#9a6410;font-size:12.5px;margin-top:8px}
</style></head><body><h1>${e(deckAberto.title)}</h1><p class="sub">${e(deckAberto.theme)} · ${cartoes.length} cartões · DomineAqui</p>
${cartoes
  .map(
    (c, i) =>
      `<div class="c"><div class="n">Cartão ${i + 1}</div><div class="f">${e(c.front)}</div><div class="b">${e(c.back)}</div>${c.hint ? `<div class="h">Dica: ${e(c.hint)}</div>` : ''}</div>`,
  )
  .join('')}
</body></html>`)
    janela.document.close()
    window.setTimeout(() => janela.print(), 250)
  }

  const progresso = cartoes.length ? (indice + (notasDadas[cartao?.id ?? ''] ? 1 : 0)) / cartoes.length : 0
  const deckNovo = useMemo(() => decks.find((d) => d._id === recemCriado) || null, [decks, recemCriado])

  return (
    <AppShell vidro headerTitle="Flashcards com IA" headerSubtitle="Decks gerados do seu tema">
      <FundoIos>
        <div className="mx-auto max-w-3xl px-4 pb-28 pt-3 sm:px-6 sm:pt-5">
          <Link href="/flashcards" className="ios-voltar -ml-2">
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} /> Flashcards
          </Link>

          <header className="mb-6 mt-2">
            <h1 className="ios-titulo-grande">Flashcards com IA</h1>
            <p className="ios-rotulo-2 mt-1.5 max-w-xl text-[16px] leading-relaxed sm:text-[17px]">
              Diga o tema — ou escolha do seu cronograma. A IA escreve o deck, você revisa no dia certo.
            </p>
          </header>

          {!conta.carregada ? (
            <div className="ia-folha space-y-4 p-6">
              <div className="ios-esqueleto h-14 rounded-2xl" />
              <div className="ios-esqueleto h-10 w-2/3 rounded-2xl" />
              <div className="ios-esqueleto h-12 rounded-full" />
            </div>
          ) : !conta.liberada ? (
            <VitrineIa recurso="flashcards" beneficios={BENEFICIOS} />
          ) : (
            <section className="ia-folha relative overflow-hidden" aria-busy={gerando}>
              {gerando ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 px-6 py-12 text-center">
                  <div className="ia-orbe" aria-hidden />
                  <div>
                    <p className="text-[19px] font-bold tracking-tight">Gerando {quantidade} cartões</p>
                    <p key={frase} className="ia-status ios-rotulo-2 mt-1 text-[15px]" aria-live="polite">
                      {frase}
                    </p>
                  </div>
                  <Rascunho linhas={4} className="w-full max-w-sm" />
                  <p className="ios-rotulo-3 text-[13px]">Leva uns 10 a 20 segundos.</p>
                </div>
              ) : (
                <div className="space-y-5 p-5 sm:p-7">
                  <Campo rotulo="Tema" nota={modeloId ? 'modelo aplicado' : undefined}>
                    <input
                      ref={temaRef}
                      value={tema}
                      onChange={(e) => {
                        setTema(e.target.value)
                        setModeloId(null)
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && void gerar()}
                      maxLength={300}
                      placeholder="Ex.: Insuficiência cardíaca"
                      className="ia-campo ia-campo-grande"
                      aria-label="Tema do deck"
                    />
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => setCronogramaAberto(true)} className="ios-botao-suave ios-botao-p">
                        <CalendarRange className="h-4 w-4" /> Do meu cronograma
                      </button>
                      {modelos.slice(0, 6).map((m) => (
                        <button
                          key={m._id}
                          type="button"
                          aria-pressed={modeloId === m._id}
                          onClick={() => aplicarModelo(m)}
                          className="ios-pilula !h-[34px] !text-[13px]"
                          title={m.description}
                        >
                          {m.title}
                        </button>
                      ))}
                    </div>
                  </Campo>

                  <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
                    <Campo rotulo="Cartões">
                      <Stepper rotulo="Cartões" valor={quantidade} onChange={setQuantidade} min={5} max={40} passo={5} />
                    </Campo>
                    <Campo rotulo="Dificuldade">
                      <Segmentado<Nivel>
                        rotulo="Dificuldade"
                        valor={nivel}
                        onChange={setNivel}
                        opcoes={[
                          { id: 'facil', rotulo: 'Fácil' },
                          { id: 'medio', rotulo: 'Médio' },
                          { id: 'dificil', rotulo: 'Difícil' },
                          { id: 'misto', rotulo: 'Misto' },
                        ]}
                      />
                    </Campo>
                  </div>

                  <Campo rotulo="O que treinar">
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Foco dos cartões">
                      {FOCOS.map((f) => (
                        <button key={f.id} type="button" aria-pressed={foco === f.id} onClick={() => setFoco(f.id)} className="ios-pilula">
                          {f.rotulo}
                        </button>
                      ))}
                    </div>
                  </Campo>

                  <details className="group">
                    <summary className="ios-tinta flex cursor-pointer list-none items-center gap-1 text-[14px] font-semibold [&::-webkit-details-marker]:hidden">
                      <Wand2 className="h-4 w-4" /> Nome do deck e orientação para a IA
                    </summary>
                    <div className="mt-4 space-y-4">
                      <Campo rotulo="Nome do deck" nota="opcional">
                        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={100} placeholder={tema.trim() || 'Usa o tema se ficar vazio'} className="ia-campo" />
                      </Campo>
                      <Campo rotulo="Orientação" nota={`${notas.length}/400`}>
                        <textarea
                          value={notas}
                          onChange={(e) => setNotas(e.target.value.slice(0, 400))}
                          placeholder="Ex.: foque em critérios diagnósticos e doses; minha prova é na sexta"
                          className="ia-campo"
                          rows={3}
                        />
                      </Campo>
                    </div>
                  </details>

                  <button type="button" onClick={() => void gerar()} disabled={!tema.trim()} className="ios-botao ios-botao-g w-full">
                    <Sparkles className="h-[18px] w-[18px]" /> Gerar {quantidade} cartões
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ── Recém-criado ── */}
          {deckNovo && (
            <div className="ios-vidro ios-assenta mt-5 flex items-center gap-4 rounded-[22px] p-4">
              <div className="min-w-0 flex-1">
                <p className="ios-tinta text-[13px] font-semibold">Acabou de sair</p>
                <p className="truncate text-[17px] font-bold tracking-tight">{deckNovo.title}</p>
                <p className="ios-rotulo-2 text-[13px]">{deckNovo.cardsGenerated} cartões</p>
              </div>
              <button type="button" className="ios-botao" onClick={() => void abrirDeck(deckNovo)}>
                <Play className="h-4 w-4" fill="currentColor" /> Estudar
              </button>
            </div>
          )}

          {/* ── Decks ── */}
          <section className="mt-9" aria-labelledby="decks-ia">
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 id="decks-ia" className="ios-titulo-secao">
                Seus decks com IA
              </h2>
              {!carregandoDecks && decks.length > 0 && <span className="ios-rotulo-2 text-[14px] ios-numeros">{decks.length}</span>}
            </div>
            {carregandoDecks ? (
              <div className="ios-lista">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="ios-linha">
                    <div className="ios-esqueleto h-10 flex-1 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : decks.length === 0 ? (
              <div className="ios-cartao rounded-[22px] px-6 py-10 text-center">
                <p className="text-[17px] font-semibold">Nenhum deck ainda</p>
                <p className="ios-rotulo-2 mx-auto mt-1 max-w-xs text-[14px]">
                  {conta.liberada ? 'O primeiro sai em segundos: escreva um tema lá em cima.' : 'Assine para gerar o primeiro.'}
                </p>
              </div>
            ) : (
              <ul className="ios-lista">
                {decks.map((deck) => (
                  <li key={deck._id} className="relative">
                    <div className="ios-linha">
                      <button type="button" onClick={() => void abrirDeck(deck)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-[16px] font-semibold tracking-tight">{deck.title}</span>
                        <span className="ios-rotulo-2 block truncate text-[13px]">
                          {deck.cardsGenerated} cartões · {dataCurta(deck.createdAt)}
                          {deck.status === 'concluido' ? ' · revisado' : ''}
                        </span>
                      </button>
                      <button type="button" onClick={() => void abrirDeck(deck)} className="ios-botao-suave ios-botao-p">
                        <Play className="h-3.5 w-3.5" fill="currentColor" /> Estudar
                      </button>
                      <button
                        type="button"
                        aria-label={`Mais opções de ${deck.title}`}
                        onClick={() => setMenuDeck(menuDeck === deck._id ? null : deck._id)}
                        className="ios-icone-botao !text-[color:var(--ios-rotulo-2)]"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                    {menuDeck === deck._id && (
                      <div className="flex justify-end gap-2 px-4 pb-3">
                        <button
                          type="button"
                          className="ios-botao-cinza ios-botao-p !text-[color:var(--ios-perigo)]"
                          onClick={() => {
                            setMenuDeck(null)
                            setParaApagar(deck)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Apagar deck
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <SeletorDeTemas
          aberto={cronogramaAberto}
          onFechar={() => setCronogramaAberto(false)}
          maximo={4}
          onAplicar={(temas) => {
            setTema(temas.join('; ').slice(0, 300))
            setModeloId(null)
            if (!titulo.trim() && temas[0]) setTitulo(temas[0].split(' — ')[0].slice(0, 100))
          }}
        />

        {/* ── Estudo ── */}
        <FolhaModal
          aberta={!!deckAberto}
          onFechar={fecharEstudo}
          titulo={deckAberto?.title ?? ''}
          subtitulo={relatorio ? 'Sessão concluída' : cartoes.length ? `Cartão ${Math.min(indice + 1, cartoes.length)} de ${cartoes.length}` : 'Abrindo…'}
        >
          {relatorio ? (
            <div className="relative pb-2 pt-2 text-center">
              {relatorio.total > 0 && relatorio.acertos / relatorio.total >= 0.7 && <Confete />}
              <div className="flex justify-center">
                <AnelProgresso valor={relatorio.acertos} total={Math.max(1, relatorio.total)} tamanho={128} espessura={11} rotulo={`${relatorio.acertos} de ${relatorio.total} lembrados`}>
                  <span className="text-[30px] font-bold tracking-tight ios-numeros">
                    {relatorio.total ? Math.round((relatorio.acertos / relatorio.total) * 100) : 0}%
                  </span>
                  <span className="ios-rotulo-2 text-[12px]">de primeira</span>
                </AnelProgresso>
              </div>
              <p className="mt-4 text-[19px] font-bold tracking-tight">
                {relatorio.objetivos.length === 0 ? 'Nenhum ponto fraco nesta rodada.' : 'Aqui você ainda tropeça'}
              </p>
              {relatorio.objetivos.length > 0 && (
                <ul className="mx-auto mt-3 max-w-sm space-y-2 text-left">
                  {relatorio.objetivos.slice(0, 6).map((o) => (
                    <li key={o} className="ios-erro-suave rounded-2xl px-4 py-2.5 text-[14px] font-medium">
                      {o}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6 flex flex-col gap-2.5">
                {relatorio.objetivos.length > 0 && conta.liberada && (
                  <button type="button" onClick={deckDosPontosFracos} className="ios-botao ios-botao-g">
                    <Sparkles className="h-[18px] w-[18px]" /> Gerar deck dos pontos fracos
                  </button>
                )}
                <button type="button" onClick={() => deckAberto && void abrirDeck(deckAberto)} className="ios-botao-cinza ios-botao-g">
                  <RotateCcw className="h-[18px] w-[18px]" /> Revisar de novo
                </button>
              </div>
            </div>
          ) : !cartao ? (
            <div className="space-y-3 py-6">
              <div className="ios-esqueleto h-[260px] rounded-3xl" />
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              <div className="ia-progresso" aria-hidden>
                <i style={{ transform: `scaleX(${progresso})` }} />
              </div>

              <button
                type="button"
                onClick={() => setVirado((v) => !v)}
                className="ia-cartao-estudo block w-full text-left"
                data-virado={virado ? 'true' : 'false'}
                aria-label={virado ? 'Mostrar a pergunta' : 'Mostrar a resposta'}
              >
                <div>
                  <div className="ia-face" aria-hidden={virado}>
                    <span className="ios-rotulo-3 text-[12px] font-semibold uppercase tracking-[0.08em]">Pergunta</span>
                    <p className="text-[21px] font-bold leading-snug tracking-tight sm:text-[23px]">{cartao.front}</p>
                    <span className="ios-rotulo-3 mt-auto text-[13px]">Toque para ver a resposta</span>
                    <MarcaDaguaFlashcard />
                  </div>
                  <div className="ia-face ia-face-verso" aria-hidden={!virado}>
                    <span className="ios-tinta text-[12px] font-semibold uppercase tracking-[0.08em]">Resposta</span>
                    <p className="text-[17px] leading-relaxed">{cartao.back}</p>
                    <MarcaDaguaFlashcard />
                  </div>
                </div>
              </button>

              {!virado ? (
                <div className="flex items-center gap-2">
                  {cartao.hint && (
                    <button type="button" onClick={() => setDicaVisivel((v) => !v)} className="ios-botao-cinza ios-botao-p" aria-expanded={dicaVisivel}>
                      <Lightbulb className="h-4 w-4" /> Dica
                    </button>
                  )}
                  <button type="button" onClick={() => setVirado(true)} className="ios-botao ml-auto">
                    Ver resposta
                  </button>
                </div>
              ) : (
                <div>
                  <p className="ios-rotulo-2 mb-2 text-center text-[13px]">Como foi?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {NOTAS.map((n) => (
                      <button key={n.valor} type="button" className="ios-nota" data-nota={n.css} onClick={() => darNota(n.valor)} disabled={salvando}>
                        {n.rotulo}
                        <small>{n.dica}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {dicaVisivel && !virado && cartao.hint && (
                <p className="ios-ambar rounded-2xl bg-[color:var(--ios-ambar-suave)] px-4 py-3 text-[14px] font-medium">{cartao.hint}</p>
              )}

              {salvando && (
                <p className="ios-rotulo-2 flex items-center justify-center gap-2 text-[13px]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Salvando a sessão…
                </p>
              )}

              <div className="flex justify-center pt-1">
                <button type="button" onClick={baixarPdf} className="ios-rotulo-2 inline-flex items-center gap-1.5 text-[13px] font-semibold">
                  <Download className="h-3.5 w-3.5" /> Imprimir o deck
                </button>
              </div>
            </div>
          )}
        </FolhaModal>

        {/* ── Apagar ── */}
        <NoCorpo>
        <Dialog open={!!paraApagar} onOpenChange={(v) => !v && setParaApagar(null)}>
          <div role="alertdialog" aria-modal="true" className="vidro-ios ia-folha-modal !min-h-0 !rounded-[24px] p-6 sm:w-[420px]">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[19px] font-bold tracking-tight">Apagar “{paraApagar?.title}”?</h2>
              <button type="button" aria-label="Fechar" onClick={() => setParaApagar(null)} className="ios-icone-botao !text-[color:var(--ios-rotulo-2)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="ios-rotulo-2 mt-2 text-[15px]">Os cartões e o histórico deste deck somem. Não dá para desfazer.</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setParaApagar(null)} className="ios-botao-cinza flex-1" disabled={apagando}>
                Cancelar
              </button>
              <button type="button" onClick={() => void apagar()} className="ios-botao-erro flex-1" disabled={apagando}>
                {apagando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Apagar
              </button>
            </div>
          </div>
        </Dialog>
        </NoCorpo>

        <ToastAlert open={toast.open} onOpenChange={(open) => setToast((t) => ({ ...t, open }))} message={toast.message} type={toast.type} />
      </FundoIos>
    </AppShell>
  )
}
