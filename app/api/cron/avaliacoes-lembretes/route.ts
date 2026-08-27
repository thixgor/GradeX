import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getDb } from '@/lib/mongodb'
import { isCronAuthorized } from '@/lib/cron-auth'
import { sendAvaliacaoLembreteEmail } from '@/lib/mail'
import { diasEntre, hojeBrasilia, relogioBrasilia, somarDias } from '@/lib/cronogramas/brasilia'
import { deveEnviarHoje, montarLembrete } from '@/lib/cronogramas/lembretes'
import {
  COLECAO_AVALIACOES,
  COLECAO_ENVIOS,
  COLECAO_PREFERENCIAS,
  garantirIndices,
  serializarAvaliacao,
} from '@/lib/cronogramas/avaliacoes-servidor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Disparo dos lembretes de avaliação.
 *
 * Roda de hora em hora e pergunta, para cada avaliação futura: hoje é um dos
 * dias configurados? Já passou do horário de envio (no relógio de Brasília)?
 * Quem, entre os alunos que acompanham essa seção e período, ligou o opt-in?
 *
 * Três travas contra o pior defeito possível aqui, que é virar spam:
 *
 * 1. **O opt-in manda.** Nenhum envio acontece sem `lembretesAtivos: true` na
 *    preferência do próprio aluno. Não há lista de "todos do período".
 * 2. **Um lembrete por avaliação por dia.** O índice único
 *    (avaliacaoId, userId, dia) é gravado ANTES do e-mail sair; se o cron
 *    rodar duas vezes na mesma hora, a segunda tentativa esbarra no índice e
 *    nada é enviado.
 * 3. **Teto por execução.** Uma janela em que muitas avaliações coincidem não
 *    vira uma rajada que a Hostinger derruba pela metade — o que sobra vai na
 *    hora seguinte, porque a condição de envio continua verdadeira até o fim
 *    do dia.
 */

/** Teto de e-mails por execução. Acima disso o SMTP começa a recusar. */
const MAX_ENVIOS_POR_EXECUCAO = 300

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agora = new Date()
  const { dia: hoje, minutos } = relogioBrasilia(agora)

  const db = await getDb()
  await garantirIndices(db)

  // Só avaliações publicadas, com lembrete ligado, que ainda não passaram — e
  // com data dentro da maior janela de antecedência possível.
  const candidatas = await db
    .collection(COLECAO_AVALIACOES)
    .find({
      publicada: { $ne: false },
      'lembrete.ativo': true,
      data: { $gte: hoje, $lte: somarDias(hoje, 120) },
    })
    .limit(500)
    .toArray()

  const relatorio = {
    hoje,
    avaliacoesConsideradas: candidatas.length,
    avaliacoesNoHorario: 0,
    enviados: 0,
    duplicadosEvitados: 0,
    falhas: 0,
    semDestinatario: 0,
  }

  for (const doc of candidatas) {
    if (relatorio.enviados >= MAX_ENVIOS_POR_EXECUCAO) break

    const avaliacao = serializarAvaliacao(doc)
    if (!deveEnviarHoje(avaliacao, hoje, minutos)) continue
    relatorio.avaliacoesNoHorario += 1

    // A audiência: quem acompanha essa seção e período E ligou o lembrete.
    const preferencias = await db
      .collection(COLECAO_PREFERENCIAS)
      .find({ secao: avaliacao.secao, periodo: avaliacao.periodo, lembretesAtivos: true })
      .limit(MAX_ENVIOS_POR_EXECUCAO)
      .toArray()

    if (preferencias.length === 0) {
      relatorio.semDestinatario += 1
      continue
    }

    const ids = preferencias
      .map(p => String(p.userId))
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id))

    const usuarios = await db
      .collection('users')
      .find({ _id: { $in: ids }, banned: { $ne: true } }, { projection: { name: 1, email: 1 } })
      .toArray()

    const diasRestantes = diasEntre(hoje, avaliacao.data)

    for (const usuario of usuarios) {
      if (relatorio.enviados >= MAX_ENVIOS_POR_EXECUCAO) break
      if (!usuario.email) continue

      const userId = String(usuario._id)

      // Reserva antes de enviar: o índice único é o que transforma "tentei
      // mandar" em "só mando uma vez", inclusive sob retry do provedor de cron.
      try {
        await db.collection(COLECAO_ENVIOS).insertOne({
          avaliacaoId: String(doc._id),
          userId,
          dia: hoje,
          diasRestantes,
          enviadoEm: agora,
          canal: 'email',
        })
      } catch {
        relatorio.duplicadosEvitados += 1
        continue
      }

      const texto = montarLembrete({
        avaliacao,
        nome: usuario.name || '',
        diasRestantes,
      })

      try {
        await sendAvaliacaoLembreteEmail({
          email: usuario.email,
          assunto: texto.assunto,
          titulo: texto.titulo,
          corpo: texto.corpo,
          cta: texto.cta,
        })
        relatorio.enviados += 1
      } catch {
        relatorio.falhas += 1
        // O e-mail falhou, então a reserva não vale: apagá-la deixa a próxima
        // execução tentar de novo dentro do mesmo dia.
        await db
          .collection(COLECAO_ENVIOS)
          .deleteOne({ avaliacaoId: String(doc._id), userId, dia: hoje })
          .catch(() => {})
        continue
      }

      // Notificação dentro do site: quem não abre e-mail ainda encontra o
      // aviso no sininho ao entrar para estudar.
      await db
        .collection('notifications')
        .insertOne({
          userId,
          type: 'avaliacao_lembrete',
          message: texto.resumo,
          read: false,
          createdAt: agora,
        })
        .catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, ...relatorio })
}
