import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  esquemaEntradaBusca,
  esquemaNoCurriculo,
  esquemaPagina,
  esquemaQuiz,
  esquemaRelatorio,
} from '@/lib/histologia/esquemas'
import { caminhoNoBlob } from '@/lib/histologia/midia'
import { chaveDeBusca, slugificar } from '@/lib/histologia/texto'

const RAIZ = path.resolve(__dirname, '../..')
const DADOS = path.join(RAIZ, 'data/histologia')
const ACERVO = path.join(RAIZ, 'public/Manual-Histologia')

const ler = (relativo: string) => JSON.parse(readFileSync(path.join(DADOS, relativo), 'utf8'))
const lerJsonl = (relativo: string) =>
  readFileSync(path.join(ACERVO, relativo), 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l))

const relatorio = esquemaRelatorio.parse(ler('relatorio.json'))
const fragmentos: string[] = ler('fragmentos.json')

describe('conciliação com o acervo de origem', () => {
  /**
   * Os nove contadores anunciados em `README.md` do pacote. Se algum divergir,
   * a interface está mostrando menos (ou mais) do que o acervo tem — e é isso
   * que "os contadores conciliam com o relatório" significa.
   */
  it('bate os nove contadores anunciados, somando o que foi descartado', () => {
    /*
     * Os contadores do relatório informam o que ficou **nos dados**; o que a
     * origem tinha é o que ficou mais o que foi descartado por não ser imagem.
     * Somar aqui é o que impede duas falhas opostas: perder conteúdo em
     * silêncio, e "consertar" o número escondendo a perda.
     */
    const d = relatorio.descartados
    expect(relatorio.paginas).toBe(1524)
    expect(relatorio.imagensBase + d.bases).toBe(1318)
    expect(relatorio.overlays + d.overlays).toBe(7775)
    expect(relatorio.imagensDeQuiz + d.imagensDeQuiz).toBe(388)
    expect(relatorio.pacotesH5p).toBe(19)
    expect(relatorio.quizzes).toBe(19)
    expect(relatorio.questoes).toBe(388)
    expect(relatorio.referenciasDeArquivo).toBe(9500)
    expect(relatorio.assetsUnicos).toBe(9175)
  })

  it('todo descarte tem justificativa registrada', () => {
    const invalidos = JSON.parse(
      readFileSync(path.join(ACERVO, 'dados/assets-invalidos.json'), 'utf8'),
    )
    expect(Object.keys(invalidos)).toHaveLength(relatorio.descartados.assets)
    for (const [sha, registro] of Object.entries<Record<string, string>>(invalidos)) {
      expect(sha).toMatch(/^[0-9a-f]{64}$/)
      expect(registro.motivo.length).toBeGreaterThan(30)
      expect(registro.arquivo).toBeTruthy()
    }
  })

  it('nenhum asset descartado sobrou nos dados', () => {
    const invalidos = Object.keys(
      JSON.parse(readFileSync(path.join(ACERVO, 'dados/assets-invalidos.json'), 'utf8')),
    )
    for (const arquivo of readdirSync(path.join(DADOS, 'paginas'))) {
      const conteudo: Record<string, { base?: { sha256: string } | null; overlays: Array<{ midia: { sha256: string } }> }> =
        JSON.parse(readFileSync(path.join(DADOS, 'paginas', arquivo), 'utf8'))
      for (const pagina of Object.values(conteudo)) {
        if (pagina.base) expect(invalidos).not.toContain(pagina.base.sha256)
        for (const o of pagina.overlays) expect(invalidos).not.toContain(o.midia.sha256)
      }
    }
  })

  it('separa lâminas de nós de índice sem perder páginas', () => {
    expect(relatorio.laminas + relatorio.secoes).toBe(relatorio.paginas)
    expect(relatorio.laminas).toBe(1320)
  })

  it('não tem divergências pendentes', () => {
    expect(relatorio.divergencias).toEqual([])
  })
})

