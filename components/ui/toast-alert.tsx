"use client"

import { useEffect } from 'react'
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastAlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  message: string
  type?: 'error' | 'success' | 'info'
  duration?: number
}

export function ToastAlert({
  open,
  onOpenChange,
  title,
  message,
  type = 'error',
  duration = 5000
}: ToastAlertProps) {
  useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [open, duration, onOpenChange])

  if (!open) return null

  const icons = {
    error: <AlertCircle className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />
  }

  const colors = {
    error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
  }

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className={cn(
        "rounded-lg border p-4 shadow-lg max-w-md min-w-[300px]",
        colors[type]
      )}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <div className="flex-1">
            {title && (
              <h3 className="font-semibold mb-1">{title}</h3>
            )}
            <p className="text-sm">{message}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
