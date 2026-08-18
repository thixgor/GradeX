import { Db, ObjectId } from 'mongodb'
import type { DadosDaQuestao } from '@/lib/banco/questao-admin'

/**
 * Conferir, no banco, que o lugar escolhido para a questão existe e encaixa.
 *
 * Criar e editar faziam checagens diferentes: o POST via se módulo e tópico
 * existiam; o PUT não via nada. Nenhum dos dois conferia se o tópico era
 * DAQUELE módulo — e um tópico de outro módulo põe a questão num galho que a
 * árvore não desenha: ela some do filtro por módulo sem nunca ter dado erro.
 *
 * Fica fora de `questao-admin.ts` porque depende do banco; aquele arquivo é
 * puro para poder ser testado sem subir nada.
 */

export interface HierarquiaConfirmada {
  moduloNome: string
  topicoNome: string
  subtopicoNome: string | null
}

export type ConferenciaDaHierarquia =
  | ({ ok: true } & HierarquiaConfirmada)
  | { ok: false; erro: string; campo: string; status: 400 | 404 }

export async function conferirHierarquia(
  db: Db,
  questao: Pick<DadosDaQuestao, 'moduloId' | 'topicoId' | 'subtopicoId'>,
): Promise<ConferenciaDaHierarquia> {
  const [modulo, topico] = await Promise.all([
    db.collection('banco_modulos').findOne({ _id: new ObjectId(questao.moduloId) }),
    db.collection('banco_topicos').findOne({ _id: new ObjectId(questao.topicoId) }),
  ])

  if (!modulo) {
    return { ok: false, erro: 'Módulo não encontrado', campo: 'moduloId', status: 404 }
  }
  if (!topico) {
    return { ok: false, erro: 'Tópico não encontrado', campo: 'topicoId', status: 404 }
  }
  if (String(topico.moduloId) !== questao.moduloId) {
    return {
      ok: false,
      erro: `O tópico "${topico.nome}" não é do módulo "${modulo.nome}"`,
      campo: 'topicoId',
      status: 400,
    }
  }

  let subtopicoNome: string | null = null
  if (questao.subtopicoId) {
    const subtopico = await db
      .collection('banco_subtopicos')
      .findOne({ _id: new ObjectId(questao.subtopicoId) })
    if (!subtopico) {
      return { ok: false, erro: 'Subtópico não encontrado', campo: 'subtopicoId', status: 404 }
    }
    if (String(subtopico.topicoId) !== questao.topicoId) {
      return {
        ok: false,
        erro: `O subtópico "${subtopico.nome}" não é do tópico "${topico.nome}"`,
        campo: 'subtopicoId',
        status: 400,
      }
    }
    subtopicoNome = subtopico.nome
  }

  return { ok: true, moduloNome: modulo.nome, topicoNome: topico.nome, subtopicoNome }
}
