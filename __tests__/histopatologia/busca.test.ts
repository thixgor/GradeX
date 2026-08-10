import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { buscar, fatiarParaRealce } from '@/lib/histopatologia/busca'
import type { EntradaBusca } from '@/lib/histopatologia/esquemas'
import { chaveDeBusca, chaveDeIndice, radical, resumir } from '@/lib/histopatologia/texto'
import { chaveDeBusca as chaveDaHistologia, slugificar as slugDaHistologia } from '@/lib/histologia/texto'
import { slugificar } from '@/lib/histopatologia/texto'

const RAIZ = path.resolve(__dirname, '../..')
const DADOS = path.join(RAIZ, 'data/histopatologia')

const indiceCliente = JSON.parse(
  readFileSync(path.join(DADOS, 'busca-cliente.json'), 'utf8'),
) as EntradaBusca[]
const indiceServidor = JSON.parse(
  readFileSync(path.join(DADOS, 'busca-servidor.json'), 'utf8'),
) as EntradaBusca[]

describe('normalização', () => {
  /**
   * A Histopatologia tem seu próprio módulo de texto porque ele precisa rodar
   * sem imports (o pipeline o carrega com remoção de tipos). Este teste trava a
   * equivalência com o módulo da Histologia normal — sem ele, uma divergência
   * entre os dois módulos quebraria a busca em silêncio.
   */
  it('concorda com a normalização da Histologia normal', () => {
    const amostras = [
      'Cólon ascendente',
      'H&E',
      'Ziehl-Neelsen/Fite',
      'Necrose coagulativa',
      'Imuno-histoquímica',
      'ADENOCARCINOMA do cólon',
    ]
    for (const amostra of amostras) {
      expect(chaveDeBusca(amostra)).toBe(chaveDaHistologia(amostra))
      expect(slugificar(amostra)).toBe(slugDaHistologia(amostra))
    }
  })

  it('trata pontuação como separador, não como remoção', () => {
    expect(chaveDeBusca('H&E')).toBe('h e')
    expect(chaveDeBusca('Ziehl-Neelsen/Fite')).toBe('ziehl neelsen fite')
  })

  it('o radical é conservador o bastante para não colapsar entidades distintas', () => {
    expect(radical('granulomas')).toBe('granuloma')
    expect(radical('lesoes')).toBe('lesao')
    /*
     * "necroses" reduz a "necros", e não a "necrose": as duas regras de plural
     * do português (-s e -es) são ambíguas fora de contexto. O radical não
     * precisa ser a forma canônica — precisa ser um prefixo estável que o
     * casamento por substring encontre no índice, e é isso que se verifica aqui.
     */
    expect('necrose'.includes(radical('necroses'))).toBe(true)
    // Palavras curtas ficam intactas: "cisto" e "cistos" não podem virar "cist".
    expect(radical('cist')).toBe('cist')
    expect(radical('mitose')).toBe('mitose')
  })

  it('o índice guarda o radical junto do termo', () => {
    expect(chaveDeIndice('granulomas')).toContain('granuloma')
    expect(chaveDeIndice('granuloma')).toBe('granuloma')
  })

  it('resumir corta em fronteira de palavra e sinaliza', () => {
    const longo = 'Peça R-66. Tuberculose pulmonar exsudativa com extensa necrose caseosa'
    const curto = resumir(longo, 30)
    expect(curto.length).toBeLessThanOrEqual(31)
    expect(curto.endsWith('…')).toBe(true)
    expect(curto).not.toMatch(/\s…$/)
  })
})

