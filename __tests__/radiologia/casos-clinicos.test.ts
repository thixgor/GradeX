import { describe, expect, it } from 'vitest'
import { CASOS_RAIO_X, CASOS_POR_SLUG } from '@/lib/radiologia/casos-raio-x'
import { DETALHES_CASOS_RAIO_X } from '@/lib/radiologia/casos-raio-x-detalhes'
import { VINHETAS_CASOS_RAIO_X } from '@/lib/radiologia/casos-clinicos'

/**
 * A vinheta é o único conteúdo do quiz clínico escrito à mão de ponta a ponta —
 * o resto vem do acervo. Estes testes existem para que ela não descole dele:
 * caso novo sem consulta, consulta apontando para uma imagem que não existe ou
 * para um filme sem marcações quebrariam a questão em silêncio.
 */
describe('vinhetas clínicas dos casos de Raio-X', () => {
  it('cobre todos os casos do acervo, sem entradas órfãs', () => {
    const slugs = CASOS_RAIO_X.map((caso) => caso.slug)
    for (const slug of slugs) {
      expect(VINHETAS_CASOS_RAIO_X[slug], `caso sem vinheta: ${slug}`).toBeDefined()
    }
    for (const slug of Object.keys(VINHETAS_CASOS_RAIO_X)) {
      expect(CASOS_POR_SLUG.has(slug), `vinheta órfã: ${slug}`).toBe(true)
    }
  })

  it('aponta para um filme que existe e que tem marcações a revelar', () => {
    for (const [slug, vinheta] of Object.entries(VINHETAS_CASOS_RAIO_X)) {
      const caso = CASOS_POR_SLUG.get(slug)!
      const indice = vinheta.imagem ?? 1
      const imagem = caso.imagens.find((item) => item.indice === indice)
      expect(imagem, `${slug}: imagem ${indice} inexistente`).toBeDefined()

      // Sem marcações, a resposta comentada perderia justamente o filme
      // marcado que o aluno espera ver depois de responder.
      const marcacoes = DETALHES_CASOS_RAIO_X[slug]?.marcacoes?.[indice] ?? []
      expect(marcacoes.length, `${slug}: imagem ${indice} sem marcações`).toBeGreaterThan(0)
    }
  })

  it('conta uma consulta inteira, e não só a queixa', () => {
    for (const [slug, vinheta] of Object.entries(VINHETAS_CASOS_RAIO_X)) {
      expect(vinheta.cenario.length, slug).toBeGreaterThan(4)
      expect(vinheta.identificacao.length, slug).toBeGreaterThan(15)
      expect(vinheta.queixa.length, slug).toBeGreaterThan(15)
      expect(vinheta.historia.length, slug).toBeGreaterThan(120)
      expect(vinheta.antecedentes.length, slug).toBeGreaterThanOrEqual(3)
      expect(vinheta.exame.length, slug).toBeGreaterThanOrEqual(3)
      expect(vinheta.pedido.length, slug).toBeGreaterThan(40)
      expect(vinheta.pergunta.length, slug).toBeGreaterThan(20)
      expect(vinheta.achado.length, slug).toBeGreaterThan(15)
      expect(vinheta.correlacao.length, slug).toBeGreaterThan(150)

      for (const campo of ['pa', 'fc', 'fr', 'satO2'] as const) {
        expect(vinheta.vitais[campo], `${slug}: sinal vital ${campo}`).toBeTruthy()
      }
    }
  })

  it('oferece três distratores comentados por questão, sem repetir o gabarito', () => {
    for (const [slug, vinheta] of Object.entries(VINHETAS_CASOS_RAIO_X)) {
      expect(vinheta.distratores.length, slug).toBe(3)

      const nomes = new Set(vinheta.distratores.map((item) => item.nome))
      expect(nomes.size, `${slug}: distratores repetidos`).toBe(3)
      expect(nomes.has(vinheta.achado), `${slug}: distrator igual ao gabarito`).toBe(false)

      for (const distrator of vinheta.distratores) {
        expect(distrator.nome.length, slug).toBeGreaterThan(10)
        // O texto do descarte é o que ensina: precisa dizer o que separa a
        // alternativa do gabarito, não apenas negá-la.
        expect(distrator.porQue.length, `${slug}: descarte raso em "${distrator.nome}"`).toBeGreaterThan(120)
      }
    }
  })
})
