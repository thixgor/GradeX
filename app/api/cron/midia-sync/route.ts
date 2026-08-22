/**
 * Rotina noturna que mantém o acervo de imagens dentro de casa.
 *
 * Percorre um pedaço do banco por execução, encontra imagens que ainda apontam
 * para hosts de terceiros — Imgur na maioria das vezes — e as traz para o nosso
 * armazenamento, trocando a URL pelo caminho interno. Ver
 * `lib/midia/varredura-incremental.ts` para o mecanismo e o porquê de ser
 * incremental.
 *
 * Existe porque o site tem dezenas de telas que gravam URL de imagem, e pendurar
 * um gancho em cada uma seria garantir que a próxima nasce sem. Reexaminar o
 * acervo cobre inclusive as telas que ainda não foram escritas.
 *
 * Autenticação pelo `lib/cron-auth.ts` — o mesmo esquema das outras rotinas.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { isCronAuthorized } from '@/lib/cron-auth'
import { varrerUmPouco } from '@/lib/midia/varredura-incremental'
import { garantirIndicesDeMidia } from '@/lib/midia/deposito'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * 240s de trabalho num teto de 300s: a margem cobre o encerramento do cursor, a
 * gravação do estado e a resposta. Estourar o limite mataria a função **antes**
 * de gravar onde a varredura parou, e a execução seguinte repetiria o mesmo
 * trecho para sempre.
 */
const ORCAMENTO_MS = 240_000

/**
 * Teto de imagens novas por execução. Baixar e reenviar é a parte cara, e o
 * acervo pendente é finito: melhor cobrir todo dia um pouco do que estourar o
 * tempo tentando resolver tudo numa noite.
 */
const MAX_IMAGENS = 120

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN_MIDIA
  if (!token) {
    // Sem credencial de escrita do store PÚBLICO de imagens não há para onde
    // levar as imagens — este não é o `BLOB_READ_WRITE_TOKEN` genérico, que
    // aponta para o store privado dos PDFs de materiais. Responder 200 é
    // deliberado: é uma rotina desligada, não uma rotina quebrada, e não deve
    // encher o painel de alertas de cron falhando.
    return NextResponse.json({ ok: true, pulado: 'BLOB_READ_WRITE_TOKEN_MIDIA ausente' })
  }

  try {
    const db = await getDb()
    await garantirIndicesDeMidia(db)

    const resumo = await varrerUmPouco(db, {
      orcamentoMs: ORCAMENTO_MS,
      maxImagens: MAX_IMAGENS,
      token,
    })

    console.log(
      `[midia-sync] ${resumo.documentosLidos} docs lidos, ${resumo.documentosAtualizados} atualizados, ` +
        `${resumo.imagensNovas} imagens novas, ${resumo.falhas} falhas, ` +
        `parou em "${resumo.colecaoFinal}" por ${resumo.encerradaPor} (${resumo.duracaoMs}ms)`,
    )

    return NextResponse.json({ ok: true, ...resumo })
  } catch (erro) {
    console.error('[midia-sync] falha:', erro)
    return NextResponse.json(
      { error: erro instanceof Error ? erro.message : 'Erro desconhecido' },
      { status: 500 },
    )
  }
}