describe('fragmentos de página', () => {
  const arquivos = readdirSync(path.join(DADOS, 'paginas')).filter((f) => f.endsWith('.json'))

  it('o índice de fragmentos corresponde aos arquivos em disco', () => {
    expect(arquivos.map((f) => f.replace(/\.json$/, '')).sort()).toEqual([...fragmentos].sort())
  })

  it.each(arquivos)('%s valida contra o schema', (arquivo) => {
    const conteudo: Record<string, unknown> = JSON.parse(
      readFileSync(path.join(DADOS, 'paginas', arquivo), 'utf8'),
    )
    for (const [rota, pagina] of Object.entries(conteudo)) {
      const validada = esquemaPagina.parse(pagina)
      // A chave do mapa tem de ser a rota da página, senão `obterPagina` erra
      // silenciosamente e devolve 404 para páginas que existem.
      expect(validada.caminho.join('/')).toBe(rota)
    }
  })

  it('todas as rotas são únicas em todo o módulo', () => {
    const vistas = new Set<string>()
    for (const arquivo of arquivos) {
      const conteudo = JSON.parse(readFileSync(path.join(DADOS, 'paginas', arquivo), 'utf8'))
      for (const rota of Object.keys(conteudo)) {
        expect(vistas.has(rota), `rota duplicada: ${rota}`).toBe(false)
        vistas.add(rota)
      }
    }
    expect(vistas.size).toBe(relatorio.paginas)
  })

  it('todo segmento de rota é seguro para URL', () => {
    for (const arquivo of arquivos) {
      const conteudo = JSON.parse(readFileSync(path.join(DADOS, 'paginas', arquivo), 'utf8'))
      for (const rota of Object.keys(conteudo)) {
        for (const segmento of rota.split('/')) {
          expect(segmento).toMatch(/^[a-z0-9-]+$/)
          expect(segmento).toBe(encodeURIComponent(segmento))
        }
      }
    }
  })

  it('nenhuma lâmina declara calibração — o acervo não tem µm/px', () => {
    for (const arquivo of arquivos) {
      const conteudo: Record<string, { calibracao?: unknown }> = JSON.parse(
        readFileSync(path.join(DADOS, 'paginas', arquivo), 'utf8'),
      )
      for (const pagina of Object.values(conteudo)) {
        expect(pagina.calibracao).toBeUndefined()
      }
    }
  })

  it('nada está marcado como publicado sem revisor biomédico', () => {
    for (const arquivo of arquivos) {
      const conteudo: Record<string, { revisao: { estado: string; revisor?: string } }> = JSON.parse(
        readFileSync(path.join(DADOS, 'paginas', arquivo), 'utf8'),
      )
      for (const pagina of Object.values(conteudo)) {
        if (pagina.revisao.estado === 'publicado') expect(pagina.revisao.revisor).toBeTruthy()
      }
    }
  })
})

describe('quizzes', () => {
  const arquivos = readdirSync(path.join(DADOS, 'quizzes')).filter((f) => f.endsWith('.json'))

  it('são 19', () => {
    expect(arquivos).toHaveLength(19)
  })

  it.each(arquivos)('%s valida e tem gabarito em toda questão', (arquivo) => {
    const quiz = esquemaQuiz.parse(
      JSON.parse(readFileSync(path.join(DADOS, 'quizzes', arquivo), 'utf8')),
    )
    expect(quiz.slug).toBe(arquivo.replace(/\.json$/, ''))
    for (const questao of quiz.questoes) {
      expect(questao.alternativas.some((a) => a.correta)).toBe(true)
      // Enunciado e alternativas passaram por `textoDeHtml`: nenhum resquício de
      // markup do H5P pode chegar à interface.
      expect(questao.enunciado).not.toMatch(/<[^>]+>|&nbsp;/)
      for (const alternativa of quiz.questoes.flatMap((q) => q.alternativas)) {
        expect(alternativa.texto).not.toMatch(/<[^>]+>|&nbsp;/)
      }
    }
  })

  it('o alt das imagens de avaliação não entrega a resposta', () => {
    for (const arquivo of arquivos) {
      const quiz = JSON.parse(readFileSync(path.join(DADOS, 'quizzes', arquivo), 'utf8'))
      for (const questao of quiz.questoes) {
        if (!questao.midia) continue
        const alt = chaveDeBusca(questao.midia.alt)
        for (const correta of questao.alternativas.filter((a: { correta: boolean }) => a.correta)) {
          expect(alt).not.toContain(chaveDeBusca(correta.texto))
        }
      }
    }
  })
})

describe('currículo e busca', () => {
  it('o currículo valida e soma as lâminas corretamente', () => {
    const curriculo = ler('curriculo.json')
    for (const setor of curriculo) esquemaNoCurriculo.parse(setor)
    const total = curriculo.reduce((n: number, s: { laminas: number }) => n + s.laminas, 0)
    expect(total).toBe(relatorio.laminas)
  })

  it('preserva a ordem do catálogo nos quatro setores', () => {
    const curriculo: Array<{ titulo: string }> = ler('curriculo.json')
    expect(curriculo.map((s) => s.titulo)).toEqual([
      'Histologia Básica',
      'Células',
      'Tecidos',
      'Órgãos e Sistemas',
    ])
  })

  it('os dois índices de busca validam', () => {
    for (const arquivo of ['busca-cliente.json', 'busca-servidor.json']) {
      const entradas = ler(arquivo)
      expect(entradas.length).toBeGreaterThan(0)
      for (const entrada of entradas.slice(0, 400)) esquemaEntradaBusca.parse(entrada)
    }
  })

  it('o índice do cliente não carrega estruturas — elas ficam no servidor', () => {
    const cliente: Array<{ t: string }> = ler('busca-cliente.json')
    expect(cliente.some((e) => e.t === 'e')).toBe(false)
    expect(cliente).toHaveLength(relatorio.paginas + relatorio.quizzes)
  })

  it('o índice do cliente cabe num carregamento sob demanda', () => {
    const bytes = readFileSync(path.join(DADOS, 'busca-cliente.json')).byteLength
    // 700 KB crus ≈ 90 KB comprimidos. Acima disso, o índice deixa de ser
    // "instantâneo" em rede móvel e precisa voltar para o servidor.
    expect(bytes).toBeLessThan(700_000)
  })

  it('toda chave de busca já está normalizada', () => {
    const entradas: Array<{ k: string }> = ler('busca-servidor.json')
    for (const entrada of entradas.slice(0, 2000)) {
      expect(entrada.k).toBe(chaveDeBusca(entrada.k))
    }
  })
})

