import { describe, expect, it } from 'vitest'
import { contarDependentes, mensagemDeBloqueio } from '@/lib/aulas/exclusao'

/**
 * A guarda existe por causa de um bug real: as rotas de DELETE comparavam um
 * campo de TEXTO com um `ObjectId`, então a cascata nunca casava. As aulas não
 * eram apagadas (sorte), mas ficavam órfãs e sumiam da biblioteca — e a
 * resposta ainda dizia "0 aula(s) removida(s)" como se estivesse tudo certo.
 *
 * Estes testes travam as duas metades da correção: o id é comparado como
 * string, e a contagem enxerga TODOS os níveis pendurados no nó.
 */

/** Banco de mentira que registra os filtros recebidos. */
function bancoFalso(porColecao: Record<string, any[]>) {
  const filtrosVistos: Array<{ colecao: string; filtro: any }> = []
  const db = {
    collection(nome: string) {
      return {
        countDocuments: async (filtro: any) => {
          filtrosVistos.push({ colecao: nome, filtro })
          const docs = porColecao[nome] || []
          const [campo, valor] = Object.entries(filtro)[0] as [string, any]
          return docs.filter((d) => d[campo] === valor).length
        },
      }
    },
  } as any
  return { db, filtrosVistos }
}

describe('contarDependentes', () => {
  it('compara o id como texto, que é como ele foi gravado', async () => {
    const { db, filtrosVistos } = bancoFalso({})
    await contarDependentes(db, 'setor', '507f1f77bcf86cd799439011')

    for (const { filtro } of filtrosVistos) {
      expect(typeof Object.values(filtro)[0]).toBe('string')
    }
  })

  it('enxerga todos os níveis pendurados num curso', async () => {
    const { db } = bancoFalso({
      aulas_topicos: [{ setorId: 's1' }, { setorId: 's1' }],
      aulas_modulos: [{ setorId: 's1' }],
      aulas_postagens: [{ setorId: 's1' }, { setorId: 's1' }, { setorId: 'outro' }],
    })

    const dependentes = await contarDependentes(db, 'setor', 's1')
    expect(dependentes.total).toBe(5)
    expect(dependentes.descricao).toBe('2 tópico(s), 1 módulo(s) e 2 aula(s)')
  })

  it('deixa passar quando o nó está mesmo vazio', async () => {
    const { db } = bancoFalso({ aulas_postagens: [{ moduloId: 'outro' }] })
    const dependentes = await contarDependentes(db, 'modulo', 'm1')
    expect(dependentes.total).toBe(0)
  })

  it('só olha os filhos que aquele tipo pode ter', async () => {
    // Submódulo não tem módulos dentro: contá-los daria um bloqueio fantasma.
    const { db, filtrosVistos } = bancoFalso({})
    await contarDependentes(db, 'submodulo', 'sm1')
    expect(filtrosVistos.map((f) => f.colecao)).toEqual(['aulas_postagens'])
  })

  it('usa o campo de vínculo do próprio tipo', async () => {
    const { db, filtrosVistos } = bancoFalso({})
    await contarDependentes(db, 'subtopico', 'st1')
    for (const { filtro } of filtrosVistos) {
      expect(Object.keys(filtro)).toEqual(['subtopicoId'])
    }
  })
})

describe('mensagemDeBloqueio', () => {
  it('diz o que precisa sair antes, e não só que falhou', () => {
    const texto = mensagemDeBloqueio({ total: 3, descricao: '3 aula(s)' })
    expect(texto).toContain('3 aula(s)')
    expect(texto).toContain('Mova ou exclua')
  })
})
