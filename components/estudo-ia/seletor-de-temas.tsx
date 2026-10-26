'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarRange, ChevronRight, Loader2, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { SECOES, getSecao, normalizarSecao, type EmentaTopico, type IndiceCurso, type SecaoCurso } from '@/lib/cronogramas/tipos'
import { FolhaModal, Segmentado } from './pecas'

/**
 * Os temas possíveis dos flashcards e das provas com IA são os da ementa dos
 * `/cronogramas` — a mesma que o admin importa em `/admin/cronogramas` e que o
 * aluno estuda no calendário. Uma fonte só: o assunto que cai na avaliação do
 * período é o assunto que a IA cobra.
 *
 * Antes cada tela carregava os modelos antigos (`*-periodos-helper.ts`, dez mil
 * linhas de tópicos fixos no bundle do navegador) e eles tinham descolado da
 * ementa real. Agora a folha pede um período por vez a
 * `/api/cronogramas/ementa` e começa no curso e período que o aluno acompanha
 * (`/api/cronogramas/preferencias`).
 *
 * Escolhe-se um tópico inteiro, um subtópico ou um módulo; o tema sai com o
 * caminho ("Módulo — Subtópico"), que é o contexto que a IA precisa para não
 * confundir dois módulos de mesmo nome.
 */

interface ItemEscolhido {
  id: string
  tema: string
}

const cache = new Map<string, { topicos: EmentaTopico[]; indice: IndiceCurso[] }>()

