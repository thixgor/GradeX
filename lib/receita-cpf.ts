import { isValidCpf, onlyCpfDigits } from '@/lib/cpf'

/**
 * Conferência de CPF contra a base da Receita Federal.
 *
 * A Receita não expõe uma API pública gratuita: o acesso oficial é o "Consulta
 * CPF" do Serpro (contrato) e o resto do mercado são revendas dessa mesma base.
 * Por isso aqui não existe um provedor fixo — a integração é configurada por
 * env e há três adaptadores prontos. Sem configuração, a verificação online
 * simplesmente não roda e o cadastro segue com a validação offline dos dígitos
 * verificadores (`isValidCpf`), que é o comportamento padrão.
 *
 * Configuração:
 *   CPF_VERIFICATION_PROVIDER = infosimples | cpfhub | hubdev   (vazio = desligado)
 *   CPF_VERIFICATION_TOKEN    = token/api-key do provedor
 *   CPF_VERIFICATION_TIMEOUT_MS = timeout da chamada (padrão 8000)
 *   CPF_VERIFICATION_REQUIRED = true para BLOQUEAR o cadastro quando o provedor
 *                               estiver fora do ar (padrão false: em caso de
 *                               indisponibilidade a gente aceita e marca o CPF
 *                               como não verificado, para não perder o cadastro
 *                               por causa de uma API de terceiro).
 *
 * Desde a Portaria RFB nº 667/2026 a consulta oficial exige a data de
 * nascimento junto do CPF. Como o modal não pede mais esse dado, a conferência
 * online só roda em provedores que aceitam busca só por CPF (cpfhub) ou para
 * usuários que já tinham a data no cadastro.
 */

export type CpfVerificationStatus =
  /** CPF existe, está regular e os dados conferem. */
  | 'verified'
  /** CPF existe, mas o nome informado não corresponde ao titular. */
  | 'name_mismatch'
  /** CPF existe, mas a data de nascimento não corresponde. */
  | 'birthdate_mismatch'
  /** CPF não consta na base da Receita. */
  | 'not_found'
  /** CPF existe, mas a situação cadastral não é regular (suspenso, cancelado, titular falecido...). */
  | 'irregular'
  /** Verificação online desligada (sem provedor configurado). */
  | 'skipped'
  /** Provedor configurado, mas indisponível (timeout, cota, erro). */
  | 'unavailable'

export interface CpfVerificationResult {
  status: CpfVerificationStatus
  /** `true` só quando a Receita confirmou CPF + nome + nascimento. */
  verified: boolean
  /** Nome do titular como consta na Receita (quando o provedor devolve). */
  officialName?: string
  /** Situação cadastral crua devolvida pelo provedor. */
  situation?: string
  /** Provedor usado, para auditoria. */
  provider?: string
  /** Mensagem pronta para exibir ao usuário quando o status impede o cadastro. */
  message?: string
}

export interface CpfVerificationInput {
  cpf: string
  /**
   * Data de nascimento em ISO (YYYY-MM-DD), quando existir no cadastro.
   *
   * O modal não pede mais esse dado — é fricção demais para o retorno. Sem
   * ele, só dá para consultar em provedores que aceitam busca só por CPF
   * (cpfhub). Infosimples e Hub do Desenvolvedor exigem a data desde a
   * Portaria RFB nº 667/2026, então nesses a conferência é pulada (o CPF
   * ainda passa pela validação offline dos dígitos verificadores).
   */
  birthDate?: string
  /** Nome do titular como consta na conta. */
  name: string
}

interface ProviderLookup {
  found: boolean
  name?: string
  birthDate?: string
  situation?: string
}

const PARTICLES = new Set(['DE', 'DA', 'DO', 'DAS', 'DOS', 'E', 'DI', 'DU', 'DEL', 'VON', 'VAN'])

