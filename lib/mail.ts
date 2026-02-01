
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`

    const logoUrl = 'https://www.domineaqui.com.br/logo.png'

    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redefinição de Senha - DomineAqui</title>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background-color: #0f3d2e; padding: 20px; text-align: center; }
        .logo { max-height: 60px; }
        .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
        .h1 { color: #0f3d2e; margin-top: 0; }
        .button { display: inline-block; background-color: #f57c00; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; margin-top: 20px; text-align: center; }
        .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #eeeeee; }
        @media only screen and (max-width: 600px) {
          .content { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="DomineAqui" class="logo">
        </div>
        <div class="content">
          <h1 class="h1">Redefinição de Senha requested</h1>
          <p>Olá,</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no DomineAqui.</p>
          <p>Se você não fez essa solicitação, pode ignorar este e-mail com segurança.</p>
          <p>Para redefinir sua senha, clique no botão abaixo (válido por 15 minutos):</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button" target="_blank">Redefinir senha</a>
          </div>
          <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
            Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br>
            <a href="${resetUrl}" style="color: #0f3d2e;">${resetUrl}</a>
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} DomineAqui. Todos os direitos reservados.</p>
          <p>Este é um e-mail automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `

    await transporter.sendMail({
        from: '"DomineAqui" <no-reply@domineaqui.com.br>',
        to: email,
        subject: 'Redefinição de Senha - DomineAqui',
        html,
    })
}
