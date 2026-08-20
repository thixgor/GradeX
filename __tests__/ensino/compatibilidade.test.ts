import { describe, expect, it } from 'vitest'
import {
  planejarMigracao,
  resolverLocalizacao,
  type AcervoLegado,
} from '@/lib/ensino/compatibilidade'

const ACERVO: AcervoLegado = {
  setores: [{ _id: 'set1', nome: 'Medicina' }],
  topicos: [{ _id: 'top1', setorId: 'set1', nome: 'Ciclo Básico' }],
  subtopicos: [{ _id: 'sub1', setorId: 'set1', topicoId: 'top1', nome: 'Sistema Cardiovascular' }],
  modulos: [
    { _id: 'mod1', setorId: 'set1', subtopicoId: 'sub1', nome: 'Fisiologia' },
    { _id: 'mod2', setorId: 'set1', nome: 'Avulso do curso' },
  ],
  submodulos: [{ _id: 'sm1', moduloId: 'mod2', nome: 'Bloco A' }],
  aulas: [
    { _id: 'a1', titulo: 'Frank-Starling', setorId: 'set1', subtopicoId: 'sub1', moduloId: 'mod1' },
    { _id: 'a2', titulo: 'Só no setor', setorId: 'set1' },
    { _id: 'a3', titulo: 'Avulsa de verdade' },
    { _id: 'a4', titulo: 'Já migrada', setorId: 'set1', ensino: { areaId: 'novo1' } },
  ],
}

describe('planejarMigracao', () => {
  const plano = planejarMigracao(ACERVO)

  it('comprime cinco níveis antigos em quatro novos preservando as pontas', () => {
    const porOrigem = new Map(plano.nos.map((n) => [n.origem.id, n]))
    expect(porOrigem.get('set1')?.nivel).toBe('area')
    expect(porOrigem.get('top1')?.nivel).toBe('modulo')
    expect(porOrigem.get('sub1')?.nivel).toBe('topico')
    // Módulo antigo dentro de subtópico desce ao último degrau disponível.
    expect(porOrigem.get('mod1')?.nivel).toBe('subtopico')
  })

  it('trata módulo pendurado direto no setor como Módulo da Área', () => {
    const mod2 = plano.nos.find((n) => n.origem.id === 'mod2')!
    expect(mod2.nivel).toBe('modulo')
    expect(mod2.paiChave).toBe(plano.nos.find((n) => n.origem.id === 'set1')!.chave)
  })

  it('desce o submódulo um degrau abaixo do módulo que o contém', () => {
    expect(plano.nos.find((n) => n.origem.id === 'sm1')?.nivel).toBe('topico')
  })

  it('localiza a aula pelo nível mais fundo que ela declara', () => {
    const a1 = plano.aulas.find((a) => a.aulaId === 'a1')!
    const chave = (id: string) => plano.nos.find((n) => n.origem.id === id)!.chave
    expect(a1.localizacao).toEqual({
      areaId: chave('set1'),
      moduloId: chave('top1'),
      topicoId: chave('sub1'),
      subtopicoId: chave('mod1'),
    })
  })

  it('aceita aula presa só ao setor', () => {
    const a2 = plano.aulas.find((a) => a.aulaId === 'a2')!
    expect(a2.localizacao.areaId).toBeTruthy()
    expect(a2.localizacao.moduloId).toBeNull()
  })

  it('conta aula avulsa e aula já migrada sem tocá-las', () => {
    expect(plano.semLocalizacao).toBe(1)
    expect(plano.jaMigradas).toBe(1)
    expect(plano.aulas.map((a) => a.aulaId)).not.toContain('a4')
  })

  it('é idempotente: o mesmo acervo produz o mesmo plano', () => {
    const outro = planejarMigracao(ACERVO)
    expect(outro.nos.map((n) => n.chave)).toEqual(plano.nos.map((n) => n.chave))
    expect(outro.aulas).toEqual(plano.aulas)
  })

  it('dá slug único a nomes repetidos em ramos diferentes', () => {
    const p = planejarMigracao({
      ...ACERVO,
      subtopicos: [
        { _id: 's1', setorId: 'set1', topicoId: 'top1', nome: 'Fisiologia' },
        { _id: 's2', setorId: 'set1', topicoId: 'top1', nome: 'Fisiologia' },
      ],
    })
    const slugs = p.nos.filter((n) => n.nome === 'Fisiologia').map((n) => n.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe('resolverLocalizacao', () => {
  it('troca chaves do plano por ids reais', () => {
    const mapa = new Map([['legado:setores:set1', '0'.repeat(24)]])
    expect(
      resolverLocalizacao(
        { areaId: 'legado:setores:set1', moduloId: null, topicoId: 'sumiu', subtopicoId: null },
        mapa,
      ),
    ).toEqual({
      areaId: '0'.repeat(24),
      moduloId: null,
      topicoId: null,
      subtopicoId: null,
    })
  })
})
