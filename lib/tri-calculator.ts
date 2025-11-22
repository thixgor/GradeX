import { Question, UserAnswer, TRIResult } from './types'

/**
 * Calcula a probabilidade de acerto usando o modelo TRI de 3 parâmetros
 * P(θ) = c + (1 - c) / (1 + e^(-a(θ - b)))
 *
 * @param theta - Habilidade do aluno
 * @param a - Discriminação (capacidade de diferenciar alunos)
 * @param b - Dificuldade da questão
 * @param c - Probabilidade de acerto ao acaso
 */
export function calculateProbability(theta: number, a: number, b: number, c: number): number {
  const exponent = -a * (theta - b)
  const probability = c + (1 - c) / (1 + Math.exp(exponent))
  return probability
}

/**
 * Calcula a informação de Fisher para uma questão
 * Usada para estimar a precisão da medida de habilidade
 */
function calculateFisherInformation(theta: number, a: number, b: number, c: number): number {
  const p = calculateProbability(theta, a, b, c)
  const q = 1 - p
  const pPrime = a * (p - c) * q / (1 - c)
  return (pPrime * pPrime) / (p * q)
}

/**
 * Calcula o log-likelihood de uma resposta dada a habilidade theta
 */
function calculateLogLikelihood(
  theta: number,
  questions: Question[],
  answers: UserAnswer[]
): number {
  let logLikelihood = 0

  for (const answer of answers) {
    const question = questions.find(q => q.id === answer.questionId)
    if (!question) continue

    const a = question.triDiscrimination || 1
    const b = question.triDifficulty || 0
    const c = question.triGuessing || 0.2

    const correctAlternative = question.alternatives.find(alt => alt.isCorrect)
    const isCorrect = answer.selectedAlternative === correctAlternative?.id

    const p = calculateProbability(theta, a, b, c)
    logLikelihood += isCorrect ? Math.log(p) : Math.log(1 - p)
  }

  return logLikelihood
}

/**
 * Calcula a derivada do log-likelihood
 */
function calculateLogLikelihoodDerivative(
  theta: number,
  questions: Question[],
  answers: UserAnswer[]
): number {
  let derivative = 0

  for (const answer of answers) {
    const question = questions.find(q => q.id === answer.questionId)
    if (!question) continue

    const a = question.triDiscrimination || 1
    const b = question.triDifficulty || 0
    const c = question.triGuessing || 0.2

    const correctAlternative = question.alternatives.find(alt => alt.isCorrect)
    const isCorrect = answer.selectedAlternative === correctAlternative?.id

    const p = calculateProbability(theta, a, b, c)
    const pPrime = a * (p - c) * (1 - p) / (1 - c)

    derivative += isCorrect ? pPrime / p : -pPrime / (1 - p)
  }

  return derivative
}

/**
 * Estima a habilidade theta usando o método de Newton-Raphson
 * @param questions - Questões da prova
 * @param answers - Respostas do aluno
 * @param maxIterations - Número máximo de iterações
 * @param tolerance - Tolerância para convergência
 */
export function estimateTheta(
  questions: Question[],
  answers: UserAnswer[],
  maxIterations: number = 50,
  tolerance: number = 0.001
): number {
  let theta = 0 // Começa com habilidade média

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const derivative = calculateLogLikelihoodDerivative(theta, questions, answers)

    // Calcula a segunda derivada (informação de Fisher total)
    let information = 0
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId)
      if (!question) continue

      const a = question.triDiscrimination || 1
      const b = question.triDifficulty || 0
      const c = question.triGuessing || 0.2

      information += calculateFisherInformation(theta, a, b, c)
    }

    if (information === 0) break

    // Atualização de Newton-Raphson
    const thetaNew = theta + derivative / information

    // Verifica convergência
    if (Math.abs(thetaNew - theta) < tolerance) {
      theta = thetaNew
      break
    }

    theta = thetaNew

    // Limita theta a um intervalo razoável (-4 a 4)
    theta = Math.max(-4, Math.min(4, theta))
  }

  return theta
}

/**
 * Converte theta para escala de 0 a 1000 (padrão ENEM)
 * Theta varia tipicamente de -3 a +3, sendo 0 a média
 */
export function thetaToScale(theta: number): number {
  // Normaliza theta de [-3, 3] para [0, 1000]
  // ENEM usa média 500 e desvio padrão de ~100
  const score = 500 + (theta * 100)
  return Math.round(Math.max(0, Math.min(1000, score)))
}

/**
 * Calcula os scores TRI para todos os usuários que fizeram a prova
 * @param questions - Questões da prova
 * @param submissions - Submissões dos usuários
 */
export function calculateTRIScores(
  questions: Question[],
  submissions: Array<{ userId: string; userName: string; answers: UserAnswer[] }>
): TRIResult[] {
  const results: TRIResult[] = []

  for (const submission of submissions) {
    const theta = estimateTheta(questions, submission.answers)
    const triScore = thetaToScale(theta)

    results.push({
      userId: submission.userId,
      userName: submission.userName,
      triScore
    })
  }

  // Ordena por nome alfabeticamente
  results.sort((a, b) => a.userName.localeCompare(b.userName, 'pt-BR'))

  return results
}

/**
 * Gera parâmetros TRI aleatórios mas coerentes para uma questão
 */
export function generateRandomTRIParameters(numberOfAlternatives: number): {
  a: number
  b: number
  c: number
} {
  // Parâmetro 'a' (discriminação): tipicamente entre 0.5 e 2.5
  // Valores mais altos = questão mais discriminativa
  const a = Math.random() * 2 + 0.5 // Entre 0.5 e 2.5

  // Parâmetro 'b' (dificuldade): tipicamente entre -3 e +3
  // Valores mais altos = questão mais difícil
  const b = (Math.random() * 6) - 3 // Entre -3 e +3

  // Parâmetro 'c' (acerto ao acaso): 1 / número de alternativas
  const c = 1 / numberOfAlternatives

  return {
    a: Math.round(a * 100) / 100, // 2 casas decimais
    b: Math.round(b * 100) / 100,
    c: Math.round(c * 100) / 100
  }
}
