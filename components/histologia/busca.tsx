'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Columns2, History, Loader2, Microscope, Search, Sparkles, Trash2, X } from 'lucide-react'

import {
  buscar,
  fatiarParaRealce,
  type Resultado,
  type TipoDeResultado,
} from '@/lib/histologia/busca'
import type { EntradaBusca } from '@/lib/histologia/esquemas'
import { faixaDeResultados, registrarEvento } from '@/lib/histologia/analitica'
import { BASE } from '@/lib/histologia/rotas'

/**
 * Busca instantânea do Manual da Histologia.
 *
 * ## Duas fontes, uma lista
 *
 * 1. **índice local** — lâminas, seções e quizzes (1.543 entradas, 88 KB
 *    comprimidos). Buscado **na primeira interação**, não na montagem: quem
 *    abre a home para ver o mapa curricular não paga por um índice que talvez
 *    não use. A partir daí, filtrar é síncrono e responde a cada tecla;
 * 2. **rota de servidor** — os 7.453 rótulos de estrutura, com atraso de 160 ms.
 *
 * As duas se fundem numa lista só, reordenada pelo mesmo ranqueador
 * (`lib/histologia/busca.ts`) que o servidor usa. Um segundo ranqueador
 * produziria ordens diferentes conforme a rede tivesse respondido ou não.
 *
 * ## Histórico
 *
 * Fica no dispositivo, é removível item a item e some por inteiro num clique.
 * O termo digitado **nunca** vai para telemetria — só a categoria da busca e a
 * faixa de quantos resultados apareceram.
 */

const CHAVE_HISTORICO = 'histologia-busca-historico'
const MAXIMO_HISTORICO = 8
const ATRASO_SERVIDOR = 160

const ROTULO_DE_TIPO: Record<TipoDeResultado, string> = {
  lamina: 'Lâmina',
  secao: 'Seção',
  estrutura: 'Estrutura',
  quiz: 'Quiz',
}

const CLASSE_DE_TIPO: Record<TipoDeResultado, string> = {
  lamina: 'border-teal-500/40 bg-teal-500/10 text-teal-800 dark:text-teal-300',
  secao: 'border-border bg-muted text-muted-foreground',
  estrutura: 'border-violet-500/40 bg-violet-500/10 text-violet-800 dark:text-violet-300',
  quiz: 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300',
}

export interface BuscaProps {
  /** `hero` na home; `pagina` no atlas, com filtros à mostra. */
  variante?: 'hero' | 'pagina'
  placeholder?: string
  filtrosVisiveis?: boolean
  autoFoco?: boolean
}

