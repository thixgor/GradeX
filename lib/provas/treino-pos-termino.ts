import type { Exam } from '@/lib/types'
import { eProvaSemJanela } from './janela-da-prova'
import { provaJaEncerrou } from './downloads-da-prova'

/**
 * Refazer a prova como treino, depois que ela termina.
 *
 * ## O que não existia
 *
 * Uma prova avaliativa tem exatamente um fim: o aluno entrega, o relógio corre,
 * a prova encerra — e o endereço dela vira uma tela de aviso. Dali em diante o
 * caderno só existe em PDF: para refazer as questões, era imprimir (quando o
 * admin liberasse o arquivo) ou reler o gabarito comentado numa aba. A prova
 * que a turma acabou de fazer, com as questões que caíram, era justamente a que
 * ninguém podia repetir na plataforma.
 *
 * Isto liga esse segundo tempo. Terminada a prova, e só se o admin marcar, o
 * mesmo endereço passa a oferecer "Praticar": a prova roda de novo, com a tela
 * de treino (feedback imediato ou no fim, embaralhamento, tempo livre), quantas
 * vezes a pessoa quiser.
 *
 * ## O que ele não pode fazer
 *
 * **Encostar no resultado.** A rodada de treino não é uma entrega: não vai para
 * a coleção de submissões, não muda nota, não entra no ranking e não aparece no
 * relatório do admin. A prova aplicada é um fato histórico com hora marcada, e
 * uma segunda tentativa três dias depois — com o gabarito já publicado — não é
 * comparável a ela de nenhum ângulo.
 *
 * A garantia disso não mora só na tela, e vale dizer exatamente qual ela é —
 * porque a regra do servidor mudou depois que este módulo nasceu.
 *
 * `POST /api/exams/[id]/submit` já recusou toda entrega depois do término.
 * Hoje não: `avaliarEntrega` (ver `lib/provas/entrega-da-prova.ts`) aceita a
 * entrega atrasada em duas camadas — a folga de transporte de um minuto e meio
 * e, passada ela, a entrega valendo o RASCUNHO. Então "o servidor recusa" não
 * é mais a frase certa.
 *
 * A frase certa é mais forte, e é a que importa: **as respostas de uma rodada
 * de treino não têm como virar nota**. Uma prova encerrada há horas cai
 * necessariamente na camada do rascunho, e ali o servidor descarta o corpo da
 * requisição e grava o que ELE tinha gravado enquanto a prova estava aberta. O
 * treino não escreve rascunho nenhum — a tela não grava progresso, e
 * `PUT /api/exams/[id]/progress` recusa com a janela fechada —, então não
 * existe caminho, nem por `fetch`, em que o que a pessoa respondeu treinando
 * alcance a submissão, o ranking ou o relatório.
 *
 * O que o servidor sozinho NÃO impede é a entrega atrasada de um rascunho
 * VELHO, de uma tentativa real abandonada. Isso é a outra funcionalidade
 * fazendo o trabalho dela, não um vazamento do treino — mas não pode partir
 * desta tela, e por isso a entrega automática do rascunho sem retomadas é
 * barrada explicitamente no modo treino.
 *
 * ## Por que é uma escolha do admin, e não sempre
 *
 * Porque a mesma prova pode ser reaplicada — turma de segunda chamada, outro
 * período, o mesmo caderno no semestre seguinte. Deixar o treino ligado por
 * padrão publicaria o caderno resolvido para quem ainda vai fazê-lo. Nasce
 * desligado, como `freeDownloads`.
 */

/** A prova de treino/pessoal já é livre por natureza: isto não é sobre elas. */
export function provaAceitaTreinoPosTermino(prova: Partial<Exam> | null | undefined): boolean {
  if (!prova) return false
  if (eProvaSemJanela(prova)) return false
  return (prova as Partial<Exam>).practiceAfterEnd === true
}

/**
 * O treino está liberado AGORA?
 *
 * Duas condições, e as duas são necessárias: o admin marcou, e a prova já
 * acabou para todo mundo. A segunda é a que não tem exceção — liberar o treino
 * enquanto a turma responde é publicar o gabarito com outro nome, já que o
 * modo treino corrige na hora.
 */
export function permiteTreinoAposTermino(
  prova: Partial<Exam> | null | undefined,
  agora: Date = new Date(),
): boolean {
  if (!provaAceitaTreinoPosTermino(prova)) return false
  return provaJaEncerrou(prova, agora)
}

/** O parâmetro de endereço que entra no modo treino: `/exam/<id>?treino=1`. */
export const PARAMETRO_DE_TREINO = 'treino'

export function pediuTreino(parametros: URLSearchParams | null | undefined): boolean {
  const valor = parametros?.get(PARAMETRO_DE_TREINO)
  return valor === '1' || valor === 'true'
}

export function enderecoDoTreino(examId: string): string {
  return `/exam/${examId}?${PARAMETRO_DE_TREINO}=1`
}
