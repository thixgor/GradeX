/**
 * Quem pode anunciar e quem pode contratar — checklist pura, usada na tela
 * ("falta isso, isso e isso") e no servidor (a trava de verdade).
 */

import { getMissingProfileFields } from '@/lib/profile-completeness'
import { isValidCpf } from '@/lib/cpf'
import type { User } from '@/lib/types'
import type { Tutor } from './tipos'
import { avatarPorId } from './avatares'
import { validarNomeCivil } from '@/lib/nome-civil'

export interface ItemRequisito {
  chave: string
  rotulo: string
  ok: boolean
  /** Onde a pessoa resolve. */
  acao?: { texto: string; href: string }
}

type UsuarioRequisitos = Pick<
  User,
  | 'name'
  | 'fullName'
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
> & { emailVerified?: boolean }

export function idadeEmAnos(nascimento: Date | string | undefined, agora: Date): number | null {
  if (!nascimento) return null
  const n = new Date(nascimento)
  if (!Number.isFinite(n.getTime())) return null
  let idade = agora.getUTCFullYear() - n.getUTCFullYear()
  const mes = agora.getUTCMonth() - n.getUTCMonth()
  if (mes < 0 || (mes === 0 && agora.getUTCDate() < n.getUTCDate())) idade--
  return idade
}

/** Campos do /profile que um requisito pode abrir direto (com o formulário já em edição). */
export type CampoDoPerfil = 'email' | 'dados' | 'cpf' | 'fullName' | 'dateOfBirth'

export function linkDoPerfil(campo: CampoDoPerfil): string {
  return `/profile?tab=config&campo=${campo}`
}

/**
 * Leva junto o caminho de volta (`voltar`) para o /profile mostrar o atalho
 * "Voltar para as Monitorias" depois de salvar. Só caminhos das Monitorias:
 * o /profile recusa qualquer outro (nada de redirecionamento aberto).
 */
export function comVolta(href: string, voltar: string): string {
  if (!href.startsWith('/profile') || !voltarValido(voltar)) return href
  return `${href}${href.includes('?') ? '&' : '?'}voltar=${encodeURIComponent(voltar)}`
}

export function voltarValido(voltar: string | null | undefined): voltar is string {
  return !!voltar && /^\/monitorias(\/[\w\-/]*)?(#[\w-]*)?$/.test(voltar) && !voltar.includes('//')
}

function base(user: UsuarioRequisitos): ItemRequisito[] {
  const faltando = getMissingProfileFields(user)
  return [
    {
      chave: 'email',
      rotulo: 'E-mail verificado',
      ok: !!user.emailVerified,
      acao: { texto: 'Verificar e-mail', href: linkDoPerfil('email') },
    },
    {
      chave: 'perfil',
      rotulo: faltando.length ? `Perfil completo (falta: ${faltando.map((f) => f.label).join(', ')})` : 'Perfil completo',
      ok: faltando.length === 0,
      acao: { texto: 'Completar perfil', href: linkDoPerfil('dados') },
    },
    {
      chave: 'cpf',
      rotulo: 'CPF válido',
      ok: !!user.cpf && isValidCpf(user.cpf),
      acao: { texto: 'Informar CPF', href: linkDoPerfil('cpf') },
    },
    {
      chave: 'nome',
      rotulo: 'Nome completo (como no documento)',
      ok: validarNomeCivil(user.fullName) === null,
      acao: { texto: 'Informar nome completo', href: linkDoPerfil('fullName') },
    },
  ]
}

/** Requisitos para ANUNCIAR monitoria. */
export function requisitosDoMonitor(input: {
  user: UsuarioRequisitos
  tutor: Pick<Tutor, 'avatar' | 'pix' | 'status'> | null
  termosAceitos: boolean
  /** Só exige a conferência na Receita quando há provedor configurado. */
  exigirCpfReceita: boolean
  agora: Date
}): ItemRequisito[] {
  const { user, tutor, termosAceitos, exigirCpfReceita, agora } = input
  const idade = idadeEmAnos(user.dateOfBirth, agora)
  const itens = base(user)
  if (exigirCpfReceita) {
    itens.push({
      chave: 'cpf_receita',
      rotulo: 'CPF conferido na Receita Federal',
      ok: !!user.cpfVerified,
      acao: { texto: 'Conferir CPF', href: linkDoPerfil('cpf') },
    })
  }
  itens.push(
    {
      chave: 'idade',
      rotulo: 'Maior de 18 anos (data de nascimento no perfil)',
      ok: idade !== null && idade >= 18,
      acao: { texto: 'Informar data de nascimento', href: linkDoPerfil('dateOfBirth') },
    },
    {
      chave: 'foto',
      rotulo: 'Retrato escolhido na galeria',
      ok: !!avatarPorId(tutor?.avatar),
      acao: { texto: 'Escolher foto', href: '/monitorias/painel/perfil' },
    },
    {
      chave: 'pix',
      rotulo: 'Chave PIX para receber',
      ok: !!tutor?.pix,
      acao: { texto: 'Cadastrar chave PIX', href: '/monitorias/painel/perfil' },
    },
    {
      chave: 'termos',
      rotulo: 'Termos de Serviço do Monitor aceitos',
      ok: termosAceitos,
      acao: { texto: 'Ler e aceitar', href: '/monitorias/painel/perfil#termos' },
    },
    {
      chave: 'conta',
      rotulo: 'Conta e perfil de monitor ativos',
      ok: !user.banned && tutor?.status !== 'suspenso',
    },
  )
  return itens
}

/**
 * Requisitos para CONTRATAR monitoria. A maioridade é declarada no aceite dos
 * Termos; se o perfil tem data de nascimento e ela indica menor de 18, bloqueia
 * (menor não contrata sozinho — CC arts. 3º e 4º).
 */
export function requisitosDoAluno(input: { user: UsuarioRequisitos; termosAceitos: boolean; agora?: Date }): ItemRequisito[] {
  const idade = idadeEmAnos(input.user.dateOfBirth, input.agora || new Date())
  return [
    ...base(input.user),
    ...(idade !== null && idade < 18
      ? [
          {
            chave: 'idade',
            rotulo: 'Maior de 18 anos — menores contratam pela conta do responsável legal',
            ok: false,
            acao: { texto: 'Revisar data de nascimento', href: linkDoPerfil('dateOfBirth') },
          },
        ]
      : []),
    {
      chave: 'termos',
      rotulo: 'Termos de Serviço do Aluno aceitos',
      ok: input.termosAceitos,
      acao: { texto: 'Ler e aceitar', href: '/monitorias/termos?papel=aluno' },
    },
    { chave: 'conta', rotulo: 'Conta ativa', ok: !input.user.banned },
  ]
}

export function pendentes(itens: ItemRequisito[]): ItemRequisito[] {
  return itens.filter((i) => !i.ok)
}
