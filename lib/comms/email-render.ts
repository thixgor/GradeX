// ────────────────────────────────────────────────────────────────────────────
// Renderização de e-mails de marketing/campanha.
//
// Extraído de app/api/admin/emails/send/route.ts para ser reaproveitado pelo
// adapter de canal de e-mail (lib/comms/channels/email.ts) e pela rota de
// disparo. A fila armazena apenas `content`/`previewText`/`subject`/`name` por
// destinatário; o HTML completo é renderizado no momento do envio.
//
// Por que o esqueleto é feito de <table> e não de <div>
// ─────────────────────────────────────────────────────
// O Outlook para Windows renderiza e-mail com o motor do Word, que ignora
// `max-width`, `border-radius`, `box-shadow` e gradientes em <div>. Com o
// layout anterior, todo mundo que abria no Outlook do PC via o e-mail
// esparramado na largura inteira da janela, sem cartão e sem margem. Tabelas
// com `width` fixo (mais uma "ghost table" condicional pro Outlook) são a
// única forma de garantir o cartão centralizado de 600px em todos os clientes.
//
// O CSS das classes de bloco (.hero-block, .highlight-box, .cta-button, …)
// continua idêntico de propósito: campanhas e agendamentos já salvos guardam o
// HTML gerado na época, então mudar/remover classe quebraria e-mail antigo.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Substitui tokens simples por-destinatário: %nome% (primeiro nome), %nome
 * completo% (nome completo, se houver sobrenome cadastrado) e %cidade%
 * (cidade geolocalizada na captura do lead, quando disponível). Usado tanto
 * pelo canal de e-mail quanto pelo de WhatsApp, no momento do envio.
 */
export function personalize(text: string, name: string, city?: string): string {
    const fullName = name || 'você'
    const firstName = fullName.split(' ')[0]
    return text
        .replace(/%nome completo%/gi, fullName)
        .replace(/%nome%/gi, firstName)
        .replace(/%cidade%/gi, city?.trim() || '')
}

