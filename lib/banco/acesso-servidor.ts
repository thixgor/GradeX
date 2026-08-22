import { ObjectId, type Db } from 'mongodb'
import type { User } from '@/lib/types'
import { temAcessoAoBanco } from '@/lib/account-tier'
import {
  lerEstadoGratuito,
  tentarAbrir,
  type EstadoGratuito,
} from '@/lib/banco/gratuito'
import {
  areaLiberada,
  resolverPermissoes,
  type ContextoDePermissoes,
} from '@/lib/plan-entitlements-server'

/**
 * Quem pode ver o quê no Banco de Questões.
 *
 * A conta é feita aqui e em nenhum outro lugar: a tela mostra o saldo, mas quem
 * decide se a questão abre é o servidor. Se a régua estivesse no navegador, o
 * banco inteiro estaria aberto para qualquer pessoa que abrisse o inspetor.
 */

export interface AcessoAoBanco {
  usuario: User
  ehAdmin: boolean
  ehAssinante: boolean
  /** Sem assinatura e sem cargo — é quem vive do saldo gratuito. */
  ehGratuito: boolean
  gratuito: EstadoGratuito
  /**
   * Permissões do plano assinado. Quem paga um plano que não inclui o Banco
   * não é assinante para efeito desta seção — cai no saldo gratuito, que é o
   * piso de todo mundo, em vez de perder a seção por completo.
   */
  permissoes: ContextoDePermissoes
}

/**
 * Só o que decide o acesso — e não o documento inteiro do usuário.
 *
 * O registro de uma pessoa carrega histórico de assinatura, preferências,
 * dados de perfil e mais; nada disso muda quem pode ver qual questão. Trazer
 * tudo era um documento grande vindo do Atlas em toda listagem do Banco, e a
 * listagem é a tela mais aberta da seção.
 */
const CAMPOS_DE_ACESSO = {
  role: 1,
  accountType: 1,
  premiumPlanType: 1,
  bancoQuestoesLiberadas: 1,
  freeQuestionsByPeriod: 1,
} as const

export async function lerAcessoAoBanco(db: Db, userId: string): Promise<AcessoAoBanco | null> {
  const usuario = await db
    .collection<User>('users')
    .findOne({ _id: new ObjectId(userId) }, { projection: CAMPOS_DE_ACESSO })
  if (!usuario) return null

  const ehAdmin = usuario.role === 'admin'
  const permissoes = await resolverPermissoes(db, {
    userId,
    role: usuario.role,
    accountType: usuario.accountType,
    premiumPlanType: usuario.premiumPlanType as string | null,
  })

  // Plus+ (plataforma inteira), Quest (só o Banco) e trial passam pelo cargo;
  // o plano assinado ainda pode fechar a área.
  const cargoDeAssinante = temAcessoAoBanco(usuario.accountType) || usuario.accountType === 'trial'
  const ehAssinante = cargoDeAssinante && areaLiberada(permissoes, 'bancoQuestoes')

  return {
    usuario,
    ehAdmin,
    ehAssinante,
    ehGratuito: !ehAdmin && !ehAssinante,
    gratuito: lerEstadoGratuito(usuario as any),
    permissoes,
  }
}

/**
 * Tira da questão tudo que é conteúdo, deixando só o que identifica.
 *
 * O cartão bloqueado precisa dizer o suficiente para a pessoa ESCOLHER onde
 * gastar o saldo — módulo, tópico, tipo, dificuldade, ano. O enunciado, as
 * alternativas, o gabarito e a explicação não saem daqui: quem não abriu não
 * recebe o conteúdo nem no JSON.
 */
export function ocultarConteudo<T extends Record<string, any>>(questao: T): T {
  const {
    enunciado,
    alternativas,
    respostaModelo,
    explicacao,
    imagemUrl,
    imagensAlternativas,
    ...resto
  } = questao
  return { ...resto, bloqueada: true } as unknown as T
}

/**
 * Abre uma questão para quem está no plano gratuito, gastando saldo.
 *
 * Gravar antes de responder é de propósito: se a escrita falhar, a pessoa não
 * viu a questão e não perdeu nada. O contrário — mostrar e falhar ao gravar —
 * daria questões grátis infinitas.
 */
export async function abrirQuestaoGratuita(
  db: Db,
  acesso: AcessoAoBanco,
  questaoId: string,
): Promise<{ liberada: boolean; motivo?: string; gratuito: EstadoGratuito }> {
  if (!acesso.ehGratuito) return { liberada: true, gratuito: acesso.gratuito }

  const veredito = tentarAbrir(acesso.gratuito, questaoId)
  if (!veredito.liberada) {
    return { liberada: false, motivo: veredito.motivo, gratuito: acesso.gratuito }
  }

  if (veredito.gravar) {
    await db.collection<User>('users').updateOne(
      { _id: new ObjectId(String(acesso.usuario._id)) },
      { $addToSet: { bancoQuestoesLiberadas: questaoId } as any },
    )
    acesso.gratuito = {
      ...acesso.gratuito,
      desbloqueadas: [...acesso.gratuito.desbloqueadas, questaoId],
    }
  }

  return { liberada: true, gratuito: acesso.gratuito }
}

/**
 * O Banco de Questões faz parte do plano desta conta?
 *
 * Substitui o `isPlusAccount(user.accountType)` solto que as rotas da seção
 * usavam: ter o cargo pago deixou de ser resposta suficiente, porque um plano
 * pode conceder o cargo sem incluir o Banco. Admin passa sempre, e o cargo
 * **Quest** — que existe justamente para vender esta seção sozinha — passa
 * pela mesma porta que o Plus+.
 */
export async function bancoLiberadoPeloPlano(
  db: Db,
  usuario: Pick<User, 'role' | 'accountType' | 'premiumPlanType'> & { _id?: unknown },
): Promise<boolean> {
  if (usuario.role === 'admin') return true
  if (!temAcessoAoBanco(usuario.accountType)) return false

  const permissoes = await resolverPermissoes(db, {
    userId: String(usuario._id || ''),
    role: usuario.role,
    accountType: usuario.accountType,
    premiumPlanType: usuario.premiumPlanType as string | null,
  })
  return areaLiberada(permissoes, 'bancoQuestoes')
}
