'use client'

import { PatologiaForm } from '@/components/manual-clinico/patologia-form'
import { AppShell } from '@/components/app-shell'

export default function NovaPatologiaPage() {
  return (
    <AppShell headerTitle="Nova Patologia" headerSubtitle="Cadastro manual">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PatologiaForm />
      </div>
    </AppShell>
  )
}
