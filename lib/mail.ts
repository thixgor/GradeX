
import nodemailer from 'nodemailer'
import { personalize } from '@/lib/comms/email-render'
import { ADMIN_EMAILS } from '@/lib/constants'

// Transporter compartilhado (pooled). O SMTP da Hostinger derruba conexões sob
// rajada — daí os erros de "auth limit". O pool reaproveita poucas conexões e
// limita a taxa de saída, eliminando a maior parte das falhas em lote mesmo
// antes da fila assíncrona (lib/comms) entrar em ação.
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true,
  maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS) || 2,
  maxMessages: Number(process.env.SMTP_MAX_MESSAGES) || 50,
  // No máx. `rateLimit` mensagens por `rateDelta` ms (padrão: 3/seg).
  rateDelta: 1000,
  rateLimit: Number(process.env.SMTP_RATE_LIMIT) || 3,
  // Timeouts explícitos: sem eles, quando a Hostinger derruba/segura a conexão
  // sob rajada ("auth limit"), o sendMail fica pendurado até o serverless
  // estourar o maxDuration — o gateway então responde 504 com corpo em texto
  // ("An error occurred…"), que o front tenta ler como JSON e quebra. Falhar
  // rápido devolve o erro para o retry/backoff da fila em vez de travar tudo.
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT) || 10_000,
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT) || 10_000,
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT) || 20_000,
})

/**
 * Entrega avisos transacionais ANTES de a rota responder.
 *
 * Disparar `void (async () => …)()` e devolver a resposta parece a troca certa
 * (a pessoa não espera pelo SMTP), mas em serverless não existe "depois": a
 * instância congela assim que a resposta sai, e o `sendMail` que estava no meio
 * do handshake morre calado — sem erro, sem log, sem e-mail. Foi assim que os
 * avisos de solicitação PROUNI/FIES sumiram enquanto os de aprovação, que
 * saíam de rotas com mais trabalho pela frente, chegavam quase sempre.
 *
 * O orçamento existe para que esperar não vire refém do provedor: passado o
 * prazo, a rota responde e o envio segue até onde a instância viver. É o mesmo
 * raciocínio dos timeouts do transporter acima — falhar rápido, nunca pendurar.
 */
export async function deliverTransactionalEmails(
  tasks: Array<Promise<unknown>>,
  budgetMs = 8_000
): Promise<void> {
  if (tasks.length === 0) return

  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      // As funções de envio já engolem o próprio erro; o `catch` aqui é para
      // que um rejeitado inesperado não vire unhandled rejection.
      Promise.all(tasks.map((task) => Promise.resolve(task).catch(() => undefined))),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, budgetMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

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
  const firstName = name.split(' ')[0]

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

// E-mail de revisão espaçada / retenção: reengaja quem parou de estudar há
// alguns dias, apoiado no streak (aversão à perda) e na questão do dia.
export async function sendSpacedReviewEmail(input: {
  email: string
  name: string
  streakDays: number
  diasParado: number
}) {
  const firstName = (input.name || '').split(' ')[0] || 'estudante'
  const studyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`

  const streakLine =
    input.streakDays > 0
      ? `<p>Você tem uma sequência de <strong>${input.streakDays} dia${input.streakDays > 1 ? 's' : ''}</strong> de estudo. Não deixe ela zerar.</p>`
      : `<p>Bora recomeçar sua sequência de estudos hoje? O primeiro dia é o mais importante.</p>`

  const content = `
    <h1 class="h1">Faz ${input.diasParado} dias, ${firstName}. Bora voltar?</h1>
    <p>A revisão espaçada só funciona se você mantém o ritmo. Um pouco todo dia vale mais que maratona véspera de prova.</p>
    ${streakLine}
    <div style="background-color: #fff8e1; border-left: 4px solid #f57c00; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #795548;"><strong>Sua questão do dia já está no painel.</strong> Responde uma agora, leva menos de um minuto.</p>
    </div>
    <div style="text-align: center;">
      <a href="${studyUrl}" class="button" target="_blank">Estudar agora</a>
    </div>
  `

  const html = getEmailTemplate('Bora voltar a estudar?', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: input.email,
    subject: `${firstName}, sua questão do dia está te esperando`,
    html,
  })
}

// E-mail de perfil incompleto: lembrete leve e pouco frequente (cron
// /api/cron/profile-reminder) pedindo pra completar telefone/estado/dados da
// profissão — usado pra melhorar recomendações e experiência no site.
export async function sendProfileReminderEmail(input: {
  email: string
  name: string
  missing: string[]
}) {
  const firstName = (input.name || '').split(' ')[0] || 'por aí'
  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profile`

  const itemsHtml = input.missing
    .map((label) => `<li style="margin-bottom: 8px;">${label}</li>`)
    .join('')

  const content = `
    <h1 class="h1">Ei, ${firstName}! Falta pouquinho 👋</h1>
    <p>Reparei aqui que seu perfil no <strong>DomineAqui</strong> ainda tá com alguns dados em branco. Nada grave — só um detalhe rápido que ajuda a gente a te entregar questões, materiais e recomendações mais na sua cara, de acordo com o seu momento.</p>
    <div style="background-color: #fff8e1; border-left: 4px solid #f57c00; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #795548;"><strong>O que falta preencher:</strong></p>
      <ul style="margin: 0; padding-left: 20px; color: #795548;">
        ${itemsHtml}
      </ul>
    </div>
    <p>Leva menos de 1 minuto, prometo. Bora lá?</p>
    <div style="text-align: center;">
      <a href="${profileUrl}" class="button" target="_blank">Atualizar meus dados</a>
    </div>
    <p style="margin-top: 30px; font-size: 0.85em; color: #718096;">
      Relaxa que a gente não vai ficar te enchendo com isso toda hora — é só um lembrete de vez em quando. 😉
    </p>
  `

  const html = getEmailTemplate('Atualize seu perfil', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: input.email,
    subject: `${firstName}, falta pouco pra completar seu perfil ✍️`,
    html,
  })
}

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`
  const firstName = name.split(' ')[0]

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

export async function sendLoginCodeEmail(email: string, name: string, code: string) {
  const firstName = name ? name.split(' ')[0] : ''

  const content = `
    <h1 class="h1">Código de acesso de administrador 🔐</h1>
    <p>Olá${firstName ? `, ${firstName}` : ''}!</p>
    <p>Detectamos uma tentativa de login na conta de <strong>administrador</strong> do <strong>DomineAqui</strong>. Para concluir o acesso, digite o código de verificação abaixo:</p>

    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background-color: #0f3d2e; color: #ffffff; font-size: 34px; font-weight: 800; letter-spacing: 10px; padding: 18px 30px; border-radius: 12px; font-family: 'Courier New', Courier, monospace;">
        ${code}
      </div>
    </div>

    <p style="text-align: center; color: #718096; font-size: 14px;">Este código expira em <strong>10 minutos</strong>.</p>

    <div style="background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #9b2c2c; font-size: 14px;">
        <strong>Não foi você?</strong> Se você não tentou fazer login, alguém pode estar com sua senha.
        Recomendamos trocá-la imediatamente. <strong>Nunca compartilhe este código.</strong>
      </p>
    </div>
  `

  const html = getEmailTemplate('Código de acesso', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: `${code} é o seu código de acesso de administrador`,
    html,
  })
}

/**
 * Código de confirmação para esvaziar o banco de dados.
 *
 * É o fator que separa "tem o cookie do admin" de "tem a caixa de entrada do
 * admin". Por isso o e-mail conta ONDE e DE ONDE a tentativa partiu: se chegar
 * sem que ninguém tenha pedido, ele próprio é o alerta de invasão.
 */
export async function sendDatabaseResetCodeEmail(input: {
  email: string
  nome?: string
  codigo: string
  ip?: string
  dispositivo?: string
}) {
  const primeiroNome = input.nome ? input.nome.split(' ')[0] : ''

  const content = `
    <h1 class="h1">Confirmação para esvaziar o banco de dados 🚨</h1>
    <p>Olá${primeiroNome ? `, ${primeiroNome}` : ''}!</p>
    <p>Alguém com acesso de <strong>administrador</strong> solicitou o esvaziamento completo do banco de dados do <strong>DomineAqui</strong>.</p>

    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background-color: #7f1d1d; color: #ffffff; font-size: 34px; font-weight: 800; letter-spacing: 10px; padding: 18px 30px; border-radius: 12px; font-family: 'Courier New', Courier, monospace;">
        ${input.codigo}
      </div>
    </div>

    <p style="text-align: center; color: #718096; font-size: 0.9em;">O código expira em 5 minutos.</p>

    <div style="background-color: #fef2f2; border: 2px solid #fca5a5; border-radius: 10px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-weight: 700; color: #991b1b;">Detalhes da solicitação</p>
      <p style="margin: 0; font-size: 0.9em; color: #7f1d1d;">
        Endereço IP: <strong>${input.ip || 'desconhecido'}</strong><br>
        Dispositivo: <strong>${input.dispositivo || 'desconhecido'}</strong>
      </p>
    </div>

    <p style="color: #991b1b; font-weight: 700;">Se não foi você quem pediu isso, NÃO informe este código a ninguém e troque sua senha imediatamente — sua conta de administrador pode estar comprometida.</p>
  `

  const html = getEmailTemplate('Confirmação para esvaziar o banco de dados', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: input.email,
    subject: '🚨 Código de confirmação — esvaziamento do banco de dados',
    html,
  })
}

export async function sendAccountDeletedEmail(email: string, name: string) {
  const firstName = name.split(' ')[0]

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
  const firstName = name.split(' ')[0]
  const durationText = durationMonths === 0 || durationMonths > 300 ? 'Vitalício' : `${durationMonths} meses`
  const amountLine = amount
    ? `<p style="font-size:14px;color:#718096;">Valor cobrado: <strong style="color:#0f3d2e;">R$ ${amount.toFixed(2).replace('.', ',')}</strong></p>`
    : ''

  const content = `
    <h1 class="h1">Você agora é Plus+! 🎉</h1>
    <p>Olá, ${firstName}!</p>
    <p>Estamos muito felizes em ter você como assinante Plus+ no <strong>DomineAqui</strong>.</p>

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

  const html = getEmailTemplate('Bem-vindo ao Plus+! 🚀', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: 'Parabéns! Sua jornada Plus+ começou 🚀',
    html,
  })
}

