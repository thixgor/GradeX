import { describe, expect, it } from 'vitest'
import { NOTAS_ESTRUTURAS } from '@/lib/radiologia/estruturas'
import { ESTUDOS_RAIO_X, REGIOES_RAIO_X, estudosDaRegiao } from '@/lib/radiologia/raio-x'
import { CONFUSOES_RAIO_X, confusaoEntre, paresConfundiveis } from '@/lib/radiologia/quiz-confusoes'
import {
  QUIZZES_RAIO_X,
  TOTAL_QUESTOES_RAIO_X,
  getQuizRaioX,
  montarQuestao,
  questoesDoEstudo,
  quizDoEstudo,
} from '@/lib/radiologia/quiz-raio-x'

const NOMES_DO_ACERVO = new Set(
  ESTUDOS_RAIO_X.flatMap((estudo) => estudo.estruturas.map((estrutura) => estrutura.nome)),
)

/** Mesma normalização do motor: singular e plural são a mesma estrutura. */
function chave(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((palavra) => palavra.replace(/(oes|aes)$/, 'ao').replace(/([^aeiou])es$/, '$1').replace(/s$/, ''))
    .join(' ')
}

describe('tabela curada de confusões', () => {
  it('só cita estruturas que existem no atlas', () => {
    const orfas = CONFUSOES_RAIO_X.flatMap(({ entre }) =>
      entre.filter((nome) => !NOMES_DO_ACERVO.has(nome)),
    )
    expect(orfas).toEqual([])
  })

  it('nunca emparelha uma estrutura com ela mesma nem repete um par', () => {
    const vistos = new Set<string>()
    for (const { entre } of CONFUSOES_RAIO_X) {
      expect(chave(entre[0]), `par degenerado: ${entre.join(' / ')}`).not.toBe(chave(entre[1]))
      const assinatura = [chave(entre[0]), chave(entre[1])].sort().join('||')
      expect(vistos.has(assinatura), `par repetido: ${entre.join(' / ')}`).toBe(false)
      vistos.add(assinatura)
    }
  })

  it('responde nos dois sentidos e com texto de tamanho útil', () => {
    for (const { entre, texto } of CONFUSOES_RAIO_X) {
      expect(confusaoEntre(entre[0], entre[1])).toBe(texto)
      expect(confusaoEntre(entre[1], entre[0])).toBe(texto)
      expect(texto.length, `discriminador curto em ${entre.join(' / ')}`).toBeGreaterThan(120)
    }
  })

  it('cobre os pares clássicos de alto rendimento', () => {
    expect(confusaoEntre('Tubérculo maior', 'Tubérculo menor')).toBeTruthy()
    expect(confusaoEntre('Intestino delgado', 'Intestino grosso')).toBeTruthy()
    expect(confusaoEntre('Escafoide', 'Semilunar')).toBeTruthy()
    expect(confusaoEntre('Cabeça do fêmur', 'Colo do fêmur')).toBeTruthy()
    expect(paresConfundiveis('Clavículas')).toContain('Escápulas')
  })
})

