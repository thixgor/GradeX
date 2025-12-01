import { google } from 'googleapis'

const GMAIL_CREDENTIALS = {
  type: 'service_account',
  project_id: 'gen-lang-client-0364822718',
  private_key_id: '0efd7d802c52d35f0e5bbd39057e1f49d216b46c',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9ygbx16G0rPtn\nWURvyOGNtptU5y4LsS0jslUgMoEL4KGg1t9wF92KIkk1DeLl7GotJrdQRSvgx8U+\nJ2ihXa5mtbFKkMWpob7IykyjsyRIIwPLkSjyLaCLGvBVQhCBxdhvJit605d2iH6d\nlFlwKtBsSiwaIO3fiRl+dFslVROmcQQESWzuMbZvAo/8MAJLy6ZLQXalQedGYiAH\nR3kKJSOWgx/Vk09kZmzi7235PSl7TLDilXDOjRw1DlpWRFapM9nQzNd9uTzCj8DK\nsD4W5Xvefu+xx4xgrASPkVUfX8PNCG3vx5/hsi1QLKUQ7EmCdKXEKHQjufZoFrlu\nLxRrRQu3AgMBAAECggEAHBTlfCk8uwARXtRdhPDDNvW6/BAMxxwbIroDUHVIlNpS\n7/p7KxnM5OB31orMdNrLRw0AeLcTa/oDHFQ2bhHveTEPH4pWROgy04DjYCFkj+vm\nZtt+pH7Nz2dYAjV5PcppYODT9COUuKwvl99YcHlVR4CeD+upZrbhd819owN4mdrD\nWjoJBd8/RDGqPHJhXCNW/+I5EJ8tqtKZySMw5JPIYjqV2Fofvix65M+I2EKS9meC\nOCHHfHhgfHC3QfndrRyY558+LD1/t3+GpLE96m96ySjIEXiWnZvBPkIVi+PiSEcD\nuC3oS8SYp/jRaBsP6Q5xmtYuajN2aE9PJzAoGwYHCQKBgQD4qEhcqBvTmCqxZGEI\nZL3CeY2tP4cJV0M0vo1+1F9edevsESIdSK81gvGthKfMz+W7wzOnY/DIS0WYn2S0\nsu0Px28PHdEHBOZUMaAxV3RaR5Hydiobxd7ZSCdb2Q/6bU6YVwNQWinn3MiS5xlg\noyozlJpI1psJYDRvbpOr2rV4FQKBgQDDZLt3f/kvi7X8r5reK0DPzVcml9tiTaAa\nrck1lu7L6WpmTGcOP9MsCq6I45WDtzDEtvGmZ1B0oKausCorNz1PqsxFk6IXxuv5\ng9BUq3JdvPP6qlhm26E+VuAr24n+bvoryZBREbZats3EJ1R0IPAkD5353toBjK7Z\njE95e3a7mwKBgBBD+c/N01wpBQnrlglVhbA2AVWG5U9wHN5TZLAaNk7YieE8Ua32\ntjda5HJETjGwm8eHglZ9zB9eBSRxsMW9OpKgqhwkCCtcX7C8Ok1f+iV5rwtcPW7p\np6Uw+hog/dGU2uJONtJHw5v+LkSlx1wx8C3Fl74SA7w+Rc/QPOqt+NbtAoGBAL7U\nNJrjK3UaF+TvhGsTBztsKn+QtDxv37vumqJyBEq2bqn2WHf8MbvDuu4Kh02arlCQ\n87U3Fcax19ioSKboTkLuZo5VP2vFZVXNPLxUrV+LWSUpFSlvuyztIAb1ZPJPZJk7\nRG1IxTYXbyLx3nOEb8RoVDtjQLtesK3bcQsOX8mdAoGALri+dJsKX6zlYdaKCVAo\nDdlgJYxMcPY97ArdX2X8KlMLkS28E72ZUGBuxelj3IxHWd2GfsCcDSDP4DQBjFVU\nPjYkmU8kAvgKsOKZjAHTdQrYGIg/D2RXyxrZTYJLTDdqxJeAzvzrC+wfLLZhkxRj\nNSxThaWmSsaoMB2xTCkpGFI=\n-----END PRIVATE KEY-----\n',
  client_email: 'domineaqui@gen-lang-client-0364822718.iam.gserviceaccount.com',
  client_id: '111991456659853666966',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/domineaqui%40gen-lang-client-0364822718.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com'
}

