import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import nodemailer from 'nodemailer'
import { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

interface EmailPayload {
    recipients: {
        userIds?: string[]
        additionalEmails?: string[]
        selectAll?: boolean
    }
    subject: string
    content: string
    previewText?: string
}

interface Recipient {
    email: string
    name: string
}

function personalize(text: string, name: string): string {
    const fullName = name || 'você'
    const firstName = fullName.split(' ')[0]
    return text
        .replace(/%nome completo%/gi, fullName)
        .replace(/%nome%/gi, firstName)
}

// Template base para e-mails em massa
const getMarketingEmailTemplate = (content: string, previewText?: string) => {
    const logoUrl = 'https://www.domineaqui.com.br/logo.png'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://domineaqui.com.br'

    return `
    <!DOCTYPE html>
    <html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="x-apple-disable-message-reformatting">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>DomineAqui</title>
      <style>
        :root { color-scheme: light dark; supported-color-schemes: light dark; }

        /* Reset */
        body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }

        /* Base */
        body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #eef3f0;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #1f2933;
        }

        .email-bg { background-color: #eef3f0; padding: 28px 14px; }

        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 18px 48px rgba(15, 61, 46, 0.14);
        }

        .header {
          background: linear-gradient(135deg, #0b3326 0%, #14533d 55%, #1a6b4d 100%);
          padding: 34px 20px;
          text-align: center;
        }

        .header img { max-height: 58px; width: auto; }

        .header-accent { height: 4px; background: linear-gradient(90deg, #f57c00 0%, #ffb74d 50%, #f57c00 100%); }

        .content { padding: 42px 34px; background-color: #ffffff; }

        .content h1, .content h2, .content h3, .hero-block h1, .list-block h2 { color: #0f3d2e; margin-top: 0; }
        .content h1, .hero-block h1 { font-size: 29px; font-weight: 800; line-height: 1.18; margin: 0 0 14px; letter-spacing: -0.4px; }
        .content h2, .list-block h2 { font-size: 22px; font-weight: 700; line-height: 1.28; margin: 0 0 14px; }
        .content p, .content li { color: #43505c; font-size: 16px; }
        .content p { margin: 0 0 16px 0; }
        .content img { max-width: 100%; height: auto; border-radius: 12px; }

        /* Blocks */
        .hero-block { text-align: center; margin: 0 0 30px; }
        .hero-block p { color: #43505c; font-size: 17px; margin: 0; }
        .text-block { margin: 18px 0; }
        .list-block { margin: 26px 0; }
        .list-block ul { padding-left: 22px; margin: 0; }
        .list-block li { margin: 9px 0; }
        .image-block { text-align: center; margin: 26px 0; }
        .image-block img { max-width: 100%; border-radius: 14px; }
        .button-block { text-align: center; margin: 28px 0; }

        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #f57c00 0%, #ff9b21 100%);
          color: #ffffff !important;
          text-decoration: none;
          padding: 16px 38px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 16px;
          letter-spacing: 0.2px;
          text-align: center;
          box-shadow: 0 8px 20px rgba(245, 124, 0, 0.32);
        }

        .secondary-button {
          display: inline-block;
          background-color: transparent;
          color: #0f3d2e !important;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 15px;
          margin: 10px 5px;
          border: 2px solid #0f3d2e;
        }

        .highlight-box {
          background: linear-gradient(135deg, #fff4d6 0%, #ffe6a8 100%);
          background-color: #fff4d6;
          border-left: 5px solid #f57c00;
          padding: 22px 24px;
          margin: 28px 0;
          border-radius: 14px;
          box-shadow: 0 6px 18px rgba(245, 124, 0, 0.12);
        }
        .highlight-box p { margin: 0 0 8px; color: #4a2f10; font-size: 16px; font-weight: 500; }
        .highlight-box p:last-child { margin-bottom: 0; }
        .highlight-box strong { color: #3a2408; font-weight: 800; }

        .quote-block {
          background: #f4fbf7;
          background-color: #f4fbf7;
          border-left: 5px solid #1a6b4d;
          border-radius: 14px;
          margin: 28px 0;
          padding: 26px 28px 24px;
        }
        .quote-block .quote-mark {
          display: block;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 52px;
          line-height: 0.4;
          color: #1a6b4d;
          opacity: 0.35;
          margin-bottom: 8px;
        }
        .quote-block .quote-text {
          margin: 0;
          color: #2d3b34;
          font-style: italic;
          font-size: 18px;
          line-height: 1.55;
        }
        .quote-block .quote-author {
          margin: 16px 0 0;
          color: #0f3d2e;
          font-style: normal;
          font-weight: 700;
          font-size: 15px;
        }
        .quote-block .quote-author:before { content: "— "; color: #1a6b4d; }

        .resource-card {
          border: 1px solid #d4e7dc;
          background: linear-gradient(135deg, #f4fbf7 0%, #ffffff 100%);
          background-color: #f4fbf7;
          border-radius: 18px;
          padding: 26px;
          margin: 30px 0;
        }
        .resource-card h2 { margin-top: 0; }
        .resource-badge {
          display: inline-block;
          margin: 0 0 12px 0;
          padding: 6px 12px;
          border-radius: 999px;
          background-color: #e4f6ec;
          color: #0f3d2e !important;
          font-size: 12px !important;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .divider { height: 1px; background: linear-gradient(90deg, transparent, #d9e3dd, transparent); margin: 32px 0; }

        .footer { background-color: #f6f9f7; padding: 30px; text-align: center; border-top: 1px solid #e4ece8; }
        .footer p { margin: 5px 0; font-size: 13px; color: #6a7b73; }
        .social-link { color: #f57c00; text-decoration: none; font-weight: bold; }
        .unsubscribe { margin-top: 15px; font-size: 11px; color: #9aa8a1; }

        @media only screen and (max-width: 600px) {
          .email-bg { padding: 14px 8px; }
          .content { padding: 28px 22px; }
          .header { padding: 24px 18px; }
          .cta-button { display: block; padding: 15px 24px; font-size: 15px; }
          .content h1, .hero-block h1 { font-size: 25px; }
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          body, .email-bg { background-color: #0c1411 !important; }
          .email-container { background-color: #15211c !important; box-shadow: none !important; }
          .content { background-color: #15211c !important; }
          .content h1, .content h2, .content h3, .hero-block h1, .list-block h2 { color: #58d6a0 !important; }
          .content p, .content li, .hero-block p, .text-block, .list-block li { color: #cdd9d3 !important; }
          .highlight-box {
            background: #3d2f10 !important;
            background-color: #3d2f10 !important;
            border-left-color: #ffb74d !important;
            box-shadow: none !important;
          }
          .highlight-box p { color: #ffe9c2 !important; }
          .highlight-box strong { color: #ffd98a !important; }
          .quote-block { background: #1b2a23 !important; background-color: #1b2a23 !important; border-left-color: #58d6a0 !important; }
          .quote-block .quote-mark { color: #58d6a0 !important; }
          .quote-block .quote-text { color: #e2ebe6 !important; }
          .quote-block .quote-author { color: #58d6a0 !important; }
          .quote-block .quote-author:before { color: #58d6a0 !important; }
          .resource-card { background: #1b2a23 !important; background-color: #1b2a23 !important; border-color: #2c3f36 !important; }
          .resource-badge { background-color: #173329 !important; color: #58d6a0 !important; }
          .divider { background: linear-gradient(90deg, transparent, #2a3a33, transparent) !important; }
          .footer { background-color: #101a16 !important; border-top-color: #1f2d27 !important; }
          .footer p, .unsubscribe { color: #849991 !important; }
        }
      </style>
    </head>
    <body>
      ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
      <div class="email-bg">
        <div class="email-container">
          <div class="header">
            <img src="${logoUrl}" alt="DomineAqui" style="max-height: 58px;">
          </div>
          <div class="header-accent"></div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>Siga-nos no Instagram: <a href="https://instagram.com/domineaqui.br" class="social-link" target="_blank">@domineaqui.br</a></p>
            <p>&copy; ${new Date().getFullYear()} DomineAqui. Todos os direitos reservados.</p>
            <p class="unsubscribe">
              Você está recebendo este e-mail por ser cadastrado no DomineAqui.<br>
              <a href="${appUrl}" style="color: #9aa8a1;">Acessar plataforma</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const body: EmailPayload = await request.json()
        const { recipients, subject, content, previewText } = body

        if (!subject || !content) {
            return NextResponse.json(
                { error: 'Assunto e conteúdo são obrigatórios' },
                { status: 400 }
            )
        }

        const db = await getDb()
        const usersCollection = db.collection<User>('users')

        let recipientList: Recipient[] = []

        if (recipients.selectAll) {
            const allUsers = await usersCollection.find({}).project({ email: 1, name: 1 }).toArray()
            recipientList = allUsers.map(u => ({ email: u.email, name: u.name || '' }))
        } else if (recipients.userIds && recipients.userIds.length > 0) {
            const { ObjectId } = await import('mongodb')
            const selectedUsers = await usersCollection
                .find({ _id: { $in: recipients.userIds.map(id => new ObjectId(id)) } })
                .project({ email: 1, name: 1 })
                .toArray()
            recipientList = selectedUsers.map(u => ({ email: u.email, name: u.name || '' }))
        }

        // Adicionar e-mails extras (sem nome cadastrado)
        if (recipients.additionalEmails && recipients.additionalEmails.length > 0) {
            const validExtras = recipients.additionalEmails
                .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                .map(email => ({ email, name: '' }))
            recipientList = [...recipientList, ...validExtras]
        }

        // Remover duplicatas por e-mail
        const seen = new Set<string>()
        recipientList = recipientList.filter(r => {
            if (seen.has(r.email)) return false
            seen.add(r.email)
            return true
        })

        if (recipientList.length === 0) {
            return NextResponse.json(
                { error: 'Nenhum destinatário válido encontrado' },
                { status: 400 }
            )
        }

        // Template base (sem personalização ainda)
        const templateHtml = getMarketingEmailTemplate(content, previewText)

        // Enviar e-mails em lotes para evitar timeout
        const BATCH_SIZE = 50
        let sent = 0
        let failed = 0
        const errors: string[] = []

        for (let i = 0; i < recipientList.length; i += BATCH_SIZE) {
            const batch = recipientList.slice(i, i + BATCH_SIZE)

            const promises = batch.map(async (recipient) => {
                try {
                    const personalizedHtml = personalize(templateHtml, recipient.name)
                    const personalizedSubject = personalize(subject, recipient.name)
                    await transporter.sendMail({
                        from: '"DomineAqui" <no-reply@domineaqui.com.br>',
                        to: recipient.email,
                        subject: personalizedSubject,
                        html: personalizedHtml,
                    })
                    return { success: true, email: recipient.email }
                } catch (err) {
                    const error = err as Error
                    return { success: false, email: recipient.email, error: error.message }
                }
            })

            const results = await Promise.all(promises)

            results.forEach(result => {
                if (result.success) {
                    sent++
                } else {
                    failed++
                    errors.push(`${result.email}: ${result.error}`)
                }
            })

            // Pequena pausa entre lotes para não sobrecarregar o servidor SMTP
            if (i + BATCH_SIZE < recipientList.length) {
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        return NextResponse.json({
            success: true,
            message: `E-mails enviados: ${sent} de ${recipientList.length}`,
            stats: {
                total: recipientList.length,
                sent,
                failed,
            },
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limita a 10 erros
        })
    } catch (error) {
        console.error('Send email error:', error)
        return NextResponse.json(
            { error: 'Erro ao enviar e-mails' },
            { status: 500 }
        )
    }
}
