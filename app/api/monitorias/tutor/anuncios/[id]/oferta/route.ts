import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { erro, lerJson, naoEncontrado, obterColecoes, userAgentDe } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { conferirCodigo, mensagemDoCodigo } from '@/lib/monitorias/codigos'
import { sha256, textoDaOferta, VERSAO_OFERTA } from '@/lib/monitorias/documentos/contrato'
import { carregarUsuario } from '@/lib/monitorias/servidor'
import { nomeCivil } from '@/lib/monitorias/contratos'
import { duracoesPermitidas, formatarDuracao } from '@/lib/monitorias/agenda'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import type { Anuncio } from '@/lib/monitorias/tipos'

export const dynamic = 'force-dynamic'

function montarOferta(anuncio: Anuncio, nome: string) {
  const direto = anuncio.modos.direto!
  const texto = textoDaOferta({
    monitorNome: nome,
    anuncioTitulo: anuncio.titulo,
    materia: anuncio.materia,
    precoTexto: `${formatarCentavos(anuncio.preco.valorCentavos)} por ${anuncio.preco.modo === 'hora' ? 'hora' : 'aula'}${
      anuncio.grupo.ativo ? `, com preços de grupo por faixa (até ${anuncio.grupo.maxAlunos} alunos)` : ''
    }${anuncio.aulaGratis.ativa ? `, inclusive a aula experimental gratuita de ${formatarDuracao(anuncio.aulaGratis.duracaoMin)}` : ''}`,
    duracoesTexto: duracoesPermitidas(direto.duracaoMinMin, direto.duracaoMaxMin, direto.passoMin).map(formatarDuracao).join(', '),
  })
  return { texto, hash: sha256(texto) }
}

async function carregar(id: string, userId: string) {
  if (!ObjectId.isValid(id)) return null
  const c = await obterColecoes()
  return c.anuncios.findOne({ _id: new ObjectId(id), userId } as any)
}

/** GET — texto da oferta-padrão (o que o monitor vai assinar). */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, {}, async ({ sessao }) => {
    const [a, user] = await Promise.all([carregar(params.id, sessao.userId), carregarUsuario(sessao.userId)])
    if (!a || !user) return naoEncontrado()
    if (!a.modos.direto) return erro(409, 'Ative o agendamento direto no anúncio primeiro.')
    const { texto, hash } = montarOferta(a, nomeCivil(user))
    return ok({ texto, hash, versao: VERSAO_OFERTA, assinada: a.ofertaAssinada?.hash === hash })
  })
}

/** POST {codigo, hash} — assina a oferta com o código do e-mail. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao, ip }) => {
    const corpo = z.object({ codigo: z.string().max(10), hash: z.string().length(64) }).strict().safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Dados inválidos.')
    const [a, user] = await Promise.all([carregar(params.id, sessao.userId), carregarUsuario(sessao.userId)])
    if (!a || !user) return naoEncontrado()
    if (!a.modos.direto) return erro(409, 'Ative o agendamento direto no anúncio primeiro.')
    const { texto, hash } = montarOferta(a, nomeCivil(user))
    if (hash !== corpo.data.hash) return erro(409, 'As condições do anúncio mudaram. Releia a oferta.')
    const r = await conferirCodigo(sessao.userId, `oferta:${params.id}`, corpo.data.codigo)
    if (r !== 'ok') return erro(400, mensagemDoCodigo(r))
    const c = await obterColecoes()
    const assinatura = { versao: VERSAO_OFERTA, hash, texto, em: new Date(), ip, userAgent: userAgentDe(request) }
    await c.anuncios.updateOne({ _id: a._id as any }, { $set: { ofertaAssinada: assinatura, updatedAt: new Date() } })
    return ok({ assinada: true, em: assinatura.em })
  })
}
