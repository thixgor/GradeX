'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Loader2,
  StickyNote,
  Pencil,
  Plus,
  Search,
  Trash2,
  WifiOff,
  X,
} from 'lucide-react'

/**
 * Caderno radiográfico.
 *
 * O caderninho de bolso do radiologista, dentro do exame. Cada série de
 * tomografia e cada incidência de Raio-X tem a sua folha, e cada ficha nasce
 * ancorada na seção que o aluno estava olhando — a estrutura acesa no filme, o
 * roteiro de leitura, o exame inteiro.
 *
 * Três decisões guiam o componente:
 *
 * 1. **O desenho é de caderno mesmo.** Papel pautado, margem vermelha, espiral
 *    e letra manuscrita. Não é enfeite: o que faz alguém anotar é o gesto ser
 *    reconhecível, e uma caixa de texto cinza não convida ninguém a escrever.
 * 2. **A âncora é obrigatória.** Anotação solta vira lista morta. Presa à
 *    estrutura, ela reaparece ao lado da imagem que a motivou.
 * 3. **O rascunho nunca se perde.** O que está sendo digitado fica no
 *    `localStorage` a cada tecla; o servidor guarda o que foi salvo. Rede caída,
 *    aba fechada por engano, celular travado — o texto continua lá.
 */

export type EscopoCaderno = 'raio-x' | 'tomografia'
export type CorFicha = 'papel' | 'amarelo' | 'verde' | 'azul' | 'rosa'

export interface SecaoCaderno {
  id: string
  rotulo: string
}

interface Ficha {
  id: string
  secao: string
  secaoRotulo: string
  texto: string
  cor: CorFicha
  criadoEm: string
  atualizadoEm: string
}

interface CadernoProps {
  escopo: EscopoCaderno
  /** Slug do exame: é o endereço da folha. */
  chave: string
  titulo: string
  subtitulo: string
  secoes: SecaoCaderno[]
  /** Seção que a nova ficha assume por padrão — o que está aberto na tela. */
  secaoAtual?: string
}

const CORES: { id: CorFicha; rotulo: string; classe: string; amostra: string }[] = [
  { id: 'papel', rotulo: 'Sem marcação', classe: 'cad-cor-papel', amostra: 'bg-white' },
  { id: 'amarelo', rotulo: 'Marcador amarelo', classe: 'cad-cor-amarelo', amostra: 'bg-amber-300' },
  { id: 'verde', rotulo: 'Marcador verde', classe: 'cad-cor-verde', amostra: 'bg-emerald-300' },
  { id: 'azul', rotulo: 'Marcador azul', classe: 'cad-cor-azul', amostra: 'bg-sky-300' },
  { id: 'rosa', rotulo: 'Marcador rosa', classe: 'cad-cor-rosa', amostra: 'bg-pink-300' },
]

const CLASSE_COR: Record<CorFicha, string> = {
  papel: 'cad-cor-papel',
  amarelo: 'cad-cor-amarelo',
  verde: 'cad-cor-verde',
  azul: 'cad-cor-azul',
  rosa: 'cad-cor-rosa',
}

const API = '/api/manual-clinico/radiologia/caderno'

function chaveRascunho(escopo: string, chave: string) {
  return `caderno-radiologia:rascunho:${escopo}:${chave}`
}

function dataCurta(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  } catch {
    return ''
  }
}

