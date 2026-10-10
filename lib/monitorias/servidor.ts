import 'server-only'

/**
 * Regras de servidor reaproveitadas pelas rotas: usuário, termos, requisitos,
 * tutor, e o formato público de anúncio/tutor (o que pode sair para qualquer
 * visitante — sem CPF, e-mail, chave PIX, nada pessoal).
 */

import { ObjectId } from 'mongodb'
import type { User } from '@/lib/types'
import { colecoes, idDe, obterColecoes } from './db'
import { pendentes, requisitosDoAluno, requisitosDoMonitor, type ItemRequisito } from './requisitos'
import { secoesDosTermos, textoCanonico, tituloDosTermos, VERSAO_TERMOS } from './documentos/termos'
import { sha256, VERSAO_OFERTA } from './documentos/contrato'
import { DISPONIBILIDADE_VAZIA } from './agenda'
import { avatarPorId } from './avatares'
import type { Anuncio, PapelTermos, Tutor } from './tipos'

export const PROJECAO_USUARIO = {
  name: 1,
  fullName: 1,
  email: 1,
  emailVerified: 1,
  cpf: 1,
  cpfVerified: 1,
  dateOfBirth: 1,
  phone: 1,
  state: 1,
  profession: 1,
  specialty: 1,
  crm: 1,
  residencySpecialty: 1,
  residencyHospital: 1,
  residencyYear: 1,
  afyaUnit: 1,
  periodoBase: 1,
  banned: 1,
  role: 1,
  profilePicture: 1,
  avatar: 1,
} as const

export type UsuarioMonitoria = Pick<
  User,
  | 'name'
  | 'fullName'
  | 'email'
  | 'cpf'
  | 'cpfVerified'
  | 'dateOfBirth'
  | 'phone'
  | 'state'
  | 'profession'
  | 'specialty'
  | 'crm'
  | 'residencySpecialty'
  | 'residencyHospital'
  | 'residencyYear'
  | 'afyaUnit'
  | 'periodoBase'
  | 'banned'
  | 'role'
  | 'profilePicture'
  | 'avatar'
> & { _id: ObjectId; emailVerified?: boolean }

export async function carregarUsuario(userId: string): Promise<UsuarioMonitoria | null> {
  if (!ObjectId.isValid(userId)) return null
  const { users } = await obterColecoes()
  return (await users.findOne({ _id: new ObjectId(userId) } as any, { projection: PROJECAO_USUARIO })) as UsuarioMonitoria | null
}

export function hashDosTermos(papel: PapelTermos): string {
  return sha256(textoCanonico(tituloDosTermos(papel), VERSAO_TERMOS, secoesDosTermos(papel)))
}

export async function termosAceitos(userId: string, papel: PapelTermos): Promise<boolean> {
  const { termos } = await obterColecoes()
  const aceite = await termos.findOne({ userId, papel, versao: VERSAO_TERMOS }, { projection: { _id: 1 } })
  return !!aceite
}

export async function registrarAceiteDosTermos(input: {
  userId: string
  papel: PapelTermos
  ip: string
  userAgent: string
}): Promise<void> {
  const { termos } = await obterColecoes()
  const titulo = tituloDosTermos(input.papel)
  const secoes = secoesDosTermos(input.papel)
  await termos.updateOne(
    { userId: input.userId, papel: input.papel, versao: VERSAO_TERMOS },
    {
      $setOnInsert: {
        userId: input.userId,
        papel: input.papel,
        versao: VERSAO_TERMOS,
        hash: sha256(textoCanonico(titulo, VERSAO_TERMOS, secoes)),
        titulo,
        secoes,
        em: new Date(),
        ip: input.ip,
        userAgent: input.userAgent,
      },
    },
    { upsert: true },
  )
}

export function exigirCpfReceita(): boolean {
  return !!(process.env.CPF_VERIFICATION_PROVIDER || '').trim()
}

export async function carregarTutorDoUsuario(userId: string): Promise<Tutor | null> {
  const { tutores } = await obterColecoes()
  return tutores.findOne({ userId })
}

export async function obterOuCriarTutor(user: UsuarioMonitoria): Promise<Tutor> {
  const { tutores } = await obterColecoes()
  const userId = String(user._id)
  const agora = new Date()
  // Quem já escolheu o retrato da conta no /profile começa com ele como monitor.
  const retrato = avatarPorId(user.avatar)
  const tutor = await tutores.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
        nome: user.name,
        titulo: '',
        bio: '',
        historia: '',
        status: 'ativo',
        strikes: [],
        disponibilidade: DISPONIBILIDADE_VAZIA,
        saldoDevedorCentavos: 0,
        stats: { aulasDadas: 0, nota: 0, avaliacoes: 0 },
        ...(retrato ? { avatar: retrato.id, fotoUrl: retrato.url } : {}),
        createdAt: agora,
        updatedAt: agora,
      },
    },
    { upsert: true, returnDocument: 'after' },
  )
  return tutor as Tutor
}

