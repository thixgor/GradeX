import { redirect } from 'next/navigation'

/**
 * `/admin/aulas` virou atalho para o painel de estrutura (§4, §45).
 *
 * A gestão de aulas mudou de endereço porque mudou de público: o middleware
 * tranca `/admin/*` em `role === 'admin'`, e quem publica aula no dia a dia é
 * o monitor. O painel novo mora em `/aulas/gerenciar/estrutura`, onde os dois
 * entram.
 *
 * O endereço antigo continua existindo em vez de virar 404: ele está em favorito
 * de gente, em link colado em conversa e no histórico do navegador (§45).
 */
export default function AdminAulasRedirect() {
  redirect('/aulas/gerenciar/estrutura')
}
