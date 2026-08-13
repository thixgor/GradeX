import { describe, expect, it } from 'vitest'
import { comentar, montarQuiz } from '@/lib/atlas-anatomia/quiz'
import {
  aplicarRecorte,
  chaveDeRegiao,
  contarEstruturas,
  ocorrenciasDoAcervo,
  regioesDoSistema,
  type RecorteQuiz,
} from '@/lib/atlas-anatomia/recorte-quiz'
import { ATLAS_SYSTEMS } from '@/lib/atlas-anatomia/catalogo'

// No navegador o universo chega por sistema, sob demanda. Aqui, no Node, o
// acervo inteiro está à mão: monta-se uma vez e as questões saem dele.
const ACERVO = ocorrenciasDoAcervo(ATLAS_SYSTEMS)

const sortear = (recorte: RecorteQuiz, quantidade: number, semente: number) =>
  montarQuiz(ACERVO, recorte, quantidade, semente)

describe('quiz de identificação do Atlas', () => {
  it('monta a quantidade pedida sem repetir estrutura na mesma rodada', () => {
    const questoes = sortear({}, 20, 4242)
    expect(questoes).toHaveLength(20)

    const nomes = questoes.map(questao => questao.ocorrencia.marcador.title)
    expect(new Set(nomes).size).toBe(nomes.length)
  })

  it('é reprodutível pela semente e muda quando a semente muda', () => {
    const primeira = sortear({}, 10, 99).map(questao => questao.id)
    const repetida = sortear({}, 10, 99).map(questao => questao.id)
    const outra = sortear({}, 10, 100).map(questao => questao.id)

    expect(repetida).toEqual(primeira)
    expect(outra).not.toEqual(primeira)
  })

  it('dá quatro alternativas distintas, com exatamente uma correta', () => {
    for (const questao of sortear({}, 30, 7)) {
      expect(questao.alternativas).toHaveLength(4)
      expect(new Set(questao.alternativas.map(alternativa => alternativa.texto)).size).toBe(4)

      const corretas = questao.alternativas.filter(alternativa => alternativa.correta)
      expect(corretas).toHaveLength(1)
      expect(questao.alternativas[questao.correta].texto).toBe(questao.ocorrencia.marcador.title)
    }
  })

  it('prefere distratores da própria prancha, que é onde eles ensinam', () => {
    const questoes = sortear({}, 30, 31)

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
    const doCoracao = sortear({ sistemas: ['circulatorio'] }, 10, 5)
    expect(doCoracao.every(questao => questao.ocorrencia.sistemaSlug === 'circulatorio')).toBe(true)

    const regioes = regioesDoSistema(ACERVO, 'esqueletico')
    expect(regioes.map(regiao => regiao.nome)).toContain('Membro Superior')

    const membroSuperior = sortear({ sistemas: ['esqueletico'], regioes: [chaveDeRegiao('esqueletico', 'Membro Superior')] }, 8, 5)
    expect(membroSuperior.length).toBeGreaterThan(0)
    expect(membroSuperior.every(questao => questao.ocorrencia.regiao === 'Membro Superior')).toBe(true)

    expect(contarEstruturas(ACERVO, { sistemas: ['circulatorio'] })).toBeGreaterThan(0)
    expect(contarEstruturas(ACERVO, {})).toBe(2382)
  })

  it('combina sistemas, e o recorte de região de um não encolhe os outros', () => {
    const doisSistemas = aplicarRecorte(ACERVO, { sistemas: ['circulatorio', 'urinario'] })
    const slugs = new Set(doisSistemas.map(item => item.sistemaSlug))
    expect(slugs).toEqual(new Set(['circulatorio', 'urinario']))
    expect(doisSistemas.length).toBe(
      contarEstruturas(ACERVO, { sistemas: ['circulatorio'] }) +
        contarEstruturas(ACERVO, { sistemas: ['urinario'] }),
    )

    // Duas regiões do mesmo sistema entram somadas, não intersectadas.
    const duasRegioes = aplicarRecorte(ACERVO, {
      sistemas: ['esqueletico'],
      regioes: [chaveDeRegiao('esqueletico', 'Membro Superior'), chaveDeRegiao('esqueletico', 'Membro Inferior')],
    })
    expect(new Set(duasRegioes.map(item => item.regiao))).toEqual(new Set(['Membro Superior', 'Membro Inferior']))

    // O caso que motivou a chave prefixada: recortar região no esquelético não
    // pode apagar o muscular, que entrou inteiro.
    const misturado = aplicarRecorte(ACERVO, {
      sistemas: ['esqueletico', 'muscular'],
      regioes: [chaveDeRegiao('esqueletico', 'Membro Superior')],
    })
    const doEsqueletico = misturado.filter(item => item.sistemaSlug === 'esqueletico')
    const doMuscular = misturado.filter(item => item.sistemaSlug === 'muscular')
    expect(doEsqueletico.every(item => item.regiao === 'Membro Superior')).toBe(true)
    expect(doMuscular.length).toBe(contarEstruturas(ACERVO, { sistemas: ['muscular'] }))
    expect(new Set(doMuscular.map(item => item.regiao)).size).toBeGreaterThan(1)
  })

  it('ainda entende o link antigo, com a região sem o sistema na frente', () => {
    const legado = aplicarRecorte(ACERVO, { sistemas: ['esqueletico'], regioes: ['Membro Superior'] })
    expect(legado.length).toBeGreaterThan(0)
    expect(legado.every(item => item.regiao === 'Membro Superior')).toBe(true)
    expect(legado.length).toBe(
      contarEstruturas(ACERVO, {
        sistemas: ['esqueletico'],
        regioes: [chaveDeRegiao('esqueletico', 'Membro Superior')],
      }),
    )
  })

  it('comenta a questão inteira, alternativa por alternativa', () => {
    for (const questao of sortear({}, 15, 88)) {
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
    const questao = sortear({}, 1, 1234)[0]
    const acerto = comentar(questao, questao.correta)
    const erro = comentar(questao, (questao.correta + 1) % 4)

    expect(acerto.abertura).not.toBe(erro.abertura)
    expect(acerto.alternativas[questao.correta].comentario.startsWith('É esta')).toBe(true)
  })
})
