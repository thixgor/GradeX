'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { PageLoading } from '@/components/page-loading'
import { useBootstrap } from '@/hooks/use-bootstrap'
import { isSidebarSectionClosedFor, type SidebarSectionKey } from '@/lib/sidebar-sections'

/**
 * O portão das seções que o admin pode desligar (Aulas, Banco de Questões,
 * Provas, Cronogramas, Fórum, Games).
 *
 * Ele morava no layout de cada seção, no servidor. Ler o cookie ali tornava
 * TODAS as páginas da seção dinâmicas: cada visita rodava uma função para
 * devolver 60–80 KB de HTML sem compressão — Fast Origin Transfer, cobrado
 * byte a byte — e cada navegação dentro do app outros 35–43 KB de RSC. Tudo
 * isso para entregar um casco igual para todo mundo: o conteúdo das seções
 * sempre veio das APIs, no cliente, e são elas que checam sessão e plano.
 *
 * Agora o casco é estático (sai do CDN, comprimido) e a decisão é tomada aqui,
 * com o mesmo dado: o bootstrap que o AppShell já carrega traz as seções
 * ligadas e o papel de quem está logado — não custa requisição a mais. Quem
 * não tem sessão nem chega a este ponto: o middleware manda para o login.
 *
 * O bootstrap guardado no aparelho pode ter até 24h. Por isso ele só segura a
 * tela; quem manda embora é a resposta fresca (ou a falta dela, se a rede
 * falhar). Assim ninguém é expulso de uma seção que o admin acabou de religar.
 *
 * `livres` são caminhos da seção que nunca passam pelo portão — a verificação
 * pública de certificado, que precisa abrir para quem nem tem conta.
 */
export function PortaoDeSecao({
  secao,
  livres = [],
  children,
}: {
  secao: SidebarSectionKey
  livres?: string[]
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const livre = livres.some((prefixo) => pathname?.startsWith(prefixo))
  const { user, sidebarSections, fresh, error } = useBootstrap({ skip: livre })

  const fechada = !livre && isSidebarSectionClosedFor(user, sidebarSections, secao)
  const confirmada = fechada && (fresh || !!error)

  useEffect(() => {
    if (confirmada) router.replace('/dashboard')
  }, [confirmada, router])

  if (fechada) return <PageLoading variant="fullscreen" message="Redirecionando..." />

  return <>{children}</>
}
