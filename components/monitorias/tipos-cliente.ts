/** Formato devolvido por GET /api/monitorias/reservas/[id] (usado pela sala e pelo checkout). */
import type { StatusReserva, Proposta, ConteudoAnuncio } from '@/lib/monitorias/tipos'

export interface DetalheReserva {
  papel: 'monitor' | 'organizador' | 'membro' | 'admin'
  reserva: {
    id: string
    anuncioId: string
    anuncioTitulo: string
    anuncioSlug: string | null
    conteudosDoAnuncio: string[]
    aulaGratis: ConteudoAnuncio['aulaGratis'] | null
    grupo: ConteudoAnuncio['grupo'] | null
    precoReferencia: ConteudoAnuncio['preco'] | null
    status: StatusReserva
    origem: 'direto' | 'negociacao' | 'a_combinar' | 'gratis'
    proposta: (Omit<Proposta, 'inicio' | 'criadaEm'> & { inicio: string; criadaEm: string }) | null
    aceites: { aluno?: string; tutor?: string }
    inicio: string | null
    fim: string | null
    prazoPagamento: string | null
    linkReuniao: string | null
    temLink: boolean
    codigoConvite: string | null
    motivoCancelamento: string | null
    disputa: { em: string; motivo: string; decisao: string | null } | null
    negociavel: boolean
    podeReportar: boolean
    createdAt: string
  }
  monitor: { nome: string; fotoUrl: string | null; titulo: string; userId: string } | null
  meuAssento: {
    id: string
    status: string
    valorCentavos: number
    pagoCentavos: number | null
    pagoEm: string | null
    paymentOrderId: string | null
    reembolsos: Array<{ valorCentavos: number; status: string; em: string; motivo: string }>
    avaliacao: { nota: number; comentario: string } | null
  } | null
  meuContrato: { id: string; numero: string; status: string; falta: Array<'contratante' | 'contratado'> } | null
  contratosParaAssinar: Array<{ id: string; numero: string }>
  assentos: Array<{ alunoNome: string; status: string; eu: boolean; contratoId?: string | null }>
  mensagens: Array<{ id: string; autor: 'eu' | 'monitor' | 'aluno' | 'sistema'; tipo: string; texto: string; propostaId: string | null; createdAt: string }>
}

/** Arquivo .ics para "adicionar ao calendário". */
export function baixarIcs(titulo: string, inicio: string, fim: string, url: string) {
  const f = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DomineAqui//Monitorias//PT-BR',
    'BEGIN:VEVENT',
    `UID:${f(inicio)}-${Math.random().toString(36).slice(2)}@domineaqui.com.br`,
    `DTSTAMP:${f(new Date().toISOString())}`,
    `DTSTART:${f(inicio)}`,
    `DTEND:${f(fim)}`,
    `SUMMARY:Monitoria: ${titulo.replace(/[,;\n]/g, ' ')}`,
    `DESCRIPTION:O link da reunião fica na página da reserva: ${url}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'monitoria.ics'
  a.click()
  URL.revokeObjectURL(a.href)
}
