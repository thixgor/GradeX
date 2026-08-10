'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'

import type { EntradaBusca, EstadoDeRevisao } from '@/lib/histopatologia/esquemas'
import {
  ROTULO_DE_TIPO,
  buscar,
  fatiarParaRealce,
  type Resultado,
  type TipoDeResultado,
} from '@/lib/histopatologia/busca'
import { BASE } from '@/lib/histopatologia/rotas'
import { MARCA_DE_REVISAO } from './tema'

/**
 * Busca da Histopatologia.
 *
 * ## Duas fontes, uma lista
 *
 * 1. **índice local** — doenças, sistemas e mecanismos (7 KB). Buscado **na
 *    primeira interação**, não na montagem: quem abre a home para ver o mapa de
 *    sistemas não paga por um índice que talvez não use. Depois disso, filtrar é
 *    síncrono e responde a cada tecla;
 * 2. **rota de servidor** — as 2.917 entradas catalogadas, com atraso de 180 ms.
 *    Esse índice tem 915 KB e não desce para o navegador; o servidor devolve
 *    apenas os resultados.
 *
 * As duas se fundem numa lista só, reordenada pelo **mesmo** ranqueador que o
 * servidor usa (`lib/histopatologia/busca.ts`). Um segundo ranqueador produziria
 * ordens diferentes conforme a rede tivesse respondido ou não.
 *
 * ## O que nunca trafega
 *
 * Nenhum dos dois índices contém URL de mídia. A busca não é um caminho lateral
 * para contornar o portão de direitos: mesmo quem baixasse o índice inteiro
 * obteria nomes, sistemas e rotas — nada que aponte para um arquivo de imagem.
 */

const ATRASO_SERVIDOR = 180

const CLASSE_DE_TIPO: Record<TipoDeResultado, string> = {
  doenca: 'border-teal-500/40 bg-teal-500/10 text-teal-800 dark:text-teal-300',
  entrada: 'border-border bg-muted text-muted-foreground',
  sistema: 'border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300',
  mecanismo: 'border-violet-500/40 bg-violet-500/10 text-violet-800 dark:text-violet-300',
}

const TIPOS: TipoDeResultado[] = ['doenca', 'mecanismo', 'sistema', 'entrada']

export interface BuscaProps {
  variante?: 'hero' | 'pagina'
  placeholder?: string
  filtrosVisiveis?: boolean
  autoFoco?: boolean
}

