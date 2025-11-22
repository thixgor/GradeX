import { Question, Alternative } from './types'
import { v4 as uuidv4 } from 'uuid'

export function parseTxtFile(content: string, numberOfAlternatives: number): Question[] {
  const questions: Question[] = []
  const questionBlocks = content.split(/--Q\d+/).filter(block => block.trim())

  const letters = ['A', 'B', 'C', 'D', 'E']

  questionBlocks.forEach((block, index) => {
    const lines = block.split('\n').map(line => line.trim()).filter(line => line)

    const data: any = {}

    lines.forEach(line => {
      const match = line.match(/^([A-Z-]+):"(.*)"/i)
      if (match) {
        const key = match[1].toUpperCase()
        const value = match[2]
        data[key] = value
      }
    })

    // Cria as alternativas
    const alternatives: Alternative[] = []
    for (let i = 0; i < numberOfAlternatives; i++) {
      const letter = letters[i]
      const altKey = `ALT-${letter}`
      const text = data[altKey] || ''

      alternatives.push({
        id: uuidv4(),
        letter,
        text,
        isCorrect: data['ALT-CORRETA'] === letter
      })
    }

    // Cria a questão
    const question: Question = {
      id: uuidv4(),
      number: index + 1,
      statement: data['ENUNCIADO'] || '',
      statementSource: data['FONTE-ENUNCIADO'] || undefined,
      imageUrl: data['URL-IMAGEM-QUESTAO'] || undefined,
      imageSource: undefined,
      command: data['COMANDO-QUESTÃO'] || data['COMANDO-QUESTAO'] || '',
      alternatives,
      triDiscrimination: data['DISCRIMINACAO-QUESTAO-PARAMETROA-TRI']
        ? parseFloat(data['DISCRIMINACAO-QUESTAO-PARAMETROA-TRI'])
        : undefined,
      triDifficulty: data['DIFICULDADE-QUESTAO-PARAMETROB-TRI']
        ? parseFloat(data['DIFICULDADE-QUESTAO-PARAMETROB-TRI'])
        : undefined,
      triGuessing: data['ACERTOAOACASO-QUESTAO-PARAMETROC-TRI']
        ? parseFloat(data['ACERTOAOACASO-QUESTAO-PARAMETROC-TRI'])
        : undefined,
    }

    questions.push(question)
  })

  return questions
}

export function generateTxtTemplate(numberOfQuestions: number, numberOfAlternatives: number): string {
  const letters = ['A', 'B', 'C', 'D', 'E']
  let template = ''

  for (let i = 1; i <= numberOfQuestions; i++) {
    template += `--Q${i}\n`
    template += `ENUNCIADO:"**ENUNCIADO DA QUESTÃO ${i}**"\n`
    template += `FONTE-ENUNCIADO:"**FONTE DO ENUNCIADO (opcional)**"\n`
    template += `URL-IMAGEM-QUESTAO:"**URL DA IMAGEM (opcional)**"\n`
    template += `COMANDO-QUESTÃO:"**COMANDO DA QUESTÃO**"\n`

    for (let j = 0; j < numberOfAlternatives; j++) {
      const letter = letters[j]
      template += `ALT-${letter}:"**TEXTO DA ALTERNATIVA ${letter}**"\n`
    }

    template += `ALT-CORRETA:"A"\n`
    template += `DISCRIMINACAO-QUESTAO-PARAMETROA-TRI:"1.0"\n`
    template += `DIFICULDADE-QUESTAO-PARAMETROB-TRI:"0.0"\n`
    template += `ACERTOAOACASO-QUESTAO-PARAMETROC-TRI:"${(1 / numberOfAlternatives).toFixed(2)}"\n`

    if (i < numberOfQuestions) {
      template += '\n'
    }
  }

  return template
}
