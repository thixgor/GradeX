'use client'

import { useEffect, useState } from 'react'
import { useBootstrap } from '@/hooks/use-bootstrap'
import {
  CompleteProfileModal,
  type CompleteProfileValues,
} from '@/components/complete-profile-modal'

/**
 * Decide quando pedir os dados que faltam no perfil.
 *
 * O cadastro é de baixa fricção de propósito (nome, e-mail e senha), então os
 * dados de valor comercial — telefone, estado, instituição, período,
 * especialidade, CRM, hospital, CPF — são coletados aqui, já dentro do app,
 * quando o usuário tem contexto do que ganha em troca. É o clássico
 * progressive profiling: pedir tudo no topo do funil derruba a conversão de
 * cadastro; pedir depois, em passos curtos, não.
 *
 * O modal pode ser adiado ("Agora não" → volta em 3 dias). Adiar é melhor que
 * bloquear: quem é encurralado abandona a conta, e o modal volta sozinho.
 */
export function ProfileCompletionGate() {
  const { profile, isAuthenticated, loading, refetch } = useBootstrap()
  const [dismissed, setDismissed] = useState(false)

  // Uma sessão nova volta a ter direito de ver o modal.
  useEffect(() => {
    if (!isAuthenticated) setDismissed(false)
  }, [isAuthenticated])

  if (loading || !isAuthenticated || !profile || dismissed) return null
  if (profile.missingFields.length === 0) return null

  const snoozedUntil = profile.promptSnoozedUntil ? new Date(profile.promptSnoozedUntil) : null
  if (snoozedUntil && snoozedUntil.getTime() > Date.now()) return null

  const initialValues: CompleteProfileValues = {
    profession: profile.profession || '',
    state: profile.state || '',
    phone: profile.phone || '',
    afyaUnit: profile.afyaUnit || '',
    periodo: profile.periodo ? String(profile.periodo) : '',
    specialty: profile.specialty || '',
    crm: profile.crm || '',
    crmUf: profile.crmUf || '',
    residencySpecialty: profile.residencySpecialty || '',
    residencyHospital: profile.residencyHospital || '',
    residencyYear: profile.residencyYear || '',
    fullName: profile.fullName || '',
  }

  async function handleSave(values: CompleteProfileValues, finish: boolean) {
    try {
      const response = await fetch('/api/user/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, finish }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        return { ok: false, field: data.field, error: data.error }
      }
      return { ok: true, officialName: data.officialName }
    } catch {
      return { ok: false, error: 'Sem conexão. Confira sua internet e tente de novo.' }
    }
  }

  async function handleSnooze() {
    setDismissed(true)
    // O adiamento é conveniência, não segurança: se a chamada falhar, o modal
    // volta na próxima sessão e não há nada a corrigir aqui.
    await fetch('/api/user/complete-profile', { method: 'PUT' }).catch(() => {})
  }

  async function handleDone() {
    setDismissed(true)
    await refetch().catch(() => {})
  }

  return (
    <CompleteProfileModal
      open
      initialValues={initialValues}
      missingFields={profile.missingFields}
      onSave={handleSave}
      onSnooze={handleSnooze}
      onDone={handleDone}
    />
  )
}
