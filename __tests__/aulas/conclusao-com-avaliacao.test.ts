import { describe, it, expect } from 'vitest'
import type { Db } from 'mongodb'
import { salvarBatida } from '@/lib/aulas/repositorio-progresso'

/**
 * A trava da avaliação obrigatória (§39) no caminho automático.
 *
 * O botão "marcar como concluída" é o caminho óbvio, mas não é o comum: quase
 * todo aluno conclui a aula só de assistir até o fim. Se a trava valesse apenas
 * no botão, ela não existiria na prática.
 */

const AULA = '507f1f77bcf86cd799439011'
const USUARIO = 'u1'

/** Um banco de mentira com o mínimo que `salvarBatida` toca. */
function bancoFalso() {
  const escritas: any[] = []
  const db = {
    collection: () => ({
      find: () => ({ toArray: async () => [] }),
      updateOne: async (filtro: any, mudanca: any) => {
        escritas.push({ filtro, mudanca })
      },
    }),
  } as unknown as Db
  return { db, escritas }
}

describe('salvarBatida com avaliação obrigatória', () => {
  it('conclui normalmente quando não há trava', async () => {
    const { db } = bancoFalso()
    const progresso = await salvarBatida(db, USUARIO, AULA, {
      posicaoSegundos: 950,
      duracaoSegundos: 1000,
    })
    expect(progresso.percentual).toBe(95)
    expect(progresso.concluida).toBe(true)
  })

  it('segura o carimbo de concluída enquanto a prova não foi entregue', async () => {
    const { db } = bancoFalso()
    const progresso = await salvarBatida(
      db,
      USUARIO,
      AULA,
      { posicaoSegundos: 950, duracaoSegundos: 1000 },
      { podeConcluir: async () => false },
    )
    expect(progresso.concluida).toBe(false)
    expect(progresso.concluidaEm).toBeNull()
    // O que foi assistido continua valendo: segurar a conclusão não pode
    // apagar o progresso de quem viu a aula inteira.
    expect(progresso.percentual).toBe(95)
    expect(progresso.posicaoSegundos).toBe(950)
  })

  it('conclui assim que a prova é entregue', async () => {
    const { db } = bancoFalso()
    const progresso = await salvarBatida(
      db,
      USUARIO,
      AULA,
      { posicaoSegundos: 950, duracaoSegundos: 1000 },
      { podeConcluir: async () => true },
    )
    expect(progresso.concluida).toBe(true)
  })

  it('não pergunta nada em batidas que não concluiriam a aula', async () => {
    const { db } = bancoFalso()
    let perguntas = 0
    const progresso = await salvarBatida(
      db,
      USUARIO,
      AULA,
      { posicaoSegundos: 100, duracaoSegundos: 1000 },
      {
        podeConcluir: async () => {
          perguntas += 1
          return false
        },
      },
    )
    expect(progresso.concluida).toBe(false)
    // O PUT de progresso roda de poucos em poucos segundos; uma consulta extra
    // por batida transformaria assistir uma aula em centenas de consultas.
    expect(perguntas).toBe(0)
  })

  it('não grava a conclusão no array legado quando a trava segurou', async () => {
    const { db, escritas } = bancoFalso()
    await salvarBatida(
      db,
      USUARIO,
      AULA,
      { posicaoSegundos: 1000, duracaoSegundos: 1000 },
      { podeConcluir: async () => false },
    )
    const legado = escritas.filter((e) => e.mudanca?.$addToSet)
    expect(legado).toHaveLength(0)
  })
})
