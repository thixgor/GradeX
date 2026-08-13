import { describe, expect, it } from 'vitest'
import { ATLAS_SYSTEMS, flattenCollections, type AtlasMarker } from '@/lib/atlas-anatomia/catalogo'
import { getMarkerInsight } from '@/lib/atlas-anatomia/insights'
import { classificar } from '@/lib/atlas-anatomia/classes'
import { resolverRegiao } from '@/lib/atlas-anatomia/regioes'

interface Ocorrencia {
  sistema: string
  caminho: string[]
  prancha: string
  marcador: AtlasMarker
}

const OCORRENCIAS: Ocorrencia[] = ATLAS_SYSTEMS.flatMap(sistema =>
  flattenCollections(sistema.collections).flatMap(colecao =>
    (colecao.pieces || []).flatMap(peca =>
      peca.markers.map(marcador => ({
        sistema: sistema.slug,
        caminho: colecao.breadcrumb,
        prancha: peca.title,
        marcador,
      })),
    ),
  ),
)

function fichaDe(titulo: string) {
  const ocorrencia = OCORRENCIAS.find(item => item.marcador.title === titulo)
  if (!ocorrencia) throw new Error(`Marcador ausente no acervo: ${titulo}`)
  return getMarkerInsight(ocorrencia.marcador, {
    sistema: ocorrencia.sistema,
    caminho: ocorrencia.caminho,
    prancha: ocorrencia.prancha,
  })
}

describe('motor de conteúdo do Atlas de Anatomia', () => {
  it('entrega ficha completa para todos os marcadores do acervo', () => {
    expect(OCORRENCIAS).toHaveLength(2382)

    for (const { sistema, caminho, prancha, marcador } of OCORRENCIAS) {
      const ficha = getMarkerInsight(marcador, { sistema, caminho, prancha })

      // Selos são rótulos curtos; os demais campos são texto corrido e não
      // podem degenerar em uma frase solta. A ficha é o produto da seção.
      for (const campo of ['classe', 'regiao'] as const) {
        expect(ficha[campo].trim().length, `${marcador.title} · ${campo}`).toBeGreaterThan(3)
      }
      for (const campo of ['resumo', 'localizacao', 'funcao', 'clinica'] as const) {
        expect(ficha[campo].trim().length, `${marcador.title} · ${campo}`).toBeGreaterThan(28)
      }
      expect(ficha.pontos.length, marcador.title).toBeGreaterThanOrEqual(3)
    }
  })

  it('mantém a cobertura de estruturas com conteúdo curado', () => {
    const curados = OCORRENCIAS.filter(
      ({ sistema, caminho, prancha, marcador }) =>
        getMarkerInsight(marcador, { sistema, caminho, prancha }).aprofundado,
    ).length

    // Trava de regressão: o dicionário específico cobre hoje quase metade das
    // ocorrências. Quem remover entradas precisa perceber a queda aqui.
    expect(curados / OCORRENCIAS.length).toBeGreaterThan(0.45)
  })

  it('classifica praticamente todo marcador em uma família anatômica', () => {
    const semClasse = new Set(
      OCORRENCIAS.filter(
        ({ sistema, caminho, prancha, marcador }) =>
          getMarkerInsight(marcador, { sistema, caminho, prancha }).classeId === 'estrutura',
      ).map(item => item.marcador.title),
    )

    expect(semClasse.size).toBeLessThanOrEqual(15)
  })

  it('resolve a região pelo caminho da coleção, sem confundir palavras contidas', () => {
    // "antebraço" contém "braço": sem comparação por palavra inteira, toda a
    // coleção do antebraço herdaria a irrigação e a inervação do braço.
    expect(resolverRegiao('esqueletico', ['Membro Superior', 'Antebraço']).id).toBe('antebraco')
    expect(resolverRegiao('esqueletico', ['Membro Superior', 'Braço']).id).toBe('braco')
    expect(resolverRegiao('esqueletico', ['Membro Inferior', 'Perna']).id).toBe('perna')
    expect(resolverRegiao('esqueletico', ['Membro Inferior', 'Pé']).id).toBe('pe')
    expect(resolverRegiao('nervoso', ['Meninges']).id).toBe('meninges')
    expect(resolverRegiao('circulatorio', ['Coração']).id).toBe('coracao')
  })

  it('deduz a classe estrutural a partir da terminologia anatômica', () => {
    expect(classificar('Músculo Braquiorradial').id).toBe('musculo')
    expect(classificar('Artéria Radial').id).toBe('arteria')
    expect(classificar('Veia Cava Inferior').id).toBe('veia')
    expect(classificar('Nervo Mediano').id).toBe('nervo')
    expect(classificar('Forame Vertebral').id).toBe('passagem-ossea')
    expect(classificar('Processo Espinhoso').id).toBe('acidente-osseo')
    expect(classificar('Tendão do Músculo Flexor Longo do Hálux').id).toBe('tendao')
    expect(classificar('Ligamento Patelar').id).toBe('ligamento')
    // Sem pista no nome, o sistema do acervo evita o texto totalmente genérico.
    expect(classificar('Endocárdio', 'circulatorio').id).toBe('cardiaco')
    expect(classificar('Pulvinar do Tálamo', 'nervoso').id).toBe('snc')
  })

  it('traz conteúdo específico para as estruturas curadas', () => {
    const braquiorradial = fichaDe('Músculo Braquiorradial')
    expect(braquiorradial.aprofundado).toBe(true)
    expect(braquiorradial.inervacao).toContain('radial')

    const escafoide = fichaDe('Escafoide')
    expect(escafoide.clinica.toLowerCase()).toContain('tabaqueira')

    const ventriculoEsquerdo = fichaDe('Ventrículo Esquerdo')
    expect(ventriculoEsquerdo.classe).toBe('Câmara cardíaca')
    expect(ventriculoEsquerdo.vascularizacao).toBeTruthy()

    const espinhoso = fichaDe('Processo Espinhoso')
    expect(espinhoso.regiao).toBe('Coluna vertebral')
    expect(espinhoso.pontos.length).toBeGreaterThanOrEqual(3)
  })

  it('preserva a descrição original do acervo como nota, quando existe', () => {
    const comDescricao = OCORRENCIAS.find(item => (item.marcador.description || '').trim().length >= 12)
    if (!comDescricao) return

    const ficha = getMarkerInsight(comDescricao.marcador, {
      sistema: comDescricao.sistema,
      caminho: comDescricao.caminho,
      prancha: comDescricao.prancha,
    })
    expect(ficha.notaAcervo).toBe(comDescricao.marcador.description.trim())
  })
})
