import { describe, expect, it } from 'vitest'
import {
  aulasAbaixo,
  ehDescendente,
  filtrarArvore,
  montarArvore,
  moverPara,
  paraBusca,
  reordenar,
  type NoDaArvore,
} from '@/lib/aulas/arvore-admin'

/**
 * A árvore do painel é onde o admin enxerga o curso inteiro. Os casos abaixo
 * são os que quebram painéis de verdade: vínculo apontando para item apagado,
 * hierarquia pulada, tudo com `ordem: 0` e alguém arrastando um nó para dentro
 * de si mesmo.
 */

function doc(id: string, extras: Record<string, any> = {}) {
  return { _id: id, nome: id, ordem: 0, ...extras }
}

function acharNo(nos: NoDaArvore[], id: string): NoDaArvore | undefined {
  for (const no of nos) {
    if (no.id === id) return no
    const achado = acharNo(no.filhos, id)
    if (achado) return achado
  }
  return undefined
}

describe('montarArvore', () => {
  it('monta a hierarquia completa quando todos os vínculos existem', () => {
    const { raizes } = montarArvore({
      setores: [doc('s1')],
      topicos: [doc('t1', { setorId: 's1' })],
      subtopicos: [doc('st1', { setorId: 's1', topicoId: 't1' })],
      modulos: [doc('m1', { setorId: 's1', topicoId: 't1', subtopicoId: 'st1' })],
      submodulos: [doc('sm1', { setorId: 's1', moduloId: 'm1' })],
      aulas: [{ _id: 'a1', titulo: 'Aula 1', setorId: 's1', moduloId: 'm1', submoduloId: 'sm1' }],
    })

    expect(raizes).toHaveLength(1)
    const aula = acharNo(raizes, 'a1')
    expect(aula?.tipo).toBe('aula')
    expect(acharNo(raizes, 'sm1')?.filhos.map((f) => f.id)).toEqual(['a1'])
    expect(raizes[0].totalAulas).toBe(1)
  })

  it('pendura no vínculo mais fundo que existir — a hierarquia é opcional', () => {
    const { raizes } = montarArvore({
      setores: [doc('s1')],
      // Aula declara curso e módulo, mas o módulo nunca existiu.
      aulas: [{ _id: 'a1', titulo: 'Solta', setorId: 's1', moduloId: 'inexistente' }],
    })

    // Ela desce um degrau em vez de sumir da tela.
    expect(acharNo(raizes, 'a1')).toBeDefined()
    expect(raizes[0].filhos.map((f) => f.id)).toEqual(['a1'])
  })

  it('recolhe em órfãos o que não acha nenhum pai, em vez de descartar', () => {
    const { raizes, orfaos } = montarArvore({
      setores: [doc('s1')],
      modulos: [doc('m9', { setorId: 'curso-apagado' })],
    })

    expect(raizes).toHaveLength(1)
    expect(orfaos.map((o) => o.id)).toEqual(['m9'])
  })

  it('ignora vínculo cujo id existe mas é de outro tipo', () => {
    // Um `topicoId` que na verdade aponta para um módulo: cruzamento que
    // aparece depois de importações e migrações mal feitas.
    const { orfaos } = montarArvore({
      modulos: [doc('m1', { setorId: 'nao-existe' })],
      subtopicos: [doc('st1', { topicoId: 'm1' })],
    })

    expect(orfaos.map((o) => o.id).sort()).toEqual(['m1', 'st1'])
  })

  it('desempata por nome quando tudo está com ordem 0', () => {
    const { raizes } = montarArvore({
      setores: [doc('s1')],
      topicos: [
        doc('tb', { setorId: 's1', nome: 'Bioquímica' }),
        doc('ta', { setorId: 's1', nome: 'Anatomia' }),
      ],
    })

    // Sem o desempate, a sequência dependeria da ordem de chegada do banco.
    expect(raizes[0].filhos.map((f) => f.nome)).toEqual(['Anatomia', 'Bioquímica'])
  })

  it('conta as aulas de toda a descendência em cada nível', () => {
    const { raizes } = montarArvore({
      setores: [doc('s1')],
      modulos: [doc('m1', { setorId: 's1' }), doc('m2', { setorId: 's1' })],
      aulas: [
        { _id: 'a1', titulo: 'A', setorId: 's1', moduloId: 'm1' },
        { _id: 'a2', titulo: 'B', setorId: 's1', moduloId: 'm1' },
        { _id: 'a3', titulo: 'C', setorId: 's1', moduloId: 'm2' },
      ],
    })

    expect(raizes[0].totalAulas).toBe(3)
    expect(acharNo(raizes, 'm1')?.totalAulas).toBe(2)
    expect(acharNo(raizes, 'm2')?.totalAulas).toBe(1)
  })
})

