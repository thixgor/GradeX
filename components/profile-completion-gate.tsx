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
 * O modal pode ser adiado ("Agora não" → volta em alguns dias). Adiar é melhor
 * que bloquear: quem é encurralado abandona a conta, e o modal volta sozinho.
 */

/**
 * Marca que o modal já foi dispensado nesta aba.
 *
 * O AppShell é montado por página (não há layout compartilhado), então este
 * componente desmonta e remonta a cada navegação — um `useState` sozinho
 * voltaria a abrir o modal em toda página. E o adiamento gravado no servidor
 * também não basta na hora: o /api/bootstrap é cacheado em memória e em
 * localStorage por 24h, então a resposta antiga (sem o adiamento) continuaria
 * mandando abrir. O sessionStorage cobre exatamente essa janela.
 */
const SNOOZE_KEY = 'da_profile_prompt_dismissed'

/** Espelho em memória: evita ler o sessionStorage a cada render. */
let dismissedThisSession = false

function readDismissed(): boolean {
  if (dismissedThisSession) return true
  if (typeof window === 'undefined') return false
  try {
    dismissedThisSession = window.sessionStorage.getItem(SNOOZE_KEY) === '1'
  } catch {
    // Modo privado/storage bloqueado: cai no estado em memória, que já basta
    // enquanto a aba estiver aberta.
  }
  return dismissedThisSession
}

function markDismissed() {
  dismissedThisSession = true
  try {
    window.sessionStorage.setItem(SNOOZE_KEY, '1')
  } catch {
    /* idem */
  }
}

/** Chamado no logout: a próxima conta tem direito de ver o modal. */
export function resetProfilePromptDismissal() {
  dismissedThisSession = false
  try {
    window.sessionStorage.removeItem(SNOOZE_KEY)
  } catch {
    /* idem */
  }
}

export function ProfileCompletionGate() {
  const { profile, isAuthenticated, loading, refetch } = useBootstrap()
  const [dismissed, setDismissed] = useState(() => readDismissed())

  // Uma sessão nova volta a ter direito de ver o modal.
  useEffect(() => {
    if (!isAuthenticated) {
      resetProfilePromptDismissal()
      setDismissed(false)
    }
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
        return { ok: false, field: data.field, error: data.error, needsFullName: data.needsFullName }
      }
      return { ok: true, officialName: data.officialName }
    } catch {
      return { ok: false, error: 'Sem conexão. Confira sua internet e tente de novo.' }
    }
  }

  async function close() {
    markDismissed()
    setDismissed(true)
    // Recarrega o bootstrap para que o cache (memória + localStorage) passe a
    // carregar o estado novo — sem isso, a resposta velha continuaria dizendo
    // que o perfil está pendente até o TTL de 24h expirar.
    await refetch().catch(() => {})
  }

  return (
    <CompleteProfileModal
      open
      initialValues={initialValues}
      missingFields={profile.missingFields}
      onSave={handleSave}
      onSnooze={async () => {
        markDismissed()
        setDismissed(true)
        await fetch('/api/user/complete-profile', { method: 'PUT' }).catch(() => {})
        await refetch().catch(() => {})
      }}
      onDone={close}
    />
  )
}
