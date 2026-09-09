/**
 * A resposta comentada de uma questão, em texto.
 *
 * Saiu de `lib/pdf-generator.ts` porque o relatório do aluno precisa
 * exatamente da mesma montagem: ele lia só `question.explanation` e, nas provas
 * cujo comentário está por alternativa, entregava ao aluno uma caixa
 * "RESPOSTA COMENTADA" vazia. Um lugar só, e os dois documentos dizem a mesma
 * coisa.
 */

import type { Question } from '@/lib/types'

/**
 * A resposta comentada de UMA questão, montada com tudo o que a questão tem.
 *
 * ## Por que não bastava `explanation`
 *
 * O PDF "com gabarito comentado" lia só `question.explanation`. Só que boa
 * parte do acervo não guarda o comentário aí: as questões geradas com feedback
 * comentado (`app/api/exams/[id]/generate-questions`) e as sorteadas do Banco
 * de Questões (`app/api/banco/questoes/random`) escrevem em
 * `commentedFeedback.explanations` — um texto POR ALTERNATIVA, que é o mais
 * rico dos dois: diz por que cada erro é erro. A tela da prova sempre mostrou
 * esse campo; o gerador de PDF, não.
 *
 * O efeito era o pior possível para quem clicava: o arquivo saía, sem erro
 * nenhum, e vinha sem uma linha de comentário — indistinguível de "esta prova
 * não tem gabarito comentado". Daí o pedido de "não consigo gerar o PDF com
 * resposta comentada": ele gerava, e não comentava nada.
 *
 * A ordem é a mesma de `montarExplicacao` (lib/banco/importar-provas.ts), que
 * já resolvia isto na importação para o banco: a explicação avulsa primeiro, o
 * comentário por alternativa depois e, nas discursivas, os pontos-chave que a
 * correção usa. O `**` sai em negrito no PDF — `drawRichLine` o interpreta.
 */
export function montarRespostaComentada(questao: Question): string {
  const partes: string[] = []

  const avulsa = (questao.explanation || '').trim()
  if (avulsa) partes.push(avulsa)

  const porAlternativa = questao.commentedFeedback?.explanations
  if (porAlternativa && typeof porAlternativa === 'object') {
    // A letra certa vem do próprio feedback quando ele a declara; senão, do
    // gabarito da questão. Uma das duas quase sempre existe, e é ela que faz o
    // bloco de comentários dizer qual alternativa era a boa.
    const correta =
      questao.commentedFeedback?.correctAlternative ||
      (questao.alternatives || []).find((alternativa) => alternativa.isCorrect)?.letter
    const linhas = Object.entries(porAlternativa)
      .filter(([, texto]) => String(texto || '').trim().length > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letra, texto]) => {
        const marca = correta && letra === correta ? ' (correta)' : ''
        return `**${letra})${marca}** ${String(texto).trim()}`
      })
    if (linhas.length > 0) {
      partes.push(['**Comentário por alternativa**', ...linhas].join('\n'))
    }
  }

  // A discursiva não tem alternativa para destacar em verde: o que existe de
  // gabarito nela são os pontos-chave, e o cabeçalho já prometia "ver
  // gabarito/pontos-chave abaixo" sem que nada os escrevesse.
  const pontos = Array.isArray(questao.keyPoints) ? questao.keyPoints : []
  const pontosValidos = pontos.filter((ponto) => String(ponto?.description || '').trim().length > 0)
  if (pontosValidos.length > 0) {
    const linhas = pontosValidos.map((ponto) => {
      const peso = Number(ponto.weight)
      const rotuloDoPeso = Number.isFinite(peso) && peso > 0 ? ` (peso ${peso})` : ''
      return `- ${String(ponto.description).trim()}${rotuloDoPeso}`
    })
    partes.push(['**Pontos-chave esperados**', ...linhas].join('\n'))
  }

  return partes.join('\n\n')
}
