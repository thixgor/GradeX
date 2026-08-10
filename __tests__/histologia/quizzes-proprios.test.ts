import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { esquemaQuiz } from '@/lib/histologia/esquemas'
import type { Pagina, Quiz } from '@/lib/histologia/esquemas'
import {
  CHAVES_DAS_TABELAS,
  REGRAS,
  caminhoDoTema,
  chaveDeEstrutura,
  gerarQuizzesProprios,
  saoAmbiguos,
  slugDoTema,
} from '@/lib/histologia/quizzes-proprios'
import { chaveDeBusca } from '@/lib/histologia/texto'

const RAIZ = path.resolve(__dirname, '../..')
const DADOS = path.join(RAIZ, 'data/histologia')

const arquivos = readdirSync(path.join(DADOS, 'quizzes-proprios')).filter((f) => f.endsWith('.json'))
const QUIZZES: Quiz[] = arquivos.map((a) =>
  JSON.parse(readFileSync(path.join(DADOS, 'quizzes-proprios', a), 'utf8')),
)
const QUESTOES = QUIZZES.flatMap((q) => q.questoes.map((questao) => ({ quiz: q, questao })))

function lerPaginas(): Pagina[] {
  const paginas: Pagina[] = []
  for (const arquivo of readdirSync(path.join(DADOS, 'paginas'))) {
    const fragmento = JSON.parse(readFileSync(path.join(DADOS, 'paginas', arquivo), 'utf8'))
    paginas.push(...(Object.values(fragmento) as Pagina[]))
  }
  return paginas
}

/* ══════════════════════ a regra do distrator ══════════════════════ */

describe('ambiguidade entre alternativas', () => {
  /**
   * Esta é a regra que decide se a questão é justa. Um distrator que também
   * pode ser a resposta certa pune exatamente quem sabe mais — o aluno que
   * reconhece a arteríola e também sabe que ela é um vaso sanguíneo fica sem
   * saber o que marcar.
   */

  it('o mesmo nome, no plural ou com parêntese, é o mesmo nome', () => {
    expect(saoAmbiguos('Núcleo', 'Núcleos')).toBe(true)
    expect(saoAmbiguos('Ácino', 'Ácino (alvéolo)')).toBe(true)
    expect(saoAmbiguos('Fibras colágenas', 'Fibras colágenas (corte transversal)')).toBe(true)
    expect(saoAmbiguos('Complexo de Golgi', 'Complexos de Golgi')).toBe(true)
  })

  it('nome contido em outro é ambíguo', () => {
    expect(saoAmbiguos('Epitélio', 'Epitélio simples cúbico')).toBe(true)
    expect(saoAmbiguos('Tecido conjuntivo', 'Tecido conjuntivo frouxo')).toBe(true)
    expect(saoAmbiguos('Núcleo', 'Núcleos de fibroblastos inativos')).toBe(true)
  })

  it('categoria e membro não disputam a mesma questão', () => {
    expect(saoAmbiguos('Vasos sanguíneos', 'Capilares')).toBe(true)
    expect(saoAmbiguos('Arteríola', 'Vaso sanguíneo')).toBe(true)
    expect(saoAmbiguos('Leucócitos', 'Linfócito')).toBe(true)
    expect(saoAmbiguos('Epitélio', 'Endotélio')).toBe(true)
  })

  it('sinônimos declarados não disputam a mesma questão', () => {
    expect(saoAmbiguos('Membrana basal', 'Lâmina basal')).toBe(true)
    expect(saoAmbiguos('Feixes de colágeno', 'Feixes de fibras colágenas')).toBe(true)
    expect(saoAmbiguos('Bainha de mielina', 'Lamelas de mielina')).toBe(true)
  })

  it('estruturas irmãs continuam sendo bons distratores', () => {
    // O guarda não pode ser tão largo que esvazie a questão: é justamente
    // distinguir uma da outra que se está avaliando.
    expect(saoAmbiguos('Artéria', 'Veia')).toBe(false)
    expect(saoAmbiguos('Túnica média', 'Túnica adventícia')).toBe(false)
    expect(saoAmbiguos('Túbulo contorcido proximal', 'Túbulo contorcido distal')).toBe(false)
    expect(saoAmbiguos('Osso compacto', 'Osso esponjoso')).toBe(false)
    expect(saoAmbiguos('Estrato basal', 'Estrato córneo')).toBe(false)
  })

  it('a chave normaliza acento, caixa, plural e parêntese', () => {
    expect(chaveDeEstrutura('Núcleos')).toBe(chaveDeEstrutura('núcleo'))
    expect(chaveDeEstrutura('Retículo endoplasmático rugoso (RER)')).toBe(
      chaveDeEstrutura('Retículo endoplasmático rugoso'),
    )
    // As quatro formas de plural que o vocabulário usa.
    expect(chaveDeEstrutura('Capilares')).toBe(chaveDeEstrutura('Capilar'))
    expect(chaveDeEstrutura('Feixes')).toBe(chaveDeEstrutura('Feixe'))
    expect(chaveDeEstrutura('Canais')).toBe(chaveDeEstrutura('Canal'))
    expect(chaveDeEstrutura('Regiões')).toBe(chaveDeEstrutura('Região'))
  })

  it('as tabelas editoriais já estão na forma normalizada', () => {
    /*
     * Uma entrada escrita como "feixe de colágeno" nunca casaria: a chave real
     * é "feixe de colageno". O erro é silencioso — a tabela existe, parece
     * certa e não faz nada —, então o teste confere que toda chave declarada
     * sobrevive à própria normalização.
     */
    for (const chave of CHAVES_DAS_TABELAS) {
      expect(chaveDeEstrutura(chave), `entrada não normalizada: "${chave}"`).toBe(chave)
    }
  })
})

