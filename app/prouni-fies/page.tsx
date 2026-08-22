import { redirect } from 'next/navigation'

/**
 * As solicitações de desconto vivem em Atendimento, dentro do perfil, junto dos
 * tickets de suporte — são a mesma conversa com a mesma equipe. Este endereço
 * continua existindo porque foi divulgado em e-mails antigos, e leva para lá.
 */
export default function ProuniFiesRedirect() {
  redirect('/profile?tab=atendimento')
}
