import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { EXPLICACOES, normalizar, traduzirExplicacao } from '@/lib/histologia/explicacoes'

const DIR = path.resolve(__dirname, '../../data/histologia/paginas')

/**
 * Textos de `explicacaoOriginal` dos marcadores de estrutura, sem repetição.
 *
 * Lidos direto dos fragmentos JSON, e não pelo repositório: o repositório é
 * `server-only` e já aplica a tradução, então perguntar a ele o que falta
 * traduzir seria perguntar à resposta.
 *
 * O recorte por `classe === 'estrutura'` não é economia: das três classes de
 * camada do acervo, é a única cujo texto chega ao aluno. A de `credito` é
 * atribuição de imagem — a interface conta as camadas e remete aos créditos da
 * página, sem exibir o texto, e traduzir atribuição seria adulterá-la. A de
 * `navegacao` descreve o percurso do atlas de origem e não é renderizada.
 * Traduzir as duas encheria o dicionário de chaves que nunca são consultadas.
 */
function originais(): { textos: Set<string>; marcadores: number } {
  const textos = new Set<string>()
  let marcadores = 0
  for (const arquivo of readdirSync(DIR)) {
    if (arquivo.startsWith('_') || !arquivo.endsWith('.json')) continue
    const conteudo: Record<
      string,
      { overlays?: Array<{ classe?: string; explicacaoOriginal?: string }> }
    > = JSON.parse(readFileSync(path.join(DIR, arquivo), 'utf8'))
    for (const pagina of Object.values(conteudo)) {
      for (const o of pagina?.overlays ?? []) {
        if (o.classe !== 'estrutura' || !o.explicacaoOriginal) continue
        marcadores++
        textos.add(o.explicacaoOriginal)
      }
    }
  }
  return { textos, marcadores }
}

describe('dicionário de explicações de estrutura', () => {
  it('todo marcador do acervo tem descrição em português', () => {
    // A interface cai para o texto em inglês, com aviso de pendência, quando
    // `traduzirExplicacao` devolve `null`. Este teste é o que impede a
    // pendência de voltar sem ninguém perceber: um fragmento reprocessado que
    // traga texto novo — ou que reescreva um existente — falha aqui em vez de
    // aparecer em inglês para quem estuda.
    const { textos, marcadores } = originais()
    expect(marcadores).toBeGreaterThan(7000)

    const semTraducao = [...textos].filter((t) => !traduzirExplicacao(t))
    expect(
      semTraducao.length,
      `sem tradução (${semTraducao.length}): ${semTraducao
        .slice(0, 5)
        .map((t) => t.slice(0, 70))
        .join(' | ')}`,
    ).toBe(0)
  })

  it('nenhuma chave do dicionário ficou órfã', () => {
    // Chave órfã não quebra nada em produção — só some do resultado. Sem este
    // teste, um texto reescrito no acervo deixaria para trás a tradução antiga
    // e ninguém saberia que ela parou de ser usada.
    const chaves = new Set([...originais().textos].map(normalizar))
    const orfas = Object.keys(EXPLICACOES).filter((k) => !chaves.has(k))
    expect(
      orfas.length,
      `chaves sem correspondência no acervo (${orfas.length}): ${orfas
        .slice(0, 5)
        .map((k) => k.slice(0, 70))
        .join(' | ')}`,
    ).toBe(0)
  })

  it('as traduções estão em português', () => {
    // Mesmo lookaround Unicode do teste de aprofundamento: `\b` do JavaScript
    // é ASCII e faria 'is' casar dentro de 'anéis'.
    const ingles = /(?<!\p{L})(the|and|of|with|that|which|are|from|these|this)(?!\p{L})/iu
    for (const [chave, pt] of Object.entries(EXPLICACOES)) {
      expect(pt.trim().length, chave.slice(0, 60)).toBeGreaterThan(0)
      expect(ingles.test(pt), `"${pt.slice(0, 90)}"`).toBe(false)
    }
  })

  it('a normalização absorve espaço e aspas curvas', () => {
    // As duas divergências reais do acervo: o mesmo parágrafo aparece com
    // espaçamento diferente entre fragmentos, e `Meissner’s` convive com
    // `Meissner's`. Sem isso, o mesmo texto viraria duas chaves.
    expect(normalizar('  Two   words ')).toBe('two words')
    expect(normalizar('Meissner’s corpuscle')).toBe(normalizar("Meissner's corpuscle"))
  })

  it('texto ausente devolve null, não string vazia', () => {
    // `null` é o que faz a interface mostrar o original em inglês com a tarja
    // de pendência; string vazia apagaria a descrição da estrutura.
    expect(traduzirExplicacao('a phrase that is not in the atlas')).toBeNull()
    expect(traduzirExplicacao(undefined)).toBeNull()
    expect(traduzirExplicacao('')).toBeNull()
  })
})