export async function requisitosDoMonitorDe(userId: string): Promise<{
  user: UsuarioMonitoria | null
  tutor: Tutor | null
  itens: ItemRequisito[]
  ok: boolean
}> {
  const [user, tutor, aceitos] = await Promise.all([
    carregarUsuario(userId),
    carregarTutorDoUsuario(userId),
    termosAceitos(userId, 'monitor'),
  ])
  if (!user) return { user: null, tutor: null, itens: [], ok: false }
  const itens = requisitosDoMonitor({
    user,
    tutor,
    termosAceitos: aceitos,
    exigirCpfReceita: exigirCpfReceita(),
    agora: new Date(),
  })
  return { user, tutor, itens, ok: pendentes(itens).length === 0 }
}

/**
 * Requisitos do aluno para pedir/agendar. O aceite dos Termos do Aluno não
 * bloqueia o PEDIDO (é feito na hora de assinar o contrato, no checkout).
 */
export async function requisitosDoAlunoDe(userId: string): Promise<{
  user: UsuarioMonitoria | null
  itens: ItemRequisito[]
  ok: boolean
  termosAceitos: boolean
}> {
  const [user, aceitos] = await Promise.all([carregarUsuario(userId), termosAceitos(userId, 'aluno')])
  if (!user) return { user: null, itens: [], ok: false, termosAceitos: false }
  const itens = requisitosDoAluno({ user, termosAceitos: aceitos })
  const bloqueantes = pendentes(itens).filter((i) => i.chave !== 'termos')
  return { user, itens, ok: bloqueantes.length === 0, termosAceitos: aceitos }
}

// ─── Formatos públicos ──────────────────────────────────────────────────

export function tutorPublico(tutor: Tutor) {
  return {
    id: idDe(tutor),
    nome: tutor.nome,
    titulo: tutor.titulo,
    bio: tutor.bio,
    historia: tutor.historia,
    fotoUrl: tutor.fotoUrl || null,
    stats: tutor.stats,
    membroDesde: tutor.createdAt,
  }
}

export function anuncioPublico(anuncio: Anuncio) {
  return {
    id: idDe(anuncio),
    slug: anuncio.slug,
    titulo: anuncio.titulo,
    materia: anuncio.materia,
    conteudos: anuncio.conteudos,
    descricao: anuncio.descricao,
    videos: anuncio.videos,
    preco: anuncio.preco,
    grupo: anuncio.grupo,
    aulaGratis: anuncio.aulaGratis,
    modos: {
      // Oferta assinada numa versão antiga não vale: agenda online some até o monitor reassinar.
      direto: anuncio.ofertaAssinada?.versao === VERSAO_OFERTA ? anuncio.modos.direto || null : null,
      negociacao: !!anuncio.modos.negociacao,
      aCombinar: !!anuncio.modos.aCombinar,
    },
    faq: anuncio.faq,
    materiais: anuncio.materiais,
    temMateriais: anuncio.temMateriais,
    stats: anuncio.stats,
    publicadoEm: anuncio.publicadoEm || anuncio.createdAt,
  }
}

export function cardDoAnuncio(anuncio: Anuncio, tutor: Pick<Tutor, 'nome' | 'fotoUrl' | 'titulo'> | null) {
  const pub = anuncioPublico(anuncio)
  return {
    id: pub.id,
    slug: pub.slug,
    titulo: pub.titulo,
    materia: pub.materia,
    conteudos: pub.conteudos.slice(0, 4),
    preco: pub.preco,
    grupo: { ativo: pub.grupo.ativo, maxAlunos: pub.grupo.maxAlunos, menorValor: pub.grupo.faixas.at(-1)?.valorPorPessoaCentavos ?? null },
    aulaGratis: pub.aulaGratis.ativa,
    modos: pub.modos,
    temVideo: pub.videos.length > 0,
    temMateriais: pub.temMateriais,
    stats: pub.stats,
    tutor: tutor ? { nome: tutor.nome, fotoUrl: tutor.fotoUrl || null, titulo: tutor.titulo } : null,
  }
}

export { colecoes }
