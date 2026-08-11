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

  it('substitui rótulos administrativos e códigos por entidades clinicopatológicas', () => {
    expect(
      tituloEditorialDaEntrada(
        'Additions of 2004 to 2006',
        undefined,
        ['https://anatpat.unicamp.br/epathadditions04-06.html'],
      ),
    ).toBe('Coleção de neuropatologia — novos casos (2004–2006)')

    expect(
      tituloEditorialDaEntrada('C-75', undefined, [
        'https://anatpat.unicamp.br/pecascard13.html',
      ]),
    ).toBe('Dissecção crônica da aorta com luz de reentrada')

    expect(
      tituloEditorialDaEntrada('Lâm. A. 111', undefined, [
        'https://anatpat.unicamp.br/lamcard13.html',
      ]),
    ).toBe('Miocardite chagásica crônica')

    expect(
      tituloEditorialDaEntrada('Lâm. A. 319', undefined, [
        'https://anatpat.unicamp.br/lamcard12.html',
      ]),
    ).toBe('Miocardite chagásica aguda')

    expect(
      tituloEditorialDaEntrada('AE1AE3', 'Antígeno epitelial de membrana', [
        'https://anatpat.unicamp.br/nptatrt2b.html',
      ]),
    ).toBe('Tumor teratoide/rabdoide atípico — caso 2B — AE1/AE3')
  })

  it('localiza nomes clínicos frequentes do acervo internacional', () => {
    expect(tituloEditorialDaEntrada('Abdominal mesothelioma')).toBe('Mesotelioma abdominal')
    expect(tituloEditorialDaEntrada('Erosion in Gastric Mucosa')).toBe(
      'Erosão da mucosa gástrica',
    )
    expect(tituloEditorialDaEntrada('Acute Perforated Appendicitis')).toBe(
      'Apendicite aguda perfurada',
    )
    expect(tituloEditorialDaEntrada('Cervix Squamous Cell Carcinoma')).toBe(
      'Carcinoma escamoso do colo uterino',
    )
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
