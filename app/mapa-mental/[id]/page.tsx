'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Lock, Loader2, GitBranch, ArrowLeft } from 'lucide-react'
import { MindMapEditor, type EditorMap } from '@/components/mindmap/mindmap-editor'

interface Access {
  canView: boolean
  canViewContent: boolean
  canEdit: boolean
  canDelete: boolean
  isOwner: boolean
  isAdmin: boolean
  locked: boolean
}

export default function MindMapEditorPage() {
  const router = useRouter()
  const params = useParams()
  const id = String(params.id)

  const [loading, setLoading] = useState(true)
  const [map, setMap] = useState<EditorMap | null>(null)
  const [access, setAccess] = useState<Access | null>(null)
  const [error, setError] = useState('')
  const [needPassword, setNeedPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/mindmaps/${id}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Mapa não encontrado'); return }
      setAccess(data.access)
      setMap(data.map)
      if (data.access?.locked && !data.access?.canViewContent) {
        setNeedPassword(true)
      }
    } catch {
      setError('Erro ao carregar o mapa')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const unlock = useCallback(async () => {
    setUnlocking(true); setUnlockError('')
    try {
      const res = await fetch(`/api/mindmaps/${id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) { setUnlockError(data.error || 'Senha incorreta'); return }
      setMap(data.map)
      setNeedPassword(false)
      setAccess(a => (a ? { ...a, canViewContent: true, locked: false } : a))
    } catch {
      setUnlockError('Erro ao desbloquear')
    } finally {
      setUnlocking(false)
    }
  }, [id, password])

  if (loading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[#0B1F17] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#2ECC71]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-[#0B1F17] px-6 text-center text-white">
        <GitBranch className="h-12 w-12 text-[#2D5A46]" />
        <p className="text-lg font-semibold">{error}</p>
        <button onClick={() => router.push('/mapa-mental')} className="flex items-center gap-2 rounded-xl bg-[#2ECC71] px-4 py-2 font-semibold text-[#0B1F17]">
          <ArrowLeft className="h-4 w-4" /> Voltar para os mapas
        </button>
      </div>
    )
  }

  if (needPassword) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[#0B1F17] px-6 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-[#2D5A46] bg-[#10261D] p-6 shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-center text-lg font-bold">{map?.title || 'Mapa protegido'}</h1>
          <p className="mt-1 text-center text-sm text-[#C7D5CE]">Este mapa exige uma senha para ser aberto.</p>
          <input
            type="text"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') unlock() }}
            placeholder="Digite a senha"
            className="mt-4 w-full rounded-xl border border-[#2D5A46] bg-[#0B1F17] px-3 py-2.5 text-sm outline-none focus:border-[#2ECC71]"
          />
          {unlockError && <p className="mt-2 text-sm text-red-300">{unlockError}</p>}
          <button onClick={unlock} disabled={unlocking || !password} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2ECC71] px-4 py-2.5 font-semibold text-[#0B1F17] disabled:opacity-50">
            {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Desbloquear
          </button>
          <button onClick={() => router.push('/mapa-mental')} className="mt-3 w-full text-center text-sm text-[#C7D5CE] hover:text-white">
            Voltar
          </button>
        </div>
      </div>
    )
  }

  if (!map || !access) return null

  return (
    <MindMapEditor
      initialMap={map}
      access={{ canEdit: access.canEdit, canDelete: access.canDelete, isOwner: access.isOwner, isAdmin: access.isAdmin }}
      onBack={() => router.push('/mapa-mental')}
    />
  )
}