// Template base para e-mails em massa
export const getMarketingEmailTemplate = (content: string, previewText?: string) => {
    const logoUrl = 'https://www.domineaqui.com.br/logo.png'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://domineaqui.com.br'
    const year = new Date().getFullYear()

    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>DomineAqui</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings>
    <o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }

    /* ── Reset ────────────────────────────────────────────────────────── */
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; }
    a { text-decoration: none; }
    /* Impede o iOS/Gmail de transformar datas, endereços e telefones em links azuis. */
    a[x-apple-data-detectors], .unstyle-auto-detected-links a, .aBn {
      color: inherit !important; text-decoration: none !important; font-size: inherit !important;
      font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important;
      border-bottom: 0 !important;
    }

    /* ── Base ─────────────────────────────────────────────────────────── */
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #eaf1ed;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2933;
    }

    .email-bg { background-color: #eaf1ed; }

    .email-container {
      width: 100%;
      max-width: 600px;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #dfe9e4;
    }

    .header {
      background-color: #0b3326;
      background: linear-gradient(135deg, #0b3326 0%, #14533d 55%, #1a6b4d 100%);
      padding: 30px 24px 26px;
      text-align: center;
    }
    .header img { max-height: 54px; width: auto; margin: 0 auto; }
    .header-tagline {
      margin: 14px 0 0;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #8fd9b8;
    }
    .header-accent { height: 4px; line-height: 4px; font-size: 0; background-color: #f57c00; background: linear-gradient(90deg, #f57c00 0%, #ffb74d 50%, #f57c00 100%); }

    .content { padding: 40px 36px; background-color: #ffffff; }

    /* ── Tipografia ───────────────────────────────────────────────────── */
    .content h1, .content h2, .content h3, .hero-block h1, .list-block h2, .resource-card h2 {
      color: #0f3d2e; margin-top: 0; font-family: inherit;
    }
    .content h1, .hero-block h1 {
      font-size: 30px; font-weight: 800; line-height: 1.2; margin: 0 0 14px;
      letter-spacing: -0.5px; mso-line-height-rule: exactly;
    }
    .content h2, .list-block h2, .resource-card h2 { font-size: 22px; font-weight: 700; line-height: 1.3; margin: 0 0 12px; }
    .content h3 { font-size: 18px; font-weight: 700; line-height: 1.35; margin: 0 0 10px; }
    .content p, .content li { color: #43505c; font-size: 16px; line-height: 1.65; }
    .content p { margin: 0 0 16px 0; }
    .content p:last-child { margin-bottom: 0; }
    .content a { color: #0f6b4a; text-decoration: underline; }
    .content img { max-width: 100%; height: auto; border-radius: 12px; }
    .content strong { color: #1f2933; font-weight: 700; }

    /* ── Blocos ───────────────────────────────────────────────────────── */
    .hero-block { text-align: center; margin: 0 0 28px; }
    .hero-block p { color: #52606d; font-size: 17px; line-height: 1.6; margin: 0; }
    .hero-eyebrow {
      display: inline-block; margin: 0 0 12px; padding: 6px 14px; border-radius: 999px;
      background-color: #e4f6ec; color: #0f6b4a; font-size: 12px; font-weight: 800;
      letter-spacing: 0.09em; text-transform: uppercase;
    }
    .text-block { margin: 18px 0; }
    .list-block { margin: 26px 0; }
    /* Lista legada (conteúdo salvo antes da migração): marcador padrão. */
    .list-block ul { padding-left: 22px; margin: 0; }
    .list-block li { margin: 0 0 10px; }
    .list-block li:last-child { margin-bottom: 0; }
    /* Lista nova, com check. O marcador é um caractere, não background-image
       nem pseudo-elemento: o Outlook ignora os dois e a lista ficaria sem
       marcador nenhum. */
    .list-block ul.check-list { list-style: none; padding-left: 0; margin: 0; }
    .check-list li { margin: 0 0 12px; }
    .check-list .check-icon {
      color: #1a6b4d; font-weight: 800; font-size: 17px; padding-right: 10px;
    }
    .image-block { text-align: center; margin: 26px 0; }
    .image-block img { max-width: 100%; border-radius: 14px; margin: 0 auto; }
    .button-block { text-align: center; margin: 30px 0; }

    /* Botão legado (conteúdo salvo antes da migração para tabela). */
    .cta-button {
      display: inline-block;
      background-color: #f57c00;
      background: linear-gradient(135deg, #f57c00 0%, #ff9b21 100%);
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 17px 40px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 16px;
      letter-spacing: 0.2px;
      text-align: center;
    }

    /* Botão bulletproof (tabela): renderiza igual em Outlook, Gmail e iOS. */
    .btn-table { margin: 0 auto; }
    .btn-cell {
      background-color: #f57c00;
      background: linear-gradient(135deg, #f57c00 0%, #ff9b21 100%);
      border-radius: 999px;
      mso-padding-alt: 16px 38px;
    }
    .btn-link {
      display: inline-block;
      padding: 17px 40px;
      color: #ffffff !important;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.2px;
      text-decoration: none !important;
      border-radius: 999px;
      mso-text-raise: 2px;
    }
    .btn-hint { margin: 12px 0 0; font-size: 13px; color: #7b8a83; text-align: center; }

    .secondary-button {
      display: inline-block; background-color: transparent; color: #0f3d2e !important;
      text-decoration: none; padding: 14px 32px; border-radius: 999px;
      font-weight: 700; font-size: 15px; margin: 10px 5px; border: 2px solid #0f3d2e;
    }

    .highlight-box {
      background-color: #fff4d6;
      background: linear-gradient(135deg, #fff6e0 0%, #ffe9b4 100%);
      border-left: 5px solid #f57c00;
      padding: 22px 24px;
      margin: 28px 0;
      border-radius: 14px;
    }
    .highlight-box p { margin: 0 0 8px; color: #4a2f10; font-size: 16px; line-height: 1.6; font-weight: 500; }
    .highlight-box p:last-child { margin-bottom: 0; }
    .highlight-box strong { color: #3a2408; font-weight: 800; }

    .quote-block {
      background-color: #f2faf6;
      border-left: 5px solid #1a6b4d;
      border-radius: 14px;
      margin: 28px 0;
      padding: 26px 28px 24px;
    }
    .quote-block .quote-mark {
      display: block; font-family: Georgia, 'Times New Roman', serif; font-size: 52px;
      line-height: 0.4; color: #1a6b4d; opacity: 0.35; margin-bottom: 10px;
    }
    .quote-block .quote-text { margin: 0; color: #2d3b34; font-style: italic; font-size: 18px; line-height: 1.6; }
    .quote-block .quote-author { margin: 16px 0 0; color: #0f3d2e; font-style: normal; font-weight: 700; font-size: 15px; }
    .quote-block .quote-author:before { content: "— "; color: #1a6b4d; }

    /* Prova social em números. */
    .stats-block { margin: 30px 0; }
    .stats-table { width: 100%; }
    .stat-cell {
      text-align: center; padding: 18px 10px; background-color: #f2faf6;
      border-radius: 14px; border: 1px solid #dcece4;
    }
    .stat-value { display: block; font-size: 26px; font-weight: 800; color: #0f3d2e; line-height: 1.15; letter-spacing: -0.5px; }
    .stat-label { display: block; margin-top: 6px; font-size: 13px; font-weight: 600; color: #5b6b63; line-height: 1.4; }
    .stat-gap { width: 12px; font-size: 0; line-height: 0; }

    .resource-card {
      border: 1px solid #d4e7dc;
      background-color: #f7fcf9;
      border-radius: 18px;
      padding: 26px;
      margin: 30px 0;
    }
    .resource-card h2 { margin-top: 0; }
    .resource-card p { margin-bottom: 0; }
    .resource-badge {
      display: inline-block; margin: 0 0 12px 0; padding: 6px 12px; border-radius: 999px;
      background-color: #e4f6ec; color: #0f6b4a !important; font-size: 12px !important;
      font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
    }

    .divider { height: 1px; line-height: 1px; font-size: 0; background-color: #e2ebe6; margin: 32px 0; }

    /* ── Rodapé ───────────────────────────────────────────────────────── */
    .footer { background-color: #f4f8f6; padding: 30px 28px; text-align: center; border-top: 1px solid #e4ece8; }
    .footer p { margin: 6px 0; font-size: 13px; color: #6a7b73; line-height: 1.6; }
    .footer-brand { font-size: 15px !important; font-weight: 800 !important; color: #0f3d2e !important; letter-spacing: -0.2px; }
    .social-link { color: #f57c00 !important; text-decoration: none; font-weight: 700; }
    .footer-link { color: #0f6b4a !important; text-decoration: underline; font-weight: 600; }
    .unsubscribe { margin-top: 16px !important; font-size: 11px !important; color: #9aa8a1 !important; line-height: 1.6; }

    /* ── Mobile ───────────────────────────────────────────────────────── */
    @media only screen and (max-width: 620px) {
      .email-bg-cell { padding: 12px 10px 24px !important; }
      .email-container { border-radius: 16px !important; }
      .header { padding: 24px 18px 20px !important; }
      .header img { max-height: 46px !important; }
      .header-tagline { font-size: 11px !important; letter-spacing: 0.12em !important; }
      .content { padding: 28px 20px !important; }

      .content h1, .hero-block h1 { font-size: 25px !important; line-height: 1.22 !important; }
      .content h2, .list-block h2, .resource-card h2 { font-size: 20px !important; }
      .content p, .content li, .hero-block p { font-size: 16px !important; }
      .quote-block .quote-text { font-size: 17px !important; }

      /* CTA ocupa a largura toda: alvo de toque confortável, sem "botãozinho". */
      .btn-table { width: 100% !important; }
      .btn-cell { width: 100% !important; }
      .btn-link { display: block !important; width: auto !important; padding: 17px 20px !important; font-size: 16px !important; }
      .cta-button { display: block !important; padding: 17px 20px !important; font-size: 16px !important; }

      .highlight-box { padding: 20px 18px !important; margin: 24px 0 !important; }
      .quote-block { padding: 22px 20px 20px !important; margin: 24px 0 !important; }
      .resource-card { padding: 20px 18px !important; margin: 26px 0 !important; }

      /* Números de prova social empilham em vez de espremer. */
      .stat-stack { display: block !important; width: 100% !important; }
      .stat-cell { display: block !important; width: auto !important; margin-bottom: 10px !important; padding: 14px 12px !important; }
      .stat-gap { display: none !important; }
      .stat-value { font-size: 24px !important; }

      .footer { padding: 26px 18px !important; }
    }

    /* Telas bem estreitas (iPhone SE e afins). */
    @media only screen and (max-width: 380px) {
      .content { padding: 24px 16px !important; }
      .content h1, .hero-block h1 { font-size: 23px !important; }
    }

    /* ── Dark mode ────────────────────────────────────────────────────── */
    @media (prefers-color-scheme: dark) {
      body, .email-bg { background-color: #0c1411 !important; }
      .email-container { background-color: #15211c !important; border-color: #24352d !important; }
      .content { background-color: #15211c !important; }
      .content h1, .content h2, .content h3, .hero-block h1, .list-block h2, .resource-card h2 { color: #58d6a0 !important; }
      .content p, .content li, .hero-block p, .text-block, .list-block li { color: #cdd9d3 !important; }
      .content strong { color: #eef5f1 !important; }
      .content a { color: #7fe3b7 !important; }
      .hero-eyebrow { background-color: #173329 !important; color: #7fe3b7 !important; }
      .check-list .check-icon { color: #58d6a0 !important; }
      .highlight-box {
        background: #3d2f10 !important; background-color: #3d2f10 !important;
        border-left-color: #ffb74d !important;
      }
      .highlight-box p { color: #ffe9c2 !important; }
      .highlight-box strong { color: #ffd98a !important; }
      .quote-block { background-color: #1b2a23 !important; border-left-color: #58d6a0 !important; }
      .quote-block .quote-mark { color: #58d6a0 !important; }
      .quote-block .quote-text { color: #e2ebe6 !important; }
      .quote-block .quote-author, .quote-block .quote-author:before { color: #58d6a0 !important; }
      .stat-cell { background-color: #1b2a23 !important; border-color: #2c3f36 !important; }
      .stat-value { color: #58d6a0 !important; }
      .stat-label { color: #a9bcb3 !important; }
      .resource-card { background-color: #1b2a23 !important; border-color: #2c3f36 !important; }
      .resource-badge { background-color: #173329 !important; color: #7fe3b7 !important; }
      .divider { background-color: #2a3a33 !important; }
      .btn-hint { color: #8ba299 !important; }
      .footer { background-color: #101a16 !important; border-top-color: #1f2d27 !important; }
      .footer p, .unsubscribe { color: #849991 !important; }
      .footer-brand { color: #58d6a0 !important; }
      .footer-link { color: #7fe3b7 !important; }
    }

    /* Clientes que recolorem sozinhos e ignoram prefers-color-scheme (app/web
       do Gmail, Outlook.com). Eles injetam [data-ogsc]/[data-ogsb] nos
       elementos recoloridos; sem estes overrides a inversão fica pela metade e
       o texto do destaque some (escuro sobre escuro). */
    u + .body .highlight-box, [data-ogsc] .highlight-box, [data-ogsb] .highlight-box {
      background: #3d2f10 !important; background-color: #3d2f10 !important; border-left-color: #ffb74d !important;
    }
    u + .body .highlight-box p, [data-ogsc] .highlight-box p { color: #ffe9c2 !important; }
    u + .body .highlight-box strong, [data-ogsc] .highlight-box strong { color: #ffd98a !important; }
    u + .body .quote-block, [data-ogsc] .quote-block, [data-ogsb] .quote-block {
      background: #1b2a23 !important; background-color: #1b2a23 !important; border-left-color: #58d6a0 !important;
    }
    [data-ogsc] .quote-block .quote-mark { color: #58d6a0 !important; }
    [data-ogsc] .quote-block .quote-text { color: #e2ebe6 !important; }
    [data-ogsc] .quote-block .quote-author, [data-ogsc] .quote-block .quote-author:before { color: #58d6a0 !important; }
    u + .body .resource-card, [data-ogsc] .resource-card, [data-ogsb] .resource-card {
      background: #1b2a23 !important; background-color: #1b2a23 !important; border-color: #2c3f36 !important;
    }
    [data-ogsc] .resource-badge { background-color: #173329 !important; color: #7fe3b7 !important; }
    u + .body .stat-cell, [data-ogsc] .stat-cell, [data-ogsb] .stat-cell {
      background: #1b2a23 !important; background-color: #1b2a23 !important; border-color: #2c3f36 !important;
    }
    [data-ogsc] .stat-value { color: #58d6a0 !important; }
    [data-ogsc] .stat-label { color: #a9bcb3 !important; }
    [data-ogsc] .hero-eyebrow { background-color: #173329 !important; color: #7fe3b7 !important; }
  </style>
</head>
<body class="body" style="margin:0;padding:0;background-color:#eaf1ed;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}

  <table role="presentation" class="email-bg" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eaf1ed" style="background-color:#eaf1ed;">
    <tr>
      <td class="email-bg-cell" align="center" style="padding:28px 14px 36px;">

        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td>
        <![endif]-->

        <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:20px;">
          <tr>
            <td class="header" align="center" bgcolor="#0b3326" style="background-color:#0b3326;padding:30px 24px 26px;text-align:center;">
              <!-- Estilo inline no <img> é o que deixa o texto alternativo
                   legível quando o cliente bloqueia imagens (padrão no Outlook
                   e em boa parte do Gmail): sem isso o "DomineAqui" saía verde
                   escuro sobre o cabeçalho verde escuro. -->
              <img src="${logoUrl}" alt="DomineAqui" width="180" style="max-height:54px;width:auto;margin:0 auto;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.4px;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
              <p class="header-tagline" style="margin:14px 0 0;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#8fd9b8;">Sua aprovação começa aqui</p>
            </td>
          </tr>
          <tr>
            <td class="header-accent" bgcolor="#f57c00" style="height:4px;line-height:4px;font-size:0;background-color:#f57c00;">&nbsp;</td>
          </tr>
          <tr>
            <td class="content" style="padding:40px 36px;background-color:#ffffff;">
              ${content}
            </td>
          </tr>
          <tr>
            <td class="footer" align="center" bgcolor="#f4f8f6" style="background-color:#f4f8f6;padding:30px 28px;text-align:center;border-top:1px solid #e4ece8;">
              <p class="footer-brand" style="margin:0 0 10px;font-size:15px;font-weight:800;color:#0f3d2e;">DomineAqui</p>
              <p style="margin:6px 0;font-size:13px;color:#6a7b73;">
                <a href="${appUrl}" class="footer-link" style="color:#0f6b4a;">Acessar a plataforma</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="https://instagram.com/domineaqui.br" class="social-link" style="color:#f57c00;" target="_blank">@domineaqui.br</a>
              </p>
              <p style="margin:6px 0;font-size:13px;color:#6a7b73;">&copy; ${year} DomineAqui. Todos os direitos reservados.</p>
              <p class="unsubscribe" style="margin-top:16px;font-size:11px;color:#9aa8a1;">
                Você está recebendo este e-mail por ser cadastrado no DomineAqui.
              </p>
            </td>
          </tr>
        </table>

        <!--[if mso]>
        </td></tr></table>
        <![endif]-->

      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Botão de ação em tabela ("bulletproof").
 *
 * Um <a> com padding é ignorado pelo Outlook, que renderiza só o texto sem a
 * pílula laranja. A tabela com `bgcolor` no <td> resolve, e no mobile o CSS a
 * estica para a largura toda (alvo de toque confortável).
 */
export function renderEmailButton(href: string, label: string, hint?: string): string {
    return `
      <div class="button-block" style="text-align:center;margin:30px 0;">
        <table role="presentation" class="btn-table" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
          <tr>
            <td class="btn-cell" align="center" bgcolor="#f57c00" style="background-color:#f57c00;border-radius:999px;">
              <a href="${href}" class="btn-link" target="_blank" style="display:inline-block;padding:17px 40px;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;border-radius:999px;">${label}</a>
            </td>
          </tr>
        </table>
        ${hint ? `<p class="btn-hint" style="margin:12px 0 0;font-size:13px;color:#7b8a83;text-align:center;">${hint}</p>` : ''}
      </div>
    `
}

/**
 * Faixa de prova social em números (ex.: "12 mil alunos", "4,9 de nota").
 * Lado a lado no desktop, empilhado no mobile.
 */
export function renderEmailStats(items: Array<{ value: string; label: string }>): string {
    const visible = items.filter(item => item.value.trim() || item.label.trim())
    if (visible.length === 0) return ''

    const cells = visible
        .map(item => `
            <td class="stat-cell stat-stack" align="center" style="text-align:center;padding:18px 10px;background-color:#f2faf6;border-radius:14px;border:1px solid #dcece4;">
              <span class="stat-value" style="display:block;font-size:26px;font-weight:800;color:#0f3d2e;line-height:1.15;">${item.value}</span>
              <span class="stat-label" style="display:block;margin-top:6px;font-size:13px;font-weight:600;color:#5b6b63;">${item.label}</span>
            </td>`)
        .join('<td class="stat-gap stat-stack" style="width:12px;font-size:0;line-height:0;">&nbsp;</td>')

    return `
      <div class="stats-block" style="margin:30px 0;">
        <table role="presentation" class="stats-table" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>${cells}</tr>
        </table>
      </div>
    `
}
