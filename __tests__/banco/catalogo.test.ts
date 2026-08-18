import { describe, it, expect } from 'vitest'
import {
  buscarAssuntos,
  caminhoDaQuestao,
  listarAssuntos,
  modulosOrdenados,
  subtopicosDoTopico,
  type Catalogo,
} from '@/lib/banco/catalogo'

const catalogo: Catalogo = {
  modulos: [
    { _id: 'm2', nome: 'Cardiologia', totalQuestoes: 40 },
    { _id: 'm1', nome: 'Anatomia', totalQuestoes: 12 },
    { _id: 'm10', nome: '10º módulo', totalQuestoes: 1 },
    { _id: 'm3', nome: '2º módulo', totalQuestoes: 1 },
  ],
  topicos: [
    { _id: 't1', moduloId: 'm2', nome: 'Arritmias', totalQuestoes: 25 },
    { _id: 't2', moduloId: 'm2', nome: 'Insuficiência cardíaca', totalQuestoes: 15 },
    { _id: 't3', moduloId: 'm1', nome: 'Membro superior', totalQuestoes: 12 },
    { _id: 't4', moduloId: 'apagado', nome: 'Órfão', totalQuestoes: 3 },
  ],
  subtopicos: [
    { _id: 's2', topicoId: 't1', nome: 'Fibrilação atrial', totalQuestoes: 10 },
    { _id: 's1', topicoId: 't1', nome: 'Bradiarritmias', totalQuestoes: 5 },
    { _id: 's3', topicoId: 't2', nome: 'FEr', totalQuestoes: 8 },
  ],
}

describe('listarAssuntos', () => {
  it('junta o módulo ao tópico e ordena por módulo e depois por tópico', () => {
    const assuntos = listarAssuntos(catalogo)
    expect(assuntos.map((a) => a.caminho)).toEqual([
      'Anatomia › Membro superior',
      'Cardiologia › Arritmias',
      'Cardiologia › Insuficiência cardíaca',
      'Sem módulo › Órfão',
    ])
  })

  // O módulo pode ter sido apagado por fora; as questões do tópico continuam
  // lá, e é nesta tela que elas são consertadas.
  it('não esconde tópico sem módulo', () => {
    const orfao = listarAssuntos(catalogo).find((a) => a.topicoId === 't4')
    expect(orfao?.moduloNome).toBe('Sem módulo')
    expect(orfao?.totalQuestoes).toBe(3)
  })
})

describe('buscarAssuntos', () => {
  const assuntos = listarAssuntos(catalogo)

  it('encontra pelo nome do tópico, sem acento e sem caixa', () => {
    expect(buscarAssuntos(assuntos, 'INSUFICIENCIA').map((a) => a.topicoId)).toEqual(['t2'])
  })

  it('encontra pelo nome do módulo', () => {
    expect(buscarAssuntos(assuntos, 'cardio').map((a) => a.topicoId)).toEqual(['t1', 't2'])
  })

  it('exige todas as palavras, em qualquer ordem', () => {
    expect(buscarAssuntos(assuntos, 'arritmias cardiologia')).toHaveLength(1)
    expect(buscarAssuntos(assuntos, 'arritmias anatomia')).toHaveLength(0)
  })

  it('sem termo, devolve tudo', () => {
    expect(buscarAssuntos(assuntos, '   ')).toHaveLength(assuntos.length)
  })
})

describe('subtopicosDoTopico', () => {
  it('devolve só os do tópico, em ordem alfabética', () => {
    expect(subtopicosDoTopico(catalogo, 't1').map((s) => s.nome)).toEqual([
      'Bradiarritmias',
      'Fibrilação atrial',
    ])
  })

  it('sem tópico, nenhum', () => {
    expect(subtopicosDoTopico(catalogo, '')).toEqual([])
  })
})

describe('modulosOrdenados', () => {
  it('lê os números como números', () => {
    expect(modulosOrdenados(catalogo).map((m) => m.nome)).toEqual([
      '2º módulo',
      '10º módulo',
      'Anatomia',
      'Cardiologia',
    ])
  })
})

describe('caminhoDaQuestao', () => {
  it('junta o que existe e ignora o que falta', () => {
    expect(
      caminhoDaQuestao({ moduloNome: 'Cardiologia', topicoNome: 'Arritmias', subtopicoNome: null }),
    ).toBe('Cardiologia › Arritmias')
    expect(caminhoDaQuestao({ moduloNome: '  ', topicoNome: undefined })).toBe('')
  })
})
