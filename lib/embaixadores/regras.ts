/**
 * Programa de Embaixadores — as regras que não dependem do banco.
 *
 * Tudo aqui é função pura: a conta da comissão, a chave PIX, o código do
 * embaixador, a saúde do cupom. O servidor (`./servidor.ts`), o painel do
 * embaixador e o admin leem daqui, e os testes travam a conta — é dinheiro que
 * a DomineAqui vai repassar à mão, e um erro de arredondamento vira conversa
 * desconfortável com quem divulga o site de graça há meses.
 *
 * ## A conta
 *
 * Seja X o valor pago pelo produto (preço de tabela já com descontos, sem a
 * taxa operacional que vai inteira para o Mercado Pago):
 *
 *   sócio ............ p × X            (p = 30% por padrão)
 *   nossa parte ...... (1 − p) × X      (= 0,70X)
 *   embaixador ....... c × (1 − p) × X  (c = comissão do embaixador)
 *   fica conosco ..... (1 − p) × X × (1 − c)
 *
 * A comissão sai SÓ da nossa parte: o sócio recebe os mesmos 30% com ou sem
 * embaixador. Nada é repassado automaticamente — o sistema só diz quanto é
 * devido, e o admin registra cada repasse feito por PIX.
 */

export type TipoDeEmbaixador = 'remunerado' | 'nao_remunerado'
export type StatusDoEmbaixador = 'ativo' | 'pausado' | 'encerrado'
export type TipoDeChavePix = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'
export type OrigemDaVenda = 'cupom' | 'link'
export type StatusDaVenda = 'confirmada' | 'estornada'

export const TIPOS_DE_EMBAIXADOR: TipoDeEmbaixador[] = ['remunerado', 'nao_remunerado']
export const STATUS_DO_EMBAIXADOR: StatusDoEmbaixador[] = ['ativo', 'pausado', 'encerrado']
export const TIPOS_DE_CHAVE_PIX: TipoDeChavePix[] = ['cpf', 'cnpj', 'email', 'telefone', 'aleatoria']

export const ROTULO_DO_TIPO: Record<TipoDeEmbaixador, string> = {
  remunerado: 'Remunerado',
  nao_remunerado: 'Não-remunerado',
}

export const ROTULO_DO_STATUS: Record<StatusDoEmbaixador, string> = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  encerrado: 'Encerrado',
}

export const ROTULO_DA_CHAVE_PIX: Record<TipoDeChavePix, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  telefone: 'Telefone',
  aleatoria: 'Chave aleatória',
}

/** Cookie do link de divulgação. Último clique vence. */
export const COOKIE_DO_EMBAIXADOR = 'da_embaixador'
/** Quanto tempo o clique no link segura a indicação de quem ainda não criou conta. */
export const DIAS_DO_COOKIE = 60

export interface ConfigDoPrograma {
  /** Percentual do sócio sobre o valor do produto (0–100). */
  percentualSocio: number
  /** Desconto do cupom individual criado para cada embaixador novo (0–100). */
  descontoCupomPadrao: number
  /** Comissão sugerida para um embaixador remunerado novo (0–100). */
  comissaoPadrao: number
  /** Endereço do formulário de inscrição (caminho interno ou URL). */
  linkInscricao: string
  /**
   * Por quantos dias a compra de quem se cadastrou pelo link continua sendo
   * do embaixador. Compra com o cupom dele é sempre dele, sem prazo.
   */
  janelaAtribuicaoDias: number
  /** Cobrança recorrente de assinatura de um indicado também gera comissão. */
  comissionarRenovacoes: boolean
  /** Dias sem venda para o cupom ser considerado "parado". */
  diasParaCupomParado: number
}

export const CONFIG_PADRAO: ConfigDoPrograma = {
  percentualSocio: 30,
  descontoCupomPadrao: 10,
  comissaoPadrao: 10,
  linkInscricao: '/forms/6aaed6ee00234fc63cf6e9ab',
  janelaAtribuicaoDias: 365,
  comissionarRenovacoes: false,
  diasParaCupomParado: 60,
}

