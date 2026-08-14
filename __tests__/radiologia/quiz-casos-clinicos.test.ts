import { describe, expect, it } from 'vitest'
import { CASOS_RAIO_X, CASOS_POR_SLUG, GUIAS_CASOS_RAIO_X } from '@/lib/radiologia/casos-raio-x'
import {
  QUIZZES_CLINICOS,
  TOTAL_QUESTOES_CLINICAS,
  getQuizCasoClinico,
  montarQuestaoClinica,
  quizDoCaso,
} from '@/lib/radiologia/quiz-casos-raio-x'

describe('quiz de casos clínicos do Raio-X', () => {
  it('monta uma questão para cada caso do acervo', () => {
    expect(TOTAL_QUESTOES_CLINICAS).toBe(CASOS_RAIO_X.length)
  })

  it('oferece o plantão e um quiz por capítulo, todos com capa e questões', () => {
    const capitulos = QUIZZES_CLINICOS.filter((quiz) => quiz.tipo === 'categoria')
    expect(QUIZZES_CLINICOS.filter((quiz) => quiz.tipo === 'plantao')).toHaveLength(1)
    expect(capitulos).toHaveLength(Object.keys(GUIAS_CASOS_RAIO_X).length)

    const slugs = QUIZZES_CLINICOS.map((quiz) => quiz.slug)
    expect(new Set(slugs).size).toBe(slugs.length)

    for (const quiz of QUIZZES_CLINICOS) {
      expect(quiz.total, quiz.slug).toBeGreaterThan(0)
      expect(quiz.capa?.sprite, quiz.slug).toMatch(/^\/img\/radiologia\/casos-raio-x\/v1\//)
      expect(quiz.descricao.length, quiz.slug).toBeGreaterThan(80)
    }
  })

  it('entrega em cada quiz exatamente as questões que promete', () => {
    for (const resumo of QUIZZES_CLINICOS) {
      const quiz = getQuizCasoClinico(resumo.slug)
      expect(quiz, resumo.slug).toBeDefined()
      expect(quiz!.questoes).toHaveLength(resumo.total)

      const ids = quiz!.questoes.map((questao) => questao.id)
      expect(new Set(ids).size, `${resumo.slug}: questões repetidas`).toBe(ids.length)

      if (resumo.tipo === 'categoria') {
        for (const questao of quiz!.questoes) {
          expect(questao.categoria, resumo.slug).toBe(resumo.categoria)
        }
      }
    }
  })

  it('mistura os sete capítulos no plantão, em rodízio', () => {
    const plantao = getQuizCasoClinico('plantao')!
    // Com o rodízio, as sete primeiras questões vêm de sete capítulos
    // diferentes: qualquer recorte do banco mostra a variedade do acervo.
    const primeiros = plantao.questoes.slice(0, 7).map((questao) => questao.categoria)
    expect(new Set(primeiros).size).toBe(7)
  })

  it('devolve o slug inexistente como indefinido', () => {
    expect(getQuizCasoClinico('nao-existe')).toBeUndefined()
  })

  it('tem quatro alternativas por questão, com uma única correta', () => {
    for (const questao of getQuizCasoClinico('plantao')!.questoes) {
      expect(questao.alternativas, questao.id).toHaveLength(4)

      const nomes = questao.alternativas.map((item) => item.nome)
      expect(new Set(nomes).size, `${questao.id}: alternativas repetidas`).toBe(4)

      const ids = questao.alternativas.map((item) => item.id)
      expect(new Set(ids).size, `${questao.id}: ids repetidos`).toBe(4)

      expect(questao.correta, `${questao.id}: sem gabarito`).toBeGreaterThanOrEqual(0)
      expect(questao.alternativas[questao.correta].nome).toBe(questao.vinheta.achado)
    }
  })

  it('não deixa o gabarito preso a uma posição', () => {
    // Alternativa sempre em A seria um atalho involuntário: bastaria marcar a
    // primeira. O embaralhamento é determinístico, mas precisa distribuir.
    const posicoes = new Set(getQuizCasoClinico('plantao')!.questoes.map((q) => q.correta))
    expect(posicoes.size).toBeGreaterThan(1)
  })

  it('monta o comentário aprofundado a partir do dossiê do caso', () => {
    for (const questao of getQuizCasoClinico('plantao')!.questoes) {
      const { comentario } = questao

      // O veredito é o achado por extenso, e não o rótulo curto que disputou
      // com os distratores: ele só aparece depois da resposta.
      expect(comentario.veredito, questao.id).toBe(
        questao.vinheta.veredito ?? questao.vinheta.achado,
      )
      expect(comentario.veredito.length, questao.id).toBeGreaterThan(questao.vinheta.achado.length)
      expect(comentario.correlacao.length, questao.id).toBeGreaterThan(150)
      expect(comentario.leitura.length, questao.id).toBeGreaterThan(100)
      expect(comentario.descartes, questao.id).toHaveLength(3)
      expect(comentario.roteiro.length, questao.id).toBeGreaterThan(0)
      expect(comentario.perguntaGuia.length, questao.id).toBeGreaterThan(20)

      // É a metade marcada do sprite que a resposta revela: sem marcações, o
      // momento didático da questão não acontece.
      expect(comentario.marcacoes.length, `${questao.id}: sem marcações`).toBeGreaterThan(0)

      // O descarte precisa cobrir exatamente as alternativas erradas.
      const erradas = questao.alternativas
        .filter((_, posicao) => posicao !== questao.correta)
        .map((item) => item.nome)
        .sort()
      expect(comentario.descartes.map((item) => item.nome).sort()).toEqual(erradas)
    }
  })

  it('aponta para um filme do próprio caso e para o caso no atlas', () => {
    for (const questao of getQuizCasoClinico('plantao')!.questoes) {
      const caso = CASOS_POR_SLUG.get(questao.casoSlug)!
      expect(caso.imagens.some((imagem) => imagem.indice === questao.imagem.indice)).toBe(true)
      expect(questao.imagem.largura).toBeGreaterThan(0)
      expect(questao.imagem.altura).toBeGreaterThan(0)
      expect(questao.atalho).toBe(`/manual-clinico/radiologia/raio-x/casos/${questao.casoSlug}`)
    }
  })

  it('é determinístico: montar duas vezes dá o mesmo gabarito', () => {
    for (const caso of CASOS_RAIO_X) {
      const primeira = montarQuestaoClinica(caso)!
      const segunda = montarQuestaoClinica(caso)!
      expect(segunda.correta, caso.slug).toBe(primeira.correta)
      expect(segunda.alternativas.map((item) => item.nome)).toEqual(
        primeira.alternativas.map((item) => item.nome),
      )
    }
  })

  it('liga cada caso ao quiz do capítulo dele', () => {
    for (const caso of CASOS_RAIO_X) {
      expect(quizDoCaso(caso.slug)?.slug, caso.slug).toBe(caso.categoria)
    }
    expect(quizDoCaso('nao-existe')).toBeUndefined()
  })
})