describe('montagem das questões', () => {
  const todas = ESTUDOS_RAIO_X.flatMap((estudo) =>
    estudo.estruturas.map((estrutura) => ({ estudo, estrutura, questao: montarQuestao(estudo, estrutura) })),
  )

  it('gera uma questão por demarcação do acervo', () => {
    expect(todas).toHaveLength(TOTAL_QUESTOES_RAIO_X)
    expect(new Set(todas.map(({ questao }) => questao.id)).size).toBe(todas.length)
  })

  it('acende no filme exatamente a estrutura que é gabarito', () => {
    for (const { estudo, estrutura, questao } of todas) {
      expect(questao.imagem).toBe(estudo.imagem)
      expect(questao.sobreposicao).toBe(estrutura.sobreposicao)
      expect(questao.alternativas[questao.correta].nome).toBe(estrutura.nome)
      expect(questao.atalho).toBe(
        `/manual-clinico/radiologia/raio-x/${estudo.id}?estrutura=${estrutura.slug}`,
      )
    }
  })

  it('oferece quatro alternativas distintas, sem singular/plural da resposta', () => {
    for (const { estrutura, questao } of todas) {
      expect(questao.alternativas).toHaveLength(4)
      const chaves = questao.alternativas.map((alternativa) => chave(alternativa.nome))
      expect(new Set(chaves).size, `alternativa repetida em ${questao.id}`).toBe(4)
      const gabarito = chave(estrutura.nome)
      expect(chaves.filter((item) => item === gabarito)).toHaveLength(1)
      expect(new Set(questao.alternativas.map((alternativa) => alternativa.id)).size).toBe(4)
    }
  })

  it('é determinística: mesma questão, mesma ordem e mesmo gabarito', () => {
    for (const { estudo, estrutura, questao } of todas.slice(0, 40)) {
      expect(montarQuestao(estudo, estrutura)).toEqual(questao)
    }
  })

  it('prefere como distrator a estrutura que a tabela curada diz que se confunde', () => {
    const comPar = todas.filter(({ estrutura }) =>
      paresConfundiveis(estrutura.nome).some((nome) => NOMES_DO_ACERVO.has(nome)),
    )
    expect(comPar.length).toBeGreaterThan(60)
    for (const { estrutura, questao } of comPar) {
      const pares = paresConfundiveis(estrutura.nome).map(chave)
      const oferecidas = questao.alternativas.map((alternativa) => chave(alternativa.nome))
      expect(
        oferecidas.some((nome) => pares.includes(nome)),
        `${questao.id} não ofereceu nenhum par curado`,
      ).toBe(true)
    }
  })

  it('mantém a maioria dos distratores dentro do mesmo filme', () => {
    let doProprioFilme = 0
    let total = 0
    for (const { estudo, questao } of todas) {
      const noFilme = new Set(estudo.estruturas.map((item) => chave(item.nome)))
      for (const [posicao, alternativa] of questao.alternativas.entries()) {
        if (posicao === questao.correta) continue
        total += 1
        if (noFilme.has(chave(alternativa.nome))) doProprioFilme += 1
      }
    }
    expect(doProprioFilme / total).toBeGreaterThan(0.6)
  })
})

describe('resposta comentada', () => {
  const questoes = ESTUDOS_RAIO_X.flatMap(questoesDoEstudo)

  it('entrega gabarito, dossiê e pérola da região em todas as questões', () => {
    for (const questao of questoes) {
      const { comentario } = questao
      expect(comentario.gabarito).toContain(questao.alternativas[questao.correta].nome)
      expect(comentario.gabarito).toContain(questao.alternativas[questao.correta].original)
      expect(comentario.oQueE.length, `resumo curto em ${questao.id}`).toBeGreaterThan(40)
      expect(comentario.comoIdentificar.length).toBeGreaterThan(40)
      expect(comentario.porQueImporta.length).toBeGreaterThan(40)
      expect(comentario.perola.length).toBeGreaterThan(40)
    }
  })

  it('explica cada alternativa errada, e só as erradas', () => {
    for (const questao of questoes) {
      const erradas = questao.alternativas
        .filter((_, posicao) => posicao !== questao.correta)
        .map((alternativa) => alternativa.nome)
      expect(questao.comentario.descartes).toHaveLength(3)
      expect(questao.comentario.descartes.map((descarte) => descarte.nome).sort()).toEqual(
        [...erradas].sort(),
      )
      for (const descarte of questao.comentario.descartes) {
        expect(descarte.texto.length, `descarte raso em ${questao.id}`).toBeGreaterThan(80)
      }
    }
  })

  it('usa o texto curado quando o par existe na tabela', () => {
    const questao = questoes.find((item) => item.id === 'shoulderAP:tuberculo-maior')
    expect(questao).toBeDefined()
    const descarte = questao!.comentario.descartes.find((item) => item.nome === 'Tubérculo menor')
    expect(descarte?.curado).toBe(true)
    expect(descarte?.texto).toContain('rotação')
  })

  it('herda o dossiê do atlas, sem texto paralelo', () => {
    const questao = montarQuestao(
      ESTUDOS_RAIO_X.find((estudo) => estudo.id === 'handAP')!,
      ESTUDOS_RAIO_X.find((estudo) => estudo.id === 'handAP')!.estruturas.find(
        (estrutura) => estrutura.nome === 'Escafoide',
      )!,
    )
    expect(questao.comentario.oQueE).toBe(NOTAS_ESTRUTURAS['Escafoide'].resumo)
    expect(questao.comentario.armadilha).toBe(NOTAS_ESTRUTURAS['Escafoide'].alerta)
  })

  it('anexa a medida de referência quando ela fala da estrutura marcada', () => {
    const traqueia = questoes.find((item) => item.id === 'thoraxMedia:traqueia')
    expect(traqueia?.comentario.medida?.rotulo).toBe('Traqueia')
  })
})