/** Maiúsculas, sem acentos, só letras e espaço. */
function normalizeName(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function nameTokens(value: string): string[] {
  return normalizeName(value)
    .split(' ')
    .filter((token) => token.length > 1 && !PARTICLES.has(token))
}

/**
 * Compara o nome digitado com o nome oficial do titular do CPF.
 *
 * O critério é deliberadamente tolerante em relação a nomes *incompletos* e
 * rígido em relação a nomes *errados*: exige que o primeiro nome seja idêntico
 * e que pelo menos um sobrenome também apareça no registro oficial. Assim
 * "João Silva" passa para "JOAO PEDRO DA SILVA SANTOS" (o usuário abreviou),
 * mas "Maria Souza" não passa — que é justamente o caso que a verificação
 * existe para pegar: alguém informando o CPF de outra pessoa.
 */
export function namesMatch(input: string, official: string): boolean {
  const inputTokens = nameTokens(input)
  const officialTokens = nameTokens(official)
  if (inputTokens.length < 2 || officialTokens.length < 2) return false
  if (inputTokens[0] !== officialTokens[0]) return false

  const officialSet = new Set(officialTokens)
  const matched = inputTokens.filter((token) => officialSet.has(token)).length
  return matched >= 2
}

/** Aceita 'YYYY-MM-DD', 'DD/MM/YYYY' e ISO completo; devolve 'DD/MM/YYYY'. */
function toBrazilianDate(value: string): string | null {
  if (!value) return null
  const trimmed = value.trim()

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`

  const br = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (br) return `${br[1]}/${br[2]}/${br[3]}`

  return null
}

function sameDate(a?: string | null, b?: string | null): boolean {
  const left = toBrazilianDate(a || '')
  const right = toBrazilianDate(b || '')
  if (!left || !right) return true // provedor não devolveu a data: não dá para reprovar
  return left === right
}

/** Situações que a Receita considera aptas. Qualquer outra bloqueia. */
function isRegularSituation(situation?: string): boolean {
  if (!situation) return true // provedor não informou: não reprova por isso
  return /regular/i.test(situation)
}

async function fetchJson(url: string, init: RequestInit, timeoutMs: number): Promise<any> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' })
    const text = await response.text()
    let body: any = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = null
    }
    return { ok: response.ok, status: response.status, body }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Infosimples — POST com token no corpo.
 * `code` 200 = sucesso; a família 600 são erros de consulta (CPF inexistente,
 * data divergente); o resto é problema do provedor.
 */
async function lookupInfosimples(
  cpf: string,
  birthDate: string,
  token: string,
  timeoutMs: number
): Promise<ProviderLookup | null> {
  const { body } = await fetchJson(
    'https://api.infosimples.com/api/v2/consultas/receita-federal/cpf',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        cpf,
        birthdate: toBrazilianDate(birthDate),
        timeout: Math.floor(timeoutMs / 1000),
      }),
    },
    timeoutMs
  )

  if (!body || typeof body.code !== 'number') return null
  if (body.code >= 600 && body.code < 700) return { found: false }
  if (body.code !== 200) return null

  const record = Array.isArray(body.data) ? body.data[0] : null
  if (!record) return { found: false }

  return {
    found: true,
    name: record.nome || record.nome_civil || record.nome_social,
    birthDate: record.data_nascimento,
    situation: record.situacao_cadastral,
  }
}

/** CPFHub — GET com a api-key em header. */
async function lookupCpfHub(
  cpf: string,
  token: string,
  timeoutMs: number
): Promise<ProviderLookup | null> {
  const { status, body } = await fetchJson(
    `https://api.cpfhub.io/cpf/${cpf}`,
    { headers: { 'x-api-key': token, Accept: 'application/json' } },
    timeoutMs
  )

  if (status === 404) return { found: false }
  if (!body) return null
  if (body.success === false) return { found: false }

  const record = body.data || body.result || body
  if (!record || typeof record !== 'object') return null
  const name = record.name || record.nome
  if (!name) return { found: false }

  return {
    found: true,
    name,
    birthDate: record.birthDate || record.birthdate || record.data_nascimento,
    situation: record.status || record.situation || record.situacao_cadastral,
  }
}

