import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { Form, FormResponse } from '@/lib/types'
import { sendFormSubmissionEmail } from '@/lib/mail'
import { generateFormResponsePDF } from '@/lib/pdf-generator'
import { getSession } from '@/lib/auth'
import { createGrantedMaterialSerialKey, getActivationUrl } from '@/lib/serial-keys'
import { sendSerialKeyEmail } from '@/lib/serial-key-fulfillment'
import {
  secureApiEndpoint,
  isValidObjectId,
  sanitizeObject,
  validateEmail
} from '@/lib/api-security'
import { checkTextAnswer, isFreeTextQuestion } from '@/lib/answer-quality'
import { getFormPrizes, requiresPrizeChoice, resolvePrizesToDeliver } from '@/lib/form-prizes'

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
    const selectedMaterialId =
      typeof body?.selectedMaterialId === 'string' ? body.selectedMaterialId.trim() : ''

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

    if (form.settings.requireLogin === true && !session) {
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
      if (block.type === 'question' && isFreeTextQuestion(block.questionType)) {
        const answer = sanitizedAnswers[block.id]
        if (typeof answer === 'string' && answer.length > 5000) {
          return NextResponse.json({ error: `A resposta para "${block.title}" é muito longa.` }, { status: 400 })
        }

        // Barreira contra resposta-lixo ("ajwisajsjiawji", "asdfasdf", "aaaa").
        // O cliente já avisa antes do envio; aqui é a validação de verdade, já
        // que dá pra chamar a API direto. `blockId` volta junto para a página
        // conseguir levar a pessoa até a pergunta certa.
        //
        // A análise roda no texto ORIGINAL, não no sanitizado: o sanitizador
        // troca aspas e barras por entidades (`&#x2F;`), o que faria o servidor
        // enxergar um texto diferente do que o cliente avaliou. Aqui a string
        // só é analisada, nunca renderizada — o que vai pro banco continua
        // sendo a versão sanitizada.
        const quality = checkTextAnswer(answers[block.id])
        if (!quality.ok) {
          return NextResponse.json(
            {
              error: `${quality.message} (pergunta: "${block.title}")`,
              code: 'LOW_QUALITY_ANSWER',
              blockId: block.id,
            },
            { status: 400 }
          )
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

    // Entrega de material não exige mais login: se logado, vai para o e-mail da
    // conta; se não, precisa vir de uma pergunta de e-mail respondida (o admin
    // é obrigado a configurar essa pergunta quando ativa a entrega — ver editor).
    if (form.settings.deliverMaterial && !deliveryEmail) {
      return NextResponse.json(
        { error: 'Informe um e-mail válido para receber o material.' },
        { status: 400 }
      )
    }

    // E-mails conhecidos desta resposta (conta logada + pergunta de e-mail).
    // Guardar os dois é o que permite a trava por e-mail funcionar mesmo quando
    // a pessoa responde logada numa vez e deslogada na outra.
    const knownEmails = Array.from(new Set([accountEmail, userEmail].filter(Boolean) as string[]))

    // Trava de "uma resposta por e-mail". Sem e-mail conhecido não há como
    // identificar quem está respondendo, então o envio é barrado — o editor
    // obriga o admin a exigir login ou configurar a pergunta de e-mail.
    if (form.settings.oneResponsePerEmail) {
      if (knownEmails.length === 0) {
        return NextResponse.json(
          {
            error: 'Informe um e-mail válido para enviar este formulário.',
            code: 'EMAIL_REQUIRED',
          },
          { status: 400 }
        )
      }

      // `userEmail` cobre as respostas antigas (anteriores ao campo `emails`).
      const duplicate = await db.collection('form_responses').findOne({
        formId: params.id,
        $or: [
          { emails: { $in: knownEmails } },
          { userEmail: { $in: knownEmails } },
        ],
      })

      if (duplicate) {
        return NextResponse.json(
          {
            error: 'Este e-mail já respondeu este formulário. Só é permitida uma resposta por e-mail.',
            code: 'ALREADY_ANSWERED',
          },
          { status: 409 }
        )
      }
    }

    // Prêmios: o formulário pode oferecer vários materiais. No modo "escolha
    // única" o usuário precisa indicar qual dos materiais quer receber.
    const prizes = getFormPrizes(form.settings)
    const mustChoosePrize = requiresPrizeChoice(form.settings)
    const prizesToDeliver =
      form.settings.deliverMaterial && deliveryEmail
        ? resolvePrizesToDeliver(form.settings, selectedMaterialId)
        : []

    if (mustChoosePrize && prizes.length > 0) {
      const validChoice = prizes.some(p => p.id === selectedMaterialId)
      if (!validChoice) {
        return NextResponse.json(
          {
            error: 'Escolha qual material você quer receber.',
            code: 'MATERIAL_CHOICE_REQUIRED',
          },
          { status: 400 }
        )
      }
    }

    const response: FormResponse = {
      formId: params.id,
      answers: sanitizedAnswers,
      submittedAt: new Date(),
      userEmail: userEmail || accountEmail,
      ...(knownEmails.length > 0 ? { emails: knownEmails } : {}),
      ...(mustChoosePrize && selectedMaterialId ? { selectedMaterialId } : {}),
      ...(prizesToDeliver.length > 0
        ? { deliveredMaterialIds: prizesToDeliver.map(p => p.id) }
        : {}),
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

    // Entrega de material por e-mail (serial key + link de ativação). Um
    // formulário pode entregar vários materiais — cada um gera a sua própria
    // serial key e o seu próprio e-mail de ativação.
    type MaterialDelivery =
      | { delivered: true; title: string; email: string; serialKey: string; activationUrl: string }
      | { delivered: false; reason: string; title?: string }

    const materialDeliveries: MaterialDelivery[] = []

    for (const prize of prizesToDeliver) {
      try {
        // Idempotência: se este e-mail já recebeu uma key deste material por
        // este formulário e ainda não a ativou, reaproveita (reenvia) em vez
        // de gerar chaves infinitas a cada reenvio/refresh. `used: { $ne: true }`
        // evita reaproveitar uma key deixada em estado inconsistente (ex.: por
        // um bug de roteamento já corrigido que marcava `used` sem nunca
        // ativar de fato) — nesse caso é melhor gerar uma key nova e limpa.
        const existing = await db.collection('serial_keys').findOne({
          source: 'form',
          buyerEmail: deliveryEmail,
          productId: prize.id,
          status: 'unactivated',
          used: { $ne: true },
        })

        let serial: any
        let materialTitle: string
        let kind: 'purchase' | 'resend' = 'purchase'
        if (existing && existing.activationToken) {
          serial = existing
          materialTitle = existing.productTitle || prize.title || 'Material'
          kind = 'resend'
        } else {
          const created = await createGrantedMaterialSerialKey(db, {
            materialId: prize.id,
            email: deliveryEmail!,
            name: session?.name,
            generatedBy: session?.userId || 'system',
            generatedByName: `Formulário: ${form.title}`,
            source: 'form',
          })
          serial = created.serial
          materialTitle = created.materialTitle
        }

        const sent = await sendSerialKeyEmail(db, serial, { kind })
        materialDeliveries.push(
          sent
            ? {
                delivered: true,
                title: materialTitle,
                email: deliveryEmail!,
                serialKey: serial.key,
                activationUrl: serial.activationToken ? getActivationUrl(serial.activationToken) : '',
              }
            : { delivered: false, reason: 'email_failed', title: materialTitle }
        )
      } catch (materialError) {
        console.error('Failed to deliver material:', materialError)
        materialDeliveries.push({ delivered: false, reason: 'error', title: prize.title })
      }
    }

    return NextResponse.json({
      success: true,
      materialDeliveries,
      // Compatibilidade com clientes antigos, que esperavam uma única entrega.
      materialDelivery: materialDeliveries[0] ?? null,
    })
  } catch (error) {
    console.error('Error submitting form:', error)
    return NextResponse.json({ error: 'Erro ao enviar resposta' }, { status: 500 })
  }
}
