import { ObjectId, type Db } from 'mongodb'
import { isPlusAccount } from '@/lib/account-tier'
import type { ContextoDoUsuario } from '@/lib/aulas/acesso'
import type { MaterialPurchase, User } from '@/lib/types'

/**
 * Monta o retrato do usuário que o motor de acesso consome.
 *
 * Fica separado de `acesso.ts` de propósito: lá é lógica pura e testável, aqui
 * é a ida ao banco. Assim o motor pode ser exercitado com dezenas de cenários
 * sem subir Mongo, e este arquivo tem uma responsabilidade só — responder "o
 * que esta pessoa tem?".
 *
 * As consultas são deliberadamente rasas e paralelas: isto roda em toda
 * abertura de aula e em toda listagem, então não pode custar mais do que a
 * própria página.
 */

export interface SessaoMinima {
  userId?: string
  role?: string
  accountType?: string
  secondaryRole?: string
  email?: string
}

/** Visitante sem conta — o piso de permissão. */
export const CONTEXTO_VISITANTE: ContextoDoUsuario = { logado: false }

export interface OpcoesDeContexto {
  /**
   * "Visualizar como aluno" (§28).
   *
   * Admin e monitor atravessam todo cadeado, o que torna impossível conferir se
   * a trava está no lugar certo — a tela do admin sempre mostra tudo liberado.
   * Com este sinal, o privilégio é abandonado e o motor de acesso avalia a
   * conta pelas compras e assinatura que ela realmente tem.
   *
   * É só de leitura e só afeta a resposta desta requisição: nada é gravado, e
   * as rotas de escrita continuam checando o papel real da sessão.
   */
  comoAluno?: boolean
  /** Nível a simular quando `comoAluno`: visitante deslogado. */
  comoVisitante?: boolean
}

export async function montarContextoDoUsuario(
  db: Db,
  sessao: SessaoMinima | null,
  opcoes: OpcoesDeContexto = {},
): Promise<ContextoDoUsuario> {
  if (!sessao?.userId || !ObjectId.isValid(sessao.userId)) return CONTEXTO_VISITANTE
  if (opcoes.comoVisitante) return CONTEXTO_VISITANTE

  const isAdmin = sessao.role === 'admin' && !opcoes.comoAluno
  const isMonitor = sessao.secondaryRole === 'monitor' && !opcoes.comoAluno

  // Admin e monitor passam por tudo no motor de acesso; gastar consultas de
  // compras e turmas para eles seria trabalho jogado fora.
  if (isAdmin || isMonitor) {
    return { logado: true, isAdmin, isMonitor }
  }

  const usuarioId = new ObjectId(sessao.userId)

  const [usuario, compras, grupos] = await Promise.all([
    db.collection<User>('users').findOne(
      { _id: usuarioId as any },
      { projection: { accountType: 1, premiumExpiresAt: 1 } },
    ),
    db.collection<MaterialPurchase>('material_purchases')
      .find(
        { userId: sessao.userId, status: 'completed' },
        { projection: { itemType: 1, itemId: 1 } },
      )
      .limit(500)
      .toArray(),
    db.collection('aulas_grupos')
      .find({ membros: sessao.userId }, { projection: { _id: 1 } })
      .limit(100)
      .toArray(),
  ])

  // A assinatura vale enquanto não expirou. Ler só `accountType` deixaria
  // entrar quem cancelou e ainda não passou pelo sweeper.
  const expiraEm = usuario?.premiumExpiresAt ? new Date(usuario.premiumExpiresAt) : null
  const assinaturaNoPrazo = !expiraEm || Number.isNaN(expiraEm.getTime()) || expiraEm > new Date()
  const ehPlus = isPlusAccount(usuario?.accountType) && assinaturaNoPrazo

  const materiais: string[] = []
  const pacotes: string[] = []
  for (const compra of compras) {
    if (compra.itemType === 'package') pacotes.push(String(compra.itemId))
    else materiais.push(String(compra.itemId))
  }

  return {
    logado: true,
    isAdmin: false,
    isMonitor: false,
    ehPlus,
    // O Manual Clínico entra junto com o Plus+ e pelas compras avulsas, que já
    // aparecem em `materiais`. Uma consulta dedicada só faria sentido quando
    // existir aula amarrada exclusivamente a ele.
    temManualClinico: ehPlus,
    materiais,
    pacotes,
    grupos: grupos.map((g) => String(g._id)),
  }
}
