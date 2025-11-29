import React from 'react'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export function GlassCard({ 
  children, 
  className = '', 
  variant = 'md',
  onClick 
}: GlassCardProps) {
  const variantClasses = {
    sm: 'glass-sm',
    md: 'glass',
    lg: 'glass-lg',
  }

  return (
    <div
      onClick={onClick}
      className={`${variantClasses[variant]} rounded-2xl p-6 smooth-transition ${className}`}
    >
      {children}
    </div>
  )
}
