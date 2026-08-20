import { describe, expect, it } from 'vitest'
import {
  achatarParaSelecao,
  caminhoAte,
  gerarSlug,
  idsDoRamo,
  montarArvore,
  nivelFilho,
  nivelPai,
  podarVazios,
  slugUnico,
  validarNo,
  type NoDeEnsino,
} from '@/lib/ensino/taxonomia'

const no = (
  _id: string,
  nivel: NoDeEnsino['nivel'],
  paiId: string | null,
  nome: string,
  ordem = 0,
): NoDeEnsino => ({ _id, nivel, paiId, nome, slug: gerarSlug(nome), ordem })

const ACERVO: NoDeEnsino[] = [
  no('a1', 'area', null, 'Medicina'),
  no('m1', 'modulo', 'a1', 'Ciclo Básico', 1),
  no('m2', 'modulo', 'a1', 'Ciclo Clínico', 2),
  no('t1', 'topico', 'm1', 'Sistema Cardiovascular'),
  no('t2', 'topico', 'm2', 'Cardiologia'),
  no('s1', 'subtopico', 't1', 'Fisiologia'),
  no('s2', 'subtopico', 't2', 'Insuficiência Cardíaca'),
]

describe('slug', () => {
  it('remove acento, caixa e pontuação', () => {
    expect(gerarSlug('Insuficiência Cardíaca')).toBe('insuficiencia-cardiaca')
    expect(gerarSlug('  Pré-carga / Pós-carga  ')).toBe('pre-carga-pos-carga')
  })

  it('desambigua repetidos em vez de recusar', () => {
    // Dois "Fisiologia" em tópicos diferentes são normais — o segundo não pode
    // falhar, senão o admin é obrigado a inventar nome feio.
    const usados = new Set(['fisiologia'])
    expect(slugUnico('Fisiologia', usados)).toBe('fisiologia-2')
  })
})

describe('níveis', () => {
  it('conhece a ordem da hierarquia', () => {
    expect(nivelFilho('area')).toBe('modulo')
    expect(nivelFilho('subtopico')).toBeNull()
    expect(nivelPai('topico')).toBe('modulo')
    expect(nivelPai('area')).toBeNull()
  })
})

describe('validarNo', () => {
  it('aceita área sem pai', () => {
    expect(validarNo({ nome: 'Medicina', nivel: 'area', paiId: null }, null)).toEqual([])
  })

  it('recusa área com pai', () => {
    const problemas = validarNo({ nome: 'Medicina', nivel: 'area', paiId: 'x' }, { nivel: 'area' })
    expect(problemas.map((p) => p.campo)).toContain('paiId')
  })

  it('recusa tópico pendurado direto na área', () => {
    // O erro que produziria conteúdo invisível: um nível pulado não aparece em
    // navegação nenhuma.
    const problemas = validarNo(
      { nome: 'Cardiologia', nivel: 'topico', paiId: 'a1' },
      { nivel: 'area' },
    )
    expect(problemas).toHaveLength(1)
    expect(problemas[0].campo).toBe('paiId')
  })

  it('exige nome', () => {
    const problemas = validarNo({ nome: '   ', nivel: 'area', paiId: null }, null)
    expect(problemas.map((p) => p.campo)).toContain('nome')
  })
})

describe('montarArvore', () => {
  it('aninha e acumula as contagens de baixo para cima', () => {
    const arvore = montarArvore(ACERVO, new Map([['s1', 4], ['t2', 2], ['s2', 7]]))
    expect(arvore).toHaveLength(1)
    const medicina = arvore[0]
    expect(medicina.aulasNaArvore).toBe(13)

    const basico = medicina.filhos.find((f) => f._id === 'm1')!
    expect(basico.aulasNaArvore).toBe(4)
    expect(basico.aulas).toBe(0)

    const clinico = medicina.filhos.find((f) => f._id === 'm2')!
    expect(clinico.aulasNaArvore).toBe(9)
  })

  it('sobe órfão para a raiz em vez de sumir com ele', () => {
    const arvore = montarArvore([no('x', 'topico', 'inexistente', 'Órfão')])
    expect(arvore).toHaveLength(1)
    expect(arvore[0]._id).toBe('x')
  })

  it('respeita a ordem declarada', () => {
    const arvore = montarArvore(ACERVO)
    expect(arvore[0].filhos.map((f) => f.nome)).toEqual(['Ciclo Básico', 'Ciclo Clínico'])
  })
})

describe('caminhoAte', () => {
  it('devolve da raiz até a folha', () => {
    expect(caminhoAte(ACERVO, 's2').map((n) => n.nome)).toEqual([
      'Medicina',
      'Ciclo Clínico',
      'Cardiologia',
      'Insuficiência Cardíaca',
    ])
  })

  it('não trava em ciclo', () => {
    const ciclico: NoDeEnsino[] = [
      { ...no('p', 'area', 'f', 'Pai') },
      { ...no('f', 'modulo', 'p', 'Filho') },
    ]
    expect(caminhoAte(ciclico, 'f').length).toBeLessThanOrEqual(8)
  })
})

describe('idsDoRamo', () => {
  it('inclui o próprio nó e toda a descendência', () => {
    expect(idsDoRamo(ACERVO, 'm2').sort()).toEqual(['m2', 's2', 't2'])
  })
})

describe('apresentação', () => {
  it('achata com recuo para o seletor de pai', () => {
    const lista = achatarParaSelecao(montarArvore(ACERVO))
    expect(lista[0].rotulo).toBe('Medicina')
    expect(lista.find((l) => l.id === 't1')?.rotulo).toBe('— — Sistema Cardiovascular')
  })

  it('poda ramos sem aula nenhuma', () => {
    const arvore = montarArvore(ACERVO, new Map([['s1', 3]]))
    const podada = podarVazios(arvore)
    expect(podada[0].filhos.map((f) => f.nome)).toEqual(['Ciclo Básico'])
  })
})
