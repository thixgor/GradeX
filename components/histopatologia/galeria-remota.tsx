'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'

import type { MidiaExibivel } from '@/lib/histopatologia/esquemas'
import { MIDIAS_POR_PAGINA } from '@/lib/histopatologia/midia'
import { ImagemHistopatologicaRemota } from './imagem-remota'

/**
 * Galeria de referências remotas, filtrável e paginada.
 *
 * ## Por que paginar
 *
 * Uma entrada do catálogo chega a 5.369 referências. A paginação limita tanto
 * o número de nós no DOM quanto o tráfego das imagens remotas, sem transformar
 * o acervo em uma lista impraticável.
 *
 * ## Filtro no cliente
 *
 * As mídias já chegam filtradas e paginadas pelo servidor quando vêm do
 * inventário completo (`lib/histopatologia/acervo.ts`). Aqui o filtro atua sobre
 * o conjunto recebido — é o caso da galeria curada de uma doença, que tem
 * dezenas de itens, não milhares.
 */

export interface GaleriaRemotaProps {
  midias: MidiaExibivel[]
  /** Rótulo acessível da região, obrigatório: há mais de uma galeria por página. */
  titulo: string
  porPagina?: number
  /** Oculta os filtros quando o conjunto é pequeno demais para justificá-los. */
  comFiltros?: boolean
}

export function GaleriaRemota({
  midias,
  titulo,
  porPagina = MIDIAS_POR_PAGINA,
  comFiltros = true,
}: GaleriaRemotaProps) {
  const [modalidade, setModalidade] = useState<string>('')
  const [coloracao, setColoracao] = useState<string>('')
  const [pagina, setPagina] = useState(1)

  const facetas = useMemo(() => {
    const modalidades = new Set<string>()
    const coloracoes = new Set<string>()
    for (const m of midias) {
      modalidades.add(m.modalidade)
      if (m.coloracao && m.coloracao !== 'Não informado') coloracoes.add(m.coloracao)
    }
    return {
      modalidades: [...modalidades].sort(),
      coloracoes: [...coloracoes].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    }
  }, [midias])

  const filtradas = useMemo(
    () =>
      midias.filter(
        (m) =>
          (!modalidade || m.modalidade === modalidade) && (!coloracao || m.coloracao === coloracao),
      ),
    [midias, modalidade, coloracao],
  )

  const totalDePaginas = Math.max(1, Math.ceil(filtradas.length / porPagina))
  const paginaAtual = Math.min(pagina, totalDePaginas)
  const visiveis = filtradas.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)

  const trocarFiltro = (aplicar: () => void) => {
    aplicar()
    setPagina(1)
  }

  if (midias.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
        Nenhuma referência de mídia elegível para esta seleção. Isso não significa que o acervo não
        tenha lâminas do assunto — significa que as referências catalogadas não passaram pela
        allowlist de domínios da fonte ou ainda não foram curadas.
      </p>
    )
  }

  return (
    <div>
      {comFiltros && (facetas.modalidades.length > 1 || facetas.coloracoes.length > 1) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Filter className="h-3.5 w-3.5" aria-hidden />
            Filtrar
          </span>
          {facetas.modalidades.length > 1 && (
            <label className="text-xs">
              <span className="sr-only">Modalidade</span>
              <select
                value={modalidade}
                onChange={(e) => trocarFiltro(() => setModalidade(e.target.value))}
                className="min-h-[36px] rounded-md border border-border bg-card px-2 text-xs font-semibold"
              >
                <option value="">Todas as modalidades</option>
                {facetas.modalidades.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          )}
          {facetas.coloracoes.length > 1 && (
            <label className="text-xs">
              <span className="sr-only">Coloração</span>
              <select
                value={coloracao}
                onChange={(e) => trocarFiltro(() => setColoracao(e.target.value))}
                className="min-h-[36px] rounded-md border border-border bg-card px-2 text-xs font-semibold"
              >
                <option value="">Todas as colorações</option>
                {facetas.coloracoes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {filtradas.length.toLocaleString('pt-BR')} de {midias.length.toLocaleString('pt-BR')}{' '}
            referências
          </span>
        </div>
      )}

      {filtradas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Nenhuma referência com esta combinação de filtros.
        </p>
      ) : (
        <ul
          aria-label={titulo}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visiveis.map((midia) => (
            <li key={midia.id}>
              <ImagemHistopatologicaRemota midia={midia} />
            </li>
          ))}
        </ul>
      )}

      {totalDePaginas > 1 && (
        <nav
          className="mt-4 flex items-center justify-between gap-2"
          aria-label={`Paginação — ${titulo}`}
        >
          <button
            type="button"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={paginaAtual === 1}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-bold transition-colors hover:border-teal-600/50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Anterior
          </button>
          <p className="text-xs font-semibold text-muted-foreground" aria-live="polite">
            Página {paginaAtual} de {totalDePaginas}
          </p>
          <button
            type="button"
            onClick={() => setPagina((p) => Math.min(totalDePaginas, p + 1))}
            disabled={paginaAtual === totalDePaginas}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-bold transition-colors hover:border-teal-600/50 disabled:opacity-40"
          >
            Próxima
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </nav>
      )}
    </div>
  )
}
