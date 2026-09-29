'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Crosshair, Search } from 'lucide-react'

import type { EstruturaMarcada, NivelDeRegeneracao, TipoDeEstrutura } from '@/lib/histologia-zoom/estruturas/tipos'
import type { AchadoMarcado, CategoriaDeAchado, MarcacaoExibida } from '@/lib/histopatologia-zoom/tipos'

import { SinalDePatologia } from './sinal-de-patologia'

/**
 * Catálogo de estruturas marcadas na lâmina.
 *
 * Agrupa as marcações pelo verbete do glossário: "Célula de Purkinje" aparece
 * uma vez, com um botão por local marcado. Clicar leva o visualizador até a
 * estrutura e desenha a marcação; o detalhe (características, funções,
 * regeneração, onde encontrar, alterações) abre por baixo, em seções
 * recolhíveis — o essencial à vista, o aprofundamento a um toque.
 */

const ROTULO_DO_TIPO: Record<TipoDeEstrutura, string> = {
  celula: 'Célula',
  camada: 'Camada',
  regiao: 'Região',
  epitelio: 'Epitélio',
  glandula: 'Glândula',
  vaso: 'Vaso',
  fibra: 'Fibra',
  matriz: 'Matriz',
  'orgao-parte': 'Parte do órgão',
  artefato: 'Artefato',
}

