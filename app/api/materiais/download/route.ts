/**
 * API de download seguro de PDF com marca d'água personalizada.
 *
 * Segurança:
 *   - Requer autenticação
 *   - Verifica compra aprovada (ou acesso por grupo para materiais gratuitos)
 *   - Nunca expõe a URL original do blob ao cliente
 *   - Gera PDF personalizado com dados do usuário em cada download
 *   - Loga cada download para auditoria
 *
 * GET /api/materiais/download?materialId=...
 *   Response: PDF stream com marca d'água
 *
 * POST /api/materiais/download
 *   Body: { materialId: string }
 *   Response: PDF stream com marca d'água
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { fetchMaterialPdfBytes } from '@/lib/material-pdf-viewer'
import { applyWatermark } from '@/lib/pdf-watermark'
import { pdfBytesToStream } from '@/lib/pdf-response'
import { checkPlusDownloadAllowance, recordPlusDownload } from '@/lib/plus-guard'
import {
  avaliarUsoDoPlano,
  corpoDeRecusa,
  registrarUsoDoPlano,
  resolverPermissoes,
} from '@/lib/plan-entitlements-server'
import { matchesAccessGroups, isPlusAccount } from '@/lib/account-tier'
import { emailFingerprint } from '@/lib/watermark-fingerprint'
import { activeAccessFilter, summarizeTimedAccess } from '@/lib/material-timed-access'

export const dynamic = 'force-dynamic'

// Tempo máximo de geração antes de timeout (Vercel: 60s no plano Pro)
export const maxDuration = 60

export async function POST(request: NextRequest) {
  let body: { materialId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { materialId } = body
  if (!materialId || typeof materialId !== 'string' || !isValidObjectId(materialId)) {
    return NextResponse.json({ error: 'materialId inválido' }, { status: 400 })
  }

  return createMaterialPdfDownloadResponse(request, materialId)
}

export async function GET(request: NextRequest) {
  const materialId = request.nextUrl.searchParams.get('materialId')
  if (!materialId || !isValidObjectId(materialId)) {
    return NextResponse.json({ error: 'materialId inválido' }, { status: 400 })
  }

  return createMaterialPdfDownloadResponse(request, materialId)
}

async function createMaterialPdfDownloadResponse(request: NextRequest, materialId: string) {
  try {
    // ── 1. Autenticação ───────────────────────────────────────────────────
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // ── 3. Buscar material do banco (fonte da verdade) ────────────────────
    const db = await getDb()
    const material = await db.collection('materials').findOne(
      { _id: new ObjectId(materialId) },
      {
        projection: {
          title: 1,
          type: 1,
          pricing: 1,
          allowedGroups: 1,
          isHidden: 1,
          pdfFile: 1,
          pdfDownloadEnabled: 1,
          downloadCount: 1,
        },
      }
    )

    if (!material) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    if (material.isHidden && session.role !== 'admin') {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    // ── 4. Verificar se o material tem PDF interno ────────────────────────
    if (!material.pdfFile?.blobUrl) {
      return NextResponse.json(
        { error: 'Este material não possui PDF para download direto' },
        { status: 422 }
      )
    }

    if (material.pdfDownloadEnabled === false && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'O download deste PDF foi desabilitado. Use o visualizador protegido quando disponivel.' },
        { status: 403 }
      )
    }

    // ── 5. Verificar autorização de acesso ────────────────────────────────
    const isAdmin = session.role === 'admin'
    let hasAccess = isAdmin
    let purchaseForAudit: any = null

    // Assinante Plus+ precisa ter resgatado o material antes (o resgate grava
    // a purchase que a checagem abaixo encontra). Sem isso, o download seria
    // uma segunda porta de entrada para o acervo, fora do ponto onde o
    // Plus+ Guard contabiliza o consumo.
    const sessionUser = !isAdmin
      ? await db.collection('users').findOne(
          { _id: new ObjectId(session.userId) },
          { projection: { accountType: 1, secondaryRole: 1, premiumPlanType: 1 } }
        )
      : null

    if (!hasAccess) {
      if (material.pricing === 'paid') {
        // Exige compra aprovada
        const emailRegex = session.email
          ? new RegExp(
              `^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
              'i'
            )
          : null
        // Acesso por tempo vencido não vale mais nem para leitura, muito
        // menos para download.
        const purchase = await db.collection('material_purchases').findOne({
          userId: session.userId,
          itemId: materialId,
          itemType: 'material',
          status: 'completed',
          ...activeAccessFilter(),
        })

        if (purchase) {
          hasAccess = true
          purchaseForAudit = purchase
        } else {
          // Tentar via email como fallback (grants manuais antigos)
          if (emailRegex) {
            const byEmail = await db.collection('material_purchases').findOne({
              userEmail: { $regex: emailRegex },
              itemId: materialId,
              itemType: 'material',
              status: 'completed',
              ...activeAccessFilter(),
            })
            hasAccess = !!byEmail
            purchaseForAudit = byEmail
          }

          if (!hasAccess) {
            const packages = await db.collection('material_packages')
              .find({ materialIds: materialId, isHidden: { $ne: true } })
              .project({ _id: 1 })
              .toArray()
            const packageIds = packages.map((pkg: any) => String(pkg._id))

            if (packageIds.length > 0) {
              const packageFilter = {
                itemType: 'package',
                itemId: { $in: packageIds },
                status: 'completed',
                ...activeAccessFilter(),
              }
              const packageByUserId = await db.collection('material_purchases').findOne({
                ...packageFilter,
                userId: session.userId,
              })

              if (packageByUserId) {
                hasAccess = true
                purchaseForAudit = packageByUserId
              } else if (emailRegex) {
                const packageByEmail = await db.collection('material_purchases').findOne({
                  ...packageFilter,
                  userEmail: { $regex: emailRegex },
                })
                hasAccess = !!packageByEmail
                purchaseForAudit = packageByEmail
              }
            }
          }
        }
      } else {
        // Material gratuito: verificar grupo do usuário
        if (!material.allowedGroups || material.allowedGroups.length === 0) {
          // Sem restrição de grupo — qualquer usuário autenticado tem acesso
          hasAccess = true
        } else {
          // Um assinante Plus+ satisfaz também os grupos legados
          // (`premium`/`essential`) marcados em materiais antigos.
          hasAccess = matchesAccessGroups(
            material.allowedGroups,
            sessionUser?.accountType,
            sessionUser?.secondaryRole,
          )
        }
      }
    }

    if (!hasAccess) {
      // Assinante que ainda não resgatou recebe a orientação certa: resgatar,
      // não comprar.
      if (isPlusAccount(sessionUser?.accountType)) {
        return NextResponse.json(
          {
            error: 'Resgate este material com o seu Plus+ para liberar o download.',
            needsClaim: true,
          },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: 'Acesso negado. Adquira o material para fazer o download.' },
        { status: 403 }
      )
    }

    // ── 5a. Acesso por tempo limitado: leitura sim, download não ──────────
    // A versão temporária é vendida como "leia dentro da plataforma". Baixar o
    // PDF criaria uma cópia que sobrevive ao fim do prazo — exatamente o que a
    // modalidade não vende. O leitor protegido continua liberado.
    const timedAccess = summarizeTimedAccess(purchaseForAudit)
    if (timedAccess && !isAdmin) {
      return NextResponse.json(
        {
          error: `Seu acesso é a versão por tempo limitado (${timedAccess.label || timedAccess.durationLabel || 'temporária'}), que não inclui download. Leia o material no visualizador protegido — você ainda tem ${timedAccess.remainingLabel}.`,
          timedAccess,
          downloadBlocked: true,
        },
        { status: 403 }
      )
    }

    // ── 5a-bis. Permissão de "Materiais" no plano assinado ────────────────
    // Duas coisas diferentes acontecem aqui:
    //
    //  - o plano pode não incluir o acervo. Quem tem o item por COMPRA avulsa
    //    baixa assim mesmo (é receita, não benefício de assinatura); quem o
    //    tem por resgate da assinatura (`source: 'plus'`), ou por grupo, não;
    //  - o teto de downloads do plano vale para o que ainda não é da conta —
    //    o resgate já cobrou a sua parte, e recobrar na releitura seria
    //    limitar quantas vezes a pessoa abre o próprio material.
    const permissoesDoPlano = await resolverPermissoes(db, {
      userId: session.userId,
      role: session.role,
      accountType: sessionUser?.accountType,
      premiumPlanType: (sessionUser as any)?.premiumPlanType,
    })
    const acessoVeioDaAssinatura =
      !purchaseForAudit || (purchaseForAudit as any).source === 'plus'
    if (acessoVeioDaAssinatura) {
      const veredictoDoPlano = await avaliarUsoDoPlano(db, permissoesDoPlano, 'materiais', {
        recurso: `material:${materialId}`,
      })
      if (!veredictoDoPlano.permitido) {
        return NextResponse.json(corpoDeRecusa(veredictoDoPlano), { status: 403 })
      }
    }

    // ── 5b. Plus+ Guard: cota antiabuso ───────────────────────────────────
    // O resgate (POST /api/materiais/resgatar) já consumiu cota ao trazer o
    // item para a conta. Baixar o que já é seu não consome de novo — a cota
    // limita quanto do acervo se adquire, não quantas vezes se relê o próprio
    // material. Materiais liberados por grupo (sem purchase) seguem contando.
    const ownsItem = !!purchaseForAudit
    const allowance = ownsItem
      ? { allowed: true as const, message: undefined, reason: undefined, retryAt: undefined }
      : await checkPlusDownloadAllowance({ userId: session.userId, user: sessionUser, isAdmin, db })
    if (!allowance.allowed) {
      return NextResponse.json(
        {
          error: allowance.message || 'Limite de downloads atingido.',
          reason: allowance.reason,
          retryAt: allowance.retryAt,
        },
        { status: 429 }
      )
    }

    // ── 6. Buscar orderId para metadados da marca d'água ──────────────────
    let orderId = 'ADMIN'
    if (!isAdmin) {
      const purchase = purchaseForAudit || await db.collection('material_purchases').findOne(
        {
          userId: session.userId,
          itemId: materialId,
          status: 'completed',
        },
        { projection: { _id: 1, providerPaymentId: 1, providerOrderId: 1 } }
      )
      // `String(undefined)` vira a string "undefined" (truthy) — sem essa
      // guarda, quem acessa sem registro de compra (Plus+, grupo gratuito)
      // ganhava um orderId literalmente igual a "undefined" na marca d'água.
      orderId = purchase?.providerPaymentId
        || purchase?.providerOrderId
        || (purchase?._id ? String(purchase._id) : null)
        || session.userId
    }

    // ── 7. Baixar PDF original do Vercel Blob ─────────────────────────────
    // Nunca expor material.pdfFile.blobUrl ao cliente — apenas usar aqui no servidor.
    let pdfArrayBuffer: ArrayBuffer
    try {
      pdfArrayBuffer = await fetchMaterialPdfBytes(material.pdfFile.blobUrl)
    } catch (error) {
      console.error('[pdf-download] Falha ao buscar blob:', error)
      return NextResponse.json(
        { error: 'Erro ao recuperar o arquivo. Tente novamente.' },
        { status: 502 }
      )
    }

    // ── 8. Aplicar marca d'água personalizada ─────────────────────────────
    const now = new Date()
    const watermarkedPdf = await applyWatermark(pdfArrayBuffer, {
      userName: session.name,
      userEmail: session.email,
      userId: session.userId,
      orderId,
      downloadedAt: now,
    })

    // ── 9. Incrementar contador e logar auditoria (fire-and-forget) ───────
    // O registro no Plus+ Guard é o que sustenta a cota e serve de prova de
    // consumo se o usuário abrir uma disputa de estorno depois.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    if (!ownsItem) {
      await registrarUsoDoPlano(db, permissoesDoPlano, 'materiais', {
        recurso: `material:${materialId}`,
      })
    }
    Promise.all([
      recordPlusDownload({
        userId: session.userId,
        userEmail: session.email,
        userName: session.name,
        kind: 'material',
        resourceId: materialId,
        resourceTitle: material.title,
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
        watermarkFingerprint: emailFingerprint(session.email),
        db,
      }),
      db.collection('materials').updateOne(
        { _id: new ObjectId(materialId) },
        { $inc: { downloadCount: 1 } }
      ),
      db.collection('audit_logs').insertOne({
        action: 'material_pdf_download',
        userId: session.userId,
        userName: session.name,
        userEmail: session.email,
        materialId,
        materialTitle: material.title,
        orderId,
        downloadedAt: now,
        ip,
      }),
    ]).catch((e) => console.error('[pdf-download] Erro no log/counter:', e))

    // ── 10. Retornar PDF personalizado ─────────────────────────────────────
    // Nome do arquivo: título do material normalizado
    const safeTitle = (material.title as string)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 80)
    const filename = `${safeTitle}.pdf`

    // O corpo sai em pedaços, e não como um buffer só: acima de ~4,5 MB a
    // borda da Vercel corta a resposta de uma função que responde de uma vez
    // — e corta depois dos cabeçalhos, o que o navegador registrava como
    // "200 (OK) net::ERR_FAILED" e o aluno via como "erro de conexão".
    // Ver `lib/pdf-response.ts`.
    console.log(
      `[pdf-download] entregando material=${materialId} bytes=${watermarkedPdf.byteLength} origem=${material.pdfFile?.sizeBytes ?? '?'}`
    )

    return new NextResponse(pdfBytesToStream(watermarkedPdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        // Mantido mesmo em streaming: é o que permite ao navegador mostrar
        // progresso real e ao cliente perceber um arquivo que chegou pela
        // metade em vez de salvar um PDF truncado.
        'Content-Length': String(watermarkedPdf.byteLength),
        'Content-Transfer-Encoding': 'binary',
        'Accept-Ranges': 'none',
        // Nunca armazenar em cache — cada download é personalizado
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        // Prevenir embedding do PDF em iframes de outros domínios
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[pdf-download] Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro interno ao gerar o PDF. Tente novamente.' },
      { status: 500 }
    )
  }
}
