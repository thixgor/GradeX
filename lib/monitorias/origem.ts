/**
 * Defesa extra contra CSRF (o cookie já é SameSite=Lax): requisição que MUDA
 * dados e declara uma origem tem de vir do próprio site. Navegador sempre
 * manda `Origin` em POST/PUT/PATCH/DELETE; ferramentas de servidor (cron,
 * testes) não mandam e passam pela autenticação normal.
 *
 * Exemplo: um site malicioso faz `fetch('https://www.domineaqui.com.br/api/
 * monitorias/reservas/X/acao', {method:'POST', credentials:'include'})` →
 * Origin "https://site-malicioso.com" ≠ host → 403, antes de olhar a sessão.
 */
export interface RequisicaoComOrigem {
  method: string
  headers: { get(nome: string): string | null }
}

export function origemConfiavel(request: RequisicaoComOrigem): boolean {
  const metodo = request.method.toUpperCase()
  if (metodo === 'GET' || metodo === 'HEAD' || metodo === 'OPTIONS') return true
  const origem = request.headers.get('origin')
  if (!origem) return true
  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
    return new URL(origem).host === host
  } catch {
    return false
  }
}