describe('reordenar', () => {
  function irmaos(...ids: string[]): NoDaArvore[] {
    return ids.map((id, i) => ({
      id,
      tipo: 'aula' as const,
      nome: id,
      ordem: i,
      oculta: false,
      pai: {},
      filhos: [],
      dados: { _id: id },
      totalAulas: 1,
    }))
  }

  it('renumera a lista inteira, não só o item movido', () => {
    const movimentos = reordenar(irmaos('a', 'b', 'c', 'd'), 3, 1)

    expect(movimentos.map((m) => m.id)).toEqual(['a', 'd', 'b', 'c'])
    // Toda a lista sai numerada de 0 a n — é isso que impede a ordem de
    // "voltar sozinha" no próximo carregamento por causa de empates.
    expect(movimentos.map((m) => m.ordem)).toEqual([0, 1, 2, 3])
  })

  it('trava o destino dentro da lista em vez de estourar', () => {
    const movimentos = reordenar(irmaos('a', 'b', 'c'), 0, 99)
    expect(movimentos.map((m) => m.id)).toEqual(['b', 'c', 'a'])
  })

  it('devolve vazio quando a origem não existe', () => {
    expect(reordenar(irmaos('a'), 5, 0)).toEqual([])
  })
})

describe('moverPara', () => {
  const { raizes, porId } = montarArvore({
    setores: [doc('s1'), doc('s2')],
    topicos: [doc('t1', { setorId: 's1' })],
    modulos: [doc('m1', { setorId: 's1', topicoId: 't1' })],
    submodulos: [doc('sm1', { setorId: 's1', topicoId: 't1', moduloId: 'm1' })],
    aulas: [{ _id: 'a1', titulo: 'A', setorId: 's1', topicoId: 't1', moduloId: 'm1', submoduloId: 'sm1' }],
  })

  it('limpa os vínculos que o destino não tem', () => {
    const aula = porId.get('a1') as NoDaArvore
    const destino = porId.get('s2') as NoDaArvore
    const movimento = moverPara(aula, destino, 0)

    expect(movimento?.pai.setorId).toBe('s2')
    // Sem a limpeza, a aula reapareceria dentro do módulo de onde saiu.
    expect(movimento?.pai.moduloId).toBeNull()
    expect(movimento?.pai.submoduloId).toBeNull()
    expect(movimento?.pai.topicoId).toBeNull()
  })

  it('herda os vínculos do destino inteiro', () => {
    const aula = porId.get('a1') as NoDaArvore
    const destino = porId.get('m1') as NoDaArvore
    const movimento = moverPara(aula, destino, 2)

    expect(movimento?.pai.moduloId).toBe('m1')
    expect(movimento?.pai.topicoId).toBe('t1')
    expect(movimento?.pai.setorId).toBe('s1')
    expect(movimento?.pai.submoduloId).toBeNull()
    expect(movimento?.ordem).toBe(2)
  })

  it('recusa destino que não aceita aquele tipo', () => {
    const topico = porId.get('t1') as NoDaArvore
    const submodulo = porId.get('sm1') as NoDaArvore
    // Submódulo só aceita aula.
    expect(moverPara(topico, submodulo, 0)).toBeNull()
  })

  it('recusa mover um nó para dentro de si mesmo', () => {
    const setor = porId.get('s1') as NoDaArvore
    const modulo = porId.get('m1') as NoDaArvore
    // Curso dentro do próprio módulo criaria um ciclo e sumiria com os dois.
    expect(moverPara(setor, modulo, 0)).toBeNull()
    expect(ehDescendente(setor, 'm1')).toBe(true)
    expect(raizes).toHaveLength(2)
  })

  it('só deixa curso ficar solto na raiz', () => {
    expect(moverPara(porId.get('s1') as NoDaArvore, null, 0)).not.toBeNull()
    expect(moverPara(porId.get('a1') as NoDaArvore, null, 0)).toBeNull()
  })
})

