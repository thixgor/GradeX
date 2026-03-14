'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface CustomCalendarProps {
  value?: string
  onChange: (date: string) => void
  min?: string
  placeholder?: string
}

export function CustomCalendar({ value, onChange, min, placeholder = "Selecione uma data" }: CustomCalendarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  // Track whether we should ignore the next outside click (just opened)
  const justOpenedRef = useRef(false)

  useEffect(() => { setMounted(true) }, [])

  const selectedDate = value ? new Date(value + 'T00:00:00') : null
  const minDate = min ? new Date(min + 'T00:00:00') : null

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (minDate && date < minDate) {
      return true
    }
    return false
  }

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date.toDateString() === selectedDate.toDateString()
  }

  const isToday = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const handleDateSelect = (day: number) => {
    if (!isDateDisabled(day)) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      onChange(formatDate(date))
      setIsOpen(false)
    }
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  // Compute position eagerly (synchronous) so dropdown renders immediately
  const getDropdownPos = useCallback(() => {
    if (!buttonRef.current) return null
    const rect = buttonRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const dropdownHeight = 420
    const spaceBelow = viewportHeight - rect.bottom
    const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight
    const width = Math.max(rect.width, 320)
    // Clamp left so it doesn't overflow viewport
    const left = Math.min(rect.left, viewportWidth - width - 8)

    return {
      top: openAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left: Math.max(8, left),
      width,
      openAbove,
    }
  }, [])

  // Click-outside handler
  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (e: PointerEvent) => {
      // Ignore the very first outside click after opening
      if (justOpenedRef.current) {
        justOpenedRef.current = false
        return
      }
      const target = e.target as Node
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    // Add listener with a generous delay to avoid the opening click from triggering close
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown, true)
    }, 150)

    const onScroll = () => {
      // Force re-render so getDropdownPos picks up new rect
      setCurrentMonth(prev => new Date(prev))
    }

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [isOpen])

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth)

  const renderCalendarDays = () => {
    const days = []

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const disabled = isDateDisabled(day)
      const selected = isDateSelected(day)
      const today = isToday(day)

      days.push(
        <button
          key={day}
          type="button"
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDateSelect(day)
          }}
          disabled={disabled}
          className={`
            h-10 w-full rounded-lg text-sm font-medium transition-all
            ${disabled
              ? 'text-muted-foreground cursor-not-allowed opacity-50'
              : 'hover:bg-primary/10 cursor-pointer'
            }
            ${selected
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : ''
            }
            ${today && !selected
              ? 'border-2 border-primary/50 font-bold'
              : ''
            }
          `}
        >
          {day}
        </button>
      )
    }

    return days
  }

  const handleToggle = () => {
    if (!isOpen) {
      justOpenedRef.current = true
    }
    setIsOpen(prev => !prev)
  }

  // Compute position on every render when open (cheap operation)
  const dropdownPos = isOpen ? getDropdownPos() : null

  const calendarDropdown = isOpen && dropdownPos && (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 99999,
      }}
      className="animate-in fade-in zoom-in-95 duration-200"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Card className="shadow-2xl border-2 dark:border-border/50 dark:bg-card">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onPointerDown={(e) => e.preventDefault()}
              onClick={(e) => { e.stopPropagation(); handlePreviousMonth() }}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center select-none">
              <div className="font-semibold text-lg">
                {monthNames[currentMonth.getMonth()]}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentMonth.getFullYear()}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onPointerDown={(e) => e.preventDefault()}
              onClick={(e) => { e.stopPropagation(); handleNextMonth() }}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground select-none"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>

          {/* Footer */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onPointerDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation()
                const today = new Date()
                if (!minDate || today >= minDate) {
                  onChange(formatDate(today))
                  setIsOpen(false)
                }
              }}
              className="flex-1"
              disabled={!!(minDate && new Date() < minDate)}
            >
              Hoje
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onPointerDown={(e) => e.preventDefault()}
              onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        onClick={handleToggle}
        className="w-full justify-start text-left font-normal h-10 gap-2"
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {formatDisplayDate(value || '')}
      </Button>

      {/* Portal to body so it escapes any overflow:hidden ancestor */}
      {mounted && calendarDropdown && createPortal(calendarDropdown, document.body)}
    </div>
  )
}
