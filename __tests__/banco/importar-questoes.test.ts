import { describe, it, expect } from 'vitest'
import { lerArquivoDeImportacao, TOPICO_PADRAO } from '@/lib/banco/importar-questoes'

const OBJETIVA = `[OBJETIVA]
MÓDULO: Cardiologia
TÓPICO: Arritmias
ENUNCIADO: Qual estrutura comanda o ritmo cardíaco?
A) Nó sinoatrial
B) Nó atrioventricular
CORRETA: A`

const DISCURSIVA = `[DISCURSIVA]
MÓDULO: Clínica Médica
TÓPICO: Semiologia
ENUNCIADO: Descreva a ausculta da estenose mitral.
RESPOSTA: Ruflar diastólico em foco mitral.`

describe('corte dos blocos', () => {
  it('não inventa blocos na fronteira entre duas questões', () => {
    // O bug: `split` devolvia o grupo de captura do lookahead como se fosse um
    // pedaço do arquivo, e cada fronteira virava um erro "tipo não
    // especificado" numa importação que tinha dado certo.
    const { questoes, erros } = lerArquivoDeImportacao(`${OBJETIVA}\n\n${DISCURSIVA}\n`)

    expect(erros).toEqual([])
    expect(questoes).toHaveLength(2)
    expect(questoes[0].tipo).toBe('objetiva')
    expect(questoes[1].tipo).toBe('discursiva')
  })

  it('aceita questões coladas, sem linha em branco entre elas', () => {
    const { questoes, erros } = lerArquivoDeImportacao(`${OBJETIVA}\n${DISCURSIVA}`)

    expect(erros).toEqual([])
    expect(questoes).toHaveLength(2)
  })

  it('lê arquivo salvo com quebra de linha do Windows', () => {
    const { questoes, erros } = lerArquivoDeImportacao(`${OBJETIVA}\n\n${DISCURSIVA}`.replace(/\n/g, '\r\n'))

    expect(erros).toEqual([])
    expect(questoes).toHaveLength(2)
  })

  it('não trata travessão dentro do texto como separador', () => {
    const { questoes, erros } = lerArquivoDeImportacao(
      `[OBJETIVA]
MÓDULO: Cardiologia
TÓPICO: Arritmias
ENUNCIADO: A pressão --- medida no consultório --- estava alta.
A) Sim
B) Não
CORRETA: B`,
    )

    expect(erros).toEqual([])
    expect(questoes[0].enunciado).toContain('---')
  })

  it('continua cortando no separador legado de linha inteira', () => {
    const { questoes, erros } = lerArquivoDeImportacao(`${OBJETIVA}\n---\n${DISCURSIVA}`)

    expect(erros).toEqual([])
    expect(questoes).toHaveLength(2)
  })

  it('dá o número da linha de verdade no erro', () => {
    const arquivo = `${OBJETIVA}\n\n[OBJETIVA]\nMÓDULO: Cardiologia\nENUNCIADO: Sem alternativa nenhuma.`
    const { erros } = lerArquivoDeImportacao(arquivo)

    expect(erros).toHaveLength(1)
    expect(erros[0].linha).toBe(9)
  })
})

