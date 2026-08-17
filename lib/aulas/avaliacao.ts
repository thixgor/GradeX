/**
 * Avaliação da aula (§39).
 *
 * A aula aponta para uma prova que já existe no sistema de provas — banco de
 * questões, correção, tempo, proctoring — em vez de a plataforma ganhar um
 * segundo motor de quiz. É a mesma decisão do vínculo com /materiais (§6): a
 * aula referencia, não copia. Duas cópias da mesma questão divergem no primeiro
 * conserto de gabarito, e é o aluno que descobre.
 *
 * Este arquivo não importa `mongodb`: ele é lido pelo editor e pela página da
 * aula, que rodam no navegador. A validação do id é a mesma checagem de 24
 * hexadecimais que `ObjectId.isValid` faz para uma string desse tamanho.
 */

export interface AvaliacaoDaAula {
  examId: string
  titulo?: string
  obrigatoria?: boolean
}

const ID_VALIDO = /^[0-9a-fA-F]{24}$/

/**
 * Põe o campo num formato único, venha de onde vier.
 *
 * Um id inválido vira `null` em vez de erro: o campo é opcional, e uma aula que
 * se recusa a salvar porque a prova apontada foi apagada é pior do que uma aula
 * sem avaliação.
 */
export function normalizarAvaliacao(bruto: unknown): AvaliacaoDaAula | null {
  if (!bruto || typeof bruto !== 'object') return null
  const dado = bruto as Record<string, unknown>
  const examId = String(dado.examId || '').trim()
  if (!ID_VALIDO.test(examId)) return null

  const titulo = String(dado.titulo || '').trim().slice(0, 160)
  return {
    examId,
    titulo,
    // Fica em falso por padrão. Uma trava ligada sem querer prende o aluno no
    // meio do curso, e ele não tem como saber que foi engano.
    obrigatoria: dado.obrigatoria === true,
  }
}

/**
 * A avaliação impede marcar a aula como concluída?
 *
 * Só quando o admin pediu explicitamente. Enquanto isso, a prova é um convite:
 * aparece na aula, não bloqueia nada.
 */
export function exigeAvaliacao(avaliacao: AvaliacaoDaAula | null | undefined): boolean {
  return !!avaliacao?.examId && avaliacao.obrigatoria === true
}

/**
 * O que dizer a quem tentou concluir sem fazer a prova.
 *
 * Nomeia a prova quando ela tem título: "faça a avaliação" manda procurar;
 * "faça Prova de Cardiologia I" diz onde clicar.
 */
export function motivoDoBloqueio(avaliacao: AvaliacaoDaAula | null | undefined): string {
  const nome = avaliacao?.titulo?.trim()
  return nome
    ? `Conclua a avaliação "${nome}" para marcar esta aula como concluída.`
    : 'Conclua a avaliação desta aula para marcá-la como concluída.'
}

/**
 * A frase que descreve a avaliação na página da aula.
 *
 * Separada da tela porque o texto muda com o estado — obrigatória, já feita,
 * apenas sugerida — e essas três frases precisam concordar entre si.
 */
export function descreverAvaliacao(
  avaliacao: AvaliacaoDaAula | null | undefined,
  feita: boolean,
): string {
  if (feita) return 'Você já fez esta avaliação. Pode refazer quando quiser.'
  return exigeAvaliacao(avaliacao)
    ? 'Necessária para concluir a aula.'
    : 'Teste o que você acabou de ver.'
}
