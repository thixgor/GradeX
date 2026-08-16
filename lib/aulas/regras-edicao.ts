import { regrasDaAula, type CondicaoAcesso, type RegrasDeAcessoAula } from '@/lib/aulas/acesso'

/**
 * Normalização e sincronia das regras de acesso editadas na tela (§15).
 *
 * O motor de acesso sempre soube avaliar sete tipos de condição — público,
 * cadastrado, Plus+, Manual Clínico, material comprado, pacote comprado e turma
 * — em combinações de "ou" e "e". Mas o editor de aula só oferecia um seletor
 * de dois valores (`visibilidade`), então nada disso era alcançável: o motor
 * lia um campo que ninguém conseguia escrever.
 *
 * Este módulo é a ponte, e ele carrega a regra que não pode escapar para a UI:
 * **`visibilidade` continua sendo escrito**, sempre, em sincronia com as regras
 * novas. Não é redundância preguiçosa — outras partes do sistema ainda leem esse
 * campo (os metadados de `/aulas/[id]`, por exemplo, decidem por ele se a página
 * é indexável). Parar de atualizá-lo faria uma aula recém-trancada continuar se
 * anunciando como gratuita para fora (§45).
 */

export const TIPOS_DE_CONDICAO = [
  'publico',
  'cadastrado',
  'plus',
  'manual-clinico',
  'material',
  'pacote',
  'grupo',
] as const

export type TipoDeCondicao = (typeof TIPOS_DE_CONDICAO)[number]

/** Rótulos do editor, na ordem em que fazem sentido escolher. */
export const ROTULO_DA_CONDICAO: Record<TipoDeCondicao, string> = {
  publico: 'Qualquer pessoa, sem login',
  cadastrado: 'Qualquer conta cadastrada',
  plus: 'Assinantes Plus+',
  'manual-clinico': 'Quem tem o Manual Clínico',
  material: 'Quem comprou um material',
  pacote: 'Quem comprou um pacote',
  grupo: 'Quem está numa turma',
}

/** Explicação curta de cada opção — o editor precisa dizer o efeito, não o nome. */
export const AJUDA_DA_CONDICAO: Record<TipoDeCondicao, string> = {
  publico: 'A aula fica aberta na internet, sem exigir conta.',
  cadastrado: 'Basta ter conta e estar logado.',
  plus: 'Quem tem assinatura ativa. É o comportamento das aulas marcadas como pagas até hoje.',
  'manual-clinico': 'Quem comprou o Manual Clínico ou tem Plus+.',
  material: 'Libera para quem comprou aquele material específico.',
  pacote: 'Libera para quem comprou aquele pacote.',
  grupo: 'Libera para os membros de uma turma que você monta.',
}

/** Condições que precisam apontar para um item ou turma. */
export function exigeAlvo(tipo: TipoDeCondicao): boolean {
  return tipo === 'material' || tipo === 'pacote' || tipo === 'grupo'
}

function idDaCondicao(condicao: CondicaoAcesso): string | null {
  if (condicao.tipo === 'material' || condicao.tipo === 'pacote') return condicao.itemId || null
  if (condicao.tipo === 'grupo') return condicao.grupoId || null
  return null
}

/** Chave de identidade — é o que impede a mesma condição de entrar duas vezes. */
export function chaveDaCondicao(condicao: CondicaoAcesso): string {
  const alvo = idDaCondicao(condicao)
  return alvo ? `${condicao.tipo}:${alvo}` : condicao.tipo
}

/**
 * Limpa o que veio da tela ou da API.
 *
 * Descarta condição sem alvo (um "quem comprou o material" sem material é uma
 * porta que nunca abre para ninguém, e o admin não teria como perceber isso
 * olhando a lista) e remove repetidas.
 */
export function normalizarRegras(bruto: unknown): RegrasDeAcessoAula | null {
  if (!bruto || typeof bruto !== 'object') return null
  const entrada = bruto as Partial<RegrasDeAcessoAula>

  const liberarPara: CondicaoAcesso[] = []
  const vistas = new Set<string>()

  for (const item of Array.isArray(entrada.liberarPara) ? entrada.liberarPara : []) {
    const condicao = normalizarCondicao(item)
    if (!condicao) continue
    const chave = chaveDaCondicao(condicao)
    if (vistas.has(chave)) continue
    vistas.add(chave)
    liberarPara.push(condicao)
  }

  if (liberarPara.length === 0) return null

  const exigirTambem: Array<Extract<CondicaoAcesso, { tipo: 'grupo' }>> = []
  const vistasE = new Set<string>()
  for (const item of Array.isArray(entrada.exigirTambem) ? entrada.exigirTambem : []) {
    const condicao = normalizarCondicao(item)
    if (!condicao || condicao.tipo !== 'grupo') continue
    if (vistasE.has(condicao.grupoId)) continue
    vistasE.add(condicao.grupoId)
    exigirTambem.push(condicao)
  }

  const regras: RegrasDeAcessoAula = { liberarPara, amostra: entrada.amostra === true }
  if (exigirTambem.length > 0) regras.exigirTambem = exigirTambem
  return regras
}