/** Arredonda para centavos. Nunca devolve negativo de valor de produto. */
export function centavos(valor: number): number {
  const n = Number(valor)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

function percentual(valor: unknown, padrao: number): number {
  const n = Number(valor)
  if (!Number.isFinite(n)) return padrao
  return Math.min(100, Math.max(0, Math.round(n * 100) / 100))
}

function inteiro(valor: unknown, padrao: number, min: number, max: number): number {
  const n = Math.round(Number(valor))
  if (!Number.isFinite(n)) return padrao
  return Math.min(max, Math.max(min, n))
}

/** Lê a configuração salva sem confiar no formato: o que faltar cai no padrão. */
export function normalizarConfig(entrada?: Partial<ConfigDoPrograma> | null): ConfigDoPrograma {
  const e = entrada || {}
  const link = typeof e.linkInscricao === 'string' ? e.linkInscricao.trim().slice(0, 300) : ''
  return {
    percentualSocio: percentual(e.percentualSocio, CONFIG_PADRAO.percentualSocio),
    descontoCupomPadrao: percentual(e.descontoCupomPadrao, CONFIG_PADRAO.descontoCupomPadrao),
    comissaoPadrao: percentual(e.comissaoPadrao, CONFIG_PADRAO.comissaoPadrao),
    linkInscricao: link && linkSeguro(link) ? link : CONFIG_PADRAO.linkInscricao,
    janelaAtribuicaoDias: inteiro(e.janelaAtribuicaoDias, CONFIG_PADRAO.janelaAtribuicaoDias, 1, 3650),
    comissionarRenovacoes: e.comissionarRenovacoes === true,
    diasParaCupomParado: inteiro(e.diasParaCupomParado, CONFIG_PADRAO.diasParaCupomParado, 7, 365),
  }
}

/** Caminho interno (`/forms/…`) ou URL https. Nada de `javascript:`. */
export function linkSeguro(link: string): boolean {
  if (/^\/(?!\/)[\w\-./?=&%#~+]*$/.test(link)) return true
  try {
    const url = new URL(link)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

export interface DivisaoDaVenda {
  /** X: o valor do produto sobre o qual a conta é feita. */
  valor: number
  valorSocio: number
  /** (1 − p) × X, antes da comissão. */
  nossaParteBruta: number
  comissao: number
  /** O que fica com a DomineAqui depois do sócio e do embaixador. */
  nossaParteLiquida: number
}

/**
 * Divide uma venda entre sócio, DomineAqui e embaixador.
 *
 * Arredonda cada parte para centavos e fecha a soma em X: o que sobra do
 * arredondamento fica com a DomineAqui, nunca some e nunca é inventado.
 */
export function dividirVenda(valor: number, percentualSocio: number, comissaoPercent: number): DivisaoDaVenda {
  const x = Math.max(0, centavos(valor))
  const p = percentual(percentualSocio, CONFIG_PADRAO.percentualSocio) / 100
  const c = percentual(comissaoPercent, 0) / 100
  const valorSocio = centavos(x * p)
  const nossaParteBruta = centavos(x - valorSocio)
  const comissao = centavos(nossaParteBruta * c)
  return {
    valor: x,
    valorSocio,
    nossaParteBruta,
    comissao,
    nossaParteLiquida: centavos(nossaParteBruta - comissao),
  }
}

/** A comissão vista do valor do produto: 10% da nossa parte = 7% do produto. */
export function comissaoSobreOProduto(percentualSocio: number, comissaoPercent: number): number {
  const p = percentual(percentualSocio, CONFIG_PADRAO.percentualSocio) / 100
  const c = percentual(comissaoPercent, 0) / 100
  return Math.round(c * (1 - p) * 10000) / 100
}

/**
 * Código do embaixador: vira o cupom e o fim do link (`/e/CODIGO`).
 * Maiúsculas, letras sem acento e números, 3 a 20 caracteres.
 */
export function normalizarCodigo(bruto: string): string {
  return String(bruto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 20)
}

export function codigoValido(codigo: string): boolean {
  return /^[A-Z0-9]{3,20}$/.test(codigo)
}

/** Sugestão de código a partir do nome: "Maria Clara Souza" → "MARIA10". */
export function sugerirCodigo(nome: string, desconto = CONFIG_PADRAO.descontoCupomPadrao): string {
  const primeiro = normalizarCodigo(String(nome || '').trim().split(/\s+/)[0] || '')
  const base = (primeiro || 'EMBAIXADOR').slice(0, 14)
  const sufixo = Number.isFinite(desconto) && desconto > 0 ? String(Math.round(desconto)) : ''
  return normalizarCodigo(`${base}${sufixo}`)
}

export interface ChavePix {
  tipo: TipoDeChavePix
  chave: string
  titular: string
}

function cpfValido(digitos: string): boolean {
  if (!/^\d{11}$/.test(digitos) || /^(\d)\1{10}$/.test(digitos)) return false
  const calc = (fim: number) => {
    let soma = 0
    for (let i = 0; i < fim; i++) soma += Number(digitos[i]) * (fim + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return calc(9) === Number(digitos[9]) && calc(10) === Number(digitos[10])
}

function cnpjValido(digitos: string): boolean {
  if (!/^\d{14}$/.test(digitos) || /^(\d)\1{13}$/.test(digitos)) return false
  const calc = (tamanho: number) => {
    const pesos = tamanho === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const soma = pesos.reduce((acc, peso, i) => acc + Number(digitos[i]) * peso, 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  return calc(12) === Number(digitos[12]) && calc(13) === Number(digitos[13])
}

/**
 * Valida e normaliza a chave PIX do jeito que o banco dela espera: CPF/CNPJ só
 * com dígitos, telefone em `+55DDNNNNNNNNN`, e-mail em minúsculas, aleatória
 * no formato UUID. Devolve o erro em português para a tela mostrar.
 */
export function validarChavePix(entrada: Partial<ChavePix>): { ok: true; chave: ChavePix } | { ok: false; erro: string } {
  const tipo = entrada.tipo
  if (!tipo || !TIPOS_DE_CHAVE_PIX.includes(tipo)) return { ok: false, erro: 'Escolha o tipo da chave.' }
  const titular = String(entrada.titular || '').trim().replace(/\s+/g, ' ')
  if (titular.length < 3) return { ok: false, erro: 'Informe o nome do titular da conta.' }
  if (titular.length > 120) return { ok: false, erro: 'Nome do titular longo demais.' }
  const bruta = String(entrada.chave || '').trim()
  if (!bruta) return { ok: false, erro: 'Informe a chave PIX.' }

  let chave = bruta
  if (tipo === 'cpf') {
    chave = bruta.replace(/\D/g, '')
    if (!cpfValido(chave)) return { ok: false, erro: 'CPF inválido. Confira os números.' }
  } else if (tipo === 'cnpj') {
    chave = bruta.replace(/\D/g, '')
    if (!cnpjValido(chave)) return { ok: false, erro: 'CNPJ inválido. Confira os números.' }
  } else if (tipo === 'email') {
    chave = bruta.toLowerCase()
    if (chave.length > 77 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(chave)) return { ok: false, erro: 'E-mail inválido.' }
  } else if (tipo === 'telefone') {
    let digitos = bruta.replace(/\D/g, '')
    if (digitos.length === 13 && digitos.startsWith('55')) digitos = digitos.slice(2)
    if (digitos.length === 12 && digitos.startsWith('55')) digitos = digitos.slice(2)
    if (!/^[1-9]{2}9?\d{8}$/.test(digitos)) return { ok: false, erro: 'Telefone inválido. Use DDD + número.' }
    chave = `+55${digitos}`
  } else {
    chave = bruta.toLowerCase()
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(chave)) {
      return { ok: false, erro: 'Chave aleatória inválida. Ela tem 32 letras e números com hífens.' }
    }
  }
  return { ok: true, chave: { tipo, chave, titular } }
}

/** Chave PIX legível: CPF com pontos, telefone com parênteses. */
export function formatarChavePix(chave: Pick<ChavePix, 'tipo' | 'chave'>): string {
  const c = chave.chave || ''
  if (chave.tipo === 'cpf' && c.length === 11) return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`
  if (chave.tipo === 'cnpj' && c.length === 14) {
    return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`
  }
  if (chave.tipo === 'telefone' && /^\+55\d{10,11}$/.test(c)) {
    const d = c.slice(3)
    return `+55 (${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`
  }
  return c
}

/**
 * Nome de quem foi indicado, do jeito que o embaixador vê: primeiro nome e a
 * inicial do último. O e-mail e o sobrenome completo ficam só para o admin.
 */
export function nomeDiscreto(nome?: string | null): string {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return 'Alguém'
  if (partes.length === 1) return partes[0]
  return `${partes[0]} ${partes[partes.length - 1][0].toUpperCase()}.`
}

export type SaudeDoCupom = 'girando' | 'esfriando' | 'parado' | 'estreando'

/**
 * O cupom é o boletim do embaixador (ver o guia do programa): parado por meses
 * encerra a participação. Aqui sai o sinal que a tela pinta.
 *
 * `estreando`: ainda não vendeu, mas entrou há menos tempo que o prazo de
 * parado — ninguém é cobrado no primeiro dia.
 */
export function saudeDoCupom(input: {
  ultimaVendaEm?: Date | string | null
  entrouEm: Date | string
  diasParaParado: number
  agora?: Date
}): { saude: SaudeDoCupom; diasSemVenda: number | null } {
  const agora = input.agora || new Date()
  const dia = 86_400_000
  const ultima = input.ultimaVendaEm ? new Date(input.ultimaVendaEm) : null
  if (!ultima || Number.isNaN(ultima.getTime())) {
    const desde = Math.floor((agora.getTime() - new Date(input.entrouEm).getTime()) / dia)
    return { saude: desde < input.diasParaParado ? 'estreando' : 'parado', diasSemVenda: null }
  }
  const dias = Math.max(0, Math.floor((agora.getTime() - ultima.getTime()) / dia))
  if (dias >= input.diasParaParado) return { saude: 'parado', diasSemVenda: dias }
  if (dias >= Math.ceil(input.diasParaParado / 2)) return { saude: 'esfriando', diasSemVenda: dias }
  return { saude: 'girando', diasSemVenda: dias }
}

/** Taxa em %, com uma casa. Sem base, 0. */
export function taxa(parte: number, todo: number): number {
  if (!todo || todo <= 0) return 0
  return Math.round((parte / todo) * 1000) / 10
}

/**
 * Semana (segunda-feira) de uma data em Brasília, como `AAAA-MM-DD`. É a chave
 * das séries do painel.
 */
export function semanaDe(data: Date): string {
  const local = new Date(data.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const diaDaSemana = (local.getDay() + 6) % 7
  local.setDate(local.getDate() - diaDaSemana)
  const a = local.getFullYear()
  const m = String(local.getMonth() + 1).padStart(2, '0')
  const d = String(local.getDate()).padStart(2, '0')
  return `${a}-${m}-${d}`
}

/** As últimas `n` semanas, da mais antiga para a atual. */
export function ultimasSemanas(n: number, agora = new Date()): string[] {
  const semanas: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    semanas.push(semanaDe(new Date(agora.getTime() - i * 7 * 86_400_000)))
  }
  return semanas
}

/**
 * Para onde o link `/e/CODIGO?para=…` pode mandar: só caminhos internos, sem
 * `//` (que o navegador lê como outro domínio) e sem voltar para o próprio
 * `/e/`.
 */
export function destinoSeguro(para: string | null | undefined, codigo: string): string {
  const padrao = `/convite/${codigo}`
  if (!para) return padrao
  const limpo = String(para).trim()
  if (!/^\/(?!\/)/.test(limpo) || limpo.includes('\\')) return padrao
  if (limpo.startsWith('/e/') || limpo.startsWith('/api/')) return padrao
  if (limpo.length > 300) return padrao
  return limpo
}
