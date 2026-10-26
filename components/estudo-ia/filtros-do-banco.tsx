'use client'

import { useEffect, useState } from 'react'

import { Campo, Segmentado, Stepper } from './pecas'

/**
 * Os filtros do Banco de Questões para a prova pessoal (modos "Banco" e
 * "Mista"), no vidro iOS. Cada nível só abre depois do anterior — período →
 * módulo → tópico → subtópico —, como já era: é a hierarquia do Banco.
 *
 * Teto: `MAXIMO_DE_QUESTOES_DO_BANCO` precisa ser o mesmo
 * `MAXIMO_DE_QUESTOES_POR_SORTEIO` de `app/api/banco/questoes/random/route.ts`.
 */
export const MAXIMO_DE_QUESTOES_DO_BANCO = 200

export interface FiltrosDoBanco {
  periodoIds: string[]
  moduloIds: string[]
  topicoIds: string[]
  subtopicoIds: string[]
  tipo: '' | 'objetiva' | 'discursiva'
  dificuldade: '' | 'facil' | 'medio' | 'dificil'
  anos: number[]
}

export const FILTROS_VAZIOS: FiltrosDoBanco = {
  periodoIds: [],
  moduloIds: [],
  topicoIds: [],
  subtopicoIds: [],
  tipo: '',
  dificuldade: '',
  anos: [],
}

interface Item {
  _id: string
  nome: string
  totalQuestoes?: number
}

async function lista(url: string, chave: string): Promise<Item[]> {
  try {
    const r = await fetch(url)
    if (!r.ok) return []
    const d = await r.json()
    return (d?.[chave] || []).map((x: any) => ({ ...x, _id: String(x._id) }))
  } catch {
    return []
  }
}

export function parametrosDoBanco(f: FiltrosDoBanco, quantidade: number): string {
  const p = new URLSearchParams()
  p.set('limit', String(quantidade))
  p.set('random', 'true')
  if (f.periodoIds.length) p.set('periodoId', f.periodoIds.join(','))
  if (f.moduloIds.length) p.set('moduloId', f.moduloIds.join(','))
  if (f.topicoIds.length) p.set('topicoId', f.topicoIds.join(','))
  if (f.subtopicoIds.length) p.set('subtopicoId', f.subtopicoIds.join(','))
  if (f.tipo) p.set('tipo', f.tipo)
  if (f.dificuldade) p.set('dificuldade', f.dificuldade)
  if (f.anos.length) p.set('anos', f.anos.join(','))
  return p.toString()
}

function Pilulas({
  itens,
  escolhidos,
  onAlternar,
}: {
  itens: Item[]
  escolhidos: string[]
  onAlternar: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {itens.map((i) => (
        <button
          key={i._id}
          type="button"
          aria-pressed={escolhidos.includes(i._id)}
          onClick={() => onAlternar(i._id)}
          className="ios-pilula !h-auto min-h-[34px] max-w-full whitespace-normal py-1.5 text-left !text-[13.5px]"
        >
          <span>{i.nome}</span>
          {typeof i.totalQuestoes === 'number' && <span className="ios-contagem">{i.totalQuestoes}</span>}
        </button>
      ))}
    </div>
  )
}

