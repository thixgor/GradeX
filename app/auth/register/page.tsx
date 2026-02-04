'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { PageLoading } from '@/components/page-loading'

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/auth/login')
  }, [router])

  return <PageLoading variant="fullscreen" />
}

