import { describe, expect, it } from 'vitest'
import { irmaosDoEstudo, montarCatalogoRaioX } from '@/lib/radiologia/catalogo'
import { filtrarEstruturas, filtrarEstudos } from '@/lib/radiologia/busca-catalogo'
import { NUMEROS_RAIO_X } from '@/lib/radiologia/numeros'
import {
  ESTUDOS_RAIO_X,
  REGIOES_RAIO_X,
  TOTAL_ESTRUTURAS_RAIO_X,
} from '@/lib/radiologia/raio-x'
import { montarCatalogoTC } from '@/lib/tomografia/montar-catalogo'
import { buscarNoIndice } from '@/lib/tomografia/catalogo'
import { TOTAL_CORTES, TOTAL_ESTRUTURAS, TOTAL_SUBSECOES } from '@/lib/tomografia'

/**
 * O catálogo magro é o contrato entre o servidor e as telas de navegação: é ele
 * que mantém quase 1 MB de acervo fora do bundle do navegador. Se alguém voltar
 * a mandar o acervo inteiro — ou esquecer um campo que a tela usa — é aqui que
 * o erro aparece, e não em produção com a página lenta de novo.
 */

describe('catálogo magro de Raio-X', () => {
  const catalogo = montarCatalogoRaioX()

  it('cobre o acervo inteiro sem perder contagem', () => {
    expect(catalogo.estudos).toHaveLength(ESTUDOS_RAIO_X.length)
    expect(catalogo.regioes).toHaveLength(REGIOES_RAIO_X.length)
    expect(catalogo.totalEstruturas).toBe(TOTAL_ESTRUTURAS_RAIO_X)
    expect(catalogo.estudos.reduce((n, e) => n + e.estruturas.length, 0)).toBe(
      TOTAL_ESTRUTURAS_RAIO_X,
    )
  })

  it('leva o que a tela desenha', () => {
    for (const estudo of catalogo.estudos) {
      expect(estudo.imagem).toMatch(/^\/img\/radiologia\/raio-x\//)
      expect(estudo.titulo.length).toBeGreaterThan(0)
      expect(estudo.resumo.length).toBeGreaterThan(0)
      expect(estudo.incidencia.length).toBeGreaterThan(0)
    }
    for (const regiao of catalogo.regioes) {
      expect(regiao.capa).toMatch(/^\/img\/radiologia\/raio-x\//)
      // O contexto do guia é o parágrafo exibido ao abrir a região.
      expect(regiao.contexto.length).toBeGreaterThan(40)
    }
  })

  it('não leva o dossiê nem o caminho das sobreposições', () => {
    // São eles que pesam. O viewer os recebe por prop, página a página.
    const serializado = JSON.stringify(catalogo)
    expect(serializado).not.toContain('sobreposicao')
    expect(serializado).not.toContain('identificar')
    for (const estudo of catalogo.estudos) {
      for (const estrutura of estudo.estruturas) {
        expect(Object.keys(estrutura).sort()).toEqual(['nome', 'original', 'slug'])
      }
    }
  })

  it('busca por estrutura em português e no termo original', () => {
    const escafoide = filtrarEstruturas(catalogo, 'escafoide')
    expect(escafoide.length).toBeGreaterThan(0)
    expect(escafoide[0].estrutura.nome.toLowerCase()).toContain('escafoide')
    expect(filtrarEstruturas(catalogo, 'costophrenic').length).toBeGreaterThan(0)
    // Uma letra só devolveria o acervo inteiro; a busca exige duas.
    expect(filtrarEstruturas(catalogo, 'a')).toEqual([])
  })

  it('busca por exame alcança o nome das estruturas dentro dele', () => {
    expect(filtrarEstudos(catalogo, 'clavícula').some((e) => e.id === 'thoraxBones')).toBe(true)
    expect(filtrarEstudos(catalogo, 'odontoide').some((e) => e.id === 'neckOdon')).toBe(true)
  })

  it('os números de reserva da landing batem com o acervo', () => {
    // A landing usa estes literais quando a API de acesso falha. Se o atlas
    // ganhar uma incidência e eles não forem atualizados, a página de vendas
    // passa a mentir — e é este teste que avisa.
    expect(NUMEROS_RAIO_X.estudos).toBe(ESTUDOS_RAIO_X.length)
    expect(NUMEROS_RAIO_X.estruturas).toBe(TOTAL_ESTRUTURAS_RAIO_X)
    expect(NUMEROS_RAIO_X.regioes).toBe(REGIOES_RAIO_X.length)
  })

  it('as incidências vizinhas incluem a própria e todas as da região', () => {
    for (const regiao of REGIOES_RAIO_X) {
      const irmaos = irmaosDoEstudo(regiao.id)
      expect(irmaos).toHaveLength(regiao.totalEstudos)
      for (const irmao of irmaos) {
        expect(Object.keys(irmao).sort()).toEqual(['camada', 'id', 'incidencia'])
      }
    }
  })
})

describe('catálogo magro de tomografia', () => {
  const catalogo = montarCatalogoTC()

  it('mantém os totais do atlas', () => {
    expect(catalogo.totais.series).toBe(TOTAL_SUBSECOES)
    expect(catalogo.totais.estruturas).toBe(TOTAL_ESTRUTURAS)
    expect(catalogo.totais.cortes).toBe(TOTAL_CORTES)
    expect(catalogo.secoes.reduce((n, s) => n + s.series.length, 0)).toBe(TOTAL_SUBSECOES)
    expect(catalogo.indice).toHaveLength(TOTAL_ESTRUTURAS)
  })

  it('cada série leva capa e contagem para o cartão', () => {
    for (const secao of catalogo.secoes) {
      for (const serie of secao.series) {
        expect(serie.capa.length).toBeGreaterThan(0)
        expect(serie.totalCortes).toBeGreaterThan(0)
        expect(serie.totalEstruturas).toBeGreaterThan(0)
      }
    }
  })

  it('não leva o conteúdo aprofundado das fichas', () => {
    // O índice existe para a busca; morfologia, clínica, quiz e roteiro só são
    // carregados quando o aluno abre a série.
    for (const estrutura of catalogo.indice) {
      expect(Object.keys(estrutura).sort()).toEqual([
        'categoria',
        'id',
        'nome',
        'resumo',
        'serieId',
        'serieTitulo',
        'sinonimos',
      ])
      expect(estrutura.resumo.length).toBeLessThanOrEqual(181)
    }
  })

  it('busca por nome e por sinônimo', () => {
    expect(buscarNoIndice(catalogo.indice, 'a')).toEqual([])
    const achados = buscarNoIndice(catalogo.indice, 'porta')
    expect(achados.length).toBeGreaterThan(0)
    expect(achados.every((e) => catalogo.secoes.some((s) => s.series.some((x) => x.id === e.serieId)))).toBe(
      true,
    )
  })
})