describe('rótulos', () => {
  it('aceita sem acento, em minúscula e com espaço antes dos dois pontos', () => {
    const { questoes, erros } = lerArquivoDeImportacao(
      `[OBJETIVA]
modulo : Cardiologia
Topico: Arritmias
enunciado: Qual estrutura comanda o ritmo?
A) Nó sinoatrial
B) Nó AV
gabarito: letra A`,
    )

    expect(erros).toEqual([])
    expect(questoes[0].modulo).toBe('Cardiologia')
    expect(questoes[0].topico).toBe('Arritmias')
    expect(questoes[0].correta).toBe('A')
  })

  it('não confunde dois pontos do texto com rótulo', () => {
    const { questoes } = lerArquivoDeImportacao(
      `[OBJETIVA]
MÓDULO: Cardiologia
TÓPICO: Arritmias
ENUNCIADO: Caso clínico
Paciente: homem de 45 anos, tabagista.
A) Sim
B) Não
CORRETA: A`,
    )

    expect(questoes[0].enunciado).toBe('Caso clínico\nPaciente: homem de 45 anos, tabagista.')
  })

  it('lê TIPO: no lugar do marcador quando há marcador em outra questão', () => {
    const { questoes, erros } = lerArquivoDeImportacao(
      `${OBJETIVA}

---
TIPO: discursiva
MÓDULO: Clínica Médica
TÓPICO: Semiologia
ENUNCIADO: Descreva a ausculta.
RESPOSTA: Ruflar diastólico.`,
    )

    expect(erros).toEqual([])
    expect(questoes[1].tipo).toBe('discursiva')
  })

  it('ignora PERÍODO sem reclamar', () => {
    const { questoes, erros, avisos } = lerArquivoDeImportacao(
      `[OBJETIVA]
PERÍODO: SOI I
MÓDULO: Cardiologia
TÓPICO: Arritmias
ENUNCIADO: Pergunta.
A) Sim
B) Não
CORRETA: A`,
    )

    expect(erros).toEqual([])
    expect(avisos).toEqual([])
    expect(questoes).toHaveLength(1)
  })
})

describe('alternativas', () => {
  it('aceita as formas A), a., (A) e A -', () => {
    const { questoes, erros } = lerArquivoDeImportacao(
      `[OBJETIVA]
MÓDULO: Cardiologia
TÓPICO: Arritmias
ENUNCIADO: Pergunta.
A) Primeira
b. Segunda
(C) Terceira
D - Quarta
CORRETA: C`,
    )

    expect(erros).toEqual([])
    expect(questoes[0].alternativas?.map((a) => a.letra)).toEqual(['A', 'B', 'C', 'D'])
    expect(questoes[0].alternativas?.[3].texto).toBe('Quarta')
  })

  it('junta alternativa que ocupa mais de uma linha', () => {
    const { questoes } = lerArquivoDeImportacao(
      `[OBJETIVA]
MÓDULO: Cardiologia
TÓPICO: Arritmias
ENUNCIADO: Pergunta.
A) Primeira parte
continuação da primeira
B) Segunda
CORRETA: A`,
    )

    expect(questoes[0].alternativas?.[0].texto).toBe('Primeira parte\ncontinuação da primeira')
  })

  it('recusa gabarito que aponta para alternativa inexistente', () => {
    const { questoes, erros } = lerArquivoDeImportacao(
      `[OBJETIVA]
MÓDULO: Cardiologia
TÓPICO: Arritmias
ENUNCIADO: Pergunta.
A) Primeira
B) Segunda
CORRETA: E`,
    )

    expect(questoes).toHaveLength(0)
    expect(erros[0].mensagem).toContain('só tem as alternativas A, B')
  })

  it('recusa letra repetida', () => {
    const { erros } = lerArquivoDeImportacao(
      `[OBJETIVA]
MÓDULO: Cardiologia
TÓPICO: Arritmias
ENUNCIADO: Pergunta.
A) Primeira
A) Outra primeira
CORRETA: A`,
    )

    expect(erros[0].mensagem).toContain('duas vezes')
  })

  it('liga IMAGEM A à alternativa A', () => {
    const { questoes } = lerArquivoDeImportacao(
      `[OBJETIVA]
MÓDULO: Cardiologia
TÓPICO: Arritmias
ENUNCIADO: Pergunta.
A) Primeira
IMAGEM A: https://i.imgur.com/a.png
B) Segunda
CORRETA: A`,
    )

    expect(questoes[0].alternativas?.[0].imagemUrl).toBe('https://i.imgur.com/a.png')
  })
})

