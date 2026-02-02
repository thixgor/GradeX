import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { Form, FormResponse, FormBlock } from '@/lib/types'
import { sendFormSubmissionEmail } from '@/lib/mail'
import { generateFormResponsePDF } from '@/lib/pdf-generator' // Need to implement this

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json()
        const { answers } = body

        if (!answers) {
            return NextResponse.json({ error: 'Respostas são obrigatórias' }, { status: 400 })
        }

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

        // Validate Required Answers and Length
        const blocks = form.blocks
        for (const block of blocks) {
            if (block.type === 'question' && block.required) {
                const answer = answers[block.id]
                if (!answer || (Array.isArray(answer) && answer.length === 0) || (typeof answer === 'string' && !answer.trim())) {
                    return NextResponse.json({ error: `A pergunta "${block.title}" é obrigatória.` }, { status: 400 })
                }
            }
            // Max Length check for text inputs
            if (block.type === 'question' && (block.questionType === 'short-text' || block.questionType === 'long-text')) {
                const answer = answers[block.id]
                if (typeof answer === 'string' && answer.length > 5000) { // arbitrary "large" limit
                    return NextResponse.json({ error: `A resposta para "${block.title}" é muito longa.` }, { status: 400 })
                }
            }
        }

        let userEmail: string | undefined
        if (form.settings.emailQuestionId) {
            const emailAnswer = answers[form.settings.emailQuestionId]
            if (typeof emailAnswer === 'string') {
                userEmail = emailAnswer
            }
        }

        const response: FormResponse = {
            formId: params.id,
            answers,
            submittedAt: new Date(),
            userEmail
        }

        await db.collection('form_responses').insertOne(response as any)
        await db.collection('forms').updateOne(
            { _id: new ObjectId(params.id) },
            { $inc: { responseCount: 1 } }
        )

        // Send Email if configured
        if (form.settings.sendConfirmationEmail && userEmail) {
            // We need to implement generateFormResponsePDF in lib/pdf-generator.ts first or mock it
            // Since I haven't implemented it yet, I will do it in the next step.
            // For now, let's assume it exists or wrap in try-catch to not fail the response
            try {
                const pdfBlob = await generateFormResponsePDF(form, answers) as Blob;

                // Convert Blob to Buffer for nodemailer
                const buffer = Buffer.from(await pdfBlob.arrayBuffer())

                await sendFormSubmissionEmail(userEmail, form.title, buffer, `resumo-${params.id}.pdf`)
            } catch (emailError) {
                console.error("Failed to send email", emailError)
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error submitting form:', error)
        return NextResponse.json({ error: 'Erro ao enviar resposta' }, { status: 500 })
    }
}