export async function sendMaterialPurchasedEmail(
  email: string,
  name: string,
  itemTitle: string,
  amount: number,
  attachments: MaterialEmailAttachment[] = []
) {
  const firstName = name ? name.split(' ')[0] : 'Aluno'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const hasPdf = attachments.length > 0

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

    ${hasPdf ? `<p>Para facilitar, enviamos o material também em anexo, em PDF.</p>${materialAttachmentsBlock(attachments)}` : ''}

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
    attachments: hasPdf ? toPdfMailAttachments(attachments) : undefined,
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
    <p>Seu pagamento foi confirmado e o Manual Clínico Completo foi liberado na sua conta.</p>

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #d97706; font-weight: 700;">Comprovante de Compra</p>
      <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #92400e;">Manual Clínico Completo — Plano ${input.planLabel}</p>
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
    <p>O seu plano <strong>${input.planLabel}</strong> do Manual Clínico Completo ${input.daysRemaining <= 0 ? 'expirou em' : 'expira em'} <strong>${expiresStr}</strong>.</p>

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

/** Anexo de PDF de material (com marca d'água) para os e-mails de compra. */
export interface MaterialEmailAttachment {
  title: string
  filename: string
  buffer: Buffer
}

/**
 * Bloco HTML que lista o(s) PDF(s) anexado(s) + aviso de direitos autorais, e
 * (opcional) o aviso de ativação restrita ao e-mail da compra.
 */
function materialAttachmentsBlock(
  attachments: MaterialEmailAttachment[],
  opts?: { restrictedEmail?: string; deliveredToEmail?: string }
): string {
  if (!attachments || attachments.length === 0) return ''
  const multiple = attachments.length > 1
  const list = attachments
    .map(a => `<li style="margin-bottom: 4px;">${escapeHtml(a.title)}</li>`)
    .join('')
  // Aviso explícito de que o PDF foi entregue na conta de e-mail da compra —
  // exibido quando o material tem o envio automático de PDF habilitado (junto
  // do download), deixando claro que o arquivo já está anexado neste e-mail.
  const deliveredNote = opts?.deliveredToEmail
    ? `
    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-left: 4px solid #059669; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 14px; color: #065f46;">
        <strong>📎 PDF enviado para o seu e-mail:</strong> como o download deste material está habilitado, o${multiple ? 's' : ''} arquivo${multiple ? 's' : ''} em PDF ${multiple ? 'já seguem anexados' : 'já segue anexado'} neste e-mail, na conta <strong>${escapeHtml(opts.deliveredToEmail)}</strong>. Você não precisa fazer login para baixá-lo${multiple ? 's' : ''}.
      </p>
    </div>
    `
    : ''
  const restrictNote = opts?.restrictedEmail
    ? `
    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 14px 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 13px; color: #7c2d12;">
        <strong>Acesso restrito:</strong> a ativação da sua Serial Key é privativa e só pode ser feita em uma conta com o e-mail <strong>${escapeHtml(opts.restrictedEmail)}</strong> — o mesmo usado na compra. Não é possível ativar em uma conta com outro e-mail.
      </p>
    </div>
    `
    : ''
  return `
    ${deliveredNote}
    <div style="background-color: #f0faf4; border: 1px solid #c6f0d8; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #43a047; font-weight: 700;">
        Material${multiple ? 's' : ''} em anexo (PDF)
      </p>
      <ul style="margin: 0; padding-left: 18px; color: #0f3d2e; font-weight: 600; font-size: 14px;">
        ${list}
      </ul>
    </div>
    ${restrictNote}
    <p style="font-size: 12px; color: #718096;">
      <strong>Direitos autorais:</strong> o(s) arquivo(s) contêm uma marca d'água exclusiva vinculada à sua compra e são protegidos por direitos autorais. O uso é pessoal e intransferível — a reprodução, o compartilhamento ou a redistribuição, total ou parcial, são proibidos.
    </p>
  `
}

/** Converte os anexos de material para o formato do nodemailer. */
function toPdfMailAttachments(attachments: MaterialEmailAttachment[]) {
  return (attachments || []).map(a => ({
    filename: a.filename,
    content: a.buffer,
    contentType: 'application/pdf',
  }))
}

export async function sendCartPurchasedEmail(
  email: string,
  name: string,
  items: CartPurchasedEmailItem[],
  totalAmount: number,
  skippedItems: CartPurchasedEmailSkippedItem[] = [],
  attachments: MaterialEmailAttachment[] = []
) {
  const firstName = name ? name.split(' ')[0] : 'Aluno'
  const hasPdf = attachments.length > 0
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

    ${hasPdf ? `<p>Para facilitar, enviamos em anexo o(s) PDF(s) dos materiais elegíveis.</p>${materialAttachmentsBlock(attachments)}` : ''}

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
    attachments: hasPdf ? toPdfMailAttachments(attachments) : undefined,
  })
}

