import type { IdDoModulo } from '@/lib/manual-clinico/pacote'

/**
 * As portas do Manual Clínico, na ordem em que aparecem na barra e no portal.
 *
 * É a mesma lista do pacote (`lib/manual-clinico/pacote.ts`) vista como
 * navegação: cada porta tem a cor do chip do menu lateral (sidebar-cores), para
 * a pessoa reconhecer o módulo pela cor antes de ler o nome — e o mesmo
 * quadradinho colorido aparece na barra, no portal e no herói de cada módulo.
 */
export interface PortaDoManual {
  id: IdDoModulo | 'estudo'
  nome: string
  /** Rótulo curto para a barra (cabe no celular). */
  curto: string
  href: string
  /** Chave de cor em `components/sidebar-cores.ts`. */
  cor: string
  icone: 'BookOpen' | 'FlaskConical' | 'Pill' | 'Activity' | 'ScanLine' | 'Stethoscope' | 'Microscope' | 'PersonStanding' | 'Sigma' | 'Route'
}

export const PORTAS_DO_MANUAL: PortaDoManual[] = [
  { id: 'manual', nome: 'Patologias', curto: 'Patologias', href: '/manual-clinico', cor: 'manualClinico', icone: 'BookOpen' },
  { id: 'exames', nome: 'Exames Laboratoriais', curto: 'Exames', href: '/manual-clinico/exames-laboratoriais', cor: 'manualExames', icone: 'FlaskConical' },
  { id: 'farmacologia', nome: 'Farmacologia', curto: 'Farmacologia', href: '/manual-clinico/farmacologia', cor: 'farmacologia', icone: 'Pill' },
  { id: 'eletrocardiograma', nome: 'Eletrocardiograma', curto: 'Eletro', href: '/manual-clinico/eletrocardiograma', cor: 'manualEletro', icone: 'Activity' },
  { id: 'radiologia', nome: 'Radiologia', curto: 'Radiologia', href: '/manual-clinico/radiologia', cor: 'manualRadiologia', icone: 'ScanLine' },
  { id: 'semiologia', nome: 'Semiologia', curto: 'Semiologia', href: '/manual-clinico/semiologia', cor: 'manualSemiologia', icone: 'Stethoscope' },
  { id: 'histologia', nome: 'Histologia', curto: 'Histologia', href: '/manual-clinico/histologia', cor: 'manualHistologia', icone: 'Microscope' },
  { id: 'anatomia', nome: 'Domine Anatomia', curto: 'Anatomia', href: '/anatomia', cor: 'anatomia3d', icone: 'PersonStanding' },
  { id: 'ferramentas', nome: 'Ferramentas Clínicas', curto: 'Ferramentas', href: '/manual-clinico/ferramentas', cor: 'ferramentasClinicas', icone: 'Sigma' },
  { id: 'estudo', nome: 'Estudo Integrado', curto: 'Estudo integrado', href: '/manual-clinico/estudo-integrado', cor: 'cronogramas', icone: 'Route' },
]

/** A porta de uma rota: o prefixo mais longo que casa (o portal só na raiz exata). */
export function portaDaRota(pathname: string | null | undefined): PortaDoManual | null {
  if (!pathname) return null
  let melhor: PortaDoManual | null = null
  for (const p of PORTAS_DO_MANUAL) {
    if (p.href === '/manual-clinico') {
      if (pathname === '/manual-clinico') return p
      continue
    }
    if (pathname === p.href || pathname.startsWith(`${p.href}/`)) {
      if (!melhor || p.href.length > melhor.href.length) melhor = p
    }
  }
  // Uma patologia (`/manual-clinico/<slug>`) é da porta Patologias.
  if (!melhor && /^\/manual-clinico\/[^/]+$/.test(pathname) && pathname !== '/manual-clinico/checkout') {
    return PORTAS_DO_MANUAL[0]
  }
  return melhor
}

/**
 * Rotas do Manual que NÃO recebem a barra: os visualizadores de tela cheia
 * (zoom de lâmina, pilha de tomografia, radiografia aberta), que já ocupam a
 * altura inteira e têm a própria navegação, e o checkout.
 */
export function rotaSemBarra(pathname: string): boolean {
  // A Anatomia mora fora de /manual-clinico; só a porta dela (a vitrine/hub)
  // entra no mundo comum — o atlas e o 3D são de tela cheia.
  if (pathname === '/anatomia') return false
  if (!pathname.startsWith('/manual-clinico')) return true
  if (pathname.startsWith('/manual-clinico/checkout')) return true
  if (/\/zoom(\/|$)/.test(pathname) && pathname !== '/manual-clinico/histologia/zoom') return true
  if (/^\/manual-clinico\/radiologia\/tomografia\/(?!casos)[^/]+$/.test(pathname)) return true
  if (/^\/manual-clinico\/radiologia\/raio-x\/(?!casos|quiz|casos-com-apontamentos)[^/]+$/.test(pathname)) return true
  return false
}
