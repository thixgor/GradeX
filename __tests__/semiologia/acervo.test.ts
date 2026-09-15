import { describe, expect, it } from 'vitest'
import { COMPARADORES } from '@/lib/semiologia/comparadores'
import { SINAIS } from '@/lib/semiologia/sinais'
import { JANELAS_ULTRASSOM } from '@/lib/semiologia/ultrassom'
import { TOTAL_DE_CENAS, VISTAS } from '@/lib/semiologia/vistas'
import { montarCatalogo, resumosDeSinais, resumosDeVistas } from '@/lib/semiologia/catalogo'

/**
 * O que este arquivo protege.
 *
 * O acervo é conteúdo escrito à mão, e conteúdo à mão erra de três formas
 * previsíveis: slug repetido (que quebra a rota e faz uma ficha sumir), cena
 * apontando para uma figura que ninguém desenhou (quadro vazio em produção) e
 * célula de comparador faltando (buraco silencioso no meio da tabela, que
 * ninguém percebe porque a tabela continua renderizando).
 *
 * Nenhum dos três aparece em `tsc`: são erros de *dado*, não de tipo. Só um
 * teste pega.
 *
 * O registro de ilustrações fica num módulo `'use client'` com JSX, então a
 * lista de ids conhecidos é repetida aqui de propósito, como espelho: se
 * alguém acrescentar uma figura sem registrá-la, o espelho desencontra e o
 * teste reclama — que é exatamente o aviso que se quer.
 */
const IDS_REGISTRADOS = new Set([
  'ictericia',
  'edema',
  'cianose',
  'jugular',
  'baqueteamento',
  'ascite',
  'asterixe',
  'enchimento-capilar',
  'palidez',
  'aranha-vascular',
  'murphy',
  'blumberg',
  'otoscopia',
  'fundoscopia',
  'orofaringe',
  'rinoscopia',
  'pupilas',
  'ultrassom',
])