export async function sendSubscriptionCancelledEmail(email: string, name: string) {
  const firstName = name.split(' ')[0]

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
  const firstName = name.split(' ')[0]

  const content = `
    <h1 class="h1">Seu acesso expirou ⌛</h1>
    <p>Olá, ${firstName}.</p>
    <p>O período do seu plano no <strong>DomineAqui</strong> chegou ao fim.</p>
    <p>Esperamos que os estudos tenham sido produtivos! Para continuar acessando as funcionalidades exclusivas (questões ilimitadas, flashcards, aulas), você pode renovar seu acesso agora mesmo.</p>

    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/buy" class="button" target="_blank">Renovar Acesso Plus+</a>
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

/**
 * E-mail de entrega manual de PDF disparado por um administrador — usado
 * quando o comprador não consegue baixar pelo visualizador protegido (ex.:
 * pedido de reembolso por não conseguir acessar o arquivo). O PDF anexado já
 * contém a marca d'água do usuário, aplicada antes do envio.
 */
export async function sendMaterialPdfDeliveryEmail(input: {
  email: string
  name: string
  items: { title: string; filename: string; buffer: Buffer }[]
}) {
  const firstName = input.name ? input.name.split(' ')[0] : 'Aluno'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const multiple = input.items.length > 1

  const itemsList = input.items
    .map(item => `<li style="margin-bottom: 4px;">${escapeHtml(item.title)}</li>`)
    .join('')

  const content = `
    <h1 class="h1">Seu material em anexo 📎</h1>
    <p>Olá, ${firstName}!</p>
    <p>Conforme solicitado, nossa equipe está enviando o material abaixo diretamente para o seu e-mail, em formato PDF.</p>

    <div style="background-color: #f0faf4; border: 1px solid #c6f0d8; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #43a047; font-weight: 700;">
        Material${multiple ? 's' : ''} enviado${multiple ? 's' : ''} em anexo
      </p>
      <ul style="margin: 0; padding-left: 18px; color: #0f3d2e; font-weight: 600; font-size: 14px;">
        ${itemsList}
      </ul>
    </div>

    <p style="font-size: 13px; color: #718096;">
      Este arquivo contém uma marca d'água exclusiva vinculada à sua conta, para uso pessoal e intransferível — assim como o restante do conteúdo da plataforma.
    </p>

    <div style="text-align: center;">
      <a href="${appUrl}/materiais" class="button" target="_blank">Ver meus materiais</a>
    </div>
  `

  const html = getEmailTemplate('Seu material em anexo', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: input.email,
    subject: multiple
      ? `Seus materiais em anexo (${input.items.length} arquivos)`
      : `Seu material em anexo: ${input.items[0]?.title || ''}`,
    html,
    attachments: input.items.map(item => ({
      filename: item.filename,
      content: item.buffer,
      contentType: 'application/pdf',
    })),
  })
}

/**
 * Confirmação de aquisição enviada pelo admin: avisa o comprador que ele
 * adquiriu o produto e já tem acesso, anexando o(s) PDF(s) com marca d'água.
 *
 * Diferente de `sendMaterialPdfDeliveryEmail` (enquadrado como "conforme
 * solicitado", para quem não conseguiu baixar), aqui o enquadramento é o de
 * uma confirmação de compra/entrega.
 *
 * Para compras feitas SEM login (convidado), informe `serialKey` e
 * `activationUrl`: o e-mail passa a incluir a serial key em destaque e o botão
 * de ativação, deixando claro que o acesso fica vinculado exclusivamente ao
 * e-mail usado na compra.
 */
export async function sendMaterialAcquiredEmail(input: {
  email: string
  name: string
  items: { title: string; filename: string; buffer: Buffer }[]
  serialKey?: string
  activationUrl?: string
}) {
  const firstName = input.name ? input.name.split(' ')[0] : 'Aluno'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const multiple = input.items.length > 1
  const hasSerial = Boolean(input.serialKey && input.activationUrl)

  const itemsList = input.items
    .map(item => `<li style="margin-bottom: 4px;">${escapeHtml(item.title)}</li>`)
    .join('')

  const serialBlock = hasSerial
    ? `
    <hr>
    <p style="margin-top: 20px;">Como esta compra foi feita <strong>sem login</strong>, use a sua <strong>Serial Key</strong> abaixo para liberar o acesso no site. O acesso fica vinculado exclusivamente a este e-mail (<strong>${escapeHtml(input.email)}</strong>).</p>

    <div style="background: linear-gradient(135deg, #0f3d2e, #1a5c45); border-radius: 12px; padding: 22px 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #a7f3d0; font-weight: 700;">Sua Serial Key</p>
      <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 2px; word-break: break-all;">${escapeHtml(input.serialKey!)}</p>
    </div>

    <div style="text-align: center;">
      <a href="${input.activationUrl}" class="button" target="_blank">Ativar meu acesso</a>
    </div>

    <p style="margin-top: 16px; font-size: 13px; color: #718096; text-align: center;">
      Ou copie e cole este link de ativação no seu navegador:<br>
      <a href="${input.activationUrl}" style="color: #0f3d2e; word-break: break-all;">${input.activationUrl}</a>
    </p>
    `
    : `
    <div style="text-align: center;">
      <a href="${appUrl}/materiais" class="button" target="_blank">Acessar meus materiais</a>
    </div>
    `

  const content = `
    <h1 class="h1">Produto adquirido — acesso liberado! 🎉</h1>
    <p>Olá, ${firstName}!</p>
    <p>Este e-mail confirma que você <strong>adquiriu o produto</strong> e <strong>já tem acesso</strong>. Para facilitar, enviamos o material abaixo diretamente em anexo, em PDF.</p>

    <div style="background-color: #f0faf4; border: 1px solid #c6f0d8; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #43a047; font-weight: 700;">
        Material${multiple ? 's' : ''} em anexo
      </p>
      <ul style="margin: 0; padding-left: 18px; color: #0f3d2e; font-weight: 600; font-size: 14px;">
        ${itemsList}
      </ul>
    </div>

    <p style="font-size: 13px; color: #718096;">
      Este arquivo contém uma marca d'água exclusiva vinculada à sua compra, para uso pessoal e intransferível — assim como o restante do conteúdo da plataforma.
    </p>

    ${serialBlock}
  `

  const html = getEmailTemplate('Produto adquirido', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: input.email,
    subject: multiple
      ? `Acesso liberado — seus materiais em anexo (${input.items.length} arquivos)`
      : `Acesso liberado — ${input.items[0]?.title || 'seu material'} em anexo`,
    html,
    attachments: input.items.map(item => ({
      filename: item.filename,
      content: item.buffer,
      contentType: 'application/pdf',
    })),
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
  blocks: LeadBlockForEmail[],
  city?: string
) {
  const firstName = name.split(' ')[0]
  // Blocos são autorados pelo admin e podem conter %nome%, %nome completo% e
  // %cidade% — personalizados aqui com os dados reais do lead.
  const blocksHtml = personalize(renderLeadBlocksToHtml(blocks), name, city)

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

  const html = getEmailTemplate(personalize(subject, name, city), content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: email,
    subject: personalize(subject, name, city),
    html,
  })
}


// ============================================================
// RIFAS / SORTEIOS
// ============================================================

function formatRaffleNumbers(numbers: number[], total: number): string {
  const width = String(total).length
  return numbers
    .slice()
    .sort((a, b) => a - b)
    .map(n => String(n).padStart(width, '0'))
    .join(', ')
}

/** Confirmação de compra de números da rifa (pagamento aprovado). */
export async function sendRafflePurchaseEmail(input: {
  email: string
  name: string
  raffleName: string
  raffleSlug: string
  prizeName: string
  numbers: number[]
  totalNumbers: number
  amount: number
}) {
  const firstName = input.name ? input.name.split(' ')[0] : 'Participante'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const numbersStr = formatRaffleNumbers(input.numbers, input.totalNumbers)

  const content = `
    <h1 class="h1">Compra confirmada! 🎟️</h1>
    <p>Olá, ${firstName}!</p>
    <p>Seu pagamento foi aprovado e seus números na rifa <strong>${input.raffleName}</strong> estão garantidos. Boa sorte!</p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #059669; font-weight: 700;">Seus números</p>
      <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 800; color: #047857; word-break: break-word;">${numbersStr}</p>
      <p style="margin: 0; font-size: 13px; color: #718096;">Prêmio: <strong>${input.prizeName}</strong></p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #718096;">Total pago: <strong>R$ ${input.amount.toFixed(2).replace('.', ',')}</strong></p>
    </div>

    <p>Acompanhe o andamento e o sorteio ao vivo na página da rifa.</p>
    <p style="text-align:center;"><a href="${appUrl}/rifas/${input.raffleSlug}" class="button">Acompanhar a rifa</a></p>

    <p>Boa sorte!<br><strong>Equipe DomineAqui</strong></p>
  `

  const html = getEmailTemplate('Compra confirmada', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: input.email,
    subject: `🎟️ Seus números na rifa "${input.raffleName}" estão garantidos!`,
    html,
  })
}

/** Aviso ao ganhador da rifa. */
export async function sendRaffleWinnerEmail(input: {
  email: string
  name: string
  raffleName: string
  raffleSlug: string
  prizeName: string
  number: number
  totalNumbers: number
}) {
  const firstName = input.name ? input.name.split(' ')[0] : 'Ganhador(a)'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const numberStr = String(input.number).padStart(String(input.totalNumbers).length, '0')

  const content = `
    <h1 class="h1">Parabéns, você ganhou! 🎉</h1>
    <p>Olá, ${firstName}!</p>
    <p>Temos uma ótima notícia: o número <strong>${numberStr}</strong> foi sorteado na rifa <strong>${input.raffleName}</strong> — e ele é seu!</p>

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 18px 20px; margin: 20px 0; text-align:center;">
      <p style="margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #b45309; font-weight: 700;">Número vencedor</p>
      <p style="margin: 0 0 10px 0; font-size: 34px; font-weight: 900; color: #92400e;">${numberStr}</p>
      <p style="margin: 0; font-size: 15px; color: #78350f;">Prêmio: <strong>${input.prizeName}</strong></p>
    </div>

    <p>Em breve nossa equipe entrará em contato para combinar a entrega do prêmio. Caso prefira, responda este e-mail ou fale conosco pelo Instagram.</p>
    <p style="text-align:center;"><a href="${appUrl}/rifas/${input.raffleSlug}" class="button">Ver resultado da rifa</a></p>

    <p>Mais uma vez, parabéns!<br><strong>Equipe DomineAqui</strong></p>
  `

  const html = getEmailTemplate('Você ganhou!', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: input.email,
    subject: `🎉 Parabéns! Você ganhou a rifa "${input.raffleName}"`,
    html,
  })
}

/** Notifica o administrador sobre o resultado do sorteio. */
export async function sendRaffleAdminResultEmail(input: {
  raffleName: string
  prizeName: string
  winners: { number: number; name?: string; email?: string }[]
  totalNumbers: number
}) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER
  if (!adminEmail) return

  const rows = input.winners
    .map(w => {
      const numStr = String(w.number).padStart(String(input.totalNumbers).length, '0')
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #edf2f7;font-weight:700;color:#0f3d2e;">${numStr}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #edf2f7;color:#4a5568;">${w.name || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #edf2f7;color:#4a5568;">${w.email || '—'}</td>
      </tr>`
    })
    .join('')

  const content = `
    <h1 class="h1">Sorteio realizado 🎯</h1>
    <p>A rifa <strong>${input.raffleName}</strong> (prêmio: ${input.prizeName}) foi sorteada.</p>
    <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px;">
      <thead>
        <tr style="text-align:left;">
          <th style="padding:8px 12px;border-bottom:2px solid #0f3d2e;color:#0f3d2e;">Número</th>
          <th style="padding:8px 12px;border-bottom:2px solid #0f3d2e;color:#0f3d2e;">Ganhador</th>
          <th style="padding:8px 12px;border-bottom:2px solid #0f3d2e;color:#0f3d2e;">E-mail</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p>Lembre-se de entrar em contato com os ganhadores para a entrega.</p>
  `

  const html = getEmailTemplate('Sorteio realizado', content)

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: adminEmail,
    subject: `🎯 Sorteio realizado: ${input.raffleName}`,
    html,
  })
}

/**
 * E-mail premium pós-compra de Serial Key (compra avulsa, com ou sem login).
 * Contém: agradecimento personalizado, dados do comprador, produto, data/hora,
 * status do pagamento, Serial Key em destaque, botão + link + QR de ativação,
 * comprovante em texto e comprovante em PDF anexado.
 *
 * Layout responsivo compatível com Gmail/Outlook/celular. O QR é anexado como
 * imagem inline (CID) para renderizar sem depender de host externo.
 */