const REGENERACAO: Record<NivelDeRegeneracao, { rotulo: string; classe: string }> = {
  alta: { rotulo: 'Alta', classe: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300' },
  moderada: { rotulo: 'Moderada', classe: 'bg-teal-500/15 text-teal-800 dark:text-teal-300' },
  baixa: { rotulo: 'Baixa', classe: 'bg-amber-500/15 text-amber-800 dark:text-amber-300' },
  nula: { rotulo: 'Nula', classe: 'bg-rose-500/15 text-rose-800 dark:text-rose-300' },
  'nao-se-aplica': { rotulo: 'Não se aplica', classe: 'bg-muted text-muted-foreground' },
}

const ROTULO_DA_CATEGORIA: Record<CategoriaDeAchado, string> = {
  'lesao-celular': 'Lesão celular',
  inflamacao: 'Inflamação',
  reparo: 'Reparo',
  circulatorio: 'Circulatório',
  deposito: 'Depósito',
  adaptacao: 'Adaptação',
  neoplasia: 'Neoplasia',
  agente: 'Agente',
  arquitetura: 'Arquitetura',
}

interface Grupo {
  /** Chave do grupo: categoria + verbete (um achado e uma estrutura podem ter o mesmo id). */
  chave: string
  estrutura: string
  patologico: boolean
  marcacoes: MarcacaoExibida[]
}

export function CatalogoDeEstruturas({
  estruturas,
  selecionada,
  onSelecionar,
  compacto = false,
}: {
  estruturas: MarcacaoExibida[]
  /** Id da marcação selecionada. */
  selecionada: string | null
  onSelecionar: (id: string | null) => void
  compacto?: boolean
}) {
  const [filtro, setFiltro] = useState('')
  const [abertos, setAbertos] = useState<Set<string>>(new Set())

  const grupos = useMemo(() => {
    const mapa = new Map<string, Grupo>()
    for (const e of estruturas) {
      const patologico = e.categoria === 'patologica'
      const chave = `${patologico ? 'p' : 'h'}:${e.estrutura}`
      const g = mapa.get(chave) ?? { chave, estrutura: e.estrutura, patologico, marcacoes: [] }
      g.marcacoes.push(e)
      mapa.set(chave, g)
    }
    const termo = normalizar(filtro)
    return [...mapa.values()].filter((g) => {
      if (!termo) return true
      const v = g.marcacoes[0].verbete
      return normalizar([v.nome, ...(v.sinonimos ?? []), ...g.marcacoes.map((m) => m.rotulo ?? '')].join(' ')).includes(termo)
    })
  }, [estruturas, filtro])

  const marcada = estruturas.find((e) => e.id === selecionada)
  const grupoSelecionado = marcada ? `${marcada.categoria === 'patologica' ? 'p' : 'h'}:${marcada.estrutura}` : null
  const temAchados = grupos.some((g) => g.patologico)
  const secoes: Array<{ titulo: string | null; patologica: boolean; itens: Grupo[] }> = temAchados
    ? [
        { titulo: 'Achados histopatológicos', patologica: true, itens: grupos.filter((g) => g.patologico) },
        { titulo: 'Histologia de referência', patologica: false, itens: grupos.filter((g) => !g.patologico) },
      ]
    : [{ titulo: null, patologica: false, itens: grupos }]

  const alternar = (id: string) =>
    setAbertos((a) => {
      const n = new Set(a)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  return (
    <div>
      {estruturas.length > 6 && (
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label className="sr-only" htmlFor={`filtro-estruturas-${compacto ? 'p' : 'l'}`}>
            Filtrar estruturas
          </label>
          <input
            id={`filtro-estruturas-${compacto ? 'p' : 'l'}`}
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar estruturas…"
            className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-2 text-sm"
          />
        </div>
      )}
      {secoes.map((secao) =>
        secao.itens.length === 0 ? null : (
          <section key={secao.titulo ?? 'todas'} className={secao.titulo ? 'mb-4 last:mb-0' : ''}>
            {secao.titulo && (
              <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {secao.patologica ? (
                  <SinalDePatologia className="h-3.5 w-3.5" />
                ) : (
                  <Crosshair className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" aria-hidden />
                )}
                {secao.titulo} ({secao.itens.length})
              </h3>
            )}
      <ul className="space-y-1.5">
        {secao.itens.map((g) => {
          const v = g.marcacoes[0].verbete
          const ativo = grupoSelecionado === g.chave
          const aberto = abertos.has(g.chave) || ativo
          const moldura = ativo
            ? g.patologico
              ? 'border-rose-500/60 bg-rose-500/[0.06]'
              : 'border-cyan-500/60 bg-cyan-500/[0.06]'
            : 'border-border bg-card'
          return (
            <li key={g.chave} className={`rounded-xl border transition-colors ${moldura}`}>
              <div className="flex items-start gap-2 p-2.5">
                <button
                  type="button"
                  onClick={() => onSelecionar(ativo && selecionada === g.marcacoes[0].id ? null : g.marcacoes[0].id)}
                  aria-pressed={ativo}
                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                >
                  {g.patologico ? (
                    <SinalDePatologia className={`mt-0.5 h-4 w-4 shrink-0 ${ativo ? '' : 'opacity-70'}`} />
                  ) : (
                    <Crosshair
                      className={`mt-0.5 h-4 w-4 shrink-0 ${ativo ? 'text-cyan-600 dark:text-cyan-300' : 'text-muted-foreground'}`}
                      aria-hidden
                    />
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-snug">{v.nome}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{v.resumo}</span>
                  </span>
                </button>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {g.patologico
                      ? ROTULO_DA_CATEGORIA[(v as AchadoMarcado['verbete']).categoria]
                      : ROTULO_DO_TIPO[(v as EstruturaMarcada['verbete']).tipo]}
                  </span>
                  <button
                    type="button"
                    onClick={() => alternar(g.chave)}
                    aria-expanded={aberto}
                    aria-label={aberto ? `Recolher ${v.nome}` : `Detalhes de ${v.nome}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${aberto ? 'rotate-180' : ''}`} aria-hidden />
                  </button>
                </span>
              </div>

              {g.marcacoes.length > 1 && (
                <div className="flex flex-wrap gap-1 px-2.5 pb-2 pl-8" role="group" aria-label={`Locais de ${v.nome}`}>
                  {g.marcacoes.map((m, i) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onSelecionar(m.id)}
                      aria-pressed={selecionada === m.id}
                      title={m.rotulo ?? `Local ${i + 1}`}
                      className={`max-w-full truncate rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                        selecionada === m.id
                          ? g.patologico
                            ? 'border-rose-600 bg-rose-600 text-white'
                            : 'border-cyan-600 bg-cyan-600 text-white'
                          : 'border-border text-muted-foreground hover:border-cyan-500/50 hover:text-foreground'
                      }`}
                    >
                      {m.rotulo ?? `Local ${i + 1}`}
                    </button>
                  ))}
                </div>
              )}

              {aberto &&
                (g.patologico ? (
                  <DetalheDoAchado grupo={g} selecionada={selecionada} />
                ) : (
                  <DetalheDoVerbete grupo={g} selecionada={selecionada} />
                ))}
            </li>
          )
        })}
      </ul>
          </section>
        ),
      )}
      {grupos.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nada encontrado.</p>}
    </div>
  )
}

function DetalheDoAchado({ grupo, selecionada }: { grupo: Grupo; selecionada: string | null }) {
  const v = (grupo.marcacoes[0] as AchadoMarcado).verbete
  const nota = (grupo.marcacoes.find((m) => m.id === selecionada) ?? grupo.marcacoes[0]).nota
  return (
    <div className="space-y-1 border-t border-border/70 px-2.5 pb-2.5 pt-2 text-sm">
      {nota && (
        <p className="mb-2 rounded-lg bg-rose-500/[0.08] px-2.5 py-2 text-xs leading-relaxed">
          <span className="font-semibold">Nesta lâmina: </span>
          {nota}
        </p>
      )}
      <Secao titulo="Como reconhecer" itens={v.comoReconhecer} aberta />
      <Secao titulo="Por que se forma" itens={v.mecanismo} />
      <Secao titulo="O que significa" itens={v.significado} />
      <Secao titulo="Onde ocorre" itens={v.ondeOcorre} />
      <Secao titulo="Armadilhas" itens={v.armadilhas} />
    </div>
  )
}

function DetalheDoVerbete({ grupo, selecionada }: { grupo: Grupo; selecionada: string | null }) {
  const v = (grupo.marcacoes[0] as EstruturaMarcada).verbete
  const nota = (grupo.marcacoes.find((m) => m.id === selecionada) ?? grupo.marcacoes[0]).nota
  const r = REGENERACAO[v.regeneracao.nivel]
  return (
    <div className="space-y-1 border-t border-border/70 px-2.5 pb-2.5 pt-2 text-sm">
      {nota && (
        <p className="mb-2 rounded-lg bg-cyan-500/[0.08] px-2.5 py-2 text-xs leading-relaxed">
          <span className="font-semibold">Nesta lâmina: </span>
          {nota}
        </p>
      )}
      <Secao titulo="Características" itens={v.caracteristicas} aberta />
      <Secao titulo="Funções" itens={v.funcoes} aberta />
      <details className="group rounded-lg">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
          <span className="flex items-center gap-2">
            Regeneração
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal ${r.classe}`}>{r.rotulo}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <p className="px-1 pb-1 text-sm leading-relaxed">{v.regeneracao.texto}</p>
      </details>
      <Secao titulo="Aprofundamento" itens={v.aprofundado} />
      <Secao titulo="Onde mais se encontra" itens={v.ondeEncontrar} />
      <Secao titulo="Alterações típicas" itens={v.alteracoes} />
    </div>
  )
}

function Secao({ titulo, itens, aberta = false }: { titulo: string; itens: string[]; aberta?: boolean }) {
  if (!itens.length) return null
  return (
    <details className="group rounded-lg" open={aberta}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        {titulo}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="space-y-1.5 px-1 pb-1.5">
        {itens.map((t) => (
          <li key={t} className="flex gap-2 text-sm leading-relaxed">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" aria-hidden />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

function normalizar(t: string) {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}