// Enviar email usando Gmail API
async function sendEmailViaGmail(to: string, subject: string, htmlContent: string) {
  try {
    console.log('Iniciando envio de email para:', to)
    
    const auth = new google.auth.GoogleAuth({
      credentials: GMAIL_CREDENTIALS as any,
      scopes: ['https://www.googleapis.com/auth/gmail.send']
    })

    const gmail = google.gmail({ version: 'v1', auth })

    // Criar mensagem de email com headers MIME corretos
    const emailLines = [
      `From: DomineAqui <${GMAIL_CREDENTIALS.client_email}>`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      htmlContent
    ]

    const message = emailLines.join('\r\n')

    // Codificar em base64 URL-safe
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    console.log('Enviando mensagem para Gmail API...')

    // Enviar email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    })

    console.log(`Email enviado com sucesso para ${to}. Message ID:`, response.data.id)
    return response.data
  } catch (error) {
    console.error('Erro ao enviar email via Gmail:', error)
    throw error
  }
}

// Template de email HTML
function getPremiumEmailTemplate(userName: string, planName: string, expiresAt: Date | undefined): string {
  const expirationText = expiresAt
    ? `Sua assinatura expira em: <strong>${expiresAt.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</strong>`
    : 'Sua assinatura é <strong>vitalícia</strong> - sem data de expiração!'

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #333;
        }
        .plan-info {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 30px 0;
          border-radius: 6px;
        }
        .plan-info h3 {
          margin: 0 0 15px 0;
          color: #667eea;
          font-size: 16px;
        }
        .plan-details {
          display: flex;
          justify-content: space-between;
          margin: 15px 0;
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .plan-details:last-child {
          border-bottom: none;
        }
        .plan-label {
          font-weight: 600;
          color: #555;
        }
        .plan-value {
          color: #667eea;
          font-weight: 700;
        }
        .benefits {
          background: #f0f4ff;
          padding: 20px;
          border-radius: 6px;
          margin: 30px 0;
        }
        .benefits h3 {
          margin: 0 0 15px 0;
          color: #667eea;
          font-size: 16px;
        }
        .benefits ul {
          margin: 0;
          padding-left: 20px;
          list-style: none;
        }
        .benefits li {
          margin: 10px 0;
          padding-left: 25px;
          position: relative;
        }
        .benefits li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #667eea;
          font-weight: bold;
          font-size: 18px;
        }
        .footer {
          background: #f8f9fa;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e0e0e0;
        }
        .footer p {
          margin: 10px 0;
          font-size: 14px;
          color: #666;
        }
        .footer strong {
          color: #667eea;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          border-radius: 6px;
          text-decoration: none;
          margin: 20px 0;
          font-weight: 600;
          transition: transform 0.2s;
        }
        .cta-button:hover {
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bem-vindo ao Premium!</h1>
          <p>Sua assinatura foi ativada com sucesso</p>
        </div>

        <div class="content">
          <div class="greeting">
            Olá <strong>${userName}</strong>,
          </div>

          <p>
            Parabéns! Você adquiriu o plano <strong>Premium ${planName}</strong> e agora tem acesso a todos os recursos exclusivos do DomineAqui.
          </p>

          <div class="plan-info">
            <h3>📋 Detalhes da sua Assinatura</h3>
            <div class="plan-details">
              <span class="plan-label">Plano:</span>
              <span class="plan-value">Premium ${planName}</span>
            </div>
            <div class="plan-details">
              <span class="plan-label">Data de Ativação:</span>
              <span class="plan-value">${new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="plan-details">
              <span class="plan-label">Expiração:</span>
              <span class="plan-value">${expirationText}</span>
            </div>
          </div>

          <div class="benefits">
            <h3>✨ Benefícios do seu Plano Premium</h3>
            <ul>
              <li>Acesso a todas as provas e questões</li>
              <li>20 provas pessoais por dia</li>
              <li>Análise detalhada de desempenho</li>
              <li>Suporte prioritário</li>
              <li>Conteúdo exclusivo e atualizado</li>
            </ul>
          </div>

          <p>
            Agora você pode aproveitar ao máximo a plataforma DomineAqui. Se tiver alguma dúvida ou precisar de ajuda, não hesite em nos contatar.
          </p>

          <center>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile" class="cta-button">
              Acessar meu Perfil
            </a>
          </center>
        </div>

        <div class="footer">
          <p>
            <strong>DomineAqui</strong> - Plataforma de Estudos
          </p>
          <p>
            Agradecemos muito pela sua confiança em nosso serviço!
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            Este é um email automático. Por favor, não responda este email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendPremiumActivationEmail(
  email: string,
  userName: string,
  planName: string,
  expiresAt: Date | undefined
): Promise<void> {
  try {
    const htmlContent = getPremiumEmailTemplate(userName, planName, expiresAt)

    await sendEmailViaGmail(
      email,
      `🎉 Bem-vindo ao Premium ${planName}! - DomineAqui`,
      htmlContent
    )

    console.log(`Email enviado com sucesso para ${email}`)
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    throw error
  }
}
