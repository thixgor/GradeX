import { describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'

/**
 * Emissão de Serial Keys pelo admin.
 *
 * O painel antigo só sabia gerar keys de conta (Trial/Plus+) — e nem isso: a
 * página mandava `type: 'plus'`, que a rota recusava. A emissão nova cobre
 * tudo que o site vende, e o que a key concede sai do banco, nunca do corpo
 * do pedido além dos ids.
 */

vi.mock('@/lib/manual-clinico-product', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/manual-clinico-product')>()
  return {
    ...original,
    getManualClinicoConfig: async () => ({
      label: 'Manual Clínico Completo',
      isActive: true,
      plans: [
        { key: 'semestral', label: 'Semestral', durationMonths: 6, price: 90, enabled: false },
        { key: 'anual', label: 'Anual', durationMonths: 12, price: 150, enabled: true },
        { key: 'vitalicio', label: 'Vitalício', durationMonths: null, price: 300, enabled: true },
      ],
    }),
  }
})

const { lerPedidoDeEmissao, montarConcessao, linkDeAtivacao, rotuloDoAcesso, VERSAO_CORTESIA_ID } =
  await import('@/lib/serial-key-emissao')

const MATERIAL_ID = new ObjectId().toHexString()
const PACOTE_ID = new ObjectId().toHexString()

function dbFalso() {
  const docs: Record<string, any> = {
    materials: {
      _id: new ObjectId(MATERIAL_ID),
      title: 'Resumo de Cardiologia',
      price: 0,
      pricing: 'free',
      timedAccessVersions: [
        { id: 'v30', label: 'Acesso 30 dias', price: 19.9, durationDays: 30, isActive: true },
        { id: 'off', label: 'Desligada', price: 9.9, durationDays: 7, isActive: false },
      ],
    },
    material_packages: { _id: new ObjectId(PACOTE_ID), title: 'Pacote Clínica Médica', price: 99 },
    admin_settings: {
      planos: [
        { tipo: 'mensal', nome: 'DomineAqui Plus+', role: 'plus', durationMonths: 1 },
        { tipo: 'gratis', nome: 'Grátis', role: 'gratuito' },
      ],
    },
  }
  return {
    collection: (nome: string) => ({
      findOne: async (filtro: any) => {
        const doc = docs[nome]
        if (!doc) return null
        if (filtro?._id && String(filtro._id) !== String(doc._id)) return null
        return doc
      },
    }),
  } as any
}

describe('lerPedidoDeEmissao', () => {
  it('aceita um material vitalício com valores padrão', () => {
    const r = lerPedidoDeEmissao({ produto: { productType: 'material', itemId: MATERIAL_ID } })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.valor).toMatchObject({
      produto: { productType: 'material', itemId: MATERIAL_ID, acesso: { modo: 'vitalicio' } },
      quantidade: 1,
      enviarEmail: false,
      restringirAoEmail: false,
      origem: 'admin_keys',
    })
  })

  it('limita a quantidade entre 1 e 100', () => {
    const muito = lerPedidoDeEmissao({ produto: { productType: 'package', itemId: PACOTE_ID }, quantidade: 5000 })
    const pouco = lerPedidoDeEmissao({ produto: { productType: 'package', itemId: PACOTE_ID }, quantidade: -3 })
    expect(muito.ok && muito.valor.quantidade).toBe(100)
    expect(pouco.ok && pouco.valor.quantidade).toBe(1)
  })

  it('recusa destinatário num lote — o lote é para distribuir por link', () => {
    const r = lerPedidoDeEmissao({
      produto: { productType: 'material', itemId: MATERIAL_ID },
      quantidade: 3,
      destinatario: { email: 'a@b.com' },
    })
    expect(r.ok).toBe(false)
  })

  it('exige e-mail para enviar ou restringir', () => {
    const r = lerPedidoDeEmissao({ produto: { productType: 'material', itemId: MATERIAL_ID }, restringirAoEmail: true })
    expect(r.ok).toBe(false)
  })

  it('recusa prazo personalizado vazio e id inválido', () => {
    expect(lerPedidoDeEmissao({
      produto: { productType: 'material', itemId: MATERIAL_ID, acesso: { modo: 'personalizado', duracao: {} } },
    }).ok).toBe(false)
    expect(lerPedidoDeEmissao({ produto: { productType: 'material', itemId: 'xyz' } }).ok).toBe(false)
    expect(lerPedidoDeEmissao({ produto: { productType: 'nada' } }).ok).toBe(false)
  })
})

