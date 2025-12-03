'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, Plus, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MobileMenuProps {
  onCreatePersonalExam: () => void
  onCreateExam?: () => void
  isAdmin?: boolean
  tierLimitExceeded?: boolean
  personalExamsEnabled?: boolean
  showAulasButton?: boolean
}

export function MobileMenu({
  onCreatePersonalExam,
  onCreateExam,
  isAdmin = false,
  tierLimitExceeded = false,
  personalExamsEnabled = true,
  showAulasButton = false,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleCreatePersonalExam = () => {
    onCreatePersonalExam()
    setOpen(false)
  }

  const handleCreateExam = () => {
    if (onCreateExam) {
      onCreateExam()
    }
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="md:hidden h-8 w-8"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-background border-b shadow-lg md:hidden z-40">
          <div className="flex flex-col gap-2 p-4">
            {showAulasButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push('/aulas')
                  setOpen(false)
                }}
                className="w-full justify-start"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Aulas
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateExam}
                className="w-full justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Prova
              </Button>
            )}
            {personalExamsEnabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreatePersonalExam}
                disabled={tierLimitExceeded}
                className="w-full justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                Prova Pessoal
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