describe('ranqueamento', () => {
  it('encontra doença pelo nome canônico', () => {
    const resultados = buscar(indiceCliente, 'apendicite')
    expect(resultados[0]?.titulo).toBe('Apendicite aguda')
    expect(resultados[0]?.tipo).toBe('doenca')
  })

  it('encontra por sinônimo cadastrado em português', () => {
    const resultados = buscar(indiceCliente, 'fígado gorduroso')
    expect(resultados.some((r) => r.titulo === 'Esteatose hepática')).toBe(true)
  })

  it('encontra por sinônimo cadastrado em inglês', () => {
    const resultados = buscar(indiceCliente, 'colorectal adenocarcinoma')
    expect(resultados.some((r) => r.titulo === 'Adenocarcinoma colorretal')).toBe(true)
  })

  it('tolera acento e caixa', () => {
    const comAcento = buscar(indiceCliente, 'Hiperplasia Nodular da Próstata')
    const semAcento = buscar(indiceCliente, 'hiperplasia nodular da prostata')
    expect(comAcento[0]?.url).toBe(semAcento[0]?.url)
  })

  it('tolera plural simples', () => {
    const resultados = buscar(indiceCliente, 'granulomas')
    expect(resultados.some((r) => r.titulo.toLowerCase().includes('granulomatosa'))).toBe(true)
  })

  it('encontra mecanismo pelo nome', () => {
    const resultados = buscar(indiceCliente, 'necrose caseosa')
    expect(resultados[0]?.tipo).toBe('mecanismo')
  })

  it('coloca doença e mecanismo à frente de entrada catalogada', () => {
    const resultados = buscar(indiceServidor, 'trombose', { limite: 5 })
    expect(['doenca', 'mecanismo']).toContain(resultados[0]?.tipo)
  })

  it('encontra entrada catalogada no índice de servidor', () => {
    const resultados = buscar(indiceServidor, 'meningioma', { limite: 10 })
    expect(resultados.some((r) => r.tipo === 'entrada')).toBe(true)
  })

  it('ignora consultas curtas demais', () => {
    expect(buscar(indiceCliente, 'a')).toEqual([])
    expect(buscar(indiceCliente, '')).toEqual([])
  })

  it('respeita o limite depois de ordenar, não antes', () => {
    const dez = buscar(indiceServidor, 'necrose', { limite: 10 })
    const cinco = buscar(indiceServidor, 'necrose', { limite: 5 })
    expect(cinco).toEqual(dez.slice(0, 5))
  })
})

describe('filtros', () => {
  it('filtra por tipo', () => {
    const soDoencas = buscar(indiceServidor, 'carcinoma', { filtros: { tipos: ['doenca'] } })
    expect(soDoencas.every((r) => r.tipo === 'doenca')).toBe(true)
  })

  it('filtra por estado de revisão', () => {
    const publicadas = buscar(indiceServidor, 'apendicite', {
      filtros: { estados: ['publicado'] },
    })
    // Nenhuma doença está publicada: o filtro precisa devolver lista vazia, e
    // não silenciosamente ignorar o critério.
    expect(publicadas).toEqual([])

    const emRevisao = buscar(indiceServidor, 'apendicite', {
      filtros: { estados: ['revisao-medica'] },
    })
    expect(emRevisao.length).toBeGreaterThan(0)
  })

  it('nenhum resultado carrega URL de mídia', () => {
    for (const resultado of buscar(indiceServidor, 'carcinoma', { limite: 40 })) {
      expect(/https?:\/\//i.test(`${resultado.titulo}${resultado.trilha}${resultado.url}`)).toBe(
        false,
      )
    }
  })
})

describe('realce', () => {
  it('recorta o texto original, preservando acento', () => {
    const partes = fatiarParaRealce('Esteatose hepática', 'esteatose')
    expect(partes[0]).toEqual({ texto: 'Esteatose', realce: true })
    expect(partes[1]?.texto).toBe(' hepática')
  })

  it('não realça quando a normalização muda o comprimento', () => {
    // "H&E" normaliza para "h e" (mesmo comprimento) mas "A  B" colapsa espaços.
    const partes = fatiarParaRealce('Necrose   coagulativa', 'necrose')
    expect(partes).toEqual([{ texto: 'Necrose   coagulativa', realce: false }])
  })

  it('não produz HTML', () => {
    for (const parte of fatiarParaRealce('<script>alert(1)</script>', 'script')) {
      expect(typeof parte.texto).toBe('string')
      expect(parte).not.toHaveProperty('html')
    }
  })
})
