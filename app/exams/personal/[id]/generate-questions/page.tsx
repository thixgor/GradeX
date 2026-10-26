'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { PageLoading } from '@/components/page-loading'

/**
 * A geração de questões saiu daqui: o fluxo inteiro (temas, IA, Banco,
 * ajustes e progresso) vive em `/exams/create-personal`. A rota fica para
 * links salvos e abas abertas não caírem num 404.
 */
export default function GerarQuestoesRedireciona() {
  const router = useRouter()
  useEffect(() => {
    try {
      sessionStorage.removeItem('pendingExamData')
    } catch {}
    router.replace('/exams/create-personal')
  }, [router])
  return <PageLoading variant="fullscreen" />
}
