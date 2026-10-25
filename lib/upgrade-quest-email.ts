/**
 * O e-mail da oferta de upgrade Quest+ → Plus+, disparado de /admin/emails.
 *
 * Puro: recebe os números já calculados e devolve assunto, pré-cabeçalho e o
 * HTML dos blocos (o layout base é aplicado no envio, como em toda campanha —
 * ver `getMarketingEmailTemplate`). `%nome%` é trocado pessoa a pessoa pela
 * outbox.
 *
 * O e-mail é igual para a base inteira, então ele não traz o relógio de cada
 * um: diz o tamanho da janela ("reservada por 48 horas") e o contador de
 * verdade está na página, que é por pessoa.
 */

import { renderEmailButton } from './comms/email-render'

export interface DadosDoEmailDeUpgrade {
  descontoPercentual: number
  plano: {
    nome: string
    periodo: string
    preco: number
    precoUpgrade: number
    durationMonths: number
  }
  /** O que a pessoa ganha (rótulos de `itensInclusos`, sem o que o Quest+ já dá). */
  ganhos: string[]
  /** Tamanho da janela da oferta; `null` quando a contagem está desligada. */
  janelaHoras: number | null
  appUrl: string
}

function escapar(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function brl(valor: number): string {
  return `R$ ${(Math.round(valor * 100) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

/** "Plus+ Anual" a partir de "DomineAqui Plus+" + "Plano Anual". */
export function nomeCurtoDoPlano(nome: string, periodo: string): string {
  const per = periodo.replace(/^plano\s+/i, '').trim()
  const base = /plus\+/i.test(nome) ? 'Plus+' : nome.trim() || 'Plus+'
  return per ? `${base} ${per}` : base
}

export function montarEmailDeUpgrade(d: DadosDoEmailDeUpgrade): { assunto: string; previa: string; conteudo: string } {
  const pct = Math.round(d.descontoPercentual)
  const nomePlano = escapar(nomeCurtoDoPlano(d.plano.nome, d.plano.periodo))
  const economia = Math.max(0, d.plano.preco - d.plano.precoUpgrade)
  const porMes = d.plano.durationMonths > 0 ? d.plano.precoUpgrade / d.plano.durationMonths : null
  const url = `${d.appUrl.replace(/\/+$/, '')}/upgrade?utm_source=email&utm_medium=campanha&utm_campaign=upgrade-quest`
  const janela = d.janelaHoras ? `Reservado para você por ${d.janelaHoras} horas.` : 'Reservado para assinantes Quest+.'

  const assunto = `%nome%, seu upgrade para o Plus+ com ${pct}% OFF chegou`
  const previa = `Só para quem já é Quest+: leve a plataforma inteira por ${brl(d.plano.precoUpgrade)}. ${janela}`

  const ganhos = d.ganhos.filter(Boolean).slice(0, 10)
  const lista = ganhos.length
    ? `
      <div class="list-block">
        <h2>O que entra no seu upgrade</h2>
        <ul class="check-list">
          ${ganhos
            .map(
              (g) =>
                `<li><span class="check-icon" style="color:#1a6b4d;font-weight:800;padding-right:10px;">&#10003;</span>${escapar(g)}</li>`,
            )
            .join('')}
        </ul>
      </div>`
    : ''

  const conteudo = `
    <div class="hero-block">
      <span class="hero-eyebrow">Exclusivo para assinantes Quest+</span>
      <h1>%nome%, leve o DomineAqui inteiro com ${pct}% de desconto</h1>
      <p>Você já treina no Banco de Questões. Com o upgrade, manuais, materiais, flashcards e a IA passam a ser seus também — por um preço que só quem é Quest+ recebe.</p>
    </div>

    <div class="highlight-box">
      <p><strong>${nomePlano}: de <s>${brl(d.plano.preco)}</s> por ${brl(d.plano.precoUpgrade)}</strong></p>
      <p>${porMes ? `Dá ${brl(porMes)} por mês · ` : ''}você economiza ${brl(economia)} · acesso liberado na hora.</p>
    </div>
    ${lista}
    <div class="text-block">
      <p>E nada do que você já tem sai: o <strong>Banco de Questões completo</strong> e as <strong>provas em PDF</strong> continuam com você.</p>
    </div>
    ${renderEmailButton(escapar(url), `Quero meu upgrade com ${pct}% OFF`, escapar(janela))}
    <div class="text-block">
      <p style="font-size:14px;color:#5b6b63;">Seu Quest+ não se perde: se ainda sobrar tempo dele quando o Plus+ terminar, ele volta sozinho. A renovação do Quest+ é encerrada automaticamente — você nunca paga os dois. E são 7 dias de garantia: não gostou, devolvemos 100% e seu Quest+ volta como estava.</p>
    </div>
  `

  return { assunto, previa, conteudo }
}