describe('integridade do acervo', () => {
  it('não repete slug em nenhuma das alas', () => {
    for (const [nome, slugs] of [
      ['sinais', SINAIS.map((s) => s.slug)],
      ['vistas', VISTAS.map((v) => v.slug)],
      ['janelas', JANELAS_ULTRASSOM.map((j) => j.slug)],
      ['comparadores', COMPARADORES.map((c) => c.slug)],
    ] as const) {
      expect(new Set(slugs).size, `slug repetido em ${nome}`).toBe(slugs.length)
    }
  })

  it('toda figura referenciada existe no registro', () => {
    const referencias = [
      ...SINAIS.flatMap((s) => (s.ilustracao ? [s.ilustracao.id] : [])),
      ...VISTAS.flatMap((v) => v.cenas.map((c) => c.ilustracao.id)),
      ...JANELAS_ULTRASSOM.flatMap((j) => j.cenas.map((c) => c.ilustracao.id)),
      ...COMPARADORES.flatMap((c) => c.colunas.flatMap((col) => (col.ilustracao ? [col.ilustracao.id] : []))),
    ]
    for (const id of new Set(referencias)) {
      expect(IDS_REGISTRADOS.has(id), `figura "${id}" referenciada mas não registrada`).toBe(true)
    }
  })

  it('toda figura tem texto alternativo', () => {
    const alts = [
      ...SINAIS.flatMap((s) => (s.ilustracao ? [s.ilustracao.alt] : [])),
      ...VISTAS.flatMap((v) => v.cenas.map((c) => c.ilustracao.alt)),
      ...JANELAS_ULTRASSOM.flatMap((j) => j.cenas.map((c) => c.ilustracao.alt)),
    ]
    for (const alt of alts) expect(alt.length).toBeGreaterThan(10)
  })

  it('cada janela de imagem tem exatamente uma cena normal', () => {
    // O visor usa a cena normal como referência do comparador e como capa do
    // catálogo. Sem ela, o botão "comparar com o normal" compara com nada.
    for (const janela of [...VISTAS, ...JANELAS_ULTRASSOM]) {
      const normais = janela.cenas.filter((cena) => cena.estado === 'normal')
      expect(normais.length, `${janela.slug} deveria ter uma cena normal`).toBe(1)
    }
  })

  it('toda cena alterada explica a diferença para o normal', () => {
    for (const janela of [...VISTAS, ...JANELAS_ULTRASSOM]) {
      for (const cena of janela.cenas) {
        if (cena.estado !== 'alterado') continue
        expect(cena.diferencaDoNormal.length, `${janela.slug}/${cena.id}`).toBeGreaterThan(40)
      }
    }
  })

  it('marcadores de estrutura caem dentro da figura', () => {
    // As coordenadas são porcentagem do `viewBox` 0–100 das ilustrações. Um
    // valor fora da faixa põe o marcador fora da caixa, onde ninguém clica.
    for (const janela of [...VISTAS, ...JANELAS_ULTRASSOM]) {
      for (const estrutura of janela.estruturas) {
        expect(estrutura.x, `${janela.slug}/${estrutura.slug}.x`).toBeGreaterThanOrEqual(0)
        expect(estrutura.x).toBeLessThanOrEqual(100)
        expect(estrutura.y, `${janela.slug}/${estrutura.slug}.y`).toBeGreaterThanOrEqual(0)
        expect(estrutura.y).toBeLessThanOrEqual(100)
      }
    }
  })

  it('todo comparador preenche a matriz inteira', () => {
    for (const comparador of COMPARADORES) {
      for (const coluna of comparador.colunas) {
        for (const eixo of comparador.eixos) {
          expect(
            coluna.celulas[eixo.id],
            `${comparador.slug}: falta a célula ${coluna.id} × ${eixo.id}`,
          ).toBeDefined()
        }
      }
    }
  })

  it('toda célula decisiva explica por quê', () => {
    // A célula decisiva é a que o aluno leva para o plantão. Sem o detalhe, ela
    // vira cartão de memória — exatamente o que o comparador existe para evitar.
    for (const comparador of COMPARADORES) {
      for (const coluna of comparador.colunas) {
        for (const [eixo, celula] of Object.entries(coluna.celulas)) {
          if (!celula.decisiva) continue
          expect(celula.detalhe, `${comparador.slug}/${coluna.id}/${eixo}`).toBeTruthy()
        }
      }
    }
  })

  it('todo sinal com comparador aponta para um comparador que existe', () => {
    const existentes = new Set(COMPARADORES.map((c) => c.slug))
    for (const sinal of SINAIS) {
      if (!sinal.comparador) continue
      expect(existentes.has(sinal.comparador), `${sinal.slug} → ${sinal.comparador}`).toBe(true)
    }
  })

  it('todo sinal e toda cena citam referência', () => {
    for (const sinal of SINAIS) expect(sinal.referencias.length, sinal.slug).toBeGreaterThan(0)
    for (const janela of [...VISTAS, ...JANELAS_ULTRASSOM]) {
      expect(janela.referencias.length, janela.slug).toBeGreaterThan(0)
    }
  })

  it('número de desempenho sempre vem com fonte e leitura', () => {
    // Cifra sem procedência é pior que ausência de cifra: parece autoridade.
    for (const sinal of SINAIS) {
      for (const item of sinal.desempenho ?? []) {
        expect(item.fonte, sinal.slug).toBeTruthy()
        expect(item.leitura.length, sinal.slug).toBeGreaterThan(20)
      }
    }
  })
})

describe('recorte para o cliente', () => {
  it('o resumo do sinal não carrega o corpo da ficha', () => {
    // O catálogo existe para o mecanismo, as causas e o desempenho NÃO
    // atravessarem a rede. Se algum dia alguém acrescentar um campo pesado ao
    // resumo, este teste avisa antes de o bundle engordar.
    const [resumo] = resumosDeSinais()
    expect(resumo).toBeDefined()
    for (const campo of ['mecanismo', 'causas', 'desempenho', 'armadilhas', 'comoProcurar', 'referencias']) {
      expect(resumo as unknown as Record<string, unknown>).not.toHaveProperty(campo)
    }
  })

  it('a capa de cada vista é a cena normal', () => {
    for (const resumo of resumosDeVistas()) {
      const vista = VISTAS.find((v) => v.slug === resumo.slug)!
      const normal = vista.cenas.find((c) => c.estado === 'normal')!
      expect(resumo.capa.params).toEqual(normal.ilustracao.params)
    }
  })

  it('os totais batem com o acervo', () => {
    const catalogo = montarCatalogo()
    expect(catalogo.totais.sinais).toBe(SINAIS.length)
    expect(catalogo.totais.vistas).toBe(VISTAS.length)
    expect(catalogo.totais.cenas).toBe(TOTAL_DE_CENAS)
    expect(catalogo.totais.janelas).toBe(JANELAS_ULTRASSOM.length)
    expect(catalogo.totais.comparadores).toBe(COMPARADORES.length)
  })
})
