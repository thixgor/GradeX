import { describe, expect, it } from 'vitest'
import {
  MAX_CONVERSAS,
  MAX_MENSAGENS_POR_CONVERSA,
  grupoDaData,
  removerDaLista,
  salvarNaLista,
  tituloDe,
  type ConversaSalva,
} from '@/components/dom/arquivo-de-conversas'

type Msg = { papel: string; texto: string; sugestoes?: string[] }
const conversa = (id: string, em: number, n = 2): ConversaSalva<Msg> => ({
  id,
  modo: 'geral',
  titulo: id,
  atualizadaEm: em,
  mensagens: Array.from({ length: n }, (_, i) => ({ papel: i % 2 ? 'dom' : 'aluno', texto: `${id}-${i}`, sugestoes: ['x'] })),
})

describe('arquivo de conversas', () => {
  it('guarda no máximo 25: a 26ª apaga a mais antiga', () => {
    let lista: ConversaSalva<Msg>[] = []
    for (let i = 0; i < MAX_CONVERSAS + 1; i++) lista = salvarNaLista(lista, conversa(`c${i}`, i))
    expect(lista).toHaveLength(MAX_CONVERSAS)
    expect(lista[0].id).toBe(`c${MAX_CONVERSAS}`)
    expect(lista.some((c) => c.id === 'c0')).toBe(false)
  })

  it('fica leve: sem sugestões e só as últimas falas', () => {
    const [salva] = salvarNaLista([], conversa('a', 1, MAX_MENSAGENS_POR_CONVERSA + 10))
    expect(salva.mensagens).toHaveLength(MAX_MENSAGENS_POR_CONVERSA)
    expect(salva.mensagens.every((m) => !('sugestoes' in m))).toBe(true)
  })

  it('atualizar a mesma conversa não duplica; conversa vazia não entra', () => {
    let lista = salvarNaLista([], conversa('a', 1))
    lista = salvarNaLista(lista, conversa('a', 2, 4))
    expect(lista).toHaveLength(1)
    expect(salvarNaLista(lista, conversa('b', 3, 0))).toHaveLength(1)
    expect(removerDaLista(lista, 'a')).toHaveLength(0)
  })

  it('título pela primeira fala do aluno e grupos por data', () => {
    expect(tituloDe([{ papel: 'aluno', texto: 'Quero estudar   histologia' }])).toBe('Quero estudar histologia')
    expect(tituloDe([])).toBe('Nova conversa')
    const agora = new Date('2026-10-30T15:00:00-03:00').getTime()
    expect(grupoDaData(agora - 3_600_000, agora)).toBe('Hoje')
    expect(grupoDaData(agora - 86_400_000, agora)).toBe('Ontem')
    expect(grupoDaData(agora - 3 * 86_400_000, agora)).toBe('Últimos 7 dias')
    expect(grupoDaData(agora - 30 * 86_400_000, agora)).toBe('Antes')
  })
})
