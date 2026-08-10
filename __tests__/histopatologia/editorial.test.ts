import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  DOENCAS,
  ENTRADAS_NAO_NOSOLOGICAS,
  VERSAO_DO_MAPA,
  doencaDaEntrada,
  vinculosPorRotaNormal,
} from '@/lib/histopatologia/editorial'
import { MECANISMOS } from '@/lib/histopatologia/editorial/mecanismos'
import { SISTEMAS, sistemaIdDoCatalogado } from '@/lib/histopatologia/editorial/sistemas'
import { esquemaDoencaCanonica, validarPublicacao } from '@/lib/histopatologia/esquemas'

/**
 * A camada editorial.
 *
 * O que este arquivo protege é a fronteira entre inventário e conteúdo. As 2.917
 * entradas do catálogo incluem técnicas, casos e itens de navegação; promovê-las
 * a doenças automaticamente seria inventar 2.917 diagnósticos. A camada editorial
 * é o único caminho para essa promoção, e estes testes garantem que ela seja
 * consistente, rastreável e conservadora.
 */

const RAIZ = path.resolve(__dirname, '../..')
const CATALOGO = path.join(RAIZ, 'public/patologia/catalogo')

const patologias = JSON.parse(
  readFileSync(path.join(CATALOGO, 'patologias.json'), 'utf8'),
) as Array<{ id: string; sistemaCatalogado: string }>
const idsCatalogados = new Set(patologias.map((p) => p.id))

const doencas = DOENCAS.map((d) => esquemaDoencaCanonica.parse(d))

