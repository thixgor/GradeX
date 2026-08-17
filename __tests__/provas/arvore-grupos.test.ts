import { describe, it, expect } from 'vitest'
import {
  buscarDestinos,
  caminhoAte,
  contarProvas,
  contarQuestoes,
  ehDescendente,
  filhosDe,
  paraBusca,
  podeMoverGrupo,
  type GrupoNaArvore,
  type ProvaNaArvore,
} from '@/lib/provas/arvore-grupos'

/*
 *  medicina (geral)
 *   ├── p1
 *   │    └── modulo1
 *   └── p2
 *  minhas (pessoal, de u1)
 *  dela (pessoal, de u2)
 */
const grupos: GrupoNaArvore[] = [
  { _id: 'medicina', name: 'Medicina', type: 'general', parentGroupId: null },
  { _id: 'p1', name: 'Período 1', type: 'general', parentGroupId: 'medicina' },
  { _id: 'modulo1', name: 'Módulo I', type: 'general', parentGroupId: 'p1' },
  { _id: 'p2', name: 'Período 2', type: 'general', parentGroupId: 'medicina' },
  { _id: 'minhas', name: 'Minhas provas', type: 'personal', createdBy: 'u1', parentGroupId: null },
  { _id: 'dela', name: 'Provas dela', type: 'personal', createdBy: 'u2', parentGroupId: null },
]

const provas: ProvaNaArvore[] = [
  { _id: 'a', groupId: 'medicina', numberOfQuestions: 10 },
  { _id: 'b', groupId: 'p1', numberOfQuestions: 20 },
  { _id: 'c', groupId: 'modulo1', numberOfQuestions: 5 },
  { _id: 'd', groupId: 'p2', numberOfQuestions: 0 },
  { _id: 'e', groupId: null, numberOfQuestions: 99 },
]

const admin = { id: 'adm', ehAdmin: true }
const usuario = { id: 'u1', ehAdmin: false }

describe('navegação da árvore', () => {
  it('lista filhos diretos, tratando raiz como null', () => {
    expect(filhosDe(grupos, null).map((g) => g._id)).toEqual(['medicina', 'minhas', 'dela'])
    expect(filhosDe(grupos, 'medicina').map((g) => g._id)).toEqual(['p1', 'p2'])
  })

  it('monta o caminho da raiz até o grupo', () => {
    expect(caminhoAte(grupos, 'modulo1').map((g) => g._id)).toEqual(['medicina', 'p1', 'modulo1'])
  })

  it('trata grupo órfão como raiz em vez de sumir com ele', () => {
    const orfao = [...grupos, { _id: 'solto', name: 'Solto', parentGroupId: 'apagado' }]
    expect(caminhoAte(orfao, 'solto').map((g) => g._id)).toEqual(['solto'])
  })

  it('não entra em laço com um ciclo em dado antigo', () => {
    const ciclico: GrupoNaArvore[] = [
      { _id: 'x', name: 'X', parentGroupId: 'y' },
      { _id: 'y', name: 'Y', parentGroupId: 'x' },
    ]
    expect(caminhoAte(ciclico, 'x').length).toBeLessThanOrEqual(2)
  })

  it('reconhece descendentes em qualquer profundidade', () => {
    expect(ehDescendente(grupos, 'modulo1', 'medicina')).toBe(true)
    expect(ehDescendente(grupos, 'medicina', 'modulo1')).toBe(false)
    expect(ehDescendente(grupos, 'p1', 'p1')).toBe(false)
  })
})

describe('podeMoverGrupo', () => {
  it('permite o movimento normal', () => {
    expect(podeMoverGrupo(grupos, 'p1', 'p2', admin)).toEqual({ ok: true })
  })

  it('permite virar grupo raiz', () => {
    expect(podeMoverGrupo(grupos, 'modulo1', null, admin).ok).toBe(true)
  })

  it('recusa mover para dentro de si mesmo', () => {
    expect(podeMoverGrupo(grupos, 'p1', 'p1', admin)).toMatchObject({ ok: false })
  })

  it('recusa mover para dentro do próprio descendente', () => {
    // É a recusa que mais importa: o ciclo faria o grupo e tudo abaixo dele
    // desaparecerem da tela, porque nada mais é alcançável a partir da raiz.
    const v = podeMoverGrupo(grupos, 'medicina', 'modulo1', admin)
    expect(v.ok).toBe(false)
    expect(v.motivo).toContain('dentro do grupo')
  })

  it('recusa quando o grupo já está lá', () => {
    expect(podeMoverGrupo(grupos, 'p1', 'medicina', admin).ok).toBe(false)
  })

  it('não deixa usuário comum mexer em grupo geral', () => {
    expect(podeMoverGrupo(grupos, 'p1', 'p2', usuario).ok).toBe(false)
  })

  it('não mistura pessoal com geral nos dois sentidos', () => {
    expect(podeMoverGrupo(grupos, 'minhas', 'medicina', admin)).toMatchObject({ ok: false })
    expect(podeMoverGrupo(grupos, 'medicina', 'minhas', admin)).toMatchObject({ ok: false })
  })

  it('não deixa ninguém usar grupo pessoal de outra pessoa', () => {
    expect(podeMoverGrupo(grupos, 'minhas', 'dela', usuario).ok).toBe(false)
    // Nem o admin: grupo pessoal não é área administrável.
    expect(podeMoverGrupo(grupos, 'dela', null, admin).ok).toBe(false)
  })

  it('recusa grupo inexistente dos dois lados', () => {
    expect(podeMoverGrupo(grupos, 'fantasma', null, admin).ok).toBe(false)
    expect(podeMoverGrupo(grupos, 'p1', 'fantasma', admin).ok).toBe(false)
  })
})

describe('contagens', () => {
  it('conta provas do ramo inteiro', () => {
    expect(contarProvas(grupos, provas, 'medicina')).toBe(4)
    expect(contarProvas(grupos, provas, 'p1')).toBe(2)
    expect(contarProvas(grupos, provas, 'modulo1')).toBe(1)
  })

  it('conta questões do ramo inteiro', () => {
    expect(contarQuestoes(grupos, provas, 'medicina')).toBe(35)
    expect(contarQuestoes(grupos, provas, 'p1')).toBe(25)
    expect(contarQuestoes(grupos, provas, 'p2')).toBe(0)
  })

  it('trata prova sem o campo como zero em vez de quebrar a soma', () => {
    const soltas: ProvaNaArvore[] = [
      { groupId: 'p1' },
      { groupId: 'p1', numberOfQuestions: undefined },
      { groupId: 'p1', numberOfQuestions: 7 },
    ]
    expect(contarQuestoes(grupos, soltas, 'p1')).toBe(7)
    expect(contarProvas(grupos, soltas, 'p1')).toBe(3)
  })

  it('não conta provas fora de grupo', () => {
    expect(contarProvas(grupos, provas, 'minhas')).toBe(0)
  })
})

describe('busca de destino', () => {
  it('ignora acento e caixa', () => {
    expect(paraBusca('Módulo I')).toBe('modulo i')
    expect(paraBusca('Período 1')).toBe('periodo 1')
    expect(buscarDestinos(grupos, 'periodo').map((r) => r.grupo._id)).toEqual(['p1', 'p2'])
  })

  it('devolve o caminho até o grupo, sem ele próprio', () => {
    const [achado] = buscarDestinos(grupos, 'modulo')
    expect(achado.caminho.map((g) => g._id)).toEqual(['medicina', 'p1'])
  })

  it('exige pelo menos duas letras', () => {
    expect(buscarDestinos(grupos, 'm')).toEqual([])
  })
})