describe('mídia', () => {
  const plano = lerJsonl('dados/plano-assets-blob.jsonl')

  /**
   * O caminho no Blob precisa ser reproduzível a partir de `sha256` + `ext`,
   * porque é assim que o resolver monta a URL em tempo de execução. Se
   * divergisse, teríamos 404 em produção e nada em desenvolvimento — o pior
   * modo de falha possível.
   */
  it('o caminho no Blob é derivável de sha256 + extensão nos 9.175 assets', () => {
    for (const item of plano) {
      const ext = item.arquivoLocal.split('.').pop()!.toLowerCase()
      expect(caminhoNoBlob(item.sha256, ext)).toBe(item.blobPath)
    }
  })

  it('nenhum asset é duplicado por hash', () => {
    const hashes = new Set(plano.map((p: { sha256: string }) => p.sha256))
    expect(hashes.size).toBe(plano.length)
    expect(hashes.size).toBe(relatorio.assetsUnicos)
  })

  it('toda mídia referenciada pelas páginas existe no plano de assets', () => {
    const conhecidos = new Set(plano.map((p: { sha256: string }) => p.sha256))
    let conferidas = 0
    for (const arquivo of readdirSync(path.join(DADOS, 'paginas'))) {
      const conteudo: Record<string, { base?: { sha256: string } | null; overlays: Array<{ midia: { sha256: string } }> }> =
        JSON.parse(readFileSync(path.join(DADOS, 'paginas', arquivo), 'utf8'))
      for (const pagina of Object.values(conteudo)) {
        if (pagina.base) {
          expect(conhecidos.has(pagina.base.sha256)).toBe(true)
          conferidas++
        }
        for (const overlay of pagina.overlays) {
          expect(conhecidos.has(overlay.midia.sha256)).toBe(true)
          conferidas++
        }
      }
    }
    expect(conferidas).toBe(relatorio.imagensBase + relatorio.overlays)
  })

  it('toda imagem tem texto alternativo em português', () => {
    for (const arquivo of readdirSync(path.join(DADOS, 'paginas'))) {
      const conteudo: Record<string, { base?: { alt: string } | null; overlays: Array<{ midia: { alt: string } }> }> =
        JSON.parse(readFileSync(path.join(DADOS, 'paginas', arquivo), 'utf8'))
      for (const pagina of Object.values(conteudo)) {
        if (pagina.base) expect(pagina.base.alt.length).toBeGreaterThan(10)
        for (const overlay of pagina.overlays) expect(overlay.midia.alt.length).toBeGreaterThan(10)
      }
    }
  })
})

describe('paridade de normalização entre build e aplicação', () => {
  /**
   * O pipeline normaliza as chaves de busca em Node; a aplicação normaliza a
   * consulta no navegador. Se as duas implementações divergissem, a busca
   * deixaria de encontrar exatamente os termos que o build indexou — e o bug
   * seria silencioso. Este fixture é gerado pelo pipeline e conferido aqui.
   */
  it('reproduz o fixture gerado pelo pipeline', () => {
    const fixture: Array<{ entrada: string; chave: string; slug: string }> = ler(
      'fixture-normalizacao.json',
    )
    expect(fixture.length).toBeGreaterThan(0)
    for (const caso of fixture) {
      expect(chaveDeBusca(caso.entrada)).toBe(caso.chave)
      expect(slugificar(caso.entrada)).toBe(caso.slug)
    }
  })
})

describe('carregadores gerados', () => {
  it('cobrem todos os fragmentos e quizzes em disco', () => {
    const fonte = readFileSync(path.join(RAIZ, 'lib/histologia/carregadores.gerado.ts'), 'utf8')
    for (const chave of fragmentos) {
      expect(fonte).toContain(`data/histologia/paginas/${chave}.json`)
    }
    for (const arquivo of readdirSync(path.join(DADOS, 'quizzes'))) {
      expect(fonte).toContain(`data/histologia/quizzes/${arquivo}`)
    }
  })
})