describe('catálogo de quizzes', () => {
  it('não deixa dois quizzes disputarem a mesma URL', () => {
    const slugs = QUIZZES_RAIO_X.map((quiz) => quiz.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('publica o simulado geral, as regiões com mais de uma incidência e as 28 incidências', () => {
    const porTipo = (tipo: string) => QUIZZES_RAIO_X.filter((quiz) => quiz.tipo === tipo)
    expect(porTipo('geral')).toHaveLength(1)
    expect(porTipo('estudo')).toHaveLength(ESTUDOS_RAIO_X.length)
    expect(porTipo('regiao')).toHaveLength(
      REGIOES_RAIO_X.filter((regiao) => regiao.totalEstudos > 1).length,
    )
    for (const quiz of QUIZZES_RAIO_X) {
      expect(quiz.capa).toMatch(/^\/img\/radiologia\/raio-x\/v1\//)
      expect(quiz.descricao.length).toBeGreaterThan(30)
      expect(quiz.total).toBeGreaterThan(1)
    }
  })

  it('resolve todos os slugs anunciados, e só eles', () => {
    for (const resumo of QUIZZES_RAIO_X) {
      const quiz = getQuizRaioX(resumo.slug)
      expect(quiz, resumo.slug).toBeDefined()
      expect(quiz!.questoes).toHaveLength(resumo.total)
    }
    expect(getQuizRaioX('nao-existe')).toBeUndefined()
  })

  it('cobre a região inteira no quiz de região', () => {
    for (const resumo of QUIZZES_RAIO_X.filter((quiz) => quiz.tipo === 'regiao')) {
      const esperado = estudosDaRegiao(resumo.regiao!).reduce(
        (total, estudo) => total + estudo.estruturas.length,
        0,
      )
      expect(getQuizRaioX(resumo.slug)!.questoes).toHaveLength(esperado)
    }
  })

  it('equilibra o simulado geral entre as regiões, sem repetir estrutura', () => {
    const geral = getQuizRaioX('geral')!
    expect(geral.questoes).toHaveLength(60)
    const nomes = geral.questoes.map((questao) => chave(questao.alternativas[questao.correta].nome))
    expect(new Set(nomes).size).toBe(nomes.length)
    const regioes = new Set(geral.questoes.map((questao) => questao.contexto.regiao))
    expect(regioes.size).toBe(REGIOES_RAIO_X.length)
    for (const regiao of REGIOES_RAIO_X) {
      const quantas = geral.questoes.filter((questao) => questao.contexto.regiao === regiao.id).length
      expect(quantas, `${regiao.titulo} ficou de fora do simulado`).toBeGreaterThan(0)
    }
  })

  it('liga cada incidência ao seu próprio quiz', () => {
    for (const estudo of ESTUDOS_RAIO_X) {
      const quiz = quizDoEstudo(estudo.id)
      expect(quiz?.total).toBe(estudo.estruturas.length)
      expect(quiz?.incidencia).toBe(estudo.incidencia)
    }
    expect(quizDoEstudo('torax')).toBeUndefined()
  })
})
