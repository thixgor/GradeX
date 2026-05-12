"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />
      {/* Content */}
      <div className="relative z-50 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

type DialogContentProps = React.HTMLAttributes<HTMLDivElement>

export function DialogContent({ children, className, ...props }: DialogContentProps) {
  return (
    <div
      className={cn(
        "relative bg-background rounded-lg shadow-2xl border max-w-md w-full mx-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>

export function DialogHeader({ children, className, ...props }: DialogHeaderProps) {
  return (
    <div className={cn("p-6 pb-4", className)} {...props}>
      {children}
    </div>
  )
}

type DialogTitleProps = React.HTMLAttributes<HTMLHeadingElement>

export function DialogTitle({ children, className, ...props }: DialogTitleProps) {
  return (
    <h2 className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </h2>
  )
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  asChild?: boolean
}

export function DialogDescription({ children, className, asChild, ...props }: DialogDescriptionProps) {
  const classes = cn("text-sm text-muted-foreground mt-2", className)

  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      className: cn(classes, children.props.className),
    })
  }

  return (
    <p className={classes} {...props}>
      {children}
    </p>
  )
}

type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>

export function DialogFooter({ children, className, ...props }: DialogFooterProps) {
  return (
    <div className={cn("p-6 pt-4 flex justify-end gap-2", className)} {...props}>
      {children}
    </div>
  )
}