/* ══════════════════════ agrupamento por tema ══════════════════════ */

describe('tema de uma lâmina', () => {
  it('é o nó acima da lâmina, até o terceiro nível', () => {
    expect(caminhoDoTema(['orgaos-e-sistemas', 'olho', 'retina', 'retina-3'])).toEqual([
      'orgaos-e-sistemas',
      'olho',
      'retina',
    ])
    // Lâmina pendurada direto no subsetor: o tema é o subsetor.
    expect(caminhoDoTema(['histologia-basica', 'corantes', 'stains-1'])).toEqual([
      'histologia-basica',
      'corantes',
    ])
    // Mais fundo que três níveis não cria tema novo — senão cada punhado de
    // lâminas viraria um quiz de duas questões.
    expect(
      caminhoDoTema(['orgaos-e-sistemas', 'sistema-digestorio', 'oral-cavity', 'tooth', 'tooth-2']),
    ).toEqual(['orgaos-e-sistemas', 'sistema-digestorio', 'oral-cavity'])
  })

  it('o slug vem do caminho, não do título', () => {
    // Cinco temas se chamam "Visão Geral"; o caminho é o que os distingue.
    expect(slugDoTema(['tecidos', 'tecido-nervoso', 'visao-geral', 'x'])).toBe(
      'laminas-tecido-nervoso-visao-geral',
    )
    expect(slugDoTema(['setor'])).toBeNull()
  })
})

/* ══════════════════════ determinismo ══════════════════════ */

