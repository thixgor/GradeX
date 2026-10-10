import type { Disponibilidade } from '@/lib/monitorias/tipos'
import type { ItemRequisito } from '@/lib/monitorias/requisitos'

export interface DadosPainel {
  requisitosMonitor: { itens: ItemRequisito[]; ok: boolean }
  requisitosAluno: { itens: ItemRequisito[]; ok: boolean; termosAceitos: boolean }
  tutor: {
    id: string
    nome: string
    titulo: string
    bio: string
    historia: string
    fotoUrl: string | null
    avatar: string | null
    status: 'ativo' | 'suspenso'
    disponibilidade: Disponibilidade
    pix: { tipo: string; mascarada: string } | null
    pixPendente: { tipo: string; mascarada: string; liberaEm: string } | null
    strikes: number
    stats: { aulasDadas: number; nota: number; avaliacoes: number }
    financeiro: { emGarantiaCentavos: number; liberadoCentavos: number; emPagamentoCentavos: number; pagoCentavos: number; saldoDevedorCentavos: number }
  } | null
  anuncios: Array<{
    id: string
    titulo: string
    slug: string
    status: string
    materia: string
    preco: { modo: 'aula' | 'hora'; valorCentavos: number }
    stats: { reservas: number; nota: number; avaliacoes: number; perguntas: number }
    updatedAt: string
    temRevisaoPendente: boolean
    moderacao: { acao: string; motivo?: string; em: string } | null
    direto: boolean
    ofertaAssinada: boolean
    forca: { pontos: number; nivel: 'fraco' | 'bom' | 'excelente'; dicas: Array<{ texto: string; ganho: number }> }
  }>
  pedidosPendentes: number
}