describe('filtrarArvore', () => {
  const { raizes } = montarArvore({
    setores: [doc('s1', { nome: 'Clínica Médica' })],
    modulos: [doc('m1', { setorId: 's1', nome: 'Cardiologia' })],
    aulas: [
      { _id: 'a1', titulo: 'Fibrilação atrial', setorId: 's1', moduloId: 'm1' },
      { _id: 'a2', titulo: 'Insuficiência cardíaca', setorId: 's1', moduloId: 'm1' },
    ],
  })

  it('mantém o caminho até o que casou', () => {
    const filtrada = filtrarArvore(raizes, 'fibrilacao')

    // O curso e o módulo continuam na tela: sem eles a aula apareceria solta,
    // sem contexto e sem lugar para onde arrastar.
    expect(filtrada[0].nome).toBe('Clínica Médica')
    expect(filtrada[0].filhos[0].nome).toBe('Cardiologia')
    expect(filtrada[0].filhos[0].filhos.map((f) => f.nome)).toEqual(['Fibrilação atrial'])
  })

  it('traz a descendência inteira quando o próprio nó casa', () => {
    const filtrada = filtrarArvore(raizes, 'cardiologia')
    expect(filtrada[0].filhos[0].filhos).toHaveLength(2)
  })

  it('ignora termo curto demais para filtrar', () => {
    expect(filtrarArvore(raizes, 'c')).toBe(raizes)
  })

  it('não devolve nada quando ninguém casa', () => {
    expect(filtrarArvore(raizes, 'ortopedia')).toEqual([])
  })
})

describe('paraBusca', () => {
  it('remove acentos de verdade', () => {
    // Este teste existe porque a mesma função já nasceu quebrada duas vezes:
    // escrever o intervalo com os caracteres combinantes literais no fonte
    // resulta numa regex que não remove nada.
    expect(paraBusca('Fibrilação Atrial')).toBe('fibrilacao atrial')
    expect(paraBusca('Coração')).toBe('coracao')
    expect(paraBusca('ÊÑÜÇÃÕ')).toBe('enucao')
  })
})

describe('aulasAbaixo', () => {
  it('recolhe as aulas de toda a descendência', () => {
    const { raizes } = montarArvore({
      setores: [doc('s1')],
      modulos: [doc('m1', { setorId: 's1' })],
      submodulos: [doc('sm1', { setorId: 's1', moduloId: 'm1' })],
      aulas: [
        { _id: 'a1', titulo: 'A', setorId: 's1', moduloId: 'm1' },
        { _id: 'a2', titulo: 'B', setorId: 's1', moduloId: 'm1', submoduloId: 'sm1' },
        { _id: 'a3', titulo: 'C', setorId: 's1' },
      ],
    })

    expect(aulasAbaixo(raizes[0]).map((a) => a.id).sort()).toEqual(['a1', 'a2', 'a3'])
  })
})

describe('ordenação de irmãos', () => {
  it('coloca agrupadores antes das aulas', () => {
    const { raizes } = montarArvore({
      setores: [doc('s1')],
      modulos: [doc('m1', { setorId: 's1', nome: 'Zebra' })],
      aulas: [{ _id: 'a1', titulo: 'Alfa', setorId: 's1', ordem: 0 }],
    })

    // Mesmo com "Alfa" ganhando no alfabeto, o módulo vem primeiro: uma lista
    // que alterna coisas que abrem e coisas que não abrem é difícil de varrer.
    expect(raizes[0].filhos.map((f) => f.nome)).toEqual(['Zebra', 'Alfa'])
  })
})
