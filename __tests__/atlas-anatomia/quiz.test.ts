import { describe, expect, it } from 'vitest'
import { comentar, contarEstruturas, montarQuiz, regioesDoSistema } from '@/lib/atlas-anatomia/quiz'

describe('quiz de identificação do Atlas', () => {
  it('monta a quantidade pedida sem repetir estrutura na mesma rodada', () => {
    const questoes = montarQuiz({}, 20, 4242)
    expect(questoes).toHaveLength(20)

    const nomes = questoes.map(questao => questao.ocorrencia.marcador.title)
    expect(new Set(nomes).size).toBe(nomes.length)
  })

  it('é reprodutível pela semente e muda quando a semente muda', () => {
    const primeira = montarQuiz({}, 10, 99).map(questao => questao.id)
    const repetida = montarQuiz({}, 10, 99).map(questao => questao.id)
    const outra = montarQuiz({}, 10, 100).map(questao => questao.id)

    expect(repetida).toEqual(primeira)
    expect(outra).not.toEqual(primeira)
  })

  it('dá quatro alternativas distintas, com exatamente uma correta', () => {
    for (const questao of montarQuiz({}, 30, 7)) {
      expect(questao.alternativas).toHaveLength(4)
      expect(new Set(questao.alternativas.map(alternativa => alternativa.texto)).size).toBe(4)

      const corretas = questao.alternativas.filter(alternativa => alternativa.correta)
      expect(corretas).toHaveLength(1)
      expect(questao.alternativas[questao.correta].texto).toBe(questao.ocorrencia.marcador.title)
    }
  })

  it('prefere distratores da própria prancha, que é onde eles ensinam', () => {
    const questoes = montarQuiz({}, 30, 31)

    // O distrator ideal é uma estrutura que está à vista na mesma peça: obriga a
    // olhar a prancha em vez de eliminar pelo absurdo. Nem toda peça tem quatro
    // marcadores, então a camada seguinte existe — mas a maioria deve vir daqui.
    const comDistratoresDaPeca = questoes.filter(questao => {
      const daPeca = questao.alternativas.filter(
        alternativa =>
          !alternativa.correta &&
          alternativa.insight?.regiao === questao.insight.regiao,
      )
      return daPeca.length >= 2
    })
    expect(comDistratoresDaPeca.length / questoes.length).toBeGreaterThan(0.7)

    // Nenhum distrator pode ser um recorte do nome certo ("Costela" x "Costela I"):
    // vira pegadinha de leitura, não de anatomia.
    for (const questao of questoes) {
      const certo = questao.ocorrencia.marcador.title.toLowerCase()
      for (const alternativa of questao.alternativas) {
        if (alternativa.correta) continue
        const errado = alternativa.texto.toLowerCase()
        expect(certo.includes(errado) || errado.includes(certo)).toBe(false)
      }
    }
  })

  it('respeita o recorte por sistema e por região', () => {
    const doCoracao = montarQuiz({ sistemaSlug: 'circulatorio' }, 10, 5)
    expect(doCoracao.every(questao => questao.ocorrencia.sistemaSlug === 'circulatorio')).toBe(true)

    const regioes = regioesDoSistema('esqueletico')
    expect(regioes.map(regiao => regiao.nome)).toContain('Membro Superior')

    const membroSuperior = montarQuiz({ sistemaSlug: 'esqueletico', regiao: 'Membro Superior' }, 8, 5)
    expect(membroSuperior.length).toBeGreaterThan(0)
    expect(membroSuperior.every(questao => questao.ocorrencia.regiao === 'Membro Superior')).toBe(true)

    expect(contarEstruturas({ sistemaSlug: 'circulatorio' })).toBeGreaterThan(0)
    expect(contarEstruturas({})).toBe(2382)
  })

  it('comenta a questão inteira, alternativa por alternativa', () => {
    for (const questao of montarQuiz({}, 15, 88)) {
      const errada = (questao.correta + 1) % questao.alternativas.length
      const comentario = comentar(questao, errada)

      expect(comentario.abertura.length).toBeGreaterThan(30)
      expect(comentario.identificacao).toContain(questao.ocorrencia.marcador.title)
      expect(comentario.blocos.length).toBeGreaterThanOrEqual(2)
      expect(comentario.fechamento.length).toBeGreaterThan(20)

      // Todas as alternativas comentadas, e a escolhida reconhecida como tal.
      expect(comentario.alternativas).toHaveLength(questao.alternativas.length)
      expect(comentario.alternativas[errada].comentario).toContain('Foi a sua escolha')
      for (const alternativa of comentario.alternativas) {
        expect(alternativa.comentario.length).toBeGreaterThan(30)
      }
    }
  })

  it('muda a abertura conforme o aluno acertou ou errou', () => {
    const questao = montarQuiz({}, 1, 1234)[0]
    const acerto = comentar(questao, questao.correta)
    const erro = comentar(questao, (questao.correta + 1) % 4)

    expect(acerto.abertura).not.toBe(erro.abertura)
    expect(acerto.alternativas[questao.correta].comentario.startsWith('É esta')).toBe(true)
  })
})