export async function sendSerialKeyPurchaseEmail(input: {
  email: string
  buyerName: string
  buyerPhone: string
  productTitle: string
  productTypeLabel: string
  amount: number
  paymentStatusLabel: string
  paymentMethodLabel?: string
  transactionId?: string
  purchasedAt: Date
  serialKey: string
  activationUrl: string
  receiptText: string
  pdfBuffer?: Buffer
  qrBuffer?: Buffer
  kind?: 'purchase' | 'resend'
  // PDF(s) do material comprado, com marca d'água (envio automático na compra).
  materialAttachments?: MaterialEmailAttachment[]
  // Quando true, informa que a ativação é restrita ao e-mail da compra.
  restrictActivationToBuyerEmail?: boolean
  /** Compra de uma versão por tempo limitado (o prazo começa na ativação). */
  timedAccess?: { versionLabel?: string; durationLabel: string }
}) {
  const firstName = input.buyerName ? input.buyerName.split(' ')[0] : 'Comprador'
  const dateStr = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(input.purchasedAt)
  const materialPdfs = input.materialAttachments || []
  const hasMaterialPdf = materialPdfs.length > 0

  const content = `
    <h1 class="h1">Compra aprovada, ${firstName}! 🎉</h1>
    <p>Seu acesso foi aprovado com sucesso. Enviamos todas as informações da compra e de ativação para o e-mail <strong>${input.email}</strong>.</p>

    ${hasMaterialPdf ? `<p>Seu material já está disponível: ele segue em anexo, em PDF, para acesso imediato — sem precisar fazer login.</p>${materialAttachmentsBlock(materialPdfs, { deliveredToEmail: input.email, ...(input.restrictActivationToBuyerEmail ? { restrictedEmail: input.email } : {}) })}<hr>` : ''}

    <p>Guarde sua Serial Key com segurança e use o botão abaixo para ativar seu produto${hasMaterialPdf ? ' na plataforma' : ''}.</p>

    ${input.timedAccess ? `
    <div style="background-color: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 6px 0; color: #075985; font-size: 14px; font-weight: 700;">
        ${input.timedAccess.versionLabel || 'Acesso temporário'} — ${input.timedAccess.durationLabel}
      </p>
      <p style="margin: 0; color: #0c4a6e; font-size: 13px; line-height: 1.6;">
        A contagem <strong>só começa quando você ativar esta Serial Key</strong> — comprar hoje e ativar depois
        não consome o seu prazo, e se você já tem acesso a este item o novo prazo é <strong>somado</strong> ao tempo
        que ainda resta. Esta modalidade é de leitura no visualizador protegido da plataforma,
        <strong>sem download</strong>. O tempo restante fica visível na página do produto e dentro do leitor.
      </p>
    </div>` : ''}

    <!-- Serial Key em destaque -->
    <div style="background: linear-gradient(135deg, #0f3d2e, #1a5c45); border-radius: 12px; padding: 22px 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #a7f3d0; font-weight: 700;">Sua Serial Key</p>
      <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 2px; word-break: break-all;">${input.serialKey}</p>
    </div>

    <div style="text-align: center;">
      <a href="${input.activationUrl}" class="button" target="_blank">Ativar meu produto</a>
    </div>

    <p style="margin-top: 20px; font-size: 13px; color: #718096; text-align: center;">
      Ou copie e cole este link de ativação no seu navegador:<br>
      <a href="${input.activationUrl}" style="color: #0f3d2e; word-break: break-all;">${input.activationUrl}</a>
    </p>

    <!-- QR Code -->
    <div style="text-align: center; margin: 20px 0;">
      <p style="font-size: 13px; color: #718096; margin-bottom: 8px;">Ou escaneie o QR Code de ativação:</p>
      <img src="cid:serialkey-qr" alt="QR Code de ativação" width="180" height="180" style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; background: #ffffff;">
    </div>

    <hr>

    <!-- Resumo / comprovante -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #0f3d2e; font-weight: 700;">Comprovante da compra</p>
      <table role="presentation" width="100%" style="font-size: 14px; color: #4a5568; border-collapse: collapse;">
        <tr><td style="padding: 3px 0; color: #718096;">Comprador</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${input.buyerName}</td></tr>
        <tr><td style="padding: 3px 0; color: #718096;">E-mail</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${input.email}</td></tr>
        <tr><td style="padding: 3px 0; color: #718096;">Telefone</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${input.buyerPhone}</td></tr>
        <tr><td style="padding: 3px 0; color: #718096;">Produto</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${input.productTitle}</td></tr>
        <tr><td style="padding: 3px 0; color: #718096;">Tipo</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${input.productTypeLabel}</td></tr>
        <tr><td style="padding: 3px 0; color: #718096;">Valor pago</td><td style="padding: 3px 0; text-align: right; font-weight: 700; color: #0f3d2e;">R$ ${input.amount.toFixed(2).replace('.', ',')}</td></tr>
        <tr><td style="padding: 3px 0; color: #718096;">Status</td><td style="padding: 3px 0; text-align: right; font-weight: 600; color: #059669;">${input.paymentStatusLabel}</td></tr>
        ${input.transactionId ? `<tr><td style="padding: 3px 0; color: #718096;">ID da transação</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${input.transactionId}</td></tr>` : ''}
        <tr><td style="padding: 3px 0; color: #718096;">Data e hora</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${dateStr}</td></tr>
        <tr><td style="padding: 3px 0; color: #718096;">Acesso</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${input.timedAccess ? `${input.timedAccess.durationLabel} a partir da ativação` : 'Vitalício'}</td></tr>
      </table>
    </div>

    <div style="background-color: #fff8e1; border-left: 4px solid #f57c00; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #795548; font-size: 13px;"><strong>Como ativar:</strong> clique em "Ativar meu produto", faça login ou crie sua conta (é rápido) e o produto aparecerá liberado automaticamente. O comprovante completo está anexado em PDF.</p>
    </div>

    <p style="font-size: 12px; color: #a0aec0;">Teve algum problema? Responda com sua Serial Key que nós ajudamos.</p>
  `

  const html = getEmailTemplate('Compra aprovada', content)

  const attachments: any[] = []
  if (input.qrBuffer) {
    attachments.push({
      filename: 'ativacao-qr.png',
      content: input.qrBuffer,
      contentType: 'image/png',
      cid: 'serialkey-qr',
    })
  }
  if (input.pdfBuffer) {
    attachments.push({
      filename: 'comprovante-domineaqui.pdf',
      content: input.pdfBuffer,
      contentType: 'application/pdf',
    })
  }
  if (hasMaterialPdf) {
    attachments.push(...toPdfMailAttachments(materialPdfs))
  }

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: input.email,
    subject: `✅ Compra aprovada — sua Serial Key do ${input.productTypeLabel}`,
    html,
    text: input.receiptText,
    attachments,
  })
}

/**
 * E-mail premium pós-compra de VÁRIAS Serial Keys (carrinho com mais de um
 * produto). Lista cada produto com sua Serial Key, link e QR de ativação, e
 * anexa um comprovante em PDF consolidado. Responsivo (Gmail/Outlook/mobile).
 */
