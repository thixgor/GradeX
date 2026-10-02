import { describe, expect, it } from 'vitest'

import estatico from '@/lib/manual-clinico/integracao/indice-estatico.gerado.json'
import { expandir, type ItemCompacto } from '@/lib/manual-clinico/integracao/item'
import { itensDoBanco } from '@/lib/manual-clinico/integracao/itens-do-banco'
import {
  origemDaConsulta,
  origemDoItem,
  prepararIndice,
  relacionar,
} from '@/lib/manual-clinico/integracao/relacionar'
import type { Conexao } from '@/lib/manual-clinico/integracao/tipos'

/**
 * Teste de aceitação do pedido que deu origem ao Estudo Integrado:
 *
 * > O usuário está estudando câncer renal na TC no manual de radiologia. Por
 * > que não já integra com ele para ver os tipos de neoplasias renais na
 * > Histopatologia, a USG de rim no Manual de Semiologia e o Manual Clínico
 * > Patológico de neoplasias renais?
 *
 * Roda sobre o índice estático REAL; só as fichas do banco são fictícias.
 */

const PATOLOGIAS = [
  {
    nome: 'Carcinoma de Células Renais',
    slug: 'carcinoma-de-celulas-renais',
    sinonimos: ['Hipernefroma', 'Câncer de rim'],
    sistema: 'Oncologia Geral',
    cid10: 'C64',
    farmacologia: { primeira_linha: [{ medicamento: 'Sunitinibe 50 mg/dia (4 semanas, pausa de 2)' }], segunda_linha: [] },
  },
  {
    nome: 'Pneumonia Adquirida na Comunidade',
    slug: 'pneumonia-adquirida-na-comunidade',
    sinonimos: ['PAC'],
    sistema: 'Sistema Respiratório',
    farmacologia: { primeira_linha: [{ medicamento: 'Amoxicilina' }], segunda_linha: [] },
  },
]
const MEDICAMENTOS = [
  { nome: 'Sunitinibe', slug: 'sunitinibe', sinonimos: ['Sutent'], classe_principal: 'Antineoplásicos', subclasse: 'Inibidores de tirosina-quinase' },
  { nome: 'Amoxicilina', slug: 'amoxicilina', sinonimos: [], classe_principal: 'Antimicrobianos', subclasse: 'Penicilinas' },
]

const indice = prepararIndice([...(estatico as ItemCompacto[]).map(expandir), ...itensDoBanco(PATOLOGIAS, MEDICAMENTOS)])

function conexoesDe(ref: string) {
  const item = indice.porRef.get(ref)
  expect(item, ref).toBeDefined()
  const { grupos } = relacionar(indice, [origemDoItem(item!)], { porModulo: 8, total: 60 })
  return grupos.flatMap((g) => g.itens)
}

const refs = (lista: Conexao[]) => lista.map((c) => c.ref)

describe('Estudo Integrado — carcinoma renal na TC', () => {
  const conexoes = conexoesDe('tc:carcinoma-de-celulas-renais')

  it('leva à mesma doença e aos outros tumores do rim na Histopatologia', () => {
    const histopato = conexoes.filter((c) => c.modulo === 'histopatologia')
    expect(refs(histopato)).toContain('patozoom:carcinoma-renal-de-celulas-claras')
    expect(histopato.find((c) => c.ref === 'patozoom:carcinoma-renal-de-celulas-claras')?.motivo).toBe('mesma-doenca')
    const irmas = ['patozoom:carcinoma-renal-papilifero', 'patozoom:carcinoma-renal-cromofobo', 'patozoom:oncocitoma-renal', 'patozoom:angiomiolipoma-renal']
    expect(irmas.filter((r) => refs(histopato).includes(r)).length).toBeGreaterThanOrEqual(3)
  })

  it('leva ao ultrassom do rim na Semiologia', () => {
    const semio = refs(conexoes.filter((c) => c.modulo === 'semiologia'))
    expect(semio).toContain('uscena:rins/tumor-renal')
    expect(semio).toContain('us:rins')
  })

  it('leva à ficha do Manual Clínico e, por ela, ao tratamento', () => {
    const ficha = conexoes.find((c) => c.ref === 'patologia:carcinoma-de-celulas-renais')
    expect(ficha?.motivo).toBe('mesma-doenca')
    const farmaco = conexoes.find((c) => c.ref === 'farmaco:sunitinibe')
    expect(farmaco?.motivo).toBe('tratamento')
  })

  it('traz a base normal do órgão', () => {
    expect(refs(conexoes)).toContain('orgao:rim')
  })

  it('não traz assunto de outro órgão', () => {
    expect(refs(conexoes)).not.toContain('patologia:pneumonia-adquirida-na-comunidade')
    expect(refs(conexoes)).not.toContain('farmaco:amoxicilina')
    for (const c of conexoes) {
      if (c.motivo === 'mesma-doenca' || c.motivo === 'tratamento' || c.motivo === 'ligacao-direta') continue
      const item = indice.porRef.get(c.ref)!
      expect(item.orgaos, `${c.ref} (${c.motivo})`).toContain('rim')
    }
  })

  it('ordena os grupos pela trilha didática', () => {
    const { grupos } = relacionar(indice, [origemDoItem(indice.porRef.get('tc:carcinoma-de-celulas-renais')!)])
    const etapas = grupos.map((g) => g.etapa)
    expect(etapas.indexOf('base')).toBeLessThan(etapas.indexOf('patologia'))
    expect(etapas.indexOf('imagem')).toBeLessThan(etapas.indexOf('clinica'))
  })
})

describe('Estudo Integrado — outras origens', () => {
  it('o fármaco leva às doenças em que é escolha', () => {
    const c = conexoesDe('farmaco:sunitinibe')
    expect(c.find((x) => x.ref === 'patologia:carcinoma-de-celulas-renais')?.motivo).toBe('ligacao-direta')
  })

  it('um tema digitado também monta o estudo', () => {
    const { grupos } = relacionar(indice, [origemDaConsulta('neoplasia renal')], { porModulo: 8 })
    const todos = grupos.flatMap((g) => g.itens.map((i) => i.ref))
    expect(todos).toContain('patozoom:carcinoma-renal-de-celulas-claras')
    expect(todos).toContain('tc:carcinoma-de-celulas-renais')
  })

  it('várias origens não devolvem o que já está no estudo', () => {
    const origens = ['tc:carcinoma-de-celulas-renais', 'us:rins'].map((r) => origemDoItem(indice.porRef.get(r)!))
    const { grupos } = relacionar(indice, origens, { excluir: new Set(['orgao:rim']) })
    const todos = grupos.flatMap((g) => g.itens.map((i) => i.ref))
    expect(todos).not.toContain('orgao:rim')
    expect(todos).not.toContain('us:rins')
    expect(todos).not.toContain('tc:carcinoma-de-celulas-renais')
  })
})