function semAcento(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function SeletorDeTemas({
  aberto,
  onFechar,
  onAplicar,
  maximo = 12,
  jaEscolhidos = 0,
}: {
  aberto: boolean
  onFechar: () => void
  onAplicar: (temas: string[]) => void
  maximo?: number
  jaEscolhidos?: number
}) {
  const [secao, setSecao] = useState<SecaoCurso>('medicina')
  const [periodo, setPeriodo] = useState(1)
  const [pronto, setPronto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [topicos, setTopicos] = useState<EmentaTopico[]>([])
  const [indice, setIndice] = useState<IndiceCurso[]>([])
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [escolhidos, setEscolhidos] = useState<Map<string, ItemEscolhido>>(new Map())
  const [busca, setBusca] = useState('')
  const preferenciasLidas = useRef(false)

  // Começa no curso e período que o aluno acompanha nos cronogramas.
  useEffect(() => {
    if (!aberto || preferenciasLidas.current) return
    preferenciasLidas.current = true
    fetch('/api/cronogramas/preferencias')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const s = normalizarSecao(d?.preferencias?.secao)
        if (s) setSecao(s)
        if (d?.preferencias?.periodo) setPeriodo(Number(d.preferencias.periodo) || 1)
      })
      .catch(() => {})
      .finally(() => setPronto(true))
  }, [aberto])

  useEffect(() => {
    if (!aberto || !pronto) return
    const chave = `${secao}:${periodo}`
    const guardado = cache.get(chave)
    if (guardado) {
      setTopicos(guardado.topicos)
      setIndice(guardado.indice)
      return
    }
    let vivo = true
    setCarregando(true)
    fetch(`/api/cronogramas/ementa?secao=${secao}&periodo=${periodo}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivo) return
        const t: EmentaTopico[] = Array.isArray(d?.topicos) ? d.topicos : []
        const i: IndiceCurso[] = Array.isArray(d?.indice) ? d.indice : []
        cache.set(chave, { topicos: t, indice: i })
        setTopicos(t)
        setIndice(i)
      })
      .catch(() => vivo && setTopicos([]))
      .finally(() => vivo && setCarregando(false))
    return () => {
      vivo = false
    }
  }, [aberto, pronto, secao, periodo])

  const periodosComEmenta = useMemo(
    () => new Set(indice.find((c) => c.id === secao)?.periodos.map((p) => p.periodo) ?? []),
    [indice, secao],
  )

  const filtro = semAcento(busca.trim())
  const visiveis = useMemo(() => {
    if (!filtro) return topicos
    return topicos
      .map((t) => {
        if (semAcento(t.nome).includes(filtro)) return t
        const subtopicos = t.subtopicos
          .map((s) => {
            if (semAcento(s.nome).includes(filtro)) return s
            const modulos = s.modulos.filter((m) => semAcento(m.nome).includes(filtro))
            return modulos.length ? { ...s, modulos } : null
          })
          .filter((s): s is NonNullable<typeof s> => s !== null)
        return subtopicos.length ? { ...t, subtopicos } : null
      })
      .filter((t): t is EmentaTopico => t !== null)
  }, [topicos, filtro])

  const restam = Math.max(0, maximo - jaEscolhidos)
  const cheio = escolhidos.size >= restam

  function alternar(id: string, tema: string) {
    setEscolhidos((atual) => {
      const novo = new Map(atual)
      if (novo.has(id)) novo.delete(id)
      else if (novo.size < restam) novo.set(id, { id, tema: tema.slice(0, 160) })
      return novo
    })
  }

  function alternarAberto(id: string) {
    setAbertos((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function aplicar() {
    onAplicar(Array.from(escolhidos.values()).map((e) => e.tema))
    setEscolhidos(new Map())
    setBusca('')
    onFechar()
  }

  const info = getSecao(secao)
  const periodos = Array.from({ length: info.periodos }, (_, i) => i + 1)

  return (
    <FolhaModal
      aberta={aberto}
      onFechar={onFechar}
      titulo="Temas do cronograma"
      subtitulo="A mesma ementa dos seus cronogramas: o que cai na avaliação é o que a IA cobra."
      rodape={
        <div className="flex items-center gap-3">
          <p className="ios-rotulo-2 min-w-0 flex-1 text-[14px]">
            {escolhidos.size === 0
              ? `Até ${restam} ${restam === 1 ? 'tema' : 'temas'}`
              : `${escolhidos.size} ${escolhidos.size === 1 ? 'tema escolhido' : 'temas escolhidos'}`}
          </p>
          <button type="button" className="ios-botao" disabled={escolhidos.size === 0} onClick={aplicar}>
            Usar {escolhidos.size > 0 ? escolhidos.size : ''} {escolhidos.size === 1 ? 'tema' : 'temas'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <Segmentado
          rotulo="Curso"
          opcoes={SECOES.map((s) => ({ id: s.id, rotulo: s.curto }))}
          valor={secao}
          onChange={(s) => {
            setSecao(s)
            setPeriodo((p) => Math.min(p, getSecao(s).periodos))
            setAbertos(new Set())
          }}
        />

        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6" role="tablist" aria-label="Período">
          {periodos.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={p === periodo}
              onClick={() => {
                setPeriodo(p)
                setAbertos(new Set())
              }}
              className={cn('ios-pilula', !periodosComEmenta.has(p) && p !== periodo && 'opacity-45')}
            >
              {p}º período
            </button>
          ))}
        </div>

        <label className="relative block">
          <Search className="ios-rotulo-2 pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar assunto na ementa"
            className="ios-busca"
          />
        </label>

        {carregando ? (
          <div className="flex items-center justify-center gap-2 py-12 ios-rotulo-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando a ementa…
          </div>
        ) : visiveis.length === 0 ? (
          <div className="py-10 text-center">
            <CalendarRange className="ios-rotulo-3 mx-auto h-8 w-8" />
            <p className="mt-3 text-[15px] font-semibold">
              {busca ? 'Nada com esse nome neste período' : 'Este período ainda não tem ementa'}
            </p>
            <p className="ios-rotulo-2 mx-auto mt-1 max-w-xs text-[14px]">
              {busca ? 'Tente outra palavra ou outro período.' : 'A coordenação ainda não importou. Escolha outro período ou digite o tema à mão.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visiveis.map((t) => {
              const aberto = abertos.has(t.id) || !!filtro
              return (
                <li key={t.id} className="ios-lista">
                  <div className="ios-linha !min-h-[56px] !py-2">
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => alternarAberto(t.id)} aria-expanded={aberto}>
                      <span className="block truncate text-[15px] font-semibold">{t.nome}</span>
                      <span className="ios-rotulo-2 text-[12px]">
                        {t.subtopicos.length} {t.subtopicos.length === 1 ? 'subtópico' : 'subtópicos'}
                      </span>
                    </button>
                    <Marca ativo={escolhidos.has(t.id)} desabilitado={cheio && !escolhidos.has(t.id)} onClick={() => alternar(t.id, t.nome)} rotulo={`Escolher ${t.nome}`} />
                    <button type="button" onClick={() => alternarAberto(t.id)} aria-label={aberto ? 'Recolher' : 'Expandir'} className="ios-rotulo-3 -mr-1 p-1">
                      <ChevronRight className={cn('h-4 w-4 transition-transform', aberto && 'rotate-90')} />
                    </button>
                  </div>
                  {aberto &&
                    t.subtopicos.map((s) => {
                      const subAberto = abertos.has(s.id) || !!filtro
                      return (
                        <div key={s.id} className="border-t border-[color:var(--ios-separador)] bg-[color:var(--ios-preenchimento)]">
                          <div className="flex items-center gap-3 py-2 pl-7 pr-4">
                            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => alternarAberto(s.id)} aria-expanded={subAberto}>
                              <span className="block text-[14px] font-medium leading-snug">{s.nome}</span>
                              {s.modulos.length > 0 && (
                                <span className="ios-rotulo-3 text-[12px]">
                                  {s.modulos.length} {s.modulos.length === 1 ? 'módulo' : 'módulos'}
                                </span>
                              )}
                            </button>
                            <Marca
                              ativo={escolhidos.has(s.id)}
                              desabilitado={cheio && !escolhidos.has(s.id)}
                              onClick={() => alternar(s.id, `${s.nome} — ${t.nome}`)}
                              rotulo={`Escolher ${s.nome}`}
                            />
                          </div>
                          {subAberto &&
                            s.modulos.map((m) => (
                              <div key={m.id} className="flex items-center gap-3 py-1.5 pl-12 pr-4">
                                <span className="ios-rotulo-2 min-w-0 flex-1 text-[13.5px] leading-snug">{m.nome}</span>
                                <Marca
                                  ativo={escolhidos.has(m.id)}
                                  desabilitado={cheio && !escolhidos.has(m.id)}
                                  onClick={() => alternar(m.id, `${m.nome} — ${s.nome}`)}
                                  rotulo={`Escolher ${m.nome}`}
                                  pequeno
                                />
                              </div>
                            ))}
                        </div>
                      )
                    })}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </FolhaModal>
  )
}

function Marca({
  ativo,
  onClick,
  rotulo,
  desabilitado,
  pequeno,
}: {
  ativo: boolean
  onClick: () => void
  rotulo: string
  desabilitado?: boolean
  pequeno?: boolean
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={ativo}
      aria-label={rotulo}
      disabled={desabilitado}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow,transform] duration-200 active:scale-90 disabled:opacity-30',
        pequeno ? 'h-6 w-6' : 'h-7 w-7',
        ativo ? 'bg-[color:var(--ios-tinta)] text-white' : 'shadow-[inset_0_0_0_1.5px_var(--ios-rotulo-3)]',
      )}
    >
      {ativo && (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