export async function sendSerialKeyCartPurchaseEmail(input: {
  email: string
  buyerName: string
  buyerPhone: string
  totalAmount: number
  paymentStatusLabel: string
  purchasedAt: Date
  items: Array<{
    productTitle: string
    productTypeLabel: string
    serialKey: string
    activationUrl: string
    amount: number
    qrBuffer?: Buffer
    /** Aviso da modalidade quando o item foi comprado por tempo limitado. */
    accessNotice?: string
  }>
  receiptText: string
  pdfBuffer?: Buffer
  kind?: 'purchase' | 'resend'
  // PDF(s) dos materiais elegíveis do carrinho, com marca d'água.
  materialAttachments?: MaterialEmailAttachment[]
  // Quando true, informa que a ativação é restrita ao e-mail da compra.
  restrictActivationToBuyerEmail?: boolean
}) {
  const firstName = input.buyerName ? input.buyerName.split(' ')[0] : 'Comprador'
  const dateStr = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(input.purchasedAt)
  const materialPdfs = input.materialAttachments || []
  const hasMaterialPdf = materialPdfs.length > 0

  const attachments: any[] = []
  const itemsHtml = input.items.map((item, i) => {
    const cid = `serialkey-qr-${i}`
    if (item.qrBuffer) {
      attachments.push({ filename: `ativacao-${i + 1}.png`, content: item.qrBuffer, contentType: 'image/png', cid })
    }
    return `
      <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 0 0 16px 0; background: #f8fafc;">
        <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #d97706; font-weight: 700;">${item.productTypeLabel}</p>
        <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 700; color: #0f3d2e;">${item.productTitle}</p>
        ${item.accessNotice ? `<p style="margin: -4px 0 10px 0; font-size: 12px; line-height: 1.5; color: #075985; background: #e0f2fe; border-left: 3px solid #0284c7; border-radius: 4px; padding: 8px 10px;">${item.accessNotice}</p>` : ''}
        <div style="background: linear-gradient(135deg, #0f3d2e, #1a5c45); border-radius: 10px; padding: 14px; text-align: center; margin-bottom: 12px;">
          <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #a7f3d0; font-weight: 700;">Serial Key</p>
          <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: 1px; word-break: break-all;">${item.serialKey}</p>
        </div>
        <div style="text-align: center;">
          ${item.qrBuffer ? `<img src="cid:${cid}" alt="QR de ativação" width="130" height="130" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; background: #ffffff; margin-bottom: 8px;"><br>` : ''}
          <a href="${item.activationUrl}" style="display: inline-block; background-color: #f57c00; color: #ffffff !important; text-decoration: none; padding: 10px 22px; border-radius: 8px; font-weight: 600; font-size: 14px;" target="_blank">Ativar este produto</a>
          <p style="margin: 8px 0 0 0; font-size: 11px;"><a href="${item.activationUrl}" style="color: #0f3d2e; word-break: break-all;">${item.activationUrl}</a></p>
        </div>
      </div>
    `
  }).join('')

  const content = `
    <h1 class="h1">Compra aprovada, ${firstName}! 🎉</h1>
    <p>Seu acesso foi aprovado com sucesso. Você comprou <strong>${input.items.length} produtos</strong> e recebeu uma Serial Key para cada um.</p>

    ${hasMaterialPdf ? `<p>Os materiais em PDF já estão disponíveis: seguem em anexo, para acesso imediato — sem precisar fazer login.</p>${materialAttachmentsBlock(materialPdfs, { deliveredToEmail: input.email, ...(input.restrictActivationToBuyerEmail ? { restrictedEmail: input.email } : {}) })}<hr>` : ''}

    <p>Enviamos todas as informações para <strong>${input.email}</strong>. Guarde suas Serial Keys com segurança e ative cada produto pelos botões abaixo.</p>

    <div style="margin: 24px 0;">
      ${itemsHtml}
    </div>

    <hr>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #0f3d2e; font-weight: 700;">Comprovante da compra</p>
      <table role="presentation" width="100%" style="font-size: 14px; color: #4a5568; border-collapse: collapse;">
        <tr><td style="padding: 3px 0; color: #718096;">Comprador</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${input.buyerName}</td></tr>
        <tr><td style="padding: 3px 0; color: #718096;">E-mail</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${input.email}</td></tr>
        <tr><td style="padding: 3px 0; color: #718096;">Telefone</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${input.buyerPhone}</td></tr>
        <tr><td style="padding: 3px 0; color: #718096;">Itens</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${input.items.length}</td></tr>
        <tr><td style="padding: 3px 0; color: #718096;">Total pago</td><td style="padding: 3px 0; text-align: right; font-weight: 700; color: #0f3d2e;">R$ ${input.totalAmount.toFixed(2).replace('.', ',')}</td></tr>
        <tr><td style="padding: 3px 0; color: #718096;">Status</td><td style="padding: 3px 0; text-align: right; font-weight: 600; color: #059669;">${input.paymentStatusLabel}</td></tr>
        <tr><td style="padding: 3px 0; color: #718096;">Data e hora</td><td style="padding: 3px 0; text-align: right; font-weight: 600;">${dateStr}</td></tr>
      </table>
    </div>

    <div style="background-color: #fff8e1; border-left: 4px solid #f57c00; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #795548; font-size: 13px;"><strong>Como ativar:</strong> ative cada produto clicando no botão correspondente. Faça login ou crie sua conta (rápido) e os produtos aparecerão liberados. O comprovante completo está anexado em PDF.</p>
    </div>
  `

  const html = getEmailTemplate('Compra aprovada', content)

  if (input.pdfBuffer) {
    attachments.push({ filename: 'comprovante-domineaqui.pdf', content: input.pdfBuffer, contentType: 'application/pdf' })
  }
  if (hasMaterialPdf) {
    attachments.push(...toPdfMailAttachments(materialPdfs))
  }

  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: input.email,
    subject: `✅ Compra aprovada — suas ${input.items.length} Serial Keys DomineAqui`,
    html,
    text: input.receiptText,
    attachments,
  })
}

// ─── Loja física (produtos físicos / pedidos) ────────────────────────

const SHOP_STATUS_EMAIL: Record<string, { label: string; emoji: string; blurb: string }> = {
  awaiting_payment: { label: 'Aguardando pagamento', emoji: '⏳', blurb: 'Estamos aguardando a confirmação do pagamento.' },
  paid: { label: 'Pagamento confirmado', emoji: '✅', blurb: 'Seu pagamento foi confirmado e já estamos preparando seu pedido.' },
  in_production: { label: 'Em produção', emoji: '🖨️', blurb: 'Seu material está sendo produzido (impresso) especialmente para você.' },
  ready: { label: 'Pronto', emoji: '📦', blurb: 'Seu pedido está pronto!' },
  shipped: { label: 'Enviado', emoji: '🚚', blurb: 'Seu pedido foi enviado e está a caminho.' },
  out_for_delivery: { label: 'Saiu para entrega', emoji: '🛵', blurb: 'Seu pedido saiu para entrega e chega em breve.' },
  delivered: { label: 'Entregue', emoji: '🎉', blurb: 'Seu pedido foi entregue. Bons estudos!' },
  cancelled: { label: 'Cancelado', emoji: '❌', blurb: 'Seu pedido foi cancelado.' },
  refunded: { label: 'Reembolsado', emoji: '↩️', blurb: 'Seu pedido foi reembolsado.' },
}

export async function sendShopOrderConfirmedEmail(input: {
  to: string
  userName: string
  orderNumber: string
  items: { title: string; quantity: number; unitPrice: number }[]
  subtotal: number
  freight: number
  total: number
  deliveryType: 'pickup' | 'shipping'
  pickupPointName?: string
  deliveryMethodName?: string
  estimatedDeliveryDate?: Date | string
  madeToOrder?: boolean
}) {
  const firstName = input.userName ? input.userName.split(' ')[0] : 'Aluno'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const brl = (n: number) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`
  const eta = input.estimatedDeliveryDate
    ? new Date(input.estimatedDeliveryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  const itemsRows = input.items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 0;color:#4a5568;">${it.quantity}× ${it.title}</td>
        <td style="padding:8px 0;text-align:right;color:#0f3d2e;font-weight:600;">${brl(it.unitPrice * it.quantity)}</td>
      </tr>`
    )
    .join('')

  const deliveryLine =
    input.deliveryType === 'pickup'
      ? `Retirada em <strong>${input.pickupPointName || 'ponto de retirada'}</strong>`
      : `Entrega no endereço via <strong>${input.deliveryMethodName || 'transportadora'}</strong>`

  const content = `
    <h1 class="h1">Pedido confirmado! 🎉</h1>
    <p>Olá, ${firstName}!</p>
    <p>Recebemos o seu pedido <span class="highlight">#${input.orderNumber}</span> e o pagamento foi confirmado.
    ${input.madeToOrder ? 'Como é um item sob encomenda, ele será produzido especialmente para você.' : 'Já estamos preparando tudo.'}</p>

    <div style="background-color:#f7fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 20px;margin:20px 0;">
      <p style="margin:0 0 10px 0;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#0f3d2e;font-weight:700;">Resumo do pedido</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        ${itemsRows}
        <tr><td colspan="2"><hr/></td></tr>
        <tr><td style="color:#718096;">Subtotal</td><td style="text-align:right;color:#4a5568;">${brl(input.subtotal)}</td></tr>
        <tr><td style="color:#718096;">Frete</td><td style="text-align:right;color:#4a5568;">${input.freight > 0 ? brl(input.freight) : 'Grátis'}</td></tr>
        <tr><td style="font-weight:700;color:#0f3d2e;padding-top:6px;">Total</td><td style="text-align:right;font-weight:700;color:#0f3d2e;padding-top:6px;">${brl(input.total)}</td></tr>
      </table>
    </div>

    <p style="font-size:15px;">${deliveryLine}.${eta ? ` Previsão: <strong>${eta}</strong>.` : ''}</p>

    <div style="text-align:center;">
      <a href="${appUrl}/profile?tab=pedidos" class="button" target="_blank">Acompanhar meu pedido</a>
    </div>

    <p style="margin-top:24px;font-size:12px;color:#a0aec0;text-align:center;">Entregue por DomineAqui LTDA — Rio de Janeiro</p>
  `

  const html = getEmailTemplate('Pedido confirmado 🎉', content)
  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: input.to,
    subject: `Pedido #${input.orderNumber} confirmado — DomineAqui`,
    html,
  })
}

export async function sendShopOrderStatusEmail(input: {
  to: string
  userName: string
  orderNumber: string
  status: string
  /** Se false (ou omitido com updateSummary), trata como atualização de informações. */
  statusChanged?: boolean
  /** Campos alterados (edição manual de informações). */
  updateSummary?: string[]
  note?: string
  tracking?: { code?: string; url?: string; carrier?: string }
}) {
  const firstName = input.userName ? input.userName.split(' ')[0] : 'Aluno'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const statusMeta = SHOP_STATUS_EMAIL[input.status] || { label: input.status, emoji: '📦', blurb: '' }
  // Modo "atualização de informações": nenhuma mudança de status, mas o admin
  // editou dados do pedido (endereço, previsão, rastreio, etc.).
  const isInfoUpdate = input.statusChanged === false
  const meta = isInfoUpdate
    ? { label: 'Pedido atualizado', emoji: '📦', blurb: 'As informações do seu pedido foram atualizadas.' }
    : statusMeta

  const summaryBlock =
    isInfoUpdate && input.updateSummary && input.updateSummary.length > 0
      ? `
    <div style="background-color:#f7fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;margin:16px 0;">
      <p style="margin:0 0 6px 0;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#0f3d2e;font-weight:700;">O que mudou</p>
      <p style="margin:0;color:#4a5568;">${input.updateSummary.join(' · ')}</p>
      <p style="margin:8px 0 0 0;font-size:13px;color:#718096;">Situação atual: <strong>${statusMeta.label}</strong></p>
    </div>`
      : ''

  const trackingBlock =
    input.tracking && (input.tracking.code || input.tracking.url)
      ? `
    <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 6px 0;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#1d4ed8;font-weight:700;">Rastreamento</p>
      ${input.tracking.carrier ? `<p style="margin:0 0 4px 0;color:#4a5568;">Transportadora: <strong>${input.tracking.carrier}</strong></p>` : ''}
      ${input.tracking.code ? `<p style="margin:0 0 4px 0;color:#4a5568;">Código: <strong>${input.tracking.code}</strong></p>` : ''}
      ${input.tracking.url ? `<p style="margin:8px 0 0 0;"><a href="${input.tracking.url}" class="social-link" target="_blank">Rastrear entrega →</a></p>` : ''}
    </div>`
      : ''

  const content = `
    <h1 class="h1">${meta.emoji} ${meta.label}</h1>
    <p>Olá, ${firstName}!</p>
    <p>Há uma atualização no seu pedido <span class="highlight">#${input.orderNumber}</span>.</p>
    <p>${meta.blurb}</p>
    ${summaryBlock}
    ${input.note ? `<p style="background:#f7fafc;border-left:3px solid #f57c00;padding:10px 14px;color:#4a5568;">${input.note}</p>` : ''}
    ${trackingBlock}
    <div style="text-align:center;">
      <a href="${appUrl}/profile?tab=pedidos" class="button" target="_blank">Ver meu pedido</a>
    </div>
    <p style="margin-top:24px;font-size:12px;color:#a0aec0;text-align:center;">Entregue por DomineAqui LTDA — Rio de Janeiro</p>
  `

  const html = getEmailTemplate(`${meta.label} — Pedido #${input.orderNumber}`, content)
  await transporter.sendMail({
    from: '"DomineAqui" <no-reply@domineaqui.com.br>',
    to: input.to,
    subject: `${meta.emoji} Pedido #${input.orderNumber}: ${meta.label}`,
    html,
  })
}

/**
 * Alerta INTERNO para os administradores quando a entrega automática de um
 * material/serial key (e-mail com o PDF + a key de ativação) falhou repetidas
 * vezes após um pagamento aprovado. Serve como rede de segurança: mesmo que o
 * comprador não receba o e-mail automático, um humano é avisado para reenviar
 * manualmente pelo painel de Serial Keys. Nunca lança (best-effort).
 */
export async function sendFulfillmentFailureAlert(input: {
  orderId: string
  buyerEmail?: string
  buyerName?: string
  productTitle?: string
  amount?: number
  attempts: number
  transactionId?: string
  reason?: string
}): Promise<void> {
  const recipients = (process.env.ADMIN_ALERT_EMAIL || ADMIN_EMAILS.join(',')).trim()
  if (!recipients) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.domineaqui.com.br'
  const amountStr = typeof input.amount === 'number'
    ? input.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—'

  const content = `
    <h1 class="h1" style="color:#b91c1c;">⚠️ Entrega automática falhou</h1>
    <p>Um pagamento foi <strong>aprovado</strong>, mas o e-mail automático com o material
    e/ou a serial key <strong>não pôde ser enviado</strong> após ${input.attempts} tentativa(s).</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 6px 0;color:#4a5568;">Comprador: <strong>${input.buyerName || '—'}</strong></p>
      <p style="margin:0 0 6px 0;color:#4a5568;">E-mail: <strong>${input.buyerEmail || '—'}</strong></p>
      <p style="margin:0 0 6px 0;color:#4a5568;">Produto: <strong>${input.productTitle || '—'}</strong></p>
      <p style="margin:0 0 6px 0;color:#4a5568;">Valor: <strong>${amountStr}</strong></p>
      <p style="margin:0 0 6px 0;color:#4a5568;">Order: <strong>${input.orderId}</strong></p>
      ${input.transactionId ? `<p style="margin:0 0 6px 0;color:#4a5568;">Transação (MP): <strong>${input.transactionId}</strong></p>` : ''}
      ${input.reason ? `<p style="margin:8px 0 0 0;color:#4a5568;">Último erro: <code>${input.reason}</code></p>` : ''}
    </div>
    <p><strong>Ação recomendada:</strong> abra o painel de Serial Keys, localize a compra
    e use <em>Reenviar e-mail</em>. A serial key já foi gerada e o comprador já pode
    ativá-la — apenas o e-mail automático não chegou.</p>
    <div style="text-align:center;">
      <a href="${appUrl}/admin/keys" class="button" target="_blank">Abrir painel de Serial Keys</a>
    </div>
  `

  try {
    await transporter.sendMail({
      from: '"DomineAqui Alertas" <no-reply@domineaqui.com.br>',
      to: recipients,
      subject: `⚠️ Falha na entrega automática — order ${input.orderId}`,
      html: getEmailTemplate('Falha na entrega automática', content),
    })
  } catch (err) {
    console.error('[mail] falha ao enviar alerta de fulfillment ao admin:', err)
  }
}

/* =================== DESCONTO PROUNI/FIES =================== */

/**
 * Os quatro e-mails do benefício PROUNI/FIES.
 *
 * A análise é humana e leva dias. Sem e-mail, o único jeito de a pessoa saber o
 * que aconteceu com o comprovante que ela mandou é abrir o site e procurar — e,
 * na dúvida, mandar tudo de novo. Cada aviso abaixo existe para fechar uma
 * dessas dúvidas antes que ela vire uma segunda solicitação na fila.
 *
 * A recusa é a que mais importa: ela chega com o MOTIVO escrito pelo admin e um
 * botão que leva de volta ao formulário. "Foi recusada" sem dizer por quê só
 * produz reenvio do mesmo documento ilegível.
 */

function prouniProgramLabel(program: 'prouni' | 'fies') {
  return program === 'fies' ? 'FIES' : 'ProUni'
}

/** Endereço da página exclusiva do item — onde se refaz a solicitação. */
function prouniRequestUrl(itemType: string, itemId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.domineaqui.com.br'
  return `${appUrl}/prouni-fies/${itemType}/${encodeURIComponent(itemId)}`
}

/** Confirmação para quem acabou de enviar: recebemos, e agora é esperar. */
export async function sendProuniRequestReceivedEmail(input: {
  email: string
  name?: string
  itemTitle: string
  itemType: string
  itemId: string
  program: 'prouni' | 'fies'
  attachments: number
}): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.domineaqui.com.br'
  const firstName = escapeHtml((input.name || '').split(' ')[0] || 'estudante')

  const content = `
    <h1 class="h1">Solicitação recebida 🎓</h1>
    <p>Olá, ${firstName}!</p>
    <p>Recebemos sua solicitação de desconto <strong>${prouniProgramLabel(input.program)}</strong> para
    <strong>${escapeHtml(input.itemTitle)}</strong>, com ${input.attachments}
    ${input.attachments === 1 ? 'comprovante anexado' : 'comprovantes anexados'}.</p>
    <div style="background-color:#eff6ff;border-left:4px solid #3b82f6;padding:15px;margin:20px 0;border-radius:4px;">
      <p style="margin:0;color:#1e40af;"><strong>O que acontece agora:</strong> nossa equipe confere o
      documento manualmente. Costuma levar até 2 dias úteis. Você recebe um e-mail assim que a análise
      terminar — não é preciso enviar de novo.</p>
    </div>
    <p>Aprovado o desconto, ele passa a ser aplicado sozinho no seu checkout deste item. O benefício é
    pessoal e vale apenas para a sua conta.</p>
    <div style="text-align:center;">
      <a href="${appUrl}/profile?tab=atendimento" class="button" target="_blank">Acompanhar minha solicitação</a>
    </div>
  `

  try {
    await transporter.sendMail({
      from: '"DomineAqui" <no-reply@domineaqui.com.br>',
      to: input.email,
      subject: `Recebemos sua solicitação de desconto ${prouniProgramLabel(input.program)}`,
      html: getEmailTemplate('Solicitação recebida', content),
    })
  } catch (err) {
    console.error('[mail] falha ao enviar confirmação PROUNI/FIES:', err)
  }
}

