import { describe, expect, it } from 'vitest'
import {
  CASOS_TC,
  CASOS_TC_POR_SLUG,
  conteudoDoCasoTC,
  slugsDoManifestoTC,
  urlDoCorteTC,
  vinhetaDoCasoTC,
} from '@/lib/radiologia/casos-tc'

/**
 * Os casos de TC juntam duas fontes: o manifesto gerado pelo script de
 * sincronização (cortes e setas) e o texto escrito à mão. Estes testes impedem
 * que elas descolem — seta sem tradução, caso sem consulta, seta apontando para
 * um corte que não existe — e auditam a forma das alternativas do quiz.
 */
describe('casos clínicos de TC', () => {
  const manifesto = slugsDoManifestoTC()

  it('dá conteúdo a todo caso do manifesto', () => {
    expect(manifesto.length).toBeGreaterThanOrEqual(50)
    for (const { slug } of manifesto) {
      expect(conteudoDoCasoTC(slug), `caso sem conteúdo: ${slug}`).toBeDefined()
      expect(CASOS_TC_POR_SLUG.has(slug), slug).toBe(true)
    }
    expect(CASOS_TC.length).toBe(manifesto.length)
  })

  it('traduz toda seta do autor e não traz traduções órfãs', () => {
    for (const { slug, rotulos } of manifesto) {
      const conteudo = conteudoDoCasoTC(slug)!
      for (const rotulo of rotulos) {
        expect(rotulo in conteudo.rotulos, `${slug}: seta "${rotulo}" sem tradução`).toBe(true)
      }
      for (const chave of Object.keys(conteudo.rotulos)) {
        expect(rotulos.includes(chave), `${slug}: tradução órfã "${chave}"`).toBe(true)
      }
    }
  })

  it('posiciona cada seta num corte que existe e dentro da imagem', () => {
    for (const caso of CASOS_TC) {
      expect(caso.apontamentos.length, `${caso.slug}: sem apontamentos`).toBeGreaterThan(0)
      for (const a of caso.apontamentos) {
        expect(a.explicacao.length, `${caso.slug}: ${a.nome}`).toBeGreaterThan(20)
        for (const p of a.pontos) {
          expect(p.corte, caso.slug).toBeGreaterThanOrEqual(0)
          expect(p.corte, caso.slug).toBeLessThan(caso.totalFatias)
          expect(p.x, caso.slug).toBeGreaterThanOrEqual(0)
          expect(p.x, caso.slug).toBeLessThanOrEqual(caso.largura)
          expect(p.y, caso.slug).toBeGreaterThanOrEqual(0)
          expect(p.y, caso.slug).toBeLessThanOrEqual(caso.altura)
        }
      }
      expect(caso.corteInicial).toBeLessThan(caso.totalFatias)
    }
  })

  it('escreve a leitura do exame inteira', () => {
    for (const caso of CASOS_TC) {
      expect(caso.titulo.length, caso.slug).toBeGreaterThan(8)
      expect(caso.resumo.length, caso.slug).toBeGreaterThan(60)
      expect(caso.achados.length, caso.slug).toBeGreaterThanOrEqual(3)
      expect(caso.armadilhas.length, caso.slug).toBeGreaterThanOrEqual(2)
      expect(caso.conduta.length, caso.slug).toBeGreaterThan(80)
    }
  })

  it('monta a URL do corte no espelho', () => {
    expect(urlDoCorteTC('glioblastoma', 3)).toMatch(/\/radiologia\/tc\/glioblastoma\/3\.jpg$/)
  })

  describe('consulta do quiz', () => {
    const questoes = CASOS_TC.map((caso) => {
      const vinheta = vinhetaDoCasoTC(caso.slug)!
      return { slug: caso.slug, vinheta, alternativas: [vinheta.achado, ...vinheta.distratores.map((x) => x.nome)] }
    })

    it('conta a consulta inteira: queixa, história, antecedentes, vitais e exame', () => {
      for (const { slug, vinheta } of questoes) {
        expect(vinheta.identificacao.length, slug).toBeGreaterThan(15)
        expect(vinheta.queixa.length, slug).toBeGreaterThan(15)
        expect(vinheta.historia.length, slug).toBeGreaterThan(150)
        expect(vinheta.antecedentes.length, slug).toBeGreaterThanOrEqual(4)
        expect(vinheta.exame.length, slug).toBeGreaterThanOrEqual(3)
        expect(vinheta.pedido.length, slug).toBeGreaterThan(40)
        expect(vinheta.correlacao.length, slug).toBeGreaterThan(200)
        expect(vinheta.veredito!.length, slug).toBeGreaterThan(vinheta.achado.length)
        // Antecedentes separados por natureza: pessoais, familiares e hábitos
        // ou gestacionais — a história hereditária e os fatores de risco não
        // podem faltar.
        const texto = vinheta.antecedentes.join(' ')
        expect(texto, `${slug}: sem antecedentes pessoais`).toMatch(/Pessoais:/)
        expect(texto, `${slug}: sem antecedentes familiares`).toMatch(/Familiares:/)
        for (const campo of ['pa', 'fc', 'fr', 'satO2'] as const) expect(vinheta.vitais[campo], `${slug}: ${campo}`).toBeTruthy()
      }
    })

    it('oferece três distratores comentados e distintos', () => {
      for (const { slug, vinheta } of questoes) {
        expect(vinheta.distratores.length, slug).toBe(3)
        const nomes = new Set(vinheta.distratores.map((x) => x.nome))
        expect(nomes.size, slug).toBe(3)
        expect(nomes.has(vinheta.achado), slug).toBe(false)
        for (const x of vinheta.distratores) {
          expect(x.nome.length, slug).toBeGreaterThan(10)
          expect(x.porQue.length, `${slug}: descarte raso em "${x.nome}"`).toBeGreaterThan(120)
        }
      }
    })

    it('não usa pontuação explicativa, vírgula nem rótulos longos', () => {
      for (const { slug, alternativas } of questoes) {
        for (const alternativa of alternativas) {
          expect(alternativa, `${slug}: "${alternativa}"`).not.toMatch(/[—–("'",]/)
          expect(alternativa.trim().split(/\s+/).length, `${slug}: "${alternativa}"`).toBeLessThanOrEqual(7)
        }
      }
    })

    it('não entrega distrator por advérbio absoluto', () => {
      const absoluto = /\b\w+mente\b|\bsempre\b|\bnunca\b|\bjamais\b|\btodos?\b|\bnenhum/i
      for (const { slug, alternativas } of questoes) {
        for (const alternativa of alternativas) expect(alternativa, `${slug}: "${alternativa}"`).not.toMatch(absoluto)
      }
    })

    it('mantém a certa do tamanho dos distratores e sem padrão de extremo', () => {
      let maisLonga = 0
      let maisCurta = 0
      for (const { slug, vinheta, alternativas } of questoes) {
        const outras = alternativas.slice(1)
        const media = outras.reduce((t, x) => t + x.length, 0) / outras.length
        const razao = vinheta.achado.length / media
        expect(razao, `${slug}: "${vinheta.achado}" curta demais`).toBeGreaterThan(0.6)
        expect(razao, `${slug}: "${vinheta.achado}" longa demais`).toBeLessThan(1.5)
        const tamanhos = alternativas.map((x) => x.length)
        if (vinheta.achado.length === Math.max(...tamanhos)) maisLonga += 1
        if (vinheta.achado.length === Math.min(...tamanhos)) maisCurta += 1
      }
      const teto = Math.round(questoes.length * 0.38)
      expect(maisLonga, `certa é a mais longa em ${maisLonga}/${questoes.length}`).toBeLessThanOrEqual(teto)
      expect(maisCurta, `certa é a mais curta em ${maisCurta}/${questoes.length}`).toBeLessThanOrEqual(teto)
    })
  })
})
