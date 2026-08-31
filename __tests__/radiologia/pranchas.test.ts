import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  GUIA_PRANCHAS,
  PRANCHAS,
  TOTAL_TERRITORIOS_PRANCHAS,
  getPrancha,
  irmasDaPrancha,
  resumosPranchas,
} from '@/lib/radiologia/pranchas'

/**
 * As pranchas são figuras fechadas: o texto do site e o que está pintado dentro
 * da imagem precisam continuar dizendo a mesma coisa. Estes testes seguram os
 * três jeitos de isso se romper em silêncio — arquivo de imagem que não subiu
 * junto, contagem de segmentos que deixou de bater com a anatomia, e o dossiê
 * inteiro vazando para o bundle do catálogo.
 */

const PUBLIC = join(__dirname, '..', '..', 'public')

describe('pranchas de anatomia pulmonar', () => {
  it('tem as quatro figuras, numeradas e com slug único', () => {
    expect(PRANCHAS).toHaveLength(4)
    expect(PRANCHAS.map((p) => p.figura)).toEqual([1, 2, 3, 4])
    expect(new Set(PRANCHAS.map((p) => p.slug)).size).toBe(4)
    expect(PRANCHAS.filter((p) => p.tema === 'lobos')).toHaveLength(2)
    expect(PRANCHAS.filter((p) => p.tema === 'segmentos')).toHaveLength(2)
  })

  it('aponta para imagens que existem em public/', () => {
    for (const prancha of PRANCHAS) {
      for (const caminho of [prancha.imagem, prancha.imagemLimpa]) {
        expect(caminho).toMatch(/^\/img\/radiologia\/pranchas\/v1\//)
        expect(existsSync(join(PUBLIC, caminho)), `imagem ausente: ${caminho}`).toBe(true)
      }
      // A prancha marcada e o filme limpo têm de ser arquivos diferentes —
      // sem isso o botão "sem marcadores" não mostra nada de novo.
      expect(prancha.imagem).not.toBe(prancha.imagemLimpa)
    }
  })

  it('usa o mesmo filme limpo para cada incidência', () => {
    const porIncidencia = new Map<string, Set<string>>()
    for (const prancha of PRANCHAS) {
      const atual = porIncidencia.get(prancha.incidencia) ?? new Set<string>()
      atual.add(prancha.imagemLimpa)
      porIncidencia.set(prancha.incidencia, atual)
    }
    for (const [incidencia, arquivos] of porIncidencia) {
      expect(arquivos.size, `${incidencia} usa mais de um filme limpo`).toBe(1)
    }
  })

  it('conta 10 segmentos à direita e 8 à esquerda', () => {
    for (const slug of ['segmentos-pa', 'segmentos-perfil']) {
      const prancha = getPrancha(slug)!
      const total = prancha.grupos.reduce((soma, grupo) => soma + grupo.itens.length, 0)
      // No perfil, S4 e S5 do lobo médio aparecem num item só (não são
      // separáveis nessa incidência), então a soma cai de 18 para 17.
      expect(total, slug).toBe(slug === 'segmentos-pa' ? 18 : 17)
    }

    const pa = getPrancha('segmentos-pa')!
    const direita = pa.grupos
      .filter((grupo) => ['lsd', 'lm', 'lid'].includes(grupo.id))
      .reduce((soma, grupo) => soma + grupo.itens.length, 0)
    const esquerda = pa.grupos
      .filter((grupo) => ['lse', 'lie'].includes(grupo.id))
      .reduce((soma, grupo) => soma + grupo.itens.length, 0)
    expect(direita).toBe(10)
    expect(esquerda).toBe(8)
  })

  it('nomeia as fusões do pulmão esquerdo', () => {
    const siglas = getPrancha('segmentos-pa')!
      .grupos.flatMap((grupo) => grupo.itens.map((item) => item.sigla))
    expect(siglas).toContain('S1+2')
    expect(siglas).toContain('S7+8')
  })

  it('dá slug único e cor válida a cada território', () => {
    for (const prancha of PRANCHAS) {
      const slugs = prancha.grupos.flatMap((grupo) => grupo.itens.map((item) => item.slug))
      expect(new Set(slugs).size, `slugs repetidos em ${prancha.slug}`).toBe(slugs.length)
      for (const item of prancha.grupos.flatMap((grupo) => grupo.itens)) {
        expect(item.cor, `${prancha.slug}/${item.slug}`).toMatch(/^#[0-9a-f]{6}$/i)
        // O slug vira chave de seção do caderno, que só aceita [\w-].
        expect(item.slug).toMatch(/^[\w-]+$/)
        expect(item.onde.length).toBeGreaterThan(20)
        expect(item.leitura.length).toBeGreaterThan(40)
      }
    }
  })

  it('entrega o texto longo que a página desenha', () => {
    for (const prancha of PRANCHAS) {
      expect(prancha.legenda.startsWith(`Figura ${prancha.figura}.`)).toBe(true)
      expect(prancha.legenda.length).toBeGreaterThan(400)
      expect(prancha.leitura.length).toBeGreaterThanOrEqual(3)
      expect(prancha.clinica.length).toBeGreaterThanOrEqual(2)
      expect(prancha.convencoes.length).toBeGreaterThanOrEqual(2)
      expect(prancha.armadilhas.length).toBeGreaterThanOrEqual(3)
      expect(prancha.limites.length).toBeGreaterThanOrEqual(2)
      expect(prancha.checagem.length).toBeGreaterThanOrEqual(4)
      for (const bloco of [...prancha.leitura, ...prancha.clinica]) {
        expect(bloco.paragrafos.length).toBeGreaterThan(0)
      }
    }
    expect(GUIA_PRANCHAS.length).toBeGreaterThanOrEqual(4)
  })

  it('só aponta relacionadas que existem', () => {
    const slugs = new Set(PRANCHAS.map((prancha) => prancha.slug))
    for (const prancha of PRANCHAS) {
      expect(prancha.relacionadas.length).toBeGreaterThan(0)
      for (const relacionada of prancha.relacionadas) {
        expect(slugs.has(relacionada), `${prancha.slug} → ${relacionada}`).toBe(true)
        expect(relacionada).not.toBe(prancha.slug)
      }
    }
  })

  it('soma os territórios de todas as pranchas', () => {
    const somado = PRANCHAS.reduce(
      (total, prancha) =>
        total + prancha.grupos.reduce((soma, grupo) => soma + grupo.itens.length, 0),
      0,
    )
    expect(TOTAL_TERRITORIOS_PRANCHAS).toBe(somado)
  })
})

describe('recorte magro do catálogo de pranchas', () => {
  const resumos = resumosPranchas()

  it('cobre as quatro pranchas com o que o card desenha', () => {
    expect(resumos).toHaveLength(PRANCHAS.length)
    for (const resumo of resumos) {
      expect(resumo.imagem).toMatch(/^\/img\/radiologia\/pranchas\//)
      expect(resumo.titulo.length).toBeGreaterThan(0)
      expect(resumo.resumo.length).toBeGreaterThan(40)
      expect(resumo.amostras.length).toBe(resumo.totalTerritorios)
    }
  })

  it('não leva o dossiê nem os textos longos', () => {
    // São eles que pesam. A página da figura os recebe por prop, uma por vez.
    const serializado = JSON.stringify(resumos)
    expect(serializado).not.toContain('armadilha')
    expect(serializado).not.toContain('legenda')
    expect(serializado).not.toContain('checagem')
    for (const resumo of resumos) {
      for (const amostra of resumo.amostras) {
        expect(Object.keys(amostra).sort()).toEqual(['cor', 'sigla'])
      }
    }
  })

  it('a trilha do cabeçalho lista as quatro, na ordem das figuras', () => {
    const irmas = irmasDaPrancha()
    expect(irmas.map((irma) => irma.figura)).toEqual([1, 2, 3, 4])
    for (const irma of irmas) {
      expect(getPrancha(irma.slug)).toBeDefined()
    }
  })
})
