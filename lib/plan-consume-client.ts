/**
 * Ponte do navegador para a cota do plano.
 *
 * O PDF de prova é montado no cliente — nenhuma rota de servidor entrega o
 * arquivo, então não há onde cobrar a cota no caminho normal. Este helper faz
 * a pergunta antes de gerar: se o plano tem teto e ele fechou, o download não
 * começa e a tela recebe a mensagem pronta.
 *
 * A checagem é de PRODUTO, não de segurança: quem gera o PDF já tem a prova
 * carregada na tela. O que ela impede é o consumo silencioso passar do teto
 * que o admin anunciou — e é por isso que a resposta é registrada no servidor,
 * onde o número real vive.
 */

export interface ResultadoDoConsumo {
  permitido: boolean
  /** Texto pronto para o usuário quando `permitido` é falso. */
  mensagem?: string
  limite?: number
  restante?: number
  periodo?: string
}

/**
 * Pede uma unidade da cota e já a contabiliza quando liberada.
 *
 * Falha de rede libera: derrubar o download de quem paga porque uma requisição
 * de contabilidade não completou seria trocar um teto por uma quebra. A
 * contagem se corrige na próxima janela.
 */
export async function consumirCotaDoPlano(
  feature: 'provasPdf',
  recurso?: string,
): Promise<ResultadoDoConsumo> {
  try {
    const res = await fetch('/api/user/entitlements/consumir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature, recurso }),
    })

    if (res.ok) {
      const data = await res.json()
      return { permitido: true, limite: data.limite, restante: data.restante, periodo: data.periodo }
    }

    if (res.status === 403) {
      const data = await res.json().catch(() => ({}))
      return {
        permitido: false,
        mensagem: data.error || 'Este download não está liberado no seu plano.',
        limite: data.limit,
        restante: data.remaining,
        periodo: data.period,
      }
    }

    return { permitido: true }
  } catch {
    return { permitido: true }
  }
}