/**
 * Aviso para os administradores: há documento esperando análise.
 *
 * Vai para os mesmos endereços dos demais alertas operacionais. Traz o
 * suficiente para decidir se abre agora — nunca os arquivos, que só existem
 * atrás da sessão de admin.
 */
export async function sendProuniRequestAdminAlert(input: {
  requestId: string
  userName?: string
  userEmail?: string
  applicantName: string
  applicantCpf?: string
  institution?: string
  itemTitle: string
  program: 'prouni' | 'fies'
  attachments: number
  pendingCount?: number
}): Promise<void> {
  const recipients = (process.env.ADMIN_ALERT_EMAIL || ADMIN_EMAILS.join(',')).trim()
  if (!recipients) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.domineaqui.com.br'
  // CPF mascarado: o e-mail serve para identificar o pedido na fila, não para
  // transportar documento completo por um canal que ninguém controla.
  const cpf = String(input.applicantCpf || '').replace(/\D/g, '')
  const cpfMasked = cpf.length === 11 ? `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**` : '—'

  const content = `
    <h1 class="h1">Nova solicitação PROUNI/FIES</h1>
    <p>Uma pessoa enviou comprovante e aguarda análise.</p>
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 6px 0;color:#4a5568;">Programa: <strong>${prouniProgramLabel(input.program)}</strong></p>
      <p style="margin:0 0 6px 0;color:#4a5568;">Item: <strong>${escapeHtml(input.itemTitle)}</strong></p>
      <p style="margin:0 0 6px 0;color:#4a5568;">Solicitante: <strong>${escapeHtml(input.applicantName)}</strong></p>
      <p style="margin:0 0 6px 0;color:#4a5568;">Conta: <strong>${escapeHtml(input.userEmail || '—')}</strong></p>
      <p style="margin:0 0 6px 0;color:#4a5568;">CPF: <strong>${cpfMasked}</strong></p>
      <p style="margin:0 0 6px 0;color:#4a5568;">Faculdade: <strong>${escapeHtml(input.institution || '—')}</strong></p>
      <p style="margin:0;color:#4a5568;">Anexos: <strong>${input.attachments}</strong></p>
    </div>
    ${typeof input.pendingCount === 'number' && input.pendingCount > 1
      ? `<p style="color:#b45309;"><strong>${input.pendingCount} solicitações</strong> aguardando análise no total.</p>`
      : ''}
    <div style="text-align:center;">
      <a href="${appUrl}/admin/prouni" class="button" target="_blank">Abrir fila de análise</a>
    </div>
    <p style="margin-top:24px;font-size:0.9em;color:#718096;">Lembre-se de apagar os comprovantes depois
    de decidir — a caixa vem marcada por padrão na tela de análise.</p>
  `

  try {
    await transporter.sendMail({
      from: '"DomineAqui Alertas" <no-reply@domineaqui.com.br>',
      to: recipients,
      subject: `🎓 Nova solicitação ${prouniProgramLabel(input.program)} — ${input.itemTitle}`,
      html: getEmailTemplate('Nova solicitação PROUNI/FIES', content),
    })
  } catch (err) {
    console.error('[mail] falha ao alertar admin sobre solicitação PROUNI/FIES:', err)
  }
}

