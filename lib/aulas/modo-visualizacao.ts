/**
 * "Visualizar como aluno" (§28).
 *
 * O admin atravessa todo cadeado, e é exatamente por isso que ele é a pessoa
 * menos capaz de conferir se a trava está no lugar certo: a tela dele sempre
 * mostra tudo liberado. A única forma honesta de revisar uma aula paga é ver a
 * plataforma pelos olhos de quem não pagou.
 *
 * O modo viaja pela URL, não por estado guardado no servidor. Isso o torna
 * compartilhável ("abre este link e me diz o que você vê"), some com um F5 na
 * URL limpa e — o que mais importa — não corre risco de ficar preso: nenhum
 * admin vai descobrir amanhã que continua sem acesso porque esqueceu de
 * desligar um interruptor ontem.
 */

export type ModoDeVisualizacao = 'admin' | 'aluno' | 'visitante'

export const PARAMETRO_MODO = 'comoAluno'

const VALOR_POR_MODO: Record<ModoDeVisualizacao, string | null> = {
  admin: null,
  aluno: '1',
  visitante: 'visitante',
}

export const ROTULO_DO_MODO: Record<ModoDeVisualizacao, string> = {
  admin: 'Administrador',
  aluno: 'Aluno comum',
  visitante: 'Visitante deslogado',
}

export function lerModo(valor: string | null | undefined): ModoDeVisualizacao {
  if (valor === '1') return 'aluno'
  if (valor === 'visitante') return 'visitante'
  return 'admin'
}

/**
 * Acrescenta o modo a uma URL, preservando o que já existe de query.
 *
 * Concatenar "?comoAluno=1" na mão quebraria em qualquer endereço que já
 * tivesse parâmetros — e a biblioteca tem (`?curso=`).
 */
export function comModo(url: string, modo: ModoDeVisualizacao): string {
  const valor = VALOR_POR_MODO[modo]
  const [caminho, consulta = ''] = url.split('?')
  const params = new URLSearchParams(consulta)

  if (valor === null) params.delete(PARAMETRO_MODO)
  else params.set(PARAMETRO_MODO, valor)

  const texto = params.toString()
  return texto ? `${caminho}?${texto}` : caminho
}