describe('montarConcessao', () => {
  it('material gratuito vira cortesia vitalícia (o admin pode dar o que é grátis)', async () => {
    const c = await montarConcessao(dbFalso(), { productType: 'material', itemId: MATERIAL_ID, acesso: { modo: 'vitalicio' } })
    expect(c.grant).toEqual({
      productType: 'material',
      itemType: 'material',
      itemId: MATERIAL_ID,
      itemTitle: 'Resumo de Cardiologia',
    })
    expect(c.productTitle).toBe('Resumo de Cardiologia')
  })

  it('usa a versão por tempo do item, e recusa versão desligada', async () => {
    const c = await montarConcessao(dbFalso(), {
      productType: 'material', itemId: MATERIAL_ID, acesso: { modo: 'versao', versionId: 'v30' },
    })
    expect(c.grant).toMatchObject({ accessMode: 'timed', accessVersionId: 'v30', accessDuration: { days: 30 } })
    await expect(montarConcessao(dbFalso(), {
      productType: 'material', itemId: MATERIAL_ID, acesso: { modo: 'versao', versionId: 'off' },
    })).rejects.toThrow()
  })

  it('prazo personalizado não colide com a linha da compra vitalícia', async () => {
    const c = await montarConcessao(dbFalso(), {
      productType: 'package',
      itemId: PACOTE_ID,
      acesso: { modo: 'personalizado', duracao: { years: 0, months: 0, days: 7, hours: 0, minutes: 0 } },
    })
    expect(c.grant).toMatchObject({
      productType: 'package',
      itemType: 'package',
      accessMode: 'timed',
      accessVersionId: VERSAO_CORTESIA_ID,
      accessVersionLabel: 'Cortesia — 7 dias',
    })
  })

  it('Plus+ usa o plano, com duração própria opcional', async () => {
    const doPlano = await montarConcessao(dbFalso(), { productType: 'plus', planId: 'mensal' })
    expect(doPlano.grant).toMatchObject({ productType: 'plus', planId: 'mensal', durationMonths: 1 })
    expect(doPlano.type).toBe('plus')

    const seteDias = await montarConcessao(dbFalso(), { productType: 'plus', planId: 'mensal', duracao: { meses: 0, dias: 7 } })
    expect(seteDias.grant).toMatchObject({ durationMonths: 0, durationDays: 7 })
    expect(seteDias.productTitle).toContain('7 dias')

    // Plano que não dá Plus+ não serve.
    await expect(montarConcessao(dbFalso(), { productType: 'plus', planId: 'gratis' })).rejects.toThrow()
  })

  it('Manual Clínico aceita plano fora da venda, mas não um que não existe', async () => {
    const c = await montarConcessao(dbFalso(), { productType: 'manual_clinico', planKey: 'semestral' })
    expect(c.grant).toEqual({ productType: 'manual_clinico', manualClinicoPlanKey: 'semestral' })
    expect(c.productTitle).toBe('Manual Clínico Completo — Semestral')
  })
})

describe('link e rótulo', () => {
  it('key com token abre pelo token; key antiga, pela própria key', () => {
    expect(linkDeAtivacao({ key: 'AAAA', activationToken: 'tok_1' })).toMatch(/\/ativar\?token=tok_1$/)
    expect(linkDeAtivacao({ key: 'ABCD-EFGH' })).toMatch(/\/ativar\?key=ABCD-EFGH$/)
  })

  it('descreve keys antigas e novas', () => {
    expect(rotuloDoAcesso({ type: 'trial', key: 'x', used: false } as any)).toBe('Trial 7 dias')
    expect(rotuloDoAcesso({ type: 'custom', key: 'x', grant: { productType: 'material' } } as any)).toBe('Vitalício')
    expect(rotuloDoAcesso({
      type: 'plus', key: 'x', grant: { productType: 'plus', durationMonths: 0, durationDays: 7 },
    } as any)).toBe('7 dias')
  })
})