/** Hub do Desenvolvedor — GET com token e data em query string. */
async function lookupHubDev(
  cpf: string,
  birthDate: string,
  token: string,
  timeoutMs: number
): Promise<ProviderLookup | null> {
  const params = new URLSearchParams({
    cpf,
    data: toBrazilianDate(birthDate) || '',
    token,
  })
  const { body } = await fetchJson(
    `https://ws.hubdodesenvolvedor.com.br/v2/cpf/?${params.toString()}`,
    { headers: { Accept: 'application/json' } },
    timeoutMs
  )

  if (!body) return null
  if (body.status === false || body.return === 'NOK') return { found: false }

  const record = body.result || body.retorno || body.data
  if (!record || typeof record !== 'object') return null
  const name = record.nome_da_pf || record.nome || record.name
  if (!name) return { found: false }

  return {
    found: true,
    name,
    birthDate: record.data_nascimento || record.nascimento,
    situation: record.situacao_cadastral || record.situacao,
  }
}

function result(
  status: CpfVerificationStatus,
  extra: Partial<CpfVerificationResult> = {}
): CpfVerificationResult {
  return { status, verified: status === 'verified', ...extra }
}

/**
 * Confere CPF + nome + data de nascimento na Receita Federal.
 *
 * Nunca lança: qualquer falha de rede/provedor vira `unavailable`, e cabe a
 * quem chamou decidir (por padrão, deixar passar sem o selo de verificado).
 */
export async function verifyCpfWithReceita(
  input: CpfVerificationInput
): Promise<CpfVerificationResult> {
  const cpf = onlyCpfDigits(input.cpf)

  if (!isValidCpf(cpf)) {
    return result('not_found', { message: 'CPF inválido. Confira os números digitados.' })
  }

  const provider = (process.env.CPF_VERIFICATION_PROVIDER || '').trim().toLowerCase()
  const token = (process.env.CPF_VERIFICATION_TOKEN || '').trim()
  if (!provider || !token) return result('skipped')

  const timeoutMs = Number(process.env.CPF_VERIFICATION_TIMEOUT_MS) || 8000

  // Provedores que consultam por CPF + data de nascimento não têm como rodar
  // sem a data. Melhor pular a conferência do que reprovar um CPF válido.
  const needsBirthDate = provider === 'infosimples' || provider === 'hubdev'
  if (needsBirthDate && !input.birthDate) return result('skipped')

  let lookup: ProviderLookup | null = null
  try {
    if (provider === 'infosimples') {
      lookup = await lookupInfosimples(cpf, input.birthDate!, token, timeoutMs)
    } else if (provider === 'cpfhub') {
      lookup = await lookupCpfHub(cpf, token, timeoutMs)
    } else if (provider === 'hubdev') {
      lookup = await lookupHubDev(cpf, input.birthDate!, token, timeoutMs)
    } else {
      console.error(`[receita-cpf] provedor desconhecido: ${provider}`)
      return result('skipped')
    }
  } catch (error) {
    console.error('[receita-cpf] falha ao consultar o provedor:', error)
    lookup = null
  }

  if (!lookup) {
    return result('unavailable', {
      provider,
      message: 'Não conseguimos confirmar seu CPF na Receita agora. Tente de novo em instantes.',
    })
  }

  if (!lookup.found) {
    return result('not_found', {
      provider,
      message: 'Não encontramos esse CPF na Receita Federal com essa data de nascimento.',
    })
  }

  if (!isRegularSituation(lookup.situation)) {
    return result('irregular', {
      provider,
      situation: lookup.situation,
      officialName: lookup.name,
      message: `Esse CPF está com a situação "${lookup.situation}" na Receita Federal.`,
    })
  }

  if (!sameDate(lookup.birthDate, input.birthDate)) {
    return result('birthdate_mismatch', {
      provider,
      officialName: lookup.name,
      message: 'A data de nascimento não bate com o CPF informado.',
    })
  }

  if (lookup.name && !namesMatch(input.name, lookup.name)) {
    return result('name_mismatch', {
      provider,
      officialName: lookup.name,
      message: 'O nome informado não corresponde ao titular desse CPF.',
    })
  }

  return result('verified', {
    provider,
    officialName: lookup.name,
    situation: lookup.situation,
  })
}

/** `true` quando o cadastro deve travar caso o provedor esteja fora do ar. */
export function isCpfVerificationRequired(): boolean {
  return process.env.CPF_VERIFICATION_REQUIRED === 'true'
}
