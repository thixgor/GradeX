import { describe, expect, it } from 'vitest'
import {
  ATIVIDADE_DESCONHECIDA,
  descreverAtividade,
  idDoMaterialNoCaminho,
  normalizarCaminho,
} from '@/lib/presence/atividade'

describe('normalizarCaminho', () => {
  it('aceita a URL absoluta que vem no cabeçalho referer', () => {
    expect(normalizarCaminho('https://gradex.com.br/provas?x=1#topo')).toBe('/provas')
  })

  it('tira a barra final para o caminho ter uma forma só', () => {
    expect(normalizarCaminho('/materiais/')).toBe('/materiais')
    expect(normalizarCaminho('/')).toBe('/')
  })

  it('descarta o que não é caminho — o valor vem de fora', () => {
    expect(normalizarCaminho('')).toBe('')
    expect(normalizarCaminho(null)).toBe('')
    expect(normalizarCaminho('javascript:alert(1)')).toBe('')
    expect(normalizarCaminho('nao-comeca-com-barra')).toBe('')
  })

  it('corta caminho absurdamente longo', () => {
    expect(normalizarCaminho('/' + 'a'.repeat(1000)).length).toBe(300)
  })
})

describe('descreverAtividade', () => {
  it('sem caminho conhecido, não inventa', () => {
    expect(descreverAtividade('')).toEqual(ATIVIDADE_DESCONHECIDA)
    expect(descreverAtividade(undefined)).toEqual(ATIVIDADE_DESCONHECIDA)
  })

  it('distingue fazer a prova de ver o resultado dela', () => {
    expect(descreverAtividade('/exam/abc123').label).toBe('Fazendo prova')
    expect(descreverAtividade('/exam/abc123/results').label).toBe('Vendo o resultado da prova')
    expect(descreverAtividade('/exam/abc123/user/u9').label).toBe('Corrigindo a prova de um aluno')
  })

  it('reconhece o visualizador de PDF, e não só a página do material', () => {
    expect(descreverAtividade('/materiais/507f1f77bcf86cd799439011/viewer').label).toBe('Lendo um PDF')
    expect(descreverAtividade('/materiais/507f1f77bcf86cd799439011').label).toBe(
      'Vendo a página de um material',
    )
    expect(descreverAtividade('/materiais').label).toBe('Navegando pelos materiais')
  })

  it('a regra mais específica vence a mais genérica', () => {
    expect(descreverAtividade('/manual-clinico/histologia/histopatologia/atlas').area).toBe(
      'Histopatologia',
    )
    expect(descreverAtividade('/manual-clinico/histologia/atlas').area).toBe('Histologia')
    expect(descreverAtividade('/manual-clinico/qualquer-capitulo').area).toBe('Manual Clínico')
  })

  it('/exams (plural) não é confundido com /exam/<id>', () => {
    expect(descreverAtividade('/exams/create-personal').label).toBe('Montando uma prova própria')
  })

  it('rota que ninguém descreveu aparece como rota, e não como rótulo genérico', () => {
    expect(descreverAtividade('/modulo-novo').label).toBe('Em /modulo-novo')
  })

  it('cobre as áreas de estudo do dia a dia', () => {
    const casos: Array<[string, string]> = [
      ['/banco-questoes/listas/l1', 'Resolvendo uma lista'],
      ['/flashcards/d/meu-baralho', 'Revisando flashcards'],
      ['/aulas/aula-1', 'Assistindo uma aula'],
      ['/cronogramas/c1', 'Seguindo um cronograma'],
      ['/anatomia/anatomia-3d/cranio', 'Na Anatomia 3D'],
      ['/manual-clinico/radiologia/raio-x/torax', 'No atlas de Raio-X'],
      ['/dashboard', 'No painel inicial'],
      ['/', 'Na página inicial'],
    ]
    for (const [caminho, esperado] of casos) {
      expect(descreverAtividade(caminho).label, caminho).toBe(esperado)
    }
  })
})

describe('idDoMaterialNoCaminho', () => {
  it('acha o id em qualquer tela de material', () => {
    expect(idDoMaterialNoCaminho('/materiais/507f1f77bcf86cd799439011/viewer')).toBe(
      '507f1f77bcf86cd799439011',
    )
    expect(idDoMaterialNoCaminho('/materiais/507f1f77bcf86cd799439011')).toBe(
      '507f1f77bcf86cd799439011',
    )
  })

  it('não confunde outra coisa com id de material', () => {
    expect(idDoMaterialNoCaminho('/materiais')).toBeNull()
    expect(idDoMaterialNoCaminho('/materiais/checkout')).toBeNull()
    expect(idDoMaterialNoCaminho('/provas')).toBeNull()
  })
})