export function CadernoRadiologico({
  escopo,
  chave,
  titulo,
  subtitulo,
  secoes,
  secaoAtual,
}: CadernoProps) {
  const [aberto, setAberto] = useState(false)
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [carregando, setCarregando] = useState(true)
  const [indisponivel, setIndisponivel] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const [rascunho, setRascunho] = useState('')
  const [corAtual, setCorAtual] = useState<CorFicha>('papel')
  const [secaoEscolhida, setSecaoEscolhida] = useState<string>(secaoAtual || secoes[0]?.id || 'geral')
  const [editando, setEditando] = useState<string | null>(null)
  const areaTexto = useRef<HTMLTextAreaElement | null>(null)

  const rotuloDaSecao = useCallback(
    (id: string) => secoes.find((secao) => secao.id === id)?.rotulo ?? id,
    [secoes],
  )

  // A âncora acompanha a estrutura selecionada no filme — enquanto o aluno não
  // escolher outra explicitamente (aí `editando` ou a seleção manual mandam).
  useEffect(() => {
    if (editando || rascunho.trim()) return
    if (secaoAtual) setSecaoEscolhida(secaoAtual)
  }, [secaoAtual, editando, rascunho])

  // Rascunho local: sobrevive a fechar a gaveta, trocar de aba e cair a rede.
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(chaveRascunho(escopo, chave))
      if (salvo) setRascunho(salvo)
    } catch {
      /* modo privado */
    }
  }, [escopo, chave])

  useEffect(() => {
    try {
      if (rascunho) window.localStorage.setItem(chaveRascunho(escopo, chave), rascunho)
      else window.localStorage.removeItem(chaveRascunho(escopo, chave))
    } catch {
      /* modo privado */
    }
  }, [rascunho, escopo, chave])

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const resposta = await fetch(`${API}?escopo=${escopo}&chave=${encodeURIComponent(chave)}`)
      if (!resposta.ok) {
        setIndisponivel(true)
        setFichas([])
        return
      }
      const dados = await resposta.json()
      setIndisponivel(false)
      setFichas(Array.isArray(dados.fichas) ? dados.fichas : [])
    } catch {
      setIndisponivel(true)
    } finally {
      setCarregando(false)
    }
  }, [escopo, chave])

  // Só busca quando a gaveta abre pela primeira vez: o caderno não pode custar
  // uma requisição a mais no carregamento de todo exame.
  const jaBuscou = useRef(false)
  useEffect(() => {
    if (!aberto || jaBuscou.current) return
    jaBuscou.current = true
    void carregar()
  }, [aberto, carregar])

  // Esc fecha a gaveta, como em qualquer painel sobreposto.
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberto(false)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  async function salvar() {
    const conteudo = rascunho.trim()
    if (!conteudo || salvando) return
    setSalvando(true)
    setErro(null)
    try {
      const resposta = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editando,
          escopo,
          chave,
          secao: secaoEscolhida,
          secaoRotulo: rotuloDaSecao(secaoEscolhida),
          texto: conteudo,
          cor: corAtual,
        }),
      })
      const dados = await resposta.json().catch(() => null)
      if (!resposta.ok) {
        setErro(dados?.error || 'Não deu para salvar agora. O texto continua aqui.')
        return
      }
      const ficha: Ficha = dados.ficha
      setFichas((atuais) => {
        const semAntiga = atuais.filter((item) => item.id !== ficha.id)
        return [ficha, ...semAntiga]
      })
      setRascunho('')
      setEditando(null)
      setCorAtual('papel')
    } catch {
      setErro('Sem conexão. O texto ficou salvo neste aparelho.')
    } finally {
      setSalvando(false)
    }
  }

  async function apagar(id: string) {
    const anteriores = fichas
    setFichas((atuais) => atuais.filter((item) => item.id !== id))
    try {
      const resposta = await fetch(`${API}?id=${id}`, { method: 'DELETE' })
      if (!resposta.ok) setFichas(anteriores)
    } catch {
      setFichas(anteriores)
    }
  }

  function editar(ficha: Ficha) {
    setEditando(ficha.id)
    setRascunho(ficha.texto)
    setCorAtual(ficha.cor)
    setSecaoEscolhida(ficha.secao)
    requestAnimationFrame(() => areaTexto.current?.focus())
  }

  const visiveis = useMemo(() => {
    const consulta = busca.trim().toLowerCase()
    if (!consulta) return fichas
    return fichas.filter(
      (ficha) =>
        ficha.texto.toLowerCase().includes(consulta) ||
        ficha.secaoRotulo.toLowerCase().includes(consulta),
    )
  }, [fichas, busca])

  return (
    <>
      {/* ── Aba do caderno: a lombada saindo da borda da tela ── */}
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-expanded={aberto}
        aria-controls="caderno-radiologico"
        className="cad-aba fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-2 rounded-l-xl border border-r-0 border-amber-900/25 py-4 pl-3 pr-2.5 shadow-lg transition hover:pr-3.5 lg:flex"
      >
        <StickyNote className="h-4 w-4 shrink-0 text-amber-900/80" />
        <span className="text-[11px] font-black uppercase tracking-widest text-amber-950/80 [writing-mode:vertical-rl]">
          Caderno
          {fichas.length > 0 && ` · ${fichas.length}`}
        </span>
      </button>

      {/* No celular a aba lateral competiria com o polegar, então vira botão
          redondo. Fica à esquerda porque o canto direito é do FAB global, e
          sobe 4,75rem para não cobrir a barra inferior da série de TC — que
          aparece justamente quando há uma estrutura selecionada, o momento em
          que mais se anota. */}
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-expanded={aberto}
        aria-controls="caderno-radiologico"
        aria-label="Abrir o caderno de anotações"
        className="cad-aba fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-amber-900/25 shadow-lg lg:hidden"
      >
        <StickyNote className="h-5 w-5 text-amber-900/80" />
        {fichas.length > 0 && (
          <span className="absolute -top-1 right-0 flex h-5 min-w-5 translate-x-1/3 items-center justify-center rounded-full bg-sky-500 px-1 font-clinical text-[10px] font-black text-white">
            {fichas.length}
          </span>
        )}
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setAberto(false)}
            aria-label="Fechar o caderno"
          />

          <div
            id="caderno-radiologico"
            className="cad-gaveta relative flex h-full w-full max-w-full flex-col sm:max-w-[440px] lg:max-w-[480px]"
          >
            {/* ── Capa ── */}
            <header className="cad-capa flex items-start gap-3 border-b border-amber-950/20 px-4 py-3.5 pl-9">
              <div className="min-w-0 flex-1">
                <p className="font-clinical text-[10px] font-bold uppercase tracking-widest text-amber-100/70">
                  Caderno radiográfico
                </p>
                <h2 className="mt-0.5 truncate font-heading text-base font-semibold text-amber-50">
                  {titulo}
                </h2>
                <p className="truncate text-[11px] text-amber-100/60">{subtitulo}</p>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar o caderno"
                className="-m-1.5 shrink-0 rounded-lg p-1.5 text-amber-100/70 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* ── Folha ── */}
            <div className="cad-papel cad-espiral relative flex min-h-0 flex-1 flex-col">
              {/* Nova ficha */}
              <div className="border-b border-amber-950/10 px-4 py-3 pl-9">
                <label
                  htmlFor="caderno-secao"
                  className="font-clinical text-[10px] font-bold uppercase tracking-widest text-amber-900/60"
                >
                  {editando ? 'Editando a ficha de' : 'Anotar em'}
                </label>
                <select
                  id="caderno-secao"
                  value={secaoEscolhida}
                  onChange={(evento) => setSecaoEscolhida(evento.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-amber-900/20 bg-white/70 px-2.5 text-[13px] font-semibold text-neutral-800 outline-none transition focus:border-amber-700/50 focus:ring-2 focus:ring-amber-500/15"
                >
                  {secoes.map((secao) => (
                    <option key={secao.id} value={secao.id}>
                      {secao.rotulo}
                    </option>
                  ))}
                </select>

                <textarea
                  ref={areaTexto}
                  value={rascunho}
                  onChange={(evento) => setRascunho(evento.target.value)}
                  onKeyDown={(evento) => {
                    if ((evento.metaKey || evento.ctrlKey) && evento.key === 'Enter') {
                      evento.preventDefault()
                      void salvar()
                    }
                  }}
                  rows={3}
                  maxLength={4000}
                  placeholder="hilo esquerdo sempre mais alto que o direito…"
                  className="cad-manuscrito mt-2.5 w-full resize-y rounded-lg border border-amber-900/20 bg-white/70 px-3 py-2 text-[16px] leading-[26px] text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-amber-700/50 focus:ring-2 focus:ring-amber-500/15"
                />

                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-1.5" role="group" aria-label="Cor da marcação">
                    {CORES.map((cor) => (
                      <button
                        key={cor.id}
                        type="button"
                        onClick={() => setCorAtual(cor.id)}
                        title={cor.rotulo}
                        aria-label={cor.rotulo}
                        aria-pressed={corAtual === cor.id}
                        className={`h-5 w-5 rounded-full border transition ${cor.amostra} ${
                          corAtual === cor.id
                            ? 'border-amber-900/70 ring-2 ring-amber-700/30'
                            : 'border-amber-900/25 hover:scale-110'
                        }`}
                      />
                    ))}
                  </div>

                  {editando && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditando(null)
                        setRascunho('')
                        setCorAtual('papel')
                      }}
                      className="ml-auto rounded-lg px-2 py-1.5 text-[11px] font-bold text-neutral-500 transition hover:text-neutral-800"
                    >
                      Cancelar
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void salvar()}
                    disabled={!rascunho.trim() || salvando}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-lg bg-amber-900 px-3.5 text-[12px] font-bold text-amber-50 transition disabled:opacity-40 ${
                      editando ? '' : 'ml-auto'
                    }`}
                  >
                    {salvando ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : editando ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    {editando ? 'Salvar' : 'Anotar'}
                  </button>
                </div>

                {erro && (
                  <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold text-red-700">
                    <WifiOff className="mt-0.5 h-3 w-3 shrink-0" /> {erro}
                  </p>
                )}
              </div>

              {/* Fichas */}
              <div className="rx-rolagem min-h-0 flex-1 overflow-y-auto px-4 py-3 pl-9">
                {fichas.length > 4 && (
                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                    <input
                      value={busca}
                      onChange={(evento) => setBusca(evento.target.value)}
                      placeholder="Buscar nas anotações…"
                      aria-label="Buscar nas anotações desta folha"
                      className="h-8 w-full rounded-lg border border-amber-900/15 bg-white/60 pl-8 pr-2 text-xs text-neutral-800 outline-none focus:border-amber-700/40"
                    />
                  </div>
                )}

                {carregando ? (
                  <p className="flex items-center justify-center gap-2 py-10 text-xs text-neutral-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Abrindo a folha…
                  </p>
                ) : indisponivel ? (
                  <p className="py-10 text-center text-xs leading-relaxed text-neutral-500">
                    O caderno fica na sua conta e sincroniza entre os aparelhos.
                    <br />
                    Entre na conta para abrir esta folha.
                  </p>
                ) : visiveis.length === 0 ? (
                  <p className="cad-manuscrito py-10 text-center text-[17px] leading-relaxed text-neutral-400">
                    {fichas.length === 0
                      ? 'a folha está em branco — anote o que você não quer esquecer deste exame'
                      : 'nada encontrado nesta folha'}
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {visiveis.map((ficha) => (
                      <li
                        key={ficha.id}
                        className={`cad-ficha ${CLASSE_COR[ficha.cor]} group rounded-lg px-3 py-2.5`}
                      >
                        <div className="flex items-start gap-2">
                          <p className="min-w-0 flex-1 font-clinical text-[10px] font-bold uppercase tracking-wider text-amber-900/70">
                            {ficha.secaoRotulo}
                          </p>
                          <span className="shrink-0 font-clinical text-[10px] text-neutral-500">
                            {dataCurta(ficha.atualizadoEm)}
                          </span>
                        </div>
                        <p className="cad-manuscrito mt-1 whitespace-pre-wrap text-[16px] leading-[26px] text-neutral-800">
                          {ficha.texto}
                        </p>
                        <div className="mt-1.5 flex justify-end gap-1 opacity-60 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => editar(ficha)}
                            aria-label="Editar esta ficha"
                            className="rounded p-1.5 text-neutral-600 transition hover:bg-amber-900/10 hover:text-neutral-900"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void apagar(ficha.id)}
                            aria-label="Apagar esta ficha"
                            className="rounded p-1.5 text-neutral-600 transition hover:bg-red-500/10 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