export function BuscaDaHistopatologia({
  variante = 'hero',
  placeholder = 'Buscar doença, mecanismo, órgão ou lâmina catalogada…',
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
  const [tiposAtivos, setTiposAtivos] = useState<TipoDeResultado[]>([])
  const [apenasRevisado, setApenasRevisado] = useState(false)

  const carregarIndice = useCallback(() => {
    if (indiceLocal || carregandoIndice) return
    setCarregandoIndice(true)
    fetch('/api/manual-clinico/histopatologia/indice')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('índice indisponível'))))
      .then((dados: EntradaBusca[]) => setIndiceLocal(dados))
      .catch(() => setIndiceLocal([])) // o servidor ainda responde; degrada, não quebra
      .finally(() => setCarregandoIndice(false))
  }, [indiceLocal, carregandoIndice])

  useEffect(() => {
    if (autoFoco) campoRef.current?.focus()
  }, [autoFoco])

  useEffect(() => {
    if (termo.trim().length < 2) {
      setDoServidor([])
      return
    }
    const controlador = new AbortController()
    setBuscandoServidor(true)
    const id = setTimeout(() => {
      fetch(`/api/manual-clinico/histopatologia/busca?q=${encodeURIComponent(termo)}`, {
        signal: controlador.signal,
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('busca indisponível'))))
        .then((dados: Resultado[]) => setDoServidor(dados))
        .catch(() => {
          /* aborto ou falha de rede: a lista local continua servindo */
        })
        .finally(() => setBuscandoServidor(false))
    }, ATRASO_SERVIDOR)

    return () => {
      clearTimeout(id)
      controlador.abort()
    }
  }, [termo])

  const resultados = useMemo(() => {
    const locais = buscar(indiceLocal ?? [], termo, { limite: 40 })
    const vistos = new Set(locais.map((r) => r.url))
    const combinados = [...locais, ...doServidor.filter((r) => !vistos.has(r.url))]
    return combinados
      .filter((r) => tiposAtivos.length === 0 || tiposAtivos.includes(r.tipo))
      .filter((r) => !apenasRevisado || r.estadoDeRevisao === 'publicado')
      .sort((a, b) => b.peso - a.peso || a.titulo.localeCompare(b.titulo, 'pt-BR'))
      .slice(0, 40)
  }, [indiceLocal, termo, doServidor, tiposAtivos, apenasRevisado])

  const mostrandoResultados = termo.trim().length >= 2

  return (
    <div className={variante === 'pagina' ? '' : 'relative'}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id={idCampo}
          ref={campoRef}
          type="search"
          value={termo}
          role="searchbox"
          aria-label="Buscar na Histopatologia"
          aria-describedby={`${idCampo}-ajuda`}
          placeholder={placeholder}
          onFocus={carregarIndice}
          onChange={(e) => {
            carregarIndice()
            setTermo(e.target.value)
          }}
          className="min-h-[48px] w-full rounded-lg border border-border bg-card pl-9 pr-10 text-sm outline-none transition-colors focus-visible:border-teal-600/60 focus-visible:ring-2 focus-visible:ring-teal-600/30"
        />
        {(carregandoIndice || buscandoServidor) && (
          <Loader2
            className="absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground motion-reduce:animate-none"
            aria-hidden
          />
        )}
        {termo && (
          <button
            type="button"
            onClick={() => {
              setTermo('')
              campoRef.current?.focus()
            }}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-md text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="mx-auto h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      <p id={`${idCampo}-ajuda`} className="mt-1.5 text-[11px] text-muted-foreground">
        Funciona sem acento e tolera plural. Sinônimos em inglês encontram quando foram cadastrados
        pela edição — não traduzimos títulos automaticamente.
      </p>

      {filtrosVisiveis && (
        <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Filtros de busca">
          {TIPOS.map((tipo) => {
            const ativo = tiposAtivos.includes(tipo)
            return (
              <button
                key={tipo}
                type="button"
                aria-pressed={ativo}
                onClick={() =>
                  setTiposAtivos((atual) =>
                    atual.includes(tipo) ? atual.filter((t) => t !== tipo) : [...atual, tipo],
                  )
                }
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors ${
                  ativo ? CLASSE_DE_TIPO[tipo] : 'border-border bg-card text-muted-foreground'
                }`}
              >
                <span aria-hidden>{ativo ? '●' : '○'}</span>
                {ROTULO_DE_TIPO[tipo]}
              </button>
            )
          })}
          <button
            type="button"
            aria-pressed={apenasRevisado}
            onClick={() => setApenasRevisado((v) => !v)}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors ${
              apenasRevisado
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                : 'border-border bg-card text-muted-foreground'
            }`}
          >
            <span aria-hidden>{apenasRevisado ? '●' : '○'}</span>
            Só conteúdo revisado
          </button>
        </div>
      )}

      {mostrandoResultados && (
        <div className="mt-3" aria-live="polite">
          {resultados.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              Nada encontrado para “{termo}”. Tente o nome da doença, do órgão, da coloração ou do
              mecanismo patológico.
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {resultados.map((r) => (
                <li key={`${r.tipo}-${r.url}`}>
                  <Link
                    href={`${BASE}/${r.url}`}
                    className="flex min-h-[44px] flex-col gap-0.5 p-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${CLASSE_DE_TIPO[r.tipo]}`}
                      >
                        {ROTULO_DE_TIPO[r.tipo]}
                      </span>
                      {r.estadoDeRevisao && <MarcaDeRevisaoCompacta estado={r.estadoDeRevisao} />}
                      <span className="text-sm font-semibold">
                        {fatiarParaRealce(r.titulo, termo).map((parte, i) =>
                          parte.realce ? (
                            <mark key={i} className="rounded bg-teal-500/25 px-0.5">
                              {parte.texto}
                            </mark>
                          ) : (
                            <span key={i}>{parte.texto}</span>
                          ),
                        )}
                      </span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {r.trilha} · {r.razao}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function MarcaDeRevisaoCompacta({ estado }: { estado: EstadoDeRevisao }) {
  const marca = MARCA_DE_REVISAO[estado]
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${marca.classe}`}>
      <span aria-hidden>{marca.simbolo}</span> {marca.rotulo}
    </span>
  )
}
