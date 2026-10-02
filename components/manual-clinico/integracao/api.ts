import type {
  EstudoCompleto,
  EstudoResumo,
  RespostaConexoes,
} from '@/lib/manual-clinico/integracao/tipos'

/**
 * Chamadas do cliente ao Estudo Integrado, num lugar só. Cada função devolve o
 * dado ou lança `ErroDoEstudo` com a mensagem do servidor — a tela decide o
 * que mostrar, sem repetir o parsing de erro em cada componente.
 */

export class ErroDoEstudo extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
  ) {
    super(mensagem)
  }
}

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(url, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  })
  const corpo = await resposta.json().catch(() => ({}))
  if (!resposta.ok) throw new ErroDoEstudo(corpo?.error || 'Não foi possível concluir', resposta.status)
  return corpo as T
}

export function buscarConexoes(params: { ref?: string; refs?: string[]; q?: string; completo?: boolean }) {
  const busca = new URLSearchParams()
  if (params.ref) busca.set('ref', params.ref)
  if (params.refs?.length) busca.set('refs', params.refs.join(','))
  if (params.q) busca.set('q', params.q)
  if (params.completo) busca.set('completo', '1')
  return pedir<RespostaConexoes>(`/api/manual-clinico/conexoes?${busca.toString()}`)
}

export function listarEstudos() {
  return pedir<{ estudos: EstudoResumo[] }>('/api/manual-clinico/estudos').then((r) => r.estudos)
}

export function criarEstudo(titulo: string, refs: string[]) {
  return pedir<{ estudo: EstudoResumo; recusados?: number }>('/api/manual-clinico/estudos', {
    method: 'POST',
    body: JSON.stringify({ titulo, refs }),
  })
}

export function lerEstudo(id: string) {
  return pedir<{ estudo: EstudoCompleto }>(`/api/manual-clinico/estudos/${id}`).then((r) => r.estudo)
}

export function alterarEstudo(id: string, alteracao: Record<string, unknown>) {
  return pedir<{ estudo: EstudoCompleto; recusados?: number }>(`/api/manual-clinico/estudos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(alteracao),
  })
}

export function excluirEstudo(id: string) {
  return pedir<{ ok: true }>(`/api/manual-clinico/estudos/${id}`, { method: 'DELETE' })
}

export const ROTA_ESTUDO_INTEGRADO = '/manual-clinico/estudo-integrado'
export const rotaDoTema = (p: { ref?: string; q?: string }) =>
  `${ROTA_ESTUDO_INTEGRADO}/tema?${new URLSearchParams(p.ref ? { ref: p.ref } : { q: p.q ?? '' }).toString()}`
export const rotaDoMeuEstudo = (id: string) => `${ROTA_ESTUDO_INTEGRADO}/meus/${id}`
