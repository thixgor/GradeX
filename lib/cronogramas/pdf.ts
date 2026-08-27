'use client'

/**
 * Impressão do cronograma e da ementa.
 *
 * Continua sendo "abrir uma janela e chamar `window.print()`", como já era —
 * é o caminho que dá ao aluno um PDF de verdade sem carregar uma biblioteca de
 * 300 KB numa página que a maioria abre para olhar o calendário.
 *
 * O que mudou: as duas gerações de HTML moravam dentro da página, somando
 * ~400 linhas de template no meio da interface. Aqui elas ficam juntas, e a
 * página volta a ser página.
 */

import { ESTILO_PRIORIDADE, type EmentaTopico, type Prioridade } from './tipos'
import { formatarDiaLongo } from './brasilia'

const VERDE = '#468152'
const DOURADO = '#E2A43E'
const ESCURO = '#153D1F'

function escapar(valor: unknown): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function abrirJanela(html: string, imprimir: boolean): boolean {
  const janela = window.open('', '', 'width=1200,height=800')
  if (!janela) return false

  janela.document.write(html)
  janela.document.close()
  if (imprimir) setTimeout(() => janela.print(), 400)
  return true
}

const ESTILO_BASE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: #f4f5f7; color: #1a1a1a; line-height: 1.55; }
  .pagina { max-width: 960px; margin: 0 auto; background: #fff; }
  .capa { background: linear-gradient(135deg, ${ESCURO} 0%, #1a472a 40%, ${VERDE} 100%); color: #fff; padding: 40px 44px; }
  .capa h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.4px; }
  .capa .sub { color: ${DOURADO}; font-weight: 600; margin-top: 4px; font-size: 15px; }
  .capa .meta { color: rgba(255,255,255,.65); font-size: 12px; margin-top: 14px; }
  .faixa { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e5e7eb; border-bottom: 1px solid #e5e7eb; }
  .faixa div { background: #fafbfc; padding: 14px 16px; text-align: center; }
  .faixa .n { font-size: 20px; font-weight: 800; color: ${VERDE}; }
  .faixa .r { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; }
  .corpo { padding: 32px 44px 48px; }
  .rodape { border-top: 1px solid #e5e7eb; padding: 20px 44px; font-size: 11px; color: #9ca3af; }
  .rodape a { color: ${VERDE}; text-decoration: none; }
  .barra { height: 4px; background: linear-gradient(90deg, ${VERDE}, ${DOURADO}, ${VERDE}); }
  .acoes { position: fixed; bottom: 24px; right: 24px; }
  .acoes button { border: 0; border-radius: 10px; padding: 12px 22px; font-size: 14px; font-weight: 600;
    color: #fff; background: linear-gradient(135deg, ${VERDE}, #5a9a63); cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,.25); }
  @media print {
    body { background: #fff; }
    .acoes { display: none !important; }
    .capa, .faixa div, .barra, .chip, .topico { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`

function moldura(titulo: string, subtitulo: string, faixa: string, corpo: string): string {
  const agora = new Date().toLocaleDateString('pt-BR')
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
    <title>${escapar(titulo)} — DomineAqui</title>
    <style>${ESTILO_BASE}</style></head><body>
    <div class="pagina">
      <div class="capa">
        <h1>${escapar(titulo)}</h1>
        <div class="sub">${escapar(subtitulo)}</div>
        <div class="meta">Gerado em ${agora} · DomineAqui</div>
      </div>
      ${faixa}
      <div class="corpo">${corpo}</div>
      <div class="barra"></div>
      <div class="rodape">
        ${escapar(subtitulo)} · <a href="https://www.domineaqui.com.br" target="_blank">www.domineaqui.com.br</a>
      </div>
    </div>
    <div class="acoes"><button onclick="window.print()">Salvar como PDF</button></div>
  </body></html>`
}

// ── Ementa ──────────────────────────────────────────────────────────────────

function selo(prioridade: Prioridade): string {
  if (prioridade === 'normal') return ''
  const cores: Record<Prioridade, string> = {
    alta: '#CE5929',
    media: '#9A6D12',
    normal: '#6b7280',
    baixa: VERDE,
  }
  return `<span class="chip" style="display:inline-block;margin-left:8px;padding:1px 7px;border-radius:99px;
    font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;
    color:${cores[prioridade]};border:1px solid ${cores[prioridade]}40;background:${cores[prioridade]}14;">
    ${ESTILO_PRIORIDADE[prioridade].rotulo}</span>`
}

export function abrirEmentaImpressa(topicos: EmentaTopico[], titulo: string, imprimir: boolean): boolean {
  let subtopicos = 0
  let modulos = 0
  let submodulos = 0

  const secoes = topicos
    .map((topico, indiceTopico) => {
      subtopicos += topico.subtopicos.length

      const conteudoSubtopicos = topico.subtopicos
        .map((sub, indiceSub) => {
          modulos += sub.modulos.length

          const conteudoModulos = sub.modulos
            .map((modulo, indiceModulo) => {
              submodulos += modulo.submodulos.length

              const itens = modulo.submodulos
                .map(
                  sm =>
                    `<div style="font-size:11.5px;color:#6b7280;padding:2px 0 2px 20px;position:relative;">
                       <span style="position:absolute;left:6px;color:${VERDE};">›</span>${escapar(sm.nome)}${selo(sm.prioridade)}
                     </div>`,
                )
                .join('')

              return `<div style="margin:0 0 8px 30px;">
                  <div style="font-size:12.5px;font-weight:500;color:#374151;background:#f3f4f6;
                    border-left:3px solid ${DOURADO};border-radius:6px;padding:7px 12px;">
                    <span style="color:${DOURADO};font-weight:700;font-size:11px;">
                      ${indiceTopico + 1}.${indiceSub + 1}.${indiceModulo + 1}
                    </span>
                    ${escapar(modulo.nome)}
                    <span style="color:#9ca3af;font-size:10.5px;"> · ${modulo.horasEstimadas}h</span>
                    ${selo(modulo.prioridade)}
                  </div>
                  ${itens ? `<div style="margin-top:4px;margin-left:16px;">${itens}</div>` : ''}
                </div>`
            })
            .join('')

          return `<div style="margin:0 0 16px 14px;">
              <div style="font-size:13.5px;font-weight:600;color:#1a472a;background:#ecfdf5;
                border-left:3px solid ${VERDE};border-radius:8px;padding:9px 14px;margin-bottom:10px;">
                <span style="color:${VERDE};font-weight:700;">${indiceTopico + 1}.${indiceSub + 1}</span>
                ${escapar(sub.nome)}${selo(sub.prioridade)}
              </div>
              ${conteudoModulos}
            </div>`
        })
        .join('')

      return `<section style="margin-bottom:30px;page-break-inside:avoid;">
          <div class="topico" style="font-size:16px;font-weight:700;color:#fff;
            background:linear-gradient(135deg,${ESCURO},#1a472a);border-left:4px solid ${DOURADO};
            border-radius:10px;padding:12px 18px;margin-bottom:14px;">
            <span style="color:${DOURADO};font-weight:800;margin-right:8px;">${indiceTopico + 1}.</span>
            ${escapar(topico.nome)}
          </div>
          ${conteudoSubtopicos}
        </section>`
    })
    .join('')

  const faixa = `<div class="faixa">
      <div><div class="n">${topicos.length}</div><div class="r">Tópicos</div></div>
      <div><div class="n">${subtopicos}</div><div class="r">Subtópicos</div></div>
      <div><div class="n">${modulos}</div><div class="r">Módulos</div></div>
      <div><div class="n">${submodulos}</div><div class="r">Submódulos</div></div>
    </div>`

  return abrirJanela(moldura('Conteúdo Programático', titulo, faixa, secoes), imprimir)
}

// ── Cronograma ──────────────────────────────────────────────────────────────

const ROTULO_TIPO: Record<string, { rotulo: string; cor: string }> = {
  estudo: { rotulo: 'Estudo', cor: VERDE },
  revisao: { rotulo: 'Revisão', cor: '#2E8FA8' },
  'reta-final': { rotulo: 'Reta final', cor: '#CE5929' },
}

export function abrirCronogramaImpresso(cronograma: any): boolean {
  const dias: any[] = cronograma?.cronograma ?? []
  const atividades = dias.flatMap(dia => dia.atividades ?? [])
  const concluidas = atividades.filter((a: any) => a.concluido).length

  const conteudo = dias
    .map(dia => {
      const linhas = (dia.atividades ?? [])
        .map((atividade: any) => {
          const tipo = ROTULO_TIPO[atividade.tipo] ?? ROTULO_TIPO.estudo
          return `<div style="border-left:4px solid ${tipo.cor};background:#fff;border-radius:6px;
              padding:9px 12px;margin-bottom:7px;${atividade.concluido ? 'opacity:.55;' : ''}">
              <div style="font-size:12.5px;font-weight:600;color:#1f2937;">
                ${atividade.concluido ? '✓ ' : ''}${escapar(atividade.modulo)}
              </div>
              <div style="font-size:11px;color:#6b7280;margin-top:2px;">
                ${escapar(atividade.topico)} · ${escapar(atividade.subtopico)}
              </div>
              <div style="margin-top:5px;display:flex;gap:6px;align-items:center;font-size:10px;">
                <span style="background:${tipo.cor};color:#fff;padding:2px 7px;border-radius:4px;font-weight:600;">
                  ${tipo.rotulo}
                </span>
                <span style="color:#6b7280;font-weight:600;">${atividade.horas}h</span>
              </div>
            </div>`
        })
        .join('')

      return `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;
          padding:12px;page-break-inside:avoid;">
          <div style="background:#ecfdf5;color:#166534;font-weight:600;font-size:12px;
            border-radius:5px;padding:7px 10px;margin-bottom:9px;text-transform:capitalize;">
            ${escapar(formatarDiaLongo(dia.data))} · ${dia.horasDisponivel}h
          </div>
          ${linhas || '<div style="color:#9ca3af;font-style:italic;font-size:11.5px;text-align:center;padding:8px;">Sem atividades</div>'}
        </div>`
    })
    .join('')

  const faixa = `<div class="faixa">
      <div><div class="n">${cronograma?.totalHoras ?? 0}h</div><div class="r">Carga total</div></div>
      <div><div class="n">${dias.length}</div><div class="r">Dias de estudo</div></div>
      <div><div class="n">${atividades.length}</div><div class="r">Atividades</div></div>
      <div><div class="n">${concluidas}</div><div class="r">Concluídas</div></div>
    </div>`

  return abrirJanela(
    moldura(
      String(cronograma?.titulo ?? 'Cronograma'),
      `Cronograma de estudos · ${String(cronograma?.modelo ?? '').toUpperCase()}`,
      faixa,
      `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">${conteudo}</div>`,
    ),
    true,
  )
}
