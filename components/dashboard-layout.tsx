'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { CreateExamModal } from '@/components/create-exam-modal'
import { BanChecker } from '@/components/ban-checker'
import { SupportChat } from '@/components/support-chat'
import { PageLoading } from '@/components/page-loading'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCreateExamModal, setShowCreateExamModal] = useState(false)
  const [examsRemaining, setExamsRemaining] = useState<number | null>(null)
  const [examsLimit, setExamsLimit] = useState<number | null>(null)
  const [tierLimitExceeded, setTierLimitExceeded] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadTierLimits()
    }
  }, [user])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()
      setUser(data.user)
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadTierLimits() {
    try {
      const res = await fetch('/api/user/tier-limits')
      if (res.ok) {
        const data = await res.json()
        setExamsRemaining(data.examsRemaining)
        setExamsLimit(data.limits.examsPerDay)
        setTierLimitExceeded(data.isAdmin ? false : data.examsRemaining <= 0)
      }
    } catch (error) {
      console.error('Erro ao carregar limites:', error)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
  }

  function handleCreateExam() {
    if (user?.role === 'admin') {
      setShowCreateExamModal(true)
    } else {
      if (tierLimitExceeded) {
        alert(`Você atingiu seu limite de criação de provas.
Faça upgrade para Premium para 10 provas por dia com até 20 questões por prova.

Contato: (21) 99777-0936`)
      } else {
        router.push('/exams/create-personal')
      }
    }
  }

  if (loading) {
    return <PageLoading variant="fullscreen" message="Carregando..." />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <BanChecker />

      {/* Sidebar */}
      <Sidebar
        user={user}
        onCreateExam={handleCreateExam}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        examsRemaining={examsRemaining}
        examsLimit={examsLimit}
        tierLimitExceeded={tierLimitExceeded}
      />

      {/* Main Content Area */}
      <div className="lg:pl-[280px] min-h-screen flex flex-col transition-all duration-300">
        {/* Header */}
        <DashboardHeader
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onCreateExam={handleCreateExam}
          tierLimitExceeded={tierLimitExceeded}
        />

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Create Exam Modal */}
      <CreateExamModal
        open={showCreateExamModal}
        onClose={() => setShowCreateExamModal(false)}
        isAdmin={user?.role === 'admin'}
        tierLimitExceeded={tierLimitExceeded}
      />

      {/* Support Chat */}
      <SupportChat />
    </div>
  )
}