describe('determinismo da geração', () => {
  /**
   * Os arquivos são versionados. Se duas execuções sobre o mesmo acervo
   * gerassem quizzes diferentes, todo `git diff` viraria ruído e a conciliação
   * do pipeline deixaria de significar alguma coisa.
   */
  it('duas execuções sobre o mesmo acervo produzem exatamente o mesmo resultado', () => {
    const paginas = lerPaginas()
    const a = gerarQuizzesProprios(paginas, { acessadoEm: '2026-08-07' })
    const b = gerarQuizzesProprios(paginas, { acessadoEm: '2026-08-07' })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('o que está em disco é o que o gerador produz hoje', () => {
    const gerados = gerarQuizzesProprios(lerPaginas(), { acessadoEm: '2026-08-07' })
    expect(gerados.map((q) => q.slug).sort()).toEqual(
      arquivos.map((a) => a.replace(/\.json$/, '')).sort(),
    )
    const porSlug = new Map(gerados.map((q) => [q.slug, q]))
    for (const quiz of QUIZZES) {
      expect(JSON.stringify(porSlug.get(quiz.slug)), `${quiz.slug} saiu do lugar`).toBe(
        JSON.stringify(quiz),
      )
    }
  })
})

/* ══════════════════════ os arquivos gerados ══════════════════════ */

describe('quizzes próprios em disco', () => {
  it('existem e cobrem vários temas', () => {
    expect(arquivos.length).toBeGreaterThanOrEqual(40)
    expect(QUESTOES.length).toBeGreaterThanOrEqual(400)
  })

  it.each(arquivos)('%s valida contra o schema', (arquivo) => {
    const quiz = esquemaQuiz.parse(
      JSON.parse(readFileSync(path.join(DADOS, 'quizzes-proprios', arquivo), 'utf8')),
    )
    expect(quiz.slug).toBe(arquivo.replace(/\.json$/, ''))
    expect(quiz.autoria).toBe('proprio')
    expect(quiz.slug.startsWith('laminas-')).toBe(true)
    expect(quiz.questoes.length).toBeGreaterThanOrEqual(REGRAS.minimoDeQuestoes)
    expect(quiz.questoes.length).toBeLessThanOrEqual(REGRAS.questoesPorQuiz)
    expect(quiz.revisao.estado).toBe('pendente-de-revisao')
  })

  it('nenhum slug colide com os quizzes do acervo', () => {
    const doAcervo = new Set(
      readdirSync(path.join(DADOS, 'quizzes')).map((a) => a.replace(/\.json$/, '')),
    )
    for (const quiz of QUIZZES) expect(doAcervo.has(quiz.slug)).toBe(false)
  })

  it('toda questão tem gabarito único e quatro alternativas distintas', () => {
    for (const { quiz, questao } of QUESTOES) {
      const corretas = questao.alternativas.filter((a) => a.correta)
      expect(corretas, `${quiz.slug}/${questao.id}`).toHaveLength(1)
      expect(questao.multipla).toBe(false)
      expect(questao.alternativas).toHaveLength(REGRAS.alternativasPorQuestao)
      const textos = questao.alternativas.map((a) => a.texto)
      expect(new Set(textos).size, `${quiz.slug}/${questao.id}`).toBe(textos.length)
    }
  })

  it('nenhuma questão traz duas alternativas defensáveis', () => {
    for (const { quiz, questao } of QUESTOES) {
      const textos = questao.alternativas.map((a) => a.texto)
      for (let i = 0; i < textos.length; i++) {
        for (let j = i + 1; j < textos.length; j++) {
          expect(
            saoAmbiguos(textos[i], textos[j]),
            `${quiz.slug}/${questao.id}: "${textos[i]}" × "${textos[j]}"`,
          ).toBe(false)
        }
      }
    }
  })

  it('toda questão mostra a lâmina e a camada que a marca', () => {
    for (const { quiz, questao } of QUESTOES) {
      expect(questao.midia, `${quiz.slug}/${questao.id}`).toBeTruthy()
      expect(questao.camada, `${quiz.slug}/${questao.id}`).toBeTruthy()
      expect(questao.midia!.sha256).not.toBe(questao.camada!.sha256)
      expect(questao.lamina?.rota).toBeTruthy()
      expect(questao.lamina?.estruturaId).toBeTruthy()
    }
  })

  it('o alt de nenhuma das duas imagens entrega a resposta', () => {
    /*
     * O `alt` que estas imagens têm nas páginas do atlas diz o nome da
     * estrutura — "Camada de marcação destacando Pele em Eyelid". Reaproveitá-lo
     * aqui entregaria o gabarito a quem usa leitor de tela e a quem abre o
     * inspetor. Este teste é o que garante que a substituição aconteceu.
     */
    for (const { quiz, questao } of QUESTOES) {
      const correta = questao.alternativas.find((a) => a.correta)!
      for (const imagem of [questao.midia!, questao.camada!]) {
        expect(
          chaveDeBusca(imagem.alt).includes(chaveDeBusca(correta.texto)),
          `${quiz.slug}/${questao.id}: alt contém "${correta.texto}"`,
        ).toBe(false)
      }
    }
  })

  it('a mesma estrutura não é perguntada duas vezes no mesmo quiz', () => {
    for (const quiz of QUIZZES) {
      const respostas = quiz.questoes.map((q) =>
        chaveDeEstrutura(q.alternativas.find((a) => a.correta)!.texto),
      )
      expect(new Set(respostas).size, quiz.slug).toBe(respostas.length)
    }
  })

  it('as questões se espalham pelas lâminas do tema', () => {
    for (const quiz of QUIZZES) {
      const laminas = new Set(quiz.questoes.map((q) => q.lamina!.rota))
      // No máximo duas questões por lâmina, e só depois de esgotar as demais.
      expect(laminas.size * REGRAS.maximoDeQuestoesPorLamina).toBeGreaterThanOrEqual(
        quiz.questoes.length,
      )
    }
  })

  it('a resposta certa não fica sempre na mesma posição', () => {
    // O embaralhamento por semente do motor cobre a exibição, mas uma correta
    // sempre em `a1` no dado vazaria para quem lê o JSON — e denunciaria um
    // gerador que só concatena.
    const posicoes = new Map<number, number>()
    for (const { questao } of QUESTOES) {
      const i = questao.alternativas.findIndex((a) => a.correta)
      posicoes.set(i, (posicoes.get(i) ?? 0) + 1)
    }
    for (const [, quantas] of posicoes) {
      expect(quantas).toBeGreaterThan(QUESTOES.length / 10)
    }
  })

  it('toda devolutiva de acerto começa confirmando, e a que ficou em inglês está marcada', () => {
    for (const { quiz, questao } of QUESTOES) {
      const correta = questao.alternativas.find((a) => a.correta)!
      expect(correta.feedback.startsWith('Correto.'), `${quiz.slug}/${questao.id}`).toBe(true)
      // O que reaproveita a explicação do acervo chega marcado como pendente —
      // é o que faz a interface exibir a tarja de "ainda no original".
      if (correta.feedbackPendente) {
        expect(correta.feedbackOriginal, `${quiz.slug}/${questao.id}`).toBeTruthy()
        expect(correta.feedback).toContain(correta.feedbackOriginal!)
      }
    }
  })

  it('nenhuma pergunta é sobre camada sem nome ou anotação de diagrama', () => {
    // "Marcador 8", "Plano de corte 2", "Sentido do fluxo biliar" existem no
    // acervo e não são estrutura nenhuma.
    const proibidos = [/^marcador \d+$/i, /^plano de corte/i, /^sentido do fluxo/i, /^dias? \d/i]
    for (const { quiz, questao } of QUESTOES) {
      for (const alternativa of questao.alternativas) {
        for (const padrao of proibidos) {
          expect(padrao.test(alternativa.texto), `${quiz.slug}: "${alternativa.texto}"`).toBe(false)
        }
      }
    }
  })

  it('a lâmina de cada questão existe no currículo e marca aquela estrutura', () => {
    const paginas = new Map(lerPaginas().map((p) => [p.caminho.join('/'), p]))
    for (const { quiz, questao } of QUESTOES) {
      const pagina = paginas.get(questao.lamina!.rota)
      expect(pagina, `${quiz.slug}/${questao.id}: rota inexistente`).toBeTruthy()
      const overlay = pagina!.overlays.find((o) => o.id === questao.lamina!.estruturaId)
      expect(overlay, `${quiz.slug}/${questao.id}: camada inexistente`).toBeTruthy()
      // A resposta certa é o rótulo daquela camada — não uma aproximação dele.
      expect(overlay!.rotulo).toBe(questao.alternativas.find((a) => a.correta)!.texto)
      expect(overlay!.midia.sha256).toBe(questao.camada!.sha256)
      expect(pagina!.base?.sha256).toBe(questao.midia!.sha256)
    }
  })

  it('as lâminas do tema anunciam o quiz do tema', () => {
    const paginas = lerPaginas()
    const slugs = new Set(QUIZZES.map((q) => q.slug))
    for (const pagina of paginas) {
      if (pagina.tipo !== 'lamina' || !pagina.base) continue
      const slug = slugDoTema(pagina.caminho)
      if (!slug || !slugs.has(slug)) continue
      expect(pagina.quizzes, pagina.caminho.join('/')).toContain(slug)
    }
  })

  it('o resumo publicado bate com os arquivos', () => {
    const resumo: Array<{ slug: string; questoes: number; laminas: number; trilha: string }> =
      JSON.parse(readFileSync(path.join(DADOS, 'quizzes-proprios.json'), 'utf8'))
    expect(resumo).toHaveLength(QUIZZES.length)
    const porSlug = new Map(QUIZZES.map((q) => [q.slug, q]))
    for (const entrada of resumo) {
      const quiz = porSlug.get(entrada.slug)
      expect(quiz, entrada.slug).toBeTruthy()
      expect(entrada.questoes).toBe(quiz!.questoes.length)
      expect(entrada.trilha.length).toBeGreaterThan(0)
    }
  })
})

/* ══════════════════════ proveniência ══════════════════════ */

describe('proveniência e autoria', () => {
  it('declaram a licença do acervo e o arquivo que os gerou', () => {
    for (const quiz of QUIZZES) {
      expect(quiz.proveniencia.licenca).toBe('CC BY-NC-SA 4.0')
      expect(quiz.proveniencia.arquivoOrigem).toBe('lib/histologia/quizzes-proprios.ts')
      // Sem título original: não existe original. Anunciar um seria inventar
      // procedência para uma questão que é nossa.
      expect(quiz.tituloOriginal).toBe('')
    }
  })

  it('a página do quiz distingue autoria própria da do acervo', () => {
    const pagina = readFileSync(
      path.join(RAIZ, 'app/manual-clinico/histologia/quizzes/[slug]/page.tsx'),
      'utf8',
    )
    expect(pagina).toContain("quiz.autoria === 'proprio'")
    expect(pagina).toContain('Digital Histology')
  })

  it('o carregamento não passa os quizzes próprios pelo dicionário de tradução', () => {
    // Eles nasceram em português; procurá-los no mapa de traduções do inglês
    // marcaria o quiz inteiro como "ainda no original".
    const repositorio = readFileSync(path.join(RAIZ, 'lib/histologia/repositorio.ts'), 'utf8')
    const trecho = repositorio.slice(repositorio.indexOf('export async function obterQuiz'))
    const corpo = trecho.slice(0, trecho.indexOf('export function listarSlugsDeQuiz'))
    expect(corpo).toContain('QUIZZES_PROPRIOS')
    expect((corpo.match(/traduzirQuiz\(/g) ?? []).length).toBe(1)
  })
})
