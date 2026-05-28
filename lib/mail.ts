
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Timeouts curtos para caber no maxDuration (30s) das funções serverless.
  // Sem eles, um handshake SMTP lento mata a função antes do envio rejeitar,
  // resultando em "e-mail não chega" sem nenhum erro nos logs.
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
})

// Estilos e Layout Base (Verde: #0f3d2e, Laranja: #f57c00)
const getEmailTemplate = (title: string, content: string) => {
  const resetUrl = process.env.NEXT_PUBLIC_APP_URL
  const logoUrl = 'https://www.domineaqui.com.br/logo.png' // Certifique-se que este link existe

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - DomineAqui</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; color: #333; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e1e4e8; }
        .header { background-color: #0f3d2e; padding: 30px 20px; text-align: center; background-image: linear-gradient(135deg, #0f3d2e 0%, #1a5c45 100%); }
        .logo { max-height: 50px; width: auto; }
        .content { padding: 40px 30px; line-height: 1.6; font-size: 16px; color: #4a5568; }
        .h1 { color: #0f3d2e; margin-top: 0; font-size: 24px; font-weight: 600; margin-bottom: 20px; }
        .button { display: inline-block; background-color: #f57c00; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 25px; margin-bottom: 10px; text-align: center; transition: background-color 0.2s; box-shadow: 0 2px 4px rgba(245, 124, 0, 0.3); }
        .button:hover { background-color: #e65100; }
        .footer { background-color: #fafbfc; padding: 25px; text-align: center; font-size: 13px; color: #718096; border-top: 1px solid #edf2f7; }
        .social-link { color: #f57c00; text-decoration: none; font-weight: bold; }
        .highlight { color: #f57c00; font-weight: bold; }
        hr { border: 0; height: 1px; background-color: #edf2f7; margin: 20px 0; }
        @media only screen and (max-width: 600px) {
          .content { padding: 25px 20px; }
          .header { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="DomineAqui" class="logo">
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>Siga-nos no Instagram: <a href="https://instagram.com/domineaqui.br" class="social-link" target="_blank">@domineaqui.br</a></p>
          <p>&copy; ${new Date().getFullYear()} DomineAqui. Todos os direitos reservados.</p>
          <p style="margin-top: 10px; font-size: 11px; opacity: 0.7;">Este é um e-mail automático, por favor não responda a este endereço.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`

  const content = `
    <h1 class="h1">Redefinição de Senha</h1>
    <p>Olá,</p>
    <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>DomineAqui</strong>.</p>
    <p>Se não foi você quem solicitou, fique tranquilo(a): sua conta continua segura e você pode ignorar este e-mail.</p>
    <p>Para criar uma nova senha, clique no botão abaixo (o link expira em 15 minutos):</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button" target="_blank">Redefinir Minha Senha</a>
    </div>
    <p style="margin-top: 30px; font-size: 0.9em; color: #718096;">
      Ou copie e cole este link no seu navegador:<br>
      <a href="${resetUrl}" style="color: #0f3d2e; word-break: break-all;">${resetUrl}</a>
    </p>
  `

  const html = getEmailTemplate('Redefinição de Senha', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: 'Redefinição de Senha - DomineAqui',
    html,
  })
}

export async function sendWelcomeEmail(email: string, name: string) {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`
  const firstName = (name || '').split(' ')[0] || 'aluno(a)'

  const content = `
    <h1 class="h1">Bem-vindo(a) ao DomineAqui, ${firstName}! 🚀</h1>
    <p>É uma alegria ter você conosco! Sua conta foi criada com sucesso.</p>
    <p><strong>IMPORTANTE:</strong> Para garantir a segurança da plataforma e liberar seu acesso completo, precisamos confirmar seu e-mail.</p>
    
    <p>Por favor, aguarde o e-mail de confirmação que enviamos separadamente ou clique no link abaixo se já o recebeu.</p>
    
    <div style="background-color: #fff8e1; border-left: 4px solid #f57c00; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #795548;"><strong>Dica de Ouro:</strong> Não perca nenhuma novidade, dica exclusiva e conteúdos extras no nosso Instagram!</p>
      <p style="margin-top: 10px;"><a href="https://instagram.com/domineaqui.br" style="color: #f57c00; font-weight: bold; text-decoration: none;">👉 Seguir @domineaqui.br</a></p>
    </div>

    <div style="text-align: center;">
      <a href="${loginUrl}" class="button" target="_blank">Acessar a Plataforma</a>
    </div>
  `

  const html = getEmailTemplate('Bem-vindo(a)!', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: `Bem-vindo(a) ao DomineAqui, ${firstName}!`,
    html,
  })
}

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`
  const firstName = (name || '').split(' ')[0] || 'aluno(a)'

  const content = `
    <h1 class="h1">Confirme seu E-mail</h1>
    <p>Olá, ${firstName}!</p>
    <p>Falta muito pouco para você começar a aproveitar tudo o que o <strong>DomineAqui</strong> tem a oferecer.</p>
    <p>Para garantir que este e-mail é realmente seu e liberar seu acesso completo à plataforma, precisamos que você clique no botão abaixo:</p>
    
    <div style="text-align: center;">
      <a href="${verifyUrl}" class="button" target="_blank">Confirmar Meu E-mail</a>
    </div>

    <p style="margin-top: 20px; font-size: 0.9em; color: #718096;">
      Se você não criou uma conta no DomineAqui, por favor ignore este e-mail.
    </p>
  `

  const html = getEmailTemplate('Confirme seu E-mail', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: 'Confirme seu cadastro - DomineAqui',
    html,
  })
}

export async function sendAccountDeletedEmail(email: string, name: string) {
  const firstName = (name || '').split(' ')[0] || 'aluno(a)'

  const content = `
    <h1 class="h1" style="color: #c53030;">Atualização sobre sua conta</h1>
    <p>Olá, ${firstName}.</p>
    <p>Informamos que sua conta no <strong>DomineAqui</strong> foi encerrada permanentemente pelos nossos administradores.</p>
    <p>Se você acredita que isso foi um engano ou deseja entender melhor o motivo, nossa equipe está à disposição para esclarecimentos.</p>
    
    <hr>
    
    <p>Para entrar em contato, responda a este e-mail ou fale conosco através dos nossos canais oficiais de suporte.</p>
  `

  const html = getEmailTemplate('Atualização da Conta', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: 'Aviso sobre sua conta - DomineAqui',
    html,
  })
}

export async function sendPlanPurchasedEmail(
  email: string,
  name: string,
  planName: string,
  durationMonths: number,
  amount?: number
) {
  const firstName = (name || '').split(' ')[0] || 'aluno(a)'
  const durationText = durationMonths === 0 || durationMonths > 300 ? 'Vitalício' : `${durationMonths} meses`
  const amountLine = amount
    ? `<p style="font-size:14px;color:#718096;">Valor cobrado: <strong style="color:#0f3d2e;">R$ ${amount.toFixed(2).replace('.', ',')}</strong></p>`
    : ''

  const content = `
    <h1 class="h1">Você agora é Premium! 🎉</h1>
    <p>Olá, ${firstName}!</p>
    <p>Estamos muito felizes em ter você como aluno Premium no <strong>DomineAqui</strong>.</p>

    <div style="background-color: #f0faf4; border: 1px solid #c6f0d8; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #43a047; font-weight: 700;">Comprovante de Pagamento</p>
      <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #0f3d2e;">${planName} — ${durationText}</p>
      ${amountLine}
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #718096;">Data: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
    </div>

    <div style="background-color: #e8f5e9; border-left: 4px solid #43a047; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1b5e20;"><strong>Agora você tem acesso a:</strong></p>
      <ul style="margin-top: 10px; margin-bottom: 0; padding-left: 20px;">
        <li>Questões ilimitadas</li>
        <li>Flashcards exclusivos</li>
        <li>Cronogramas personalizados</li>
        <li>Aulas e conteúdos premium</li>
      </ul>
    </div>

    <p>Aproveite ao máximo seus estudos e conte conosco para sua aprovação!</p>

    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button" target="_blank">Começar a Estudar</a>
    </div>
  `

  const html = getEmailTemplate('Bem-vindo ao Premium! 🚀', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: 'Parabéns! Sua jornada Premium começou 🚀',
    html,
  })
}

export async function sendDonationThanksEmail(
  email: string,
  name: string,
  amount: number,
  paidAt?: Date
) {
  const firstName = name && name !== 'Anônimo' ? name.split(' ')[0] : 'Apoiador'
  const dateStr = (paidAt || new Date()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const content = `
    <h1 class="h1">Obrigado pelo seu apoio! ❤️</h1>
    <p>Olá, ${firstName}!</p>
    <p>Recebemos sua doação com sucesso. Muito obrigado por acreditar no projeto e ajudar a manter a plataforma acessível para milhares de estudantes!</p>

    <div style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #e53e3e; font-weight: 700;">Comprovante de Doação</p>
      <p style="margin: 0 0 4px 0; font-size: 22px; font-weight: 800; color: #c53030;">R$ ${amount.toFixed(2).replace('.', ',')}</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #718096;">Data: ${dateStr}</p>
    </div>

    <p>Sua doação contribui diretamente para:</p>
    <ul style="padding-left: 20px; color: #4a5568;">
      <li>Manutenção dos servidores e infraestrutura</li>
      <li>Desenvolvimento de novos conteúdos e funcionalidades</li>
      <li>Manter o acesso gratuito para quem não pode pagar</li>
    </ul>

    <p>Você pode acompanhar seu nome no <a href="${process.env.NEXT_PUBLIC_APP_URL}/doar" style="color: #0f3d2e; font-weight: bold;">ranking de doadores</a>.</p>

    <p>Com carinho,<br><strong>Equipe DomineAqui</strong></p>
  `

  const html = getEmailTemplate('Obrigado pelo seu apoio!', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: `Obrigado pela sua doação de R$ ${amount.toFixed(2).replace('.', ',')} 💚`,
    html,
  })
}

export async function sendMaterialPurchasedEmail(
  email: string,
  name: string,
  itemTitle: string,
  amount: number
) {
  const firstName = name ? name.split(' ')[0] : 'Aluno'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  const content = `
    <h1 class="h1">Material liberado! 📚</h1>
    <p>Olá, ${firstName}!</p>
    <p>Seu pagamento foi confirmado e o acesso ao material foi liberado. Bons estudos!</p>

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #d97706; font-weight: 700;">Comprovante de Compra</p>
      <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #92400e;">${itemTitle}</p>
      <p style="margin: 4px 0 2px 0; font-size: 15px; font-weight: 700; color: #0f3d2e;">R$ ${amount.toFixed(2).replace('.', ',')}</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #718096;">Data: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
    </div>

    <div style="text-align: center;">
      <a href="${appUrl}/materiais" class="button" target="_blank">Acessar Meus Materiais</a>
    </div>
  `

  const html = getEmailTemplate('Material Liberado! 📚', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: `Acesso liberado: ${itemTitle}`,
    html,
  })
}

export async function sendManualClinicoPurchasedEmail(input: {
  email: string
  name: string
  planLabel: string
  planKey: 'semestral' | 'anual' | 'vitalicio'
  durationMonths: number | null
  amount: number
  expiresAt: Date | string | null
  paymentMethod?: string | null
}) {
  const firstName = input.name ? input.name.split(' ')[0] : 'Aluno'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const expiresDate = input.expiresAt ? new Date(input.expiresAt) : null
  const expiresStr = expiresDate
    ? expiresDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Acesso vitalício (não expira)'
  const durationStr = input.durationMonths
    ? `${input.durationMonths} ${input.durationMonths === 1 ? 'mês' : 'meses'}`
    : 'Para sempre'

  const content = `
    <h1 class="h1">Manual Clínico liberado! 🩺</h1>
    <p>Olá, ${firstName}!</p>
    <p>Seu pagamento foi confirmado e o Manual Clínico Premium foi liberado na sua conta.</p>

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #d97706; font-weight: 700;">Comprovante de Compra</p>
      <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #92400e;">Manual Clínico Premium — Plano ${input.planLabel}</p>
      <p style="margin: 4px 0 2px 0; font-size: 15px; font-weight: 700; color: #0f3d2e;">R$ ${input.amount.toFixed(2).replace('.', ',')}</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #718096;">Duração: <strong>${durationStr}</strong></p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #718096;">Expira em: <strong>${expiresStr}</strong></p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #718096;">Data da compra: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      ${input.paymentMethod ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #718096;">Pagamento: ${input.paymentMethod}</p>` : ''}
    </div>

    ${input.durationMonths ? `
    <p style="font-size: 13px; color: #555;">
      <strong>Renovação:</strong> ${input.paymentMethod === 'credit_card' || input.paymentMethod === 'card'
        ? 'No dia da expiração, enviaremos um e-mail com um link rápido para renovar com o seu cartão.'
        : 'Você poderá renovar a qualquer momento na página do Manual Clínico.'}
    </p>
    ` : ''}

    <div style="text-align: center;">
      <a href="${appUrl}/manual-clinico" class="button" target="_blank">Acessar Manual Clínico</a>
    </div>
  `

  const html = getEmailTemplate('Manual Clínico liberado!', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: input.email,
    subject: `Acesso liberado: Manual Clínico ${input.planLabel}`,
    html,
  })
}

export async function sendManualClinicoExpirationReminderEmail(input: {
  email: string
  name: string
  planLabel: string
  expiresAt: Date | string
  paymentMethod?: string | null
  daysRemaining: number
}) {
  const firstName = input.name ? input.name.split(' ')[0] : 'Aluno'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const expiresDate = new Date(input.expiresAt)
  const expiresStr = expiresDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const isCard = input.paymentMethod === 'credit_card' || input.paymentMethod === 'card'

  const content = `
    <h1 class="h1">Seu Manual Clínico ${input.daysRemaining <= 0 ? 'expirou' : 'está expirando'} ⏰</h1>
    <p>Olá, ${firstName}!</p>
    <p>O seu plano <strong>${input.planLabel}</strong> do Manual Clínico Premium ${input.daysRemaining <= 0 ? 'expirou em' : 'expira em'} <strong>${expiresStr}</strong>.</p>

    <div style="background-color: #fee2e2; border: 1px solid #fecaca; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #991b1b; font-weight: 600;">
        ${isCard
          ? 'Clique no botão abaixo para renovar com 1 clique usando seu cartão.'
          : 'Renove agora para não perder o acesso completo às patologias premium.'}
      </p>
    </div>

    <div style="text-align: center;">
      <a href="${appUrl}/manual-clinico?renew=1" class="button" target="_blank">${isCard ? 'Renovar com cartão' : 'Renovar agora'}</a>
    </div>

    <p style="font-size: 12px; color: #777; margin-top: 24px;">
      Se preferir, você pode desativar a renovação acessando <a href="${appUrl}/manual-clinico">/manual-clinico</a> e clicando em "Não quero renovar".
    </p>
  `

  const html = getEmailTemplate('Renove seu Manual Clínico', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: input.email,
    subject: input.daysRemaining <= 0
      ? `Manual Clínico expirou — renove em 1 clique`
      : `Seu Manual Clínico expira em ${expiresStr}`,
    html,
  })
}

export interface CartPurchasedEmailItem {
  itemType: 'material' | 'package'
  itemTitle: string
  price: number
}

export interface CartPurchasedEmailSkippedItem {
  itemType: 'material' | 'package'
  itemTitle?: string
  reason: 'invalid' | 'duplicate' | 'not_found' | 'already_owned' | 'included_in_cart_package'
  includedInPackageTitle?: string
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatBRLEmail(value: number) {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}

export async function sendCartPurchasedEmail(
  email: string,
  name: string,
  items: CartPurchasedEmailItem[],
  totalAmount: number,
  skippedItems: CartPurchasedEmailSkippedItem[] = []
) {
  const firstName = name ? name.split(' ')[0] : 'Aluno'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const dateLabel = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const rows = items.map((item, index) => {
    const bg = index % 2 === 0 ? '#fffdf5' : '#ffffff'
    const typeLabel = item.itemType === 'package' ? 'Pacote' : 'Material'
    const priceLabel = item.price <= 0 ? 'Grátis' : formatBRLEmail(item.price)
    return `
      <tr style="background-color: ${bg};">
        <td style="padding: 10px 12px; font-size: 13px; color: #92400e; font-weight: 600; border-bottom: 1px solid #fde68a;">${escapeHtml(item.itemTitle)}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #b45309; border-bottom: 1px solid #fde68a;">${typeLabel}</td>
        <td style="padding: 10px 12px; font-size: 13px; color: #0f3d2e; font-weight: 700; text-align: right; border-bottom: 1px solid #fde68a;">${priceLabel}</td>
      </tr>
    `
  }).join('')

  const relevantSkipped = skippedItems.filter(item =>
    item.reason === 'already_owned' || item.reason === 'included_in_cart_package'
  )

  const skippedHtml = relevantSkipped.length === 0 ? '' : `
    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 16px 18px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #c2410c; font-weight: 700;">Itens ajustados automaticamente</p>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #7c2d12; line-height: 1.6;">
        ${relevantSkipped.map(item => {
          const title = escapeHtml(item.itemTitle || 'Item')
          if (item.reason === 'included_in_cart_package') {
            const pkg = escapeHtml(item.includedInPackageTitle || 'um pacote do carrinho')
            return `<li><strong>${title}</strong> — já estava incluso no pacote <em>${pkg}</em>, não foi cobrado em duplicidade.</li>`
          }
          return `<li><strong>${title}</strong> — você já possuía este item, não foi cobrado novamente.</li>`
        }).join('')}
      </ul>
    </div>
  `

  const content = `
    <h1 class="h1">Carrinho liberado! 🛒</h1>
    <p>Olá, ${escapeHtml(firstName)}!</p>
    <p>Seu pagamento foi confirmado e o acesso a <strong>${items.length} ${items.length === 1 ? 'item' : 'itens'}</strong> foi liberado. Bons estudos!</p>

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <p style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #d97706; font-weight: 700;">Comprovante de Compra</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <thead>
          <tr style="background-color: #fef3c7;">
            <th align="left" style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #92400e;">Item</th>
            <th align="left" style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #92400e;">Tipo</th>
            <th align="right" style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #92400e;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 2px solid #fde68a;">
        <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">Total pago</p>
        <p style="margin: 0; font-size: 18px; font-weight: 800; color: #0f3d2e;">${formatBRLEmail(totalAmount)}</p>
      </div>
      <p style="margin: 8px 0 0 0; font-size: 12px; color: #718096;">Data: ${dateLabel}</p>
    </div>

    ${skippedHtml}

    <div style="text-align: center;">
      <a href="${appUrl}/materiais?tab=mine" class="button" target="_blank">Acessar Meus Materiais</a>
    </div>
  `

  const html = getEmailTemplate('Carrinho Liberado! 🛒', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: `Acesso liberado: ${items.length} ${items.length === 1 ? 'item' : 'itens'} do carrinho`,
    html,
  })
}

export async function sendSubscriptionCancelledEmail(email: string, name: string) {
  const firstName = (name || '').split(' ')[0] || 'aluno(a)'

  const content = `
    <h1 class="h1">Sentiremos sua falta 😢</h1>
    <p>Olá, ${firstName}.</p>
    <p>Confirmamos o cancelamento da sua assinatura no <strong>DomineAqui</strong>.</p>
    <p>Sua conta retornou para o plano Gratuito.</p>
    
    <p>Se houve algo que não atendeu às suas expectativas ou se houve algum erro, adoraríamos saber como melhorar. Você pode nos responder neste e-mail ou falar diretamente em <a href="mailto:contato@domineaqui.com.br">contato@domineaqui.com.br</a>.</p>

    <p>Esperamos ver você de volta em breve! Nossa plataforma está sempre evoluindo.</p>
  `

  const html = getEmailTemplate('Confirmação de Cancelamento', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: 'Sobre sua assinatura no DomineAqui',
    html,
  })
}

export async function sendOneTimePaymentEndedEmail(email: string, name: string) {
  const firstName = (name || '').split(' ')[0] || 'aluno(a)'

  const content = `
    <h1 class="h1">Seu acesso expirou ⌛</h1>
    <p>Olá, ${firstName}.</p>
    <p>O período do seu plano no <strong>DomineAqui</strong> chegou ao fim.</p>
    <p>Esperamos que os estudos tenham sido produtivos! Para continuar acessando as funcionalidades exclusivas (questões ilimitadas, flashcards, aulas), você pode renovar seu acesso agora mesmo.</p>

    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/buy" class="button" target="_blank">Renovar Acesso Premium</a>
    </div>

    <p style="margin-top: 15px;">Se preferir outro método de pagamento ou tiver dúvidas, entre em contato conosco.</p>
  `

  const html = getEmailTemplate('Seu plano expirou', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: 'Renove seu acesso ao DomineAqui',
    html,
  })
}

export async function sendFormSubmissionEmail(email: string, formTitle: string, pdfBuffer: Buffer, pdfName: string) {
  const content = `
    <h1 class="h1">Pesquisa Recebida! ✅</h1>
    <p>Olá,</p>
    <p>Obrigado por responder à pesquisa <strong>"${formTitle}"</strong>.</p>
    <p>Recebemos suas respostas com sucesso.</p>
    
    <p>Em anexo, você encontrará um PDF com o resumo das suas respostas.</p>
    
    <p>Agradecemos sua participação!</p>
  `

  const html = getEmailTemplate(`Recebemos sua resposta: ${formTitle}`, content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: `Confirmação de resposta: ${formTitle}`,
    html,
    attachments: [
      {
        filename: pdfName,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  })
}

// Interface para blocos de lead
interface LeadBlockForEmail {
  id: string
  type: 'text' | 'button' | 'card' | 'embed'
  content?: string
  buttonText?: string
  buttonUrl?: string
  buttonColor?: string
  isPdfButton?: boolean
  cardTitle?: string
  cardDescription?: string
  cardImageUrl?: string
  embedType?: 'video' | 'podcast' | 'audio'
  embedUrl?: string
  embedTitle?: string
  embedDescription?: string
}

function renderLeadBlocksToHtml(blocks: LeadBlockForEmail[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'text':
        return `<div style="margin: 20px 0;">${block.content || ''}</div>`

      case 'button':
        const btnColor = block.buttonColor || '#f57c00'
        return `
          <div style="text-align: center; margin: 25px 0;">
            <a href="${block.buttonUrl || '#'}" 
               style="display: inline-block; background-color: ${btnColor}; color: #ffffff !important; 
                      text-decoration: none; padding: 14px 28px; border-radius: 8px; 
                      font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" 
               target="_blank">
              ${block.isPdfButton ? '📄 ' : ''}${block.buttonText || 'Acessar'}
            </a>
          </div>
        `

      case 'card':
        return `
          <div style="border: 1px solid #e1e4e8; border-radius: 12px; padding: 20px; margin: 20px 0; background: #fafbfc;">
            ${block.cardImageUrl ? `<img src="${block.cardImageUrl}" alt="" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;" />` : ''}
            ${block.cardTitle ? `<h3 style="margin: 0 0 10px 0; color: #0f3d2e; font-size: 18px;">${block.cardTitle}</h3>` : ''}
            ${block.cardDescription ? `<p style="margin: 0; color: #4a5568;">${block.cardDescription}</p>` : ''}
          </div>
        `

      case 'embed':
        return `
          <div style="margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #0f3d2e 0%, #1a5c45 100%); border-radius: 12px;">
            ${block.embedTitle ? `<h3 style="margin: 0 0 10px 0; color: #ffffff; font-size: 16px;">${block.embedTitle}</h3>` : ''}
            ${block.embedDescription ? `<p style="margin: 0 0 15px 0; color: rgba(255,255,255,0.8); font-size: 14px;">${block.embedDescription}</p>` : ''}
            <a href="${block.embedUrl || '#'}" 
               style="display: inline-block; background-color: #f57c00; color: #ffffff !important; 
                      text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;" 
               target="_blank">
              ${block.embedType === 'video' ? '▶️ Assistir' : block.embedType === 'podcast' ? '🎙️ Ouvir Podcast' : '🎵 Ouvir Áudio'}
            </a>
          </div>
        `

      default:
        return ''
    }
  }).join('')
}

export async function sendLeadMaterialEmail(
  email: string,
  name: string,
  campaignName: string,
  subject: string,
  blocks: LeadBlockForEmail[]
) {
  const firstName = (name || '').split(' ')[0] || 'aluno(a)'
  const blocksHtml = renderLeadBlocksToHtml(blocks)

  const content = `
    <h1 class="h1">Olá, ${firstName}! 🎁</h1>
    <p>Obrigado pelo seu interesse em <strong>"${campaignName}"</strong>.</p>
    <p>Aqui está seu material exclusivo:</p>
    
    <hr style="border: 0; height: 1px; background: #edf2f7; margin: 25px 0;" />
    
    ${blocksHtml}
    
    <hr style="border: 0; height: 1px; background: #edf2f7; margin: 25px 0;" />
    
    <div style="background-color: #fff8e1; border-left: 4px solid #f57c00; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #795548;"><strong>Gostou do conteúdo?</strong> Siga-nos no Instagram para mais materiais exclusivos!</p>
      <p style="margin-top: 10px;"><a href="https://instagram.com/domineaqui.br" style="color: #f57c00; font-weight: bold; text-decoration: none;">👉 Seguir @domineaqui.br</a></p>
    </div>
  `

  const html = getEmailTemplate(subject, content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: subject,
    html,
  })
}

