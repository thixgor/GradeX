import { describe, expect, it } from 'vitest'

import {
  capituloEditorialDaEntrada,
  formatarTextoCatalogado,
  sistemaEditorialDaEntrada,
  tituloEditorialDaEntrada,
} from '@/lib/histopatologia/catalogacao'

describe('títulos editoriais do atlas', () => {
  it('aplica sentence case sem destruir siglas médicas', () => {
    expect(formatarTextoCatalogado('necrose coagulativa')).toBe('Necrose coagulativa')
    expect(formatarTextoCatalogado('CORTES AXIAIS, T1 SEM CONTRASTE')).toBe(
      'Cortes axiais, T1 sem contraste',
    )
    expect(formatarTextoCatalogado('CD34')).toBe('CD34')
  })

  it('transforma códigos de séries neurológicas em nomes legíveis', () => {
    expect(tituloEditorialDaEntrada('rpgastropilo18c', 'T1 sem contraste')).toBe(
      'Astrocitoma pilocítico — caso 18C',
    )
    expect(tituloEditorialDaEntrada('nptglioblastoma6b', 'Cérebro - HE')).toBe(
      'Glioblastoma — caso 6B',
    )
  })

  it('usa a descrição quando o nome bruto é apenas número de lâmina', () => {
    expect(
      tituloEditorialDaEntrada('A. 100', 'Infarto do miocárdio em fase de reabsorção. Lam. A. 100'),
    ).toBe('Infarto do miocárdio em fase de reabsorção')
  })

  it('promove diagnósticos escondidos por códigos e nomeia séries externas', () => {
    expect(tituloEditorialDaEntrada('TGI-110', 'Sarcoma de Kaposi em TGI')).toBe(
      'Sarcoma de Kaposi em TGI',
    )
    expect(tituloEditorialDaEntrada('A. 10')).toBe('Lâmina A. 10')
    expect(tituloEditorialDaEntrada('hacettepe-com-case-17', 'Click for Video')).toBe(
      'Série Hacettepe — caso 17',
    )
    expect(
      tituloEditorialDaEntrada(
        'Cortes sagitais extensos descrevendo o estudo radiológico e seus principais achados no exame',
        'Descrição detalhada do caso',
        ['https://anatpat.unicamp.br/rpgastropilo18c.html'],
      ),
    ).toBe('Astrocitoma pilocítico — caso 18C')
  })

  it('localiza nomes clínicos frequentes do acervo internacional', () => {
    expect(tituloEditorialDaEntrada('Abdominal mesothelioma')).toBe('Mesotelioma abdominal')
    expect(tituloEditorialDaEntrada('Gallbladder Adenomyoma')).toBe(
      'Adenomioma da vesícula biliar',
    )
  })
})

describe('organização editorial do atlas', () => {
  it('corrige coleções neurológicas classificadas no sistema errado', () => {
    expect(
      sistemaEditorialDaEntrada(
        {
          nomeCatalogado: 'rpgastrodifuso11b',
          descricaoCatalogada: 'Com contraste',
          paginasFonte: ['https://anatpat.unicamp.br/rpgastrodifuso11b.html'],
        },
        'gastrointestinal',
      ),
    ).toBe('sistema-nervoso')
  })

  it('coloca páginas gerais das coleções em Patologia Geral', () => {
    expect(
      sistemaEditorialDaEntrada(
        {
          nomeCatalogado: 'Material complementar',
          paginasFonte: ['https://histopathologyatlas.com/introduction.html'],
        },
        'nao-classificado',
      ),
    ).toBe('patologia-geral')
  })

  it('distribui técnicas e casos em capítulos próprios', () => {
    expect(
      capituloEditorialDaEntrada({
        nomeCatalogado: 'CD34. Positivo em vasos',
        descricaoCatalogada: 'Imuno-histoquímica',
        modalidades: ['Imuno-histoquímica'],
        coloracoes: ['CD34'],
        temLaminaVirtual: false,
      }).id,
    ).toBe('tecnicas-e-marcadores')

    expect(
      capituloEditorialDaEntrada({
        nomeCatalogado: 'rpgastropilo18c',
        descricaoCatalogada: 'T1 com contraste',
        modalidades: ['Histologia'],
        coloracoes: [],
        temLaminaVirtual: false,
      }).id,
    ).toBe('casos-e-series')
  })
})
