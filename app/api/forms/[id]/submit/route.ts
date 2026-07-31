import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { Form, FormResponse } from '@/lib/types'
import { sendFormSubmissionEmail } from '@/lib/mail'
import { generateFormResponsePDF } from '@/lib/pdf-generator'
import { getSession } from '@/lib/auth'
import { createGrantedMaterialSerialKey } from '@/lib/serial-keys'
import { sendSerialKeyEmail } from '@/lib/serial-key-fulfillment'
import {
  secureApiEndpoint,
  isValidObjectId,
  sanitizeObject,
  validateEmail
} from '@/lib/api-security'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validar ObjectId primeiro
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Rate limit para submissão de forms (endpoint público)
    const security = await secureApiEndpoint(req, {
      rateLimit: 'PUBLIC',
      auth: { requireAuth: false }
    })

    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const session = await getSession()

    const body = await req.json()
    const { answers } = body

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Respostas são obrigatórias' }, { status: 400 })
    }

    // Sanitizar todas as respostas contra XSS
    const sanitizedAnswers = sanitizeObject(answers)

    const db = await getDb()
    const form = await db.collection('forms').findOne({ _id: new ObjectId(params.id) }) as unknown as Form

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
    }

    // Validate Status
    if (!form.settings.isActive) {
      return NextResponse.json({ error: 'Este formulário está fechado.' }, { status: 403 })
    }
    if (form.settings.deadline && new Date() > new Date(form.settings.deadline)) {
      return NextResponse.json({ error: 'Prazo encerrado.' }, { status: 403 })
    }
    if (form.settings.responseLimit && form.responseCount >= form.settings.responseLimit) {
      return NextResponse.json({ error: 'Limite de respostas atingido.' }, { status: 403 })
    }

    // A entrega de material depende de um e-mail confiável (o da conta), então
    // exige login mesmo que o formulário não o exija explicitamente.
    const loginRequired = form.settings.requireLogin === true || form.settings.deliverMaterial === true
    if (loginRequired && !session) {
      return NextResponse.json(
        { error: 'Você precisa estar logado para responder este formulário.', code: 'LOGIN_REQUIRED' },
        { status: 401 }
      )
    }

    // Validate Required Answers and Length
    const blocks = form.blocks
    for (const block of blocks) {
      if (block.type === 'question' && block.required) {
        const answer = sanitizedAnswers[block.id]
        if (!answer || (Array.isArray(answer) && answer.length === 0) || (typeof answer === 'string' && !answer.trim())) {
          return NextResponse.json({ error: `A pergunta "${block.title}" é obrigatória.` }, { status: 400 })
        }
      }
      // Max Length check for text inputs
      if (block.type === 'question' && (block.questionType === 'short-text' || block.questionType === 'long-text')) {
        const answer = sanitizedAnswers[block.id]
        if (typeof answer === 'string' && answer.length > 5000) {
          return NextResponse.json({ error: `A resposta para "${block.title}" é muito longa.` }, { status: 400 })
        }
      }
    }

    let userEmail: string | undefined
    if (form.settings.emailQuestionId) {
      const emailAnswer = sanitizedAnswers[form.settings.emailQuestionId]
      if (typeof emailAnswer === 'string') {
        const emailValidation = validateEmail(emailAnswer)
        if (emailValidation.valid) {
          userEmail = emailValidation.value
        }
      }
    }

    // E-mail de destino para entregas: o da conta logada tem prioridade (é
    // confiável e verificado); caímos para a pergunta de e-mail quando não há
    // login. Sem login, `userEmail` continua sendo o da pergunta configurada.
    const accountEmail = session?.email ? String(session.email).toLowerCase() : undefined
    const deliveryEmail = accountEmail || userEmail

    const response: FormResponse = {
      formId: params.id,
      answers: sanitizedAnswers,
      submittedAt: new Date(),
      userEmail: userEmail || accountEmail
    }

    await db.collection('form_responses').insertOne(response as any)
    await db.collection('forms').updateOne(
      { _id: new ObjectId(params.id) },
      { $inc: { responseCount: 1 } }
    )

    // Send Email if configured
    if (form.settings.sendConfirmationEmail && deliveryEmail) {
      try {
        const pdfBlob = await generateFormResponsePDF(form, sanitizedAnswers) as Blob

        // Convert Blob to Buffer for nodemailer
        const buffer = Buffer.from(await pdfBlob.arrayBuffer())

        await sendFormSubmissionEmail(deliveryEmail, form.title, buffer, `resumo-${params.id}.pdf`)
      } catch (emailError) {
        console.error('Failed to send email')
      }
    }

    // Entrega de material por e-mail (serial key + link de ativação).
    let materialDelivery:
      | { delivered: true; title: string; email: string }
      | { delivered: false; reason: string }
      | null = null

    if (form.settings.deliverMaterial && form.settings.deliverMaterialId) {
      if (!deliveryEmail) {
        materialDelivery = { delivered: false, reason: 'no_email' }
      } else {
        try {
          // Idempotência: se este e-mail já recebeu uma key deste material por
          // este formulário e ainda não a ativou, reaproveita (reenvia) em vez
          // de gerar chaves infinitas a cada reenvio/refresh.
          const existing = await db.collection('serial_keys').findOne({
            source: 'form',
            buyerEmail: deliveryEmail,
            productId: form.settings.deliverMaterialId,
            status: 'unactivated',
          })

          let serial: any
          let materialTitle: string
          let kind: 'purchase' | 'resend' = 'purchase'
          if (existing && existing.activationToken) {
            serial = existing
            materialTitle = existing.productTitle || 'Material'
            kind = 'resend'
          } else {
            const created = await createGrantedMaterialSerialKey(db, {
              materialId: form.settings.deliverMaterialId,
              email: deliveryEmail,
              name: session?.name,
              generatedBy: session?.userId || 'system',
              generatedByName: `Formulário: ${form.title}`,
              source: 'form',
            })
            serial = created.serial
            materialTitle = created.materialTitle
          }

          const sent = await sendSerialKeyEmail(db, serial, { kind })
          materialDelivery = sent
            ? { delivered: true, title: materialTitle, email: deliveryEmail }
            : { delivered: false, reason: 'email_failed' }
        } catch (materialError) {
          console.error('Failed to deliver material:', materialError)
          materialDelivery = { delivered: false, reason: 'error' }
        }
      }
    }

    return NextResponse.json({ success: true, materialDelivery })
  } catch (error) {
    console.error('Error submitting form:', error)
    return NextResponse.json({ error: 'Erro ao enviar resposta' }, { status: 500 })
  }
}
