import { describe, expect, it } from 'vitest'
import { COLECAO_TC } from '@/lib/radiologia/casos-tc'
import { COLECAO_RX } from '@/lib/radiologia/casos-rx'
import { urlDoCorte } from '@/lib/radiologia/casos-imagem'
import manifestoBruto from '@/data/radiologia/casos-imagem.json'
import type { ColecaoCasos } from '@/lib/radiologia/casos-imagem-colecao'

/**
 * Os casos com apontamentos juntam o manifesto gerado pelo script (séries,
 * cortes e setas) e o texto escrito à mão. Estes testes impedem que eles
 * descolem — seta sem tradução, caso sem consulta, seta fora da imagem — e
 * cobram a profundidade do comentário de cada seta e a forma das alternativas.
 */
function auditar(nome: string, colecao: ColecaoCasos, minimo: number) {
  describe(`casos com apontamentos: ${nome}`, () => {
    it('monta todos os casos do manifesto com conteúdo', () => {
      expect(colecao.casos.length).toBeGreaterThanOrEqual(minimo)
      expect(colecao.casos.length).toBe(colecao.manifesto.length)
      expect(new Set(colecao.casos.map((c) => c.slug)).size).toBe(colecao.casos.length)
      // Caso baixado e enviado ao Blob mas sem texto ficaria invisível no catálogo.
      const semConteudo = (manifestoBruto.casos as { slug: string; modalidade: string }[])
        .filter((m) => m.modalidade === colecao.modalidade && !colecao.conteudo(m.slug))
        .map((m) => m.slug)
      expect(semConteudo, 'casos do manifesto sem conteúdo').toEqual([])
    })

    it('traduz toda seta do autor e não traz traduções órfãs', () => {
      for (const m of colecao.manifesto) {
        const conteudo = colecao.conteudo(m.slug)!
        const rotulos = m.series.flatMap((s) => s.anotacoes.map((a) => a.rotulo.trim()))
        for (const rotulo of rotulos) expect(rotulo in conteudo.rotulos, `${m.slug}: seta "${rotulo}" sem tradução`).toBe(true)
        for (const chave of Object.keys(conteudo.rotulos)) expect(rotulos.includes(chave), `${m.slug}: tradução órfã "${chave}"`).toBe(true)
      }
    })

    it('comenta cada apontamento em profundidade', () => {
      for (const caso of colecao.casos) {
        expect(caso.apontamentos.length, `${caso.slug}: sem apontamentos`).toBeGreaterThan(0)
        for (const a of caso.apontamentos) {
          expect(a.resumo.length, `${caso.slug}: ${a.nome}`).toBeGreaterThan(20)
          expect(a.explicacao, `${caso.slug}: "${a.nome}" sem explicação própria`).not.toBe(a.resumo)
          expect(a.explicacao.length, `${caso.slug}: explicação rasa em "${a.nome}"`).toBeGreaterThan(180)
        }
      }
    })

    it('posiciona cada seta numa série e num corte que existem, dentro da imagem', () => {
      for (const caso of colecao.casos) {
        for (const a of caso.apontamentos) {
          const serie = caso.series[a.serie]
          expect(serie, caso.slug).toBeDefined()
          for (const p of a.pontos) {
            expect(p.corte, caso.slug).toBeGreaterThanOrEqual(0)
            expect(p.corte, caso.slug).toBeLessThan(serie.totalFatias)
            expect(p.x, caso.slug).toBeGreaterThanOrEqual(0)
            expect(p.x, caso.slug).toBeLessThanOrEqual(serie.largura)
            expect(p.y, caso.slug).toBeGreaterThanOrEqual(0)
            expect(p.y, caso.slug).toBeLessThanOrEqual(serie.altura)
          }
        }
        for (const s of caso.series) expect(urlDoCorte(s, 1)).toMatch(/\/radiologia\/(tc|rx)\/[a-z0-9-]+\/(s\d+-)?1\.jpg$/)
      }
    })

    it('organiza cada caso num tema declarado da sua região', () => {
      for (const caso of colecao.casos) {
        expect(caso.tema, caso.slug).not.toBe('Outros')
        expect(colecao.temas[caso.categoria], caso.slug).toContain(caso.tema)
      }
    })

    it('escreve a leitura do exame inteira', () => {
      for (const caso of colecao.casos) {
        expect(caso.titulo.length, caso.slug).toBeGreaterThan(8)
        expect(caso.resumo.length, caso.slug).toBeGreaterThan(60)
        expect(caso.achados.length, caso.slug).toBeGreaterThanOrEqual(3)
        expect(caso.armadilhas.length, caso.slug).toBeGreaterThanOrEqual(2)
        expect(caso.conduta.length, caso.slug).toBeGreaterThan(80)
      }
    })

    describe('consulta do quiz', () => {
      const questoes = () =>
        colecao.casos.map((caso) => {
          const v = colecao.vinheta(caso.slug)!
          return { slug: caso.slug, v, alternativas: [v.achado, ...v.distratores.map((x) => x.nome)] }
        })

      it('conta a consulta inteira, com antecedentes por natureza', () => {
        for (const { slug, v } of questoes()) {
          expect(v.identificacao.length, slug).toBeGreaterThan(15)
          expect(v.queixa.length, slug).toBeGreaterThan(15)
          expect(v.historia.length, slug).toBeGreaterThan(150)
          expect(v.antecedentes.length, slug).toBeGreaterThanOrEqual(4)
          expect(v.exame.length, slug).toBeGreaterThanOrEqual(3)
          expect(v.pedido.length, slug).toBeGreaterThan(40)
          expect(v.correlacao.length, slug).toBeGreaterThan(200)
          expect(v.veredito!.length, slug).toBeGreaterThan(v.achado.length)
          const texto = v.antecedentes.join(' ')
          expect(texto, `${slug}: sem antecedentes pessoais`).toMatch(/Pessoais:/)
          expect(texto, `${slug}: sem antecedentes familiares`).toMatch(/Familiares:/)
          for (const campo of ['pa', 'fc', 'fr', 'satO2'] as const) expect(v.vitais[campo], `${slug}: ${campo}`).toBeTruthy()
        }
      })

      it('oferece três distratores comentados e distintos', () => {
        for (const { slug, v } of questoes()) {
          expect(v.distratores.length, slug).toBe(3)
          const nomes = new Set(v.distratores.map((x) => x.nome))
          expect(nomes.size, slug).toBe(3)
          expect(nomes.has(v.achado), slug).toBe(false)
          for (const x of v.distratores) {
            expect(x.nome.length, slug).toBeGreaterThan(10)
            expect(x.porQue.length, `${slug}: descarte raso em "${x.nome}"`).toBeGreaterThan(120)
          }
        }
      })

      it('não usa pontuação explicativa, vírgula, absolutos nem rótulos longos', () => {
        const absoluto = /\b\w+mente\b|\bsempre\b|\bnunca\b|\bjamais\b|\btodos?\b|\bnenhum|\bapenas\b/i
        for (const { slug, alternativas } of questoes()) {
          for (const a of alternativas) {
            expect(a, `${slug}: "${a}"`).not.toMatch(/[—–("'",]/)
            expect(a, `${slug}: "${a}"`).not.toMatch(absoluto)
            expect(a.trim().split(/\s+/).length, `${slug}: "${a}"`).toBeLessThanOrEqual(7)
          }
        }
      })

      it('mantém a certa do tamanho dos distratores e sem padrão de extremo', () => {
        let maisLonga = 0
        let maisCurta = 0
        const lista = questoes()
        for (const { slug, v, alternativas } of lista) {
          const media = alternativas.slice(1).reduce((t, x) => t + x.length, 0) / 3
          const razao = v.achado.length / media
          expect(razao, `${slug}: "${v.achado}" curta demais`).toBeGreaterThan(0.6)
          expect(razao, `${slug}: "${v.achado}" longa demais`).toBeLessThan(1.5)
          const tamanhos = alternativas.map((x) => x.length)
          if (v.achado.length === Math.max(...tamanhos)) maisLonga += 1
          if (v.achado.length === Math.min(...tamanhos)) maisCurta += 1
        }
        if (lista.length < 10) return
        const teto = Math.round(lista.length * 0.38)
        const piso = Math.round(lista.length * 0.1)
        expect(maisLonga, `certa é a mais longa em ${maisLonga}/${lista.length}`).toBeLessThanOrEqual(teto)
        expect(maisCurta, `certa é a mais curta em ${maisCurta}/${lista.length}`).toBeLessThanOrEqual(teto)
        // O padrão inverso também se aprende: a certa nunca ser a mais longa ou a mais curta.
        expect(maisLonga, 'a certa quase nunca é a mais longa').toBeGreaterThanOrEqual(piso)
        expect(maisCurta, 'a certa quase nunca é a mais curta').toBeGreaterThanOrEqual(piso)
      })
    })
  })
}

auditar('TC', COLECAO_TC, 155)
auditar('Raio-X', COLECAO_RX, 54)