export function FiltrosDoBancoIos({
  filtros,
  onChange,
  quantidade,
  onQuantidade,
}: {
  filtros: FiltrosDoBanco
  onChange: (f: FiltrosDoBanco) => void
  quantidade: number
  onQuantidade: (n: number) => void
}) {
  const [periodos, setPeriodos] = useState<Item[]>([])
  const [modulos, setModulos] = useState<Item[]>([])
  const [topicos, setTopicos] = useState<Item[]>([])
  const [subtopicos, setSubtopicos] = useState<Item[]>([])
  const [anos, setAnos] = useState<number[]>([])

  useEffect(() => {
    void lista('/api/banco/periodos', 'periodos').then(setPeriodos)
    fetch('/api/banco/anos')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAnos(Array.isArray(d?.anos) ? d.anos : []))
      .catch(() => {})
  }, [])

  const chavePeriodos = filtros.periodoIds.join(',')
  const chaveModulos = filtros.moduloIds.join(',')
  const chaveTopicos = filtros.topicoIds.join(',')
  useEffect(() => {
    if (chavePeriodos) void lista(`/api/banco/modulos?periodoId=${chavePeriodos}`, 'modulos').then(setModulos)
    else setModulos([])
  }, [chavePeriodos])
  useEffect(() => {
    if (chaveModulos) void lista(`/api/banco/topicos?moduloId=${chaveModulos}`, 'topicos').then(setTopicos)
    else setTopicos([])
  }, [chaveModulos])
  useEffect(() => {
    if (chaveTopicos) void lista(`/api/banco/subtopicos?topicoId=${chaveTopicos}`, 'subtopicos').then(setSubtopicos)
    else setSubtopicos([])
  }, [chaveTopicos])

  const alterna = (lista: string[], id: string) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id])

  return (
    <div className="space-y-5">
      <Campo rotulo="Período" nota={filtros.periodoIds.length ? `${filtros.periodoIds.length} escolhido(s)` : 'todos'}>
        {periodos.length ? (
          <Pilulas
            itens={periodos}
            escolhidos={filtros.periodoIds}
            onAlternar={(id) => onChange({ ...filtros, periodoIds: alterna(filtros.periodoIds, id), moduloIds: [], topicoIds: [], subtopicoIds: [] })}
          />
        ) : (
          <div className="ios-esqueleto h-9 rounded-full" />
        )}
      </Campo>
      {modulos.length > 0 && (
        <Campo rotulo="Módulo" nota="opcional">
          <Pilulas
            itens={modulos}
            escolhidos={filtros.moduloIds}
            onAlternar={(id) => onChange({ ...filtros, moduloIds: alterna(filtros.moduloIds, id), topicoIds: [], subtopicoIds: [] })}
          />
        </Campo>
      )}
      {topicos.length > 0 && (
        <Campo rotulo="Tópico" nota="opcional">
          <Pilulas
            itens={topicos}
            escolhidos={filtros.topicoIds}
            onAlternar={(id) => onChange({ ...filtros, topicoIds: alterna(filtros.topicoIds, id), subtopicoIds: [] })}
          />
        </Campo>
      )}
      {subtopicos.length > 0 && (
        <Campo rotulo="Subtópico" nota="opcional">
          <Pilulas itens={subtopicos} escolhidos={filtros.subtopicoIds} onAlternar={(id) => onChange({ ...filtros, subtopicoIds: alterna(filtros.subtopicoIds, id) })} />
        </Campo>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo rotulo="Tipo">
          <Segmentado
            rotulo="Tipo de questão do banco"
            valor={filtros.tipo}
            onChange={(tipo) => onChange({ ...filtros, tipo })}
            opcoes={[
              { id: '', rotulo: 'Todas' },
              { id: 'objetiva', rotulo: 'Objetivas' },
              { id: 'discursiva', rotulo: 'Discursivas' },
            ]}
          />
        </Campo>
        <Campo rotulo="Dificuldade">
          <Segmentado
            rotulo="Dificuldade do banco"
            valor={filtros.dificuldade}
            onChange={(dificuldade) => onChange({ ...filtros, dificuldade })}
            opcoes={[
              { id: '', rotulo: 'Todas' },
              { id: 'facil', rotulo: 'Fácil' },
              { id: 'medio', rotulo: 'Médio' },
              { id: 'dificil', rotulo: 'Difícil' },
            ]}
          />
        </Campo>
      </div>
      {anos.length > 0 && (
        <Campo rotulo="Ano da prova" nota="opcional">
          <div className="flex flex-wrap gap-2">
            {anos.map((ano) => (
              <button
                key={ano}
                type="button"
                aria-pressed={filtros.anos.includes(ano)}
                onClick={() => onChange({ ...filtros, anos: filtros.anos.includes(ano) ? filtros.anos.filter((a) => a !== ano) : [...filtros.anos, ano] })}
                className="ios-pilula !h-[34px] !text-[13px] ios-numeros"
              >
                {ano}
              </button>
            ))}
          </div>
        </Campo>
      )}
      <Campo rotulo="Questões do banco">
        <Stepper rotulo="Questões do banco" valor={quantidade} onChange={onQuantidade} min={1} max={MAXIMO_DE_QUESTOES_DO_BANCO} passo={quantidade < 10 ? 1 : 5} />
      </Campo>
    </div>
  )
}