describe('campos de várias linhas', () => {
  it('mantém parágrafo no enunciado e converte \\n escrito no arquivo', () => {
    const { questoes } = lerArquivoDeImportacao(
      `[OBJETIVA]
MÓDULO: Cardiologia
TÓPICO: Arritmias
ENUNCIADO: Primeiro parágrafo.\\nMesma linha, quebra escrita.

Segundo parágrafo.
A) Sim
B) Não
CORRETA: A`,
    )

    expect(questoes[0].enunciado).toBe(
      'Primeiro parágrafo.\nMesma linha, quebra escrita.\n\nSegundo parágrafo.',
    )
  })
})

describe('validação', () => {
  it('manda a questão sem tópico para o tópico padrão, com aviso', () => {
    const { questoes, erros, avisos } = lerArquivoDeImportacao(
      `[OBJETIVA]
MÓDULO: Cardiologia
ENUNCIADO: Pergunta.
A) Sim
B) Não
CORRETA: A`,
    )

    expect(erros).toEqual([])
    expect(questoes[0].topico).toBe(TOPICO_PADRAO)
    expect(avisos[0].mensagem).toContain(TOPICO_PADRAO)
  })

  it('recusa questão sem módulo', () => {
    const { questoes, erros } = lerArquivoDeImportacao(
      `[OBJETIVA]
TÓPICO: Arritmias
ENUNCIADO: Pergunta.
A) Sim
B) Não
CORRETA: A`,
    )

    expect(questoes).toHaveLength(0)
    expect(erros[0].mensagem).toContain('sem MÓDULO')
  })

  it('recusa discursiva sem resposta modelo', () => {
    const { erros } = lerArquivoDeImportacao(
      `[DISCURSIVA]
MÓDULO: Clínica Médica
TÓPICO: Semiologia
ENUNCIADO: Descreva.`,
    )

    expect(erros[0].mensagem).toContain('sem RESPOSTA')
  })

  it('explica o arquivo inteiro sem marcador em vez de reclamar de tipo', () => {
    const { erros } = lerArquivoDeImportacao(
      `MÓDULO: Cardiologia
TÓPICO: Arritmias
ENUNCIADO: Pergunta.
A) Sim
B) Não
CORRETA: A`,
    )

    expect(erros).toHaveLength(1)
    expect(erros[0].mensagem).toContain('[OBJETIVA]')
  })

  it('ignora cabeçalho antes da primeira questão com aviso, não com erro', () => {
    const { questoes, erros, avisos } = lerArquivoDeImportacao(
      `Questões da prova de 2024\n\n${OBJETIVA}`,
    )

    expect(erros).toEqual([])
    expect(questoes).toHaveLength(1)
    expect(avisos[0].mensagem).toContain('Questões da prova de 2024')
  })

  it('importa a questão repetida no arquivo uma vez só', () => {
    const { questoes, avisos } = lerArquivoDeImportacao(`${OBJETIVA}\n\n${OBJETIVA}`)

    expect(questoes).toHaveLength(1)
    expect(avisos[0].mensagem).toContain('repetida')
  })

  it('lê metadados opcionais', () => {
    const { questoes } = lerArquivoDeImportacao(
      `[OBJETIVA]
MÓDULO: Cardiologia
TÓPICO: Arritmias
ENUNCIADO: Pergunta.
IMAGEM: https://i.imgur.com/x.png
A) Sim
B) Não
CORRETA: A
EXPLICAÇÃO: Porque sim.
DIFICULDADE: Média
TAGS: ecg, ritmo
FONTE: Prova 2023
ANO: 2023
SEMESTRE: 2`,
    )

    expect(questoes[0]).toMatchObject({
      imagemUrl: 'https://i.imgur.com/x.png',
      explicacao: 'Porque sim.',
      dificuldade: 'medio',
      tags: ['ecg', 'ritmo'],
      fonte: 'Prova 2023',
      ano: 2023,
      semestre: 2,
    })
  })
})
