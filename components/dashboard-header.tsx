'use client'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationsBell } from '@/components/notifications-bell'
import { Logo } from '@/components/logo'
import { Menu, Plus } from 'lucide-react'

interface DashboardHeaderProps {
  user: {
    name: string
    role: 'admin' | 'user'
  } | null
  onMenuClick: () => void
  onCreateExam: () => void
  tierLimitExceeded?: boolean
}

export function DashboardHeader({
  user,
  onMenuClick,
  onCreateExam,
  tierLimitExceeded,
}: DashboardHeaderProps) {
  return (
    <header className="glass sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Menu button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo - only visible on mobile */}
          <div className="lg:hidden">
            <Logo variant="icon" size="sm" />
          </div>

          {/* Page title / greeting */}
          <div className="hidden sm:block">
            <p className="text-sm text-muted-foreground">
              Olá, <span className="font-medium text-foreground">{user?.name}</span>
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Quick create button */}
          <Button
            onClick={onCreateExam}
            disabled={tierLimitExceeded}
            size="sm"
            className="hidden sm:flex bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Prova
          </Button>

          <NotificationsBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