/** Aprovada: o desconto já está valendo, e o botão leva direto à compra. */
export async function sendProuniRequestApprovedEmail(input: {
  email: string
  name?: string
  itemTitle: string
  itemType: string
  itemId: string
  program: 'prouni' | 'fies'
  discountLabel: string
  stackWithTier?: boolean
  expiresAt?: Date | null
  productUrl?: string
  notes?: string
}): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.domineaqui.com.br'
  const firstName = escapeHtml((input.name || '').split(' ')[0] || 'estudante')
  const productUrl = input.productUrl
    ? `${appUrl}${input.productUrl}`
    : prouniRequestUrl(input.itemType, input.itemId)
  const expira = input.expiresAt
    ? new Date(input.expiresAt).toLocaleDateString('pt-BR')
    : null

  const content = `
    <h1 class="h1">Seu desconto foi aprovado! 🎉</h1>
    <p>Olá, ${firstName}!</p>
    <p>Conferimos seu comprovante do <strong>${prouniProgramLabel(input.program)}</strong> e liberamos o
    desconto de <span class="highlight">${escapeHtml(input.discountLabel)}</span> em
    <strong>${escapeHtml(input.itemTitle)}</strong>.</p>
    <div style="background-color:#ecfdf5;border-left:4px solid #10b981;padding:15px;margin:20px 0;border-radius:4px;">
      <p style="margin:0;color:#065f46;"><strong>Não precisa de código.</strong> O desconto é aplicado
      sozinho quando você finalizar a compra deste item, na sua conta.</p>
      ${input.stackWithTier
        ? '<p style="margin:10px 0 0 0;color:#065f46;">Ele ainda soma com o desconto de lote em andamento — o valor final pode ficar menor do que o anunciado.</p>'
        : ''}
    </div>
    ${expira
      ? `<p style="color:#b45309;"><strong>Atenção ao prazo:</strong> o benefício vale até <strong>${expira}</strong>.</p>`
      : ''}
    ${input.notes ? `<p style="color:#4a5568;"><strong>Observação da equipe:</strong> ${escapeHtml(input.notes)}</p>` : ''}
    <div style="text-align:center;">
      <a href="${productUrl}" class="button" target="_blank">Ir para a compra</a>
    </div>
    <p style="margin-top:24px;font-size:0.9em;color:#718096;">O benefício é pessoal e intransferível: vale
    para a sua conta e para este item.</p>
  `

  try {
    await transporter.sendMail({
      from: '"DomineAqui" <no-reply@domineaqui.com.br>',
      to: input.email,
      subject: `Desconto ${prouniProgramLabel(input.program)} aprovado — ${input.itemTitle}`,
      html: getEmailTemplate('Desconto aprovado', content),
    })
  } catch (err) {
    console.error('[mail] falha ao enviar aprovação PROUNI/FIES:', err)
  }
}

/**
 * Recusada: diz o motivo e devolve o caminho.
 *
 * O motivo é escrito pelo admin e é obrigatório — sem ele este e-mail seria só
 * uma porta batida, e a pessoa reenviaria exatamente o mesmo documento.
 */
export async function sendProuniRequestRejectedEmail(input: {
  email: string
  name?: string
  itemTitle: string
  itemType: string
  itemId: string
  program: 'prouni' | 'fies'
  reason: string
  canResubmitAt?: Date | null
}): Promise<void> {
  const firstName = escapeHtml((input.name || '').split(' ')[0] || 'estudante')
  const url = prouniRequestUrl(input.itemType, input.itemId)
  const espera = input.canResubmitAt && input.canResubmitAt.getTime() > Date.now()
    ? input.canResubmitAt.toLocaleString('pt-BR')
    : null

  const content = `
    <h1 class="h1">Não conseguimos aprovar sua solicitação</h1>
    <p>Olá, ${firstName}.</p>
    <p>Analisamos os documentos que você enviou para o desconto
    <strong>${prouniProgramLabel(input.program)}</strong> em
    <strong>${escapeHtml(input.itemTitle)}</strong>, e desta vez não foi possível aprovar.</p>
    <div style="background-color:#fef2f2;border-left:4px solid #ef4444;padding:15px;margin:20px 0;border-radius:4px;">
      <p style="margin:0;color:#991b1b;"><strong>Motivo:</strong> ${escapeHtml(input.reason)}</p>
    </div>
    <p>Isso não encerra o assunto: corrija o ponto acima e envie de novo — a maioria das recusas é só um
    documento ilegível, vencido ou de outra pessoa.</p>
    ${espera
      ? `<p style="color:#b45309;">Você poderá enviar uma nova solicitação a partir de <strong>${espera}</strong>.</p>`
      : ''}
    <div style="text-align:center;">
      <a href="${url}" class="button" target="_blank">Refazer solicitação</a>
    </div>
    <p style="margin-top:24px;font-size:0.9em;color:#718096;">
      Ou copie e cole este link no seu navegador:<br>
      <a href="${url}" style="color:#0f3d2e;word-break:break-all;">${url}</a>
    </p>
    <p style="font-size:0.9em;color:#718096;">Seus arquivos são apagados do nosso armazenamento depois da
    análise — por isso é preciso anexá-los novamente.</p>
  `

  try {
    await transporter.sendMail({
      from: '"DomineAqui" <no-reply@domineaqui.com.br>',
      to: input.email,
      subject: `Sobre sua solicitação de desconto ${prouniProgramLabel(input.program)}`,
      html: getEmailTemplate('Solicitação não aprovada', content),
    })
  } catch (err) {
    console.error('[mail] falha ao enviar recusa PROUNI/FIES:', err)
  }
}

/**
 * Lembrete de avaliação (cron /api/cron/avaliacoes-lembretes).
 *
 * O texto vem pronto de `lib/cronogramas/lembretes.ts` — este módulo só o
 * veste. A separação existe porque a MESMA mensagem aparece na notificação
 * dentro do site e na prévia que o admin vê antes de salvar a configuração:
 * escrever o corpo aqui faria as três versões divergirem na primeira mudança.
 *
 * O rodapé com "como desligar" não é enfeite: o lembrete só existe porque o
 * aluno ligou o botão no calendário, e ele precisa achar o caminho de volta no
 * próprio e-mail.
 */
export async function sendAvaliacaoLembreteEmail(input: {
  email: string
  assunto: string
  titulo: string
  /** Parágrafos já formatados (podem conter <strong>). */
  corpo: string[]
  cta: string
}) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/cronogramas`

  const paragrafos = input.corpo.map(p => `<p>${p}</p>`).join('')

  const content = `
    <h1 class="h1">${escapeHtml(input.titulo)}</h1>
    ${paragrafos}
    <div style="text-align:center;">
      <a href="${url}" class="button" target="_blank">${escapeHtml(input.cta)}</a>
    </div>
    <p style="margin-top:30px;font-size:0.85em;color:#718096;">
      Você recebe isto porque ativou "Quero receber lembretes das minhas avaliações" no seu calendário.
      Para desligar, é um clique em <a href="${url}" style="color:#0f3d2e;">Cronogramas</a>.
    </p>
  `

  try {
    await transporter.sendMail({
      from: '"DomineAqui" <no-reply@domineaqui.com.br>',
      to: input.email,
      subject: input.assunto,
      html: getEmailTemplate('Lembrete de avaliação', content),
    })
  } catch (err) {
    console.error('[mail] falha ao enviar lembrete de avaliação:', err)
    throw err
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suporte / tickets
//
// O chat de suporte só existe enquanto a aba está aberta: quem escreve à noite
// e fecha o navegador não descobre que foi respondido. Estes e-mails são a
// ponte — trazem a resposta inteira no corpo (a pessoa entende sem precisar
// entrar) e um botão que abre o chat já naquele ticket.
//
// Quem decide SE o e-mail sai é `devoAvisarPorEmail` em lib/tickets.ts: com o
// chat aberto do outro lado, a resposta já chegou por lá e o e-mail seria
// apenas barulho.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envia e **registra o resultado**. Quando o aviso de um ticket não chega, a
 * primeira pergunta é sempre "saiu daqui?" — sem uma linha de log com o que o
 * servidor SMTP aceitou ou recusou, a investigação começa no escuro. O aviso de
 * credencial ausente cobre o caso mais bobo e mais comum: ambiente novo sem
 * SMTP_USER/SMTP_PASS, em que o envio falha antes de sair da máquina.
 */
async function enviarEmailDeTicket(
  rotulo: string,
  opcoes: Parameters<typeof transporter.sendMail>[0],
) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error(
      `[mail] ${rotulo}: SMTP_USER/SMTP_PASS não configurados — o e-mail não tem como sair.`,
    )
  }

  try {
    const info = await transporter.sendMail(opcoes)
    console.log(
      `[mail] ${rotulo} enviado — aceitos: ${(info.accepted || []).join(', ') || 'nenhum'}` +
        `${info.rejected?.length ? ` | recusados: ${info.rejected.join(', ')}` : ''}`,
    )
    return info
  } catch (err) {
    console.error(`[mail] ${rotulo}: falha no envio:`, err)
    throw err
  }
}

/** Preserva as quebras de linha que a pessoa digitou, sem deixar passar HTML. */
function textoDeChatParaHtml(texto: string): string {
  return escapeHtml(texto).replace(/\n/g, '<br>')
}

function blocoDeMensagemDoTicket(input: {
  autor: string
  texto: string
  data?: Date | string
  tom: 'admin' | 'usuario'
}): string {
  const admin = input.tom === 'admin'
  const fundo = admin ? '#f0faf4' : '#f7fafc'
  const borda = admin ? '#43a047' : '#cbd5e0'
  const cor = admin ? '#0f3d2e' : '#4a5568'
  const data = input.data
    ? new Date(input.data).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return `
    <div style="background-color: ${fundo}; border-left: 4px solid ${borda}; border-radius: 8px; padding: 16px 18px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: ${cor}; font-weight: 700;">
        ${escapeHtml(input.autor)}${data ? ` <span style="font-weight: 400; color: #718096;">• ${data}</span>` : ''}
      </p>
      <p style="margin: 0; font-size: 15px; color: #2d3748; line-height: 1.6;">${textoDeChatParaHtml(input.texto)}</p>
    </div>
  `
}

function fichaDoTicket(input: {
  protocolo: string
  titulo: string
  status: string
  categoria?: string
  aberto?: Date | string
}): string {
  const aberto = input.aberto
    ? new Date(input.aberto).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

  return `
    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px 18px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #d97706; font-weight: 700;">Protocolo #${escapeHtml(input.protocolo)}</p>
      <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #92400e;">${escapeHtml(input.titulo)}</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #718096;">Situação: <strong>${escapeHtml(input.status)}</strong></p>
      ${input.categoria ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #718096;">Assunto: ${escapeHtml(input.categoria)}</p>` : ''}
      ${aberto ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #718096;">Aberto em: ${aberto}</p>` : ''}
    </div>
  `
}

const RODAPE_TICKET = `
  <p style="margin-top: 28px; font-size: 13px; color: #718096;">
    Responder a este e-mail não chega até o atendimento — a conversa continua dentro da plataforma,
    pelo botão acima ou pelo balão de suporte no canto da tela.
  </p>
`

/**
 * Aviso de que um administrador respondeu o ticket.
 *
 * Recebe uma LISTA de respostas, não uma só: quando o atendente escreve três
 * mensagens em sequência, a trava de rajada segura o envio e o próximo e-mail
 * leva as três juntas. Uma mensagem por e-mail seria flood; e-mail só da última
 * seria perder as outras pelo caminho.
 *
 * Vai junto, quando existe, a última fala da própria pessoa, para ela se
 * lembrar do que perguntou sem abrir nada.
 */
export async function sendTicketReplyEmail(input: {
  email: string
  name: string
  ticketId: string
  protocolo: string
  titulo: string
  status: string
  categoria?: string
  criadoEm?: Date | string
  adminNome: string
  respostas: { texto: string; data?: Date | string }[]
  perguntaDoUsuario?: string
  perguntaEm?: Date | string
}) {
  const primeiroNome = (input.name || '').split(' ')[0] || 'Aluno'
  const url = `${process.env.NEXT_PUBLIC_APP_URL || ''}/?suporte=${encodeURIComponent(input.ticketId)}`
  const respostas = input.respostas.filter((r) => r && r.texto)
  if (respostas.length === 0) return

  const varias = respostas.length > 1

  const content = `
    <h1 class="h1">${escapeHtml(input.adminNome)} respondeu o seu ticket 💬</h1>
    <p>Olá, ${escapeHtml(primeiroNome)}!</p>
    <p>
      O nosso suporte ${varias ? `enviou <strong>${respostas.length} respostas</strong> no` : 'respondeu o'}
      ticket que você abriu. ${varias ? 'Elas estão' : 'A resposta está'} logo abaixo:
    </p>

    ${respostas
      .map((resposta) =>
        blocoDeMensagemDoTicket({
          autor: `${input.adminNome} • Suporte DomineAqui`,
          texto: resposta.texto,
          data: resposta.data,
          tom: 'admin',
        }),
      )
      .join('')}

    ${
      input.perguntaDoUsuario
        ? `<p style="margin-top: 24px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #a0aec0; font-weight: 700;">Sua última mensagem</p>
           ${blocoDeMensagemDoTicket({
             autor: 'Você',
             texto: input.perguntaDoUsuario,
             data: input.perguntaEm,
             tom: 'usuario',
           })}`
        : ''
    }

    ${fichaDoTicket({
      protocolo: input.protocolo,
      titulo: input.titulo,
      status: input.status,
      categoria: input.categoria,
      aberto: input.criadoEm,
    })}

    <div style="text-align: center;">
      <a href="${url}" class="button" target="_blank">Continuar a conversa</a>
    </div>

    ${RODAPE_TICKET}
  `

  await enviarEmailDeTicket(
    `resposta do ticket #${input.protocolo} (${respostas.length} mensagem${varias ? 's' : ''})`,
    {
      from: '"DomineAqui - Suporte" <no-reply@domineaqui.com.br>',
      to: input.email,
      subject: varias
        ? `${respostas.length} respostas no seu ticket #${input.protocolo} — ${input.titulo}`
        : `Resposta no seu ticket #${input.protocolo} — ${input.titulo}`,
      html: getEmailTemplate('Resposta do suporte', content),
    },
  )
}

