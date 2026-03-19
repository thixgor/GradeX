'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PatologiaForm } from '@/components/manual-clinico/patologia-form'
import { AppShell } from '@/components/app-shell'

export default function EditarPatologiaPage() {
  const params = useParams()
  const router = useRouter()
  const [patologia, setPatologia] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/manual-clinico/${params.id}`)
        if (!res.ok) {
          router.push('/admin/manual-clinico')
          return
        }
        setPatologia(await res.json())
      } catch {
        router.push('/admin/manual-clinico')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id, router])

  if (loading) {
    return (
      <AppShell headerTitle="Editar Patologia">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell headerTitle="Editar Patologia" headerSubtitle={patologia?.nome}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PatologiaForm initialData={patologia} editId={params.id as string} />
      </div>
    </AppShell>
  )
}
