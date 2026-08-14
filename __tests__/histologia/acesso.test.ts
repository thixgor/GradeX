import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Comportamento do portão de assinatura quando a infraestrutura falha.
 *
 * Este arquivo existe por causa de um bug real: a primeira versão do portão
 * abria com `Promise.all([getDb(), getSession()])` dentro de um `try` que, no
 * `catch`, fechava o acesso. O resultado é que **assinante e admin caíam na
 * landing de vendas** em qualquer intermitência do Atlas — e o admin sem nem
 * precisar do banco, já que o veredito dele sai do JWT.
 *
 * O que estes testes travam não é a regra de negócio (essa vive em
 * `manual-clinico-product.ts`), e sim o comportamento sob falha: quem pode
 * entrar sem banco, o que é reconsultado, e para quem a falha ainda fecha.
 */

const getSession = vi.fn()
const getDb = vi.fn()
const getManualClinicoConfig = vi.fn()
const getManualClinicoAccess = vi.fn()

vi.mock('@/lib/auth', () => ({ getSession: (...args: unknown[]) => getSession(...args) }))
vi.mock('@/lib/mongodb', () => ({ getDb: (...args: unknown[]) => getDb(...args) }))
vi.mock('@/lib/manual-clinico-product', () => ({
  getManualClinicoConfig: (...args: unknown[]) => getManualClinicoConfig(...args),
  getManualClinicoAccess: (...args: unknown[]) => getManualClinicoAccess(...args),
  serializeManualClinicoProduct: () => ({ productId: 'manual-clinico-premium', plans: [] }),
}))

const ASSINANTE = { userId: 'u1', role: 'user' }
const ADMIN = { userId: 'admin1', role: 'admin' }

/** Módulo recarregado a cada teste: o cache de veredito vive no módulo. */
async function portao() {
  vi.resetModules()
  return import('@/lib/histologia/acesso')
}

beforeEach(() => {
  getSession.mockReset()
  getDb.mockReset()
  getManualClinicoConfig.mockReset()
  getManualClinicoAccess.mockReset()

  getDb.mockResolvedValue({})
  getManualClinicoConfig.mockResolvedValue({})
  getManualClinicoAccess.mockResolvedValue({ hasFullAccess: false, reason: 'locked' })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('quem entra sem depender do banco', () => {
  it('admin entra pelo JWT, sem nenhuma consulta', async () => {
    getSession.mockResolvedValue(ADMIN)
    const { verificarAcessoAHistologia } = await portao()

    const acesso = await verificarAcessoAHistologia()

    expect(acesso.liberado).toBe(true)
    expect(acesso.motivo).toBe('admin')
    // O ponto do teste: o Atlas nem foi procurado. Era aqui que uma eleição
    // lenta derrubava o admin para a página de vendas.
    expect(getDb).not.toHaveBeenCalled()
  })

  it('um "sim" recente vale sem reconsultar o banco', async () => {
    getSession.mockResolvedValue(ASSINANTE)
    getManualClinicoAccess.mockResolvedValue({ hasFullAccess: true, reason: 'purchased' })
    const { verificarAcessoAHistologia } = await portao()

    await verificarAcessoAHistologia()
    await verificarAcessoAHistologia()
    await verificarAcessoAHistologia()

    // Uma visita a uma lâmina dispara a página, o índice e a busca; sem cache,
    // cada uma delas repetia a mesma pergunta ao Atlas.
    expect(getManualClinicoAccess).toHaveBeenCalledTimes(1)
  })
})

describe('quando o banco falha', () => {
  it('insiste uma vez antes de desistir', async () => {
    getSession.mockResolvedValue(ASSINANTE)
    getDb.mockRejectedValueOnce(new Error('server selection timeout'))
    getManualClinicoAccess.mockResolvedValue({ hasFullAccess: true, reason: 'purchased' })
    const { verificarAcessoAHistologia } = await portao()

    const acesso = await verificarAcessoAHistologia()

    expect(acesso.liberado).toBe(true)
    expect(getDb).toHaveBeenCalledTimes(2)
  })

  it('assinante confirmado há pouco não perde o acesso no incidente', async () => {
    getSession.mockResolvedValue(ASSINANTE)
    getManualClinicoAccess.mockResolvedValue({
      hasFullAccess: true,
      reason: 'included_plan',
      includedPlan: 'plus',
    })
    const { verificarAcessoAHistologia } = await portao()

    // Primeira visita, banco de pé: o veredito positivo fica guardado.
    expect((await verificarAcessoAHistologia()).liberado).toBe(true)

    // Agora o Atlas cai, e o relógio anda cinco minutos: além dos 60s do cache
    // normal, dentro da janela de tolerância. O `motivo` é o que separa os dois
    // caminhos — se fosse o cache, viria 'included_plan'.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(Date.now() + 5 * 60 * 1000))
    getDb.mockRejectedValue(new Error('server selection timeout'))

    const durante = await verificarAcessoAHistologia()
    expect(durante.liberado).toBe(true)
    expect(durante.motivo).toBe('tolerancia')
    expect(durante.planoIncluso).toBe('plus')

    vi.useRealTimers()
  })

  it('logado que nunca passou pelo portão continua fora', async () => {
    getSession.mockResolvedValue(ASSINANTE)
    getDb.mockRejectedValue(new Error('server selection timeout'))
    const { verificarAcessoAHistologia } = await portao()

    const acesso = await verificarAcessoAHistologia()

    // A tolerância não abre o módulo para ninguém novo — só protege quem já
    // tinha sido confirmado. A falha segue fechada para quem não pagou.
    expect(acesso.liberado).toBe(false)
    expect(acesso.motivo).toBe('indisponivel')
    expect(acesso.autenticado).toBe(true)
  })

  it('visitante sem sessão continua fora', async () => {
    getSession.mockResolvedValue(null)
    getDb.mockRejectedValue(new Error('server selection timeout'))
    const { verificarAcessoAHistologia } = await portao()

    const acesso = await verificarAcessoAHistologia()

    expect(acesso.liberado).toBe(false)
    expect(acesso.autenticado).toBe(false)
  })

  it('falha ao ler a sessão não derruba a requisição inteira', async () => {
    getSession.mockRejectedValue(new Error('cookies indisponíveis'))
    const { verificarAcessoAHistologia } = await portao()

    const acesso = await verificarAcessoAHistologia()

    expect(acesso.autenticado).toBe(false)
    expect(acesso.liberado).toBe(false)
  })
})

describe('quem não entra', () => {
  it('cota de patologia avulsa não abre a Histologia', async () => {
    getSession.mockResolvedValue(ASSINANTE)
    getManualClinicoAccess.mockResolvedValue({ hasFullAccess: false, reason: 'free_pathology' })
    const { verificarAcessoAHistologia } = await portao()

    const acesso = await verificarAcessoAHistologia()

    expect(acesso.liberado).toBe(false)
    expect(acesso.motivo).toBe('locked')
  })

  it('"não" nunca é guardado — compra recém-aprovada vale na hora', async () => {
    getSession.mockResolvedValue(ASSINANTE)
    const { verificarAcessoAHistologia } = await portao()

    expect((await verificarAcessoAHistologia()).liberado).toBe(false)

    // O pagamento entra entre uma requisição e outra.
    getManualClinicoAccess.mockResolvedValue({ hasFullAccess: true, reason: 'purchased' })

    expect((await verificarAcessoAHistologia()).liberado).toBe(true)
  })
})