export function BuscaDaHistologia({
  variante = 'hero',
  placeholder = 'Buscar estrutura, tecido, órgão ou coloração…',
  filtrosVisiveis = false,
  autoFoco = false,
}: BuscaProps) {
  const idCampo = useId()
  const campoRef = useRef<HTMLInputElement | null>(null)

  const [termo, setTermo] = useState('')
  const [indiceLocal, setIndiceLocal] = useState<EntradaBusca[] | null>(null)
  const [carregandoIndice, setCarregandoIndice] = useState(false)
  const [doServidor, setDoServidor] = useState<Resultado[]>([])
  const [buscandoServidor, setBuscandoServidor] = useState(false)
  const [historico, setHistorico] = useState<string[]>([])
  const [tiposAtivos, setTiposAtivos] = useState<TipoDeResultado[]>([])
  const [indiceFocado, setIndiceFocado] = useState(-1)

  /* ── histórico ── */
  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE_HISTORICO)
      if (bruto) setHistorico(JSON.parse(bruto).slice(0, MAXIMO_HISTORICO))
    } catch {
      /* histórico corrompido não pode impedir a busca de funcionar */
    }
  }, [])

  const gravarHistorico = useCallback((lista: string[]) => {
    setHistorico(lista)
    try {
      window.localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(lista))
    } catch {
      /* sem storage, o histórico vive só nesta sessão */
    }
  }, [])

  /* ── carga do índice local, sob demanda ── */
  const carregarIndice = useCallback(() => {
    if (indiceLocal || carregandoIndice) return
    setCarregandoIndice(true)
    fetch('/api/manual-clinico/histologia/indice')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('índice indisponível'))))
      .then((dados: EntradaBusca[]) => setIndiceLocal(dados))
      .catch(() => setIndiceLocal([])) // o servidor ainda responde; degrada, não quebra
      .finally(() => setCarregandoIndice(false))
  }, [indiceLocal, carregandoIndice])

  /* ── busca no servidor, com atraso e cancelamento ── */
  useEffect(() => {
    if (termo.trim().length < 2) {
      setDoServidor([])
      return
    }
    const controlador = new AbortController()
    setBuscandoServidor(true)

    const temporizador = setTimeout(() => {
      const parametros = new URLSearchParams({ q: termo, limite: '40' })
      tiposAtivos.forEach((t) => parametros.append('tipo', t))
      fetch(`/api/manual-clinico/histologia/busca?${parametros}`, { signal: controlador.signal })
        .then((r) => r.json())
        .then((dados: { resultados: Resultado[] }) => setDoServidor(dados.resultados ?? []))
        .catch(() => {
          /* abortada ou offline: os resultados locais continuam valendo */
        })
        .finally(() => setBuscandoServidor(false))
    }, ATRASO_SERVIDOR)

    // Cancela a requisição obsoleta a cada tecla — sem isso, respostas fora de
    // ordem sobrescreveriam a lista com o resultado de um termo já apagado.
    return () => {
      clearTimeout(temporizador)
      controlador.abort()
    }
  }, [termo, tiposAtivos])

  /* ── fusão e ranqueamento ── */
  const resultados = useMemo(() => {
    if (termo.trim().length < 2) return []
    const locais = indiceLocal
      ? buscar(indiceLocal, termo, {
          limite: 40,
          filtros: tiposAtivos.length > 0 ? { tipos: tiposAtivos } : {},
        })
      : []

    const porChave = new Map<string, Resultado>()
    for (const r of [...locais, ...doServidor]) {
      const chave = `${r.url}#${r.overlay ?? ''}`
      const existente = porChave.get(chave)
      if (!existente || r.peso > existente.peso) porChave.set(chave, r)
    }
    return [...porChave.values()].sort((a, b) => b.peso - a.peso).slice(0, 40)
  }, [termo, indiceLocal, doServidor, tiposAtivos])

  useEffect(() => {
    setIndiceFocado(-1)
  }, [termo])

  const registrarBusca = useCallback(() => {
    const limpo = termo.trim()
    if (limpo.length < 2) return
    gravarHistorico([limpo, ...historico.filter((h) => h !== limpo)].slice(0, MAXIMO_HISTORICO))
    // Só a categoria e a faixa — o termo digitado nunca sai do dispositivo.
    registrarEvento({
      nome: 'busca_executada',
      escopo:
        tiposAtivos.length === 1
          ? (tiposAtivos[0] as 'lamina' | 'estrutura' | 'quiz')
          : 'misto',
      faixa: faixaDeResultados(resultados.length),
    })
  }, [termo, historico, gravarHistorico, tiposAtivos, resultados.length])

  /* ── teclado ── */
  const aoTeclar = (evento: React.KeyboardEvent<HTMLInputElement>) => {
    if (resultados.length === 0) return
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setIndiceFocado((i) => Math.min(i + 1, resultados.length - 1))
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      setIndiceFocado((i) => Math.max(i - 1, -1))
    } else if (evento.key === 'Enter' && indiceFocado >= 0) {
      evento.preventDefault()
      registrarBusca()
      window.location.href = destinoDe(resultados[indiceFocado])
    } else if (evento.key === 'Escape') {
      setTermo('')
    }
  }

  const buscando = termo.trim().length >= 2
  const heroico = variante === 'hero'

  return (
    <div className="w-full">
      <div className="relative">
        <label htmlFor={idCampo} className="sr-only">
          Buscar no Manual da Histologia
        </label>
        <Search
          className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 ${
            heroico ? 'h-5 w-5' : 'h-4 w-4'
          }`}
          aria-hidden
        />
        <input
          ref={campoRef}
          id={idCampo}
          type="search"
          role="combobox"
          aria-expanded={buscando && resultados.length > 0}
          aria-controls={`${idCampo}-resultados`}
          aria-autocomplete="list"
          aria-activedescendant={
            indiceFocado >= 0 ? `${idCampo}-opcao-${indiceFocado}` : undefined
          }
          autoFocus={autoFoco}
          value={termo}
          placeholder={placeholder}
          onFocus={carregarIndice}
          onChange={(e) => setTermo(e.target.value)}
          onKeyDown={aoTeclar}
          onBlur={registrarBusca}
          className={`w-full rounded-xl border border-border bg-card pl-11 pr-11 outline-none transition-colors focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500/30 ${
            heroico ? 'h-14 text-base' : 'h-11 text-sm'
          }`}
        />
        {termo && (
          <button
            type="button"
            onClick={() => {
              setTermo('')
              campoRef.current?.focus()
            }}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
        {(carregandoIndice || buscandoServidor) && !termo && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
        )}
      </div>

      {filtrosVisiveis && (
        <fieldset className="mt-3">
          <legend className="sr-only">Filtrar por tipo de resultado</legend>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ROTULO_DE_TIPO) as TipoDeResultado[]).map((tipo) => {
              const ativo = tiposAtivos.includes(tipo)
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() =>
                    setTiposAtivos((atual) =>
                      atual.includes(tipo) ? atual.filter((t) => t !== tipo) : [...atual, tipo],
                    )
                  }
                  aria-pressed={ativo}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
                    ativo ? 'border-teal-700 bg-teal-700 text-white' : 'border-border bg-card hover:border-teal-500/50'
                  }`}
                >
                  <span aria-hidden className="font-mono text-[10px]">
                    {ativo ? '●' : '○'}
                  </span>
                  {ROTULO_DE_TIPO[tipo]}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {/* ── Histórico ── */}
      {!buscando && historico.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <History className="h-3 w-3" aria-hidden />
              Buscas recentes
            </p>
            <button
              type="button"
              onClick={() => gravarHistorico([])}
              className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[10px] text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" aria-hidden />
              Apagar tudo
            </button>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {historico.map((item) => (
              <li key={item} className="inline-flex items-center overflow-hidden rounded-full border border-border bg-card">
                <button
                  type="button"
                  onClick={() => {
                    carregarIndice()
                    setTermo(item)
                  }}
                  className="min-h-[32px] py-1 pl-3 pr-1.5 text-xs hover:text-teal-700"
                >
                  {item}
                </button>
                <button
                  type="button"
                  onClick={() => gravarHistorico(historico.filter((h) => h !== item))}
                  aria-label={`Remover "${item}" do histórico`}
                  className="flex h-8 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Resultados ── */}
      {buscando && (
        <div className="mt-4">
          <p aria-live="polite" className="mb-2 text-xs text-muted-foreground">
            {resultados.length === 0 && !buscandoServidor && !carregandoIndice
              ? `Nada encontrado para “${termo}”. Tente o nome anatômico, um sinônimo ou o termo em inglês.`
              : `${resultados.length} resultado${resultados.length === 1 ? '' : 's'}`}
          </p>

          <ul id={`${idCampo}-resultados`} role="listbox" aria-label="Resultados da busca" className="space-y-1.5">
            {resultados.map((resultado, i) => (
              <li key={`${resultado.url}#${resultado.overlay ?? ''}`} role="none">
                <ItemDeResultado
                  id={`${idCampo}-opcao-${i}`}
                  resultado={resultado}
                  termo={termo}
                  focado={i === indiceFocado}
                  onNavegar={registrarBusca}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function destinoDe(resultado: Resultado): string {
  const base = `${BASE}/${resultado.url}`
  // A estrutura abre a lâmina já com a camada correta ligada. Não prometemos
  // centralizar: o acervo não fornece a geometria do marcador, e fingir um
  // enquadramento levaria o aluno ao lugar errado com ar de precisão.
  return resultado.overlay ? `${base}?estrutura=${encodeURIComponent(resultado.overlay)}` : base
}

function ItemDeResultado({
  id,
  resultado,
  termo,
  focado,
  onNavegar,
}: {
  id: string
  resultado: Resultado
  termo: string
  focado: boolean
  onNavegar: () => void
}) {
  const partes = fatiarParaRealce(resultado.titulo, termo)

  return (
    <Link
      id={id}
      role="option"
      aria-selected={focado}
      href={destinoDe(resultado)}
      onClick={onNavegar}
      className={`flex min-h-[44px] items-start gap-3 rounded-lg border bg-card p-3 transition-colors ${
        focado ? 'border-teal-600 ring-1 ring-teal-600' : 'border-border hover:border-teal-500/45'
      }`}
    >
      <span
        className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${CLASSE_DE_TIPO[resultado.tipo]}`}
      >
        {ROTULO_DE_TIPO[resultado.tipo]}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug">
          {partes.map((parte, i) =>
            parte.realce ? (
              <mark key={i} className="rounded bg-amber-300/50 px-0.5 text-inherit dark:bg-amber-500/30">
                {parte.texto}
              </mark>
            ) : (
              <span key={i}>{parte.texto}</span>
            ),
          )}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
          {resultado.trilha}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground/80">
          <Sparkles className="h-2.5 w-2.5" aria-hidden />
          {resultado.razao}
        </span>
      </span>

      <span className="hidden shrink-0 items-center gap-1 self-center text-[10px] font-medium text-muted-foreground sm:flex">
        {resultado.tipo === 'estrutura' ? (
          <>
            <Microscope className="h-3.5 w-3.5" aria-hidden />
            Ver no microscópio
          </>
        ) : (
          <>
            <Columns2 className="h-3.5 w-3.5" aria-hidden />
            Estudar
          </>
        )}
      </span>
    </Link>
  )
}