function normalizarCondicao(bruto: unknown): CondicaoAcesso | null {
  if (!bruto || typeof bruto !== 'object') return null
  const item = bruto as Record<string, unknown>
  const tipo = String(item.tipo || '') as TipoDeCondicao
  if (!TIPOS_DE_CONDICAO.includes(tipo)) return null

  const titulo = item.titulo ? String(item.titulo).slice(0, 120) : undefined

  if (tipo === 'material' || tipo === 'pacote') {
    const itemId = String(item.itemId || '').trim()
    if (!itemId) return null
    return { tipo, itemId, titulo }
  }

  if (tipo === 'grupo') {
    const grupoId = String(item.grupoId || '').trim()
    if (!grupoId) return null
    return { tipo, grupoId, titulo }
  }

  return { tipo } as CondicaoAcesso
}

/**
 * O `visibilidade` equivalente às regras — mantido em sincronia (§45).
 *
 * "Gratuita" só quando a aula está de fato aberta a qualquer conta. Qualquer
 * outra combinação é tratada como paga, e essa assimetria é intencional: errar
 * para o lado de "paga" esconde uma aula que deveria aparecer; errar para o lado
 * de "gratuita" publica uma aula que deveria estar trancada. Só um dos dois
 * erros custa dinheiro e confiança.
 */
export function visibilidadeEquivalente(regras: RegrasDeAcessoAula): 'gratuita' | 'plus' {
  const abertaATodos = regras.liberarPara.some((c) => c.tipo === 'publico' || c.tipo === 'cadastrado')
  const restrita = (regras.exigirTambem || []).length > 0
  return abertaATodos && !restrita ? 'gratuita' : 'plus'
}

/**
 * Regras iniciais do editor para uma aula que ainda não tem regras próprias.
 *
 * Reaproveita a tradução do modelo antigo, então abrir o editor numa aula
 * legada mostra exatamente o que ela já fazia — e não uma tela em branco que
 * convida o admin a inventar uma configuração nova sem querer.
 */
export function regrasIniciais(aula: {
  visibilidade?: string
  regrasAcesso?: RegrasDeAcessoAula | null
}): RegrasDeAcessoAula {
  const base = regrasDaAula(aula as any)
  return {
    liberarPara: [...base.liberarPara],
    exigirTambem: base.exigirTambem ? [...base.exigirTambem] : undefined,
    amostra: base.amostra === true,
  }
}

/**
 * Uma frase dizendo quem entra — o editor precisa mostrar a consequência.
 *
 * Uma lista de fichas ("Plus+", "Turma A") não deixa claro se elas se somam ou
 * se restringem, e essa é justamente a diferença entre liberar para trezentas
 * pessoas e liberar para trinta.
 */
export function descreverRegras(regras: RegrasDeAcessoAula, nomeDoAlvo?: (c: CondicaoAcesso) => string): string {
  if (regras.liberarPara.length === 0) return 'Ninguém — falta escolher quem pode ver.'

  const nome = (c: CondicaoAcesso) => nomeDoAlvo?.(c) || rotuloCurto(c)
  const partes = regras.liberarPara.map(nome)
  const ou =
    partes.length === 1
      ? partes[0]
      : `${partes.slice(0, -1).join(', ')} ou ${partes[partes.length - 1]}`

  let frase = `Pode ver: ${ou}.`

  if ((regras.exigirTambem || []).length > 0) {
    const turmas = (regras.exigirTambem || []).map((c) => nome(c))
    frase += ` Mesmo assim, só quem estiver em ${turmas.join(' ou ')}.`
  }

  if (regras.amostra) {
    frase += ' Liberada como amostra para quem não cumpre nenhuma condição.'
  }

  return frase
}

function rotuloCurto(condicao: CondicaoAcesso): string {
  switch (condicao.tipo) {
    case 'publico':
      return 'qualquer pessoa'
    case 'cadastrado':
      return 'quem tem conta'
    case 'plus':
      return 'assinantes Plus+'
    case 'manual-clinico':
      return 'quem tem o Manual Clínico'
    case 'material':
      return condicao.titulo || 'quem comprou o material'
    case 'pacote':
      return condicao.titulo || 'quem comprou o pacote'
    case 'grupo':
      return condicao.titulo || 'a turma'
    default:
      return 'ninguém'
  }
}
