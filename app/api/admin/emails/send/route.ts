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
        userIds?: string[]        // IDs dos usuários selecionados
        additionalEmails?: string[] // E-mails adicionais (não cadastrados)
        selectAll?: boolean       // Selecionar todos os usuários
    }
    subject: string
    content: string // HTML do e-mail
    previewText?: string // Texto de preview
}

// Template base para e-mails em massa
const getMarketingEmailTemplate = (content: string, previewText?: string) => {
    const logoUrl = 'https://www.domineaqui.com.br/logo.png'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://domineaqui.com.br'

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>DomineAqui</title>
      ${previewText ? `<meta name="x-apple-disable-message-reformatting">
      <!--[if !mso]><!-->
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <!--<![endif]-->
      <span style="display:none !important;visibility:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</span>` : ''}
      <style>
        /* Reset */
        body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        
        /* Base */
        body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #f4f7fa;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333333;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        
        .header {
          background: linear-gradient(135deg, #0f3d2e 0%, #1a5c45 100%);
          padding: 30px 20px;
          text-align: center;
        }
        
        .header img {
          max-height: 60px;
          width: auto;
        }
        
        .content {
          padding: 40px 30px;
          background-color: #ffffff;
        }
        
        .content h1, .content h2, .content h3 {
          color: #0f3d2e;
          margin-top: 0;
        }
        
        .content h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 20px;
        }
        
        .content h2 {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 15px;
        }
        
        .content p {
          margin: 0 0 16px 0;
          color: #4a5568;
          font-size: 16px;
        }
        
        .content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #f57c00 0%, #ff9800 100%);
          color: #ffffff !important;
          text-decoration: none;
          padding: 16px 36px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 16px;
          margin: 25px 0;
          text-align: center;
          box-shadow: 0 4px 15px rgba(245, 124, 0, 0.35);
          transition: all 0.3s ease;
        }
        
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 124, 0, 0.45);
        }
        
        .secondary-button {
          display: inline-block;
          background-color: transparent;
          color: #0f3d2e !important;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 15px;
          margin: 10px 5px;
          border: 2px solid #0f3d2e;
        }
        
        .highlight-box {
          background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
          border-left: 4px solid #f57c00;
          padding: 20px;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        
        .highlight-box p {
          margin: 0;
          color: #5d4037;
        }
        
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
          margin: 30px 0;
        }
        
        .feature-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin: 25px 0;
        }
        
        .feature-item {
          flex: 1;
          min-width: 200px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 12px;
          text-align: center;
        }
        
        .feature-icon {
          font-size: 32px;
          margin-bottom: 10px;
        }
        
        .footer {
          background-color: #fafbfc;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #edf2f7;
        }
        
        .footer p {
          margin: 5px 0;
          font-size: 13px;
          color: #718096;
        }
        
        .social-link {
          color: #f57c00;
          text-decoration: none;
          font-weight: bold;
        }
        
        .unsubscribe {
          margin-top: 15px;
          font-size: 11px;
          color: #a0aec0;
        }
        
        @media only screen and (max-width: 600px) {
          .content { padding: 25px 20px; }
          .header { padding: 20px; }
          .cta-button { padding: 14px 28px; font-size: 15px; }
          .content h1 { font-size: 24px; }
        }
      </style>
    </head>
    <body>
      <div style="background-color: #f4f7fa; padding: 20px 0;">
        <div class="email-container" style="border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div class="header">
            <img src="${logoUrl}" alt="DomineAqui" style="max-height: 60px;">
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>Siga-nos no Instagram: <a href="https://instagram.com/domineaqui.br" class="social-link" target="_blank">@domineaqui.br</a></p>
            <p>&copy; ${new Date().getFullYear()} DomineAqui. Todos os direitos reservados.</p>
            <p class="unsubscribe">
              Você está recebendo este e-mail por ser cadastrado no DomineAqui.<br>
              <a href="${appUrl}" style="color: #a0aec0;">Acessar plataforma</a>
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

        let emailList: string[] = []

        // Coletar e-mails dos usuários selecionados
        if (recipients.selectAll) {
            const allUsers = await usersCollection.find({}).project({ email: 1 }).toArray()
            emailList = allUsers.map(u => u.email)
        } else if (recipients.userIds && recipients.userIds.length > 0) {
            const { ObjectId } = await import('mongodb')
            const selectedUsers = await usersCollection
                .find({ _id: { $in: recipients.userIds.map(id => new ObjectId(id)) } })
                .project({ email: 1 })
                .toArray()
            emailList = selectedUsers.map(u => u.email)
        }

        // Adicionar e-mails extras
        if (recipients.additionalEmails && recipients.additionalEmails.length > 0) {
            const validEmails = recipients.additionalEmails.filter(email =>
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            )
            emailList = [...emailList, ...validEmails]
        }

        // Remover duplicatas
        emailList = [...new Set(emailList)]

        if (emailList.length === 0) {
            return NextResponse.json(
                { error: 'Nenhum destinatário válido encontrado' },
                { status: 400 }
            )
        }

        // Gerar HTML final
        const html = getMarketingEmailTemplate(content, previewText)

        // Enviar e-mails em lotes para evitar timeout
        const BATCH_SIZE = 50
        let sent = 0
        let failed = 0
        const errors: string[] = []

        for (let i = 0; i < emailList.length; i += BATCH_SIZE) {
            const batch = emailList.slice(i, i + BATCH_SIZE)

            const promises = batch.map(async (email) => {
                try {
                    await transporter.sendMail({
                        from: '"DomineAqui" <no-reply@domineaqui.com.br>',
                        to: email,
                        subject: subject,
                        html: html,
                    })
                    return { success: true, email }
                } catch (err) {
                    const error = err as Error
                    return { success: false, email, error: error.message }
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
            if (i + BATCH_SIZE < emailList.length) {
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        return NextResponse.json({
            success: true,
            message: `E-mails enviados: ${sent} de ${emailList.length}`,
            stats: {
                total: emailList.length,
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
