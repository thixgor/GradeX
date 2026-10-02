import { describe, expect, it } from 'vitest'

import {
  naturezasDoTexto,
  orgaosDoTexto,
  orgaosNaOrdemDoTexto,
  radical,
  termosDoTexto,
} from '@/lib/manual-clinico/integracao/vocabulario'

describe('vocabulário clínico — órgãos', () => {
  it('lê o rim em todas as formas', () => {
    expect(orgaosDoTexto('Carcinoma de células renais de células claras')).toContain('rim')
    expect(orgaosDoTexto('Pielonefrite aguda')).toContain('rim')
    expect(orgaosDoTexto('Glomerulonefrite pós-infecciosa')).toContain('rim')
    expect(orgaosDoTexto('Hidronefrose grave')).toContain('rim')
  })

  it('não confunde adrenal, cárdia e células caliciformes com rim ou coração', () => {
    expect(orgaosDoTexto('Adenoma adrenal cortical')).not.toContain('rim')
    expect(orgaosDoTexto('Glândula suprarrenal')).toEqual(['adrenal'])
    expect(orgaosDoTexto('Zona glomerulosa')).not.toContain('rim')
    expect(orgaosDoTexto('Células caliciformes')).not.toContain('rim')
    expect(orgaosDoTexto('Junção esofagogástrica e cárdia')).not.toContain('coracao')
    expect(orgaosDoTexto('Insuficiência cardíaca')).toContain('coracao')
  })

  it('só aceita "vesícula" como vias biliares quando é a biliar', () => {
    expect(orgaosDoTexto('Vesícula biliar')).toContain('vias-biliares')
    expect(orgaosDoTexto('Vesícula na pele')).not.toContain('vias-biliares')
  })

  it('no texto de apoio, respeita a ordem em que o órgão aparece', () => {
    expect(orgaosNaOrdemDoTexto('Massa no rim direito que comprime o fígado')[0]).toBe('rim')
  })
})

describe('vocabulário clínico — natureza', () => {
  it('reconhece neoplasias, inflamações e processos vasculares', () => {
    expect(naturezasDoTexto('Carcinoma de células renais')).toContain('neoplasia')
    expect(naturezasDoTexto('Oncocitoma renal')).toContain('neoplasia')
    expect(naturezasDoTexto('Pielonefrite aguda')).toContain('inflamatoria')
    expect(naturezasDoTexto('Infarto renal')).toContain('vascular')
    expect(naturezasDoTexto('Cisto renal simples')).toContain('cistica')
    expect(naturezasDoTexto('Cistite')).not.toContain('cistica')
  })
})

describe('vocabulário clínico — termos', () => {
  it('desfaz o plural sem juntar palavras diferentes', () => {
    expect(radical('renais')).toBe('renal')
    expect(radical('celulas')).toBe('celula')
    expect(radical('hepatite')).not.toBe(radical('hepatico'))
  })

  it('descarta palavras que não dizem o assunto', () => {
    expect(termosDoTexto('Sinal de Murphy')).toEqual(['murphy'])
    expect(termosDoTexto('Caso de carcinoma renal')).toEqual(['carcinoma', 'renal'])
  })
})