describe('consolidação', () => {
  it('o mapa é versionado', () => {
    expect(VERSAO_DO_MAPA).toBeGreaterThanOrEqual(1)
  })

  it('toda doença aponta para entradas catalogadas que existem', () => {
    for (const doenca of doencas) {
      expect(doenca.catalogoIds.length, `${doenca.slug} sem entrada catalogada`).toBeGreaterThan(0)
      for (const id of doenca.catalogoIds) {
        expect(idsCatalogados.has(id), `${doenca.slug} → ${id}`).toBe(true)
      }
    }
  })

  it('nenhuma entrada é consolidada em duas doenças', () => {
    const vistos = new Map<string, string>()
    for (const doenca of doencas) {
      for (const id of doenca.catalogoIds) {
        expect(vistos.has(id), `${id} em ${vistos.get(id)} e ${doenca.slug}`).toBe(false)
        vistos.set(id, doenca.slug)
      }
    }
  })

  it('o índice reverso encontra a doença de uma entrada', () => {
    const doenca = doencas[0]
    expect(doencaDaEntrada(doenca.catalogoIds[0])?.slug).toBe(doenca.slug)
    expect(doencaDaEntrada('id-que-nao-existe')).toBeUndefined()
  })

  it('uma doença agrega entradas de mais de uma fonte quando é o caso', () => {
    const multiFonte = doencas.find((d) =>
      d.catalogoIds.some((id) => id.startsWith('unicamp-')) &&
      d.catalogoIds.some((id) => id.startsWith('histopathology-atlas-')),
    )
    expect(multiFonte, 'nenhuma doença exercita a consolidação multi-fonte').toBeDefined()
  })

  it('as entradas marcadas como não nosológicas existem e não foram promovidas', () => {
    for (const registro of ENTRADAS_NAO_NOSOLOGICAS) {
      expect(idsCatalogados.has(registro.catalogoId), registro.catalogoId).toBe(true)
      expect(doencaDaEntrada(registro.catalogoId), registro.catalogoId).toBeUndefined()
      expect(registro.motivo.length).toBeGreaterThan(20)
    }
  })

  it('os maiores agrupadores do catálogo não viraram doenças', () => {
    // As cinco maiores entradas são agrupadores temáticos e itens de navegação —
    // exatamente o tipo de título que uma consolidação automática promoveria.
    const agrupadores = [
      'unicamp-neuroimagem-1fc33baace',
      'unicamp-neuropatologia-cc7fdcf258',
      'unicamp-imunohistoquimica-4220fa51a3',
      'unicamp-tricromico-de-masson-bc59ce6ccb',
      'unicamp-this-page-in-english-a9b7176e2e',
    ]
    for (const id of agrupadores) {
      expect(doencaDaEntrada(id), id).toBeUndefined()
    }
  })

  it('slugs são URL-safe e únicos', () => {
    const slugs = doencas.map((d) => d.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  it('o slug não é derivado cegamente do título catalogado', () => {
    // O título de origem de várias entradas é um parágrafo inteiro; o slug
    // canônico é escrito pela edição, e é isso que mantém a URL legível.
    for (const doenca of doencas) {
      expect(doenca.slug.length).toBeLessThanOrEqual(60)
    }
  })
})

describe('taxonomia', () => {
  it('todo sistema catalogado tem destino na taxonomia', () => {
    const catalogados = new Set(patologias.map((p) => p.sistemaCatalogado))
    const mapeados = new Set(SISTEMAS.flatMap((s) => s.sistemasCatalogados))
    for (const catalogado of catalogados) {
      expect(mapeados.has(catalogado), `sistema catalogado sem mapeamento: ${catalogado}`).toBe(true)
    }
  })

  it('valor desconhecido cai em não classificado, sem criar sistema fantasma', () => {
    expect(sistemaIdDoCatalogado('Categoria que não existe')).toBe('nao-classificado')
  })

  it('ids de sistema e de mecanismo são únicos', () => {
    expect(new Set(SISTEMAS.map((s) => s.id)).size).toBe(SISTEMAS.length)
    expect(new Set(MECANISMOS.map((m) => m.id)).size).toBe(MECANISMOS.length)
  })

  it('todo mecanismo tem assinatura morfológica — o elo com a lâmina', () => {
    for (const mecanismo of MECANISMOS) {
      expect(mecanismo.assinaturaMorfologica.length, mecanismo.id).toBeGreaterThan(0)
      // O conceito precisa ser reutilizável: nada de nome de doença nele.
      expect(mecanismo.conceito.length).toBeGreaterThan(120)
    }
  })
})

describe('portão de publicação', () => {
  it('nenhuma doença está publicada sem revisor', () => {
    for (const doenca of doencas) {
      if (doenca.revisao.estado === 'publicado') {
        expect(doenca.revisao.revisor, doenca.slug).toBeTruthy()
        expect(doenca.revisao.registroProfissional, doenca.slug).toBeTruthy()
        expect(doenca.revisao.revisadoEm, doenca.slug).toBeTruthy()
      }
    }
  })

  it('`validarPublicacao` não bloqueia rascunho, mas bloqueia publicação incompleta', () => {
    const rascunho = { ...doencas[0], revisao: { ...doencas[0].revisao, estado: 'rascunho' as const } }
    expect(validarPublicacao(rascunho)).toEqual([])

    const incompleta = {
      ...doencas[0],
      conteudo: { ...doencas[0].conteudo, histopatologia: undefined, referencias: [] },
      revisao: { ...doencas[0].revisao, estado: 'publicado' as const },
    }
    const faltas = validarPublicacao(incompleta)
    expect(faltas).toContain('roteiro histopatológico por aumento')
    expect(faltas).toContain('referências bibliográficas')
    expect(faltas).toContain('revisor identificado')
  })

  it('toda doença registra pendências enquanto não publicada', () => {
    for (const doenca of doencas) {
      if (doenca.revisao.estado !== 'publicado') {
        expect(doenca.revisao.pendencias.length, doenca.slug).toBeGreaterThan(0)
      }
    }
  })

  it('toda doença tem histórico editorial datado', () => {
    for (const doenca of doencas) {
      expect(doenca.revisao.historico.length, doenca.slug).toBeGreaterThan(0)
      expect(doenca.revisao.atualizadoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('qualidade do conteúdo piloto', () => {
  /**
   * A hiperplasia nodular da próstata entra no piloto como contraponto benigno
   * do adenocarcinoma, mas ela é classificada — corretamente — como **não
   * neoplásica**: hiperplasia não é neoplasia, e forçá-la a `neoplasica-benigna`
   * para "completar a matriz" seria errar a nosologia por conveniência de teste.
   * O eixo benigno × maligno é exercitado pelos mecanismos, e um adenoma
   * verdadeiro continua na lista de pendências editoriais.
   */
  it('o piloto cobre naturezas e sistemas diferentes', () => {
    const naturezas = new Set(doencas.map((d) => d.natureza))
    const sistemas = new Set(doencas.map((d) => d.sistemaId))
    expect(sistemas.size).toBeGreaterThanOrEqual(5)
    expect([...naturezas]).toContain('neoplasica-maligna')
    expect([...naturezas]).toContain('nao-neoplasica')
    const mecanismos = new Set(doencas.flatMap((d) => d.mecanismoIds))
    expect(mecanismos.has('proliferacao-benigna')).toBe(true)
    expect(mecanismos.has('invasao-neoplasica')).toBe(true)
  })

  it('o piloto cobre famílias de mecanismo diferentes', () => {
    const familias = new Set(
      doencas.flatMap((d) =>
        d.mecanismoIds.map((id) => MECANISMOS.find((m) => m.id === id)?.familia),
      ),
    )
    expect(familias.size).toBeGreaterThanOrEqual(4)
  })

  it('toda doença separa mecanismo geral de aplicação específica', () => {
    for (const doenca of doencas) {
      expect(doenca.conteudo.mecanismoPatologicoGeral.length, doenca.slug).toBeGreaterThan(0)
      for (const aplicacao of doenca.conteudo.mecanismoPatologicoGeral) {
        expect(MECANISMOS.some((m) => m.id === aplicacao.mecanismoId), aplicacao.mecanismoId).toBe(
          true,
        )
        // A aplicação precisa ser específica; um eco do conceito geral não serve.
        expect(aplicacao.aplicacao.length).toBeGreaterThan(80)
      }
    }
  })

  it('a cadeia causal vai do gatilho à complicação, com explicação em cada etapa', () => {
    for (const doenca of doencas) {
      const etapas = doenca.conteudo.fisiopatologiaEspecifica
      expect(etapas.length, doenca.slug).toBeGreaterThanOrEqual(6)
      expect(etapas[0].etapa, doenca.slug).toBe('gatilho')
      for (const etapa of etapas) {
        expect(etapa.porQue.length, `${doenca.slug}: ${etapa.titulo}`).toBeGreaterThan(40)
      }
    }
  })

  it('o roteiro histopatológico cobre os quatro aumentos e termina em síntese', () => {
    for (const doenca of doencas) {
      const roteiro = doenca.conteudo.histopatologia
      expect(roteiro, doenca.slug).toBeDefined()
      for (const nivel of ['panoramica', 'pequeno', 'medio', 'grande'] as const) {
        expect(roteiro![nivel].procure.length, `${doenca.slug}.${nivel}`).toBeGreaterThan(30)
        expect(roteiro![nivel].achados.length, `${doenca.slug}.${nivel}`).toBeGreaterThan(0)
        for (const achado of roteiro![nivel].achados) {
          // Cada achado explica o processo e a consequência: nunca é só um
          // adjetivo morfológico.
          expect(achado.processo.length).toBeGreaterThan(20)
          expect(achado.consequencia.length).toBeGreaterThan(20)
        }
      }
      expect(roteiro!.sintese.length).toBeGreaterThan(80)
    }
  })

  it('cada diferencial traz motivo, discriminador e achados compartilhados', () => {
    for (const doenca of doencas) {
      expect(doenca.conteudo.diagnosticosDiferenciais.length, doenca.slug).toBeGreaterThan(0)
      for (const d of doenca.conteudo.diagnosticosDiferenciais) {
        expect(d.motivoDaConfusao.length).toBeGreaterThan(20)
        expect(d.discriminador.length).toBeGreaterThan(20)
        expect(d.achadosCompartilhados.length).toBeGreaterThan(0)
      }
    }
  })

  it('cada exame complementar declara pergunta, limitações e efeito no diferencial', () => {
    for (const doenca of doencas) {
      const exames = [
        ...doenca.conteudo.coloracoesEspeciais,
        ...doenca.conteudo.imunoHistoquimica,
        ...doenca.conteudo.biologiaMolecular,
      ]
      for (const exame of exames) {
        expect(exame.pergunta.length, `${doenca.slug}: ${exame.nome}`).toBeGreaterThan(20)
        expect(exame.limitacoes.length, `${doenca.slug}: ${exame.nome}`).toBeGreaterThan(0)
        expect(exame.mudaODiferencial.length).toBeGreaterThan(20)
      }
    }
  })

  it('toda pergunta de autoavaliação tem índice válido e devolutiva explicativa', () => {
    for (const doenca of doencas) {
      for (const pergunta of doenca.conteudo.perguntasDeAutoavaliacao) {
        expect(pergunta.indiceCorreto).toBeLessThan(pergunta.alternativas.length)
        expect(pergunta.devolutiva.length).toBeGreaterThan(100)
      }
    }
  })

  it('toda doença registra referências bibliográficas', () => {
    for (const doenca of doencas) {
      expect(doenca.conteudo.referencias.length, doenca.slug).toBeGreaterThan(0)
      for (const referencia of doenca.conteudo.referencias) {
        expect(referencia.citacao.length).toBeGreaterThan(30)
      }
    }
  })

  it('conteúdo dependente de classificação registra edição e ano', () => {
    const comEdicao = doencas.flatMap((d) => d.conteudo.referencias).filter((r) => r.edicao)
    expect(comEdicao.length).toBeGreaterThan(0)
    for (const referencia of comEdicao) {
      expect(referencia.ano, referencia.citacao).toBeGreaterThan(1990)
    }
  })
})

describe('vínculo com a Histologia normal', () => {
  const CURRICULO = JSON.parse(
    readFileSync(path.join(RAIZ, 'data/histologia/curriculo.json'), 'utf8'),
  )

  const rotasNormais = new Set<string>()
  const visitar = (nos: Array<{ caminho: string[]; filhos: unknown[] }>) => {
    for (const no of nos) {
      rotasNormais.add(no.caminho.join('/'))
      visitar(no.filhos as Array<{ caminho: string[]; filhos: unknown[] }>)
    }
  }
  visitar(CURRICULO)

  it('toda referência normal aponta para uma rota que existe no currículo', () => {
    for (const doenca of doencas) {
      for (const ref of doenca.conteudo.histologiaNormalDeReferencia) {
        const rota = ref.caminhoNormal.join('/')
        expect(rotasNormais.has(rota), `${doenca.slug} → ${rota}`).toBe(true)
      }
    }
  })

  it('toda referência aproximada explica a aproximação', () => {
    for (const doenca of doencas) {
      for (const ref of doenca.conteudo.histologiaNormalDeReferencia) {
        if (ref.aproximado) {
          expect(ref.notaDeAproximacao, `${doenca.slug}: ${ref.titulo}`).toBeTruthy()
        }
      }
    }
  })

  it('o vínculo inverso é derivado, e cobre todas as âncoras declaradas', () => {
    const mapa = vinculosPorRotaNormal()
    for (const doenca of doencas) {
      for (const ref of doenca.conteudo.histologiaNormalDeReferencia) {
        const rota = ref.caminhoNormal.join('/')
        expect(mapa.get(rota)?.some((d) => d.slug === doenca.slug), rota).toBe(true)
      }
    }
  })

  it('os sistemas que declaram rota normal apontam para rotas reais', () => {
    for (const sistema of SISTEMAS) {
      if (!sistema.caminhoNormal) continue
      expect(rotasNormais.has(sistema.caminhoNormal.join('/')), sistema.id).toBe(true)
    }
  })
})

describe('um arquivo editorial por doença', () => {
  it('cada doença do mapa tem arquivo próprio, e cada arquivo está no mapa', () => {
    const dir = path.join(RAIZ, 'lib/histopatologia/editorial/doencas')
    const arquivos = readdirSync(dir)
      .filter((a) => a.endsWith('.ts'))
      .map((a) => a.replace(/\.ts$/, ''))
    expect(arquivos.sort()).toEqual(doencas.map((d) => d.slug).sort())
  })
})
