import type { ReactNode } from 'react'
import { AdminGateWatcher } from '@/components/admin/admin-gate-watcher'
import { AdminQuickNav } from '@/components/admin/admin-quick-nav'

// Layout passa-direto do painel: não muda a estrutura de nenhuma página, só
// pendura o observador da trava de segurança, o atalho de navegação do painel
// (que também registra os "abertos recentemente") e reforça o noindex.
export const metadata = {
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminGateWatcher />
      {children}
      <AdminQuickNav />
    </>
  )
}