/**
 * Mudança de situação do ticket (resolvido, reaberto ou fechado pelo suporte).
 * Sai mesmo que a pessoa tenha acabado de receber outro e-mail: é o desfecho do
 * atendimento e costuma ser a mensagem que ela guarda.
 */
export async function sendTicketStatusEmail(input: {
  email: string
  name: string
  ticketId: string
  protocolo: string
  titulo: string
  categoria?: string
  criadoEm?: Date | string
  evento: 'resolved' | 'reopened' | 'closed'
  adminNome: string
  /**
   * Respostas do suporte que vão junto como contexto. É uma lista porque o
   * atendimento pode ter terminado com várias mensagens seguidas que a trava
   * de rajada ainda não tinha entregado — elas viajam neste e-mail em vez de
   * ficarem só no chat.
   */
  ultimasRespostas?: { texto: string; data?: Date | string }[]
}) {
  const primeiroNome = (input.name || '').split(' ')[0] || 'Aluno'
  const url = `${process.env.NEXT_PUBLIC_APP_URL || ''}/?suporte=${encodeURIComponent(input.ticketId)}`
  const respostas = (input.ultimasRespostas || []).filter((r) => r && r.texto)

  const textos = {
    resolved: {
      h1: 'Seu ticket foi resolvido ✅',
      assunto: `Ticket #${input.protocolo} resolvido — ${input.titulo}`,
      status: 'Resolvido',
      corpo: `<p>${escapeHtml(input.adminNome)} marcou o seu ticket como <strong>resolvido</strong>.</p>
        <p>Se a sua dúvida foi mesmo solucionada, não precisa fazer nada — o ticket se encerra sozinho.
        <strong>Se ainda ficou alguma ponta solta, é só responder por lá</strong> que ele volta para a fila de atendimento.</p>`,
      cta: 'Ver o atendimento',
    },
    reopened: {
      h1: 'Seu ticket foi reaberto 🔄',
      assunto: `Ticket #${input.protocolo} reaberto — ${input.titulo}`,
      status: 'Em atendimento',
      corpo: `<p>${escapeHtml(input.adminNome)} reabriu o seu ticket para continuar o atendimento.</p>`,
      cta: 'Abrir a conversa',
    },
    closed: {
      h1: 'Seu ticket foi encerrado',
      assunto: `Ticket #${input.protocolo} encerrado — ${input.titulo}`,
      status: 'Fechado',
      corpo: `<p>${escapeHtml(input.adminNome)} encerrou o seu ticket. O histórico fica guardado na sua conta.</p>
        <p>Precisando de novo, é só abrir um novo ticket pelo balão de suporte — leva menos de um minuto.</p>`,
      cta: 'Ver o histórico',
    },
  }[input.evento]

  const content = `
    <h1 class="h1">${textos.h1}</h1>
    <p>Olá, ${escapeHtml(primeiroNome)}!</p>
    ${textos.corpo}

    ${
      respostas.length > 0
        ? `<p style="margin-top: 24px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #a0aec0; font-weight: 700;">${
            respostas.length > 1 ? 'Últimas respostas do suporte' : 'Última resposta do suporte'
          }</p>
           ${respostas
             .map((resposta) =>
               blocoDeMensagemDoTicket({
                 autor: `${input.adminNome} • Suporte DomineAqui`,
                 texto: resposta.texto,
                 data: resposta.data,
                 tom: 'admin',
               }),
             )
             .join('')}`
        : ''
    }

    ${fichaDoTicket({
      protocolo: input.protocolo,
      titulo: input.titulo,
      status: textos.status,
      categoria: input.categoria,
      aberto: input.criadoEm,
    })}

    <div style="text-align: center;">
      <a href="${url}" class="button" target="_blank">${textos.cta}</a>
    </div>

    ${RODAPE_TICKET}
  `

  await enviarEmailDeTicket(`ticket #${input.protocolo} (${input.evento})`, {
    from: '"DomineAqui - Suporte" <no-reply@domineaqui.com.br>',
    to: input.email,
    subject: textos.assunto,
    html: getEmailTemplate('Atualização do seu ticket', content),
  })
}

/**
 * Aviso de ticket novo para a equipe. A notificação no sino só aparece para
 * quem já está com o painel aberto; o e-mail é o que faz alguém abrir.
 */
export async function sendNewTicketAdminEmail(input: {
  destinatarios: string[]
  protocolo: string
  ticketId: string
  titulo: string
  categoria?: string
  usuarioNome: string
  usuarioEmail: string
  mensagem: string
}) {
  const destinatarios = Array.from(new Set(input.destinatarios.filter(Boolean)))
  if (destinatarios.length === 0) return

  const url = `${process.env.NEXT_PUBLIC_APP_URL || ''}/admin/tickets`

  const content = `
    <h1 class="h1">Novo ticket de suporte 🎫</h1>
    <p><strong>${escapeHtml(input.usuarioNome)}</strong> (${escapeHtml(input.usuarioEmail)}) abriu um ticket.</p>

    ${fichaDoTicket({
      protocolo: input.protocolo,
      titulo: input.titulo,
      status: 'Aguardando atendimento',
      categoria: input.categoria,
      aberto: new Date(),
    })}

    ${blocoDeMensagemDoTicket({
      autor: input.usuarioNome,
      texto: input.mensagem,
      data: new Date(),
      tom: 'usuario',
    })}

    <div style="text-align: center;">
      <a href="${url}" class="button" target="_blank">Atender no painel</a>
    </div>
  `

  await enviarEmailDeTicket(`novo ticket #${input.protocolo} para a equipe`, {
    from: '"DomineAqui - Suporte" <no-reply@domineaqui.com.br>',
    to: destinatarios.join(', '),
    subject: `Novo ticket #${input.protocolo} — ${input.titulo}`,
    html: getEmailTemplate('Novo ticket de suporte', content),
  })
}
