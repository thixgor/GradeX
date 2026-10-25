import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getDb } from '@/lib/mongodb'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import type { Coupon } from '@/lib/coupons'
import { exigirAdmin } from '@/lib/embaixadores/admin'
import {
  COLECAO_EMBAIXADORES,
  esquecerCodigoEmCache,
  garantirIndicesDoPrograma,
  lerConfigDoPrograma,
  linkDoEmbaixador,
  resumoDeTodos,
  sincronizarVendas,
  type Embaixador,
} from '@/lib/embaixadores/servidor'
import {
  centavos,
  cicloDeRepasse,
  codigoValido,
  comissaoSobreOProduto,
  normalizarCodigo,
  saudeDoCupom,
} from '@/lib/embaixadores/regras'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET  → todos os embaixadores com os números de cada um, os totais do
 *        programa e a configuração. `?verificarCodigo=X` só responde se o
 *        código está livre (e se já existe um cupom com ele).
 * POST → cria um embaixador: liga a conta, cria (ou adota) o cupom individual.
 */
export async function GET(request: NextRequest) {
  const { recusa } = await exigirAdmin()
  if (recusa) return recusa

  const db = await getDb()
  const verificar = request.nextUrl.searchParams.get('verificarCodigo')
  if (verificar !== null) {
    const codigo = normalizarCodigo(verificar)
    if (!codigoValido(codigo)) return NextResponse.json({ codigo, valido: false, disponivel: false, cupomExistente: null })
    const [embaixador, cupom] = await Promise.all([
      db.collection(COLECAO_EMBAIXADORES).findOne({ codigo }, { projection: { _id: 1 } }),
      db.collection<Coupon>('coupons').findOne({ codeNormalized: codigo }, { projection: { _id: 1, discountValue: 1, discountType: 1, embaixadorId: 1, isActive: 1 } }),
    ])
    const cupomDeOutro = !!cupom?.embaixadorId
    return NextResponse.json({
      codigo,
      valido: true,
      disponivel: !embaixador && !cupomDeOutro,
      cupomExistente: cupom
        ? { desconto: Number(cupom.discountValue), tipo: cupom.discountType, ativo: cupom.isActive !== false, deEmbaixador: cupomDeOutro }
        : null,
    })
  }

  try {
    const config = await lerConfigDoPrograma(db)
    const ciclo = cicloDeRepasse(new Date(), config.diaDoRepasse)
    const resumo = await resumoDeTodos(db, ciclo.inicioDoMesAtual)
    const totais = {
      embaixadores: resumo.embaixadores.length,
      ativos: 0,
      remunerados: 0,
      visitantes: 0,
      cadastros: 0,
      compras: 0,
      compradores: 0,
      receita: 0,
      comissaoTotal: 0,
      repassado: 0,
      aReceber: 0,
      liberado: 0,
      valorSocio: 0,
      nossaParteLiquida: 0,
    }
    const linhas = resumo.embaixadores.map((e) => {
      const id = String(e._id)
      const v: any = resumo.vendas.get(id) || {}
      const repassado = centavos(resumo.repasses.get(id) || 0)
      const comissao = centavos(v.comissao || 0)
      const linha = {
        id,
        nome: e.nome,
        email: e.email,
        faculdade: e.faculdade || '',
        tipo: e.tipo,
        status: e.status,
        codigo: e.codigo,
        link: linkDoEmbaixador(e.codigo),
        comissaoPercent: e.tipo === 'remunerado' ? e.comissaoPercent : 0,
        comissaoSobreProduto: e.tipo === 'remunerado' ? comissaoSobreOProduto(config.percentualSocio, e.comissaoPercent) : 0,
        temPix: !!e.pix,
        visitantes: resumo.cliques.get(id) || 0,
        cadastros: resumo.indicacoes.get(id) || 0,
        compras: Number(v.compras || 0),
        compradores: Number(v.compradores || 0),
        receita: centavos(v.receita || 0),
        comissaoTotal: comissao,
        repassado,
        aReceber: centavos(comissao - repassado),
        // O que pagar no repasse deste mês: comissões de meses fechados − pagos.
        liberado: centavos(Number(v.comissaoFechada || 0) - repassado),
        ultimaVendaEm: v.ultimaVenda ? new Date(v.ultimaVenda).toISOString() : null,
        criadoEm: e.criadoEm.toISOString(),
        saude: saudeDoCupom({ ultimaVendaEm: v.ultimaVenda, entrouEm: e.criadoEm, diasParaParado: config.diasParaCupomParado }).saude,
      }
      if (e.status === 'ativo') totais.ativos++
      if (e.tipo === 'remunerado') totais.remunerados++
      totais.visitantes += linha.visitantes
      totais.cadastros += linha.cadastros
      totais.compras += linha.compras
      totais.compradores += linha.compradores
      totais.receita += linha.receita
      totais.comissaoTotal += linha.comissaoTotal
      totais.repassado += linha.repassado
      totais.aReceber += Math.max(0, linha.aReceber)
      totais.liberado += Math.max(0, linha.liberado)
      totais.valorSocio += Number(v.valorSocio || 0)
      totais.nossaParteLiquida += Number(v.nossaParteBruta || 0) - comissao
      return linha
    })
    for (const k of ['receita', 'comissaoTotal', 'repassado', 'aReceber', 'liberado', 'valorSocio', 'nossaParteLiquida'] as const) {
      totais[k] = centavos(totais[k])
    }
    const repasse = { mesFechado: ciclo.mesFechado, prazoDoLiberado: ciclo.prazoDoFechado?.toISOString() || null }
    return jsonComprimido(request, { embaixadores: linhas, totais, config, repasse }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (erro) {
    console.error('[admin/embaixadores] GET', erro)
    return NextResponse.json({ error: 'Erro ao carregar embaixadores' }, { status: 500 })
  }
}

const Criacao = z.object({
  userId: z.string().refine((v) => ObjectId.isValid(v), 'Escolha a conta do embaixador.'),
  tipo: z.enum(['remunerado', 'nao_remunerado']),
  comissaoPercent: z.number().min(0).max(100).default(0),
  descontoCupom: z.number().min(1).max(100),
  codigo: z.string().min(3).max(40),
  faculdade: z.string().max(120).optional().default(''),
  periodo: z.string().max(30).optional().default(''),
  instagram: z.string().max(60).optional().default(''),
  telefone: z.string().max(30).optional().default(''),
  observacoes: z.string().max(2000).optional().default(''),
})

export async function POST(request: NextRequest) {
  const { session, recusa } = await exigirAdmin()
  if (recusa) return recusa

  let dados: z.infer<typeof Criacao>
  try {
    dados = Criacao.parse(await request.json())
  } catch (erro: any) {
    const mensagem = erro?.issues?.[0]?.message || 'Dados inválidos'
    return NextResponse.json({ error: mensagem }, { status: 400 })
  }

  const codigo = normalizarCodigo(dados.codigo)
  if (!codigoValido(codigo)) {
    return NextResponse.json({ error: 'Código precisa ter de 3 a 20 letras ou números.' }, { status: 400 })
  }

  try {
    const db = await getDb()
    await garantirIndicesDoPrograma(db)
    const embaixadores = db.collection<Embaixador>(COLECAO_EMBAIXADORES)
    const cupons = db.collection<Coupon>('coupons')

    const [usuario, jaEmbaixador, codigoEmUso, cupomExistente] = await Promise.all([
      db.collection('users').findOne({ _id: new ObjectId(dados.userId) }, { projection: { name: 1, email: 1, afyaUnit: 1, institution: 1, phone: 1 } }),
      embaixadores.findOne({ userId: dados.userId }, { projection: { _id: 1 } }),
      embaixadores.findOne({ codigo }, { projection: { _id: 1 } }),
      cupons.findOne({ codeNormalized: codigo }),
    ])
    if (!usuario) return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 })
    if (jaEmbaixador) return NextResponse.json({ error: 'Esta conta já é embaixadora.' }, { status: 409 })
    if (codigoEmUso) return NextResponse.json({ error: 'Este código já é de outro embaixador.' }, { status: 409 })
    if (cupomExistente?.embaixadorId) {
      return NextResponse.json({ error: 'Já existe um cupom de embaixador com este código.' }, { status: 409 })
    }

    const agora = new Date()
    const embaixador: Embaixador = {
      userId: dados.userId,
      nome: String(usuario.name || '').trim() || 'Embaixador',
      email: String(usuario.email || '').toLowerCase(),
      faculdade: dados.faculdade.trim() || String(usuario.afyaUnit || usuario.institution || ''),
      periodo: dados.periodo.trim(),
      instagram: dados.instagram.trim().replace(/^@+/, ''),
      telefone: dados.telefone.trim() || String(usuario.phone || ''),
      tipo: dados.tipo,
      comissaoPercent: dados.tipo === 'remunerado' ? dados.comissaoPercent : 0,
      descontoCupom: dados.descontoCupom,
      codigo,
      status: 'ativo',
      observacoes: dados.observacoes.trim(),
      criadoEm: agora,
      atualizadoEm: agora,
      criadoPor: session!.userId,
    }
    const inserido = await embaixadores.insertOne(embaixador)
    const embaixadorId = inserido.insertedId.toString()

    // O cupom individual. Um cupom avulso que já existia com este código é
    // adotado (com o histórico de usos dele); senão nasce um, sobre o lote
    // vigente e válido para tudo, inclusive o Plus+.
    let couponId: string
    if (cupomExistente?._id) {
      couponId = String(cupomExistente._id)
      await cupons.updateOne({ _id: cupomExistente._id as any }, { $set: { embaixadorId, isActive: true, updatedAt: agora } })
    } else {
      const cupom: Coupon = {
        code: codigo,
        codeNormalized: codigo,
        embaixadorId,
        description: `Cupom do embaixador ${embaixador.nome}`,
        discountType: 'percentage',
        discountValue: dados.descontoCupom,
        scope: 'tudo',
        productRefs: [],
        usageLimit: null,
        perUserLimit: null,
        minimumCartAmount: null,
        firstPurchaseOnly: false,
        allowedAfyaUnits: [],
        allowedManualPlans: null,
        stackWithTier: true,
        promo: null,
        usageCount: 0,
        expiresAt: null,
        durationValue: null,
        durationUnit: null,
        isActive: true,
        createdBy: session!.userId,
        createdByName: session!.name || 'Admin',
        createdAt: agora,
        updatedAt: agora,
      }
      const criado = await cupons.insertOne(cupom as any)
      couponId = criado.insertedId.toString()
    }
    await embaixadores.updateOne({ _id: inserido.insertedId }, { $set: { couponId } })
    esquecerCodigoEmCache(codigo)

    // Cupom adotado já pode ter vendas antigas: entram na conta agora.
    if (cupomExistente) await sincronizarVendas(db, { ...embaixador, _id: inserido.insertedId, couponId })

    return NextResponse.json({ id: embaixadorId, codigo, link: linkDoEmbaixador(codigo) }, { status: 201 })
  } catch (erro: any) {
    if (erro?.code === 11000) return NextResponse.json({ error: 'Código ou conta já cadastrados.' }, { status: 409 })
    console.error('[admin/embaixadores] POST', erro)
    return NextResponse.json({ error: 'Erro ao criar embaixador' }, { status: 500 })
  }
}
