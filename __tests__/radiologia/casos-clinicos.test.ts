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
      // Piso baixo de propósito: o rótulo é curto por exigência do formato
      // ("Cardiomegalia", "Hérnia hiatal"). Quem cobra o comprimento dele é o
      // bloco "a forma não entrega o gabarito", que o compara aos distratores.
      expect(vinheta.achado.length, slug).toBeGreaterThan(8)
      expect(vinheta.correlacao.length, slug).toBeGreaterThan(150)

      for (const campo of ['pa', 'fc', 'fr', 'satO2'] as const) {
        expect(vinheta.vitais[campo], `${slug}: sinal vital ${campo}`).toBeTruthy()
      }
    }
  })

  /**
   * A forma da alternativa não pode entregar o gabarito.
   *
   * A primeira versão deste banco falhava nisto de forma catastrófica, e o
   * número é o argumento: a alternativa certa era a mais longa nas 72 questões
   * (94 caracteres contra 36 dos distratores) e a única com travessão
   * explicativo em 64 delas. Dava para gabaritar o acervo inteiro sem abrir uma
   * radiografia — o quiz media leitura de português, não de imagem.
   *
   * Estes testes existem para que a regressão seja barulhenta. Se um caso novo
   * chegar com o achado explicado no rótulo, eles quebram.
   */
  describe('a forma não entrega o gabarito', () => {
    const questoes = Object.entries(VINHETAS_CASOS_RAIO_X).map(([slug, vinheta]) => ({
      slug,
      vinheta,
      alternativas: [vinheta.achado, ...vinheta.distratores.map((item) => item.nome)],
    }))

    it('não usa travessão, parênteses nem aspas em nenhuma alternativa', () => {
      for (const { slug, alternativas } of questoes) {
        for (const alternativa of alternativas) {
          expect(alternativa, `${slug}: "${alternativa}" tem pontuação explicativa`).not.toMatch(
            /[—("'"]/,
          )
        }
      }
    })

    it('não deixa a alternativa certa ser sistematicamente a mais longa nem a mais curta', () => {
      let maisLonga = 0
      let maisCurta = 0
      for (const { vinheta, alternativas } of questoes) {
        const tamanhos = alternativas.map((item) => item.length)
        if (vinheta.achado.length === Math.max(...tamanhos)) maisLonga += 1
        if (vinheta.achado.length === Math.min(...tamanhos)) maisCurta += 1
      }
      // Com quatro alternativas, o acaso põe a certa em cada extremo em ~25%
      // das questões. O teto dá folga para variação sem admitir um padrão que
      // um aluno consiga apostar.
      const teto = Math.round(questoes.length * 0.38)
      expect(maisLonga, `certa é a mais longa em ${maisLonga}/${questoes.length}`).toBeLessThanOrEqual(teto)
      expect(maisCurta, `certa é a mais curta em ${maisCurta}/${questoes.length}`).toBeLessThanOrEqual(teto)
    })

    it('mantém a alternativa certa do mesmo tamanho dos distratores, questão a questão', () => {
      for (const { slug, vinheta, alternativas } of questoes) {
        const outras = alternativas.slice(1)
        const media = outras.reduce((total, item) => total + item.length, 0) / outras.length
        const razao = vinheta.achado.length / media
        expect(
          razao,
          `${slug}: "${vinheta.achado}" (${vinheta.achado.length}) contra média ${Math.round(media)} dos distratores`,
        ).toBeGreaterThan(0.6)
        expect(razao, `${slug}: "${vinheta.achado}" destoa em comprimento`).toBeLessThan(1.5)
      }
    })

    it('escreve toda alternativa como rótulo de diferencial, não como explicação', () => {
      for (const { slug, alternativas } of questoes) {
        for (const alternativa of alternativas) {
          const palavras = alternativa.trim().split(/\s+/).length
          expect(palavras, `${slug}: "${alternativa}" tem ${palavras} palavras`).toBeLessThanOrEqual(7)
          expect(alternativa, `${slug}: "${alternativa}" tem vírgula explicativa`).not.toMatch(/,/)
        }
      }
    })
  })

  it('guarda o achado por extenso para a resposta comentada', () => {
    for (const [slug, vinheta] of Object.entries(VINHETAS_CASOS_RAIO_X)) {
      // O veredito é o que o rótulo curto deixou de dizer: ele só aparece
      // depois da resposta, então pode — e deve — ser específico.
      expect(vinheta.veredito, `${slug}: sem veredito`).toBeDefined()
      expect(vinheta.veredito!.length, slug).toBeGreaterThan(vinheta.achado.length)
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
